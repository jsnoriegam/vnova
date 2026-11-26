/**
 * vnova-engine — core/inventory.js
 *
 * Item catalog + inventory state helpers.
 *
 * Design rules:
 *   - `type` accepts a string or an array. The first entry is the primary type.
 *   - Only the primary type contributes behavior defaults (stackable,
 *     consumable, unique, maxStack, usable...). Secondary types are membership.
 *   - Item-level fields always override type defaults.
 *   - `tags` are free-form labels with no behavior attached.
 */

import { computed } from 'vue'
import { isPlainObject } from '../utils/predicates.js'

export const BUILTIN_ITEM_TYPES = {
  consumable: {
    label: 'Consumable',
    stackable: true,
    consumable: true,
    unique: false,
    maxStack: 99,
    usable: true,
    icon: '🧪',
  },
  special: {
    label: 'Special',
    stackable: false,
    consumable: false,
    unique: true,
    maxStack: 1,
    usable: false,
    icon: '⭐',
  },
}

function typeEntries(itemTypes) {
  if (Array.isArray(itemTypes)) {
    return itemTypes
      .filter((entry) => isPlainObject(entry) && typeof entry.id === 'string')
      .map((entry) => [entry.id, entry])
  }
  if (isPlainObject(itemTypes)) return Object.entries(itemTypes)
  return []
}

/**
 * Resolves built-in + author item types, including `extends` inheritance.
 *
 * @param {object|Array} customTypes
 * @returns {Record<string, object>}
 */
export function resolveItemTypes(customTypes = {}) {
  const raw = { ...BUILTIN_ITEM_TYPES }
  for (const [id, definition] of typeEntries(customTypes)) {
    if (!id || !isPlainObject(definition)) continue
    const builtin = BUILTIN_ITEM_TYPES[id]
    raw[id] = builtin
      ? { ...builtin, ...definition, id }
      : { ...definition, id }
  }

  const resolved = {}
  const resolving = new Set()

  function resolveOne(id) {
    if (resolved[id]) return resolved[id]
    const own = raw[id]
    if (!own) return null

    if (resolving.has(id)) {
      if (import.meta.env.DEV) console.warn(`[vnova] circular item type inheritance: "${id}"`)
      return { id }
    }

    resolving.add(id)
    const parent = typeof own.extends === 'string' ? resolveOne(own.extends) : null
    const { extends: _extends, ...rest } = own
    resolved[id] = { ...(parent ?? {}), ...rest, id }
    resolving.delete(id)
    return resolved[id]
  }

  for (const id of Object.keys(raw)) resolveOne(id)
  return resolved
}

function normalizeTypeList(value) {
  const list = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : [])
  const result = []
  for (const type of list) {
    if (typeof type !== 'string' || type.length === 0) continue
    if (!result.includes(type)) result.push(type)
  }
  return result
}

function normalizeStack(value, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 1) return fallback
  return Math.floor(number)
}

/**
 * Normalizes the author item catalog into resolved definitions.
 *
 * @param {object|Array} items
 * @param {Record<string, object>} resolvedTypes
 * @returns {{
 *   types: Record<string, object>,
 *   list: object[],
 *   map: Map<string, object>,
 *   get(id: string): object | null,
 * }}
 */
