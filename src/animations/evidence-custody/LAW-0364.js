/**
 * LAW-0364 — Etiquetado de indicio · inspect
 *
 * Storyboard (context: the state produced by the tagging action — on the evidence bench, the object lies in its bag
 * with the manila tag still clipped to it on its ball chain; a gloved hand rests at the bench edge; a legend lists
 * the item, the rows, custodians, times, the context caption and the key):
 *  0.00–0.20  context: the bagged, tagged object at rest; the focus row of the tag shows the before value (written,
 *             or blank when the supplied before value is empty).
 *  0.20–0.45  a lens opens beside the bag over free bench space: a real magnified copy (same coordinates) of the
 *             tag, every row printed as text; the context copy of the focus row is hidden as the lens appears.
 *  0.45–0.75  one datum is substituted: the before value lifts and fades, a small "before: …" trace stays under the
 *             row, then the after value is written in; only that row changes. The new value holds still.
 *  0.75–1.00  the lens closes back onto the tag; the context row now shows the after state, a neutral changed-datum
 *             marker (Δ) sits beside the tag. Nothing is inferred about validity, admissibility or custody. Seeking back
 *             restores the before value exactly.
 * @module animations/evidence-custody/LAW-0364
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  ecFields, EC_EN, EC_ES, localised, benchNode, gloveArm, panelLayout, panelNode, R2, fitG, textAt, tagArt, scribble,
  WRITE_INK, METAL, objectArt,
} from './kits/evidence-art.js';
import {
  EI_LABELS_EN, EI_LABELS_ES, eiLabelFields, resolveRecords, recordLine, stageModel, stageNodes, stageProps, anchorAt,
} from './kits/etiquetado-indicio.js';

const ID = 'LAW-0364';
const DURATION = 8000;
const W = {open: [0.2, 0.32], fadeOld: [0.45, 0.51], trace: [0.5, 0.56], writeNew: [0.54, 0.62], close: [0.75, 0.85], marker: [0.84, 0.9], legend: [0.85, 0.9]};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {before: 'before', after: 'now', changed: 'Changed datum', blankShort: 'blank'},
  es: {before: 'antes', after: 'ahora', changed: 'Dato cambiado', blankShort: 'en blanco'},
};

const OWN_EN = {
  labels: EI_LABELS_EN,
  records: [
    {field: 'Item no.', value: 'E-01'},
    {field: 'Description', value: 'Brass key'},
    {field: 'Collected by', value: 'R. Okoye'},
    {field: 'Time', value: ''},
  ],
  focusTarget: 3,
  beforeValue: '',
  afterValue: '10:05',
  detailGeometry: {zoom: 2, placement: 'auto'},
  contextLabels: {context: 'The tagged key in its bag; the tag stays attached', marker: 'Only this row was changed'},
};
const OWN_ES = {
  labels: EI_LABELS_ES,
  records: [
    {field: 'N.º de indicio', value: 'E-01'},
    {field: 'Descripción', value: 'Llave de latón'},
    {field: 'Recogido por', value: 'R. Okoye'},
    {field: 'Hora', value: ''},
  ],
  focusTarget: 3,
  beforeValue: '',
  afterValue: '10:05',
  detailGeometry: {zoom: 2, placement: 'auto'},
  contextLabels: {context: 'La llave etiquetada en su bolsa; la etiqueta sigue unida', marker: 'Solo esta fila ha cambiado'},
};
const EN = {...EC_EN, ...OWN_EN};
const ES = {...EC_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...eiLabelFields,
  focusTarget: int('Index in `records` of the tag row that is enlarged and substituted', 0, 4),
  beforeValue: str('Value of that row before the substitution (empty = the row is blank)', 40),
  afterValue: str('Value of that row after the substitution (the alternative datum; empty = blank)', 40),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Minimum magnification of the lens (the lens grows further when room allows)', 1.5, 4),
    placement: oneOf('Side of the bag where the lens opens (auto = the larger free side)', ['auto', 'left', 'right', 'top', 'bottom']),
  }, ['zoom', 'placement']),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 50)}, ['context', 'marker']),
};

const defaultParams = {...EN};

function legendRows(ctx, P, recs, fi) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showAll) rows.push({kind: 'item', icon: 'bag', text: P.contextLabels.context, name: 'lg-context'});
  if (showKey) recs.forEach((rw, i) => { if (i !== fi) rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: recordLine(rw, P.labels.blank), name: `lg-rec${i}`}); });
  if (showKey) {
    const bv = P.beforeValue.trim() ? P.beforeValue : P.labels.blank;
    const av = P.afterValue.trim() ? P.afterValue : P.labels.blank;
    rows.push({kind: 'item', icon: 'row-blank', text: `${recs[fi].field}: ${ctx.t.before} ${bv}`, name: 'lg-before'});
    rows.push({kind: 'item', icon: 'row-filled', text: `${recs[fi].field}: ${ctx.t.after} ${av}`, name: 'lg-after'});
  }
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.contextLabels.marker, name: 'lg-marker'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Text layout of the enlarged tag (tag-local units; rendered size = local × zoom). */
function tagTexts(ctx, TG, recs, fi, P, zoom, showText) {
  const target = 20.5 / zoom, floor = 16 / zoom;
  let ok = true;
  const size = Math.min(Math.max(target, TG.pitch * 0.4), TG.pitch * 0.5);
  const RW = TG.rx1 - TG.rx0;
  // field column as wide as the widest field at the target size (bounded), the rest for values
  const fw = Math.max(...recs.map(rw => ctx.measure(rw.field || ' ', Math.min(size, Math.max(target, floor)), 600)));
  const colF = clamp(fw + 4, RW * 0.25, RW * 0.5);
  const colV = RW - colF - 8;
  if (size < floor) ok = false;
  const fitOne = (text, w, weight) => {
    const f = fitG(text || ' ', {maxWidth: w, size, minSize: Math.max(floor, Math.min(size * 0.8, target)), maxLines: 1, weight});
    if (!f.ok) ok = false;
    return f;
  };
  const fitTrace = (text, w) => {
    const f = fitG(text, {maxWidth: w, size: Math.max(floor, size * 0.85), minSize: floor, maxLines: 1, weight: 500});
    if (!f.ok) ok = false;
    return f;
  };
  const rows = recs.map((rw, i) => ({
    fieldFit: fitOne(rw.field, colF, 600),
    valueFit: fitOne(i === fi ? P.beforeValue : rw.value, colV, 500),
    afterFit: i === fi ? fitOne(P.afterValue, colV, 500) : null,
    traceFit: i === fi ? fitTrace(`${ctx.t.before}: ${P.beforeValue.trim() ? P.beforeValue : ctx.t.blankShort}`, colV) : null,
  }));
  return {rows, colF, ok: ok || !showText, size};
}

