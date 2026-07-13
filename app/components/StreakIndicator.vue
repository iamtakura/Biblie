<template>
  <div class="streak-indicator" :class="{ 'has-streak': streak > 0 }" title="Current Streak">
    <svg 
      class="streak-icon" 
      viewBox="0 0 24 24" 
      width="14" 
      height="14" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
    <span class="streak-count">{{ streak }}d</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const streak = ref(0)

onMounted(async () => {
  if (auth.isAuthenticated) {
    try {
      const history = await $fetch('/api/study-history')
      if (Array.isArray(history) && history.length > 0) {
        streak.value = 1 
      }
    } catch (e) {
      // ignore
    }
  }
})
</script>

<style scoped>
.streak-indicator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  opacity: 0.6;
  transition: opacity 0.3s, color 0.3s;
  font-family: var(--font-sans);
  font-size: 0.85rem;
  color: var(--color-text);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background-color: rgba(240, 228, 200, 0.05);
}

.streak-indicator.has-streak {
  opacity: 0.95;
  color: var(--color-primary);
  border-color: rgba(201, 151, 78, 0.3);
  background-color: rgba(201, 151, 78, 0.1);
}

.streak-icon {
  flex-shrink: 0;
}

.streak-count {
  font-weight: 600;
  font-family: var(--font-mono);
}
</style>
