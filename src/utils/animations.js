/**
 * vnova-engine — utils/animations.js
 *
 * Módulo centralizado para animaciones con animejs.
 * Provee configuración global y helpers para efectos comunes.
 */

import { animate, createTimeline, set } from 'animejs'

export const ANIMATION_DEFAULTS = {
  bgTransitionDuration: 400,
  spriteTransitionDuration: 300,
  spriteDimDuration: 250,
  effectDuration: 500,
}

export const EASINGS = {
  easeInOut: 'easeInOutQuad',
  easeOut: 'easeOutQuad',
  easeIn: 'easeInQuad',
  linear: 'linear',
}

export function createBgTransition(element, transition, onComplete) {
  if (!element) return null

  const duration = ANIMATION_DEFAULTS.bgTransitionDuration

  switch (transition) {
    case 'cut':
      onComplete?.()
      return null

    case 'fade':
    case 'dissolve':
      return animate(element, {
        opacity: [0, 1],
        duration,
        easing: transition === 'dissolve' ? EASINGS.linear : EASINGS.easeInOut,
        onComplete,
      })

    case 'slide-left':
      return animate(element, {
        opacity: [0, 1],
        translateX: ['6%', '0%'],
        duration,
        easing: EASINGS.easeInOut,
        onComplete,
      })

    case 'slide-right':
      return animate(element, {
        opacity: [0, 1],
        translateX: ['-6%', '0%'],
        duration,
        easing: EASINGS.easeInOut,
        onComplete,
      })

    default:
      return animate(element, {
        opacity: [0, 1],
        duration,
        easing: EASINGS.easeInOut,
        onComplete,
      })
  }
}

export function createCrossfadeTransition(inElement, outElement, transition, onComplete) {
  if (!inElement) {
    onComplete?.()
    return null
  }

  const duration = ANIMATION_DEFAULTS.bgTransitionDuration

  switch (transition) {
    case 'cut':
      onComplete?.()
      return null

    case 'fade':
    case 'dissolve': {
      const easing = transition === 'dissolve' ? EASINGS.linear : EASINGS.easeInOut
      if (outElement) {
        set(outElement, { zIndex: inElement.zIndex - 1 })
      }
      set(inElement, { opacity: 0 })
      return animate(inElement, {
        opacity: [0, 1],
        duration,
        easing,
        onComplete,
      })
    }

    case 'slide-left': {
      if (outElement) {
        set(outElement, { opacity: 1, translateX: '0%' })
        animate(outElement, {
          opacity: [1, 0],
          translateX: ['0%', '-6%'],
          duration,
          easing: EASINGS.easeInOut,
        })
      }
      set(inElement, { opacity: 0, translateX: '6%' })
      return animate(inElement, {
        opacity: [0, 1],
        translateX: ['6%', '0%'],
        duration,
        easing: EASINGS.easeInOut,
        onComplete,
      })
    }

    case 'slide-right': {
      if (outElement) {
        set(outElement, { opacity: 1, translateX: '0%' })
        animate(outElement, {
          opacity: [1, 0],
          translateX: ['0%', '6%'],
          duration,
          easing: EASINGS.easeInOut,
        })
      }
      set(inElement, { opacity: 0, translateX: '-6%' })
      return animate(inElement, {
        opacity: [0, 1],
        translateX: ['-6%', '0%'],
        duration,
        easing: EASINGS.easeInOut,
        onComplete,
      })
    }

    default: {
      if (outElement) {
        set(outElement, { opacity: 1 })
        animate(outElement, {
          opacity: [1, 0],
          duration,
          easing: EASINGS.easeInOut,
        })
      }
      set(inElement, { opacity: 0 })
      return animate(inElement, {
        opacity: [0, 1],
        duration,
        easing: EASINGS.easeInOut,
        onComplete,
      })
    }
  }
}

export function createSpriteEnter(element) {
  if (!element) return null

  const duration = ANIMATION_DEFAULTS.spriteTransitionDuration

  set(element, { opacity: 0, translateY: '20px' })

  return animate(element, {
    opacity: [0, 1],
    translateY: ['20px', '0px'],
    duration,
    easing: EASINGS.easeOut,
  })
}

export function createSpriteLeave(element, onComplete) {
  if (!element) return null

  const duration = ANIMATION_DEFAULTS.spriteTransitionDuration

  return animate(element, {
    opacity: [1, 0],
    translateY: ['0px', '20px'],
    duration,
    easing: EASINGS.easeIn,
    onComplete,
  })
}

export function createSpriteDim(element, isDimmed) {
  if (!element) return null

  const duration = ANIMATION_DEFAULTS.spriteDimDuration
  const targetBrightness = isDimmed ? 0.45 : 1

  return animate(element, {
    filter: isDimmed ? 'brightness(0.45)' : 'brightness(1)',
    duration,
    easing: EASINGS.easeInOut,
  })
}

export function stopAnimation(animation) {
  if (animation && typeof animation.pause === 'function') {
    animation.pause()
  }
}

export function createShakeEffect(element, options = {}) {
  if (!element) return null

  const {
    intensity = 8,
    duration = 500,
    direction = 'horizontal',
  } = options

  const translateX = direction === 'horizontal' || direction === 'both'
    ? [
        { value: -intensity, duration: duration * 0.1 },
        { value: intensity, duration: duration * 0.2 },
        { value: -intensity, duration: duration * 0.2 },
        { value: intensity, duration: duration * 0.2 },
        { value: 0, duration: duration * 0.3 },
      ]
    : 0

  const translateY = direction === 'vertical' || direction === 'both'
    ? [
        { value: -intensity, duration: duration * 0.1 },
        { value: intensity, duration: duration * 0.2 },
        { value: -intensity, duration: duration * 0.2 },
        { value: intensity, duration: duration * 0.2 },
        { value: 0, duration: duration * 0.3 },
      ]
    : 0

  return animate(element, {
    translateX,
    translateY,
    duration,
    easing: EASINGS.easeInOut,
  })
}

export function createFlashEffect(element, options = {}) {
  if (!element) return null

  const {
    duration = 300,
    color = 'rgba(255, 255, 255, 0.8)',
  } = options

  const originalBg = element.style.background

  return animate(element, {
    background: [color, 'transparent'],
    duration,
    easing: EASINGS.easeOut,
    onComplete: () => {
      element.style.background = originalBg
    },
  })
}

export function createZoomEffect(element, options = {}) {
  if (!element) return null

  const {
    scale = 1.2,
    duration = 400,
    direction = 'in',
  } = options

  const fromScale = direction === 'in' ? 1 : scale
  const toScale = direction === 'in' ? scale : 1

  return animate(element, {
    scale: [fromScale, toScale],
    duration,
    easing: EASINGS.easeInOut,
  })
}

export function createPulseEffect(element, options = {}) {
  if (!element) return null

  const {
    duration = 600,
    cycles = 2,
    opacity = 0.5,
  } = options

  const keyframes = []
  for (let i = 0; i < cycles; i++) {
    keyframes.push({ value: opacity, duration: duration / (cycles * 2) })
    keyframes.push({ value: 1, duration: duration / (cycles * 2) })
  }

  return animate(element, {
    opacity: keyframes,
    duration,
    easing: EASINGS.easeInOut,
  })
}

export { animate, createTimeline, set }
