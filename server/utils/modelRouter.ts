import type { SourceModel } from '../types'
import { apiError } from './errorResponse'

interface ModelResult {
  response: unknown
  model: SourceModel
}

interface ModelCallOptions {
  maxTokens?: number
}

// ─── Gemini ───────────────────────────────────────────────────────────────────

/**
 * Calls Gemini 2.5 Flash via the Google AI generativelanguage API.
 * Uses system_instruction for the theological prompt.
 * Expects the model to return ONLY valid JSON (enforced by system prompt).
 */
async function callGemini(
  userPrompt: string,
  systemPrompt: string,
  options: ModelCallOptions = {},
): Promise<unknown> {
  const { maxTokens = 4096 } = options

  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey as string

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const response = await $fetch<{
    candidates: Array<{
      content: { parts: Array<{ text: string }> }
      finishReason: string
    }>
  }>(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: maxTokens,
          responseMimeType: 'application/json',
        },
      },
    },
  )

  const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) {
    throw new Error('Gemini returned an empty response')
  }

  return parseModelJson(rawText, 'Gemini')
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

/**
 * Calls Groq's Llama 3.3 70B via its OpenAI-compatible /chat/completions endpoint.
 * Used as fallback when Gemini returns 429 or a quota error.
 */
async function callGroq(
  userPrompt: string,
  systemPrompt: string,
  options: ModelCallOptions = {},
): Promise<unknown> {
  const { maxTokens = 4096 } = options

  const config = useRuntimeConfig()
  const apiKey = config.groqApiKey as string

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const response = await $fetch<{
    choices: Array<{
      message: { content: string }
      finish_reason: string
    }>
  }>('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
      // Instruct Groq to return JSON
      response_format: { type: 'json_object' },
    },
  })

  const rawText = response.choices?.[0]?.message?.content
  if (!rawText) {
    throw new Error('Groq returned an empty response')
  }

  return parseModelJson(rawText, 'Groq')
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────

/**
 * Parses and lightly validates a raw JSON string from the model.
 * Strips markdown code fences if the model added them despite instructions.
 */
function parseModelJson(raw: string, modelName: string): unknown {
  let cleaned = raw.trim()

  // Strip markdown fences if present (defensive — system prompt forbids them)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/```$/, '').trim()
  }

  try {
    const parsed = JSON.parse(cleaned) as unknown
    return parsed
  } catch {
    throw new Error(`${modelName} returned invalid JSON: ${cleaned.slice(0, 200)}`)
  }
}

// ─── Quota/Rate Error Detection ───────────────────────────────────────────────

function isQuotaError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const status = (err as { status?: number; statusCode?: number }).status
    ?? (err as { status?: number; statusCode?: number }).statusCode
  // 429 = rate limit, 503/quota often comes as 429 from Google
  return status === 429
}

// ─── Fallback Router ─────────────────────────────────────────────────────────

/**
 * Attempts Gemini first. On 429/quota error falls back to Groq.
 * If both fail, throws a 503 with a user-friendly message.
 * Always tags the result with which model produced it.
 */
export async function callWithFallback(
  userPrompt: string,
  systemPrompt: string,
  options: ModelCallOptions = {},
): Promise<ModelResult> {
  // ── Try Gemini ──
  try {
    const response = await callGemini(userPrompt, systemPrompt, options)
    return { response, model: 'gemini-2.5-flash' }
  } catch (geminiErr: unknown) {
    if (isQuotaError(geminiErr)) {
      console.warn('[ModelRouter] Gemini quota/rate limit hit, falling back to Groq.')
    } else {
      console.error('[ModelRouter] Gemini error (non-quota):', geminiErr)
      // Non-quota errors still fall back to Groq
    }
  }

  // ── Try Groq ──
  try {
    const response = await callGroq(userPrompt, systemPrompt, options)
    return { response, model: 'groq-llama-3.3-70b-versatile' }
  } catch (groqErr: unknown) {
    console.error('[ModelRouter] Groq also failed:', groqErr)
  }

  // ── Both exhausted ──
  apiError(
    503,
    'service_unavailable',
    'The AI models are temporarily unavailable. Please try again in a few moments.',
  )
}
