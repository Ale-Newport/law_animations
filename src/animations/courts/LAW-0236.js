/**
 * LAW-0236 — Archivo judicial · inspect
 *
 * Storyboard (the context is the state produced by the story: in the generic,
 * fictional archive room the ● block (files supplied as active) stands open at
 * the file's aisle, the ◆ block (files supplied as archived) is packed, and the
 * located file lies in the tray of its state on the counter; the clerk stands
 * behind it. Under the counter, a tag led to the file carries the SUPPLIED
 * datum: the file's state, "Active (as supplied)" with its ● cue. A panel holds
 * the legend, the single context caption and the key):
 *  0.00–0.20  build: the context in full; a solid ring settles on the trays and
 *             the context caption appears.
 *  0.20–0.45  isolate: a frame settles on the detail that tells an active file
 *             from an archived one — the two trays, the file, the clerk's hands
 *             and the tag. The panel steps aside; the context steps back a
 *             little at most (it keeps >= 45 % of the frame width; its texts
 *             hide while they would be under their floor) and dims in place; a
 *             lens opens beside it, over the space the panel left and never
 *             over the context: a REAL enlarged copy (>= 1.5x the context at
 *             rest) of the same plan coordinates, tied to the frame by two
 *             solid guides. The tag is shown in ONE place at a time: its context
 *             copy leaves as the lens copy becomes legible and returns only
 *             after it has gone.
 *  0.45–0.75  substitute ONE datum in the lens: the old value moves down into a
 *             "was" slot (kept, never struck or crossed); the new value appears
 *             in its place and stays still; then only the dependent geometry
 *             follows — the clerk lifts the file from the tray of the old state
 *             and sets it in the tray of the new one. "Archived" is only another
 *             tray and shelf block here.
 *  0.72–1.00  return: the lens closes while the context returns to full size
 *             and strength with the file in its new tray, the kept old value and
 *             a neutral changed-datum marker (Δ); a panel note repeats it.
 *             Seeking back restores the old datum exactly. No retention, access
 *             or archiving rule, time span or outcome is shown or inferred.
 * @module animations/courts/LAW-0236
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {
  archFields, ARCH_EN, ARCH_STRINGS, archGeometry, archArt, filePose, clerkLook, legendItem, legendItem2, keyItem, captionItem,
  layoutPanel, overlaps, unionBox, pxPerUnit, R2, searchLayout, planPerson, clerkNodes, walkAt, makeLeg, carryPoint, fileProp,
  mapper, textAt, fitG, stateGlyph, changedMarker, smooth, STATES,
} from './kits/archivo-judicial.js';

const ID = 'LAW-0236';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  ring: [0.04, 0.12], frame: [0.2, 0.24], panelOut: [0.215, 0.24], shrink: [0.221, 0.271], open: [0.24, 0.3],
  dock: [0.46, 0.5], newIn: [0.505, 0.535], reach: [0.55, 0.57], lift: [0.57, 0.59], move: [0.59, 0.65], letgo: [0.655, 0.68],
  close: [0.72, 0.762], grow: [0.732, 0.774], panelIn: [0.748, 0.778], marker: [0.8, 0.84],
};

const STRINGS = {
  en: {...ARCH_STRINGS.en, was: 'was'},
  es: {...ARCH_STRINGS.es, was: 'antes'},
};

const sceneSchema = {
  ...archFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the tag with the file\'s supplied state (and the tray it sends the file to)', ['fileState']),
  beforeValue: str('The file\'s state as supplied before the substitution', 60),
  afterValue: str('The alternative supplied state', 60),
  detailGeometry: obj('Lens and the geometry each value draws', {
    zoom: num('Largest magnification of the lens, against the context at rest', 1.5, 4),
    before: oneOf('The tray (and cue) the before value draws: active = ●, archived = ◆', STATES),
    after: oneOf('The tray (and cue) the after value draws: active = ●, archived = ◆', STATES),
  }),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial note)', 90), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  ...ARCH_EN,
  focusTarget: 'fileState',
  beforeValue: 'State: active (as supplied)',
  afterValue: 'State: archived (as supplied)',
  detailGeometry: {zoom: 2.2, before: 'active', after: 'archived'},
  contextLabels: {context: 'The file after the shelves located it, as configured', marker: 'Changed: one supplied datum, the file\'s state'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    const hidden = !ctx.show('key');
    if (hidden) {
      // labels hidden (no panel, no tag): the plan alone fills the safe box, centred; a deeper room (longer units, the
      // same front zone) in the square and tall frames; slightly smaller variants leave the lens its room
      const geos = shape === 'landscape' ? ['std', 'w4', 'w5', 'w5f', 'w6f'] : shape === 'square' ? ['std', 'm1', 'm2'] : ['deep', 'vdeep', 'xdeep'];
      for (const geo of geos) for (const ks of [1, 0.96, 0.92, 0.88, 0.84]) arrs.push({panel: 'none', pf: 0, cols: 0, geo, ks});
    } else if (shape === 'landscape') {
      for (const pf of [0.28, 0.32, 0.36]) arrs.push({panel: 'column', pf, cols: 1});
      for (const pf of [0.4, 0.44]) arrs.push({panel: 'column', pf, cols: 2});
    } else if (shape === 'square') {
      for (const pf of [0.3, 0.34, 0.38, 0.42, 0.46, 0.5]) for (const compact of [false, true]) arrs.push({panel: 'band', pf, cols: 3, compact});
    } else {
      for (const pf of [0.3, 0.34, 0.38, 0.42, 0.46]) for (const cols of [2, 1]) arrs.push({panel: 'band', pf, cols});
    }
    for (const A of arrs) A.key = A.geo ? `hidden/${A.geo}/ks${A.ks}` : `${A.panel}/${A.pf}/${A.cols}${A.compact ? '/c' : ''}`;
    // a larger lens magnification (against the context at rest) and a larger context both count
    return searchLayout((v, A) => compose(ctx, p, v / px, px, A), arrs, L => Math.min(L.k, 1.3) + 0.25 * (L.zoom || 0) + 0.5 * (L.sT || 0) + 0.8 * (L.fill || 0) + 2 * (L.lensArea || 0));
  },
  build(ctx, L) {
    const th = ctx.theme;
    const world = g({name: 'world'},
      g({name: 'plan', transform: L.M.transform},
        L.art.node, L.fileNode, L.clerk.node),
      g({name: 'build-ring', opacity: 0}, h('rect', {x: r(L.traysD.x - 8), y: r(L.traysD.y - 8), width: r(L.traysD.w + 16), height: r(L.traysD.h + 16), rx: 12, fill: 'none', stroke: th.accent3, 'stroke-width': 5})),
      g({name: 'cx-wrap'}, L.showStack ? L.stack.node('cx') : null),
      L.marker,
      h('rect', {name: 'src-frame', x: r(L.crop.x), y: r(L.crop.y), width: r(L.crop.w), height: r(L.crop.h), rx: 10, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', opacity: 0}),
    );
    return g(null,
      world,
      L.panelNode,
      L.guides.map((gd, i) => h('line', {name: `guide${i}`, x1: r(gd.a.x), y1: r(gd.a.y), x2: r(gd.b.x), y2: r(gd.b.y), stroke: th.accent2, 'stroke-width': 2.5, opacity: 0})),
      g({name: 'lens', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {name: 'lens-clip-rect', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18}))),
        h('rect', {name: 'lens-shadow', x: r(L.dest.x + 6), y: r(L.dest.y + 10), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: '#fbf8f1'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(L.dest.x - L.crop.x * L.zoom, L.dest.y - L.crop.y * L.zoom)} scale(${r(L.zoom, 4)})`},
            g({transform: L.M.transform}, L.lzArt.node, L.lzFileNode, L.lzClerk.node),
            L.showStack ? L.stack.node('lz') : null)),
        h('rect', {name: 'lens-rim', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const G = L.G;
    const reduced = ctx.reduced;
    // the context steps back (at most to sT) and dims in place while the lens is open
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, L.sT, sh);
    const off = {x: L.anchor.x * (1 - sc), y: L.anchor.y * (1 - sc)};
    nodes.world = {transform: `${T(r(off.x, 2), r(off.y, 2))} scale(${r(sc, 4)})`};
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const dim = 1 - 0.42 * open;
    const textOp = L.F * L.px * sc >= L.tFloor - 1e-6 ? 1 : 0;
    nodes.plan = {transform: L.M.transform, opacity: r(dim, 3)};
    // the scene: the ● block open at the file's aisle, the file in the tray of the before value; then the clerk moves it
    // to the tray of the after value (context and lens copies alike)
    const st = fileScene(L, u, reduced);
    for (const [P, art, clerk] of [['s', L.art, L.clerk], ['lz', L.lzArt, L.lzClerk]]) {
      Object.assign(nodes, art.frame({open: [L.openB === 0 ? 1 : 0, L.openB === 1 ? 1 : 0], lit: [L.openB === 0 ? 1 : 0, L.openB === 1 ? 1 : 0], pulse: null, spine: 1}));
      Object.assign(nodes, clerkNodes(clerk, P === 's' ? 'clerk' : 'lz-clerk', st.walker, st.carry));
      Object.assign(nodes, filePose(P === 's' ? 'file' : 'lz-file', st.file, st.fileDeg, 1, 1));
    }
    // build: the ring on the trays
    nodes['build-ring'] = {opacity: r(seg(u, ...W.ring) * (1 - seg(u, W.frame[0] - 0.03, W.frame[0])), 3)};
    // the source frame leaves with the lens
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    // the lens grows from its far edge (its outer extent never moves)
    const {ls, rect: rect0} = lensAt(u, L.dest, L.side);
    const rect = L.side !== 'right' && L.unrollDown ? {...rect0, y: L.dest.y} : rect0;
    const lc = anchorOf(L.dest, L.side);
    const lensOp = u < 0.5 ? seg(u, W.open[0], W.open[0] + 0.012) : 1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012);
    const below = L.side !== 'right';
    const win = below ? (L.unrollDown ? {y: L.dest.y, h: L.dest.h * ls} : {y: L.dest.y + L.dest.h * (1 - ls), h: L.dest.h * ls}) : {y: L.dest.y, h: L.dest.h};
    nodes.lens = {opacity: r(lensOp, 3), transform: below ? scaleAbout(lc.x, lc.y, 1) : scaleAbout(lc.x, lc.y, r(ls, 4))};
    for (const [nm, dy] of [['lens-clip-rect', 0], ['lens-bg', 0], ['lens-rim', 0], ['lens-shadow', 10]]) nodes[nm] = {y: r(win.y + dy, 2), height: r(win.h, 2)};
    // a head is wholly in or out of the lens crop: the lens copy of the clerk shows only once the unrolling window
    // holds the whole head (with a small margin), and hides again as the window rolls back over it
    const hdD = L.M.toD(st.walker), hr = 34 * L.k;
    const hTop = L.dest.y + (hdD.y - hr - L.crop.y) * L.zoom, hBot = L.dest.y + (hdD.y + hr - L.crop.y) * L.zoom;
    const headIn = !below || (hTop >= win.y + 3 && hBot <= win.y + win.h - 3);
    nodes['lz-clerk'] = {...nodes['lz-clerk'], opacity: headIn ? 1 : 0};
    // guides: from the source frame (where the world puts it now) to the lens corners
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    L.guides.forEach((gd, i) => {
      const a = wt(gd.a0);
      const b = L.side !== 'right' ? {x: gd.b.x, y: L.unrollDown ? gd.b.y : Math.max(gd.b.y, L.dest.y + L.dest.h * (1 - ls))} : {x: lc.x + (gd.b.x - lc.x) * ls, y: lc.y + (gd.b.y - lc.y) * ls};
      nodes[`guide${i}`] = {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: r(Math.min(fr, open > 0.05 ? 1 : 0), 3)};
    });
    // one copy of the datum at a time: the context tag leaves as the lens copy becomes legible and returns after it goes
    const cxOp = u < 0.5 ? 1 - seg(u, L.uIn - 0.011, L.uIn - 0.001) : seg(u, L.uOut + 0.001, L.uOut + 0.011);
    nodes['cx-wrap'] = {opacity: r(textOp ? cxOp : 0, 3)};
    if (L.showStack) {
      nodes['lz-stack'] = {opacity: (below ? win.y <= L.stackLensTop - 2 && win.y + win.h >= L.stackLensBottom + 2 : L.F * L.px * L.zoom * ls >= L.tFloor + 0.2) ? 1 : 0};
      // the substitution and the tag's lead to the file (both copies are driven alike; only one is visible)
      const fD = L.M.toD(st.file);
      Object.assign(nodes, L.stack.frame(u, 'cx', fD), L.stack.frame(u, 'lz', fD));
    }
    const mk = seg(u, ...W.marker);
    if (L.marker) nodes['cx-marker'] = {opacity: r(mk, 3)};
    if (L.hasMarkerNote) nodes['marker-note'] = {opacity: r(mk, 3)};
    // the panel steps aside before the lens opens over its place and returns after it has closed (never a cross-fade)
    if (L.panelNode) nodes.panel = {opacity: r(L.lensOverPanel ? (u < 0.5 ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn)) : 1, 3)};
    const newIn = seg(u, ...W.newIn);
    const datum = u < W.dock[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const Ws = {x: off.x + L.Wb.x * sc, y: off.y + L.Wb.y * sc, w: L.Wb.w * sc, h: L.Wb.h * sc};
    const hd = L.M.toD(st.walker);
    const headNow = {x: off.x + (hd.x - 30 * L.k) * sc, y: off.y + (hd.y - 30 * L.k) * sc, w: 60 * L.k * sc, h: 60 * L.k * sc};
    return {
      nodes,
      semantic: {
        beat,
        datum,
        lensOpen: r(open, 3),
        lensOpacity: r(lensOp, 3),
        contextScale: r(sc, 3),
        contextDim: r(dim, 3),
        contextWidth: r(Ws.w / L.FW, 3),
        lensSpan: r(L.span, 3),
        textOnPlan: r(textOp, 3),
        oldDocked: r(seg(u, ...W.dock), 3),
        newShown: r(newIn, 3),
        focusTarget: ctx.params.focusTarget,
        fileTray: st.tray,
        holder: st.holder,
        trayBefore: STATES[L.bB],
        trayAfter: STATES[L.bA],
        zoom: r(L.zoom / L.sT, 2),
        zoomVsRest: r(L.zoom, 2),
        lensMinSidePx: r(Math.min(L.dest.w, L.dest.h) * L.px, 1),
        datumInLens: L.stackInCrop && lensOp >= 0.99,
        lensClearOfContext: lensOp === 0 || !overlaps(rect, Ws, 0),
        lensClearOfPeople: lensOp === 0 || !overlaps(rect, headNow, 0),
        file: R2(L.M.toD(st.file)),
        hands: R2(L.M.toD(carryPoint(st.walker))),
        clerk: R2(L.M.toD(st.walker)),
        markerShown: r(mk, 3),
        markerClear: L.markerClear,
        sT: r(L.sT, 3),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: L.arrangement,
        log: L.log,
      },
    };
  },
};

/**
 * The dependent geometry at u: the clerk (behind the tray of the before value, facing the counter) reaches, lifts the
 * file, side-steps to the tray of the after value and sets it there. Pure in u.
 */
