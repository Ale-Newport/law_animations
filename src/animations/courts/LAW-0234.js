/**
 * LAW-0234 — Archivo judicial · mechanism
 *
 * Storyboard (an exploded plan of the generic, fictional archive room: the
 * room of the story comes apart into its components, laid out where they
 * belong — the ● block of shelves (files supplied as active) at the back
 * left, the ◆ block (files supplied as archived) mirrored at the back right,
 * the locator console between them, the request slip with the identifier
 * lifted above the counter, the case file drawn out below its block, the
 * clerk under it and the counter with its two trays at the front. Each
 * component has its name chip; a panel holds the legend of the line kinds,
 * the category captions, the state and the key):
 *  0.00–0.18  separate: the assembled room fades to a faint outline while its
 *             components move apart to their places; the name chips appear.
 *  0.18–0.43  only the SUPPLIED relationships are drawn, one after another,
 *             anchored to the edges of their two components, each with its
 *             label beside it: plain relations as plain lines, a
 *             communication as a blue line with end dots, a sequence with
 *             numbered ends and the caption "sequence as configured
 *             (illustrative)"; a causal mark only if the author supplies it.
 *             No arrowheads between components.
 *  0.43–0.75  a tracer runs along the relationships in the supplied
 *             traversal order; the console lights the lamp of the block that
 *             holds the identifier, that block's lamp lights and its units
 *             roll open the aisle at the file; the focus element enlarges
 *             while the tracer is on it.
 *  0.75–1.00  gather: every relationship, the lit lamp, the open aisle and
 *             the file stay visible (origin, transformation, state) with the
 *             key "as supplied · no conclusion drawn".
 * Nothing states an archiving rule, a retention period, access or outcome.
 * @module animations/courts/LAW-0234
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  archFields, ARCH_EN, ARCH_STRINGS, archGeometry, blockNode, blockFrame, deskNode, slipNode, plaqueNode, consoleNode,
  clerkLook, legendItem, legendItem2, keyItem, stateItem, layoutPanel, overlaps, unionBox, pxPerUnit, R2, searchLayout,
  planPerson, fileProp, FILE, nameChip, mapper, textAt, fitG, BLOCK_TINT, STATES, FONT, floorAndWalls,
} from './kits/archivo-judicial.js';

const ID = 'LAW-0234';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {explode: [0.02, 0.14], chips: [0.14, 0.18], draw: [0.19, 0.42], trace: [0.44, 0.73], focusOut: [0.745, 0.785], state: [0.78, 0.83]};
const IDS = ['identifier', 'locator', 'activeShelves', 'archivedShelves', 'file', 'clerk', 'counter'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const FOCUS_SCALE = 1.22;

const STRINGS = {
  en: {...ARCH_STRINGS.en, mstate: 'The lamp is lit and the aisle is open in the block that holds the identifier (as supplied)'},
  es: {...ARCH_STRINGS.es, mstate: 'Luz encendida y pasillo abierto en el bloque del identificador (según lo aportado)'},
};

const sceneSchema = {
  ...archFields,
  elements: list('Component labels; ids are fixed by the scene, labels are editable. A block, the clerk or the counter without a label here shows its category name (courts.active / courts.archived / seats.clerk.name / seats.counter)', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships between components; kind sets the line style (causal only when the author supplies it); label is shown beside the line', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Label shown beside the line (as supplied)', 50),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption of each line kind in the legend', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 60),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {
  ...ARCH_EN,
  // (the blocks, the clerk and the counter are labelled with their category names unless a label is supplied here)
  elements: [
    {id: 'identifier', label: 'Identifier on the request slip'},
    {id: 'locator', label: 'Locator console'},
    {id: 'file', label: 'The case file'},
  ],
  relationships: [
    {from: 'identifier', to: 'locator', kind: 'communication', label: 'identifier keyed in'},
    {from: 'locator', to: 'activeShelves', kind: 'relation', label: 'lamp of the block'},
    {from: 'locator', to: 'archivedShelves', kind: 'relation', label: 'lamp of the block'},
    {from: 'activeShelves', to: 'file', kind: 'relation', label: 'holds the file'},
    {from: 'file', to: 'clerk', kind: 'relation', label: 'taken by the clerk'},
    {from: 'clerk', to: 'counter', kind: 'sequence', label: 'brought to its tray'},
  ],
  focusElement: 'activeShelves',
  relationLabels: {relation: 'Relation (plain line)', communication: 'Communication (blue line)', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['identifier', 'locator', 'activeShelves', 'file', 'clerk', 'counter'],
};

/* ------------------------------------------------------------------ */
/* Exploded geometry (room template units)                             */
/* ------------------------------------------------------------------ */

