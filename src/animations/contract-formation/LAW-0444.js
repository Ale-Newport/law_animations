/**
 * LAW-0444 — Oferta comunicada · inspect
 *
 * Storyboard:
 *  0.00–0.20  context: the offeree (B) holds the opened offer that arrived
 *             along the dotted route; a small "computed" note hangs from the
 *             sheet showing quantity × unit price = total (arithmetic on the
 *             supplied values only; it is not part of the offer text).
 *  0.20–0.45  isolate: a lens lifts a REAL copy of the pricing rows + note
 *             (same coordinates as the context) into an enlarged window; the
 *             old datum is named in a chip.
 *  0.45–0.75  substitute: inside the lens the focused term changes
 *             (before → after, old value struck through but still visible);
 *             only its dependent line — the computed total — updates.
 *  0.75–1.00  return: the lens folds back onto its source, the context
 *             sheet now shows the new datum and a "datum changed" marker.
 * The lens dims the whole frame (no inner box); the before → after chips (label
 * on top, value on its own line, so a long label never hides the value) sit
 * under the lens, stacked beside it, or — in 9:16 — above it, whichever is
 * clear of the actors, the held sheet and the name chips. The strike runs
 * through the old value; the arrow appears with the new value it points at.
 * 9:16 keeps the whole context (A, the route, B) as stacked places, so the
 * final hold still shows where the offer came from. Long names wrap on
 * two-line chips.
 * Seeking back before the substitution restores the old datum exactly.
 * No acceptance, validity or outcome is stated.
 * @module animations/contract-formation/LAW-0444
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, r, clamp} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, caption, textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {offerFields, TERM_KEYS} from './kits/offer-fields.js';
import {offerStage, offerSheet, parseAmount, formatAmount} from './kits/offer-letter.js';

const ID = 'LAW-0444';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  route: [0.0, 0.1], ctxCaption: [0.03, 0.12], note: [0.1, 0.17], open: [0.22, 0.4], before: [0.36, 0.44],
  strike: [0.47, 0.53], change: [0.5, 0.6], dependent: [0.58, 0.68], arrow: [0.64, 0.7], after: [0.64, 0.71],
  close: [0.76, 0.86], ctxUpdate: [0.845, 0.9], marker: [0.9, 0.96],
};

const STRINGS = {
  en: {from: 'From', to: 'To', computed: 'computed', noDependent: 'No dependent line'},
  es: {from: 'De', to: 'Para', computed: 'calculado', noDependent: 'Sin línea dependiente'},
};

const sceneSchema = {
  ...offerFields,
  ...inspectFields(TERM_KEYS),
};
sceneSchema.focusTarget = {...sceneSchema.focusTarget, description: 'Term (by role) that is enlarged and substituted; its displayed value becomes beforeValue, then afterValue. quantity/unitPrice also update the computed total'};

const defaultParams = {
  parties: [{name: 'Nadia Park', role: 'Party A'}, {name: 'Tomás Ribeiro', role: 'Party B'}],
  offer: {reference: 'OF-2041', title: 'Offer to supply'},
  terms: [
    {key: 'item', label: 'Item', value: 'Oak office chairs'},
    {key: 'delivery', label: 'Delivery', value: 'Day 10'},
    {key: 'quantity', label: 'Quantity', value: '40'},
    {key: 'unitPrice', label: 'Unit price (hypothetical)', value: '130'},
  ],
  focusTarget: 'unitPrice',
  beforeValue: '130',
  afterValue: '120',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Offer received by Party B', marker: 'Datum changed'},
};

/**
 * Context stage + lens placement per shape (design units).
 * 9:16 stacks the two places like the story (LAW-0441): A (top-left, facing +x) and the route
 * descending to B (bottom-right, facing −x) who holds the opened offer; during the inspect the
 * lens opens in the column right of A (A and A's name stay uncovered) with the before → after
 * chips above it ('stack').
 */
const PLACES = {
  landscape: {k: 1.3, A: 0.06, B: 0.86, lens: 'left'},
  square: {k: 1.2, A: 0.08, B: 0.84, lens: 'top'},
  portrait: {k: 1.2, A: 0.18, B: 0.78, lens: 'stack'},
};
/** Height of a standing figure above its floor point (rig units, hair included). */
const FIG_H = 440;

