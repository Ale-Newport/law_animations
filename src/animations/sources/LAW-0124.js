/**
 * LAW-0124 — Texto y contexto · inspect
 *
 * Storyboard (the reading desk after the action; brief beats in brackets):
 *  [0.00–0.20] build: the state produced by the action — the key word back in
 *              its article, its passage and the full article ringed, the other
 *              occurrences of the word marked on the margin rail, the book tied
 *              to its row on the author's rack; the magnifier lies on the desk.
 *              The contextual reading is shown as an attributed card, marked
 *              with the wording it was supplied for.
 *  [0.20–0.45] isolate: a handle-less circular zoom callout (clearly not a
 *              second magnifier: the reader's magnifier stays on the desk)
 *              grows out of the detail that separates the isolated from the
 *              contextual reading (the key word — or, with focusTarget
 *              "passage", the passage that gives it context), joined to it by
 *              a source ring and dashed cone lines. The inset is a live copy of
 *              the scene at the SAME coordinates, magnified about the detail
 *              (centred on the key word); the rest dims.
 *  [0.45–0.75] substitute: the old datum is struck through, lifts off and
 *              fades; only then the supplied alternative appears in its place.
 *              Only the dependent state updates: the occurrences of the word
 *              are re-found in the supplied text and the margin rail is redrawn.
 *              A before → after chip keeps the old value traceable.
 *  [0.75–1.00] return: the inset shrinks back onto the detail; a "datum
 *              changed" marker stays beside the article, joined to the changed
 *              word by a short leader that never crosses the article's text. Nothing about validity, meaning or
 *              outcome is inferred; the reading card still says which wording
 *              it was supplied for. Seeking back before the swap restores the
 *              old datum exactly (two desks, switched by time only).
 * @module animations/sources/LAW-0124
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {measure, FONTS} from '../../core/text.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {deskStage, STAGE, sourcesFields, TC_DEFAULTS, TC_STRINGS, kitStrings, readingCard, findAll, polyLeader, leader, wordLeaderPts, pathHits} from './kits/texto-y-contexto.js';

const ID = 'LAW-0124';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  marks: [0.02, 0.16], caption: [0.02, 0.08], card: [0.1, 0.18], open: [0.22, 0.42],
  strike: [0.46, 0.52], chip: [0.47, 0.53], lift: [0.52, 0.58], pulse: [0.59, 0.66], rail: [0.62, 0.72],
  close: [0.77, 0.9], marker: [0.88, 0.95],
};
const SWAP = 0.585;
const TARGETS = ['word', 'passage'];

const sceneSchema = {...sourcesFields, ...inspectFields(TARGETS)};
sceneSchema.focusTarget.description = 'Detail that is enlarged and substituted: "word" = the key word (beforeValue/afterValue are words); "passage" = the passage that gives the word its context (values are passage texts)';

const defaultParams = {
  ...TC_DEFAULTS,
  focusTarget: 'word',
  beforeValue: 'unit',
  afterValue: 'room',
  detailGeometry: {zoom: 3.4, placement: 'auto'},
  contextLabels: {context: 'Context: the word back in its full article', marker: 'Datum changed'},
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

/** Candidate lens regions per axis: centre + largest radius that stays clear of the detail. */
const REGIONS = {
  horizontal: {auto: 'left', left: {x: 560, y: 410, r: 300}, right: {x: 1605, y: 330, r: 235}, top: {x: 560, y: 410, r: 300}, bottom: {x: 560, y: 410, r: 300}},
  square: {auto: 'left', left: {x: 318, y: 318, r: 262}, right: {x: 318, y: 318, r: 262}, top: {x: 318, y: 318, r: 262}, bottom: {x: 318, y: 318, r: 262}},
  vertical: {auto: 'bottom', bottom: {x: 330, y: 1190, r: 208}, left: {x: 330, y: 1190, r: 208}, right: {x: 330, y: 1190, r: 208}, top: {x: 330, y: 1190, r: 208}},
};