/** Legend layout for a size and arrangement (independent of the lens split, so it is computed once per pair). */
function legendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  let bench, panel = null, PL = null;
  if (!rows.length) bench = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs;
    if (cols === 1) PLs = [panelLayout(ctx, rows, {w: colW, F})];
    else {
      let best = null;
      for (let i = 1; i < rows.length; i++) {
        const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      PLs = best.cols;
    }
    const ph = Math.max(...PLs.map(q => q.h));
    PL = {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW};
    bench = {x: 0, y: 0, w: DW, h: DH - ph - gap};
    panel = {x: 4, y: DH - ph};
  } else {
    const PW = DW * opt.pw;
    const one = panelLayout(ctx, rows, {w: PW, F});
    PL = {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW};
    bench = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)};
  }
  return {bench, panel, PL};
}

function compose(ctx, P, recs, fi, F, opt, LG) {
  const {w: DW, h: DH} = ctx.design;
  const {bench, panel, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset, y: bench.y + inset, w: bench.w - inset * 2, h: bench.h - inset * 2};
  // bag zone and lens zone split the mat along its long axis
  const wideMat = mat.w / mat.h > 1.05;
  const pl = P.detailGeometry.placement;
  const lensFirst = wideMat ? pl === 'left' : pl === 'top';
  const split = opt.split ?? 0.46;
  const zoneBag = wideMat
    ? {x: lensFirst ? mat.x + mat.w * (1 - split) : mat.x, y: mat.y, w: mat.w * split, h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y + mat.h * (1 - split) : mat.y, w: mat.w, h: mat.h * split};
  const zoneLens = wideMat
    ? {x: lensFirst ? mat.x : mat.x + mat.w * split, y: mat.y, w: mat.w * (1 - split), h: mat.h}
    : {x: mat.x, y: lensFirst ? mat.y : mat.y + mat.h * split, w: mat.w, h: mat.h * (1 - split)};
  const so = {kind: P.items[0].kind, rows: recs.length, hangAngle: {key: 90, cup: 120, box: 105}[P.items[0].kind], chainScale: {key: 1.55, cup: 2.3, box: 2.6}[P.items[0].kind], tagAngle: 0, tagScale: 1.25, tagLong: 1.15};
  const G0 = stageModel({x: 0, y: 0, w: 1000, h: 700}, so);
  const kH = zoneBag.h * 0.94 / G0.B.h, kW = zoneBag.w * 0.94 / G0.B.w;
  const G = stageModel({x: 0, y: 0, w: 1000, h: 700}, {...so, scale: Math.min(kH, kW)});
  const dx = zoneBag.x + (zoneBag.w - G.B.w) / 2 - G.bag.x, dy = zoneBag.y + (zoneBag.h - G.B.h) / 2 - G.bag.y;
  G.bag = {x: G.bag.x + dx, y: G.bag.y + dy};
  G.objIn = {x: G.objIn.x + dx, y: G.objIn.y + dy};
  // tag in context (angle 0, hanging straight below the anchor)
  const anchor = anchorAt(G, G.objIn, 0);
  const ha = (G.hangAngle * Math.PI) / 180;
  const hole = {x: anchor.x + Math.cos(ha) * G.chainL, y: anchor.y + Math.sin(ha) * G.chainL};
  const TG = G.TG;
  const pad = 6;
  // the crop holds the whole tagged object (object + chain + tag), so every part lies wholly inside the lens
  const x0 = Math.min(hole.x + TG.x0, G.objIn.x - G.M.w / 2) - pad * 2, x1 = Math.max(hole.x + TG.x1, G.objIn.x + G.M.w / 2) + pad * 2;
  const y0 = G.objIn.y - G.M.h / 2 - pad * 2, y1 = hole.y + TG.h / 2 + pad * 2;
  const source = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
  const lw = zoneLens.w * 0.98, lh = zoneLens.h * 0.97;
  const zoom = Math.min(lw / source.w, lh / source.h);
  const dest = {w: source.w * zoom, h: source.h * zoom};
  dest.x = zoneLens.x + (zoneLens.w - dest.w) / 2; dest.y = zoneLens.y + (zoneLens.h - dest.h) / 2;
  const TX = tagTexts(ctx, TG, recs, fi, P, zoom, ctx.show('key'));
  const zoomOk = zoom >= P.detailGeometry.zoom - 1e-6 && zoom >= 1.5;
  const vs = Math.min(ctx.view.content.w / DW, ctx.view.content.h / DH);
  const lensBig = Math.min(dest.w, dest.h) * vs >= 0.355 * Math.min(ctx.view.width, ctx.view.height);
  const ok = (!PL || PL.ok) && G.fitsBag && zoomOk && TX.ok && lensBig;
  return {F, bench, mat, panel, PL, G, hole, anchor, source, dest, zoom, TX, zoneLens, ok,
    problems: [PL && !PL.ok && 'panel-text', !G.fitsBag && 'bag-fit', !zoomOk && 'zoom', !TX.ok && 'lens-text', !lensBig && 'lens-small'].filter(Boolean)};
}

