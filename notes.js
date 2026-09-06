// Song notes: the colored notes beside the headings, and the pixel cracks that
// spread out of them.
//
// Hover and click are deliberately the same animation at two scales. Hovering a
// note fractures the page around it in that song's color — enough to preview
// what clicking does without committing to it. Clicking runs the same fracture
// to the edge of the screen, and the song's new ground is revealed through it.
//
// A fracture is drawn on two layers. The crack itself is painted over the page
// in the song's accent; under it, on a layer behind the content, a band of that
// song's own background is laid along the same path. So a crack does not just
// mark the page, it opens onto the new ground — while the type stays on top of
// both, legible the whole way through.
//
// The click is a reveal rather than a wash. The palette is committed the
// instant you click, so the type and the rules start easing into the new hue
// straight away; the body's old ground is pinned in place underneath, and the
// new one grows from the note on a canvas behind the content. Text and cards
// ride over the colour as it sweeps past them, which is what makes it read as
// the site changing rather than a sheet of paint crossing the screen.
//
// No audio yet. Clicking recolors and nothing else.

const CELL = 7;             // pixel grid the cracks and the ground snap to
const HOVER_REACH = 260;    // how far cracks creep while hovering
const CRACK_MS = 520;       // click: cracks race to the far corner
const GROUND_DELAY = 120;   // click: the ground follows the cracks out
const GROUND_MS = 640;
const FADE_MS = 520;

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const notes = Array.from(document.querySelectorAll('.note'));

if (notes.length) init();

// Deterministic PRNG so a note's fracture is the same shape every time you
// hover it — the crack pattern belongs to that note rather than to the moment.
function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A fracture is a handful of trunks walking outward from the note itself, each
// jittering as it goes and occasionally throwing off a branch. Every point
// carries its distance from the note, so growth is just "draw everything
// closer than `reach`" — the same test for a hover and for a full sweep.
// Points also carry a weight, so a crack is heavy where it leaves the note and
// thins out as it travels.
function makeCracks(seed, maxLen) {
  const rand = rng(seed);
  const cracks = [];
  const TRUNKS = 7;

  function walk(x, y, angle, startD, len, depth) {
    const pts = [];
    let d = startD;
    const end = startD + len;
    while (d < end) {
      angle += (rand() - 0.5) * 0.55;
      const step = CELL * (1 + Math.floor(rand() * 2));
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      d += step;
      // Thin right at the note so the glyph you are pointing at still reads,
      // thick just outside it, thinning again as the crack travels.
      pts.push({ x, y, d, heavy: depth === 0 && d > 18 && d < 75 });
      if (depth < 2 && rand() < 0.045 && end - d > 40) {
        const turn = (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6);
        walk(x, y, angle + turn, d, (end - d) * 0.65, depth + 1);
      }
    }
    cracks.push({ pts, alpha: depth === 0 ? 1 : 0.6 });
  }

  for (let i = 0; i < TRUNKS; i++) {
    const angle = (i / TRUNKS) * Math.PI * 2 + rand() * 0.7;
    walk(0, 0, angle, 0, maxLen * (0.6 + rand() * 0.4), 0);
  }
  return cracks;
}

// Per-row wobble for the ground's edge. Precomputed and indexed by row so the
// edge holds still between frames instead of boiling.
function makeJitter(seed, rows) {
  const rand = rng(seed);
  const out = new Float32Array(rows);
  for (let i = 0; i < rows; i++) out[i] = (rand() - 0.5) * CELL * 3.5;
  return out;
}

const snap = v => Math.round(v / CELL) * CELL;

