<template>
  <div class="home-page">
    <div class="search-section">
      <h1 class="page-title">Biblie</h1>
      <p class="page-subtitle">Seek wisdom through tradition.</p>
      
      <PassageInput @submit="handleSearch" :isLoading="isLoading" />
      
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <!-- Chapter Breakdown Mode -->
    <div v-if="studyStore.currentResponseMode === 'chapter_breakdown' && studyStore.currentChapterBreakdown"
         class="response-section">
      <ChapterBreakdown
        :response="studyStore.currentChapterBreakdown"
        :passageRef="studyStore.currentPassageRef"
        :displayTitle="studyStore.currentDisplayTitle"
        :sourceModel="studyStore.currentSourceModel"
      />
    </div>

    <!-- General QA Mode -->
    <div v-else-if="studyStore.currentResponseMode === 'general_qa' && studyStore.currentGeneralQa"
         class="response-section">
      <GeneralQaCard
        :response="studyStore.currentGeneralQa"
        :sourceModel="studyStore.currentSourceModel"
      />
      <ClientOnly>
        <SaveToStudyButton v-if="studyStore.currentCacheId && auth.isAuthenticated" :cacheId="studyStore.currentCacheId" />
        <div v-else-if="!auth.isAuthenticated" class="auth-prompt">
          <NuxtLink to="/auth/login">Log in to save to study history</NuxtLink>
        </div>
      </ClientOnly>
    </div>

    <!-- Moral Question Mode -->
    <div v-else-if="studyStore.currentResponseMode === 'moral_question' && studyStore.currentMoralQuestion"
         class="response-section">
      <MoralQuestionCard
        :response="studyStore.currentMoralQuestion"
        :sourceModel="studyStore.currentSourceModel"
      />
      <ClientOnly>
        <SaveToStudyButton v-if="studyStore.currentCacheId && auth.isAuthenticated" :cacheId="studyStore.currentCacheId" />
        <div v-else-if="!auth.isAuthenticated" class="auth-prompt">
          <NuxtLink to="/auth/login">Log in to save to study history</NuxtLink>
        </div>
      </ClientOnly>
    </div>

    <!-- Comparison Mode -->
    <div v-else-if="studyStore.currentResponseMode === 'comparison' && studyStore.currentComparison"
         class="response-section">
      <ComparisonView
        :response="studyStore.currentComparison"
        :sourceModel="studyStore.currentSourceModel"
      />
      <ClientOnly>
        <SaveToStudyButton v-if="studyStore.currentCacheId && auth.isAuthenticated" :cacheId="studyStore.currentCacheId" />
        <div v-else-if="!auth.isAuthenticated" class="auth-prompt">
          <NuxtLink to="/auth/login">Log in to save to study history</NuxtLink>
        </div>
      </ClientOnly>
    </div>

    <!-- Interpretive Mode -->
    <div v-else-if="studyStore.currentResponseMode === 'interpretive' && studyStore.currentPassage"
         class="response-section">
      <ContextBanner :context="studyStore.currentPassage.context" />
      <ModelFallbackNotice :sourceModel="studyStore.currentSourceModel" />
      
      <div class="traditions-grid">
        <TraditionCard 
          v-for="(block, idx) in studyStore.currentPassage.traditions" 
          :key="idx" 
          :block="block" 
        />
      </div>
      
      <div v-if="studyStore.currentPassage.divergenceNote" class="divergence-note reading-text">
        <p>{{ studyStore.currentPassage.divergenceNote }}</p>
      </div>

      <ApplicationPrompt v-if="studyStore.currentPassageRef" :passageRef="studyStore.currentPassageRef" />
      
      <ClientOnly>
        <SaveToStudyButton v-if="studyStore.currentCacheId && auth.isAuthenticated" :cacheId="studyStore.currentCacheId" />
        <div v-else-if="!auth.isAuthenticated" class="auth-prompt">
          <NuxtLink to="/auth/login">Log in to save to study history</NuxtLink>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import { useStudyStore } from '~/stores/study'
import { useAuthStore } from '~/stores/auth'
import { useSessionsStore } from '~/stores/sessions'
import type {
  AskResponse,
  ChapterAskResponse,
  GeneralQaAskResponse,
  MoralQuestionAskResponse,
  ComparisonAskResponse,
  GeneralQaResponse,
  MoralQuestionResponse,
  ComparisonResponse,
  AllModes,
} from '~/../server/types'

