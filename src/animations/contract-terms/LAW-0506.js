/**
 * LAW-0506 — Cláusula de indemnidad · mechanism
 *
 * Storyboard (an exploded assembly of layers — capas — and one plug):
 *  0.00–0.15  exploded view: four components lie apart, each with a name tab — the CONTRACT plate (head band "CT-412 ·
 *             Supply contract (fictional)"), the CLAUSE plate (heading "Indemnity clause" and its supplied lines, the
 *             promise line marked), the PROMISE FILM (a clear acetate layer that frames one line and carries a printed
 *             rail to a brass socket) and the CLAIM slip (brass prong). Landscape: in a row; portrait: in a column;
 *             square: in a 2 × 2 grid.
 *  0.15–0.42  a tracer follows the supplied traversal order along the supplied relations (plain lines; arrows only
 *             for supplied sequence / causal kinds); the focus element swells slightly while the tracer is on it.
 *  0.42–0.56  assembly: the tabs and relation lines fade; the contract plate slides behind, the clause plate onto it
 *             (the contract's head band stays visible) and the film registers exactly over the supplied promise line;
 *  0.54–0.64  the claim slides in and its prong seats in the film's socket — the claim is connected to the promise.
 *  0.62–0.72  a scope collar slides over the joint: solid ring for "claim covered as per supplied data" (●), dashed
 *             ring for "scope disputed (as supplied)" (◆) — same colour and width.
 *  0.72–1.00  hold: the supplied status tag, the relation legend and the key "As supplied · no conclusion drawn".
 * No indemnity doctrine: no duty to indemnify or pay, no decision on cover beyond the supplied datum, no amount
 * unless supplied (labelled hypothetical), no jurisdiction.
 * @module animations/contract-terms/LAW-0506
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, num, oneOf} from '../../schemas/fields.js';
import {connector, tracer} from '../../primitives/annotate.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, SCOPE, contractField, clauseTitleField, clausesField, promiseField, claimField,
  stateLabelsField, finalStateField, promiseIndex, worstState, localizeScene, unitPx, fitG, chipG, txt, stateGlyph,
  socketArt, slipText, claimSlip, slipBox, overlaps, shade,
} from './kits/clausula-indemnidad.js';

const ID = 'LAW-0506';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {trace: [0.15, 0.42], tabsOut: [0.42, 0.46], plates: [0.44, 0.56], slip: [0.54, 0.66], collar: [0.66, 0.74], final: [0.75, 0.79], key: [0.77, 0.81], legend: [0.79, 0.83]};
const IDS = ['contract', 'clause', 'promise', 'claim'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  promise: promiseField,
  claim: claimField,
  stateLabels: stateLabelsField,
  elements: list('Name tabs of the four components; ids are fixed, labels are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Name on the tab', 40),
  }, ['id', 'label']), 4, 4),
  relationships: list('Supplied relations between components (plain line for "relation"; an arrow only for a supplied sequence or causal kind)', obj('Relation', {
    from: oneOf('From component', IDS),
    to: oneOf('To component', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when supplied)', KINDS),
  }, ['from', 'to', 'kind']), 1, 6),
  relationLabels: obj('Legend wording for each relation kind', {
    relation: str('Legend for plain relations', 50), communication: str('Legend for communications', 50),
    sequence: str('Legend for sequence links', 50), causal: str('Legend for supplied causal links', 50),
  }),
  traversalOrder: list('Order in which the tracer visits the components', oneOf('Component id', IDS), 2, 4),
  focusElement: oneOf('Component that swells while the tracer is on it', IDS),
  actionProgress: num('How far the assembly is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  finalState: finalStateField({covered: 'the scope collar is a solid ring round the joint', disputed: 'the scope collar is a dashed ring (same colour and width)'}),
};

const defaultParams = {
  ...CONTENT,
  elements: [{id: 'contract', label: 'Contract'}, {id: 'clause', label: 'Clause'}, {id: 'promise', label: 'Promise of cover'}, {id: 'claim', label: 'Claim'}],
  relationships: [{from: 'contract', to: 'clause', kind: 'relation'}, {from: 'clause', to: 'promise', kind: 'relation'}, {from: 'promise', to: 'claim', kind: 'relation'}],
  relationLabels: {relation: 'Plain line: linked as supplied', communication: 'Communication as supplied', sequence: 'Sequence as supplied', causal: 'Causal link as supplied'},
  traversalOrder: ['contract', 'clause', 'promise', 'claim'],
  focusElement: 'promise',
  actionProgress: 1,
  finalState: 'covered',
};
const defaultParamsEs = {
  ...CONTENT_ES,
  elements: [{id: 'contract', label: 'Contrato'}, {id: 'clause', label: 'Cláusula'}, {id: 'promise', label: 'Promesa de cobertura'}, {id: 'claim', label: 'Reclamación'}],
  relationLabels: {relation: 'Línea simple: enlazado según lo aportado', communication: 'Comunicación según lo aportado', sequence: 'Secuencia según lo aportado', causal: 'Vínculo causal según lo aportado'},
};

const isStress = p => [...p.clauses, p.claim.label, p.contract.title, p.stateLabels.covered, p.stateLabels.disputed, p.clauseTitle].some(t => t.length > 48);

/* ---------------------------------------------------------------------- */
/* Component art (entry-owned)                                            */
/* ---------------------------------------------------------------------- */

