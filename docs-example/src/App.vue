<script setup>
import { VNovaRuntime, VNovaStage, VNovaTitleScreen, VNovaSaveModal, VNovaSettingsModal, VNovaBacklogModal, VNovaCreditsScreen, VNovaHud, VNovaTopHud } from '../../src/index.js'

import MapChoiceModal from './components/MapChoiceModal.vue'
import OperatorStoragePanel from './components/OperatorStoragePanel.vue'

import assets from './story/assets.js'
import particles from './story/particles.js'
import script from './story/script.js'
import characters from './story/characters.js'
import credits from './story/credits.js'
import config from './story/config.js'
</script>

<template>
  <VNovaRuntime
    :script="script"
    :characters="characters"
    :assets="assets"
    :credits="credits"
    :particles="particles"
    :config="config"
  >
    <!-- The order of these components is important, as they are rendered in the order they are declared. -->
    <VNovaTitleScreen />
    <VNovaStage />
    <VNovaHud :show-audio-log="true" />
    <VNovaTopHud custom-class="vnova-top-hud--custom">
      <template #left>Demo</template>
      <template #center>Showcase</template>
      <template #right><button class="vnova-hud-btn--material">Quests</button></template>
    </VNovaTopHud>
    <OperatorStoragePanel />
    <MapChoiceModal />
    <VNovaCreditsScreen />
    <VNovaBacklogModal />
    <VNovaSettingsModal />
    <VNovaSaveModal />
  </VNovaRuntime>
</template>

<style>
/* ── Estilos personalizados del Top HUD ────────────────────── */
.vnova-top-hud--custom {
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

/* Texto blanco en todas las secciones */
.vnova-top-hud--custom .vnova-top-hud__section {
  font-size: 1.2rem;
  color: #ffffff;
}

/* ── Botón estilo Material Design ─────────────────────────── */
.vnova-hud-btn--material {
  background: linear-gradient(135deg, #6200ee 0%, #3700b3 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.3px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  text-transform: uppercase;
}

.vnova-hud-btn--material:hover {
  background: linear-gradient(135deg, #7c4dff 0%, #5e35b1 100%);
  box-shadow: 0 4px 8px rgba(98, 0, 238, 0.35);
  transform: translateY(-1px);
}

.vnova-hud-btn--material:active {
  background: linear-gradient(135deg, #3700b3 0%, #21008c 100%);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transform: translateY(0);
}

/* Variación alternativa: botón con estilo moderno minimalista */
.vnova-hud-btn--modern {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 0.5rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vnova-hud-btn--modern:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.vnova-hud-btn--modern:active {
  background: rgba(255, 255, 255, 0.2);
}
</style>