/** Where every component sits when assembled (in the room) and when the room is taken apart. */
function explodedGeometry(G, spread = 0, fb = 0) {
  // (spread: extra room between the upper row — blocks and console — and the lower components, for tall frames)
  const blkOff = [{x: -205, y: -82}, {x: 205, y: -82}];
  const blockBox = (b, off) => ({x: G.blocks[b].span.x - 8 + off.x, y: G.Y0 - 8 + off.y, w: G.blocks[b].span.w + 16, h: G.UL + 16});
  const fileS = 1.5, slipS = 2.4;
  const cons = {cx: G.RW / 2, cy: 30, w: 118, h: 84};
  const cmp = {
    activeShelves: {rest: {x: 0, y: 0}, off: blkOff[0], box: blockBox(0, blkOff[0])},
    archivedShelves: {rest: {x: 0, y: 0}, off: blkOff[1], box: blockBox(1, blkOff[1])},
    locator: {from: {x: G.RW / 2, y: G.cableY}, at: {x: cons.cx, y: cons.cy}, s0: 0.5, fadeIn: true, box: {x: cons.cx - cons.w / 2, y: cons.cy - cons.h / 2, w: cons.w, h: cons.h}},
    identifier: {from: {x: G.slip.x, y: G.slip.y}, at: {x: G.RW / 2, y: 292 + spread * 0.5}, s0: 1 / slipS, box: {x: G.RW / 2 - 19 * slipS, y: 292 + spread * 0.5 - 15 * slipS, w: 38 * slipS, h: 30 * slipS}},
    // the file and the clerk sit under the block that holds the file (the ◆ side mirrors the ● side)
    file: {from: G.blocks[fb].spine, at: {x: G.blocks[fb].span.x + G.blocks[fb].span.w / 2 + blkOff[fb].x, y: 322 + spread * 0.4}, s0: 0.5, fadeIn: true, box: null},
    clerk: {from: {x: G.home.x, y: G.home.y}, at: {x: G.blocks[fb].span.x + G.blocks[fb].span.w / 2 + blkOff[fb].x, y: 504 + spread}, box: null},
    counter: {rest: {x: 0, y: 0}, off: {x: 0, y: 108 + spread}, box: {x: G.counterBox.x, y: G.counterBox.y + 108 + spread, w: G.counterBox.w, h: G.counterBox.h}},
  };
  // (the file's box includes its tag on the right and its shadow; the clerk's includes the arms and the shadow)
  cmp.file.box = {x: cmp.file.at.x - 36 * fileS, y: cmp.file.at.y - 34 * fileS, w: 98 * fileS, h: 64 * fileS};
  cmp.clerk.box = {x: cmp.clerk.at.x - 56, y: cmp.clerk.at.y - 40, w: 112, h: 84};
  // plaques above the blocks
  const plaques = [0, 1].map(b => ({x: G.blocks[b].plaque.x + blkOff[b].x, y: G.Y0 - 8 + blkOff[b].y - 34}));
  return {cmp, blkOff, fileS, slipS, cons, plaques};
}

