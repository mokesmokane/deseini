import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  server: {
    proxy: {
      // Proxy API requests to our deployed API server
      '/api': {
        target: 'https://deseini-server.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})