import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Stamp the service worker with the build time so every deploy updates the installed app.
function stampServiceWorker() {
  let outDir = 'dist'
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir) },
    closeBundle() {
      const file = resolve(outDir, 'sw.js')
      writeFileSync(file, readFileSync(file, 'utf8').replaceAll('__BUILD__', Date.now().toString(36)))
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react(), stampServiceWorker()],
  server: {
    watch: { ignored: ['**/.tools/**'] },
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.host) proxyReq.setHeader('x-forwarded-host', req.headers.host)
          })
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.headers.host) proxyReq.setHeader('x-forwarded-host', req.headers.host)
          })
        },
      },
    },
  },
})
