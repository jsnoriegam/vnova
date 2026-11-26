/**
 * docs-example/src/story/script_en.js
 *
 * “The Last Light of Hoshimi Academy” — English script.
 * Keep structural parity with script_es.js.
 */

export default [
  {
    type: 'label',
    id: 'start',
    steps: [
      { type: 'scene', id: 'school-yard', transition: 'fade' },
      { type: 'bgm', id: 'grid', volume: 0.55, loop: true },
      { type: 'particles', id: 'stars' },
      {
        type: 'narrate',
        text: 'Hoshimi Academy, 5:47 PM. The festival starts in two hours — and the clock tower has gone [b]silent[/b].',
      },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'say', character: 'mio', text: 'There you are! The committee is one disaster away from cancelling everything.' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'neutral' },
      { type: 'say', character: 'lucien', text: 'The tower stopped at 5:47. Nobody knows why. We have one contingency left: you.' },
      {
        type: 'input',
        store: 'player.name',
        prompt: 'Before we start, what should the committee call you?',
        placeholder: 'Your name',
        default: 'Akira',
        submitLabel: 'Join the committee',
      },
      { type: 'say', character: 'mio', text: '{{player.name}}! Perfect. Pick a team and we can still save the last light.' },
      { type: 'unlock', chapter: 'chapter-1', achievement: 'first-day', cg: 'cg-yard' },
      { type: 'item', id: 'energyDrink', qty: 2 },
      {
        type: 'once',
        id: 'festival-hint',
        steps: [
          {
            type: 'notify',
            status: 'info',
            title: 'COMMITTEE// HINT',
            text: 'Choices unlock CGs and achievements. The Inventory button is in the HUD.',
          },
        ],
      },
      {
        type: 'choice',
        prompt: 'Which team do you join?',
        options: [
          {
            label: 'Backstage with Mina and Vittorio',
            jump: 'route-stage',
            set: { route: 'stage' },
            inc: { trust: 1 },
          },
          {
            label: 'The archive with Lucienne and Nova',
            jump: 'route-archive',
            set: { route: 'archive' },
            inc: { clues: 1 },
          },
          {
            label: 'The clock tower with Nova and Shun',
            jump: 'route-tower',
            set: { route: 'tower' },
            inc: { courage: 1 },
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'route-stage',
    steps: [
      { type: 'scene', id: 'school-stages', transition: 'fade' },
      { type: 'show', character: 'mina', position: 'center', expression: 'happy' },
      { type: 'show', character: 'vittorio', position: 'left-far', expression: 'neutral' },
      {
        type: 'narrate',
        text: 'The stage smells of paint, dust and too much hairspray. Mina is wearing her performance outfit.',
      },
      { type: 'say', character: 'mina', text: 'Finally, someone with working hands! Hold this cable. No — the other end.' },
      { type: 'say', character: 'vittorio', text: 'Ignore her. The lighting rig is the real emergency. We need a stage pass to reach the balcony.' },
      { type: 'item', id: 'stagePass' },
      { type: 'unlock', cg: 'cg-stage', achievement: 'stage-route' },
      { type: 'set', inc: { clues: 1 } },
      { type: 'say', character: 'mina', text: 'Take the pass. And if the lights die, I am blaming the tower, not you.' },
      { type: 'jump', target: 'cafe' },
    ],
  },

  {
    type: 'label',
    id: 'route-archive',
    steps: [
      { type: 'scene', id: 'school-library', transition: 'fade' },
      { type: 'show', character: 'lucienne', position: 'right', expression: 'neutral' },
      { type: 'show', character: 'nova', position: 'left-far', expression: 'surprised' },
      {
        type: 'narrate',
        text: 'The archive is colder than the rest of the school. Lucienne has already pulled three boxes from the shelves.',
      },
      { type: 'say', character: 'lucienne', text: 'The tower is not broken. It was switched off. The order is in one of these files.' },
      { type: 'say', character: 'nova', text: 'I can loop the corridor cameras for six minutes. After that, we are officially ghosts.' },
      { type: 'item', id: 'archiveKey' },
      { type: 'item', id: 'filmRoll' },
      { type: 'unlock', cg: 'cg-library', achievement: 'archive-route' },
      { type: 'set', inc: { clues: 2 } },
      { type: 'say', character: 'lucienne', text: 'Take the archive key and the film. Do not play the film until the tower is awake.' },
      { type: 'jump', target: 'cafe' },
    ],
  },

  {
    type: 'label',
    id: 'route-tower',
    steps: [
      { type: 'scene', id: 'school-corridor', transition: 'fade' },
      { type: 'show', character: 'nova', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'shun', position: 'right', expression: 'happy' },
      {
        type: 'narrate',
        text: 'The corridor to the tower is locked, but Shun has already found a window that “definitely opens.”',
      },
      { type: 'say', character: 'shun', text: 'Stairs first, questions later. I can carry the equipment. Probably.' },
      { type: 'say', character: 'nova', text: 'The clock key is in the maintenance box. If the mechanism is jammed, we can still jump-start it.' },
      { type: 'item', id: 'clockKey' },
      { type: 'unlock', cg: 'cg-tower', achievement: 'tower-route' },
      { type: 'set', inc: { courage: 1, clues: 1 } },
      { type: 'say', character: 'shun', text: 'One key, one tower, one very bad idea. Let’s go.' },
      { type: 'jump', target: 'cafe' },
    ],
  },

  {
    type: 'label',
    id: 'cafe',
    steps: [
      { type: 'scene', id: 'cafe-night', transition: 'fade' },
      { type: 'show', character: 'mio', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'neutral' },
      {
        type: 'narrate',
        text: 'The café is half-empty. Five cups, one table, and a clock that is still wrong.',
      },
      {
        type: 'if',
        condition: { var: 'route', eq: 'stage' },
        then: [
          { type: 'say', character: 'mio', text: 'Mina says the balcony lights are ready. She also said “do not touch the red cable.”' },
        ],
        else: [
          {
            type: 'if',
            condition: { var: 'route', eq: 'archive' },
            then: [
              { type: 'say', character: 'lucien', text: 'Lucienne found the shutdown order. Someone above us wanted the tower quiet.' },
            ],
            else: [
              { type: 'say', character: 'mio', text: 'Shun is still buzzing. Nova says the clock key fits.' },
            ],
          },
        ],
      },
      { type: 'say', character: 'lucien', text: 'We can still choose what the last light means. We only get one move.' },
      { type: 'unlock', cg: 'cg-cafe' },
      {
        type: 'choice',
        prompt: 'Take a breath before the last push?',
        options: [
          {
            label: 'Drink an energy drink',
            jump: 'drink',
            condition: { hasItem: 'energyDrink' },
          },
          {
            label: 'Keep your focus',
            jump: 'midnight',
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'drink',
    steps: [
      { type: 'item', action: 'use', id: 'energyDrink' },
      { type: 'say', character: 'mio', text: 'Better? You looked like you were about to nap standing up.' },
      { type: 'say', character: 'lucien', text: 'Good. Then we move.' },
      { type: 'jump', target: 'midnight' },
    ],
  },

  {
    type: 'label',
    id: 'midnight',
    steps: [
      { type: 'scene', id: 'city-night', transition: 'fade' },
      { type: 'particles', id: 'stars' },
      { type: 'show', character: 'nova', position: 'left', expression: 'neutral' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'sad' },
      { type: 'narrate', text: '11:58 PM. The city is a grid of windows, and the tower is the only dark one.' },
      { type: 'say', character: 'nova', text: 'The signal is clean. Whatever we do now will be remembered.' },
      {
        type: 'if',
        condition: { hasItem: 'clockKey' },
        then: [
          { type: 'say', character: 'lucien', text: 'The clock key is warm. It knows we are here.' },
        ],
        else: [
          { type: 'say', character: 'lucien', text: 'Without the clock key, the tower stays asleep. We will have to be louder than it.' },
        ],
      },
      { type: 'unlock', chapter: 'chapter-2' },
      { type: 'jump', target: 'finale' },
    ],
  },

  {
    type: 'label',
    id: 'finale',
    steps: [
      { type: 'scene', id: 'school-stages', transition: 'fade' },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'neutral' },
      { type: 'show', character: 'mina', position: 'center', expression: 'surprised' },
      {
        type: 'narrate',
        text: 'The last light is not a machine. It is a choice about who gets to stand under it.',
      },
      { type: 'say', character: 'mina', text: 'The stage is yours, {{player.name}}. Try not to break it.' },
      { type: 'say', character: 'lucien', text: 'Whatever you choose, the committee follows.' },
      { type: 'unlock', chapter: 'chapter-3', cg: 'cg-finale' },
      {
        type: 'choice',
        prompt: 'How does the festival end?',
        options: [
          {
            label: 'Open the doors to the whole city',
            jump: 'ending-open',
          },
          {
            label: 'Seal the archive and protect the club',
            jump: 'ending-archive',
          },
          {
            label: 'Broadcast the truth from the clock tower',
            jump: 'ending-broadcast',
            disabled: { not: { hasItem: 'clockKey' } },
            disabledText: 'You need the clock key.',
          },
        ],
      },
    ],
  },

  {
    type: 'label',
    id: 'ending-open',
    steps: [
      { type: 'scene', id: 'city-day', transition: 'fade' },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'happy' },
      { type: 'narrate', text: 'At sunrise, the gates open. The city walks in.' },
      { type: 'say', character: 'mio', text: 'We ran out of tickets twenty minutes ago. Nobody cares.' },
      { type: 'say', character: 'lucien', text: 'The tower is still wrong. But for one morning, everyone is on time.' },
      { type: 'unlock', ending: 'ending-open' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'ending-archive',
    steps: [
      { type: 'scene', id: 'school-library', transition: 'fade' },
      { type: 'show', character: 'lucienne', position: 'center', expression: 'b_smile' },
      { type: 'narrate', text: 'The archive closes at dawn. Some truths stay filed away, safe and sharp.' },
      { type: 'say', character: 'lucienne', text: 'You chose the quiet ending. The club will survive. The city will wonder.' },
      { type: 'say', character: 'lucienne', text: 'Come back next year. I will leave the light on.' },
      { type: 'unlock', ending: 'ending-archive' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'ending-broadcast',
    steps: [
      { type: 'scene', id: 'city-night', transition: 'fade' },
      { type: 'show', character: 'nova', position: 'left', expression: 'happy' },
      { type: 'show', character: 'shun', position: 'right', expression: 'surprised' },
      { type: 'effect', name: 'flash', duration: 500, config: { color: 'rgba(180, 240, 255, 0.9)' }, wait: true },
      { type: 'narrate', text: 'The tower speaks in every language the city knows.' },
      { type: 'say', character: 'nova', text: 'Signal is everywhere. They can’t ignore this one.' },
      { type: 'say', character: 'shun', text: 'You just broadcast the whole truth. On festival night. Legend.' },
      { type: 'unlock', ending: 'ending-broadcast' },
      { type: 'jump', target: 'epilogue' },
    ],
  },

  {
    type: 'label',
    id: 'epilogue',
    steps: [
      { type: 'scene', id: 'beach', transition: 'fade', stopMusic: true },
      { type: 'unlock', cg: 'cg-beach', achievement: 'dawn-witness' },
      { type: 'narrate', text: 'Later, the committee escapes to the beach with sand in their shoes and the festival behind them.' },
      { type: 'show', character: 'mio', position: 'left', expression: 'happy' },
      { type: 'show', character: 'lucien', position: 'right', expression: 'happy' },
      { type: 'say', character: 'mio', text: 'So… same disaster next year?' },
      { type: 'say', character: 'lucien', text: 'Same committee. Better clock.' },
      { type: 'end' },
    ],
  },
]
