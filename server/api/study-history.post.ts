import { defineEventHandler, readBody } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../utils/errorResponse'

interface SaveHistoryBody {
  passage_cache_id: string
  personal_note?: string
}

/**
 * POST /api/study-history
 * Saves a passage to the authenticated user's study history.
 *
 * Body:
 *   passage_cache_id  — must reference an existing passage_cache row
 *   personal_note     — optional free-text annotation
 */
export default defineEventHandler(
  safeHandler(async (event) => {
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }

    const body = await readBody<SaveHistoryBody>(event)

    if (!body?.passage_cache_id || typeof body.passage_cache_id !== 'string') {
      apiError(400, 'invalid_request', 'passage_cache_id is required.')
    }

    if (body?.personal_note !== undefined && typeof body.personal_note !== 'string') {
      apiError(400, 'invalid_request', 'personal_note must be a string if provided.')
    }

    const serviceClient = serverSupabaseServiceRole(event)

    // Validate that the passage_cache_id exists
    const { data: cacheRow, error: lookupError } = await serviceClient
      .from('passage_cache')
      .select('id')
      .eq('id', body!.passage_cache_id)
      .single<{ id: string }>()

    if (lookupError || !cacheRow) {
      apiError(404, 'not_found', 'The specified passage_cache_id does not exist.')
    }

    // Insert history record
    const { data: inserted, error: insertError } = await serviceClient
      .from('study_history')
      .insert({
        user_id: user!.id ?? (user as any).sub,
        passage_cache_id: body!.passage_cache_id,
        personal_note: body?.personal_note ?? null,
      })
      .select('id, user_id, passage_cache_id, saved_at, personal_note')
      .single()

    if (insertError) {
      console.error('[study-history POST] Insert error:', insertError)
      apiError(500, 'database_error', 'Could not save to study history.')
    }

    return { item: inserted }
  }),
)
