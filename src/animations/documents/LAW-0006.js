/**
 * LAW-0006 — Sellado de copia · mechanism
 *
 * Storyboard (exploded oblique stack, 7 s default):
 *  0.00–0.18  separate: the compact desk set (copy lying on the folder over
 *             the original, stamp standing on the ink pad, pen on the folder)
 *             explodes: the copy rises above the folder that supports it
 *             (its shadow stays on the folder), the original slides aside,
 *             the stamp rises to stand directly above ONE spot of the copy.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             from port to port on the real outlines; plain relations have
 *             dots and no arrowhead (no causality unless supplied).
 *  0.43–0.75  trace: a tracer follows the traversal order; passing the pad
 *             inks the die (grey rubber → ink), passing stamp → mark sends
 *             the die footprint down the press axis and the mark appears on
 *             that spot only; the focus element enlarges as it is passed.
 *  0.75–1.00  gather: everything stays anchored; descriptive state tags
 *             (inked / marked / original unmarked) and the kind legend.
 * @module animations/documents/LAW-0006
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {documentsFields, mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag} from '../../primitives/annotate.js';
import {pen} from '../../primitives/paper.js';
import {kindColor} from '../../frameworks/graph.js';
import {obl, oblMatrix, flatOutline, flatPorts, flatFolder, flatPad, uprightStamp, portGraph, connectorSamples, polyHitsRect, sheet, inkMark, OBL} from './kits/sellado-de-copia-stack.js';
import {markSpotLocal, balancedWidth} from './kits/sellado-de-copia.js';

const ID = 'LAW-0006';
const DURATION = 7000;
const IDS = ['ink', 'stamp', 'mark', 'copy', 'original', 'folder', 'pen'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {explode: [0.02, 0.15], labels: [0.12, 0.2], trace: [0.44, 0.74], tags: [0.8, 0.88]};

const STRINGS = {
  en: {inked: 'Die inked', marked: 'Marked', noMark: 'No mark'},
  es: {inked: 'Troquel entintado', marked: 'Marcada', noMark: 'Sin marca'},
};

const sceneSchema = {
  ...documentsFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};
sceneSchema.stampLabel = {type: 'string', maxLength: 24, description: 'Legend of the stamp impression (descriptive, e.g. COPY)'};

const defaultParams = {
  documentId: 'DOC-218',
  documentTitle: 'Lease Agreement',
  clauses: ['Premises', 'Rent (hypothetical)', 'Duration and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  elements: [
    {id: 'ink', label: 'Ink pad'},
    {id: 'stamp', label: 'Stamp die'},
    {id: 'mark', label: 'Ink mark'},
    {id: 'copy', label: 'Copy'},
    {id: 'original', label: 'Original'},
    {id: 'folder', label: 'File folder'},
    {id: 'pen', label: 'Pen'},
  ],
  relationships: [
    {from: 'ink', to: 'stamp', kind: 'sequence', label: 'inks the die'},
    {from: 'stamp', to: 'mark', kind: 'sequence', label: 'presses one spot'},
    {from: 'copy', to: 'original', kind: 'relation', label: 'copy of'},
    {from: 'folder', to: 'copy', kind: 'relation', label: 'supports'},
    {from: 'pen', to: 'original', kind: 'relation', label: 'signed with'},
  ],
  focusElement: 'mark',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['ink', 'stamp', 'mark', 'copy', 'folder'],
  stampLabel: 'COPY',
};

/**
 * Hand-placed geometry per shape (screen design units). C = copy plan origin
 * (exploded); the copy floats `gap` above its resting place on the folder;
 * the stamp's die face floats `lift` above the mark; P = pad origin;
 * O = original origin. `ports` fixes the port pair of the default
 * relationships, `sides` the preferred side of their labels, `support` the
 * copy corner whose vertical guide drops onto the folder.
 */
