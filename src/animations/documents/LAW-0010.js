/**
 * LAW-0010 — Apertura de expediente · mechanism
 *
 * Storyboard (exploded oblique view of the case file, not a row of boxes):
 *  0.00–0.18  Separate: the closed file comes apart. The front cover swings up
 *             on its hinge, the documents lift off the back cover into separate
 *             floating layers, and the index sheet slides off the top of the
 *             stack and turns to face the viewer as a readable card. Pen and
 *             stamp appear as tool badges.
 *  0.18–0.43  Relate: only the supplied relationships are drawn, anchored to
 *             the elements' edges; plain relations carry no arrowhead. Each
 *             caption sits beside its own line (never on it, never on another
 *             caption), and element captions keep clear of every connector.
 *  0.43–0.75  Trace: a tracer follows the supplied traversal order and the
 *             focus element enlarges (documents: the layers spread wider).
 *             Passing documents → index pairs every layer with its entry
 *             (colour-matched); passing index → pen ticks the entries of the
 *             documents that are present; reaching the stamp marks the
 *             registry box of the index.
 *  0.75–1.00  Gather: the tracer leaves; hinge, layers, ticked index and stamp
 *             mark stay visible with a legend of the relation kinds used.
 * An absent document (optional) stays as a dashed layer; its entry is paired
 * but never ticked. No causal arrow unless a relationship says 'causal'.
 * @module animations/documents/LAW-0010
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mechanismFields, int, str} from '../../schemas/fields.js';
import {chip, statusTag, textBlock} from '../../primitives/annotate.js';
import {pen, stampTool, shade} from '../../primitives/paper.js';
import {iconBadge} from '../../primitives/badges.js';
import {edgeAnchor, circleAnchor} from '../../core/geometry.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {caseFileFields, CASE_STRINGS, docSheet, ghostSheet, indexSheet, folderArt, layerColors, onColor} from './kits/apertura-de-expediente.js';

const ID = 'LAW-0010';
const DURATION = 7000;
const IDS = ['cover', 'folder', 'documents', 'index', 'pen', 'stamp'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
/** Oblique projection: depth recedes up-right. */
const KX = 0.55, KY = 0.42;
/** Sheet-local art sizes (same artwork as the desk kit). */
const DW = 370, DH = 480, FW = 430, FH = 560;
const OPEN = 125; // cover angle in the exploded view (degrees)

const sceneSchema = {
  ...caseFileFields,
  ...mechanismFields(IDS),
  absentDocument: int('Index of a document listed in the index but absent from the file (-1 = none); its layer stays dashed and its entry is not ticked', -1, 4),
  stampLabel: str('Text of the opening stamp mark on the index', 24),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'EXP-0417',
  documentTitle: 'Registration request',
  clauses: ['Application form', 'Identity document copy', 'Supporting letter', 'Fee receipt (hypothetical)'],
  signers: [{name: 'Dana Ruiz', role: 'Clerk'}, {name: 'Sam Okafor', role: 'Applicant'}],
  redactions: [],
  elements: [
    {id: 'cover', label: 'Front cover'},
    {id: 'folder', label: 'Folder and file number'},
    {id: 'documents', label: 'Documents in layers'},
    {id: 'index', label: 'Index sheet'},
    {id: 'pen', label: 'Pen'},
    {id: 'stamp', label: 'Opening stamp'},
  ],
  relationships: [
    {from: 'cover', to: 'folder', kind: 'relation', label: 'hinged to'},
    {from: 'folder', to: 'documents', kind: 'relation', label: 'holds in layers'},
    {from: 'documents', to: 'index', kind: 'relation', label: 'one entry per layer'},
    {from: 'index', to: 'pen', kind: 'sequence', label: 'checked with'},
    {from: 'pen', to: 'stamp', kind: 'sequence', label: 'then stamped'},
  ],
  focusElement: 'documents',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['cover', 'folder', 'documents', 'index', 'pen', 'stamp'],
  absentDocument: -1,
  stampLabel: 'OPENED',
};

/**
 * Hand-placed composition per shape. O = front-left corner of the back cover
 * on screen; W/D = plate width / receding depth; zd0 + span = heights of the
 * lowest and highest document layers; card = [cx, cy, scale]; legend = its
 * preferred centre. Element positions leave every connector long enough to
 * carry its caption with the line visible on both sides of it:
 *  - landscape: a clockwise sweep — cover (left) → folder (bottom) → layers
 *    (centre) → index card (right) → pen (top right) → stamp (bottom right);
 *  - square: index card top right, pen and stamp stepping down below it;
 *  - portrait: index card top left, pen and stamp down the right column.
 */
