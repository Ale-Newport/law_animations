/**
 * Kit for the "Aceptación y contrapropuesta" motif (contract-formation-02,
 * LAW-0445..0448). Geometry, art and a pose solver only: every entry owns its
 * own timeline, layout choices and semantics.
 *
 * Stage (original vector art, the category's editorial-flat language):
 *  - a standing term board between two standing parties: the OFFER sheet is
 *    clipped on its upper half, the REPLY sheet (the response message) sits
 *    on a rail on its lower half. Each sheet = a header block (left) + a
 *    column of term pieces (right); the two columns are vertically aligned.
 *  - the offer's terms are printed pieces; a COPY SET of identical pieces lies
 *    on them, clipped to a spine with one latch per piece and a pull handle.
 *  - Party B (the responding party, right) slides the copy set down into the
 *    reply's slots (the response keeps every supplied piece), or first opens
 *    one latch so that piece stays behind on the offer and then slots a
 *    DIFFERENT piece (held face-down until then) into the empty slot.
 *  - Party A (left) pulls the reply back along the rail (the response is
 *    carried back to A).
 * Every moving prop is placed from a SOLVED hand while held (grip = hand), so
 * nothing teleports. Pieces carry the supplied text only; with labels hidden
 * their coloured tabs still show which piece is which. No legal effect is
 * drawn: the kit shows only the physical match or substitution of pieces.
 * Imports the category pilot's field builders read-only.
 * @module animations/contract-formation/kits/aceptacion-contrapropuesta
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath, mix} from '../../../core/geometry.js';
import {measure, fitText} from '../../../core/text.js';
import {textBlock} from '../../../primitives/annotate.js';
import {changedMarker} from '../../../primitives/markers.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {str, list, obj, oneOf, int} from '../../../schemas/fields.js';
import {offerFields} from './offer-fields.js';

const INK = '#1f2328';

/* ======================================================================== */
/* Fields, defaults and strings                                             */
/* ======================================================================== */

/** One response as supplied: what it physically does with the supplied pieces. */
export const responseItem = obj('A response message as supplied. It only states which pieces the reply carries; no legal effect (acceptance, counter-offer, formation) is inferred', {
  reference: str('Reference printed on the reply sheet (fictional)', 32),
  mode: oneOf('same-terms = every supplied piece is copied onto the reply; one-piece-substituted = one piece is replaced by a different piece', ['same-terms', 'one-piece-substituted']),
  termIndex: int('Zero-based index of the piece that is replaced (one-piece-substituted only)', 0, 3),
  value: str('Value printed on the different piece (one-piece-substituted only)', 60),
}, ['reference', 'mode']);

/** Scene fields shared by the four entries (the category's offer fields + responses). */
export const motifFields = {
  ...offerFields,
};

export const DEFAULT_CONTENT = {
  parties: [{name: 'Nadia Park', role: 'Party A'}, {name: 'Tomás Ribeiro', role: 'Party B'}],
  offer: {reference: 'OF-2041', title: 'Offer to supply'},
  terms: [
    {key: 'item', label: 'Item', value: 'Oak office chairs'},
    {key: 'delivery', label: 'Delivery', value: 'Day 10'},
    {key: 'quantity', label: 'Quantity', value: '40'},
  ],
};

export const KIT_STRINGS = {
  en: {from: 'From', to: 'To', re: 'Re', key: 'As supplied · no conclusion drawn'},
  es: {from: 'De', to: 'Para', re: 'Ref.', key: 'Según lo aportado · sin conclusión'},
};

/** Resolve a supplied response against the supplied terms. */
export function resolveResponse(p, resp) {
  const n = p.terms.length;
  const sub = resp && resp.mode === 'one-piece-substituted';
  const k = sub ? clamp(Math.round(resp.termIndex ?? 0), 0, n - 1) : null;
  return {
    reference: resp ? resp.reference : '',
    substituted: sub,
    k,
    value: sub ? (resp.value || '') : null,
    label: sub ? p.terms[k].label : null,
  };
}

/* ======================================================================== */
/* Text: whole-word fitting with glued number pairs                          */
/* ======================================================================== */

const GLUE = '\u2060';

/** Keep a number with the word before it ("Day 10") and a short tail word with its line. */
export function keepNumbers(text) {
  return String(text ?? '')
    .replace(/(\S)[ \t]+(\d[\d.,:/-]*)(?=[\s)·,;.]|$)/gu, '$1\u00a0$2')
    .replace(/^(\d[\d.]*)[ \t]+(?=\S)/u, '$1\u00a0');
}

/**
 * Fit text into maxWidth × maxLines at the largest size in [size, minSize]
 * that wraps whole words only (glued pairs never split) and leaves no 1–2
 * character line. Returns a fitText-shaped result plus `bad` when it could
 * not be done (the caller then widens the box or recomposes).
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:'sans'|'serif'|'mono', leading?:number, balance?:boolean}} o
 */
/** fitW results memoised on every input (pure; callers only read them). */
const FITW = new Map();
export function fitW(text, o) {
  const key = `${text}\u0001${o.maxWidth}|${o.size}|${o.minSize}|${o.maxLines}|${o.weight}|${o.family}|${o.leading}|${o.balance}`;
  const hit = FITW.get(key);
  if (hit) return hit;
  const res = fitWRaw(text, o);
  if (FITW.size > 50000) FITW.clear();
  FITW.set(key, res);
  return res;
}

function fitWRaw(text, o) {
  const full = String(text ?? '');
  const weight = o.weight ?? 400;
  const family = o.family ?? 'sans';
  const leading = o.leading ?? 1.18;
  const maxLines = o.maxLines ?? 2;
  const minSize = o.minSize ?? o.size;
  const maxWidth = Math.max(10, o.maxWidth);
  const shown = t => t.replace(/\u2060/g, ' ');
  const m = (t, sz) => measure(shown(t), sz, weight, family);
  const tokens = [];
  for (const w of keepNumbers(full).replace(/\u00a0/g, GLUE).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)) {
    if (/^[·•–—|:]$/.test(w) && tokens.length) tokens[tokens.length - 1] += `${GLUE}${w}`;
    else tokens.push(w);
  }
  const wrapAt = (w, sz) => {
    const lines = [];
    let cur = '';
    for (const t of tokens) {
      const cand = cur ? `${cur} ${t}` : t;
      if (!cur || m(cand, sz) <= w) cur = cand;
      else { lines.push(cur); cur = t; }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const step = Math.max(0.5, o.size * 0.035);
  let best = null;
  for (let s = o.size; s >= minSize - 1e-6; s -= step) {
    if (!tokens.length) break;
    if (Math.max(...tokens.map(t => m(t, s))) > maxWidth) continue;
    let lines = wrapAt(maxWidth, s);
    if (lines.length > maxLines) continue;
    if (lines.length > 1 && lines.slice(1).some(l => shown(l).trim().length <= 2)) continue;
    // balance: the narrowest width that keeps the same number of lines
    if (o.balance !== false && lines.length > 1) {
      let lo = maxWidth * 0.4, hi = maxWidth;
      for (let it = 0; it < 12; it++) {
        const mid = (lo + hi) / 2;
        const l2 = Math.max(...tokens.map(t => m(t, s))) <= mid ? wrapAt(mid, s) : null;
        if (l2 && l2.length === lines.length) hi = mid; else lo = mid;
      }
      const l3 = wrapAt(hi, s);
      if (l3.length === lines.length && !l3.slice(1).some(l => shown(l).trim().length <= 2)) lines = l3;
    }
    best = {lines: lines.map(shown), size: s};
    break;
  }
  if (!best) {
    const f = fitText(full, {maxWidth, size: minSize, minSize, maxLines, weight, family, leading});
    return {...f, bad: true};
  }
  const width = Math.max(...best.lines.map(l => measure(l, best.size, weight, family)));
  const lineHeight = best.size * leading;
  return {lines: best.lines, size: best.size, lineHeight, width, height: lineHeight * (best.lines.length - 1) + best.size, truncated: false, full, weight, family, bad: false};
}

/** A rounded chip with whole-word fitted text (never ellipsised). */
export function chipW(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = o.padX ?? size * 0.6;
  const padY = o.padY ?? size * 0.36;
  const fit = o.fit || fitW(text, {maxWidth: o.maxWidth - padX * 2, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600});
  const w = fit.width + padX * 2;
  const hh = fit.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const y = o.y;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, y, w, hh, o.radius ?? Math.min(hh / 2, size * 0.7)), fill: o.fill ?? th.card, stroke: o.stroke ?? th.ink, 'stroke-width': o.strokeWidth ?? 2, 'stroke-dasharray': o.dash}),
    textBlock(fit, {x: x + w / 2, y: y + padY, anchor: 'middle', fill: o.color ?? th.ink, name: o.textName}),
  );
  return {node, box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2}, fit};
}

/* ======================================================================== */
/* Small geometry helpers                                                   */
/* ======================================================================== */

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export const insideBox = (a, b, pad = 0) => a.x >= b.x + pad - 0.01 && a.y >= b.y + pad - 0.01 && a.x + a.w <= b.x + b.w - pad + 0.01 && a.y + a.h <= b.y + b.h - pad + 0.01;
export const unionBox = boxes => {
  const bs = boxes.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};

/* ======================================================================== */
/* Rig metrics (primitives/person.js, local units, facing +x)                */
/* ======================================================================== */

export const RIG = {
  near: {x: 12, y: -302},
  far: {x: -14, y: -305},
  hip: {x: 0, y: -186},
  reach: 165,
  /** head + hair box (local) */
  head: {x: -44, y: -414, w: 92, h: 90},
  /** torso front / back extents (local x) */
  front: 42, back: 40,
};

/** World point of a local rig point for a figure at (x, floor) facing f with scale k (no lean). */
export const rigPt = (fig, p) => ({x: fig.x + fig.f * p.x * fig.k, y: fig.floor + p.y * fig.k});

/** Head box (world) of a figure. */
export function headBox(fig) {
  const a = rigPt(fig, {x: RIG.head.x, y: RIG.head.y}), b = rigPt(fig, {x: RIG.head.x + RIG.head.w, y: RIG.head.y + RIG.head.h});
  return {x: Math.min(a.x, b.x), y: a.y, w: Math.abs(b.x - a.x), h: b.y - a.y};
}

/** Whole-figure box (world): head to feet, back to front. */
export function figureBox(fig) {
  const a = rigPt(fig, {x: -50, y: -414}), b = rigPt(fig, {x: 50, y: 0});
  return {x: Math.min(a.x, b.x), y: a.y, w: Math.abs(b.x - a.x), h: b.y - a.y};
}

/** Shoulder world position with a lean (degrees, + = forward). */
export function shoulderAt(fig, which, lean = 0) {
  const s = RIG[which];
  const a = (lean * Math.PI) / 180;
  const dx = s.x - RIG.hip.x, dy = s.y - RIG.hip.y;
  const loc = {x: RIG.hip.x + dx * Math.cos(a) - dy * Math.sin(a), y: RIG.hip.y + dx * Math.sin(a) + dy * Math.cos(a)};
  return rigPt(fig, loc);
}

/** Whether a world target is within the arm's reach (with a safety margin). */
export function canReach(fig, which, target, lean = 0, margin = 0.975) {
  const s = shoulderAt(fig, which, lean);
  return Math.hypot(target.x - s.x, target.y - s.y) <= RIG.reach * fig.k * margin && Math.hypot(target.x - s.x, target.y - s.y) >= 12 * fig.k;
}

/* ======================================================================== */
/* Measuring the documents                                                   */
/* ======================================================================== */

/**
 * A card turn: its y-scale and the opacity of its printed value. Text never shows squashed: the value fades out at
 * full size before a card turns face-down, and fades in only once a card that turned face-up is full size.
 */
export function turnFace(f) {
  if (f <= 0) return {sy: 1, text: 1};
  if (f < 0.1) return {sy: 1, text: 1 - f / 0.1};
  if (f < 0.5) return {sy: Math.max(0.02, 1 - (f - 0.1) / 0.4), text: 0};
  if (f < 0.9) return {sy: Math.max(0.02, (f - 0.5) / 0.4), text: 0};
  return {sy: 1, text: Math.min(1, (f - 0.9) / 0.1)};
}

/** The number token of piece i: a circled digit (1–20), else (n). */
export const pieceNo = i => (i < 20 ? String.fromCodePoint(0x2460 + i) : `(${i + 1})`);

export const TILE = {tabW: 12, padL: 12, padT: 10, padB: 10, gripM: 28, gap: 8};
export const SHEET = {cp: 10, spW: 12, hp: 16, bp: 16, sg: 18, tabL: 26, lp: 14};

/**
 * Fit every text of both sheets and the pieces at one size set. Field labels
 * are printed on the sheets (label column); pieces carry the values only.
 * @param {any} ctx
 * @param {{terms:any[], offer:any, parties:any[], response:any, replyTag:string, tw:number, lw:number, hw:number, above:boolean, F:number, FL:number, show:boolean, extraValues?:string[]}} o
 */
