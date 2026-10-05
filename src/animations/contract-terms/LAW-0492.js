/**
 * LAW-0492 — Obligaciones recíprocas · inspect
 *
 * Storyboard (context = the state produced by the story's action: the contract board with its two columns filled —
 * "Obligation of A" (●) and "Obligation of B" (◆) at equal weight —, the supplied links drawn between them, the two
 * parties standing under the board, and the LINK TAG hanging from the links' gutter: "Link 1 (as supplied)" with the
 * two performances it joins, ● on A's side and ◆ on B's side):
 *  0.00–0.20  context at rest in its part of the frame; the other part holds a panel (headline, the ●/◆ legend at equal
 *             weight, the key).
 *  0.20–0.28  isolate: the panel leaves and a lens grows at its own place: a real enlarged copy (≥ 1.6×) of the link tag;
 *             the context's tag is left blank while the lens shows it (one legible copy at a time).
 *  0.36–0.42  the old B performance is struck in the lens.
 *  0.47–0.489 the datum changes: the tag's ◆ row turns over and comes back with the supplied alternative (no value
 *             legible for ≤ ~150 ms).
 *  0.50–0.56  only then, the new value legible, its dependent geometry follows in the scene: the link's ◆ end slides
 *             along column B from the old performance's port to the new one's. Nothing else moves.
 *  0.74–0.80  return: the lens closes onto the tag, which shows the new value at once; a Δ marks the changed row
 *             (0.80–0.81); the panel comes back with the marker label, the struck "was:" value and the key "As supplied ·
 *             no conclusion drawn". Seeking back restores the old datum exactly.
 * Labels hidden: the lens enlarges the links' gutter itself (the ports, the cord of the inspected link; the cards stay
 * out of the copy, where the rim would cut them) and the ◆ end is seen sliding inside it. While the lens holds that copy
 * the context's inspected link is hidden (one copy at a time) and comes back in its new state once the lens has closed.
 * Labels key / none, side by side: the context takes the larger part of the frame (no panel text to hold).
 * Lens below (9:16): at rest and at the hold the context and the panel are centred as one block; the context moves up
 * (never shrinking) before the lens opens and back after it has closed.
 * A link means only "linked as supplied": no exchange that is due, no condition, no order of performance, no breach,
 * remedy or termination; no jurisdiction.
 * @module animations/contract-terms/LAW-0492
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {seg, r, ease, lerp, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf, int} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, PX_BASE, PX_STRESS, validLinks, INK,
  layoutBoard, boardArt, makeRigs, nameNodes, cardNodes, linkGeom, glyph, fitG, chipG, portWorld, placeNotes,
  localizeScene, headBox, overlaps,
} from './kits/obligaciones-reciprocas.js';

const ID = 'LAW-0492';
const DURATION = 8000;
const W = {
  open: [0.2, 0.28], strike: [0.36, 0.42], turnOut: [0.47, 0.4795], turnIn: [0.4795, 0.489],
  dep: [0.5, 0.56], close: [0.74, 0.8], marker: [0.799, 0.812], notes: [0.81, 0.85],
  panelOut: [0.18, 0.2], panelIn: [0.8, 0.84], shiftUp: [0.14, 0.2], shiftDown: [0.8, 0.86], shrink: [0.195, 0.245], regrow: [0.75, 0.8],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, tagHead: 'Link {n} (as supplied)', was: 'was: {v}', legA: '{c}', legB: '{c}'},
  es: {...KIT_STRINGS.es, tagHead: 'Enlace {n} (según lo aportado)', was: 'antes: {v}', legA: '{c}', legB: '{c}'},
};

const sceneSchema = {
  ...motifFields,
  focusTarget: int('Which supplied link is inspected (1 = the first)', 1, 3),
  beforeValue: int('Position in column B of the performance the inspected link joins before the substitution (as supplied)', 1, 3),
  afterValue: int('Position in column B of the performance it joins after the substitution (as supplied)', 1, 3),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens (≥ 1.5; the layout may use less room but never under 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'below'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context headline', 80), marker: str('Label of the changed-datum marker', 70)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  links: [{a: 1, b: 1}, {a: 2, b: 2}],
  focusTarget: 1,
  beforeValue: 1,
  afterValue: 2,
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Links between the columns, as supplied', marker: 'Changed: the performance of B joined by link 1'},
};

const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  contextLabels: {context: 'Enlaces entre las columnas, según lo aportado', marker: 'Cambio: la prestación de B unida por el enlace 1'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.performancesA, ...p.performancesB].some(t => t.length > 40);

/** The inspected link and its two B positions (clamped to the supplied list). */
function focusOf(p) {
  const links = validLinks(p);
  const i = clamp(p.focusTarget - 1, 0, Math.max(0, links.length - 1));
  const lk = links[i] || {a: 1, b: 1};
  const nB = p.performancesB.length;
  return {i, a: lk.a, b0: clamp(p.beforeValue, 1, nB), b1: clamp(p.afterValue, 1, nB), links};
}

