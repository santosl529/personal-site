// Song notes: the colored notes beside the headings, and the pixel cracks that
// spread out of them.
//
// Hover and click are deliberately the same animation at two scales. Hovering a
// note fractures the page a little way around it in that song's color — enough
// to preview what clicking does without committing to it. Clicking runs the
// same fracture to the edge of the screen and lets the color flood through the
// cracks; once the flood covers the viewport the theme is committed and the
// canvas fades, leaving the site tinted.
//
// No audio yet. Clicking recolors and nothing else.

const CELL = 6;             // pixel grid the cracks and the flood snap to
const HOVER_REACH = 200;    // how far cracks creep while hovering
const CLEARANCE = 16;       // keep the fracture off the note glyph itself
const CRACK_MS = 480;       // click: cracks race to the far corner
const FLOOD_DELAY = 140;    // click: flood starts after the cracks have a lead
const FLOOD_MS = 560;
const FADE_MS = 460;

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

// A fracture is a handful of trunks walking outward from the note, each
// jittering as it goes and occasionally throwing off a branch. Every point
// carries its distance from the note, so growth is just "draw everything
// closer than `reach`" — the same test for a 200px hover and a full flood.
function makeCracks(seed, maxLen) {
  const rand = rng(seed);
  const cracks = [];
  const TRUNKS = 6;

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
      pts.push({ x, y, d });
      if (depth < 2 && rand() < 0.04 && end - d > 40) {
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

// Per-row wobble for the flood's edge. Precomputed and indexed by row so the
// edge holds still between frames instead of boiling.
function makeJitter(seed, rows) {
  const rand = rng(seed);
  const out = new Float32Array(rows);
  for (let i = 0; i < rows; i++) out[i] = (rand() - 0.5) * CELL * 3.5;
  return out;
}

function init() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bloom';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let dpr = 1;
  let vw = 0;
  let vh = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  const jitter = makeJitter(0x5eed, 1200);
  let active = null;  // the note currently blooming
  let frame = 0;

  function colorOf(note) {
    const token = '--' + (note.dataset.song || 'fg');
    return getComputedStyle(root).getPropertyValue(token).trim() || '#16161A';
  }

  function originOf(note) {
    const r = note.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // Distance from the note to the furthest corner: how far a flood has to
  // travel before the screen is fully covered.
  function coverRadius(o) {
    return Math.hypot(Math.max(o.x, vw - o.x), Math.max(o.y, vh - o.y));
  }

  function begin(note) {
    if (active && active.note === note && active.phase !== 'fade') return;
    const seed = notes.indexOf(note) * 9176 + 17;
    active = {
      note,
      phase: 'hover',
      color: colorOf(note),
      cracks: makeCracks(seed, Math.hypot(vw, vh)),
      reach: active && active.note === note ? active.reach : 0,
      flood: 0,
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
    const token = note.dataset.song;
    if (token === 'fg') root.style.removeProperty('--theme');
    else root.style.setProperty('--theme', `var(--${token})`);
    notes.forEach(n => n.setAttribute('aria-pressed', String(n === note)));
  }

  function fire(note) {
    if (reduceMotion.matches) {
      commit(note);
      return;
    }
    if (!active || active.note !== note) begin(note);
    active.phase = 'burst';
    active.t0 = performance.now();
    active.committed = false;
    run();
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
      if (a.reach < 1) { active = null; ctx.clearRect(0, 0, vw, vh); return; }
    } else if (a.phase === 'burst') {
      const R = coverRadius(o);
      const t = performance.now() - a.t0;
      a.reach = Math.max(a.reach, easeOut(Math.min(1, t / CRACK_MS)) * R);
      a.flood = easeOut(Math.max(0, Math.min(1, (t - FLOOD_DELAY) / FLOOD_MS))) * R;
      if (a.flood >= R) {
        // The page is fully covered, so swapping the token now is invisible;
        // the fade that follows is what reveals the recolored site.
        commit(a.note);
        a.phase = 'fade';
        a.t0 = performance.now();
      }
    } else if (a.phase === 'fade') {
      a.alpha = 1 - Math.min(1, (performance.now() - a.t0) / FADE_MS);
      if (a.alpha <= 0) { active = null; ctx.clearRect(0, 0, vw, vh); return; }
    }

    ctx.clearRect(0, 0, vw, vh);
    ctx.fillStyle = a.color;

    // Flood first, cracks on top, so the veins stay visible against the fill.
    if (a.flood > 0) {
      const r = a.flood;
      const top = Math.floor((o.y - r) / CELL) * CELL;
      for (let gy = top; gy <= o.y + r; gy += CELL) {
        const dy = gy + CELL / 2 - o.y;
        const inside = r * r - dy * dy;
        if (inside <= 0) continue;
        const wob = jitter[Math.abs(gy / CELL | 0) % jitter.length];
        const hw = Math.max(0, Math.round((Math.sqrt(inside) + wob) / CELL) * CELL);
        ctx.globalAlpha = a.alpha;
        ctx.fillRect(Math.round((o.x - hw) / CELL) * CELL, gy, hw * 2, CELL);
      }
    }

    for (const c of a.cracks) {
      for (const p of c.pts) {
        if (p.d > a.reach) break;
        // The canvas paints over the note, so hold the cracks back far
        // enough that the glyph you are pointing at stays readable.
        if (p.d < CLEARANCE) continue;
        const tip = Math.min(1, (a.reach - p.d) / 30);
        ctx.globalAlpha = a.alpha * c.alpha * (0.3 + 0.7 * tip);
        ctx.fillRect(
          Math.round((o.x + p.x) / CELL) * CELL,
          Math.round((o.y + p.y) / CELL) * CELL,
          CELL, CELL
        );
      }
    }
    ctx.globalAlpha = 1;
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