const PLACES = {
  landscape: {
    size: [1900, 970], C: [720, 330], gap: 170, lift: 250, P: [205, 150], O: [1400, 330], pen: [1700, 188, -14],
    legend: 942, planDoc: [380, 490], planFolder: [470, 590], stamp: [150, 100], planPad: [200, 128], support: 'nearLeft',
    ports: {'ink>stamp': ['right', 'left'], 'stamp>mark': ['bottom', 'top'], 'copy>original': ['right', 'left'], 'folder>copy': ['under', 'nearCorner'], 'pen>original': ['nib', 'top']},
    sides: {'ink>stamp': -1, 'stamp>mark': -1, 'copy>original': 1, 'folder>copy': -1, 'pen>original': 1},
  },
  square: {
    size: [1420, 1100], C: [450, 360], gap: 200, lift: 230, P: [60, 170], O: [1060, 360], pen: [1250, 192, -14],
    legend: 1060, planDoc: [360, 460], planFolder: [450, 560], stamp: [144, 96], planPad: [180, 118], support: 'nearLeft',
    ports: {'ink>stamp': ['right', 'left'], 'stamp>mark': ['bottom', 'top'], 'copy>original': ['right', 'left'], 'folder>copy': ['under', 'nearCorner'], 'pen>original': ['nib', 'top']},
    sides: {'ink>stamp': -1, 'stamp>mark': 1, 'copy>original': 1, 'folder>copy': -1, 'pen>original': 1},
  },
  portrait: {
    size: [980, 1600], C: [480, 410], gap: 230, lift: 260, P: [50, 160], O: [300, 1110], pen: [790, 1210, -30],
    legend: 1572, planDoc: [360, 460], planFolder: [440, 560], stamp: [140, 94], planPad: [180, 116], support: 'nearRight',
    ports: {'ink>stamp': ['right', 'left'], 'stamp>mark': ['bottom', 'top'], 'copy>original': ['left', 'left'], 'folder>copy': ['under', 'nearCorner'], 'pen>original': ['nib', 'right']},
    sides: {'ink>stamp': -1, 'stamp>mark': 1, 'copy>original': -1, 'folder>copy': 1, 'pen>original': -1},
    around: 40,
  },
};

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const showText = ctx.show('all');
    const ink = th.accent;
    const [dw, dh] = Pl.planDoc;
    const [fw, fh] = Pl.planFolder;
    const [sw, sh] = Pl.stamp;
    const [pw, ph] = Pl.planPad;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const at = (O, x, y) => ({x: O.x + obl(x, y).x, y: O.y + obl(x, y).y});

    // --- exploded positions
    const C = {x: Pl.C[0], y: Pl.C[1]};
    const onFolder = {x: C.x, y: C.y + Pl.gap};
    const F = {x: onFolder.x - obl(50, 50).x, y: onFolder.y - obl(50, 50).y};
    // the press spot sits below the document heading (a two-line title pushes it
    // down), so neither the impression nor the press arrow lands on the title
    const markRot = -7;
    const spot0 = markSpotLocal(ctx, {w: dw, h: dh, title: p.documentTitle, sw, sh, rot: markRot});
    // Seen obliquely, the vertical press axis crosses the sheet's far part on its
    // way down: leave room for the arrowhead under the heading rule, and slide the
    // spot right until the axis passes beyond the end of the title text (as far as
    // the sheet allows; a full-width title can only be cleared by the arrowhead).
    const markY = Math.min(dh * 0.62, Math.max(spot0.y, spot0.ruleY + spot0.extY + 40));
    const clearX = spot0.titleRight + 14 - OBL.K * (markY - spot0.titleTop);
    const markPlan = {x: Math.min(spot0.maxX, Math.max(spot0.x, clearX)), y: markY};
    const markC = at(C, markPlan.x, markPlan.y);
    const SF = {x: markC.x, y: markC.y - Pl.lift};
    const P = {x: Pl.P[0], y: Pl.P[1]};
    const O = {x: Pl.O[0], y: Pl.O[1]};
    const penAt = {x: Pl.pen[0], y: Pl.pen[1]};
    // --- assembled (compact) positions → offsets used by the explode beat
    const padTop = at(P, pw / 2, ph / 2);
    const origRest = at(F, 70, 62);
    const penRest = at(F, fw * 0.66, fh * 0.9);
    const assembled = {
      copy: {x: 0, y: Pl.gap - 6},
      original: {x: origRest.x - O.x, y: origRest.y - 3 - O.y},
      stamp: {x: padTop.x - SF.x, y: padTop.y - SF.y},
      pen: {x: penRest.x - penAt.x, y: penRest.y - penAt.y},
    };

    // --- nodes
    const folderNode = g({transform: T(F.x, F.y)}, flatFolder(ctx, {w: fw, h: fh, label: '', showText}));
    const copySheet = sheet(ctx, {prefix: 'm-copy', w: dw, h: dh, doc, signer: p.signers[0].name, tone: 'copy', showText});
    const origSheet = sheet(ctx, {prefix: 'm-orig', w: dw, h: dh, doc, signer: p.signers[0].name, tone: 'original', showText, redact: false});
    const mark = inkMark(ctx, {name: 'm-mark', w: sw - 8, h: sh - 8, label: p.stampLabel, color: ink, showText});
    const copyNode = g({name: 'el-copy'},
      g({transform: oblMatrix(C.x, C.y)}, copySheet.node,
        g({transform: T(markPlan.x, markPlan.y, markRot)}, g({name: 'el-mark-body'}, g({name: 'm-mark-vis', opacity: 0}, mark)))));
    const shadowNode = g({name: 'copy-shadow', opacity: 0}, g({transform: oblMatrix(onFolder.x + 10, onFolder.y + 8)}, h('path', {d: copySheet.outline, fill: th.shadow})));
    // the original keeps an empty dashed outline at the same spot (shown in the gather beat)
    const q0 = (x, y) => ({x: x + OBL.K * y, y: OBL.D * y});
    const spotPts = [q0(-sw / 2 + 4, sh / 2 - 4), q0(sw / 2 - 4, sh / 2 - 4), q0(sw / 2 - 4, -sh / 2 + 4), q0(-sw / 2 + 4, -sh / 2 + 4)].map(v => `${r(v.x)} ${r(v.y)}`).join(' ');
    const origSpot = at(O, markPlan.x, markPlan.y);
    const origNode = g({name: 'el-original'}, g({name: 'el-original-body'},
      g({transform: oblMatrix(O.x, O.y)}, origSheet.node),
      h('polygon', {name: 'orig-spot', points: spotPts, transform: T(origSpot.x, origSpot.y), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '9 7', opacity: 0})));
    const padNode = g({name: 'el-ink'}, g({name: 'el-ink-body'}, g({transform: T(P.x, P.y)}, flatPad(ctx, {name: 'm-pad', w: pw, h: ph, ink}))));
    const stamp = uprightStamp(ctx, {name: 'm-stamp', sw, sh, ink});
    const stampNode = g({name: 'el-stamp'}, g({transform: T(SF.x, SF.y)}, g({name: 'el-stamp-body'}, stamp.node)));
    const penLen = 200;
    const penProp = pen(ctx, {name: 'm-pen', length: penLen, body: th.accent2});
    const penNode = g({name: 'el-pen'}, g({transform: T(penAt.x, penAt.y)}, g({name: 'el-pen-body'}, g({transform: T(-80, 0, Pl.pen[2])}, penProp.node))));
    // the drawn pen: nib at penAt + (-80, 0), barrel along the rotated x axis (see primitives/paper pen)
    const pa = (Pl.pen[2] * Math.PI) / 180;
    const pd = {x: Math.cos(pa), y: Math.sin(pa)}, pnrm = {x: -Math.sin(pa), y: Math.cos(pa)};
    const penHalf = (penLen * 0.085) / 2;
    const penPt = (along, across) => ({x: penAt.x - 80 + pd.x * along + pnrm.x * across, y: penAt.y + pd.y * along + pnrm.y * across});
    // ghost footprint of the die (travels down the press axis)
    const gw = sw / 2 - 6, gh = sh / 2 - 6;
    const ghostPts = [q0(-gw, gh), q0(gw, gh), q0(gw, -gh), q0(-gw, -gh)].map(v => `${r(v.x)} ${r(v.y)}`).join(' ');
    const ghost = h('polygon', {name: 'ghost', points: ghostPts, fill: ink, 'fill-opacity': 0.45, stroke: ink, 'stroke-width': 3, 'stroke-dasharray': '8 6', opacity: 0});

    // --- element geometry for the graph (exploded positions)
    const bbox = list => {
      const xs = list.map(v => v.x), ys = list.map(v => v.y);
      return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
    };
    const nearL = at(C, 0, dh), nearR = at(C, dw, dh);
    const corner = Pl.support === 'nearRight' ? nearR : nearL;
    const cornerPlan = Pl.support === 'nearRight' ? [dw, dh] : [0, dh];
    const under = at(onFolder, cornerPlan[0], cornerPlan[1]);
    const stampBox = {x: SF.x + stamp.box.x, y: SF.y + stamp.box.y, w: stamp.box.w, h: stamp.box.h};
    const elements = {
      ink: {ports: {right: {x: at(P, pw, ph / 2).x + 10, y: at(P, pw, ph / 2).y + 6}, top: {x: P.x + pw / 2 + 16, y: P.y - 52}}, center: padTop, box: bbox([...flatOutline(P, pw, ph), {x: P.x + 16, y: P.y - 44}, {x: at(P, pw, ph).x, y: at(P, pw, ph).y + 16}])},
      stamp: {ports: Object.fromEntries(Object.entries(stamp.ports).map(([k, v]) => [k, {x: SF.x + v.x, y: SF.y + v.y}])), center: {x: SF.x, y: SF.y - 50}, box: stampBox},
      mark: {ports: {top: {x: markC.x, y: markC.y - OBL.D * (sh - 8) / 2 - 3}}, center: markC, box: {x: markC.x - sw * 0.62, y: markC.y - sh * 0.34, w: sw * 1.24, h: sh * 0.68}},
      copy: {ports: {...flatPorts(C, dw, dh), nearCorner: {x: corner.x + (Pl.support === 'nearRight' ? 6 : -6), y: corner.y + 8}}, center: at(C, dw / 2, dh / 2), box: bbox(flatOutline(C, dw, dh))},
      original: {ports: flatPorts(O, dw, dh), center: at(O, dw / 2, dh / 2), box: bbox(flatOutline(O, dw, dh))},
      folder: {ports: {left: flatPorts(F, fw, fh, 12).left, right: {x: at(F, fw, fh * 0.6).x + 8, y: at(F, fw, fh * 0.6).y}, under: {x: under.x + (Pl.support === 'nearRight' ? 6 : -6), y: under.y - 2}}, center: at(F, fw / 2, fh * 0.7), box: bbox([...flatOutline(F, fw, fh), {x: at(F, 0, fh).x, y: at(F, 0, fh).y + 12}])},
      // ports sit on the drawn pen: just beyond the nib, on either side of the barrel, past the cap
      pen: {ports: {nib: penPt(-8, 0), under: penPt(penLen * 0.45, penHalf + 7), over: penPt(penLen * 0.5, -penHalf - 7), cap: penPt(penLen + 8, 0)}, center: penPt(penLen * 0.5, 0)},
    };
    elements.pen.hull = [penPt(-2, -penHalf), penPt(penLen, -penHalf), penPt(penLen, penHalf), penPt(-2, penHalf)];
    elements.pen.box = bbox(elements.pen.hull);
    delete elements.copy.ports.top;
    elements.copy.hull = flatOutline(C, dw, dh);
    elements.original.hull = flatOutline(O, dw, dh);
    elements.folder.hull = [F, at(F, fw, 0), {x: at(F, fw, fh).x, y: at(F, fw, fh).y + 12}, {x: at(F, 0, fh).x, y: at(F, 0, fh).y + 12}];
    elements.ink.hull = [{x: P.x + 16, y: P.y - 44}, {x: P.x + pw + 16, y: P.y - 44}, {x: P.x + pw, y: P.y}, {x: at(P, pw, ph).x, y: at(P, pw, ph).y + 16}, {x: at(P, 0, ph).x, y: at(P, 0, ph).y + 16}, P];

    // --- the relationship graph spec (needed first: labels and tags keep off its lines)
    const around = Pl.around;
    const graphSpec = {
      name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels,
      bounds: {x: 0, y: 0, w: S.w, h: Pl.legend - 40}, chipSize: 28, chipMax: 300,
      bend: rel => (rel.kind === 'sequence' ? 0 : 0.05),
      portPrefs: Pl.ports,
      labelIgnore: ['folder'],
      // a side given for a→b applies to b→a too (the perpendicular flips with the direction)
      labelSide: rel => {
        const fwd = Pl.sides[`${rel.from}>${rel.to}`];
        if (fwd !== undefined) return fwd;
        const rev = Pl.sides[`${rel.to}>${rel.from}`];
        return rev !== undefined ? -rev : 1;
      },
      // in portrait the original sits below the folder: route that link around the stack's left side
      controls: (rel, a, b) => (around !== undefined && ((rel.from === 'original' && rel.to === 'copy') || (rel.from === 'copy' && rel.to === 'original'))
        ? {c1: {x: around, y: a.y - (a.y - b.y) * 0.25}, c2: {x: around, y: b.y + (a.y - b.y) * 0.1}}
        : null),
    };
    const lines = connectorSamples(ctx, graphSpec, 80).flat();
    const hitsLines = b => lines.some(q => q.x > b.x - 8 && q.x < b.x + b.w + 8 && q.y > b.y - 8 && q.y < b.y + b.h + 8);
    const hullOf2 = id => elements[id].hull || [{x: elements[id].box.x, y: elements[id].box.y}, {x: elements[id].box.x + elements[id].box.w, y: elements[id].box.y}, {x: elements[id].box.x + elements[id].box.w, y: elements[id].box.y + elements[id].box.h}, {x: elements[id].box.x, y: elements[id].box.y + elements[id].box.h}];
    // screen outline of the impression and of the empty spot on the original (leader ends)
    const mc = Math.cos((markRot * Math.PI) / 180), ms = Math.sin((markRot * Math.PI) / 180);
    const footprint = (Oo, k) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
      const px = (a * (sw - 8)) / 2 * k, py = (b * (sh - 8)) / 2 * k;
      return at(Oo, markPlan.x + px * mc - py * ms, markPlan.y + px * ms + py * mc);
    });
    const markHull = footprint(C, 1);
    const spotHull = spotPts.split(' ').reduce((acc, v, i, all) => (i % 2 ? acc : [...acc, {x: origSpot.x + Number(v), y: origSpot.y + Number(all[i + 1])}]), []);
    // x of the copy's / original's slanted side edges at a screen height
    const sideX = (Oo, plan, y) => Oo.x + plan + OBL.K * ((y - Oo.y) / OBL.D);

    // the die footprint sweeps a band along the press axis: keep labels out of it
    const band = {x: SF.x - 92, y: SF.y + 10, w: 184, h: markC.y - SF.y - 30};
    const overlapsBox = (a, b, pad) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

    // --- element labels (slots computed from the geometry)
    const labs = {};
    const labLeads = {};
    // Long labels may wrap to three lines; `v` says which edge of the chip `y`
    // pins ('top' default, 'bottom' for chips above their element, 'center').
    const base = {size: 30, maxLines: 3};
    const penTop = Math.min(penPt(0, -penHalf).y, penPt(penLen, -penHalf).y);
    const slots = {
      ink: {x: elements.ink.box.x + elements.ink.box.w / 2, y: elements.ink.box.y + elements.ink.box.h + 14, anchor: 'middle', maxWidth: shape === 'portrait' ? 400 : 300},
      stamp: shape === 'portrait'
        ? {x: SF.x, y: stampBox.y - 10, v: 'bottom', anchor: 'middle', maxWidth: 320}
        : {x: stampBox.x + stampBox.w + 18, y: stampBox.y + 4, anchor: 'start', maxWidth: 280},
      // the mark is named right beside its spot: first beyond the copy's right edge at
      // the spot's height, else above the copy; a short leader always ties it to the spot
      mark: [
        // (narrower, wrapped variants fit the slanted gap before the original)
        ...[0, 15, 30, 45, 60, 75, 90, 120].flatMap(k => [shape === 'landscape' ? 260 : 230, 190, 150].map(mw => ({x: hh => sideX(C, dw, markC.y - k - hh / 2) + 16, y: markC.y - k, v: 'center', anchor: 'start', maxWidth: mw}))),
        // else the nearest free place around the spot (off every object, the copy included)
        ...[150, 190, 230, 270, 320, 370].flatMap(d => [-60, -30, -90, 0, -120, -150, 30, 180, 60, 150, 90, 120].map(deg => ({
          x: markC.x + d * Math.cos((deg * Math.PI) / 180), y: markC.y + d * Math.sin((deg * Math.PI) / 180), v: 'center', anchor: 'middle', maxWidth: 240, ring: true}))),
        shape === 'portrait'
          ? {x: markC.x + 96, y: C.y - 16, v: 'bottom', anchor: 'start', maxWidth: 220}
          : {x: markC.x - 96, y: C.y - 9, v: 'bottom', anchor: 'end', maxWidth: 260},
      ],
      // beside the copy's top-left corner; if that spot is taken, slide down the
      // slanted left edge (the chip's right edge clears the edge at its bottom)
      copy: [
        shape === 'portrait'
          ? {x: C.x - 24, y: C.y + 61, v: 'bottom', anchor: 'end', maxWidth: 260}
          : {x: at(C, 0, dh * 0.12).x - 20, y: at(C, 0, dh * 0.12).y + 4, v: 'center', anchor: 'end', maxWidth: 240},
        ...[0.1, 0.2, 0.3].map(k => ({x: hh => at(C, 0, dh * k).x + OBL.K * (hh / OBL.D) - 16, y: at(C, 0, dh * k).y, anchor: 'end', maxWidth: shape === 'portrait' ? 260 : 240})),
      ],
      original: {x: at(O, dw / 2, dh).x, y: at(O, dw / 2, dh).y + 16, anchor: 'middle', maxWidth: 320},
      folder: shape === 'portrait'
        ? {x: at(F, fw * 0.55, fh).x, y: at(F, fw / 2, fh).y + 26, anchor: 'middle', maxWidth: 340}
        : {x: at(F, fw, fh).x + 22, y: at(F, fw, fh).y - 44, anchor: 'start', maxWidth: 300},
      // above the (flat-lying) pen, never over it; two lines at most so it stays in the frame
      pen: shape === 'portrait'
        ? {x: penAt.x, y: penAt.y + 70, anchor: 'middle', maxWidth: 220}
        : {x: penPt(penLen * 0.5, 0).x, y: penTop - 12, v: 'bottom', anchor: 'middle', maxWidth: 300, maxLines: 2},
    };
    // Keep every chip inside the design space: flip to the other side of its
    // element when it would overflow, then shift as a last resort.
    const inBounds = (make, spec, flipX) => {
      const over = b => b.x + b.w > S.w - 10 || b.x < 10;
      let sp = spec;
      let c = make(sp);
      if (over(c.box) && flipX !== undefined) {
        sp = {...spec, x: flipX, anchor: spec.anchor === 'start' ? 'end' : 'start'};
        c = make(sp);
      }
      if (over(c.box)) {
        const dx = c.box.x < 10 ? 10 - c.box.x : S.w - 10 - (c.box.x + c.box.w);
        const x0 = sp.x;
        c = make({...sp, x: typeof x0 === 'function' ? hh => x0(hh) + dx : x0 + dx});
      }
      return c;
    };
    const flips = {stamp: stampBox.x - 18};
    // balanced line breaks: a wrapped label never leaves a one-word orphan
    const pinned = (txt, sp0, name) => {
      const sp = {...sp0, maxWidth: balancedWidth(ctx, txt, sp0.maxWidth, base.size, sp0.maxLines ?? base.maxLines)};
      const probe = chip(ctx, txt, {...base, ...sp, x: 0, y: 0, name});
      const x = typeof sp.x === 'function' ? sp.x(probe.box.h) : sp.x;
      const y = sp.v === 'bottom' ? sp.y - probe.box.h : sp.v === 'center' ? sp.y - probe.box.h / 2 : sp.y;
      return chip(ctx, txt, {...base, ...sp, x, y, name});
    };
    // element labels never cover each other: a slot with alternatives takes the first free one
    const clash = b => Object.values(labs).some(q => q && b.x < q.box.x + q.box.w + 8 && b.x + b.w + 8 > q.box.x && b.y < q.box.y + q.box.h + 8 && b.y + b.h + 8 > q.box.y);
    // the mark's label must also stay off every other object and every connector line
    const markClear = b => !['ink', 'stamp', 'original', 'pen', 'folder'].some(id => polyHitsRect(hullOf2(id), b, 4)) && !hitsLines(b)
      && b.y + b.h <= Pl.legend - 40;
    // a narrower variant is only acceptable while the text stays whole (no cut, no split word)
    const whole = (c, txt) => !c.fit.truncated && c.fit.lines.join(' ') === String(txt).replace(/\s+/g, ' ').trim();
    for (const id of IDS) {
      const txt = label(id);
      if (!txt || !ctx.show('key')) { labs[id] = null; continue; }
      const cands = Array.isArray(slots[id]) ? slots[id] : [slots[id]];
      let pick = null;
      let least = null;
      for (const sp of cands) {
        const c = inBounds(q => pinned(txt, q, `lab-${id}`), sp, flips[id]);
        if (!pick) pick = c;
        if (id === 'mark') {
          if (!whole(c, txt)) continue;
          // when nothing is fully clear, the mark's label takes the least-bad place:
          // covering a label or a connector is worst, then objects, then distance
          const b = c.box;
          const bad = 10 * (clash(b) ? 1 : 0) + 10 * (hitsLines(b) ? 1 : 0) + 10 * (overlapsBox(b, band, 4) ? 1 : 0)
            + 5 * ['ink', 'stamp', 'original', 'pen', 'copy'].filter(q => polyHitsRect(hullOf2(q), b, 4)).length
            + 2 * (polyHitsRect(hullOf2('folder'), b, 4) ? 1 : 0) + (b.y + b.h > Pl.legend - 40 ? 100 : 0)
            + Math.hypot(b.cx - markC.x, b.cy - markC.y) / 400;
          if (!least || bad < least.bad) least = {c, bad};
          if (sp.ring && (polyHitsRect(hullOf2('copy'), b, 6) || overlapsBox(b, band, 6))) continue;
        }
        if (!clash(c.box) && (id !== 'mark' || markClear(c.box))) { pick = c; least = null; break; }
      }
      labs[id] = least ? least.c : pick;
    }
    if (labs.mark) labLeads.mark = leaderTo(ctx, labs.mark.box, markHull, th.ink);

    // --- gather tags (descriptive only), reserved as obstacles for relation labels.
    // Each tag takes the first of its candidate spots that stays in the frame and
    // clear of every connector line, element label, other tag and object — the
    // sheets included, so a state tag never hides a heading or clause. The marked
    // and unmarked tags keep a short leader to their spot.
    const tags = [];
    if (ctx.show('key')) {
      const labBoxes = Object.values(labs).filter(Boolean).map(c => c.box);
      const leadBoxes = () => Object.values(labLeads).concat(tags.map(t => t.lead)).filter(Boolean).map(l => l.box);
      const near = (a, b, pad) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
      const outside = b => b.x < 10 || b.x + b.w > S.w - 10 || b.y < 10 || b.y + b.h > Pl.legend - 40;
      const TH = 26 * 1.75;
      const pickTag = (text, base, cands, avoidHulls, spot) => {
        let best = null;
        cands.filter(Boolean).forEach((c, i) => {
          if (best && best.score < 1) return;
          const t = statusTag(ctx, text, {size: 26, ...base, ...c, name: undefined});
          const b = t.box;
          const lead = spot ? leaderTo(ctx, b, spot, base.color) : null;
          const score = (outside(b) ? 100 : 0) + (hitsLines(b) ? 10 : 0)
            + 10 * [...labBoxes, ...tags.map(x => x.box), ...leadBoxes()].filter(q => near(b, q, 6)).length
            + 5 * avoidHulls.filter(hl => polyHitsRect(hl, b, 4)).length
            + (lead ? 3 * labBoxes.filter(q => segHitsBox(lead.a, lead.b, q)).length + lead.len / 400 : 0) + i * 0.01;
          if (!best || score < best.score) best = {t, lead, score};
        });
        tags.push({name: base.name, node: g({name: base.name, opacity: 0}, best.lead && best.lead.node, best.t.node), box: best.t.box, lead: best.lead});
      };
      const inkedY = shape === 'portrait' ? SF.y + 8 : SF.y - 24;
      pickTag(ctx.t.inked, {name: 'tag-inked', color: ink}, [
        {x: SF.x + sw * 0.62, y: inkedY, anchor: 'start'},
        // portrait: the left of the die is where the press relation is named
        shape === 'portrait' ? {x: S.w - 12, y: SF.y + 30, anchor: 'end'} : null,
        {x: stampBox.x - 14, y: inkedY, anchor: 'end'},
        {x: SF.x + sw * 0.62, y: SF.y + 26, anchor: 'start'},
        {x: stampBox.x - 14, y: SF.y + 26, anchor: 'end'},
        {x: SF.x + sw * 0.62, y: stampBox.y + 20, anchor: 'start'},
        {x: stampBox.x - 14, y: stampBox.y + 20, anchor: 'end'},
        // a wide tag that cannot sit beside the die hangs just below it, flush right
        {x: S.w - 12, y: SF.y + 30, anchor: 'end'},
        {x: S.w - 12, y: SF.y + 90, anchor: 'end'},
      ], ['ink', 'mark', 'copy', 'original', 'pen'].map(hullOf2));
      // Marked: next to the mark's own label when it sits beside the spot, else just
      // outside the copy (beyond its right edge, above its far edge, left of it)
      const lm = labs.mark && labs.mark.box;
      const beside = lm && lm.x > markC.x;
      const yMid = markC.y - TH / 2;
      pickTag(ctx.t.marked, {name: 'tag-marked', color: th.accent4}, [
        beside ? {x: lm.x, y: lm.y + lm.h + 8, anchor: 'start'} : null,
        beside ? {x: lm.x, y: lm.y - 8 - TH, anchor: 'start'} : null,
        {x: sideX(C, dw, yMid) + 22, y: yMid, anchor: 'start'},
        {x: markC.x + 30, y: C.y - 14 - TH, anchor: 'start'},
        {x: markC.x - 30, y: C.y - 14 - TH, anchor: 'end'},
        {x: markC.x + 30, y: C.y - 26 - TH * 2, anchor: 'start'},
        {x: markC.x - 30, y: C.y - 26 - TH * 2, anchor: 'end'},
        {x: sideX(C, 0, yMid + TH) - 22, y: yMid, anchor: 'end'},
        {x: sideX(C, dw, yMid + 60) + 22, y: yMid + 60, anchor: 'start'},
      ], ['ink', 'stamp', 'copy', 'original', 'pen'].map(hullOf2), markHull);
      // No mark: just outside the original, near its empty spot
      const oMid = origSpot.y - TH / 2;
      pickTag(ctx.t.noMark, {name: 'tag-nomark', color: th.inkSoft}, [
        {x: origSpot.x + 36, y: O.y - 14 - TH, anchor: 'start'},
        {x: origSpot.x - 36, y: O.y - 14 - TH, anchor: 'end'},
        {x: origSpot.x + 110, y: O.y - 14 - TH, anchor: 'start'},
        {x: S.w - 14, y: O.y - 14 - TH, anchor: 'end'},
        {x: S.w - 14, y: O.y - 44 - TH, anchor: 'end'},
        {x: origSpot.x + 36, y: O.y - 30 - TH * 2, anchor: 'start'},
        {x: sideX(O, dw, oMid) + 22, y: oMid, anchor: 'start'},
        {x: sideX(O, 0, oMid + TH) - 22, y: oMid, anchor: 'end'},
        {x: sideX(O, dw, oMid + 70) + 22, y: oMid + 70, anchor: 'start'},
        {x: sideX(O, 0, oMid + 70 + TH) - 22, y: oMid + 70, anchor: 'end'},
      ], [spotHull, ...['ink', 'stamp', 'copy', 'original', 'pen'].map(hullOf2)], spotHull);
    }

    const leaderQuads = [...Object.values(labLeads), ...tags.map(t => t.lead)].filter(Boolean).map(l => l.quad);
    const obstacles = [...Object.values(labs).filter(Boolean).map(c => c.box), ...tags.map(t => t.box), band, ...leaderQuads];
    const graph = portGraph(ctx, {...graphSpec, obstacles, leaderAvoid: [...Object.values(labs).filter(Boolean).map(c => c.box), ...tags.map(t => t.box)]});
    // distance from every connector end to the outline of its element (0 = on/inside)
    const hullOf = id => elements[id].hull || [{x: elements[id].box.x, y: elements[id].box.y}, {x: elements[id].box.x + elements[id].box.w, y: elements[id].box.y}, {x: elements[id].box.x + elements[id].box.w, y: elements[id].box.y + elements[id].box.h}, {x: elements[id].box.x, y: elements[id].box.y + elements[id].box.h}];
    const anchorGaps = graph.conns.map(x => [distToPoly(x.c.from, hullOf(x.rel.from)), distToPoly(x.c.to, hullOf(x.rel.to))].map(v => r(v, 1)));
    const route = graph.route(p.traversalOrder);
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));
    // Time share per hop: the tracer eases into every element; the press
    // (stamp → mark) gets a longer share so the die footprint's descent reads.
    const hops = route.visits.slice(1).map((v, i) => {
      const a = route.visits[i];
      const press = (a.id === 'stamp' && v.id === 'mark') || (a.id === 'mark' && v.id === 'stamp');
      return {t0: a.t, t1: v.t, w: press ? 2.4 : 1};
    });
    const wsum = hops.reduce((acc, x) => acc + x.w, 0) || 1;
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = ctx.show('all') ? legendNode(ctx, kinds, p.relationLabels, {x: S.w / 2, y: Pl.legend}) : null;

    return {S, s, ox, oy, C, SF, markC, onFolder, assembled, folderNode, copyNode, shadowNode, origNode, padNode, stampNode, penNode, ghost,
      labs, labLeads, graph, route, visitT, hops, wsum, tags, legend, elements, anchorGaps};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.folderNode,
      L.shadowNode,
      L.penNode,
      L.origNode,
      L.copyNode,
      L.padNode,
      L.graph.node,
      L.stampNode,
      g({name: 'ghost-g'}, L.ghost),
      Object.entries(L.labs).filter(([, c]) => c).map(([id, c]) => g({name: `${c.node.attrs.name}-g`, opacity: 0}, L.labLeads[id] && L.labLeads[id].node, c.node)),
      L.graph.labelsNode,
      L.tags.map(t => t.node),
      L.graph.tracerNode('tracer'),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: explode the compact set
    const ex = ease.inOutCubic(seg(u, ...W.explode));
    const off = k => ({x: L.assembled[k].x * (1 - ex), y: L.assembled[k].y * (1 - ex)});
    const oc = off('copy'), oo = off('original'), os = off('stamp'), op = off('pen');
    nodes['el-copy'] = {transform: T(oc.x, oc.y)};
    nodes['copy-shadow'] = {opacity: r(clamp(ex * 1.4), 3)};
    nodes['el-original'] = {transform: T(oo.x, oo.y)};
    nodes['el-stamp'] = {transform: T(os.x, os.y)};
    nodes['el-pen'] = {transform: T(op.x, op.y)};
    const labP = seg(u, ...W.labels);
    for (const id of IDS) if (L.labs[id]) nodes[`lab-${id}-g`] = {opacity: r(labP, 3)};
    // 2) relations drawn one by one
    const n = p.relationships.length;
    const drawn = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.24) / n, 0.18 + ((i + 1) * 0.24) / n));
    Object.assign(nodes, L.graph.frame(drawn));
    if (L.legend) nodes.legend = {opacity: r(seg(u, 0.18, 0.24), 3)};
    // 3) tracer
    const tp = seg(u, ...W.trace);
    // map time → arc-length fraction hop by hop (ease into each element)
    let tt = tp >= 1 ? 1 : 0;
    if (tp > 0 && tp < 1 && L.hops.length) {
      let acc = 0;
      tt = L.hops[L.hops.length - 1].t1;
      for (const hp of L.hops) {
        const span = hp.w / L.wsum;
        if (tp <= acc + span) {
          tt = lerp(hp.t0, hp.t1, ease.inOutSine((tp - acc) / span));
          break;
        }
        acc += span;
      }
    }
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= W.trace[0] && u < W.trace[1] + 0.03;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const after = u >= W.trace[1];
    const vt = id => L.visitT[id];
    const reached = id => vt(id) !== undefined && tracerOn && tt >= vt(id);
    const dieInked = after || reached('stamp');
    // the die footprint travels down the axis between the stamp and mark visits
    const vs = vt('stamp'), vm = vt('mark');
    const ordered = vs !== undefined && vm !== undefined && vm > vs;
    const ghostP = ordered ? (after ? 1 : tracerOn ? seg(tt, vs, vm) : 0) : seg(u, W.trace[1], W.trace[1] + 0.04);
    const markOn = ghostP >= 1;
    const gpos = {x: L.SF.x, y: lerp(L.SF.y, L.markC.y, ease.inQuad(ghostP))};
    nodes.ghost = {transform: T(gpos.x, gpos.y), opacity: ghostP > 0 && ghostP < 1 ? 1 : 0};
    nodes['m-stamp-inked'] = {opacity: dieInked ? 1 : 0};
    nodes['m-stamp-clean'] = {opacity: dieInked ? 0 : 1};
    nodes['m-mark-vis'] = {opacity: markOn ? 0.92 : 0};
    // focus element enlarges as the tracer passes it (small pulse for the others)
    const pulse = id => {
      const v = vt(id);
      if (v === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - v) / 0.08);
    };
    const focusK = (id, big, small) => 1 + (id === p.focusElement ? (reduced ? big / 2 : big) : small) * ease.inOutSine(pulse(id));
    nodes['el-ink-body'] = {transform: scaleAbout(L.elements.ink.center.x, L.elements.ink.center.y, focusK('ink', 0.2, 0.06))};
    nodes['el-original-body'] = {transform: scaleAbout(L.elements.original.center.x, L.elements.original.center.y, focusK('original', 0.12, 0.04))};
    nodes['el-pen-body'] = {transform: scaleAbout(0, 0, focusK('pen', 0.2, 0.06))};
    nodes['el-stamp-body'] = {transform: scaleAbout(0, -50, focusK('stamp', 0.18, 0.06))};
    nodes['el-mark-body'] = {transform: `scale(${r(focusK('mark', 0.3, 0.08), 4)})`};
    // 4) gather: descriptive tags; the original keeps an empty outline at the same spot
    const tagP = seg(u, ...W.tags);
    if (L.tags.length) {
      nodes['tag-inked'] = {opacity: r(tagP * (dieInked ? 1 : 0), 3)};
      nodes['tag-marked'] = {opacity: r(tagP * (markOn ? 1 : 0), 3)};
      nodes['tag-nomark'] = {opacity: r(tagP, 3)};
    }
    nodes['orig-spot'] = {opacity: r(tagP, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = v => ({x: r(v.x), y: r(v.y)});
    return {
      nodes,
      semantic: {
        beat,
        explode: r(ex, 3),
        tracer: P2(tpos),
        tracerVisible: tracerOn,
        copyOrigin: P2({x: L.C.x + oc.x, y: L.C.y + oc.y}),
        stampFace: P2({x: L.SF.x + os.x, y: L.SF.y + os.y}),
        ghost: P2(gpos),
        ghostMoving: ghostP > 0 && ghostP < 1,
        dieInked,
        markApplied: markOn,
        markCenter: P2(L.markC),
        relationsDrawn: p.relationships.map((_, i) => r(drawn(i), 3)),
        visitOrder: L.route.visits.map(v => v.id),
        connectors: L.graph.conns.map((x, i) => ({from: x.rel.from, to: x.rel.to, kind: x.rel.kind, arrow: x.rel.kind !== 'relation' && x.rel.kind !== 'disputed', start: P2(x.c.from), end: P2(x.c.to), ports: x.ports, gap: L.anchorGaps[i]})),
        maxAnchorGap: Math.max(0, ...L.anchorGaps.flat()),
      },
    };
  },
};