/** Free zones (stage units) for caption, card, before→after chip and marker. */
const ZONES = {
  horizontal: {caption: [1336, 36, 530], card: [1336, 330, 530], chip: 'lens-below', marker: 'right'},
  square: {caption: [24, 648, 560], card: [24, 706, 470], chip: 'lens-below-tight', chipZone: [512, 706, 420], marker: 'leftPage'},
  vertical: {caption: [28, 24, 944], card: [28, 84, 470], chip: 'lens-right', chipZone: [520, 84, 452], marker: 'top'},
};

function substitute(p) {
  const P = p.passages;
  const lines = P.lines.map(t => String(t).replace(/\s+/g, ' ').trim());
  const kp = Math.min(P.wordPassage ?? 0, lines.length - 1);
  if (p.focusTarget === 'passage') {
    const cp = lines.length > 1 ? (kp === 0 ? 1 : 0) : 0;
    const lb = lines.slice(), la = lines.slice();
    lb[cp] = p.beforeValue;
    la[cp] = p.afterValue;
    return {changed: cp, before: {...P, lines: lb}, after: {...P, lines: la}, wordBefore: P.word, wordAfter: P.word};
  }
  const line = lines[kp];
  const hits = findAll(line, P.word);
  const idx = hits.length ? hits[0] : 0;
  const len = hits.length ? String(P.word).trim().length : (line.match(/^\S+/) || [''])[0].length;
  const put = v => line.slice(0, idx) + v + line.slice(idx + len);
  const lb = lines.slice(), la = lines.slice();
  lb[kp] = put(p.beforeValue);
  la[kp] = put(p.afterValue);
  return {changed: kp, before: {...P, lines: lb, word: p.beforeValue}, after: {...P, lines: la, word: p.afterValue}, wordBefore: p.beforeValue, wordAfter: p.afterValue};
}

/** Circle path (for the even-odd hole in the dim overlay). */
const circleD = (c, rad) => `M${r(c.x - rad)} ${r(c.y)}a${r(rad)} ${r(rad)} 0 1 0 ${r(rad * 2)} 0a${r(rad)} ${r(rad)} 0 1 0 ${r(-rad * 2)} 0Z`;

/** External tangent points of two circles (for the cone lines). */
function tangents(c1, r1, c2, r2) {
  const dx = c2.x - c1.x, dy = c2.y - c1.y;
  const d = Math.hypot(dx, dy) || 1;
  const base = Math.atan2(dy, dx);
  const a = Math.acos(clamp((r1 - r2) / d, -1, 1));
  return [1, -1].map(sg => {
    const t = base + sg * a;
    return [{x: c1.x + r1 * Math.cos(t), y: c1.y + r1 * Math.sin(t)}, {x: c2.x + r2 * Math.cos(t), y: c2.y + r2 * Math.sin(t)}];
  });
}

