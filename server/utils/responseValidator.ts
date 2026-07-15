import type {
  StructuredResponse, ChapterBreakdownResponse, ValidationResult,
  GeneralQaResponse, MoralQuestionResponse, ComparisonResponse,
} from '../types'

/**
 * Maximum length of a verbatim scripture-like quoted string before we flag it.
 * The system prompt forbids any verbatim scripture. This regex catches
 * suspiciously long quoted substrings as a safety net.
 */
const MAX_QUOTED_LENGTH = 80

/**
 * Regex: matches a string of 10+ consecutive words inside double quotes.
 * Used to catch verbatim scripture slipping through despite the system prompt rule.
 */
const VERBATIM_SCRIPTURE_REGEX = /".{80,}"/g

/**
 * Validates a structured model response before writing it to passage_cache.
 *
 * Rules (must ALL pass to be cacheable):
 * 1. context is present and non-empty
 * 2. traditions array has at least 2 items
 * 3. Each tradition has a non-empty position
 * 4. Each tradition has at least 1 key_text
 * 5. No verbatim quoted scripture string longer than MAX_QUOTED_LENGTH chars
 *
 * On failure: the response is still returned to the user (best-effort),
 * but NOT written to cache. Failures are logged server-side.
 */
export function validateModelResponse(response: StructuredResponse): ValidationResult {
  const errors: string[] = []

  // Rule 1: context
  if (!response.context || response.context.trim().length === 0) {
    errors.push('Missing or empty context field')
  }

  // Rule 2: minimum 2 traditions
  if (!Array.isArray(response.traditions) || response.traditions.length < 2) {
    errors.push(
      `Expected at least 2 traditions, got ${response.traditions?.length ?? 0}`,
    )
  } else {
    // Rule 3 & 4: validate each tradition
    response.traditions.forEach((tradition, i) => {
      const label = `Tradition[${i}] "${tradition.name ?? 'unnamed'}"`

      if (!tradition.position || tradition.position.trim().length === 0) {
        errors.push(`${label}: missing or empty position`)
      }

      if (!Array.isArray(tradition.key_texts) || tradition.key_texts.length === 0) {
        errors.push(`${label}: key_texts must be a non-empty array`)
      } else {
        // Each key_text should not be a long quoted phrase
        tradition.key_texts.forEach((kt, j) => {
          if (typeof kt !== 'string' || kt.trim().length === 0) {
            errors.push(`${label}: key_texts[${j}] is empty or invalid`)
          }
        })
      }
    })
  }

  // Rule 5: verbatim scripture scan across the entire serialized response
  const serialized = JSON.stringify(response)
  const verbatimMatches = serialized.match(VERBATIM_SCRIPTURE_REGEX)
  if (verbatimMatches && verbatimMatches.length > 0) {
    errors.push(
      `Detected ${verbatimMatches.length} potentially verbatim scripture quote(s) exceeding ${MAX_QUOTED_LENGTH} chars. Cache write suppressed.`,
    )
    console.warn('[ResponseValidator] Verbatim scripture detected:', verbatimMatches.map((m) => m.slice(0, 100)))
  }

  if (errors.length > 0) {
    console.warn('[ResponseValidator] Validation failed:', errors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates a chapter breakdown response before writing it to passage_cache.
 *
 * Rules:
 * 1. verses array is present and non-empty
 * 2. Each verse has a numeric verse number and non-empty explanation
 * 3. chapterSummary, aboutGod, aboutAuthor, modernApplication are all non-empty
 * 4. No verbatim quoted scripture string longer than MAX_QUOTED_LENGTH chars
 */
export function validateChapterBreakdownResponse(response: ChapterBreakdownResponse): ValidationResult {
  const errors: string[] = []

  // Rule 1: verses array
  if (!Array.isArray(response.verses) || response.verses.length === 0) {
    errors.push('verses must be a non-empty array')
  } else {
    // Rule 2: each verse entry
    response.verses.forEach((v, i) => {
      if (typeof v.verse !== 'number') {
        errors.push(`verses[${i}]: verse must be a number`)
      }
      if (!v.explanation || v.explanation.trim().length === 0) {
        errors.push(`verses[${i}]: explanation is missing or empty`)
      }
    })
  }

  // Rule 3: summary sections
  const requiredFields: (keyof ChapterBreakdownResponse)[] = [
    'chapterTheme',
    'chapterSummary',
    'aboutGod',
    'aboutAuthor',
    'modernApplication',
  ]
  for (const field of requiredFields) {
    const val = response[field]
    if (typeof val !== 'string' || val.trim().length === 0) {
      errors.push(`${field} is missing or empty`)
    }
  }

  // Rule 4: verbatim scripture scan
  const serialized = JSON.stringify(response)
  const verbatimMatches = serialized.match(VERBATIM_SCRIPTURE_REGEX)
  if (verbatimMatches && verbatimMatches.length > 0) {
    errors.push(
      `Detected ${verbatimMatches.length} potentially verbatim scripture quote(s) exceeding ${MAX_QUOTED_LENGTH} chars. Cache write suppressed.`,
    )
    console.warn('[ResponseValidator] Verbatim scripture detected:', verbatimMatches.map((m) => m.slice(0, 100)))
  }

  if (errors.length > 0) {
    console.warn('[ResponseValidator] Chapter validation failed:', errors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates a general_qa response before writing it to passage_cache.
 * Rules:
 * 1. context is present and non-empty
 * 2. traditions array has at least 2 items
 * 3. each tradition has non-empty position and at least 1 key_text
 * 4. each key_text is a single reference (heuristic: flag strings with 3+ digit-letter patterns without separators)
 * 5. divergenceNote is present
 * 6. No verbatim quoted scripture string longer than MAX_QUOTED_LENGTH chars
 */
export function validateGeneralQaResponse(response: GeneralQaResponse): ValidationResult {
  const errors: string[] = []

  // Rule 1: context
  if (!response.context || response.context.trim().length === 0) {
    errors.push('Missing or empty context field')
  }

  // Rule 2: minimum 2 traditions
  if (!Array.isArray(response.traditions) || response.traditions.length < 2) {
    errors.push(`Expected at least 2 traditions, got ${response.traditions?.length ?? 0}`)
  } else {
    // Rule 3 & 4: validate each tradition
    response.traditions.forEach((t, i) => {
      if (!t.position || t.position.trim().length === 0) {
        errors.push(`traditions[${i}]: missing or empty position`)
      }
      if (!Array.isArray(t.key_texts) || t.key_texts.length === 0) {
        errors.push(`traditions[${i}]: key_texts must be non-empty array`)
      } else {
        t.key_texts.forEach((kt, j) => {
          if (typeof kt !== 'string' || kt.trim().length === 0) {
            errors.push(`traditions[${i}].key_texts[${j}]: empty or invalid`)
          } else if (/[A-Za-z]\d+:\d+[A-Za-z]/.test(kt) || kt.split(/\d+:\d+/).length > 3) {
            // Heuristic: multiple verse refs concatenated without separator
            errors.push(`traditions[${i}].key_texts[${j}]: appears to contain multiple references in one string: "${kt.slice(0, 60)}"`)
          }
        })
      }
    })
  }

  // Rule 5: divergenceNote
  if (!response.divergenceNote || response.divergenceNote.trim().length === 0) {
    errors.push('Missing or empty divergenceNote')
  }

  // Rule 6: verbatim scripture scan
  const serialized = JSON.stringify(response)
  const verbatimMatches = serialized.match(VERBATIM_SCRIPTURE_REGEX)
  if (verbatimMatches && verbatimMatches.length > 0) {
    errors.push(`Detected ${verbatimMatches.length} potentially verbatim scripture quote(s). Cache write suppressed.`)
    console.warn('[ResponseValidator] Verbatim scripture detected:', verbatimMatches.map((m) => m.slice(0, 100)))
  }

  if (errors.length > 0) {
    console.warn('[ResponseValidator] GeneralQA validation failed:', errors)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a moral_question response before writing it to passage_cache.
 * Rules:
 * 1. context is present and non-empty
 * 2. traditions array has at least 2 items, each with position and key_texts
 * 3. scripturalConsiderations is a non-empty array
 * 4. divergenceNote is present
 * 5. Heuristic: no direct yes/no verdict at response opening
 * 6. No verbatim quoted scripture
 */
export function validateMoralQuestionResponse(response: MoralQuestionResponse): ValidationResult {
  const errors: string[] = []

  // Rule 1: context
  if (!response.context || response.context.trim().length === 0) {
    errors.push('Missing or empty context field')
  }

  // Rule 2: minimum 2 traditions
  if (!Array.isArray(response.traditions) || response.traditions.length < 2) {
    errors.push(`Expected at least 2 traditions, got ${response.traditions?.length ?? 0}`)
  } else {
    response.traditions.forEach((t, i) => {
      if (!t.position || t.position.trim().length === 0) {
        errors.push(`traditions[${i}]: missing or empty position`)
      }
      if (!Array.isArray(t.key_texts) || t.key_texts.length === 0) {
        errors.push(`traditions[${i}]: key_texts must be non-empty array`)
      } else {
        t.key_texts.forEach((kt, j) => {
          if (typeof kt !== 'string' || kt.trim().length === 0) {
            errors.push(`traditions[${i}].key_texts[${j}]: empty or invalid`)
          } else if (/[A-Za-z]\d+:\d+[A-Za-z]/.test(kt) || kt.split(/\d+:\d+/).length > 3) {
            errors.push(`traditions[${i}].key_texts[${j}]: appears to contain multiple references in one string: "${kt.slice(0, 60)}"`)
          }
        })
      }
    })
  }

  // Rule 3: scripturalConsiderations
  if (!Array.isArray(response.scripturalConsiderations) || response.scripturalConsiderations.length === 0) {
    errors.push('scripturalConsiderations must be a non-empty array')
  }

  // Rule 4: divergenceNote
  if (!response.divergenceNote || response.divergenceNote.trim().length === 0) {
    errors.push('Missing or empty divergenceNote')
  }

  // Rule 5: heuristic yes/no verdict check
  const firstTraditionPosition = response.traditions?.[0]?.position?.trim() ?? ''
  if (/^(yes|no)[.,!\s]/i.test(firstTraditionPosition) || /^(yes|no)[.,!\s]/i.test(response.divergenceNote ?? '')) {
    console.warn('[MoralQuestionValidator] Direct yes/no verdict language detected:', {
      firstPosition: firstTraditionPosition.slice(0, 50),
    })
    errors.push('Response appears to start with a direct yes/no verdict')
  }

  // Rule 6: verbatim scripture scan
  const serialized = JSON.stringify(response)
  const verbatimMatches = serialized.match(VERBATIM_SCRIPTURE_REGEX)
  if (verbatimMatches && verbatimMatches.length > 0) {
    errors.push(`Detected ${verbatimMatches.length} potentially verbatim scripture quote(s). Cache write suppressed.`)
    console.warn('[ResponseValidator] Verbatim scripture detected:', verbatimMatches.map((m) => m.slice(0, 100)))
  }

  if (errors.length > 0) {
    console.warn('[ResponseValidator] MoralQuestion validation failed:', errors)
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates a comparison response before writing it to passage_cache.
 * Rules:
 * 1. similarities and differences arrays both non-empty
 */
export function validateComparisonResponse(response: ComparisonResponse): ValidationResult {
  const errors: string[] = []

  if (!Array.isArray(response.similarities) || response.similarities.length === 0) {
    errors.push('similarities must be a non-empty array')
  }

  if (!Array.isArray(response.differences) || response.differences.length === 0) {
    errors.push('differences must be a non-empty array')
  }

  return { valid: errors.length === 0, errors }
}

