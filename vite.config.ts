import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://pdfconvertbackendexpress-production.up.railway.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