const studyStore = useStudyStore()
const auth = useAuthStore()
const sessionsStore = useSessionsStore()

const isLoading = ref(false)
const error = ref('')

const handleSearch = async (query: string) => {
  isLoading.value = true
  error.value = ''
  studyStore.clearCurrentPassage()

  // Detect /interpret command
  const interpretMatch = query.match(/^\/interpret\s+(.+)$/i)
  const isChapterMode = !!interpretMatch
  const apiQuery = isChapterMode ? interpretMatch![1].trim() : query
  const mode: AllModes = isChapterMode ? 'chapter_breakdown' : 'auto'

  try {
    if (isChapterMode) {
      const data = await $fetch<ChapterAskResponse>('/api/ask', {
        method: 'POST',
        body: { 
          query: apiQuery, 
          mode,
          session_id: sessionsStore.activeSessionId || undefined,
        },
      })
      if (data?.meta?.session_id) {
        sessionsStore.setActiveSession(data.meta.session_id)
      }
      if (data?.data) {
        studyStore.setChapterBreakdown(
          data.data,
          data.meta?.passage_ref || apiQuery,
          data.meta?.display_title,
          data.meta?.passage_cache_id,
          data.meta?.source_model,
        )
      }
    } else {
      const res = await $fetch<AskResponse | GeneralQaAskResponse | MoralQuestionAskResponse | ComparisonAskResponse>('/api/ask', {
        method: 'POST',
        body: { 
          query: apiQuery, 
          mode,
          session_id: sessionsStore.activeSessionId || undefined,
        },
      })

      const meta = res?.meta
      if (meta?.session_id) {
        sessionsStore.setActiveSession(meta.session_id)
      }

      const activeMode = meta?.detected_mode || 'interpretive'

      if (activeMode === 'general_qa') {
        const data = (res as GeneralQaAskResponse).data
        studyStore.setGeneralQa(data, meta?.passage_cache_id, meta?.source_model)
      } else if (activeMode === 'moral_question') {
        const data = (res as MoralQuestionAskResponse).data
        studyStore.setMoralQuestion(data, meta?.passage_cache_id, meta?.source_model)
      } else if (activeMode === 'comparison') {
        const data = (res as ComparisonAskResponse).data
        studyStore.setComparison(data, meta?.passage_cache_id, meta?.source_model)
      } else {
        const data = (res as AskResponse).data
        studyStore.setCurrentPassage(
          data,
          meta?.passage_ref || apiQuery,
          meta?.display_title,
          meta?.category,
          meta?.passage_cache_id,
          meta?.source_model,
        )
      }
    }
  } catch (err: any) {
    if (err.statusCode === 429) {
      error.value = 'Your daily requests have been exhausted. Please return tomorrow.'
    } else if (err.statusCode === 503) {
      error.value = 'The wisdom sources are currently overwhelmed. Please try again in a few moments.'
    } else {
      error.value = err.data?.message || 'An unexpected error occurred while seeking.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>



<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.search-section {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  width: 100%;
}

.page-title {
  font-size: 3rem;
  color: var(--color-primary);
  margin-bottom: 0;
}

.page-subtitle {
  font-family: var(--font-serif);
  font-style: italic;
  opacity: 0.7;
  margin-bottom: var(--spacing-md);
}

.error-message {
  margin-top: var(--spacing-md);
  color: var(--color-secondary);
  background-color: rgba(122, 59, 46, 0.1);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius);
  border: 1px solid rgba(122, 59, 46, 0.3);
  max-width: var(--max-width-reading);
  margin-left: auto;
  margin-right: auto;
}

.response-section {
  width: 100%;
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.traditions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.divergence-note {
  max-width: var(--max-width-reading);
  margin: 0 auto var(--spacing-lg) auto;
  padding: var(--spacing-md);
  border-left: 4px solid var(--color-tertiary);
  background-color: rgba(107, 115, 85, 0.05);
  font-style: italic;
}

.auth-prompt {
  text-align: center;
  margin-top: var(--spacing-md);
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .traditions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .traditions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
