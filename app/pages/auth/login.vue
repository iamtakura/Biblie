<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="card-title">Log In</h1>
      <p class="card-subtitle">Continue your study of the traditions.</p>
      
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            required 
            placeholder="scholar@example.com"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            required 
            placeholder="••••••••"
          />
        </div>
        
        <div v-if="error" class="error-msg">{{ error }}</div>
        
        <button type="submit" class="submit-btn" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Log In' }}
        </button>
      </form>
      
      <div class="auth-footer">
        Don't have an account? 
        <NuxtLink to="/auth/signup">Sign Up</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    
    if (authError) throw authError
    
    navigateTo('/')
  } catch (err: any) {
    error.value = err.message || 'Failed to log in'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* See app/assets/css/main.css for shared auth styles or define here */
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.auth-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.card-title {
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xs);
}

.card-subtitle {
  text-align: center;
  opacity: 0.7;
  font-family: var(--font-serif);
  font-style: italic;
  margin-bottom: var(--spacing-md);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.875rem;
  color: var(--color-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.form-group input {
  background-color: rgba(0,0,0,0.2);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  padding: 10px 12px;
  font-size: 16px;
  min-height: 44px;
  border-radius: 4px;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.submit-btn {
  background-color: var(--color-primary);
  color: var(--color-bg);
  border: none;
  padding: 0 16px;
  min-height: 44px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 1rem;
  margin-top: var(--spacing-sm);
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.error-msg {
  color: var(--color-secondary);
  font-size: 0.875rem;
  background-color: rgba(122, 59, 46, 0.1);
  padding: 8px;
  border-radius: 4px;
  border: 1px solid rgba(122, 59, 46, 0.3);
}

.auth-footer {
  margin-top: var(--spacing-md);
  text-align: center;
  font-size: 0.875rem;
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-md);
}
</style>
