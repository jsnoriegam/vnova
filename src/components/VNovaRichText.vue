<script setup>
/**
 * VNovaRichText.vue
 *
 * Renderiza un string BBCode como spans con estilos inline.
 * Para añadir soporte de una nueva etiqueta:
 *   1. Registrarla en src/utils/richText.js (TAG_REGISTRY + _makeToken).
 *   2. Añadir el binding de estilo correspondiente aquí.
 */
import { computed } from 'vue'
import { parseRichText } from '../utils/richText.js'

const props = defineProps({
  text: { type: String, default: '' },
})

const tokens = computed(() => parseRichText(props.text))
</script>

<template>
  <span class="vnova-rich-text">
    <span
      v-for="(token, i) in tokens"
      :key="i"
      :style="{
        fontWeight: token.bold   ? 'bold'   : undefined,
        fontStyle:  token.italic ? 'italic' : undefined,
        color:      token.color  ?? undefined,
      }"
    >{{ token.text }}</span>
  </span>
</template>