function contractPlate(ctx, o) {
  const th = ctx.theme;
  const parts = [
    h('path', {d: roundRectPath(16, 20, o.w, o.h, 12), fill: th.shadow}),
    // plate thickness (an extruded edge on the right and bottom)
    h('path', {d: roundRectPath(8, 8, o.w, o.h, 12), fill: '#b9ae95', stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(0, 0, o.w, o.h, 12), fill: '#fbf6ea', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(0, 0, o.w, o.band, 12), fill: '#cfe1dd'}),
    h('path', {d: `M0 ${r(o.band)}H${r(o.w)}`, stroke: INK, 'stroke-width': 2}),
  ];
  for (let y = o.band + 30, i = 0; y < o.h - 18; y += 26, i++) parts.push(h('path', {d: `M28 ${r(y)}h${r((o.w - 70) * (0.5 + 0.45 * ((i * 3) % 5) / 5))}`, stroke: '#e3dccb', 'stroke-width': 6, 'stroke-linecap': 'round'}));
  if (o.show) parts.push(txt(o.head, {x: 22, y: (o.band - o.head.height) / 2, fill: INK}));
  else parts.push(h('path', {d: `M22 ${r(o.band / 2)}h${r(Math.min(o.w * 0.55, 260))}`, stroke: '#9fbcb6', 'stroke-width': 11, 'stroke-linecap': 'round'}));
  return g({name: o.name}, parts);
}

