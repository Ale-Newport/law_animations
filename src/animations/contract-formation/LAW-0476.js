/**
 * LAW-0476 — Formalidades de celebración · inspect
 *
 * Storyboard (context = the state produced by the story's action: Party A's document (●) in Party B's rack and Party
 * B's document (◆) in Party A's rack, both connected with their steps as supplied in the scenario (flap open, a
 * connector to a node at each step row), and the strip "Sequence as supplied (illustrative)" with the connection's
 * station last):
 *  0.00–0.20  context at rest in its part of the frame; the other part holds a panel (context caption, the ●/◆
 *             legend at equal weight, the key).
 *  0.20–0.28  isolate: the panel leaves and a lens grows at its own place: a real enlarged copy (≥ 1.6×) of the
 *             connection's station (with the receipt above it) — the record that tells "formality provided" from
 *             "formality pending"; the context's copy of the inspected label is hidden while the lens shows it.
 *  0.36–0.42  the old label (the supplied before value) is struck in the lens.
 *  0.47–0.53  the datum changes IN THE SCENE: the station's label turns over and comes back with the supplied after
 *             value; only its dependent state follows — the dashed pending ring inside the indicated document (a
 *             neutral pending state only, never a deficiency). Nothing else moves.
 *  0.74–0.80  return: the lens closes onto the identical station; a Δ marks the changed label; the panel comes back
 *             with the marker label, the struck "was:" value and the key "As supplied · no conclusion drawn".
 *             Seeking back restores the old datum exactly.
 * Labels hidden (key / none): no label is printed, so the lens enlarges the indicated document itself (connected, its
 * step rows as neutral print lines with their connector; a glyph token where the frame only fits tokens) and the change
 * is seen inside it — the dashed pending outline, just inside the document's border, comes or goes at the turn; no
 * free-standing legend glyphs fill the lens's part at rest or at the hold.
 * The racks stand clear of the people (the kit's figGap) and the pending outline runs inside the document's border: it
 * never touches a person.
 * No formality rule (no writing, notarial or registration requirement, no signature or witness requirement, no form
 * for validity), no consequence of a formality being provided or pending; no jurisdiction. Adapted from LAW-0472
 * (copied).
 * @module animations/contract-formation/LAW-0476
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
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, EVENTS, DEFAULT_PX, layoutScene, buildScene, poseScene,
  fitG as fitW, chipG as chipW, overlaps, insideBox, unionBox, glyph, headBox, figureBox,
  localizeScene, stationsOf, evName, pendInset, measureCards, messageCard,
} from './kits/formalidades-celebracion.js';
import {changedMarker} from '../../primitives/markers.js';
import {shade} from '../../primitives/paper.js';

const ID = 'LAW-0476';
const DURATION = 8000;
const W = {
  open: [0.2, 0.28], strike: [0.36, 0.42], turnOut: [0.47, 0.5], turnIn: [0.5, 0.53],
  close: [0.74, 0.8], marker: [0.8, 0.84], notes: [0.81, 0.85],
  // the panel fills the lens's part of the frame at rest and at the hold; it leaves as the lens starts and returns as
  // it ends (never ~200 ms with neither readable)
  panelOut: [0.18, 0.2], panelIn: [0.8, 0.84],
};

const STRINGS = {
  en: {...KIT_STRINGS.en, partiesT: 'Left: {a} · right: {b}', was: 'was', legP: 'Document A', legW: 'Document B', kept: 'The stations keep the supplied order'},
  es: {...KIT_STRINGS.es, partiesT: 'Izquierda: {a} · derecha: {b}', was: 'antes', legP: 'Documento A', legW: 'Documento B', kept: 'Las estaciones conservan el orden aportado'},
};

const sceneSchema = {
  ...motifFields,
  focusTarget: oneOf('Which station of the supplied sequence has its label inspected and substituted (by default the connection\'s station, whose label is the supplied status of the formality; for the other stations, a fictional time label)', EVENTS),
  beforeValue: str('Label the inspected station shows before the substitution (as supplied; fictional)', 40),
  afterValue: str('Alternative label supplied for the same station (as supplied; fictional)', 40),
  statusBefore: oneOf('Supplied status before the substitution: formality-provided, or formality-pending (a dashed pending ring inside the indicated document — a neutral pending state only)', ['formality-provided', 'formality-pending']),
  statusAfter: oneOf('Supplied status after the substitution — the pending ring follows it; nothing else changes and nothing is concluded', ['formality-provided', 'formality-pending']),
  pendingParty: oneOf('Whose document carries the pending ring', ['A', 'B']),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens (≥ 1.5)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'right', 'below'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 70)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  focusTarget: 'connected',
  beforeValue: 'Formality provided (as supplied)',
  afterValue: 'Formality pending (as supplied)',
  statusBefore: 'formality-provided',
  statusAfter: 'formality-pending',
  pendingParty: 'B',
  detailGeometry: {zoom: 1.8, placement: 'auto'},
  contextLabels: {context: 'Both documents received and connected as supplied', marker: 'Changed: the supplied status of the formality'},
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  beforeValue: 'Formalidad aportada',
  afterValue: 'Formalidad pendiente (dato del supuesto)',
  contextLabels: {context: 'Ambos documentos recibidos y conectados (según lo aportado)', marker: 'Cambio: el estado aportado de la formalidad'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

/** The context's sequence: the inspected event shows the supplied before value. */
function contextSequence(p) {
  return p.sequence.map(e => (e.event === p.focusTarget ? {...e, time: p.beforeValue} : e));
}

/** Δ marker: the library's shared "changed datum" marker. */
function deltaMark(ctx, {name, x, y, R, opacity}) {
  return changedMarker(ctx, {name, x, y, radius: R, opacity});
}

/** Station and event index of the focus event (-1 when absent). */
function focusOf(L, ev) {
  for (let i = 0; i < L.stations.length; i++) {
    const j = L.stations[i].events.findIndex(e => e.event === ev);
    if (j >= 0) return {i, j};
  }
  return null;
}

/** The lens's least magnification in the layout: 1.62 (the checklist's 1.5 against the context at rest, with a margin
 * for the host's rendering — fonts and strokes at small element or viewport sizes). */
const ZMIN = 1.62;