export function resolveItemCatalog(items = {}, resolvedTypes = resolveItemTypes()) {
  const entries = Array.isArray(items)
    ? items.filter((item) => isPlainObject(item)).map((item) => [item.id, item])
    : (isPlainObject(items) ? Object.entries(items) : [])

  const list = []
  const map = new Map()

  for (const [key, raw] of entries) {
    if (!isPlainObject(raw)) continue
    const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : key
    if (typeof id !== 'string' || id.length === 0) continue

    const types = normalizeTypeList(raw.type ?? raw.types)
    if (types.length === 0) types.push('special')

    const primaryType = types[0]
    const typeDefaults = resolvedTypes[primaryType] ?? resolvedTypes.special ?? {}

    if (import.meta.env.DEV) {
      for (const type of types) {
        if (!resolvedTypes[type]) console.warn(`[vnova] item "${id}" uses unknown type "${type}"`)
      }
    }

    const stackable = raw.stackable ?? typeDefaults.stackable ?? false
    const consumable = raw.consumable ?? typeDefaults.consumable ?? false
    const unique = raw.unique ?? typeDefaults.unique ?? !stackable
    const effectiveStackable = unique ? false : stackable
    const maxStack = effectiveStackable
      ? normalizeStack(raw.maxStack ?? typeDefaults.maxStack, 99)
      : 1

    const definition = {
      ...typeDefaults,
      ...raw,
      id,
      types,
      primaryType,
      tags: normalizeTypeList(raw.tags),
      stackable: effectiveStackable,
      consumable,
      unique,
      maxStack,
      usable: raw.usable ?? typeDefaults.usable ?? false,
      icon: raw.icon ?? typeDefaults.icon ?? '❓',
      use: isPlainObject(raw.use) ? raw.use : null,
    }

    list.push(definition)
    map.set(id, definition)
  }

  return {
    types: resolvedTypes,
    list,
    map,
    get: (id) => map.get(id) ?? null,
  }
}

export function normalizeItemQuantity(value, fallback = 1) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(0, Math.floor(number))
}

export function countInventoryItem(inventory, id) {
  const entry = inventory?.[id]
  return entry ? Math.max(0, Number(entry.qty) || 0) : 0
}

export function countInventoryByType(inventory, catalog, type) {
  if (!inventory || typeof type !== 'string') return 0
  let total = 0
  for (const [id, entry] of Object.entries(inventory)) {
    const definition = catalog.get(id)
    if (!definition?.types?.includes(type)) continue
    total += Math.max(0, Number(entry?.qty) || 0)
  }
  return total
}

export function inventoryEntries(inventory, catalog) {
  if (!inventory || typeof inventory !== 'object') return []
  return Object.entries(inventory)
    .filter(([, entry]) => Math.max(0, Number(entry?.qty) || 0) > 0)
    .map(([id, entry]) => {
      const definition = catalog.get(id) ?? {
        id,
        name: id,
        description: '',
        icon: '❓',
        types: ['special'],
        primaryType: 'special',
        tags: [],
        stackable: false,
        consumable: false,
        unique: true,
        maxStack: 1,
        usable: false,
        missing: true,
      }
      return {
        ...definition,
        id,
        qty: Math.max(0, Number(entry?.qty) || 0),
        data: entry?.data ?? null,
        definition,
      }
    })
}

/**
 * Reactive view over `store.inventory`. Mutations are delegated to the engine
 * through the `actions` argument so they can participate in back()/save state.
 */
export function createInventoryView(store, catalog, actions = {}) {
  const entries = computed(() => inventoryEntries(store.inventory ?? {}, catalog))

  function get(id) {
    return entries.value.find((entry) => entry.id === id) ?? null
  }

  return {
    types: catalog.types,
    definitions: catalog.list,
    definition: (id) => catalog.get(id),
    entries,
    get,
    count: (id) => get(id)?.qty ?? 0,
    has: (id, qty = 1) => {
      const needed = Math.max(1, normalizeItemQuantity(qty, 1))
      return (get(id)?.qty ?? 0) >= needed
    },
    hasType: (type) => countInventoryByType(store.inventory ?? {}, catalog, type) > 0,
    typeCount: (type) => countInventoryByType(store.inventory ?? {}, catalog, type),
    byType: (type) => entries.value.filter((entry) => entry.types.includes(type)),
    add: (id, qty, data) => actions.add?.(id, qty, data),
    remove: (id, qty) => actions.remove?.(id, qty),
    set: (id, qty, data) => actions.set?.(id, qty, data),
    use: (id) => actions.use?.(id),
    clear: (id) => actions.clear?.(id),
    clearAll: () => actions.clearAll?.(),
  }
}
