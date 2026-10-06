/**
 * LAW-0514 — Orden de documentos · mechanism
 *
 * Storyboard (an exploded assembly: the order list, a rack of guide rods on the contract's base plate, the annex
 * layers (capas) parked apart):
 *  0.00–0.15  rest: the contract card "CT-208 · Services contract (fictional)" shows the clause heading, its supplied
 *             text and the supplied ORDER LIST (position discs, tab letters, labels). Beside it stands an empty rack:
 *             four guide rods rising from the contract's base plate, with a numbered level disc for each position.
 *             The annex layers — thin isometric sheets, one hue each, label and tab letter printed on them — are parked
 *             in their supplied numbering (A, B, C …), not in the listed order.
 *  0.15–0.42  a tracer walks the list in the supplied traversal order; for each line a plain connector (no arrowhead:
 *             a relation, not a cause) is drawn from the line's edge to the layer it names; it ends on the layer's edge.
 *  0.42–0.71  the layers slide, one at a time in the same order, onto the rods at the level of their listed position
 *             (the moving sheet's print is hidden while it crosses the others); each connector stays anchored to its
 *             layer and ends as a short, non-crossing line from list line k to level k.
 *  0.71–0.79  focus: a loupe settles on the level disc of the supplied focus position and its layer enlarges slightly.
 *  0.76–1.00  hold: "Priority document (as supplied)" beside level 1 and "Subordinate document, as configured" beside the
 *             last level (equal weight), the relation legend and the key "As supplied · no conclusion drawn".
 * The relation is only "listed in position k"; nothing prevails, governs or wins beyond the supplied list.
 * @module animations/contract-terms/LAW-0514
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, obj, int, oneOf} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, schedulesField, prioritiesField, stateLabelsField,
  orderOf, longest, localizeScene, unitPx, fitG, fitK, txt, chipG, cardText, placeCardRows, contractCard, positionDisc,
  tabChip, loupe, placeNotes, hueOf, softOf, P2, box2, shade,
} from './kits/orden-documentos.js';

const ID = 'LAW-0514';
const DURATION = 7000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {trace: [0.15, 0.42], slide: [0.42, 0.71], focus: [0.71, 0.79], tags: [0.76, 0.81], key: [0.79, 0.84], legend: [0.15, 0.2]};
const ACTION_END = 0.79;

const strings = {
  en: {...KIT_STRINGS.en},
  es: {...KIT_STRINGS.es},
};

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  schedules: schedulesField,
  priorities: prioritiesField,
  stateLabels: stateLabelsField,
  relationLabels: obj('Legend of the connectors (a plain relation, never a cause)', {position: str('Legend for a connector (e.g. "Line = listed in this position (as supplied)")', 60)}),
  focusElement: int('Position (1 = first listed) whose layer the loupe frames and enlarges at the end (clamped to the list)', 1, 4),
  traversalOrder: oneOf('Order in which the tracer walks the list and the layers slide in', ['top-down', 'bottom-up']),
  actionProgress: {type: 'number', minimum: 0, maximum: 1, description: 'How far the mechanism is allowed to progress (1 = complete; lower values freeze it part-way)'},
};

const defaultParams = {
  ...CONTENT,
  relationLabels: {position: 'Line = listed in this position (as supplied)'},
  focusElement: 1,
  traversalOrder: 'top-down',
  actionProgress: 1,
};
const defaultParamsEs = {
  ...CONTENT_ES,
  relationLabels: {position: 'Línea = figura en esta posición (según lo aportado)'},
};

const isStress = p => p.clause.text.length > 60 || [p.contract.title, p.clause.heading, p.stateLabels.priority, p.stateLabels.subordinate, ...p.schedules.map(s => s.label)].some(t => t.length > 46) || p.relationLabels.position.length > 56;

/* ---------------------------------------------------------------------- */
/* Layout                                                                  */
/* ---------------------------------------------------------------------- */

