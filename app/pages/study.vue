<template>
  <div class="study-page">
    <h1 class="page-title">Study History</h1>
    
    <div v-if="studyStore.isLoadingHistory" class="loading-state">
      <LoadingDots />
      <span class="loading-text">Loading your study history...</span>
    </div>

    <div v-else-if="studyStore.error" class="error-message">
      {{ studyStore.error }}
    </div>

    <div v-else-if="studyStore.history.length === 0" class="empty-state">
      <p class="empty-text">Nothing saved yet — ask a question to begin your study.</p>
      <NuxtLink to="/" class="action-btn">Seek Wisdom</NuxtLink>
    </div>

    <div v-else class="history-list">
      <div v-for="item in studyStore.history" :key="item.id" class="history-card">
        <div class="card-header">
          <h3 class="passage-ref">
            <NuxtLink :to="`/passage/ref/${item.passage_cache.id}`">
              {{ item.passage_cache.display_title || item.passage_cache.passage_ref }}
            </NuxtLink>
          </h3>
          <span class="saved-date">{{ new Date(item.saved_at).toLocaleDateString() }}</span>
        </div>
        
        <div class="card-body">
          <p v-if="getSummary(item)" class="context-preview">{{ getSummary(item) }}</p>
          
          <div v-if="item.personal_note" class="personal-note">
            <span class="note-label">Your Note:</span>
            <p>{{ item.personal_note }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useStudyStore } from '~/stores/study'

definePageMeta({
  middleware: [
    function (to, from) {
      const user = useSupabaseUser()
      if (!user.value) {
        return navigateTo('/auth/login')
      }
    }
  ]
})

const studyStore = useStudyStore()

onMounted(() => {
  studyStore.fetchHistory()
})

const getPreview = (text: string) => {
  if (!text) return ''
  return text.length > 150 ? text.substring(0, 150) + '...' : text
}

/**
 * Returns the best available summary for a history entry.
 * Prefers the server-derived short_summary; falls back to extracting
 * a preview from the response_json for entries cached before migration 006.
 */
const getSummary = (item: any): string => {
  const pc = item.passage_cache as any
  if (pc?.short_summary) return pc.short_summary

  const rj = pc?.response_json
  if (!rj) return ''

  const truncate = (t: string, max = 120) => {
    if (!t) return ''
    if (t.length <= max) return t
    const cut = t.lastIndexOf(' ', max)
    return (cut > 0 ? t.slice(0, cut) : t.slice(0, max)) + '…'
  }

  if (rj.chapterTheme) return truncate(rj.chapterTheme)
  if (rj.context) return truncate(rj.context)
  if (rj.traditions?.[0]?.position) return truncate(rj.traditions[0].position)
  if (rj.itemA && rj.itemB) return truncate(`${rj.itemA} vs ${rj.itemB}`)
  return ''
}
</script>

<style scoped>
.study-page {
  max-width: var(--max-width-reading);
  margin: 0 auto;
  width: 100%;
}

.page-title {
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.loading-state, .empty-state, .error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg) 0;
  text-align: center;
}

.loading-text {
  margin-top: var(--spacing-sm);
  font-family: var(--font-serif);
  font-style: italic;
  opacity: 0.7;
}

.empty-text {
  font-family: var(--font-serif);
  font-size: 1.2rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text);
  opacity: 0.8;
}

.action-btn {
  background-color: var(--color-primary);
  color: var(--color-bg);
  padding: 0 24px;
  min-height: 44px;
  border-radius: 22px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.9;
}

.error-message {
  color: var(--color-secondary);
  background-color: rgba(122, 59, 46, 0.1);
  border: 1px solid rgba(122, 59, 46, 0.3);
  border-radius: var(--border-radius);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.history-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  transition: transform 0.2s, box-shadow 0.2s;
}

.history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.25rem var(--spacing-sm);
  border-bottom: 1px dashed var(--color-border);
  padding-bottom: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.passage-ref {
  font-family: var(--font-serif);
  margin: 0;
  font-size: 1.25rem;
}

.saved-date {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  opacity: 0.6;
}

.context-preview {
  font-family: var(--font-serif);
  opacity: 0.8;
  line-height: 1.5;
  margin-bottom: var(--spacing-sm);
}

.personal-note {
  background-color: rgba(0,0,0,0.1);
  padding: var(--spacing-sm);
  border-radius: 4px;
  border-left: 3px solid var(--color-tertiary);
}

.note-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-tertiary);
  margin-bottom: 4px;
}
</style>
