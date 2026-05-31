<script setup>
/**
 * VNovaTopHud — Barra superior extensible por el autor.
 *
 * Props:
 *   opacity  {Number}  0–1. Opacidad del contenedor (default 0.6).
 *   floating {Boolean} Ambos modos usan position: absolute en la parte superior.
 *                      false → pegado a los tres bordes (top/left/right) sin margen.
 *                      true  → flota con margen superior, izquierdo y derecho (default true).
 *
 * Slots:
 *   left   — contenido alineado a la izquierda.
 *   center — contenido centrado.
 *   right  — contenido alineado a la derecha.
 *
 * Uso básico:
 *   <VNovaTopHud :opacity="0.8" :floating="true">
 *     <template #left>Capítulo 1</template>
 *     <template #center>Mi Juego</template>
 *     <template #right><button>Menú</button></template>
 *   </VNovaTopHud>
 */

/**
 * Resuelve clases CSS personalizadas del autor.
 *
 * Soporta:
 * - String con múltiples clases separadas por espacios o comas
 * - Array de strings
 * - Objeto con clases como keys (ya implementado)
 *
 * Valida que los datos sean correctos antes de aplicar.
 */
function resolveCustomClasses() {
  let classes = {}
  if(props.customClass) {
    if(typeof props.customClass === 'object' && !Array.isArray(props.customClass)) {
      // Objeto con clases como keys (ej: { 'my-class': true })
      return props.customClass
    } else if(typeof props.customClass === 'string') {
      // String con clases separadas por espacios o comas
      const trimmed = props.customClass.trim()
      if(trimmed) {
        const classList = trimmed.split(/[,\s]+/).filter(c => c.trim())
        classList.forEach(cls => {
          if(cls && typeof cls === 'string') {
            classes[cls.trim()] = true
          }
        })
      }
    } else if(Array.isArray(props.customClass)) {
      // Array de strings
      props.customClass.forEach(cls => {
        if(cls && typeof cls === 'string') {
          classes[cls.trim()] = true
        }
      })
    }
  }
  return classes
}

const props = defineProps({
  /** Opacidad del HUD (0 = invisible, 1 = sólido). */
  opacity: {
    type: Number,
    default: 0.6,
    validator: (v) => v >= 0 && v <= 1,
  },
  /**
   * false → position absolute, pegado a top/left/right sin margen.
   * true  → position absolute, con margen en top/left/right (flotante).
   */
  floating: {
    type: Boolean,
    default: true,
  },
  /** Clases CSS personalizadas para el contenedor del HUD. */
  customClass: {
    type: [String, Object, null],
    default: null,
  },
})
</script>

<template>
  <div
    class="vnova-top-hud"
    :class="{ 'vnova-top-hud--floating': props.floating, ...(resolveCustomClasses() || {}) }"
    :style="{ opacity: props.opacity }"
    role="banner"
  >
    <!-- Slot izquierdo -->
    <div class="vnova-top-hud__section vnova-top-hud__left">
      <slot name="left" />
    </div>

    <!-- Slot central -->
    <div class="vnova-top-hud__section vnova-top-hud__center">
      <slot name="center" />
    </div>

    <!-- Slot derecho -->
    <div class="vnova-top-hud__section vnova-top-hud__right">
      <slot name="right" />
    </div>
  </div>
</template>

<style scoped>
/* ── Contenedor principal ─────────────────────────────────── */
/* Ambos modos son position: absolute en la parte superior */
.vnova-top-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--vnova-z-hud, 12);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0.4rem 1rem;
  box-sizing: border-box;
  font-family: var(--vnova-font-ui, 'Outfit', system-ui, sans-serif);
  pointer-events: none;
  transition: opacity 250ms ease;
}

/*
 * floating=false → pegado a los tres bordes, sin margen.
 * floating=true  → margen en top, left y right (efecto flotante).
 */
.vnova-top-hud--floating {
  top: 0.75rem;
  left: 0.75rem;
  right: 0.75rem;
}

/* ── Secciones ─────────────────────────────────────────────── */
.vnova-top-hud__section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* Restaurar pointer-events para hijos interactivos */
  pointer-events: auto;
}

.vnova-top-hud__left {
  justify-content: flex-start;
}

.vnova-top-hud__center {
  justify-content: center;
}

.vnova-top-hud__right {
  justify-content: flex-end;
}
</style>