/** Tag metrics at body size F: width, rows and height (the B row sized for the longer of its two values). */
function measureTag(ctx, p, F, show, fo, twK = 13) {
  const tw = F * twK;
  const inner = tw - F * 1.4 - F * 0.9;
  if (!show) return {w: F * 7, h: F * 4.6, show: false};
  const head = fitG(ctx.t.tagHead.replace('{n}', fo.i + 1), {maxWidth: tw - F * 1.2, size: F, maxLines: 2, weight: 700});
  const ra = fitG(p.performancesA[fo.a - 1], {maxWidth: inner, size: F, maxLines: 3, weight: 600});
  const rb0 = fitG(p.performancesB[fo.b0 - 1], {maxWidth: inner, size: F, maxLines: 3, weight: 600});
  const rb1 = fitG(p.performancesB[fo.b1 - 1], {maxWidth: inner, size: F, maxLines: 3, weight: 600});
  if ([head, ra, rb0, rb1].some(f => f.bad)) return null;
  const rowB = Math.max(rb0.height, rb1.height);
  const h0 = F * 0.5 + head.height + F * 0.5 + ra.height + F * 0.55 + rowB + F * 0.55;
  return {w: tw, h: h0, head, ra, rb0, rb1, rowB, inner, show: true};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const upx = unitPx(ctx);
    const show = ctx.show('all'), showKey = ctx.show('key');
    const stress = isStress(p);
    const box = {x: 6, y: 4, w: D.w - 12, h: D.h - 8};
    const fo = focusOf(p);
    const below = p.detailGeometry.placement === 'below' || (p.detailGeometry.placement === 'auto' && shape === 'portrait');
    const headMin = stress ? 45 : shape === 'square' ? 50 : 60;
    // (1:1, labels key / none — cf precedent LAW-0472/0476/0480: the context is laid out large over the frame at rest
    // and at the hold — ≥ 0.55 of the frame — and eases into its part of the frame only while the lens is open: a
    // uniform scale GROW of the lens-time layout, anchored at the box's top-left corner)
    const growMode = !below && shape === 'square' && !show;
    const frameShort = Math.min(ctx.view.width, ctx.view.height);
    const shortU = (0.35 * frameShort) / (upx * frameShort / 1080);
    let best = null;
    // (labels key / none: no panel text to hold, so the context takes the larger part of a side-by-side frame — full
    // objects, larger people — and the lens the rest; review ct03, the cf-08 ruling: scene ≥ 0.55 of the frame)
    const sideShares = show ? [0.55, 0.52, 0.5, 0.48, 0.46, 0.455, 0.58] : [0.7, 0.67, 0.64, 0.61, 0.58, 0.565, 0.55];
    for (const growTo of growMode ? [0.665, 0.655] : [1]) for (const cardText of [true, false]) for (const share of below ? (show ? [0.5, 0.46, 0.55] : [0.6, 0.55, 0.5]) : sideShares) for (const px of stress ? PX_STRESS : PX_BASE) {
      if (best) break;
      const F = px / upx;
      // (the tag's width: the one that lets the lens magnify most in its region)
      const lr0 = below ? {w: box.w, h: box.h * (1 - share) - F * 0.4} : {w: box.w * (1 - share) - F * 0.5, h: box.h};
      let tag = null, tz = 0;
      for (const twK of [9, 10, 11, 12, 13, 14.5, 16, 17.5, 19]) {
        const t = measureTag(ctx, p, F, show, fo, twK);
        if (!t) continue;
        const z = Math.min(lr0.w * 0.96 / (t.w + F * 0.7), lr0.h * 0.96 / (t.h + F * 0.7));
        if (z > tz) { tz = z; tag = t; }
      }
      if (!tag) continue;
      const cord = F * 0.9;
      const grow = growMode ? growTo / share : 1;
      const cb = below ? {x: box.x, y: box.y, w: box.w, h: box.h * share} : {x: box.x, y: box.y, w: box.w * share, h: box.h / grow};
      if (growMode && box.w * share * grow > box.w * 0.8) continue;
      const lr = below ? {x: box.x, y: box.y + box.h * share + F * 0.4, w: box.w, h: box.h * (1 - share) - F * 0.4} : {x: box.x + box.w * share + F * 0.5, y: box.y, w: box.w * (1 - share) - F * 0.5, h: box.h};
      const Lc = layoutBoard(ctx, {
        box: cb, upx, prefix: 'st-', px: [px], headMin, headTarget: 0, kMax: show || below ? 1.4 : 2, gutter: 0.2, mode: 'under', rowGap: 0.5, tight: true,
        texts: {a: p.performancesA, b: p.performancesB}, nRows: Math.max(p.performancesA.length, p.performancesB.length),
        contract: `${p.contract.reference} · ${p.contract.title}`, columns: p.columns,
        names: showKey ? p.parties.map(q => q.name) : null, plates: null, notes: [], trays: false, noTrayZone: true, noReach: true, cardText,
        minCh: 71 / upx,
        reserveBelow: () => ({w: tag.w + F, h: tag.h + cord + F * 0.3}),
      });
      if (!Lc.ok) continue;
      const G = Lc.G;
      const gx = G.gutter.x + G.gutter.w / 2;
      const tagBox = {x: gx - tag.w / 2, y: G.yB + cord, w: tag.w, h: tag.h};
      // the crop: labels shown, the whole tag; hidden, the gutter region of the inspected link (its A port and both B ports)
      const pad = F * 0.35;
      let src;
      if (show) src = {x: tagBox.x - pad, y: tagBox.y - pad, w: tagBox.w + pad * 2, h: tagBox.h + pad * 2};
      else {
        // (the gutter between the cards' inner ends, with the whole port markers; the cards themselves stay out of the
        // lens copy — the rim would cut them)
        const ys = [G.rowAt('a', fo.a - 1).y, G.rowAt('b', fo.b0 - 1).y, G.rowAt('b', fo.b1 - 1).y];
        const gl = Math.max(7, F * 0.34) * 1.3 + pad;
        const x0 = G.cardX('a') + G.cw / 2 - gl, x1 = G.cardX('b') - G.cw / 2 + gl;
        src = {x: x0, y: Math.min(...ys) - G.ch / 2 - pad, w: x1 - x0, h: Math.max(...ys) - Math.min(...ys) + G.ch + pad * 2};
      }
      let zoom = Math.min(p.detailGeometry.zoom, (lr.w * 0.96) / src.w, (lr.h * 0.96) / src.h);
      // (a lens that would be too narrow for a real inspection takes in more on both sides of the gutter)
      if (!show && src.w * zoom < shortU * 1.02) {
        const need = (shortU * 1.03) / zoom - src.w;
        src.x -= need / 2; src.w += need;
        zoom = Math.min(p.detailGeometry.zoom, (lr.w * 0.96) / src.w, (lr.h * 0.96) / src.h);
      }
      // (a lens that would be too short for a real inspection takes in more of the gutter above the tag)
      if (src.h * zoom < shortU * 1.02) {
        const need = (shortU * 1.03) / zoom - src.h;
        src.y -= need; src.h += need;
        zoom = Math.min(p.detailGeometry.zoom, (lr.w * 0.96) / src.w, (lr.h * 0.96) / src.h);
      }
      // (magnification against the REST size: in grow mode the rest context is `grow` times the lens-time one)
      if (zoom < (show ? 1.6 : growMode ? 1.52 * grow : 1.52)) continue;
      const dest = {w: src.w * zoom, h: src.h * zoom};
      dest.x = lr.x + (lr.w - dest.w) / 2;
      dest.y = lr.y + (lr.h - dest.h) / 2;
      if (Math.min(dest.w, dest.h) < shortU) continue;
      // the panel (rest and hold) in the lens's place
      best = {F, px, Lc, tag, tagBox, cord, src, dest, zoom, lr, cb, share, cardText, grow};
    }
    if (!best) return {ok: false, why: ['no-layout-fits'], problems: ['no-layout-fits']};
    const {F, Lc, tag, tagBox, src, dest, zoom, lr, cb} = best;
    const L = {ok: true, why: [], F, upx, show, showKey, Lc, tag, tagBox, cord: best.cord, src, dest, zoom, lr, cb, fo, below, box, cardText: best.cardText, grow: best.grow};
    // (grow mode: the panel — the key — sits right of the LARGE context)
    const plr = L.grow > 1 ? (() => { const x0 = box.x + cb.w * L.grow + F * 0.6; return {x: x0, y: box.y, w: box.x + box.w - x0, h: box.h}; })() : lr;
    Lc.rigs = makeRigs(ctx, Lc, p.parties);
    L.nA = p.performancesA.length; L.nB = p.performancesB.length;
    Lc.captions = p.parties.map(q => q.name);
    // panel items: rest (headline, legend ●/◆, key) and hold (marker, was, legend, key)
    const leg = s => ({name: `leg-${s}`, kind: 'leg', text: p.columns[s], glyph: s});
    // (print-bar cards: their texts are listed once in the panel)
    const perfs = pre => (show && !best.cardText ? [...p.performancesA.map((t, j) => ({name: `${pre}-pa${j}`, kind: 'perf', text: t, glyph: 'a'})), ...p.performancesB.map((t, j) => ({name: `${pre}-pb${j}`, kind: 'perf', text: t, glyph: 'b'}))] : []);
    const restItems = [];
    if (show) restItems.push({name: 'p-head', kind: 'head', text: p.contextLabels.context}, leg('a'), leg('b'), ...perfs('p'));
    if (showKey) restItems.push({name: 'p-key', kind: 'key', text: ctx.t.key});
    const holdItems = [];
    if (show) holdItems.push({name: 'h-head', kind: 'head', text: p.contextLabels.context}, {name: 'h-marker', kind: 'marker', text: p.contextLabels.marker}, {name: 'h-was', kind: 'was', text: ctx.t.was.replace('{v}', p.performancesB[fo.b0 - 1])}, {name: 'h-leg-a', kind: 'leg', text: p.columns.a, glyph: 'a'}, {name: 'h-leg-b', kind: 'leg', text: p.columns.b, glyph: 'b'}, ...perfs('h'));
    if (showKey) holdItems.push({name: 'h-key', kind: 'key', text: ctx.t.key});
    const placeCol = items => {
      if (!items.length) return {placed: [], h: 0};
      const maxW = Math.min(plr.w - F, F * 22);
      const chips = items.map(it => ({it, c: chipG(ctx, it.text, {x: 0, y: 0, maxWidth: maxW - (it.glyph || it.kind === 'marker' ? F * 1.6 : 0), size: F, maxLines: 3, weight: it.kind === 'head' ? 700 : 600})}));
      const hh = chips.reduce((a, q) => a + q.c.box.h + F * 0.45, -F * 0.45);
      let y = plr.y + Math.max(0, (plr.h - hh) / 2);
      const placed = chips.map(q => { const ext = q.it.glyph || q.it.kind === 'marker' ? F * 1.6 : 0; const x = plr.x + (plr.w - q.c.box.w - ext) / 2 + ext; const o = {...q, x, y, ext}; y += q.c.box.h + F * 0.45; return o; });
      return {placed, h: hh, bad: chips.some(q => q.c.fit.bad) || hh > plr.h || chips.some(q => q.c.box.w + (q.it.glyph || q.it.kind === 'marker' ? F * 1.6 : 0) > plr.w)};
    };
    L.rest = placeCol(restItems);
    L.hold = placeCol(holdItems);
    // (lens below: at rest and at the hold the context and the panel under it are centred as one block in the frame;
    // the context moves up — never shrinking — before the lens opens and back down after it has closed)
    L.dyRest = below ? Math.max(0, (L.lr.h - L.rest.h) / 2) : 0;
    L.dyHold = below ? Math.max(0, (L.lr.h - L.hold.h) / 2) : 0;
    if (L.rest.bad || L.hold.bad) { L.why.push('panel-overflow'); L.ok = false; }
    // checks
    const heads = [headBox(Lc.G.figA), headBox(Lc.G.figB)];
    L.lensClearOfHeads = heads.every(hb => !overlaps(hb, dest, 2));
    L.lensClearOfContext = below ? dest.y >= cb.y + cb.h - 1 : dest.x >= cb.x + cb.w - 1;
    L.contextFrac = below ? 1 : cb.w / box.w;
    if (!L.lensClearOfHeads || !L.lensClearOfContext) { L.why.push('lens-over-context'); L.ok = false; }
    // (one copy at a time for the non-text change too: when the lens's crop takes in any part of the inspected link's
    // sweep, the context's link is hidden while the lens holds the copy and shows again, in its new state, once the lens
    // has closed — review ct03)
    {
      const G = Lc.G;
      const pa = portWorld(G, 'a', G.rowAt('a', fo.a - 1)), p0 = portWorld(G, 'b', G.rowAt('b', fo.b0 - 1)), p1 = portWorld(G, 'b', G.rowAt('b', fo.b1 - 1));
      const R = Math.max(7, F * 0.34) * 1.3;
      const sweep = {x: Math.min(pa.x, p0.x) - R, y: Math.min(pa.y, p0.y, p1.y) - R, w: Math.abs(p0.x - pa.x) + 2 * R, h: Math.max(pa.y, p0.y, p1.y) - Math.min(pa.y, p0.y, p1.y) + 2 * R};
      L.hideFocusLink = overlaps(sweep, src);
    }
    L.problems = L.why;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    if (!L.Lc) return g({name: 'scene'});
    const th = ctx.theme;
    const F = L.F;
    const Lc = L.Lc;
    const st = sceneCopy(ctx, L, Lc, 'st-', true);
    const lzL = {...Lc, P: 'lzs-'};
    const strike = L.show ? (() => {
      const t = L.tag, b = L.tagBox;
      const y0 = b.y + F * 0.5 + t.head.height + F * 0.5 + t.ra.height + F * 0.55;
      const x = b.x + F * 1.4;
      return g({name: 'lzs-strike', opacity: 0}, t.rb0.lines.map((ln, i) => h('path', {d: `M${r(x - 2)} ${r(y0 + i * t.rb0.lineHeight + t.rb0.size * 0.55)}h${r(Math.min(t.inner, t.rb0.width) + 4)}`, stroke: th.accent, 'stroke-width': r(Math.max(3, F * 0.12), 2), 'stroke-linecap': 'round'})));
    })() : null;
    const lzContent = g(null, sceneCopy(ctx, L, lzL, 'lzs-', false), strike);
    const lz = growLens(ctx, L, lzContent);
    const panel = (pl, nm) => g({name: nm, opacity: 0}, pl.placed.map(q => {
      const kids = [g({transform: T(q.x - q.c.box.x, q.y - q.c.box.y)}, q.c.node)];
      if (q.it.glyph) kids.push(glyph(ctx, q.it.glyph, q.x - F * 0.85, q.y + q.c.box.h / 2, F * 0.42));
      if (q.it.kind === 'marker') kids.push(changedMarker(ctx, {x: q.x - F * 0.85, y: q.y + q.c.box.h / 2, radius: F * 0.6}));
      if (q.it.kind === 'was') kids.push(h('path', {d: `M${r(q.x + q.c.box.w * 0.08)} ${r(q.y + q.c.box.h / 2)}H${r(q.x + q.c.box.w * 0.92)}`, stroke: th.inkSoft, 'stroke-width': 2.4}));
      return g({name: q.it.name}, kids);
    }));
    // the Δ beside the tag's ◆ row (context)
    const b = L.tagBox;
    const mk = changedMarker(ctx, {name: 'st-delta', x: b.x + b.w + F * 0.75, y: b.y + b.h - F * 1.1, radius: F * 0.6, opacity: 0});
    return g({name: 'scene'}, st, mk, panel(L.rest, 'panel-rest'), panel(L.hold, 'panel-hold'), lz.node);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    if (!L.Lc) return {nodes: {}, semantic: {layoutOk: false, why: L.why.join(','), problems: L.problems}};
    const nodes = {};
    const Lc = L.Lc, G = Lc.G, fo = L.fo;
    const after = u >= W.turnIn[0];
    const dep = ease.inOutSine(seg(u, ...W.dep));
    const open = ease.inOutSine(seg(u, ...W.open)) * (1 - ease.inOutSine(seg(u, ...W.close)));
    // the context and its lens copy, posed identically
    const hand = handOver(L, open);
    for (const P of ['st-', 'lzs-']) poseCopy(nodes, L, P, dep, u, hand);
    // people
    const posed = [G.figA, G.figB].map((fg, i) => Lc.rigs[i].frame({x: fg.x, y: fg.floor, facing: fg.f, scale: fg.k, headTilt: 3}));
    posed.forEach(q => Object.assign(nodes, q.nodes));
    // lens
    const gs = L.grow > 1 ? 1 + (L.grow - 1) * (u < 0.5 ? 1 - ease.inOutSine(seg(u, ...W.shrink)) : ease.inOutSine(seg(u, ...W.regrow))) : 1;
    const lzf = lensFrame(L, open, gs);
    Object.assign(nodes, lzf.nodes);
    if (L.show) nodes['lzs-strike'] = {opacity: r(seg(u, ...W.strike) * (1 - seg(u, ...W.turnOut)), 3)};
    // panel
    nodes['panel-rest'] = {opacity: r(1 - seg(u, ...W.panelOut), 3) * (u < W.panelIn[0] ? 1 : 0)};
    nodes['panel-hold'] = {opacity: r(seg(u, ...W.panelIn), 3)};
    for (const q of L.hold.placed) nodes[q.it.name] = {opacity: q.it.kind === 'key' ? r(seg(u, ...W.notes), 3) : 1};
    for (const q of L.rest.placed) nodes[q.it.name] = {opacity: 1};
    const lift = u < 0.5 ? L.dyRest * (1 - ease.inOutSine(seg(u, ...W.shiftUp))) : L.dyHold * ease.inOutSine(seg(u, ...W.shiftDown));
    // (grow mode: large at rest and hold; it eases into its part with the lens's opening and back with its closing)
    const ctxT = L.grow > 1 ? growT(L, gs) : T(0, r(lift, 2));
    nodes['st-scene'] = {transform: ctxT};
    nodes['st-delta'] = {opacity: r(seg(u, ...W.marker), 3), transform: ctxT};
    const bNow = dep <= 0 ? fo.b0 : dep >= 1 ? fo.b1 : null;
    const ctxTxt = hand.ctx > 0.5 ? 1 : 0;
    const turnV = after ? seg(u, ...W.turnIn) : 1 - seg(u, ...W.turnOut);
    return {
      nodes,
      semantic: {
        lensOpen: r(open, 3), datum: after ? 'after' : 'before', bAt: bNow ?? 'moving', dep: r(dep, 3),
        contextValue: ctxTxt ? p.performancesB[(after ? fo.b1 : fo.b0) - 1] : null,
        contextLinkShown: L.hideFocusLink ? hand.ctx : 1,
        lensValue: hand.copy > 0.5 && L.show ? p.performancesB[(after ? fo.b1 : fo.b0) - 1] : null, valueLegible: r(turnV, 3),
        zoom: r(L.zoom, 3), lensShortFrac: r((Math.min(L.dest.w, L.dest.h) * L.upx) / 1080 * (1080 / Math.min(ctx.view.width, ctx.view.height)) * Math.min(ctx.view.width, ctx.view.height) / Math.min(ctx.view.width, ctx.view.height), 3),
        contextFrac: r(L.contextFrac, 3), lensClearOfHeads: L.lensClearOfHeads, lensClearOfContext: L.lensClearOfContext,
        markerVisible: seg(u, ...W.marker) >= 1, strike: r(seg(u, ...W.strike) * (1 - seg(u, ...W.turnOut)), 3),
        focusLink: fo.i + 1, before: fo.b0, after: fo.b1,
        allReached: posed.every(q => q.reached), layoutOk: L.ok, why: L.why.join(','), problems: L.problems,
        textPx: r(L.F * L.upx, 2), headPx: r(90 * G.k * L.upx * gs, 1), contextScale: r(gs, 4), zoomVsRest: r(L.zoom / (L.grow ?? 1), 3),
      },
    };
  },
};


