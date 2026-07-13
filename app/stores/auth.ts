import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const supabaseUser = useSupabaseUser()
  const supabase = useSupabaseClient()
  
  const user = computed(() => supabaseUser.value)
  const isAuthenticated = computed(() => !!user.value)

  async function signOut() {
    await supabase.auth.signOut()
    // Redirect to login or home can be handled by components
    navigateTo('/auth/login')
  }

  return {
    user,
    isAuthenticated,
    signOut
  }
})
