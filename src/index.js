/**
 * vnova-engine — public API
 */

// Core
export { createEngine, expandNestedLabels } from './core/engine.js'
export { useVNovaStore }                    from './core/store.js'
export { PARTICLE_PRESETS }                from './core/particles.js'
export { createQuestEngine }               from './core/quests.js'
export { validateScript }                  from './core/validator.js'
export { createVNovaApp }                  from './createVNovaApp.js'
export { registerRuntimeModal, registerRuntimeModals } from './utils/runtimeUi.js'

// Composables del autor
export { useVNovaEngine }                  from './composables/useVNovaEngine.js'
export { useUserStorage }                  from './composables/useUserStorage.js'
export { useEngine }                       from './composables/useEngine.js'
export { useQuestEngine, QS }              from './composables/useQuestEngine.js'
export { useVNovaAudio }                   from './composables/useVNovaAudio.js'
export { useVNovaSaves }                   from './composables/useVNovaSaves.js'

// Componentes
export { default as VNovaStage }           from './components/VNovaStage.vue'
export { default as VNovaRuntime, VNOVA_RUNTIME_CONTEXT_KEY } from './components/VNovaRuntime.vue'
export { default as VNovaTitleScreen }     from './components/VNovaTitleScreen.vue'
export { default as VNovaCreditsScreen }   from './components/VNovaCreditsScreen.vue'
export { default as VNovaHud }             from './components/VNovaHud.vue'
export { default as VNovaTopHud }          from './components/VNovaTopHud.vue'
export { default as VNovaSettingsModal }   from './components/VNovaSettingsModal.vue'
export { default as VNovaBacklogModal }    from './components/VNovaBacklogModal.vue'
export { default as VNovaSaveModal }       from './components/VNovaSaveModal.vue'
export { default as VNovaBaseModal }       from './components/VNovaBaseModal.vue'