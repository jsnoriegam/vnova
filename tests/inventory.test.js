import { describe, expect, it, vi } from 'vitest'
import { createEngine } from '../src/core/engine.js'
import { resolveItemCatalog, resolveItemTypes } from '../src/core/inventory.js'

const itemTypes = {
  consumable: { stackable: true, consumable: true, maxStack: 5, usable: true, icon: '🧪' },
  special: { stackable: false, consumable: false, maxStack: 1, usable: false, icon: '⭐' },
  weapon: { extends: 'special', icon: '⚔️', slot: 'hand' },
  cursed: { icon: '☠️' },
  material: { extends: 'consumable', maxStack: 999, icon: '🪵' },
}

const items = {
  potion: {
    type: 'consumable',
    name: 'Potion',
    description: 'Restores 10 HP.',
    use: {
      inc: { hp: 10 },
      notify: { status: 'success', text: '+10 HP' },
    },
  },
  cursedSword: {
    type: ['weapon', 'cursed'],
    name: 'Cursed Sword',
    tags: ['melee', 'quest'],
  },
  towerKey: {
    type: 'special',
    name: 'Tower Key',
  },
  wood: {
    type: 'material',
    name: 'Wood',
  },
}

describe('item catalog', () => {
  it('resolves built-in and custom types with inheritance', () => {
    const types = resolveItemTypes(itemTypes)

    expect(types.consumable.maxStack).toBe(5)
    expect(types.weapon.stackable).toBe(false)
    expect(types.weapon.icon).toBe('⚔️')
    expect(types.material.stackable).toBe(true)
    expect(types.material.maxStack).toBe(999)
    expect(types.material.consumable).toBe(true)
  })

  it('uses only the primary type for behavior defaults', () => {
    const catalog = resolveItemCatalog(items, resolveItemTypes(itemTypes))

    const sword = catalog.get('cursedSword')
    expect(sword.types).toEqual(['weapon', 'cursed'])
    expect(sword.primaryType).toBe('weapon')
    expect(sword.stackable).toBe(false)
    expect(sword.maxStack).toBe(1)
    expect(sword.icon).toBe('⚔️')
    expect(sword.tags).toEqual(['melee', 'quest'])

    const potion = catalog.get('potion')
    expect(potion.stackable).toBe(true)
    expect(potion.consumable).toBe(true)
    expect(potion.maxStack).toBe(5)
    expect(potion.usable).toBe(true)
    expect(potion.icon).toBe('🧪')
  })

  it('lets item-level fields override type defaults', () => {
    const catalog = resolveItemCatalog({
      uniquePotion: {
        type: 'consumable',
        name: 'Unique Potion',
        stackable: false,
        maxStack: 99,
      },
    }, resolveItemTypes(itemTypes))

    const item = catalog.get('uniquePotion')
    expect(item.stackable).toBe(false)
    expect(item.maxStack).toBe(1)
    expect(item.consumable).toBe(true)
  })

  it('falls back to the special type when type is omitted', () => {
    const catalog = resolveItemCatalog({
      mystery: { name: 'Mystery' },
    }, resolveItemTypes())

    const item = catalog.get('mystery')
    expect(item.types).toEqual(['special'])
    expect(item.primaryType).toBe('special')
    expect(item.stackable).toBe(false)
  })
})

