/**
 * LAW-0506 — Cláusula de indemnidad · mechanism
 *
 * Storyboard (a large physical exploded assembly of thick layers — capas — and one plug; a camera keeps the moving
 * mechanism filling the art box at every phase):
 *  0.00–0.03  the stack, assembled: the CONTRACT plate (head band "CT-412 · Supply contract (fictional)") behind the
 *             CLAUSE plate ("Indemnity clause", its supplied lines, the promise line marked, a printed rail to a brass
 *             socket on its edge), the clear PROMISE FILM registered on the promise line; the CLAIM slip lies apart.
 *  0.03–0.17  explode: the layers separate along the depth axis (landscape: diagonally, the claim backing away to the
 *             right; portrait / square-below: vertically, the film and the claim dropping below), dashed exploded-view
 *             guide lines join matching corners; name tabs come in on the parts' edges (0.12–0.18).
 *  0.18–0.58  a tracer follows the supplied traversal order along the supplied relations, tab to tab (plain lines;
 *             arrows only for supplied sequence / communication / causal kinds); the focus part swells while visited.
 *  0.56–0.60  tabs and relation lines fade.  0.60–0.72  the layers re-assemble; the film registers on its line.
 *  0.72–0.81  the claim slides in along the guide and its prong seats in the socket — connected to the promise.
 *  0.81–0.87  a scope collar slides over the joint: solid for "claim covered as per supplied data" (●), dashed for
 *             "scope disputed (as supplied)" (◆) — same colour and width.
 *  0.87–1.00  hold: the supplied status joins the relation legend and the key "As supplied · no conclusion drawn"
 *             (legend and key are shown throughout).
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
const DURATION = 7000;
const BEATS = {rest: [0, 0.18], action: [0.18, 0.6], complete: [0.6, 0.87], hold: [0.87, 1]};
const W = {explode: [0.03, 0.17], tabsIn: [0.12, 0.18], trace: [0.18, 0.56], tabsOut: [0.56, 0.6], plates: [0.6, 0.72], slip: [0.72, 0.81], collar: [0.81, 0.87], final: [0.87, 0.91]};
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
/* Component art (entry-owned). Every part is a thick physical layer: a    */
/* frontal face plus an extruded edge along the depth vector (te, te).     */
/* ---------------------------------------------------------------------- */

