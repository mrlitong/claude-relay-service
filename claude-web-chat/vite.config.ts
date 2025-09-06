import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 代理API请求到远程relay service
      '/api': {
        target: 'http://149.88.90.105:8888',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 移除会触发CORS检查的浏览器头
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('host');
            // 设置为类似CLI的User-Agent
            proxyReq.setHeader('user-agent', 'claude-web-chat/1.0.0');
            console.log('[Vite Proxy] Forwarding request, removed CORS headers');
          });
        },
      },
    },
  },
})