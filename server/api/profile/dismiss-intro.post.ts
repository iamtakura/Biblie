import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../../utils/errorResponse'

/**
 * POST /api/profile/dismiss-intro
 * Sets has_seen_command_intro = true for the authenticated user.
 * Called when the user dismisses the first-time command guide modal.
 */
export default defineEventHandler(
  safeHandler(async (event) => {
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }

    const userId = user!.id ?? (user as any).sub
    const serviceClient = serverSupabaseServiceRole(event)

    const { error } = await serviceClient
      .from('profiles')
      .update({ has_seen_command_intro: true })
      .eq('id', userId)

    if (error) {
      console.error('[dismiss-intro] Update error:', error)
      apiError(500, 'database_error', 'Could not update profile.')
    }

    return { success: true }
  }),
)
