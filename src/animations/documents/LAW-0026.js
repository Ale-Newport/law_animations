/**
 * LAW-0026 — Traducción paralela · mechanism
 *
 * Storyboard (exploded parallel text, 7 s):
 *  0.00–0.18  separate: two miniature pages (source, translation) sit at the
 *             sides; segment N lifts out of each page as a large paper strip
 *             (its empty slot stays outlined in the page), the term record
 *             card and the translation file appear.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             anchored to real edges and styled by kind (plain relation = no
 *             arrow; sequence / communication arrows; causal only if supplied).
 *             The guide between the two strips is a plain relation.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order; the focus
 *             element enlarges as it passes. The part that changes — the term
 *             slot of the translated strip — stays blank until the tracer
 *             arrives there, then shows the equivalent from the record (or the
 *             retained source term with a question mark when no equivalent is
 *             confirmed). The file receives both sheets when the tracer
 *             reaches it.
 *  0.75–1.00  gather: everything stays anchored; origin (source strip),
 *             transformation (guide + record) and state (slot, file) are
 *             visible with a descriptive state chip and a kind legend.
 * @module animations/documents/LAW-0026
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mechanismFields, oneOf} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {translationFields, TP_STRINGS, segmentStrip, termCard, fileFolder, miniPage, stateChip, pairColor} from './kits/traduccion-paralela.js';

const ID = 'LAW-0026';
const DURATION = 7000;
const IDS = ['source', 'segment', 'record', 'translation', 'target', 'folder'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {appear: [0, 0.08], lift: [0.04, 0.17], relate: [0.18, 0.43], trace: [0.44, 0.74], fill: 0.05, state: [0.8, 0.88]};

const sceneSchema = {
  ...translationFields,
  ...mechanismFields(IDS),
  termStatus: oneOf('State of the key term in the record: "available" (an equivalent is recorded and inserted) or "unconfirmed" (no confirmed equivalent: the translation keeps the source term with a question mark)', ['available', 'unconfirmed']),
};
sceneSchema.relationships = {...sceneSchema.relationships, items: {...sceneSchema.relationships.items, properties: {...sceneSchema.relationships.items.properties, label: {type: 'string', maxLength: 44, description: 'Caption for this relationship (defaults to the caption of its kind)'}}}};

const defaultParams = {
  documentId: 'TR-208',
  documentTitle: 'Carta de entrega',
  targetTitle: 'Delivery letter',
  languages: {source: 'ES', target: 'EN'},
  clauses: [
    'El proveedor entrega veinte cajas el día 3.',
    'La carga se deja en la lonja del puerto.',
    'Cada parte guarda una copia de esta carta.',
  ],
  translations: [
    'The supplier delivers twenty boxes on day 3.',
    'The load is left at the port fish-market hall.',
    'Each party keeps a copy of this letter.',
  ],
  term: {segment: 1, source: 'lonja', target: 'fish-market hall'},
  signers: [{name: 'Lena Ortiz', role: 'Translator'}, {name: 'Tomás Rivera', role: 'Reviewer'}],
  redactions: [],
  termStatus: 'available',
  elements: [
    {id: 'source', label: 'Source page (ES)'},
    {id: 'segment', label: 'Source segment 2'},
    {id: 'record', label: 'Term record'},
    {id: 'translation', label: 'Translated segment 2'},
    {id: 'target', label: 'Translated page (EN)'},
    {id: 'folder', label: 'Translation file'},
  ],
  relationships: [
    {from: 'source', to: 'segment', kind: 'relation', label: 'contains'},
    {from: 'segment', to: 'translation', kind: 'relation', label: 'guide: equivalent segment'},
    {from: 'segment', to: 'record', kind: 'sequence', label: 'term looked up'},
    {from: 'record', to: 'translation', kind: 'sequence', label: 'equivalent inserted'},
    {from: 'translation', to: 'target', kind: 'relation', label: 'placed in'},
    {from: 'target', to: 'folder', kind: 'relation', label: 'filed with its source'},
  ],
  focusElement: 'record',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['source', 'segment', 'record', 'translation', 'target', 'folder'],
};

/**
 * Component sizes per shape (design units). Positions are derived in
 * `placeParts` from the real strip heights, so every connector keeps a
 * readable length whatever the wording.
 */
