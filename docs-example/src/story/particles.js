export const particles = {
  leaves: {
    particles: {
      number: { value: 70, density: { enable: true, value_area: 900 } },
      color: { value: '#7dbf6a' },
      shape: {
        type: 'image',
        image: {
          src: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2228%22 height=%2228%22 viewBox=%220 0 28 28%22%3E%3Cpath fill=%22%237dbf6a%22 d=%22M24.2 4.8c-6 .5-10.5 2.9-13.2 7.6-2 3.5-2.2 7.1-1.6 10.1 3.2-.4 6.5-1.9 9.2-4.8 3.8-4.1 5.3-8.7 5.6-12.9zM5.5 23.7c3.8-.6 6.7-2.2 9.1-4.8l1.2 1.1c-2.7 2.8-5.9 4.7-10.1 5.4l-.2-1.7z%22/%3E%3C/svg%3E',
          width: 28,
          height: 28,
        },
      },
      opacity: { value: 0.85, random: true },
      size: { value: 14, random: true },
      line_linked: { enable: false },
      move: {
        enable: true,
        speed: 1.2,
        direction: 'bottom-right',
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

export default particles
