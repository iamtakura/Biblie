import { defineEventHandler, getRouterParam } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../../utils/errorResponse'
import type { SessionDetail } from '../../types'

export default defineEventHandler(
  safeHandler(async (event) => {
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }

    const sessionId = getRouterParam(event, 'id')
    if (!sessionId) {
      apiError(400, 'invalid_request', 'Session ID is required.')
    }

    const serviceClient = serverSupabaseServiceRole(event)

    // Fetch session details
    const { data: sessionData, error: sessionError } = await serviceClient
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId!)
      .eq('user_id', user!.id ?? (user as any).sub)
      .single()

    if (sessionError || !sessionData) {
      console.error('[sessions/:id GET] Supabase error:', sessionError)
      apiError(404, 'not_found', 'Session not found or access denied.')
    }

    // Fetch queries for this session
    const { data: queriesData, error: queriesError } = await serviceClient
      .from('session_queries')
      .select('*')
      .eq('session_id', sessionId!)
      .order('created_at', { ascending: true })

    if (queriesError) {
      console.error('[sessions/:id GET] Queries error:', queriesError)
      apiError(500, 'database_error', 'Could not retrieve session queries.')
    }

    const detail: SessionDetail = {
      ...sessionData,
      queries: queriesData ?? [],
    }

    return detail
  }),
)
