/**
 * vnova-engine — theme/themes.js
 *
 * Built-in theme definitions.
 * Each theme defines CSS custom property overrides for colors, typography, and layout.
 */

export const defaultTheme = {
  id: 'default',
  name: 'Default',
  description: 'The classic VNova purple theme',
  variables: {
    // Colors
    '--vnova-color-primary': '#a855f7',
    '--vnova-color-secondary': '#6366f1',
    '--vnova-color-text': '#e9d5ff',
    '--vnova-color-muted': '#9ca3af',
    '--vnova-color-dim': '#6b7280',
    '--vnova-color-surface': 'rgba(20, 15, 30, 0.9)',
    '--vnova-color-danger': '#c0392b',
    '--vnova-color-accent': '#4a6cf7',
    // Typography
    '--vnova-font-body': "'Georgia', serif",
    '--vnova-font-ui': "'Outfit', system-ui, sans-serif",
    '--vnova-font-title': "'Cinzel', serif",
    // Dialog
    '--vnova-dialog-height': '18%',
    '--vnova-dialog-padding': '0.8rem 1.2rem 0.95rem',
    '--vnova-dialog-bg': 'rgba(0, 0, 0, 0.56)',
    '--vnova-dialog-border': 'rgba(255, 255, 255, .12)',
    '--vnova-text-size': '1.15rem',
    '--vnova-text-line-height': '1.55',
    '--vnova-text-color': '#f0eaf8',
    '--vnova-think-color': '#d9d1e8',
    '--vnova-nameplate-size': '0.8rem',
    '--vnova-nameplate-color': '#fff',
    // Choices
    '--vnova-choices-bg': 'rgba(0, 0, 0, .65)',
    '--vnova-choice-size': '0.95rem',
    '--vnova-choice-color': '#f0eaf8',
    '--vnova-choice-bg': 'rgba(255, 255, 255, .08)',
    '--vnova-choice-border': 'rgba(255, 255, 255, .2)',
    '--vnova-choice-bg-hover': 'rgba(255, 255, 255, .18)',
    '--vnova-choice-radius': '6px',
    // Modals
    '--vnova-modal-bg': 'rgba(20, 15, 30, 0.9)',
    '--vnova-modal-border': 'rgba(168, 85, 247, 0.25)',
    '--vnova-modal-radius': '12px',
    '--vnova-modal-shadow': '0 10px 40px rgba(0, 0, 0, 0.5)',
    '--vnova-modal-max-width': '500px',
    '--vnova-modal-max-height': '80vh',
    // Stage
    '--vnova-stage-bg': '#000',
    '--vnova-bg-duration': '400ms',
    '--vnova-sprite-bottom': '0px',
    // HUD
    '--vnova-hud-bg': 'rgba(14, 10, 24, 0.78)',
    '--vnova-hud-border': 'rgba(240, 234, 248, 0.2)',
    '--vnova-hud-text': 'rgba(245, 239, 252, 0.88)',
  }
}

export const darkTheme = {
  id: 'dark',
  name: 'Dark',
  description: 'Pure dark mode with blue accents',
  variables: {
    // Colors
    '--vnova-color-primary': '#3b82f6',
    '--vnova-color-secondary': '#1d4ed8',
    '--vnova-color-text': '#e2e8f0',
    '--vnova-color-muted': '#94a3b8',
    '--vnova-color-dim': '#64748b',
    '--vnova-color-surface': 'rgba(15, 23, 42, 0.95)',
    '--vnova-color-danger': '#ef4444',
    '--vnova-color-accent': '#06b6d4',
    // Typography
    '--vnova-font-body': "system-ui, -apple-system, sans-serif",
    '--vnova-font-ui': "system-ui, -apple-system, sans-serif",
    '--vnova-font-title': "system-ui, -apple-system, sans-serif",
    // Dialog
    '--vnova-dialog-height': '18%',
    '--vnova-dialog-padding': '0.8rem 1.2rem 0.95rem',
    '--vnova-dialog-bg': 'rgba(0, 0, 0, 0.75)',
    '--vnova-dialog-border': 'rgba(255, 255, 255, .08)',
    '--vnova-text-size': '1.15rem',
    '--vnova-text-line-height': '1.55',
    '--vnova-text-color': '#e2e8f0',
    '--vnova-think-color': '#94a3b8',
    '--vnova-nameplate-size': '0.8rem',
    '--vnova-nameplate-color': '#f1f5f9',
    // Choices
    '--vnova-choices-bg': 'rgba(0, 0, 0, .8)',
    '--vnova-choice-size': '0.95rem',
    '--vnova-choice-color': '#e2e8f0',
    '--vnova-choice-bg': 'rgba(255, 255, 255, .06)',
    '--vnova-choice-border': 'rgba(255, 255, 255, .12)',
    '--vnova-choice-bg-hover': 'rgba(59, 130, 246, .2)',
    '--vnova-choice-radius': '8px',
    // Modals
    '--vnova-modal-bg': 'rgba(15, 23, 42, 0.95)',
    '--vnova-modal-border': 'rgba(59, 130, 246, 0.2)',
    '--vnova-modal-radius': '12px',
    '--vnova-modal-shadow': '0 10px 40px rgba(0, 0, 0, 0.7)',
    '--vnova-modal-max-width': '500px',
    '--vnova-modal-max-height': '80vh',
    // Stage
    '--vnova-stage-bg': '#0f172a',
    '--vnova-bg-duration': '400ms',
    '--vnova-sprite-bottom': '0px',
    // HUD
    '--vnova-hud-bg': 'rgba(15, 23, 42, 0.9)',
    '--vnova-hud-border': 'rgba(226, 232, 240, 0.15)',
    '--vnova-hud-text': 'rgba(226, 232, 240, 0.9)',
  }
}

