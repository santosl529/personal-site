// Song notes: the colored notes beside the headings, and the pixel fracture
// that opens out of them.
//
// The fracture is not painted on the page — it is a hole in it. A second copy
// of the page is built wearing the song's palette, stacked exactly over the
// real one, and clipped to the crack cells. What you see through a crack is
// therefore the themed page itself: its ground, its type, its rules, in the
// colors that song will actually bring, rather than a shape drawn in one
// arbitrary tint.
//
// Hover and click are the same animation at two scales. Hovering opens the
// fracture to a couple of hundred pixels around the note; clicking runs it to
// the far corner and then floods the gaps between the cracks until the themed
// copy covers the screen. At that point the real page is recolored underneath
// and the copy is pulled — the swap happens behind full cover, so it is not
// visible.
//
// No audio yet. Clicking recolors and nothing else.

const CELL = 7;             // pixel grid the fracture snaps to
const HOVER_REACH = 260;    // how far cracks creep while hovering
const CRACK_MS = 520;       // click: cracks race to the far corner
const FLOOD_DELAY = 120;    // click: the gaps fill in behind them
const FLOOD_MS = 640;

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
// carries its distance from the note, so growth is just "take everything
// closer than `reach`" — the same test for a hover and for a full sweep.
function makeCracks(seed, maxLen) {
  const rand = rng(seed);
  const shapes = [];
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
      // Narrow right at the note so the glyph you are pointing at still reads,
      // wide just outside it, narrowing again as the crack travels.
      pts.push({ x, y, d, wide: depth === 0 && d > 18 && d < 75 });
      if (depth < 2 && rand() < 0.045 && end - d > 40) {
        const turn = (rand() < 0.5 ? -1 : 1) * (0.5 + rand() * 0.6);
        walk(x, y, angle + turn, d, (end - d) * 0.65, depth + 1);
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

// Per-row wobble for the flood's edge. Precomputed and indexed by row so the
// edge holds still between frames instead of boiling.
function makeJitter(seed, rows) {
  const rand = rng(seed);
  const out = new Float32Array(rows);
  for (let i = 0; i < rows; i++) out[i] = (rand() - 0.5) * CELL * 3.5;
  return out;
}

const snap = v => Math.round(v / CELL) * CELL;

function init() {
  // --- the themed copy -----------------------------------------------------
  const peek = document.createElement('div');
  peek.id = 'theme-peek';
  peek.setAttribute('aria-hidden', 'true');
  peek.hidden = true;
  const scroll = document.createElement('div');
  scroll.className = 'peek-scroll';
  peek.appendChild(scroll);
  document.body.appendChild(peek);

  let peekNav = null;

  // Rebuilt on every hover rather than cached: the page underneath changes as
  // sections reveal, cards render and the tagline types itself, and a stale
  // copy would show through the cracks as a ghost of an older page.
  function buildPeek(themeToken) {
    scroll.textContent = '';
    if (peekNav) { peekNav.remove(); peekNav = null; }

    const clone = document.querySelector('.wrap').cloneNode(true);
    // Ids would be duplicated across the document, the dialog and its video
    // would be a second copy of media we already have loaded, and scripts must
    // not run twice.
    clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    clone.querySelectorAll('dialog,video,script,canvas').forEach(el => el.remove());

    // The real nav is fixed to the viewport. Inside the peek it has to be
    // positioned against the peek box instead, or the scroll transform on
    // .peek-scroll would drag it off the top of the screen.
    const nav = clone.querySelector('nav');
    if (nav) {
      nav.remove();
      peek.appendChild(nav);
      peekNav = nav;
    }

    // .wrap sits inside body's padding; the peek has to reproduce that offset
    // or every line in the copy lands high by the height of the nav.
    scroll.style.paddingTop = getComputedStyle(document.body).paddingTop;
    scroll.appendChild(clone);

    if (themeToken === 'fg') peek.removeAttribute('data-theme');
    else peek.setAttribute('data-theme', themeToken);
  }

  const jitter = makeJitter(0x5eed, 1200);
  let active = null;  // the note currently fracturing
  let frame = 0;
  let vw = 0;
  let vh = 0;

  // Declared before the first resize() call: it reads `active`, and a let is
  // in its temporal dead zone until the declaration runs.
  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    if (active) begin(active.note, true);
  }
  resize();
  window.addEventListener('resize', resize);

  const token = note => note.dataset.song || 'fg';

  function originOf(note) {
    const r = note.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  // Distance from the note to the furthest corner: how far the flood has to
  // travel before the screen is covered.
  function coverRadius(o) {
    return Math.hypot(Math.max(o.x, vw - o.x), Math.max(o.y, vh - o.y));
  }

  function begin(note, rebuild) {
    if (!rebuild && active && active.note === note) return;
    const carryReach = active && active.note === note ? active.reach : 0;
    buildPeek(token(note));
    peek.hidden = false;
    active = {
      note,
      phase: 'hover',
      shapes: makeCracks(notes.indexOf(note) * 9176 + 17, Math.hypot(vw, vh)),
      reach: carryReach,
      flood: 0,
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

  function stop() {
    active = null;
    peek.hidden = true;
    peek.style.removeProperty('clip-path');
  }

  function commit(note) {
    const t = token(note);
    // The peek covers the viewport at this point, so recoloring the real page
    // is invisible — but only if the shared color transition is suppressed for
    // the swap, or it would still be easing when the peek is pulled.
    root.classList.add('theme-snap');
    if (t === 'fg') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', t);
    notes.forEach(n => n.setAttribute('aria-pressed', String(n === note)));
    void root.offsetWidth;
    requestAnimationFrame(() => root.classList.remove('theme-snap'));
  }

  function fire(note) {
    if (reduceMotion.matches) {
      commit(note);
      stop();
      return;
    }
    if (!active || active.note !== note) begin(note);
    active.phase = 'burst';
    active.t0 = performance.now();
    run();
  }

  const easeOut = t => 1 - Math.pow(1 - t, 3);

  // The clip is one path of disjoint pixel rects: the crack cells, plus the
  // rows of the flood once a click is under way.
  function clipPath(o, a) {
    let d = '';
    for (const pts of a.shapes) {
      for (const p of pts) {
        if (p.d > a.reach) break;
        const s = p.wide ? CELL * 2 : CELL;
        d += `M${snap(o.x + p.x)} ${snap(o.y + p.y)}h${s}v${s}h${-s}Z`;
      }
    }
    if (a.flood > 0) {
      const r = a.flood;
      for (let y = Math.floor((o.y - r) / CELL) * CELL; y <= o.y + r; y += CELL) {
        const dy = y + CELL / 2 - o.y;
        const inside = r * r - dy * dy;
        if (inside <= 0) continue;
        const wob = jitter[Math.abs(y / CELL | 0) % jitter.length];
        const hw = Math.max(0, snap(Math.sqrt(inside) + wob));
        if (!hw) continue;
        d += `M${snap(o.x - hw)} ${y}h${hw * 2}v${CELL}h${-hw * 2}Z`;
      }
    }
    return d;
  }

  function draw() {
    frame = 0;
    if (!active) return;
    const a = active;
    const o = originOf(a.note);

    if (a.phase === 'hover') {
      a.reach += (HOVER_REACH - a.reach) * 0.16;
    } else if (a.phase === 'retract') {
      a.reach += (0 - a.reach) * 0.22;
      if (a.reach < 1) { stop(); return; }
    } else if (a.phase === 'burst') {
      const R = coverRadius(o);
      const t = performance.now() - a.t0;
      a.reach = Math.max(a.reach, easeOut(Math.min(1, t / CRACK_MS)) * R);
      a.flood = easeOut(Math.max(0, Math.min(1, (t - FLOOD_DELAY) / FLOOD_MS))) * R;
      if (a.flood >= R) {
        commit(a.note);
        stop();
        return;
      }
    }

    // The copy has to track the page it is standing in for, so a scroll while
    // a fracture is open does not slide the two out of register.
    scroll.style.transform = `translateY(${-window.scrollY}px)`;
    if (peekNav) peekNav.style.top = '0px';

    const d = clipPath(o, a);
    // An empty path clips everything away, which is the right answer for a
    // fracture that has not opened yet.
    peek.style.clipPath = `path('${d || 'M0 0Z'}')`;
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
