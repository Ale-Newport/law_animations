/**
 * LAW-0350 — Devolución para nuevo examen · mechanism
 *
 * Storyboard (an explanatory map of the return — not the story's desk: five component cards placed where they sit on
 * the supplied route — the folder with the decision of the initial examination (at the review desk), its slip of review
 * notes, the filter doors, the configured return point (its tray and plate) and the blank sheet of the renewed
 * examination (not shown, no outcome)):
 *  0.00–0.18  separate: the notes slip starts clipped on the folder card and slides out to its own card; the other
 *             components stand at their places on the route.
 *  0.18–0.43  draw only the supplied relationships, one after the other, anchored on the cards' edges (plain relations
 *             without arrowheads; the return itself is a supplied "sequence as configured" link).
 *  0.43–0.75  a tracer follows `traversalOrder`; the focus component enlarges while the tracer passes; when it reaches
 *             the return point a copy of the folder (with its notes) settles in that card's tray — the transformation.
 *  0.75–1.00  everything stays visible: origin (folder at the review desk), transformation (copy in the configured
 *             tray) and state (the renewed examination's blank sheet); key "as supplied · no conclusion drawn".
 * @module animations/review/LAW-0350
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {roundRectPath} from '../../core/geometry.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {tracer} from '../../primitives/annotate.js';
import {
  dnFields, DN_EN, DN_ES, localisedDn, resolveDn, folderArt, slipArt, slipSize, trayArt, matArt, doorArt, blankSheetArt, pinGlyph, chevron, LANE,
  panelLayout, panelNode, fitG, textAt, overlaps, dnIcon, INK, R2,
} from './kits/devolucion-nuevo-examen.js';

const ID = 'LAW-0350';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], hold: [0.75, 1]};
const W = {explode: [0.04, 0.16], relate: [0.18, 0.42], trace: [0.44, 0.74], copy: 0.035};
const IDS = ['folder', 'notes', 'doors', 'point', 'renewed'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  elements: [
    {id: 'folder', label: 'Folder at the review desk'},
    {id: 'notes', label: 'Review notes'},
    {id: 'doors', label: 'Filter doors'},
    {id: 'point', label: 'Configured return point'},
    {id: 'renewed', label: 'Renewed examination'},
  ],
  relationships: [
    {from: 'notes', to: 'folder', kind: 'relation', label: 'clipped to the folder'},
    {from: 'folder', to: 'doors', kind: 'sequence', label: 'return as configured (illustrative)'},
    {from: 'doors', to: 'point', kind: 'relation', label: 'open only here'},
    {from: 'point', to: 'renewed', kind: 'relation', label: 'not shown'},
  ],
  focusElement: 'doors',
  relationLabels: {relation: 'linked as supplied', communication: 'communication (as supplied)', sequence: 'sequence as configured (illustrative)', causal: 'causal link (supplied)'},
  traversalOrder: ['notes', 'folder', 'doors', 'point', 'renewed'],
};
const OWN_ES = {
  elements: [
    {id: 'folder', label: 'Carpeta en la mesa de revisión'},
    {id: 'notes', label: 'Notas de revisión'},
    {id: 'doors', label: 'Puertas filtro'},
    {id: 'point', label: 'Punto de devolución configurado'},
    {id: 'renewed', label: 'Examen renovado'},
  ],
  relationships: [
    {from: 'notes', to: 'folder', kind: 'relation', label: 'sujetas a la carpeta'},
    {from: 'folder', to: 'doors', kind: 'sequence', label: 'devolución configurada (ilustrativa)'},
    {from: 'doors', to: 'point', kind: 'relation', label: 'abiertas solo aquí'},
    {from: 'point', to: 'renewed', kind: 'relation', label: 'no se muestra'},
  ],
  focusElement: 'doors',
  relationLabels: {relation: 'vinculado según lo aportado', communication: 'comunicación (según lo aportado)', sequence: 'secuencia configurada (ilustrativa)', causal: 'vínculo causal (aportado)'},
  traversalOrder: ['notes', 'folder', 'doors', 'point', 'renewed'],
};
const EN = {...DN_EN, ...OWN_EN};
const ES = {...DN_ES, ...OWN_ES};

const sceneSchema = {
  ...dnFields,
  elements: list('Component captions; ids are fixed by the scene, captions are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 2, 5),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Optional caption of this relationship (otherwise the caption of its kind)', 60),
  }, ['from', 'to', 'kind']), 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption used for each relation kind', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links', 50),
    causal: str('Caption for supplied causal links', 50),
  }, ['relation', 'communication', 'sequence', 'causal']),
  traversalOrder: list('Order in which the tracer visits components (repeats allowed)', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {...EN};

/** Exploded-model positions per shape (fractions of the model area): assembled objects and where parts lift to. */
const MODEL = {
  landscape: {tray: [0.14, 0.56], mat: [0.8, 0.56], notes: [0.8, 0.15], renewed: [0.14, 0.15], doors: [0.47, 0.6], lane: 0.92, U: [5.6, 3.3]},
  square: {tray: [0.22, 0.58], mat: [0.76, 0.58], notes: [0.76, 0.15], renewed: [0.22, 0.15], doors: [0.5, 0.42], lane: 0.93, U: [3.9, 3.4]},
  portrait: {tray: [0.25, 0.47], mat: [0.75, 0.47], notes: [0.75, 0.13], renewed: [0.25, 0.13], doors: [0.5, 0.72], lane: 0.93, U: [3.6, 4.2]},
};

