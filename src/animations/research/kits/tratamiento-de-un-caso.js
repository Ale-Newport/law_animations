/**
 * Case-treatment stage for the "Tratamiento de un caso" motif (LAW-0053..0056).
 *
 * Original research objects (no desk, no people):
 *  - biblioteca: a front-view bookcase; later resolutions are lever-arch
 *    binders standing between ordinary books. Each resolution binder carries
 *    a small luggage tag — the treatment label SUPPLIED by the author.
 *  - buscador: a search bar whose magnifier lifts out of its socket, scans
 *    the shelves, rests over each matching binder and returns.
 *  - ficha: a large ruled index card (the "treatment card") that is the
 *    support of the connection: the decision and the resolutions are pinned
 *    on it.
 *  - documento: the decision whose treatment is shown.
 *
 * Choreography primitives (entries own the timeline):
 *  found binder is pulled forward → flies along an arc to its slot on the
 *  card, turning from spine to cover → a pin fixes it → its tag rides the tip
 *  of a thread drawn from the resolution to the decision and hangs on it at a
 *  collision-free spot; the thread then lands on the decision's edge.
 *  Slots lie on a circle around the decision (equal distance, identical
 *  styling for every label): no hierarchy between treatments is drawn.
 *
 * Attachment rules exposed through semantics:
 *  - a tag tie point equals its binder's anchor while the binder is shelved,
 *    pulled or flying (`tagN` vs `anchorN`);
 *  - once riding, the tag tie point lies on the thread at the drawn tip;
 *  - the magnifier glass centre coincides with each visited binder's centre
 *    during its dwell (`mag` vs `magTarget`).
 * @module animations/research/kits/tratamiento-de-un-caso
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, quad, roundRectPath, polyline} from '../../../core/geometry.js';
import {FONTS} from '../../../core/text.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {str, list, obj} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Parameter fields (category "research": query, sources, citations,   */
/* dates). Citations and dates travel inside `decision` and each       */
/* `sources` item so a resolution's citation, date and label can never */
/* fall out of alignment.                                              */
/* ------------------------------------------------------------------ */

export const caseSource = obj('A later resolution (fictional) found in the library', {
  citation: str('Fictional identifier printed on its spine and cover, e.g. "R-21" (citation)', 28),
  date: str('Relative or fictional date printed on its cover, e.g. "Year 2"', 24),
  label: str('Treatment label SUPPLIED by the author; it hangs on the thread linking this resolution to the decision. Empty = no label supplied, so no link is drawn', 40),
}, ['citation', 'label']);

export const caseFields = {
  query: str('Text typed into the search box', 64),
  decision: obj('The decision whose treatment is shown (fictional)', {
    citation: str('Fictional citation printed on the decision', 28),
    title: str('Short title printed on the decision (wraps to two lines)', 60),
    date: str('Relative or fictional date printed on the decision', 24),
  }, ['citation']),
  sources: list('Later resolutions (2–4) in the order the search finds them; each carries its citation, date and supplied treatment label. Every label gets the same size, colour and distance to the decision: no hierarchy is drawn', caseSource, 2, 4),
};

export const caseObjectLabels = obj('Labels printed on the scene objects', {
  library: str('Plaque on the library bookcase', 48),
  card: str('Heading of the treatment index card', 56),
});

export const CASE_DEFAULTS = {
  query: 'D-104 · later resolutions',
  decision: {citation: 'D-104', title: 'Decision (fictional)', date: 'Year 1'},
  sources: [
    {citation: 'R-21', date: 'Year 2', label: 'Cites'},
    {citation: 'R-33', date: 'Year 3', label: 'Discusses'},
    {citation: 'R-47', date: 'Year 5', label: 'Distinguishes'},
  ],
  objectLabels: {library: 'Case library', card: 'Treatment card · D-104'},
};

export const CASE_DEFAULTS_ES = {
  locale: 'es',
  query: 'D-104 · resoluciones posteriores',
  decision: {citation: 'D-104', title: 'Resolución (ficticia)', date: 'Año 1'},
  sources: [
    {citation: 'R-21', date: 'Año 2', label: 'Cita'},
    {citation: 'R-33', date: 'Año 3', label: 'Comenta'},
    {citation: 'R-47', date: 'Año 5', label: 'Distingue'},
  ],
  objectLabels: {library: 'Biblioteca de casos', card: 'Ficha de tratamiento · D-104'},
};

export const CASE_LONG = {
  query: 'Decision D-104/2026 · all later resolutions that refer to it',
  decision: {citation: 'D-104/2026-B', title: 'Decision on the renewal of a fictional equipment lease', date: 'Year 1, month 4'},
  sources: [
    {citation: 'R-2026-000021', date: 'Year 2, month 11', label: 'Cites in a footnote'},
    {citation: 'R-2027-000033', date: 'Year 3, month 2', label: 'Discusses at length'},
    {citation: 'R-2029-000047', date: 'Year 5, month 7', label: 'Distinguishes on the facts'},
    {citation: 'R-2030-000058', date: 'Year 6, month 1', label: 'Mentions without discussion'},
  ],
  objectLabels: {library: 'Fictional case library — later resolutions', card: 'Treatment card for decision D-104/2026-B'},
};

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/** Canonical stage sizes (design units) by axis. */
export const CASE_STAGE = {horizontal: {w: 1760, h: 900}, square: {w: 1200, h: 1100}, vertical: {w: 900, h: 1400}, panelWide: {w: 1200, h: 900}, panelTall: {w: 760, h: 1020}, inspectSquare: {w: 1200, h: 1100}};

/**
 * Boxes are [x, y, w, h]. `arr` = where the resolution slots sit around the
 * decision ('left' arc or 'top' arc). `band` = free strip at the bottom of
 * the card reserved for editorial notes.
 */
const GEO = {
  horizontal: {search: [594, 18, 1136, 84], book: [30, 112, 516, 766], rows: 4, card: [594, 126, 1136, 752], arr: 'left',
    dec: [1548, 466, 290, 372], R: 690, cover: [224, 150], band: 100, tagMax: 260, tagSize: 30, mag: 50},
  // tag room is sized so the shared tag size stays >= ~20 px at 1080 (design scale ~0.73)
  square: {search: [348, 16, 828, 84], book: [24, 20, 300, 1064], rows: 5, card: [348, 116, 828, 968], arr: 'left',
    dec: [1048, 560, 204, 330], R: 580, cover: [196, 136], band: 100, tagMax: 276, tagSize: 31, mag: 50},
  vertical: {search: [24, 16, 852, 84], book: [24, 116, 852, 410], rows: 2, card: [24, 548, 852, 836], arr: 'left',
    dec: [735, 968, 230, 330], R: 590, cover: [204, 138], band: 100, tagMax: 250, tagSize: 29, mag: 50},
  // inspect (square): no library; the band above the card holds the lens
  inspectSquare: {search: [24, 16, 1152, 84], book: [24, 116, 1152, 330], rows: 2, card: [24, 470, 1152, 614], arr: 'left',
    dec: [1026, 820, 240, 330], R: 620, cover: [206, 128], band: 28, tagMax: 290, tagSize: 30, mag: 50},
  // compact stages for paired scenes (contrast): same objects, larger key text
  // (a 64-unit gutter between bookcase and card keeps a comparison guide in open space)
  panelWide: {search: [280, 10, 904, 74], book: [16, 14, 200, 870], rows: 4, card: [280, 98, 904, 786], arr: 'left',
    dec: [1068, 482, 196, 318], R: 680, cover: [180, 132], band: 0, tagMax: 330, tagSize: 34, mag: 46, font: 1.12},
  // square contrast panels: narrow covers and decision leave the tags room for ~20 px text
  panelTall: {search: [12, 10, 736, 74], book: [12, 96, 736, 320], rows: 2, card: [12, 434, 736, 576], arr: 'left',
    dec: [670, 740, 136, 280], R: 574, cover: [140, 112], band: 40, tagMax: 340, tagSize: 38, mag: 44, font: 1.18},
};

const DECOYS = 2;
const PAPER = '#fffdf8';
const CARD_BG = '#fbf6e8';
const CARD_RULE = '#c7d6e6';
const CARD_RED = '#dc9a92';
const BINDER = '#d6c7a0';
const TAG_FILL = '#fde7b0';
const STRING = '#7a5a3a';
const PIN = '#c8553d';
const BOOKS = ['#8c4a3c', '#3f5e5a', '#a2783e', '#56627a', '#7b5e7b', '#6b7d4a', '#9c7a54', '#44566a', '#b0654a', '#5d7a8a'];
const TAG_TIP = 20; // pointed end of a tag, before its hole
const TAG_LEAD = 14; // distance the tag slides along its thread from the cover edge
const TAG_GAP = 30; // straight thread left after a tag before the curve
/** scale of a tag while it hangs on a binder / cover (long tags hang smaller) */
const restScale = w => Math.min(0.45, 62 / Math.max(1, w - TAG_TIP + 8));
const EDGE = 12; // thickness of a binder seen edge-on while it turns

/** Binder placement tables: [row, fraction of the row width] per binder index. */
const PLACE = {
  3: [[0, 0.3], [1, 0.64], [2, 0.3], [0, 0.78], [2, 0.76], [1, 0.18], [1, 0.9]],
  4: [[0, 0.64], [1, 0.3], [2, 0.7], [3, 0.34], [1, 0.8], [2, 0.2], [3, 0.82]],
  5: [[0, 0.62], [1, 0.3], [2, 0.66], [3, 0.34], [4, 0.6], [1, 0.8], [3, 0.82]],
  2: [[0, 0.17], [1, 0.36], [0, 0.56], [1, 0.76], [1, 0.1], [0, 0.88], [1, 0.56]],
};

