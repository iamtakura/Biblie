<template>
  <div class="layout-container">
    <header class="app-header">
      <div class="header-content">
        <NuxtLink to="/" class="logo" @click="mobileMenuOpen = false">
          <span class="logo-icon">B</span>
          <span class="logo-text">Biblie</span>
        </NuxtLink>

        <!-- Mobile Toggle Button -->
        <button 
          class="mobile-toggle-btn" 
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle menu"
        >
          <span class="toggle-icon">{{ mobileMenuOpen ? '✕' : '☰' }}</span>
        </button>

        <nav class="header-nav" :class="{ 'is-open': mobileMenuOpen }">
          <NuxtLink to="/study" class="nav-link" @click="mobileMenuOpen = false">Study</NuxtLink>
          <NuxtLink v-if="auth.user" to="/sessions" class="nav-link" @click="mobileMenuOpen = false">Sessions</NuxtLink>
          <button v-if="auth.user" @click="onNewSession" class="btn-new-session">New Session</button>
          
          <div class="header-widgets">
            <ClientOnly>
              <StreakIndicator />
              <UsageMeter />
            </ClientOnly>
            <div v-if="auth.user" class="auth-menu">
              <button @click="onLogout" class="btn-text">Log Out</button>
            </div>
            <div v-else class="auth-menu">
              <NuxtLink to="/auth/login" class="nav-link" @click="mobileMenuOpen = false">Log In</NuxtLink>
            </div>
          </div>
        </nav>
      </div>
    </header>
    <main class="main-content">
      <slot />
    </main>
    <InstallPrompt />
    <ClientOnly>
      <CommandIntroModal v-if="showCommandIntro" @dismissed="showCommandIntro = false" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'
import { useStudyStore } from '~/stores/study'
import { useSessionsStore } from '~/stores/sessions'
import InstallPrompt from '~/components/InstallPrompt.vue'
import CommandIntroModal from '~/components/CommandIntroModal.vue'

const auth = useAuthStore()
const router = useRouter()
const studyStore = useStudyStore()
const sessionsStore = useSessionsStore()
const mobileMenuOpen = ref(false)
const showCommandIntro = ref(false)

onMounted(async () => {
  if (auth.user) {
    try {
      const usage = await $fetch<{ has_seen_command_intro: boolean }>('/api/usage')
      if (!usage?.has_seen_command_intro) {
        showCommandIntro.value = true
      }
    } catch {
      // silently ignore — don't block the app
    }
  }
})

const onLogout = async () => {
  mobileMenuOpen.value = false
  await auth.signOut()
}

const onNewSession = () => {
  mobileMenuOpen.value = false
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
  padding-top: max(0px, env(safe-area-inset-top));
}

.header-content {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: var(--spacing-xs) var(--spacing-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-primary);
  font-family: var(--font-serif);
  min-height: 44px;
}

.logo:hover {
  opacity: 1;
}

.logo-icon {
  font-size: 1.5rem;
  font-weight: 600;
  border: 1px solid var(--color-primary);
  border-radius: 4px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 1px;
}

.mobile-toggle-btn {
  display: none;
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text);
  min-width: 44px;
  min-height: 44px;
  border-radius: 4px;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
}

.mobile-toggle-btn:focus-visible {
  outline: 2px solid var(--color-primary);
}

.header-nav {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.nav-link,
.btn-new-session,
.btn-text {
  background: transparent;
  border: none;
  color: var(--color-text);
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 0 var(--spacing-sm);
  min-height: 44px;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
  text-decoration: none;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  margin-left: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  border-left: 1px solid var(--color-border);
}

.auth-menu {
  display: flex;
  align-items: center;
}

.main-content {
  flex: 1;
  max-width: var(--max-width);
  margin: 0 auto;
  width: 100%;
  padding: var(--spacing-md);
  padding-bottom: max(var(--spacing-md), env(safe-area-inset-bottom));
}

@media (max-width: 640px) {
  .mobile-toggle-btn {
    display: flex;
  }

  .header-nav {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: rgba(28, 23, 18, 0.98);
    border-bottom: 1px solid var(--color-border);
    flex-direction: column;
    align-items: stretch;
    padding: var(--spacing-sm) var(--spacing-md);
    gap: var(--spacing-xs);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .header-nav.is-open {
    display: flex;
  }

  .nav-link,
  .btn-new-session,
  .btn-text {
    width: 100%;
    justify-content: flex-start;
    padding: 0 var(--spacing-sm);
    min-height: 48px;
    border-radius: 4px;
  }

  .header-widgets {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid var(--color-border);
    padding-top: var(--spacing-xs);
    margin-top: var(--spacing-xs);
    justify-content: space-between;
    width: 100%;
  }
}
</style>
