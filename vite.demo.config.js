import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vnovaPlugin from './vite-plugin/index.js'

export default defineConfig({
  root: 'docs-example',
  base: '/vnova/demo/',
  plugins: [
    vue(),
    vnovaPlugin({
      characters: {},
      validateOnBuild: true,
    }),
  ],
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
})
