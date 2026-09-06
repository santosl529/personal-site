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
const EDGE_SEEDS = 16;      // fractures spaced around the rim of the screen
const EDGE_REACH = 0.19;    // hover: how far in they creep, of the short side
const BURST_MS = 680;       // click: how long the new ground takes to arrive
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
  const shapes = [];
  const TRUNKS = 7;

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

  for (let i = 0; i < TRUNKS; i++) {
    const angle = (i / TRUNKS) * Math.PI * 2 + rand() * 0.7;
    walk(0, 0, angle, 0, maxLen * (0.6 + rand() * 0.4), 0);
  }
  return shapes;
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
    for (const l of [ground]) {
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
    // The radius comes back with it: the fracture leaves from the note but must
    // not be drawn inside the ring, or it fills the disc the note sits in and
    // the note stops reading as a control.
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 };
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

  // When does the arriving ground reach this point? A nav note closes bands in
  // from all four sides, so a point is covered as soon as the nearest one gets
  // there. A heading note grows a disc out of itself, so it is the distance
  // from the note. Both run their front on t^1.6 over BURST_MS, so inverting
  // that gives the moment, which becomes the element's transition-delay.
  function frontReaches(a, o, cx, cy) {
    let need;
    if (a.mode === 'frame') {
      need = Math.min(Math.min(cx, vw - cx) / vw, Math.min(cy, vh - cy) / vh) / 0.5;
    } else {
      need = Math.hypot(cx - o.x, cy - o.y) / coverRadius(o);
    }
    return Math.min(1, Math.pow(Math.max(0, need), 1 / 1.6)) * BURST_MS;
  }

  // Every element, not a chosen few: anything with a colour of its own that was
  // left out turned at the click while the block around it waited, which is
  // exactly the mismatch the staging exists to remove.
  function stageToFront(a, o) {
    clearStaging();
    for (const el of document.body.querySelectorAll('*')) {
      if (el.tagName === 'CANVAS' || el.tagName === 'SCRIPT') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      // Off-screen elements would be staged against a front they never see, and
      // would then sit on a stale delay once they scrolled in.
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      // Half the fade is spent before arrival and half after, so an element is
      // mid-flip exactly as the front crosses it.
      const ms = frontReaches(a, o, r.left + r.width / 2, r.top + r.height / 2) - 130;
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
    }, BURST_MS + 900);
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
    // Both kinds stage their recolour to the ground arriving, each from its own
    // front — the rim closing in, or the disc growing out of the note. The
    // palette is still committed at once; only the transitions are held back.
    stageToFront(active, originOf(active.note));
    root.classList.add('theme-staged');
    commit(active.note);
    active.phase = 'burst';
    active.from = active.mode === 'frame' ? active.inset : active.reach;
    active.t0 = performance.now();
    run();
  }

  function settle() {
    document.body.style.removeProperty('background-color');
    ground.ctx.clearRect(0, 0, vw, vh);
    groundBox = null;
  }

  function wipe() {
    ground.ctx.clearRect(0, 0, vw, vh);
    groundBox = null;
  }

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  // Clearing the whole viewport twice a frame is most of a frame's work when
  // the fracture only ever covers a few hundred pixels around one note. Each
  // layer remembers the box it painted and clears just that.
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

  // Both fractures are drawn the same way: solid cells of one width, centred on
  // the path, in the note's swatch. The heading fracture used to taper its
  // alpha and switch cell size partway along, which read as a different kind of
  // mark from the rim ones.
  function paintFracture(g, shapes, ox, oy, reach, wdt, hole) {
    // `hole` keeps cells off the note itself. Measured from the fracture's own
    // origin, so it only applies where the shapes are relative to one — the rim
    // fractures pass it nothing.
    const clear = hole ? hole + wdt / 2 : 0;
    for (const pts of shapes) {
      // Points run in order along their own path, so one past the reach means
      // the rest of that branch is too, and a branch starting beyond it is
      // skipped whole.
      if (pts.length && pts[0].d > reach) continue;
      for (const p of pts) {
        if (p.d > reach) break;
        if (clear && Math.hypot(p.x, p.y) < clear) continue;
        g.fillRect(snap(ox + p.x) - wdt / 2, snap(oy + p.y) - wdt / 2, wdt, wdt);
      }
    }
  }

  function drawEdge(a) {
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
      const t = Math.min(1, (performance.now() - a.t0) / BURST_MS);
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
    paintFracture(g, shapesForEdge(), 0, 0, a.reach, snap(a.thick) || CELL);

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

    const R = coverRadius(o);

    if (a.phase === 'hover') {
      a.reach += (HOVER_REACH - a.reach) * 0.16;
      a.spread = 0;
      a.thick = CELL * 2;
    } else if (a.phase === 'retract') {
      a.reach += (0 - a.reach) * 0.22;
      if (a.reach < 1) { active = null; wipe(); return; }
    } else if (a.phase === 'burst') {
      // The same shape of move as a nav note, run outward instead of inward:
      // the new ground grows out of the note on t^1.6, and the fracture rides
      // just ahead of it rather than racing off to the corner on its own clock.
      const t = Math.min(1, (performance.now() - a.t0) / BURST_MS);
      a.spread = R * Math.pow(t, 1.6);
      a.reach = Math.max(a.from, a.spread + HOVER_REACH);
      a.thick = CELL * (2 + 2 * t);
      if (t >= 1) {
        // The ground covers the viewport, so handing it back to the body is
        // invisible and there is nothing left to fade out.
        settle();
        active = null;
        return;
      }
    }

    // Both layers of the move are drawn behind the content now, the way a nav
    // note's are: the fracture goes down first and the ground follows over it,
    // so the crack leads the colour in and is swallowed by it. It used to be
    // painted above everything on its own canvas, where it cut across the type.
    const g = ground.ctx;
    clearBox(g, groundBox);
    groundBox = boxAround(o, Math.max(a.reach, a.spread));

    g.fillStyle = a.crack;
    paintFracture(g, a.shapes, o.x, o.y, a.reach, snap(a.thick) || CELL, o.r + 4);

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
    }
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
