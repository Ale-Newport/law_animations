/**
 * LAW-0038 — Custodia del original · mechanism
 *
 * Exploded custody diagram, split into two tinted zones:
 *  - CUSTODY: the archive box in a three-quarter cut (open top, lid standing
 *    on its hinge, a dashed slot where the original stands), the signed
 *    original lifted out above its slot, and the custody seal strip beside
 *    the box;
 *  - CIRCULATION: the grey working copy, the reader's pen and the working
 *    file the copy travels to.
 * Storyboard:
 *  0.00–0.18  separate: original and copy start as one stack between the
 *             zones; the copy slides out into the circulation zone and the
 *             original rises over the box slot; box, seal, pen and file appear.
 *  0.18–0.43  only the supplied relationships are drawn, edge-anchored and
 *             styled by kind (plain relation = dots, no arrow; sequence and
 *             communication = arrows; causal only if supplied).
 *  0.43–0.75  a tracer follows the supplied traversal order; the focus
 *             element swells as it passes; when the tracer reaches the copy
 *             the part that changes changes: the notes appear on the copy —
 *             the original is never written on.
 *  0.75–1.00  gather: the slot (a sheet-shaped ghost in the open box) lights
 *             up, then the original is lowered into it — its lower part hidden
 *             behind the box's front wall, its label block riding along; the
 *             links of the original follow the VISIBLE part of its edge (above
 *             the rim; their labels fade out and return once the path has
 *             settled), the "kept in" link hands
 *             over to a tag on the rim where the sheet enters the box; then
 *             the descriptive states (original unchanged / copy annotated).
 * @module animations/documents/LAW-0038
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag, LINK_STYLES} from '../../primitives/annotate.js';
import {pen} from '../../primitives/paper.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {roundRectPath, edgeAnchor, circleAnchor, polyline, cubicPolyline} from '../../core/geometry.js';
import {custodySheet, workFolder, custodyDocFields, custodyObjectLabels, CUSTODY_STRINGS} from './kits/custodia-del-original.js';
import {obliqueBox, sealStrip} from './kits/custodia-del-original-exploded.js';

const ID = 'LAW-0038';
const DURATION = 7000;
const IDS = ['original', 'box', 'seal', 'copy', 'pen', 'folder'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const sceneSchema = {
  ...custodyDocFields,
  ...mechanismFields(IDS),
  objectLabels: custodyObjectLabels,
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'DOC-214',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties', 'Goods (hypothetical)', 'Delivery terms'],
  signers: [{name: 'Alex Moreno', role: 'Custodian'}, {name: 'Sam Okafor', role: 'Reader'}],
  redactions: [],
  objectLabels: {box: 'Box 07 · Originals', seal: 'SEALED', copyMark: 'COPY', folder: 'Working file'},
  elements: [
    {id: 'original', label: 'Signed original'},
    {id: 'box', label: 'Archive box'},
    {id: 'seal', label: 'Custody seal'},
    {id: 'copy', label: 'Working copy'},
    {id: 'pen', label: 'Reader’s pen'},
    {id: 'folder', label: 'Working file'},
  ],
  relationships: [
    {from: 'original', to: 'box', kind: 'relation', label: 'kept in'},
    {from: 'seal', to: 'box', kind: 'relation', label: 'closes'},
    {from: 'original', to: 'copy', kind: 'sequence', label: 'reproduced as'},
    {from: 'copy', to: 'folder', kind: 'communication', label: 'circulates to'},
    {from: 'pen', to: 'copy', kind: 'relation', label: 'writes notes on'},
  ],
  focusElement: 'box',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['seal', 'box', 'original', 'copy', 'folder'],
};

const SHEET = {w: 240, h: 312};
/**
 * Gather: the original is lowered into its slot, standing in the box at
 * `scale`, with the lower `dip` of the sheet hidden behind the front wall.
 */
const GATHER = {scale: 0.9, dip: 0.3, slotLight: [0.76, 0.8], lower: [0.8, 0.9]};
/** Swell of an element as the tracer passes (focus element / others). */
const FOCUS_SWELL = 0.12, SWELL = 0.05;
/** Narrow frames: vertical gap between the box and the seal row below it. */
const SEAL_GAP = 56;
/**
 * Hand-placed components per shape (design units). box = front face size and
 * depth of the oblique box (its x is derived so that the placement ghost
 * stands right under the original); stack = where original and copy start as
 * one sheet pile. Every label and state tag stays inside its element's zone.
 */
const PLACES = {
  landscape: {
    // wide labels (the zone is wide, its height is what is scarce)
    size: [1900, 1060], sheet: [214, 278], original: [300, 290], box: {y: 716, w: 300, h: 176, d: 112}, seal: [826, 0], sealW: 200, sealDy: 0.28, labW: 460, custodyChipMax: 200,
    // a long pen label wraps narrow enough to sit right under the pen, clear of
    // the corridor the pen→copy label (and its leader) needs on its left
    penLabW: 280,
    copy: [1290, 330], pen: [1710, 230], folder: [1290, 840], stack: [880, 330],
    zones: [{x: 110, y: 64, w: 830, h: 948, key: 'custody'}, {x: 990, y: 64, w: 850, h: 948, key: 'circulation'}], legend: [975, 1036],
  },
  square: {
    size: [1400, 1330], column: true, sheet: [214, 278], original: [260, 300], box: {y: 762, w: 320, h: 170, d: 112}, seal: [582, 0], sealW: 176, sealBelow: true, sealRows: 2,
    copy: [900, 600], pen: [1262, 190], folder: [1040, 1060], stack: [698, 330],
    // the copy's label goes beside the sheet, leaving the pen→copy link free for its own label
    prefs: {copy: ['rightHigh', 'right', 'above', 'aboveRight', 'aboveLeft', 'left'], box: ['belowZoneLeft', 'belowLeft', 'below', 'leftLow'], seal: ['left', 'leftLow', 'leftHigh', 'below', 'above']},
    zones: [{x: 24, y: 56, w: 660, h: 1210, key: 'custody'}, {x: 712, y: 56, w: 664, h: 1210, key: 'circulation'}], legend: [700, 1300],
  },
  portrait: {
    // the custody zone is the wider one: its seal stands beside the box
    size: [960, 1440], column: true, sheet: [214, 278], original: [210, 360], box: {y: 800, w: 270, h: 150, d: 100}, seal: [490, 0], sealW: 160, sealBelow: true, sealRows: 3,
    // the pen sits up-right of the copy: the pen→copy link lands on the right end of the
    // copy's top edge, the copy's label sits on the left end
    // copy's label block sits at the column's left edge, narrow enough to leave the
    // sheet's upper-right corner free: a pen→copy link lands there (copyPort), so the
    // line never runs under the block
    copy: [770, 760], pen: [868, 170], penR: 64, penLabW: 184, copyLabW: 200, copyPort: true, folder: [770, 1180], folderSize: [300, 216], relChip: 21, labSize: 25, stack: [591, 380],
    prefs: {copy: ['aboveZoneLeft', 'aboveLeft', 'above', 'aboveRight', 'left', 'right'], box: ['belowZoneLeft', 'belowLeft', 'below', 'leftLow'], seal: ['left', 'leftLow', 'leftHigh', 'below', 'above']},
    zones: [{x: 18, y: 56, w: 566, h: 1330, key: 'custody'}, {x: 598, y: 56, w: 344, h: 1330, key: 'circulation'}], legend: [480, 1418],
  },
};
const ZONE_OF = {original: 'custody', box: 'custody', seal: 'custody', copy: 'circulation', pen: 'circulation', folder: 'circulation'};

const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/**
 * Ray c + t·v (t > 0) against a closed polygon: the largest t at which the ray
 * crosses an edge, i.e. where it finally leaves the shape (0 if it never does).
 */
function rayExit(poly, c, v) {
  let best = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x, ey = b.y - a.y;
    const den = v.x * ey - v.y * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a.x - c.x) * ey - (a.y - c.y) * ex) / den;
    const s = ((a.x - c.x) * v.y - (a.y - c.y) * v.x) / den;
    if (t > 0 && s >= -1e-9 && s <= 1 + 1e-9) best = Math.max(best, t);
  }
  return best;
}

