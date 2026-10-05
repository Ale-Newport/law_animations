/**
 * LAW-0501 — Limitación contractual · story
 *
 * Storyboard (a reading desk seen from above; two hands, one reading glass, one marker):
 *  0.00–0.15  rest: on the desk lie the contract ("CT-246 · Contract (fictional)", clipped, two sheets behind it) with
 *             the heading "Limitation clause" and its supplied clause lines, and the category sheet "Liability categories
 *             (supplied)" holding the supplied category tiles (index cards, top to bottom). The left hand rests on the
 *             reading glass below the contract; the right hand holds a capped-down marker below the category sheet.
 *  0.15–0.32  the left hand slides the reading glass over each supplied clause line (a real 1.6× copy under the glass)
 *             and brings it back to its place.
 *  0.32–0.66  the right hand puts the marker on the sheet and draws ONE contour, starting at the bottom-left corner:
 *             up the left side, across the top, and down the right side; at every tile whose supplied status is
 *             "exclusion to be reviewed" the line steps in to the left, runs round that tile and steps out again, so the
 *             tile lies in a bay outside the line. The marker tip is the line's end at every frame.
 *  0.66–0.73  the marker lifts and returns to its place; each tile shows its supplied status (● included / ◆ exclusion
 *             to be reviewed: same size, colour and stroke) on its own card.
 *  0.73–1.00  hold: the contour, the statuses, the chip "Contour drawn as supplied" (or "Contour partly drawn (as
 *             supplied)") and the key "As supplied · no conclusion drawn".
 * No doctrine on limitation or exclusion clauses: no enforceability, validity or effect, no caps or amounts, no outcome.
 * The tile to be reviewed stays fully drawn and neutral (nothing crossed out, hatched or red).
 * @module animations/contract-terms/LAW-0501
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {list, num, oneOf, annotation} from '../../schemas/fields.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, categoriesField, statusLabelsField,
  sheetLabelField, localizeScene, unitPx, fitG, chipG, txt, statusGlyph, contractDoc, tileArt, tileTextX, tileGlyphRoom,
  contourGeom, contourNode, contourFrame, readingGlass, markerPen, worstStatus,
} from './kits/limitacion-contractual.js';

const ID = 'LAW-0501';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  read: [0.15, 0.3], back: [0.3, 0.4], toStart: [0.3, 0.4], draw: [0.4, 0.65], lift: [0.65, 0.735],
  status: [0.65, 0.73], final: [0.73, 0.78], key: [0.76, 0.81], notes: [0.78, 0.83],
};
const ZOOM = 1.6;
const TARGETS = ['contract', 'contour', 'review'];

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  sheetLabel: sheetLabelField,
  categories: categoriesField,
  statusLabels: statusLabelsField,
  actionProgress: num('How far the contour is drawn when finalState is "partial" (0.2–1 of its length)', 0.2, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('The supplied end state: closed (the contour is drawn all the way round) or partial (it stops at actionProgress). Nothing is inferred from either', ['closed', 'partial']),
};

const defaultParams = {
  ...CONTENT,
  actionProgress: 0.6,
  annotations: [],
  finalState: 'closed',
};
const defaultParamsEs = {
  ...CONTENT_ES,
};

const isStress = p => [...p.clauses, ...p.categories.map(c => c.label), p.contract.title, p.statusLabels.included, p.statusLabels.review, p.sheetLabel].some(t => t.length > 45) || p.annotations.length > 1;

/** Geometry for one candidate text size. */
function geom(ctx, F, minF, legend = false, stack = false) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = stack ? 'portrait' : ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const desk = {x: 6, y: 6, w: D.w - 12, h: D.h - 12};
  const R = clamp(Math.min(D.w, D.h) * 0.085, 62, 96); // reading glass ring
  const hl = R * 1.25;
  const glassLen = hl + 2 * R + R * 0.3;
  const mk = {len: clamp(Math.min(D.w, D.h) * 0.2, 150, 210), w: 30};
  // notes (final chip, key, annotations)
  const notes = [];
  if (show) notes.push({name: 'final', kind: 'final', text: ctx.t[p.finalState]});
  if (show && legend) ['included', 'review'].forEach((st, i) => notes.push({name: `leg${i}`, kind: 'leg', status: st, text: p.statusLabels[st]}));
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `note${i}`, kind: 'note', text: an.text, target: an.target}));
  const gap = 14;
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: Math.max(F * 0.95, minF), minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'final' ? ctx.theme.accent2Soft : '#ffffff', glyph: q.kind === 'leg' ? (gx, gy, rr) => statusGlyph(ctx, q.status, gx, gy, rr) : null});
  const notesH = w => notes.reduce((a, q) => a + chipOf(q, 0, 0, w).box.h + gap, 0) - (notes.length ? gap : 0);
  let doc, sheet, notesBox, glassRest, tipRest, shL, shR;
  const m = 34;
  {
    // the contract and the category sheet side by side (landscape, square) or stacked (portrait); the reading glass
    // rest, the notes and the marker rest share a strip along the bottom
    const restW = glassLen + 24 + mk.len * 0.8 + 30;
    const nw = desk.w - 2 * m - restW;
    const nh = notes.length ? notesH(nw) : 0;
    const strip = Math.max(R * 2 + 56, nh + 36);
    const top = desk.y + 50, bot = desk.y + desk.h - strip - 6;
    if (shape !== 'portrait') {
      const avail = desk.w - 2 * m - 44;
      const k = shape === 'landscape' ? 0.44 : 0.43;
      doc = {x: desk.x + m, y: top + 6, w: avail * k, h: bot - top - 6};
      sheet = {x: doc.x + doc.w + 44, y: top - 24, w: avail * (1 - k), h: bot - top + 24};
    } else {
      const span = bot - top - 40;
      doc = {x: desk.x + m + 10, y: top, w: desk.w - 2 * m - 20, h: span * 0.38};
      sheet = {x: desk.x + m, y: doc.y + doc.h + 40, w: desk.w - 2 * m, h: span * 0.62};
    }
    const sy = desk.y + desk.h - strip;
    glassRest = {x: desk.x + m, y: sy + strip / 2 + 4, a: -6};
    tipRest = {x: desk.x + desk.w - m - mk.len * 0.8, y: sy + strip / 2 + 14};
    const nx = glassRest.x + glassLen + 24;
    notesBox = {x: nx, y: sy + 12, w: tipRest.x - 30 - nx, h: strip - 24};
    shL = {x: desk.x + desk.w * (shape === 'landscape' ? 0.1 : 0.14), y: D.h + 150};
    shR = {x: desk.x + desk.w * (shape === 'landscape' ? 0.88 : 0.86), y: D.h + 150};
  }
  // contract content
  const padX = 44;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: doc.w - padX - 20, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const headH = head.height + 34;
  const titleF = fitG(p.clauseTitle, {maxWidth: doc.w - padX - 24, size: F * 1.05, minSize: minF, maxLines: 2, weight: 800});
  const titleY = headH + 22;
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: doc.w - padX - 40, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
  let ry = titleY + titleF.height + 20;
  const rowGap = 14;
  const rows = rowFits.map(f => { const row = {y: ry, h: f.height + 26, fit: f}; ry += row.h + rowGap; return row; });
  if (ry + 10 > doc.h) why.push('doc-rows');
  if (head.bad || titleF.bad || rowFits.some(f => f.bad)) why.push('doc-text');
  // category sheet
  const sh = fitG(p.sheetLabel, {maxWidth: sheet.w - 60, size: F, minSize: minF, maxLines: 2, weight: 800});
  const shH = sh.height + 30;
  const C = {x: sheet.x + 26, y: sheet.y + shH + 18, w: sheet.w - 52, h: sheet.h - shH - 40};
  const neck = clamp(C.w * 0.13, 54, 90);
  const tileX = C.x + neck + 22;
  const tileW = C.x + C.w - 20 - tileX;
  const n = p.categories.length;
  const gR = Math.min(15, F * 0.6);
  const labFits = p.categories.map(c => fitG(c.label, {maxWidth: tileW - tileTextX(80) - 10 - (legend ? gR * 2 + 30 : 0), size: F, minSize: minF, maxLines: legend ? 3 : 2, weight: 700}));
  const NONE = {height: 0, width: 0, lines: [], size: F, lineHeight: F, bad: false};
  const stFits = legend ? p.categories.map(() => NONE) : p.categories.map(c => fitG(p.statusLabels[c.status], {maxWidth: tileW - tileTextX(80) - gR * 2 - 22, size: F, minSize: minF, maxLines: 2, weight: 600}));
  const stWorst = legend ? NONE : fitG(worstStatus(p), {maxWidth: tileW - tileTextX(80) - gR * 2 - 22, size: F, minSize: minF, maxLines: 2, weight: 600});
  if (labFits.some(f => f.bad) || stFits.some(f => f.bad) || stWorst.bad || sh.bad) why.push('tile-text');
  const tileH0 = Math.max(...labFits.map(f => f.height)) + (legend ? 34 : stWorst.height + 44);
  const minGap = 40;
  const needH = n * tileH0 + (n - 1) * minGap + 40;
  if (needH > C.h + 0.5) why.push('tiles-do-not-fit');
  const spare = Math.max(0, C.h - needH);
  const tileH = tileH0 + Math.min(spare * 0.45 / n, F * 2.2);
  const tgap = minGap + (C.h - 40 - n * tileH - (n - 1) * minGap) / Math.max(1, n - 1) * (n > 1 ? 1 : 0);
  const tiles = p.categories.map((c, i) => ({x: tileX, y: C.y + 20 + i * (tileH + (n > 1 ? Math.max(minGap, tgap) : 0)), w: tileW, h: tileH, lab: labFits[i], st: stFits[i], status: c.status}));
  if (n === 1) tiles[0].y = C.y + (C.h - tileH) / 2;
  const cg = contourGeom(C, tiles.map(t => ({y: t.y - 8, h: t.h + 16})), tiles.map(t => t.status), C.x + neck, 22);
  // notes placement
  let notesPl = null;
  if (notes.length) {
    const hh = notesH(notesBox.w);
    if (hh > notesBox.h + 0.5 || notesBox.w < 160) why.push('notes-do-not-fit');
    let ny = notesBox.y + Math.max(0, (notesBox.h - hh) / 2);
    notesPl = notes.map(q => { const c = chipOf(q, notesBox.x, ny, notesBox.w); if (c.bad) why.push('note-text'); ny += c.box.h + gap; return {q, c}; });
  }
  // arms: lengths from the farthest target
  const glassStops = rows.map(row => [{x: doc.x + padX + 30, y: doc.y + row.y + row.h / 2}, {x: doc.x + padX + Math.max(60, Math.min(doc.w - padX - 70, row.fit.width - 30)), y: doc.y + row.y + row.h / 2}]);
  const farL = Math.max(...glassStops.flat().map(q => Math.hypot(q.x - shL.x, q.y - shL.y)), Math.hypot(glassRest.x - shL.x, glassRest.y - shL.y)) - (hl + R) * 0.4;
  const farR = Math.max(...cg.pts.map(q => Math.hypot(q.x + mk.len * 0.55 - shR.x, q.y + 40 - shR.y)));
  return {
    ok: !why.length, why, F, minF, shape, desk, doc, sheet, notesBox, notesPl, glassRest, tipRest, shL, shR,
    legend, padX, head, headH, titleF, titleY, rows, sh, shH, C, neck, tiles, gR, cg, glass: {R, hl}, mk, glassStops,
    armL: {len: Math.max(260, farL * 0.53)}, armR: {len: Math.max(260, farR * 0.53)},
  };
}