const scene = {
  sizes: {landscape: [STAGE.horizontal.w, STAGE.horizontal.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.vertical.w, STAGE.vertical.h]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = kitStrings(p.locale);
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const sub = substitute(p);
    const pB = {...p, passages: sub.before};
    const pA = {...p, passages: sub.after};
    // both desks use the same text size and keep the same line slots for the
    // changed passage, so nothing else moves when the datum is replaced
    let size, reserve;
    {
      const tB = deskStage(ctx, {prefix: 'tmpB', axis, params: pB});
      const tA = deskStage(ctx, {prefix: 'tmpA', axis, params: pA});
      size = Math.min(tB.AL.size, tA.AL.size);
      const n = Math.max(tB.AL.passages[sub.changed].lines.length, tA.AL.passages[sub.changed].lines.length);
      reserve = {[sub.changed]: n};
    }
    let before = deskStage(ctx, {prefix: 'cb', axis, params: pB, size, reserve});
    let after = deskStage(ctx, {prefix: 'ca', axis, params: pA, size, reserve});
    if (before.AL.size !== after.AL.size) {
      size = Math.min(before.AL.size, after.AL.size);
      before = deskStage(ctx, {prefix: 'cb', axis, params: pB, size, reserve});
      after = deskStage(ctx, {prefix: 'ca', axis, params: pA, size, reserve});
    }
    const ALb = before.AL, ALa = after.AL;
    const S = ALb.size;

    // --- the detail (lens source) -------------------------------------------
    let src, srcR, oldBoxes;
    if (p.focusTarget === 'passage') {
      const pb = ALb.passages[sub.changed], pa = ALa.passages[sub.changed];
      const x0 = Math.min(pb.box.x, pa.box.x) - 10, x1 = Math.max(pb.box.x + pb.box.w, pa.box.x + pa.box.w) + 10;
      const y0 = pb.y0 - 8, y1 = Math.max(pb.yReserved, pa.yReserved) + 10;
      src = {x: (x0 + x1) / 2, y: (y0 + y1) / 2};
      srcR = Math.hypot(x1 - x0, y1 - y0) / 2;
      oldBoxes = pb.lines.map(l => ({x: l.x, y: l.y, w: l.w, h: S}));
    } else {
      // centred on the key word as printed; the radius also takes in the
      // substituted word (which may be longer or wrap), so neither is clipped
      const kb = ALb.key, ka = ALa.key;
      src = {x: kb.cx, y: kb.cy};
      const far = b => Math.max(...[[b.x - 8, b.y - S * 0.15], [b.x + b.w + 8, b.y - S * 0.15], [b.x - 8, b.y + S * 1.1], [b.x + b.w + 8, b.y + S * 1.1]].map(([x, y]) => Math.hypot(x - src.x, y - src.y)));
      srcR = Math.max(far(kb), far(ka), S * 1.1) + 6;
      oldBoxes = [{x: kb.x, y: kb.y, w: kb.w, h: S}];
    }
    const regs = REGIONS[axis];
    const reg = regs[p.detailGeometry.placement === 'auto' ? regs.auto : p.detailGeometry.placement] || regs[regs.auto];
    const dstR = Math.min(reg.r, srcR * p.detailGeometry.zoom);
    const dst = {x: reg.x, y: reg.y};
    const zoom = dstR / srcR;

    // --- traceability chip: old → new ---------------------------------------
    const Z = ZONES[axis];
    const clip = str => (String(str).length > 60 ? `${String(str).slice(0, 58)}…` : String(str));
    let baChip = null;
    if (ctx.show('key')) {
      const chipSize = 24;
      const txt = `${clip(p.beforeValue)}  →  ${clip(p.afterValue)}`;
      // the old → new chip is attached to the lens (it rides with it and leaves with it)
      const at = Z.chip === 'lens-below' ? {x: dst.x, y: dst.y + dstR + 24, anchor: 'middle', maxWidth: 640}
        : Z.chip === 'lens-below-tight' ? {x: dst.x, y: dst.y + dstR + 12, anchor: 'middle', maxWidth: 440}
          // tall: right of the lens, below its handle
          : {x: dst.x + dstR + 26, y: dst.y + dstR - 46, anchor: 'start', maxWidth: 360};
      baChip = chip(ctx, txt, {...at, size: chipSize, maxLines: 3, fill: th.card, stroke: th.accent3, name: 'ba', weight: 600});
      // a long (multi-line) old → new text does not fit beside the lens: it goes to its free zone and stays
      if (Z.chipZone && (baChip.fit.lines.length > 1 || baChip.box.y + baChip.box.h > st.h - 8)) {
        baChip = chip(ctx, txt, {x: Z.chipZone[0], y: Z.chipZone[1], anchor: 'start', maxWidth: Z.chipZone[2], size: chipSize, maxLines: 3, fill: th.card, stroke: th.accent3, name: 'ba', weight: 600});
        baChip.zoned = true;
      }
      // strike the old value (first part of the first line) when it fits on one line
      const f = baChip.fit;
      const oldW = measure(clip(p.beforeValue), f.size, 600, 'sans');
      baChip.strike = f.lines.length === 1 ? {x1: baChip.box.x + (baChip.box.w - f.width) / 2, x2: baChip.box.x + (baChip.box.w - f.width) / 2 + oldW, y: baChip.box.y + baChip.box.h / 2} : null;
    }

    // --- context caption, reading card (attributed, marked with its wording) --
    let caption = null;
    if (ctx.show('all')) caption = chip(ctx, p.contextLabels.context, {x: Z.caption[0], y: Z.caption[1], maxWidth: Z.caption[2], size: 24, maxLines: 2, fill: th.card, stroke: th.inkSoft, weight: 600, name: 'caption'});
    // the card always starts below the (possibly two-line) context caption
    const cardY = Math.max(Z.card[1], caption ? caption.box.y + caption.box.h + 12 : 0);
    const card = readingCard(ctx, {
      name: 'card', x: Z.card[0], y: cardY, w: Z.card[2], kind: 'contextual', title: t.contextual,
      text: p.interpretations.contextual.text, by: p.interpretations.contextual.by, proposedBy: t.proposedBy,
      color: th.accent2, soft: th.accent2Soft, size: axis === 'vertical' ? 22 : 23, maxLines: 2,
      extra: `${t.suppliedFor}: “${clip(p.focusTarget === 'word' ? p.beforeValue : sub.before.word)}”${p.focusTarget === 'passage' ? ' · ' + clip(p.beforeValue) : ''}`, extraColor: th.accent3,
    });

    // --- changed-datum marker (pinned to the detail's margin) ----------------
    let marker = null;
    let markerLead = null;
    const mPt = p.focusTarget === 'word' ? {x: after.keyDotPt.x + 8, y: ALa.key.cy} : {x: after.railRight - 2, y: src.y};
    const markerText = p.focusTarget === 'word' ? `${p.contextLabels.marker}: ${clip(p.beforeValue)} → ${clip(p.afterValue)}` : p.contextLabels.marker;
    {
      const ms = 23;
      // with labels hidden the marker keeps its place and leader, drawn as a
      // text-free badge: struck old bar → new bar (still reads as "changed")
      const mkChip = o => {
        if (ctx.show('key')) return chip(ctx, markerText, {...o, size: ms, maxLines: 2, fill: th.accent3Soft, stroke: th.accent3, weight: 700});
        const w = 150, hh = 44;
        const x = o.anchor === 'end' ? o.x - w : o.anchor === 'middle' ? o.x - w / 2 : o.x;
        const y = o.y;
        return {
          box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2},
          node: g({name: o.name},
            h('path', {d: roundRectPath(x, y, w, hh, hh / 2), fill: th.accent3Soft, stroke: th.accent3, 'stroke-width': 2}),
            h('rect', {x: r(x + 18), y: r(y + hh / 2 - 5), width: 40, height: 10, rx: 5, fill: th.inkSoft}),
            h('line', {x1: r(x + 14), x2: r(x + 62), y1: r(y + hh / 2), y2: r(y + hh / 2), stroke: th.accent, 'stroke-width': 3, 'stroke-linecap': 'round'}),
            h('path', {d: `M${r(x + 70)} ${r(y + hh / 2 - 8)}L${r(x + 80)} ${r(y + hh / 2)}L${r(x + 70)} ${r(y + hh / 2 + 8)}`, fill: 'none', stroke: th.accent3, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
            h('rect', {x: r(x + 90), y: r(y + hh / 2 - 5), width: 42, height: 10, rx: 5, fill: th.accent3})),
        };
      };
      if (Z.marker === 'right') {
        // between the caption and the card, level with the detail when possible
        const probe = mkChip({x: 0, y: 0, maxWidth: 520});
        const top = (caption ? caption.box.y + caption.box.h : 40) + 14;
        const my = Math.max(top, Math.min(mPt.y - probe.box.h / 2, card.box.y - probe.box.h - 14));
        marker = mkChip({x: 1336, y: my, maxWidth: 520, name: 'marker'});
        markerLead = leader('mlead', marker.box, mPt, th.accent3, 2.5, 'left');
      } else if (Z.marker === 'leftPage') {
        // beside the article, on the free left page, level with the changed
        // detail; a short leader crosses the gutter and reaches the word through
        // the blank band under its line (never through the article's text)
        const Lp = after.pg.left;
        const mx0 = Lp.x + Lp.w * 0.08, mw = Lp.w * 0.84;
        const probe = mkChip({x: mx0, y: 0, maxWidth: mw});
        const ty = p.focusTarget === 'word' ? wordLeaderPts(after, {x: mx0, y: -1e5, w: probe.box.w, h: 2e5})[0].y : src.y;
        const my = Math.min(Lp.y + Lp.h - probe.box.h - 12, Math.max(after.titleBottom + 14, ty - probe.box.h / 2));
        marker = mkChip({x: mx0, y: my, maxWidth: mw, name: 'marker'});
        let pts;
        if (p.focusTarget === 'word') pts = wordLeaderPts(after, marker.box);
        else {
          // passage focus: to the changed passage's left edge, inside the article frame, left of its number
          const lane = (after.pg.gutterX + after.aBox.x) / 2;
          const y0 = Math.max(marker.box.y + 14, Math.min(marker.box.y + marker.box.h - 14, src.y));
          pts = [{x: marker.box.x + marker.box.w + 2, y: y0}];
          if (Math.abs(y0 - src.y) > 1) pts.push({x: lane, y: y0}, {x: lane, y: src.y});
          pts.push({x: ALa.x - 6, y: src.y});
        }
        markerLead = polyLeader('mlead', pts, th.accent3, 2.5, 5);
      } else {
        marker = mkChip({x: 972, y: 200, anchor: 'end', maxWidth: 400, name: 'marker'});
        const mx = after.railRight;
        markerLead = polyLeader('mlead', [{x: Math.min(marker.box.x + marker.box.w - 20, mx), y: marker.box.y + marker.box.h}, {x: mx, y: marker.box.y + marker.box.h + 14}, {x: mx, y: mPt.y}, {x: mPt.x, y: mPt.y}], th.accent3);
      }
    }
    const [ta, tb] = tangents(src, srcR, dst, dstR);
    // leader checks: the marker's leader against the article's printed lines
    const markerLeadPts = markerLead ? markerLead.pts : [];
    const markerLeadHits = markerLead ? pathHits(markerLeadPts, after.textBoxes, 1) : 0;
    let markerLeadLen = 0;
    for (let i = 1; i < markerLeadPts.length; i++) markerLeadLen += Math.hypot(markerLeadPts[i].x - markerLeadPts[i - 1].x, markerLeadPts[i].y - markerLeadPts[i - 1].y);
    const mEnds = markerLeadPts.length ? [markerLeadPts[0], markerLeadPts[markerLeadPts.length - 1]] : null;
    const markerLeadDetour = mEnds ? markerLeadLen - Math.hypot(mEnds[1].x - mEnds[0].x, mEnds[1].y - mEnds[0].y) : 0;
    // both the old and the new word lie fully inside the source circle
    const inCircle = b => [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]].every(([x, y]) => Math.hypot(x - src.x, y - src.y) <= srcR - 2);
    const keyInside = p.focusTarget !== 'word' || (inCircle({x: ALb.key.x, y: ALb.key.y, w: ALb.key.w, h: S}) && inCircle({x: ALa.key.x, y: ALa.key.y, w: ALa.key.w, h: S}));
    return {markerLeadHits, markerLeadLen, markerLeadDetour, keyInside, chipRides: !(baChip && baChip.zoned), s, ox, oy, W: st.w, H: st.h, axis, sub, before, after, ALb, ALa, S, src, srcR, dst, dstR, zoom, oldBoxes, baChip, caption, card, marker, markerLead, cones: [ta, tb]};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const p = ctx.params;
    const ctxId = ctx.id('ctxall');
    const clipId = 'lensclip';
    const S = L.S;
    // substitution overlay in page coordinates (copied into the lens by <use>)
    const strikes = L.oldBoxes.map((b, i) => h('line', {name: `strike${i}`, x1: r(b.x - 3), x2: r(b.x + b.w + 3), y1: r(b.y + S * 0.5), y2: r(b.y + S * 0.5), stroke: th.accent, 'stroke-width': Math.max(3, S * 0.12), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(b.w + 6)} ${r(b.w + 20)}`, 'stroke-dashoffset': r(b.w + 6)}));
    const ghostText = p.focusTarget === 'word' ? L.sub.wordBefore : null;
    const kb = L.ALb.key;
    // the old word lifts off the line still struck through (word focus only)
    const ghost = g({name: 'ghost', opacity: 0},
      ghostText && ctx.show('key')
        ? h('text', {x: r(kb.x), y: r(kb.y + S * 0.8), 'font-family': FONTS.serif, 'font-size': r(S), fill: th.inkSoft}, ghostText)
        : h('rect', {x: r(kb.x), y: r(kb.y + S * 0.3), width: r(kb.w), height: r(S * 0.46), rx: r(S * 0.2), fill: th.inkSoft}),
      h('line', {x1: r(kb.x - 3), x2: r(kb.x + kb.w + 3), y1: r(kb.y + S * 0.5), y2: r(kb.y + S * 0.5), stroke: th.accent, 'stroke-width': Math.max(3, S * 0.12), 'stroke-linecap': 'round'}));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      g({id: ctxId},
        L.before.node, L.after.node,
        g({name: 'strikes', opacity: 0}, strikes),
        ghost),
      // lens: dim with a hole at the detail, source ring, cones, window
      h('path', {name: 'ldim', d: `M0 0H${L.W}V${L.H}H0Z${circleD(L.src, L.srcR)}`, 'fill-rule': 'evenodd', fill: th.ink, opacity: 0}),
      h('circle', {name: 'lsrc', cx: r(L.src.x), cy: r(L.src.y), r: r(L.srcR), fill: 'none', stroke: th.accent3, 'stroke-width': 4, opacity: 0}),
      L.cones.map((c, i) => h('line', {name: `cone${i}`, x1: r(c[0].x), y1: r(c[0].y), x2: r(c[0].x), y2: r(c[0].y), stroke: th.accent3, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0})),
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: 'lclip', cx: r(L.src.x), cy: r(L.src.y), r: r(L.srcR)}))),
      // zoom callout: a plain circular inset (no rim, ferrule or handle), so it
      // can never read as a second, ungrasped magnifier
      g({name: 'lwin', opacity: 0},
        h('circle', {name: 'lshadow', cx: r(L.src.x + 10), cy: r(L.src.y + 14), r: r(L.srcR), fill: th.shadow}),
        h('circle', {name: 'lbg', cx: r(L.src.x), cy: r(L.src.y), r: r(L.srcR), fill: th.paper}),
        g({'clip-path': ctx.ref(clipId)}, g({name: 'lcontent'}, h('use', {href: `#${ctxId}`}))),
        h('circle', {name: 'lring-o', cx: r(L.src.x), cy: r(L.src.y), r: r(L.srcR), fill: 'none', stroke: th.ink, 'stroke-width': 11}),
        h('circle', {name: 'lring-m', cx: r(L.src.x), cy: r(L.src.y), r: r(L.srcR), fill: 'none', stroke: th.accent3, 'stroke-width': 7}),
        h('circle', {name: 'lring-i', cx: r(L.src.x), cy: r(L.src.y), r: r(L.srcR - 5), fill: 'none', stroke: th.paper, 'stroke-width': 2, opacity: 0.9})),
      L.baChip && g({name: 'baW', opacity: 0}, L.baChip.node, L.baChip.strike ? h('line', {name: 'baStrike', x1: r(L.baChip.strike.x1), x2: r(L.baChip.strike.x1), y1: r(L.baChip.strike.y), y2: r(L.baChip.strike.y), stroke: th.accent, 'stroke-width': 3, 'stroke-linecap': 'round'}) : null),
      L.caption && g({name: 'capW', opacity: 0}, L.caption.node),
      L.card.node,
      L.markerLead && L.markerLead.node,
      L.marker && g({name: 'markerW', opacity: 0}, L.marker.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const w = name => seg(u, ...W[name]);
    const e = ease.inOutCubic;
    const swapped = u >= SWAP;
    // --- context desks (hold state of the action) -----------------------------
    const marks = w('marks');
    const base = {grab: 0, carry: 0, lift: 0, lower: 0, back: 0, release: 0, ringP: marks, ringA: marks, ribbon: marks, hlKey: 1};
    const pb = L.before.pose({...base, rail: marks, hlOthers: marks});
    const rp = w('rail');
    const pa = L.after.pose({...base, ringP: 1, ringA: 1, ribbon: 1, rail: rp, hlOthers: rp, hlKey: 0.35 + 0.65 * w('pulse')});
    Object.assign(nodes, pb.nodes, pa.nodes);
    nodes.cb = {display: !swapped};
    nodes.ca = {display: swapped};
    // --- substitution overlay ---------------------------------------------------
    const sk = w('strike');
    const wordFocus = ctx.params.focusTarget === 'word';
    const lf0 = seg(u, ...W.lift);
    nodes.strikes = {opacity: !swapped && sk > 0 && (!wordFocus || lf0 === 0) ? 1 : 0};
    L.oldBoxes.forEach((b, i) => { nodes[`strike${i}`] = {'stroke-dashoffset': r((b.w + 6) * (1 - sk))}; });
    const lf = w('lift');
    const liftY = -L.S * 1.1 * e(lf);
    nodes.ghost = {opacity: wordFocus && lf > 0 && !swapped ? r(1 - lf * 0.85, 3) : 0, transform: T(0, liftY)};
    // the page's old word leaves with the ghost (its strike goes with it)
    nodes['cb-art-kw'] = {opacity: ctx.params.focusTarget === 'word' && lf > 0 ? 0 : 1};
    // --- lens -----------------------------------------------------------------------
    const op = w('open'), cl = w('close');
    const pr = e(op) * (1 - e(cl));
    const C = {x: lerp(L.src.x, L.dst.x, pr), y: lerp(L.src.y, L.dst.y, pr)};
    const R = lerp(L.srcR, L.dstR, pr);
    const k = R / L.srcR;
    const visible = pr > 0.001;
    nodes.ldim = {opacity: r(0.36 * pr, 3)};
    nodes.lsrc = {opacity: visible ? 1 : 0};
    const [ta, tb] = tangents(L.src, L.srcR, C, R);
    [ta, tb].forEach((c, i) => { nodes[`cone${i}`] = {x1: r(c[0].x), y1: r(c[0].y), x2: r(c[1].x), y2: r(c[1].y), opacity: pr > 0.06 ? 1 : 0}; });
    nodes.lclip = {cx: r(C.x), cy: r(C.y), r: r(R - 4)};
    nodes.lwin = {opacity: visible ? r(Math.min(1, pr * 5), 3) : 0};
    nodes.lshadow = {cx: r(C.x + 10), cy: r(C.y + 14), r: r(R)};
    nodes.lbg = {cx: r(C.x), cy: r(C.y), r: r(R)};
    // the copy keeps source coordinates: the detail centre maps to the lens centre
    const tx = C.x - L.src.x * k, ty = C.y - L.src.y * k;
    nodes.lcontent = {transform: `translate(${r(tx)} ${r(ty)}) scale(${r(k, 4)})`};
    nodes['lring-o'] = {cx: r(C.x), cy: r(C.y), r: r(R)};
    nodes['lring-m'] = {cx: r(C.x), cy: r(C.y), r: r(R)};
    nodes['lring-i'] = {cx: r(C.x), cy: r(C.y), r: r(Math.max(1, R - 5))};
    // --- chips, caption, card, marker --------------------------------------------
    const cp = w('chip');
    if (L.baChip) {
      // a chip that rides under the lens leaves with it (the marker keeps old → new)
      nodes.baW = {opacity: r(cp * (L.chipRides ? 1 - cl : 1), 3)};
      if (L.baChip.strike) nodes.baStrike = {x2: r(lerp(L.baChip.strike.x1, L.baChip.strike.x2, seg(u, W.chip[0] + 0.02, W.chip[1])))};
    }
    if (L.caption) nodes.capW = {opacity: r(w('caption'), 3)};
    const cd = w('card');
    nodes.card = {opacity: r(cd, 3), transform: T(L.card.box.x, L.card.box.y + (1 - cd) * 10)};
    const mk = w('marker');
    if (L.marker) nodes.markerW = {opacity: r(mk, 3)};
    if (L.markerLead) Object.assign(nodes, L.markerLead.frame(mk));
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const p = ctx.params;
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const mapped = {x: L.src.x * k + tx, y: L.src.y * k + ty};
    return {
      nodes,
      semantic: {
        beat,
        focus: p.focusTarget,
        datum: swapped ? 'after' : 'before',
        shownValue: swapped ? p.afterValue : p.beforeValue,
        oldStruck: sk >= 1 && !swapped,
        oldTraceable: cp >= 1,
        occurrences: swapped ? L.after.others.length : L.before.others.length,
        occurrencesBefore: L.before.others.length,
        occurrencesAfter: L.after.others.length,
        railRedrawn: rp >= 1,
        lensOpen: r(pr, 3),
        lensCenter: P2(C),
        lensZoom: r(k, 3),
        sourceCenter: P2(L.src),
        mapsSource: Math.hypot(mapped.x - C.x, mapped.y - C.y) < 0.5,
        ghost: P2({x: L.ALb.key.cx, y: L.ALb.key.cy + liftY}),
        otherPassagesFixed: JSON.stringify(L.ALb.passages.filter(q => q.i !== L.sub.changed).map(q => q.y0)) === JSON.stringify(L.ALa.passages.filter(q => q.i !== L.sub.changed).map(q => q.y0)),
        marker: mk >= 1,
        contextMarks: marks >= 1,
        cardShown: cd >= 1,
        // the inset is a handle-less zoom callout: the only magnifier is the reader's, on the desk
        insetHasHandle: false,
        insetCentredOnKey: p.focusTarget !== 'word' || Math.hypot(L.src.x - L.ALb.key.cx, L.src.y - L.ALb.key.cy) < 0.5,
        insetShowsKey: L.keyInside,
        markerDrawn: Boolean(L.marker && L.markerLead),
        markerLeadHits: L.markerLeadHits,
        markerLeadLen: r(L.markerLeadLen),
        // leader length as a share of the stage width, and its detour over a straight line
        markerLeadShare: r(L.markerLeadLen / L.W, 3),
        markerLeadDetour: r(L.markerLeadDetour),
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
    slug: 'sources-01-inspect',
    title: 'Text and context — inspect and replace the key word',
    titleEs: 'Texto y contexto — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Texto y contexto',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The reading desk after the action: the key word back in its ringed article, its other occurrences on the margin rail, the book tied to its row on the author’s rack. A handle-less circular zoom inset holding a live copy at the same coordinates enlarges the key word (or its context passage) while the reader’s magnifier stays on the desk; the old datum is struck and lifted off before the supplied alternative appears, the occurrences are re-found in the supplied text and the rail is redrawn; the inset returns and a changed-datum marker stays beside the article with a short leader to the changed word. Seeking back restores the old datum exactly.',
    tags: ['text', 'context', 'inspect', 'zoom inset', 'magnifier', 'substitution', 'before after', 'book', 'article', 'editable hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/texto-y-contexto.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: TC_STRINGS,
  scene,
});
