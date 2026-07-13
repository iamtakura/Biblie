import type { SupabaseClient } from '@supabase/supabase-js'
import type { RateLimitStatus, ProfileRow } from '../types'
import { apiError } from './errorResponse'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * Reads the user's profile, resets the daily counter if 24h have elapsed,
 * and checks if the user is under their daily limit.
 *
 * Does NOT increment — call incrementRateLimitCount() separately after a
 * successful live model call.
 *
 * Throws 429 if the limit is reached.
 */
export async function checkRateLimit(
  userId: string,
  serviceClient: SupabaseClient,
): Promise<RateLimitStatus> {
  const config = useRuntimeConfig()
  const maxRequests = config.maxDailyRequests as number

  // Fetch the profile
  const { data: profile, error } = await serviceClient
    .from('profiles')
    .select('id, daily_request_count, daily_reset_at')
    .eq('id', userId)
    .single<ProfileRow>()

  if (error || !profile) {
    apiError(500, 'profile_error', 'Could not load user profile for rate limiting.')
  }

  const now = new Date()
  let count = profile!.daily_request_count
  let resetAt = profile!.daily_reset_at ? new Date(profile!.daily_reset_at) : now

  // Check if 24h window has elapsed → reset
  const windowExpired =
    !profile!.daily_reset_at ||
    now.getTime() - resetAt.getTime() >= TWENTY_FOUR_HOURS_MS

  if (windowExpired) {
    const newResetAt = now.toISOString()
    const { error: resetError } = await serviceClient
      .from('profiles')
      .update({ daily_request_count: 0, daily_reset_at: newResetAt })
      .eq('id', userId)

    if (resetError) {
      console.error('[RateLimit] Failed to reset count:', resetError)
      // Non-fatal — continue with current count
    } else {
      count = 0
      resetAt = now
    }
  }

  const remaining = Math.max(0, maxRequests - count)
  const resetAtIso = new Date(resetAt.getTime() + TWENTY_FOUR_HOURS_MS).toISOString()

  if (count >= maxRequests) {
    // Throw 429 with structured body
    throw Object.assign(
      new Error('Daily request limit reached'),
      {
        statusCode: 429,
        data: {
          error: 'daily_limit_reached',
          message: `You have used all ${maxRequests} daily requests. Limit resets at ${resetAtIso}.`,
          resetAt: resetAtIso,
        },
      },
    )
  }

  return { allowed: true, count, resetAt: resetAtIso, remaining }
}

/**
 * Increments the user's daily_request_count by 1.
 * Call this ONLY after a successful live model call (cache misses + application mode).
 */
export async function incrementRateLimitCount(
  userId: string,
  serviceClient: SupabaseClient,
): Promise<void> {
  const { error } = await serviceClient.rpc('increment_daily_count', {
    user_id: userId,
  })

  if (error) {
    // Use a raw update as fallback if RPC doesn't exist
    console.warn('[RateLimit] RPC failed, falling back to select+update:', error.message)

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('daily_request_count')
      .eq('id', userId)
      .single<Pick<ProfileRow, 'daily_request_count'>>()

    if (profile) {
      await serviceClient
        .from('profiles')
        .update({ daily_request_count: (profile.daily_request_count ?? 0) + 1 })
        .eq('id', userId)
    }
  }
}
