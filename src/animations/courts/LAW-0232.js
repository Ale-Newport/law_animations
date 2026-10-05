/**
 * LAW-0232 — Deliberación separada · inspect
 *
 * Storyboard (the context is the state produced by the story: inside the
 * generic building the public space — the hearing room, ● — stands apart from
 * the abstract deliberation zone, ◆, a separation between them; its seated
 * participants carry letter badges. A tag hangs from the partition that closes
 * the zone: the SUPPLIED datum "Partition: hinged door (fictional)". A panel
 * holds the legend, the single context caption and the key):
 *  0.00–0.20  build: the context in full; a solid ring settles on the
 *             separation and the context caption appears.
 *  0.20–0.45  isolate: a frame settles on the detail that tells audiencia (●)
 *             from deliberación (◆) — the partition, its closure and the tag.
 *             The panel steps aside; the context steps back a little at most
 *             (it keeps >= 45 % of the frame width; its own texts hide while
 *             they would be under their floor) and dims in place; a lens opens
 *             beside it — growing from its far edge, opaque within ~100 ms —
 *             over the space the panel left, never over the context: a REAL
 *             enlarged copy (>= 1.5x the context at rest) of the same plan
 *             coordinates, tied to the frame by two solid guides. The tag is
 *             shown in ONE place at a time: its context copy leaves just
 *             before the lens copy appears and returns only after it has gone.
 *  0.45–0.75  substitute ONE datum in the lens: the old value is struck
 *             through and docks below as "was: …"; the new value appears and
 *             stays still; then only the dependent geometry follows — the old
 *             closure leaves the doorway (a door swings open and fades; a
 *             screen slides into its pockets) and the closure the new value
 *             names arrives (a screen slides shut; a door swings shut; an open
 *             doorway draws nothing). Nobody moves.
 *  0.72–1.00  return: the lens closes while the context returns to full size and
 *             strength with the new closure, the struck old value and a
 *             neutral changed-datum marker (Δ); a panel note repeats it.
 *             Seeking back restores the old datum exactly. Nothing about
 *             secrecy, attendance, votes or outcomes is shown or inferred.
 * @module animations/courts/LAW-0232
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  delibFields, DELIB_EN, DELIB_STRINGS, delibGeometry, delibArt, partitionClosure, seatedPose, planScene, legendItem, keyItem,
  layoutPanel, overlaps, unionBox, pxPerUnit, LETTERS, searchLayout, textAt, fitG, placeNear, captionItem, participantLooks, planPerson,
} from './kits/deliberacion-separada.js';

const ID = 'LAW-0232';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  ring: [0.04, 0.12], frame: [0.2, 0.24], panelOut: [0.2, 0.235], shrink: [0.21, 0.265], open: [0.24, 0.3],
  strike: [0.46, 0.5], dock: [0.51, 0.55], newIn: [0.555, 0.585], leave: [0.6, 0.64], arrive: [0.635, 0.68],
  close: [0.72, 0.77], grow: [0.72, 0.765], panelIn: [0.765, 0.795], marker: [0.855, 0.89],
};
const KINDS = ['door', 'screen', 'open'];

const STRINGS = {
  en: {...DELIB_STRINGS.en, was: 'was'},
  es: {...DELIB_STRINGS.es, was: 'antes'},
};

const sceneSchema = {
  ...delibFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the partition between the public space and the zone (its supplied datum and the closure it draws)', ['partition']),
  beforeValue: str('The partition datum as supplied before the substitution', 60),
  afterValue: str('The alternative supplied datum', 60),
  detailGeometry: obj('Lens and the geometry each value draws', {
    zoom: num('Largest magnification of the lens, against the context at rest', 1.5, 4),
    before: oneOf('What the before value draws in the doorway', KINDS),
    after: oneOf('What the after value draws in the doorway', KINDS),
  }),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial note)', 90), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  ...DELIB_EN,
  focusTarget: 'partition',
  beforeValue: 'Partition: hinged door (fictional)',
  afterValue: 'Partition: sliding screen (fictional)',
  detailGeometry: {zoom: 2.4, before: 'door', after: 'screen'},
  contextLabels: {context: 'The public space after it moved apart from the zone, as configured', marker: 'Changed: one supplied datum on the partition'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const rh of [420, 380]) {
        for (const pf of [0.27, 0.3, 0.34]) arrs.push({rot: false, panel: 'column', pf, rh});
        for (const pf of [0.36, 0.4]) arrs.push({rot: false, panel: 'column', pf, cols: 2, rh});
      }
    } else if (shape === 'square') {
      for (const pf of [0.36, 0.4, 0.44]) arrs.push({rot: false, panel: 'band', pf, cols: 3, bname: 'panel', rh: 330});
      for (const pf of [0.44, 0.48, 0.52, 0.54, 0.56]) for (const rh of [330, 290]) arrs.push({rot: false, panel: 'band', pf, cols: 3, bname: 'panel', chips: false, rh});
      // labels hidden: deeper rooms, a slimmer margin (the plan alone fills the box)
      // (set a little above centre so the stepped-back plan leaves the lens its full height below)
      if (!ctx.show('key')) for (const rh of [460, 420, 380]) for (const ay of [0.3, 0.2]) arrs.push({rot: false, panel: 'band', pf: 0.4, cols: 3, rh, m: 26, ay});
    } else {
      for (const rh of [420, 360]) for (const pf of [0.28, 0.32, 0.36, 0.4, 0.44]) for (const cw of [0.3, 0.36]) arrs.push({rot: true, panel: 'band', pf, cols: 2, cw, rh});
      // labels hidden (no chips, no panel: the turned plan alone is too narrow to keep 45 % of the width while a lens
      // opens below it): the plan across the top and the lens below it
      if (!ctx.show('key')) for (const rh of [860, 760, 640, 520, 420]) arrs.push({rot: false, panel: 'band', pf: 0.4, cols: 2, rh, m: 40});
    }
    for (const A of arrs) A.key = `${A.panel}/${A.pf}/${A.cols || ''}/${A.cw || ''}/${A.rh}${A.chips === false ? '/L' : ''}`;
    // a larger lens magnification (against the context at rest) and a larger context both count
    return searchLayout((v, A) => compose(ctx, p, v / px, px, A), arrs, L => L.k + 0.25 * (L.zoom || 0) + 0.5 * (L.sT || 0) + 1.5 * (L.planShare || 0));
  },
  build(ctx, L) {
    const th = ctx.theme;
    const world = g({name: 'world'},
      g({name: 'plan', transform: L.M.transform},
        L.art.node, L.cb.node, L.ca.node,
        L.people.map(pp => pp.node)),
      g({name: 'build-ring', opacity: 0}, h('rect', {x: r(L.gapD.x - 8), y: r(L.gapD.y - 8), width: r(L.gapD.w + 16), height: r(L.gapD.h + 16), rx: 14, fill: 'none', stroke: th.accent3, 'stroke-width': 5})),
      g({name: 'world-text'}, L.badgeNodes, L.zoneChipNode, L.buildingChipNode, L.hearingChipNode),
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
            g({transform: L.M.transform}, L.lzArt.node, L.lzCb.node, L.lzCa.node, L.lzPeople.map(pp => pp.node)),
            L.showStack ? L.stack.node('lz') : null)),
        h('rect', {name: 'lens-rim', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const G = L.G;
    // the context steps back (at most to sT) and dims in place while the lens is open
    const st = lensState(L, u);
    const sc = st.sc;
    const off = {x: L.anchor.x * (1 - sc), y: L.anchor.y * (1 - sc)};
    nodes.world = {transform: `${T(r(off.x, 2), r(off.y, 2))} scale(${r(sc, 4)})`};
    const open = st.open;
    const dim = 1 - 0.42 * open;
    // the context's own texts show only while they are >= their floor
    const textOp = L.F * L.px * sc >= L.tFloor - 1e-6 ? 1 : 0;
    nodes.plan = {transform: L.M.transform, opacity: r(dim, 3)};
    nodes['world-text'] = {opacity: r(textOp * dim, 3)};
    // the plan: the public space apart, the participants seated (context and lens copy)
    Object.assign(nodes, L.art.frame(G.gap, 0, 1, 1), L.lzArt.frame(G.gap, 0, 1, 1));
    L.people.forEach((pp, i) => Object.assign(nodes, seatedPose(pp, G.seatPts[i], G.gap), seatedPose(L.lzPeople[i], G.seatPts[i], G.gap)));
    if (L.hearingChipNode) nodes['hearing-chip'] = {transform: T(r(L.dEnd.x, 2), r(L.dEnd.y, 2))};
    L.badgeAt.forEach((b, i) => { nodes[`badge${i}`] = {transform: T(r(b.x + L.dEnd.x, 2), r(b.y + L.dEnd.y, 2))}; });
    // the dependent geometry: the old closure leaves, the new one arrives (context and lens alike)
    const leave = L.changesGeo ? seg(u, ...W.leave) : 0;
    const arrive = L.changesGeo ? seg(u, ...W.arrive) : 0;
    for (const [cb, ca] of [[L.cb, L.ca], [L.lzCb, L.lzCa]]) {
      Object.assign(nodes, cb.frame(ease.inOutCubic(clamp(leave * 1.4))), ca.frame(1 - ease.inOutCubic(arrive)));
      nodes[cb.name] = {opacity: r(1 - seg(leave, 0.75, 1), 3)};
      nodes[ca.name] = {opacity: r(L.changesGeo ? seg(arrive, 0, 0.12) : 0, 3)};
    }
    // build: the ring on the separation
    nodes['build-ring'] = {opacity: r(seg(u, ...W.ring) * (1 - seg(u, W.frame[0] - 0.03, W.frame[0])), 3)};
    // the source frame leaves with the lens
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    // the lens: its window (clipped to the space the context leaves), opaque almost at once
    const below = L.side !== 'right';
    const win = st.win, ls = st.ls, lensOp = st.lensOp;
    const lc = anchorOf(L.dest, L.side);
    const rect = below ? win : {x: win.x, y: win.y, w: win.w, h: win.h};
    nodes.lens = {opacity: r(lensOp, 3), transform: below ? scaleAbout(lc.x, lc.y, 1) : scaleAbout(lc.x, lc.y, r(ls, 4))};
    for (const [nm, dy] of [['lens-clip-rect', 0], ['lens-bg', 0], ['lens-rim', 0], ['lens-shadow', 10]]) nodes[nm] = below ? {y: r(win.y + dy, 2), height: r(win.h, 2)} : {y: r(L.dest.y + dy, 2), height: r(L.dest.h, 2)};
    // guides: from the source frame (where the world puts it now) to the lens window
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    L.guides.forEach((gd, i) => {
      const a = wt(gd.a0);
      const b = below ? {x: gd.b.x, y: win.y} : {x: lc.x + (gd.b.x - lc.x) * ls, y: lc.y + (gd.b.y - lc.y) * ls};
      nodes[`guide${i}`] = {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: r(Math.min(fr, open > 0.05 && lensOp > 0.9 ? 1 : 0), 3)};
    });
    // one copy of the datum at a time: the context tag leaves before the lens appears and returns after it has gone
    const cxOp = u < 0.5 ? 1 - seg(u, L.uIn - 0.011, L.uIn - 0.001) : seg(u, L.uOut + 0.001, L.uOut + 0.011);
    // (and it is shown only while its text is >= the floor at the context's current scale)
    nodes['cx-wrap'] = {opacity: r(textOp ? cxOp : 0, 3)};
    // the lens copy's texts show only once they are >= the floor (the lens grows from 0.6 of its size)
    // (below: the copy shows once the unrolling window holds the whole field — never cut by the rim)
    if (L.showStack) nodes['lz-stack'] = {opacity: lzLegible(L, u) ? 1 : 0};
    // the substitution (both copies are driven alike; only one is visible)
    if (L.showStack) Object.assign(nodes, L.stack.frame(u, 'cx'), L.stack.frame(u, 'lz'));
    const mk = seg(u, ...W.marker);
    if (L.marker) nodes['cx-marker'] = {opacity: r(mk, 3)};
    if (L.hasMarkerNote) nodes['marker-note'] = {opacity: r(mk, 3)};
    // the panel steps aside before the lens opens over its place and returns after it has closed (never a cross-fade)
    if (L.panelNode) nodes.panel = {opacity: r(L.lensOverPanel ? (u < 0.5 ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn)) : 1, 3)};
    const newIn = seg(u, ...W.newIn);
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const Ws = st.Ws;
    const headsNow = L.heads.map(b => ({x: off.x + b.x * sc, y: off.y + b.y * sc, w: b.w * sc, h: b.h * sc}));
    const closureNow = arrive > 0 ? L.kindAfter : L.kindBefore;
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
        strike: r(seg(u, ...W.strike), 3),
        oldDocked: r(seg(u, ...W.dock), 3),
        newShown: r(newIn, 3),
        focusTarget: ctx.params.focusTarget,
        closure: closureNow,
        closureBefore: L.kindBefore,
        closureAfter: L.kindAfter,
        leave: r(leave, 3),
        arrive: r(arrive, 3),
        zoom: r(L.zoom / L.sT, 2),
        zoomVsRest: r(L.zoom, 2),
        lensMinSidePx: r(Math.min(L.dest.w, L.dest.h) * L.px, 1),
        datumInLens: L.stackInCrop && lensOp >= 0.99,
        lensClearOfContext: lensOp === 0 || !overlaps(rect, Ws, 0),
        lensClearOfPeople: lensOp === 0 || headsNow.every(b => !overlaps(rect, b, 0)),
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
 * The world's scale and the lens window at u. The context steps back (0.21–0.265) and regrows (0.72–0.765) in step
 * with the lens: the window is always clipped to the space the context leaves (never over it), so the return is
 * sequenced with no lone-thumbnail frame. right: the lens scales about its far (right) edge; below: its window unrolls
 * over a copy at full magnification, from the edge nearer the datum field.
 */
