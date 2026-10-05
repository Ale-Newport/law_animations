/**
 * LAW-0212 — Asignación de órgano · inspect
 *
 * Storyboard (the context is the state produced by the story at the sorting
 * point: the site plan with the intake office, the plaza, the avenue and the
 * venues with their names and mapping tags; the clerk stands at the sorting
 * point holding the case file, and the route the supplied mapping gives is
 * drawn to its venue; the file's datum is shown in a stack beside the file —
 * the file's name over its value chip):
 *  0.00–0.20  build: the plan fills its area beside a panel (legend, context
 *             caption, key); the route draws on to the venue whose tag equals the
 *             datum; that tag is outlined.
 *  0.20–0.45  isolate: a frame settles on the detail that decides the route —
 *             the clerk, the file and the start of the branches at the sorting
 *             point. The context stays large and in place: it steps back a
 *             little at most (every text on it stays >= 19.5 px when it is that
 *             size at rest), dims, and keeps >= half the frame width; the datum
 *             stack stays beside its file in the context, readable throughout
 *             (LAW-0688 pattern: the record stays in the context). Overlapping
 *             in time, a lens opens — growing from its far edge, opaque within
 *             ~100 ms — over space that holds nothing key (empty space, a
 *             corridor, the faded panel), never over its source, the clerk, a
 *             venue, a venue's tags, the route's destination or the intake: a
 *             REAL enlarged copy of the same plan coordinates (pieces of
 *             furniture enter it whole or not at all), tied to the frame by two
 *             guides. Context + lens span >= 80 % of the frame width.
 *  0.45–0.75  substitute ONE datum (in the stack, in view in the context): the
 *             old value is struck through, greys and docks as "was: …"; the new
 *             value appears; then only its dependent geometry follows (seen in
 *             the lens and in the dimmed context) — the route from the sorting point fades to a faint
 *             ghost and a new route draws to the venue whose tag equals the new
 *             value (or to the dashed waiting slot when no tag does); the venue
 *             tag outline moves with it. Nobody else moves.
 *  0.75–1.00  return: the lens closes while the plan returns to full size and
 *             full strength with the new route,
 *             the struck old value and a neutral changed-datum marker (Δ); a note
 *             in the panel repeats the marker. Seeking back restores the old
 *             datum exactly. Nothing about validity, competence or outcome is
 *             inferred.
 * @module animations/courts/LAW-0212
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {routeTrail} from './kits/courts-art.js';
import {
  organoFields, ORG_EN, ORG_STRINGS, resolveOrgano, SPECS, siteArt, fileProp, clerkNodes, planPerson, clerkLook, carryPoint,
  textAt, fitG, legendGlyph, venueBlockNodes, planWithBlocks, blockProblems, blockWraps, placeNear, overlaps, pxPerUnit, R2, PRAD,
} from './kits/asignacion-de-organo.js';

const ID = 'LAW-0212';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  caption: [0.03, 0.1], route: [0.04, 0.12], frame: [0.2, 0.24], panelOut: [0.2, 0.235], shrink: [0.21, 0.265], open: [0.24, 0.3],
  strike: [0.46, 0.5], dock: [0.51, 0.55], newIn: [0.555, 0.585], oldFade: [0.59, 0.63], newRoute: [0.62, 0.68],
  close: [0.72, 0.77], grow: [0.75, 0.8], panelIn: [0.77, 0.8], marker: [0.855, 0.89],
};

const STRINGS = {
  en: {...ORG_STRINGS.en, routeCap: 'Route given by the supplied mapping', tagCap: 'Venue tag: one supplied mapping row'},
  es: {...ORG_STRINGS.es, routeCap: 'Recorrido según la correspondencia aportada', tagCap: 'Etiqueta de sede: una fila aportada'},
};

const {file: _file, ...shared} = organoFields;
void _file;
const sceneSchema = {
  ...shared,
  file: obj('The case file (fictional); its datum is beforeValue, then afterValue', {label: str('Name of the file (fictional)', 50)}, ['label']),
  focusTarget: oneOf('Detail that is substituted: the datum on the file tag (the route then follows the supplied mapping row that names the new value, or the file waits when none does)', ['file-datum']),
  beforeValue: str('The datum on the file tag before the substitution (matched against the mapping rows)', 60),
  afterValue: str('Value after the substitution (the alternative supplied value)', 60),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens, relative to the context it is taken from', 1.5, 4)}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 90), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  ...ORG_EN,
  file: {label: 'Case file 24-017 (fictional)'},
  focusTarget: 'file-datum',
  beforeValue: 'district = East (fictional)',
  afterValue: 'district = South (fictional)',
  detailGeometry: {zoom: 2.6},
  contextLabels: {context: 'The file at the sorting point, routed as the supplied mapping gives', marker: 'Changed: one supplied datum on the file tag'},
};

const SIZES = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6];

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const stackW of [360, 250, 200]) for (const spec of ['full', 'medium', 'compact']) for (const pf of [0.24, 0.28]) for (const Tw of [300, 380]) arrs.push({spec, rot: false, panel: 'column', pf, T: Tw, stackW});
    } else if (shape === 'square') {
      for (const stackW of [360, 250, 200]) {
        for (const spec of ['compact', 'tight', 'micro']) for (const pf of [0.3, 0.36]) arrs.push({spec, rot: true, panel: 'column', pf, T: 0, stackW});
        for (const spec of ['compact', 'tight', 'micro']) for (const Tw of [280, 340]) arrs.push({spec, rot: false, panel: 'band', pf: 0.4, T: Tw, cols: 3, stackW});
      }
    } else {
      for (const stackW of [360, 250, 200]) for (const spec of ['medium', 'compact', 'tight']) arrs.push({spec, rot: true, panel: 'band', pf: 0.3, T: 0, cols: 2, stackW});
    }
    const log = [];
    let best = null;
    // the lens's smaller side must reach 0.355 of the frame's short side; no lower target is ever tried: when no
    // composition allows it, the best one is kept WITH its problem ('lens-fit') flagged in the semantics
    const hopeless = new Set();
    // passes: the tight crop (datum stack, clerk, file), then the crop with the route fork; both need a magnification
    // >= 1.55x against the context at rest. Only if neither fits, the best lens below that is drawn AND flagged as the
    // problem 'zoom-vs-rest' (never silently accepted)
    const passes = [{fork: false, zMinRest: 1.55}, {fork: true, zMinRest: 1.55}, {fork: true, zMinRest: 1.0, flag: 'zoom-vs-rest'}];
    for (const [pi, pass] of passes.entries()) {
      const minSide = 0.355;
      let found = null;
      for (const v of SIZES) {
        let pick = null;
        for (const [ai, A] of arrs.entries()) {
          // a composition that failed for reasons other than the lens fails again with a smaller lens: skipped
          if (hopeless.has(`${v}/${ai}`)) continue;
          const L = compose(ctx, p, v / px, px, {...A, minSide, fork: pass.fork, zMinRest: pass.zMinRest});
          if (L.problems.some(pr => pr !== 'lens-fit' && pr !== 'zoom')) hopeless.add(`${v}/${ai}`);
          void pi;
          log.push(`${v}/${A.spec}/${A.panel}/${A.pf}/${A.T}/m${minSide}:k${L.k.toFixed(2)}:${L.problems.join('+')}`);
          if (!best || L.problems.length < best.problems.length || (L.problems.length === best.problems.length && L.k > best.k)) best = L;
          if (!L.problems.length && (!pick || L.score > pick.score + 0.002)) pick = L;
        }
        if (pick) { found = pick; break; }
      }
      if (found) { best = found; best.minSide = minSide; if (pass.flag) best.problems.push(pass.flag); break; }
    }
    best.log = log.slice(-40);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const world = g({name: 'world'},
      g({name: 'plan', transform: L.M.transform},
        L.art.node, L.trail1.node, L.trailOld.node, L.trailNew && L.trailNew.node, L.clerk.node, fileProp(ctx, {name: 'file'})),
      g({name: 'world-text'}, L.blockNodes),
      h('rect', {name: 'src-frame', x: r(L.crop.x), y: r(L.crop.y), width: r(L.crop.w), height: r(L.crop.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', opacity: 0}),
    );
    return g(null,
      world,
      // the inspected datum stack stays in the context beside its file, readable throughout (the lens never covers it)
      g({name: 'cx-wrap'}, L.stack.node('cx'), L.marker),
      L.panel && L.panel.node,
      L.guides.map((gd, i) => h('line', {name: `guide${i}`, x1: r(gd.a.x), y1: r(gd.a.y), x2: r(gd.b.x), y2: r(gd.b.y), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0})),
      g({name: 'lens', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18}))),
        h('rect', {x: r(L.dest.x + 6), y: r(L.dest.y + 10), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: '#fbf8f1'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(L.dest.x - L.crop.x * L.zoom, L.dest.y - L.crop.y * L.zoom)} scale(${r(L.zoom, 4)})`},
            g({transform: L.M.transform}, L.lzArt.node, L.lzTrail1.node, L.lzTrailOld.node, L.lzTrailNew && L.lzTrailNew.node, L.lzClerk.node, fileProp(ctx, {name: 'lz-file'})),
            L.stack.node('lz'))),
        h('rect', {x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, L.sT, sh);
    const off = {x: lerp(0, L.offT.x, sh), y: lerp(0, L.offT.y, sh)};
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    nodes.world = {transform: `${T(off.x, off.y)} scale(${r(sc, 4)})`};
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    // the context stays large and in place, dimmed while the lens is open
    const dim = 1 - 0.42 * open;
    const textOp = L.F * L.px * sc >= L.tFloor - 1e-6 ? 1 : 0;
    nodes.plan = {transform: L.M.transform, opacity: r(dim, 3)};
    nodes['world-text'] = {opacity: r(textOp * dim, 3)};
    // the clerk stands at the sorting point holding the file (context and lens copy)
    const st = {x: L.G.J.x, y: L.G.J.y, deg: 90, phase: 0, walk: 0};
    Object.assign(nodes, clerkNodes(L.clerk, 'clerk', st, 1, L.ps), clerkNodes(L.lzClerk, 'lz-clerk', st, 1, L.ps));
    const fp = carryPoint(st);
    nodes.file = {transform: T(fp.x, fp.y, 90)};
    nodes['lz-file'] = {transform: T(fp.x, fp.y, 90)};
    for (const dn of Object.keys(L.art.doors)) Object.assign(nodes, L.art.doors[dn].frame(0), L.lzArt.doors[dn].frame(0));
    // routes: the road (done), the route the old datum gives, then (after the substitution) the new one
    const rt = seg(u, ...W.route);
    const oldFade = L.changes ? seg(u, ...W.oldFade) : 0;
    const nr = L.changes ? seg(u, ...W.newRoute) : 0;
    for (const [a, b] of [[L.trail1, L.lzTrail1]]) Object.assign(nodes, a.frame(1, 0.5), b.frame(1, 0.5));
    for (const tr of [L.trailOld, L.lzTrailOld]) Object.assign(nodes, tr.frame(rt, rt > 0 ? 1 - 0.75 * oldFade : 0));
    if (L.trailNew) for (const tr of [L.trailNew, L.lzTrailNew]) Object.assign(nodes, tr.frame(nr, nr > 0 ? 1 : 0));
    // the venue tag outline follows the route
    for (const [row, nm] of Object.entries(L.tagNames)) {
      const idx = +row;
      const on = idx === L.rowBefore ? rt * (1 - (L.changes ? seg(u, W.newRoute[0], W.newRoute[0] + 0.02) : 0)) : idx === L.rowAfter && L.changes ? seg(u, W.newRoute[1] - 0.02, W.newRoute[1]) : 0;
      nodes[`${nm}-hi`] = {opacity: r(on, 3)};
      nodes[`${nm}-scan`] = {opacity: 0};
    }
    // the stack: follows the file at screen size
    const fd = L.M.toD(fp);
    // the stack stays with its file at the context's own scale (never over the plan or the notice); it is shown only
    // while it is >= 16 px — the lens copy carries it meanwhile
    const ss = Math.max(sc, L.s16);
    const stackOk = true;
    // the screen-size stack is shifted (never scaled down) to stay inside the frame; its lead still ends on the file
    const psRaw = wt(fd);
    let shx = 0, shy = 0;
    if (L.stackBox) {
      const bx = psRaw.x + (L.stackBox.x - fd.x) * ss, by = psRaw.y + (L.stackBox.y - fd.y) * ss, bw = L.stackBox.w * ss, bh = L.stackBox.h * ss;
      const D0 = ctx.design;
      shx = bx < 4 ? 4 - bx : bx + bw > D0.w - 4 ? D0.w - 4 - bx - bw : 0;
      shy = by < 4 ? 4 - by : by + bh > D0.h - 4 ? D0.h - 4 - by - bh : 0;
    }
    const ps0 = {x: psRaw.x + shx, y: psRaw.y + shy};
    Object.assign(nodes, L.stack.frame(u, fd, {x: fd.x - shx / ss, y: fd.y - shy / ss}));
    // the source frame leaves with the lens (the returning stack never sits over it)
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const ls = 0.6 + 0.4 * open;
    // the lens grows from its far edge (its outer extent never moves: context + lens keep their span)
    const lc = anchorOf(L.dest, L.lensSide);
    L.guides.forEach((gd, i) => { nodes[`guide${i}`] = {x2: r(lc.x + (gd.b.x - lc.x) * ls), y2: r(lc.y + (gd.b.y - lc.y) * ls), opacity: r(Math.min(fr, open > (L.lensOverPanel ? 0.98 : 0.05) ? 1 : 0), 3)}; });
    // the lens is opaque almost at once (it grows, never a faint blank outline)
    const lensOp = u < 0.5 ? seg(u, W.open[0], W.open[0] + 0.012) : 1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012);
    // the context stack and the lens copy never show together: the stack leaves before the lens appears and returns
    // only after the lens has gone (sequenced, never cross-faded)
    const cxOp = u < 0.5 ? 1 - seg(u, W.open[0] - 0.01, W.open[0]) : seg(u, W.close[1] - 0.012, W.close[1] - 0.002);
    nodes.lens = {opacity: r(lensOp, 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    // the copy's texts show only once they are >= 16 px (the lens grows from 0.6 of its size)
    nodes['cx-wrap'] = {transform: `${T(ps0.x, ps0.y)} scale(${r(ss, 4)}) ${T(-fd.x, -fd.y)}`, opacity: r(stackOk ? cxOp : 0, 3)};
    // the copy's texts show only once they are >= the floor (the lens grows from 0.6 of its size)
    if (L.stack.placed) nodes['lz-stack'] = {opacity: L.F * L.px * L.zoom * lensAt(u, L.dest, L.lensSide).ls >= L.tFloor + 0.2 ? 1 : 0};
    const mk = seg(u, ...W.marker);
    if (L.marker) nodes['cx-marker'] = {opacity: r(mk, 3)};
    if (L.panel) Object.assign(nodes, L.panel.frame(u));
    // (lens over the panel) the panel steps aside before the lens opens and returns after it has closed: never a
    // cross-fade of panel text under the translucent lens
    if (L.panel) nodes.panel = {opacity: r(L.lensOverPanel ? (u < 0.5 ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn)) : 1, 3)};
    const newIn = seg(u, ...W.newIn);
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const people = [wt(L.M.toD(st))];
    const rr = PRAD * L.k * L.ps * sc;
    return {
      nodes,
      semantic: {
        beat,
        datum,
        lensOpen: r(open, 3),
        contextScale: r(sc, 3),
        contextWidth: r(((textOp ? L.planRect.w : L.M.rect.w) * sc) / ctx.design.w, 3),
        contextDim: r(dim, 3),
        lensSpan: r(L.span, 3),
        textOnPlan: r(textOp, 3),
        valueScale: r(ss, 3),
        strike: r(seg(u, ...W.strike), 3),
        oldDocked: r(seg(u, ...W.dock), 3),
        newShown: r(newIn, 3),
        focusTarget: p.focusTarget,
        changes: L.changes,
        routeTo: nr >= 1 ? L.toAfter : L.toBefore,
        oldRoute: r(rt * (1 - 0.75 * oldFade), 3),
        newRoute: r(nr, 3),
        selectedBefore: L.selBefore,
        selectedAfter: L.selAfter,
        clerk: R2(wt(L.M.toD(st))),
        file: R2(wt(fd)),
        zoom: r(L.zoom / L.sT, 2),
        zoomVsRest: r(L.zoom, 2),
        crop: {x: r(L.crop.x), y: r(L.crop.y), w: r(L.crop.w), h: r(L.crop.h)},
        stackShown: !L.stack.placed || (lensOp >= 0.5 ? L.stackInCrop : true),
        datumInLens: L.stackInCrop && lensOp >= 0.99,
        lensMinSideTarget: L.minSide ?? null,
        lensClearOfPeople: lensOp === 0 || people.every(q => !overlaps(lensAt(u, L.dest, L.lensSide).rect, {x: q.x - rr, y: q.y - rr, w: 2 * rr, h: 2 * rr}, 0)),
        lensClearOfSource: lensOp === 0 || !overlaps(lensAt(u, L.dest, L.lensSide).rect, {x: off.x + L.crop.x * sc, y: off.y + L.crop.y * sc, w: L.crop.w * sc, h: L.crop.h * sc}, 0),
        // the lens never covers a venue, its tags, the destination, the intake office or the clerk (at this u)
        lensClearOfKey: lensOp === 0 || !L.keyBoxes.some(b => overlaps(lensAt(u, L.dest, L.lensSide).rect, {x: off.x + b.x * sc, y: off.y + b.y * sc, w: b.w * sc, h: b.h * sc}, 0)),
        guidesClear: L.guidesClear,
        markerShown: r(mk, 3),
        markerClearOfHeads: L.markerClear,
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

/** One composition at text size F for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const resB = resolveOrgano(p, {datum: p.beforeValue});
  const resA = resolveOrgano(p, {datum: p.afterValue});
  const n = resB.venues.length;
  const changes = resA.selected !== resB.selected;
  // ---- panel
  const mR = Math.max(15, F * 0.75);
  const items = panelItems(ctx, p, F, px, showAll, showKey, mR);
  let mapRegion = {x: 0, y: 0, w: D.w, h: D.h};
  let panelBox = null;
  let panel = null;
  if (items.length) {
    if (A.panel === 'column') {
      const pw = D.w * A.pf;
      panelBox = {x: D.w - pw, y: 0, w: pw, h: D.h};
      mapRegion = {x: 0, y: 0, w: D.w - pw - 30, h: D.h};
    } else {
      panelBox = {x: 0, y: 0, w: D.w, h: D.h * A.pf};
    }
    panel = layoutPanel(items, panelBox, F, A.panel, A.cols || 2);
    if (panel.problem) problems.push(panel.problem);
    if (A.panel === 'band') {
      panelBox = {x: 0, y: D.h - panel.height, w: D.w, h: panel.height};
      mapRegion = {x: 0, y: 0, w: D.w, h: D.h - panel.height - 24};
    }
    panel.place(panelBox);
  }
  // ---- plan and venue blocks
  const venuesShown = showKey ? resB.venues : [];
  // (labels hidden) longer roads let the plan keep >= 0.57 of the design width
  const fit = planWithBlocks(ctx, {n, S: SPECS[A.spec], region: mapRegion, venues: venuesShown, F, px, rot: A.rot, T: A.T, caps: items.length ? undefined : {flow: 1600, spread: 380}});
  const {G, M, placed} = fit;
  problems.push(...blockProblems(placed, mapRegion));
  const k = M.k;
  const toD = M.toD;
  const ps = SPECS[A.spec].ps || 1;
  const personPx = 100 * k * ps * px;
  if (personPx < 60.5) problems.push('small');
  const tagNames = {};
  for (const b of placed.blocks) for (const tg of b.v.tags) tagNames[tg.index] = `vb${b.i}-tag${tg.index}`;
  // ---- routes (the old one and, when the substitution changes it, the new one)
  const legTo = sel => (sel < 0 ? G.legWait : G.leg2[sel]);
  const art = siteArt(ctx, G, {prefix: 's'});
  const trail1 = routeTrail(ctx, {name: 'trail1', pts: G.leg1, width: 6});
  const trailOld = routeTrail(ctx, {name: 'trail-old', pts: legTo(resB.selected), width: 7, color: resB.selected < 0 ? th.inkSoft : undefined});
  const trailNew = changes ? routeTrail(ctx, {name: 'trail-new', pts: legTo(resA.selected), width: 7, color: resA.selected < 0 ? th.inkSoft : undefined}) : null;
  const clerk = planPerson(ctx, {name: 'clerk', look: clerkLook(ctx, p)});
  const rad = PRAD * k * ps;
  const J = toD(G.J);
  const fpD = toD(carryPoint({x: G.J.x, y: G.J.y, deg: 90}));
  // ---- the inspected stack (file name over the value chip; the dock for the old value)
  const stack = focusStack(ctx, {F, px, maxW: (A.stackW || 360) / px, labelText: p.file.label, before: `${p.labels.datum}: ${p.beforeValue}`, after: `${p.labels.datum}: ${p.afterValue}`, was: ctx.t.was, showKey});
  if (stack.problem) problems.push(stack.problem);
  const buildings = [M.box({x: G.intake.x - G.t, y: G.intake.y - G.t, w: G.intake.w + 2 * G.t, h: G.intake.h + 2 * G.t}), ...G.venues.map(v => M.box(v.outer))];
  const paths = [G.leg1, legTo(resB.selected), legTo(resA.selected)].map(pts => pts.map(toD));
  let stackAt = null;
  if (showKey) {
    const part = {x: J.x - rad, y: J.y - rad, w: 2 * rad, h: 2 * rad};
    // plaza furniture stays uncovered; the intake office may be covered only when nothing else fits (the clerk has left it)
    const plazaFurn = [M.box({x: G.lectern.x - 32, y: G.lectern.y - 32, w: 64, h: 64}), M.box({x: G.slot.x - G.slot.w / 2, y: G.slot.y - G.slot.h / 2, w: G.slot.w, h: G.slot.h})];
    for (const hardB of [[...buildings, ...plazaFurn], [...buildings.slice(1), ...plazaFurn], buildings.slice(1)]) {
      stackAt = placeNear(part, stack.w, stack.h, {order: A.rot ? ['left', 'right', 'below', 'above'] : ['below', 'above', 'left'], bounds: mapRegion, hard: [...hardB, ...placed.blocks.map(b => b.box)], paths: paths.slice(1), pathPad: rad * 0.9, maxGap: 140});
      if (stackAt) break;
    }
    if (!stackAt) { problems.push('stack'); stackAt = {x: J.x + rad + 8, y: J.y - stack.h / 2, w: stack.w, h: stack.h}; }
  }
  stack.place(stackAt);
  // ---- the crop: the clerk, the file, the stack and the start of both routes from the sorting point
  const branchPts = sel => {
    const pts = legTo(sel).map(toD);
    // only the start of the branch (where the two routes part at the sorting point): up to 110 plan units along it
    const out = [pts[0]];
    let left = 110 * k;
    for (let i = 1; i < pts.length && left > 0; i++) {
      const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (d <= left) { out.push(pts[i]); left -= d; continue; }
      out.push({x: lerp(pts[i - 1].x, pts[i].x, left / d), y: lerp(pts[i - 1].y, pts[i].y, left / d)});
      left = 0;
    }
    return out;
  };
  const cropParts = [{x: J.x - rad * 1.1, y: J.y - rad * 1.1, w: rad * 2.2, h: rad * 2.2}, {x: fpD.x - 40 * k, y: fpD.y - 40 * k, w: 80 * k, h: 80 * k}];
  // (LAW-0204 pattern) the datum stack is in the lens copy: the substitution plays there, magnified
  if (stackAt) cropParts.push(stackAt);
  // (round 6) the crop holds the datum stack, the clerk and the file only — the routes read in the context — so the
  // lens can magnify >= 1.5x against the context at rest
  if (A.fork) for (const q of [...branchPts(resB.selected), ...(changes ? branchPts(resA.selected) : [])]) cropParts.push({x: q.x - 20 * k, y: q.y - 20 * k, w: 40 * k, h: 40 * k});
  const cx0 = Math.min(...cropParts.map(q => q.x)) - 12, cy0 = Math.min(...cropParts.map(q => q.y)) - 12;
  let crop = {x: cx0, y: cy0, w: Math.max(...cropParts.map(q => q.x + q.w)) + 12 - cx0, h: Math.max(...cropParts.map(q => q.y + q.h)) + 12 - cy0};
  // ---- the context stays large and in place (a mild step back at most, dimmed while the lens is open) with every text
  // on it still readable (>= 19.5 px when the text is at least that size at rest, else >= 16 px); the lens opens over
  // space that holds nothing key — empty space, a corridor, the faded panel — never over its source, the clerk, a venue,
  // a venue's tags, the route's destination or the intake office; the two overlap in time. The context keeps >= 0.57
  // of the design width (0.5 of the frame) and context + lens span >= 0.92 of it (0.8 of the frame).
  const tFloor = F * px >= 19.5 ? 19.5 : 16;
  // the crop is tried as it is and grown squarer (0.8), whichever lets the lens's smaller side be larger
  const crop0 = crop;
  let bestPick = null, bestCrop = crop, keyBoxes = null, bestKeys = null;
  const planRect = unionBox([M.rect, ...placed.blocks.map(b => b.box)]);
  const zoomMax = p.detailGeometry.zoom;
  for (const asp of [0.8, 0]) {
  crop = crop0;
  // the crop grows around its centre (more of the same plan): never flatter than 0.8 (so the lens's SMALLER side can
  // reach 0.35 of the frame's short side), and large enough for that at a zoom of at most 1.9
  {
    const grow = (w2, h2) => {
      w2 = Math.min(Math.max(crop.w, w2), M.rect.w); h2 = Math.min(Math.max(crop.h, h2), M.rect.h);
      crop = {x: clamp(crop.x + crop.w / 2 - w2 / 2, M.rect.x, M.rect.x + M.rect.w - w2), y: clamp(crop.y + crop.h / 2 - h2 / 2, M.rect.y, M.rect.y + M.rect.h - h2), w: w2, h: h2};
    };
    if (asp) grow(crop.h * asp, crop.w * asp);
    const minS = (0.37 * 1080) / px / 1.9;
    if (Math.min(crop.w, crop.h) < minS) { const f = minS / Math.min(crop.w, crop.h); grow(crop.w * f, crop.h * f); }
  }
  keyBoxes = [...buildings, M.box({x: G.slot.x - G.slot.w / 2, y: G.slot.y - G.slot.h / 2, w: G.slot.w, h: G.slot.h}), ...placed.blocks.map(b => b.box), crop, {x: J.x - rad, y: J.y - rad, w: 2 * rad, h: 2 * rad}];
  let pick = null;
  // (with labels hidden there is no text on the context: it may step back further)
  const hasText = showAll || showKey;
  // (LAW-0204 pattern) the context may step back further than its texts' floor: those texts then fade while the lens
  // is open (never shown below the floor); stepping back no further is preferred
  void hasText;
  const sTs = [1, 0.96, 0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, (tFloor + 0.05) / (F * px)].filter(v => v <= 1).sort((a, b) => b - a);
  for (const sT of sTs) {
    if (100 * k * ps * px * sT < 46) continue;
    const at = {x: mapRegion.x, y: mapRegion.y};
    const offT = {x: at.x - planRect.x * sT, y: at.y - planRect.y * sT};
    const w2 = b => ({x: offT.x + b.x * sT, y: offT.y + b.y * sT, w: b.w * sT, h: b.h * sT});
    // the visible context: with its texts while they stay >= their floor, else the plan alone
    const ctxBox = w2(F * px * sT >= tFloor - 1e-6 ? planRect : M.rect);
    if (ctxBox.w < 0.52 * D.w) continue;
    const kb = keyBoxes.map(w2);
    const cs = w2(crop), cc = {x: cs.x + cs.w / 2, y: cs.y + cs.h / 2};
    // magnification >= 1.5x against the context AT REST (zAbs; 1.55 kept as margin) and against the stepped-back source
    for (let zAbs = zoomMax * sT; zAbs >= (A.zMinRest ?? 1.55) - 1e-9 && zAbs / sT >= 1.51 - 1e-9; zAbs *= 0.97) {
      const lw = crop.w * zAbs, lh = crop.h * zAbs;
      if (lw > D.w - 16 || lh > D.h - 16) continue;
      // the lens window >= 0.42 of the frame's short side wide (1080 px at 1080p)
      // the lens's SMALLER side >= 0.35 of the frame's short side (1080 px at 1080p; 0.36 kept as margin)
      if (Math.min(lw, lh) * px < (A.minSide ?? 0.355) * 1080) break;
      let bestL = null;
      for (let lx = 8; lx <= D.w - 8 - lw + 1e-6; lx += 12) {
        const span = (Math.max(ctxBox.x + ctxBox.w, lx + lw) - Math.min(ctxBox.x, lx)) / D.w;
        if (span < 0.92) continue;
        for (let ly = 8; ly <= D.h - 8 - lh + 1e-6; ly += 12) {
          const lens = {x: lx, y: ly, w: lw, h: lh};
          if (kb.some(b => overlaps(lens, b, 10))) continue;
          const d = Math.hypot(lx + lw / 2 - cc.x, ly + lh / 2 - cc.y);
          if (!bestL || d < bestL.d) bestL = {lens, d, span};
        }
      }
      const side = bestL && bestL.lens.x + bestL.lens.w / 2 > ctxBox.x + ctxBox.w / 2 ? 'r' : 'l';
      if (bestL && clearOverTime(bestL.lens, keyBoxes, sT, offT, side)) {
        const rel = zAbs / sT;
        const textsStay = F * px * sT >= tFloor - 1e-6;
        const cand = {sT, offT, side, lens: bestL.lens, zAbs, rel, span: bestL.span, good: true, fill: rel + 2 * sT - bestL.d / 2000 + (textsStay ? 2 : 0)};
        if (!pick || cand.fill > pick.fill + 0.01) pick = cand;
        break;
      }
    }
  }

  const minSide = q => (q ? Math.min(q.lens.w, q.lens.h) : 0);
  if (pick && (!bestPick || minSide(pick) > minSide(bestPick) + 0.5)) { bestPick = pick; bestCrop = crop; bestKeys = keyBoxes; }
  }
  let pick = bestPick;
  crop = bestCrop;
  keyBoxes = bestKeys || keyBoxes;
  if (!pick) {
    problems.push('lens-fit');
    pick = {sT: 1, offT: {x: 0, y: 0}, lens: {x: D.w * 0.6, y: 8, w: D.w * 0.38, h: D.h * 0.38}, zAbs: 1, rel: 1, good: false, span: 0};
  }
  // the datum stack stays with its file at the context's scale (the texts stay >= the floor, see above)
  const s16 = Math.min(1, (tFloor + 0.2) / (F * px));
  const {sT, offT, zAbs: zoom} = pick;
  const reg = pick.lens;
  const destFor = c => ({x: pick.lens.x + (pick.lens.w - c.w * zoom) / 2, y: pick.lens.y + (pick.lens.h - c.h * zoom) / 2, w: c.w * zoom, h: c.h * zoom});
  if (pick.rel < 1.5) problems.push('zoom');
  const inCrop = b => b.x >= crop.x && b.y >= crop.y && b.x + b.w <= crop.x + crop.w && b.y + b.h <= crop.y + crop.h;
  const stackInCrop = !stackAt || (stackAt.x >= crop.x - 0.5 && stackAt.y >= crop.y - 0.5 && stackAt.x + stackAt.w <= crop.x + crop.w + 0.5 && stackAt.y + stackAt.h <= crop.y + crop.h + 0.5);
  if (!stackInCrop) problems.push('stack-crop');
  if (placed.blocks.some(b => overlaps(b.box, crop, 0) && !inCrop(b.box))) problems.push('crop-cuts-text');
  const dw = crop.w * zoom, dh = crop.h * zoom;
  const dest = destFor(crop);
  const wtT = q => ({x: offT.x + q.x * sT, y: offT.y + q.y * sT});
  const wtB = b => ({...wtT(b), w: b.w * sT, h: b.h * sT});
  const cropShrunk = wtB(crop), planShrunk = wtB(planRect);
  const lensOverPanel = Boolean(panelBox) && overlaps(dest, panelBox, 0);
  if (overlaps(dest, cropShrunk, 4)) problems.push('lens-place');
  const lzArt = siteArt(ctx, G, {prefix: 'lz', keep: b => inCrop(M.box(b)), sheet: true});
  const lzTrail1 = routeTrail(ctx, {name: 'lz-trail1', pts: G.leg1, width: 6});
  const lzTrailOld = routeTrail(ctx, {name: 'lz-trail-old', pts: legTo(resB.selected), width: 7, color: resB.selected < 0 ? th.inkSoft : undefined});
  const lzTrailNew = changes ? routeTrail(ctx, {name: 'lz-trail-new', pts: legTo(resA.selected), width: 7, color: resA.selected < 0 ? th.inkSoft : undefined}) : null;
  const lzClerk = planPerson(ctx, {name: 'lz-clerk', look: clerkLook(ctx, p)});
  // ---- guides from the shrunk frame's corners to the lens, clear of the head and the panel texts
  const head = (() => { const c = wtT(J); const hr = rad * sT * 0.5; return {x: c.x - hr, y: c.y - hr, w: 2 * hr, h: 2 * hr}; })();
  const corners = b => [{x: b.x, y: b.y}, {x: b.x + b.w, y: b.y}, {x: b.x + b.w, y: b.y + b.h}, {x: b.x, y: b.y + b.h}];
  // texts that can be visible while the guides show: the shrunk venue blocks (while >= 16 px) and the stack at screen size
  const ssT = Math.min(1, Math.max(sT, 16.5 / (F * px)));
  const guideObs = [...(F * px * sT >= 16 ? placed.blocks.map(b => wtB(b.box)) : [])];
  if (stackAt) { const a0 = wtT(fpD); guideObs.push({x: a0.x + (stackAt.x - fpD.x) * ssT, y: a0.y + (stackAt.y - fpD.y) * ssT, w: stackAt.w * ssT, h: stackAt.h * ssT}); }
  const segClear = (a, b2) => {
    for (let i = 2; i < 38; i++) {
      const q = {x: lerp(a.x, b2.x, i / 40), y: lerp(a.y, b2.y, i / 40)};
      if ([head, ...guideObs, ...(lensOverPanel || !panel ? [] : panel.boxes)].some(o => q.x > o.x - 3 && q.x < o.x + o.w + 3 && q.y > o.y - 3 && q.y < o.y + o.h + 3)) return false;
      if (q.x > cropShrunk.x + 2 && q.x < cropShrunk.x + cropShrunk.w - 2 && q.y > cropShrunk.y + 2 && q.y < cropShrunk.y + cropShrunk.h - 2) return false;
    }
    return true;
  };
  const cs = corners(cropShrunk), cd = corners(dest);
  const pairs = pick.side === 'below' ? [[3, 0], [2, 1]] : [[1, 0], [2, 3]];
  let guides = pairs.map(([i, j]) => ({a: cs[i], b: cd[j]}));
  let guidesClear = guides.every(gd => segClear(gd.a, gd.b));
  if (!guidesClear) {
    const alt = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (segClear(cs[i], cd[j])) alt.push({a: cs[i], b: cd[j]});
    if (alt.length) { guides = alt.slice(0, 2); guidesClear = true; } else problems.push('guides');
  }
  // ---- Δ marker beside the stack (off the head, the blocks and the walls)
  const sb = stackAt || {x: fpD.x, y: fpD.y, w: 1, h: 1};
  const mCands = [{x: sb.x + sb.w + mR + 6, y: sb.y + mR}, {x: sb.x - mR - 6, y: sb.y + mR}, {x: sb.x + sb.w + mR + 6, y: sb.y + sb.h - mR}, {x: sb.x - mR - 6, y: sb.y + sb.h - mR}, {x: sb.x + sb.w / 2, y: sb.y - mR - 6}, {x: sb.x + sb.w / 2, y: sb.y + sb.h + mR + 6}];
  const mOk = q => Math.hypot(q.x - J.x, q.y - J.y) > rad + mR && q.x - mR > mapRegion.x && q.x + mR < mapRegion.x + mapRegion.w && q.y - mR > mapRegion.y && q.y + mR < mapRegion.y + mapRegion.h
    && !placed.blocks.some(b => overlaps({x: q.x - mR, y: q.y - mR, w: 2 * mR, h: 2 * mR}, b.box, 4)) && !buildings.some(b => overlaps({x: q.x - mR, y: q.y - mR, w: 2 * mR, h: 2 * mR}, b, 0));
  const markerAt = mCands.find(mOk) || mCands[0];
  const markerClear = mOk(markerAt);
  if (showKey && !markerClear) problems.push('marker');
  const marker = showKey ? changedMarker(ctx, {name: 'cx-marker', x: markerAt.x, y: markerAt.y, radius: mR, opacity: 0}) : null;
  // ---- audit
  const texts = [...placed.blocks.map(b => b.box), stackAt, ...(panel ? panel.boxes : [])].filter(Boolean);
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (overlaps(texts[i], texts[j], 2)) { problems.push('overlap'); i = texts.length; break; }
  if (texts.some(b => b.x < -0.5 || b.y < -0.5 || b.x + b.w > D.w + 0.5 || b.y + b.h > D.h + 0.5)) problems.push('frame');
  return {
    F, px, k, ps, M, G, art, lzArt, trail1, trailOld, trailNew, lzTrail1, lzTrailOld, lzTrailNew, clerk, lzClerk, stack, marker, panel, crop, dest, zoom, guides, guidesClear,
    blockNodes: venueBlockNodes(ctx, placed), tagNames, rowBefore: resB.matchRow, rowAfter: resA.matchRow, selBefore: resB.selected, selAfter: resA.selected, changes,
    toBefore: resB.selected < 0 ? 'slot' : `venue${resB.selected}`, toAfter: changes ? (resA.selected < 0 ? 'slot' : `venue${resA.selected}`) : (resB.selected < 0 ? 'slot' : `venue${resB.selected}`),
    stackBox: stackAt, lensSide: pick.side || 'c', stackBoxAt: (sc2, off2) => (stackAt ? {x: off2.x + stackAt.x * sc2, y: off2.y + stackAt.y * sc2, w: stackAt.w * sc2, h: stackAt.h * sc2} : {x: -9, y: -9, w: 0, h: 0}), sT, offT, s16, tFloor, keyBoxes, cropShrunk, planShrunk, planRect, personPx, stackInCrop, markerClear, problems, lensOverPanel, span: pick.span,
    arrangement: `${A.spec}/${A.panel}/${A.pf}/${A.T}`,
    score: k - 0.008 * blockWraps(placed),
  };
}

/** The context's step back at u: scale and offset (as in frame()). */
function stepAt(u, sT, offT) {
  const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
  return {sc: lerp(1, sT, sh), off: {x: lerp(0, offT.x, sh), y: lerp(0, offT.y, sh)}};
}
/** The lens window at u: opacity and the rect it covers (it grows from 0.6 of its size about its centre). */
/** The point the lens grows about: the middle of its edge away from the context ('r' right, 'l' left), or its centre. */
function anchorOf(dest, side) {
  return {x: side === 'r' ? dest.x + dest.w : side === 'l' ? dest.x : dest.x + dest.w / 2, y: dest.y + dest.h / 2};
}
/** The lens window at u: opacity and the rect it covers (it grows from 0.6 of its size about its anchor). */
function lensAt(u, dest, side) {
  const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
  const op = u < 0.5 ? seg(u, W.open[0], W.open[0] + 0.012) : 1 - seg(u, W.close[1] - 0.024, W.close[1] - 0.012);
  const ls = 0.6 + 0.4 * open;
  const c = anchorOf(dest, side);
  return {op, open, ls, rect: {x: c.x + (dest.x - c.x) * ls, y: c.y + (dest.y - c.y) * ls, w: dest.w * ls, h: dest.h * ls}};
}
/** While the context steps back and the lens opens (and back), the lens never covers its moving source nor any key
 *  piece of the context (venues, their tags, the destination, the intake office, the clerk). */