const SHAPES = {
  landscape: {W: 2200, page: [300, 430], strip: 540, s: 38, card: [520, 256], cardS: 34, file: [440, 200], chip: 28, cap: 30, legend: 28, minH: 1080},
  square: {W: 1400, page: [200, 270], strip: 590, s: 34, card: [380, 236], cardS: 32, file: [340, 170], chip: 33, cap: 32, legend: 30, minH: 1110},
  portrait: {W: 1120, page: [210, 260], strip: 700, s: 34, card: [370, 236], cardS: 32, file: [330, 180], chip: 30, cap: 30, legend: 30, minH: 1720},
};
/** Focus enlargement at the tracer's pass (the focus element / the others). */
const FOCUS = {focus: 0.12, other: 0.05};

/**
 * Centres of the six parts, caption / state / legend anchors for one shape.
 * `sh` = SHAPES entry, `hs`/`ht` = heights of the source / translated strips.
 * Gaps between connected parts are wide enough for a connector that stays
 * readable beside its label.
 */
function placeParts(shape, sh, hs, ht) {
  const [, ph] = sh.page;
  const [, chh] = sh.card;
  const [, fh] = sh.file;
  const P = {};
  if (shape === 'landscape') {
    // strips on top (staggered), record between them below, pages at the
    // sides a little lower, the file under the record
    P.segment = [690, 50 + hs / 2];
    P.translation = [1590, 150 + ht / 2];
    const stripsBottom = Math.max(50 + hs, 150 + ht);
    P.record = [1070, stripsBottom + 190 + chh / 2];
    P.source = [190, P.record[1] + 40];
    P.target = [2020, P.record[1] + 70];
    P.state = [1070, P.record[1] + chh / 2 + 30];
    P.folder = [1070, P.state[1] + 50 + 60 + fh / 2];
    P.caps = {source: [P.source[0], P.source[1] + ph / 2 + 18, 'middle'], target: [P.target[0], P.target[1] + ph / 2 + 18, 'middle']};
    P.legend = [340, P.folder[1] + fh / 2 - 10];
    return P;
  }
  if (shape === 'square') {
    // Z path: source page (top left) → S strip (top right) → record (right)
    // → T strip (left, below the record) → target page (bottom right)
    // → file (bottom left)
    P.source = [125, 175];
    P.segment = [1400 - 30 - sh.strip / 2, 50 + hs / 2];
    P.record = [1180, 50 + hs + 225 + chh / 2];
    P.translation = [30 + sh.strip / 2, Math.max(P.record[1] + chh / 2 + 10, 50 + hs + 265) + ht / 2];
    const tBottom = P.translation[1] + ht / 2;
    // right-aligned under the record: clear of the record's arrow into the T strip (lower left)
    P.state = [1180 + sh.card[0] / 2, P.record[1] + chh / 2 + 22, 'end'];
    const rowY = Math.max(P.state[1] + 60 + 100 + ph / 2, tBottom + 60 + ph / 2);
    P.target = [1180, rowY];
    P.folder = [420, rowY - 20];
    P.caps = {source: [P.source[0], P.source[1] + ph / 2 + 16, 'middle'], target: [P.target[0], P.target[1] + ph / 2 + 16, 'middle']};
    P.legend = [420, P.folder[1] + fh / 2 + 50];
    return P;
  }
  // portrait: source page top-left, S strip, record (right), T strip, then
  // target page (left) and file (right) on the bottom row; legend under the file
  P.source = [130, 40 + ph / 2];
  P.segment = [1120 - 20 - sh.strip / 2, 40 + ph + 120 + hs / 2];
  const sBottom = P.segment[1] + hs / 2;
  P.record = [1120 - 30 - sh.card[0] / 2, sBottom + 235 + chh / 2];
  P.translation = [20 + sh.strip / 2, P.record[1] + chh / 2 + 200 + ht / 2];
  const tBottom = P.translation[1] + ht / 2;
  // the state of the slot sits beside the T strip, clear of the record's arrow into it
  P.state = [1100, P.translation[1] - ht / 2 + 16, 'end', 1100 - (20 + sh.strip) - 24];
  P.target = [140, tBottom + 180 + ph / 2];
  P.folder = [820, P.target[1] - 20];
  P.caps = {source: [P.source[0], P.source[1] + ph / 2 + 12, 'middle'], target: [P.target[0], P.target[1] + ph / 2 + 12, 'middle']};
  P.legend = [820, P.folder[1] + sh.file[1] / 2 + 56];
  return P;
}

