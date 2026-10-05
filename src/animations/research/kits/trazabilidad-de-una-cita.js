/**
 * "Trazabilidad de una cita" kit (LAW-0077..0080): original vector art, a
 * brass citation chain and a first-person library bay for a citation that is
 * followed from a footnote, through an intermediate reference, to the source
 * document it rests on.
 *
 * Art (all original geometry, no third-party assets):
 *  - chainRope(): a brass link chain drawn along any route (flat links with a
 *    slot + edge links between them, dash-laid so links never slide while the
 *    chain grows), with a lobster clasp at its leading end and brass eyelets
 *    on every document it passes through;
 *  - articlePage(): the citing article (header, body, quoted line with a
 *    superscript note number, footnote with an eyelet in the margin);
 *  - treatiseBook(): the intermediate reference as a book rig that turns from
 *    spine to cover, grows as it is brought forward and opens on its cited
 *    spread (left page: quoted passage + incoming eyelet; right page: the
 *    passage continues, its own footnote + outgoing eyelet);
 *  - sourceFolio() + archiveBox(): the aged original with numbered entries,
 *    folio number and wax seal, standing in an open archive box;
 *  - catalogueScreen(): the wall-mounted catalogue search (query, result row,
 *    shelf-mark pill); trailCard(): the citation-trail index card (ficha) with
 *    one row per stop; bookcase(), lectern(), cradle();
 *  - trailBay(): first-person library bay (wall, counter, all props, two IK
 *    arms entering from the bottom edge). It owns geometry and a pose solver
 *    only; each entry owns its timeline, labels and semantics.
 *
 * Attachment rules (tests read them from the semantics):
 *  - the book follows the SOLVED right hand while carried (grip on the hinge);
 *    while the cover opens the hand rides the cover's free edge;
 *  - the original follows the SOLVED right hand from the moment it is gripped;
 *  - the card is positioned from the SOLVED left hand;
 *  - a chain segment starts on an eyelet and its clasp ends on the next
 *    eyelet; when a document moves, the attached chain end moves with it;
 *  - the right hand rests on the counter in view when it holds nothing
 *    (restVis): it never crosses the frame edge on its own (semantic
 *    handRInView).
 * @module animations/research/kits/trazabilidad-de-una-cita
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {cubic, dist, ik2, mix, polyline, roundRectPath} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {topArm} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, obj} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------ */
/* Parameters                                                          */
/* ------------------------------------------------------------------ */

/** The three stops of the trail, in order. */
export const STOPS = ['note', 'intermediate', 'source'];

/** Category fields (research): query, sources, citations, dates. */
export const trailFields = {
  query: str('Text typed into the catalogue search (buscador); by default the work named in the note (fictional)', 60),
  sources: obj('The three works on the citation trail (fictional titles, never real works)', {
    article: str('Citing work whose footnote starts the trail (printed in the article header and on the card)', 70),
    intermediate: str('Intermediate reference: the work the note cites; it cites the source in turn (cover, page header, search result, card)', 70),
    source: str('Source document: the original the intermediate reference cites (folio header, card)', 70),
  }, ['article', 'intermediate', 'source']),
  citations: obj('How each stop cites the next. Composed into the footnotes as "<work>, <place>"; fictional references only, never real citations', {
    noteNumber: str('Footnote number in the citing article', 4),
    pinpoint: str('Place in the intermediate reference cited by the note, e.g. "p. 88" (printed in the note and as the page number of the open page)', 16),
    innerNote: str('Footnote number inside the intermediate reference', 4),
    folio: str('Place in the source document cited by the intermediate, e.g. "fol. 14" (printed in its footnote and on the folio)', 16),
    entry: str('Entry of the source document the trail ends on: "1"–"4" selects the numbered entry on the folio (other text is printed on the third entry)', 12),
    shelfMark: str('Shelf mark returned by the catalogue search and printed on the shelf plate', 10),
  }, ['noteNumber', 'pinpoint', 'innerNote', 'folio', 'entry', 'shelfMark']),
  dates: obj('Fictional, relative date labels printed on each work', {
    article: str('Date printed in the article header', 30),
    intermediate: str('Edition/date printed on the intermediate reference', 30),
    source: str('Date written on the source entry', 30),
  }, ['article', 'intermediate', 'source']),
};

/** Fictional English defaults shared by the four entries. */
export const TRAIL_DEFAULTS = {
  query: 'Treatise on Sample Remedies',
  sources: {article: 'Journal of Sample Studies', intermediate: 'Treatise on Sample Remedies', source: 'Minute book of the Harbour Board'},
  citations: {noteNumber: '12', pinpoint: 'p. 88', innerNote: '3', folio: 'fol. 14', entry: '3', shelfMark: 'B·3'},
  dates: {article: 'Issue 7 · Year 5', intermediate: '2nd ed. · Year 3', source: 'Day 12 · Year 1'},
};

/** Fictional Spanish defaults (presets). */
export const TRAIL_DEFAULTS_ES = {
  query: 'Tratado de remedios de ejemplo',
  sources: {article: 'Revista de Estudios de Ejemplo', intermediate: 'Tratado de remedios de ejemplo', source: 'Libro de actas de la Junta del Puerto'},
  citations: {noteNumber: '12', pinpoint: 'p. 88', innerNote: '3', folio: 'fol. 14', entry: '3', shelfMark: 'B·3'},
  dates: {article: 'N.º 7 · año 5', intermediate: '2.ª ed. · año 3', source: 'Día 12 · año 1'},
};

/** Long-label defaults (stress presets). */
export const TRAIL_LONG = {
  query: 'Comparative treatise on remedies in sample harbour disputes',
  sources: {
    article: 'Quarterly Journal of Sample Maritime and Commercial Studies',
    intermediate: 'Comparative Treatise on Remedies in Sample Harbour Disputes',
    source: 'Minute book of the Northern Harbour Board, second series',
  },
  citations: {noteNumber: '127', pinpoint: 'pp. 388–389', innerNote: '41', folio: 'fols. 214–215', entry: '3', shelfMark: 'HB-12·7'},
  dates: {article: 'Issue 17 · Year 25', intermediate: '4th revised ed. · Year 23', source: 'Entry of Day 12 · Year 1'},
};

/** Built-in strings of the kit. */
export const KIT_STRINGS = {
  en: {
    note: 'Note', intermediate: 'Intermediate reference', source: 'Source document', search: 'Catalogue search', card: 'Citation trail',
    box: 'Archive', researcher: 'Researcher', citedIn: 'as cited in', citedInShort: 'cited in the intermediate', entry: 'entry',
    sourceReached: 'Traced to the source document', intermediateOnly: 'Traced to the intermediate reference',
    notOpened: 'Original not opened', opened: 'Original opened', library: 'Library',
  },
  es: {
    note: 'Nota', intermediate: 'Referencia intermedia', source: 'Documento de origen', search: 'Buscador del catálogo', card: 'Rastro de la cita',
    box: 'Archivo', researcher: 'Investigadora', citedIn: 'citado en', citedInShort: 'citado en la intermedia', entry: 'asiento',
    sourceReached: 'Rastreada hasta el documento de origen', intermediateOnly: 'Rastreada hasta la referencia intermedia',
    notOpened: 'Original sin abrir', opened: 'Original abierto', library: 'Biblioteca',
  },
};

/** Footnote text in the article (cites the intermediate). */
export const noteText = p => `${p.sources.intermediate}, ${p.citations.pinpoint}`;
/** Footnote text in the intermediate (cites the source). */
export const innerText = p => `${p.sources.source}, ${p.citations.folio}`;

/** Entry slot (0..3) selected by an entry label; non-numeric labels use the third slot. */
export function entrySlot(label) {
  const m = /\d+/.exec(String(label));
  const n = m ? parseInt(m[0], 10) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 4 ? n - 1 : 2;
}

/** Card rows for the three stops: work title + place (note / page / folio). */
export function cardRows(p, t) {
  return [
    {title: p.sources.article, place: `${t.note} ${p.citations.noteNumber}`},
    {title: p.sources.intermediate, place: p.citations.pinpoint},
    {title: p.sources.source, place: p.citations.folio},
  ];
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

export const BRASS = {dark: '#6c4f1a', mid: '#c99a3a', light: '#f3da92', edge: '#a47b2b'};
export const AGED = {paper: '#f2e4c0', shade: '#e0cc98', ink: '#5a4128', line: '#8a6a45'};
export const TREATISE = '#7a2f3b';
const CARD = {paper: '#fcf7e9', rule: '#c8553d', line: '#b9cfe0'};
const SPINES = ['#2f6690', '#588157', '#7a5c8e', '#9c4f4f', '#3d5a6c', '#b07a2f', '#4f7c7a', '#6b705c', '#8e6441', '#355070'];

/* ------------------------------------------------------------------ */
/* Chain                                                               */
/* ------------------------------------------------------------------ */

/**
 * Sagging route between two points (cubic, sampled). `sag` pulls both
 * control points down like a hanging chain; c1/c2 override the controls.
 * @returns {ReturnType<typeof polyline>}
 */
export function chainRoute(a, b, o = {}) {
  const sag = o.sag ?? Math.min(150, dist(a, b) * 0.12 + 14);
  const c1 = o.c1 ?? {x: lerp(a.x, b.x, 1 / 3) + (o.dx1 ?? 0), y: lerp(a.y, b.y, 1 / 3) + sag};
  const c2 = o.c2 ?? {x: lerp(a.x, b.x, 2 / 3) + (o.dx2 ?? 0), y: lerp(a.y, b.y, 2 / 3) + sag};
  const pts = [];
  const n = o.samples ?? 48;
  for (let i = 0; i <= n; i++) pts.push(cubic(a, c1, c2, b, i / n));
  return polyline(pts);
}

/** Path data of the first `s` units of a sampled polyline. */
export function partialD(poly, s) {
  const pts = poly.pts;
  if (!(s > 0.01) || pts.length < 2) return `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const segL = dist(pts[i - 1], pts[i]);
    if (acc + segL >= s) {
      const f = (s - acc) / (segL || 1);
      d += `L${r(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f)} ${r(pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f)}`;
      return d;
    }
    acc += segL;
    d += `L${r(pts[i].x)} ${r(pts[i].y)}`;
  }
  return d;
}

/**
 * Brass link chain along a route, revealed from its start. Links are laid by
 * dash patterns measured from the start, so existing links never slide while
 * the chain grows. The lobster clasp sits on the leading end.
 * Nodes: `${name}` (group) and `${name}-clasp`.
 * @param {any} ctx
 * @param {{name:string, width?:number}} o
 */
export function chainRope(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const w = o.width ?? 10;
  const p = w * 2.7;
  const Lf = p * 0.36;
  const Le = p * 0.3;
  const Lh = Lf * 0.62;
  const dash = (a, off) => ({'stroke-dasharray': `${r(a)} ${r(p - a)}`, 'stroke-dashoffset': r(off)});
  const offHole = -(Lf - Lh) / 2;
  const offEdge = -(Lf / 2 + p / 2 - Le / 2);
  const base = {fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: 'M0 0'};
  const node = g({name: N, opacity: 0},
    h('path', {name: `${N}-sh`, ...base, stroke: th.shadow, 'stroke-width': w + 3, ...dash(Lf, 0), transform: 'translate(3 7)'}),
    h('path', {name: `${N}-fo`, ...base, stroke: BRASS.dark, 'stroke-width': w + 3.4, ...dash(Lf, 0)}),
    h('path', {name: `${N}-f`, ...base, stroke: BRASS.mid, 'stroke-width': w, ...dash(Lf, 0)}),
    h('path', {name: `${N}-hole`, ...base, stroke: shade(BRASS.dark, -0.35), 'stroke-width': w * 0.36, ...dash(Lh, offHole)}),
    h('path', {name: `${N}-eo`, ...base, stroke: BRASS.dark, 'stroke-width': w * 0.42 + 3.2, ...dash(Le, offEdge)}),
    h('path', {name: `${N}-e`, ...base, stroke: BRASS.light, 'stroke-width': w * 0.42, ...dash(Le, offEdge)}),
  );
  const clasp = claspNode(ctx, `${N}-clasp`, w);
  /**
   * @param {ReturnType<typeof polyline>} poly full route (start → target)
   * @param {number} prog revealed fraction 0..1 (the clasp rides the front)
   * @param {number} [opacity=1]
   */
  const frame = (poly, prog, opacity = 1) => {
    const s = clamp(prog) * poly.total;
    const d = partialD(poly, s);
    const on = s > 0.5;
    const out = {[N]: {opacity: on ? opacity : 0}};
    for (const k of ['sh', 'fo', 'f', 'hole', 'eo', 'e']) out[`${N}-${k}`] = {d};
    const tip = poly.at(clamp(prog));
    // clasp faces along the chain (average tangent over the last links)
    const back = poly.at(clamp(prog - Math.min(0.2, (w * 4) / Math.max(1, poly.total))));
    const ang = Math.atan2(tip.y - back.y, tip.x - back.x);
    out[`${N}-clasp`] = {opacity: on ? opacity : 0, transform: T(tip.x, tip.y, (ang * 180) / Math.PI)};
    return {nodes: out, tip: {x: tip.x, y: tip.y}};
  };
  return {node, clasp, frame, width: w};
}

/** Lobster clasp; local origin = hook tip, body extends along −x. */
function claspNode(ctx, name, w) {
  const L = w * 3.1;
  const hh = w * 0.72;
  return g({name, opacity: 0},
    h('ellipse', {cx: -L * 0.5 + 3, cy: 5, rx: L * 0.5, ry: hh, fill: ctx.theme.shadow}),
    h('path', {d: `M${r(-L)} 0C${r(-L)} ${r(-hh * 1.2)} ${r(-L * 0.3)} ${r(-hh * 1.25)} ${r(-w * 0.1)} ${r(-hh * 0.45)}Q${r(w * 0.25)} 0 ${r(-w * 0.1)} ${r(hh * 0.45)}C${r(-L * 0.3)} ${r(hh * 1.25)} ${r(-L)} ${r(hh * 1.2)} ${r(-L)} 0Z`, fill: BRASS.mid, stroke: BRASS.dark, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-L * 0.62)} ${r(-hh * 0.55)}Q${r(-L * 0.3)} ${r(-hh * 0.9)} ${r(-w * 0.2)} ${r(-hh * 0.2)}`, fill: 'none', stroke: BRASS.light, 'stroke-width': 2, 'stroke-linecap': 'round'}),
    h('circle', {cx: -L - w * 0.35, cy: 0, r: w * 0.42, fill: 'none', stroke: BRASS.dark, 'stroke-width': w * 0.34}),
    h('circle', {cx: -L - w * 0.35, cy: 0, r: w * 0.42, fill: 'none', stroke: BRASS.mid, 'stroke-width': w * 0.16}),
  );
}

/**
 * Brass eyelet ring (attachment point on a document). Local coordinates.
 * `${name}-pulse` flashes when a chain end hooks on.
 */
