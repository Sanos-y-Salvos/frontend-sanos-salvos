import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      // API Gateway (auth, users, soporte, mascotas)
      '/gw': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gw/, ''),
      },
      // Mensajería (REST de salas)
      '/salas': {
        target: 'http://localhost:3006',
        changeOrigin: true,
      },
      // Mensajería (WebSocket / Socket.IO)
      '/socket.io': {
        target: 'http://localhost:3006',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
