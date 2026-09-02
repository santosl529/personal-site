import { PROJECTS } from './projects.js';

const grid = document.getElementById('proj-grid');
const list = document.getElementById('proj-list');
const listToggle = document.getElementById('proj-list-toggle');
const dialog = document.getElementById('project-modal');
const modalFlip = document.getElementById('modal-flip');
const modalClose = document.getElementById('modal-close');
const modalCoverImg = document.getElementById('modal-cover-img');
const modalCoverVideo = document.getElementById('modal-cover-video');
const modalCtx = document.getElementById('modal-ctx');
const modalTitle = document.getElementById('modal-title');
const modalLinks = document.getElementById('modal-links');
const modalTags = document.getElementById('modal-tags');
const modalBody = document.getElementById('modal-body');
const modalContent = document.getElementById('modal-content');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const byslug = Object.fromEntries(PROJECTS.map(p => [p.slug, p]));

let currentSlug = null;
let currentTrigger = null;

function extIcon() {
  return '<svg class="ext-icon" viewBox="0 0 10 10" aria-hidden="true"><path d="M2 8L8 2M8 2H3.5M8 2V6.5" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

function renderCard(p) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'card reveal in';
  btn.style.setProperty('--accent', p.accent);
  btn.dataset.slug = p.slug;
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = `
    <img class="card-cover" src="${p.cover}" alt="" loading="lazy">
    <div class="card-ctx">${p.context}</div>
    <div class="card-title">${p.title}</div>
    <p>${p.blurb}</p>
    <div class="tags">${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
  `;
  btn.addEventListener('click', () => openProject(p.slug, btn));
  return btn;
}

function renderRow(p) {
  const li = document.createElement('li');
  li.className = 'proj-row';
  const linkHtml = p.links.live
    ? `<a class="row-link" href="${p.links.live}" target="_blank" rel="noopener">live${extIcon()}</a>`
    : (p.links.repo ? `<a class="row-link" href="${p.links.repo}" target="_blank" rel="noopener">repo${extIcon()}</a>` : '');
  li.innerHTML = `
    <button type="button" class="row-title" data-slug="${p.slug}">${p.title}</button>
    <span class="row-clause">${p.blurb}</span>
    <span class="row-year">${p.year}</span>
    ${linkHtml}
  `;
  li.querySelector('.row-title').addEventListener('click', e => openProject(p.slug, e.currentTarget));
  return li;
}

function ensureRowVisible(p) {
  if (!p.featured && list.hidden) {
    list.hidden = false;
    listToggle.setAttribute('aria-expanded', 'true');
    listToggle.textContent = 'Show less';
  }
}

function renderGrid() {
  const featured = PROJECTS.filter(p => p.featured);
  const rest = PROJECTS.filter(p => !p.featured);
  featured.forEach(p => grid.appendChild(renderCard(p)));
  if (rest.length) {
    rest.forEach(p => list.appendChild(renderRow(p)));
    listToggle.hidden = false;
    listToggle.addEventListener('click', () => {
      const expanded = listToggle.getAttribute('aria-expanded') === 'true';
      listToggle.setAttribute('aria-expanded', String(!expanded));
      list.hidden = expanded;
      listToggle.textContent = expanded ? 'Show everything else' : 'Show less';
    });
  }
}

function populateModal(p) {
  modalCtx.textContent = p.context;
  modalCtx.style.setProperty('--accent', p.accent);
  modalTitle.textContent = p.title;
  modalTags.innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
  modalBody.innerHTML = p.body;

  const links = [];
  if (p.links.live) links.push(`<a href="${p.links.live}" target="_blank" rel="noopener">Live${extIcon()}</a>`);
  if (p.links.repo) links.push(`<a href="${p.links.repo}" target="_blank" rel="noopener">Repo${extIcon()}</a>`);
  modalLinks.innerHTML = links.join('');

  const video = p.media.find(m => m.type === 'video');
  if (video) {
    modalCoverImg.hidden = true;
    modalCoverVideo.hidden = false;
    modalCoverVideo.poster = video.poster;
    modalCoverVideo.dataset.src = video.src;
  } else {
    modalCoverVideo.hidden = true;
    modalCoverImg.hidden = false;
    modalCoverImg.src = p.cover;
  }
}

function playModalVideo() {
  if (modalCoverVideo.hidden) return;
  if (modalCoverVideo.dataset.src && !modalCoverVideo.getAttribute('src')) {
    modalCoverVideo.src = modalCoverVideo.dataset.src;
  }
  if (!reduceMotion.matches) {
    modalCoverVideo.play().catch(() => {});
  }
}

function stopModalVideo() {
  if (modalCoverVideo.hidden) return;
  modalCoverVideo.pause();
  modalCoverVideo.removeAttribute('src');
  modalCoverVideo.load();
}

