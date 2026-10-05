/**
 * LAW-0505 — Cláusula de indemnidad · story
 *
 * Storyboard (a desk seen from above; one hand, one claim slip, one reading lens):
 *  0.00–0.15  rest: the contract "CT-412 · Supply contract (fictional)" lies on the desk (a layer sheet behind it) with
 *             the heading "Indemnity clause" on a ribbon tab and its supplied clause lines; the line holding the supplied
 *             promise of cover carries a printed rail to a brass socket on the sheet edge. The claim slip "Claim 1
 *             (supplied)" (brass prong, dotted stub) lies apart; the rectangular reading lens rests in its corner.
 *  0.15–0.24  a hand reaches in from the desk edge and takes the claim slip by its end.
 *  0.24–0.38  the slip is carried (constant grip) to the socket, prong first;
 *  0.38–0.44  and pushed home: the prong seats, the socket ring and the rail light up to the promise line — the claim
 *             is connected to the promise of cover.
 *  0.44–0.60  the hand lets go, takes the reading lens by its handle and holds it over the joint;
 *  0.58–0.70  the scope outline is drawn round the promise line and the claim: solid for "claim covered as per supplied
 *             data" (●), dashed for "scope disputed (as supplied)" (◆) — same colour and width; nothing is decided.
 *  0.64–0.80  the lens goes back to its corner (parked clear of every text) and the hand leaves.
 *  0.70–1.00  hold: the supplied status tag (glyph as on the outline badge) and the key "As supplied · no conclusion
 *             drawn"; editorial notes if supplied.
 * No indemnity doctrine: no duty to indemnify or pay, no amount unless supplied (always labelled hypothetical), no
 * decision on cover beyond the supplied datum, no jurisdiction.
 * @module animations/contract-terms/LAW-0505
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, obj, list, num, annotation} from '../../schemas/fields.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {
  INK, BRASS, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, promiseField, claimField,
  stateLabelsField, finalStateField, promiseIndex, worstState, localizeScene, unitPx, fitG, chipG, txt, stateGlyph,
  sheetText, placeRows, contractSheet, socketArt, slipText, claimSlip, slipBox, readingLens, lensCentreOf, roundedLoop,
  scopeNode, scopeFrame, overlaps,
} from './kits/clausula-indemnidad.js';

const ID = 'LAW-0505';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  reach: [0.15, 0.24], carry: [0.24, 0.38], push: [0.38, 0.44], toLens: [0.44, 0.51], raise: [0.51, 0.58],
  scope: [0.58, 0.69], lower: [0.64, 0.71], leave: [0.71, 0.78], final: [0.7, 0.75], key: [0.74, 0.79], notes: [0.76, 0.81],
};
const ACTION_END = 0.78;

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  promise: promiseField,
  claim: claimField,
  stateLabels: stateLabelsField,
  actorLabels: obj('Caption at the desk edge naming whose hand acts', {a: str('Caption for the hand (e.g. "Claims desk")', 40)}),
  objectLabels: obj('Label on the socket', {socket: str('Label beside the socket (e.g. "Promise of cover (supplied text)")', 50)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['claim', 'clause', 'lens']), 0, 2),
  finalState: finalStateField({covered: 'the scope outline is drawn solid round the promise line and the claim', disputed: 'the scope outline is drawn dashed (same colour and width)'}),
};

const defaultParams = {
  ...CONTENT,
  actorLabels: {a: 'Claims desk'},
  objectLabels: {socket: 'Promise of cover (supplied text)'},
  actionProgress: 1,
  annotations: [],
  finalState: 'covered',
};
const defaultParamsEs = {
  ...CONTENT_ES,
  actorLabels: {a: 'Mesa de reclamaciones'},
  objectLabels: {socket: 'Promesa de cobertura (texto aportado)'},
};

const isStress = p => [...p.clauses, p.claim.label, p.contract.title, p.stateLabels.covered, p.stateLabels.disputed, p.objectLabels.socket].some(t => t.length > 48) || p.annotations.length > 1;

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 34;
  const mode = shape === 'landscape' ? 'right' : 'down';
  const pi = promiseIndex(p);
  const prong = 54;
  const capH = show && p.actorLabels.a ? F * 0.9 * 1.18 + 14 + 30 : 0;
  let slipW, sheet, S, rows, sock, tipDock, tipRest, lensRest, regions, shoulder, handRest, lensDim, railD, railLen, railGeo = null;
  if (mode === 'right') {
    slipW = clamp(D.w * 0.21, 300, 400);
    const subW = slipW + 40;
    const sw = D.w - m - (prong + 14) - (slipW + 24) - 30 - subW - m;
    sheet = {x: m, y: m, w: sw, h: D.h - 2 * m};
    S = sheetText(p, sheet.w, F, minF, {stress});
    if (S.need > sheet.h) why.push('sheet-text');
    rows = placeRows(S, sheet.h, F);
    const row = rows[pi];
    sock = {x: sheet.x + sheet.w, y: sheet.y + row.y + row.h / 2, dir: 'right'};
    railD = `M${r(S.padX + S.rowW)} ${r(row.y + row.h / 2)}H${r(sheet.w - 6)}`;
    railLen = sheet.w - 6 - (S.padX + S.rowW);
    const TT = slipText(ctx, p, slipW, F, minF, stress, D.h * 0.34);
    tipDock = {x: sock.x + 4, y: clamp(sock.y, m + TT.h / 2, D.h - m - TT.h / 2)};
    if (Math.abs(tipDock.y - sock.y) > 0.5) why.push('slip-off-desk');
    const x0 = D.w - m - subW;
    tipRest = {x: x0 + 20 - prong, y: m + 10 + TT.h / 2};
    const lw = clamp(subW * 0.56, 180, 250), lh = lw * 0.66, hl = lw * 0.6;
    lensDim = {lw, lh, hl};
    lensRest = {centre: {x: x0 + 26 + lw / 2, y: D.h - m - capH - lh / 2 - 16}, a: 180};
    const dockTop = tipDock.y - TT.h / 2, dockBot = tipDock.y + TT.h / 2;
    const lx0 = sock.x + prong + 4, lx1 = x0 - 26;
    regions = [
      {x: lx0, w: lx1 - lx0, top: dockBot + 26, bottom: D.h - m},
      {x: lx0, w: lx1 - lx0, top: m, bottom: dockTop - 26},
      {x: x0 + 10, w: subW - 20, top: m + 6, bottom: lensRest.centre.y - lh / 2 - 30},
    ];
    shoulder = {x: D.w + 150, y: D.h * 0.68};
    handRest = {x: D.w - 40, y: D.h * 0.7};
    return finish(TT);
  }
  // 'down': the contract on top; the slip hangs below the socket on its bottom edge
  const portrait = shape === 'portrait';
  slipW = portrait ? clamp(D.w * 0.5, 300, 440) : clamp(D.w * 0.31, 300, 400);
  const TT = slipText(ctx, p, slipW, F, minF, stress, D.h * (portrait ? 0.24 : 0.27));
  const zoneA = prong + 8 + TT.h + 22;
  const zoneB = portrait ? TT.h + 30 + capH : 0;
  const sideW = portrait ? 0 : slipW + 50;
  sheet = {x: m, y: m, w: D.w - 2 * m - sideW, h: D.h - 2 * m - zoneA - zoneB};
  S = sheetText(p, sheet.w, F, minF, {stress, rail: 54});
  if (S.need > sheet.h - 34) why.push('sheet-text');
  rows = placeRows(S, sheet.h - 20, F);
  const row = rows[pi];
  const railX = sheet.w - 20 - slipW / 2;
  const mx = sheet.w - 30;
  const by = sheet.h - 14;
  railD = `M${r(S.padX + S.rowW)} ${r(row.y + row.h / 2)}H${r(mx)}V${r(by)}H${r(railX)}V${r(sheet.h - 4)}`;
  railLen = (mx - S.padX - S.rowW) + (by - row.y - row.h / 2) + (mx - railX) + 10;
  railGeo = {mx: sheet.x + mx, by: sheet.y + by};
  sock = {x: sheet.x + railX, y: sheet.y + sheet.h, dir: 'down'};
  tipDock = {x: sock.x, y: sock.y + 4};
  const lw = clamp(D.w * (portrait ? 0.24 : 0.17), 180, 250), lh = lw * 0.66, hl = lw * 0.6;
  lensDim = {lw, lh, hl};
  const zTop = sheet.y + sheet.h + 18;
  const dockL = tipDock.x - slipW / 2;
  if (portrait) {
    const bTop = D.h - m - capH - TT.h - 6;
    tipRest = {x: D.w - m - 14 - slipW / 2, y: bTop - prong};
    lensRest = {centre: {x: m + 30 + lw / 2, y: D.h - m - capH - lh / 2 - 20}, a: 180};
    const rx0 = Math.max(lensRest.centre.x + lw / 2 + hl + 30, D.w - m - 30 - slipW - 40);
    regions = [
      {x: rx0, w: D.w - m - 6 - rx0, top: bTop - 10, bottom: D.h - m - capH},
      {x: m + 6, w: dockL - 30 - m - 6, top: zTop + 6, bottom: tipDock.y + prong + TT.h},
    ];
  } else {
    const sx = D.w - m - slipW - 10;
    tipRest = {x: sx + slipW / 2, y: m + 4};
    lensRest = {centre: {x: D.w - m - 18 - hl - lw / 2, y: D.h - m - capH - lh / 2 - 16}, a: 180};
    regions = [
      {x: sx - 20, w: slipW + 30, top: m + 6, bottom: lensRest.centre.y - lh / 2 - 30},
      {x: m + 6, w: dockL - 30 - m - 6, top: zTop + 6, bottom: D.h - m},
    ];
  }
  shoulder = {x: D.w * (portrait ? 0.7 : 0.8), y: D.h + 170};
  handRest = {x: D.w * (portrait ? 0.7 : 0.8), y: D.h - 30};
  return finish(TT);

  function finish(TT) {
    const side = mode === 'right' ? 'left' : 'top';
    const boxAt = tip => { const b = slipBox(TT, side, prong); return {x: tip.x + b.x, y: tip.y + b.y, w: b.w, h: b.h}; };
    const dockBox = boxAt(tipDock), restBox = boxAt(tipRest);
    // the grip: the slip's far end (the hand comes from the right or from below)
    const grip = side === 'left' ? {x: prong + TT.w - 22, y: 0} : {x: 0, y: prong + TT.h - 20};
    const approach = side === 'left' ? {x: tipDock.x + 70, y: tipDock.y} : {x: tipDock.x, y: Math.min(tipDock.y + 60, D.h - m + 10 - prong - TT.h)};
    if (side === 'top' && approach.y - tipDock.y < 24) why.push('no-push-room');
    // the carried slip must not pass over the contract: if the straight path would cross it, go round via a corner
    const restB0 = slipBox(TT, side, prong);
    const sweep = {x: Math.min(tipRest.x, approach.x) + restB0.x, y: Math.min(tipRest.y, approach.y) + restB0.y, w: Math.abs(tipRest.x - approach.x) + restB0.w, h: Math.abs(tipRest.y - approach.y) + restB0.h};
    const carryVia = side === 'top' && overlaps(sweep, sheet, -2) ? {x: tipRest.x, y: approach.y} : null;
    // the scope outline round the promise line and the docked slip
    const row = rows[pi];
    const rl = sheet.x + S.padX - 22, rt = sheet.y + row.y - 12, rb = sheet.y + row.y + row.h + 12;
    const pad = 16;
    let P;
    if (side === 'left') {
      const sx = sock.x + 8;
      P = [{x: rl, y: rb}, {x: rl, y: rt}, {x: sx, y: rt}, {x: sx, y: dockBox.y - pad}, {x: dockBox.x + dockBox.w + pad, y: dockBox.y - pad},
        {x: dockBox.x + dockBox.w + pad, y: dockBox.y + dockBox.h + pad}, {x: sx, y: dockBox.y + dockBox.h + pad}, {x: sx, y: rb}];
    } else {
      const xr = railGeo.mx + 24, xl = railGeo.mx - 24, yb = railGeo.by - 20;
      const top = dockBox.y - pad;
      if (rb > yb - 14) P = [{x: rl, y: rb}, {x: rl, y: rt}, {x: xr, y: rt}, {x: xr, y: top}, {x: Math.max(xr, dockBox.x + dockBox.w + pad), y: top},
        {x: Math.max(xr, dockBox.x + dockBox.w + pad), y: dockBox.y + dockBox.h + pad}, {x: dockBox.x - pad, y: dockBox.y + dockBox.h + pad},
        {x: dockBox.x - pad, y: top}, {x: sock.x - 34, y: top}, {x: sock.x - 34, y: rb}];
      else P = [{x: rl, y: rb}, {x: rl, y: rt}, {x: xr, y: rt}, {x: xr, y: top}, {x: Math.max(xr, dockBox.x + dockBox.w + pad), y: top},
        {x: Math.max(xr, dockBox.x + dockBox.w + pad), y: dockBox.y + dockBox.h + pad}, {x: dockBox.x - pad, y: dockBox.y + dockBox.h + pad},
        {x: dockBox.x - pad, y: top}, {x: sock.x - 34, y: top}, {x: sock.x - 34, y: yb}, {x: xl, y: yb}, {x: xl, y: rb}];
    }
    const loop = roundedLoop(P, 18);
    const badge = side === 'left' ? {x: dockBox.x + dockBox.w + pad, y: dockBox.y + dockBox.h * 0.5} : {x: dockBox.x + dockBox.w + pad, y: dockBox.y + dockBox.h * 0.5};
    // reading position: the lens centre on the joint, the grip below-right of it
    const lensRead = {centre: {x: sock.x + (side === 'left' ? 30 : 0), y: sock.y + (side === 'left' ? 0 : 30)}, a: side === 'left' ? 215 : 240};
    const gripOfLens = L0 => { const a = (L0.a * Math.PI) / 180, d = lensDim.hl + lensDim.lw / 2; return {x: L0.centre.x - Math.cos(a) * d, y: L0.centre.y - Math.sin(a) * d}; };
    const lensGripRest = gripOfLens(lensRest), lensGripRead = gripOfLens(lensRead);
    const targets = [{x: tipRest.x + grip.x, y: tipRest.y + grip.y}, {x: tipDock.x + grip.x, y: tipDock.y + grip.y}, {x: approach.x + grip.x, y: approach.y + grip.y}, lensGripRest, lensGripRead];
    const far = Math.max(...targets.map(q => Math.hypot(q.x - shoulder.x, q.y - shoulder.y)));
    const near = Math.min(...targets.map(q => Math.hypot(q.x - shoulder.x, q.y - shoulder.y)));
    const armW = clamp(far * 0.075, 46, 74);
    const upper = far * 0.53, lower = far * 0.47 - 24 * 1.3 * (armW / 46);
    if (near < Math.abs(upper - lower - 24 * 1.3 * (armW / 46)) + 20) why.push('arm-too-close');
    // the lens at rest must stay clear of the docked slip, the rest slip and the sheet
    const lensBoxAt = L0 => ({x: L0.centre.x - lensDim.lw / 2 - 12, y: L0.centre.y - lensDim.lh / 2 - 12, w: lensDim.lw + 24, h: lensDim.lh + 24});
    const lensRestBox = lensBoxAt(lensRest);
    if (overlaps(lensRestBox, dockBox) || overlaps(lensRestBox, restBox) || overlaps(lensRestBox, sheet)) why.push('lens-rest-collides');
    // the hold notes: status tag, key, editorial notes — greedily into the free regions
    const notes = [];
    const ORDER = ['claim', 'clause', 'lens'];
    if (show) notes.push({name: 'final', kind: 'final', text: p.stateLabels[p.finalState], worst: worstState(p)});
    if (show && p.objectLabels.socket) notes.push({name: 'sockLabel', kind: 'label', text: p.objectLabels.socket});
    if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
    if (show) p.annotations.map((an, i) => ({name: `note${i}`, kind: 'note', text: an.text, target: an.target})).sort((a, b) => ORDER.indexOf(a.target) - ORDER.indexOf(b.target)).forEach(q => notes.push(q));
    const gap = 14;
    const chipOf = (q, x, y, w, text) => chipG(ctx, text ?? q.text, {x, y, maxWidth: w, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name,
      glyph: q.kind === 'final' ? (gx, gy, rr) => stateGlyph(ctx, p.finalState, gx, gy, rr) : null,
      fill: q.kind === 'final' ? ctx.theme.accent2Soft : q.kind === 'label' ? '#f6e3b4' : ctx.theme.card});
    const used = regions.map(rg => ({...rg, y: rg.top}));
    const placed = [];
    // down mode: the socket label sits just left of the prong, under the sheet edge
    const li = notes.findIndex(q => q.kind === 'label');
    if (side === 'top' && li >= 0) {
      const q = notes[li];
      const xr = dockBox.x - 18, wAvail = xr - (m + 6);
      const c = chipOf({...q}, xr, sheet.y + sheet.h + 12, wAvail);
      if (wAvail >= 160 && !c.bad) {
        const c2 = chipG(ctx, q.text, {x: xr, y: sheet.y + sheet.h + 12, anchor: 'end', maxWidth: wAvail, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 700, name: q.name, fill: '#f6e3b4'});
        placed.push({q, c: c2});
        notes.splice(li, 1);
        for (const rg of used) if (overlaps({x: rg.x, y: rg.y, w: rg.w, h: rg.bottom - rg.y}, c2.box)) rg.y = Math.max(rg.y, c2.box.y + c2.box.h + gap);
      }
    }
    for (const q of notes) {
      let ok = false;
      for (const rg of used) {
        if (rg.w < 160) continue;
        const c = chipOf(q, rg.x, rg.y, rg.w, q.worst);
        if (rg.y + c.box.h > rg.bottom + 0.5 || c.bad) continue;
        const real = chipOf(q, rg.x, rg.y, rg.w);
        placed.push({q, c: real});
        rg.y += c.box.h + gap;
        ok = true;
        break;
      }
      if (!ok) why.push(`note-${q.name}`);
    }
    if (TT.bad) why.push('slip-text');
    return {
      ok: !why.length, why, F, minF, mode, side, sheet, S, rows, pi, prong, slipW, TT, sock, tipDock, tipRest, approach, grip,
      dockBox, restBox, loop, badge, carryVia, lensDim, lensRest, lensRead, lensGripRest, lensGripRead, lensRestBox, shoulder, handRest,
      armW, upper, lower, placed, railD, railLen, stress,
    };
  }
}

const scene = {
  sizes: {landscape: [1800, 790], square: [1240, 960], portrait: [900, 1290]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [23, 21, 19.5, 18, 17] : [28, 26.5, 25, 23, 21.5, 20.5]) {
      L = geom(ctx, fpx / upx, minF);
      if (L.ok) break;
    }
    L.upx = upx;
    L.arm = topArm(ctx, {name: 'arm', skin: '#d9a77f', sleeve: '#3d5a6c', handed: 'right', upper: L.upper, lower: L.lower, width: L.armW});
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const D = ctx.design;
    const desk = deskWindow(ctx, {prefix: 'desk', x: 0, y: 0, w: D.w, h: D.h, radius: 30});
    const {sheet, S} = L;
    const sheetNode = g({transform: T(sheet.x, sheet.y)},
      contractSheet(ctx, {prefix: 'c-', w: sheet.w, h: L.mode === 'down' ? sheet.h : sheet.h, S, rows: L.rows, showText: show, railD: L.railD, promise: L.pi, fillerStop: L.mode === 'down' ? 30 : 24}),
      h('path', {name: 'railLit', d: L.railD, fill: 'none', stroke: th.accent2, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.railLen + 4)} ${r(L.railLen + 30)}`, 'stroke-dashoffset': r(L.railLen + 4)}),
    );
    const row = L.rows[L.pi];
    const rowHi = h('rect', {name: 'rowHi', x: r(sheet.x + S.padX - 14), y: r(sheet.y + row.y - 5), width: r(S.rowW + 18), height: r(row.h + 10), rx: 10, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0});
    const sock = g({transform: T(L.sock.x, L.sock.y)}, socketArt(ctx, 'sock', L.sock.dir, 1.05));
    // the slip's resting mark on the desk (a faint shadow outline)
    const restMark = h('path', {d: roundRectPath2(L.restBox), fill: 'none', stroke: '#9c7550', 'stroke-width': 2, opacity: 0.35});
    const slip = claimSlip(ctx, {name: 'slip', T: L.TT, side: L.side, prong: L.prong, showText: show});
    const loopNode = scopeNode('scope', L.loop, p.finalState === 'disputed');
    const badge = g({name: 'badge', opacity: 0}, h('circle', {cx: r(L.badge.x), cy: r(L.badge.y), r: 22, fill: '#fff', stroke: INK, 'stroke-width': 2}), stateGlyph(ctx, p.finalState, L.badge.x, L.badge.y, 12));
    // the lens lying on the desk is drawn under the arm; once picked up it is drawn above the slip (same transform)
    const lens = g({name: 'lensHi', opacity: 0}, readingLens(ctx, {name: 'lens', ...L.lensDim}));
    const lensLow = g({name: 'lensLo'}, readingLens(ctx, {name: 'lensLow', ...L.lensDim}));
    const notes = L.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node));
    const leads = L.placed.filter(pl => pl.q.kind === 'note' || pl.q.kind === 'label').map(pl => leader(ctx, L, pl));
    const capFit = show && p.actorLabels.a ? fitG(p.actorLabels.a, {maxWidth: 360, size: L.F * 0.9, minSize: L.minF, maxLines: 1, weight: 700}) : null;
    const cap = capFit ? capNode(ctx, L, capFit) : null;
    return g({name: 'scene'},
      desk.surface,
      restMark,
      sheetNode, rowHi,
      loopNode,
      lensLow,
      g({'clip-path': desk.clip}, L.arm.arm, L.arm.palm),
      slip,
      sock,
      badge,
      g({'clip-path': desk.clip}, lens, L.arm.thumb),
      leads, notes,
      cap,
      desk.frame,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const E = ease.inOutCubic;
    const mixP = (P, Q, t) => ({x: lerp(P.x, Q.x, t), y: lerp(P.y, Q.y, t)});
    const add = (P, Q) => ({x: P.x + Q.x, y: P.y + Q.y});
    const gripRest = add(L.tipRest, L.grip), gripApp = add(L.approach, L.grip), gripDock = add(L.tipDock, L.grip);
    const reach = seg(a, ...W.reach), carry = seg(a, ...W.carry), push = seg(a, ...W.push), toL = seg(a, ...W.toLens), raise = seg(a, ...W.raise), lower = seg(a, ...W.lower), leave = seg(a, ...W.leave);
    // the carry path: lifted in an arc from the rest spot to the approach point
    const arcP = t => {
      const q = E(t);
      if (!L.carryVia) { const P0 = mixP(gripRest, gripApp, q); const lift = Math.sin(Math.PI * q) * 40; return {x: P0.x, y: P0.y - lift}; }
      // round the sheet: down the free column first, then across under the sheet edge (a quadratic through the corner)
      const c = add(L.carryVia, L.grip);
      return {x: (1 - q) ** 2 * gripRest.x + 2 * (1 - q) * q * c.x + q * q * gripApp.x, y: (1 - q) ** 2 * gripRest.y + 2 * (1 - q) * q * c.y + q * q * gripApp.y};
    };
    let hand, phase;
    if (leave > 0) { hand = mixP(L.lensGripRest, L.handRest, E(leave)); phase = leave >= 1 ? 'away' : 'leaving'; }
    else if (lower > 0) { hand = mixP(L.lensGripRead, L.lensGripRest, E(lower)); phase = 'lowering'; }
    else if (raise > 0) { hand = mixP(L.lensGripRest, L.lensGripRead, E(raise)); phase = raise >= 1 ? 'reading' : 'raising'; }
    else if (toL > 0) { hand = mixP(gripDock, L.lensGripRest, E(toL)); phase = 'to-lens'; }
    else if (push > 0) { hand = mixP(gripApp, gripDock, ease.inOutSine(push)); phase = push >= 1 ? 'seated' : 'pushing'; }
    else if (carry > 0) { hand = arcP(carry); phase = 'carrying'; }
    else if (reach > 0) { hand = mixP(L.handRest, gripRest, E(reach)); phase = 'reaching'; }
    else { hand = L.handRest; phase = 'rest'; }
    const holdsSlip = reach >= 1 && toL === 0;
    const holdsLens = toL >= 1 && leave === 0;
    const bend = L.mode === 'right' ? 1 : -1;
    const posed = L.arm.pose(L.shoulder, hand, bend);
    Object.assign(nodes, posed.nodes);
    const H = posed.hand;
    const tip = holdsSlip ? {x: H.x - L.grip.x, y: H.y - L.grip.y} : (toL > 0 ? L.tipDock : L.tipRest);
    nodes.slip = {transform: T(r(tip.x, 2), r(tip.y, 2))};
    const seated = push >= 1;
    nodes['sock-ring'] = {opacity: seated ? 1 : 0};
    const lit = seg(a, W.push[1], W.push[1] + 0.05);
    nodes.railLit = {'stroke-dashoffset': r((L.railLen + 4) * (1 - ease.outCubic(lit)), 2)};
    nodes.rowHi = {opacity: r(lit, 3)};
    // the lens
    const lensGrip = holdsLens ? H : L.lensGripRest;
    const lensA = holdsLens ? (lower > 0 ? lerp(L.lensRead.a, L.lensRest.a, E(lower)) : lerp(L.lensRest.a, L.lensRead.a, E(raise))) : L.lensRest.a;
    nodes.lens = {transform: T(r(lensGrip.x, 2), r(lensGrip.y, 2), r(lensA, 2))};
    nodes.lensLow = nodes.lens;
    nodes.lensHi = {opacity: holdsLens ? 1 : 0};
    nodes.lensLo = {opacity: holdsLens ? 0 : 1};
    const lc = lensCentreOf(lensGrip, lensA, L.lensDim);
    // the scope outline, once the lens has reached the joint
    const sq = ease.inOutSine(seg(a, ...W.scope));
    Object.assign(nodes, scopeFrame('scope', L.loop, sq));
    nodes.badge = {opacity: r(seg(a, W.scope[1] - 0.02, W.scope[1] + 0.01), 3)};
    const fin = done ? seg(u, ...W.final) : 0, keyO = done ? seg(u, ...W.key) : 0, noteO = done ? seg(u, ...W.notes) : 0;
    for (const pl of L.placed) {
      const o = pl.q.kind === 'final' ? fin : pl.q.kind === 'key' ? keyO : noteO;
      nodes[`${pl.q.name}-g`] = {opacity: r(o, 3)};
      if (pl.q.kind === 'note' || pl.q.kind === 'label') nodes[`${pl.q.name}-lead`] = {opacity: r(o, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat, phase, hand: P2(H), slipTip: P2(tip), slipGrip: P2(add(tip, L.grip)), lensGrip: P2(lensGrip), lensCentre: P2(lc),
        joint: P2(L.lensRead.centre), holdsSlip, holdsLens, seated, connected: lit >= 1, scope: r(sq, 3), scopeClosed: sq >= 1,
        scopeStyle: p.finalState === 'disputed' ? 'dashed' : 'solid', finalState: p.finalState,
        slipAt: holdsSlip ? 'hand' : toL > 0 ? 'socket' : 'rest',
        lensParked: !holdsLens, finalShown: r(fin, 3), keyShown: r(keyO, 3), allReached: posed.reached,
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        actionCapped: p.actionProgress < 1 && u > capU,
        lensBox: {x: r(L.lensRestBox.x), y: r(L.lensRestBox.y), w: r(L.lensRestBox.w), h: r(L.lensRestBox.h)},
        noteBoxes: L.placed.map(pl => ({x: r(pl.c.box.x), y: r(pl.c.box.y), w: r(pl.c.box.w), h: r(pl.c.box.h)})),
        dockBox: {x: r(L.dockBox.x), y: r(L.dockBox.y), w: r(L.dockBox.w), h: r(L.dockBox.h)},
      },
    };
  },
};

function roundRectPath2(b) {
  const x = b.x - 6, y = b.y - 6, w = b.w + 12, hh = b.h + 12, rr = 12;
  return `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
}

function capNode(ctx, L, f) {
  const D = ctx.design;
  const w = f.width + 28, hh = f.height + 14;
  const x = L.mode === 'right' || ctx.view.shape === 'square' ? D.w - 26 - w : L.handRest.x - 80 - w;
  const y = D.h - 22 - hh;
  return g({name: 'cap'},
    h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 8, fill: '#3d5a6c', stroke: INK, 'stroke-width': 2}),
    txt(f, {x: x + w / 2, y: y + 7, anchor: 'middle', fill: '#ffffff'}),
  );
}

/** The point of box A (inset) nearest to the centre of box B. */
function nearestIn(A, B, inset) {
  const c = {x: B.x + B.w / 2, y: B.y + B.h / 2};
  return {x: clamp(c.x, A.x + inset, A.x + A.w - inset), y: clamp(c.y, A.y + inset, A.y + A.h - inset)};
}