function lensState(L, u) {
  const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
  const sc = lerp(1, L.sT, sh);
  const Ws = {x: L.Wb.x * sc, y: L.Wb.y * sc, w: L.Wb.w * sc, h: L.Wb.h * sc};
  const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
  const d = L.dest;
  let win, ls, frac;
  if (L.side === 'right') {
    const avail = (d.x + d.w) - (Ws.x + Ws.w + 12);
    ls = Math.max(0, Math.min(0.6 + 0.4 * open, avail / d.w));
    win = {x: d.x + d.w * (1 - ls), y: d.y + d.h * (1 - ls) / 2, w: d.w * ls, h: d.h * ls};
    frac = ls;
  } else {
    const hf = 0.8 + 0.2 * open;
    const top = Math.max(d.y, Ws.y + Ws.h + 12);
    let y0 = L.unrollDown ? d.y : d.y + d.h * (1 - hf), y1 = L.unrollDown ? d.y + d.h * hf : d.y + d.h;
    y0 = Math.max(y0, top);
    win = {x: d.x, y: y0, w: d.w, h: Math.max(0, y1 - y0)};
    ls = hf;
    frac = win.h / d.h;
  }
  const base = u < 0.5 ? seg(u, W.open[0], W.open[0] + 0.012) : 1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012);
  // (a window squeezed under 40 % of its size fades out at once: never a thin sliver)
  const lensOp = base * seg(frac, 0.3, 0.4);
  return {sc, Ws, open, win, ls, lensOp};
}

