import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const LOCAL_BACKEND_URL = 'http://localhost:5000'
const ONLINE_BACKEND_URL = 'https://vlu-campusmarketweb.onrender.com'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_BASE_URL ||
    (mode === 'development' ? LOCAL_BACKEND_URL : ONLINE_BACKEND_URL)

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5001,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})