import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vnovaPlugin from './vite-plugin/index.js'

export default defineConfig({
  root: 'docs-example',
  plugins: [
    vue(),
    vnovaPlugin({
      // global characters registry — merged with any per-script registry
      characters: {},
      validateOnBuild: true,
    }),
  ],
})
