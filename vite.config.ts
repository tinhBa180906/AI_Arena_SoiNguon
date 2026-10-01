import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ollamaTarget = env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434'
  const geminiApiKey = env.VITE_GEMINI_API_KEY?.trim()

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/ollama': {
          target: ollamaTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ollama/, ''),
        },
        '/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          headers: geminiApiKey ? { 'x-goog-api-key': geminiApiKey } : {},
          rewrite: (path) => path.replace(/^\/gemini/, ''),
        },
      },
    },
  }
})