/** Distance from a point to the outline of a polygon. */
function polyDist(poly, q) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const ex = b.x - a.x, ey = b.y - a.y;
    const k = clamp(((q.x - a.x) * ex + (q.y - a.y) * ey) / (ex * ex + ey * ey || 1));
    best = Math.min(best, Math.hypot(q.x - (a.x + ex * k), q.y - (a.y + ey * k)));
  }
  return best;
}

/**
 * Place a chip around a box: tries candidate sides in order and keeps the
 * first one that stays inside `bounds` and clear of every `avoid` box.
 */
function placeChip(make, box, avoid, bounds, prefs, gap = 14, own = null) {
  const cands = [];
  // straddling candidates may cover their own element's corner, never another
  const others = own ? avoid.filter(q => q !== own) : avoid;
  for (const side of prefs) {
    const probe = make({x: 0, y: 0, anchor: 'middle'}).box;
    const ch = probe.h, cw = probe.w;
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const at = {
      below: {x: cx, y: box.y + box.h + gap, anchor: 'middle'},
      above: {x: cx, y: box.y - gap - ch, anchor: 'middle'},
      // above, as centred as the bounds allow
      aboveFit: {x: Math.min(Math.max(cx - cw / 2, bounds.x), bounds.x + bounds.w - cw), y: box.y - gap - ch, anchor: 'start'},
      aboveZoneLeft: {x: bounds.x, y: box.y - gap - ch, anchor: 'start'},
      right: {x: box.x + box.w + gap, y: cy - ch / 2, anchor: 'start'},
      left: {x: box.x - gap, y: cy - ch / 2, anchor: 'end'},
      belowLeft: {x: box.x, y: box.y + box.h + gap, anchor: 'start'},
      belowZoneLeft: {x: bounds.x, y: box.y + box.h + gap, anchor: 'start'},
      belowRight: {x: box.x + box.w, y: box.y + box.h + gap, anchor: 'end'},
      aboveLeft: {x: box.x, y: box.y - gap - ch, anchor: 'start'},
      aboveRight: {x: box.x + box.w, y: box.y - gap - ch, anchor: 'end'},
      rightLow: {x: box.x + box.w + gap, y: box.y + box.h - ch, anchor: 'start'},
      leftLow: {x: box.x - gap, y: box.y + box.h - ch, anchor: 'end'},
      rightHigh: {x: box.x + box.w + gap, y: box.y, anchor: 'start'},
      leftHigh: {x: box.x - gap, y: box.y, anchor: 'end'},
      cornerTL: {x: box.x - gap * 2, y: box.y - ch * 0.55, anchor: 'start'},
      cornerTR: {x: box.x + box.w + gap * 2, y: box.y - ch * 0.55, anchor: 'end'},
      cornerBL: {x: box.x - gap * 2, y: box.y + box.h - ch * 0.45, anchor: 'start'},
      cornerBR: {x: box.x + box.w + gap * 2, y: box.y + box.h - ch * 0.45, anchor: 'end'},
    }[side];
    const c = make(at);
    const b = c.box;
    const e = 0.5; // rounding tolerance: a block budgeted to the zone's edge fits
    const inside = b.x >= bounds.x - e && b.y >= bounds.y - e && b.x + b.w <= bounds.x + bounds.w + e && b.y + b.h <= bounds.y + bounds.h + e;
    const pool = side.startsWith('corner') ? others : avoid;
    if (inside && !pool.some(q => overlaps(b, q, 6))) return Object.assign(c, {clear: true});
    if (inside) cands.push(c);
  }
  // nothing is fully clear: take the in-bounds candidate with the least overlap
  const area = b => avoid.reduce((sum, q) => {
    const w = Math.min(b.x + b.w, q.x + q.w) - Math.max(b.x, q.x), hh = Math.min(b.y + b.h, q.y + q.h) - Math.max(b.y, q.y);
    return sum + (w > 0 && hh > 0 ? w * hh : 0);
  }, 0);
  if (!cands.length) return Object.assign(make({x: box.x + box.w / 2, y: box.y + box.h + gap, anchor: 'middle'}), {clear: false, cost: Infinity});
  const best = cands.reduce((a, c) => (area(c.box) < area(a.box) ? c : a));
  return Object.assign(best, {clear: false, cost: area(best.box)});
}

/**
 * Tracer route through element ids over connectors built by several graphs:
 * follows a connector (either direction) when one links consecutive ids,
 * otherwise hops edge to edge. Returns the polyline and the arc-length
 * fraction at which each element is reached.
 */
function routeThrough(elements, conns, order) {
  const center = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
  const anchor = (e, toward) => (e.circle ? circleAnchor(e.circle, e.circle.r + 8, toward) : edgeAnchor(e.box, toward, 8));
  const pts = [];
  const visits = [];
  const push = q => pts.push({x: q.x, y: q.y});
  order.forEach((id, i) => {
    const e = elements[id];
    if (!e) return;
    const prev = i ? order[i - 1] : null;
    if (prev) {
      const link = conns.find(x => x && ((x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev)));
      if (link) {
        const fwd = link.rel.from === prev;
        push(fwd ? link.c.from : link.c.to);
        for (let k = 1; k <= 30; k++) push(link.c.at(fwd ? k / 30 : 1 - k / 30));
      } else if (elements[prev]) {
        push(anchor(elements[prev], center(e)));
        push(anchor(e, center(elements[prev])));
      }
    }
    push(center(e));
    visits.push({id, idx: pts.length - 1});
  });
  const poly = polyline(pts);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  return {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
}

/** Cubic connector geometry, same construction as primitives/annotate connector(). */
function curveGeom(from, to, bend) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const nx = -dy, ny = dx;
  const c1 = {x: from.x + dx * 0.3 + nx * bend, y: from.y + dy * 0.3 + ny * bend};
  const c2 = {x: from.x + dx * 0.7 + nx * bend, y: from.y + dy * 0.7 + ny * bend};
  const poly = cubicPolyline(from, c1, c2, to, 60);
  const d = `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`;
  return {poly, d, total: poly.total, end: poly.at(1)};
}

