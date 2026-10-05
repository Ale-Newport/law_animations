/**
 * LAW-0256 — Comunicación a la contraparte · inspect
 *
 * Storyboard (the context is the state produced by the story: the side-view office with Party A and her out-tray, the
 * supplied route with its stops and the calendar of the legs, Party B with the case file in her in-tray. One supplied
 * leg carries its supplied state — "documented (as supplied)", a solid outline with a ● badge. Above the wall, a tag
 * led to that leg carries the SUPPLIED datum. A panel prints once the texts common to the scene — stops, dates, trays,
 * file, parties — with the single context caption and the key):
 *  0.00–0.20  build: Party B takes the file from the carrier and sets it in her tray (the end of the story); a ring
 *             settles on the supplied leg and the context caption appears.
 *  0.20–0.45  isolate: a frame settles on the detail that tells a documented communication from a questioned one — the
 *             leg, its badge and the tag. The panel steps aside; the context steps back a little at most (heads stay
 *             >= 45 px) and dims in place; a lens opens beside it, over the space the panel left and never over the
 *             context: a REAL enlarged copy (>= 1.5x the context at rest) of the same stage coordinates, tied to the
 *             frame by two solid guides. The tag is shown in ONE place at a time: its context copy leaves as the lens
 *             copy becomes legible and returns only after it has gone.
 *  0.45–0.75  substitute ONE datum in the lens: the old value moves down into a "was" slot (kept, never struck or
 *             crossed); the new value appears in its place and stays still; then only the dependent geometry follows —
 *             the leg's solid outline gives way to the dashed disputed marker and the ● badge to ◆ (never both at once).
 *  0.72–1.00  return: the lens closes while the context returns to full size and strength with the new state, the
 *             kept old value and a neutral changed-datum marker (Δ); a panel note repeats it. Seeking back restores the
 *             old datum exactly. "Questioned" means only that someone questions it in this configured example: no
 *             service rule, valid method, deadline, "deemed" service or effect is shown or inferred.
 * @module animations/civil-claim/LAW-0256
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, int, obj, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  CC_DEFAULTS, CC_STRINGS, partiesField, documentsField, stagesField, datesField, objectLabelProps,
  looksOf, legLabels, routeStage, cueChip, stateCue, packRows, hit, unionBox, SIZES, pxPerUnit, fitG,
  localizeDefaults, CC_COMMON_ES,
} from './kits/comunicacion-contraparte.js';

const ID = 'LAW-0256';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  act: [0, 0.15], ring: [0.05, 0.13], frame: [0.2, 0.24], panelOut: [0.215, 0.24], shrink: [0.221, 0.271], open: [0.24, 0.3],
  dock: [0.46, 0.5], newIn: [0.505, 0.535], geoOut: [0.55, 0.575], geoIn: [0.585, 0.61],
  close: [0.72, 0.762], grow: [0.732, 0.774], panelIn: [0.748, 0.778], marker: [0.8, 0.84],
};
const KINDS = ['documented', 'questioned'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  objectLabels: obj('Labels printed once in the panel (trays, calendar, route caption)', objectLabelProps),
  focusTarget: oneOf('Detail that is enlarged and substituted: the supplied state of one leg of the route (its outline and badge)', ['legState']),
  beforeValue: str('The leg\'s state as supplied before the substitution', 70),
  afterValue: str('The alternative supplied state', 70),
  detailGeometry: obj('Lens and the geometry each value draws', {
    zoom: num('Largest magnification of the lens, against the context at rest', 1.5, 4),
    leg: int('Zero-based leg whose supplied state is inspected', 0, 3),
    before: oneOf('The outline and badge the before value draws: documented = solid outline and ●, questioned = dashed disputed marker and ◆', KINDS),
    after: oneOf('The outline and badge the after value draws', KINDS),
  }),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial note)', 90), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  parties: CC_DEFAULTS.parties,
  documents: CC_DEFAULTS.documents,
  stages: CC_DEFAULTS.stages,
  dates: CC_DEFAULTS.dates,
  objectLabels: CC_DEFAULTS.labels,
  focusTarget: 'legState',
  beforeValue: 'Leg 2 · documented (as supplied)',
  afterValue: 'Leg 2 · questioned in this example (as supplied)',
  detailGeometry: {zoom: 2.4, leg: 1, before: 'documented', after: 'questioned'},
  contextLabels: {context: 'The file after the route, as configured', marker: 'Changed: one supplied datum, the leg\'s state'},
};

/** Spanish defaults: with locale es, every field still at its English default is shown in Spanish. */
const DEFAULTS_ES = {...CC_COMMON_ES,
  beforeValue: 'Tramo 2 · documentado (según lo aportado)',
  afterValue: 'Tramo 2 · cuestionado en este ejemplo (según lo aportado)',
  contextLabels: {context: 'El expediente tras la ruta, según lo configurado', marker: 'Cambia: un dato aportado, el estado del tramo'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const shape = ctx.view.shape;
    const hidden = !ctx.show('key');
    const arrs = [];
    if (hidden) {
      for (const rise of shape === 'landscape' ? [0] : [0, 220, 420]) arrs.push({panel: 'none', rise});
    } else if (shape === 'landscape') {
      for (const pf of [0.3, 0.36, 0.42]) for (const rise of [0, 220]) arrs.push({panel: 'column', pf, rise});
    } else {
      for (const fw of [0.48, 0.32]) for (const rise of [0, 220]) arrs.push({panel: 'band', fw, rise});
    }
    const log = [];
    let best = null;
    const clean = [];
    // people >= 52 px first (text as large as possible); only when no layout holds them — heavy supplied text in a
    // square frame — >= 50 px, then >= 45 px (the lens-time floor)
    const tiers = [52, 50, 45];
    const pickOf = () => { for (const t of tiers) { const c = clean.filter(L => L.headPx >= t + 0.4); if (c.length) { const T = Math.max(...c.map(L => L.T)); return c.filter(L => L.T === T).sort((a, b) => b.score - a.score)[0]; } } return null; };
    for (const T0 of SIZES) {
      for (const A0 of arrs) for (const ps of [1.45, 1.3, 1.15, 1]) {
        const A = {...A0, ps, headMin: 45};
        const L = compose(ctx, T0, A);
        L.T = T0;
        log.push(`${T0}/${L.arrangement}:h${Math.round(L.headPx)}:${L.problems.join('+')}`);
        const sc = L.problems.length * 100 - L.score;
        if (!best || sc < best.sc) best = {L, sc};
        if (!L.problems.length) clean.push(L);
      }
      if (clean.some(L => L.headPx >= 52.4)) break;
    }
    const pick = pickOf();
    const L = pick || best.L;
    L.log = log;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const stageArt = (st, P) => g({transform: `${T(L.ox, L.oy)} scale(${r(L.s, 5)})`},
      st.node, markers(ctx, L, P));
    const world = g({name: 'world'},
      g({name: 'ctx-stage'}, stageArt(L.st, 's')),
      g({name: 'build-ring', opacity: 0}, h('path', {d: roundRectPath(L.qW.x - 10, L.qW.y - 10, L.qW.w + 20, L.qW.h + 20, 16), fill: 'none', stroke: th.accent3, 'stroke-width': 5})),
      L.stack ? g({name: 'cx-wrap'}, L.stack.node('cx')) : null,
      L.markerNode,
      h('path', {name: 'src-frame', d: roundRectPath(L.crop.x, L.crop.y, L.crop.w, L.crop.h, 10), fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', opacity: 0}),
    );
    return g(null,
      world,
      L.panelNode,
      L.guides.map((gd, i) => h('line', {name: `guide${i}`, x1: r(gd.a.x), y1: r(gd.a.y), x2: r(gd.b.x), y2: r(gd.b.y), stroke: th.accent2, 'stroke-width': 2.5, opacity: 0})),
      g({name: 'lens', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('path', {d: roundRectPath(L.dest.x, L.dest.y, L.dest.w, L.dest.h, 18)}))),
        h('path', {name: 'lens-shadow', d: roundRectPath(L.dest.x + 6, L.dest.y + 10, L.dest.w, L.dest.h, 18), fill: th.shadow}),
        h('path', {name: 'lens-bg', d: roundRectPath(L.dest.x, L.dest.y, L.dest.w, L.dest.h, 18), fill: th.paper}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(L.dest.x - L.crop.x * L.zoom, L.dest.y - L.crop.y * L.zoom)} scale(${r(L.zoom, 4)})`},
            stageArt(L.lz, 'lz'),
            L.stack ? L.stack.node('lz') : null)),
        h('path', {name: 'lens-rim', d: roundRectPath(L.dest.x, L.dest.y, L.dest.w, L.dest.h, 18), fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    // the end of the story: Party B takes the file from the clip and sets it in her tray (context and lens alike)
    const c = lerp(0.84, 1, seg(u, ...W.act));
    const F0 = L.st.frame(c, {marker: 0, cue: 0});
    Object.assign(nodes, F0.nodes, L.lz.frame(c, {marker: 0, cue: 0}).nodes);
    // the context steps back (at most to sT) and dims in place while the lens is open
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, L.sT, sh);
    const off = {x: L.off.x * sh, y: L.off.y * sh};
    nodes.world = {transform: `${T(r(off.x, 2), r(off.y, 2))} scale(${r(sc, 4)})`};
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const dim = 1 - 0.42 * open;
    nodes['ctx-stage'] = {opacity: r(dim, 3)};
    const textOp = L.F * L.px * sc >= L.tFloor - 1e-6 ? 1 : 0;
    // the leg's supplied state: the before value's outline and badge, then (after the new value) the after value's
    const gOut = seg(u, ...W.geoOut), gIn = seg(u, ...W.geoIn);
    const changes = L.kB !== L.kA;
    for (const P of ['s', 'lz']) {
      for (const k of KINDS) {
        const op = k === L.kB ? (changes ? 1 - gOut : 1) : k === L.kA ? (changes ? gIn : 0) : 0;
        nodes[`${P}-mk-${k}`] = {opacity: r(op, 3)};
        nodes[`${P}-bd-${k}`] = {opacity: r(op, 3)};
      }
    }
    nodes['build-ring'] = {opacity: r(seg(u, ...W.ring) * (1 - seg(u, W.frame[0] - 0.03, W.frame[0])), 3)};
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    // the lens grows from its far point (its outer extent never moves); the whole window scales, so a head is always
    // wholly inside it or wholly out
    const ls = 0.7 + 0.3 * open;
    const lensOp = lensOpacity(u, L);
    nodes.lens = {opacity: r(lensOp, 3), transform: scaleAbout(L.lensAnchor.x, L.lensAnchor.y, r(ls, 4))};
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    L.guides.forEach((gd, i) => {
      const a = wt(gd.a0);
      const b = {x: L.lensAnchor.x + (gd.b.x - L.lensAnchor.x) * ls, y: L.lensAnchor.y + (gd.b.y - L.lensAnchor.y) * ls};
      nodes[`guide${i}`] = {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: r(Math.min(fr, open > 0.05 ? 1 : 0), 3)};
    });
    // one copy of the datum at a time: the context tag leaves as the lens copy becomes legible and returns after it goes
    if (L.stack) {
      const cxOp = u < 0.5 ? 1 - seg(u, L.uIn - 0.011, L.uIn - 0.001) : seg(u, L.uOut + 0.001, L.uOut + 0.011);
      nodes['cx-wrap'] = {opacity: r(textOp ? cxOp : 0, 3)};
      nodes['lz-stack'] = {opacity: lzLegible(L, u) ? 1 : 0};
      Object.assign(nodes, L.stack.frame(u, 'cx'), L.stack.frame(u, 'lz'));
    }
    const mk = seg(u, ...W.marker);
    if (L.markerNode) nodes['cx-marker'] = {opacity: r(mk * textOrGlyph(L, sc), 3)};
    if (L.hasMarkerNote) nodes['marker-note'] = {opacity: r(mk, 3)};
    if (L.panelNode) nodes.panel = {opacity: r(L.lensOverPanel ? (u < 0.5 ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn)) : 1, 3)};
    const newIn = seg(u, ...W.newIn);
    const datum = u < W.dock[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const legState = !changes || gOut <= 0 ? L.kB : gIn >= 1 ? L.kA : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const Ws = {x: off.x + L.Wb.x * sc, y: off.y + L.Wb.y * sc, w: L.Wb.w * sc, h: L.Wb.h * sc};
    const rect = {x: L.lensAnchor.x + (L.dest.x - L.lensAnchor.x) * ls, y: L.lensAnchor.y + (L.dest.y - L.lensAnchor.y) * ls, w: L.dest.w * ls, h: L.dest.h * ls};
    const headsNow = L.headsW.map(b => ({x: off.x + b.x * sc, y: off.y + b.y * sc, w: b.w * sc, h: b.h * sc}));
    return {
      nodes,
      semantic: {
        beat,
        datum,
        legState,
        valueShown: newIn >= 1 ? 'after' : 'before',
        lensOpen: r(open, 3),
        lensOpacity: r(lensOp, 3),
        contextScale: r(sc, 3),
        contextDim: r(dim, 3),
        contextWidth: r(Ws.w / L.FW, 3),
        contextHeight: r(Ws.h / L.FH, 3),
        lensSpan: r(L.span, 3),
        oldDocked: r(seg(u, ...W.dock), 3),
        newShown: r(newIn, 3),
        focusTarget: ctx.params.focusTarget,
        before: L.kB,
        after: L.kA,
        leg: L.qLeg,
        zoom: r(L.zoom, 2),
        lensMinSidePx: r(Math.min(L.dest.w, L.dest.h) * L.px, 1),
        lensMinSideShare: r(Math.min(L.dest.w, L.dest.h) / Math.min(L.FW, L.FH), 3),
        datumInLens: L.stackInCrop && lensOp >= 0.99,
        lensOverContext: L.side === 'over',
        lensClearOfContext: lensOp === 0 || L.side === 'over' || !hit(rect, Ws, 0),
        lensClearOfHeads: lensOp === 0 || !headsNow.some(b => hit(rect, b, 0)),
        crop: {x: r(L.crop.x, 2), y: r(L.crop.y, 2), w: r(L.crop.w, 2), h: r(L.crop.h, 2)},
        dest: {x: r(L.dest.x, 2), y: r(L.dest.y, 2), w: r(L.dest.w, 2), h: r(L.dest.h, 2)},
        leg0: {x: r(L.qW.x, 2), y: r(L.qW.y, 2)},
        docAt: F0.s.docAt,
        holder: F0.s.holder,
        legsDone: F0.s.legsDone,
        handB: {x: r(F0.s.handB.x, 2), y: r(F0.s.handB.y, 2)},
        file: {x: r(F0.s.file.x, 2), y: r(F0.s.file.y, 2)},
        markerShown: r(mk, 3),
        sT: r(L.sT, 3),
        problems: L.problems,
        allReached: F0.s.allReached,
        textPx: r(L.F * L.px, 1),
        headPx: r(L.headPx, 1),
        arrangement: L.arrangement,
        log: L.log,
      },
    };
  },
};

/**
 * Lens opacity at u. The lens appears only once its window (at its current size) is clear of every context head (at
 * the context's current step-back), and has gone before it would meet one again: it is never drawn over a head at any
 * opacity. L.uOpen / L.uClose (found in compose) are those moments; without them the plain windows apply.
 */
function lensOpacity(u, L) {
  const a = L && L.uOpen != null ? L.uOpen : W.open[0];
  const b = L && L.uClose != null ? L.uClose : W.close[1] - 0.012;
  return u < 0.5 ? seg(u, a, a + 0.008) : 1 - seg(u, b - 0.008, b);
}
/** The lens window and the context heads at u (design units). */
function lensGeo(G, u) {
  const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
  const sc = lerp(1, G.sT, sh);
  const off = {x: G.off.x * sh, y: G.off.y * sh};
  const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
  const ls = 0.7 + 0.3 * open;
  const rect = {x: G.lensAnchor.x + (G.dest.x - G.lensAnchor.x) * ls, y: G.lensAnchor.y + (G.dest.y - G.lensAnchor.y) * ls, w: G.dest.w * ls, h: G.dest.h * ls};
  const heads = G.headsW.map(b => ({x: off.x + b.x * sc, y: off.y + b.y * sc, w: b.w * sc, h: b.h * sc}));
  return {rect, heads};
}
/** The Δ marker carries no text (labels hidden it stands for itself); it shows only while the context is large enough. */
function textOrGlyph(L, sc) {
  return sc >= L.sT - 1e-6 && (L.F * L.px * sc >= L.tFloor - 1e-6 || !L.stack) ? 1 : 0;
}
/** Is the lens copy of the datum legible at u (lens opaque and its text at or above the floor)? */
function lzLegible(L, u) {
  if (lensOpacity(u, L) < 0.99) return false;
  const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
  const ls = 0.7 + 0.3 * open;
  return L.F * L.px * L.zoom * ls >= L.tFloor + 0.2;
}

/** The two outlines of the supplied leg (solid ●-state, dashed disputed ◆-state) and their badges, in stage units. */
function markers(ctx, L, P) {
  const th = ctx.theme;
  const q = L.st.geo.qBox, b = L.st.geo.badgeAt, R = L.st.geo.badgeR;
  const mw = 6;
  const d = roundRectPath(q.x, q.y, q.w, q.h, 22);
  return g({name: `${P}-marks`},
    h('path', {name: `${P}-mk-documented`, d, fill: 'none', stroke: th.inkSoft, 'stroke-width': mw, 'stroke-linecap': 'round', opacity: 0}),
    g({name: `${P}-mk-questioned`, opacity: 0, 'data-disputed': 1},
      h('path', {d, fill: 'none', stroke: th.inkSoft, 'stroke-width': mw, 'stroke-dasharray': `${r(mw * 3.6)} ${r(mw * 2.7)}`, 'stroke-linecap': 'round'})),
    g({name: `${P}-bd`},
      h('circle', {cx: r(b.x + 3), cy: r(b.y + 4), r: r(R), fill: th.shadow}),
      h('circle', {name: `${P}-bd-disc`, cx: r(b.x), cy: r(b.y), r: r(R), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
      KINDS.map(k => g({name: `${P}-bd-${k}`, opacity: 0, transform: T(b.x, b.y)}, stateCue(ctx, k, R * 1.1, {name: `${P}-bd-${k}-glyph`})))));
}

/**
 * The datum stack: the value chip (old and new in the same slot, never cross-faded: the old one moves down into the
 * "was" slot and stays readable; the new one appears in the freed slot), each with the ● / ◆ cue of the state it draws,
 * and a lead from the stack to the leg's outline.
 */
function datumStack(ctx, p, F, maxW, kindB, kindA) {
  const th = ctx.theme;
  const mk = (P, nm, text, kind, op) => cueChip(ctx, {name: `${P}-${nm}`, text, size: F, maxWidth: maxW, maxLines: 3, cue: kind, stroke: th.accent2, weight: 650, opacity: op});
  const cOld = mk('m', 'old', p.beforeValue, kindB), cNew = mk('m', 'new', p.afterValue, kindA);
  const wasFit = fitG(ctx.t.was, {maxWidth: maxW, size: F, minSize: F, maxLines: 1, weight: 500});
  const slotH = Math.max(cOld.h, cNew.h);
  const gap = F * 0.45;
  const wasW = wasFit.width + F * 0.5;
  const w = Math.max(cOld.w + wasW, cNew.w);
  const hh = slotH + gap + slotH;
  const truncated = cOld.fit.truncated || cNew.fit.truncated || wasFit.truncated;
  let at = {x: 0, y: 0}, leadTo = {x: 0, y: 0};
  const node = P => {
    const {x, y} = at;
    const ax = clamp(leadTo.x, x + 12, x + w - 12);
    return g({name: `${P}-stack`},
      h('path', {name: `${P}-lead`, d: `M${r(ax)} ${r(y + hh)}L${r(leadTo.x)} ${r(leadTo.y)}`, stroke: th.accent2, 'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none'}),
      h('circle', {name: `${P}-lead-dot`, cx: r(leadTo.x), cy: r(leadTo.y), r: 5, fill: th.accent2}),
      g({name: `${P}-was`, opacity: 0}, textBlock(wasFit, {x, y: y + slotH + gap + (slotH - wasFit.height) / 2, fill: th.fgSoft ?? th.inkSoft, name: `${P}-was-text`})),
      g({name: `${P}-oldw`}, mk(P, 'old', p.beforeValue, kindB).node(x, y + (slotH - cOld.h) / 2)),
      g({name: `${P}-neww`, opacity: 0}, mk(P, 'new', p.afterValue, kindA).node(x, y + (slotH - cNew.h) / 2)),
    );
  };
  const frame = (u, P) => {
    const dk = ease.inOutCubic(seg(u, ...W.dock)), ni = seg(u, ...W.newIn);
    return {
      [`${P}-oldw`]: {transform: T(r(wasW * dk, 2), r((slotH + gap) * dk, 2))},
      [`${P}-was`]: {opacity: r(seg(u, W.dock[1] - 0.01, W.dock[1] + 0.01), 3)},
      [`${P}-neww`]: {opacity: r(ni, 3)},
    };
  };
  return {
    w, h: hh, slotH, truncated,
    place(x, y, to) { at = {x, y}; leadTo = to; },
    get box() { return {x: at.x, y: at.y, w, h: hh}; },
    node, frame,
  };
}

/** The panel's chips (texts printed once for the scene). */
function panelItems(ctx, p, F, chipW, showAll, showKey) {
  const th = ctx.theme;
  const items = [];
  if (showKey) items.push({...cueChip(ctx, {name: 'key', text: `◦ ${ctx.t.key}`, size: F, maxWidth: chipW, maxLines: 2, stroke: th.inkSoft, weight: 600}), key: 'key'});
  if (showAll) {
    items.push({...cueChip(ctx, {name: 'context-caption', text: p.contextLabels.context, size: F, maxWidth: chipW, maxLines: 3, stroke: th.ink, weight: 700}), key: 'context'});
    items.push({...cueChip(ctx, {name: 'panel-stops', text: `${p.objectLabels.route}: ${p.stages.join(' · ')}`, size: F, maxWidth: chipW, maxLines: 5, stroke: th.ink, weight: 600}), key: 'stops'});
    items.push({...cueChip(ctx, {name: 'panel-dates', text: `${p.objectLabels.calendar}: ${legLabels(p).join(' · ')}`, size: F, maxWidth: chipW, maxLines: 5, stroke: th.ink, weight: 600}), key: 'dates'});
    items.push({...cueChip(ctx, {name: 'panel-trays', text: `${p.objectLabels.outTray} / ${p.objectLabels.inTray} · ${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`, size: F, maxWidth: chipW, maxLines: 5, stroke: th.ink, weight: 600}), key: 'trays'});
    items.push({...cueChip(ctx, {name: 'panel-parties', text: `${p.parties[0].name} · ${p.parties[0].role} / ${p.parties[1].name} · ${p.parties[1].role}`, size: F, maxWidth: chipW, maxLines: 4, stroke: th.ink, weight: 600}), key: 'parties'});
    if (p.contextLabels.marker) items.push({...cueChip(ctx, {name: 'marker-note', text: `Δ ${p.contextLabels.marker}`, size: F, maxWidth: chipW, maxLines: 3, stroke: th.accent2, weight: 600, opacity: 0}), key: 'marker'});
  }
  return items;
}

/** One composition at text size T0 (px at 1080p) for arrangement A. */
function compose(ctx, T0, A) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const F = T0 / px;
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const problems = [];
  const tFloor = T0 >= 19.5 ? 19.5 : 16;
  const gap = F * 0.8;
  const bounds = {x: 6, y: 6, w: D.w - 12, h: D.h - 12};
  const FW = (ctx.view.width / Math.min(ctx.view.width, ctx.view.height)) * 1080 / px;
  const FH = (ctx.view.height / Math.min(ctx.view.width, ctx.view.height)) * 1080 / px;
  const dg = p.detailGeometry || {};
  const kB = dg.before || 'documented', kA = dg.after || 'questioned';
  const qLeg = clamp(dg.leg ?? 1, 0, p.stages.length);
  const looks = looksOf(ctx, p);
  // ---- panel
  let region = {...bounds};
  let panelNode = null, panelBoxes = [];
  if (A.panel !== 'none') {
    const pw = A.panel === 'column' ? bounds.w * A.pf : bounds.w;
    const chipW = A.panel === 'column' ? pw : Math.min(bounds.w * A.fw, F * 22);
    const items = panelItems(ctx, p, F, chipW, showAll, showKey);
    for (const it of items) if (it.fit.truncated) problems.push(`trunc-${it.key}`);
    const packed = A.panel === 'column' ? {rows: items.map(it => ({items: [it], w: it.w, h: it.h})), height: items.reduce((a, it) => a + it.h, 0) + gap * 0.7 * Math.max(0, items.length - 1)} : packRows(items, pw, gap * 0.7);
    const ph = packed.height;
    let y, x0;
    if (A.panel === 'column') {
      if (ph > bounds.h) problems.push('panel-h');
      y = bounds.y + Math.max(0, (bounds.h - ph) / 2);
      x0 = bounds.x + bounds.w - pw;
      region = {x: bounds.x, y: bounds.y, w: bounds.w - pw - gap * 1.5, h: bounds.h};
    } else {
      y = bounds.y + bounds.h - ph;
      x0 = bounds.x;
      region = {x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h - ph - gap * 1.5};
    }
    const nodesP = [];
    for (const row of packed.rows) {
      let x = A.panel === 'column' ? x0 + (pw - row.items[0].w) / 2 : x0 + (pw - row.w) / 2;
      for (const it of row.items) {
        const b = {x, y: y + (row.h - it.h) / 2, w: it.w, h: it.h};
        panelBoxes.push(b);
        nodesP.push(g({name: `panel-${it.key}-wrap`}, it.node(b.x, b.y)));
        x += it.w + gap;
      }
      y += row.h + gap * 0.7;
    }
    panelNode = g({name: 'panel'}, nodesP);
  }
  // ---- the datum stack above the wall, over the inspected leg
  const stack = showKey ? datumStack(ctx, p, F, Math.min(region.w * 0.9, F * (A.sw || 22)), kB, kA) : null;
  if (stack && stack.truncated) problems.push('stack-trunc');
  const stackRoom = stack ? stack.h + gap * 1.4 : 0;
  // ---- the stage: its width follows the region; the largest scale that fits
  const ps = A.ps;
  const stageFor = (sc, P = 's') => routeStage(ctx, {P, p, looks, ts: 20, showText: false, W: Math.max(200, region.w / sc - 180 * ps), RY: 0, calCols: 9, plan: 'documented', qLeg, caption: null, fileText: false, flat: !A.rise, rise: A.rise || undefined, markLeg: true, ps, badgeR: 40, markW: 6, noPlates: true, calMin: 2.2, floorExt: 48});
  const ok = sc => { const st = stageFor(sc); return st.ext.w * sc <= region.w + 0.5 && st.ext.h * sc <= region.h - stackRoom + 0.5 && !st.problems.length; };
  let pick = null;
  // (the stage's height hardly depends on its width: start the scan near the height-limited scale)
  const e1 = stageFor(1).ext;
  const sStart = Math.min(1.4, Math.floor(((region.h - stackRoom) / e1.h + 0.1) * 10) / 10);
  for (let sc = sStart; sc >= 0.25; sc -= 0.1) if (ok(sc)) { pick = sc; break; }
  if (pick) for (let sc = pick + 0.08; sc > pick + 1e-6; sc -= 0.02) if (ok(sc)) { pick = sc; break; }
  const s = pick || 0.25;
  if (!pick) problems.push('stage-fit');
  const st = stageFor(s, 's'), lz = stageFor(s, 'lz');
  const ext = st.ext;
  const worldH = stackRoom + ext.h * s;
  const top = region.y + Math.max(0, (region.h - worldH) / 2);
  const ox = region.x + (region.w - ext.w * s) / 2 - ext.x * s;
  const oy = top + stackRoom - ext.y * s;
  const toW = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
  const stageBox = toW(ext);
  const qW = toW(st.geo.qBox);
  const bR = st.geo.badgeR * s;
  const bW = {x: ox + st.geo.badgeAt.x * s - bR - 4, y: oy + st.geo.badgeAt.y * s - bR - 4, w: 2 * bR + 8, h: 2 * bR + 8};
  // (head boxes with the hair's reach: the rendered head is a little larger than the rig's head box)
  const headsW = st.heads.map(b => toW({x: b.x - b.w * 0.3, y: b.y - b.h * 0.3, w: b.w * 1.6, h: b.h * 1.6}));
  const headPx = 101 * ps * s * px;
  const headMin = A.headMin ?? 52;
  if (headPx < headMin + 0.4) problems.push('small-people');
  if (stack) {
    const sx = clamp(qW.x + qW.w / 2 - stack.w / 2, region.x, region.x + region.w - stack.w);
    stack.place(sx, top, {x: qW.x + qW.w / 2, y: qW.y});
    if (hit(stack.box, bW, 2)) problems.push('stack-badge');
  }
  const stackBox = stack ? stack.box : null;
  // ---- the Δ marker beside the stack (or, labels hidden, beside the leg's badge)
  const mR = Math.max(F * 0.95, 18);
  let markerNode = null;
  {
    const anchor = stackBox || bW;
    const cy0 = anchor.y + (stack ? stack.slotH / 2 : anchor.h / 2);
    const cands = [{x: anchor.x + anchor.w + mR + 10, y: cy0}, {x: anchor.x - mR - 10, y: cy0}, {x: anchor.x + anchor.w / 2, y: anchor.y - mR - 10}, {x: anchor.x + anchor.w + mR + 10, y: anchor.y - mR}];
    // (clear of the heads, the tag, the badge and the leg's outline)
    const clearOf = [...headsW, ...(stackBox ? [stackBox] : []), bW, qW];
    const mPos = cands.find(q => q.x - mR >= region.x && q.x + mR <= region.x + region.w && q.y - mR >= region.y && !clearOf.some(b => hit({x: q.x - mR, y: q.y - mR, w: 2 * mR, h: 2 * mR}, b, 4)));
    if (!mPos) problems.push('marker');
    else markerNode = g({name: 'cx-marker', opacity: 0}, changedMarker(ctx, {x: mPos.x, y: mPos.y, radius: mR}));
  }
  // ---- the world at rest
  const Wb = unionBox([stageBox, ...(stackBox ? [stackBox] : [])]);
  // ---- the crop: the leg, its badge and the tag (labels hidden: the leg and some track on both sides)
  const pad = F * 0.7;
  const base0 = unionBox([qW, bW, ...(stackBox ? [stackBox] : [])]);
  const base = {x: base0.x - pad, y: base0.y - pad, w: base0.w + 2 * pad, h: base0.h + 2 * pad};
  // a head is wholly inside the crop or wholly out of it
  // (the neck rule is dropped only when no lens fits with it)
  let neckRule = true;
  const headsWhole = c => {
    let cc = {...c};
    for (let k = 0; k < 3; k++) for (const hb of headsW) {
      const inside = hb.x >= cc.x && hb.y >= cc.y && hb.x + hb.w <= cc.x + cc.w && hb.y + hb.h <= cc.y + cc.h;
      if (hit(cc, hb, 0) && !inside) cc = unionBox([cc, {x: hb.x - 6, y: hb.y - 6, w: hb.w + 12, h: hb.h + 12}]);
      // (nor does its edge run through the neck just under a head: a crop edge within half a head below the chin
      // takes the neck in too)
      const nb = {x: hb.x, y: hb.y + hb.h, w: hb.w, h: hb.h * 0.5};
      if (neckRule && hit(cc, hb, 0) && hit(cc, nb, 0) && cc.y + cc.h < nb.y + nb.h) cc = unionBox([cc, {...nb, h: nb.h + 6}]);
    }
    return cc;
  };
  const minSide = (0.36 * 1080) / px;
  const zMax = dg.zoom || 2.4;
  const sTs = [1, 0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.66, 0.62, 0.58, 0.54, 0.5, 0.46, 0.42].filter(v => headPx * v >= 45.5);
  const why = {};
  const no = kk => { why[kk] = (why[kk] || 0) + 1; };
  let lp = null;
  const portrait = ctx.view.shape === 'portrait';
  for (const neck of [true, false]) {
  neckRule = neck;
  if (lp) break;
  for (const sT of sTs) {
    // (right / below: the lens opens in the space the context leaves; over: in square and tall frames the lens may
    // instead open over the lower part of the context — desks, chairs, floor — below every head and below the source,
    // the context staying visible above it across the whole width)
    for (const side of ctx.view.shape === 'landscape' ? ['right', 'below'] : ['right', 'below', 'over']) {
      const Ws = side === 'right'
        ? {x: bounds.x, y: Wb.y + (Wb.h - Wb.h * sT) / 2, w: Wb.w * sT, h: Wb.h * sT}
        : {x: Wb.x + (Wb.w - Wb.w * sT) / 2, y: bounds.y, w: Wb.w * sT, h: Wb.h * sT};
      const gL = F * 1.2;
      const wS = b => ({x: Ws.x + (b.x - Wb.x) * sT, y: Ws.y + (b.y - Wb.y) * sT, w: b.w * sT, h: b.h * sT});
      let c = headsWhole(base);
      let R;
      if (side === 'right') R = {x: Ws.x + Ws.w + gL, y: bounds.y, w: bounds.x + bounds.w - (Ws.x + Ws.w + gL), h: bounds.h};
      else if (side === 'below') R = {x: bounds.x, y: Ws.y + Ws.h + gL, w: bounds.w, h: bounds.y + bounds.h - (Ws.y + Ws.h + gL)};
      else {
        // (below the heads with their necks and shoulders: 0.5 of a head's height under the chin)
        const y0 = Math.max(...headsW.map(b => { const q = wS(b); return q.y + q.h * 1.5; }), wS(c).y + wS(c).h) + gL;
        R = {x: bounds.x, y: y0, w: bounds.w, h: bounds.y + bounds.h - y0};
      }
      if (R.w < minSide || R.h < minSide) { no(`R${side}`); continue; }
      const ctxOk = Ws.w / FW >= 0.46 || (portrait && Ws.h / FH >= 0.46);
      if (!ctxOk) { no('ctx'); continue; }
      // the crop grows (more of the same stage, within it) towards the free region's aspect at the chosen zoom
      let zoom = Math.min(zMax, R.w / c.w, R.h / c.h);
      if (zoom < 1.55) { no(`z${side}`); continue; }
      // (with the tag, it grows down no more than needed for a real lens: at most 2.2x the detail's height, or the
      // lens's minimum side; labels hidden, it takes in the stage down to the desks)
      const tw = Math.min(Math.max(c.w, R.w / zoom), Math.max(c.w, stageBox.w)), th2 = Math.min(Math.max(c.h, R.h / zoom), Math.max(c.h, Wb.h), stack ? Math.max(c.h * 2.2, minSide * 1.02 / zoom) : Infinity);
      const lim = unionBox([stageBox, c]);
      // (the crop keeps its top — the tag — and grows down into the stage, centred across: no blank paper above)
      const gx = clamp(c.x - (tw - c.w) / 2, lim.x, lim.x + lim.w - tw), gy = clamp(c.y, lim.y, lim.y + lim.h - th2);
      const cg = {x: Math.min(gx, c.x), y: Math.min(gy, c.y), w: Math.max(tw, c.w), h: Math.max(th2, c.h)};
      // (over: the grown crop keeps above the lens's own top — the lens never covers its source)
      if (side === 'over') { const top2 = (R.y - gL - Ws.y) / sT + Wb.y; if (cg.y + cg.h > top2) cg.h = Math.max(c.h, top2 - cg.y); }
      c = headsWhole(cg);
      zoom = Math.min(zMax, R.w / c.w, R.h / c.h);
      if (zoom < 1.55) { no(`zz${side}`); continue; }
      const lw = c.w * zoom, lh = c.h * zoom;
      if (Math.min(lw, lh) < minSide) { no(`min${side}`); continue; }
      const wtS = q => ({x: Ws.x + (q.x - Wb.x) * sT, y: Ws.y + (q.y - Wb.y) * sT});
      const cS = wtS({x: c.x + c.w / 2, y: c.y + c.h / 2});
      const dest = side === 'right'
        ? {x: R.x + (R.w - lw) / 2, y: clamp(cS.y - lh / 2, R.y, R.y + R.h - lh), w: lw, h: lh}
        : {x: clamp(cS.x - lw / 2, R.x, R.x + R.w - lw), y: R.y + (R.h - lh) / 2, w: lw, h: lh};
      // (context + lens span: across the frame's width side by side, down the content box's height when stacked)
      const span = side === 'right' ? (dest.x + dest.w - Ws.x) / FW : (dest.y + dest.h - Ws.y) / bounds.h;
      if (span < 0.8) { no(`span${side}`); continue; }
      if (side === 'over' && (headsW.some(b => hit(wS(b), dest, 2)) || hit(wS(c), dest, 2))) { no('overhead'); continue; }
      const score = zoom + 1.2 * sT + 2 * (lw * lh) / (D.w * D.h) - (side === 'over' ? 1.2 : 0);
      if (!lp || score > lp.score + 1e-6) lp = {sT, side, Ws, dest, crop: c, zoom, span, score};
    }
  }
  }
  if (!lp) {
    problems.push(`lens-fit:${Object.entries(why).map(([a, b]) => a + b).join('.')}`);
    lp = {sT: 1, side: 'right', Ws: Wb, dest: {x: D.w * 0.6, y: 8, w: D.w * 0.38, h: D.h * 0.4}, crop: base, zoom: 1, span: 0, score: 0};
  }
  const {sT, side, Ws, dest, crop, zoom, span} = lp;
  // (world transform at full shrink: q → off + q · sT)
  const off = {x: Ws.x - Wb.x * sT, y: Ws.y - Wb.y * sT};
  const lensAnchor = side === 'right' ? {x: dest.x + dest.w, y: dest.y + dest.h / 2} : {x: dest.x + dest.w / 2, y: dest.y + dest.h};
  const lensOverPanel = panelBoxes.some(b => hit(b, dest, 0));
  const stackInCrop = !stackBox || (stackBox.x >= crop.x && stackBox.y >= crop.y && stackBox.x + stackBox.w <= crop.x + crop.w && stackBox.y + stackBox.h <= crop.y + crop.h);
  if (!stackInCrop) problems.push('stack-crop');
  // guides from the source frame's facing corners to the lens's facing corners, when they cross no head
  const wtF = q => ({x: off.x + q.x * sT, y: off.y + q.y * sT});
  const cA = side === 'right' ? [{x: crop.x + crop.w, y: crop.y}, {x: crop.x + crop.w, y: crop.y + crop.h}] : [{x: crop.x, y: crop.y + crop.h}, {x: crop.x + crop.w, y: crop.y + crop.h}];
  const cB = side === 'right' ? [{x: dest.x, y: dest.y + 14}, {x: dest.x, y: dest.y + dest.h - 14}] : [{x: dest.x + 14, y: dest.y}, {x: dest.x + dest.w - 14, y: dest.y}];
  const headsS = [...headsW, ...st.bodies.map(toW)].map(b => ({x: off.x + b.x * sT, y: off.y + b.y * sT, w: b.w * sT, h: b.h * sT}));
  const segClear = (a, b) => { for (let j = 1; j < 40; j++) { const q = {x: a.x + (b.x - a.x) * j / 40, y: a.y + (b.y - a.y) * j / 40}; if (headsS.some(o => q.x > o.x - 3 && q.x < o.x + o.w + 3 && q.y > o.y - 3 && q.y < o.y + o.h + 3)) return false; } return true; };
  const guides = cA.every((a, i) => segClear(wtF(a), cB[i])) ? cA.map((a0, i) => ({a0, a: a0, b: cB[i]})) : [];
  // ---- audit
  for (let i = 0; i < panelBoxes.length; i++) for (let j = i + 1; j < panelBoxes.length; j++) if (hit(panelBoxes[i], panelBoxes[j], 2)) { problems.push('overlap'); i = panelBoxes.length; break; }
  if (panelBoxes.some(b => hit(b, Wb, 2))) problems.push('panel-on-world');
  const all = unionBox([Wb, ...panelBoxes]);
  const fill = {w: all.w / bounds.w, h: all.h / bounds.h};
  if (Math.max(fill.w, fill.h) < 0.85 || Math.min(fill.w, fill.h) < 0.55) problems.push('fill');
  // (when does the lens copy become legible, and when does it stop being legible?)
  // (the lens appears once clear of every context head and goes before meeting one again)
  const G = {sT, off, lensAnchor, dest, headsW};
  const clearAt = uu => { const q = lensGeo(G, uu); return !q.heads.some(b => hit(q.rect, b, 2)); };
  let uOpen = W.open[0], uClose = W.close[1] - 0.012;
  for (let uu = W.open[0]; uu < 0.45; uu += 0.0005) { let ok = true; for (let v = uu; v <= 0.5; v += 0.002) if (!clearAt(v)) { ok = false; break; } if (ok) { uOpen = uu; break; } }
  for (let uu = W.close[1] - 0.012; uu > 0.55; uu -= 0.0005) { let ok = true; for (let v = uu; v >= 0.5; v -= 0.002) if (!clearAt(v)) { ok = false; break; } if (ok) { uClose = uu; break; } }
  const Lp = {F, px, zoom, tFloor, uOpen, uClose};
  let uIn = W.open[0] + 0.012, uOut = W.close[1] - 0.012;
  if (stack) {
    for (let uu = 0.2; uu <= 0.45; uu += 0.0005) if (lzLegible(Lp, uu)) { uIn = uu; break; }
    for (let uu = 0.9; uu >= 0.55; uu -= 0.0005) if (lzLegible(Lp, uu)) { uOut = uu; break; }
  }
  const score = (T0 >= 19.8 - 1e-6 ? 2 : 0) + headPx / 60 + 0.3 * zoom + 0.8 * Math.min(fill.w, fill.h) + 0.5 * sT;
  return {
    uOpen, uClose,
    F, px, tFloor, s, ox, oy, st, lz, qW, headsW, stack, markerNode, hasMarkerNote: showAll && Boolean(p.contextLabels.marker),
    panelNode, lensOverPanel, Wb, FW, FH, crop, dest, zoom, sT, side, span, off, lensAnchor, guides, stackInCrop, uIn, uOut,
    kB, kA, qLeg, headPx, problems, score,
    arrangement: `${A.panel}${A.pf ? `/${A.pf}` : ''}${A.fw ? `/fw${A.fw}` : ''}${A.sw ? `/sw${A.sw}` : ''}/ps${ps}${A.rise ? `/rise${A.rise}` : ''}/s${r(s, 3)}/sT${r(sT, 2)}/z${r(zoom, 2)}/${side}`,
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-04-inspect',
    title: 'Communication to the other party — inspecting one leg\'s supplied state and substituting it',
    titleEs: 'Comunicación a la contraparte — Inspección y cambio de un dato',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Comunicación a la contraparte',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'In a fictional office the case file has travelled the supplied route to Party B\'s tray. A lens enlarges one leg of the route, its badge and the tag with its supplied state; the datum is substituted ("documented" → "questioned in this example", the old value kept as "was"), and only the dependent geometry follows: the solid outline gives way to the dashed disputed marker and ● to ◆. The lens closes onto the updated context with a neutral changed-datum marker. No service rule, deadline, validity or effect.',
    tags: ['inspect', 'lens', 'route', 'case file', 'leg', 'documented', 'questioned', 'disputed marker', 'datum', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/comunicacion-contraparte.js', 'src/primitives/markers.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
