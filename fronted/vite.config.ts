import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// /api/* -> Ixchel engine API (ixchel/api.py). Start it with: cd ixchel && uvicorn api:app --port 8000
const ixchelProxy = {
  target: process.env.IXCHEL_API || 'http://127.0.0.1:8000',
  changeOrigin: true,
  rewrite: (p: string) => p.replace(/^\/api/, ''),
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    proxy: { '/api': ixchelProxy },
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
    proxy: { '/api': ixchelProxy },
  },
})
