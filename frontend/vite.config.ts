import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Get backend URLs from environment variables with fallbacks
  const chatBaseUrl = env.VITE_CHAT_BASE_URL || 'http://127.0.0.1:8000'
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:4000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/chat': {
          target: chatBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/session': {
          target: chatBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/history': {
          target: chatBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/generate-title': {
          target: chatBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/generate-title/, '/generate-title'),
        },
        '/api-keys': {
          target: chatBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
