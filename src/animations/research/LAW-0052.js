/**
 * LAW-0052 — Historial de una norma · inspect
 *
 * Storyboard:
 *  0.00–0.20  build: the reading station in the state produced by the action —
 *             temporal layers fanned on the lectern, research card clipped on
 *             the date rail inside the layer the author marks, later layers as
 *             ghosts. A caption names the context.
 *  0.20–0.45  isolate: the context shrinks into a thumbnail (kept visible, with
 *             the source region outlined) while a REAL enlarged copy of the
 *             distinguishing detail opens beside it: the rail where the card's
 *             date sits between the marked layer's start and the later layer's
 *             start (or, for `passage`, the marked layer's wording strip).
 *  0.45–0.75  substitute: one datum changes inside the lens only. `selectedDate`:
 *             the old date lifts off the card, the new one settles in, and the
 *             card slides along the rail into the band of the layer the author
 *             marks for the new date; the outline moves with it. `passage`: the
 *             wording of the marked layer is replaced. The single editorial
 *             annotation keeps the old value readable (struck, before → after).
 *  0.75–1.00  return: the lens closes onto its source, the context grows back
 *             and shows the new datum; a "changed" marker stays pinned to it.
 *             Seeking back restores the old datum exactly. No validity, effect
 *             or outcome is inferred from the change.
 * @module animations/research/LAW-0052
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields, int} from '../../schemas/fields.js';
import {chip, caption, textBlock} from '../../primitives/annotate.js';
import {readingStation, STATION} from './kits/historial-de-una-norma.js';
import {historialFields, HISTORIAL_DEFAULTS, HISTORIAL_STRINGS, selectedIndex} from './kits/historial-fields.js';

const ID = 'LAW-0052';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], captionOut: [0.2, 0.26], open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.46, 0.51],
  swap: [0.48, 0.56], slide: [0.54, 0.65], hl: [0.57, 0.65], after: [0.58, 0.64],
  // the before → after annotation leaves BEFORE the lens starts to close (it never rides over the moving lens)
  annOut: [0.735, 0.765],
  // return: the lens (opaque, same content) flies back onto its source while the context grows; the context's
  // own labels fade in only once the lens sits exactly on the source, then the lens is removed (no double exposure)
  // the lens leads the context on the way back: it is on its source by 0.835 and rides it while the context
  // finishes growing; the label wipes are short (a few frames), so no half-wiped words linger
  close: [0.77, 0.86], lensClose: [0.77, 0.835], ctxUpdate: [0.79, 0.86], ctxTextIn: [0.86, 0.872], lensOut: [0.885, 0.9],
  wipeOut: [0.233, 0.252],
  captionIn: [0.88, 0.93], marker: [0.88, 0.94],
};

const STRINGS = {
  en: {...HISTORIAL_STRINGS.en, selectedDateT: 'Selected date', passageT: 'Wording'},
  es: {...HISTORIAL_STRINGS.es, selectedDateT: 'Fecha seleccionada', passageT: 'Texto'},
};

const sceneSchema = {
  ...historialFields,
  ...inspectFields(['selectedDate', 'passage']),
  afterVersion: int('For focusTarget "selectedDate": index (0 = oldest) of the layer the author marks for the new date (supplied, never computed)', 0, 3),
};

const defaultParams = {
  ...HISTORIAL_DEFAULTS,
  focusTarget: 'selectedDate',
  beforeValue: '14 Jun 2021',
  afterValue: '14 Jun 2024',
  afterVersion: 2,
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Research card on the date rail', marker: 'Datum changed'},
};

/** Full-context placement, thumbnail and lens destination per shape. */
const LAYOUT = {
  // design spaces have the caption-safe box's proportions: the full context is centred in them (same size
  // as before) and the lens uses the whole free area beside the thumbnail.
  //  - landscape: thumbnail at the left, level with the lens (cone lines run straight across);
  //  - square: lens across the top at nearly the full height; the before → after annotation sits in the
  //    bottom row beside the thumbnail (no band of empty frame under a wide lens);
  //  - portrait: lens on top, annotation under it, thumbnail below.
  landscape: {axis: 'horizontal', size: [2030, 964], top: 64, thumbK: 0.36, thumbMiddle: true, lens: {x: 636, y: 24, w: 1374, h: 924}},
  square: {axis: 'square', size: [1390, 1170], top: 64, thumbK: 0.34, lens: {x: 20, y: 40, w: 1350, h: 784}, annBeside: true, tagSide: 'right-bottom'},
  portrait: {axis: 'vertical', size: [900, 1470], top: 64, thumbK: 0.46, lens: {x: 16, y: 84, w: 868, h: 690}, tagSide: 'left'},
};

