import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://starstranslations-backend-805236256394.us-central1.run.app',
        changeOrigin: true
      },
      '/auth/patreon': {
        target: 'https://starstranslations-backend-805236256394.us-central1.run.app',
        changeOrigin: true
      },
      '/auth/me': {
        target: 'https://starstranslations-backend-805236256394.us-central1.run.app',
        changeOrigin: true
      },
      '/auth/logout': {
        target: 'https://starstranslations-backend-805236256394.us-central1.run.app',
        changeOrigin: true
      },
      '/auth/dev-login': {
        target: 'https://starstranslations-backend-805236256394.us-central1.run.app',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://starstranslations-backend-805236256394.us-central1.run.app',
        changeOrigin: true
      }
    }
  }
})