const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const inflate = (b, k, pad = 0) => ({x: b.x + b.w / 2 - (b.w * k) / 2 - pad, y: b.y + b.h / 2 - (b.h * k) / 2 - pad, w: b.w * k + pad * 2, h: b.h * k + pad * 2});
const unionBox = boxes => {
  const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
  const x1 = Math.max(...boxes.map(b => b.x + b.w)), y1 = Math.max(...boxes.map(b => b.y + b.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

/**
 * Relation labels placed BESIDE their own connector, never on top of any
 * connector: candidates slide along the connector (middle first) on both
 * sides and are checked against every connector's path, the element boxes
 * (grown to their focus size), the other labels and the fixed annotations.
 * A short tick joins each label to its connector.
 */
function placeLabels(ctx, o) {
  const th = ctx.theme;
  const pathObs = [];
  o.conns.forEach(x => {
    const n = Math.max(8, Math.ceil(x.c.total / 12));
    for (let i = 0; i <= n; i++) {
      const q = x.c.at(i / n);
      pathObs.push({x: q.x - 9, y: q.y - 9, w: 18, h: 18});
    }
    // arrowhead / end dot
    pathObs.push({x: x.c.to.x - 16, y: x.c.to.y - 16, w: 32, h: 32});
  });
  const fixed = [...o.boxes, ...o.extra];
  const inside = b => b.x >= o.bounds.x && b.y >= o.bounds.y && b.x + b.w <= o.bounds.x + o.bounds.w && b.y + b.h <= o.bounds.y + o.bounds.h;
  const placed = [];
  const cost = b => fixed.concat(placed).reduce((a, q) => a + (overlaps(b, q, 8) ? 1e4 : 0), 0) + pathObs.reduce((a, q) => a + (overlaps(b, q, 0) ? 300 : 0), 0) + (inside(b) ? 0 : 5e4);
  return o.conns.map((x, i) => {
    const text = x.rel.label || o.relationLabels[x.rel.kind] || x.rel.kind;
    const color = kindColor(ctx, x.rel.kind);
    let best = null;
    for (const size of [o.size, o.size * 0.88]) {
      const cands = [];
      // a wide one- or two-line chip first, then a narrower, taller one
      for (const maxW of [o.chipMax * 1.25, o.chipMax]) {
      const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: maxW, size, maxLines: 3, weight: 600});
      const {w, h: hh} = probe.box;
      for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73, 0.2, 0.8]) {
        const p = x.c.at(t);
        const a = x.c.at(Math.max(0, t - 0.02)), b = x.c.at(Math.min(1, t + 0.02));
        const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
        // directions: both normals of the connector, then the four axis
        // directions (a chip beside a diagonal connector often fits better
        // straight left/right or above/below it)
        const dirs = [{x: nx, y: ny, k: 0}, {x: -nx, y: -ny, k: 0}, {x: 1, y: 0, k: 25}, {x: -1, y: 0, k: 25}, {x: 0, y: 1, k: 25}, {x: 0, y: -1, k: 25}];
        for (const d of dirs) {
          const half = (Math.abs(d.x) * w) / 2 + (Math.abs(d.y) * hh) / 2;
          for (const gap of [14, 30, 52, 80, 110]) {
            const cx = p.x + d.x * (half + gap), cy = p.y + d.y * (half + gap);
            const box = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
            cands.push({box, p, n: d, half, gap, size, maxW, pref: d.k + Math.abs(t - 0.5) * 160 + gap * 1.5 + (size < o.size ? 400 : 0) + (maxW < o.chipMax * 1.2 ? 12 : 0) + (probe.fit.lines.length > 2 ? 40 : 0) + (probe.fit.size < size - 0.01 ? 60 : 0)});
          }
        }
      }
      }
      cands.forEach(cd => { cd.hit = cost(cd.box); cd.cost = cd.hit + cd.pref; });
      cands.sort((u, v) => u.cost - v.cost);
      if (!best || cands[0].cost < best.cost) best = cands[0];
      if (best.hit === 0) break;
    }
    placed.push(best.box);
    const c = chip(ctx, text, {x: best.box.x + best.box.w / 2, y: best.box.y, anchor: 'middle', maxWidth: best.maxW, size: best.size, maxLines: 3, fill: th.card, stroke: color, name: `lab-${i}-chip`, weight: 600});
    // the tick runs from the connector to the nearest point of the chip
    const b = c.box;
    const q = {x: Math.min(b.x + b.w - 6, Math.max(b.x + 6, best.p.x)), y: Math.min(b.y + b.h - 6, Math.max(b.y + 6, best.p.y))};
    const dq = Math.hypot(q.x - best.p.x, q.y - best.p.y) || 1;
    const t0 = {x: best.p.x + ((q.x - best.p.x) * 4) / dq, y: best.p.y + ((q.y - best.p.y) * 4) / dq};
    const t1 = q;
    const node = g({name: `lab-${i}`, opacity: 0},
      h('line', {x1: r(t0.x), y1: r(t0.y), x2: r(t1.x), y2: r(t1.y), stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
      c.node);
    return {node, box: c.box, clear: best.hit === 0, size: best.size};
  });
}

/** Tracer: a large ring with a short trail behind it (drawn above the parts). */
function tracerNodes(ctx) {
  const th = ctx.theme;
  return g(null,
    h('path', {name: 'tracer-trail', d: 'M0 0', fill: 'none', stroke: th.accent, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
    g({name: 'tracer', opacity: 0},
      h('circle', {r: 30, fill: th.accent, opacity: 0.2}),
      h('circle', {r: 15, fill: th.accent, stroke: th.paper, 'stroke-width': 4.5}),
      h('circle', {r: 5, fill: th.paper})));
}

const scene = {
  sizes: {landscape: [2200, 1080], square: [1400, 1110], portrait: [1120, 1720]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const sh = SHAPES[shape];
    const show = ctx.show('all');
    const showKey = ctx.show('key');
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const n = Math.min(p.clauses.length, p.translations.length);
    const k = Math.min(p.term.segment, n - 1);
    const unconfirmed = p.termStatus === 'unconfirmed';
    const redacted = (p.redactions || []).includes(k);

    // --- miniature pages (origin of the strips)
    const [pw, ph] = sh.page;
    const mini = side => miniPage(ctx, {prefix: `mini-${side}`, w: pw, h: ph, side, lang: side === 'source' ? p.languages.source : p.languages.target,
      title: side === 'source' ? p.documentTitle : p.targetTitle, count: side === 'source' ? p.clauses.length : p.translations.length, k, showText: show});
    const miniS = mini('source');
    const miniT = mini('target');

    // --- lifted strips
    const slotVariants = [{key: 'bl', kind: 'blank'}, unconfirmed ? {key: 'un', kind: 'unc', initial: 0} : {key: 'av', kind: 'avail', text: p.term.target, initial: 0}];
    const stripS = segmentStrip(ctx, {prefix: 'strip-s', side: 'source', text: p.clauses[k], index: k, term: p.term, w: sh.strip, size: sh.s, showText: show, showKey, lang: p.languages.source, label: label('segment'), redacted});
    const stripT = segmentStrip(ctx, {prefix: 'strip-t', side: 'target', text: p.translations[k], index: k, term: p.term, w: sh.strip, size: sh.s, showText: show, showKey, lang: p.languages.target, label: label('translation'), slotVariants, reveal: !unconfirmed});

    // --- term record card and file folder
    const [cw, ch] = sh.card;
    const card = termCard(ctx, {prefix: 'card', w: cw, h: ch, size: sh.cardS, showText: show, showKey, title: label('record'), footer: p.signers[0].name, langs: p.languages, term: p.term.source,
      variants: [unconfirmed ? {key: 'un', kind: 'unc'} : {key: 'av', kind: 'avail', text: p.term.target}]});
    const [fw, fh] = sh.file;
    const folder = fileFolder(ctx, {name: 'el-folder-body', w: fw, h: fh, label: label('folder'), showKey, filled: false});

    const Pl = placeParts(shape, sh, stripS.h, stripT.h);
    const at = id => ({x: Pl[id][0], y: Pl[id][1]});
    const centers = Object.fromEntries(IDS.map(id => [id, at(id)]));
    const boxAt = (id, w, hh) => ({x: centers[id].x - w / 2, y: centers[id].y - hh / 2, w, h: hh});
    const elements = {
      source: {box: boxAt('source', pw, ph)},
      target: {box: boxAt('target', pw, ph)},
      segment: {box: boxAt('segment', stripS.w, stripS.h)},
      translation: {box: boxAt('translation', stripT.w, stripT.h)},
      record: {box: boxAt('record', cw, ch)},
      folder: {box: boxAt('folder', fw, fh)},
    };
    // captions for the two miniature pages (the other parts carry their label inside)
    const caps = {};
    for (const id of ['source', 'target']) {
      if (!showKey) continue;
      const [cx, cy, anchor] = Pl.caps[id];
      const probe = chip(ctx, label(id), {x: cx, y: cy, anchor, maxWidth: Math.max(pw + 170, 390), size: sh.cap, maxLines: 2});
      // keep the caption inside the design width (it may be wider than its page)
      const dx = Math.max(0, 12 - probe.box.x) - Math.max(0, probe.box.x + probe.box.w - (sh.W - 12));
      caps[id] = chip(ctx, label(id), {x: cx + dx, y: cy, anchor, maxWidth: Math.max(pw + 170, 390), size: sh.cap, maxLines: 2, name: `cap-${id}`});
    }
    const legend = show ? legendNode(ctx, [...new Set(p.relationships.map(x => x.kind))], p.relationLabels, at('legend'), sh.legend) : null;
    const state = showKey ? stateChip(ctx, [unconfirmed ? t.unconfirmed : t.available], {x: at('state').x, y: at('state').y, anchor: Pl.state[2] || 'middle', size: sh.cap, maxWidth: Pl.state[3] || cw + 160, name: 'state-chip', color: unconfirmed ? th.accent : th.accent4}) : null;

    // --- connectors (edge-anchored, styled by kind); their labels are placed
    // by `placeLabels` beside the connectors instead of by the graph helper
    const graph = relationGraph(ctx, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize: sh.chip, chipMax: 300, separateLabels: true,
      bend: rel => (rel.from === 'segment' && rel.to === 'translation' ? 0 : rel.kind === 'sequence' ? 0.12 : 0.08)});
    const fixedBoxes = Object.values(caps).filter(Boolean).map(c => c.box);
    if (legend) fixedBoxes.push(legend.box);
    if (state) fixedBoxes.push(state.box);
    // element boxes grown to their size at the tracer's pass (+ the guide brackets on the strips)
    const elemObs = Object.entries(elements).map(([id, e]) => inflate(e.box, 1 + (id === p.focusElement ? FOCUS.focus : FOCUS.other), id === 'segment' || id === 'translation' ? 20 : 6));
    const content = unionBox([...Object.values(elements).map(e => e.box), ...fixedBoxes]);
    const W0 = sh.W;
    const H0 = Math.max(sh.minH, content.y + content.h + 30);
    const labels = show ? placeLabels(ctx, {conns: graph.conns, relationLabels: p.relationLabels, size: sh.chip, chipMax: shape === 'landscape' ? 290 : shape === 'square' ? 270 : 300,
      boxes: elemObs, extra: fixedBoxes, bounds: {x: 6, y: 6, w: W0 - 12, h: H0 + 140}}) : [];
    const all = unionBox([{x: 0, y: 0, w: W0, h: 1}, ...Object.values(elements).map(e => e.box), ...fixedBoxes, ...labels.map(l => l.box)]);
    const S = {w: W0, h: Math.max(sh.minH, all.y + all.h + 24)};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;

    const route = graph.route(p.traversalOrder);
    // the guide relation is drawn in the motif's own style: pair-coloured
    // S-curve plus a bracket along the facing edge of each strip
    const gi = p.relationships.findIndex(x => (x.from === 'segment' && x.to === 'translation') || (x.from === 'translation' && x.to === 'segment'));
    const guide = gi >= 0 ? guideOverlay(ctx, graph.conns[gi], elements, k) : null;
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    // lifted strips start inside their page slot
    const liftFrom = (mp, id, strip) => {
      const c = centers[id === 'segment' ? 'source' : 'target'];
      const sl = mp.slot;
      return sl ? {x: c.x + sl.x + sl.w / 2, y: c.y + sl.y + sl.h / 2, k: Math.min(sl.w / strip.w, sl.h / strip.h)} : {x: c.x, y: c.y, k: 0.3};
    };
    const fromS = liftFrom(miniS, 'segment', stripS);
    const fromT = liftFrom(miniT, 'translation', stripT);

    const boxes = Object.fromEntries(Object.entries(elements).map(([id, e]) => [id, {x: r(e.box.x), y: r(e.box.y), w: r(e.box.w), h: r(e.box.h)}]));
    // text-bearing boxes the tracer passes over (it dims there so the text stays readable)
    const dimBoxes = Object.values(elements).map(e => inflate(e.box, 1, -12));
    return {S, s, ox, oy, miniS, miniT, stripS, stripT, card, folder, caps, graph, labels, route, visitT, fromS, fromT, centers, legend: legend && legend.node, state, unconfirmed, k, n, boxes, guide, gi, dimBoxes};
  },
  build(ctx, L) {
    const c = L.centers;
    const body = (id, node, pivot = {x: 0, y: 0}) => g({name: `el-${id}`, transform: T(c[id].x, c[id].y)}, g({name: `el-${id}-scale`}, g({transform: T(pivot.x, pivot.y)}, node)));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      L.guide && L.guide.node,
      body('source', L.miniS.node),
      body('target', L.miniT.node),
      body('record', L.card.node),
      body('folder', L.folder),
      g({name: 'el-segment'}, g({name: 'el-segment-scale'}, L.stripS.node)),
      g({name: 'el-translation'}, g({name: 'el-translation-scale'}, L.stripT.node)),
      Object.values(L.caps).filter(Boolean).map(cp => cp.node),
      L.labels.map(l => l.node),
      L.state && L.state.node,
      tracerNodes(ctx),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    const c = L.centers;
    // 1) separate: the two pages are there from the first frame, each with
    // its segment in place; the record and the file appear; both strips lift
    // out of their page slots (the empty slot stays outlined)
    const appear = r(seg(u, ...W.appear), 3);
    for (const id of ['source', 'target']) nodes[`el-${id}`] = {transform: T(c[id].x, c[id].y), opacity: 1};
    for (const id of ['record', 'folder']) nodes[`el-${id}`] = {transform: T(c[id].x, c[id].y), opacity: appear};
    const lift = ease.inOutCubic(seg(u, ...W.lift));
    const place = (from, to) => ({x: lerp(from.x, to.x, lift), y: lerp(from.y, to.y, lift), k: lerp(from.k, 1, lift)});
    const ps = place(L.fromS, c.segment);
    const pt = place(L.fromT, c.translation);
    nodes['el-segment'] = {transform: T(ps.x, ps.y, 0, ps.k), opacity: 1};
    nodes['el-translation'] = {transform: T(pt.x, pt.y, 0, pt.k), opacity: 1};
    for (const id of Object.keys(L.caps)) if (L.caps[id]) nodes[`cap-${id}`] = {opacity: r(seg(u, 0.12, 0.2), 3)};
    // 2) relations drawn one by one (labels are the scene's own, beside each connector)
    const n = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 1) * (W.relate[1] - W.relate[0])) / n));
    for (const [key, v] of Object.entries(L.graph.frame(relP))) if (!key.startsWith('rel-lg')) nodes[key] = v;
    L.labels.forEach((_, i) => { nodes[`lab-${i}`] = {opacity: r(clamp((relP(i) - 0.55) / 0.45), 3)}; });
    if (L.guide) Object.assign(nodes, L.guide.frame(relP(L.gi)));
    // 3) tracer in traversal order (large ring + short trail; it dims while
    // it crosses a part so the part's text stays readable); the focus
    // element enlarges as it passes
    const tp = seg(u, ...W.trace);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= W.trace[0] - 0.01 && u < 0.78;
    const over = L.dimBoxes.some(b => tpos.x > b.x && tpos.x < b.x + b.w && tpos.y > b.y && tpos.y < b.y + b.h);
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? (over ? 0.45 : 1) : 0};
    const trail = [];
    for (let i = 0; i <= 10; i++) trail.push(L.route.poly.at(Math.max(0, tt - 0.05 + (0.05 * i) / 10)));
    nodes['tracer-trail'] = {d: trail.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), opacity: tracerOn && tt > 0.005 ? (over ? 0.2 : 0.45) : 0};
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    for (const id of IDS) {
      const focus = id === p.focusElement ? FOCUS.focus : FOCUS.other;
      const kk = 1 + (reduced ? focus * 0.5 : focus) * ease.inOutSine(pulse(id));
      nodes[`el-${id}-scale`] = {transform: kk === 1 ? 'scale(1)' : `scale(${r(kk, 4)})`};
    }
    // the part that changes: the term slot fills when the tracer reaches the translated strip
    const reachT = L.visitT.translation;
    const afterT = reachT === undefined ? 0 : (u >= W.trace[1] ? 1 : tracerOn ? clamp((tt - reachT) / W.fill + 0.5) : 0);
    const fill = u >= 0.78 && reachT !== undefined ? 1 : afterT;
    if (L.unconfirmed) {
      nodes['strip-t-slot-un'] = {opacity: r(fill, 3)};
    } else {
      nodes['strip-t-slot-av'] = {opacity: fill > 0 ? 1 : 0};
      nodes['strip-t-clip'] = {width: r(Math.max(0.01, (L.stripT.slotW + 8) * fill))};
    }
    nodes['strip-t-slot-bl'] = {opacity: r(1 - fill, 3)};
    // the file receives both sheets when the tracer reaches it
    const reachF = L.visitT.folder;
    const filed = reachF === undefined ? 0 : (u >= W.trace[1] || (tracerOn && tt >= reachF) ? 1 : 0);
    nodes['el-folder-body-sheets'] = {opacity: filed};
    // 4) gather: descriptive state chip (no legal effect stated)
    if (L.state) nodes['state-chip'] = {opacity: r(seg(u, ...W.state) * (fill >= 1 ? 1 : 0), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        sourceStrip: {x: r(ps.x), y: r(ps.y)},
        translationStrip: {x: r(pt.x), y: r(pt.y)},
        lifted: r(lift, 3),
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        relationKinds: p.relationships.map(x => x.kind),
        arrows: L.graph.conns.map(x => x.rel.kind !== 'relation'),
        labelsClear: L.labels.every(l => l.clear),
        slotFill: r(fill, 3),
        termStatus: p.termStatus,
        filed: Boolean(filed),
        visitOrder: L.route.visits.map(v => v.id),
        connectorEnds: L.graph.conns.map(x => ({from: x.rel.from, to: x.rel.to, a: {x: r(x.c.from.x), y: r(x.c.from.y)}, b: {x: r(x.c.to.x), y: r(x.c.to.y)}})),
        elementBoxes: L.boxes,
      },
    };
  },
};

