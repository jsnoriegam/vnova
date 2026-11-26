<script setup>
import {
  VNovaRuntime,
  VNovaStage,
  VNovaTitleScreen,
  VNovaSaveModal,
  VNovaSettingsModal,
  VNovaBacklogModal,
  VNovaGalleryModal,
  VNovaInventoryModal,
  VNovaCreditsScreen,
  VNovaHud,
  VNovaTopHud,
} from 'vnova-engine'

import assets from './story/assets.js'
import particles from './story/particles.js'
import scriptEn from './story/script_en.js'
import characters from './story/characters.js'
import credits from './story/credits.js'
import config from './story/config.js'
import { items, itemTypes } from './story/items.js'
</script>

<template>
  <VNovaRuntime :script="scriptEn" :characters="characters" :assets="assets" :credits="credits"
    :particles="particles" :items="items" :item-types="itemTypes" :config="config">
    <!-- The order of these components is important, as they are rendered in the order they are declared. -->
    <VNovaTitleScreen />
    <VNovaStage />
    <VNovaHud :show-audio-log="true" />
    <VNovaTopHud custom-class="vnova-top-hud--custom">
      <template #left>Hoshimi Academy</template>
      <template #center>The Last Light</template>
      <template #right>VNova Engine</template>
    </VNovaTopHud>
    <VNovaCreditsScreen />
    <VNovaBacklogModal />
    <VNovaGalleryModal />
    <VNovaInventoryModal />
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

</style>
