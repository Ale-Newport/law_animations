/**
 * LAW-0516 — Orden de documentos · inspect
 *
 * Storyboard (a priority table on a clipboard, and a shelf where the annex binders lie stacked spine-out):
 *  0.00–0.12  context: the clipboard holds the contract "CT-208 · Services contract (fictional)" with the heading
 *             "Order of documents clause", its supplied text and a priority table — one row per annex in its supplied
 *             numbering: the annex label, its tab letter and the supplied priority number in a cell. On the shelf the
 *             annex binders lie stacked by those numbers (lowest number on top), each spine showing tab letter and label.
 *  0.12–0.24  a detail lens opens over the shelf: a real enlargement (≥ 1.5×) of the tab letter and priority cell of
 *             the focus annex; the cell's number in the context is blanked in step (one legible place at a time).
 *  0.30–0.44  in the lens the before-number lifts away and stays traceable as "was: …"; the supplied after-number drops
 *             in and holds still.
 *  0.48–0.58  the lens closes; the context cell now shows the after-number and "was: …".
 *  0.58–0.74  only the dependent geometry follows: that annex's binder slides out of the stack, the others close up or
 *             open a gap, and it slides back in at the level its new number gives. No other datum changes.
 *  0.76–1.00  the changed-datum marker (Δ) appears beside the cell, then its label and the key "As supplied · no
 *             conclusion drawn". Seeking back restores the before-number and the old stack exactly.
 * The order follows only the supplied numbers (ties keep the annex numbering); nothing prevails or governs beyond them.
 * @module animations/contract-terms/LAW-0516
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, int, list, num, oneOf} from '../../schemas/fields.js';
import {lens as lensFrame} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, schedulesField, localizeScene, unitPx, fitG, fitK,
  txt, chipG, tabChip, hueOf, softOf, P2, box2, shade,
} from './kits/orden-documentos.js';

const ID = 'LAW-0516';
const DURATION = 8000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {open: [0.12, 0.24], lift: [0.3, 0.37], was: [0.35, 0.4], after: [0.38, 0.44], close: [0.48, 0.58], out: [0.58, 0.63], shift: [0.63, 0.69], in: [0.69, 0.74], marker: [0.76, 0.8], key: [0.78, 0.84], label: [0.8, 0.86]};
const ACTION_END = 0.86;

const strings = {
  en: {...KIT_STRINGS.en, annex: 'Annex', prio: 'Priority no.'},
  es: {...KIT_STRINGS.es, annex: 'Anexo', prio: 'N.º de prioridad'},
};

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  schedules: schedulesField,
  priorities: list('Supplied priority number of each annex, in the annex numbering (the stack is ordered by these numbers, lowest on top; ties keep the annex numbering). Missing entries take their annex number', int('Priority number, as supplied', 1, 9), 1, 4),
  focusTarget: int('Annex (1 = first annex) whose priority number is enlarged and substituted (clamped to the list)', 1, 4),
  beforeValue: int('Priority number of the focus annex before the substitution, as supplied (replaces its entry in priorities)', 1, 9),
  afterValue: int('Priority number of the focus annex after the substitution, as supplied', 1, 9),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens (it may be smaller to fit, never under 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'over-shelf', 'over-table'])}),
  contextLabels: obj('Labels for the context view', {context: str('Plate on the shelf (e.g. "Annex shelf · stacked by priority number")', 60), marker: str('Label of the changed-datum marker (e.g. "Supplied priority number changed")', 50)}),
  actionProgress: num('How far the inspection is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
};

const defaultParams = {
  contract: CONTENT.contract,
  clause: {heading: CONTENT.clause.heading, text: 'Documents rank by the priority number listed (supplied text)'},
  schedules: CONTENT.schedules,
  priorities: [4, 2, 6],
  focusTarget: 3,
  beforeValue: 6,
  afterValue: 1,
  detailGeometry: {zoom: 3, placement: 'auto'},
  contextLabels: {context: 'Annex shelf · stacked by priority number', marker: 'Supplied priority number changed'},
  actionProgress: 1,
};
const defaultParamsEs = {
  contract: CONTENT_ES.contract,
  clause: {heading: CONTENT_ES.clause.heading, text: 'Los documentos se ordenan por el número de prioridad (texto aportado)'},
  schedules: CONTENT_ES.schedules,
  contextLabels: {context: 'Estante de anexos · por número de prioridad', marker: 'Número de prioridad aportado cambiado'},
};

const isStress = p => p.clause.text.length > 64 || [p.contract.title, p.clause.heading, p.contextLabels.context, p.contextLabels.marker, ...p.schedules.map(s => s.label)].some(t => t.length > 46);

/** Numbers per annex before/after and the resulting stack orders (lowest number on top; ties keep the numbering). */
function numbers(p) {
  const n = p.schedules.length;
  const f = clamp(p.focusTarget, 1, n) - 1;
  const base = p.schedules.map((_, i) => clamp(p.priorities[i] ?? i + 1, 1, 9));
  const before = base.slice(); before[f] = p.beforeValue;
  const after = base.slice(); after[f] = p.afterValue;
  const sortBy = v => v.map((x, i) => i).sort((a, b) => v[a] - v[b] || a - b);
  return {n, f, before, after, orderBefore: sortBy(before), orderAfter: sortBy(after)};
}