describe('inventory steps and state', () => {
  it('gives items and exposes the reactive inventory API', () => {
    const engine = createEngine([
      { type: 'item', id: 'potion', qty: 3 },
      { type: 'item', id: 'towerKey' },
    ], { items, itemTypes })

    expect(engine.inventory.count('potion')).toBe(3)
    expect(engine.inventory.count('towerKey')).toBe(1)
    expect(engine.inventory.has('potion', 3)).toBe(true)
    expect(engine.inventory.has('potion', 4)).toBe(false)
    expect(engine.inventory.entries.value.map((entry) => entry.id)).toEqual(['potion', 'towerKey'])
  })

  it('caps stackable items and keeps specials unique', () => {
    const engine = createEngine([
      { type: 'item', id: 'potion', qty: 20 },
      { type: 'item', id: 'towerKey' },
      { type: 'item', id: 'towerKey' },
    ], { items, itemTypes })

    expect(engine.inventory.count('potion')).toBe(5)
    expect(engine.inventory.count('towerKey')).toBe(1)
  })

  it('supports take, set and clear actions', () => {
    const engine = createEngine([
      { type: 'item', id: 'potion', qty: 3 },
      { type: 'item', action: 'take', id: 'potion', qty: 1 },
      { type: 'item', action: 'set', id: 'towerKey', qty: 1 },
    ], { items, itemTypes })

    expect(engine.inventory.count('potion')).toBe(2)
    expect(engine.inventory.count('towerKey')).toBe(1)

    engine.inventory.remove('potion', 2)
    expect(engine.inventory.has('potion')).toBe(false)

    engine.inventory.clearAll()
    expect(engine.inventory.entries.value).toEqual([])
  })

  it('uses consumables, applies effects and calls onItemUse', () => {
    const onItemUse = vi.fn()
    const onNotify = vi.fn()
    const engine = createEngine([
      { type: 'item', id: 'potion', qty: 2 },
      { type: 'item', action: 'use', id: 'potion' },
    ], { items, itemTypes, onItemUse, onNotify })

    expect(engine.inventory.count('potion')).toBe(1)
    expect(engine.getVar('hp')).toBe(10)
    expect(onNotify).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      text: '+10 HP',
    }))
    expect(onItemUse).toHaveBeenCalledWith(expect.objectContaining({
      id: 'potion',
      entry: expect.objectContaining({ qty: 1 }),
    }))
  })

  it('does not consume non-consumable items when used', () => {
    const engine = createEngine([
      { type: 'item', id: 'cursedSword' },
      { type: 'item', action: 'use', id: 'cursedSword' },
    ], {
      itemTypes,
      items: {
        cursedSword: { ...items.cursedSword, usable: true },
      },
    })

    expect(engine.inventory.count('cursedSword')).toBe(1)
  })

  it('restores inventory on back()', () => {
    const engine = createEngine([
      { type: 'say', text: 'start' },
      { type: 'item', id: 'potion', qty: 1 },
      { type: 'say', text: 'got it' },
    ], { items, itemTypes })

    engine.advance()
    expect(engine.inventory.count('potion')).toBe(1)
    engine.back()
    expect(engine.inventory.count('potion')).toBe(0)
  })

  it('supports inventory conditions in if and choice', () => {
    const okEngine = createEngine([
      { type: 'item', id: 'potion', qty: 2 },
      { type: 'if', condition: { hasItem: 'potion' }, then: [{ type: 'say', text: 'has' }], else: [{ type: 'say', text: 'missing' }] },
    ], { items, itemTypes })
    expect(okEngine.store.current.text).toBe('has')

    const countEngine = createEngine([
      { type: 'item', id: 'potion', qty: 2 },
      { type: 'if', condition: { item: 'potion', gte: 2 }, then: [{ type: 'say', text: 'enough' }], else: [{ type: 'say', text: 'nope' }] },
    ], { items, itemTypes })
    expect(countEngine.store.current.text).toBe('enough')

    const typeEngine = createEngine([
      { type: 'item', id: 'cursedSword' },
      { type: 'if', condition: { hasType: 'cursed' }, then: [{ type: 'say', text: 'cursed' }], else: [{ type: 'say', text: 'clean' }] },
    ], { items, itemTypes })
    expect(typeEngine.store.current.text).toBe('cursed')

    const typeCountEngine = createEngine([
      { type: 'item', id: 'potion', qty: 3 },
      { type: 'if', condition: { typeCount: 'consumable', gte: 3 }, then: [{ type: 'say', text: 'many' }], else: [{ type: 'say', text: 'few' }] },
    ], { items, itemTypes })
    expect(typeCountEngine.store.current.text).toBe('many')

    const choiceEngine = createEngine([
      { type: 'item', id: 'potion', qty: 1 },
      {
        type: 'choice',
        options: [
          { label: 'Drink', condition: { hasItem: 'potion' } },
          { label: 'Leave', condition: { hasItem: 'towerKey' } },
        ],
      },
    ], { items, itemTypes })
    expect(choiceEngine.store.current.options.map((option) => option.label)).toEqual(['Drink'])
  })

  it('groups entries by primary and secondary types', () => {
    const engine = createEngine([
      { type: 'item', id: 'cursedSword' },
      { type: 'item', id: 'potion', qty: 2 },
    ], { items, itemTypes })

    expect(engine.inventory.byType('weapon').map((entry) => entry.id)).toEqual(['cursedSword'])
    expect(engine.inventory.byType('cursed').map((entry) => entry.id)).toEqual(['cursedSword'])
    expect(engine.inventory.hasType('weapon')).toBe(true)
    expect(engine.inventory.typeCount('consumable')).toBe(2)
  })
})
