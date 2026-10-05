/**
 * LAW-0347 — Sustitución de decisión · contrast
 *
 * Storyboard (two complete, identical registry tables seen from above — side by
 * side on wide and square frames, stacked on tall ones — each with the rail:
 * intake tray, the position in its holder frame and the abutting history
 * pocket; card A ● lies in each position; a participant stands at each table;
 * the cards' supplied texts, the places and the shared facts are written ONCE in
 * a shared strip below the scenes):
 *  0.00–0.17  the same base situation twice: card A in the position, the intake
 *             trays empty, the history pockets empty.
 *  0.17–0.40  the ONE changed fact, localised: in scene B a later card (◆) is
 *             supplied into the intake tray; in scene A nothing is supplied (the
 *             tray stays empty). Both participants then reach for their tray.
 *  0.40–0.77  the same action in parallel, adapted only to that fact: in B the
 *             hands slide card B along the rail; it pushes card A into the
 *             history pocket, where A stays whole and visible; in A the hands
 *             find the tray empty and withdraw — card A stays in the position.
 *  0.77–1.00  a comparison guide rings both positions (the only detail that
 *             differs: what occupies the position) and links them to its label;
 *             a neutral note: two supplied situations, no winner, no conclusion.
 * Scenes have the same scale, timing and common elements; neither is marked as
 * right, better or valid; no rule, time limit or outcome; jurisdiction
 * unspecified.
 * @module animations/review/LAW-0347
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {actorLook} from '../../primitives/people-style.js';
import {pxPerUnit} from '../hearings/kits/apertura-audiencia.js';
import {planPerson, wallRing, floorArea, planColors} from '../courts/kits/courts-art.js';
import {reachRecords} from '../hearings/kits/hearings-art.js';
import {
  sdFields, SD_EN, SD_ES, localisedSd, fitG, textAt, cardModel, cardNode, railGeometry, railNode,
  legendIcon, laneColor, INK, R2,
} from './kits/sustitucion-de-decision.js';

const ID = 'LAW-0347';
const DURATION = 7500;
const W = {
  supply: [0.18, 0.3], reach: [0.31, 0.39], push: [0.41, 0.69], probe: [0.41, 0.47], withdraw: [0.5, 0.56],
  release: [0.69, 0.73], thread: [0.71, 0.77], guide: [0.78, 0.84], note: [0.8, 0.86],
};
const SIZES = [24, 23, 22, 21, 20.5, 19.5, 18.5, 17.5, 16.5, 16];

const OWN_EN = {
  scenarioA: {label: 'A · Initial result', caption: 'No later card is supplied (as supplied)'},
  scenarioB: {label: 'B · Later result supplied', caption: 'A later card is supplied (as supplied)'},
  changedFact: 'Changed fact: whether a later card is supplied to the intake tray',
  sharedFacts: ['Same rail: intake tray, position, history pocket', 'Same card A in the position at the start', 'Same participant and the same gesture'],
  comparisonLabels: {guide: 'Only this differs: what occupies the position (as supplied)', neutral: 'Two supplied situations side by side · no winner, no conclusion'},
};
const OWN_ES = {
  scenarioA: {label: 'A · Resultado inicial', caption: 'No se aporta tarjeta posterior (según lo aportado)'},
  scenarioB: {label: 'B · Resultado posterior suministrado', caption: 'Se aporta una tarjeta posterior (según lo aportado)'},
  changedFact: 'Hecho que cambia: si se aporta una tarjeta posterior a la bandeja',
  sharedFacts: ['Mismo carril: bandeja, posición, bolsillo de historial', 'Misma tarjeta A en la posición al inicio', 'Mismo participante y mismo gesto'],
  comparisonLabels: {guide: 'Solo esto difiere: qué ocupa la posición (según lo aportado)', neutral: 'Dos situaciones aportadas lado a lado · sin ganador, sin conclusión'},
};
const pick = o => ({decisions: o.decisions, labels: o.labels});
const EN = {...pick(SD_EN), ...OWN_EN};
const ES = {...pick(SD_ES), ...OWN_ES};
// (OMITTED brief fields — see the presets note: grounds, routes and outcomes. The places and the supplied states are
// shown physically in both scenes; the shared strip names the places once through the shared facts.)
const sceneSchema = {decisions: sdFields.decisions, labels: sdFields.labels, ...contrastFields()};
const defaultParams = {...EN};

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/** One scene's geometry inside a panel box (design units). */
function roomIn(box, F, showKey) {
  const wall = 14, pad = 6, ins = 9, m = 9, edge = 8;
  const gap = Math.max(34, F * 1.7);
  const innerW = box.w - 2 * (wall + pad) - 2 * edge;
  let cw = (innerW - 4 * ins - gap - 2 * m) / 3;
  const s = clamp(cw / 230, 0.6, 1.05);
  const fixed = 2 * wall + 2 * pad + 2 * m + 2 * ins + 2 * edge + 14 * s + 52 * s + 4;
  // card height: fills the room box (between 0.62 and 1.0 of the card width)
  const chK = clamp((box.h - 16 - fixed) / cw, 0.62, 1.9);
  const RGt = c => railGeometry({cw: c, ch: c * chK, gap, inset: ins, margin: m});
  const need = c => fixed - 2 * m - 2 * ins + RGt(c).H;
  while (need(cw) > box.h && cw > 40) cw -= 2;
  const RG = RGt(cw);
  const hh = Math.min(box.h, need(cw) + 16);
  const room = {x: box.x, y: box.y + (box.h - hh) / 2, w: box.w, h: hh};
  const table = {x: room.x + wall + pad, y: room.y + wall + pad + 6, w: room.w - 2 * (wall + pad), h: RG.H + 2 * edge};
  const rail = {x: table.x + (table.w - RG.W) / 2, y: table.y + edge};
  const toD = b => ({x: rail.x + b.x, y: rail.y + b.y, w: b.w, h: b.h});
  const cards = {intake: toD(RG.cards.intake), position: toD(RG.cards.position), history: toD(RG.cards.history)};
  const slots = {intake: toD(RG.intake), position: toD(RG.position), history: toD(RG.history)};
  const front = table.y + table.h;
  const personY = front + 14 * s;
  void showKey;
  return {room, wall, table, rail, RG, cards, slots, front, personY, s, cw, fits: need(cw) <= box.h + 0.5};
}

