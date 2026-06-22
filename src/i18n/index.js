/**
 * vnova-engine — i18n/index.js
 *
 * Lightweight i18n system for GUI translations.
 * Built-in English is always available as fallback.
 * Additional locales are tree-shakeable via imports.
 *
 * Usage:
 *   import es from 'vnova-engine/i18n/es'
 *   config: { guiTranslations: { es } }
 */
import en from './locales/en.js'

const BUILT_IN_LOCALES = { en }

function resolveKey(obj, key) {
  const parts = key.split('.')
  let current = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function createI18n(locale, guiTranslations = {}) {
  const pool = { ...BUILT_IN_LOCALES, ...guiTranslations }
  const activeLocale = locale || 'en'

  return {
    t(key, params = {}) {
      const active = pool[activeLocale]
      let value = resolveKey(active, key)
      if (value != null) return interpolate(value, params)

      const fallback = resolveKey(BUILT_IN_LOCALES.en, key)
      if (fallback != null) return interpolate(fallback, params)

      return key
    },
    locale: activeLocale,
  }
}

function interpolate(template, params) {
  if (!params || Object.keys(params).length === 0) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`
  })
}

export { en as enLocale }
