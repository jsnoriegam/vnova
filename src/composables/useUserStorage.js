/**
 * vnova-engine — composables/useUserStorage.js
 *
 * Variables de historia del autor. Se conecta al store activo sin parámetros.
 *
 * Uso:
 *   const storage = useUserStorage()
 *
 *   storage.get('dinero')           // → valor o undefined
 *   storage.get('dinero', 0)        // → valor o 0 si no existe
 *   storage.set('nombre', 'Elena')
 *   storage.inc('puntos', 10)
 *   storage.toggle('cofre_abierto')
 *   storage.has('capitulo2_visto')
 *   storage.remove('temporal')
 *
 *   // Ref reactivo con v-model
 *   const nombre = storage.ref('nombre', '')
 *
 *   // Acceso directo reactivo a todas las variables
 *   storage.vars   // → computed({ dinero: 100, nombre: 'Elena', … })
 */

import { computed } from 'vue'
import { useVNovaStore } from '../core/store.js'
import { useQuestEngine } from './useQuestEngine.js'

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function cloneDeep(value) {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

function splitPath(path) {
  if (typeof path !== 'string') return []
  return path.split('.').map(p => p.trim()).filter(Boolean)
}

export function useUserStorage() {
  const store = useVNovaStore()
  const quests = useQuestEngine()
  const vars  = computed(() => store.vars ?? {})

  function _evaluateQuests() {
    quests.evaluate()
  }

  function get(path, fallback = undefined) {
    const parts = splitPath(path)
    if (parts.length === 0) return fallback
    let cursor = vars.value
    for (const part of parts) {
      if (!isPlainObject(cursor) || !(part in cursor)) return fallback
      cursor = cursor[part]
    }
    return cursor === undefined ? fallback : cursor
  }

  function has(path) {
    const sentinel = Symbol()
    return get(path, sentinel) !== sentinel
  }

  function set(path, value) {
    const parts = splitPath(path)
    if (parts.length === 0) return false
    if (parts.length === 1) {
      store.setVar({ key: parts[0], value })
      _evaluateQuests()
      return true
    }
    const root = isPlainObject(store.vars) ? cloneDeep(store.vars) : {}
    let cursor = root
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!isPlainObject(cursor[part])) cursor[part] = {}
      cursor = cursor[part]
    }
    cursor[parts[parts.length - 1]] = value
    store.setVars(root)
    _evaluateQuests()
    return true
  }

  function update(path, updater, fallback = undefined) {
    if (typeof updater !== 'function') return false
    return set(path, updater(get(path, fallback)))
  }

  function inc(path, amount = 1) {
    const delta = Number(amount)
    if (!Number.isFinite(delta)) return false
    const current = Number(get(path, 0))
    return set(path, (Number.isFinite(current) ? current : 0) + delta)
  }

  function toggle(path) {
    return set(path, !get(path, false))
  }

  function remove(path) {
    const parts = splitPath(path)
    if (parts.length === 0) return false
    if (!isPlainObject(store.vars)) return false
    const root   = cloneDeep(store.vars)
    let cursor   = root
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      if (!isPlainObject(cursor[part])) return false
      cursor = cursor[part]
    }
    const key = parts[parts.length - 1]
    if (!(key in cursor)) return false
    delete cursor[key]
    store.setVars(root)
    _evaluateQuests()
    return true
  }

  function clear() {
    store.setVars({})
    _evaluateQuests()
    return true
  }

  function ref(path, fallback = undefined) {
    return computed({
      get: () => get(path, fallback),
      set: (value) => set(path, value),
    })
  }

  return { vars, get, has, set, update, inc, toggle, remove, clear, ref }
}
