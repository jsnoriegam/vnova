/**
 * docs-example/src/story/items.js
 *
 * Inventory catalog for the Hoshimi Academy demo. Types are presets: only the
 * primary type contributes behavior defaults; secondary types are membership.
 */

export const itemTypes = {
  consumable: {
    label: 'Consumible',
    stackable: true,
    consumable: true,
    unique: false,
    maxStack: 5,
    usable: true,
    icon: '🧪',
  },
  special: {
    label: 'Especial',
    stackable: false,
    consumable: false,
    unique: true,
    maxStack: 1,
    usable: false,
    icon: '⭐',
  },
  key: {
    extends: 'special',
    label: 'Llave',
    icon: '🗝️',
  },
  weapon: {
    extends: 'special',
    label: 'Arma',
    icon: '⚔️',
    slot: 'hand',
  },
  cursed: {
    label: 'Maldito',
    icon: '☠️',
    color: '#a855f7',
  },
}

export const items = {
  energyDrink: {
    type: 'consumable',
    name: 'Bebida energética',
    description: 'Una lata fría para aguantar hasta el amanecer. Se consume al usarla.',
    icon: '🥤',
    use: {
      inc: { energy: 1 },
      notify: {
        status: 'success',
        title: 'ENERGY// +1',
        text: 'Recuperas el aliento para la última ronda.',
      },
    },
  },
  stagePass: {
    type: 'special',
    name: 'Pase de escenario',
    description: 'Acceso al backstage del festival. Mina lo firmó con un rotulador rosa.',
    icon: '🎫',
  },
  archiveKey: {
    type: 'key',
    name: 'Llave del archivo',
    description: 'Abre la sala de documentos del club de música. Fría al tacto.',
    icon: '🗝️',
  },
  filmRoll: {
    type: ['special', 'cursed'],
    name: 'Rollo de película',
    description: 'Un rollo de 16 mm sin etiqueta. El celuloide zumba bajito.',
    icon: '🎞️',
    tags: ['archivo', 'peligroso'],
  },
  clockKey: {
    type: 'key',
    name: 'Llave del reloj',
    description: 'La llave de cuerda de la torre. Pesa más de lo que debería.',
    icon: '⏱️',
  },
}
