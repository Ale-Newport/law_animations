/**
 * LAW-0456 — Vencimiento de propuesta · inspect
 *
 * Storyboard (context = the state produced by the story's action: the proposal
 * in Party B's rack beside the clock, the response in Party A's rack, the clock's
 * hand at its final position, the strip "Sequence as supplied (illustrative)"
 * showing every station in the supplied order, the milestone's included):
 *  0.00–0.20  context at rest in its part of the frame; the other part holds a
 *             panel (context caption, the ●/◆ legend, the key).
 *  0.20–0.28  isolate: the panel leaves and a lens grows at its own place in that
 *             part: a real enlarged copy (≥ 1.5×) of the strip's record — the
 *             response's stations and the milestone's station — guides join lens
 *             and stations; the context's copy of the inspected label is hidden
 *             while the lens shows it (one place at a time).
 *  0.36–0.42  the old label (the supplied before value) is struck in the lens.
 *  0.47–0.53  the datum changes IN THE SCENE: the inspected event's time label
 *             (by default the milestone's) turns over (its text hidden while it
 *             turns) and comes back with the supplied after value, its chip
 *             re-fitted to it. Nothing else moves: the stations keep the supplied
 *             order, the clock's hand keeps its place (the strip is never
 *             re-ordered from the labels). The new value stays still in the open
 *             lens ≥ 400 ms.
 *  0.74–0.80  return: the lens closes onto the identical stations; a Δ marks the
 *             changed label; the panel comes back with the supplied marker label,
 *             the struck "was:" value and the key "As supplied · no conclusion
 *             drawn". Seeking back restores the old datum exactly.
 * The mark is a supplied milestone only; nothing says what follows from a label
 * being earlier or later.
 * @module animations/contract-formation/LAW-0456
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  motifFields, DEFAULT_CONTENT, KIT_STRINGS, EVENTS, INK, DEFAULT_PX, layoutScene, buildScene, poseScene,
  fitW, chipW, overlaps, insideBox, unionBox, glyph, headBox, figureBox,
  localizeScene,
} from './kits/hito-propuesta.js';

const ID = 'LAW-0456';
const DURATION = 8000;
const W = {
  open: [0.2, 0.28], strike: [0.36, 0.42], turnOut: [0.47, 0.5], turnIn: [0.5, 0.53],
  close: [0.74, 0.8], marker: [0.8, 0.84], notes: [0.83, 0.88],
  // the panel fills the lens's part of the frame at rest and at the hold; it leaves as the lens starts and returns as
  // it ends (never ~200 ms with neither readable)
  panelOut: [0.18, 0.2], panelIn: [0.8, 0.84],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, partiesT: 'Left: {a} · right: {b}', was: 'was', legP: 'Proposal (message card)', legW: 'Response (message card)', kept: 'The stations keep the supplied order'},
  es: {...KIT_STRINGS.es, partiesT: 'Izquierda: {a} · derecha: {b}', was: 'antes', legP: 'Propuesta (tarjeta del mensaje)', legW: 'Respuesta (tarjeta del mensaje)', kept: 'Las estaciones conservan el orden aportado'},
};

const sceneSchema = {
  ...motifFields,
  focusTarget: oneOf('Which event of the supplied sequence has its time label inspected and substituted', EVENTS),
  beforeValue: str('Time label the inspected event shows before the substitution (fictional)', 40),
  afterValue: str('Alternative time label supplied for the same event (fictional)', 40),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens (≥ 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'below'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 70)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  focusTarget: 'milestone',
  beforeValue: 'Day 3, 12:00 (fictional)',
  afterValue: 'Day 3, 18:00 (fictional)',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'Response received; the milestone as supplied', marker: 'Changed: the milestone\'s time label'},
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  parties: [{name: 'Nadia Park', role: 'Parte A'}, {name: 'Tomás Ribeiro', role: 'Parte B'}],
  offer: {reference: 'OF-2041', title: 'Oferta de suministro'},
  terms: [
    {key: 'item', label: 'Artículo', value: 'Sillas de roble'},
    {key: 'quantity', label: 'Cantidad', value: '40'},
  ],
  responses: [{reference: 'RS-2041', text: 'Respuesta a la propuesta OF-2041'}],
  sequence: [
    {event: 'proposal-received', time: 'Día 1, 09:00 (ficticio)'},
    {event: 'response-sent', time: 'Día 2, 10:00 (ficticio)'},
    {event: 'response-received', time: 'Día 2, 15:00 (ficticio)'},
    {event: 'milestone', time: 'Día 3, 12:00 (ficticio)'},
  ],
  focusTarget: 'milestone',
  beforeValue: 'Día 3, 12:00 (ficticio)',
  afterValue: 'Día 3, 18:00 (ficticio)',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'Respuesta recibida; el hito según lo aportado', marker: 'Cambio: la etiqueta temporal del hito'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

/** The context's sequence: the inspected event shows the supplied before value. */
function contextSequence(p) {
  return p.sequence.map(e => (e.event === p.focusTarget ? {...e, time: p.beforeValue} : e));
}

