<template>
  <div class="moral-question-card">
    <div class="header-banner">
      <span class="mode-badge">Moral & Ethical Consideration</span>
      <h2 class="question-title">{{ response.question }}</h2>
    </div>

    <ModelFallbackNotice v-if="sourceModel" :sourceModel="sourceModel" />

    <!-- Scriptural Considerations Section -->
    <div v-if="response.scripturalConsiderations && response.scripturalConsiderations.length" class="considerations-section">
      <h3 class="section-heading">Scriptural Considerations</h3>
      <div class="verses-chips">
        <span v-for="ref in response.scripturalConsiderations" :key="ref" class="verse-chip">
          📖 {{ ref }}
        </span>
      </div>
    </div>

    <!-- Traditions Grid -->
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
import type { MoralQuestionResponse } from '~/../server/types'

defineProps<{
  response: MoralQuestionResponse
  sourceModel?: string | null
}>()
</script>

<style scoped>
.moral-question-card {
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
  background-color: rgba(122, 59, 46, 0.2);
  color: var(--color-secondary);
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

.considerations-section {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.section-heading {
  font-family: var(--font-sans);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-tertiary);
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
}

.verses-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-sm);
}

.verse-chip {
  background-color: rgba(240, 228, 200, 0.1);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--color-text);
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