export const lightTheme = {
  id: 'light',
  name: 'Light',
  description: 'Clean light theme with indigo accents',
  variables: {
    // Colors
    '--vnova-color-primary': '#6366f1',
    '--vnova-color-secondary': '#4f46e5',
    '--vnova-color-text': '#1e293b',
    '--vnova-color-muted': '#64748b',
    '--vnova-color-dim': '#94a3b8',
    '--vnova-color-surface': 'rgba(255, 255, 255, 0.95)',
    '--vnova-color-danger': '#dc2626',
    '--vnova-color-accent': '#0ea5e9',
    // Typography
    '--vnova-font-body': "'Georgia', serif",
    '--vnova-font-ui': "system-ui, -apple-system, sans-serif",
    '--vnova-font-title': "'Cinzel', serif",
    // Dialog
    '--vnova-dialog-height': '18%',
    '--vnova-dialog-padding': '0.8rem 1.2rem 0.95rem',
    '--vnova-dialog-bg': 'rgba(255, 255, 255, 0.7)',
    '--vnova-dialog-border': 'rgba(0, 0, 0, .1)',
    '--vnova-text-size': '1.15rem',
    '--vnova-text-line-height': '1.55',
    '--vnova-text-color': '#1e293b',
    '--vnova-think-color': '#475569',
    '--vnova-nameplate-size': '0.8rem',
    '--vnova-nameplate-color': '#0f172a',
    // Choices
    '--vnova-choices-bg': 'rgba(255, 255, 255, .65)',
    '--vnova-choice-size': '0.95rem',
    '--vnova-choice-color': '#1e293b',
    '--vnova-choice-bg': 'rgba(0, 0, 0, .04)',
    '--vnova-choice-border': 'rgba(0, 0, 0, .12)',
    '--vnova-choice-bg-hover': 'rgba(99, 102, 241, .12)',
    '--vnova-choice-radius': '6px',
    // Modals
    '--vnova-modal-bg': 'rgba(255, 255, 255, 0.98)',
    '--vnova-modal-border': 'rgba(99, 102, 241, 0.2)',
    '--vnova-modal-radius': '12px',
    '--vnova-modal-shadow': '0 10px 40px rgba(0, 0, 0, 0.15)',
    '--vnova-modal-max-width': '500px',
    '--vnova-modal-max-height': '80vh',
    // Stage
    '--vnova-stage-bg': '#f8fafc',
    '--vnova-bg-duration': '400ms',
    '--vnova-sprite-bottom': '0px',
    // HUD
    '--vnova-hud-bg': 'rgba(255, 255, 255, 0.92)',
    '--vnova-hud-border': 'rgba(0, 0, 0, 0.1)',
    '--vnova-hud-text': 'rgba(30, 41, 59, 0.9)',
  }
}

