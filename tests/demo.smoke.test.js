import { describe, expect, it } from 'vitest'
import { createEngine } from '../src/core/engine.js'
import { validateMultiLanguageScript, validateScript } from '../src/core/validator.js'
import { collectSteps } from '../src/core/compiler.js'
import { collectUnlockTargets } from '../src/core/unlocks.js'
import scriptEs from '../docs-example/src/story/script_es.js'
import scriptEn from '../docs-example/src/story/script_en.js'
import { characters } from '../docs-example/src/story/characters.js'
import { assets } from '../docs-example/src/story/assets.js'
import config from '../docs-example/src/story/config.js'
import { items as demoItems, itemTypes as demoItemTypes } from '../docs-example/src/story/items.js'
import { resolveItemCatalog, resolveItemTypes } from '../src/core/inventory.js'

describe('demo story', () => {
  it('validates both languages and their structural equivalence', () => {
    const ignoreAssetWarnings = (warnings) =>
      warnings.filter((warning) => !warning.includes('neither src nor color'))

    expect(ignoreAssetWarnings(validateScript(scriptEs, characters))).toEqual([])
    expect(ignoreAssetWarnings(validateScript(scriptEn, characters))).toEqual([])
    expect(ignoreAssetWarnings(validateMultiLanguageScript({ es: scriptEs, en: scriptEn }, characters))).toEqual([])
  })

  it('compiles nested labels and boots the first scene', () => {
    const engine = createEngine(scriptEs, { characters, assets })

    expect(engine.store.current?.type).toBe('narrate')
    expect(engine.store.background.src).toContain('school-yard')
    expect(engine.store.stage).toEqual({})
  })

  it('keeps gallery definitions in sync with demo unlock steps', () => {
    const gallery = config.gallery
    const ids = {
      cg: new Set((gallery.cgs ?? []).map((item) => item.id)),
      ending: new Set((gallery.endings ?? []).map((item) => item.id)),
      achievement: new Set((gallery.achievements ?? []).map((item) => item.id)),
      chapter: new Set((gallery.chapters ?? []).map((item) => item.id)),
    }

    const targets = collectSteps(scriptEn).flatMap((step) => collectUnlockTargets(step))
    expect(targets.length).toBeGreaterThan(0)

    for (const target of targets) {
      expect(ids[target.kind].has(target.id)).toBe(true)
    }
  })

  it('keeps demo item steps in sync with the item catalog', () => {
    const catalog = resolveItemCatalog(demoItems, resolveItemTypes(demoItemTypes))

    const itemIds = collectSteps(scriptEn)
      .filter((step) => step.type === 'item')
      .map((step) => step.id ?? step.item ?? step.give ?? step.take ?? step.use)
      .filter((id) => typeof id === 'string')

    expect(itemIds.length).toBeGreaterThan(0)
    for (const id of itemIds) expect(catalog.get(id)).toBeTruthy()
  })

  it('references existing scenes, sprites, music and items', () => {
    const catalog = resolveItemCatalog(demoItems, resolveItemTypes(demoItemTypes))

    for (const step of collectSteps(scriptEn)) {
      if (step.type === 'scene' && step.id) {
        expect(assets.scenes?.[step.id], `scene "${step.id}"`).toBeTruthy()
      }

      if (step.type === 'bgm' && step.id) {
        expect(assets.music?.[step.id], `music "${step.id}"`).toBeTruthy()
      }

      if (step.type === 'show') {
        const character = characters[step.character]
        expect(character, `character "${step.character}"`).toBeTruthy()
        const expression = step.expression ?? step.variant
        if (expression && expression !== 'default') {
          expect(
            character.sprites?.[expression] ?? character.defaultSprite,
            `sprite "${step.character}/${expression}"`,
          ).toBeTruthy()
        }
      }

      if (step.type === 'item') {
        const id = step.id ?? step.item ?? step.give ?? step.take ?? step.use
        if (typeof id === 'string') expect(catalog.get(id), `item "${id}"`).toBeTruthy()
      }
    }
  })
})
