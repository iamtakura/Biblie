<template>
  <div class="tradition-card">
    <header class="card-header">
      <h3 class="tradition-name">{{ block.name }}</h3>
    </header>
    <div class="card-body">
      <div class="position-text reading-text">
        {{ block.position }}
      </div>
      
      <div v-if="block.key_texts && block.key_texts.length" class="key-texts">
        <span v-for="text in block.key_texts" :key="text" class="text-chip">
          {{ text }}
        </span>
      </div>
      
      <div v-if="block.reasoning" class="sources-text text-muted">
        {{ block.reasoning }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TraditionBlock } from '~/../server/types'

defineProps<{
  block: TraditionBlock
}>()
</script>

<style scoped>
.tradition-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tradition-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.card-header {
  background-color: rgba(107, 115, 85, 0.15); /* Olive sage tint */
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.tradition-name {
  color: var(--color-tertiary);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
}

.card-body {
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  flex: 1;
}

.position-text {
  /* Inherits .reading-text from main.css */
  font-size: 1.05rem; /* Slightly smaller than main context */
}

.key-texts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: auto; /* Pushes to bottom if card is stretched */
}

.text-chip {
  background-color: rgba(240, 228, 200, 0.1);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2px 10px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-text);
  opacity: 0.9;
}

.sources-text {
  font-size: 0.85rem;
  border-top: 1px dashed var(--color-border);
  padding-top: var(--spacing-sm);
  font-family: var(--font-serif);
  font-style: italic;
}

.source-item {
  margin-bottom: 4px;
}
</style>
