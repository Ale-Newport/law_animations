/**
 * LAW-0228 — Presentación de una prueba en sala · inspect
 *
 * Storyboard (the context is the state produced by the story: the plan of the
 * generic hearing room, the presenter at the lectern, the enlarged copy of the
 * fictional sheet on the shared screen, the others looking at it; the panel
 * with the building, the legend and the key beside the plan):
 *  0.00–0.20  build: the plan at rest; under the screen, the supplied datum
 *             that will change (e.g. "Shown on the shared screen (as
 *             supplied)") in its own chip.
 *  0.20–0.45  isolate: the panel steps aside, a frame settles on the screen
 *             and its datum, the context copy of the datum gives way, and a
 *             lens opens where the panel was — a REAL enlarged copy (≥ 1.5×
 *             the plan at rest) of the same plan coordinates, tied to the frame
 *             by two solid guides. Pieces enter the lens whole or not at all.
 *  0.45–0.75  substitute ONE datum inside the lens: the old value lifts, turns
 *             muted and docks under the new one as "was: …" (not struck
 *             through); only its dependent geometry follows — for the display
 *             datum the copy leaves the screen and the screen goes to
 *             stand-by (the others then look at the lectern); for the document
 *             datum the title and the page on the screen change. The new value
 *             stays still in the lens.
 *  0.75–1.00  return: the lens closes, the new datum (with its "was" dock) is
 *             back under the screen with a neutral changed-datum marker (Δ);
 *             the panel returns with a note repeating the marker. Seeking back
 *             restores the old datum exactly. Nothing about admissibility,
 *             weight, objections, rulings or outcomes is inferred.
 * @module animations/courts/LAW-0228
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {buildingElevation} from './kits/courts-art.js';
import {
  ppFields, PP_EN, PP_STRINGS, resolvePP, fitPP, ppGeometry, ppFurniture, ppRoomArt, screenArt, lecternArt, sheetArt, holdPose, headTurn,
  lookAngle, planPerson, ppGlyph, textAt, planFrame, SCREEN, DOC, placeSeatLabels, seatLabelNode, bodyBox, gchip, glue, fitWords, pxPerUnit,
  overlaps, R2, PERSON_RAD,
} from './kits/presentacion-de-prueba.js';

const ID = 'LAW-0228';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.2, 0.23], open: [0.21, 0.29],
  lift: [0.46, 0.5], dock: [0.5, 0.54], change: [0.54, 0.62], newIn: [0.62, 0.65], look: [0.8, 0.88],
  close: [0.72, 0.77], marker: [0.8, 0.84],
};
// The lens window and its enlarged copy (and so the copy's value text) come in and go out TOGETHER; the hand-over
// with the context copy is timed on the moment the lens value text becomes / stops being legible (>= 0.15 effective
// opacity), found once from the windows above (pure constants, so the frame stays a pure function of u).
const lensOpenAt = u => ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
// (the window turns opaque within the first ~5 % of its opening — short cross-fade with the panel it replaces — and
// grows from 60 % size; its copy arrives with it)
const lensOpOf = open => clamp(open / 0.05);
const lensBodyOf = open => clamp(open / 0.08);
const LEGIBLE = 0.15;
const HAND = (() => {
  let on = null, off = null;
  for (let i = 0; i <= 40000; i++) {
    const u = i / 40000, o = lensOpenAt(u), e = lensOpOf(o) * lensBodyOf(o);
    if (on === null && e >= LEGIBLE) on = u;
    if (on !== null && off === null && u > W.close[0] && e < LEGIBLE) off = u;
  }
  return {on, off};
})();
// context datum: fades out just before the lens value text is legible, returns just after it has gone (gaps < 50 ms)
W.ctxOut = [HAND.on - 0.012, HAND.on - 0.002];
W.ctxChange = [HAND.off, HAND.off + 0.02];
W.ctxIn = [HAND.off + 0.002, HAND.off + 0.014];
const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const STRINGS = {
  en: {...PP_STRINGS.en, legend: 'In the plan'},
  es: {...PP_STRINGS.es, legend: 'En el plano'},
};

const sceneSchema = {
  ...ppFields,
  focusTarget: oneOf('Datum that is substituted: display = whether the document is shown on the shared screen (the copy leaves the screen, which goes to stand-by); document = the title of the document shown on the screen (the title and the page change). Values as supplied', ['display', 'document']),
  beforeValue: str('Value shown before the substitution, in its own chip under the screen', 80),
  afterValue: str('Value shown after the substitution (the alternative datum), in the same chip', 80),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens, relative to the plan at rest', 1.5, 4),
    placement: oneOf('Where the lens sits: auto (beside the plan where the panel is), or beside / above it', ['auto', 'beside', 'above']),
  }),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  ...PP_EN,
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'right1', label: 'Participant B'},
    {slot: 'right2', label: 'Participant C'},
  ],
  focusTarget: 'display',
  beforeValue: 'Shown on the shared screen (as supplied)',
  afterValue: 'Not shown on the shared screen (as supplied)',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'The room after the presentation, as supplied', marker: 'Changed: one supplied datum'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const log = [];
    let best = null;
    const fr = shape === 'landscape' ? [0.38, 0.42, 0.34] : shape === 'square' ? [0.42, 0.46, 0.38] : [0.44, 0.48, 0.52];
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const f of fr) {
        const L = compose(ctx, p, v / px, px, f);
        log.push(`${v}/${f}:k${L.k ? L.k.toFixed(2) : '-'}/rel${L.rel ? L.rel.toFixed(2) : '-'}/lens${L.lensShortPx ? Math.round(L.lensShortPx) : '-'}:${L.problems.join('+')}`);
        if (!L.G) continue;
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.rel > pick.rel + 0.02)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    if (!best) best = compose(ctx, p, 16.6 / px, px, fr[0], true);
    best.log = log.slice(-18);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const G = L.G;
    // one plan drawing, used twice: the context and (inside the lens) its enlarged copy
    const plan = (P, lens) => g({transform: L.pf.transform},
      lens ? L.lzRoom.node : L.room.node,
      lens ? null : lecternArt(ctx, G, {name: 'lectern'}),
      screenArt(ctx, G, {name: `${P}-screen`}),
      g({name: `${P}-copy`}, sheetArt(ctx, {name: `${P}-page1`, stroke: 1.2}), g({name: `${P}-page2`, opacity: 0}, page2Art(ctx, `${P}-p2`))),
      lens ? null : g({name: 'doc'}, sheetArt(ctx, {name: 'doc-sheet'})),
      lens ? null : L.people.map(pp => pp.node));
    return g(null,
      g({name: 'world'},
        plan('cx', false),
        L.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: `rm-chair-${L.seats[i].slot}`})),
        L.roomChip && L.roomChip.node,
        g({name: 'cx-stack'}, L.stack.node('cx')),
        g({name: 'cx-marker', opacity: 0}, changedMarker(ctx, {x: L.markerAt.x, y: L.markerAt.y, radius: Math.max(14, L.F * 0.62)})),
        h('rect', {name: 'src-frame', x: r(L.cropD.x), y: r(L.cropD.y), width: r(L.cropD.w), height: r(L.cropD.h), rx: 10, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0})),
      g({name: 'panel'}, L.panelNodes),
      L.guides.map((gd, i) => h('line', {name: `guide${i}`, x1: r(gd.a.x), y1: r(gd.a.y), x2: r(gd.b.x), y2: r(gd.b.y), stroke: th.accent2, 'stroke-width': 2.5, opacity: 0})),
      g({name: 'lens', opacity: 0, 'data-occludes': 1, transform: 'translate(0 0)'},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18}))),
        h('rect', {x: r(L.dest.x + 6), y: r(L.dest.y + 10), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: '#f5efe3'}),
        g({name: 'lens-body', opacity: 0, 'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: L.lensTransform},
            plan('lz', true),
            L.stack.node('lz'))),
        h('rect', {name: 'lens-border', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G;
    const nodes = {};
    const display = p.focusTarget === 'display';
    // ---- the lens: frame → the lens grows in the panel's place (the panel cross-fades with it, so the frame is never
    // near-empty) → the context datum gives way as the lens value text becomes legible
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1], W.close[1] + 0.02));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const open = lensOpenAt(u);
    const ls = lerp(0.6, 1, open); // (from 60 %: the enlarged text is >= the text floor at every size)
    const lc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
    const lensOp = lensOpOf(open);
    nodes.lens = {opacity: r(lensOp, 3), transform: `translate(${r(lc.x * (1 - ls), 2)} ${r(lc.y * (1 - ls), 2)}) scale(${r(ls, 4)})`};
    // the border and the enlarged copy (with its value text) come and go together (no empty outline, no late text)
    const body = lensBodyOf(open);
    nodes['lens-body'] = {opacity: r(body, 3)};
    const panelOp = clamp(1 - 1.25 * lensOp);
    nodes.panel = {opacity: r(panelOp, 3)};
    L.guides.forEach((gd, i) => { nodes[`guide${i}`] = {opacity: r(Math.min(fr, clamp((open - 0.9) / 0.1)), 3)}; });
    // ---- the substituted datum and its dependent geometry (in the context and in the lens alike)
    const lift = ease.inOutSine(seg(u, ...W.lift)), dock = ease.inOutCubic(seg(u, ...W.dock)), change = ease.inOutCubic(seg(u, ...W.change));
    const newIn = seg(u, ...W.newIn);
    Object.assign(nodes, L.stack.frame({lift, dock, newIn}));
    // the context copy of the datum is hidden while the lens holds it (sequenced hand-over)
    const ctxStack = (1 - seg(u, ...W.ctxOut)) + seg(u, ...W.ctxIn);
    nodes['cx-stack'] = {opacity: r(clamp(ctxStack), 3)};
    nodes['cx-marker'] = {opacity: r(seg(u, ...W.marker), 3)};
    // screen state: display → the copy leaves the screen, which goes to stand-by; document → title and page change
    // The lens copy changes in the substitution beat; the context keeps its before-state (only its datum
    // tag is hidden) and takes the change at the hand-over, so the after-state is in ONE place at a time.
    const stateAt = (c) => {
      const o = {copyScale: 1, copyOp: 1, lit: 1, page2: 0, page1: 1};
      if (display) {
        o.copyScale = lerp(1, 0.25, c);
        o.copyOp = 1 - clamp((c - 0.5) / 0.5);
        o.lit = 1 - clamp((c - 0.4) / 0.6);
      } else {
        // (sequenced: the old page goes before the new one arrives — never both at once)
        o.page2 = clamp((c - 0.5) / 0.5);
        o.page1 = 1 - clamp(c / 0.5);
      }
      return o;
    };
    const cxChange = ease.inOutCubic(seg(u, ...W.ctxChange));
    const st = {lz: stateAt(change), cx: stateAt(cxChange)};
    const {copyOp, lit, page2} = st.lz;
    const sh = G.shown;
    for (const P of ['cx', 'lz']) {
      const {copyScale, copyOp, lit, page2, page1} = st[P];
      nodes[`${P}-copy`] = {transform: T(sh.x, sh.y, 0, sh.scale * copyScale), opacity: r(copyOp, 3)};
      nodes[`${P}-page1`] = {opacity: r(page1, 3)};
      nodes[`${P}-page2`] = {opacity: r(page2, 3)};
      nodes[`${P}-screen-lit`] = {opacity: r(lit, 3)};
      nodes[`${P}-screen-idle`] = {opacity: r(1 - clamp(lit * 1.6), 3)};
    }
    nodes['lectern-lamp'] = {opacity: r(display ? st.cx.lit : 1, 3)};
    // ---- people: seated, the presenter at the lectern; the others look at where the document is
    const look = display ? ease.inOutSine(seg(u, ...W.look)) : 0;
    const heads = [];
    L.seats.forEach((s, i) => {
      if (i === L.pi) {
        Object.assign(nodes, holdPose(L.people[i], `p${i}`, {...G.lectern.stand, phase: 0, walk: 0, seated: 0}, {x: 0, y: -60}, 0));
        nodes[`p${i}-head`] = {transform: 'rotate(0 0 -1)'};
        heads.push(0);
        return;
      }
      const S = G.slots[s.slot];
      Object.assign(nodes, L.people[i].pose({x: S.x, y: S.y, deg: S.deg, phase: 0, walk: 0, seated: 1}));
      const a0 = lookAngle(S, G.screen.c), a1 = lookAngle(S, G.lectern.plateC);
      const a = lerp(a0, a1, look);
      Object.assign(nodes, headTurn(`p${i}`, a));
      heads.push(r(Math.max(-70, Math.min(70, a)), 1));
    });
    nodes.doc = {transform: T(G.lectern.plateC.x, G.lectern.plateC.y, 0)};
    L.labels.forEach((sl, i) => { if (sl) { nodes[`lab${i}`] = {opacity: 1}; nodes[`lab${i}-text`] = {opacity: 1}; } });
    Object.assign(nodes, L.room.door.frame(0), L.lzRoom.door.frame(0));
    if (L.noteNode) nodes['panel-note'] = {opacity: r(seg(u, ...W.marker), 3)};
    const datum = u < W.newIn[0] ? 'before' : 'after';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {
      nodes,
      semantic: {
        beat,
        datum,
        focusTarget: p.focusTarget,
        lensOpen: r(open, 3),
        lensBody: r(body, 3),
        ctxDatum: r(clamp(ctxStack), 3),
        lensDatum: r(body, 3),
        newValue: r(newIn, 3),
        dock: r(dock, 3),
        screen: lit >= 0.99 ? 'lit' : lit <= 0.01 ? 'idle' : 'changing',
        copy: r(copyOp, 3),
        ctxScreen: st.cx.lit >= 0.99 ? 'lit' : st.cx.lit <= 0.01 ? 'idle' : 'changing',
        ctxPage: st.cx.page2 >= 0.99 ? 2 : st.cx.page2 <= 0.01 ? 1 : 'changing',
        page: page2 >= 0.99 ? 2 : page2 <= 0.01 ? 1 : 'changing',
        heads,
        markerShown: r(seg(u, ...W.marker), 3),
        panel: r(clamp(panelOp), 3),
        relMagnification: r(L.rel, 3),
        lensShortPx: r(L.lensShortPx, 1),
        cropD: {x: r(L.cropD.x), y: r(L.cropD.y), w: r(L.cropD.w), h: r(L.cropD.h)},
        dest: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        region: L.regionName,
        log: L.log,
      },
    };
  },
};

/** The second page variant (a small table of blocks instead of lines) for the document datum. */
function page2Art(ctx, name) {
  const w = DOC.w, hh = DOC.h;
  const cells = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) cells.push(h('rect', {x: r(-w / 2 + w * 0.14 + j * w * 0.38, 2), y: r(-hh / 2 + hh * (0.32 + i * 0.17), 2), width: r(w * 0.32, 2), height: r(hh * 0.12, 2), rx: 1, fill: '#b9c6d3'}));
  return g({name},
    h('rect', {x: r(-w / 2, 2), y: r(-hh / 2, 2), width: r(w, 2), height: r(hh, 2), rx: 2, fill: '#fffdf7', stroke: '#1f2328', 'stroke-width': 1.2}),
    h('rect', {x: r(-w / 2 + w * 0.14, 2), y: r(-hh / 2 + hh * 0.1, 2), width: r(w * 0.5, 2), height: r(hh * 0.1, 2), rx: 1.5, fill: '#7f93a8'}),
    cells);
}

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, f, force = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const {seats, presenter} = resolvePP(ctx, p);
  const pi = presenter ? seats.indexOf(presenter) : -1;
  const frameShort = Math.min(ctx.view.width, ctx.view.height);
  // ---- regions: the panel (and later the lens) on the screen's side of the plan — left on wide and square frames,
  // above on tall ones (placement 'above' forces the band; 'beside' the column)
  const band = p.detailGeometry.placement === 'above' || (p.detailGeometry.placement !== 'beside' && shape === 'portrait');
  const region = band ? {x: 0, y: 0, w: D.w, h: D.h * f} : {x: 0, y: 0, w: D.w * f, h: D.h};
  const planBox = band ? {x: 0, y: region.h + 24, w: D.w, h: D.h - region.h - 24} : {x: region.w + 28, y: 0, w: D.w - region.w - 28, h: D.h};
  // ---- the plan: a wide room, or a narrow one (tables side by side) when the plan box is narrow
  const narrow = planBox.w / planBox.h < 1.05 && !band;
  const screenW = narrow ? 280 : SCREEN.w;
  const {W: RW, H: RH, k} = fitPP(planBox, narrow ? {W: 640, H: 600} : {W: 860, H: 620});
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  // the context occupies >= 0.45 of the frame width
  const frameW = ctx.view.width / ((px * frameShort) / 1080);
  if ((RW + 36) * k < 0.45 * frameW) problems.push('narrow-context');
  // (the screen shows the page only: the document's title is in the panel's legend, and for the document datum the
  // substituted value is the chip under the screen)
  const display = p.focusTarget === 'display';
  // ---- the datum stack under the screen (value chip; the "was" dock under it), design units; measured first so
  // the tables keep clear of it (the room's first table starts below the stack)
  const stack = datumStack(ctx, {F, maxW: screenW * k - 8, before: p.beforeValue, after: p.afterValue, was: ctx.t.was, showKey});
  if (stack.problem) problems.push(stack.problem);
  stack.place({x: 0, top: 0});
  const stackH = stack.boxes().reduce((m, q) => Math.max(m, q.y + q.h), 0);
  const G = ppGeometry(RW, RH, {titleBand: 14, screenW, clearBelowScreen: stackH ? (stackH + 10 + 16) / k : 0});
  if (G.pageH < 80) problems.push('page');
  if (Math.max(...Object.values(G.slots).map(q => q.y)) + 50 > RH) problems.push('room-deep');
  const pf = planFrame(G.extents, planBox, k);
  const toD = pf.toD;
  const rad = PERSON_RAD * k;
  const people = seats.map((s, i) => planPerson(ctx, {name: `p${i}`, look: s.look}));
  const scrD = pf.mapBox(G.screen);
  stack.place({x: scrD.x + 4, top: scrD.y + scrD.h + 10});
  const sb = stack.boxes();
  // ---- the crop (template units): the screen and its datum stack, a small margin; the lens: region-sized
  // (the crop's top includes the screen's wall-mount bracket, drawn in the wall above the screen, so the rim never cuts it)
  const cropTop = Math.min(scrD.y - 10, pf.mapBox({x: 0, y: -G.t / 2 - 2, w: 1, h: 1}).y - 6);
  const cropD0 = {x: scrD.x - 12, y: cropTop, w: scrD.w + 24, h: (sb.length ? Math.max(...sb.map(b => b.y + b.h)) : scrD.y + scrD.h) - cropTop + 12};
  const room = G.extents;
  // (kept inside the room's drawn area)
  const cropD = {...cropD0};
  // (labels hidden: no datum stack, so the crop keeps enough of the floor under the screen for the lens's smaller
  // side to stay a real inspection, >= 0.36 of the short side)
  if (!sb.length) {
    const relW = Math.min((region.w - 16) / cropD.w, p.detailGeometry.zoom);
    cropD.h = Math.max(cropD.h, Math.min((0.36 * 1080) / px / relW, cropD.w));
  }
  const rel = Math.min((region.w - 16) / cropD.w, (region.h - 16) / cropD.h, p.detailGeometry.zoom);
  if (rel < 1.52) problems.push('lens-weak');
  const dw = cropD.w * rel, dh = cropD.h * rel;
  const dest = {x: region.x + (region.w - dw) / 2, y: region.y + (region.h - dh) / 2, w: dw, h: dh};
  // (px at 1080p on the frame's short side: the lens's smaller side >= 0.35 of it)
  const lensShortPx = Math.min(dw, dh) * px;
  if (lensShortPx < 0.352 * 1080) problems.push('lens-small');
  const lensTransform = `${T(dest.x - cropD.x * rel, dest.y - cropD.y * rel)} scale(${r(rel, 4)})`;
  // the lens copy: plan pieces wholly inside the crop only (floor and walls are clipped by the lens rim)
  const cropT = {x: (cropD.x - pf.ox) / k, y: (cropD.y - pf.oy) / k, w: cropD.w / k, h: cropD.h / k};
  const inCrop = b => b.x >= cropT.x && b.y >= cropT.y && b.x + b.w <= cropT.x + cropT.w && b.y + b.h <= cropT.y + cropT.h;
  const roomArtNode = ppRoomArt(ctx, G, {prefix: 'rm', chairs: seats.map(s => s.slot)});
  const lzRoom = ppRoomArt(ctx, G, {prefix: 'lzrm', chairs: seats.map(s => s.slot), keep: inCrop});
  void room;
  // guides: from the frame's corners facing the lens to the lens's facing corners
  const guides = band
    ? [{a: {x: cropD.x, y: cropD.y}, b: {x: dest.x, y: dest.y + dest.h}}, {a: {x: cropD.x + cropD.w, y: cropD.y}, b: {x: dest.x + dest.w, y: dest.y + dest.h}}]
    : [{a: {x: cropD.x, y: cropD.y}, b: {x: dest.x + dest.w, y: dest.y}}, {a: {x: cropD.x, y: cropD.y + cropD.h}, b: {x: dest.x + dest.w, y: dest.y + dest.h}}];
  // ---- people labels (the context), clear of the datum stack and the crop
  const furnAll = ppFurniture(G);
  const occupied = new Set(seats.map(s => s.slot));
  const furn = furnAll.filter(q => q.kind !== 'chair' || !occupied.has(q.slot)).map(pf.mapBox);
  const hard = furnAll.filter(q => ['desk', 'table', 'lectern', 'screen', 'plant'].includes(q.kind)).map(pf.mapBox);
  const never = furnAll.filter(q => q.kind === 'screen' || q.kind === 'lectern').map(pf.mapBox);
  const at = i => (i === pi ? toD(G.lectern.stand) : toD(G.slots[seats[i].slot]));
  const everyone = seats.map((s, i) => bodyBox(at(i), i === pi ? 0 : G.slots[s.slot].deg, rad));
  const roomBox = pf.mapBox({x: 6, y: 6, w: G.W - 12, h: G.H - 12});
  const extra = [cropD];
  const labels = seats.map(() => null);
  if (showKey) {
    const res = placeSeatLabels(ctx, {size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 40 / px, pathPad: rad * 0.45, seatPoints: seats.map((s, i) => at(i)), hard, hardAlways: never,
      items: seats.map((s, i) => ({key: `s${i}`, text: s.label, at: at(i), rad})), people: everyone, furniture: furn, bounds: roomBox, extra});
    res.labels.forEach((lb, i) => { labels[i] = lb; extra.push(lb.box); });
    problems.push(...res.fails.map(q => `lab-${q}`));
  }
  // the room name
  let roomChip = null;
  if (showKey) {
    const ropts = {maxWidth: Math.max(220 / px, Math.min(360 / px, roomBox.w * 0.4)), size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent2};
    const probe = gchip(ctx, p.courts.room, {x: 0, y: 0, ...ropts});
    let spot = null;
    for (let y = roomBox.y + roomBox.h - probe.box.h; y >= roomBox.y && !spot; y -= 10) {
      for (let x = roomBox.x; x <= roomBox.x + roomBox.w - probe.box.w; x += 10) {
        const b = {x, y, w: probe.box.w, h: probe.box.h};
        if (extra.some(q => overlaps(b, q, 6)) || hard.some(q => overlaps(b, q, 4)) || everyone.some(q => overlaps(b, {x: q.x - (q.hw || q.rad) - 4, y: q.y - (q.hh || q.rad) - 4, w: 2 * (q.hw || q.rad) + 8, h: 2 * (q.hh || q.rad) + 8}, 0))) continue;
        spot = b;
        break;
      }
    }
    if (!spot) problems.push('room');
    const s0 = spot || {x: roomBox.x, y: roomBox.y};
    roomChip = gchip(ctx, p.courts.room, {x: s0.x, y: s0.y, ...ropts, name: 'room-name'});
  }
  // ---- the panel (in the lens region): building, names, legend, context caption, key, marker note
  const pan = panelNodes(ctx, p, F, region, band, showKey, showAll);
  if (pan.problem) problems.push(pan.problem);
  // the changed marker: beside the datum's value chip
  const vb = stack.valueBox();
  const markerAt = {x: vb.x + vb.w + Math.max(14, F * 0.62) + 8, y: vb.y + vb.h / 2};
  if (markerAt.x + 20 > pf.rect.x + pf.rect.w) problems.push('marker');
  return {
    F, px, k, G, pf, seats, pi, people, room: roomArtNode, lzRoom, stack, labels, roomChip, cropD, dest, rel, lensShortPx, lensTransform, guides,
    panelNodes: pan.nodes, noteNode: pan.note, markerAt, problems, personPx, regionName: band ? 'band' : 'column',
  };
}

