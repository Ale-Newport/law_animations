/**
 * LAW-0136 — Ámbito temporal · inspect
 *
 * Storyboard:
 *  0.00–0.20  build: the desk in the state produced by the action — the
 *             article card set against the timeline ruler, its tape laid over
 *             the supplied interval, fact cards around the ruler with their
 *             inside / outside / not-classified strips. A caption names the
 *             context.
 *  0.20–0.45  isolate: the desk shrinks into a thumbnail (kept visible, the
 *             source region outlined) while a REAL enlarged copy of the
 *             distinguishing detail opens beside it — the end of the tape
 *             with the pins and cards next to it (or, for `factDay`, the pin
 *             and card of the focus fact).
 *  0.45–0.75  substitute: one supplied datum changes inside the lens only —
 *             `intervalEnd`: the tape clip slides from the old end day to the
 *             new one (a dashed ghost keeps the old end traceable) and only the
 *             facts it passes change their position-only state; `factDay`: the
 *             focus fact's pin slides to the new day, its day chip is swapped
 *             and its strip follows. One editorial annotation keeps the old
 *             value readable (struck, before → after).
 *  0.75–1.00  return: the lens closes onto its source, the desk grows back and
 *             shows the new datum; a "datum changed" marker stays pinned to it.
 *             Seeking back restores the old datum exactly. No validity,
 *             effect or outcome is inferred.
 * @module animations/sources/LAW-0136
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, num, obj, oneOf, str} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {scopeFields, SCOPE_DEFAULTS, SCOPE_STRINGS, scopeData, scopeDesk, DESK, factState, bestSpot, overlaps, segmentHitsBox, stateColors} from './kits/ambito-temporal.js';

const ID = 'LAW-0136';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], captionOut: [0.2, 0.25], open: [0.22, 0.42], wipeOut: [0.228, 0.248], before: [0.42, 0.435],
  strike: [0.47, 0.52], ghost: [0.48, 0.53], swap: [0.49, 0.57], slide: [0.52, 0.66], states: [0.6, 0.68], after: [0.58, 0.64],
  annOut: [0.755, 0.77], close: [0.77, 0.86], lensClose: [0.77, 0.835], ctxUpdate: [0.785, 0.83], ctxTextIn: [0.86, 0.872], lensOut: [0.885, 0.9],
  captionIn: [0.88, 0.93], marker: [0.88, 0.94],
};

const sceneSchema = {
  ...scopeFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the supplied END of the interval, or the supplied DAY of one fact', ['intervalEnd', 'factDay']),
  focusFact: int('For focusTarget "factDay": index of the fact whose day is substituted', 0, 4),
  beforeValue: int('Supplied day shown before the substitution (replaces interval.end, or the focus fact\'s day)', -99, 1000),
  afterValue: int('Alternative supplied day after the substitution', -99, 1000),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  ...SCOPE_DEFAULTS,
  focusTarget: 'intervalEnd',
  focusFact: 2,
  beforeValue: 13,
  afterValue: 10,
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Article laid over the supplied interval', marker: 'Datum changed'},
};

const STRINGS = {
  en: {...SCOPE_STRINGS.en, context: 'Context', endLabel: 'Supplied end', dayLabel: 'Day of'},
  es: {...SCOPE_STRINGS.es, context: 'Contexto', endLabel: 'Fin aportado', dayLabel: 'Día de'},
};

/**
 * Design spaces: the full desk plus room for the lens beside / above the
 * thumbnail. Landscape: thumbnail at the left, level with the lens; square:
 * lens across the top, thumbnail bottom-left, annotation beside it;
 * portrait: lens on top, annotation under it, thumbnail below.
 */
const LAYOUT = {
  // landscape: a small context thumbnail at the left, the lens over the rest of the box (≈ 80 % of it)
  landscape: {axis: 'horizontal', size: [2040, 980], top: 66, thumbK: 0.19, thumbMiddle: true, lens: {x: 396, y: 10, w: 1634, h: 960}, annSize: 36},
  // (square: the full context desk is shown 12 % larger so its fact text stays ≥ 16 px at 1080p)
  square: {axis: 'square', size: [1120, 1080], top: 66, thumbK: 0.3, fullK: 1.12, lens: {x: 12, y: 12, w: 1096, h: 790}},
  portrait: {axis: 'vertical', size: [920, 1560], top: 66, thumbK: 0.3, lens: {x: 10, y: 20, w: 900, h: 1080}},
};

