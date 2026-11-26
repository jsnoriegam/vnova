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
    expect(engine.store.background.src).toContain('unsplash.com')
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
})
