import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5001, // Cổng chạy frontend
    proxy: {
      // Cấu hình Proxy để gọi sang Backend (Express) không bị lỗi CORS
      '/api': {
        target: 'http://localhost:5000', // Đổi port 5000 theo đúng port backend của bạn
        changeOrigin: true,
        secure: false,
      },
    },
  },
})