/**
 * vnova-engine — composables/useVNovaInventory.js
 *
 * Author-facing access to the active engine inventory. Returns the reactive
 * inventory view created by `createEngine()`.
 */

import { getActiveEngineHandle } from '../core/engine.js'

export function useVNovaInventory() {
  const engine = getActiveEngineHandle()
  if (!engine?.inventory) {
    throw new Error('[vnova] useVNovaInventory() requires an active engine')
  }
  return engine.inventory
}
