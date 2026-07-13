<template>
  <div v-if="isGroqFallback" class="fallback-notice">
    This response used our backup model due to high demand.
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  sourceModel: string | null
}>()

const isGroqFallback = computed(() => {
  if (!props.sourceModel) return false
  return props.sourceModel.toLowerCase().includes('groq') || props.sourceModel.toLowerCase().includes('llama')
})
</script>

<style scoped>
.fallback-notice {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.85rem;
  color: var(--color-text-muted, #9ca3af);
  margin-top: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  text-align: center;
  opacity: 0.8;
}
</style>
