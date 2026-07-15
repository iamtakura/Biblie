<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="dismiss" role="dialog" aria-modal="true" aria-labelledby="intro-title">
      <div class="modal-card">
        <button class="close-btn" @click="dismiss" aria-label="Close guide">✕</button>

        <div class="modal-header">
          <span class="modal-badge">Getting Started</span>
          <h2 id="intro-title" class="modal-title">How to Seek Wisdom</h2>
          <p class="modal-subtitle">A guide to Biblie's query modes</p>
        </div>

        <div class="modal-body">
          <!-- Chapter Study -->
          <div class="guide-item">
            <div class="guide-icon">📖</div>
            <div class="guide-content">
              <div class="guide-label">Chapter Study</div>
              <code class="guide-command">/interpret [Book] [Chapter]</code>
              <p class="guide-desc">Produces a complete verse-by-verse breakdown with themes and theological context.</p>
              <div class="guide-example">e.g. <em>/interpret Romans 8</em> or <em>/interpret Psalms 23</em></div>
            </div>
          </div>

          <div class="guide-divider" aria-hidden="true"></div>

          <!-- Auto-routed modes -->
          <p class="auto-intro">Or just type naturally — Biblie automatically routes to the right mode:</p>

          <div class="guide-item">
            <div class="guide-icon">🕊</div>
            <div class="guide-content">
              <div class="guide-label">Passage Interpretation</div>
              <p class="guide-desc">Multi-tradition analysis of a specific verse or passage.</p>
              <div class="guide-example">e.g. <em>What does John 3:16 mean?</em></div>
            </div>
          </div>

          <div class="guide-item">
            <div class="guide-icon">⚖️</div>
            <div class="guide-content">
              <div class="guide-label">Moral & Ethical Questions</div>
              <p class="guide-desc">How different traditions approach moral dilemmas — without declaring a single verdict.</p>
              <div class="guide-example">e.g. <em>Is divorce a sin?</em></div>
            </div>
          </div>

          <div class="guide-item">
            <div class="guide-icon">🔄</div>
            <div class="guide-content">
              <div class="guide-label">Comparative Analysis</div>
              <p class="guide-desc">Side-by-side comparison of chapters, books, denominations, or religions.</p>
              <div class="guide-example">e.g. <em>Compare Catholicism vs Protestantism on salvation</em></div>
            </div>
          </div>

          <div class="guide-item">
            <div class="guide-icon">💬</div>
            <div class="guide-content">
              <div class="guide-label">General Scripture Questions</div>
              <p class="guide-desc">Broad theological questions answered through multiple traditions.</p>
              <div class="guide-example">e.g. <em>What does the Bible say about forgiveness?</em></div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="dismiss-btn" @click="dismiss" :disabled="isDismissing">
            <LoadingDots v-if="isDismissing" />
            <span v-else>Got it, don't show again</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoadingDots from '~/components/LoadingDots.vue'

const emit = defineEmits<{
  (e: 'dismissed'): void
}>()

const isDismissing = ref(false)

const dismiss = async () => {
  if (isDismissing.value) return
  isDismissing.value = true
  try {
    await $fetch('/api/profile/dismiss-intro', { method: 'POST' })
  } catch (e) {
    // Best-effort — if the request fails, still close the modal
    console.warn('[CommandIntroModal] Could not persist dismissal:', e)
  } finally {
    isDismissing.value = false
    emit('dismissed')
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: backdropIn 0.2s ease-out;
}

@keyframes backdropIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: cardIn 0.25s ease-out;
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  width: 32px;
  height: 32px;
  border-radius: 4px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.modal-header {
  padding: 2rem 2rem 1.25rem;
  text-align: center;
  border-bottom: 1px solid var(--color-border);
}

.modal-badge {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  background-color: rgba(201, 151, 78, 0.15);
  color: var(--color-primary);
  padding: 2px 10px;
  border-radius: 12px;
  margin-bottom: 0.75rem;
}

.modal-title {
  font-family: var(--font-serif);
  font-size: 1.6rem;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.modal-subtitle {
  font-family: var(--font-serif);
  font-style: italic;
  opacity: 0.6;
  font-size: 0.9rem;
  margin: 0;
}

.modal-body {
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.auto-intro {
  font-family: var(--font-sans);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-tertiary);
  text-align: center;
  margin: 0.25rem 0;
}

.guide-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%);
  margin: 0.25rem 0;
}

.guide-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.guide-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  width: 2rem;
  text-align: center;
  padding-top: 0.1rem;
}

.guide-content {
  flex: 1;
  min-width: 0;
}

.guide-label {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.guide-command {
  display: inline-block;
  background-color: rgba(201, 151, 78, 0.12);
  border: 1px solid rgba(201, 151, 78, 0.3);
  border-radius: 4px;
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 0.875rem;
  color: var(--color-primary);
  margin-bottom: 0.4rem;
}

.guide-desc {
  font-family: var(--font-serif);
  font-size: 0.95rem;
  line-height: 1.5;
  opacity: 0.85;
  margin: 0 0 0.25rem;
}

.guide-example {
  font-size: 0.825rem;
  opacity: 0.6;
  font-family: var(--font-sans);
}

.guide-example em {
  font-style: italic;
  color: var(--color-primary);
  opacity: 0.8;
}

.modal-footer {
  padding: 1.25rem 2rem 1.75rem;
  display: flex;
  justify-content: center;
  border-top: 1px solid var(--color-border);
}

.dismiss-btn {
  background-color: var(--color-primary);
  color: var(--color-bg);
  border: none;
  padding: 0 1.5rem;
  min-height: 44px;
  border-radius: 22px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
}

.dismiss-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.dismiss-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .modal-header {
    padding: 1.5rem 1.25rem 1rem;
  }
  .modal-body {
    padding: 1.25rem;
  }
  .modal-footer {
    padding: 1rem 1.25rem 1.5rem;
  }
  .modal-title {
    font-size: 1.35rem;
  }
}
</style>
