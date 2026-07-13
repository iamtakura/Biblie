import type { H3Event } from 'h3'
import { createError } from 'h3'
import type { ApiErrorShape } from '../types'

/**
 * Throws an H3 error with a consistent JSON body shape.
 * Use this instead of createError directly — guarantees the
 * { error, message, details? } envelope on all API routes.
 */
export function apiError(
  statusCode: number,
  error: string,
  message: string,
  details?: unknown,
): never {
  const body: ApiErrorShape = { error, message }
  if (details !== undefined) body.details = details

  throw createError({
    statusCode,
    data: body,
    // Also set message for Nitro's default error serializer
    message,
  })
}

/**
 * Wraps an async route handler so that any unhandled exception
 * is caught and returned as a consistent { error, message } JSON body
 * rather than a raw stack trace.
 */
export function safeHandler<T>(
  handler: (event: H3Event) => Promise<T>,
): (event: H3Event) => Promise<T> {
  return async (event: H3Event) => {
    try {
      return await handler(event)
    } catch (err: unknown) {
      // Re-throw H3 errors directly (they already have the right shape)
      if (
        err &&
        typeof err === 'object' &&
        'statusCode' in err &&
        'data' in err
      ) {
        throw err
      }

      // Log internal errors server-side but never expose stack to client
      console.error('[Biblie] Unhandled route error:', err)

      apiError(500, 'internal_error', 'An unexpected error occurred.')
    }
  }
}
