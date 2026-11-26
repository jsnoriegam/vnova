import { beforeEach, describe, expect, it } from 'vitest'
import { createEngine } from '../src/core/engine.js'
import { useVNovaSaves } from '../src/composables/useVNovaSaves.js'

function createStoryEngine() {
  return createEngine([
    { type: 'set', vars: { karma: 0 } },
    { type: 'say', text: 'primera' },
    { type: 'set', vars: { karma: 1 } },
    { type: 'say', text: 'segunda' },
  ])
}

function createLabelledEngine({ prologue = false } = {}) {
  const script = [
    ...(prologue ? [
      { type: 'label', id: 'prologue' },
      { type: 'say', text: 'nueva intro' },
    ] : []),
    { type: 'label', id: 'start' },
    { type: 'say', text: 'primera' },
    { type: 'label', id: 'middle' },
    { type: 'set', vars: { karma: 1 } },
    { type: 'say', text: 'segunda' },
  ]
  return createEngine(script)
}

describe('useVNovaSaves', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads a snapshot with variables and cursor', async () => {
    const engine = createStoryEngine()
    const saves = useVNovaSaves({ saveKey: 'test-story', slotCount: 2, store: engine.store })

    expect(engine.store.current.text).toBe('primera')
    expect(await saves.saveSlot(1)).toBe(true)

    engine.advance()
    expect(engine.store.current.text).toBe('segunda')
    expect(engine.getVar('karma')).toBe(1)

    expect(await saves.loadSlot(1)).toBe(true)
    expect(engine.store.current.text).toBe('primera')
    expect(engine.getVar('karma')).toBe(0)
  })

  it('exposes slot metadata after saving', async () => {
    const engine = createLabelledEngine()
    engine.advance()
    const saves = useVNovaSaves({ saveKey: 'test-meta', slotCount: 2, store: engine.store })

    await saves.saveSlot(2)
    await saves.refresh()

    expect(saves.hasSave.value).toBe(true)
    expect(saves.slots.value[1]).toMatchObject({
      slot: 2,
      kind: 'slot',
      chapter: 'middle',
      preview: 'segunda',
    })
    expect(saves.slots.value[0]).toBeNull()
  })

  it('re-anchors a loaded slot after the script gains a prologue', async () => {
    const original = createLabelledEngine()
    const originalSaves = useVNovaSaves({
      saveKey: 'test-anchor',
      slotCount: 1,
      store: original.store,
    })

    original.advance()
    expect(original.store.current.text).toBe('segunda')
    expect(await originalSaves.saveSlot(1)).toBe(true)

    const updated = createLabelledEngine({ prologue: true })
    const updatedSaves = useVNovaSaves({
      saveKey: 'test-anchor',
      slotCount: 1,
      store: updated.store,
    })

    expect(await updatedSaves.loadSlot(1)).toBe(true)
    expect(updated.store.current.text).toBe('segunda')
    expect(updated.store.lastLabel).toBe('middle')
    expect(updated.getVar('karma')).toBe(1)
  })

  it('saves, exposes and loads the autosave slot', async () => {
    const engine = createLabelledEngine()
    const saves = useVNovaSaves({ saveKey: 'test-auto', slotCount: 1, store: engine.store })

    expect(await saves.saveAuto()).toBe(true)
    expect(saves.hasAuto.value).toBe(true)
    expect(saves.hasSave.value).toBe(true)
    expect(saves.autoSlot.value).toMatchObject({ slot: 'auto', kind: 'auto' })

    engine.advance()
    expect(engine.store.current.text).toBe('segunda')

    expect(await saves.loadAuto()).toBe(true)
    expect(engine.store.current.text).toBe('primera')

    saves.deleteAuto()
    expect(saves.hasAuto.value).toBe(false)
    expect(saves.hasSave.value).toBe(false)
  })

  it('clears the autosave together with the manual slots', async () => {
    const engine = createLabelledEngine()
    const saves = useVNovaSaves({ saveKey: 'test-clear-auto', slotCount: 1, store: engine.store })

    await saves.saveSlot(1)
    await saves.saveAuto()
    expect(saves.hasSave.value).toBe(true)

    saves.clearAll()
    await saves.refresh()

    expect(saves.hasSave.value).toBe(false)
    expect(saves.hasAuto.value).toBe(false)
  })

  it('deletes a single slot without touching the others', async () => {
    const engine = createLabelledEngine()
    const saves = useVNovaSaves({ saveKey: 'test-delete', slotCount: 2, store: engine.store })

    await saves.saveSlot(1)
    await saves.saveSlot(2)
    saves.deleteSlot(1)
    await saves.refresh()

    expect(saves.slots.value[0]).toBeNull()
    expect(saves.slots.value[1]).not.toBeNull()
  })

  it('saves and loads inventory state', async () => {
    const engine = createEngine([
      { type: 'item', id: 'potion', qty: 2 },
      { type: 'say', text: 'primera' },
      { type: 'item', id: 'potion', qty: 1 },
      { type: 'say', text: 'segunda' },
    ], {
      items: { potion: { type: 'consumable', name: 'Potion' } },
    })
    const saves = useVNovaSaves({ saveKey: 'test-inventory', slotCount: 1, store: engine.store })

    expect(engine.inventory.count('potion')).toBe(2)
    expect(await saves.saveSlot(1)).toBe(true)

    engine.advance()
    expect(engine.inventory.count('potion')).toBe(3)

    expect(await saves.loadSlot(1)).toBe(true)
    expect(engine.inventory.count('potion')).toBe(2)
    expect(engine.store.current.text).toBe('primera')
  })

  it('rejects corrupted payloads instead of throwing', async () => {
    const engine = createStoryEngine()
    const saves = useVNovaSaves({ saveKey: 'test-corrupt', slotCount: 1, store: engine.store })

    localStorage.setItem('test-corrupt:slot:1', '{not json')
    expect(await saves.loadSlot(1)).toBe(false)
  })
})
