/**
 * vnova-engine — public API
 */

export { createEngine, expandNestedLabels } from './core/engine.js'
export { PARTICLE_PRESETS }                from './core/particles.js'
export { createVNovaApp }                  from './createVNovaApp.js'
export { useVNovaStore }                    from './core/store.js'
export { createQuestEngine, QUEST_STATUS as QS } from './core/quests.js'
export { validateScript }                  from './core/validator.js'
export { useVNova }                        from './composables/useVNova.js'
export { useVNovaAudio }                   from './composables/useVNovaAudio.js'
export { useVNovaSaves }                   from './composables/useVNovaSaves.js'
export { default as VNovaSaveModal }       from './components/VNovaSaveModal.vue'
export { default as VNovaRuntime, VNOVA_RUNTIME_CONTEXT_KEY } from './components/VNovaRuntime.vue'
export { default as VNovaStage }           from './components/VNovaStage.vue'
export { default as VNovaTitleScreen }     from './components/VNovaTitleScreen.vue'
export { default as VNovaHud }             from './components/VNovaHud.vue'
export { default as VNovaSettingsModal }   from './components/VNovaSettingsModal.vue'
export { default as VNovaBacklogModal }    from './components/VNovaBacklogModal.vue'
