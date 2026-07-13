<template>
  <div class="comparison-view">
    <div class="header-banner">
      <span class="mode-badge">Comparative Analysis</span>
      <h2 class="comparison-title">
        <span class="item-name">{{ response.itemA }}</span>
        <span class="vs-divider">vs</span>
        <span class="item-name">{{ response.itemB }}</span>
      </h2>
    </div>

    <ModelFallbackNotice v-if="sourceModel" :sourceModel="sourceModel" />

    <!-- Two-column Similarities / Differences grid -->
    <div class="columns-grid">
      <div class="comparison-column similarities-column">
        <h3 class="column-title">Similarities</h3>
        <ul class="comparison-list">
          <li v-for="(item, idx) in response.similarities" :key="idx" class="list-item">
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="comparison-column differences-column">
        <h3 class="column-title">Differences</h3>
        <ul class="comparison-list">
          <li v-for="(item, idx) in response.differences" :key="idx" class="list-item">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Optional Tradition Notes section -->
    <div v-if="response.traditionNotes && response.traditionNotes.length" class="tradition-notes-section">
      <h3 class="section-heading">Theological & Denominational Foundations</h3>
      <div class="traditions-grid">
        <TraditionCard
          v-for="(block, idx) in response.traditionNotes"
          :key="idx"
          :block="block"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComparisonResponse } from '~/../server/types'

defineProps<{
  response: ComparisonResponse
  sourceModel?: string | null
}>()
</script>

<style scoped>
.comparison-view {
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
  background-color: rgba(201, 151, 78, 0.2);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: 12px;
  margin-bottom: var(--spacing-xs);
}

.comparison-title {
  font-family: var(--font-serif);
  font-size: 1.6rem;
  color: var(--color-text);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.item-name {
  color: var(--color-primary);
}

.vs-divider {
  font-style: italic;
  opacity: 0.6;
  font-size: 1.1rem;
}

.columns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.comparison-column {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
}

.column-title {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-xs);
  border-bottom: 2px solid var(--color-border);
}

.similarities-column .column-title {
  color: var(--color-tertiary);
  border-bottom-color: var(--color-tertiary);
}

.differences-column .column-title {
  color: var(--color-secondary);
  border-bottom-color: var(--color-secondary);
}

.comparison-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.list-item {
  position: relative;
  padding-left: var(--spacing-md);
  line-height: 1.5;
  font-family: var(--font-serif);
}

.similarities-column .list-item::before {
  content: "•";
  color: var(--color-tertiary);
  font-weight: bold;
  position: absolute;
  left: 0;
}

.differences-column .list-item::before {
  content: "•";
  color: var(--color-secondary);
  font-weight: bold;
  position: absolute;
  left: 0;
}

.tradition-notes-section {
  margin-top: var(--spacing-lg);
}

.section-heading {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-tertiary);
  text-align: center;
  margin-bottom: var(--spacing-md);
}

.traditions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

@media (max-width: 768px) {
  .columns-grid {
    grid-template-columns: 1fr;
  }

  .traditions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
