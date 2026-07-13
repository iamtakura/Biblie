import { defineStore } from 'pinia'
import type {
  StudyHistoryRow, StructuredResponse, SourceModel, Category, ChapterBreakdownResponse,
  GeneralQaResponse, MoralQuestionResponse, ComparisonResponse, AllModes,
} from '~/../server/types'

export interface CachedPassage {
  id: string
  passage_ref: string
  display_title?: string
  category: Category
  response_json: StructuredResponse
  source_model: SourceModel
}

export interface StudyItem extends StudyHistoryRow {
  passage_cache: CachedPassage
}

export const useStudyStore = defineStore('study', () => {
  const history = ref<StudyItem[]>([])
  const currentPassage = ref<StructuredResponse | null>(null)
  const currentPassageRef = ref<string>('')
  const currentDisplayTitle = ref<string>('')
  const currentCategory = ref<Category | undefined>(undefined)
  const currentCacheId = ref<string | undefined>(undefined)
  const currentSourceModel = ref<string | null>(null)

  // Chapter breakdown state
  const currentChapterBreakdown = ref<ChapterBreakdownResponse | null>(null)
  
  // New modes state
  const currentGeneralQa = ref<GeneralQaResponse | null>(null)
  const currentMoralQuestion = ref<MoralQuestionResponse | null>(null)
  const currentComparison = ref<ComparisonResponse | null>(null)

  const currentResponseMode = ref<AllModes | null>(null)

  const isLoadingHistory = ref(false)
  const error = ref<string | null>(null)

  async function fetchHistory() {
    isLoadingHistory.value = true
    error.value = null
    try {
      const data = await $fetch<StudyItem[]>('/api/study-history')
      history.value = data || []
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to load study history'
    } finally {
      isLoadingHistory.value = false
    }
  }

  async function saveToHistory(passageCacheId: string, personalNote?: string) {
    try {
      const savedItem = await $fetch<StudyItem>('/api/study-history', {
        method: 'POST',
        body: {
          passage_cache_id: passageCacheId,
          personal_note: personalNote,
        },
      })
      // Prepend to history
      history.value = [savedItem, ...history.value]
      return savedItem
    } catch (e: any) {
      throw new Error(e.data?.message || 'Failed to save to study history')
    }
  }

  function setCurrentPassage(
    response: StructuredResponse,
    ref: string,
    displayTitle?: string,
    category?: Category,
    cacheId?: string,
    sourceModel?: string,
  ) {
    clearCurrentPassage()
    currentPassage.value = response
    currentPassageRef.value = ref
    currentDisplayTitle.value = displayTitle || ref
    currentCategory.value = category
    currentCacheId.value = cacheId
    currentSourceModel.value = sourceModel || null
    currentResponseMode.value = 'interpretive'
  }

  function setChapterBreakdown(
    response: ChapterBreakdownResponse,
    passageRef: string,
    displayTitle?: string,
    cacheId?: string,
    sourceModel?: string,
  ) {
    clearCurrentPassage()
    currentChapterBreakdown.value = response
    currentPassageRef.value = passageRef
    currentDisplayTitle.value = displayTitle || passageRef
    currentCacheId.value = cacheId
    currentSourceModel.value = sourceModel || null
    currentResponseMode.value = 'chapter_breakdown'
  }

  function setGeneralQa(
    response: GeneralQaResponse,
    cacheId?: string,
    sourceModel?: string,
  ) {
    clearCurrentPassage()
    currentGeneralQa.value = response
    currentCacheId.value = cacheId
    currentSourceModel.value = sourceModel || null
    currentResponseMode.value = 'general_qa'
  }

  function setMoralQuestion(
    response: MoralQuestionResponse,
    cacheId?: string,
    sourceModel?: string,
  ) {
    clearCurrentPassage()
    currentMoralQuestion.value = response
    currentCacheId.value = cacheId
    currentSourceModel.value = sourceModel || null
    currentResponseMode.value = 'moral_question'
  }

  function setComparison(
    response: ComparisonResponse,
    cacheId?: string,
    sourceModel?: string,
  ) {
    clearCurrentPassage()
    currentComparison.value = response
    currentCacheId.value = cacheId
    currentSourceModel.value = sourceModel || null
    currentResponseMode.value = 'comparison'
  }

  function clearCurrentPassage() {
    currentPassage.value = null
    currentPassageRef.value = ''
    currentDisplayTitle.value = ''
    currentCategory.value = undefined
    currentCacheId.value = undefined
    currentSourceModel.value = null
    currentChapterBreakdown.value = null
    currentGeneralQa.value = null
    currentMoralQuestion.value = null
    currentComparison.value = null
    currentResponseMode.value = null
  }

  return {
    history,
    currentPassage,
    currentPassageRef,
    currentDisplayTitle,
    currentCategory,
    currentCacheId,
    currentSourceModel,
    currentChapterBreakdown,
    currentGeneralQa,
    currentMoralQuestion,
    currentComparison,
    currentResponseMode,
    isLoadingHistory,
    error,
    fetchHistory,
    saveToHistory,
    setCurrentPassage,
    setChapterBreakdown,
    setGeneralQa,
    setMoralQuestion,
    setComparison,
    clearCurrentPassage,
  }
})