/**
 * Fit text without breaking a word in the middle: when the widest word does
 * not fit, shrink first (bounded by minSize), then wrap.
 */
function fitWhole(ctx, text, o) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const minSize = o.minSize ?? o.size * 0.72;
  const widest = Math.max(0, ...words.map(w => ctx.measure(w, o.size, o.weight ?? 400, o.family ?? 'sans')));
  const size = widest > o.maxWidth ? Math.max(minSize, (o.size * o.maxWidth) / widest) : o.size;
  return ctx.fit(text, {...o, size, minSize: Math.min(minSize, size)});
}
export {fitWhole};

/**
 * Fit an identifier such as "R-2026-000021": one line when it fits (bounded
 * shrink), otherwise it wraps AFTER a hyphen — never inside a number.
 */
export function fitCitation(ctx, text, o) {
  const one = fitWhole(ctx, text, {...o, maxLines: 1});
  if (!one.truncated || (o.maxLines ?? 2) < 2 || !/[-/]/.test(String(text))) return one;
  const f = fitWhole(ctx, String(text).replace(/([-/])(?=[^\s\-/])/g, '$1 '), o);
  const lines = f.lines.map(l => l.replace(/([-/]) /g, '$1'));
  const width = Math.max(...lines.map(l => ctx.measure(l, f.size, o.weight ?? 400, o.family ?? 'sans')));
  return {...f, lines, width, full: String(text)};
}

/**
 * Build a set of tags that all print at ONE text size: the smallest size any
 * of them needs at `size` (no tag is shrunk on its own — equal visual weight,
 * no hierarchy between treatment labels). `build(size)` returns an array of
 * tags (or nulls) exposing `textSize`.
 */
export function sharedSizeTags(build, size) {
  let s = size;
  let tags = build(s);
  for (let k = 0; k < 4; k++) {
    const need = Math.min(s, ...tags.filter(Boolean).map(t => t.textSize));
    if (need >= s - 0.01) break;
    s = need;
    tags = build(s);
  }
  return tags;
}

/**
 * Build the case-treatment stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix  unique node-name prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {string} o.query
 * @param {string} [o.placeholder]  grey text shown in the empty search box
 * @param {{citation:string,title?:string,date?:string}} o.decision
 * @param {Array<{citation:string,date?:string,label:string}>} o.sources  union of resolutions (tags are built for non-empty labels)
 * @param {{library:string, card:string}} o.objectLabels
 * @param {boolean} [o.withLibrary=true]  false: no bookcase / binders in the library (inspect context)
 * @param {number[]} [o.visit]  union indices the magnifier visits, in order (default: all)
 * @param {{target:'label'|'date'|'citation', index:number, before:string, after:string}} [o.swap]
 * @param {string} [o.seedKey]  shared seed for identical libraries in paired scenes
 */
