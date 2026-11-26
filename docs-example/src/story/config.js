import { gallery } from './gallery.js'

export const defaultConfig = {
    title: 'Hoshimi Academy: The Last Light',
    subtitle: 'A VNova Engine showcase',
    meta: 'Branches · inventory · gallery · chapters · auto/skip',
    saveKey: 'hoshimi-academy-v1',
    slotCount: 10,
    progressKey: 'hoshimi-academy-v1',
    startLabel: 'start',
    inventory: {
        title: 'Hoshimi Kit',
    },
    gallery,
    // The demo ships many high-resolution sprites, so load them on demand
    // instead of preloading the whole catalog on first paint.
    preload: false,
    audio: {
        bgmVolume: 0.5,
        sfxVolume: 0.8,
    },
    stage: {
        typewriterEnabled: true,
        sessionKey: 'hoshimi-academy-session-v1',
    },
    themes: [
        {
            id: 'cyberpunk',
            name: 'Cyberpunk',
            description: 'Neon lights and dark streets',
            variables: {
                // Colors
                '--vnova-color-primary': '#ff00ff',
                '--vnova-color-secondary': '#00ffff',
                '--vnova-color-text': '#e0f7ff',
                '--vnova-color-muted': '#a0d8ef',
                '--vnova-color-dim': '#7ab8cf',
                '--vnova-color-surface': 'rgba(10, 0, 20, 0.95)',
                '--vnova-color-danger': '#ff3366',
                '--vnova-color-accent': '#ffff00',
                // Typography
                '--vnova-font-body': "'Courier New', monospace",
                '--vnova-font-ui': "'Courier New', monospace",
                '--vnova-font-title': "'Courier New', monospace",
                // Dialog
                '--vnova-dialog-bg': 'rgba(10, 0, 20, 0.85)',
                '--vnova-dialog-border': 'rgba(255, 0, 255, 0.3)',
                '--vnova-text-color': '#e0f7ff',
                '--vnova-think-color': '#a0d8ef',
                '--vnova-nameplate-color': '#ff00ff',
                // Choices
                '--vnova-choices-bg': 'rgba(10, 0, 20, 0.9)',
                '--vnova-choice-color': '#e0f7ff',
                '--vnova-choice-bg': 'rgba(255, 0, 255, 0.1)',
                '--vnova-choice-border': 'rgba(0, 255, 255, 0.3)',
                '--vnova-choice-bg-hover': 'rgba(255, 0, 255, 0.2)',
                '--vnova-choice-radius': '0px',
                // Modals
                '--vnova-modal-bg': 'rgba(10, 0, 20, 0.95)',
                '--vnova-modal-border': 'rgba(255, 0, 255, 0.3)',
                '--vnova-modal-radius': '0px',
                '--vnova-modal-shadow': '0 0 30px rgba(255, 0, 255, 0.5)',
                // Stage
                '--vnova-stage-bg': '#0a0014',
                // HUD
                '--vnova-hud-bg': 'rgba(10, 0, 20, 0.9)',
                '--vnova-hud-border': 'rgba(0, 255, 255, 0.3)',
                '--vnova-hud-text': '#e0f7ff',
            }
        }
    ],
}
export default defaultConfig
