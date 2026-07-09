import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pin the dev port so the Supabase Auth redirect-URL allowlist stays stable.
  // strictPort makes Vite fail loudly instead of silently hopping to 5174.
  server: {
    port: 5174,
    strictPort: true,
  },
})
