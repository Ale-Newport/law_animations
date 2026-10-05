/**
 * LAW-0507 — Cláusula de indemnidad · contrast
 *
 * Storyboard (two identical pegboard benches; only the supplied scope status differs):
 *  0.00–0.15  rest: bench A and bench B are identical — on each pegboard hangs the clause card ("CT-412 · Indemnity
 *             clause" and the supplied promise line, with a brass socket on its edge); the claim slip "Claim 1
 *             (supplied)" stands on a carriage at the far end of a track; above it a brass caliper beam carries a fixed
 *             jaw at the card's edge and a sliding jaw parked at the far end. Headers: A "Claim covered as per supplied
 *             data", B "Scope disputed (as supplied)". The supplied clause lines are drawn once, in a shared strip.
 *  0.15–0.42  in both benches the slip rolls along its track to the card and its prong seats in the socket (identical).
 *  0.42–0.52  in both benches the sliding jaw starts to close (identical so far).
 *  0.52–0.62  the change: in A the jaw closes on the far edge of the claim (● on the jaw); in B it is held apart, short of
 *             the claim, and the open span is drawn dashed (◆ on the jaw) — same jaw, colour and stroke in both.
 *  0.62–0.80  a highlight guide outlines both sliding jaws ("Only the supplied scope status differs"); the neutral note
 *             fades in. Hold to 1.00: no winner, no score, no outcome.
 * No indemnity doctrine: no duty to indemnify or pay, nothing decided beyond the supplied statuses, no amount unless
 * supplied (labelled hypothetical), no jurisdiction.
 * @module animations/contract-terms/LAW-0507
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, num} from '../../schemas/fields.js';
import {
  INK, BRASS, SCOPE, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, promiseField, claimField,
  promiseIndex, localizeScene, unitPx, fitG, chipG, txt, stateGlyph, socketArt, slipText, claimSlip, slipBox, shade,
} from './kits/clausula-indemnidad.js';

const ID = 'LAW-0507';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {roll: [0.15, 0.36], seat: [0.36, 0.42], jaw1: [0.42, 0.52], jaw2: [0.52, 0.62], span: [0.58, 0.66], guide: [0.64, 0.72], note: [0.7, 0.78]};
const CHANGE_AT = 0.52;

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  promise: promiseField,
  claim: claimField,
  scenarioA: obj('Scenario A (its supplied status: the caliper closes on the claim)', {label: str('Header of scenario A, as supplied', 60)}, ['label']),
  scenarioB: obj('Scenario B (its supplied status: the caliper is held apart, the open span dashed)', {label: str('Header of scenario B, as supplied (stays an allegation: nothing is decided)', 60)}, ['label']),
  comparisonLabels: obj('Labels of the comparison', {
    guide: str('Label of the guide that outlines the one differing detail', 70),
    neutral: str('Neutral note (no winner, no outcome)', 120),
    shared: str('Heading of the shared strip of clause lines', 50),
  }),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
};

const strip = o => { const {stateLabels, ...rest} = o; void stateLabels; return rest; };
const defaultParams = {
  ...strip(CONTENT),
  scenarioA: {label: 'Claim covered as per supplied data'},
  scenarioB: {label: 'Scope disputed (as supplied)'},
  comparisonLabels: {guide: 'Only the supplied scope status differs', neutral: 'Same contract, same claim, same connection · statuses as supplied · no outcome drawn', shared: 'Clause lines (shared)'},
  actionProgress: 1,
};
const defaultParamsEs = {
  ...strip(CONTENT_ES),
  scenarioA: {label: 'Reclamación cubierta según los datos aportados'},
  scenarioB: {label: 'Alcance discutido (según lo aportado)'},
  comparisonLabels: {guide: 'Solo difiere el estado de alcance aportado', neutral: 'Mismo contrato, misma reclamación, misma conexión · estados según lo aportado · sin conclusión', shared: 'Líneas de la cláusula (comunes)'},
};

const isStress = p => [...p.clauses, p.claim.label, p.contract.title, p.scenarioA.label, p.scenarioB.label, p.clauseTitle].some(t => t.length > 48);

/* ---------------------------------------------------------------------- */
/* Layout                                                                  */
/* ---------------------------------------------------------------------- */

