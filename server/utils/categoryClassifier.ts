import type { Category } from '../types'
import { CATEGORIES } from '../types'

// ─── Keyword Maps (Tier 1) ────────────────────────────────────────────────────

/**
 * Each category maps to a set of trigger keywords.
 * Matching is case-insensitive; first match wins.
 * Ordered from most-specific to least-specific to reduce false positives.
 */
const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  denominational: [
    'catholic', 'protestant', 'baptist', 'calvinist', 'reformed', 'orthodox',
    'evangelical', 'anglican', 'lutheran', 'methodist', 'pentecostal', 'charismatic',
    'adventist', 'seventh-day', 'jehovah', 'mormon', 'latter-day', 'denomination',
    'church teach', 'tradition teach', 'my church',
  ],
  timing: [
    'when did', 'when was', 'when will', 'timeline', 'date of', 'era', 'period',
    'how long', 'prophecy fulfil', 'prophecy fulfill', 'fulfilled when',
    'historically when', 'what year', 'chronolog', 'sequence of events',
  ],
  historical_context: [
    'historical', 'history', 'original context', 'cultural', 'culture',
    'roman empire', 'jewish', 'greek', 'hebrew culture', 'ancient', 'first century',
    'second temple', 'who wrote', 'who authored', 'audience', 'original readers',
    'background of', 'context of',
  ],
  doctrinal: [
    'doctrine', 'theology', 'theological', 'belief', 'teach about',
    'salvation', 'grace', 'justification', 'sanctification', 'atonement',
    'trinity', 'predestination', 'free will', 'baptism', 'eucharist',
    'heaven', 'hell', 'resurrection', 'eschatology', 'sin', 'redemption',
    'what does the bible teach', 'biblical teaching',
  ],
  interpretation: [
    'mean', 'means', 'interpret', 'interpretation', 'explain', 'explanation',
    'understand', 'understanding', 'what is', 'what does', 'significance',
    'symbolize', 'allegory', 'literal', 'figurative', 'commentary',
    'exegesis', 'what passage', 'purpose of',
  ],
}

/**
 * Personal/application question markers — these queries must NEVER be
 * normalized into a cache key. They require live application-mode handling.
 */
const PERSONAL_KEYWORDS = [
  ' me ', 'my life', 'my situation', 'should i', 'what should i',
  'how do i', 'personal', 'apply to me', 'applicable to me',
  'in my', 'for my', 'help me', 'guide me', 'what can i',
  'am i', 'i am', 'i\'m', "i'm", 'my faith', 'my struggle',
  'my relationship', 'my family', 'my work', 'my marriage',
]

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns true if the query is personal/application-oriented and must
 * never be routed through the interpretive cache pipeline.
 */
export function isPersonalQuestion(query: string): boolean {
  const lower = ` ${query.toLowerCase()} ` // pad so word boundaries work
  return PERSONAL_KEYWORDS.some((kw) => lower.includes(kw))
}

/**
 * Tier 1: keyword-based category classification.
 * Returns the first matching category or null if no match.
 * Iterates categories in a deliberately ordered sequence (most specific first).
 */
function classifyByKeywords(query: string): Category | null {
  const lower = query.toLowerCase()
  const orderedCategories: Category[] = [
    'denominational',
    'timing',
    'historical_context',
    'doctrinal',
    'interpretation', // most general — last resort
  ]

  for (const category of orderedCategories) {
    const keywords = CATEGORY_KEYWORDS[category]
    if (keywords.some((kw) => lower.includes(kw))) {
      return category
    }
  }

  return null
}

/**
 * Tier 2: LLM-based category classification.
 * Called only when keyword matching fails.
 * Uses Gemini Flash with a minimal, cheap prompt.
 */
async function classifyByLLM(query: string): Promise<Category> {
  const config = useRuntimeConfig()
  const apiKey = config.geminiApiKey as string

  const prompt = `Classify the following Bible study question into exactly one of these categories: ${CATEGORIES.join(', ')}.
  
Question: "${query}"

Reply with only the category name, nothing else.`

  try {
    const response = await $fetch<{ candidates: Array<{ content: { parts: Array<{ text: string }> } }> }>(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        body: {
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 20,
          },
        },
      },
    )

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase() ?? ''
    const matched = CATEGORIES.find((c) => raw.includes(c))
    return matched ?? 'interpretation' // safe fallback
  } catch (err) {
    console.warn('[CategoryClassifier] LLM classification failed, defaulting to interpretation:', err)
    return 'interpretation'
  }
}

/**
 * Classifies a query into a passage category.
 * Tier 1: keyword match (fast, free).
 * Tier 2: LLM call (only when Tier 1 fails).
 *
 * Never call this for personal questions — check isPersonalQuestion() first.
 */
export async function classifyCategory(query: string): Promise<Category> {
  const keywordResult = classifyByKeywords(query)
  if (keywordResult) {
    return keywordResult
  }

  // Tier 2 fallback
  console.info('[CategoryClassifier] No keyword match, falling back to LLM for query:', query.slice(0, 80))
  return classifyByLLM(query)
}
