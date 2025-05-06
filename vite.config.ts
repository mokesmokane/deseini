import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Determine the API server URL based on environment
const apiServer = process.env.VITE_API_SERVER || 'http://localhost:3001'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  server: {
    proxy: {
      // Proxy API requests to our Express server
      '/api': {
        target: apiServer,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})