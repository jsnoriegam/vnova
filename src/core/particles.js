export const PARTICLE_PRESETS = {
  snow: {
    particles: {
      number: { value: 120, density: { enable: true, value_area: 800 } },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: { value: 0.75, random: true },
      size: { value: 3, random: true },
      line_linked: { enable: false },
      move: {
        enable: true,
        speed: 1.6,
        direction: 'bottom',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false,
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: false, mode: 'repulse' },
        onclick: { enable: false, mode: 'push' },
        resize: true,
      },
    },
    retina_detect: true,
  },
  stars: {
    particles: {
      number: { value: 90, density: { enable: true, value_area: 1000 } },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: {
        value: 0.7,
        random: true,
        anim: { enable: true, speed: 0.6, opacity_min: 0.25, sync: false },
      },
      size: { value: 2.2, random: true },
      line_linked: { enable: false },
      move: {
        enable: true,
        speed: 0.25,
        direction: 'none',
        random: true,
        straight: false,
        out_mode: 'out',
        bounce: false,
      },
    },
    interactivity: {
      detect_on: 'canvas',
      events: {
        onhover: { enable: false, mode: 'repulse' },
        onclick: { enable: false, mode: 'push' },
        resize: true,
      },
    },
    retina_detect: true,
  },
}
