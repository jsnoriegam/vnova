import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'vnova-engine',
  description: 'Vue 3 visual novel framework — script-first, Vite-native',
  base: '/vnova/',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'API Reference', link: '/api/script-steps' },
      { text: 'Demo', link: 'https://jsnoriegam.github.io/vnova/demo/' },
    ],
    
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'No-Code Workflow', link: '/guide/no-code' },
          { text: 'Script DSL', link: '/guide/script-dsl' },
          { text: 'Visual Effects', link: '/guide/visual-effects' },
        ]
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Script Steps', link: '/api/script-steps' },
          { text: 'Composables', link: '/api/composables' },
          { text: 'Components', link: '/api/components' },
        ]
      }
    ],
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/jsnoriegam/vnova' }
    ],
    
    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2026 jsnoriegam'
    }
  },
  
  ignoreDeadLinks: true
})
