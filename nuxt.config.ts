// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
  },

  css: ['~/assets/css/main.css'],

  modules: ['@nuxtjs/supabase', '@pinia/nuxt'],

  supabase: {
    redirectOptions: {
      login: '/auth/login',
      callback: '/auth/callback',
      exclude: ['/', '/api/health'],
    },
  },

  runtimeConfig: {
    // Private keys — only accessible server-side
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    groqApiKey: process.env.GROQ_API_KEY ?? '',
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    maxDailyRequests: Number(process.env.MAX_DAILY_REQUESTS ?? 50),
    promptVersion: Number(process.env.PROMPT_VERSION ?? 1),

    // Note: runtimeConfig.public.supabase.{url,key} are injected automatically
    // by @nuxtjs/supabase from NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY.
    // No manual mapping needed here.
  },
})