function init() {
  function layer(id) {
    const c = document.createElement('canvas');
    c.id = id;
    c.setAttribute('aria-hidden', 'true');
    document.body.appendChild(c);
    return { el: c, ctx: c.getContext('2d') };
  }
  const ground = layer('bloom-ground');   // behind the content
  const cracks = layer('bloom-cracks');   // over everything

  // An offscreen probe wearing a [data-theme] so a song's palette can be read
  // straight out of the stylesheet rather than restated here in JS.
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;left:-9999px';
  document.body.appendChild(probe);

  let vw = 0;
  let vh = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    for (const l of [ground, cracks]) {
      l.el.width = Math.round(vw * dpr);
      l.el.height = Math.round(vh * dpr);
      // The bitmap is in device pixels; the box has to stay in CSS pixels, or
      // the canvas sizes itself from the bitmap and everything drawn lands
      // scaled and offset by the pixel ratio.
      l.el.style.width = vw + 'px';
      l.el.style.height = vh + 'px';
      l.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
  resize();
  window.addEventListener('resize', resize);

  const jitter = makeJitter(0x5eed, 1200);
  let active = null;  // the note currently blooming
  let frame = 0;

  const token = note => note.dataset.song || 'fg';

  function readVar(el, name) {
    return getComputedStyle(el).getPropertyValue(name).trim();
  }

  // Custom properties inherit, so an unthemed probe would just report whatever
  // song is currently on. Read the monochrome palette once, before any song.
  const BASE = { crack: readVar(root, '--fg'), ground: readVar(root, '--bg') };

  // A song's crack color is its note swatch; its ground is that palette's --bg.
  function paletteOf(note) {
    const t = token(note);
    if (t === 'fg') return BASE;
    probe.setAttribute('data-theme', t);
    return { crack: readVar(root, '--' + t), ground: readVar(probe, '--bg') };
  }

  function originOf(note) {
    const r = note.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // Distance from the note to the furthest corner: how far the new ground has
  // to travel before the screen is covered.
  function coverRadius(o) {
    return Math.hypot(Math.max(o.x, vw - o.x), Math.max(o.y, vh - o.y));
  }

  function begin(note) {
    if (active && active.note === note && active.phase !== 'fade') return;
    const seed = notes.indexOf(note) * 9176 + 17;
    const pal = paletteOf(note);
    active = {
      note,
      phase: 'hover',
      crack: pal.crack,
      ground: pal.ground,
      shapes: makeCracks(seed, Math.hypot(vw, vh)),
      reach: active && active.note === note ? active.reach : 0,
      spread: 0,
      alpha: 1,
      t0: 0
    };
    run();
  }

  function release(note) {
    if (active && active.note === note && active.phase === 'hover') {
      active.phase = 'retract';
      run();
    }
  }

  function commit(note) {
    const t = token(note);
    if (t === 'fg') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', t);
    notes.forEach(n => n.setAttribute('aria-pressed', String(n === note)));
  }

  function fire(note) {
    if (reduceMotion.matches) {
      commit(note);
      return;
    }
    if (!active || active.note !== note) begin(note);
    // Pin the ground the page has now, so committing the palette recolors the
    // type and the rules while the old floor stays put for the sweep to erase.
    document.body.style.backgroundColor = readVar(root, '--bg');
    commit(active.note);
    active.phase = 'burst';
    active.t0 = performance.now();
    run();
  }

  function settle() {
    document.body.style.removeProperty('background-color');
    ground.ctx.clearRect(0, 0, vw, vh);
  }

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  function draw() {
    frame = 0;
    if (!active) return;
    const a = active;
    const o = originOf(a.note);

    if (a.phase === 'hover') {
      a.reach += (HOVER_REACH - a.reach) * 0.16;
    } else if (a.phase === 'retract') {
      a.reach += (0 - a.reach) * 0.22;
      if (a.reach < 1) { active = null; cracks.ctx.clearRect(0, 0, vw, vh); return; }
    } else if (a.phase === 'burst') {
      const R = coverRadius(o);
      const t = performance.now() - a.t0;
      a.reach = Math.max(a.reach, easeOut(Math.min(1, t / CRACK_MS)) * R);
      a.spread = easeOut(Math.max(0, Math.min(1, (t - GROUND_DELAY) / GROUND_MS))) * R;
      if (a.spread >= R) {
        // The new ground now covers the viewport, so handing it back to the
        // body and clearing the layer is invisible. Only the cracks are left
        // to fade.
        settle();
        a.spread = 0;
        a.phase = 'fade';
        a.t0 = performance.now();
      }
    } else if (a.phase === 'fade') {
      a.alpha = 1 - Math.min(1, (performance.now() - a.t0) / FADE_MS);
      if (a.alpha <= 0) { active = null; cracks.ctx.clearRect(0, 0, vw, vh); return; }
    }

    // --- the new ground: a band along the fracture, then the flood ---
    const g = ground.ctx;
    g.clearRect(0, 0, vw, vh);
    g.fillStyle = a.ground;

    // A crack is not just a colored line over the page — it opens onto the
    // song's own background. Three cells wide along the crack path, painted on
    // the layer behind the content so the type stays on top of it. Skipped
    // once the flood has been handed back to the body, where the page is
    // already this color and the band would be painting nothing.
    if (a.phase !== 'fade') {
      for (const shape of a.shapes) {
        for (const p of shape.pts) {
          if (p.d > a.reach) break;
          g.fillRect(snap(o.x + p.x) - CELL, snap(o.y + p.y) - CELL, CELL * 3, CELL * 3);
        }
      }
    }

    if (a.spread > 0) {
      const r = a.spread;
      const top = Math.floor((o.y - r) / CELL) * CELL;
      for (let gy = top; gy <= o.y + r; gy += CELL) {
        const dy = gy + CELL / 2 - o.y;
        const inside = r * r - dy * dy;
        if (inside <= 0) continue;
        const wob = jitter[Math.abs(gy / CELL | 0) % jitter.length];
        const hw = Math.max(0, snap(Math.sqrt(inside) + wob));
        g.fillRect(snap(o.x - hw), gy, hw * 2, CELL);
      }
    }

    // --- the cracks, over everything ---
    const c = cracks.ctx;
    c.clearRect(0, 0, vw, vh);
    c.fillStyle = a.crack;
    for (const shape of a.shapes) {
      for (const p of shape.pts) {
        if (p.d > a.reach) break;
        const tip = Math.min(1, (a.reach - p.d) / 30);
        c.globalAlpha = a.alpha * shape.alpha * (0.35 + 0.65 * tip);
        const size = p.heavy ? CELL * 2 : CELL;
        c.fillRect(
          Math.round((o.x + p.x) / CELL) * CELL,
          Math.round((o.y + p.y) / CELL) * CELL,
          size, size
        );
      }
    }
    c.globalAlpha = 1;
    run();
  }

  function run() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  notes.forEach(note => {
    // Hover previews; focus does the same so the keyboard path is not a
    // second-class one.
    ['pointerenter', 'focus'].forEach(ev =>
      note.addEventListener(ev, () => { if (!reduceMotion.matches) begin(note); })
    );
    ['pointerleave', 'blur'].forEach(ev =>
      note.addEventListener(ev, () => release(note))
    );
    note.addEventListener('click', () => fire(note));
  });
}
