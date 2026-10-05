/**
 * LAW-0056 — Tratamiento de un caso · inspect
 *
 * Storyboard (the treatment card produced by the search, without the
 * library; the vacated area holds the lens):
 *  0.00–0.20  build: the card shows the decision and the pinned resolution
 *             covers; each supplied tag rides its thread and hangs on it, so
 *             the view of the produced state assembles in place.
 *  0.20–0.45  isolate: a lens opens on the detail that distinguishes one
 *             treatment from another — one resolution's label (or its date or
 *             citation). The lens content is a real second copy of the card
 *             drawn in the same coordinates, so the detail keeps its origin;
 *             the rest of the card is dimmed and cone lines tie the lens to it.
 *  0.45–0.75  substitute: inside the lens the old value lifts out and the
 *             supplied alternative settles in; for a label the tag's body
 *             resizes to the new text (its geometry is the dependent state).
 *             A before→after annotation strikes the old value but keeps it
 *             readable (traceable).
 *  0.75–1.00  return: the lens closes onto its source, the context card
 *             receives the same substitution and a "changed" marker is pinned
 *             to the detail. No validity, weight or outcome is inferred.
 * Seeking back before the substitution restores the previous value exactly.
 * @module animations/research/LAW-0056
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {roundRectPath} from '../../core/geometry.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {inspectFields, int} from '../../schemas/fields.js';
import {chip, caption, textBlock} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {caseStage, caseFields, caseObjectLabels, CASE_DEFAULTS, CASE_STAGE} from './kits/tratamiento-de-un-caso.js';

const ID = 'LAW-0056';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
// return: the lens closes exactly onto its source while staying opaque; the
// context datum is replaced underneath it, then the window fades (nothing is
// cross-faded in place); the marker is pinned; the card is recentred for the hold
const W = {ctxCaption: [0.02, 0.1], build: [0.02, 0.19], open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  change: [0.5, 0.68], after: [0.62, 0.7], close: [0.76, 0.85], ctxUpdate: [0.85, 0.86], winOut: [0.86, 0.89], annOut: [0.87, 0.91],
  marker: [0.88, 0.94], camera: [0.89, 0.98]};

const STRINGS = {
  en: {label: 'Label', date: 'Date', citation: 'Citation'},
  es: {label: 'Etiqueta', date: 'Fecha', citation: 'Cita'},
};

const sceneSchema = {
  ...caseFields,
  objectLabels: caseObjectLabels,
  ...inspectFields(['label', 'date', 'citation']),
  focusIndex: int('Zero-based index of the resolution whose datum is inspected', 0, 3),
};

const defaultParams = {
  ...CASE_DEFAULTS,
  focusTarget: 'label',
  focusIndex: 1,
  beforeValue: 'Discusses',
  afterValue: 'Distinguishes',
  detailGeometry: {zoom: 2.8, placement: 'auto'},
  contextLabels: {context: 'Treatment card produced by the search', marker: 'Label changed'},
};

/** Stage geometry and annotation arrangement per shape; the lens uses the library's vacated box. */
const LAYOUT = {
  landscape: {axis: 'horizontal', annot: 'above', extend: true},
  square: {axis: 'inspectSquare', annot: 'right'},
  portrait: {axis: 'vertical', annot: 'above'},
};

