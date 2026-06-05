/**
 * vnova-engine — composables/useEngine.js
 *
 * Minimal runtime helper for author callbacks.
 * Works without arguments (similar to monogatari.run/storage).
 */

import { useVNovaStore } from '../core/store.js'
import { getActiveEngineHandle } from '../core/engine.js'

function noop() {}

export function useEngine() {
  const store = useVNovaStore()

  function withEngine(action, fallback) {
    const engine = getActiveEngineHandle()
    if (!engine) return fallback
    return action(engine)
  }

  function jump(target) {
    if (typeof target !== 'string' || target.trim().length === 0) return false
    return withEngine((engine) => {
      engine.jump(target)
      return true
    }, false)
  }

  function getVar(key) {
    return store.vars?.[key]
  }

  function setVar(key, value) {
    if (typeof key !== 'string' || key.length === 0) return false
    store.setVar({ key, value })
    return true
  }

  function getSetting(key) {
    return store.settings?.[key]
  }

  function setSetting(key, value) {
    if (typeof key !== 'string' || key.length === 0) return false
    store.setSetting({ key, value })
    return true
  }

  return {
    jump,
    next: () => withEngine((engine) => engine.advance(), noop()),
    back: () => withEngine((engine) => engine.back(), false),
    restart: () => withEngine((engine) => engine.restart(), noop()),
    start: () => withEngine((engine) => engine.start(), noop()),
    exitMenu: () => withEngine((engine) => engine.exitMenu(), noop()),
    getVar,
    setVar,
    getSetting,
    setSetting,
    get state() { return store },
    get store() { return store },
  }
}