function compose(ctx, P, R, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const problems = [];
  // shared strip: route, supplied texts (keyed by icons), other points, footnoted relation captions, key
  const has = id => P.elements.some(e => e.id === id);
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'lane', text: P.labels.route, name: 'sh-route'});
  if (showKey && has('folder')) rows.push({kind: 'item', icon: 'folder', text: P.decisions.title, name: 'sh-title'});
  if (showKey && has('folder')) rows.push({kind: 'item', icon: 'mat', text: P.routes.origin, name: 'sh-origin'});
  if (showKey && has('notes')) R.notes.forEach((t, i) => rows.push({kind: 'item', icon: 'note', index: i, text: t, name: `sh-note${i}`}));
  if (showKey) rows.push({kind: 'item', icon: 'pin', text: `${P.routes.stations[R.target]}`, name: 'sh-target'});
  if (showKey) P.routes.stations.forEach((st, i) => { if (i !== R.target) rows.push({kind: 'item', icon: 'tray', text: st, name: `sh-st${i}`}); });
  if (showKey && has('renewed')) rows.push({kind: 'item', icon: 'blank', text: P.outcomes.renewed, name: 'sh-renewed'});
  if (showKey) rows.push({kind: 'item', icon: 'pin', text: P.labels.point, name: 'sh-point'});
  const relsF = P.relationships.filter(x => x.from !== x.to && has(x.from) && has(x.to));
  if (v.foot && showAll) relsF.forEach((x, i) => rows.push({kind: 'item', icon: 'num', index: i, text: x.label || P.relationLabels[x.kind] || x.kind, name: `sh-rel${i}`}));
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  let strip = null;
  if (rows.length) {
    const sc = v.sc, cg = F * 1.4, cw = (DW - cg * (sc - 1)) / sc, per = Math.ceil(rows.length / sc);
    const cols = [];
    for (let c = 0; c < sc; c++) {
      const part = rows.slice(c * per, (c + 1) * per);
      if (!part.length) continue;
      const PLc = panelLayout(ctx, part, {w: cw, F});
      if (!PLc.ok) problems.push('strip-text');
      cols.push({PL: PLc, x: c * (cw + cg)});
    }
    strip = {cols, h: Math.max(...cols.map(c => c.PL.h))};
  }
  const stripH = strip ? strip.h + F * 1.0 : 0;
  const A = {x: 0, y: 0, w: DW, h: DH - stripH};
  const Mo = MODEL[shape];
  const U = Math.min(A.w / Mo.U[0], A.h / Mo.U[1]) * v.scale;
  const fw = U * 1.15, fh = fw * 0.68;
  const tw = fw * 1.22, th = fh * 1.4;
  const mw = fw * 1.3, mh = th;
  const ss = fw * 0.5;
  const rw = fw * 0.6, rh = rw * 1.3;
  const dl = tw / 2, dt = Math.max(12, F * 0.75);
  const at = f => ({x: A.x + A.w * f[0], y: A.y + A.h * f[1]});
  const lab = id => {
    const t = (P.elements.find(e => e.id === id) || {}).label;
    return showKey && t ? fitG(t, {maxWidth: Math.max(F * 8, fw * 1.4), size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  };
  // object rectangles (the label chip sits above each object and belongs to its element box); rows stack top-down:
  // lifted parts (renewed sheet, notes) · tray and review mat · (tall frames: the doors) · the lane
  const obj = {};
  const mk = (id, w, h) => {
    const L = lab(id);
    const lh = L ? L.height + F * 0.7 : 0;
    const lw = L ? L.width + F * 0.6 : 0;
    if (L && !L.ok) problems.push('label-text');
    return {w, h, L, lh, bw: Math.max(w, lw), bh: h + lh};
  };
  const parts0 = {point: mk('point', tw, th), folder: mk('folder', mw, mh)};
  if (has('notes')) { const z = slipSize(R.notes.length, ss); parts0.notes = mk('notes', z.w, z.h); }
  if (has('renewed')) parts0.renewed = mk('renewed', rw, rh);
  if (has('doors')) parts0.doors = mk('doors', tw, dl + dt);
  const xT = A.x + A.w * Mo.tray[0], xM = A.x + A.w * Mo.mat[0];
  const doorsBelow = shape === 'portrait' || (shape === 'square' && !showKey);
  const gap = F * 1.6;
  const hTop = Math.max(parts0.notes ? parts0.notes.bh : 0, parts0.renewed ? parts0.renewed.bh : 0);
  const hMain = Math.max(parts0.point.bh, parts0.folder.bh, !doorsBelow && parts0.doors ? parts0.doors.bh : 0);
  const hDoors = doorsBelow && parts0.doors ? parts0.doors.bh + gap : 0;
  const laneH = fh * 0.5;
  const total = (hTop ? hTop + gap : 0) + hMain + hDoors + gap + laneH;
  if (total > A.h + 0.5) problems.push('model-tall');
  let y = A.y + Math.max(0, (A.h - total) / 2);
  const set = (id, x, yTop) => {
    const q = parts0[id];
    if (!q) return;
    const c = {x: clamp(x, A.x + q.bw / 2 + 4, A.x + A.w - q.bw / 2 - 4), y: yTop + q.lh + q.h / 2};
    obj[id] = {c, w: q.w, h: q.h, L: q.L, lh: q.lh, box: {x: c.x - q.bw / 2, y: yTop, w: q.bw, h: q.bh}};
  };
  if (hTop) { set('renewed', xT, y + hTop - (parts0.renewed ? parts0.renewed.bh : 0)); set('notes', xM, y + hTop - (parts0.notes ? parts0.notes.bh : 0)); y += hTop + gap; }
  set('point', xT, y + hMain - parts0.point.bh);
  set('folder', xM, y + hMain - parts0.folder.bh);
  if (!doorsBelow) set('doors', (xT + xM) / 2, y + hMain - (parts0.doors ? parts0.doors.bh : 0));
  y += hMain;
  if (doorsBelow && parts0.doors) { y += gap; set('doors', (xT + xM) / 2, y); y += parts0.doors.bh; }
  const trayC = obj.point.c, matC = obj.folder.c;
  const laneYv = y + gap + laneH / 2;
  // assembled positions: notes clipped on the folder, the renewed sheet in the tray, the doors at the tray mouth
  const assembled = {
    notes: {x: matC.x + fw * 0.3, y: matC.y - fh * 0.2},
    renewed: {x: trayC.x, y: trayC.y},
    doors: {x: trayC.x, y: trayC.y + th / 2 + (dl + dt) / 2 - dt / 2},
  };
  const els = Object.fromEntries(Object.entries(obj).filter(([k]) => has(k)).map(([k, o]) => [k, {box: o.box}]));
  const boxes = Object.values(els).map(e => e.box);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlaps(boxes[i], boxes[j], 14)) problems.push('parts-overlap');
  boxes.forEach(b => { if (b.x < -0.5 || b.y < -0.5 || b.x + b.w > DW + 0.5 || b.y + b.h > A.h + 0.5) problems.push('part-outside'); });
  const laneY = laneYv;
  if (problems.length && !v.force) return {ok: false, problems};
  const rels = relsF;
  const bend = [0.06, 0.2, -0.2, 0.4, -0.4, 0.7, -0.7];
  const bi = rels.map(() => 0);
  let graph = null;
  const crosses = gr => {
    const bad = new Set();
    gr.conns.forEach((c, ci) => {
      for (const [id, e] of Object.entries(els)) {
        if (id === c.rel.from || id === c.rel.to) continue;
        for (let kk = 1; kk < 24; kk++) { const q = c.c.at(kk / 24); if (q.x > e.box.x - 4 && q.x < e.box.x + e.box.w + 4 && q.y > e.box.y - 4 && q.y < e.box.y + e.box.h + 4) { bad.add(ci); break; } }
      }
    });
    return bad;
  };
  const gctx = v.foot ? {...ctx, show: lvl => (lvl === 'all' ? false : ctx.show(lvl))} : ctx;
  for (let pass = 0; pass < 7; pass++) {
    graph = relationGraph(gctx, {name: 'rel', elements: els, relationships: rels, relationLabels: P.relationLabels, bend: (rel, i) => bend[bi[i]], chipSize: F, chipMax: Math.max(F * 9, fw * 1.6), bounds: {x: 0, y: 0, w: DW, h: A.h}, separateLabels: true});
    const bad = crosses(graph);
    if (!bad.size) break;
    if (pass === 6) problems.push('conn-crosses');
    bad.forEach(i => { bi[i] = Math.min(6, bi[i] + 1); });
  }
  if (!v.foot && showAll && graph.conns.some(c => c.lab && !c.labelClear)) problems.push('label-overlap');
  if (!v.foot && showAll && graph.conns.some(c => c.lab && c.lab.fit && (c.lab.fit.size < F - 0.01 || c.lab.fit.truncated))) problems.push('label-shrunk');
  if (!v.foot && showAll && graph.conns.some(c => c.leader && Math.hypot(c.leader.x2 - c.leader.x1, c.leader.y2 - c.leader.y1) > F * 3)) problems.push('label-far');
  if (problems.length && !v.force) return {ok: false, problems};
  const foot = v.foot && showAll ? graph.conns.map((c, i) => ({i, at: c.c.at(0.5)})) : [];
  return {F, obj, els, assembled, graph, rels, foot, strip, stripY: DH - (strip ? strip.h : 0), A, fw, fh, tw, th, mw, mh, ss, rw, rh, dl, dt, laneY, trayC, matC, ok: !problems.length, problems};
}

