import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  server: {
    https: true,
    strictPort: true,
    port: 5186,
  },
  plugins: [
    mkcert(),
    vue(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],
  define: {
    'process.env': {},
  },
})
