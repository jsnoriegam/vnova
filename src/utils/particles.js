/* -----------------------------------------------
 * particles.js v2.0.0 — modernized fork
 * Original: Vincent Garreau — vincentgarreau.com
 * MIT license: http://opensource.org/licenses/MIT
 *
 * Changes vs original:
 *  - Removed Object.deepExtend (arguments.callee, global pollution)
 *  - Removed window.requestAnimFrame / cancelRequestAnimFrame globals
 *  - Uses requestAnimationFrame / cancelAnimationFrame directly
 *  - Event listeners cleaned up on destroy (no memory leaks)
 *  - mousemove / touchmove listeners use { passive: true }
 *  - Date.now() instead of new Date().getTime()
 *  - window.URL instead of webkitURL fallback (all modern browsers support it)
 *  - var → const / let throughout
 *  - pJSDom destroy properly removes the instance instead of nulling the array
 *  - Defensive checks on canvas_el before accessing offsetWidth/offsetHeight
 * ----------------------------------------------- */

/* ---------- helpers ---------- */

function deepExtend(destination, source) {
  const target =
    destination && typeof destination === "object" ? destination : {};
  if (!source || typeof source !== "object") return target;

  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val !== null && typeof val === "object" && !Array.isArray(val) &&
        Object.getPrototypeOf(val) === Object.prototype) {
      target[key] = deepExtend(
        target[key] && typeof target[key] === "object" ? target[key] : {},
        val
      );
    } else if (Array.isArray(val)) {
      target[key] = val.slice();
    } else {
      target[key] = val;
    }
  }
  return target;
}