export function eyelet(ctx, {name, x, y, rad = 8}) {
  return g({name},
    h('circle', {name: `${name}-pulse`, cx: x, cy: y, r: rad * 2.2, fill: 'none', stroke: BRASS.mid, 'stroke-width': 3, opacity: 0}),
    h('circle', {cx: x, cy: y, r: rad, fill: '#3a2c14', stroke: BRASS.dark, 'stroke-width': rad * 0.7}),
    h('circle', {cx: x, cy: y, r: rad, fill: 'none', stroke: BRASS.mid, 'stroke-width': rad * 0.36}),
    h('path', {d: `M${r(x - rad * 0.7)} ${r(y - rad * 0.3)}A${r(rad)} ${r(rad)} 0 0 1 ${r(x + rad * 0.2)} ${r(y - rad * 0.9)}`, fill: 'none', stroke: BRASS.light, 'stroke-width': rad * 0.24, 'stroke-linecap': 'round'}),
  );
}

/** Pulse frame for an eyelet: a ring that grows and fades once (p 0..1). */
export function pulse(name, p) {
  const on = p > 0 && p < 1;
  return {[`${name}-pulse`]: {opacity: on ? r(0.9 * (1 - p), 3) : 0}};
}

/**
 * Dashed "cited in" link (a reference that is written but not followed).
 * Nodes: `${name}`. frame(poly, prog, opacity).
 */
export function citedLink(ctx, {name, color, width = 4}) {
  const c = color ?? ctx.theme.inkSoft;
  const node = h('path', {name, d: 'M0 0', fill: 'none', stroke: c, 'stroke-width': width, 'stroke-dasharray': `2 ${r(width * 3.2)}`, 'stroke-linecap': 'round', opacity: 0});
  const frame = (poly, prog, opacity = 1) => ({[name]: {d: partialD(poly, clamp(prog) * poly.total), opacity: prog > 0.005 ? opacity : 0}});
  return {node, frame};
}

/* ------------------------------------------------------------------ */
/* Small drawing helpers                                               */
/* ------------------------------------------------------------------ */

const bar = (x, y, w, hh, fill, extra = {}) => h('rect', {x: r(x), y: r(y), width: r(Math.max(0, w)), height: r(hh), rx: r(hh / 2), fill, ...extra});

/** Wavy "handwritten" line (deterministic). */
function scribble(ctx, key, x0, x1, y, amp, color, width) {
  const n = Math.max(4, Math.round((x1 - x0) / 14));
  let d = `M${r(x0)} ${r(y)}`;
  for (let i = 1; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    const up = (i % 2 ? -1 : 1) * amp * (0.55 + ctx.rng(`${key}-a`, i) * 0.6);
    const cx = lerp(x0, x1, (i - 0.5) / n);
    d += `Q${r(cx)} ${r(y + up)} ${r(x)} ${r(y + (ctx.rng(`${key}-y`, i) - 0.5) * amp * 0.5)}`;
  }
  return h('path', {d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
}

/* ------------------------------------------------------------------ */
/* Citing article (the note)                                           */
/* ------------------------------------------------------------------ */

/**
 * The citing article page. Local origin: top-left of the sheet.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, journal:string, date:string, noteNumber:string, note:string, showText:boolean, footLines?:number}} o
 */
export function articlePage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w} = o;
  const hh = o.h;
  const pad = w * 0.085;
  const inner = w - pad * 2;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(7, 10, w, hh, 5), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 5), fill: '#ffffff', stroke: th.ink, 'stroke-width': 2.4}));
  // header band
  parts.push(h('rect', {x: pad, y: pad * 0.8, width: inner, height: 5, rx: 2, fill: th.accent2}));
  const hs = Math.max(11, w * 0.05);
  let y = pad * 0.8 + 12;
  if (o.showText) {
    const jf = ctx.fit(o.journal, {maxWidth: inner * 0.62, size: hs, minSize: 9, maxLines: 1, weight: 700});
    const df = ctx.fit(o.date, {maxWidth: inner * 0.36, size: hs * 0.9, minSize: 8, maxLines: 1, weight: 500});
    parts.push(textBlock(jf, {x: pad, y, fill: th.accent2}));
    parts.push(textBlock(df, {x: w - pad, y: y + (jf.size - df.size), anchor: 'end', fill: th.inkSoft}));
  } else {
    parts.push(bar(pad, y + 2, inner * 0.5, hs * 0.55, th.accent2Soft));
    parts.push(bar(w - pad - inner * 0.26, y + 2, inner * 0.26, hs * 0.5, th.paperLine));
  }
  y += hs * 1.7;
  // title bars
  const tb = w * 0.042;
  parts.push(bar(pad, y, inner * 0.86, tb, th.ink, {opacity: 0.82}));
  parts.push(bar(pad, y + tb * 1.7, inner * 0.56, tb, th.ink, {opacity: 0.82}));
  y += tb * 3.6;
  // body: lines; one line carries the quoted passage + the note number
  const fs0 = Math.max(11, w * 0.06);
  const numW0 = o.showText ? ctx.measure(o.noteNumber, fs0 * 0.82, 800, 'sans') + 6 : fs0 * 0.6;
  const needs3 = o.showText && ctx.fit(o.note, {maxWidth: inner - numW0 - pad * 0.4, size: fs0, minSize: Math.max(9, fs0 * 0.7), maxLines: 2, weight: 500, family: 'serif'}).truncated;
  const footLines = o.footLines ?? (needs3 ? 3 : 2);
  const footH = hh * (footLines === 3 ? 0.29 : 0.235);
  const footTop = hh - footH;
  const lh = w * 0.058;
  const bh = Math.max(3.5, w * 0.017);
  const lines = Math.max(3, Math.floor((footTop - 14 - y) / lh));
  const qLine = Math.min(lines - 1, Math.max(2, Math.floor(lines * 0.55)));
  let markPt = null;
  let quoteBox = null;
  for (let i = 0; i < lines; i++) {
    const ly = y + i * lh;
    const last = i === lines - 1 || i === qLine - 1;
    const lw = inner * (last ? 0.5 + ctx.rng(`${P}-art`, i) * 0.3 : 0.9 + ctx.rng(`${P}-art`, i) * 0.1);
    if (i === qLine) {
      const qx0 = pad, qx1 = pad + inner * 0.7;
      quoteBox = {x: qx0 - 3, y: ly - bh * 1.4, w: qx1 - qx0 + 6, h: bh * 3.8};
      parts.push(h('rect', {x: r(quoteBox.x), y: r(quoteBox.y), width: r(quoteBox.w), height: r(quoteBox.h), rx: 3, fill: th.highlight, opacity: 0.85}));
      parts.push(bar(qx0, ly, qx1 - qx0, bh, th.inkSoft));
      markPt = {x: qx1 + 9, y: ly - bh * 0.6};
      continue;
    }
    parts.push(bar(pad, ly, lw, bh, th.paperLine));
  }
  // superscript note number in the body
  const sup = Math.max(10, w * 0.05);
  if (o.showText) {
    const nf = ctx.fit(o.noteNumber, {maxWidth: inner * 0.25, size: sup, minSize: 8, maxLines: 1, weight: 800});
    parts.push(textBlock(nf, {x: markPt.x - 2, y: markPt.y - sup * 0.5, fill: th.accent2}));
  } else {
    parts.push(h('circle', {cx: markPt.x + 3, cy: markPt.y, r: sup * 0.3, fill: th.accent2}));
  }
  // footnote
  parts.push(h('line', {x1: pad, x2: pad + inner * 0.34, y1: footTop, y2: footTop, stroke: th.inkSoft, 'stroke-width': 1.6}));
  const fs = Math.max(11, w * 0.06);
  const fy = footTop + fs * 0.5;
  const numW = o.showText ? ctx.measure(o.noteNumber, fs * 0.82, 800, 'sans') + 6 : fs * 0.6;
  const footBox = {x: pad - 5, y: fy - 5, w: inner + 10, h: footH - fs * 0.5 - pad * 0.35 + 10};
  parts.push(h('rect', {name: `${P}-foot-hl`, x: r(footBox.x), y: r(footBox.y), width: r(footBox.w), height: r(footBox.h), rx: 6, fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2, opacity: 0}));
  let footFit = null;
  if (o.showText) {
    const nf = ctx.fit(o.noteNumber, {maxWidth: inner * 0.25, size: fs * 0.82, minSize: 8, maxLines: 1, weight: 800});
    parts.push(textBlock(nf, {x: pad, y: fy - fs * 0.12, fill: th.accent2}));
    footFit = ctx.fit(o.note, {maxWidth: inner - numW - pad * 0.4, size: fs, minSize: Math.max(9, fs * 0.7), maxLines: footLines, weight: 500, family: 'serif'});
    parts.push(textBlock(footFit, {x: pad + numW, y: fy, fill: th.ink, name: `${P}-foot`}));
    // optional alternative footnote text (inspect: a substituted pinpoint), hidden until swapped in
    if (o.noteAlt) parts.push(textBlock(ctx.fit(o.noteAlt, {maxWidth: inner - numW - pad * 0.4, size: fs, minSize: Math.max(9, fs * 0.7), maxLines: footLines, weight: 500, family: 'serif'}), {x: pad + numW, y: fy, fill: th.accent2, name: `${P}-foot-b`, opacity: 0}));
  } else {
    parts.push(h('circle', {cx: pad + 4, cy: fy + fs * 0.35, r: fs * 0.22, fill: th.accent2}));
    parts.push(bar(pad + numW, fy + fs * 0.2, inner - numW, bh * 1.3, th.inkSoft));
    parts.push(bar(pad + numW, fy + fs * 1.4, (inner - numW) * 0.6, bh * 1.3, th.inkSoft));
  }
  const hook = {x: w - pad * 0.5, y: fy + fs * 0.42};
  const eye = eyelet(ctx, {name: `${P}-eye`, x: hook.x, y: hook.y, rad: Math.max(6, w * 0.026)});
  const node = g({name: P}, parts, eye);
  return {node, w, h: hh, hook, markPt, footBox, quoteBox, eye: `${P}-eye`};
}

/* ------------------------------------------------------------------ */
/* Intermediate reference (book rig)                                   */
/* ------------------------------------------------------------------ */

/**
 * The intermediate reference: a book that turns from spine to cover and
 * opens on its cited spread. Local origin: centre of the hinge (gutter)
 * line. Spine x ∈ [−t, 0]; cover / right page x ∈ [0, cw]; left page
 * x ∈ [−cw, 0]; y ∈ [−hB/2, hB/2].
 * @param {any} ctx
 * @param {{prefix:string, t:number, hB:number, cw:number, color?:string, title:string, edition?:string, pageL:string, pageR?:string, innerNote:string, foot:string, showText:boolean, seedKey?:string}} o
 */
