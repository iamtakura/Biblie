import type { User, JwtPayload } from '@supabase/supabase-js'

// Auth
export type AuthUser = User | JwtPayload

// Rate limiting
export interface RateLimitStatus {
    allowed: boolean
    count: number
    remaining: number
    resetAt: string
}

// Categories
export type Category =
    | 'interpretation'
    | 'timing'
    | 'denominational'
    | 'doctrinal'
    | 'historical_context'

export type Mode = 'interpretive' | 'application'
export type ExtendedMode = Mode | 'chapter_breakdown'

export type SourceModel = 'gemini-2.5-flash' | 'groq-llama-3.3-70b-versatile'

export const CATEGORIES: Category[] = [
    'interpretation',
    'timing',
    'denominational',
    'doctrinal',
    'historical_context',
]

// Structured LLM response shape
export interface TraditionBlock {
    name: string
    position: string
    key_texts: string[]
    reasoning: string
}

export interface StructuredResponse {
    context: string
    traditions: TraditionBlock[]
    divergenceNote: string
}

// Chapter breakdown response shapes
export interface VerseBreakdown {
    verse: number
    explanation: string
    disputeNote?: string
}

export interface ChapterBreakdownResponse {
    verses: VerseBreakdown[]
    chapterTheme: string
    chapterSummary: string
    aboutGod: string
    aboutAuthor: string
    modernApplication: string
}

// ─── New mode response shapes ─────────────────────────────────────────────────

/** Response for general scripture-related questions (multi-tradition, no passage required). */
export interface GeneralQaResponse {
    question: string
    traditions: TraditionBlock[]
    divergenceNote: string
}

/** Response for moral/ethical questions ("is X a sin?"). Never opens with a yes/no verdict. */
export interface MoralQuestionResponse {
    question: string
    traditions: TraditionBlock[]
    scripturalConsiderations: string[] // relevant verse references across traditions
    divergenceNote: string
}

/** Response comparing two chapters, verses, books, denominations, or religions. */
export interface ComparisonResponse {
    itemA: string
    itemB: string
    similarities: string[]
    differences: string[]
    traditionNotes?: TraditionBlock[] // only present when comparing denominations/religions directly
}

// ─── Mode types ───────────────────────────────────────────────────────────────

/** All routable modes including the three new ones and the 'auto' sentinel. */
export type AllModes = ExtendedMode | 'general_qa' | 'moral_question' | 'comparison' | 'auto'

// Validator result (used by responseValidator.ts)
export interface ValidationResult {
    valid: boolean
    errors: string[]
}

// DB rows
export interface ProfileRow {
    id: string
    created_at: string
    daily_request_count: number
    daily_reset_at: string
    has_seen_command_intro: boolean
}

export interface PassageCacheRow {
    id: string
    passage_ref: string
    category: Category
    response_json: StructuredResponse
    source_model: SourceModel
    prompt_version: number
    created_at: string
    short_summary?: string | null
}

export interface StudyHistoryRow {
    id: string
    user_id: string
    passage_cache_id: string
    saved_at: string
    personal_note: string | null
}

// Session DB rows
export interface ChatSession {
    id: string
    user_id: string
    title: string | null
    created_at: string
    updated_at: string
}

export interface SessionQuery {
    id: string
    session_id: string
    user_id: string
    query_text: string
    mode: string
    passage_cache_id: string | null
    source_model: string | null
    created_at: string
}

export interface SessionDetail extends ChatSession {
    queries: SessionQuery[]
}

// API request/response shapes
export interface AskRequestBody {
    query: string
    mode: AllModes
    session_id?: string
}

export interface BaseAskMeta {
    source_model: SourceModel
    from_cache: boolean
    passage_ref?: string
    display_title?: string
    category?: Category
    passage_cache_id?: string
    session_id?: string
    /** Set when the request was routed via mode: 'auto' — indicates what mode was detected. */
    detected_mode?: string
}

export interface AskResponseMeta extends BaseAskMeta {}

export interface AskResponse {
    data: StructuredResponse
    meta: AskResponseMeta
}

export interface ChapterAskResponseMeta {
    source_model: SourceModel
    from_cache: boolean
    passage_ref?: string
    display_title?: string
    passage_cache_id?: string
    session_id?: string
}

export interface ChapterAskResponse {
    data: ChapterBreakdownResponse
    meta: ChapterAskResponseMeta
}

// ─── New mode API response wrappers ──────────────────────────────────────────

export interface NewModeMeta extends BaseAskMeta {
    cache_key?: string
}

export interface GeneralQaAskResponse {
    data: GeneralQaResponse
    meta: NewModeMeta
}

export interface MoralQuestionAskResponse {
    data: MoralQuestionResponse
    meta: NewModeMeta
}

export interface ComparisonAskResponse {
    data: ComparisonResponse
    meta: NewModeMeta
}

export interface UsageResponse {
    remaining: number
    max_daily_requests: number
    reset_at: string
}

export interface StudyHistorySaveBody {
    passage_cache_id: string
    personal_note?: string
}

export interface ApiErrorShape {
    error: string
    message: string
    details?: unknown
}