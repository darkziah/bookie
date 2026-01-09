import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components/ui': path.resolve(__dirname, '../../packages/ui/src/components/ui'),
      '@/lib/utils': path.resolve(__dirname, '../../packages/ui/src/lib/utils'),
      '@convex': path.resolve(__dirname, '../../convex'),
    },
  },
  clearScreen: false,
  server: {
    port: 5175,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: 'ws',
        host,
        port: 5175,
      }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    fs: {
      allow: ['../../'],
    },
  },
})
