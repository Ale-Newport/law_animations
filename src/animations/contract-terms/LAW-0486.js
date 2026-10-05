/**
 * LAW-0486 — Término definido · mechanism
 *
 * Storyboard (a time-lane diagram: Party A's lane and Party B's lane, the supplied order running along both):
 *  0.00–0.18  separate: the parts take their places — the two parties (portraits heading their lanes), the lanes and
 *             the two documents (● Party A's definitions sheet, the placeholder definition slip in the dock at its
 *             foot; ◆ Party B's contract, its layers behind it, its own dock empty and its row — the word and its clause
 *             — under a cover sheet), at equal weight.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one (each document's line from its sender's lane
 *             to the other lane; plain relations carry no arrowhead; nothing causal unless supplied); then, with the
 *             supplied configuration "defined term", the definition slip passes from the sheet's dock into the
 *             contract's dock; with "term with no linked definition" it stays where it is. The contract is unfolded:
 *             its cover lifts and its row shows, the word underlined.
 *  0.43–0.75  the thread draws from the word's row node to the definition slip in the contract's dock (only when the
 *             slip lies there); a tracer follows the supplied traversal order along the drawn relationships; the focus
 *             element swells.
 *  0.75–1.00  gather: everything stays in view; the supplied configuration ("Defined term (as supplied)" or "Term with
 *             no linked definition (as supplied)", neutral and of equal weight) beside the key "As supplied · no
 *             conclusion drawn".
 * No interpretation rule (no contra proferentem, no plain meaning, no canon of construction) and no conclusion about
 * what the word means; the word is generic and fictional, the definition and the clause are placeholders; no
 * jurisdiction. Adapted from LAW-0482 (copied).
 * @module animations/contract-terms/LAW-0486
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {mechanismFields, obj, oneOf, str, int, list} from '../../schemas/fields.js';
import {textBlock, connector, tracer} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, poseLink, poseThread, stationsOf, measureCards, messageCard, glyph, msgColor, fitW, chipW,
  overlaps, insideBox, unionBox, nearestOn, INK, MSGS, evName, EVENTS, foldOf, FINAL_STATES, placementOf, dockGeom, slipArt, chipG,
  localizeScene,
} from './kits/termino-definido.js';

const ID = 'LAW-0486';
const DURATION = 7000;
// (the element ids a user supplies; inside, the scene works with its own: see toInner)
const ELEMENTS = ['partyA', 'partyB', 'sheet', 'contract'];
const INNER = {partyA: 'offeror', partyB: 'offeree', sheet: 'proposal', contract: 'response'};
// (the lanes carry the documents' journeys; the definition slip passes between the documents themselves, not as a lane
// event)
const LANE_EVENTS = EVENTS.filter(e => e !== 'term-station');
/** The definition slip's passage (with the supplied configuration "defined term"): after the relationships are drawn. */
const SLIP = {fadeOut: [0.35, 0.365], move: [0.365, 0.42], fadeIn: [0.42, 0.435]};
/** The thread from the word to the definition slip: once the contract is unfolded (0.40–0.44) and its row shown. */
const THREAD = [0.46, 0.5];
const OUTER = Object.fromEntries(Object.entries(INNER).map(([k, v]) => [v, k]));
const W = {separate: [0.02, 0.17], relate: [0.18, 0.43], trace: [0.45, 0.74], gather: [0.76, 0.88], key: [0.88, 0.93]};

const STRINGS = {
  en: {...KIT_STRINGS.en, kinds: {relation: 'relation', communication: 'communication', sequence: 'sequence (as supplied)', causal: 'causal (as supplied)'}},
  es: {...KIT_STRINGS.es, kinds: {relation: 'relación', communication: 'comunicación', sequence: 'secuencia (según lo aportado)', causal: 'causal (según lo aportado)'}},
};

const sceneSchema = {
  ...motifFields,
  sequence: list('The documents\' journeys as supplied: sent and received events in the order shown (1–4). The order is depicted, never resolved', obj('One event of the supplied sequence (fictional time labels, never computed or compared)', {
    event: oneOf('Which event', LANE_EVENTS),
    time: str('Fictional time label as supplied, e.g. "Day 3, 10:00 (fictional)"', 40),
    position: int('Optional position in the supplied order (1 = first). Events given the same position are shown together, order to be examined', 1, 4),
  }, ['event', 'time']), 1, 4),
  ...mechanismFields(ELEMENTS),
  status: oneOf('Configuration supplied: term-defined (the definition slip passes into the contract\'s dock and, once the contract is unfolded, a thread links the word to it) or term-unlinked (the slip stays in the definitions sheet\'s dock; no thread); shown at the gather beside the key. Neutral, of equal weight; nothing is concluded from either', FINAL_STATES),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  sequence: DEFAULT_CONTENT.sequence.filter(e => e.event !== 'term-station'),
  elements: [
    {id: 'partyA', label: 'Passes sheet DS-801'},
    {id: 'partyB', label: 'Holds contract CT-802'},
    {id: 'sheet', label: 'Sheet A'},
    {id: 'contract', label: 'Contract B'},
  ],
  relationships: [
    {from: 'partyA', to: 'sheet', kind: 'communication'},
    {from: 'sheet', to: 'partyB', kind: 'communication'},
    {from: 'partyB', to: 'contract', kind: 'communication'},
    {from: 'contract', to: 'partyA', kind: 'communication'},
  ],
  focusElement: 'contract',
  relationLabels: {relation: 'relation (as supplied)', communication: 'communication', sequence: 'sequence (as supplied)', causal: 'causal (as supplied)'},
  traversalOrder: ['partyA', 'sheet', 'partyB', 'contract', 'partyA'],
  status: 'term-defined',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  sequence: DEFAULT_CONTENT_ES.sequence.filter(e => e.event !== 'term-station'),
  elements: [
    {id: 'partyA', label: 'Pasa la hoja HD-801'},
    {id: 'partyB', label: 'Tiene el contrato CT-802'},
    {id: 'sheet', label: 'Hoja A'},
    {id: 'contract', label: 'Contrato B'},
  ],
  relationLabels: {relation: 'relación (según lo aportado)', communication: 'comunicación', sequence: 'secuencia (según lo aportado)', causal: 'causal (según lo aportado)'},
};

/** The scene works with its own element ids; the supplied ones are translated in, and the visiting order back out. */
function toInner(scene) {
  const cache = new WeakMap();
  const view = ctx => {
    let c = cache.get(ctx);
    if (c) return c;
    const p = ctx.params;
    const q = {...p,
      elements: p.elements.map(e => ({...e, id: INNER[e.id] ?? e.id})),
      relationships: p.relationships.map(r0 => ({...r0, from: INNER[r0.from] ?? r0.from, to: INNER[r0.to] ?? r0.to})),
      focusElement: INNER[p.focusElement] ?? p.focusElement,
      traversalOrder: p.traversalOrder.map(id => INNER[id] ?? id)};
    c = {...ctx, params: q};
    cache.set(ctx, c);
    return c;
  };
  return {
    ...scene,
    layout: (ctx, ...a) => scene.layout(view(ctx), ...a),
    build: (ctx, ...a) => scene.build(view(ctx), ...a),
    frame: (ctx, ...a) => {
      const f = scene.frame(view(ctx), ...a);
      if (f.semantic && f.semantic.visitOrder) f.semantic.visitOrder = f.semantic.visitOrder.map(id => OUTER[id] ?? id);
      return f;
    },
  };
}

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isParty = id => id === 'offeror' || id === 'offeree';
const segLen = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const lineAt = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
/** distance from point q to segment ab */
function distSeg(q, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L2 = dx * dx + dy * dy || 1;
  const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / L2);
  return Math.hypot(q.x - (a.x + dx * t), q.y - (a.y + dy * t));
}
function distBoxSeg(b, a, c) {
  const pts = [{x: b.x, y: b.y}, {x: b.x + b.w, y: b.y}, {x: b.x, y: b.y + b.h}, {x: b.x + b.w, y: b.y + b.h}, {x: b.x + b.w / 2, y: b.y + b.h / 2}];
  return Math.min(...pts.map(q => distSeg(q, a, c)));
}
function segHitsBox(a, b, box, pad = 0) {
  for (let i = 0; i <= 40; i++) {
    const q = lineAt(a, b, i / 40);
    if (q.x > box.x - pad && q.x < box.x + box.w + pad && q.y > box.y - pad && q.y < box.y + box.h + pad) return true;
  }
  return false;
}

/** Intersection point of segments ab and cd, or null. */
function segX(a, b, c, d) {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
  const v = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
  return t > 1e-6 && t < 1 - 1e-6 && v > 1e-6 && v < 1 - 1e-6 ? lineAt(a, b, t) : null;
}
/** First crossing of two polylines, or null. */
function polyX(P, Q) {
  for (let i = 0; i < P.length - 1; i++) for (let j = 0; j < Q.length - 1; j++) { const x = segX(P[i], P[i + 1], Q[j], Q[j + 1]); if (x) return x; }
  return null;
}

