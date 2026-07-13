import type { AllModes } from '../types'

export type RoutableMode = 'general_qa' | 'moral_question' | 'comparison' | 'chapter_breakdown' | 'application'

const VALID_ROUTABLE_MODES: RoutableMode[] = [
  'general_qa',
  'moral_question',
  'comparison',
  'chapter_breakdown',
  'application',
]

/**
 * Classifies an uncommanded user query into one of five categories using Gemini Flash.
 *
 * This call does NOT increment the user's daily rate limit (it's a routing utility call).
 * Falls back to 'general_qa' on failure or unrecognized category.
 */
export async function classifyQueryMode(query: string): Promise<RoutableMode> {
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey as string

  if (!apiKey) {
    console.warn('[ModeRouter] GEMINI_API_KEY missing, defaulting to general_qa')
    return 'general_qa'
  }

  const prompt = `Classify the following user query into exactly one of these categories: general_qa, moral_question, comparison, chapter_breakdown, application. Respond with ONLY the category name, nothing else.

Guidance:
- chapter_breakdown: user wants a full chapter explained verse by verse (rare without explicit /interpret command, but possible if phrased like "explain every verse of X")
- moral_question: user is asking whether something is a sin, wrong, permissible, or morally acceptable
- comparison: user wants two or more things compared (chapters, verses, books, denominations, religions)
- application: user is asking what a passage means for their personal life/situation right now
- general_qa: default — a single scripture-related question that doesn't fit the above

Query: "${query}"`

  const startTime = Date.now()

  try {
    const response = await $fetch<{
      candidates: Array<{
        content: { parts: Array<{ text: string }> }
      }>
    }>(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 10,
          },
        },
      },
    )

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() ?? ''
    const duration = Date.now() - startTime

    const matched = VALID_ROUTABLE_MODES.find((m) => raw === m || raw.includes(m))
    const resultMode = matched ?? 'general_qa'

    console.info(`[ModeRouter] Classified query "${query.slice(0, 50)}..." as [${resultMode}] in ${duration}ms (raw: "${raw}")`)
    return resultMode
  } catch (err) {
    console.warn('[ModeRouter] LLM classification error, defaulting to general_qa:', err)
    return 'general_qa'
  }
}
