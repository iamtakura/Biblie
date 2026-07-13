<template>
  <div v-if="showWarning" class="usage-meter" title="Daily Requests Remaining">
    <span class="usage-icon">✨</span>
    <span class="usage-count">{{ remaining }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const remaining = ref<number | null>(null)

const showWarning = computed(() => {
  return remaining.value !== null && remaining.value < 5
})

onMounted(async () => {
  try {
    const data = await $fetch('/api/usage')
    remaining.value = (data as any).remaining
  } catch (e) {
    // ignore
  }
})
</script>

<style scoped>
.usage-meter {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--color-secondary);
  background-color: rgba(122, 59, 46, 0.1);
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(122, 59, 46, 0.3);
}

.usage-icon {
  font-size: 0.9em;
}
</style>