/* ---------------------------------------------------------------------- */
/* Layout                                                                  */
/* ---------------------------------------------------------------------- */

function geom(ctx, F, minF, arr) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const m = 28, gap = 40;
  const N = numbers(p);
  const n = N.n;
  // ---- the clipboard (table)
  let board, area;
  if (arr === 'side') {
    const bw = clamp(D.w * (ctx.view.shape === 'landscape' ? 0.4 : 0.47), 400, 760);
    board = {x: m, y: m, w: bw, h: D.h - 2 * m};
    area = {x: m + bw + gap, y: m, w: D.w - 2 * m - bw - gap, h: D.h - 2 * m};
  } else {
    board = {x: m, y: m, w: D.w - 2 * m, h: 0};
    area = null;
  }
  const pad = 26, clipH = 34;
  const inner = {x: board.x + pad, w: board.w - 2 * pad};
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: inner.w, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const heading = fitG(p.clause.heading, {maxWidth: inner.w - 30, size: F, minSize: minF, maxLines: 2, weight: 700});
  const text = fitG(p.clause.text, {maxWidth: inner.w, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 500});
  const chipS = F * 1.4;
  const numF = F * 1.25;
  const wasFits = [N.before[N.f]].map(v => fitG(`${ctx.t.was}: ${v}`, {maxWidth: 400, size: F, minSize: minF, maxLines: 1, weight: 600}));
  const cellW = Math.max(numF * 1.6, wasFits[0].width) + 30;
  const colH = fitG(ctx.t.prio, {maxWidth: cellW + chipS + 14, size: Math.max(minF, F * 0.85), minSize: minF, maxLines: 2, weight: 700});
  const colA = fitG(ctx.t.annex, {maxWidth: 300, size: Math.max(minF, F * 0.85), minSize: minF, maxLines: 1, weight: 700});
  const markerR = Math.max(18, F * 0.7);
  const mCol = markerR * 2 + 12;
  const labW = inner.w - cellW - chipS - 14 - 30 - mCol;
  const labs = p.schedules.map(s => fitK(s.label, {maxWidth: labW, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 600}));
  if ([head, heading, text, colH, ...labs].some(f => f.bad) || labW < 120) why.push('table-text');
  const cellH = numF + 10 + F * 1.18 + 22;
  const rowH = Math.max(cellH, ...labs.map(f => f.height + 20)) + 10;
  let y = board.y + clipH + 16;
  const headY = y; y += head.height + 14;
  const headingY = y; y += heading.height + 22;
  const textY = y; y += text.height + 18;
  const colY = y; y += Math.max(colH.height, colA.height) + 10;
  const rowsY = y;
  const tableBottom = rowsY + n * rowH + 6;
  if (arr !== 'side') {
    board.h = tableBottom - board.y + 20;
    area = {x: m, y: board.y + board.h + gap, w: D.w - 2 * m, h: D.h - 2 * m - board.h - gap};
  }
  if (tableBottom + 14 > board.y + board.h + 0.5) why.push('table-height');
  const rows = p.schedules.map((_, i) => ({y: rowsY + i * rowH, h: rowH - 8}));
  const cellX = inner.x + inner.w - cellW - mCol, chipX = cellX - 14 - chipS;
  // ---- the shelf with the stack (binders lying flat, spines out)
  const lane = 40;
  const plateFit = show && p.contextLabels.context ? fitG(p.contextLabels.context, {maxWidth: area.w - 40, size: Math.max(minF, F * 0.9), minSize: minF, maxLines: 2, weight: 700}) : null;
  const plateH = plateFit ? plateFit.height + 16 : 0;
  const sw = clamp((area.w - lane - 40) / 2, 220, 560);
  const spLabW = sw - chipS - 50;
  const spLabs = p.schedules.map(s => fitK(s.label, {maxWidth: spLabW, size: F, minSize: minF, maxLines: stress ? 5 : 3, weight: 700}));
  if (spLabs.some(f => f.bad)) why.push('spine-text');
  const plankY = area.y + area.h - plateH - 34;
  const shH = Math.max(Math.max(...spLabs.map(f => f.height), chipS) + 30, Math.min(170, (plankY - area.y - 20) * 0.78 / n));
  const pileH = n * shH;
  const notesTop = area.y;
  const pileTop = plankY - pileH;
  if (pileTop < area.y + 4) why.push('pile-height');
  const pileX = area.x + 20;
  const outX = pileX + sw + lane;
  const levelY = k => pileTop + k * shH;
  // ---- lens: source = the focus row's chip and cell; destination = over the area away from the table row
  // (the focus row and its neighbours, chip and number columns only: every field is wholly inside or wholly out)
  let r0 = Math.max(0, N.f - 1), r1 = Math.min(n - 1, N.f + 1);
  if (r1 - r0 < 1 && n > 1) { if (r0 > 0) r0--; else r1 = Math.min(n - 1, r1 + 1); }
  const lensRows = Array.from({length: r1 - r0 + 1}, (_, j) => r0 + j);
  const src = {x: chipX - 16, y: rows[r0].y - 6, w: cellX + cellW - chipX + 32, h: rows[r1].y + rows[r1].h - rows[r0].y + 12};
  const minSide = 0.38 * 1080 / unitPx(ctx);
  const zoomMax = p.detailGeometry.zoom;
  let dest = null, zoom = 0;
  const cands = [];
  cands.push({x: area.x, y: area.y, w: area.w, h: area.h, k: 'over-shelf'});
  // (larger windows clear of the source: right of it, or below it, partly over the table's lower rows)
  if (arr === 'side') cands.push({x: src.x + src.w + 24, y: m, w: D.w - m - (src.x + src.w + 24), h: D.h - 2 * m, k: 'right'});
  else cands.push({x: m, y: src.y + src.h + 24, w: D.w - 2 * m, h: D.h - m - (src.y + src.h + 24), k: 'below'});
  for (const c of cands) {
    const z = Math.min(zoomMax, (c.w - 20) / src.w, (c.h - 20) / src.h);
    if (z > zoom) { zoom = z; dest = {w: src.w * z, h: src.h * z, x: c.x + (c.w - src.w * z) / 2, y: c.y + (c.h - src.h * z) / 2}; }
  }
  if (zoom < 1.5) why.push('zoom-too-small');
  if (dest && Math.min(dest.w, dest.h) < minSide * 0.95) why.push('lens-small');
  // ---- marker beside the cell; notes (marker label, key) under the table or on the shelf top
  const markerAt = {x: cellX + cellW + markerR + 8, y: rows[N.f].y + rows[N.f].h / 2};
  const notes = [];
  if (show && p.contextLabels.marker) notes.push({name: 'mlabel', kind: 'marker', text: p.contextLabels.marker});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  const contentMin = Math.min(F, ...labs.map(f => f.size), ...spLabs.map(f => f.size), text.size);
  const placed = [];
  const regions = [];
  if (arr === 'side') regions.push({x: inner.x, w: inner.w, top: tableBottom + 18, bottom: board.y + board.h - 14});
  // (the lane right of the stack is free once the binder is back: the notes appear only after that)
  regions.push({x: outX, w: area.x + area.w - outX - 10, top: notesTop + 14, bottom: plankY - 14});
  regions.push({x: area.x + 10, w: area.w - 20, top: notesTop + 4, bottom: pileTop - 14});
  const used = regions.map(q => ({...q, y: q.top}));
  for (const q of notes) {
    let ok = false;
    for (const rg of used) {
      if (rg.w < 160) continue;
      const sz = q.kind === 'key' ? contentMin : F;
      const c = chipG(ctx, q.text, {x: rg.x, y: rg.y, maxWidth: rg.w, size: sz, minSize: Math.min(minF, sz), maxLines: stress ? 4 : 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, opacity: 0, fill: q.kind === 'marker' ? ctx.theme.accent2Soft : ctx.theme.card});
      if (c.bad || rg.y + c.box.h > rg.bottom + 0.5) continue;
      placed.push({q, c}); rg.y += c.box.h + 12;
      // a chip in the right part of the area also blocks the full-width region over the same rows
      ok = true; break;
    }
    if (!ok) why.push(`note-${q.name}`);
  }
  return {
    ok: !why.length, why, F, minF, arr, N, n, board, area, inner, clipH, head, headY, heading, headingY, text, textY, colH, colA, colY, labs, rows, rowH, cellX, cellW, chipX, chipS, numF, cellH,
    wasFit: wasFits[0], lensRows, sw, shH, spLabs, plankY, pileTop, pileX, outX, levelY, plateFit, plateH, src, dest, zoom, markerR, markerAt, placed, stress, labW,
  };
}