function clearOverTime(dest, boxes, sT, offT, side) {
  for (const [u0, u1] of [[W.shrink[0], W.open[1]], [W.close[0], W.grow[1]]]) {
    for (let i = 0; i <= 16; i++) {
      const u = lerp(u0, u1, i / 16);
      const L = lensAt(u, dest, side);
      if (L.op <= 0) continue;
      const {sc, off} = stepAt(u, sT, offT);
      if (boxes.some(b => overlaps(L.rect, {x: off.x + b.x * sc, y: off.y + b.y * sc, w: b.w * sc, h: b.h * sc}, 4))) return false;
    }
  }
  return true;
}

const unionBox = bs => {
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y));
  return {x: x0, y: y0, w: Math.max(...bs.map(b => b.x + b.w)) - x0, h: Math.max(...bs.map(b => b.y + b.h)) - y0};
};

/**
 * The inspected stack: the file name (never replaced) over the value chip
 * (before → after) and the old value's dock. Drawn twice (context and lens
 * copy, same coordinates). Before → strike (every line) → the old value greys
 * and docks → new value in.
 */
function focusStack(ctx, o) {
  const th = ctx.theme;
  const {F, px} = o;
  const maxW = o.maxW || 360 / px;
  const lab = o.showKey ? fitG(o.labelText, {maxWidth: maxW, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  const dB = o.showKey ? fitG(o.before, {maxWidth: maxW, size: F, minSize: F, maxLines: 3, weight: 600}) : null;
  const dA = o.showKey ? fitG(o.after, {maxWidth: maxW, size: F, minSize: F, maxLines: 3, weight: 600}) : null;
  const was = o.showKey ? fitG(`${o.was}: ${o.before}`, {maxWidth: maxW, size: F, minSize: F, maxLines: 4, weight: 500}) : null;
  const padX = F * 0.6, padY = F * 0.4;
  const cH = f => (f ? f.height + padY * 2 : 0), cW = f => (f ? f.width + padX * 2 : 0);
  const hL = Math.max(cH(lab), F * 1.6), wL = cW(lab);
  const hD = Math.max(cH(dB), cH(dA)), wD = Math.max(cW(dB), cW(dA));
  const hK = cH(was), wK = cW(was);
  const gap = F * 0.3;
  const w = Math.max(wL, wD, wK, F * 3), hh = hL + gap + hD + gap + hK;
  const problem = [lab, dB, dA, was].some(f => f && f.truncated) ? 'stack-trunc' : null;
  let at = null;
  const geo = () => ({
    lb: {x: at.x + (w - wL) / 2, y: at.y, w: wL, h: hL},
    vb: {x: at.x + (w - wD) / 2, y: at.y + hL + gap, w: wD, h: hD},
    kb: {x: at.x + (w - wK) / 2, y: at.y + hL + gap + hD + gap, w: wK, h: hK},
  });
  const tEl = (fit, x, y, fill) => textAt(fit, x, y, fill, {anchor: 'middle'});
  const strikes = (fit, cx, y, name) => fit.lines.map((ln, i) => {
    const lw = ctx.measure(ln, fit.size, fit.weight, 'sans');
    const yy = y + i * fit.lineHeight + fit.size * 0.45;
    return h('line', {name: name ? `${name}${i}` : undefined, x1: r(cx - lw / 2), x2: r(name ? cx - lw / 2 : cx + lw / 2), y1: r(yy), y2: r(yy), stroke: name ? th.ink : th.inkSoft, 'stroke-width': name ? Math.max(2.4, F * 0.1) : 2, 'stroke-linecap': 'round'});
  });
  return {
    w, h: hh, problem,
    get placed() { return Boolean(at); },
    place(box) { at = box ? {x: box.x, y: box.y} : null; },
    node(P) {
      if (!at) return null;
      const {lb, vb, kb} = geo();
      return g({name: `${P}-stack`},
        h('line', {name: `${P}-lead`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
        h('circle', {name: `${P}-lead-dot`, r: 4.5, fill: th.ink}),
        g({name: `${P}-label`},
          h('path', {name: `${P}-label-body`, d: roundRectPath(lb.x, lb.y, lb.w, lb.h, Math.min(lb.h / 2, F * 0.7)), fill: th.card, stroke: th.accent3, 'stroke-width': 2.4}),
          tEl(lab, lb.x + lb.w / 2, lb.y + (lb.h - lab.height) / 2, th.ink)),
        g({name: `${P}-old`},
          h('path', {name: `${P}-old-body`, d: roundRectPath(vb.x, vb.y, vb.w, vb.h, Math.min(vb.h / 2, F * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.2}),
          g({name: `${P}-old-text`}, tEl(dB, vb.x + vb.w / 2, vb.y + (vb.h - dB.height) / 2, th.ink)),
          strikes(dB, vb.x + vb.w / 2, vb.y + (vb.h - dB.height) / 2, `${P}-strike`)),
        g({name: `${P}-dock`, opacity: 0},
          h('path', {d: roundRectPath(kb.x, kb.y, kb.w, kb.h, Math.min(kb.h / 2, F * 0.7)), fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 1.8}),
          tEl(was, kb.x + kb.w / 2, kb.y + (kb.h - was.height) / 2, th.inkSoft),
          strikes(was, kb.x + kb.w / 2, kb.y + (kb.h - was.height) / 2, null)),
        g({name: `${P}-new`, opacity: 0},
          h('path', {name: `${P}-new-body`, d: roundRectPath(vb.x, vb.y, vb.w, vb.h, Math.min(vb.h / 2, F * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
          tEl(dA, vb.x + vb.w / 2, vb.y + (vb.h - dA.height) / 2, th.ink)));
    },
    frame(u, file, fileCx = file) {
      const out = {};
      if (!at) return out;
      const {lb, vb, kb} = geo();
      const strike = ease.inOutSine(seg(u, ...W.strike));
      const dock = ease.inOutCubic(seg(u, ...W.dock));
      const newIn = seg(u, ...W.newIn);
      const near = {x: clamp(file.x, lb.x, lb.x + lb.w), y: clamp(file.y, lb.y, lb.y + lb.h)};
      for (const P of ['cx', 'lz']) {
        // (the context copy may be shifted to stay in the frame: its lead then reaches the file's true place)
        const fl = P === 'cx' ? fileCx : file;
        const nr = {x: clamp(fl.x, lb.x, lb.x + lb.w), y: clamp(fl.y, lb.y, lb.y + lb.h)};
        out[`${P}-lead`] = {x1: r(nr.x), y1: r(nr.y), x2: r(fl.x), y2: r(fl.y)};
        out[`${P}-lead-dot`] = {cx: r(fl.x), cy: r(fl.y)};
        dB.lines.forEach((ln, i) => {
          const lw = ctx.measure(ln, dB.size, dB.weight, 'sans');
          const cx = vb.x + vb.w / 2;
          out[`${P}-strike${i}`] = {x2: r(lerp(cx - lw / 2, cx + lw / 2, strike)), opacity: strike > 0 ? 1 : 0};
        });
        const tx = (kb.x + kb.w / 2) - (vb.x + vb.w / 2), ty = kb.y - vb.y;
        out[`${P}-old`] = {transform: T(tx * dock, ty * dock), opacity: dock >= 1 ? 0 : 1};
        out[`${P}-old-text`] = {opacity: r(1 - 0.45 * dock, 3)};
        out[`${P}-dock`] = {opacity: dock >= 1 ? 1 : 0};
        out[`${P}-new`] = {opacity: r(newIn, 3)};
      }
      return out;
    },
  };
}

/** The panel's items: legend (office, sorting point, route, tag, tray, slot), context caption, marker note, key. */
function panelItems(ctx, p, F, px, showAll, showKey, mR) {
  const th = ctx.theme;
  const items = [];
  // secondary text: smaller than the main text only while that keeps it >= 19.6 px (never below 16.6 px)
  const Fc = Math.max(F * 0.86, Math.min(F, 19.6 / px), 16.6 / px);
  if (showAll) {
    for (const [kind, text, strong] of [['office', p.courts.origin, true], ['plaza', p.labels.junction], ['route', ctx.t.routeCap], ['tag', ctx.t.tagCap], ['tray', p.seats.arrival], ['slot', p.seats.waiting]]) {
      items.push({make: w => {
        const gs = F * 1.9;
        const f = fitG(text, {maxWidth: w - gs - 12, size: strong ? F : Fc, minSize: strong ? F : Fc, maxLines: 3, weight: strong ? 700 : 500});
        const hh = Math.max(gs, f.height + F * 0.25);
        return {h: hh, truncated: f.truncated, node: (x, y) => g({name: `legend-${kind}`}, g({transform: T(x + gs / 2, y + hh / 2)}, legendGlyph(ctx, kind, gs)), textAt(f, x + gs + 12, y + (hh - f.height) / 2, th.fg))};
      }});
    }
  }
  if (showKey) {
    if (p.contextLabels.context) {
      items.push({name: 'ctx-caption', make: w => {
        const f = fitG(p.contextLabels.context, {maxWidth: w, size: Fc, minSize: Fc, maxLines: 4, weight: 500});
        return {h: f.height + F * 0.25, truncated: f.truncated, node: (x, y) => g({name: 'ctx-caption', opacity: 0}, textAt(f, x, y, th.fgSoft))};
      }});
    }
    if (p.contextLabels.marker) {
      items.push({name: 'marker-note', make: w => {
        const f = fitG(p.contextLabels.marker, {maxWidth: w - mR * 2 - 12, size: F, minSize: F, maxLines: 4, weight: 600});
        return {h: Math.max(f.height + F * 0.25, mR * 2), truncated: f.truncated, node: (x, y) => g({name: 'marker-note', opacity: 0}, changedMarker(ctx, {x: x + mR * 0.85, y: y + F * 0.55, radius: mR * 0.85}), textAt(f, x + mR * 2 + 12, y, th.fg))};
      }});
    }
    items.push({make: w => {
      const f = fitG(p.labels.key, {maxWidth: w - 8, size: Fc, minSize: Fc, maxLines: 4, weight: 500});
      return {h: f.height + F * 0.75, truncated: f.truncated, node: (x, y) => g({name: 'key'},
        h('path', {d: `M${r(x)} ${r(y)}H${r(x + Math.min(w, f.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
        textAt(f, x, y + F * 0.45, th.fgSoft, {italic: true}))};
    }});
  }
  return items;
}

/** Column (stacked) or band (balanced columns) panel. */
function layoutPanel(items, box, F, flow, nCols) {
  const gap = F * 0.7;
  const cols = flow === 'column' ? 1 : nCols;
  const colGap = F * 1.6;
  const cw = (box.w - colGap * (cols - 1)) / cols;
  const made = items.map(it => ({it, m: it.make(cw)}));
  const problem = made.some(q => q.m.truncated) ? 'panel-trunc' : null;
  const hOf = arr => arr.reduce((a, q) => a + q.m.h, 0) + gap * Math.max(0, arr.length - 1);
  let columns = [made];
  let bestV = Infinity;
  const tryCols = cs => { const v = Math.max(...cs.map(hOf)); if (cs.every(c => c.length) && v < bestV) { bestV = v; columns = cs; } };
  if (cols === 2) for (let a = 1; a < made.length; a++) tryCols([made.slice(0, a), made.slice(a)]);
  if (cols === 3) for (let a = 1; a < made.length - 1; a++) for (let b = a + 1; b < made.length; b++) tryCols([made.slice(0, a), made.slice(a, b), made.slice(b)]);
  const height = Math.max(...columns.map(hOf));
  const out = {problem: problem || (height > box.h + 0.5 && flow === 'column' ? 'panel-height' : null), height, boxes: [], node: null};
  out.place = B => {
    const nodes = [];
    out.boxes = [];
    columns.forEach((col, ci) => {
      const x = B.x + ci * (cw + colGap);
      let y = B.y + Math.max(0, (B.h - hOf(col)) / 2);
      for (const q of col) {
        nodes.push(q.m.node(x, y));
        out.boxes.push({x, y, w: cw, h: q.m.h});
        y += q.m.h + gap;
      }
    });
    out.node = g({name: 'panel'}, nodes);
  };
  out.frame = u => ({
    ...(made.some(q => q.it.name === 'ctx-caption') ? {'ctx-caption': {opacity: r(seg(u, ...W.caption), 3)}} : {}),
    ...(made.some(q => q.it.name === 'marker-note') ? {'marker-note': {opacity: r(seg(u, W.marker[0] + 0.01, W.marker[1] + 0.01), 3)}} : {}),
  });
  return out;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-03-inspect',
    title: 'Venue assignment — inspecting the datum on the file tag and substituting it',
    titleEs: 'Asignación de órgano — Inspección y cambio de un dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Asignación de órgano',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The site plan with the clerk and the case file at the sorting point, routed to the venue whose supplied mapping tag equals the file datum, is the context. It stays large and in place, dimmed, while a lens over free space (never over a venue, its tags, the destination or the intake) enlarges a real copy of the sorting point, the clerk and the file; in the datum stack beside the file the old datum is struck through and docked as "was: …", the new one appears and only the dependent route changes — to the venue whose tag equals the new value, or to the waiting slot when none does. The plan returns to full size; a neutral Δ marks the change; seeking back restores the old datum.',
    tags: ['inspect', 'lens', 'site plan', 'venue', 'case file', 'datum', 'mapping', 'substitution', 'changed marker', 'route'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/markers.js', 'src/animations/roles/kits/mediation-labels.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