/** The lens's current size factor (window about the destination's centre) and the copy's current magnification. */
function lensNow(L, open) {
  // (it starts at about the context's own size: the copy is legible almost at once — no long blank window)
  const s0 = 1 / L.zoom;
  const sc = s0 + (1 - s0) * open;
  return {sc, zoomNow: L.zoom * sc};
}

/** Hand-over between the context's tag text and the lens copy: the context copy fades before the lens copy shows, and
 * the lens copy (never smaller than the context's own size: the window starts at it) right after. */
function handOver(L, open) {
  if (open <= 0) return {ctx: 1, copy: 0};
  return {ctx: r(1 - seg(open, 0, 0.04), 3), copy: r(seg(open, 0.05, 0.12), 3)};
}

/** A lens that grows at its own place (the panel's), never over the context: the window grows about the destination's
 * centre, its copy scaled with it so that the rim never cuts it; the source frame marks the tag. */
function growLens(ctx, L, content) {
  const th = ctx.theme;
  const clipId = 'lens-clip';
  return {node: g({name: 'lens'},
    h('path', {name: 'lens-src', d: roundRectPath(L.src.x, L.src.y, L.src.w, L.src.h, 10), fill: 'none', stroke: th.fg, 'stroke-width': 4, opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'lens-cliprect', rx: 22}))),
    g({name: 'lens-win', opacity: 0, 'data-occludes': 1},
      h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
      h('rect', {name: 'lens-bg', rx: 22, fill: th.paper}),
      g({'clip-path': ctx.ref(clipId)}, g({name: 'lens-content'}, g({name: 'lens-cfade', opacity: 0}, content))),
      h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.fg, 'stroke-width': 5})))};
}

