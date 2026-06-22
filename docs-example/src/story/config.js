export const defaultConfig = {
    title: 'VNova Showcase',
    subtitle: 'Interactive Runtime Demo',
    meta: 'Scenes, branches, state, media hooks',
    saveKey: 'vnova-showcase-v1',
    slotCount: 10,
    startLabel: 'start',
    // Multi-language: selects the active language on startup.
    // Switch via Settings → Language / Idioma at runtime.
    defaultLanguage: 'en',
    // Preload all assets before showing the title screen.
    // Set to false to disable the loading screen entirely.
    preload: true,
    // Title screen background: CSS value or asset URL.
    // Example: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
    titleBackground: 'linear-gradient(135deg, #1a1a2e 0%, #738dd4dd 100%)',
    audio: {
        bgmVolume: 0.5,
        sfxVolume: 0.8,
    },
    stage: {
        typewriterEnabled: true,
    },
}
export default defaultConfig