function leader(ctx, L, pl) {
  const b = pl.c.box;
  let t;
  if (pl.q.kind === 'label') t = L.side === 'left' ? {x: L.sock.x - 6, y: L.sock.y - 30} : {x: L.sock.x - 28, y: L.sock.y - 14};
  else if (pl.q.target === 'claim') t = nearestIn(L.dockBox, b, 14);
  else if (pl.q.target === 'clause') { const row = L.rows[L.pi]; t = nearestIn({x: L.sheet.x + L.S.padX, y: L.sheet.y + row.y, w: L.S.rowW - 10, h: row.h}, b, 8); }
  else t = {x: L.lensRest.centre.x, y: L.lensRest.centre.y - L.lensDim.lh / 2};
  const from = {x: clamp(t.x, b.x + 12, b.x + b.w - 12), y: t.y < b.y ? b.y : t.y > b.y + b.h ? b.y + b.h : b.y + b.h / 2};
  if (t.x < b.x) from.x = b.x; else if (t.x > b.x + b.w) from.x = b.x + b.w;
  // long leaders would cross the scene: the chip then sits without one (it is placed next to its target region)
  if (Math.hypot(t.x - from.x, t.y - from.y) > 240) return g({name: `${pl.q.name}-lead`, opacity: 0});
  return g({name: `${pl.q.name}-lead`, opacity: 0},
    h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(t.x)} ${r(t.y)}`, stroke: ctx.theme.inkSoft, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(t.x), cy: r(t.y), r: 6, fill: ctx.theme.inkSoft, stroke: '#fff', 'stroke-width': 2}),
  );
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-07-story',
    title: 'Indemnity clause, without doctrine — a hand plugs a claim slip into the socket of the supplied promise of cover and reads the joint with a lens',
    titleEs: 'Cláusula de indemnidad — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de indemnidad',
    treatment: 'story',
    family: 'staged-scene',
    description: 'On a desk seen from above, the contract "CT-412 · Supply contract (fictional)" shows the heading "Indemnity clause" and its supplied clause lines; the line holding the supplied promise of cover has a printed rail to a brass socket on the sheet edge. A hand takes the claim slip "Claim 1 (supplied)" and plugs its brass prong into the socket: the socket ring and the rail light up to the promise line. The hand then holds a rectangular reading lens over the joint, and a scope outline is drawn round the promise line and the claim — solid for "Claim covered as per supplied data" (●), dashed for "Scope disputed (as supplied)" (◆), same colour and width. The lens is parked and the hand leaves; the hold shows the supplied status and the key "As supplied · no conclusion drawn". No indemnity doctrine, no duty to pay, no amount unless supplied and labelled hypothetical.',
    tags: ['indemnity clause', 'claim', 'promise of cover', 'contract', 'socket', 'prong', 'reading lens', 'scope outline', 'desk', 'hand', 'equal weight', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-indemnidad.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
