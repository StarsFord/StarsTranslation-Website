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
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/auth/patreon': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/auth/me': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/auth/logout': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/auth/dev-login': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
