import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    host: 'localhost',
    strictPort: true,
    open: true,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  }
})