/** One bench's geometry in local coordinates (origin = bench top-left). */
function benchGeom(ctx, p, bw, bh, F, minF, stress, headerTextH) {
  const why = [];
  const pi = promiseIndex(p);
  const prong = 50;
  const headerH = Math.max(headerTextH, F * 1.6) + 22;
  const pad = 22;
  const panel = {x: 0, y: headerH + 8, w: bw, h: bh - headerH - 8};
  const cw = clamp(bw * (bw > 1000 ? 0.34 : bw < 820 ? 0.42 : 0.39), 250, 520);
  const head = fitG(p.contract.reference, {maxWidth: cw - 40, size: F, minSize: minF, maxLines: 2, weight: 700});
  const rowFit = fitG(p.clauses[pi], {maxWidth: cw - 70, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600});
  const bandH = head.height + F * 0.8;
  const rowH = rowFit.height + F * 0.95;
  const ch0 = bandH + 22 + rowH + 30;
  const panelH0 = bh - headerH - 8;
  const sw = clamp(bw * 0.25, 205, 340);
  const TT = slipText(ctx, p, sw, F, minF, stress, Math.max(F * 4.4, (panelH0 - 34 - 28 - 46) * 0.55));
  const PA = 0.3;
  TT.prongAt = PA;
  const ch = Math.max(ch0, Math.min(TT.h * 1.1, panelH0 - 96));
  if (head.bad || rowFit.bad || TT.bad) why.push('bench-text');
  const beamGap = 34, trackH = 18;
  const stackH = beamGap + TT.h + trackH + 10;
  void stackH;
  // slip centre = promise row centre: centred in the panel, lowered if the card's head band needs room above the row
  const cyMin = Math.max(panel.y + 40 + bandH + 14 + rowH / 2, panel.y + 12 + beamGap + 16 + TT.h * PA);
  const cyMax = panel.y + panel.h - 10 - trackH - 10 - TT.h * (1 - PA);
  const cy = clamp(panel.y + 16 + (panel.h - 16) / 2, cyMin, Math.max(cyMin, cyMax));
  if (cyMin > cyMax + 0.5) why.push('bench-too-short');
  const top = panel.y + 36, bot = panel.y + panel.h - 8;
  const chh = Math.min(ch, bot - top);
  const card = {x: pad, y: clamp(cy - chh / 2, top, bot - chh), w: cw, h: chh};
  const row = {x: card.x + 20, y: cy - rowH / 2, w: cw - 30, h: rowH};
  if (row.y < card.y + bandH + 14) { const d = card.y - (row.y - bandH - 14); card.y -= d; }
  if (card.y + card.h < row.y + rowH + 16) card.h = row.y + rowH + 16 - card.y;
  if (card.y - 30 < panel.y + 4 || card.y + card.h > panel.y + panel.h - 6) why.push('card-off-panel');
  const sock = {x: card.x + cw, y: cy};
  const dock = {x: sock.x + 4, y: cy};
  const sb = slipBox(TT, 'left', prong);
  const beamY = cy - TT.h * PA - beamGap / 2 - 6;
  const trackY = cy + TT.h * (1 - PA) + 4;
  const right = bw - pad;
  const jawW = 22;
  const restTip = {x: right - jawW - 26 - sw - prong, y: cy};
  const travel = restTip.x - dock.x;
  if (travel < 70) why.push('no-travel');
  const slipFar = dock.x + prong + sw; // far edge of the docked slip
  const jawPark = right - jawW / 2 - 4;
  const jawClosed = slipFar + jawW / 2 + 2;
  const jawOpen = Math.min(jawPark - 30, slipFar + Math.max(60, (jawPark - slipFar) * 0.62));
  const jawMid = lerp(jawPark, jawOpen, 0.5); // both benches reach here identically before the change
  if (jawOpen - jawClosed < 40) why.push('no-open-gap');
  return {orient: 'h', why, prong, headerH, panel, card, row, head, rowFit, bandH, rowH, TT, sb, sock, dock, restTip, beamY, trackY, jawW, jawPark, jawClosed, jawOpen, jawMid, slipFar, right, cy, pad};
}