function hexToRgb(hex) {
  // By Tim Down - http://stackoverflow.com/a/5624139/3493650
  const shorthand = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthand, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function clamp(number, min, max) {
  return Math.min(Math.max(number, min), max);
}

function isInArray(value, array) {
  return array.indexOf(value) > -1;
}

/* ---------- pJS constructor ---------- */

const pJS = function (tag_id, params) {
  const canvas_el = document.querySelector(
    "#" + tag_id + " > .particles-js-canvas-el"
  );

  if (!canvas_el) {
    console.warn("pJS: canvas element not found for #" + tag_id);
    return;
  }

  /* default config */
  this.pJS = {
    canvas: {
      el: canvas_el,
      w: canvas_el.offsetWidth,
      h: canvas_el.offsetHeight,
    },
    particles: {
      number: {
        value: 400,
        density: {
          enable: true,
          value_area: 800,
        },
      },
      color: {
        value: "#fff",
      },
      shape: {
        type: "circle",
        stroke: {
          width: 0,
          color: "#ff0000",
        },
        polygon: {
          nb_sides: 5,
        },
        image: {
          src: "",
          width: 100,
          height: 100,
        },
      },
      opacity: {
        value: 1,
        random: false,
        anim: {
          enable: false,
          speed: 2,
          opacity_min: 0,
          sync: false,
        },
      },
      size: {
        value: 20,
        random: false,
        anim: {
          enable: false,
          speed: 20,
          size_min: 0,
          sync: false,
        },
      },
      line_linked: {
        enable: true,
        distance: 100,
        color: "#fff",
        opacity: 1,
        width: 1,
      },
      move: {
        enable: true,
        speed: 2,
        direction: "none",
        random: false,
        straight: false,
        out_mode: "out",
        bounce: false,
        attract: {
          enable: false,
          rotateX: 3000,
          rotateY: 3000,
        },
      },
      array: [],
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: true,
          mode: "grab",
        },
        onclick: {
          enable: true,
          mode: "push",
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 100,
          line_linked: {
            opacity: 1,
          },
        },
        bubble: {
          distance: 200,
          size: 80,
          duration: 0.4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
        push: {
          particles_nb: 4,
        },
        remove: {
          particles_nb: 2,
        },
      },
      mouse: {},
    },
    retina_detect: false,
    fn: {
      interact: {},
      modes: {},
      vendors: {},
    },
    tmp: {},
  };

  const pJS = this.pJS;

  /* apply user params */
  if (params) {
    deepExtend(pJS, params);
  }

  pJS.tmp.obj = {
    size_value: pJS.particles.size.value,
    size_anim_speed: pJS.particles.size.anim.speed,
    move_speed: pJS.particles.move.speed,
    line_linked_distance: pJS.particles.line_linked.distance,
    line_linked_width: pJS.particles.line_linked.width,
    mode_grab_distance: pJS.interactivity.modes.grab.distance,
    mode_bubble_distance: pJS.interactivity.modes.bubble.distance,
    mode_bubble_size: pJS.interactivity.modes.bubble.size,
    mode_repulse_distance: pJS.interactivity.modes.repulse.distance,
  };

  /* keep references to bound listeners so we can remove them on destroy */
  pJS.tmp._listeners = {};

  /* ---------- retina ---------- */

  pJS.fn.retinaInit = function () {
    if (pJS.retina_detect && window.devicePixelRatio > 1) {
      pJS.canvas.pxratio = window.devicePixelRatio;
      pJS.tmp.retina = true;
    } else {
      pJS.canvas.pxratio = 1;
      pJS.tmp.retina = false;
    }

    pJS.canvas.w = pJS.canvas.el.offsetWidth * pJS.canvas.pxratio;
    pJS.canvas.h = pJS.canvas.el.offsetHeight * pJS.canvas.pxratio;

    pJS.particles.size.value = pJS.tmp.obj.size_value * pJS.canvas.pxratio;
    pJS.particles.size.anim.speed =
      pJS.tmp.obj.size_anim_speed * pJS.canvas.pxratio;
    pJS.particles.move.speed = pJS.tmp.obj.move_speed * pJS.canvas.pxratio;
    pJS.particles.line_linked.distance =
      pJS.tmp.obj.line_linked_distance * pJS.canvas.pxratio;
    pJS.interactivity.modes.grab.distance =
      pJS.tmp.obj.mode_grab_distance * pJS.canvas.pxratio;
    pJS.interactivity.modes.bubble.distance =
      pJS.tmp.obj.mode_bubble_distance * pJS.canvas.pxratio;
    pJS.particles.line_linked.width =
      pJS.tmp.obj.line_linked_width * pJS.canvas.pxratio;
    pJS.interactivity.modes.bubble.size =
      pJS.tmp.obj.mode_bubble_size * pJS.canvas.pxratio;
    pJS.interactivity.modes.repulse.distance =
      pJS.tmp.obj.mode_repulse_distance * pJS.canvas.pxratio;
  };

  /* ---------- canvas ---------- */

  pJS.fn.canvasInit = function () {
    pJS.canvas.ctx = pJS.canvas.el.getContext("2d");
  };

  pJS.fn.canvasSize = function () {
    pJS.canvas.el.width = pJS.canvas.w;
    pJS.canvas.el.height = pJS.canvas.h;

    if (pJS.interactivity.events.resize) {
      const onResize = function () {
        pJS.canvas.w = pJS.canvas.el.offsetWidth;
        pJS.canvas.h = pJS.canvas.el.offsetHeight;

        if (pJS.tmp.retina) {
          pJS.canvas.w *= pJS.canvas.pxratio;
          pJS.canvas.h *= pJS.canvas.pxratio;
        }

        pJS.canvas.el.width = pJS.canvas.w;
        pJS.canvas.el.height = pJS.canvas.h;

        if (!pJS.particles.move.enable) {
          pJS.fn.particlesEmpty();
          pJS.fn.particlesCreate();
          pJS.fn.particlesDraw();
          pJS.fn.vendors.densityAutoParticles();
        }

        pJS.fn.vendors.densityAutoParticles();
      };

      pJS.tmp._listeners.resize = onResize;
      window.addEventListener("resize", onResize);
    }
  };

  pJS.fn.canvasPaint = function () {
    pJS.canvas.ctx.fillRect(0, 0, pJS.canvas.w, pJS.canvas.h);
  };

  pJS.fn.canvasClear = function () {
    pJS.canvas.ctx.clearRect(0, 0, pJS.canvas.w, pJS.canvas.h);
  };

  /* ---------- particle ---------- */

  pJS.fn.particle = function (color, opacity, position) {
    /* size */
    this.radius =
      (pJS.particles.size.random ? Math.random() : 1) *
      pJS.particles.size.value;
    if (pJS.particles.size.anim.enable) {
      this.size_status = false;
      this.vs = pJS.particles.size.anim.speed / 100;
      if (!pJS.particles.size.anim.sync) this.vs *= Math.random();
    }

    /* position */
    this.x = position ? position.x : Math.random() * pJS.canvas.w;
    this.y = position ? position.y : Math.random() * pJS.canvas.h;

    if (this.x > pJS.canvas.w - this.radius * 2)
      this.x -= this.radius;
    else if (this.x < this.radius * 2)
      this.x += this.radius;
    if (this.y > pJS.canvas.h - this.radius * 2)
      this.y -= this.radius;
    else if (this.y < this.radius * 2)
      this.y += this.radius;

    if (pJS.particles.move.bounce) {
      pJS.fn.vendors.checkOverlap(this, position);
    }

    /* color */
    this.color = {};
    if (typeof color.value === "object") {
      if (Array.isArray(color.value)) {
        const selected =
          color.value[Math.floor(Math.random() * color.value.length)];
        this.color.rgb = hexToRgb(selected);
      } else {
        if (
          color.value.r !== undefined &&
          color.value.g !== undefined &&
          color.value.b !== undefined
        ) {
          this.color.rgb = {
            r: color.value.r,
            g: color.value.g,
            b: color.value.b,
          };
        }
        if (
          color.value.h !== undefined &&
          color.value.s !== undefined &&
          color.value.l !== undefined
        ) {
          this.color.hsl = {
            h: color.value.h,
            s: color.value.s,
            l: color.value.l,
          };
        }
      }
    } else if (color.value === "random") {
      this.color.rgb = {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
      };
    } else if (typeof color.value === "string") {
      this.color = color;
      this.color.rgb = hexToRgb(this.color.value);
    }

    /* opacity */
    this.opacity =
      (pJS.particles.opacity.random ? Math.random() : 1) *
      pJS.particles.opacity.value;
    if (pJS.particles.opacity.anim.enable) {
      this.opacity_status = false;
      this.vo = pJS.particles.opacity.anim.speed / 100;
      if (!pJS.particles.opacity.anim.sync) this.vo *= Math.random();
    }

    /* velocity */
    const velbase = {
      top:          { x: 0,    y: -1   },
      "top-right":  { x: 0.5,  y: -0.5 },
      right:        { x: 1,    y: 0    },
      "bottom-right":{ x: 0.5, y: 0.5  },
      bottom:       { x: 0,    y: 1    },
      "bottom-left":{ x: -0.5, y: 1    },
      left:         { x: -1,   y: 0    },
      "top-left":   { x: -0.5, y: -0.5 },
    }[pJS.particles.move.direction] || { x: 0, y: 0 };

    if (pJS.particles.move.straight) {
      this.vx = velbase.x;
      this.vy = velbase.y;
      if (pJS.particles.move.random) {
        this.vx *= Math.random();
        this.vy *= Math.random();
      }
    } else {
      this.vx = velbase.x + Math.random() - 0.5;
      this.vy = velbase.y + Math.random() - 0.5;
    }

    this.vx_i = this.vx;
    this.vy_i = this.vy;

    /* shape */
    const shape_type = pJS.particles.shape.type;
    if (Array.isArray(shape_type)) {
      this.shape = shape_type[Math.floor(Math.random() * shape_type.length)];
    } else {
      this.shape = shape_type;
    }

    if (this.shape === "image") {
      const sh = pJS.particles.shape;
      this.img = {
        src: sh.image.src,
        ratio: sh.image.width / sh.image.height || 1,
      };
      if (
        pJS.tmp.img_type === "svg" &&
        pJS.tmp.source_svg !== undefined
      ) {
        pJS.fn.vendors.createSvgImg(this);
        if (pJS.tmp.pushing) this.img.loaded = false;
      }
    }
  };

  pJS.fn.particle.prototype.draw = function () {
    const p = this;
    const radius =
      p.radius_bubble !== undefined ? p.radius_bubble : p.radius;
    const opacity =
      p.opacity_bubble !== undefined ? p.opacity_bubble : p.opacity;

    const color_value = p.color.rgb
      ? `rgba(${p.color.rgb.r},${p.color.rgb.g},${p.color.rgb.b},${opacity})`
      : `hsla(${p.color.hsl.h},${p.color.hsl.s}%,${p.color.hsl.l}%,${opacity})`;

    pJS.canvas.ctx.fillStyle = color_value;
    pJS.canvas.ctx.beginPath();

    switch (p.shape) {
      case "circle":
        pJS.canvas.ctx.arc(p.x, p.y, radius, 0, Math.PI * 2, false);
        break;

      case "edge":
        pJS.canvas.ctx.rect(
          p.x - radius,
          p.y - radius,
          radius * 2,
          radius * 2
        );
        break;

      case "triangle":
        pJS.fn.vendors.drawShape(
          pJS.canvas.ctx,
          p.x - radius,
          p.y + radius / 1.66,
          radius * 2,
          3,
          2
        );
        break;

      case "polygon":
        pJS.fn.vendors.drawShape(
          pJS.canvas.ctx,
          p.x - radius / (pJS.particles.shape.polygon.nb_sides / 3.5),
          p.y - radius / (2.66 / 3.5),
          (radius * 2.66) / (pJS.particles.shape.polygon.nb_sides / 3),
          pJS.particles.shape.polygon.nb_sides,
          1
        );
        break;

      case "star":
        pJS.fn.vendors.drawShape(
          pJS.canvas.ctx,
          p.x - (radius * 2) / (pJS.particles.shape.polygon.nb_sides / 4),
          p.y - radius / ((2 * 2.66) / 3.5),
          (radius * 2 * 2.66) / (pJS.particles.shape.polygon.nb_sides / 3),
          pJS.particles.shape.polygon.nb_sides,
          2
        );
        break;

      case "image": {
        const img_obj =
          pJS.tmp.img_type === "svg" ? p.img.obj : pJS.tmp.img_obj;
        if (img_obj) {
          pJS.canvas.ctx.drawImage(
            img_obj,
            p.x - radius,
            p.y - radius,
            radius * 2,
            (radius * 2) / p.img.ratio
          );
        }
        break;
      }
    }

    pJS.canvas.ctx.closePath();

    if (pJS.particles.shape.stroke.width > 0) {
      pJS.canvas.ctx.strokeStyle = pJS.particles.shape.stroke.color;
      pJS.canvas.ctx.lineWidth = pJS.particles.shape.stroke.width;
      pJS.canvas.ctx.stroke();
    }

    pJS.canvas.ctx.fill();
  };

  /* ---------- particle management ---------- */

  pJS.fn.particlesCreate = function () {
    for (let i = 0; i < pJS.particles.number.value; i++) {
      pJS.particles.array.push(
        new pJS.fn.particle(
          pJS.particles.color,
          pJS.particles.opacity.value
        )
      );
    }
  };

  pJS.fn.particlesUpdate = function () {
    for (let i = 0; i < pJS.particles.array.length; i++) {
      const p = pJS.particles.array[i];

      if (pJS.particles.move.enable) {
        const ms = pJS.particles.move.speed / 2;
        p.x += p.vx * ms;
        p.y += p.vy * ms;
      }

      if (pJS.particles.opacity.anim.enable) {
        if (p.opacity_status) {
          if (p.opacity >= pJS.particles.opacity.value)
            p.opacity_status = false;
          p.opacity += p.vo;
        } else {
          if (p.opacity <= pJS.particles.opacity.anim.opacity_min)
            p.opacity_status = true;
          p.opacity -= p.vo;
        }
        if (p.opacity < 0) p.opacity = 0;
      }

      if (pJS.particles.size.anim.enable) {
        if (p.size_status) {
          if (p.radius >= pJS.particles.size.value) p.size_status = false;
          p.radius += p.vs;
        } else {
          if (p.radius <= pJS.particles.size.anim.size_min)
            p.size_status = true;
          p.radius -= p.vs;
        }
        if (p.radius < 0) p.radius = 0;
      }

      /* out of canvas */
      const bounceMode = pJS.particles.move.out_mode === "bounce";
      const new_pos = bounceMode
        ? {
            x_left: p.radius,
            x_right: pJS.canvas.w,
            y_top: p.radius,
            y_bottom: pJS.canvas.h,
          }
        : {
            x_left: -p.radius,
            x_right: pJS.canvas.w + p.radius,
            y_top: -p.radius,
            y_bottom: pJS.canvas.h + p.radius,
          };

      if (p.x - p.radius > pJS.canvas.w) {
        p.x = new_pos.x_left;
        p.y = Math.random() * pJS.canvas.h;
      } else if (p.x + p.radius < 0) {
        p.x = new_pos.x_right;
        p.y = Math.random() * pJS.canvas.h;
      }
      if (p.y - p.radius > pJS.canvas.h) {
        p.y = new_pos.y_top;
        p.x = Math.random() * pJS.canvas.w;
      } else if (p.y + p.radius < 0) {
        p.y = new_pos.y_bottom;
        p.x = Math.random() * pJS.canvas.w;
      }

      if (bounceMode) {
        if (p.x + p.radius > pJS.canvas.w || p.x - p.radius < 0) p.vx = -p.vx;
        if (p.y + p.radius > pJS.canvas.h || p.y - p.radius < 0) p.vy = -p.vy;
      }

      /* interaction modes */
      if (isInArray("grab", pJS.interactivity.events.onhover.mode)) {
        pJS.fn.modes.grabParticle(p);
      }
      if (
        isInArray("bubble", pJS.interactivity.events.onhover.mode) ||
        isInArray("bubble", pJS.interactivity.events.onclick.mode)
      ) {
        pJS.fn.modes.bubbleParticle(p);
      }
      if (
        isInArray("repulse", pJS.interactivity.events.onhover.mode) ||
        isInArray("repulse", pJS.interactivity.events.onclick.mode)
      ) {
        pJS.fn.modes.repulseParticle(p);
      }

      /* particle ↔ particle interaction */
      if (
        pJS.particles.line_linked.enable ||
        pJS.particles.move.attract.enable
      ) {
        for (let j = i + 1; j < pJS.particles.array.length; j++) {
          const p2 = pJS.particles.array[j];
          if (pJS.particles.line_linked.enable)
            pJS.fn.interact.linkParticles(p, p2);
          if (pJS.particles.move.attract.enable)
            pJS.fn.interact.attractParticles(p, p2);
          if (pJS.particles.move.bounce)
            pJS.fn.interact.bounceParticles(p, p2);
        }
      }
    }
  };

  pJS.fn.particlesDraw = function () {
    pJS.canvas.ctx.clearRect(0, 0, pJS.canvas.w, pJS.canvas.h);
    pJS.fn.particlesUpdate();
    for (const p of pJS.particles.array) {
      p.draw();
    }
  };

  pJS.fn.particlesEmpty = function () {
    pJS.particles.array = [];
  };

  pJS.fn.particlesRefresh = function () {
    cancelAnimationFrame(pJS.fn.checkAnimFrame);
    cancelAnimationFrame(pJS.fn.drawAnimFrame);
    pJS.tmp.source_svg = undefined;
    pJS.tmp.img_obj = undefined;
    pJS.tmp.count_svg = 0;
    pJS.fn.particlesEmpty();
    pJS.fn.canvasClear();
    pJS.fn.vendors.start();
  };

  /* ---------- interaction ---------- */

  pJS.fn.interact.linkParticles = function (p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= pJS.particles.line_linked.distance) {
      const opacity_line =
        pJS.particles.line_linked.opacity -
        dist /
          (1 / pJS.particles.line_linked.opacity) /
          pJS.particles.line_linked.distance;

      if (opacity_line > 0) {
        const c = pJS.particles.line_linked.color_rgb_line;
        pJS.canvas.ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${opacity_line})`;
        pJS.canvas.ctx.lineWidth = pJS.particles.line_linked.width;
        pJS.canvas.ctx.beginPath();
        pJS.canvas.ctx.moveTo(p1.x, p1.y);
        pJS.canvas.ctx.lineTo(p2.x, p2.y);
        pJS.canvas.ctx.stroke();
        pJS.canvas.ctx.closePath();
      }
    }
  };

  pJS.fn.interact.attractParticles = function (p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= pJS.particles.line_linked.distance) {
      const ax = dx / (pJS.particles.move.attract.rotateX * 1000);
      const ay = dy / (pJS.particles.move.attract.rotateY * 1000);
      p1.vx -= ax;
      p1.vy -= ay;
      p2.vx += ax;
      p2.vy += ay;
    }
  };

  pJS.fn.interact.bounceParticles = function (p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= p1.radius + p2.radius) {
      p1.vx = -p1.vx;
      p1.vy = -p1.vy;
      p2.vx = -p2.vx;
      p2.vy = -p2.vy;
    }
  };

  /* ---------- modes ---------- */

  pJS.fn.modes.pushParticles = function (nb, pos) {
    pJS.tmp.pushing = true;
    for (let i = 0; i < nb; i++) {
      pJS.particles.array.push(
        new pJS.fn.particle(pJS.particles.color, pJS.particles.opacity.value, {
          x: pos ? pos.pos_x : Math.random() * pJS.canvas.w,
          y: pos ? pos.pos_y : Math.random() * pJS.canvas.h,
        })
      );
      if (i === nb - 1) {
        if (!pJS.particles.move.enable) pJS.fn.particlesDraw();
        pJS.tmp.pushing = false;
      }
    }
  };

  pJS.fn.modes.removeParticles = function (nb) {
    pJS.particles.array.splice(0, nb);
    if (!pJS.particles.move.enable) pJS.fn.particlesDraw();
  };

  pJS.fn.modes.bubbleParticle = function (p) {
    if (
      pJS.interactivity.events.onhover.enable &&
      isInArray("bubble", pJS.interactivity.events.onhover.mode)
    ) {
      const dx = p.x - pJS.interactivity.mouse.pos_x;
      const dy = p.y - pJS.interactivity.mouse.pos_y;
      const dist_mouse = Math.sqrt(dx * dx + dy * dy);
      const ratio = 1 - dist_mouse / pJS.interactivity.modes.bubble.distance;

      function init() {
        p.opacity_bubble = p.opacity;
        p.radius_bubble = p.radius;
      }

      if (dist_mouse <= pJS.interactivity.modes.bubble.distance) {
        if (ratio >= 0 && pJS.interactivity.status === "mousemove") {
          if (
            pJS.interactivity.modes.bubble.size !==
            pJS.particles.size.value
          ) {
            if (
              pJS.interactivity.modes.bubble.size >
              pJS.particles.size.value
            ) {
              const size = p.radius + pJS.interactivity.modes.bubble.size * ratio;
              if (size >= 0) p.radius_bubble = size;
            } else {
              const dif = p.radius - pJS.interactivity.modes.bubble.size;
              const size = p.radius - dif * ratio;
              p.radius_bubble = size > 0 ? size : 0;
            }
          }

          if (
            pJS.interactivity.modes.bubble.opacity !== undefined &&
            pJS.interactivity.modes.bubble.opacity !==
              pJS.particles.opacity.value
          ) {
            if (
              pJS.interactivity.modes.bubble.opacity >
              pJS.particles.opacity.value
            ) {
              const opacity =
                pJS.interactivity.modes.bubble.opacity * ratio;
              if (
                opacity > p.opacity &&
                opacity <= pJS.interactivity.modes.bubble.opacity
              ) {
                p.opacity_bubble = opacity;
              }
            } else {
              const opacity =
                p.opacity -
                (pJS.particles.opacity.value -
                  pJS.interactivity.modes.bubble.opacity) *
                  ratio;
              if (
                opacity < p.opacity &&
                opacity >= pJS.interactivity.modes.bubble.opacity
              ) {
                p.opacity_bubble = opacity;
              }
            }
          }
        }
      } else {
        init();
      }

      if (pJS.interactivity.status === "mouseleave") init();
    } else if (
      pJS.interactivity.events.onclick.enable &&
      isInArray("bubble", pJS.interactivity.events.onclick.mode)
    ) {
      if (pJS.tmp.bubble_clicking) {
        const dx = p.x - pJS.interactivity.mouse.click_pos_x;
        const dy = p.y - pJS.interactivity.mouse.click_pos_y;
        const dist_mouse = Math.sqrt(dx * dx + dy * dy);
        const time_spent =
          (Date.now() - pJS.interactivity.mouse.click_time) / 1000;

        if (time_spent > pJS.interactivity.modes.bubble.duration)
          pJS.tmp.bubble_duration_end = true;
        if (time_spent > pJS.interactivity.modes.bubble.duration * 2) {
          pJS.tmp.bubble_clicking = false;
          pJS.tmp.bubble_duration_end = false;
        }

        function process(bubble_param, particles_param, p_obj_bubble, p_obj, id) {
          if (bubble_param === particles_param) return;
          if (!pJS.tmp.bubble_duration_end) {
            if (dist_mouse <= pJS.interactivity.modes.bubble.distance) {
              const obj =
                p_obj_bubble !== undefined ? p_obj_bubble : p_obj;
              if (obj !== bubble_param) {
                const value =
                  p_obj -
                  (time_spent * (p_obj - bubble_param)) /
                    pJS.interactivity.modes.bubble.duration;
                if (id === "size") p.radius_bubble = value;
                if (id === "opacity") p.opacity_bubble = value;
              }
            } else {
              if (id === "size") p.radius_bubble = undefined;
              if (id === "opacity") p.opacity_bubble = undefined;
            }
          } else if (p_obj_bubble !== undefined) {
            const value_tmp =
              p_obj -
              (time_spent * (p_obj - bubble_param)) /
                pJS.interactivity.modes.bubble.duration;
            const dif = bubble_param - value_tmp;
            const value = bubble_param + dif;
            if (id === "size") p.radius_bubble = value;
            if (id === "opacity") p.opacity_bubble = value;
          }
        }

        if (pJS.tmp.bubble_clicking) {
          process(
            pJS.interactivity.modes.bubble.size,
            pJS.particles.size.value,
            p.radius_bubble,
            p.radius,
            "size"
          );
          process(
            pJS.interactivity.modes.bubble.opacity,
            pJS.particles.opacity.value,
            p.opacity_bubble,
            p.opacity,
            "opacity"
          );
        }
      }
    }
  };

  pJS.fn.modes.repulseParticle = function (p) {
    if (
      pJS.interactivity.events.onhover.enable &&
      isInArray("repulse", pJS.interactivity.events.onhover.mode) &&
      pJS.interactivity.status === "mousemove"
    ) {
      const dx = p.x - pJS.interactivity.mouse.pos_x;
      const dy = p.y - pJS.interactivity.mouse.pos_y;
      const dist_mouse = Math.sqrt(dx * dx + dy * dy);
      const normVec = { x: dx / dist_mouse, y: dy / dist_mouse };
      const repulseRadius = pJS.interactivity.modes.repulse.distance;
      const velocity = 100;
      const repulseFactor = clamp(
        (1 / repulseRadius) *
          (-1 * Math.pow(dist_mouse / repulseRadius, 2) + 1) *
          repulseRadius *
          velocity,
        0,
        50
      );

      const pos = {
        x: p.x + normVec.x * repulseFactor,
        y: p.y + normVec.y * repulseFactor,
      };

      if (pJS.particles.move.out_mode === "bounce") {
        if (pos.x - p.radius > 0 && pos.x + p.radius < pJS.canvas.w)
          p.x = pos.x;
        if (pos.y - p.radius > 0 && pos.y + p.radius < pJS.canvas.h)
          p.y = pos.y;
      } else {
        p.x = pos.x;
        p.y = pos.y;
      }
    } else if (
      pJS.interactivity.events.onclick.enable &&
      isInArray("repulse", pJS.interactivity.events.onclick.mode)
    ) {
      if (!pJS.tmp.repulse_finish) {
        pJS.tmp.repulse_count++;
        if (pJS.tmp.repulse_count === pJS.particles.array.length)
          pJS.tmp.repulse_finish = true;
      }

      if (pJS.tmp.repulse_clicking) {
        const repulseRadius = Math.pow(
          pJS.interactivity.modes.repulse.distance / 6,
          3
        );
        const dx =
          pJS.interactivity.mouse.click_pos_x - p.x;
        const dy =
          pJS.interactivity.mouse.click_pos_y - p.y;
        const d = dx * dx + dy * dy;
        const force = (-repulseRadius / d) * 1;

        if (d <= repulseRadius) {
          const f = Math.atan2(dy, dx);
          p.vx = force * Math.cos(f);
          p.vy = force * Math.sin(f);

          if (pJS.particles.move.out_mode === "bounce") {
            const pos = { x: p.x + p.vx, y: p.y + p.vy };
            if (pos.x + p.radius > pJS.canvas.w || pos.x - p.radius < 0)
              p.vx = -p.vx;
            if (pos.y + p.radius > pJS.canvas.h || pos.y - p.radius < 0)
              p.vy = -p.vy;
          }
        }
      } else {
        p.vx = p.vx_i;
        p.vy = p.vy_i;
      }
    }
  };

  pJS.fn.modes.grabParticle = function (p) {
    if (
      pJS.interactivity.events.onhover.enable &&
      pJS.interactivity.status === "mousemove"
    ) {
      const dx = p.x - pJS.interactivity.mouse.pos_x;
      const dy = p.y - pJS.interactivity.mouse.pos_y;
      const dist_mouse = Math.sqrt(dx * dx + dy * dy);

      if (dist_mouse <= pJS.interactivity.modes.grab.distance) {
        const opacity_line =
          pJS.interactivity.modes.grab.line_linked.opacity -
          dist_mouse /
            (1 / pJS.interactivity.modes.grab.line_linked.opacity) /
            pJS.interactivity.modes.grab.distance;

        if (opacity_line > 0) {
          const c = pJS.particles.line_linked.color_rgb_line;
          pJS.canvas.ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},${opacity_line})`;
          pJS.canvas.ctx.lineWidth = pJS.particles.line_linked.width;
          pJS.canvas.ctx.beginPath();
          pJS.canvas.ctx.moveTo(p.x, p.y);
          pJS.canvas.ctx.lineTo(
            pJS.interactivity.mouse.pos_x,
            pJS.interactivity.mouse.pos_y
          );
          pJS.canvas.ctx.stroke();
          pJS.canvas.ctx.closePath();
        }
      }
    }
  };

  /* ---------- vendors ---------- */

  pJS.fn.vendors.eventsListeners = function () {
    pJS.interactivity.el =
      pJS.interactivity.detect_on === "window"
        ? window
        : pJS.canvas.el;

    if (
      pJS.interactivity.events.onhover.enable ||
      pJS.interactivity.events.onclick.enable
    ) {
      const onMouseMove = function (e) {
        let pos_x, pos_y;
        if (pJS.interactivity.el === window) {
          pos_x = e.clientX;
          pos_y = e.clientY;
        } else {
          pos_x = e.offsetX ?? e.clientX;
          pos_y = e.offsetY ?? e.clientY;
        }
        pJS.interactivity.mouse.pos_x = pos_x;
        pJS.interactivity.mouse.pos_y = pos_y;
        if (pJS.tmp.retina) {
          pJS.interactivity.mouse.pos_x *= pJS.canvas.pxratio;
          pJS.interactivity.mouse.pos_y *= pJS.canvas.pxratio;
        }
        pJS.interactivity.status = "mousemove";
      };

      const onMouseLeave = function () {
        pJS.interactivity.mouse.pos_x = null;
        pJS.interactivity.mouse.pos_y = null;
        pJS.interactivity.status = "mouseleave";
      };

      pJS.tmp._listeners.mousemove = onMouseMove;
      pJS.tmp._listeners.mouseleave = onMouseLeave;

      /* passive: true for mousemove avoids the browser warning */
      pJS.interactivity.el.addEventListener("mousemove", onMouseMove, {
        passive: true,
      });
      pJS.interactivity.el.addEventListener("mouseleave", onMouseLeave, {
        passive: true,
      });
    }

    if (pJS.interactivity.events.onclick.enable) {
      const onClick = function () {
        pJS.interactivity.mouse.click_pos_x = pJS.interactivity.mouse.pos_x;
        pJS.interactivity.mouse.click_pos_y = pJS.interactivity.mouse.pos_y;
        pJS.interactivity.mouse.click_time = Date.now();

        switch (pJS.interactivity.events.onclick.mode) {
          case "push":
            if (pJS.particles.move.enable) {
              pJS.fn.modes.pushParticles(
                pJS.interactivity.modes.push.particles_nb,
                pJS.interactivity.mouse
              );
            } else {
              if (pJS.interactivity.modes.push.particles_nb === 1) {
                pJS.fn.modes.pushParticles(1, pJS.interactivity.mouse);
              } else if (pJS.interactivity.modes.push.particles_nb > 1) {
                pJS.fn.modes.pushParticles(
                  pJS.interactivity.modes.push.particles_nb
                );
              }
            }
            break;

          case "remove":
            pJS.fn.modes.removeParticles(
              pJS.interactivity.modes.remove.particles_nb
            );
            break;

          case "bubble":
            pJS.tmp.bubble_clicking = true;
            break;

          case "repulse":
            pJS.tmp.repulse_clicking = true;
            pJS.tmp.repulse_count = 0;
            pJS.tmp.repulse_finish = false;
            setTimeout(function () {
              pJS.tmp.repulse_clicking = false;
            }, pJS.interactivity.modes.repulse.duration * 1000);
            break;
        }
      };

      pJS.tmp._listeners.click = onClick;
      pJS.interactivity.el.addEventListener("click", onClick);
    }
  };

  pJS.fn.vendors.densityAutoParticles = function () {
    if (pJS.particles.number.density.enable) {
      let area = (pJS.canvas.el.width * pJS.canvas.el.height) / 1000;
      if (pJS.tmp.retina) area /= pJS.canvas.pxratio * 2;

      const nb_particles =
        (area * pJS.particles.number.value) /
        pJS.particles.number.density.value_area;
      const missing = pJS.particles.array.length - nb_particles;

      if (missing < 0) pJS.fn.modes.pushParticles(Math.abs(missing));
      else pJS.fn.modes.removeParticles(missing);
    }
  };

  pJS.fn.vendors.checkOverlap = function (p1, position) {
    for (const p2 of pJS.particles.array) {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= p1.radius + p2.radius) {
        p1.x = position ? position.x : Math.random() * pJS.canvas.w;
        p1.y = position ? position.y : Math.random() * pJS.canvas.h;
        pJS.fn.vendors.checkOverlap(p1);
      }
    }
  };

  pJS.fn.vendors.createSvgImg = function (p) {
    const svgXml = pJS.tmp.source_svg;
    const coloredSvgXml = svgXml.replace(/#([0-9A-F]{3,6})/gi, () => {
      return p.color.rgb
        ? `rgba(${p.color.rgb.r},${p.color.rgb.g},${p.color.rgb.b},${p.opacity})`
        : `hsla(${p.color.hsl.h},${p.color.hsl.s}%,${p.color.hsl.l}%,${p.opacity})`;
    });

    const svg = new Blob([coloredSvgXml], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svg);
    const img = new Image();
    img.addEventListener("load", function () {
      p.img.obj = img;
      p.img.loaded = true;
      URL.revokeObjectURL(url);
      pJS.tmp.count_svg++;
    });
    img.src = url;
  };

  pJS.fn.vendors.destroypJS = function () {
    /* cancel animation */
    cancelAnimationFrame(pJS.fn.drawAnimFrame);
    cancelAnimationFrame(pJS.fn.checkAnimFrame);

    /* remove event listeners to prevent memory leaks */
    if (pJS.interactivity.el) {
      const l = pJS.tmp._listeners;
      if (l.mousemove)
        pJS.interactivity.el.removeEventListener("mousemove", l.mousemove);
      if (l.mouseleave)
        pJS.interactivity.el.removeEventListener("mouseleave", l.mouseleave);
      if (l.click)
        pJS.interactivity.el.removeEventListener("click", l.click);
    }
    if (pJS.tmp._listeners.resize) {
      window.removeEventListener("resize", pJS.tmp._listeners.resize);
    }

    /* remove canvas */
    canvas_el.remove();

    /* remove this instance from the global list */
    const idx = window.pJSDom.indexOf(this);
    if (idx !== -1) window.pJSDom.splice(idx, 1);
  }.bind(this);

  pJS.fn.vendors.drawShape = function (
    c,
    startX,
    startY,
    sideLength,
    sideCountNumerator,
    sideCountDenominator
  ) {
    const sideCount = sideCountNumerator * sideCountDenominator;
    const decimalSides = sideCountNumerator / sideCountDenominator;
    const interiorAngleDeg = (180 * (decimalSides - 2)) / decimalSides;
    const interiorAngle = Math.PI - (Math.PI * interiorAngleDeg) / 180;
    c.save();
    c.beginPath();
    c.translate(startX, startY);
    c.moveTo(0, 0);
    for (let i = 0; i < sideCount; i++) {
      c.lineTo(sideLength, 0);
      c.translate(sideLength, 0);
      c.rotate(interiorAngle);
    }
    c.fill();
    c.restore();
  };

  pJS.fn.vendors.exportImg = function () {
    window.open(pJS.canvas.el.toDataURL("image/png"), "_blank");
  };

  pJS.fn.vendors.loadImg = function (type) {
    pJS.tmp.img_error = undefined;

    if (!pJS.particles.shape.image.src) {
      console.warn("pJS - No image.src");
      pJS.tmp.img_error = true;
      return;
    }

    if (type === "svg") {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", pJS.particles.shape.image.src);
      xhr.onreadystatechange = function (data) {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            pJS.tmp.source_svg = data.currentTarget.response;
            pJS.fn.vendors.checkBeforeDraw();
          } else {
            console.warn("pJS - Image not found");
            pJS.tmp.img_error = true;
          }
        }
      };
      xhr.send();
    } else {
      const img = new Image();
      img.addEventListener("load", function () {
        pJS.tmp.img_obj = img;
        pJS.fn.vendors.checkBeforeDraw();
      });
      img.src = pJS.particles.shape.image.src;
    }
  };

  pJS.fn.vendors.draw = function () {
    if (pJS.particles.shape.type === "image") {
      if (pJS.tmp.img_type === "svg") {
        if (pJS.tmp.count_svg >= pJS.particles.number.value) {
          pJS.fn.particlesDraw();
          if (!pJS.particles.move.enable)
            cancelAnimationFrame(pJS.fn.drawAnimFrame);
          else
            pJS.fn.drawAnimFrame = requestAnimationFrame(
              pJS.fn.vendors.draw
            );
        } else {
          if (!pJS.tmp.img_error)
            pJS.fn.drawAnimFrame = requestAnimationFrame(
              pJS.fn.vendors.draw
            );
        }
      } else {
        if (pJS.tmp.img_obj !== undefined) {
          pJS.fn.particlesDraw();
          if (!pJS.particles.move.enable)
            cancelAnimationFrame(pJS.fn.drawAnimFrame);
          else
            pJS.fn.drawAnimFrame = requestAnimationFrame(
              pJS.fn.vendors.draw
            );
        } else {
          if (!pJS.tmp.img_error)
            pJS.fn.drawAnimFrame = requestAnimationFrame(
              pJS.fn.vendors.draw
            );
        }
      }
    } else {
      pJS.fn.particlesDraw();
      if (!pJS.particles.move.enable)
        cancelAnimationFrame(pJS.fn.drawAnimFrame);
      else
        pJS.fn.drawAnimFrame = requestAnimationFrame(pJS.fn.vendors.draw);
    }
  };

  pJS.fn.vendors.checkBeforeDraw = function () {
    if (pJS.particles.shape.type === "image") {
      if (
        pJS.tmp.img_type === "svg" &&
        pJS.tmp.source_svg === undefined
      ) {
        pJS.tmp.checkAnimFrame = requestAnimationFrame(
          pJS.fn.vendors.checkBeforeDraw
        );
      } else {
        cancelAnimationFrame(pJS.tmp.checkAnimFrame);
        if (!pJS.tmp.img_error) {
          pJS.fn.vendors.init();
          pJS.fn.vendors.draw();
        }
      }
    } else {
      pJS.fn.vendors.init();
      pJS.fn.vendors.draw();
    }
  };

  pJS.fn.vendors.init = function () {
    pJS.fn.retinaInit();
    pJS.fn.canvasInit();
    pJS.fn.canvasSize();
    pJS.fn.canvasPaint();
    pJS.fn.particlesCreate();
    pJS.fn.vendors.densityAutoParticles();
    pJS.particles.line_linked.color_rgb_line = hexToRgb(
      pJS.particles.line_linked.color
    );
  };

  pJS.fn.vendors.start = function () {
    if (isInArray("image", pJS.particles.shape.type)) {
      pJS.tmp.img_type = pJS.particles.shape.image.src.substr(
        pJS.particles.shape.image.src.length - 3
      );
      pJS.fn.vendors.loadImg(pJS.tmp.img_type);
    } else {
      pJS.fn.vendors.checkBeforeDraw();
    }
  };

  /* ---------- start ---------- */
  pJS.fn.vendors.eventsListeners();
  pJS.fn.vendors.start();
};

