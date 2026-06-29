import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

function disableViteDevClient() {
  return {
    name: 'petlife:disable-vite-dev-client',
    apply: 'serve',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/\s*<script type="module" src="\/@vite\/client"><\/script>\n?/, '\n')
      }
    }
  }
}

export default defineConfig({
  plugins: [disableViteDevClient(), vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/tests/**/*.test.js']
  },
  server: {
    allowedHosts: ['petlife.20050129.xyz'],
    hmr: false,
    ws: false,
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true
      }
    }
  }
})