function fileScene(L, u, reduced) {
  const G = L.G;
  const tB = G.trays[L.bB], tA = G.trays[L.bA];
  const standB = {x: tB.x, y: G.home.y}, standA = {x: tA.x, y: G.home.y};
  const changes = L.bB !== L.bA;
  const reach = changes ? ease.inOutSine(seg(u, ...W.reach)) : 0;
  const lift = changes ? ease.inOutSine(seg(u, ...W.lift)) : 0;
  const qm = changes ? seg(u, ...W.move) : 0;
  const letgo = changes ? ease.inOutSine(seg(u, ...W.letgo)) : 0;
  const walker = qm > 0 ? walkAt(L.moveLeg, qm, reduced) : {x: standB.x, y: standB.y, deg: 180, phase: 0, walk: 0};
  if (qm >= 1) Object.assign(walker, {x: standA.x, y: standA.y, deg: 180, walk: 0});
  const carry = Math.max(reach * (1 - letgo), 0);
  const cp = carryPoint(walker);
  let file, holder, tray;
  if (lift <= 0) { file = {x: tB.x, y: tB.y}; holder = 'tray'; tray = STATES[L.bB]; }
  else if (qm >= 1 && letgo > 0) { file = {x: tA.x, y: tA.y}; holder = letgo >= 1 ? 'tray' : 'clerk'; tray = STATES[L.bA]; }
  else { file = lift < 1 ? {x: tB.x, y: lerp(tB.y, cp.y, lift)} : cp; holder = 'clerk'; tray = null; }
  return {walker, carry, file, fileDeg: holder === 'clerk' && lift >= 1 ? walker.deg : 180, holder, tray};
}

