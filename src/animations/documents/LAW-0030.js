/**
 * LAW-0030 — Cadena de versiones · mechanism
 *
 * Storyboard (exploded zig-zag chain, not a row of boxes):
 *  0.00–0.18  separate: the filed chain sits large in the middle of the frame
 *             (copies shingled on the file, tab on the selected copy); the
 *             copies leave it newest first, each to its own slot on two
 *             alternating lanes (the “links” of the chain), the file moves to
 *             its slot, the tab lifts off the selected copy to its own slot and
 *             the pen appears beyond it. The selected copy’s band keeps a
 *             dashed in-band slot where the tab’s adhesive end sat.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             anchored to the elements’ real edges; style by kind (sequence
 *             arrows between successive copies, plain relations without
 *             arrows; causal only when supplied). The legend arrives with them.
 *             A label that would hide most of a short link sits beside it.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order; every
 *             element it reaches pulses, the focus element enlarges most and
 *             keeps a held emphasis ring. When the tracer reaches the tab, the
 *             tab slot on the selected copy lights up (slot empty → identified).
 *  0.75–1.00  gather: everything stays in place; descriptive tags name the
 *             selected copy and the previous one; legend of connection kinds.
 * @module animations/documents/LAW-0030
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {documentsFields, mechanismFields} from '../../schemas/fields.js';
import {statusTag} from '../../primitives/annotate.js';
import {pen, shade} from '../../primitives/paper.js';
import {iconBadge} from '../../primitives/badges.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {versionSheet, versionFields, versionIndex, chooseBand, indexTab, versionFolder, tightChip, TAB_COLOR} from './kits/cadena-de-versiones.js';

const ID = 'LAW-0030';
const DURATION = 7000;
const IDS = ['copy1', 'copy2', 'copy3', 'copy4', 'copy5', 'tab', 'folder', 'pen'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const STRINGS = {
  en: {selectedTag: 'Selected', previousTag: 'Previous'},
  es: {selectedTag: 'Seleccionada', previousTag: 'Anterior'},
};

const sceneSchema = {
  ...documentsFields,
  ...versionFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'DOC-311',
  documentTitle: 'Supply Agreement',
  clauses: ['Scope of supply', 'Prices (hypothetical)', 'Delivery schedule'],
  signers: [{name: 'Lena Ortiz', role: 'Clerk'}, {name: 'Kofi Mensah', role: 'Reviewer'}],
  redactions: [],
  versions: [
    {id: 'v1', date: 'Day 2'},
    {id: 'v2', date: 'Day 5'},
    {id: 'v3', date: 'Day 9'},
    {id: 'v4', date: 'Day 12'},
  ],
  selectedVersion: 'v4',
  elements: [
    {id: 'copy1', label: 'First copy'},
    {id: 'copy2', label: 'Second copy'},
    {id: 'copy3', label: 'Previous version'},
    {id: 'copy4', label: 'Selected version'},
    {id: 'tab', label: 'Index tab'},
    {id: 'folder', label: 'Version file'},
    {id: 'pen', label: 'Pen'},
  ],
  relationships: [
    {from: 'folder', to: 'copy1', kind: 'relation', label: 'holds the chain'},
    {from: 'copy1', to: 'copy2', kind: 'sequence', label: 'next'},
    {from: 'copy2', to: 'copy3', kind: 'sequence', label: 'next'},
    {from: 'copy3', to: 'copy4', kind: 'sequence', label: 'next'},
    {from: 'tab', to: 'copy4', kind: 'relation', label: 'identifies'},
    {from: 'pen', to: 'tab', kind: 'relation', label: 'ticks'},
  ],
  focusElement: 'tab',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['folder', 'copy1', 'copy2', 'copy3', 'copy4', 'tab'],
};

/**
 * Geometry per shape. 'rows' (landscape): copies alternate bottom/top lane
 * while advancing right; the tab sits in the free slot of the other lane and
 * the pen further out on that side (vertical links). 'cols' (square,
 * portrait): copies alternate left/right column while advancing down; the
 * pen sits beyond the tab on the column's outer side (horizontal links).
 * The composition is built in its own units, measured, then fitted into the
 * design box, so it spreads to the available shape instead of letterboxing.
 */