/** One attempt: the context in one part of the frame, the lens (and the panel) in the other. */
function compose(ctx, p, o) {
  const th = ctx.theme;
  const DW = ctx.design.w, DH = ctx.design.h;
  const {upx, split} = o;
  // (o.cardS, the large-card pass: the body size — which sets only the cards' size and the strip's glyph chips, the
  // cards printing no text — scaled up, the cards keeping their proportions; the label size is unchanged)
  const px = o.cardS ? {...o.px, F: o.px.F * o.cardS} : o.px;
  const F = px.F / upx, FL = px.L / upx;
  const why = [];
  const right = split.dir === 'right';
  const stageBox = right ? {x: 6, y: 4, w: DW * split.frac - 12, h: DH - 8} : {x: 6, y: 4, w: DW - 12, h: DH * split.frac - 8};
  const region = right ? {x: DW * split.frac + 4, y: 6, w: DW * (1 - split.frac) - 10, h: DH - 12} : {x: 8, y: DH * split.frac + 2, w: DW - 16, h: DH * (1 - split.frac) - 8};
  // (a part too small for a lens whose short side is ≥ 35 % of the frame's short side: no layout here)
  if (Math.min(region.w, region.h) - 8 < 0.35 * 1080 / upx && !o.force) return null;
  const aspect = stageBox.w / stageBox.h;
  const shape = aspect > 1.3 ? 'landscape' : aspect < 0.7 ? 'portrait' : 'square';
  const captions0 = [0, 1].map(i => (p.parties[i].role ? `${p.parties[i].name} · ${p.parties[i].role}` : p.parties[i].name));
  // (o.namesInPanel: the parties are named in the panel, not under the figures — the figures get the room)
  const captions = o.namesInPanel ? [null, null] : captions0;
  const seq = contextSequence(p);
  const common = {box: stageBox, shape, upx, headTarget: 0, sequence: seq, finalState: null, annotations: [], showFinal: false, captions,
    plates: null, ev: [0.24, 0.68], pxSets: [px], keyNote: false, alt: {[p.focusTarget]: p.afterValue}, pending: p.statusBefore === 'formality-pending', pendingParty: p.pendingParty === 'A' ? 'proposal' : 'response', kMin: 0.5, figGap: 26, ringInset: true, fillerFit: true, chipW: o.arrAlt === 'm' ? 7.5 : undefined, chipWFor: o.arrAlt === 'f' ? {event: p.focusTarget, w: 8} : undefined, colFs: o.arrAlt === 'n' ? [7.5] : o.arrAlt === 'm' ? [11] : o.arrAlt === 'c1' ? [7.5, 8.5, 9.5, 11] : [11, 13, 9.5, 8.5], cardModes: o.cardModes ?? ['full'], innerFs: o.cardModes && o.cardModes[0] === 'head' ? [13, 11, 9.5, 8.5] : o.cardModes && o.cardModes[0] === 'token' ? [3] : undefined,
    arrs: o.arrAlt === 'n' ? [{arr: 'row', strip: 'below', cols: 3}, {arr: 'stack', strip: 'below', cols: 3}, {arr: 'row', strip: 'below', cols: 2}] : o.arrAlt === 'c1' ? [{arr: 'row', strip: 'below', cols: 1}, {arr: 'stack', strip: 'below', cols: 1}] : shape === 'portrait' ? [{arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 2}, {arr: 'row', strip: 'below', cols: 2}] : shape === 'square' ? [{arr: 'row', strip: 'below', cols: 2}, {arr: 'row', strip: 'below', cols: 4}, {arr: 'stack', strip: 'mid', cols: 1}] : [{arr: 'row', strip: 'below', cols: 4}, {arr: 'row', strip: 'floor', cols: 4}, {arr: 'row', strip: 'below', cols: 2}, {arr: 'row', strip: 'mid', cols: 2}]};
  // (the context's layout does not depend on the crop: shared between the crops of one search)
  const ckey = JSON.stringify([px.F, split, o.cardModes, Boolean(o.namesInPanel), o.arrAlt || '']);
  const LS = o.cache && o.cache.has(ckey) ? o.cache.get(ckey) : layoutScene(ctx, p, {...common, prefix: 'st-'});
  if (o.cache) o.cache.set(ckey, LS);
  if (!LS || (LS.why.includes('nofit') && !o.force)) return null;
  why.push(...LS.why);
  let fo = focusOf(LS, p.focusTarget);
  if (!fo) { if (!o.force) return null; why.push('focus'); fo = {i: LS.stations.length - 1, j: 0}; }
  // ---- crop: the strip's receipt stations (the focus event's station among them)
  // (a single station: its printed content — glyph, verb and label chips — not its full column, so that a narrow
  // record makes a tall enough lens; the station's faint frame is left out of the copy)
  const contentOf = i => {
    const st = LS.strip.stations[i], sv = LS.S.st[i];
    // (labels hidden: a station prints only its glyphs — its frame, the blank label chip, is its content, so that the
    // lens shows the whole station rather than a glyph in an empty window)
    if (!ctx.show('all')) return st.box;
    return unionBox(st.evNodes.map((e, j) => {
      const ev = sv.evs[j];
      const vr = ev.verb ? e.box.x + LS.S.R * 2.4 + LS.F * 0.35 + ev.verb.width : e.box.x + LS.S.R * 2.4;
      const right = Math.max(vr, ...[e.timeBox, e.altBox].filter(Boolean).map(b => b.x + b.w));
      return {x: e.box.x - LS.F * 0.3, y: e.box.y - LS.F * 0.3, w: right - e.box.x + LS.F * 0.6, h: e.box.h + LS.F * 0.3};
    }));
  };
  // (crop 'receipts': the unfolding's station with the station right above it in its column — the receipt it follows — so
  // that the record is tall enough for the lens; 'focus': the inspected station alone)
  const ctxI = LS.stations.findIndex(s0 => s0.events.some(e => e.verb === 'connected'));
  const aboveOf = i => {
    const b = contentOf(i);
    let best = -1;
    LS.strip.stations.forEach((_, j) => { const c = contentOf(j); if (j !== i && Math.abs(c.x - b.x) < 2 && c.y < b.y && (best < 0 || c.y > contentOf(best).y)) best = j; });
    // (only the station right above — not one across an empty stretch of the strip, which would leave the lens blank
    // between them)
    if (best >= 0) { const c = contentOf(best); if (b.y - (c.y + c.h) > LS.F * 1.5) return -1; }
    return best;
  };
  // (each card where it rests in the context: its receiving slot when its receipt is supplied, else its own slot; a
  // card absent from the supplied sequence has none at all)
  const G = LS.G;
  const act = stationsOf(p.sequence).active;
  const restAt = m => (p.sequence.some(e => e.event === evName(m, 'received')) ? G.cardAt[m].b : G.cardAt[m].a);
  const cardB = m => { const q = act.includes(m) ? restAt(m) : null; return q ? {x: q.x - G.cw / 2, y: q.y - G.ch / 2, w: G.cw, h: G.ch} : null; };
  const ppm = p.pendingParty === 'A' ? 'proposal' : 'response';
  // labels hidden (key / none): the changed status is not printed, so the lens shows what changes visibly — the
  // indicated card, connected with its attribute rows, where the dashed pending outline comes or goes
  const cardCrop = !ctx.show('all') && Boolean(cardB(ppm));
  const recv = cardCrop ? [] : o.crop === 'focus' ? [fo.i] : [...new Set([ctxI >= 0 ? ctxI : fo.i, fo.i, ...(ctxI >= 0 && aboveOf(ctxI) >= 0 ? [aboveOf(ctxI)] : [])])];
  const single = recv.length === 1;
  // (the stations' printed content — a label chip may reach past its column — so that every recorded text, the
  // changed one first, lies wholly inside the crop)
  // (a card crop takes in the card's shadow and, labels hidden, its neutral print lines — on a short card they may
  // reach under its lower edge)
  const cardCropBox = () => {
    const cb = cardB(ppm), M = LS.M, Fm = M.F, c = ppm === 'proposal' ? M.prop : M.wd;
    const fillBottom = !c.head && M.mode !== 'token' ? cb.y + M.pad + Fm * 1.6 + Fm * 0.9 * 3 + Fm * 0.34 : 0;
    return {x: cb.x, y: cb.y, w: cb.w + 4, h: Math.max(cb.h + 6, fillBottom - cb.y)};
  };
  const crop0 = cardCrop ? cardCropBox() : unionBox(recv.map(i => contentOf(i)));
  // (the people and their captions: the crop's outline never crosses them — each person's zone reaches to the edge of
  // the rack in front of them, where the arms rest)
  const zoneOf = (fig, R) => { const fb = figureBox(fig); return R.x >= fb.x ? {x: fb.x, y: fb.y, w: Math.max(fb.w, R.x - fb.x), h: fb.h} : {x: R.x + R.w, y: fb.y, w: Math.max(0, fb.x + fb.w - R.x - R.w), h: fb.h}; };
  const keepOut = [zoneOf(G.A, G.rackA), zoneOf(G.B, G.rackB), G.nA, G.nB].filter(Boolean);
  const crossesKeep = q => keepOut.filter(b => overlaps(b, q, 0) && !insideBox(b, q, 0)).length;
  // (a card crop: the card with its shadow, clear of the people beside the rack)
  const pad = cardCrop ? Math.min(F * 0.6, 10) : F * 0.35;
  // (a card crop: its side margins stop 3 short of the people's zones, so that its outline never reaches a person)
  const sideRoom = side => Math.min(pad, ...keepOut.filter(b => b.y < crop0.y + crop0.h && b.y + b.h > crop0.y)
    .map(b => (side < 0 ? crop0.x - (b.x + b.w) : b.x - (crop0.x + crop0.w))).filter(d => d >= 0).map(d => Math.max(0, d - 3)));
  const padL = cardCrop ? sideRoom(-1) : pad, padR = cardCrop ? sideRoom(1) : pad;
  let src = {x: crop0.x - padL, y: crop0.y - pad, w: crop0.w + padL + padR, h: crop0.h + 2 * pad};
  const need = 0.36 * 1080 / upx + 2;
  // (a card crop may magnify further: a small glyph card then fills the lens rather than floating in it)
  const zFit = q => Math.min((region.w - 8) / q.w, (region.h - 8) / q.h, 6);
  let zoom = Math.max(ZMIN, Math.min(zFit(src), Math.max(p.detailGeometry.zoom, 2)));
  // (a short record: first a larger magnification, as far as the lens's part allows — the crop grows only beyond it,
  // so that its outline does not reach out to the people round the strip)
  if (Math.min(src.w, src.h) * zoom < need) zoom = Math.max(zoom, Math.min(zFit(src), need / Math.min(src.w, src.h)));
  // (the parts a crop's outline must not cut through: every station and the strip's title)
  // (the outline must not cut a station's printed content; the stations' faint frames may be cut — the copy leaves
  // out a frame its rim would cut)
  const cutters = cardCrop ? [] : [...LS.strip.stations.map((st, i) => contentOf(i)), LS.strip.titleBox].filter(Boolean);
  const cuts = q => cutters.filter(b => overlaps(b, q, -1) && !(b.x >= q.x - 0.5 && b.y >= q.y - 0.5 && b.x + b.w <= q.x + q.w + 0.5 && b.y + b.h <= q.y + q.h + 0.5)).length + crossesKeep(q) * 10;
  // (still short: first whole neighbours of the record — the stations above and below it in its column, the strip's
  // title — are taken in, one at a time, nearest first, while the lens keeps its least magnification)
  if (!cardCrop) {
    const mates = [...LS.strip.stations.map((st, i) => (recv.includes(i) ? null : contentOf(i))), LS.strip.titleBox].filter(b => b && b.x < src.x + src.w && b.x + b.w > src.x)
      .sort((a0, b0) => Math.abs(a0.y + a0.h / 2 - (crop0.y + crop0.h / 2)) - Math.abs(b0.y + b0.h / 2 - (crop0.y + crop0.h / 2)));
    for (const b of mates) {
      if (Math.min(src.w, src.h) * zoom >= need) break;
      // (a neighbour across an empty stretch is not taken in: the lens would show the gap)
      if (Math.max(b.y - (src.y + src.h), src.y - (b.y + b.h)) > F * 1.5) break;
      const u = unionBox([src, {x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad}]);
      if (zFit(u) < ZMIN - 1e-9 || u.h > stageBox.h || u.w > stageBox.w) break;
      src = u;
      zoom = Math.max(ZMIN, Math.min(zFit(src), Math.max(zoom, need / Math.min(src.w, src.h))));
    }
  }
  for (let it = 0; it < 4; it++) {
    const shortIsH = src.h <= src.w;
    const cur = Math.min(src.w, src.h) * zoom;
    if (cur >= need) break;
    // grown to the lens's least size: centred, or anchored at either edge — whichever cuts the fewest stations
    // (every placement that keeps the record inside, in steps — the one inside the context's part that cuts the
    // fewest texts wins)
    const anchors = Array.from({length: 21}, (_, k) => k / 20);
    const opts = shortIsH
      ? anchors.map(a => { const h2 = need / zoom; return {...src, y: src.y - (h2 - src.h) * a, h: h2}; })
      : anchors.map(a => { const w2 = need / zoom; return {...src, x: src.x - (w2 - src.w) * a, w: w2}; });
    // (inside the context's part first, then the fewest cut stations)
    const sc = q => cuts(q) + (insideBox(q, stageBox, -2) ? 0 : 100);
    src = opts.reduce((a, b) => (sc(b) < sc(a) || (sc(b) === sc(a) && Math.abs(b.y + b.h / 2 - (crop0.y + crop0.h / 2)) + Math.abs(b.x + b.w / 2 - (crop0.x + crop0.w / 2)) < Math.abs(a.y + a.h / 2 - (crop0.y + crop0.h / 2)) + Math.abs(a.x + a.w / 2 - (crop0.x + crop0.w / 2))) ? b : a));
    zoom = Math.max(ZMIN, Math.min(zFit(src), zoom));
  }
  // a station the outline would still cut is taken in whole
  for (let it = 0; it < 3 && cuts(src); it++) {
    const cut = cutters.filter(b => overlaps(b, src, -1));
    const u = unionBox([src, ...cut]);
    const s2 = {x: u.x - F * 0.2, y: u.y - F * 0.2, w: u.w + F * 0.4, h: u.h + F * 0.4};
    // (only while the lens keeps its least magnification and the crop stays in the context's part: otherwise the
    // outline crosses that station, and the copy leaves the station out — the rim never cuts a text)
    if (zFit(s2) < ZMIN - 1e-9 || !insideBox(s2, stageBox, -2)) break;
    src = s2;
  }
  // (the crop's outline stays inside the context's part of the frame: slid in when it overhangs by its padding)
  if (src.w <= stageBox.w && src.h <= stageBox.h) src = {...src, x: clamp(src.x, stageBox.x, stageBox.x + stageBox.w - src.w), y: clamp(src.y, stageBox.y, stageBox.y + stageBox.h - src.h)};
  // (a text the outline still cuts beside the record — the strip's title over it, a neighbour's chip — is left out:
  // the outline stops just short of it, never short of the record itself)
  const textBoxes = [...LS.strip.stations.map((st, i) => contentOf(i)), LS.strip.titleBox, G.nA, G.nB, ...['proposal', 'response'].map(m => cardB(m))].filter(Boolean);
  // (a clearance round each text — its rendered ink may reach a little past its measured box)
  const gapT = 3 + F * 0.15;
  for (const b0 of textBoxes) {
    const b = {x: b0.x - gapT, y: b0.y - gapT, w: b0.w + 2 * gapT, h: b0.h + 2 * gapT};
    if (!(overlaps(b, src, -1) && !insideBox(b0, src, -0.5))) continue;
    if (b0.y + b0.h <= crop0.y + 0.5) { const y1 = Math.min(b.y + b.h, crop0.y - 1); src = {...src, h: src.h - (y1 - src.y), y: y1}; }
    else if (b0.y >= crop0.y + crop0.h - 0.5) src = {...src, h: Math.max(crop0.y + crop0.h + 1, b.y) - src.y};
    else if (b0.x + b0.w <= crop0.x + 0.5) { const x1 = Math.min(b.x + b.w, crop0.x - 1); src = {...src, w: src.w - (x1 - src.x), x: x1}; }
    else if (b0.x >= crop0.x + crop0.w - 0.5) src = {...src, w: Math.max(crop0.x + crop0.w + 1, b.x) - src.x};
  }
  zoom = Math.max(ZMIN, Math.min(zFit(src), zoom));
  // (still short of the lens's least size: a larger magnification, as far as the lens's part allows)
  if (Math.min(src.w, src.h) * zoom < need) zoom = Math.max(zoom, Math.min(zFit(src), need / Math.min(src.w, src.h)));
  // (a card crop: the card as large as the lens's part allows)
  if (cardCrop) zoom = Math.max(zoom, zFit(src) * 0.92);
  const zMax = zFit(src);
  if (zoom > zMax + 1e-6) { why.push('lens'); zoom = Math.max(0.5, zMax); }
  if (!insideBox(src, stageBox, -2)) why.push('srcOut');
  if (crossesKeep(src)) why.push('srcPerson');
  // (the record fills the lens: its printed content covers ≥ 40 % of the crop — never a line or two in a blank window)
  if (!cardCrop) { const inC = [...LS.strip.stations.map((st, i) => contentOf(i)), LS.strip.titleBox].filter(b => b && insideBox(b, src, -0.5)); const fillC = Math.min(1, inC.reduce((a0, b) => a0 + b.w * b.h, 0) / (src.w * src.h)); if (fillC < 0.4) why.push('lensSparse'); }
  // (the crop's outline crosses no text of the context: every station's printed content, the strip's title, the names
  // and the cards are either wholly inside it or wholly outside)
  if (textBoxes.some(b => overlaps(b, src, -1) && !insideBox(b, src, -0.5))) why.push('srcText');
  const dw = src.w * zoom, dh = src.h * zoom;
  const dest = right
    ? {x: region.x + (region.w - dw) / 2, y: clamp(src.y + src.h / 2 - dh / 2, region.y, region.y + region.h - dh), w: dw, h: dh}
    : {x: clamp(src.x + src.w / 2 - dw / 2, region.x, region.x + region.w - dw), y: region.y + Math.max(0, Math.min(40, (region.h - dh) / 2)), w: dw, h: dh};
  const lensShortFrac = Math.min(dw, dh) * upx / 1080;
  // (the checklist's 0.35 with a margin)
  if (lensShortFrac < 0.36 - 1e-6) why.push('lensSmall');
  const heads = [headBox(G.A), headBox(G.B)];
  if (overlaps(dest, stageBox, -2)) why.push('lensOverContext');
  // the focus station and its time chip wholly inside the crop
  const fBox = cardCrop ? crop0 : single && recv[0] === fo.i ? contentOf(fo.i) : LS.strip.stations[fo.i].evNodes[fo.j].box;
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
  // (the context left visible beside the lens: ≥ 0.455 of the frame with labels — the checklist's 0.45 with a margin —
  // and ≥ 0.465 with labels hidden, where the drawn context is narrower than its solved extent (no names). Lens beside
  // the context (right): measured across the frame's width. Lens stacked below the context: either dimension may meet
  // it, coordinator decision 2026-09-27, LAW-0232.)
  const ctxW = ext.w * f.scale / ctx.view.width, ctxH = ext.h * f.scale / ctx.view.height;
  // (the acting scene itself — the people and their racks, without the strip — and its share of the frame)
  const stage = unionBox([figureBox(G.A), figureBox(G.B), {x: G.rackA.x, y: G.rackA.y, w: G.rackA.w, h: G.floorA - G.rackA.y}, {x: G.rackB.x, y: G.rackB.y, w: G.rackB.w, h: G.floorB - G.rackB.y}]);
  const stageW = stage.w * f.scale / ctx.view.width, stageH = stage.h * f.scale / ctx.view.height;
  const ctxVis = right ? ctxW : Math.max(ctxW, ctxH);
  // (labels shown, wide frames: the people and racks keep ≥ 0.55 of the frame's width beside the text column — never
  // thumbnails beside the panel)
  if (ctx.show('all') && right && ctx.view.shape === 'landscape' && stageW < 0.55) why.push('stageShare');
  // (labels hidden — no text column —: the scene, people, racks and strip, takes ≥ 0.55 of the frame's area)
  const sceneArea = ext.w * ext.h * f.scale * f.scale / (ctx.view.width * ctx.view.height);
  if (!ctx.show('all') && sceneArea < 0.55) why.push('sceneShare');
  // (tall frames: the scene keeps ≥ 0.2 of the height above the strip and the lens)
  if (ctx.show('all') && !right && ctx.view.shape === 'portrait' && stageH < 0.2) why.push('stageShare');
  if (ctxVis < (ctx.show('key') ? 0.455 : 0.465)) why.push('contextVisible');
  // ---- the panel in the lens's part: context caption, legend, the order note and the key at rest; at the hold the
  // marker label and the struck old value join them
  const items = [];
  if (ctx.show('all')) items.push({kind: 'context', text: p.contextLabels.context, weight: 700});
  if (ctx.show('all')) items.push({kind: 'mlabel', text: p.contextLabels.marker, hold: true, mark: true});
  if (ctx.show('all')) items.push({kind: 'was', text: `${ctx.t.was}: ${p.beforeValue}`, hold: true});
  const cm = LS.cardMode ?? 'full';
  // (the cards that travel in the supplied sequence: one with no event has no legend line and no card text)
  const hasR = act.includes('response');
  // (the ●/◆ legend is not repeated when the card chips below carry the same glyphs; the generic order note makes
  // room for the parties when they are named here)
  if (ctx.show('all') && cm === 'full') items.push({kind: 'leg0', text: ctx.t.legP, glyph: 'proposal'}, ...(hasR ? [{kind: 'leg1', text: ctx.t.legW, glyph: 'response'}] : []));
  // (labels hidden: no free-standing ●/◆ — a legend without its text explains nothing; the key alone, when shown)
  if (ctx.show('all') && !o.namesInPanel) items.push({kind: 'kept', text: ctx.t.kept});
  if (o.namesInPanel && ctx.show('key')) items.push({kind: 'parties', text: ctx.t.partiesT.replace('{a}', captions0[0]).replace('{b}', captions0[1])});
  // (compact cards in the context: their printed texts are given here, at rest and at the hold)
  if (ctx.show('all') && cm !== 'full') items.push({kind: 'cardP', text: `${ctx.t.proposal} · ${p.offer.reference}: ${[p.offer.title, ...p.terms.map(q => `${q.label}: ${q.value}`)].join(' · ')}`, glyph: 'proposal'});
  if (ctx.show('all') && hasR && cm !== 'full') items.push({kind: 'cardW', text: `${ctx.t.response} · ${p.responses[0].reference}: ${[p.responses[0].text, ...p.termsB.map(q => `${q.label}: ${q.value}`)].join(' · ')}`, glyph: 'response'});
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
  // (tokens only — labels key / none —: spread over the part's height)
  const gap = probe.length > 1 ? clamp((region.h * 0.94 - sumH) / (probe.length - 1), 10, ctx.show('all') ? (right ? 60 : 90) : 1e6) : 0;
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
  LC.strip.stations.forEach((st, i) => {
    if (!inside(contentOf(i))) hideNames.add(`lzs-seq-s${i}`);
    else if (!inside(st.box)) hideNames.add(`lzs-seq-ph${i}`);
  });
  if (LC.strip.titleBox && !inside(LC.strip.titleBox)) hideNames.add('lzs-seq-title');
  // (each card where it rests in the context: its receiving slot when its receipt is supplied, else its own slot)
  // (a card absent from the supplied sequence has none at all)
  if (!inside(cardB('proposal'))) hideNames.add('lzs-card-p');
  if (!inside(cardB('response'))) hideNames.add('lzs-card-r');
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
  if (!inside(cardB(p.pendingParty === 'A' ? 'proposal' : 'response'))) hideNames.add('lzs-pend');
  void hit;
  const copyNode = buildScene(ctx, LC);
  // the dependent state after the substitution (the supplied after status): only the dashed pending ring round the
  // indicated card follows it, in the scene and in the copy
  const changeStatus = p.statusAfter !== p.statusBefore;
  const ringIn = Boolean(cardB(ppm) && inside(cardB(ppm)));
  const afterArt = P => {
    if (!changeStatus || p.statusAfter !== 'formality-pending') return null;
    // (the same dashed outline as the kit's pending marker: just inside the card's border)
    const rb = restAt(ppm);
    return g({name: `${P}after`, opacity: 0},
      h('path', {name: `${P}after-ring`, d: pendInset(G.cw, G.ch), transform: T(rb.x, rb.y), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '10 8'}));
  };
  const afterCtx = afterArt('cx-');
  const afterCopy = ringIn ? afterArt('lzs-') : null;
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
  const lz = lens(ctx, {name: 'lens', source: src, dest, content: g({name: 'lens-cfade', opacity: 0}, copyNode, afterCopy, strikeNodes), color: th.fg});
  const markOcclude = n => { if (n && n.attrs && n.attrs.name === 'lens-win') n.attrs['data-occludes'] = 1; (n.children || []).forEach(c => typeof c === 'object' && markOcclude(c)); };
  markOcclude(lz.node);
  const P0 = `st-seq-s${fo.i}-e${fo.j}`;
  const datumNodes = ctx.show('all') ? [`${P0}-time-txt`, `${P0}-alt-txt`] : [];
  // Δ on the changed label (right of its chip, clear of the station's text)
  const mR = Math.max(14, F * 0.55);
  // (placed clear of the label in either value — the supplied after value may be longer than the before value — and of
  // every other station's text: right of the label, else left of it, else above or below its station)
  const evN = LS.strip.stations[fo.i].evNodes[fo.j];
  const lab = tb ? unionBox([tb, evN.altBox].filter(Boolean)) : null;
  let markerAt = null;
  if (lab) {
    const sBox = LS.strip.stations[fo.i].box;
    const avoid = [lab, ...LS.strip.stations.flatMap((st, i) => (i === fo.i ? st.evNodes.flatMap(e => [e.timeBox, e.altBox]).filter(Boolean) : [st.box])), LS.strip.titleBox].filter(Boolean);
    const cands = [{x: lab.x + lab.w + mR + 5, y: lab.y + lab.h / 2}, {x: lab.x - mR - 5, y: lab.y + lab.h / 2},
      {x: sBox.x + sBox.w - mR, y: sBox.y - mR - 4}, {x: sBox.x + sBox.w - mR, y: sBox.y + sBox.h + mR + 4}];
    const mb = q => ({x: q.x - mR - 2, y: q.y - mR - 2, w: 2 * mR + 4, h: 2 * mR + 4});
    markerAt = cands.find(q => !avoid.some(b => overlaps(mb(q), b, 0)) && insideBox(mb(q), stageBox, 0)) || null;
    if (!markerAt) { why.push('marker'); markerAt = cands[0]; }
  }
  const markerNode = markerAt ? deltaMark(ctx, {name: 'cx-marker', x: markerAt.x, y: markerAt.y, R: mR, opacity: 0}) : null;
  // the lens's guide lines (from the crop's corners to the lens's, as the lens grows from 70 % to full): a guide that
  // would cross a text of the context is not drawn (the crop's outline and the lens still join them)
  // (nor would cross a person: each person's whole zone, arms and hair included)
  const ctxTexts = [...LS.strip.stations.map((st, i) => contentOf(i)), LS.strip.titleBox, G.nA, G.nB,
    ...['proposal', 'response'].map(m => cardB(m)), ...keepOut].filter(Boolean);
  const coneEnds = q => {
    const Rw = {x: dest.x + dest.w * (1 - q) / 2, y: dest.y + dest.h * (1 - q) / 2, w: dest.w * q, h: dest.h * q};
    return split.dir === 'right'
      ? [[{x: src.x + src.w, y: src.y}, {x: Rw.x, y: Rw.y}], [{x: src.x + src.w, y: src.y + src.h}, {x: Rw.x, y: Rw.y + Rw.h}]]
      : [[{x: src.x, y: src.y + src.h}, {x: Rw.x, y: Rw.y}], [{x: src.x + src.w, y: src.y + src.h}, {x: Rw.x + Rw.w, y: Rw.y}]];
  };
  const crosses = (a0, b0) => ctxTexts.some(tb => { for (let i = 1; i < 60; i++) { const t = i / 60, x = a0.x + (b0.x - a0.x) * t, y = a0.y + (b0.y - a0.y) * t; if (x > tb.x - 3 && x < tb.x + tb.w + 3 && y > tb.y - 3 && y < tb.y + tb.h + 3 && !(x >= src.x && x <= src.x + src.w && y >= src.y && y <= src.y + src.h)) return true; } return false; });
  const coneOk = [0, 1].map(k => [0.7, 0.8, 0.9, 1].every(q => { const [a0, b0] = coneEnds(q)[k]; return !crosses(a0, b0); }));
  return {sceneArea, stageW, stageH, cardCrop, coneOk, afterCtx, changeStatus, ringIn, hideNames: hiddenFound, cardMode, crop: o.crop, F, FL, LS, LC, G, fo, src, dest, zoom, region, stageBox, split, lz, strikes, markerNode, notes, heads, fieldWhole, datumNodes, P0, tb, lensShortFrac, contextFrac, coverFrac, restFill, why, ok: why.length === 0, upx, px};
}