/** Δ marker (ink disc, white triangle). */
function deltaMark(ctx, {name, x, y, R, opacity}) {
  const s = R * 0.46;
  return g({name, opacity},
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: INK, stroke: ctx.theme.paper, 'stroke-width': r(Math.max(2.5, R * 0.18))}),
    h('path', {d: `M${r(x)} ${r(y - s)}l${r(s)} ${r(s * 1.7)}h${r(-2 * s)}z`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(Math.max(2.5, R * 0.18)), 'stroke-linejoin': 'round'}));
}

/** Station and event index of the focus event (-1 when absent). */
function focusOf(L, ev) {
  for (let i = 0; i < L.stations.length; i++) {
    const j = L.stations[i].events.findIndex(e => e.event === ev);
    if (j >= 0) return {i, j};
  }
  return null;
}

/** One attempt: the context in one part of the frame, the lens (and the panel) in the other. */
function compose(ctx, p, o) {
  const th = ctx.theme;
  const DW = ctx.design.w, DH = ctx.design.h;
  const {upx, px, split} = o;
  const F = px.F / upx, FL = px.L / upx;
  const why = [];
  const right = split.dir === 'right';
  const stageBox = right ? {x: 6, y: 4, w: DW * split.frac - 12, h: DH - 8} : {x: 6, y: 4, w: DW - 12, h: DH * split.frac - 8};
  const region = right ? {x: DW * split.frac + 4, y: 6, w: DW * (1 - split.frac) - 10, h: DH - 12} : {x: 8, y: DH * split.frac + 2, w: DW - 16, h: DH * (1 - split.frac) - 8};
  // (a part too small for a lens whose short side is ≥ 35 % of the frame's short side: no layout here)
  if (Math.min(region.w, region.h) - 8 < 0.35 * 1080 / upx && !o.force) return null;
  const aspect = stageBox.w / stageBox.h;
  const shape = aspect > 1.3 ? 'landscape' : aspect < 0.8 ? 'portrait' : 'square';
  const captions0 = [0, 1].map(i => (p.parties[i].role ? `${p.parties[i].name} · ${p.parties[i].role}` : p.parties[i].name));
  // (o.namesInPanel: the parties are named in the panel, not under the figures — the figures get the room)
  const captions = o.namesInPanel ? [null, null] : captions0;
  const seq = contextSequence(p);
  const common = {box: stageBox, shape, upx, headTarget: 0, sequence: seq, finalState: null, annotations: [], showFinal: false, captions,
    plates: null, ev: [0.24, 0.68], pxSets: [px], keyNote: false, alt: {[p.focusTarget]: p.afterValue}, kMin: 0.5, colFs: [11, 13, 9.5, 8.5], cardModes: o.cardModes ?? ['full'], innerFs: o.cardModes && o.cardModes[0] === 'head' ? [13, 11, 9.5, 8.5] : o.cardModes && o.cardModes[0] === 'token' ? [3] : undefined,
    arrs: shape === 'portrait' ? [{arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 2}, {arr: 'row', strip: 'below', cols: 2}] : shape === 'square' ? [{arr: 'row', strip: 'below', cols: 2}, {arr: 'row', strip: 'below', cols: 4}, {arr: 'stack', strip: 'mid', cols: 1}] : [{arr: 'row', strip: 'below', cols: 4}, {arr: 'row', strip: 'floor', cols: 4}, {arr: 'row', strip: 'below', cols: 2}, {arr: 'row', strip: 'mid', cols: 2}]};
  // (the context's layout does not depend on the crop: shared between the crops of one search)
  const ckey = JSON.stringify([px.F, split, o.cardModes, Boolean(o.namesInPanel)]);
  const LS = o.cache && o.cache.has(ckey) ? o.cache.get(ckey) : layoutScene(ctx, p, {...common, prefix: 'st-'});
  if (o.cache) o.cache.set(ckey, LS);
  if (!LS || (LS.why.includes('nofit') && !o.force)) return null;
  why.push(...LS.why);
  let fo = focusOf(LS, p.focusTarget);
  if (!fo) { if (!o.force) return null; why.push('focus'); fo = {i: LS.stations.length - 1, j: 0}; }
  // ---- crop: the strip's receipt stations (the focus event's station among them)
  // (crop 'receipts': every receipt station — the record that tells the two readings apart; 'focus': the inspected
  // station alone, when the receipts together make a crop too wide for a ≥ 1.5× lens)
  // (crop 'receipts': the record — the response's stations and the milestone's — that places the response before or
  // after the supplied mark; 'focus': the inspected station alone)
  const recv = o.crop === 'focus' ? [fo.i] : LS.stations.map((s0, i) => (s0.events.some(e => e.msg === 'response' || e.msg === 'milestone') || i === fo.i ? i : -1)).filter(i => i >= 0);
  const crop0 = unionBox(recv.map(i => LS.strip.stations[i].box));
  const pad = F * 0.6;
  let src = {x: crop0.x - pad, y: crop0.y - pad, w: crop0.w + 2 * pad, h: crop0.h + 2 * pad};
  const need = 0.35 * 1080 / upx + 2;
  const zFit = q => Math.min((region.w - 8) / q.w, (region.h - 8) / q.h, 3.2);
  let zoom = Math.max(1.5, Math.min(zFit(src), Math.max(p.detailGeometry.zoom, 2)));
  // (the parts a crop's outline must not cut through: every station and the strip's title)
  const cutters = [...LS.strip.stations.map(st => st.box), LS.strip.titleBox].filter(Boolean);
  const cuts = q => cutters.filter(b => overlaps(b, q, -1) && !(b.x >= q.x - 0.5 && b.y >= q.y - 0.5 && b.x + b.w <= q.x + q.w + 0.5 && b.y + b.h <= q.y + q.h + 0.5)).length;
  for (let it = 0; it < 4; it++) {
    const shortIsH = src.h <= src.w;
    const cur = Math.min(src.w, src.h) * zoom;
    if (cur >= need) break;
    // grown to the lens's least size: centred, or anchored at either edge — whichever cuts the fewest stations
    const opts = shortIsH
      ? [0.5, 0, 1].map(a => { const h2 = need / zoom; return {...src, y: src.y - (h2 - src.h) * a, h: h2}; })
      : [0.5, 0, 1].map(a => { const w2 = need / zoom; return {...src, x: src.x - (w2 - src.w) * a, w: w2}; });
    src = opts.reduce((a, b) => (cuts(b) < cuts(a) ? b : a));
    zoom = Math.max(1.5, Math.min(zFit(src), zoom));
  }
  // a station the outline would still cut is taken in whole
  for (let it = 0; it < 3 && cuts(src); it++) {
    const cut = cutters.filter(b => overlaps(b, src, -1));
    const u = unionBox([src, ...cut]);
    src = {x: u.x - F * 0.2, y: u.y - F * 0.2, w: u.w + F * 0.4, h: u.h + F * 0.4};
  }
  zoom = Math.max(1.5, Math.min(zFit(src), zoom));
  const zMax = zFit(src);
  if (zoom > zMax + 1e-6) { why.push('lens'); zoom = Math.max(0.5, zMax); }
  const dw = src.w * zoom, dh = src.h * zoom;
  const dest = right
    ? {x: region.x + (region.w - dw) / 2, y: clamp(src.y + src.h / 2 - dh / 2, region.y, region.y + region.h - dh), w: dw, h: dh}
    : {x: clamp(src.x + src.w / 2 - dw / 2, region.x, region.x + region.w - dw), y: region.y + Math.max(0, Math.min(40, (region.h - dh) / 2)), w: dw, h: dh};
  const lensShortFrac = Math.min(dw, dh) * upx / 1080;
  if (lensShortFrac < 0.35 - 1e-6) why.push('lensSmall');
  const G = LS.G;
  const heads = [headBox(G.A), headBox(G.B)];
  if (overlaps(dest, stageBox, -2)) why.push('lensOverContext');
  // the focus station and its time chip wholly inside the crop
  const fBox = LS.strip.stations[fo.i].evNodes[fo.j].box;
  const fieldWhole = [fBox].every(b => b.x >= src.x && b.y >= src.y && b.x + b.w <= src.x + src.w && b.y + b.h <= src.y + src.h);
  if (!fieldWhole) why.push('field');
  // ---- shares of the frame
  const f = fitDesign(ctx.view, DW, DH);
  const ext = unionBox([G.extent, LS.strip.box]);
  const contextFrac = right ? ext.w * f.scale / ctx.view.width : ext.h * f.scale / ctx.view.height;
  const coverFrac = right ? (ext.w + dw) * f.scale / ctx.view.content.w : (ext.h + dh) * f.scale / ctx.view.content.h;
  // (the context's share of the design box along the split: ≥ 40 %)
  const ctxShare = right ? ext.w / DW : ext.h / DH;
  if (ctxShare < 0.4) why.push('context');
  // ---- the panel in the lens's part: context caption, legend, the order note and the key at rest; at the hold the
  // marker label and the struck old value join them
  const items = [];
  if (ctx.show('all')) items.push({kind: 'context', text: p.contextLabels.context, weight: 700});
  if (ctx.show('all')) items.push({kind: 'mlabel', text: p.contextLabels.marker, hold: true, mark: true});
  if (ctx.show('all')) items.push({kind: 'was', text: `${ctx.t.was}: ${p.beforeValue}`, hold: true});
  const cm = LS.cardMode ?? 'full';
  // (the ●/◆ legend is not repeated when the card chips below carry the same glyphs; the generic order note makes
  // room for the parties when they are named here)
  if (ctx.show('all') && cm === 'full') items.push({kind: 'leg0', text: ctx.t.legP, glyph: 'proposal'}, {kind: 'leg1', text: ctx.t.legW, glyph: 'response'});
  else if (!ctx.show('all')) items.push({kind: 'leg0', glyph: 'proposal'}, {kind: 'leg1', glyph: 'response'});
  if (ctx.show('all') && !o.namesInPanel) items.push({kind: 'kept', text: ctx.t.kept});
  if (o.namesInPanel && ctx.show('key')) items.push({kind: 'parties', text: ctx.t.partiesT.replace('{a}', captions0[0]).replace('{b}', captions0[1])});
  // (compact cards in the context: their printed texts are given here, at rest and at the hold)
  if (ctx.show('all') && cm !== 'full') items.push({kind: 'cardP', text: `${ctx.t.proposal} · ${p.offer.reference}: ${[p.offer.title, ...p.terms.map(q => `${q.label}: ${q.value}`)].join(' · ')}`, glyph: 'proposal'});
  if (ctx.show('all') && (cm === 'token' || cm === 'head')) items.push({kind: 'cardW', text: `${ctx.t.response} · ${p.responses[0].reference}: ${p.responses[0].text}`, glyph: 'response'});
  if (ctx.show('key')) items.push({kind: 'key', text: ctx.t.key, label: true});
  const colW = Math.min(region.w - 16, 30 * F);
  const chipOf = (it, x, y, PF) => {
    const size = it.label ? FL : PF;
    if (it.glyph && !it.text) {
      const R = Math.min(region.h * 0.12, region.w * 0.12, 3 * F);
      return {node: g({name: it.kind, opacity: 0}, glyph(ctx, it.glyph, x + R * 1.3, y + R * 1.3, R)), box: {x, y, w: R * 2.6, h: R * 2.6}, bad: false};
    }
    const lead = it.glyph || it.mark ? size * 1.6 : 0;
    const c0 = chipW(ctx, it.text, {x: 0, y: 0, maxWidth: colW - lead, size, maxLines: 7, weight: it.weight ?? 600, stroke: th.inkSoft});
    const c = chipW(ctx, it.text, {x: x + lead, y, maxWidth: colW - lead, size, maxLines: 7, weight: it.weight ?? 600, stroke: it.kind === 'context' ? th.ink : th.inkSoft});
    const parts = [];
    if (it.glyph) parts.push(glyph(ctx, it.glyph, x + size * 0.6, y + c0.box.h / 2, size * 0.5));
    if (it.mark) parts.push(deltaMark(ctx, {x: x + size * 0.62, y: y + c0.box.h / 2, R: size * 0.62}));
    let extra = null;
    if (it.kind === 'was' && c.fit) {
      // strike the old value (every line after the prefix)
      const ff = c.fit;
      const skip = ctx.measure(`${ctx.t.was}: `, ff.size, ff.weight, 'sans');
      extra = ff.lines.map((ln, j) => {
        const lw = ctx.measure(ln, ff.size, ff.weight, 'sans');
        const x0 = c.box.cx - lw / 2 + (j === 0 ? skip : 0);
        const yl = c.box.y + (c.box.h - ff.height) / 2 + j * ff.lineHeight + ff.size * 0.52;
        return h('line', {x1: r(x0), x2: r(c.box.cx + lw / 2), y1: r(yl), y2: r(yl), stroke: th.inkSoft, 'stroke-width': 2.4});
      });
    }
    return {node: g({name: it.kind, opacity: 0}, parts, c.node, extra), box: {x, y, w: lead + c.box.w, h: c.box.h}, bad: c.fit.bad};
  };
  let PF = F, probe = [], sumH = 0;
  for (const m of [1.3, 1.2, 1.1, 1]) {
    PF = F * m;
    probe = items.map(it => ({it, c: chipOf(it, 0, 0, PF)}));
    sumH = probe.reduce((a, q) => a + q.c.box.h, 0);
    if (!probe.some(q => q.c.bad) && sumH + 16 * Math.max(0, probe.length - 1) <= region.h * 0.94) break;
  }
  const gap = probe.length > 1 ? clamp((region.h * 0.94 - sumH) / (probe.length - 1), 10, right ? 60 : 90) : 0;
  const colH = sumH + gap * Math.max(0, probe.length - 1);
  let yy = region.y + Math.max(0, (region.h - colH) / 2);
  const notes = [];
  for (const q of probe) {
    const cx = region.x + (region.w - q.c.box.w) / 2;
    const c = chipOf(q.it, cx, yy, PF);
    notes.push({kind: q.it.kind, name: q.it.kind, hold: Boolean(q.it.hold), node: c.node, box: c.box, bad: c.bad});
    yy += c.box.h + gap;
  }
  if (notes.some(n => n.bad) || !notes.every(n => insideBox(n.box, region, 2))) why.push('notes');
  const restBox = unionBox([ext, ...notes.filter(n => !n.hold).map(n => n.box)]);
  const restFill = right ? restBox.w * f.scale / ctx.view.width : restBox.h * f.scale / ctx.view.height;
  if (o.dry) return {ok: why.length === 0, why, zoom, head: 88 * G.k * upx};
  // ---- the lens copy: the same scene (same layout) under other names; fields its rim would cut are left out
  const LC = layoutScene(ctx, p, {...common, prefix: 'lzs-', fixed: LS.fixed});
  const cardMode = LS.cardMode;
  const inside = b => b && b.x >= src.x - 0.5 && b.y >= src.y - 0.5 && b.x + b.w <= src.x + src.w + 0.5 && b.y + b.h <= src.y + src.h + 0.5;
  const hit = b => b && b.x < src.x + src.w && b.x + b.w > src.x && b.y < src.y + src.h && b.y + b.h > src.y;
  // every text-bearing part of the copy not wholly inside the crop is left out (the rim never cuts a text, and no
  // clipped-out copy text lies over the context)
  const hideNames = new Set();
  LC.strip.stations.forEach((st, i) => { if (!inside(st.box)) hideNames.add(`lzs-seq-s${i}`); });
  if (LC.strip.titleBox && !inside(LC.strip.titleBox)) hideNames.add('lzs-seq-title');
  // (each card where it rests in the context: its receiving slot when its receipt is supplied, else its own slot)
  const restAt = m => (p.sequence.some(e => e.event === `${m}-received`) ? G.cardAt[m].b : G.cardAt[m].a);
  const cardB = m => ({x: restAt(m).x - G.cw / 2, y: restAt(m).y - G.ch / 2, w: G.cw, h: G.ch});
  if (!inside(cardB('proposal'))) hideNames.add('lzs-card-p');
  if (!inside(cardB('response'))) hideNames.add('lzs-card-r');
  // (the clock and its caption: shown in the lens only when wholly inside the crop)
  if (!inside(G.clock.box)) hideNames.add('lzs-clock');
  for (const n of LC.notes) if (!inside(n.box) || (n.lead && !inside({x: Math.min(n.lead.from.x, n.lead.to.x), y: Math.min(n.lead.from.y, n.lead.to.y), w: Math.abs(n.lead.to.x - n.lead.from.x), h: Math.abs(n.lead.to.y - n.lead.from.y)}))) { hideNames.add(n.name); hideNames.add(`${n.name}-lead`); }
  if (G.nA && !inside(G.nA)) hideNames.add('lzs-name0');
  if (G.nB && !inside(G.nB)) hideNames.add('lzs-name1');
  ['lzs-plateA', 'lzs-plateB'].forEach(n => hideNames.add(n));
  // the lens shows its subject, the strip's stations: people, racks and routes it would cut are left out too
  const figs = [['lzs-A', figureBox(G.A)], ['lzs-B', figureBox(G.B)],
    ['lzs-rackA', {x: G.rackA.x, y: G.rackA.y, w: G.rackA.w, h: G.floorA - G.rackA.y}], ['lzs-rackB', {x: G.rackB.x, y: G.rackB.y, w: G.rackB.w, h: G.floorB - G.rackB.y}]];
  for (const [n, b] of figs) if (!inside(b)) hideNames.add(n);
  hideNames.add('lzs-route-proposal');
  hideNames.add('lzs-route-response');
  void hit;
  const copyNode = buildScene(ctx, LC);
  const hiddenFound = [];
  const markHidden = n => {
    if (Array.isArray(n)) { n.forEach(markHidden); return; }
    if (!n || typeof n !== 'object') return;
    const nm = n.attrs && n.attrs.name;
    if (nm && hideNames.has(nm)) { n.attrs.opacity = 0; n.attrs['data-lens-hidden'] = 1; hiddenFound.push(nm); }
    (n.children || []).forEach(markHidden);
  };
  markHidden(copyNode);
  // strike lines over the old value (lens annotation, in scene coordinates)
  const ev = LS.S.st[fo.i].evs[fo.j];
  const tb = LS.strip.stations[fo.i].evNodes[fo.j].timeBox;
  const strikes = [];
  if (ev.time && tb) {
    const vf = ev.time;
    const y0 = tb.y + F * 0.25;
    vf.lines.forEach((ln, j) => {
      const lw = ctx.measure(ln, vf.size, vf.weight, 'sans');
      strikes.push({x0: tb.cx - lw / 2 - 3, x1: tb.cx + lw / 2 + 3, y: y0 + j * vf.lineHeight + vf.size * 0.52});
    });
  }
  const strikeNodes = g(null, strikes.map((q, j) => h('line', {name: `lens-strike${j}`, x1: r(q.x0), x2: r(q.x0), y1: r(q.y), y2: r(q.y), stroke: th.inkSoft, 'stroke-width': Math.max(3, F * 0.12), 'stroke-linecap': 'round', opacity: 0})));
  const lz = lens(ctx, {name: 'lens', source: src, dest, content: g({name: 'lens-cfade', opacity: 0}, copyNode, strikeNodes), color: th.fg});
  const markOcclude = n => { if (n && n.attrs && n.attrs.name === 'lens-win') n.attrs['data-occludes'] = 1; (n.children || []).forEach(c => typeof c === 'object' && markOcclude(c)); };
  markOcclude(lz.node);
  const P0 = `st-seq-s${fo.i}-e${fo.j}`;
  const datumNodes = ctx.show('all') ? [`${P0}-time-txt`, `${P0}-alt-txt`] : [];
  // Δ on the changed label (right of its chip, clear of the station's text)
  const mR = Math.max(14, F * 0.55);
  const markerNode = tb ? deltaMark(ctx, {name: 'cx-marker', x: tb.x + tb.w + mR + 4, y: tb.y + tb.h / 2, R: mR, opacity: 0}) : null;
  return {hideNames: hiddenFound, cardMode, crop: o.crop, F, FL, LS, LC, G, fo, src, dest, zoom, region, stageBox, split, lz, strikes, markerNode, notes, heads, fieldWhole, datumNodes, P0, tb, lensShortFrac, contextFrac, coverFrac, restFill, why, ok: why.length === 0, upx, px};
}

