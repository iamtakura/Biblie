import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../utils/errorResponse'
import type { ProfileRow } from '../types'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * GET /api/usage
 * Returns the authenticated user's current rate limit status.
 * Used by the frontend to display a usage meter.
 */
export default defineEventHandler(
  safeHandler(async (event) => {
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }

    const config = useRuntimeConfig()
    const maxRequests = config.maxDailyRequests as number
    const serviceClient = serverSupabaseServiceRole(event)

    const userId = user!.id ?? (user as any).sub
    console.error('[usage] userId being queried:', userId)

    const { data: profile, error } = await serviceClient
      .from('profiles')
      .select('id, daily_request_count, daily_reset_at, created_at, has_seen_command_intro')
      .eq('id', userId)
      .single<ProfileRow>()

    if (error || !profile) {
      console.error('[usage] Could not fetch profile:', error)
      apiError(500, 'profile_error', 'Could not retrieve usage information.')
    }

    const now = new Date()
    const resetAt = profile!.daily_reset_at ? new Date(profile!.daily_reset_at) : now
    const windowExpired =
      !profile!.daily_reset_at ||
      now.getTime() - resetAt.getTime() >= TWENTY_FOUR_HOURS_MS

    const count = windowExpired ? 0 : profile!.daily_request_count
    const nextReset = new Date(
      windowExpired ? now.getTime() + TWENTY_FOUR_HOURS_MS : resetAt.getTime() + TWENTY_FOUR_HOURS_MS,
    ).toISOString()

    return {
      daily_request_count: count,
      max_daily_requests: maxRequests,
      remaining: Math.max(0, maxRequests - count),
      daily_reset_at: nextReset,
      window_expired: windowExpired,
      has_seen_command_intro: profile!.has_seen_command_intro ?? false,
    }
  }),
)