export function caseStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = GEO[o.axis];
  const {w: W, h: H} = CASE_STAGE[o.axis];
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const withLib = o.withLibrary !== false;
  const src = o.sources;
  const n = src.length;
  const seedKey = o.seedKey || 'case-lib';
  const box = a => ({x: a[0], y: a[1], w: a[2], h: a[3]});
  const S = box(G.search), B = box(G.book), C = box(G.card);
  const D = {cx: G.dec[0], cy: G.dec[1], w: G.dec[2], h: G.dec[3]};
  const decBox = {x: D.cx - D.w / 2, y: D.cy - D.h / 2, w: D.w, h: D.h};
  const [cw, chh0] = G.cover;
  const swap = o.swap || null;

  /* ---------- card (ficha) ---------- */
  const fs = G.font || 1;
  const card = treatmentCard(ctx, P, C, o.objectLabels.card, fs);
  const bandTop = C.y + C.h - G.band;

  /* ---------- slots on a circle around the decision (equal distance) ---------- */
  // Cover height adapts to the number of resolutions so covers never overlap.
  const avail = bandTop - 12 - (card.headerBottom + 26);
  const chh = n > 1 ? Math.min(chh0, (avail - 18 * (n - 1)) / n) : chh0;
  const slotsTopDown = [];
  {
    const yMin = card.headerBottom + 26 + chh / 2, yMax = bandTop - 12 - chh / 2;
    const sp = n > 1 ? Math.min(chh + 70, (yMax - yMin) / (n - 1)) : 0;
    const half = (sp * (n - 1)) / 2;
    const yc = clamp(D.cy, yMin + half, yMax - half);
    for (let i = 0; i < n; i++) {
      const y = yc + (i - (n - 1) / 2) * sp;
      const x = D.cx - Math.sqrt(Math.max(0, G.R * G.R - (y - D.cy) ** 2));
      slotsTopDown.push({x, y});
    }
  }
  // Fill order: when the library stands ABOVE the card (portrait stages) the
  // column is filled from the bottom up, so a resolution carried down from the
  // shelves never has to pass an already pinned cover. Beside the card
  // (landscape / square) it is filled top-down and flights approach level.
  const libAbove = withLib && B.y + B.h <= C.y;
  const flightOrder = (o.visit || src.map((_, i) => i)).filter(i => i < n);
  const rank = src.map((_, i) => i);
  if (libAbove) {
    const order = [...flightOrder, ...src.map((_, i) => i).filter(i => !flightOrder.includes(i))];
    order.forEach((i, k) => { rank[i] = n - 1 - k; });
  }
  const slots = src.map((_, i) => slotsTopDown[rank[i]]);
  const coverBox = i => ({x: slots[i].x - cw / 2, y: slots[i].y - chh / 2, w: cw, h: chh});

  /* ---------- decision document ---------- */
  const dec = decisionDoc(ctx, `${P}-dec`, D, o.decision, fs);

  /* ---------- tags (supplied labels) ---------- */
  // Every tag is built at the same size (the largest that fits the layout):
  // equal visual weight, no hierarchy between treatments.
  const buildTags = size => src.map((s, i) => {
    const label = s.label || '';
    if (!label && !(swap && swap.target === 'label' && swap.index === i)) return null;
    const before = swap && swap.target === 'label' && swap.index === i ? swap.before : label;
    const after = swap && swap.target === 'label' && swap.index === i ? swap.after : null;
    return makeTag(ctx, `${P}-t${i}`, before, after, {size, maxWidth: G.tagMax});
  });
  const coverRight = i => slots[i].x + cw / 2;
  let tags = null;
  // tags of neighbouring slots must not touch either (long labels wrap to more lines)
  const ys = slots.map(q => q.y).sort((a, b) => a - b);
  const spacing = ys.length > 1 ? Math.min(...ys.slice(1).map((y, i) => y - ys[i])) : Infinity;
  for (const k of [1, 0.9, 0.8, 0.72]) {
    tags = sharedSizeTags(buildTags, Math.round(G.tagSize * k));
    const room = Math.min(...src.map((_, i) => decBox.x - coverRight(i) - 36));
    if (tags.every(t => !t || (t.maxW + TAG_GAP <= room && t.H <= spacing - 10))) break;
  }

  /* ---------- threads (plain relation: no arrowhead) ---------- */
  // Ports are evenly spaced on the decision's facing edge in the slots'
  // top-to-bottom order. Each thread leaves its cover horizontally (the tag
  // rides this straight part) and then curves into its port, so threads never
  // cross and tags never collide.
  const m = Math.min(D.h * 0.2, 70);
  const ports = src.map((_, i) => ({x: decBox.x - 4, y: n > 1 ? decBox.y + m + (rank[i] * (D.h - 2 * m)) / (n - 1) : D.cy}));
  const threads = src.map((s, i) => {
    const from = {x: coverRight(i) + 2, y: slots[i].y};
    const tw = tags[i] ? tags[i].maxW : 0;
    const straight = Math.max(24, Math.min(tw + TAG_GAP, ports[i].x - from.x - 36));
    return threadLine(ctx, `${P}-th${i}`, from, from.x + straight, ports[i]);
  });
  const tagSpots = src.map((s, i) => {
    const tg = tags[i];
    if (!tg) return null;
    const hole = {x: threads[i].from.x + TAG_TIP + TAG_LEAD, y: threads[i].from.y};
    return {t: (TAG_TIP + TAG_LEAD) / threads[i].total, x: hole.x, y: hole.y, box: tg.boxAt(hole, 0, tg.maxW)};
  });

  /* ---------- library ---------- */
  let lib = null;
  const binders = [];
  if (withLib) {
    lib = bookcase(ctx, P, B, G.rows, n + DECOYS, o.objectLabels.library, seedKey);
    for (let i = 0; i < n + DECOYS; i++) binders.push(lib.binders[i]);
  }

  /* ---------- resolution pieces: spine (in the library) + cover (on the card) ---------- */
  const sp0 = binders[0] || {w: 64, h: 120};
  const spineW = sp0.w, spineH = sp0.h;
  const spineAnchorY = -spineH / 2 + 12;
  // On the cover the tag hangs from the point where its thread will start
  // (the cover edge facing the decision), so it never hides the citation.
  const coverAnchor = i => ({x: threads[i].from.x - 2 - slots[i].x, y: threads[i].from.y - slots[i].y});
  const pieces = src.map((s, i) => {
    const swapCit = swap && swap.index === i && swap.target === 'citation' ? swap : null;
    const swapDate = swap && swap.index === i && swap.target === 'date' ? swap : null;
    const cover = coverNode(ctx, `${P}-cv${i}`, cw, chh, swapCit ? swapCit.before : s.citation, swapDate ? swapDate.before : (s.date || ''), {
      citAfter: swapCit ? swapCit.after : null, dateAfter: swapDate ? swapDate.after : null,
    }, fs);
    const gw = tags[i] ? tags[i].W : 150;
    const ghostCv = tagGhost(ctx, `${P}-b${i}-cvghost`, gw, {x: coverAnchor(i).x + TAG_TIP + TAG_LEAD, y: coverAnchor(i).y}, 0, 0.85);
    const spine = withLib ? spineNode(ctx, `${P}-b${i}`, spineW, spineH, s.citation, true) : null;
    // on the (small) spine the dashed outline is drawn with a heavier stroke so it stays readable
    const ghostSp = withLib ? tagGhost(ctx, `${P}-b${i}-ghost`, gw, {x: 0, y: spineAnchorY}, 90, restScale(gw), null, 46, 8) : null;
    const node = g({name: `${P}-b${i}`, transform: withLib ? T(binders[i].x, binders[i].y) : T(slots[i].x, slots[i].y)},
      withLib ? g({name: `${P}-b${i}-sp`}, spine, ghostSp) : null,
      g({name: `${P}-b${i}-cv`, transform: withLib ? 'scale(0 1)' : null}, cover.node, ghostCv),
    );
    return {node, cover};
  });
  const decoys = withLib ? binders.slice(n).map((b, j) => g({transform: T(b.x, b.y)}, spineNode(ctx, null, b.w, b.h, '', false, `${seedKey}-d${j}`))) : [];
  const pinAt = i => ({x: slots[i].x - cw / 2 + 12, y: slots[i].y - chh / 2 + 14});

  /* ---------- flight paths (solved once per layout) ---------- */
  // Each resolution flies on a quadratic arc from its shelf to its slot. The
  // control point is chosen so the moving piece (spine, then cover) never
  // passes over a cover pinned before it, the card heading or the decision.
  const flights = [];
  const flightClear = [];
  if (withLib) {
    const obstaclesFor = i => {
      const before = flightOrder.slice(0, Math.max(0, flightOrder.indexOf(i)));
      return [...before.map(coverBox), card.titleBox, decBox].filter(b => b && b.w > 0);
    };
    for (let i = 0; i < n; i++) {
      const p0 = {x: binders[i].x, y: binders[i].y - 8};
      const p2 = slots[i];
      const mid = mix(p0, p2, 0.5);
      const d = Math.hypot(p2.x - p0.x, p2.y - p0.y);
      // sideways travel arcs over the gap; mostly-downward travel drops out
      // of the shelf first and glides into the slot
      const natural = Math.abs(p2.y - p0.y) > Math.abs(p2.x - p0.x)
        ? {x: p0.x, y: lerp(p0.y, p2.y, 0.7)}
        : {x: mid.x, y: Math.min(p0.y, p2.y) - d * 0.22};
      const cands = [natural];
      for (const fy of [0.5, 0.8, 1, 1.15, 0.3, 0]) for (const fx of [0.5, 0.35, 0.65, 0.15, 0.85]) cands.push({x: lerp(p0.x, p2.x, fx), y: lerp(p0.y, p2.y, fy)});
      const obs = obstaclesFor(i);
      let best = null;
      for (const p1 of cands) {
        const hit = flightOverlap({p0, p1, p2, spineW, spineH, cw, chh}, obs);
        if (!best || hit < best.hit - 1e-6) best = {p1, hit};
        if (hit === 0) break;
      }
      flights.push({p0, p1: best.p1, p2});
      flightClear.push(best.hit === 0);
    }
  }
  const pins = src.map((_, i) => g({name: `${P}-pin${i}`, opacity: withLib ? 0 : 1, transform: T(pinAt(i).x, pinAt(i).y)}, pinNode()));

  /* ---------- search bar + magnifier ---------- */
  const bar = searchBar(ctx, P, S, o.query, o.placeholder, fs);
  const magR = G.mag;
  const mag = magnifierNode(ctx, `${P}-mag`, magR);
  const socket = bar.socket;
  const MAG_REST = (S.h * 0.36) / magR;

  const visit = (o.visit || src.map((_, i) => i)).filter(i => i < n);
  const wps = withLib ? [socket, ...visit.map(i => ({x: binders[i].x, y: binders[i].y})), socket] : [socket, socket];

  /* ---------- node tree ---------- */
  const node = g({name: P},
    lib && lib.node,
    card.node,
    threads.map(t => t.node),
    dec.node,
    decoys,
    pieces.map(p => p.node),
    pins,
    tags.map(t => t && t.node),
    bar.node,
    mag,
  );

  /** world point of a local point on a binder posed at c (rot deg, scale sc) */
  const local2world = (c, rot, sc, lp) => {
    const a = (rot * Math.PI) / 180;
    return {x: c.x + (lp.x * Math.cos(a) - lp.y * Math.sin(a)) * sc, y: c.y + (lp.x * Math.sin(a) + lp.y * Math.cos(a)) * sc};
  };

  /** magnifier pose for m ∈ [0, visits+1] (integer part = leg) */
  function magAt(m) {
    const k = wps.length - 1;
    const mm = clamp(m, 0, k);
    const j = Math.min(k - 1, Math.floor(mm));
    const f = ease.inOutSine(mm - j);
    const a = wps[j], b = wps[j + 1];
    const mid = mix(a, b, 0.5);
    const lift = Math.min(90, Math.hypot(b.x - a.x, b.y - a.y) * 0.18);
    const p = quad(a, {x: mid.x, y: mid.y - lift}, b, f);
    const out = ease.inOutCubic(seg(mm, 0, 0.4));
    const back = ease.inOutCubic(seg(mm, k - 0.4, k));
    const sc = lerp(MAG_REST, 1, out * (1 - back));
    return {x: p.x, y: p.y, scale: sc, visiting: mm >= 1 && mm <= k - 1 && Math.abs(mm - Math.round(mm)) < 1e-9 ? visit[Math.round(mm) - 1] : null};
  }

  /**
   * Pose the stage from action values (arrays indexed by union source index).
   * Optional: `present` (0 = the binder is not in the library, 0→1 = it is put
   * onto its shelf), `pop` (0→1 = the shelved binder is pulled forward so a
   * local change on it reads), `tagAway` (true = a fading tag unties, grows and
   * lifts well clear of its binder instead of a short fade).
   * @param {{type:number, mag:number, found:number[], pull:number[], fly:number[], pin:number[], thread:number[], tagVis?:number[], ghost?:number[], swap?:number, present?:number[], pop?:number[], tagAway?:boolean}} s
   */
  function pose(s) {
    const nodes = {};
    const reduced = ctx.reduced;
    const semantic = {};
    const at = (arr, i, d = 0) => (arr && arr[i] !== undefined ? arr[i] : d);

    Object.assign(nodes, bar.frame(s.type));

    // magnifier
    const mp = magAt(s.mag || 0);
    nodes[`${P}-mag`] = {transform: T(mp.x, mp.y, 0, mp.scale)};
    semantic.mag = {x: r(mp.x), y: r(mp.y)};
    semantic.magOut = mp.scale > MAG_REST + 0.01;
    semantic.magVisiting = mp.visiting;

    const states = [];
    const threadP = [];
    let edgeGap = 0;
    for (let i = 0; i < n; i++) {
      const pull = at(s.pull, i), fly = at(s.fly, i), found = at(s.found, i);
      let c, sc = 1, rot = 0, spX = 1, cvX = 0, flipT = 0;
      if (!withLib) {
        c = {x: slots[i].x, y: slots[i].y};
        spX = 0; cvX = 1; flipT = 1;
      } else if (fly > 0) {
        // solved arc (clear of earlier covers); turns from spine to cover on the way
        ({c, sc, rot, spX, cvX} = flightPose({...flights[i], spineW, cw}, fly, reduced));
        flipT = seg(fly, 0.2, 0.8);
      } else {
        const e = ease.inOutCubic(pull);
        c = {x: binders[i].x, y: binders[i].y - 8 * e};
        sc = 1 + 0.08 * e;
        // pulled forward for a local change (pop), or put onto the shelf (present)
        const pp = ease.inOutSine(clamp(at(s.pop, i)));
        const pr = clamp(at(s.present, i, 1));
        const ep = ease.outCubic(pr);
        c = {x: c.x, y: c.y - 14 * pp + 70 * (1 - ep)};
        sc *= (1 + 0.55 * pp) * (1 + 0.45 * (1 - ep));
      }
      const presentI = withLib ? clamp(at(s.present, i, 1)) : 1;
      nodes[`${P}-b${i}`] = {transform: T(c.x, c.y, rot, sc), opacity: r(clamp(presentI * 3), 3)};
      if (withLib) {
        nodes[`${P}-b${i}-sp`] = {transform: `scale(${r(Math.max(spX, 0.0001), 4)} 1)`, opacity: spX > 0.001 ? 1 : 0};
        nodes[`${P}-b${i}-cv`] = {transform: `scale(${r(Math.max(cvX, 0.0001), 4)} 1)`, opacity: cvX > 0.001 ? 1 : 0};
        nodes[`${P}-b${i}-hl`] = {opacity: r(clamp(found) * (1 - seg(fly, 0.05, 0.3)), 3)};
        nodes[`${P}-b${i}-ghost`] = {opacity: r(at(s.ghost, i), 3)};
      }
      nodes[`${P}-b${i}-cvghost`] = {opacity: r(at(s.ghost, i) * (withLib ? (cvX > 0.5 ? 1 : 0) : 1), 3)};
      const pinP = withLib ? at(s.pin, i) : 1;
      nodes[`${P}-pin${i}`] = {opacity: r(clamp(pinP * 3), 3), transform: T(pinAt(i).x, pinAt(i).y - 34 * (1 - ease.outCubic(pinP)))};

      // the tie point slides to the cover edge while the piece is edge-on
      // (mid-turn); its x follows the CURRENT width of the turning piece so
      // the tag never floats beside a cover that is still narrow
      const ca = coverAnchor(i);
      const k = ease.inOutSine(seg(flipT, 0.25, 0.75));
      const edgeK = !withLib || fly >= 1 ? 1 : fly >= 0.5 ? cvX : fly > 0 ? (EDGE / cw) * ease.inOutSine(seg(fly, 0.35, 0.5)) : 0;
      const anchor = local2world(c, rot, sc, {x: ca.x * edgeK, y: lerp(spineAnchorY, ca.y, k)});
      semantic[`res${i}`] = {x: r(c.x), y: r(c.y)};
      semantic[`anchor${i}`] = {x: r(anchor.x), y: r(anchor.y)};
      // while the cover is turning, the tie point stays on its CURRENT edge
      if (withLib && fly >= 0.5 && fly < 1) edgeGap = Math.max(edgeGap, Math.abs(ca.x * edgeK - (cw * cvX) / 2 - (ca.x - cw / 2) * cvX));

      // thread + tag
      const tg = tags[i];
      const thr = at(s.thread, i);
      const lead = seg(thr, 0, 0.18);
      const draw = seg(thr, 0.18, 1);
      const p = ease.inOutSine(draw);
      Object.assign(nodes, threads[i].frame(p, p > 0 ? 1 : 0));
      threadP.push(r(p, 3));
      let state = presentI <= 0 ? 'absent' : 'shelf';
      if (!withLib) state = thr >= 1 ? 'linked' : 'placed';
      else if (fly >= 1) state = p >= 1 ? 'linked' : 'placed';
      else if (fly > 0) state = 'flying';
      else if (pull > 0) state = 'pulled';
      else if (found > 0) state = 'found';
      states.push(state);
      if (tg) {
        // hangs vertically from its binder/cover; swings up onto the thread
        // while riding its tip; settles along the thread at its spot
        const spot = tagSpots[i];
        const rest = restScale(tg.maxW);
        let pos, scale, ang;
        if (thr <= 0) {
          pos = anchor;
          scale = rest * sc;
          ang = 90 + rot;
        } else if (draw <= 0) {
          pos = mix(anchor, threads[i].from, ease.inOutSine(lead));
          scale = rest;
          ang = 90;
        } else {
          // rides the tip onto the straight part, swinging up from hanging to level
          const q = Math.min(p, spot.t);
          const k2 = clamp(q / spot.t);
          pos = threads[i].at(q);
          scale = lerp(rest, 1, ease.inOutSine(k2));
          ang = lerp(90, 0, ease.inOutCubic(k2));
          if (p > spot.t && !reduced) {
            const x = (p - spot.t) / (1 - spot.t);
            ang += 4 * Math.sin(x * Math.PI * 3) * (1 - x);
          }
        }
        const vis = clamp(at(s.tagVis, i, 1)) * presentI;
        let lift = -30 * (1 - vis);
        let opac = vis;
        if (s.tagAway && thr <= 0 && vis < 1) {
          // untied: the tag swings level, grows and rises well clear of the binder, then fades
          const a = 1 - vis;
          const grow = ease.inOutSine(seg(a, 0, 0.45));
          lift = -170 * ease.inOutSine(seg(a, 0.2, 1));
          ang = lerp(ang, 0, grow);
          scale *= 1 + 1.4 * grow;
          opac = 1 - seg(a, 0.6, 1);
        }
        nodes[`${P}-t${i}`] = {transform: T(pos.x, pos.y + lift, ang, scale), opacity: r(opac, 3)};
        Object.assign(nodes, tg.frame(clamp((scale - 0.78) / 0.18), s.swap || 0));
        semantic[`tag${i}`] = {x: r(pos.x), y: r(pos.y + lift)};
        semantic[`tagVis${i}`] = r(opac, 3);
        semantic[`tagSpot${i}`] = {x: r(spot.x), y: r(spot.y)};
        semantic[`tagOnSpot${i}`] = p >= spot.t - 1e-6 && thr > 0;
      }
    }
    // cover-text substitution (inspect): old value lifts out before the new one settles in
    if (swap && (swap.target === 'citation' || swap.target === 'date')) {
      const key = swap.target === 'citation' ? 'cit' : 'date';
      const sp = clamp(s.swap || 0);
      const outP = clamp(sp * 2), inP = clamp(sp * 2 - 1);
      nodes[`${P}-cv${swap.index}-${key}0`] = {opacity: r(1 - outP, 3), transform: `translate(0 ${r(-12 * outP)})`};
      nodes[`${P}-cv${swap.index}-${key}1`] = {opacity: r(inP, 3), transform: `translate(0 ${r(12 * (1 - inP))})`};
    }
    if (swap && swap.target === 'label' && tags[swap.index]) {
      const tg = tags[swap.index];
      semantic.swapTagWidth = r(lerp(tg.W, tg.W1, ease.inOutSine(clamp((s.swap || 0) * 2))), 1);
    }
    semantic.slotRadius = slots.map(q => r(Math.hypot(q.x - D.cx, q.y - D.cy), 1));
    // every flight path is clear of earlier pinned covers, the heading and the decision
    semantic.flightsClear = flightClear.every(Boolean);
    semantic.tagEdgeGap = r(edgeGap, 2);
    // one text size for every treatment label (no hierarchy)
    semantic.tagTextSizes = tags.map(t => (t ? r(t.textSize, 2) : null));
    semantic.states = states;
    semantic.threadP = threadP;
    semantic.linked = states.filter(x => x === 'linked').length;
    semantic.queryTyped = r(clamp(s.type), 3);
    return {nodes, semantic};
  }

  /** points annotations / guides can target (stage coordinates) */
  const points = {
    decision: {x: decBox.x + decBox.w * 0.5, y: decBox.y + decBox.h - 10},
    library: lib ? lib.plaquePoint : {x: S.x + 40, y: S.y + S.h},
    search: {x: S.x + S.w * 0.35, y: S.y + S.h},
    tag: i => (tagSpots[i] ? {x: tagSpots[i].box.x + tagSpots[i].box.w / 2, y: tagSpots[i].box.y + tagSpots[i].box.h - 4} : {x: slots[i].x, y: slots[i].y + chh / 2}),
    cover: i => ({x: slots[i].x, y: slots[i].y}),
    /** box around a resolution's cover and its (possible) tag: the changed detail */
    link: i => {
      const cb = coverBox(i);
      const tb = tags[i] ? tagSpots[i].box : {x: cb.x + cb.w + TAG_LEAD, y: cb.y + cb.h / 2 - 23, w: 150, h: 46};
      const x0 = Math.min(cb.x, tb.x), y0 = Math.min(cb.y, tb.y);
      return {x: x0, y: y0, w: Math.max(cb.x + cb.w, tb.x + tb.w) - x0, h: Math.max(cb.y + cb.h, tb.y + tb.h) - y0};
    },
  };

  return {
    node, pose, W, H, axis: o.axis, G,
    slots, coverBox, cover: {w: cw, h: chh}, decBox, card: C, cardHeaderBottom: card.headerBottom, bandTop,
    threads, tags, tagSpots, binders, search: S, book: B, points, rank, flights, libAbove,
    status: {x: D.cx, bottom: decBox.y - 14, top: card.headerBottom + 8, maxWidth: Math.min(D.w + 90, 2 * (C.x + C.w - 14 - D.cx))},
    titleBox: card.titleBox,
    magRest: MAG_REST,
    visits: visit,
  };
}