/** Closest point to `pt` on the boundary of a polygon. */
function closestOnPoly(pt, list) {
  let best = null;
  for (let i = 0; i < list.length; i++) {
    const a = list[i], b = list[(i + 1) % list.length];
    const L2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((pt.x - a.x) * (b.x - a.x) + (pt.y - a.y) * (b.y - a.y)) / L2));
    const q = {x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y)};
    const d = Math.hypot(pt.x - q.x, pt.y - q.y);
    if (!best || d < best.d) best = {...q, d};
  }
  return {x: best.x, y: best.y};
}

/**
 * Short dotted leader from a label box to the nearest point of a polygon (the
 * spot it names), ending in a dot. Returns the node plus its segment, bounding
 * box and a thin quad usable as an obstacle for other labels.
 */
function leaderTo(ctx, box, poly, color) {
  const clampBox = q => ({x: Math.max(box.x, Math.min(box.x + box.w, q.x)), y: Math.max(box.y, Math.min(box.y + box.h, q.y))});
  let b = closestOnPoly({x: box.x + box.w / 2, y: box.y + box.h / 2}, poly);
  let a = clampBox(b);
  b = closestOnPoly(a, poly);
  a = clampBox(b);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const node = g(null,
    len > 8 ? h('line', {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}) : null,
    h('circle', {cx: r(b.x), cy: r(b.y), r: 5.5, fill: color, stroke: ctx.theme.card, 'stroke-width': 2}));
  const nx = len ? -(b.y - a.y) / len * 4 : 0, ny = len ? (b.x - a.x) / len * 4 : 0;
  return {
    node, a, b, len,
    box: {x: Math.min(a.x, b.x) - 4, y: Math.min(a.y, b.y) - 4, w: Math.abs(b.x - a.x) + 8, h: Math.abs(b.y - a.y) + 8},
    quad: [{x: a.x + nx, y: a.y + ny}, {x: b.x + nx, y: b.y + ny}, {x: b.x - nx, y: b.y - ny}, {x: a.x - nx, y: a.y - ny}],
  };
}