function sceneParts(ctx, L) {
  const {C, P, recs, fi} = L;
  const G = C.G, TG = G.TG;
  const th = ctx.theme;
  const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
  const rowsAfter = recs.map(rw => ({filled: rw.filled, len: 0.7}));
  const S = stageNodes(ctx, G, {prefix: 'st', rows: rowsAfter, seedKey: 'ei-inspect'});
  // context: the focus row's after-state scribble (drawn over the tag at the tag's pose; hidden until the close)
  const R = TG.rows[fi];
  const xs = TG.rx0 + TG.stub + 8;
  const afterScr = P.afterValue.trim() ? h('path', {d: scribble(ctx, 'ei-inspect-after', xs, xs + (TG.rx1 - xs - 4) * 0.7, R.y, Math.min(R.h * 0.4, TG.h * 0.09)), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.8, TG.h * 0.02), 2), 'stroke-linecap': 'round'}) : null;
  const beforeScr = P.beforeValue.trim() ? h('path', {d: scribble(ctx, 'ei-inspect-before', xs, xs + (TG.rx1 - xs - 4) * 0.62, R.y, Math.min(R.h * 0.4, TG.h * 0.09)), fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.8, TG.h * 0.02), 2), 'stroke-linecap': 'round'}) : null;
  const showText = ctx.show('key');
  // lens content: the same tag at the same coordinates, printed with text
  const TX = C.TX;
  const texts = TX.rows.map(t => ({fieldFit: t.fieldFit, valueFit: t.valueFit}));
  const rowsL = recs.map((rw, i) => ({filled: i === fi ? false : rw.filled}));
  const vx = C.hole.x + TG.rx0 + TX.colF + 8;
  const vy = y => C.hole.y + y;
  const T0 = TX.rows[fi];
  const M = G.M;
  const content = g(null,
    h('rect', {x: r(C.source.x - 20), y: r(C.source.y - 20), width: r(C.source.w + 40), height: r(C.source.h + 40), fill: '#e6edf1'}),
    h('path', {d: `M${r(C.anchor.x)} ${r(C.anchor.y)}L${r(C.hole.x)} ${r(C.hole.y)}`, stroke: METAL, 'stroke-width': r(Math.max(5, G.S * 0.04)), 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(Math.max(5, G.S * 0.04) * 1.35, 2)}`}),
    g({transform: T(G.objIn.x, G.objIn.y)}, objectArt(ctx, M)),
  ),
  contentTag = g({transform: T(C.hole.x, C.hole.y)},
    tagArt(ctx, TG, {prefix: 'lt', rows: showText ? rowsL : recs.map(rw => ({filled: rw.filled, len: 0.7})), texts: showText ? texts : null, valueX: TG.rx0 + TX.colF + 8, seedKey: 'ei-inspect'}),
  );
  const focusParts = showText ? g(null,
    g({name: 'lv-before', opacity: 1}, P.beforeValue.trim() ? textAt(T0.valueFit, {x: vx, y: vy(R.y) - T0.valueFit.size * 0.86, fill: WRITE_INK}) : null),
    g({name: 'lv-after', opacity: 0}, P.afterValue.trim() ? textAt(T0.afterFit, {x: vx, y: vy(R.y) - T0.afterFit.size * 0.86, fill: WRITE_INK}) : null),
    g({name: 'lv-trace', opacity: 0}, textAt(T0.traceFit, {x: vx, y: vy(R.y) + 3, fill: th.fgSoft, italic: true})),
    h('rect', {name: 'lv-ring', x: r(C.hole.x + TG.rx0 - 7), y: r(vy(R.top) + 2), width: 3.5, height: r(R.h - 4), rx: 1.5, fill: th.accent2, opacity: 0}),
  ) : g(null,
    g({name: 'lv-before', opacity: 1}, beforeScr ? g({transform: T(C.hole.x, C.hole.y)}, beforeScr) : null),
    g({name: 'lv-after', opacity: 0}, afterScr ? g({transform: T(C.hole.x, C.hole.y)}, afterScr) : null),
    g({name: 'lv-trace', opacity: 0}),
    h('rect', {name: 'lv-ring', x: r(C.hole.x + TG.rx0 - 7), y: r(vy(R.top) + 2), width: 3.5, height: r(R.h - 4), rx: 1.5, fill: th.accent2, opacity: 0}),
  );
  const Lz = lens(ctx, {name: 'lens', source: C.source, dest: C.dest, frame: C.bench, content: g(null, content, contentTag, focusParts), color: th.accent2});
  return {Lz, beforeScr, afterScr, S, bench};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const fi = Math.min(P.records.length - 1, P.focusTarget);
    // the focus row's state follows beforeValue (rows other than the focus row are as supplied)
    const recs = resolveRecords(P).map((rw, i) => (i === fi ? {...rw, value: P.beforeValue, filled: P.beforeValue.trim().length > 0} : rw));
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'side', pw: 0.48}, {mode: 'side', pw: 0.54}, {mode: 'below', cols: 2}, {mode: 'below', cols: 1}]
        : [{mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.34}, {mode: 'side', pw: 0.38}];
    let C = null, best = null, bestScore = -1;
    // bounded search: stop two size steps after the first fitting composition (cold create stays fast)
    let firstOk = -1;
    const lgCache = new Map();
    const rowsL = legendRows(ctx, P, recs, fi);
    for (const [fi2, F] of SIZES.entries()) { if (firstOk >= 0 && fi2 > firstOk + 2) break; for (const o0 of opts) for (const split of [0.5, 0.42, 0.36, 0.3]) {
      const opt = {...o0, split};
      const key = `${F}|${JSON.stringify(o0)}`;
      if (!lgCache.has(key)) lgCache.set(key, legendFor(ctx, rowsL, F, o0));
      const LG = lgCache.get(key);
      if (LG.PL && !LG.PL.ok && C) continue;
      const c = compose(ctx, P, recs, fi, F, opt, LG);
      const score = c.G.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1) * Math.min(1.25, c.zoom / 2.2);
      if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi2;
      if (c.ok && score > bestScore) { best = c; bestScore = score; }
      if (!C || c.problems.length < C.problems.length) C = c;
    } }
    if (best) C = best;
    const armW = clamp(C.G.S * 0.24, 36, 52);
    const bb = C.bench.y + C.bench.h;
    C.shoulder = {x: C.bench.x + C.bench.w * 0.08, y: bb + 120};
    C.rest = {x: C.shoulder.x + armW * 1.2, y: bb - armW * 0.8};
    const arm = gloveArm(ctx, {name: 'armL', handed: 'left', upper: 120, lower: 120, width: armW});
    const L = {P, recs, fi, C, arm};
    L.lensF = sceneParts(ctx, L).Lz.frame;
    return L;
  },
  build(ctx, L) {
    const {C} = L;
    const {Lz, beforeScr, afterScr, S, bench} = sceneParts(ctx, L);
    const G = C.G;
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, panelNode(ctx, PLc))) : [];
    const mk = {x: C.source.x + C.source.w + 30, y: C.source.y + 8};
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        S.back, S.inside,
        g({name: 'ctx-before', transform: T(C.hole.x, C.hole.y)}, beforeScr),
        g({name: 'ctx-after', transform: T(C.hole.x, C.hole.y), opacity: 0}, afterScr),
        S.front,
        S.carried,
        L.arm.arm, L.arm.palm, L.arm.thumb,
        changedMarker(ctx, {name: 'marker', x: mk.x, y: mk.y, radius: Math.max(16, G.S * 0.11), opacity: 0}),
      ),
      bench.frame,
      Lz.node,
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, P, fi} = L;
    const G = C.G;
    const nodes = stageProps('st', G, {obj: G.objIn, lift: 0, inside: true, hole: C.hole, tagAngle: 0, chainEnd: C.anchor, clasp: 1});
    // the focus row of the inside copy is never drawn by the stage (its before / after copies are separate nodes)
    nodes[`st-in-tag-w${fi}`] = {'stroke-dashoffset': 100};
    nodes[`st-out-tag-w${fi}`] = {'stroke-dashoffset': 100};
    const pOpen = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    Object.assign(nodes, L.lensF(pOpen, pOpen));
    const kOld = seg(u, ...W.fadeOld), kTrace = seg(u, ...W.trace), kNew = seg(u, ...W.writeNew);
    const changed = u >= W.writeNew[0];
    // context copies of the datum: hidden in step with the lens opening; after the close the after-state shows
    const lensOn = u >= W.open[0] && u < W.close[1];
    const ctxBefore = u < W.open[0] ? 1 : 0;
    const ctxAfter = u >= W.close[1] ? 1 : 0;
    nodes['ctx-before'] = {opacity: ctxBefore};
    nodes['ctx-after'] = {opacity: ctxAfter};
    nodes['lv-before'] = {opacity: r(1 - kOld, 3), transform: T(0, -kOld * G.TG.pitch * 0.35)};
    nodes['lv-trace'] = {opacity: r(kTrace * 0.95, 3)};
    nodes['lv-after'] = {opacity: r(kNew, 3)};
    nodes['lv-ring'] = {opacity: r(seg(u, 0.34, 0.4), 3)};
    const mk = seg(u, ...W.marker);
    nodes.marker = {opacity: r(mk, 3)};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name === 'lg-after' || row.name === 'lg-marker') nodes[row.name] = {opacity: r(seg(u, ...(row.name === 'lg-after' ? W.writeNew : W.legend)), 3)};
    }
    const pr = L.arm.pose(C.shoulder, C.rest, 1);
    Object.assign(nodes, pr.nodes);
    const shown = u < W.fadeOld[0] + (W.fadeOld[1] - W.fadeOld[0]) / 2 ? 'before' : 'after';
    const phase = u < W.open[0] ? 'context' : u < W.open[1] ? 'open' : u < W.fadeOld[0] ? 'isolate' : u < W.writeNew[1] ? 'substitute' : u < W.close[0] ? 'hold-new' : u < W.close[1] ? 'close' : 'return';
    return {
      nodes,
      semantic: {
        phase, shown, lensP: r(pOpen, 3), lensOn, zoom: r(C.zoom, 3),
        value: shown === 'before' ? P.beforeValue : P.afterValue, ctxBefore, ctxAfter, lensBefore: r(1 - kOld, 3), lensAfter: r(kNew, 3),
        marker: r(mk, 3), changed, focus: fi, hole: R2(C.hole), source: {x: r(C.source.x), y: r(C.source.y), w: r(C.source.w), h: r(C.source.h)},
        dest: {x: r(C.dest.x), y: r(C.dest.y), w: r(C.dest.w), h: r(C.dest.h)}, bench: {x: r(C.bench.x), y: r(C.bench.y), w: r(C.bench.w), h: r(C.bench.h)},
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1), allReached: pr.reached,
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
    slug: 'evidence-custody-01-inspect',
    title: 'Evidence tagging — a lens enlarges the tag of a bagged object and one row\'s value is substituted, then the scene returns with a changed-datum marker',
    titleEs: 'Etiquetado de indicio — Inspección y cambio de un dato',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Etiquetado de indicio',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: on the evidence bench a fictional object lies in its bag with its manila tag still clipped on. A lens opens beside the bag with a real magnified copy of the tag (same coordinates), every row printed. One row\'s value is substituted (before → after, e.g. a blank time row receives a time); a small "before" trace stays under it. The lens closes onto the tag, the context row shows the new state and a neutral Δ marker remains. Nothing is inferred about validity, admissibility or custody; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'tag', 'label', 'inspect', 'lens', 'changed datum', 'evidence bag', 'chain', 'records'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/etiquetado-indicio.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