export function treatiseBook(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {t, hB, cw} = o;
  const col = o.color || TREATISE;
  const top = -hB / 2;
  const GOLD = '#d9b45a';
  const showText = o.showText;
  const seedKey = o.seedKey || P;
  // spine: bands + call-number label
  const spine = g({name: `${P}-spine`},
    h('rect', {x: -t, y: top, width: t, height: hB, rx: 3, fill: col, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: -t + 2, y: top + hB * 0.08, width: t - 4, height: hB * 0.03, fill: GOLD}),
    h('rect', {x: -t + 2, y: top + hB * 0.14, width: t - 4, height: hB * 0.012, fill: GOLD}),
    h('rect', {x: -t * 0.78, y: top + hB * 0.24, width: t * 0.56, height: hB * 0.36, rx: 2, fill: shade(col, -0.25)}),
    h('rect', {x: -t * 0.86, y: top + hB * 0.78, width: t * 0.72, height: hB * 0.12, rx: 2, fill: '#fbf7ec', stroke: th.ink, 'stroke-width': 1.2}),
    h('rect', {x: -t * 0.7, y: top + hB * 0.815, width: t * 0.4, height: hB * 0.018, fill: th.ink, opacity: 0.7}),
    h('rect', {x: -t * 0.7, y: top + hB * 0.852, width: t * 0.3, height: hB * 0.018, fill: th.ink, opacity: 0.7}),
    h('rect', {x: -t, y: top, width: t * 0.22, height: hB, fill: '#fff', opacity: 0.14}),
  );
  // cover
  const tpY = top + hB * 0.18, tpH = hB * 0.3;
  const titleFit = showText ? ctx.fit(o.title, {maxWidth: cw * 0.66, size: cw * 0.1, minSize: 7, maxLines: 3, weight: 700, family: 'serif'}) : null;
  const edFit = showText && o.edition ? ctx.fit(o.edition, {maxWidth: cw * 0.7, size: cw * 0.07, minSize: 6, maxLines: 1, weight: 600}) : null;
  const cover = g({name: `${P}-cover`},
    h('path', {d: `M0 ${r(top)}H${r(cw - 6)}Q${r(cw)} ${r(top)} ${r(cw)} ${r(top + 6)}V${r(-top - 6)}Q${r(cw)} ${r(-top)} ${r(cw - 6)} ${r(-top)}H0Z`, fill: col, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: cw * 0.08, y: top + hB * 0.05, width: cw * 0.84, height: hB * 0.9, rx: 4, fill: 'none', stroke: GOLD, 'stroke-width': 2}),
    h('rect', {x: cw * 0.14, y: tpY, width: cw * 0.72, height: tpH, rx: 3, fill: '#f6ecd3', stroke: shade(col, -0.3), 'stroke-width': 1.4}),
    titleFit ? textBlock(titleFit, {x: cw / 2, y: tpY + (tpH - titleFit.height) / 2, anchor: 'middle', fill: th.ink}) : [bar(cw * 0.24, tpY + tpH * 0.3, cw * 0.52, tpH * 0.13, th.ink, {opacity: 0.6}), bar(cw * 0.3, tpY + tpH * 0.58, cw * 0.4, tpH * 0.13, th.ink, {opacity: 0.6})],
    edFit ? textBlock(edFit, {x: cw / 2, y: top + hB * 0.64, anchor: 'middle', fill: '#f6ecd3'}) : bar(cw * 0.34, top + hB * 0.66, cw * 0.32, hB * 0.018, '#f6ecd3', {opacity: 0.7}),
    h('path', {d: `M${r(cw * 0.5)} ${r(top + hB * 0.78)}l${r(cw * 0.06)} ${r(hB * 0.04)}l${r(-cw * 0.06)} ${r(hB * 0.04)}l${r(-cw * 0.06)} ${r(-hB * 0.04)}Z`, fill: GOLD}),
    h('rect', {x: 0, y: top, width: cw * 0.06, height: hB, fill: '#000', opacity: 0.2}),
  );
  // page geometry
  const m = cw * 0.1;
  const headY = top + hB * 0.06;
  const hs = Math.max(8, hB * 0.045);
  const bodyTop = top + hB * 0.16;
  const bh = Math.max(2.4, hB * 0.014);
  const lh = hB * 0.052;
  const footH = hB * 0.2;
  const footTop = -top - footH;
  const nLines = Math.max(4, Math.floor((footTop - 10 - bodyTop) / lh));
  // quoted passage: lines 2..4 on the left page, lines 0..1 on the right page
  const qL = [2, 3, 4].filter(i => i < nLines);
  const qR = [0, 1];
  const pageBody = (x0, x1, key, quoted, supAfter) => {
    const out = [];
    let hl = null;
    let sup = null;
    for (let i = 0; i < nLines; i++) {
      const ly = bodyTop + i * lh;
      const q = quoted.includes(i);
      const lastQ = q && i === quoted[quoted.length - 1];
      const wf = lastQ ? 0.62 : i === nLines - 1 ? 0.55 : 0.88 + ctx.rng(`${seedKey}-${key}`, i) * 0.12;
      const lw = (x1 - x0) * wf;
      if (q) {
        const box = {x: x0 - 3, y: ly - bh * 1.2, w: (x1 - x0) + 6, h: bh * 3.4};
        hl = hl ? {x: hl.x, y: hl.y, w: hl.w, h: box.y + box.h - hl.y} : box;
      }
      out.push(bar(x0, ly, lw, bh, q ? th.inkSoft : th.paperLine));
      if (lastQ && supAfter) sup = {x: x0 + lw + 6, y: ly - bh};
    }
    return {out, hl, sup};
  };
  const Lb = pageBody(-cw + m, -m * 0.8, 'L', qL, false);
  const Rb = pageBody(m * 0.8, cw - m, 'R', qR, true);
  const headFit = (text, maxW, weight = 700) => (showText && text ? ctx.fit(text, {maxWidth: maxW, size: hs, minSize: 6, maxLines: 1, weight}) : null);
  const pl = headFit(o.pageL, cw * 0.4);
  const pr = headFit(o.pageR, cw * 0.4);
  const runW = cw - m * 1.8 - Math.max(pl ? pl.width : 0, pr ? pr.width : 0) - 22;
  const runT = showText && runW > cw * 0.35 ? ctx.fit(o.title, {maxWidth: Math.min(cw * 0.55, runW), size: hs * 0.9, minSize: 6, maxLines: 1, weight: 500, family: 'serif'}) : null;
  const fs = Math.max(7, hB * 0.05);
  const fy = footTop + fs * 0.45;
  const numW = showText ? ctx.measure(o.innerNote, fs * 0.8, 800, 'sans') + 4 : fs * 0.5;
  const footFit = showText ? ctx.fit(o.foot, {maxWidth: cw - m * 2.2 - numW, size: fs, minSize: 6, maxLines: 3, weight: 500, family: 'serif'}) : null;
  const hookIn = {x: -cw + m * 0.42, y: Lb.hl ? Lb.hl.y + Lb.hl.h / 2 : bodyTop + lh * 3};
  const hookOut = {x: cw - m * 0.42, y: fy + fs * 0.45};
  const board = (x, w) => h('rect', {x: r(x), y: r(top - 5), width: r(w), height: r(hB + 10), rx: 5, fill: col, stroke: th.ink, 'stroke-width': 2});
  const hlRect = (b, name) => h('rect', {name, x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 3, fill: th.highlight, opacity: 0.9});
  const rightPage = g({name: `${P}-rp`, opacity: 0},
    board(-2, cw + 7),
    h('rect', {x: 0, y: top, width: cw, height: hB, fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}),
    h('rect', {x: 0, y: top, width: cw * 0.08, height: hB, fill: '#000', opacity: 0.08}),
    Rb.hl ? hlRect(Rb.hl, `${P}-hlR`) : null,
    Rb.out,
    runT ? textBlock(runT, {x: m * 0.8, y: headY, fill: th.inkSoft, italic: true}) : bar(m * 0.8, headY + 2, cw * 0.3, bh, th.paperLine),
    pr ? textBlock(pr, {x: cw - m, y: headY, anchor: 'end', fill: th.ink}) : bar(cw - m - cw * 0.12, headY + 2, cw * 0.12, bh * 1.3, th.ink, {opacity: 0.6}),
    // superscript inner note number after the quoted passage
    showText ? textBlock(ctx.fit(o.innerNote, {maxWidth: cw * 0.2, size: fs * 0.85, minSize: 6, maxLines: 1, weight: 800}), {x: Rb.sup.x, y: Rb.sup.y - fs * 0.35, fill: th.accent2}) : h('circle', {cx: Rb.sup.x + 3, cy: Rb.sup.y, r: fs * 0.25, fill: th.accent2}),
    h('line', {x1: m * 0.8, x2: m * 0.8 + cw * 0.3, y1: footTop, y2: footTop, stroke: th.inkSoft, 'stroke-width': 1.2}),
    h('rect', {name: `${P}-foot-hl`, x: r(m * 0.5), y: r(fy - 4), width: r(cw - m * 0.9), height: r(footH - fs * 0.3), rx: 5, fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 1.6, opacity: 0}),
    showText ? textBlock(ctx.fit(o.innerNote, {maxWidth: cw * 0.2, size: fs * 0.8, minSize: 6, maxLines: 1, weight: 800}), {x: m * 0.8, y: fy - fs * 0.1, fill: th.accent2}) : h('circle', {cx: m * 0.8 + 3, cy: fy + fs * 0.4, r: fs * 0.22, fill: th.accent2}),
    footFit ? textBlock(footFit, {x: m * 0.8 + numW, y: fy, fill: th.ink}) : [bar(m * 0.8 + numW, fy + fs * 0.25, cw * 0.62, bh * 1.2, th.inkSoft), bar(m * 0.8 + numW, fy + fs * 1.35, cw * 0.4, bh * 1.2, th.inkSoft)],
    eyelet(ctx, {name: `${P}-eyeOut`, x: hookOut.x, y: hookOut.y, rad: Math.max(5, cw * 0.035)}),
  );
  const leftPage = g({name: `${P}-lp`, opacity: 0},
    g({name: `${P}-lp-in`},
      board(-cw - 5, cw + 7),
      h('rect', {x: -cw, y: top, width: cw, height: hB, fill: th.paper, stroke: th.ink, 'stroke-width': 1.6}),
      h('rect', {x: -cw * 0.08, y: top, width: cw * 0.08, height: hB, fill: '#000', opacity: 0.08}),
      Lb.hl ? hlRect(Lb.hl, `${P}-hlL`) : null,
      Lb.out,
      pl ? textBlock(pl, {x: -cw + m, y: headY, fill: th.ink, name: `${P}-pageL`}) : bar(-cw + m, headY + 2, cw * 0.12, bh * 1.3, th.ink, {opacity: 0.6, name: `${P}-pageL`}),
      runT ? textBlock(runT, {x: -m * 0.8, y: headY, anchor: 'end', fill: th.inkSoft, italic: true}) : bar(-m * 0.8 - cw * 0.3, headY + 2, cw * 0.3, bh, th.paperLine),
      eyelet(ctx, {name: `${P}-eyeIn`, x: hookIn.x, y: hookIn.y, rad: Math.max(5, cw * 0.035)}),
    ),
  );
  const pageBlock = g({name: `${P}-block`, opacity: 0},
    [3, 2, 1].map(i => h('rect', {x: i * 1.8, y: top + i * 2.2, width: cw, height: hB, rx: 3, fill: i % 2 ? th.paper : th.paperShade, stroke: th.ink, 'stroke-width': 1})),
  );
  const shadowN = h('path', {name: `${P}-shadow`, d: 'M0 0', fill: th.shadow, opacity: 0});
  const node = g({name: P}, shadowN, pageBlock, rightPage, leftPage, spine, cover);

  /**
   * @param {{x:number, y:number, k:number, turn:number, open:number, shadow?:number}} s
   */
  function frame(s) {
    const nodes = {};
    const th0 = clamp(s.turn) * Math.PI / 2;
    const phi = clamp(s.open) * Math.PI;
    const cs = Math.cos(th0), sn = Math.sin(th0), cf = Math.cos(phi);
    nodes[P] = {transform: T(s.x, s.y, 0, s.k)};
    nodes[`${P}-spine`] = {transform: `scale(${r(Math.max(0.001, cs), 4)} 1)`, opacity: cs > 0.02 ? 1 : 0};
    const coverSx = sn * Math.max(0, cf);
    nodes[`${P}-cover`] = {transform: `scale(${r(Math.max(0.001, coverSx), 4)} 1)`, opacity: coverSx > 0.01 ? 1 : 0};
    const onFace = s.turn >= 0.999;
    nodes[`${P}-rp`] = {opacity: onFace && s.open > 0.001 ? 1 : 0};
    nodes[`${P}-block`] = {opacity: onFace && s.open < 0.5 && s.open > 0.001 ? 1 : 0};
    const lsx = Math.max(0, -cf);
    nodes[`${P}-lp`] = {opacity: lsx > 0.01 ? 1 : 0};
    nodes[`${P}-lp-in`] = {transform: `scale(${r(Math.max(0.001, lsx), 4)} 1)`};
    const L = -t * Math.max(0.001, cs) - cw * lsx, R = Math.max(cw * coverSx, s.open > 0.001 && onFace ? cw : 0);
    nodes[`${P}-shadow`] = {opacity: r(clamp(s.shadow ?? 0), 3), d: roundRectPath(r(L + 8), r(top + 12), r(Math.max(1, R - L)), r(hB), 6)};
    return nodes;
  }
  /** local → world for a pose */
  const world = (s, q) => ({x: s.x + q.x * s.k, y: s.y + q.y * s.k});
  /** free edge of the cover (local) while it opens */
  const coverEdge = (s, yy = hB * 0.08) => ({x: cw * Math.cos(clamp(s.open) * Math.PI) * Math.sin(clamp(s.turn) * Math.PI / 2), y: yy});
  // alternative incoming point: the passage at the top of the right page (gutter-side margin)
  const hookInR = {x: m * 0.36, y: Rb.hl ? Rb.hl.y + Rb.hl.h / 2 : bodyTop + lh};
  return {node, frame, world, coverEdge, t, hB, cw, top, hookIn, hookInR, hookOut, grip: {x: 0, y: hB * 0.2}, P, quoteL: Lb.hl, quoteR: Rb.hl, footTop, headY, bodyTop, lh};
}

/* ------------------------------------------------------------------ */
/* Source document (original folio) and archive box                    */
/* ------------------------------------------------------------------ */

/**
 * Aged original folio with four numbered entries. Local origin: top-left.
 * The cited entry is highlighted; `hookAt(i)` gives the eyelet point of
 * entry i. Nodes: `${P}-hl` (highlight, move with transform), `${P}-eye`.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, title:string, folio:string, date:string, entry:number, entryLabels?:string[], showText:boolean}} o
 */