const PL = {
  // wide design space: the 16:9 caption-safe box is ~2.1:1, so extra width costs no scale
  landscape: {size: [2300, 1080], O: [360, 945], Wf: 560, Df: 390, Wd: 496, Dd: 336, zd0: 330, span: 220, card: [1680, 450, 0.82], pen: [2090, 200], stamp: [2090, 800], badgeR: 60, legend: [1680, 1050], chipSize: 28, chipMax: 250},
  square: {size: [1580, 1330], O: [310, 1150], Wf: 480, Df: 330, Wd: 430, Dd: 290, zd0: 330, span: 230, card: [1330, 300, 0.8], pen: [1170, 770], stamp: [1440, 1030], badgeR: 58, legend: [790, 1305], chipSize: 26, chipMax: 250},
  portrait: {size: [960, 1720], O: [300, 1480], Wf: 460, Df: 300, Wd: 410, Dd: 262, zd0: 280, span: 200, card: [262, 395, 0.72], pen: [790, 195], stamp: [790, 545], badgeR: 60, legend: [480, 1695], chipSize: 26, chipMax: 250},
};

const mstr = m => `matrix(${r(m.a, 4)} ${r(m.b, 4)} ${r(m.c, 4)} ${r(m.d, 4)} ${r(m.e)} ${r(m.f)})`;
/** Matrix mapping sheet-local (u right, v down; v = 0 is the back edge) onto an oblique plate. */
function oblique(o, sheetW, sheetH, W, D, theta = 0) {
  const sx = W / sheetW, sd = D / sheetH;
  const c = Math.cos((theta * Math.PI) / 180), s = Math.sin((theta * Math.PI) / 180);
  return {a: sx * c, b: -sx * s, c: -KX * sd, d: KY * sd, e: o.x + D * KX, f: o.y - D * KY};
}
const apply = (m, u, v) => ({x: m.a * u + m.c * v + m.e, y: m.b * u + m.d * v + m.f});
const lerpM = (m1, m2, t) => ({a: lerp(m1.a, m2.a, t), b: lerp(m1.b, m2.b, t), c: lerp(m1.c, m2.c, t), d: lerp(m1.d, m2.d, t), e: lerp(m1.e, m2.e, t), f: lerp(m1.f, m2.f, t)});
const quadPath = pts => `M${pts.map(p => `${r(p.x)} ${r(p.y)}`).join('L')}Z`;