/** Grow a rectangle (clamped to `lim`) until it has the aspect `ar`. */
function growTo(src, ar, lim) {
  let {x, y, w, h: hh} = src;
  if (w / hh < ar) {
    const nw = Math.min(lim.w, hh * ar);
    x = clamp(x + w / 2 - nw / 2, lim.x, lim.x + lim.w - nw);
    w = nw;
    if (w / hh < ar - 0.01) { const nh = w / ar; y = clamp(y + hh / 2 - nh / 2, lim.y, lim.y + lim.h - nh); hh = nh; }
  } else {
    const nh = Math.min(lim.h, w / ar);
    y = clamp(y + hh / 2 - nh / 2, lim.y, lim.y + lim.h - nh);
    hh = nh;
    if (w / hh > ar + 0.01) { const nw = hh * ar; x = clamp(x + w / 2 - nw / 2, lim.x, lim.x + lim.w - nw); w = nw; }
  }
  return {x, y, w, h: hh};
}

function coneCorners(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x, rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y, ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
}

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const C = stateColors(ctx);
    const Lo = LAYOUT[ctx.view.shape];
    const st = DESK[Lo.axis];
    const S = {w: Lo.size[0], h: Lo.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const target = p.focusTarget;
    const fi = Math.max(0, Math.min(p.facts.length - 1, p.focusFact));
    // the scene's data carry the BEFORE datum; the substitution moves it to the AFTER datum
    const pBefore = target === 'intervalEnd'
      ? {...p, interval: {...p.interval, end: p.beforeValue}}
      : {...p, facts: p.facts.map((f, i) => (i === fi ? {...f, day: p.beforeValue} : f))};
    const d = scopeData(pBefore);
    const cl = v => Math.max(d.from, Math.min(d.to, v));
    const beforeV = target === 'intervalEnd' ? d.end : d.facts[fi].day;
    const afterV = cl(p.afterValue);
    const swap = target === 'intervalEnd'
      ? {kind: 'intervalEnd', beforeEnd: beforeV, afterEnd: Math.max(d.start, afterV)}
      : {kind: 'factDay', fact: fi, beforeDay: beforeV, afterDay: afterV};
    // (square: wider fact cards, so long fact labels keep 3 lines at ≥ 16 px in the context view)
    // frame pixels per desk unit in the full context view (the desk sizes its text from it)
    const pxu = s * (Lo.fullK ?? 1) * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
    const mk = (prefix, c2 = ctx) => scopeDesk(c2, {prefix, axis: Lo.axis, d, arms: false, placed: true, swap, factW: {square: 210}, pxu, standGroups: true, plateFree: true});
    const ctxDesk = mk('cx');
    const lensDesk = mk('ln');
    // text-free twin shown while the desk is a thumbnail (labels there would be a few pixels high)
    const bare = mk('cb', {...ctx, show: () => false});
    const geo = ctxDesk.geo;
    const hor = geo.hor;

    // states before / after (position only; a boundary day stays not classified)
    const endAfter = target === 'intervalEnd' ? swap.afterEnd : d.end;
    const statesBefore = d.facts.map(f => f.state);
    const statesAfter = d.facts.map((f, i) => factState(target === 'factDay' && i === fi ? afterV : f.day, f.forced ? 'not-classified' : 'auto', d.start, endAfter));

    // ---- source region (desk coordinates): the ruler around the old and new datum, the WHOLE article card
    // (its printed interval is substituted too) and the WHOLE fact cards next to it; it never cuts a card.
    // It may grow into the free desk between the stand and the ruler, never into the stand.
    const a0 = geo.along(Math.min(beforeV, afterV)), a1 = geo.along(Math.max(beforeV, afterV));
    const padA = geo.perUnit * 1.2 + 20;
    const cardB = ctxDesk.cardDestBox;
    const winLim = {x: 4, y: 4, w: st.w - 8, h: ctxDesk.winH - 8};
    const factsFar = hor ? Math.max(...ctxDesk.factBoxes.map(b => b.y + b.h)) + 14 : Math.max(...ctxDesk.factBoxes.map(b => b.x + b.w)) + 14;
    /** source region + open-lens rectangle for a given lens box */
    const fitLens = A => {
      let src = hor
        ? {x: Math.min(a0 - padA, cardB.x - 14), y: cardB.y - 14, w: 0, h: factsFar - (cardB.y - 14)}
        : {x: cardB.x - 14, y: Math.min(a0 - padA, cardB.y - 14), w: factsFar - (cardB.x - 14), h: 0};
      if (hor) src.w = Math.max(a1 + padA, cardB.x + cardB.w + 14) - src.x;
      else src.h = Math.max(a1 + padA, cardB.y + cardB.h + 14) - src.y;
      const topLim = ctxDesk.standBottom + 8;
      const lim = {x: winLim.x, y: Math.min(src.y, Math.max(winLim.y, topLim)), w: winLim.w, h: 0};
      lim.h = winLim.y + winLim.h - lim.y;
      const availH = A.h;
      // cards that matter to the substitution (the focus fact, a card whose state changes, or one centred in
      // the region) are always whole; a neighbour card may be cropped by the lens edge like under a real glass
      const mustShow = i => (target === 'factDay' && i === fi) || statesBefore[i] !== statesAfter[i];
      const includeCards = () => {
        for (const [i, b] of ctxDesk.factBoxes.entries()) {
          const hit = src.x < b.x + b.w && src.x + src.w > b.x && src.y < b.y + b.h && src.y + src.h > b.y;
          if (!hit) continue;
          const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
          const centred = cx >= src.x && cx <= src.x + src.w && cy >= src.y && cy <= src.y + src.h;
          if (!centred && !mustShow(i)) continue;
          const x = Math.min(src.x, b.x - 10), y = Math.min(src.y, b.y - 10);
          src = {x, y, w: Math.max(src.x + src.w, b.x + b.w + 10) - x, h: Math.max(src.y + src.h, b.y + b.h + 10) - y};
        }
        src = {x: Math.max(src.x, winLim.x), y: Math.max(src.y, winLim.y), w: Math.min(src.w, winLim.x + winLim.w - Math.max(src.x, winLim.x)), h: Math.min(src.h, winLim.y + winLim.h - Math.max(src.y, winLim.y))};
      };
      includeCards();
      for (let it = 0; it < 3; it++) {
        const before = JSON.stringify(src);
        src = growTo(src, A.w / availH, lim);
        includeCards();
        if (JSON.stringify(src) === before) break;
      }
      // the article card is never cropped by the lens (its printed interval is part of the substitution)
      {
        const cb = {x: cardB.x - 14, y: cardB.y - 14, w: cardB.w + 28, h: cardB.h + 28};
        const x0 = Math.max(winLim.x, Math.min(src.x, cb.x)), y0 = Math.max(winLim.y, Math.min(src.y, cb.y));
        src = {x: x0, y: y0, w: Math.min(winLim.x + winLim.w, Math.max(src.x + src.w, cb.x + cb.w)) - x0, h: Math.min(winLim.y + winLim.h, Math.max(src.y + src.h, cb.y + cb.h)) - y0};
      }
      // no half-cut neighbour card at the lens edge (a lone "3" could read as a day): a neighbour card that is
      // only partly inside is trimmed away along the ruler, unless that would cut the article card or the datum
      {
        const core = {x0: hor ? Math.min(cardB.x, a0) - 10 : 0, x1: hor ? Math.max(cardB.x + cardB.w, a1) + 10 : 0,
          y0: hor ? 0 : Math.min(cardB.y, a0) - 10, y1: hor ? 0 : Math.max(cardB.y + cardB.h, a1) + 10};
        for (const [i, b] of ctxDesk.factBoxes.entries()) {
          if (mustShow(i)) continue;
          const in0 = hor ? b.x >= src.x && b.x + b.w <= src.x + src.w : b.y >= src.y && b.y + b.h <= src.y + src.h;
          const hit = src.x < b.x + b.w && src.x + src.w > b.x && src.y < b.y + b.h && src.y + src.h > b.y;
          if (in0 || !hit) continue;
          // (when trimming would cut the core, the neighbour card is taken in whole instead)
          const grow = () => { const x = Math.min(src.x, b.x - 10), y = Math.min(src.y, b.y - 10); src = {x, y, w: Math.max(src.x + src.w, b.x + b.w + 10) - x, h: Math.max(src.y + src.h, b.y + b.h + 10) - y}; };
          if (hor) {
            if (b.x + b.w / 2 < src.x + src.w / 2) { const nx = b.x + b.w + 10; if (nx <= core.x0) { src.w -= nx - src.x; src.x = nx; } else grow(); }
            else { const nr = b.x - 10; if (nr >= core.x1) src.w = nr - src.x; else grow(); }
          } else if (b.y + b.h / 2 < src.y + src.h / 2) { const ny = b.y + b.h + 10; if (ny <= core.y0) { src.h -= ny - src.y; src.y = ny; } else grow(); }
          else { const nb = b.y - 10; if (nb >= core.y1) src.h = nb - src.y; else grow(); }
        }
      }
      // the lens edges along the ruler fall between two printed numbers (never through one): each edge moves
      // outward to the next gap when there is room, else inward
      {
        const R0 = ctxDesk.R, ns = R0.numSize ?? 22;
        let step = Math.max(1, d.step);
        while (geo.perUnit * step < ns * 2.1) step++;
        const spans = [];
        for (let day = d.from; day <= d.to; day += step) {
          const a = geo.along(day), half = (String(day).length * ns * 0.62) / 2 + 6;
          spans.push([a - half, a + half]);
        }
        const inSpan = v => spans.find(([a, b]) => v > a && v < b);
        const lo0 = hor ? winLim.x : winLim.y, hi0 = hor ? winLim.x + winLim.w : winLim.y + winLim.h;
        let e0 = hor ? src.x : src.y, e1 = hor ? src.x + src.w : src.y + src.h;
        const sp0 = inSpan(e0);
        if (sp0) e0 = sp0[0] - 2 >= lo0 ? sp0[0] - 2 : sp0[1] + 2;
        const sp1 = inSpan(e1);
        if (sp1) e1 = sp1[1] + 2 <= hi0 ? sp1[1] + 2 : sp1[0] - 2;
        if (hor) src = {...src, x: e0, w: e1 - e0}; else src = {...src, y: e0, h: e1 - e0};
      }
      const zk = Math.max(p.detailGeometry.zoom, 1.5);
      let dw = Math.min(A.w, src.w * zk, availH * (src.w / src.h));
      let dh = dw * (src.h / src.w);
      if (dh > availH) { dh = availH; dw = dh * (src.w / src.h); }
      return {src, dest: {x: A.x + (A.w - dw) / 2, y: A.y + Math.max(0, (availH - dh) / 2), w: dw, h: dh}};
    };
    // landscape: thumbnail at the left and the lens beside it, or — for a wide region — the thumbnail in the
    // top-left corner and a full-width lens under it; the larger lens wins
    let fitted = fitLens(Lo.lens);
    let thumbTop = false;
    if (Lo.thumbMiddle) {
      const thH0 = st.h * Lo.thumbK;
      const alt = fitLens({x: 12, y: thH0 + 72, w: S.w - 24, h: S.h - thH0 - 82});
      if (alt.dest.w * alt.dest.h > fitted.dest.w * fitted.dest.h * 1.08) { fitted = alt; thumbTop = true; }
    }
    const src = fitted.src;
    const dest = fitted.dest;
    const kz = dest.w / src.w;
    /** desk point → its place inside the open lens */
    const inLens = q => ({x: dest.x + (q.x - src.x) * kz, y: dest.y + (q.y - src.y) * kz});
    const boxInLens = b => { const q = inLens(b); return {x: q.x, y: q.y, w: b.w * kz, h: b.h * kz}; };

    // ---- thumbnail / full placement (the thumbnail sits beside or under the lens, never on it)
    const tk = Lo.thumbK;
    const thW = st.w * tk, thH = st.h * tk;
    const thumb = thumbTop ? {x: 16, y: 60, k: tk} : Lo.thumbMiddle
      ? {x: Math.max(12, (dest.x - thW) / 2), y: clamp(dest.y + dest.h / 2 - thH / 2, 60, S.h - thH - 12), k: tk}
      : ctx.view.shape === 'portrait' ? {x: (S.w - thW) / 2, y: clamp(dest.y + dest.h + 70, 0, S.h - thH - 12), k: tk} : {x: 16, y: clamp(dest.y + dest.h + 64, 0, S.h - thH - 12), k: tk};
    const fullK = Lo.fullK ?? 1;
    const full = {x: (S.w - st.w * fullK) / 2, y: Lo.top, k: fullK};
    // text hierarchy: generic captions (context caption, tags, marker, before/after chips) never exceed the
    // smallest fact text as it appears in the same view (full desk: × full.k; lens: × lens zoom)
    const fSize = ctxDesk.factSize ?? 99;
    const capFull = v => Math.min(v, fSize * full.k);

    // ---- context caption + thumbnail tag
    const ctxCap = ctx.show('all') ? (() => {
      const text = `${t.context}: ${p.contextLabels.context}`;
      const one = caption(ctx, text, {x: full.x + 16, y: 12, maxWidth: st.w * full.k - 32, size: capFull(32), minSize: capFull(25), maxLines: 1, name: 'ctx-caption', weight: 600});
      return one.fit.truncated ? caption(ctx, text, {x: full.x + 16, y: 4, maxWidth: st.w * full.k - 32, size: capFull(25), minSize: capFull(20), maxLines: 2, name: 'ctx-caption', weight: 600}) : one;
    })() : null;
    const thumbTag = ctx.show('key')
      ? (Lo.thumbMiddle
        ? chip(ctx, t.context, {x: thumb.x, y: thumb.y - 50, anchor: 'start', maxWidth: 300, size: capFull(26), maxLines: 1, name: 'thumb-tag', fill: th.card})
        : chip(ctx, t.context, {x: thumb.x + thW + 14, y: thumb.y + thH - 46, anchor: 'start', maxWidth: 300, size: capFull(26), maxLines: 1, name: 'thumb-tag', fill: th.card}))
      : null;

    // ---- the single editorial annotation: before → after (old value kept, struck), placed INSIDE the lens
    // in free desk space next to the changed marker and tied to it by a leader; never on a card, the
    // ruler, a pin thread or the lens edge. (Fallback: under the lens, still with the leader.)
    const valLabel = target === 'intervalEnd' ? t.endLabel : `${t.dayLabel} ${d.facts[fi].label}`;
    const markerAt = v => (target === 'intervalEnd'
      ? inLens(hor ? {x: geo.along(v), y: geo.e0 - 12} : {x: geo.e0 - 12, y: geo.along(v)})
      : inLens(geo.at(v, ctxDesk.R.thick / 2 - 13)));
    const lensObst = [
      ...ctxDesk.factBoxes, ctxDesk.cardDestBox, ctxDesk.standBox, ...ctxDesk.standComps,
      {x: geo.box.x - 14, y: geo.box.y - 14, w: geo.box.w + 28, h: geo.box.h + 28},
      ...ctxDesk.pins.map((q, i) => { const an = ctxDesk.anchors[i]; return {x: Math.min(q.x, an.x) - 6, y: Math.min(q.y, an.y) - 6, w: Math.abs(q.x - an.x) + 12, h: Math.abs(q.y - an.y) + 12}; }),
    ].map(boxInLens);
    let beforeChip = null, afterChip = null, arrowD = null, annBox = null, annInside = false;
    if (ctx.show('key')) {
      const size = Math.min(Lo.annSize ?? 30, fSize * kz);
      const mk = (text, x, y, o2 = {}) => chip(ctx, text, {x, y, anchor: 'start', maxWidth: o2.mw, size, minSize: Math.min(24, size), maxLines: 2, ...o2});
      const textB = `${valLabel}: ${d.dayText(beforeV)}`, textA = `${valLabel}: ${d.dayText(afterV)}`;
      const mA = markerAt(afterV), mB = markerAt(beforeV);
      const aim = {x: (mA.x + mB.x) / 2, y: (mA.y + mB.y) / 2};
      const inner = {x: dest.x + 14, y: dest.y + 14, w: dest.w - 28, h: dest.h - 28};
      // two arrangements: side by side (before → after) or stacked (before ↓ after); widest chips first
      const layouts = [];
      for (const mw of [620, 480, 380, 300, 240, 200]) {
        const pb = mk(textB, 0, 0, {mw}), pa = mk(textA, 0, 0, {mw});
        const gap = 56;
        layouts.push({kind: 'row', mw, w: pb.box.w + gap + pa.box.w, h: Math.max(pb.box.h, pa.box.h), pb, pa, gap});
        layouts.push({kind: 'col', mw, w: Math.max(pb.box.w, pa.box.w), h: pb.box.h + 44 + pa.box.h, pb, pa, gap: 44});
      }
      let best = null;
      for (const Lk of layouts) {
        const sp = bestSpot(Lk.w, Lk.h, [inner], lensObst, aim, {pad: 12, noLeader: true, step: 10});
        if (!sp) continue;
        const b = {x: sp.x, y: sp.y, w: Lk.w, h: Lk.h};
        const dist = Math.hypot(Math.max(b.x - aim.x, 0, aim.x - b.x - b.w), Math.max(b.y - aim.y, 0, aim.y - b.y - b.h));
        const score = dist + (Lk.kind === 'col' ? 20 : 0) + (620 - Lk.mw) * 0.2;
        if (!best || score < best.score) best = {score, Lk, b};
      }
      let Lk, b;
      if (best) { ({Lk, b} = best); annInside = true; } else {
        Lk = layouts[0];
        b = {x: clamp(dest.x + dest.w / 2 - Lk.w / 2, 12, S.w - Lk.w - 12), y: Math.min(S.h - Lk.h - 8, dest.y + dest.h + 20), w: Lk.w, h: Lk.h};
      }
      annBox = b;
      if (Lk.kind === 'row') {
        const cy = b.y + b.h / 2;
        beforeChip = mk(textB, b.x, cy - Lk.pb.box.h / 2, {mw: Lk.mw, fill: th.card, name: 'ann-before'});
        afterChip = mk(textA, b.x + Lk.pb.box.w + Lk.gap, cy - Lk.pa.box.h / 2, {mw: Lk.mw, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ax = b.x + Lk.pb.box.w + Lk.gap / 2;
        arrowD = `M${r(ax - 14)} ${r(cy)}h24m-10 -9l10 9l-10 9`;
      } else {
        const cx = b.x + b.w / 2;
        beforeChip = mk(textB, cx - Lk.pb.box.w / 2, b.y, {mw: Lk.mw, fill: th.card, name: 'ann-before'});
        afterChip = mk(textA, cx - Lk.pa.box.w / 2, b.y + Lk.pb.box.h + Lk.gap, {mw: Lk.mw, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        const ay = b.y + Lk.pb.box.h + Lk.gap / 2;
        arrowD = `M${r(cx)} ${r(ay - 14)}v26m-10 -11l10 11l10 -11`;
      }
    }
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

    // ---- changed-datum marker, pinned to the new datum in the full desk
    // (on the clip's outer end, off the ruler, so the marker never covers a printed number)
    const pinLocal = target === 'intervalEnd' ? (hor ? {x: geo.along(swap.afterEnd), y: geo.e0 - 30} : {x: geo.e0 - 30, y: geo.along(swap.afterEnd)}) : geo.at(afterV, ctxDesk.R.thick / 2 - 13);
    const mk2 = {x: full.x + pinLocal.x * full.k, y: full.y + pinLocal.y * full.k};
    let markChip = null;
    if (ctx.show('key')) {
      // the supplied marker label is always drawn: the nearest free spot on the desk (wider / taller variants
      // and a longer leader are tried when the desk is crowded)
      const toDesign = b => ({x: full.x + b.x * full.k, y: full.y + b.y * full.k, w: b.w * full.k, h: b.h * full.k});
      const obst = [...[...ctxDesk.factBoxes, ctxDesk.cardDestBox, ctxDesk.standBox, ...ctxDesk.standComps, geo.box].map(toDesign),
        {x: mk2.x - 23, y: mk2.y - 23, w: 46, h: 46}];
      const deskZone = {x: full.x + 8, y: full.y + 8, w: st.w * full.k - 16, h: ctxDesk.winH * full.k - 16};
      outer: for (const [mw, zr, maxLead] of [[300, 380, 260], [220, 380, 260], [300, 700, 420], [180, 700, 420], [150, 1400, 700]]) {
        const probe = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: mw, size: capFull(26), maxLines: 3});
        const zx = Math.max(deskZone.x, mk2.x - zr), zy = Math.max(deskZone.y, mk2.y - zr);
        const zone = {x: zx, y: zy, w: Math.min(deskZone.x + deskZone.w, mk2.x + zr) - zx, h: Math.min(deskZone.y + deskZone.h, mk2.y + zr) - zy};
        const sp = bestSpot(probe.box.w, probe.box.h, [zone], obst, mk2, {pad: 10, minLead: 30, maxLead});
        if (sp) { markChip = chip(ctx, p.contextLabels.marker, {x: sp.x, y: sp.y, anchor: 'start', maxWidth: mw, size: capFull(26), maxLines: 3, fill: th.card, stroke: th.accent2, name: 'marker-chip'}); break outer; }
      }
    }
    const leadTo = b => ({x: clamp(mk2.x, b.x, b.x + b.w), y: mk2.y < b.y ? b.y : mk2.y > b.y + b.h ? b.y + b.h : b.y + b.h / 2});
    // (the chip lies under the disc, and never on it: the disc is an obstacle when the chip is placed)
    const marker = g({name: 'marker', opacity: 0},
      markChip && (() => { const q = leadTo(markChip.box); return h('line', {x1: r(mk2.x), y1: r(mk2.y), x2: r(q.x), y2: r(q.y), stroke: th.accent2, 'stroke-width': 3}); })(),
      markChip && markChip.node,
      h('circle', {name: 'marker-disc', cx: mk2.x, cy: mk2.y, r: 17, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      // neutral "changed" glyph (a delta), never a tick / check mark: the marker states a change, not an approval
      h('path', {name: 'marker-glyph', d: `M${r(mk2.x)} ${r(mk2.y - 8)}L${r(mk2.x + 8)} ${r(mk2.y + 6)}H${r(mk2.x - 8)}Z`, fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linejoin': 'round'}),
    );
    // stand compartments (with their books) that the lens region would cut are left out of the lens copy: the
    // lens shows whole compartments or none (never a sliced plate or title)
    const lensHide = lensDesk.standComps.map((c, lv) => {
      const b = {x: c.x, y: c.y, w: c.w + 8, h: c.h + 12};
      const hit = b.x < src.x + src.w && b.x + b.w > src.x && b.y < src.y + src.h && b.y + b.h > src.y;
      const inside = b.x >= src.x && b.y >= src.y && b.x + b.w <= src.x + src.w && b.y + b.h <= src.y + src.h;
      return hit && !inside ? lv : -1;
    }).filter(lv => lv >= 0);
    return {S, s, ox, oy, st, d, ctxDesk, lensDesk, bare, src, dest, lensHide, thumb, full, ctxCap, thumbTag, beforeChip, afterChip, strikes, arrowD, marker, annBox, annInside, markerAt, lensObst,
      target, fi, beforeV, afterV, swap, statesBefore, statesAfter, geo};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const st = L.st;
    const S = L.src;
    const winH = L.ctxDesk.winH;
    const hole = `M0 0h${st.w}v${winH}h${-st.w}Z M${r(S.x)} ${r(S.y)}v${r(S.h)}h${r(S.w)}v${r(-S.h)}Z`;
    const strike = L.strikes.map((k, i) => h('line', {name: `ann-strike${i}`, x1: r(k.x1), x2: r(k.x2), y1: r(k.y), y2: r(k.y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(k.len)} ${r(k.len + 10)}`, 'stroke-dashoffset': r(k.len)}));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctx'},
        L.bare.node,
        // the labelled desk is swapped with its text-free twin by a WIPE (never an opacity cross-fade)
        h('defs', null, h('clipPath', {id: ctx.id('ctx-wipe')}, h('rect', {name: 'ctx-wipe-rect', x: -30, y: -60, width: st.w + 60, height: st.h + 120}))),
        g({name: 'ctx-text', 'clip-path': ctx.ref('ctx-wipe')}, L.ctxDesk.node),
        h('path', {name: 'ctx-dim', d: hole, 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
        h('path', {name: 'ctx-src', d: roundRectPath(S.x, S.y, S.w, S.h, 10), fill: 'none', stroke: th.accent, 'stroke-width': 7, opacity: 0}),
      ),
      L.thumbTag && L.thumbTag.node,
      h('line', {name: 'coneA', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'coneB', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {name: 'lens-cliprect', rx: 22}))),
      g({name: 'lens-win', opacity: 0},
        h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
        h('rect', {name: 'lens-bg', rx: 22, fill: th.woodTop}),
        g({'clip-path': ctx.ref('lens-clip')}, g({name: 'lens-content'}, L.lensDesk.node)),
        h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.accent, 'stroke-width': 5}),
      ),
      L.marker,
      L.beforeChip && g({name: 'ann', opacity: 0},
        h('line', {name: 'ann-lead', stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}),
        h('circle', {name: 'ann-lead-dot', r: 7, fill: th.accent2, stroke: th.card, 'stroke-width': 2.5}),
        L.beforeChip.node, strike,
        h('path', {d: L.arrowD, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const isEnd = L.target === 'intervalEnd';
    // --- context: full → thumbnail → full
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    const ck = lerp(L.full.k, L.thumb.k, lp);
    const cxp = lerp(L.full.x, L.thumb.x, lp), cyp = lerp(L.full.y, L.thumb.y, lp);
    nodes.ctx = {transform: T(cxp, cyp, 0, ck)};
    nodes['ctx-dim'] = {opacity: r(0.4 * lp, 3)};
    const lensVis = lp > 0.001 || (u >= W.close[0] && u < W.lensOut[1]);
    const lensAlpha = lp > 0.001 ? 1 : 1 - seg(u, ...W.lensOut);
    nodes['ctx-src'] = {opacity: lensVis ? r(lensAlpha, 3) : 0};
    // --- lens window: from the (moving) source to the destination, opaque while it moves
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

    // --- substitution inside the lens; the desk follows only on return (while the lens covers it)
    const swapP = seg(u, ...W.swap);
    const slideP = ease.inOutCubic(seg(u, ...W.slide));
    const stP = seg(u, ...W.states);
    const upd = seg(u, ...W.ctxUpdate);
    const geo = L.geo;
    const all1 = L.d.facts.map(() => 1);
    const poseFor = (desk, sw, sl, sp) => {
      const v = {classify: all1, strips: all1, swapP: sw, ghost: sw};
      if (isEnd) v.endA = lerp(geo.along(L.beforeV), geo.along(L.afterV), sl);
      else v.pinAlong = lerp(L.beforeV, L.afterV, sl);
      v.states = sp >= 0.5 ? L.statesAfter : L.statesBefore;
      // a flipping strip: fade the old one out and the new one in (never both at full strength)
      const flip = sp < 0.5 ? 1 - sp * 2 : sp * 2 - 1;
      v.strips = L.d.facts.map((f, i) => (L.statesBefore[i] === L.statesAfter[i] ? 1 : flip));
      v.classify = v.strips;
      return desk.pose(v);
    };
    const lensPose = poseFor(L.lensDesk, swapP, slideP, stP);
    const ctxPose = poseFor(L.ctxDesk, upd, ease.inOutCubic(upd), upd);
    const barePose = poseFor(L.bare, upd, ease.inOutCubic(upd), upd);
    Object.assign(nodes, lensPose.nodes, ctxPose.nodes, barePose.nodes);
    const wipe = u < W.close[0] ? 1 - ease.inOutSine(seg(u, ...W.wipeOut)) : ease.inOutSine(seg(u, ...W.ctxTextIn));
    nodes['ctx-text'] = {opacity: wipe > 0 ? 1 : 0};
    nodes['ctx-wipe-rect'] = {width: r((L.st.w + 60) * wipe)};

    // --- captions, annotation, marker
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption) * (1 - seg(u, ...W.captionOut)) + seg(u, ...W.captionIn), 3)};
    if (L.thumbTag) nodes['thumb-tag'] = {opacity: r(clamp((lp - 0.85) / 0.15), 3)};
    let lead = null;
    if (L.beforeChip) {
      const annOut = seg(u, ...W.annOut);
      // full contrast as soon as it is shown (a short fade once the lens is open, no dimming afterwards)
      nodes.ann = {opacity: r(seg(u, ...W.before) * (1 - annOut), 3)};
      nodes['ann-before'] = {opacity: 1};
      // the leader follows the marker as it slides from the old to the new datum
      const mk = L.markerAt(lerp(L.beforeV, L.afterV, slideP));
      const b = L.annBox;
      const from = {x: clamp(mk.x, b.x + 10, b.x + b.w - 10), y: clamp(mk.y, b.y, b.y + b.h)};
      if (mk.y > b.y && mk.y < b.y + b.h) from.x = mk.x < b.x ? b.x : b.x + b.w;
      lead = {from: {x: r(from.x), y: r(from.y)}, to: {x: r(mk.x), y: r(mk.y)}};
      nodes['ann-lead'] = {x1: lead.from.x, y1: lead.from.y, x2: lead.to.x, y2: lead.to.y};
      nodes['ann-lead-dot'] = {cx: lead.to.x, cy: lead.to.y};
      const drawnLen = seg(u, ...W.strike) * (L.strikes.length ? L.strikes[0].total : 0);
      L.strikes.forEach((kk, i) => { nodes[`ann-strike${i}`] = {'stroke-dashoffset': r(kk.len - clamp(drawnLen - kk.start, 0, kk.len))}; });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
    }
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    for (const lv of L.lensHide) nodes[`ln-comp${lv}`] = {opacity: 0};

    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = swapP <= 0 && slideP <= 0 ? 'before' : slideP >= 1 && swapP >= 1 && stP >= 1 ? 'after' : 'changing';
    const lensValue = r(lerp(L.beforeV, L.afterV, slideP), 3);
    const ctxValue = r(lerp(L.beforeV, L.afterV, ease.inOutCubic(upd)), 3);
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        contextScale: r(ck, 3),
        datum,
        contextDatum: upd <= 0 ? 'before' : upd >= 1 ? 'after' : 'changing',
        focusTarget: L.target,
        lensValue,
        contextValue: ctxValue,
        lensStates: lensPose.semantic.factStates,
        contextStates: ctxPose.semantic.factStates,
        statesBefore: L.statesBefore,
        statesAfter: L.statesAfter,
        changedFacts: L.statesBefore.map((x, i) => (x !== L.statesAfter[i] ? i : -1)).filter(i => i >= 0),
        tapeEnd: ctxPose.semantic.tapeEnd,
        source: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
        lensWindow: {x: rect.x, y: rect.y, w: rect.width, h: rect.height},
        lensSourceInView: {x: r(Sd.x), y: r(Sd.y), w: r(Sd.w), h: r(Sd.h)},
        lensAlpha: lensVis ? r(lensAlpha, 3) : 0,
        design: {w: L.S.w, h: L.S.h},
        ann: L.annBox ? {box: {x: r(L.annBox.x), y: r(L.annBox.y), w: r(L.annBox.w), h: r(L.annBox.h)}, inside: L.annInside, opacity: nodes.ann.opacity,
          beforeOpacity: nodes['ann-before'].opacity, lead,
          onContent: L.lensObst.filter(q => overlaps(q, L.annBox, -1)).length,
          onCones: [nodes.coneA, nodes.coneB].filter(c => c.opacity > 0 && segmentHitsBox({x: c.x1, y: c.y1}, {x: c.x2, y: c.y2}, L.annBox, 2)).length} : null,
        contextText: r(clamp(wipe), 3),
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
    slug: 'sources-04-inspect',
    title: 'Temporal scope — inspect the end of the supplied interval',
    titleEs: 'Ámbito temporal — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito temporal',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The desk after the article has been laid over the supplied interval shrinks to a thumbnail while a real enlarged copy of the end of the tape opens beside it. One supplied datum is substituted inside the lens (the end day of the interval, or the day of one fact); only the facts whose position changes relative to the interval change their strip, a dashed ghost keeps the old value traceable, and the desk returns with a changed-datum marker.',
    tags: ['sources', 'temporal scope', 'interval', 'lens', 'inspect', 'substitution', 'timeline', 'facts'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-temporal.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