function compose(ctx, P, F, shape) {
  const D = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const problems = [];
  const mx = 16, my = 12;
  // square: the two scenes stacked on the left, the shared texts in a column on the right
  const side = shape === 'square';
  const stacked = shape === 'portrait' || side;
  const gapP = stacked ? 22 : 40;
  const sceneW = side ? (D.w - 2 * mx) * 0.6 : D.w - 2 * mx;
  const stripX = side ? mx + sceneW + 18 : mx;
  // shared strip rows (written once): cards, places, changed fact, shared facts, guide and neutral notes, key
  const left = [], right = [];
  if (showKey) {
    left.push({icon: 'a', text: P.decisions.initial, name: 'lg-a'});
    left.push({icon: 'b', text: P.decisions.later, name: 'lg-b'});
  }
  if (showAll) {
    left.push({icon: 'holder', text: P.decisions.position, name: 'lg-position'});
  }
  if (showKey) right.push({icon: 'fact', text: P.changedFact, name: 'fact', bold: true});
  if (showAll) (P.sharedFacts || []).forEach((t, i) => right.push({icon: 'dot', text: t, name: `shared${i}`}));
  if (showAll) right.push({icon: 'pips', text: P.labels.order, name: 'order-note'});
  if (showKey) right.push({icon: 'ring', text: P.comparisonLabels.guide, name: 'guide', late: true, bold: true});
  const cols = stacked ? 1 : 3;
  const colW = side ? D.w - mx - stripX : (D.w - 2 * mx - (cols - 1) * F * 1.6) / cols;
  const iconW = F * 1.9;
  const fitRows = rows => rows.map(q => ({...q, fit: fitG(q.text, {maxWidth: colW - iconW, size: F, minSize: F, maxLines: 3, weight: q.bold ? 700 : 500})}));
  let L1 = fitRows(left), R1 = fitRows(right);
  let R2 = [];
  if (stacked) { L1 = [...L1, ...R1]; R1 = []; }
  else { const cut = Math.ceil(R1.length / 2); R2 = R1.slice(cut); R1 = R1.slice(0, cut); }
  [...L1, ...R1, ...R2].forEach(q => { if (!q.fit.ok) problems.push(`row-${q.name}`); });
  const place = rows => { let y = 0; rows.forEach(q => { q.y = y; y += q.fit.height + F * 0.45; }); return Math.max(0, y - F * 0.45); };
  const hL = place(L1), hR = Math.max(place(R1), place(R2));
  // guide label and neutral note (full width, centred), then the key
  // the neutral note and the key go under the shorter column (side by side) or under the single column
  const noteW = side ? colW : stacked ? Math.min(D.w - 2 * mx, F * 34) : colW;
  const note = showAll ? fitG(P.comparisonLabels.neutral, {maxWidth: noteW, size: F, minSize: F, maxLines: 3, weight: 600}) : null;
  const key = showKey ? fitG(P.labels.key, {maxWidth: noteW, size: F, minSize: F, maxLines: 2, weight: 600}) : null;
  for (const f of [note, key]) if (f && !f.ok) problems.push('notes');
  const guideH = F * 0.6;
  const notesH = (note ? F * 0.6 + note.height : 0) + (key ? F * 0.5 + key.height : 0);
  const noteCol = 0;
  const stripH = stacked ? Math.max(hL, hR) + notesH : Math.max(noteCol === 0 ? hL + notesH : hL, noteCol === 1 ? hR + notesH : hR);
  // headers
  const headW = stacked ? sceneW - F * 3 : (D.w - 2 * mx - gapP) / 2 - F * 3;
  const head = sc => {
    const lab = showKey ? fitG(sc.label, {maxWidth: headW, size: F * 1.1, minSize: F, maxLines: 2, weight: 700}) : null;
    const cap = showAll && sc.caption ? fitG(sc.caption, {maxWidth: headW, size: F, minSize: F, maxLines: 2, weight: 500}) : null;
    if ((lab && !lab.ok) || (cap && !cap.ok)) problems.push('header');
    return {lab, cap, h: Math.max(F * 2.2, (lab ? lab.height : 0) + (cap ? F * 0.25 + cap.height : 0))};
  };
  const hA = head(P.scenarioA), hB = head(P.scenarioB);
  const headH = Math.max(hA.h, hB.h) + F * 0.85;
  // scenes
  const avail = side ? D.h - 2 * my : D.h - 2 * my - stripH - guideH - F * 0.6;
  if (side && stripH > D.h - 2 * my) problems.push('strip');
  let panels;
  if (!stacked) {
    const pw = (D.w - 2 * mx - gapP) / 2;
    const roomH = avail - headH;
    panels = [0, 1].map(i => ({x: mx + i * (pw + gapP), y: my, w: pw, h: roomH, headY: my}));
    panels.forEach(p => { p.box = {x: p.x, y: p.y + headH, w: p.w, h: p.h}; });
  } else {
    const ph = (avail - gapP) / 2 - headH;
    panels = [0, 1].map(i => ({x: mx, y: my + i * (ph + headH + gapP), w: sceneW, h: ph}));
    panels.forEach(p => { p.headY = p.y; p.box = {x: p.x, y: p.y + headH, w: p.w, h: p.h}; });
  }
  const rooms = panels.map(p => roomIn(p.box, F, showKey));
  // both rooms identical in size (same scale): use the smaller card width
  const cwMin = Math.min(...rooms.map(q => q.cw));
  const R0 = panels.map(p => roomIn({...p.box}, F, showKey));
  void R0;
  if (rooms.some(q => !q.fits)) problems.push('room-height');
  if (rooms[0].s * 100 * pxPerUnit(ctx) < (shape === 'square' ? 55 : 60) - 0.01) problems.push('person-small');
  const roomBottom = Math.max(...rooms.map(q => q.room.y + q.room.h));
  const guideY = roomBottom + F * 0.5;
  const stripY = side ? Math.max(my, (D.h - stripH) / 2) : guideY + guideH;
  if (!side && stripY + stripH > D.h - my + 0.5) problems.push('strip');
  void cwMin;
  return {stripH, my, stripX, side, problems, F, stacked, panels, rooms, heads: [hA, hB], headH, L1, R1, R2, colW, iconW, cols, note, key, noteCol, guideY, stripY, hL, hR, mx};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1359]},
  layout(ctx) {
    const P = localisedSd(ctx, EN, ES);
    const px = pxPerUnit(ctx);
    let best = null;
    for (const Fp of SIZES) {
      const L = compose(ctx, P, Fp / px, ctx.view.shape);
      if (!best || L.problems.length < best.problems.length) best = L;
      if (!L.problems.length) { best = L; break; }
    }
    const L = best;
    L.P = P;
    L.px = px;
    // card model (no text in the scenes: the texts are written once in the strip)
    L.CM = L.rooms.map(q => cardModel(ctx, {w: q.cw, F: Math.min(q.cw * 0.12, q.RG.ch / 6.2), a: '', b: '', showText: false, fixH: q.RG.ch, bars: 2}));
    L.looks = [actorLook(ctx, {appearance: {outfit: 0}}, 0), actorLook(ctx, {appearance: {outfit: 0}}, 0)];
    L.rigs = ['ra-p0', 'rb-p0'].map((name, i) => planPerson(ctx, {name, look: L.looks[i]}));
    // scale the whole composition up into any free space of the design box (it then spans the safe box)
    const D = ctx.design;
    const bx0 = Math.min(...L.panels.map(q => q.x)), by0 = Math.min(...L.panels.map(q => q.headY));
    const bx1 = Math.max(...L.rooms.map(q => q.room.x + q.room.w), L.stripX + (L.stacked ? L.colW : L.colW * 3 + L.F * 3.2));
    const by1 = Math.max(...L.rooms.map(q => q.room.y + q.room.h), L.stripY + L.stripH);
    const kf = Math.min(1.6, (D.w - 8) / (bx1 - bx0), (D.h - 8) / (by1 - by0));
    L.fit = kf > 1.01 ? {k: kf, tx: (D.w - (bx1 - bx0) * kf) / 2 - bx0 * kf, ty: (D.h - (by1 - by0) * kf) / 2 - by0 * kf} : null;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const pc = planColors(ctx);
    const F = L.F;
    const P = L.P;
    const parts = [];
    ['a', 'b'].forEach((side, i) => {
      const q = L.rooms[i];
      const pre = side === 'a' ? 'ra' : 'rb';
      const pnl = L.panels[i];
      const hd = L.heads[i];
      // header: letter badge in the lane colour + label + caption
      const bR = F * 0.95;
      const hx = pnl.x, hy = pnl.headY;
      parts.push(g({name: `${pre}-head`},
        h('circle', {name: `${pre}-badge`, cx: r(hx + bR), cy: r(hy + bR + 2), r: r(bR), fill: laneColor(ctx, side), stroke: INK, 'stroke-width': 2.5}),
        ctx.show('key') ? h('text', {x: r(hx + bR), y: r(hy + bR + 2 + F * 0.38), 'text-anchor': 'middle', 'font-size': r(F * 1.05, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, side.toUpperCase()) : null,
        hd.lab ? textAt(hd.lab, {x: hx + bR * 2 + F * 0.6, y: hy, fill: th.fg, name: `${pre}-label`}) : null,
        hd.cap ? textAt(hd.cap, {x: hx + bR * 2 + F * 0.6, y: hy + (hd.lab ? hd.lab.height + F * 0.25 : 0), fill: th.fgSoft, italic: true, name: `${pre}-caption`}) : null));
      // room
      const R = q.room;
      parts.push(g({name: `${pre}-room`},
        floorArea(ctx, {name: `${pre}-floor`, x: R.x + q.wall, y: R.y + q.wall, w: R.w - 2 * q.wall, h: R.h - 2 * q.wall, kind: 'tiles', cell: 52}),
        wallRing(ctx, {name: `${pre}-walls`, x: R.x, y: R.y, w: R.w, h: R.h, t: q.wall})));
      const tb = q.table;
      parts.push(g({name: `${pre}-table`},
        h('path', {d: roundRectPath(tb.x + 5, tb.y + 8, tb.w, tb.h, 14), fill: th.shadow}),
        h('path', {d: roundRectPath(tb.x, tb.y, tb.w, tb.h, 14), fill: pc.wood, stroke: INK, 'stroke-width': 2.5})));
      parts.push(g({transform: T(q.rail.x, q.rail.y)}, railNode(ctx, q.RG, {prefix: `${pre}-rail`})));
      const cp = q.cards.position, ch = q.cards.history;
      const ty = cp.y + cp.h + q.RG.ins * 0.55;
      const tl = ch.x + ch.w / 2 - (cp.x + cp.w / 2);
      parts.push(g({name: `${pre}-thread`, opacity: 0},
        h('line', {name: `${pre}-thread-line`, x1: r(cp.x + cp.w / 2), x2: r(ch.x + ch.w / 2), y1: r(ty), y2: r(ty), stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(tl)} ${r(tl + 4)}`, 'stroke-dashoffset': r(tl), 'data-draw': 1}),
        h('circle', {cx: r(cp.x + cp.w / 2), cy: r(ty), r: 4.5, fill: th.accent2}), h('circle', {cx: r(ch.x + ch.w / 2), cy: r(ty), r: 4.5, fill: th.accent2})));
      parts.push(g({name: `${pre}-cardA`, transform: T(cp.x, cp.y)}, cardNode(ctx, L.CM[i], {prefix: `${pre}-a`, side: 'a', order: 1, text: false})));
      // card B exists only in scene B (supplied there); scene A never draws it
      if (side === 'b') parts.push(g({name: `${pre}-cardB`, transform: T(q.cards.intake.x, q.cards.intake.y), opacity: 0}, cardNode(ctx, L.CM[i], {prefix: `${pre}-b`, side: 'b', order: 2, text: false})));
      // guide ring round the position (hollow)
      const ps = q.slots.position;
      parts.push(h('path', {name: `${pre}-ring`, d: roundRectPath(ps.x - 7, ps.y - 7, q.cw + q.RG.ins * 2 + 14, ps.h + 14, 14), fill: 'none', stroke: th.accent3, 'stroke-width': 5, opacity: 0}));
      parts.push(L.rigs[i].node);
    });
    // shared strip
    const strip = [];
    const iconAt = (q, x, y) => {
      const cy = y + Math.min(q.fit.height, F * 1.2) / 2;
      const ix = x + F * 0.75;
      if (q.icon === 'a' || q.icon === 'b' || q.icon === 'intake' || q.icon === 'holder' || q.icon === 'pocket' || q.icon === 'pips') return g({transform: T(ix, cy)}, legendIcon(ctx, q.icon, F * 1.2));
      if (q.icon === 'fact') return h('path', {d: roundRectPath(ix - F * 0.5, cy - F * 0.4, F, F * 0.8, 4), fill: 'none', stroke: th.accent3, 'stroke-width': 3, transform: ''});
      if (q.icon === 'ring') return h('path', {d: roundRectPath(ix - F * 0.55, cy - F * 0.45, F * 1.1, F * 0.9, 5), fill: 'none', stroke: th.accent3, 'stroke-width': 3.5});
      if (q.icon === 'stateA') return h('circle', {cx: r(ix), cy: r(cy), r: r(F * 0.26), fill: th.accent2, stroke: INK, 'stroke-width': 1.5});
      if (q.icon === 'stateB') return h('circle', {cx: r(ix), cy: r(cy), r: r(F * 0.26), fill: th.accent3, stroke: INK, 'stroke-width': 1.5});
      if (q.icon === 'note') return h('path', {d: `M${r(ix - F * 0.4)} ${r(cy - F * 0.45)}H${r(ix + F * 0.25)}L${r(ix + F * 0.45)} ${r(cy - F * 0.25)}V${r(cy + F * 0.45)}H${r(ix - F * 0.4)}Z`, fill: '#fff8dc', stroke: INK, 'stroke-width': 1.5});
      return h('circle', {cx: r(ix), cy: r(cy), r: r(F * 0.16), fill: th.fgSoft});
    };
    [L.L1, L.R1, L.R2].forEach((rows, c) => {
      const x0 = L.stripX + c * (L.colW + F * 1.6);
      for (const q of rows) {
        const y = L.stripY + q.y;
        strip.push(g({name: q.name, opacity: q.late ? 0 : undefined}, iconAt(q, x0, y), textAt(q.fit, {x: x0 + L.iconW, y, fill: th.fg})));
      }
    });
    const base = L.stripY + (L.stacked ? Math.max(L.hL, L.hR) : L.noteCol === 0 ? L.hL : L.hR);
    const nx = L.stripX + (L.stacked ? 0 : L.noteCol * (L.colW + F * 1.6));
    if (L.note) strip.push(g({name: 'note', opacity: 0}, textAt(L.note, {x: nx, y: base + F * 0.6, fill: th.fg, name: 'note-text'})));
    if (L.key) {
      const ky = base + (L.note ? F * 0.6 + L.note.height : 0) + F * 0.5;
      strip.push(g({name: 'key'}, h('line', {x1: r(nx), x2: r(nx + Math.max(L.key.width, F * 6)), y1: r(ky - F * 0.25), y2: r(ky - F * 0.25), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}), textAt(L.key, {x: nx, y: ky, fill: th.fg, italic: true})));
    }
    parts.push(g({name: 'strip'}, strip));
    return L.fit ? g({transform: `translate(${r(L.fit.tx)} ${r(L.fit.ty)}) scale(${r(L.fit.k, 4)})`}, parts) : g(null, parts);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const supply = ease.inOutCubic(seg(u, ...W.supply));
    const reach = seg(u, ...W.reach) * (1 - seg(u, ...W.release));
    const looks = [];
    const sem = {};
    ['a', 'b'].forEach((side, i) => {
      const q = L.rooms[i];
      const pre = side === 'a' ? 'ra' : 'rb';
      const s = q.s;
      const ci = q.cards.intake, cp = q.cards.position;
      const isB = side === 'b';
      const p = isB ? ease.inOutSine(seg(u, ...W.push)) : 0;
      const travel = p * q.RG.travelB;
      const contact = q.RG.travelB - q.RG.travelA;
      const bx = ci.x + travel;
      const ax = cp.x + Math.max(0, travel - contact);
      // card B is supplied into scene B's tray: it slides in from the table's left edge
      if (isB) {
        const enter = (1 - supply) * Math.min(ci.x - q.table.x + 6, q.cw * 0.5);
        nodes[`${pre}-cardB`] = {transform: T(bx - enter, ci.y), opacity: r(clamp(supply * 1.6), 3)};
      }
      nodes[`${pre}-cardA`] = {transform: T(ax, cp.y)};
      // participant: both reach for the tray; in A the hands find it empty and withdraw (the same gesture)
      const withdraw = isB ? 0 : seg(u, ...W.withdraw);
      const rk = isB ? reach : seg(u, ...W.reach) * (1 - withdraw);
      const pose = {x: ci.x + ci.w / 2 + travel, y: q.personY, deg: 0, scale: s, phase: (travel / (34 * s)) * Math.PI, walk: isB ? 0.75 * Math.sin(Math.PI * seg(u, ...W.push)) : 0, seated: 0};
      Object.assign(nodes, L.rigs[i].pose(pose));
      const hx = Math.min(50 * s, q.cw * 0.3);
      const cb = ci.y + q.RG.ch;
      // A: the hands rest on the empty tray's floor edge; B: on card B's near edge
      const tl = {x: bx + q.cw / 2 - hx, y: cb - 7}, tr = {x: bx + q.cw / 2 + hx, y: cb - 7};
      const rl = reachRecords({name: `${pre}-p0`}, pose, tl, {arm: 'armL', k: rk});
      const rr = reachRecords({name: `${pre}-p0`}, pose, tr, {arm: 'armR', k: rk});
      Object.assign(nodes, rl.nodes, rr.nodes);
      const done = isB && p >= 1;
      const th = done ? ease.inOutSine(seg(u, ...W.thread)) : 0;
      const tlen = q.cards.history.x - q.cards.position.x;
      nodes[`${pre}-thread`] = {opacity: th > 0 ? 1 : 0};
      nodes[`${pre}-thread-line`] = {'stroke-dashoffset': r(tlen * (1 - th))};
      nodes[`${pre}-rail-pocket-glow`] = {opacity: r(done ? 0.85 * seg(u, ...W.thread) : 0, 3)};
      nodes[`${pre}-ring`] = {opacity: r(seg(u, ...W.guide), 3)};
      looks.push({
        position: travel >= q.RG.travelB - 0.5 ? 'B' : travel > contact ? 'moving' : 'A',
        intake: isB && supply > 0 ? (travel > 0 ? 'emptied' : 'card B') : 'empty',
        history: ax >= cp.x + q.RG.travelA - 0.5 ? 'A' : ax > cp.x ? 'filling' : 'empty',
        reach: r(rk, 2),
        person: r(pose.x - q.room.x, 1),
      });
      sem[side] = {cardA: R2({x: ax, y: cp.y}), cardB: isB ? R2({x: bx, y: ci.y}) : null, person: R2(pose), handL: R2(rl.hand), handR: R2(rr.hand), gripL: R2(tl), gripR: R2(tr), reached: rk < 0.01 || (rl.reached && rr.reached)};
    });
    if (L.note) nodes.note = {opacity: r(seg(u, ...W.note), 3)};
    const st = r(seg(u, ...W.guide), 3);
    for (const q of [...L.L1, ...L.R1, ...L.R2]) if (q.late) nodes[q.name] = {opacity: st};
    return {
      nodes,
      semantic: {
        beat: u < 0.17 ? 'base' : u < 0.4 ? 'change' : u < 0.77 ? 'parallel' : 'guide',
        lookA: looks[0],
        lookB: looks[1],
        aCardA: sem.a.cardA, bCardA: sem.b.cardA, bCardB: sem.b.cardB,
        aPerson: sem.a.person, bPerson: sem.b.person,
        aHandL: sem.a.handL, aHandR: sem.a.handR, bHandL: sem.b.handL, bHandR: sem.b.handR,
        bGripL: sem.b.gripL, bGripR: sem.b.gripR,
        supplied: r(supply, 3),
        guide: r(seg(u, ...W.guide), 3),
        note: r(seg(u, ...W.note), 3),
        allReached: sem.a.reached && sem.b.reached,
        sameScale: Math.abs(L.rooms[0].cw - L.rooms[1].cw) < 0.01 && Math.abs(L.rooms[0].room.w - L.rooms[1].room.w) < 0.01 && Math.abs(L.rooms[0].room.h - L.rooms[1].room.h) < 0.01,
        arrangement: L.stacked ? 'column' : 'row',
        textColumn: L.side,
        personPx: r(L.rooms[0].s * 100 * L.px, 1),
        textPx: r(L.F * L.px, 2),
        problems: L.problems,
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
    slug: 'review-07-contrast',
    title: 'Decision substitution — two identical tables: only in B is a later card supplied, slid into the position, pushing card A into the history pocket',
    titleEs: 'Sustitución de decisión — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Sustitución de decisión',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete, identical registry tables seen from above (side by side, or stacked on tall frames), same scale and timing. Each has the rail — intake tray, the position in its holder frame, the history pocket — with card A (●, initial result) in the position and a participant. The one changed fact, localised: only in B is a later card (◆) supplied to the tray; both participants reach for their tray; in B the hands slide card B into the position and it pushes card A into the history pocket, where A stays visible; in A the tray is empty and card A stays. A guide rings both positions (what occupies the position is the only difference) and a neutral note says: no winner, no conclusion. Texts are written once in a shared strip. Illustrative; jurisdiction unspecified.',
    tags: ['review', 'decision substitution', 'contrast', 'paired scenes', 'changed fact', 'history kept', 'as supplied', 'equal weight', 'no winner'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/sustitucion-de-decision.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