/** One attempt at text size px. */
function compose(ctx, p, o) {
  const th = ctx.theme;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const {upx, px, innerF, stations} = o;
  const F = px.F / upx, FL = px.L / upx;
  const why = [];
  const box = {x: 6, y: 4, w: D.w - 12, h: D.h - 8};
  const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
  // ---- cards (the message's own name comes from its element label)
  const M = measureCards(ctx, p, {F, inner: innerF * F, maxLines: 3, kindLabel: {proposal: label('proposal'), response: label('response')}, holderLine: false});
  if (M.bad) { if (!o.force) return null; why.push('fit'); }
  const cw = M.w, ch = M.h;
  // ---- events: each on its party's lane (0 = A, 1 = B); the milestone has no lane tick — a rule joins the lanes at
  // its row — and its time chip sits on the outer side of B's lane (A's when B has an event in that row)
  const events = [];
  stations.forEach((st, i) => st.events.forEach(ev => events.push({...ev, row: i, grouped: st.grouped})));
  const mRow = (events.find(e => e.msg === 'milestone') || {}).row ?? -1;
  for (const ev of events) {
    if (ev.msg === 'milestone') continue;
    ev.lane = (ev.msg === 'proposal') === (ev.verb === 'sent') ? 0 : 1;
  }
  // (the milestone's chip goes to the side with no event in its row; with both free, the side whose neighbouring rows
  // carry fewer chips — B's side on a tie)
  for (const ev of events) {
    if (ev.msg !== 'milestone') continue;
    const busy = ln => events.some(e => e.row === ev.row && e.lane === ln);
    const near = ln => events.filter(e => e.lane === ln && Math.abs(e.row - ev.row) === 1).length;
    ev.lane = busy(1) && !busy(0) ? 0 : busy(0) && !busy(1) ? 1 : near(0) < near(1) ? 0 : 1;
  }
  // (glued: a time keeps its unit — "10:00 h" — on one line)
  const chipOf = (text, maxW) => chipG(ctx, text, {x: 0, y: 0, maxWidth: maxW, size: F, maxLines: 2, weight: 600, stroke: th.inkSoft});
  const tMaxW = Math.min(box.w * 0.24, (o.tF ?? 13) * F);
  // (events supplied with one position, and the milestone: their time chips carry the ●/◆/dial cue)
  const cueW = F * 1.25;
  const times = events.map(ev => {
    if (ev.msg === 'milestone') {
      // the milestone's chip: the clock's caption (its element label, a key label) over the supplied time label
      if (!showKey) return null;
      const head = label('clock') ? fitW(label('clock'), {maxWidth: tMaxW - cueW - F * 0.9, size: FL, maxLines: 3, weight: 700}) : null;
      const tl = show ? fitW(ev.time, {maxWidth: tMaxW - cueW - F * 0.9, size: F, maxLines: 2, weight: 600}) : null;
      const w = Math.max(head ? head.width : 0, tl ? tl.width : 0) + F * 0.9 + cueW;
      const hh = (head ? head.height : 0) + (tl ? tl.height : 0) + (head && tl ? F * 0.2 : 0) + F * 0.5;
      return {fit: {bad: Boolean((head && head.bad) || (tl && tl.bad)), size: F}, head, tl, box: {x: 0, y: 0, w, h: hh}, cue: true, ms: true};
    }
    if (!show) return null;
    const cue = ev.grouped;
    const c = chipOf(ev.time, cue ? tMaxW - cueW : tMaxW);
    return cue ? {...c, box: {...c.box, w: c.box.w + cueW}, cue: true} : c;
  });
  if (times.some(c => c && c.fit.bad)) { if (!o.force) return null; why.push('fit'); }
  const sideW = Math.max(...times.map(c => (c ? c.box.w : 0)), 0);
  const Rb = o.Rb;
  const Rc = 0;
  const names = [0, 1].map(i => (showKey ? chipW(ctx, `${p.parties[i].name} · ${label(i ? 'offeree' : 'offeror')}`, {x: 0, y: 0, maxWidth: Math.min(box.w * 0.42, 22 * FL), size: FL, maxLines: 2, weight: 600}) : null));
  if (names.some(n => n && n.fit.bad)) { if (!o.force) return null; why.push('fit'); }
  // (the clock's caption — its element label, "Milestone as supplied (illustrative)" by default — is the caption of
  // the milestone's rule, placed like a connector's caption next to it; the dial itself carries no chip)
  const clockC = null;
  const seqT = show ? fitW(ctx.t.seqTitle, {maxWidth: box.w * 0.5, size: F, maxLines: 2, weight: 700}) : null;
  // the footer: the supplied configuration (either one, the same chip) and the key — side by side when they fit, else
  // stacked
  const keyC = (() => {
    if (!showKey) return null;
    const kc = chipW(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: Math.min(box.w * 0.6, 30 * FL), size: FL, maxLines: 2, weight: 600, stroke: th.inkSoft});
    const cc = FINAL_STATES.includes(p.status) ? chipW(ctx, ctx.t[p.status], {x: 0, y: 0, maxWidth: Math.min(box.w * 0.94, 34 * FL), size: FL, maxLines: 2, weight: 700, stroke: th.inkSoft}) : null;
    if (!cc) return {box: kc.box, fit: kc.fit, kc, cc: null, side: true};
    const side = kc.box.w + cc.box.w + F <= box.w * 0.96;
    const w = side ? kc.box.w + cc.box.w + F : Math.max(kc.box.w, cc.box.w), h0 = side ? Math.max(kc.box.h, cc.box.h) : kc.box.h + cc.box.h + F * 0.4;
    return {box: {w, h: h0}, fit: kc.fit, kc, cc, side, bad: kc.fit.bad || cc.fit.bad};
  })();
  if (keyC && keyC.bad) { if (!o.force) return null; why.push('fit'); }
  const toExam = show && stations.some(s => s.grouped) ? fitW(ctx.t.toExamine, {maxWidth: tMaxW, size: F, maxLines: 2, weight: 700}) : null;
  // ---- lanes: 'v' = A's lane on the left, B's on the right, the order running down;
  //             'h' = A's lane on top, B's below, the order running to the right
  const tickR = F * 0.55;
  const nameH = Math.max(...names.map(n => (n ? n.box.h : 0)), 0);
  const timeH = Math.max(...times.map(c => (c ? c.box.h : 0)), 0);
  const n = stations.length;
  const keyH = keyC ? keyC.box.h + F * 0.8 : 0;
  let laneStart, lanes, badges, nameBoxes, evAt, rowAt, laneBoxes, seqBox0, center, dial, clockBox = null, stagger = false;
  if (o.orient === 'v') {
    // (each lane keeps only the room its own chips need: a row's chips of one position sit side by side)
    const sideOf = ln => Math.max(0, ...stations.map((_, i) => {
      const js = events.map((e, j) => (e.row === i && e.lane === ln && times[j] ? j : -1)).filter(j => j >= 0);
      const ticks = events.filter(e => e.row === i && e.lane === ln && e.msg !== 'milestone').length;
      return js.reduce((a, j) => a + times[j].box.w, 0) + F * 0.4 * Math.max(0, js.length - 1) + (ticks >= 2 ? tickR * 1.4 : 0);
    }));
    const xA = box.x + Math.max(Rb + 2, sideOf(0) + tickR + F * 0.8);
    const xB = box.x + box.w - Math.max(Rb + 2, sideOf(1) + tickR + F * 0.8);
    // (the cards' own placement keeps them clear of both lanes; this only rules out a band narrower than a card)
    if (xB - xA < cw + F * 3) why.push('narrow');
    const bY = box.y + Rb;
    const top = bY + Rb + (nameH ? nameH + F * 0.5 : F * 0.4);
    // the sequence title above the key, at the foot of the lanes
    const seqH = seqT ? seqT.height + F * 0.5 : 0;
    const bottom = box.y + box.h - keyH - seqH - F * 0.2;
    // (each row as tall as its own chips: neighbouring rows keep their chips apart)
    const rowH = stations.map((_, i) => Math.max(F * 1.6, ...events.map((e, j) => (e.row === i && times[j] ? times[j].box.h : 0))));
    const r0 = top + rowH[0] / 2 + F, r1 = bottom - rowH[n - 1] / 2 - F;
    // (only chips on the same side of the diagram can meet: each lane's chips keep apart from their neighbours)
    // (a row of one position also carries its bracket and its "order to be examined" label under it)
    const examH = (i, ln) => (toExam && events.some(e => e.row === i && e.lane === ln && e.grouped) ? (toExam.height + F * 0.3 + 10) * 2 : 0);
    const laneH = (i, ln) => Math.max(0, ...events.map((e, j) => (e.row === i && e.lane === ln && times[j] ? times[j].box.h + examH(i, ln) : 0)));
    const needP = Math.max(ch * 0.5, F * 1.6, ...rowH.slice(1).flatMap((_, i) => [0, 1].map(ln => (laneH(i, ln) && laneH(i + 1, ln) ? (laneH(i, ln) + laneH(i + 1, ln)) / 2 + F * 0.6 : 0))));
    if (r1 - r0 < needP * (n - 1)) why.push('rows');
    rowAt = i => (n <= 1 ? (r0 + r1) / 2 : lerp(r0, r1, i / (n - 1)));
    evAt = ev => ({x: ev.lane ? xB : xA, y: rowAt(ev.row)});
    lanes = [{a: {x: xA, y: bY + Rb}, b: {x: xA, y: bottom}}, {a: {x: xB, y: bY + Rb}, b: {x: xB, y: bottom}}];
    laneStart = [{x: xA, y: top}, {x: xB, y: top}];
    badges = [{x: xA, y: bY}, {x: xB, y: bY}];
    nameBoxes = names.map((nm, i) => (nm ? {x: clamp((i ? xB : xA) - nm.box.w / 2, box.x, box.x + box.w - nm.box.w), y: bY + Rb + F * 0.3, w: nm.box.w, h: nm.box.h} : null));
    laneBoxes = [{x: xA - 3, y: top, w: 6, h: bottom - top}, {x: xB - 3, y: top, w: 6, h: bottom - top}];
    seqBox0 = seqT ? {x: (xA + xB) / 2 - seqT.width / 2, y: bottom + F * 0.3, w: seqT.width, h: seqT.height} : null;
    center = {x: (xA + xB) / 2, y: (top + bottom) / 2};
  } else {
    // A's badge at the start of the top lane with A's name above it; B's badge at the start of the bottom lane with
    // B's name below it (both outside the band the message lines cross)
    const nA = names[0] ? names[0].box : {w: 0, h: 0}, nB = names[1] ? names[1].box : {w: 0, h: 0};
    const topRow = Math.max(nA.h ? nA.h + F * 0.3 : 0, seqT ? seqT.height + F * 0.3 : 0);
    const colW = Rb * 2;
    // neighbouring chips on one lane stagger outward when the columns are closer than a chip
    const colPitch = (box.w - colW - sideW * 2) / Math.max(1, n - 1);
    stagger = colPitch < sideW + F;
    const chipBand = timeH * (stagger ? 2 : 1) + (stagger ? F * 0.4 : 0) + tickR + F * 0.6;
    const yA = box.y + topRow + Math.max(Rb, chipBand) + 2;
    const yB = box.y + box.h - keyH - Math.max(Rb + (nB.h ? nB.h + F * 0.3 : 0), chipBand) - 2;
    // (a band too low for the two cards shows up as a failed card placement below: every card box must clear both lanes)
    if (yB - yA < ch + F * 7.8) why.push('band');
    const c0 = Math.max(box.x + Math.max(Rb * 2, colW) + F * 1.5 + tickR, box.x + Math.max(nA.w, nB.w) + F - sideW / 2), c1 = box.x + box.w - Math.max(sideW / 2, tickR) - F;
    rowAt = i => (n <= 1 ? (c0 + c1) / 2 : lerp(c0 + sideW / 2, c1 - sideW / 2, i / (n - 1)));
    // (only chips on the same lane can meet: checked on the chips themselves below)
    if (c1 - c0 < sideW * 1.5) why.push('rows');
    evAt = ev => ({x: rowAt(ev.row), y: ev.lane ? yB : yA});
    lanes = [{a: {x: box.x + Rb * 2, y: yA}, b: {x: c1 + F, y: yA}}, {a: {x: box.x + Rb * 2, y: yB}, b: {x: c1 + F, y: yB}}];
    laneStart = [lanes[0].a, lanes[1].a];
    badges = [{x: box.x + Rb, y: yA}, {x: box.x + Rb, y: yB}];
    nameBoxes = names.map((nm, i) => (nm ? {x: box.x, y: i ? yB + Rb + F * 0.3 : yA - Rb - F * 0.3 - nm.box.h, w: nm.box.w, h: nm.box.h} : null));
    laneBoxes = [{x: box.x + Rb * 2, y: yA - 3, w: c1 - box.x - Rb * 2, h: 6}, {x: box.x + Rb * 2, y: yB - 3, w: c1 - box.x - Rb * 2, h: 6}];
    seqBox0 = seqT ? {x: box.x + (nA.w ? nA.w + F * 1.5 : Rb * 2 + F), y: box.y, w: seqT.width, h: seqT.height} : null;
    if (seqBox0 && seqBox0.x + seqBox0.w > box.x + box.w) why.push('seqTitle');
    center = {x: (c0 + c1) / 2, y: (yA + yB) / 2};
  }
  const dialBox = null;
  // the milestone's rule: a solid line joining the two lanes at the milestone's row (no tick of its own)
  const rule = mRow >= 0 ? (o.orient === 'v' ? {a: {x: lanes[0].a.x, y: rowAt(mRow)}, b: {x: lanes[1].a.x, y: rowAt(mRow)}} : {a: {x: rowAt(mRow), y: lanes[0].a.y}, b: {x: rowAt(mRow), y: lanes[1].a.y}}) : null;
  const ruleBox = rule ? {x: Math.min(rule.a.x, rule.b.x) - 3, y: Math.min(rule.a.y, rule.b.y) - 3, w: Math.abs(rule.b.x - rule.a.x) + 6, h: Math.abs(rule.b.y - rule.a.y) + 6} : null;
  // events supplied with one position share the station: their ●/◆ ticks sit ACROSS the lane at the identical time
  // position (one each side of the lane line, the same weight), so their placement implies no order between them
  {
    const evAt0 = evAt;
    const step = tickR * 2.8;
    evAt = ev => {
      const q = evAt0(ev);
      if (!ev.event || ev.msg === 'milestone') return q;
      const same = events.filter(e2 => e2.grouped && e2.row === ev.row && e2.lane === ev.lane && e2.msg !== 'milestone');
      const k = same.findIndex(e2 => e2.event === ev.event);
      if (k < 0 || same.length < 2) return q;
      const d = (k - (same.length - 1) / 2) * step;
      return o.orient === 'v' ? {x: q.x + d, y: q.y} : {x: q.x, y: q.y + d};
    };
  }
  const find = e => events.find(x => x.event === e);
  // message lines: from the sent tick (or the sender's lane) to the received tick (or part-way to the receiver's lane)
  const lines = {};
  for (const m of MSGS) {
    const s0 = find(evName(m, 'sent')), rc = find(evName(m, 'received'));
    const from = m === 'proposal' ? 0 : 1, to = 1 - from;
    // (no sent event supplied: the line leaves the sender's portrait itself — no time, no tick)
    const bP0 = rc ? evAt(rc) : null;
    let aP = s0 ? evAt(s0) : null;
    // (where its lane leaves the portrait's rim)
    if (!aP) aP = {...laneStart[from]};
    const bP = bP0 || lineAt(aP, evAt({lane: to, row: Math.min(n - 1, (s0 ? s0.row : 0) + 1)}), 0.7);
    lines[m] = {a: aP, b: bP, start: aP, end: bP, received: Boolean(rc)};
  }
  // a tick on the lane's OUTER side (one of two events in one position) is reached from its own side: the line crosses
  // the lane beside the station and comes back along the outer side to its tick, so it never runs over the inner tick
  {
    const along = q => (o.orient === 'v' ? q.y : q.x);
    const outerDir = ev => (ev.lane ? 1 : -1);
    const outer = (ev, q) => {
      if (!ev || !ev.grouped) return false;
      const q0 = evAt({lane: ev.lane, row: ev.row});
      const d = o.orient === 'v' ? q.x - q0.x : q.y - q0.y;
      return Math.abs(d) > 1e-6 && Math.sign(d) === outerDir(ev);
    };
    const D = F * 2.6;
    const wayFor = (tick, other) => {
      const sg = Math.sign(along(other) - along(tick)) || 1;
      return o.orient === 'v' ? {x: tick.x, y: tick.y + sg * D} : {x: tick.x + sg * D, y: tick.y};
    };
    for (const m of MSGS) {
      const ln = lines[m];
      const s0 = find(evName(m, 'sent')), rc = find(evName(m, 'received'));
      if (rc && outer(rc, ln.end)) ln.b = wayFor(ln.end, ln.start);
      if (s0 && outer(s0, ln.start)) ln.a = wayFor(ln.start, ln.end);
    }
    // once the cards are placed: a shared-position tick is reached from its own side of the lane — when the card
    // lies on the other side, the line crosses the lane beside the station first
    lines.settle = () => {
      const across = q => (o.orient === 'v' ? q.x : q.y);
      for (const m of MSGS) {
        const ln = lines[m];
        for (const [ev, end, key] of [[find(evName(m, 'received')), ln.end, 'b'], [find(evName(m, 'sent')), ln.start, 'a']]) {
          if (!ev || !ev.grouped) continue;
          const lane = across(evAt({lane: ev.lane, row: ev.row}));
          const tickSide = Math.sign(across(end) - lane);
          if (!tickSide) continue;
          const viaSide = Math.sign(across(ln.via) - lane);
          ln[key] = viaSide === tickSide ? end : wayFor(end, ln.via);
        }
      }
    };
  }
  // ---- cards on their lines
  const cardBox = c => ({x: c.x - cw / 2, y: c.y - ch / 2, w: cw, h: ch});
  const timeBoxes = events.map((ev, i) => {
    if (!times[i]) return null;
    const q = evAt(ev);
    const c = times[i].box;
    if (o.orient === 'v') return {x: !ev.lane ? q.x - tickR - F * 0.5 - c.w : q.x + tickR + F * 0.5, y: q.y - c.h / 2, w: c.w, h: c.h};
    // (staggered: every second event of a lane one chip further out)
    const k = events.filter((e2, j) => j < i && e2.lane === ev.lane && !e2.grouped).length;
    const out = stagger && k % 2 === 1 ? timeH + F * 0.4 : 0;
    return {x: q.x - c.w / 2, y: !ev.lane ? q.y - tickR - F * 0.5 - c.h - out : q.y + tickR + F * 0.5 + out, w: c.w, h: c.h};
  });
  // (events in one position on one lane, the milestone included: their chips sit on the lane's outer side at the
  // station's own time coordinate, arranged across the time axis — level side by side when time runs down, stacked
  // when time runs right — so no order is implied between them)
  for (const row of [...new Set(events.filter(e => e.grouped).map(e => `${e.row}|${e.lane}`))]) {
    const same = events.map((e2, j) => [e2, j]).filter(([e2, j]) => e2.grouped && `${e2.row}|${e2.lane}` === row && timeBoxes[j]);
    if (same.length < 2) continue;
    const ev0 = same[0][0];
    const base = evAt({lane: ev0.lane, row: ev0.row});
    const out = ev0.lane ? 1 : -1;
    const gapC = F * 0.4;
    const nTicks = same.filter(([e2]) => e2.msg !== 'milestone').length;
    const off0 = nTicks >= 2 ? tickR * 1.4 + tickR + F * 0.5 : tickR + F * 0.5;
    if (o.orient === 'v') {
      const tickOut = base.x + out * off0;
      let x = tickOut;
      if (out > 0) for (const [, j] of same) { const c = timeBoxes[j]; timeBoxes[j] = {...c, x, y: base.y - c.h / 2}; x += c.w + gapC; }
      else for (const [, j] of [...same].reverse()) { const c = timeBoxes[j]; x -= c.w; timeBoxes[j] = {...c, x, y: base.y - c.h / 2}; x -= gapC; }
    } else {
      let y = base.y + out * off0;
      for (const [, j] of same) { const c = timeBoxes[j]; timeBoxes[j] = {...c, x: base.x - c.w / 2, y: out > 0 ? y : y - c.h}; y += out * (c.h + gapC); }
    }
  }
  // ('h': a lane's chips — a group of one position moving as one — step further out when they would meet the chips
  // of an earlier row on the same lane)
  if (o.orient !== 'v') {
    const placed = [[], []];
    for (let row = 0; row < n; row++) for (const ln of [0, 1]) {
      const idx = events.map((e, j) => (e.row === row && e.lane === ln && timeBoxes[j] ? j : -1)).filter(j => j >= 0);
      if (!idx.length) continue;
      const u0 = unionBox(idx.map(j => timeBoxes[j]));
      const out = ln ? 1 : -1;
      // (a group of one position carries its bracket and label on its outer side)
      const exH = toExam && idx.some(j => events[j].grouped) ? toExam.height + F * 0.3 + 20 : 0;
      const u = out > 0 ? {...u0, h: u0.h + exH} : {...u0, y: u0.y - exH, h: u0.h + exH};
      let d = 0;
      for (const pb of placed[ln]) {
        if (!overlaps(u, pb, 4)) continue;
        d = Math.max(d, out > 0 ? pb.y + pb.h + F * 0.4 - u.y : u.y + u.h - (pb.y - F * 0.4));
      }
      if (d > 0) for (const j of idx) timeBoxes[j] = {...timeBoxes[j], y: timeBoxes[j].y + out * d};
      placed[ln].push(d > 0 ? {...u, y: u.y + out * d} : u);
    }
  }
  for (const b of timeBoxes) if (b && !insideBox(b, box)) why.push('timeOut');
  // events in one position: per lane, the dashed bracket and its "order to be examined" label (kept clear like chips)
  const examBoxes = [];
  const examKeys = [...new Set(events.filter(e => e.grouped).map(e => `${e.row}|${e.lane}`))];
  for (const key of examKeys) {
    const idx = events.map((e, i) => (`${e.row}|${e.lane}` === key && e.grouped ? i : -1)).filter(i => i >= 0);
    const bs = [...idx.map(i => timeBoxes[i]).filter(Boolean), ...idx.filter(i => events[i].msg !== 'milestone').map(i => { const q = evAt(events[i]); return {x: q.x - tickR - 4, y: q.y - tickR - 4, w: tickR * 2 + 8, h: tickR * 2 + 8}; })];
    const u0 = unionBox(bs);
    const bb = {x: u0.x - 10, y: u0.y - 10, w: u0.w + 20, h: u0.h + 20};
    examBoxes.push({bb, key});
    if (toExam) {
      // (on the outer side of the lane, away from the message lines that reach it)
      const recv = events[idx[0]].lane === 1;
      // (under the bracket, else over it — clear of every other chip)
      const tx = o.orient === 'v' ? (recv ? bb.x + bb.w - toExam.width : bb.x) : bb.x + bb.w / 2 - toExam.width / 2;
      const tys = o.orient === 'v' ? [bb.y + bb.h + F * 0.3, bb.y - toExam.height - F * 0.3] : [recv ? bb.y + bb.h + F * 0.3 : bb.y - toExam.height - F * 0.3];
      const others = timeBoxes.filter((b, j) => b && !idx.includes(j));
      const lb = tys.map(ty => ({x: tx, y: ty, w: toExam.width, h: toExam.height})).find(q => insideBox(q, box) && !others.some(b => overlaps(q, b, 4))) || {x: tx, y: tys[0], w: toExam.width, h: toExam.height};
      examBoxes[examBoxes.length - 1].label = lb;
      if (!insideBox(lb, box)) why.push('examOut');
      if (others.some(b => overlaps(lb, b, 4))) why.push('exam');
    }
  }
  const fixedBoxes = [...timeBoxes.filter(Boolean), ...nameBoxes.filter(Boolean), ...badges.map(q => ({x: q.x - Rb, y: q.y - Rb, w: Rb * 2, h: Rb * 2})), ...examBoxes.flatMap(e => [e.bb, e.label].filter(Boolean)), dialBox, clockBox].filter(Boolean);
  const tb = timeBoxes.filter(Boolean);
  for (let i = 0; i < tb.length; i++) for (let j = i + 1; j < tb.length; j++) if (overlaps(tb[i], tb[j], 4)) why.push('times');
  for (const nb of [...nameBoxes, clockBox].filter(Boolean)) if (tb.some(x => overlaps(x, nb, 4)) || !insideBox(nb, box)) why.push('names');
  if (clockBox && nameBoxes.some(nb => nb && overlaps(nb, clockBox, 4))) why.push('names');
  // (the rule is a line the cards keep clear of, like the lanes)
  const laneOnly = laneBoxes;
  if (ruleBox) laneBoxes = [...laneBoxes, ruleBox];
  const place = (m, fr) => {
    const ln = lines[m];
    return lineAt(ln.a, ln.b, fr);
  };
  // cards: each sits on its message's path (A's tick → card → B's tick); on the straight line when it fits, else
  // offset to one side (the path bends through the card). The crossing of the two paths stays visible, each card
  // leaves a readable stretch of its path on both sides, and the cards keep apart.
  const straightX = segX(lines.proposal.a, lines.proposal.b, lines.response.a, lines.response.b);
  const gapTo = (b, q) => Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)));
  const candsOf = m => {
    const ln = lines[m];
    const L0 = segLen(ln.a, ln.b) || 1;
    const nx = -(ln.b.y - ln.a.y) / L0, ny = (ln.b.x - ln.a.x) / L0;
    const out = [];
    for (const off of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
      for (const f0 of [0.24, 0.3, 0.18, 0.36, 0.42, 0.48, 0.54, 0.6, 0.66, 0.72, 0.78, 0.84, 0.12]) {
        const q = lineAt(ln.a, ln.b, f0);
        out.push({x: q.x + nx * off * F * 2.2, y: q.y + ny * off * F * 2.2, off: Math.abs(off)});
      }
    }
    return out;
  };
  // (a supplied relation of the clock keeps a strip beside the dial free of cards, for its connector and caption)
  const clockRel = p.relationships.some(q => q.from === 'clock' || q.to === 'clock');
  const clockZone = !clockRel ? null : o.orient === 'v' ? {x: dial.x - F * 5, y: dialBox.y + dialBox.h, w: F * 10, h: F * 3.4} : {x: dialBox.x + dialBox.w, y: dial.y - F * 1.7, w: F * 9, h: F * 3.4};
  const okOne = (m, c) => {
    const b = cardBox(c);
    if (fixedBoxes.some(x => overlaps(b, x, 6))) return false;
    if (clockZone && overlaps(b, clockZone, 0)) return false;
    // (nor over the sequence title or the key)
    if (seqBox0 && overlaps(b, seqBox0, 6)) return false;
    if (keyC && overlaps(b, {x: box.x + (box.w - keyC.box.w) / 2, y: box.y + box.h - keyC.box.h, w: keyC.box.w, h: keyC.box.h}, 6)) return false;
    if (laneBoxes.some(x => overlaps(b, x, 8))) return false;
    if (!insideBox(b, box)) return false;
    if (gapTo(b, lines[m].a) < F * 3.9 || gapTo(b, lines[m].b) < F * 3.9) return false;
    return true;
  };
  const cP = candsOf('proposal').filter(c => okOne('proposal', c)), cW = candsOf('response').filter(c => okOne('response', c));
  // (one card travelling: its card alone, the other drawn nowhere)
  const active = stationsOf(p.sequence).active;
  const FAR = {x: -1e5, y: -1e5};
  // valid placements by cost (the least offset first); o.placeRank picks a later one when the captions find no room
  const rank = o.placeRank ?? 0;
  const found = [];
  let rest = null;
  // (rank 0 needs only the least offset; later ranks look further)
  for (let lim = 0; lim <= 8 && (rank ? found.length < 400 : !found.length); lim++) {
  for (const cp of cP) {
    if (cp.off > lim) continue;
    for (const cwp of cW) {
      const cost = cp.off + cwp.off;
      if (cost !== lim) continue;
      const bp = cardBox(cp), bw = cardBox(cwp);
      if (overlaps(bp, bw, F * (o.pairF ?? 2))) continue;
      const PP = [lines.proposal.a, cp, lines.proposal.b], PW = [lines.response.a, cwp, lines.response.b];
      const X = polyX(PP, PW);
      // the paths cross exactly when the supplied order makes the straight lines cross, and the crossing stays in view
      if (Boolean(X) !== Boolean(straightX)) continue;
      if (X && [bp, bw].some(b => X.x > b.x - F * 1.2 && X.x < b.x + b.w + F * 1.2 && X.y > b.y - F * 1.2 && X.y < b.y + b.h + F * 1.2)) continue;
      // a card never sits on the other message's path
      if (segHitsBox(PW[0], PW[1], bp, 2) || segHitsBox(PW[1], PW[2], bp, 2) || segHitsBox(PP[0], PP[1], bw, 2) || segHitsBox(PP[1], PP[2], bw, 2)) continue;
      found.push({cost, rest: {proposal: cp, response: cwp, cross: X}});
      if (!rank) break;
    }
    if (!rank && found.length) break;
  }
  }
  if (active.length === 1) {
    const m = active[0];
    const c0 = (m === 'proposal' ? cP : cW).slice().sort((x, y) => x.off - y.off)[Math.min(o.placeRank ?? 0, 0)];
    found.length = 0;
    if (c0) rest = m === 'proposal' ? {proposal: c0, response: FAR, cross: null} : {proposal: FAR, response: c0, cross: null};
  }
  if (found.length) {
    // distinct places only (candidates a few units apart count as one)
    const order = found.map((f0, k) => ({...f0, k})).sort((x, y) => x.cost - y.cost || x.k - y.k);
    const distinct = [];
    for (const f0 of order) if (!distinct.some(d => segLen(d.rest.proposal, f0.rest.proposal) + segLen(d.rest.response, f0.rest.response) < F * 5)) distinct.push(f0);
    rest = distinct[Math.min(rank, distinct.length - 1)].rest;
    if (rank >= distinct.length) why.push('rank');
  }
  if (!rest) { why.push('cards'); rest = {proposal: active.includes('proposal') ? lineAt(lines.proposal.a, lines.proposal.b, 0.3) : FAR, response: active.includes('response') ? lineAt(lines.response.a, lines.response.b, 0.7) : FAR, cross: null}; }
  for (const m of MSGS) lines[m].via = rest[m];
  lines.settle();
  for (const m of MSGS) { const ln = lines[m]; ln.via = rest[m]; ln.La = segLen(ln.start, ln.a) + segLen(ln.a, rest[m]); ln.Lb = segLen(rest[m], ln.b) + segLen(ln.b, ln.end); }
  // gather: the cards keep their places (the mechanism is assembled in view: origin, journey, state)
  const gat = rest;
  // ---- elements (boxes for connectors and the tracer)
  const els = {
    offeror: {circle: {x: badges[0].x, y: badges[0].y, r: Rb}},
    offeree: {circle: {x: badges[1].x, y: badges[1].y, r: Rb}},
    ...(active.includes('proposal') ? {proposal: {box: cardBox(rest.proposal)}} : {}),
    ...(active.includes('response') ? {response: {box: cardBox(rest.response)}} : {}),
  };
  // ---- connectors for the supplied relationships
  const conns = [];
  for (const [i, rel] of p.relationships.entries()) {
    if (!els[rel.from] || !els[rel.to] || rel.from === rel.to) continue;
    const kind = rel.kind;
    const text = (p.relationLabels && p.relationLabels[kind]) || ctx.t.kinds[kind] || kind;
    const partyEnd = isParty(rel.from) ? rel.from : isParty(rel.to) ? rel.to : null;
    const msgEnd = !isParty(rel.from) ? rel.from : !isParty(rel.to) ? rel.to : null;
    let seg0 = null;
    if (partyEnd && MSGS.includes(msgEnd)) {
      // along the message's own path: the sender's tick → card edge, or card edge → the receiver's tick
      const ln = lines[msgEnd];
      const cb = cardBox(ln.via);
      const sender = msgEnd === 'proposal' ? 'offeror' : 'offeree';
      const tick = partyEnd === sender ? ln.a : ln.b;
      // where the path leaves the card's box
      let edge = ln.via;
      for (let k = 0; k <= 60; k++) {
        const q = lineAt(ln.via, tick, k / 60);
        if (!(q.x > cb.x && q.x < cb.x + cb.w && q.y > cb.y && q.y < cb.y + cb.h)) { edge = q; break; }
      }
      const from = rel.from === partyEnd ? tick : edge;
      const to = rel.from === partyEnd ? edge : tick;
      seg0 = {from, to, straight: true, color: msgColor(ctx, msgEnd), msg: msgEnd};
    } else if (!partyEnd || rel.from === 'clock' || rel.to === 'clock') {
      // between the cards, or the clock and another component: several routings (nearest edges, both left sides,
      // both right sides; bulging either way); the caption search takes the first whose caption fits
      const boxOf = id => els[id].box || {x: els[id].circle.x - els[id].circle.r, y: els[id].circle.y - els[id].circle.r, w: els[id].circle.r * 2, h: els[id].circle.r * 2};
      const A = boxOf(rel.from), B = boxOf(rel.to);
      const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
      const alts = [];
      const nf = nearestOn({x: A.x - 8, y: A.y - 8, w: A.w + 16, h: A.h + 16}, cb), nt = nearestOn({x: B.x - 12, y: B.y - 12, w: B.w + 24, h: B.h + 24}, ca);
      for (const bend of [0.2, -0.2, 0.35, -0.35]) alts.push({from: nf, to: nt, bend});
      const lA = {x: A.x - 8, y: ca.y}, lB = {x: B.x - 12, y: cb.y}, rA = {x: A.x + A.w + 8, y: ca.y}, rB = {x: B.x + B.w + 12, y: cb.y};
      const sgn = (a, b) => (b.y >= a.y ? 1 : -1);
      alts.push({from: lA, to: lB, bend: 0.3 * sgn(lA, lB)}, {from: rA, to: rB, bend: -0.3 * sgn(rA, rB)});
      // cards side by side: over both tops or under both bottoms (bulging away from the cards)
      const tA = {x: ca.x, y: A.y - 8}, tB = {x: cb.x, y: B.y - 12}, bA = {x: ca.x, y: A.y + A.h + 8}, bB = {x: cb.x, y: B.y + B.h + 12};
      for (const bend of [0.3, -0.3, 0.45, -0.45]) alts.push({from: tA, to: tB, bend}, {from: bA, to: bB, bend});
      seg0 = {...alts[0], alts, straight: false, color: kind === 'relation' ? th.fgSoft : kind === 'causal' ? th.accent : th.fg};
    } else {
      // party ↔ party: over the lanes' heads
      const from = o.orient === 'v' ? {x: badges[0].x + Rb + 8, y: badges[0].y} : {x: badges[0].x, y: badges[0].y + Rb + 8};
      const to = o.orient === 'v' ? {x: badges[1].x - Rb - 12, y: badges[1].y} : {x: badges[1].x, y: badges[1].y - Rb - 12};
      seg0 = {from, to, straight: false, color: th.fgSoft, bend: 0.12};
    }
    const arrow = kind !== 'relation';
    conns.push({i, rel, kind, text, arrow, ...seg0});
  }
  // stub connectors (too short to read) fail
  for (const c of conns) if (c.straight && segLen(c.from, c.to) < F * 3.7) why.push(`stub${c.i}`);
  // ---- captions next to their own connector (≤ 40 px at 1080p from it, nearer to it than to any other)
  const capBoxes = [];
  const obst = [...fixedBoxes, ...laneBoxes, cardBox(rest.proposal), cardBox(rest.response), cardBox(gat.proposal), cardBox(gat.response),
    ...badges.map(q => ({x: q.x - Rb, y: q.y - Rb, w: Rb * 2, h: Rb * 2}))];
  obst.push(...nameBoxes.filter(Boolean));
  const maxD = 28 / (upx);
  const clr = 13 / upx;
  const caps = [];
  // connector polylines (curves sampled) for distances
  const polyOf = c => {
    if (c.straight) return [c.from, c.to];
    const cn = connector(ctx, {name: 'probe', from: c.from, to: c.to, kind: 'relation', bend: c.bend ?? 0.2});
    const pts = [];
    for (let k = 0; k <= 24; k++) pts.push(cn.at(k / 24));
    return pts;
  };
  const distPoly = (b, pts) => Math.min(...pts.slice(1).map((q, k) => distBoxSeg(b, pts[k], q)));
  const hitsPoly = (pts, b) => pts.slice(1).some((q, k) => segHitsBox(pts[k], q, b, 2));
  for (const c of conns) c.pts = polyOf(c);
  // a message line's two party connectors of one kind (A → card, card → B) read as one line: one caption, placed
  // next to the longer part, serves both
  const skip = new Set();
  for (const m of MSGS) {
    const cs = conns.filter(c => c.straight && c.msg === m);
    if (cs.length === 2 && cs[0].kind === cs[1].kind && cs[0].text === cs[1].text) {
      const [lo, hi] = segLen(cs[0].from, cs[0].to) >= segLen(cs[1].from, cs[1].to) ? [cs[1], cs[0]] : [cs[0], cs[1]];
      skip.add(lo.i);
      hi.twin = lo;
      lo.capBy = hi.i;
    }
  }
  // a connector with several routings takes them in turn (and its caption the first place that fits); the fixed
  // connectors' captions are then placed against the routing actually drawn. The first routing with which every
  // caption fits is kept.
  // the milestone's rule takes the clock's caption (a key label: shown with labels all and key)
  const ruleText = '';
  if (ruleText) conns.push({i: 'rule', rel: null, kind: 'rule', text: ruleText, straight: true, from: rule.a, to: rule.b, color: INK, pseudo: true, pts: [rule.a, rule.b]});
  if (show || ruleText) {
    const multi = show ? conns.filter(q => q.alts) : [];
    const allAlts = new Map(multi.map(q => [q, q.alts]));
    const nAlt = multi.length ? allAlts.get(multi[0]).length : 1;
    let bestTry = null, pickedAlt = -1, once = false;
    // pass -1: the fixed connectors' captions alone (the routed connector left out); if one of them fails there, no
    // routing can help and a single ordinary pass follows
    for (let s0 = multi.length ? -1 : 0; s0 < nAlt;) {
      const solo = s0 < 0;
      if (multi.length && !solo) multi[0].alts = allAlts.get(multi[0]).slice(s0);
      const fails = [];
      capBoxes.length = 0; caps.length = 0; pickedAlt = -1;
      const live = solo ? conns.filter(q => !q.alts) : conns;
      for (const c of solo ? live : [...multi, ...conns.filter(q => !q.alts || !show)]) {
        if (skip.has(c.i) || (!show && !c.pseudo)) continue;
        const fit0 = fitW(c.text, {maxWidth: Math.min(box.w * 0.3, 16 * F), size: F, maxLines: 2, weight: 600});
        if (fit0.bad) { fails.push(`cap${c.i}`); continue; }
        // a narrower, two-line version of the same caption is tried when the one-line one finds no room
        const fit1 = fit0.lines?.length === 1 || fit0.height < F * 2 ? fitW(c.text, {maxWidth: Math.max(fit0.width * 0.62, 7 * F), size: F, maxLines: 2, weight: 600}) : null;
        const fits = [fit0, ...(fit1 && !fit1.bad && fit1.width < fit0.width - F ? [fit1] : [])];
        let pick = null, fit = fit0, cwid = 0, chh = 0, onTwin = false;
        for (const fv of fits) {
        if (pick) break;
        fit = fv; cwid = fv.width + F * 1.2; chh = fv.height + F * 0.6;
        // (a shared caption of two message segments may also sit by the shorter one)
        const carriers = c.alts || [null, ...(c.twin ? ['twin'] : [])];
        for (const [ai, alt] of carriers.entries()) {
          onTwin = alt === 'twin';
          if (alt && !onTwin) {
            Object.assign(c, alt); c.pts = polyOf(c); pickedAlt = ai;
            // a card-to-card routing never runs across a lane, a chip, a badge, a name or the cards themselves
            // (it may cross the milestone's rule, as the message lines do)
            if ([...fixedBoxes, ...laneOnly].some(x => hitsPoly(c.pts, x))) continue;
            const inner = c.pts.slice(2, -2);
            if (inner.length > 1 && [els.proposal.box, els.response.box].some(x => hitsPoly(inner, x))) continue;
          }
          const pts = onTwin ? c.twin.pts : c.pts;
          // stubs never count
          if (!c.straight && segLen(c.from, c.to) < F * 3.7) continue;
          for (const t of [0.5, 0.44, 0.56, 0.38, 0.62, 0.32, 0.68, 0.26, 0.74, 0.2, 0.8, 0.14, 0.86, 0.1, 0.9]) {
            const k0 = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
            const q = lineAt(pts[k0], pts[k0 + 1], t * (pts.length - 1) - k0);
            const tx = pts[k0 + 1].x - pts[k0].x, ty = pts[k0 + 1].y - pts[k0].y, TL = Math.hypot(tx, ty) || 1;
            const nx = -ty / TL, ny = tx / TL;
            for (const side of [1, -1, 0]) {
              for (const off of side === 0 ? [0] : [0, 0.4, 0.8, 1.3, 1.8]) {
                // (side 0: the caption sits on its own connector, interrupting it)
                const dd = side === 0 ? 0 : chh / 2 + F * 0.4 + off * F;
                const cx = q.x + (side || 1) * nx * dd, cy = q.y + (side || 1) * ny * dd;
                const b = {x: cx - cwid / 2, y: cy - chh / 2, w: cwid, h: chh};
                if (!insideBox(b, box)) continue;
                // (8 px at 1080p clear of cards, badges, chips and other captions)
                if (obst.some(x => overlaps(b, x, clr)) || capBoxes.some(x => overlaps(b, x, clr))) continue;
                const dOwn = distPoly(b, pts);
                if (dOwn > maxD) continue;
                if (live.some(o2 => o2 !== c && o2 !== c.twin && o2.pts && (distPoly(b, o2.pts) < dOwn + 21 / upx || distPoly(b, o2.pts) < clr))) continue;
                // no other connector runs through the caption
                if (live.some(o2 => o2 !== c && o2 !== c.twin && o2.pts && hitsPoly(o2.pts, b))) continue;
                pick = b;
                break;
              }
              if (pick) break;
            }
            if (pick) break;
          }
          if (pick) break;
        }
        }
        if (!pick) { fails.push(`cap${c.i}`); continue; }
        capBoxes.push(pick);
        caps.push({c, fit, box: pick, on: onTwin ? c.twin.i : c.i});
      }
      if (solo) { once = fails.length > 0; s0 = 0; continue; }
      const tried = {fails, caps: [...caps], boxes: [...capBoxes], route: multi.length ? {...multi[0]} : null};
      if (!bestTry || fails.length < bestTry.fails.length) bestTry = tried;
      if (!fails.length || !multi.length || once) break;
      // the routed connector's own caption found no routing from here on: nothing further to try
      if (fails.includes(`cap${multi[0].i}`)) break;
      s0 += pickedAlt + 1;
    }
    for (const q of multi) q.alts = allAlts.get(q);
    if (bestTry.route) { const {from, to, bend, pts} = bestTry.route; Object.assign(multi[0], {from, to, bend, pts}); }
    capBoxes.length = 0; capBoxes.push(...bestTry.boxes);
    caps.length = 0; caps.push(...bestTry.caps);
    why.push(...bestTry.fails);
  }
  const ruleConn = conns.findIndex(c => c.pseudo) >= 0 ? conns.splice(conns.findIndex(c => c.pseudo), 1)[0] : null;
  // ---- sequence title (top centre between the lanes) and key (bottom)
  let seqBox = null;
  if (seqT) {
    seqBox = seqBox0;
    // (with the focus card's swell during the trace: up to 7 % larger about its centre)
    if ([...obst, ...capBoxes].some(x => overlaps(seqBox, x, 6 + Math.max(cw, ch) * 0.04))) why.push('seqTitle');
  }
  let keyBox = null;
  if (keyC) {
    keyBox = {x: box.x + (box.w - keyC.box.w) / 2, y: box.y + box.h - keyC.box.h, w: keyC.box.w, h: keyC.box.h};
    if ([...obst, ...capBoxes].some(x => overlaps(keyBox, x, 4))) why.push('key');
  }
  // lines must not run through text (captions, chips, names, titles)
  for (const m of active) {
    const ln = lines[m];
    const named = [...capBoxes.map((b, i) => [caps[i] && caps[i].c.msg === m ? null : b, 'cap']), ...timeBoxes.map(b => [b, 'time']), ...nameBoxes.map(b => [b, 'name']), ...badges.map(q => [{x: q.x - Rb, y: q.y - Rb, w: Rb * 2, h: Rb * 2}, 'badge']), [seqBox, 'seq'], [keyBox, 'key'], ...examBoxes.map(e => [e.label, 'exam']), [clockBox, 'clockcap'], [dialBox, 'clock']];
    for (const [b, kind] of named) {
      if (!b) continue;
      // (a line leaving a portrait — no sent event supplied — starts at that portrait's rim)
      if (kind === 'badge' && Math.hypot(b.x + b.w / 2 - ln.start.x, b.y + b.h / 2 - ln.start.y) < Rb + 8) continue;
      if (segHitsBox(ln.a, ln.via, b, 2) || segHitsBox(ln.via, ln.b, b, 2) || segHitsBox(ln.start, ln.a, b, 2) || segHitsBox(ln.b, ln.end, b, 2)) { why.push(`line-${m}:${kind}`); break; }
    }
  }
  // nor does the milestone's rule (it joins the lanes between the chips, never through a text or a card)
  if (rule) {
    const hit = [...capBoxes, ...timeBoxes, ...nameBoxes, seqBox, keyBox, clockBox, ...examBoxes.map(e => e.label), cardBox(rest.proposal), cardBox(rest.response)].filter(Boolean).some(b => segHitsBox(rule.a, rule.b, b, 2));
    if (hit) why.push('rule:text');
  }
  // nor do the other connectors (card to card, party to party)
  {
    const texts = [...timeBoxes, ...nameBoxes, seqBox, keyBox, clockBox, ...examBoxes.map(e => e.label)].filter(Boolean);
    for (const c of conns) {
      if (c.straight || !c.pts) continue;
      const own = caps.filter(q => q.c === c).map(q => q.box);
      if ([...texts, ...capBoxes.filter(b => !own.includes(b))].some(b => c.pts.slice(1).some((q, k) => segHitsBox(c.pts[k], q, b, 2)))) why.push(`conn${c.i}:text`);
    }
  }
  const head = 88 * 0; void head;
  return {active, F, FL, M, cw, ch, Rb, Rc, lanes, badges, center, rowAt, evAt, orient: o.orient, examBoxes, events, times, timeBoxes, lines, rest, gat, els, conns, caps, names, nameBoxes, seqT, seqBox, keyC, keyBox, toExam, tickR, why, ok: why.length === 0, px, innerF,
    dial, dialBox, clockC, clockBox, rule, mRow, ruleConn};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const {stations, problems, configuration} = stationsOf(p.sequence);
    const pxSets = [{F: 26, L: 25}, {F: 24, L: 24}, {F: 22, L: 22}, {F: 21, L: 21}, {F: 20, L: 20}, {F: 19.6, L: 19.6}, {F: 18, L: 18}, {F: 17, L: 17}, {F: 16.1, L: 16.1}];
    let best = null;
    const shape = ctx.view.shape;
    const orients = shape === 'landscape' ? ['v', 'h'] : shape === 'portrait' ? ['h', 'v'] : ['h', 'v'];
    // the parties' portraits: the face is 0.6 of the badge radius; people floors (55 px, 45 px in stress) come first,
    // with the text floor (19.6 px) before the second people floor
    const RBS = [6.4, 5.8, 5.2, 4.8, 4.2, 3.6, 3, 2.4];
    const faceOf = (RbF, px) => 0.6 * RbF * px.F;
    const tryAt = (px, need) => {
      let bestP = null;
      for (const innerF of [15, 13, 11, 18, 9, 21, 24]) {
        const rbs = RBS.filter(rb => faceOf(rb, px) >= need && (need > 0 || rb <= 4.2));
        for (const [orient, RbF, tF] of orients.flatMap(or => rbs.flatMap(rb => [13, 8].map(tf => [or, rb, tf])))) {
          let base = {upx, px, innerF, stations, Rb: RbF * px.F / upx, orient, tF};
          let C = compose(ctx, p, base);
          if (!C) continue;
          // ('h': the clock's caption beside the dial when the band is too low for it under the dial)
          if (orient === 'h' && C.why.includes('clock')) {
            const Cs = compose(ctx, p, {...base, capSide: true});
            if (Cs && Cs.why.length < C.why.length) { C = Cs; base = {...base, capSide: true}; }
          }
          // only captions missing: the cards set further apart leave room for the card-to-card connector between them
          if (!C.ok && C.why.every(w => w.startsWith('cap'))) {
            const C2 = compose(ctx, p, {...base, pairF: 5});
            if (C2 && C2.why.length < C.why.length) C = C2;
            for (let pr = 1; pr <= 8 && !C.ok; pr++) {
              const C3 = compose(ctx, p, {...base, placeRank: pr});
              if (!C3 || C3.why.includes('rank')) break;
              if (C3.why.length < C.why.length) C = C3;
            }
          }
          C.face = faceOf(RbF, px);
          if (!bestP || (C.ok && !bestP.ok) || (!C.ok && !bestP.ok && C.why.length < bestP.why.length)) bestP = C;
          if (C.ok) return C;
        }
      }
      return bestP;
    };
    const floorPx = pxSets.filter(q => q.F >= 19.6), lowPx = pxSets.filter(q => q.F < 19.6);
    outer: for (const [pxs, need] of [[floorPx, 56], [lowPx, 56], [floorPx, 46], [lowPx, 46], [pxSets, 0]]) {
      for (const px of pxs) {
        const C = tryAt(px, need);
        if (C && (!best || (C.ok && !best.ok) || (!C.ok && !best.ok && C.why.length < best.why.length))) best = C;
        if (best && best.ok) break outer;
      }
    }
    // (nothing fits: the smallest text, flagged — never throws)
    if (!best) best = compose(ctx, p, {upx, px: pxSets[pxSets.length - 1], innerF: 15, stations, Rb: 3 * 16 / upx, orient: orients[0], force: true});
    // tracer route along the supplied order (via drawn connectors; hidden between them)
    const L = best;
    const pts = [], runs = [], visits = [];
    const order = p.traversalOrder.filter(id => L.els && L.els[id]);
    const centerOf = id => (L.els[id].circle ? {x: L.els[id].circle.x, y: L.els[id].circle.y} : {x: L.els[id].box.x + L.els[id].box.w / 2, y: L.els[id].box.y + L.els[id].box.h / 2});
    order.forEach((id, i) => {
      if (i === 0) { pts.push(centerOf(id)); visits.push({id, idx: 0}); return; }
      const prev = order[i - 1];
      const c = (L.conns || []).find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      if (c) {
        const fw = c.rel.from === prev;
        const a = pts.length;
        for (let k = 0; k <= 24; k++) pts.push(lineAt(fw ? c.from : c.to, fw ? c.to : c.from, k / 24));
        runs.push([a, pts.length - 1]);
      } else pts.push(centerOf(id));
      visits.push({id, idx: pts.length - 1});
    });
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + segLen(pts[i - 1], pts[i]));
    const total = cum[cum.length - 1] || 1;
    const at = t => {
      const d = clamp(t) * total;
      let i = 1;
      while (i < pts.length - 1 && cum[i] < d) i++;
      if (pts.length < 2) return pts[0] || {x: 0, y: 0};
      const f = (d - cum[i - 1]) / Math.max(1e-9, cum[i] - cum[i - 1]);
      return lineAt(pts[i - 1], pts[i], clamp(f));
    };
    const route = {at, runs: runs.map(([a, b]) => [cum[a] / total, cum[b] / total]), visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
    for (const c of L.conns || []) if (!c.straight) c.cn = connector(ctx, {name: `conn${c.i}`, from: c.from, to: c.to, kind: c.kind === 'communication' ? 'sequence' : c.kind, color: c.color, bend: c.bend ?? 0.2});
    return {...L, route, problems, stations, configuration, upx};
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const nodes = [];
    // lanes (Party A left, Party B right): the supplied order runs down
    L.lanes.forEach((ln, i) => nodes.push(h('path', {name: `lane${i}`, d: `M${r(ln.a.x)} ${r(ln.a.y)}L${r(ln.b.x)} ${r(ln.b.y)}`, stroke: th.fgSoft, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0})));
    // message lines (solid, the message's colour; arrowhead at B's lane)
    for (const m of L.active) {
      const ln = L.lines[m];
      const len = ln.La + ln.Lb;
      const last = segLen(ln.b, ln.end) > 1 ? ln.b : ln.via;
      const ang = Math.atan2(ln.end.y - last.y, ln.end.x - last.x) * 180 / Math.PI;
      const pts = [ln.start, ...(segLen(ln.start, ln.a) > 1 ? [ln.a] : []), ln.via, ...(segLen(ln.b, ln.end) > 1 ? [ln.b] : []), ln.end];
      nodes.push(g({name: `line-${m}`},
        h('path', {name: `line-${m}-p`, d: `M${pts.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`, fill: 'none', stroke: msgColor(ctx, m), 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
        h('path', {name: `line-${m}-head`, d: 'M0 0L-22 -12L-16 0L-22 12Z', fill: msgColor(ctx, m), transform: T(ln.end.x - Math.cos(ang * Math.PI / 180) * (L.tickR + 4), ln.end.y - Math.sin(ang * Math.PI / 180) * (L.tickR + 4), ang), opacity: 0})));
    }
    // the milestone's rule: solid ink, joining the two lanes at the milestone's row
    if (L.rule) nodes.push(h('path', {name: 'rule', d: `M${r(L.rule.a.x)} ${r(L.rule.a.y)}L${r(L.rule.b.x)} ${r(L.rule.b.y)}`, stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0}));
    // other connectors (between cards, parties, the clock)
    for (const c of L.conns) {
      if (c.straight) continue;
      nodes.push(c.cn.node);
    }
    // lane events: ●/◆ ticks and the supplied time labels
    L.events.forEach((ev, i) => {
      const q = L.evAt(ev);
      const kids = ev.msg === 'milestone' ? [] : [glyph(ctx, ev.msg, q.x, q.y, L.tickR)];
      const b = L.timeBoxes[i];
      if (b && L.times[i]) {
        kids.push(h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2, L.F * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}));
        const cw0 = L.times[i].cue ? L.F * 1.25 : 0;
        if (cw0) kids.push(glyph(ctx, ev.msg, b.x + L.F * 0.75, b.y + b.h / 2, L.F * 0.36));
        if (L.times[i].ms) {
          const T0 = L.times[i];
          let y = b.y + L.F * 0.25;
          if (T0.head) { kids.push(textBlock(T0.head, {x: b.x + cw0 + (b.w - cw0) / 2, y, anchor: 'middle', fill: INK})); y += T0.head.height + L.F * 0.2; }
          if (T0.tl) kids.push(textBlock(T0.tl, {x: b.x + cw0 + (b.w - cw0) / 2, y, anchor: 'middle', fill: INK}));
        } else kids.push(textBlock(L.times[i].fit, {x: b.x + cw0 + (b.w - cw0) / 2, y: b.y + (b.h - L.times[i].fit.height) / 2, anchor: 'middle', fill: INK}));
      }
      nodes.push(g({name: `ev${i}`, opacity: 0}, kids));
    });
    // receipts in one position: dashed bracket = order to be examined
    L.examBoxes.forEach((e, gi) => {
      const bb = e.bb;
      const kids = [h('path', {d: roundRectPath(bb.x, bb.y, bb.w, bb.h, 12), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '9 7'})];
      if (L.toExam && e.label) kids.push(textBlock(L.toExam, {x: e.label.x, y: e.label.y, fill: th.fg}));
      nodes.push(g({name: `exam${gi}`, opacity: 0}, kids));
    });
    // parties
    [0, 1].forEach(i => {
      const bd = personBadge(ctx, {name: `badge${i}`, x: L.badges[i].x, y: L.badges[i].y, radius: L.Rb, look: actorLook(ctx, p.parties[i], i)});
      nodes.push(g({name: `party${i}`}, bd.node));
      if (L.names[i]) {
        const nb = L.nameBoxes[i];
        nodes.push(chipW(ctx, `${p.parties[i].name} · ${(p.elements.find(e => e.id === (i ? 'offeree' : 'offeror')) || {}).label || ''}`, {x: nb.x, y: nb.y, maxWidth: nb.w + 2, size: L.names[i].fit.size, maxLines: 2, weight: 600, name: `name${i}`}).node);
      }
    });
    // connector geometry for the rendered caption tests (unstroked)
    if (L.ruleConn) nodes.push(h('path', {name: 'connpathrule', d: `M${r(L.rule.a.x)} ${r(L.rule.a.y)}L${r(L.rule.b.x)} ${r(L.rule.b.y)}`, fill: 'none', stroke: 'none', 'data-conn': 'rule'}));
    for (const c of L.conns) nodes.push(h('path', {name: `connpath${c.i}`, d: c.pts.map((q, k) => `${k ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: 'none', 'data-conn': c.i}));
    // captions
    L.caps.forEach(cp => {
      const b = cp.box;
      const own = [cp.c.i, ...(cp.c.twin ? [cp.c.twin.i] : [])].join(' ');
      nodes.push(g({name: `cap${cp.c.i}`, opacity: 0, 'data-caption-of': own},
        h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(b.h / 2, L.F * 0.7)), fill: th.card, stroke: cp.c.color, 'stroke-width': 2}),
        textBlock(cp.fit, {x: b.x + b.w / 2, y: b.y + (b.h - cp.fit.height) / 2, anchor: 'middle', fill: INK})));
    });
    if (L.seqT) nodes.push(g({name: 'seqTitle', opacity: 0}, textBlock(L.seqT, {x: L.seqBox.x + L.seqBox.w / 2, y: L.seqBox.y, anchor: 'middle', fill: th.fg})));
    if (L.keyC) {
      const {kc, cc, side} = L.keyC, B = L.keyBox;
      const kx = cc ? (side ? B.x + cc.box.w + L.F : B.x + (B.w - kc.box.w) / 2) : B.x, ky = cc && !side ? B.y + cc.box.h + L.F * 0.4 : B.y + (B.h - kc.box.h) / 2;
      if (cc) nodes.push(chipW(ctx, ctx.t[p.status], {x: side ? B.x : B.x + (B.w - cc.box.w) / 2, y: side ? B.y + (B.h - cc.box.h) / 2 : B.y, maxWidth: cc.box.w + 2, fit: cc.fit, size: cc.fit.size, maxLines: 2, weight: 700, stroke: th.inkSoft, name: 'concept', opacity: 0}).node);
      nodes.push(chipW(ctx, ctx.t.key, {x: kx, y: ky, maxWidth: kc.box.w + 2, fit: kc.fit, size: kc.fit.size, maxLines: 2, weight: 600, stroke: th.inkSoft, name: 'key', opacity: 0}).node);
    }
    // tracer under the cards and captions
    nodes.push(tracer(ctx, 'tracer', th.accent));
    // cards
    const Mc = {...L.M};
    for (const m of L.active) {
      const c = messageCard(ctx, {name: `card-${m[0]}`, kind: m, M: Mc, w: L.cw, h: L.ch}).node;
      nodes.push(g({name: `el-${m}`}, c));
    }
    // the definition slip while it passes from the definitions sheet's dock to the contract's (above both documents)
    const dg = dockGeom(L.M, L.ch, 'proposal');
    if (dg && L.active.includes('proposal')) nodes.push(g({name: 'slipfly', transform: T(0, 0), opacity: 0, 'data-occludes': 1}, slipArt(ctx, {name: 'slipfly-s', w: dg.slipW, h: dg.slipH, F: dg.F, fit: L.M.dock.slip})));
    void show;
    return g(null, nodes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const s = w => seg(u, ...W[w]);
    // separate: the parts take their places (the parties are there from the start; the cards fade in at their places)
    const sep = ease.inOutCubic(s('separate'));
    // (the parties stand at the heads of their lanes from the first frame; the lanes and the cards come in around them)
    const from = q => q;
    [0, 1].forEach(i => {
      const q = L.badges[i];
      const at = from(q);
      // (the parties are in view from the first frame: they only move apart)
      nodes[`party${i}`] = {transform: T(at.x - q.x, at.y - q.y), opacity: 1};
      if (L.names[i]) nodes[`name${i}`] = {opacity: r(clamp((sep - 0.6) / 0.4), 3)};
      nodes[`lane${i}`] = {opacity: r(clamp((sep - 0.7) / 0.3), 3)};
    });
    // relate: the connectors one by one (supplied order of the relationships), each caption after its line
    const rel = s('relate');
    const n = L.conns.length || 1;
    const drawn = {};
    L.conns.forEach((c, k) => { drawn[c.i] = clamp((rel - k / n) * n / 0.85); });
    for (const m of L.active) {
      // the message line draws with its party connectors (the sender's side, then the receiver's side)
      const cs = L.conns.filter(c => c.straight && c.msg === m);
      const snd = m === 'proposal' ? 'offeror' : 'offeree', rcv = m === 'proposal' ? 'offeree' : 'offeror';
      const pa = cs.find(c => c.rel.from === snd || c.rel.to === snd);
      const pb = cs.find(c => c.rel.from === rcv || c.rel.to === rcv);
      const ln = L.lines[m];
      const len = ln.La + ln.Lb;
      const fr0 = ln.La / (len || 1);
      const shown = (pa ? drawn[pa.i] * fr0 : 0) + (pb ? drawn[pb.i] * (1 - fr0) : 0);
      // (only the drawn relationships appear; with none supplied for a side, that part of the path stays hidden)
      nodes[`line-${m}-p`] = {'stroke-dashoffset': r(len * (1 - (pa && drawn[pa.i] < 1 ? drawn[pa.i] * fr0 : shown)), 1)};
      nodes[`line-${m}-head`] = {opacity: pb && drawn[pb.i] >= 0.99 ? 1 : 0};
      nodes[`line-${m}`] = {opacity: pa || pb ? 1 : 0};
    }
    for (const c of L.conns) if (!c.straight && c.cn) Object.assign(nodes, c.cn.frame(drawn[c.i], drawn[c.i] > 0 ? 1 : 0));
    // (the milestone's rule, its caption and its time label are part of the supplied structure: in place with the lanes)
    const ruleOn = L.mRow >= 0 ? clamp((sep - 0.7) / 0.3) : 0;
    L.caps.forEach(cp => { nodes[`cap${cp.c.i}`] = {opacity: r(cp.c.pseudo ? ruleOn : clamp((drawn[cp.on] - 0.6) / 0.4), 3)}; });
    // lane events appear as their message lines reach them
    // the clock's hand turns one step per row of the supplied order during the relate beat (ordinal only) and points
    // at its mark at the milestone's row
    const nRows = L.stations.length;
    const rowT = L.stations.map((_, i) => lerp(W.relate[0] + 0.02, W.relate[1] - 0.02, nRows <= 1 ? 1 : i / (nRows - 1)));
    void rowT;
    if (L.rule) nodes.rule = {opacity: r(ruleOn, 3)};
    if (L.clockC) nodes.clockcap = {opacity: r(clamp((sep - 0.6) / 0.4), 3)};
    L.events.forEach((ev, i) => {
      if (ev.msg === 'milestone') { nodes[`ev${i}`] = {opacity: r(ruleOn, 3)}; return; }
      const snd = ev.msg === 'proposal' ? 'offeror' : 'offeree', rcv = ev.msg === 'proposal' ? 'offeree' : 'offeror';
      const who = ev.verb === 'sent' ? snd : rcv;
      const c = L.conns.find(x => x.straight && x.msg === ev.msg && (x.rel.from === who || x.rel.to === who));
      const vis = c ? (ev.verb === 'sent' ? clamp(drawn[c.i] * 4) : clamp((drawn[c.i] - 0.9) / 0.1)) : clamp((sep - 0.8) / 0.2);
      nodes[`ev${i}`] = {opacity: r(vis, 3)};
    });
    L.examBoxes.forEach((e, gi) => { nodes[`exam${gi}`] = {opacity: r(clamp((rel - 0.9) / 0.1), 3)}; });
    if (L.seqT) nodes.seqTitle = {opacity: r(clamp((sep - 0.6) / 0.4), 3)};
    // trace
    const tp = s('trace');
    const te = ease.inOutSine(tp);
    const tr = L.route.at(te);
    const tOn = L.route.runs.reduce((m0, [a, b]) => Math.max(m0, Math.min(clamp((te - a) / 0.015), clamp((b - te) / 0.015))), 0);
    const tVis = tp > 0 && tp < 1 && tOn > 0;
    nodes.tracer = {opacity: tVis ? r(tOn, 3) : 0, transform: T(tr.x, tr.y)};
    const visited = L.route.visits.filter(v => tp > 0 && te >= v.t - 1e-6).map(v => v.id);
    const fv = L.route.visits.find(v => v.id === p.focusElement);
    const near = fv && tp > 0 && tp < 1 ? clamp(1.4 - Math.abs(te - fv.t) / 0.2) : 0;
    const fs = 1 + 0.07 * ease.inOutSine(near);
    // cards: from the middle to their paths (separate); they keep their places at the gather
    const gth = ease.inOutCubic(s('gather'));
    // (copied: a document with rows under a cover opens — the motif's documents carry none by default)
    const unfOf = {proposal: ease.inOutSine(clamp((u - 0.355) / 0.04)), response: ease.inOutSine(clamp((u - 0.4) / 0.04))};
    const unf = unfOf.proposal;
    const pos = {};
    for (const m of L.active) {
      const q = L.rest[m];
      // the cards appear in their places while the parties move apart (they never slide over each other)
      const at = q;
      pos[m] = at;
      const sc = p.focusElement === m ? fs : 1;
      nodes[`card-${m[0]}`] = {transform: T(at.x, at.y, 0, r(sc, 4))};
      // the document opens once the relationships are drawn: its flap folds up about its fold line, its step rows appear
      const fy = foldOf(L.M, m, L.ch);
      const cm = m === 'proposal' ? L.M.prop : L.M.wd;
      const hasFlap = L.M.mode !== 'token' && (cm.terms.length > 0 || cm.steps > 0);
      const um = unfOf[m];
      if (hasFlap) nodes[`card-${m[0]}-flap`] = {transform: um >= 1 ? 'scale(1 0.001)' : `translate(0 ${r(fy, 2)}) scale(1 ${r(Math.max(0.001, 1 - um), 4)}) translate(0 ${r(-fy, 2)})`, opacity: um >= 1 ? 0 : 1};
      // (the row's print comes in only once the cover has lifted clear of it)
      nodes[`card-${m[0]}-attrs`] = {opacity: r(clamp((u - (m === 'proposal' ? 0.395 : 0.44)) / 0.02), 3)};
      // (the scroll rail draws down past the rows as the shade slides up)
      if (hasFlap) poseLink(nodes, `card-${m[0]}`, L.M, m, L.ch, um);
      nodes[`el-${m}`] = {opacity: r(clamp((sep - 0.3) / 0.5), 3)};
    }
    // the definition slip: with "defined term" it passes from the definitions sheet's dock into the contract's (its
    // print fades out before it leaves and back in once it lies in the other dock); with "no linked definition" it stays
    const dP = dockGeom(L.M, L.ch, 'proposal'), dR = dockGeom(L.M, L.ch, 'response');
    const both = L.active.includes('proposal') && L.active.includes('response');
    const moves = both && placementOf(p.status) === 'linked';
    const sTr = moves ? ease.inOutSine(seg(u, ...SLIP.move)) : 0;
    let slipPos = null;
    if (dP && L.active.includes('proposal')) {
      const scOf = m => (p.focusElement === m ? fs : 1);
      const at = (m, d) => ({x: pos[m].x + d.cx * scOf(m), y: pos[m].y + d.cy * scOf(m)});
      slipPos = sTr <= 0 || !moves ? at('proposal', dP) : sTr >= 1 ? at('response', dR) : {x: lerp(at('proposal', dP).x, at('response', dR).x, sTr), y: lerp(at('proposal', dP).y, at('response', dR).y, sTr)};
      nodes['card-p-slip'] = {opacity: sTr > 0 ? 0 : 1};
      if (L.active.includes('response')) nodes['card-r-slip'] = {opacity: sTr >= 1 ? 1 : 0};
      nodes.slipfly = {opacity: sTr > 0 && sTr < 1 ? 1 : 0, transform: T(r(slipPos.x, 2), r(slipPos.y, 2))};
      if (L.M.dock && L.M.dock.slip) {
        nodes['card-p-slip-txt'] = {opacity: r(moves ? 1 - seg(u, ...SLIP.fadeOut) : 1, 3)};
        if (L.active.includes('response')) nodes['card-r-slip-txt'] = {opacity: r(moves ? seg(u, ...SLIP.fadeIn) : 1, 3)};
        nodes['slipfly-s-txt'] = {opacity: 0};
      }
    }
    // the thread: once the contract is unfolded and the definition slip lies in its dock, it draws from the word's row
    // node to the slip — the word links to its definition (none when the slip stays outside the contract)
    const threadPr = moves && sTr >= 1 ? ease.inOutSine(seg(u, ...THREAD)) : 0;
    if (L.active.includes('response')) poseThread(nodes, 'card-r', L.M, L.cw, L.ch, threadPr);
    // focus swell on a party: the badge
    [0, 1].forEach(i => {
      const id = i ? 'offeree' : 'offeror';
      if (p.focusElement === id) nodes[`badge${i}-body`] = {transform: `scale(${r(fs, 4)})`};
    });
    // (the key is in view with the lanes: nothing is concluded at any moment)
    if (L.keyC) { nodes.key = {opacity: r(clamp((sep - 0.6) / 0.4), 3)}; if (L.keyC.cc) nodes.concept = {opacity: r(clamp((u - 0.78) / 0.04), 3)}; }
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const beat = u < 0.18 ? 'separate' : u < 0.43 ? 'relate' : u < 0.75 ? 'trace' : 'gather';
    const cross = Boolean(L.rest.cross);
    return {
      nodes,
      semantic: {
        connected: r(unf, 3), recorded: r(unfOf.response, 3), status: p.status, configShown: r(clamp((u - 0.78) / 0.04), 3),
        thread: r(threadPr, 3),
        placement: placementOf(p.status), slipOn: sTr <= 0 ? 'sheet' : sTr >= 1 ? 'contract' : 'moving', slip: slipPos ? P2(slipPos) : null,
        beat,
        separated: r(sep, 3),
        relationsDrawn: L.conns.map(c => r(drawn[c.i], 3)),
        relationKinds: L.conns.map(c => c.kind),
        arrows: L.conns.map(c => ({kind: c.kind, arrow: c.arrow})),
        tracerVisible: tVis,
        tracer: P2(tr),
        visitOrder: visited,
        focusScale: r(fs, 3),
        cardP: pos.proposal ? P2(pos.proposal) : null, cardR: pos.response ? P2(pos.response) : null,
        configuration: L.configuration, active: L.active,
        gathered: r(gth, 3),
        linesCross: cross,
        order: L.stations.map(st => st.events.map(e => e.event).join('+')),
        grouped: L.stations.some(st => st.grouped),
        // the time axis of the lanes, and the events supplied with one position (index groups into L.events)
        timeAxis: L.orient === 'v' ? 'y' : 'x',
        evMsg: L.events.map(e => e.msg),
        sameTime: [...new Set(L.events.filter(e => e.grouped).map(e => e.row))].map(k => L.events.map((e, i) => (e.row === k && e.grouped ? i : -1)).filter(i => i >= 0)),
        layoutOk: L.ok,
        why: (L.why || []).join(','),
        problems: L.problems,
        textPx: r(L.F * L.upx, 2),
        facePx: r(0.6 * L.Rb * L.upx, 1),
        badgePx: r(L.Rb * 2 * L.upx, 1),
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-02-mechanism',
    title: 'Defined term, without a rule — the documents\' journeys, the definition slip and the word\'s thread, on two lanes',
    titleEs: 'Término definido — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Término definido',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A time-lane diagram: Party A\'s lane and Party B\'s lane, the supplied order running along both. Party A\'s definitions sheet (●, a placeholder definition slip in its dock) and Party B\'s contract (◆, its row with the word under a cover sheet), at equal weight, each run on a solid line from the sender\'s lane to the other lane; only the supplied relationships are drawn (plain relations without arrowheads; nothing causal unless supplied). Then, with the supplied configuration "defined term", the definition slip passes from the sheet\'s dock into the contract\'s; the contract is unfolded and a thread draws from the word to the slip; with "term with no linked definition" the slip stays and no thread is drawn. A tracer follows the supplied traversal order; the focus element swells; at the gather the supplied configuration stands beside the key. No interpretation rule and no conclusion about what the word means.',
    tags: ['defined term', 'definition', 'definitions sheet', 'contract', 'unfold', 'thread', 'dock', 'lanes', 'sequence', 'relations', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/termino-definido.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(toInner(scene), defaultParams, defaultParamsEs),
});