/**
 * Labels hidden (key / none) — no text column: the context is laid out over the whole frame (full cards, each person
 * wearing the ●/◆ badge of their card), and it fills the frame at rest and at the hold. For the lens it eases into its
 * part of the frame (a uniform scale, 0.12–0.19, back 0.81–0.88), and the lens beside it shows the indicated card
 * itself, drawn at lens scale — connected, its attribute rows as neutral row bars, the glyph at card size — on which the
 * dashed pending outline comes or goes at the turn. The key and the names (key) are shown at rest and at the hold.
 */
const HW = {shrink: [0.12, 0.19], grow: [0.81, 0.88], textOut: [0.1, 0.12], textIn: [0.88, 0.9]};
// (labels hidden: only the label size is read — the names and the key —; the cards print no text, so smaller body
// sizes, smaller cards and larger people, are tried at a readable label size first)
// (the body size sets the cards' size: the smallest, so that the lens card is ≥ 1.6× the card at rest; the label size
// — names and key — the largest that fits)
// (the large-card pass, labels hidden, in place: the card's inner width in body sizes, largest first, and the most the
// lens may enlarge it — the checklist's 1.5×, aimed at 1.62–2.2×, not more: the context keeps its size)
// ([body-size scale, inner width in body sizes]: the cards scaled up whole — their proportions kept — first, then
// widened at the plain body size)
const BIG_CARDS = [[1.6, 11], [1.8, 9.5], [1.4, 13], [1.6, 9.5], [1.8, 8.5], [1.25, 13], [1.4, 11], [2, 8.5], [1, 18], [1.25, 11], [1, 15.5], [1, 13]];
const BIGCAP = 2.2;
const PXH = [{F: 16.1, L: 25}, {F: 16.1, L: 22}, {F: 18, L: 25}, {F: 20, L: 25}, {F: 22, L: 25}, {F: 16.1, L: 21}, {F: 16.1, L: 20}, {F: 16.1, L: 19.6}, {F: 18, L: 19.6}, {F: 22, L: 22}, {F: 26, L: 25}, {F: 16.1, L: 18}, {F: 16.1, L: 16.1}];