/**
 * Guide between the two strips: brackets on their facing edges and a thick
 * pair-coloured curve over the (plain relation) connector — no arrowhead.
 */
function guideOverlay(ctx, conn, elements, k) {
  const col = pairColor(ctx, k).c;
  const c = conn.c;
  const boxOf = id => elements[id].box;
  // bracket along the edge of `box` nearest to the connector end `pt`
  const bracket = (box, pt) => {
    const d = {l: Math.abs(pt.x - box.x), r: Math.abs(pt.x - box.x - box.w), t: Math.abs(pt.y - box.y), b: Math.abs(pt.y - box.y - box.h)};
    const edge = Object.keys(d).reduce((a, b) => (d[b] < d[a] ? b : a));
    const m = 16, o = 10, tick = 12;
    if (edge === 'l' || edge === 'r') {
      const x = edge === 'l' ? box.x - o : box.x + box.w + o;
      const tx = edge === 'l' ? x + tick : x - tick;
      return `M${r(tx)} ${r(box.y + m)}H${r(x)}V${r(box.y + box.h - m)}H${r(tx)}`;
    }
    const y = edge === 't' ? box.y - o : box.y + box.h + o;
    const ty = edge === 't' ? y + tick : y - tick;
    return `M${r(box.x + m)} ${r(ty)}V${r(y)}H${r(box.x + box.w - m)}V${r(ty)}`;
  };
  const bA = bracket(boxOf(conn.rel.from), c.from);
  const bB = bracket(boxOf(conn.rel.to), c.to);
  const d = `M${r(c.from.x)} ${r(c.from.y)}C${r(c.c1.x)} ${r(c.c1.y)} ${r(c.c2.x)} ${r(c.c2.y)} ${r(c.to.x)} ${r(c.to.y)}`;
  const len = c.total + 4;
  const node = g({name: 'guide', opacity: 0},
    h('path', {name: 'guide-bA', d: bA, fill: 'none', stroke: col, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
    h('path', {name: 'guide-bB', d: bB, fill: 'none', stroke: col, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
    h('path', {name: 'guide-line', d, fill: 'none', stroke: col, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {cx: r(c.from.x), cy: r(c.from.y), r: 8, fill: col}),
    h('circle', {name: 'guide-dB', cx: r(c.to.x), cy: r(c.to.y), r: 8, fill: col, opacity: 0}),
  );
  const frame = pr => ({
    guide: {opacity: pr > 0 ? 1 : 0},
    'guide-line': {'stroke-dashoffset': r(len * (1 - pr))},
    'guide-bA': {opacity: r(clamp(pr * 4), 3)},
    'guide-bB': {opacity: pr >= 0.98 ? 1 : 0},
    'guide-dB': {opacity: pr >= 0.98 ? 1 : 0},
  });
  return {node, frame};
}

function legendNode(ctx, kinds, labels, at, size = 28) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const gap = size * 1.8;
  const line = size * 1.9;
  const widths = items.map(it => line + size * 0.45 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const x0 = x;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: r(line), y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: `M${r(line)} 0l-12 -7l3 7l-3 7z`, fill: color}) : h('circle', {cx: r(line), cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: r(line + size * 0.45), y: r(size * 0.35), 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return {node: g({name: 'legend'}, parts), box: {x: x0 - 8, y: at.y - size * 0.8, w: total + 16, h: size * 1.6}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-07-mechanism',
    title: 'Parallel translation — exploded segment pair and term record',
    titleEs: 'Traducción paralela — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Traducción paralela',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: one segment lifts out of the source page and its equivalent out of the translated page; the guide between them, the term record card and the translation file are joined by edge-anchored connectors styled by relation kind. A tracer follows the supplied order; the term slot of the translated segment fills from the record (or keeps the source term with a question mark) only when the tracer arrives.',
    tags: ['translation', 'mechanism', 'exploded', 'segments', 'guide', 'term record', 'relations', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/traduccion-paralela.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: TP_STRINGS,
  scene,
});
