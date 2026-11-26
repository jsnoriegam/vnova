/**
 * docs-example/src/story/characters.js
 *
 * Character registry for the Hoshimi Academy demo.
 *
 * Fields:
 *   name          — displayed in the nameplate
 *   color         — nameplate accent color
 *   avatar        — fallback emoji when no sprite is available
 *   defaultSprite — default URL
 *   sprites       — expression/variant → sprite URL
 */

import mioAngry from '../assets/characters/01_Mio/mio_angry.png'
import mioEmbarrassed from '../assets/characters/01_Mio/mio_embarrassed.png'
import mioHappy from '../assets/characters/01_Mio/mio_happy.png'
import mioNeutral from '../assets/characters/01_Mio/mio_neutral.png'
import mioSad from '../assets/characters/01_Mio/mio_sad.png'
import mioSurprised from '../assets/characters/01_Mio/mio_surprised.png'

import lucienAngry from '../assets/characters/02_Lucien/lucien_angry.png'
import lucienEmbarrassed from '../assets/characters/02_Lucien/lucien_embarrassed.png'
import lucienHappy from '../assets/characters/02_Lucien/lucien_happy.png'
import lucienNeutral from '../assets/characters/02_Lucien/lucien_neutral.png'
import lucienSad from '../assets/characters/02_Lucien/lucien_sad.png'
import lucienSurprised from '../assets/characters/02_Lucien/lucien_surprised.png'

import novaAngry from '../assets/characters/03_Nova/nova_angry.png'
import novaEmbarrassed from '../assets/characters/03_Nova/nova_embarrassed.png'
import novaHappy from '../assets/characters/03_Nova/nova_happy.png'
import novaNeutral from '../assets/characters/03_Nova/nova_neutral.png'
import novaSad from '../assets/characters/03_Nova/nova_sad.png'
import novaSurprised from '../assets/characters/03_Nova/nova_surprised.png'

import shunAngry from '../assets/characters/04_Shun/shun_angry.png'
import shunEmbarrassed from '../assets/characters/04_Shun/shun_embarrassed.png'
import shunHappy from '../assets/characters/04_Shun/shun_happy.png'
import shunNeutral from '../assets/characters/04_Shun/shun_neutral.png'
import shunSad from '../assets/characters/04_Shun/shun_sad.png'
import shunSurprised from '../assets/characters/04_Shun/shun_surprised.png'

import vittorioAngry from '../assets/characters/05_Vittorio/vittorio_angry.png'
import vittorioEmbarrassed from '../assets/characters/05_Vittorio/vittorio_embarrassed.png'
import vittorioHappy from '../assets/characters/05_Vittorio/vittorio_happy.png'
import vittorioNeutral from '../assets/characters/05_Vittorio/vittorio_neutral.png'
import vittorioSad from '../assets/characters/05_Vittorio/vittorio_sad.png'
import vittorioSurprised from '../assets/characters/05_Vittorio/vittorio_surprised.png'

import minaPajamasAngry from '../assets/characters/06_Mina/mina_pajamas_angry.png'
import minaPajamasEmbarrassed from '../assets/characters/06_Mina/mina_pajamas_embarrassed.png'
import minaPajamasHappy from '../assets/characters/06_Mina/mina_pajamas_happy.png'
import minaPajamasNeutral from '../assets/characters/06_Mina/mina_pajamas_neutral.png'
import minaPajamasSad from '../assets/characters/06_Mina/mina_pajamas_sad.png'
import minaPajamasSurprised from '../assets/characters/06_Mina/mina_pajamas_surprised.png'
import minaStageAngry from '../assets/characters/06_Mina/mina_stage_angry.png'
import minaStageEmbarrassed from '../assets/characters/06_Mina/mina_stage_embarrassed.png'
import minaStageHappy from '../assets/characters/06_Mina/mina_stage_happy.png'
import minaStageNeutral from '../assets/characters/06_Mina/mina_stage_neutral.png'
import minaStageSad from '../assets/characters/06_Mina/mina_stage_sad.png'
import minaStageSurprised from '../assets/characters/06_Mina/mina_stage_surprised.png'