/** The arrangements tried for the whole-frame context (labels hidden). */
function arrsHidden(shape) {
  return shape === 'portrait' ? [{arr: 'stack', strip: 'below', cols: 2}, {arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 1}, {arr: 'row', strip: 'below', cols: 2}]
    : shape === 'square' ? [{arr: 'row', strip: 'below', cols: 4}, {arr: 'row', strip: 'below', cols: 2}, {arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 2}]
      : [{arr: 'row', strip: 'below', cols: 5}, {arr: 'row', strip: 'below', cols: 4}, {arr: 'row', strip: 'floor', cols: 4}];
}

function composeHidden(ctx, p, o) {
  const th = ctx.theme;
  const DW = ctx.design.w, DH = ctx.design.h;
  const {upx, split} = o;
  // (o.cardS, the large-card pass: the body size — which sets only the cards' size and the strip's glyph chips, the
  // cards printing no text — scaled up, the cards keeping their proportions; the label size is unchanged)
  const px = o.cardS ? {...o.px, F: o.px.F * o.cardS} : o.px;
  const F = px.F / upx, FL = px.L / upx;
  const why = [];
  // (split 'inplace': the context keeps its whole-frame size and the lens opens in the free space between the racks)
  const inplace = split.dir === 'inplace';
  let right = split.dir === 'right';
  const fullBox = {x: 6, y: 4, w: DW - 12, h: DH - 8};
  const stageBox = inplace ? fullBox : right ? {x: 6, y: 4, w: DW * split.frac - 12, h: DH - 8} : {x: 6, y: 4, w: DW - 12, h: DH * split.frac - 8};
  let region = inplace ? null : right ? {x: DW * split.frac + 4, y: 6, w: DW * (1 - split.frac) - 10, h: DH - 12} : {x: 8, y: DH * split.frac + 2, w: DW - 16, h: DH * (1 - split.frac) - 8};
  const need = 0.36 * 1080 / upx + 2;
  if (!inplace && Math.min(region.w, region.h) - 8 < need && !o.force) return null;
  const aspect = fullBox.w / fullBox.h;
  const shape = aspect > 1.3 ? 'landscape' : aspect < 0.7 ? 'portrait' : 'square';
  const captions = [0, 1].map(i => (p.parties[i].role ? `${p.parties[i].name} · ${p.parties[i].role}` : p.parties[i].name));
  const ckey = JSON.stringify(['H', px.F, px.L, o.cardModes, o.arrIdx ?? -1, o.wide ? 1 : 0, o.innerF ?? 0]);
  const arrsAll = arrsHidden(shape);
  const LS = o.cache && o.cache.has(ckey) ? o.cache.get(ckey) : layoutScene(ctx, p, {box: fullBox, shape, upx, headTarget: 0, sequence: contextSequence(p), finalState: null, annotations: [], showFinal: false, captions,
    plates: null, ev: [0.24, 0.68], pxSets: [px], keyNote: ctx.show('key'), pending: p.statusBefore === 'formality-pending', pendingParty: p.pendingParty === 'A' ? 'proposal' : 'response',
    kMin: 0.5, figGap: 26, ringInset: true, fillerFit: true, personBadges: true, cardModes: o.cardModes, prefix: 'st-', innerFs: o.innerF ? [o.innerF] : o.wide ? undefined : [7, 8.5, 9.5, 11, 13],
    arrs: o.arrIdx !== undefined ? [arrsAll[o.arrIdx]] : arrsAll});
  if (o.cache) o.cache.set(ckey, LS);
  if (!LS || (LS.why.includes('nofit') && !o.force)) return null;
  why.push(...LS.why);
  const G = LS.G;
  const fo = focusOf(LS, p.focusTarget) || {i: LS.stations.length - 1, j: 0};
  const act = stationsOf(p.sequence).active;
  const restAt = m => (p.sequence.some(e => e.event === evName(m, 'received')) ? G.cardAt[m].b : G.cardAt[m].a);
  const ppm = p.pendingParty === 'A' ? 'proposal' : 'response';
  const f = fitDesign(ctx.view, DW, DH);
  // ---- the context at rest and at the hold: its share of the frame
  const ext = unionBox([G.extent, LS.strip.box, ...(LS.notes || []).map(n => n.box)]);
  // (as drawn: the people, the racks to their floors, the strip, the names and the key, and the paths' lines)
  const pathPts = act.flatMap(m => Array.from({length: 33}, (_, i) => { const q = G.routes[m].byLen(i / 32); return {x: q.x, y: q.y, w: 0.1, h: 0.1}; }));
  const drawn = unionBox([figureBox(G.A), figureBox(G.B), {x: G.rackA.x, y: G.rackA.y, w: G.rackA.w, h: G.floorA - G.rackA.y}, {x: G.rackB.x, y: G.rackB.y, w: G.rackB.w, h: G.floorB - G.rackB.y}, LS.strip.box, G.nA, G.nB, ...(LS.notes || []).map(n => n.box), ...pathPts].filter(Boolean));
  // (the share: of the frame's area — of its height on tall frames, where the scene stands in a column)
  const tall = ctx.view.height / ctx.view.width > 1.3;
  const sceneArea = tall ? drawn.h * f.scale / ctx.view.height : drawn.w * drawn.h * f.scale * f.scale / (ctx.view.width * ctx.view.height);
  if (sceneArea < 0.56) why.push('sceneShare');
  // ---- the context during the lens: the same drawing scaled into its part (uniform), against the lens's side (the key,
  // shown only at rest and at the hold, is left out of the fit)
  const extL = unionBox([G.extent, LS.strip.box]);
  const sc = inplace ? 1 : Math.min(1, stageBox.w / extL.w, stageBox.h / extL.h);
  const tx = inplace ? 0 : right ? stageBox.x - extL.x * sc : stageBox.x + (stageBox.w - extL.w * sc) / 2 - extL.x * sc;
  // (beside the lens: the context against the top, the lens against the bottom — together they span the frame's height)
  const ty = inplace ? 0 : stageBox.y - extL.y * sc;
  const Mx = q => ({x: tx + q.x * sc, y: ty + q.y * sc, w: q.w * sc, h: q.h * sc});
  // (the people's zones — to the edge of the rack in front of them — and their captions, in the frame during the lens)
  const zoneOf = (fig, R) => { const fb = figureBox(fig); return R.x >= fb.x ? {x: fb.x, y: fb.y, w: Math.max(fb.w, R.x - fb.x), h: fb.h} : {x: R.x + R.w, y: fb.y, w: Math.max(0, fb.x + fb.w - R.x - R.w), h: fb.h}; };
  const keepOut = [zoneOf(G.A, G.rackA), zoneOf(G.B, G.rackB), G.nA, G.nB].filter(Boolean);
  if (inplace) {
    // the free space between the two racks (people and racks side by side) — or, people and racks stacked on the
    // left, the space right of the racks — under the key and over the strip
    const obst = [figureBox(G.A), figureBox(G.B), {x: G.rackA.x, y: G.rackA.y, w: G.rackA.w, h: G.floorA - G.rackA.y}, {x: G.rackB.x, y: G.rackB.y, w: G.rackB.w, h: G.floorB - G.rackB.y}, G.nA, G.nB, ...(LS.notes || []).map(n => n.box)].filter(Boolean);
    const cx = G.arr === 'row' ? fullBox.x + fullBox.w / 2 : fullBox.x + fullBox.w;
    const x0 = Math.max(fullBox.x, ...obst.filter(b => b.x + b.w < cx).map(b => b.x + b.w));
    const x1 = Math.min(fullBox.x + fullBox.w, ...obst.filter(b => b.x > cx).map(b => b.x));
    obst.push(LS.strip.box);
    const mid = obst.filter(b => b.x < x1 && b.x + b.w > x0);
    const cy = fullBox.y + fullBox.h / 2;
    const y0 = Math.max(fullBox.y, ...mid.filter(b => b.y + b.h / 2 < cy).map(b => b.y + b.h));
    const y1 = Math.min(fullBox.y + fullBox.h, ...mid.filter(b => b.y + b.h / 2 >= cy).map(b => b.y));
    const m = F * 0.8;
    region = {x: x0 + m, y: y0 + m, w: x1 - x0 - 2 * m, h: y1 - y0 - 2 * m};
    if (region.w < need || region.h < need) return null;
  }
  // ---- crop: the indicated card (its shadow included), its sides stopping short of the people
  const q0 = restAt(ppm);
  const cb = {x: q0.x - G.cw / 2, y: q0.y - G.ch / 2, w: G.cw + 4, h: G.ch + 6};
  const padV = Math.min(F * 0.6, 10);
  const sideRoom = side => Math.min(padV, ...keepOut.filter(b => b.y < cb.y + cb.h && b.y + b.h > cb.y)
    .map(b => (side < 0 ? cb.x - (b.x + b.w) : b.x - (cb.x + cb.w))).filter(d => d >= 0).map(d => Math.max(0, d - 3)));
  let srcF = {x: cb.x - sideRoom(-1), y: cb.y - padV, w: cb.w + sideRoom(-1) + sideRoom(1), h: cb.h + 2 * padV};
  // ---- the lens: the card enlarged as far as the lens's part allows (a margin round it), ≥ 1.6× the card at rest in
  // both dimensions, the window at least the least size; the crop takes the window's shape by growing up and down the
  // card's rack column (never sideways, towards the people)
  const magS = Math.min((region.w - 16) / (G.cw * 1.08), (region.h - 16) / (G.ch * 1.14), 3.2);
  if (magS < 1.62) why.push('magRest');
  // (o.magCap: the large-card pass — the cards at rest as large as the lens's least enlargement allows, never shrunk
  // to buy a larger one: AUTHORING item 18)
  if (o.magCap && magS > o.magCap) why.push('magHigh');
  let dw = G.cw * magS * 1.08, dh = Math.max(need, G.ch * magS * 1.14);
  if (dw < need) { dw = need; }
  if (dh > region.h - 8 || dw > region.w - 8) why.push('lensSmall');
  if (Math.min(dw, dh) < need - 1e-6) why.push('lensSmall');
  if (dh / dw > srcF.h / srcF.w) { const h2 = srcF.w * dh / dw; srcF = {...srcF, y: srcF.y - (h2 - srcF.h) / 2, h: h2}; }
  else { const w2 = srcF.h * dw / dh; srcF = {...srcF, x: srcF.x - (w2 - srcF.w) / 2, w: w2}; }
  if (keepOut.some(b => overlaps(b, srcF, 0) && !insideBox(b, srcF, 0))) why.push('srcPerson');
  const src = Mx(srcF);
  const zoom = dw / src.w;
  if (zoom < ZMIN - 1e-9) why.push('lens');
  const dest = inplace
    ? {x: region.x + (region.w - dw) / 2, y: region.y + (region.h - dh) / 2, w: dw, h: dh}
    : right
      ? {x: region.x + (region.w - dw) / 2, y: region.y + region.h - dh, w: dw, h: dh}
      : {x: region.x + (region.w - dw) / 2, y: region.y + (region.h - dh) / 2, w: dw, h: dh};
  // (in place: the guides join the crop's side facing the lens to the lens's near side)
  const coneDir = inplace ? (src.x + src.w / 2 < dest.x ? 'right' : 'left') : split.dir;
  if (inplace) right = coneDir === 'right';
  const lensShortFrac = Math.min(dw, dh) * upx / 1080;
  if (lensShortFrac < 0.36 - 1e-6) why.push('lensSmall');
  if (!inplace && overlaps(dest, stageBox, -2)) why.push('lensOverContext');
  const extD = Mx(extL);
  const ctxW = extD.w * f.scale / ctx.view.width, ctxH = extD.h * f.scale / ctx.view.height;
  // (in place, the whole context stays in view round the lens, which covers only the faint paths between the racks)
  const ctxVis = inplace ? 1 : right ? ctxW : Math.max(ctxW, ctxH);
  if (ctxVis < 0.455) why.push('contextVisible');
  const head = 88 * G.k * upx * sc;
  if (o.dry) return {ok: why.length === 0, why, zoom, head, magS};
  // ---- the lens card: the indicated card drawn at lens scale, connected, with its rows as neutral bars
  // (the same card as in the context — its proportions, its rows — at magS times its size)
  const M0 = LS.M;
  const Mc = measureCards(ctx, p, {F: M0.F * magS, inner: (M0.w - 2 * M0.pad - (M0.railW || 0)) * magS, maxLines: 3, mode: M0.mode, fillerFit: true, glue: true});
  const fc = M0.F * magS;
  const card = messageCard(ctx, {name: 'lzc-card', kind: ppm, M: Mc, w: G.cw * magS, h: G.ch * magS, glyphScale: 0.8});
  const ringOf = n => h('path', {name: n, d: pendInset(G.cw * magS, G.ch * magS), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '10 8', opacity: 0});
  const dc = {x: dest.x + dest.w / 2, y: dest.y + dest.h / 2};
  // (round the card, the slot of the rack it rests in — the lens shows the card face, enlarged)
  const face = shade(th.woodTop, 0.35);
  const slotBg = h('path', {d: roundRectPath(dc.x - G.cw * magS / 2 - fc * 0.45, dc.y - G.ch * magS / 2 - fc * 0.45, G.cw * magS + fc * 0.9, G.ch * magS + fc * 0.9, 12), fill: shade(face, -0.1), stroke: shade(th.woodDark, 0.2), 'stroke-width': 2});
  const lensCard = g({name: 'lzc', opacity: 0}, slotBg, g({name: 'lzc-at', transform: T(dc.x, dc.y)}, card.node, ringOf('lzc-pend'), ringOf('lzc-after')));
  const lz = lens(ctx, {name: 'lens', source: src, dest, content: g({name: 'lens-cfade', opacity: 0}), color: th.fg});
  const markOcclude = n => { if (n && n.attrs && n.attrs.name === 'lens-win') n.attrs['data-occludes'] = 1; (n.children || []).forEach(c => typeof c === 'object' && markOcclude(c)); };
  markOcclude(lz.node);
  // the dependent state in the context: the pending outline on the indicated card follows the supplied after status
  const changeStatus = p.statusAfter !== p.statusBefore;
  const afterCtx = changeStatus && p.statusAfter === 'formality-pending'
    ? g({name: 'cx-after', opacity: 0}, h('path', {name: 'cx-after-ring', d: pendInset(G.cw, G.ch), transform: T(q0.x, q0.y), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '10 8'}))
    : null;
  // the guides (crop corners → lens corners) — dropped where they would cross a person or a caption
  const zonesD = keepOut.map(Mx);
  const coneEnds = q => {
    const Rw = {x: dest.x + dest.w * (1 - q) / 2, y: dest.y + dest.h * (1 - q) / 2, w: dest.w * q, h: dest.h * q};
    return coneDir === 'left'
      ? [[{x: src.x, y: src.y}, {x: Rw.x + Rw.w, y: Rw.y}], [{x: src.x, y: src.y + src.h}, {x: Rw.x + Rw.w, y: Rw.y + Rw.h}]]
      : right
        ? [[{x: src.x + src.w, y: src.y}, {x: Rw.x, y: Rw.y}], [{x: src.x + src.w, y: src.y + src.h}, {x: Rw.x, y: Rw.y + Rw.h}]]
        : [[{x: src.x, y: src.y + src.h}, {x: Rw.x, y: Rw.y}], [{x: src.x + src.w, y: src.y + src.h}, {x: Rw.x + Rw.w, y: Rw.y}]];
  };
  const crosses = (a0, b0) => zonesD.some(tb => { for (let i = 1; i < 60; i++) { const t = i / 60, x = a0.x + (b0.x - a0.x) * t, y = a0.y + (b0.y - a0.y) * t; if (x > tb.x - 3 && x < tb.x + tb.w + 3 && y > tb.y - 3 && y < tb.y + tb.h + 3) return true; } return false; });
  const coneOk = [0, 1].map(k => [0.7, 0.8, 0.9, 1].every(q => { const [a0, b0] = coneEnds(q)[k]; return !crosses(a0, b0); }));
  const heads = [headBox(G.A), headBox(G.B)].map(Mx);
  const contextFrac = ctxVis;
  const coverFrac = right ? (extD.w + dw) * f.scale / ctx.view.content.w : (extD.h + dh) * f.scale / ctx.view.content.h;
  return {hidden: true, inplace, coneDir, magS, ctxM: {tx, ty, s: sc}, lensCard, lzcNodes: card.link ? card.link.nodes : 0, sceneArea, stageW: 0, stageH: 0, cardCrop: true, coneOk, afterCtx, changeStatus, ringIn: true, hideNames: [], cardMode: LS.cardMode, crop: 'card', F, FL, LS, LC: null, G, fo, src, dest, zoom, region, stageBox, split, lz, strikes: [], markerNode: null, notes: [], heads, fieldWhole: true, datumNodes: [], P0: '', tb: null, lensShortFrac, contextFrac, coverFrac, restFill: sceneArea, why, ok: why.length === 0, upx, px};
}