const scene = {
  sizes: {landscape: PL.landscape.size, square: PL.square.size, portrait: PL.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const Pl = PL[ctx.view.shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const colors = layerColors(th);
    const docs = p.clauses.map((title, i) => ({title, redacted: p.redactions.includes(i)}));
    const n = docs.length;
    const absent = p.absentDocument < n ? p.absentDocument : -1;
    const showAll = ctx.show('all');

    // ---- plates
    const O = {x: Pl.O[0], y: Pl.O[1]};
    const {Wf, Df, Wd, Dd} = Pl;
    const Od = {x: O.x + (Wf - Wd) / 2 + ((Df - Dd) / 2) * KX, y: O.y - ((Df - Dd) / 2) * KY};
    const gap = n > 1 ? Pl.span / (n - 1) : 0;
    const zCompact = j => 8 + j * 5;
    const zExploded = j => Pl.zd0 + j * gap;
    const zCover = zCompact(n + 1);
    const Mf = oblique(O, FW, FH, Wf, Df);
    const Md = oblique(Od, DW, DH, Wd, Dd);
    const folder = folderArt(ctx, {prefix: 'm-fold', fw: FW, fh: FH, number: '', title: '', applicantLine: '', showText: false});
    const tabOut = (FW - DW) / 2 + 36;
    const tabH = Math.min(DH * 0.13, (DH * 0.74) / 5 - 8);
    const tabOf = j => ({y: DH * 0.09 + j * (tabH + 8), h: tabH, out: tabOut});
    const stripH = Math.min(62, DH * 0.13);
    const kinds = ['form', 'letter', 'table', 'photo', 'letter'];
    const plateQuad = (m, w, hh) => [apply(m, 0, 0), apply(m, w, 0), apply(m, w, hh), apply(m, 0, hh)];
    const docQuad = plateQuad(Md, DW, DH);
    const thickness = (quad, tk, fill) => h('path', {d: quadPath([quad[3], quad[2], {x: quad[2].x, y: quad[2].y + tk}, {x: quad[3].x, y: quad[3].y + tk}]) + quadPath([quad[2], quad[1], {x: quad[1].x, y: quad[1].y + tk}, {x: quad[2].x, y: quad[2].y + tk}]), fill, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'});
    const plates = docs.map((d, j) => {
      const color = colors[j % colors.length];
      const art = j === absent
        ? ghostSheet(ctx, {name: `m-ghost`, w: DW, h: DH, num: j + 1, title: d.title, redacted: d.redacted, stripH, tab: tabOf(j), showText: false})
        : docSheet(ctx, {name: `m-sheet-${j}`, w: DW, h: DH, num: j + 1, title: d.title, redacted: d.redacted, color, kind: kinds[j % kinds.length], stripH, tab: tabOf(j), showText: false, seed: `case-doc-${j}`}).node;
      const tabC = apply(Md, DW + tabOut / 2 + 3, tabOf(j).y + tabOf(j).h / 2);
      let num = null;
      if (showAll) {
        const f = ctx.fit(String(j + 1), {maxWidth: 40, size: 24, minSize: 14, maxLines: 1, weight: 800});
        num = textBlock(f, {x: tabC.x, y: tabC.y - f.size * 0.54, anchor: 'middle', fill: j === absent ? th.inkSoft : onColor(ctx, color)});
      }
      return g({name: `pl-doc-${j}`},
        j === absent ? null : thickness(docQuad, 4, shade('#fffdf8', -0.12)),
        g({transform: mstr(Md)}, art),
        h('path', {name: `hl-plate-${j}`, d: quadPath(docQuad), fill: 'none', stroke: j === absent ? th.inkSoft : color, 'stroke-width': 7, 'stroke-linejoin': 'round', 'stroke-dasharray': j === absent ? '12 9' : null, opacity: 0}),
        num);
    });
    const folderQuad = plateQuad(Mf, FW, FH);

    // ---- index card (morphs from the top of the stack to a readable card)
    const idx = indexSheet(ctx, {
      prefix: 'm-idx', w: DW, h: DH, number: p.documentId, title: p.documentTitle,
      applicant: p.signers[1].role ? `${p.signers[1].role}: ${p.signers[1].name}` : p.signers[1].name,
      entries: docs.map((d, j) => ({title: d.title, redacted: d.redacted, color: colors[j % colors.length]})),
      showText: showAll, strings: t, stampLabel: p.stampLabel, withStamp: true,
    });
    const [ccx, ccy, cs] = Pl.card;
    const Mcard = {a: cs, b: 0, c: 0, d: cs, e: ccx - (DW * cs) / 2, f: ccy - (DH * cs) / 2};
    const cardBox = {x: Mcard.e, y: Mcard.f, w: DW * cs, h: DH * cs};
    const entryHl = idx.rows.map((row, j) => h('rect', {name: `hl-entry-${j}`, x: r(row.x - 8), y: r(row.y + 2), width: r(row.w + 16), height: r(row.h - 4), rx: 8, fill: j === absent ? th.inkFaint : colors[j % colors.length], opacity: 0}));

    // ---- tool badges (their captions are placed below with the other labels)
    const penIcon = g({transform: T(-40, 36, -44)}, pen(ctx, {name: 'm-pen-icon', length: 120, body: th.accent2}).node);
    const stampIcon = g({transform: T(0, 2)}, stampTool(ctx, {name: 'm-stamp-icon', size: Pl.badgeR * 0.95, color: th.accent}));
    const penB = iconBadge(ctx, {name: 'el-pen', x: Pl.pen[0], y: Pl.pen[1], radius: Pl.badgeR, icon: penIcon});
    const stampB = iconBadge(ctx, {name: 'el-stamp', x: Pl.stamp[0], y: Pl.stamp[1], radius: Pl.badgeR, icon: stampIcon});

    // ---- element boxes (exploded state) for edge-anchored connectors
    const Mc = oblique(O, FW, FH, Wf, Df, OPEN);
    const McZ = {...Mc, f: Mc.f - zCover};
    const coverQuad = plateQuad(McZ, FW, FH);
    // the cover's connector anchor sits on the lid, a little away from its hinge
    const coverA = apply(McZ, FW * 0.22, FH * 0.3);
    const inner = (o, W, D, z) => ({x: o.x + D * KX, y: o.y - D * KY - z, w: W - D * KX, h: D * KY});
    const fBox = inner(O, Wf, Df, 0);
    const bbox = pts => {
      const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
      return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
    };
    // a slanted plate is approximated by horizontal slices (its bbox would
    // block all the free space beside the diagonal)
    const slices = (quad, k) => {
      const ys = quad.map(q => q.y);
      const y0 = Math.min(...ys), y1 = Math.max(...ys);
      const out = [];
      for (let i = 0; i < k; i++) {
        const a = y0 + ((y1 - y0) * i) / k, b = y0 + ((y1 - y0) * (i + 1)) / k;
        const xs = [];
        for (let e = 0; e < 4; e++) {
          const P0 = quad[e], P1 = quad[(e + 1) % 4];
          for (const yy of [a, b]) {
            if ((P0.y - yy) * (P1.y - yy) <= 0 && P0.y !== P1.y) xs.push(P0.x + ((yy - P0.y) / (P1.y - P0.y)) * (P1.x - P0.x));
          }
          if (P0.y >= a && P0.y <= b) xs.push(P0.x);
        }
        if (xs.length) out.push({x: Math.min(...xs), y: a, w: Math.max(...xs) - Math.min(...xs), h: b - a});
      }
      return out;
    };
    const topQuad = docQuad.map(q => ({x: q.x, y: q.y - zExploded(n - 1)}));
    const botQuad = docQuad.map(q => ({x: q.x, y: q.y - zExploded(0)}));
    const tabExt = tabOut * (Wd / DW);
    const stackBox = bbox([...topQuad, ...botQuad, {x: botQuad[1].x + tabExt, y: botQuad[1].y}]);
    // the stack's real footprint (slanted layers swept from the lowest to the
    // highest position, tabs included) as horizontal slices, for label placement
    const stackSlices = (() => {
      const k = 8;
      const tabbed = [docQuad[0], {x: docQuad[1].x + tabExt, y: docQuad[1].y}, {x: docQuad[2].x + tabExt, y: docQuad[2].y}, docQuad[3]];
      const out = [];
      for (let i = 0; i < k; i++) {
        const y0 = stackBox.y + (stackBox.h * i) / k, y1 = stackBox.y + (stackBox.h * (i + 1)) / k;
        let lo = Infinity, hi = -Infinity;
        for (let zi = 0; zi <= 8; zi++) {
          const z = lerp(zExploded(0), zExploded(n - 1), zi / 8);
          for (const b of slices(tabbed.map(q => ({x: q.x, y: q.y - z})), 6)) {
            if (b.y < y1 && b.y + b.h > y0) { lo = Math.min(lo, b.x); hi = Math.max(hi, b.x + b.w); }
          }
        }
        if (hi > lo) out.push({x: lo, y: y0, w: hi - lo, h: y1 - y0});
      }
      return out;
    })();

    const elements = {
      cover: {circle: {x: coverA.x, y: coverA.y, r: 30}},
      folder: {box: fBox},
      // connector box of the layers: tabs excluded, so its right edge is the
      // line of the layers' back-right corners (an anchor there lands on paper)
      documents: {box: {x: stackBox.x, y: stackBox.y, w: stackBox.w - tabExt, h: stackBox.h}},
      index: {box: cardBox},
      pen: {circle: penB.circle},
      stamp: {circle: stampB.circle},
    };

    // ---- connector geometry (same anchors and bend as relationGraph) so the
    // element labels can be kept off the connectors and their ends
    const centerOf = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
    const anchorOf = (e, toward, pad) => (e.circle ? circleAnchor(e.circle, e.circle.r + pad, toward) : edgeAnchor(e.box, toward, pad));
    const bendOf = rel => (rel.kind === 'sequence' ? -0.16 : 0.12);
    const chords = [];
    const curves = p.relationships.filter(rel => elements[rel.from] && elements[rel.to]).map(rel => {
      const A = elements[rel.from], B = elements[rel.to];
      const a = anchorOf(A, centerOf(B), 8), b = anchorOf(B, centerOf(A), rel.kind === 'relation' ? 8 : 14);
      chords.push(Math.hypot(b.x - a.x, b.y - a.y));
      const dx = b.x - a.x, dy = b.y - a.y, k = bendOf(rel);
      const c1 = {x: a.x + dx * 0.3 - dy * k, y: a.y + dy * 0.3 + dx * k};
      const c2 = {x: a.x + dx * 0.7 - dy * k, y: a.y + dy * 0.7 + dx * k};
      return [...Array(33).keys()].map(i => {
        const q = i / 32, m = 1 - q;
        return {x: m * m * m * a.x + 3 * m * m * q * c1.x + 3 * m * q * q * c2.x + q * q * q * b.x, y: m * m * m * a.y + 3 * m * m * q * c1.y + 3 * m * q * q * c2.y + q * q * q * b.y};
      });
    });
    const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
    const onCurve = (bx, pad = 12) => curves.some(pts => pts.some(q => q.x > bx.x - pad && q.x < bx.x + bx.w + pad && q.y > bx.y - pad && q.y < bx.y + bx.h + pad));
    const inFrame = bx => bx.x >= 6 && bx.y >= 6 && bx.x + bx.w <= S.w - 6 && bx.y + bx.h <= S.h - 6;
    // solid objects first; every placed label joins the list
    const circleBox = (c, k = 1.28) => ({x: c.x - c.r * k, y: c.y - c.r * k, w: c.r * k * 2, h: c.r * k * 2});
    const taken = [...stackSlices, cardBox, ...slices(coverQuad, 6), bbox([...folderQuad, {x: folderQuad[3].x, y: folderQuad[3].y + 12}]), circleBox(penB.circle), circleBox(stampB.circle)];
    const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    /** Penalty of a label box: connector samples it covers, overlap with objects/labels, leaving the frame. */
    // text over text is the worst case, then text over a connector, then over artwork
    const labelBoxes = [];
    const badness = (bx, own = -1) => curves.reduce((acc, pts, ci) => (ci === own ? acc : acc + pts.filter(q => q.x > bx.x - 12 && q.x < bx.x + bx.w + 12 && q.y > bx.y - 12 && q.y < bx.y + bx.h + 12).length * 400), 0)
      + taken.reduce((acc, q) => acc + area(bx, q), 0) + labelBoxes.reduce((acc, q) => acc + area(bx, q) * 20, 0) + (inFrame(bx) ? 0 : 1e7);
    /** First candidate whose chip clears connectors, objects and labels (else the least bad one). */
    const place = (make, cands) => {
      let best = null, bestBad = Infinity;
      for (const c of cands) {
        const probe = make(c.x, 0, c.anchor);
        const y = c.v === 'bottom' ? c.y - probe.box.h : c.v === 'middle' ? c.y - probe.box.h / 2 : c.y;
        const lab = make(c.x, y, c.anchor);
        if (inFrame(lab.box) && !onCurve(lab.box) && !taken.some(q => overlaps(lab.box, q, 6))) {
          taken.push(lab.box);
          labelBoxes.push(lab.box);
          return lab;
        }
        const bad = badness(lab.box);
        if (bad < bestBad) { best = lab; bestBad = bad; }
      }
      taken.push(best.box);
      labelBoxes.push(best.box);
      return best;
    };

    // ---- element labels
    const labSize = 30;
    const labs = {};
    let flag = null;
    let tag = null;
    const cq = bbox(coverQuad);
    if (ctx.show('key')) {
      const lab = (text, name, maxWidth, size = labSize) => (x, y, anchor) => chip(ctx, text, {x, y, anchor, maxWidth, size, maxLines: 2, name});
      const R = Pl.badgeR * 1.28 + 8;
      const badgeCands = c => [
        {x: c.x, y: c.y + R, anchor: 'middle', v: 'top'},
        {x: c.x, y: c.y - R, anchor: 'middle', v: 'bottom'},
        {x: c.x - R, y: c.y, anchor: 'end', v: 'middle'},
        {x: c.x + R, y: c.y, anchor: 'start', v: 'middle'},
        {x: c.x - R * 0.55, y: c.y + R * 0.75, anchor: 'end', v: 'top'},
        {x: c.x + R * 0.55, y: c.y + R * 0.75, anchor: 'start', v: 'top'},
        {x: c.x - R * 0.55, y: c.y - R * 0.75, anchor: 'end', v: 'bottom'},
        {x: c.x + R * 0.55, y: c.y - R * 0.75, anchor: 'start', v: 'bottom'},
      ];
      labs.cover = place(lab(label('cover'), 'lab-cover', ctx.view.shape === 'portrait' ? 300 : 340), [
        {x: cq.x + cq.w * 0.42, y: cq.y - 12, anchor: 'middle', v: 'bottom'},
        {x: cq.x + 8, y: cq.y - 12, anchor: 'start', v: 'bottom'},
      ]);
      labs.folder = place(lab(label('folder'), 'lab-folder', 440), [
        {x: O.x + Wf * 0.55, y: O.y + 18, anchor: 'middle', v: 'top'},
        {x: O.x + Wf * 0.35, y: O.y + 18, anchor: 'middle', v: 'top'},
      ]);
      // room for the top layer rising when the tracer's focus spreads the layers
      const liftRoom = 0.32 * Pl.span * (p.focusElement === 'documents' ? 1 : 0.35) * (ctx.reduced ? 0.5 : 1);
      const dy = stackBox.y - 14 - liftRoom;
      labs.documents = place(lab(label('documents'), 'lab-documents', 440), [
        ...[0.55, 0.4, 0.7, 0.25].map(f => ({x: stackBox.x + stackBox.w * f, y: dy, anchor: 'middle', v: 'bottom'})),
        {x: Math.min(S.w - 10, stackBox.x + stackBox.w), y: dy, anchor: 'end', v: 'bottom'},
        {x: stackBox.x, y: dy, anchor: 'start', v: 'bottom'},
      ]);
      labs.index = place(lab(label('index'), 'lab-index', Math.max(300, cardBox.w + 40)), [
        {x: ccx, y: cardBox.y + cardBox.h + 14, anchor: 'middle', v: 'top'},
        {x: ccx, y: cardBox.y - 14, anchor: 'middle', v: 'bottom'},
        {x: cardBox.x - 14, y: cardBox.y + cardBox.h * 0.2, anchor: 'end', v: 'middle'},
        {x: cardBox.x + cardBox.w + 14, y: cardBox.y + cardBox.h * 0.2, anchor: 'start', v: 'middle'},
      ]);
      labs.pen = place(lab(label('pen'), 'lab-pen', 260, 26), badgeCands(penB.circle));
      labs.stamp = place(lab(label('stamp'), 'lab-stamp', 260, 26), badgeCands(stampB.circle));
      // descriptive state tag for the laid-out layers, above their label
      const db = labs.documents.box;
      tag = place((x, y, anchor) => statusTag(ctx, t.laidOut, {x, y, anchor, size: 26, name: 'tag-layers', color: th.accent4, opacity: 0}), [
        {x: db.cx, y: db.y - 10, anchor: 'middle', v: 'bottom'},
        {x: db.x + db.w, y: db.y - 10, anchor: 'end', v: 'bottom'},
        {x: db.x, y: db.y - 10, anchor: 'start', v: 'bottom'},
        {x: db.x + db.w + 14, y: db.cy, anchor: 'start', v: 'middle'},
        {x: db.x - 14, y: db.cy, anchor: 'end', v: 'middle'},
      ]);
    }
    // file-number flag beside the folder label (upright, readable)
    if (showAll) {
      const fb = labs.folder ? labs.folder.box : null;
      flag = place((x, y, anchor) => chip(ctx, p.documentId, {x, y, anchor, maxWidth: 260, size: 24, maxLines: 1, family: 'mono', fill: '#f3e3bf', name: 'flag-number'}), fb
        ? [{x: fb.x + fb.w + 12, y: fb.y + 5, anchor: 'start', v: 'top'}, {x: fb.x - 12, y: fb.y + 5, anchor: 'end', v: 'top'}, {x: fb.cx, y: fb.y + fb.h + 8, anchor: 'middle', v: 'top'}]
        : [{x: O.x + Wf * 0.55, y: O.y + 22, anchor: 'middle', v: 'top'}]);
    }

    const obstacles = [...stackSlices, ...slices(coverQuad, 6), bbox([...folderQuad, {x: folderQuad[3].x, y: folderQuad[3].y + 12}]), cardBox,
      ...Object.values(labs).map(l => l.box), flag && flag.box, tag && tag.box].filter(Boolean);
    // relationGraph draws the connectors and the tracer route; the captions of
    // the relations are placed here instead (beside their own line, never on
    // it, clear of every other connector, object and label)
    const graphCtx = {...ctx, show: level => (level === 'all' ? false : ctx.show(level))};
    const graph = relationGraph(graphCtx, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, obstacles, bend: bendOf});
    const relLabels = graph.conns.map((x, i) => {
      if (!showAll) return null;
      const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
      const make = (cx, cy) => chip(ctx, text, {x: cx, y: cy, anchor: 'middle', maxWidth: Pl.chipMax, size: Pl.chipSize, maxLines: 3, fill: th.card, stroke: kindColor(ctx, x.rel.kind), name: `rl-${i}`, weight: 600});
      const probe = make(0, 0);
      const {w: lw, h: lh} = probe.box;
      const cands = [];
      for (const tt of [0.5, 0.4, 0.6, 0.32, 0.68, 0.25, 0.75]) {
        const q = x.c.at(tt);
        const q2 = x.c.at(Math.min(1, tt + 0.02)), q1 = x.c.at(Math.max(0, tt - 0.02));
        const len = Math.hypot(q2.x - q1.x, q2.y - q1.y) || 1;
        const nx = -(q2.y - q1.y) / len, ny = (q2.x - q1.x) / len;
        const off = Math.abs(nx) * lw / 2 + Math.abs(ny) * lh / 2 + 12;
        for (const sg of [1, -1]) cands.push({x: q.x + nx * off * sg, y: q.y + ny * off * sg});
      }
      let best = null, bestBad = Infinity;
      for (const c of cands) {
        const lab = make(c.x, c.y - lh / 2);
        if (inFrame(lab.box) && !onCurve(lab.box, 6) && !taken.some(q => overlaps(lab.box, q, 6))) { best = lab; bestBad = 0; break; }
        const bad = badness(lab.box);
        if (bad < bestBad) { best = lab; bestBad = bad; }
      }
      if (bestBad > 0) {
        // last resort: a caption sitting ON its own line (classic edge label)
        for (const tt of [0.5, 0.4, 0.6]) {
          const q = x.c.at(tt);
          const lab = make(q.x, q.y - lh / 2);
          const bad = 2000 + badness(lab.box, i);
          if (bad < bestBad) { best = lab; bestBad = bad; }
        }
      }
      taken.push(best.box);
      labelBoxes.push(best.box);
      return best;
    });
    const route = graph.route(p.traversalOrder);
    // every caption (element, relation, flag, tag) is clear of every other one
    let labelOverlaps = 0;
    labelBoxes.forEach((a, i) => labelBoxes.forEach((b, j) => { if (j > i && overlaps(a, b, 0)) labelOverlaps++; }));
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    // connector endpoints must land on their elements (acceptance check)
    const onElement = (id, q) => {
      const e = elements[id];
      if (e.circle) return Math.hypot(q.x - e.circle.x, q.y - e.circle.y) <= e.circle.r + 16;
      const b = e.box;
      return q.x >= b.x - 16 && q.x <= b.x + b.w + 16 && q.y >= b.y - 16 && q.y <= b.y + b.h + 16;
    };
    const anchorsOk = graph.conns.every(x => onElement(x.rel.from, x.c.from) && onElement(x.rel.to, x.c.to));
    // element labels never sit on a connector (its line or its ends)
    const labelsOnConnectors = [...Object.entries(labs), ['tag', tag], ['flag', flag]].filter(([, l]) => l && onCurve(l.box, 0)).map(([id]) => id);

    const usedKinds = [...new Set(p.relationships.map(x => x.kind))];
    let legend = null;
    if (showAll) {
      const cands = [Pl.legend, [S.w / 2, S.h - 24], [S.w * 0.3, S.h - 24], [S.w * 0.7, S.h - 24]];
      const relBoxes = relLabels.filter(Boolean).map(x => x.box);
      for (const [lx, ly] of cands) {
        const lg = legendNode(ctx, usedKinds, p.relationLabels, {x: lx, y: ly});
        if (!legend) legend = lg;
        if (inFrame(lg.box) && ![...taken, ...relBoxes].some(q => overlaps(lg.box, q, 8))) { legend = lg; break; }
      }
    }

    return {S, s, ox, oy, n, absent, plates, folder, Mf, Md, Mc, O, folderQuad, idx, Mcard, entryHl, penB, stampB, labs, flag, graph, relLabels, route, visitT, legend: legend && legend.node, tag,
      zCompact, zExploded, zCover, gap, anchorsOk, labelsOnConnectors, shortestConnector: Math.round(Math.min(...chords)), connectorLengths: chords.map(c => Math.round(c)), labelOverlaps, usedKinds, stackBox, cardBox};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const fq = L.folderQuad;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      // back cover (static) with thickness
      g({name: 'pl-folder'},
        h('path', {d: quadPath([fq[3], fq[2], {x: fq[2].x, y: fq[2].y + 12}, {x: fq[3].x, y: fq[3].y + 12}]) + quadPath([fq[2], fq[1], {x: fq[1].x, y: fq[1].y + 12}, {x: fq[2].x, y: fq[2].y + 12}]), fill: shade('#d4b16e', -0.25), stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
        g({transform: mstr(L.Mf)}, L.folder.back, L.folder.tabText)),
      L.plates,
      g({name: 'pl-index'}, L.idx.node, L.entryHl),
      g({name: 'pl-cover'},
        g({name: 'pl-cover-out'}, L.folder.outside),
        g({name: 'pl-cover-in', opacity: 0}, L.folder.inside)),
      L.graph.node,
      L.flag && L.flag.node,
      L.penB.node, L.stampB.node,
      Object.values(L.labs).map(l => l.node),
      L.relLabels.filter(Boolean).map(l => l.node),
      L.tag && L.tag.node,
      L.graph.tracerNode('tracer'),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    const n = L.n;

    // 1) separate
    const theta = OPEN * ease.inOutCubic(seg(u, 0.02, 0.12));
    const lift = ease.inOutCubic(seg(u, 0.06, 0.17));
    const morph = ease.inOutCubic(seg(u, 0.08, 0.18));
    const appear = seg(u, 0.1, 0.18);
    const Mc = oblique(L.O, FW, FH, PL[ctx.view.shape].Wf, PL[ctx.view.shape].Df, theta);
    const McZ = {...Mc, f: Mc.f - L.zCover};
    const det = McZ.a * McZ.d - McZ.b * McZ.c;
    nodes['pl-cover'] = {transform: mstr(McZ)};
    nodes['pl-cover-out'] = {opacity: det >= 0 ? 1 : 0};
    nodes['pl-cover-in'] = {opacity: det < 0 ? 1 : 0};
    for (const id of ['pen', 'stamp']) nodes[`el-${id}`] = {opacity: r(appear, 3)};
    for (const [id, l] of Object.entries(L.labs)) nodes[`lab-${id}`] = {opacity: r(id === 'folder' || id === 'cover' ? seg(u, 0.1, 0.18) : appear, 3)};
    if (L.flag) nodes['flag-number'] = {opacity: r(seg(u, 0.04, 0.12), 3)};

    // 2) relations drawn one by one
    const rels = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / rels, 0.18 + ((i + 1) * 0.25) / rels));
    Object.assign(nodes, L.graph.frame(relP));
    L.relLabels.forEach((l, i) => { if (l) nodes[`rl-${i}`] = {opacity: r(clamp((relP(i) - 0.55) / 0.45), 3)}; });

    // 3) tracer
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.78;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.09);
    };
    const focusK = id => ease.inOutSine(pulse(id)) * (id === p.focusElement ? 1 : 0.35) * (reduced ? 0.5 : 1);
    // documents enlarge by spreading their layers
    const spreadK = 1 + 0.32 * focusK('documents');
    const zs = [];
    for (let j = 0; j < n; j++) {
      const z = lerp(L.zCompact(j), L.zExploded(0) + (L.zExploded(j) - L.zExploded(0)) * spreadK, lift);
      zs.push(z);
      nodes[`pl-doc-${j}`] = {transform: T(0, -z)};
    }
    const cardScale = 1 + 0.16 * focusK('index');
    const Mtop = {...L.Md, f: L.Md.f - L.zCompact(n)};
    const Mi = lerpM(Mtop, L.Mcard, morph);
    const cc = {x: L.cardBox.x + L.cardBox.w / 2, y: L.cardBox.y + L.cardBox.h / 2};
    nodes['pl-index'] = {transform: `${scaleAbout(cc.x, cc.y, morph >= 1 ? cardScale : 1)} ${mstr(Mi)}`};
    const fk = 1 + 0.08 * focusK('folder');
    const fc = {x: L.O.x + 300, y: L.O.y - 80};
    nodes['pl-folder'] = {transform: fk !== 1 ? scaleAbout(fc.x, fc.y, fk) : ''};
    for (const id of ['pen', 'stamp']) nodes[`el-${id}-body`] = {transform: scaleAbout(0, 0, 1 + 0.25 * focusK(id))};

    // pairing documents ↔ index entries while the tracer reaches the index
    const ti = L.visitT.index;
    const td = L.visitT.documents;
    const gathered = u >= 0.75;
    let pairWin = null;
    if (ti !== undefined) pairWin = td !== undefined && td < ti ? [Math.max(td, ti - 0.16), ti] : [ti, Math.min(1, ti + 0.12)];
    let pairing = -1;
    for (let j = 0; j < n; j++) {
      let k = 0;
      let done = gathered;
      if (pairWin) {
        const a = lerp(pairWin[0], pairWin[1], j / n), b = lerp(pairWin[0], pairWin[1], (j + 1) / n);
        const local = tracerOn ? seg(tt, a, b) : 0;
        k = local > 0 && local < 1 ? Math.sin(Math.PI * local) : 0;
        if (k > 0) pairing = j;
        done = done || (tracerOn && tt >= b);
      }
      nodes[`hl-entry-${j}`] = {opacity: r(0.32 * k, 3)};
      nodes[`hl-plate-${j}`] = {opacity: r(Math.max(k, done ? 0.55 : 0), 3)};
    }
    // ticks while the tracer runs index → pen; stamp mark when it reaches the stamp
    const present = [...Array(n).keys()].filter(j => j !== L.absent);
    const tpen = L.visitT.pen;
    let tickWin = null;
    if (ti !== undefined) tickWin = tpen !== undefined && tpen > ti ? [ti + 0.005, tpen] : [ti, Math.min(1, ti + 0.12)];
    const ticks = [...Array(n)].map(() => 0);
    present.forEach((j, i) => {
      let v = gathered ? 1 : 0;
      if (!gathered && tickWin && tracerOn) {
        const a = lerp(tickWin[0], tickWin[1], i / present.length), b = lerp(tickWin[0], tickWin[1], (i + 1) / present.length);
        v = seg(tt, a, b);
      }
      ticks[j] = v;
    });
    Object.assign(nodes, L.idx.frameTicks(ticks));
    const ts = L.visitT.stamp;
    const stamped = gathered || (ts !== undefined && tracerOn && tt >= ts - 0.005);
    nodes['m-idx-impr'] = {opacity: stamped ? 0.92 : 0};

    // 4) gather: states labelled (descriptive only)
    if (L.tag) nodes['tag-layers'] = {opacity: r(seg(u, 0.8, 0.88), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        coverAngle: r(theta, 2),
        layerLift: r(lift, 3),
        topLayer: {x: 0, y: r(-zs[n - 1])},
        indexCard: r(morph, 3),
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        visitOrder: L.route.visits.map(v => v.id),
        pairing,
        ticks: ticks.map(v => r(v, 3)),
        stampApplied: stamped,
        focusElement: p.focusElement,
        anchorsOk: L.anchorsOk,
        labelsOnConnectors: L.labelsOnConnectors,
        shortestConnector: L.shortestConnector,
        connectorLengths: L.connectorLengths,
        labelOverlaps: L.labelOverlaps,
        kinds: L.usedKinds,
        arrowless: p.relationships.filter(x => x.kind === 'relation').length,
        absentDocument: L.absent,
      },
    };
  },
};

function legendNode(ctx, kinds, labels, at) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const size = 28;
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
  return {node: g({name: 'legend'}, parts), box: {x: at.x - total / 2, y: at.y - size * 0.6, w: total, h: size * 1.2}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-03-mechanism',
    title: 'Opening a case file — exploded layers and relations',
    titleEs: 'Apertura de expediente — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Apertura de expediente',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded oblique view: the cover swings open on its hinge, the documents float as separate layers above the back cover and the index turns into a readable card. Edge-anchored connectors state each supplied relationship by kind; a tracer follows the traversal order, pairs each layer with its index entry, ticks the entries present and marks the registry box.',
    tags: ['case file', 'exploded view', 'layers', 'index', 'relations', 'tracer', 'folder'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/apertura-de-expediente.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CASE_STRINGS,
  scene,
});