const SHAPES = {
  landscape: {mode: 'rows', sheet: [320, 300], sheet5: [290, 280], cap: 30, rel: 28, tag: 26, legend: 30, penGap: 150, sep: 440, tabScale: 1.8},
  square: {mode: 'cols', sheet: [290, 220], sheet5: [270, 210], cap: 32, rel: 30, tag: 28, legend: 30, penGap: 124, tabScale: 1.7},
  portrait: {mode: 'cols', sheet: [300, 260], sheet5: [290, 230], cap: 30, rel: 28, tag: 26, legend: 30, penGap: 150, tabScale: 1.8, penBelowLast: true},
};
const PEN_R = 60;
const FOLDER_TAB = 28;
/** in-band slot at the right end of the header band, where the tab's adhesive end sits */
const SLOT = {w: 36, inset: 4};
const RESERVE = SLOT.w + SLOT.inset + 6;
/** separation window of copy k: the newest copy (top of the chain) peels off first */
const sepWindow = (k, N) => {
  const j = N - 1 - k;
  return [0.02 + j * 0.016, 0.1 + j * 0.016];
};
/** the tab lifts off its copy's band while that copy travels, and settles in its own slot */
const liftWindow = (k, N) => [sepWindow(k, N)[0] + 0.03, Math.min(sepWindow(k, N)[0] + 0.13, 0.19)];
/** the file moves from the centre of the frame to its own slot while the copies leave it */
const FOLDER_MOVE = [0.05, 0.16];

const boxOf = (c, w, hh) => ({x: c.x - w / 2, y: c.y - hh / 2, w, h: hh});
const unionBox = boxes => {
  const bs = boxes.filter(Boolean);
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y));
  const x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};
const circleBox = c => ({x: c.x - c.r, y: c.y - c.r, w: c.r * 2, h: c.r * 2});