/** The grow-mode transform of the context at scale gs (anchored at the box's top-left corner). */
function growT(L, gs) {
  const ax = L.box.x, ay = L.box.y;
  return `translate(${r(ax - ax * gs, 2)} ${r(ay - ay * gs, 2)}) scale(${r(gs, 4)})`;
}

function lensFrame(L, open, gsAt = 1) {
  const {sc, zoomNow} = lensNow(L, open);
  const D = L.dest, S = L.src;
  const cx = D.x + D.w / 2, cy = D.y + D.h / 2;
  const R = {x: cx - D.w * sc / 2, y: cy - D.h * sc / 2, w: D.w * sc, h: D.h * sc};
  const vis = open > 0.001;
  const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
  const hand = handOver(L, open);
  return {nodes: {
    'lens-src': {opacity: vis ? 1 : 0, transform: L.grow > 1 ? growT(L, gsAt) : ''},
    'lens-cliprect': rect,
    'lens-win': {opacity: vis ? 1 : 0},
    'lens-shadow': {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height},
    'lens-bg': rect,
    'lens-border': rect,
    'lens-content': {transform: `${T(R.x - S.x * zoomNow, R.y - S.y * zoomNow)} scale(${r(zoomNow, 4)})`},
    'lens-cfade': {opacity: hand.copy},
  }, zoomNow};
}