/** Tracer marker, large enough to follow on a phone (halo + ringed dot). */
function bigTracer(ctx, name) {
  const c = ctx.theme.accent;
  return g({name, opacity: 0},
    h('circle', {r: 30, fill: c, opacity: 0.2}),
    h('circle', {r: 16, fill: c, stroke: ctx.theme.paper, 'stroke-width': 5}),
  );
}

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const Pl = PLACES[ctx.view.shape];
    // narrow frames use a slightly smaller sheet (their columns are budgeted by height)
    const SH = Pl.sheet ? {w: Pl.sheet[0], h: Pl.sheet[1]} : SHEET;
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const showAll = ctx.show('all');
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses};

    // --- components
    const orig = custodySheet(ctx, {prefix: 'orig', w: SH.w, h: SH.h, kind: 'original', ...doc, signer: p.signers[0].name, showText: showAll, rosette: true, seedKey: 'custody-doc'});
    const copy = custodySheet(ctx, {prefix: 'copy', w: SH.w, h: SH.h, kind: 'copy', ...doc, signer: p.signers[0].name, showText: showAll, redactions: p.redactions, notes: true, seedKey: 'custody-doc',
      marks: [{key: 'mark', text: p.objectLabels.copyMark, color: th.accent2, opacity: 1}]});
    // the ghost (slot) of the original stands at 45 % depth; line it up under the original
    const B = {...Pl.box, x: Pl.original[0] - (Pl.box.w / 2 + Pl.box.d * 0.45 * 0.62)};
    // the placement ghost has exactly the outline of the original once it
    // stands in the slot (visible part above the inner front edge of the rim)
    const rimT = Math.max(9, B.w * 0.03);
    const homeVisH = (1 - GATHER.dip) * SH.h * GATHER.scale;
    const narrowFrame = ctx.view.shape === 'portrait';
    // the "kept in" tag ends up hanging on the box's front face, just under
    // the rim where the original enters: the label plate sits below it
    const keepRel = p.relationships.find(rel => (rel.from === 'original' && rel.to === 'box') || (rel.from === 'box' && rel.to === 'original'));
    const keepH = keepRel && showAll ? chip(ctx, keepRel.label || p.relationLabels[keepRel.kind] || keepRel.kind, {x: 0, y: 0, maxWidth: narrowFrame ? 240 : 300, size: Pl.relChip ?? 28, maxLines: 2}).box.h : 0;
    const box = obliqueBox(ctx, {prefix: 'bx', w: B.w, h: B.h, d: B.d, label: p.objectLabels.box, showText: showAll,
      slotW: SH.w * GATHER.scale, slotRise: -0.225 * B.d + rimT / 2 + homeVisH, plateTop: keepH ? keepH + 12 : 0});
    const seal = sealStrip(ctx, {name: 'seal-strip', w: Pl.sealW ?? 250, text: p.objectLabels.seal, color: th.accent, showText: showAll});
    const penP = pen(ctx, {name: 'pen-prop', length: 200, body: th.accent4});
    const penR = Pl.penR ?? 90;
    const fw = (Pl.folderSize || [350, 262])[0];
    let fh = (Pl.folderSize || [350, 262])[1];
    // the element chip names the file, so its tab stays unprinted here
    let folderArt = workFolder(ctx, {w: fw, h: fh, label: '', showText: showAll});
    // --- zones end above the legend (which may wrap onto two rows)
    const legendPre = showAll ? legendNode(ctx, [...new Set(p.relationships.map(x => x.kind))], p.relationLabels, {x: Pl.legend[0], y: Pl.legend[1]}, S.w - 60).box : null;
    const ZS = Pl.zones.map(z => ({...z, h: legendPre ? Math.min(z.h, legendPre.y - 10 - z.y) : z.h}));
    // --- element label makers (also used to budget the vertical columns)
    const zoneRectOf = key => {
      const z = ZS.find(q => q.key === key);
      return {x: z.x + 8, y: z.y + 8, w: z.w - 16, h: z.h - 16};
    };
    const zoneRect = id => zoneRectOf(ZONE_OF[id]);
    const labOpts = id => ({maxWidth: id === 'pen' && Pl.penLabW ? Pl.penLabW : id === 'copy' && Pl.copyLabW ? Pl.copyLabW : Pl.labW && (id === 'original' || id === 'box' || id === 'seal') ? Pl.labW : narrowFrame ? 300 : 340, size: Pl.labSize ?? 30, maxLines: 3, name: `lab-${id}`, stroke: id === p.focusElement ? th.accent : th.ink});
    const TAG = {original: [t.unchanged, th.accent4], copy: [t.annotated, th.accent2]};
    const tagOpts = id => ({size: 26, name: `tag-${id}`, color: TAG[id][1], opacity: 0});
    /**
     * Label block: the element label and, for original/copy, its end-state tag
     * placed as ONE unit (side by side, or the tag stacked above the label), so
     * a tag always sits against its own label and never lands on an element.
     */
    const makeBlock = (id, pos, mode) => {
      const lab0 = chip(ctx, label(id), {x: 0, y: 0, anchor: 'start', ...labOpts(id)});
      if (!TAG[id] || !ctx.show('key')) return chip(ctx, label(id), {...pos, ...labOpts(id)});
      const tag0 = statusTag(ctx, TAG[id][0], {x: 0, y: 0, anchor: 'start', ...tagOpts(id)});
      const lw = lab0.box.w, lh = lab0.box.h, tw = tag0.box.w, thh = tag0.box.h;
      let lab, tag, bx, by, bw, bh;
      if (mode === 'side') {
        bw = lw + 10 + tw; bh = Math.max(lh, thh);
        const lx = pos.anchor === 'middle' ? pos.x - bw / 2 : pos.anchor === 'end' ? pos.x - bw : pos.x;
        bx = lx; by = pos.y;
        lab = chip(ctx, label(id), {x: lx, y: by + (bh - lh) / 2, anchor: 'start', ...labOpts(id)});
        tag = statusTag(ctx, TAG[id][0], {x: lx + lw + 10, y: by + (bh - thh) / 2, anchor: 'start', ...tagOpts(id)});
      } else {
        bw = Math.max(lw, tw); bh = lh + 8 + thh;
        bx = pos.anchor === 'middle' ? pos.x - bw / 2 : pos.anchor === 'end' ? pos.x - bw : pos.x;
        by = pos.y;
        const ax = pos.anchor === 'middle' ? pos.x : pos.anchor === 'end' ? pos.x : pos.x;
        tag = statusTag(ctx, TAG[id][0], {x: ax, y: by, anchor: pos.anchor || 'start', ...tagOpts(id)});
        lab = chip(ctx, label(id), {x: ax, y: by + thh + 8, anchor: pos.anchor || 'start', ...labOpts(id)});
      }
      return {node: lab.node, box: {x: bx, y: by, w: bw, h: bh, cx: bx + bw / 2, cy: by + bh / 2}, lab, tag};
    };
    const blockFits = id => {
      const z = zoneRect(id);
      return makeBlock(id, {x: 0, y: 0, anchor: 'start'}, 'side').box.w <= z.w - 20;
    };

    // --- positions. Wide frames use the hand-placed layout; on square and tall
    // frames each zone is a column whose rows are budgeted from the measured
    // label heights, so long labels get room instead of colliding.
    const pos = Object.fromEntries(['original', 'seal', 'copy', 'pen', 'folder'].map(id => [id, {x: Pl[id][0], y: Pl[id][1]}]));
    // the original's label block always sits ABOVE the sheet (it rides down
    // with the sheet when the original is lowered into the box)
    const origMode = ctx.show('key') && !blockFits('original') ? 'stack' : 'side';
    let sealRowGap = SEAL_GAP;
    // Custody column (every shape): label block, lifted original, a gap for
    // the "kept in" link, then the box with its label below it; the seal
    // stands beside the box. Rows are budgeted from measured label heights.
    {
      const zc = zoneRectOf('custody');
      const top = ctx.show('key') ? makeBlock('original', {x: 0, y: 0, anchor: 'middle'}, origMode).box.h : 0;
      const oTop = Math.max(zc.y + top + 16, Pl.original[1] - SH.h / 2);
      pos.original.y = oTop + SH.h / 2;
      const bb = box.bbox;
      // (wide frames can put the "kept in" label beside its link)
      const g1 = Pl.column ? Math.max(90, keepH + 70) : 80;
      B.y = Math.max(Pl.box.y, oTop + SH.h + g1 - bb.y);
      // keep the (swollen) box and its label inside the zone — and, on narrow
      // frames, the seal row below-right of the box with its own label
      const boxLab = ctx.show('key') ? chip(ctx, label('box'), {x: 0, y: 0, ...labOpts('box')}).box.h : 0;
      const sealLab = ctx.show('key') && Pl.sealBelow ? chip(ctx, label('seal'), {x: 0, y: 0, ...labOpts('seal')}).box.h : 0;
      // row under the box: the box label (left) and the label of the link
      // that joins the seal to the box (right, on that link)
      const linkLab = showAll ? Math.max(0, ...p.relationships.filter(rel => ZONE_OF[rel.from] === 'custody' && ZONE_OF[rel.to] === 'custody' && rel.from !== 'original' && rel.to !== 'original')
        .map(rel => chip(ctx, rel.label || p.relationLabels[rel.kind] || rel.kind, {x: 0, y: 0, maxWidth: narrowFrame ? 240 : 300, size: Pl.relChip ?? 28, maxLines: 2}).box.h)) : 0;
      // rows under the box: its label (left); the seal→box link label either
      // beside it (square) or in a row of its own (tall frames, where the
      // link's midpoint must fall below the box label); then the seal row
      const boxLabRow = B.h * 0.1 + 14 + boxLab + 10;
      sealRowGap = Pl.sealRows === 3 ? Math.max(SEAL_GAP, 2 * boxLabRow + linkLab + 16) : Math.max(SEAL_GAP, boxLabRow, linkLab + 40) + 24;
      const kSw = 1 + (p.focusElement === 'box' ? FOCUS_SWELL : SWELL) + 0.01;
      // seal row: the seal on the right, its label on its left
      const under = Math.max(B.h / 2 + (B.h / 2) * kSw + 14 + boxLab, Pl.sealBelow ? B.h + sealRowGap + Math.max(seal.h, sealLab) : 0);
      const maxBy = zc.y + zc.h - 6 - under;
      if (B.y > maxBy) B.y = Math.max(maxBy, oTop + SH.h + 60 - bb.y);
      else if (Pl.column) {
        // tall columns: share the spare height (a longer "kept in" link, the
        // group lowered a little) instead of leaving the zone's foot empty
        const extra = maxBy - B.y;
        pos.original.y += extra * 0.2;
        B.y += extra * 0.55;
      }
      if (Pl.sealBelow) {
        pos.seal.x = zc.x + zc.w - seal.w / 2 - 6;
        pos.seal.y = B.y + B.h + sealRowGap + Math.max(seal.h, sealLab) / 2;
      } else pos.seal.y = B.y + B.h * Pl.sealDy;
    }
    if (Pl.column && ctx.show('key')) {
      // circulation: the folder's label always fits under the folder
      const zr = zoneRectOf('circulation');
      const fLab = chip(ctx, label('folder'), {x: 0, y: 0, ...labOpts('folder')}).box.h;
      pos.folder.y = Math.min(pos.folder.y, zr.y + zr.h - 4 - fLab - 14 - fh / 2);
    }
    // stacked copy and file (tall frames): the copy→file link keeps a readable
    // stretch of line and its arrowhead on both sides of its label (a long,
    // two-line label would otherwise cover the arrowhead). Lift the copy a
    // little, then make the file less tall (its bottom and label stay put).
    const cfRel = showAll && Pl.column && Math.abs(pos.copy.x - pos.folder.x) < 60 &&
      p.relationships.find(rel => [rel.from, rel.to].includes('copy') && [rel.from, rel.to].includes('folder'));
    if (cfRel) {
      const lh = chip(ctx, cfRel.label || p.relationLabels[cfRel.kind] || cfRel.kind, {x: 0, y: 0, maxWidth: narrowFrame ? 240 : 300, size: Pl.relChip ?? 28, maxLines: 2}).box.h;
      // (the chip hangs a little below the link's midpoint and keeps clear of
      // both ends: the gap has to hold about two label heights)
      let short = 2 * lh + 50 - (pos.folder.y - fh / 2 - folderArt.tabH - (pos.copy.y + SH.h / 2));
      if (short > 0) {
        const lift = Math.min(short, 30);
        pos.copy.y -= lift;
        short -= lift;
      }
      if (short > 0) {
        const bottom = pos.folder.y + fh / 2;
        fh = Math.max(150, fh - short);
        pos.folder.y = bottom - fh / 2;
        folderArt = workFolder(ctx, {w: fw, h: fh, label: '', showText: showAll});
      }
    }
    const at = id => (id === 'box' ? {x: B.x, y: B.y} : pos[id]);
    // --- gather geometry: where the original stands once lowered into its slot
    const yClip = B.y + box.innerFrontY;
    const homeW = SH.w * GATHER.scale, homeH = SH.h * GATHER.scale;
    const home = {x: pos.original.x, y: yClip + GATHER.dip * homeH - homeH / 2, scale: GATHER.scale};
    const homeVisible = {x: home.x - homeW / 2, y: home.y - homeH / 2, w: homeW, h: yClip - (home.y - homeH / 2)};
    // links of the original land on the part of the sheet that stays VISIBLE
    // in the box: its outline down to just above the inner front rim edge
    // (never on the hidden part, which would put the end on the box's wall)
    const RIM_CLEAR = 10;
    const homeLink = {...homeVisible, h: homeVisible.h - RIM_CLEAR};
    const homeAnchor = toward => {
      const a = edgeAnchor(homeLink, toward, 8);
      if (a.y <= yClip - RIM_CLEAR) return a;
      // a target below the rim: leave from the lowest visible point of the
      // sheet's side that faces it
      return {x: toward.x >= home.x ? homeLink.x + homeLink.w + 8 : homeLink.x - 8, y: yClip - RIM_CLEAR};
    };
    // the sheet's top edge moves by this much: the label block rides along
    const blockDy = (home.y - homeH / 2) - (pos.original.y - SH.h / 2);
    // the "kept in" tag hangs on the rim where the original enters the box
    const junction = {x: home.x, y: yClip};
    const junctionApprox = {x: home.x - 140, y: yClip, w: 280, h: Math.max(60, keepH + 12)};
    const sheetBox = c => ({x: c.x - SH.w / 2, y: c.y - SH.h / 2, w: SH.w, h: SH.h});
    const boxBB = {x: B.x + box.bbox.x, y: B.y + box.bbox.y, w: box.bbox.w, h: box.bbox.h};
    const sealBB = {x: at('seal').x - seal.w / 2, y: at('seal').y - seal.h / 2, w: seal.w, h: seal.h};
    const folderBB = {x: at('folder').x - fw / 2, y: at('folder').y - fh / 2 - folderArt.tabH, w: fw, h: fh + folderArt.tabH};
    const elements = {
      original: {box: sheetBox(at('original'))},
      box: {box: boxBB},
      seal: {box: sealBB},
      copy: {box: sheetBox(at('copy'))},
      pen: {circle: {x: at('pen').x, y: at('pen').y, r: penR}},
      folder: {box: folderBB},
    };
    const elBox = id => (elements[id].circle ? {x: elements[id].circle.x - penR, y: elements[id].circle.y - penR, w: penR * 2, h: penR * 2} : elements[id].box);
    // --- connector ports. The box's bounding box includes the lid's overhang,
    // so a link that ended on it would stop in the empty space beside the side
    // face. Links of the box (other than "kept in", which lands on the slot)
    // end on its DRAWN silhouette instead: for each link a rect around the
    // body's centre is fitted so that the graph's edge anchor falls exactly
    // `pad` outside the silhouette along the line of the link.
    const boxOutline = box.outline.map(q => ({x: B.x + q[0], y: B.y + q[1]}));
    const boxCore = {x: B.x + box.body.x + box.body.w / 2, y: B.y + box.body.y + box.body.h / 2};
    // an element right of the front face is reached through the side face (a
    // link to a seal below-right ends at the side face's lower corner, clear
    // of the box's own label under the front face)
    const sideCore = {x: B.x + B.w + box.dx / 2, y: B.y + (B.h + box.dy) / 2};
    const boxPort = (toward, pad) => {
      const o = toward.x > B.x + B.w ? sideCore : boxCore;
      const v = {x: toward.x - o.x, y: toward.y - o.y};
      const len = Math.hypot(v.x, v.y) || 1;
      const t = rayExit(boxOutline, o, v) + pad / len;
      const hw = Math.max(1, t * Math.abs(v.x) - pad), hh = Math.max(1, t * Math.abs(v.y) - pad);
      return {x: o.x - hw, y: o.y - hh, w: hw * 2, h: hh * 2};
    };
    // tall frames: a pen above the copy writes on the copy's upper corner on
    // its side (the copy's label block keeps the rest of the top edge)
    const copyPort = () => {
      const sb = elements.copy.box, pc = elements.pen.circle;
      if (!Pl.copyPort || pc.y >= sb.y) return null;
      const m = 14, fold = SH.w * 0.12;
      return {x: pc.x >= sb.x + sb.w / 2 ? sb.x + sb.w - fold - 2 * m - 4 : sb.x + 4, y: sb.y, w: 2 * m, h: 2 * m};
    };
    const isKeepRel = rel => [rel.from, rel.to].includes('original') && [rel.from, rel.to].includes('box');
    const centerOf = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
    const bodyRect = {x: B.x + box.body.x, y: B.y + box.body.y, w: box.body.w, h: box.body.h};
    // the lid (and the slot rising above the rim) as horizontal bands that
    // follow the lid's backward lean: the lower bands stop at the side face
    const lidBands = [];
    if (boxOutline.length === 10) {
      const [RT, BR] = [boxOutline[6], boxOutline[7]];
      const right = y => (y < RT.y ? boxBB.x + boxBB.w : BR.x + ((BR.y - y) / (BR.y - RT.y || 1)) * (RT.x - BR.x));
      const n = 4, y0 = boxBB.y, band = (bodyRect.y - y0) / n;
      for (let k = 0; k < n; k++) {
        const ya = y0 + k * band;
        lidBands.push({x: B.x + box.dx, y: ya, w: right(ya) - (B.x + box.dx), h: band});
      }
    }
    /**
     * Graph input for some relationships: an end that needs a port gets an
     * element of its own (`id@i`); the conns are mapped back to the supplied
     * relationships afterwards (see `unalias`).
     */
    const graphInput = idx => {
      const els = {...elements};
      // relation labels keep clear of the box as drawn (its body, its lid and
      // the slot above it), not of the empty space under the lid's overhang;
      // a "kept in" link still needs the whole box as its element
      if (!idx.some(i => isKeepRel(p.relationships[i]))) {
        els.box = {box: bodyRect};
        lidBands.forEach((q, k) => { els[`box-lid${k}`] = {box: q}; });
      }
      const rels = idx.map(i => {
        const rel = p.relationships[i];
        const a = {...rel};
        const cp = [rel.from, rel.to].includes('pen') && [rel.from, rel.to].includes('copy') ? copyPort() : null;
        if (cp) { const end = rel.from === 'copy' ? 'from' : 'to'; els[`copy@${i}`] = {box: cp}; a[end] = `copy@${i}`; }
        if (!isKeepRel(rel)) {
          for (const end of ['from', 'to']) {
            if (rel[end] !== 'box') continue;
            const other = els[end === 'from' ? a.to : a.from];
            const pad = end === 'from' || rel.kind === 'relation' ? 8 : 14;
            els[`box@${i}`] = {box: boxPort(centerOf(other), pad)};
            a[end] = `box@${i}`;
          }
        }
        return a;
      });
      return {elements: els, relationships: rels};
    };
    const unalias = (gr, idx) => { gr.conns.forEach((c, j) => { c.rel = p.relationships[idx[j]]; }); return gr; };
    // the box swells about its front face centre while the tracer passes:
    // its own label keeps clear of the swollen outline
    const boxPivot = {x: B.x + B.w / 2, y: B.y + B.h / 2};
    const swell = k => ({x: boxPivot.x + (boxBB.x - boxPivot.x) * k, y: boxPivot.y + (boxBB.y - boxPivot.y) * k, w: boxBB.w * k, h: boxBB.h * k});
    const boxSwollen = swell(1 + (p.focusElement === 'box' ? FOCUS_SWELL : SWELL) + 0.01);

    // --- zones (tinted areas); their captions are placed last, in a free corner
    const zoneTint = z => (z.key === 'custody' ? th.accent4Soft : th.accent2Soft);

    // --- a first pass of the graph gives the connector geometry, so that the
    // element labels can be placed clear of the lines
    const bend = rel => (rel.kind === 'communication' ? -0.14 : rel.kind === 'sequence' ? 0.06 : 0.1);
    const bounds = {x: 10, y: 10, w: S.w - 20, h: S.h - 60};
    const allIdx = p.relationships.map((_, i) => i);
    const probeGraph = unalias(relationGraph({...ctx, show: () => false}, {name: 'probe', ...graphInput(allIdx), relationLabels: p.relationLabels, bend}), allIdx);
    const lineBoxes = [];
    for (const c of probeGraph.conns) for (let k = 0; k <= 24; k++) {
      const q = c.c.at(k / 24);
      lineBoxes.push({x: q.x - 8, y: q.y - 8, w: 16, h: 16});
    }
    // ... and the paths those connectors take once the original is in the box
    const liftedCenter = {x: pos.original.x, y: pos.original.y};
    const toHome = q => ({x: home.x + (q.x - liftedCenter.x) * home.scale, y: home.y + (q.y - liftedCenter.y) * home.scale});
    /** Both ends of a link of the original once the sheet stands in the box. */
    const gatherEnds = (rel, c) => ({
      gFrom: rel.from === 'original' ? homeAnchor(c.to) : c.from,
      gTo: rel.to === 'original' ? homeAnchor(c.from) : c.to,
    });
    probeGraph.conns.forEach((c, i) => {
      const rel = p.relationships[i];
      if ((rel.from !== 'original' && rel.to !== 'original') || rel.from === 'box' || rel.to === 'box') return;
      const ge = gatherEnds(rel, c.c);
      const gpoly = curveGeom(ge.gFrom, ge.gTo, bend(rel)).poly;
      for (let k = 0; k <= 24; k++) {
        const q = gpoly.at(k / 24);
        lineBoxes.push({x: q.x - 8, y: q.y - 8, w: 16, h: 16});
      }
    });
    // legend rows (up to 2 on narrow frames) reserve space at the bottom
    const legendRows = showAll ? legendNode(ctx, [...new Set(p.relationships.map(x => x.kind))], p.relationLabels, {x: Pl.legend[0], y: Pl.legend[1]}, S.w - 60).box : null;
    const legendBox = legendRows || {x: Pl.legend[0] - S.w * 0.4, y: Pl.legend[1] - 26, w: S.w * 0.8, h: 52};
    const allEls = IDS.map(elBox);
    const avoid = [...allEls, ...lineBoxes, legendBox];
    const labs = {};
    const gathered = {block: null};
    const PREFS = {
      original: ['above', 'aboveFit', 'aboveLeft', 'aboveRight'],
      box: ['below', 'belowRight', 'belowLeft', 'leftLow', 'rightLow'],
      seal: ['below', 'above', 'right', 'left', 'belowLeft', 'belowRight', 'aboveLeft', 'aboveRight'],
      copy: ['above', 'aboveRight', 'aboveLeft', 'right', 'rightHigh', 'left', 'leftHigh'],
      pen: ['below', 'left', 'right', 'above', 'belowLeft'],
      folder: ['below', 'belowLeft', 'belowRight', 'right', 'left'],
    };
    if (ctx.show('key')) {
      for (const id of IDS) {
        const own = allEls[IDS.indexOf(id)];
        // straddling a corner is allowed where the corner carries no key mark
        // (the seal strip is all mark, so it never gets covered); a label block
        // with a tag never straddles
        const corners = id === 'seal' || TAG[id] ? [] : ['cornerTL', 'cornerTR', 'cornerBL', 'cornerBR'];
        const prefs = [...((Pl.prefs || {})[id] || PREFS[id]), ...corners];
        let best = null;
        const modes = id === 'original' ? [origMode] : blockFits(id) ? ['side', 'stack'] : ['stack'];
        for (const mode of modes) {
          const c = placeChip(q => makeBlock(id, q, mode), id === 'box' ? boxSwollen : elBox(id), avoid, zoneRect(id), prefs, 14, own);
          if (c.clear) { best = c; break; }
          if (!best || c.cost < best.cost) best = c;
        }
        labs[id] = best;
        avoid.push(best.box);
        if (id === 'original') {
          // reserve where the original, its label block and the "kept in" tag
          // end up once the original stands in the box
          gathered.block = {...best.box, y: best.box.y + blockDy};
          avoid.push(gathered.block, homeVisible, junctionApprox);
        }
      }
    }
    // --- descriptive end states (tags) come with their label blocks
    const tags = {};
    for (const id of Object.keys(TAG)) if (labs[id] && labs[id].tag) tags[id] = labs[id].tag;
    const zoneCaps = [];
    const zones = ZS.map((z, i) => {
      let cap = null;
      if (showAll) {
        const inner = {x: z.x + 12, y: z.y + 10, w: z.w - 24, h: z.h - 20};
        const make = pos => chip(ctx, t[z.key], {...pos, maxWidth: z.w * 0.5, size: 28, maxLines: 1, fill: zoneTint(z), stroke: 'none', name: `zone-cap-${i}`, weight: 700});
        const ch = make({x: 0, y: 0}).box;
        // the four corners first, then sliding along the top and bottom edges,
        // then down the side edges: a crowded zone still gets its caption
        const cands = [
          {x: inner.x + inner.w, y: inner.y, anchor: 'end'}, {x: inner.x, y: inner.y, anchor: 'start'},
          {x: inner.x + inner.w, y: inner.y + inner.h - ch.h, anchor: 'end'}, {x: inner.x, y: inner.y + inner.h - ch.h, anchor: 'start'},
        ];
        for (const y of [inner.y, inner.y + inner.h - ch.h]) {
          for (let x = inner.x + inner.w - ch.w - 16; x > inner.x; x -= 16) cands.push({x, y, anchor: 'start'});
        }
        for (let y = inner.y + 16; y < inner.y + inner.h - ch.h; y += 16) {
          cands.push({x: inner.x, y, anchor: 'start'}, {x: inner.x + inner.w, y, anchor: 'end'});
        }
        cap = null;
        // (nor under the stack the original and the copy start from). While the
        // original is lifted its block shows the label only: its state tag
        // appears once the block has ridden down with the sheet
        const stackBox = {x: Pl.stack[0] - SH.w / 2 - 20, y: Pl.stack[1] - SH.h / 2 - 20, w: SH.w + 40, h: SH.h + 40};
        const liftedBlock = labs.original && labs.original.lab ? labs.original.box : null;
        const capAvoid = [...avoid.map(q => (q === liftedBlock ? labs.original.lab.box : q)), stackBox];
        for (const c of cands) {
          const cand = make(c);
          if (!capAvoid.some(q => overlaps(cand.box, q, 8))) { cap = cand; break; }
        }
        // (only a zone with no free edge at all keeps its tint without a caption)
        if (cap) {
          zoneCaps.push(cap.box);
          avoid.push(cap.box);
        }
      }
      return g({name: `zone-${i}`, opacity: 0},
        h('path', {d: roundRectPath(z.x, z.y, z.w, z.h, 28), fill: zoneTint(z), opacity: 0.55, stroke: th.dark ? '#ffffff22' : '#1f232814', 'stroke-width': 2}),
        cap && cap.node);
    });
    // relation labels also keep clear of every connector's two ends (an arrowhead
    // or end dot is never hidden under a label)
    const ends = [];
    for (const c of probeGraph.conns) {
      const arrow = Boolean(LINK_STYLES[c.rel.kind] && LINK_STYLES[c.rel.kind].arrow);
      const box = (q, k) => ({x: q.x - k, y: q.y - k, w: k * 2, h: k * 2});
      ends.push(box(c.c.from, 12), box(c.c.to, arrow ? 26 : 12));
    }
    // element labels at the END (the original's block has ridden down)
    const labBoxesEnd = IDS.map(id => labs[id] && (id === 'original' ? gathered.block : labs[id].box));
    const obstacles = [...IDS.map(id => labs[id] && labs[id].box), ...Object.values(tags).map(x => x.box), ...zoneCaps, legendBox, ...ends].filter(Boolean);
    // Relations inside one zone keep their labels inside that zone (a label
    // never sits next to an element it does not describe); relations that
    // cross zones may use the whole frame. Relations of the original come
    // first: their labels move with the original when it is lowered into the
    // box, so every other label also keeps clear of where those end up.
    const touchesOrig = rel => rel.from === 'original' || rel.to === 'original';
    const isKeep = rel => touchesOrig(rel) && (rel.from === 'box' || rel.to === 'box');
    const zoneGroup = rel => (ZONE_OF[rel.from] === ZONE_OF[rel.to] ? ZONE_OF[rel.from] : 'cross');
    // (tall frames: the pen→copy link runs almost vertically down to the copy's
    // corner; its label gets a group of its own so it can sit in the free band
    // between the pen and the copy's label block, see `penCopyOffset`)
    const isPenCopy = rel => [rel.from, rel.to].includes('pen') && [rel.from, rel.to].includes('copy');
    const groupOf = rel => (touchesOrig(rel) ? `orig-${zoneGroup(rel)}` : Pl.copyPort && isPenCopy(rel) ? 'pen-copy' : zoneGroup(rel));
    const zoneBounds = key => {
      if (key === 'cross') return bounds;
      if (key === 'pen-copy') return zoneBounds('circulation');
      const z = ZS.find(q => q.key === key);
      return {x: z.x + 6, y: z.y + 6, w: z.w - 12, h: z.h - 12};
    };
    const inside = (b, zb) => b.x >= zb.x && b.y >= zb.y && b.x + b.w <= zb.x + zb.w && b.y + b.h <= zb.y + zb.h;
    const endElements = IDS.map(id => (id === 'original' ? homeVisible : elBox(id)));
    const graphs = [];
    const allConns = [];
    const placedLabels = [];
    const movedLabels = [];
    const origLinks = [];
    /**
     * Vertical shift of the pen→copy label: from the link's midpoint (where the
     * graph puts it) to the middle of the free band between the pen (with its
     * label) and the copy's label block — which would otherwise meet the
     * block's state tag once it appears.
     */
    const penCopyOffset = idx => {
      const i = idx[0];
      const rel = p.relationships[i];
      const c = probeGraph.conns[i].c;
      const size = Pl.relChip ?? 28;
      const lh = chip(ctx, rel.label || p.relationLabels[rel.kind] || rel.kind, {x: 0, y: 0, maxWidth: 240, size, maxLines: 2}).box.h;
      const pc = elements.pen.circle;
      const top = Math.max(pc.y + penR + 8, labs.pen ? labs.pen.box.y + labs.pen.box.h : 0) + 10;
      const bottom = (labs.copy ? labs.copy.box.y : elements.copy.box.y) - 10;
      if (bottom - top < lh) return 0;
      return (top + bottom) / 2 - lh / 2 - (c.mid.y - size * 0.95);
    };
    for (const key of ['orig-custody', 'orig-cross', 'orig-circulation', 'custody', 'circulation', 'pen-copy', 'cross']) {
      const idx = p.relationships.map((rel, i) => i).filter(i => groupOf(p.relationships[i]) === key);
      if (!idx.length) continue;
      const orig = key.startsWith('orig-');
      const zb = zoneBounds(orig ? key.slice(5) : key);
      const extra = orig ? [] : [gathered.block, homeVisible, ...movedLabels].filter(Boolean);
      const name = `rel-${key}`;
      // (wide frames: the seal→box link is short, so its label wraps narrower)
      const chipMax = key === 'custody' && Pl.custodyChipMax ? Pl.custodyChipMax : narrowFrame ? 240 : 300;
      const labelOffset = key === 'pen-copy' && showAll ? penCopyOffset(idx) : 0;
      const gr = unalias(relationGraph(ctx, {name, ...graphInput(idx), relationLabels: p.relationLabels, chipSize: Pl.relChip ?? 28, chipMax, labelOffset, obstacles: [...obstacles, ...extra, ...placedLabels], separateLabels: true, bounds: zb, bend}), idx);
      gr.conns.forEach((c, j) => { allConns[idx[j]] = c; if (c.lab) placedLabels.push(c.lab.box); });
      graphs.push({gr, idx, orig});
      if (!orig) continue;
      // where each of these connectors and labels goes once the original is in the box
      gr.conns.forEach((c, j) => {
        const rel = c.rel;
        const keep = isKeep(rel);
        // (the retiring "kept in" link simply sinks with the sheet while it fades)
        const ends = keep ? {gFrom: rel.from === 'original' ? toHome(c.c.from) : c.c.from, gTo: rel.to === 'original' ? toHome(c.c.to) : c.c.to} : gatherEnds(rel, c.c);
        const link = {i: idx[j], name: `${name}-c${j}`, lg: `${name}-lg${j}`, rel, style: LINK_STYLES[rel.kind] || LINK_STYLES.relation, keep, bend: bend(rel),
          from: c.c.from, to: c.c.to, ...ends, hasLab: Boolean(c.lab)};
        if (c.lab) {
          const text = rel.label || p.relationLabels[rel.kind] || rel.kind;
          if (link.keep) {
            // the link's label becomes a tag on the box's front face, right
            // under the rim where the original enters (fades in there while
            // the label on the retiring link fades out)
            link.tag = chip(ctx, text, {x: junction.x, y: junction.y + 6, anchor: 'middle', maxWidth: narrowFrame ? 240 : 300, size: Pl.relChip ?? 28, maxLines: 2,
              fill: th.card, stroke: kindColor(ctx, rel.kind), name: `keep-tag-${idx[j]}`, weight: 600});
            movedLabels.push(link.tag.box);
          } else {
            // the label does not travel: it fades out on the retiring path and a
            // fresh chip fades in once the moved path has settled, at the
            // nearest clear spot along it (a leader joins it only when it had
            // to step well aside)
            const labMake = q => chip(ctx, text, {...q, anchor: 'middle', maxWidth: chipMax, size: Pl.relChip ?? 28, maxLines: 2,
              fill: th.card, stroke: kindColor(ctx, rel.kind), name: `${name}-gl${j}`, weight: 600});
            const probeLab = labMake({x: 0, y: 0}).box;
            const lb = {x: -probeLab.w / 2, y: 0, w: probeLab.w, h: probeLab.h, cx: 0, cy: probeLab.h / 2};
            const gpoly = curveGeom(link.gFrom, link.gTo, link.bend).poly;
            const endObs = [...endElements, ...labBoxesEnd, ...Object.values(tags).filter(x => x !== tags.original).map(x => x.box), ...zoneCaps, legendBox, ...movedLabels].filter(Boolean);
            const cost = q => {
              const b = {x: lb.x + q.x, y: lb.y + q.y, w: lb.w, h: lb.h};
              if (!inside(b, zb)) return Infinity;
              return endObs.reduce((sum, o) => {
                const w = Math.min(b.x + b.w, o.x + o.w) - Math.max(b.x, o.x) + 6, hh = Math.min(b.y + b.h, o.y + o.h) - Math.max(b.y, o.y) + 6;
                return sum + (w > 0 && hh > 0 ? w * hh : 0);
              }, 0);
            };
            const vx = link.gTo.x - link.gFrom.x, vy = link.gTo.y - link.gFrom.y, vl = Math.hypot(vx, vy) || 1;
            const n = {x: -vy / vl, y: vx / vl};
            let best = null;
            for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8]) {
              const cp = gpoly.at(tt);
              for (let k = 0; k <= 300; k += 12) {
                for (const sg of k ? [-1, 1] : [1]) {
                  // chip centred on the offset point
                  const q = {x: cp.x + n.x * k * sg - lb.cx, y: cp.y + n.y * k * sg - lb.cy};
                  const c0 = cost(q);
                  const score = c0 * 1000 + k + Math.abs(tt - 0.5) * 200;
                  if (!best || score < best.score) best = {q, score, cp, k};
                }
              }
            }
            const d = best.q;
            link.endLab = labMake({x: lb.x + d.x + lb.w / 2, y: lb.y + d.y});
            const eb = link.endLab.box;
            // leader from the path to the nearest point of the chip's outline;
            // left out when the chip already touches (or nearly touches) its path
            const nx = clamp(best.cp.x, eb.x, eb.x + eb.w), ny = clamp(best.cp.y, eb.y, eb.y + eb.h);
            if (Math.hypot(best.cp.x - nx, best.cp.y - ny) >= 18) link.leader = {x1: r(best.cp.x), y1: r(best.cp.y), x2: r(nx), y2: r(ny)};
            movedLabels.push(eb);
          }
        }
        origLinks.push(link);
      });
    }
    const route = routeThrough(elements, allConns, p.traversalOrder);
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    // connectors must end on their elements' outlines (acceptance check)
    const edgeDist = (e, q) => {
      if (e.circle) return Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r);
      const b = e.box;
      const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
      return Math.hypot(dx, dy);
    };
    // (links of the box other than "kept in" are measured against the box as
    // drawn, not against its bounding box)
    const endDist = (rel, id, q) => (id === 'box' && !isKeepRel(rel) ? polyDist(boxOutline, q) : edgeDist(elements[id], q));
    const landing = allConns.map(x => r(Math.max(endDist(x.rel, x.rel.from, x.c.from), endDist(x.rel, x.rel.to, x.c.to)), 1));

    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = showAll ? legendNode(ctx, kinds, p.relationLabels, {x: Pl.legend[0], y: Pl.legend[1]}, S.w - 60) : null;

    return {S, s, ox, oy, Pl, B, orig, copy, box, seal, penP, penR, folderArt, fw, fh, zones, labs, tags, graphs, route, visitT, legend, landing,
      pos, centers: {original: at('original'), copy: at('copy')}, stack: {x: Pl.stack[0], y: Pl.stack[1]},
      home, yClip, blockDy, origLinks, elements, edgeDist, SH, junction};
  },
  build(ctx, L) {
    const {Pl, B} = L;
    const at = id => L.pos[id];
    const bodyAt = (id, cx, cy, child) => g({name: `el-${id}`}, g({name: `el-${id}-body`, transform: T(cx, cy)}, child));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.zones,
      L.graphs.filter(x => !x.orig).map(x => x.gr.node),
      g({name: 'el-box'}, g({name: 'el-box-body', transform: T(B.x, B.y)}, L.box.node)),
      bodyAt('seal', at('seal').x, at('seal').y, L.seal.node),
      bodyAt('folder', at('folder').x, at('folder').y, L.folderArt.node),
      g({name: 'el-pen'}, g({name: 'el-pen-body', transform: T(at('pen').x, at('pen').y)},
        h('circle', {r: L.penR, fill: ctx.theme.card, stroke: ctx.theme.ink, 'stroke-width': 2, opacity: 0.9}),
        g({transform: T(-70 * L.penR / 90, 52 * L.penR / 90, -38, L.penR / 90)}, L.penP.node))),
      g({name: 'el-copy'}, g({name: 'el-copy-body'}, L.copy.node)),
      // the original's connectors are drawn over the box (they start at the
      // sheet's edge even once it stands in the box) and under the sheet
      L.graphs.filter(x => x.orig).map(x => x.gr.node),
      // the original is hidden below the inner front edge of the box rim, so
      // once lowered into its slot it stands INSIDE the box, behind the front wall
      h('defs', null, h('clipPath', {id: ctx.id('orig-clip')}, h('rect', {x: -4000, y: -4000, width: 8000 + L.S.w, height: 4000 + L.yClip}))),
      g({'clip-path': ctx.ref('orig-clip')}, g({name: 'el-original'}, g({name: 'el-original-body'}, L.orig.node))),
      // the tracer runs over the elements but under every label (it never covers text)
      bigTracer(ctx, 'tracer'),
      Object.values(L.labs).map(c => c.node),
      L.origLinks.filter(k => k.leader).map(k => h('line', {name: `${k.lg}-gl`, ...k.leader, stroke: kindColor(ctx, k.rel.kind), 'stroke-width': 2, 'stroke-dasharray': '3 5', opacity: 0})),
      L.origLinks.filter(k => k.tag).map(k => k.tag.node),
      L.origLinks.filter(k => k.endLab).map(k => g({name: `${k.lg}-end`, opacity: 0}, k.endLab.node)),
      L.graphs.map(x => x.gr.labelsNode),
      Object.values(L.tags).map(c => c.node),
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    const Pl = L.Pl;
    // 1) separate: zones and static components appear; the stack splits
    const appear = ease.outCubic(seg(u, 0, 0.1));
    L.zones.forEach((_, i) => { nodes[`zone-${i}`] = {opacity: r(appear, 3)}; });
    for (const id of ['box', 'seal', 'folder', 'pen']) nodes[`el-${id}`] = {opacity: r(appear, 3), transform: reduced ? '' : `translate(0 ${r(18 * (1 - appear))})`};
    const split = ease.inOutCubic(seg(u, 0.03, 0.16));
    const st = L.stack;
    const oPos = {x: lerp(st.x - 8, L.centers.original.x, split), y: lerp(st.y - 10, L.centers.original.y, split)};
    const cPos = {x: lerp(st.x + 8, L.centers.copy.x, split), y: lerp(st.y + 6, L.centers.copy.y, split)};
    const lift = reduced ? 0 : Math.sin(Math.PI * split) * 0.05;
    // gather: the original is lowered into its slot (after the slot lights up)
    const ge = reduced ? (u >= GATHER.lower[0] ? 1 : 0) : ease.inOutCubic(seg(u, ...GATHER.lower));
    const oNow = {x: lerp(oPos.x, L.home.x, ge), y: lerp(oPos.y, L.home.y, ge)};
    const oScale = lerp(1 + lift, L.home.scale, ge);
    nodes['el-original'] = {transform: T(oNow.x, oNow.y, lerp(-3, 0, split), oScale)};
    // the copy is produced from the original: it emerges from beneath it
    nodes['el-copy'] = {transform: T(cPos.x, cPos.y, lerp(4, 0, split), 1 + lift), opacity: r(seg(u, 0.02, 0.07), 3)};
    for (const id of Object.keys(L.labs)) nodes[`lab-${id}`] = {opacity: r(seg(u, 0.12, 0.19), 3)};
    // the original's label block rides down with the sheet's top edge
    const blockT = `translate(0 ${r(L.blockDy * ge)})`;
    if (L.labs.original) nodes['lab-original'].transform = blockT;
    // 2) relations drawn one by one
    const n = p.relationships.length;
    const drawn = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / n, 0.18 + ((i + 1) * 0.25) / n));
    for (const {gr, idx} of L.graphs) Object.assign(nodes, gr.frame(j => drawn(idx[j])));
    // connectors of the original follow it into the box: the end on the
    // original moves rigidly with the sheet; the "kept in" link is covered by
    // the sheet as it sinks and fades, its tag moves to the rim
    const landingNow = L.landing.slice();
    for (const k of L.origLinks) {
      const from = {x: lerp(k.from.x, k.gFrom.x, ge), y: lerp(k.from.y, k.gFrom.y, ge)};
      const to = {x: lerp(k.to.x, k.gTo.x, ge), y: lerp(k.to.y, k.gTo.y, ge)};
      const cg = curveGeom(from, to, k.bend);
      const line = {d: cg.d};
      if (k.style.dash) {
        line.mask = ge > 0 ? 'none' : ctx.ref(`${k.name}-mask`);
        nodes[`${k.name}-masker`] = {...nodes[`${k.name}-masker`], d: cg.d, 'stroke-dasharray': `${r(cg.total)} ${r(cg.total + 10)}`};
      } else line['stroke-dasharray'] = `${r(cg.total)} ${r(cg.total + 10)}`;
      nodes[`${k.name}-line`] = {...nodes[`${k.name}-line`], ...line};
      if (k.style.arrow) nodes[`${k.name}-head`] = {...nodes[`${k.name}-head`], transform: T(cg.end.x, cg.end.y, (cg.end.a * 180) / Math.PI)};
      if (k.style.endDots) {
        nodes[`${k.name}-dotA`] = {...nodes[`${k.name}-dotA`], cx: r(from.x), cy: r(from.y)};
        nodes[`${k.name}-dotB`] = {...nodes[`${k.name}-dotB`], cx: r(to.x), cy: r(to.y)};
      }
      if (k.keep) nodes[k.name] = {...nodes[k.name], opacity: r((nodes[k.name] ? nodes[k.name].opacity : 1) * (1 - clamp(ge * 2.5)), 3)};
      // labels never travel with a moving path: the label on the retiring
      // path fades out at once (its own leader with it), the one on the moved
      // path fades in only once that path has settled; the "kept in" label
      // hands over to its tag on the rim
      const base = nodes[k.lg] ? nodes[k.lg].opacity : 1;
      const settled = clamp((ge - 0.85) / 0.15);
      if (k.hasLab) nodes[k.lg] = {...(nodes[k.lg] || {}), opacity: r(base * (1 - clamp(ge / 0.15)), 3)};
      if (k.endLab) nodes[`${k.lg}-end`] = {opacity: r(base * settled, 3)};
      if (k.leader) nodes[`${k.lg}-gl`] = {opacity: r(base * settled, 3)};
      if (k.tag) nodes[`keep-tag-${k.i}`] = {opacity: r(base * clamp((ge - 0.55) / 0.3), 3)};
      // landing of the moved end on the VISIBLE outline of the moved sheet
      // (the part lowered behind the box's front wall does not count)
      const oTop = oNow.y - (L.SH.h * oScale) / 2;
      const oBox = {x: oNow.x - (L.SH.w * oScale) / 2, y: oTop, w: L.SH.w * oScale, h: Math.max(0, Math.min(L.SH.h * oScale, L.yClip - oTop))};
      const land = (id, q) => (id === 'original' ? L.edgeDist({box: oBox}, q) : L.edgeDist(L.elements[id], q));
      if (k.keep && ge >= 0.4) {
        // the retiring "kept in" link is gone: the relation is now shown where
        // the sheet enters the box (its tag hangs there): measure that point
        const q = k.tag ? {x: k.tag.box.cx, y: k.tag.box.y} : L.junction;
        landingNow[k.i] = r(Math.max(land(k.rel.from, q), land(k.rel.to, q)), 1);
      } else if (ge > 0) landingNow[k.i] = r(Math.max(land(k.rel.from, from), land(k.rel.to, to)), 1);
    }
    // 3) tracer follows the traversal order; focus element swells as it passes
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.76;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    const pivots = {
      box: {x: L.B.x + L.B.w / 2, y: L.B.y + L.B.h / 2},
      seal: L.pos.seal, folder: L.pos.folder, pen: L.pos.pen,
    };
    for (const id of IDS) {
      const focus = id === p.focusElement ? FOCUS_SWELL : SWELL;
      const k = 1 + (reduced ? focus * 0.5 : focus) * ease.inOutSine(pulse(id));
      if (id === 'original' || id === 'copy') nodes[`el-${id}-body`] = {transform: k === 1 ? '' : `scale(${r(k, 4)})`};
      else {
        const pv = pivots[id];
        const base = id === 'box' ? T(L.B.x, L.B.y) : T(pv.x, pv.y);
        nodes[`el-${id}-body`] = {transform: k === 1 ? base : (id === 'box' ? `${scaleAbout(pv.x, pv.y, k)} ${base}` : `${base} scale(${r(k, 4)})`)};
      }
    }
    // the part that changes: notes appear on the copy when the tracer reaches it
    const reach = L.visitT.copy;
    const notesP = reach === undefined ? (u >= 0.75 ? 1 : 0) : (u >= 0.75 ? 1 : tracerOn ? seg(tt, Math.max(0, reach - 0.1), reach + 0.03) : 0);
    Object.assign(nodes, L.copy.notes.frame(notesP));
    // 4) gather: the slot lights up, then the original is lowered into it
    // (above); then the descriptive states
    const gp = seg(u, ...GATHER.slotLight);
    nodes['bx-slot'] = {opacity: r(0.4 + 0.6 * gp, 3)};
    const tagP = seg(u, 0.9, 0.96);
    for (const id of Object.keys(L.tags)) {
      const ok = id === 'copy' ? notesP >= 1 : true;
      nodes[`tag-${id}`] = {opacity: r(tagP * (ok ? 1 : 0), 3)};
      if (id === 'original') nodes['tag-original'].transform = blockT;
    }
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        original: {x: r(oNow.x), y: r(oNow.y)},
        copy: {x: r(cPos.x), y: r(cPos.y)},
        split: r(split, 3),
        notesProgress: r(notesP, 3),
        originalWrittenOn: false,
        relationsDrawn: p.relationships.map((_, i) => r(drawn(i), 3)),
        kinds: p.relationships.map(x => x.kind),
        arrowheads: p.relationships.map(x => Boolean(LINK_STYLES[x.kind].arrow)),
        visitOrder: L.route.visits.map(v => v.id),
        connectorLanding: landingNow,
        originalLowered: r(ge, 3),
        originalInBox: ge >= 1,
        originalScale: r(oScale, 3),
      },
    };
  },
};

