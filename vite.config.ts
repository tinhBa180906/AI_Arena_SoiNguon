import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const ollamaTarget = env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/ollama': {
          target: ollamaTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ollama/, ''),
        },
      },
    },
  }
})
