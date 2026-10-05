/**
 * LAW-0132 — Conflicto entre textos · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] build: the reading desk in the state produced by the action —
 *              the article already beside the open book, both tension
 *              phrases swept with highlighter, the zone of tension drawn and
 *              the supplied BEFORE state set on the seam (pennant pin for
 *              "conflict flagged"), with its "… · as supplied" tag.
 *  [0.20–0.45] isolate: a source ring settles on the focus detail (the Text 2
 *              phrase and the seam next to it). The desk shrinks into a
 *              corner thumbnail — the context miniature — while a large hand
 *              lens grows out of the ring; its glass is a REAL enlarged copy
 *              of the same scene coordinates, tied to the ring by cone lines.
 *  [0.45–0.75] substitute: inside the lens the old wording lifts out and is
 *              kept as a struck-through trace above the glass; the supplied
 *              alternative rises into the slot and the highlight re-sizes to
 *              it. Only the dependent state changes: the before-marker is
 *              lifted and the SUPPLIED after-state marker is set (reading
 *              proposed / compatible application / conflict flagged / not
 *              classified). Nothing is inferred from the new wording.
 *  [0.75–1.00] return: the lens shrinks back into the ring and the desk
 *              returns to full size; one editorial marker keeps the change
 *              traceable (“before” → “after”). Seeking back restores the old
 *              datum exactly (pure function of time).
 * @module animations/sources/LAW-0132
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {roundRectPath, dist} from '../../core/geometry.js';
import {inspectFields, obj, oneOf} from '../../schemas/fields.js';
import {chip, callout, statusTag} from '../../primitives/annotate.js';
import {
  conflictDesk, DESK, sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, kitT, stateLabel, zoneMode, ZONE_STATES,
  motifColors, tensionZone, flagPin, linkClip, cloneForLens, namesIn, mirror, placeCalloutWidths, boxesOverlap, segmentHits,
} from './kits/conflicto-entre-textos.js';

const ID = 'LAW-0132';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  hl: [0.02, 0.1], zone: [0.08, 0.16], marker: [0.13, 0.19], tagBefore: [0.15, 0.2],
  ring: [0.2, 0.24], shrink: [0.22, 0.38], open: [0.25, 0.41],
  swap: [0.47, 0.6], trace: [0.49, 0.56], liftMarker: [0.6, 0.65], afterMarker: [0.62, 0.68], afterZone: [0.62, 0.7],
  tagOut: [0.6, 0.64], tagAfter: [0.66, 0.72], lensState: [0.63, 0.68],
  close: [0.76, 0.86], grow: [0.76, 0.88], traceOut: [0.76, 0.8], mark: [0.87, 0.95],
};
const AFTER_STATES = [...ZONE_STATES, 'reading-proposed', 'not-classified'];
const MARKER = {'conflict-flagged': 'flag', 'compatible-application': 'clip', 'tension-highlighted': 'none', 'reading-proposed': 'pin', 'not-classified': 'pin'};

const sceneSchema = {
  ...sourcesFields,
  ...inspectFields(['tension-b', 'tension-a']),
  states: obj('States supplied by the author for the zone of tension before and after the substitution (never inferred from the wording)', {
    before: oneOf('Supplied state before the substitution', ZONE_STATES),
    after: oneOf('Supplied state after the substitution; "reading-proposed" is attributed to the first interpretation, "not-classified" shows that no state was supplied', AFTER_STATES),
  }, ['before', 'after']),
};
sceneSchema.focusTarget.description = 'Detail that is enlarged and substituted: the tension phrase of Text 2 (the article) or of Text 1 (the book)';
sceneSchema.beforeValue.description = 'Wording shown in the focused phrase slot before the substitution (the slot is located by the passage\'s tension phrase)';

const defaultParams = {
  ...SOURCES_DEFAULTS,
  focusTarget: 'tension-b',
  beforeValue: 'announced orally',
  afterValue: 'announced orally or in writing',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Context: the two provisions side by side', marker: 'Changed datum'},
  states: {before: 'conflict-flagged', after: 'reading-proposed'},
};

const LAYOUT = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
/** Big-lens region per layout: thumbnail scale, where the context label sits, lens centre and max radius (stage units). */
const LENS = {
  horizontal: {thumb: 0.3, label: 'below', c: [1180, 470], maxR: 400},
  square: {thumb: 0.3, label: 'below', c: [846, 500], maxR: 400},
  vertical: {thumb: 0.34, label: 'right', c: [520, 975], maxR: 330},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1120], portrait: [1000, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const C = motifColors(ctx);
    const t = kitT(ctx);
    const layout = LAYOUT[ctx.view.shape];
    const {W: SW, H: SH} = DESK[layout];
    const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s) / 2;
    const oy = (ctx.design.h - SH * s) / 2;
    const onB = p.focusTarget === 'tension-b';
    const beforeKind = MARKER[p.states.before];
    const st = conflictDesk(ctx, {
      prefix: 'st', layout, content: p, hierarchyLabel: t.hierarchy,
      phraseA: onB ? null : p.beforeValue, altA: onB ? null : p.afterValue, ringA: onB ? null : {letter: 'Δ', color: th.accent2, side: 'left'},
      phraseB: onB ? p.beforeValue : null, altB: onB ? p.afterValue : null, ringB: onB ? {letter: 'Δ', color: th.accent2} : null,
      marker: beforeKind === 'none' ? 'none' : beforeKind, zoneMode: zoneMode(p.states.before),
      assistant: false, reader: false, lens: false, parkedLens: false, note: true, chips: null, seedKey: 'cet-inspect',
      // the provision headings are named so the lens copy can leave out a heading it would cut
      provNames: true,
    });
    // text-free twin of the desk for the thumbnail (text is illegible at that size)
    const quietCtx = {...ctx, show: () => false};
    const thumbDesk = conflictDesk(quietCtx, {
      prefix: 'th', layout, content: p, hierarchyLabel: t.hierarchy,
      phraseA: onB ? null : p.beforeValue, altA: onB ? null : p.afterValue,
      phraseB: onB ? p.beforeValue : null, altB: onB ? p.afterValue : null,
      marker: beforeKind === 'none' ? 'none' : beforeKind, zoneMode: zoneMode(p.states.before),
      assistant: false, reader: false, lens: false, parkedLens: false, note: true, chips: null, seedKey: 'cet-inspect',
    });
    // --- dependent after-state art, in the same (desk) coordinates
    const afterKind = MARKER[p.states.after];
    const zoneGeom = st.zone;
    const za = {x1: st.phA.x + st.phA.w, y1: st.phA.y + 3, x2: st.phA.x + st.phA.w, y2: st.phA.y + st.phA.h - 3};
    const zb = {x1: st.phB.x, y1: st.phB.y + 3, x2: st.phB.x, y2: st.phB.y + st.phB.h - 3};
    const afterMode = p.states.after === 'reading-proposed' || p.states.after === 'not-classified' ? 'plain' : zoneMode(p.states.after);
    // with the book's phrase substituted, its highlight edge moves: the after-zone starts at the new edge
    const zaAfter = onB ? za : {...za, x1: st.bookPt(st.book.altBox).x + st.book.altBox.w, x2: st.bookPt(st.book.altBox).x + st.book.altBox.w};
    const afterZone = tensionZone(ctx, {name: 'az', a: zaAfter, b: zb, mode: afterMode});
    const pinColor = p.states.after === 'not-classified' ? '#8c959f' : th.accent2;
    let afterMarker = null;
    if (afterKind === 'flag') afterMarker = flagPin(ctx, {name: 'am', color: C.flag, s: st.G.flagS});
    else if (afterKind === 'pin') afterMarker = flagPin(ctx, {name: 'am', color: pinColor, s: st.G.flagS});
    else if (afterKind === 'clip') afterMarker = linkClip(ctx, {name: 'am', len: 104, vertical: true});
    const amAt = afterKind === 'clip' ? st.seam : {x: st.seam.x - 10 * (st.G.flagS ?? 1), y: st.seam.y};
    const extra = g(null, afterZone.node, afterMarker ? g({name: 'amg', transform: T(amAt.x, amAt.y), opacity: 0}, afterMarker.node) : null);

    // --- focus region (context coordinates)
    const ph = onB ? st.phB : st.phA;
    const altW = onB ? st.art.altBox.w : st.book.altBox.w;
    const x0 = onB ? st.seam.x - 24 : ph.x - 10;
    const x1 = onB ? ph.x + Math.max(ph.w, altW) + 10 : st.seam.x + 24;
    const f = {x: (x0 + x1) / 2, y: ph.y + ph.h / 2};
    const rs = Math.max(ph.h * 1.3, (x1 - x0) / 2 + 20);
    // the focused text's provision heading: wholly inside the lens window, or left out of the copy
    const pv = onB ? st.art.provBox : st.book.provBox;
    const pvO = onB ? {x: st.artFinal.x, y: st.artFinal.y} : {x: st.bookC.x, y: st.bookC.y};
    const headCorners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => ({x: pvO.x + pv.x + a * pv.w, y: pvO.y + pv.y + b * pv.h}));
    const headInLens = headCorners.every(q => Math.hypot(q.x - f.x, q.y - f.y) <= rs - 3);
    const headTouchesLens = headCorners.some(q => Math.hypot(q.x - f.x, q.y - f.y) < rs + 4) || (Math.max(...headCorners.map(q => q.y)) > f.y - rs && Math.min(...headCorners.map(q => q.x)) < f.x + rs && Math.max(...headCorners.map(q => q.x)) > f.x - rs && Math.min(...headCorners.map(q => q.y)) < f.y + rs);
    const hideHeadInLens = !headInLens && headTouchesLens ? `lz-st-${onB ? 'art' : 'book'}-prov` : null;
    // --- lens destination and context thumbnail (stage coordinates)
    const LG = LENS[layout];
    const place = p.detailGeometry.placement;
    let cx = LG.c[0], cy = LG.c[1];
    let corner = {x: 24, y: 24};
    // 'left' mirrors the composition: thumbnail top-right, lens on the left
    if (place === 'left') { cx = SW - LG.c[0]; corner = {x: SW - 24, y: 24}; }
    if (place === 'top') cy -= 40;
    if (place === 'bottom') cy += 20;
    const Rd = Math.min(LG.maxR, rs * p.detailGeometry.zoom);
    const dest = {x: cx, y: cy};
    const kThumb = LG.thumb;

    // --- lens copy of the texts, zone, markers and after-state art
    const src = st.lensSource(extra);
    const lensNames = namesIn(src);
    const clipId = 'lensclip';
    const lensNode = g({name: 'lens', opacity: 0},
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: 'lens-clipc', r: 100}))),
      h('circle', {name: 'lens-shadow', r: 100, fill: th.shadow, transform: 'translate(12 16)'}),
      g({'clip-path': ctx.ref(clipId)},
        h('circle', {name: 'lens-bg', r: 100, fill: th.woodTop}),
        g({name: 'lens-inner'}, cloneForLens(src, 'lz-'))),
      g({name: 'lens-rim'},
        h('circle', {r: 100, fill: '#dcebf6', 'fill-opacity': 0.1}),
        h('circle', {r: 100, fill: 'none', stroke: '#3b3f45', 'stroke-width': 9}),
        h('circle', {r: 105, fill: 'none', stroke: th.ink, 'stroke-width': 2.2}),
        h('path', {d: 'M-84 -40A93 93 0 0 1 -40 -84', fill: 'none', stroke: '#fff', 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.45}),
        g({transform: 'rotate(135)'},
          h('rect', {x: 104, y: -9, width: 22, height: 18, rx: 3, fill: '#c3cbd2', stroke: th.ink, 'stroke-width': 2}),
          h('rect', {x: 124, y: -13, width: 58, height: 26, rx: 13, fill: '#40332a', stroke: th.ink, 'stroke-width': 2}))),
    );

    // --- state tags (desk coords) above the seam, and the lens-side state chip
    const bookBox = {x: st.bookC.x + st.book.bounds.x, y: st.bookC.y + st.book.bounds.y, w: st.book.bounds.w, h: st.book.bounds.h};
    const artBox = {x: st.artFinal.x, y: st.artFinal.y - 40, w: st.art.w, h: st.art.h + 40};
    const obstacles = [...st.objBoxes.filter(b => !boxesOverlap(b, artBox, -60)), bookBox, artBox];
    const inStage = b => b.x >= 12 && b.y >= 10 && b.x + b.w <= SW - 12 && b.y + b.h <= SH - 10;
    // Both state tags sit above the seam marker (the after-tag takes the before-tag's place),
    // wrapping to 2-3 lines rather than moving away; a dashed leader ties each tag to the seam.
    const tagFor = (state, name, extraText) => {
      if (!ctx.show('key')) return null;
      const text = extraText ? `${stateLabel(ctx, state)} · ${extraText}` : stateLabel(ctx, state);
      const top = Math.min(bookBox.y, artBox.y);
      const bottom = Math.max(bookBox.y + bookBox.h, artBox.y + artBox.h);
      const color = state === 'conflict-flagged' ? C.flag : th.ink;
      const makers = [];
      if (ctx.measure(text, 28, 700, 'sans') + 90 <= SW * 0.56) makers.push(c => statusTag(ctx, text, {...c, size: 28, maxWidth: SW * 0.56, name, color, opacity: 0}));
      for (const mw of [SW * 0.5, 520, 440, 380]) makers.push(c => chip(ctx, text, {...c, maxWidth: mw, size: 26, minSize: 24, maxLines: 3, fill: th.card, stroke: color, color, name}));
      const spots = hgt => [
        {x: st.seam.x, y: top - hgt - 14, anchor: 'middle'},
        {x: st.seam.x - 40, y: top - hgt - 14, anchor: 'start'},
        {x: st.seam.x + 40, y: top - hgt - 14, anchor: 'end'},
      ];
      const below = [{x: st.seam.x, y: bottom + 12, anchor: 'middle'}, {x: st.seam.x - 40, y: bottom + 12, anchor: 'start'}, {x: st.seam.x + 40, y: bottom + 12, anchor: 'end'}];
      const ok = tg => inStage(tg.box) && !obstacles.some(b => boxesOverlap(tg.box, b, 6)) && !tg.fit?.truncated;
      for (const cands of [null, below]) {
        for (const mk of makers) {
          const hgt = mk({x: 0, y: 0, anchor: 'start'}).box.h;
          for (const c of cands || spots(hgt)) {
            const tg = mk(c);
            if (ok(tg)) return tg;
          }
        }
      }
      const mk = makers[makers.length - 1];
      return mk(spots(mk({x: 0, y: 0, anchor: 'start'}).box.h)[0]);
    };
    const attrib = p.states.after === 'reading-proposed' && p.interpretations.length ? p.interpretations[0].by : null;
    const tagBefore = tagFor(p.states.before, 'tag-before');
    const tagAfter = tagFor(p.states.after, 'tag-after', attrib);
    // leader from a tag to the seam (above the marker / below the phrases)
    const flagTop = st.seam.y - 58 * (st.G.flagS ?? 1) - 8;
    const leadFor = (tg, kind) => {
      if (!tg) return null;
      const b = tg.box;
      const above = b.y + b.h <= st.seam.y;
      const y2 = above ? (kind === 'flag' || kind === 'pin' ? flagTop : st.seam.y - st.phA.h / 2 - 12) : st.seam.y + st.phA.h / 2 + 12;
      const x1 = Math.max(b.x + 12, Math.min(st.seam.x, b.x + b.w - 12));
      return {x1, y1: above ? b.y + b.h : b.y, x2: st.seam.x, y2};
    };
    const leadBefore = leadFor(tagBefore, beforeKind);
    const leadAfter = leadFor(tagAfter, afterKind);

    // --- trace of the old wording (stage coords, above the lens) and the lens state chip

    // --- the single editorial marker after the return (desk coords)
    let mark = null;
    let markTarget = null;
    const G = st.G;
    const cupR = G.cupR ?? 44;
    const cupBox = {x: st.cupC.x - cupR * 1.25 - 4, y: st.cupC.y - cupR * 0.8 - 4, w: cupR * 2.5 + 16, h: cupR * 1.6 + 18};
    if (ctx.show('all')) {
      // The Δ badge sits on the ring's OUTER side (article: right end; book: left end, away from the
      // seam and its marker). The article's note hangs straight below (or above) a point just right of
      // the badge, outside the sheet; the book's note sits on the left page's inner filler, level with
      // the phrase, with a short horizontal leader across the margin to the badge — never along the
      // gutter or the ribbon.
      const pass = onB ? st.art.pass : st.book.pass;
      const origin = onB ? {x: st.artFinal.x + st.art.passOrigin.x, y: st.artFinal.y + st.art.passOrigin.y} : st.bookPt(st.book.passOrigin);
      const rb = pass.ringBox;
      const midY = origin.y + rb.y + rb.h / 2;
      const badge = {x: origin.x + (onB ? rb.x + rb.w + pass.badgeR * 0.55 : rb.x - pass.badgeR * 0.55), y: midY, r: pass.badgeR};
      const tgt = onB ? {x: badge.x + badge.r + 10, y: midY} : {x: badge.x - badge.r - 10, y: midY};
      markTarget = {...tgt, badge};
      const text = `${p.contextLabels.marker}: “${p.beforeValue}” → “${p.afterValue}”`;
      const lines = onB ? 5 : 8;
      const make = q => callout(ctx, {name: 'mark', text, chipAt: q.chipAt, anchor: q.anchor, target: tgt, maxWidth: q.maxWidth, size: 24, maxLines: lines});
      const obs = [...obstacles.filter(b => b !== (onB ? artBox : bookBox)), tagAfter && tagAfter.box, cupBox].filter(Boolean);
      const whole = mw => !ctx.fit(text, {maxWidth: mw - 24 * 1.2, size: 24, minSize: 24 * 0.92, maxLines: lines, weight: 600}).truncated;
      if (onB) {
        const below = artBox.y + artBox.h + 16;
        const belowBoth = Math.max(below, bookBox.y + bookBox.h + 16);
        const aboveOf = hh => artBox.y - 16 - hh;
        for (const mw of [420, 340, 280, 230]) {
          if (!whole(mw)) continue;
          const hh = make({chipAt: {x: 0, y: 0}, anchor: 'start', maxWidth: mw}).box.h;
          for (const y of [below, belowBoth, aboveOf(hh)]) {
            // (the last spot ends just left of the pin cup: the leader then climbs the sheet's outer edge)
            for (const [x, anchor] of [[tgt.x, 'middle'], [tgt.x + 30, 'end'], [tgt.x - 30, 'start'], [tgt.x + 14, 'end'], [tgt.x - 14, 'start'], [Math.min(tgt.x + 14, cupBox.x - 8), 'end']]) {
              const m = make({chipAt: {x, y}, anchor, maxWidth: mw});
              if (inStage(m.box) && !obs.some(b => boxesOverlap(m.box, b, 6))) { mark = m; break; }
            }
            if (mark) break;
          }
          if (mark) break;
        }
      } else {
        // left page: inner filler column, below the title, centred on the phrase line
        const colX = st.bookC.x + st.book.colL.x, colW = st.book.colL.w;
        const titleBottom = st.bookC.y + st.book.titleBox.y + st.book.titleBox.h + 14;
        const pageBottom = st.bookC.y + st.book.bot - 10;
        for (const mw of [colW, colW * 0.9]) {
          if (!whole(mw)) continue;
          const probe = make({chipAt: {x: 0, y: 0}, anchor: 'end', maxWidth: mw});
          const y = Math.max(titleBottom, Math.min(pageBottom - probe.box.h, midY - probe.box.h / 2));
          const m = make({chipAt: {x: colX + colW, y}, anchor: 'end', maxWidth: mw});
          if (m.box.x >= colX - 2 && m.box.y + m.box.h <= pageBottom) { mark = m; break; }
        }
      }
      if (!mark) {
        mark = placeCalloutWidths(ctx, {target: tgt, targetBox: onB ? artBox : bookBox, obstacles: obs, bounds: {x: 16, y: 12, w: SW - 32, h: SH - 24}, make, text, size: 24, maxLines: 5}, [420, 340, 280, 230])
          || make({chipAt: {x: SW - 30, y: SH - 120}, anchor: 'end', maxWidth: 380});
      }
    }
    // the changed-datum leader never runs across wording, along the gutter fold or over the ribbon
    let markLeadClear = true, markLeadOffGutter = true, markClearOfCup = true, badgeClear = true;
    if (mark) {
      const b = mark.box, tg = markTarget;
      const from = {x: Math.max(b.x, Math.min(tg.x, b.x + b.w)), y: tg.y > b.y + b.h ? b.y + b.h : tg.y < b.y ? b.y : b.y + b.h / 2};
      if (from.y === b.y + b.h / 2) from.x = tg.x > b.x + b.w / 2 ? b.x + b.w : b.x;
      const m = st.book.pw * 0.1;
      const cols = [
        {x: st.artFinal.x + 2, y: st.artFinal.y + 2, w: st.art.w - 4, h: st.art.h - 4},
        {x: st.bookC.x - st.book.pw + m, y: st.bookC.y + st.book.top, w: st.book.pw - 2 * m, h: st.book.ph},
        {x: st.bookC.x + m, y: st.bookC.y + st.book.top, w: st.book.pw - 2 * m, h: st.book.ph},
      ];
      const end = {x: tg.x + (from.x - tg.x) * 0.03, y: tg.y + (from.y - tg.y) * 0.03};
      // (the book's note itself rests on the left page's filler, so its leader starts at that column's edge)
      markLeadClear = !cols.filter((c, i) => onB || i !== 1).some(c => segmentHits(from, end, c, 0));
      // ribbon (hanging from the gutter on the right page) and a 10-unit band along the gutter fold
      const ribbon = {x: st.bookC.x + 8, y: st.bookC.y + st.book.bot - st.book.ph * 0.3, w: 16, h: st.book.ph * 0.3 + 44};
      const n = Math.max(2, Math.ceil(Math.hypot(end.x - from.x, end.y - from.y) / 4));
      let along = 0;
      for (let i = 0; i <= n; i++) {
        const q = {x: from.x + (end.x - from.x) * (i / n), y: from.y + (end.y - from.y) * (i / n)};
        if (Math.abs(q.x - st.bookC.x) < 10 && q.y > st.bookC.y + st.book.top && q.y < st.bookC.y + st.book.bot) along += Math.hypot(end.x - from.x, end.y - from.y) / n;
      }
      markLeadOffGutter = !segmentHits(from, end, ribbon, 2) && along <= 24;
      markClearOfCup = !boxesOverlap(b, cupBox, 2);
    }
    // the Δ badge is not covered by the seam's marker (pin or clip) or the zone band
    if (markTarget) {
      const bd = markTarget.badge;
      const seamBox = {x: st.seam.x - 30, y: st.seam.y - 90, w: 60, h: 120};
      badgeClear = !boxesOverlap({x: bd.x - bd.r, y: bd.y - bd.r, w: bd.r * 2, h: bd.r * 2}, seamBox, 0);
    }
    // context label under the thumbnail
    const thumbBox = corner.x < SW / 2
      ? {x: corner.x, y: corner.y, w: SW * kThumb, h: SH * kThumb}
      : {x: corner.x - SW * kThumb, y: corner.y, w: SW * kThumb, h: SH * kThumb};
    const right = corner.x < SW / 2;
    const labelAt = LG.label === 'right'
      ? (right ? {x: thumbBox.x + thumbBox.w + 22, y: thumbBox.y, maxWidth: SW - thumbBox.w - 70} : {x: thumbBox.x - 22, y: thumbBox.y, anchor: 'end', maxWidth: SW - thumbBox.w - 70})
      : {x: thumbBox.x, y: thumbBox.y + thumbBox.h + 14, maxWidth: Math.max(thumbBox.w, 300)};
    const ctxLabel = ctx.show('all') ? chip(ctx, p.contextLabels.context, {...labelAt, size: 24, maxLines: 3, fill: th.card, stroke: th.inkSoft, name: 'ctx-label'}) : null;
    // lens-side chips: above/below the lens when there is room, otherwise in the thumbnail column
    const column = layout === 'horizontal';
    const colX = right ? thumbBox.x : thumbBox.x + thumbBox.w;
    const colAnchor = right ? 'start' : 'end';
    let colY = (ctxLabel ? ctxLabel.box.y + ctxLabel.box.h : thumbBox.y + thumbBox.h) + 26;
    const traceText = `${t.before}: “${p.beforeValue}”`;
    const trace = ctx.show('all') ? chip(ctx, traceText, column
      ? {x: colX, y: colY, anchor: colAnchor, maxWidth: thumbBox.w, size: 28, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, name: 'trace'}
      : {x: dest.x, y: dest.y - Rd - 70, anchor: 'middle', maxWidth: SW * 0.6, size: 28, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, name: 'trace'}) : null;
    if (trace && column) colY = trace.box.y + trace.box.h + 16;
    const traceStrike = trace ? {x1: trace.box.x + 14, x2: trace.box.x + trace.box.w - 14, y: trace.box.cy} : null;
    const stateText = attrib ? `${stateLabel(ctx, p.states.after)} · ${attrib}` : stateLabel(ctx, p.states.after);
    const lensState = ctx.show('key') ? chip(ctx, stateText, column
      ? {x: colX, y: colY, anchor: colAnchor, maxWidth: thumbBox.w, size: 28, maxLines: 3, fill: th.card, stroke: p.states.after === 'conflict-flagged' ? C.flag : th.ink, name: 'lens-state'}
      : {x: dest.x, y: dest.y + Rd + 26, anchor: 'middle', maxWidth: SW * 0.6, size: 28, maxLines: 2, fill: th.card, stroke: p.states.after === 'conflict-flagged' ? C.flag : th.ink, name: 'lens-state'}) : null;
    const extraThumb = cloneForLens(extra, 'th-');
    const extraThumbNames = namesIn(extra);
    return {hideHeadInLens, headInLens, markLeadClear, markLeadOffGutter, markClearOfCup, badgeClear, leadBefore, leadAfter, markTarget, thumbDesk, extraThumb, extraThumbNames, st, s, ox, oy, layout, onB, f, rs, dest, Rd, corner, kThumb, thumbBox, lensNode, lensNames, extra, afterZone, afterMarker, afterKind, beforeKind, tagBefore, tagAfter, trace, traceStrike, lensState, mark, ctxLabel, zoneGeom};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = motifColors(ctx);
    const lead = (ld, name, color) => ld && h('line', {name, ...ld, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '5 6', opacity: 0});
    const tagColor = st => (st === 'conflict-flagged' ? C.flag : th.ink);
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      // the text-free twin lies UNDER the full desk (same transform): while the desk shrinks it is
      // one opaque group; its words give way to the twin's bars only once it is thumbnail-sized
      g({name: 'thumb', opacity: 0}, L.thumbDesk.node, L.extraThumb),
      g({name: 'ctx'},
        L.st.node,
        L.extra,
        h('circle', {name: 'src-ring', cx: L.f.x, cy: L.f.y, r: L.rs, fill: 'none', stroke: C.flag, 'stroke-width': 5, 'stroke-dasharray': '12 8', opacity: 0}),
        lead(L.leadBefore, 'tag-before-lead', tagColor(ctx.params.states.before)),
        lead(L.leadAfter, 'tag-after-lead', tagColor(ctx.params.states.after)),
        L.tagBefore && L.tagBefore.node,
        L.tagAfter && L.tagAfter.node,
        L.mark && L.mark.node),
      // the thumbnail frame hugs the shrinking desk's own edge (it never crosses the desk)
      h('path', {name: 'thumb-frame', d: roundRectPath(-4, -4, L.st.W + 8, L.st.H + 8, 14), fill: 'none', stroke: th.fgSoft, 'stroke-width': 3, opacity: 0}),
      L.ctxLabel && g({name: 'ctx-label-g', opacity: 0}, L.ctxLabel.node),
      h('line', {name: 'coneA', stroke: C.flag, 'stroke-width': 3, 'stroke-dasharray': '9 8', opacity: 0}),
      h('line', {name: 'coneB', stroke: C.flag, 'stroke-width': 3, 'stroke-dasharray': '9 8', opacity: 0}),
      L.lensNode,
      L.trace && g({name: 'trace-g', opacity: 0}, L.trace.node, h('line', {x1: L.traceStrike.x1, x2: L.traceStrike.x2, y1: L.traceStrike.y, y2: L.traceStrike.y, stroke: th.inkSoft, 'stroke-width': 3})),
      L.lensState && g({name: 'lens-state-g', opacity: 0}, L.lensState.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const onB = L.onB;
    const sw = seg(u, ...W.swap);
    const lift = seg(u, ...W.liftMarker);
    const posed = L.st.pose({
      slide: 1, grab: 1, release: 1, fetch: 1, carry: 1, place: 1, back: 1,
      hl: seg(u, ...W.hl), zone: seg(u, ...W.zone),
      swapA: onB ? 0 : sw, swapB: onB ? sw : 0,
      ringA: onB ? 0 : seg(u, ...W.mark), ringB: onB ? seg(u, ...W.mark) : 0,
    });
    const nodes = posed.nodes;
    const st = L.st;
    // the before-marker appears in the build and is lifted away when the dependent state changes
    const mk = st.marker === 'clip' ? 'st-clip' : st.marker === 'flag' ? 'st-flag' : null;
    const sameState = p.states.after === p.states.before;
    const beforeOp = seg(u, ...W.marker) * (sameState ? 1 : 1 - lift);
    if (mk) nodes[mk] = {transform: `${T(st.markerSpot.x, st.markerSpot.y - 40 * (sameState ? 0 : lift), 0, 1 + 0.08 * (sameState ? 0 : lift))}`, opacity: r(beforeOp, 3)};
    // before zone gives way to the after zone (only when the supplied state changes)
    const zoneBefore = seg(u, ...W.zone);
    // when the BOOK's phrase changes its highlight edge moves: the old band leaves as the new wording
    // arrives (it would cover the new words), and the band is redrawn from the new edge
    const moved = !onB;
    const afterP = sameState && !moved ? 0 : seg(u, ...W.afterZone);
    const beforeOut = moved ? Math.max(afterP, seg(u, W.swap[0], W.swap[0] + 0.05)) : afterP;
    Object.assign(nodes, L.afterZone.frame(afterP));
    if (!sameState || moved) nodes['st-zone'] = {...nodes['st-zone'], opacity: r(zoneBefore > 0 ? 1 - beforeOut : 0, 3)};
    if (L.afterMarker) nodes.amg = {opacity: r(sameState ? 0 : seg(u, ...W.afterMarker), 3)};
    // context shrink into the corner (thumbnail) and back
    const kIn = ease.inOutCubic(seg(u, ...W.shrink));
    const kOut = ease.inOutCubic(seg(u, ...W.grow));
    const kk = lerp(1, L.kThumb, kIn * (1 - kOut));
    const c = L.corner;
    const toStage = q => ({x: c.x + (q.x - c.x) * kk, y: c.y + (q.y - c.y) * kk});
    const ctxT = `translate(${r(c.x)} ${r(c.y)}) scale(${r(kk, 4)}) translate(${r(-c.x)} ${r(-c.y)})`;
    // the full desk stays opaque while it shrinks; only at thumbnail size do its words give way
    // to the twin's bars underneath (and the reverse on the way back)
    const shrinkP = clamp((1 - kk) / (1 - L.kThumb));
    const twin = clamp((shrinkP - 0.74) / 0.2);
    nodes.ctx = {transform: ctxT, opacity: r(1 - twin, 3)};
    nodes.thumb = {transform: ctxT, opacity: shrinkP > 0.72 ? 1 : 0};
    const tp = L.thumbDesk.pose({slide: 1, grab: 1, release: 1, fetch: 1, carry: 1, place: 1, back: 1, hl: seg(u, ...W.hl), zone: seg(u, ...W.zone), swapA: onB ? 0 : sw, swapB: onB ? sw : 0});
    Object.assign(nodes, tp.nodes);
    for (const [k, v] of Object.entries(nodes)) if (k.startsWith('st-flag') || k.startsWith('st-clip') || k === 'st-zone') nodes[`th-${k.slice(3)}`] = v;
    Object.assign(nodes, mirror(nodes, L.extraThumbNames, 'th-'));
    const thumbOn = kk < 0.985 ? r(shrinkP, 3) : 0;
    nodes['thumb-frame'] = {opacity: thumbOn, transform: ctxT, 'stroke-width': r(3 / kk, 3)};
    if (L.ctxLabel) nodes['ctx-label-g'] = {opacity: r(clamp((thumbOn - 0.85) / 0.15), 3)};
    // source ring
    const ringOn = seg(u, ...W.ring) * (1 - seg(u, 0.9, 0.96));
    nodes['src-ring'] = {opacity: r(ringOn, 3)};
    // lens: grows from the ring to its destination and back
    const pOpen = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const S = toStage(L.f);
    const Rs = L.rs * kk;
    const Lc = {x: lerp(S.x, L.dest.x, pOpen), y: lerp(S.y, L.dest.y, pOpen)};
    const R = lerp(Rs, L.Rd, pOpen);
    const m = R / L.rs; // magnification relative to context coordinates
    const open = pOpen > 0.002;
    nodes.lens = {transform: T(Lc.x, Lc.y), opacity: open ? 1 : 0};
    for (const n of ['lens-clipc', 'lens-bg', 'lens-shadow']) nodes[n] = {r: r(R)};
    nodes['lens-rim'] = {transform: `scale(${r(R / 100, 4)})`};
    nodes['lens-inner'] = {transform: `scale(${r(m, 4)}) translate(${r(-L.f.x)} ${r(-L.f.y)})`};
    Object.assign(nodes, mirror(nodes, L.lensNames, 'lz-'));
    // the unused marker of the lens copy stays hidden
    if (st.marker !== 'flag') nodes['lz-st-flag'] = {opacity: 0};
    if (st.marker !== 'clip') nodes['lz-st-clip'] = {opacity: 0};
    // a provision heading the round lens would cut mid-word is left out of the lens copy
    if (L.hideHeadInLens) nodes[L.hideHeadInLens] = {opacity: 0};
    // cones between the ring and the lens
    const d = Math.max(1, dist(S, Lc));
    const nx = -(Lc.y - S.y) / d, ny = (Lc.x - S.x) / d;
    const coneOn = open && pOpen > 0.05 ? 1 : 0;
    nodes.coneA = {x1: r(S.x + nx * Rs), y1: r(S.y + ny * Rs), x2: r(Lc.x + nx * R), y2: r(Lc.y + ny * R), opacity: coneOn};
    nodes.coneB = {x1: r(S.x - nx * Rs), y1: r(S.y - ny * Rs), x2: r(Lc.x - nx * R), y2: r(Lc.y - ny * R), opacity: coneOn};
    // trace of the old wording and the lens-side state
    if (L.trace) nodes['trace-g'] = {opacity: r(seg(u, ...W.trace) * (1 - seg(u, ...W.traceOut)), 3), transform: `translate(0 ${r(24 * (1 - seg(u, ...W.trace)))})`};
    if (L.lensState) nodes['lens-state-g'] = {opacity: r(seg(u, ...W.lensState) * (1 - seg(u, ...W.traceOut)), 3)};
    // context state tags
    if (L.tagBefore) nodes['tag-before'] = {opacity: r(seg(u, ...W.tagBefore) * (1 - seg(u, ...W.tagOut)), 3)};
    if (L.tagAfter) nodes['tag-after'] = {opacity: r(seg(u, ...W.tagAfter), 3)};
    if (L.leadBefore) nodes['tag-before-lead'] = {opacity: seg(u, ...W.tagBefore) >= 1 && seg(u, ...W.tagOut) === 0 ? 1 : 0};
    if (L.leadAfter) nodes['tag-after-lead'] = {opacity: seg(u, ...W.tagAfter) >= 1 ? 1 : 0};
    if (L.mark) Object.assign(nodes, L.mark.frame(seg(u, ...W.mark)));
    const mapped = {x: Lc.x + (L.f.x - L.f.x) * m, y: Lc.y + (L.f.y - L.f.y) * m};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {
      nodes,
      semantic: {
        beat,
        datum: sw < 0.5 ? p.beforeValue : p.afterValue,
        swap: r(sw, 3),
        focusTarget: p.focusTarget,
        lens: {x: r(Lc.x), y: r(Lc.y)},
        lensR: r(R),
        lensOpen: r(pOpen, 3),
        magnification: r(m, 3),
        sourceInContext: {x: r(L.f.x), y: r(L.f.y)},
        sourceOnStage: {x: r(S.x), y: r(S.y)},
        lensMapsSource: dist(mapped, Lc) < 0.5,
        contextScale: r(kk, 4),
        stateBefore: p.states.before,
        stateAfter: p.states.after,
        stateShown: u >= W.tagAfter[1] ? p.states.after : p.states.before,
        markerShown: u >= W.mark[1],
        highlight: posed.semantic.highlight,
        // transition: the desk shrinks as one opaque group (text→bars only at thumbnail size)
        shrink: r(shrinkP, 3),
        contextOpacity: nodes.ctx.opacity,
        twinUnder: true,
        // state tags: both hang from the seam marker by a leader
        tagsAtSeam: tagsAtSeam(L),
        // changed-datum leader ends outside the Δ badge
        markDotClear: !L.markTarget || Math.hypot(L.markTarget.x - L.markTarget.badge.x, L.markTarget.y - L.markTarget.badge.y) >= L.markTarget.badge.r + 9,
        markLeadClear: L.markLeadClear,
        markLeadOffGutter: L.markLeadOffGutter,
        markClearOfCup: L.markClearOfCup,
        badgeClear: L.badgeClear,
        // the lens copy shows the heading whole or not at all (no word fragments at its rim)
        lensHeadingWhole: L.headInLens || Boolean(L.hideHeadInLens),
      },
    };
  },
};

/** Both state tags sit across the seam (their box spans it) with a leader down/up to it. */
function tagsAtSeam(L) {
  const x = L.st.seam.x;
  return [[L.tagBefore, L.leadBefore], [L.tagAfter, L.leadAfter]].every(([tg, ld]) => !tg || (Boolean(ld) && tg.box.x <= x + 1 && tg.box.x + tg.box.w >= x - 1 && Math.abs(ld.x1 - ld.x2) < 1));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-03-inspect',
    title: 'Conflict between texts — inspect and substitute the phrase',
    titleEs: 'Conflicto entre textos — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Conflicto entre textos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The reading desk after the two provisions met: the desk shrinks to a corner thumbnail while a large hand lens grows from a ring on the Text 2 phrase, showing a real enlarged copy. Inside it the wording is substituted (the old one kept as a struck trace), the highlight re-sizes and only the supplied dependent state changes; the desk returns with one changed-datum marker. Nothing is inferred and no text is shown to prevail.',
    tags: ['conflict between texts', 'inspect', 'magnifier', 'lens', 'substitution', 'changed datum', 'book', 'article', 'editable hierarchy', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/conflicto-entre-textos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
