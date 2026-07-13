import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../utils/errorResponse'
import type { ChatSession } from '../types'

export default defineEventHandler(
  safeHandler(async (event) => {
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }

    const serviceClient = serverSupabaseServiceRole(event)

    const { data, error } = await serviceClient
      .from('chat_sessions')
      .select('id, user_id, title, created_at, updated_at')
      .eq('user_id', user!.id ?? (user as any).sub)
      .order('updated_at', { ascending: false })
      .returns<ChatSession[]>()

    if (error) {
      console.error('[sessions GET] Supabase error:', error)
      apiError(500, 'database_error', 'Could not retrieve sessions.')
    }

    return data ?? []
  }),
)