/** Is the lens copy of the datum legible at u (window opaque and the whole field inside it, at >= the floor)? */
function lzLegible(L, u) {
  const st = lensState(L, u);
  if (st.lensOp < 0.15) return false;
  if (L.side === 'right') return L.F * L.px * L.zoom * st.ls >= L.tFloor + 0.2;
  return st.win.y <= L.stackLensTop - 2 && st.win.y + st.win.h >= L.stackLensBottom + 2;
}

/**
 * The lens's far point (away from the context), which stays put while it grows: right → the middle of its right
 * edge; below → its bottom corner on the side away from the context (so context + lens keep their span).
 */
function anchorOf(dest, side) {
  if (side === 'below-r') return {x: dest.x + dest.w, y: dest.y + dest.h};
  if (side === 'below-l') return {x: dest.x, y: dest.y + dest.h};
  return {x: dest.x + dest.w, y: dest.y + dest.h / 2};
}

/**
 * The datum stack: the value chip (old / new in the same slot, never cross-faded: the old one is struck, then docks
 * below beside "was"; the new one appears in the freed slot) and a lead to the partition.
 */
function datumStack(ctx, p, F, maxW) {
  const th = ctx.theme;
  const pad = F * 0.5;
  const mk = text => fitG(text, {maxWidth: maxW - 2 * pad, size: F, minSize: F, maxLines: 3, weight: 650});
  const fOld = mk(p.beforeValue), fNew = mk(p.afterValue);
  const wasFit = fitG(ctx.t.was, {maxWidth: maxW, size: F, minSize: F, maxLines: 1, weight: 500});
  const cw = fit => fit.width + 2 * pad, chh = fit => fit.height + pad * 1.2;
  const slotH = Math.max(chh(fOld), chh(fNew));
  const gap = F * 0.45;
  const wasH = wasFit.height + F * 0.15;
  const w = Math.max(cw(fOld), cw(fNew), wasFit.width);
  const hh = slotH + gap + wasH + chh(fOld);
  const truncated = fOld.truncated || fNew.truncated || wasFit.truncated;
  let at = {x: 0, y: 0};
  const chip = (P, nm, fit, x, y, stroke, fill, o = {}) => g({name: `${P}-${nm}`, opacity: o.opacity, transform: o.transform},
    h('path', {d: roundRectPath(x, y, cw(fit), chh(fit), Math.min(chh(fit) / 2, F * 0.55)), fill, stroke, 'stroke-width': 2.6}),
    textAt(fit, x + pad, y + pad * 0.6, th.ink, {name: `${P}-${nm}-text`}),
    o.strike ? h('path', {name: `${P}-strike`, d: fit.lines.map((_, i) => `M${r(x + pad - 3)} ${r(y + pad * 0.6 + fit.lineHeight * i + fit.size * 0.52)}h${r(fit.width + 6)}`).join(''), stroke: th.ink, 'stroke-width': 2.6, 'stroke-dasharray': `${r(fit.width + 8)} ${r(fit.width + 8)}`, 'stroke-dashoffset': r(fit.width + 8), fill: 'none'}) : null);
  const node = P => {
    const {x, y} = at;
    return g({name: `${P}-stack`},
      h('path', {name: `${P}-lead`, d: `M${r(lead.a.x)} ${r(lead.a.y)}L${r(lead.b.x)} ${r(lead.b.y)}`, stroke: th.accent2, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(lead.b.x), cy: r(lead.b.y), r: 4.5, fill: th.accent2}),
      g({name: `${P}-was`, opacity: 0}, textAt(wasFit, x + pad * 0.4, y + slotH + gap, th.fgSoft, {italic: true})),
      chip(P, 'old', fOld, x, y, th.accent2, th.card, {strike: true}),
      chip(P, 'new', fNew, x, y, th.accent2, th.card, {opacity: 0}),
    );
  };
  let lead = {a: {x: 0, y: 0}, b: {x: 0, y: 0}};
  const frame = (u, P) => {
    const st = seg(u, ...W.strike), dk = ease.inOutCubic(seg(u, ...W.dock)), ni = seg(u, ...W.newIn);
    const dx = 0, dy = (slotH + gap + wasH) * dk;
    const fw = fOld.width + 8;
    return {
      [`${P}-strike`]: {'stroke-dashoffset': r(fw * (1 - st))},
      [`${P}-old`]: {transform: T(r(dx, 2), r(dy, 2)), opacity: r(1 - 0.35 * dk, 3)},
      [`${P}-was`]: {opacity: r(seg(u, W.dock[1] - 0.01, W.dock[1] + 0.01), 3)},
      [`${P}-new`]: {opacity: r(ni, 3)},
    };
  };
  return {
    w, h: hh, slotH, truncated,
    place(x, y, leadTo) {
      at = {x, y};
      const cy = y + slotH / 2;
      const ax = leadTo.x < x ? x : leadTo.x > x + w ? x + w : x + w / 2;
      lead = {a: {x: ax, y: leadTo.y < y ? y : leadTo.y > y + hh ? y + slotH : cy}, b: leadTo};
    },
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
  const G = delibGeometry({n: p.seats.participants.length, rh: A.rh, margin: A.m});
  const move = G.gap;
  const rot = A.rot;
  const tFloor = F * px >= 19.5 ? 19.5 : 16;
  // ---- panel
  const items = panelItems(ctx, p, F, showAll, showKey, A.bname === 'panel', A.chips === false);
  let region = {x: 0, y: 0, w: D.w, h: D.h};
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
      // (the band keeps its share of the height: the lens opens over it later)
      const used = panelBox.h;
      panelBox = {x: 0, y: D.h - used, w: D.w, h: used};
      region = {x: 0, y: 0, w: D.w, h: D.h - used - 26};
      panel.place(panelBox);
    }
    if (panel.problem) problems.push(panel.problem);
  }
  // ---- the plan (public space apart), chips, participants, badges
  const S = planScene(ctx, p, F, px, {G, region, rot, cw: A.cw, bname: A.bname, moveEnd: move, chips: A.chips !== false, align: {x: 0.5, y: A.ay ?? 0.5}});
  problems.push(...S.problems);
  const {M, k, bOuter, zoneD, people, badgeAt, badgeNodes, hearingChipNode, zoneChipNode, buildingChipNode} = S;
  const dEnd = S.dEnd;
  const personPx = S.personPx;
  if (personPx < 60.5) problems.push('small');
  // world texts at their (static) final places
  const texts = [...S.texts.map(b => (S.hb && b === S.hb ? {...b, x: b.x + dEnd.x, y: b.y + dEnd.y} : b))];
  const badgeBoxes = badgeAt.map(b => ({x: b.x + dEnd.x - S.R, y: b.y + dEnd.y - S.R, w: 2 * S.R, h: 2 * S.R}));
  const rad = 44 * k;
  const heads = G.seatPts.map(q => { const d = M.toD({x: q.x - move, y: q.y}); return {x: d.x - rad, y: d.y - rad, w: 2 * rad, h: 2 * rad}; });
  // ---- the closures the two values draw
  const kindBefore = (p.detailGeometry && p.detailGeometry.before) || 'door';
  const kindAfter = (p.detailGeometry && p.detailGeometry.after) || 'screen';
  const mkC = (P, nm, kind) => { const c = partitionClosure(ctx, G, {name: `${P}-${nm}`, kind}); return {...c, name: `${P}-${nm}`, node: g({name: `${P}-${nm}-wrap`}, c.node), frame: kk => ({...c.frame(kk)})}; };
  // opacity lives on the closure group itself (named `${P}-${nm}`)
  const cb = mkC('s', 'cb', kindBefore), ca = mkC('s', 'ca', kindAfter), lzCb = mkC('lz', 'cb', kindBefore), lzCa = mkC('lz', 'ca', kindAfter);
  // ---- the datum stack in the zone, beside the doorway (clear of the door's swing and of ◆)
  const doorD = M.box({x: G.zone.x - G.t, y: G.door.y0, w: G.t, h: G.door.y1 - G.door.y0});
  const swingD = M.box({x: G.zone.x, y: G.door.y0, w: G.door.y1 - G.door.y0 + 10, h: G.door.y1 - G.door.y0 + 10});
  const zin = M.box({x: G.zone.x + 12, y: 12, w: G.rw - 24, h: G.rh - 24});
  const zmarkD = M.box({x: G.marks.zone.x - 34, y: G.marks.zone.y - 34, w: 68, h: 68});
  const stack = datumStack(ctx, p, F, Math.min(zin.w - 16, 380));
  if (stack.truncated) problems.push('stack-trunc');
  const sb = placeNear(doorD, stack.w, stack.h, {order: rot ? ['right', 'left', 'above'] : ['right', 'below', 'above'], bounds: zin, hard: [zmarkD], gaps: [10, 16, 24, 36, 52, 70, 96]});
  const leadTo = {x: doorD.x + doorD.w / 2, y: doorD.y + doorD.h / 2};
  if (!sb) { problems.push('stack-place'); stack.place(zin.x, zin.y, leadTo); } else stack.place(sb.x, sb.y, leadTo);
  const stackBox = stack.box;
  // ---- the Δ marker beside the stack (in the zone, clear of texts, ◆ and heads)
  const mR = F * 0.95;
  const mCands = [{x: stackBox.x + stackBox.w + mR + 8, y: stackBox.y + stack.slotH / 2}, {x: stackBox.x - mR - 8, y: stackBox.y + stack.slotH / 2}, {x: stackBox.x + stackBox.w - mR, y: stackBox.y - mR - 8}, {x: stackBox.x + stackBox.w - mR, y: stackBox.y + stackBox.h + mR + 8}];
  const mPos = mCands.find(q => { const b = {x: q.x - mR, y: q.y - mR, w: 2 * mR, h: 2 * mR}; return b.x >= zin.x && b.y >= zin.y && b.x + b.w <= zin.x + zin.w && b.y + b.h <= zin.y + zin.h && !overlaps(b, zmarkD, 2) && !overlaps(b, stackBox, 2); });
  const markerClear = Boolean(mPos);
  if (!mPos) problems.push('marker');
  // (the Δ marker is a glyph, not text: it shows with the labels hidden too)
  // (the Δ marker marks the changed datum: it is drawn only with the datum, i.e. with the labels shown)
  const marker = mPos && showKey ? g({name: 'cx-marker', opacity: 0}, changedMarker(ctx, {x: mPos.x, y: mPos.y, radius: mR})) : null;
  // ---- the crop: the doorway (with a strip of the separation) and the whole stack
  const doorRegion = M.box({x: G.zone.x - G.t - 44, y: G.door.y0 - 30, w: G.t + 44 + 30, h: G.door.y1 - G.door.y0 + 60});
  const base = showKey ? unionBox([doorRegion, stackBox]) : doorRegion;
  const padC = 10;
  let crop0 = {x: base.x - padC, y: base.y - padC, w: base.w + 2 * padC, h: base.h + 2 * padC};
  if (overlaps(crop0, zmarkD, 0)) crop0 = unionBox([crop0, {x: zmarkD.x - 6, y: zmarkD.y - 6, w: zmarkD.w + 12, h: zmarkD.h + 12}]);
  // the crop never cuts a text, a badge, a person or ◆: each is wholly in or out
  const whole = [...badgeBoxes, ...heads, ...texts, zmarkD];
  const cuts = c => whole.some(b => overlaps(c, b, 0) && !(b.x >= c.x && b.y >= c.y && b.x + b.w <= c.x + c.w && b.y + b.h <= c.y + c.h));
  if (cuts(crop0)) problems.push('crop-cut');
  // ---- the world at rest and its anchor (it steps back towards its top-left corner)
  const allTexts = [...texts, ...(showKey ? [stackBox] : []), ...badgeBoxes];
  const Wb = unionBox([bOuter, ...allTexts]);
  // (it steps back towards the design's top-left corner: the freed space opens at the right and at the bottom)
  const anchor = {x: 0, y: 0};
  const FW = (ctx.view.width / Math.min(ctx.view.width, ctx.view.height)) * 1080 / px;
  const minSide = (0.355 * 1080) / px;
  const zMax = (p.detailGeometry && p.detailGeometry.zoom) || 2.4;
  let pick = null;
  // the context steps back no further than its people's floor (45 px) and keeps >= 45 % of the frame width — measured
  // on what stays visible: its texts hide below their floor, and then only the plan counts
  const sTs = [1, 0.97, 0.94, 0.9, 0.87, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6, 0.59, 0.56, 0.52, 0.48, 0.45, (tFloor + 0.05) / (F * px)].filter(v => v <= 1).sort((a, b) => b - a);
  for (const sT of sTs) {
    if (personPx * sT < 46) break;
    const Ws = {x: anchor.x + (Wb.x - anchor.x) * sT, y: anchor.y + (Wb.y - anchor.y) * sT, w: Wb.w * sT, h: Wb.h * sT};
    const textsStay = F * px * sT >= tFloor - 1e-6;
    // with labels shown the context never steps back below its texts' floor (its datum returns at once after the lens)
    if (showKey && !textsStay) continue;
    const ctxW = textsStay ? Ws.w : bOuter.w * sT;
    if (ctxW / FW < 0.47) continue;
    for (const side of ['right', 'below']) {
      const R = side === 'right'
        ? {x: Ws.x + Ws.w + 28, y: 6, w: D.w - 6 - (Ws.x + Ws.w + 28), h: D.h - 12}
        : {x: 6, y: Ws.y + Ws.h + 16, w: D.w - 12, h: D.h - 4 - (Ws.y + Ws.h + 16)};
      if (R.w < minSide || R.h < minSide) continue;
      // the lens is sized to the crop: grow the crop (more of the same plan) towards the free region's aspect
      let c = {...crop0};
      const z0 = Math.min(zMax, R.w / c.w, R.h / c.h);
      if (z0 < 1.55) continue;
      // the lens is sized to the crop: the crop grows (more of the same plan, up to 4x per side) towards the free
      // region's aspect; it may grow off-centre, but it never cuts a text, a badge or a person
      const inB = bOuter;
      const tw = Math.max(c.w, Math.min(R.w / z0, c.w * 4, inB.w)), th2 = Math.max(c.h, Math.min(R.h / z0, c.h * 4, inB.h));
      let bestG = null;
      for (const fx of [0.5, 0, 1, 0.25, 0.75]) for (const fy of [0.5, 0, 1, 0.25, 0.75]) {
        const gr = {x: c.x - (tw - c.w) * fx, y: c.y - (th2 - c.h) * fy, w: tw, h: th2};
        gr.x = clamp(gr.x, inB.x, inB.x + inB.w - gr.w); gr.y = clamp(gr.y, inB.y, inB.y + inB.h - gr.h);
        // ◆ is taken in whole when the grown crop reaches it
        if (overlaps(gr, zmarkD, 0)) Object.assign(gr, unionBox([gr, {x: zmarkD.x - 6, y: zmarkD.y - 6, w: zmarkD.w + 12, h: zmarkD.h + 12}]));
        if (gr.w > inB.w || gr.h > inB.h || cuts(gr)) continue;
        if (!(gr.x <= c.x + 0.5 && gr.y <= c.y + 0.5 && gr.x + gr.w >= c.x + c.w - 0.5 && gr.y + gr.h >= c.y + c.h - 0.5)) continue;
        bestG = gr; break;
      }
      if (bestG) c = bestG;
      const zoom = Math.min(zMax, R.w / c.w, R.h / c.h);
      if (zoom < 1.55) continue;
      const lw = c.w * zoom, lh = c.h * zoom;
      if (Math.min(lw, lh) < minSide) continue;
      const dest = side === 'right'
        ? {x: R.x + (R.w - lw) / 2, y: clamp(c.y + c.h / 2 - lh / 2, R.y, R.y + R.h - lh), w: lw, h: lh}
        : {x: clamp(Ws.x + Ws.w / 2 - lw / 2, R.x, R.x + R.w - lw), y: R.y + (R.h - lh) / 2, w: lw, h: lh};
      const cx0 = textsStay ? Ws.x : anchor.x + (bOuter.x - anchor.x) * sT;
      const span = (Math.max(cx0 + ctxW, dest.x + dest.w) - Math.min(cx0, dest.x)) / FW;
      if (span < 0.82) continue;
      const sc2 = zoom + 1.2 * sT + (textsStay ? 0.5 : 0);
      const side2 = side === 'right' ? 'right' : dest.x + dest.w / 2 >= cx0 + ctxW / 2 ? 'below-r' : 'below-l';
      if (!pick || sc2 > pick.sc2 + 1e-6) pick = {sT, side: side2, dest, crop: c, zoom, span, sc2};
    }
  }
  if (!pick) { problems.push('lens-fit'); pick = {sT: 1, side: 'right', dest: {x: D.w * 0.6, y: 8, w: D.w * 0.38, h: D.h * 0.4}, crop: crop0, zoom: 1, span: 0}; }
  const {sT, side, dest, crop, zoom, span} = pick;
  const lensOverPanel = Boolean(panel && panel.boxes.some(b => overlaps(b, dest, 0)));
  const stackInCrop = !showKey || stackBox.x >= crop.x && stackBox.y >= crop.y && stackBox.x + stackBox.w <= crop.x + crop.w && stackBox.y + stackBox.h <= crop.y + crop.h;
  if (!stackInCrop) problems.push('stack-crop');
  // guides from the source frame's corners to the lens: corner to corner when that crosses no text (the texts that
  // stay visible at the stepped-back scale), else straight across to the facing lens edge
  const wtS = q => ({x: anchor.x + (q.x - anchor.x) * sT, y: anchor.y + (q.y - anchor.y) * sT});
  const textsOpen = F * px * sT >= tFloor - 1e-6 ? allTexts.filter(b => b !== stackBox).map(b => ({...wtS(b), w: b.w * sT, h: b.h * sT})) : [];
  const segClear = (a, b) => { for (let j = 1; j < 30; j++) { const q = {x: a.x + (b.x - a.x) * j / 30, y: a.y + (b.y - a.y) * j / 30}; if (textsOpen.some(o => q.x > o.x - 2 && q.x < o.x + o.w + 2 && q.y > o.y - 2 && q.y < o.y + o.h + 2)) return false; } return true; };
  const right = side === 'right';
  const cA = right ? [{x: crop.x + crop.w, y: crop.y}, {x: crop.x + crop.w, y: crop.y + crop.h}] : [{x: crop.x, y: crop.y + crop.h}, {x: crop.x + crop.w, y: crop.y + crop.h}];
  const corners = right ? [{x: dest.x, y: dest.y}, {x: dest.x, y: dest.y + dest.h}] : [{x: dest.x, y: dest.y}, {x: dest.x + dest.w, y: dest.y}];
  const facing = cA.map(a => { const w = wtS(a); return right ? {x: dest.x, y: clamp(w.y, dest.y + 12, dest.y + dest.h - 12)} : {x: clamp(w.x, dest.x + 12, dest.x + dest.w - 12), y: dest.y}; });
  const pairs = [corners, facing];
  // (when both would cross a text, no guides are drawn: the source frame and the lens still correspond)
  const useB = pairs.find(bs => cA.every((a, i) => segClear(wtS(a), bs[i])));
  const guides = useB ? cA.map((a0, i) => ({a0, b: useB[i]})) : [];
  guides.forEach(gd => { gd.a = gd.a0; });
  // ---- audit
  const all = [...allTexts, ...(panel ? panel.boxes : [])];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlaps(all[i], all[j], 2)) { problems.push('overlap'); i = all.length; break; }
  if (panel && panel.boxes.some(b => overlaps(b, bOuter, 2))) problems.push('panel-on-plan');
  if (showKey) {
    const ext = unionBox([bOuter, ...allTexts, ...(panel ? panel.boxes : [])]);
    if (Math.min(ext.w / D.w, ext.h / D.h) < 0.78) problems.push('fill');
  }
  const art = delibArt(ctx, G, {prefix: 's', closure: null, rails: true});
  // (the lens copy keeps a ● / ◆ marker only when the crop holds it whole)
  const inCrop = b => b.x >= crop.x && b.y >= crop.y && b.x + b.w <= crop.x + crop.w && b.y + b.h <= crop.y + crop.h;
  const pmarkD = M.box({x: G.marks.pub.x - G.gap - 26, y: G.marks.pub.y - 26, w: 52, h: 52});
  const lzArt = delibArt(ctx, G, {prefix: 'lz', closure: null, rails: true, marks: {pub: inCrop(pmarkD), zone: inCrop(zmarkD)}});
  const lzPeople = participantLooks(ctx, p).map((lk, i) => planPerson(ctx, {name: `lz-p${i}`, look: lk}));
  // the moments the lens copy of the datum becomes legible and stops being so (the context copy hands over there)
  const Lp = {dest, side, sT, Wb, unrollDown: (stackBox.y + stackBox.h / 2 - crop.y) < crop.h / 2, stackLensTop: dest.y + (stackBox.y - crop.y) * zoom, stackLensBottom: dest.y + (stackBox.y + stackBox.h - crop.y) * zoom, zoom, F, px, tFloor};
  let uIn = W.open[0] + 0.012, uOut = W.close[1] - 0.012;
  if (showKey) {
    for (let uu = 0.2; uu <= 0.45; uu += 0.0005) if (lzLegible(Lp, uu)) { uIn = uu; break; }
    for (let uu = 0.9; uu >= 0.55; uu -= 0.0005) if (lzLegible(Lp, uu)) { uOut = uu; break; }
  }
  return {
    planShare: (bOuter.w * bOuter.h) / (D.w * D.h), uIn, uOut,
    showStack: showKey, stackLensTop: dest.y + (stackBox.y - crop.y) * zoom, stackLensBottom: dest.y + (stackBox.y + stackBox.h - crop.y) * zoom,
    unrollDown: (stackBox.y + stackBox.h / 2 - crop.y) < crop.h / 2, F, px, k, M, G, art, lzArt, cb, ca, lzCb, lzCa, people, lzPeople, badgeAt, badgeNodes, dEnd,
    hearingChipNode, zoneChipNode, buildingChipNode, stack, marker, markerClear, hasMarkerNote: Boolean(panel && showAll),
    gapD: M.box(G.gapBox(move)),
    crop, dest, zoom, sT, side, span, guides, anchor, Wb, FW, heads, tFloor, stackInCrop, lensOverPanel,
    kindBefore, kindAfter, changesGeo: kindBefore !== kindAfter,
    panelNode: panel ? panel.node : null,
    personPx, problems, arrangement: `${A.key}/sT${r(sT, 2)}/z${r(zoom, 2)}/${side}`,
  };
}