/* ---------- public API ---------- */

window.pJSDom = window.pJSDom || [];

window.particlesJS = function (tag_id, params) {
  if (typeof tag_id !== "string") {
    params = tag_id;
    tag_id = "particles-js";
  }
  if (!tag_id) tag_id = "particles-js";

  const pJS_tag = document.getElementById(tag_id);
  if (!pJS_tag) {
    console.warn("pJS: element #" + tag_id + " not found");
    return;
  }

  const pJS_canvas_class = "particles-js-canvas-el";
  const existing = pJS_tag.getElementsByClassName(pJS_canvas_class);
  while (existing.length > 0) {
    pJS_tag.removeChild(existing[0]);
  }

  const canvas_el = document.createElement("canvas");
  canvas_el.className = pJS_canvas_class;
  canvas_el.style.width = "100%";
  canvas_el.style.height = "100%";

  const canvas = pJS_tag.appendChild(canvas_el);
  if (canvas) {
    window.pJSDom.push(new pJS(tag_id, params));
  }
};

window.particlesJS.load = function (tag_id, path_config_json, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open("GET", path_config_json);
  xhr.onreadystatechange = function (data) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const params = JSON.parse(data.currentTarget.response);
        window.particlesJS(tag_id, params);
        if (callback) callback();
      } else {
        console.warn(
          "pJS - XMLHttpRequest status: " +
            xhr.status +
            " — config file not found"
        );
      }
    }
  };
  xhr.send();
};