function geom(ctx, F, minF, mode, cwPick) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 30, g2 = 24;
  const gap = mode === 'above' ? 46 : 70;
  const order = orderOf(p);
  const n = order.length;
  const ns = p.schedules.length;
  const discR = F * 0.9;
  const discCol = discR * 2 + 26;
  const shape = ctx.view.shape;
  // ---- the card column (card on top, legend / key / tags below it) and the assembly area
  const cwF = cwPick ?? (mode === 'beside' ? (shape === 'landscape' ? 0.3 : 0.36) : (stress ? 0.46 : 0.5));
  const cw = clamp(D.w * cwF, 340, 600);
  // ('above' mode: the right end of each row stays free for the connectors leaving the card towards the parked layers)
  const C = cardText(p, order, cw, F, minF, {stress, rightPad: mode === 'above' ? 40 : 0});
  if (C.bad) why.push('card-fit');
  const card = {x: m, y: m, w: cw, h: Math.min(D.h - 2 * m, C.need + 6)};
  if (C.need > D.h - 2 * m + 0.5) why.push('card-text');
  const rows = placeCardRows(C, card.h, F);
  const area = {x: m + cw + gap, y: m, w: D.w - 2 * m - cw - gap, h: D.h - 2 * m};
  // ---- layers
  const tabS = F * 1.4;
  const colW = mode === 'beside' ? (area.w - discCol - g2) / 2 : area.w - discCol;
  const lw = mode === 'beside' ? colW / 1.2 : Math.min(colW, cw - 40) / 1.2, sk = lw * 0.2;
  const labW = lw - tabS - 46 - sk * 0.5;
  const labs = p.schedules.map(sc => fitK(sc.label, {maxWidth: labW, size: F, minSize: minF, maxLines: stress ? 5 : 4, weight: 700}));
  if (labs.some(f => f.bad)) why.push('layer-text');
  const labH = Math.max(...labs.map(f => f.height), tabS);
  const th = 12;
  const baseH = Math.max(F * 2.2, 64);
  const ld = Math.max(lw * 0.28, labH + 28);
  // legend and key: under the card ('beside') or at the foot of the card column ('above'); the legend shows from the trace
  const contentMin = Math.min(F, ...labs.map(f => f.size), ...C.rows.map(f => f.size), C.text ? C.text.size : F);
  const noteDefs = [show && p.relationLabels.position ? {name: 'legend', kind: 'legend', text: p.relationLabels.position} : null, showKey ? {name: 'key', kind: 'key', text: ctx.t.key} : null].filter(Boolean);
  const noteOpt = q => ({maxWidth: card.w, size: q.kind === 'key' ? contentMin : F, minSize: Math.min(minF, q.kind === 'key' ? contentMin : F), maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'legend' ? ctx.theme.accent2Soft : ctx.theme.card});
  const noteHs = noteDefs.map(q => chipG(ctx, q.text, {x: 0, y: 0, ...noteOpt(q)}).box.h);
  const notesH = noteHs.reduce((a, b) => a + b + 14, 0);
  const legendTop = mode === 'beside' ? card.y + card.h + 22 : D.h - m - notesH + 14;
  let rackTop, rackBot, parkTop, parkBot, rackX, parkX;
  if (mode === 'beside') {
    rackX = area.x; parkX = area.x + colW + discCol + g2;
    rackTop = area.y; rackBot = area.y + area.h;
    parkTop = area.y + ld + 6; parkBot = area.y + area.h - th - 6;
  } else {
    // the rack takes the whole right column; the layers park in the card column, under the card
    rackX = area.x; parkX = card.x + 14;
    parkTop = card.y + card.h + 34 + ld; parkBot = legendTop - 30 - th;
    rackTop = area.y; rackBot = area.y + area.h;
  }
  const pitchMax = (rackBot - rackTop - baseH - 30 - ld) / Math.max(1, n - 1);
  if (n > 1 && ld + th + 8 > pitchMax) why.push('layer-depth');
  const pitch = n > 1 ? Math.min(pitchMax, ld + th + 70) : 0;
  const stackH = pitch * (n - 1) + ld + th + baseH + 30;
  const top = rackTop + (rackBot - rackTop - stackH) * 0.5 + ld;
  const levels = Array.from({length: n}, (_, k) => ({x: rackX, y: top + k * pitch}));
  const baseY = levels[n - 1].y + th + 20 + baseH * 0.5;
  const spread = ns > 1 ? (parkBot - parkTop) / (ns - 1) : 0;
  if (ns > 1 && spread < ld + th + 10) why.push('park-tight');
  const parks = p.schedules.map((_, i) => ({x: parkX + (i % 2 ? sk * 0.7 : 0), y: ns > 1 ? parkTop + i * spread : (parkTop + parkBot) / 2}));
  const discX = rackX + lw + sk + 14 + discR;
  const rowA = k => ({x: card.x + card.w, y: card.y + rows[k].y + rows[k].h / 2});
  // a connector ends on the layer edge facing the card: the left edge on the rack (and on the parking column in
  // 'beside' mode); in 'above' mode the parked layers lie under the card, so there it ends on their right edge and
  // the end glides to the left edge while the layer slides across (its print is hidden then)
  const layerB = (P0, slideT = 1) => {
    const left = {x: P0.x + sk / 2, y: P0.y - ld / 2};
    if (mode === 'beside') return left;
    const right = {x: P0.x + lw + sk / 2, y: P0.y - ld / 2};
    return {x: lerp(right.x, left.x, slideT), y: left.y};
  };
  // ---- notes
  const placed = [];
  const below = {x: card.x, w: card.w, top: legendTop, bottom: D.h - m};
  const tagCol = mode === 'beside' ? {x: parkX - 6, w: colW + 12, top: area.y + 4, bottom: area.y + area.h - 4} : {x: card.x, w: card.w, top: card.y + card.h + 18, bottom: legendTop - 14};
  const busy = [];
  const worstTag = longest([p.stateLabels.priority, p.stateLabels.subordinate]);
  const tagNotes = show ? [{name: 'tagP', kind: 'tag', text: p.stateLabels.priority, k: 0}, {name: 'tagS', kind: 'tag', text: p.stateLabels.subordinate, k: n - 1}] : [];
  let yB = below.top;
  for (const q of noteDefs) {
    const c = chipG(ctx, q.text, {x: below.x, y: yB, ...noteOpt(q)});
    if (c.bad || yB + c.box.h > below.bottom + 0.5) why.push(`note-${q.name}`);
    placed.push({q, c});
    yB += c.box.h + 14;
  }
  for (const q of tagNotes) {
    const c0 = chipG(ctx, worstTag, {x: tagCol.x, y: 0, maxWidth: tagCol.w, size: F, minSize: minF, maxLines: 4, weight: 700});
    const cy = levels[q.k].y - ld / 2;
    let y = clamp(cy - c0.box.h / 2, tagCol.top, tagCol.bottom - c0.box.h);
    for (let it = 0; it < 3; it++) for (const b of busy) if (y < b.y + b.h + 12 && y + c0.box.h > b.y - 12) y = b.y + b.h + 14;
    const c = chipG(ctx, q.text, {x: tagCol.x, y, maxWidth: tagCol.w, size: F, minSize: minF, maxLines: 4, weight: 700, name: q.name, fill: '#fffaf0'});
    if (c0.bad || y + c0.box.h > tagCol.bottom + 0.5 || y < tagCol.top - 0.5) why.push(`note-${q.name}`);
    placed.push({q, c});
    busy.push({y, h: c0.box.h});
  }
  return {
    ok: !why.length, why, F, minF, mode, side: 'left', order, n, card, C, rows, area, lw, sk, ld, th, tabS, labs, levels, parks, baseY, baseH,
    rackX, parkX, colW, discR, discX, rowA, layerB, placed, stress, pitch,
    parkBoard: mode === 'beside' ? {x: parkX - 16, y: area.y, w: colW + 24, h: area.h} : {x: card.x, y: card.y + card.h + 16, w: card.w, h: legendTop - 16 - (card.y + card.h + 16)},
  };
}

