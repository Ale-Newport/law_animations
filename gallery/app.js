/**
 * Local inspection gallery.
 *
 * - Reads gallery/catalog-index.json (all 2,000 IDs, no source) for search and
 *   filtering; the list is virtualised and shows static thumbnails only.
 * - Imports src/registry.js (lazy loaders) and imports ONLY the selected
 *   module. The previous instance is destroyed before another is mounted.
 * - Owns playback: a requestAnimationFrame loop that always calls
 *   instance.seek(ms). Animation modules never own a clock.
 * - Still export (SVG/PNG) of the current frame for inspection only. There is
 *   deliberately no video or GIF export.
 *
 * All browser storage access is wrapped in try/catch; the page works without it.
 */

const RATIOS = {'16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080]};
const BACKGROUND_CHOICES = [
  ['transparent', 'Transparent'],
  ['paper', 'Paper'],
  ['white', 'White'],
  ['light-grey', 'Light grey'],
  ['charcoal', 'Charcoal'],
  ['custom', 'Custom colour…'],
];
/** Common params edited in the Display panel rather than the form. */
const DISPLAY_KEYS = ['background', 'palette', 'theme', 'locale', 'textVisibility', 'reducedMotion'];
/** Common params edited in the form's "Timing and framing" group. */
const FRAMING_KEYS = ['durationMs', 'seed', 'safeArea', 'jurisdiction', 'contentNotice'];
const STATUS_ORDER = ['planned', 'in_progress', 'implemented', 'automated_pass', 'visual_reviewed', 'accepted', 'blocked'];
const STATUS_TEXT = {
  planned: 'Planned', in_progress: 'In progress', implemented: 'Implemented', automated_pass: 'Automated checks passed',
  visual_reviewed: 'Visually reviewed', accepted: 'Accepted', blocked: 'Blocked',
};
const TREATMENT_TEXT = {story: 'Story', mechanism: 'Mechanism', contrast: 'Contrast', inspect: 'Inspect'};
const ROW_H = 76;
const OVERSCAN = 4;
const STORE_PREFIX = 'law-gallery:v1:';
const META_ENRICH_LIMIT = 400;

const $ = id => /** @type {HTMLElement} */ (document.getElementById(id));
/** Resolve a path relative to this module (gallery/), independent of the page URL. */
const here = rel => new URL(rel, import.meta.url).href;

/* ----------------------------------------------------------- storage */
const store = {
  get(key, fallback) {
    try {
      const raw = window.localStorage.getItem(STORE_PREFIX + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove(key) {
    try { window.localStorage.removeItem(STORE_PREFIX + key); } catch { /* storage unavailable */ }
  },
};

/* -------------------------------------------------------------- state */
const S = {
  catalog: /** @type {any[]} */ ([]),
  byId: new Map(),
  filtered: /** @type {any[]} */ ([]),
  registry: /** @type {Record<string, () => Promise<any>> | null} */ (null),
  selectedId: /** @type {string|null} */ (null),
  activeIndex: -1,
  rendered: new Map(),
  selectSeq: 0,
  instSeq: 0,
  prefs: {ratio: '16:9', fps: 30, speed: 1, background: null, guides: false, category: '', treatment: '', status: '', query: ''},
  /** @type {null | {id:string, entry:any, def:any, inst:any, presets:any[]|null, preset:string, timeMs:number, sourcePath:string|null}} */
  cur: null,
  playing: false,
  raf: 0,
  playWall: 0,
  playFrom: 0,
  lastBeatUpdate: 0,
  fields: new Map(),
  pendingText: new Map(),
};

function loadPrefs() {
  const saved = store.get('prefs', null);
  if (saved && typeof saved === 'object') {
    if (RATIOS[saved.ratio]) S.prefs.ratio = saved.ratio;
    if ([24, 30, 60].includes(saved.fps)) S.prefs.fps = saved.fps;
    if ([0.25, 0.5, 1].includes(saved.speed)) S.prefs.speed = saved.speed;
    if (typeof saved.background === 'string' && isBackground(saved.background)) S.prefs.background = saved.background;
    S.prefs.guides = saved.guides === true;
    for (const k of ['category', 'treatment', 'status', 'query']) if (typeof saved[k] === 'string') S.prefs[k] = saved[k];
  }
}
const savePrefs = () => store.set('prefs', S.prefs);

const isBackground = v => ['transparent', 'paper', 'white', 'light-grey', 'charcoal'].includes(v) || /^#[0-9a-fA-F]{6}$/.test(v);

/* ------------------------------------------------------------ helpers */
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const humanize = key => {
  const s = String(key).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const fmt = n => new Intl.NumberFormat('en').format(n);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else node.setAttribute(k, String(v));
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** Append children, skipping null/false (Element.append would print "null"). */
function put(node, ...kids) {
  node.append(...kids.flat().filter(k => k != null && k !== false));
  return node;
}

async function fetchText(rel) {
  const res = await fetch(here(rel), {cache: 'no-store'});
  if (!res.ok) throw new Error(`${rel}: HTTP ${res.status}`);
  return res.text();
}
async function fetchJSON(rel) {
  return JSON.parse(await fetchText(rel));
}
/** Retry briefly: other tools may be regenerating the index/registry. */
async function retry(fn, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(i); } catch (err) { last = err; await new Promise(r => setTimeout(r, 250 * (i + 1))); }
  }
  throw last;
}
const safeRel = p => typeof p === 'string' && /^src\/[\w./-]+$/.test(p) && !p.includes('..');

/* ------------------------------------------------------------- status */
function chipFor(e) {
  const recorded = STATUS_TEXT[e.status] || e.status;
  if (!e.implemented) {
    if (e.status === 'blocked') return {cls: 'blocked', text: 'Blocked', title: 'Blocked; no saved module'};
    return {cls: 'pending', text: 'Pending', title: `Pending: brief only, no saved module (recorded status: ${recorded})`};
  }
  const title = `Module saved. Recorded production status: ${recorded}`;
  switch (e.status) {
    case 'accepted': return {cls: 'accepted', text: 'Accepted', title};
    case 'visual_reviewed': return {cls: 'tested', text: 'Reviewed', title};
    case 'automated_pass': return {cls: 'tested', text: 'Checks passed', title};
    case 'blocked': return {cls: 'blocked', text: 'Blocked', title};
    default: return {cls: 'unreviewed', text: 'Not accepted', title};
  }
}

/* ------------------------------------------------------------- search */
function buildHay(e) {
  return norm([
    e.id, e.slug, e.title, e.titleEn, e.category, e.categoryName, e.motif, e.treatment, TREATMENT_TEXT[e.treatment],
    e.family, e.action, ...(e.objects || []), ...(e.tags || []), e.comparison && e.comparison.a, e.comparison && e.comparison.b,
  ].filter(Boolean).join(' | '));
}

function matches(e, tokens) {
  for (const tok of tokens) {
    const idm = /^(?:law-?)?(\d{1,4})$/.exec(tok);
    if (idm && e.id === `LAW-${idm[1].padStart(4, '0')}`) continue;
    if (!e._hay.includes(tok)) return false;
  }
  return true;
}

function applyFilters() {
  const q = norm(S.prefs.query).trim();
  const tokens = q ? q.split(/\s+/) : [];
  const {category, treatment, status} = S.prefs;
  const out = [];
  for (const e of S.catalog) {
    if (category && e.category !== category) continue;
    if (treatment && e.treatment !== treatment) continue;
    if (status === 'pending' && e.implemented) continue;
    if (status === 'module' && !e.implemented) continue;
    if (status.startsWith('status:') && e.status !== status.slice(7)) continue;
    if (tokens.length && !matches(e, tokens)) continue;
    out.push(e);
  }
  // Ranking (stable): an exact ID match first, then entries containing the
  // whole query as a phrase, then the remaining matches in catalogue order.
  let ranked = out;
  if (tokens.length) {
    const idm = tokens.length === 1 && /^(?:law-?)?(\d{1,4})$/.exec(tokens[0]);
    const exactId = idm ? `LAW-${idm[1].padStart(4, '0')}` : null;
    const phrase = tokens.join(' ');
    const rank = e => (e.id === exactId ? 0 : tokens.length > 1 && e._hay.includes(phrase) ? 1 : 2);
    ranked = out.map((e, i) => [rank(e), i, e]).sort((x, y) => x[0] - y[0] || x[1] - y[1]).map(x => x[2]);
  }
  S.filtered = ranked;
  S.activeIndex = S.selectedId ? ranked.findIndex(e => e.id === S.selectedId) : -1;
  const n = out.length;
  const pend = out.reduce((a, e) => a + (e.implemented ? 0 : 1), 0);
  $('count').textContent = n === 0
    ? 'No animations match. Clear the search or a filter.'
    : `${fmt(n)} shown: ${fmt(n - pend)} with a saved module, ${fmt(pend)} pending.`;
  $('list').scrollTop = 0;
  renderList(true);
}

/* -------------------------------------------------------- virtual list */
function renderList(force = false) {
  const list = $('list');
  const inner = $('list-inner');
  const n = S.filtered.length;
  inner.style.height = `${n * ROW_H}px`;
  const top = list.scrollTop;
  const h = list.clientHeight || 600;
  const start = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN);
  const end = Math.min(n, Math.ceil((top + h) / ROW_H) + OVERSCAN);
  const keep = new Map();
  for (let i = start; i < end; i++) {
    const e = S.filtered[i];
    let row = S.rendered.get(e.id);
    if (!row || force) {
      if (row) row.remove();
      row = makeRow(e);
    }
    row.style.transform = `translateY(${i * ROW_H}px)`;
    row.dataset.index = String(i);
    row.setAttribute('aria-posinset', String(i + 1));
    row.setAttribute('aria-setsize', String(n));
    row.setAttribute('aria-selected', e.id === S.selectedId ? 'true' : 'false');
    row.classList.toggle('active', i === S.activeIndex && document.activeElement === list);
    keep.set(e.id, row);
    if (!row.parentNode) inner.appendChild(row);
  }
  for (const [id, row] of S.rendered) if (!keep.has(id) || keep.get(id) !== row) row.remove();
  S.rendered = keep;
  const active = S.filtered[S.activeIndex];
  if (active && keep.has(active.id)) list.setAttribute('aria-activedescendant', `opt-${active.id}`);
  else list.removeAttribute('aria-activedescendant');
}

function makeRow(e) {
  const chip = chipFor(e);
  let thumb;
  if (e.implemented && e.hasThumb) {
    thumb = el('img', {class: 'thumb', src: here(`../${e.thumb}`), alt: '', width: 96, height: 54, loading: 'lazy', decoding: 'async'});
    thumb.addEventListener('error', () => thumb.replaceWith(el('div', {class: 'thumb placeholder', text: 'no still'})), {once: true});
  } else {
    thumb = el('div', {class: 'thumb placeholder', 'aria-hidden': 'true', text: e.implemented ? 'no still yet' : 'pending'});
  }
  const row = el('div', {class: 'item', role: 'option', id: `opt-${e.id}`, 'data-id': e.id, title: chip.title},
    thumb,
    el('div', {class: 'row-text'},
      el('div', {class: 'row-line'},
        el('span', {class: 'row-id', text: e.id}),
        el('span', {class: 'row-treat', text: TREATMENT_TEXT[e.treatment] || e.treatment}),
        el('span', {class: `chip ${chip.cls}`, text: chip.text})),
      el('div', {class: 'row-title', text: e.titleEn || e.title}),
      el('div', {class: 'row-cat', text: `${e.categoryName} / ${e.motif}`})),
  );
  row.addEventListener('click', () => {
    S.activeIndex = Number(row.dataset.index);
    select(e.id, {scroll: true});
  });
  return row;
}

function ensureVisible(i) {
  const list = $('list');
  const y = i * ROW_H;
  if (y < list.scrollTop) list.scrollTop = y;
  else if (y + ROW_H > list.scrollTop + list.clientHeight) list.scrollTop = y + ROW_H - list.clientHeight;
}

function onListKey(ev) {
  const n = S.filtered.length;
  if (!n) return;
  let i = S.activeIndex < 0 ? -1 : S.activeIndex;
  const page = Math.max(1, Math.floor($('list').clientHeight / ROW_H) - 1);
  switch (ev.key) {
    case 'ArrowDown': i = Math.min(n - 1, i + 1); break;
    case 'ArrowUp': i = Math.max(0, i - 1); break;
    case 'PageDown': i = Math.min(n - 1, i + page); break;
    case 'PageUp': i = Math.max(0, i - page); break;
    case 'Home': i = 0; break;
    case 'End': i = n - 1; break;
    case 'Enter': case ' ':
      if (i >= 0) select(S.filtered[i].id, {scroll: false});
      ev.preventDefault();
      return;
    default: return;
  }
  ev.preventDefault();
  S.activeIndex = i;
  ensureVisible(i);
  renderList();
  select(S.filtered[i].id, {scroll: false});
}

/* ---------------------------------------------------------- selection */
function teardown() {
  pause();
  S.selectSeq++;
  const cur = S.cur;
  if (cur && cur.inst) cur.inst.destroy();
  S.cur = null;
  $('mount').replaceChildren();
  $('param-fields').replaceChildren();
  S.fields.clear();
  for (const t of S.pendingText.values()) clearTimeout(t);
  S.pendingText.clear();
  clearErrors();
  $('meta').replaceChildren();
  $('source').firstElementChild.textContent = '';
  $('source-files').replaceChildren();
  $('load-error').hidden = true;
  $('pending').hidden = true;
  $('player').hidden = true;
}

async function select(id, {scroll = false} = {}) {
  const entry = S.byId.get(id);
  if (!entry) return;
  if (S.cur && S.cur.id === id) return;
  teardown();
  const token = S.selectSeq;
  S.selectedId = id;
  store.set('last', id);
  if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
  S.activeIndex = S.filtered.findIndex(e => e.id === id);
  renderList();
  showIdentity(entry, null);
  $('empty').hidden = true;
  $('detail').hidden = false;
  // On narrow screens the detail sits below the list: bring it into view once
  // its final height is known (after the pending box or the preview is shown).
  const reveal = () => {
    if (scroll && token === S.selectSeq && window.matchMedia('(max-width: 900px)').matches) $('detail').scrollIntoView({block: 'start'});
  };

  const loader = S.registry && S.registry[id];
  if (!entry.implemented || !loader) {
    showPending(entry, entry.implemented && !loader);
    reveal();
    return;
  }
  try {
    const mod = await loader();
    if (token !== S.selectSeq) return;
    const def = mod.default;
    if (!def || def.id !== id || typeof def.create !== 'function') throw new Error(`${entry.module} does not export a definition for ${id}`);
    // Skip the request when the index says no presets file exists (optional field).
    let presets = null;
    if (entry.hasPresets !== false) {
      try {
        const pj = await fetchJSON(`../${entry.presets}`);
        presets = Array.isArray(pj.presets) ? pj.presets : null;
      } catch { presets = null; }
    }
    if (token !== S.selectSeq) return;
    S.cur = {id, entry, def, inst: null, presets, preset: presets && presets.length ? `saved:${presets[0].name}` : '', timeMs: 0, sourcePath: null};
    showIdentity(entry, def);
    $('player').hidden = false;
    buildDisplayControls(def);
    const first = presets && presets.length ? presets[0].params : {};
    await mountInstance(withViewPrefs(first), 0);
    reveal();
  } catch (err) {
    if (token !== S.selectSeq) return;
    showLoadError(err);
    reveal();
  }
}

function withViewPrefs(params) {
  const p = clone(params) || {};
  if (S.prefs.background && p.background === undefined) p.background = S.prefs.background;
  return p;
}

/**
 * Create (or recreate) the preview instance with complete params. Recreating
 * is used for presets/reset so no sub-field of a previous state can linger.
 */
async function mountInstance(params, timeMs) {
  const cur = S.cur;
  if (!cur) return false;
  pause();
  if (cur.inst) { cur.inst.destroy(); cur.inst = null; }
  $('mount').replaceChildren();
  const [W, H] = RATIOS[S.prefs.ratio];
  let inst;
  try {
    inst = cur.def.create($('mount'), {width: W, height: H, params, instanceId: `gallery-${cur.id}-${++S.instSeq}`});
  } catch (err) {
    showProblems(err);
    if (params && Object.keys(params).length) {
      // Fall back to the module's defaults so the preview stays usable.
      inst = cur.def.create($('mount'), {width: W, height: H, params: {}, instanceId: `gallery-${cur.id}-${++S.instSeq}`});
    } else {
      throw err;
    }
  }
  cur.inst = inst;
  await inst.ready;
  if (S.cur !== cur || cur.inst !== inst) return false;
  inst.seek(Math.min(Math.max(0, timeMs || 0), inst.durationMs));
  cur.timeMs = inst.getState({bounds: false}).timeMs;
  syncStage();
  syncDisplayControls();
  buildForm();
  buildPresetSelect();
  syncTransport(true);
  if ($('meta-box').open) renderMeta();
  return true;
}

function showIdentity(entry, def) {
  $('d-id').textContent = entry.id;
  const chip = chipFor(entry);
  const badge = $('d-badge');
  badge.className = `chip ${chip.cls}`;
  badge.textContent = chip.text;
  badge.title = chip.title;
  const md = def && def.metadata;
  $('d-title').textContent = (md && md.title) || entry.titleEn || entry.title;
  const parts = [`${entry.categoryName} (${entry.category})`, `Motif: ${entry.motif}`, `Treatment: ${TREATMENT_TEXT[entry.treatment] || entry.treatment}`];
  if (md && md.titleEs && md.titleEs !== md.title) parts.push(`Catalogue title: ${md.titleEs}`);
  else if (md && entry.title !== md.title) parts.push(`Catalogue title: ${entry.title}`);
  $('d-sub').textContent = parts.join('. ') + '.';
  const content = (md && md.content) || {};
  const jur = content.jurisdiction || 'unspecified';
  const legal = content.legalStatus || entry.legalStatus || 'illustrative-unverified';
  const lines = entry.implemented
    ? [`Illustrative example with fictional content. Jurisdiction: ${jur}. Legal status: ${legal}.`,
      content.note || 'Not a statement of the law of any jurisdiction; no rule, validity or outcome is asserted.']
    : [`Brief only: no animation has been produced for this ID yet. Its content is illustrative and unverified (${legal}); jurisdiction ${jur}.`];
  if (entry.implemented && entry.status === 'accepted') lines.push('Accepted means engineering and visual checks passed; it is not a legal review.');
  else if (entry.implemented) lines.push(`Engineering status: not accepted yet (recorded status ${entry.status}).`);
  $('d-notice').textContent = lines.join(' ');
}

function showPending(entry, notRegistered) {
  $('pending').hidden = false;
  const h = $('pending').querySelector('h3');
  h.textContent = notRegistered
    ? 'Module file listed but not registered: run node scripts/build-registry.mjs'
    : 'Pending: no saved module for this ID yet';
  const dl = $('pending-brief');
  dl.replaceChildren();
  const add = (k, v) => { if (v) dl.append(el('dt', {text: k}), el('dd', {text: v})); };
  add('Concrete action', entry.action);
  if (entry.comparison) add('Comparison', `${entry.comparison.a} / ${entry.comparison.b}`);
  add('Objects', (entry.objects || []).join(', '));
  add('Family', entry.family);
  add('Planned module', entry.module);
  add('Recorded status', STATUS_TEXT[entry.status] || entry.status);
}

function showLoadError(err) {
  const box = $('load-error');
  box.hidden = false;
  box.textContent = `Could not load this module.\n${err && err.stack ? err.stack : err}`;
}

/* ---------------------------------------------------------- playback */
function inst() {
  return S.cur && S.cur.inst && !S.cur.inst.destroyed ? S.cur.inst : null;
}

function seekTo(ms, fromPlayback = false) {
  const i = inst();
  if (!i) return;
  i.seek(ms);
  S.cur.timeMs = Math.min(Math.max(0, ms), i.durationMs);
  syncTransport(!fromPlayback);
}

function play() {
  const i = inst();
  if (!i || S.playing) return;
  if (S.cur.timeMs >= i.durationMs) seekTo(0);
  S.playing = true;
  S.playWall = performance.now();
  S.playFrom = S.cur.timeMs;
  $('b-play').textContent = 'Pause';
  $('b-play').setAttribute('aria-pressed', 'true');
  S.raf = requestAnimationFrame(tick);
}

function tick(now) {
  const i = inst();
  if (!S.playing || !i) return;
  const t = S.playFrom + Math.max(0, now - S.playWall) * S.prefs.speed;
  if (t >= i.durationMs) {
    seekTo(i.durationMs);
    pause();
    return;
  }
  seekTo(t, true);
  S.raf = requestAnimationFrame(tick);
}

function pause() {
  if (S.raf) cancelAnimationFrame(S.raf);
  S.raf = 0;
  if (!S.playing) return;
  S.playing = false;
  $('b-play').textContent = 'Play';
  $('b-play').setAttribute('aria-pressed', 'false');
  syncTransport(true);
}

function togglePlay() {
  if (S.playing) pause(); else play();
}

function replay() {
  pause();
  seekTo(0);
  play();
}

function lastFrame(i) {
  return Math.floor((i.durationMs * S.prefs.fps) / 1000 + 1e-9);
}

function stepFrame(delta) {
  const i = inst();
  if (!i) return;
  pause();
  const fps = S.prefs.fps;
  const exact = (S.cur.timeMs * fps) / 1000;
  let f = delta > 0 ? Math.floor(exact + 1e-6) + 1 : Math.ceil(exact - 1e-6) - 1;
  f = Math.min(Math.max(0, f), lastFrame(i));
  i.renderFrame(f, {fps});
  S.cur.timeMs = Math.min((f * 1000) / fps, i.durationMs);
  syncTransport(true);
}

function syncTransport(full) {
  const i = inst();
  if (!i) return;
  const t = S.cur.timeMs;
  const d = i.durationMs;
  const scrub = /** @type {HTMLInputElement} */ ($('scrub'));
  if (Number(scrub.max) !== d) scrub.max = String(d);
  scrub.value = String(Math.round(t));
  scrub.setAttribute('aria-valuetext', `${Math.round(t)} ms of ${d} ms`);
  const tIn = /** @type {HTMLInputElement} */ ($('t-ms'));
  tIn.max = String(d);
  if (document.activeElement !== tIn) tIn.value = String(Math.round(t * 100) / 100);
  $('t-dur').textContent = `of ${fmt(d)} ms`;
  const fps = S.prefs.fps;
  const exact = (t * fps) / 1000;
  const frameText = Math.abs(exact - Math.round(exact)) < 1e-6 ? String(Math.round(exact)) : `${exact.toFixed(2)}`;
  $('t-frame').textContent = `Frame ${frameText} of ${lastFrame(i)} at ${fps} fps`;
  const now = performance.now();
  if (full || now - S.lastBeatUpdate > 150) {
    S.lastBeatUpdate = now;
    let beat = '';
    try {
      const sem = i.getState({bounds: false}).semantic || {};
      beat = sem.beat ? `Beat: ${sem.beat}` : '';
    } catch { beat = ''; }
    $('t-beat').textContent = beat;
  }
}

/* ----------------------------------------------------- stage & display */
function syncStage() {
  const [W, H] = RATIOS[S.prefs.ratio];
  const stage = $('stage');
  stage.style.setProperty('--ar', `${W} / ${H}`);
  stage.style.setProperty('--arn', String(W / H));
  stage.style.setProperty('--maxh', H > W ? '72vh' : '56vh');
  const i = inst();
  const params = i ? i.getState({bounds: false}).params : null;
  $('frame').classList.toggle('solid', !!params && params.background !== 'transparent');
  const g = $('guides');
  g.hidden = !S.prefs.guides || !params;
  if (params) {
    const sa = params.safeArea;
    Object.assign(g.style, {left: `${sa.left * 100}%`, top: `${sa.top * 100}%`, right: `${sa.right * 100}%`, bottom: `${sa.bottom * 100}%`});
  }
}

function fillSelect(sel, options, value) {
  sel.replaceChildren(...options.map(([v, label]) => el('option', {value: v, text: label})));
  if (value !== undefined) sel.value = value;
}

function buildDisplayControls(def) {
  const P = def.paramsSchema.properties;
  fillSelect($('v-bg'), BACKGROUND_CHOICES);
  fillSelect($('v-palette'), (P.palette.enum || []).map(v => [v, humanize(v)]));
  fillSelect($('v-theme'), (P.theme.enum || []).map(v => [v, humanize(v)]));
  const LOC = {en: 'English (en)', es: 'Español (es)'};
  fillSelect($('v-locale'), (P.locale.enum || []).map(v => [v, LOC[v] || v]));
  fillSelect($('v-text'), (P.textVisibility.enum || []).map(v => [v, {all: 'All labels', key: 'Key labels only', none: 'No labels'}[v] || v]));
}

function syncDisplayControls() {
  const i = inst();
  if (!i) return;
  const p = i.getState({bounds: false}).params;
  const known = BACKGROUND_CHOICES.some(([v]) => v === p.background);
  /** @type {HTMLSelectElement} */ ($('v-bg')).value = known ? p.background : 'custom';
  const color = /** @type {HTMLInputElement} */ ($('v-bg-color'));
  color.hidden = known;
  if (!known) color.value = p.background;
  /** @type {HTMLSelectElement} */ ($('v-palette')).value = p.palette;
  /** @type {HTMLSelectElement} */ ($('v-theme')).value = p.theme;
  /** @type {HTMLSelectElement} */ ($('v-locale')).value = p.locale;
  /** @type {HTMLSelectElement} */ ($('v-text')).value = p.textVisibility;
  /** @type {HTMLInputElement} */ ($('v-reduced')).checked = !!p.reducedMotion;
  /** @type {HTMLInputElement} */ ($('v-guides')).checked = S.prefs.guides;
  /** @type {HTMLSelectElement} */ ($('v-ratio')).value = S.prefs.ratio;
  /** @type {HTMLSelectElement} */ ($('fps')).value = String(S.prefs.fps);
  /** @type {HTMLSelectElement} */ ($('speed')).value = String(S.prefs.speed);
}

/* ------------------------------------------------------ param changes */
/** Build a nested patch from a path. */
function patchFor(path, value) {
  const patch = {};
  let o = patch;
  path.forEach((k, idx) => {
    if (idx === path.length - 1) o[k] = value;
    else o = o[k] = {};
  });
  return patch;
}

/**
 * Apply a patch through the public API. Returns true on success. Validation
 * problems (ParamError.problems) are displayed next to the fields.
 */
function applyPatch(patch, sourcePath, {edited = true} = {}) {
  const i = inst();
  if (!i) return false;
  try {
    i.setParams(patch);
  } catch (err) {
    showProblems(err, sourcePath);
    return false;
  }
  clearErrors(true);
  S.cur.timeMs = i.getState({bounds: false}).timeMs;
  if (edited) markEdited();
  syncStage();
  syncTransport(true);
  if ($('meta-box').open) renderMeta();
  return true;
}

function markEdited() {
  S.cur.preset = 'edited';
  buildPresetSelect();
}

/**
 * Clear displayed problems. With resync, inputs that still hold a rejected
 * value are reset to the value the preview actually uses, so the form never
 * silently disagrees with the animation.
 */
function clearErrors(resync = false) {
  const box = $('param-errors');
  box.hidden = true;
  box.replaceChildren();
  const i = resync ? inst() : null;
  const params = i ? i.getState({bounds: false}).params : null;
  for (const [pathStr, f] of S.fields) {
    const wasInvalid = f.input && f.input.getAttribute('aria-invalid') === 'true';
    f.err.textContent = '';
    f.err.hidden = true;
    if (f.input) f.input.removeAttribute('aria-invalid');
    if (wasInvalid && params && f.sync) f.sync(valueAt(params, pathStr));
  }
}

function valueAt(params, pathStr) {
  return pathStr.split('.').slice(1).reduce((o, k) => (o == null ? undefined : o[k]), params);
}

function fieldForProblem(problemPath) {
  let p = problemPath;
  while (p) {
    if (S.fields.has(p)) return S.fields.get(p);
    const cut = Math.max(p.lastIndexOf('.'), p.lastIndexOf('['));
    if (cut <= 0) break;
    p = p.slice(0, cut);
  }
  return null;
}

function showProblems(err, sourcePath) {
  const problems = err && err.name === 'ParamError' && Array.isArray(err.problems) ? err.problems : [String(err && err.message || err)];
  clearErrors();
  const box = $('param-errors');
  box.hidden = false;
  box.append(el('strong', {text: 'Not applied: the preview keeps the last valid parameters.'}), el('ul', {}, problems.map(p => el('li', {text: p}))));
  for (const p of problems) {
    const at = p.indexOf(': ');
    const f = fieldForProblem(at > 0 ? p.slice(0, at) : '') || (sourcePath ? S.fields.get(sourcePath) : null);
    if (!f) continue;
    f.err.hidden = false;
    f.err.textContent = f.err.textContent ? `${f.err.textContent} ${p}` : p;
    if (f.input) f.input.setAttribute('aria-invalid', 'true');
  }
}

function setFieldError(pathStr, message) {
  const f = S.fields.get(pathStr);
  if (!f) return;
  f.err.hidden = false;
  f.err.textContent = message;
  if (f.input) f.input.setAttribute('aria-invalid', 'true');
}

/* --------------------------------------------------------- param form */
function buildForm() {
  const i = inst();
  const box = $('param-fields');
  box.replaceChildren();
  S.fields.clear();
  if (!i) return;
  const schema = S.cur.def.paramsSchema;
  const params = i.getState({bounds: false}).params;
  const sceneKeys = Object.keys(schema.properties).filter(k => !DISPLAY_KEYS.includes(k) && !FRAMING_KEYS.includes(k));
  const scene = el('fieldset', {class: 'fs'}, el('legend', {text: 'Scene content'}));
  for (const k of sceneKeys) scene.append(buildField(schema.properties[k], [k], params[k]));
  const framing = el('fieldset', {class: 'fs'}, el('legend', {text: 'Timing and framing'}));
  for (const k of FRAMING_KEYS) if (schema.properties[k]) framing.append(buildField(schema.properties[k], [k], params[k]));
  box.append(scene, framing);
}

function typesOf(schema) {
  return Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
}

function register(pathStr, input, err, sync = null) {
  S.fields.set(pathStr, {input, err, sync});
}

function buildField(schema, path, value) {
  const key = path[path.length - 1];
  const pathStr = `params.${path.join('.')}`;
  const types = typesOf(schema);
  const desc = schema.description ? el('span', {class: 'desc', text: schema.description}) : null;
  const err = el('span', {class: 'err', role: 'status', hidden: true});
  const id = `f-${path.join('-')}`;
  const label = el('label', {class: 'lbl', for: id}, el('span', {text: humanize(key)}), el('span', {class: 'key', text: key}));

  // Nested object with known properties: a fieldset of sub-fields.
  if (types.length === 1 && types[0] === 'object' && schema.properties) {
    const fs = el('fieldset', {class: 'fs'}, el('legend', {text: humanize(key)}));
    if (schema.description) fs.append(el('p', {class: 'desc fs-desc hint', text: schema.description}));
    fs.append(err);
    register(pathStr, null, err);
    const small = Object.values(schema.properties).every(s => typesOf(s).every(t => t === 'number' || t === 'integer' || t === 'boolean'));
    const holder = small ? el('div', {class: 'fields-2'}) : fs;
    for (const [k, sub] of Object.entries(schema.properties)) holder.append(buildField(sub, [...path, k], value ? value[k] : undefined));
    if (holder !== fs) fs.append(holder);
    return fs;
  }

  const wrap = el('div', {class: 'field'}, label);

  if (schema.enum && types.every(t => t === 'string' || t === 'number' || t === 'integer')) {
    const sel = el('select', {id});
    if (value === undefined) sel.append(el('option', {value: '', text: '(not set)', disabled: true}));
    for (const v of schema.enum) sel.append(el('option', {value: String(v), text: String(v)}));
    sel.value = value === undefined ? '' : String(value);
    sel.addEventListener('change', () => {
      const v = schema.enum.find(x => String(x) === sel.value);
      applyPatch(patchFor(path, v), pathStr);
    });
    put(wrap, sel, desc, err);
    register(pathStr, sel, err, v => { sel.value = v === undefined ? '' : String(v); });
    return wrap;
  }

  if (types.length === 1 && types[0] === 'boolean') {
    const cb = el('input', {id, type: 'checkbox'});
    cb.checked = !!value;
    cb.addEventListener('change', () => applyPatch(patchFor(path, cb.checked), pathStr));
    wrap.replaceChildren();
    put(wrap, el('label', {class: 'bool', for: id}, cb, el('span', {text: humanize(key)}), el('span', {class: 'key muted', text: key})), desc, err);
    register(pathStr, cb, err, v => { cb.checked = !!v; });
    return wrap;
  }

  if (types.length === 1 && (types[0] === 'number' || types[0] === 'integer')) {
    const isInt = types[0] === 'integer';
    const inp = el('input', {id, type: 'number', step: isInt ? '1' : 'any', inputmode: isInt ? 'numeric' : 'decimal'});
    if (schema.minimum != null) inp.setAttribute('min', String(schema.minimum));
    if (schema.maximum != null) inp.setAttribute('max', String(schema.maximum));
    inp.value = value === undefined ? '' : String(value);
    let range = null;
    if (!isInt && schema.minimum === 0 && schema.maximum === 1) {
      range = el('input', {type: 'range', min: '0', max: '1', step: '0.01', 'aria-label': `${humanize(key)} slider`});
      range.value = inp.value || '0';
      range.addEventListener('input', () => {
        inp.value = range.value;
        applyPatch(patchFor(path, Number(range.value)), pathStr);
      });
    }
    inp.addEventListener('change', () => {
      const raw = inp.value.trim();
      const n = Number(raw);
      if (raw === '' || !Number.isFinite(n)) {
        setFieldError(pathStr, `${pathStr}: enter a number`);
        return;
      }
      if (range) range.value = String(n);
      applyPatch(patchFor(path, n), pathStr);
    });
    put(wrap, inp, range, desc, err);
    register(pathStr, inp, err, v => {
      inp.value = v === undefined ? '' : String(v);
      if (range) range.value = inp.value || '0';
    });
    return wrap;
  }

  if (types.includes('string') && types.every(t => t === 'string' || t === 'null')) {
    const nullable = types.includes('null');
    const long = (schema.maxLength || 0) > 90;
    const inp = long ? el('textarea', {id, class: 'prose', rows: 2}) : el('input', {id, type: 'text'});
    inp.value = value == null ? '' : String(value);
    const counter = schema.maxLength ? el('span', {class: 'counter'}) : null;
    const updateCounter = () => {
      if (!counter) return;
      counter.textContent = `${inp.value.length} / ${schema.maxLength}`;
      counter.classList.toggle('over', inp.value.length > schema.maxLength);
    };
    updateCounter();
    let noneBox = null;
    if (nullable) {
      noneBox = el('input', {type: 'checkbox'});
      noneBox.checked = value === null;
      noneBox.addEventListener('change', () => {
        if (noneBox.checked) {
          inp.value = '';
          updateCounter();
          applyPatch(patchFor(path, null), pathStr);
        } else {
          applyPatch(patchFor(path, inp.value), pathStr);
        }
      });
    }
    let color = null;
    if (schema['x-format'] === 'color') {
      color = el('input', {type: 'color', 'aria-label': `${humanize(key)} colour picker`});
      if (/^#[0-9a-f]{6}$/i.test(inp.value)) color.value = inp.value;
      color.addEventListener('input', () => {
        inp.value = color.value;
        applyPatch(patchFor(path, color.value), pathStr);
      });
    }
    const commit = () => {
      clearTimeout(S.pendingText.get(pathStr));
      S.pendingText.delete(pathStr);
      if (noneBox) noneBox.checked = false;
      applyPatch(patchFor(path, inp.value), pathStr);
    };
    inp.addEventListener('input', () => {
      updateCounter();
      clearTimeout(S.pendingText.get(pathStr));
      S.pendingText.set(pathStr, setTimeout(commit, 350));
    });
    inp.addEventListener('change', commit);
    const control = color ? el('span', {class: 'pair'}, inp, color) : inp;
    put(wrap, control, noneBox && el('label', {class: 'nullable'}, noneBox, 'None (null)'),
      (counter || desc) && el('div', {class: 'meta-line'}, desc || el('span'), counter), err);
    register(pathStr, inp, err, v => {
      inp.value = v == null ? '' : String(v);
      if (noneBox) noneBox.checked = v === null;
      if (color && /^#[0-9a-f]{6}$/i.test(inp.value)) color.value = inp.value;
      updateCounter();
    });
    return wrap;
  }

  // Arrays and any other shape: JSON editor. Arrays replace the previous value.
  const ta = el('textarea', {id, spellcheck: 'false', rows: 3});
  const text = value === undefined ? '' : JSON.stringify(value, null, 2);
  ta.value = text;
  ta.rows = Math.min(14, Math.max(3, text.split('\n').length));
  const applyBtn = el('button', {type: 'button', text: 'Apply JSON'});
  const commitJSON = () => {
    let v;
    try {
      v = JSON.parse(ta.value);
    } catch (e) {
      setFieldError(pathStr, `${pathStr}: invalid JSON (${e.message})`);
      return;
    }
    if (applyPatch(patchFor(path, v), pathStr)) {
      ta.value = JSON.stringify(v, null, 2);
    }
  };
  applyBtn.addEventListener('click', commitJSON);
  ta.addEventListener('change', commitJSON);
  ta.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) { ev.preventDefault(); commitJSON(); }
  });
  put(wrap, ta, el('div', {class: 'json-actions'}, applyBtn, el('span', {class: 'hint', text: 'JSON; Ctrl/Cmd+Enter applies'})), desc, err);
  register(pathStr, ta, err, v => { ta.value = v === undefined ? '' : JSON.stringify(v, null, 2); });
  return wrap;
}

/* ------------------------------------------------------------ presets */
function personalKey(id) { return `personal:${id}`; }
function personalPresets(id) {
  const list = store.get(personalKey(id), []);
  return Array.isArray(list) ? list.filter(p => p && typeof p.name === 'string' && p.params && typeof p.params === 'object') : [];
}

function buildPresetSelect() {
  const cur = S.cur;
  if (!cur) return;
  const sel = /** @type {HTMLSelectElement} */ ($('p-select'));
  sel.replaceChildren();
  sel.append(el('option', {value: '', text: 'Default parameters'}));
  if (cur.presets && cur.presets.length) {
    const g = el('optgroup', {label: 'Saved with the module'});
    for (const p of cur.presets) g.append(el('option', {value: `saved:${p.name}`, text: p.name}));
    sel.append(g);
  }
  const mine = personalPresets(cur.id);
  if (mine.length) {
    const g = el('optgroup', {label: 'Personal (this browser)'});
    for (const p of mine) g.append(el('option', {value: `personal:${p.name}`, text: p.name}));
    sel.append(g);
  }
  if (cur.preset === 'edited') sel.append(el('option', {value: 'edited', text: 'Edited parameters (unsaved)'}));
  sel.value = cur.preset;
  if (sel.value !== cur.preset) sel.value = '';
  const desc = $('p-desc');
  const [kind, ...rest] = cur.preset.split(':');
  const name = rest.join(':');
  if (kind === 'saved') desc.textContent = (cur.presets.find(p => p.name === name) || {}).description || '';
  else if (kind === 'personal') desc.textContent = 'Saved in this browser only.';
  else if (kind === 'edited') desc.textContent = 'Parameters differ from the chosen preset.';
  else desc.textContent = cur.presets ? 'The module’s fictional, illustrative defaults.' : `No presets file is saved for this ID yet (${cur.entry.presets}). Showing the module defaults.`;
  /** @type {HTMLButtonElement} */ ($('p-delete')).disabled = kind !== 'personal';
}

async function choosePreset(value) {
  const cur = S.cur;
  if (!cur || value === 'edited') return;
  let params = {};
  if (value.startsWith('saved:')) {
    const p = (cur.presets || []).find(x => x.name === value.slice(6));
    if (!p) return;
    params = p.params;
  } else if (value.startsWith('personal:')) {
    const p = personalPresets(cur.id).find(x => x.name === value.slice(9));
    if (!p) return;
    params = p.params;
  }
  const previous = cur.preset;
  cur.preset = value;
  clearErrors();
  try {
    await mountInstance(withViewPrefs(params), cur.timeMs);
  } catch (err) {
    cur.preset = previous;
    showProblems(err);
  }
  $('p-msg').textContent = '';
}

function savePersonal() {
  const cur = S.cur;
  const i = inst();
  if (!cur || !i) return;
  const name = /** @type {HTMLInputElement} */ ($('p-name')).value.trim();
  const msg = $('p-msg');
  if (!name) { msg.textContent = 'Enter a name for the preset.'; return; }
  const list = personalPresets(cur.id).filter(p => p.name !== name);
  const existed = list.length !== personalPresets(cur.id).length;
  list.push({name, params: i.getState({bounds: false}).params});
  if (!store.set(personalKey(cur.id), list)) {
    msg.textContent = 'Could not save: browser storage is unavailable here.';
    return;
  }
  cur.preset = `personal:${name}`;
  buildPresetSelect();
  msg.textContent = existed ? `Updated personal preset “${name}”.` : `Saved personal preset “${name}”.`;
}

function deletePersonal() {
  const cur = S.cur;
  if (!cur || !cur.preset.startsWith('personal:')) return;
  const name = cur.preset.slice(9);
  store.set(personalKey(cur.id), personalPresets(cur.id).filter(p => p.name !== name));
  cur.preset = 'edited';
  buildPresetSelect();
  $('p-msg').textContent = `Deleted personal preset “${name}”. The preview keeps its current parameters.`;
}

/* ------------------------------------------------------------ export */
function stillName(ext) {
  const i = inst();
  const st = i.getState({bounds: false});
  const preset = S.cur.preset ? S.cur.preset.replace(/^(saved|personal):/, '').replace(/[^\w-]+/g, '-') : 'default';
  return `${S.cur.id}_${preset}_${S.prefs.ratio.replace(':', 'x')}_${Math.round(st.timeMs)}ms.${ext}`;
}

/** Serialize the current frame as a standalone SVG document. */
function svgMarkup() {
  const i = inst();
  const [W, H] = RATIOS[S.prefs.ratio];
  const copy = /** @type {SVGSVGElement} */ (i.element.cloneNode(true));
  copy.setAttribute('width', String(W));
  copy.setAttribute('height', String(H));
  copy.removeAttribute('style');
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(copy)}\n`;
}

async function pngBlob() {
  const [W, H] = RATIOS[S.prefs.ratio];
  const url = URL.createObjectURL(new Blob([svgMarkup()], {type: 'image/svg+xml'}));
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('The SVG frame could not be rasterised'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.getContext('2d').drawImage(img, 0, 0, W, H);
    return await new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = el('a', {href: url, download: name});
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function exportStill(kind) {
  if (!inst()) return;
  pause();
  try {
    if (kind === 'svg') download(new Blob([svgMarkup()], {type: 'image/svg+xml'}), stillName('svg'));
    else download(await pngBlob(), stillName('png'));
  } catch (err) {
    showProblems(err);
  }
}

/* ------------------------------------------------------ metadata/source */
function renderMeta() {
  const cur = S.cur;
  const i = inst();
  const box = $('meta');
  box.replaceChildren();
  if (!cur) return;
  const md = cur.def.metadata || {};
  const e = cur.entry;
  const dl = el('dl', {class: 'facts'});
  const add = (k, v) => { if (v != null && v !== '' && !(Array.isArray(v) && !v.length)) dl.append(el('dt', {text: k}), el('dd', {text: Array.isArray(v) ? v.join(', ') : String(v)})); };
  add('ID', cur.def.id);
  add('Version', cur.def.version);
  add('Title', md.title);
  add('Catalogue title', md.titleEs || e.title);
  add('Description', md.description);
  add('Category', `${md.categoryName || e.categoryName} (${md.category || e.category})`);
  add('Motif', md.motif || e.motif);
  add('Treatment', md.treatment || e.treatment);
  add('Family', md.family || e.family);
  add('Tags', md.tags);
  add('Objects in brief', e.objects);
  add('Concrete action (brief)', e.action);
  if (md.durations) add('Duration', `${md.durations.defaultMs} ms default; designed for ${(md.durations.designedFor || []).join(', ')} ms`);
  add('Sizes', md.sizes);
  if (md.compatibility) {
    add('Locales', md.compatibility.locales);
    add('Palettes', md.compatibility.palettes);
    add('Themes', md.compatibility.themes);
  }
  if (md.content) {
    add('Jurisdiction', md.content.jurisdiction);
    add('Legal status', md.content.legalStatus);
    add('Fictional example', md.content.fictionalExample ? 'yes' : 'no');
    add('Sources', md.content.sources && md.content.sources.length ? md.content.sources.map(s => (typeof s === 'string' ? s : JSON.stringify(s))) : 'none');
    add('Content note', md.content.note);
  }
  add('Recorded production status', STATUS_TEXT[e.status] || e.status);
  add('Module', e.module);
  add('Presets file', e.presets);
  add('Local assets', md.assets);
  add('Licence', md.license);
  box.append(dl);
  if (i) {
    const st = i.getState({bounds: false});
    const summary = {timeMs: st.timeMs, progress: Math.round(st.progress * 10000) / 10000, width: st.width, height: st.height, orientation: st.orientation, layoutShape: st.layoutShape, nodeCount: Object.keys(st.nodes || {}).length, semantic: st.semantic};
    box.append(el('h4', {text: 'Current state (getState)'}), el('pre', {class: 'code state-json', text: JSON.stringify(summary, null, 2)}),
      el('div', {class: 'actions'}, el('button', {type: 'button', text: 'Refresh state', onclick: renderMeta})));
  }
}

function sourceFiles() {
  const cur = S.cur;
  const md = cur.def.metadata || {};
  const files = [cur.entry.module, cur.entry.presets, cur.entry.module.replace(/\.js$/, '.meta.json'), ...(md.assets || [])];
  return [...new Set(files.filter(safeRel))];
}

async function showSource(path) {
  const cur = S.cur;
  if (!cur) return;
  cur.sourcePath = path;
  for (const b of $('source-files').querySelectorAll('button')) b.setAttribute('aria-pressed', b.dataset.path === path ? 'true' : 'false');
  const code = $('source').firstElementChild;
  code.textContent = `Loading ${path}…`;
  try {
    const text = await fetchText(`../${path}`);
    if (S.cur === cur && cur.sourcePath === path) code.textContent = text;
  } catch (err) {
    if (S.cur === cur) code.textContent = `Could not load ${path}: ${err.message}`;
  }
}

function renderSourceButtons() {
  const cur = S.cur;
  const box = $('source-files');
  box.replaceChildren();
  if (!cur) return;
  for (const p of sourceFiles()) {
    box.append(el('button', {type: 'button', 'data-path': p, 'aria-pressed': 'false', text: p.replace(/^src\//, ''), onclick: () => showSource(p)}));
  }
}

/* --------------------------------------------------------- enrichment */
/**
 * The index may not carry English titles or tags. For the saved modules only
 * (bounded), read their generated .meta.json to extend local search.
 */
async function enrichFromMeta() {
  const todo = S.catalog.filter(e => e.implemented && !e.tags);
  if (!todo.length || todo.length > META_ENRICH_LIMIT) return;
  let changed = false;
  const worker = async () => {
    while (todo.length) {
      const e = todo.shift();
      try {
        const md = await fetchJSON(`../${e.module.replace(/\.js$/, '.meta.json')}`);
        if (Array.isArray(md.tags)) e.tags = md.tags;
        if (typeof md.title === 'string') e.titleEn = md.title;
        e._hay = buildHay(e);
        changed = true;
      } catch { /* metadata not generated yet */ }
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (changed) {
    const top = $('list').scrollTop;
    applyFilters();
    $('list').scrollTop = top;
    renderList(true);
  }
}

/* ------------------------------------------------------------- wiring */
function wire() {
  const q = /** @type {HTMLInputElement} */ ($('q'));
  q.value = S.prefs.query;
  let qTimer = 0;
  q.addEventListener('input', () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { S.prefs.query = q.value; savePrefs(); applyFilters(); }, 120);
  });
  q.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && S.filtered.length) { ev.preventDefault(); select(S.filtered[0].id, {scroll: true}); }
    if (ev.key === 'ArrowDown') { ev.preventDefault(); $('list').focus(); }
  });
  for (const [idName, key] of [['f-category', 'category'], ['f-treatment', 'treatment'], ['f-status', 'status']]) {
    const sel = /** @type {HTMLSelectElement} */ ($(idName));
    sel.value = S.prefs[key];
    if (sel.value !== S.prefs[key]) S.prefs[key] = sel.value;
    sel.addEventListener('change', () => { S.prefs[key] = sel.value; savePrefs(); applyFilters(); });
  }
  const list = $('list');
  let scrollRaf = 0;
  list.addEventListener('scroll', () => {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; renderList(); });
  }, {passive: true});
  list.addEventListener('keydown', onListKey);
  list.addEventListener('focus', () => {
    if (S.activeIndex < 0 && S.filtered.length) S.activeIndex = 0;
    renderList();
  });
  list.addEventListener('blur', () => renderList());
  window.addEventListener('resize', () => renderList());

  $('b-play').addEventListener('click', togglePlay);
  $('b-replay').addEventListener('click', replay);
  $('b-prev').addEventListener('click', () => stepFrame(-1));
  $('b-next').addEventListener('click', () => stepFrame(1));
  const scrub = /** @type {HTMLInputElement} */ ($('scrub'));
  scrub.addEventListener('input', () => { pause(); seekTo(Number(scrub.value)); });
  const tIn = /** @type {HTMLInputElement} */ ($('t-ms'));
  tIn.addEventListener('change', () => {
    const v = Number(tIn.value);
    if (tIn.value.trim() === '' || !Number.isFinite(v)) { syncTransport(true); return; }
    pause();
    seekTo(v);
    tIn.value = String(Math.round(S.cur.timeMs * 100) / 100);
  });
  tIn.addEventListener('keydown', ev => { if (ev.key === 'Enter') tIn.dispatchEvent(new Event('change')); });
  $('fps').addEventListener('change', ev => { S.prefs.fps = Number(/** @type {HTMLSelectElement} */ (ev.target).value); savePrefs(); syncTransport(true); });
  $('speed').addEventListener('change', ev => {
    const wasPlaying = S.playing;
    pause();
    S.prefs.speed = Number(/** @type {HTMLSelectElement} */ (ev.target).value);
    savePrefs();
    if (wasPlaying) play();
  });

  $('v-ratio').addEventListener('change', ev => {
    S.prefs.ratio = /** @type {HTMLSelectElement} */ (ev.target).value;
    savePrefs();
    const i = inst();
    if (!i) return;
    const [W, H] = RATIOS[S.prefs.ratio];
    i.resize({width: W, height: H});
    syncStage();
    syncTransport(true);
    if ($('meta-box').open) renderMeta();
  });
  $('v-bg').addEventListener('change', ev => {
    const v = /** @type {HTMLSelectElement} */ (ev.target).value;
    const color = /** @type {HTMLInputElement} */ ($('v-bg-color'));
    if (v === 'custom') {
      color.hidden = false;
      setBackground(color.value);
    } else {
      color.hidden = true;
      setBackground(v);
    }
  });
  $('v-bg-color').addEventListener('input', ev => setBackground(/** @type {HTMLInputElement} */ (ev.target).value));
  const direct = [['v-palette', 'palette'], ['v-theme', 'theme'], ['v-locale', 'locale'], ['v-text', 'textVisibility']];
  for (const [idName, key] of direct) {
    $(idName).addEventListener('change', ev => applyPatch({[key]: /** @type {HTMLSelectElement} */ (ev.target).value}));
  }
  $('v-reduced').addEventListener('change', ev => applyPatch({reducedMotion: /** @type {HTMLInputElement} */ (ev.target).checked}));
  $('v-guides').addEventListener('change', ev => {
    S.prefs.guides = /** @type {HTMLInputElement} */ (ev.target).checked;
    savePrefs();
    syncStage();
  });

  $('p-select').addEventListener('change', ev => choosePreset(/** @type {HTMLSelectElement} */ (ev.target).value));
  $('p-reset').addEventListener('click', () => choosePreset(''));
  $('p-save').addEventListener('click', savePersonal);
  $('p-name').addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); savePersonal(); } });
  $('p-delete').addEventListener('click', deletePersonal);
  $('params').addEventListener('submit', ev => ev.preventDefault());

  $('x-svg').addEventListener('click', () => exportStill('svg'));
  $('x-png').addEventListener('click', () => exportStill('png'));

  $('meta-box').addEventListener('toggle', () => { if ($('meta-box').open) renderMeta(); });
  $('source-box').addEventListener('toggle', () => {
    if (!$('source-box').open || !S.cur) return;
    if (!$('source-files').childElementCount) renderSourceButtons();
    if (!S.cur.sourcePath) showSource(S.cur.entry.module);
  });

  document.addEventListener('keydown', ev => {
    const t = /** @type {HTMLElement} */ (ev.target);
    if (ev.defaultPrevented || ev.altKey || ev.metaKey || ev.ctrlKey) return;
    if (t.closest('input, textarea, select, button, summary, [contenteditable="true"]')) return;
    // Inside the list, Space selects the highlighted row; arrows still step frames.
    if (ev.key === ' ' && !t.closest('.list')) { ev.preventDefault(); togglePlay(); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); stepFrame(1); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); stepFrame(-1); }
  });
  // A hidden tab gets no animation frames; pause instead of jumping ahead.
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('hashchange', () => {
    const id = location.hash.slice(1);
    if (S.byId.has(id)) select(id);
  });
}

/** Background is treated as a viewing preference: kept across items and presets. */
function setBackground(value) {
  if (applyPatch({background: value}, undefined, {edited: false})) {
    S.prefs.background = value;
    savePrefs();
  }
}

function fillFilters() {
  const cats = new Map();
  const statusCount = new Map();
  let pending = 0;
  for (const e of S.catalog) {
    const c = cats.get(e.category) || {name: e.categoryName, n: 0};
    c.n++;
    cats.set(e.category, c);
    statusCount.set(e.status, (statusCount.get(e.status) || 0) + 1);
    if (!e.implemented) pending++;
  }
  const catSel = $('f-category');
  for (const [k, c] of cats) catSel.append(el('option', {value: k, text: `${c.name} (${c.n})`}));
  const stSel = $('f-status');
  stSel.append(
    el('option', {value: 'pending', text: `Pending, no module (${fmt(pending)})`}),
    el('option', {value: 'module', text: `Saved module (${fmt(S.catalog.length - pending)})`}),
  );
  const g = el('optgroup', {label: 'Recorded production status'});
  for (const s of STATUS_ORDER) g.append(el('option', {value: `status:${s}`, text: `${STATUS_TEXT[s]} (${fmt(statusCount.get(s) || 0)})`}));
  stSel.append(g);
}

function fillTotals() {
  const n = S.catalog.length;
  const mod = S.catalog.filter(e => e.implemented).length;
  const acc = S.catalog.filter(e => e.status === 'accepted').length;
  $('totals').textContent = `${fmt(n)} IDs: ${fmt(mod)} with a saved module, ${fmt(acc)} accepted, ${fmt(n - mod)} pending.`;
}

async function main() {
  // index.html injects this module dynamically (async), so wait for the DOM.
  if (document.readyState === 'loading') await new Promise(r => document.addEventListener('DOMContentLoaded', r, {once: true}));
  loadPrefs();
  const [catalog, reg] = await Promise.all([
    retry(() => fetchJSON('./catalog-index.json')),
    // A failed module import is cached by URL, so retries use a fresh URL.
    retry(attempt => import(attempt ? `../src/registry.js?retry=${attempt}` : '../src/registry.js')),
  ]);
  if (!Array.isArray(catalog)) throw new Error('catalog-index.json is not a list');
  S.catalog = catalog;
  S.registry = reg.registry;
  for (const e of catalog) {
    e._hay = buildHay(e);
    S.byId.set(e.id, e);
  }
  fillFilters();
  fillTotals();
  wire();
  applyFilters();
  const fromHash = location.hash.slice(1);
  const last = store.get('last', null);
  const initial = S.byId.has(fromHash) ? fromHash : (typeof last === 'string' && S.byId.has(last) ? last : null);
  if (initial) await select(initial);
  document.body.dataset.ready = '1';
  enrichFromMeta();
}

/** Minimal handle for automated tests and console inspection. */
window.__gallery = {
  get instance() { return inst(); },
  get definition() { return S.cur ? S.cur.def : null; },
  get selectedId() { return S.selectedId; },
  get filteredCount() { return S.filtered.length; },
  get renderedRows() { return S.rendered.size; },
  select: id => select(id),
  svgMarkup: () => svgMarkup(),
  pngSize: async () => (await pngBlob()).size,
};

main().catch(err => {
  console.error(err);
  $('totals').textContent = 'The catalogue could not be loaded.';
  showLoadError(err);
  $('empty').hidden = true;
  $('detail').hidden = false;
  document.body.dataset.ready = 'error';
});