/** Is the lens copy of the datum legible at u (lens opacity >= 0.15 and the field wholly in the window)? */
function lzLegible(L, u) {
  const lensOp = u < 0.5 ? seg(u, W.open[0], W.open[0] + 0.012) : 1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012);
  if (lensOp < 0.15) return false;
  const {ls} = lensAt(u, L.dest, L.side);
  if (L.side === 'right') return L.F * L.px * L.zoom * ls >= L.tFloor + 0.2;
  const win = L.unrollDown ? {y: L.dest.y, h: L.dest.h * ls} : {y: L.dest.y + L.dest.h * (1 - ls), h: L.dest.h * ls};
  return win.y <= L.stackLensTop - 2 && win.y + win.h >= L.stackLensBottom + 2;
}

/** Lens rect at u (grows from its far edge between 0.6 and 1 of its size). */
function lensAt(u, dest, side) {
  const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
  const ls = 0.6 + 0.4 * open;
  if (side !== 'right') return {ls, rect: {x: dest.x, y: dest.y + dest.h * (1 - ls), w: dest.w, h: dest.h * ls}};
  const a = anchorOf(dest, side);
  return {ls, rect: {x: a.x + (dest.x - a.x) * ls, y: a.y + (dest.y - a.y) * ls, w: dest.w * ls, h: dest.h * ls}};
}
/** The lens's far point (away from the context), which stays put while it grows. */
function anchorOf(dest, side) {
  if (side === 'below-r') return {x: dest.x + dest.w, y: dest.y + dest.h};
  if (side === 'below-l') return {x: dest.x, y: dest.y + dest.h};
  return {x: dest.x + dest.w, y: dest.y + dest.h / 2};
}

