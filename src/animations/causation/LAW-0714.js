/**
 * LAW-0714 — Contribución de la persona afectada · mechanism
 *
 * Storyboard (an exploded model of the two lanes, not a row of boxes):
 *  0.00–0.18 separate  The assembled slab comes apart into its pieces: the LANE A
 *                      piece (lane A, its ● trolley at its barrier and the steps
 *                      supplied for it) on the left, the LANE B piece (the same
 *                      for lane B, ◆) on the right, both on equal plinths at
 *                      equal size and weight, and the CONVERGENCE piece — the two
 *                      lane ends with their barriers and the two connectors to
 *                      the event pad — lifted out and enlarged. The record (the
 *                      steps in the supplied order) slides out to its place.
 *  0.18–0.43 relate    Only the supplied relationships are drawn, one after
 *                      another, each with its kind: lane A — convergence, lane
 *                      B — convergence (plain relations, drawn alike;
 *                      no arrowhead; a causal arrow only when the author supplies
 *                      kind "causal"; the default model has none).
 *  0.43–0.75 trace     A tracer runs through the supplied traversal order along
 *                      those connectors while the focus element (default: the
 *                      convergence piece) enlarges.
 *  0.75–1.00 hold      The focus settles back; record, both lane pieces and the
 *                      convergence piece stay visible with the key "As supplied ·
 *                      no conclusion drawn". Neither lane is shown as lesser,
 *                      faded or weighed; no share, fault or contributory doctrine
 *                      is stated; the convergence is a supplied description only.
 * Wide boxes: the pieces left, the record right. Tall/square boxes: the record
 * above the pieces. Distinct from the story (LAW-0713): nothing rolls — the scene
 * is taken apart into pieces. Layout engine copied from LAW-0710 (accepted
 * causation-08 mechanism).
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0714
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {mechanismFields} from '../../schemas/fields.js';
import {plinthArt} from './kits/causal-chain.js';
import {
  caFields, CA_STRINGS, CA_DEFAULTS, CA_ES_DEFAULTS, resolveCA, entryRow, linkNotes, altText, glueN as gp, unwidow,
  miniField, miniSpot, MINI_W, boundaryPiece,
  iconChip, flowRows, recordMeasure, recordBuild, linkArt, tracerArt, boxExit, boxesMeet, adIcon,
  chipG, clamp, ease, lerp, r, seg, localizeScene,
} from './kits/contribucion-afectada.js';
const itemIcon = (ctx, it, x, cy, s) => adIcon(ctx, it, x, cy, s);

const ID = 'LAW-0714';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], hold: [0.75, 1]};
const W = {split: [0.01, 0.14], labels: [0.12, 0.19], relate: [0.19, 0.42], trace: [0.46, 0.73], focusIn: [0.45, 0.52], focusOut: [0.74, 0.8], band: [0, 0.04], key: [0.78, 0.84]};
const IDS = ['record', 'laneA', 'laneB', 'convergence', 'alternative'];
// plinth height (× the piece height): low plinths, so the lane pieces themselves dominate
const PLINTH = 0.2;

const strings = {
  en: {...CA_STRINGS.en, convergence: 'Convergence piece: lane ends and connectors (enlarged)', alternative: 'Put forward', relation: 'related (as supplied)', communication: 'noted in the record', sequence: 'then (as supplied)', causal: 'causal (as supplied)'},
  es: {...CA_STRINGS.es, convergence: 'Pieza de convergencia: finales de carril y conectores (ampliada)', alternative: 'Planteado', relation: 'relacionado (según lo aportado)', communication: 'consta en el registro', sequence: 'después (según lo aportado)', causal: 'causal (según lo aportado)'},
};

const sceneSchema = {
  ...caFields,
  ...mechanismFields(IDS),
};

const defaultParams = {
  ...CA_DEFAULTS,
  elements: [
    {id: 'record', label: 'Record of the two conducts (as supplied)'},
    {id: 'laneA', label: 'Lane A: conduct of A'},
    {id: 'laneB', label: 'Lane B: conduct of B'},
    {id: 'convergence', label: 'Convergence piece (enlarged)'},
  ],
  relationships: [
    {from: 'laneA', to: 'convergence', kind: 'relation'},
    {from: 'laneB', to: 'convergence', kind: 'relation'},
  ],
  focusElement: 'convergence',
  relationLabels: {relation: 'related as supplied', communication: 'noted in the record', sequence: 'then (as supplied)', causal: 'causal (as supplied)'},
  traversalOrder: ['laneA', 'convergence', 'laneB'],
};

// Spanish versions of the default content, used with locale "es" for fields left at their English default
const defaultParamsEs = {
  ...CA_ES_DEFAULTS,
  elements: [
    {id: 'record', label: 'Registro de las dos conductas (según lo aportado)'},
    {id: 'laneA', label: 'Carril A: conducta de A'},
    {id: 'laneB', label: 'Carril B: conducta de B'},
    {id: 'convergence', label: 'Pieza de convergencia (ampliada)'},
  ],
  relationLabels: {relation: 'relacionado según lo aportado', communication: 'consta en el registro', sequence: 'después (según lo aportado)', causal: 'causal (según lo aportado)'},
};

const MARGIN = 10;
const SHAPES = {
  landscape: {size: 26, minSize: 17, modes: ['row', 'rowcol'], rws: [420, 480, 540, 600]},
  square: {size: 24, minSize: 17, modes: ['band', 'row', 'rowcol', 'stack'], rws: [340, 380, 420, 480, 540]},
  portrait: {size: 25, minSize: 17, modes: ['stack', 'band'], rws: [460, 520, 620, 720, 930]},
};

function elementLabel(ctx, p, id) {
  const e = p.elements.find(q => q.id === id);
  return e ? e.label : (ctx.t[id] || id);
}

/** Text items measured by the layout. */
function texts(ctx, p, M) {
  const t = ctx.t;
  const has = id => p.elements.some(e => e.id === id);
  const chips = {};
  chips.laneA = {key: 'laneA', icon: 'laneA', text: elementLabel(ctx, p, 'laneA')};
  chips.laneB = {key: 'laneB', icon: 'laneB', text: elementLabel(ctx, p, 'laneB')};
  // the convergence piece's chip carries the event and the loss exactly as supplied
  if (has('convergence')) chips.convergence = {key: 'convergence', icon: 'loss', text: `${elementLabel(ctx, p, 'convergence')} · ${p.origin.name} · ${p.losses[0].label}`};
  if (has('alternative')) chips.alternative = {key: 'alternative', icon: 'alt', text: elementLabel(ctx, p, 'alternative')};
  const band = [];
  // the key of the two lanes (equal chips): what each lane carries, as supplied
  band.push({key: 'innerKey', icon: 'laneA', text: t.laneA});
  band.push({key: 'outerKey', icon: 'laneB', text: t.laneB});
  band.push({key: 'object', icon: 'event', text: `${p.origin.name} · ${t.lanes}`});
  M.alternatives.forEach((a, j) => band.push({key: `alt${j}`, icon: 'alt', text: altText(ctx, a)}));
  if (p.losses[1]) band.push({key: 'loss1', icon: 'loss', text: `${t.alsoNoted}: ${p.losses[1].label}`});
  linkNotes(ctx, M).forEach(l => band.push({...l}));
  band.push({key: 'key', text: t.key});
  const rels = p.relationships.filter(q => q.from !== q.to && has(q.from) && has(q.to));
  const relText = q => (p.relationLabels && p.relationLabels[q.kind]) || t[q.kind];
  return {chips, band, rels, relText, header: has('record') ? elementLabel(ctx, p, 'record') : null};
}

