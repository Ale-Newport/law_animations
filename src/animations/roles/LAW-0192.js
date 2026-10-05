/**
 * LAW-0192 — Atención en registro · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] context: the state produced by the intake — the clerk lets go
 *              of the entry-reference slip and the person filing holds it up;
 *              the bundle lies on the ledge; the checklist card shows every
 *              supplied row dotted, and the inspected row also shows its
 *              status value as supplied (e.g. "Received").
 *  [0.20–0.40] isolate: the context dims and a lens grows out of that row —
 *              a real enlarged copy of the card drawn at the card's own
 *              coordinates, cropped to the row (≥ 1.5×). While the window is
 *              translucent it is a blank card, so no text is ever doubled.
 *  [0.40–0.64] substitute (inside the lens only): the old value is struck
 *              through and stays readable in grey; the supplied alternative
 *              is written below it; only the dependent glyph changes (the
 *              filled dot of the before-state becomes the dashed ring of the
 *              after-state, both as supplied). The new value is held still.
 *  [0.66–0.80] return: the lens closes onto its source; overlapping the
 *              close, the same update happens on the card in context and the
 *              clerk's pen (from the solved hand) re-marks the slot; a neutral
 *              Δ is pinned on the changed row with its label beside it.
 *  [0.80–1.00] hold. Seeking back restores the old datum exactly. Nothing is
 *              concluded: no rejection, deadline, penalty or validity.
 * @module animations/roles/LAW-0192
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, int, num, list, obj, oneOf} from '../../schemas/fields.js';
import {connector} from '../../primitives/annotate.js';
import {
  regFields, REG_DEFAULTS, KIT_STRINGS, RG, captionOf, itemColor, runTrack, measureCard, measureSlip, stageGeometry, registryStage,
  checklistCard, keyChip, looksOf, legendPlate, fitWords, wchip, overlaps, badWrap, segHits, freeSpot, gridCands, leaderFrom,
  intakeTargets, intakeReach, leanFor, intakeFrame,
} from './kits/atencion-en-registro.js';

const ID = 'LAW-0192';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.4], substitute: [0.4, 0.64], back: [0.64, 1]};
const W = {
  settle: [0, 0.12], caption: [0.02, 0.1],
  open: [0.2, 0.36],
  lStrike: [0.42, 0.47], lOld: [0.47, 0.5], lNew: [0.49, 0.55], lGlyph: [0.54, 0.6],
  // the new value is held still 0.60 → 0.66 in the lens (≥ 480 ms), then the lens closes before the pen moves
  close: [0.66, 0.71],
  penTo: [0.71, 0.73], cStrike: [0.705, 0.72], cOld: [0.72, 0.735], cNew: [0.708, 0.728], cTap: [0.735, 0.76], penBack: [0.76, 0.8],
  marker: [0.765, 0.795], markLabel: [0.77, 0.8], key: [0.02, 0.1],
};
/** Intake windows used to replay the last moment of the hand-back (the context beat). */
const WI = {
  raise: [0, 0], reachC: [0, 0], hold: [0, 0], take: [0, 0], fDrop: [0, 0], penTo: [0, 0], check: [0, 0.001], penBack: [0, 0],
  lay: [0, 0], toKey: [0, 0], press: [0, 0], rise: [0, 0], toSlip: [0, 0], tear: [0, 0], carry: [0, 0], fReach: [0, 0],
  both: [0.2, 0.3], fRead: [0.3, 0.75], cBack: [0.3, 0.8],
};
const OLD_TRACE = 0.6;
/** Lens window motion: it slides off its source quickly (outCubic) while it grows (inOutSine). */
const lensPos = t => ease.outCubic(clamp(t));
const lensSize = t => ease.inOutSine(clamp(t));
/** Longest bare (blank) window allowed while it still overlaps its source, in ms. */
const MAX_BLANK_MS = 200;
const COPY_FADE = 0.03;
const TARGETS = ['checklist-row'];

const STRINGS = {en: {...KIT_STRINGS.en}, es: {...KIT_STRINGS.es}};

