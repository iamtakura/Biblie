import { defineEventHandler, readBody } from 'h3'
import crypto from 'crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { apiError, safeHandler } from '../utils/errorResponse'
import { normalizePassageRef, getDisplayTitleFromSlug } from '../utils/passageNormalizer'
import { isPersonalQuestion, classifyCategory } from '../utils/categoryClassifier'
import { checkRateLimit, incrementRateLimitCount } from '../utils/rateLimit'
import { getOrCreateSession, logSessionQuery } from '../utils/sessionLogger'
import { callWithFallback } from '../utils/modelRouter'
import { classifyQueryMode } from '../utils/modeRouter'
import {
  validateModelResponse,
  validateChapterBreakdownResponse,
  validateGeneralQaResponse,
  validateMoralQuestionResponse,
  validateComparisonResponse,
} from '../utils/responseValidator'
import {
  SYSTEM_PROMPT,
  APPLICATION_SYSTEM_PROMPT,
  CHAPTER_BREAKDOWN_SYSTEM_PROMPT,
  GENERAL_QA_SYSTEM_PROMPT,
  MORAL_QUESTION_SYSTEM_PROMPT,
  COMPARISON_SYSTEM_PROMPT,
} from '../utils/systemPrompt'
import type {
  AskRequestBody, AskResponse, ChapterAskResponse,
  PassageCacheRow, StructuredResponse, ChapterBreakdownResponse,
  GeneralQaResponse, MoralQuestionResponse, ComparisonResponse,
  GeneralQaAskResponse, MoralQuestionAskResponse, ComparisonAskResponse,
} from '../types'

const ALLOWED_MODES = [
  'interpretive',
  'application',
  'chapter_breakdown',
  'general_qa',
  'moral_question',
  'comparison',
  'auto',
]

/**
 * Computes a cache key for text-based queries.
 */
function computeQueryCacheKey(modePrefix: string, rawText: string): string {
  const normalized = rawText.trim().toLowerCase()
  return crypto.createHash('sha256').update(`${modePrefix}:${normalized}`).digest('hex').slice(0, 32)
}

/**
 * Computes a cache key for comparison queries by sorting compared items if identifiable.
 */
function computeComparisonCacheKey(query: string): string {
  const vsMatch = query.match(/^(.+?)\s+(?:vs\.?|versus|and|compared\s+to|with)\s+(.+)$/i)
  if (vsMatch) {
    const itemA = vsMatch[1].trim().toLowerCase()
    const itemB = vsMatch[2].trim().toLowerCase()
    const sortedKey = [itemA, itemB].sort().join('__vs__')
    return `comparison:${sortedKey}`
  }
  return computeQueryCacheKey('comparison', query)
}

/**
 * Derives a ≤120-char plain-text summary from an already-generated response.
 * Uses existing fields only — no extra LLM call.
 */
function deriveShortSummary(
  mode: string,
  response: GeneralQaResponse | MoralQuestionResponse | ComparisonResponse | ChapterBreakdownResponse | StructuredResponse,
): string {
  const truncate = (text: string, max = 120): string => {
    if (!text) return ''
    if (text.length <= max) return text
    const cut = text.lastIndexOf(' ', max)
    return (cut > 0 ? text.slice(0, cut) : text.slice(0, max)) + '…'
  }

  if (mode === 'chapter_breakdown') {
    const r = response as ChapterBreakdownResponse
    return r.chapterTheme ? truncate(r.chapterTheme, 120) : truncate(r.chapterSummary, 120)
  }
  if (mode === 'general_qa' || mode === 'moral_question') {
    const r = response as GeneralQaResponse | MoralQuestionResponse
    const firstPosition = r.traditions?.[0]?.position
    return firstPosition ? truncate(firstPosition, 120) : ''
  }
  if (mode === 'comparison') {
    const r = response as ComparisonResponse
    const firstSimilarity = r.similarities?.[0]
    const label = `${r.itemA} vs ${r.itemB}`
    return firstSimilarity ? truncate(`${label}: ${firstSimilarity}`, 120) : truncate(label, 120)
  }
  // interpretive / application
  const r = response as StructuredResponse
  return r.context ? truncate(r.context, 120) : ''
}