import lucienneAAngry from '../assets/characters/07_Lucienne/lucienne_a_angry.png'
import lucienneAEmbarrassed from '../assets/characters/07_Lucienne/lucienne_a_embarrassed.png'
import lucienneAHappy from '../assets/characters/07_Lucienne/lucienne_a_happy.png'
import lucienneANeutral from '../assets/characters/07_Lucienne/lucienne_a_neutral.png'
import lucienneASad from '../assets/characters/07_Lucienne/lucienne_a_sad.png'
import lucienneASmile from '../assets/characters/07_Lucienne/lucienne_a_smile.png'
import lucienneASurprised from '../assets/characters/07_Lucienne/lucienne_a_surprised.png'
import lucienneBAngry from '../assets/characters/07_Lucienne/lucienne_b_angry.png'
import lucienneBEmbarrassed from '../assets/characters/07_Lucienne/lucienne_b_embarrassed.png'
import lucienneBHappy from '../assets/characters/07_Lucienne/lucienne_b_happy.png'
import lucienneBNeutral from '../assets/characters/07_Lucienne/lucienne_b_neutral.png'
import lucienneBSad from '../assets/characters/07_Lucienne/lucienne_b_sad.png'
import lucienneBSmile from '../assets/characters/07_Lucienne/lucienne_b_smile.png'
import lucienneBSurprised from '../assets/characters/07_Lucienne/lucienne_b_surprised.png'

export const characters = {
  mio: {
    name: 'Mio',
    color: '#f472b6',
    avatar: '🌸',
    defaultSprite: mioNeutral,
    sprites: {
      neutral: mioNeutral,
      happy: mioHappy,
      sad: mioSad,
      angry: mioAngry,
      surprised: mioSurprised,
      embarrassed: mioEmbarrassed,
    },
  },

  lucien: {
    name: 'Lucien',
    color: '#60a5fa',
    avatar: '🎼',
    defaultSprite: lucienNeutral,
    sprites: {
      neutral: lucienNeutral,
      happy: lucienHappy,
      sad: lucienSad,
      angry: lucienAngry,
      surprised: lucienSurprised,
      embarrassed: lucienEmbarrassed,
    },
  },

  nova: {
    name: 'Nova',
    color: '#22d3ee',
    avatar: '🛰️',
    defaultSprite: novaNeutral,
    sprites: {
      neutral: novaNeutral,
      happy: novaHappy,
      sad: novaSad,
      angry: novaAngry,
      surprised: novaSurprised,
      embarrassed: novaEmbarrassed,
    },
  },

  shun: {
    name: 'Shun',
    color: '#fbbf24',
    avatar: '🏃',
    defaultSprite: shunNeutral,
    sprites: {
      neutral: shunNeutral,
      happy: shunHappy,
      sad: shunSad,
      angry: shunAngry,
      surprised: shunSurprised,
      embarrassed: shunEmbarrassed,
    },
  },

  vittorio: {
    name: 'Vittorio',
    color: '#a78bfa',
    avatar: '🎭',
    defaultSprite: vittorioNeutral,
    sprites: {
      neutral: vittorioNeutral,
      happy: vittorioHappy,
      sad: vittorioSad,
      angry: vittorioAngry,
      surprised: vittorioSurprised,
      embarrassed: vittorioEmbarrassed,
    },
  },

  mina: {
    name: 'Mina',
    color: '#fb7185',
    avatar: '🎤',
    defaultSprite: minaStageNeutral,
    sprites: {
      neutral: minaStageNeutral,
      happy: minaStageHappy,
      sad: minaStageSad,
      angry: minaStageAngry,
      surprised: minaStageSurprised,
      embarrassed: minaStageEmbarrassed,
      pajamas_neutral: minaPajamasNeutral,
      pajamas_happy: minaPajamasHappy,
      pajamas_sad: minaPajamasSad,
      pajamas_angry: minaPajamasAngry,
      pajamas_surprised: minaPajamasSurprised,
      pajamas_embarrassed: minaPajamasEmbarrassed,
    },
  },

  lucienne: {
    name: 'Lucienne',
    color: '#c084fc',
    avatar: '📚',
    defaultSprite: lucienneANeutral,
    sprites: {
      neutral: lucienneANeutral,
      happy: lucienneAHappy,
      sad: lucienneASad,
      angry: lucienneAAngry,
      surprised: lucienneASurprised,
      embarrassed: lucienneAEmbarrassed,
      smile: lucienneASmile,
      b_neutral: lucienneBNeutral,
      b_happy: lucienneBHappy,
      b_sad: lucienneBSad,
      b_angry: lucienneBAngry,
      b_surprised: lucienneBSurprised,
      b_embarrassed: lucienneBEmbarrassed,
      b_smile: lucienneBSmile,
    },
  },
}

export default characters
