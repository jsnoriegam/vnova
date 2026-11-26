/**
 * docs-example/src/story/gallery.js
 *
 * Meta-progress definitions for the Hoshimi Academy demo. Unlock ids are used
 * by `unlock` steps in the scripts.
 */

import schoolYard from '../assets/backgrounds/school-yard.png'
import schoolStages from '../assets/backgrounds/school-stages.png'
import schoolLibrary from '../assets/backgrounds/school-library.png'
import schoolCorridor from '../assets/backgrounds/school-corridor.png'
import cafeNight from '../assets/backgrounds/cafe_night.png'
import cityNight from '../assets/backgrounds/city_night.png'
import beach from '../assets/backgrounds/beach.png'

export const gallery = {
  title: 'Hoshimi Archive',
  cgs: [
    {
      id: 'cg-yard',
      title: 'Festival Eve',
      description: 'The courtyard before the last light.',
      src: schoolYard,
    },
    {
      id: 'cg-stage',
      title: 'Backstage',
      description: 'Mina and Vittorio hold the stage together.',
      src: schoolStages,
    },
    {
      id: 'cg-library',
      title: 'The Archive',
      description: 'Lucienne opens a door that should stay closed.',
      src: schoolLibrary,
    },
    {
      id: 'cg-tower',
      title: 'Clockwork',
      description: 'Nova and Shun race the tower stairs.',
      src: schoolCorridor,
    },
    {
      id: 'cg-cafe',
      title: 'Midnight Café',
      description: 'Five cups, one decision.',
      src: cafeNight,
    },
    {
      id: 'cg-finale',
      title: 'The Last Light',
      description: 'The tower wakes up.',
      src: cityNight,
    },
    {
      id: 'cg-beach',
      title: 'After the Festival',
      description: 'Morning, salt, and a promise.',
      src: beach,
    },
  ],
  endings: [
    {
      id: 'ending-open',
      title: 'Open Stage',
      description: 'You opened the festival to the whole city.',
    },
    {
      id: 'ending-archive',
      title: 'Quiet Archive',
      description: 'You kept the secret and protected the club.',
    },
    {
      id: 'ending-broadcast',
      title: 'Midnight Broadcast',
      description: 'You gave the truth a frequency of its own.',
    },
  ],
  achievements: [
    {
      id: 'first-day',
      title: 'Festival Eve',
      description: 'Accepted the job nobody else wanted.',
    },
    {
      id: 'stage-route',
      title: 'Backstage Pass',
      description: 'Chose the stage crew and survived Mina.',
    },
    {
      id: 'archive-route',
      title: 'Paper Trails',
      description: 'Followed Lucienne into the archive.',
    },
    {
      id: 'tower-route',
      title: 'Clockwork',
      description: 'Climbed the tower with Nova and Shun.',
    },
    {
      id: 'dawn-witness',
      title: 'Dawn Witness',
      description: 'Saw the festival through to sunrise.',
    },
  ],
  chapters: [
    {
      id: 'chapter-1',
      title: 'Chapter 1 — Festival Eve',
      description: 'The courtyard, the committee, and the first choice.',
      label: 'start',
    },
    {
      id: 'chapter-2',
      title: 'Chapter 2 — Midnight Café',
      description: 'The plan comes together.',
      label: 'midnight',
    },
    {
      id: 'chapter-3',
      title: 'Chapter 3 — The Last Light',
      description: 'One final broadcast.',
      label: 'finale',
    },
  ],
}

export default gallery