export default defineEventHandler(
  safeHandler(async (event) => {
    // ── Auth (injected by middleware) ──────────────────────────────────────────
    const user = event.context.user
    if (!user) {
      apiError(401, 'unauthorized', 'Authentication required.')
    }
    const userId = user!.id ?? (user as any).sub

    // ── Parse & validate request body ─────────────────────────────────────────
    const body = await readBody<AskRequestBody>(event)

    if (!body?.query || typeof body.query !== 'string' || body.query.trim().length === 0) {
      apiError(400, 'invalid_request', 'query is required and must be a non-empty string.')
    }

    if (!body?.mode || !ALLOWED_MODES.includes(body.mode)) {
      apiError(
        400,
        'invalid_request',
        `mode must be one of: ${ALLOWED_MODES.map((m) => `"${m}"`).join(', ')}.`,
      )
    }

    const query = body!.query.trim()
    let mode = body!.mode
    let detectedMode: string | undefined = undefined
    let activeSessionId = body?.session_id || ''

    const config = useRuntimeConfig()
    const promptVersion = config.promptVersion as number
    const serviceClient = serverSupabaseServiceRole(event)

    // ══════════════════════════════════════════════════════════════════════════
    // AUTO-ROUTER
    // If mode is 'auto', classify query via LLM router before handling
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'auto') {
      const routedMode = await classifyQueryMode(query)
      mode = routedMode
      detectedMode = routedMode
    }

    // ══════════════════════════════════════════════════════════════════════════
    // GENERAL QA MODE
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'general_qa') {
      const cacheKey = computeQueryCacheKey('general_qa', query)

      // Cache lookup
      const { data: cached, error: cacheErr } = await serviceClient
        .from('passage_cache')
        .select('id, response_json, source_model')
        .eq('passage_ref', cacheKey)
        .eq('category', 'general_qa')
        .eq('prompt_version', promptVersion)
        .single<Pick<PassageCacheRow, 'id' | 'response_json' | 'source_model'>>()

      if (!cacheErr && cached?.response_json) {
        activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
        await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cached.id, cached.source_model)

        const result: GeneralQaAskResponse = {
          data: cached.response_json as unknown as GeneralQaResponse,
          meta: {
            source_model: cached.source_model,
            from_cache: true,
            cache_key: cacheKey,
            passage_cache_id: cached.id,
            session_id: activeSessionId,
            detected_mode: detectedMode,
          },
        }
        return result
      }

      // Cache miss: rate limit check → call model
      await checkRateLimit(userId, serviceClient)

      const userPrompt = `Question: ${query}\n\nProvide a neutral multi-tradition answer in valid JSON.`
      const { response: modelRes, model } = await callWithFallback(userPrompt, GENERAL_QA_SYSTEM_PROMPT)
      const typedRes = modelRes as GeneralQaResponse

      await incrementRateLimitCount(userId, serviceClient)

      const validation = validateGeneralQaResponse(typedRes)
      let cacheId: string | undefined

      if (validation.valid) {
        const { data: inserted, error: insertError } = await serviceClient
          .from('passage_cache')
          .insert({
            passage_ref: cacheKey,
            category: 'general_qa',
            response_json: typedRes,
            source_model: model,
            prompt_version: promptVersion,
            short_summary: deriveShortSummary('general_qa', typedRes),
          })
          .select('id')
          .single<{ id: string }>()

        if (!insertError) {
          cacheId = inserted?.id
        }
      } else {
        console.warn('[ask] General QA validation failed, cache write suppressed:', validation.errors)
      }

      activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
      await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cacheId, model)

      const result: GeneralQaAskResponse = {
        data: typedRes,
        meta: {
          source_model: model,
          from_cache: false,
          cache_key: cacheKey,
          passage_cache_id: cacheId,
          session_id: activeSessionId,
          detected_mode: detectedMode,
        },
      }
      return result
    }

    // ══════════════════════════════════════════════════════════════════════════
    // MORAL QUESTION MODE
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'moral_question') {
      const cacheKey = computeQueryCacheKey('moral_question', query)

      const { data: cached, error: cacheErr } = await serviceClient
        .from('passage_cache')
        .select('id, response_json, source_model')
        .eq('passage_ref', cacheKey)
        .eq('category', 'moral_question')
        .eq('prompt_version', promptVersion)
        .single<Pick<PassageCacheRow, 'id' | 'response_json' | 'source_model'>>()

      if (!cacheErr && cached?.response_json) {
        activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
        await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cached.id, cached.source_model)

        const result: MoralQuestionAskResponse = {
          data: cached.response_json as unknown as MoralQuestionResponse,
          meta: {
            source_model: cached.source_model,
            from_cache: true,
            cache_key: cacheKey,
            passage_cache_id: cached.id,
            session_id: activeSessionId,
            detected_mode: detectedMode,
          },
        }
        return result
      }

      await checkRateLimit(userId, serviceClient)

      const userPrompt = `Moral/ethical question: ${query}\n\nProvide a multi-tradition analysis in valid JSON without declaring a single yes/no verdict.`
      const { response: modelRes, model } = await callWithFallback(userPrompt, MORAL_QUESTION_SYSTEM_PROMPT)
      const typedRes = modelRes as MoralQuestionResponse

      await incrementRateLimitCount(userId, serviceClient)

      const validation = validateMoralQuestionResponse(typedRes)
      let cacheId: string | undefined

      if (validation.valid) {
        const { data: inserted, error: insertError } = await serviceClient
          .from('passage_cache')
          .insert({
            passage_ref: cacheKey,
            category: 'moral_question',
            response_json: typedRes,
            source_model: model,
            prompt_version: promptVersion,
            short_summary: deriveShortSummary('moral_question', typedRes),
          })
          .select('id')
          .single<{ id: string }>()

        if (!insertError) {
          cacheId = inserted?.id
        }
      } else {
        console.warn('[ask] Moral Question validation failed, cache write suppressed:', validation.errors)
      }

      activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
      await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cacheId, model)

      const result: MoralQuestionAskResponse = {
        data: typedRes,
        meta: {
          source_model: model,
          from_cache: false,
          cache_key: cacheKey,
          passage_cache_id: cacheId,
          session_id: activeSessionId,
          detected_mode: detectedMode,
        },
      }
      return result
    }

    // ══════════════════════════════════════════════════════════════════════════
    // COMPARISON MODE
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'comparison') {
      const cacheKey = computeComparisonCacheKey(query)

      const { data: cached, error: cacheErr } = await serviceClient
        .from('passage_cache')
        .select('id, response_json, source_model')
        .eq('passage_ref', cacheKey)
        .eq('category', 'comparison')
        .eq('prompt_version', promptVersion)
        .single<Pick<PassageCacheRow, 'id' | 'response_json' | 'source_model'>>()

      if (!cacheErr && cached?.response_json) {
        activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
        await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cached.id, cached.source_model)

        const result: ComparisonAskResponse = {
          data: cached.response_json as unknown as ComparisonResponse,
          meta: {
            source_model: cached.source_model,
            from_cache: true,
            cache_key: cacheKey,
            passage_cache_id: cached.id,
            session_id: activeSessionId,
            detected_mode: detectedMode,
          },
        }
        return result
      }

      await checkRateLimit(userId, serviceClient)

      const userPrompt = `Comparison request: ${query}\n\nProvide a structured factual comparison (similarities and differences) in valid JSON.`
      const { response: modelRes, model } = await callWithFallback(userPrompt, COMPARISON_SYSTEM_PROMPT)
      const typedRes = modelRes as ComparisonResponse

      await incrementRateLimitCount(userId, serviceClient)

      const validation = validateComparisonResponse(typedRes)
      let cacheId: string | undefined

      if (validation.valid) {
        const { data: inserted, error: insertError } = await serviceClient
          .from('passage_cache')
          .insert({
            passage_ref: cacheKey,
            category: 'comparison',
            response_json: typedRes,
            source_model: model,
            prompt_version: promptVersion,
            short_summary: deriveShortSummary('comparison', typedRes),
          })
          .select('id')
          .single<{ id: string }>()

        if (!insertError) {
          cacheId = inserted?.id
        }
      } else {
        console.warn('[ask] Comparison validation failed, cache write suppressed:', validation.errors)
      }

      activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
      await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cacheId, model)

      const result: ComparisonAskResponse = {
        data: typedRes,
        meta: {
          source_model: model,
          from_cache: false,
          cache_key: cacheKey,
          passage_cache_id: cacheId,
          session_id: activeSessionId,
          detected_mode: detectedMode,
        },
      }
      return result
    }

    // ══════════════════════════════════════════════════════════════════════════
    // APPLICATION MODE
    // Always live, always counts against rate limit, never cached.
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'application') {
      await checkRateLimit(userId, serviceClient)

      let interpretiveContext: StructuredResponse | null = null
      const passageRef = await normalizePassageRef(query)

      if (passageRef) {
        const category = await classifyCategory(query)
        const { data: cached } = await serviceClient
          .from('passage_cache')
          .select('response_json')
          .eq('passage_ref', passageRef)
          .eq('category', category)
          .eq('prompt_version', promptVersion)
          .single<Pick<PassageCacheRow, 'response_json'>>()

        if (cached?.response_json) {
          interpretiveContext = cached.response_json
        }
      }

      const applicationUserPrompt = buildApplicationPrompt(query, interpretiveContext)
      const { response, model } = await callWithFallback(applicationUserPrompt, APPLICATION_SYSTEM_PROMPT)
      const typedResponse = response as StructuredResponse

      await incrementRateLimitCount(userId, serviceClient)

      activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
      await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, undefined, model)

      const result: AskResponse = {
        data: typedResponse,
        meta: {
          source_model: model,
          from_cache: false,
          passage_ref: passageRef ?? undefined,
          display_title: passageRef ? getDisplayTitleFromSlug(passageRef) : undefined,
          session_id: activeSessionId,
          detected_mode: detectedMode,
        },
      }
      return result
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CHAPTER BREAKDOWN MODE
    // Verse-by-verse chapter study. Always cached by chapter slug.
    // ══════════════════════════════════════════════════════════════════════════
    if (mode === 'chapter_breakdown') {
      const rawSlug = await normalizePassageRef(query)
      if (!rawSlug) {
        apiError(
          400,
          'unrecognized_passage',
          'Could not identify a Bible chapter in your query. Please use the format "/interpret Book Chapter" (e.g. "/interpret Psalms 30").',
        )
      }
      const chapterSlug = rawSlug!.replace(/-\d+$/, '')

      const { data: cachedChapter, error: chapterCacheError } = await serviceClient
        .from('passage_cache')
        .select('id, response_json, source_model')
        .eq('passage_ref', chapterSlug)
        .eq('category', 'chapter_breakdown')
        .single<Pick<PassageCacheRow, 'id' | 'response_json' | 'source_model'>>()

      if (!chapterCacheError && cachedChapter?.response_json) {
        activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
        await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cachedChapter.id, cachedChapter.source_model)

        const result: ChapterAskResponse = {
          data: cachedChapter.response_json as unknown as ChapterBreakdownResponse,
          meta: {
            source_model: cachedChapter.source_model,
            from_cache: true,
            passage_ref: chapterSlug,
            display_title: getDisplayTitleFromSlug(chapterSlug),
            passage_cache_id: cachedChapter.id,
            session_id: activeSessionId,
          },
        }
        return result
      }

      await checkRateLimit(userId, serviceClient)

      const chapterUserPrompt = `Produce a complete verse-by-verse study for: ${query}`
      const { response: chapterResponse, model: chapterModel } = await callWithFallback(
        chapterUserPrompt,
        CHAPTER_BREAKDOWN_SYSTEM_PROMPT,
        { maxTokens: 8192 },
      )
      const typedChapterResponse = chapterResponse as ChapterBreakdownResponse

      await incrementRateLimitCount(userId, serviceClient)

      const chapterValidation = validateChapterBreakdownResponse(typedChapterResponse)
      let chapterCacheId: string | undefined

      if (chapterValidation.valid) {
        const { data: inserted, error: insertError } = await serviceClient
          .from('passage_cache')
          .insert({
            passage_ref: chapterSlug,
            category: 'chapter_breakdown',
            response_json: typedChapterResponse,
            source_model: chapterModel,
            prompt_version: promptVersion,
            short_summary: deriveShortSummary('chapter_breakdown', typedChapterResponse),
          })
          .select('id')
          .single<{ id: string }>()

        if (!insertError) {
          if (insertError.code !== '23505') {
            console.error('[ask] Chapter cache insert error:', insertError)
          }
        } else {
          chapterCacheId = inserted?.id
        }
      } else {
        console.warn('[ask] Chapter validation failed, cache write suppressed:', {
          chapterSlug,
          errors: chapterValidation.errors,
        })
      }

      activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
      await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, chapterCacheId, chapterModel)

      const result: ChapterAskResponse = {
        data: typedChapterResponse,
        meta: {
          source_model: chapterModel,
          from_cache: false,
          passage_ref: chapterSlug,
          display_title: getDisplayTitleFromSlug(chapterSlug),
          passage_cache_id: chapterCacheId,
          session_id: activeSessionId,
        },
      }
      return result
    }

    // ══════════════════════════════════════════════════════════════════════════
    // INTERPRETIVE MODE
    // ══════════════════════════════════════════════════════════════════════════

    if (isPersonalQuestion(query)) {
      apiError(
        400,
        'use_application_mode',
        'This question appears to be personal/reflective. Please use mode: "application" instead.',
      )
    }

    const passageRef = await normalizePassageRef(query)

    if (!passageRef) {
      apiError(
        400,
        'unrecognized_passage',
        'Could not identify a Bible passage in your query. Please include a specific reference (e.g. "Romans 7:14-25").',
      )
    }

    const category = await classifyCategory(query)

    const { data: cachedRow, error: cacheError } = await serviceClient
      .from('passage_cache')
      .select('id, response_json, source_model')
      .eq('passage_ref', passageRef!)
      .eq('category', category)
      .eq('prompt_version', promptVersion)
      .single<Pick<PassageCacheRow, 'id' | 'response_json' | 'source_model'>>()

    if (!cacheError && cachedRow?.response_json) {
      activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
      await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cachedRow.id, cachedRow.source_model)

      const result: AskResponse = {
        data: cachedRow.response_json,
        meta: {
          source_model: cachedRow.source_model,
          from_cache: true,
          passage_ref: passageRef!,
          display_title: getDisplayTitleFromSlug(passageRef!),
          category,
          passage_cache_id: cachedRow.id,
          session_id: activeSessionId,
          detected_mode: detectedMode,
        },
      }
      return result
    }

    await checkRateLimit(userId, serviceClient)

    const interpretiveUserPrompt = buildInterpretivePrompt(query, passageRef!, category)
    const { response, model } = await callWithFallback(interpretiveUserPrompt, SYSTEM_PROMPT)
    const typedResponse = response as StructuredResponse

    await incrementRateLimitCount(userId, serviceClient)

    const validation = validateModelResponse(typedResponse)
    let cacheId: string | undefined

    if (validation.valid) {
      const { data: inserted, error: insertError } = await serviceClient
        .from('passage_cache')
        .insert({
          passage_ref: passageRef!,
          category,
          response_json: typedResponse,
          source_model: model,
          prompt_version: promptVersion,
          short_summary: deriveShortSummary('interpretive', typedResponse),
        })
        .select('id')
        .single<{ id: string }>()

      if (insertError) {
        if (insertError.code !== '23505') {
          console.error('[ask] Cache insert error:', insertError)
        }
      } else {
        cacheId = inserted?.id
      }
    } else {
      console.warn('[ask] Validation failed, cache write suppressed:', {
        passageRef,
        category,
        errors: validation.errors,
      })
    }

    activeSessionId = await getOrCreateSession(userId, query, serviceClient, activeSessionId)
    await logSessionQuery(activeSessionId, userId, query, mode, serviceClient, cacheId, model)

    const result: AskResponse = {
      data: typedResponse,
      meta: {
        source_model: model,
        from_cache: false,
        passage_ref: passageRef!,
        display_title: getDisplayTitleFromSlug(passageRef!),
        category,
        passage_cache_id: cacheId,
        session_id: activeSessionId,
        detected_mode: detectedMode,
      },
    }
    return result
  }),
)

// ─── Prompt Builders ──────────────────────────────────────────────────────────

function buildInterpretivePrompt(
  query: string,
  passageRef: string,
  category: string,
): string {
  return `Bible study question: ${query}

Passage reference (normalized): ${passageRef}
Question category: ${category}

Please provide a multi-tradition analysis of this passage/question following the theological reference format in your instructions. Return valid JSON only.`
}

function buildApplicationPrompt(
  query: string,
  interpretiveContext: StructuredResponse | null,
): string {
  let prompt = `Personal Bible study question: ${query}\n\n`

  if (interpretiveContext) {
    prompt += `For reference, here is a summary of how various traditions interpret this passage:\n`
    prompt += `Context: ${interpretiveContext.context}\n`
    interpretiveContext.traditions.forEach((t) => {
      prompt += `- ${t.name}: ${t.position}\n`
    })
    prompt += `\nUsing this background, please help the user reflect on the personal application of this passage to their life.\n`
  } else {
    prompt += `Please help the user reflect on the personal application of this passage to their life.\n`
  }

  prompt += `Return valid JSON only.`
  return prompt
}

