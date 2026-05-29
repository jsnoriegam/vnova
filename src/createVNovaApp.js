import { createApp } from 'vue'
import { createPinia } from 'pinia'

/**
 * Bootstraps a Vue app with Pinia pre-installed for VNova projects.
 *
 * @param {import('vue').Component} rootComponent
 * @param {object} [options]
 * @param {object} [options.props]
 * @param {import('pinia').Pinia} [options.pinia]
 * @param {Array<import('vue').Plugin | [import('vue').Plugin, ...unknown[]]>} [options.plugins]
 * @returns {import('vue').App}
 */
export function createVNovaApp(rootComponent, options = {}) {
  const {
    props = {},
    pinia = createPinia(),
    plugins = [],
  } = options

  const app = createApp(rootComponent, props)
  app.use(pinia)

  for (const pluginEntry of plugins) {
    if (Array.isArray(pluginEntry)) {
      const [plugin, ...args] = pluginEntry
      if (plugin) app.use(plugin, ...args)
      continue
    }
    if (pluginEntry) app.use(pluginEntry)
  }

  return app
}
