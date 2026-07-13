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
        <span v-else class="manuscript-loading" title="Seeking wisdom...">
          <span class="flame">🔥</span>
        </span>
      </button>
    </form>
    
    <!-- Optional: Suggestion dropdown could go here in future -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

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
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: border-color 0.3s, box-shadow 0.3s;
  overflow: hidden;
}

.input-wrapper:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(201, 151, 78, 0.15);
}

.main-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--color-text);
  font-size: 1.125rem;
  padding: var(--spacing-sm) var(--spacing-md);
  outline: none;
}

.main-input::placeholder {
  color: var(--color-text);
  opacity: 0.5;
  font-family: var(--font-serif);
  font-style: italic;
}

.submit-btn {
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
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.manuscript-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.flame {
  font-size: 1.15rem;
  display: inline-block;
  animation: flicker 1.8s ease-in-out infinite alternate;
}

@keyframes flicker {
  0% {
    opacity: 0.6;
    transform: scale(0.92) translateY(0);
    filter: drop-shadow(0 0 2px rgba(212, 175, 55, 0.4));
  }
  50% {
    opacity: 1;
    transform: scale(1.08) translateY(-1px);
    filter: drop-shadow(0 0 6px rgba(212, 175, 55, 0.8));
  }
  100% {
    opacity: 0.75;
    transform: scale(0.96) translateY(0);
    filter: drop-shadow(0 0 3px rgba(212, 175, 55, 0.5));
  }
}

@media (prefers-reduced-motion: reduce) {
  .flame {
    animation: simplePulse 2s ease-in-out infinite alternate;
    transform: none;
  }
}

@keyframes simplePulse {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}
</style>