const scene = {
  sizes: {landscape: [1760, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const {axis, annot, extend} = LAYOUT[ctx.view.shape];
    const st = CASE_STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2, oy = (ctx.design.h - st.h * s) / 2;
    const toD = q => ({x: ox + q.x * s, y: oy + q.y * s});
    const boxD = b => ({...toD(b), w: b.w * s, h: b.h * s});
    const k = Math.min(p.focusIndex, p.sources.length - 1);
    const target = p.focusTarget;
    const swap = {target, index: k, before: p.beforeValue, after: p.afterValue};
    const opts = prefix => ({prefix, axis, query: p.query, decision: p.decision, sources: p.sources, objectLabels: p.objectLabels, withLibrary: false, swap});
    const stage = caseStage(ctx, opts('ctx'));
    const copy = caseStage(ctx, opts('cp'));

    // Source: the inspected detail (a tag with a stretch of its thread, or a cover).
    let src;
    if (target === 'label' && stage.tagSpots[k]) {
      const b = stage.tagSpots[k].box;
      src = {x: b.x - 26, y: b.y - 18, w: b.w + 52, h: b.h + 36};
    } else {
      const b = stage.coverBox(k);
      src = {x: b.x - 14, y: b.y - 14, w: b.w + 28, h: b.h + 28};
    }
    const source = boxD(src);
    const region = boxD(stage.book);
    const stageBox = {x: ox, y: oy, w: st.w * s, h: st.h * s};

    // Context caption at the bottom of the vacated region.
    // Context caption: shown in the empty region while the view is built, then
    // it gives way to the lens (the before/after pair is the single annotation).
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: region.x + region.w / 2, y: 0, anchor: 'middle', maxWidth: region.w - 40, size: 32, maxLines: 3, weight: 600}) : null;
    const ctxCaption = ctxCap ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: region.x + region.w / 2, y: region.y + (region.h - ctxCap.box.h) / 2, anchor: 'middle', maxWidth: region.w - 40, size: 32, maxLines: 3, weight: 600, name: 'ctx-caption'}) : null;

    // Lens destination inside the region; annotation below (wide/tall) or beside (square).
    const ratio = source.h / source.w;
    const zoom = p.detailGeometry.zoom;
    const place = p.detailGeometry.placement;
    const label = t[target];
    const chipSize = 30;
    let dest, annBox;
    let stacked = false;
    let annH = 0;
    if (annot === 'above') {
      const half = (region.w - 20) / 2 - 34;
      const one = v => ctx.fit(`${label}: ${v}`, {maxWidth: half - chipSize * 1.2, size: chipSize, minSize: chipSize, maxLines: 1, weight: 600});
      stacked = one(p.beforeValue).truncated || one(p.afterValue).truncated;
      const full = v => chip(ctx, `${label}: ${v}`, {x: 0, y: 0, maxWidth: region.w - 20, size: chipSize, minSize: 20, maxLines: 3});
      annH = ctx.show('key') ? (stacked ? full(p.beforeValue).box.h + full(p.afterValue).box.h + 46 : one(p.beforeValue).height + chipSize * 0.76) : 0;
      const right = extend ? Math.min(...p.sources.map((_, i) => toD(stage.coverBox(i)).x)) - 24 : region.x + region.w;
      const avail = right - region.x - 15;
      const w = Math.min(avail, source.w * zoom, (region.h - annH - 60) / ratio);
      const x = place === 'left' ? region.x + 15 : place === 'right' ? right - w : region.x + Math.max(15, (Math.min(region.w, avail + 15) - w) / 2);
      dest = {x, y: region.y + 22 + annH + 22, w, h: w * ratio};
      annBox = {x: region.x + 10, y: region.y + 22, w: region.w - 20};
    } else {
      const w = Math.min(region.w * 0.56, source.w * zoom, (region.h - 24) / ratio);
      const hh = w * ratio;
      const x = place === 'right' ? region.x + region.w - w - 10 : region.x + 10;
      const y = place === 'top' ? region.y + 10 : place === 'bottom' ? region.y + region.h - hh - 10 : region.y + (region.h - hh) / 2;
      dest = {x, y, w, h: hh};
      annBox = place === 'right' ? {x: region.x + 10, y: dest.y, w: region.w - w - 60} : {x: dest.x + dest.w + 40, y: dest.y, w: region.x + region.w - (dest.x + dest.w + 40) - 6};
    }
    const content = g({transform: T(ox, oy, 0, s)}, copy.node);
    // no full-box dim: the dim below is shaped like the card and the search bar
    const L2 = lens(ctx, {name: 'lens', source, dest, content, color: th.accent});
    const cardD = boxD(stage.card), barD = boxD(stage.search);
    const dim = h('path', {name: 'dim', d: roundRectPath(cardD.x, cardD.y, cardD.w, cardD.h, 20 * s) + roundRectPath(barD.x, barD.y, barD.w, barD.h, barD.h / 2)
      + roundRectPath(source.x, source.y, source.w, source.h, 10), 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0});

    // Single editorial annotation: before → after, the old value struck but readable.
    let beforeChip = null, afterChip = null, arrow = null;
    if (ctx.show('key')) {
      const co = {size: chipSize, maxLines: 3, minSize: 20};
      if (annot === 'above' && stacked) {
        beforeChip = chip(ctx, `${label}: ${p.beforeValue}`, {...co, x: annBox.x + annBox.w / 2, y: annBox.y, anchor: 'middle', maxWidth: annBox.w, fill: th.card, name: 'ann-before'});
        const ay = beforeChip.box.y + beforeChip.box.h + 8;
        afterChip = chip(ctx, `${label}: ${p.afterValue}`, {...co, x: annBox.x + annBox.w / 2, y: ay + 30, anchor: 'middle', maxWidth: annBox.w, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ax = annBox.x + annBox.w / 2;
        arrow = `M${r(ax)} ${r(ay)}v24m-9 -10l9 10l9 -10`;
      } else if (annot === 'above') {
        const half = annBox.w / 2 - 34;
        beforeChip = chip(ctx, `${label}: ${p.beforeValue}`, {...co, x: annBox.x + annBox.w / 2 - 28, y: annBox.y, anchor: 'end', maxWidth: half, fill: th.card, name: 'ann-before'});
        afterChip = chip(ctx, `${label}: ${p.afterValue}`, {...co, x: annBox.x + annBox.w / 2 + 28, y: annBox.y, anchor: 'start', maxWidth: half, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ay = annBox.y + beforeChip.box.h / 2;
        const ax = annBox.x + annBox.w / 2;
        arrow = `M${r(ax - 13)} ${r(ay)}h24m-10 -9l10 9l-10 9`;
      } else {
        beforeChip = chip(ctx, `${label}: ${p.beforeValue}`, {...co, x: annBox.x, y: annBox.y, anchor: 'start', maxWidth: annBox.w, fill: th.card, name: 'ann-before'});
        const ay = beforeChip.box.y + beforeChip.box.h + 10;
        afterChip = chip(ctx, `${label}: ${p.afterValue}`, {...co, x: annBox.x, y: ay + 36, anchor: 'start', maxWidth: annBox.w, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ax = annBox.x + 30;
        arrow = `M${r(ax)} ${r(ay)}v26m-9 -10l9 10l9 -10`;
      }
    }
    const strike = beforeChip ? h('line', {name: 'ann-strike', x1: beforeChip.box.x + 10, x2: beforeChip.box.x + beforeChip.box.w - 10, y1: beforeChip.box.cy, y2: beforeChip.box.cy, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(beforeChip.box.w)} ${r(beforeChip.box.w + 10)}`, 'stroke-dashoffset': r(beforeChip.box.w)}) : null;

    // Hold: the card (with its marker) is recentred in the frame; where the
    // search bar stands above a vacated band it drops onto the card first.
    const barDrop = axis === 'horizontal' ? 0 : (stage.card.y - 22 - stage.search.h) - stage.search.y;
    const held = {x: Math.min(cardD.x, barD.x), y: barD.y + barDrop * s, w: 0, h: 0};
    held.w = Math.max(cardD.x + cardD.w, barD.x + barD.w) - held.x;
    held.h = cardD.y + cardD.h - held.y;
    const cam = {dx: ox + (st.w * s) / 2 - (held.x + held.w / 2), dy: oy + (st.h * s) / 2 - (held.y + held.h / 2)};
    // Changed-datum marker pinned to the context detail: the marker label with
    // the old value struck under it (the old datum stays traceable at the
    // detail itself). It takes the first spot next to the detail, inside the
    // card, clear of covers, tags, threads and the decision; a leader ties it
    // to the check pin on the detail.
    const mk = {x: source.x + source.w, y: source.y};
    const threadBoxes = stage.threads.flatMap(tr => Array.from({length: 31}, (_, j) => { const q = tr.at(j / 30); return boxD({x: q.x - 4, y: q.y - 4, w: 8, h: 8}); }));
    const obst = [
      ...p.sources.map((_, i) => boxD(stage.coverBox(i))),
      ...stage.tagSpots.filter(Boolean).map(sp => boxD(sp.box)),
      boxD(stage.decBox),
      source,
      ...threadBoxes,
    ];
    const inCard = b => b.x >= cardD.x + 8 && b.x + b.w <= cardD.x + cardD.w - 8 && b.y >= boxD({x: 0, y: stage.cardHeaderBottom, w: 0, h: 0}).y + 4 && b.y + b.h <= cardD.y + cardD.h - 8;
    const areaOf = list => b => list.reduce((a, q) => a + Math.max(0, Math.min(b.x + b.w, q.x + q.w + 4) - Math.max(b.x, q.x - 4)) * Math.max(0, Math.min(b.y + b.h, q.y + q.h + 4) - Math.max(b.y, q.y - 4)), 0);
    const overlapArea = areaOf(obst);
    // a chip may lie over a thread line (no text is hidden) but never over a cover, a tag or the decision
    const solidArea = areaOf(obst.filter(q => q.w > 12));
    let markChip = null;
    let lead = null;
    let markClear = true;
    if (ctx.show('key')) {
      const oldText = p.beforeValue;
      const mkNode = (x, y, anchor, stacked, size = 28) => {
        const f1 = ctx.fit(p.contextLabels.marker, {maxWidth: 420, size, minSize: size * 0.8, maxLines: 1, weight: 700});
        const f2 = ctx.fit(oldText, {maxWidth: 420, size: size * 0.92, minSize: size * 0.75, maxLines: 1, weight: 500});
        const padX = size * 0.55, padY = size * 0.3;
        const w = stacked ? Math.max(f1.width, f2.width) + padX * 2 : f1.width + size * 0.7 + f2.width + padX * 2;
        const gapY = size * 0.3;
        const hh = stacked ? f1.height + f2.height + padY * 2 + gapY : Math.max(f1.height, f2.height) + padY * 2;
        const bx = anchor === 'end' ? x - w : x;
        const t2x = stacked ? bx + padX : bx + padX + f1.width + size * 0.7;
        const t2y = stacked ? y + padY + f1.height + gapY : y + padY;
        const node = g(null,
          h('path', {d: roundRectPath(bx, y, w, hh, Math.min(hh / 2, 16)), fill: th.card, stroke: th.accent2, 'stroke-width': 2.5}),
          textBlock(f1, {x: bx + padX, y: y + padY, fill: th.accent2}),
          textBlock(f2, {x: t2x, y: t2y, fill: th.inkSoft}),
          h('line', {x1: t2x - 2, x2: t2x + f2.width + 2, y1: t2y + f2.height * 0.55, y2: t2y + f2.height * 0.55, stroke: th.accent, 'stroke-width': 3, 'stroke-linecap': 'round'}));
        return {node, box: {x: bx, y, w, h: hh, cx: bx + w / 2, cy: y + hh / 2}};
      };
      const probe = (st2, sz = 28) => mkNode(0, 0, 'start', st2, sz).box;
      const cands = [];
      // (for a label the chip starts right of its cover; for a cover datum it may sit over the cover's column)
      const cvR = target === 'label' ? (() => { const b = boxD(stage.coverBox(k)); return b.x + b.w; })() : -Infinity;
      const decL = boxD(stage.decBox).x;
      for (const sz of [28, 24]) {
        for (const st2 of [true, false]) {
          const hh = probe(st2, sz).h;
          cands.push([mk.x - 20, source.y - hh - 10, 'end', st2, sz], [Math.max(source.x, cvR + 10), source.y - hh - 10, 'start', st2, sz],
            [decL - 14, source.y - hh - 10, 'end', st2, sz], [decL - 14, source.y + source.h + 10, 'end', st2, sz],
            [Math.max(source.x, cvR + 10), source.y + source.h + 10, 'start', st2, sz],
            [source.x + source.w + 20, source.y + source.h / 2 - hh / 2, 'start', st2, sz],
            [mk.x - 20, source.y + source.h + 10, 'end', st2, sz], [source.x, source.y + source.h + 10, 'start', st2, sz],
            [source.x - 20, source.y + source.h / 2 - hh / 2, 'end', st2, sz]);
        }
      }
      const built = cands.map(([x, y, anchor, st2, sz]) => mkNode(x, y, anchor, st2, sz));
      // the nearest clear spot wins (a chip may cross a thread line only when nothing closer is fully clear)
      const dist = b => Math.hypot(Math.max(source.x - (b.x + b.w), 0, b.x - (source.x + source.w)), Math.max(source.y - (b.y + b.h), 0, b.y - (source.y + source.h)));
      const nearest = list => list.sort((a2, b2) => dist(a2.box) - dist(b2.box) || (b2.box.h - a2.box.h))[0] || null;
      markChip = nearest(built.filter(c => inCard(c.box) && overlapArea(c.box) === 0)) || nearest(built.filter(c => inCard(c.box) && solidArea(c.box) === 0));
      if (markChip) {
        const b = markChip.box;
        const px = Math.max(b.x, Math.min(mk.x, b.x + b.w));
        const py = mk.y < b.y ? b.y : mk.y > b.y + b.h ? b.y + b.h : b.cy;
        lead = `M${r(mk.x)} ${r(mk.y)}L${r(px)} ${r(py)}`;
      } else {
        // crowded card (no free spot beside the detail): the marker takes the
        // free band under the last row; its leader runs from the check pin
        // along the corridor between the tags and the decision
        const decD = boxD(stage.decBox);
        const lowest = Math.max(...obst.filter(q => q.w > 12).map(q => q.y + q.h));
        const corridor = (source.x + source.w + decD.x) / 2;
        // (or, when even that band is full, just under the card, which the recentred hold leaves free)
        const underCard = b => b.y >= cardD.y + cardD.h + 8 && b.x >= cardD.x && b.x + b.w <= cardD.x + cardD.w && b.y + b.h + cam.dy <= oy + st.h * s - 8;
        for (const [y0, ok] of [[lowest + 12, inCard], [cardD.y + cardD.h + 16, underCard]]) {
          for (const st2 of [false, true]) {
            const pb = probe(st2);
            const x = Math.min(cardD.x + cardD.w - 12 - pb.w, Math.max(cardD.x + 12, corridor - pb.w / 2));
            const c = mkNode(x, y0, 'start', st2);
            if (ok(c.box) && solidArea(c.box) === 0) {
              markChip = c;
              lead = `M${r(mk.x)} ${r(mk.y)}H${r(corridor)}V${r(c.box.y)}`;
              break;
            }
          }
          if (markChip) break;
        }
      }
      if (!markChip) {
        markClear = false;
        markChip = built.filter(c => inCard(c.box)).sort((a, b) => overlapArea(a.box) - overlapArea(b.box))[0] || built[0];
        const b = markChip.box;
        lead = `M${r(mk.x)} ${r(mk.y)}L${r(Math.max(b.x, Math.min(mk.x, b.x + b.w)))} ${r(mk.y < b.y ? b.y : b.y + b.h)}`;
      }
    }
    const marker = g({name: 'marker', opacity: 0},
      lead ? h('path', {d: lead, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linejoin': 'round'}) : null,
      h('circle', {cx: mk.x, cy: mk.y, r: 16, fill: th.accent2, stroke: th.paper, 'stroke-width': 3}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 7)}l7 12.25h-14z`, fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    const markDist = markChip ? r(Math.hypot(Math.max(source.x - (markChip.box.x + markChip.box.w), 0, markChip.box.x - (source.x + source.w)), Math.max(source.y - (markChip.box.y + markChip.box.h), 0, markChip.box.y - (source.y + source.h))), 1) : 0;

    const tg = stage.tags[k];
    return {stage, copy, s, ox, oy, source, dest, L2, dim, ctxCaption, beforeChip, afterChip, arrow, strike, marker, k, target, cam, barDrop, markDist, markClear,
      widths: tg && target === 'label' ? [tg.W, tg.W1] : null};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({name: 'cam'}, g({transform: T(L.ox, L.oy, 0, L.s)}, L.stage.node), L.marker),
      L.dim,
      L.ctxCaption && L.ctxCaption.node,
      L.L2.node,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {d: L.arrow, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const n = ctx.params.sources.length;
    // Build: tags ride their threads onto the card (the produced state assembles).
    const thread = Array.from({length: n}, (_, i) => seg(u, W.build[0] + i * 0.03, W.build[0] + i * 0.03 + 0.09));
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const base = {type: 1, mag: 0, thread};
    const a = L.stage.pose({...base, swap: ctxUpd});
    const b = L.copy.pose({...base, swap: change});
    Object.assign(nodes, a.nodes, b.nodes);
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // the closing window stays opaque until it lies exactly on its source, so
    // the old and new values never show in the same place; it fades only once
    // the context underneath already holds the new value
    if (u >= W.close[0]) {
      nodes['lens-win'] = {opacity: r(1 - seg(u, ...W.winOut), 3)};
      // the window's own border takes over from the source outline as it lands (no double outline)
      nodes['lens-src'] = {opacity: r((lp > 0.001 ? 1 : 0) * (1 - seg(u, 0.79, 0.82)), 3)};
    }
    nodes.dim = {opacity: r(0.42 * lp, 3)};
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.4 * seg(u, ...W.strike)), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.beforeChip.box.w * (1 - seg(u, ...W.strike)))};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes.ann = {opacity: u >= W.before[0] ? r(1 - seg(u, ...W.annOut), 3) : 0};
    }
    if (L.ctxCaption) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption) * (1 - seg(u, 0.2, 0.25)), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const camP = ease.inOutCubic(seg(u, ...W.camera));
    nodes.cam = {transform: T(L.cam.dx * camP, L.cam.dy * camP)};
    nodes['ctx-search'] = {transform: T(0, L.barDrop * camP)};
    // the magnifier rests in the bar's socket and drops with it
    nodes['ctx-mag'] = {transform: T(a.semantic.mag.x, a.semantic.mag.y + L.barDrop * camP, 0, L.stage.magRest)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const sem = {
      beat,
      lensOpen: r(lp, 3),
      datum,
      lensSwap: r(change, 3),
      contextSwap: r(ctxUpd, 3),
      contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
      focusTarget: L.target,
      focusIndex: L.k,
      source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
      linked: a.semantic.linked,
      lensLinked: b.semantic.linked,
      markerShown: u >= W.marker[1],
      // the marker (with the old value struck) sits next to the detail and clear of the card's contents
      markerDist: L.markDist,
      markerClear: L.markClear,
      annotationShown: Boolean(L.beforeChip) && u >= W.before[0] && u < W.annOut[1],
      camera: {x: r(L.cam.dx * camP), y: r(L.cam.dy * camP)},
    };
    if (L.widths) {
      sem.ctxTagWidth = a.semantic.swapTagWidth;
      sem.lensTagWidth = b.semantic.swapTagWidth;
      sem.widthBefore = r(L.widths[0], 1);
      sem.widthAfter = r(L.widths[1], 1);
    }
    // the detail keeps its origin: the lens copy's tag sits exactly where the context tag is
    if (a.semantic[`tag${L.k}`]) {
      sem.ctxTag = a.semantic[`tag${L.k}`];
      sem.lensTag = b.semantic[`tag${L.k}`];
    }
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-04-inspect',
    title: 'Case treatment — inspect one supplied label',
    titleEs: 'Tratamiento de un caso — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Tratamiento de un caso',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The treatment card assembles its links; a lens enlarges one resolution’s supplied label (or its date or citation), substitutes the alternative value — the tag resizes to the new text — keeps the old value struck but readable, and returns to the card with a changed-datum marker. No validity or outcome is inferred.',
    tags: ['case treatment', 'inspect', 'lens', 'label', 'before-after', 'substitution', 'index card'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/tratamiento-de-un-caso.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