/** Pose an arm so that a prop rigidly held along the forearm puts its working point on `target`. */
function holdPose(arm, shoulder, target, off, bend) {
  let ang = Math.atan2(target.y - shoulder.y, target.x - shoulder.x);
  let posed = null, palm = null, used = ang;
  for (let k = 0; k < 5; k++) {
    used = ang;
    palm = {x: target.x - Math.cos(ang) * off, y: target.y - Math.sin(ang) * off};
    posed = arm.pose(shoulder, palm, bend);
    ang = posed.angle;
  }
  return {...posed, angle: used, palm};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1080], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [21, 19.5, 18, 17] : [26, 24, 22, 20.5]) {
      L = geom(ctx, fpx / upx, minF, false);
      if (L.ok) break;
      L = geom(ctx, fpx / upx, minF, true);
      if (L.ok) break;
      if (ctx.view.shape === 'square') { L = geom(ctx, fpx / upx, minF, true, true); if (L.ok) break; }
    }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const show = ctx.show('all');
    const dk = deskWindow(ctx, {prefix: 'desk', ...L.desk, radius: 30});
    const docArt = named => contractDoc(ctx, {prefix: '', named, w: L.doc.w, h: L.doc.h, head: L.head, headH: L.headH, title: L.titleF, titleY: L.titleY, rows: L.rows, padX: L.padX, showText: show});
    const docNode = g({transform: T(L.doc.x, L.doc.y)}, docArt(true));
    const sheetArt = () => {
      const S = L.sheet;
      return g(null,
        h('rect', {x: r(S.x + 8), y: r(S.y + 12), width: r(S.w), height: r(S.h), rx: 14, fill: th.shadow}),
        h('rect', {x: r(S.x), y: r(S.y), width: r(S.w), height: r(S.h), rx: 14, fill: '#f7f4ec', stroke: INK, 'stroke-width': 2.6}),
        // a faint grid (a drafting sheet)
        Array.from({length: Math.floor(S.w / 40)}, (_, i) => h('path', {d: `M${r(S.x + 20 + i * 40)} ${r(S.y + L.shH)}V${r(S.y + S.h - 10)}`, stroke: '#e6e0d2', 'stroke-width': 1.4})),
        h('path', {d: `M${r(S.x)} ${r(S.y + L.shH)}H${r(S.x + S.w)}`, stroke: INK, 'stroke-width': 2}),
        show ? txt(L.sh, {x: S.x + 30, y: S.y + (L.shH - L.sh.height) / 2, fill: INK})
          : h('path', {d: `M${r(S.x + 30)} ${r(S.y + L.shH / 2)}h${r(Math.min(S.w * 0.5, 300))}`, stroke: '#c9bea8', 'stroke-width': 10, 'stroke-linecap': 'round'}),
      );
    };
    const tiles = L.tiles.map((t, i) => g({transform: T(t.x, t.y)},
      tileArt(ctx, {name: `tile${i}`, w: t.w, h: t.h, n: i + 1, fit: null, showText: show}),
      show ? txt(t.lab, {x: tileTextX(t.h), y: L.legend ? (t.h - t.lab.height) / 2 : (t.h - t.lab.height - t.st.height - 12) / 2, fill: INK}) : null,
      // the status line (glyph + supplied status wording), hidden until the statuses are shown
      g({name: `st${i}`, opacity: 0},
        statusGlyph(ctx, t.status, show && !L.legend ? tileTextX(t.h) + L.gR : t.w - 20 - L.gR, show && !L.legend ? (t.h + t.lab.height - t.st.height + 12) / 2 + t.st.height / 2 : t.h / 2, L.gR),
        show && !L.legend ? txt(t.st, {x: tileTextX(t.h) + L.gR * 2 + 12, y: (t.h + t.lab.height - t.st.height + 12) / 2, fill: INK}) : null,
      ),
    ));
    const contour = contourNode(ctx, 'contour', L.cg);
    const glass = readingGlass(ctx, {name: 'glass', R: L.glass.R, hl: L.glass.hl});
    const lensCopy = g({name: 'lens', opacity: 0, 'data-occludes': 1},
      h('defs', null, h('clipPath', {id: ctx.id('lensclip')}, h('circle', {name: 'lens-clip', cx: 0, cy: 0, r: r(L.glass.R)}))),
      g({'clip-path': ctx.ref('lensclip')},
        h('circle', {name: 'lens-bg', cx: 0, cy: 0, r: r(L.glass.R), fill: '#fdfbf5'}),
        g({name: 'lens-content'}, g({transform: T(L.doc.x, L.doc.y)}, docArt(false))),
        h('circle', {name: 'lens-tint', cx: 0, cy: 0, r: r(L.glass.R), fill: '#dff1fb', opacity: 0.18}),
      ),
    );
    const pen = markerPen(ctx, {name: 'pen', len: L.mk.len, w: L.mk.w});
    const look = {skin: '#c99a76', sleeve: '#4f6d7a', cuff: '#eef1f3'};
    const armL = topArm(ctx, {name: 'armL', skin: look.skin, sleeve: look.sleeve, cuff: look.cuff, handed: 'left', upper: L.armL.len, lower: L.armL.len, width: 66});
    const armR = topArm(ctx, {name: 'armR', skin: look.skin, sleeve: look.sleeve, cuff: look.cuff, handed: 'right', upper: L.armR.len, lower: L.armR.len, width: 66});
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    const leads = L.notesPl ? L.notesPl.filter(pl => pl.q.kind === 'note').map(pl => leader(ctx, L, pl)) : [];
    return g({name: 'scene'},
      dk.surface,
      g({'clip-path': dk.clip},
        docNode, sheetArt(), tiles, contour,
        leads, notes,
        armL.arm, armL.palm, glass, lensCopy, armL.thumb,
        armR.arm, armR.palm, pen, armR.thumb,
      ),
      dk.frame,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const E = ease.inOutSine;
    const armL = topArm(ctx, {name: 'armL', skin: '#000', sleeve: '#000', handed: 'left', upper: L.armL.len, lower: L.armL.len, width: 66});
    const armR = topArm(ctx, {name: 'armR', skin: '#000', sleeve: '#000', handed: 'right', upper: L.armR.len, lower: L.armR.len, width: 66});
    // --- reading glass: rest → each clause line (left → right) → rest
    const off = L.glass.hl + L.glass.R; // palm → lens centre
    const restC = {x: L.glassRest.x + Math.cos(L.glassRest.a * Math.PI / 180) * off, y: L.glassRest.y + Math.sin(L.glassRest.a * Math.PI / 180) * off};
    const pts = [restC, ...L.glassStops.flat()];
    let c = restC, readRow = -1;
    if (u >= W.read[0] && u < W.read[1]) {
      const q = seg(u, ...W.read);
      const lens = pts.slice(1).map((pt, j) => Math.hypot(pt.x - pts[j].x, pt.y - pts[j].y) + 60);
      const tot = lens.reduce((a, b) => a + b, 0);
      let acc = 0, i = 0;
      while (i < lens.length - 1 && acc + lens[i] < q * tot) { acc += lens[i]; i++; }
      const t = E(clamp((q * tot - acc) / lens[i]));
      c = {x: lerp(pts[i].x, pts[i + 1].x, t), y: lerp(pts[i].y, pts[i + 1].y, t)};
      if (i >= 1 && (i - 1) % 2 === 0) readRow = (i - 1) / 2;
    } else if (u >= W.read[1]) {
      const last = pts[pts.length - 1];
      const t = ease.inOutSine(seg(u, ...W.back));
      c = {x: lerp(last.x, restC.x, t), y: lerp(last.y, restC.y, t)};
    }
    const pl = holdPose(armL, L.shL, c, off, 1);
    Object.assign(nodes, pl.nodes);
    const ga = pl.angle;
    const gripL = {x: c.x - Math.cos(ga) * off, y: c.y - Math.sin(ga) * off};
    nodes.glass = {transform: T(r(gripL.x, 2), r(gripL.y, 2), r(ga * 180 / Math.PI, 2))};
    const onDoc = u > W.read[0] + 0.012 && u < W.back[0] + 0.012;
    nodes.lens = {opacity: onDoc ? 1 : 0};
    nodes['lens-clip'] = {cx: r(c.x, 2), cy: r(c.y, 2)};
    nodes['lens-bg'] = {cx: r(c.x, 2), cy: r(c.y, 2)};
    nodes['lens-tint'] = {cx: r(c.x, 2), cy: r(c.y, 2)};
    nodes['lens-content'] = {transform: `translate(${r(c.x, 2)} ${r(c.y, 2)}) scale(${ZOOM}) translate(${r(-c.x, 2)} ${r(-c.y, 2)})`};
    L.rows.forEach((_, i) => { nodes[`hl${i}`] = {opacity: i === readRow ? 0.9 : 0}; });
    // --- marker: rest → contour start → draw → back to rest
    const end = p.finalState === 'partial' ? p.actionProgress : 1;
    const dq = seg(u, ...W.draw);
    const drawn = dq * end;
    const start = L.cg.at(0);
    const lastPt = L.cg.at(end);
    let tip, lifted = 1;
    if (u < W.toStart[0]) tip = {...L.tipRest};
    else if (u < W.draw[0]) { const t = ease.inOutSine(seg(u, ...W.toStart)); tip = {x: lerp(L.tipRest.x, start.x, t), y: lerp(L.tipRest.y, start.y, t)}; lifted = 1 - seg(u, W.toStart[1] - 0.01, W.draw[0]); }
    else if (u < W.draw[1]) { tip = L.cg.at(drawn); lifted = 0; }
    else { const t = ease.inOutSine(seg(u, ...W.lift)); tip = {x: lerp(lastPt.x, L.tipRest.x, t), y: lerp(lastPt.y, L.tipRest.y, t)}; lifted = seg(u, W.lift[0], W.lift[0] + 0.01); }
    const penOff = L.mk.len * 0.55;
    const pr = holdPose(armR, L.shR, tip, penOff, -1);
    Object.assign(nodes, pr.nodes);
    const pa = pr.angle;
    const lift = 1 + 0.06 * lifted;
    nodes.pen = {transform: `${T(r(tip.x, 2), r(tip.y, 2), r(pa * 180 / Math.PI + 180, 2))} scale(${r(lift, 3)})`};
    Object.assign(nodes, contourFrame('contour', L.cg, u >= W.draw[1] ? end : drawn));
    // --- statuses and notes
    L.tiles.forEach((_, i) => { nodes[`st${i}`] = {opacity: r(seg(u, W.status[0] + i * 0.012, W.status[0] + i * 0.012 + 0.04), 3)}; });
    const fin = seg(u, ...W.final), keyO = seg(u, ...W.key), noteO = seg(u, ...W.notes);
    if (L.notesPl) for (const q of L.notesPl) {
      nodes[`${q.q.name}-g`] = {opacity: r(q.q.kind === 'final' || q.q.kind === 'leg' ? fin : q.q.kind === 'key' ? keyO : noteO, 3)};
      if (q.q.kind === 'note') nodes[`${q.q.name}-lead`] = {opacity: r(noteO, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const glassBox = {x: r(c.x - L.glass.R * 1.2), y: r(c.y - L.glass.R * 1.2), w: r(L.glass.R * 2.4), h: r(L.glass.R * 2.4)};
    return {
      nodes,
      semantic: {
        beat,
        lensCentre: P2(c), glassGrip: P2(gripL), handL: P2(pl.hand), penTip: P2(tip), penGrip: P2({x: tip.x - Math.cos(pa) * penOff, y: tip.y - Math.sin(pa) * penOff}), handR: P2(pr.hand),
        allReached: pl.reached && pr.reached,
        glassAt: onDoc ? 'reading' : 'rest', readRow, lensShown: onDoc ? 1 : 0, zoom: ZOOM,
        drawn: r(u >= W.draw[1] ? end : drawn, 4), contourEnd: r(end, 3), penOnLine: u >= W.draw[0] && u < W.draw[1],
        statusesShown: r(seg(u, W.status[0] + (L.tiles.length - 1) * 0.012, W.status[0] + (L.tiles.length - 1) * 0.012 + 0.04), 3),
        statuses: L.tiles.map(t => t.status).join(','),
        bays: L.tiles.filter(t => t.status === 'review').length,
        finalState: p.finalState, finalShown: r(fin, 3), keyShown: r(keyO, 3),
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
        glassBox, tiles: L.tiles.map(t => ({x: r(t.x), y: r(t.y), w: r(t.w), h: r(t.h)})),
        contourBox: {x: r(L.C.x), y: r(L.C.y), w: r(L.C.w), h: r(L.C.h)},
      },
    };
  },
};

function leader(ctx, L, pl) {
  const b = pl.c.box;
  const rv = L.tiles.find(t => t.status === 'review') ?? L.tiles[0];
  const tg = pl.q.target === 'contract' ? {x: L.doc.x + L.doc.w - 10, y: L.doc.y + L.headH / 2}
    : pl.q.target === 'review' ? {x: L.C.x + L.neck - 18, y: rv.y + rv.h / 2}
      : {x: L.C.x + L.C.w, y: L.C.y + 6};
  const from = {x: tg.x < b.x ? b.x : tg.x > b.x + b.w ? b.x + b.w : clamp(tg.x, b.x + 12, b.x + b.w - 12), y: tg.y < b.y ? b.y : tg.y > b.y + b.h ? b.y + b.h : b.y + b.h / 2};
  return g({name: `${pl.q.name}-lead`, opacity: 0},
    h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(tg.x)} ${r(tg.y)}`, stroke: ctx.theme.inkSoft, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(tg.x), cy: r(tg.y), r: 6, fill: ctx.theme.inkSoft, stroke: '#fff', 'stroke-width': 2}),
  );
}
void roundRectPath;

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-06-story',
    title: 'Limitation clause, without doctrine — on a desk, one hand reads the supplied clause under a reading glass and the other draws one contour round the category tiles, leaving a bay round the exclusion to be reviewed',
    titleEs: 'Limitación contractual — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Limitación contractual',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down reading desk: the clipped contract with its supplied limitation-clause lines and a sheet of supplied liability category tiles. The left hand slides a reading glass over each clause line (a real enlargement), then the right hand draws one contour with a marker: up, across and down, stepping in round every tile whose supplied status is "exclusion to be reviewed" so that tile lies in a bay outside the line. Each tile then shows its supplied status (● included / ◆ to be reviewed, drawn alike). Hold: "Contour drawn as supplied" and "As supplied · no conclusion drawn". No enforceability, validity, cap or amount.',
    tags: ['limitation clause', 'liability categories', 'exclusion', 'contour', 'reading glass', 'marker', 'desk', 'hands', 'contract', 'story'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/limitacion-contractual.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