const scene = {
  sizes: {landscape: [2200, 1090], square: [1400, 1340], portrait: [960, 1740]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const SH = SHAPES[ctx.view.shape];
    const rows = SH.mode === 'rows';
    const N = p.versions.length;
    const sel = versionIndex(p.versions, p.selectedVersion);
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const showKey = ctx.show('key');
    const TS = SH.tabScale;
    const [sw, sh0] = N >= 5 ? SH.sheet5 : SH.sheet;
    const bandMode = chooseBand(ctx, {versions: p.versions, w: sw, band: 54, reserveRight: RESERVE});
    const band = bandMode.band;
    const sh = Math.max(sh0, band + 150);
    const fw = Math.round(sw * 0.82), fb = Math.round(sh * 0.78), fh = fb + FOLDER_TAB;
    const tabW = (38 + 84) * TS, tabH = 40 * TS;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};

    // --- caption sizes decide the spacing
    const capMax = id => (id === 'pen' ? 300 : id === 'tab' ? Math.max(tabW + 60, 290) : id === 'folder' ? Math.max(fw + 90, 270) : Math.max(sw + 90, 270));
    const P = {};
    ['folder', 'tab', 'pen', ...p.versions.map((_, k) => `copy${k + 1}`)].forEach(id => {
      P[id] = label(id) && showKey ? tightChip(ctx, label(id), {x: 0, y: 0, maxWidth: capMax(id), size: SH.cap, maxLines: 2}).box : {w: 0, h: 0};
    });
    const capH = id => (P[id].h ? P[id].h + 12 : 0);
    const capW = id => P[id].w;
    // the focus element gets a held emphasis ring; its caption keeps clear of it
    const ring = id => (p.focusElement === id ? 18 : 0);
    const maxOf = arr => (arr.length ? Math.max(...arr) : 0);
    const laneOf = k => k % 2;
    const TL = 1 - laneOf(sel); // lane (rows) / column (cols) of the tab and the pen
    const fSlot = sel === 0 ? -1 : 0; // the file sits opposite the first copy (one step earlier if the tab needs that slot)
    const sMin = Math.min(fSlot, 0);
    const nSlots = N - sMin;
    const copiesIn = lane => p.versions.map((_, k) => k).filter(k => laneOf(k) === lane);
    const legendH = ctx.show('all') ? SH.legend * 1.4 + 44 : 0;
    const ratio = ctx.design.w / ctx.design.h;
    const penOff = (rows ? tabH : tabW) / 2 + 8 + SH.penGap + 8 + PEN_R; // tab centre → pen centre

    let copyC, folderC, tabC, penC, capPos;
    if (rows) {
      // lane 0 = bottom, lane 1 = top; captions on each lane's outer side.
      // The pen sits beside the tab when the tab is the last in its lane,
      // otherwise further out on the tab's outer side (vertical link).
      const out = TL === 0 ? 1 : -1;
      const beside = sel === N - 1 && N > 1;
      const penDX = tabW / 2 + 8 + SH.penGap + 40 + 8 + PEN_R;
      const penOut = beside
        ? Math.max(tabH / 2 + 10 + ring('tab') + capH('tab'), PEN_R + ring('pen') + capH('pen'))
        : tabH / 2 + 8 + SH.penGap + 8 + 2 * PEN_R + capH('pen') + ring('pen');
      const extTop = Math.max(sh / 2 + maxOf(copiesIn(1).map(k => capH(`copy${k + 1}`) + ring(`copy${k + 1}`))), fh / 2 + capH('folder') + ring('folder'), TL === 1 ? penOut : 0);
      const extBot = Math.max(sh / 2 + maxOf(copiesIn(0).map(k => capH(`copy${k + 1}`) + ring(`copy${k + 1}`))), TL === 0 ? penOut : 0);
      const Hn = extTop + SH.sep + extBot + legendH + 40;
      const mL = Math.max(sw, fw, capW('copy1'), capW('folder')) / 2 + 24;
      const mR = beside
        ? Math.max(Math.max(sw, capW(`copy${N}`)) / 2, penDX + Math.max(PEN_R, capW('pen') / 2)) + 24
        : Math.max(Math.max(sw, capW(`copy${N}`)) / 2, sel === N - 1 ? 18 + capW('tab') : 0, capW('pen') / 2) + 24;
      // the tab's caption keeps clear of the neighbouring copies' captions in its lane
      const stepMin = Math.max(sw + 120, (fw + sw) / 2 + 90,
        beside ? (capW(`copy${sel}`) + capW('tab')) / 2 + 24 : 18 + capW('tab') + sw / 2 + 18);
      const step = clamp((Hn * ratio - mL - mR) / Math.max(1, nSlots - 1), stepMin, sw + 380);
      const X = s => mL + (s - sMin) * step;
      const yTop = extTop + 20, yBot = yTop + SH.sep;
      const laneY = lane => (lane ? yTop : yBot);
      copyC = k => ({x: X(k), y: laneY(laneOf(k))});
      folderC = {x: X(fSlot), y: yTop};
      tabC = {x: X(sel), y: laneY(TL)};
      penC = beside ? {x: tabC.x + penDX, y: tabC.y} : {x: tabC.x, y: tabC.y + out * penOff};
      const outerY = (b, pb, gap) => (out > 0 ? b.y + b.h + gap : b.y - gap - pb.h);
      capPos = {
        copy: (k, b, pb) => {
          const gap = 12 + ring(`copy${k + 1}`);
          return {x: b.x + b.w / 2, anchor: 'middle', y: laneOf(k) ? b.y - gap - pb.h : b.y + b.h + gap};
        },
        folder: (b, pb) => ({x: b.x + b.w / 2, anchor: 'middle', y: b.y - 12 - ring('folder') - pb.h}),
        // outer side of the tab: centred (pen beside) or just right of the pen link (its label goes left of the link)
        tab: (b, pb) => (beside
          ? {x: tabC.x, anchor: 'middle', y: outerY(b, pb, 10 + ring('tab'))}
          : {x: tabC.x + 18 + ring('tab') * 0.5, anchor: 'start', y: outerY(b, pb, 10 + ring('tab'))}),
        pen: (c, pb) => ({x: c.x, anchor: 'middle', y: outerY(circleBox({...c, r: PEN_R}), pb, 12 + ring('pen'))}),
      };
    } else {
      // column 0 = left, column 1 = right; the pen sits beyond the tab on its
      // column's outer side, or (narrow boxes, tab in the last row) below it
      const out = TL === 0 ? -1 : 1;
      const below = SH.penBelowLast && sel === N - 1;
      const penDY = tabH / 2 + 8 + SH.penGap + 8 + PEN_R;
      const outerTab = below ? Math.max(tabW / 2, 18 + ring('tab') + capW('tab'), capW('pen') / 2) + 24 : penOff + Math.max(PEN_R, capW('pen') / 2) + 24;
      const colHalf = col => Math.max(sw, ...copiesIn(col).map(k => capW(`copy${k + 1}`)), col === 1 ? Math.max(fw, capW('folder')) : 0, col === TL ? Math.max(tabW, capW('tab')) : 0) / 2 + 24;
      const mL = TL === 0 ? Math.max(outerTab, colHalf(0)) : colHalf(0);
      const mR = TL === 1 ? Math.max(outerTab, colHalf(1)) : colHalf(1);
      // row spacing: the tab and its caption fit between the copies above and below it in its column
      const dMin = Math.max(
        sh * 0.8,
        sel > 0 ? sh / 2 + capH(`copy${sel}`) + ring(`copy${sel}`) + 18 + tabH / 2 + ring('tab') : 0,
        sel < N - 1 ? tabH / 2 + 10 + ring('tab') + capH('tab') + 18 + ring(`copy${sel + 2}`) + sh / 2 : 0,
        (sh + maxOf(p.versions.map((_, k) => capH(`copy${k + 1}`))) + 30) / 2,
        fh / 2 + Math.max(sh, tabH) / 2 + 36,
      );
      const extTop = Math.max(sh / 2 + ring('copy1'), fh / 2 + capH('folder') + ring('folder'));
      const tabBelow = below
        ? Math.max(tabH / 2 + 10 + ring('tab') + capH('tab'), penDY + PEN_R + 12 + ring('pen') + capH('pen'))
        : Math.max(tabH / 2 + 10 + capH('tab') + ring('tab'), PEN_R + capH('pen') + ring('pen'));
      const extBot = Math.max(sh / 2 + capH(`copy${N}`) + ring(`copy${N}`), sel === N - 1 ? tabBelow : 0);
      const sepMin = sw + 230;
      const Hfix = extTop + extBot + legendH + 40;
      const Wmin = mL + sepMin + mR;
      let d = dMin, sep = sepMin;
      if (Wmin / (Hfix + (nSlots - 1) * dMin) > ratio) d = clamp((Wmin / ratio - Hfix) / Math.max(1, nSlots - 1), dMin, dMin * 1.8);
      else sep = clamp((Hfix + (nSlots - 1) * dMin) * ratio - mL - mR, sepMin, sw + 900);
      const colX = col => (col ? mL + sep : mL);
      const Y = row => extTop + 20 + (row - sMin) * d;
      copyC = k => ({x: colX(laneOf(k)), y: Y(k)});
      folderC = {x: colX(1), y: Y(fSlot)};
      tabC = {x: colX(TL), y: Y(sel)};
      penC = below ? {x: tabC.x, y: tabC.y + penDY} : {x: tabC.x + out * penOff, y: tabC.y};
      capPos = {
        copy: (k, b) => ({x: b.x + b.w / 2, anchor: 'middle', y: b.y + b.h + 12 + ring(`copy${k + 1}`)}),
        folder: (b, pb) => ({x: b.x + b.w / 2, anchor: 'middle', y: b.y - 12 - ring('folder') - pb.h}),
        // below the tab; with the pen below as well, on the outer side of the pen link
        tab: b => (below
          ? {x: tabC.x + out * (18 + ring('tab') * 0.5), anchor: out > 0 ? 'start' : 'end', y: b.y + b.h + 10 + ring('tab')}
          : {x: b.x + b.w / 2, anchor: 'middle', y: b.y + b.h + 10 + ring('tab')}),
        pen: c => ({x: c.x, anchor: 'middle', y: c.y + PEN_R + 12 + ring('pen')}),
      };
    }

    // --- elements
    const copies = p.versions.map((v, k) => {
      const c = copyC(k);
      const spec = versionSheet(ctx, {prefix: `cp${k}`, w: sw, h: sh, band, version: v, index: k, doc, lineSeed: `ver-${k}`, reserveRight: RESERVE, rows: bandMode.rows, bodyText: false});
      return {k, c, spec, box: boxOf(c, sw, sh)};
    });
    const folderBox = boxOf(folderC, fw, fh);
    const tabBox = boxOf(tabC, tabW, tabH);
    const tab = indexTab(ctx, {name: 'tabx', h: 40, overlap: 38, protrude: 84});
    const folder = versionFolder(ctx, {w: fw, h: fb, label: '', tabH: FOLDER_TAB});
    const penIcon = pen(ctx, {name: 'pen-icon', length: 140, body: th.accent2}).node;
    const penB = iconBadge(ctx, {name: 'el-pen', x: penC.x, y: penC.y, radius: PEN_R, icon: g({transform: T(-40, 34, -48)}, g({transform: 'scale(0.85)'}, penIcon)), label: ''});

    // --- captions
    const labels = [];
    const mk = (id, pos) => {
      if (!P[id].h) return null;
      const c = tightChip(ctx, label(id), {...pos, maxWidth: capMax(id), size: SH.cap, maxLines: 2, name: `lab-${id}`});
      labels.push(c);
      return c;
    };
    copies.forEach(cp => { cp.cap = mk(`copy${cp.k + 1}`, capPos.copy(cp.k, cp.box, P[`copy${cp.k + 1}`])); });
    const capFolder = mk('folder', capPos.folder(folderBox, P.folder));
    const capTab = mk('tab', capPos.tab(tabBox, P.tab));
    const capPen = mk('pen', capPos.pen(penC, P.pen));

    // --- relation graph: connectors anchored to real edges
    const elements = {tab: {box: tabBox}, folder: {box: folderBox}, pen: {circle: penB.circle}};
    copies.forEach(cp => { elements[`copy${cp.k + 1}`] = {box: cp.box}; });
    const rels = p.relationships.filter(x => elements[x.from] && elements[x.to]);
    const order = p.traversalOrder.filter(id => elements[id]);
    const elBoxes = Object.values(elements).map(e => (e.circle ? circleBox(e.circle) : e.box));
    const content0 = unionBox([...elBoxes, ...labels.map(c => c.box)]);
    const bounds = {x: content0.x - 80, y: content0.y - 50, w: content0.w + 160, h: content0.h + 70};
    const gOpts = {name: 'rel', elements, relationships: rels, relationLabels: p.relationLabels, chipSize: SH.rel, chipMax: rows ? 340 : 290, separateLabels: true, bounds,
      bend: rel => (rel.kind === 'sequence' ? 0.06 : 0.1)};
    const capBoxes = labels.map(c => c.box);
    const first = relationGraph(ctx, {...gOpts, obstacles: capBoxes});
    // a label that would hide most of a short link (> 45 % of its length) is placed beside it instead of on it
    const lineBoxes = [];
    first.conns.forEach(x => {
      if (!x.lab) return;
      const dx = x.c.to.x - x.c.from.x, dy = x.c.to.y - x.c.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const along = (Math.abs(dx) * x.lab.box.w + Math.abs(dy) * x.lab.box.h) / len;
      if (along / x.c.total <= 0.45) return;
      const n = Math.max(2, Math.ceil(x.c.total / 12));
      for (let i = 0; i <= n; i++) {
        const q = x.c.at(0.03 + (0.94 * i) / n);
        lineBoxes.push({x: q.x - 5, y: q.y - 5, w: 10, h: 10});
      }
    });
    const graph = lineBoxes.length ? relationGraph(ctx, {...gOpts, obstacles: [...capBoxes, ...lineBoxes]}) : first;
    const route = graph.route(order);
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));
    const relLabelBoxes = graph.conns.map(x => x.lab && x.lab.box).filter(Boolean);
    const content = unionBox([content0, ...relLabelBoxes]);

    // --- legend: connection kinds actually used, below everything
    const kinds = [...new Set(rels.map(x => x.kind))];
    const legend = ctx.show('all') && kinds.length ? legendNode(ctx, kinds, p.relationLabels, {x: content.x + content.w / 2, y: content.y + content.h + 22 + SH.legend * 0.7}, SH.legend) : null;

    // --- descriptive end tags inside the copies' (schematic) bodies
    const tagIn = (k, text, color, name) => {
      if (!showKey || k < 0 || k >= N) return null;
      return statusTag(ctx, text, {x: sw / 2, y: band + (sh - band) * 0.5 - SH.tag * 0.875, anchor: 'middle', size: SH.tag, maxWidth: sw - 24, name, color, opacity: 0});
    };
    const tagSel = tagIn(sel, ctx.t.selectedTag, shade(TAB_COLOR, -0.45), 'tag-selected');
    const tagPrev = tagIn(sel - 1, ctx.t.previousTag, th.inkSoft, 'tag-previous');

    // --- focus element: held emphasis ring (drawn around the element at rest)
    let focus = null;
    const fid = p.focusElement;
    if (fid && elements[fid]) {
      const e = elements[fid];
      const c = e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2};
      const ringStyle = {fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': '14 9', 'stroke-linecap': 'round'};
      const shape = e.circle ? h('circle', {r: e.circle.r + 14, ...ringStyle}) : h('path', {d: roundRectPath(-e.box.w / 2 - 14, -e.box.h / 2 - 14, e.box.w + 28, e.box.h + 28, 16), ...ringStyle});
      focus = {id: fid, c, node: g({name: 'focus-ring', opacity: 0, transform: T(c.x, c.y)}, shape)};
    }

    // --- fit the whole composition into the design box
    const all = unionBox([content, legend && legend.box]);
    const pad = 18;
    const s = Math.min(ctx.design.w / (all.w + pad * 2), ctx.design.h / (all.h + pad * 2));
    const ox = (ctx.design.w - all.w * s) / 2 - all.x * s;
    const oy = (ctx.design.h - all.h * s) / 2 - all.y * s;

    // --- opening: the filed chain sits large, in the middle, before it comes apart
    const mid = {x: content.x + content.w / 2, y: content.y + content.h / 2};
    const fS = clamp((content.h * 0.5) / (fh + 30), 1.1, 1.8);
    const q = Math.min((0.8 * fw) / sw, (fb - 34) / (sh + (N - 1) * band));
    const P0 = {x: mid.x - (fw * fS) / 2, y: mid.y - (fh * fS) / 2 + FOLDER_TAB * fS};
    const P1 = {x: folderBox.x, y: folderBox.y + FOLDER_TAB};
    const onFolder = (k, at, f) => ({x: at.x + (fw / 2 + (k - (N - 1) / 2) * 5) * f, y: at.y + (16 + (sh * q) / 2 + k * band * q) * f, s: q * f});

    return {s, ox, oy, N, sel, band, sw, sh, fw, fb, TS, tabW, tabH, copies, tab, tabBox, tabC, folder, folderBox, penB, graph, route, visitT, rels, elements,
      labels, capFolder, capTab, capPen, legend, tagSel, tagPrev, focus, P0, P1, fS, onFolder};
  },
  build(ctx, L) {
    const th = ctx.theme;
    // in-band slot on the selected copy where the tab's adhesive end belongs
    const slot = h('path', {name: 'tab-slot', d: roundRectPath(L.sw - SLOT.inset - SLOT.w, L.band / 2 - L.band * 0.36, SLOT.w, L.band * 0.72, 6), fill: TAB_COLOR, 'fill-opacity': 0.25, stroke: shade(TAB_COLOR, -0.4), 'stroke-width': 3, 'stroke-dasharray': '7 5', opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      g({name: 'el-folder', transform: T(L.P0.x, L.P0.y, 0, L.fS)}, g({name: 'el-folder-body'}, L.folder.node)),
      L.penB.node,
      L.copies.map(cp => g({name: `el-copy${cp.k + 1}`}, g({name: `el-copy${cp.k + 1}-body`}, g({transform: T(-L.sw / 2, -L.sh / 2)},
        cp.spec.node,
        cp.k === L.sel ? slot : null,
        cp.k === L.sel && L.tagSel ? L.tagSel.node : null,
        cp.k === L.sel - 1 && L.tagPrev ? L.tagPrev.node : null)))),
      g({name: 'el-tab'}, g({name: 'el-tab-body'}, L.tab.node)),
      L.focus && L.focus.node,
      L.labels.map(c => c.node),
      L.graph.labelsNode,
      L.graph.tracerNode('tracer'),
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    const N = L.N;
    // 1) separate: the file carries the chain from the middle to its slot while
    //    the copies leave it, newest first, each to its own link position
    const fe = ease.inOutCubic(seg(u, ...FOLDER_MOVE));
    const fAt = {x: lerp(L.P0.x, L.P1.x, fe), y: lerp(L.P0.y, L.P1.y, fe)};
    const fScale = lerp(L.fS, 1, fe);
    nodes['el-folder'] = {transform: T(fAt.x, fAt.y, 0, fScale)};
    const copyPos = [];
    const copyScale = [];
    L.copies.forEach(cp => {
      const e = ease.inOutSine(seg(u, ...sepWindow(cp.k, N)));
      const a = L.onFolder(cp.k, fAt, fScale);
      const pos = {x: lerp(a.x, cp.c.x, e), y: lerp(a.y, cp.c.y, e)};
      const sc = lerp(a.s, 1, e);
      copyPos.push(pos);
      copyScale.push(sc);
      nodes[`el-copy${cp.k + 1}`] = {transform: T(pos.x, pos.y, 0, sc)};
    });
    // the tab rides on the selected copy's band, then lifts off to its own slot
    const onBand = {x: copyPos[L.sel].x + (L.sw / 2) * copyScale[L.sel], y: copyPos[L.sel].y + (-L.sh / 2 + L.band / 2) * copyScale[L.sel]};
    const lift = liftWindow(L.sel, N);
    const te = ease.inOutSine(seg(u, ...lift));
    const tabRest = {x: L.tabC.x - L.tabW / 2 + 38 * L.TS, y: L.tabC.y};
    const tabPos = {x: lerp(onBand.x, tabRest.x, te), y: lerp(onBand.y, tabRest.y, te)};
    const tabScale = lerp(copyScale[L.sel], L.TS, te);
    const appear = seg(u, 0.03, 0.1);
    nodes['el-pen'] = {opacity: r(appear, 3)};
    // captions arrive with their elements (never before them)
    L.copies.forEach(cp => {
      const end = sepWindow(cp.k, N)[1];
      if (cp.cap) nodes[`lab-copy${cp.k + 1}`] = {opacity: r(seg(u, end, end + 0.03), 3)};
    });
    if (L.capFolder) nodes['lab-folder'] = {opacity: r(seg(u, FOLDER_MOVE[1], FOLDER_MOVE[1] + 0.03), 3)};
    if (L.capTab) nodes['lab-tab'] = {opacity: r(seg(u, lift[1] - 0.01, lift[1] + 0.02), 3)};
    if (L.capPen) nodes['lab-pen'] = {opacity: r(appear, 3)};
    // 2) relations drawn one by one; the legend arrives with them
    const n = L.rels.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / n, 0.18 + ((i + 1) * 0.25) / n));
    Object.assign(nodes, L.graph.frame(relP));
    if (L.legend) nodes.legend = {opacity: r(seg(u, 0.18, 0.24), 3)};
    // 3) tracer and focus pulses; the focus element keeps its emphasis once reached
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.78;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const gate = u < 0.43 ? 0 : 1 - seg(u, 0.74, 0.8);
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined) return 0;
      return gate * clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    let ringOp = 0;
    if (L.focus) {
      const vt = L.visitT[L.focus.id];
      const reached = vt !== undefined && u >= 0.43 ? clamp((tt - vt) / 0.06) : 0;
      ringOp = Math.max(reached, seg(u, 0.74, 0.8));
    }
    const kOf = id => {
      const isFocus = L.focus && id === L.focus.id;
      const amp = (isFocus ? 0.22 : 0.07) * (reduced ? 0.5 : 1);
      const held = isFocus ? 0.55 * ringOp : 0;
      return 1 + amp * ease.inOutSine(Math.max(pulse(id), held));
    };
    L.copies.forEach(cp => {
      nodes[`el-copy${cp.k + 1}-body`] = {transform: scaleAbout(0, 0, kOf(`copy${cp.k + 1}`))};
    });
    nodes['el-folder-body'] = {transform: scaleAbout(L.fw / 2, L.fb / 2 - FOLDER_TAB / 2, kOf('folder'))};
    nodes['el-pen-body'] = {transform: scaleAbout(0, 0, kOf('pen'))};
    const tabK = kOf('tab');
    // tab group: position = attach point (origin of the flag); scale about the flag's centre
    const fx = (84 - 38) / 2;
    nodes['el-tab'] = {transform: T(tabPos.x, tabPos.y, 0, tabScale)};
    nodes['el-tab-body'] = {transform: scaleAbout(fx, 0, tabK)};
    Object.assign(nodes, L.tab.tickFrame(1));
    if (L.focus) nodes['focus-ring'] = {opacity: r(ringOp, 3), transform: T(L.focus.c.x, L.focus.c.y, 0, kOf(L.focus.id))};
    // the part that changes: the tab slot on the selected copy lights up when
    // the tracer reaches the tab (and stays identified afterwards)
    const reachTab = L.visitT.tab;
    const lit = reachTab === undefined ? (u >= 0.75 ? 1 : 0) : (u >= 0.74 ? 1 : tracerOn && tt >= reachTab - 0.02 ? 1 : 0);
    const slotShown = seg(u, ...lift);
    nodes['tab-slot'] = {opacity: r(Math.max(0.6 * slotShown, lit), 3), 'fill-opacity': lit ? 0.9 : 0.25};
    // 4) gather: descriptive tags
    const tagP = seg(u, 0.8, 0.88);
    if (L.tagSel) nodes['tag-selected'] = {opacity: r(tagP * lit, 3)};
    if (L.tagPrev) nodes['tag-previous'] = {opacity: r(tagP, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const semantic = {
      beat,
      tracer: P2(tpos),
      tracerVisible: tracerOn,
      visitOrder: L.route.visits.map(v => v.id),
      relationsDrawn: L.rels.map((_, i) => r(relP(i), 3)),
      kinds: L.rels.map(x => x.kind),
      arrows: L.rels.map(x => x.kind !== 'relation'),
      tab: P2(tabPos),
      tabSlotLit: Boolean(lit),
      focusScale: r(tabK, 3),
      focusHeld: r(ringOp, 3),
      separated: u >= Math.max(sepWindow(0, N)[1], lift[1], FOLDER_MOVE[1]),
      selected: p.versions[L.sel].id,
      connectorEnds: L.graph.conns.map(x => ({from: P2(x.c.from), to: P2(x.c.to)})),
    };
    copyPos.forEach((q, k) => { semantic[`copy${k + 1}`] = P2(q); });
    return {nodes, semantic};
  },
};

function legendNode(ctx, kinds, labels, at, size) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const gap = 56;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return {node: g({name: 'legend', opacity: 0}, parts), box: {x: at.x - total / 2 - 6, y: at.y - size * 0.8, w: total + 12, h: size * 1.6}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-08-mechanism',
    title: 'Version chain — exploded chain, links and the identifying tab',
    titleEs: 'Cadena de versiones — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Cadena de versiones',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The filed chain comes apart into an exploded zig-zag: successive copies alternate between two lanes, joined by sequence arrows; the file, the index tab and the pen sit in the free slots and are joined by plain relations. A tracer follows the traversal order; when it reaches the tab, the tab slot on the selected copy lights up.',
    tags: ['versions', 'version chain', 'mechanism', 'exploded', 'relations', 'tracer', 'index tab'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/cadena-de-versiones.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
