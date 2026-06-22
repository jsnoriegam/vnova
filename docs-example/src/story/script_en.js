/**
 * docs-example/src/story/script.js
 *
 * Showcase script for vnova-engine.
 * Covers: scene, image, show/hide, say/think/narrate,
 * choices with set/inc, call, wait, jump, bgm/sfx/video and end.
 */

import { useEngine } from 'vnova-engine'

export default [
  {
    type: 'label',
    id: 'start',
    steps: [
      { type: 'scene', id: 'control-room', transition: 'fade' },
      { type: 'particles', id: 'stars' },
      { type: 'bgm', id: 'grid', volume: 0.6, loop: true },

      { type: 'narrate', text: 'Year [b]2147[/b]. The city runs on [i]memory[/i] and [color=#e06c75]borrowed time[/color].' },
      { type: 'show', character: 'hana', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'kenji', position: 'right', expression: 'concerned' },

      { type: 'say', character: 'kenji', text: 'Signal lock is [color=#e5c07b]unstable[/color]. We have [b]one chance[/b] to transmit.' },
      {
        type: 'notify',
        status: 'warning',
        title: 'SYS// PRIORITY ALERT',
        text: 'Relay integrity at 39%. Tactical decision required.',
      },
      { type: 'think', character: 'hana', text: 'One chance. One call. One timeline I can still save.' },
      {
        type: 'input',
        store: 'player.name',
        prompt: 'Before we proceed, identify yourself, operator:',
        placeholder: 'Enter your codename',
        default: 'Astra',
        submitLabel: 'Confirm identity',
      },
      {
        type: 'select',
        store: 'player.commMode',
        prompt: 'Choose your communication mode:',
        options: [
          { label: 'Diplomatic channel', value: 'diplomatic', inc: { trust: 1 } },
          { label: 'Direct tactical channel', value: 'tactical', inc: { risk: 1 } },
          { label: 'Silent observer mode', value: 'silent', inc: { trust: 0, risk: -1 } },
        ],
      },
      { type: 'narrate', text: 'Operator {{player.name}} online. Comm profile: {{player.commMode}}.' },

      {
        type: 'modal',
        id: 'city-map-route',
        title: 'Tactical Infiltration Map',
        prompt: 'Select your insertion route by choosing one of the active pins.',
        options: [
          {
            label: 'Canal district route',
            jump: 'route-steady',
            set: { approach: 'steady' },
            inc: { trust: 2, risk: -1 },
            pin: { x: 22, y: 70, caption: 'Canals', detail: 'Low noise approach' },
          },
          {
            label: 'Relay core sprint',
            jump: 'route-risky',
            set: { approach: 'risky' },
            inc: { trust: -1, risk: 3 },
            pin: { x: 68, y: 38, caption: 'Core Relay', detail: 'Fastest, highest risk' },
          },
          {
            label: 'Signal observatory sweep',
            jump: 'route-analyst',
            set: { approach: 'analyst' },
            inc: { trust: 1, risk: 0 },
            pin: { x: 52, y: 18, caption: 'Observatory', detail: 'Intel-first route' },
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'route-steady',
    steps: [
      {
        type: 'notify',
        status: 'success',
        title: 'SYS// STABILIZATION',
        text: 'Team sync +12%. Noise floor reduced.',
      },
      { type: 'say', character: 'hana', text: 'Breathe. We do this clean, step by step.' },
      { type: 'say', character: 'kenji', text: 'Copy that. Synchronizing channels now.', expression: 'happy' },
      { type: 'wait', ms: 500 },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'route-risky',
    steps: [
      {
        type: 'notify',
        status: 'error',
        title: 'SYS// THERMAL SURGE',
        text: 'Relay core entering unsafe envelope.',
      },
      { type: 'say', character: 'hana', text: 'No time. Push full bandwidth now.' },
      { type: 'say', character: 'kenji', text: 'That could fry the relay.', expression: 'concerned' },
      { type: 'effect', name: 'shake', target: 'kenji', duration: 300, config: { intensity: 4 } },
      {
        type: 'call',
        fn: () => {
          const engine = useEngine()
          engine.setVar('overheat', true)
        },
      },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'route-analyst',
    steps: [
      { type: 'image', id: 'diagnostic-overlay', transition: 'dissolve', fit: 'both' },
      { type: 'effect', name: 'pulse', target: 'image', duration: 1000, config: { cycles: 2, opacity: 0.6 }, wait: true },
      {
        type: 'notify',
        status: 'info',
        title: 'SYS// DIAGNOSTICS ONLINE',
        text: 'Threat map and packet telemetry synced.',
      },
      { type: 'narrate', text: 'Diagnostic layer projected: packet loss, relay drift, hostile pings.' },
      { type: 'say', character: 'hana', text: 'Pattern found. We can route around the jammer.' },
      { type: 'say', character: 'kenji', text: 'Nice catch.', expression: 'happy' },
      { type: 'hide', image: true, transition: 'fade' },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'checkpoint',
    steps: [
      {
        type: 'call',
        fn: () => {
          const engine = useEngine()
          const trust = Number(engine.getVar('trust') ?? 0)
          const risk = Number(engine.getVar('risk') ?? 0)
          engine.setVar('tone', trust >= risk ? 'hopeful' : 'tense')
        },
      },
      { type: 'scene', id: 'tower-roof', transition: 'slide-left' },
      { type: 'effect', name: 'shake', target: 'bg', duration: 400, config: { intensity: 5, direction: 'vertical' } },
      { type: 'particles', id: 'leaves' },
      { type: 'effect', name: 'shake', target: 'stage', duration: 600, config: { intensity: 10 }, wait: true },

      { type: 'narrate', text: 'The relay tower [b]wakes[/b]. [color=#61afef]Neon rain[/color] cuts across the [i]skyline[/i].' },
      {
        type: 'choice',
        prompt: 'Final broadcast mode:',
        options: [
          { label: 'Open channel: tell the whole truth', jump: 'ending-open', inc: { trust: 1 } },
          { label: 'Encrypted channel: protect the team first', jump: 'ending-shield', inc: { risk: -1 } },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'ending-open',
    steps: [
      { type: 'say', character: 'hana', text: 'No more secrets. We transmit everything.' },
      {
        type: 'notify',
        status: 'success',
        title: 'SYS// UPLINK MODE: OPEN',
        text: 'Global channel established. Identity shielding disabled.',
      },
      { type: 'effect', name: 'flash', duration: 400, config: { color: 'rgba(255, 255, 255, 0.9)' }, wait: true },
      { type: 'hide', character: 'kenji' },
      { type: 'narrate', text: 'A million screens flicker alive across the city.' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'ending-shield',
    steps: [
      { type: 'say', character: 'hana', text: 'We keep identities sealed. Data out, names protected.' },
      {
        type: 'notify',
        status: 'info',
        title: 'SYS// UPLINK MODE: ENCRYPTED',
        text: 'Protected channel locked. Source identities masked.',
      },
      { type: 'say', character: 'kenji', text: 'Then we both live to fight tomorrow.', expression: 'thoughtful' },
      { type: 'effect', name: 'pulse', duration: 800, config: { cycles: 3, opacity: 0.4 } },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'epilogue',
    steps: [
      { type: 'hide', particles: true },
      { type: 'scene', id: 'sunrise', transition: 'fade', stopMusic: true },
      { type: 'narrate', text: 'By sunrise, the city is [b]different[/b]. Not [i]healed[/i], but [color=#98c379]awake[/color].' },
      { type: 'narrate', text: '[b][color=#61afef]Rich text demo:[/color][/b] [i]cursiva[/i], [b]negrita[/b], [color=#e06c75]color[/color], y [b][i]negrita+cursiva[/i][/b].' },
      { type: 'say', character: 'hana', text: 'Same mission tomorrow?' },
      { type: 'say', character: 'kenji', text: 'Always.' },
      { type: 'effect', name: 'zoom', duration: 1000, config: { scale: 1.1, zoomDirection: 'in' }, wait: true },
      { type: 'end' },
    ],
  },
]