/**
 * A chip measured for a width, at bounded cost: a chip measured for width W (w wide) is reused for any width in
 * [w, W] (it fits there; a one-line chip for any width >= w), a chip that does not fit width W is not measured again
 * for a narrower one, and new widths are quantized down to 20-unit steps (a chip never gets more room than offered).
 */
function rangedChip(ctx, memo, key, it, size, mw0, o) {
  const rk = `${size}|${key}`;
  let rs = memo.ranges.get(rk);
  if (!rs) { rs = []; memo.ranges.set(rk, rs); }
  for (const q of rs) {
    if (q.c.bad ? mw0 <= q.hi : q.c.w <= mw0 + 0.5 && (mw0 <= q.hi || q.c.lines === 1)) return q.c;
  }
  const step = Math.floor(mw0 / 20) * 20;
  const mw = Math.max(size * 4, step);
  const c = {it, ...iconChip(ctx, it, {size, maxW: mw, ...o})};
  // (the whole quantization step [mw, mw + 20) maps to this measurement)
  rs.push({hi: Math.max(mw, step) + 19.99, c});
  return c;
}

/** Relation-label widths and heights used by compose (memoized per text size and label width rule). */
function relMeasures(ctx, base, size, narrowSeq, full) {
  const mk = `${size}|${narrowSeq}`;
  let m = base.memo.rel.get(mk);
  if (m) return m;
  m = {relW: 0, seqW: 0, relHmax: 0, altRelW: 0};
  if (ctx.show('key') && ctx.show('all')) {
    for (const q of base.rels) {
      const c = chipG(ctx, base.relText(q), {x: 0, y: 0, maxWidth: Math.min(360, full / 2), size, maxLines: 2});
      // gap between the objects and the record: room for the label of a connector that crosses it
      if (q.from === 'record' || q.to === 'record') m.relW = Math.max(m.relW, c.box.w);
      // tallest relation label (the record-to-object gap holds it beside a vertical link)
      m.relHmax = Math.max(m.relHmax, c.box.h);
      // the label of a link between the two states sits in the gap between the stands
      if ((q.from === 'laneA' && q.to === 'laneB') || (q.from === 'laneB' && q.to === 'laneA')) {
        const so = {x: 0, y: 0, maxWidth: narrowSeq ? Math.max(size * 7, 150) : Math.min(360, full / 2), size, maxLines: narrowSeq ? 3 : 2};
        // (measured as drawn: unwidowed, so a label that cannot wrap without a one-word line keeps its one-line width)
        m.seqW = Math.max(m.seqW, chipG(ctx, unwidow(base.relText(q), t0 => chipG(ctx, t0, so).fit), {...so, maxWidth: Math.min(360, full / 2)}).box.w);
      }
      // (the alternative link's label may wrap to three lines beside its connector)
      if (q.from === 'alternative' || q.to === 'alternative') m.altRelW = Math.max(m.altRelW, chipG(ctx, base.relText(q), {x: 0, y: 0, maxWidth: Math.max(size * 7, 150), size, maxLines: 3}).box.w);
    }
  }
  base.memo.rel.set(mk, m);
  return m;
}