export const oceanTheme = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Aquatic blue and cyan theme',
  variables: {
    // Colors
    '--vnova-color-primary': '#06b6d4',
    '--vnova-color-secondary': '#0891b2',
    '--vnova-color-text': '#cffafe',
    '--vnova-color-muted': '#67e8f9',
    '--vnova-color-dim': '#22d3ee',
    '--vnova-color-surface': 'rgba(8, 47, 73, 0.9)',
    '--vnova-color-danger': '#f43f5e',
    '--vnova-color-accent': '#3b82f6',
    // Typography
    '--vnova-font-body': "'Georgia', serif",
    '--vnova-font-ui': "system-ui, -apple-system, sans-serif",
    '--vnova-font-title': "'Cinzel', serif",
    // Dialog
    '--vnova-dialog-height': '18%',
    '--vnova-dialog-padding': '0.8rem 1.2rem 0.95rem',
    '--vnova-dialog-bg': 'rgba(8, 47, 73, 0.75)',
    '--vnova-dialog-border': 'rgba(6, 182, 212, .2)',
    '--vnova-text-size': '1.15rem',
    '--vnova-text-line-height': '1.55',
    '--vnova-text-color': '#cffafe',
    '--vnova-think-color': '#a5f3fc',
    '--vnova-nameplate-size': '0.8rem',
    '--vnova-nameplate-color': '#ecfeff',
    // Choices
    '--vnova-choices-bg': 'rgba(8, 47, 73, .85)',
    '--vnova-choice-size': '0.95rem',
    '--vnova-choice-color': '#cffafe',
    '--vnova-choice-bg': 'rgba(6, 182, 212, .1)',
    '--vnova-choice-border': 'rgba(6, 182, 212, .25)',
    '--vnova-choice-bg-hover': 'rgba(6, 182, 212, .2)',
    '--vnova-choice-radius': '6px',
    // Modals
    '--vnova-modal-bg': 'rgba(8, 47, 73, 0.95)',
    '--vnova-modal-border': 'rgba(6, 182, 212, 0.3)',
    '--vnova-modal-radius': '12px',
    '--vnova-modal-shadow': '0 10px 40px rgba(0, 0, 0, 0.5)',
    '--vnova-modal-max-width': '500px',
    '--vnova-modal-max-height': '80vh',
    // Stage
    '--vnova-stage-bg': '#083344',
    '--vnova-bg-duration': '400ms',
    '--vnova-sprite-bottom': '0px',
    // HUD
    '--vnova-hud-bg': 'rgba(8, 47, 73, 0.85)',
    '--vnova-hud-border': 'rgba(6, 182, 212, 0.25)',
    '--vnova-hud-text': 'rgba(207, 250, 254, 0.9)',
  }
}

export const forestTheme = {
  id: 'forest',
  name: 'Forest',
  description: 'Natural green theme',
  variables: {
    // Colors
    '--vnova-color-primary': '#22c55e',
    '--vnova-color-secondary': '#16a34a',
    '--vnova-color-text': '#dcfce7',
    '--vnova-color-muted': '#86efac',
    '--vnova-color-dim': '#4ade80',
    '--vnova-color-surface': 'rgba(20, 83, 45, 0.9)',
    '--vnova-color-danger': '#ef4444',
    '--vnova-color-accent': '#84cc16',
    // Typography
    '--vnova-font-body': "'Georgia', serif",
    '--vnova-font-ui': "system-ui, -apple-system, sans-serif",
    '--vnova-font-title': "'Cinzel', serif",
    // Dialog
    '--vnova-dialog-height': '18%',
    '--vnova-dialog-padding': '0.8rem 1.2rem 0.95rem',
    '--vnova-dialog-bg': 'rgba(20, 83, 45, 0.7)',
    '--vnova-dialog-border': 'rgba(34, 197, 94, .2)',
    '--vnova-text-size': '1.15rem',
    '--vnova-text-line-height': '1.55',
    '--vnova-text-color': '#dcfce7',
    '--vnova-think-color': '#bbf7d0',
    '--vnova-nameplate-size': '0.8rem',
    '--vnova-nameplate-color': '#f0fdf4',
    // Choices
    '--vnova-choices-bg': 'rgba(20, 83, 45, .85)',
    '--vnova-choice-size': '0.95rem',
    '--vnova-choice-color': '#dcfce7',
    '--vnova-choice-bg': 'rgba(34, 197, 94, .1)',
    '--vnova-choice-border': 'rgba(34, 197, 94, .25)',
    '--vnova-choice-bg-hover': 'rgba(34, 197, 94, .2)',
    '--vnova-choice-radius': '6px',
    // Modals
    '--vnova-modal-bg': 'rgba(20, 83, 45, 0.95)',
    '--vnova-modal-border': 'rgba(34, 197, 94, 0.3)',
    '--vnova-modal-radius': '12px',
    '--vnova-modal-shadow': '0 10px 40px rgba(0, 0, 0, 0.5)',
    '--vnova-modal-max-width': '500px',
    '--vnova-modal-max-height': '80vh',
    // Stage
    '--vnova-stage-bg': '#14532d',
    '--vnova-bg-duration': '400ms',
    '--vnova-sprite-bottom': '0px',
    // HUD
    '--vnova-hud-bg': 'rgba(20, 83, 45, 0.85)',
    '--vnova-hud-border': 'rgba(34, 197, 94, 0.25)',
    '--vnova-hud-text': 'rgba(220, 252, 231, 0.9)',
  }
}

// Array of all built-in themes for easy registration
export const builtInThemes = [
  defaultTheme,
  darkTheme,
  lightTheme,
  oceanTheme,
  forestTheme,
]
