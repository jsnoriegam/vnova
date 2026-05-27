/**
 * docs-example/src/story/characters.js
 *
 * Character registry. Each entry is keyed by the id used in the script.
 *
 * Fields:
 *   name            — displayed in the nameplate
 *   color           — nameplate accent color (any CSS color)
 *   avatar          — fallback emoji shown by VNovaStage when no sprite slot
 *   defaultSprite   — URL used when show() doesn't specify a sprite
 *   expressions     — map of expression name → sprite URL (optional)
 */

export const characters = {
  hana: {
    name:          'Hana',
    color:         '#e879b0',
    avatar:        '👩',
    defaultSprite: null,
    expressions:   {
      neutral:     null,
      happy:       null,
      sad:         null,
    },
  },

  kenji: {
    name:          'Kenji',
    color:         '#79b0e8',
    avatar:        '🧑',
    defaultSprite: null,
    expressions:   {
      neutral:     null,
      concerned:   null,
      happy:       null,
      thoughtful:  null,
    },
  },
}