/** Centre of a box. */
const ctr = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
/** Scale a box about its centre. */
const scaleBox = (b, s) => ({x: b.x + b.w / 2 - (b.w * s) / 2, y: b.y + b.h / 2 - (b.h * s) / 2, w: b.w * s, h: b.h * s});
/** Where the segment from the centre of box a towards point q leaves the box. */
function exitPoint(a, q) {
  const c = ctr(a);
  const dx = q.x - c.x, dy = q.y - c.y;
  const tx = dx ? (a.w / 2) / Math.abs(dx) : Infinity, ty = dy ? (a.h / 2) / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty, 1);
  return {x: c.x + dx * t, y: c.y + dy * t};
}
/** The connector between two component boxes: from edge to edge along the line joining their centres. */
function connectorEnds(a, b) {
  return [exitPoint(a, ctr(b)), exitPoint(b, ctr(a))];
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const pf of [0.26, 0.3, 0.34]) arrs.push({panel: 'column', pf, cols: 1});
      for (const pf of [0.38, 0.42]) arrs.push({panel: 'column', pf, cols: 2});
      for (const pf of [0.26, 0.3, 0.34]) arrs.push({panel: 'band', pf, cols: 3});
    } else if (shape === 'square') {
      for (const top of [80, 105, 130]) {
        for (const pf of [0.26, 0.3, 0.34, 0.38, 0.42, 0.46]) arrs.push({panel: 'band', pf, cols: 3, top});
        for (const pf of [0.3, 0.34, 0.38]) arrs.push({panel: 'band', pf, cols: 2, top});
      }
    } else {
      // (tall frames: the lower components may move further down, lengthening the lines and freeing room for labels)
      for (const spread of [0, 260]) for (const top of [80, 130]) for (const pf of [0.3, 0.36, 0.42]) for (const cols of [2, 1]) arrs.push({panel: 'band', pf, cols, top, spread});
      // (or the exploded plan turned a quarter, its long side up the page)
      for (const top of [80, 130]) for (const pf of [0.3, 0.36, 0.42]) for (const cols of [2, 1]) arrs.push({panel: 'band', pf, cols, top, rot: true});
    }
    for (const A of arrs) A.key = `${A.panel}/${A.pf}/${A.cols}${A.top ? '/t' + A.top : ''}${A.spread ? '/s' + A.spread : ''}${A.rot ? '/rot' : ''}`;
    return searchLayout((v, A) => compose(ctx, p, v / px, px, A), arrs, L => Math.min(L.k, 1.2) + 0.8 * L.fill);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const X = L.X;
    const cmpNode = (id, inner) => g({name: `cmp-${id}`, transform: T(0, 0)}, inner);
    return g(null,
      g({name: 'plan', transform: L.M.transform},
       g({name: 'view', transform: 'translate(0 0)'},
        g({name: 'room', opacity: 1}, L.roomNode),
        // relationship lines (under the components)
        L.rels.map((rl, i) => g({name: `rel${i}`},
          h('path', {name: `rel${i}-line`, 'data-from': rl.from, 'data-to': rl.to, d: 'M0 0L1 0', fill: 'none', stroke: rl.color, 'stroke-width': rl.width, 'stroke-linecap': 'round', 'stroke-dasharray': '1 1', 'stroke-dashoffset': 0, 'data-draw': 1}),
          // end dots; a sequence has a solid start and a hollow end (its order, captioned in the legend)
          h('circle', {name: `rel${i}-a`, r: rl.kind === 'communication' ? 8 : rl.kind === 'sequence' ? 9 : 6, fill: rl.color, stroke: rl.color, 'stroke-width': 3, opacity: 0}),
          h('circle', {name: `rel${i}-b`, r: rl.kind === 'communication' ? 8 : rl.kind === 'sequence' ? 9 : 6, fill: rl.kind === 'sequence' ? th.card : rl.color, stroke: rl.color, 'stroke-width': 3, opacity: 0}),
          rl.kind === 'causal' ? h('path', {name: `rel${i}-mark`, d: 'M-12 -10L4 0L-12 10', fill: 'none', stroke: rl.color, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0}) : null)),
        // the components
        cmpNode('activeShelves', g(null, h('rect', {name: 'tint0', x: r(L.G.blocks[0].span.x - 8), y: r(L.G.Y0 - 8), width: r(L.G.blocks[0].span.w + 16), height: r(L.G.UL + 16), rx: 10, fill: BLOCK_TINT, stroke: '#aeb9c3', 'stroke-width': 2.4}), L.blk0, plaqueNode(ctx, 'active', L.G.blocks[0].plaque.x, L.G.Y0 - 42, 'm-plaque0', 'm-mark0'))),
        cmpNode('archivedShelves', g(null, h('rect', {name: 'tint1', x: r(L.G.blocks[1].span.x - 8), y: r(L.G.Y0 - 8), width: r(L.G.blocks[1].span.w + 16), height: r(L.G.UL + 16), rx: 10, fill: BLOCK_TINT, stroke: '#aeb9c3', 'stroke-width': 2.4}), L.blk1, plaqueNode(ctx, 'archived', L.G.blocks[1].plaque.x, L.G.Y0 - 42, 'm-plaque1', 'm-mark1'))),
        cmpNode('counter', L.desk),
        cmpNode('locator', consoleNode(ctx, {name: 'console', cx: 0, cy: 0, w: X.cons.w, h: X.cons.h})),
        cmpNode('identifier', slipNode('m-slip', 0, 0, X.slipS)),
        cmpNode('file', g({transform: `scale(${X.fileS})`}, fileProp(ctx, {name: 'm-file'}))),
        cmpNode('clerk', L.clerk.node),
        h('circle', {name: 'tracer', r: 11, fill: th.accent2, stroke: '#fff', 'stroke-width': 3, opacity: 0}),
       ),
      ),
      L.chipNodes,
      L.relLabelNodes,
      L.panelNode,
      L.stateNode,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const X = L.X, G = L.G;
    // separate: the room fades to an outline while its components move to their places
    const ex = ease.inOutCubic(seg(u, ...W.explode));
    nodes.room = {opacity: r(1 - ex, 3)};
    // the assembled room first fills the frame; the view widens while it comes apart (identity once separated)
    const z = lerp(L.z0, 1, ex);
    const zc = {x: lerp(L.cRoom.x, L.cE.x, ex), y: lerp(L.cRoom.y, L.cE.y, ex)};
    nodes.view = {transform: `${T(r(L.cE.x, 2), r(L.cE.y, 2))} scale(${r(z, 4)}) ${T(r(-zc.x, 2), r(-zc.y, 2))}`};
    // tracer and focus
    const tq = seg(u, ...W.trace);
    const s = L.tracerLen > 0 ? ease.inOutSine(tq) * L.tracerLen : 0;
    const focusIn = L.focusAt !== null ? clamp((s - L.focusAt) / 60) : 0;
    const focusS = 1 + (FOCUS_SCALE - 1) * ease.inOutCubic(focusIn) * (1 - ease.inOutCubic(seg(u, ...W.focusOut)));
    const boxes = {};
    for (const id of IDS) {
      const cm = X.cmp[id];
      const sc = id === L.focus ? focusS : 1;
      let tr;
      if (cm.off) {
        const off = {x: cm.off.x * ex, y: cm.off.y * ex};
        const c0 = ctr(cm.box);
        const cOrig = {x: c0.x - cm.off.x, y: c0.y - cm.off.y};
        // scale about the component's centre (in its current place): q -> sc q + off + cOrig (1 - sc)
        tr = `${T(r(off.x + cOrig.x * (1 - sc), 2), r(off.y + cOrig.y * (1 - sc), 2))} scale(${r(sc, 4)})`;
        boxes[id] = scaleBox({...cm.box, x: cm.box.x - cm.off.x + off.x, y: cm.box.y - cm.off.y + off.y}, sc);
      } else {
        // components that are not drawn as such in the room (console, slip, file) come out of their place in it:
        // the slip grows from its size on the counter, the console and the file grow from half size as they appear
        const at = {x: lerp(cm.from.x, cm.at.x, ex), y: lerp(cm.from.y, cm.at.y, ex)};
        const grow = lerp(cm.s0 ?? 1, 1, ex);
        tr = T(r(at.x, 2), r(at.y, 2), 0, r(sc * grow, 4));
        const b0 = cm.box;
        boxes[id] = scaleBox({x: at.x - b0.w / 2, y: at.y - b0.h / 2, w: b0.w, h: b0.h}, sc * grow);
      }
      nodes[`cmp-${id}`] = {transform: tr, opacity: r(cm.fadeIn ? seg(ex, 0.15, 0.6) : 1, 3)};
    }
    // the clerk turns from the counter (as in the room) to face the file, and stands still
    Object.assign(nodes, L.clerk.pose({x: 0, y: 0, deg: r(180 * (1 - ease.inOutSine(seg(ex, 0.3, 0.9))), 2), scale: 1}));
    // the block that holds the identifier: its lamp lights when the tracer reaches it, then its units roll open
    const lampU = L.holdAt !== null ? clamp((s - L.holdAt) / 40) : seg(u, 0.6, 0.62);
    const openU = L.holdAt !== null ? ease.inOutCubic(clamp((s - L.holdAt - 40) / 220)) : ease.inOutCubic(seg(u, 0.62, 0.7));
    const consU = L.consAt !== null ? clamp((s - L.consAt) / 30) : seg(u, 0.55, 0.57);
    G.blocks.forEach(B => Object.assign(nodes, blockFrame(G, B, 'm', B.b === L.fb ? openU : 0, B.b === L.fb ? lampU : 0)));
    nodes['console-lit0'] = {opacity: r(L.fb === 0 ? consU : 0, 3)};
    nodes['console-lit1'] = {opacity: r(L.fb === 1 ? consU : 0, 3)};
    // relationships: drawn one after another, edge to edge (they follow their components)
    const n = L.rels.length;
    L.rels.forEach((rl, i) => {
      const a0 = W.draw[0] + ((W.draw[1] - W.draw[0]) * i) / n, a1 = W.draw[0] + ((W.draw[1] - W.draw[0]) * (i + 0.8)) / n;
      const dp = ease.inOutSine(seg(u, a0, a1));
      const [pa, pb] = connectorEnds(boxes[rl.from], boxes[rl.to]);
      const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      nodes[`rel${i}-line`] = {d: `M${r(pa.x)} ${r(pa.y)}L${r(pb.x)} ${r(pb.y)}`, 'stroke-dasharray': `${r(len + 2)} ${r(len + 2)}`, 'stroke-dashoffset': r((len + 2) * (1 - dp))};
      nodes[`rel${i}-a`] = {cx: r(pa.x), cy: r(pa.y), opacity: r(dp > 0 ? 1 : 0, 3)};
      nodes[`rel${i}-b`] = {cx: r(pb.x), cy: r(pb.y), opacity: r(dp >= 1 ? 1 : 0, 3)};
      if (rl.kind === 'causal') {
        const m = {x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2};
        nodes[`rel${i}-mark`] = {transform: T(r(m.x), r(m.y), r((Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI, 2)), opacity: r(dp >= 1 ? 1 : 0, 3)};
      }
      // the label (and the sequence's numbered ends) appears once its line is drawn
      nodes[`rlab${i}`] = {opacity: r(seg(u, a1 - 0.004, a1 + 0.012), 3)};
    });
    // tracer along the traversal (edge to edge, through each component)
    const tp = L.tracerPath(boxes, s);
    nodes.tracer = {cx: r(tp.x), cy: r(tp.y), opacity: r(tq > 0 && tq < 1 ? 1 : 0, 3)};
    // chips appear with the separation
    const chipOp = seg(u, ...W.chips);
    for (const nm of L.chipNames) nodes[nm] = {opacity: r(chipOp, 3)};
    if (L.stateNode) nodes.state = {opacity: r(seg(u, ...W.state), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const toD = L.M.toD;
    return {
      nodes,
      semantic: {
        beat,
        explode: r(ex, 3),
        relationsDrawn: L.rels.map((rl, i) => r(seg(u, W.draw[0] + ((W.draw[1] - W.draw[0]) * i) / n, W.draw[0] + ((W.draw[1] - W.draw[0]) * (i + 0.8)) / n), 3)),
        relationKinds: L.rels.map(rl => rl.kind),
        arrowheads: L.rels.filter(rl => rl.kind === 'causal').length,
        tracer: R2(toD(tp)),
        tracerOn: tp.on,
        tracerVisible: tq > 0 && tq < 1,
        focus: L.focus,
        focusScale: r(focusS, 3),
        lamp: r(lampU, 3),
        open: r(openU, 3),
        consoleLamp: r(consU, 3),
        block: STATES[L.fb],
        visited: L.visitOrder,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.M.k, 3),
        arrangement: L.arrangement,
        problems: L.problems,
        log: L.log,
      },
    };
  },
};

/** One composition at text size F (design units) for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const G = archGeometry();
  const fb = p.file.state === 'archived' ? 1 : 0;
  const X = explodedGeometry(G, A.spread || 0, fb);
  const fallback = {activeShelves: p.courts.active, archivedShelves: p.courts.archived, clerk: p.seats.clerk.name, counter: p.seats.counter};
  const label = id => ((p.elements || []).find(e => e.id === id) || {}).label || fallback[id];
  const present = new Set(IDS);
  // ---- relationships (only between known components; a self-link is ignored)
  const rels = (p.relationships || []).filter(rl => rl.from !== rl.to && present.has(rl.from) && present.has(rl.to)).map(rl => ({
    ...rl,
    color: rl.kind === 'communication' ? th.accent2 : th.ink,
    width: rl.kind === 'causal' ? 5 : 4,
    text: rl.label || (p.relationLabels && p.relationLabels[rl.kind]) || rl.kind,
  }));
  // ---- panel
  const kindsUsed = KINDS.filter(kd => rels.some(rl => rl.kind === kd));
  const items = panelItems(ctx, p, F, showAll, showKey, kindsUsed);
  let region = {x: 0, y: 0, w: D.w, h: D.h};
  let panel = null;
  if (items.length) {
    if (A.panel === 'column') {
      const pw = D.w * A.pf;
      const pb = {x: D.w - pw, y: 0, w: pw, h: D.h};
      region = {x: 0, y: 0, w: D.w - pw - 24, h: D.h};
      panel = layoutPanel(items, pb, F, A.cols === 2 ? 'band' : 'column', A.cols);
      panel.place(pb);
    } else {
      const pb0 = {x: 0, y: D.h * (1 - A.pf), w: D.w, h: D.h * A.pf};
      panel = layoutPanel(items, pb0, F, 'band', A.cols);
      const used = Math.min(panel.height, pb0.h);
      const pb = {x: 0, y: D.h - used, w: D.w, h: used};
      region = {x: 0, y: 0, w: D.w, h: D.h - used - 20};
      panel.place(pb);
    }
    if (panel.problem) problems.push(panel.problem);
  }
  // ---- map the exploded plan into the region (its extents: every component, the focus at its enlarged size, the
  // plaques, and a margin for the chips above the blocks and below the counter)
  const focus0 = p.focusElement || 'activeShelves';
  const plq = (b, s) => { const c0 = ctr(X.cmp[b ? 'archivedShelves' : 'activeShelves'].box); const q = {x: c0.x + (X.plaques[b].x - c0.x) * s, y: c0.y + (X.plaques[b].y - c0.y) * s}; return {x: q.x - 26 * s, y: q.y - 26 * s, w: 52 * s, h: 52 * s}; };
  const ub = unionBox([...IDS.map(id => (id === focus0 ? scaleBox(X.cmp[id].box, FOCUS_SCALE) : X.cmp[id].box)), ...[0, 1].map(b => plq(b, 1)), ...[0, 1].filter(b => focus0 === (b ? 'archivedShelves' : 'activeShelves')).map(b => plq(b, FOCUS_SCALE))]);
  // (labels hidden: no chips, so only a small margin)
  const topM = showKey ? A.top || 80 : 16, botM = showKey ? 64 : 16;
  X.E = {x: ub.x - 20, y: ub.y - topM, w: ub.w + 40, h: ub.h + topM + botM};
  const M = mapper(X.E, region, Boolean(A.rot), 1.4);
  const k = M.k;
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  const focus = p.focusElement || 'activeShelves';
  // component boxes at the end of the separation (design units); the focus element also at its enlarged size
  const boxT = {};
  for (const id of IDS) boxT[id] = X.cmp[id].box;
  const boxD = id => M.box(boxT[id]);
  const bigD = id => M.box(id === focus ? scaleBox(boxT[id], FOCUS_SCALE) : boxT[id]);
  // plaques (with the enlarged focus block, its plaque also where the enlargement takes it)
  const plaqueAt = (b, big) => {
    const id = b ? 'archivedShelves' : 'activeShelves';
    const c0 = ctr(boxT[id]);
    const s = big && id === focus ? FOCUS_SCALE : 1;
    const q = {x: c0.x + (X.plaques[b].x - c0.x) * s, y: c0.y + (X.plaques[b].y - c0.y) * s};
    const d = M.toD(q);
    return {x: d.x - 26 * k * s, y: d.y - 26 * k * s, w: 52 * k * s, h: 52 * k * s};
  };
  const plaqueD = [0, 1].map(b => unionBox([plaqueAt(b, false), plaqueAt(b, true)]));
  // the connectors (design units), at rest and with the focus enlarged
  const segs = rels.map(rl => connectorEnds(boxT[rl.from], boxT[rl.to]).map(M.toD));
  const segsBig = rels.map(rl => connectorEnds(rl.from === focus ? scaleBox(boxT[rl.from], FOCUS_SCALE) : boxT[rl.from], rl.to === focus ? scaleBox(boxT[rl.to], FOCUS_SCALE) : boxT[rl.to]).map(M.toD));
  segsBig.forEach(([a, b]) => { if (Math.hypot(b.x - a.x, b.y - a.y) < 50) problems.push('short-connector'); });
  // no line passes through a component other than its two ends
  rels.forEach((rl, i) => {
    const [a, b] = segsBig[i];
    for (const id of IDS) {
      if (id === rl.from || id === rl.to) continue;
      const q = bigD(id);
      for (let j = 1; j < 40; j++) { const x = a.x + (b.x - a.x) * j / 40, y = a.y + (b.y - a.y) * j / 40; if (x > q.x + 2 && x < q.x + q.w - 2 && y > q.y + 2 && y < q.y + q.h - 2) { problems.push(`line-through-${id}`); break; } }
    }
  });
  const texts = [];
  const hard = [...IDS.map(bigD), ...plaqueD];
  const inDesign = b => b.x >= 2 && b.y >= 2 && b.x + b.w <= D.w - 2 && b.y + b.h <= D.h - 2;
  const segHits = (bx, pad = 4) => segsBig.some(([a, b]) => { for (let j = 0; j <= 30; j++) { const q = {x: a.x + (b.x - a.x) * j / 30, y: a.y + (b.y - a.y) * j / 30}; if (q.x > bx.x - pad && q.x < bx.x + bx.w + pad && q.y > bx.y - pad && q.y < bx.y + bx.h + pad) return true; } return false; });
  const segDist = (bx, sg) => { let m = Infinity; const [a, b] = sg; for (let j = 0; j <= 40; j++) { const q = {x: a.x + (b.x - a.x) * j / 40, y: a.y + (b.y - a.y) * j / 40}; m = Math.min(m, Math.hypot(Math.max(bx.x - q.x, 0, q.x - bx.x - bx.w), Math.max(bx.y - q.y, 0, q.y - bx.y - bx.h))); } return m; };
  // ---- relationship labels: beside their own line (<= 20 design units from it), nearer it than any other line
  const relLabelNodes = [];
  rels.forEach((rl, i) => {
    const [a, b] = segs[i];
    const [ab, bb] = segsBig[i];
    if (!showKey) {
      // labels hidden: no label (the line's own end dots keep its kind)
      relLabelNodes.push(g({name: `rlab${i}`, opacity: 0}));
      return;
    }
    // (a label beside a mostly horizontal line wraps to fit between its two components)
    const lenB = Math.hypot(bb.x - ab.x, bb.y - ab.y) || 1;
    const horiz = Math.abs(bb.x - ab.x) / lenB;
    const mw0 = horiz > 0.7 ? Math.max(F * 4.5, Math.min(260, lenB * 0.86 - F * 0.9)) : Math.min(260, D.w * 0.3);
    const pad = F * 0.35;
    const dx = b.x - a.x, dy = b.y - a.y, L0 = Math.hypot(dx, dy) || 1;
    const nx = -dy / L0, ny = dx / L0;
    let best = null, fit = null, w = 0, hh = 0;
    const badgeBoxes = [];
    const why = {};
    const no = kk => { why[kk] = (why[kk] || 0) + 1; };
    // (a mostly horizontal line takes its label above it first, a vertical one to its right: mirrored lines match)
    const sides = Math.abs(nx) < Math.abs(ny) ? (ny < 0 ? [1, -1] : [-1, 1]) : (nx > 0 ? [1, -1] : [-1, 1]);
    // (a label that does not fit beside its line on one or two lines wraps narrower, up to three lines)
    for (const mw of [mw0, mw0 * 0.7, mw0 * 0.52]) {
      fit = fitG(rl.text, {maxWidth: Math.max(F * 4.5, mw), size: F, minSize: F, maxLines: 3, weight: 600});
      w = fit.width + 2 * pad; hh = fit.height + 2 * pad * 0.7;
      for (const t of [0.5, 0.42, 0.58, 0.34, 0.66]) for (const side of sides) for (const gap of [8, 14]) {
        const m = {x: lerp(ab.x, bb.x, t), y: lerp(ab.y, bb.y, t)};
        // the label's nearest point sits `gap` from the line on the chosen side
        const cx = m.x + side * nx * (gap + Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2);
        const cy = m.y + side * ny * (gap + Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2);
        const bx = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
        if (!inDesign(bx)) { no('frame'); continue; }
        if (hard.some(q => overlaps(q, bx, 4)) || badgeBoxes.some(q => overlaps(q, bx, 4))) { no('hard'); continue; }
        if (texts.some(q => overlaps(q, bx, 6))) { no('text'); continue; }
        if (panel && panel.boxes.some(q => overlaps(q, bx, 6))) { no('panel'); continue; }
        const own = segDist(bx, [ab, bb]);
        const other = Math.min(Infinity, ...segsBig.filter((_, j) => j !== i).map(sg => segDist(bx, sg)));
        if (own > 22 || other <= own + 6) { no('dist'); continue; }
        best = {bx, t}; break;
      }
      if (best || fit.truncated) break;
    }
    if (fit.truncated) problems.push('rel-label-trunc');
    if (!best) { problems.push(`rel-label-${i}:${Object.entries(why).map(([a, b]) => a + b).join('.')}`); best = {bx: {x: (a.x + b.x) / 2 - w / 2, y: (a.y + b.y) / 2 - hh / 2, w, h: hh}}; }
    const {bx} = best;
    texts.push(bx, ...badgeBoxes);
    const seqEnds = null;
    relLabelNodes.push(g({name: `rlab${i}`, opacity: 0},
      showKey ? h('path', {d: roundRectPath(bx.x, bx.y, w, hh, Math.min(hh / 2, F * 0.5)), fill: th.card, stroke: rl.color, 'stroke-width': 2}) : null,
      showKey ? textAt(fit, bx.x + pad, bx.y + (hh - fit.height) / 2, th.ink, {name: `rlab${i}-text`}) : null,
      seqEnds));
    rl.labelBox = bx;
  });
  // ---- component name chips (near their component, clear of every component, line and label)
  const chipNames = [];
  const chipNodes = [];
  if (showKey) {
    // (the two blocks first, so their chips can take mirrored places beside their plaques)
    const CHIP_ORDER = ['activeShelves', 'archivedShelves', 'identifier', 'locator', 'file', 'clerk', 'counter'];
    const specs = CHIP_ORDER.map(id => {
      const glyph = id === 'activeShelves' ? 'active' : id === 'archivedShelves' ? 'archived' : id === 'identifier' ? 'slip' : null;
      const text = id === 'identifier' ? `${label(id) || ''}: ${p.file.identifier}` : label(id);
      return {id, glyph, text};
    }).filter(sp => sp.text && sp.text.trim());
    const free = bx => inDesign(bx) && !hard.some(q => overlaps(q, bx, 4)) && !texts.some(q => overlaps(q, bx, 8)) && !(panel && panel.boxes.some(q => overlaps(q, bx, 6))) && !segHits(bx, 6);
    // a chip box beside part pt on `side`, `gap` away, slid by f (up to the part's half size plus the chip's)
    const at = (pt, side, gap, f, c) => (side === 'above' ? {x: pt.x + pt.w / 2 - c.w / 2 + f * (pt.w / 2 + c.w / 2), y: pt.y - gap - c.h, w: c.w, h: c.h}
      : side === 'below' ? {x: pt.x + pt.w / 2 - c.w / 2 + f * (pt.w / 2 + c.w / 2), y: pt.y + pt.h + gap, w: c.w, h: c.h}
        : side === 'right' ? {x: pt.x + pt.w + gap, y: pt.y + pt.h / 2 - c.h / 2 + f * (pt.h / 2 + c.h / 2), w: c.w, h: c.h}
          : {x: pt.x - gap - c.w, y: pt.y + pt.h / 2 - c.h / 2 + f * (pt.h / 2 + c.h / 2), w: c.w, h: c.h});
    const mk = (sp, mw) => nameChip(ctx, sp.text, {F, maxWidth: mw, maxLines: 3, weight: 700, glyph: sp.glyph, stroke: sp.id === 'identifier' ? th.accent2 : th.ink});
    const widths = [Math.min(D.w * 0.34, 340), 250, 190];
    const placed = {};
    // the two blocks together, in mirrored places: beside their plaques (inner sides, then outer), else above them
    const bl = specs.filter(sp => sp.id === 'activeShelves' || sp.id === 'archivedShelves');
    if (bl.length) {
      const modes = [['right', 'left', 'plaque'], ['left', 'right', 'plaque'], ['above', 'above', 'plaque'], ['above', 'above', 'part'], ['below', 'below', 'part']];
      let done = false;
      // (a block's name may take a wider single line above its plaque)
      for (const mw of [Math.min(D.w * 0.42, 400), ...widths]) {
        const cs = bl.map(sp => mk(sp, mw));
        if (cs.some(c => c.fit.truncated)) continue;
        for (const [sa, sb, ref] of modes) {
          for (const gap of [8, 14, 22]) {
            for (const f of [0, -0.2, 0.2, -0.4, 0.4]) {
              const boxes2 = bl.map((sp, j) => {
                const a = sp.id === 'activeShelves';
                const pt = ref === 'plaque' ? plaqueD[a ? 0 : 1] : bigD(sp.id);
                // mirrored slide for the ◆ block
                return at(pt, a ? sa : sb, gap, a ? f : -f, cs[j]);
              });
              if (boxes2.every(free) && !(boxes2.length === 2 && overlaps(boxes2[0], boxes2[1], 8))) {
                bl.forEach((sp, j) => { placed[sp.id] = {bx: boxes2[j], c: cs[j]}; texts.push(boxes2[j]); });
                done = true;
                break;
              }
            }
            if (done) break;
          }
          if (done) break;
        }
        if (done) break;
      }
      if (!done) problems.push('chip-place-blocks');
    }
    for (const sp of specs) {
      if (placed[sp.id]) continue;
      const part = bigD(sp.id);
      const order = sp.id === 'counter' ? ['below', 'right', 'left', 'above'] : ['right', 'left', 'below', 'above'];
      let best = null;
      for (const mw of widths) {
        const c = mk(sp, mw);
        if (c.fit.truncated) continue;
        for (const side of order) {
          for (const gap of [8, 16, 26, 40, 56]) {
            for (const f of [0, -0.25, 0.25, -0.5, 0.5, -0.75, 0.75, -1, 1]) {
              const bx = at(part, side, gap, f, c);
              if (free(bx)) { best = {bx, c}; break; }
            }
            if (best) break;
          }
          if (best) break;
        }
        if (best) break;
      }
      if (!best) { problems.push(`chip-place-${sp.id}`); const c = mk(sp, widths[0]); best = {bx: {x: part.x, y: part.y - c.h - 6, w: c.w, h: c.h}, c}; }
      placed[sp.id] = best;
      texts.push(best.bx);
    }
    for (const sp of specs) {
      const {bx, c} = placed[sp.id] || {};
      if (!bx) continue;
      if (c.fit.truncated) problems.push('chip-trunc');
      const isBlock = sp.id === 'activeShelves' || sp.id === 'archivedShelves';
      const nm = `chip-${sp.id}`;
      chipNames.push(nm);
      // a short leader from the chip to its component (a block's leader runs to its plaque, never across it)
      const lp = isBlock ? plaqueD[sp.id === 'activeShelves' ? 0 : 1] : bigD(sp.id);
      chipNodes.push(g({name: nm, opacity: 0}, leaderLine(bx, lp, th.inkSoft), c.node(bx.x, bx.y, `${nm}-card`)));
    }
  }
  // ---- audit
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (overlaps(texts[i], texts[j], 2)) { problems.push('overlap'); i = texts.length; break; }
  const planD = M.box(X.E);
  if (panel && panel.boxes.some(b => overlaps(b, unionBox(IDS.map(bigD)), 2))) problems.push('panel-on-plan');
  const ext = unionBox([...IDS.map(bigD), ...plaqueD, ...texts, ...(panel ? panel.boxes : [])]);
  const fill = Math.min(ext.w / D.w, ext.h / D.h);
  if (showKey && fill < 0.78) problems.push('fill');
  void planD;
  // ---- traversal: the tracer runs along the relationships between consecutive components (edge to edge, through
  // each component); where no relationship joins two consecutive components it moves straight between them
  const order = (p.traversalOrder || []).filter(id => present.has(id));
  const steps = [];
  for (let i = 0; i + 1 < order.length; i++) steps.push([order[i], order[i + 1]]);
  const visitOrder = order.slice();
  // arc lengths at rest (template units) for the timing of the focus, console and block events
  const pathAt = (boxes) => {
    const pts = [];
    steps.forEach(([a, b]) => {
      const [pa, pb] = connectorEnds(boxes[a], boxes[b]);
      pts.push(pa, pb);
    });
    return pts;
  };
  const boxesRest = {};
  for (const id of IDS) boxesRest[id] = boxT[id];
  const restPts = pathAt(boxesRest);
  const restPoly = restPts.length > 1 ? polyline(restPts) : null;
  const cum = [0];
  for (let i = 1; i < restPts.length; i++) cum.push(cum[i - 1] + Math.hypot(restPts[i].x - restPts[i - 1].x, restPts[i].y - restPts[i - 1].y));
  const arrival = id => { const j = steps.findIndex(([, b]) => b === id); if (j >= 0) return cum[2 * j + 1]; const j0 = steps.findIndex(([a]) => a === id); return j0 >= 0 ? cum[2 * j0] : null; };
  const tracerLen = restPoly ? restPoly.total : 0;
  const tracerPath = (boxes, s) => {
    const pts = pathAt(boxes);
    if (pts.length < 2) return {x: 0, y: 0, on: null};
    // the same arc-length fraction on the current path (the focus may be enlarged)
    const poly = polyline(pts);
    const q = poly.at(tracerLen ? s / tracerLen : 0);
    let on = null;
    for (let j = 0; j < pts.length - 1; j++) if (s >= cum[j] - 1e-6 && s <= cum[j + 1] + 1e-6) { on = j % 2 === 0 ? `${steps[j / 2][0]}>${steps[j / 2][1]}` : `in:${steps[(j - 1) / 2][1]}`; break; }
    return {x: q.x, y: q.y, on};
  };
  // the art
  // (the file is its own component here: the blocks draw no shelved copy of it)
  const blk0 = blockNode(ctx, G, G.blocks[0], 'm', false);
  const blk1 = blockNode(ctx, G, G.blocks[1], 'm', false);
  const desk = deskNode(ctx, G, 'm', {slip: false});
  const clerk = planPerson(ctx, {name: 'm-clerk', look: clerkLook(ctx, p)});
  const roomNode = floorAndWalls(ctx, G, 'm');
  // the zoom that makes the assembled room fill the plan's extents at the start
  const roomB = {x: -G.t, y: -G.t - 30, w: G.RW + 2 * G.t, h: G.RH + 2 * G.t + 30 + 20};
  const z0 = Math.max(1, Math.min(X.E.w / roomB.w, X.E.h / roomB.h) * 0.96);
  return {
    z0, cRoom: ctr(roomB), cE: ctr(X.E),
    F, px, M, G, X, k, fb, focus, rels, relLabelNodes, chipNodes, chipNames, blk0, blk1, desk, clerk, roomNode,
    tracerLen, tracerPath, focusAt: arrival(focus), holdAt: arrival(fb ? 'archivedShelves' : 'activeShelves'), consAt: arrival('locator'), visitOrder,
    panelNode: panel ? panel.node : null, stateNode: panel ? panel.stateNode : null,
    personPx, problems, fill, arrangement: A.key,
  };
}

/** A thin leader from a chip to the nearest point of its component. */
function leaderLine(box, part, col) {
  const cx = Math.max(part.x, Math.min(box.x + box.w / 2, part.x + part.w)), cy = Math.max(part.y, Math.min(box.y + box.h / 2, part.y + part.h));
  const ex = Math.max(box.x, Math.min(cx, box.x + box.w)), ey = Math.max(box.y, Math.min(cy, box.y + box.h));
  if (Math.hypot(cx - ex, cy - ey) < 3) return null;
  return h('line', {x1: r(ex), y1: r(ey), x2: r(cx), y2: r(cy), stroke: col, 'stroke-width': 2, 'stroke-linecap': 'round'});
}

/** The panel's items: line kinds (only those used), the category captions, the state and the key. */
function panelItems(ctx, p, F, showAll, showKey, kindsUsed) {
  const items = [];
  const has = id => (p.elements || []).some(e => e.id === id && e.label);
  if (showKey) {
    // category names shown here only when a supplied component label takes their chip
    if (has('activeShelves')) items.push(legendItem(ctx, {kind: 'active', text: p.courts.active, F, name: 'legend-active', weight: 700}));
    if (has('archivedShelves')) items.push(legendItem(ctx, {kind: 'archived', text: p.courts.archived, F, name: 'legend-archived', weight: 700}));
  }
  if (showAll) {
    items.push(legendItem2(ctx, {kind: 'room', title: p.courts.archive, text: p.courts.building, F, name: 'legend-room'}));
    if (has('clerk')) items.push(legendItem(ctx, {kind: 'person', text: p.seats.clerk.name, F, name: 'legend-clerk', weight: 600, glyphOpts: {look: clerkLook(ctx, p)}}));
    items.push(legendItem(ctx, {kind: 'unit', text: p.routes.rails, F, name: 'legend-rails'}));
    items.push(legendItem(ctx, {kind: 'locator', text: p.routes.locator, F, name: 'legend-locator'}));
    if (has('counter')) items.push(legendItem(ctx, {kind: 'counter', text: p.seats.counter, F, name: 'legend-counter'}));
    for (const kd of kindsUsed) items.push(legendItem(ctx, {kind: `line-${kd}`, text: kd === 'sequence' ? p.labels.sequence : p.relationLabels[kd], F, name: `legend-${kd}`}));
  }
  if (showKey) {
    items.push(stateItem(ctx, ctx.t.mstate, F, {name: 'state'}));
    items.push(keyItem(ctx, p.labels.key, F));
  }
  return items;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-09-mechanism',
    title: 'Court archive — how the identifier, the locator and the shelves are related',
    titleEs: 'Archivo judicial — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Archivo judicial',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded plan of a generic, fictional archive room: the identifier slip, the locator console, the ● block (files supplied as active) and the mirrored ◆ block (files supplied as archived), the case file, the clerk and the counter with two trays. Only the supplied relationships are drawn, edge to edge, with their labels (plain relations, a communication, a numbered sequence captioned as configured); a tracer follows the traversal order, the console and the block that holds the identifier light up and its units roll open the aisle; the focus element enlarges. No arrows, no archiving rule, no outcome.',
    tags: ['exploded plan', 'mechanism', 'archive', 'mobile shelving', 'locator', 'identifier', 'relationships', 'tracer', 'active', 'archived'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/archivo-judicial.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