function clausePlate(ctx, o) {
  const th = ctx.theme;
  const parts = [
    h('path', {d: roundRectPath(16, 20, o.w, o.h, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(8, 8, o.w, o.h, 12), fill: '#cfc4ab', stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(0, 0, o.w, o.h, 12), fill: '#fffdf7', stroke: INK, 'stroke-width': 2.6}),
  ];
  const tabW = (o.show ? o.title.width : Math.min(o.w * 0.45, 240)) + 46, tabH = o.title.height + 16;
  parts.push(h('path', {d: `M${r(o.padX - 14)} ${r(o.titleY - 8)}H${r(o.padX - 14 + tabW)}L${r(o.padX - 30 + tabW)} ${r(o.titleY - 8 + tabH / 2)}L${r(o.padX - 14 + tabW)} ${r(o.titleY - 8 + tabH)}H${r(o.padX - 14)}Z`, fill: '#f6e3b4', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  if (o.show) parts.push(txt(o.title, {x: o.padX, y: o.titleY, fill: INK}));
  else parts.push(h('path', {d: `M${r(o.padX)} ${r(o.titleY + tabH / 2 - 8)}h${r(tabW - 60)}`, stroke: '#c9ad6a', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  o.rows.forEach((row, i) => {
    const pr = i === o.promise;
    parts.push(h('rect', {x: r(o.padX - 10), y: r(row.y), width: r(o.rowW), height: r(row.h), rx: 7, fill: pr ? '#fff4d6' : '#ffffff', stroke: pr ? '#b79a55' : '#d8ceb9', 'stroke-width': pr ? 2.4 : 1.6}));
    if (o.show) parts.push(txt(row.fit, {x: o.padX + 6, y: row.y + (row.h - row.fit.height) / 2, fill: INK}));
    else parts.push(h('path', {d: `M${r(o.padX + 6)} ${r(row.y + row.h / 2)}h${r(Math.min(o.rowW - 50, 300))}`, stroke: '#cfc5b0', 'stroke-width': 9, 'stroke-linecap': 'round'}));
  });
  return g({name: o.name}, parts);
}

/** The promise film: a clear acetate that frames one line, with a printed rail to the socket. */
function promiseFilm(ctx, o) {
  const th = ctx.theme;
  return g({name: o.name},
    h('path', {d: roundRectPath(5, 5, o.w, o.h, 12), fill: 'none', stroke: '#3c7486', 'stroke-width': 2, opacity: 0.45}),
    h('path', {d: roundRectPath(0, 0, o.w, o.h, 12), fill: '#d6ecf2', 'fill-opacity': 0.16, stroke: '#3c7486', 'stroke-width': 2.6}),
    h('path', {d: `M${r(o.w * 0.62)} 4l${r(o.w * 0.12)} 0M${r(o.w * 0.7)} ${r(o.h - 6)}l${r(o.w * 0.1)} 0`, stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9}),
    h('rect', {x: 14, y: 12, width: r(o.frameW), height: r(o.h - 24), rx: 8, fill: 'none', stroke: th.accent2, 'stroke-width': 4}),
    h('path', {d: o.railD, fill: 'none', stroke: th.accent2, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
}

/** Name tab (labels-hidden: a blank tab). Returns {node, w, h}. */
function nameTab(ctx, name, fit, F, show) {
  const w = (show && fit ? fit.width : F * 4) + 30, hh = (fit ? fit.height : F) + 14;
  return {w, h: hh, node: g({name},
    h('path', {d: `M0 ${r(hh)}V8Q0 0 8 0H${r(w - 8)}Q${r(w)} 0 ${r(w)} 8V${r(hh)}Z`, fill: '#3d5a6c', stroke: INK, 'stroke-width': 2}),
    show && fit ? txt(fit, {x: w / 2, y: 7, anchor: 'middle', fill: '#ffffff'}) : h('path', {d: `M15 ${r(hh / 2)}h${r(w - 30)}`, stroke: '#8fa6b4', 'stroke-width': 8, 'stroke-linecap': 'round'}),
  )};
}

/* ---------------------------------------------------------------------- */
/* Layout                                                                  */
/* ---------------------------------------------------------------------- */

function geom(ctx, F, minF, hkFrac, styleIn) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 30;
  const pi = promiseIndex(p);
  const prong = 54;
  const style = styleIn;
  const side = style === 'right' ? 'left' : 'top';
  const dx = 34;
  // the depth axis of the exploded view: the clause plate sits one step in front of the contract plate
  const v = shape === 'landscape' ? {x: -64, y: -40} : shape === 'square' ? {x: -40, y: -36} : {x: -18, y: -40};
  const label = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
  const TF = Math.max(F * 0.86, minF);
  const tabFits = Object.fromEntries(IDS.map(id => [id, show && label(id) ? fitG(label(id), {maxWidth: 420, size: TF, minSize: minF, maxLines: 1, weight: 700}) : null]));
  const tabH = TF * 1.18 + 14;
  const tabW = id => (tabFits[id] ? tabFits[id].width : TF * 4) + 30;
  const padX = 50;
  // widths
  const slipW = style === 'right' ? clamp(D.w * (shape === 'square' ? (stress ? 0.26 : 0.2) : 0.17), 240, 340) : clamp(D.w * 0.3, 260, 360);
  let Wk;
  if (style === 'right') Wk = (D.w - 2 * m - (-v.x) - 168 - slipW - 30) / 2;
  else Wk = D.w - 2 * m - (-2 * v.x) - dx - slipW - 30;
  const Wc = Wk - 20;
  const narrow = Wk < 460 ? 1 : 0;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: Wc - 44, size: F, minSize: minF, maxLines: (stress ? 3 : 2) + narrow * 2, weight: 700});
  const band = head.height + F * 0.9;
  const title = fitG(p.clauseTitle, {maxWidth: Wk - padX - 60, size: F, minSize: minF, maxLines: 2 + narrow * 2, weight: 700});
  const rowW = Wk - padX - 14;
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: rowW - 26, size: F, minSize: minF, maxLines: (stress ? 3 : 2) + narrow * 2, weight: 600}));
  if (head.bad || title.bad || rowFits.some(f => f.bad)) why.push('plate-text');
  const titleY = F * 0.9;
  const rowsTop = titleY + title.height + F * 0.8;
  const natRows = rowFits.map(f => f.height + F * 0.95);
  const nR = natRows.length;
  const hkNat = rowsTop + natRows.reduce((a0, b0) => a0 + b0, 0) + F * 0.55 * (nR - 1) + F * 0.9;
  // notes (hold)
  const notes = [];
  if (show) notes.push({name: 'final', kind: 'final', text: p.stateLabels[p.finalState], worst: worstState(p)});
  const kinds = [...new Set(p.relationships.map(q => q.kind))];
  if (show) kinds.forEach(k => notes.push({name: `legend-${k}`, kind: 'legend', k, text: p.relationLabels[k] || k}));
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  const gap = 14;
  const TT0 = slipText(ctx, p, slipW, F, minF, stress, 0);
  const NF = Math.min(F, TT0.label.size, head.size, title.size, ...rowFits.map(f => f.size));
  const chipOf = (q, x, yy, w, text, anchor) => chipG(ctx, text ?? q.text, {x, y: yy, anchor, maxWidth: w, size: NF, minSize: minF, maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name,
    glyph: q.kind === 'final' ? (gx, gy, rr) => stateGlyph(ctx, p.finalState, gx, gy, rr) : q.kind === 'legend' ? (gx, gy) => legendGlyph(ctx, q.k, gx, gy, F) : null,
    fill: q.kind === 'final' ? ctx.theme.accent2Soft : ctx.theme.card});
  // vertical budget → the clause plate height
  const hfNat = natRows[pi] + 24;
  let hk, TT;
  const top0 = m + tabH + 6 - 2 * v.y; // assembled top (the contract plate lifts by 2|v.y| in the exploded view)
  if (style === 'right') {
    const avail = D.h - m - top0;
    hk = Math.max(hkNat, (avail - band) * hkFrac);
    TT = slipText(ctx, p, slipW, F, minF, stress, Math.min(hk * 0.75, avail - 20));
  } else {
    const slipH0 = Math.max(TT0.h, F * 4.6);
    const fixed = top0 + band + 20 + hfNat + 16 + prong + slipH0 + m;
    hk = Math.max(hkNat, (D.h - fixed) * hkFrac);
    TT = slipText(ctx, p, slipW, F, minF, stress, slipH0);
  }
  if (TT.bad) why.push('slip-text');
  const spare = Math.max(0, hk - hkNat);
  const grow = Math.min(spare * 0.5 / nR, F * 1.6);
  const gapR = F * 0.55 + (spare - grow * nR) / (nR + 1);
  let yy = rowsTop + (spare - grow * nR) / (nR + 1) * 0.6;
  const rows = rowFits.map((fit, i) => { const row = {y: yy, h: natRows[i] + grow, fit}; yy += row.h + gapR; return row; });
  const hc = band + hk * 0.7;
  const prow = rows[pi];
  const ext = style === 'right' ? 34 : slipW + 22;
  const frameW = rowW + 12;
  const Wf = 14 + frameW + 6 + ext;
  const hf = prow.h + 24;
  const filmRail = style === 'right' ? `M${r(14 + frameW)} ${r(hf / 2)}H${r(Wf - 6)}` : `M${r(14 + frameW)} ${r(hf / 2)}H${r(Wf - slipW / 2 - 14)}V${r(hf - 4)}`;
  const sockLocal = style === 'right' ? {x: Wf, y: hf / 2} : {x: Wf - slipW / 2 - 14, y: hf};
  const sb = slipBox(TT, side, prong);
  // assembled (A = contract top-left)
  const A = {x: m - 2 * v.x + 4, y: top0};
  const asm = {contract: {x: A.x, y: A.y}, clause: {x: A.x + dx, y: A.y + band}, promise: {x: A.x + dx + padX - 30, y: A.y + band + prow.y - 12}};
  const sock = {x: asm.promise.x + sockLocal.x, y: asm.promise.y + sockLocal.y};
  asm.claim = style === 'right' ? {x: sock.x + 4, y: sock.y} : {x: sock.x, y: sock.y + 4};
  const asmRight = Math.max(asm.clause.x + Wk, asm.promise.x + Wf, asm.claim.x + sb.x + sb.w);
  const asmBottom = Math.max(asm.clause.y + hk, asm.claim.y + sb.y + sb.h);
  // exploded: contract and clause back along the depth axis; the film beside (16:9) or below (other) the clause plate; the
  // claim further along its own axis
  const exp = {contract: {x: asm.contract.x + 2 * v.x, y: asm.contract.y + 2 * v.y}, clause: {x: asm.clause.x + v.x, y: asm.clause.y + v.y}};
  if (style === 'right') {
    exp.promise = {x: exp.clause.x + Wk + 30, y: asm.promise.y};
    const fr = exp.promise.x + Wf;
    exp.claim = {x: fr + 44, y: asm.claim.y};
    if (exp.claim.x + prong + sb.w > D.w - m + 0.5) why.push('too-wide');
  } else {
    exp.promise = {x: asm.promise.x, y: exp.clause.y + hk + 20};
    exp.claim = {x: asm.claim.x, y: exp.promise.y + hf + 16};
    if (exp.claim.y + prong + sb.h > D.h - m + 0.5) why.push('too-tall');
  }
  if (asm.clause.y + hk > D.h - m + 0.5 || asmBottom > D.h - m + 0.5) why.push('assembly-too-tall');
  if (asmRight > D.w - m + 0.5) why.push('assembly-too-wide');
  const sizes = {contract: {w: Wc, h: hc}, clause: {w: Wk, h: hk}, promise: {w: Wf, h: hf}};
  const boxOf = (id, at) => (id === 'claim' ? {x: at.x + sb.x - (side === 'left' ? prong : 0), y: at.y + sb.y - (side === 'top' ? prong : 0), w: sb.w + (side === 'left' ? prong : 0), h: sb.h + (side === 'top' ? prong : 0)} : {x: at.x, y: at.y, ...sizes[id]});
  const expBox = Object.fromEntries(IDS.map(id => [id, boxOf(id, exp[id])]));
  // name tabs: on free edges of each part in the exploded view
  const tabPos = {
    contract: {x: expBox.contract.x + Wc - tabW('contract') - 8, y: expBox.contract.y - tabH - 4},
    clause: {x: expBox.clause.x + Wk - tabW('clause') - 8, y: expBox.clause.y - tabH - 4},
    promise: style === 'right' ? {x: expBox.promise.x + 6, y: expBox.promise.y - tabH - 4} : {x: expBox.promise.x + Wf - tabW('promise') - 6, y: expBox.promise.y - tabH - 4},
    claim: style === 'right' ? {x: expBox.claim.x + 6, y: expBox.claim.y - tabH - 4} : {x: expBox.claim.x - tabW('claim') - 14, y: expBox.claim.y + prong + 10},
  };
  if (style === 'down' && tabPos.promise.x < expBox.clause.x + Wk + v.x * 0 - 4 && tabPos.promise.y < expBox.clause.y + hk) why.push('film-tab');
  // relation routes: tab to tab, gently bowed
  const tabC = id => ({x: tabPos[id].x + tabW(id) / 2, y: tabPos[id].y + tabH / 2});
  const routeOf = (a0, b0) => {
    const A0 = tabC(a0), B0 = tabC(b0);
    const ddx = B0.x - A0.x, ddy = B0.y - A0.y, len0 = Math.hypot(ddx, ddy) || 1;
    const nx = -ddy / len0, ny = ddx / len0;
    const out = {x: A0.x + ddx * 0.08 + (ddx / len0) * (tabW(a0) / 2 + 8) * 0, y: A0.y};
    const f = {x: A0.x + (ddx / len0) * Math.min(tabW(a0) / 2 + 10, len0 * 0.3), y: A0.y + (ddy / len0) * Math.min(tabH / 2 + 8, len0 * 0.3)};
    const t = {x: B0.x - (ddx / len0) * Math.min(tabW(b0) / 2 + 10, len0 * 0.3), y: B0.y - (ddy / len0) * Math.min(tabH / 2 + 8, len0 * 0.3)};
    void out;
    let bnx = nx, bny = ny;
    if (style === 'right' ? bny > 0 : bnx < 0) { bnx = -bnx; bny = -bny; }
    const bow = Math.min(70, len0 * 0.25);
    return {from: f, to: t, c1: {x: lerp(f.x, t.x, 0.3) + bnx * bow, y: lerp(f.y, t.y, 0.3) + bny * bow}, c2: {x: lerp(f.x, t.x, 0.7) + bnx * bow, y: lerp(f.y, t.y, 0.7) + bny * bow}};
  };
  // hold notes: beside the assembly (16:9) or below it (other), in the room the exploded parts leave
  const placed = [];
  let notesBox;
  if (style === 'right') notesBox = {x: asmRight + 40, w: D.w - m - asmRight - 40, top: m, bottom: D.h - m};
  else notesBox = {x: m, w: D.w - 2 * m, top: asmBottom + 26, bottom: D.h - m};
  const w2 = (notesBox.w - 20) / 2;
  const colH = (list0, w) => list0.reduce((acc, q) => acc + chipOf(q, 0, 0, w, q.worst).box.h + gap, -gap);
  const availN = notesBox.bottom - notesBox.top;
  let cols;
  if (style === 'right' || colH(notes, notesBox.w) <= availN) cols = [{items: notes, x: notesBox.x + notesBox.w / 2, w: notesBox.w}];
  else { const half = Math.ceil(notes.length / 2); cols = [{items: notes.slice(0, half), x: notesBox.x + w2 / 2, w: w2}, {items: notes.slice(half), x: notesBox.x + w2 * 1.5 + 20, w: w2}]; }
  for (const col of cols) {
    const total = colH(col.items, col.w);
    if (col.w < 200 || total > availN + 0.5) why.push('notes-do-not-fit');
    let ny = style === 'right' ? notesBox.top + Math.max(0, (availN - total) / 2) : notesBox.top;
    for (const q of col.items) {
      const c = chipOf(q, col.x, ny, col.w, null, 'middle');
      if (c.bad) why.push('note-text');
      placed.push({q, c});
      ny += chipOf(q, 0, 0, col.w, q.worst).box.h + gap;
    }
  }
  const collar = style === 'right' ? {x: sock.x - 46, y: sock.y - 44, w: prong + 34, h: 88} : {x: sock.x - 44, y: sock.y - 46, w: 88, h: prong + 34};
  const collarFrom = style === 'right' ? {x: 0, y: -collar.y - collar.h - 20} : {x: D.w - collar.x + 20, y: 0};
  return {
    ok: !why.length, why, F, minF, arrangement: 'depth', style, side, prong, slipW, TT, sb, Wc, Wk, Wf, hc, hk, hf, band, head, title, titleY,
    rows, rowW, padX, pi, frameW, filmRail, sockLocal, sock, asm, exp, expBox, routeOf, tabFits, tabH, tabPos, collar, collarFrom, placed, stress, v,
    zoom: {Z: 1, c0: {x: 0, y: 0}, cT: {x: 0, y: 0}},
  };
}

function legendGlyph(ctx, kind, x, y, F) {
  const len = F * 0.8;
  const col = ctx.theme.fg;
  return g(null,
    h('path', {d: `M${r(x - len / 2)} ${r(y)}H${r(x + len / 2)}`, stroke: col, 'stroke-width': kind === 'causal' ? 5 : 3, 'stroke-linecap': 'round', 'stroke-dasharray': kind === 'communication' ? '6 5' : undefined}),
    kind === 'sequence' || kind === 'causal' || kind === 'communication' ? h('path', {d: `M${r(x + len / 2 + 2)} ${r(y)}l-9 -6v12z`, fill: col}) : h('circle', {cx: r(x - len / 2), cy: r(y), r: 4, fill: col}),
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
    void shape;
    let L = null;
    const styles = shape === 'portrait' ? ['down'] : shape === 'square' ? ['right', 'down'] : ['right'];
    search: for (const st of styles) for (const fpx of stress ? [23, 21, 19.5, 18, 17] : [28, 26.5, 25, 23, 21.5, 20.5]) for (const hf of [1, 0.9, 0.8, 0.7, 0.55, 0.4, 0.2, 0]) {
      L = geom(ctx, fpx / upx, minF, hf, st);
      if (L.ok) break search;
    }
    L.upx = upx;
    const order = p.traversalOrder;
    L.legs = [];
    for (let i = 0; i < order.length - 1; i++) if (order[i] !== order[i + 1]) L.legs.push({a: order[i], b: order[i + 1], route: L.routeOf(order[i], order[i + 1])});
    L.rels = p.relationships.filter(q => q.from !== q.to).map((q, i) => ({...q, i, route: L.routeOf(q.from, q.to)}));
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const contract = contractPlate(ctx, {name: 'contract', w: L.Wc, h: L.hc, band: L.band, head: L.head, show});
    const clause = clausePlate(ctx, {name: 'clause', w: L.Wk, h: L.hk, title: L.title, titleY: L.titleY, rows: L.rows, rowW: L.rowW, padX: L.padX, promise: L.pi, show});
    const film = g({name: 'promise'},
      promiseFilm(ctx, {name: 'film', w: L.Wf, h: L.hf, frameW: L.frameW, railD: L.filmRail}),
      g({transform: T(L.sockLocal.x, L.sockLocal.y)}, socketArt(ctx, 'sock', L.style === 'right' ? 'right' : 'down', 1.05)),
    );
    const slip = claimSlip(ctx, {name: 'claim', T: L.TT, side: L.side, prong: L.prong, showText: show});
    const tabs = ['contract', 'clause', 'promise', 'claim'].map(id => {
      const t = nameTab(ctx, `tab-${id}`, L.tabFits[id], Math.max(L.F * 0.86, L.minF), show);
      return g({name: `tabg-${id}`, transform: T(L.tabPos[id].x, L.tabPos[id].y)}, t.node);
    });
    const rels = L.rels.map(q => connector(ctx, {name: `rel${q.i}`, from: q.route.from, to: q.route.to, c1: q.route.c1, c2: q.route.c2, kind: q.kind, color: th.fg}));
    L._rels = rels;
    const tr = tracer(ctx, 'tracer', th.accent);
    const dashed = p.finalState === 'disputed';
    const c = L.collar;
    const collar = g({name: 'collar'},
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 22), fill: 'none', stroke: '#ffffff', 'stroke-width': 17, opacity: 0.85}),
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 22), fill: 'none', stroke: SCOPE, 'stroke-width': 9, 'stroke-dasharray': dashed ? '18 11' : undefined}),
      h('circle', {cx: r(c.x), cy: r(c.y), r: 20, fill: '#fff', stroke: INK, 'stroke-width': 2}),
      stateGlyph(ctx, p.finalState, c.x, c.y, 11),
    );
    const notes = L.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node));
    return g({name: 'scene'},
      g({name: 'zoomG'}, contract, clause, film, slip, collar),
      rels.map(q => q.node),
      tabs,
      tr,
      notes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], W.collar[1] + 0.02, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const E = ease.inOutCubic;
    // tracer along the traversal legs
    const tq = seg(a, ...W.trace);
    const n = L.legs.length;
    let trPos = null, at = null;
    if (n && tq > 0 && tq < 1) {
      const k = Math.min(n - 1, Math.floor(tq * n));
      const local = ease.inOutSine(tq * n - k);
      const rt = L.legs[k].route;
      const t = local;
      trPos = cubicAt(rt.from, rt.c1, rt.c2, rt.to, t);
      at = local < 0.15 ? L.legs[k].a : local > 0.85 ? L.legs[k].b : null;
    }
    nodes.tracer = {opacity: trPos ? 1 : 0, transform: trPos ? T(r(trPos.x, 2), r(trPos.y, 2)) : T(0, 0)};
    // relations draw on as the tracer reaches their far end (or evenly if not on the route)
    const tabsO = 1 - seg(a, ...W.tabsOut);
    L.rels.forEach((q, i) => {
      const legI = L.legs.findIndex(l => (l.a === q.from && l.b === q.to) || (l.a === q.to && l.b === q.from));
      const pr = legI >= 0 ? clamp(tq * n - legI) : seg(tq, i / Math.max(1, L.rels.length), (i + 1) / Math.max(1, L.rels.length));
      Object.assign(nodes, connectorFrame(q, `rel${i}`, pr, tabsO));
    });
    // focus swell
    const focus = p.focusElement;
    const sw = at === focus ? 1 : 0;
    // assembly
    const pq = E(seg(a, ...W.plates));
    const sq = seg(a, ...W.slip);
    // one continuous straight move per part (contract and clause along the depth axis, the film along its row)
    const pos = id => ({x: lerp(L.exp[id].x, L.asm[id].x, pq), y: lerp(L.exp[id].y, L.asm[id].y, pq)});
    const swell = (id, P0) => {
      const s = id === focus && sw ? 1.05 : 1;
      if (s === 1) return T(r(P0.x, 2), r(P0.y, 2));
      const b = L.expBox[id];
      const cx = b.x + b.w / 2 - L.exp[id].x, cy = b.y + b.h / 2 - L.exp[id].y;
      return `${T(r(P0.x, 2), r(P0.y, 2))} translate(${r(cx)} ${r(cy)}) scale(${s}) translate(${r(-cx)} ${r(-cy)})`;
    };
    for (const id of ['contract', 'clause', 'promise']) nodes[id] = {transform: swell(id, pos(id))};
    const zs = 1;
    nodes.zoomG = {transform: ''};
    // the slip: stays put while the plates move (in a row it shifts with the assembly), then slides in along its axis
    const app = L.side === 'left' ? {x: L.asm.claim.x + 90, y: L.asm.claim.y} : {x: L.asm.claim.x, y: L.asm.claim.y + 90};
    let tip;
    if (sq > 0) {
      const s1 = ease.inOutSine(sq);
      tip = {x: lerp(L.exp.claim.x, L.asm.claim.x, s1), y: lerp(L.exp.claim.y, L.asm.claim.y, s1)};
      void app;
    } else tip = L.exp.claim;
    nodes.claim = {transform: swell('claim', tip)};
    const seated = sq >= 1;
    nodes['sock-ring'] = {opacity: seated ? 1 : 0};
    // tabs fade
    for (const id of IDS) nodes[`tabg-${id}`] = {opacity: r(tabsO, 3)};
    // collar slides in
    const cq = seg(a, ...W.collar);
    const cE = ease.outCubic(cq);
    nodes.collar = {opacity: cq > 0 ? 1 : 0, transform: T(r(L.collarFrom.x * (1 - cE), 2), r(L.collarFrom.y * (1 - cE), 2))};
    const fin = done ? seg(u, ...W.final) : 0, keyO = done ? seg(u, ...W.key) : 0, legO = done ? seg(u, ...W.legend) : 0;
    for (const pl of L.placed) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'final' ? fin : pl.q.kind === 'key' ? keyO : legO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const plates = Object.fromEntries(['contract', 'clause', 'promise'].map(id => [id, P2(pos(id))]));
    return {
      nodes,
      semantic: {
        beat, tracer: trPos ? P2(trPos) : null, tracerAt: at, trace: r(tq, 3), focusSwell: sw === 1 ? focus : null,
        assembled: r(pq, 3), zoom: r(zs, 3), slipTip: P2(tip), seated, connected: seated, collar: r(cq, 3), collarOn: cq >= 1,
        collarStyle: p.finalState === 'disputed' ? 'dashed' : 'solid', finalState: p.finalState,
        filmRegistered: pq >= 1, contract: plates.contract, clause: plates.clause, promise: plates.promise,
        tabsShown: r(tabsO, 3), relations: L.rels.length, finalShown: r(fin, 3), keyShown: r(keyO, 3),
        arrangement: L.arrangement, textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        actionCapped: p.actionProgress < 1 && u > capU,
      },
    };
  },
};

