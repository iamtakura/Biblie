import { defineEventHandler } from 'h3'

/**
 * GET /api/health
 * Public — no auth required.
 * Used for uptime monitoring and deployment smoke tests.
 */
export default defineEventHandler(() => {
  return {
    status: 'ok',
    service: 'biblie-api',
    timestamp: new Date().toISOString(),
  }
})
