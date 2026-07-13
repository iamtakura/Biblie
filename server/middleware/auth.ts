import { defineEventHandler, getRequestURL, getHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { apiError } from '../utils/errorResponse'

/**
 * Server-side auth middleware.
 * Runs on every request. Checks for a valid Supabase session on all
 * /api/* routes except the public health endpoint.
 *
 * Supports two auth paths:
 * 1. Cookie-based session (browser clients using @nuxtjs/supabase)
 * 2. Bearer token in Authorization header (API testing, non-browser clients)
 *
 * Attaches the authenticated user to event.context.user so route handlers
 * don't need to re-fetch it.
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // Only gate API routes
  if (!path.startsWith('/api/')) return

  // Public routes - no auth required
  const PUBLIC_ROUTES = ['/api/health']
  if (PUBLIC_ROUTES.some((p) => path === p || path.startsWith(p + '/'))) {
    return
  }

  // -- Path 1: Cookie-based session (browser clients) ---
  // serverSupabaseUser in @nuxtjs/supabase v2 reads auth from request cookies.
  let user: import('@supabase/supabase-js').User | null = null

  try {
    const { serverSupabaseUser } = await import('#supabase/server')
    const cookieUser = await serverSupabaseUser(event)
    if (cookieUser) {
      // serverSupabaseUser v2 returns JWT claims (sub, email), not a full User.
      // Normalise it into the shape downstream handlers expect ({ id, email }).
      user = {
        id: (cookieUser as unknown as Record<string, string>).sub ?? '',
        email: (cookieUser as unknown as Record<string, string>).email,
      } as import('@supabase/supabase-js').User
    }
  } catch {
    // Cookie path legitimately fails when there is no browser session.
    // Swallow and fall through to Bearer token path.
  }

  // -- Path 2: Bearer token (API testing / non-browser clients) ---
  if (!user) {
    const authHeader = getHeader(event, 'Authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)

      try {
        const config = useRuntimeConfig(event)
        const supabaseUrl = (config.public.supabase as any)?.url
        const supabaseKey = (config.public.supabase as any)?.key

        if (!supabaseUrl || !supabaseKey) {
          throw new Error(
            `Supabase config missing - url: ${!!supabaseUrl}, key: ${!!supabaseKey}`,
          )
        }

        // Use a plain supabase-js client (not the SSR cookie client) so that
        // getUser() validates the Bearer token against Supabase directly
        // without any cookie session state interfering.
        const client = createClient(supabaseUrl, supabaseKey, {
          auth: {
            detectSessionInUrl: false,
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        const { data, error } = await client.auth.getUser(token)

        if (error) {
          console.error('[auth] Bearer token validation failed:', error.message)
        } else if (data.user) {
          user = data.user
        }
      } catch (err) {
        console.error('[auth] Unexpected error during Bearer token validation:', err)
      }
    }
  }

  // -- Reject unauthenticated requests ---
  if (!user) {
    apiError(401, 'unauthorized', 'A valid session is required to access this endpoint.')
  }

  // Attach to context for downstream route handlers
  event.context.user = user
})