/** The datum's value chip (old → new) and the "was" dock under it; both copies (context 'cx', lens 'lz'). */
function datumStack(ctx, o) {
  const th = ctx.theme;
  const {F} = o;
  const fit = t => fitWords(glue(t), {maxWidth: o.maxW - F * 1.2, size: F, minSize: F, maxLines: 4, weight: 500});
  const before = o.showKey ? fit(o.before) : null, after = o.showKey ? fit(o.after) : null, was = o.showKey ? fit(`${o.was}: ${o.before}`) : null;
  const problem = [before, after, was].some(q => q && q.truncated) ? 'stack-trunc' : null;
  const padX = F * 0.6, padY = F * 0.38;
  let geo = null;
  const textEl = (fit2, x, y, fill) => h('text', {x: r(x), y: r(y + fit2.size * 0.8), 'font-family': FONT, 'font-size': r(fit2.size, 2), 'font-weight': fit2.weight, 'text-anchor': 'middle', fill},
    fit2.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit2.lineHeight, 2)}, ln)));
  return {
    problem,
    place({x, top}) {
      if (!o.showKey) { geo = {vb: {x, y: top, w: 0, h: 0}, kb: {x, y: top, w: 0, h: 0}}; return; }
      const wV = Math.max(before.width, after.width) + padX * 2, hV = Math.max(before.height, after.height) + padY * 2;
      const wK = was.width + padX * 2, hK = was.height + padY * 2;
      geo = {vb: {x, y: top, w: wV, h: hV}, kb: {x, y: top + hV + F * 0.3, w: wK, h: hK}};
    },
    boxes() { return o.showKey ? [geo.vb, geo.kb] : []; },
    valueBox() { return geo.vb; },
    node(P) {
      if (!o.showKey) return null;
      const {vb, kb} = geo;
      const chip = (name, box, fit2, stroke, fill, col, sw, op) => g({name, opacity: op},
        h('path', {name: `${name}-body`, d: roundRectPath(box.x, box.y, box.w, box.h, Math.min(box.h / 2, F * 0.7)), fill, stroke, 'stroke-width': sw}),
        g({name: `${name}-text`}, textEl(fit2, box.x + box.w / 2, box.y + (box.h - fit2.height) / 2, col)));
      return g({name: `${P}-datum`},
        chip(`${P}-old`, vb, before, th.ink, th.card, th.ink, 2.2, 1),
        chip(`${P}-dock`, kb, was, th.inkFaint, th.paperShade, th.inkSoft, 1.8, 0),
        chip(`${P}-new`, vb, after, th.accent2, th.card, th.ink, 3, 0));
    },
    frame({lift, dock, newIn}) {
      const out = {};
      if (!o.showKey) return out;
      const {vb, kb} = geo;
      for (const P of ['cx', 'lz']) {
        // the old value lifts slightly, turns muted, then travels into the dock (it never overlaps the new value)
        const tx = kb.x - vb.x, ty = kb.y - vb.y;
        out[`${P}-old`] = {transform: T(tx * dock, ty * dock - 6 * lift * (1 - dock)), opacity: dock >= 1 ? 0 : 1};
        out[`${P}-old-text`] = {opacity: r(1 - 0.4 * lift, 3)};
        out[`${P}-dock`] = {opacity: dock >= 1 ? 1 : 0};
        out[`${P}-new`] = {opacity: r(newIn, 3)};
      }
      return out;
    },
  };
}