/** Vertical bench (square frames, side by side): the card on top, the slip rises to the socket on its lower edge. */
function benchGeomV(ctx, p, bw, bh, F, minF, stress, headerTextH) {
  const why = [];
  const pi = promiseIndex(p);
  const prong = 50;
  const headerH = Math.max(headerTextH, F * 1.6) + 22;
  const pad = 20;
  const panel = {x: 0, y: headerH + 8, w: bw, h: bh - headerH - 8};
  const cw = bw - 2 * pad;
  const head = fitG(p.contract.reference, {maxWidth: cw - 40, size: F, minSize: minF, maxLines: 2, weight: 700});
  const rowFit = fitG(p.clauses[pi], {maxWidth: cw - 70, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600});
  const bandH = head.height + F * 0.8;
  const rowH = rowFit.height + F * 0.95;
  const ch = bandH + 22 + rowH + 26;
  const sw = clamp(bw * 0.46, 205, 320);
  const TT = slipText(ctx, p, sw, F, minF, stress, F * 4.4);
  if (head.bad || rowFit.bad || TT.bad) why.push('bench-text');
  const card = {x: pad, y: panel.y + 36, w: cw, h: ch};
  const row = {x: card.x + 20, y: card.y + bandH + 22, w: cw - 30, h: rowH};
  const slipR = card.x + cw - 44;
  const sock = {x: slipR - sw / 2, y: card.y + ch};
  const dock = {x: sock.x, y: sock.y + 4};
  const sb = slipBox(TT, 'top', prong);
  const jawW = 22;
  const bottom = panel.y + panel.h - 12;
  const jawPark = bottom - jawW / 2 - 4;
  const restTip = {x: dock.x, y: jawPark - jawW / 2 - 26 - TT.h - prong};
  const travel = restTip.y - dock.y;
  if (travel < 70) why.push('no-travel');
  const slipFar = dock.y + prong + TT.h;
  const jawClosed = slipFar + jawW / 2 + 2;
  const jawOpen = Math.min(jawPark - 30, slipFar + Math.max(60, (jawPark - slipFar) * 0.62));
  const jawMid = lerp(jawPark, jawOpen, 0.5);
  if (jawOpen - jawClosed < 40) why.push('no-open-gap');
  const beamX = slipR + 26, trackX = slipR - sw - 22;
  if (beamX + 12 > bw - 4) why.push('beam-off-panel');
  return {orient: 'v', why, prong, headerH, panel, card, row, head, rowFit, bandH, rowH, TT, sb, sock, dock, restTip, beamX, trackX, jawW, jawPark, jawClosed, jawOpen, jawMid, slipFar, right: bw - pad, pad, bottom};
}