export function sourceFolio(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w} = o;
  const hh = o.h;
  const pad = w * 0.1;
  const inner = w - pad * 2;
  // deckled outline
  const edge = [];
  const n = 14;
  for (let i = 0; i <= n; i++) edge.push({x: (w * i) / n, y: (ctx.rng(`${P}-et`, i) - 0.5) * 3});
  for (let i = 1; i <= n; i++) edge.push({x: w + (ctx.rng(`${P}-er`, i) - 0.5) * 3, y: (hh * i) / n});
  for (let i = n - 1; i >= 0; i--) edge.push({x: (w * i) / n, y: hh + (ctx.rng(`${P}-eb`, i) - 0.5) * 3});
  for (let i = n - 1; i >= 1; i--) edge.push({x: (ctx.rng(`${P}-el`, i) - 0.5) * 3, y: (hh * i) / n});
  const outline = `M${edge.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}Z`;
  const parts = [];
  parts.push(h('path', {d: outline, fill: th.shadow, transform: 'translate(7 10)'}));
  // tab for pulling the folio out of its box
  const tabW = w * 0.26;
  parts.push(h('path', {d: roundRectPath(w / 2 - tabW / 2, -hh * 0.07, tabW, hh * 0.1, 6), fill: AGED.shade, stroke: AGED.line, 'stroke-width': 2}));
  parts.push(h('path', {d: outline, fill: AGED.paper, stroke: AGED.line, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${r(w * 0.72)} 0Q${r(w * 0.86)} ${r(hh * 0.14)} ${r(w)} ${r(hh * 0.1)}`, fill: 'none', stroke: AGED.shade, 'stroke-width': 7, opacity: 0.6}));
  // header: title (left) + folio (right)
  const hs = Math.max(10, w * 0.058);
  let y = pad * 0.9;
  let folioFit = null;
  if (o.showText) {
    // folio number top-left (the holding hand covers the top-right corner)
    folioFit = ctx.fit(o.folio, {maxWidth: inner * 0.6, size: hs * 1.12, minSize: 8, maxLines: 1, weight: 700, family: 'serif'});
    parts.push(textBlock(folioFit, {x: pad, y, fill: AGED.ink, italic: true, name: `${P}-folio`}));
    y += folioFit.height + hs * 0.6;
    const tf = ctx.fit(o.title, {maxWidth: inner * 0.8, size: hs, minSize: 8, maxLines: 2, weight: 700, family: 'serif', leading: 1.34});
    parts.push(textBlock(tf, {x: pad, y, fill: AGED.ink}));
    y += tf.height + hs * 0.95;
    const df = ctx.fit(o.date, {maxWidth: inner * 0.8, size: hs * 0.85, minSize: 8, maxLines: 1, weight: 500, family: 'serif'});
    parts.push(textBlock(df, {x: pad, y, fill: AGED.line, italic: true}));
    y += df.height + hs * 0.6;
  } else {
    parts.push(bar(pad, y + 2, inner * 0.24, hs * 0.55, AGED.ink, {opacity: 0.8}));
    y += hs * 1.4;
    parts.push(bar(pad, y + 2, inner * 0.6, hs * 0.5, AGED.line, {opacity: 0.7}));
    y += hs * 1.3;
    parts.push(bar(pad, y, inner * 0.35, hs * 0.4, AGED.line, {opacity: 0.5}));
    y += hs * 1.2;
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: AGED.line, 'stroke-width': 1.4, opacity: 0.7}));
  y += hs * 0.6;
  // entries
  const sealR = w * 0.085;
  const bottom = hh - pad * 0.7 - sealR * 1.2;
  const each = (bottom - y) / 4;
  const numW = hs * 1.3;
  const entries = [];
  const labels = o.entryLabels || ['1', '2', '3', '4'];
  for (let i = 0; i < 4; i++) {
    const ey = y + i * each;
    const box = {x: pad + numW - 6, y: ey - each * 0.08, w: inner - numW + 10, h: each * 0.86};
    entries.push({box, hook: {x: pad * 0.55, y: box.y + box.h / 2}, labelPt: {x: pad + numW * 0.4, y: ey}});
  }
  const hl = entries[o.entry].box;
  parts.push(g({name: `${P}-hl-move`}, h('rect', {name: `${P}-hl`, x: r(hl.x), y: r(hl.y), width: r(hl.w), height: r(hl.h), rx: 5, fill: th.highlight, opacity: 0})));
  entries.forEach((e, i) => {
    const lines = 3;
    for (let l = 0; l < lines; l++) {
      const ly = e.box.y + e.box.h * (0.22 + l * 0.28);
      const x1 = e.box.x + 8 + (e.box.w - 16) * (l === lines - 1 ? 0.5 + ctx.rng(`${P}-ew`, i) * 0.3 : 0.92);
      parts.push(scribble(ctx, `${P}-s${i}-${l}`, e.box.x + 8, x1, ly, Math.max(2.2, each * 0.05), AGED.ink, Math.max(1.6, w * 0.009)));
    }
    if (labels[i]) {
      if (o.showText) {
        const lf = ctx.fit(labels[i], {maxWidth: numW + 4, size: hs * 0.95, minSize: 7, maxLines: 1, weight: 700, family: 'serif'});
        parts.push(textBlock(lf, {x: pad + numW * 0.3, y: e.box.y + e.box.h * 0.1, anchor: 'middle', fill: AGED.ink, name: `${P}-num${i}`}));
      } else {
        parts.push(h('circle', {name: `${P}-num${i}`, cx: pad + numW * 0.3, cy: e.box.y + e.box.h * 0.26, r: hs * 0.22, fill: AGED.ink}));
      }
    }
  });
  // wax seal
  const sc = {x: w - pad - sealR, y: hh - pad * 0.7 - sealR};
  parts.push(h('path', {d: `M${r(sc.x - sealR * 0.6)} ${r(sc.y + sealR * 0.6)}l${r(-sealR * 0.35)} ${r(sealR * 0.9)}l${r(sealR * 0.35)} ${r(-sealR * 0.2)}l${r(sealR * 0.25)} ${r(sealR * 0.3)}Z`, fill: '#a33a2e'}));
  parts.push(h('circle', {cx: sc.x, cy: sc.y, r: sealR, fill: '#b5433a', stroke: '#7d2a22', 'stroke-width': 2.2}));
  parts.push(h('circle', {cx: sc.x, cy: sc.y, r: sealR * 0.66, fill: 'none', stroke: '#7d2a22', 'stroke-width': 1.6}));
  parts.push(h('path', {d: starPath(sc.x, sc.y, sealR * 0.42, sealR * 0.18, 6), fill: '#7d2a22'}));
  const e0 = entries[o.entry].hook;
  const eye = eyelet(ctx, {name: `${P}-eye`, x: e0.x, y: e0.y, rad: Math.max(6, w * 0.032)});
  const node = g({name: P}, parts, g({name: `${P}-eyeG`}, eye));
  // grip: palm just outside the right edge near the top — the arm that holds the folio hangs
  // beside the page, never across it (the top-right corner is kept free of key content)
  return {node, w, h: hh, entries, hookAt: i => entries[i].hook, grip: {x: w + 12, y: hh * 0.13}, hl: `${P}-hl`, folioFit};
}

function starPath(cx, cy, R, rr, n) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n - Math.PI / 2;
    const rad = i % 2 ? rr : R;
    d += `${i ? 'L' : 'M'}${r(cx + rad * Math.cos(a))} ${r(cy + rad * Math.sin(a))}`;
  }
  return `${d}Z`;
}

/**
 * Open-top archive box. Local origin: bottom centre. `back` goes behind the
 * folios, `front` in front of them.
 */
export function archiveBox(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w} = o;
  const hh = o.h;
  const card = '#9fb2bf';
  const back = g({name: `${P}-back`},
    h('path', {d: roundRectPath(-w / 2 + 10, -hh - hh * 0.3, w - 20, hh * 0.5, 6), fill: shade(card, -0.28), stroke: th.ink, 'stroke-width': 2.2}),
    // other folios standing in the box
    [0.18, 0.62].map((fx, i) => h('path', {d: roundRectPath(-w / 2 + w * fx, -hh - hh * (0.22 + i * 0.06), w * 0.26, hh * 0.6, 3), fill: i ? '#efe3c4' : '#e8dcc0', stroke: AGED.line, 'stroke-width': 1.8})),
  );
  // plate and pull on the LEFT half: the hand reaches in on the right and never covers them
  const lw = w * 0.44, lh = hh * 0.32, lcx = -w / 2 + w * 0.06 + lw / 2;
  const labelFit = o.label && o.showText ? ctx.fit(o.label, {maxWidth: lw - 12, size: Math.min(lh * 0.5, 22), minSize: 10, maxLines: lh > 44 ? 2 : 1, weight: 700, leading: 1.1}) : null;
  const front = g({name: `${P}-front`},
    h('path', {d: roundRectPath(-w / 2 + 6, -hh + 9, w, hh, 8), fill: th.shadow}),
    h('path', {d: `M${r(-w / 2)} ${r(-hh)}H${r(w / 2)}V-6Q${r(w / 2)} 0 ${r(w / 2 - 6)} 0H${r(-w / 2 + 6)}Q${r(-w / 2)} 0 ${r(-w / 2)} -6Z`, fill: card, stroke: th.ink, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('rect', {x: -w / 2, y: -hh, width: w, height: hh * 0.08, fill: shade(card, 0.2)}),
    h('path', {d: roundRectPath(lcx - lw / 2, -hh * 0.7, lw, lh, 4), fill: '#fbf8ef', stroke: th.ink, 'stroke-width': 1.8}),
    labelFit ? textBlock(labelFit, {x: lcx, y: -hh * 0.7 + (lh - labelFit.height) / 2, anchor: 'middle', fill: th.ink}) : bar(lcx - lw * 0.3, -hh * 0.7 + lh * 0.4, lw * 0.6, lh * 0.2, th.inkSoft),
    h('path', {d: roundRectPath(lcx - w * 0.12, -hh * 0.26, w * 0.24, hh * 0.1, hh * 0.05), fill: shade(card, -0.45)}),
  );
  // optional hinged lid (hinge along the back top edge): the inner face rises behind the
  // opening as the lid swings up; the front band covers the opening while closed
  let lidBack = null, lidFront = null, lidFrame = null, lidEdge = null;
  if (o.lid) {
    const lw2 = w + 12, lf = hh * 0.2, D = hh * 0.82;
    const lidC = shade(card, -0.06);
    lidBack = h('path', {name: `${P}-lidB`, d: 'M0 0', fill: shade(card, 0.22), stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'});
    lidFront = g({name: `${P}-lidF`},
      h('path', {name: `${P}-lidF-band`, d: roundRectPath(-lw2 / 2, -hh - lf, lw2, lf * 1.3, 5), fill: lidC, stroke: th.ink, 'stroke-width': 2.4}),
    );
    const geo = open => {
      const th0 = clamp(open) * rad100;
      const sn = Math.sin(th0), cs = Math.cos(th0);
      const top = -hh - D * sn;
      return {sn, cs, top, band: Math.max(0, cs) * lf};
    };
    lidFrame = open => {
      const q = geo(open);
      const out = {};
      out[`${P}-lidB`] = {d: q.sn > 0.01 ? `M${r(-lw2 / 2)} ${r(-hh + 2)}L${r(-lw2 / 2 + 6)} ${r(q.top)}H${r(lw2 / 2 - 6)}L${r(lw2 / 2)} ${r(-hh + 2)}Z` : 'M0 0'};
      out[`${P}-lidF-band`] = {d: roundRectPath(r(-lw2 / 2), r(q.top - q.band), r(lw2), r(Math.max(0.5, q.band * 1.3)), 5), opacity: q.cs > 0.12 ? 1 : 0};
      return out;
    };
    // the fingers push the lid's front edge right of the plate (the plate and pull sit on the
    // left half), so the fist never covers the box label while it opens the lid
    lidEdge = open => {
      const q = geo(open);
      return {x: w * 0.24, y: q.top - q.band * 0.5};
    };
  }
  return {back, front, w, h: hh, lidBack, lidFront, lidFrame, lidEdge};
}

const rad100 = (100 * Math.PI) / 180;

/* ------------------------------------------------------------------ */
/* Catalogue search (buscador) and trail card (ficha)                  */
/* ------------------------------------------------------------------ */

/**
 * Wall-mounted catalogue screen. Absolute coordinates.
 * Nodes: `${P}-qclip` (typed reveal), `${P}-caret`, `${P}-hl` (result row),
 * `${P}-mark` (shelf-mark pill glow).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, title:string, query:string, result:string, mark:string, showText:boolean, mount?:'top'|'left'}} o
 */
export function catalogueScreen(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w} = o;
  const hh = o.h;
  const bz = Math.max(10, hh * 0.06);
  const sx = x + bz, sy = y + bz, sw = w - bz * 2, sh = hh - bz * 2;
  const pad = sw * 0.05;
  const titleS = Math.max(12, sh * 0.1);
  const fieldY = sy + sh * 0.22, fieldH = sh * 0.22;
  const qs = Math.max(12, fieldH * 0.5);
  const rowY = fieldY + fieldH + sh * 0.1, rowH = sh * 0.2;
  const rs = Math.max(11, rowH * 0.5);
  const parts = [];
  // wall bracket
  parts.push(h('rect', {x: x + w * 0.44, y: y - 26, width: w * 0.12, height: 30, rx: 4, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 16), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, hh, 16), fill: '#2b3137', stroke: th.ink, 'stroke-width': 2.6}));
  parts.push(h('path', {d: roundRectPath(sx, sy, sw, sh, 8), fill: '#eef3f6'}));
  // title bar with magnifier
  const mg = {x: sx + pad + titleS * 0.45, y: sy + sh * 0.1};
  parts.push(h('circle', {cx: mg.x, cy: mg.y, r: titleS * 0.36, fill: 'none', stroke: th.accent2, 'stroke-width': 2.6}));
  parts.push(h('line', {x1: mg.x + titleS * 0.26, y1: mg.y + titleS * 0.26, x2: mg.x + titleS * 0.56, y2: mg.y + titleS * 0.56, stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round'}));
  if (o.showText) {
    const tf = ctx.fit(o.title, {maxWidth: sw - pad * 2 - titleS * 1.4, size: titleS, minSize: 9, maxLines: 1, weight: 700});
    parts.push(textBlock(tf, {x: mg.x + titleS * 0.9, y: mg.y - tf.size * 0.55, fill: th.ink}));
  } else parts.push(bar(mg.x + titleS * 0.9, mg.y - titleS * 0.18, sw * 0.4, titleS * 0.36, th.inkSoft, {opacity: 0.5}));
  // search field with a typed reveal
  parts.push(h('path', {d: roundRectPath(sx + pad, fieldY, sw - pad * 2, fieldH, fieldH / 2), fill: '#ffffff', stroke: th.accent2, 'stroke-width': 2.4}));
  const qx0 = sx + pad + fieldH * 0.45;
  const qMax = sw - pad * 2 - fieldH * 0.9;
  let qFit = null;
  let qW = qMax * 0.7;
  if (o.showText) {
    qFit = ctx.fit(o.query, {maxWidth: qMax, size: qs, minSize: Math.max(9, qs * 0.62), maxLines: 1, weight: 600});
    qW = qFit.width;
  }
  parts.push(h('defs', null, h('clipPath', {id: ctx.id(`${P}-qc`)}, h('rect', {name: `${P}-qclip`, x: r(qx0 - 2), y: r(fieldY), width: 0, height: r(fieldH)}))));
  parts.push(g({'clip-path': ctx.ref(`${P}-qc`)},
    qFit ? textBlock(qFit, {x: qx0, y: fieldY + (fieldH - qFit.size) / 2 - 1, fill: th.ink}) : bar(qx0, fieldY + fieldH * 0.4, qW, fieldH * 0.22, th.ink, {opacity: 0.7})));
  parts.push(h('line', {name: `${P}-caret`, x1: qx0, x2: qx0, y1: fieldY + fieldH * 0.22, y2: fieldY + fieldH * 0.78, stroke: th.accent2, 'stroke-width': 2.4}));
  // results
  parts.push(h('path', {name: `${P}-hl`, d: roundRectPath(sx + pad * 0.6, rowY - rowH * 0.1, sw - pad * 1.2, rowH * 1.2, 8), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2, opacity: 0}));
  const markS = rs * 0.95;
  let markW = markS * 3.4;
  let markFit = null;
  if (o.showText) {
    markFit = ctx.fit(o.mark, {maxWidth: sw * 0.3, size: markS, minSize: 8, maxLines: 1, weight: 800});
    markW = markFit.width + markS * 1.1;
  }
  const bookI = {x: sx + pad, y: rowY + rowH * 0.1, w: rowH * 0.5, h: rowH * 0.8};
  parts.push(h('rect', {x: bookI.x, y: bookI.y, width: bookI.w, height: bookI.h, rx: 2, fill: TREATISE, stroke: th.ink, 'stroke-width': 1.4}));
  const rx0 = bookI.x + bookI.w + pad * 0.6;
  const markX = sx + sw - pad - markW;
  if (o.showText) {
    const rf = ctx.fit(o.result, {maxWidth: markX - rx0 - pad * 0.5, size: rs, minSize: 8, maxLines: 1, weight: 700});
    parts.push(textBlock(rf, {x: rx0, y: rowY + (rowH - rf.size) / 2, fill: th.ink}));
  } else parts.push(bar(rx0, rowY + rowH * 0.36, (markX - rx0) * 0.8, rowH * 0.26, th.ink, {opacity: 0.7}));
  const markBox = {x: markX, y: rowY + rowH * 0.08, w: markW, h: rowH * 0.84};
  parts.push(g({name: `${P}-mark`},
    h('path', {d: roundRectPath(markBox.x, markBox.y, markBox.w, markBox.h, markBox.h / 2), fill: '#e8d9a8', stroke: BRASS.dark, 'stroke-width': 2}),
    markFit ? textBlock(markFit, {x: markBox.x + markBox.w / 2, y: markBox.y + (markBox.h - markFit.size) / 2, anchor: 'middle', fill: '#3b2f14'}) : bar(markBox.x + markBox.w * 0.25, markBox.y + markBox.h * 0.4, markBox.w * 0.5, markBox.h * 0.2, '#3b2f14')));
  // second (dimmer) result row
  const r2 = rowY + rowH * 1.35;
  if (r2 + rowH * 0.6 < sy + sh - pad * 0.3) {
    parts.push(h('rect', {x: bookI.x, y: r2 + rowH * 0.1, width: bookI.w, height: bookI.h * 0.8, rx: 2, fill: SPINES[0], opacity: 0.55}));
    parts.push(bar(rx0, r2 + rowH * 0.3, (markX - rx0) * 0.6, rowH * 0.2, th.paperLine));
  }
  return {node: g({name: P}, parts), qx0, qW, caretY: [fieldY + fieldH * 0.22, fieldY + fieldH * 0.78], markBox, box: {x, y, w, h: hh}};
}

/**
 * Fit text; when it wraps, the width is narrowed to the smallest one that keeps the same line
 * count and size, so the lines are balanced (no single orphaned word).
 */
function balancedFit(ctx, text, o) {
  const f = ctx.fit(text, o);
  if (f.lines.length < 2 || f.truncated) return f;
  let lo = o.maxWidth * 0.45, hi = o.maxWidth, best = f;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    const q = ctx.fit(text, {...o, maxWidth: mid});
    if (q.lines.length === f.lines.length && !q.truncated && q.size === f.size) { best = q; hi = mid; } else lo = mid;
  }
  return best;
}

/**
 * Citation-trail index card (ficha). Local origin: card centre.
 * A plain strip on the left edge is where the holding thumb rests.
 * Rows: `${P}-row{i}` (pending → recorded), `${P}-row{i}-on` (chain-link
 * badge), `${P}-row{i}-dash` (dashed badge: cited, not followed). Each row
 * shows the work (up to two lines) and, right-aligned, its place (note /
 * page / folio). `alt` adds an italic line to row 3 (e.g. "as cited in …").
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, title:string, mark:string, rows:Array<{title:string, place:string}>, alt?:string|null, showText:boolean, maxLines?:number}} o
 */
export function trailCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w} = o;
  const hh = o.h;
  const x0 = -w / 2, y0 = -hh / 2;
  const strip = w * 0.085;
  const pad = w * 0.045;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(x0 + 6, y0 + 9, w, hh, 8), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x0, y0, w, hh, 8), fill: CARD.paper, stroke: th.ink, 'stroke-width': 2.4}));
  parts.push(h('line', {x1: x0 + strip, x2: x0 + strip, y1: y0 + 4, y2: y0 + hh - 4, stroke: CARD.rule, 'stroke-width': 1.6, opacity: 0.7}));
  const hs = o.headSize ?? Math.max(12, hh * 0.085);
  const headH = hs * 1.9;
  const cx0 = x0 + strip + pad;
  parts.push(h('line', {x1: x0 + strip, x2: x0 + w - 4, y1: y0 + headH, y2: y0 + headH, stroke: CARD.rule, 'stroke-width': 2.4}));
  if (o.showText) {
    const mf = ctx.fit(o.mark, {maxWidth: w * 0.3, size: hs, minSize: 9, maxLines: 1, weight: 800});
    const tf = ctx.fit(o.title, {maxWidth: x0 + w - pad - mf.width - 14 - cx0, size: hs, minSize: 9, maxLines: 1, weight: 700});
    parts.push(textBlock(tf, {x: cx0, y: y0 + (headH - tf.size) / 2, fill: th.ink}));
    parts.push(textBlock(mf, {x: x0 + w - pad, y: y0 + (headH - mf.size) / 2, anchor: 'end', fill: BRASS.dark}));
  } else {
    parts.push(bar(cx0, y0 + headH * 0.38, w * 0.4, headH * 0.24, th.ink, {opacity: 0.6}));
    parts.push(bar(x0 + w - pad - w * 0.14, y0 + headH * 0.38, w * 0.14, headH * 0.24, BRASS.dark));
  }
  let rowsTop = y0 + headH + hh * 0.02;
  let rowH = (y0 + hh - hh * 0.04 - rowsTop) / 3;
  const badgeR = Math.min(rowH * 0.3, hs * 0.85);
  const ts = o.textSize ?? Math.max(11, Math.min(rowH * 0.33, hs * 1.0));
  const textX = cx0 + badgeR * 2 + pad * 0.8;
  const right = x0 + w - pad;
  // rows whose work title needs a third line make every row (and the card) taller
  let maxLines = o.maxLines ?? 2;
  if (o.showText && !o.grown) {
    const need3 = o.rows.some(row => {
      const pw = ctx.fit(row.place, {maxWidth: w * 0.3, size: ts, minSize: Math.max(9, ts * 0.75), maxLines: 1, weight: 800}).width;
      return ctx.fit(row.title, {maxWidth: right - pw - pad * 0.8 - textX, size: ts, minSize: Math.max(9, ts * 0.75), maxLines: 2, weight: 600}).truncated;
    });
    if (need3 && o.maxW && w < o.maxW) return trailCard(ctx, {...o, w: o.maxW, headSize: hs, textSize: ts});
    if (need3) {
      maxLines = 3;
      const need = ts * 1.18 * 2 + ts + ts * 0.8;
      if (need > rowH) {
        const grow = (need - rowH) * 3;
        rowH = need;
        return trailCard(ctx, {...o, h: hh + grow, maxLines: 3, grown: true, headSize: hs, textSize: ts});
      }
    }
  }
  // altWrap (contrast): the third row gives the work title and the "as cited in …" line two
  // lines each instead of an ellipsis; the alternative text (or its reserve, for the card that
  // never shows it) sizes that row, so cards with and without it share one layout
  let rowHs = [rowH, rowH, rowH];
  const wrapAlt = o.altWrap && o.showText && (o.alt || o.altSlot);
  // (the two lines are balanced: no word is left alone on the second line)
  const fitRow = i => {
    const row = o.rows[i];
    const pf = ctx.fit(row.place, {maxWidth: w * 0.3, size: ts, minSize: Math.max(9, ts * 0.75), maxLines: 1, weight: 800});
    const tf = balancedFit(ctx, row.title, {maxWidth: right - pf.width - pad * 0.8 - textX, size: ts, minSize: Math.max(9, ts * 0.75), maxLines: 2, weight: 600});
    const altText = o.alt || o.altReserve || ' ';
    const af = balancedFit(ctx, altText, {maxWidth: right - textX, size: ts * 0.86, minSize: 10, maxLines: 2, weight: 500});
    return {pf, tf, af};
  };
  if (wrapAlt) {
    const {tf, af} = fitRow(2);
    const needAlt = tf.height + ts * 0.45 + af.height + ts * 0.8;
    const needStd = Math.min(rowH, ts * 1.18 * 2 + ts * 0.6);
    const avail = rowH * 3;
    if (needAlt + needStd * 2 > avail + 0.5) return trailCard(ctx, {...o, h: hh + (needAlt + needStd * 2 - avail), grown: true, headSize: hs, textSize: ts});
    rowHs = [(avail - needAlt) / 2, (avail - needAlt) / 2, needAlt];
  }
  const rows = [];
  let ry = rowsTop;
  for (let i = 0; i < 3; i++) {
    const rH = rowHs[i];
    if (i < 2) parts.push(h('line', {x1: x0 + strip, x2: x0 + w - 4, y1: ry + rH, y2: ry + rH, stroke: CARD.line, 'stroke-width': 1.4}));
    const bc = {x: cx0 + badgeR, y: ry + rH / 2};
    const row = o.rows[i];
    const texts = [];
    // row 3 can reserve a second line (altSlot) so cards with and without it share one layout
    const isAlt = i === 2 && (o.alt || o.altSlot);
    if (o.showText && isAlt && wrapAlt) {
      // title (and place) at the top of the row, the alternative line below it
      const {pf, tf, af} = fitRow(i);
      const ty = ry + ts * 0.4;
      texts.push(textBlock(pf, {x: right, y: ty + (tf.size - pf.size), anchor: 'end', fill: th.accent2, name: `${P}-row${i}-p`}));
      texts.push(textBlock(tf, {x: textX, y: ty, fill: th.ink, name: `${P}-row${i}-t`}));
      if (o.alt) texts.push(textBlock(af, {x: textX, y: ty + tf.height + ts * 0.45, fill: th.inkSoft, italic: true, name: `${P}-row${i}-alt`, opacity: 0}));
    } else if (o.showText) {
      const pf = ctx.fit(row.place, {maxWidth: w * 0.3, size: ts, minSize: Math.max(9, ts * 0.75), maxLines: 1, weight: 800});
      texts.push(textBlock(pf, {x: right, y: bc.y - pf.size * 0.55 - (isAlt ? ts * 0.45 : 0), anchor: 'end', fill: th.accent2, name: `${P}-row${i}-p`}));
      const tw = right - pf.width - pad * 0.8 - textX;
      const tf = ctx.fit(row.title, {maxWidth: tw, size: ts, minSize: Math.max(9, ts * 0.75), maxLines: isAlt ? 1 : maxLines, weight: 600});
      const af = isAlt ? ctx.fit(o.alt || ' ', {maxWidth: right - textX - pf.width - pad * 0.8, size: ts * 0.86, minSize: 10, maxLines: 1, weight: 500}) : null;
      const gapA = ts * 0.45;
      const blockH = tf.height + (af ? af.height + gapA : 0);
      texts.push(textBlock(tf, {x: textX, y: bc.y - blockH / 2, fill: th.ink, name: `${P}-row${i}-t`}));
      // the alternative line only appears once the row is recorded
      if (af && o.alt) texts.push(textBlock(af, {x: textX, y: bc.y - blockH / 2 + tf.height + gapA, fill: th.inkSoft, italic: true, name: `${P}-row${i}-alt`, opacity: 0}));
    } else {
      texts.push(bar(textX, bc.y - ts * 0.18, (right - textX) * (0.5 + 0.08 * i), ts * 0.36, th.ink, {opacity: 0.55}));
      texts.push(bar(right - w * 0.1, bc.y - ts * 0.18, w * 0.1, ts * 0.36, th.accent2));
    }
    rows.push({badge: bc, y: ry, h: rH});
    ry += rH;
    parts.push(g({name: `${P}-row${i}`, opacity: 0.35},
      h('circle', {cx: bc.x, cy: bc.y, r: badgeR, fill: '#ffffff', stroke: th.inkSoft, 'stroke-width': 2}),
      g({name: `${P}-row${i}-on`, opacity: 0},
        h('circle', {cx: bc.x, cy: bc.y, r: badgeR, fill: BRASS.mid, stroke: BRASS.dark, 'stroke-width': 2.4}),
        h('rect', {x: bc.x - badgeR * 0.62, y: bc.y - badgeR * 0.3, width: badgeR * 0.8, height: badgeR * 0.6, rx: badgeR * 0.3, fill: 'none', stroke: '#fff', 'stroke-width': 2.4}),
        h('rect', {x: bc.x - badgeR * 0.18, y: bc.y - badgeR * 0.3, width: badgeR * 0.8, height: badgeR * 0.6, rx: badgeR * 0.3, fill: 'none', stroke: '#fff', 'stroke-width': 2.4})),
      h('circle', {name: `${P}-row${i}-dash`, cx: bc.x, cy: bc.y, r: badgeR * 0.72, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.6, 'stroke-dasharray': '3 4', opacity: 0}),
      texts,
    ));
  }
  if (o.pin) {
    // brass push pin at the top edge (the card is pinned to the counter front)
    parts.push(h('ellipse', {cx: 4, cy: y0 + 10, rx: 12, ry: 6, fill: th.shadow}));
    parts.push(h('circle', {cx: 0, cy: y0 + 4, r: 11, fill: BRASS.mid, stroke: BRASS.dark, 'stroke-width': 2.4}));
    parts.push(h('circle', {cx: -3, cy: y0 + 1, r: 3.5, fill: BRASS.light}));
  }
  const node = g({name: P}, parts);
  return {node, w, h: hh, rows, x0, y0, ts, strip, grip: {x: x0 + strip * 0.3, y: y0 + hh * 0.62}};
}

/* ------------------------------------------------------------------ */
/* Library furniture                                                   */
/* ------------------------------------------------------------------ */

/**
 * Front-view bookcase with seeded spines and brass shelf plates. The target
 * slot (for the intermediate reference) is left free; its plate shows the
 * shelf mark and can glow (`${P}-plate-glow`).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, rows?:number, targetRow?:number, targetX:number, bookT:number, bookH:number, mark:string, showText:boolean, seedKey?:string}} o
 */
export function bookcase(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const seedKey = o.seedKey || 'trail-case';
  const rows = o.rows ?? 3;
  const side = Math.max(16, o.w * 0.03);
  const topB = 22;
  const board = 26;
  const plinth = 18;
  const inner = {x: o.x + side, w: o.w - side * 2};
  const rowH = (o.h - topB - plinth - board * rows) / rows;
  const wood = th.wood;
  const back = shade(wood, -0.55);
  const parts = [];
  parts.push(h('path', {d: roundRectPath(o.x + 8, o.y + 12, o.w, o.h, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 10), fill: wood, stroke: th.ink, 'stroke-width': th.stroke}));
  const tRow = clamp(o.targetRow ?? 1, 0, rows - 1);
  let slot = null;
  const rowsG = [];
  for (let ri = 0; ri < rows; ri++) {
    const top = o.y + topB + ri * (rowH + board);
    const bottom = top + rowH;
    rowsG.push({top, bottom});
    parts.push(h('rect', {x: inner.x, y: top, width: inner.w, height: rowH, fill: back}));
    parts.push(h('rect', {x: inner.x, y: top, width: inner.w, height: 9, fill: '#000', opacity: 0.2}));
    let x = inner.x + 5;
    let n = 0;
    const gap = ri === tRow ? {a: o.targetX - o.bookT - 4, b: o.targetX + 4} : null;
    while (x < inner.x + inner.w - 12) {
      const R = k => ctx.rng(`${seedKey}-${k}`, ri * 50 + n);
      let w = o.bookT * (0.62 + R('w') * 0.6);
      const hh = Math.min(rowH - 6, o.bookH * (0.78 + R('h') * 0.26));
      if (gap && x + w > gap.a && x < gap.b) {
        slot = {hingeX: o.targetX, cy: bottom - o.bookH / 2, top: bottom - o.bookH, bottom, row: ri};
        parts.push(h('rect', {x: r(gap.a + 1), y: r(bottom - o.bookH - 4), width: r(gap.b - gap.a - 2), height: r(o.bookH + 4), fill: '#000', opacity: 0.35}));
        x = gap.b + 1;
        n++;
        continue;
      }
      if (x + w > inner.x + inner.w - 5) {
        w = inner.x + inner.w - 5 - x;
        if (w < Math.max(7, o.bookT * 0.4)) break;
      }
      const col = SPINES[Math.floor(R('c') * SPINES.length)];
      const lean = R('l') > 0.93 && ri !== tRow ? -5 : 0;
      parts.push(g({transform: lean ? `rotate(${lean} ${r(x)} ${r(bottom)})` : null},
        h('rect', {x: r(x), y: r(bottom - hh), width: r(w), height: r(hh), rx: 2, fill: col, stroke: th.ink, 'stroke-width': 1.6}),
        h('rect', {x: r(x + 2), y: r(bottom - hh + hh * 0.1), width: r(Math.max(1, w - 4)), height: r(Math.max(3, hh * 0.03)), fill: '#d9b45a', opacity: 0.85}),
        h('rect', {x: r(x + 2), y: r(bottom - hh * 0.2), width: r(Math.max(1, w - 4)), height: r(Math.max(3, hh * 0.03)), fill: '#d9b45a', opacity: 0.85}),
        R('p') > 0.5 ? h('rect', {x: r(x + w * 0.22), y: r(bottom - hh * 0.62), width: r(w * 0.56), height: r(hh * 0.15), rx: 2, fill: '#f3ead3', opacity: 0.9}) : null,
      ));
      x += w + 1;
      n++;
    }
    parts.push(h('rect', {x: inner.x - 2, y: bottom, width: inner.w + 4, height: board, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}));
    parts.push(h('rect', {x: inner.x - 2, y: bottom + board - 6, width: inner.w + 4, height: 6, fill: shade(th.woodTop, -0.18)}));
  }
  if (!slot) {
    const row = rowsG[tRow];
    slot = {hingeX: o.targetX, cy: row.bottom - o.bookH / 2, top: row.bottom - o.bookH, bottom: row.bottom, row: tRow};
  }
  // brass plates: the target row's plate carries the shelf mark
  const plateH = board - 7;
  const plates = rowsG.map((row, i) => {
    const target = i === tRow;
    const pw = target ? Math.min(inner.w * 0.4, 150) : Math.min(inner.w * 0.18, 64);
    const px = target ? clamp(o.targetX - pw / 2, inner.x + 6, inner.x + inner.w - pw - 6) : inner.x + 14;
    const py = row.bottom + 3.5;
    const f = target && o.showText ? ctx.fit(o.mark, {maxWidth: pw - 14, size: plateH * 0.8, minSize: 9, maxLines: 1, weight: 800}) : null;
    return {box: {x: px, y: py, w: pw, h: plateH}, node: g({name: target ? `${P}-plate` : null},
      target ? h('path', {name: `${P}-plate-glow`, d: roundRectPath(px - 6, py - 6, pw + 12, plateH + 12, 8), fill: th.highlight, opacity: 0}) : null,
      h('path', {d: roundRectPath(px, py, pw, plateH, 4), fill: '#e8d9a8', stroke: shade('#e8d9a8', -0.5), 'stroke-width': 1.6}),
      f ? textBlock(f, {x: px + pw / 2, y: py + (plateH - f.size) / 2 + 1, anchor: 'middle', fill: '#3b2f14'}) : bar(px + pw * 0.25, py + plateH * 0.38, pw * 0.5, plateH * 0.24, '#8a7a4a'),
    )};
  });
  const node = g({name: P}, parts, plates.map(pl => pl.node));
  return {node, slot, rows: rowsG, rowH, inner, plate: plates[tRow].box, box: {x: o.x, y: o.y, w: o.w, h: o.h}};
}

/** Slanted reading lectern (front view). The page rests on `board`. */
export function lectern(ctx, {prefix, board, footY}) {
  const th = ctx.theme;
  const {x, y, w} = board;
  const hh = board.h;
  const cx = x + w / 2;
  const colW = w * 0.12;
  return g({name: prefix},
    h('path', {d: roundRectPath(cx - w * 0.3 + 8, footY - 14, w * 0.6, 14, 6), fill: th.shadow}),
    h('rect', {x: cx - colW / 2, y: y + hh - 10, width: colW, height: footY - (y + hh) + 4, fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(cx - w * 0.28, footY - 16, w * 0.56, 16, 6), fill: th.wood, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(x + 10)} ${r(y)}H${r(x + w - 10)}L${r(x + w)} ${r(y + hh)}H${r(x)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x + 16)} ${r(y + 10)}H${r(x + w - 16)}L${r(x + w - 8)} ${r(y + hh - 10)}H${r(x + 8)}Z`, fill: shade(th.woodTop, -0.08)}),
    h('rect', {x: x - 6, y: y + hh - 4, width: w + 12, height: 16, rx: 5, fill: th.wood, stroke: th.ink, 'stroke-width': 2.2}),
  );
}

