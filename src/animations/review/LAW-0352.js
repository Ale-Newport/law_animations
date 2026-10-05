/**
 * LAW-0352 — Devolución para nuevo examen · inspect
 *
 * Storyboard (the desk after the return: the route board with its trays under their plates, the review desk mat, the
 * lane with chevron arrows and the filter doors; the folder with its slip of review notes lies in the configured
 * tray; a routing tag on a rail along the desk's lower edge, joined to the folder by a cord, states the return point —
 * the supplied datum):
 *  0.00–0.20  context: the state produced by the return, held still; the legend lists the route and the notes.
 *  0.20–0.45  a lens opens on the routing tag — a real enlarged copy (same coordinates) of the tag, its cord stub and
 *             the lane above it; while the lens holds the tag, the context tag is a blank card (the datum is legible
 *             in ONE place only).
 *  0.45–0.75  substitution of one datum: the old value lifts away and the alternative supplied value settles; the
 *             lens closes; then only the dependent geometry follows: the doors of the old point close, those of the
 *             new point open and the folder (with its notes, the tag riding along) runs along the lane to the new
 *             tray; a ghost outline keeps the old position traceable.
 *  0.75–1.00  back to the context: the folder lies at the new point, the ghost and the neutral changed-datum marker
 *             (Δ) stay; seeking back restores the old datum exactly. No validity, rule or result is inferred.
 * @module animations/review/LAW-0352
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {str, num, int, obj, oneOf} from '../../schemas/fields.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {deskWindow} from '../../primitives/desk.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens as makeLens} from '../../frameworks/lens.js';
import {
  dnFields, DN_EN, DN_ES, localisedDn, resolveDn, boardModel, laneArt, folderArt, slipArt, trayArt, matArt, plateArt,
  doorArt, doorT, calendarNode, indexPip, panelLayout, panelNode, fitG, textAt, INK, SLATE, R2,
} from './kits/devolucion-nuevo-examen.js';

const ID = 'LAW-0352';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], back: [0.75, 1]};
const W = {open: [0.2, 0.36], oldOut: [0.46, 0.5], newIn: [0.5, 0.55], close: [0.6, 0.68], doors: [0.68, 0.72], move: [0.69, 0.79], marker: [0.8, 0.85], panelBack: [0.66, 0.72]};
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  focusTarget: 'return-point',
  beforeValue: 'Return to: Point 2 (as supplied)',
  afterValue: 'Return to: Point 1 (as supplied)',
  afterIndex: 0,
  detailGeometry: {zoom: 2.8, placement: 'auto'},
  contextLabels: {context: 'The desk after the return (as supplied)', marker: 'Changed datum: the return point on the tag'},
};
const OWN_ES = {
  focusTarget: 'return-point',
  beforeValue: 'Devolver a: Punto 2 (según lo aportado)',
  afterValue: 'Devolver a: Punto 1 (según lo aportado)',
  afterIndex: 0,
  detailGeometry: {zoom: 2.8, placement: 'auto'},
  contextLabels: {context: 'La mesa tras la devolución (según lo aportado)', marker: 'Dato cambiado: el punto de devolución de la etiqueta'},
};
const EN = {...DN_EN, ...OWN_EN};
const ES = {...DN_ES, ...OWN_ES};

const sceneSchema = {
  ...dnFields,
  focusTarget: oneOf('Detail enlarged and substituted: the routing tag that names the return point', ['return-point']),
  beforeValue: str('Text of the routing tag before the substitution (the supplied datum)', 80),
  afterValue: str('Text of the routing tag after the substitution (the alternative supplied datum)', 80),
  afterIndex: int('Index in routes.stations of the return point after the substitution (the folder and the open doors follow it)', 0, 2),
  detailGeometry: obj('Lens geometry', {zoom: num('Preferred magnification of the lens (at least 1.5 is always kept)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'bottom'])}, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 70)}, ['context', 'marker']),
};

const defaultParams = {...EN};

function resolve(P) {
  const R = resolveDn(P);
  const after = Math.max(0, Math.min(R.n - 1, P.afterIndex | 0));
  return {...R, after, changed: after !== R.target};
}

function compose(ctx, P, R, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const problems = [];
  const rows = [];
  if (showAll) rows.push({kind: 'heading', icon: 'tray', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) rows.push({kind: 'item', icon: 'lane', text: P.labels.route, name: 'lg-route'});
  if (showKey) rows.push({kind: 'item', icon: 'folder', text: P.decisions.title, name: 'lg-folder'});
  if (showKey) R.notes.forEach((t, i) => rows.push({kind: 'item', icon: 'note', index: i, text: t, name: `lg-note${i}`}));
  if (showKey && v.pips) P.routes.stations.forEach((st, i) => rows.push({kind: 'item', icon: 'pip', index: i, text: st, name: `lg-st${i}`}));
  if (showKey && v.pips) rows.push({kind: 'item', icon: 'mat', text: P.routes.origin, name: 'lg-origin'});
  if (showKey) rows.push({kind: 'item', icon: 'pin', text: P.labels.point, name: 'lg-point'});
  if (showKey) rows.push({kind: 'item', icon: 'blank', text: P.outcomes.renewed, name: 'lg-renewed'});
  if (showKey) rows.push({kind: 'item', icon: 'ring', color: ctx.theme.accent2, text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  const side = ctx.view.shape === 'landscape' || v.side;
  const fitS = Math.min(ctx.view.content.w / DW, ctx.view.content.h / DH);
  const shortD = Math.min(ctx.view.width, ctx.view.height) / fitS;
  const gap = v.side ? F * 0.6 : F * 1.2;
  const deskW = side ? DW * v.dw : DW;
  const bandW = side ? DW - deskW - gap : DW - 8;
  const cols = [];
  if (rows.length) {
    const nC = !side ? 2 : 1;
    const cg = F * 1.4, cw = (bandW - cg * (nC - 1)) / nC, per = Math.ceil(rows.length / nC);
    for (let c = 0; c < nC; c++) {
      const part = rows.slice(c * per, (c + 1) * per);
      if (!part.length) continue;
      const PLc = panelLayout(ctx, part, {w: cw, F});
      if (!PLc.ok) problems.push('panel-text');
      cols.push({PL: PLc, x: c * (cw + cg)});
    }
  }
  const panelH = cols.length ? Math.max(...cols.map(c => c.PL.h)) : 0;
  const lensMinH = shortD * 0.37;
  let desk, band;
  if (side) {
    desk = {x: 0, y: 0, w: deskW, h: DH};
    band = {x: deskW + gap, y: 4, w: bandW - 4, h: DH - 8};
    if (panelH > DH) problems.push('panel-tall');
  } else {
    // (1:1 step-back: the desk fills the square at context and hold; while the lens is open it steps back to a corner)
    const Ha = v.step ? panelH + F * 0.4 : Math.max(panelH + F * 0.4, lensMinH * 1.05, ctx.view.shape === 'portrait' ? DH * 0.44 : 0);
    desk = {x: 0, y: 0, w: DW, h: DH - Ha - gap};
    band = {x: 4, y: DH - Ha, w: DW - 8, h: Ha};
  }
  const inset = Math.max(14, F * 0.8);
  const box = {x: desk.x + inset, y: desk.y + inset, w: desk.w - inset * 2, h: desk.h - inset * 2};
  // tag: a card on a rail along the desk's lower edge (below the lane)
  const TW = v.relax ? box.w * 0.4 : Math.min(box.w * 0.42, Math.max(F * 9, box.w / (R.n + 1.45) * 1.25));
  const fitB = showKey ? fitG(P.beforeValue, {maxWidth: TW - F * 1.2, size: F, minSize: F, maxLines: v.relax ? 5 : 3, weight: 600}) : null;
  const fitA = showKey ? fitG(P.afterValue, {maxWidth: TW - F * 1.2, size: F, minSize: F, maxLines: v.relax ? 5 : 3, weight: 600}) : null;
  if ((fitB && !fitB.ok) || (fitA && !fitA.ok)) problems.push('tag-text');
  const tagH = Math.max(fitB ? fitB.height : F * 1.4, fitA ? fitA.height : F * 1.4) + F * 0.9;
  const B = boardModel(ctx, {orient: 'row', box, F, names: P.routes.stations, origin: P.routes.origin, showText: showKey && !v.pips, target: R.target, slipN: R.notes.length, handRoom: v.mb ? F * 0.6 : tagH + F * 1.4, matBelow: !!v.mb, matGap: tagH + F * 1.6, matPlate: v.mb ? 'under' : undefined, maxFw: v.maxFw ?? (v.mb ? 400 : 320), plateLines: v.pl ?? 3, reviewW: v.rw, folderMin: v.fmin});
  problems.push(...B.problems.filter(q => !(v.relax && (q === 'slip-small' || q === 'calendar-small'))));
  const tagY = B.lane.a.y + B.fh / 2 + F * 0.9; // top of the tag
  if (tagY + tagH > box.y + box.h + inset * 0.5) problems.push('tag-low');
  const tagX = x => Math.max(box.x, Math.min(box.x + box.w - TW, x - TW / 2));
  const S0 = B.slots[R.target], S1 = B.slots[R.after];
  const path = polyline([S0.rest, {x: S0.rest.x, y: B.lane.a.y}, {x: S1.rest.x, y: B.lane.a.y}, S1.rest]);
  // lens source: the tag (at its place before the substitution), its cord stub and the lane above it
  const t0x = tagX(S0.rest.x);
  let src = {x: t0x - F * 0.8, y: B.lane.a.y - B.lane.w * 0.8, w: TW + F * 1.6, h: tagY + tagH + F * 0.6 - (B.lane.a.y - B.lane.w * 0.8)};
  if (v.step) {
    // the context steps back to scale sK at the top-left; the lens grows in the freed space (zoom measured at rest)
    const sK = v.sK ?? 0.52;
    // (a real inspection: grow the crop around the tag until the stepped-back lens can be large enough)
    {
      const kMax = Math.max(1.5, P.detailGeometry.zoom);
      const need = shortD * 0.42 / kMax;
      if (src.h < need) src = {...src, y: src.y - (need - src.h) * 0.7, h: need};
      if (src.w < need) src = {...src, x: src.x - (need - src.w) / 2, w: need};
      src.x = Math.max(desk.x + 3, Math.min(src.x, desk.x + desk.w - 3 - src.w));
      src.y = Math.max(desk.y + 3, Math.min(src.y, desk.y + desk.h - 3 - src.h));
    }
    const sw = {x: src.x * sK, y: src.y * sK, w: src.w * sK, h: src.h * sK};
    // the lens grows below the stepped-back context, or beside it when that leaves the larger lens
    const LbD = side ? {x: 4, y: desk.h * sK + gap, w: desk.w - 8, h: DH - desk.h * sK - gap - 4} : {x: 4, y: desk.h * sK + gap, w: DW - 8, h: DH - desk.h * sK - gap - 4};
    const LbR = {x: desk.w * sK + gap, y: 4, w: DW - desk.w * sK - gap - 4, h: DH - 8};
    const kOf = b => Math.min(b.w / sw.w, b.h / sw.h, Math.max(1.5, P.detailGeometry.zoom) / sK);
    const Lb = !side && LbR.w > 0 && Math.min(sw.w, sw.h) * kOf(LbR) > Math.min(sw.w, sw.h) * kOf(LbD) ? LbR : LbD;
    const kS = kOf(Lb);
    if (kS * sK < 1.5 - 1e-6) problems.push('lens-zoom');
    const dest = {w: sw.w * kS, h: sw.h * kS};
    dest.x = Lb.x + (Lb.w - dest.w) / 2; dest.y = Lb.y + (Lb.h - dest.h) / 2;
    if (Math.min(dest.w, dest.h) < shortD * 0.343) problems.push('lens-small');
    if (globalThis.process?.env?.DN_DBG) console.log(JSON.stringify({sw, Lb, kS, dest, shortD, deskh: desk.h}));
    if (problems.length && !v.force) return {ok: false, problems};
    return {F, pips: !!v.pips, step: true, sK, lsrc: sw, desk, band, side, cols, panelH, box, B, TW, tagH, tagY, tagX, fitB, fitA, path, src, dest, k: kS * sK, shortD, ok: !problems.length, problems};
  }
  let k = Math.min(band.w / src.w, band.h / src.h, Math.max(1.5, P.detailGeometry.zoom));
  // a real inspection: grow the crop around the tag (more desk) until the lens is large enough
  if (Math.min(src.w, src.h) * k < lensMinH) {
    const need = lensMinH / k;
    if (src.h < need) { const d = need - src.h; src = {...src, y: src.y - d * 0.7, h: need}; }
    if (src.w < need) { const d = need - src.w; src = {...src, x: src.x - d / 2, w: need}; }
  }
  src.x = Math.max(desk.x + 3, Math.min(src.x, desk.x + desk.w - 3 - src.w));
  src.y = Math.max(desk.y + 3, Math.min(src.y, desk.y + desk.h - 3 - src.h));
  k = Math.min(k, band.w / src.w, band.h / src.h);
  if (k < 1.5 - 1e-6) problems.push('lens-zoom');
  const dest = {w: src.w * k, h: src.h * k};
  dest.x = band.x + (band.w - dest.w) / 2;
  dest.y = band.y + (band.h - dest.h) / 2;
  if (Math.min(dest.w, dest.h) < shortD * 0.343) problems.push('lens-small');
  if (src.x + src.w > dest.x - 2 && src.y + src.h > dest.y - 2 && src.x < dest.x + dest.w && src.y < dest.y + dest.h) problems.push('lens-over-source');
  if (problems.length && !v.force) return {ok: false, problems};
  return {F, pips: !!v.pips, desk, band, side, cols, panelH, box, B, TW, tagH, tagY, tagX, fitB, fitA, path, src, dest, k, shortD, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedDn(ctx, EN, ES);
    const R = resolve(P);
    const sq = [{dw: 1, step: true, mb: true, fmin: 4, relax: true, pl: 4, maxFw: 420}, {dw: 1, step: true, rw: 0.75, maxFw: 400, relax: true, pl: 4}, {dw: 1, step: true, rw: 0.9, maxFw: 400, relax: true, pl: 4}, {dw: 1, step: true}, {dw: 1}];
    // (labels hidden at 1:1: no legend column, so the board takes the whole square)
    const vs = ctx.view.shape === 'square' && !ctx.show('key') ? sq : ctx.view.shape === 'landscape' ? [0.7, 0.68, 0.66, 0.64, 0.6, 0.56, 0.52].map(dw => ({dw})) : ctx.view.shape === 'square' ? [...sq.slice(0, 3), {dw: 1}, ...[0.58, 0.56, 0.6].flatMap(dw => [4.4, 4.1].map(fmin => ({dw, side: true, pips: true, relax: true, rw: 1.2, fmin})))] : [{dw: 1, step: true, mb: true}, {dw: 1, step: true}, {dw: 1}];
    const sizes = !ctx.show('key') ? [30, 26, ...SIZES] : SIZES;
    let C = null, best = null;
    outer: for (const F of sizes) for (const v of vs) {
      const c = compose(ctx, P, R, F, v);
      if (!best || c.problems.length < best.n) best = {n: c.problems.length, F, v};
      if (c.ok) { C = c; break outer; }
    }
    if (globalThis.process?.env?.DN_DBG) { const c = compose(ctx, P, R, 21, sq[0]); console.log(c.problems); }
    C = C || compose(ctx, P, R, best.F, {...best.v, force: true});
    const lensGeom = makeLens(ctx, {name: 'lens', source: C.lsrc || C.src, dest: C.dest, content: null, color: ctx.theme.accent2});
    return {P, R, C, lensGeom};
  },
  build(ctx, L) {
    const {C, R} = L;
    const th = ctx.theme;
    const B = C.B;
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const tag = (p, fitB, fitA) => g({name: p},
      h('path', {d: roundRectPath(5, 7, C.TW, C.tagH, 10), fill: th.shadow}),
      h('path', {d: roundRectPath(0, 0, C.TW, C.tagH, 10), fill: '#fffdf6', stroke: INK, 'stroke-width': 2.5}),
      h('circle', {cx: r(C.TW / 2), cy: 0, r: 6, fill: SLATE, stroke: INK, 'stroke-width': 1.5}),
      fitB ? g({name: `${p}-b`}, textAt(fitB, {x: C.F * 0.6, y: (C.tagH - fitB.height) / 2, fill: INK})) : h('rect', {name: `${p}-b`, x: r(C.F * 0.6), y: r(C.tagH / 2 - C.F * 0.25), width: r((C.TW - C.F * 1.2) * 0.75), height: r(C.F * 0.5), rx: 4, fill: th.paperLine}),
      fitA ? g({name: `${p}-a`, opacity: 0}, textAt(fitA, {x: C.F * 0.6, y: (C.tagH - fitA.height) / 2, fill: INK})) : h('rect', {name: `${p}-a`, opacity: 0, x: r(C.F * 0.6), y: r(C.tagH / 2 - C.F * 0.25), width: r((C.TW - C.F * 1.2) * 0.5), height: r(C.F * 0.5), rx: 4, fill: th.paperLine}),
    );
    const rail = h('rect', {x: r(C.box.x), y: r(C.tagY - 4), width: r(C.box.w), height: 8, rx: 4, fill: SLATE, opacity: 0.55});
    const showKey = ctx.show('key');
    const slots = B.slots.map(s => g(null,
      g({transform: T(s.plate.x, s.plate.y)}, plateArt(ctx, {w: s.plate.w, h: s.plate.h, F: C.F, fit: s.plate.fit, pin: false, textName: s.plate.fit ? `ptxt${s.i}` : undefined}),
        C.pips && s.station ? h('rect', {x: r(C.F * 0.3), y: 3, width: r(s.plate.w - C.F * 0.6), height: r(s.plate.h - 6), rx: 8, fill: th.card}) : null,
        C.pips && s.station ? g({transform: T(s.plate.w / 2, s.plate.h / 2)}, indexPip(s.i, s.plate.h * 0.36)) : null),
      g({transform: T(s.tray.x, s.tray.y)}, s.station ? trayArt(ctx, {w: s.tray.w, h: s.tray.h, mouth: 'bottom'}) : matArt(ctx, {w: s.tray.w, h: s.tray.h})),
    ));
    const doors = B.doors.map(d => d.halves.map((hv, k) => g({name: `door${d.i}${k}`, transform: doorT(hv, d.i === R.target ? 1 : 0)}, doorArt(ctx, {len: hv.len, t: B.doorT}))));
    const S0 = B.slots[R.target];
    const ghost = h('rect', {name: 'ghost', x: r(S0.rest.x - B.fw / 2), y: r(S0.rest.y - B.fh / 2), width: r(B.fw), height: r(B.fh), rx: 9, fill: 'none', stroke: SLATE, 'stroke-width': 3, 'stroke-dasharray': '8 7', opacity: 0});
    const slip = slipArt(ctx, {n: R.notes.length, s: B.slipS});
    const lensContent = g(null,
      h('rect', {x: r(C.src.x - 400), y: r(C.src.y - 400), width: r(C.src.w + 800), height: r(C.src.h + 800), fill: th.woodTop}),
      laneArt(ctx, B, {branchArrow: null}),
      rail,
      h('line', {name: 'lcord', stroke: INK, 'stroke-width': 2.5}),
      g({name: 'ltagw'}, tag('ltag', C.fitB, C.fitA)),
    );
    const L2 = makeLens(ctx, {name: 'lens', source: C.lsrc || C.src, dest: C.dest, content: C.step ? g({transform: `scale(${C.sK})`}, lensContent) : lensContent, color: th.accent2});
    void showKey;
    return g({name: 'scene'},
      g({name: 'context'},
        desk.surface,
        g({'clip-path': desk.clip},
          laneArt(ctx, B, {branchArrow: null}),
          slots,
          g({transform: T(B.cal.x, B.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: B.cal.w, h: B.cal.h})),
          doors,
          ghost,
          rail,
          h('line', {name: 'cord', stroke: INK, 'stroke-width': 2.5}),
          g({name: 'folder'}, folderArt(ctx, {w: B.fw, h: B.fh})),
          g({name: 'slip'}, slip.node),
          g({name: 'ctagw'}, tag('ctag', C.fitB, C.fitA)),
          g({name: 'markerw', opacity: 0}, changedMarker(ctx, {radius: Math.max(16, C.F * 0.85)})),
        ),
        desk.frame,
      ),
      C.cols.length ? g({name: 'panel', transform: T(C.band.x, C.band.y + Math.max(0, (C.band.h - C.panelH) / 2))}, C.cols.map(col => g({transform: T(col.x, 0)}, panelNode(ctx, col.PL)))) : null,
      L2.node,
    );
  },
  frame(ctx, L, u) {
    const {C, R} = L;
    const B = C.B;
    const nodes = {};
    // (1:1 step-back: the lens opens while the context steps back, and closes while it comes forward)
    const kOpen = ease.inOutCubic(C.step ? seg(u, 0.16, 0.26) : seg(u, ...W.open));
    const kClose = ease.inOutCubic(seg(u, ...W.close));
    const p = kOpen * (1 - kClose);
    Object.assign(nodes, L.lensGeom.frame(p, 0));
    // (step-back: the lens grows in free space, away from its source, so it is shown early; its copy's text only from
    // 45 % open, when it renders above the size floor)
    const lensVis = C.step ? clamp((p - 0.3) / 0.15) : clamp((p - 0.86) / 0.1);
    const lensText = C.step ? (p >= 0.45 ? 1 : 0) : 1;
    nodes.lens = {opacity: r(lensVis, 3)};
    let ctxS = 1;
    if (C.step) {
      const back = ease.inOutCubic(seg(u, 0.17, 0.27)), fwd = ease.inOutCubic(seg(u, 0.64, 0.68));
      ctxS = 1 - (1 - C.sK) * (back - fwd);
    }
    nodes.context = {transform: `scale(${r(ctxS, 4)})`};
    const kOld = seg(u, ...W.oldOut), kNew = seg(u, ...W.newIn);
    const kMove = R.changed ? ease.inOutCubic(seg(u, ...W.move)) : 0;
    const kDoor = R.changed ? ease.inOutCubic(seg(u, ...W.doors)) : 0;
    const f = C.path.at(kMove);
    nodes.folder = {transform: T(f.x, f.y)};
    nodes.slip = {transform: T(f.x + B.fw * 0.3, f.y - B.fh * 0.2)};
    const tx = C.tagX(f.x);
    nodes.ctagw = {transform: T(tx, C.tagY)};
    nodes.ltagw = {transform: T(tx, C.tagY)};
    const cord = {x1: r(f.x), y1: r(f.y + B.fh * 0.35), x2: r(tx + C.TW / 2), y2: r(C.tagY)};
    nodes.cord = cord;
    nodes.lcord = cord;
    for (const d of B.doors) d.halves.forEach((hv, k) => {
      const open = d.i === R.target ? 1 - kDoor : d.i === R.after ? kDoor : 0;
      // (no mid-swing bars across the tray floor: a swinging pair fades out at its old pose and back in at the new one)
      const kk = d.i === R.target && !R.changed ? 1 : open;
      const moving = kk > 0 && kk < 1;
      nodes[`door${d.i}${k}`] = {transform: doorT(hv, moving ? (kk < 0.5 ? 0 : 1) : kk), opacity: moving ? r(Math.abs(kk * 2 - 1), 3) : 1};
    });
    nodes.ghost = {opacity: r(R.changed ? clamp(kMove * 3) : 0, 3)};
    const lensHolds = lensVis > 0;
    const oldOp = 1 - kOld, newOp = kNew;
    nodes['ltag-b'] = {opacity: r(oldOp * lensText, 3), transform: T(0, -C.F * 0.8 * kOld)};
    nodes['ltag-a'] = {opacity: r(newOp * lensText, 3), transform: T(0, 0)};
    // context text hides while the context is stepped back (it would render under the size floor)
    const small = ctxS < 0.95;
    for (const sl of B.slots) if (sl.plate.fit) nodes[`ptxt${sl.i}`] = {opacity: small ? 0 : 1};
    // the context tag is blank while the lens holds the datum (between open and close it shows nothing)
    const hiding = 0;
    const ctxOld = !lensHolds && !hiding && !small && u < W.newIn[0] ? 1 : 0;
    const ctxNew = !lensHolds && !hiding && !small && u >= W.newIn[0] ? 1 : 0;
    nodes['ctag-b'] = {opacity: ctxOld, transform: T(0, 0)};
    nodes['ctag-a'] = {opacity: ctxNew, transform: T(0, 0)};
    const mk = seg(u, ...W.marker);
    nodes.markerw = {opacity: r(mk, 3), transform: T(tx + C.TW - 4, C.tagY + 4)};
    let panelOp = 1;
    if (C.cols.length) {
      // the legend steps aside under the lens and comes back once it closes
      panelOp = clamp(1 - kOpen * 3) + clamp((kClose - 0.3) / 0.5);
      nodes.panel = {opacity: r(clamp(panelOp), 3)};
      for (const col of C.cols) for (const rw of col.PL.rows) if (rw.name === 'lg-marker') nodes[rw.name] = {opacity: r(mk, 3)};
    }
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const datum = u < W.newIn[0] ? 'before' : 'after';
    const atRest = (s) => Math.hypot(f.x - B.slots[s].rest.x, f.y - B.slots[s].rest.y) < 1;
    const tagW = {x: tx, y: C.tagY};
    return {
      nodes,
      semantic: {
        beat, datum,
        lensOpen: r(p, 3), lensShown: r(lensVis, 3), zoom: r(C.k, 3),
        src: {x: r(C.src.x), y: r(C.src.y), w: r(C.src.w), h: r(C.src.h)},
        dest: {x: r(C.dest.x), y: r(C.dest.y), w: r(C.dest.w), h: r(C.dest.h)},
        tag: R2(tagW), lensTag: lensHolds ? R2({x: C.dest.x + (tagW.x - C.src.x) * C.k, y: C.dest.y + (tagW.y - C.src.y) * C.k}) : null,
        folderC: R2(f), atBefore: atRest(R.target), atAfter: atRest(R.after), move: r(kMove, 3),
        datumInLens: lensHolds, ctxOld, ctxNew, lensOld: r(lensHolds ? oldOp * lensText : 0, 3), lensNew: r(lensHolds ? newOp * lensText : 0, 3),
        ghost: r(R.changed ? clamp(kMove * 3) : 0, 3), marker: r(mk, 3), changed: R.changed,
        before: R.target, after: R.after, panel: r(clamp(panelOp), 3), contextScale: r(ctxS, 4),
        problems: C.problems, textPx: r(C.F, 1),
        desk: {x: r(C.desk.x), y: r(C.desk.y), w: r(C.desk.w), h: r(C.desk.h)},
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'review-08-inspect',
    title: 'Return for a new examination — a lens on the routing tag: the return point is substituted, then the folder runs to the new tray',
    titleEs: 'Devolución para nuevo examen — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Devolución para nuevo examen',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The desk after the return: the route board with the folder and its review notes in the configured tray and a routing tag on a rail, joined to the folder by a cord, naming the return point (the supplied datum). A lens opens on the tag (a real enlarged copy at the same coordinates); its value is substituted by the alternative supplied value. The lens closes and only the dependent geometry follows: the old doors close, the new ones open and the folder runs along the lane to the new tray, leaving a ghost outline; a neutral changed-datum marker stays on the tag. Seeking back restores the old datum. No validity, rule or result; jurisdiction unspecified.',
    tags: ['review', 'return for a new examination', 'inspect', 'lens', 'routing tag', 'return point', 'substitution', 'changed datum', 'folder', 'filter doors'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/devolucion-nuevo-examen.js', 'src/animations/review/kits/limites-de-revision.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
