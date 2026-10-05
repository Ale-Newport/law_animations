/**
 * LAW-0502 — Limitación contractual · mechanism
 *
 * Storyboard (an exploded stack of three transparent sheets — capas — sliding apart along a diagonal rail):
 *  0.00–0.20  separate: the three sheets lie registered one on another; they slide apart along the rail into their
 *             places: layer 1 "Clause text" (the supplied clause lines of "CT-246 · Contract (fictional)"), layer 2
 *             "Contour" (the contour on clear acetate) and layer 3 "Categories" (the supplied category tiles). The corner
 *             registration crosses stay visible on every sheet, so the layers read as one stack taken apart.
 *  0.20–0.43  relate: only the supplied relations are drawn, as plain lines without arrows: from each clause line to
 *             every category read from it (the line passes over the contour layer, beside the tile's place there).
 *  0.43–0.74  trace: a bead travels the traversal order (default clause line → contour → category) of the focus
 *             category, dwelling longest on the focus element, which enlarges while the bead rests on it.
 *  0.74–1.00  hold: each tile shows its supplied status (● included / ◆ exclusion to be reviewed, drawn alike), the key
 *             "As supplied · no conclusion drawn" and the annotations.
 * No doctrine on limitation or exclusion clauses: no enforceability, validity or effect, no cap or amount, no outcome.
 * @module animations/contract-terms/LAW-0502
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, int, oneOf, annotation} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, categoriesField, statusLabelsField,
  localizeScene, unitPx, fitG, chipG, txt, statusGlyph, tileArt, tileTextX, contourGeom, contourNode, clauseOf, worstStatus,
} from './kits/limitacion-contractual.js';

const ID = 'LAW-0502';
const DURATION = 6500;
const BEATS = {separate: [0, 0.2], relate: [0.2, 0.43], trace: [0.43, 0.74], hold: [0.74, 1]};
const W = {explode: [0.04, 0.19], text: [0.18, 0.22], relate: [0.22, 0.42], trace: [0.45, 0.72], status: [0.73, 0.78], key: [0.77, 0.82], notes: [0.79, 0.84]};
const ELEMENTS = ['clause', 'contour', 'category'];

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  categories: categoriesField,
  statusLabels: statusLabelsField,
  layerLabels: obj('Labels of the three layers', {
    clause: str('Layer 1 (clause text)', 40), contour: str('Layer 2 (contour)', 40), category: str('Layer 3 (categories)', 40),
  }, ['clause', 'contour', 'category']),
  focusCategory: int('The category the bead traces (1 = top; clamped to the list)', 1, 4),
  focusElement: oneOf('Element the bead dwells on longest (it enlarges while the bead rests on it)', ELEMENTS),
  traversalOrder: list('Order in which the bead visits the elements', oneOf('Element id', ELEMENTS), 2, 3),
  annotations: list('Editorial callouts shown in the final hold', annotation(ELEMENTS), 0, 2),
};
const noSheet = ({sheetLabel, ...rest}) => (void sheetLabel, rest);
const defaultParams = {
  ...noSheet(CONTENT),
  layerLabels: {clause: 'Layer 1 · Clause text', contour: 'Layer 2 · Contour', category: 'Layer 3 · Categories'},
  focusCategory: 2,
  focusElement: 'contour',
  traversalOrder: ['clause', 'contour', 'category'],
  annotations: [],
};
const defaultParamsEs = {
  ...noSheet(CONTENT_ES),
  layerLabels: {clause: 'Capa 1 · Texto de la cláusula', contour: 'Capa 2 · Contorno', category: 'Capa 3 · Categorías'},
};

const isStress = p => [...p.clauses, ...p.categories.map(c => c.label), p.contract.title, p.statusLabels.included, p.statusLabels.review, p.clauseTitle].some(t => t.length > 40) || p.annotations.length > 1;

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const wide = shape === 'landscape';
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 16;
  // notes
  const notes = [];
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `note${i}`, kind: 'note', text: an.text, target: an.target}));
  const gap = 14;
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: F, minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: '#ffffff'});
  // sheets
  const n = p.categories.length;
  let S, S0, S2, pos, notesBox;
  const tabFit = t => fitG(t, {maxWidth: (wide ? D.w * 0.29 : shape === 'square' ? D.w * 0.4 : D.w * 0.7) - 40, size: F, minSize: minF, maxLines: 2, weight: 800});
  const tabs = [tabFit(p.layerLabels.clause), tabFit(p.layerLabels.contour), tabFit(p.layerLabels.category)];
  const tabH = Math.max(...tabs.map(t => t.height)) + 22;
  if (wide) {
    const nw = notes.length ? D.w - pad * 2 : 0;
    const nh = notes.length ? Math.max(...notes.map(q => chipOf(q, 0, 0, (nw - gap * (notes.length - 1)) / notes.length).box.h)) : 0;
    const step = (D.w - pad * 2) / 3.02;
    S = {w: step - 26, h: D.h - pad * 2 - 40 - (nh ? nh + 24 : 0) - tabH};
    pos = [0, 1, 2].map(i => ({x: pad + i * (step + 4) + 2, y: pad + tabH + 40 - i * 20}));
    notesBox = {x: pad, y: D.h - pad - nh, w: nw, h: nh, row: true};
  } else if (shape === 'square') {
    const nw = D.w - pad * 2;
    const nh = notes.length ? Math.max(...notes.map(q => chipOf(q, 0, 0, (nw - gap * (notes.length - 1)) / notes.length).box.h)) : 0;
    const gut = 30 + 24 * n;
    const avH = D.h - pad * 2 - (nh ? nh + 22 : 0) - 2 * tabH - 30;
    const w0 = D.w - pad * 2 - gut;
    const hf = fitG(`${p.contract.reference} · ${p.contract.title} · ${p.clauseTitle}`, {maxWidth: w0 - 60, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 800});
    const cf = p.clauses.map(c => fitG(c, {maxWidth: w0 - 80, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
    const h0 = Math.max(avH * 0.22, hf.height + 36 + cf.reduce((a, f) => a + f.height + 24 + 14, 0) + 30);
    const W2 = D.w - pad * 2 - gut - 30;
    S = {w: W2 * 0.62, h: avH - h0};
    S2 = {w: W2 * 0.38, h: avH - h0};
    S0 = {w: w0, h: h0};
    const y2 = pad + tabH + h0 + 30 + tabH;
    pos = [{x: pad, y: pad + tabH}, {x: pad, y: y2}, {x: pad + S2.w + 30, y: y2}];
    notesBox = {x: pad, y: D.h - pad - nh, w: nw, h: nh, row: true};
  } else {
    const nw = D.w - pad * 2;
    const nh = notes.length ? notes.reduce((a, q) => a + chipOf(q, 0, 0, nw).box.h + gap, -gap) : 0;
    const stepY = (D.h - pad * 2 - (nh ? nh + 24 : 0)) / 3;
    S = {w: D.w - pad * 2 - 70 - 30 - 24 * n, h: stepY - tabH - 22};
    pos = [0, 1, 2].map(i => ({x: pad + i * 35, y: pad + tabH + i * stepY}));
    notesBox = {x: pad, y: D.h - pad - nh, w: nw, h: nh, row: false};
  }
  S0 = S0 ?? S;
  S2 = S2 ?? S;
  if (S.h < 150) why.push('sheet-small');
  // stacked (start) position: the middle sheet's place
  const stack = pos[1];
  // layer 1: contract heading + clause lines
  const padX = 30;
  const head = fitG(`${p.contract.reference} · ${p.contract.title} · ${p.clauseTitle}`, {maxWidth: S0.w - padX * 2, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 800});
  const clauseFits = p.clauses.map(c => fitG(c, {maxWidth: S0.w - padX * 2 - 20, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
  const top1 = head.height + 36;
  const area1 = S0.h - top1 - 16;
  const need1 = clauseFits.reduce((a, f) => a + f.height + 24, 0) + 12 * (clauseFits.length - 1);
  if (need1 > area1) why.push('clauses-do-not-fit');
  const cg1 = Math.max(12, (area1 - need1) / (clauseFits.length + 1));
  let y1 = top1 + cg1;
  const clauseRows = clauseFits.map(f => { const row = {y: y1, h: f.height + 24, fit: f}; y1 += row.h + Math.max(12, cg1); return row; });
  // layer 3: tiles (same local column as the contour on layer 2)
  const C = {x: 18, y: 18, w: S.w - 36, h: S.h - 36};
  const neck = clamp(C.w * 0.12, 44, 80);
  const tileX = C.x + neck + 18, tileW = C.x + C.w - 14 - tileX;
  const gR = Math.min(14, F * 0.6);
  const labFits = p.categories.map(c => fitG(c.label, {maxWidth: tileW - tileTextX(70) - 10, size: F, minSize: minF, maxLines: 2, weight: 700}));
  const stFits = p.categories.map(c => fitG(p.statusLabels[c.status], {maxWidth: tileW - tileTextX(70) - gR * 2 - 18, size: F * 0.9, minSize: minF, maxLines: 2, weight: 600}));
  const stWorst = fitG(worstStatus(p), {maxWidth: tileW - tileTextX(70) - gR * 2 - 18, size: F * 0.9, minSize: minF, maxLines: 2, weight: 600});
  if ([...labFits, ...stFits, stWorst, head, ...clauseFits, ...tabs].some(f => f.bad)) why.push('text');
  const tileH0 = Math.max(...labFits.map(f => f.height)) + stWorst.height + 30;
  const tgap0 = 30;
  if (n * tileH0 + (n - 1) * tgap0 + 24 > C.h) why.push('tiles-do-not-fit');
  const tileH = Math.min(tileH0 + F, (C.h - 24 - (n - 1) * tgap0) / n);
  const tgap = n > 1 ? (C.h - 24 - n * tileH) / (n - 1) : 0;
  const tiles = p.categories.map((c, i) => ({x: tileX, y: C.y + 12 + i * (tileH + tgap), w: tileW, h: tileH, lab: labFits[i], st: stFits[i], status: c.status, clause: clauseOf(p, c)}));
  const cg = contourGeom(C, tiles.map(t => ({y: t.y - 6, h: t.h + 12})), tiles.map(t => t.status), C.x + neck, 18);
  const C2 = {x: 18, y: 18, w: S2.w - 36, h: S.h - 36};
  const neck2 = neck * C2.w / C.w;
  const cg2 = S2 === S ? cg : contourGeom(C2, tiles.map(t => ({y: t.y - 6, h: t.h + 12})), tiles.map(t => t.status), C2.x + neck2, 18);
  // notes placement
  let notesPl = null;
  if (notes.length) {
    if (notesBox.row) {
      const w = (notesBox.w - gap * (notes.length - 1)) / notes.length;
      notesPl = notes.map((q, i) => { const c = chipOf(q, notesBox.x + i * (w + gap), notesBox.y, w); if (c.bad) why.push('note-text'); return {q, c}; });
    } else {
      let ny = notesBox.y;
      notesPl = notes.map(q => { const c = chipOf(q, notesBox.x, ny, notesBox.w); if (c.bad) why.push('note-text'); ny += c.box.h + gap; return {q, c}; });
    }
  }
  // relations (world coords, sheets at their final places): clause row right end → tile left end on layer 3
  const rel = tiles.map((t, i) => {
    const row = clauseRows[t.clause];
    const a = {x: pos[0].x + S.w - 12, y: pos[0].y + row.y + row.h / 2};
    const b = {x: pos[2].x + t.x - 4, y: pos[2].y + t.y + t.h / 2};
    let pts = [a, b];
    if (!wide) {
      // portrait / square: each relation runs in its own lane of the right-hand gutter
      a.x = pos[0].x + S0.w - 10; b.x = pos[2].x + t.x + t.w + 4;
      const lane = pos[2].x + S.w + 22 + i * 24;
      pts = [a, {x: lane, y: a.y}, {x: lane, y: b.y}, b];
    }
    let len = 0;
    for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
    const d = `M${pts.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`;
    return {i, a, b, d, len};
  });
  const fi = clamp(p.focusCategory, 1, n) - 1;
  const ft = tiles[fi];
  const frow = clauseRows[ft.clause];
  const stops = {
    clause: {x: pos[0].x + padX + Math.min(frow.fit.width, S0.w - padX * 2) / 2, y: pos[0].y + frow.y + frow.h / 2},
    contour: {x: pos[1].x + (ft.status === 'review' ? C2.x + neck2 : C2.x + C2.w), y: pos[1].y + ft.y + ft.h / 2},
    category: {x: pos[2].x + ft.x + 30, y: pos[2].y + ft.y + ft.h / 2},
  };
  return {ok: !why.length, why, F, minF, wide, S, S0, S2, cg2, pos, stack, tabs, tabH, head, clauseRows, padX, C, neck, tiles, gR, cg, notesPl, rel, stops, fi};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1100, 1150], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [25, 23, 21.5, 20.2]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const show = ctx.show('all');
    const {S} = L;
    const tints = ['#fbf3df', '#e3eff7', '#f1efe8'];
    const edge = ['#b99a5a', '#5f8db0', '#8c8778'];
    const sheet = (i, content) => {
      const tab = L.tabs[i];
      const S = i === 0 ? L.S0 : i === 1 ? L.S2 : L.S;
      return g({name: `layer${i}`},
        h('rect', {x: 10, y: 14, width: r(S.w), height: r(S.h), rx: 12, fill: th.shadow}),
        h('path', {d: roundRectPath(0, -L.tabH, Math.min(S.w * 0.92, tab.width + 44), L.tabH + 12, 10), fill: edge[i], stroke: INK, 'stroke-width': 2}),
        show ? g({name: `tab${i}-t`, opacity: 0}, txt(tab, {x: 22, y: -L.tabH + 11, fill: '#ffffff'})) : h('path', {d: `M22 ${r(-L.tabH / 2)}h${r(Math.min(140, S.w * 0.3))}`, stroke: '#ffffff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.8}),
        h('rect', {x: 0, y: 0, width: r(S.w), height: r(S.h), rx: 12, fill: tints[i], opacity: i === 1 ? 0.55 : 0.93, stroke: edge[i], 'stroke-width': 3}),
        // registration crosses in the corners
        [[18, 18], [S.w - 18, 18], [18, S.h - 18], [S.w - 18, S.h - 18]].map(([x, y]) => h('path', {d: `M${r(x - 9)} ${r(y)}h18M${r(x)} ${r(y - 9)}v18`, stroke: edge[i], 'stroke-width': 2.4})),
        content,
      );
    };
    const l1 = g({name: 'l1-text', opacity: 0},
      show ? txt(L.head, {x: L.padX, y: 18, fill: INK}) : h('path', {d: `M${L.padX} 34h${r(L.S0.w * 0.5)}`, stroke: '#c9bea8', 'stroke-width': 10, 'stroke-linecap': 'round'}),
      L.clauseRows.map((row, j) => g({name: `crow${j}`},
        h('rect', {x: r(L.padX - 8), y: r(row.y), width: r(L.S0.w - L.padX * 2 + 16), height: r(row.h), rx: 7, fill: '#fffdf7', stroke: '#c7b78f', 'stroke-width': 2}),
        h('rect', {x: r(L.padX - 8), y: r(row.y), width: 8, height: r(row.h), rx: 3, fill: th.accent3}),
        show ? txt(row.fit, {x: L.padX + 10, y: row.y + 12, fill: INK}) : h('path', {d: `M${r(L.padX + 10)} ${r(row.y + row.h / 2)}h${r(Math.min(L.S0.w - L.padX * 2 - 40, 260))}`, stroke: '#d5cdbd', 'stroke-width': 8, 'stroke-linecap': 'round'}),
      )),
    );
    const l2 = g(null, g({name: 'cont'}, contourNode(ctx, 'contour', L.cg2, {drawn: true})));
    const l3 = g({name: 'l3-text', opacity: 0}, L.tiles.map((t, i) => g({name: `mt${i}`},
      g({transform: T(t.x, t.y)},
        tileArt(ctx, {w: t.w, h: t.h, n: i + 1, fit: null, showText: show}),
        show ? txt(t.lab, {x: tileTextX(t.h), y: (t.h - t.lab.height - t.st.height - 8) / 2, fill: INK}) : null,
        g({name: `st${i}`, opacity: 0},
          statusGlyph(ctx, t.status, show ? tileTextX(t.h) + L.gR : t.w - 20 - L.gR, show ? (t.h + t.lab.height - t.st.height + 8) / 2 + t.st.height / 2 : t.h / 2, L.gR),
          show ? txt(t.st, {x: tileTextX(t.h) + L.gR * 2 + 10, y: (t.h + t.lab.height - t.st.height + 8) / 2, fill: INK}) : null),
      ))));
    const rels = L.rel.map(q => g({name: `rel${q.i}`, opacity: 0},
      h('path', {name: `rel${q.i}-h`, d: q.d, fill: 'none', 'stroke-linejoin': 'round', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(q.len)} ${r(q.len + 10)}`, 'stroke-dashoffset': r(q.len), opacity: 0.85}),
      h('path', {name: `rel${q.i}-l`, d: q.d, fill: 'none', 'stroke-linejoin': 'round', stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(q.len)} ${r(q.len + 10)}`, 'stroke-dashoffset': r(q.len)}),
      h('circle', {cx: r(q.a.x), cy: r(q.a.y), r: 6.5, fill: th.accent2, stroke: '#fff', 'stroke-width': 2}),
      h('circle', {name: `rel${q.i}-e`, cx: r(q.b.x), cy: r(q.b.y), r: 6.5, fill: th.accent2, stroke: '#fff', 'stroke-width': 2, opacity: 0}),
    ));
    const bead = g({name: 'bead', opacity: 0},
      h('circle', {cx: 0, cy: 0, r: 20, fill: th.accent, opacity: 0.25}),
      h('circle', {cx: 0, cy: 0, r: 11, fill: th.accent, stroke: '#fff', 'stroke-width': 3}));
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    // stacking order: layer 3 at the bottom, then 2, then 1 (as in the registered stack)
    return g({name: 'scene'},
      g({name: 'L2pos'}, sheet(2, l3)),
      g({name: 'L1pos'}, sheet(1, l2)),
      g({name: 'L0pos'}, sheet(0, l1)),
      rels, bead, notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const q = ease.inOutCubic(seg(u, ...W.explode));
    const at = i => ({x: lerp(L.stack.x + (i - 1) * 8, L.pos[i].x, q), y: lerp(L.stack.y + (i - 1) * 8, L.pos[i].y, q)});
    const P = [0, 1, 2].map(at);
    // focus enlargement
    const fe = p.focusElement;
    const order = p.traversalOrder;
    const tq = seg(u, ...W.trace);
    const segs = [];
    const pts = order.map(id => L.stops[id]);
    order.forEach((id, i) => { if (i > 0) segs.push({kind: 'move', from: pts[i - 1], to: pts[i], w: 1}); segs.push({kind: 'dwell', id, at: pts[i], w: id === fe ? 2.4 : 1}); });
    const total = segs.reduce((a, s) => a + s.w, 0);
    let acc = 0, bead = pts[0], dwellId = null, dwellQ = 0, moving = false;
    for (const s of segs) {
      const s0 = acc / total, s1 = (acc + s.w) / total;
      if (tq <= s1 || s === segs[segs.length - 1]) {
        const lq = clamp((tq - s0) / (s1 - s0));
        if (s.kind === 'move') { const e = ease.inOutSine(lq); bead = {x: lerp(s.from.x, s.to.x, e), y: lerp(s.from.y, s.to.y, e)}; moving = u > W.trace[0] && u < W.trace[1]; } else { bead = s.at; dwellId = u > W.trace[0] && u < W.trace[1] ? s.id : null; dwellQ = lq; }
        break;
      }
      acc += s.w;
    }
    const grow = dwellId === fe ? Math.sin(Math.PI * dwellQ) * 0.14 : 0;
    const zoomAbout = (c, k) => `translate(${r(c.x, 2)} ${r(c.y, 2)}) scale(${r(1 + k, 4)}) translate(${r(-c.x, 2)} ${r(-c.y, 2)})`;
    const loc = (id, i) => ({x: L.stops[id].x - L.pos[i].x, y: L.stops[id].y - L.pos[i].y});
    for (let i = 0; i < 3; i++) nodes[`L${i}pos`] = {transform: T(r(P[i].x, 2), r(P[i].y, 2))};
    L.clauseRows.forEach((_, j) => { nodes[`crow${j}`] = {transform: fe === 'clause' && j === L.tiles[L.fi].clause ? zoomAbout(loc('clause', 0), grow) : 'translate(0 0)'}; });
    nodes.cont = {transform: fe === 'contour' ? zoomAbout(loc('contour', 1), grow * 0.6) : 'translate(0 0)'};
    L.tiles.forEach((_, i) => { nodes[`mt${i}`] = {transform: fe === 'category' && i === L.fi ? zoomAbout(loc('category', 2), grow) : 'translate(0 0)'}; });
    const tx = seg(u, ...W.text);
    nodes['l1-text'] = {opacity: r(tx, 3)};
    nodes['l3-text'] = {opacity: r(tx, 3)};
    if (ctx.show('all')) for (let i = 0; i < 3; i++) nodes[`tab${i}-t`] = {opacity: r(tx, 3)};
    // relations, one after another
    const nR = L.rel.length;
    L.rel.forEach((rl, k) => {
      const a = W.relate[0] + (k / nR) * (W.relate[1] - W.relate[0]);
      const b = a + (W.relate[1] - W.relate[0]) / nR * 0.85;
      const d = ease.inOutSine(seg(u, a, b));
      const off = r(rl.len * (1 - d));
      nodes[`rel${rl.i}`] = {opacity: d > 0 ? 1 : 0};
      nodes[`rel${rl.i}-h`] = {'stroke-dashoffset': off};
      nodes[`rel${rl.i}-l`] = {'stroke-dashoffset': off};
      nodes[`rel${rl.i}-e`] = {opacity: d >= 1 ? 1 : 0};
    });
    const beadOn = u > W.trace[0] && u < W.trace[1] + 0.01;
    nodes.bead = {opacity: beadOn ? 1 : 0, transform: T(r(bead.x, 2), r(bead.y, 2))};
    L.tiles.forEach((_, i) => { nodes[`st${i}`] = {opacity: r(seg(u, W.status[0] + i * 0.01, W.status[0] + i * 0.01 + 0.035), 3)}; });
    const keyO = seg(u, ...W.key), noteO = seg(u, ...W.notes);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : noteO, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'hold';
    const P2 = v => ({x: r(v.x), y: r(v.y)});
    const drawnRel = L.rel.filter((_, k) => u >= W.relate[0] + ((k + 0.85) / nR) * (W.relate[1] - W.relate[0])).length;
    return {
      nodes,
      semantic: {
        beat, layer0: P2(P[0]), layer1: P2(P[1]), layer2: P2(P[2]), bead: P2(bead),
        separated: q >= 1, explode: r(q, 3), relationsDrawn: drawnRel, relations: nR, arrows: 0,
        tracerAt: dwellId, tracerMoving: moving, beadShown: beadOn ? 1 : 0, focusGrow: r(grow, 3),
        statusesShown: r(seg(u, W.status[0] + (L.tiles.length - 1) * 0.01, W.status[0] + (L.tiles.length - 1) * 0.01 + 0.035), 3),
        statuses: L.tiles.map(t => t.status).join(','), keyShown: r(keyO, 3),
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
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
    slug: 'contract-terms-06-mechanism',
    title: 'Limitation clause, without doctrine — three transparent layers (clause text, contour, categories) slide apart; plain lines tie each clause line to its categories and a bead traces one category',
    titleEs: 'Limitación contractual — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Limitación contractual',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded stack: three registered transparent sheets slide apart along a diagonal rail — layer 1 with the supplied clause lines, layer 2 with the contour on clear acetate (a bay round each exclusion to be reviewed), layer 3 with the supplied category tiles. Only the supplied relations are drawn, as plain lines without arrows, from each clause line to the categories read from it. A bead then travels the traversal order for one category and the focus element enlarges. Hold: each tile shows its supplied status (● / ◆ drawn alike) and the key "As supplied · no conclusion drawn". No enforceability, validity, cap or amount.',
    tags: ['limitation clause', 'liability categories', 'layers', 'exploded view', 'contour', 'relations', 'tracer', 'mechanism'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/limitacion-contractual.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