// Keep in sync with the .modal-flip transition duration in index.html.
const FLIP_MS = 220;
let isClosing = false;

// Geometry for the card <-> modal FLIP. `ok` is false when the card has no
// box to fly from (never rendered, or opened from a deep link).
function flipFrom(cardEl) {
  const first = cardEl.getBoundingClientRect();
  const last = modalFlip.getBoundingClientRect();
  return {
    ok: first.width > 0 && last.width > 0,
    transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) ` +
               `scale(${first.width / last.width}, ${first.height / last.height})`,
  };
}

function runFlip(cardEl) {
  const from = flipFrom(cardEl);
  if (!from.ok) {
    modalFlip.classList.add('is-open');
    setTimeout(() => modalContent.classList.add('in'), 60);
    return;
  }

  modalFlip.style.transition = 'none';
  modalFlip.style.transformOrigin = 'top left';
  modalFlip.style.transform = from.transform;
  modalFlip.classList.add('is-open');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modalFlip.style.transition = '';
      modalFlip.style.transform = 'none';
    });
  });

  setTimeout(() => modalContent.classList.add('in'), 230);
}

// The open animation played backwards: content fades, the panel shrinks back
// into the card it came from, and only then does the dialog actually close.
function runReverseFlip(cardEl, done) {
  const from = flipFrom(cardEl);
  if (!from.ok) return done();

  modalContent.classList.remove('in');
  dialog.classList.add('is-closing');

  // Pin the current identity transform, flush it, then animate to the card.
  modalFlip.style.transition = 'none';
  modalFlip.style.transformOrigin = 'top left';
  modalFlip.style.transform = 'none';
  void modalFlip.offsetWidth;

  modalFlip.style.transition = '';
  modalFlip.style.transform = from.transform;
  modalFlip.classList.remove('is-open');

  setTimeout(done, FLIP_MS);
}

function openProject(slug, triggerEl, opts = {}) {
  const { pushHistory = true } = opts;
  const p = byslug[slug];
  if (!p) return;

  ensureRowVisible(p);
  document.body.classList.add('scroll-locked');

  currentSlug = slug;
  currentTrigger = triggerEl || document.querySelector(`[data-slug="${slug}"]`);

  populateModal(p);
  modalContent.classList.remove('in');

  const isCard = currentTrigger && currentTrigger.classList.contains('card');

  if (isCard && !reduceMotion.matches) {
    currentTrigger.classList.add('is-source');
    dialog.showModal();
    runFlip(currentTrigger);
  } else {
    dialog.showModal();
    modalFlip.classList.add('is-open');
    if (reduceMotion.matches) {
      modalContent.classList.add('in');
    } else {
      setTimeout(() => modalContent.classList.add('in'), 60);
    }
  }

  playModalVideo();

  if (pushHistory) {
    history.pushState({ modal: slug }, '', `#/${slug}`);
  }
}

function closeProject() {
  if (isClosing) return;

  const cardEl = currentTrigger && currentTrigger.classList.contains('card')
    ? currentTrigger
    : null;

  if (!cardEl || reduceMotion.matches) {
    dialog.close();
    return;
  }

  isClosing = true;
  runReverseFlip(cardEl, () => {
    isClosing = false;
    dialog.close();
  });
}

dialog.addEventListener('close', () => {
  isClosing = false;
  dialog.classList.remove('is-closing');
  document.body.classList.remove('scroll-locked');
  stopModalVideo();
  modalFlip.classList.remove('is-open');
  modalContent.classList.remove('in');
  document.querySelectorAll('.card.is-source').forEach(el => el.classList.remove('is-source'));
  modalFlip.style.transform = '';
  modalFlip.style.transition = '';
  if (currentTrigger) currentTrigger.focus();
  currentTrigger = null;

  if (location.hash === `#/${currentSlug}`) {
    history.replaceState(null, '', location.pathname + location.search);
  }
  currentSlug = null;
});

dialog.addEventListener('cancel', e => {
  e.preventDefault();
  closeProject();
});
dialog.addEventListener('click', e => {
  if (e.target === dialog) closeProject();
});
modalClose.addEventListener('click', closeProject);

window.addEventListener('popstate', () => {
  const match = location.hash.match(/^#\/(.+)$/);
  if (match && byslug[match[1]]) {
    if (!dialog.open || currentSlug !== match[1]) {
      openProject(match[1], null, { pushHistory: false });
    }
  } else if (dialog.open) {
    closeProject();
  }
});

renderGrid();

const initialMatch = location.hash.match(/^#\/(.+)$/);
if (initialMatch && byslug[initialMatch[1]]) {
  openProject(initialMatch[1], null, { pushHistory: false });
}