/** Book cradle: two foam wedges under an open spread + base, on a surface. */
export function cradle(ctx, {prefix, x, y, w, baseY}) {
  const th = ctx.theme;
  const foam = th.dark ? '#5b636c' : '#8d979f';
  const half = w / 2;
  return g({name: prefix},
    h('path', {d: roundRectPath(x - half - 6 + 8, baseY - 16, w + 12, 16, 6), fill: th.shadow}),
    h('path', {d: `M${r(x - half * 0.92)} ${r(y)}L${r(x - 8)} ${r(y - 22)}V${r(baseY - 10)}H${r(x - half * 0.92)}Z`, fill: foam, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x + half * 0.92)} ${r(y)}L${r(x + 8)} ${r(y - 22)}V${r(baseY - 10)}H${r(x + half * 0.92)}Z`, fill: shade(foam, -0.1), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(x - half - 6, baseY - 14, w + 12, 14, 5), fill: '#5f6b75', stroke: th.ink, 'stroke-width': 2}),
  );
}

/** Library wall + counter inside a rounded window. Returns layers + clip. */
export function bayWindow(ctx, {prefix, box, counterY, radius = 26}) {
  const th = ctx.theme;
  const {x, y, w} = box;
  const hh = box.h;
  const wall = th.dark ? '#34383e' : '#efe7d8';
  const wall2 = th.dark ? '#2e3237' : '#e7ddcb';
  const clipId = `${prefix}-clip`;
  const bg = g({name: `${prefix}-bg`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(x, y, w, hh, radius)}))),
    h('path', {d: roundRectPath(x, y, w, hh, radius), fill: wall}),
    g({'clip-path': ctx.ref(clipId)},
      // wainscot and counter
      h('rect', {x, y: counterY - 60, width: w, height: 60, fill: wall2}),
      h('rect', {x, y: counterY, width: w, height: 26, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x, y: counterY + 26, width: w, height: y + hh - counterY - 26, fill: th.wood}),
      h('rect', {x, y: counterY + 26, width: w, height: 10, fill: '#000', opacity: 0.16}),
      [0.25, 0.5, 0.75].map(f => h('rect', {x: x + w * f - 3, y: counterY + 40, width: 6, height: y + hh - counterY - 40, fill: shade(th.wood, -0.12)})),
    ),
  );
  const frame = h('path', {d: roundRectPath(x, y, w, hh, radius), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2});
  return {bg, frame, clip: ctx.ref(clipId)};
}

/**
 * First-person bay placements per layout shape (design units): props, arm
 * shoulders (off-frame), rest and hand points, chain routing. The story and the
 * inspect use the three frame shapes; the contrast scales the compact 'pair'
 * bay (16:9, 9:16) or its stacked 'pairTall' variant (1:1) into each panel.
 * @param {'landscape'|'square'|'portrait'|'pair'|'pairTall'} shape
 */
export function bayPlacement(shape) {
  if (shape === 'pair') {
    // Compact bay for the paired panels of the contrast: a short shelf (with the treatise's
    // empty slot) and the catalogue screen on the wall; lectern, cradle and hinged archive box
    // share one counter so each prop is large. The right arm always enters from the right edge
    // (bendR −1): it never crosses the box plate, the card or the counter front, and it never
    // leaves the frame (its rest is on the counter's right end). The counter front between the
    // card and that hand (insetZone) stays free for the close-up of the card's third row.
    return {
      size: [1200, 800],
      box: {x: 8, y: 8, w: 1184, h: 784}, counterY: 540,
      bookcase: {x: 22, y: 20, w: 336, h: 196, rows: 1, targetRow: 0, targetX: 300},
      screen: {x: 384, y: 38, w: 400, h: 170},
      lecternBoard: {x: 22, y: 226, w: 336, h: 282},
      page: {x: 46, y: 234, w: 288, h: 262},
      book: {t: 38, hB: 260, cw: 184}, shelfK: 0.46, bookK: 1.0,
      cradle: {x: 578, y: 382},
      archive: {x: 975, y: 540, w: 280, h: 150},
      folio: {w: 236, h: 306, inBoxK: 0.74, stickOut: 70, stickOutLid: 30},
      present: {x: 1112, y: 72}, presentK: 0.86,
      card: {x: 250, y: 668, w: 440, h: 230, rot: -2, lift: 0, hs: 20, ts: 18},
      shoulders: {R: {x: 1450, y: 1400}, L: {x: -220, y: 1150}}, reachR: 1500, upperR: 520, reachL: 880, upperL: 300,
      rest: {R: {x: 1040, y: 690}}, restVis: {x: 1040, y: 690}, awayPt: {x: 1040, y: 690},
      bendR: -1,
      insetZone: {x: 490, y: 556, w: 426, h: 228},
      route1: () => ({sag: 40}), route2: () => ({sag: 26}),
    };
  }
  if (shape === 'pairTall') {
    // Tall compact bay for the contrast's square layout (two bays side by side fill the box's
    // height instead of forming a thin band). Same props at the same size as 'pair', stacked:
    // the lectern stands behind the cradle with the article above the open treatise, so the
    // first chain drops from the note straight onto the passage at the top of the right page
    // (inHookR); screen and short shelf on the wall at the right, the archive box on the
    // counter's right end with the raised original above it; card, close-up zone and the
    // resting right hand on the counter front. The right arm enters from the bottom-right.
    return {
      size: [800, 960],
      box: {x: 8, y: 8, w: 784, h: 944}, counterY: 600,
      lecternBoard: {x: 20, y: 30, w: 330, h: 252},
      page: {x: 42, y: 38, w: 286, h: 236},
      screen: {x: 372, y: 38, w: 410, h: 148},
      bookcase: {x: 366, y: 196, w: 168, h: 110, rows: 1, targetRow: 0, targetX: 498, bookT: 11, bookH: 40},
      book: {t: 38, hB: 260, cw: 184}, shelfK: 0.2, bookK: 1.0,
      cradle: {x: 310, y: 442},
      archive: {x: 650, y: 600, w: 250, h: 140},
      folio: {w: 236, h: 306, inBoxK: 0.74, stickOut: 70, stickOutLid: 30},
      present: {x: 758, y: 248}, presentK: 0.86,
      card: {x: 214, y: 782, w: 384, h: 214, rot: -2, lift: 0, hs: 20, ts: 18},
      shoulders: {R: {x: 1010, y: 1360}, L: {x: -220, y: 1190}}, reachR: 1320, upperR: 500, reachL: 880, upperL: 300,
      rest: {R: {x: 702, y: 898}}, restVis: {x: 702, y: 898}, awayPt: {x: 702, y: 898},
      bendR: -1,
      inHookR: true,
      // (the strip between the box's foot and the close-up keeps room for a tag under the box)
      insetZone: {x: 424, y: 664, w: 362, h: 186},
      route1: () => ({sag: 8, dx1: 20, dx2: 14}),
      // the second chain climbs beside the book's right edge before it swings over to the
      // raised original (never across the box)
      route2: (a, b) => ({c1: {x: a.x + 4, y: a.y - (a.y - b.y) * 0.75}, c2: {x: b.x - 46, y: b.y + 24}}),
    };
  }
  if (shape === 'portrait') {
    // Stacked bay: screen / lectern + shelf / cradle (centre) + archive (right) on the counter /
    // card held bottom-left. Everything the right hand handles lies right of the card, so the
    // right forearm (from the bottom-right) never sweeps across the card.
    return {
      size: [1040, 1560],
      box: {x: 8, y: 8, w: 1024, h: 1544}, counterY: 1160,
      screen: {x: 50, y: 56, w: 940, h: 176},
      lecternBoard: {x: 40, y: 318, w: 380, h: 380},
      page: {x: 70, y: 328, w: 320, h: 360},
      bookcase: {x: 470, y: 270, w: 540, h: 580, rows: 3, targetRow: 1, targetX: 950},
      book: {t: 38, hB: 260, cw: 184}, shelfK: 0.52, bookK: 1.0,
      cradle: {x: 540, y: 1000},
      archive: {x: 905, y: 1160, w: 230, h: 170},
      folio: {w: 236, h: 306, inBoxK: 0.74, stickOut: 80, inBoxDx: -16},
      // the raised original clears the shelf plate above it and the open book to its left
      present: {x: 990, y: 715}, presentK: 1.0,
      card: {x: 255, y: 1330, w: 420, h: 240, rot: -3, lift: 40, grow: 'down', maxW: 420},
      shoulders: {R: {x: 1250, y: 2300}, L: {x: -220, y: 1900}}, reachR: 1830, upperR: 600, reachL: 880, upperL: 300,
      // the right hand rests on the counter (always in view: it never crosses the frame edge)
      rest: {R: {x: 840, y: 1320}}, restVis: {x: 840, y: 1320}, awayPt: {x: 840, y: 1320},
      // reach to the shelf passes left of the archive box; the approach to the original runs
      // along the counter and up the box's right side (never over its plate); the elbow swings
      // outward (bend −1) as the hand goes for the original, so the forearm stays off the page
      reachCtl: {x: 620, y: 900}, boxCtl: {x: 1060, y: 1300}, bendHold: -1,
      // both chains bow to the right: the first hangs between lectern and book, the second
      // climbs beside the book's right edge to the raised original
      route1: () => ({sag: 20, dx1: 70, dx2: 70}), route2: () => ({sag: 0, dx1: 46, dx2: 40}),
    };
  }
  if (shape === 'square') {
    return {
      size: [1380, 1160],
      box: {x: 8, y: 8, w: 1364, h: 1144}, counterY: 800,
      screen: {x: 50, y: 54, w: 390, h: 200},
      lecternBoard: {x: 46, y: 300, w: 370, h: 380},
      page: {x: 76, y: 310, w: 310, h: 350},
      bookcase: {x: 470, y: 30, w: 520, h: 772, rows: 3, targetRow: 1, targetX: 950},
      book: {t: 38, hB: 260, cw: 184}, shelfK: 0.6, bookK: 1.06,
      cradle: {x: 700, y: 610},
      archive: {x: 1190, y: 800, w: 290, h: 160},
      folio: {w: 236, h: 306, inBoxK: 0.78, stickOut: 76},
      present: {x: 1310, y: 250}, presentK: 1.0,
      card: {x: 300, y: 960, w: 440, h: 236, rot: -3, lift: 36, maxW: 600},
      shoulders: {R: {x: 1560, y: 1950}, L: {x: -220, y: 1600}}, reachR: 1800, upperR: 600, reachL: 860, upperL: 300,
      rest: {R: {x: 890, y: 930}}, restVis: {x: 890, y: 930}, awayPt: {x: 890, y: 930},
      boxCtl: {x: 1370, y: 990}, bendHold: -1,
      route1: () => ({sag: 70}), route2: () => ({sag: 50}),
    };
  }
  return {
    size: [1900, 900],
    box: {x: 8, y: 8, w: 1884, h: 884}, counterY: 640,
    screen: {x: 58, y: 56, w: 420, h: 212},
    lecternBoard: {x: 56, y: 296, w: 360, h: 330},
    page: {x: 84, y: 306, w: 304, h: 312},
    bookcase: {x: 530, y: 28, w: 720, h: 614, rows: 3, targetRow: 1, targetX: 1200},
    book: {t: 38, hB: 260, cw: 184}, shelfK: 0.58, bookK: 1.08,
    cradle: {x: 890, y: 456},
    archive: {x: 1530, y: 640, w: 300, h: 160},
    folio: {w: 236, h: 306, inBoxK: 0.76, stickOut: 74},
    present: {x: 1700, y: 150}, presentK: 1.0,
    card: {x: 300, y: 766, w: 420, h: 226, rot: -3, lift: 26, maxW: 620},
    shoulders: {R: {x: 1960, y: 1600}, L: {x: -260, y: 1500}}, reachR: 1680, upperR: 560, reachL: 880, upperL: 300,
    rest: {R: {x: 1230, y: 690}}, restVis: {x: 1230, y: 690}, awayPt: {x: 1230, y: 690},
    boxCtl: {x: 1810, y: 770}, bendHold: -1,
    route1: () => ({sag: 70}), route2: () => ({sag: 40}),
  };
}

/* ------------------------------------------------------------------ */
/* First-person library bay (stage + pose solver)                      */
/* ------------------------------------------------------------------ */

/**
 * Assemble the library bay. `pl` holds the per-shape placement (design units):
 *  box, counterY, screen {x,y,w,h}, page {x,y,w,h}, lecternBoard {x,y,w,h},
 *  bookcase {x,y,w,h, targetX}, cradle {x,y} (hinge), spread k (bookK),
 *  shelfK, box {x (centre), y (bottom), w, h}, present {x,y} (original hand
 *  point), card {x,y, w, h, rot}, shoulders {R, L}, rest {R}, routes.
 * @param {any} ctx
 * @param {{prefix:string, pl:any, p:any, t:Record<string,string>, arms?:boolean, card?:boolean, search?:boolean, finalMode?:'source'|'intermediate', seed?:string, holdOriginal?:boolean}} o
 */
export function trailBay(ctx, o) {
  const P = o.prefix;
  const pl = o.pl;
  const p = o.p;
  const t = o.t;
  const th = ctx.theme;
  const showText = ctx.show('all');
  const win = bayWindow(ctx, {prefix: `${P}-bay`, box: pl.box, counterY: pl.counterY});

  // catalogue screen
  const screen = o.search === false ? null : catalogueScreen(ctx, {prefix: `${P}-scr`, ...pl.screen, title: p.objectLabels ? p.objectLabels.search : t.search, query: p.query, result: p.sources.intermediate, mark: p.citations.shelfMark, showText});

  // lectern + article
  const art = articlePage(ctx, {prefix: `${P}-art`, w: pl.page.w, h: pl.page.h, journal: p.sources.article, date: p.dates.article, noteNumber: p.citations.noteNumber, note: noteText(p), noteAlt: o.noteAlt, showText, footLines: pl.footLines});
  const lec = lectern(ctx, {prefix: `${P}-lec`, board: pl.lecternBoard, footY: pl.counterY + 4});

  // treatise geometry: spine thickness t, height hB, cover width cw (at k = 1)
  const B = pl.book;
  const book = treatiseBook(ctx, {prefix: `${P}-book`, t: B.t, hB: B.hB, cw: B.cw, title: p.sources.intermediate, edition: p.dates.intermediate, pageL: p.citations.pinpoint, pageR: o.pageR ?? pl.pageR ?? '', innerNote: p.citations.innerNote, foot: innerText(p), showText});
  const shelfK = pl.shelfK;
  // shelf: false (paired panels) — the book already lies open on its cradle, no bookcase is drawn
  const caseG = o.shelf === false ? null : bookcase(ctx, {prefix: `${P}-case`, ...pl.bookcase, bookT: pl.bookcase.bookT ?? B.t * shelfK, bookH: pl.bookcase.bookH ?? B.hB * shelfK, mark: p.citations.shelfMark, showText});
  const slot = caseG ? caseG.slot : null;
  const onCradle = {x: pl.cradle.x, y: pl.cradle.y, k: pl.bookK, turn: 1, open: 0};
  const inShelf = slot ? {x: slot.hingeX, y: slot.cy, k: shelfK, turn: 0, open: 0} : {...onCradle};
  const cr = cradle(ctx, {prefix: `${P}-cr`, x: pl.cradle.x, y: pl.cradle.y + (B.hB / 2) * pl.bookK - 6, w: B.cw * 2 * pl.bookK * 0.9, baseY: pl.counterY + 4});

  // archive box + original folio
  const bx = pl.archive;
  // with the original standing in front of it (inspect), the box plate is covered: its label is
  // not set as text under the page
  const abox = archiveBox(ctx, {prefix: `${P}-abox`, w: bx.w, h: bx.h, label: p.objectLabels ? p.objectLabels.box : t.box, showText: showText && !o.folioFront, lid: o.lid});
  const F = pl.folio;
  const entry = entrySlot(p.citations.entry);
  const folio = sourceFolio(ctx, {prefix: `${P}-fol`, w: F.w, h: F.h, title: p.sources.source, folio: p.citations.folio, date: p.dates.source, entry, entryLabels: o.entryLabels || entryLabelsFor(p.citations.entry), showText});
  // folio poses: standing in the box (top-left at inBox), lifted, presented (hand grip at pl.present)
  const stick0 = o.lid ? (F.stickOutLid ?? bx.h * 0.16) : F.stickOut;
  // the folio stands fully inside the box (its foot never shows below the box front)
  const inBoxK = Math.min(F.inBoxK ?? 0.8, (bx.h + stick0 - 8) / F.h);
  const inBox = {x: bx.x - (F.w * inBoxK) / 2 + (F.inBoxDx ?? 0), y: bx.y - bx.h - stick0, k: inBoxK};
  const liftTop = {x: inBox.x, y: bx.y - bx.h - F.h * inBoxK - 18, k: inBoxK};
  const present = {x: pl.present.x - folio.grip.x * pl.presentK, y: pl.present.y - folio.grip.y * pl.presentK, k: pl.presentK};

  // card (ficha)
  const C = pl.card;
  const altText = `${t.citedIn} ${p.sources.intermediate}, ${p.citations.pinpoint}`;
  const card = o.card === false ? null : trailCard(ctx, {prefix: `${P}-card`, pin: o.arms === false, w: C.w, h: C.h, maxW: C.maxW, headSize: C.hs, textSize: C.ts, title: p.objectLabels ? p.objectLabels.card : t.card, mark: p.citations.shelfMark, altSlot: o.altSlot, altWrap: o.altWrap, altReserve: o.altSlot ? altText : null, rows: cardRows(p, t), alt: o.finalMode === 'intermediate' ? altText : null, showText, maxLines: C.maxLines});

  // chains
  const ch1 = chainRope(ctx, {name: `${P}-ch1`, width: pl.chainW ?? 10});
  const ch2 = chainRope(ctx, {name: `${P}-ch2`, width: pl.chainW ?? 10});
  const ghost = citedLink(ctx, {name: `${P}-ghost`, color: th.dark ? th.fgSoft : th.ink, width: 5.5});

  // arms (first person): right arm handles book + folio, left arm holds the card
  const arms = o.arms !== false;
  const look = actorLook(ctx, p.researcher || null, 0);
  const armW = pl.armW ?? 62;
  const reachR = pl.reachR, reachL = pl.reachL;
  const handLen = 24 * 1.3 * (armW / 46);
  const upR = pl.upperR ?? reachR * 0.52, upL = pl.upperL ?? reachL * 0.52;
  const armR = arms ? topArm(ctx, {name: `${P}-armR`, skin: look.skin, sleeve: look.outfit, handed: 'right', upper: upR, lower: reachR - upR - handLen, width: armW}) : null;
  const armL = arms && card ? topArm(ctx, {name: `${P}-armL`, skin: look.skin, sleeve: look.outfit, handed: 'left', upper: upL, lower: reachL - upL - handLen, width: armW}) : null;

  const node = g({name: P},
    win.bg,
    g({'clip-path': win.clip},
      screen && screen.node,
      caseG && caseG.node,
      lec,
      g({transform: T(pl.page.x, pl.page.y, pl.page.rot ?? 0)}, art.node),
      cr,
      g({transform: T(bx.x, bx.y)}, abox.back, abox.lidBack),
      // while the original stands in its box, the part behind the box front is clipped (it is
      // hidden by the front anyway): its entry numbers never count as text under the box plate
      o.folioFront ? null : g({'clip-path': ctx.ref(`${P}-folclip`)},
        h('defs', null, h('clipPath', {id: ctx.id(`${P}-folclip`)}, h('rect', {name: `${P}-folclip-r`, x: r(pl.box.x - 400), y: r(pl.box.y - 400), width: r(pl.box.w + 800), height: r(bx.y - bx.h + 2 - (pl.box.y - 400))}))),
        folio.node),
      g({transform: T(bx.x, bx.y)}, abox.front, abox.lidFront),
      o.folioFront ? folio.node : null,
      book.node,
      ghost.node,
      ch1.node, ch2.node,
      ch1.clasp, ch2.clasp,
      armL && armL.arm, armL && armL.palm,
      card && card.node,
      armL && armL.thumb,
      armR && armR.arm, armR && armR.palm, armR && armR.thumb,
    ),
    win.frame,
  );

  // world points of the article
  const artW = q => {
    const a = ((pl.page.rot ?? 0) * Math.PI) / 180;
    return {x: pl.page.x + q.x * Math.cos(a) - q.y * Math.sin(a), y: pl.page.y + q.x * Math.sin(a) + q.y * Math.cos(a)};
  };
  const noteHook = artW(art.hook);
  const folioW = (s, q) => ({x: s.x + q.x * s.k, y: s.y + q.y * s.k});

  /**
   * Pose from action values (0..1 each):
   *  type, result, plate: catalogue typed / result lit / shelf plate glows
   *  reach (hand → spine), pull (out of the slot), carry (to the cradle + turn), release (hand → cover edge), open (cover; the hand lets go past openRide),
   *  toLid, lidOpen, lidBack (hinged box: hand → lid edge, ride it open, fingers to the box rim),
   *  toBox (hand → folio tab; with a bendHold the elbow swings outward meanwhile), lift (folio out of the box), present (folio to reading height),
   *  chain1, chain2 (revealed fractions), ghost2 (dashed cited-in link), rows[3] (card rows), cardLift.
   * @param {Record<string, any>} v
   */
  function pose(v) {
    const val = k => clamp(v[k] ?? 0);
    const nodes = {};
    const E = ease.inOutCubic;
    // --- search screen
    if (screen) {
      const ty = val('type');
      nodes[`${P}-scr-qclip`] = {width: r(screen.qW * ty + 4)};
      const cx = screen.qx0 + screen.qW * ty + 3;
      nodes[`${P}-scr-caret`] = {x1: r(cx), x2: r(cx), opacity: ty > 0 && val('result') < 1 ? 1 : 0};
      nodes[`${P}-scr-hl`] = {opacity: r(val('result'), 3)};
    }
    if (caseG) nodes[`${P}-case-plate-glow`] = {opacity: r(0.85 * val('plate'), 3)};

    // --- book pose
    const pull = val('pull'), carry = val('carry'), open = val('open');
    let bs;
    if (carry <= 0) {
      bs = {...inShelf, y: inShelf.y - 16 * E(pull), turn: 0, open: 0, shadow: 0.6 * pull};
    } else {
      const c = E(carry);
      const from = {x: inShelf.x, y: inShelf.y - 16};
      const lift = Math.sin(Math.PI * c) * (pl.carryLift ?? 60);
      bs = {x: lerp(from.x, onCradle.x, c), y: lerp(from.y, onCradle.y, c) - lift, k: lerp(shelfK, pl.bookK, c), turn: ease.inOutSine(clamp(carry * 1.25)), open: 0, shadow: 0.6};
    }
    if (carry >= 1) bs = {...onCradle, open: ease.inOutSine(open), shadow: 0.6};
    if (o.bookOpen) bs = {...onCradle, open: 1, shadow: 0.6};
    Object.assign(nodes, book.frame(bs));
    const bookGrip = book.world(bs, book.grip);
    const edgeLocal = book.coverEdge(bs, B.hB * 0.12);
    const coverEdgeW = book.world(bs, edgeLocal);

    // --- folio pose
    const lift = val('lift'), pres = val('present');
    let fs;
    const standK = F.standK ?? 0.92;
    const stand = {x: bx.x - (F.w * standK) / 2 - bx.w * 0.06, y: bx.y - F.h * standK + 4, k: standK};
    if (pres > 0) {
      const c = E(pres);
      fs = {x: lerp(liftTop.x, present.x, c), y: lerp(liftTop.y, present.y, c), k: lerp(inBoxK, present.k, c)};
    } else fs = {x: inBox.x, y: lerp(inBox.y, liftTop.y, E(lift)), k: inBoxK};
    if (o.folioFront) fs = stand;
    nodes[`${P}-fol`] = {transform: T(fs.x, fs.y, 0, fs.k)};
    if (!o.folioFront) {
      // the clip opens fully once the original's foot has cleared the box front
      const inside = fs.y + F.h * fs.k > bx.y - bx.h + 2;
      const clipBottom = inside ? bx.y - bx.h + 2 : pl.box.y + pl.box.h + 400;
      nodes[`${P}-folclip-r`] = {height: r(clipBottom - (pl.box.y - 400))};
    }
    const folioGrip = folioW(fs, folio.grip);
    let lidEdgeW = null;
    if (abox.lidFrame) {
      const lo = ease.inOutSine(val('lidOpen'));
      Object.assign(nodes, abox.lidFrame(lo));
      const le = abox.lidEdge(lo);
      lidEdgeW = {x: bx.x + le.x, y: bx.y + le.y};
    }

    // --- right hand target (piecewise). The hand rides the cover's free edge
    // until it passes vertical (openRide), then lets it fall open and moves away.
    let hand = null;
    let holder = 'none';
    const ride = pl.openRide ?? 0.55;
    // elbow side: bendR while handling the book; when the placement names a bendHold the
    // elbow swings outward (continuously, during the approach to the original) so the forearm
    // stays off the box plate and off the raised page
    const swing = lift > 0 || pres > 0 ? 1 : val('toBox');
    const bend = pl.bendHold !== undefined ? lerp(pl.bendR ?? 1, pl.bendHold, ease.inOutSine(swing)) : (pl.bendR ?? 1);
    if (armR) {
      // the rest lies on the counter, in view: the hand never crosses the frame edge alone
      const rest = pl.restVis ?? pl.rest.R;
      const reach = val('reach'), release = val('release'), toBox = val('toBox');
      const slotGrip = book.world({...inShelf}, book.grip);
      const edgeAt = x => {
        const st = {...onCradle, open: ease.inOutSine(x)};
        return book.world(st, book.coverEdge(st, B.hB * 0.12));
      };
      const awayPt = pl.awayPt ?? rest;
      const lidEdgeAt = q => ({x: bx.x + abox.lidEdge(q).x, y: bx.y + abox.lidEdge(q).y});
      // after opening the lid the fingers rest on the box's front rim (the hand stays in view)
      const rimPt = {x: bx.x + bx.w * 0.36, y: bx.y - bx.h + 6};
      const toLid = val('toLid'), lidOpen = val('lidOpen'), lidBack = val('lidBack');
      const quad = (a, c, b, q) => ({x: (1 - q) * (1 - q) * a.x + 2 * (1 - q) * q * c.x + q * q * b.x, y: (1 - q) * (1 - q) * a.y + 2 * (1 - q) * q * c.y + q * q * b.y});
      if (lift > 0 || pres > 0) {
        hand = folioGrip;
        holder = 'folio';
      } else if (toBox > 0) {
        const from = abox.lidEdge ? rimPt : o.bookOpen ? rest : awayPt;
        const q = ease.inOutSine(toBox);
        hand = pl.boxCtl && !abox.lidEdge ? quad(from, pl.boxCtl, folioGrip, q) : mix(from, folioGrip, q);
        holder = 'free';
      } else if (abox.lidEdge && lidBack > 0) {
        hand = mix(lidEdgeAt(1), rimPt, ease.inOutSine(lidBack));
        holder = 'free';
      } else if (abox.lidEdge && lidOpen > 0) {
        hand = lidEdgeAt(ease.inOutSine(lidOpen));
        holder = 'lid';
      } else if (abox.lidEdge && toLid > 0) {
        hand = mix(rest, lidEdgeAt(0), ease.inOutSine(toLid));
        holder = toLid >= 1 ? 'lid' : 'free';
      } else if (o.bookOpen) {
        hand = rest;
        holder = 'free';
      } else if (open > ride) {
        // let go of the cover and drift back (the cover keeps falling open on its own)
        const aw = v.away !== undefined ? clamp(v.away) : (open - ride) / (1 - ride);
        hand = mix(edgeAt(ride), awayPt, ease.inOutSine(aw));
        holder = 'free';
      } else if (open > 0 || release >= 1) {
        hand = coverEdgeW;
        holder = 'cover';
      } else if (release > 0) {
        hand = mix(bookGrip, coverEdgeW, E(release));
        holder = 'free';
      } else if (pull > 0 || carry > 0) {
        hand = bookGrip;
        holder = 'book';
      } else {
        const q = ease.inOutSine(reach);
        hand = pl.reachCtl ? quad(rest, pl.reachCtl, slotGrip, q) : mix(rest, slotGrip, q);
        holder = reach >= 1 ? 'book' : 'free';
      }
      if (v.handBack !== undefined && v.handBack > 0) {
        hand = mix(hand, rest, ease.inOutSine(clamp(v.handBack)));
        holder = 'free';
      }
    }

    // --- chains
    // (a placement with inHookR always takes the passage at the top of the right page)
    const pinMove = o.pinAlt ? ease.inOutCubic(val('pinMove')) : pl.inHookR ? 1 : 0;
    const inHook = book.world(bs, mix(book.hookIn, book.hookInR, pinMove));
    if (o.pinAlt || pl.inHookR) nodes[`${P}-book-eyeIn`] = {transform: pinMove > 0 ? T((book.hookInR.x - book.hookIn.x) * pinMove, (book.hookInR.y - book.hookIn.y) * pinMove) : ''};
    const outHook = book.world(bs, book.hookOut);
    const entryMove = o.entryAlt !== undefined ? ease.inOutCubic(val('entryMove')) : 0;
    const hookLocal = o.entryAlt !== undefined ? mix(folio.hookAt(entry), folio.hookAt(o.entryAlt), entryMove) : folio.hookAt(entry);
    const fHook = folioW(fs, hookLocal);
    if (o.entryAlt !== undefined) {
      const a0 = folio.entries[entry].box, a1 = folio.entries[o.entryAlt].box;
      const dy = (a1.y - a0.y) * entryMove;
      nodes[`${P}-fol-eyeG`] = {transform: entryMove > 0 ? T(0, (folio.hookAt(o.entryAlt).y - folio.hookAt(entry).y) * entryMove) : ''};
      nodes[`${P}-fol-hl-move`] = {transform: entryMove > 0 ? T(0, dy) : ''};
    }
    const r1 = chainRoute(noteHook, inHook, pl.route1 ? pl.route1(noteHook, inHook) : {});
    const c1 = ch1.frame(r1, val('chain1'));
    Object.assign(nodes, c1.nodes);
    const r2 = chainRoute(outHook, fHook, pl.route2 ? pl.route2(outHook, fHook) : {});
    const c2 = ch2.frame(r2, val('chain2'));
    Object.assign(nodes, c2.nodes);
    const boxHook = {x: bx.x - bx.w * 0.28, y: bx.y - bx.h - 6};
    const rg = chainRoute(outHook, boxHook, pl.route2 ? pl.route2(outHook, boxHook) : {});
    Object.assign(nodes, ghost.frame(rg, val('ghost2'), 0.9));
    // eyelet pulses when a clasp arrives
    Object.assign(nodes, pulse(`${P}-art-eye`, val('pulse0')));
    Object.assign(nodes, pulse(`${P}-book-eyeIn`, val('pulse1')));
    Object.assign(nodes, pulse(`${P}-book-eyeOut`, val('pulse2')));
    Object.assign(nodes, pulse(`${P}-fol-eye`, val('pulse3')));
    nodes[`${P}-art-foot-hl`] = {opacity: r(0.9 * val('noteHl'), 3)};
    nodes[`${P}-book-foot-hl`] = {opacity: r(0.9 * val('innerHl'), 3)};
    nodes[`${P}-fol-hl`] = {opacity: r(0.9 * val('entryHl'), 3)};

    // --- card
    let cardHand = null;
    let cardC = null;
    if (card) {
      const lift2 = E(val('cardLift'));
      cardC = {x: C.x + (card.w - C.w) / 2, y: C.y + (C.grow === 'down' ? 1 : -1) * (card.h - C.h) / 2 - (C.lift ?? 40) * lift2, rot: C.rot ?? 0};
      nodes[`${P}-card`] = {transform: T(cardC.x, cardC.y, cardC.rot)};
      const rows = v.rows || [0, 0, 0];
      rows.forEach((q, i) => {
        const on = clamp(q);
        nodes[`${P}-card-row${i}`] = {opacity: r(0.35 + 0.65 * on, 3)};
        const dashed = i === 2 && o.finalMode === 'intermediate';
        nodes[`${P}-card-row${i}-on`] = {opacity: dashed ? 0 : r(on, 3)};
        nodes[`${P}-card-row${i}-dash`] = {opacity: dashed ? r(on, 3) : 0};
        if (dashed && showText) nodes[`${P}-card-row2-alt`] = {opacity: r(on, 3)};
      });
      const a = ((cardC.rot) * Math.PI) / 180;
      const gq = card.grip;
      cardHand = {x: cardC.x + gq.x * Math.cos(a) - gq.y * Math.sin(a), y: cardC.y + gq.x * Math.sin(a) + gq.y * Math.cos(a)};
    }

    // --- solve arms
    let reachedR = true, reachedL = true;
    let handR = null, handL = null, elbowR = null, elbowL = null;
    if (armR && hand) {
      const s = armR.pose(pl.shoulders.R, hand, bend);
      Object.assign(nodes, s.nodes);
      reachedR = s.reached;
      handR = s.hand;
      elbowR = ik2(pl.shoulders.R, hand, upR, reachR - upR, bend).elbow;
    }
    if (armL && cardHand) {
      const s = armL.pose(pl.shoulders.L, cardHand, pl.bendL ?? -1);
      Object.assign(nodes, s.nodes);
      reachedL = s.reached;
      handL = s.hand;
      elbowL = ik2(pl.shoulders.L, cardHand, upL, reachL - upL, pl.bendL ?? -1).elbow;
    }
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    return {
      nodes,
      // solved right-arm polyline (shoulder → elbow → hand) of this pose, for label obstacles
      armR: handR ? [pl.shoulders.R, elbowR, handR] : null,
      armL: handL ? [pl.shoulders.L, elbowL, handL] : null,
      semantic: {
        bookHolder: carry >= 1 ? 'cradle' : pull > 0 || carry > 0 ? 'hand' : 'shelf',
        bookOpen: r(bs.open, 3),
        bookCenter: P2({x: bs.x, y: bs.y}),
        bookGrip: P2(bookGrip),
        coverEdge: P2(coverEdgeW),
        folioHolder: pres > 0 || lift > 0 ? 'hand' : 'box',
        folioTop: P2({x: fs.x, y: fs.y}),
        folioGrip: P2(folioGrip),
        handR: P2(handR),
        handL: P2(handL),
        cardGrip: P2(cardHand),
        holderR: holder,
        // the right hand (fist) lies inside the bay window: it never pokes in or out of an edge
        handRInView: handR ? handR.x > pl.box.x + 30 && handR.x < pl.box.x + pl.box.w - 30 && handR.y > pl.box.y + 30 && handR.y < pl.box.y + pl.box.h - 30 : null,
        lidOpen: abox.lidFrame ? r(val('lidOpen'), 3) : null,
        lidEdge: P2(lidEdgeW),
        noteHook: P2(noteHook),
        inHook: P2(inHook),
        outHook: P2(outHook),
        folioHook: P2(fHook),
        clasp1: P2(c1.tip),
        clasp2: P2(c2.tip),
        chain1: r(val('chain1'), 3),
        chain2: r(val('chain2'), 3),
        reach: {R: reachedR, L: reachedL},
        allReached: reachedR && reachedL,
      },
    };
  }

  /**
   * Solved right-arm polyline (shoulder → elbow → hand) for a hand point: label obstacles.
   * The default bend is the one of the final hold (bendHold when the placement has one).
   */
  const armPath = (handPt, bend = pl.bendHold ?? pl.bendR ?? 1) => {
    if (!armR) return [];
    const sol = ik2(pl.shoulders.R, handPt, upR, reachR - upR, bend);
    return [pl.shoulders.R, sol.elbow, sol.hand];
  };
  const standK0 = F.standK ?? 0.92;
  const standPose = {x: bx.x - (F.w * standK0) / 2 - bx.w * 0.06, y: bx.y - F.h * standK0 + 4, k: standK0};
  return {node, pose, armPath, art, book, folio, card, screen, caseG, abox, slot, inShelf, onCradle, present, noteHook, entry, win, standPose, chainRopes: {ch1, ch2},
    cardBox: card ? (() => {
      const a = Math.abs(((C.rot ?? 0) * Math.PI) / 180);
      const ex = (card.w / 2) * Math.cos(a) + (card.h / 2) * Math.sin(a), ey = (card.w / 2) * Math.sin(a) + (card.h / 2) * Math.cos(a);
      const cx = C.x + (card.w - C.w) / 2, cy = C.y + (C.grow === 'down' ? 1 : -1) * (card.h - C.h) / 2;
      return {x: cx - ex, y: cy - ey, w: ex * 2, h: ey * 2};
    })() : null,
    /** card-local point → bay point (card at rest, before any lift) */
    cardPt: card ? (q, lift = 0) => {
      const a = ((C.rot ?? 0) * Math.PI) / 180;
      const cx = C.x + (card.w - C.w) / 2, cy = C.y + (C.grow === 'down' ? 1 : -1) * (card.h - C.h) / 2 - (C.lift ?? 40) * lift;
      return {x: cx + q.x * Math.cos(a) - q.y * Math.sin(a), y: cy + q.x * Math.sin(a) + q.y * Math.cos(a)};
    } : null,
    altText,
    folioPresentBox: {x: present.x, y: present.y, w: F.w * present.k, h: F.h * present.k},
    folioInBoxBox: {x: inBox.x, y: inBox.y, w: F.w * inBoxK, h: F.h * inBoxK}};
}

/** Entry labels 1–4 (or the supplied label on the selected slot). */
export function entryLabelsFor(label) {
  const s = String(label).trim();
  if (/^[1-4]$/.test(s)) return ['1', '2', '3', '4'];
  const out = ['', '', '', ''];
  out[entrySlot(s)] = s;
  return out;
}

/* ------------------------------------------------------------------ */
/* Label placement                                                     */
/* ------------------------------------------------------------------ */

function areaOf(a, b, pad = 0) {
  const w = Math.min(a.x + a.w + pad, b.x + b.w + pad) - Math.max(a.x - pad, b.x - pad);
  const hh = Math.min(a.y + a.h + pad, b.y + b.h + pad) - Math.max(a.y - pad, b.y - pad);
  return w > 0 && hh > 0 ? w * hh : 0;
}

/**
 * Collision-aware label placer shared by the entries. Obstacles are boxes
 * (props, chain samples, arms); placed labels become obstacles and their
 * boxes are also used to keep later leaders from crossing them.
 * `place(cands, make, target)` tries the preferred candidates first and, when
 * none is clear, searches a grid over `bounds` scoring true overlap, a small
 * clearance penalty, leader crossings and distance to the target.
 * @param {{x:number,y:number,w:number,h:number}} bounds
 */
export function labelPlacer(bounds, opts = {}) {
  const obstacles = [];
  const labels = [];
  const margin = opts.margin ?? 10;
  const inside = b => b.x >= bounds.x + margin && b.y >= bounds.y + margin && b.x + b.w <= bounds.x + bounds.w - margin && b.y + b.h <= bounds.y + bounds.h - margin;
  const score = res => {
    const b = res.box;
    if (!inside(b)) return Infinity;
    let c = 0;
    for (const o of obstacles) c += areaOf(o, b, 0) * 4 + areaOf(o, b, 8) * 0.25;
    for (const l of labels) c += areaOf(l, b, 0) * 40 + areaOf(l, b, 10) * 2;
    const lead = res.lead;
    if (lead) {
      // (opts.leadSamples / opts.leadPad: a finer check that also catches leaders grazing a prop)
      const n = opts.leadSamples ?? 16;
      const lp = opts.leadPad ?? 0;
      for (let i = 1; i < n; i++) {
        const q = {x: lerp(lead.x1, lead.x2, i / n), y: lerp(lead.y1, lead.y2, i / n), w: 1, h: 1};
        if (labels.some(lb => areaOf(lb, q, 3) > 0)) c += 3000 * 16 / n;
        // obstacles added with `solid: true` (pages, books, props with text) are not crossed by
        // leaders either, except right at the leader's own target
        if (Math.hypot(q.x - lead.x2, q.y - lead.y2) > 26 && obstacles.some(o => o.solid && areaOf(o, q, lp) > 0)) c += 1500 * 16 / n;
      }
    }
    return c;
  };
  const dist2 = (res, target) => (target ? Math.hypot(res.box.x + res.box.w / 2 - target.x, res.box.y + res.box.h / 2 - target.y) : 0);
  return {
    obstacles,
    labels,
    addObstacle(b) { obstacles.push(b); },
    addLabel(b) { labels.push(b); },
    /** Score of a built label (0 = free; used to compare alternative targets). */
    scoreOf(res) { return score(res); },
    /**
     * @param {Array<{x:number,y:number,anchor?:string}>} cands preferred candidates, in order
     * @param {(c:{x:number,y:number,anchor?:string}) => {box:any, lead?:any}} make
     * @param {{x:number,y:number}} [target]
     * @param {{maxDist?:number, step?:number, register?:boolean}} [o]
     */
    place(cands, make, target, o = {}) {
      let best = null, bs = Infinity;
      for (const c of cands) {
        const res = make(c);
        const sc = score(res);
        if (sc === 0) { best = res; bs = 0; break; }
        const tot = sc + dist2(res, target) * 1.5;
        if (tot < bs) { best = res; bs = tot; }
      }
      if (bs > 0 && target) {
        const step = o.step ?? 30;
        const maxDist = o.maxDist ?? 420;
        // grid candidates are scored on a translated copy of one probe box (a label's size does
        // not depend on where it sits); only the winner is built. Labels with leaders (whose shape
        // depends on the position) are built per candidate.
        const probe = make({x: 0, y: 0, anchor: 'middle'});
        const cheap = !probe.lead;
        let bestC = null;
        for (let y = bounds.y + margin; y < bounds.y + bounds.h - margin; y += step) {
          for (let x = bounds.x + margin; x < bounds.x + bounds.w - margin; x += step) {
            const res = cheap ? {box: {...probe.box, x: probe.box.x + x, y: probe.box.y + y}} : make({x, y, anchor: 'middle'});
            const sc = score(res);
            if (sc === Infinity) continue;
            const d = dist2(res, target);
            const tot = sc + d * 1.5 + (d > maxDist ? (d - maxDist) * (o.farPenalty ?? 200) : 0);
            if (tot < bs) { bs = tot; bestC = {x, y, anchor: 'middle'}; best = cheap ? null : res; }
          }
        }
        if (bestC && !best) best = make(bestC);
      }
      if (best && o.register !== false) labels.push(best.box);
      return best;
    },
  };
}