/** One copy of the context scene (prefix P): board, cards, links, tag (+ people and names in the context only). */
function sceneCopy(ctx, L, Lx, P, withPeople) {
  const p = ctx.params;
  const th = ctx.theme;
  const F = L.F, G = Lx.G, fo = L.fo;
  const sw = r(Math.max(5, 4 / L.upx), 2);
  const links = fo.links.map((lk, j) => g({name: `${P}link${j}`},
    h('path', {name: `${P}link${j}-p`, fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round'}),
    g({name: `${P}link${j}-pa`}, glyph(ctx, 'a', 0, 0, Math.max(7, F * 0.34))),
    g({name: `${P}link${j}-pb`}, glyph(ctx, 'b', 0, 0, Math.max(7, F * 0.34))),
    h('circle', {name: `${P}link${j}-knot`, r: r(Number(sw) * 1.1, 2), fill: INK})));
  const t = L.tag, b = L.tagBox;
  const gx = b.x + b.w / 2;
  const tagKids = [
    h('path', {d: `M${r(gx)} ${r(G.yB - 2)}V${r(b.y + 2)}`, stroke: th.woodDark, 'stroke-width': 3}),
    h('path', {d: roundRectPath(b.x + 3, b.y + 5, b.w, b.h, 10), fill: th.shadow}),
    h('path', {name: `${P}tag-sheet`, d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: th.card, stroke: INK, 'stroke-width': 2.6}),
    h('circle', {cx: r(gx), cy: r(b.y + F * 0.25), r: r(F * 0.16, 2), fill: th.woodDark}),
  ];
  if (t.show) {
    let y = b.y + F * 0.5;
    tagKids.push(g({name: `${P}tag-head`}, textBlock(t.head, {x: r(gx), y: r(y), anchor: 'middle', fill: INK})));
    y += t.head.height + F * 0.5;
    const x = b.x + F * 1.4;
    tagKids.push(glyph(ctx, 'a', b.x + F * 0.75, y + F * 0.5, F * 0.36), g({name: `${P}tag-a`}, textBlock(t.ra, {x: r(x), y: r(y), fill: INK})));
    y += t.ra.height + F * 0.55;
    tagKids.push(h('path', {d: `M${r(b.x + F * 0.5)} ${r(y - F * 0.3)}H${r(b.x + b.w - F * 0.5)}`, stroke: th.paperLine, 'stroke-width': 2}));
    tagKids.push(glyph(ctx, 'b', b.x + F * 0.75, y + F * 0.5, F * 0.36), g({name: `${P}tag-b0`}, textBlock(t.rb0, {x: r(x), y: r(y), fill: INK})), g({name: `${P}tag-b1`, opacity: 0}, textBlock(t.rb1, {x: r(x), y: r(y), fill: INK})));
  } else {
    const x = b.x + F * 1.4, bw = b.w - F * 2;
    tagKids.push(glyph(ctx, 'a', b.x + F * 0.75, b.y + b.h * 0.35, F * 0.36), h('rect', {x: r(x), y: r(b.y + b.h * 0.35 - F * 0.15), width: r(bw * 0.8), height: r(F * 0.3), rx: 3, fill: INK, opacity: 0.6}));
    tagKids.push(glyph(ctx, 'b', b.x + F * 0.75, b.y + b.h * 0.7, F * 0.36), h('rect', {x: r(x), y: r(b.y + b.h * 0.7 - F * 0.15), width: r(bw * 0.8), height: r(F * 0.3), rx: 3, fill: INK, opacity: 0.6}));
  }
  const tag = g({name: `${P}tag`, 'data-occludes': 1}, tagKids);
  const kids = [boardArt(ctx, Lx), cardNodes(ctx, Lx, {a: p.performancesA, b: p.performancesB}), links, tag];
  if (withPeople) kids.push(Lx.rigs[0].node, Lx.rigs[1].node, nameNodes(ctx, Lx, Lx.captions));
  return g({name: `${P}scene`}, kids);
}

/** Pose one copy: cards seated, links (the inspected one's ◆ end sliding with dep), tag rows by the datum. */
function poseCopy(nodes, L, P, dep, u, hand) {
  const G = L.Lc.G, fo = L.fo;
  const lens = P === 'lzs-';
  for (const s of ['a', 'b']) for (let j = 0; j < (s === 'a' ? L.nA : L.nB); j++) {
    const c = G.rowAt(s, j);
    nodes[`${P}card-${s}${j}`] = {transform: T(r(c.x, 2), r(c.y, 2))};
  }
  fo.links.forEach((lk, j) => {
    const pa = portWorld(G, 'a', G.rowAt('a', lk.a - 1));
    let pb = portWorld(G, 'b', G.rowAt('b', lk.b - 1));
    if (j === fo.i) {
      const p0 = portWorld(G, 'b', G.rowAt('b', fo.b0 - 1)), p1 = portWorld(G, 'b', G.rowAt('b', fo.b1 - 1));
      pb = {x: p0.x, y: lerp(p0.y, p1.y, dep)};
    }
    const geo = linkGeom(pa, pb);
    if (!lens && j === fo.i && L.hideFocusLink) nodes[`${P}link${j}`] = {opacity: hand.ctx};
    nodes[`${P}link${j}-p`] = {d: fullPath(pa, pb)};
    nodes[`${P}link${j}-pa`] = {transform: T(r(pa.x, 2), r(pa.y, 2))};
    nodes[`${P}link${j}-pb`] = {transform: T(r(pb.x, 2), r(pb.y, 2))};
    nodes[`${P}link${j}-knot`] = {cx: r(geo.mid.x, 2), cy: r(geo.mid.y, 2)};
  });
  if (L.tag.show) {
    const after = u >= W.turnIn[0];
    const v0 = 1 - seg(u, ...W.turnOut), v1 = seg(u, ...W.turnIn);
    // context: the tag is blank while the lens shows it (one legible copy at a time)
    const ctxOn = lens ? 1 : hand.ctx;
    nodes[`${P}tag-head`] = {opacity: ctxOn};
    nodes[`${P}tag-a`] = {opacity: ctxOn};
    nodes[`${P}tag-b0`] = {opacity: r(after ? 0 : v0 * ctxOn, 3)};
    nodes[`${P}tag-b1`] = {opacity: r(after ? v1 * ctxOn : 0, 3)};
  }
  // the lens copy shows no printed text but the tag's (fields its rim would cut are left out)
  if (lens && L.show) {
    // (no text of the board itself in the lens copy: only the tag's)
    nodes[`${P}board-head`] = {opacity: 0};
    for (const s of ['a', 'b']) if (G.cols[s === 'a' ? 0 : 1].fit) nodes[`${P}col-${s}-head`] = {opacity: 0};
  }
  // (the lens copy leaves out every card its rim would cut: each card is wholly inside the crop or not drawn)
  if (lens) {
    const S = L.src;
    for (const s of ['a', 'b']) for (let j = 0; j < (s === 'a' ? L.nA : L.nB); j++) {
      const c = G.rowAt(s, j);
      const inside = c.x - G.cw / 2 >= S.x && c.x + G.cw / 2 <= S.x + S.w && c.y - G.ch / 2 >= S.y && c.y + G.ch / 2 <= S.y + S.h;
      nodes[`${P}card-${s}${j}`].opacity = inside ? 1 : 0;
    }
  }
  if (lens && L.show && L.cardText) {
    for (const s of ['a', 'b']) for (let j = 0; j < (s === 'a' ? L.nA : L.nB); j++) nodes[`${P}card-${s}${j}-in-txt`] = {opacity: 0};
  }
}

/** The link's full path between two ports (a cubic with horizontal tangents). */
function fullPath(pa, pb) {
  const dx = Math.max(20, (pb.x - pa.x) * 0.5);
  return `M${r(pa.x, 2)} ${r(pa.y, 2)}C${r(pa.x + dx, 2)} ${r(pa.y, 2)} ${r(pb.x - dx, 2)} ${r(pb.y, 2)} ${r(pb.x, 2)} ${r(pb.y, 2)}`;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-03-inspect',
    title: 'Reciprocal obligations, without a rule — inspecting a link tag and substituting the B performance it joins',
    titleEs: 'Obligaciones recíprocas — Inspección y cambio de un dato',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Obligaciones recíprocas',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The contract board after the story\'s action: two columns of equal size, "Obligation of A" (●) and "Obligation of B" (◆), the supplied links between them and a tag hanging from the links\' gutter, "Link 1 (as supplied)", naming the two performances it joins. A lens grows beside the scene with a real enlarged copy of the tag; the old ◆ performance is struck, the row turns over to the supplied alternative and only then the link\'s ◆ end slides along column B to the new performance. The lens closes onto the tag, a Δ marks the changed row and the panel shows the marker, the struck "was:" value and the key "As supplied · no conclusion drawn". Seeking back restores the old datum. No rule and no conclusion.',
    tags: ['reciprocal obligations', 'two columns', 'link', 'tag', 'lens', 'substitution', 'changed datum', 'equal weight', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/obligaciones-reciprocas.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
