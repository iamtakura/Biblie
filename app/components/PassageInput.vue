<template>
  <div class="passage-input-container">
    <form @submit.prevent="handleSubmit" class="input-wrapper">
      <input 
        type="text" 
        v-model="query" 
        class="main-input" 
        placeholder="Enter a passage (e.g. Romans 8) or ask a question..." 
        :disabled="isLoading"
        autocomplete="off"
      />
      <button type="submit" class="submit-btn" :disabled="isLoading || !query.trim()">
        <span v-if="!isLoading">Seek</span>
        <LoadingDots v-else title="Seeking wisdom..." />
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoadingDots from '~/components/LoadingDots.vue'

const props = defineProps<{
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', query: string): void
}>()

const query = ref('')

const handleSubmit = () => {
  if (!query.value.trim() || props.isLoading) return
  emit('submit', query.value.trim())
}
</script>

<style scoped>
.passage-input-container {
  width: 100%;
  max-width: var(--max-width-reading);
  margin: 0 auto;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: stretch;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: border-color 0.3s, box-shadow 0.3s;
  overflow: hidden;
  width: 100%;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(201, 151, 78, 0.15);
}

.main-input {
  flex: 1;
  min-width: 0; /* Ensures proper flex shrinking on narrow viewports */
  background: transparent;
  border: none;
  color: var(--color-text);
  font-size: 1.125rem;
  padding: var(--spacing-xs) var(--spacing-md);
  min-height: 48px;
  outline: none;
}

.main-input::placeholder {
  color: var(--color-text);
  opacity: 0.5;
  font-family: var(--font-serif);
  font-style: italic;
}

.submit-btn {
  flex-shrink: 0; /* Prevents button clipping/squishing on small viewports */
  background-color: var(--color-primary);
  color: var(--color-bg);
  border: none;
  padding: 0 var(--spacing-md);
  font-weight: 600;
  font-size: 1rem;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  min-height: 48px;
  box-sizing: border-box;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .main-input {
    font-size: 1rem;
    padding: var(--spacing-xs) var(--spacing-sm);
  }
  
  .submit-btn {
    padding: 0 var(--spacing-sm);
    min-width: 72px;
    font-size: 0.95rem;
  }
}
</style>
