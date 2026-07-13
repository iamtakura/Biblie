import type { SupabaseClient } from '@supabase/supabase-js'

export async function getOrCreateSession(
  userId: string,
  queryText: string,
  serviceClient: SupabaseClient,
  sessionId?: string,
): Promise<string> {
  try {
    if (sessionId) {
      // Update existing session's updated_at
      const { data, error } = await serviceClient
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', userId)
        .select('id')
        .single<{ id: string }>()

      if (!error && data) {
        return data.id
      }
      console.warn('[sessionLogger] Failed to update session, creating new one.', error)
    }

    // Create new session
    // Title is first 50 chars of query + ellipsis if longer
    let title = queryText.trim()
    if (title.length > 50) {
      title = title.substring(0, 47) + '...'
    }

    const { data, error } = await serviceClient
      .from('chat_sessions')
      .insert({
        user_id: userId,
        title,
      })
      .select('id')
      .single<{ id: string }>()

    if (error || !data) {
      console.error('[sessionLogger] Failed to create new session:', error)
      return sessionId || '' // Fallback, shouldn't happen
    }

    return data.id
  } catch (error) {
    console.error('[sessionLogger] Exception in getOrCreateSession:', error)
    return sessionId || ''
  }
}

export async function logSessionQuery(
  sessionId: string,
  userId: string,
  queryText: string,
  mode: string,
  serviceClient: SupabaseClient,
  cacheId?: string,
  sourceModel?: string,
): Promise<void> {
  if (!sessionId) return // E.g. if creation failed

  try {
    const { error } = await serviceClient
      .from('session_queries')
      .insert({
        session_id: sessionId,
        user_id: userId,
        query_text: queryText,
        mode: mode,
        passage_cache_id: cacheId || null,
        source_model: sourceModel || null,
      })

    if (error) {
      console.error('[sessionLogger] Failed to log session query:', error)
    }
  } catch (error) {
    console.error('[sessionLogger] Exception in logSessionQuery:', error)
  }
}
