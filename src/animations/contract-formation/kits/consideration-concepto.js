/**
 * Kit for the "Consideration como concepto" motif (contract-formation-06, LAW-0461..0464).
 * Art, text fitting and pure geometry only: every entry owns its timeline, layout choices and semantics. Adapted from
 * the contract-formation-05 kit (intercambio-promesas.js, read-only; copied, never imported).
 *
 * Objects (original vector art, the category's editorial-flat language):
 *  - two TOKEN cards of identical size: Party A's PROMISE token (● solid disc, travels from A to B) and Party B's
 *    PERFORMANCE token (◆ solid diamond, travels from B to A), equal weight.
 *  - two pigeonhole RACKS on stands, one per party (a slot only where a supplied token rests).
 *  - the LINK: once both tokens rest, a plain neutral line joins them, captioned "Linked as supplied". It has no
 *    arrowhead and no direction: it records that the two tokens are linked in the supplied facts, nothing more. A
 *    supplied status "question to be analysed" draws the link and a ring round the performance token with the dashed
 *    pending marker (an open question, never a failure: no red, no cross, no empty slot).
 *  - the SEQUENCE STRIP: stations in the supplied order only (never computed from the time labels); the link is its
 *    own station when supplied. Events with one position share a station in a dashed bracket "order to be examined".
 * Legal content: "consideration" appears only as a CONCEPT LABEL supplied by the author and marked as supplied and
 * illustrative (a doctrinal term kept in its origin; no jurisdiction or legal system is implied). Nothing here states a rule about it: no sufficiency or
 * adequacy, nothing about past or bargained-for performance, no validity, enforceability, binding force or formation,
 * and no consequence of a performance being identified or left as a question.
 * @module animations/contract-formation/kits/consideration-concepto
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath, mix} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj, oneOf, int} from '../../../schemas/fields.js';
import {offerFields} from './offer-fields.js';
import {fitW, chipW, overlaps, insideBox, unionBox, turnFace, RIG, rigPt, headBox, figureBox, canReach} from './aceptacion-contrapropuesta.js';

export {fitW, chipW, overlaps, insideBox, unionBox, turnFace, RIG, rigPt, headBox, figureBox, canReach};

export const INK = '#1f2328';
/** A slides a card this fraction of its width out of the slot before letting go. */
export const SLIDE = 0.07;

/* ======================================================================== */
/* Fields, defaults and strings                                             */
/* ======================================================================== */

export const EVENTS = ['promise-sent', 'promise-received', 'performance-sent', 'performance-received', 'linked'];
/** The token an event belongs to: 'proposal' = Party A's promise token (●), 'response' = Party B's performance token
 * (◆); 'link' = the plain link between them. */
export const msgOf = ev => (ev.startsWith('promise') ? 'proposal' : ev.startsWith('performance') ? 'response' : 'link');
/** The event name of a token's sending or receipt. */
export const evName = (m, verb) => `${m === 'proposal' ? 'promise' : 'performance'}-${verb}`;

/** One step of the sequence as supplied. */
export const sequenceItem = obj('One event of the supplied sequence. The order of the list is the order shown; events with the same position are shown together as an order to be examined. Times are fictional labels, never computed or compared', {
  event: oneOf('Which event', EVENTS),
  time: str('Fictional time label as supplied, e.g. "Day 3, 10:00 (fictional)"', 40),
  position: int('Optional position in the supplied order (1 = first). Events given the same position are shown together, order to be examined', 1, 5),
}, ['event', 'time']);

/** Motif fields shared by the four treatments. */
export const motifFields = {
  ...offerFields,
  responses: list('Party B\'s performance token (its reference and the performance as supplied)', obj('Party B\'s performance token', {
    reference: str('Reference printed on the performance token (fictional)', 32),
    text: str('The performance printed on the token, as supplied', 90),
  }, ['reference', 'text']), 1, 1),
  sequence: list('The tokens\' journeys and the link as supplied, in the order shown (1–5). The order is depicted, never resolved', sequenceItem, 1, 5),
};

export const DEFAULT_CONTENT = {
  parties: [{name: 'Lena Okafor', role: 'Party A'}, {name: 'Marco Bellini', role: 'Party B'}],
  offer: {reference: 'P-201', title: 'Pay 300 for the fence'},
  terms: [
    {key: 'item', label: 'Amount', value: '300 (fictional)'},
    {key: 'quantity', label: 'For', value: 'The fence'},
  ],
  responses: [{reference: 'Q-201', text: 'Repaint the fence'}],
  sequence: [
    {event: 'promise-sent', time: 'Day 1, 09:00 (fictional)'},
    {event: 'performance-sent', time: 'Day 1, 09:30 (fictional)'},
    {event: 'promise-received', time: 'Day 1, 11:00 (fictional)'},
    {event: 'performance-received', time: 'Day 1, 11:30 (fictional)'},
    {event: 'linked', time: 'Day 1, 12:00 (fictional)'},
  ],
};