/**
 * Legend of the connection kinds actually used. Items share one row when
 * they fit in `maxW`; otherwise they wrap onto rows that grow upward from
 * the given baseline, so the legend never leaves the design space.
 */
function legendNode(ctx, kinds, labels, at, maxW) {
  const th = ctx.theme;
  const size = 28;
  const gap = 46;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const rows = [[]];
  let rowW = 0;
  items.forEach((it, i) => {
    const w = widths[i];
    if (rows[rows.length - 1].length && rowW + gap + w > maxW) { rows.push([]); rowW = 0; }
    rows[rows.length - 1].push(i);
    rowW += (rowW ? gap : 0) + w;
  });
  const lineH = size * 1.5;
  const parts = [];
  rows.forEach((row, ri) => {
    const total = row.reduce((a, i) => a + widths[i], 0) + gap * (row.length - 1);
    let x = at.x - total / 2;
    const y = at.y - (rows.length - 1 - ri) * lineH;
    for (const i of row) {
      const it = items[i];
      const color = kindColor(ctx, it.k);
      const dash = it.k === 'communication' ? '10 8' : null;
      const arrow = it.k !== 'relation';
      parts.push(g({transform: T(x, y)},
        h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
        arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
        arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
        h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text)));
      x += widths[i] + gap;
    }
  });
  return {node: g({name: 'legend'}, parts), box: {x: at.x - maxW / 2, y: at.y - (rows.length - 1) * lineH - size * 0.8, w: maxW, h: (rows.length - 1) * lineH + size * 1.6}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-10-mechanism',
    title: 'Custody of the original — exploded custody and circulation',
    titleEs: 'Custodia del original — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Custodia del original',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded diagram in two zones: the signed original lifted over its slot in an open archive box with a custody seal (custody), and the working copy with the reader’s pen and working file (circulation). Only the supplied relationships are drawn, edge-anchored and styled by kind; a tracer follows the traversal order and the copy — never the original — receives notes when the tracer reaches it; at the end the original is lowered into its slot in the box.',
    tags: ['custody', 'original', 'working copy', 'mechanism', 'exploded', 'relations', 'tracer', 'archive box', 'seal'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/custodia-del-original.js', 'src/animations/documents/kits/custodia-del-original-exploded.js', 'src/frameworks/graph.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CUSTODY_STRINGS,
  scene,
});
