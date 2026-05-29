<script setup>
import VNovaRuntime from '../../src/components/VNovaRuntime.vue'
import VNovaHud from '../../src/components/VNovaHud.vue'
import VNovaSettingsModal from '../../src/components/VNovaSettingsModal.vue'
import VNovaBacklogModal from '../../src/components/VNovaBacklogModal.vue'
import VNovaSaveModal from '../../src/components/VNovaSaveModal.vue'
import VNovaTitleScreen from '../../src/components/VNovaTitleScreen.vue'
import VNovaStage from '../../src/components/VNovaStage.vue'

import assets from './story/assets.js'
import script from './story/script.js'
import characters from './story/characters.js'
import config from './story/config.js'
</script>

<template>
  <VNovaRuntime :script="script" :characters="characters" :assets="assets" :config="config">
    <!-- The order of these components is important, as they are rendered in the order they are declared. -->
    <VNovaTitleScreen />
    <VNovaStage />
    <VNovaHud />
    <VNovaBacklogModal />
    <VNovaSettingsModal />
    <VNovaSaveModal />
  </VNovaRuntime>
</template>

<style></style>