<template>
  <div class="layout-container">
    <header class="app-header">
      <div class="header-content">
        <NuxtLink to="/" class="logo">
          <span class="logo-icon">B</span>
          <span class="logo-text">Biblie</span>
        </NuxtLink>
        <nav class="header-nav">
          <NuxtLink to="/study" class="nav-link">Study</NuxtLink>
          <NuxtLink v-if="auth.user" to="/sessions" class="nav-link">Sessions</NuxtLink>
          <button v-if="auth.user" @click="handleNewSession" class="btn-new-session">New Session</button>
          <div class="header-widgets">
            <ClientOnly>
              <StreakIndicator />
              <UsageMeter />
            </ClientOnly>
            <div v-if="auth.user" class="auth-menu">
              <button @click="handleLogout" class="btn-text">Log Out</button>
            </div>
            <div v-else class="auth-menu">
              <NuxtLink to="/auth/login" class="nav-link">Log In</NuxtLink>
            </div>
          </div>
        </nav>
      </div>
    </header>
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useStudyStore } from '~/stores/study'
import { useSessionsStore } from '~/stores/sessions'

const auth = useAuthStore()
const router = useRouter()
const studyStore = useStudyStore()
const sessionsStore = useSessionsStore()

const handleLogout = async () => {
  await auth.signOut()
}

const handleNewSession = () => {
  sessionsStore.clearSession()
  studyStore.clearCurrentPassage()
  router.push('/')
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  border-bottom: 1px solid var(--color-border);
  background-color: rgba(28, 23, 18, 0.95);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.header-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  font-family: var(--font-serif);
}

.logo:hover {
  opacity: 1;
}

.logo-icon {
  font-size: 1.5rem;
  font-weight: 600;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.nav-link,
.btn-new-session,
.btn-text {
  background: transparent;
  border: none;
  color: var(--color-text);
  font-family: inherit;
  font-size: 1rem;
  font-weight: 500;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
  text-decoration: none;
  outline: none;
}

.nav-link:hover,
.nav-link.router-link-active,
.btn-new-session:hover,
.btn-text:hover {
  color: var(--color-primary);
  background-color: rgba(212, 175, 55, 0.1);
}

.header-widgets {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: var(--spacing-md);
  padding-left: var(--spacing-md);
  border-left: 1px solid var(--color-border);
}

.main-content {
  flex: 1;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
  padding: var(--spacing-lg) var(--spacing-md);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .header-widgets {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-sm);
    width: 100%;
    justify-content: space-between;
  }
}
</style>