export const KIT_STRINGS = {
  en: {
    proposal: 'Promise', response: 'Performance',
    'promise-sent': 'Sent by A', 'performance-sent': 'Sent by B',
    'promise-received': 'Received by B', 'performance-received': 'Received by A',
    linked: 'Linked',
    holder: 'From',
    seqTitle: 'Sequence as supplied (illustrative)', toExamine: 'Order to be examined',
    linkCap: 'Linked as supplied',
    'performance-identified': 'Performance identified (as supplied)',
    'question-to-analyse': 'Question to be analysed (as supplied)',
    conceptT: 'Concept label (as supplied, illustrative)',
    sequenceToExamine: 'Time sequence to be examined (as supplied)',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    proposal: 'Promesa', response: 'Prestación',
    'promise-sent': 'Enviada por A', 'performance-sent': 'Enviada por B',
    'promise-received': 'Recibida por B', 'performance-received': 'Recibida por A',
    linked: 'Vinculadas',
    holder: 'De',
    seqTitle: 'Secuencia según lo aportado (ilustrativa)', toExamine: 'Orden por examinar',
    linkCap: 'Vinculadas según lo aportado',
    'performance-identified': 'Prestación identificada (según lo aportado)',
    'question-to-analyse': 'Cuestión por analizar (según lo aportado)',
    conceptT: 'Etiqueta de concepto (según lo aportado, ilustrativa)',
    sequenceToExamine: 'Secuencia temporal por examinar (según lo aportado)',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** Supplied final states: the supplied status of the performance token (a tag under the strip's title, and the link's
 * style); nothing is inferred from it. */
export const FINAL_STATES = ['performance-identified', 'question-to-analyse', 'sequence-to-examine'];

/** Message colours: two solid, equally strong hues (never dashed, never faded to tell them apart). */
export function msgColor(ctx, kind) {
  if (kind === 'link') return INK;
  return kind === 'proposal' ? ctx.theme.accent2 : ctx.theme.accent3;
}

/* ======================================================================== */
/* Sequence: the supplied order, grouped by position                         */
/* ======================================================================== */

/**
 * Stations in the supplied order. Events sharing a `position` form one station (order to be examined). Returns
 * stations [{events:[{event,time,msg,verb}], grouped}], `problems` (e.g. a received event listed before its own sent
 * event — drawn as supplied, flagged in the semantics), the commitments that travel (`active`) and the supplied
 * configuration ('reciprocal' | 'unilateral' | 'other') — who holds which commitment, nothing more.
 */
export function stationsOf(seq) {
  const out = [];
  const byPos = new Map();
  seq.forEach((e, i) => {
    const pos = e.position ?? null;
    const msg = msgOf(e.event);
    const ev = {event: e.event, time: e.time, msg, verb: e.event.endsWith('sent') ? 'sent' : e.event === 'linked' ? 'linked' : 'received', index: i};
    if (pos !== null && byPos.has(pos)) { byPos.get(pos).events.push(ev); byPos.get(pos).grouped = true; return; }
    const st = {events: [ev], grouped: false, pos};
    if (pos !== null) byPos.set(pos, st);
    out.push(st);
  });
  const problems = [];
  const seen = new Set();
  for (const e of seq) {
    if (seen.has(e.event)) problems.push(`duplicate:${e.event}`);
    seen.add(e.event);
  }
  const stIdx = ev => out.findIndex(s => s.events.some(x => x.event === ev));
  for (const m of ['proposal', 'response']) {
    const s = stIdx(evName(m, 'sent')), rc = stIdx(evName(m, 'received'));
    if (s >= 0 && rc >= 0 && rc < s) problems.push(`order:${m}`);
  }
  // the supplied configuration: the commitments that have events (both: reciprocal; A's only: unilateral)
  const active = ['proposal', 'response'].filter(m => seq.some(e => msgOf(e.event) === m));
  const configuration = active.length === 2 ? 'reciprocal' : active[0] === 'proposal' ? 'unilateral' : 'other';
  const linkIdx = stIdx('linked');
  // (the link is drawn after both tokens' receipts: a link station supplied before them is flagged, drawn as supplied)
  for (const m of ['proposal', 'response']) { const rc = stIdx(evName(m, 'received')); if (linkIdx >= 0 && rc > linkIdx) problems.push(`order:link-${m}`); }
  return {stations: out, problems, active, configuration, linkIdx};
}

/**
 * Timeline: station i happens at t_i in [t0, t1] (even spacing: the supplied
 * order, never a time scale). Each message travels from its sent station to its
 * received station. With no sent event it is handed over just before its received
 * station (`moveAt`, no station); with no received event it stops part-way; with
 * neither it stays where it rests.
 */
export function scheduleOf(stations, t0, t1) {
  const n = stations.length;
  const at = i => (n <= 1 ? t0 : t0 + (t1 - t0) * (i / (n - 1)));
  const find = ev => stations.findIndex(s => s.events.some(x => x.event === ev));
  const msgs = {};
  for (const m of ['proposal', 'response']) {
    const si = find(evName(m, 'sent')), ri = find(evName(m, 'received'));
    const sentAt = si >= 0 ? at(si) : null;
    const recvAt = ri >= 0 ? at(ri) : null;
    const moveAt = sentAt ?? (recvAt !== null ? recvAt - 0.11 : null);
    msgs[m] = {sentAt, recvAt, si, ri, moveAt};
  }
  const li = find('linked');
  return {times: stations.map((_, i) => at(i)), msgs, linkAt: li >= 0 ? at(li) : null};
}

/* ======================================================================== */
/* Text measuring                                                           */
/* ======================================================================== */

/**
 * Fit both cards' texts at body size F (design units) for an inner width.
 * Cards are the SAME size (the larger of the two needs).
 */
export function measureCards(ctx, p, o) {
  const show = ctx.show('all');
  const F = o.F, inner = o.inner;
  const lines = o.maxLines ?? 3;
  const t = ctx.t;
  const fitH = s => fitW(s, {maxWidth: inner - F * 1.6, size: F * 1.02, maxLines: 2, weight: 700});
  const fitB = s => fitW(s, {maxWidth: inner, size: F, maxLines: lines, weight: 600});
  const fitT = s => fitW(s, {maxWidth: inner, size: F, maxLines: lines, weight: 600});
  // mode 'full' (default): head, title and terms; 'title': head and title (the terms are printed elsewhere by the
  // caller); 'head': the head line only (glyph, kind and reference)
  const mode = o.mode ?? 'full';
  // each card's head prints its reference and its holder (the party whose commitment it is, by its role — the
  // party's name stands under the figure): the card keeps it wherever it travels
  // (o.kindLabel: the card's own name — e.g. a mechanism's element label — heads it, the holder on its own line)
  const holderOf = i => `${t.holder}: ${p.parties[i].role || p.parties[i].name}`;
  // (the token's kind — promise or performance — and its reference; the giving party on its own line)
  const headOf = (ref, i, m) => (o.kindLabel ? `${o.kindLabel[m]} · ${ref}` : `${t[m]} · ${ref}`);
  // (o.holderLine === false: the holder is named elsewhere — e.g. a mechanism's portrait captions)
  // (the giving party is named by the figure's caption; o.holderLine === true prints it on the token too)
  const holderLine = i => (o.holderLine === true && show && mode !== 'token' && mode !== 'head' ? [fitB(holderOf(i))] : []);
  const prop = {
    head: show && mode !== 'token' ? fitH(headOf(p.offer.reference, 0, 'proposal')) : null,
    title: show && (mode === 'full' || mode === 'title') ? fitT(p.offer.title) : null,
    terms: [...holderLine(0), ...(show && mode === 'full' ? p.terms.map(tm => fitB(`${tm.label}: ${tm.value}`)) : [])],
  };
  const resp = p.responses[0];
  const wd = {
    head: show && mode !== 'token' ? fitH(headOf(resp.reference, 1, 'response')) : null,
    title: show && (mode === 'full' || mode === 'title') ? fitT(resp.text) : null,
    terms: holderLine(1),
  };
  const gapL = F * 0.34;
  const hOf = c => (c.head ? c.head.height + F * 0.5 : F * 1.6) + (c.title ? c.title.height + gapL : 0) + c.terms.reduce((a, f) => a + f.height + gapL, 0);
  const pad = F * 0.7;
  const bad = [prop.head, prop.title, ...prop.terms, wd.head, wd.title].some(f => f && f.bad);
  const hh = Math.max(hOf(prop), hOf(wd), mode === 'head' ? F * 2.4 : F * 4) + pad * 2;
  const minW = F * 9;
  // 'token': no printed text, only the message's glyph (the caller prints the supplied texts elsewhere)
  if (mode === 'token') return {prop, wd, w: F * 2.7, h: F * 2.3, pad: F * 0.35, F, bad: false, gapL, minW: F * 2.7, mode};
  return {prop, wd, w: inner + pad * 2, h: hh, pad, F, bad, gapL, minW, mode};
}

/* ======================================================================== */
/* Art                                                                      */
/* ======================================================================== */

/** Solid glyph: ● for Party A's commitment, ◆ for Party B's (same area, same stroke). */
export function glyph(ctx, kind, x, y, R, o = {}) {
  const fill = o.fill ?? msgColor(ctx, kind);
  const sw = o.stroke === false ? 0 : Math.max(2, R * 0.16);
  if (kind === 'proposal') return h('circle', {cx: r(x), cy: r(y), r: r(R), fill, stroke: o.strokeColor ?? INK, 'stroke-width': sw});
  // the link's station mark: a neutral bar joining two small rings (no direction)
  if (kind === 'link') {
    const rr = R * 0.42;
    return g(null, h('line', {x1: r(x - R * 0.55), y1: r(y), x2: r(x + R * 0.55), y2: r(y), stroke: INK, 'stroke-width': Math.max(2.5, R * 0.22), 'stroke-linecap': 'round'}),
      h('circle', {cx: r(x - R * 0.6), cy: r(y), r: r(rr), fill: ctx.theme.card, stroke: INK, 'stroke-width': Math.max(2, R * 0.16)}),
      h('circle', {cx: r(x + R * 0.6), cy: r(y), r: r(rr), fill: ctx.theme.card, stroke: INK, 'stroke-width': Math.max(2, R * 0.16)}));
  }
  const d = R * 1.22;
  return h('path', {d: `M${r(x)} ${r(y - d)}L${r(x + d)} ${r(y)}L${r(x)} ${r(y + d)}L${r(x - d)} ${r(y)}Z`, fill, stroke: o.strokeColor ?? INK, 'stroke-width': sw, 'stroke-linejoin': 'round'});
}

/**
 * Message card: local origin = its centre. Face and back are separate groups
 * (`-face`, `-back`), the face text in `-txt`; the whole card in `-in` scales
 * for turns. Returns {node, grip:{x,y} (left mid edge, local)}.
 */
export function messageCard(ctx, {name, kind, M, w, h: hh}) {
  const th = ctx.theme;
  const c = kind === 'proposal' ? M.prop : M.wd;
  const col = msgColor(ctx, kind);
  const x0 = -w / 2, y0 = -hh / 2;
  const F = M.F, pad = M.pad;
  const R = F * 0.5;
  const parts = [];
  let y = y0 + pad;
  if (M.mode === 'token') parts.push(glyph(ctx, kind, 0, 0, Math.min(w, hh) * 0.3));
  // header row: glyph + head text
  const gy = c.head ? y + c.head.size * 0.55 : y + R;
  if (M.mode !== 'token') parts.push(glyph(ctx, kind, x0 + pad + R, gy, R));
  if (c.head) {
    parts.push(textBlock(c.head, {x: x0 + pad + R * 2 + F * 0.45, y, fill: INK}));
    y += c.head.height + F * 0.5;
  } else y += F * 1.6;
  const txt = [];
  if (c.title) { txt.push(textBlock(c.title, {x: x0 + pad, y, fill: INK})); y += c.title.height + M.gapL; }
  for (const f of c.terms) { txt.push(textBlock(f, {x: x0 + pad, y, fill: th.inkSoft})); y += f.height + M.gapL; }
  if (!c.head && M.mode !== 'token') {
    // labels hidden: neutral print lines (decorative filler only)
    for (let i = 0; i < 3; i++) parts.push(h('rect', {x: r(x0 + pad), y: r(y + i * F * 0.9), width: r((w - pad * 2) * (i === 2 ? 0.55 : 0.85)), height: r(F * 0.34), rx: 3, fill: th.inkFaint, opacity: 0.55}));
  }
  const face = g({name: `${name}-face`},
    h('path', {d: roundRectPath(x0 + 4, y0 + 6, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 10), fill: th.card, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(x0 + 10)} ${r(y0)}H${r(x0 + w - 10)}`, stroke: col, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    g({name: `${name}-hd`}, parts),
    g({name: `${name}-txt`}, txt));
  const back = g({name: `${name}-back`, opacity: 0},
    h('path', {d: roundRectPath(x0 + 4, y0 + 6, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 10), fill: shade(col, 0.72), stroke: INK, 'stroke-width': 2.4}),
    glyph(ctx, kind, 0, 0, Math.min(w, hh) * 0.2));
  const node = g({name, 'data-occludes': 1}, g({name: `${name}-in`}, face, back));
  return {node, grip: {x: x0 + 14, y: 0}};
}

/**
 * Pigeonhole rack on a stand: body (x,y,w,h) with `slots` card slots stacked;
 * legs down to floorY. Label plate optional (above the body).
 */
export function rackArt(ctx, {name, x, y, w, h: hh, slots, floorY}) {
  const th = ctx.theme;
  const frame = th.woodDark, face = shade(th.woodTop, 0.35);
  const legH = Math.max(0, floorY - y - hh);
  const parts = [
    h('rect', {x: r(x + w * 0.5 - 6), y: r(y + hh), width: 12, height: r(legH), fill: frame}),
    h('path', {d: roundRectPath(x + w * 0.2, floorY - 10, w * 0.6, 10, 5), fill: frame}),
    h('path', {d: roundRectPath(x, y, w, hh, 14), fill: face, stroke: INK, 'stroke-width': 2.6}),
  ];
  // (a slot is drawn only where a supplied commitment rests: never an empty "missing" slot)
  slots.forEach((s, i) => { if (!s.unused) parts.push(h('path', {name: `${name}-slot${i}`, d: roundRectPath(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, 9), fill: shade(face, -0.1), stroke: shade(frame, 0.2), 'stroke-width': 2})); });
  return g({name}, parts);
}

/** Cubic route between two points, bending horizontally (S-curve). */
export function routeOf(a, b, bend = 0.42, ctrl = null) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const horiz = Math.abs(dx) >= Math.abs(dy);
  const c1 = ctrl ? ctrl.c1 : horiz ? {x: a.x + dx * bend, y: a.y} : {x: a.x, y: a.y + dy * bend};
  const c2 = ctrl ? ctrl.c2 : horiz ? {x: b.x - dx * bend, y: b.y} : {x: b.x, y: b.y - dy * bend};
  const at = t => {
    const u = 1 - t;
    return {x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y};
  };
  // arc-length table for even motion
  const N = 64;
  const pts = [];
  const cum = [0];
  for (let i = 0; i <= N; i++) pts.push(at(i / N));
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const L = cum[N] || 1;
  const byLen = s => {
    const d = clamp(s) * L;
    let i = 1;
    while (i < N && cum[i] < d) i++;
    const f = (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
    return {x: lerp(pts[i - 1].x, pts[i].x, f), y: lerp(pts[i - 1].y, pts[i].y, f)};
  };
  const d = `M${r(a.x)} ${r(a.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(b.x)} ${r(b.y)}`;
  return {a, b, c1, c2, at, byLen, L, d, pts};
}

/** Where two sampled routes cross (fractions of length) or null. */
export function crossingOf(R1, R2) {
  const seg = R => R.pts.map((p, i) => [p, R.pts[i + 1]]).slice(0, -1);
  const s1 = seg(R1), s2 = seg(R2);
  const len = R => { const c = [0]; for (let i = 1; i < R.pts.length; i++) c.push(c[i - 1] + Math.hypot(R.pts[i].x - R.pts[i - 1].x, R.pts[i].y - R.pts[i - 1].y)); return c; };
  const c1 = len(R1), c2 = len(R2);
  for (let i = 0; i < s1.length; i++) {
    for (let j = 0; j < s2.length; j++) {
      const [p, p2] = s1[i], [q, q2] = s2[j];
      const rx = p2.x - p.x, ry = p2.y - p.y, sx = q2.x - q.x, sy = q2.y - q.y;
      const den = rx * sy - ry * sx;
      if (Math.abs(den) < 1e-9) continue;
      const t = ((q.x - p.x) * sy - (q.y - p.y) * sx) / den;
      const u = ((q.x - p.x) * ry - (q.y - p.y) * rx) / den;
      if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        return {x: p.x + rx * t, y: p.y + ry * t, f1: (c1[i] + t * (c1[i + 1] - c1[i])) / c1[c1.length - 1], f2: (c2[j] + u * (c2[j + 1] - c2[j])) / c2[c2.length - 1]};
      }
    }
  }
  return null;
}

/** Monotone progress along a flight: eased ends, shaped by gamma (shifts when it passes the crossing). */
export function flightProgress(t, t0, t1, gamma = 1) {
  if (t <= t0) return 0;
  if (t >= t1) return 1;
  const u = (t - t0) / (t1 - t0);
  const e = ease.inOutSine(u);
  return Math.pow(e, gamma);
}

/**
 * Choose each message's gamma so the two cards never meet in flight: sample the
 * shared flight time and keep the pair (nearest to 1) with the largest minimum
 * distance. `size` = the in-flight card half-diagonal × 2 (design units).
 */
export function separateFlights(RP, RW, fp, fw, W, H) {
  const G = [1, 0.8, 1.25, 0.65, 1.5, 0.5, 1.9];
  let best = null;
  const lo = Math.max(fp.t0, fw.t0), hi = Math.min(fp.t1, fw.t1);
  for (const gp of G) {
    for (const gw of G) {
      // clearance: how far apart the two in-flight card boxes stay (negative = they overlap)
      let md = Infinity;
      if (hi > lo) {
        for (let i = 0; i <= 80; i++) {
          const t = lerp(lo, hi, i / 80);
          const a = RP.byLen(flightProgress(t, fp.t0, fp.t1, gp) * (fp.stop ?? 1)), b = RW.byLen(flightProgress(t, fw.t0, fw.t1, gw) * (fw.stop ?? 1));
          md = Math.min(md, Math.max(Math.abs(a.x - b.x) - W, Math.abs(a.y - b.y) - H));
        }
      }
      const cost = Math.abs(Math.log(gp)) + Math.abs(Math.log(gw));
      const ok = md >= 0;
      const cand = {gp, gw, md, ok, cost};
      if (!best || (ok && !best.ok) || (ok === best.ok && (ok ? cost < best.cost - 1e-9 : md > best.md))) best = cand;
    }
  }
  return best;
}

/* ======================================================================== */
/* Sequence strip                                                           */
/* ======================================================================== */

/**
 * Measure stations: per event a verb line and a time chip (F = body size).
 * Returns per-station boxes (relative), sizes and fits.
 */
export function measureStations(ctx, stations, o) {
  const show = ctx.show('all');
  const F = o.F, w = o.w;
  const R = F * 0.52;
  const st = stations.map(s => {
    const evs = s.events.map(ev => {
      const verb = show ? fitW(ctx.t[ev.event], {maxWidth: w - R * 2 - F * 0.6, size: F, maxLines: 2, weight: 700}) : null;
      // (o.chipW: a narrower label chip, in text sizes — the label wraps; a lens on one station then needs a narrower crop)
      const cw0 = o.chipW ? Math.min(w - F * 1.2, o.chipW * F) : w - F * 1.2;
      const time = show ? fitW(ev.time, {maxWidth: cw0, size: F, maxLines: o.chipW ? 3 : 2, weight: 600}) : null;
      // o.alt: {event: value} — an alternative time label for that event, drawn in the same place (hidden; the
      // caller turns it in); the station keeps room for the taller of the two
      const alt = show && o.alt && o.alt[ev.event] !== undefined ? fitW(o.alt[ev.event], {maxWidth: cw0, size: F, maxLines: o.chipW ? 3 : 2, weight: 600}) : null;
      const fin = null;
      const tH0 = Math.max(time ? time.height : 0, alt ? alt.height : 0);
      const hh = Math.max(R * 2.2, verb ? verb.height : 0) + (time ? tH0 + F * 0.55 + F * 0.3 : 0) + (fin ? fin.height + F * 0.6 + F * 0.35 : 0);
      return {...ev, verb, time, alt, fin, h: hh};
    });
    // o.across: a grouped station spans one column per event, its events side by side (the strip keeps one column
    // per event, so a paired strip with the same events has the same width)
    const across = Boolean(o.across && s.grouped);
    const span = across ? evs.length : 1;
    const inner = across ? Math.max(...evs.map(e => e.h)) : evs.reduce((a, e) => a + e.h, 0) + (evs.length - 1) * F * 0.5;
    const spanW = w * span + F * 1.5 * (span - 1);
    const tag = s.grouped && show ? fitW(ctx.t.toExamine, {maxWidth: spanW - F * 0.4, size: F, maxLines: 2, weight: 700}) : null;
    // (across: the tag sits as a legend on the bracket's lower edge, half inside)
    const hh = inner + (s.grouped ? (across ? F * 0.3 + (tag ? tag.height / 2 + F * 0.3 : F * 0.1) : F * 0.8 + (tag ? tag.height + F * 0.4 : 0)) : 0);
    return {...s, evs, tag, h: hh, span, across};
  });
  const bad = st.some(s => s.evs.some(e => (e.verb && e.verb.bad) || (e.time && e.time.bad) || (e.fin && e.fin.bad)) || (s.tag && s.tag.bad));
  const title = show ? fitW(ctx.t.seqTitle, {maxWidth: o.titleW ?? w * 2, size: F, maxLines: 2, weight: 700}) : null;
  // the supplied final state's tag sits under (or beside) the strip's title
  const titleTagText = show && (o.final === 'sequence-to-examine' ? ctx.t.sequenceToExamine : o.final === 'performance-identified' || o.final === 'question-to-analyse' ? ctx.t[o.final] : null);
  const titleTag = titleTagText ? fitW(titleTagText, {maxWidth: (o.titleW ?? w * 2) - F * 1.2, size: F, maxLines: 3, weight: 700}) : null;
  // beside the title when both fit on one row of the strip's width
  const sameRow = Boolean(title && titleTag && title.width + titleTag.width + F * 2.4 <= (o.titleW ?? w * 2));
  return {st, R, F, w, bad: bad || Boolean(title && title.bad) || Boolean(titleTag && titleTag.bad), title, titleTag, sameRow, final: o.final, span: st.reduce((a, q) => a + q.span, 0)};
}

/**
 * Lay the stations out along a rail. dir 'row' (left→right) or 'column'
 * (top→bottom), starting at (x, y) with pitch between stations. Returns node,
 * per-station nodes named `${name}-s${i}` and per-event `${name}-s${i}-e${j}`,
 * boxes, and the rail.
 */
export function stripArt(ctx, S, {name, x, y, dir, pitch, colW, cols, titleAbove = true}) {
  const th = ctx.theme;
  const F = S.F, R = S.R;
  const parts = [];
  const boxes = [];
  let titleBox = null;
  let ox = x, oy = y;
  if (S.title) {
    const tb = {x, y, w: S.title.width, h: S.title.height};
    parts.push(textBlock(S.title, {x, y, fill: th.fg, name: `${name}-title`}));
    titleBox = tb;
    if (titleAbove) oy = y + S.title.height + F * 0.6;
  }
  let finalBox = null;
  if (S.titleTag) {
    const tw = S.titleTag.width + F * 1.2, tH = S.titleTag.height + F * 0.6;
    const col = th.inkSoft;
    const fx = S.sameRow ? x + S.title.width + F * 1.2 : x;
    const fy = S.sameRow ? y + (S.title.height - tH) / 2 : oy;
    parts.push(g({name: `${name}-final`, opacity: 0},
      h('path', {d: roundRectPath(fx, fy, tw, tH, Math.min(tH / 2, F * 0.7)), fill: th.card, stroke: col, 'stroke-width': 2.5}),
      textBlock(S.titleTag, {x: fx + tw / 2, y: fy + F * 0.3, anchor: 'middle', fill: INK})));
    finalBox = {x: fx, y: fy, w: tw, h: tH};
    if (S.sameRow) oy = Math.max(oy, fy + tH + F * 0.5); else oy += tH + F * 0.5;
  }
  const n = S.st.length;
  const nc = cols ?? S.st.length;
  const rowP = Math.max(...S.st.map(s => s.h)) + F * 0.8;
  // column index of each station (a station spanning several columns takes them all; one row when spans are used)
  const colOf = [];
  S.st.reduce((a, q, i) => { colOf[i] = a; return a + q.span; }, 0);
  const spanned = S.st.some(q => q.span > 1);
  const centers = S.st.map((s, i) => (dir === 'row'
    ? (spanned ? {x: ox + colOf[i] * pitch + colW / 2, y: oy} : {x: ox + (i % nc) * pitch + colW / 2, y: oy + Math.floor(i / nc) * rowP})
    : {x: ox, y: oy + i * pitch}));
  // rail through the station glyphs (solid, neutral ink)
  const railPts = centers.map(c => (dir === 'row' ? {x: c.x - colW / 2 + R * 1.2, y: c.y + R * 1.2} : {x: c.x + R * 1.2, y: c.y}));
  const stNodes = S.st.map((s, i) => {
    const c = centers[i];
    const bx0 = dir === 'row' ? c.x - colW / 2 : c.x;
    let bx = bx0;
    let yy = c.y;
    const sw = colW + pitch * (s.span - 1);
    const evNodes = s.evs.map((e, j) => {
      const gx = bx + R * 1.2, gy = yy + R * 1.2;
      const kids = [glyph(ctx, e.msg, gx, gy, R)];
      let ey = yy;
      if (e.verb) { kids.push(textBlock(e.verb, {x: bx + R * 2.4 + F * 0.35, y: yy + Math.max(0, R * 1.2 - e.verb.size * 0.6), fill: th.fg})); }
      ey = yy + Math.max(R * 2.2, e.verb ? e.verb.height : 0) + F * 0.3;
      let timeBox = null, altBox = null;
      if (e.time) {
        // (named chip and text: a caller may hide the text or turn the chip)
        const chip = (f, nm, op) => {
          const tw = f.width + F * 0.9, tH = f.height + F * 0.5;
          const cx = bx + R * 2.4 + tw / 2, cy = ey + tH / 2;
          kids.push(g({name: `${name}-s${i}-e${j}-${nm}`, opacity: op, transform: T(cx, cy)},
            h('path', {d: roundRectPath(-tw / 2, -tH / 2, tw, tH, Math.min(tH / 2, F * 0.6)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
            g({name: `${name}-s${i}-e${j}-${nm}-txt`}, textBlock(f, {x: 0, y: -tH / 2 + F * 0.25, anchor: 'middle', fill: INK}))));
          return {x: cx - tw / 2, y: ey, w: tw, h: tH, cx, cy};
        };
        timeBox = chip(e.time, 'time', undefined);
        if (e.alt) altBox = chip(e.alt, 'alt', 0);
        ey += Math.max(timeBox.h, altBox ? altBox.h : 0) + F * 0.35;
      }
      let finNode = null;
      if (e.fin) {
        const fw = e.fin.width + F * 1.2, fH = e.fin.height + F * 0.6;
        finNode = g({name: `${name}-final`, opacity: 0},
          h('path', {d: roundRectPath(bx + R * 2.4, ey, fw, fH, Math.min(fH / 2, F * 0.7)), fill: th.card, stroke: msgColor(ctx, 'response'), 'stroke-width': 2.5}),
          textBlock(e.fin, {x: bx + R * 2.4 + fw / 2, y: ey + F * 0.3, anchor: 'middle', fill: INK}));
        finalBox = {x: bx + R * 2.4, y: ey, w: fw, h: fH};
      }
      const box = {x: bx, y: yy, w: colW, h: e.h};
      if (s.across) bx += pitch; else yy += e.h + F * 0.5;
      return {node: g(null, g({name: `${name}-s${i}-e${j}`, opacity: 0}, kids), finNode), box, glyphAt: {x: gx, y: gy}, timeBox, altBox};
    });
    // an empty slot for each station from the start (thin, solid, faint): the strip's frame is there at rest
    const ph = h('path', {name: `${name}-ph${i}`, d: roundRectPath(bx0 - F * 0.3, c.y - F * 0.3, sw + F * 0.6, s.h + F * 0.3, 12), fill: th.card, 'fill-opacity': 0.55, stroke: th.inkFaint, 'stroke-width': 1.6});
    const kids = [ph, ...evNodes.map(e => e.node)];
    const sb = {x: bx0 - F * 0.3, y: c.y - F * 0.3, w: sw + F * 0.6, h: s.h + F * 0.3};
    if (s.grouped) {
      // dashed bracket = "to be examined" (the only dashed element of the motif)
      const inner = s.across ? Math.max(...s.evs.map(e => e.h)) : s.evs.reduce((a, e) => a + e.h, 0) + (s.evs.length - 1) * F * 0.5;
      const top = c.y - F * 0.3, bot = c.y + inner + F * 0.3;
      kids.push(h('path', {name: `${name}-s${i}-br`, d: roundRectPath(bx0 - F * 0.3, top, sw + F * 0.6, bot - top, 12), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '9 7', opacity: 0}));
      if (s.tag && s.across) {
        // legend chip centred on the bracket's lower edge
        const lw = s.tag.width + F * 0.9, lh = s.tag.height + F * 0.4;
        const lx = bx0 + sw / 2 - lw / 2, ly = bot - lh / 2;
        kids.push(g({name: `${name}-s${i}-tag`, opacity: 0},
          h('path', {d: roundRectPath(lx, ly, lw, lh, Math.min(lh / 2, F * 0.6)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
          textBlock(s.tag, {x: lx + lw / 2, y: ly + F * 0.2, anchor: 'middle', fill: th.fg})));
      } else if (s.tag) kids.push(g({name: `${name}-s${i}-tag`, opacity: 0}, textBlock(s.tag, {x: bx0, y: bot + F * 0.35, fill: th.fg})));
    }
    boxes.push(sb);
    return {node: g({name: `${name}-s${i}`}, kids), evNodes, box: sb, center: c};
  });
  parts.push(...stNodes.map(s => s.node));
  const all = unionBox([...boxes, ...(titleBox ? [titleBox] : [])]);
  const all2 = finalBox && S.titleTag ? unionBox([all, finalBox]) : all;
  return {node: g({name}, parts), stations: stNodes, box: all2, titleBox, railPts, finalBox};
}

/* ======================================================================== */
/* Stage geometry: two parties, two racks, two crossing routes, the strip    */
/* ======================================================================== */

/**
 * Solve one stage in `box` (design units). Each party stands beside its rack;
 * cards leave A's rack and enter B's rack sideways (never over the other card).
 *  - 'row':   A | A's rack | routes | B's rack | B (B faces A); the strip in a band
 *             under the floor ('below', `cols` stations per row) or between the
 *             racks under the routes ('mid');
 *  - 'stack': A | A's rack on top, B | B's rack below (both face right); the routes
 *             bulge out on the right and enter B's rack from its right side; the strip
 *             sits between the rows on the left or in a band at the bottom.
 * The proposal leaves A's top slot for B's bottom slot, the response the reverse,
 * so the routes cross once. Inputs: M (measureCards), S (measureStations), names,
 * k, F. Returns geometry with `ok` and `why`.
 */
export function stageGeom(ctx, o) {
  const {box, M, S, k, F} = o;
  const why = [];
  const cw = M.w, ch = M.h;
  const gap = Math.max(10, F * 0.45);
  const Rw = cw + gap * 2, slotH = ch + gap;
  const plateH = o.plateH ?? 0;
  // (one commitment travelling — a unilateral configuration —: racks of one slot each, unless o.slotsMin keeps a
  // paired scene's racks the same size as its reciprocal twin)
  const oneSlot = (o.active ?? ['proposal', 'response']).length < 2 && (o.slotsMin ?? 1) < 2;
  const Rh = (oneSlot ? slotH + gap * 2 : slotH * 2 + gap * 3) + plateH;
  const nameH = Math.max(...o.names.map(n => (n ? n.box.h : 0)), 0);
  const stN = S.span ?? S.st.length;
  const cols = S.st.some(q => q.span > 1) ? stN : Math.min(stN, o.cols ?? stN);
  const rows = Math.max(Math.ceil(stN / cols), o.rowsMin ?? 0);
  // (o.stationHMin / o.rowsMin: a paired scene's strip, so both scenes share one geometry)
  const stationH = Math.max(...S.st.map(s => s.h), o.stationHMin ?? 0);
  const titleH = (S.title ? S.title.height + F * 0.6 : 0) + (S.titleTag ? (S.sameRow ? Math.max(0, S.titleTag.height + F * 0.6 - S.title.height) / 2 + F * 0.3 : S.titleTag.height + F * 1.1) : 0);
  // o.noStrip: the caller draws the strip outside the stage (no room is kept for it here)
  const stripH = o.noStrip ? 0 : titleH + rows * stationH + (rows - 1) * F * 0.8;
  const stripW = o.noStrip ? 0 : S.w + (cols - 1) * (S.w + F * 1.5);
  const fig = (x, floor, f) => ({x, floor, f, k});
  const reachX = 34 * k;             // rack edge in front of the figure
  const bodyW = 58 * k;              // half figure width
  // rack body top: slots around the shoulder, never above the box; the stand is at least 40 tall
  // (o.rackLift: the slots' centre height above the floor, in figure units; 300 = the shoulder)
  const place = (floor, top) => Math.max(top + 2, Math.min(floor - (o.rackLift ?? 300) * k - Rh / 2, floor - 40 - Rh));
  const rackTop = box.y;
  let A, B, rackA, rackB, strip, sideB, stripBox;
  if (o.arr === 'row') {
    const below = o.strip === 'below';
    // 'floor': the strip sits in the band of the names, between them (under the routes)
    const onFloor = o.strip === 'floor';
    const floorY = box.y + box.h - (onFloor ? Math.max(nameH, stripH + F * 0.4) : nameH) - 14 - (below ? stripH + F * 1.2 : 0);
    A = fig(box.x + bodyW, floorY, 1);
    B = fig(box.x + box.w - bodyW, floorY, -1);
    rackA = {x: A.x + reachX, y: place(floorY, rackTop), w: Rw, h: Rh};
    rackB = {x: B.x - reachX - Rw, y: place(floorY, rackTop), w: Rw, h: Rh};
    if (rackA.y + Rh > floorY - 30) why.push('rackTall');
    sideB = -1;
    const midL = rackA.x + Rw + gap * 2, midR = rackB.x - gap * 2;
    // (glyph-token cards are small in flight: a narrower middle suffices)
    if (midR - midL < Math.max(cw * (o.fly ?? 0.45) + 36, M.mode === 'token' ? 110 : 140)) why.push('mid');
    if (below) {
      strip = {x: box.x + (box.w - stripW) / 2, y: floorY + nameH + 14 + F * 0.8};
      if (stripW > box.w) why.push('stripW');
    } else if (onFloor) {
      strip = {x: box.x + (box.w - stripW) / 2, y: floorY + 14 + F * 0.4};
      if (stripW > box.w) why.push('stripW');
    } else {
      strip = {x: (midL + midR) / 2 - stripW / 2, y: floorY - stripH};
      if (stripW > midR - midL) why.push('stripW');
    }
  } else {
    // stack: both parties face right, racks to their right; B's row on top, A's below
    const bandBelow = o.strip === 'below';
    const floorBot = box.y + box.h - nameH - 14 - (bandBelow ? stripH + F * 1.2 : 0);
    const rowH = Math.max(420 * k, Rh + 80) + nameH + 14;
    const floorTop = floorBot - rowH - o.rowGap;
    B = fig(box.x + bodyW, floorTop, 1);
    A = fig(box.x + bodyW, floorBot, 1);
    rackB = {x: B.x + reachX, y: place(floorTop, rackTop), w: Rw, h: Rh};
    rackA = {x: A.x + reachX, y: place(floorBot, floorTop + nameH + 14), w: Rw, h: Rh};
    if (rackA.y + Rh > floorBot - 30 || rackB.y + Rh > floorTop - 30) why.push('rackTall');
    sideB = 1;
    if (floorTop - 420 * k < box.y) why.push('top');
    if (bandBelow) {
      strip = {x: box.x + (box.w - stripW) / 2, y: floorBot + nameH + 14 + F * 0.8};
      if (stripW > box.w) why.push('stripW');
    } else {
      // between the rows, left of the routes' bulge
      strip = {x: box.x + 8, y: floorTop + nameH + 14 + F * 0.6};
      if (strip.y + stripH > rackA.y - F * 0.6) why.push('stripH');
    }
  }
  strip = {...strip, dir: 'row', pitch: S.w + F * 1.5, cols, rows, h: stripH, w: stripW};
  stripBox = {x: strip.x - F * 0.4, y: strip.y - F * 0.3, w: stripW + F * 0.8, h: stripH + F * 0.6};
  const slotsOf = R => (oneSlot ? [0, 0] : [0, 1]).map(i => ({x: R.x + R.w / 2, y: R.y + plateH + gap * 1.5 + slotH * (i + 0.5) + gap * i * 0.5, w: cw + gap * 0.6, h: ch + gap * 0.6}));
  const slotsA = slotsOf(rackA), slotsB = slotsOf(rackB);
  // (o.active: the commitments that travel; a slot no supplied commitment uses is not drawn)
  const act = o.active ?? ['proposal', 'response'];
  const has = m => act.includes(m);
  // (one slot per rack: the travelling commitment's two slots are drawn, their duplicates are not)
  if (oneSlot && has('proposal')) { slotsA[1] = {...slotsA[1], unused: true}; slotsB[0] = {...slotsB[0], unused: true}; }
  if (oneSlot && !has('proposal')) { slotsA[0] = {...slotsA[0], unused: true}; slotsB[1] = {...slotsB[1], unused: true}; }
  if (!has('proposal') && !oneSlot) { slotsA[0].unused = true; slotsB[1].unused = true; }
  if (!has('response')) { slotsB[0].unused = true; slotsA[1].unused = true; }
  // the proposal leaves A's top slot for B's bottom slot; the response leaves B's top slot for A's bottom slot
  const cardAt = {proposal: {a: slotsA[0], b: slotsB[1]}, response: {a: slotsB[0], b: slotsA[1]}};
  // routes: leave the sender's rack on its open side, enter the receiver's rack from its open side
  const flyS = o.fly ?? 0.45;
  const room = box.x + box.w - Math.max(rackA.x, rackB.x) - Rw - cw * flyS / 2 - 8;
  const L0 = o.arr === 'row' ? Math.max(cw * 0.9, 120) : Math.max(60, Math.min(cw * 0.9, room + cw / 2));
  const routesWith = (L, bend) => {
    const ctrlOf = (a, b) => (o.arr === 'row' ? null : {c1: {x: a.x + cw / 2 + L, y: a.y}, c2: {x: b.x + cw / 2 + L, y: b.y}});
    return {
      proposal: routeOf(cardAt.proposal.a, cardAt.proposal.b, bend, ctrlOf(cardAt.proposal.a, cardAt.proposal.b)),
      response: routeOf(cardAt.response.a, cardAt.response.b, bend, ctrlOf(cardAt.response.a, cardAt.response.b)),
    };
  };
  let routes = routesWith(L0, 0.42);
  // the sender slides the card out of its slot towards the route's open side (+1 right, −1 left)
  const slideOf = rs => ({proposal: Math.sign(rs.proposal.at(0.08).x - rs.proposal.a.x) || 1, response: Math.sign(rs.response.at(0.08).x - rs.response.a.x) || 1});
  let slide = slideOf(routes);
  // o.clearRacks: a card in flight never passes over the other message's slots (where that card rests before it is
  // sent and after it is received) — the routes bulge further out until they clear them
  const flyBoxAt = (R, pr, sg) => {
    const q = R.byLen(pr), sc = lerp(1, flyS, clamp(pr / 0.12)), dx = sg * cw * SLIDE * (1 - clamp(pr / 0.2));
    return {x: q.x + dx - cw * sc / 2, y: q.y - ch * sc / 2, w: cw * sc, h: ch * sc};
  };
  const slotBox = q => ({x: q.x - cw / 2, y: q.y - ch / 2, w: cw, h: ch});
  const overRacks = rs => act.some(m => {
    // (only the other travelling commitment's slots count)
    if (!has(m === 'proposal' ? 'response' : 'proposal')) return false;
    const other = m === 'proposal' ? cardAt.response : cardAt.proposal;
    const boxes = [slotBox(other.a), slotBox(other.b)];
    const sg = slideOf(rs)[m];
    for (let i = 1; i < 96; i++) { const b = flyBoxAt(rs[m], i / 96, sg); if (boxes.some(x => overlaps(b, x, 8))) return true; }
    return false;
  });
  let racksClear = true;
  if (o.clearRacks && overRacks(routes)) {
    racksClear = false;
    const tries = o.arr === 'row' ? [0.3, 0.55, 0.2, 0.65, 0.12].map(bd => [L0, bd]) : [1.15, 1.3, 1.45, 1.6, 1.8, 2, 2.25, 2.5, 2.8, 3.1, 3.5].map(f => [L0 * f, 0.42]);
    for (const [L, bd] of tries) {
      const rs = routesWith(L, bd);
      if (!overRacks(rs)) { routes = rs; racksClear = true; break; }
    }
    if (!racksClear) why.push('racks');
    slide = slideOf(routes);
  }
  const cross = crossingOf(routes.proposal, routes.response);
  // grips: the card edge nearest the party (A stands left of its rack; B right of it in 'row', left in 'stack')
  const gripA = s => ({x: s.x - cw / 2 + 16, y: s.y});
  const gB = s => (sideB === -1 ? {x: s.x + cw / 2 - 16, y: s.y} : {x: s.x - cw / 2 + 16, y: s.y});
  // A sends from slot 0 (with its slide) and receives in slot 1; B receives in slot 1 and sends from slot 0
  if (has('proposal') && (!canReach(A, 'near', gripA(slotsA[0])) || !canReach(A, 'near', {x: gripA(slotsA[0]).x + slide.proposal * cw * SLIDE, y: slotsA[0].y}))) why.push('reachA');
  if (has('response') && !canReach(A, 'near', gripA(slotsA[1]))) why.push('reachA');
  if (has('proposal') && !canReach(B, 'near', gB(slotsB[1]))) why.push('reachB');
  if (has('response') && (!canReach(B, 'near', gB(slotsB[0])) || !canReach(B, 'near', {x: gB(slotsB[0]).x + slide.response * cw * SLIDE, y: slotsB[0].y}))) why.push('reachB');
  const figA = figureBox(A), figB = figureBox(B);
  const nameBox = (fg, n) => (n ? {x: clamp(fg.x - n.box.w / 2, box.x + 2, box.x + box.w - n.box.w - 2), y: fg.floor + 10, w: n.box.w, h: n.box.h} : null);
  const nA = nameBox(A, o.names[0]), nB = nameBox(B, o.names[1]);
  const standA = {x: rackA.x, y: rackA.y, w: rackA.w, h: A.floor - rackA.y};
  const standB = {x: rackB.x, y: rackB.y, w: rackB.w, h: B.floor - rackB.y};
  const items = [['figA', figA], ['figB', figB], ['rackA', standA], ['rackB', standB], ['nA', nA], ['nB', nB], ['strip', o.noStrip ? null : stripBox]].filter(q => q[1]);
  const okPair = (x, y) => ['figA|rackA', 'rackA|figA', 'figB|rackB', 'rackB|figB', 'figA|nA', 'nA|figA', 'figB|nB', 'nB|figB'].includes(`${x}|${y}`);
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    if (okPair(items[i][0], items[j][0])) continue;
    if (overlaps(items[i][1], items[j][1], 4)) why.push(`overlap:${items[i][0]}-${items[j][0]}`);
  }
  for (const [nm, b] of items) if (!insideBox(b, box, -1)) why.push(`outside:${nm}`);
  // cards in flight stay clear of the strip, the names, the heads and the other rack's cards
  const fly = o.fly ?? 0.45;
  const keep = [o.noStrip ? null : stripBox, nA, nB, headBox(A), headBox(B)].filter(Boolean);
  const routeBoxes = [];
  for (const m of act) {
    const R = routes[m];
    for (let i = 0; i <= 64; i += 2) {
      const pr = i / 64;
      const q = R.byLen(pr);
      // the card leaves at full size and shrinks over the first 12 % (it slid out of its slot first)
      const sc = lerp(1, fly, clamp(pr / 0.12));
      const dx = slide[m] * cw * SLIDE * (1 - clamp(pr / 0.2));
      const cb = {x: q.x + dx - cw * sc / 2 - 6, y: q.y - ch * sc / 2 - 6, w: cw * sc + 12, h: ch * sc + 12};
      routeBoxes.push(cb);
      if (i <= 60 && keep.some(b => overlaps(cb, b, 2))) { why.push(`route-${m}`); break; }
      if (!insideBox(cb, box, -2)) { why.push(`route-out-${m}`); break; }
    }
  }
  const extent = unionBox([...items.map(q => q[1]), ...routeBoxes]);
  return {ok: why.length === 0, why, A, B, rackA, rackB, slotsA, slotsB, cardAt, routes, cross, strip, stripBox, nA, nB,
    floorA: A.floor, floorB: B.floor, gripA, gripB: gB, cw, ch, gap, k, plateH, extent, stripCols: cols, sideB, arr: o.arr, slide};
}

/* ======================================================================== */
/* The whole scene (story; also each contrast scene and the inspect context) */
/* ======================================================================== */

/** Free spot for a box (w×h) nearest to `near`, clear of obstacles, inside bounds. */
export function freeSpot(bounds, w, hh, obstacles, near, step = 14) {
  let best = null, bd = Infinity;
  for (let y = bounds.y; y + hh <= bounds.y + bounds.h + 0.01; y += step) {
    for (let x = bounds.x; x + w <= bounds.x + bounds.w + 0.01; x += step) {
      const b = {x, y, w, h: hh};
      const d = Math.hypot(x + w / 2 - near.x, y + hh / 2 - near.y);
      if (d >= bd) continue;
      if (obstacles.some(q => overlaps(b, q, 6))) continue;
      bd = d; best = b;
    }
  }
  return best ? {...best, d: bd} : null;
}

/** Nearest point of box b to point q. */
export const nearestOn = (b, q) => ({x: clamp(q.x, b.x, b.x + b.w), y: clamp(q.y, b.y, b.y + b.h)});

export const DEFAULT_PX = [{F: 26, L: 25}, {F: 24, L: 24}, {F: 22, L: 22}, {F: 21, L: 21}, {F: 20, L: 20}, {F: 19.6, L: 19.6}, {F: 18, L: 18}, {F: 17, L: 17}, {F: 16.1, L: 16.1}];
export const MSGS = ['proposal', 'response'];

/**
 * Lay out one scene (two parties, racks, crossing routes, strip, notes).
 * o: {box, shape, upx, prefix, headTarget, sequence, finalState, annotations,
 *     showFinal, showKey, captions, plates:{outgoing,incoming}, ev:[t0,t1], fly,
 *     pxSets, fixed:{F,FL,innerF,colF,k,arr}} → L (with `ok`, `why`).
 */
export function layoutScene(ctx, p, o) {
  const th = ctx.theme;
  const P = o.prefix ?? '';
  const show = ctx.show('all'), showKey = o.showKey ?? ctx.show('key');
  const box = o.box;
  const {stations, problems, active, configuration} = stationsOf(o.sequence);
  const pairStations = o.pairSequence ? stationsOf(o.pairSequence).stations : null;
  const fly = o.fly ?? 0.45;
  const shape = o.shape;
  const arrs = o.arrs ?? (shape === 'portrait' ? [{arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 2}, {arr: 'stack', strip: 'below', cols: 1}]
    : shape === 'square' ? [{arr: 'row', strip: 'below', cols: 2}, {arr: 'stack', strip: 'mid', cols: 1}, {arr: 'row', strip: 'below', cols: 4}, {arr: 'stack', strip: 'below', cols: 2}]
      : [{arr: 'row', strip: 'below', cols: 4}, {arr: 'row', strip: 'below', cols: 2}, {arr: 'row', strip: 'mid', cols: 2}]);
  const noteItems = [];
  // (the concept label, as supplied and marked illustrative: a band chip beside the key)
  if (showKey && o.conceptLabel) noteItems.push({name: `${P}concept`, kind: 'concept', text: `${ctx.t.conceptT}: ${o.conceptLabel}`, weight: 700, stroke: 'soft', label: true});
  if (showKey && o.keyNote !== false) noteItems.push({name: `${P}key`, kind: 'key', text: ctx.t.key, weight: 600, stroke: 'soft', label: true});
  if (show) (o.annotations || []).forEach((an, i) => noteItems.push({name: `${P}note${i}`, kind: 'note', text: an.text, weight: 600, stroke: 'soft', target: an.target}));
  const strokeOf = () => th.inkSoft;
  const chipOf = (it, F, FL, maxW, x = 0, y = 0, name) => chipW(ctx, it.text, {x, y, maxWidth: maxW, size: it.label ? FL : F, maxLines: 3, weight: it.weight, stroke: strokeOf(it.stroke), name, opacity: name ? 0 : undefined});
  /** notes that go in the band (flow in rows across the top of the box) */
  const bandOf = (items, F, FL) => {
    const maxW = Math.min(box.w * 0.62, 34 * F);
    const chips = items.map(it => ({it, c: chipOf(it, F, FL, maxW), maxW}));
    const rows = [];
    let cur = [], cw = 0;
    for (const q of chips) {
      if (cur.length && cw + F + q.c.box.w > box.w) { rows.push(cur); cur = []; cw = 0; }
      cw += (cur.length ? F : 0) + q.c.box.w;
      cur.push(q);
    }
    if (cur.length) rows.push(cur);
    let y = box.y;
    const placed = [];
    for (const row of rows) {
      const rw = row.reduce((s0, q) => s0 + q.c.box.w, 0) + F * (row.length - 1);
      let x = box.x + (box.w - rw) / 2;
      const rh = Math.max(...row.map(q => q.c.box.h));
      for (const q of row) { placed.push({...q, x, y: y + (rh - q.c.box.h) / 2}); x += q.c.box.w + F; }
      y += rh + F * 0.5;
    }
    return {h: rows.length ? y - box.y + F * 0.3 : 0, placed, bad: chips.some(q => q.c.fit.bad)};
  };
  const captions = o.captions;
  const solveAt = (px, bandItems, fixed) => {
    const F = px.F / o.upx, FL = px.L / o.upx;
    const band = bandOf(bandItems, F, FL);
    if (band.bad) return null;
    const sbox = {x: box.x, y: box.y + band.h, w: box.w, h: box.h - band.h};
    const nmW = Math.min(box.w * 0.42, 22 * FL);
    const names = captions.map(c => (showKey && c ? {...chipW(ctx, c, {x: 0, y: 0, maxWidth: nmW, size: FL, maxLines: 2, weight: 600}), maxW: nmW} : null));
    if (names.some(n => n && n.fit.bad)) return null;
    const plateH = show && o.plates && (o.plates.outgoing || o.plates.incoming) ? FL * 1.25 + F * 0.3 : 0;
    let best = null;
    for (const A of fixed ? [fixed.arr] : arrs) {
      for (const [mode, innerF] of (fixed ? [fixed.mode ?? 'full'] : (o.cardModes ?? ['full'])).flatMap(md => (fixed ? [fixed.innerF] : (o.innerFs ?? [22, 18, 15, 13, 11])).map(f0 => [md, f0]))) {
        if (best && best.modeRank < (o.cardModes ?? ['full']).indexOf(mode)) break;
        const M = measureCards(ctx, p, {F, inner: innerF * F, maxLines: 3, mode});
        if (M.bad) continue;
        // the racks' plates on one line at the label size
        const rackW = M.w + Math.max(10, F * 0.45) * 2;
        if (plateH && [o.plates.outgoing, o.plates.incoming].some(t => t && fitW(t, {maxWidth: rackW - 24, size: FL, maxLines: 1, weight: 700}).bad)) continue;
        const plateTextW = plateH && o.plates.incoming ? fitW(o.plates.incoming, {maxWidth: rackW - 24, size: FL, maxLines: 1, weight: 700}).width : 0;
        // (the commitments that travel: their slots, routes and reach are checked; the others are not drawn)
        const geomExtra = {active, slotsMin: o.slotsMin};
        void plateTextW;
        for (const colF of fixed ? [fixed.colF] : (o.colFs ?? [11, 13, 15])) {
          const S = measureStations(ctx, stations, {F, w: colF * F, across: o.across, alt: o.alt, chipW: o.chipW, titleW: Math.min(box.w * 0.94, colF * F * (A.cols ?? 4) + F * 1.5 * ((A.cols ?? 4) - 1)), final: o.showFinal ? o.finalState : null});
          if (S.bad && !o.noStrip) continue;
          // a paired scene's strip (same F and column width): both scenes take the taller stations and more rows
          const S2 = pairStations && !o.noStrip ? measureStations(ctx, pairStations, {F, w: colF * F, final: null, across: o.across}) : null;
          if (S2 && S2.bad) continue;
          const stripMin = S2 ? {stationHMin: Math.max(...S2.st.map(q => q.h)), rowsMin: S2.st.some(q => q.span > 1) ? 1 : Math.ceil(S2.st.length / Math.min(S2.st.length, A.cols ?? S2.st.length))} : {};
          const geomAt = k => stageGeom(ctx, {box: sbox, M, S, k, F, names, arr: A.arr, strip: A.strip, cols: A.cols, rowGap: F, plateH, fly, ...stripMin, noStrip: o.noStrip, rackLift: M.mode === 'token' ? 225 : undefined, clearRacks: o.clearRacks, ...geomExtra});
          const take = (k, G) => { best = {px, F, FL, M, S, G, names, band, sbox, k, arr: A, innerF, colF, mode, modeRank: (o.cardModes ?? ['full']).indexOf(mode), ok: G.ok, stripMin, geomExtra}; };
          if (fixed) { take(fixed.k, geomAt(fixed.k)); continue; }
          // the largest figure that fits, on a 0.1 grid: coarse steps of 0.3 down from 2.4, then the two finer steps
          // above the first coarse one that fits (a figure taller than the box is skipped without solving)
          const kMin = o.kMin ?? 0.8;
          const kTop = Math.min(2.4, Math.floor((sbox.h / 414) * 10 + 1e-9) / 10);
          let found = null;
          for (let kc = kTop; kc >= kMin - 1e-9 && !found; kc = Math.round((kc - 0.3) * 100) / 100) {
            if (best && kc + 0.2 <= best.k + 1e-9) break;
            const Gc = geomAt(kc);
            if (!Gc.ok) continue;
            found = {k: kc, G: Gc};
            for (const kf of [kc + 0.2, kc + 0.1].map(q => Math.round(q * 100) / 100)) {
              if (kf > kTop + 1e-9) continue;
              const Gf = geomAt(kf);
              if (Gf.ok) { found = {k: kf, G: Gf}; break; }
            }
          }
          // (no coarse step fits: every finer size, from the top down to the least allowed — the fit is not monotone)
          if (!found && !best) {
            for (let k = kTop; k >= kMin - 1e-9 && !found; k = Math.round((k - 0.1) * 100) / 100) {
              if (Math.abs(((kTop - k) / 0.3) - Math.round((kTop - k) / 0.3)) < 1e-6) continue;
              const G = geomAt(k);
              if (G.ok) found = {k, G};
            }
          }
          if (found && (!best || found.k > best.k + 1e-9)) take(found.k, found.G);
        }
      }
    }
    // (then a half step up for the chosen combination: the largest figure that fits, in steps of 0.05)
    if (best && !fixed && best.ok) {
      const k2 = Math.round((best.k + 0.05) * 100) / 100;
      const A = best.arr;
      const G = 414 * k2 > best.sbox.h ? null : stageGeom(ctx, {box: best.sbox, M: best.M, S: best.S, k: k2, F: best.F, names: best.names, arr: A.arr, strip: A.strip, cols: A.cols, rowGap: best.F, plateH, fly, ...best.stripMin, noStrip: o.noStrip, rackLift: best.M.mode === 'token' ? 225 : undefined, clearRacks: o.clearRacks, ...best.geomExtra});
      if (G && G.ok) best = {...best, G, k: k2};
    }
    return best;
  };
  // pass 1: final state and annotations placed next to their targets (band: key only); pass 2: all in the band
  const pxSets = o.fixed ? [o.fixed.px] : (o.pxSets ?? DEFAULT_PX);
  let chosen = null, pass1 = null;
  for (const pass of [1, 2]) {
    const bandItems = pass === 1 ? noteItems.filter(it => it.kind === 'key' || it.kind === 'concept') : noteItems;
    const cands = [];
    for (const px of pxSets) {
      const c = solveAt(px, bandItems, o.fixed);
      if (!c) continue;
      c.head = 88 * c.k * o.upx;
      cands.push(c);
      if (c.head >= (o.headTarget ?? 0) && c.ok) break;
    }
    const oks = cands.filter(c => c.ok);
    const readable = oks.filter(c => c.px.F >= 19.6);
    const pool = readable.length ? readable : oks.length ? oks : cands;
    let best = pool.find(c => c.head >= (o.headTarget ?? 0)) || pool.slice().sort((x, y) => y.head - x.head)[0];
    if (!best) continue;
    let r1 = placeNotes(ctx, best, noteItems, pass, {chipOf, P, o, fly});
    // (the notes find no place beside the largest figures: the same layout with the figures a step smaller, down to
    // the least allowed, before the band is tried)
    if (!r1.ok && !o.fixed && best.ok) {
      const A = best.arr;
      for (let kk = Math.round((best.k - 0.1) * 100) / 100; kk >= (o.kMin ?? 0.8) - 1e-9; kk = Math.round((kk - 0.1) * 100) / 100) {
        const G2 = stageGeom(ctx, {box: best.sbox, M: best.M, S: best.S, k: kk, F: best.F, names: best.names, arr: A.arr, strip: A.strip, cols: A.cols, rowGap: best.F, plateH: best.G.plateH, fly, ...best.stripMin, noStrip: o.noStrip, rackLift: best.M.mode === 'token' ? 225 : undefined, clearRacks: o.clearRacks, ...best.geomExtra});
        if (!G2.ok) continue;
        const b2 = {...best, G: G2, k: kk, head: 88 * kk * o.upx};
        const r2 = placeNotes(ctx, b2, noteItems, pass, {chipOf, P, o, fly});
        if (r2.ok) { best = b2; r1 = r2; break; }
      }
    }
    if (r1.ok || (pass === 2 && !(pass1 && pass1.ok !== false && !r1.ok && pass1.why.length <= r1.why.length))) { chosen = {...best, ...r1}; break; }
    if (pass !== 2 && (!pass1 || r1.why.length < pass1.why.length)) pass1 = {...best, ...r1};
  }
  // (the band pass found no layout, or placed its notes no better: keep the first pass, flagged)
  if (!chosen && pass1) chosen = pass1;
  if (chosen && pass1 && chosen !== pass1 && !chosen.ok && pass1.G.ok && pass1.why.length < chosen.why.length) chosen = pass1;
  const why = [];
  if (!chosen) {
    // nothing fits: the smallest text with its best-effort geometry, flagged (never throws)
    const px = pxSets[pxSets.length - 1];
    const F = px.F / o.upx, FL = px.L / o.upx;
    const band = bandOf(noteItems, F, FL);
    const sbox = {x: box.x, y: box.y + band.h, w: box.w, h: box.h - band.h};
    const names = captions.map(c => (showKey && c ? {...chipW(ctx, c, {x: 0, y: 0, maxWidth: box.w * 0.42, size: FL, maxLines: 2, weight: 600}), maxW: box.w * 0.42} : null));
    const M = measureCards(ctx, p, {F, inner: 15 * F, maxLines: 3});
    const S = measureStations(ctx, stations, {F, w: 13 * F, final: o.showFinal ? o.finalState : null, alt: o.alt});
    const G = stageGeom(ctx, {box: sbox, M, S, k: 0.8, F, names, arr: arrs[0].arr, strip: arrs[0].strip, cols: arrs[0].cols, rowGap: F, fly, noStrip: o.noStrip, clearRacks: o.clearRacks});
    const base = {px, F, FL, M, S, G, names, band, sbox, k: 0.8, arr: arrs[0], innerF: 15, colF: 13, ok: false};
    chosen = {...base, ...placeNotes(ctx, base, noteItems, 2, {chipOf, P, o, fly})};
    why.push('nofit');
  }
  const {F, FL, M, S, G, names} = chosen;
  if (!G.ok) why.push(...G.why);
  why.push(...chosen.why);
  const sched = scheduleOf(stations, o.ev[0], o.ev[1]);
  const flyW = {};
  for (const m of MSGS) {
    const sm = sched.msgs[m];
    // (a message with neither event supplied never leaves its slot)
    if (sm.moveAt === null) { flyW[m] = {t0: 8, t1: 9, stop: 0, still: true}; continue; }
    const t0 = sm.moveAt;
    flyW[m] = {t0, t1: sm.recvAt !== null ? sm.recvAt - 0.03 : lerp(t0, o.ev[1], 0.8), stop: sm.recvAt === null ? 0.55 : 1};
  }
  let sep = separateFlights(G.routes.proposal, G.routes.response, flyW.proposal, flyW.response, G.cw * fly + 10, G.ch * fly + 10);
  if (active.length < 2) sep = {gp: 1, gw: 1, md: 999, ok: true};
  else if (o.clearRacks) {
    // the card's real box at every moment (full size while it leaves and while it settles, the flight scale between):
    // the gammas keep the two boxes apart over the whole action, not only while both fly
    const boxAt = (m, t, gm) => {
      const sm = sched.msgs[m], fl = flyW[m], at = G.cardAt[m];
      let q, sc;
      // (as poseScene draws it: the slide out of the slot, and the growth back to full size in B's slot)
      const sg = G.slide[m] * G.cw * SLIDE;
      if (fl.still || t < fl.t0) { q = {x: at.a.x + (fl.still ? 0 : sg * ease.inOutSine(seg(t, sm.moveAt - 0.035, sm.moveAt - 0.012))), y: at.a.y}; sc = 1; }
      else if (sm.recvAt !== null && t >= fl.t1) { q = at.b; sc = lerp(fly, 1, ease.inOutSine(seg(t, fl.t1, sm.recvAt - 0.005))); }
      else { const pr = flightProgress(t, fl.t0, fl.t1, gm) * fl.stop; const r0 = G.routes[m].byLen(pr); q = {x: r0.x + sg * (1 - clamp(pr / 0.2)), y: r0.y}; sc = lerp(1, fly, clamp(pr / 0.12)); }
      // (with the card's shadow and stroke)
      // (a performance token supplied as a question to be analysed carries its dashed ring: 9 units round the card)
      const ex = m === 'response' && o.linkStatus === 'to-analyse' ? 10 * sc : 0;
      return {x: q.x - G.cw * sc / 2 - 2 - ex, y: q.y - G.ch * sc / 2 - 2 - ex, w: G.cw * sc + 4 + 4 * sc + ex * 2, h: G.ch * sc + 4 + 6 * sc + ex * 2};
    };
    const lo = Math.min(flyW.proposal.t0, flyW.response.t0) - 0.05, hi = Math.min(1, Math.max(...MSGS.map(m => (flyW[m].still ? 0 : flyW[m].t1)))) + 0.05;
    const gap = (gp, gw) => {
      let md = Infinity;
      // (sampled finely: the two cards cross in flight)
      for (let i = 0; i <= 480; i++) {
        const t = lerp(lo, hi, i / 480), a = boxAt('proposal', t, gp), b = boxAt('response', t, gw);
        md = Math.min(md, Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h)));
      }
      return md;
    };
    const G0 = [1, 0.8, 1.25, 0.65, 1.5, 0.5, 1.9];
    let best = null;
    for (const gp of G0) for (const gw of G0) {
      const md = gap(gp, gw), ok = md >= 2, cost = Math.abs(Math.log(gp)) + Math.abs(Math.log(gw));
      if (!best || (ok && !best.ok) || (ok === best.ok && (ok ? cost < best.cost - 1e-9 : md > best.md))) best = {gp, gw, md, ok, cost};
    }
    sep = best;
  }
  if (!sep.ok) why.push('flights-meet');
  const flights = {proposal: {...flyW.proposal, gamma: sep.gp}, response: {...flyW.response, gamma: sep.gw}};
  const strip = o.noStrip ? null : stripArt(ctx, S, {name: `${P}seq`, x: G.strip.x, y: G.strip.y, dir: 'row', pitch: G.strip.pitch, colW: S.w, cols: G.strip.cols});
  const rigs = [0, 1].map(i => personRig(ctx, {name: `${P}${i ? 'B' : 'A'}`, look: actorLook(ctx, p.parties[i], i)}));
  return {P, strip, rigs, captions, F, FL, M, S, G, names, stations, problems, active, configuration, sched, flights, notes: chosen.notes, examBox: chosen.examBox,
    why, ok: why.length === 0, upx: o.upx, sepMin: sep.md, fly, fixed: {px: chosen.px, F, FL, innerF: chosen.innerF, colF: chosen.colF, k: chosen.k, arr: chosen.arr, mode: chosen.mode ?? 'full'}, cardMode: chosen.mode ?? 'full',
    plates: o.plates, finalState: o.finalState, stripOutside: Boolean(o.noStrip), link: chosen.link || null, linkStatus: o.linkStatus ?? 'identified'};
}

/** Notes: the band's (placed) chips plus, in pass 1, the final state and annotations in free space next to their targets. */
function placeNotes(ctx, c, noteItems, pass, {chipOf, P, o, fly}) {
  const {F, FL, G, band, sbox} = c;
  const why = [];
  // where each card rests at the hold (its receiving slot when its receipt is supplied, else its own slot)
  const recvd = m => (o.sequence || []).some(e => e.event === evName(m, 'received'));
  const act = stationsOf(o.sequence || []).active;
  const cardB = m => (recvd(m) ? G.cardAt[m].b : G.cardAt[m].a);
  const cardBox = m => ({x: cardB(m).x - G.cw / 2, y: cardB(m).y - G.ch / 2, w: G.cw, h: G.ch});
  let examBox = null;
  if (o.finalState === 'sequence-to-examine' && o.showFinal) examBox = {x: G.stripBox.x - F * 0.35, y: G.stripBox.y - F * 0.35, w: G.stripBox.w + F * 0.7, h: G.stripBox.h + F * 0.7};
  const stripG = stripArt(ctx, c.S, {name: 'probe', x: G.strip.x, y: G.strip.y, dir: 'row', pitch: G.strip.pitch, colW: c.S.w, cols: G.strip.cols});
  const targetBox = {
    final: examBox,
    promise: cardBox('proposal'), performance: cardBox('response'), sequence: G.stripBox,
  };
  // what a leader must not cross at the hold: the plates, both cards in B's rack, the strip, the names, the people
  const cardsB = act.map(m => cardBox(m));
  const plates = [[G.rackA, o.plates && o.plates.outgoing], [G.rackB, o.plates && o.plates.incoming]].filter(q => q[1] && ctx.show('all')).map(([R, text]) => {
    const fit = fitW(text, {maxWidth: R.w - 24, size: FL, maxLines: 1, weight: 700});
    return {x: R.x + R.w / 2 - fit.width / 2 - 4, y: R.y + G.gap * 0.4, w: fit.width + 8, h: fit.height + 6};
  });
  const evBoxes = [];
  stripG.stations.forEach(st => st.evNodes.forEach(e => evBoxes.push(e.box)));
  const textBoxesAll = [...plates, ...cardsB, ...evBoxes, stripG.titleBox, G.nA, G.nB, figureBox(G.A), figureBox(G.B)].filter(Boolean);
  // ---- the link (both tokens at rest, the link supplied): a straight line between the two cards' facing edges, clear
  // of the people, the names, the strip and the plates; its caption on the line (or just beside it), clear of every
  // other part
  let link = null;
  const hasLink = (o.sequence || []).some(e => e.event === 'linked') && act.length === 2 && o.linkDraw !== false;
  if (hasLink) {
    const c1 = cardB('proposal'), c2 = cardB('response');
    const clip = (b, from, to) => {
      // the point where the segment from the box centre `from` towards `to` leaves the box b
      const dx = to.x - from.x, dy = to.y - from.y;
      const tx = dx ? (dx > 0 ? (b.x + b.w - from.x) / dx : (b.x - from.x) / dx) : Infinity;
      const ty = dy ? (dy > 0 ? (b.y + b.h - from.y) / dy : (b.y - from.y) / dy) : Infinity;
      const t = Math.min(tx, ty);
      return {x: from.x + dx * t, y: from.y + dy * t};
    };
    // candidate paths: the straight line between the facing edges; else (stacked racks) an elbow out past the racks'
    // free side and back, joining the two cards' outer edges
    // (the racks' stands — leg and foot — too: the link never runs along a stand)
    const stands = [[G.rackA, G.floorA], [G.rackB, G.floorB]].map(([R, fy]) => ({x: R.x + R.w * 0.2, y: R.y + R.h, w: R.w * 0.6, h: Math.max(0, fy - R.y - R.h)}));
    const obstL = [figureBox(G.A), figureBox(G.B), G.nA, G.nB, G.stripBox, ...plates, ...stands].filter(Boolean);
    const polyHits = pts => obstL.some(xb => pts.slice(1).some((q, k) => {
      const p0 = pts[k];
      for (let i = 1; i < 40; i++) { const t = i / 40, x = p0.x + (q.x - p0.x) * t, y = p0.y + (q.y - p0.y) * t; if (x > xb.x - 6 && x < xb.x + xb.w + 6 && y > xb.y - 6 && y < xb.y + xb.h + 6) return true; }
      return false;
    }));
    const b1 = cardBox('proposal'), b2 = cardBox('response');
    const paths = [[clip(b1, c1, c2), clip(b2, c2, c1)]];
    for (const side of [1, -1]) {
      const ex = side > 0 ? Math.max(G.rackA.x + G.rackA.w, G.rackB.x + G.rackB.w) + F * 1.4 : Math.min(G.rackA.x, G.rackB.x) - F * 1.4;
      const e1 = {x: side > 0 ? b1.x + b1.w : b1.x, y: c1.y}, e2 = {x: side > 0 ? b2.x + b2.w : b2.x, y: c2.y};
      if (ex > sbox.x + 4 && ex < sbox.x + sbox.w - 4) paths.push([e1, {x: ex, y: e1.y}, {x: ex, y: e2.y}, e2]);
    }
    let pts = paths.find(q => !polyHits(q));
    if (!pts) { why.push('link'); pts = paths[0]; }
    const segs = pts.slice(1).map((q, k) => ({a: pts[k], b: q, len: Math.hypot(q.x - pts[k].x, q.y - pts[k].y)}));
    const len = segs.reduce((x, q) => x + q.len, 0);
    if (len < F * 3) why.push('linkShort');
    // the caption sits on the longest run of the link (or just beside it)
    const main = segs.reduce((x, q) => (q.len > x.len ? q : x));
    const a1 = main.a, a2 = main.b;
    let cap = null;
    if (ctx.show('all')) {
      // (the same caption for either status: the status itself is shown by the dashed pending marker and named where the
      // scene names it — the final tag, the scenario header, the table)
      const text = ctx.t.linkCap;
      let c0 = null;
      for (const mw of [F * 16, F * 12, F * 9, F * 7]) { const c1 = chipW(ctx, text, {x: 0, y: 0, maxWidth: Math.min(mw, Math.max(F * 7, main.len * 0.9)), size: F, maxLines: 3, weight: 700, stroke: ctx.theme.inkSoft}); if (!c1.fit.bad) { c0 = c1; break; } }
      if (!c0) { why.push('linkCapFit'); c0 = chipW(ctx, text, {x: 0, y: 0, maxWidth: F * 16, size: F, maxLines: 3, weight: 700, stroke: ctx.theme.inkSoft}); }
      const W0 = c0.box.w, H0 = c0.box.h;
      // (the racks' boards may lie under the caption; the cards, people, names, strip and plates may not)
      const capObst = [figureBox(G.A), figureBox(G.B), G.nA, G.nB, G.stripBox, ...cardsB, ...plates].filter(Boolean);
      const L0 = main.len || 1;
      const nx = -(a2.y - a1.y) / L0, ny = (a2.x - a1.x) / L0;
      for (const t of [0.5, 0.4, 0.6, 0.3, 0.7]) {
        for (const off of [0, 1, -1]) {
          const px0 = a1.x + (a2.x - a1.x) * t, py0 = a1.y + (a2.y - a1.y) * t;
          const d = off ? (Math.abs(nx) * W0 / 2 + Math.abs(ny) * H0 / 2 + F * 0.4) * off : 0;
          const b = {x: px0 + nx * d - W0 / 2, y: py0 + ny * d - H0 / 2, w: W0, h: H0};
          if (!insideBox(b, sbox, 0) || capObst.some(ob => overlaps(b, ob, 4))) continue;
          cap = {box: b, text, at: t, off, fit: c0.fit};
          break;
        }
        if (cap) break;
      }
      if (!cap) {
        // (no place on or just beside the line's longest run: the free place nearest to the link, within 1.2 lines of
        // it, anywhere along it)
        const dSeg = (b) => Math.min(...segs.map(q => {
          let best = Infinity;
          for (let i = 0; i <= 24; i++) { const t = i / 24, x = q.a.x + (q.b.x - q.a.x) * t, y = q.a.y + (q.b.y - q.a.y) * t; best = Math.min(best, Math.hypot(Math.max(b.x - x, 0, x - (b.x + b.w)), Math.max(b.y - y, 0, y - (b.y + b.h)))); }
          return best;
        }));
        const mid = {x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2};
        const cands = [];
        for (let y = sbox.y; y + H0 <= sbox.y + sbox.h; y += 8) for (let x = sbox.x; x + W0 <= sbox.x + sbox.w; x += 8) {
          const b = {x, y, w: W0, h: H0};
          cands.push({b, d: Math.hypot(x + W0 / 2 - mid.x, y + H0 / 2 - mid.y)});
        }
        cands.sort((q1, q2) => q1.d - q2.d);
        for (const q of cands) {
          if (capObst.some(ob => overlaps(q.b, ob, 4))) continue;
          if (dSeg(q.b) > F * 1.2) continue;
          cap = {box: q.b, text, at: -1, off: 0, fit: c0.fit};
          break;
        }
      }
      if (!cap) why.push('linkCap');
    }
    link = {a: pts[0], b: pts[pts.length - 1], pts, cap, len};
  }
  const segHits = (a, b, box) => {
    // (a clearance of 8 around each text box; the last 4 % at the target end may touch the target's own rim)
    for (let i = 1; i < 48; i++) {
      const t = i / 48, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (t > 0.96) continue;
      if (x > box.x - 8 && x < box.x + box.w + 8 && y > box.y - 8 && y < box.y + box.h + 8) return true;
    }
    return false;
  };
  /** the shortest leader from the chip to an edge point of the target that crosses no text */
  const nearCross = (p1, p2) => {
    if (!G.cross) return false;
    const X = G.cross, dx = p2.x - p1.x, dy = p2.y - p1.y, L2 = dx * dx + dy * dy || 1;
    const t = clamp(((X.x - p1.x) * dx + (X.y - p1.y) * dy) / L2);
    return Math.hypot(X.x - (p1.x + dx * t), X.y - (p1.y + dy * t)) < F * 1.6;
  };
  const leaderFor = (b, tb, extra = []) => {
    const c = {x: b.x + b.w / 2, y: b.y + b.h / 2};
    const anchors = [nearestOn(tb, c), {x: tb.x, y: tb.y + tb.h / 2}, {x: tb.x + tb.w, y: tb.y + tb.h / 2}, {x: tb.x + tb.w / 2, y: tb.y}, {x: tb.x + tb.w / 2, y: tb.y + tb.h},
      {x: tb.x + 14, y: tb.y}, {x: tb.x + tb.w - 14, y: tb.y}, {x: tb.x + 14, y: tb.y + tb.h}, {x: tb.x + tb.w - 14, y: tb.y + tb.h},
      {x: tb.x + tb.w * 0.25, y: tb.y}, {x: tb.x + tb.w * 0.75, y: tb.y}, {x: tb.x + tb.w * 0.375, y: tb.y}, {x: tb.x + tb.w * 0.625, y: tb.y}];
    let best = null;
    for (const tp of anchors) {
      const fp = nearestOn(b, tp);
      const len = Math.hypot(tp.x - fp.x, tp.y - fp.y);
      const blocked = [...textBoxesAll, ...extra].some(xb => xb !== tb && !(Math.abs(xb.x - tb.x) < 1 && Math.abs(xb.y - tb.y) < 1) && !insideBox(tb, xb, -1) && segHits(fp, tp, xb));
      if (blocked) continue;
      // (a leader never passes through the routes' crossing: it would read as part of the journeys)
      if (nearCross(fp, tp)) continue;
      if (!best || len < best.len) best = {from: fp, to: tp, len};
    }
    return best;
  };
  if (link && link.cap) textBoxesAll.push(link.cap.box);
  const notes = band.placed.map(q => {
    const ch = chipOf(q.it, F, FL, q.maxW, q.x, q.y, q.it.name);
    const tb = q.it.kind === 'final' ? targetBox.final : q.it.kind === 'note' ? targetBox[q.it.target] : null;
    return {name: q.it.name, kind: q.it.kind, box: ch.box, node: ch.node, targetBox: tb};
  });
  if (pass !== 2) {
    // obstacles: people, racks with stands, names, strip (+ bracket), route corridors, band chips
    const obst = [figureBox(G.A), figureBox(G.B), {x: G.rackA.x, y: G.rackA.y, w: G.rackA.w, h: G.floorA - G.rackA.y}, {x: G.rackB.x, y: G.rackB.y, w: G.rackB.w, h: G.floorB - G.rackB.y},
      G.nA, G.nB, examBox || G.stripBox, ...cardsB, ...notes.map(n => n.box), link && link.cap ? link.cap.box : null].filter(Boolean);
    if (link) link.pts.slice(1).forEach((q, k) => { const p0 = link.pts[k]; for (let i = 0; i <= 20; i++) { const t = i / 20, x = p0.x + (q.x - p0.x) * t, y = p0.y + (q.y - p0.y) * t; obst.push({x: x - 6, y: y - 6, w: 12, h: 12}); } });
    for (const m of act) {
      const R = G.routes[m];
      for (let i = 0; i <= 40; i++) {
        const q = R.byLen(i / 40);
        obst.push({x: q.x - G.cw * fly / 2 - 4, y: q.y - G.ch * fly / 2 - 4, w: G.cw * fly + 8, h: G.ch * fly + 8});
      }
    }
    const maxW = Math.min(sbox.w * 0.5, 26 * F);
    for (const it of noteItems) {
      if (it.kind === 'key' || it.kind === 'concept') continue;
      const tb = it.kind === 'final' ? targetBox.final : targetBox[it.target];
      const c0 = chipOf(it, F, FL, maxW);
      const tc = {x: tb.x + tb.w / 2, y: tb.y + tb.h / 2};
      const W0 = c0.box.w, H0 = c0.box.h;
      const cands = [];
      // (anywhere in the whole box, the band's free ends included: the band's chips are obstacles)
      const reg = o.box;
      for (let y = reg.y; y + H0 <= reg.y + reg.h + 0.01; y += 14) {
        for (let x = reg.x; x + W0 <= reg.x + reg.w + 0.01; x += 14) {
          const b = {x, y, w: W0, h: H0};
          const gapD = Math.max(0, Math.max(tb.x - (x + W0), x - (tb.x + tb.w)), Math.max(tb.y - (y + H0), y - (tb.y + tb.h)));
          if (gapD > F * 40) continue;
          cands.push({b, gapD});
        }
      }
      cands.sort((q1, q2) => q1.gapD - q2.gapD);
      let pick = null;
      for (const q of cands) {
        if (obst.some(ob => overlaps(q.b, ob, 6))) continue;
        if (!leaderFor(q.b, tb, notes.map(n => n.box))) continue;
        pick = q.b;
        break;
      }
      if (!pick) { why.push(`place-${it.name}`); continue; }
      const ch = chipOf(it, F, FL, maxW, pick.x, pick.y, it.name);
      obst.push(ch.box);
      notes.push({name: it.name, kind: it.kind, box: ch.box, node: ch.node, targetBox: tb});
    }
  }
  // leaders: the shortest one that crosses no text (flagged when none is clear)
  for (const n of notes) {
    if (!n.targetBox) continue;
    const ld = leaderFor(n.box, n.targetBox, notes.filter(q => q !== n).map(q => q.box));
    if (!ld) {
      // no straight leader is clear: an elbow round the scene through the side margin (left, then right), from the
      // note's side down to the target's side — clear of every text and of the routes
      const others = notes.filter(q => q !== n).map(q => q.box);
      const clearSeg = (p1, p2) => ![...textBoxesAll, ...others].some(xb => xb !== n.targetBox && segHits(p1, p2, xb))
        && !nearCross(p1, p2);
      const tb = n.targetBox, nb = n.box;
      let elbow = null;
      for (const side of [-1, 1]) {
        const xm = side < 0 ? sbox.x + 3 : sbox.x + sbox.w - 3;
        const p0 = {x: side < 0 ? nb.x : nb.x + nb.w, y: nb.y + nb.h / 2};
        const p3 = {x: side < 0 ? tb.x : tb.x + tb.w, y: tb.y + Math.min(tb.h / 2, F)};
        const pts = [p0, {x: xm, y: p0.y}, {x: xm, y: p3.y}, p3];
        if ((side < 0 ? xm < p0.x && xm < p3.x : xm > p0.x && xm > p3.x) && pts.slice(1).every((q, k) => clearSeg(pts[k], q))) { elbow = pts; break; }
      }
      if (elbow) { n.lead = {from: elbow[0], to: elbow[3], pts: elbow}; continue; }
      why.push(`leader-${n.name}`); const tp = nearestOn(n.targetBox, {x: n.box.x + n.box.w / 2, y: n.box.y + n.box.h / 2}); n.lead = {from: nearestOn(n.box, tp), to: tp}; continue;
    }
    n.lead = ld;
  }
  return {notes, examBox, link, why, ok: why.length === 0};
}

/** The link's path drawn up to fraction f of its length (from the promise token's edge). */
export function linkPath(pts, f) {
  const segs = pts.slice(1).map((q, k) => Math.hypot(q.x - pts[k].x, q.y - pts[k].y));
  const tot = segs.reduce((a, b) => a + b, 0);
  let left = tot * clamp(f);
  const out = [pts[0]];
  for (let k = 0; k < segs.length && left > 1e-6; k++) {
    const q0 = pts[k], q1 = pts[k + 1];
    if (left >= segs[k]) { out.push(q1); left -= segs[k]; } else { const t = left / segs[k]; out.push({x: q0.x + (q1.x - q0.x) * t, y: q0.y + (q1.y - q0.y) * t}); left = 0; }
  }
  if (out.length === 1) out.push(pts[0]);
  return `M${out.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`;
}

/** Scene nodes (names carry the prefix). */
export function buildScene(ctx, L) {
  const th = ctx.theme;
  const G = L.G, P = L.P;
  const show = ctx.show('all');
  const plates = [];
  if (show && L.plates) {
    for (const [R, text, nm] of [[G.rackA, L.plates.outgoing, `${P}plateA`], [G.rackB, L.plates.incoming, `${P}plateB`]]) {
      if (!text) continue;
      const fit = fitW(text, {maxWidth: R.w - 24, size: L.FL, maxLines: 1, weight: 700});
      plates.push(g({name: nm}, textBlock(fit, {x: R.x + R.w / 2, y: R.y + G.gap * 0.6, anchor: 'middle', fill: INK})));
    }
  }
  const routes = L.active.map(m => h('path', {name: `${P}route-${m}`, d: G.routes[m].d, fill: 'none', stroke: msgColor(ctx, m), 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(G.routes[m].L + 2)} ${r(G.routes[m].L + 2)}`, 'stroke-dashoffset': r(G.routes[m].L + 2), opacity: 0.9}));
  // (the pending ring of a performance supplied as a question to be analysed travels with its token: a dashed outline
  // round the card, in the card's own coordinates)
  const openQ = L.linkStatus === 'to-analyse';
  const cards = L.active.map(m => {
    const c = messageCard(ctx, {name: `${P}card-${m[0]}`, kind: m, M: L.M, w: G.cw, h: G.ch}).node;
    if (m === 'response' && openQ) c.children.push(h('path', {name: `${P}pend`, d: roundRectPath(-G.cw / 2 - 9, -G.ch / 2 - 9, G.cw + 18, G.ch + 18, 14), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0}));
    return c;
  });
  const nameNodes = L.names.map((n, i) => {
    if (!n) return null;
    const nb = i ? G.nB : G.nA;
    return chipW(ctx, L.captions[i], {x: nb.x, y: nb.y, maxWidth: n.maxW, size: n.fit.size, maxLines: 2, weight: 600, name: `${P}name${i}`}).node;
  });
  const leaders = L.notes.filter(n => n.lead).map(n => (n.lead.pts
    ? h('path', {name: `${n.name}-lead`, d: `M${n.lead.pts.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0})
    : h('line', {name: `${n.name}-lead`, x1: r(n.lead.from.x), y1: r(n.lead.from.y), x2: r(n.lead.to.x), y2: r(n.lead.to.y), stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: 0})));
  // the link: a plain neutral line (dashed only when the supplied status is a question to be analysed), two small
  // anchor rings at the cards' edges, its caption chip; the pending ring round the performance token (dashed) with it
  let linkNodes = null, linkCap = null;
  if (L.link) {
    const lk = L.link, open = L.linkStatus === 'to-analyse';
    const dash = open ? {'stroke-dasharray': '12 9'} : {};
    linkNodes = g({name: `${P}link`, opacity: 0},
      h('path', {name: `${P}link-p`, d: linkPath(lk.pts, 0), fill: 'none', stroke: INK, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...dash}),
      h('circle', {name: `${P}link-a`, cx: r(lk.a.x), cy: r(lk.a.y), r: 7, fill: th.card, stroke: INK, 'stroke-width': 3}),
      h('circle', {name: `${P}link-b`, cx: r(lk.b.x), cy: r(lk.b.y), r: 7, fill: th.card, stroke: INK, 'stroke-width': 3, opacity: 0}));
    if (lk.cap) linkCap = chipW(ctx, lk.cap.text, {x: lk.cap.box.x, y: lk.cap.box.y, maxWidth: lk.cap.box.w, fit: lk.cap.fit, size: L.F, maxLines: 3, weight: 700, stroke: th.inkSoft, name: `${P}link-cap`, opacity: 0}).node;
  }
  const exam = L.examBox ? h('path', {name: `${P}exam`, d: roundRectPath(L.examBox.x, L.examBox.y, L.examBox.w, L.examBox.h, 14), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0}) : null;
  return g({name: `${P}scene`},
    rackArt(ctx, {name: `${P}rackA`, ...G.rackA, slots: G.slotsA, floorY: G.floorA}),
    rackArt(ctx, {name: `${P}rackB`, ...G.rackB, slots: G.slotsB, floorY: G.floorB}),
    plates,
    L.stripOutside ? null : L.strip.node,
    exam,
    routes,
    L.rigs[0].node, L.rigs[1].node,
    nameNodes,
    leaders,
    L.notes.map(n => n.node),
    linkNodes,
    cards,
    linkCap,
  );
}

/**
 * Pose the scene at action time `a` (pure). hold: {u, done, final:[a,b], key:[a,b], notes:[a,b]} fades the hold
 * notes; o.strip = [a,b] window of the strip title.
 */
export function poseScene(ctx, L, a, o = {}) {
  const G = L.G, P = L.P;
  const FLY = L.fly;
  const nodes = {};
  const k = G.k;
  const cardState = {};
  const grabsA = [], grabsB = [];
  const cardAt = (m, t) => {
    const sm = L.sched.msgs[m];
    const fl = L.flights[m];
    const at = G.cardAt[m];
    const R = G.routes[m];
    const Ts = sm.moveAt, Tr = sm.recvAt;
    // (a message with no supplied event rests face up in its slot)
    if (fl.still) return {pos: {x: at.a.x, y: at.a.y}, sc: 1, turn: 0, where: 'A', pr: 0};
    // the sender slides the card sideways out of its slot (never up into the plate), lets go, and it turns to its back
    const lift = G.cw * SLIDE * G.slide[m];
    if (t < fl.t0) {
      const lf = seg(t, Ts - 0.035, Ts - 0.012);
      return {pos: {x: at.a.x + lift * ease.inOutSine(lf), y: at.a.y}, sc: 1, turn: seg(t, Ts - 0.012, Ts), where: 'A', pr: 0};
    }
    const pr = flightProgress(t, fl.t0, fl.t1, fl.gamma) * fl.stop;
    if (Tr !== null && t >= fl.t1) {
      return {pos: {x: at.b.x, y: at.b.y}, sc: lerp(FLY, 1, ease.inOutSine(seg(t, fl.t1, Tr - 0.005))), turn: 1 - seg(t, Tr - 0.005, Tr + 0.03), where: 'B', pr: 1};
    }
    const q = R.byLen(pr);
    const liftLeft = lift * (1 - clamp(pr / 0.2));
    return {pos: {x: q.x + liftLeft, y: q.y}, sc: lerp(1, FLY, clamp(pr / 0.12)), turn: 1, where: 'route', pr};
  };
  const edge = (st, side) => {
    const sx = st.turn > 0 && st.turn < 1 ? turnFace(st.turn).sy : 1;
    return {x: st.pos.x + side * (G.cw / 2 * sx * st.sc - 16 * st.sc), y: st.pos.y};
  };
  // A's hand works on A's side of the card (left), B's on B's side (right in 'row', left in 'stack')
  const sideOfB = G.sideB === -1 ? 1 : -1;
  const grabs = {A: grabsA, B: grabsB};
  for (const m of MSGS) {
    const sm = L.sched.msgs[m];
    const R = G.routes[m];
    const st = cardAt(m, a);
    cardState[m] = st;
    // (a commitment with no supplied event is not drawn: no card, no route, no hand)
    if (!L.active.includes(m)) continue;
    const from = m === 'proposal' ? 'A' : 'B', to = m === 'proposal' ? 'B' : 'A';
    const sideFrom = from === 'A' ? -1 : sideOfB;
    if (sm.moveAt !== null) grabs[from].push({t0: sm.moveAt - 0.075, t1: sm.moveAt - 0.035, t2: sm.moveAt - 0.012, t3: sm.moveAt + 0.04, grip: t => edge(cardAt(m, Math.min(t, sm.moveAt - 0.012)), sideFrom)});
    if (sm.recvAt !== null) grabs[to].push({t0: sm.recvAt - 0.07, t1: sm.recvAt - 0.02, t2: sm.recvAt + 0.03, t3: sm.recvAt + 0.08, grip: () => (to === 'B' ? G.gripB(G.cardAt[m].b) : G.gripA(G.cardAt[m].b))});
    const n = `${P}card-${m[0]}`;
    const face = st.turn < 0.5;
    const tf = turnFace(st.turn);
    nodes[n] = {transform: T(st.pos.x, st.pos.y, 0, r(st.sc, 4))};
    nodes[`${n}-in`] = {transform: st.turn > 0 && st.turn < 1 ? `scale(${r(tf.sy, 3)} 1)` : ''};
    nodes[`${n}-face`] = {opacity: face ? 1 : 0};
    nodes[`${n}-back`] = {opacity: face ? 0 : 1};
    // printed text only at full size, and while the turn keeps it wide enough
    const txt = face && st.sc > 0.999 ? tf.text : 0;
    nodes[`${n}-txt`] = {opacity: r(txt, 3)};
    nodes[`${n}-hd`] = {opacity: r(txt, 3)};
    const shown = st.where === 'A' ? 0 : st.where === 'B' ? 1 : st.pr;
    nodes[`${P}route-${m}`] = {'stroke-dashoffset': r((R.L + 2) * (1 - shown), 1), opacity: 0.9};
  }
  const restHands = [G.A, G.B].map((fg, i) => L.rigs[i].frame({x: fg.x, y: fg.floor, facing: fg.f, scale: k}).hands.near);
  const handOf = (list, restP) => {
    let pt = null;
    for (const gb of list) {
      if (a < gb.t0 || a > gb.t3) continue;
      if (a < gb.t1) pt = mix(restP, gb.grip(gb.t1), ease.inOutSine(seg(a, gb.t0, gb.t1)));
      else if (a < gb.t2) pt = gb.grip(a);
      else pt = mix(gb.grip(gb.t2), restP, ease.inOutSine(seg(a, gb.t2, gb.t3)));
    }
    return pt;
  };
  const hA = handOf(grabsA, restHands[0]), hB = handOf(grabsB, restHands[1]);
  const flying = L.active.some(m => cardState[m].where === 'route');
  const posedA = L.rigs[0].frame({x: G.A.x, y: G.A.floor, facing: 1, scale: k, near: hA, headTilt: flying ? -5 : 5});
  const posedB = L.rigs[1].frame({x: G.B.x, y: G.B.floor, facing: G.B.f, scale: k, near: hB, headTilt: flying ? -5 : 5});
  Object.assign(nodes, posedA.nodes, posedB.nodes);
  const sw = o.strip ?? [L.sched.times[0] - 0.12, L.sched.times[0] - 0.08];
  const stripIn = seg(a, sw[0], sw[1]);
  L.strip.stations.forEach((st, i) => {
    const T0 = L.sched.times[i];
    st.evNodes.forEach((e, j) => { nodes[`${P}seq-s${i}-e${j}`] = {opacity: r(seg(a, T0 - 0.005, T0 + 0.025), 3)}; });
    if (L.stations[i].grouped) {
      nodes[`${P}seq-s${i}-br`] = {opacity: r(seg(a, T0 + 0.02, T0 + 0.05), 3)};
      if (ctx.show('all')) nodes[`${P}seq-s${i}-tag`] = {opacity: r(seg(a, T0 + 0.03, T0 + 0.06), 3)};
    }
  });

  // the link draws itself from the promise token to the performance token once the link station is reached; the
  // journeys' trails thin out as it does (they stay faintly as a record)
  let linkDrawn = 0;
  if (L.link && L.sched.linkAt !== null) {
    const T0 = L.sched.linkAt;
    linkDrawn = ease.inOutSine(seg(a, T0 - 0.005, T0 + 0.04));
    nodes[`${P}link`] = {opacity: linkDrawn > 0 ? 1 : 0};
    nodes[`${P}link-p`] = {d: linkPath(L.link.pts, linkDrawn)};
    nodes[`${P}link-b`] = {opacity: linkDrawn >= 1 ? 1 : 0};
    if (L.link.cap) nodes[`${P}link-cap`] = {opacity: r(seg(a, T0 + 0.035, T0 + 0.06), 3)};
    if (L.linkStatus === 'to-analyse') nodes[`${P}pend`] = {opacity: r(seg(a, T0 + 0.035, T0 + 0.06), 3)};
    for (const m of L.active) { const rn = nodes[`${P}route-${m}`]; if (rn) rn.opacity = r(lerp(0.9, 0.22, seg(a, T0 - 0.02, T0 + 0.02)), 3); }
  }
  const hold = o.hold || {};
  const done = hold.done ?? true;
  const u = hold.u ?? a;
  const fin = done && hold.final ? seg(u, ...hold.final) : 0;
  if (L.examBox) nodes[`${P}exam`] = {opacity: r(fin, 3)};
  if (L.strip.finalBox) nodes[`${P}seq-final`] = {opacity: r(fin, 3)};
  for (const n of L.notes) {
    // (the concept label, as supplied and illustrative, is there from the rest: it names what the scene illustrates)
    const op = n.kind === 'concept' ? 1 : n.kind === 'key' ? (done && hold.key ? seg(u, ...hold.key) : 0) : n.kind === 'final' ? fin : done && hold.notes ? seg(u, ...hold.notes) : 0;
    nodes[n.name] = {opacity: r(op, 3)};
    if (n.lead) nodes[`${n.name}-lead`] = {opacity: r(op, 3)};
  }
  const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
  return {
    nodes,
    sem: {
      cardP: P2(cardState.proposal.pos), cardR: P2(cardState.response.pos),
      whereP: cardState.proposal.where, whereR: cardState.response.where,
      configuration: L.configuration, active: L.active,
      handA: P2(posedA.hands.near), handB: P2(posedB.hands.near),
      allReached: posedA.reached && posedB.reached,
      stationsShown: L.sched.times.filter(t => a >= t + 0.025).length,
      order: L.stations.map(s => s.events.map(e => e.event).join('+')),
      grouped: L.stations.some(s => s.grouped),
      finalShown: r(fin, 3),
      linkDrawn: r(linkDrawn, 3), linkStatus: L.link ? L.linkStatus : null,
    },
    cardState,
  };
}

/* ======================================================================== */
/* Spanish defaults                                                         */
/* ======================================================================== */

/**
 * Wrap a scene so that, with locale 'es', every top-level parameter still equal to the English default is replaced
 * by its Spanish default (supplied values are never replaced). Other locales are untouched.
 */
export function localizeScene(scene, defaults, es) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const cache = new WeakMap();
  const view = ctx => {
    const p = ctx.params;
    if (!p || p.locale !== 'es') return ctx;
    let c = cache.get(ctx);
    if (c) return c;
    const q = {...p};
    let changed = false;
    for (const [key, v] of Object.entries(es)) if (key in defaults && same(p[key], defaults[key]) && !same(p[key], v)) { q[key] = v; changed = true; }
    c = changed ? {...ctx, params: q} : ctx;
    cache.set(ctx, c);
    return c;
  };
  return {
    ...scene,
    layout: (ctx, ...a) => scene.layout(view(ctx), ...a),
    build: (ctx, ...a) => scene.build(view(ctx), ...a),
    frame: (ctx, ...a) => scene.frame(view(ctx), ...a),
  };
}
