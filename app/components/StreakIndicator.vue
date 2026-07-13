<template>
  <div class="streak-indicator" :class="{ 'has-streak': streak > 0 }" title="Current Streak">
    <span class="flame-icon">🔥</span>
    <span v-if="streak > 0" class="streak-count">{{ streak }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const streak = ref(0)

// In a real implementation, we would calculate this based on the user's study history.
// For now, we'll fetch study history and use a dummy calculation or just check if they have history.
onMounted(async () => {
  if (auth.isAuthenticated) {
    try {
      const history = await $fetch('/api/study-history')
      // Simple dummy logic: if they have history, streak is at least 1
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
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0.5;
  transition: opacity 0.3s;
  font-family: var(--font-sans);
  font-size: 0.875rem;
}

.streak-indicator.has-streak {
  opacity: 0.9;
  color: var(--color-primary);
}

.flame-icon {
  font-size: 1.1em;
}

.streak-count {
  font-weight: 600;
}
</style>