const FINAL = {toKeys: 1, type: 1, dated: 1, locate: 1, backR: 1, toVol: 1, pull: 1, carry: 1, settle: 1, toFan: 1, fan: 1, releaseL: 1,
  toCard: 1, liftCard: 1, slide: 1, clip: 1, releaseR: 1, select: 1};

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const Lo = LAYOUT[ctx.view.shape];
    const st = STATION[Lo.axis];
    const S = {w: Lo.size[0], h: Lo.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const target = p.focusTarget;
    const sel = selectedIndex(p);
    const n = p.versions.length;
    const after = target === 'selectedDate' ? Math.max(0, Math.min(n - 1, p.afterVersion)) : sel;

    // Both stations carry the BEFORE datum; the swap node carries the after datum.
    const data = target === 'selectedDate'
      ? {...p, dates: {selected: p.beforeValue}}
      : {...p, versions: p.versions.map((v, i) => (i === sel ? {...v, text: p.beforeValue} : v))};
    const extra = target === 'selectedDate' ? {dateAfter: p.afterValue} : {passageAfter: {index: sel, text: p.afterValue}};
    const mk = prefix => readingStation(ctx, {prefix, axis: Lo.axis, data, selected: sel, researcher: null, actorCaption: null, ...extra});
    const ctxSt = mk('cx');
    const lensSt = mk('ln');
    // text-free twin of the context: shown as the thumbnail (labels there would be ~5 px)
    const ctxBare = readingStation({...ctx, show: () => false}, {prefix: 'cb', axis: Lo.axis, data, selected: sel, researcher: null, actorCaption: null, ...extra});

    // Source region (station coordinates).
    let src;
    if (target === 'selectedDate') {
      const b0 = ctxSt.cardBoxAt({x: ctxSt.cardWait.x, y: ctxSt.dateAt(sel)});
      const b1 = ctxSt.cardBoxAt({x: ctxSt.cardWait.x, y: ctxSt.dateAt(after)});
      const x0 = ctxSt.sheetPoint(Math.min(sel, after), {x: 8, y: 0}).x;
      const y0 = ctxSt.sheetTop + Math.min(sel, after) * ctxSt.dy - 16;
      const y1 = Math.max(b0.y + b0.h, b1.y + b1.h, ctxSt.sheetTop + Math.max(sel, after) * ctxSt.dy + 70) + 14;
      src = {x: x0, y: y0, w: b0.x + b0.w + 14 - x0, h: y1 - y0};
    } else {
      const tl = ctxSt.sheetPoint(sel, {x: -12, y: -10});
      src = {x: tl.x, y: tl.y, w: ctxSt.SW + 50, h: ctxSt.dy + 8};
    }
    // Lens destination (aspect-preserving, bounded by zoom and the free area).
    const zoom = p.detailGeometry.zoom;
    const A = Lo.lens;
    const flip = p.detailGeometry.placement === 'left' && ctx.view.shape === 'landscape';
    const label = target === 'selectedDate' ? t.selectedDateT : t.passageT;
    // one line when it fits at a readable size; otherwise the label on one line and the whole value on the next
    // (a date is never split across lines); only a value too long for one line (a passage) wraps. Never truncated.
    const annChip = (value, o2) => {
      const text = `${label}: ${value}`;
      const one = chip(ctx, text, {...o2, size: 32, minSize: 28, maxLines: 1});
      if (!one.fit.truncated) return one;
      return labelValueChip(ctx, `${label}:`, value, o2) || chip(ctx, text, {...o2, size: 30, maxLines: 3});
    };
    // room for the annotation underneath the lens (none when it sits beside the thumbnail), measured on the actual values
    const annProbeW = Math.min(S.w - 40, Math.max(A.w, 1000)) / 2 - 30;
    const annProbeH = ctx.show('key') ? Math.max(...[p.beforeValue, p.afterValue].map(v => annChip(v, {x: 0, y: 0, maxWidth: annProbeW}).box.h)) : 0;
    const annRoom = Lo.annBeside ? 0 : Math.max(110, annProbeH + 44);
    const availH = A.h - annRoom;
    // The detail region grows (with more of the rail band and layers, inside the station) until the
    // enlarged copy at the requested zoom fills the lens box, then to the box's proportions, so the
    // lens never opens as a small or thin band.
    const lim = {x: 0, y: 0, w: st.w, h: ctxSt.ledgeY + 30};
    // the wording lens takes in the rail beside the layer but stops short of the research card (no cut card text)
    if (target !== 'selectedDate') lim.w = Math.max(src.x + src.w, ctxSt.cardBoxAt({x: ctxSt.cardWait.x, y: ctxSt.dateAt(sel)}).x - 2) - lim.x;
    const zk = Math.max(zoom, 1.6);
    const mode = target === 'selectedDate' ? 'down' : 'centre';
    src = growMin(src, A.w / zk, availH / zk, lim, mode);
    src = growTo(src, A.w / availH, lim, mode);
    let dw = Math.min(A.w, src.w * zk, availH * (src.w / src.h));
    let dh = dw * (src.h / src.w);
    if (dh > availH) { dh = availH; dw = dh * (src.w / src.h); }
    const dest = {x: flip ? 20 : A.x + (A.w - dw) / 2, y: A.y + Math.max(0, (availH - dh) / 2), w: dw, h: dh};
    // Thumbnail placement: bottom-left (bottom-right when the lens is placed left), level with the
    // lens in landscape, centred under the annotation in portrait.
    const tk = Lo.thumbK;
    const thH = st.h * tk;
    const thumb = {
      x: flip ? S.w - 20 - st.w * tk : ctx.view.shape === 'portrait' ? (S.w - st.w * tk) / 2 : 20,
      y: Lo.thumbMiddle ? Math.max(70, Math.min(S.h - 16 - thH, dest.y + dest.h / 2 - thH / 2)) : S.h - 16 - thH,
      k: tk,
    };
    const full = {x: (S.w - st.w) / 2, y: Lo.top, k: 1};

    // Context caption (full view) and the thumbnail tag.
    // one line when it fits at a readable size, otherwise two smaller lines (never an ellipsis)
    const ctxCap = ctx.show('all') ? (() => {
      const text = `${t.context}: ${p.contextLabels.context}`;
      const one = caption(ctx, text, {x: full.x + 16, y: 8, maxWidth: st.w - 32, size: 36, minSize: 27, maxLines: 1, name: 'ctx-caption', weight: 600});
      return one.fit.truncated ? caption(ctx, text, {x: full.x + 16, y: 3, maxWidth: st.w - 32, size: 26, minSize: 21, maxLines: 2, name: 'ctx-caption', weight: 600}) : one;
    })() : null;
    // the tag sits beside the thumbnail in portrait (the annotation band runs just above it there)
    // square: beside the thumbnail's lower corner (the cone lines leave from its top edge and the lens sits just above)
    // portrait: the dashed cone lines run from the lens down to the source outline's top edge, so the tag sits
    // beside the thumbnail BELOW that edge (never crossed by a cone line)
    const thumbTag = !ctx.show('key') ? null
      : Lo.tagSide === 'left'
        ? (() => {
          const o2 = {x: thumb.x - 14, anchor: 'end', maxWidth: Math.max(120, thumb.x - 24), size: 26, maxLines: 2, name: 'thumb-tag', fill: th.card};
          const probe = chip(ctx, t.context, {...o2, y: 0});
          const y = Math.min(thumb.y + thH - probe.box.h - 6, Math.max(thumb.y + 10, thumb.y + src.y * tk + 24));
          return chip(ctx, t.context, {...o2, y});
        })()
        : Lo.tagSide === 'right-bottom'
          ? (() => {
            const probe = chip(ctx, t.context, {x: 0, y: 0, maxWidth: 300, size: 26, maxLines: 2});
            return chip(ctx, t.context, {x: thumb.x + st.w * tk + 14, y: thumb.y + thH - probe.box.h, anchor: 'start', maxWidth: 300, size: 26, maxLines: 2, name: 'thumb-tag', fill: th.card});
          })()
          : chip(ctx, t.context, {x: thumb.x, y: thumb.y - 50, anchor: 'start', maxWidth: 300, size: 26, maxLines: 1, name: 'thumb-tag', fill: th.card});

    // Single editorial annotation: before → after (old value kept, struck).
    let beforeChip = null, afterChip = null, arrowD = null, cxm = 0;
    if (ctx.show('key') && Lo.annBeside) {
      // square: stacked (before, arrow down, after) in the bottom row beside the thumbnail, below the
      // cone line that joins the thumbnail's source outline to the lens
      const rx0 = thumb.x + st.w * tk + 44, rx1 = S.w - 20;
      const Sd = {x: thumb.x + src.x * tk, y: thumb.y + src.y * tk, w: src.w * tk, h: src.h * tk};
      const cones = coneCorners(Sd, dest);
      let coneY = dest.y + dest.h;
      for (const [P, Q] of [[cones[0], cones[1]], [cones[2], cones[3]]]) {
        for (let q = 0; q <= 20; q++) {
          const x = rx0 + ((rx1 - rx0) * q) / 20;
          if (x < Math.min(P.x, Q.x) || x > Math.max(P.x, Q.x) || Math.abs(Q.x - P.x) < 1) continue;
          coneY = Math.max(coneY, P.y + ((Q.y - P.y) * (x - P.x)) / (Q.x - P.x));
        }
      }
      cxm = (rx0 + rx1) / 2;
      const mw = rx1 - rx0;
      const probeB = annChip(p.beforeValue, {x: cxm, y: 0, anchor: 'middle', maxWidth: mw});
      const probeA = annChip(p.afterValue, {x: cxm, y: 0, anchor: 'middle', maxWidth: mw});
      const gapV = 58;
      const total = probeB.box.h + gapV + probeA.box.h;
      const y0 = Math.max(coneY + 24, Math.min(S.h - 16 - total, thumb.y + (thH - total) / 2));
      beforeChip = annChip(p.beforeValue, {x: cxm, y: y0, anchor: 'middle', maxWidth: mw, fill: th.card, name: 'ann-before'});
      afterChip = annChip(p.afterValue, {x: cxm, y: y0 + probeB.box.h + gapV, anchor: 'middle', maxWidth: mw, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      const ay = y0 + probeB.box.h + gapV / 2;
      arrowD = `M${r(cxm)} ${r(ay - 14)}v26m-10 -11l10 11l10 -11`;
    } else if (ctx.show('key')) {
      const annY = dest.y + dest.h + 24;
      const annMax = Math.min(S.w - 40, Math.max(dest.w, 1000));
      cxm = Math.max(annMax / 2 + 20, Math.min(S.w - annMax / 2 - 20, dest.x + dest.w / 2));
      beforeChip = annChip(p.beforeValue, {x: cxm - 26, y: annY, anchor: 'end', maxWidth: annMax / 2 - 30, fill: th.card, name: 'ann-before'});
      afterChip = annChip(p.afterValue, {x: cxm + 26, y: annY, anchor: 'start', maxWidth: annMax / 2 - 30, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      const arrowY = annY + beforeChip.box.h / 2;
      arrowD = `M${r(cxm - 14)} ${r(arrowY)}h24m-10 -9l10 9l-10 9`;
    }
    // one strike per rendered line of the old value (drawn line after line), through the middle of the letters
    const strikes = [];
    if (beforeChip) {
      const f = beforeChip.fit, b = beforeChip.box;
      const padY = (b.h - f.height) / 2;
      let acc = 0;
      f.lines.forEach((line, i) => {
        const lw = ctx.measure(line, f.size, f.weight, f.family) + 12;
        const y = b.y + padY + f.size * 0.8 + i * f.lineHeight - f.size * 0.3;
        strikes.push({x1: b.cx - lw / 2, x2: b.cx + lw / 2, y, len: lw, start: acc});
        acc += lw;
      });
      strikes.forEach(k => { k.total = acc; });
    }
    const strike = strikes.map((k, i) => h('line', {name: `ann-strike${i}`, x1: r(k.x1), x2: r(k.x2), y1: r(k.y), y2: r(k.y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(k.len)} ${r(k.len + 10)}`, 'stroke-dashoffset': r(k.len)}));

    // Changed-datum marker, pinned to the detail in the full context.
    const pinLocal = target === 'selectedDate'
      ? (() => { const b = ctxSt.cardBoxAt({x: ctxSt.cardWait.x, y: ctxSt.dateAt(after)}); return {x: b.x + b.w, y: b.y}; })()
      : ctxSt.sheetPoint(sel, {x: ctxSt.SW, y: 6});
    const mk2 = {x: full.x + pinLocal.x * full.k, y: full.y + pinLocal.y * full.k};
    let markChip = null;
    if (ctx.show('key')) {
      // first candidate position clear of the station's text (layer strips, card, kiosk) and inside the frame
      const toDesign = b => ({x: full.x + b.x * full.k, y: full.y + b.y * full.k, w: b.w * full.k, h: b.h * full.k});
      const cardAfter = ctxSt.cardBoxAt({x: ctxSt.cardWait.x, y: ctxSt.dateAt(after)});
      const avoid = [...ctxSt.stripBoxes(), cardAfter, ctxSt.kioskBox].map(toDesign);
      const hit = b => avoid.some(q => b.x < q.x + q.w + 6 && b.x + b.w + 6 > q.x && b.y < q.y + q.h + 6 && b.y + b.h + 6 > q.y);
      const cands = [
        {x: mk2.x + 26, y: mk2.y - 70, anchor: 'start'}, {x: mk2.x - 26, y: mk2.y - 70, anchor: 'end'},
        {x: mk2.x + 26, y: mk2.y - 120, anchor: 'start'}, {x: mk2.x - 26, y: mk2.y - 120, anchor: 'end'},
        {x: mk2.x + 30, y: mk2.y + 16, anchor: 'start'}, {x: mk2.x - 30, y: mk2.y + 16, anchor: 'end'},
      ];
      // narrower two-line variants fit the strip of wall between the rail and the kiosk, above the card
      const narrow = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: 250, size: 28, maxLines: 2});
      cands.push({x: mk2.x - 6, y: mk2.y - narrow.box.h - 34, anchor: 'end', maxWidth: 250, maxLines: 2},
        {x: mk2.x + 26, y: mk2.y - narrow.box.h - 34, anchor: 'start', maxWidth: 250, maxLines: 2});
      let best = null;
      for (const c of cands) {
        const mo = {maxWidth: c.maxWidth ?? 360, size: 28, maxLines: c.maxLines ?? 1, fill: th.card, stroke: th.accent2};
        const probe = chip(ctx, p.contextLabels.marker, {...c, ...mo});
        // slide horizontally into the frame, then score: collisions with text regions, frame overflow
        let dxShift = 0;
        if (probe.box.x < full.x + 8) dxShift = full.x + 8 - probe.box.x;
        if (probe.box.x + probe.box.w > full.x + st.w - 8) dxShift = full.x + st.w - 8 - probe.box.x - probe.box.w;
        const cand = dxShift ? chip(ctx, p.contextLabels.marker, {...c, ...mo, x: c.x + dxShift}) : probe;
        const b = cand.box;
        const score = (b.y < full.y + 4 || b.y + b.h > S.h - 4 ? 100 : 0) + (cand.fit.truncated ? 50 : 0) + avoid.filter(q => b.x < q.x + q.w + 6 && b.x + b.w + 6 > q.x && b.y < q.y + q.h + 6 && b.y + b.h + 6 > q.y).length * 10 + Math.abs(dxShift) / 100;
        if (!best || score < best.score) best = {cand, score};
        if (score === 0) break;
      }
      markChip = best.cand;
    }
    const marker = g({name: 'marker', opacity: 0},
      markChip && h('line', {x1: mk2.x, y1: mk2.y, x2: markChip.box.x + (markChip.box.x > mk2.x ? 0 : markChip.box.w), y2: markChip.box.y > mk2.y ? markChip.box.y : markChip.box.y + markChip.box.h, stroke: th.accent2, 'stroke-width': 3}),
      h('circle', {cx: mk2.x, cy: mk2.y, r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk2.x)} ${r(mk2.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    return {ctxBare, S, s, ox, oy, st, ctxSt, lensSt, src, dest, thumb, full, ctxCap, thumbTag, beforeChip, afterChip, strike, strikes, arrowD, marker, target, sel, after, cxm};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const st = L.st;
    const S = L.src;
    const hole = `M0 0h${st.w}v${st.h}h${-st.w}Z M${r(S.x)} ${r(S.y)}v${r(S.h)}h${r(S.w)}v${r(-S.h)}Z`;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctx'},
        L.ctxBare.node,
        // the labelled context is swapped with its text-free twin by a WIPE (a clip that sweeps across), never
        // by an opacity cross-fade: labels and the twin's placeholder bars are never superimposed
        h('defs', null, h('clipPath', {id: ctx.id('ctx-wipe')}, h('rect', {name: 'ctx-wipe-rect', x: -30, y: -60, width: st.w + 60, height: st.h + 120}))),
        g({name: 'ctx-text', 'clip-path': ctx.ref('ctx-wipe')}, L.ctxSt.node),
        h('path', {name: 'ctx-dim', d: hole, 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
        h('path', {name: 'ctx-src', d: roundRectPath(S.x, S.y, S.w, S.h, 10), fill: 'none', stroke: th.accent, 'stroke-width': 7, opacity: 0}),
      ),
      L.thumbTag && L.thumbTag.node,
      h('line', {name: 'coneA', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'coneB', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {name: 'lens-cliprect', rx: 22}))),
      g({name: 'lens-win', opacity: 0},
        h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
        h('rect', {name: 'lens-bg', rx: 22, fill: '#ece5d6'}),
        g({'clip-path': ctx.ref('lens-clip')}, g({name: 'lens-content'}, L.lensSt.node)),
        h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.accent, 'stroke-width': 5}),
      ),
      L.marker,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {d: L.arrowD, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const isDate = L.target === 'selectedDate';
    // --- context: full → thumbnail → full
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    const ck = lerp(L.full.k, L.thumb.k, lp);
    const cxp = lerp(L.full.x, L.thumb.x, lp), cyp = lerp(L.full.y, L.thumb.y, lp);
    nodes.ctx = {transform: T(cxp, cyp, 0, ck)};
    nodes['ctx-dim'] = {opacity: r(0.4 * lp, 3)};
    // the lens stays opaque (and exactly aligned with its source) until the context's labels are back: from the
    // start of the close window (lp reaches ~0 before close ends with the inOutCubic ease) until it fades out
    const lensVis = lp > 0.001 || (u >= W.close[0] && u < W.lensOut[1]);
    const lensAlpha = lp > 0.001 ? 1 : 1 - seg(u, ...W.lensOut);
    nodes['ctx-src'] = {opacity: lensVis ? r(lensAlpha, 3) : 0};
    // --- lens window: from the (moving) source to the destination
    const Sd = {x: cxp + L.src.x * ck, y: cyp + L.src.y * ck, w: L.src.w * ck, h: L.src.h * ck};
    const D = L.dest;
    const lpL = open * (1 - ease.inOutCubic(seg(u, ...W.lensClose)));
    const R = {x: lerp(Sd.x, D.x, lpL), y: lerp(Sd.y, D.y, lpL), w: lerp(Sd.w, D.w, lpL), h: lerp(Sd.h, D.h, lpL)};
    const k = R.w / L.src.w;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    nodes['lens-win'] = {opacity: lensVis ? r(lensAlpha, 3) : 0};
    nodes['lens-cliprect'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['lens-content'] = {transform: `${T(R.x - L.src.x * k, R.y - L.src.y * k)} scale(${r(k, 4)})`};
    const cones = coneCorners(Sd, R);
    nodes.coneA = {x1: r(cones[0].x), y1: r(cones[0].y), x2: r(cones[1].x), y2: r(cones[1].y), opacity: lpL > 0.05 ? 1 : 0};
    nodes.coneB = {x1: r(cones[2].x), y1: r(cones[2].y), x2: r(cones[3].x), y2: r(cones[3].y), opacity: lpL > 0.05 ? 1 : 0};

    // --- substitution inside the lens; the context follows only on return
    const swapP = seg(u, ...W.swap);
    const slideP = isDate ? ease.inOutCubic(seg(u, ...W.slide)) : 0;
    const hlP = isDate ? seg(u, ...W.hl) : 0;
    const upd = seg(u, ...W.ctxUpdate);
    const poseFor = (st, sw, sl, hp) => st.pose({
      ...FINAL,
      targetY: lerp(st.dateAt(L.sel), st.dateAt(L.after), sl),
      mix: {from: L.sel, to: L.after, t: hp},
      ...(isDate ? {dateSwap: sw} : {passSwap: sw}),
    });
    const lensPose = poseFor(L.lensSt, swapP, slideP, hlP);
    const ctxPose = poseFor(L.ctxSt, upd, isDate ? ease.inOutCubic(upd) : 0, isDate ? upd : 0);
    const barePose = poseFor(L.ctxBare, upd, isDate ? ease.inOutCubic(upd) : 0, isDate ? upd : 0);
    Object.assign(nodes, lensPose.nodes, ctxPose.nodes, barePose.nodes);
    // opening: the context's labels leave while the (opaque) lens still covers the source; closing: they
    // come back only after the lens has landed on the source, so no text is ever doubled at an offset
    const wipe = u < W.close[0] ? 1 - ease.inOutSine(seg(u, ...W.wipeOut)) : ease.inOutSine(seg(u, ...W.ctxTextIn));
    nodes['ctx-text'] = {opacity: wipe > 0 ? 1 : 0};
    nodes['ctx-wipe-rect'] = {width: r((L.st.w + 60) * wipe)};

    // --- captions, annotation, marker
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption) * (1 - seg(u, ...W.captionOut)) + seg(u, ...W.captionIn), 3)};
    if (L.thumbTag) nodes['thumb-tag'] = {opacity: r(clamp((lp - 0.85) / 0.15), 3)};
    if (L.beforeChip) {
      const annOut = seg(u, ...W.annOut);
      nodes.ann = {opacity: r(seg(u, ...W.before) * (1 - annOut), 3), transform: `translate(0 ${r(-16 * annOut)})`};
      nodes['ann-before'] = {opacity: r(1 - 0.45 * seg(u, ...W.strike), 3)};
      const drawnLen = seg(u, ...W.strike) * (L.strikes.length ? L.strikes[0].total : 0);
      L.strikes.forEach((k, i) => { nodes[`ann-strike${i}`] = {'stroke-dashoffset': r(k.len - clamp(drawnLen - k.start, 0, k.len))}; });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
    }
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};

    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const lensDone = isDate ? swapP >= 1 && slideP >= 1 : swapP >= 1;
    const datum = swapP <= 0 ? 'before' : lensDone ? 'after' : 'changing';
    const lsem = lensPose.semantic, csem = ctxPose.semantic;
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        contextScale: r(ck, 3),
        datum,
        contextDatum: upd <= 0 ? 'before' : upd >= 1 ? 'after' : 'changing',
        focusTarget: L.target,
        lensCard: lsem.card,
        contextCard: csem.card,
        lensLayer: hlP < 0.5 ? L.sel : L.after,
        contextLayer: (isDate ? upd : 0) < 0.5 ? L.sel : L.after,
        source: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
        lensWindow: {x: rect.x, y: rect.y, w: rect.width, h: rect.height},
        lensSourceInView: {x: r(Sd.x), y: r(Sd.y), w: r(Sd.w), h: r(Sd.h)},
        contextOrigin: {x: r(L.full.x), y: r(L.full.y)},
        // what covers the detail during the return: the (opaque) lens and/or the context's own labels (wipe progress)
        lensAlpha: lensVis ? r(lensAlpha, 3) : 0,
        contextText: r(clamp(wipe), 3),
        allReached: lsem.allReached && csem.allReached,
      },
    };
  },
};

/**
 * Grow a region to the given aspect (w/h) inside `lim`: downward first (or
 * evenly up and down for 'centre') when more height is needed, leftward first
 * when more width is needed. The original region stays inside the result.
 */
function growTo(b, aspect, lim, mode) {
  let {x, y, w, h: hh} = b;
  if (w / hh > aspect) {
    let add = w / aspect - hh;
    if (mode === 'centre') {
      const up0 = Math.min(add / 2, y - lim.y);
      y -= up0; hh += up0; add -= up0;
    }
    const down = Math.min(add, lim.y + lim.h - (y + hh));
    hh += down; add -= down;
    const up = Math.min(add, y - lim.y);
    y -= up; hh += up;
  } else {
    let add = hh * aspect - w;
    const left = Math.min(add, x - lim.x);
    x -= left; w += left; add -= left;
    w += Math.min(add, lim.x + lim.w - (x + w));
  }
  return {x, y, w, h: hh};
}

/**
 * Grow a region to at least `minW` × `minH` inside `lim`: widths evenly left and right
 * ('centre') or leftward first, heights downward first ('down') or evenly up and down.
 * The original region stays inside the result.
 */
function growMin(b, minW, minH, lim, mode) {
  let {x, y, w, h: hh} = b;
  if (w < minW) {
    let add = minW - w;
    const left0 = Math.min(mode === 'centre' ? add / 2 : add, x - lim.x);
    x -= left0; w += left0; add -= left0;
    const right = Math.min(add, lim.x + lim.w - (x + w));
    w += right; add -= right;
    const left1 = Math.min(add, x - lim.x);
    x -= left1; w += left1;
  }
  if (hh < minH) {
    let add = minH - hh;
    if (mode === 'centre') {
      const up0 = Math.min(add / 2, y - lim.y);
      y -= up0; hh += up0; add -= up0;
    }
    const down = Math.min(add, lim.y + lim.h - (y + hh));
    hh += down; add -= down;
    const up = Math.min(add, y - lim.y);
    y -= up; hh += up;
  }
  return {x, y, w, h: hh};
}

/**
 * Two-line chip: `head` on the first line and the whole `value` on the second, both at one
 * shared size (30 → 26), styled like `chip`. Returns null when either part needs more than
 * one line at 26 (the caller then wraps normally). The result mirrors `chip` ({node, box, fit}).
 */
function labelValueChip(ctx, head, value, o) {
  for (let size = 30; size >= 26; size -= 1) {
    const padX = size * 0.6, padY = size * 0.38;
    const fo = {maxWidth: o.maxWidth - padX * 2, size, minSize: size, maxLines: 1, weight: 600, family: 'sans'};
    const a = ctx.fit(head, fo), b = ctx.fit(value, fo);
    if (a.truncated || b.truncated || a.lines.length !== 1 || b.lines.length !== 1) continue;
    const lineHeight = size * 1.18;
    const fit = {lines: [a.lines[0], b.lines[0]], size, lineHeight, width: Math.max(a.width, b.width), height: lineHeight + size,
      truncated: false, full: `${head} ${value}`, weight: 600, family: 'sans'};
    const w = fit.width + padX * 2, hh = fit.height + padY * 2;
    const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
    const node = g({name: o.name},
      h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.7)), fill: o.fill ?? ctx.theme.card, stroke: o.stroke ?? ctx.theme.ink, 'stroke-width': 2}),
      textBlock(fit, {x: x + w / 2, y: o.y + padY, anchor: 'middle', fill: ctx.theme.ink}),
    );
    return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}, fit};
  }
  return null;
}

/** Choose the two cone lines joining the source and the lens window. */
function coneCorners(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x;
    const rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y;
  const ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-03-inspect',
    title: 'History of a provision — inspect the date on the rail',
    titleEs: 'Historial de una norma — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Historial de una norma',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The reading station shrinks to a context thumbnail while a real enlarged copy of the date rail opens: the research card sits between the start of the marked layer and the start of the later layer. One datum is replaced inside the lens (the selected date, moving the card into the layer the author marks for it, or the wording of the marked layer); the old value stays readable, and the context returns with the new datum and a changed marker.',
    tags: ['legal research', 'versions', 'inspect', 'lens', 'date', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/historial-de-una-norma.js', 'src/animations/research/kits/historial-fields.js', 'src/primitives/annotate.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