/** True when the segment a→b passes through the (slightly shrunk) box. */
function segHitsBox(a, b, q) {
  for (let k = 1; k < 20; k++) {
    const x = a.x + ((b.x - a.x) * k) / 20, y = a.y + ((b.y - a.y) * k) / 20;
    if (x > q.x + 2 && x < q.x + q.w - 2 && y > q.y + 2 && y < q.y + q.h - 2) return true;
  }
  return false;
}

/** Distance from a point to a convex polygon (0 when inside). */
function distToPoly(pt, list) {
  let inside = true;
  let best = Infinity;
  for (let i = 0; i < list.length; i++) {
    const a = list[i], b = list[(i + 1) % list.length];
    const cross = (b.x - a.x) * (pt.y - a.y) - (b.y - a.y) * (pt.x - a.x);
    if (cross < 0) inside = false;
    const L2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2 || 1;
    const t = Math.max(0, Math.min(1, ((pt.x - a.x) * (b.x - a.x) + (pt.y - a.y) * (b.y - a.y)) / L2));
    best = Math.min(best, Math.hypot(pt.x - (a.x + t * (b.x - a.x)), pt.y - (a.y + t * (b.y - a.y))));
  }
  // polygons are listed clockwise on screen (y down); accept either winding
  if (!inside) {
    let inside2 = true;
    for (let i = 0; i < list.length; i++) {
      const a = list[i], b = list[(i + 1) % list.length];
      if ((b.x - a.x) * (pt.y - a.y) - (b.y - a.y) * (pt.x - a.x) > 0) inside2 = false;
    }
    inside = inside2;
  }
  return inside ? 0 : best;
}

function legendNode(ctx, kinds, labels, at) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const size = 30;
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
  return g({name: 'legend'}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-02-mechanism',
    title: 'Copy stamping — exploded stack and relationships',
    titleEs: 'Sellado de copia — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Sellado de copia',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded oblique stack: the copy floats above the folder that supports it, the stamp stands above one spot of the copy, the ink pad and the signed original sit aside. Port-anchored connectors state each supplied relationship by kind; a tracer follows the traversal order, inking the die and sending its footprint down the press axis so the mark appears on that spot only.',
    tags: ['stamp', 'copy', 'mechanism', 'exploded', 'oblique', 'relations', 'tracer', 'ink'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/sellado-de-copia-stack.js', 'src/animations/documents/kits/sellado-de-copia.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
