/**
 * vnova-engine — theme/index.js
 *
 * Theme registry for managing visual themes.
 * Themes are collections of CSS custom property overrides.
 */

import { builtInThemes } from './themes.js'

// Registry of all available themes
const themes = new Map()

// Auto-register built-in themes
builtInThemes.forEach(theme => themes.set(theme.id, theme))

/**
 * Register a theme
 * @param {Object} theme - Theme definition
 * @param {string} theme.id - Unique theme identifier
 * @param {string} theme.name - Display name
 * @param {string} [theme.description] - Theme description
 * @param {Object} theme.variables - CSS custom property overrides
 * @returns {boolean} True if registered successfully
 */
export function registerTheme(theme) {
  if (!theme || !theme.id || !theme.variables) {
    console.warn('[vnova] Invalid theme: must have id and variables')
    return false
  }
  themes.set(theme.id, theme)
  return true
}

/**
 * Get a theme by ID
 * @param {string} id - Theme identifier
 * @returns {Object|undefined} Theme definition or undefined
 */
export function getTheme(id) {
  return themes.get(id)
}

/**
 * Get all registered themes
 * @returns {Array} Array of theme definitions
 */
export function getAllThemes() {
  return Array.from(themes.values())
}

/**
 * Check if a theme exists
 * @param {string} id - Theme identifier
 * @returns {boolean} True if theme exists
 */
export function hasTheme(id) {
  return themes.has(id)
}

/**
 * Remove a theme (except built-ins)
 * @param {string} id - Theme identifier
 * @returns {boolean} True if removed successfully
 */
export function unregisterTheme(id) {
  const builtIn = ['default', 'dark', 'light', 'ocean', 'forest']
  if (builtIn.includes(id)) {
    console.warn('[vnova] Cannot unregister built-in theme:', id)
    return false
  }
  return themes.delete(id)
}

/**
 * Register multiple themes at once
 * @param {Array} themesArray - Array of theme definitions
 */
export function registerThemes(themesArray) {
  if (!Array.isArray(themesArray)) return
  themesArray.forEach(theme => registerTheme(theme))
}
