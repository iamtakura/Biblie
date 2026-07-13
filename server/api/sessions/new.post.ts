import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../../utils/errorResponse'

export default defineEventHandler(
  safeHandler(async (event) => {
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }

    const serviceClient = serverSupabaseServiceRole(event)

    const { data, error } = await serviceClient
      .from('chat_sessions')
      .insert({
        user_id: user!.id ?? (user as any).sub,
        title: 'New Session', // Optional: leave null or set default
      })
      .select('id')
      .single<{ id: string }>()

    if (error || !data) {
      console.error('[sessions/new POST] Supabase error:', error)
      apiError(500, 'database_error', 'Could not create new session.')
    }

    return { id: data.id }
  }),
)