const scene = {
  sizes: {landscape: [1600, 960], square: [1300, 1150], portrait: [900, 1460]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const Pl = PLACES[shape];
    const k = Pl.k;
    const capH = 64;
    const portrait = shape === 'portrait';

    // focused term (falls back to the first row if the role is absent)
    let fi = p.terms.findIndex(t => t.key === p.focusTarget);
    if (fi < 0) fi = 0;
    const termsBefore = p.terms.map((t, i) => (i === fi ? {...t, value: p.beforeValue} : t));
    const valueOf = (key, which) => {
      const i = p.terms.findIndex(t => t.key === key);
      if (i < 0) return null;
      if (i === fi) return which === 'after' ? p.afterValue : p.beforeValue;
      return p.terms[i].value;
    };
    const q0 = valueOf('quantity', 'before'), q1 = valueOf('quantity', 'after');
    const u0 = valueOf('unitPrice', 'before'), u1 = valueOf('unitPrice', 'after');
    const tot = (q, u) => (q !== null && u !== null && Number.isFinite(parseAmount(q)) && Number.isFinite(parseAmount(u)) ? parseAmount(q) * parseAmount(u) : null);
    const total0 = tot(q0, u0), total1 = tot(q1, u1);
    const hasTotal = total0 !== null && total1 !== null;
    const dependent = hasTotal && (p.terms[fi].key === 'quantity' || p.terms[fi].key === 'unitPrice');

    // before → after annotation chips: the term's label on top and its value on its own bold line,
    // so a long label can never push the value out of the chip (built once here for its height)
    const annOn = ctx.show('key');
    const label = p.terms[fi].label;
    const annChip = (which, x, y, anchor, maxWidth) => valueChip(ctx, which === 'before'
      ? {label, value: p.beforeValue, x, y, anchor, maxWidth, fill: th.card, stroke: th.ink, valueColor: th.ink, name: 'ann-before'}
      : {label, value: p.afterValue, x, y, anchor, maxWidth, fill: th.accent2Soft, stroke: th.accent2, valueColor: th.accent2, name: 'ann-after'});
    const stackAnnW = Math.min(440, (D.w - 76) / 2);
    const annH = annOn ? Math.max(annChip('before', 0, 0, 'start', stackAnnW).box.h, annChip('after', 0, 0, 'start', stackAnnW).box.h) : 0;

    // context stage: B holds the opened offer; A stands where it came from, the route between them.
    // Name chips wrap onto two lines instead of being cut; the floor rises to make room.
    const names = [p.parties[0].name, p.parties[1].name];
    const twoLineNames = annOn && names.some(nm => chip(ctx, nm, {x: 0, y: 0, maxWidth: 360, size: 28, maxLines: 1}).fit.truncated);
    const lift2 = twoLineNames ? 34 : 0;
    // 9:16: A's place is the upper room; A's head stays clear of the before → after chips at the top
    const floorA = portrait ? clamp(capH + 12 + annH + 24 + FIG_H * k, 740, 800) : D.h - 96 - lift2;
    const floorB = portrait ? D.h - 80 - lift2 : D.h - 96 - lift2;
    const ptA = {x: Math.max(60, D.w * Pl.A), floor: floorA, facing: 1};
    const ptB = {x: D.w * Pl.B, floor: floorB, facing: -1};
    const base = {
      prefix: 'ctx', k, parties: p.parties, offer: p.offer, terms: termsBefore, mailerLabel: '',
      A: ptA, B: ptB,
      sheetAlt: {index: fi, value: p.afterValue}, sheetLabels: {from: ctx.t.from, to: ctx.t.to},
      captions: names, chipSize: 28, chipMax: 360, chipLines: twoLineNames ? 2 : 1, width: D.w,
      apexLift: 300,
    };
    let stage = offerStage(ctx, base);
    if (portrait) {
      // the route descends from A's place in a gentle S, between A's name and B's head, into the sheet
      const a = stage.launchC, b = stage.catchC;
      stage = offerStage(ctx, {...base, route: {c1: {x: a.x + 190, y: a.y + 130}, c2: {x: b.x + 70, y: b.y - 280}}});
    }
    const sheet = stage.sheet;
    const hc = stage.heldCenterB;
    const sw = stage.sw;
    const ph = sheet.ph;

    // computed-total note hanging from the bottom edge of the sheet (drawn in sheet coordinates)
    const noteW = sw * 0.66, noteH = ph * 0.58;
    const noteBox = {x: -sw / 2 + sw * 0.08, y: 1.5 * ph + 4, w: noteW, h: noteH};
    const noteNode = prefix => computedNote(ctx, prefix, noteBox, {q0, q1, u0, u1, total0, total1, locale: p.locale});

    // source region: from the focused row (or the quantity row, whichever is higher) down to the note
    const rows = sheet.rows;
    const qi = p.terms.findIndex(t => t.key === 'quantity');
    const top = dependent ? Math.min(rows[fi].box.y, qi >= 0 ? rows[qi].box.y : rows[fi].box.y) : rows[fi].box.y;
    const bottom = dependent ? noteBox.y + noteBox.h : rows[fi].box.y + rows[fi].box.h;
    const region = {x: -sw / 2 - 10, y: top - 8, w: sw + 20, h: bottom - top + 16};
    const source = {x: hc.x + region.x, y: hc.y + region.y, w: region.w, h: region.h};

    // lens destination
    const zoom = p.detailGeometry.zoom;
    const ratio = source.h / source.w;
    const destFor = placement => {
      if (placement === 'stack') {
        // 9:16: the window opens in the column right of A's place (A and A's name stay uncovered,
        // also while the window travels up from the sheet), under the before → after chips and
        // above B's head
        const top = capH + 12 + (annH ? annH + 24 : 8);
        const aRight = Math.max(ptA.x + 72 * k, ...(annOn && stage.chips.length > 1 ? [stage.chips[0].box.x + stage.chips[0].box.w] : []));
        const x0 = aRight + 30;
        const bottom = ptB.floor - FIG_H * k - 24;
        const w = Math.min(D.w - 20 - x0, source.w * zoom, (bottom - top) / ratio);
        return {x: Math.max(x0, Math.min(D.w - 20 - w, source.x + source.w / 2 - w / 2)), y: top, w, h: w * ratio, mode: 'stack'};
      }
      if (placement === 'bottom' || placement === 'top') {
        const maxW = D.w - 60;
        const maxH = placement === 'bottom' ? D.h - (hc.y + stage.sh / 2 + noteH) - 190 : Math.max(200, source.y - capH - 150);
        const w = Math.min(maxW, source.w * zoom, maxH / ratio);
        let w2 = w;
        let y = placement === 'bottom' ? D.h - 160 - w * ratio : capH + 20;
        if (placement === 'bottom') {
          // the window stays clear of the name chips (never half-covers one)
          const chipBottom = Math.max(0, ...stage.chips.map(c => c.box.y + c.box.h));
          if (y < chipBottom + 24) {
            y = chipBottom + 24;
            w2 = Math.min(w, (D.h - 150 - y) / ratio);
          }
        }
        const d = {x: (D.w - w2) / 2 - (placement === 'top' ? D.w * 0.12 : 0), y, w: w2, h: w2 * ratio, mode: placement};
        d.x = Math.max(20, Math.min(D.w - 20 - w, d.x));
        return d;
      }
      const right = placement === 'right';
      // on the left the lens stays between the offeror's figure and the source (never over A)
      const leftBound = ptA.x + 72 * k + 30;
      const maxW = right ? D.w - (source.x + source.w) - 80 : source.x - 90 - leftBound;
      const w = Math.min(maxW, source.w * zoom, (D.h - capH - 200) / ratio);
      return {x: right ? D.w - 30 - w : Math.max(leftBound, source.x - 90 - w), y: capH + 30, w, h: w * ratio, mode: placement};
    };
    // a requested placement that leaves no room for a real enlargement falls back to the shape's own
    const asked = p.detailGeometry.placement === 'auto' ? Pl.lens : (portrait && p.detailGeometry.placement === 'top' ? 'stack' : p.detailGeometry.placement);
    let dest = destFor(asked);
    if (!(dest.w >= source.w * 1.4) && asked !== Pl.lens) dest = destFor(Pl.lens);

    // lens content: a second, real copy of the sheet + note at the same coordinates
    const copy = offerSheet(ctx, {prefix: 'lens-sheet', w: sw, h: stage.sh, offer: p.offer, from: p.parties[0].name, to: p.parties[1].name, terms: termsBefore, showText: ctx.show('all'), labels: {from: ctx.t.from, to: ctx.t.to}, alt: {index: fi, value: p.afterValue}});
    // in the lens the old value stays (struck through) and the new value appears beside it
    const rowF = rows[fi];
    const vs = rowF.valueSize;
    const showText = ctx.show('all');
    // with labels hidden the value is a bar (same width rule as offerSheet) and the substitution
    // is shown as a coloured bar, so the change still reads
    const padS = sw * 0.075, innerS = sw - padS * 2;
    const barW = innerS * (0.5 + 0.35 * ctx.rng('offer-bar', fi));
    const oldW = showText ? ctx.measure(p.beforeValue, vs, 700, 'sans') : barW;
    const newFit = ctx.fit(p.afterValue, {maxWidth: rowF.value.w, size: vs, minSize: vs * 0.66, maxLines: 1, weight: 700});
    const newW = showText ? newFit.width : barW * 0.7;
    // text: new value beside the struck old one (or just below when there is no room);
    // bars: a thin corrected bar right under the struck old bar, inside the same row
    const beside = showText && oldW + 50 + newW <= rowF.value.w;
    const newX = beside ? rowF.value.x + oldW + 50 : rowF.value.x;
    const newY = beside ? rowF.value.y : rowF.value.y + vs * (showText ? 1.05 : 0.74);
    const lensNew = g({name: 'lens-new', opacity: 0},
      beside ? h('path', {d: `M${r(rowF.value.x + oldW + 12)} ${r(rowF.value.y + vs * 0.45)}h24m-9 -8l9 8l-9 8`, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}) : null,
      showText ? textBlock(newFit, {x: newX, y: newY, fill: th.accent2}) : h('rect', {x: newX, y: newY + 2, width: newW, height: vs * 0.42, rx: 3, fill: th.accent2}));
    const ctxNewBar = showText ? null : h('rect', {name: 'ctx-newbar', x: hc.x + rowF.value.x, y: hc.y + rowF.value.y + 2, width: barW, height: vs * 0.6, rx: 4, fill: th.accent2, opacity: 0});
    const lensContent = g({transform: T(hc.x, hc.y)}, copy.node, hasTotal ? noteNode('lens') : null, strikeLine(ctx, 'lens', rowF, Math.min(oldW + 10, sw)), lensNew);
    // the dimming covers the whole frame (no hard-edged grey box inside it)
    const frameBox = {x: -4000, y: -4000, w: D.w + 8000, h: D.h + 8000};
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: frameBox, color: th.accent});

    // single editorial annotation: before → after chips next to the lens (old value kept visible),
    // above it (9:16 stack), side by side under it or stacked beside it — whichever layout is clear
    // of the actors, the held sheet, the name chips and the lens window
    const figure = pt => ({x: pt.x - 72 * k, y: pt.floor - FIG_H * k, w: 144 * k, h: FIG_H * k});
    const annObs = [
      figure(ptB),
      figure(ptA),
      {x: hc.x - sw / 2 - 8, y: hc.y - stage.sh / 2 - 8, w: sw + 16, h: stage.sh + (hasTotal ? noteH + 12 : 0) + 16},
      ...stage.chips.map(c => c.box),
      dest,
    ];
    let ann = null;
    if (annOn) {
      const mkPair = mode => {
        if (mode === 'above' || mode === 'below') {
          // side by side, centred on the lens (as far as the frame allows); the arrow joins the two values
          const half = mode === 'above' ? stackAnnW : Math.max(260, Math.min(dest.w / 2, 480)) - 30;
          const b0 = annChip('before', 0, 0, 'end', half), a0 = annChip('after', 0, 0, 'start', half);
          const hh = Math.max(b0.box.h, a0.box.h);
          const cx = clamp(dest.x + dest.w / 2, 8 + b0.box.w + 30, D.w - 8 - a0.box.w - 30);
          const y = mode === 'above' ? dest.y - 24 - hh : dest.y + dest.h + 26;
          const b = annChip('before', cx - 30, y, 'end', half);
          const a = annChip('after', cx + 30, y, 'start', half);
          const ay = b.valueLines[0].cy;
          return {b, a, arrow: `M${r(cx - 17)} ${r(ay)}h32m-10 -9l10 9l-10 9`};
        }
        // stacked beside the lens; the arrow points down from the old value to the new one
        const x = mode === 'right' ? dest.x + dest.w + 30 : dest.x - 30;
        const anchor = mode === 'right' ? 'start' : 'end';
        const maxWidth = Math.min(460, mode === 'right' ? D.w - 16 - x : x - 16);
        if (maxWidth < 200) return null;
        const b = annChip('before', x, dest.y + 6, anchor, maxWidth);
        const a = annChip('after', x, b.box.y + b.box.h + 50, anchor, maxWidth);
        const ax = mode === 'right' ? x + 40 : x - 40;
        const y0 = b.box.y + b.box.h + 10, y1 = a.box.y - 10;
        return {b, a, arrow: `M${r(ax)} ${r(y0)}V${r(y1)}m-9 -10l9 10l9 -10`};
      };
      const clear = pr => pr && [pr.b.box, pr.a.box].every(bx => bx.x >= 8 && bx.y >= capH && bx.x + bx.w <= D.w - 8 && bx.y + bx.h <= D.h - 8
        && !annObs.some(o => o.x < bx.x + bx.w + 6 && o.x + o.w + 6 > bx.x && o.y < bx.y + bx.h + 6 && o.y + o.h + 6 > bx.y));
      const pairs = (dest.mode === 'stack' ? ['above', 'below'] : ['below', 'right', 'left']).map(mkPair);
      ann = pairs.find(clear) || pairs[0];
    }
    const beforeChip = ann && ann.b, afterChip = ann && ann.a;
    // the strike runs through the old VALUE (one stroke per value line), not through the label
    const strikeLens = beforeChip ? beforeChip.valueLines.map(ln => ln.w + 12) : [];
    const strikes = beforeChip ? beforeChip.valueLines.map((ln, i) => h('line', {name: `ann-strike-${i}`, x1: r(ln.x - 6), x2: r(ln.x + ln.w + 6), y1: r(ln.cy), y2: r(ln.cy), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(strikeLens[i])} ${r(strikeLens[i] + 10)}`, 'stroke-dashoffset': r(strikeLens[i]), opacity: 0})) : null;
    const ctxCap = ctx.show('all') ? caption(ctx, `${ctx.t.context}: ${p.contextLabels.context}`, {x: 20, y: 8, maxWidth: D.w - 40, size: 36, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;

    // changed-datum marker pinned to the context row
    const rowC = rows[fi];
    const mk = {x: hc.x - sw / 2 - 4, y: hc.y + rowC.value.y + rowC.value.h / 2};
    let markChip = null;
    let markLead = null;
    if (annOn) {
      // marker label on top, "old → new" on its own line (the values are never wrapped apart)
      const markOpts = (x, y, anchor, maxWidth) => ({label: p.contextLabels.marker, value: `${p.beforeValue} → ${p.afterValue}`, x, y, anchor, maxWidth, labelSize: 23, valueSize: 29, fill: th.card, stroke: th.accent2, valueColor: th.ink});
      if (mk.x - 40 >= 260) {
        // beside the sheet's free edge, centred on the marker (9:16: between the sheet and the left
        // margin, below A's name)
        const mw = Math.min(460, mk.x - 40);
        const hh = valueChip(ctx, markOpts(0, 0, 'end', mw)).box.h;
        markChip = valueChip(ctx, markOpts(mk.x - 30, mk.y - hh / 2, 'end', mw));
      } else {
        // too little room beside the sheet: the chip hangs below the sheet and note, left of
        // B's name, on a leader dropped from the marker
        const below = hc.y + (hasTotal ? noteBox.y + noteBox.h : 1.5 * ph) + 24;
        markChip = valueChip(ctx, markOpts(20, below, 'start', Math.min(480, ptB.x - 110)));
        const lx = clamp(mk.x, markChip.box.x + 16, markChip.box.x + markChip.box.w - 16);
        markLead = h('path', {d: `M${r(mk.x)} ${r(mk.y + 20)}V${r(markChip.box.y - 12)}L${r(lx)} ${r(markChip.box.y)}`, fill: 'none', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round'});
      }
    }
    const marker = g({name: 'marker', opacity: 0},
      markLead,
      h('circle', {cx: mk.x, cy: mk.y, r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );

    return {stage, hc, noteNode, hasTotal, dependent, fi, source, dest, L2, ctxNewBar, strikeLen: Math.min(oldW + 10, sw), beforeChip, afterChip, annArrow: ann && ann.arrow, strikes, strikeLens, ctxCap, marker, total0, total1};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.ctxCap && L.ctxCap.node,
      L.stage.node,
      L.hasTotal ? g({transform: T(L.hc.x, L.hc.y)}, L.noteNode('ctx')) : null,
      L.ctxNewBar,
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strikes,
        // the arrow only appears with the new value it points at
        h('path', {name: 'ann-arrow', d: L.annArrow, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    // context: the received, opened offer held by B (the result of the story action)
    const posed = L.stage.pose({fold: 1, seal: 1, windup: 1, launch: 1, travel: s('route'), returnA: 1, reach: 1, bring: 1, open: 1, unfold: 1, headB: 9});
    const nodes = posed.nodes;
    // lens open / close
    const open = ease.inOutCubic(s('open'));
    const close = ease.inOutCubic(s('close'));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // substitution inside the lens, then in the context
    const change = ease.inOutSine(s('change'));
    const dep = L.dependent ? ease.inOutSine(s('dependent')) : 0;
    const ctxUpd = s('ctxUpdate');
    // a datum is replaced in two halves (old slides out, then new slides in): the two values
    // are never superimposed at the same place
    const halves = pr => [clamp(pr / 0.5), clamp((pr - 0.5) / 0.5)];
    const swap = (prefix, pr) => {
      if (!ctx.show('all')) return;
      const [out, inn] = halves(pr);
      nodes[`${prefix}-val-${L.fi}-a`] = {opacity: r(1 - out, 3), transform: out > 0 && out < 1 ? T(0, -10 * out) : ''};
      nodes[`${prefix}-val-${L.fi}-b`] = {opacity: r(inn, 3), transform: inn > 0 && inn < 1 ? T(0, 10 * (1 - inn)) : ''};
    };
    swap('ctx-sheet', ctxUpd);
    // the old value stays traceable in the lens: struck through and dimmed, never erased
    if (ctx.show('all')) nodes[`lens-sheet-val-${L.fi}-a`] = {opacity: r(1 - 0.45 * s('strike'), 3)};
    nodes['lens-new'] = {opacity: r(change, 3), transform: change > 0 && change < 1 ? T(0, 8 * (1 - change)) : ''};
    if (L.ctxNewBar) nodes['ctx-newbar'] = {opacity: r(ctxUpd, 3)};
    nodes['lens-strike'] = {opacity: s('strike') > 0 ? 1 : 0, 'stroke-dashoffset': r(L.strikeLen * (1 - s('strike')))};
    if (L.hasTotal) {
      const totSwap = (prefix, pr) => {
        const [out, inn] = halves(pr);
        nodes[`${prefix}-note`] = {opacity: r(s('note'), 3)};
        nodes[`${prefix}-t0`] = {opacity: r((ctx.show('all') ? 1 : 0.7) * (1 - out), 3), transform: out > 0 && out < 1 ? T(0, -6 * out) : ''};
        nodes[`${prefix}-t1`] = {opacity: r(inn, 3), transform: inn > 0 && inn < 1 ? T(0, 6 * (1 - inn)) : ''};
      };
      totSwap('lens', dep);
      totSwap('ctx', L.dependent ? ctxUpd : 0);
    }
    if (L.beforeChip) {
      // the single annotation leaves before the lens folds back (the marker then carries before → after)
      nodes.ann = {opacity: u >= W.before[0] ? r(1 - seg(u, 0.73, 0.765), 3) : 0};
      nodes['ann-before'] = {opacity: r(s('before') * (1 - 0.45 * s('strike')), 3)};
      const st = s('strike'), n = L.strikeLens.length;
      L.strikeLens.forEach((len, i) => {
        const q = clamp(st * n - i);
        nodes[`ann-strike-${i}`] = {opacity: q > 0 ? 1 : 0, 'stroke-dashoffset': r(len * (1 - q))};
      });
      nodes['ann-arrow'] = {opacity: r(s('arrow'), 3)};
      nodes['ann-after'] = {opacity: r(s('after'), 3)};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(s('ctxCaption'), 3)};
    nodes.marker = {opacity: r(s('marker'), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const p = ctx.params;
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        lensValue: change >= 1 ? p.afterValue : change > 0 ? 'changing' : p.beforeValue,
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        contextValue: ctxUpd >= 1 ? p.afterValue : ctxUpd > 0 ? 'changing' : p.beforeValue,
        dependent: L.dependent,
        lensTotal: L.dependent ? (dep >= 1 ? L.total1 : dep > 0 ? 'changing' : L.total0) : L.total0,
        contextTotal: L.hasTotal ? (L.dependent && ctxUpd >= 1 ? L.total1 : L.dependent && ctxUpd > 0 ? 'changing' : L.total0) : null,
        focusTarget: p.focusTarget,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        sheetCenter: posed.semantic.sheetCenter,
        handB: posed.semantic.handB,
        gripB: posed.semantic.gripB,
        allReached: posed.semantic.allReached,
      },
    };
  },
};

/** Hand-written-style note with the computed total (before/after text nodes). */
function computedNote(ctx, prefix, box, v) {
  const th = ctx.theme;
  const color = '#fbe7a1';
  const parts = [
    h('path', {d: roundRectPath(box.x + 5, box.y + 7, box.w, box.h, 6), fill: th.shadow}),
    h('path', {d: `M${box.x} ${box.y + 4}Q${box.x} ${box.y} ${box.x + 4} ${box.y}H${box.x + box.w - 4}Q${box.x + box.w} ${box.y} ${box.x + box.w} ${box.y + 4}V${box.y + box.h - 14}L${box.x + box.w - 14} ${box.y + box.h}H${box.x + 4}Q${box.x} ${box.y + box.h} ${box.x} ${box.y + box.h - 4}Z`, fill: color, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${box.x + box.w} ${box.y + box.h - 14}L${box.x + box.w - 14} ${box.y + box.h}V${box.y + box.h - 14}Z`, fill: '#e9cf78', stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('rect', {x: box.x + box.w * 0.3, y: box.y - 7, width: box.w * 0.4, height: 14, rx: 2, fill: '#ffffff', opacity: 0.7, stroke: th.inkFaint, 'stroke-width': 1}),
  ];
  const pad = box.w * 0.08;
  const ls = Math.max(10, box.h * 0.2), vs = Math.max(12, box.h * 0.3);
  if (ctx.show('all')) {
    const lf = ctx.fit(`= ${ctx.t.computed}`, {maxWidth: box.w - pad * 2, size: ls, minSize: ls * 0.8, maxLines: 1, weight: 600});
    parts.push(textBlock(lf, {x: box.x + pad, y: box.y + box.h * 0.12, fill: th.inkSoft, italic: true}));
    const line = (q, u, t) => `${q} × ${u} = ${formatAmount(t, v.locale)}`;
    const f0 = ctx.fit(line(v.q0, v.u0, v.total0), {maxWidth: box.w - pad * 2, size: vs, minSize: vs * 0.6, maxLines: 1, weight: 700});
    const f1 = ctx.fit(line(v.q1, v.u1, v.total1), {maxWidth: box.w - pad * 2, size: vs, minSize: vs * 0.6, maxLines: 1, weight: 700});
    parts.push(textBlock(f0, {x: box.x + pad, y: box.y + box.h * 0.46, fill: th.ink, name: `${prefix}-t0`}));
    parts.push(textBlock(f1, {x: box.x + pad, y: box.y + box.h * 0.46, fill: th.accent2, name: `${prefix}-t1`, opacity: 0}));
  } else {
    parts.push(h('rect', {x: box.x + pad, y: box.y + box.h * 0.2, width: box.w * 0.35, height: ls * 0.5, rx: 3, fill: '#c9b36a'}));
    parts.push(h('rect', {name: `${prefix}-t0`, x: box.x + pad, y: box.y + box.h * 0.52, width: box.w * 0.75, height: vs * 0.6, rx: 4, fill: th.ink, opacity: 0.7}));
    parts.push(h('rect', {name: `${prefix}-t1`, x: box.x + pad, y: box.y + box.h * 0.52, width: box.w * 0.62, height: vs * 0.6, rx: 4, fill: th.accent2, opacity: 0}));
  }
  return g({name: `${prefix}-note`, opacity: 0}, parts);
}

