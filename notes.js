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

const CELL = 5;             // pixel grid the cracks and the ground snap to
const HOVER_REACH = 260;    // how far cracks creep while hovering
const CRACK_MS = 520;       // click: cracks race to the far corner
const GROUND_DELAY = 120;   // click: the ground follows the cracks out
const GROUND_MS = 640;
const FADE_MS = 520;
const EDGE_SEEDS = 16;      // fractures spaced around the rim of the screen
const EDGE_REACH = 0.19;    // hover: how far in they creep, of the short side
const EDGE_MS = 680;        // click: how long they take to close over the screen
// Blocks whose colour is staged to the closing front. Anything inside one of
// these inherits its colour, so it turns with its block rather than needing a
// delay of its own.
const STAGED = 'h1,h2,h3,p,li,.sec-label,.eyebrow,.tagline,.note-hint,.when,' +
               '.card,.beyond-card,.staff,.tag,footer,nav a';

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

// Fractures for a nav note: instead of one origin, a set of them spaced around
// the rim of the screen, each walking inward. Distance is measured along the
// path from the edge, so growth stays the same "draw everything closer than
// reach" test the heading fractures use.
function makeEdgeCracks(w, h, seed) {
  const rand = rng(seed);
  const shapes = [];
  const per = 2 * (w + h);
  const far = Math.hypot(w, h);

  function walk(x, y, angle, startD, len, depth) {
    const pts = [];
    let d = startD;
    const end = startD + len;
    while (d < end) {
      angle += (rand() - 0.5) * 0.5;
      const step = CELL * (1 + Math.floor(rand() * 2));
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      d += step;
      pts.push({ x, y, d });
      if (depth < 2 && rand() < 0.05 && end - d > 40) {
        const turn = (rand() < 0.5 ? -1 : 1) * (0.4 + rand() * 0.6);
        walk(x, y, angle + turn, d, (end - d) * 0.6, depth + 1);
      }
    }
    shapes.push(pts);
  }

  for (let i = 0; i < EDGE_SEEDS; i++) {
    // Spaced around the perimeter with a little scatter, so they spread over
    // all four sides instead of clustering on one.
    const t = ((i + rand() * 0.7) / EDGE_SEEDS) * per;
    let x, y, inward;
    if (t < w)              { x = t;                 y = 0;                 inward = Math.PI / 2; }
    else if (t < w + h)     { x = w;                 y = t - w;             inward = Math.PI; }
    else if (t < 2 * w + h) { x = w - (t - w - h);   y = h;                 inward = -Math.PI / 2; }
    else                    { x = 0;                 y = h - (t - 2*w - h); inward = 0; }
    walk(x, y, inward + (rand() - 0.5) * 0.9, 0, far * (0.5 + rand() * 0.5), 0);
  }
  return shapes;
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

  // Declared above resize(), which clears it — resize runs once during init,
  // and a const is in its temporal dead zone until its declaration does.
  const shapeCache = new Map();
  let edgeShapes = null;   // rim fractures, sized to the viewport

  let vw = 0;
  let vh = 0;
  function resize() {
    shapeCache.clear();   // shapes are generated to the viewport diagonal
    edgeShapes = null;
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
  // The notes in the nav bar preview differently: no fracture, just the song's
  // ground laid in a band around the edges of the screen, which closes over
  // the middle when the note is pressed.
  const isFrame = note => note.classList.contains('note-nav');

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
    // Plus a margin. The flood's edge is jittered by a few cells, so stopping
    // at the exact corner distance can leave slivers of the old ground showing
    // at the moment the layer is handed back to the body.
    return Math.hypot(Math.max(o.x, vw - o.x), Math.max(o.y, vh - o.y)) + CELL * 5;
  }

  // A note's fracture is deterministic, so it only has to be generated once.
  // It was being rebuilt on every hover: ~2800 points, of which the ~290 inside
  // the hover reach were all that ever got drawn.
  function shapesFor(note) {
    let s = shapeCache.get(note);
    if (!s) {
      s = makeCracks(notes.indexOf(note) * 9176 + 17, Math.hypot(vw, vh));
      shapeCache.set(note, s);
    }
    return s;
  }

  function begin(note) {
    if (active && active.note === note) {
      // Already open, or running a click: leave it alone.
      if (active.phase === 'hover' || active.phase === 'burst') return;
      // Caught while closing. Reopen from wherever it had shrunk back to
      // rather than swallowing the hover — bailing here left the phase on
      // 'retract', so the fracture kept closing and the hover drew nothing.
      // Every second hover did that, since the one after it started clean.
      if (active.phase === 'retract') { active.phase = 'hover'; run(); return; }
      // 'fade' falls through and starts fresh.
    }
    const pal = paletteOf(note);
    active = {
      note,
      phase: 'hover',
      crack: pal.crack,
      ground: pal.ground,
      mode: isFrame(note) ? 'frame' : 'crack',
      // Rim fractures take the note's own swatch, the same colour a heading
      // fracture is drawn in, so the two previews read as one idea. The pale
      // ground the song is bringing follows behind them as the solid front —
      // drawing the fractures in that ground instead left them barely above
      // the paper, and invisible outright for the reset note, whose ground is
      // the paper.
      edgeInk: pal.crack,
      shapes: isFrame(note) ? null : shapesFor(note),
      reach: active && active.note === note ? active.reach : 0,
      inset: 0,
      thick: CELL,
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

  let shiftTimer = 0;
  let stagedEls = [];

  // When does the closing front reach this point? The bands come in from all
  // four sides, so a point is covered as soon as the nearest one arrives —
  // hence the smaller of the two axis fractions. inset runs 0.5 * t^1.6 over
  // EDGE_MS, so inverting it gives the moment, and that becomes the element's
  // transition-delay.
  function frontReaches(cx, cy) {
    const fx = Math.min(cx, vw - cx) / vw;
    const fy = Math.min(cy, vh - cy) / vh;
    const need = Math.max(0, Math.min(fx, fy));
    return Math.min(1, Math.pow(need / 0.5, 1 / 1.6)) * EDGE_MS;
  }

  function stageToFront() {
    clearStaging();
    for (const el of document.querySelectorAll(STAGED)) {
      const r = el.getBoundingClientRect();
      // Off-screen blocks would be staged against a front they never see, and
      // would then sit on a stale delay when they scroll in.
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      // Half the fade is spent before arrival and half after, so the block
      // is mid-flip exactly as the front crosses it.
      const ms = frontReaches(r.left + r.width / 2, r.top + r.height / 2) - 130;
      el.style.transitionDelay = Math.max(0, Math.round(ms)) + 'ms';
      stagedEls.push(el);
    }
  }

  function clearStaging() {
    for (const el of stagedEls) el.style.removeProperty('transition-delay');
    stagedEls = [];
  }

  function commit(note) {
    const t = token(note);
    // The .65s color ease exists for this moment and no other, so it is turned
    // on for the length of the swap and then taken off again.
    root.classList.add('theme-shift');
    clearTimeout(shiftTimer);
    shiftTimer = setTimeout(() => {
      root.classList.remove('theme-shift', 'theme-staged');
      clearStaging();
    }, EDGE_MS + 900);
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
    // A heading's fracture bursts from under your cursor, so its type can turn
    // with it. The nav front closes from the rim and arrives at different parts
    // of the page at different times, so the type is staged to it: each block
    // is told to wait until the front actually reaches it. The palette is still
    // committed at once — only the transitions are held back.
    if (isFrame(active.note)) { stageToFront(); root.classList.add('theme-staged'); }
    commit(active.note);
    active.phase = 'burst';
    active.from = active.inset;
    active.t0 = performance.now();
    run();
  }

  function settle() {
    document.body.style.removeProperty('background-color');
    ground.ctx.clearRect(0, 0, vw, vh);
    groundBox = null;
  }

  function wipe() {
    cracks.ctx.clearRect(0, 0, vw, vh);
    ground.ctx.clearRect(0, 0, vw, vh);
    crackBox = groundBox = null;
  }

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  // Clearing the whole viewport twice a frame is most of a frame's work when
  // the fracture only ever covers a few hundred pixels around one note. Each
  // layer remembers the box it painted and clears just that.
  let crackBox = null;
  let groundBox = null;

  function boxAround(o, r) {
    const pad = r + CELL * 3;
    return { x: o.x - pad, y: o.y - pad, w: pad * 2, h: pad * 2 };
  }
  function clearBox(ctx, box) {
    if (!box) return;
    ctx.clearRect(box.x, box.y, box.w, box.h);
  }

  // A nav note's preview. Fractures come in from points all around the rim of
  // the screen, drawn in the song's ground on the layer behind the content, so
  // it reads as the page's own background breaking inward. Hovering creeps
  // them a fifth of the way in; pressing runs them to the far corner while
  // they thicken, and a solid front follows them in and closes over whatever
  // they leave behind — the fractures lead, the colour arrives after.
  function shapesForEdge() {
    if (!edgeShapes) edgeShapes = makeEdgeCracks(vw, vh, 0x3d9e);
    return edgeShapes;
  }

  function drawEdge(a) {
    // Moving from a heading note straight onto a nav one leaves that note's
    // fracture painted on the layer above; nothing else clears it, because an
    // edge fracture never touches that canvas.
    if (crackBox) { clearBox(cracks.ctx, crackBox); crackBox = null; }

    const far = Math.hypot(vw, vh);
    const rest = Math.min(vw, vh) * EDGE_REACH;

    if (a.phase === 'hover') {
      a.reach += (rest - a.reach) * 0.16;
      // Two cells wide rather than one: these are drawn in the song's own
      // ground, which sits barely above the paper, so a hairline vanishes.
      a.thick = CELL * 2;
      a.inset = 0;
    } else if (a.phase === 'retract') {
      a.reach += (0 - a.reach) * 0.22;
      a.thick = CELL * 2;
      if (a.reach < 1) { active = null; wipe(); return; }
    } else if (a.phase === 'burst') {
      const t = Math.min(1, (performance.now() - a.t0) / EDGE_MS);
      // The front closes from the rim, and the fractures ride just ahead of it
      // rather than racing the whole screen. Letting them run to the far corner
      // meant that by mid-collapse they had converged over the middle and the
      // front was still out at the edges — which read as a slab in the centre
      // rather than as cracks leading the colour in.
      a.inset = 0.5 * Math.pow(t, 1.6);
      const front = a.inset * Math.min(vw, vh);
      a.reach = Math.max(a.from, front + rest);
      a.thick = CELL * (2 + 2 * t);
      if (t >= 1) {
        // The solid front has met itself in the middle; the ground can go back
        // to the body without the handover being visible.
        settle();
        active = null;
        return;
      }
    }

    const g = ground.ctx;
    g.clearRect(0, 0, vw, vh);

    // The fractures go down first so the advancing front paints over them as
    // it closes. Where the two colours differ — the reset note's black cracks
    // against the white it is bringing — that is what lets the ink lead and
    // the paper swallow it, rather than black cells surviving on top.
    g.fillStyle = a.edgeInk;
    const wdt = snap(a.thick) || CELL;
    for (const pts of shapesForEdge()) {
      for (const p of pts) {
        if (p.d > a.reach) break;
        g.fillRect(snap(p.x) - wdt / 2, snap(p.y) - wdt / 2, wdt, wdt);
      }
    }

    if (a.inset > 0) {
      g.fillStyle = a.ground;
      const ix = Math.min(snap(a.inset * vw), Math.ceil(vw / 2));
      const iy = Math.min(snap(a.inset * vh), Math.ceil(vh / 2));
      g.fillRect(0, 0, vw, iy);
      g.fillRect(0, vh - iy, vw, iy);
      g.fillRect(0, iy, ix, vh - iy * 2);
      g.fillRect(vw - ix, iy, ix, vh - iy * 2);
    }
    groundBox = { x: 0, y: 0, w: vw, h: vh };
    run();
  }

  function draw() {
    frame = 0;
    if (!active) return;
    const a = active;
    const o = originOf(a.note);

    if (a.mode === 'frame') { drawEdge(a); return; }

    if (a.phase === 'hover') {
      a.reach += (HOVER_REACH - a.reach) * 0.16;
    } else if (a.phase === 'retract') {
      a.reach += (0 - a.reach) * 0.22;
      if (a.reach < 1) { active = null; wipe(); return; }
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
      if (a.alpha <= 0) { active = null; wipe(); return; }
    }

    // --- the flood, behind the content (click only) ---
    if (a.spread > 0 || groundBox) {
      const g = ground.ctx;
      clearBox(g, groundBox);
      groundBox = null;
      if (a.spread > 0) {
        g.fillStyle = a.ground;
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
        groundBox = boxAround(o, r);
      }
    }

    // --- the cracks, over everything ---
    const c = cracks.ctx;
    clearBox(c, crackBox);
    c.fillStyle = a.crack;
    crackBox = boxAround(o, a.reach);
    for (const shape of a.shapes) {
      // Shapes are ordered along their own path, so one past the reach means
      // the rest of that branch is too — and a branch that starts beyond the
      // reach is skipped whole. Most of a note's ~80 branches are, on a hover.
      if (shape.pts.length && shape.pts[0].d > a.reach) continue;
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
