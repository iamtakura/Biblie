<template>
  <div class="general-qa-card">
    <div class="header-banner">
      <span class="mode-badge">Scripture Question</span>
      <h2 class="question-title">{{ response.question }}</h2>
    </div>

    <ModelFallbackNotice v-if="sourceModel" :sourceModel="sourceModel" />

    <div class="traditions-grid">
      <TraditionCard
        v-for="(block, idx) in response.traditions"
        :key="idx"
        :block="block"
      />
    </div>

    <div v-if="response.divergenceNote" class="divergence-note reading-text">
      <p>{{ response.divergenceNote }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GeneralQaResponse } from '~/../server/types'

defineProps<{
  response: GeneralQaResponse
  sourceModel?: string | null
}>()
</script>

<style scoped>
.general-qa-card {
  width: 100%;
}

.header-banner {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.mode-badge {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  background-color: rgba(107, 115, 85, 0.2);
  color: var(--color-tertiary);
  padding: 2px 10px;
  border-radius: 12px;
  margin-bottom: var(--spacing-xs);
}

.question-title {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  color: var(--color-primary);
  margin: 0;
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