function geom(ctx, F, minF, side, colMode = false) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 26;
  // bottom band: shared clause strip (once, chips flowing in rows), guide chip, neutral note
  const vMode = colMode; colMode = false;
  const colW = 0;
  const fullW = colMode ? colW : D.w - 2 * m;
  const sharedText = [p.comparisonLabels.shared, `${p.contract.reference} · ${p.contract.title} · ${p.clauseTitle}`].filter(Boolean).join(' — ');
  const sharedHead = show ? fitG(sharedText, {maxWidth: fullW - 30, size: F, minSize: minF, maxLines: colMode ? (stress ? 7 : 5) : (stress ? 3 : 2), weight: 700}) : null;
  if (sharedHead && sharedHead.bad) why.push('shared-head');
  const shared = show ? p.clauses.map((c, i) => ({i, fit: fitG(c, {maxWidth: fullW - 80, size: F, minSize: minF, maxLines: colMode && stress ? 4 : colMode ? 3 : 2, weight: 600})})) : [];
  if (shared.some(s0 => s0.fit.bad)) why.push('shared-text');
  let stripH = 0;
  if (shared.length) {
    let x = 0, y = sharedHead ? sharedHead.height + 10 : 0, rowH = 0;
    for (const q of shared) {
      const w = q.fit.width + 62, hh = q.fit.height + 18;
      if (x > 0 && x + w > fullW) { x = 0; y += rowH + 10; rowH = 0; }
      q.x = x; q.y = y; q.w = w; q.h = hh;
      x += w + 16; rowH = Math.max(rowH, hh);
    }
    stripH = y + rowH + 18;
  }
  const nLines = colMode ? (stress ? 9 : 6) : 2;
  const guideFit0 = show && p.comparisonLabels.guide ? fitG(p.comparisonLabels.guide, {maxWidth: (colMode ? fullW : fullW * 0.42) - 40, size: F, minSize: minF, maxLines: colMode ? 4 : 2, weight: 700}) : null;
  const noteFit0 = showKey && p.comparisonLabels.neutral ? fitG(p.comparisonLabels.neutral, {maxWidth: (colMode ? fullW : fullW - (guideFit0 ? guideFit0.width + 80 : 0)) - 40, size: F, minSize: minF, maxLines: nLines, weight: 500}) : null;
  const beside = !colMode && (!guideFit0 || !noteFit0 || (!guideFit0.bad && !noteFit0.bad));
  const guideFit = beside || colMode ? guideFit0 : fitG(p.comparisonLabels.guide, {maxWidth: fullW - 40, size: F, minSize: minF, maxLines: 2, weight: 700});
  const noteFit = beside || colMode ? noteFit0 : fitG(p.comparisonLabels.neutral, {maxWidth: fullW - 40, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 500});
  if ((guideFit && guideFit.bad) || (noteFit && noteFit.bad)) why.push('note-text');
  const gH = guideFit ? guideFit.height + 22 : 0, nH = noteFit ? noteFit.height + 22 : 0;
  const notesH = beside ? Math.max(gH, nH) : gH + (gH && nH ? 12 : 0) + nH;
  const bottomH = colMode ? 0 : stripH + (notesH ? notesH + 14 : 0);
  if (colMode && stripH + notesH + 14 > D.h - 2 * m) why.push('column-too-tall');
  const gap = side ? 40 : 26;
  const availH = D.h - 2 * m - bottomH;
  const bw = side ? (D.w - 2 * m - gap) / 2 : D.w - 2 * m - (colMode ? colW + 30 : 0);
  const bh = side ? availH : (availH - gap) / 2;
  const R0 = F * 0.9;
  const headerFits = [p.scenarioA.label, p.scenarioB.label].map(t => (show ? fitG(t, {maxWidth: bw - R0 * 2 - 40, size: F, minSize: minF, maxLines: 2, weight: 700}) : null));
  if (headerFits.some(f => f && f.bad)) why.push('header-text');
  const B = (vMode ? benchGeomV : benchGeom)(ctx, p, bw, bh, F, minF, stress, Math.max(0, ...headerFits.map(f => (f ? f.height : 0))));
  why.push(...B.why);
  const origins = side ? [{x: m, y: m}, {x: m + bw + gap, y: m}] : [{x: m, y: m}, {x: m, y: m + bh + gap}];
  const yb = colMode ? m + Math.max(0, (D.h - 2 * m - (stripH + notesH + 14)) / 2) : m + (side ? bh : 2 * bh + gap) + 14;
  const xb = colMode ? D.w - m - colW : m;
  return {ok: !why.length, why, F, minF, side, bw, bh, B, origins, headerFits, shared, sharedHead, stripH, guideFit, noteFit, gH, nH, yb, xb, colW, colMode, m, gap, stress, beside};
}

