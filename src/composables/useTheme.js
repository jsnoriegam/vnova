/**
 * vnova-engine — composables/useTheme.js
 *
 * Composable for managing visual themes.
 * Provides reactive access to current theme, available themes,
 * and functions to apply/register themes.
 *
 * Usage:
 *   const { currentThemeId, availableThemes, applyTheme } = useTheme()
 *   applyTheme('dark')
 */

import { computed } from 'vue'
import { useVNovaStore } from '../core/store.js'
import { getTheme, getAllThemes, registerTheme, registerThemes as registerThemesInRegistry } from '../theme/index.js'

export function useTheme() {
  const store = useVNovaStore()

  // Current theme ID from store settings
  const currentThemeId = computed({
    get: () => store.settings.theme || 'default',
    set: (id) => store.setSetting({ key: 'theme', value: id }),
  })

  // Current theme object (reactive)
  const currentTheme = computed(() => getTheme(currentThemeId.value))

  // List of all available themes (reactive)
  const availableThemes = computed(() => getAllThemes())

  /**
   * Apply a theme by ID — sets CSS custom properties on :root
   * @param {string} themeId - Theme identifier
   * @returns {boolean} True if applied successfully
   */
  function applyTheme(themeId) {
    const theme = getTheme(themeId)
    if (!theme) {
      console.warn('[vnova] Theme not found:', themeId)
      return false
    }

    const root = document.documentElement
    Object.entries(theme.variables).forEach(([prop, value]) => {
      root.style.setProperty(prop, value)
    })

    // Persist the selection in store
    store.setSetting({ key: 'theme', value: themeId })
    return true
  }

  /**
   * Initialize theme on app mount — restores saved theme or applies default
   */
  function initTheme() {
    const savedTheme = store.settings.theme || 'default'
    applyTheme(savedTheme)
  }

  /**
   * Register custom themes from config
   * @param {Array} themesArray - Array of theme definitions
   */
  function registerCustomThemes(themesArray) {
    registerThemesInRegistry(themesArray)
  }

  return {
    currentThemeId,
    currentTheme,
    availableThemes,
    applyTheme,
    initTheme,
    registerCustomThemes,
  }
}
