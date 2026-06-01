/**
 * vnova-engine — core/store.js
 *
 * Pinia store for the visual novel engine state.
 * Replaces the Vuex module with a flat, reactive store.
 */

import { defineStore } from 'pinia'

const cloneDeep = (value) => {
  if (value === null || value === undefined) return value
  return JSON.parse(JSON.stringify(value))
}

const defaultBackground = () => ({ src: null, color: null, transition: 'cut' })
const defaultImage      = () => ({ src: null, transition: 'cut', fit: 'both' })
const defaultSettings   = () => ({
  typewriterSpeed: 30,
  bgmVolume: 0.5,
  sfxVolume: 0.5,
  textSize: 'medium',
})

export const useVNovaStore = defineStore('vnova', {
  state: () => ({
    cursor:         0,
    current:        null,
    stage:          {},
    background:     defaultBackground(),
    image:          defaultImage(),
    bgm:            null,
    particles:      null,
    vars:           {},
    quests:         {},
    awaitingChoice: false,
    ended:          false,
    history:        [],
    backStack:      [],
    characters:     {},
    credits:        [],
    settings:       defaultSettings(),
  }),

  getters: {
    stageArray:  (state) => Object.values(state.stage),
    canBack:     (state) => state.backStack.length > 0,

    speakerName: (state) => {
      const step = state.current
      if (!step || (step.type !== 'say' && step.type !== 'think')) return null
      const char = state.characters[step.character]
      return char?.name ?? step.character ?? null
    },

    speakerColor: (state) => {
      const step = state.current
      if (!step || (step.type !== 'say' && step.type !== 'think')) return null
      return state.characters[step.character]?.color ?? null
    },
  },

  actions: {
    // ── Lifecycle ────────────────────────────────────────────────────────────
    resetEngine() {
      this.cursor         = 0
      this.current        = null
      this.stage          = {}
      this.background     = defaultBackground()
      this.image          = defaultImage()
      this.bgm            = null
      this.particles      = null
      this.vars           = {}
      this.quests         = {}
      this.awaitingChoice = false
      this.ended          = false
      this.history        = []
      this.backStack      = []
    },

    loadSnapshot(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') return
      this.cursor         = snapshot.cursor         ?? 0
      this.current        = snapshot.current        ?? null
      this.stage          = snapshot.stage          ?? {}
      this.background     = snapshot.background     ?? defaultBackground()
      this.image          = snapshot.image          ?? defaultImage()
      this.bgm            = snapshot.bgm            ?? null
      this.particles      = snapshot.particles      ?? null
      this.vars           = snapshot.vars           ?? {}
      this.quests         = snapshot.quests         ?? {}
      this.awaitingChoice = Boolean(snapshot.awaitingChoice)
      this.ended          = Boolean(snapshot.ended)
      this.history        = Array.isArray(snapshot.history)   ? snapshot.history   : []
      this.backStack      = Array.isArray(snapshot.backStack) ? snapshot.backStack : []
      this.settings       = { ...defaultSettings(), ...(snapshot.settings ?? {}) }
    },

    // ── Navigation ───────────────────────────────────────────────────────────
    setCursor(cursor)           { this.cursor = cursor },
    setCurrent(current)         { this.current = current },
    setAwaitingChoice(value)    { this.awaitingChoice = value },
    setEnded(value)             { this.ended = value },

    // ── Scene ────────────────────────────────────────────────────────────────
    setBackground(bg)           { this.background = bg },
    setImage(img)               { this.image = img },
    setBgm(track)               { this.bgm = track },
    setParticles(particles)     { this.particles = particles },
    setCharacters(characters)   { this.characters = characters },
    setCredits(credits)         { this.credits = Array.isArray(credits) ? credits : [] },

    showCharacter({ character, data }) {
      this.stage = { ...this.stage, [character]: data }
    },

    hideCharacter(character) {
      if (character) {
        const next = { ...this.stage }
        delete next[character]
        this.stage = next
      } else {
        this.stage = {}
      }
    },

    // ── Variables ────────────────────────────────────────────────────────────
    setVar({ key, value }) {
      this.vars = { ...this.vars, [key]: value }
    },

    setVars(vars) {
      this.vars = vars
    },

    // ── Quests ───────────────────────────────────────────────────────────────
    setQuests(quests) {
      this.quests = quests ?? {}
    },

    // ── Settings ─────────────────────────────────────────────────────────────
    setSetting({ key, value }) {
      this.settings = { ...this.settings, [key]: value }
    },

    // ── History / backstack ──────────────────────────────────────────────────
    pushHistory(step) {
      this.history.push({ ...step, _cursor: this.cursor })
    },

    pushBackDiff(diff) {
      if (!Array.isArray(diff) || diff.length === 0) return
      this.backStack.push(diff)
      if (this.backStack.length > 20) this.backStack.shift()
    },

    popBackDiff() {
      if (this.backStack.length === 0) return
      this.backStack.pop()
    },

    applyBackDiff(diff) {
      if (!Array.isArray(diff)) return
      diff.forEach((entry) => {
        this[entry.key] = cloneDeep(entry.before)
      })
    },

    clearBackStack() {
      this.backStack = []
    },
  },
})