/* ---------------------------------------------------------------------- */
/* Art                                                                     */
/* ---------------------------------------------------------------------- */

function pegboard(ctx, P) {
  const parts = [
    h('path', {d: roundRectPath(P.x + 6, P.y + 8, P.w, P.h, 16), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(P.x, P.y, P.w, P.h, 16), fill: '#d9c4a0', stroke: INK, 'stroke-width': 2.6}),
  ];
  for (let y = P.y + 22; y < P.y + P.h - 10; y += 34) for (let x = P.x + 22; x < P.x + P.w - 10; x += 34) parts.push(h('circle', {cx: r(x), cy: r(y), r: 3.2, fill: '#a8916c'}));
  return g(null, parts);
}

function clauseCard(ctx, B, show, prefix) {
  const {card, row} = B;
  const lx = row.x - card.x;
  return g({transform: T(card.x, card.y)},
    // two hooks
    h('path', {d: `M${r(card.w * 0.22)} -26v18M${r(card.w * 0.78)} -26v18`, stroke: '#6b6f74', 'stroke-width': 6, 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(8, 10, card.w, card.h, 10), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(0, 0, card.w, card.h, 10), fill: '#fffdf7', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(0, 0, card.w, B.bandH, 10), fill: '#cfe1dd'}),
    h('path', {d: `M0 ${r(B.bandH)}H${r(card.w)}`, stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(card.w * 0.22), cy: 10, r: 6, fill: '#efe7d6', stroke: INK, 'stroke-width': 1.8}),
    h('circle', {cx: r(card.w * 0.78), cy: 10, r: 6, fill: '#efe7d6', stroke: INK, 'stroke-width': 1.8}),
    show ? txt(B.head, {x: 20, y: (B.bandH - B.head.height) / 2 + 4, fill: INK}) : h('path', {d: `M20 ${r(B.bandH / 2 + 4)}h${r(Math.min(card.w * 0.6, 240))}`, stroke: '#9fbcb6', 'stroke-width': 11, 'stroke-linecap': 'round'}),
    h('rect', {x: r(lx), y: r(row.y - card.y), width: r(row.w), height: r(row.h), rx: 7, fill: '#fff4d6', stroke: '#b79a55', 'stroke-width': 2.4}),
    h('path', {d: `M${r(lx + row.w)} ${r(row.y - card.y + row.h / 2)}H${r(card.w - 6)}`, stroke: '#b9ad94', 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {name: `${prefix}lit`, d: `M${r(lx + row.w)} ${r(row.y - card.y + row.h / 2)}H${r(card.w - 6)}`, stroke: ctx.theme.accent2, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0}),
    show ? txt(B.rowFit, {x: lx + 14, y: row.y - card.y + (row.h - B.rowFit.height) / 2, fill: INK}) : h('path', {d: `M${r(lx + 14)} ${r(row.y - card.y + row.h / 2)}h${r(Math.min(row.w - 40, 220))}`, stroke: '#cfc5b0', 'stroke-width': 9, 'stroke-linecap': 'round'}),
  );
}

/** Caliper jaw: a brass slider on the beam with a jaw plate hanging to the slip's mid-height. Origin = jaw centre on the beam. */
function jaw(ctx, name, B, fixed) {
  const len = B.cy - B.beamY + 10;
  const w = B.jawW;
  return g({name},
    h('rect', {x: r(-w), y: -16, width: r(w * 2), height: 32, rx: 7, fill: shade(BRASS, -0.12), stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(-w / 2)} 12V${r(len - 12)}Q${r(-w / 2)} ${r(len)} 0 ${r(len)}Q${r(w / 2)} ${r(len)} ${r(w / 2)} ${r(len - 12)}V12Z`, fill: BRASS, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    fixed ? h('circle', {cx: 0, cy: 0, r: 5, fill: '#6b5524'}) : h('path', {d: `M${r(-w * 0.55)} -6h${r(w * 1.1)}M${r(-w * 0.55)} 4h${r(w * 1.1)}`, stroke: '#6b5524', 'stroke-width': 2.4}),
  );
}

/* ---------------------------------------------------------------------- */

const scene = {
  sizes: {landscape: [1800, 790], square: [1240, 960], portrait: [900, 1290]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const modes = ctx.view.shape === 'landscape' ? [[true, false], [false, false]] : ctx.view.shape === 'square' ? [[true, true], [false, false]] : [[false, false]];
    let L = null;
    search: for (const fpx of stress ? [23, 21, 19.5, 18, 17] : [28, 26.5, 25, 23, 21.5, 20.5]) for (const [sd, cm] of modes) {
      L = geom(ctx, fpx / upx, minF, sd, cm);
      if (L.ok) break search;
    }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const show = ctx.show('all');
    const {B} = L;
    const lanes = [th.accent2, th.accent3];
    const benches = L.origins.map((o, k) => {
      const P = k === 0 ? 'a-' : 'b-';
      const dashed = k === 1;
      const hf = L.headerFits[k];
      const R = L.F * 0.9;
      const header = g(null,
        h('circle', {cx: r(R + 4), cy: r(B.headerH / 2), r: r(R), fill: lanes[k], stroke: INK, 'stroke-width': 2.4}),
        show ? h('text', {x: r(R + 4), y: r(B.headerH / 2 + L.F * 0.36), 'text-anchor': 'middle', 'font-size': r(L.F, 2), 'font-weight': 800, fill: '#ffffff', 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif"}, k === 0 ? 'A' : 'B') : h('circle', {cx: r(R + 4), cy: r(B.headerH / 2), r: r(R * 0.32), fill: '#ffffff'}),
        hf ? txt(hf, {x: R * 2 + 22, y: (B.headerH - hf.height) / 2, fill: th.fg}) : null,
      );
      const beamX0 = B.sock.x + 6;
      const beam = g(null,
        h('rect', {x: r(beamX0), y: r(B.beamY - 7), width: r(B.right - beamX0), height: 14, rx: 6, fill: '#8d969f', stroke: INK, 'stroke-width': 2.2}),
        h('path', {d: `M${r(beamX0 + 20)} ${r(B.beamY)}H${r(B.right - 12)}`, stroke: '#c6ccd2', 'stroke-width': 3}),
      );
      const track = g(null,
        h('rect', {x: r(B.sock.x + 4), y: r(B.trackY), width: r(B.right - B.sock.x - 4), height: 14, rx: 5, fill: '#6f5a43', stroke: INK, 'stroke-width': 2.2}),
      );
      const slip = g({name: `${P}slipG`},
        h('rect', {x: r(B.prong + 10), y: r(B.TT.h - 4), width: r(B.TT.w - 20), height: 10, rx: 4, fill: '#4a4f55'}),
        h('circle', {cx: r(B.prong + 24), cy: r(B.TT.h + 7), r: 7, fill: '#2b2f33'}),
        h('circle', {cx: r(B.prong + B.TT.w - 24), cy: r(B.TT.h + 7), r: 7, fill: '#2b2f33'}),
        claimSlip(ctx, {name: `${P}slip`, T: B.TT, side: 'left', prong: B.prong, showText: show}),
      );
      const spanY = B.beamY + 26;
      const span = h('path', {name: `${P}span`, d: `M${r(beamX0 + 14)} ${r(spanY)}H${r(beamX0 + 14)}`, fill: 'none', stroke: SCOPE, 'stroke-width': 7, 'stroke-linecap': dashed ? 'butt' : 'round', 'stroke-dasharray': dashed ? '18 11' : undefined, opacity: 0});
      const badge = g({name: `${P}badge`, opacity: 0}, h('circle', {cx: 0, cy: 0, r: 19, fill: '#fff', stroke: INK, 'stroke-width': 2}), stateGlyph(ctx, k === 0 ? 'covered' : 'disputed', 0, 0, 11));
      const guide = h('path', {name: `${P}guide`, d: roundRectPath(-B.jawW - 16, -30, B.jawW * 2 + 32, B.cy - B.beamY + 52, 14), fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});
      return g({transform: T(o.x, o.y)},
        header,
        pegboard(ctx, B.panel),
        clauseCard(ctx, B, show, P),
        track, beam,
        g({transform: T(B.sock.x, B.sock.y)}, socketArt(ctx, `${P}sock`, 'right', 1)),
        slip,
        g({transform: T(beamX0, B.beamY)}, jaw(ctx, `${P}jawFix`, B, true)),
        span,
        g({name: `${P}jawG`}, jaw(ctx, `${P}jaw`, B, false), badge, guide),
      );
    });
    // bottom band: shared strip, guide chip, note
    const bottom = [];
    let y = L.yb;
    if (L.shared.length) {
      const items = [];
      if (L.sharedHead) items.push(txt(L.sharedHead, {x: L.xb + 6, y, fill: th.fg}));
      for (const q of L.shared) {
        const x0 = L.xb + q.x, y0 = y + q.y;
        const pr = q.i === promiseIndex(ctx.params);
        items.push(h('path', {d: roundRectPath(x0, y0, q.w, q.h, 9), fill: pr ? '#fff4d6' : '#ffffff', stroke: pr ? '#b79a55' : INK, 'stroke-width': pr ? 2.4 : 1.8}));
        if (pr) items.push(g({transform: `translate(${r(x0 + q.w - 14)} ${r(y0 + q.h / 2)}) scale(0.42)`}, socketArt(ctx, undefined, 'right', 1)));
        items.push(txt(q.fit, {x: x0 + 16, y: y0 + 9, fill: INK}));
      }
      bottom.push(g({name: 'sharedG'}, items));
      y += L.stripH;
    }
    L._notesY = y;
    if (L.guideFit) {
      const w = L.guideFit.width + 40, hh = L.guideFit.height + 22;
      bottom.push(g({name: 'guideChip', opacity: 0}, h('path', {d: roundRectPath(L.xb, y, w, hh, 12), fill: '#fff', stroke: th.accent, 'stroke-width': 4}), txt(L.guideFit, {x: L.xb + 20, y: y + 11, fill: INK})));
    }
    if (L.noteFit) {
      const w = L.noteFit.width + 40, hh = L.noteFit.height + 22;
      const nx = L.beside && L.guideFit ? L.xb + L.guideFit.width + 80 : L.xb;
      const ny = L.beside || !L.guideFit ? y : y + L.gH + 12;
      bottom.push(g({name: 'noteChip', opacity: 0}, h('path', {d: roundRectPath(nx, ny, w, hh, 12), fill: th.card, stroke: INK, 'stroke-width': 2}), txt(L.noteFit, {x: nx + 20, y: ny + 11, fill: INK})));
    }
    return g({name: 'scene'}, benches, bottom);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const {B} = L;
    const capU = lerp(BEATS.action[0], W.note[1], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const rq = ease.inOutSine(seg(a, ...W.roll)), sq = ease.inOutSine(seg(a, ...W.seat));
    const approach = {x: B.dock.x + 40, y: B.cy};
    const tip = sq > 0 ? {x: lerp(approach.x, B.dock.x, sq), y: B.cy} : {x: lerp(B.restTip.x, approach.x, rq), y: B.cy};
    const seated = sq >= 1;
    const j1 = ease.inOutSine(seg(a, ...W.jaw1)), j2 = ease.inOutSine(seg(a, ...W.jaw2));
    const jawX = k => (j2 > 0 ? lerp(B.jawMid, k === 0 ? B.jawClosed : B.jawOpen, j2) : lerp(B.jawPark, B.jawMid, j1));
    const spanQ = seg(a, ...W.span);
    const guideQ = done ? seg(u, ...W.guide) : 0, noteQ = done ? seg(u, ...W.note) : 0;
    const looks = [];
    for (let k = 0; k < 2; k++) {
      const P = k === 0 ? 'a-' : 'b-';
      nodes[`${P}slipG`] = {transform: T(r(tip.x, 2), r(tip.y - B.TT.h * B.TT.prongAt, 2))};
      nodes[`${P}slip`] = {transform: T(0, r(B.TT.h * B.TT.prongAt, 2))};
      nodes[`${P}sock-ring`] = {opacity: seated ? 1 : 0};
      nodes[`${P}lit`] = {opacity: seated ? 1 : 0};
      const jx = jawX(k);
      nodes[`${P}jawG`] = {transform: T(r(jx, 2), r(B.beamY, 2))};
      const x0 = B.sock.x + 6 + 14;
      const x1 = lerp(x0, jx - B.jawW, spanQ);
      nodes[`${P}span`] = {d: `M${r(x0)} ${r(B.beamY + 26)}H${r(x1)}`, opacity: spanQ > 0 ? 1 : 0};
      nodes[`${P}badge`] = {opacity: r(seg(a, W.jaw2[1] - 0.02, W.jaw2[1] + 0.02), 3), transform: T(0, r(B.cy - B.beamY + 32, 2))};
      nodes[`${P}guide`] = {opacity: r(guideQ, 3)};
      looks.push({tip: r(tip.x), jaw: r(jx), seated, span: r(spanQ, 3)});
    }
    if (L.guideFit) nodes.guideChip = {opacity: r(guideQ, 3)};
    if (L.noteFit) nodes.noteChip = {opacity: r(noteQ, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const lookA = looks[0], lookB = looks[1];
    const closedA = j2 >= 1 && Math.abs(looks[0].jaw - r(B.jawClosed)) < 0.6;
    return {
      nodes,
      semantic: {
        beat, slipTip: {x: r(tip.x), y: r(tip.y)}, jawA: {x: looks[0].jaw, y: r(B.beamY)}, jawB: {x: looks[1].jaw, y: r(B.beamY)},
        seated, connected: seated, lookA: u < CHANGE_AT ? lookA : null, lookB: u < CHANGE_AT ? lookB : null,
        identical: JSON.stringify(lookA) === JSON.stringify(lookB) && ['a', 'b'].every(() => true),
        jawGapA: r(looks[0].jaw - B.jawW / 2 - B.slipFar), jawGapB: r(looks[1].jaw - B.jawW / 2 - B.slipFar),
        closedA, heldApartB: j2 >= 1, spanStyleA: 'solid', spanStyleB: 'dashed', guideShown: r(guideQ, 3), noteShown: r(noteQ, 3),
        side: L.side, textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'contract-terms-07-contrast',
    title: 'Indemnity clause, without doctrine — two identical benches: the claim plugs into the promise socket; a caliper closes on it in A and is held apart in B, as supplied',
    titleEs: 'Cláusula de indemnidad — Contraste de escenarios emparejados',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de indemnidad',
    treatment: 'contrast',
    family: 'paired-scenes',
    description: 'Two identical pegboard benches (side by side on wide frames, stacked on tall ones). On each hangs the clause card "CT-412 · Indemnity clause" with the supplied promise line and a brass socket; the claim slip rolls along its track and its prong seats in the socket, identically in both. A brass caliper then closes: in A ("Claim covered as per supplied data") the sliding jaw closes on the far edge of the claim (●); in B ("Scope disputed (as supplied)") it is held apart and the open span is drawn dashed (◆) — same jaw, colour and stroke. A guide outlines both sliding jaws ("Only the supplied scope status differs"); the supplied clause lines are drawn once in a shared strip; the neutral note says statuses are as supplied and no outcome is drawn. No indemnity doctrine.',
    tags: ['indemnity clause', 'claim', 'promise of cover', 'contrast', 'paired benches', 'caliper', 'scope', 'socket', 'prong', 'equal weight', 'as supplied', 'no outcome'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-indemnidad.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