function labelChip(ctx, o, name) {
  if (!o.L) return null;
  const F = o.L.size;
  const x = o.c.x - o.L.width / 2, y = o.c.y - o.h / 2 - o.lh + F * 0.2;
  return g({name},
    h('path', {d: roundRectPath(x - F * 0.3, y - F * 0.15, o.L.width + F * 0.6, o.L.height + F * 0.3, 8), fill: '#fffdf6', stroke: INK, 'stroke-width': 1.8}),
    textAt(o.L, {x, y, fill: INK, anchor: 'start'}));
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedDn(ctx, EN, ES);
    const R = resolveDn(P);
    const shape = ctx.view.shape;
    const sc0 = shape === 'landscape' ? 3 : 2;
    const base = [1.5, 1.3, 1.15, 1, 0.92, 0.85, 0.78, 0.7, 0.63, 0.56].flatMap(scale => [{scale, sc: sc0}, {scale, sc: sc0 === 3 ? 4 : 3}]);
    const vs = [...base, ...base.map(v => ({...v, foot: true}))];
    const sizes = !ctx.show('key') ? [30, 26, ...SIZES] : SIZES;
    let C = null, best = null;
    outer: for (const F of sizes) for (const v of vs) {
      const c = compose(ctx, P, R, F, v);
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.n) best = {n: c.problems.length, F, v};
    }
    if (!C) C = compose(ctx, P, R, best.F, {...best.v, force: true});
    const route = C.graph.route(P.traversalOrder.filter(id => C.els[id]));
    return {P, R, C, route};
  },
  build(ctx, L) {
    const {C, R} = L;
    const th = ctx.theme;
    const O = C.obj;
    const lane = g(null,
      h('path', {d: roundRectPath(C.trayC.x - C.fh * 0.25, C.laneY - C.fh * 0.25, C.matC.x - C.trayC.x + C.fh * 0.5, C.fh * 0.5, C.fh * 0.25), fill: LANE, stroke: INK, 'stroke-width': 2}),
      h('rect', {x: r(C.trayC.x - C.fh * 0.25), y: r(C.trayC.y + C.th / 2 - 4), width: r(C.fh * 0.5), height: r(C.laneY - C.trayC.y - C.th / 2 + 4), fill: LANE}),
      h('rect', {x: r(C.matC.x - C.fh * 0.25), y: r(C.matC.y + C.mh / 2 - 4), width: r(C.fh * 0.5), height: r(C.laneY - C.matC.y - C.mh / 2 + 4), fill: LANE}),
      [0.3, 0.5, 0.7].map(f => g({transform: T(C.trayC.x + (C.matC.x - C.trayC.x) * f, C.laneY, 180)}, chevron(C.fh * 0.3))),
    );
    const parts = [];
    // the tray (configured point) with its plate pin; the review mat with the folder
    parts.push(g({name: 'el-point'}, g({transform: T(C.trayC.x - C.tw / 2, C.trayC.y - C.th / 2)}, trayArt(ctx, {w: C.tw, h: C.th, mouth: 'bottom'})),
      g({transform: T(C.trayC.x - C.tw / 2 + C.F * 0.9, C.trayC.y - C.th / 2 + C.F * 0.9)}, pinGlyph(ctx, C.F * 0.6)), labelChip(ctx, O.point, 'lab-point')));
    parts.push(g({name: 'el-folder'}, g({transform: T(C.matC.x - C.mw / 2, C.matC.y - C.mh / 2)}, matArt(ctx, {w: C.mw, h: C.mh})),
      g({name: 'folder-art', transform: T(C.matC.x, C.matC.y)}, folderArt(ctx, {w: C.fw, h: C.fh})), labelChip(ctx, O.folder, 'lab-folder')));
    if (O.doors) {
      const half = (k, x, ang) => g({transform: T(x, 0, ang)}, doorArt(ctx, {len: C.dl, t: C.dt}));
      parts.push(g({name: 'el-doors'}, g({name: 'pos-doors'},
        g({transform: T(0, -(C.dl + C.dt) / 2 + C.dt / 2)}, half(0, -C.tw / 2, 55), half(1, C.tw / 2, 125)),
      ), labelChip(ctx, {...O.doors, c: O.doors.c}, 'lab-doors')));
    }
    if (O.notes) parts.push(g({name: 'el-notes'}, g({name: 'pos-notes'}, slipArt(ctx, {n: R.notes.length, s: C.ss}).node), labelChip(ctx, O.notes, 'lab-notes')));
    if (O.renewed) parts.push(g({name: 'el-renewed'}, g({name: 'pos-renewed'}, g({transform: T(-C.rw / 2, -C.rh / 2)}, blankSheetArt(ctx, {w: C.rw, h: C.rh}))), labelChip(ctx, O.renewed, 'lab-renewed')));
    // assembly guides: thin lines from where each part sat to where it lifted to
    const guides = ['notes', 'renewed', 'doors'].filter(id => O[id]).map(id => h('line', {name: `guide-${id}`, x1: r(C.assembled[id].x), y1: r(C.assembled[id].y), x2: r(O[id].c.x), y2: r(O[id].c.y), stroke: th.fgSoft, 'stroke-width': 2, 'stroke-dasharray': '3 6', opacity: 0}));
    const copy = g({name: 'copy', opacity: 0, transform: T(C.trayC.x, C.trayC.y)}, folderArt(ctx, {w: C.fw, h: C.fh}), g({transform: T(C.fw * 0.3, -C.fh * 0.2)}, slipArt(ctx, {n: R.notes.length, s: C.ss * 0.6}).node));
    return g({name: 'scene'},
      lane, guides, C.graph.node, tracer(ctx, 'tracer', th.accent2), parts, copy, C.graph.labelsNode,
      C.foot.map(f => g({name: `foot${f.i}`, opacity: 0, transform: T(f.at.x, f.at.y)}, dnIcon(ctx, 'num', C.F * 1.2, {index: f.i, F: C.F, color: kindColor(ctx, C.rels[f.i].kind)}))),
      C.strip ? g({name: 'strip', transform: T(0, C.stripY)}, C.strip.cols.map(col => g({transform: T(col.x, 0)}, panelNode(ctx, col.PL)))) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, C, route} = L;
    const O = C.obj;
    const nodes = {};
    const kEx = ease.inOutCubic(seg(u, ...W.explode));
    const posOf = id => ({x: lerp(C.assembled[id].x, O[id].c.x, kEx), y: lerp(C.assembled[id].y, O[id].c.y, kEx)});
    for (const id of ['notes', 'renewed', 'doors']) if (O[id]) {
      const p = posOf(id);
      nodes[`pos-${id}`] = {transform: T(p.x, p.y)};
      if (O[id].L) nodes[`lab-${id}`] = {opacity: kEx >= 0.98 ? 1 : 0};
      nodes[`guide-${id}`] = {opacity: r(clamp((kEx - 0.3) / 0.7) * 0.8, 3)};
    }
    const tr = seg(u, ...W.trace);
    const kt = ease.inOutSine(tr);
    const tp = route.poly.at(kt);
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: tr > 0 && tr < 1 ? 1 : 0};
    const near = id => {
      let best = 0;
      for (const vv of route.visits) if (vv.id === id) best = Math.max(best, 1 - clamp(Math.abs(kt - vv.t) / 0.12));
      return tr > 0 && tr < 1 ? ease.inOutSine(best) : 0;
    };
    const fe = P.focusElement;
    const grow = C.els[fe] ? near(fe) : 0;
    for (const id of Object.keys(C.els)) {
      const b = C.els[id].box;
      const s = id === fe ? 1 + 0.06 * grow : 1;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      nodes[`el-${id}`] = {transform: `${T(cx, cy, 0, s)} translate(${r(-cx)} ${r(-cy)})`};
    }
    const vPoint = route.visits.find(vv => vv.id === 'point');
    const kc = vPoint ? clamp((kt - (vPoint.t - 0.03)) / W.copy) * (tr > 0 ? 1 : 0) : 0;
    const kCopy = u >= W.trace[1] ? (vPoint ? 1 : 0) : kc;
    nodes.copy = {opacity: r(kCopy, 3)};
    // one folder at a time: the source on the review mat fades to a faint ghost as the copy settles in the tray
    nodes['folder-art'] = {opacity: r(1 - 0.8 * kCopy, 3)};
    const n = Math.max(1, C.rels.length);
    const relP = i => ease.inOutCubic(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 1) * (W.relate[1] - W.relate[0])) / n));
    Object.assign(nodes, C.graph.frame(relP));
    for (const f of C.foot) nodes[`foot${f.i}`] = {opacity: r(clamp((relP(f.i) - 0.55) / 0.45), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'hold';
    return {
      nodes,
      semantic: {
        beat,
        notesCard: O.notes ? R2(posOf('notes')) : null,
        doorsPos: O.doors ? R2(posOf('doors')) : null,
        tracer: tr > 0 && tr < 1 ? R2(tp) : null,
        traceK: r(kt, 3),
        visits: route.visits.map(vv => ({id: vv.id, t: r(vv.t, 3)})),
        reached: route.visits.filter(vv => kt >= vv.t - 1e-6).map(vv => vv.id),
        connectors: C.graph.conns.map((x, i) => ({from: x.rel.from, to: x.rel.to, kind: x.rel.kind, a: R2(x.c.from), b: R2(x.c.to), drawn: r(relP(i), 3), arrow: x.rel.kind !== 'relation'})),
        boxes: Object.fromEntries(Object.entries(C.els).map(([k, e]) => [k, {x: r(e.box.x), y: r(e.box.y), w: r(e.box.w), h: r(e.box.h)}])),
        focus: fe, focusScale: r(1 + 0.06 * grow, 4), exploded: r(kEx, 3), copy: r(kCopy, 3),
        problems: C.problems, textPx: r(C.F, 1),
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
    slug: 'review-08-mechanism',
    title: 'Return for a new examination — map of the return: folder, notes, filter doors, configured point and the blank renewed examination, linked only as supplied',
    titleEs: 'Devolución para nuevo examen — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Devolución para nuevo examen',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An explanatory map of the return. Five component cards stand where they sit on the supplied route: the folder with the decision of the initial examination at the review desk, its review notes (which slide out of the folder card), the filter doors, the configured return point and the blank sheet of the renewed examination. Only the supplied relationships are drawn, anchored on card edges (plain relations without arrowheads; the return is a supplied sequence link captioned as configured and illustrative). A tracer follows the supplied order, the focus card enlarges, and a copy of the folder with its notes settles in the configured tray. No result of the renewed examination; jurisdiction unspecified.',
    tags: ['review', 'return for a new examination', 'mechanism', 'relations', 'tracer', 'folder', 'review notes', 'filter doors', 'return point', 'renewed examination'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/devolucion-nuevo-examen.js', 'src/animations/review/kits/limites-de-revision.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
