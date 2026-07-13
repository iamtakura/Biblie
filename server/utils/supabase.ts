import { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { H3Event } from 'h3'
import { apiError } from './errorResponse'

// Re-export for convenience so other modules import from one place
export { serverSupabaseUser, serverSupabaseClient, serverSupabaseServiceRole }

/**
 * Asserts that the request has a valid Supabase session.
 * Throws 401 if not authenticated.
 * Returns the authenticated user object.
 */
export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    apiError(401, 'unauthorized', 'A valid session is required.')
  }
  return user!
}
