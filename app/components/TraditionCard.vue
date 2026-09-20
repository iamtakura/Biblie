<template>
  <div class="tradition-card">
    <header class="card-header">
      <h3 class="tradition-name">{{ block.name }}</h3>
    </header>
    <div class="card-body">
      <div class="position-text reading-text">
        {{ block.position }}
      </div>
      
      <div v-if="formattedKeyTexts.length" class="key-texts" aria-label="Key texts">
        <span 
          v-for="(text, idx) in formattedKeyTexts" 
          :key="`${text}-${idx}`" 
          class="text-chip"
        >
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
import { computed } from 'vue'
import type { TraditionBlock } from '~/../server/types'

const props = defineProps<{
  block: TraditionBlock
}>()

const formattedKeyTexts = computed(() => {
  if (!props.block?.key_texts) return []
  const list: string[] = []
  for (const item of props.block.key_texts) {
    if (!item) continue
    // Handle comma- or semicolon-separated references within a single string
    const parts = item.split(/[,;]\s*(?=[A-Za-z0-9])/).map(s => s.trim()).filter(Boolean)
    if (parts.length > 1) {
      list.push(...parts)
    } else {
      list.push(item.trim())
    }
  }
  return list
})
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
  align-items: center;
  gap: 8px;
  margin-top: auto; /* Pushes to bottom if card is stretched */
  padding-top: var(--spacing-xs);
}

.text-chip {
  display: inline-flex;
  align-items: center;
  background-color: rgba(201, 151, 78, 0.12);
  border: 1px solid rgba(201, 151, 78, 0.35);
  border-radius: 12px;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-primary);
  line-height: 1.4;
  white-space: nowrap;
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
