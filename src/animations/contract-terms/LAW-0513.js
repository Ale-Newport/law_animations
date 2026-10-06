/**
 * LAW-0513 — Orden de documentos · story
 *
 * Storyboard (a desk seen from above; one hand, the annex binders, a sliding loupe, a tray):
 *  0.00–0.15  rest: the contract "CT-208 · Services contract (fictional)" lies on the desk with the heading "Order of
 *             documents clause", its supplied text and the supplied ORDER LIST (position discs 1..n, the annex tab
 *             letter, the annex label). A brass ruler runs beside the list; a loupe rests at its foot. The annex binders
 *             (one hue each, label band at the foot of the cover) lie in a column on the right; an empty tray with
 *             numbered level plates waits between them.
 *  0.15–0.74  for each position, from the last listed up to position 1: the loupe slides up the ruler to that line of
 *             the list (the line is framed), the hand reaches the binder named there, takes it by its edge and carries
 *             it (constant grip, lifted arc) onto the tray, where it lands one level higher than the previous one — the
 *             annexes pile up in a cascade and only the label band of each lower binder stays visible. The level plate
 *             (number = position) lights as each binder lands. The binder listed first therefore ends on top.
 *  0.74–0.84  the hand leaves; the loupe stays on line 1 of the list.
 *  0.76–1.00  hold: "Priority document (as supplied)" points at the top binder and "Subordinate document, as configured"
 *             at the bottom one (equal weight: same chip, same leader), the supplied final state and the key "As
 *             supplied · no conclusion drawn"; editorial notes if supplied.
 * The order is only the supplied order list: no interpretation doctrine, no document "wins" beyond its supplied
 * position, no conflict rule, no jurisdiction.
 * @module animations/contract-terms/LAW-0513
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, num, annotation} from '../../schemas/fields.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {
  INK, BRASS, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, schedulesField, prioritiesField,
  stateLabelsField, orderOf, longest, localizeScene, unitPx, fitG, txt, cardText, placeCardRows, contractCard,
  binderTop, binderLabel, positionDisc, loupe, placeNotes, chipG, leaderTo, overlaps, P2, box2, shade,
} from './kits/orden-documentos.js';

const ID = 'LAW-0513';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const RUN = [0.15, 0.74];
const W = {leave: [0.74, 0.84], tags: [0.76, 0.81], key: [0.79, 0.84], notes: [0.8, 0.85]};
const ACTION_END = 0.84;

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  schedules: schedulesField,
  priorities: prioritiesField,
  stateLabels: stateLabelsField,
  actorLabels: obj('Caption at the desk edge naming whose hand acts', {a: str('Caption for the hand (e.g. "Contract desk")', 40)}),
  objectLabels: obj('Label of the tray', {tray: str('Label on the tray (e.g. "Annex tray")', 40)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['contract', 'tray', 'loupe']), 0, 2),
  finalState: str('Supplied final state shown in the hold (e.g. "Annexes stacked in the supplied order")', 60),
};

const defaultParams = {
  ...CONTENT,
  actorLabels: {a: 'Contract desk'},
  objectLabels: {tray: 'Annex tray'},
  actionProgress: 1,
  annotations: [],
  finalState: 'Annexes stacked in the supplied order',
};
const defaultParamsEs = {
  ...CONTENT_ES,
  actorLabels: {a: 'Mesa de contratos'},
  objectLabels: {tray: 'Bandeja de anexos'},
  finalState: 'Anexos apilados según el orden aportado',
};

const isStress = p => p.clause.text.length > 60 || [p.contract.title, p.clause.heading, p.stateLabels.priority, p.stateLabels.subordinate, p.finalState, ...p.schedules.map(s => s.label)].some(t => t.length > 46) || p.annotations.length > 1;

function geom(ctx, F, minF, arr, cols) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 30, gap = 34, g2 = 18;
  const order = orderOf(p);
  const n = order.length;
  const discR = F * 0.9;
  const plateW = discR * 2 + 26;
  const dx = 16;
  const lead = discR * 2.2 + 20;
  const capH = show && p.actorLabels.a ? Math.max(minF, F * 0.9) * 1.18 + 14 + 26 : 0;
  // ---- the card and the lower/right zone
  let card, zone;
  if (arr === 'side') {
    const cw = clamp(D.w * (ctx.view.shape === 'landscape' ? 0.32 : stress ? 0.33 : 0.31), 340, 620);
    card = {x: m, y: m, w: cw, h: D.h - 2 * m};
    zone = {x: m + cw + gap, y: m, w: D.w - 2 * m - cw - gap, h: D.h - 2 * m};
  } else {
    const C0 = cardText(p, order, D.w - 2 * m, F, minF, {lead, stress});
    card = {x: m, y: m, w: D.w - 2 * m, h: C0.need + 10};
    zone = {x: m, y: m + card.h + gap, w: D.w - 2 * m, h: D.h - 2 * m - card.h - gap};
  }
  const C = cardText(p, order, card.w, F, minF, {lead, stress});
  if (C.need > card.h + 0.5) why.push('card-text');
  if (C.bad) why.push('card-fit');
  const rows = placeCardRows(C, card.h, F);
  // ---- binders: width from the zone, height from the source column
  const trayExtra = plateW + (n - 1) * dx + 34;
  const bw = clamp((zone.w - trayExtra - gap - (cols - 1) * g2) / (cols + 1), 230, 470);
  const labs = order.map(si => binderLabel(p.schedules[si].label, bw, F, minF, stress));
  const all = p.schedules.map(s => binderLabel(s.label, bw, F, minF, stress));
  if (all.some(L0 => L0.fit.bad)) why.push('binder-text');
  const bandH = Math.max(...all.map(L0 => L0.fit.height), all[0].tabS) + F * 1.1;
  const rowsN = Math.ceil(n / cols);
  const srcH = zone.h - capH;
  let bh = Math.min((srcH - (rowsN - 1) * g2) / rowsN, bw * 0.78, bandH + 220);
  const coverMin = stress ? Math.max(36, F * 1.5) : Math.max(54, F * 2.1);
  if (bh < bandH + coverMin) why.push('binder-height');
  bh = Math.max(bh, bandH + coverMin);
  const dy = Math.max(bandH + 12, Math.min((srcH - bh - 8) / Math.max(1, n - 1), bh * 0.6));
  const trayW = trayExtra + bw;
  const tray = {x: zone.x, w: trayW};
  const srcX0 = zone.x + trayW + gap;
  if (srcX0 + cols * bw + (cols - 1) * g2 > zone.x + zone.w + 0.5) why.push('zone-width');
  // source positions in pick order: near column first, each column bottom → top
  const srcBottom = zone.y + srcH - bh;
  const picks = [];
  for (let c = 0; c < cols; c++) for (let rI = 0; rI < rowsN; rI++) if (picks.length < n) picks.push({x: srcX0 + c * (bw + g2), y: srcBottom - rI * (bh + g2)});
  // slot k (k = 0 the bottom of the pile) holds the annex at position n - k
  const slot0 = {x: zone.x + plateW + 10 + (n - 1) * dx, y: srcBottom};
  const slots = Array.from({length: n}, (_, k) => ({x: slot0.x - k * dx, y: slot0.y - k * dy}));
  tray.y = slots[n - 1].y - 22;
  tray.h = slot0.y + bh + 22 - tray.y;
  if (tray.y < zone.y - 0.5) why.push('tray-top');
  // ---- the hand
  const grip = {x: bw - 26, y: (bh - bandH) * 0.5};
  const portraitish = arr === 'top';
  const shoulder = portraitish ? {x: D.w + 120, y: D.h * 0.86} : {x: D.w + 150, y: D.h * 0.62};
  const handRest = portraitish ? {x: D.w + 50, y: D.h * 0.86} : {x: D.w + 50, y: D.h * 0.6};
  const targets = [handRest, ...picks.map(q => ({x: q.x + grip.x, y: q.y + grip.y})), ...slots.map(q => ({x: q.x + grip.x, y: q.y + grip.y}))];
  const far = Math.max(...targets.map(q => Math.hypot(q.x - shoulder.x, q.y - shoulder.y))) + 70;
  const near = Math.min(...targets.slice(1).map(q => Math.hypot(q.x - shoulder.x, q.y - shoulder.y)));
  const armW = clamp(far * 0.07, 46, 72);
  const handLen = 24 * 1.3 * (armW / 46);
  const upper = far * 0.53, lower = far * 0.47 - handLen + 2;
  if (near < Math.abs(upper - lower - handLen) + 20) why.push('arm-too-close');
  // ---- the loupe on the card
  const loupeR = C.disc + 10;
  const loupeAt = k => ({x: card.x + C.rowX + C.disc + 4, y: card.y + rows[k].y + rows[k].h / 2});
  const lastRow = rows[n - 1];
  const loupeRest = {x: loupeAt(0).x, y: card.y + lastRow.y + lastRow.h + loupeR + 8};
  if (loupeRest.y + loupeR > card.y + card.h - 4) loupeRest.y = loupeAt(n - 1).y;
  // ---- notes in the vacated source column (and above the tray)
  const notes = [];
  const ORDER = ['contract', 'tray', 'loupe'];
  if (show) {
    notes.push({name: 'tagP', kind: 'tag', text: p.stateLabels.priority, worst: longest([p.stateLabels.priority, p.stateLabels.subordinate])});
    notes.push({name: 'tagS', kind: 'tag', text: p.stateLabels.subordinate, worst: longest([p.stateLabels.priority, p.stateLabels.subordinate])});
    if (p.finalState) notes.push({name: 'final', kind: 'final', text: p.finalState});
  }
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.map((an, i) => ({name: `note${i}`, kind: 'note', text: an.text, target: an.target})).sort((a, b) => ORDER.indexOf(a.target) - ORDER.indexOf(b.target)).forEach(q => notes.push(q));
  const srcRight = srcX0 + cols * bw + (cols - 1) * g2;
  const colR = {x: srcX0 - 6, w: Math.max(srcRight, zone.x + zone.w) - srcX0 + 6, top: zone.y + 4, bottom: zone.y + srcH - 4};
  // the tray label on the tray rim
  const trayFit = show && p.objectLabels.tray ? fitG(p.objectLabels.tray, {maxWidth: trayW - 40, size: Math.max(minF, F * 0.9), minSize: minF, maxLines: 1, weight: 700}) : null;
  if (trayFit && trayFit.bad) why.push('tray-label');
  const aboveTray = {x: zone.x, w: srcX0 - gap - zone.x, top: zone.y + 4, bottom: tray.y - 16 - (trayFit ? trayFit.height + 18 : 0)};
  // the generic key never renders larger than the smallest supplied content text
  const contentMin = Math.min(F, ...all.map(L0 => L0.fit.size), ...C.rows.map(f => f.size), C.text ? C.text.size : F);
  const style = q => ({fill: q.kind === 'tag' ? '#fffaf0' : q.kind === 'final' ? ctx.theme.accent2Soft : ctx.theme.card, ...(q.kind === 'key' ? {size: contentMin, minSize: Math.min(minF, contentMin)} : {})});
  // the two reading tags sit level with the binder they name (top binder's cover / bottom binder's band); the other
  // notes fill what is left of the vacated column and the space above the tray
  const placed = [];
  const busy = [];
  for (const q of notes.filter(q0 => q0.kind === 'tag')) {
    const c0 = chipG(ctx, q.worst, {x: colR.x, y: 0, maxWidth: colR.w, size: F, minSize: minF, maxLines: 4, weight: 700});
    const s0 = q.name === 'tagP' ? slots[n - 1] : slots[0];
    const cy = q.name === 'tagP' ? s0.y + (bh - bandH) * 0.45 : s0.y + bh - bandH / 2;
    let y = clamp(cy - c0.box.h / 2, colR.top, colR.bottom - c0.box.h);
    for (const b of busy) if (y < b.y + b.h + 12 && y + c0.box.h > b.y - 12) y = q.name === 'tagS' ? b.y + b.h + 14 : b.y - c0.box.h - 14;
    const c = chipG(ctx, q.text, {x: colR.x, y, maxWidth: colR.w, size: F, minSize: minF, maxLines: 4, weight: 700, name: q.name, ...style(q)});
    if (c0.bad || y < colR.top - 0.5 || y + c0.box.h > colR.bottom + 0.5) why.push(`note-${q.name}`);
    placed.push({q, c});
    busy.push({y, h: c0.box.h});
  }
  busy.sort((a0, b0) => a0.y - b0.y);
  const regions = [];
  let yy = colR.top;
  for (const b of busy) { regions.push({...colR, top: yy, bottom: b.y - 14}); yy = b.y + b.h + 14; }
  regions.push({...colR, top: yy, bottom: colR.bottom});
  regions.push(aboveTray);
  const rest = placeNotes(ctx, notes.filter(q0 => q0.kind !== 'tag'), regions.sort((a0, b0) => (b0.bottom - b0.top) - (a0.bottom - a0.top)), F, minF, stress, style);
  placed.push(...rest.placed);
  for (const q of rest.miss) why.push(`note-${q}`);
  return {
    ok: !why.length, why, F, minF, arr, cols, order, n, card, C, rows, zone, tray, trayFit, bw, bh, bandH, labs, dy, dx, slots, picks, plateW, discR,
    grip, shoulder, handRest, armW, upper, lower, loupeR, loupeAt, loupeRest, placed, stress, capH,
  };
}

const scene = {
  sizes: {landscape: [1800, 790], square: [1240, 960], portrait: [900, 1290]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const shape = ctx.view.shape;
    const tries = shape === 'landscape' ? [['side', 1], ['side', 2]] : shape === 'portrait' ? [['top', 1], ['top', 2]] : [['top', 2], ['top', 1], ['side', 1], ['side', 2]];
    let L = null, first = null;
    const tried = [];
    outer: for (const fpx of stress ? [23, 21.5, 20, 18.5, 17.2] : [28, 26.5, 25, 23.5, 22, 20.5]) {
      for (const [arr, cols] of tries) {
        L = geom(ctx, fpx / upx, minF, arr, cols);
        if (!first) first = L;
        tried.push(`${fpx}/${arr}-${cols}:${L.why.join('+')}`);
        if (L.ok) break outer;
      }
    }
    if (!L.ok) L = first;
    L.upx = upx;
    L.tried = tried;
    L.arm = topArm(ctx, {name: 'arm', skin: '#c58c64', sleeve: '#5b4a6e', handed: 'right', upper: L.upper, lower: L.lower, width: L.armW});
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const D = ctx.design;
    const desk = deskWindow(ctx, {prefix: 'desk', x: 0, y: 0, w: D.w, h: D.h, radius: 30});
    const {card, C, tray} = L;
    const cardNode = g({transform: T(card.x, card.y)}, contractCard(ctx, {prefix: 'c-', w: card.w, h: card.h, C, rows: L.rows, order: L.order, show, p, ruler: true}));
    // the tray: a shallow wooden tray, level plates down its left rim
    const trayNode = g(null,
      h('rect', {x: r(tray.x + 8), y: r(tray.y + 10), width: r(tray.w), height: r(tray.h), rx: 18, fill: th.shadow}),
      h('rect', {x: r(tray.x), y: r(tray.y), width: r(tray.w), height: r(tray.h), rx: 18, fill: '#b5834f', stroke: INK, 'stroke-width': 2.8}),
      h('rect', {x: r(tray.x + L.plateW), y: r(tray.y + 12), width: r(tray.w - L.plateW - 12), height: r(tray.h - 24), rx: 10, fill: '#d7b78b', stroke: shade('#b5834f', -0.25), 'stroke-width': 2}),
    );
    // ghost outlines of the levels still to fill, so the tray reads as a rack of places
    const ghosts = L.slots.map((s0, k) => h('path', {name: `ghost${k}`, d: roundRectPath(s0.x, s0.y, L.bw, L.bh, 10), fill: 'none', stroke: '#9a7146', 'stroke-width': 2.5, opacity: 0.5}));
    const plates = L.slots.map((s, k) => {
      const cy = s.y + L.bh - L.bandH / 2;
      return g({name: `plate${k}`, opacity: 0.35}, positionDisc(ctx, tray.x + L.plateW / 2, cy, L.discR, L.n - k, show, {fill: '#fff4d6'}));
    });
    const trayLab = L.trayFit ? (() => {
      const f = L.trayFit, w = f.width + 26, hh = f.height + 10;
      const x = tray.x + 6, y = tray.y - hh - 8;
      return g({name: 'trayLab'}, h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 7, fill: '#f1e2c4', stroke: INK, 'stroke-width': 1.8}), txt(f, {x: x + 13, y: y + 5, fill: INK}));
    })() : null;
    // rest marks of the binders, the low copies (on the desk) and the high copies (carried / piled), in pick order
    const marks = L.picks.map(q => h('path', {d: roundRectPath(q.x - 6, q.y - 6, L.bw + 12, L.bh + 12, 14), fill: 'none', stroke: '#8f6a45', 'stroke-width': 2, opacity: 0.3}));
    const seq = k => L.order[L.n - 1 - k]; // the schedule placed k-th
    const lab = k => L.labs[L.n - 1 - k];
    const low = L.picks.map((q, k) => g({name: `bl${k}`, transform: T(q.x, q.y)}, binderTop(ctx, {w: L.bw, h: L.bh, bandH: L.bandH, i: seq(k), tab: p.schedules[seq(k)].tab, fit: lab(k).fit, tabS: lab(k).tabS, show})));
    const high = L.picks.map((q, k) => g({name: `bh${k}`, transform: T(q.x, q.y), opacity: 0}, binderTop(ctx, {w: L.bw, h: L.bh, bandH: L.bandH, i: seq(k), tab: p.schedules[seq(k)].tab, fit: lab(k).fit, tabS: lab(k).tabS, show, occludes: true})));
    const loupeNode = g({name: 'loupe', transform: T(L.loupeRest.x, L.loupeRest.y)}, loupe(ctx, {R: L.loupeR, a: 180, handle: L.C.lead * 0.65 + 6}));
    const notes = L.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node));
    const leads = L.placed.filter(pl => pl.q.kind === 'tag' || pl.q.kind === 'note').map(pl => leaderTo(ctx, `${pl.q.name}-lead`, pl.c.box, leadTarget(L, pl), pl.q.kind === 'tag' ? 2000 : 230));
    const capFit = show && p.actorLabels.a ? fitG(p.actorLabels.a, {maxWidth: 360, size: Math.max(L.minF, L.F * 0.9), minSize: L.minF, maxLines: 1, weight: 700}) : null;
    const cap = capFit ? (() => {
      const w = capFit.width + 28, hh = capFit.height + 14;
      const x = D.w - 26 - w, y = D.h - 22 - hh;
      return g({name: 'cap'}, h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 8, fill: '#5b4a6e', stroke: INK, 'stroke-width': 2}), txt(capFit, {x: x + w / 2, y: y + 7, anchor: 'middle', fill: '#ffffff'}));
    })() : null;
    return g({name: 'scene'},
      desk.surface,
      cardNode,
      trayNode, ghosts, plates, trayLab,
      marks,
      low,
      g({'clip-path': desk.clip}, L.arm.arm, L.arm.palm),
      high,
      g({'clip-path': desk.clip}, L.arm.thumb),
      loupeNode,
      leads, notes,
      cap,
      desk.frame,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(RUN[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const E = ease.inOutCubic;
    const n = L.n;
    const span = (RUN[1] - RUN[0]) / n;
    const mix = (P, Q, t) => ({x: lerp(P.x, Q.x, t), y: lerp(P.y, Q.y, t)});
    const add = (P, Q) => ({x: P.x + Q.x, y: P.y + Q.y});
    // which carry is running: k, and its local phase q
    const kRaw = (a - RUN[0]) / span;
    const k = clamp(Math.floor(kRaw), 0, n - 1);
    const q = a < RUN[0] ? 0 : a >= RUN[1] ? 1 : kRaw - k;
    const reachQ = clamp(q / 0.38), carryQ = clamp((q - 0.38) / 0.5), settleQ = clamp((q - 0.88) / 0.12);
    const started = a >= RUN[0];
    let hand, phase;
    const gripAt = P => add(P, L.grip);
    const leave = seg(a, ...W.leave);
    const from = k === 0 ? L.handRest : gripAt(L.slots[k - 1]);
    const carryPos = t => {
      const P0 = L.picks[k], P1 = L.slots[k];
      const x = lerp(P0.x, P1.x, E(t));
      const y = lerp(P0.y, P1.y, ease.outCubic(clamp(t / 0.7))) - Math.sin(Math.PI * t) * 26;
      return {x, y};
    };
    let carriedK = -1, carried = null;
    if (!started) { hand = L.handRest; phase = 'rest'; }
    else if (a >= RUN[1]) { hand = mix(gripAt(L.slots[n - 1]), L.handRest, ease.inOutSine(leave)); phase = leave >= 1 ? 'away' : 'leaving'; }
    else if (reachQ < 1) { hand = mix(from, gripAt(L.picks[k]), ease.inOutSine(reachQ)); phase = 'reaching'; }
    else if (carryQ < 1) { carried = carryPos(carryQ); carriedK = k; hand = gripAt(carried); phase = 'carrying'; }
    else { carried = L.slots[k]; carriedK = k; hand = gripAt(carried); phase = settleQ < 1 ? 'placing' : 'placed'; }
    const posed = L.arm.pose(L.shoulder, hand, 1);
    Object.assign(nodes, posed.nodes);
    // binders: placed ones on their slots, the carried one in the hand, the rest on the desk
    let placedN = 0;
    const posOf = [];
    for (let j = 0; j < n; j++) {
      const isPlaced = started && (j < k || (j === k && (a >= RUN[1] || carryQ >= 1)));
      const inHand = j === carriedK && carryQ < 1;
      if (isPlaced) placedN++;
      const pos = isPlaced ? L.slots[j] : inHand ? carried : L.picks[j];
      const lifted = isPlaced || inHand;
      posOf.push(pos);
      nodes[`bl${j}`] = {opacity: lifted ? 0 : 1};
      nodes[`bh${j}`] = {opacity: lifted ? 1 : 0, transform: T(r(pos.x, 2), r(pos.y, 2))};
      nodes[`plate${j}`] = {opacity: isPlaced ? 1 : 0.35};
      nodes[`ghost${j}`] = {opacity: isPlaced ? 0 : 0.5};
    }
    // the loupe walks up the list: line n-1-k while carry k runs
    const rowOf = j => n - 1 - j;
    let lp, row = -1;
    if (!started) lp = L.loupeRest;
    else {
      const target = L.loupeAt(rowOf(k));
      const prev = k === 0 ? L.loupeRest : L.loupeAt(rowOf(k - 1));
      lp = a >= RUN[1] ? L.loupeAt(0) : mix(prev, target, E(clamp(q / 0.25)));
      row = rowOf(k);
    }
    nodes.loupe = {transform: T(r(lp.x, 2), r(lp.y, 2))};
    for (let j = 0; j < n; j++) nodes[`c-rowHi${j}`] = {opacity: started && j === row && a < RUN[1] ? r(clamp(q / 0.25), 3) : 0};
    const tagO = done ? seg(u, ...W.tags) : 0, keyO = done ? seg(u, ...W.key) : 0, noteO = done ? seg(u, ...W.notes) : 0;
    for (const pl of L.placed) {
      const o = pl.q.kind === 'key' ? keyO : pl.q.kind === 'note' ? noteO : tagO;
      nodes[`${pl.q.name}-g`] = {opacity: r(o, 3)};
      if (pl.q.kind === 'tag' || pl.q.kind === 'note') nodes[`${pl.q.name}-lead`] = {opacity: r(o, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const bpos = j => (nodes[`bl${j}`].opacity ? L.picks[j] : null);
    const pileTop = placedN ? L.order[n - placedN] : null;
    return {
      nodes,
      semantic: {
        beat, phase, hand: P2(posed.hand), carrying: carriedK >= 0 && carryQ < 1 ? carriedK : null,
        carried: carried ? P2(carried) : null, carriedGrip: carried ? P2(add(carried, L.grip)) : P2(add(L.picks[0], L.grip)),
        loupe: P2(lp), loupeRow: row, placed: placedN, pileTop, order: L.order, pileOrder: Array.from({length: placedN}, (_, j) => L.order[n - 1 - j]).reverse(),
        binder0: P2(posOf[0]), restCount: L.picks.filter((_, j) => bpos(j)).length,
        tagsShown: r(tagO, 3), keyShown: r(keyO, 3), allReached: posed.reached,
        arrangement: `${L.arr}-${L.cols}`, textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), tried: L.ok ? undefined : L.tried.join(' | '), problems: L.ok ? [] : L.why,
        actionCapped: p.actionProgress < 1 && u > capU,
        noteBoxes: L.placed.map(pl => box2(pl.c.box)),
        pileBox: box2({x: L.slots[n - 1].x, y: L.slots[n - 1].y, w: L.bw + (n - 1) * L.dx, h: L.bh + (n - 1) * L.dy}),
        loupeBox: box2({x: lp.x - L.loupeR, y: lp.y - L.loupeR, w: L.loupeR * 2, h: L.loupeR * 2}),
      },
    };
  },
};

function leadTarget(L, pl) {
  const n = L.n;
  const b = pl.c.box;
  const near = (B) => ({x: clamp(b.x + b.w / 2, B.x + 20, B.x + B.w - 20), y: clamp(b.y + b.h / 2, B.y + 14, B.y + B.h - 14)});
  if (pl.q.name === 'tagP') { const s = L.slots[n - 1]; return near({x: s.x + L.bw * 0.4, y: s.y, w: L.bw * 0.6, h: L.bh - L.bandH}); }
  if (pl.q.name === 'tagS') { const s = L.slots[0]; return near({x: s.x + L.bw * 0.4, y: s.y + L.bh - L.bandH + 4, w: L.bw * 0.6 - 12, h: L.bandH - 8}); }
  if (pl.q.target === 'contract') return near({x: L.card.x + 20, y: L.card.y + 10, w: L.card.w - 40, h: L.C.headH - 20});
  if (pl.q.target === 'tray') return near({x: L.tray.x + 10, y: L.tray.y + L.tray.h - 16, w: L.tray.w - 20, h: 8});
  const lp = L.loupeAt(0);
  return {x: lp.x + L.loupeR * 0.7, y: lp.y - L.loupeR * 0.7};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-09-story',
    title: 'Order of documents, without doctrine — a loupe walks up the supplied order list while a hand piles the annex binders on a tray, the first-listed on top',
    titleEs: 'Orden de documentos — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Orden de documentos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'On a desk seen from above, the contract "CT-208 · Services contract (fictional)" shows the heading "Order of documents clause", its supplied text and the supplied order list (position discs, annex tab letters, annex labels). For each position from the last listed up to position 1, a loupe slides up a brass ruler to that line, and a hand takes the annex binder named there and carries it onto a tray, one level higher each time: the annexes pile up in a cascade with only the label band of each lower binder visible, and numbered level plates light as each lands. The binder listed first ends on top. The hold labels the top binder "Priority document (as supplied)" and the bottom one "Subordinate document, as configured" with equal weight, shows the supplied final state and the key "As supplied · no conclusion drawn". The order is only the supplied list: no interpretation doctrine, no document wins beyond its supplied position.',
    tags: ['order of documents', 'priority clause', 'annexes', 'schedules', 'binders', 'stack', 'tray', 'loupe', 'contract', 'hand', 'desk', 'equal weight', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/orden-documentos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
