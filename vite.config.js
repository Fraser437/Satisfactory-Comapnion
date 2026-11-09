import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import vitePluginElectron from 'vite-plugin-electron'
import vitePluginElectronRenderer from 'vite-plugin-electron-renderer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePluginElectron([
      {
        entry: 'main.js',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        entry: 'preload.js',
        onstart(options) {
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    vitePluginElectronRenderer(),
  ],
  server: {
    port: 5173,
  },
})