function compose(ctx, base, cfg) {
  const D = ctx.design;
  const {size, mode, RW} = cfg;
  const textOn = ctx.show('key');
  const memo = base.memo;
  const full = D.w - 2 * MARGIN;
  // record
  let rec = null;
  if (base.header !== null) {
    const rk = `${size}|${RW}|${cfg.maxLines}`;
    // (a record whose rows all fit in fewer lines is the same record with a higher line limit)
    const r3 = cfg.maxLines > 3 ? memo.rec.get(`${size}|${RW}|3`) : null;
    rec = memo.rec.get(rk) || (r3 && !r3.bad ? r3 : null) || recordMeasure(ctx, {w: RW, size, header: base.header, rows: base.rows, kind: base.kind, text: textOn, maxLines: cfg.maxLines});
    memo.rec.set(rk, rec);
    if (rec.bad) return {bad: 'record'};
  }
  const recW = rec ? RW + 20 : 0;
  const recH = rec ? rec.h + 14 + rec.clipH * 0.35 : 0;
  const {relW, seqW, relHmax, altRelW} = relMeasures(ctx, base, size, Boolean(cfg.narrowSeq), full);
  const rowish = mode === 'row' || mode === 'rowcol';
  const gapR = rowish ? Math.max(40, relW + 50) : 40;
  const leftW = mode === 'band' ? full - recW - 30 : 0;
  const altGap = altRelW ? altRelW + 40 : 0; // room for the alternative link's label between its chip and the record
  const altV = Math.max(24, relHmax + 30); // vertical gap between the record and an alternative chip under it
  const zoneW = rowish ? full - recW - gapR : full;
  // stacked chips: the before and after captions one above the other, each as wide as the zone
  const stackChips = Boolean(cfg.stackChips);
  const chipW = stackChips ? Math.min(760, zoneW - 10) : Math.min(rowish ? 460 : 480, zoneW / 2 - 12);
  const meas = (it, mw) => {
    // labels hidden: the alternative element is still drawn, as its barrier icon alone
    if (it && !textOn && it.key === 'alternative') {
      const s0 = size * 2.4;
      return {it, w: s0, h: s0, bad: false, build: (x, y, name) => ({node: g({name}, itemIcon(ctx, {icon: 'alt', key: 'alt-el'}, x, y + s0 / 2, s0, base.kind)), box: {x, y, w: s0, h: s0}})};
    }
    if (!it || !textOn) return {w: 0, h: 0, bad: false};
    return rangedChip(ctx, memo, `el|${it.key}`, it, size, mw, {kind: base.kind, maxLines: it.key === 'convergence' ? 6 : 4});
  };
  const cB = meas(base.chips.laneA, chipW), cA = meas(base.chips.laneB, chipW);
  // band mode: the inset's chip beside the inset when it fits there, else under it (the whole left column wide)
  let cD = meas(base.chips.convergence, mode === 'band' ? Math.max(120, leftW - 150) : chipW * 0.8);
  if (mode === 'band' && cD.bad) cD = meas(base.chips.convergence, Math.max(120, leftW - 12));
  else if (cD.bad) cD = meas(base.chips.convergence, Math.max(120, Math.min(420, chipW * 1.3)));
  // the alternative sits under the record (wide boxes: in its column; tall boxes: on the left, clear of the link that
  // rises from the after state on the right)
  const altW = rowish ? recW : mode === 'band' ? leftW - altGap : full * 0.56;
  const cAlt = meas(base.chips.alternative, Math.min(altW, 760));
  if ([cB, cA, cD, cAlt].some(c => c.bad)) return {bad: `chip${[cB, cA, cD, cAlt].map((c, i) => (c.bad ? 'BADX'[i] : '')).join('')}`};
  // band (key, notes)
  const bandW = mode === 'rowcol' ? recW : full;
  const kLeft = mode === 'band' ? (cfg.kLeft || 0) : 0; // band mode: the first kLeft band chips go in the left column
  const flowBand = (w, idx) => {
    const bk = `${size}|${Math.round(w)}|${cfg.half}|${idx.join(',')}`;
    let b = memo.band.get(bk);
    if (!b) {
      const mw = cfg.half ? (w - 18) / 2 : Math.min(w, 760);
      const sz = [];
      for (const i of textOn ? idx : []) sz.push(rangedChip(ctx, memo, `b${i}`, base.band[i], size, mw, {kind: base.kind, maxLines: 3}));
      // (first-fit rows: a chip takes the first row with room, so short chips fill gaps left by long ones; flowing the
      // packed order row by row gives back exactly these rows)
      const rowsFF = [];
      for (const c of sz) {
        const row = rowsFF.find(rw => rw.w + 18 + c.w <= w + 0.5);
        if (row) { row.items.push(c); row.w += 18 + c.w; } else rowsFF.push({w: c.w, items: [c]});
      }
      const packed = rowsFF.flatMap(rw => rw.items);
      const fl = flowRows(packed, {x: 0, y: 0, w, gap: 18, rowGap: 10});
      b = {sz: packed, h: packed.length ? fl.bottom : 0, bad: packed.some(q => q.bad || q.w > w + 0.5)};
      memo.band.set(bk, b);
    }
    return b;
  };
  if (kLeft > base.band.length) return {bad: 'k'};
  // band mode, keyLeft: the short key chip ("As supplied · no conclusion drawn") joins the left column under the inset
  const nB = base.band.length, keyI = base.band.findIndex(it => it.key === 'key');
  const keyLeft = mode === 'band' && cfg.keyLeft && keyI >= kLeft;
  if (cfg.keyLeft && !keyLeft) return {bad: 'keyLeft'};
  const leftIdx = [...Array(kLeft).keys(), ...(keyLeft ? [keyI] : [])];
  const band = flowBand(bandW, [...Array(nB).keys()].filter(i => !leftIdx.includes(i)));
  const leftBandW = mode === 'band' ? Math.min(leftW, (cD.w && leftW >= cD.w + 16 + 2 * 70 ? cD.w + 16 : 0) + Math.min((leftW - 12) / 2, 150) * 2 + 12) : 0;
  const leftBand = leftIdx.length ? flowBand(leftBandW, leftIdx) : {sz: [], h: 0, bad: false};
  if (band.bad || leftBand.bad) return {bad: 'band'};
  // (band mode packs tighter — gaps of 12 above the key band and 22 under the top band — so the ring pieces keep the
  // subject floor in square boxes)
  const bandGap = mode === 'band' ? 12 : 18, topGap = mode === 'band' ? 22 : 30;
  const bandH = band.h && mode !== 'rowcol' ? band.h + bandGap : 0;
  const bandColH = band.h && mode === 'rowcol' ? band.h + 18 : 0;
  // relation label height budget (one chip line)
  const relH = textOn ? Math.max(size * 1.9, relHmax + 10) : 40;
  // object height from the room left
  const unitW = OH => {
    const ow = MINI_W * OH;
    const pw = ow * 1.04;
    const R = OH * (mode === 'stack' ? 0.32 : 0.42);
    const colB = stackChips ? pw : Math.max(pw, cB.w), colA = stackChips ? pw : Math.max(pw, cA.w);
    // (stack: the convergence piece stands above the pieces, so the gap only holds the link between them and its label)
    const gapX = Math.max(OH * (mode === 'band' ? 0.55 : mode === 'stack' ? 0.3 : 0.9), mode === 'band' || mode === 'stack' ? 0 : 2 * R + 40, (colB + colA) / 2 - pw + 24, seqW + 40);
    return {w: colB / 2 + pw + gapX + colA / 2, pw, R, gapX, ow};
  };
  const chipsH = stackChips ? cB.h + (cB.h && cA.h ? 8 : 0) + cA.h : Math.max(cB.h, cA.h);
  const zoneH = OH => {
    const R = OH * (mode === 'stack' ? 0.32 : 0.42);
    return (mode === 'band' ? 0 : 2 * R + relH + 30) + OH + OH * PLINTH + 14 + chipsH;
  };
  let availH;
  let bandGeo = null;
  if (mode === 'band') {
    // top band: [alternative chip, inset + its chip] on the left, the record on the right; the objects below
    if (leftW < 200 || recW > full * 0.72 || leftW - altGap < 160) return {bad: 'band-w'};
    const altBlock = cAlt.h ? cAlt.h + 20 : 0;
    const chipLeft = cD.w && leftW >= cD.w + 56 + 2 * 70;
    // the inset grows ×1.25 when it is the focus element: its chip keeps clear of the grown disc (grow × R)
    const grow = base.focus === 'convergence' ? 0.27 : 0;
    const Rw = ((chipLeft ? leftW - cD.w - 56 : leftW) - 12) / 2;
    const lbH = leftBand.h ? leftBand.h + 20 : 0;
    const chipB = cD.w && !chipLeft ? cD.h + 10 : 0;
    // (the grown disc also keeps clear of the content notice's pill above the design box — at most 12 units into the
    // notice band's free strip under the pill: when no alternative chip stands above the inset, it moves down by topX)
    const topXOf = R0 => (grow ? Math.max(0, 0.25 * R0 - altBlock - 2 - 12) : 0);
    let R = Math.max(70, Math.min(Rw, 150, (recH - altBlock - chipB - lbH) / (2 + (chipB ? grow : 0))));
    for (let i = 0; i < 3; i++) R = Math.max(70, Math.min(Rw, 150, (recH - altBlock - chipB - lbH - topXOf(R)) / (2 + (chipB ? grow : 0))));
    if (R > Rw) return {bad: 'inset-w'};
    const topX = topXOf(R);
    const belowH = chipB ? chipB + grow * R : 0;
    const TB = Math.max(recH, altBlock + topX + 2 * R + belowH + lbH);
    bandGeo = {R, chipLeft, altBlock, belowH, TB, lbH, topX};
    availH = D.h - bandH - TB - relH - topGap;
    if (availH < 100) return {bad: 'band-h'};
  } else if (rowish) {
    availH = D.h - bandH;
    const colH = recH + (cAlt.h ? altV + cAlt.h : 0) + bandColH;
    if (colH > availH) return {bad: 'colH'};
  } else {
    availH = D.h - bandH - recH - 30 - (cAlt.h ? cAlt.h + altV : 0) - relH;
    if (recW > full) return {bad: 'recW'};
  }
  // solve OH by bisection (the zone width is not linear in OH once chips dominate)
  let lo = 20, hi = 700;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (unitW(mid).w <= zoneW && zoneH(mid) <= availH) lo = mid; else hi = mid;
  }
  const OH = lo;
  if (OH < cfg.hMin) return {bad: 'OH', OH};
  if (cfg.dry) return {OH, size, cfg: {...cfg, dry: false}};
  return {OH, size, cfg, bandGap, topGap, rec, recW, recH, zoneW, gapR, altV, bandColH, chipsH, stackChips, leftBand, leftW: leftBandW, cB, cA, cD, cAlt, band, bandH, relH, unitW: unitW(OH), zoneH: zoneH(OH), mode, availH, bandGeo, Rin: bandGeo ? bandGeo.R : unitW(OH).R};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveCA(p);
    const tx = texts(ctx, p, M);
    const base = {M, focus: p.focusElement, rels: tx.rels, relText: q => gp(tx.relText(q)), kind: 'ca', header: tx.header, rows: M.entries.map(e => entryRow(e)), chips: tx.chips, band: tx.band, memo: {rec: new Map(), band: new Map(), chip: new Map(), ranges: new Map(), rel: new Map()}};
    const finish = (L, isFallback) => {
    L.fallback = isFallback;
    L.why = why.filter(w0 => /@17:/.test(w0)).slice(0, 80);
    const D = L.D || ctx.design;
    const OH = L.OH;
    const U = L.unitW;
    const textOn = ctx.show('key');
    // ---- vertical/horizontal placement
    const full = D.w - 2 * MARGIN;
    let zx, zy, recX = 0, recY = 0, altX = 0, altY = 0;
    const zoneWd = U.w;
    if (L.mode === 'row' || L.mode === 'rowcol') {
      const blockW = zoneWd + L.gapR + L.recW;
      // spare width goes mostly between the objects and the record (the model spans the box)
      const extra = Math.max(0, full - blockW);
      L.gapR += extra * 0.7;
      const x0 = MARGIN + extra * 0.15;
      const colH = L.recH + (L.cAlt.h ? L.altV + L.cAlt.h : 0) + L.bandColH;
      const blockH = Math.max(L.zoneH, colH);
      const top = Math.max(0, (D.h - L.bandH - blockH) / 2);
      zx = x0; zy = top + (blockH - L.zoneH) / 2;
      recX = x0 + zoneWd + L.gapR + 10; recY = top + (blockH - colH) / 2 + (L.rec ? L.rec.clipH * 0.35 : 0);
      altX = recX - 10 + (L.recW - L.cAlt.w) / 2; altY = recY - (L.rec ? L.rec.clipH * 0.35 : 0) + L.recH + L.altV;
      L.bandY = top + blockH + 18;
      if (L.mode === 'rowcol') { L.bandX = recX - 10; L.bandW = L.recW; L.bandY = top + (blockH - colH) / 2 + L.recH + (L.cAlt.h ? L.altV + L.cAlt.h : 0) + 18; }
    } else if (L.mode === 'band') {
      const B0 = L.bandGeo;
      const blockH = B0.TB + L.relH + L.topGap + L.zoneH;
      // spare height: the top band stays high and the objects stand at the foot of the box (the model spans it)
      const spare = Math.max(0, D.h - L.bandH - blockH);
      const top = spare * 0.2;
      recX = MARGIN + full - L.recW + 10; recY = top + (L.rec ? L.rec.clipH * 0.35 : 0);
      altX = MARGIN; altY = top;
      zx = MARGIN + (full - zoneWd) / 2; zy = top + B0.TB + L.relH + L.topGap + spare * 0.8;
      L.insetAt = {x: MARGIN + (B0.chipLeft ? L.cD.w + 12 + B0.R * 0.27 : 0) + B0.R + 6, y: top + B0.altBlock + B0.topX + B0.R + 6};
      L.leftBandY = top + B0.altBlock + B0.topX + 2 * B0.R + 12 + B0.belowH + 20;
      L.bandY = top + blockH + spare * 0.8 + L.bandGap;
    } else {
      const blockH = L.recH + (L.cAlt.h ? L.altV + L.cAlt.h : 0) + 30 + L.relH + L.zoneH;
      // (spare height goes between the record and the pieces: the pieces stand at the foot of the box)
      const spareS = Math.max(0, D.h - L.bandH - blockH);
      const top = spareS * 0.15;
      recX = MARGIN + (full - L.recW) / 2 + 10; recY = top + (L.rec ? L.rec.clipH * 0.35 : 0);
      altX = recX - 10; altY = top + L.recH + L.altV;
      zx = MARGIN + (full - zoneWd) / 2; zy = top + L.recH + (L.cAlt.h ? L.altV + L.cAlt.h : 0) + 30 + L.relH + spareS * 0.85;
      L.bandY = top + blockH + spareS * 0.85 + 18;
    }
    // objects
    const R = L.Rin;
    const colB = L.stackChips ? U.pw : Math.max(U.pw, L.cB.w);
    const bx = zx + colB / 2;
    const ax = bx + U.pw / 2 + U.gapX + U.pw / 2;
    const floorY = zy + L.zoneH - L.chipsH - 14;
    const baseY = floorY - OH * PLINTH; // plinth top = object base
    const G = {spot: miniSpot(OH)};
    L.G = G;
    L.pos = {
      laneA: {x: bx, y: baseY}, laneB: {x: ax, y: baseY},
      // wide boxes: above the gap, nearer the after state; tall boxes: nearer the before state, so the connector from
      // the after state up to the record runs clear of it
      // (the inset grown as the focus keeps clear of the content notice's pill: at most 12 units into the notice band's
      // free strip above the design box)
      convergence: L.mode === 'band' ? L.insetAt : {x: (bx + ax) / 2, y: Math.max(zy + R, p.focusElement === 'convergence' ? 1.25 * R + 4 - 12 : 0)},
    };
    L.floorY = floorY;
    L.boxes = {
      // (the post heads reach the mini field's top, OH above the base)
      laneA: {x: bx - U.ow / 2, y: baseY - OH * 1.02, w: U.ow, h: OH * 1.02},
      laneB: {x: ax - U.ow / 2, y: baseY - OH * 1.02, w: U.ow, h: OH * 1.02},
      convergence: {x: L.pos.convergence.x - R, y: L.pos.convergence.y - R, w: 2 * R, h: 2 * R},
    };
    if (L.rec) {
      L.recNode = recordBuild(ctx, L.rec, {prefix: 'rec', x: recX, y: recY, });
      L.boxes.record = L.recNode.box;
    }
    // chips under the stands, beside the inset, the alternative
    L.chipNodes = [];
    const chipAt = (c, x, y, name, st) => { const b = c.build(x, y, name, {opacity: 1, ...st}); L.chipNodes.push({key: c.it.key, node: b.node, box: b.box}); return b.box; };
    if (textOn) {
      L.chipBox = {};
      if (L.stackChips) {
        const cl = (x, w) => Math.max(zx, Math.min(zx + zoneWd - w, x));
        L.chipBox.laneA = chipAt(L.cB, cl(bx - L.cB.w / 2, L.cB.w), floorY + 14, 'lab-laneA');
        L.chipBox.laneB = chipAt(L.cA, cl(ax - L.cA.w / 2, L.cA.w), floorY + 14 + L.cB.h + 8, 'lab-laneB');
      } else {
        L.chipBox.laneA = chipAt(L.cB, bx - L.cB.w / 2, floorY + 14, 'lab-laneA');
        L.chipBox.laneB = chipAt(L.cA, ax - L.cA.w / 2, floorY + 14, 'lab-laneB');
      }
      // the detail chip sits left of the inset, or right of it when the left side has no room
      if (L.cD.w) {
        const gR = R * (p.focusElement === 'convergence' ? 1.27 : 1);
        const left = L.pos.convergence.x - gR - 12 - L.cD.w; // clear of the inset when it enlarges as the focus
        if (L.mode === 'band' && !L.bandGeo.chipLeft) L.chipBox.convergence = chipAt(L.cD, Math.max(MARGIN, L.pos.convergence.x - L.cD.w / 2), L.pos.convergence.y + gR + 10, 'lab-convergence');
        else {
          // left of the inset, else right of it; when neither side holds the chip, it is re-measured to the wider side
          // (more lines) so it never leaves the frame
          const right = L.pos.convergence.x + gR + 12;
          let c = L.cD, x = left >= MARGIN - 0.5 ? left : right;
          if (left < MARGIN - 0.5 && right + c.w > D.w - MARGIN + 0.5) {
            const roomL = L.pos.convergence.x - gR - 12 - MARGIN, roomR = D.w - MARGIN - right;
            const c2 = {it: c.it, ...iconChip(ctx, c.it, {size: L.size, maxW: Math.max(roomL, roomR), kind: 'ca', maxLines: 7})};
            if (c2.bad || c2.w > Math.max(roomL, roomR) + 0.5) L.labelClash = (L.labelClash || []).concat('convergence-chip');
            c = c2; x = roomL >= roomR ? L.pos.convergence.x - gR - 12 - c2.w : right;
          }
          L.chipBox.convergence = chipAt(c, x, L.pos.convergence.y - c.h / 2, 'lab-convergence');
        }
      }
      if (L.cAlt.w) L.chipBox.alternative = chipAt(L.cAlt, altX, altY, 'lab-alternative');
    }
    if (!textOn && L.cAlt.w) { L.chipBox = {alternative: chipAt(L.cAlt, altX, altY, 'lab-alternative')}; }
    if (L.chipBox && L.chipBox.alternative) L.boxes.alternative = L.chipBox.alternative;
    else if (p.elements.some(e => e.id === 'alternative')) L.boxes.alternative = {x: altX, y: altY, w: 60, h: 60};
    // connectors (anchored to the element boxes; the inset relation ends ON the altered spot)
    const spot = {x: ax + G.spot.x, y: baseY + G.spot.y};
    L.spot = spot;
    const cen = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    L.links = tx.rels.map((q, i) => {
      const A = L.boxes[q.from], B = L.boxes[q.to];
      if (!A || !B) return null;
      let from, to, bend = 0;
      const circ = () => null;
      const exitOf = (id, box, toward) => {
        const cc = circ(id);
        if (cc) { const a = Math.atan2(toward.y - cc.c.y, toward.x - cc.c.x); return {x: cc.c.x + cc.R * Math.cos(a), y: cc.c.y + cc.R * Math.sin(a)}; }
        return boxExit(box, toward, 10);
      };
      if ((L.mode === 'stack' || L.mode === 'band') && ((q.from === 'record' && (q.to === 'laneB' || q.to === 'laneA')) || (q.to === 'record' && (q.from === 'laneB' || q.from === 'laneA')))) {
        // record above the objects: a straight vertical link between the state and the record's bottom edge
        const oid = q.from === 'record' ? q.to : q.from;
        const ob = L.boxes[oid], rb = L.boxes.record;
        const x = Math.max(rb.x + 30, Math.min(rb.x + rb.w - 30, ob.x + ob.w / 2));
        const pe = {x, y: rb.y + rb.h + 10}, po = {x, y: ob.y - 10};
        if (q.from === 'record') { from = pe; to = po; } else { from = po; to = pe; }
      } else {
        from = exitOf(q.from, A, cen(B));
        to = exitOf(q.to, B, cen(A));
        bend = q.from === 'laneA' && q.to === 'laneB' ? 0 : 0.12 * (i % 2 ? -1 : 1);
      }
      // a connector never passes through a card or element it does not join (review 2026-09-27: the inset → alleged
      // link crossed the record card at 1:1): when the straight / default route does, bend it the least that clears
      // (the focus element is taken at its enlarged size: it grows while the tracer runs)
      const gk = p.focusElement === 'convergence' ? 1.25 : 1.12;
      const grownIf = (k, b) => (k === p.focusElement ? {x: b.x - b.w * (gk - 1) / 2 - 4, y: b.y - b.h * (gk - 1) / 2 - 4, w: b.w * gk + 8, h: b.h * gk + 8} : b);
      const foreign = [...Object.entries(L.boxes).filter(([k]) => k !== q.from && k !== q.to).map(([k, b]) => grownIf(k, b)),
        ...(L.chipBox ? Object.entries(L.chipBox).filter(([k]) => k !== q.from && k !== q.to).map(([, b]) => b) : [])];
      const hits = bd => {
        const dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
        const c = {x: (from.x + to.x) / 2 - (dy / len) * bd * len, y: (from.y + to.y) / 2 + (dx / len) * bd * len};
        for (let k = 1; k < 40; k++) {
          const t = k / 40, u0 = 1 - t;
          const x = u0 * u0 * from.x + 2 * u0 * t * c.x + t * t * to.x, y = u0 * u0 * from.y + 2 * u0 * t * c.y + t * t * to.y;
          if (foreign.some(b => x > b.x + 2 && x < b.x + b.w - 2 && y > b.y + 2 && y < b.y + b.h - 2)) return true;
        }
        return false;
      };
      if (hits(bend)) {
        const tries = [0.1, -0.1, 0.18, -0.18, 0.26, -0.26, 0.34, -0.34, 0.42, -0.42].map(v => bend + v);
        const ok = tries.find(bd => !hits(bd));
        if (ok !== undefined) bend = ok; else L.routeClash = true;
      }
      return {q, i, art: linkArt(ctx, {name: `lk${i}`, from, to, kind: q.kind, bend})};
    }).filter(Boolean);
    // relation labels: near each connector's middle, clear of every box, chip and other label
    // band (built before the relation labels: its chips are obstacles for them)
    L.bandNodes = [];
    if (L.band.sz.length) {
      const pl = flowRows(L.band.sz, {x: L.bandX ?? MARGIN, y: L.bandY, w: L.bandW ?? full, gap: 18, rowGap: 10, center: L.mode !== 'rowcol'}).placed;
      for (const q of pl) { const b = q.it.build(q.x, q.y, `band-${q.it.it.key}`); L.bandNodes.push({key: q.it.it.key, node: b.node, box: b.box}); }
    }
    if (L.leftBand && L.leftBand.sz.length) {
      const pl = flowRows(L.leftBand.sz, {x: MARGIN, y: L.leftBandY, w: L.leftW, gap: 18, rowGap: 10}).placed;
      for (const q of pl) { const b = q.it.build(q.x, q.y, `band-${q.it.it.key}`); L.bandNodes.push({key: q.it.it.key, node: b.node, box: b.box}); }
    }
    const obstacles = [...Object.values(L.boxes), ...(L.chipBox ? Object.values(L.chipBox) : [])];
    for (const b of L.bandNodes) obstacles.push({x: b.box.x - 6, y: b.box.y - 6, w: b.box.w + 12, h: b.box.h + 12});
    // the focus element enlarges (×1.25 for the inset, ×1.12 otherwise): labels keep clear of its grown box
    const fk = p.focusElement === 'convergence' ? 1.25 : 1.12;
    const scaledFocus = b => ({x: b.x - b.w * (fk - 1) / 2 - 4, y: b.y - b.h * (fk - 1) / 2 - 4, w: b.w * fk + 8, h: b.h * fk + 8});
    if (L.boxes[p.focusElement]) obstacles.push(scaledFocus(L.boxes[p.focusElement]));
    const placed = [];
    L.relLabels = [];
    const distTo = (lk, b) => { let best = Infinity; for (let s0 = 0; s0 <= 40; s0++) { const q = lk.art.at(s0 / 40); const dx = Math.max(b.x - q.x, 0, q.x - b.x - b.w), dy = Math.max(b.y - q.y, 0, q.y - b.y - b.h); best = Math.min(best, Math.hypot(dx, dy)); } return best; };
    if (ctx.show('all')) {
      for (const lk of L.links) {
        const size = L.size;
        const text0 = gp(tx.relText(lk.q));
        const textFor = (mw, ml) => unwidow(text0, t0 => chipG(ctx, t0, {x: 0, y: 0, maxWidth: mw, size, maxLines: ml}).fit);
        // a label sits ON its connector (the chip interrupts the line) or right beside it (≤ 8 units away), and is
        // nearer its own connector than any other; wide 2-line chips first, then narrower 3-line ones
        const mk = (t0, off, mw, ml) => {
          const m = lk.art.at(t0);
          const nx = -Math.sin(m.a), ny = Math.cos(m.a);
          const c = chipG(ctx, textFor(mw, ml), {x: 0, y: 0, maxWidth: mw, size, maxLines: ml});
          const ext = Math.abs(nx) * c.box.w / 2 + Math.abs(ny) * c.box.h / 2;
          const d = off * (ext + 8);
          return {x: m.x + nx * d - c.box.w / 2, y: m.y + ny * d - c.box.h / 2, w: c.box.w, h: c.box.h, t0, mw, ml, bad: c.fit.truncated || c.fit.broken};
        };
        let found = null;
        const inD = b => b.x >= 0 && b.y >= 0 && b.x + b.w <= D.w && b.y + b.h <= D.h;
        laneB: for (const [mw, ml] of [[Math.min(360, full / 2), 2], [Math.min(240, full / 3), 3], [Math.min(180, full / 3), 4], [Math.max(L.size * 7, 150), 3]]) {
          for (const t0 of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) {
            for (const off of [1, -1, 0]) {
              const cand = mk(t0, off, mw, ml);
              if (cand.bad || !inD(cand)) continue;
              if (obstacles.some(o => boxesMeet(cand, o, 6)) || placed.some(o => boxesMeet(cand, o, 8))) continue;
              // never over another connector, and nearer its own connector than any other
              const own = distTo(lk, cand);
              if (L.links.some(o => o !== lk && distTo(o, cand) <= Math.max(own, 4) + 4)) continue;
              found = cand; break laneB;
            }
          }
        }
        if (!found) { found = mk(0.5, 0, Math.min(360, full / 2), 2); L.labelClash = (L.labelClash || []).concat(lk.q.from + '>' + lk.q.to); }
        found.gap = distTo(lk, found);
        placed.push(found);
        const c = chipG(ctx, textFor(found.mw, found.ml), {x: found.x, y: found.y, maxWidth: found.mw, size: L.size, maxLines: found.ml, fill: th.card, stroke: ctx.theme.inkSoft});
        L.relLabels.push({i: lk.i, node: g({name: `lkl${lk.i}`, opacity: 0}, c.node), box: c.box, gap: found.gap});
      }
    }
    // tracer legs through the traversal order
    const order = p.traversalOrder.filter(id => L.boxes[id]);
    L.legs = [];
    for (let i = 1; i < order.length; i++) {
      const a = order[i - 1], b = order[i];
      const f = L.links.find(lk => lk.q.from === a && lk.q.to === b);
      const rv = L.links.find(lk => lk.q.from === b && lk.q.to === a);
      L.legs.push({a, b, link: f || rv || null, reverse: !f && Boolean(rv)});
    }
    L.order = order;
    // split start: every element starts at the middle of the objects zone
    L.center = {x: (bx + ax) / 2, y: baseY - OH / 2};
    L.art = {
      laneA: {node: miniField(ctx, {name: 'ob', H: OH, M, side: 'before'}), chip: null},
      laneB: {node: miniField(ctx, {name: 'oa', H: OH, M, side: 'after'}), chip: null},
    };
    L.M = M;
    L.tx = tx;
    // scale into the real box only in the reported fallback
    const Dr = ctx.design;
    L.k = Math.min(1, Dr.w / D.w, Dr.h / D.h);
    L.dx = (Dr.w - D.w * L.k) / 2;
    L.dy = (Dr.h - D.h * L.k) / 2;
    return L;
    };
    let pick = null, best = null;
    const cands = [];
    const why = [];
    const hMin = ctx.view.shape === 'portrait' ? 150 : 110;
    const v0 = ctx.view, fs0 = Math.min(v0.content.w / ctx.design.w, v0.content.h / ctx.design.h);
    const subj = q => q.OH * 1.32 * fs0 >= 0.205 * v0.height;
    for (let size = SH.size; size >= SH.minSize - 1e-9; size -= 1) {
      // (smaller sizes are tried only while no configuration yet keeps the ring pieces at the subject floor)
      if (best && size < Math.min(best.size - 3, 20) - 1e-9 && cands.some(subj)) break;
      // (kLeft never 1: the two ring keys — band chips 0 and 1 — stay together, at equal weight, in one place)
      for (const mode of SH.modes) for (const RW of SH.rws) for (const maxLines of [3, 4]) for (const half of [false, true]) for (const stackChips of [false, true]) for (const narrowSeq of [false, true]) for (const kLeft of mode === 'band' ? [0, 2, 3, 4].filter(k => k <= base.band.length) : [0]) for (const keyLeft of mode === 'band' ? [false, true] : [false]) {
        const X = compose(ctx, base, {mode, size, RW, maxLines, half, stackChips, narrowSeq, kLeft, keyLeft, hMin, dry: true});
        if (!X.cfg) { why.push(`${mode}/${RW}${stackChips ? "s" : ""}@${size}:${X.bad}${X.OH ? Math.round(X.OH) : ""}`); continue; }
        if (!best) best = X;
        cands.push(X);
        if (!pick || X.OH > pick.OH + 1e-6) pick = X;
      }
    }
    // try the configurations best first until one places every relation label beside its own connector: ring pieces at
    // the subject floor (piece + plinth >= 0.205 of the frame height) first, then text >= 20 (the 19.5 px baseline
    // floor), then the larger pieces
    // (when no configuration reaches the subject floor, the largest pieces win)
    const anySubj = cands.some(subj);
    const rank = q => [subj(q) ? 1 : 0, anySubj && q.size >= 20 - 1e-9 ? 1 : 0, q.OH];
    cands.sort((a, b) => { const x = rank(a), y = rank(b); return y[0] - x[0] || y[1] - x[1] || y[2] - x[2]; });
    let L = null;
    for (const X of cands.slice(0, 30)) {
      const Y = finish(compose(ctx, base, X.cfg), false);
      if (!Y.labelClash) { L = Y; break; }
      if (!L) L = Y;
    }
    if (L) return L;
    {
      for (let f = 1.1; f <= 4.01 && !L; f += 0.1) {
        const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
        for (const mode of SH.modes) {
          const X = compose(c2, base, {mode, size: SH.minSize, RW: SH.rws[SH.rws.length - 1], maxLines: 5, hMin: 60});
          if (X.OH && X.cB) { L = X; L.D = c2.design; break; }
        }
      }
    }
    return finish(L, true);
  },
  build(ctx, L) {
    const p = ctx.params;
    const th = ctx.theme;
    const OH = L.OH;
    const U = L.unitW;
    const stand = (id, x) => g({name: `st-${id}`},
      plinthArt(ctx, {x: x - U.pw / 2, top: L.floorY - OH * PLINTH, w: U.pw, floorY: L.floorY}));
    const pb = L.pos.laneA, pa = L.pos.laneB, pd = L.pos.convergence;
    // the convergence piece: the strip between the two supplied levels, lifted out of the laneB panel and enlarged
    const R = L.Rin;
    const inset = g({name: 'el-convergence', transform: T(pd.x, pd.y)}, boundaryPiece(ctx, {R, M: L.M}));
    const referenceG = g({name: 'el-laneA', transform: T(pb.x, pb.y)}, L.art.laneA.node);
    const allegedG = g({name: 'el-laneB', transform: T(pa.x, pa.y)}, L.art.laneB.node, L.art.laneB.chip);
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      g({name: 'stands'}, stand('laneA', pb.x), stand('laneB', pa.x)),
      L.links.map(lk => g({'data-link': `${lk.q.from}>${lk.q.to}`}, lk.art.node)),
      g({name: 'el-record'}, L.recNode ? L.recNode.node : null),
      allegedG,
      referenceG,
      inset,
      g({name: 'chips'}, L.chipNodes.map(c => g({name: `el-lab-${c.key}`}, c.node))),
      L.relLabels.map(q => q.node),
      tracerArt(ctx, 'tracer'),
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const sp = ease.inOutCubic(seg(u, ...W.split));
    // separate: every element starts at the zone centre (scaled down) and slides to its place
    const place = (id, pos, s0) => {
      const x = lerp(L.center.x, pos.x, sp), y = lerp(L.center.y + (id === 'convergence' ? 0 : L.OH / 2), pos.y, sp);
      return {x, y, s: lerp(s0, 1, sp)};
    };
    const focus = p.focusElement;
    const fs = id => (id === focus ? 1 + (id === 'convergence' ? 0.25 : 0.12) * (ease.inOutQuad(seg(u, ...W.focusIn)) - ease.inOutQuad(seg(u, ...W.focusOut))) : 1);
    const qb = place('laneA', L.pos.laneA, 0.85), qa = place('laneB', L.pos.laneB, 0.85), qd = place('convergence', L.pos.convergence, 0.2);
    const tr = (q, id, box) => {
      const f = fs(id);
      const s = q.s * f;
      if (!box || f === 1) return T(q.x, q.y, 0, s);
      // focus scaling about the element's centre
      const cy = box.y + box.h / 2 - (id === 'convergence' ? L.pos.convergence.y : L.pos[id].y);
      return `${T(q.x, q.y + cy)} scale(${r(s, 4)}) ${T(0, -cy)}`;
    };
    nodes['el-laneA'] = {transform: tr(qb, 'laneA', L.boxes.laneA)};
    nodes['el-laneB'] = {transform: tr(qa, 'laneB', L.boxes.laneB)};
    // the inset opens in place once the two states have separated
    const dOpen = ease.outCubic(seg(u, 0.12, 0.18));
    nodes['el-convergence'] = {transform: tr({x: L.pos.convergence.x, y: L.pos.convergence.y, s: lerp(0.3, 1, dOpen)}, 'convergence', L.boxes.convergence), opacity: r(dOpen > 0 ? 1 : 0, 3)};
    // the after state's fallen chip only shows once the two states have moved apart (nothing of the after state
    // shows while they still overlap)
    if (L.art.laneB.chip) nodes['oa-chip'] = {opacity: r(seg(sp, 0.6, 1), 3)};
    // the two equal stands wait in place from the first frame; the column separates onto them
    nodes.stands = {opacity: 1};
    // the record is in view from the first frame (it slides a short way out from the zone centre); the chips appear
    // once everything is placed
    const rb = L.boxes.record;
    if (rb) {
      const dx = (L.center.x - (rb.x + rb.w / 2)) * (1 - sp) * 0.25, dy = 0;
      const f = fs('record');
      const cx = rb.x + rb.w / 2, cy = rb.y + rb.h / 2;
      nodes['el-record'] = {transform: `${T(dx, dy)} ${f !== 1 ? `translate(${r(cx)} ${r(cy)}) scale(${r(f, 4)}) translate(${r(-cx)} ${r(-cy)})` : ''}`.trim(), opacity: 1};
    }
    const lab = seg(u, ...W.labels);
    nodes.chips = {opacity: r(lab, 3)};
    for (const c of L.chipNodes) {
      const f = fs(c.key);
      const b = L.boxes[c.key];
      if (c.key === 'alternative') {
        const cx = c.box.x + c.box.w / 2, cy = c.box.y + c.box.h / 2;
        nodes[`el-lab-${c.key}`] = {transform: f !== 1 ? `translate(${r(cx)} ${r(cy)}) scale(${r(f, 4)}) translate(${r(-cx)} ${r(-cy)})` : T(0, 0)};
      } else nodes[`el-lab-${c.key}`] = {transform: T(0, 0)};
      void b;
    }
    // connectors draw one after another, each label once its line has arrived
    const n = L.links.length;
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, n);
    L.links.forEach((lk, j) => {
      const pr = ease.inOutQuad(seg(u, W.relate[0] + j * span, W.relate[0] + (j + 0.8) * span));
      Object.assign(nodes, lk.art.frame(pr));
      nodes[`lk${lk.i}`] = {opacity: 1};
    });
    for (const q of L.relLabels) {
      const j = L.links.findIndex(lk => lk.i === q.i);
      nodes[`lkl${q.i}`] = {opacity: r(seg(u, W.relate[0] + (j + 0.7) * span, W.relate[0] + (j + 1) * span), 3)};
    }
    // tracer
    const legs = L.legs;
    let tpos = null, tOp = 0, leg = -1;
    const trU = seg(u, ...W.trace);
    if (legs.length && u >= W.trace[0] && u <= W.trace[1] + 0.02) {
      const f = Math.min(legs.length - 1e-9, trU * legs.length);
      leg = Math.floor(f);
      const lf = ease.inOutQuad(f - leg);
      const lg = legs[leg];
      if (lg.link) {
        // a leg that starts where the previous one did not end first crosses its element to this connector's start
        const prev = leg > 0 && legs[leg - 1].link ? legs[leg - 1].link.art.at(legs[leg - 1].reverse ? 0 : 1) : null;
        const st = lg.link.art.at(lg.reverse ? 1 : 0);
        const hop = prev && Math.hypot(prev.x - st.x, prev.y - st.y) > 2 ? 0.25 : 0;
        if (lf < hop) {
          const k = ease.inOutQuad(lf / hop);
          tpos = {x: lerp(prev.x, st.x, k), y: lerp(prev.y, st.y, k)};
        } else {
          const f2 = hop ? (lf - hop) / (1 - hop) : lf;
          const pt = lg.link.art.at(lg.reverse ? 1 - f2 : f2);
          tpos = {x: pt.x, y: pt.y};
        }
        tOp = 1;
      } else {
        const ca = L.boxes[lg.a], cb = L.boxes[lg.b];
        tpos = lf < 0.5 ? {x: ca.x + ca.w / 2, y: ca.y + ca.h / 2} : {x: cb.x + cb.w / 2, y: cb.y + cb.h / 2};
        tOp = Math.abs(lf - 0.5) * 2;
      }
      tOp *= clamp(1 - seg(u, W.trace[1], W.trace[1] + 0.02));
    }
    if (!tpos) {
      const first = legs[0];
      const q = first && first.link ? first.link.art.at(first.reverse ? 1 : 0) : L.center;
      const last = legs[legs.length - 1];
      const e = last && last.link ? last.link.art.at(last.reverse ? 0 : 1) : q;
      tpos = u < W.trace[0] ? {x: q.x, y: q.y} : {x: e.x, y: e.y};
    }
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: r(tOp, 3)};
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.key === 'key' ? seg(u, ...W.key) : seg(u, ...W.band), 3)};
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'hold',
      split: r(sp, 3),
      laneA: {x: r(qb.x), y: r(qb.y)}, laneB: {x: r(qa.x), y: r(qa.y)}, convergence: {x: r(qd.x), y: r(qd.y)},
      tracer: {x: r(tpos.x), y: r(tpos.y)}, tracerOn: r(tOp, 3), leg,
      legs: legs.map(lg => `${lg.a}>${lg.b}:${lg.link ? lg.link.q.kind : 'none'}`),
      drawn: L.links.map(lk => r(ease.inOutQuad(seg(u, W.relate[0] + L.links.indexOf(lk) * span, W.relate[0] + (L.links.indexOf(lk) + 0.8) * span)), 3)),
      kinds: L.links.map(lk => lk.q.kind),
      arrows: L.links.map(lk => lk.q.kind !== 'relation'),
      causalShown: L.links.some(lk => lk.q.kind === 'causal'),
      linkEnds: L.links.map(lk => ({from: lk.q.from, to: lk.q.to, a: {x: r(lk.art.from.x), y: r(lk.art.from.y)}, b: {x: r(lk.art.to.x), y: r(lk.art.to.y)}})),
      boxes: Object.fromEntries(Object.entries(L.boxes).map(([k, b]) => [k, {x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)}])),
      spot: {x: r(L.spot.x), y: r(L.spot.y)},
      focus: r(fs(p.focusElement), 3),
      keyShown: seg(u, ...W.key) >= 1,
      labelClash: L.labelClash || false,
      routeClash: L.routeClash || false,
      labelGaps: (L.relLabels || []).map(q => r(q.gap, 1)),
      layout: {OH: r(L.OH), size: r(L.size), k: r(L.k, 3), fallback: L.fallback, mode: L.mode, why: L.why, recH: r(L.recH), bandH: r(L.bandH), relH: r(L.relH), chipsH: r(L.chipsH), altH: r(L.cAlt.h), TB: L.bandGeo ? r(L.bandGeo.TB) : null},
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-09-mechanism',
    title: 'Affected person\'s contribution — the record, lane A, lane B and the convergence piece taken apart and related as supplied',
    titleEs: 'Contribución de la persona afectada — Mecanismo o relación explicada',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Contribución de la persona afectada',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A fictional slab with two parallel lanes comes apart into its pieces: lane A (conduct of A, ● trolley, its supplied steps) and lane B (conduct of B, the affected person, ◆ trolley, its supplied steps) on equal plinths at equal size and weight, and the convergence piece — both lane ends, their barriers and the two connectors to the event — lifted out and enlarged. Only the supplied relationships are drawn with their kind (plain relation by default; causal only when supplied); a tracer follows the traversal order while the focus element enlarges. Nothing is weighed, shared out or decided.',
    tags: ['causation', 'affected person', 'mechanism', 'exploded view', 'parallel lanes', 'convergence as supplied', 'equal weight', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/contribucion-afectada.js', 'src/animations/causation/kits/dano-material.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/prueba-contrafactual.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