/**
 * Before/after chip: the term's label (up to 3 lines) above its value on its own bold line(s).
 * Returns the value's line boxes so the before chip can strike through the value itself.
 */
function valueChip(ctx, o) {
  const th = ctx.theme;
  const ls = o.labelSize ?? 25, vs = o.valueSize ?? 36;
  const padX = ls * 0.72, padY = ls * 0.44, gap = ls * 0.5;
  const inner = o.maxWidth - padX * 2;
  const lf = ctx.fit(o.label, {maxWidth: inner, size: ls, minSize: Math.max(20, ls * 0.84), maxLines: 3, weight: 600});
  const vf = ctx.fit(o.value, {maxWidth: inner, size: vs, minSize: Math.max(22, vs * 0.66), maxLines: 2, weight: 700});
  const w = Math.max(lf.width, vf.width) + padX * 2;
  const hh = padY + lf.height + gap + vf.height + padY;
  const x = o.anchor === 'end' ? o.x - w : o.anchor === 'middle' ? o.x - w / 2 : o.x;
  const y = o.y;
  const cx = x + w / 2;
  const vy = y + padY + lf.height + gap;
  const show = ctx.show('key');
  const valueLines = vf.lines.map((line, i) => {
    const lw = ctx.measure(line, vf.size, 700, 'sans');
    return {x: cx - lw / 2, w: lw, cy: vy + i * vf.lineHeight + vf.size * 0.47};
  });
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, y, w, hh, 16), fill: o.fill, stroke: o.stroke, 'stroke-width': 2}),
    show ? textBlock(lf, {x: cx, y: y + padY, anchor: 'middle', fill: th.inkSoft}) : null,
    show ? textBlock(vf, {x: cx, y: vy, anchor: 'middle', fill: o.valueColor}) : null,
  );
  return {node, box: {x, y, w, h: hh, cx, cy: y + hh / 2}, valueLines};
}

/** Strike line over the focused value inside the lens copy (keeps the old value traceable). */
function strikeLine(ctx, prefix, row, len) {
  const y = row.value.y + row.valueSize * 0.46;
  return h('line', {name: `${prefix}-strike`, x1: row.value.x - 4, x2: row.value.x - 4 + len, y1: y, y2: y, stroke: ctx.theme.accent, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len), opacity: 0});
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-01-inspect',
    title: 'Communicated offer — inspect and change one term',
    titleEs: 'Oferta comunicada — Inspección y cambio de un dato',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Oferta comunicada',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the offeree holds the opened offer. A lens lifts a real copy of the pricing rows and a computed-total note; one supplied term is substituted (old value struck through but visible) and only its dependent line — quantity × unit price, arithmetic on supplied values — updates; the lens returns and the context shows the new datum with a changed marker.',
    tags: ['offer', 'terms', 'inspect', 'lens', 'before-after', 'substitution', 'computed total', 'hypothetical amounts'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/offer-letter.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/frameworks/lens.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