/**
 * The datum stack: the value chip (old and new in the same slot, never cross-faded: the old one moves down into the
 * "was" slot and stays readable; the new one appears in the freed slot), each with the ● / ◆ cue of the tray it draws,
 * and a lead from the stack to the file.
 */
function datumStack(ctx, p, F, maxW, kindB, kindA) {
  const th = ctx.theme;
  const pad = F * 0.5;
  const gs = F * 1.1;
  const mk = text => fitG(text, {maxWidth: maxW - 2 * pad - gs - F * 0.4, size: F, minSize: F, maxLines: 3, weight: 650});
  const fOld = mk(p.beforeValue), fNew = mk(p.afterValue);
  const wasFit = fitG(ctx.t.was, {maxWidth: maxW, size: F, minSize: F, maxLines: 1, weight: 500});
  const cw = fit => fit.width + 2 * pad + gs + F * 0.4, chh = fit => Math.max(fit.height, gs) + pad * 1.2;
  const slotH = Math.max(chh(fOld), chh(fNew));
  const gap = F * 0.45;
  // the "was" row: the label, then the old value's chip (moved down from the slot)
  const wasW = wasFit.width + F * 0.5;
  const w = Math.max(cw(fOld) + wasW, cw(fNew));
  const hh = slotH + gap + slotH;
  const truncated = fOld.truncated || fNew.truncated || wasFit.truncated;
  let at = {x: 0, y: 0};
  const chip = (P, nm, fit, kind, x, y, o = {}) => g({name: `${P}-${nm}`, opacity: o.opacity, transform: o.transform},
    h('path', {d: roundRectPath(x, y, cw(fit), chh(fit), Math.min(chh(fit) / 2, F * 0.55)), fill: th.card, stroke: th.accent2, 'stroke-width': 2.6}),
    g({transform: T(x + pad + gs / 2, y + chh(fit) / 2)}, stateGlyph(ctx, kind, gs, {name: `${P}-${nm}-cue`})),
    textAt(fit, x + pad + gs + F * 0.4, y + (chh(fit) - fit.height) / 2, th.ink, {name: `${P}-${nm}-text`}));
  const node = P => {
    const {x, y} = at;
    return g({name: `${P}-stack`},
      h('path', {name: `${P}-lead`, d: 'M0 0L1 1', stroke: th.accent2, 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none'}),
      h('circle', {name: `${P}-lead-dot`, cx: 0, cy: 0, r: 4.5, fill: th.accent2}),
      g({name: `${P}-was`, opacity: 0}, textAt(wasFit, x, y + slotH + gap + (slotH - wasFit.height) / 2, th.fgSoft, {italic: true})),
      chip(P, 'old', fOld, kindB, x, y),
      chip(P, 'new', fNew, kindA, x, y, {opacity: 0}),
    );
  };
  const frame = (u, P, fileD) => {
    const dk = ease.inOutCubic(seg(u, ...W.dock)), ni = seg(u, ...W.newIn);
    const dy = (slotH + gap) * dk, dx = wasW * dk;
    // (the lead follows the file to its new tray)
    const {x, y} = at;
    const ax = clamp(fileD.x, x + 10, x + w - 10);
    // the lead runs from the top of the stack to the file
    const d = `M${r(ax)} ${r(y)}L${r(fileD.x)} ${r(fileD.y)}`;
    return {
      [`${P}-old`]: {transform: T(r(dx, 2), r(dy, 2)), opacity: 1},
      [`${P}-was`]: {opacity: r(seg(u, W.dock[1] - 0.01, W.dock[1] + 0.01), 3)},
      [`${P}-new`]: {opacity: r(ni, 3)},
      [`${P}-lead`]: {d},
      [`${P}-lead-dot`]: {cx: r(fileD.x), cy: r(fileD.y)},
    };
  };
  return {
    w, h: hh, slotH, truncated,
    place(x, y) { at = {x, y}; },
    get box() { return {x: at.x, y: at.y, w, h: hh}; },
    node, frame,
  };
}

/** One composition at text size F (design units) for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  // (square frames: a shallower room — shorter units and front zone — so the context and a real lens share the height)
  // (labels hidden: mid / deep / very deep rooms — longer units, the same front zone — so the plan fills square and tall frames)
  const GEO = {std: {}, w4: {NU: 4}, w5: {NU: 5}, w5f: {NU: 5, RH: 540}, w6f: {NU: 6, RH: 540}, m1: {UL: 225, WY: 303, FY: 134, RH: 465}, m2: {UL: 250, WY: 328, FY: 147, RH: 490}, mid: {UL: 300, WY: 378, FY: 172, RH: 540}, deep: {UL: 400, WY: 478, FY: 222, RH: 640}, vdeep: {UL: 610, WY: 688, FY: 327, RH: 850}, xdeep: {UL: 800, WY: 878, FY: 422, RH: 1040}};
  const G = archGeometry(A.compact ? {UL: 150, WY: 228, FY: 97, RH: 340} : A.geo ? GEO[A.geo] : {});
  const tFloor = F * px >= 19.5 ? 19.5 : 16;
  const bB = ((p.detailGeometry && p.detailGeometry.before) || 'active') === 'archived' ? 1 : 0;
  const bA = ((p.detailGeometry && p.detailGeometry.after) || 'archived') === 'archived' ? 1 : 0;
  // the block that stood open for the located file (the file came from the block of its first state)
  const openB = bB;
  // ---- panel
  const items = panelItems(ctx, p, F, showAll, showKey);
  const ks = A.ks || 1;
  let region = {x: D.w * (1 - ks) / 2, y: D.h * (1 - ks) / 2, w: D.w * ks, h: D.h * ks};
  let panel = null, panelBox = null;
  if (items.length) {
    if (A.panel === 'column') {
      const pw = D.w * A.pf;
      panelBox = {x: D.w - pw, y: 0, w: pw, h: D.h};
      region = {x: 0, y: 0, w: D.w - pw - 30, h: D.h};
      panel = layoutPanel(items, panelBox, F, A.cols === 2 ? 'band' : 'column', A.cols);
      panel.place(panelBox);
    } else {
      panelBox = {x: 0, y: D.h * (1 - A.pf), w: D.w, h: D.h * A.pf};
      panel = layoutPanel(items, panelBox, F, 'band', A.cols);
      const used = panelBox.h;
      panelBox = {x: 0, y: D.h - used, w: D.w, h: used};
      region = {x: 0, y: 0, w: D.w, h: D.h - used - 26};
      panel.place(panelBox);
    }
    if (panel.problem) problems.push(panel.problem);
  }
  // ---- the datum stack under the counter (measured first: the plan leaves room for it)
  const stack = showKey ? datumStack(ctx, p, F, Math.min(D.w * 0.5, 460), STATES[bB], STATES[bA]) : null;
  if (stack && stack.truncated) problems.push('stack-trunc');
  const stackRoom = stack ? stack.h + 22 : 0;
  const planRegion = {x: region.x, y: region.y, w: region.w, h: region.h - stackRoom};
  const M = mapper(G.E, planRegion, false, 1.8, {x: 0.5, y: A.geo ? 0.5 : 0});
  const k = M.k;
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  const planD = M.box(G.E);
  // the stack sits under the counter, centred on the two trays
  const cbD = M.box(G.counterBox);
  if (stack) {
    stack.place(clamp(cbD.x + cbD.w / 2 - stack.w / 2, 4, D.w - stack.w - 4), cbD.y + cbD.h + 18);
    const sb = stack.box;
    if (sb.y + sb.h > region.y + region.h + 0.5 || sb.x < -0.5 || sb.x + sb.w > region.x + region.w + 0.5) problems.push('stack-place');
  }
  const stackBox = stack ? stack.box : null;
  // ---- the Δ marker beside the stack (clear of texts)
  const mR = F * 0.95;
  let marker = null, markerClear = true;
  if (stackBox) {
    const cands = [{x: stackBox.x + stackBox.w + mR + 10, y: stackBox.y + stack.slotH / 2}, {x: stackBox.x - mR - 10, y: stackBox.y + stack.slotH / 2}];
    const mPos = cands.find(q => q.x - mR >= region.x && q.x + mR <= region.x + region.w);
    markerClear = Boolean(mPos);
    if (!mPos) problems.push('marker');
    else marker = g({name: 'cx-marker', opacity: 0}, changedMarker(ctx, {x: mPos.x, y: mPos.y, radius: mR}));
  }
  // ---- the crop: both trays, the clerk at both places (wholly), the slip and the stack
  const tB = G.trays[bB], tA = G.trays[bA];
  const traysT = {x: Math.min(G.trays[0].x, G.trays[1].x) - G.trays[0].w / 2 - 30, y: G.counterBox.y - 4, w: Math.abs(G.trays[1].x - G.trays[0].x) + G.trays[0].w + 60, h: G.counterBox.h + 8};
  const traysD = M.box(traysT);
  const clerkT = {x: Math.min(tB.x, tA.x) - 62, y: G.home.y - 62, w: Math.abs(tA.x - tB.x) + 124, h: 62 + 50};
  const base = unionBox([M.box(traysT), M.box(clerkT), ...(stackBox ? [stackBox] : [])]);
  const padC = 10;
  let crop0 = {x: base.x - padC, y: base.y - padC, w: base.w + 2 * padC, h: base.h + 2 * padC};
  // ---- the world at rest and its anchor (it steps back towards its top-left corner)
  const allTexts = stackBox ? [stackBox] : [];
  const Wb = unionBox([planD, ...allTexts]);
  // the world steps back towards its top-left corner; labels hidden, it steps back to the far edge from the lens
  // (left with the lens on the right, top with the lens below) and stays centred along the other axis
  const anchorFor = (sT, side) => {
    if (!A.geo || sT >= 1 - 1e-6) return {x: 0, y: 0};
    const tx = side === 'right' ? 6 : Wb.x + (Wb.w - Wb.w * sT) / 2, ty = side === 'right' ? Wb.y + (Wb.h - Wb.h * sT) / 2 : 6;
    return {x: (tx - Wb.x * sT) / (1 - sT), y: (ty - Wb.y * sT) / (1 - sT)};
  };
  const FW = (ctx.view.width / Math.min(ctx.view.width, ctx.view.height)) * 1080 / px;
  const minSide = (0.36 * 1080) / px;
  const zMax = (p.detailGeometry && p.detailGeometry.zoom) || 2.2;
  // the crop never cuts a plaque: wholly in or out (the clerk is wholly inside it by construction)
  // (labels hidden, the crop has room to spare: a shelving block — its units, bases and open aisle — is wholly in or
  // out too)
  const plaques = [...G.blocks.map(B => M.box({x: B.plaque.x - 26, y: B.plaque.y - 26, w: 52, h: 52})), ...(A.geo ? G.blocks.map(B => M.box({x: B.span.x - 4, y: B.span.y - 4, w: B.span.w + 8, h: B.span.h + 40})) : [])];
  const cuts = c => plaques.some(b => overlaps(c, b, 0) && !(b.x >= c.x && b.y >= c.y && b.x + b.w <= c.x + c.w && b.y + b.h <= c.y + c.h));
  let pick = null;
  const why = {};
  const no = kk => { why[kk] = (why[kk] || 0) + 1; };
  // (the context steps back no further than its clerk's lens-time floor: 45 px)
  const sTs = [1, 0.97, 0.94, 0.9, 0.87, 0.84, 0.8, 0.78, 0.76, 0.74, 0.72, 0.7, 0.69, 0.68, 0.66, 0.64, 0.6, 0.56, 0.52, 0.48, 45.6 / personPx, (tFloor + 0.05) / (F * px)].filter(v => v <= 1).sort((a, b) => b - a);
  for (const sT of sTs) {
    if (personPx * sT < 45.5) break;
    // (the context's only text, the datum tag, is hidden while the lens holds its copy: the context may step back
    // below the tag's floor; the tag returns once the context is large enough again)
    const textsStay = F * px * sT >= tFloor - 1e-6;
    const ctxW = textsStay ? Wb.w * sT : planD.w * sT;
    if (ctxW / FW < 0.462) { no('ctxW'); continue; }
    for (const side of ['right', 'below']) {
      const anchor = anchorFor(sT, side);
      const Ws = {x: anchor.x + (Wb.x - anchor.x) * sT, y: anchor.y + (Wb.y - anchor.y) * sT, w: Wb.w * sT, h: Wb.h * sT};
      const R = side === 'right'
        ? {x: Ws.x + Ws.w + 28, y: 6, w: D.w - 6 - (Ws.x + Ws.w + 28), h: D.h - 12}
        : {x: 6, y: Ws.y + Ws.h + 16, w: D.w - 12, h: D.h - 4 - (Ws.y + Ws.h + 16)};
      if (R.w < minSide || R.h < minSide) { no(`R${side}`); continue; }
      let c = {...crop0};
      const z0 = Math.min(zMax, R.w / c.w, R.h / c.h);
      if (z0 < 1.55) { no(`z0${side}`); continue; }
      // the crop grows (more of the same plan) towards the free region's aspect, never cutting a plaque
      const inB = planD;
      const tw = Math.max(c.w, Math.min(R.w / z0, c.w * 3, inB.w));
      let th2 = Math.max(c.h, Math.min(R.h / z0, c.h * 3, inB.h + (stackBox ? stackBox.h + 30 : 0)));
      // (labels hidden: the crop grows only within the room's front zone — below the blocks, above the plan's edge —
      // so the lens shows the counter area, not blank paper or the cut end of a block)
      const vBand = A.geo ? {y0: Math.max(...G.blocks.map(B => M.box({x: B.span.x, y: B.span.y, w: B.span.w, h: B.span.h + 44})).map(b => b.y + b.h)), y1: planD.y + planD.h} : null;
      if (vBand) th2 = Math.max(c.h, Math.min(th2, vBand.y1 - vBand.y0));
      let bestG = null;
      for (const fx of [0.5, 0, 1, 0.25, 0.75]) for (const fy of [0.5, 1, 0, 0.75, 0.25]) {
        const gr = {x: c.x - (tw - c.w) * fx, y: c.y - (th2 - c.h) * fy, w: tw, h: th2};
        gr.x = clamp(gr.x, Math.min(inB.x, c.x), Math.max(inB.x + inB.w, c.x + c.w) - gr.w);
        if (vBand) gr.y = clamp(gr.y, Math.min(vBand.y0, c.y), Math.max(vBand.y1, c.y + c.h) - gr.h);
        if (cuts(gr)) continue;
        if (!(gr.x <= c.x + 0.5 && gr.y <= c.y + 0.5 && gr.x + gr.w >= c.x + c.w - 0.5 && gr.y + gr.h >= c.y + c.h - 0.5)) continue;
        bestG = gr; break;
      }
      if (bestG) c = bestG;
      const zoom = Math.min(zMax, R.w / c.w, R.h / c.h);
      if (zoom < 1.55) { no(`zoom${side}`); continue; }
      const lw = c.w * zoom, lh = c.h * zoom;
      if (Math.min(lw, lh) < minSide) { no(`min${side}`); continue; }
      const dest = side === 'right'
        ? {x: R.x + (R.w - lw) / 2, y: clamp(c.y + c.h / 2 - lh / 2, R.y, R.y + R.h - lh), w: lw, h: lh}
        : {x: clamp(Ws.x + Ws.w / 2 - lw / 2, R.x, R.x + R.w - lw), y: R.y + (R.h - lh) / 2, w: lw, h: lh};
      const cx0 = textsStay ? Ws.x : anchor.x + (planD.x - anchor.x) * sT;
      const span = (Math.max(cx0 + ctxW, dest.x + dest.w) - Math.min(cx0, dest.x)) / FW;
      if (span < 0.82) { no(`span${side}`); continue; }
      const sc2 = zoom + 1.2 * sT + (textsStay ? 0.5 : 0);
      const side2 = side === 'right' ? 'right' : dest.x + dest.w / 2 >= cx0 + ctxW / 2 ? 'below-r' : 'below-l';
      if (!pick || sc2 > pick.sc2 + 1e-6) pick = {sT, side: side2, dest, crop: c, zoom, span, sc2, anchor};
    }
  }
  if (!pick) { problems.push(`lens-fit:${Object.entries(why).map(([a, b]) => a + b).join('.')}`); pick = {sT: 1, side: 'right', dest: {x: D.w * 0.6, y: 8, w: D.w * 0.38, h: D.h * 0.4}, crop: crop0, zoom: 1, span: 0, anchor: {x: 0, y: 0}}; }
  const {sT, side, dest, crop, zoom, span, anchor} = pick;
  const lensOverPanel = Boolean(panel && panel.boxes.some(b => overlaps(b, dest, 0)));
  const stackInCrop = !stackBox || (stackBox.x >= crop.x && stackBox.y >= crop.y && stackBox.x + stackBox.w <= crop.x + crop.w && stackBox.y + stackBox.h <= crop.y + crop.h);
  if (!stackInCrop) problems.push('stack-crop');
  if (marker && markerClear) {
    // (the Δ marker only returns after the lens has closed; it may lie inside or outside the crop)
  }
  // guides from the source frame's corners to the lens (corner to corner when that crosses no text, else straight across)
  const wtS = q => ({x: anchor.x + (q.x - anchor.x) * sT, y: anchor.y + (q.y - anchor.y) * sT});
  const textsOpen = F * px * sT >= tFloor - 1e-6 ? allTexts.map(b => ({...wtS(b), w: b.w * sT, h: b.h * sT})) : [];
  const segClear = (a, b) => { for (let j = 1; j < 30; j++) { const q = {x: a.x + (b.x - a.x) * j / 30, y: a.y + (b.y - a.y) * j / 30}; if (textsOpen.some(o => q.x > o.x - 2 && q.x < o.x + o.w + 2 && q.y > o.y - 2 && q.y < o.y + o.h + 2)) return false; } return true; };
  const right = side === 'right';
  const cA = right ? [{x: crop.x + crop.w, y: crop.y}, {x: crop.x + crop.w, y: crop.y + crop.h}] : [{x: crop.x, y: crop.y + crop.h}, {x: crop.x + crop.w, y: crop.y + crop.h}];
  const corners = right ? [{x: dest.x, y: dest.y}, {x: dest.x, y: dest.y + dest.h}] : [{x: dest.x, y: dest.y}, {x: dest.x + dest.w, y: dest.y}];
  const facing = cA.map(a => { const w = wtS(a); return right ? {x: dest.x, y: clamp(w.y, dest.y + 12, dest.y + dest.h - 12)} : {x: clamp(w.x, dest.x + 12, dest.x + dest.w - 12), y: dest.y}; });
  const useB = [corners, facing].find(bs => cA.every((a, i) => segClear(wtS(a), bs[i])));
  const guides = useB ? cA.map((a0, i) => ({a0, a: a0, b: useB[i]})) : [];
  // ---- audit
  const all = [...allTexts, ...(panel ? panel.boxes : [])];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlaps(all[i], all[j], 2)) { problems.push('overlap'); i = all.length; break; }
  if (panel && panel.boxes.some(b => overlaps(b, planD, 2))) problems.push('panel-on-plan');
  const ext = unionBox([planD, ...allTexts, ...(panel ? panel.boxes : [])]);
  const fill = Math.min(ext.w / D.w, ext.h / D.h);
  if (showKey && fill < 0.78) problems.push('fill');
  // labels hidden: the plan alone fills the safe box (>= 0.9 of it on one axis, >= 0.72 on the other)
  const hf = [planD.w / D.w, planD.h / D.h];
  if (!showKey && (Math.max(...hf) < 0.9 || Math.min(...hf) < 0.72)) problems.push('hidden-fill');
  const art = archArt(ctx, G, {prefix: 's', fileBlock: null});
  const lzArt = archArt(ctx, G, {prefix: 'lz', fileBlock: null});
  const look = clerkLook(ctx, p);
  const clerk = planPerson(ctx, {name: 'clerk', look});
  const lzClerk = planPerson(ctx, {name: 'lz-clerk', look});
  // the side-step from the tray of the before value to the tray of the after value (facing the counter at both ends)
  const moveLeg = makeLeg(smooth([{x: tB.x, y: G.home.y}, {x: (tB.x + tA.x) / 2, y: G.home.y - 14}, {x: tA.x, y: G.home.y}], 10), 180, 180);
  const Lp = {dest, side, unrollDown: stackBox ? (stackBox.y + stackBox.h / 2 - crop.y) < crop.h / 2 : false, stackLensTop: stackBox ? dest.y + (stackBox.y - crop.y) * zoom : 0, stackLensBottom: stackBox ? dest.y + (stackBox.y + stackBox.h - crop.y) * zoom : 0, zoom, F, px, tFloor};
  let uIn = W.open[0] + 0.012, uOut = W.close[1] - 0.012;
  if (showKey) {
    for (let uu = 0.2; uu <= 0.45; uu += 0.0005) if (lzLegible(Lp, uu)) { uIn = uu; break; }
    for (let uu = 0.9; uu >= 0.55; uu -= 0.0005) if (lzLegible(Lp, uu)) { uOut = uu; break; }
  }
  return {
    uIn, uOut, showStack: Boolean(stack), stackLensTop: Lp.stackLensTop, stackLensBottom: Lp.stackLensBottom, unrollDown: Lp.unrollDown,
    F, px, k, M, G, art, lzArt, clerk, lzClerk, fileNode: fileProp(ctx, {name: 'file'}), lzFileNode: fileProp(ctx, {name: 'lz-file'}),
    stack, marker, markerClear, hasMarkerNote: Boolean(panel && showAll), bB, bA, openB, moveLeg,
    traysD, crop, dest, zoom, sT, side, span, guides, anchor, Wb, FW, tFloor, stackInCrop, lensOverPanel,
    panelNode: panel ? panel.node : null,
    // (labels hidden: a larger lens window counts too — the frame stays full while the lens is open)
    lensArea: A.geo ? dest.w * dest.h / (D.w * D.h) : 0,
    personPx, problems, fill, arrangement: `${A.key}/sT${r(sT, 2)}/z${r(zoom, 2)}/${side}`,
  };
}

/** The panel's items. */
function panelItems(ctx, p, F, showAll, showKey) {
  const items = [];
  if (showKey) {
    items.push(legendItem(ctx, {kind: 'active', text: p.courts.active, F, name: 'legend-active', weight: 700}));
    items.push(legendItem(ctx, {kind: 'archived', text: p.courts.archived, F, name: 'legend-archived', weight: 700}));
    items.push(legendItem(ctx, {kind: 'slip', text: p.file.identifier, F, name: 'legend-identifier', weight: 700}));
  }
  if (showAll) {
    items.push(legendItem2(ctx, {kind: 'room', title: p.courts.archive, text: p.courts.building, F, name: 'legend-room'}));
    items.push(legendItem(ctx, {kind: 'person', text: p.seats.clerk.name, F, name: 'legend-clerk', weight: 600, glyphOpts: {look: clerkLook(ctx, p)}}));
    items.push(legendItem(ctx, {kind: 'unit', text: p.routes.rails, F, name: 'legend-rails'}));
    items.push(legendItem(ctx, {kind: 'locator', text: p.routes.locator, F, name: 'legend-locator'}));
    items.push(legendItem(ctx, {kind: 'counter', text: p.seats.counter, F, name: 'legend-counter'}));
    // the order shown (the new value, then the file moves to its tray) is captioned as configured
    items.push(legendItem(ctx, {kind: 'sequence', text: p.labels.sequence, F, name: 'legend-sequence'}));
    items.push(captionItem(ctx, p.contextLabels.context, F, 'context-caption'));
    items.push(legendItem(ctx, {kind: 'marker', text: p.contextLabels.marker, F, name: 'marker-note', opacity: 0}));
  }
  if (showKey) items.push(keyItem(ctx, p.labels.key, F));
  return items;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-09-inspect',
    title: 'Court archive — inspecting the file\'s supplied state and substituting it',
    titleEs: 'Archivo judicial — Inspección y cambio de un dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Archivo judicial',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'In a generic, fictional archive room the located file lies in the ● tray of its supplied state. A lens enlarges the counter, the two trays, the clerk and the tag with the datum; the datum is substituted ("active" → "archived", the old value kept as "was"), and only the dependent geometry follows: the clerk moves the file to the ◆ tray. The lens closes onto the updated context with a neutral changed-datum marker. "Archived" is only another tray and shelf block here: no rule, time span or outcome.',
    tags: ['floor plan', 'inspect', 'lens', 'archive', 'case file', 'state', 'tray', 'datum', 'substitution', 'active', 'archived'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/archivo-judicial.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
