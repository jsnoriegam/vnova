/**
 * docs-example/src/story/script.js
 *
 * Complete demo script for vnova-engine.
 * Shows every step type in action.
 */

export default [

  // ── SCENE 1: night city ───────────────────────────────────────────────────
  { type: 'label', id: 'start' },

  {
    type: 'scene',
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1200&q=80',
    transition: 'fade',
  },

  { type: 'bgm', track: 'calm', volume: 0.6, loop: true },

  { type: 'narrate', text: 'The city never truly sleeps. Even at 2 a.m., the lights pulse like a second heartbeat.' },

  { type: 'show', character: 'hana', position: 'left', expression: 'neutral' },

  { type: 'think', character: 'hana', text: '…I can\'t sleep again. This is the third night in a row.' },

  { type: 'show', character: 'kenji', position: 'right', expression: 'concerned' },

  { type: 'say', character: 'kenji', text: 'Hana? I heard you come out here. You okay?' },

  { type: 'say', character: 'hana', text: 'I was just thinking. About everything that happened.' },

  { type: 'say', character: 'kenji', text: 'We can talk about it. Or we don\'t have to. I\'ll just stand here.' },

  {
    type: 'choice',
    prompt: 'What does Hana say?',
    options: [
      { label: '"Thank you, Kenji. I appreciate that."', jump: 'route-warm'   },
      { label: '"I\'d rather be alone right now."',       jump: 'route-cold'   },
      { label: '"Tell me something — anything."',         jump: 'route-story'  },
    ],
  },

  // ── ROUTE: warm ───────────────────────────────────────────────────────────
  { type: 'label', id: 'route-warm' },

  { type: 'say', character: 'hana', text: 'Thank you, Kenji. I appreciate that.' },

  { type: 'say', character: 'kenji', text: 'Always.', expression: 'happy' },

  { type: 'sfx', track: 'chime' },

  { type: 'narrate', text: 'They stood in comfortable silence as the city hummed below them.' },

  { type: 'jump', target: 'epilogue' },

  // ── ROUTE: cold ───────────────────────────────────────────────────────────
  { type: 'label', id: 'route-cold' },

  { type: 'say', character: 'hana', text: 'I\'d rather be alone right now.' },

  { type: 'hide', character: 'kenji' },

  { type: 'say', character: 'hana', text: 'Some things can only be sorted out in solitude.' },

  { type: 'narrate', text: 'Kenji nodded quietly and went back inside, leaving Hana with the city and her thoughts.' },

  {
    type: 'call',
    fn: (state) => { state.vars.chose_solitude = true },
  },

  { type: 'jump', target: 'epilogue' },

  // ── ROUTE: story ──────────────────────────────────────────────────────────
  { type: 'label', id: 'route-story' },

  { type: 'say', character: 'hana', text: 'Tell me something — anything. I just need to hear a voice.' },

  {
    type: 'scene',
    src: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&q=80',
    transition: 'dissolve',
  },

  { type: 'say', character: 'kenji', text: 'Okay. Did you know the light from those city windows left those buildings before we were born?', expression: 'thoughtful' },

  { type: 'say', character: 'hana', text: 'That\'s… not true at all. Light travels fast.' },

  { type: 'say', character: 'kenji', text: 'I know. I just wanted to make you smile.' },

  { type: 'wait', ms: 600 },

  { type: 'say', character: 'hana', text: '…You\'re an idiot.', expression: 'happy' },

  { type: 'narrate', text: 'But she was smiling.' },

  { type: 'jump', target: 'epilogue' },

  // ── EPILOGUE ──────────────────────────────────────────────────────────────
  { type: 'label', id: 'epilogue' },

  {
    type: 'scene',
    src: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1200&q=80',
    transition: 'fade',
  },

  { type: 'bgm', track: 'dawn', volume: 0.5, loop: true },

  { type: 'narrate', text: 'Dawn arrived slowly, as it always does — indifferent to the small dramas below.' },

  { type: 'say', character: 'hana', text: 'Same time tomorrow?' },

  { type: 'say', character: 'kenji', text: 'I\'ll be here.' },

  { type: 'narrate', text: 'Some promises are small. That doesn\'t make them less real.' },

]
