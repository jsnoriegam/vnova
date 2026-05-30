<script setup>
import VNovaSettingsModal from '../../src/components/VNovaSettingsModal.vue'
import VNovaBacklogModal from '../../src/components/VNovaBacklogModal.vue'
import VNovaSaveModal from '../../src/components/VNovaSaveModal.vue'
import VNovaTitleScreen from '../../src/components/VNovaTitleScreen.vue'
import VNovaStage from '../../src/components/VNovaStage.vue'

import { VNovaRuntime, VNovaHud, VNovaTopHud } from '../../src/index.js'

import assets from './story/assets.js'
import particles from './story/particles.js'
import script from './story/script.js'
import characters from './story/characters.js'
import config from './story/config.js'
</script>

<template>
  <VNovaRuntime :script="script" :characters="characters" :assets="assets" :particles="particles" :config="config">
    <!-- The order of these components is important, as they are rendered in the order they are declared. -->
    <VNovaTitleScreen />
    <VNovaStage />
    <VNovaHud :show-audio-log="true" />
    <VNovaTopHud>
      <template #left>Capítulo 1</template>
      <template #center>Showcase</template>
      <template #right><button>Quests</button></template>
    </VNovaTopHud>
    <VNovaBacklogModal />
    <VNovaSettingsModal />
    <VNovaSaveModal />
  </VNovaRuntime>
</template>

<style></style>