/** The panel: building, names, legend of the plan objects, context caption, key and the marker note. */
function panelNodes(ctx, p, F, R, band, showKey, showAll) {
  const th = ctx.theme;
  const nodes = [];
  let problem = null;
  // (a tall frame's band: the building is drawn larger so the band reads as part of the scene at rest; with no
  // panel text it stands alone, centred in the band)
  const bW = band ? (showKey ? Math.min(R.h * 0.62, R.w * 0.34, 300) : Math.min(R.h * 0.85, R.w * 0.5, 420)) : showKey ? Math.min(R.w * 0.55, 220) : Math.min(R.w * 0.75, R.h * 0.55, 420);
  const bH = bW * 1.05;
  const textX = band ? R.x + bW + 30 : R.x;
  const textW = band ? R.w - bW - 30 : R.w;
  let y = band ? R.y : R.y + bH + F * 0.4;
  const bX = band ? (showKey ? R.x : R.x + (R.w - bW) / 2) : R.x + (R.w - bW) / 2;
  const bY = !showKey ? R.y + Math.max(0, (R.h - bH) / 2) : R.y;
  nodes.push(buildingElevation(ctx, {name: 'bld', x: bX, y: bY, w: bW, h: bH, floors: 3, bays: 5, highlight: {floor: 1, bay: 3}}).node);
  const fitT = (t, weight = 500, lines = 4, w = textW) => fitWords(glue(t), {maxWidth: w, size: F, minSize: F, maxLines: lines, weight});
  const items = [];
  if (showKey) items.push({kind: 'names', fit: fitT(`${p.courts.building} · ${p.courts.room}`, 600, 4)});
  if (showAll) {
    const glyph = F * 2;
    for (const [kind, text] of [['screen', p.labels.screen], ['camera', p.labels.camera], ['sheet', p.labels.document]]) items.push({kind: 'legend', glyphKind: kind, glyph, fit: fitT(text, 500, 3, textW - glyph - 12)});
    items.push({kind: 'context', fit: fitT(p.contextLabels.context, 500, 3)});
  }
  if (showKey) items.push({kind: 'key', fit: fitT(p.labels.key, 500, 4)});
  let note = null;
  if (showKey) items.push({kind: 'note', fit: fitT(p.contextLabels.marker, 700, 3, textW - F * 1.9)});
  for (const it of items) if (it.fit.truncated) problem = 'panel-trunc';
  const gap = F * 0.55;
  const hOf = it => (it.kind === 'legend' ? Math.max(it.glyph, it.fit.height) : it.fit.height);
  const total = items.reduce((a, it) => a + hOf(it) + gap, 0);
  const avail = band ? R.h : R.h - bH - F * 0.4;
  if (total - gap > avail + 0.5) problem = 'panel';
  for (const it of items) {
    if (it.kind === 'legend') {
      const hh = Math.max(it.glyph, it.fit.height);
      nodes.push(g({name: `legend-${it.glyphKind}`}, g({transform: T(textX + it.glyph / 2, y + hh / 2)}, ppGlyph(ctx, it.glyphKind, it.glyph, null)), textAt(it.fit, textX + it.glyph + 12, y + (hh - it.fit.height) / 2, th.fg)));
    } else if (it.kind === 'note') {
      const rr = Math.max(12, F * 0.55);
      note = g({name: 'panel-note', opacity: 0}, changedMarker(ctx, {x: textX + rr + 2, y: y + F * 0.55, radius: rr}), textAt(it.fit, textX + F * 1.9, y, th.fg, {weight: 700}));
      nodes.push(note);
    } else if (it.kind === 'key') {
      nodes.push(g({name: 'key'}, h('path', {d: `M${r(textX)} ${r(y - F * 0.2)}H${r(textX + Math.min(textW, it.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(it.fit, textX, y + F * 0.2, th.fgSoft, {italic: true})));
    } else nodes.push(g({name: `panel-${it.kind}`}, textAt(it.fit, textX, y, th.fg, {weight: it.kind === 'names' ? 600 : 500})));
    y += hOf(it) + gap;
  }
  // (the building and its text block are centred in the panel's height: a band's, or a column's)
  if (showKey) {
    const blockH = band ? Math.max(bH, total - gap) : bH + F * 0.4 + total - gap;
    const off = Math.max(0, (R.h - blockH) / 2);
    return {nodes: [g({transform: T(0, off)}, nodes)], note, problem};
  }
  return {nodes, note, problem};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-07-inspect',
    title: 'Presenting a document in the room — inspecting the shared screen and one supplied datum',
    titleEs: 'Presentación de una prueba en sala — Inspección de un detalle',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Presentación de una prueba en sala',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The plan of a generic hearing room after the presentation: the enlarged copy of a fictional sheet on the shared screen, the presenter at the lectern. A lens opens beside the plan on a real enlarged copy of the screen and the supplied datum under it; one datum is substituted — whether the document is shown on the screen, or the title shown on it — and only its dependent geometry follows. The old value stays traceable as “was: …”, the lens closes and a neutral Δ marks the changed datum. Nothing about admissibility, weight or rulings is shown.',
    tags: ['inspect', 'lens', 'floor plan', 'document', 'shared screen', 'changed datum', 'hearing room'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/presentacion-de-prueba.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
