<template>
  <div class="passage-view-page">
    <div v-if="isLoading" class="loading-state">
      <span class="loading-indicator"></span>
      <span class="loading-text">Loading passage...</span>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else-if="passage" class="response-section">
      <div class="header-nav">
        <NuxtLink to="/" class="back-link">← Back to Search</NuxtLink>
        <h1 class="passage-title">{{ route.params.book }} {{ route.params.chapter }}</h1>
      </div>

      <ContextBanner :context="passage.context" />
      
      <div class="traditions-grid">
        <TraditionCard 
          v-for="(block, idx) in passage.traditions" 
          :key="idx" 
          :block="block" 
        />
      </div>
      
      <div v-if="passage.divergenceNote" class="divergence-note reading-text">
        <p>{{ passage.divergenceNote }}</p>
      </div>

      <!-- Application Prompt relies on the passageRef, we can construct it or use the route params -->
      <ApplicationPrompt :passageRef="`${route.params.book} ${route.params.chapter}`" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { StructuredResponse } from '~/../server/types'

const route = useRoute()
const isLoading = ref(true)
const error = ref('')
const passage = ref<StructuredResponse | null>(null)

onMounted(async () => {
  const book = route.params.book
  const chapter = route.params.chapter
  
  if (!book || !chapter) {
    error.value = 'Invalid passage reference'
    isLoading.value = false
    return
  }

  try {
    // In a real app, this might be a specific GET endpoint or we use /api/ask with interpretive mode
    // We'll use /api/ask to fetch the cached/live interpretive response
    const data = await $fetch('/api/ask', {
      method: 'POST',
      body: {
        query: `${book} ${chapter}`,
        mode: 'interpretive'
      }
    })
    
    passage.value = (data as any).response
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load passage'
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.passage-view-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header-nav {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  width: 100%;
}

.back-link {
  align-self: flex-start;
  margin-bottom: var(--spacing-sm);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  opacity: 0.8;
}

.passage-title {
  color: var(--color-primary);
  font-size: 2.5rem;
  margin: 0;
  text-transform: capitalize;
}

.loading-state, .error-message {
  margin-top: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loading-text {
  margin-top: var(--spacing-sm);
  font-family: var(--font-serif);
  font-style: italic;
  opacity: 0.7;
}

.error-message {
  color: var(--color-secondary);
  background-color: rgba(122, 59, 46, 0.1);
  padding: var(--spacing-md);
  border-radius: var(--border-radius);
  border: 1px solid rgba(122, 59, 46, 0.3);
}

.response-section {
  width: 100%;
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
