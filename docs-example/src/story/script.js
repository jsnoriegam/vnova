/**
 * docs-example/src/story/script.js
 *
 * Showcase script for vnova-engine.
 * Covers: scene, image, show/hide, say/think/narrate,
 * choices with set/inc, call, wait, jump, bgm/sfx/video and end.
 */

export default [
  {
    type: 'label',
    id: 'start',
    steps: [
      { type: 'scene', id: 'control-room', transition: 'fade' },
      { type: 'bgm', id: 'pulse', volume: 0.6, loop: true },
      { type: 'video', id: 'ui-loop', muted: true, loop: true },

      { type: 'narrate', text: 'Year 2147. The city runs on memory and borrowed time.' },
      { type: 'show', character: 'hana', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'kenji', position: 'right', expression: 'concerned' },

      { type: 'say', character: 'kenji', text: 'Signal lock is unstable. We have one chance to transmit.' },
      {
        type: 'notify',
        status: 'warning',
        title: 'SYS// PRIORITY ALERT',
        text: 'Relay integrity at 39%. Tactical decision required.',
      },
      { type: 'think', character: 'hana', text: 'One chance. One call. One timeline I can still save.' },

      {
        type: 'choice',
        prompt: 'Choose your opening move:',
        options: [
          {
            label: 'Calm the team and proceed carefully',
            jump: 'route-steady',
            set: { approach: 'steady' },
            inc: { trust: 2, risk: -1 },
          },
          {
            label: 'Rush the upload before the jammer adapts',
            jump: 'route-risky',
            set: { approach: 'risky' },
            inc: { trust: -1, risk: 3 },
          },
          {
            label: 'Run diagnostics and gather more data',
            jump: 'route-analyst',
            set: { approach: 'analyst' },
            inc: { trust: 1, risk: 0 },
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'route-steady',
    steps: [
      { type: 'sfx', id: 'confirm' },
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
      { type: 'sfx', id: 'alarm' },
      {
        type: 'notify',
        status: 'error',
        title: 'SYS// THERMAL SURGE',
        text: 'Relay core entering unsafe envelope.',
      },
      { type: 'say', character: 'hana', text: 'No time. Push full bandwidth now.' },
      { type: 'say', character: 'kenji', text: 'That could fry the relay.', expression: 'concerned' },
      { type: 'call', fn: (state) => { state.vars.overheat = true } },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'route-analyst',
    steps: [
      { type: 'image', id: 'diagnostic-overlay', transition: 'dissolve', fit: 'both' },
      {
        type: 'notify',
        status: 'info',
        title: 'SYS// DIAGNOSTICS ONLINE',
        text: 'Threat map and packet telemetry synced.',
      },
      { type: 'narrate', text: 'Diagnostic layer projected: packet loss, relay drift, hostile pings.' },
      { type: 'say', character: 'hana', text: 'Pattern found. We can route around the jammer.' },
      { type: 'say', character: 'kenji', text: 'Nice catch.', expression: 'happy' },
      { type: 'image', src: null, transition: 'fade' },
      { type: 'jump', target: 'checkpoint' },
    ],
  },

  {
    type: 'label',
    id: 'checkpoint',
    steps: [
      {
        type: 'call',
        fn: (state) => {
          const trust = Number(state.vars.trust ?? 0)
          const risk = Number(state.vars.risk ?? 0)
          state.vars.tone = trust >= risk ? 'hopeful' : 'tense'
        },
      },
      { type: 'scene', id: 'tower-roof', transition: 'slide-left' },
      { type: 'bgm', id: 'glow', volume: 0.5, loop: true },
      { type: 'video', stop: true },

      { type: 'narrate', text: 'The relay tower wakes. Neon rain cuts across the skyline.' },
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
      { type: 'sfx', id: 'uplink' },
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
      { type: 'sfx', id: 'confirm' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'epilogue',
    steps: [
      { type: 'scene', id: 'sunrise', transition: 'fade', stopMusic: true },
      { type: 'narrate', text: 'By sunrise, the city is different. Not healed, but awake.' },
      { type: 'say', character: 'hana', text: 'Same mission tomorrow?' },
      { type: 'say', character: 'kenji', text: 'Always.' },
      { type: 'end' },
    ],
  },
]