/* ------------------------------------------------------------------ */
/* Art                                                                  */
/* ------------------------------------------------------------------ */

/** The ficha: a ruled index card taped to the wall, heading on a red rule. */
function treatmentCard(ctx, P, C, heading, fs = 1, headFrac = 0.6) {
  const th = ctx.theme;
  const headSize = 32 * fs;
  const headerBottom = C.y + 84;
  const rules = [];
  for (let y = headerBottom + 50; y < C.y + C.h - 26; y += 50) rules.push(h('line', {x1: C.x + 14, x2: C.x + C.w - 14, y1: y, y2: y, stroke: CARD_RULE, 'stroke-width': 2}));
  let title = null;
  // Heading on the right of the header row: resolutions enter the card from
  // the left, so their flight never crosses the heading text.
  const tx = C.x + C.w - 30;
  let titleBox = {x: tx, y: C.y + 18, w: 0, h: 0};
  if (ctx.show('key') && heading) {
    const f = ctx.fit(heading, {maxWidth: C.w * headFrac, size: headSize, minSize: 22, maxLines: 2, weight: 700});
    const ty = C.y + (headerBottom - C.y - f.height) / 2 - 2;
    title = textBlock(f, {x: tx, y: ty, anchor: 'end', fill: th.ink, name: `${P}-card-title`});
    titleBox = {x: tx - f.width, y: ty, w: f.width, h: f.height};
  } else {
    rules.push(h('rect', {x: tx - C.w * 0.3, y: C.y + 32, width: C.w * 0.3, height: 16, rx: 8, fill: '#d9cdb4'}));
  }
  const tape = (x, y, rot) => h('rect', {x: -46, y: -15, width: 92, height: 30, rx: 3, fill: '#efe3bd', opacity: 0.85, stroke: '#cbbd93', 'stroke-width': 1.5, transform: T(x, y, rot)});
  const node = g({name: `${P}-card`},
    h('path', {d: roundRectPath(C.x + 8, C.y + 12, C.w, C.h, 20), fill: th.shadow}),
    h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, 20), fill: CARD_BG, stroke: th.ink, 'stroke-width': th.stroke}),
    rules,
    h('line', {x1: C.x + 14, x2: C.x + C.w - 14, y1: headerBottom, y2: headerBottom, stroke: CARD_RED, 'stroke-width': 3.5}),
    h('ellipse', {cx: C.x + C.w / 2, cy: C.y + C.h - 26, rx: 13, ry: 11, fill: shade(CARD_BG, -0.25), stroke: th.ink, 'stroke-width': 2}),
    tape(C.x + 34, C.y + 6, -24),
    tape(C.x + C.w - 34, C.y + 6, 24),
    title,
  );
  return {node, headerBottom, titleBox};
}