function cubicAt(p0, p1, p2, p3, t) {
  const m1 = 1 - t;
  return {x: m1 ** 3 * p0.x + 3 * m1 * m1 * t * p1.x + 3 * m1 * t * t * p2.x + t ** 3 * p3.x, y: m1 ** 3 * p0.y + 3 * m1 * m1 * t * p1.y + 3 * m1 * t * t * p2.y + t ** 3 * p3.y};
}

/** Frame record for a connector built in build() (rebuilt here from the same route: pure). */
function connectorFrame(q, name, pr, opacity) {
  const c = connectorCache(q, name);
  return c(pr, r(opacity, 3));
}
const CF = new Map();
function connectorCache(q, name) {
  const key = `${name}|${q.kind}|${JSON.stringify(q.route)}`;
  let f = CF.get(key);
  if (!f) {
    const fake = {theme: {fg: '#000'}, id: x => x, ref: x => x};
    f = connector(fake, {name, from: q.route.from, to: q.route.to, c1: q.route.c1, c2: q.route.c2, kind: q.kind}).frame;
    if (CF.size > 500) CF.clear();
    CF.set(key, f);
  }
  return f;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-07-mechanism',
    title: 'Indemnity clause, without doctrine — an exploded assembly: contract and clause plates stack, a promise film registers on its line and the claim plugs into its socket',
    titleEs: 'Cláusula de indemnidad — Mecanismo descompuesto en el espacio',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de indemnidad',
    treatment: 'mechanism',
    family: 'decomposed-mechanism',
    description: 'Exploded view of four components with name tabs: the contract plate ("CT-412 · Supply contract (fictional)"), the clause plate ("Indemnity clause" and its supplied lines), a clear promise film that frames the supplied promise line and carries a rail to a brass socket, and the claim slip with its prong. A tracer follows the supplied traversal order along the supplied relations (plain lines unless a sequence or causal kind is supplied). The layers then assemble: the contract plate slides behind, the clause plate onto it and the film registers exactly over the promise line; the claim slides in and its prong seats in the socket. A scope collar slides over the joint — solid for "Claim covered as per supplied data" (●), dashed for "Scope disputed (as supplied)" (◆). The hold shows the status, the relation legend and "As supplied · no conclusion drawn". No indemnity doctrine.',
    tags: ['indemnity clause', 'claim', 'promise of cover', 'layers', 'exploded view', 'assembly', 'socket', 'prong', 'scope collar', 'tracer', 'relations', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-indemnidad.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
