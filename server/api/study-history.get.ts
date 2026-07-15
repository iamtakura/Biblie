import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../utils/errorResponse'
import type { StudyHistoryRow } from '../types'
import { getDisplayTitleFromSlug } from '../utils/passageNormalizer'

/**
 * GET /api/study-history
 * Returns the authenticated user's saved passages, newest first.
 * Joins passage_cache so the client gets the full response_json inline.
 */
export default defineEventHandler(
  safeHandler(async (event) => {
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }

    const serviceClient = serverSupabaseServiceRole(event)

    const { data, error } = await serviceClient
      .from('study_history')
      .select(`
        id,
        saved_at,
        personal_note,
        passage_cache_id,
        passage_cache (
          id,
          passage_ref,
          category,
          response_json,
          source_model,
          prompt_version,
          created_at,
          short_summary
        )
      `)
      .eq('user_id', user!.id ?? (user as any).sub)
      .order('saved_at', { ascending: false })
      .returns<StudyHistoryRow[]>()


    if (error) {
      console.error('[study-history GET] Supabase error:', error)
      apiError(500, 'database_error', 'Could not retrieve study history.')
    }

    const items = (data ?? []).map(item => {
      // Cast the join correctly since Supabase typing might be loose
      const pc = item.passage_cache as any
      if (pc && pc.passage_ref) {
        pc.display_title = getDisplayTitleFromSlug(pc.passage_ref)
      }
      return item
    })

    return items
  }),
)
