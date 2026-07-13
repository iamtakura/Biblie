import { defineStore } from 'pinia'
import type { ChatSession, SessionDetail } from '~/../server/types'

export const useSessionsStore = defineStore('sessions', () => {
  // In-memory only session ID
  const activeSessionId = ref<string | null>(null)
  
  const sessionList = ref<ChatSession[]>([])
  const currentSessionDetail = ref<SessionDetail | null>(null)
  
  const isLoadingList = ref(false)
  const isLoadingDetail = ref(false)
  const error = ref<string | null>(null)

  function setActiveSession(id: string) {
    activeSessionId.value = id
  }

  function clearSession() {
    activeSessionId.value = null
  }

  async function createNewSession() {
    try {
      error.value = null
      const res = await $fetch<{ id: string }>('/api/sessions/new', {
        method: 'POST',
      })
      activeSessionId.value = res.id
      return res.id
    } catch (e: any) {
      console.error('Failed to create new session', e)
      error.value = e.data?.message || e.message || 'Failed to create new session'
    }
  }

  async function fetchSessionList() {
    isLoadingList.value = true
    error.value = null
    try {
      const data = await $fetch<ChatSession[]>('/api/sessions')
      sessionList.value = data || []
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to load sessions'
    } finally {
      isLoadingList.value = false
    }
  }

  async function fetchSessionDetail(id: string) {
    isLoadingDetail.value = true
    error.value = null
    try {
      const data = await $fetch<SessionDetail>(`/api/sessions/${id}`)
      currentSessionDetail.value = data
    } catch (e: any) {
      error.value = e.data?.message || e.message || 'Failed to load session details'
    } finally {
      isLoadingDetail.value = false
    }
  }

  return {
    activeSessionId,
    sessionList,
    currentSessionDetail,
    isLoadingList,
    isLoadingDetail,
    error,
    setActiveSession,
    clearSession,
    createNewSession,
    fetchSessionList,
    fetchSessionDetail,
  }
})
