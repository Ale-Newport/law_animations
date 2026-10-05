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
const W = {trace: [0.15, 0.42], tabsOut: [0.42, 0.46], plates: [0.44, 0.56], slip: [0.52, 0.63], zoom: [0.63, 0.7], collar: [0.68, 0.76], final: [0.75, 0.79], key: [0.77, 0.81], legend: [0.79, 0.83]};
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
    h('path', {d: roundRectPath(10, 12, o.w, o.h, 12), fill: th.shadow}),
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
    h('path', {d: roundRectPath(10, 12, o.w, o.h, 12), fill: th.shadow}),
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
    h('path', {d: roundRectPath(0, 0, o.w, o.h, 12), fill: '#d6ecf2', 'fill-opacity': 0.3, stroke: '#3c7486', 'stroke-width': 2.6}),
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

function geom(ctx, F, minF, arrangement, ff = 1) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 30;
  const pi = promiseIndex(p);
  const prong = 54;
  const style = shape === 'portrait' ? 'down' : 'right';
  const dx = arrangement === 'row' ? 64 : 34;
  const label = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
  const TF = Math.max(F * 0.86, minF);
  const tabFits = Object.fromEntries(IDS.map(id => [id, show && label(id) ? fitG(label(id), {maxWidth: 420, size: TF, minSize: minF, maxLines: 1, weight: 700}) : null]));
  const tabH = TF * 1.18 + 14;
  // widths
  let slipW, Wk;
  if (arrangement === 'row') {
    slipW = clamp(D.w * 0.205, 290, 380);
    // row: Wc + Wk + Wf + prong + slipW + 3 gaps ≤ D.w − 2m, Wc ≈ Wk − 20, Wf ≈ Wk − padX + 46
    Wk = (D.w - 2 * m - 36 - slipW - 3 * 48) / 3;
  } else if (arrangement === 'column') {
    slipW = clamp(D.w * 0.27, 230, 300);
    Wk = D.w - 2 * m - dx - slipW - 20;
  } else {
    slipW = clamp(D.w * 0.27, 290, 360);
    Wk = (D.w - 2 * m - 60) / 2 - 10;
  }
  const padX = 50;
  const Wc = Wk - 20;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: Wc - 44, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const band = head.height + F * 0.9;
  const title = fitG(p.clauseTitle, {maxWidth: Wk - padX - 60, size: F, minSize: minF, maxLines: 2, weight: 700});
  const rowW = Wk - padX - 14;
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: rowW - 26, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
  const titleY = F * 0.9;
  const rowsTop = titleY + title.height + F * 0.8;
  const natRows = rowFits.map(f => f.height + F * 0.95);
  const nR = natRows.length;
  const hkNat = rowsTop + natRows.reduce((a, b) => a + b, 0) + F * 0.55 * (nR - 1) + F * 0.9;
  const hcNat = band + Math.max(84, F * 3);
  const slipNat = slipText(ctx, p, slipW, F, minF, stress, F * 6.4).h;
  const hfNat = natRows[pi] + 24;
  // rough height of the hold notes when they sit below the assembly
  const noteTexts = [];
  if (show) noteTexts.push(worstState(p), ...[...new Set(p.relationships.map(q => q.kind))].map(k => p.relationLabels[k] || k));
  if (showKey) noteTexts.push(ctx.t.key);
  const nh = noteTexts.reduce((acc, t) => acc + fitG(t, {maxWidth: D.w - 2 * m - F * 2.4, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 700}).height + F * 0.76 + 14, 0);
  const tabH0 = Math.max(F * 0.86, minF) * 1.18 + 14;
  let hkT = hkNat, hcT = hcNat, slipMin = F * 6.4;
  if (arrangement === 'row') {
    const availRow = D.h - 2 * m - tabH0 - 8 - 74;
    hkT = Math.max(hkNat, Math.min(availRow * 0.96, D.h - 2 * m - band - 4));
    hcT = Math.max(hcNat, availRow * 0.55);
    slipMin = availRow * 0.6;
  } else if (arrangement === 'column') {
    const availCol = D.h - 2 * m - tabH0 - 8 - 3 * (tabH0 + 26) + 30;
    const extra = Math.max(0, availCol - (hcNat + hkNat + hfNat + prong + slipNat));
    hkT = Math.max(hkNat, Math.min(hkNat + extra * 0.3 * ff, D.h - 2 * m - band - nh - 40));
    hcT = hcNat + extra * 0.04 * ff;
    slipMin = slipNat + extra * 0.62 * ff;
  } else {
    const row1 = Math.max(hcNat, hfNat);
    const row2avail = D.h - m - (m + tabH0 + 8 + row1 + tabH0 + 34);
    hkT = Math.max(hkNat, Math.min(hkNat + (row2avail - hkNat) * ff, D.h - 2 * m - band - nh * 0.6 - 40));
    slipMin = Math.min(row2avail, hkT) * 0.75;
  }
  const spare = Math.max(0, hkT - hkNat);
  const grow = Math.min(spare * 0.5 / nR, F * 1.6);
  const gapR = F * 0.55 + (spare - grow * nR) / (nR + 1);
  let y = rowsTop + (spare - grow * nR) / (nR + 1) * 0.6;
  const rows = rowFits.map((fit, i) => { const row = {y, h: natRows[i] + grow, fit}; y += row.h + gapR; return row; });
  const hk = hkT;
  const hc = hcT;
  if (head.bad || title.bad || rowFits.some(f => f.bad)) why.push('plate-text');
  const prow = rows[pi];
  const TT = slipText(ctx, p, slipW, F, minF, stress, slipMin);
  if (TT.bad) why.push('slip-text');
  // the film: frames the promise row (padX − 16 … plate right) and runs on to its socket
  const ext = style === 'right' ? 34 : slipW + 22;
  const frameW = rowW + 12;
  const Wf = 14 + frameW + 6 + ext;
  const hf = prow.h + 24;
  const filmRail = style === 'right'
    ? `M${r(14 + frameW)} ${r(hf / 2)}H${r(Wf - 6)}`
    : `M${r(14 + frameW)} ${r(hf / 2)}H${r(Wf - slipW / 2 - 14)}V${r(hf - 4)}`;
  const sockLocal = style === 'right' ? {x: Wf, y: hf / 2} : {x: Wf - slipW / 2 - 14, y: hf};
  const side = style === 'right' ? 'left' : 'top';
  const sb = slipBox(TT, side, prong);
  // assembled geometry (relative to the contract plate's top-left)
  const rel = {contract: {x: 0, y: 0}, clause: {x: dx, y: band}};
  rel.promise = {x: dx + padX - 30, y: band + prow.y - 12};
  const sockRel = {x: rel.promise.x + sockLocal.x, y: rel.promise.y + sockLocal.y};
  const tipRel = style === 'right' ? {x: sockRel.x + 4, y: sockRel.y} : {x: sockRel.x, y: sockRel.y + 4};
  rel.claim = tipRel;
  const asmBox = (() => {
    const xs = [0, dx + Wk, rel.promise.x + Wf, tipRel.x + sb.x + sb.w], ys = [0, band + hk, tipRel.y + sb.y + sb.h, tipRel.y + sb.y];
    return {x: 0, y: Math.min(...ys), w: Math.max(...xs), h: Math.max(...ys) - Math.min(0, ...ys)};
  })();
  // hold notes
  const notes = [];
  if (show) notes.push({name: 'final', kind: 'final', text: p.stateLabels[p.finalState], worst: worstState(p)});
  const kinds = [...new Set(p.relationships.map(q => q.kind))];
  if (show) kinds.forEach(k => notes.push({name: `legend-${k}`, kind: 'legend', k, text: p.relationLabels[k] || k}));
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  const gap = 14;
  const NF = Math.min(F, TT.label.size, head.size, title.size, ...rowFits.map(f => f.size));
  const chipOf = (q, x, yy, w, text, anchor) => chipG(ctx, text ?? q.text, {x, y: yy, anchor, maxWidth: w, size: NF, minSize: minF, maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name,
    glyph: q.kind === 'final' ? (gx, gy, rr) => stateGlyph(ctx, p.finalState, gx, gy, rr) : q.kind === 'legend' ? (gx, gy) => legendGlyph(ctx, q.k, gx, gy, F) : null,
    fill: q.kind === 'final' ? ctx.theme.accent2Soft : ctx.theme.card});
  // place the assembly and the notes
  let A, notesBox;
  if (style === 'right' && arrangement === 'row') {
    // landscape: assembly on the left, notes in a column on the right
    A = {x: m + 10, y: (D.h - asmBox.h) / 2 - asmBox.y};
    const nx = A.x + asmBox.w + 50;
    notesBox = {x: nx, w: D.w - m - nx, top: m, bottom: D.h - m, anchor: 'end'};
  } else {
    // notes below the assembly (square: beside it if there is no room below)
    const nh = notes.reduce((acc, q) => acc + chipOf(q, 0, 0, D.w - 2 * m, q.worst).box.h + gap, 0);
    const w2 = (D.w - 2 * m - 24) / 2;
    const half = Math.ceil(notes.length / 2);
    const colH = list0 => list0.reduce((acc, q) => acc + chipOf(q, 0, 0, w2, q.worst).box.h + gap, 0);
    const nh2 = Math.max(colH(notes.slice(0, half)), colH(notes.slice(half)));
    const free = D.h - 2 * m - asmBox.h;
    if (free >= nh + 30 || free >= nh2 + 30) {
      const two = free < nh + 30;
      const used = two ? nh2 : nh;
      A = {x: (D.w - asmBox.w) / 2 - 10, y: m + Math.max(0, (free - used - 30) * 0.5) - asmBox.y};
      notesBox = {x: m, w: D.w - 2 * m, top: A.y + asmBox.y + asmBox.h + 30, bottom: D.h - m, anchor: 'middle', two, w2, half};
    } else {
      A = {x: m, y: (D.h - asmBox.h) / 2 - asmBox.y};
      const nx = A.x + asmBox.w + 40;
      notesBox = {x: nx, w: D.w - m - nx, top: m, bottom: D.h - m, anchor: 'end'};
    }
  }
  if (A.y + asmBox.y < m - 1 || A.y + asmBox.y + asmBox.h > D.h - m + 1) why.push('assembly-too-tall');
  const placed = [];
  const cols = notesBox.two
    ? [{items: notes.slice(0, notesBox.half), x: m + notesBox.w2 / 2, w: notesBox.w2}, {items: notes.slice(notesBox.half), x: m + notesBox.w2 * 1.5 + 24, w: notesBox.w2}]
    : [{items: notes, x: notesBox.anchor === 'end' ? notesBox.x + notesBox.w : notesBox.anchor === 'middle' ? notesBox.x + notesBox.w / 2 : notesBox.x, w: notesBox.w}];
  for (const col of cols) {
    const heights = col.items.map(q => chipOf(q, 0, 0, col.w, q.worst).box.h);
    const total = heights.reduce((a, b) => a + b + gap, 0) - gap;
    if (col.w < 200 || total > notesBox.bottom - notesBox.top + 0.5) why.push('notes-do-not-fit');
    let yy = notesBox.anchor === 'end' ? notesBox.top + Math.max(0, (notesBox.bottom - notesBox.top - total) / 2) : Math.max(notesBox.top, notesBox.bottom - total);
    col.items.forEach((q, i) => {
      const c = chipOf(q, col.x, yy, col.w, null, notesBox.anchor);
      if (c.bad) why.push('note-text');
      placed.push({q, c});
      yy += heights[i] + gap;
    });
  }
  const asm = {contract: {x: A.x, y: A.y}, clause: {x: A.x + rel.clause.x, y: A.y + rel.clause.y}, promise: {x: A.x + rel.promise.x, y: A.y + rel.promise.y}, claim: {x: A.x + tipRel.x, y: A.y + tipRel.y}};
  const sock = {x: A.x + sockRel.x, y: A.y + sockRel.y};
  // exploded positions (top-left for plates/film; prong tip for the slip)
  const sizes = {contract: {w: Wc, h: hc}, clause: {w: Wk, h: hk}, promise: {w: Wf, h: hf}, claim: {w: sb.w + prong, h: sb.h}};
  const exp = {};
  const top0 = m + tabH + 8;
  if (arrangement === 'row') {
    const arcH = 74;
    const totalW = Wc + Wk + Wf + prong + slipW;
    const gx = (D.w - 2 * m - totalW) / 3;
    if (gx < 40) why.push('row-too-wide');
    const tallest = Math.max(hc, hk, hf, sb.h);
    const yTop = Math.max(top0 + arcH, (D.h - tallest) / 2 + (tabH + arcH) / 2);
    let x = m;
    const cy = yTop + tallest / 2;
    exp.contract = {x, y: cy - hc / 2}; x += Wc + gx;
    exp.clause = {x, y: cy - hk / 2}; x += Wk + gx;
    exp.promise = {x, y: cy - hf / 2}; x += Wf + gx;
    exp.claim = side === 'left' ? {x, y: cy} : {x: x + slipW / 2, y: cy - sb.h / 2 - prong};
    if (yTop + tallest > D.h - m + 0.5) why.push('row-too-tall');
  } else if (arrangement === 'column') {
    const gy = tabH + 26;
    const totalH = hc + hk + hf + prong + sb.h + 3 * gy;
    const extra = Math.max(0, D.h - 2 * m - tabH - 8 - totalH);
    const g2 = gy + extra / 3;
    let yy = top0;
    exp.contract = {x: m, y: yy}; yy += hc + g2;
    exp.clause = {x: m + dx, y: yy}; yy += hk + g2;
    exp.promise = {x: asm.promise.x, y: yy}; yy += hf + g2 - 30;
    exp.claim = side === 'top' ? {x: asm.claim.x, y: yy} : {x: asm.claim.x, y: yy + sb.h / 2};
    if (yy + prong + sb.h > D.h - m + 0.5) why.push('column-too-tall');
  } else {
    const gx = 60;
    const r1 = Math.max(hc, hf);
    const gy = tabH + 34 + Math.max(0, (D.h - m - (top0 + r1 + tabH + 34 + Math.max(hk, sb.h))) * 0.7);
    const c2 = m + Math.max(Wc, Wk) + gx;
    const row1 = top0, row2 = row1 + r1 + gy;
    exp.contract = {x: m, y: row1};
    exp.promise = {x: c2, y: row1};
    exp.clause = {x: m, y: row2};
    exp.claim = side === 'left' ? {x: c2, y: row2 + sb.h / 2} : {x: c2 + slipW / 2, y: row2 - prong};
    if (c2 + Math.max(Wf, prong + slipW) > D.w - m + 0.5) why.push('grid-too-wide');
    if (row2 + Math.max(hk, sb.h) > D.h - m + 0.5) why.push('grid-too-tall');
  }
  // boxes in the exploded state
  const boxOf = (id, at) => (id === 'claim' ? {x: at.x + sb.x - (side === 'left' ? prong : 0), y: at.y + sb.y - (side === 'top' ? prong : 0), w: sb.w + (side === 'left' ? prong : 0), h: sb.h + (side === 'top' ? prong : 0)} : {x: at.x, y: at.y, ...sizes[id]});
  const expBox = Object.fromEntries(IDS.map(id => [id, boxOf(id, exp[id])]));
  // relation routes between exploded components (tops for a row, right sides for a column, nearest edges for a grid)
  const routeOf = (a, b) => {
    const A0 = expBox[a], B0 = expBox[b];
    if (arrangement === 'row') {
      const f = {x: A0.x + A0.w * 0.62, y: A0.y - tabH - 8}, t = {x: B0.x + B0.w * 0.38, y: B0.y - tabH - 8};
      const ty = Math.min(f.y, t.y) - 60;
      return {from: f, to: t, c1: {x: f.x, y: ty}, c2: {x: t.x, y: ty}};
    }
    if (arrangement === 'column') {
      const f = {x: A0.x + A0.w + 10, y: A0.y + A0.h * 0.5}, t = {x: B0.x + B0.w + 10, y: B0.y + B0.h * 0.5};
      const tx = Math.min(D.w - m - 6, Math.max(f.x, t.x) + 60);
      return {from: f, to: t, c1: {x: tx, y: f.y}, c2: {x: tx, y: t.y}};
    }
    const ca = {x: A0.x + A0.w / 2, y: A0.y + A0.h / 2}, cb = {x: B0.x + B0.w / 2, y: B0.y + B0.h / 2};
    const edge = (Bx, toward) => {
      const dxx = toward.x - (Bx.x + Bx.w / 2), dyy = toward.y - (Bx.y + Bx.h / 2);
      const s = Math.min(Math.abs((Bx.w / 2 + 12) / (dxx || 1e-6)), Math.abs((Bx.h / 2 + 12) / (dyy || 1e-6)));
      return {x: Bx.x + Bx.w / 2 + dxx * s, y: Bx.y + Bx.h / 2 + dyy * s};
    };
    const f = edge(A0, cb), t = edge(B0, ca);
    return {from: f, to: t, c1: {x: lerp(f.x, t.x, 0.33), y: lerp(f.y, t.y, 0.33)}, c2: {x: lerp(f.x, t.x, 0.67), y: lerp(f.y, t.y, 0.67)}};
  };
  // collar round the joint
  const collar = style === 'right'
    ? {x: sock.x - 40, y: sock.y - 44, w: prong + 64, h: 88}
    : {x: sock.x - 44, y: sock.y - 40, w: 88, h: prong + 64};
  const collarFrom = style === 'right' ? {x: 0, y: -collar.y - collar.h - 20} : {x: D.w - collar.x + 20, y: 0};
  // the hold zoom: the assembled group grows into the room the notes leave
  const aw = asmBox.w, ah = asmBox.h;
  const a0 = {x: A.x + asmBox.x, y: A.y + asmBox.y};
  const nb = placed.map(pl => pl.c.box);
  let Tz;
  if (!nb.length) Tz = {x: m, y: m, w: D.w - 2 * m, h: D.h - 2 * m};
  else if (notesBox.anchor === 'end') { const nx = Math.min(...nb.map(b => b.x)); Tz = {x: m, y: m, w: nx - 40 - m, h: D.h - 2 * m}; }
  else { const ny = Math.min(...nb.map(b => b.y)); Tz = {x: m, y: m, w: D.w - 2 * m, h: ny - 24 - m}; }
  const Z = clamp(Math.min(Tz.w / aw, Tz.h / ah), 1, 1.7);
  const zoom = {Z, c0: {x: a0.x + aw / 2, y: a0.y + ah / 2}, cT: {x: Tz.x + Tz.w / 2, y: Tz.y + Tz.h / 2}};
  if (Z === 1) zoom.cT = zoom.c0;
  return {
    zoom,
    ok: !why.length, why, F, minF, arrangement, style, side, prong, slipW, TT, sb, Wc, Wk, Wf, hc, hk, hf, band, head, title, titleY,
    rows, rowW, padX, pi, frameW, filmRail, sockLocal, sock, asm, exp, expBox, routeOf, tabFits, tabH, collar, collarFrom, placed, stress,
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
    const arrangements = shape === 'landscape' ? ['row'] : shape === 'portrait' ? ['column'] : ['grid'];
    let L = null;
    search: for (const fpx of stress ? [23, 21, 19.5, 18, 17] : [28, 26.5, 25, 23, 21.5, 20.5]) for (const ar of arrangements) for (const ff of [1, 0.9, 0.8, 0.7, 0.6, 0.45, 0.3, 0]) {
      L = geom(ctx, fpx / upx, minF, ar, ff);
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
      const b = L.expBox[id];
      return g({name: `tabg-${id}`, transform: T(b.x + 6, b.y - t.h - 4)}, t.node);
    });
    const rels = L.rels.map(q => connector(ctx, {name: `rel${q.i}`, from: q.route.from, to: q.route.to, c1: q.route.c1, c2: q.route.c2, kind: q.kind, color: th.fg}));
    L._rels = rels;
    const tr = tracer(ctx, 'tracer', th.accent);
    const dashed = p.finalState === 'disputed';
    const c = L.collar;
    const collar = g({name: 'collar'},
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 22), fill: 'none', stroke: '#ffffff', 'stroke-width': 17, opacity: 0.85}),
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 22), fill: 'none', stroke: SCOPE, 'stroke-width': 9, 'stroke-dasharray': dashed ? '18 11' : undefined}),
      h('circle', {cx: r(c.x + c.w), cy: r(c.y), r: 20, fill: '#fff', stroke: INK, 'stroke-width': 2}),
      stateGlyph(ctx, p.finalState, c.x + c.w, c.y, 11),
    );
    const notes = L.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node));
    return g({name: 'scene'},
      rels.map(q => q.node),
      tabs,
      g({name: 'zoomG'}, contract, clause, film, slip, collar),
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
    const pos = id => {
      if (id === 'clause' && L.arrangement === 'row') {
        // first down/up to its final height (still clear of the contract), then across — the contract's head band is never covered
        const q0 = seg(a, ...W.plates);
        const v = E(seg(q0, 0, 0.45)), hq = E(seg(q0, 0.45, 1));
        return {x: lerp(L.exp[id].x, L.asm[id].x, hq), y: lerp(L.exp[id].y, L.asm[id].y, v)};
      }
      return {x: lerp(L.exp[id].x, L.asm[id].x, pq), y: lerp(L.exp[id].y, L.asm[id].y, pq)};
    };
    const swell = (id, P0) => {
      const s = id === focus && sw ? 1.05 : 1;
      if (s === 1) return T(r(P0.x, 2), r(P0.y, 2));
      const b = L.expBox[id];
      const cx = b.x + b.w / 2 - L.exp[id].x, cy = b.y + b.h / 2 - L.exp[id].y;
      return `${T(r(P0.x, 2), r(P0.y, 2))} translate(${r(cx)} ${r(cy)}) scale(${s}) translate(${r(-cx)} ${r(-cy)})`;
    };
    for (const id of ['contract', 'clause', 'promise']) nodes[id] = {transform: swell(id, pos(id))};
    const zq = E(seg(a, ...W.zoom));
    const zc = L.zoom;
    const zs = 1 + (zc.Z - 1) * zq;
    nodes.zoomG = {transform: `translate(${r(zc.c0.x + (zc.cT.x - zc.c0.x) * zq, 2)} ${r(zc.c0.y + (zc.cT.y - zc.c0.y) * zq, 2)}) scale(${r(zs, 4)}) translate(${r(-zc.c0.x, 2)} ${r(-zc.c0.y, 2)})`};
    // the slip: stays put while the plates move (in a row it shifts with the assembly), then slides in along its axis
    const app = L.side === 'left' ? {x: L.asm.claim.x + 90, y: L.asm.claim.y} : {x: L.asm.claim.x, y: L.asm.claim.y + 90};
    let tip;
    if (sq > 0) {
      const s1 = seg(sq, 0, 0.75), s2 = seg(sq, 0.75, 1);
      tip = s2 > 0 ? {x: lerp(app.x, L.asm.claim.x, ease.inOutSine(s2)), y: lerp(app.y, L.asm.claim.y, ease.inOutSine(s2))} : {x: lerp(L.exp.claim.x, app.x, ease.inOutSine(s1)), y: lerp(L.exp.claim.y, app.y, ease.inOutSine(s1))};
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