/** The decision: a sheet with a neutral emblem, citation, title, date and numbered paragraphs. */
function decisionDoc(ctx, name, D, decision, fs = 1) {
  const th = ctx.theme;
  const {w, h: hh} = D;
  const x0 = -w / 2, y0 = -hh / 2;
  const pad = w * 0.1;
  const fold = w * 0.12;
  const parts = [
    h('path', {d: roundRectPath(x0 + 7, y0 + 10, w, hh, 6), fill: th.shadow}),
    h('path', {d: `M${x0} ${y0 + 4}Q${x0} ${y0} ${x0 + 4} ${y0}H${r(x0 + w - fold)}L${x0 + w} ${r(y0 + fold)}V${y0 + hh - 4}Q${x0 + w} ${y0 + hh} ${x0 + w - 4} ${y0 + hh}H${x0 + 4}Q${x0} ${y0 + hh} ${x0} ${y0 + hh - 4}Z`, fill: PAPER, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x0 + w - fold)} ${y0}V${r(y0 + fold * 0.85)}Q${r(x0 + w - fold)} ${r(y0 + fold)} ${r(x0 + w - fold * 0.85)} ${r(y0 + fold)}H${x0 + w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
  ];
  // neutral emblem (abstract, not a real seal)
  const ey = y0 + 40;
  parts.push(h('circle', {cx: 0, cy: ey, r: 20, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5}));
  parts.push(h('circle', {cx: 0, cy: ey, r: 13, fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.5}));
  parts.push(h('path', {d: `M0 ${ey - 7}L7 ${ey}L0 ${ey + 7}L-7 ${ey}Z`, fill: th.inkSoft}));
  let y = ey + 32;
  const inner = w - pad * 2;
  if (ctx.show('key') && decision.citation) {
    // a long citation wraps after a hyphen or slash instead of being cut
    const f = fitCitation(ctx, decision.citation, {maxWidth: inner, size: 34 * fs, minSize: 20, maxLines: 2, weight: 700, family: 'mono'});
    parts.push(textBlock(f, {x: 0, y, anchor: 'middle', fill: th.ink, name: `${name}-cit`}));
    y += f.height + 12;
  } else {
    parts.push(h('rect', {x: -inner * 0.3, y: y + 4, width: inner * 0.6, height: 22, rx: 5, fill: th.ink, opacity: 0.85}));
    y += 42;
  }
  if (ctx.show('all') && decision.title) {
    const f = fitWhole(ctx, decision.title, {maxWidth: inner, size: 24 * fs, minSize: 17, maxLines: 4, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x: 0, y, anchor: 'middle', fill: th.ink}));
    y += f.height + 8;
  } else {
    parts.push(h('rect', {x: -inner * 0.36, y: y + 2, width: inner * 0.72, height: 14, rx: 5, fill: th.inkSoft, opacity: 0.6}));
    y += 26;
  }
  if (ctx.show('all') && decision.date) {
    const f = ctx.fit(decision.date, {maxWidth: inner, size: 22 * fs, minSize: 15, maxLines: 1, weight: 500});
    parts.push(textBlock(f, {x: 0, y, anchor: 'middle', fill: th.inkSoft}));
    y += f.height + 12;
  } else y += 14;
  parts.push(h('line', {x1: x0 + pad, x2: x0 + w - pad, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 2}));
  y += 16;
  // numbered paragraphs: a small marker + text bars
  const bar = Math.max(6, w * 0.024);
  let k = 0;
  while (y + bar * 3 < y0 + hh - pad * 0.8) {
    parts.push(h('rect', {x: x0 + pad, y, width: bar * 1.6, height: bar * 1.6, rx: 2, fill: th.paperLine}));
    const rows = 2;
    for (let b = 0; b < rows; b++) {
      const lw = inner - bar * 2.6 - (b === rows - 1 ? inner * (0.2 + 0.25 * ctx.rng('case-dec-l', k)) : 0);
      parts.push(h('rect', {x: x0 + pad + bar * 2.6, y: y + b * bar * 2.1, width: r(lw), height: bar, rx: bar / 2, fill: th.paperLine}));
    }
    y += bar * 5.4;
    k++;
  }
  const node = g({name, transform: T(D.cx, D.cy)}, parts, g({transform: T(0, y0 + 12)}, pinNode()));
  return {node};
}

/** Resolution cover (seen once the binder has turned). Local origin = centre. */
function coverNode(ctx, name, w, hh, citation, date, alt = {}, fs = 1) {
  const th = ctx.theme;
  const x0 = -w / 2, y0 = -hh / 2;
  const band = 24;
  const pad = 14;
  const inner = w - band - pad * 2;
  const tx = x0 + band + pad;
  const parts = [
    h('path', {d: roundRectPath(x0 + 5, y0 + 8, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 8), fill: PAPER, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: `M${x0 + 8} ${y0}H${x0 + band}V${y0 + hh}H${x0 + 8}Q${x0} ${y0 + hh} ${x0} ${y0 + hh - 8}V${y0 + 8}Q${x0} ${y0} ${x0 + 8} ${y0}Z`, fill: BINDER, stroke: th.ink, 'stroke-width': th.stroke}),
    h('circle', {cx: x0 + band / 2, cy: y0 + hh * 0.72, r: 5, fill: shade(BINDER, -0.45)}),
  ];
  const citY = y0 + 18;
  const texts = [];
  const citSize = 30 * fs;
  let citH = citSize;
  if (ctx.show('key') && citation) {
    const cfit = t => fitCitation(ctx, t, {maxWidth: inner, size: citSize, minSize: 20, maxLines: 2, weight: 700, family: 'serif', leading: 1.05});
    const f1 = cfit(citation);
    const f1b = alt.citAfter ? cfit(alt.citAfter) : null;
    citH = Math.max(f1.height, f1b ? f1b.height : 0);
    texts.push(textBlock(f1, {x: tx, y: citY, fill: th.ink, name: alt.citAfter ? `${name}-cit0` : undefined}));
    if (f1b) texts.push(textBlock(f1b, {x: tx, y: citY, fill: th.accent2, name: `${name}-cit1`, opacity: 0}));
  } else {
    parts.push(h('rect', {x: tx, y: citY + 4, width: inner * 0.62, height: 20, rx: 5, fill: th.ink, opacity: 0.85, name: alt.citAfter ? `${name}-cit0` : undefined}));
    if (alt.citAfter) parts.push(h('rect', {x: tx, y: citY + 4, width: inner * 0.8, height: 20, rx: 5, fill: th.accent2, opacity: 0, name: `${name}-cit1`}));
  }
  const dateY = citY + citH + 10;
  if (ctx.show('all') && (date || alt.dateAfter)) {
    const f2 = fitWhole(ctx, date || '', {maxWidth: inner, size: 23 * fs, minSize: 16, maxLines: 1, weight: 500});
    texts.push(textBlock(f2, {x: tx, y: dateY, fill: th.inkSoft, name: alt.dateAfter ? `${name}-date0` : undefined}));
    if (alt.dateAfter) {
      const f2b = fitWhole(ctx, alt.dateAfter, {maxWidth: inner, size: 23 * fs, minSize: 16, maxLines: 1, weight: 600});
      texts.push(textBlock(f2b, {x: tx, y: dateY, fill: th.accent2, name: `${name}-date1`, opacity: 0}));
    }
  } else {
    parts.push(h('rect', {x: tx, y: dateY + 4, width: inner * 0.4, height: 12, rx: 5, fill: th.inkSoft, opacity: 0.5, name: alt.dateAfter ? `${name}-date0` : undefined}));
    if (alt.dateAfter) parts.push(h('rect', {x: tx, y: dateY + 4, width: inner * 0.55, height: 12, rx: 5, fill: th.accent2, opacity: 0, name: `${name}-date1`}));
  }
  const barY = dateY + 34;
  for (let b = 0; b < 2 && barY + b * 16 + 7 < y0 + hh - 10; b++) parts.push(h('rect', {x: tx, y: barY + b * 16, width: inner * (b ? 0.55 : 0.9), height: 7, rx: 3.5, fill: th.paperLine}));
  return {node: g(null, parts, texts)};
}