export function measureDocs(ctx, o) {
  const inner = o.tw - TILE.tabW - TILE.padL - TILE.gripM;
  const bad = [];
  // lw = 0: no label column; each field label is printed above its piece, inside the column
  const labelsAbove = !o.lw;
  const fitL = t => fitW(t, {maxWidth: labelsAbove ? o.tw - 6 : o.lw - SHEET.lp * 2, size: o.FL, minSize: o.FL, maxLines: o.valueLines ?? 3, weight: 600});
  const fitV = t => fitW(t, {maxWidth: inner, size: o.F, minSize: o.F, maxLines: o.valueLines ?? 3, weight: 700});
  const labels = o.terms.map(t => (o.show ? fitL(t.label) : null));
  // tokens (the reply copies of pieces drawn in full once, on the offer): each copy shows its piece number;
  // numbered (the offer drawn with tokens elsewhere): each printed piece starts with its number
  const values = o.terms.map((t, i) => (o.show ? fitV(o.tokens ? pieceNo(i) : o.numbered ? `${pieceNo(i)} ${t.value}` : t.value) : null));
  const R = o.response;
  const spare = R && R.substituted && o.show ? fitV(R.value) : null;
  const extra = (o.extraValues || []).map(v => (o.show ? fitV(v) : null));
  const hOf = f => (f ? f.height : o.F);
  const rows = o.terms.map((_, i) => Math.max(labelsAbove ? 0 : hOf(labels[i]), hOf(values[i]), R && R.substituted && R.k === i ? hOf(spare) : 0, ...extra.map(hOf)));
  const th = Math.max(...rows) + TILE.padT + TILE.padB;
  const labH = labelsAbove ? Math.max(...labels.map(f => (f ? f.height : o.FL))) : 0;
  [...labels, ...values, spare, ...extra].forEach((f, i) => { if (f && f.bad) bad.push(`piece${i}`); });
  // header above the rows: its lines stop short of the spine's top corner (lever and B's far hand work there)
  const hin = (o.above ? o.lw + SHEET.cp * 2 + o.tw + SHEET.spW - 40 : o.hw) - SHEET.hp * 2;
  // the reply has no label column: its header block sits where the offer's header + labels are
  const replyBand = o.above && labelsAbove;   // no room left of the reply's column: its header is a band below it
  const hinR = (o.replyHdrW ?? (replyBand ? SHEET.cp * 2 + o.tw + SHEET.spW : o.above ? o.lw : o.hw + o.lw)) - SHEET.hp * 2;
  const t = ctx.t;
  const th0 = ctx.theme;
  const hdr = (lines, width = hin) => {
    let hh = SHEET.hp;
    const out = [];
    const gapOf = ln => ln.after ?? o.FL * 0.45;
    const used = lines.filter(ln => ln.text);
    used.forEach((ln, j) => {
      const f = o.show ? fitW(ln.text, {maxWidth: width, size: ln.size, minSize: ln.size, maxLines: ln.maxLines, weight: ln.weight, family: ln.family}) : null;
      if (f && f.bad) bad.push(`hdr:${ln.key}`);
      out.push({key: ln.key, fit: f, y: hh, color: ln.color, h: f ? f.height : ln.size, w: f ? f.width : width * 0.6});
      hh += (f ? f.height : ln.size) + (j < used.length - 1 ? gapOf(ln) : 0);
    });
    return {lines: out, h: hh + SHEET.hp};
  };
  // compact: only the references are printed on the sheets (the rest is shown once, elsewhere, by the entry)
  // noOffer: only the reply is measured (its 'Re:' line still names the offer's reference)
  const offerHdr = o.noOffer ? {lines: [], h: 0} : o.compact === 'title' ? hdr([
    {key: 'ref', text: o.offer.reference, size: o.FL, maxLines: 2, weight: 600, family: 'mono', color: th0.inkSoft, after: o.FL * 0.35},
    {key: 'title', text: o.offer.title, size: o.F * 1.06, maxLines: 4, weight: 700, family: 'serif', color: th0.ink},
  ]) : o.compact ? hdr([
    {key: 'ref', text: o.offer.reference, size: o.FL, maxLines: 2, weight: 600, family: 'mono', color: th0.inkSoft},
  ]) : hdr([
    {key: 'ref', text: o.offer.reference, size: o.FL, maxLines: 1, weight: 600, family: 'mono', color: th0.inkSoft, after: o.FL * 0.35},
    {key: 'title', text: o.offer.title, size: o.F * 1.06, maxLines: 4, weight: 700, family: 'serif', color: th0.ink, after: o.FL * 0.5},
    {key: 'from', text: `${t.from}: ${o.parties[0].name}`, size: o.FL, maxLines: 2, weight: 500, color: th0.inkSoft, after: o.FL * 0.25},
    {key: 'to', text: `${t.to}: ${o.parties[1].name}`, size: o.FL, maxLines: 2, weight: 500, color: th0.inkSoft},
  ]);
  const replyHdr = o.compact ? hdr([
    {key: 'tag', text: o.replyTag, size: o.FL * 1.05, maxLines: 2, weight: 800, color: th0.accent2, after: o.FL * 0.4},
    {key: 'ref', text: R ? R.reference : '', size: o.FL, maxLines: 2, weight: 600, family: 'mono', color: th0.inkSoft},
  ], hinR) : hdr([
    {key: 'tag', text: o.replyTag, size: o.F * 1.06, maxLines: 2, weight: 800, color: th0.accent2, after: o.FL * 0.35},
    {key: 'ref', text: R ? R.reference : '', size: o.FL, maxLines: 1, weight: 600, family: 'mono', color: th0.inkSoft, after: o.FL * 0.3},
    {key: 're', text: `${t.re}: ${o.offer.reference}`, size: o.FL, maxLines: 2, weight: 500, color: th0.inkSoft, after: o.FL * 0.25},
    {key: 'from', text: `${t.from}: ${o.parties[1].name}`, size: o.FL, maxLines: 3, weight: 500, color: th0.inkSoft},
  ], hinR);
  // inlineHdr: the reply's tag and reference on one line when they fit side by side
  if (o.inlineHdr && replyHdr.lines.length === 2 && replyHdr.lines.every(ln => ln.fit)) {
    const [tg, rf] = replyHdr.lines;
    const gapX = o.FL * 0.7;
    if (tg.w + gapX + rf.w <= hinR) {
      const hh = Math.max(tg.h, rf.h);
      tg.y = SHEET.hp + (hh - tg.h) / 2;
      rf.y = SHEET.hp + (hh - rf.h) / 2 + (tg.fit.size - rf.fit.size) * 0.4;
      rf.x = tg.w + gapX;
      replyHdr.h = hh + 2 * SHEET.hp;
    }
  }
  return {labels, values, spare, extra, th, rows, offerHdr, replyHdr, inner, bad, labH, labelsAbove, replyBand, compact: o.compact ?? false};
}

/* ======================================================================== */
/* Stage geometry                                                            */
/* ======================================================================== */

/**
 * Lay out one stage: [A] [board: offer above, reply below] [B], floor at the
 * bottom of `box` (minus the actor chips). All units are design units.
 * Sheet (sheet-local, origin top-left): header-left = [header | labels | pieces];
 * header-above = header band over [labels | pieces].
 * @param {any} ctx
 * @param {object} o
 * @param {{x:number,y:number,w:number,h:number}} o.box   area the whole stage must fit (chips included)
 * @param {number} o.k      rig scale
 * @param {any} o.M         measureDocs() result for (o.tw, o.lw, o.hw, o.above, o.F, o.FL)
 * @param {number} o.tw  piece width  @param {number} o.lw  label column width  @param {number} o.hw  header width (header-left)
 * @param {boolean} o.above  header band above the columns
 * @param {any} o.response   resolveResponse() result
 * @param {boolean} o.latch  B's hand visits the latch of piece k
 * @param {number|null} [o.latchRow]  row whose latch is only pressed (no substitution)
 * @param {Array<any>|null} o.chips  fitted actor chip texts (null = none)
 * @param {number} o.chipSize
 * @param {boolean} [o.pullBack=true]  A draws the reply back (reach checked)
 * @param {'center'|'left'|'right'} [o.align='center']
 */
