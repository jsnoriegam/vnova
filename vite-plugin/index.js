/**
 * vnova-engine — vite-plugin/index.js
 *
 * Usage in vite.config.js:
 *
 *   import { defineConfig } from 'vite'
 *   import vue from '@vitejs/plugin-vue'
 *   import vnovaPlugin from 'vnova-engine/vite-plugin'
 *
 *   export default defineConfig({
 *     plugins: [vue(), vnovaPlugin()],
 *   })
 *
 * What it does:
 *   1. Injects 'vnova-engine' as a resolved alias pointing to this package's src/
 *   2. In dev mode, validates all scripts at transform time and emits readable warnings
 *   3. Allows importing *.vnovel.js files (optional script convention)
 *   4. Provides a virtual module `virtual:vnova-config` that exposes merged options
 */

import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkgRoot   = path.resolve(__dirname, '..')

/**
 * @param {object} [pluginOptions]
 * @param {object} [pluginOptions.characters]          — global character registry (merged into all scripts)
 * @param {boolean}[pluginOptions.validateOnBuild=true] — run validator during `vite build`
 * @param {boolean}[pluginOptions.warnOnly=false]       — turn validation errors into warnings
 * @returns {import('vite').Plugin}
 */
export default function vnovaPlugin(pluginOptions = {}) {
  const {
    characters      = {},
    validateOnBuild = true,
    warnOnly        = false,
  } = pluginOptions

  const virtualModuleId    = 'virtual:vnova-config'
  const resolvedVirtualId  = '\0' + virtualModuleId

  return {
    name: 'vnova-engine',
    enforce: 'pre',

    // ── Resolve the package root so `import ... from 'vnova-engine'` always
    //    points to the local source during development.
    resolveId(id) {
      if (id === virtualModuleId)    return resolvedVirtualId
      if (id === 'vnova-engine')     return path.join(pkgRoot, 'src', 'index.js')
      if (id === 'vnova-engine/vite-plugin') return __filename
    },

    // ── Virtual module: runtime-accessible config ──────────────────────────
    load(id) {
      if (id !== resolvedVirtualId) return

      return `
        export const characters = ${JSON.stringify(characters)};
        export const version = '${getVersion()}';
      `
    },

    // ── Transform hook: validate *.vnovel.js scripts in dev + build ────────
    async transform(code, id) {
      const isScript = id.endsWith('.vnovel.js') || id.endsWith('.vnovel.ts')
      if (!isScript) return null

      const isDev   = process.env.NODE_ENV !== 'production'
      const doCheck = isDev || validateOnBuild

      if (!doCheck) return null

      // Lazy-import the validator (avoids circular dep at plugin load time)
      const { validateScript, validateMultiLanguageScript } = await import('../src/core/validator.js')

      try {
        // We eval the module in a restricted context to extract the default export.
        // In a real npm package you'd use a proper AST transform; this is a
        // lightweight dev-time approach.
        const fnBody = code
          .replace(/^import\s[^;]+;?\n?/gm, '') // strip ES imports (simplified)
          .replace(/^export default\s/, 'return ')
        const fn = new Function(fnBody) // eslint-disable-line no-new-func
        const script = fn()

        if (Array.isArray(script)) {
          const warnings = validateScript(script, characters)
          warnings.forEach(w => this.warn(`[vnova] ${id}\n  ${w}`))
        } else if (script && typeof script === 'object') {
          const warnings = validateMultiLanguageScript(script, characters)
          warnings.forEach(w => this.warn(`[vnova] ${id}\n  ${w}`))
        }
      } catch (e) {
        // validation failure
        const msg = `[vnova] Script validation error in ${id}:\n${e.message}`
        if (warnOnly) this.warn(msg)
        else          this.error(msg)
      }

      return null // don't transform the code
    },

    // ── Config hook: add optimizeDeps so Vite pre-bundles correctly ─────────
    config() {
      return {
        optimizeDeps: {
          exclude: ['vnova-engine'],
        },
      }
    },
  }
}

function getVersion() {
  try {
    const req = createRequire(import.meta.url)
    return req(path.join(pkgRoot, 'package.json')).version
  } catch { return '0.0.0' }
}
