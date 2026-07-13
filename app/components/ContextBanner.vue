<template>
  <div class="context-banner">
    <div class="banner-inner">
      <h2 class="context-heading">Context & Background</h2>
      <div class="context-body">
        <span class="drop-cap">{{ firstLetter }}</span>
        <span class="rest-of-text reading-text">{{ restOfText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  context: string
}>()

const firstLetter = computed(() => {
  return props.context.charAt(0) || ''
})

const restOfText = computed(() => {
  return props.context.slice(1) || ''
})
</script>

<style scoped>
.context-banner {
  width: 100%;
  margin-bottom: var(--spacing-lg);
  position: relative;
  padding: var(--spacing-md) 0;
}

/* Subtle separator lines top and bottom, parchment style */
.context-banner::before,
.context-banner::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg, 
    transparent 0%, 
    var(--color-primary) 50%, 
    transparent 100%
  );
  opacity: 0.3;
}

.context-banner::before {
  top: 0;
}

.context-banner::after {
  bottom: 0;
}

.banner-inner {
  max-width: var(--max-width-reading);
  margin: 0 auto;
}

.context-heading {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
  text-align: center;
  font-family: var(--font-sans);
  font-weight: 500;
  opacity: 0.8;
}

.context-body {
  /* Using standard reading-text styling from main.css */
}
</style>