export function stageGeometry(ctx, o) {
  const k = o.k;
  const M = o.M;
  const why = [...M.bad];
  // side: the offer and the reply stand side by side on one wide board (rows aligned, the copy set glides
  // sideways): 'reply-left' = [A][reply][offer][B] (B works on the offer); 'reply-right' = [A][offer][reply][B]
  // (B works on the reply). Needs labels above the pieces and the offer header above its column.
  const side = o.side || null;
  if (side && !(M.labelsAbove && o.above)) why.push('side');
  const gapS = 34;
  // side by side with compact sheet headers: the offer's title and parties on a plate along the board's top
  const plate = side && M.compact && o.plateText && ctx.show('all')
    ? fitW(o.plateText, {maxWidth: 2 * (o.lw + SHEET.cp * 2 + o.tw + SHEET.spW) + gapS + 2 * SHEET.bp - 40, size: o.FL, minSize: o.FL, maxLines: 3, weight: 600})
    : null;
  if (plate && plate.bad) why.push('plate');
  const plateH = side && M.compact && o.plateText ? (plate ? plate.height : o.FL * 1.2) + 20 : 0;
  const N = o.terms.length;
  const {cp, spW, bp, sg} = SHEET;
  const th = M.th, tg = TILE.gap;
  const labGap = M.labelsAbove ? M.labH + 6 : 0;   // label line(s) printed above each piece
  const colIn = N * (labGap + th) + (N - 1) * tg;
  const cw = cp + o.tw + spW + cp;
  const lw = o.lw;
  const above = Boolean(o.above);
  const hdrH = Math.max(M.offerHdr.h, M.replyHdr.h);
  // header-left: [header | labels | pieces]; header-above (offer) / header-below (reply): the two piece
  // columns face each other across the gap, so the copy set never passes over a header
  const colHt = colIn + 2 * cp + 8;
  const hO = M.offerHdr.h, hR = M.replyHdr.h;
  // each sheet has its own height: header-left = max(column, header); header-above (offer) / below (reply)
  const shO = above ? hO + colHt : Math.max(colHt, hO);
  const shR = M.replyBand ? colHt + hR : Math.max(colHt, hR);
  const colTopO = above ? hO : (shO - colHt) / 2;   // column top in the offer sheet
  const colTopR = M.replyBand ? 0 : (shR - colHt) / 2; // column top in the reply sheet (header on its left, or a band below)
  // Ry - Oy: side by side = rows aligned; stacked = the reply sheet starts below the whole offer sheet
  const replyOffY = side ? colTopO - colTopR : Math.max(colTopO + colHt + sg - colTopR, shO + sg);
  const sh = Math.max(shO, shR);
  const hw = above ? 0 : o.hw;
  const sw = hw + lw + cw;
  const pitch = labGap + th + tg;
  const rowIn = i => (colHt - colIn) / 2 + labGap + th / 2 + i * pitch; // piece centre inside a column
  const rowY = i => colTopO + rowIn(i);                          // offer-sheet-local
  const rowYR = i => colTopR + rowIn(i);                         // reply-sheet-local
  const chips = o.chips;
  const chipH = Math.max(chips ? Math.max(...chips.map(f => f.height)) + o.chipSize * 0.72 + 10 : 0, o.minRowH || 0);
  const floorY = o.box.y + o.box.h - (chipH ? chipH + 12 : 10);
  const R = o.response;
  const sub = Boolean(R && R.substituted);
  const latchRow = sub ? R.k : (o.latchRow ?? null);
  const useLatch = Boolean(o.latch) && latchRow !== null;
  // quick rejects (searches; o.full forces the whole geometry): the stacked sheets, or B, taller than the box
  if (!o.full) {
    if (replyOffY + shR + bp + plateH + 29 > floorY - o.box.y) return {ok: false, partial: true, why: ['top', 'floor']};
    if (floorY - 414 * k < o.box.y - 0.5) return {ok: false, partial: true, why: ['topHead']};
  }
  // ---- vertical (independent of x): B works on the offer only; the set glides down on its own
  const leverUp = 30;                 // lever grip above the spine top
  const offY = {lever: rowY(0) - th / 2 - 4 - leverUp, latch: useLatch ? rowY(latchRow) : null};
  const needs = [offY.lever, offY.latch].filter(v => v !== null);
  // inspect (replySwap): B works on the reply's row instead of the offer (offer-local offset of that row)
  const replyRowOff = sub && o.replySwap ? replyOffY + colTopR + rowIn(R.k) : null;
  const needMid = replyRowOff !== null ? replyRowOff : (Math.min(...needs) + Math.max(...needs)) / 2;
  const sAy = floorY + RIG.near.y * k;
  const pullTab = 24;
  const dxEnd = 0.45 * pullTab + (RIG.front + 14 - RIG.near.x) * k;
  const holdY = floorY - Math.min(288 * k, Math.max(236 * k, o.tw + 24));   // the held piece hangs below the chin
  // relative horizontal layout (B at x = 0): used for the reach checks of every vertical candidate
  const layoutX = (Bx, pull, stepH = 0) => {
    const B = {x: Bx, floor: floorY - stepH, f: -1, k};
    const hold = {x: Bx - 24 * k, y: holdY - stepH};
    const spareBox = sub ? {x: hold.x - th / 2 - 4, y: hold.y - 6, w: th + 8, h: o.tw + 12} : null;
    // the far hand at the lever stays clear of B's torso front and of the held piece
    let xL = Bx - (RIG.front + 16) * k;
    // the spine (where the far hand presses a latch) stays clear of the piece B holds at the chest
    if (spareBox) xL = Math.min(xL, spareBox.x - 6 - 16 * k + 30);
    // (inspect: B works on the reply itself; its sheet's edge and the board rim stay clear of the held piece)
    if (spareBox && o.replySwap) xL = Math.min(xL, spareBox.x - 10);
    const xSpB = xL - 30;                 // spine centre next to B (lever grip 30 to its right)
    const colRB = xSpB + spW / 2 + cp;    // that sheet's right edge
    let x0, x0R;
    if (side === 'reply-right') { x0R = colRB - sw; x0 = x0R - gapS - sw; }
    else { x0 = colRB - sw; x0R = side ? x0 - gapS - sw : x0; }
    const colR = x0 + sw;                 // offer column right edge (= offer sheet right edge)
    const xSp = colR - cp - spW / 2;      // offer spine centre
    const xSpR = xSp + (x0R - x0);        // reply spine centre
    const labX = x0 + hw;
    const colX = labX + lw;
    const A = {x: Math.min(x0, x0R) - pullTab - pull - (RIG.front + 14) * k, floor: floorY, f: 1, k};
    return {B, A, hold, spareBox, xL, xSp, xSpR, colR, x0, x0R, labX, colX};
  };
  const vertical = (lift, stepH) => {
    const sFarY = floorY - stepH + RIG.far.y * k;
    const Oy = sFarY - lift * RIG.reach * k - needMid;
    const Ry = Oy + replyOffY;
    const tabY = clamp(sAy + RIG.reach * k * 0.3, Ry + Math.min(36, shR / 2), Ry + shR - Math.min(36, shR / 2));
    const reachA = Math.sqrt(Math.max(0, (RIG.reach * k * 0.95) ** 2 - (tabY - sAy) ** 2));
    const pull = o.pullBack === false ? 0 : Math.max(0, Math.min(Math.max(60, sw * 0.3), reachA - dxEnd));
    const X = layoutX(0, pull, stepH);
    const bad = [];
    if (o.pullBack !== false && pull < 40) bad.push('pull');
    if (Math.max(Ry + shR, Oy + shO) + 3 + 26 > floorY) bad.push('floor');
    if (Math.min(Math.min(Oy, Oy + replyOffY) - bp - plateH - 2, Oy + offY.lever - 20) < o.box.y - 0.5) bad.push('top');
    // searches: the reach checks only when the box checks pass (same verdict)
    if (o.fast && bad.length) return {Oy, Ry, tabY, pull, stepH, bad};
    const lever = {x: X.xL, y: Oy + offY.lever};
    if (!o.replySwap && !canReach(X.B, 'far', lever)) bad.push('reach:lever');
    if (useLatch && !canReach(X.B, 'far', {x: X.xSp + 3, y: Oy + offY.latch})) bad.push('reach:latch');
    if (sub && !o.replySwap && !canReach(X.B, 'near', {x: X.xSp - spW / 2 - 2, y: Oy + rowY(R.k)})) bad.push('reach:slot');
    if (sub && o.replySwap) {
      // inspect: B also works on the reply (the far hand lifts the copy out, the near hand seats the piece)
      const yk = Ry + colTopR + rowIn(R.k);
      if (!canReach(X.B, 'far', {x: X.xSpR + 3, y: yk}) || !canReach(X.B, 'far', {x: X.xSpR - spW / 2 + 2, y: yk - 6})) bad.push('reach:replyLatch');
      if (!canReach(X.B, 'near', {x: X.xSpR - spW / 2 - 2, y: yk})) bad.push('reach:replySlot');
      if (!canReach(X.B, 'far', {x: X.B.x - 34 * k, y: X.B.floor - 236 * k})) bad.push('reach:holdFar');
    }
    return {Oy, Ry, tabY, pull, stepH, bad};
  };
  let V = null;
  // B may stand on a small step stool (0 = none) so that the offer is in B's reach while the reply stays in A's
  const steps = o.steps || [0];
  outer: for (const sf of steps) {
    for (const lift of o.replySwap ? [-0.55, -0.4, -0.25, -0.1, 0.05, 0.2, 0.35] : [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
      const c = vertical(lift, sf * 305 * k);
      if (!V || c.bad.length < V.bad.length) V = c;
      if (!c.bad.length) break outer;
    }
  }
  const {Oy, Ry, tabY, stepH} = V;
  // the pull shrinks (down to 40) when the stage would otherwise be too wide
  let pull = V.pull;
  {
    const Pw = layoutX(0, pull, stepH);
    const wNeed = 56 * k + (stepH ? 20 : 0) - (Pw.A.x - 56 * k);
    if (wNeed > o.box.w && pull > 40) pull = Math.max(40, pull - (wNeed - o.box.w));
  }
  why.push(...V.bad);
  const D = Ry + colTopR - (Oy + colTopO);        // copy set travel (vertical; 0 side by side)
  const replyBottom = Ry + shR;
  const boardBottom = Math.max(replyBottom, Oy + shO);
  // ---- horizontal placement
  let P = layoutX(0, pull, stepH);
  const W0 = 56 * k + (stepH ? 20 : 0) - (P.A.x - 56 * k);
  const slack = o.box.w - W0;
  const Bx = o.box.x + o.box.w - 56 * k - (stepH ? 20 : 0) - (o.align === 'right' || o.align === 'spread' ? 0 : o.align === 'left' ? slack : slack / 2);
  P = layoutX(Bx, pull, stepH);
  // spread (the board and B at the right of the box; A waits at its left edge, away from the rail): the scene spans its
  // whole box
  if (o.align === 'spread' && slack > 0) P = {...P, A: {...P.A, x: P.A.x - slack}};
  if (slack < -0.5) why.push(`width:${Math.round(-slack)}`);
  const {A, B, hold, spareBox, xL, xSp, xSpR, colR, x0, x0R, labX, colX} = P;
  const rdx = x0R - x0;
  const boardX = Math.min(x0, x0R) - bp, boardTop = Math.min(Oy, Ry) - bp - plateH;
  const board = {x: boardX, y: boardTop, w: (side ? 2 * sw + gapS : sw) + 2 * bp, h: (boardBottom + 12) - boardTop};
  const railY = replyBottom + 3;
  const legs = [{x: board.x + 26}, {x: board.x + board.w - 26}];
  const pts = {
    lever: {x: xL, y: Oy + offY.lever},
    latch: useLatch ? {x: xSp + 3, y: Oy + offY.latch} : null,
    slot: sub ? {x: xSp - spW / 2 - 2, y: Oy + rowY(R.k)} : null,
    hold,
    gripStart: {x: x0R - pullTab * 0.55, y: tabY},
  };
  pts.gripEnd = {x: pts.gripStart.x - pull, y: tabY};
  // ---- remaining checks
  const reach = [];
  const need = (fig, which, name, q) => { if (q && !canReach(fig, which, q)) reach.push(name); };
  if (sub) need(B, 'near', 'hold', pts.hold);
  if (o.pullBack !== false) { need(A, 'near', 'gripStart', pts.gripStart); need(A, 'near', 'gripEnd', pts.gripEnd); }
  if (reach.length) why.push(`reach:${reach.join(',')}`);
  const headA = headBox(A), headB = headBox(B);
  if (overlaps(headB, board, 4)) why.push('faceB');
  if (overlaps(headA, board, 4) || overlaps(headA, {x: x0R - pull - pullTab - 6, y: Ry - 4, w: sw + pull + pullTab, h: shR + 8}, 4)) why.push('faceA');
  if (spareBox && spareBox.y + spareBox.h > floorY - stepH - 2) why.push('spareFloor');
  if (spareBox && overlaps(spareBox, {x: board.x + board.w - bp, y: board.y, w: bp, h: board.h}, 2)) why.push('spareBoard');
  if (Math.min(headA.y, headB.y) < o.box.y - 0.5) why.push('topHead');
  const chipBoxes = chips ? [A, B].map((fig, i) => {
    const w = chips[i].width + o.chipSize * 1.2, hh = chips[i].height + o.chipSize * 0.72;
    const cx = clamp(fig.x, o.box.x + w / 2, o.box.x + o.box.w - w / 2);
    return {x: cx - w / 2, y: floorY + 12, w, h: hh};
  }) : null;
  if (chipBoxes && overlaps(chipBoxes[0], chipBoxes[1], 10)) why.push('chips');
  const rail = side
    ? {x: x0R - pullTab - pull - 16, y: railY, w: sw + pullTab + pull + 32, h: 10}
    : {x: x0 - pullTab - pull - 16, y: railY, w: colR + bp - (x0 - pullTab - pull - 16), h: 10};
  const stool = stepH ? {x: B.x - 46 * k, y: floorY - stepH, w: 100 * k, h: stepH} : null;
  if (stool && overlaps(stool, {x: board.x, y: board.y, w: board.w, h: railY + 12 - board.y}, 2)) why.push('stool');
  const extent = unionBox([board, rail, figureBox(A), figureBox(B), stool, ...(chipBoxes || [])]);
  return {
    ok: why.length === 0, why, k, F: o.F, FL: o.FL, tw: o.tw, lw, hw, M, N, th, tg, pitch, labGap, sh, shO, shR, sw, cw, D, rowY, rowYR, rowIn, colIn, colTopO, colTopR, colHt, above, hdrH,
    A, B, floorY, board, rail, railY, legs, x0, x0R, rdx, side, gapS, labX, colX, colR, xSp, xSpR, xL, Oy, Ry, pull, pullTab, pts, spareBox, hold, leverUp, stepH, stool,
    plate, plateH, useLatch, latchRow: useLatch ? latchRow : null, response: R, chips, chipBoxes, chipSize: o.chipSize, extent,
    offer: o.offer, terms: o.terms, parties: o.parties, replyTag: o.replyTag, headA, headB, box: o.box,
  };
}

/* ======================================================================== */
/* Art                                                                       */
/* ======================================================================== */

/** Tab colour of piece i (neutral palette colours; never red for a state). */
export function tabColor(ctx, i) {
  const th = ctx.theme;
  return [th.accent4, th.accent3, '#7a5c8e', th.accent][i % 4];
}

/**
 * One term piece (the value of one field). Local origin = its grip (right
 * end, vertical middle); the body spans x ∈ [-tw, 0]. `kind`: 'printed' (on
 * the offer), 'copy' (raised card), 'spare' (a different piece: blue tab,
 * pale-blue stock, patterned back side).
 */
export function pieceArt(ctx, o) {
  const th = ctx.theme;
  const {tw, th: hh} = o;
  const x0 = -tw, y0 = -hh / 2;
  const printed = o.kind === 'printed';
  const spare = o.kind === 'spare';
  const tab = spare ? th.accent2 : o.tab;
  const body = spare ? '#e6eef6' : printed ? th.paper : th.card;
  const parts = [];
  if (!printed) parts.push(h('path', {d: roundRectPath(x0 + 4, y0 + 5, tw, hh, 7), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x0, y0, tw, hh, 7), fill: body, stroke: printed ? th.paperLine : INK, 'stroke-width': printed ? 1.6 : 2.2}));
  parts.push(h('path', {d: `M${r(x0 + 7)} ${r(y0)}H${r(x0 + TILE.tabW)}V${r(y0 + hh)}H${r(x0 + 7)}Q${r(x0)} ${r(y0 + hh)} ${r(x0)} ${r(y0 + hh - 7)}V${r(y0 + 7)}Q${r(x0)} ${r(y0)} ${r(x0 + 7)} ${r(y0)}Z`, fill: tab}));
  const tx = x0 + TILE.tabW + TILE.padL;
  if (o.value) parts.push(textBlock(o.value, {x: tx, y: -o.value.height / 2, fill: th.ink, name: o.name ? `${o.name}-val` : undefined}));
  else if (o.bars) {
    // labels hidden: neutral print lines on the piece (decorative; never replaces shown text)
    parts.push(h('rect', {x: r(tx), y: r(-hh * 0.14), width: r((tw - TILE.tabW - TILE.padL - TILE.gripM) * o.bars), height: r(Math.max(6, hh * 0.24)), rx: 3, fill: printed ? th.inkSoft : th.ink, opacity: printed ? 0.45 : 0.62}));
  }
  const front = g({name: o.name ? `${o.name}-front` : undefined}, parts);
  let back = null;
  if (o.back) {
    const stripes = [];
    for (let x = x0 + 18; x < 0; x += 22) stripes.push(`M${r(x)} ${r(y0 + 4)}l${r(-10)} ${r(hh - 8)}`);
    back = g({name: `${o.name}-back`},
      h('path', {d: roundRectPath(x0 + 4, y0 + 5, tw, hh, 7), fill: th.shadow}),
      h('path', {d: roundRectPath(x0, y0, tw, hh, 7), fill: o.plainBack ? th.paperShade : '#d9e3ec', stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: stripes.join(''), stroke: o.plainBack ? th.paperLine : '#b9c9d8', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none'}),
      h('path', {d: roundRectPath(x0 + 8, y0 + 8, tw - 16, hh - 16, 5), fill: 'none', stroke: '#9fb3c6', 'stroke-width': 1.6, 'stroke-dasharray': '4 5'}));
  }
  return {front, back};
}

/**
 * Build the stage art from a geometry. Layers (back → front): floor, board,
 * offer sheet (labels + printed pieces), reply sheet (labels + slots), copy
 * set, pieces, rigs, the different piece + thumb, actor chips.
 * @param {any} ctx
 * @param {ReturnType<typeof stageGeometry>} G
 * @param {{prefix:string, looks?:any[]}} o
 */
export function buildStage(ctx, G, o) {
  const P = o.prefix;
  const th = ctx.theme;
  const show = ctx.show('all');
  const k = G.k;
  const looks = o.looks || [actorLook(ctx, G.parties[0], 0), actorLook(ctx, G.parties[1], 1)];
  const rigA = personRig(ctx, {name: `${P}-A`, look: looks[0]});
  const rigB = personRig(ctx, {name: `${P}-B`, look: looks[1]});
  const {M, tw, th: hh, sh, sw, x0, labX, colX, xSp, Oy, Ry, N} = G;
  const R = G.response;
  const floorFill = th.dark ? '#3a3f46' : '#e4d9c4';
  const bar = i => 0.35 + 0.45 * ctx.rng('piece-bar', i);
  // ---- floor + board
  const floorX0 = Math.min(G.extent.x, G.A.x - 70 * k), floorX1 = Math.max(G.extent.x + G.extent.w, G.B.x + 70 * k);
  const st = G.stool;
  const floor = g(null,
    h('path', {d: roundRectPath(floorX0, G.floorY - 6 * k, floorX1 - floorX0, 14 * k, 7 * k), fill: floorFill}),
    st ? g(null,
      h('path', {d: roundRectPath(st.x + 5, st.y + 7, st.w, st.h, 8), fill: th.shadow}),
      h('path', {d: roundRectPath(st.x, st.y, st.w, st.h, 8), fill: th.wood, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M${r(st.x + 10)} ${r(st.y + 12)}H${r(st.x + st.w - 10)}`, stroke: '#ffffff', 'stroke-width': 2.5, opacity: 0.35}),
      h('path', {d: `M${r(st.x + st.w * 0.3)} ${r(st.y + st.h * 0.45)}H${r(st.x + st.w * 0.7)}`, stroke: th.woodDark, 'stroke-width': 5, 'stroke-linecap': 'round'})) : null,
    ...[G.A, G.B].map(f => h('ellipse', {cx: f.x, cy: f.floor - 2, rx: 46 * k, ry: 8 * k, fill: th.shadow})));
  const B0 = G.board;
  const wood = th.woodTop, woodDark = th.woodDark;
  // guide rails of the copy set (both sides of the piece column, from the offer to the reply)
  const railTop = Oy + G.colTopO + 6, railBot = Ry + G.colTopR + G.colHt - 6;
  const rdx = G.rdx || 0;
  const guides = G.side
    // side by side: two horizontal guides along the column's top and bottom, from one sheet's column to the other's
    ? [Oy + G.colTopO + 5, Oy + G.colTopO + G.colHt - 5].map(y => { const xa = Math.min(G.colX, G.colX + rdx) + 3, xb = Math.max(G.colR, G.colR + rdx) - 3; return h('path', {d: roundRectPath(xa, y - 3, xb - xa, 6, 3), fill: shade(wood, -0.25), opacity: 0.8}); })
    : [G.colX + 3, G.colR - 3].map(x => h('path', {d: roundRectPath(x - 3, railTop, 6, railBot - railTop, 3), fill: shade(wood, -0.25), opacity: 0.8}));
  const boardNode = g({name: `${P}-board`},
    ...G.legs.map(l => g(null,
      h('rect', {x: r(l.x - 7), y: r(B0.y + B0.h - 4), width: 14, height: r(Math.max(0, G.floorY - (B0.y + B0.h) + 2)), fill: woodDark, stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(l.x - 26, G.floorY - 9, 52, 10, 4), fill: woodDark, stroke: INK, 'stroke-width': 2.2}))),
    h('path', {d: roundRectPath(B0.x + 6, B0.y + 9, B0.w, B0.h, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(B0.x, B0.y, B0.w, B0.h, 14), fill: wood, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(B0.x + 7, B0.y + 7, B0.w - 14, B0.h - 14, 9), fill: 'none', stroke: shade(wood, -0.18), 'stroke-width': 2}),
    G.plateH ? g({name: `${P}-plate`},
      h('path', {d: roundRectPath(B0.x + 12, B0.y + 8, B0.w - 24, G.plateH - 6, 6), fill: th.paper, stroke: INK, 'stroke-width': 2}),
      G.plate
        ? textBlock(G.plate, {x: B0.x + 26, y: B0.y + 8 + (G.plateH - 6 - G.plate.height) / 2, fill: th.ink, name: `${P}-plate-t`})
        : h('rect', {x: r(B0.x + 26), y: r(B0.y + 8 + (G.plateH - 6) / 2 - 5), width: r((B0.w - 52) * 0.5), height: 10, rx: 3, fill: th.paperLine})) : null,
    guides);
  const rl = G.rail;
  const railNode = g(null,
    h('path', {d: roundRectPath(rl.x, rl.y, rl.w, rl.h, 5), fill: th.metal, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(rl.x + 6)} ${r(rl.y + 3)}H${r(rl.x + rl.w - 6)}`, stroke: '#ffffff', 'stroke-width': 2, opacity: 0.5}),
    h('rect', {x: r(rl.x + 8), y: r(rl.y + rl.h - 1), width: 8, height: r(Math.max(0, G.floorY - rl.y - rl.h - 8)), fill: th.metalDark, stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(rl.x - 8, G.floorY - 9, 40, 10, 4), fill: th.metalDark, stroke: INK, 'stroke-width': 2}));

  // ---- sheets (drawn in sheet-local x; translated to x0)
  // header band top: header-left → centred beside the columns; header-above/below → its own band
  const hdrY = (hd, which) => (which === 'offer' ? (G.above ? 0 : (G.shO - hd.h) / 2) : M.replyBand ? G.colHt : (G.shR - hd.h) / 2);
  const hdrX = which => (which === 'reply' && M.replyBand ? colX - x0 : 0);
  const hdrNodes = (hd, y, which, name) => hd.lines.map(ln => (ln.fit
    ? textBlock(ln.fit, {x: hdrX(which) + SHEET.hp, y: y + hdrY(hd, which) + ln.y, fill: ln.color, name: `${name}-${ln.key}`})
    : h('rect', {x: hdrX(which) + SHEET.hp, y: r(y + hdrY(hd, which) + ln.y + ln.h * 0.2), width: r(ln.w * (ln.key === 'title' || ln.key === 'tag' ? 0.9 : 0.7)), height: r(ln.h * 0.55), rx: 3, fill: ln.key === 'title' || ln.key === 'tag' ? th.inkSoft : th.paperLine, opacity: ln.key === 'title' || ln.key === 'tag' ? 0.5 : 1})));
  const labAt = (y, rowFn, i) => (M.labelsAbove
    ? {x: colX - x0 + SHEET.cp + 2, y: y + rowFn(i) - hh / 2 - G.labGap}
    : {x: labX - x0 + SHEET.lp, y: y + rowFn(i) - (M.labels[i] ? M.labels[i].height : 10) / 2});
  const labelNodes = (y, rowFn, name) => G.terms.map((t, i) => (M.labels[i]
    ? textBlock(M.labels[i], {...labAt(y, rowFn, i), fill: th.inkSoft, name: `${name}${i}`})
    : h('rect', {...(p => ({x: r(p.x), y: r(p.y + 3)}))(labAt(y, rowFn, i)), width: r((M.labelsAbove ? G.tw : G.lw - SHEET.lp * 2) * 0.45), height: 10, rx: 3, fill: th.paperLine})));
  const sheetBase = (y, fill, colTop, rowFn, name, shX, reply) => g(null,
    h('path', {d: roundRectPath(5, y + 7, sw, shX, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, y, sw, shX, 6), fill, stroke: INK, 'stroke-width': 2.4}),
    reply
      ? (M.replyBand ? h('path', {d: `M10 ${r(y + G.colHt)}H${r(sw - 10)}`, stroke: th.paperLine, 'stroke-width': 2}) : h('path', {d: `M${r(colX - x0)} ${r(y + 10)}V${r(y + shX - 10)}`, stroke: th.paperLine, 'stroke-width': 2}))
      : G.above
        ? h('path', {d: `M10 ${r(y + colTop)}H${r(sw - 10)}`, stroke: th.paperLine, 'stroke-width': 2})
        : h('path', {d: `M${r(G.hw)} ${r(y + 10)}V${r(y + shX - 10)}`, stroke: th.paperLine, 'stroke-width': 2}),
    h('rect', {x: r(colX - x0 + 3), y: r(y + colTop + 4), width: r(G.cw - 7), height: r(G.colHt - 8), rx: 4, fill: shade(fill, -0.035)}),
    reply || M.labelsAbove ? null : G.terms.slice(1).map((_, j) => h('path', {d: `M${r(labX - x0 + 8)} ${r(y + rowFn(j + 1) - G.pitch / 2)}H${r(colX - x0 - 4)}`, stroke: th.paperLine, 'stroke-width': 1.6, 'stroke-dasharray': '3 5'})),
    reply ? null : labelNodes(y, rowFn, name));
  const printed = G.terms.map((t, i) => {
    const art = pieceArt(ctx, {tw, th: hh, kind: 'printed', tab: tabColor(ctx, i), value: show ? M.values[i] : null, bars: show ? 0 : bar(i), name: `${P}-pr${i}`});
    return g({transform: T(xSp - SHEET.spW / 2 - x0, Oy + G.rowY(i))}, art.front);
  });
  const offerNode = g({name: `${P}-offer`, transform: T(x0, 0)},
    sheetBase(Oy, th.paper, G.colTopO, G.rowY, `${P}-ol`, G.shO),
    h('path', {d: roundRectPath(sw * 0.42, Oy - 12, sw * 0.16, 18, 5), fill: th.metal, stroke: INK, 'stroke-width': 2}),
    hdrNodes(M.offerHdr, Oy, 'offer', `${P}-oh`),
    printed);
  const slots = G.terms.map((_, i) => h('path', {d: roundRectPath(xSp - SHEET.spW / 2 - tw - x0, Ry + G.rowYR(i) - hh / 2, tw, hh, 7), fill: 'none', stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
  const tabY = G.pts.gripStart.y;
  const replyNode = g({name: `${P}-reply`},
    g({transform: T(x0 + rdx, 0)},
      h('path', {d: roundRectPath(-G.pullTab - 4, tabY - 24, G.pullTab + 12, 48, 10), fill: th.accent2Soft, stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: r(-G.pullTab * 0.5), cy: r(tabY), r: 6.5, fill: 'none', stroke: INK, 'stroke-width': 2}),
      sheetBase(Ry, th.card, G.colTopR, G.rowYR, `${P}-rl`, G.shR, true),
      hdrNodes(M.replyHdr, Ry, 'reply', `${P}-rh`),
      slots));
  // ---- copy set (spine + latches + release lever), set-local: x = spine centre, y = offer column top
  const r0 = G.rowIn(0), rN = G.rowIn(N - 1);
  const spineTop = r0 - hh / 2 - 4, spineBot = rN + hh / 2 + 4;
  const latches = G.terms.map((_, i) => g({name: `${P}-latch${i}`, transform: T(0, G.rowIn(i))},
    g({name: `${P}-latch${i}-arm`},
      h('path', {d: roundRectPath(-5, -15, 18, 30, 5), fill: th.metalDark, stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: 4, cy: 0, r: 3.4, fill: '#ffffff'}))));
  const lever = g({name: `${P}-lever`, transform: T(0, spineTop)},
    h('path', {d: `M0 0L${r(30)} ${r(-G.leverUp + 6)}`, stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round'}),
    h('path', {d: `M0 0L${r(30)} ${r(-G.leverUp + 6)}`, stroke: th.metal, 'stroke-width': 5.5, 'stroke-linecap': 'round'}),
    h('circle', {cx: 30, cy: r(-G.leverUp + 6), r: 9, fill: th.accent2, stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: 0, cy: 0, r: 5.5, fill: th.metalDark, stroke: INK, 'stroke-width': 2}));
  const spine = g({name: `${P}-set`},
    h('path', {d: roundRectPath(-SHEET.spW / 2, spineTop, SHEET.spW, spineBot - spineTop, 5), fill: th.metal, stroke: INK, 'stroke-width': 2.2}),
    latches, lever);
  // o.swapRow: the copy in that row can be lifted out of the reply and turned face-down (inspect)
  const copies = G.terms.map((t, i) => {
    const turn = o.swapRow === i;
    const art = pieceArt(ctx, {tw, th: hh, kind: 'copy', tab: tabColor(ctx, i), value: show ? M.values[i] : null, bars: show ? 0 : bar(i), name: `${P}-cp${i}`, back: turn, plainBack: true});
    return g({name: `${P}-c${i}`, 'data-occludes': 1}, turn ? g({name: `${P}-c${i}-in`}, g({name: `${P}-c${i}-f`}, art.front), g({name: `${P}-c${i}-b`, opacity: 0}, art.back)) : art.front);
  });
  let spare = null, thumb = null;
  if (R && R.substituted) {
    const art = pieceArt(ctx, {tw, th: hh, kind: 'spare', value: show ? M.spare : null, bars: show ? 0 : bar(9), name: `${P}-sp`, back: true});
    spare = g({name: `${P}-spare`, 'data-occludes': 1}, g({name: `${P}-sp-face`}, art.front), g({name: `${P}-sp-flip`}, art.back));
    thumb = thumbArt(`${P}-thumb`, looks[1].skin, k);
  }
  const chipNodes = [];
  if (G.chips) G.chipBoxes.forEach((b, i) => chipNodes.push(chipW(ctx, '', {x: b.x, y: b.y, size: G.chipSize, fit: G.chips[i], maxWidth: b.w, name: `${P}-chip${i}`}).node));
  const layers = {
    back: g(null, floor, boardNode, railNode, offerNode),
    reply: replyNode,
    pieces: g(null, copies),
    set: spine,
    rigs: g(null, rigA.node, rigB.node),
    front: g(null, spare, thumb),
    chips: g(null, chipNodes),
  };
  const node = g({name: P}, layers.back, layers.reply, layers.pieces, layers.set, layers.rigs, layers.front, layers.chips);
  const restA = rigA.frame({x: G.A.x, y: G.floorY, facing: 1, scale: k}).hands;
  const restB = rigB.frame({x: G.B.x, y: G.B.floor, facing: -1, scale: k}).hands;
  const setOffer = {x: xSp, y: Oy + G.colTopO}, setReply = {x: xSp + rdx, y: Ry + G.colTopR};

  /**
   * Pose the stage (values 0..1; pure).
   *  latchReach: B's far hand rest → latch k; latchPress: the latch is pressed (it opens for a substitution);
   *  toLever: far hand → the release lever; leverPress: the lever is pressed; slide: the released copy set
   *  glides down its rails into the reply; farBack: far hand → rest;
   *  insert: B's near hand swings the different piece from the chest onto slot k of the set (turning
   *  face-up; the latch snaps shut on it); nearBack: near hand → rest;
   *  pullReach: A's hand → the reply's tab; pull: the reply slides back toward A; headA/headB: head tilt.
   */
  function pose(v) {
    const val = key => clamp(v[key] ?? 0);
    const nodes = {};
    // keep: the stage holds a different piece but the latch is only pressed and the piece is never used
    const keep = Boolean(v.keep);
    const sub = Boolean(R && R.substituted) && !keep;
    const hasSpare = Boolean(R && R.substituted);
    const kk = G.latchRow ?? (R && R.substituted ? R.k : null);
    const pullE = ease.inOutCubic(val('pull'));
    const dx = -G.pull * pullE;
    // the copy set glides (slow start, damped arrival) and then rides with the reply
    const sl = val('slide');
    const slideE = sl < 1 ? ease.inOutCubic(sl) : 1;
    const setPos = {x: lerp(setOffer.x, setReply.x, slideE) + (sl >= 1 ? dx : 0), y: lerp(setOffer.y, setReply.y, slideE)};
    // ---- B's far hand: latch → lever → press → rest
    const rF = restB.far;
    const lr = ease.inOutCubic(val('latchReach')), lp = val('latchPress');
    const tl = ease.inOutCubic(val('toLever')), lvp = val('leverPress');
    const leverDown = Math.sin(Math.PI * Math.min(1, lvp)) * 0.6 + (lvp >= 1 ? 0 : 0);
    const leverPt = {x: G.pts.lever.x - 4 * leverDown, y: G.pts.lever.y + 10 * leverDown};
    const latchPt = G.useLatch ? {x: G.pts.latch.x - (G.useLatch ? Math.sin(Math.PI * lp) * 6 : 0), y: G.pts.latch.y} : null;
    let far = null;
    if (val('farBack') > 0) far = mix(G.pts.lever, rF, ease.inOutCubic(val('farBack')));
    else if (val('toLever') > 0 || val('leverPress') > 0) far = mix(G.useLatch && val('latchReach') >= 1 ? G.pts.latch : rF, leverPt, val('leverPress') > 0 ? 1 : tl);
    else if (G.useLatch && val('latchReach') > 0) far = mix(rF, latchPt, lr);
    // ---- B's near hand (the different piece)
    const ins = val('insert');
    let near = hasSpare ? G.pts.hold : null, flip = 0, rot = -90, seatGate = 1, len = 1;
    if (sub) {
      // The different piece never passes over the board's other rows or labels, nor over B's face: it hangs upright
      // at B's side, clear of the pieces column and below its own row, while B brings it level with that row; there
      // it turns edge-on (a turn toward the viewer: its length shortens to a sliver), turns level as a sliver, moves
      // to the column's edge, rises into its row and unfolds leftward into its own slot.
      const slot = G.pts.slot;
      const P0 = {x: slot.x + hh / 2 + 4, y: slot.y + hh / 2 + 6};
      const P1 = {x: slot.x, y: P0.y};
      const sliver = Math.min(1, 7 / tw);
      if (ins < 0.4) {
        const q = ease.inOutCubic(ins / 0.4);
        near = {x: Math.max(P0.x, lerp(G.pts.hold.x, P0.x, q) + Math.sin(Math.PI * q) * 14 * k), y: lerp(G.pts.hold.y, P0.y, q)};
        // (it turns edge-on as it goes: its lower end never hangs lower than at rest, clear of the name chips)
        len = Math.max(sliver, Math.min(1, (G.pts.hold.y + tw - near.y) / tw));
      } else if (ins < 0.55) {
        near = P0;
        const l0 = Math.max(sliver, Math.min(1, (G.pts.hold.y + tw - P0.y) / tw));
        len = lerp(l0, sliver, ease.inOutCubic((ins - 0.4) / 0.15));
      } else if (ins < 0.65) {
        near = P0;
        len = sliver;
        rot = -90 * (1 - ease.inOutCubic((ins - 0.55) / 0.1));
      } else if (ins < 0.85) {
        len = sliver;
        rot = 0;
        const e = (ins - 0.65) / 0.2;
        near = e < 0.5 ? mix(P0, P1, ease.inOutCubic(e / 0.5)) : mix(P1, slot, ease.inOutCubic((e - 0.5) / 0.5));
      } else {
        near = slot;
        rot = 0;
        len = lerp(sliver, 1, ease.inOutCubic((ins - 0.85) / 0.15));
      }
      if (val('nearBack') > 0) near = mix(slot, restB.near, ease.inOutCubic(val('nearBack')));
      flip = clamp((ins - 0.2) / 0.45);
      // its printed value shows only once it is seated at full length in its own row, never while it passes or turns
      seatGate = ins >= 1 ? 1 : 0;
    }
    // ---- swap in the reply (inspect): the far hand lifts the copy out (turning it face-down) and holds it at the
    // side; the near hand seats the held piece in the empty slot and turns it face-up there
    const swap = Boolean(v.swap) && hasSpare;
    let swapSem = null;
    if (swap) {
      const rs = {x: xSp + rdx - SHEET.spW / 2 - 2, y: Ry + G.rowYR(kk)};
      const lt = {x: xSp + rdx + 3, y: rs.y};
      const holdFar = {x: G.B.x - 34 * k, y: G.B.floor - 236 * k};
      const rem = val('remove'), ins2 = val('insert');
      if (rem > 0) {
        if (rem < 0.3) far = mix(rF, lt, ease.inOutCubic(rem / 0.3));
        else if (rem < 0.4) far = {x: lt.x - Math.sin(Math.PI * (rem - 0.3) / 0.1) * 6, y: lt.y};
        else if (rem < 0.55) far = mix(lt, {x: rs.x + 4, y: rs.y - 6}, ease.inOutCubic((rem - 0.4) / 0.15));
        else far = mix({x: rs.x + 4, y: rs.y - 6}, holdFar, ease.inOutCubic((rem - 0.55) / 0.45));
      }
      near = G.pts.hold;
      const pre = {x: rs.x + 34, y: rs.y};
      if (ins2 > 0) {
        if (ins2 < 0.8) { const q = ease.inOutCubic(ins2 / 0.8); near = {x: lerp(G.pts.hold.x, pre.x, q), y: lerp(G.pts.hold.y, pre.y, q) - Math.sin(Math.PI * q) * 30 * k}; }
        else near = mix(pre, rs, ease.outCubic((ins2 - 0.8) / 0.2));
      }
      if (val('nearBack') > 0) near = mix(rs, restB.near, ease.inOutCubic(val('nearBack')));
      rot = -90 * (1 - ease.inOutCubic(clamp(ins2 / 0.7)));
      flip = clamp((val('turn') - 0) / 1);   // turned face-up only once seated
      swapSem = {rs, rem, ins: ins2};
    }
    const nearA = val('pull') > 0 ? {x: G.pts.gripStart.x + dx, y: G.pts.gripStart.y} : val('pullReach') > 0 ? mix(restA.near, G.pts.gripStart, ease.inOutCubic(val('pullReach'))) : null;
    const solvedA = rigA.frame({x: G.A.x, y: G.floorY, facing: 1, scale: k, near: nearA, headTilt: v.headA ?? 0});
    const solvedB = rigB.frame({x: G.B.x, y: G.B.floor, facing: -1, scale: k, near, far, headTilt: v.headB ?? 0});
    Object.assign(nodes, solvedA.nodes, solvedB.nodes);
    const hF = solvedB.hands.far, hN = solvedB.hands.near, hA = solvedA.hands.near;
    nodes[`${P}-reply`] = {transform: dx ? T(dx, 0) : ''};
    nodes[`${P}-set`] = {transform: T(setPos.x, setPos.y)};
    nodes[`${P}-lever`] = {transform: `${T(0, spineTop)}${leverDown ? ` rotate(${r(18 * leverDown)})` : ''}`};
    const open = swap ? clamp((val('remove') - 0.33) / 0.07) * (1 - clamp((val('insert') - 0.9) / 0.1))
      : sub ? clamp((lp - 0.35) / 0.5) * (1 - clamp((ins - 0.9) / 0.1)) : 0;
    for (let i = 0; i < N; i++) {
      const o2 = i === kk ? open : 0;
      const pr = i === kk && !sub ? Math.sin(Math.PI * lp) : 0; // a press that keeps the piece clipped
      nodes[`${P}-latch${i}-arm`] = {transform: o2 ? `rotate(${r(-100 * ease.outCubic(o2))} 4 -15)` : pr ? `translate(${r(-3 * pr)} 0)` : ''};
    }
    const pieces = [];
    let oldAt = null;
    for (let i = 0; i < N; i++) {
      const stays = sub && i === kk && lp >= 0.85;
      let q = stays ? {x: xSp - SHEET.spW / 2, y: Oy + G.rowY(i)} : {x: setPos.x - SHEET.spW / 2, y: setPos.y + G.rowIn(i)};
      if (swap && i === kk) {
        const rem = val('remove');
        const lifted = rem >= 0.4;
        const down = clamp((rem - 0.4) / 0.15);           // turned face-down while still in its slot
        const rotO = -90 * ease.inOutCubic(clamp((rem - 0.55) / 0.45));
        if (lifted) q = {x: hF.x - 4, y: hF.y + 6};
        const {sy, text: valOp} = turnFace(down);
        if (show && M.values[i]) nodes[`${P}-cp${i}-val`] = {opacity: r(down < 0.5 ? valOp : 0, 3)};
        nodes[`${P}-c${i}`] = {transform: T(q.x, q.y, rotO)};
        nodes[`${P}-c${i}-in`] = {transform: down > 0 && down < 1 ? `scale(1 ${r(sy, 3)})` : ''};
        nodes[`${P}-c${i}-f`] = {opacity: down < 0.5 ? 1 : 0};
        nodes[`${P}-c${i}-b`] = {opacity: down >= 0.5 ? 1 : 0};
        oldAt = {x: r(q.x), y: r(q.y)};
      } else if (o.swapRow === i) {
        nodes[`${P}-c${i}`] = {transform: T(q.x, q.y)};
        nodes[`${P}-c${i}-in`] = {transform: ''};
        nodes[`${P}-c${i}-f`] = {opacity: 1};
        nodes[`${P}-c${i}-b`] = {opacity: 0};
      } else nodes[`${P}-c${i}`] = {transform: T(q.x, q.y)};
      pieces.push({x: r(q.x), y: r(q.y)});
    }
    let spareAt = null, spareCard = null;
    if (hasSpare) {
      const inserted = (sub && ins >= 1) || (swap && val('insert') >= 1);
      const holding = !(inserted && val('nearBack') > 0);
      const onSet = swap ? {x: swapSem.rs.x + 2 + dx, y: swapSem.rs.y} : {x: setPos.x - SHEET.spW / 2 - 2 + 2, y: setPos.y + G.rowIn(kk)};
      const base = holding ? {x: hN.x + 2, y: hN.y} : onSet;
      spareAt = base;
      const {sy, text: valOp} = turnFace(flip);
      if (show && M.spare) nodes[`${P}-sp-val`] = {opacity: r(flip >= 0.5 ? valOp * (swap ? 1 : seatGate) : 0, 3)};
      nodes[`${P}-spare`] = {transform: T(base.x, base.y, inserted ? 0 : rot, inserted ? 1 : r(len, 4), r(sy, 3))};
      nodes[`${P}-sp-face`] = {opacity: flip >= 0.5 ? 1 : 0};
      nodes[`${P}-sp-flip`] = {opacity: flip < 0.5 ? 1 : 0};
      nodes[`${P}-thumb`] = {opacity: holding ? 1 : 0, transform: T(hN.x - 3 * k, hN.y - 3 * k, 0, -1, 1)};
      if (Math.abs(inserted ? 0 : rot) < 1) spareCard = {x: base.x, y: base.y, h: hh * Math.abs(sy), w: tw * (inserted ? 1 : len)};
    }
    // No clipped slivers of text: a card's printed text hides while a later-painted card covers it only in part
    // (gliding copies, the different piece passing the copy left behind); it shows when it is clear of every card
    // above it, or exactly under a matching one. Paint order: printed pieces < copies (in order) < the different piece.
    if (show) {
      const cards = [];
      for (let i = 0; i < N; i++) cards.push({name: `${P}-pr${i}-val`, has: Boolean(M.values[i]), x: xSp - SHEET.spW / 2, y: Oy + G.rowY(i), h: hh});
      for (let i = 0; i < N; i++) cards.push(swap && i === kk ? {skip: true} : {name: `${P}-cp${i}-val`, has: Boolean(M.values[i]), x: pieces[i].x, y: pieces[i].y, h: hh});
      if (spareCard) cards.push({name: `${P}-sp-val`, has: Boolean(M.spare), ...spareCard});
      cards.forEach((c, ci) => {
        if (c.skip || !c.has) return;
        let part = 0;
        for (let cj = ci + 1; cj < cards.length; cj++) {
          const d = cards[cj];
          if (d.skip) continue;
          // (cards span [x − w, x] × [y − h/2, y + h/2]; w = tw unless foreshortened)
          const cw = c.w ?? tw, dw = d.w ?? tw;
          const f = Math.max(0, Math.min(c.x, d.x) - Math.max(c.x - cw, d.x - dw)) * Math.max(0, Math.min(c.y + c.h / 2, d.y + d.h / 2) - Math.max(c.y - c.h / 2, d.y - d.h / 2)) / (cw * c.h);
          if (f < 0.985) part = Math.max(part, f);
        }
        const clear = 1 - clamp((part - 0.01) / 0.04);
        // (written every frame, including when clear: each attribute is a pure function of (params, u), never left
        // over from an earlier seek)
        const prev = nodes[c.name] && nodes[c.name].opacity !== undefined ? nodes[c.name].opacity : 1;
        nodes[c.name] = {opacity: r(prev * clear, 3)};
      });
    }
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    return {
      nodes,
      sem: {
        handA: P2(hA), handB: P2(hF), handBn: P2(hN),
        leverGrip: P2(leverPt),
        replyGrip: P2({x: G.pts.gripStart.x + dx, y: G.pts.gripStart.y}),
        setAt: P2(setPos),
        setOn: sl >= 1 ? 'reply' : sl > 0 ? 'moving' : 'offer',
        spare: spareAt ? P2(spareAt) : null,
        spareFaceUp: hasSpare ? flip >= 0.5 : null,
        spareIn: hasSpare ? (sub && ins >= 1) || (swap && val('insert') >= 1) : null,
        oldPiece: oldAt,
        oldGrip: swap && val('remove') >= 0.4 ? P2({x: hF.x, y: hF.y}) : null,
        latchOpen: r(open, 3),
        pieceStays: sub && lp >= 0.85 ? kk : null,
        pull: r(pullE, 3),
        dx: r(dx),
        reached: {A: solvedA.reached, B: solvedB.reached},
        allReached: solvedA.reached && solvedB.reached,
        pieces,
        heads: [solvedA.head, solvedB.head].map(P2),
      },
    };
  }

  return {node, layers, pose, rigA, rigB, looks, restA, restB};
}

/** Thumb drawn over a held piece's grip (skin + outline). */
export function thumbArt(name, skin, k) {
  return g({name, opacity: 0},
    h('path', {d: `M${r(-7 * k)} ${r(-5 * k)}C${r(-2 * k)} ${r(-12 * k)} ${r(9 * k)} ${r(-11 * k)} ${r(11 * k)} ${r(-4 * k)}C${r(12 * k)} ${r(2 * k)} ${r(4 * k)} ${r(6 * k)} ${r(-4 * k)} ${r(4 * k)}C${r(-9 * k)} ${r(3 * k)} ${r(-10 * k)} ${r(-2 * k)} ${r(-7 * k)} ${r(-5 * k)}Z`, fill: skin, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
}

/* ======================================================================== */
/* Solver                                                                    */
/* ======================================================================== */

/**
 * Search the stage parameters for the largest readable layout that fits
 * `box`, reaches every grip and keeps faces clear: text sizes first (in the
 * given order), then the largest rig scale; at that scale the shortest board
 * (fewest wrapped lines), then the narrowest pieces. `px` sizes are px at
 * 1080p; `upx` = px per design unit. Returns the best geometry (ok or not).
 * @param {any} ctx
 * @param {object} o  stageGeometry options + {upx, pxTries:[{F,FL,min}], ks:number[], tws:number[], lws:number[], hws:number[], variants:boolean[], captions:string[]|null, chipPx:number, chipMax:number}
 */
/** Cost of a failed geometry: failures that push content out of the frame (width, top) weigh most. */
const whyCost = G => G.why.reduce((a, w) => a + (/^(width|top|topHead)/.test(w) ? 10 : 1), 0);

export function solveStage(ctx, o) {
  const show = ctx.show('all');
  let fallback = null, firstArgs = null;
  for (const px of o.pxTries) {
    const F = px.F / o.upx, FL = Math.max(px.min / o.upx, (px.FL ?? px.F * 0.9) / o.upx);
    const chipSize = (px.chip ?? o.chipPx) / o.upx;
    const chips = o.captions && ctx.show('key') ? o.captions.map(c => fitW(c, {maxWidth: o.chipMax, size: chipSize, minSize: chipSize, maxLines: o.chipLines ?? 2, weight: 600})) : null;
    if (chips && chips.some(c => c.bad)) continue;
    const Ms = [];
    // side by side: optionally compact sheet headers (the entry then draws the offer's title and parties once, elsewhere)
    const compactOf = sd => (sd && o.sideCompact ? true : o.compact);
    for (const cm of [...new Set([o.compact, ...(o.sides || []).filter(Boolean).map(compactOf)])]) {
    for (const above of o.variants) {
      for (const twf of [...new Set([...o.tws, ...(cm !== o.compact || o.sideTws ? (o.sideTws || []) : [])])].sort((a, b) => a - b)) {
        const sideOnly = !o.tws.includes(twf);
        const tw = twf * F + TILE.tabW + TILE.padL + TILE.gripM;
        for (const lwf of o.lws) {
          const lw = lwf ? lwf * FL + SHEET.lp * 2 : 0;
          for (const hwf of above ? [0] : o.hws) {
            const hw = hwf * F + SHEET.hp * 2;
            if ((above ? 0 : hw) + lw + tw + 34 > o.box.w * 0.92) continue;
            const key = `${above}|${r(tw)}|${r(lw)}|${r(hw)}|${r(F, 3)}|${r(FL, 3)}|${cm}|${o.valueLines ?? 3}`;
            let M = o.cache && o.cache.get(key);
            if (!M) {
              M = measureDocs(ctx, {terms: o.terms, offer: o.offer, parties: o.parties, response: o.response, replyTag: o.replyTag, tw, lw, hw, above, F, FL, show, extraValues: o.extraValues, compact: cm, valueLines: o.valueLines});
              if (o.cache) o.cache.set(key, M);
            }
            if (M.bad.length) { if (o.stats) o.stats.bad = (o.stats.bad || 0) + 1; continue; }
            Ms.push({M, tw, lw, hw, above, cm, sideOnly});
          }
        }
      }
    }
    }
    // stacked board first; side by side (offer and reply on one wide board) only when stacking fails
    for (const sideMode of o.sides || [null]) {
    for (const k of o.ks) {
      let best = null;
      for (const m of Ms) {
        if (sideMode && !(m.above && !m.lw)) continue;
        if (!sideMode && m.sideOnly) continue;
        // stacked: the copy set glides down the pieces column, so the field labels sit in their own column (never
        // between the rows it passes)
        if (!sideMode && !m.lw && ctx.show('all')) continue;
        if (m.cm !== (sideMode ? compactOf(sideMode) : o.compact)) continue;
        const args = {...o, ...m, F, FL, k, chips, chipSize, side: sideMode, fast: true};
        const G = stageGeometry(ctx, args);
        if (!G.ok) {
          if (o.stats) for (const w of G.why) { const key = w.split(':')[0] + (w.startsWith('reach') ? ':' + w.split(':')[1] : ''); o.stats[key] = (o.stats[key] || 0) + 1; }
          if (G.partial) { if (!firstArgs) firstArgs = args; continue; }
          if (!fallback || whyCost(G) < whyCost(fallback)) fallback = G;
          continue;
        }
        // (preferWide: among equally low boards the widest — the context then fills its part of the frame)
        const score = G.board.h * 1000 + (o.preferWide ? -G.board.w : G.board.w);
        if (!best || score < best.score) best = {G, score};
      }
      if (best) return best.G;
    }
    }
  }
  // nothing fits: the least-bad full geometry (never a quick-reject stub)
  return fallback || (firstArgs ? stageGeometry(ctx, {...firstArgs, full: true, fast: false}) : null);
}

/* ======================================================================== */
/* Editorial helpers (chips, callouts, placement)                           */
/* ======================================================================== */

/**
 * Callout: chip + leader from the chip edge nearest the target + end dot.
 * Returns {node, frame(p), box, lead:{x1,y1,x2,y2}}.
 */
export function callout(ctx, o) {
  const th = ctx.theme;
  const c = chipW(ctx, o.text, {x: o.x, y: o.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 3, fit: o.fit, fill: th.card, stroke: o.color ?? th.ink, name: `${o.name}-chip`});
  const b = c.box, t = o.target;
  let from;
  if (t.y >= b.y + b.h) from = {x: clamp(t.x, b.x + 14, b.x + b.w - 14), y: b.y + b.h};
  else if (t.y <= b.y) from = {x: clamp(t.x, b.x + 14, b.x + b.w - 14), y: b.y};
  else from = {x: t.x > b.cx ? b.x + b.w : b.x, y: clamp(t.y, b.y + 10, b.y + b.h - 10)};
  const color = o.color ?? (th.dark ? th.fg : th.ink);
  const len = Math.hypot(t.x - from.x, t.y - from.y);
  const node = g({name: o.name, opacity: 0},
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(t.x), y2: r(t.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(t.x), cy: r(t.y), r: 6.5, fill: color, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
    c.node);
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: r(clamp((p - 0.4) / 0.6), 3)},
  });
  return {node, frame, box: b, lead: {x1: from.x, y1: from.y, x2: t.x, y2: t.y}, fit: c.fit};
}

/** Segment (x1,y1)-(x2,y2) passes through box (shrunk by pad)? */
export function segHitsBox(s, b, pad = 0) {
  for (let i = 1; i < 40; i++) {
    const x = s.x1 + ((s.x2 - s.x1) * i) / 40, y = s.y1 + ((s.y2 - s.y1) * i) / 40;
    if (x > b.x + pad && x < b.x + b.w - pad && y > b.y + pad && y < b.y + b.h - pad) return true;
  }
  return false;
}

/**
 * Text boxes (world, design units) of a stage at its hold (reply pulled by dx):
 * sheet headers, printed and copied pieces. Used to keep leaders and chips clear.
 */
export function stageTextBoxes(G, dx = 0) {
  const boxes = [];
  const hdr = (hd, x, y, which) => {
    const top = which === 'offer' ? (G.above ? 0 : (G.shO - hd.h) / 2) : G.M.replyBand ? G.colHt : (G.shR - hd.h) / 2;
    const xo = which === 'reply' && G.M.replyBand ? G.colX - G.x0 : 0;
    for (const ln of hd.lines) if (ln.fit) boxes.push({x: x + xo + SHEET.hp, y: y + ln.y + top, w: ln.fit.width, h: ln.fit.height});
  };
  if (G.plate) boxes.push({x: G.board.x + 26, y: G.board.y + 8 + (G.plateH - 6 - G.plate.height) / 2, w: G.plate.width, h: G.plate.height});
  hdr(G.M.offerHdr, G.x0, G.Oy, 'offer');
  hdr(G.M.replyHdr, G.x0 + (G.rdx || 0) + dx, G.Ry, 'reply');
  const rows = (y, rowFn, off, withLabels) => {
    for (let i = 0; i < G.N; i++) {
      const lb = withLabels ? G.M.labels[i] : null, v = G.M.values[i];
      if (lb) boxes.push(G.M.labelsAbove ? {x: G.colX + SHEET.cp + 2 + off, y: y + rowFn(i) - G.th / 2 - G.labGap, w: lb.width, h: lb.height} : {x: G.labX + SHEET.lp + off, y: y + rowFn(i) - lb.height / 2, w: lb.width, h: lb.height});
      if (v) boxes.push({x: G.xSp - SHEET.spW / 2 - G.tw + TILE.tabW + TILE.padL + off, y: y + rowFn(i) - v.height / 2, w: Math.max(v.width, G.M.spare ? G.M.spare.width : 0), h: v.height});
    }
  };
  rows(G.Oy, G.rowY, 0, true);
  rows(G.Ry, G.rowYR, (G.rdx || 0) + dx, false);
  return boxes;
}

/** People boxes (whole figures) of a stage. */
export function peopleBoxes(G) {
  return [figureBox(G.A), figureBox(G.B)];
}

/**
 * Legend chip: a neutral Δ disc (changedMarker) followed by fitted text; no leader
 * (the same Δ sits on the piece it explains).
 */
export function legendChip(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size;
  const mR = size * 0.62;
  const padX = size * 0.55, padY = size * 0.36;
  const lead = mR * 2 + size * 0.45;
  const fit = fitW(text, {maxWidth: o.maxWidth - padX * 2 - lead, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 3, weight: 600});
  const w = fit.width + padX * 2 + lead, hh = Math.max(fit.height, mR * 2) + padY * 2;
  const x = o.x, y = o.y;
  const node = g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 2}),
    changedMarker(ctx, {x: x + padX + mR, y: y + hh / 2, radius: mR}),
    textBlock(fit, {x: x + padX + lead, y: y + (hh - fit.height) / 2, fill: th.ink}));
  return {node, box: {x, y, w, h: hh}, fit, bad: fit.bad};
}

/* ======================================================================== */
/* Shared offer (contrast): one offer board + two reply scenes              */
/* ======================================================================== */

/**
 * Offer sheet geometry (no copy set: the pieces are printed; the copies sit on
 * the replies). `M` = measureDocs() at (tw, lw, hw, above). Board-local units:
 * the board is (bw × bh); the sheet sits at (bp, bp) inside it.
 */
export function offerSheetGeometry(M, o) {
  const {cp, bp} = SHEET;
  const N = o.terms.length;
  const th = M.th, tg = TILE.gap;
  const labGap = M.labelsAbove ? M.labH + 6 : 0;
  const colIn = N * (labGap + th) + (N - 1) * tg;
  const colHt = colIn + 2 * cp + 8;
  const cw = cp + o.tw + cp;
  const above = Boolean(o.above);
  const hw = above ? 0 : o.hw;
  const sw = hw + o.lw + cw;
  const hO = M.offerHdr.h;
  const shO = above ? hO + colHt : Math.max(colHt, hO);
  const colTop = above ? hO : (shO - colHt) / 2;
  const pitch = labGap + th + tg;
  const rowIn = i => (colHt - colIn) / 2 + labGap + th / 2 + i * pitch;
  return {M, N, th, tg, labGap, colIn, colHt, cw, sw, hw, lw: o.lw, tw: o.tw, above, shO, colTop, pitch, rowIn, bw: sw + 2 * bp, bh: shO + 2 * bp, terms: o.terms};
}

/**
 * Offer board art at board top-left (x, y): a wall board with the offer sheet
 * (header, field labels, printed pieces). Static. Returns {node, textBoxes, pieceAt(i)}.
 */
export function offerBoardArt(ctx, S, x, y, name) {
  const th = ctx.theme;
  const show = ctx.show('all');
  const {M, tw} = S;
  const {bp, hp, lp, cp} = SHEET;
  const sx = x + bp, sy = y + bp;
  const labX = sx + S.hw, colX = labX + S.lw;
  const rowY = i => sy + S.colTop + S.rowIn(i);
  const bar = i => 0.35 + 0.45 * ctx.rng('piece-bar', i);
  const wood = th.woodTop;
  const boxes = [];
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 9, S.bw, S.bh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, S.bw, S.bh, 14), fill: wood, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(x + 7, y + 7, S.bw - 14, S.bh - 14, 9), fill: 'none', stroke: shade(wood, -0.18), 'stroke-width': 2}),
    h('path', {d: roundRectPath(sx + 5, sy + 7, S.sw, S.shO, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(sx, sy, S.sw, S.shO, 6), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(sx + S.sw * 0.42, sy - 12, S.sw * 0.16, 18, 5), fill: th.metal, stroke: INK, 'stroke-width': 2}),
    S.above
      ? h('path', {d: `M${r(sx + 10)} ${r(sy + S.colTop)}H${r(sx + S.sw - 10)}`, stroke: th.paperLine, 'stroke-width': 2})
      : h('path', {d: `M${r(labX)} ${r(sy + 10)}V${r(sy + S.shO - 10)}`, stroke: th.paperLine, 'stroke-width': 2}),
    h('rect', {x: r(colX + 3), y: r(sy + S.colTop + 4), width: r(S.cw - 7), height: r(S.colHt - 8), rx: 4, fill: shade(th.paper, -0.035)}),
  ];
  // header lines
  const hTop = S.above ? 0 : (S.shO - M.offerHdr.h) / 2;
  for (const ln of M.offerHdr.lines) {
    if (ln.fit) {
      parts.push(textBlock(ln.fit, {x: sx + hp, y: sy + hTop + ln.y, fill: ln.color, name: `${name}-h-${ln.key}`}));
      boxes.push({x: sx + hp, y: sy + hTop + ln.y, w: ln.fit.width, h: ln.fit.height});
    } else {
      parts.push(h('rect', {x: r(sx + hp), y: r(sy + hTop + ln.y + ln.h * 0.2), width: r(ln.w * (ln.key === 'title' ? 0.9 : 0.7)), height: r(ln.h * 0.55), rx: 3, fill: ln.key === 'title' ? th.inkSoft : th.paperLine, opacity: ln.key === 'title' ? 0.5 : 1}));
    }
  }
  // labels + printed pieces
  S.terms.forEach((t, i) => {
    const yv = rowY(i);
    const lab = M.labels[i];
    const lpos = M.labelsAbove ? {x: colX + cp + 2, y: yv - S.th / 2 - S.labGap} : {x: labX + lp, y: yv - (lab ? lab.height : 10) / 2};
    if (lab) { parts.push(textBlock(lab, {...lpos, fill: th.inkSoft, name: `${name}-lab${i}`})); boxes.push({...lpos, w: lab.width, h: lab.height}); }
    else parts.push(h('rect', {x: r(lpos.x), y: r(lpos.y + 3), width: r((M.labelsAbove ? tw : S.lw - lp * 2) * 0.45), height: 10, rx: 3, fill: th.paperLine}));
    if (i > 0 && !M.labelsAbove) parts.push(h('path', {d: `M${r(labX + 8)} ${r(yv - S.pitch / 2)}H${r(colX - 4)}`, stroke: th.paperLine, 'stroke-width': 1.6, 'stroke-dasharray': '3 5'}));
    const art = pieceArt(ctx, {tw, th: S.th, kind: 'printed', tab: tabColor(ctx, i), value: show ? M.values[i] : null, bars: show ? 0 : bar(i), name: `${name}-pr${i}`});
    parts.push(g({transform: T(colX + cp + tw, yv)}, art.front));
    if (show && M.values[i]) boxes.push({x: colX + cp + TILE.tabW + TILE.padL, y: yv - M.values[i].height / 2, w: M.values[i].width, h: M.values[i].height});
  });
  return {node: g({name}, parts), textBoxes: boxes, box: {x, y, w: S.bw, h: S.bh}, pieceAt: i => ({x: colX + cp + tw, y: rowY(i)})};
}

/**
 * One reply scene: [reply board with the reply sheet on a rail] [responder B],
 * floor at the bottom of `o.box` (minus B's caption chip). The reply sheet =
 * header band above a column of slots; the copies are clipped to a spine (one
 * latch per piece) on B's side. B holds a different piece face-down. The reply
 * can be pushed along its rail toward the left (carried back).
 * @param {any} ctx
 * @param {{box:any, k:number, M:any, tw:number, terms:any[], kRow:number, chip:any, chipSize:number, steps:number[]}} o
 */
export function replySceneGeometry(ctx, o) {
  // the reply's header band sits under its column (rows near B's shoulders) or, when that is better, above it
  if (o.hdrAbove === undefined) {
    const a = replySceneGeometry(ctx, {...o, hdrAbove: false});
    if (a.ok) return a;
    const b = replySceneGeometry(ctx, {...o, hdrAbove: true});
    return b.ok || b.why.length < a.why.length ? b : a;
  }
  const k = o.k;
  const M = o.M;
  const why = [...M.bad];
  const {cp, spW, bp} = SHEET;
  const N = o.terms.length;
  const th = M.th, tg = TILE.gap;
  const colIn = N * th + (N - 1) * tg;
  const colHt = colIn + 2 * cp + 8;
  const cw = cp + o.tw + spW + cp, sw = cw;
  // the reply's header band sits under its column (the rows stay near B's shoulders)
  const hR = M.replyHdr.h, shR = hR + colHt, colTop = o.hdrAbove ? hR : 0;
  const pitch = th + tg;
  const rowIn = i => (colHt - colIn) / 2 + th / 2 + i * pitch;
  const chipH = o.chip ? o.chip.height + o.chipSize * 0.72 + 10 : 0;
  const floorY = o.box.y + o.box.h - (chipH ? chipH + 12 : 10);
  // quick rejects (no variant can pass): B taller than the box, or the board (with its rail gap) taller than the box
  if (floorY - 414 * k < o.box.y - 0.5) return {ok: false, why: ['topHead']};
  if (shR + bp + 3 + (o.floorGap ?? 18) > floorY - o.box.y) return {ok: false, why: ['top', 'floor']};
  const push = Math.round(clamp(sw * 0.12, 26, 48));
  const pushTab = 22;
  const kk = o.kRow;
  let best = null;
  const standing = o.tw + 12 > 300 * k - 8;
  // a standing piece stands in front of B (between B and the board) or, when that leaves the board out of
  // reach, behind B (B turns to pick it up; the board can then come close)
  for (const behind of standing ? [false, true] : [false]) {
  if (best && !best.bad.length) break;
  for (const sf of o.steps || [0]) {
    const stepH = sf * 305 * k;
    // room behind B: the body, or the different piece B holds at the side (or stood behind B)
    // (the drawn figure, hair and back arm included, runs to ~64 k behind its axis)
    const back = behind ? Math.max(64 * k, 48 * k + th + 16) : standing ? 64 * k : Math.max(64 * k, 22 * k + th / 2 + 10);
    const B = {x: o.box.x + o.box.w - back - (stepH ? 20 : 0), floor: floorY - stepH, f: -1, k};
    // a piece longer than B can hold hanging at the side stands on the floor in front of B until B picks it up
    const hold = behind ? {x: B.x + 48 * k + th / 2 + 8, y: floorY - stepH - o.tw - 10}
      : standing
      ? {x: B.x - (RIG.front + 14) * k - th / 2 - 6, y: floorY - stepH - o.tw - 10}
      // held hanging at B's side, just behind the hip (clear of the board in front)
      : {x: B.x + 22 * k, y: floorY - stepH - Math.min(300 * k, Math.max(236 * k, o.tw + 24))};
    // the spine stays clear of B's torso and (standing) of the different piece and the push tab
    const xSp = Math.min(B.x - (RIG.front + 16) * k - 30, standing && !behind ? hold.x - th / 2 - 50 : Infinity);
    const colR = xSp + spW / 2 + cp;
    const x0 = colR - sw;
    // the lifted copy: held at B's side, or (long pieces) stood on the floor where the different piece stood
    const holdFar = standing ? {...hold} : {x: B.x - 34 * k, y: B.floor - Math.min(300 * k, Math.max(236 * k, o.tw + 24))};
    const sFarY = B.floor + RIG.far.y * k;
    const headB0 = headBox(B);
    // independent of the lift: reaching the held pieces
    const holdOk = canReach(B, 'near', hold) && canReach(B, 'far', holdFar);
    // the grid of lifts, plus the two exact ones that seat the board as low / as high as the box allows
    // (a tight box leaves only a narrow band of valid heights between the grid steps)
    const ykLow = floorY - 3 - (o.floorGap ?? 18) - shR + colTop + rowIn(kk) - 0.5;
    const ykHigh = o.box.y + bp + colTop + rowIn(kk) + 0.5;
    const lifts = [(sFarY - ykLow) / (RIG.reach * k), (sFarY - ykHigh) / (RIG.reach * k), -0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2];
    for (const lift of lifts) {
      const bad = [];
      const yk = sFarY - lift * RIG.reach * k;
      const Ry = yk - colTop - rowIn(kk);
      const grip = {x: xSp - spW / 2, y: yk};
      const pts = {
        latch: {x: xSp + 3, y: yk},
        grab: {x: grip.x + 4, y: yk - 6},
        slot: {x: grip.x - 2, y: yk},
        hold, holdFar,
        // the push tab sticks out of the sheet's edge on B's side at chest height (below B's face)
        tab: {x: colR + pushTab * 0.5, y: clamp(B.floor + RIG.near.y * k + 0.35 * RIG.reach * k, Ry + 26, Ry + shR - 26)},
      };
      pts.tabEnd = {x: pts.tab.x - push, y: pts.tab.y};
      const board = {x: x0 - push - bp, y: Ry - bp, w: sw + push + 2 * bp, h: shR + 2 * bp};
      // o.fast (searches): the cheap box checks first; the reach checks only when those pass (same ok/not-ok verdict)
      if (Ry + shR + 3 + (o.floorGap ?? 18) > floorY) bad.push('floor');   // the rail and short legs stay visible
      if (board.y < o.box.y - 0.5) bad.push('top');
      if (!holdOk) bad.push('reach:hold');
      if (standing && overlaps(headB0, {x: hold.x - th / 2 - 4, y: hold.y - 6, w: th + 8, h: o.tw + 12}, 2)) bad.push('faceB');
      if (!(o.fast && bad.length)) {
        if (!canReach(B, 'far', pts.latch) || !canReach(B, 'far', pts.grab)) bad.push('reach:latch');
        if (!canReach(B, 'near', pts.slot)) bad.push('reach:slot');
        for (const hand of ['far', 'near']) if (!canReach(B, hand, pts.tab) || !canReach(B, hand, pts.tabEnd)) bad.push(`reach:tab-${hand}`);
      }
      const headB = headBox(B);
      if (overlaps(headB, board, 4)) bad.push('faceB');
      if (headB.y < o.box.y - 0.5) bad.push('topHead');
      if (board.x < o.box.x - 0.5) bad.push('width');
      const spareBox = {x: hold.x - th / 2 - 4, y: hold.y - 6, w: th + 8, h: o.tw + 12};
      const oldBox = {x: holdFar.x - th / 2 - 4, y: holdFar.y - 6, w: th + 8, h: o.tw + 12};
      if (!standing && (spareBox.y + spareBox.h > floorY - stepH - 2 || oldBox.y + oldBox.h > floorY - stepH - 2)) bad.push('spareFloor');
      const tabBox = {x: colR - 4, y: pts.tab.y - 22, w: pushTab + 8, h: 44};
      if (overlaps(spareBox, {x: board.x + board.w - bp, y: board.y, w: bp, h: board.h}, 2) || overlaps(spareBox, tabBox, 2)) bad.push('spareBoard');
      if (overlaps(headB, tabBox, 2)) bad.push('faceB');
      const cand = {bad, B, xSp, colR, x0, Ry, yk, pts, board, stepH, headB, hold, holdFar, spareBox, oldBox, standing, behind};
      if (!best || bad.length < best.bad.length) best = cand;
      if (!bad.length) break;
    }
    if (best && !best.bad.length) break;
  }
  }
  why.push(...best.bad);
  const {B, xSp, colR, x0, Ry, pts, board, stepH, headB} = best;
  const railY = Ry + shR + 3;
  const rail = {x: x0 - push - 16, y: railY, w: sw + push + 32, h: 10};
  const stool = stepH ? {x: B.x - 46 * k, y: floorY - stepH, w: 100 * k, h: stepH} : null;
  const chipBox = o.chip ? (() => {
    const w = o.chip.width + o.chipSize * 1.2, hh = o.chip.height + o.chipSize * 0.72;
    const cx = clamp(B.x, o.box.x + w / 2, o.box.x + o.box.w - w / 2);
    return {x: cx - w / 2, y: floorY + 12, w, h: hh};
  })() : null;
  const extent = unionBox([board, rail, figureBox(B), stool, chipBox, best.behind ? best.spareBox : null]);
  return {
    ok: why.length === 0, why, k, M, N, th, tg, tw: o.tw, cw, sw, hR, shR, colTop, hdrAbove: Boolean(o.hdrAbove), colHt, colIn, pitch, rowIn,
    B, floorY, xSp, colR, x0, Ry, pts, board, rail, railY, push, pushTab, stool, stepH, headB, kRow: kk,
    chip: o.chip, chipBox, chipSize: o.chipSize, extent, box: o.box, terms: o.terms, spareBox: best.spareBox, oldBox: best.oldBox, standing: best.standing, behind: Boolean(best.behind),
  };
}

/**
 * Build a reply scene (art + pure pose). `R` = this scene's response (resolveResponse):
 * a substitution plays the swap (the far hand lifts copy k out, the near hand seats the
 * different piece); same-terms only presses the latch. Both then carry the reply back
 * (the free hand pushes it along the rail). `o.value` = the different piece's fitted value.
 */
export function buildReplyScene(ctx, G, o) {
  const P = o.prefix;
  const th = ctx.theme;
  const show = ctx.show('all');
  const k = G.k;
  const R = o.response;
  const look = o.look;
  const rigB = personRig(ctx, {name: `${P}-B`, look});
  const {M, tw, th: hh, sw, x0, xSp, Ry, N, colR} = G;
  const bar = i => 0.35 + 0.45 * ctx.rng('piece-bar', i);
  const floorFill = th.dark ? '#3a3f46' : '#e4d9c4';
  const wood = th.woodTop, woodDark = th.woodDark;
  const B0 = G.board;
  const st = G.stool;
  const fx0 = Math.min(G.extent.x, B0.x) - 10, fx1 = Math.max(G.extent.x + G.extent.w, G.B.x + 70 * k);
  const floor = g(null,
    h('path', {d: roundRectPath(fx0, G.floorY - 6 * k, fx1 - fx0, 14 * k, 7 * k), fill: floorFill}),
    st ? g(null,
      h('path', {d: roundRectPath(st.x + 5, st.y + 7, st.w, st.h, 8), fill: th.shadow}),
      h('path', {d: roundRectPath(st.x, st.y, st.w, st.h, 8), fill: th.wood, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M${r(st.x + st.w * 0.3)} ${r(st.y + st.h * 0.45)}H${r(st.x + st.w * 0.7)}`, stroke: th.woodDark, 'stroke-width': 5, 'stroke-linecap': 'round'})) : null,
    h('ellipse', {cx: G.B.x, cy: G.B.floor - 2, rx: 46 * k, ry: 8 * k, fill: th.shadow}));
  const legs = [B0.x + 26, B0.x + B0.w - 26];
  const boardNode = g({name: `${P}-board`},
    legs.map(lx => g(null,
      h('rect', {x: r(lx - 7), y: r(B0.y + B0.h - 4), width: 14, height: r(Math.max(0, G.floorY - (B0.y + B0.h) + 2)), fill: woodDark, stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(lx - 26, G.floorY - 9, 52, 10, 4), fill: woodDark, stroke: INK, 'stroke-width': 2.2}))),
    h('path', {d: roundRectPath(B0.x + 6, B0.y + 9, B0.w, B0.h, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(B0.x, B0.y, B0.w, B0.h, 14), fill: wood, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(B0.x + 7, B0.y + 7, B0.w - 14, B0.h - 14, 9), fill: 'none', stroke: shade(wood, -0.18), 'stroke-width': 2}));
  const rl = G.rail;
  const railNode = h('path', {d: roundRectPath(rl.x, rl.y, rl.w, rl.h, 5), fill: th.metal, stroke: INK, 'stroke-width': 2.2});
  // ---- the reply sheet (moves with the push): header band, slots, spine, latches, push tab
  const hdrTop = G.hdrAbove ? 0 : G.colHt;
  const hdrParts = M.replyHdr.lines.map(ln => (ln.fit
    ? textBlock(ln.fit, {x: x0 + SHEET.hp + (ln.x || 0), y: Ry + hdrTop + ln.y, fill: ln.color, name: `${P}-rh-${ln.key}`})
    : h('rect', {x: r(x0 + SHEET.hp), y: r(Ry + hdrTop + ln.y + ln.h * 0.2), width: r(ln.w * (ln.key === 'tag' ? 0.9 : 0.7)), height: r(ln.h * 0.55), rx: 3, fill: ln.key === 'tag' ? th.inkSoft : th.paperLine, opacity: ln.key === 'tag' ? 0.5 : 1})));
  const rowW = i => Ry + G.colTop + G.rowIn(i);
  const gripX = xSp - SHEET.spW / 2;
  const slots = G.terms.map((_, i) => h('path', {d: roundRectPath(gripX - tw, rowW(i) - hh / 2, tw, hh, 7), fill: 'none', stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
  const latches = G.terms.map((_, i) => g({name: `${P}-latch${i}`, transform: T(xSp, rowW(i))},
    g({name: `${P}-latch${i}-arm`},
      h('path', {d: roundRectPath(-5, -15, 18, 30, 5), fill: th.metalDark, stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: 4, cy: 0, r: 3.4, fill: '#ffffff'}))));
  const spineTop = rowW(0) - hh / 2 - 4, spineBot = rowW(N - 1) + hh / 2 + 4;
  const tab = G.pts.tab;
  const replyNode = g({name: `${P}-reply`},
    h('path', {d: roundRectPath(x0 + 5, Ry + 7, sw, G.shR, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, Ry, sw, G.shR, 6), fill: th.card, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(x0 + 10)} ${r(Ry + (G.hdrAbove ? G.hR : G.colHt))}H${r(x0 + sw - 10)}`, stroke: th.paperLine, 'stroke-width': 2}),
    h('rect', {x: r(x0 + 3), y: r(Ry + G.colTop + 4), width: r(sw - 7), height: r(G.colHt - 8), rx: 4, fill: shade(th.card, -0.035)}),
    hdrParts, slots,
    h('path', {d: roundRectPath(colR - 4, tab.y - 22, G.pushTab + 8, 44, 10), fill: th.accent2Soft, stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: r(tab.x), cy: r(tab.y), r: 6.5, fill: 'none', stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(xSp - SHEET.spW / 2, spineTop, SHEET.spW, spineBot - spineTop, 5), fill: th.metal, stroke: INK, 'stroke-width': 2.2}),
    latches);
  const kk = G.kRow;
  const copies = G.terms.map((t, i) => {
    const turn = i === kk && R.substituted;
    const art = pieceArt(ctx, {tw, th: hh, kind: 'copy', tab: tabColor(ctx, i), value: show ? M.values[i] : null, bars: show ? 0 : bar(i), name: `${P}-cp${i}`, back: turn, plainBack: true});
    return g({name: `${P}-c${i}`, 'data-occludes': 1}, turn ? g({name: `${P}-c${i}-in`}, g({name: `${P}-c${i}-f`}, art.front), g({name: `${P}-c${i}-b`, opacity: 0}, art.back)) : art.front);
  });
  const spArt = pieceArt(ctx, {tw, th: hh, kind: 'spare', value: show ? o.value : null, bars: show ? 0 : bar(9), name: `${P}-sp`, back: true});
  const spare = g({name: `${P}-spare`, 'data-occludes': 1}, g({name: `${P}-sp-face`}, spArt.front), g({name: `${P}-sp-flip`}, spArt.back));
  const thumb = thumbArt(`${P}-thumb`, look.skin, k);
  const chipNode = G.chip ? chipW(ctx, '', {x: G.chipBox.x, y: G.chipBox.y, size: G.chipSize, fit: G.chip, maxWidth: G.chipBox.w, name: `${P}-chip`}).node : null;
  const node = g({name: P}, floor, boardNode, railNode, replyNode, g(null, copies), rigB.node, spare, thumb, chipNode);
  const rest = rigB.frame({x: G.B.x, y: G.B.floor, facing: -1, scale: k}).hands;

  /**
   * Pose (values 0..1, pure). latchReach: far hand → latch k; latchPress: pressed (it opens for a
   * substitution, stays shut otherwise); remove: (substitution) the far hand lifts copy k out, turns it
   * face-down and holds it at its side; insert: the near hand seats the different piece in the empty slot;
   * turn: it turns face-up there; nearBack/farBack: hand → rest; carryReach: the free hand → the reply's
   * push tab; carry: the reply slides back along the rail (the hand stays on the tab).
   */
  function pose(v) {
    const val = key => clamp(v[key] ?? 0);
    const nodes = {};
    const sub = Boolean(R.substituted);
    const carryE = ease.inOutCubic(val('carry'));
    const dx = -G.push * carryE;
    const lr = ease.inOutCubic(val('latchReach')), lp = val('latchPress');
    const latchPt = {x: G.pts.latch.x - Math.sin(Math.PI * lp) * 6, y: G.pts.latch.y};
    let far = null, near = G.standing ? null : G.pts.hold, flip = 0, rot = -90;
    // ---- far hand
    if (val('latchReach') > 0) far = mix(rest.far, latchPt, lr);
    const rem = sub ? val('remove') : 0;
    if (sub && rem > 0) {
      if (rem < 0.25) far = mix(G.pts.latch, G.pts.grab, ease.inOutCubic(rem / 0.25));
      else if (rem < 0.45) far = G.pts.grab;
      else if (!G.standing) far = mix(G.pts.grab, G.pts.holdFar, ease.inOutCubic((rem - 0.45) / 0.55));
      else if (rem < 0.85) far = mix(G.pts.grab, G.pts.holdFar, ease.inOutCubic((rem - 0.45) / 0.4));
      else far = mix(G.pts.holdFar, rest.far, ease.inOutCubic((rem - 0.85) / 0.15));   // set down; the hand returns
    }
    if (!sub && val('farBack') > 0) far = mix(G.pts.latch, rest.far, ease.inOutCubic(val('farBack')));
    // ---- near hand (the different piece)
    const ins = sub ? val('insert') : 0;
    // a standing piece: the near hand reaches its top end first (first 25 % of the insert), then carries it
    const pick = G.standing ? 0.25 : 0;
    const ins2 = G.standing ? clamp((ins - pick) / (1 - pick)) : ins;
    if (G.standing && ins > 0 && ins <= pick) near = mix(rest.near, G.pts.hold, ease.inOutCubic(ins / pick));
    if (sub) {
      const pre = {x: G.pts.slot.x + 18, y: G.pts.slot.y};
      if (ins2 > 0) {
        if (ins2 < 0.8) { const q = ease.inOutCubic(ins2 / 0.8); near = {x: lerp(G.pts.hold.x, pre.x, q) - Math.sin(Math.PI * q) * 14 * k, y: lerp(G.pts.hold.y, pre.y, q) + Math.sin(Math.PI * q) * 18 * k}; }
        else near = mix(pre, G.pts.slot, ease.outCubic((ins2 - 0.8) / 0.2));
      }
      if (val('nearBack') > 0) near = mix(G.pts.slot, rest.near, ease.inOutCubic(val('nearBack')));
      rot = -90 * (1 - ease.inOutCubic(clamp(ins2 / 0.7)));
      flip = val('turn');
    }
    // ---- carry: the free hand (near after a substitution, far otherwise) goes to the tab and pushes
    const tabNow = {x: G.pts.tab.x + dx, y: G.pts.tab.y};
    const cr = ease.inOutCubic(val('carryReach'));
    let carryHand = null;
    if (val('carry') > 0) carryHand = tabNow;
    else if (val('carryReach') > 0) carryHand = mix(sub ? rest.near : rest.far, G.pts.tab, cr);
    if (carryHand) { if (sub) near = carryHand; else far = carryHand; }
    const solved = rigB.frame({x: G.B.x, y: G.B.floor, facing: -1, scale: k, near, far, headTilt: v.headB ?? 0});
    Object.assign(nodes, solved.nodes);
    const hF = solved.hands.far, hN = solved.hands.near;
    nodes[`${P}-reply`] = {transform: dx ? T(dx, 0) : ''};
    const open = sub ? clamp((lp - 0.35) / 0.5) * (1 - clamp((ins - 0.9) / 0.1)) : 0;
    for (let i = 0; i < N; i++) {
      const pr = i === kk && !sub ? Math.sin(Math.PI * lp) : 0;
      nodes[`${P}-latch${i}-arm`] = {transform: i === kk && open ? `rotate(${r(-100 * ease.outCubic(open))} 4 -15)` : pr ? `translate(${r(-3 * pr)} 0)` : ''};
    }
    const pieces = [];
    let oldAt = null;
    for (let i = 0; i < N; i++) {
      let q = {x: gripX + dx, y: rowW(i)};
      if (sub && i === kk) {
        const lifted = rem >= 0.25;
        const down = clamp((rem - 0.25) / 0.2);            // turned face-down while held at its grip
        const rotO = -90 * ease.inOutCubic(clamp((rem - 0.45) / 0.55));
        if (lifted) q = G.standing && rem >= 0.85 ? {x: G.pts.holdFar.x, y: G.pts.holdFar.y} : {x: hF.x - 4, y: hF.y + 6};
        const {sy, text: valOp} = turnFace(down);
        if (show && M.values[i]) nodes[`${P}-cp${i}-val`] = {opacity: r(down < 0.5 ? valOp : 0, 3)};
        nodes[`${P}-c${i}`] = {transform: T(q.x, q.y, rotO)};
        nodes[`${P}-c${i}-in`] = {transform: down > 0 && down < 1 ? `scale(1 ${r(sy, 3)})` : ''};
        nodes[`${P}-c${i}-f`] = {opacity: down < 0.5 ? 1 : 0};
        nodes[`${P}-c${i}-b`] = {opacity: down >= 0.5 ? 1 : 0};
        if (lifted) oldAt = {x: r(q.x), y: r(q.y)};
      } else nodes[`${P}-c${i}`] = {transform: T(q.x, q.y)};
      pieces.push({x: r(q.x), y: r(q.y)});
    }
    const inserted = sub && ins >= 1;
    const onStand = G.standing && !(sub && ins > pick);
    const holding = !inserted && !onStand;
    const base = onStand ? {x: G.pts.hold.x, y: G.pts.hold.y} : holding ? {x: hN.x + 2, y: hN.y} : {x: gripX + dx, y: rowW(kk)};
    const {sy, text: valOp} = turnFace(flip);
    if (show && o.value) nodes[`${P}-sp-val`] = {opacity: r(flip >= 0.5 ? valOp : 0, 3)};
    nodes[`${P}-spare`] = {transform: T(base.x, base.y, inserted ? 0 : rot, 1, r(sy, 3))};
    nodes[`${P}-sp-face`] = {opacity: flip >= 0.5 ? 1 : 0};
    nodes[`${P}-sp-flip`] = {opacity: flip < 0.5 ? 1 : 0};
    nodes[`${P}-thumb`] = {opacity: holding ? 1 : 0, transform: T(hN.x - 3 * k, hN.y - 3 * k, 0, -1, 1)};
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    return {
      nodes,
      sem: {
        handB: P2(hF), handBn: P2(hN), spare: P2(base), carryHand: P2(sub ? hN : hF), carryGrip: P2(tabNow),
        setAt: P2({x: gripX + dx, y: rowW(0)}),
        spareFaceUp: flip >= 0.5, spareIn: inserted, oldPiece: oldAt,
        latchOpen: r(open, 3), carry: r(carryE, 3), dx: r(dx),
        allReached: solved.reached, pieces, head: P2(solved.head),
      },
    };
  }
  return {node, pose, rig: rigB, rest};
}

/** Text boxes (world) of a reply scene at a push offset dx: header lines and piece values. */
export function replySceneTextBoxes(G, dx = 0, spareValue = null) {
  const boxes = [];
  for (const ln of G.M.replyHdr.lines) if (ln.fit) boxes.push({x: G.x0 + SHEET.hp + (ln.x || 0) + dx, y: G.Ry + (G.hdrAbove ? 0 : G.colHt) + ln.y, w: ln.fit.width, h: ln.fit.height});
  for (let i = 0; i < G.N; i++) {
    const v = G.M.values[i];
    if (v) boxes.push({x: G.xSp - SHEET.spW / 2 - G.tw + TILE.tabW + TILE.padL + dx, y: G.Ry + G.colTop + G.rowIn(i) - v.height / 2, w: Math.max(v.width, spareValue ? spareValue.width : 0), h: v.height});
  }
  return boxes;
}