/* ---------------------------------------------------------------------- */
/* Art                                                                     */
/* ---------------------------------------------------------------------- */

/** An isometric annex layer; origin = front-left corner. `print` groups the label so it can be hidden in motion. */
function layerArt(ctx, L, si, show, name) {
  const {lw, sk, ld, th, tabS} = L;
  const hue = hueOf(si);
  const top = `M0 0L${r(lw)} 0L${r(lw + sk)} ${r(-ld)}L${r(sk)} ${r(-ld)}Z`;
  const fit = L.labs[si];
  const cx = sk / 2 + 18;
  const cy = -ld / 2;
  const p = ctx.params;
  return g({name},
    h('path', {d: `M0 0L${r(lw)} 0L${r(lw)} ${r(th)}L0 ${r(th)}Z`, fill: shade(hue, -0.3), stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(lw)} 0L${r(lw + sk)} ${r(-ld)}L${r(lw + sk)} ${r(-ld + th)}L${r(lw)} ${r(th)}Z`, fill: shade(hue, -0.4), stroke: INK, 'stroke-width': 2}),
    h('path', {d: top, fill: softOf(si), stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(sk * 0.08)} ${r(-ld * 0.08)}L${r(lw * 0.06)} 0`, stroke: hue, 'stroke-width': 10}),
    h('path', {d: `M0 0L${r(sk)} ${r(-ld)}`, stroke: hue, 'stroke-width': 9, 'stroke-linecap': 'round'}),
    g({name: `${name}-print`},
      tabChip(ctx, cx, cy - tabS / 2, tabS, si, p.schedules[si].tab, show),
      show ? txt(fit, {x: cx + tabS + 12, y: cy - fit.height / 2, fill: INK}) : h('path', {d: `M${r(cx + tabS + 12)} ${r(cy)}h${r(Math.min(lw - tabS - 60, 180))}`, stroke: shade(hueOf(si), 0.3), 'stroke-width': 10, 'stroke-linecap': 'round'}),
    ),
  );
}