/* ---------------------------------------------------------------------- */
/* Art                                                                     */
/* ---------------------------------------------------------------------- */

/** The priority cell of row i (chip + number cell). prefix separates the context and lens copies. */
function cellArt(ctx, L, i, prefix, show) {
  const p = ctx.params;
  const row = L.rows[i];
  const cx = L.cellX, cy = row.y + (row.h - L.cellH) / 2;
  const v0 = L.N.before[i], v1 = L.N.after[i];
  const numY = cy + 10 + L.numF * 0.82;
  const num = (v, name, op) => g({name, opacity: op},
    show ? h('text', {x: r(cx + L.cellW / 2), y: r(numY), 'text-anchor': 'middle', 'font-size': r(L.numF, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: INK}, String(v))
      : h('g', null, ...Array.from({length: Math.min(v, 9)}, (_, j) => h('circle', {cx: r(cx + L.cellW / 2 + ((j % 5) - (Math.min(v, 5) - 1) / 2) * 13), cy: r(numY - L.numF * 0.35 + Math.floor(j / 5) * 13), r: 4.5, fill: INK}))));
  const parts = [
    tabChip(ctx, L.chipX, row.y + row.h / 2 - L.chipS / 2, L.chipS, i, p.schedules[i].tab, show),
    h('rect', {x: r(cx), y: r(cy), width: r(L.cellW), height: r(L.cellH), rx: 8, fill: '#fff8e6', stroke: INK, 'stroke-width': 2}),
  ];
  if (i !== L.N.f) parts.push(num(v0, undefined, undefined));
  else {
    parts.push(num(v0, `${prefix}before`, 1), num(v1, `${prefix}after`, 0));
    parts.push(g({name: `${prefix}was`, opacity: 0}, show ? txt(L.wasFit, {x: cx + L.cellW / 2, y: cy + L.cellH - 12 - L.wasFit.height, anchor: 'middle', fill: '#5b4d36'}) : h('path', {d: `M${r(cx + 20)} ${r(cy + L.cellH - 18)}h${r(L.cellW - 40)}`, stroke: '#cbbd9c', 'stroke-width': 6, 'stroke-linecap': 'round'})));
  }
  return g(null, parts);
}

function spineArt(ctx, L, si, show) {
  const p = ctx.params;
  const {sw, shH, chipS} = L;
  const hue = hueOf(si);
  return g(null,
    h('rect', {x: 0, y: 0, width: r(sw), height: r(shH - 2), rx: 6, fill: hue, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(sw - 14), y: 2, width: 10, height: r(shH - 6), rx: 3, fill: '#f4efe4', stroke: INK, 'stroke-width': 1.4}),
    h('rect', {x: 10, y: 7, width: r(sw - 34), height: r(shH - 16), rx: 5, fill: softOf(si), stroke: shade(hue, -0.3), 'stroke-width': 1.6}),
    g({name: `sp${si}-print`},
      tabChip(ctx, 18, (shH - 2) / 2 - chipS / 2, chipS, si, p.schedules[si].tab, show),
      show ? txt(L.spLabs[si], {x: 18 + chipS + 12, y: (shH - 2) / 2 - L.spLabs[si].height / 2, fill: INK}) : h('path', {d: `M${r(30 + chipS)} ${r(shH / 2)}h${r(Math.min(sw - chipS - 80, 200))}`, stroke: shade(hue, 0.35), 'stroke-width': 9, 'stroke-linecap': 'round'}),
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
    const arrs = shape === 'portrait' ? ['top'] : shape === 'landscape' ? ['side'] : ['side', 'top'];
    let L = null, first = null;
    const tried = [];
    outer: for (const fpx of stress ? [23, 21.5, 20, 18.5, 17.2] : [28, 26.5, 25, 23.5, 22, 20.5]) {
      for (const a of arrs) {
        L = geom(ctx, fpx / upx, minF, a);
        if (!first) first = L;
        tried.push(`${fpx}/${a}:${L.why.join('+')}`);
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
    const {board, inner} = L;
    // clipboard
    const bd = g(null,
      h('rect', {x: r(board.x + 8), y: r(board.y + 12), width: r(board.w), height: r(board.h), rx: 16, fill: th.shadow}),
      h('rect', {x: r(board.x), y: r(board.y), width: r(board.w), height: r(board.h), rx: 16, fill: '#9c7550', stroke: INK, 'stroke-width': 2.6}),
      h('rect', {x: r(board.x + 12), y: r(board.y + L.clipH * 0.6), width: r(board.w - 24), height: r(board.h - L.clipH * 0.6 - 12), rx: 8, fill: '#fffdf7', stroke: INK, 'stroke-width': 2}),
      h('rect', {x: r(board.x + board.w / 2 - 80), y: r(board.y - 6), width: 160, height: r(L.clipH + 8), rx: 10, fill: '#b8bec6', stroke: INK, 'stroke-width': 2.4}),
      h('rect', {x: r(board.x + board.w / 2 - 50), y: r(board.y + 4), width: 100, height: 12, rx: 6, fill: '#8d949c'}),
    );
    const parts = [bd];
    if (show) {
      parts.push(txt(L.head, {x: inner.x, y: L.headY, fill: INK}), txt(L.heading, {x: inner.x, y: L.headingY, fill: '#4b3a6b'}), txt(L.text, {x: inner.x, y: L.textY, fill: '#3b3f45'}));
      parts.push(txt(L.colA, {x: inner.x, y: L.colY, fill: '#6b6f75'}), txt(L.colH, {x: L.cellX + L.cellW, y: L.colY, anchor: 'end', fill: '#6b6f75'}));
    } else {
      parts.push(h('path', {d: `M${r(inner.x)} ${r(L.headY + 12)}h${r(Math.min(inner.w * 0.7, 360))}M${r(inner.x)} ${r(L.headingY + 12)}h${r(Math.min(inner.w * 0.5, 260))}`, stroke: '#cfc5b0', 'stroke-width': 10, 'stroke-linecap': 'round'}));
    }
    L.rows.forEach((row, i) => {
      parts.push(h('rect', {x: r(inner.x - 8), y: r(row.y), width: r(inner.w + 16), height: r(row.h), rx: 8, fill: i % 2 ? '#f7f2e8' : '#ffffff', stroke: '#e1d8c6', 'stroke-width': 1.4}));
      parts.push(show ? txt(L.labs[i], {x: inner.x + 4, y: row.y + row.h / 2 - L.labs[i].height / 2, fill: INK}) : h('path', {d: `M${r(inner.x + 4)} ${r(row.y + row.h / 2)}h${r(Math.min(L.labW - 20, 220))}`, stroke: '#cfc5b0', 'stroke-width': 9, 'stroke-linecap': 'round'}));
      parts.push(cellArt(ctx, L, i, 'c-', show));
    });
    // shelf, plank, plate and the stack (spines)
    const A = L.area;
    const shelf = g(null,
      h('rect', {x: r(A.x), y: r(A.y), width: r(A.w), height: r(A.h), rx: 16, fill: '#efe5d3', stroke: '#c2b08f', 'stroke-width': 2}),
      h('rect', {x: r(A.x + 6), y: r(L.plankY), width: r(A.w - 12), height: 20, rx: 5, fill: '#8a6a4a', stroke: INK, 'stroke-width': 2.4}),
    );
    const plate = L.plateFit ? (() => {
      const f = L.plateFit, w = f.width + 28, hh = f.height + 12;
      const x = A.x + 12, y = L.plankY + 26;
      return g(null, h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), rx: 6, fill: '#e8d6a8', stroke: INK, 'stroke-width': 1.8}), txt(f, {x: x + 14, y: y + 6, fill: INK}));
    })() : null;
    const spines = p.schedules.map((_, si) => g({name: `sp${si}`, transform: T(L.pileX, L.levelY(L.N.orderBefore.indexOf(si)))}, spineArt(ctx, L, si, show)));
    // lens: a real copy of the focus row's chip and cell at the same coordinates
    const content = g(null,
      h('rect', {x: r(L.src.x - 40), y: r(L.src.y - 40), width: r(L.src.w + 80), height: r(L.src.h + 80), fill: '#fffdf7'}),
      g({name: 'L-cellcopy', opacity: 0}, L.lensRows.map(i => g(null,
        h('rect', {x: r(inner.x - 8), y: r(L.rows[i].y), width: r(inner.w + 16), height: r(L.rows[i].h), rx: 8, fill: i % 2 ? '#f7f2e8' : '#ffffff', stroke: '#e1d8c6', 'stroke-width': 1.4}),
        cellArt(ctx, L, i, 'L-', show)))),
    );
    const lz = lensFrame(ctx, {name: 'lens', source: L.src, dest: L.dest, content, color: th.accent2});
    const marker = changedMarker(ctx, {name: 'marker', x: L.markerAt.x, y: L.markerAt.y, radius: L.markerR, opacity: 0});
    const notes = L.placed.map(pl => pl.c.node);
    return g({name: 'scene'}, parts, shelf, plate, spines, marker, g({name: 'lz-wrap', 'data-occludes': 1}, lz.node), notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(W.open[0], W.label[1], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};
    const E = ease.inOutCubic;
    // lens
    const oq = E(seg(a, ...W.open)), cq = E(seg(a, ...W.close));
    const open = cq > 0 ? 1 - cq : oq;
    Object.assign(nodes, L.lensFrame(open));
    nodes['lens-coneA'] = {...nodes['lens-coneA'], opacity: open > 0.05 ? 1 : 0};
    nodes['lens-coneB'] = {...nodes['lens-coneB'], opacity: open > 0.05 ? 1 : 0};
    const lift = seg(a, ...W.lift), wasQ = seg(a, ...W.was), aftQ = seg(a, ...W.after);
    const copyO = open < 0.4 ? 0 : clamp((open - 0.4) / 0.4);
    nodes['L-cellcopy'] = {opacity: r(copyO, 3)};
    nodes['L-before'] = {opacity: r(1 - lift, 3), transform: T(0, r(-24 * ease.outCubic(lift), 2))};
    nodes['L-after'] = {opacity: r(aftQ, 3), transform: T(0, r(-14 * (1 - ease.outCubic(aftQ)), 2))};
    nodes['L-was'] = {opacity: r(wasQ, 3)};
    // context copy blanked while the lens shows the datum; it swaps while hidden
    const ctxVis = 1 - clamp(open / 0.3);
    const changed = aftQ >= 1;
    nodes['c-before'] = {opacity: r(changed ? 0 : ctxVis, 3)};
    nodes['c-after'] = {opacity: r(changed ? ctxVis : 0, 3)};
    nodes['c-was'] = {opacity: r(changed ? ctxVis : 0, 3)};
    // dependent geometry: the focus binder slides out, the others shift, it slides back in
    const f = L.N.f;
    const outQ = E(seg(a, ...W.out)), shQ = E(seg(a, ...W.shift)), inQ = E(seg(a, ...W.in));
    const kB = si => L.N.orderBefore.indexOf(si), kA = si => L.N.orderAfter.indexOf(si);
    const pos = {};
    for (let si = 0; si < L.n; si++) {
      let P;
      if (si === f) {
        const x = lerp(L.pileX, L.outX, outQ * (1 - inQ));
        const y = lerp(L.levelY(kB(si)), L.levelY(kA(si)), shQ);
        P = {x, y};
      } else P = {x: L.pileX, y: lerp(L.levelY(kB(si)), L.levelY(kA(si)), shQ)};
      pos[si] = P;
      nodes[`sp${si}`] = {transform: T(r(P.x, 2), r(P.y, 2))};
    }
    nodes.marker = {opacity: r(done ? seg(u, ...W.marker) : 0, 3)};
    for (const pl of L.placed) nodes[pl.q.name] = {opacity: r(done ? seg(u, ...(pl.q.kind === 'key' ? W.key : W.label)) : 0, 3)};
    const contextDatum = Math.max(+nodes['c-before'].opacity, +nodes['c-after'].opacity);
    const copyShown = r(copyO * Math.max(1 - lift, aftQ), 3);
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const stack = Object.keys(pos).map(Number).filter(si => pos[si].x === L.pileX).sort((x, y) => pos[x].y - pos[y].y);
    return {
      nodes,
      semantic: {
        beat, value: aftQ >= 1 ? 'after' : aftQ > 0 ? 'changing' : 'before', shownValue: aftQ >= 1 ? L.N.after[f] : L.N.before[f],
        lensOpen: r(open, 3), copyShown, contextDatum: r(contextDatum, 3), zoom: r(L.zoom, 3), wasShown: r(Math.max(wasQ * copyO, +nodes['c-was'].opacity), 3),
        focusBinder: P2(pos[f]), stack, stackBefore: L.N.orderBefore, stackAfter: L.N.orderAfter, moved: shQ >= 1 && inQ >= 1,
        othersValues: L.N.before.filter((_, i) => i !== f).join(',') === L.N.after.filter((_, i) => i !== f).join(','),
        markerShown: r(+nodes.marker.opacity, 3), keyShown: L.placed.some(pl => pl.q.kind === 'key') ? r(+nodes.key.opacity, 3) : 0,
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), tried: L.ok ? undefined : L.tried.join(' | '), problems: L.ok ? [] : L.why,
        actionCapped: p.actionProgress < 1 && u > capU, arrangement: L.arr,
        lensBox: box2(L.dest), srcBox: box2(L.src),
      },
    };
  },
};

// the lens frame function is created in layout (pure), attached here so frame() can call it
const baseLayout = scene.layout;
scene.layout = ctx => {
  const L = baseLayout(ctx);
  L.lensFrame = lensFrame(ctx, {name: 'lens', source: L.src, dest: L.dest, content: null, color: ctx.theme.accent2}).frame;
  return L;
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-09-inspect',
    title: 'Order of documents, without doctrine — a lens isolates one annex\'s supplied priority number; the number is substituted and only that binder changes level in the stack',
    titleEs: 'Orden de documentos — Inspección y cambio de un dato',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Orden de documentos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A clipboard holds the contract "CT-208 · Services contract (fictional)" with the heading "Order of documents clause", its supplied text and a priority table (annex label, tab letter, supplied priority number). On a shelf the annex binders lie stacked spine-out by those numbers, lowest on top. A detail lens opens over the shelf — a real enlargement of the focus annex\'s tab letter and number cell, the context number blanked in step. In the lens the before-number lifts away and stays traceable as "was: …" and the supplied after-number drops in. The lens closes, the cell shows the new number, and only the dependent geometry follows: that binder slides out of the stack, the others close up, and it slides back in at its new level. A changed-datum marker (Δ) appears beside the cell with its label and the key "As supplied · no conclusion drawn". Seeking back restores the old number and stack. Nothing prevails or governs beyond the supplied numbers.',
    tags: ['order of documents', 'priority clause', 'annexes', 'schedules', 'inspect', 'detail lens', 'substitution', 'priority number', 'stack', 'binders', 'clipboard', 'changed marker', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/orden-documentos.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