/** Lever-arch binder spine standing on a shelf. Local origin = centre. */
function spineNode(ctx, name, w, hh, citation, withHighlight, seed) {
  const th = ctx.theme;
  const x0 = -w / 2, y0 = -hh / 2;
  const parts = [];
  if (withHighlight) {
    parts.push(h('path', {name: `${name}-hl`, d: roundRectPath(x0 - 9, y0 - 9, w + 18, hh + 18, 12), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 5, opacity: 0}));
  }
  parts.push(h('path', {d: roundRectPath(x0, y0, w, hh, 5), fill: BINDER, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('line', {x1: x0 + 5, x2: x0 + w - 5, y1: y0 + 7, y2: y0 + 7, stroke: shade(BINDER, -0.2), 'stroke-width': 3}));
  // label window in the lower half
  const lx = x0 + w * 0.2, lw = w * 0.6;
  const ly = y0 + hh * 0.5, lh = hh * 0.33;
  parts.push(h('rect', {x: lx, y: ly, width: lw, height: lh, rx: 3, fill: '#fffdf6', stroke: shade(BINDER, -0.4), 'stroke-width': 1.5}));
  if (citation && ctx.show('all')) {
    const f = ctx.fit(citation, {maxWidth: lh - 8, size: Math.min(22, lw * 0.62), minSize: 12, maxLines: 1, weight: 700, family: 'sans'});
    parts.push(g({transform: `translate(${r(0)} ${r(ly + lh / 2)}) rotate(-90)`}, textBlock(f, {x: 0, y: -f.size * 0.42, anchor: 'middle', fill: th.ink})));
  } else {
    const k = seed ? ctx.rng(seed) : 0.5;
    parts.push(h('rect', {x: -lw * 0.18, y: ly + 6, width: lw * 0.36, height: lh * (0.5 + 0.3 * k), rx: 3, fill: th.paperLine}));
  }
  // finger ring
  parts.push(h('circle', {cx: 0, cy: y0 + hh * 0.9, r: Math.min(8, w * 0.13), fill: shade(BINDER, -0.5), stroke: th.ink, 'stroke-width': 1.5}));
  return g(null, parts);
}

/**
 * A plain-relation thread (no arrowhead): straight out of the cover to x1,
 * then a smooth curve into the port. Arc-length sampled so the drawn tip and
 * `at(t)` agree. End dots mark both anchors (relation style).
 */
function threadLine(ctx, name, from, x1, to) {
  const pts = [];
  const ns = 8;
  for (let k = 0; k <= ns; k++) pts.push({x: lerp(from.x, x1, k / ns), y: from.y});
  const a = {x: x1, y: from.y};
  const kx = (to.x - x1) * 0.5;
  const c1 = {x: x1 + kx, y: from.y}, c2 = {x: to.x - kx, y: to.y};
  for (let k = 1; k <= 32; k++) {
    const t = k / 32, u = 1 - t;
    pts.push({x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y});
  }
  const poly = polyline(pts);
  const total = poly.total;
  const d = `M${r(from.x)} ${r(from.y)}L${r(x1)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: STRING, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total + 2)} ${r(total + 12)}`, 'stroke-dashoffset': r(total + 2)}),
    h('circle', {name: `${name}-dotA`, cx: from.x, cy: from.y, r: 5, fill: STRING, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: to.x, cy: to.y, r: 5.5, fill: STRING, opacity: 0}),
  );
  const frame = (p, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r((total + 2) * (1 - p))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame, at: t => poly.at(t), total, from, to};
}

/** Dashed outline of a missing tag at a local anchor (used when no label is supplied). */
function tagGhost(ctx, name, tw, a, ang, scale, color, H = 46, sw = 3.5) {
  const x0 = -TAG_TIP, x1 = tw - TAG_TIP;
  const c = color || ctx.theme.accent;
  return g({name, opacity: 0, transform: T(a.x, a.y, ang, scale)},
    h('path', {d: `M${x0} 0L${x0 + 16} ${-H / 2}H${x1 - 7}Q${x1} ${-H / 2} ${x1} ${-H / 2 + 7}V${H / 2 - 7}Q${x1} ${H / 2} ${x1 - 7} ${H / 2}H${x0 + 16}Z`, fill: 'none', stroke: c, 'stroke-width': sw, 'stroke-dasharray': `${r(sw * 2.6)} ${r(sw * 2)}`}),
    h('circle', {r: 6, fill: 'none', stroke: c, 'stroke-width': sw * 0.7}),
  );
}

/** Push-pin seen from above. Local origin = pin point. */
function pinNode() {
  return g(null,
    h('ellipse', {cx: 5, cy: 7, rx: 12, ry: 9, fill: 'rgba(31,35,40,0.2)'}),
    h('circle', {r: 12, fill: PIN, stroke: '#1f2328', 'stroke-width': 2}),
    h('circle', {cx: -4, cy: -4, r: 4, fill: '#ffffff', opacity: 0.6}),
  );
}

/**
 * Luggage tag threaded on a string. Local origin = the hole (on the thread);
 * the pointed end sits TAG_TIP units before the hole and the body extends
 * along +x, centred on the string. Optional second text for the inspect
 * substitution; the body width follows the swap.
 */
