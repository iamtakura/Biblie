<template>
  <div class="sessions-page">
    <h1 class="page-title">Session History</h1>

    <div v-if="sessionsStore.isLoadingList" class="loading-state">
      Loading your sessions...
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
          Loading session details...
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
  padding: var(--spacing-lg);
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
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
  font-family: var(--font-serif);
  font-style: italic;
}

.error-message {
  color: #ef4444;
  padding: var(--spacing-md);
  background: rgba(239, 68, 68, 0.1);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.sessions-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: var(--spacing-xl);
  align-items: start;
}

/* Sidebar */
.sessions-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-height: 70vh;
  overflow-y: auto;
  padding-right: var(--spacing-sm);
}

.session-item {
  padding: var(--spacing-md);
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.session-item:hover {
  border-color: var(--color-primary-light);
  transform: translateY(-1px);
}

.session-item.active {
  background: var(--color-primary-dark);
  border-color: var(--color-primary);
}

.session-title {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-date {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

/* Main Detail */
.session-detail {
  background: var(--color-bg-alt);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  min-height: 500px;
}

.detail-empty {
  margin-top: 100px;
}

.detail-title {
  font-family: var(--font-serif);
  color: var(--color-primary-light);
  margin-top: 0;
  margin-bottom: var(--spacing-xs);
}

.detail-meta {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-md);
}

.queries-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.query-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.query-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: 0.85rem;
}

.query-mode {
  color: var(--color-primary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.query-time {
  color: var(--color-text-muted);
}

.query-text {
  font-family: var(--font-serif);
  font-size: 1.1rem;
  color: var(--color-text);
  font-style: italic;
  margin-bottom: var(--spacing-sm);
}

.query-model {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: right;
}

/* Responsive */
@media (max-width: 768px) {
  .sessions-layout {
    grid-template-columns: 1fr;
  }
  .sessions-list {
    max-height: 300px;
  }
}
</style>