/** The panel's items. */
function panelItems(ctx, p, F, showAll, showKey, bname, namesInLegend) {
  const items = [];
  if (namesInLegend && showKey) {
    items.push(legendItem(ctx, {kind: 'pub', text: p.courts.hearing, F, name: 'legend-pub', weight: 700}));
    items.push(legendItem(ctx, {kind: 'zone', text: p.courts.deliberation, F, name: 'legend-zone', weight: 700}));
  }
  if (showKey && bname) items.push(legendItem(ctx, {kind: 'building', text: p.courts.building, F, name: 'legend-building', weight: 600}));
  if (showKey) p.seats.participants.forEach((q, i) => items.push(legendItem(ctx, {kind: 'letter', text: q.name, F, name: `legend-p${i}`, glyphOpts: {letter: LETTERS[i]}})));
  if (showAll) {
    items.push(legendItem(ctx, {kind: 'bench', text: p.seats.bench, F, name: 'legend-bench'}));
    items.push(legendItem(ctx, {kind: 'track', text: p.routes.track, F, name: 'legend-track'}));
    items.push(legendItem(ctx, {kind: 'partition', text: p.routes.partition, F, name: 'legend-partition'}));
    items.push(legendItem(ctx, {kind: 'gap', text: p.labels.gap, F, name: 'legend-gap'}));
    // the order shown (strike, then the new value, then its closure) is captioned as configured
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
    slug: 'courts-08-inspect',
    title: 'Separate deliberation — inspecting the partition datum and substituting it',
    titleEs: 'Deliberación separada — Inspección y cambio de un dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Deliberación separada',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The public space (●) stands apart from an abstract deliberation zone (◆) inside a generic building. A lens enlarges the partition between them with the supplied datum on its tag; the datum is substituted (old value struck and kept as "was"), and only the closure it names changes — a hinged door gives way to a sliding screen, as supplied. The lens closes onto the updated context with a neutral changed-datum marker. No rule, attendance, vote or outcome is shown or inferred.',
    tags: ['floor plan', 'inspect', 'lens', 'partition', 'door', 'sliding screen', 'datum', 'substitution', 'hearing room', 'deliberation zone'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/deliberacion-separada.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