function makeTag(ctx, name, text, after, o) {
  const th = ctx.theme;
  const size = o.size;
  const padL = 16, padR = 18;
  const fitOf = (t, sz = size, minSize = size * 0.7, lines = 3) => fitWhole(ctx, t, {maxWidth: o.maxWidth - TAG_TIP - padL - padR, size: sz, minSize, maxLines: lines, weight: 700});
  const f0 = fitOf(text);
  // the replacement keeps the tag's text size and wraps (up to 4 lines); it is
  // only shrunk when even that cannot hold it
  let f1 = after !== null && after !== undefined ? fitOf(after, f0.size, f0.size, 4) : null;
  if (f1 && f1.truncated) f1 = fitOf(after, f0.size, f0.size * 0.7, 4);
  const textH = Math.max(f0.height, f1 ? f1.height : 0);
  const H = Math.max(46, textH + 22);
  const H0 = Math.max(46, f0.height + 22);
  const H1 = f1 ? Math.max(46, f1.height + 22) : H0;
  const widthOf = f => Math.max(120, TAG_TIP + padL + f.width + padR);
  const W0 = widthOf(f0);
  const W1 = f1 ? widthOf(f1) : W0;
  const bodyD = (w, bh = H0) => {
    const x0 = -TAG_TIP, x1 = w - TAG_TIP, hh = bh / 2;
    return `M${x0} 0L${r(x0 + 16)} ${r(-hh)}H${r(x1 - 7)}Q${r(x1)} ${r(-hh)} ${r(x1)} ${r(-hh + 7)}V${r(hh - 7)}Q${r(x1)} ${r(hh)} ${r(x1 - 7)} ${r(hh)}H${r(x0 + 16)}Z`;
  };
  const show = ctx.show('key');
  const cx = w => (-TAG_TIP + 12 + padL + (w - TAG_TIP)) / 2 + 2;
  const node = g({name, opacity: 1},
    h('path', {name: `${name}-body`, d: bodyD(W0), fill: TAG_FILL, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('circle', {cx: 0, cy: 0, r: 7, fill: th.accent3, stroke: th.ink, 'stroke-width': 1.5}),
    h('circle', {cx: 0, cy: 0, r: 3.2, fill: '#fff'}),
    h('path', {d: 'M-6 -3C-7 -14 7 -14 6 -3', fill: 'none', stroke: STRING, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    show ? g({name: `${name}-txtw`, transform: T(cx(W0), 0)}, textBlock(f0, {x: 0, y: -f0.height / 2 - 1, anchor: 'middle', fill: th.ink, name: `${name}-txt`}))
      : h('rect', {name: `${name}-txt`, x: 14, y: -6, width: Math.max(30, W0 - TAG_TIP - 44), height: 12, rx: 6, fill: shade(TAG_FILL, -0.35)}),
    f1 && show ? g({name: `${name}-txtw2`, transform: T(cx(W1), 0)}, textBlock(f1, {x: 0, y: -f1.height / 2 - 1, anchor: 'middle', fill: th.accent2, name: `${name}-txt2`, opacity: 0})) : null,
  );
  /**
   * @param {number} textP  text visibility 0..1 (grows with the tag)
   * @param {number} swapP  0 = before text, 1 = after text
   */
  const frame = (textP, swapP = 0) => {
    const out = {};
    if (f1) {
      const outP = clamp(swapP * 2), inP = clamp(swapP * 2 - 1);
      // the body resizes while the old text lifts out, so the new text always fits
      const w = lerp(W0, W1, ease.inOutSine(outP));
      out[`${name}-body`] = {d: bodyD(w, lerp(H0, H1, ease.inOutSine(outP)))};
      if (show) {
        out[`${name}-txt`] = {opacity: r(textP * (1 - outP), 3), transform: `translate(0 ${r(-12 * outP)})`};
        out[`${name}-txt2`] = {opacity: r(textP * inP, 3), transform: `translate(0 ${r(12 * (1 - inP))})`};
      } else {
        // labels hidden: the placeholder bar follows the body and takes the "new value" colour
        out[`${name}-txt`] = {opacity: r(textP, 3), width: r(Math.max(30, w - TAG_TIP - 44)), fill: swapP >= 0.5 ? th.accent2 : shade(TAG_FILL, -0.35)};
      }
    } else out[`${name}-txt`] = {opacity: r(textP, 3)};
    return out;
  };
  /** axis-aligned box of the body at world point p, rotated by ang degrees */
  const boxAt = (p, ang, w = W0) => {
    const a = (ang * Math.PI) / 180;
    const pts = [[-TAG_TIP, -H / 2], [w - TAG_TIP, -H / 2], [-TAG_TIP, H / 2], [w - TAG_TIP, H / 2]].map(([x, y]) => [p.x + x * Math.cos(a) - y * Math.sin(a), p.y + x * Math.sin(a) + y * Math.cos(a)]);
    const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
    return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  };
  return {node, frame, boxAt, W: W0, W1, maxW: Math.max(W0, W1), H, H0, H1, fit: f0, textSize: Math.min(f0.size, f1 ? f1.size : Infinity)};
}

/** Search bar: socket for the magnifier, clipped query (typed reveal), caret, go-button. */
function searchBar(ctx, P, S, query, placeholder, fs = 1, maxLines = 1) {
  const th = ctx.theme;
  const cy = S.y + S.h / 2;
  const sockR = S.h * 0.38;
  const socket = {x: S.x + S.h / 2 + 4, y: cy};
  const btn = S.h - 22;
  const tx = S.x + S.h + 16;
  const textMax = S.w - S.h - 16 - btn - 36;
  const showQ = ctx.show('all');
  const size1 = Math.min(32 * fs, S.h * 0.42);
  let f = ctx.fit(query || '', {maxWidth: textMax, size: size1, minSize: 20, maxLines: 1, weight: 500});
  // a long query may wrap to two lines inside the bar instead of being cut or
  // shrunk to a small single line
  if (maxLines > 1 && (f.truncated || f.size < size1 * 0.8)) {
    const f2 = ctx.fit(query || '', {maxWidth: textMax, size: Math.min(28 * fs, S.h * 0.32), minSize: 17, maxLines: 2, weight: 500, leading: 1.1});
    if (!f2.truncated && (f.truncated || f2.size > f.size)) f = f2;
  }
  const textW = showQ ? Math.max(8, f.width) : textMax * 0.7;
  const clipId = `${P}-qclip`;
  const bars = [];
  if (!showQ) {
    let x = tx;
    for (const w of [0.28, 0.18, 0.24]) {
      bars.push(h('rect', {x, y: cy - 8, width: textMax * w, height: 16, rx: 8, fill: th.inkSoft, opacity: 0.55}));
      x += textMax * w + 12;
    }
  }
  let ph = null;
  if (placeholder && ctx.show('all')) {
    const pf = ctx.fit(placeholder, {maxWidth: textMax, size: Math.min(30 * fs, S.h * 0.4), minSize: 20, maxLines: 1, weight: 500});
    ph = textBlock(pf, {x: tx, y: cy - pf.size * 0.55, fill: th.inkFaint, name: `${P}-q-ph`, italic: true});
  }
  const node = g({name: `${P}-search`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${P}-q-clip`, x: tx - 4, y: S.y, width: 0, height: S.h}))),
    h('path', {d: roundRectPath(S.x + 5, S.y + 8, S.w, S.h, S.h / 2), fill: th.shadow}),
    h('path', {d: roundRectPath(S.x, S.y, S.w, S.h, S.h / 2), fill: th.card, stroke: th.ink, 'stroke-width': th.stroke}),
    h('circle', {cx: socket.x, cy: socket.y, r: sockR, fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '5 5'}),
    ph,
    g({'clip-path': ctx.ref(clipId), name: `${P}-q-text`, opacity: 0},
      showQ ? textBlock(f, {x: tx, y: f.lines.length > 1 ? cy - f.height / 2 - f.size * 0.08 : cy - f.size * 0.55, fill: th.ink}) : bars),
    h('line', {name: `${P}-q-caret`, x1: tx, x2: tx, y1: cy - 20, y2: cy + 20, stroke: th.accent2, 'stroke-width': 3, opacity: 0}),
    h('path', {d: roundRectPath(S.x + S.w - btn - 12, S.y + 11, btn, btn, 14), fill: th.accent2, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(S.x + S.w - 12 - btn * 0.72)} ${r(cy)}h${r(btn * 0.42)}m-12 -11l12 11l-12 11`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
  const frame = p => {
    const e = clamp(p);
    const w = textW * e;
    const out = {
      [`${P}-q-clip`]: {width: r(e > 0 ? w + 6 : 0)},
      [`${P}-q-text`]: {opacity: e > 0 ? 1 : 0},
      [`${P}-q-caret`]: {x1: r(tx + w + 4), x2: r(tx + w + 4), opacity: e > 0 && e < 1 ? 1 : 0},
    };
    if (ph) out[`${P}-q-ph`] = {opacity: e > 0 ? 0 : 1};
    return out;
  };
  return {node, frame, socket, textBox: {x: tx, y: cy - 20, w: textW, h: 40}};
}

/** Magnifier (search lens). Local origin = glass centre. */
function magnifierNode(ctx, name, R) {
  const th = ctx.theme;
  return g({name},
    g({transform: 'rotate(45)'},
      h('path', {d: roundRectPath(R * 0.92, -R * 0.2, R * 1.2, R * 0.4, R * 0.16), fill: '#5a3f2a', stroke: th.ink, 'stroke-width': 2.5}),
      h('rect', {x: R * 0.86, y: -R * 0.26, width: R * 0.22, height: R * 0.52, rx: 4, fill: '#9aa4ad', stroke: th.ink, 'stroke-width': 2})),
    h('circle', {r: R, fill: '#e3f1fa', 'fill-opacity': 0.42, stroke: '#5f6b75', 'stroke-width': R * 0.2}),
    h('circle', {r: R * 1.1, fill: 'none', stroke: th.ink, 'stroke-width': 2.5}),
    h('circle', {r: R * 0.9, fill: 'none', stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: `M${r(-R * 0.55)} ${r(-R * 0.2)}A${r(R * 0.6)} ${r(R * 0.6)} 0 0 1 ${r(-R * 0.15)} ${r(-R * 0.58)}`, fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.85}),
  );
}

/**
 * Front-view bookcase. Books are seeded; binders sit at table positions.
 * Returns binder centres/sizes (index order: sources first, then decoys).
 */
function bookcase(ctx, P, B, rows, count, plaque, seedKey) {
  const th = ctx.theme;
  const wood = th.woodTop;
  const woodDark = th.woodDark;
  const back = shade(wood, -0.42);
  const crownH = 24, headH = rows > 2 ? 58 : 54, plinthH = 32, side = 20, board = 16;
  const ix = B.x + side, iw = B.w - side * 2;
  const top = B.y + crownH + headH;
  const bottom = B.y + B.h - plinthH;
  const rowH = (bottom - top - board * (rows - 1)) / rows;
  const floorOf = rI => top + rI * (rowH + board) + rowH;
  const R = (k, i) => ctx.rng(`${seedKey}-${k}`, i);

  // binder slots
  const table = PLACE[rows] || PLACE[4];
  const bw = Math.min(66, Math.max(54, iw * 0.12));
  const bh = rowH * 0.86;
  const binders = [];
  for (let j = 0; j < count; j++) {
    const [rI, fr] = table[j % table.length];
    const x = ix + 24 + (iw - 48) * (fr + (R('bj', j) - 0.5) * 0.03);
    binders.push({x, y: floorOf(rI) - bh / 2, w: bw, h: bh, row: rI});
  }

  const parts = [];
  // floor shadow
  parts.push(h('ellipse', {cx: B.x + B.w / 2, cy: B.y + B.h + 4, rx: B.w * 0.55, ry: 12, fill: th.shadow}));
  // carcass
  parts.push(h('rect', {x: B.x, y: B.y + crownH - 2, width: B.w, height: B.h - crownH + 2, rx: 4, fill: wood, stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('rect', {x: ix, y: top, width: iw, height: bottom - top, fill: back}));
  // subtle back-panel planks
  for (let k = 1; k < 5; k++) parts.push(h('line', {x1: ix + (iw * k) / 5, x2: ix + (iw * k) / 5, y1: top, y2: bottom, stroke: shade(back, -0.12), 'stroke-width': 2}));
  // books
  for (let rI = 0; rI < rows; rI++) {
    const floor = floorOf(rI);
    const inRow = binders.filter(b => b.row === rI).sort((a, b) => a.x - b.x);
    let cur = ix + 6;
    let bi = 0;
    const fill = (from, to) => {
      let x = from;
      let k = 0;
      while (x + 14 <= to) {
        let w = 20 + R(`bw${rI}`, Math.round(x)) * 22;
        if (x + w > to) w = to - x;
        if (w < 14) break;
        const hh = rowH * (0.66 + R(`bh${rI}`, Math.round(x)) * 0.24);
        const col = BOOKS[Math.floor(R(`bc${rI}`, Math.round(x)) * BOOKS.length)];
        parts.push(book(x, floor, w, hh, col, th));
        x += w + 1;
        k++;
      }
      return x;
    };
    for (const b of inRow) {
      fill(cur, b.x - b.w / 2 - 3);
      cur = b.x + b.w / 2 + 3;
      bi++;
    }
    // leave a gap at the end of some rows and lean a book into it
    const gap = rI % 2 === 0 ? 70 : 0;
    const end = fill(cur, ix + iw - 6 - gap);
    if (gap) {
      const w = 24, hh = rowH * 0.74;
      parts.push(g({transform: `rotate(-14 ${r(end + w)} ${r(floor)})`}, book(end + 1, floor, w, hh, BOOKS[(rI * 3 + 1) % BOOKS.length], th)));
    }
    // shelf board
    if (rI < rows - 1) {
      parts.push(h('rect', {x: ix, y: floor, width: iw, height: board, fill: wood, stroke: th.ink, 'stroke-width': 2}));
      parts.push(h('line', {x1: ix, x2: ix + iw, y1: floor + board - 4, y2: floor + board - 4, stroke: woodDark, 'stroke-width': 2, opacity: 0.6}));
    }
  }
  // crown, header panel, plinth, sides
  parts.push(h('path', {d: roundRectPath(B.x - 12, B.y, B.w + 24, crownH, 5), fill: shade(wood, 0.06), stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('rect', {x: ix, y: B.y + crownH, width: iw, height: headH, fill: shade(wood, -0.08), stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('rect', {x: B.x - 6, y: bottom, width: B.w + 12, height: plinthH, rx: 3, fill: shade(wood, -0.1), stroke: th.ink, 'stroke-width': th.stroke}));
  parts.push(h('line', {x1: ix, x2: ix, y1: top, y2: bottom, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('line', {x1: ix + iw, x2: ix + iw, y1: top, y2: bottom, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('line', {x1: ix, x2: ix + iw, y1: top, y2: top, stroke: th.ink, 'stroke-width': 2}));
  // plaque
  const pcy = B.y + crownH + headH / 2;
  let plaqueNode;
  if (ctx.show('all') && plaque) {
    // one line when it fits, else two shorter lines inside the header panel
    let f = fitWhole(ctx, plaque, {maxWidth: iw * 0.86 - 28, size: 28, minSize: 18, maxLines: 1, weight: 700});
    if (f.truncated) f = fitWhole(ctx, plaque, {maxWidth: iw * 0.86 - 28, size: 20, minSize: 15, maxLines: 2, weight: 700, leading: 1.05});
    const pw = f.width + 28, ph = Math.min(headH - 6, f.height + 14);
    plaqueNode = g(null,
      h('path', {d: roundRectPath(B.x + B.w / 2 - pw / 2, pcy - ph / 2, pw, ph, 6), fill: '#e6c77f', stroke: th.ink, 'stroke-width': 2}),
      textBlock(f, {x: B.x + B.w / 2, y: pcy - f.height / 2 - f.size * 0.04, anchor: 'middle', fill: '#3a2c14', name: `${P}-plaque`}));
  } else {
    plaqueNode = h('path', {d: roundRectPath(B.x + B.w / 2 - iw * 0.2, pcy - 16, iw * 0.4, 32, 6), fill: '#e6c77f', stroke: th.ink, 'stroke-width': 2});
  }
  parts.push(plaqueNode);
  return {node: g({name: `${P}-lib`}, parts), binders, plaquePoint: {x: B.x + B.w / 2, y: pcy + 18}, rowH};
}

function book(x, floor, w, hh, col, th) {
  const y = floor - hh;
  return g(null,
    h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 2, fill: col, stroke: th.ink, 'stroke-width': 1.8}),
    h('line', {x1: r(x + 3), x2: r(x + w - 3), y1: r(y + 10), y2: r(y + 10), stroke: shade(col, 0.35), 'stroke-width': 2.5}),
    h('line', {x1: r(x + 3), x2: r(x + w - 3), y1: r(floor - 12), y2: r(floor - 12), stroke: shade(col, 0.35), 'stroke-width': 2.5}),
    w > 26 ? h('rect', {x: r(x + w * 0.25), y: r(y + hh * 0.3), width: r(w * 0.5), height: r(hh * 0.22), rx: 2, fill: shade(col, 0.5), opacity: 0.7}) : null,
  );
}

/**
 * Pose of a flying resolution at flight progress `fly` ∈ [0,1]: centre,
 * scale, tilt and the spine / cover widths (the spine narrows to an edge
 * EDGE units thick, the cover grows from the same edge width, so the piece
 * never vanishes mid-turn).
 * @param {{p0:any,p1:any,p2:any,spineW:number,cw:number}} fl
 */
function flightPose(fl, fly, reduced = false) {
  const c = quad(fl.p0, fl.p1, fl.p2, ease.inOutCubic(fly));
  const sc = lerp(1.08, 1, ease.inOutSine(fly));
  const rot = reduced ? 0 : -8 * Math.sin(Math.PI * fly);
  const a1 = ease.inOutSine(seg(fly, 0.2, 0.5));
  const a2 = ease.inOutSine(seg(fly, 0.5, 0.8));
  const spX = fly < 0.5 ? lerp(1, EDGE / fl.spineW, a1) : 0;
  const cvX = fly >= 0.5 ? lerp(EDGE / fl.cw, 1, a2) : 0;
  return {c, sc, rot, spX, cvX};
}

/** Summed overlap area (design units²) between a flying piece and obstacle boxes over its flight. */
function flightOverlap(fl, obstacles) {
  let total = 0;
  for (let k = 0; k <= 40; k++) {
    const fly = k / 40;
    const q = flightPose(fl, fly);
    const w = (q.spX > 0.001 ? fl.spineW * q.spX : fl.cw * q.cvX) * q.sc;
    const hh = (q.spX > 0.001 ? fl.spineH : fl.chh) * q.sc;
    const a = (Math.abs(q.rot) * Math.PI) / 180;
    const bw = w * Math.cos(a) + hh * Math.sin(a), bh = w * Math.sin(a) + hh * Math.cos(a);
    const box = {x: q.c.x - bw / 2, y: q.c.y - bh / 2, w: bw, h: bh};
    for (const o of obstacles) total += overlapArea(box, o, 8);
  }
  return total;
}

function overlapArea(a, b, pad = 0) {
  const x0 = Math.max(a.x, b.x - pad), y0 = Math.max(a.y, b.y - pad);
  const x1 = Math.min(a.x + a.w, b.x + b.w + pad), y1 = Math.min(a.y + a.h, b.y + b.h + pad);
  return x1 > x0 && y1 > y0 ? (x1 - x0) * (y1 - y0) : 0;
}

/** Axis-aligned overlap test (exported for entries placing editorial notes). */
export function boxesOverlap(a, b, pad = 0) {
  return overlapArea(a, b, pad) > 0;
}

/** Tag and library colours, exported for legends / mechanism art. */
export const CASE_COLORS = {binder: BINDER, tag: TAG_FILL, string: STRING, card: CARD_BG, cardRule: CARD_RULE, cardRed: CARD_RED, pin: PIN, paper: PAPER, books: BOOKS};

/** Art builders reused by the mechanism entry (drawn at arbitrary sizes). */
export const caseArt = {
  decisionDoc: (ctx, name, D, decision, fs) => decisionDoc(ctx, name, D, decision, fs),
  cover: (ctx, name, w, hh, citation, date, fs) => coverNode(ctx, name, w, hh, citation, date, {}, fs),
  spine: (ctx, w, hh, citation, highlightName) => spineNode(ctx, highlightName, w, hh, citation, Boolean(highlightName)),
  tag: (ctx, name, text, o) => makeTag(ctx, name, text, null, o),
  magnifier: (ctx, name, R) => magnifierNode(ctx, name, R),
  pin: () => pinNode(),
  book: (x, floor, w, hh, col, th) => book(x, floor, w, hh, col, th),
  bookcase: (ctx, P, B, rows, count, plaque, seedKey) => bookcase(ctx, P, B, rows, count, plaque, seedKey),
  searchBar: (ctx, P, S, query, placeholder, fs, maxLines) => searchBar(ctx, P, S, query, placeholder, fs, maxLines),
  card: (ctx, P, C, heading, fs, headFrac) => treatmentCard(ctx, P, C, heading, fs, headFrac),
  ghost: (ctx, name, tw, a, ang, scale, color, H) => tagGhost(ctx, name, tw, a, ang, scale, color, H),
};

/**
 * Magnifier track helper: maps global time u to the stage's `mag` value
 * (0 = in the socket, i = resting over the i-th visited binder, k+1 = back in
 * the socket). Legs take the time between visits; each visit dwells.
 * Pure function of its arguments; the entries choose the windows.
 * @param {number} u
 * @param {{out:number, visits:number[], dwell:number, back:number}} w
 */
export function magValue(u, w) {
  const v = w.visits;
  if (!v.length) return 0;
  if (u <= w.out) return 0;
  if (u < v[0]) return seg(u, w.out, v[0]);
  for (let i = 0; i < v.length; i++) {
    const arrive = v[i];
    const leave = arrive + w.dwell;
    if (u <= leave) return i + 1;
    const next = i + 1 < v.length ? v[i + 1] : leave + w.back;
    if (u < next) return i + 1 + seg(u, leave, next);
  }
  return v.length + 1;
}
