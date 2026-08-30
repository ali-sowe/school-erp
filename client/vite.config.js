import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname doesn't exist in native ESM (this file runs as ESM per
// package.json's "type": "module") — derive it from import.meta.url instead.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // shadcn/ui components import via "@/lib/..." — this alias is what
      // makes those imports resolve without a relative-path rewrite.
      '@': path.resolve(__dirname, './src'),
    },
  },
})
