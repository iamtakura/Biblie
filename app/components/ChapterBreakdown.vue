<template>
  <div class="chapter-breakdown">
    <div class="chapter-header">
      <div class="header-label">Chapter Study</div>
      <h2 class="chapter-title">{{ displayTitle }}</h2>
      <p class="chapter-hint">A complete verse-by-verse breakdown</p>
      <ModelFallbackNotice :sourceModel="sourceModel" />
    </div>

    <!-- Verse-by-verse list -->
    <section class="verse-section">
      <div
        v-for="verseItem in response.verses"
        :key="verseItem.verse"
        class="verse-block"
      >
        <div class="verse-label">Verse {{ verseItem.verse }}</div>
        <p class="verse-explanation reading-text">{{ verseItem.explanation }}</p>
        <div v-if="verseItem.disputeNote" class="dispute-note">
          <span class="dispute-label">Interpretive Note</span>
          <p class="dispute-text">{{ verseItem.disputeNote }}</p>
        </div>
      </div>
    </section>

    <!-- Divider -->
    <div class="section-divider" aria-hidden="true"></div>

    <!-- Summary Sections -->
    <section class="summary-sections">
      <div v-if="response.chapterTheme" class="theme-block">
        <div class="theme-label">Core Theme</div>
        <h3 class="theme-quote">“{{ response.chapterTheme }}”</h3>
      </div>

      <div class="summary-block">
        <h3 class="summary-heading">Chapter Summary</h3>
        <p class="summary-body reading-text">{{ response.chapterSummary }}</p>
      </div>

      <div class="summary-block">
        <h3 class="summary-heading">What This Reveals About God</h3>
        <p class="summary-body reading-text">{{ response.aboutGod }}</p>
      </div>

      <div class="summary-block">
        <h3 class="summary-heading">About the Author</h3>
        <p class="summary-body reading-text">{{ response.aboutAuthor }}</p>
      </div>

      <div class="summary-block">
        <h3 class="summary-heading">For Modern Christians Today</h3>
        <p class="summary-body reading-text">{{ response.modernApplication }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { ChapterBreakdownResponse } from '~/../server/types'

defineProps<{
  response: ChapterBreakdownResponse
  passageRef: string
  displayTitle: string
  sourceModel?: string | null
}>()
</script>

<style scoped>
.chapter-breakdown {
  width: 100%;
  max-width: var(--max-width-reading);
  margin: 0 auto;
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header ─────────────────────────────────────────────────────────────────── */

.chapter-header {
  text-align: center;
  padding: var(--spacing-md) 0 var(--spacing-lg);
  position: relative;
}

.chapter-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-primary) 50%, transparent 100%);
  opacity: 0.3;
}

.header-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 3px;
  color: var(--color-tertiary);
  font-family: var(--font-sans);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.chapter-title {
  font-family: var(--font-serif);
  font-size: 2rem;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.chapter-hint {
  font-family: var(--font-serif);
  font-style: italic;
  opacity: 0.5;
  font-size: 0.9rem;
  margin: 0;
}

/* ── Verse list ─────────────────────────────────────────────────────────────── */

.verse-section {
  padding: var(--spacing-lg) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.verse-block {
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.verse-block:last-child {
  border-bottom: none;
}

.verse-label {
  display: inline-block;
  font-family: var(--font-sans);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-tertiary);
  background-color: rgba(107, 115, 85, 0.12);
  border: 1px solid rgba(107, 115, 85, 0.3);
  border-radius: 3px;
  padding: 2px 8px;
  margin-bottom: var(--spacing-xs);
}

.verse-explanation {
  color: var(--color-text);
  margin: 0;
}

/* Dispute notes — sienna left accent, indented */
.dispute-note {
  margin-top: var(--spacing-xs);
  margin-left: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-left: 3px solid var(--color-secondary);
  background-color: rgba(122, 59, 46, 0.06);
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
}

.dispute-label {
  display: block;
  font-size: 0.7rem;
  font-family: var(--font-sans);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--color-secondary);
  margin-bottom: 4px;
  opacity: 0.85;
}

.dispute-text {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 0.95rem;
  line-height: 1.7;
  opacity: 0.85;
  margin: 0;
}

/* ── Divider ─────────────────────────────────────────────────────────────────── */

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-primary) 50%, transparent 100%);
  opacity: 0.25;
  margin: var(--spacing-md) 0;
}

/* ── Summary sections ────────────────────────────────────────────────────────── */

.summary-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.theme-block {
  text-align: center;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--color-primary);
  border-radius: var(--border-radius);
}

.theme-label {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-tertiary);
  margin-bottom: var(--spacing-xs);
}

.theme-quote {
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 1.35rem;
  line-height: 1.45;
  color: var(--color-primary);
  margin: 0;
  font-weight: 500;
}

.summary-block {
  position: relative;
  padding: var(--spacing-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.summary-heading {
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--color-primary);
  margin-bottom: var(--spacing-sm);
  opacity: 0.9;
}

.summary-body {
  margin: 0;
  color: var(--color-text);
}
</style>