const sceneSchema = {
  ...regFields,
  props: obj('Context content (supplied, fictional)', {
    items: list('Checklist items in order', str('Item name', 60), 2, 4),
    focusIndex: int('0-based index of the checklist row that is inspected', 0, 3),
    reference: str('Entry reference printed on the slip (fictional)', 32),
  }),
  objectLabels: obj('Labels printed on props', {checklist: str('Title printed on the checklist card', 50), slip: str('Header printed on the slip', 40)}),
  focusTarget: oneOf('Detail that is enlarged and substituted: the status of one checklist row', TARGETS),
  beforeValue: str('Status value of the row before the substitution (as supplied)', 90),
  afterValue: str('Status value after the substitution (the alternative datum supplied by the preset)', 90),
  detailGeometry: obj('Lens and dependent geometry', {
    zoom: num('Maximum magnification of the lens', 1.5, 4),
    placement: oneOf('Where the lens sits relative to its source', ['auto', 'left', 'right', 'top', 'bottom']),
    states: obj('Glyph drawn on the row for each value (as supplied): received = filled dot, pending = dashed empty ring', {
      before: oneOf('Glyph state before the substitution', ['received', 'pending']),
      after: oneOf('Glyph state after the substitution', ['received', 'pending']),
    }, ['before', 'after']),
  }),
  contextLabels: obj('Labels of the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  ...REG_DEFAULTS,
  props: {items: ['Filing form', 'Cover letter', 'Annex 1 · site plan'], focusIndex: 2, reference: 'REF-0427 (fictional)'},
  objectLabels: {checklist: 'Intake checklist', slip: 'Entry reference'},
  focusTarget: 'checklist-row',
  beforeValue: 'Received',
  afterValue: 'Pending (as supplied)',
  detailGeometry: {zoom: 2.6, placement: 'auto', states: {before: 'received', after: 'pending'}},
  contextLabels: {context: 'Registry window after the intake', marker: 'Changed datum (as supplied)'},
};

const CFG = {
  // landscape: the context fills the width (the wall runs edge to edge); the lens opens over the dimmed context
  landscape: {size: 22, noSign: true},
  square: {size: 21},
  // portrait: depth framing as in the story — the person filing in the foreground, the window behind
  portrait: {size: 22, depth: {x: 80, fk: 2.0, fy: 420, fk0: 2.0, fy0: 420, hx: 30, sx: 40, rk: 1.45}, clerkK: 1.65},
};

/** Window rect at open progress t between a source and a destination rect (design units). */
function winRect(src, dst, t) {
  const pp = lensPos(t), ps = lensSize(t);
  const w = lerp(src.w, dst.w, ps), hh = lerp(src.h, dst.h, ps);
  const cx = lerp(src.x + src.w / 2, dst.x + dst.w / 2, pp), cy = lerp(src.y + src.h / 2, dst.y + dst.h / 2, pp);
  return {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
}
/** Last open progress at which the window (with its shadow) still overlaps its source. */
function clearAt(src, dst) {
  let last = 0;
  for (let i = 0; i <= 200; i++) {
    const t = i / 200;
    const q = winRect(src, dst, t);
    if (overlaps({x: q.x, y: q.y, w: q.w + 6, h: q.h + 8}, src, 3)) last = t;
  }
  return last;
}

function tryLayout(ctx, S, cardW, slipW, lift = 0) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const problems = [];
  const labels = p.props.items;
  const fi = Math.min(p.props.focusIndex, labels.length - 1);
  const dg = p.detailGeometry;
  const items = labels.map((label, i) => ({label, status: i === fi ? dg.states.before : 'received'}));
  const colors = labels.map((_, i) => itemColor(ctx, i));
  const status = {index: fi, before: p.beforeValue, after: p.afterValue, label: showKey ? p.contextLabels.marker : null};

  // ---- scale from the height or the width; text lives in stage units
  let k = 1, M = null, SM = null, G = null;
  const chipBand = S * 2.6 + 18;
  const geo = () => stageGeometry({cardW, cardH: M.h, slipW, slipH: SM.h, walk: 0, depth: C.depth || null, clerkK: C.clerkK, noSign: Boolean(C.noSign), clerkLift: lift, cardGap: Math.max(RG.cardGap, 85 * (C.clerkK || RG.clerk.k) + 14)});
  // the card grows upward by M.grow when the new value is written: keep room for it
  const topOf = () => Math.min(G.top, RG.cardBase - M.h - M.grow - 30);
  const botOf = () => (G.depth ? G.floorBottom : 0);
  for (let it = 0; it < 4; it++) {
    const su = S / k;
    // the Δ keeps a clear size (≥ 16 px radius at 1080p) whatever the text size
    M = measureCard(ctx, {items, title: p.objectLabels.checklist, su, w: cardW, status: {...status, markR: 16 / k}});
    SM = measureSlip(ctx, {su, header: p.objectLabels.slip, ref: p.props.reference, w: slipW});
    G = geo();
    const kH = (D.h - 16 - chipBand) / (botOf() - topOf());
    const kW = (D.w - 16) / (G.xR - G.xL);
    k = Math.min(kH, kW);
  }
  const su = S / k;
  if (M.truncated || SM.truncated) return {ok: false, problems: [M.truncated ? 'card-text' : 'slip-text']};
  const top = topOf(), bot = botOf();
  const stW = (G.xR - G.xL) * k, stH = (bot - top) * k;
  if (k < 0.45) return {ok: false, problems: ['too-small']};
  // only the inspected row is re-marked by the pen here
  const lean = leanFor(G, M, G.card.x0, [fi], 1);
  if (!lean) return {ok: false, problems: ['slot-reach']};

  // ---- place: centred; in landscape the wall runs from edge to edge so the context fills the width
  const free = D.h - 16 - stH - chipBand;
  const oy = 8 + free * 0.5 - top * k;
  const ox = (D.w - stW) / 2 - G.xL * k;
  const Gs = shape === 'landscape' ? {...G, xL: (8 - ox) / k, xR: (D.w - 8 - ox) / k} : G;
  const looks = looksOf(ctx, p);
  const st = registryStage(ctx, {prefix: 'st', G: Gs, looks, items, card: {M, showText: showAll, marker: true}, slipM: SM, showText: showAll, colors, place: {ox, oy, k}});
  const TR = intakeTargets(st, Gs, SM);
  if (!intakeReach(Gs, TR, lean)) return {ok: false, problems: ['reach']};
  const toD = st.toD;
  const Bx = q => ({x: ox + q.x * k, y: oy + q.y * k, w: q.w * k, h: q.h * k});
  const cardBox = Bx(st.cardBox);
  // the card after its inspected row has grown (the obstacle for labels at the hold)
  const cardBoxG = {...cardBox, y: cardBox.y - M.grow * k - 12, h: cardBox.h + M.grow * k + 12};
  const row = M.rows[fi];
  const cardTop = st.cardTopY;
  const fk = G.fk, ck = G.clerk.k;

  // ---- people (design): heads, bodies, the clerk's reach towards the card — the lens never covers them
  const fh = toD(st.filerHeadAt(G.filerX)), ch = toD(st.clerkHead);
  const fR = 44 * fk * k, cR = st.clerkHeadR * 1.15 * k;
  const faces = [{x: fh.x - fR, y: fh.y - fR, w: fR * 2, h: fR * 2}, {x: ch.x - cR, y: ch.y - cR, w: cR * 2, h: cR * 2}];
  const filerBody = Bx({x: G.filerX - 55 * fk, y: G.fy - 410 * fk, w: 125 * fk, h: 410 * fk});
  const clerkBody = Bx({x: G.clerk.x - 85 * ck, y: st.clerkHead.y - 50 * ck, w: 170 * ck, h: G.ledgeY - st.clerkHead.y + 50 * ck});
  const people = [...faces, filerBody, clerkBody];

  // ---- lens source: the inspected row plus a small margin; it grows with the row when the new value is written
  const m0 = su * 0.2;
  const g1 = su * 0.28;
  const labPart = row.st.lab ? g1 * 1.3 + row.st.lab.height : 0;
  const srcAt = gr => Bx({x: st.cardX0 + 3, y: cardTop + row.y - m0 - M.grow * gr, w: M.w - 6, h: (row.st.yb - row.y) + m0 * 2 + (M.grow - labPart) * gr});
  const src0 = srcAt(0), src1 = srcAt(1);
  const B = {x: 10, y: 10, w: D.w - 20, h: D.h - 20};
  // destination: the largest zoom whose window stays inside the frame, covers no person at any moment of its
  // path (open and close), and leaves its source within the allowed bare-window time
  const openMs = (W.open[1] - W.open[0]) * DURATION, closeMs = (W.close[1] - W.close[0]) * DURATION;
  const zs = [dg.zoom, 3, 2.6, 2.3, 2, 1.8, 1.65, 1.5].filter(z => z <= dg.zoom + 1e-9);
  let pick = null;
  const pathClear = (a0, b0) => { for (let i = 0; i <= 40; i++) { const q = winRect(a0, b0, i / 40); if (people.some(b => overlaps(q, b, 4))) return false; } return true; };
  for (const z of zs) {
    const w0 = src0.w * z, h0 = src0.h * z, h1 = src1.h * z;
    let best = null;
    for (let cx = B.x + w0 / 2; cx <= B.x + B.w - w0 / 2 + 1e-6; cx += 16) {
      for (let y0 = B.y; y0 + h1 <= B.y + B.h + 1e-6; y0 += 16) {
        // the window's top-left stays fixed; it grows downward with the row
        const d0 = {x: cx - w0 / 2, y: y0, w: w0, h: h0}, d1 = {x: cx - w0 / 2, y: y0, w: w0, h: h1};
        if (people.some(b => overlaps(d1, b, 6))) continue;
        const tc0 = clearAt(src0, d0), tc1 = clearAt(src1, d1);
        if (tc0 * openMs > MAX_BLANK_MS || tc1 * closeMs > MAX_BLANK_MS) continue;
        const dist = Math.hypot(cx - (src0.x + src0.w / 2), y0 + h0 / 2 - (src0.y + src0.h / 2));
        if (best && dist >= best.dist) continue;
        if (!pathClear(src0, d0) || !pathClear(src1, d1)) continue;
        best = {z, d0, d1, tc0, tc1, dist};
      }
    }
    if (best) { pick = best; break; }
  }
  if (!pick) return {ok: false, problems: ['lens']};
  // the lens copy: a second card at the SAME coordinates as the context card (texts carry a zero-width mark)
  const lcard = checklistCard(ctx, 'lcard', M, {showText: showAll, colors, mark: '​'});
  const lensContent = g({transform: T(ox, oy, 0, k)}, g({transform: T(st.cardX0, cardTop)}, lcard.node));

  // ---- the clerk's pen re-marks the slot in context during the return (the row has grown by then)
  const slotW = st.cardSlot(fi, 1);
  const hover = {x: slotW.x - 4, y: slotW.y + 18};
  const penTrack = [
    {a: W.penTo[0], b: W.penTo[1] - 0.008, to: hover, ease: ease.inOutSine},
    {a: W.penTo[1] - 0.008, b: W.penTo[1], to: slotW, ease: ease.inOutSine},
    {a: W.cTap[1], b: W.penBack[0] + 0.012, to: hover, ease: ease.inOutSine},
    {a: W.penBack[0] + 0.012, b: W.penBack[1], to: G.restNib, ease: ease.inOutSine},
  ];

  // ---- art boxes (design) for placing text
  const readTL = TR.readTL;
  const readBox = Bx({x: readTL.x, y: readTL.y, w: SM.w * G.readK, h: SM.h * G.readK});
  const printerBox = Bx(st.printerBox);
  const lieBox = Bx({x: G.lie.x - RG.bundle.w / 2, y: G.ledgeY - 30, w: RG.bundle.w, h: 30});
  const ledgeBand = Bx({x: G.winX0 - 30, y: G.ledgeY - RG.ledgeTop, w: G.winX1 - G.winX0 + 60, h: RG.ledgeTop + RG.ledgeFront});
  const T0 = toD({x: 0, y: 0});

  // ---- the Δ marker is pinned on the card right after the new value (its label written under it)
  const mkS = st.card.markAt;
  const mkD = toD({x: st.cardX0 + mkS.x, y: cardTop + mkS.y});
  const mk = {x: mkD.x, y: mkD.y, r: mkS.r * k};
  const markBox = {x: mk.x - mk.r, y: mk.y - mk.r, w: mk.r * 2, h: mk.r * 2};
  if (faces.some(f => overlaps(f, markBox, 4))) problems.push('marker-face');
  const neuBottom = toD({x: 0, y: cardTop + row.st.yNew + row.st.neu.height}).y;
  const labTop = row.st.lab ? toD({x: 0, y: cardTop + row.st.yLab}).y : null;

  // ---- chips: names (filer under the feet; clerk on the counter panel — depth: on the floor in front of it)
  const chips = {};
  const cMin = Math.min(M.minText, SM.size, row.st.old.size, row.st.neu.size) * k;
  const capS = Math.min(S, cMin);
  const feetY = toD({x: 0, y: G.fy}).y;
  if (showKey) {
    const maxW = Math.min(D.w * 0.46, 520);
    for (const n of [1, 2]) {
      chips.f = wchip(ctx, captionOf(p, 'filer'), {x: clamp(toD({x: G.filerX, y: 0}).x, 0, D.w), y: feetY + 10, anchor: 'middle', maxWidth: maxW, size: S, minSize: S, maxLines: n, name: 'chip-f'});
      if (!chips.f.fit.truncated) break;
    }
    if (chips.f.box.x < 8) chips.f = wchip(ctx, captionOf(p, 'filer'), {x: 8, y: feetY + 10, maxWidth: maxW, size: S, minSize: S, maxLines: chips.f.fit.lines.length, name: 'chip-f'});
    const panelW = (G.winX1 - G.winX0 - 40) * k;
    const chipY = G.depth ? toD({x: 0, y: 16}).y : toD({x: 0, y: G.ledgeY + 40}).y;
    for (const n of [1, 2, 3]) {
      chips.c = wchip(ctx, captionOf(p, 'clerk'), {x: toD({x: G.clerk.x, y: 0}).x, y: chipY, anchor: 'middle', maxWidth: Math.min(panelW, maxW), size: S, minSize: S, maxLines: n, name: 'chip-c'});
      if (G.depth && overlaps(chips.c.box, filerBody, 6)) {
        const x0 = filerBody.x + filerBody.w + 12;
        chips.c = wchip(ctx, captionOf(p, 'clerk'), {x: x0 + chips.c.box.w / 2, y: chipY, anchor: 'middle', maxWidth: Math.min(panelW, maxW), size: S, minSize: S, maxLines: n, name: 'chip-c'});
      }
      if (!chips.c.fit.truncated) break;
    }
    if ([chips.f, chips.c].some(c => c.fit.truncated || badWrap(c.fit))) problems.push('chips');
    if (!G.depth && chips.c.box.y + chips.c.box.h > T0.y - 8) problems.push('chips');
    if (chips.f.box.y + chips.f.box.h > D.h - 4 || chips.f.box.x + chips.f.box.w > D.w - 4 || chips.c.box.x + chips.c.box.w > D.w - 4) problems.push('chips');
    if (overlaps(chips.c.box, filerBody, 4) || overlaps(chips.c.box, readBox, 4)) problems.push('chip-c');
  }
  let legend = null;
  if (showKey) {
    const px0 = G.depth ? Math.max(toD({x: G.winX0, y: 0}).x, filerBody.x + filerBody.w + 12) : toD({x: G.winX0 + 16, y: 0}).x;
    const px1 = toD({x: G.winX1 - 16, y: 0}).x;
    legend = legendPlate(ctx, {name: 'legend', x: px1, y: chips.c.box.y, S: capS, received: ctx.t.received, pending: ctx.t.pendingAs, maxW: px1 - px0, anchor: 'end'});
    if (overlaps(legend.box, chips.c.box, 10)) legend = legendPlate(ctx, {name: 'legend', x: px1, y: chips.c.box.y + chips.c.box.h + 10, S: capS, received: ctx.t.received, pending: ctx.t.pendingAs, maxW: px1 - px0, anchor: 'end'});
    const floorY = G.depth ? toD({x: 0, y: G.floorBottom}).y : T0.y;
    if (legend.truncated || legend.box.y + legend.box.h > floorY - 6 || legend.box.x < px0 - 1) problems.push('legend');
    if (overlaps(legend.box, filerBody, 4) || overlaps(legend.box, readBox, 4)) problems.push('legend');
  }
  if (problems.length) return {ok: false, problems};

  const obstacles = [cardBoxG, printerBox, filerBody, clerkBody, lieBox, readBox, ledgeBand, ...faces, markBox];
  if (chips.c) obstacles.push(chips.c.box, chips.f.box);
  if (legend) obstacles.push(legend.box);
  const bounds = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  const cands = gridCands(bounds, 12);

  // ---- relationship between the name chips (supplied label beside its own connector)
  const rels = [], relLabels = [];
  if (showKey) {
    const rel = p.relationships[0];
    const fb = chips.f.box, cb = chips.c.box;
    const A = {x: fb.x + fb.w, y: fb.y + fb.h / 2}, Bp = {x: cb.x, y: cb.y + cb.h / 2};
    let c = null;
    for (const bend of [0.12, -0.12, 0.3, -0.3]) {
      const cc = connector(ctx, {name: 'rel0', from: rel.from === 'filer' ? A : Bp, to: rel.from === 'filer' ? Bp : A, kind: rel.kind, bend, color: th.fgSoft});
      const pts = Array.from({length: 41}, (_, q) => cc.at(q / 40)).slice(2, -2);
      const hits = bx => pts.some(q => q.x > bx.x && q.x < bx.x + bx.w && q.y > bx.y && q.y < bx.y + bx.h);
      if (!(legend && hits(legend.box)) && !faces.some(hits) && !hits(markBox)) { c = cc; break; }
    }
    if (!c) return {ok: false, problems: ['rel-cross']};
    rels.push(c);
    if (showAll) {
      const text = rel.label || ctx.t[rel.kind] || rel.kind;
      const pts = Array.from({length: 21}, (_, q) => c.at(q / 20));
      let lab = null;
      for (const maxW of [Math.min(360, D.w * 0.3), 260, 200]) {
        const probe = wchip(ctx, text, {x: 0, y: 0, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, weight: 600});
        if (probe.fit.truncated || badWrap(probe.fit)) continue;
        const spot = freeSpot(cands, probe.box.w, probe.box.h, obstacles, bounds, 8, b => {
          const d = Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
          const on = pts.some(q => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4);
          return d + (on ? 1e4 : 0) + Math.hypot(b.x + b.w / 2 - c.mid.x, b.y + b.h / 2 - c.mid.y) * 0.2;
        });
        if (spot) { lab = wchip(ctx, text, {x: spot.x, y: spot.y, maxWidth: maxW, size: capS, minSize: capS, maxLines: 3, weight: 600, stroke: th.fgSoft}); break; }
      }
      if (!lab) return {ok: false, problems: ['rel-label']};
      relLabels.push(lab);
      obstacles.push(lab.box);
    }
    obstacles.push(...Array.from({length: 17}, (_, q) => { const pt = c.at(q / 16); return {x: pt.x - 6, y: pt.y - 6, w: 12, h: 12}; }));
  }

  // ---- context caption (top of the scene) and the key (near the card)
  const sceneBox = {x: toD({x: G.xL, y: 0}).x, y: toD({x: 0, y: top}).y, w: stW, h: stH};
  let caption = null, key = null;
  if (showAll) {
    const cp = wchip(ctx, p.contextLabels.context, {x: 0, y: 0, maxWidth: Math.min(560, D.w - 20), size: capS, minSize: capS, maxLines: 2, weight: 700, fill: th.paperShade});
    if (cp.fit.truncated || badWrap(cp.fit)) return {ok: false, problems: ['caption']};
    const cs = freeSpot(cands, cp.box.w, cp.box.h, obstacles, bounds, 10, b => Math.abs(b.y - sceneBox.y) * 2 + Math.abs(b.x + b.w / 2 - (sceneBox.x + sceneBox.w / 2)) * 0.4);
    if (!cs) return {ok: false, problems: ['caption']};
    caption = wchip(ctx, p.contextLabels.context, {x: cs.x, y: cs.y, maxWidth: Math.min(560, D.w - 20), size: capS, minSize: capS, maxLines: 2, weight: 700, fill: th.paperShade, name: 'caption'});
    obstacles.push(caption.box);
  }
  if (showKey) {
    const kp = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: Math.min(520, D.w - 20), size: capS, minSize: capS, maxLines: 2});
    const ks = freeSpot(cands, kp.box.w, kp.box.h, obstacles, bounds, 10, b => Math.hypot(b.x + b.w / 2 - (cardBox.x + cardBox.w / 2), (b.y - (cardBox.y + cardBox.h + 10)) * 1.2));
    if (!ks) return {ok: false, problems: ['key']};
    key = keyChip(ctx, ctx.t.key, {x: ks.x, y: ks.y, maxWidth: Math.min(520, D.w - 20), size: capS, minSize: capS, maxLines: 2, name: 'key'});
  }
  const contentMin = Math.min(M.minText * k, SM.size * k, S);
  return {
    ok: true, problems, S, k, su, G: Gs, M, SM, st, TR, lean, ox, oy, fi, items, colors, lcard, lensContent, srcAt, pick,
    blankMs: {open: r(pick.tc0 * openMs, 1), close: r(pick.tc1 * closeMs, 1)},
    penTrack, mk, markGap: labTop === null ? null : r(labTop - neuBottom, 1), chips, legend, rels, relLabels, caption, key, capS, contentMin, faces, people, cardBox, readBox,
    headPx: {filer: r(2 * 36 * fk * k, 1), clerk: r(2 * 44 * ck * k, 1)},
    wallSpan: {x0: r(Math.max(0, toD({x: Gs.xL, y: 0}).x) / D.w, 3), x1: r(Math.min(D.w, toD({x: Gs.xR, y: 0}).x) / D.w, 3)},
    sceneSpan: {x0: r(Math.max(0, sceneBox.x) / D.w, 3), x1: r(Math.min(D.w, sceneBox.x + sceneBox.w) / D.w, 3), y0: r(sceneBox.y / D.h, 3), y1: r((sceneBox.y + sceneBox.h) / D.h, 3)},
  };
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const tries = [];
    for (let S = C.size; S >= 16 - 1e-6; S -= 0.5) {
      let best = null;
      for (const cardW of [240, 270, 300, 350, 400, 460, 520, 600]) {
        for (const slipW of [170, 200, 230, 260, 290]) {
          let L = tryLayout(ctx, S, cardW, slipW);
          // a tall checklist: the clerk sits higher (static — never rising during the action)
          for (const lift of [30, 60, 90, 120, 150, 180, 220]) {
            if (L.ok || L.problems.join() !== 'slot-reach') break;
            L = tryLayout(ctx, S, cardW, slipW, lift);
          }
          // the biggest context first (then the bigger lens)
          if (L.ok && (!best || L.k > best.k + 1e-3 || (Math.abs(L.k - best.k) <= 1e-3 && L.pick.z > best.pick.z))) best = L;
          if (!L.ok) tries.push(`${S}/${cardW}/${slipW}:${L.problems.join('+')}`);
        }
      }
      if (best) return {...best, tries};
    }
    throw new Error(`${ID}: no layout fits (${tries.filter((t, i) => i % 6 === 0 || i >= tries.length - 4).join(' | ')})`);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const clipId = 'lens-clip';
    return g(null,
      g({transform: T(L.ox, L.oy, 0, L.k)}, L.st.node),
      L.chips.c && L.chips.c.node,
      L.chips.f && L.chips.f.node,
      L.legend && L.legend.node,
      L.rels.map((c, i) => g({name: `relg${i}`}, c.node)),
      L.relLabels.map((x, i) => g({name: `rell${i}`}, x.node)),
      L.caption && g({name: 'captiong', opacity: 0}, L.caption.node),
      L.key && g({name: 'keyg', opacity: 0}, L.key.node),
      // the lens: the context dims; an opaque window slides off the row and grows into an enlarged copy
      h('rect', {name: 'lens-dim', x: 0, y: 0, width: ctx.design.w, height: ctx.design.h, fill: th.bg || '#f4f1ea', opacity: 0}),
      g({name: 'lens', opacity: 0},
        h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'lens-clip-r', x: 0, y: 0, width: 1, height: 1, rx: 12}))),
        g({name: 'lens-win'},
          h('rect', {name: 'lens-shadow', x: 0, y: 0, width: 1, height: 1, rx: 12, fill: th.shadow}),
          h('rect', {name: 'lens-bg', x: 0, y: 0, width: 1, height: 1, rx: 12, fill: th.paper}),
          g({'clip-path': ctx.ref(clipId)}, g({name: 'lens-content', opacity: 0}, L.lensContent)),
          h('rect', {name: 'lens-rim', x: 0, y: 0, width: 1, height: 1, rx: 12, fill: 'none', stroke: th.accent, 'stroke-width': 3.5}),
        ),
      ),
      h('rect', {name: 'lens-occ', 'data-occludes': 1, x: 0, y: 0, width: 0, height: 0, fill: 'none'}),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const st = L.st;
    const x = w => seg(u, w[0], w[1]);
    const nodes = {};
    const dg = p.detailGeometry;
    const fi = L.fi;
    // ---- context: the last moment of the hand-back replayed on its own clock
    const aI = lerp(WI.both[0], WI.cBack[1], x(W.settle));
    const fr = intakeFrame(st, L.TR, WI, aI, L.items, L.lean);
    const inp = fr.input;
    const before = dg.states.before, after = dg.states.after;
    const same = before === after;
    const cSwap = same ? 0 : ease.inOutSine(x(W.cTap));
    const lSwap = same ? 0 : ease.inOutSine(x(W.lGlyph));
    const rowGlyph = sw => {
      const b = before === 'received' ? {d: 1, r: 0} : {d: 0, r: 1};
      const a = after === 'received' ? {d: 1, r: 0} : {d: 0, r: 1};
      // sequential, never cross-faded in place: the before-glyph goes out, then the after-glyph comes in
      const out = seg(sw, 0, 0.5), inn = seg(sw, 0.5, 1);
      if (b.d === a.d) return {d: b.d, r: b.r};
      return {d: b.d ? 1 - out : inn, r: b.r ? 1 - out : inn};
    };
    const cg = rowGlyph(cSwap), lg = rowGlyph(lSwap);
    const dots = L.items.map((_, i) => (i === fi ? cg.d : 1));
    const rings = L.items.map((_, i) => (i === fi ? cg.r : 0));
    // the row opens its new-value line only when the new value is written (context and lens alike)
    const cGrow = ease.inOutSine(x(W.cNew)), lGrow = ease.inOutSine(x(W.lNew));
    inp.card = {dots, rings, hl: [], status: {strike: x(W.cStrike), old: lerp(1, OLD_TRACE, x(W.cOld)), reveal: seg(u, W.cNew[0] + (W.cNew[1] - W.cNew[0]) * 0.5, W.cNew[1]), grow: cGrow, marker: x(W.marker), markLabel: x(W.markLabel)}};
    const nib = runTrack(u, inp.clerk.nib, L.penTrack);
    const leanP = ease.inOutSine(seg(u, W.penTo[0] - 0.02, W.penTo[0] + 0.01)) * (1 - ease.inOutSine(x(W.penBack)));
    inp.clerk = {...inp.clerk, nib, look: u > W.penTo[0] && u < W.penBack[1] ? 1 : 0, shift: {x: L.lean.x * leanP, y: 0}, tilt: 3 * leanP};
    const posed = st.pose(inp);
    Object.assign(nodes, posed.nodes);
    // ---- lens: open progress t (0 closed … 1 open)
    const opening = u < W.close[0];
    const t = opening ? x(W.open) : 1 - x(W.close);
    const gr = lGrow;
    const src = L.srcAt(gr);
    const d0 = L.pick.d0, d1 = L.pick.d1;
    const dst = {x: d0.x, y: d0.y, w: d0.w, h: lerp(d0.h, d1.h, gr)};
    const R = winRect(src, dst, t);
    const over = t > 0 && overlaps({x: R.x, y: R.y, w: R.w + 6, h: R.h + 8}, src, 3);
    const tClear = opening ? L.pick.tc0 : L.pick.tc1;
    const cv = t <= 0 ? 0 : over ? 0 : clamp((t - tClear) / COPY_FADE);
    const s = R.w / src.w;
    nodes.lens = {opacity: t > 0 ? 1 : 0};
    nodes['lens-dim'] = {opacity: r(0.42 * clamp(t * 3), 3)};
    const rect = {x: r(R.x), y: r(R.y), width: r(Math.max(1, R.w)), height: r(Math.max(1, R.h))};
    nodes['lens-clip-r'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-rim'] = rect;
    nodes['lens-shadow'] = {x: r(R.x + 6), y: r(R.y + 8), width: rect.width, height: rect.height};
    nodes['lens-content'] = {opacity: r(cv, 3), transform: `translate(${r(R.x - src.x * s, 2)} ${r(R.y - src.y * s, 2)}) scale(${r(s, 4)})`};
    const lensState = {strike: x(W.lStrike), old: lerp(1, OLD_TRACE, x(W.lOld)), reveal: seg(u, W.lNew[0] + (W.lNew[1] - W.lNew[0]) * 0.5, W.lNew[1]), grow: lGrow};
    Object.assign(nodes, L.lcard.frame({dots: L.items.map((_, i) => (i === fi ? lg.d : 1)), rings: L.items.map((_, i) => (i === fi ? lg.r : 0)), status: lensState}));
    // the copy's new value exists only once it is written; the changed-datum label belongs to the context
    nodes['lcard-new'] = {...nodes['lcard-new'], display: lensState.reveal > 0};
    // the opaque window hides the context beneath it (for the overlap heuristics)
    nodes['lens-occ'] = t > 0 ? rect : {x: 0, y: 0, width: 0, height: 0};
    // ---- people: the window never covers a head, a body or the clerk's hands
    const sem = posed.semantic;
    const hands = [sem.clerkL, sem.clerkR, sem.filerHand].filter(Boolean).map(q => ({x: q.x - 14, y: q.y - 14, w: 28, h: 28}));
    const lensClearOfPeople = t <= 0 || ![...L.people, ...hands].some(b => overlaps(R, b, 2));
    if (L.caption) nodes.captiong = {opacity: r(x(W.caption), 3)};
    if (L.key) nodes.keyg = {opacity: r(x(W.key), 3)};
    L.rels.forEach(c => Object.assign(nodes, c.frame(1, 1)));
    const marker = x(W.marker);
    const lensDatum = u < W.lStrike[0] ? 'before' : lensState.reveal >= 1 && (same || lSwap >= 1) ? 'after' : 'changing';
    const ctxDatum = x(W.cStrike) === 0 && x(W.cNew) === 0 && cSwap === 0 ? 'before' : x(W.cNew) >= 1 && (same || cSwap >= 1) ? 'after' : 'changing';
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const tapping = u >= W.penTo[1] && u <= W.cTap[1];
    const Dp = q => ({x: r(L.ox + q.x * L.k), y: r(L.oy + q.y * L.k)});
    return {
      nodes,
      semantic: {
        ...sem,
        gripF: fr.sem.slipHolder === 'filer' ? sem.slipL : null,
        gripC: fr.sem.slipHolder === 'clerk' ? sem.slipR : null,
        tapTarget: tapping ? Dp(st.cardSlot(fi, cGrow)) : null,
        beat,
        lensOpen: r(t, 3), lensCopyVisible: r(cv, 3), lensOverSource: over, lensClearOfPeople,
        blankMs: L.blankMs,
        zoom: r(L.pick.z, 3), magnification: r(dst.w / src.w, 3), lensScale: r(s, 3), placement: 'auto',
        lensCopyMatches: Math.abs(R.w / src.w - R.h / src.h) < 1e-3,
        lensRect: {x: r(R.x), y: r(R.y), w: r(R.w), h: r(R.h)},
        datum: lensDatum, contextDatum: ctxDatum,
        lens: {strike: r(lensState.strike, 3), old: r(lensState.old, 3), reveal: r(lensState.reveal, 3), grow: r(lGrow, 3), dot: r(lg.d, 3), ring: r(lg.r, 3)},
        context: {strike: r(x(W.cStrike), 3), old: r(lerp(1, OLD_TRACE, x(W.cOld)), 3), reveal: r(inp.card.status.reveal, 3), grow: r(cGrow, 3), dot: r(cg.d, 3), ring: r(cg.r, 3)},
        oldTraceable: lerp(1, OLD_TRACE, x(W.cOld)) >= 0.5 && lensState.old >= 0.5,
        markerShown: r(marker, 3),
        markOnRow: L.mk.x > L.cardBox.x && L.mk.x < L.cardBox.x + L.cardBox.w,
        markClearOfFaces: !L.faces.some(f => overlaps(f, {x: L.mk.x - L.mk.r, y: L.mk.y - L.mk.r, w: L.mk.r * 2, h: L.mk.r * 2}, 2)),
        markRadius: r(L.mk.r, 1), markNoteGap: L.markGap, markNoteShown: L.markGap === null ? 0 : r(x(W.markLabel), 3),
        values: {before: p.beforeValue, after: p.afterValue},
        states: dg.states,
        headPx: L.headPx, sceneSpan: L.sceneSpan, wallSpan: L.wallSpan, depth: L.G.depth,
        labelsFit: L.ok, textSize: L.S, scale: r(L.k, 3), contentMin: r(L.contentMin, 1),
        mainActionEnd: W.penBack[1],
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
    slug: 'roles-08-inspect',
    title: 'Registry window — inspecting and substituting a checklist status',
    titleEs: 'Atención en registro — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Atención en registro',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the registry window right after the intake (slip handed back, bundle on the ledge, every checklist row dotted, the inspected row showing its supplied status). A lens copies that checklist row at the card’s own coordinates (≥ 1.5×); the old status is struck but kept readable in grey, the supplied alternative is written below and only the dependent glyph changes (filled dot ↔ dashed ring, as supplied). Back in context the clerk’s pen re-marks the slot and a neutral Δ is pinned on the row. Seeking back restores the old datum.',
    tags: ['registry', 'inspect', 'lens', 'checklist', 'status', 'substitution', 'changed datum', 'pending', 'received', 'pen'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/atencion-en-registro.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