/** Extruded slab: shadow, side faces (offset body + corner edges) and the face. */
function slab(ctx, x, y, w, hh, te, face, side, rad = 12) {
  return [
    h('path', {d: roundRectPath(x + te + 10, y + te + 14, w, hh, rad), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x + te, y + te, w, hh, rad), fill: side, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(x + w - 4)} ${r(y + 3)}L${r(x + w - 4 + te)} ${r(y + 3 + te)}M${r(x + 3)} ${r(y + hh - 4)}L${r(x + 3 + te)} ${r(y + hh - 4 + te)}`, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(x, y, w, hh, rad), fill: face, stroke: INK, 'stroke-width': 2.6}),
  ];
}
const rivet = (x, y, R) => [h('circle', {cx: r(x), cy: r(y), r: r(R), fill: '#c9bfa8', stroke: INK, 'stroke-width': 1.6}), h('path', {d: `M${r(x - R * 0.55)} ${r(y)}h${r(R * 1.1)}`, stroke: INK, 'stroke-width': 1.4})];

function contractPlate(ctx, L, show) {
  const {Wc, Hc, band, head, te, F} = L;
  const parts = slab(ctx, 0, 0, Wc, Hc, te, '#fbf6ea', '#b9ae95');
  parts.push(h('path', {d: `M0 ${r(band)}V12Q0 0 12 0H${r(Wc - 12)}Q${r(Wc)} 0 ${r(Wc)} 12V${r(band)}Z`, fill: '#cfe1dd', stroke: INK, 'stroke-width': 2.6}));
  for (let y = band + F * 1.1, i = 0; y < Hc - F * 0.7; y += F, i++) parts.push(h('path', {d: `M${r(F * 0.5)} ${r(y)}h${r(F * 0.5)}`, stroke: '#d9cfb9', 'stroke-width': 5, 'stroke-linecap': 'round'}));
  parts.push(...rivet(Wc - F * 0.6, band * 0.5, F * 0.22));
  if (show) parts.push(txt(head, {x: F * 0.8, y: (band - head.height) / 2, fill: INK}));
  else parts.push(h('path', {d: `M${r(F * 0.8)} ${r(band / 2)}h${r(Math.min(Wc * 0.55, 14 * F))}`, stroke: '#9fbcb6', 'stroke-width': 11, 'stroke-linecap': 'round'}));
  return g({name: 'contract'}, parts);
}

function clausePlate(ctx, L, show) {
  const {Pw, Ph, te, F, title, titleY, rows, rowX, rowW, pi, padX} = L;
  const th = ctx.theme;
  const parts = slab(ctx, 0, 0, Pw, Ph, te, '#fffdf7', '#cfc4ab');
  const tabW = (show ? title.width : Math.min(Pw * 0.45, 10 * F)) + 46, tabH = title.height + 16;
  parts.push(h('path', {d: `M${r(padX - 14)} ${r(titleY - 8)}H${r(padX - 14 + tabW)}L${r(padX - 30 + tabW)} ${r(titleY - 8 + tabH / 2)}L${r(padX - 14 + tabW)} ${r(titleY - 8 + tabH)}H${r(padX - 14)}Z`, fill: '#f6e3b4', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  if (show) parts.push(txt(title, {x: padX, y: titleY, fill: INK}));
  else parts.push(h('path', {d: `M${r(padX)} ${r(titleY + tabH / 2 - 8)}h${r(tabW - 60)}`, stroke: '#c9ad6a', 'stroke-width': 10, 'stroke-linecap': 'round'}));
  parts.push(...rivet(Pw - F * 0.7, F * 0.7, F * 0.22), ...rivet(F * 0.6, Ph - F * 0.6, F * 0.22));
  // the printed rail from the promise line to the socket (under the film once it registers)
  parts.push(h('path', {d: L.railD, fill: 'none', stroke: '#b79a55', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': '2 9'}));
  rows.forEach((row, i) => {
    const pr = i === pi;
    parts.push(h('rect', {x: r(rowX), y: r(row.y), width: r(rowW), height: r(row.h), rx: 7, fill: pr ? '#fff4d6' : '#ffffff', stroke: pr ? '#b79a55' : '#d8ceb9', 'stroke-width': pr ? 2.4 : 1.6}));
    if (show) parts.push(txt(row.fit, {x: rowX + 16, y: row.y + (row.h - row.fit.height) / 2, fill: INK}));
    else parts.push(h('path', {d: `M${r(rowX + 16)} ${r(row.y + row.h / 2)}h${r(Math.min(rowW - 50, 12 * F))}`, stroke: '#cfc5b0', 'stroke-width': 9, 'stroke-linecap': 'round'}));
  });
  parts.push(g({transform: T(L.sockL.x, L.sockL.y)}, socketArt(ctx, 'sock', L.mode === 'side' ? 'right' : 'down', 1.05)));
  void th;
  return g({name: 'clause'}, parts);
}

/** The promise film: a clear, thin acetate layer that frames the promise line and prints a rail towards the socket. */
function promiseFilm(ctx, L) {
  const th = ctx.theme;
  const {fw, fh, frameW, filmRail} = L;
  return g({name: 'promise'},
    h('path', {d: roundRectPath(6, 6, fw, fh, 12), fill: '#3c7486', 'fill-opacity': 0.12, stroke: '#3c7486', 'stroke-width': 2, 'stroke-opacity': 0.5}),
    h('path', {d: roundRectPath(0, 0, fw, fh, 12), fill: '#d6ecf2', 'fill-opacity': 0.22, stroke: '#3c7486', 'stroke-width': 2.8, name: 'film-edge'}),
    h('path', {d: `M${r(fw * 0.58)} 5l${r(fw * 0.14)} 0M${r(fw * 0.66)} ${r(fh - 6)}l${r(fw * 0.1)} 0M${r(fw * 0.08)} ${r(fh - 6)}l${r(fw * 0.06)} 0`, stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.95}),
    h('rect', {name: 'film-frame', x: 6, y: 6, width: r(frameW), height: r(fh - 12), rx: 8, fill: 'none', stroke: th.accent2, 'stroke-width': 4.5}),
    h('path', {d: filmRail, fill: 'none', stroke: th.accent2, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
}

/** Name tab (labels-hidden: a blank tab). */
function nameTab(name, fit, TF, show, flip) {
  const w = (show && fit ? fit.width : TF * 4) + 30, hh = (fit ? fit.height : TF * 1.18) + 14;
  const d = flip ? `M0 0V${r(hh - 8)}Q0 ${r(hh)} 8 ${r(hh)}H${r(w - 8)}Q${r(w)} ${r(hh)} ${r(w)} ${r(hh - 8)}V0Z` : `M0 ${r(hh)}V8Q0 0 8 0H${r(w - 8)}Q${r(w)} 0 ${r(w)} 8V${r(hh)}Z`;
  return g({name},
    h('path', {d, fill: '#3d5a6c', stroke: INK, 'stroke-width': 2}),
    show && fit ? txt(fit, {x: w / 2, y: 7, anchor: 'middle', fill: '#ffffff'}) : h('path', {d: `M15 ${r(hh / 2)}h${r(w - 30)}`, stroke: '#8fa6b4', 'stroke-width': 8, 'stroke-linecap': 'round'}),
  );
}

function legendGlyph(ctx, kind, x, y, F) {
  const len = F * 0.8;
  const col = ctx.theme.fg;
  return g(null,
    h('path', {d: `M${r(x - len / 2)} ${r(y)}H${r(x + len / 2)}`, stroke: col, 'stroke-width': kind === 'causal' ? 5 : 3, 'stroke-linecap': 'round', 'stroke-dasharray': kind === 'communication' ? '6 5' : undefined}),
    kind === 'sequence' || kind === 'causal' || kind === 'communication' ? h('path', {d: `M${r(x + len / 2 + 2)} ${r(y)}l-9 -6v12z`, fill: col}) : h('circle', {cx: r(x - len / 2), cy: r(y), r: 4, fill: col}),
  );
}

/* ---------------------------------------------------------------------- */
/* Layout                                                                  */
/* ---------------------------------------------------------------------- */

const box = (x, y, w, hh) => ({x, y, w, h: hh});
const union = bs => { const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)); return box(x0, y0, Math.max(...bs.map(b => b.x + b.w)) - x0, Math.max(...bs.map(b => b.y + b.h)) - y0); };
const add = (a, b) => ({x: a.x + b.x, y: a.y + b.y});
const fitCam = (AB, b) => { const Z = Math.min(AB.w / b.w, AB.h / b.h); return {Z, tx: AB.x + (AB.w - Z * b.w) / 2 - Z * b.x, ty: AB.y + (AB.h - Z * b.h) / 2 - Z * b.y}; };

/** Notes (fixed size, outside the camera): the relation legend, the key and — at the hold — the supplied status. */
function notesLayout(ctx, panel, stress) {
  const p = ctx.params, D = ctx.design, upx = unitPx(ctx);
  const show = ctx.show('all'), showKey = ctx.show('key');
  const m = 16;
  const notes = [];
  const kinds = [...new Set(p.relationships.map(q => q.kind))];
  if (show) kinds.forEach(k => notes.push({name: `legend-${k}`, kind: 'legend', k, text: p.relationLabels[k] || k}));
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) notes.push({name: 'final', kind: 'final', text: p.stateLabels[p.finalState], worst: worstState(p)});
  const nF = (stress ? 20 : 27) / upx, minN = (stress ? 16.6 : 19.8) / upx;
  const gap = 14;
  const why = [];
  const chipOf = (q, x, yy, w, text) => chipG(ctx, text ?? q.text, {x, y: yy, anchor: 'middle', maxWidth: w, size: q.kind === 'key' ? nF * 0.92 : nF,
    minSize: minN, maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name,
    glyph: q.kind === 'final' ? (gx, gy, rr) => stateGlyph(ctx, p.finalState, gx, gy, rr) : q.kind === 'legend' ? (gx, gy) => legendGlyph(ctx, q.k, gx, gy, nF) : null,
    fill: q.kind === 'final' ? ctx.theme.accent2Soft : ctx.theme.card});
  const full = box(m, m, D.w - 2 * m, D.h - 2 * m);
  if (!notes.length) return {AB: full, placed: [], why, panel: 'none'};
  const placed = [];
  let AB;
  if (panel === 'right') {
    const Wp = clamp(D.w * (ctx.view.shape === 'square' ? 0.29 : 0.22), 300, 420);
    const cx = D.w - m - Wp / 2;
    const hs = notes.map(q => chipOf(q, 0, 0, Wp, q.worst).box.h);
    const total = hs.reduce((s, v) => s + v + gap, -gap);
    if (total > D.h - 2 * m) why.push('notes-do-not-fit');
    let y = m + Math.max(0, (D.h - 2 * m - total) / 2);
    notes.forEach((q, i) => { const c = chipOf(q, cx, y, Wp); if (c.bad) why.push('note-text'); placed.push({q, c}); y += hs[i] + gap; });
    AB = box(m, m, D.w - 2 * m - Wp - 30, D.h - 2 * m);
  } else {
    // one centred column, or two side by side when one would eat too much height
    const one = notes.map(q => chipOf(q, 0, 0, D.w - 2 * m, q.worst).box.h).reduce((s0, v) => s0 + v + gap, -gap);
    const two = notes.length > 1 && one > D.h * 0.16;
    const cols = two ? [notes.slice(0, Math.ceil(notes.length / 2)), notes.slice(Math.ceil(notes.length / 2))] : [notes];
    const Wp = two ? (D.w - 2 * m - 24) / 2 : D.w - 2 * m;
    const colH = list0 => list0.reduce((s0, q) => s0 + chipOf(q, 0, 0, Wp, q.worst).box.h + gap, -gap);
    const total = Math.max(...cols.map(colH));
    cols.forEach((list0, ci) => {
      const cx = two ? m + Wp / 2 + ci * (Wp + 24) : D.w / 2;
      let y = D.h - m - total;
      for (const q of list0) { const c = chipOf(q, cx, y, Wp); if (c.bad) why.push('note-text'); placed.push({q, c}); y += chipOf(q, 0, 0, Wp, q.worst).box.h + gap; }
    });
    AB = box(m, m, D.w - 2 * m, D.h - 2 * m - total - 26);
    if (AB.h < D.h * 0.5) why.push('notes-too-tall');
  }
  return {AB, placed, why, panel};
}

/**
 * The model (assembled coordinates: clause plate top-left at 0,0) for one plate width. mode 'side': the socket sits on
 * the clause plate's right edge and the claim plugs in from the right; 'below': the socket sits on its bottom edge and
 * the claim plugs in from below.
 */
function model(ctx, F, Pw, mode, AB, stress, show) {
  const p = ctx.params;
  const why = [];
  const pi = promiseIndex(p);
  const te = 0.6 * F, padX = 1.7 * F, prong = 2.1 * F, ox = 1.5 * F;
  const side = mode === 'side' ? 'left' : 'top';
  const gut = mode === 'side' ? 3.2 * F : 2.6 * F;
  const rowX = padX - 10, rowW = Pw - padX - gut + 10;
  const fx0 = rowX - 12, frameW = rowW + 12;
  const xg = rowX + rowW + 1.1 * F; // ('below') the rail's gutter
  const fw = mode === 'side' ? Pw - 8 - fx0 : xg + 0.8 * F - fx0;
  // the claim slip: as wide as the film beside the stack ('side'); about two thirds of the plate below it ('below')
  const slipW = mode === 'side' ? Math.max(fw, (stress ? 12.5 : 10.5) * F) : Math.max(Pw * 0.62, (stress ? 12.5 : 10.5) * F);
  const ml = stress ? 4 : 3;
  const title = fitG(p.clauseTitle, {maxWidth: Pw - padX - 2.6 * F, size: F, minSize: F * 0.92, maxLines: 3, weight: 700});
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: rowW - 30, size: F, minSize: F * 0.92, maxLines: ml, weight: 600}));
  const Wc = Pw + ox - 0.8 * F;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: Wc - 2.6 * F, size: F, minSize: F * 0.92, maxLines: ml, weight: 700});
  if (title.bad || head.bad || rowFits.some(f => f.bad)) why.push('plate-text');
  const band = head.height + 0.9 * F, oy = band + 0.45 * F;
  const titleY = 0.85 * F, rowsTop = titleY + title.height + 16 + 0.7 * F;
  const natRows = rowFits.map(f => f.height + 0.95 * F);
  const nR = natRows.length, gap0 = 0.5 * F;
  const bottomPad = mode === 'side' ? 1.0 * F : 2.7 * F;
  const PhNat = rowsTop + natRows.reduce((s, v) => s + v, 0) + gap0 * (nR - 1) + bottomPad;
  const SF = mode === 'side' ? F * 1.2 : F * 1.1; // the claim's label reads large on its card
  const TT0 = slipText(ctx, p, slipW, SF, F * 0.92, stress, 0);
  if (TT0.bad) why.push('slip-text');
  const asp = AB.w / AB.h;
  // the plate grows (taller rows, wider gaps) until the assembled, plugged mechanism has the art box's proportions
  let Ph;
  if (mode === 'side') Ph = Math.max(PhNat, Math.min(PhNat * 2, (ox + Pw + 4 + prong + slipW + 10) / asp - oy - te - 24));
  else Ph = Math.max(PhNat, Math.min(PhNat * 1.9, (ox + Pw + te + 10) / asp - oy - 4 - prong - Math.max(TT0.h, 5 * F) - 24));
  const spare = Ph - PhNat;
  const grow = Math.min(spare * 0.45 / nR, 1.4 * F);
  const gapR = gap0 + (spare - grow * nR) / (nR + 0.6);
  let yy = rowsTop + (spare - grow * nR) / (nR + 0.6) * 0.6;
  const rows = rowFits.map((fit, i) => { const row = {y: yy, h: natRows[i] + grow, fit}; yy += row.h + gapR; return row; });
  const prow = rows[pi], cy = prow.y + prow.h / 2;
  const Hc = Ph * 0.9 + oy;
  const fy0 = prow.y - 12, fh = prow.h + 24;
  let sockL, railD, filmRail;
  if (mode === 'side') {
    sockL = {x: Pw, y: cy};
    railD = `M${r(rowX + rowW)} ${r(cy)}H${r(Pw - 34)}`;
    filmRail = `M${r(6 + frameW)} ${r(fh / 2)}H${r(fw - 8)}`;
  } else {
    const sx = Pw - slipW / 2 - 0.4 * F;
    sockL = {x: sx, y: Ph};
    railD = `M${r(rowX + rowW)} ${r(cy)}H${r(xg)}V${r(Ph - 1.15 * F)}H${r(sx)}V${r(Ph - 34)}`;
    filmRail = `M${r(6 + frameW)} ${r(fh / 2)}H${r(xg - fx0)}V${r(fh - 4)}`;
  }
  const claimAsm = mode === 'side' ? {x: sockL.x + 4, y: sockL.y} : {x: sockL.x, y: sockL.y + 4};
  // tabs
  const TF = F;
  const label = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
  const tabFits = Object.fromEntries(IDS.map(id => [id, show && label(id) ? fitG(label(id), {maxWidth: Math.max(8 * F, Math.min(Pw * 0.7, 18 * F)), size: TF, minSize: TF * 0.92, maxLines: 1, weight: 700}) : null]));
  if (IDS.some(id => tabFits[id] && tabFits[id].bad)) why.push('tab-text');
  const tabW = id => (show && tabFits[id] ? tabFits[id].width : TF * 4) + 30;
  const tabH = (show && tabFits.contract ? tabFits.contract.height : TF * 1.18) + 14;
  const ey = tabH + 0.9 * F;
  // exploded offsets along the depth axis (contract back; the film and the claim forward)
  const off = {contract: {x: -(mode === 'side' ? 2.2 : 1.4) * F, y: -ey}, clause: {x: 0, y: 0}, promise: {x: 0, y: 0}, claim: {x: 0, y: 0}};
  let TT, rest, filmAbove = true;
  if (mode === 'side') {
    // exploded: a right-hand column beside the stack — the film (lifted off its line) and the claim slip, each with its tab
    const cx = 3 * F;
    const top = -oy - ey - tabH - 3, bot = Ph + te;
    const filmLeft = Pw + 4 + cx + prong;
    const gapC = 0.8 * F;
    // film on top: the claim body runs from under the film to the plate's bottom
    const bt1 = top + tabH + 3 + fh + gapC + tabH + 3;
    const h1 = bot - bt1;
    // film below: the claim body from the top down to above the film
    const bt2 = top + tabH + 3;
    const h2 = bot - fh - gapC - tabH - 3 - bt2;
    const okAt = (bt, hh) => hh >= TT0.h && cy > bt + hh * 0.18 && cy < bt + hh * 0.82;
    let bt, hh;
    if (okAt(bt1, h1)) { bt = bt1; hh = h1; } else if (okAt(bt2, h2)) { bt = bt2; hh = h2; filmAbove = false; } else { hh = Math.max(TT0.h, Ph * 0.6); bt = cy - hh / 2; filmAbove = cy > Ph / 2; }
    TT = slipText(ctx, p, slipW, SF, F * 0.92, stress, hh);
    TT.prongAt = clamp((cy - bt) / TT.h, 0.12, 0.88);
    const sbT = slipBox(TT, side, prong);
    const bodyTop = cy + sbT.y, bodyBot = bodyTop + TT.h;
    off.claim = {x: cx, y: 0};
    const fyE = filmAbove ? bodyTop - tabH - 3 - gapC - fh : bodyBot + gapC + tabH + 3;
    off.promise = {x: filmLeft - fx0, y: fyE - fy0};
    rest = {x: 1.2 * F, y: 0};
  } else {
    TT = slipText(ctx, p, slipW, SF, F * 0.92, stress, Math.max(TT0.h, 5.2 * F));
    rest = {x: 0, y: 1.5 * F};
  }
  const sb = slipBox(TT, side, prong);
  const claimLocal = side === 'left' ? box(0, sb.y, prong + sb.w + 10, sb.h + 12) : box(sb.x, 0, sb.w + 10, prong + sb.h + 12);
  const tabL = {
    contract: {x: Wc - tabW('contract') - 1.6 * F, y: -tabH - 3},
    clause: {x: Pw - tabW('clause') - F, y: -tabH - 3},
    promise: mode === 'side' ? {x: 0.6 * F, y: -tabH - 3} : {x: fw - tabW('promise') - 0.6 * F, y: fh + 3},
    claim: side === 'left' ? {x: prong + 10, y: sb.y - tabH - 3} : {x: sb.x - tabW('claim') - 12, y: prong + 12},
  };
  const org = {contract: {x: -ox, y: -oy}, clause: {x: 0, y: 0}, promise: {x: fx0, y: fy0}, claim: claimAsm};
  const local = {contract: box(0, 0, Wc + te + 10, Hc + te + 14), clause: box(0, 0, Pw + te + 10 + (mode === 'side' ? 6 : 0), Ph + te + 14 + (mode === 'side' ? 0 : 6)), promise: box(0, 0, fw + 6, fh + 6), claim: claimLocal};
  if (mode === 'below') {
    off.promise = {x: 0.9 * F, y: Ph + te + 0.9 * F - fy0};
    off.claim = {x: 0, y: fy0 + off.promise.y + fh + 6 + tabH + 3 + 0.8 * F - claimAsm.y};
  }
  const bboxAt = (o, tabK, claimO) => {
    const bs = IDS.map(id => { const at = add(org[id], id === 'claim' ? claimO : o[id]); const b = local[id]; return box(at.x + b.x, at.y + b.y, b.w, b.h); });
    if (tabK > 0) for (const id of IDS) {
      const at = add(org[id], id === 'claim' ? claimO : o[id]);
      const tl = tabL[id];
      const full = box(at.x + tl.x, at.y + tl.y, tabW(id), tabH);
      bs.push(box(full.x, full.y + (tl.y < 0 ? full.h * (1 - tabK) : 0), full.w, full.h * tabK));
    }
    const u0 = union(bs);
    const pad = 10 + 16 * tabK;
    return box(u0.x - pad, u0.y - pad, u0.w + 2 * pad, u0.h + 2 * pad);
  };
  if (mode === 'below') {
    // balance the exploded view to the art box's proportions
    const E0 = bboxAt(off, 1, off.claim);
    if (E0.w / E0.h < asp) { const extra = Math.min(asp * E0.h - E0.w, 6 * F); off.contract.x -= extra * 0.5; off.promise.x += extra * 0.5; }
  }
  const E = bboxAt(off, 1, off.claim);
  const zero = {contract: {x: 0, y: 0}, clause: {x: 0, y: 0}, promise: {x: 0, y: 0}};
  const Aplug = bboxAt(zero, 0, {x: 0, y: 0});
  const Arest = bboxAt(zero, 0, rest);
  const camE = fitCam(AB, E), camA = fitCam(AB, Aplug);
  const fillOf = (b, c) => Math.min(b.w * c.Z / AB.w, b.h * c.Z / AB.h);
  const minSize = Math.min(head.size, title.size, ...rowFits.map(f => f.size), TT.label.size, ...(TT.amount ? [TT.amount.size] : []), ...IDS.map(id => (tabFits[id] ? tabFits[id].size : F)));
  // in the exploded view the slip (and its tab) may not run into the film (and its tab)
  const at = id => add(org[id], off[id]);
  const fA = at('promise');
  const filmB = mode === 'side' ? box(fA.x, fA.y - tabH - 3, fw + 6, fh + tabH + 9) : box(fA.x, fA.y, fw + 6, fh + tabH + 10);
  const cl = at('claim');
  const claimB = side === 'left' ? box(cl.x + claimLocal.x, cl.y + claimLocal.y - tabH - 4, claimLocal.w, claimLocal.h + tabH + 4) : box(Math.min(cl.x + claimLocal.x, cl.x + tabL.claim.x), cl.y, claimLocal.w + tabW('claim') + 12, claimLocal.h);
  if (overlaps(filmB, claimB, 4)) why.push('slip-meets-film');
  return {
    ok: !why.length, why, F, TF, Pw, Ph, Wc, Hc, band, oy, ox, te, padX, prong, side, mode, slipW, TT, sb, head, title, titleY, rows, rowX, rowW, pi,
    sockL, railD, fx0, fy0, fw, fh, frameW, filmRail, claimAsm, tabFits, tabL, tabH, tabW: Object.fromEntries(IDS.map(id => [id, tabW(id)])), org, local, off, rest, filmAbove,
    bboxAt, E, Aplug, Arest, camE, camA, fillE: fillOf(E, camE), fillA: fillOf(Aplug, camA), fillR: fillOf(Arest, fitCam(AB, Arest)), minSize,
  };
}

function geom(ctx, fpx, mode, panel) {
  const upx = unitPx(ctx);
  const stress = isStress(ctx.params);
  const show = ctx.show('all');
  const floorPx = stress ? 16.2 : 19.8;
  const F = fpx / upx;
  const N = notesLayout(ctx, panel, stress);
  let best = null;
  // candidate plate widths: the one that sets the longest supplied line on one line, a little wider, and a fixed range
  const p = ctx.params;
  const nat = Math.max(...p.clauses.map(c => fitG(c, {maxWidth: 1e5, size: F, minSize: F, maxLines: 1, weight: 600}).width)) + 1.7 * F + (mode === 'side' ? 3.2 : 2.6) * F + 24;
  const ks = [...new Set([nat / F, nat * 1.12 / F, 14, 17, 20, 24, 28].map(k => clamp(k, 13, 30)))];
  for (const k of ks) {
    const M = model(ctx, F, k * F, mode, N.AB, stress, show);
    const px = M.minSize * M.camE.Z * upx;
    const fillMin = Math.min(M.fillE, M.fillA, M.fillR);
    // prefer readable plates: few wrapped lines, then fill, then type size
    const wraps = [M.head, M.title, ...M.rows.map(q => q.fit)].reduce((s0, q) => s0 + (q.lines ? q.lines.length - 1 : 0), 0);
    const score = (M.ok ? 0 : -1000) + (px >= floorPx ? 0 : -100) + Math.min(fillMin, 0.92) * 40 + Math.min(px, 28) - 1.2 * wraps;
    if (globalThis.DBG506 > 1) console.log('  k', r(k, 1), M.why.join(','), px.toFixed(1), fillMin.toFixed(2), wraps, JSON.stringify(M.E), JSON.stringify(M.Aplug));
    if (!best || score > best.score) best = {...M, score, px, fillMin};
  }
  const why = [...N.why, ...best.why];
  if (best.px < floorPx) why.push('text-floor');
  return {...best, ok: !why.length, why, AB: N.AB, placed: N.placed, panel, upx, stress};
}

const scene = {
  sizes: {landscape: [1800, 790], square: [1240, 960], portrait: [900, 1290]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const stress = isStress(p);
    const opts = shape === 'portrait' ? [['below', 'bottom']] : shape === 'square' ? [['side', 'bottom'], ['below', 'right'], ['side', 'right']] : [['side', 'right']];
    let L = null, firstOk = null;
    search: for (const fpx of stress ? [22, 20.5, 19, 18] : [26, 25, 24, 23, 22]) {
      for (const [mode, panel] of opts) {
        const c = geom(ctx, fpx, mode, panel);
        if (globalThis.DBG506) console.log(fpx, mode, panel, c.why.join(','), c.px.toFixed(1), c.fillMin.toFixed(2), r(c.Pw / c.F, 1), JSON.stringify(c.AB));
        if (!L || (c.ok && (!L.ok || c.score > L.score + 2))) L = c;
        if (c.ok && !firstOk) firstOk = c;
      }
      if (L.ok) break search;
    }
    // relations and the tracer route between the tabs of the exploded parts (anchored to their edges)
    const tabC = id => { const at = add(L.org[id], L.off[id]); return {x: at.x + L.tabL[id].x + L.tabW[id] / 2, y: at.y + L.tabL[id].y + L.tabH / 2}; };
    L.routeOf = (a0, b0) => {
      const A0 = tabC(a0), B0 = tabC(b0);
      const ddx = B0.x - A0.x, ddy = B0.y - A0.y, len0 = Math.hypot(ddx, ddy) || 1;
      const ux = ddx / len0, uy = ddy / len0;
      const sh = (id, s) => Math.min(Math.abs(ux) > 1e-6 ? (L.tabW[id] / 2 + 6) / Math.abs(ux) : 1e9, Math.abs(uy) > 1e-6 ? (L.tabH / 2 + 6) / Math.abs(uy) : 1e9, len0 * 0.35) * s;
      const f = {x: A0.x + ux * sh(a0, 1), y: A0.y + uy * sh(a0, 1)};
      const t = {x: B0.x - ux * sh(b0, 1), y: B0.y - uy * sh(b0, 1)};
      // bow away from the clause plate's centre (round the parts, not across their text)
      let nx = -uy, ny = ux;
      const mx = (f.x + t.x) / 2 - L.Pw / 2, my = (f.y + t.y) / 2 - L.Ph / 2;
      if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
      const bow = Math.min(50, len0 * 0.22);
      return {from: f, to: t, c1: {x: lerp(f.x, t.x, 0.3) + nx * bow, y: lerp(f.y, t.y, 0.3) + ny * bow}, c2: {x: lerp(f.x, t.x, 0.7) + nx * bow, y: lerp(f.y, t.y, 0.7) + ny * bow}};
    };
    const order = p.traversalOrder;
    L.legs = [];
    for (let i = 0; i < order.length - 1; i++) if (order[i] !== order[i + 1]) L.legs.push({a: order[i], b: order[i + 1], route: L.routeOf(order[i], order[i + 1])});
    L.rels = p.relationships.filter(q => q.from !== q.to).map((q, i) => ({...q, i, route: L.routeOf(q.from, q.to)}));
    void stress;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const show = ctx.show('all');
    const contract = contractPlate(ctx, L, show);
    const clause = clausePlate(ctx, L, show);
    const film = promiseFilm(ctx, L);
    const slip = claimSlip(ctx, {name: 'claim', T: L.TT, side: L.side, prong: L.prong, showText: show});
    const tabs = IDS.map(id => g({name: `tabg-${id}`, opacity: 0}, nameTab(`tab-${id}`, L.tabFits[id], L.TF, show, id === 'promise')));
    const rels = L.rels.map(q => connector(ctx, {name: `rel${q.i}`, from: q.route.from, to: q.route.to, c1: q.route.c1, c2: q.route.c2, kind: q.kind, color: th.fg}));
    const guide = name => h('path', {name, d: 'M0 0', fill: 'none', stroke: '#6b7f8c', 'stroke-width': 2.4, 'stroke-dasharray': '7 7', opacity: 0});
    const guides = ['g-c1', 'g-c2', 'g-f1', 'g-f2', 'g-k'].map(guide);
    const tr = tracer(ctx, 'tracer', th.accent);
    const dashed = p.finalState === 'disputed';
    const c = collarBox(L);
    const collar = g({name: 'collar', opacity: 0},
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 22), fill: 'none', stroke: '#ffffff', 'stroke-width': 17, opacity: 0.85}),
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 22), fill: 'none', stroke: SCOPE, 'stroke-width': 9, 'stroke-dasharray': dashed ? '18 11' : undefined}),
      h('circle', {cx: r(c.x), cy: r(c.y), r: 20, fill: '#fff', stroke: INK, 'stroke-width': 2}),
      stateGlyph(ctx, p.finalState, c.x, c.y, 11),
    );
    const notes = L.placed.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node));
    return g({name: 'scene'},
      g({name: 'cam'},
        guides,
        g({name: 'contractG'}, contract),
        g({name: 'clauseG'}, clause),
        g({name: 'promiseG'}, film),
        g({name: 'claimG'}, slip),
        g({name: 'collarG'}, collar),
        rels.map(q => q.node),
        tabs,
        tr,
      ),
      notes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(W.trace[0], W.collar[1] + 0.02, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const E = ease.inOutCubic;
    const ex = E(seg(a, ...W.explode));
    const pq = E(seg(a, ...W.plates));
    const sq = seg(a, ...W.slip);
    const spread = ex * (1 - pq);
    const off = id => ({x: L.off[id].x * spread, y: L.off[id].y * spread});
    const offs = {contract: off('contract'), clause: off('clause'), promise: off('promise')};
    let claimO;
    if (sq > 0) { const s1 = ease.inOutSine(sq); claimO = {x: L.off.claim.x * (1 - s1), y: L.off.claim.y * (1 - s1)}; }
    else claimO = {x: lerp(L.rest.x, L.off.claim.x, ex), y: lerp(L.rest.y, L.off.claim.y, ex)};
    // tabs: in after the explosion, out before the assembly
    const tabsO = seg(a, ...W.tabsIn) * (1 - seg(a, ...W.tabsOut));
    // the camera keeps the moving mechanism filling the art box (one continuous fit of the parts' current extent)
    const cam = fitCam(L.AB, L.bboxAt(offs, spread, claimO));
    nodes.cam = {transform: `translate(${r(cam.tx, 2)} ${r(cam.ty, 2)}) scale(${r(cam.Z, 4)})`};
    // tracer along the traversal legs (exploded positions)
    const tq = seg(a, ...W.trace);
    const n = L.legs.length;
    let trPos = null, at = null, bump = 0;
    const focus = p.focusElement;
    if (n && tq > 0 && tq < 1) {
      const k = Math.min(n - 1, Math.floor(tq * n));
      const local = ease.inOutSine(tq * n - k);
      const rt = L.legs[k].route;
      trPos = cubicAt(rt.from, rt.c1, rt.c2, rt.to, local);
      at = local < 0.15 ? L.legs[k].a : local > 0.85 ? L.legs[k].b : null;
      if (L.legs[k].a === focus) bump = Math.max(bump, clamp(1 - local / 0.3));
      if (L.legs[k].b === focus) bump = Math.max(bump, clamp((local - 0.7) / 0.3));
      bump *= Math.min(clamp(tq * 25), clamp((1 - tq) * 25));
    }
    nodes.tracer = {opacity: trPos ? 1 : 0, transform: trPos ? T(r(trPos.x, 2), r(trPos.y, 2)) : T(0, 0)};
    L.rels.forEach((q, i) => {
      const legI = L.legs.findIndex(l => (l.a === q.from && l.b === q.to) || (l.a === q.to && l.b === q.from));
      const pr = legI >= 0 ? clamp(tq * n - legI) : seg(tq, i / Math.max(1, L.rels.length), (i + 1) / Math.max(1, L.rels.length));
      Object.assign(nodes, connectorFrame(q, `rel${i}`, pr, tabsO));
    });
    // positions; the focus part swells smoothly while the tracer is on it
    const P = {};
    for (const id of IDS) P[id] = add(L.org[id], id === 'claim' ? claimO : offs[id]);
    for (const id of IDS) {
      const s = id === focus ? 1 + 0.05 * bump : 1;
      let tf = T(r(P[id].x, 2), r(P[id].y, 2));
      if (s !== 1) { const b = L.local[id]; const cx = b.x + b.w / 2, cy = b.y + b.h / 2; tf += ` translate(${r(cx, 2)} ${r(cy, 2)}) scale(${r(s, 4)}) translate(${r(-cx, 2)} ${r(-cy, 2)})`; }
      nodes[`${id}G`] = {transform: tf};
      nodes[`tabg-${id}`] = {opacity: r(tabsO, 3), transform: T(r(P[id].x + L.tabL[id].x, 2), r(P[id].y + L.tabL[id].y, 2))};
    }
    // while the film glides its register frame is faint; it prints on as it lands
    const vis = spread < 0.02 ? 1 : 0.35;
    nodes['film-frame'] = {opacity: r(vis, 3)};
    // exploded-view guide lines: corner to corner between consecutive layers, prong to socket
    const gO = r(clamp(spread * 1.4) * (1 - seg(a, ...W.tabsOut) * 0.6), 3);
    const C = P.contract, K = P.clause, Fm = P.promise;
    const prow = L.rows[L.pi];
    const line = (x0, y0, x1, y1) => `M${r(x0, 1)} ${r(y0, 1)}L${r(x1, 1)} ${r(y1, 1)}`;
    nodes['g-c1'] = {opacity: gO, d: line(C.x + L.ox, C.y + L.oy, K.x, K.y)};
    nodes['g-c2'] = {opacity: gO, d: line(C.x + L.Wc, C.y + L.oy, K.x + L.Pw - L.ox * 0.5, K.y)};
    nodes['g-f1'] = {opacity: gO, d: line(Fm.x, Fm.y, K.x + L.rowX - 12, K.y + prow.y - 12)};
    nodes['g-f2'] = {opacity: gO, d: line(Fm.x + L.fw, Fm.y, K.x + L.fx0 + L.fw, K.y + prow.y - 12)};
    const sock = add(K, L.sockL);
    const tip = P.claim;
    const kO = sq >= 1 ? 0 : r(clamp(ex * 1.4) * (1 - clamp(sq * 3)), 3);
    nodes['g-k'] = {opacity: kO, d: line(sock.x, sock.y, tip.x, tip.y)};
    const seated = sq >= 1;
    nodes['sock-ring'] = {opacity: seated ? 1 : 0};
    // collar slides in over the joint
    const cq = seg(a, ...W.collar);
    const cE = ease.outCubic(cq);
    const cf = L.mode === 'side' ? {x: 0, y: -3 * L.F} : {x: -3 * L.F, y: 0};
    nodes.collarG = {transform: T(r(K.x + cf.x * (1 - cE), 2), r(K.y + cf.y * (1 - cE), 2))};
    nodes.collar = {opacity: r(clamp(cq * 3), 3)};
    const legO = 1, fin = done ? seg(u, ...W.final) : 0;
    for (const pl of L.placed) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'final' ? fin : legO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const S = q => ({x: r(cam.tx + cam.Z * q.x), y: r(cam.ty + cam.Z * q.y)});
    return {
      nodes,
      semantic: {
        beat, tracer: trPos ? S(trPos) : null, tracerAt: at, trace: r(tq, 3), focusSwell: bump > 0.5 ? focus : null,
        exploded: r(ex, 3), spread: r(spread, 3), assembled: r(pq, 3), zoom: r(cam.Z, 3), slipTip: S(tip), seated, connected: seated,
        collar: r(cq, 3), collarOn: cq >= 1, collarStyle: p.finalState === 'disputed' ? 'dashed' : 'solid', finalState: p.finalState,
        filmRegistered: spread === 0, contract: S(P.contract), clause: S(P.clause), promise: S(P.promise),
        tabsShown: r(tabsO, 3), relations: L.rels.length, finalShown: r(fin, 3), keyShown: r(legO, 3), mode: L.mode, panel: L.panel,
        arrangement: 'depth', textPx: r(L.px, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        actionCapped: p.actionProgress < 1 && u > capU, DBG: {Pw: r(L.Pw), Ph: r(L.Ph), F: r(L.F), AB: L.AB, A: L.Aplug, E: L.E, fills: [L.fillE, L.fillA, L.fillR], TTh: L.TT.h},
      },
    };
  },
};

function collarBox(L) {
  const s = L.sockL, pr = L.prong;
  return L.mode === 'side' ? {x: s.x - 46, y: s.y - 44, w: pr + 34, h: 88} : {x: s.x - 44, y: s.y - 46, w: 88, h: pr + 34};
}

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
