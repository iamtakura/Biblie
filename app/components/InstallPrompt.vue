<template>
  <ClientOnly>
    <div v-if="showPrompt" class="install-prompt-banner" role="banner" aria-label="Install app prompt">
      <div class="prompt-content">
        <div class="prompt-header">
          <img src="/icons/favicon-32.png" alt="Biblie icon" class="app-icon-img" width="36" height="36" />
          <div class="prompt-text">
            <span class="prompt-title">Install Biblie</span>
            <span class="prompt-desc" v-if="isIOS">
              Tap <span class="ios-share-badge">Share ⎋</span> then <strong>Add to Home Screen</strong> for the best experience.
            </span>
            <span class="prompt-desc" v-else>
              Add Biblie to your home screen for quick, offline-capable Bible study.
            </span>
          </div>
        </div>

        <div class="prompt-actions">
          <button v-if="!isIOS && deferredPrompt" @click="triggerInstall" class="btn-install">
            Install
          </button>
          <button @click="dismissPrompt" class="btn-dismiss" aria-label="Dismiss prompt">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showPrompt = ref(false)
const isIOS = ref(false)
const deferredPrompt = ref<any>(null)

onMounted(() => {
  if (typeof window === 'undefined') return

  // Check if app is already running in standalone mode (installed)
  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true

  if (isStandalone) return

  // Check dismissal history
  const isDismissed = localStorage.getItem('biblie_pwa_dismissed') === 'true'
  if (isDismissed) return

  // Increment session counter
  const sessions = parseInt(localStorage.getItem('biblie_session_count') || '0', 10) + 1
  localStorage.setItem('biblie_session_count', sessions.toString())

  // Only trigger contextually (after user's 2nd or subsequent session/visit)
  if (sessions < 2) return

  // Detect iOS Safari
  const ua = window.navigator.userAgent.toLowerCase()
  const isIosDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream
  const isSafari = ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios') && !ua.includes('edgios')

  if (isIosDevice && isSafari) {
    isIOS.value = true
    showPrompt.value = true
    return
  }

  // Handle Android / Chromium beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e
    showPrompt.value = true
  })
})

const triggerInstall = async () => {
  if (!deferredPrompt.value) return
  deferredPrompt.value.prompt()
  const choiceResult = await deferredPrompt.value.userChoice
  if (choiceResult.outcome === 'accepted') {
    localStorage.setItem('biblie_pwa_dismissed', 'true')
  }
  deferredPrompt.value = null
  showPrompt.value = false
}

const dismissPrompt = () => {
  localStorage.setItem('biblie_pwa_dismissed', 'true')
  showPrompt.value = false
}
</script>

<style scoped>
.install-prompt-banner {
  position: fixed;
  bottom: calc(16px + env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 520px;
  background-color: var(--color-surface);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  animation: slideUp 0.3s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.prompt-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.prompt-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.app-icon-img {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  flex-shrink: 0;
  object-fit: contain;
}

.prompt-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.prompt-title {
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-primary);
}

.prompt-desc {
  font-size: 0.8rem;
  color: var(--color-text);
  opacity: 0.9;
  line-height: 1.3;
}

.ios-share-badge {
  background-color: rgba(201, 151, 78, 0.15);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--color-primary);
  font-weight: 500;
}

.prompt-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-install {
  background-color: var(--color-primary);
  color: var(--color-bg);
  border: none;
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.875rem;
  padding: 0 16px;
  min-height: 44px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.btn-install:hover {
  opacity: 0.9;
}

.btn-dismiss {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  padding: 0 12px;
  min-height: 44px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s, border-color 0.2s;
}

.btn-dismiss:hover {
  opacity: 1;
  border-color: var(--color-primary);
}

@media (max-width: 480px) {
  .prompt-content {
    flex-direction: column;
    align-items: stretch;
  }
  
  .prompt-actions {
    justify-content: flex-end;
    margin-top: 4px;
  }
}
</style>
