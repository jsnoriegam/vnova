import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vnova-engine/i18n/es.js': fileURLToPath(new URL('./src/i18n/locales/es.js', import.meta.url)),
      'vnova-engine/i18n/en.js': fileURLToPath(new URL('./src/i18n/locales/en.js', import.meta.url)),
      'vnova-engine': fileURLToPath(new URL('./src/index.js', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    restoreMocks: true,
  },
})