const SEARCH = new Map();

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const shape = ctx.view.shape;
    const pl = p.detailGeometry.placement;
    if (!ctx.show('all')) {
      // labels hidden: the whole-frame context, full cards; the first split, card mode and text size (largest first —
      // the key and the names) that keep the people floor during the lens
      const keyH = JSON.stringify(['H', p, ctx.view.width, ctx.view.height, ctx.show('key')]);
      let pickH = SEARCH.get(keyH);
      const cacheH = new Map();
      if (!pickH) {
        const dirs = pl === 'right' ? ['right'] : pl === 'below' ? ['below'] : shape === 'landscape' ? ['right'] : shape === 'portrait' ? ['below'] : ['below', 'right'];
        const fracs = [0.62, 0.6, 0.58, 0.575, 0.57, 0.565, 0.56, 0.55, 0.54, 0.5, 0.46, 0.44, 0.42];
        const splitsH = [{dir: 'inplace', frac: 1}, ...dirs.flatMap(dir => fracs.map(frac => ({dir, frac})))];
        const DWH = ctx.design.w - 12, DHH = ctx.design.h - 8;
        const aspH = DWH / DHH > 1.3 ? 'landscape' : DWH / DHH < 0.7 ? 'portrait' : 'square';
        const hfH = Math.min(...[0, 1].map(i => ({buzz: 0.889, short: 0.94})[actorLook(ctx, p.parties[i], i).hair] ?? 0.978));
        let bestBad = null;
        outer: for (const headNeed of [(shape === 'square' ? 50.4 : 55.3) / hfH, 45.3 / hfH, 0]) {
          for (let i = 0; i < PXH.length; i++) {
            for (const modes of [['full'], ['head']]) {
              // (first, in place: the largest cards at rest — and so the largest racks — whose lens still enlarges
              // them ≥ 1.62× and ≤ BIGCAP×; the context is not shrunk to buy magnification)
              // (an arrangement with no free space for the lens even with the compact cards — the plain pass's own
              // first try, cached — is skipped: larger cards only narrow that space)
              const arrsIn = [undefined, ...arrsHidden(aspH).map((a, k) => (a.arr === 'stack' ? k : -1)).filter(k => k >= 0)]
                .filter(arrIdx => composeHidden(ctx, p, {upx, px: PXH[i], split: splitsH[0], cardModes: modes, wide: false, arrIdx, dry: true, cache: cacheH}));
              for (const [cardS, innerF] of arrsIn.length ? BIG_CARDS : []) {
                for (const arrIdx of arrsIn) {
                  const c = composeHidden(ctx, p, {upx, px: PXH[i], split: splitsH[0], cardModes: modes, cardS, innerF, magCap: BIGCAP, arrIdx, dry: true, cache: cacheH});
                  if (c && c.ok && c.head >= headNeed) { pickH = {i, split: splitsH[0], modes, cardS, innerF, magCap: BIGCAP, arrIdx}; break outer; }
                }
              }
              // (each arrangement on its own: the largest people of one may leave the frame emptier than another's)
              // (compact cards first — a smaller card at rest, a larger enlargement —, then the wider ones)
              for (const wide of [false, true]) {
                // (in place first — with the layout's own arrangement, then the stacked ones, whose free side holds the
                // lens —; then the splits)
                const tries = [...[undefined, ...arrsHidden(aspH).map((a, k) => (a.arr === 'stack' ? k : -1)).filter(k => k >= 0)].map(arrIdx => ({split: splitsH[0], arrIdx})), ...splitsH.slice(1).map(split => ({split, arrIdx: undefined}))];
                for (const {split, arrIdx} of tries) {
                  const c = composeHidden(ctx, p, {upx, px: PXH[i], split, cardModes: modes, wide, arrIdx, dry: true, cache: cacheH});
                  if (!c) continue;
                  if (c.ok && c.head >= headNeed) { pickH = {i, split, modes, wide, arrIdx}; break outer; }
                  if (!bestBad || c.why.length < bestBad.c.why.length) bestBad = {i, split, modes, wide, arrIdx, c};
                }
              }
            }
          }
        }
        if (!pickH) pickH = bestBad ? {i: bestBad.i, split: bestBad.split, modes: bestBad.modes, wide: bestBad.wide, arrIdx: bestBad.arrIdx, force: true} : {i: PXH.length - 1, split: splitsH[0], modes: ['full'], force: true};
        SEARCH.set(keyH, pickH);
      }
      return composeHidden(ctx, p, {upx, px: PXH[pickH.i], split: pickH.split, cardModes: pickH.modes, wide: pickH.wide, cardS: pickH.cardS, innerF: pickH.innerF, magCap: pickH.magCap, arrIdx: pickH.arrIdx, dry: false, cache: cacheH, force: pickH.force});
    }
    // (labels hidden: no text size to maximise — the wider context parts are tried first, so the people and the
    // racks get the room)
    // (0.56 and 0.58: a context part wide enough for the visible-context share beside a lens that still keeps its
    // least size)
    const fr = ctx.show('key') ? [0.54, 0.46, 0.5, 0.55, 0.56, 0.58, 0.6, 0.66] : [0.66, 0.6, 0.58, 0.57, 0.56, 0.55, 0.54, 0.5, 0.46];
    // (wide frames: the lens beside the context first; below it — a wide lens for a wide record — when that fails)
    const splits = (pl === 'right' ? ['right'] : pl === 'below' ? ['below'] : shape === 'landscape' ? ['right', 'below'] : shape === 'portrait' ? ['below'] : ['below', 'right'])
      .flatMap(dir => fr.map(frac => ({dir, frac})));
    // (labels hidden, square frames: the context across the full width above a taller lens part — the lens then holds
    // the indicated card large, with its attribute rows, instead of a glyph token)
    if (!ctx.show('all') && shape === 'square' && pl === 'auto') splits.unshift(...[0.44, 0.42, 0.4].map(frac => ({dir: 'below', frac})));
    const key = JSON.stringify([p, ctx.view.width, ctx.view.height, ctx.show('all'), ctx.show('key')]);
    let pick = SEARCH.get(key);
    const cache0 = new Map();
    if (!pick) {
      // per crop and split: the largest text that fits (a binary search over the sizes); the best of them wins
      // (larger text first, then the crop with both receipts)
      let best = null, bestBad = null;
      const cache = cache0;
      const memoAll = new Map();
      const noLayout = new Set();
      const nFloor = DEFAULT_PX.filter(q => q.F >= 19.6).length;
      // the people floor first (model 88·k size; the drawn head is 0.978 of it: 51.5 → 50 px at 1:1, 56.5 → 55 px
      // elsewhere), then the stress floor (46.5 → 45 px),
      // then none (reported by the rendered head test) — only when no layout reaches it
      // (a buzz-cut head draws 0.889 of the model instead of 0.978: with such a party the targets rise accordingly)
      // (the drawn head is a fraction of the model's 88·k by hair style — buzz 0.889, short 0.94, others 0.978: the targets
    // rise with the smallest fraction among the parties)
    const hf = Math.min(...[0, 1].map(i => ({buzz: 0.889, short: 0.94})[actorLook(ctx, p.parties[i], i).hair] ?? 0.978));
      for (const headNeed of [(shape === 'square' ? 50.4 : 55.3) / hf, 45.3 / hf, 0]) {
        if (best) break;
        const good = c => c && c.ok && c.head >= headNeed;
        // (last, beside a lens: the strip as one column of stations, so that a crop grown to the lens's least size
        // takes in the stations above and below the inspected one instead of cutting the strip's title — tried only
        // when no other arrangement reaches the floor)
        // ('f': the inspected label's chip narrower, its label on up to three lines — a wide, short record would leave the
        // lens mostly blank)
        for (const [crop, modes, nip, arrAlt] of [['receipts', ['full']], ['focus', ['full']], ['receipts', ['head']], ['focus', ['head']], ['focus', ['full'], false, 'f'], ['focus', ['head'], false, 'f'], ['receipts', ['token']], ['focus', ['token']], ['focus', ['token'], false, 'f'], ['focus', ['token'], true, 'f'], ['receipts', ['token'], true], ['focus', ['token'], true],
          ...(splits.some(q => q.dir === 'right') ? [['receipts', ['token'], false, 'm'], ['receipts', ['token'], true, 'm'], ['focus', ['head'], false, 'n'], ['focus', ['token'], false, 'n'], ['focus', ['token'], true, 'n'], ['focus', ['head'], false, 'c1'], ['focus', ['token'], false, 'c1'], ['focus', ['token'], true, 'c1']] : [])]) {
          // (labels hidden: full cards only — never glyph tokens)
          if (!ctx.show('all') && modes[0] === 'token') continue;
          for (const split of splits) {
            const at = i => {
              const k = `${crop}|${modes[0]}|${nip ? 'n' : ''}|${arrAlt || ''}|${split.dir}${split.frac}|${i}`;
              if (!memoAll.has(k)) memoAll.set(k, compose(ctx, p, {upx, px: DEFAULT_PX[i], split, crop, cardModes: modes, namesInPanel: nip, arrAlt, dry: true, cache}));
              return memoAll.get(k);
            };
            // (fuller cards only at or above the floor: below it the glyph tokens at the floor come first)
            let lo = 0, hi = modes[0] === 'token' ? DEFAULT_PX.length - 1 : nFloor;
            // (the smallest text first: when the context has no layout even there, no larger text has one — the
            // split is skipped after one attempt; a narrower inspected chip — 'f' — never fits where the plain strip has
            // no layout)
            const nk = `${modes[0]}|${nip ? 'n' : ''}|${split.dir}${split.frac}`;
            if (arrAlt === 'f' && noLayout.has(nk)) continue;
            if (!at(hi)) { if (!arrAlt) noLayout.add(nk); continue; }
            // (no fitting layout even at the smallest text of the range: no larger text fits either — kept as a fallback)
            if (!good(at(hi))) {
              const c = at(hi);
              if (!bestBad || c.why.length < bestBad.c.why.length || (c.why.length === bestBad.c.why.length && c.head > bestBad.c.head)) bestBad = {i: hi, split, crop, modes, nip, arrAlt, c};
              continue;
            }
            // (with a layout already found at text index best.i, another split only matters if it fits larger text: it is
            // tried from best.i − 1 down, and skipped when that fails)
            if (best) { hi = Math.min(hi, best.i - 1); if (hi < lo || !good(at(hi))) continue; }
            // (labels hidden: no text to enlarge — the first fitting layout at the smallest text size is kept, which leaves
            // the people and the racks the most room)
            if (!ctx.show('key')) lo = hi;
            else while (lo < hi) { const m = (lo + hi) >> 1; if (good(at(m))) hi = m; else lo = m + 1; }
            const c = at(lo);
            if (good(c)) { if (!best || lo < best.i) best = {i: lo, split, crop, modes, nip, arrAlt}; }
            else if (c && (!bestBad || c.why.length < bestBad.c.why.length || (c.why.length === bestBad.c.why.length && c.head > bestBad.c.head))) bestBad = {i: lo, split, crop, modes, nip, arrAlt, c};
            if (best && (best.i === 0 || !ctx.show('key'))) break;
          }
          // (the first mode and crop that reach the floor are kept: fuller cards and the wider record first)
          // (labels hidden: the first mode that fits at all — the fuller card in the lens; with the key shown, its text
          // keeps the reading floor first)
          if (best && (DEFAULT_PX[best.i].F >= 19.6 || !ctx.show('key'))) break;
        }
      }
      const b0 = best || bestBad || {i: DEFAULT_PX.length - 1, split: splits[0], crop: 'focus', modes: ['token'], force: true};
      pick = {px: DEFAULT_PX[b0.i], split: b0.split, crop: b0.crop, modes: b0.modes, nip: b0.nip, arrAlt: b0.arrAlt, force: !best};
      SEARCH.set(key, pick);
    }
    // (nothing fits: the smallest text with token cards, flagged — never throws)
    return compose(ctx, p, {upx, px: pick.px, split: pick.split, crop: pick.crop, cardModes: pick.modes, namesInPanel: pick.nip, arrAlt: pick.arrAlt, dry: false, cache: cache0, force: pick.force});
  },
  build(ctx, L) {
    // the panel's tray: the lens's part of the frame at rest and at the hold (it leaves with the panel); with the labels
    // reduced to the key or hidden the panel holds the ●/◆ tokens (and the key) only, spread over the part's height, and
    // no tray is drawn (never a near-empty bordered box)
    const R0 = L.region;
    // (the tray hugs its notes — all of them, those of the hold included — inside the lens's part: never a large box
    // round a few chips)
    const TB = L.notes.length ? unionBox(L.notes.map(n => n.box)) : null;
    const tp = L.F * 0.9;
    const T0 = TB ? {x: Math.max(R0.x, TB.x - tp), y: Math.max(R0.y, TB.y - tp), w: 0, h: 0} : null;
    if (T0) { T0.w = Math.min(R0.x + R0.w, TB.x + TB.w + tp) - T0.x; T0.h = Math.min(R0.y + R0.h, TB.y + TB.h + tp) - T0.y; }
    const tray = !ctx.show('all') || !T0 ? null : h('path', {name: 'ptray', d: roundRectPath(T0.x, T0.y, T0.w, T0.h, 18), fill: ctx.theme.card, 'fill-opacity': 0.35, stroke: ctx.theme.inkFaint, 'stroke-width': 2});
    if (L.hidden) return g({'data-stack': L.split.dir}, g({name: 'ctxz'}, buildScene(ctx, L.LS), L.afterCtx), L.lz.node, L.lensCard);
    return g({'data-stack': L.split.dir}, tray, buildScene(ctx, L.LS), L.afterCtx, L.markerNode, L.lz.node, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    // the context is the story's end state (static): the same pose in the scene and in the lens copy
    const posed = poseScene(ctx, L.LS, 1, {hold: {u: 1, done: true}});
    const copy = L.LC ? poseScene(ctx, L.LC, 1, {hold: {u: 1, done: true}}) : {nodes: {}};
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
    const right = L.hidden ? L.coneDir === 'right' : L.split.dir === 'right';
    const leftC = L.hidden && L.coneDir === 'left';
    // (a guide that would cross a context text is not drawn)
    const coneOn = k => (L.coneOk[k] ? 1 : 0);
    nodes['lens-coneA'] = leftC ? cone({x: S0.x, y: S0.y}, {x: Rw.x + Rw.w, y: Rw.y}) : right ? cone({x: S0.x + S0.w, y: S0.y}, {x: Rw.x, y: Rw.y}) : cone({x: S0.x, y: S0.y + S0.h}, {x: Rw.x, y: Rw.y});
    nodes['lens-coneB'] = leftC ? cone({x: S0.x, y: S0.y + S0.h}, {x: Rw.x + Rw.w, y: Rw.y + Rw.h}) : right ? cone({x: S0.x + S0.w, y: S0.y + S0.h}, {x: Rw.x, y: Rw.y + Rw.h}) : cone({x: S0.x + S0.w, y: S0.y + S0.h}, {x: Rw.x + Rw.w, y: Rw.y});
    nodes['lens-coneA'].opacity *= coneOn(0);
    nodes['lens-coneB'].opacity *= coneOn(1);
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
    if (ctx.show('all')) nodes.ptray = {opacity: r(panel, 3)};
    const datum = tOut <= 0 ? 'before' : tIn >= 1 ? 'after' : 'changing';
    const p0 = ctx.params;
    // the dependent state: from the moment the new label is in, the pending ring follows the supplied after status
    const afterOn = L.changeStatus && tIn > 0 ? 1 : 0;
    if (L.changeStatus) {
      for (const P of ['st-', 'lzs-']) {
        if (P === 'lzs-' && (!L.ringIn || L.hidden)) continue;
        if (p0.statusAfter === 'formality-pending') nodes[`${P === 'st-' ? 'cx-' : P}after`] = {opacity: afterOn};
        if (p0.statusBefore === 'formality-pending') nodes[`${P}pend`] = {opacity: afterOn ? 0 : 1};
      }
    }
    if (L.hidden) {
      // the context eases into its part for the lens and back for the hold; the key and the names (labels key) are
      // shown at rest and at the hold, never while the context is scaled
      const kz = L.inplace ? 0 : ease.inOutSine(seg(u, ...HW.shrink)) * (1 - ease.inOutSine(seg(u, ...HW.grow)));
      const M = L.ctxM;
      nodes.ctxz = {transform: `translate(${r(M.tx * kz, 2)} ${r(M.ty * kz, 2)}) scale(${r(1 + (M.s - 1) * kz, 4)})`};
      const txt = L.inplace ? 1 : r(1 - seg(u, ...HW.textOut) + seg(u, ...HW.textIn), 3);
      L.LS.names.forEach((nm, i) => { if (nm) nodes[`st-name${i}`] = {opacity: txt}; });
      // (one copy of the changed state at a time: the context card's outline is hidden by 5 % open, before the lens
      // card shows its own — and shown again only once the lens has closed)
      const ctxRing = 1 - clamp(open / 0.05);
      for (const n of ['st-pend', 'cx-after']) if (nodes[n]) nodes[n] = {...nodes[n], opacity: r((nodes[n].opacity ?? 1) * ctxRing, 3)};
      if (L.LS.notes.some(n => n.name === 'st-key')) nodes['st-key'] = {opacity: txt};
      // the lens card: grows with the window, shown with the lens's content; connected (its rows), the outline follows
      // the status — before the turn the before status, from the turn the after status
      const dc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
      nodes.lzc = {opacity: nodes['lens-cfade'].opacity, transform: `translate(${r(dc.x * (1 - q), 2)} ${r(dc.y * (1 - q), 2)}) scale(${r(q, 4)})`};
      nodes['lzc-card-attrs'] = {opacity: 1};
      if (nodes['lzc-card-flap'] === undefined) nodes['lzc-card-flap'] = {opacity: 0};
      // (connected: its connector drawn, one node per step row)
      if (L.lzcNodes) {
        nodes['lzc-card-rail'] = {'stroke-dashoffset': 0};
        for (let i = 0; i < L.lzcNodes; i++) nodes[`lzc-card-node${i}`] = {opacity: 1};
      }
      const st = afterOn ? p0.statusAfter : p0.statusBefore;
      nodes['lzc-pend'] = {opacity: st === 'formality-pending' && !afterOn ? 1 : 0};
      nodes['lzc-after'] = {opacity: st === 'formality-pending' && afterOn ? 1 : 0};
    }
    const act0 = stationsOf(ctx.params.sequence);
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
        lensClearOfContext: !lensBox || (L.inplace ? true : !overlaps(lensBox, L.stageBox, -2)),
        lensShortFrac: r(L.lensShortFrac, 3),
        contextFrac: r(L.contextFrac, 3), stageW: r(L.stageW, 3), stageH: r(L.stageH, 3), sceneArea: r(L.sceneArea, 3), cardCrop: L.cardCrop,
        coverFrac: r(L.coverFrac, 3),
        restFill: r(L.restFill, 3),
        changedFieldWhole: L.fieldWhole,
        markerVisible: s('marker') >= 1,
        cardP: posed.sem.cardP, cardR: posed.sem.cardR, whereP: posed.sem.whereP, whereR: posed.sem.whereR, configuration: act0.configuration, active: act0.active, status: L.changeStatus && tIn > 0 ? p.statusAfter : p.statusBefore,
        allReached: posed.sem.allReached,
        lensDrawn: L.zoom >= 1.5 - 1e-9,
        layoutOk: L.ok && L.zoom >= 1.5 - 1e-9,
        why: L.why.join(','),
        textPx: r(L.F * L.upx, 2), labelPx: r(L.FL * L.upx, 2),
        headPx: r(88 * L.G.k * L.upx, 1),
        focusTarget: p.focusTarget,
        focusNode: `seq-s${L.fo.i}-e${L.fo.j}`,
        cardMode: L.cardMode,
        stack: L.split.dir, magRest: L.magS ? r(L.magS, 3) : null,
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
    slug: 'contract-formation-09-inspect',
    title: 'Formalities of conclusion, without a rule — inspecting the supplied status of the formality and substituting it',
    titleEs: 'Formalidades de celebración — Inspección y cambio de un dato',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Formalidades de celebración',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The story\'s end state: Party A\'s document (●) in Party B\'s rack and Party B\'s document (◆) in Party A\'s rack, both connected with their steps as supplied in the scenario (generic and fictional items), and the strip "Sequence as supplied (illustrative)" with the connection\'s station last. A lens enlarges the connection\'s station (≥ 1.6×); the old label is struck; the station\'s label turns over to the supplied after value and only its dependent state follows — the dashed pending ring inside the indicated document, a neutral pending state only. The lens closes onto the identical station and a Δ marks the changed label; the panel shows the struck "was:" value and the key "As supplied · no conclusion drawn". Seeking back restores the old datum exactly. No formality rule and no legal effect is stated.',
    tags: ['document', 'steps', 'connector', 'formality pending', 'formality provided', 'lens', 'substitution', 'changed marker'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/formalidades-celebracion.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/frameworks/lens.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
