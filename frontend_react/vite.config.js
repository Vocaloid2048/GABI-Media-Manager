import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: true,
      port: parseInt(env.PORT) || 5173,
      https: {
        key: fs.readFileSync('./cert/key.pem', 'utf8'),
        cert: fs.readFileSync('./cert/cert.pem', 'utf8'),
      },
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          xfwd: true, // Add X-Forwarded-For headers
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              // Handle client disconnects (close, aborted, error)
              const cleanup = () => {
                if (!req.complete && !proxyReq.destroyed) {
                   console.log('Client disconnected, destroying proxy request');
                   proxyReq.destroy();
                }
              };
              
              req.on('close', cleanup);
              req.on('aborted', cleanup);
              req.on('error', cleanup);
              // Listen to socket events for more reliable disconnect detection
              if(req.socket) req.socket.on('close', cleanup);
            });
          },
        },
      },
    },
  }
})
