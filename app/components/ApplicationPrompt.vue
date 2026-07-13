<template>
  <div class="application-prompt">
    <div v-if="!applicationResult && !isLoading" class="prompt-action">
      <button @click="handleApply" class="apply-btn">
        <span class="btn-icon">✧</span>
        What does this mean for me?
      </button>
    </div>
    
    <div v-if="isLoading" class="loading-state">
      <LoadingDots />
      <span class="loading-text">Seeking application...</span>
    </div>

    <div v-if="applicationResult" class="application-result">
      <h3 class="result-heading">Personal Application</h3>
      <div class="result-content reading-text">
        <!-- Render the context of the application response -->
        <p>{{ applicationResult.context }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { StructuredResponse } from '~/../server/types'

const props = defineProps<{
  passageRef: string
}>()

const isLoading = ref(false)
const applicationResult = ref<StructuredResponse | null>(null)

const handleApply = async () => {
  if (!props.passageRef) return
  
  isLoading.value = true
  try {
    const data = await $fetch('/api/ask', {
      method: 'POST',
      body: {
        query: props.passageRef,
        mode: 'application'
      }
    })
    
    // We expect the application mode to return a response with 'context' holding the actual application.
    applicationResult.value = (data as any).response
  } catch (err) {
    console.error('Failed to get application:', err)
    // In a full implementation, we'd emit an error to the parent to show a toast
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.application-prompt {
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.apply-btn {
  background-color: transparent;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 20px;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: all 0.3s ease;
}

.apply-btn:hover {
  background-color: rgba(201, 151, 78, 0.1);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1.2em;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  opacity: 0.7;
}

.loading-text {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.9rem;
}

.application-result {
  width: 100%;
  max-width: var(--max-width-reading);
  background-color: rgba(122, 59, 46, 0.05); /* Burnt sienna tint */
  border: 1px solid rgba(122, 59, 46, 0.3);
  border-left: 4px solid var(--color-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.result-heading {
  color: var(--color-secondary);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: var(--spacing-sm);
  margin-top: 0;
}
</style>
