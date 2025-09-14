import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5642,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'rfpsgame.boondit.site'
    ]
  },
  preview: {
    port: 5642,
    host: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'rfpsgame.boondit.site'
    ]
  }
})
