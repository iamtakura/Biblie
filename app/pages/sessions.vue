<template>
  <div class="sessions-page">
    <h1 class="page-title">Session History</h1>

    <div v-if="sessionsStore.isLoadingList" class="loading-state">
      <LoadingDots />
      <span class="loading-text">Loading your sessions...</span>
    </div>
    <div v-else-if="sessionsStore.error" class="error-message">
      {{ sessionsStore.error }}
    </div>
    <div v-else-if="sessionsStore.sessionList.length === 0" class="empty-state">
      No chat sessions found. Start a new session on the home page!
    </div>
    
    <div v-else class="sessions-layout">
      <!-- Session List (Sidebar) -->
      <div class="sessions-list">
        <div 
          v-for="session in sessionsStore.sessionList" 
          :key="session.id"
          class="session-item"
          :class="{ active: sessionsStore.currentSessionDetail?.id === session.id }"
          @click="selectSession(session.id)"
        >
          <div class="session-title">{{ session.title || 'Untitled Session' }}</div>
          <div class="session-date">{{ formatDate(session.updated_at) }}</div>
        </div>
      </div>

      <!-- Session Detail (Main Content) -->
      <div class="session-detail">
        <div v-if="sessionsStore.isLoadingDetail" class="loading-state">
          <LoadingDots />
          <span class="loading-text">Loading session details...</span>
        </div>
        <div v-else-if="!sessionsStore.currentSessionDetail" class="empty-state detail-empty">
          Select a session to view history.
        </div>
        <div v-else class="queries-list">
          <h2 class="detail-title">{{ sessionsStore.currentSessionDetail.title || 'Untitled Session' }}</h2>
          <div class="detail-meta">Updated: {{ formatDate(sessionsStore.currentSessionDetail.updated_at) }}</div>

          <div v-for="query in sessionsStore.currentSessionDetail.queries" :key="query.id" class="query-card">
            <div class="query-header">
              <span class="query-mode">{{ formatMode(query.mode) }}</span>
              <span class="query-time">{{ formatTime(query.created_at) }}</span>
            </div>
            <div class="query-text">"{{ query.query_text }}"</div>
            <div v-if="query.source_model" class="query-model">
              Model: {{ query.source_model }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useSessionsStore } from '~/stores/sessions'

const sessionsStore = useSessionsStore()

onMounted(() => {
  sessionsStore.fetchSessionList()
})

const selectSession = (id: string) => {
  sessionsStore.fetchSessionDetail(id)
}

const formatMode = (mode: string) => {
  if (mode === 'chapter_breakdown') return 'Chapter Study'
  if (mode === 'interpretive') return 'Interpretive'
  if (mode === 'application') return 'Application'
  return mode
}

const formatDate = (isoString: string) => {
  const d = new Date(isoString)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (isoString: string) => {
  const d = new Date(isoString)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}
</script>

<style scoped>
.sessions-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: var(--spacing-md);
}

.page-title {
  font-family: var(--font-serif);
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
  font-size: 2rem;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem var(--spacing-md);
  color: var(--color-text);
  opacity: 0.7;
  font-family: var(--font-serif);
  font-style: italic;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.error-message {
  color: var(--color-secondary);
  padding: var(--spacing-md);
  background: rgba(122, 59, 46, 0.1);
  border: 1px solid rgba(122, 59, 46, 0.3);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-md);
}

.sessions-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-md);
  align-items: start;
}

/* Sidebar */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  max-height: 70vh;
  overflow-y: auto;
  padding-right: var(--spacing-xs);
}

.session-item {
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.session-item:hover {
  border-color: var(--color-primary);
  background: rgba(201, 151, 78, 0.06);
}

.session-item.active {
  background: rgba(201, 151, 78, 0.12);
  border-color: var(--color-primary);
}

.session-title {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-date {
  font-size: 0.8rem;
  opacity: 0.55;
}

/* Main Detail */
.session-detail {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  min-height: 500px;
}

.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.detail-title {
  font-family: var(--font-serif);
  color: var(--color-primary);
  margin-top: 0;
  margin-bottom: var(--spacing-xs);
}

.detail-meta {
  opacity: 0.55;
  font-size: 0.9rem;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-sm);
}

.queries-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.query-card {
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
}

.query-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
  font-size: 0.85rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.query-mode {
  color: var(--color-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.query-time {
  opacity: 0.55;
}

.query-text {
  font-family: var(--font-serif);
  font-size: 1.05rem;
  color: var(--color-text);
  font-style: italic;
  margin-bottom: var(--spacing-xs);
}

.query-model {
  font-size: 0.8rem;
  opacity: 0.45;
  text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
  .sessions-layout {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  .sessions-list {
    max-height: 280px;
  }
  .session-detail {
    min-height: unset;
  }
}
</style>