const scene = {
  sizes: {landscape: [1800, 790], square: [1240, 960], portrait: [900, 1290]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const shape = ctx.view.shape;
    const modes = shape === 'portrait' ? [['above']] : shape === 'landscape' ? [['beside']] : [['beside', 0.36], ['beside', 0.31], ['beside', 0.41], ['above']];
    let L = null, first = null;
    const tried = [];
    outer: for (const fpx of stress ? [23, 21.5, 20, 18.5, 17.2] : [28, 26.5, 25, 23.5, 22, 20.5]) {
      for (const [mode, cwPick] of modes) {
        L = geom(ctx, fpx / upx, minF, mode, cwPick);
        if (!first) first = L;
        tried.push(`${fpx}/${mode}${cwPick || ''}:${L.why.join('+')}`);
        if (L.ok) break outer;
      }
    }
    if (!L.ok) L = first;
    L.upx = upx;
    L.tried = tried;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const {card, C} = L;
    const cardNode = g({transform: T(card.x, card.y)}, contractCard(ctx, {prefix: 'c-', w: card.w, h: card.h, C, rows: L.rows, order: L.order, show, p}));
    // rack: base plate (the contract's base) and four rods
    const x0 = L.rackX - 30, x1 = L.rackX + L.lw + L.sk + 30;
    const yTop = L.levels[0].y - L.ld - 40;
    const baseTop = L.baseY - L.baseH / 2;
    const rodXs = [L.rackX + 6, L.rackX + L.lw - 6];
    const backXs = [L.rackX + L.sk + 6, L.rackX + L.lw + L.sk - 6];
    const refFit = show ? fitG(p.contract.reference, {maxWidth: L.lw - 40, size: Math.max(L.minF, L.F * 0.9), minSize: L.minF, maxLines: 1, weight: 800}) : null;
    const base = g(null,
      h('path', {d: `M${r(x0)} ${r(baseTop + L.baseH * 0.35)}L${r(x1 - L.sk)} ${r(baseTop + L.baseH * 0.35)}L${r(x1)} ${r(baseTop - L.baseH * 0.2)}L${r(x0 + L.sk)} ${r(baseTop - L.baseH * 0.2)}Z`, fill: '#e6dccb', stroke: INK, 'stroke-width': 2.6}),
      h('path', {d: `M${r(x0)} ${r(baseTop + L.baseH * 0.35)}L${r(x1 - L.sk)} ${r(baseTop + L.baseH * 0.35)}L${r(x1 - L.sk)} ${r(baseTop + L.baseH)}L${r(x0)} ${r(baseTop + L.baseH)}Z`, fill: '#cdbfa6', stroke: INK, 'stroke-width': 2.6}),
      h('path', {d: `M${r(x1 - L.sk)} ${r(baseTop + L.baseH * 0.35)}L${r(x1)} ${r(baseTop - L.baseH * 0.2)}L${r(x1)} ${r(baseTop + L.baseH * 0.45)}L${r(x1 - L.sk)} ${r(baseTop + L.baseH)}Z`, fill: '#b3a487', stroke: INK, 'stroke-width': 2.6}),
      refFit ? txt(refFit, {x: x0 + 20, y: baseTop + L.baseH * 0.35 + (L.baseH * 0.65 - refFit.height) / 2, fill: INK}) : h('path', {d: `M${r(x0 + 20)} ${r(baseTop + L.baseH * 0.67)}h120`, stroke: '#9d8f74', 'stroke-width': 10, 'stroke-linecap': 'round'}),
    );
    const rod = (x, y0, y1) => g(null, h('path', {d: `M${r(x)} ${r(y0)}V${r(y1)}`, stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round'}), h('path', {d: `M${r(x)} ${r(y0)}V${r(y1)}`, stroke: '#b7a074', 'stroke-width': 5, 'stroke-linecap': 'round'}));
    const backRods = backXs.map(x => rod(x, yTop, baseTop - L.baseH * 0.2 + 6));
    const frontRods = rodXs.map(x => rod(x, yTop + L.ld, baseTop + L.baseH * 0.35 + 4));
    // level rings on the rods and discs
    const discs = L.levels.map((lv, k) => g({name: `disc${k}`, opacity: 0.4}, positionDisc(ctx, L.discX, lv.y - L.ld / 2, L.discR, k + 1, show, {fill: '#fff4d6'})));
    const ticks = L.levels.map(lv => h('path', {d: `M${r(lv.x + L.lw + L.sk * 0.5 + 2)} ${r(lv.y - L.ld / 2)}H${r(L.discX - L.discR)}`, stroke: '#9d8f74', 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}));
    // connectors (one per position), drawn above the layers
    const conns = L.order.map((_, k) => g({name: `rel${k}`},
      h('path', {name: `rel${k}-halo`, d: 'M0 0', fill: 'none', stroke: '#ffffff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: 0.85}),
      h('path', {name: `rel${k}-line`, d: 'M0 0', fill: 'none', stroke: th.inkSoft, 'stroke-width': 4, 'stroke-linecap': 'round'}),
      h('circle', {name: `rel${k}-a`, r: 7, fill: th.inkSoft, stroke: '#fff', 'stroke-width': 2, opacity: 0}),
      h('circle', {name: `rel${k}-b`, r: 7, fill: th.inkSoft, stroke: '#fff', 'stroke-width': 2, opacity: 0}),
    ));
    const tracer = h('circle', {name: 'tracer', r: 12, fill: th.accent2, stroke: '#fff', 'stroke-width': 3, opacity: 0});
    // layers: z order = position (lower positions drawn later, i.e. on top) — each layer has its own group
    const zOrder = L.order.slice().reverse();
    const layers = zOrder.map(si => g({name: `lay${si}`, transform: T(L.parks[si].x, L.parks[si].y)}, layerArt(ctx, L, si, show, `art${si}`)));
    const lp = loupe(ctx, {name: 'loupe', R: L.discR + 13, a: -95, handle: L.discR * 1.6, opacity: 0});
    const notes = L.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node));
    const pb = L.parkBoard;
    const board = g(null,
      h('rect', {x: r(pb.x + 6), y: r(pb.y + 8), width: r(pb.w), height: r(pb.h), rx: 18, fill: th.shadow}),
      h('rect', {x: r(pb.x), y: r(pb.y), width: r(pb.w), height: r(pb.h), rx: 18, fill: '#efe7d8', stroke: '#b9ab90', 'stroke-width': 2.4}),
      L.order.map(si => h('path', {d: `M${r(L.parks[si].x)} ${r(L.parks[si].y)}L${r(L.parks[si].x + L.lw)} ${r(L.parks[si].y)}L${r(L.parks[si].x + L.lw + L.sk)} ${r(L.parks[si].y - L.ld)}L${r(L.parks[si].x + L.sk)} ${r(L.parks[si].y - L.ld)}Z`, fill: '#e3d8c3', stroke: '#c9bb9f', 'stroke-width': 2})),
    );
    return g({name: 'scene'},
      cardNode,
      board,
      base, backRods, ticks, discs,
      layers,
      frontRods,
      conns, tracer,
      g({name: 'loupeG'}, lp),
      notes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const E = ease.inOutCubic;
    const n = L.n;
    const seq = p.traversalOrder === 'bottom-up' ? Array.from({length: n}, (_, j) => n - 1 - j) : Array.from({length: n}, (_, j) => j);
    // trace: connector seq[j] is drawn during its slice of the trace window
    const tSpan = (W.trace[1] - W.trace[0]) / n, sSpan = (W.slide[1] - W.slide[0]) / n;
    const lerpP = (P, Q, t) => ({x: lerp(P.x, Q.x, t), y: lerp(P.y, Q.y, t)});
    const pos = {}; // schedule index → current front-left corner
    const slideT = {};
    let moving = null, seatedN = 0;
    for (let j = 0; j < n; j++) {
      const k = seq[j];
      const si = L.order[k];
      const q = seg(a, W.slide[0] + j * sSpan, W.slide[0] + (j + 0.92) * sSpan);
      const P0 = L.parks[si], P1 = L.levels[k];
      const t = E(q);
      // an arc: out of the parking column, then into the rack at the level's height
      const P = {x: lerp(P0.x, P1.x, t), y: lerp(P0.y, P1.y, ease.outCubic(clamp(t * 1.25))) + Math.sin(Math.PI * t) * (L.mode === 'above' ? 40 : -30)};
      pos[si] = P;
      slideT[si] = t;
      if (q > 0 && q < 1) moving = si;
      if (q >= 1) seatedN++;
      const printO = q <= 0 || q >= 1 ? 1 : clamp(Math.abs(q - 0.5) * 2 * 6 - 4.6);
      nodes[`lay${si}`] = {transform: T(r(P.x, 2), r(P.y, 2))};
      nodes[`art${si}-print`] = {opacity: r(printO, 3)};
    }
    // focus: the layer of the focus position enlarges about its centre; the loupe frames it
    const fk = clamp(p.focusElement, 1, n) - 1;
    const fsi = L.order[fk];
    const fq = ease.outCubic(seg(a, ...W.focus));
    const fc = {x: L.levels[fk].x + (L.lw + L.sk) / 2, y: L.levels[fk].y - L.ld / 2};
    const sc = 1 + 0.07 * fq;
    if (fq > 0) nodes[`lay${fsi}`] = {transform: `${T(r(fc.x, 2), r(fc.y, 2))} scale(${r(sc, 4)}) ${T(r(L.levels[fk].x - fc.x, 2), r(L.levels[fk].y - fc.y, 2))}`};
    const lr = L.discR + 13;
    const lpos = {x: L.discX, y: L.levels[fk].y - L.ld / 2};
    nodes.loupe = {opacity: r(fq, 3)};
    nodes.loupeG = {transform: T(r(lpos.x, 2), r(lpos.y - 10 * (1 - fq), 2))};
    // connectors
    let tracer = null, traced = 0;
    for (let j = 0; j < n; j++) {
      const k = seq[j];
      const si = L.order[k];
      const A = L.rowA(k), B = L.layerB(pos[si], slideT[si]);
      const q = seg(a, W.trace[0] + j * tSpan, W.trace[0] + (j + 0.9) * tSpan);
      const len = Math.hypot(B.x - A.x, B.y - A.y);
      const d = `M${r(A.x, 1)} ${r(A.y, 1)}L${r(B.x, 1)} ${r(B.y, 1)}`;
      const dash = q >= 1 ? 'none' : `${r(len * q, 1)} ${r(len + 10, 1)}`;
      nodes[`rel${k}-halo`] = {d, 'stroke-dasharray': dash, opacity: q > 0 ? 0.85 : 0};
      nodes[`rel${k}-line`] = {d, 'stroke-dasharray': dash, opacity: q > 0 ? 1 : 0};
      nodes[`rel${k}-a`] = {cx: r(A.x, 1), cy: r(A.y, 1), opacity: q > 0 ? 1 : 0};
      nodes[`rel${k}-b`] = {cx: r(B.x, 1), cy: r(B.y, 1), opacity: q >= 1 ? 1 : 0};
      nodes[`c-rowHi${k}`] = {opacity: q > 0 && q < 1 ? 1 : 0};
      if (q > 0 && q < 1) tracer = lerpP(A, B, q);
      if (q >= 1) traced++;
    }
    nodes.tracer = tracer ? {cx: r(tracer.x, 1), cy: r(tracer.y, 1), opacity: 1} : {cx: r(L.rowA(seq[0]).x, 1), cy: r(L.rowA(seq[0]).y, 1), opacity: 0};
    for (let k = 0; k < n; k++) nodes[`disc${k}`] = {opacity: pos[L.order[k]].x === L.levels[k].x && pos[L.order[k]].y === L.levels[k].y ? 1 : 0.4};
    const tagO = done ? seg(u, ...W.tags) : 0, keyO = done ? seg(u, ...W.key) : 0, legO = seg(a, ...W.legend);
    for (const pl of L.placed) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'legend' ? legO : tagO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    // relations: every connector ends on its layer's edge (B) and starts on its list line (A)
    const ends = L.order.map((si, k) => ({k, si, A: P2(L.rowA(k)), B: P2(L.layerB(pos[si], slideT[si]))}));
    const seatedOrder = L.order.filter((si, k) => pos[si].x === L.levels[k].x && pos[si].y === L.levels[k].y);
    return {
      nodes,
      semantic: {
        beat, traced, seated: seatedN, moving, tracer: tracer ? P2(tracer) : null, order: L.order, seatedOrder,
        layer0: P2(pos[L.order[0]]), layerLast: P2(pos[L.order[n - 1]]), focus: r(fq, 3), focusSchedule: fsi,
        ends, relationKind: 'relation', arrowheads: 0, tagsShown: r(tagO, 3), keyShown: r(keyO, 3), legendShown: r(legO, 3),
        arrangement: L.mode, side: L.side, textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), tried: L.ok ? undefined : L.tried.join(' | '),
        problems: L.ok ? [] : L.why, actionCapped: p.actionProgress < 1 && u > capU,
        noteBoxes: L.placed.map(pl => box2(pl.c.box)),
        parkBoxes: L.order.map(si => box2({x: L.parks[si].x, y: L.parks[si].y - L.ld, w: L.lw + L.sk, h: L.ld + L.th})),
        legendKind: L.placed.filter(pl => pl.q.kind === 'legend').map(pl => box2(pl.c.box)),
        lpos: P2(lpos), lr: r(lr),
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
    slug: 'contract-terms-09-mechanism',
    title: 'Order of documents, without doctrine — plain connectors tie each line of the supplied order list to its annex layer, and the layers slide onto a rack at the level of their listed position',
    titleEs: 'Orden de documentos — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Orden de documentos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded assembly: the contract card "CT-208 · Services contract (fictional)" with its supplied order list, an empty rack of guide rods on the contract\'s base plate with a numbered disc for each level, and the annex layers parked apart in their supplied numbering. A tracer walks the list in the supplied traversal order and draws a plain connector (no arrowhead) from each list line to the layer it names; the layers then slide onto the rods at the level of their listed position while the connectors stay anchored to their edges, ending as short non-crossing lines from line k to level k. A loupe settles on the level disc of the supplied focus position and that layer enlarges slightly. The hold shows "Priority document (as supplied)" beside level 1 and "Subordinate document, as configured" beside the last level with equal weight, the relation legend and the key "As supplied · no conclusion drawn". Nothing prevails or governs beyond the supplied list.',
    tags: ['order of documents', 'priority clause', 'annexes', 'schedules', 'layers', 'capas', 'exploded view', 'rack', 'connectors', 'relation', 'tracer', 'loupe', 'focus', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/orden-documentos.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
