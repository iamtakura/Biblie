<template>
  <div class="save-button-wrapper">
    <button v-if="!isExpanded" @click="isExpanded = true" class="save-btn" :disabled="isSaving || saved">
      <span class="btn-icon">{{ saved ? '✓' : '🔖' }}</span>
      {{ saved ? 'Saved to Study' : 'Save to Study' }}
    </button>
    
    <div v-else class="expanded-panel">
      <textarea 
        v-model="personalNote" 
        class="note-input" 
        placeholder="Add a personal note (optional)..."
        rows="3"
      ></textarea>
      <div class="panel-actions">
        <button @click="isExpanded = false" class="cancel-btn">Cancel</button>
        <button @click="handleSave" class="confirm-btn" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
      <p v-if="error" class="error-text">{{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStudyStore } from '~/stores/study'

const props = defineProps<{
  cacheId: string
}>()

const studyStore = useStudyStore()
const isExpanded = ref(false)
const personalNote = ref('')
const isSaving = ref(false)
const saved = ref(false)
const error = ref('')

const handleSave = async () => {
  if (!props.cacheId) return
  
  isSaving.value = true
  error.value = ''
  try {
    await studyStore.saveToHistory(props.cacheId, personalNote.value)
    saved.value = true
    isExpanded.value = false
  } catch (err: any) {
    error.value = err.message || 'Failed to save'
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.save-button-wrapper {
  margin-top: var(--spacing-md);
  display: flex;
  justify-content: center;
}

.save-btn {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 0 var(--spacing-md);
  min-height: 44px;
  border-radius: var(--border-radius);
  font-family: var(--font-sans);
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.save-btn:hover:not(:disabled) {
  background-color: var(--color-tertiary);
  color: var(--color-bg);
  border-color: var(--color-tertiary);
}

.expanded-panel {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.note-input {
  width: 100%;
  background-color: rgba(0,0,0,0.1);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  resize: vertical;
  margin-bottom: var(--spacing-xs);
}

.note-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-xs);
}

.cancel-btn, .confirm-btn {
  padding: 0 16px;
  min-height: 44px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-family: var(--font-sans);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cancel-btn {
  background: transparent;
  color: var(--color-text);
  border: 1px solid transparent;
  opacity: 0.7;
}

.cancel-btn:hover {
  opacity: 1;
}

.confirm-btn {
  background-color: var(--color-primary);
  color: var(--color-bg);
  border: none;
  font-weight: 500;
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-text {
  color: var(--color-secondary);
  font-size: 0.8rem;
  margin-top: 4px;
}
</style>
