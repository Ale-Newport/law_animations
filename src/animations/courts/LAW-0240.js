/**
 * LAW-0240 — Adaptación de accesibilidad · inspect
 *
 * Storyboard (the context is the state produced by the story: the floor plan of the generic building's ground floor,
 * the participants at their places in the hearing room, the supports in view; the panel with the building, the legend
 * and the key beside the plan):
 *  0.00–0.20  build: the plan at rest; under the main entrance, the supplied datum that will change (e.g. "Ramp with
 *             handrails beside the steps (as supplied)") in its own chip.
 *  0.20–0.45  isolate: a frame settles on the entrance and its datum, and a lens opens where the panel was (the panel
 *             cross-fades out as the lens appears) — a REAL enlarged copy (>= 1.5× the plan at rest) of the same plan
 *             coordinates, tied to the frame by two solid guides; the context copy of the datum gives way as the lens
 *             copy becomes legible. Pieces enter the lens whole or not at all.
 *  0.45–0.75  substitute ONE datum inside the lens: the old value lifts, turns muted and docks under the new one as
 *             "was: …" (never struck); only its dependent geometry follows — the ramp (or the steps' handrails) leaves
 *             or appears, as supplied. The context keeps its before-state until the hand-over.
 *  0.75–1.00  return: the lens closes (the panel returns as it goes); the context takes the change as the lens value
 *             text stops being legible, the datum (with its "was" dock) is back under the entrance with a neutral
 *             changed-datum marker (Δ). Seeking back restores the old datum exactly. No standard, measurement,
 *             obligation, compliance or outcome is inferred; "barrier detected" is only a supplied observation.
 * @module animations/courts/LAW-0240
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  aaFields, AA_EN, AA_STRINGS, resolveAA, fitAA, AA_MIN_COMPACT, aaGeometry, routeFor, aaProps, aaPlanArt, aaPerson, aaGlyph,
  placeChip, chipNode, chipFit, buildingElevation, planFrame, pxPerUnit, R2, overlaps, glue, fitWords, textAt, FONT,
  localizeAA, AA_ES,
} from './kits/adaptacion-accesibilidad.js';

const ID = 'LAW-0240';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.2, 0.23], open: [0.21, 0.29],
  lift: [0.46, 0.5], dock: [0.5, 0.54], change: [0.54, 0.62], newIn: [0.62, 0.65],
  close: [0.72, 0.77], marker: [0.8, 0.84],
};
// The lens window and its enlarged copy (and so the copy's value text) come in and go out TOGETHER; the hand-over
// with the context copy is timed on the moment the lens value text becomes / stops being legible (>= 0.15 effective
// opacity), found once from the windows above (pure constants, so the frame stays a pure function of u).
const lensOpenAt = u => ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
// (the window turns opaque within the first ~5 % of its opening — a short cross-fade with the panel it replaces — and
// grows from 85 % size; its copy arrives with it)
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

const STRINGS = {
  en: {...AA_STRINGS.en},
  es: {...AA_STRINGS.es},
};

const sceneSchema = {
  ...aaFields,
  focusTarget: oneOf('The entrance detail whose supplied datum is substituted: ramp = the ramp with handrails beside the steps; handrails = the handrails on both sides of the steps. Values as supplied (an observation of the configured example, not an assessment)', ['ramp', 'handrails']),
  beforeValue: str('Value shown before the substitution, in its own chip under the entrance', 80),
  afterValue: str('Value shown after the substitution (the alternative datum), in the same chip', 80),
  detailGeometry: obj('Lens geometry and the supplied change', {
    zoom: num('Largest magnification of the lens, relative to the plan at rest', 1.5, 4),
    placement: oneOf('Where the lens sits: auto (where the panel is), or beside / above the plan', ['auto', 'beside', 'above']),
    change: oneOf('What the substitution does to the detail, as supplied: present-to-absent or absent-to-present', ['present-to-absent', 'absent-to-present']),
  }),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  ...AA_EN,
  focusTarget: 'ramp',
  beforeValue: 'Ramp with handrails beside the steps (as supplied)',
  afterValue: 'Steps only: barrier detected (as supplied)',
  detailGeometry: {zoom: 2.6, placement: 'auto', change: 'present-to-absent'},
  contextLabels: {context: 'Everyone at their place in the room, as supplied', marker: 'Changed: one supplied datum'},
};

// Spanish defaults: with locale "es", each param left at its English default switches to this value (a value the
// author supplied is never replaced).
const defaultParamsEs = {...AA_ES, ...{
  "courts": {
    "building": "Edificio cívico (ficticio)",
    "room": "Sala de vistas 2 (ficticia)"
  },
  "seats": [
    {
      "label": "Participante A",
      "mode": "wheelchair",
      "place": "left"
    },
    {
      "label": "Participante B",
      "mode": "cane",
      "place": "right"
    }
  ],
  "labels": {
    "ramp": "Rampa con pasamanos",
    "tactile": "Franja táctil de guía",
    "sign": "Señal junto a la puerta",
    "key": "Según lo aportado · sin conclusión"
  },
  "beforeValue": "Rampa con pasamanos junto a los escalones (según lo aportado)",
  "afterValue": "Solo escalones: barrera detectada (según lo aportado)",
  "contextLabels": {
    "context": "Cada participante en su lugar de la sala, según lo aportado",
    "marker": "Cambiado: un dato aportado"
  }
}};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const log = [];
    let best = null;
    const fr = shape === 'landscape' ? [0.34, 0.38, 0.42] : shape === 'square' ? [0.42, 0.44, 0.46, 0.47] : [0.3, 0.34, 0.38, 0.42, 0.46];
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const list of [false, true]) for (const f of fr) for (const compact of [false, true]) {
        if (list && pick) break;
        const L = compose(ctx, p, v / px, px, f, false, compact, list);
        log.push(`${v}/${f}${compact ? 'c' : ''}${list ? 'l' : ''}:k${L.k ? L.k.toFixed(2) : '-'}/rel${L.rel ? L.rel.toFixed(2) : '-'}/lens${L.lensShortPx ? Math.round(L.lensShortPx) : '-'}:${L.problems.join('+')}`);
        if (!L.G) continue;
        if (!best || L.problems.length < best.problems.length) best = L;
        // (among clean candidates: the larger context, then the stronger lens)
        const score = Q => Q.personPx + 25 * Math.min(Q.rel, 2);
        if (!L.problems.length && (!pick || score(L) > score(pick) + 0.5)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    if (!best || !best.G) best = compose(ctx, p, 16.6 / px, px, fr[0], true);
    best.log = log.slice(-18);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({name: 'world'},
        g({transform: L.pf.transform}, L.art.node, L.people.map(pp => pp.node)),
        L.chips.map(c => c.node),
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
            g({transform: L.pf.transform}, L.lzArt.node),
            L.stack.node('lz'))),
        h('rect', {name: 'lens-border', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G;
    const nodes = {};
    // ---- the lens: frame → the lens grows in the panel's place (the panel cross-fades with it) → the context datum
    // gives way as the lens value text becomes legible
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1], W.close[1] + 0.02));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const open = lensOpenAt(u);
    const ls = lerp(0.85, 1, open); // (from 85 %: the enlarged text is >= the text floor at every size, and the window
    // covers its region from the start while the panel is away)
    const lc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
    const lensOp = lensOpOf(open);
    nodes.lens = {opacity: r(lensOp, 3), transform: `translate(${r(lc.x * (1 - ls), 2)} ${r(lc.y * (1 - ls), 2)}) scale(${r(ls, 4)})`};
    const body = lensBodyOf(open);
    nodes['lens-body'] = {opacity: r(body, 3)};
    // (the panel and the lens are never visible together: the panel has gone before the window starts to open, and
    // returns only once the window has closed)
    const panelOp = u < 0.5 ? 1 - seg(u, W.open[0] - 0.018, W.open[0] - 0.002) : seg(u, W.close[1] + 0.002, W.close[1] + 0.02);
    nodes.panel = {opacity: r(panelOp, 3)};
    L.guides.forEach((gd, i) => { nodes[`guide${i}`] = {opacity: r(Math.min(fr, clamp((open - 0.9) / 0.1)), 3)}; });
    // ---- the substituted datum
    const lift = ease.inOutSine(seg(u, ...W.lift)), dock = ease.inOutCubic(seg(u, ...W.dock)), change = ease.inOutCubic(seg(u, ...W.change));
    const newIn = seg(u, ...W.newIn);
    Object.assign(nodes, L.stack.frame({lift, dock, newIn}));
    const ctxStack = (1 - seg(u, ...W.ctxOut)) + seg(u, ...W.ctxIn);
    nodes['cx-stack'] = {opacity: r(clamp(ctxStack), 3)};
    nodes['cx-marker'] = {opacity: r(seg(u, ...W.marker), 3)};
    // ---- the dependent geometry: the detail leaves (or appears); the lens copy in the substitution beat, the context
    // at the hand-over — so the after-state is in ONE place at a time
    const cxChange = ease.inOutCubic(seg(u, ...W.ctxChange));
    const presentAt = c => (L.toAbsent ? 1 - c : c);
    const amount = {lz: presentAt(change), cx: presentAt(cxChange)};
    for (const [P, pre] of [['cx', 'rm'], ['lz', 'lzrm']]) {
      const a = amount[P];
      if (L.focus === 'ramp') {
        if (L.hasNode[P]) nodes[`${P}-ramp`] = {opacity: r(clamp(a * 1.4 - 0.2), 3), transform: `translate(${r(L.rampPivot * (1 - a), 2)} 0) scale(${r(Math.max(0.001, a), 4)} 1)`};
      } else if (L.hasNode[P]) nodes[`${pre}-srails`] = {opacity: r(a, 3)};
    }
    // ---- people at their places (the hold of the story)
    L.seats.forEach((s, i) => {
      const end = L.routes[i].poly.at(1);
      Object.assign(nodes, L.people[i].pose({x: end.x, y: end.y, deg: 0, phase: 0, walk: 0, seated: s.mode === 'wheelchair' ? 0 : 1}));
    });
    L.chips.forEach(c => { nodes[c.name] = {opacity: 1}; });
    Object.assign(nodes, L.art.doors.main.frame(0), L.art.doors.side.frame(0), L.art.doors.room.frame(0), L.lzArt.doors.main.frame(0), L.lzArt.doors.side.frame(0), L.lzArt.doors.room.frame(0));
    if (L.noteNode) nodes['panel-note'] = {opacity: r(seg(u, ...W.marker), 3)};
    const datum = u < W.newIn[0] ? 'before' : 'after';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const st = a => (a >= 0.999 ? 'present' : a <= 0.001 ? 'absent' : 'changing');
    return {
      nodes,
      semantic: {
        beat,
        datum,
        focusTarget: p.focusTarget,
        lensOpen: r(open, 3),
        lensBody: r(body, 3),
        ctxDatum: r(clamp(ctxStack), 3),
        newValue: r(newIn, 3),
        dock: r(dock, 3),
        detail: st(amount.lz),
        ctxDetail: st(amount.cx),
        markerShown: r(seg(u, ...W.marker), 3),
        panel: r(clamp(panelOp), 3),
        relMagnification: r(L.rel, 3),
        lensShortPx: r(L.lensShortPx, 1),
        cropD: {x: r(L.cropD.x), y: r(L.cropD.y), w: r(L.cropD.w), h: r(L.cropD.h)},
        dest: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
        people: L.seats.map((s, i) => R2(L.pf.toD(L.routes[i].poly.at(1)))),
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

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, f, force = false, compact = false, listPeople = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const {seats} = resolveAA(ctx, p);
  const frameShort = Math.min(ctx.view.width, ctx.view.height);
  const focus = p.focusTarget === 'handrails' ? 'handrails' : 'ramp';
  const toAbsent = p.detailGeometry.change !== 'absent-to-present';
  // ---- regions: the panel (and later the lens) beside the plan — a column on wide and square frames, a band above
  // the plan on tall ones
  const band = p.detailGeometry.placement === 'above' || (p.detailGeometry.placement !== 'beside' && shape === 'portrait');
  // (tall frames: the band UNDER the plan, next to the entrance at the plan's bottom, so the guides stay short)
  const region = band ? {x: 0, y: D.h * (1 - f), w: D.w, h: D.h * f} : {x: 0, y: 0, w: D.w * f, h: D.h};
  // ---- the datum stack (value chip; the "was" dock under it) sits under the plan, below the entrance
  const gapR = shape === "square" ? 18 : 28;
  const planBox0 = band ? {x: 0, y: 0, w: D.w, h: D.h - region.h - 24} : {x: region.w + gapR, y: 0, w: D.w - region.w - gapR, h: D.h};
  // (first pass: the plan's scale without the stack, to size the stack to the entrance's width)
  const minP = compact ? AA_MIN_COMPACT : undefined;
  const pre = fitAA({...planBox0, h: planBox0.h * 0.78}, minP);
  const Gp = aaGeometry(pre.W, pre.H, {compact});
  const entW = (Gp.steps.x + Gp.steps.w + 16 - (Gp.ramp.x - 16)) * pre.k;
  const stack = datumStack(ctx, {F, maxW: Math.max(entW, 160 / px), before: p.beforeValue, after: p.afterValue, was: ctx.t.was, showKey});
  if (stack.problem) problems.push(stack.problem);
  stack.place({x: 0, top: 0});
  const stackH = stack.boxes().reduce((m, q) => Math.max(m, q.y + q.h), 0);
  const planBox = {...planBox0, h: planBox0.h - (stackH ? stackH + 14 : 0)};
  const {W: PW, H: PH, k} = fitAA(planBox, minP);
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  // the context occupies >= 0.45 of the frame width
  const frameW = ctx.view.width / ((px * frameShort) / 1080);
  if ((PW + 36) * k < 0.45 * frameW) problems.push('narrow-context');
  const G = aaGeometry(PW, PH, {compact});
  // (the plan sits at the top of its box; the stack under it)
  const pf = planFrame(G.extents, {...planBox, y: planBox.y, h: (PH + G.t) * k}, k);
  const toD = pf.toD;
  const rad = 56 * k;
  const seatsW = seats.filter(s => s.mode === 'wheelchair').map(s => s.place);
  // which copies hold the detail node (the ramp is drawn only when it exists at some point: always, here)
  const art = aaPlanArt(ctx, G, {prefix: 'rm', ramp: true, rampName: 'cx-ramp', wheelchairPlaces: seatsW});
  const people = seats.map((s, i) => aaPerson(ctx, {name: `p${i}`, look: s.look, mode: s.mode}));
  const routes = seats.map(s => routeFor(G, s, s.mode === 'wheelchair' ? 'ramp' : 'steps'));
  // ---- the crop: the entrance (ramp, landing, steps with their handrails) and the datum stack under the plan
  const entT = {x: G.ramp.x - 16, y: G.Hi + G.t - 14, w: G.steps.x + G.steps.w + 16 - (G.ramp.x - 16), h: G.steps.y + G.steps.h + 14 - (G.Hi + G.t - 14)};
  const entD = pf.mapBox(entT);
  const planBottom = pf.rect.y + pf.rect.h;
  stack.place({x: entD.x + Math.max(0, (entD.w - (stack.boxes()[0] ? Math.max(...stack.boxes().map(b => b.w)) : 0)) / 2), top: planBottom + 10});
  const sb = stack.boxes();
  const cropD0 = {x: Math.min(entD.x, ...sb.map(b => b.x)) - 8, y: entD.y - 8, w: 0, h: 0};
  cropD0.w = Math.max(entD.x + entD.w, ...sb.map(b => b.x + b.w)) + 8 - cropD0.x;
  cropD0.h = (sb.length ? Math.max(...sb.map(b => b.y + b.h)) : entD.y + entD.h) + 10 - cropD0.y;
  const cropD = {...cropD0};
  // (labels hidden: no stack — the crop keeps enough of the pavement for the lens's smaller side to stay a real
  // inspection, >= 0.36 of the short side)
  if (!sb.length) {
    const relW = Math.min((region.w - 16) / cropD.w, p.detailGeometry.zoom);
    const need = Math.min((0.37 * 1080) / px / relW, cropD.w);
    if (need > cropD.h) { const add = need - cropD.h; const up = Math.min(add, cropD.y - pf.rect.y); cropD.y -= up; cropD.h += up; cropD.h = Math.max(cropD.h, Math.min(need, planBottom - cropD.y)); }
  }
  const rel = Math.min((region.w - 16) / cropD.w, (region.h - 16) / cropD.h, p.detailGeometry.zoom);
  if (rel < 1.52) problems.push('lens-weak');
  const dw = cropD.w * rel, dh = cropD.h * rel;
  // (tall frames: the lens sits low in its band, so the guides from the crop above are visible lines, not stubs)
  const dest = {x: region.x + (region.w - dw) / 2, y: band ? region.y + region.h - dh - 8 : region.y + (region.h - dh) / 2, w: dw, h: dh};
  const lensShortPx = Math.min(dw, dh) * px;
  if (lensShortPx < 0.352 * 1080) problems.push('lens-small');
  const lensTransform = `${T(dest.x - cropD.x * rel, dest.y - cropD.y * rel)} scale(${r(rel, 4)})`;
  // the lens copy: plan pieces wholly inside the crop only (floors and walls are clipped by the lens rim)
  const cropT = {x: (cropD.x - pf.ox) / k, y: (cropD.y - pf.oy) / k, w: cropD.w / k, h: cropD.h / k};
  const inCrop = b => b.x >= cropT.x && b.y >= cropT.y && b.x + b.w <= cropT.x + cropT.w && b.y + b.h <= cropT.y + cropT.h;
  const lzArt = aaPlanArt(ctx, G, {prefix: 'lzrm', ramp: true, rampName: 'lz-ramp', wheelchairPlaces: seatsW, keep: inCrop});
  const hasNode = {cx: true, lz: inCrop(G.ramp) && inCrop(G.steps)};
  if (!hasNode.lz) problems.push('crop');
  // guides: from the frame's corners facing the lens to the lens's facing corners
  const guides = band
    ? [{a: {x: cropD.x, y: cropD.y + cropD.h}, b: {x: dest.x, y: dest.y}}, {a: {x: cropD.x + cropD.w, y: cropD.y + cropD.h}, b: {x: dest.x + dest.w, y: dest.y}}]
    : [{a: {x: cropD.x, y: cropD.y}, b: {x: dest.x + dest.w, y: dest.y}}, {a: {x: cropD.x, y: cropD.y + cropD.h}, b: {x: dest.x + dest.w, y: dest.y + dest.h}}];
  // ---- people chips (in the room) and the room name: clear of props, people, the crop and each other
  const props = aaProps(G).map(b => ({...pf.mapBox(b), kind: b.kind}));
  const holdPts = routes.map(rt => toD(rt.poly.at(1)));
  const headBox = q => ({x: q.x - rad, y: q.y - rad, w: rad * 2, h: rad * 2, kind: 'person'});
  const bounds = {x: pf.rect.x + 4, y: pf.rect.y + 4, w: pf.rect.w - 8, h: pf.rect.h - 8};
  const taken = [{...cropD, kind: 'crop'}];
  const chips = [];
  if (showKey) {
    seats.forEach((s, i) => {
      let got = null, fitUsed = null;
      // (fallback, every participant alike: a number badge beside each one, the labels listed in the panel)
      for (const mw of listPeople ? [0] : [320, 240, 180]) {
        const cf = listPeople ? chipFit(String(i + 1), F, 400, 1, 700) : chipFit(s.label, F, mw / px, 3);
        if (listPeople) cf.w = Math.max(cf.w, cf.h);
        if (cf.fit.truncated) continue;
        const hard = [...props, ...holdPts.filter((q, j) => j !== i).map(headBox), ...taken];
        got = placeChip({w: cf.w, h: cf.h, anchor: {...holdPts[i], rad}, bounds, hard, leadHard: hard.filter(q => ['person', 'wall', 'sign'].includes(q.kind)), gaps: [4, 12, 22, 32].map(q => q / px)});
        if (got) { fitUsed = cf.fit; break; }
      }
      if (!got) { problems.push(`lab-${i}`); return; }
      taken.push(got.box);
      chips.push({name: `lab${i}`, node: chipNode(ctx, got, {name: `lab${i}`, fit: fitUsed, owner: `p${i}`})});
    });
    // the room name on the room floor
    let rbox = null, rf = null;
    const roomArea = pf.mapBox({x: G.room.x + 12, y: 12, w: G.room.w - 24, h: G.RH - 24});
    for (const mw of [360, 260, 200]) {
      rf = chipFit(p.courts.room, F, mw / px, 3);
      if (rf.fit.truncated) continue;
      const step = Math.max(8, F * 0.6);
      for (let yy = roomArea.y; yy + rf.h <= roomArea.y + roomArea.h && !rbox; yy += step) {
        for (let xx = roomArea.x; xx + rf.w <= roomArea.x + roomArea.w; xx += step) {
          const b = {x: xx, y: yy, w: rf.w, h: rf.h};
          if ([...props, ...holdPts.map(headBox), ...taken].some(q => overlaps(b, q, 4))) continue;
          rbox = b; break;
        }
      }
      if (rbox) break;
    }
    // (the room's name is also in the panel: it is drawn on the floor only where it fits)
    if (rbox) chips.push({name: 'room-name', node: chipNode(ctx, {box: rbox}, {name: 'room-name', fit: rf.fit, owner: 'room'})});
  }
  // ---- the panel (in the lens region)
  const pan = panelNodes(ctx, p, F, region, band, showKey, showAll, listPeople ? seats : null);
  if (pan.problem) problems.push(pan.problem);
  // the changed marker: beside the datum's value chip
  const vb = stack.valueBox();
  const mr = Math.max(14, F * 0.62);
  // (labels hidden, no value chip: the marker sits just right of the entrance, inside the plan)
  const markerAt = sb.length ? {x: vb.x + vb.w + mr + 8, y: vb.y + vb.h / 2} : {x: Math.min(entD.x + entD.w + mr + 8, D.w - mr - 4), y: Math.min(entD.y + entD.h / 2, D.h - mr - 4)};
  if (showKey && markerAt.x + 20 > D.w) problems.push('marker');
  if (showKey && sb.length && Math.max(...sb.map(b => b.y + b.h)) > D.h + 1) problems.push('stack-out');
  return {
    F, px, k, G, pf, seats, people, routes, art, lzArt, hasNode, focus, toAbsent, rampPivot: G.ramp.x + G.ramp.w, stack, chips, cropD, dest, rel,
    lensShortPx, lensTransform, guides, panelNodes: pan.nodes, noteNode: pan.note, markerAt, problems, personPx, regionName: band ? 'band' : 'column',
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

/** The panel: building, names, legend (participants and supports), context caption, key and the marker note. */
function panelNodes(ctx, p, F, R, band, showKey, showAll, seats) {
  const th = ctx.theme;
  const nodes = [];
  let problem = null;
  const bW = band ? (showKey ? Math.min(R.h * 0.8, R.w * 0.4, 380) : Math.min(R.h * 0.85, R.w * 0.5, 420)) : showKey ? Math.min(R.w * 0.58, 250) : Math.min(R.w * 0.75, R.h * 0.55, 420);
  const bH = bW * 1.05;
  const textX = band ? R.x + bW + 30 : R.x;
  const textW = band ? R.w - bW - 30 : R.w;
  let y = band ? R.y : R.y + bH + F * 0.4;
  const bX = band ? (showKey ? R.x : R.x + (R.w - bW) / 2) : R.x + (R.w - bW) / 2;
  const bY = !showKey ? R.y + Math.max(0, (R.h - bH) / 2) : R.y;
  nodes.push(buildingElevation(ctx, {name: 'bld', x: bX, y: bY, w: bW, h: bH, floors: 3, bays: 5, highlight: {floor: 0, bay: 2}, tree: true}).node);
  const fitT = (t, weight = 500, lines = 4, w = textW) => fitWords(glue(t), {maxWidth: w, size: F, minSize: F, maxLines: lines, weight});
  const items = [];
  if (showKey) items.push({kind: 'names', fit: fitT(`${p.courts.building} · ${p.courts.room}`, 600, 4)});
  if (showKey && seats) seats.forEach((s, i) => items.push({kind: 'who', fit: fitT(`${i + 1} · ${s.label}`, 600, 3)}));
  if (showAll) {
    const glyph = F * 2;
    for (const [kind, text] of [['ramp', p.labels.ramp], ['tactile', p.labels.tactile], ['sign', p.labels.sign]]) items.push({kind: 'legend', glyphKind: kind, glyph, fit: fitT(text, 500, 3, textW - glyph - 12)});
    items.push({kind: 'context', fit: fitT(p.contextLabels.context, 500, 3)});
  }
  if (showKey) items.push({kind: 'key', fit: fitT(p.labels.key, 500, 4)});
  let note = null;
  if (showKey) items.push({kind: 'note', fit: fitT(p.contextLabels.marker, 700, 3, textW - F * 1.9)});
  for (const it of items) if (it.fit.truncated) problem = 'panel-trunc';
  const gap = F * 0.55;
  const hOf = it => (it.kind === 'legend' ? Math.max(it.glyph, it.fit.height) : it.kind === 'key' ? it.fit.height + F * 0.2 : it.fit.height);
  const total = items.reduce((a, it) => a + hOf(it) + gap, 0);
  const avail = band ? R.h : R.h - bH - F * 0.4;
  if (total - gap > avail + 0.5) problem = 'panel';
  for (const it of items) {
    if (it.kind === 'legend') {
      const hh = Math.max(it.glyph, it.fit.height);
      nodes.push(g({name: `legend-${it.glyphKind}`}, g({transform: T(textX + it.glyph / 2, y + hh / 2)}, aaGlyph(ctx, it.glyphKind, it.glyph, null)), textAt(it.fit, textX + it.glyph + 12, y + (hh - it.fit.height) / 2, th.fg)));
    } else if (it.kind === 'note') {
      const rr = Math.max(12, F * 0.55);
      note = g({name: 'panel-note', opacity: 0}, changedMarker(ctx, {x: textX + rr + 2, y: y + F * 0.55, radius: rr}), textAt(it.fit, textX + F * 1.9, y, th.fg, {weight: 700}));
      nodes.push(note);
    } else if (it.kind === 'key') {
      nodes.push(g({name: 'key'}, h('path', {d: `M${r(textX)} ${r(y - F * 0.2)}H${r(textX + Math.min(textW, it.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(it.fit, textX, y + F * 0.2, th.fgSoft, {italic: true})));
    } else nodes.push(g({name: it.kind === 'who' ? `who${nodes.length}` : `panel-${it.kind}`}, textAt(it.fit, textX, y, th.fg, {weight: it.kind === 'names' || it.kind === 'who' ? 600 : 500})));
    y += hOf(it) + gap;
  }
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
    slug: 'courts-10-inspect',
    title: 'Accessibility adaptation — inspecting the entrance and one supplied datum',
    titleEs: 'Adaptación de accesibilidad — Inspección de un detalle',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Adaptación de accesibilidad',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The floor plan of a generic building’s ground floor with the participants at their places in the hearing room. A lens opens beside the plan on a real enlarged copy of the main entrance and the supplied datum under it; one datum is substituted — whether the ramp (or the steps’ handrails) is there, as supplied — and only that detail follows. The old value stays traceable as “was: …”, the lens closes and a neutral Δ marks the changed datum. No standard, measurement, obligation, compliance or outcome is shown.',
    tags: ['inspect', 'lens', 'floor plan', 'accessibility', 'ramp', 'handrails', 'entrance', 'changed datum', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/adaptacion-accesibilidad.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeAA(scene, defaultParams, defaultParamsEs),
});