const SEARCH = new Map();

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const shape = ctx.view.shape;
    const pl = p.detailGeometry.placement;
    const fr = [0.54, 0.46, 0.5, 0.6, 0.66];
    const splits = (pl === 'right' ? ['right'] : pl === 'below' ? ['below'] : shape === 'landscape' ? ['right'] : shape === 'portrait' ? ['below'] : ['below', 'right'])
      .flatMap(dir => fr.map(frac => ({dir, frac})));
    const key = JSON.stringify([p, ctx.view.width, ctx.view.height, ctx.show('all'), ctx.show('key')]);
    let pick = SEARCH.get(key);
    const cache0 = new Map();
    if (!pick) {
      // per crop and split: the largest text that fits (a binary search over the sizes); the best of them wins
      // (larger text first, then the crop with both receipts)
      let best = null, bestBad = null;
      const cache = cache0;
      const memoAll = new Map();
      const nFloor = DEFAULT_PX.filter(q => q.F >= 19.6).length;
      // the people floor first (model 88·k size; the drawn head is 0.978 of it: 51.5 → 50 px at 1:1, 56.5 → 55 px
      // elsewhere), then the stress floor (46.5 → 45 px),
      // then none (reported by the rendered head test) — only when no layout reaches it
      // (a buzz-cut head draws 0.889 of the model instead of 0.978: with such a party the targets rise accordingly)
      const hf = [0, 1].some(i => actorLook(ctx, p.parties[i], i).hair === 'buzz') ? 0.889 : 0.978;
      for (const headNeed of [(shape === 'square' ? 50.4 : 55.3) / hf, 45.3 / hf, 0]) {
        if (best) break;
        const good = c => c && c.ok && c.head >= headNeed;
        for (const [crop, modes, nip] of [['receipts', ['full']], ['focus', ['full']], ['receipts', ['head']], ['focus', ['head']], ['receipts', ['token']], ['focus', ['token']], ['receipts', ['token'], true], ['focus', ['token'], true]]) {
          for (const split of splits) {
            const at = i => {
              const k = `${crop}|${modes[0]}|${nip ? 'n' : ''}|${split.dir}${split.frac}|${i}`;
              if (!memoAll.has(k)) memoAll.set(k, compose(ctx, p, {upx, px: DEFAULT_PX[i], split, crop, cardModes: modes, namesInPanel: nip, dry: true, cache}));
              return memoAll.get(k);
            };
            // (fuller cards only at or above the floor: below it the glyph tokens at the floor come first)
            let lo = 0, hi = modes[0] === 'token' ? DEFAULT_PX.length - 1 : nFloor;
            // (the smallest text first: when the context has no layout even there, no larger text has one — the
            // split is skipped after one attempt)
            if (!at(hi)) continue;
            // (no fitting layout even at the smallest text of the range: no larger text fits either — kept as a fallback)
            if (!good(at(hi))) {
              const c = at(hi);
              if (!bestBad || c.why.length < bestBad.c.why.length || (c.why.length === bestBad.c.why.length && c.head > bestBad.c.head)) bestBad = {i: hi, split, crop, modes, nip, c};
              continue;
            }
            // (with a layout already found at text index best.i, another split only matters if it fits larger text: it is
            // tried from best.i − 1 down, and skipped when that fails)
            if (best) { hi = Math.min(hi, best.i - 1); if (hi < lo || !good(at(hi))) continue; }
            while (lo < hi) { const m = (lo + hi) >> 1; if (good(at(m))) hi = m; else lo = m + 1; }
            const c = at(lo);
            if (good(c)) { if (!best || lo < best.i) best = {i: lo, split, crop, modes, nip}; }
            else if (c && (!bestBad || c.why.length < bestBad.c.why.length || (c.why.length === bestBad.c.why.length && c.head > bestBad.c.head))) bestBad = {i: lo, split, crop, modes, nip, c};
            if (best && best.i === 0) break;
          }
          // (the first mode and crop that reach the floor are kept: fuller cards and the wider record first)
          if (best && DEFAULT_PX[best.i].F >= 19.6) break;
        }
      }
      const b0 = best || bestBad || {i: DEFAULT_PX.length - 1, split: splits[0], crop: 'focus', modes: ['token'], force: true};
      pick = {px: DEFAULT_PX[b0.i], split: b0.split, crop: b0.crop, modes: b0.modes, nip: b0.nip, force: !best};
      SEARCH.set(key, pick);
    }
    // (nothing fits: the smallest text with token cards, flagged — never throws)
    return compose(ctx, p, {upx, px: pick.px, split: pick.split, crop: pick.crop, cardModes: pick.modes, namesInPanel: pick.nip, dry: false, cache: cache0, force: pick.force});
  },
  build(ctx, L) {
    // the panel's tray: the lens's part of the frame at rest and at the hold (it leaves with the panel)
    const R0 = L.region;
    const tray = h('path', {name: 'ptray', d: roundRectPath(R0.x, R0.y, R0.w, R0.h, 18), fill: ctx.theme.card, 'fill-opacity': 0.35, stroke: ctx.theme.inkFaint, 'stroke-width': 2});
    return g({'data-stack': L.split.dir}, tray, buildScene(ctx, L.LS), L.markerNode, L.lz.node, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    // the context is the story's end state (static): the same pose in the scene and in the lens copy
    const posed = poseScene(ctx, L.LS, 1, {hold: {u: 1, done: true}});
    const copy = poseScene(ctx, L.LC, 1, {hold: {u: 1, done: true}});
    const nodes = {...posed.nodes, ...copy.nodes};
    // (the copy's parts left out of the lens stay out: the copy's pose never shows them again)
    for (const n of L.hideNames) nodes[n] = {opacity: 0};
    // ---- the substitution in the scene (and, identically, in the copy): the label chip turns away with the old value
    // and comes back with the new one (its text only while the chip is fully open)
    const tOut = s('turnOut'), tIn = s('turnIn');
    const tb = L.tb;
    for (const P of ['st-', 'lzs-']) {
      const n0 = `${P}seq-s${L.fo.i}-e${L.fo.j}`;
      if (!tb) continue;
      const altBox = L.LS.strip.stations[L.fo.i].evNodes[L.fo.j].altBox;
      nodes[`${n0}-time`] = {opacity: tOut < 1 ? 1 : 0, transform: T(tb.cx, tb.cy, 0, r(Math.max(0.001, 1 - ease.inCubic(tOut)), 4), 1)};
      nodes[`${n0}-time-txt`] = {opacity: tOut > 0 ? 0 : 1};
      if (altBox) {
        nodes[`${n0}-alt`] = {opacity: tOut >= 1 ? 1 : 0, transform: T(altBox.cx, altBox.cy, 0, r(Math.max(0.001, ease.outCubic(tIn)), 4), 1)};
        nodes[`${n0}-alt-txt`] = {opacity: tIn >= 1 ? 1 : 0};
      }
    }
    // ---- the lens: grows at its own place from 70 % to full; its copy fades in once ≥ 1× (within ~150 ms)
    const open = L.zoom < 1 ? 0 : ease.outCubic(s('open')) * (1 - ease.inCubic(s('close')));
    Object.assign(nodes, L.lz.frame(open, 0));
    const S0 = L.src, D0 = L.dest;
    const q = 0.7 + 0.3 * open;
    const Rw = {x: D0.x + D0.w * (1 - q) / 2, y: D0.y + D0.h * (1 - q) / 2, w: D0.w * q, h: D0.h * q};
    const kx = Rw.w / S0.w, ky = Rw.h / S0.h;
    const rect = {x: r(Rw.x), y: r(Rw.y), width: r(Rw.w), height: r(Rw.h)};
    nodes['lens-cliprect'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(Rw.x + 8), y: r(Rw.y + 12), width: rect.width, height: rect.height};
    nodes['lens-content'] = {transform: `${T(Rw.x - S0.x * kx, Rw.y - S0.y * ky)} scale(${r(kx, 4)} ${r(ky, 4)})`};
    const cone = (a, b) => ({x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: open > 0.05 ? 1 : 0});
    const right = L.split.dir === 'right';
    nodes['lens-coneA'] = right ? cone({x: S0.x + S0.w, y: S0.y}, {x: Rw.x, y: Rw.y}) : cone({x: S0.x, y: S0.y + S0.h}, {x: Rw.x, y: Rw.y});
    nodes['lens-coneB'] = right ? cone({x: S0.x + S0.w, y: S0.y + S0.h}, {x: Rw.x, y: Rw.y + Rw.h}) : cone({x: S0.x + S0.w, y: S0.y + S0.h}, {x: Rw.x + Rw.w, y: Rw.y});
    nodes['lens-win'] = {opacity: open > 0.001 ? 1 : 0};
    // hand-over (sequenced both ways): the context copy of the datum is hidden by 5 % open; the lens copy starts at
    // 5 % open, so the two are never both legible; on close the reverse
    nodes['lens-cfade'] = {opacity: r(Math.min(clamp((L.zoom * q - 1.02) / 0.12), clamp((open - 0.05) / 0.08)), 3)};
    const ctxDatum = 1 - clamp(open / 0.05);
    for (const n of L.datumNodes) nodes[n] = {opacity: r(Math.min(nodes[n] && nodes[n].opacity !== undefined ? nodes[n].opacity : 1, ctxDatum), 3)};
    // strike over the old value (lens annotation); it leaves as the label turns
    const strike = s('strike');
    L.strikes.forEach((qq, j) => { nodes[`lens-strike${j}`] = {x2: r(lerp(qq.x0, qq.x1, strike)), opacity: strike > 0 && tOut <= 0 ? 1 : 0}; });
    if (L.markerNode) nodes['cx-marker'] = {opacity: r(s('marker'), 3)};
    const panel = 1 - s('panelOut') + s('panelIn');
    L.notes.forEach(n => { nodes[n.name] = {opacity: r(n.hold ? s('notes') : panel, 3)}; });
    nodes.ptray = {opacity: r(panel, 3)};
    const datum = tOut <= 0 ? 'before' : tIn >= 1 ? 'after' : 'changing';
    const lensBox = open > 0.001 ? Rw : null;
    const p = ctx.params;
    return {
      nodes,
      semantic: {
        lensOpen: r(open, 3),
        datum,
        contextValue: datum === 'after' ? p.afterValue : p.beforeValue,
        lensValue: open > 0.001 ? (datum === 'after' ? p.afterValue : datum === 'before' ? p.beforeValue : null) : null,
        zoom: r(L.zoom, 3),
        strike: r(strike, 3),
        order: posed.sem.order,
        lensCopyAt: {x: r(L.tb ? L.tb.cx : 0), y: r(L.tb ? L.tb.cy : 0)}, contextAt: {x: r(L.tb ? L.tb.cx : 0), y: r(L.tb ? L.tb.cy : 0)},
        source: {x: r(S0.x), y: r(S0.y), w: r(S0.w), h: r(S0.h)},
        lensBox: lensBox ? {x: r(Rw.x), y: r(Rw.y), w: r(Rw.w), h: r(Rw.h)} : null,
        lensClearOfHeads: !lensBox || !L.heads.some(b => overlaps(lensBox, b, 0)),
        lensClearOfContext: !lensBox || !overlaps(lensBox, L.stageBox, -2),
        lensShortFrac: r(L.lensShortFrac, 3),
        contextFrac: r(L.contextFrac, 3),
        coverFrac: r(L.coverFrac, 3),
        restFill: r(L.restFill, 3),
        changedFieldWhole: L.fieldWhole,
        markerVisible: s('marker') >= 1,
        cardP: posed.sem.cardP, cardR: posed.sem.cardR, whereP: posed.sem.whereP, whereR: posed.sem.whereR, clockAngle: posed.sem.clockAngle,
        allReached: posed.sem.allReached,
        lensDrawn: L.zoom >= 1.5 - 1e-9,
        layoutOk: L.ok && L.zoom >= 1.5 - 1e-9,
        why: L.why.join(','),
        textPx: r(L.F * L.upx, 2),
        headPx: r(88 * L.G.k * L.upx, 1),
        focusTarget: p.focusTarget,
        focusNode: `seq-s${L.fo.i}-e${L.fo.j}`,
        cardMode: L.cardMode,
        stack: L.split.dir,
        crop: L.crop,
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
    slug: 'contract-formation-04-inspect',
    title: 'Proposal and a supplied milestone — inspecting the milestone\'s label and substituting it',
    titleEs: 'Vencimiento de propuesta — Inspección y cambio de un dato',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Vencimiento de propuesta',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The story\'s end state: the proposal (●) in Party B\'s rack beside the clock, the response (◆) in Party A\'s rack, the clock\'s hand at its final place and the strip "Sequence as supplied (illustrative)". A lens enlarges the strip\'s record — the response\'s stations and the milestone\'s (a real copy of the scene, ≥ 1.5×); the inspected event\'s fictional time label (by default the milestone\'s) is struck, then turns over in the scene and returns with the supplied alternative label. The stations keep the supplied order and the clock\'s hand keeps its place. The lens closes onto the identical stations; a Δ marks the changed label and the struck old value stays readable. Nothing is concluded.',
    tags: ['proposal', 'response', 'milestone', 'clock', 'lens', 'substitution', 'changed marker', 'sequence', 'time label'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/hito-propuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/frameworks/lens.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
