/**
 * LAW-0160 — Regla transitoria · inspect
 *
 * Storyboard:
 *  0.00–0.20  build: the band desk in the state produced by the action — the
 *             band laid between version 1 and version 2, the post planted at
 *             the supplied milestone (Day 20), the lane marked before / after,
 *             the case cards pinned at their days with their strips; a context
 *             caption names the view.
 *  0.20–0.45  isolate: the desk shrinks into a thumbnail (kept visible, the
 *             source region outlined) while a REAL enlarged copy of the detail
 *             that tells "before" from "after" opens beside it: the post, its
 *             tag and the cards around it, at the same coordinates.
 *  0.45–0.75  substitute: one supplied datum changes inside the lens only —
 *             `milestoneDay`: the post slides from the old day to the new one
 *             (a dashed ghost of the post stays at the old day), the tag is
 *             re-printed, the lane marking follows the post and only a card
 *             whose day now lies on the other side changes its strip;
 *             `caseDay`: one card's pin slides to the new day and its day chip
 *             is re-stamped. One annotation keeps the old value readable
 *             (struck, old → new).
 *  0.75–1.00  return: the lens closes onto its source while the desk grows back
 *             and shows the new datum; a "datum changed" marker (neutral Δ)
 *             stays pinned to it with the old → new label. Seeking back
 *             restores the old datum exactly. No validity, effect or outcome.
 * @module animations/sources/LAW-0160
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, num, obj, oneOf, str} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {fitWords} from './kits/ambito-temporal.js';
import {transitionFields, RT_DEFAULTS, RT_STRINGS, rtData, bandDesk, sizeStageW, overlaps} from './kits/regla-transitoria.js';

const ID = 'LAW-0160';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W_ = {
  // one synchronised move each way: the lens opens WHILE the context shrinks and closes WHILE it grows, so the
  // frame never holds only a small thumbnail on an empty stage (item 19)
  caption: [0.03, 0.12], captionOut: [0.18, 0.22], shrink: [0.22, 0.34], open: [0.22, 0.34],
  ann: [0.46, 0.5], ghost: [0.49, 0.53], slide: [0.51, 0.65], retag: [0.63, 0.68], states: [0.62, 0.7],
  annOut: [0.755, 0.77], close: [0.77, 0.88], grow: [0.77, 0.88], lensOut: [0.878, 0.885], marker: [0.88, 0.93], captionIn: [0.89, 0.94],
};
const KEY_PX = 20.6;

const sceneSchema = {
  ...transitionFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the supplied milestone day, or the supplied day of one case', ['milestoneDay', 'caseDay']),
  focusCase: int('For focusTarget "caseDay": index of the case whose day is substituted', 0, 3),
  beforeValue: int('Supplied day before the substitution (replaces milestone.day, or the focus case\'s day)', -99, 1000),
  afterValue: int('Alternative supplied day after the substitution', -99, 1000),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens (upper bound; the lens also fits its window)', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  ...RT_DEFAULTS,
  focusTarget: 'milestoneDay',
  focusCase: 1,
  beforeValue: 20,
  afterValue: 14,
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'Context: band laid, cases placed by the supplied milestone', marker: 'Datum changed'},
};

const STRINGS = {
  en: {...RT_STRINGS.en, milestoneWord: 'Supplied milestone', dayOf: 'Supplied day of'},
  es: {...RT_STRINGS.es, milestoneWord: 'Hito aportado', dayOf: 'Día aportado de'},
};

const MODE = {landscape: 'wide', square: 'square', portrait: 'tall'};
const STAGE_W = {wide: 1900, square: 1080, tall: 900};

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

function dataFor(p, value) {
  if (p.focusTarget === 'milestoneDay') return rtData(p, {milestone: value});
  const fi = Math.max(0, Math.min(p.cases.length - 1, p.focusCase));
  return rtData(p, {caseDays: p.cases.map((c, i) => (i === fi ? value : c.day))});
}

/** The re-stamped day chip of the focus case (caseDay), drawn over the card's own chip. */
function newDayChip(ctx, L, desk, name) {
  const th = ctx.theme;
  const b = desk.cardDayBox(L.fi);
  const f = ctx.fit(L.dA.dayText(L.dA.cases[L.fi].day), {maxWidth: 600, size: L.K, minSize: L.K, maxLines: 1, weight: 800});
  const w = Math.max(b.w, f.width + L.K * 0.9);
  const x = b.x + b.w - w;
  return g({name, opacity: 0},
    h('path', {d: roundRectPath(x, b.y, w, b.h, 8), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2.2}),
    ctx.show('key') ? textBlock(f, {x: x + w / 2, y: b.y + (b.h - f.size) / 2 + 1, anchor: 'middle', fill: th.ink}) : h('rect', {x: x + 10, y: b.y + b.h / 2 - 4, width: w - 20, height: 8, rx: 4, fill: th.ink, opacity: 0.6}));
}

const scene = {
  sizes: {landscape: [1900, 900], square: [1080, 900], portrait: [900, 1340]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const mode = MODE[ctx.view.shape];
    const dB = dataFor(p, p.beforeValue);
    const dA = dataFor(p, p.afterValue);
    const target = p.focusTarget;
    const fi = Math.max(0, Math.min(p.cases.length - 1, p.focusCase));
    // both days are reserved on the ribbon (the passage never lies under either post position)
    const postDays = target === 'milestoneDay' ? [dB.milestone, dA.milestone] : [dB.milestone];
    const build = (W, K, prefix, tagF) => bandDesk(ctx, {
      prefix, mode, W, K, p, d: dB, arms: false, deck: false, holder: false, postDays, stableDom: true, nameRulerNumbers: prefix === 'lz',
      // (a narrow milestone tag keeps the focused region compact, so the lens magnifies it more)
      tagMax: K * tagF, slotGap: 0.9, rtNote: true,
      keyText: t.key, stateText: p.contextLabels.context, calloutTexts: [],
    });
    // the narrowest tag width that prints every supplied milestone text whole
    const buildFit = (W, K) => {
      let dk = null;
      for (const f of [9, 10.5, 12, 14, 16]) {
        dk = build(W, K, 'cx', f);
        dk.tagF = f;
        if (!dk.broken) break;
      }
      return dk;
    };
    const sized = sizeStageW(ctx, buildFit, mode === 'square' ? [STAGE_W.square, STAGE_W.square * 1.12, STAGE_W.square * 1.25] : [STAGE_W[mode]], KEY_PX);
    const C = sized.desk;
    const K = C.K;
    const L2 = build(C.W, K, 'lz', C.tagF);
    const W = C.W, H = C.H;
    const m = 16;
    const xB = C.along(dB.milestone), xA = C.along(dA.milestone);
    const pinB = C.along(dB.cases[fi].day), pinA = C.along(dA.cases[fi].day);
    const sidesBefore = dB.cases.map(c => c.side), sidesAfter = dA.cases.map(c => c.side);
    const changed = sidesBefore.map((s0, i) => (s0 !== sidesAfter[i] ? i : -1)).filter(i => i >= 0);

    // --- recomposition (model: LAW-0136 / LAW-0120): the context shrinks into a corner thumbnail and the lens
    // uses the rest of the frame. Landscape: thumbnail top-left, lens at the right; square / portrait: lens
    // across the top, thumbnail bottom-left (the annotation beside it).
    // --- the FOCUSED source region: the milestone tag (both positions), the post and the one card whose side
    // changes (milestoneDay); the focus card, its old and new pin and the post (caseDay)
    const unionB = bs => { const x0 = Math.min(...bs.map(q => q.x)), y0 = Math.min(...bs.map(q => q.y)); return {x: x0, y: y0, w: Math.max(...bs.map(q => q.x + q.w)) - x0, h: Math.max(...bs.map(q => q.y + q.h)) - y0}; };
    const focusCards = target === 'milestoneDay'
      ? (changed.length ? changed : [C.slotCx.map((cx, i) => [Math.abs(cx - xA), i]).sort((q1, q2) => q1[0] - q2[0])[0][1]])
      : [fi];
    const knob = x => ({x: x - C.KR - K * 0.4, y: C.laneC - C.KR, w: C.KR * 2 + K * 0.8, h: C.KR * 2});
    const pinBox = x => ({x: x - K * 0.8, y: C.rulerTop, w: K * 1.6, h: C.rulerBottom - C.rulerTop});
    const focusBoxes = [
      ...(target === 'milestoneDay' ? [C.tagBox(xB), C.tagBox(xA), knob(xB), knob(xA)] : [knob(xB), pinBox(pinB), pinBox(pinA)]),
      ...focusCards.map(i => C.slots[i]),
      ...focusCards.map(i => pinBox(C.pinXs[i])),
    ];
    const F = unionB(focusBoxes);
    const pad = K * 0.3;
    const Fp = {w: F.w + 2 * pad, h: F.h + 2 * pad};
    // compositions: thumbnail in a corner, the lens over the rest of the frame (right of it, under it or above
    // it); the one that magnifies the focused region most wins (placement 'left'/'right'/'top'/'bottom' forces
    // the lens side)
    const pl = p.detailGeometry.placement;
    const kT = mode === 'wide' ? 0.22 : mode === 'square' ? 0.25 : 0.38;
    const thW = W * kT, thH = H * kT;
    // the frame in desk units (the design space can be larger than the desk: the lens may use all of it)
    const V = {x: -sized.fit.ox / sized.fit.s, y: -sized.fit.oy / sized.fit.s, w: ctx.design.w / sized.fit.s, h: ctx.design.h / sized.fit.s};
    const vx = V.x + m, vy = V.y + m, vr = V.x + V.w - m, vb = V.y + V.h - m;
    const comps = [
      {side: 'right', thumb: {x: vx, y: vy}, A: {x: vx + thW + 24, y: vy, w: vr - (vx + thW + 24), h: vb - vy}},
      {side: 'bottom', thumb: {x: vx, y: vy}, A: {x: vx, y: vy + thH + 24, w: vr - vx, h: vb - (vy + thH + 24)}},
      {side: 'top', thumb: {x: vx, y: vb - thH}, A: {x: vx, y: vy, w: vr - vx, h: vb - thH - 24 - vy}},
    ].map(c => ({...c, z: Math.min(Math.max(1.5, p.detailGeometry.zoom), c.A.w / Fp.w, c.A.h / Fp.h)}));
    const forced = {right: 'right', left: 'right', top: 'top', bottom: 'bottom'}[pl];
    const pick = (forced && comps.find(c => c.side === forced)) || comps.reduce((best, c) => (c.z > best.z + 0.02 ? c : best));
    const A = pick.A;
    const G = {kT, thumb: pick.thumb, side: pick.side};
    const winLim = {x: 4, y: Math.max(4, C.zoneTop - K), w: W - 8, h: H - 4 - Math.max(4, C.zoneTop - K)};
    const zoomMax = Math.max(1.5, p.detailGeometry.zoom);
    const ar = A.w / A.h;
    let S = growTo({x: F.x - pad, y: F.y - pad, w: F.w + 2 * pad, h: F.h + 2 * pad}, ar, winLim);
    // the lens magnifies at most `zoom`: a small source grows (around its centre) to A / zoom
    if (A.w / S.w > zoomMax) S = growTo({x: S.x + S.w / 2 - A.w / zoomMax / 2, y: S.y + S.h / 2 - A.h / zoomMax / 2, w: A.w / zoomMax, h: A.h / zoomMax}, ar, winLim);
    // the rim never runs through a printed ruler number: each vertical edge moves outward past the number it
    // would cut (inward when there is no room)
    const numSize = K * 0.95;
    const nums = [];
    (function walk(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walk); return; }
      const nm = n.attrs && n.attrs.name;
      if (typeof nm === 'string' && /^lz-rn-?\d+$/.test(nm)) {
        const day = Number(nm.slice(5));
        const half = ctx.measure(String(day), numSize, 700, 'sans') / 2 + 4;
        nums.push({name: nm, x0: C.along(day) - half, x1: C.along(day) + half});
      }
      walk(n.children);
    })(L2.node);
    {
      let e0 = S.x, e1 = S.x + S.w;
      const cut = e => nums.find(q => e > q.x0 && e < q.x1);
      // (inward first while the focused region stays whole — outward would lower the magnification)
      const c0 = cut(e0); if (c0) e0 = c0.x1 + 4 <= F.x ? c0.x1 + 4 : c0.x0 - 4 >= winLim.x ? c0.x0 - 4 : c0.x1 + 4;
      const c1 = cut(e1); if (c1) e1 = c1.x0 - 4 >= F.x + F.w ? c1.x0 - 4 : c1.x1 + 4 <= winLim.x + winLim.w ? c1.x1 + 4 : c1.x0 - 4;
      S = {...S, x: e0, w: e1 - e0};
    }
    // destination: the source at the largest zoom (≤ zoom) that fits the lens area, centred in it
    const zk = Math.min(zoomMax, A.w / S.w, A.h / S.h);
    const dest = {x: A.x + (A.w - S.w * zk) / 2, y: A.y + (A.h - S.h * zk) / 2, w: S.w * zk, h: S.h * zk};
    // --- lens-copy elements the rim would cut are left out of the copy (whole or nothing)
    const inside = q => q.x >= S.x - 0.5 && q.y >= S.y - 0.5 && q.x + q.w <= S.x + S.w + 0.5 && q.y + q.h <= S.y + S.h + 0.5;
    const meets = q => q.x < S.x + S.w && q.x + q.w > S.x && q.y < S.y + S.h && q.y + q.h > S.y;
    const hideInLens = {};
    C.slots.forEach((q, i) => { hideInLens[`lz-c${i}`] = !inside(q); });
    C.bookBoxes.forEach((q, i) => { hideInLens[`lz-book${i}`] = !inside(q); });
    const ribNames = [];
    (function walk(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walk); return; }
      const nm = n.attrs && n.attrs.name;
      if (typeof nm === 'string' && /^lz-rib\d+-\d+$/.test(nm)) ribNames.push(nm);
      walk(n.children);
    })(L2.node);
    const ribHide = C.ribbonBlocks.map(q => !inside(q));
    for (const nm of ribNames) hideInLens[nm] = ribHide[Number(nm.slice(6).split('-')[0])];
    for (const q of nums) hideInLens[q.name] = !(q.x0 >= S.x && q.x1 <= S.x + S.w) || !(C.rulerTop >= S.y && C.rulerBottom <= S.y + S.h);
    hideInLens['lz-rnu'] = S.x > C.geo.x + 4;
    // (only nodes this copy actually draws — e.g. no numbers with labels hidden)
    const drawn = new Set();
    (function walk(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walk); return; }
      if (n.attrs && typeof n.attrs.name === 'string') drawn.add(n.attrs.name);
      walk(n.children);
    })(L2.node);
    for (const k of Object.keys(hideInLens)) if (!drawn.has(k)) delete hideInLens[k];
    const tagCut = [C.tagBox(xB), ...(target === 'milestoneDay' ? [C.tagBox(xA)] : [])].map(q => meets(q) && !inside(q));

    // annotation (old struck → new) and the marker label
    const lab = target === 'milestoneDay' ? t.milestoneWord : `${t.dayOf} ${dB.cases[fi].label}`;
    const oldTxt = dB.dayText(p.beforeValue), newTxt = dB.dayText(p.afterValue);
    const annSize = K * 0.92;
    const mk = (name, head, maxW) => {
      const hf = fitWords(ctx, head, {maxWidth: maxW - K * 1.4, size: annSize, minSize: annSize, floorSize: annSize, maxLines: 3, weight: 700});
      const ofit = ctx.fit(oldTxt, {maxWidth: 400, size: annSize, maxLines: 1, weight: 800});
      const nfit = ctx.fit(newTxt, {maxWidth: 400, size: annSize, maxLines: 1, weight: 800});
      const arrowW = K * 2;
      const rowW = ofit.width + arrowW + nfit.width;
      const w = Math.max(hf.width, rowW) + K * 1.4;
      const hh = hf.height + K * 0.4 + ofit.size + K * 0.9;
      const build2 = (x, y) => g({name, opacity: 0},
        h('path', {d: roundRectPath(x, y, w, hh, K * 0.6), fill: th.card, stroke: th.accent2, 'stroke-width': 2.5}),
        ctx.show('key') ? [
          textBlock(hf, {x: x + K * 0.7, y: y + K * 0.45, fill: th.ink}),
          textBlock(ofit, {x: x + K * 0.7, y: y + K * 0.45 + hf.height + K * 0.4, fill: th.inkSoft}),
          h('line', {x1: x + K * 0.6, x2: x + K * 0.8 + ofit.width, y1: y + K * 0.45 + hf.height + K * 0.4 + ofit.size * 0.5, y2: y + K * 0.45 + hf.height + K * 0.4 + ofit.size * 0.5, stroke: th.ink, 'stroke-width': 2.5}),
          h('path', {d: `M${r(x + K * 0.7 + ofit.width + K * 0.4)} ${r(y + K * 0.45 + hf.height + K * 0.4 + ofit.size * 0.55)}h${r(K * 1.1)}m${r(-K * 0.4)} ${r(-K * 0.3)}l${r(K * 0.4)} ${r(K * 0.3)}l${r(-K * 0.4)} ${r(K * 0.3)}`, fill: 'none', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
          textBlock(nfit, {x: x + K * 0.7 + ofit.width + arrowW, y: y + K * 0.45 + hf.height + K * 0.4, fill: th.ink}),
        ] : null);
      return {w, hh, build: build2};
    };
    // annotation shown during the substitution, beside the lens (in the thumbnail's column / row)
    // (beside the thumbnail: under it when the lens is at its right, otherwise at its right in the same band)
    const annMaxW = G.side === 'right' ? thW : W - thW - 3 * m;
    const annT = mk('ann', lab, annMaxW);
    const annAt = G.side === 'right' ? {x: m, y: G.thumb.y + thH + K} : {x: G.thumb.x + thW + m, y: G.thumb.y};
    const ann = {node: annT.build(annAt.x, annAt.y), box: {x: annAt.x, y: annAt.y, w: annT.w, h: annT.hh}};
    // marker (Δ) + label kept at the hold, next to the new datum
    const mTarget = target === 'milestoneDay' ? (() => { const b = C.tagBox(xA); return {x: b.x + b.w, y: b.y}; })() : (() => { const b = C.cardDayBox(fi); return {x: b.x + b.w, y: b.y}; })();
    // marker label: the widest chip that finds free desk (above the band, clear of the tag, the books and notes)
    const obstacles = [C.tagBox(xA), ...C.bookBoxes, ...C.slots, ...(C.rack ? [C.rack] : []), ...(C.note ? [C.note] : []), ...C.notes];
    let markT = null, mb = null;
    for (const fw of [17, 13, 10.5, 8.5, 7]) {
      markT = mk('mark', `${p.contextLabels.marker} · ${lab}`, Math.min(K * fw, W * 0.6));
      for (let yy = 16; yy + markT.hh < H - 16; yy += 10) {
        for (let xx = 16; xx + markT.w < W - 16; xx += 12) {
          const b2 = {x: xx, y: yy, w: markT.w, h: markT.hh};
          if (obstacles.some(q => overlaps(b2, q, 10))) continue;
          if (b2.y + b2.h > C.ribbonTop - 6 && b2.y < C.rulerBottom + 6) continue;
          const dd = Math.hypot(b2.x + b2.w / 2 - mTarget.x, b2.y + b2.h / 2 - mTarget.y);
          if (!mb || dd < mb.d) mb = {...b2, d: dd};
        }
      }
      if (mb) break;
    }
    if (!mb) mb = {x: 16, y: 16, w: markT.w, h: markT.hh};
    const mark = {node: markT.build(mb.x, mb.y), box: mb};
    const leadFrom = {x: clamp(mTarget.x, mb.x, mb.x + mb.w), y: mTarget.y < mb.y ? mb.y : mTarget.y > mb.y + mb.h ? mb.y + mb.h : mb.y + mb.h / 2};

    return {hideInLens, tagCut, zoom: zk, C, L2, K, W, H, G, S, dest, dB, dA, fi, target, xB, xA, pinB, pinA, sidesBefore, sidesAfter, changed, ann, mark, mTarget, leadFrom, fit: sized.fit, sized};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const S = L.S;
    const clipId = 'lens-clip';
    return g({transform: T(L.fit.ox, L.fit.oy, 0, L.fit.s)},
      g({name: 'ctx'}, L.C.node,
        L.target === 'caseDay' ? newDayChip(ctx, L, L.C, 'cx-newday') : null,
        h('path', {name: 'ctx-ghost', d: roundRectPath(-L.C.KR, -L.C.KR, L.C.KR * 2, L.C.KR * 2, L.C.KR), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '6 5', opacity: 0}),
        // the context outside the source region dims while the lens is open (the thumbnail reads as background)
        h('path', {name: 'ctx-dim', d: `M0 0h${r(L.W)}v${r(L.H)}h${r(-L.W)}Z M${r(S.x)} ${r(S.y)}v${r(S.h)}h${r(S.w)}v${r(-S.h)}Z`, 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
        h('path', {name: 'ctx-src', d: roundRectPath(S.x, S.y, S.w, S.h, 14), fill: 'none', stroke: th.accent2, 'stroke-width': 6, opacity: 0}),
        h('line', {name: 'mark-lead', x1: r(L.leadFrom.x), y1: r(L.leadFrom.y), x2: r(L.mTarget.x), y2: r(L.mTarget.y), stroke: th.accent2, 'stroke-width': 2.5, opacity: 0}),
        g({name: 'mark-disc', opacity: 0}, changedMarker(ctx, {x: L.mTarget.x, y: L.mTarget.y, radius: L.K * 0.8})),
        L.mark.node,
      ),
      // (the cone runs beneath the lens window: it never crosses the enlarged copy)
      h('line', {name: 'coneA', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'coneB', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'lens-cliprect', rx: 22}))),
      g({name: 'lens', opacity: 0},
        h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
        // the opaque window: text of the shrinking context that lies fully under it is hidden (harness opt-out)
        g({'data-occludes': 1}, h('rect', {name: 'lens-bg', rx: 22, fill: th.woodTop})),
        g({'clip-path': ctx.ref(clipId)}, g({name: 'lens-content'}, L.L2.node,
          L.target === 'caseDay' ? newDayChip(ctx, L, L.L2, 'lz-newday') : null,
          h('path', {name: 'lz-ghost', d: roundRectPath(-L.C.KR, -L.C.KR, L.C.KR * 2, L.C.KR * 2, L.C.KR), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '6 5', opacity: 0}))),
        h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.accent2, 'stroke-width': 6}),
      ),
      L.ann.node,
    );
  },
  frame(ctx, L, u) {
    const K = L.K;
    const nodes = {};
    const C = L.C;
    // --- substitution progress (same in the lens and, from the return on, in the context)
    const slide = ease.inOutSine(seg(u, ...W_.slide));
    const retag = seg(u, ...W_.retag);
    const states = seg(u, ...W_.states);
    const mX = L.target === 'milestoneDay' ? lerp(L.xB, L.xA, slide) : L.xB;
    const pinX = L.target === 'caseDay' ? lerp(L.pinB, L.pinA, slide) : null;
    const sideNow = i => (states >= 0.5 ? L.sidesAfter[i] : L.sidesBefore[i]);
    const cardsV = L.dB.cases.map((c, i) => ({state: 'slot', pin: 1, strip: L.changed.includes(i) ? Math.abs(states - 0.5) * 2 : 1, side: sideNow(i), dayX: i === L.fi && pinX !== null ? pinX : undefined}));
    const tagOp = L.target === 'milestoneDay' ? [1 - retag, retag] : [1];
    const v = {band: 1, postState: 'planted', postX: mX, tagXs: L.target === 'milestoneDay' ? [L.xB, L.xA] : undefined, tagOpacity: tagOp, zones: 1, cards: cardsV};
    // the context shows the old datum until the lens closes, then the new one
    const back = u >= W_.close[0];
    const vC = back ? v : {...v, postX: L.xB, tagOpacity: L.target === 'milestoneDay' ? [1, 0] : [1], cards: L.dB.cases.map((c, i) => ({state: 'slot', pin: 1, strip: 1, side: L.sidesBefore[i]}))};
    const pc = C.pose(vC), pl = L.L2.pose(v);
    Object.assign(nodes, pc.nodes, pl.nodes);
    // day chip re-stamp (caseDay): the old chip lifts away, the new one is stamped in its place
    if (L.target === 'caseDay') {
      nodes[`lz-c${L.fi}-day`] = {opacity: r(1 - clamp(retag * 2), 3), transform: `translate(0 ${r(-10 * clamp(retag * 2))})`};
      nodes['lz-newday'] = {opacity: r(clamp(retag * 2 - 1), 3)};
      nodes[`cx-c${L.fi}-day`] = {opacity: back ? r(1 - clamp(retag * 2), 3) : 1};
      nodes['cx-newday'] = {opacity: back ? r(clamp(retag * 2 - 1), 3) : 0};
    }
    // ghost of the old post (milestoneDay) inside the lens, and at the hold in the context
    const ghostOn = L.target === 'milestoneDay' ? seg(u, ...W_.ghost) : 0;
    nodes['lz-ghost'] = {transform: T(L.xB, C.laneC), opacity: r(ghostOn * 0.9, 3)};
    nodes['ctx-ghost'] = {transform: T(L.xB, C.laneC), opacity: back && L.target === 'milestoneDay' ? r(seg(u, ...W_.marker) * 0.9, 3) : 0};
    // --- context transform: full → thumbnail → full
    const shrink = ease.inOutCubic(seg(u, ...W_.shrink)) * (1 - ease.inOutCubic(seg(u, ...W_.grow)));
    const kC = lerp(1, L.G.kT, shrink);
    const oC = {x: lerp(0, L.G.thumb.x, shrink), y: lerp(0, L.G.thumb.y, shrink)};
    nodes.ctx = {transform: T(oC.x, oC.y, 0, kC)};
    const inOpen = seg(u, ...W_.open), outClose = seg(u, ...W_.close);
    // the window grows slightly ahead of the shrinking context and closes slightly behind the growing one
    const lensP = ease.outQuad(inOpen) * (1 - ease.inQuad(outClose));
    const lensVis = u >= W_.open[0] && u < W_.lensOut[1] ? (u >= W_.lensOut[0] ? 1 - seg(u, ...W_.lensOut) : 1) : 0;
    nodes['ctx-src'] = {opacity: r(lensP > 0.02 ? lensVis : 0, 3)};
    nodes['ctx-dim'] = {opacity: r(0.5 * lensP, 3)};
    // lens copy: an element the rim would cut is left out of the copy (whole or nothing)
    for (const [nm, hid] of Object.entries(L.hideInLens)) nodes[nm] = {...(nodes[nm] || {}), opacity: hid ? 0 : 1};
    L.tagCut.forEach((cut, k) => { if (cut) { const nm = k === 0 ? 'lz-tag' : `lz-tag${k}`; nodes[nm] = {...(nodes[nm] || {}), opacity: 0}; } });
    // source rect in stage coordinates (follows the context transform)
    const S = L.S;
    const Ss = {x: oC.x + S.x * kC, y: oC.y + S.y * kC, w: S.w * kC, h: S.h * kC};
    const D = L.dest;
    const R = {x: lerp(Ss.x, D.x, lensP), y: lerp(Ss.y, D.y, lensP), w: lerp(Ss.w, D.w, lensP), h: lerp(Ss.h, D.h, lensP)};
    const k = R.w / S.w;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    nodes['lens-cliprect'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['lens-content'] = {transform: `${T(R.x - S.x * k, R.y - S.y * k)} scale(${r(k, 4)})`};
    nodes.lens = {opacity: r(lensVis, 3)};
    const coneOn = lensVis > 0 && lensP > 0.05 && lensP < 0.999 ? 1 : lensVis > 0 && lensP >= 0.999 ? 1 : 0;
    // cone: the two source corners facing the lens to the two lens corners facing the source
    const dx = D.x + D.w / 2 - (Ss.x + Ss.w / 2), dy = D.y + D.h / 2 - (Ss.y + Ss.h / 2);
    const horiz = Math.abs(dx) / (D.w + Ss.w) >= Math.abs(dy) / (D.h + Ss.h);
    const [a1, a2, b1, b2] = horiz
      ? (dx > 0
        ? [{x: Ss.x + Ss.w, y: Ss.y}, {x: R.x, y: R.y}, {x: Ss.x + Ss.w, y: Ss.y + Ss.h}, {x: R.x, y: R.y + R.h}]
        : [{x: Ss.x, y: Ss.y}, {x: R.x + R.w, y: R.y}, {x: Ss.x, y: Ss.y + Ss.h}, {x: R.x + R.w, y: R.y + R.h}])
      : (dy > 0
        ? [{x: Ss.x, y: Ss.y + Ss.h}, {x: R.x, y: R.y}, {x: Ss.x + Ss.w, y: Ss.y + Ss.h}, {x: R.x + R.w, y: R.y}]
        : [{x: Ss.x, y: Ss.y}, {x: R.x, y: R.y + R.h}, {x: Ss.x + Ss.w, y: Ss.y}, {x: R.x + R.w, y: R.y + R.h}]);
    nodes.coneA = {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: coneOn};
    nodes.coneB = {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: coneOn};
    // --- editorial: context caption (key/state chips of the desk), annotation, marker
    const capOn = u < W_.captionOut[1] ? clamp(seg(u, ...W_.caption) * (1 - seg(u, ...W_.captionOut))) : seg(u, ...W_.captionIn);
    nodes['cx-key'] = {opacity: r(capOn, 3)};
    nodes['cx-state'] = {opacity: r(capOn, 3)};
    nodes['lz-key'] = {opacity: 0};
    nodes['lz-state'] = {opacity: 0};
    nodes.ann = {opacity: r(seg(u, ...W_.ann) * (1 - seg(u, ...W_.annOut)), 3)};
    const mk = seg(u, ...W_.marker);
    nodes['mark-disc'] = {opacity: r(mk, 3)};
    nodes['mark-lead'] = {opacity: r(mk, 3)};
    nodes.mark = {opacity: r(mk, 3)};
    // --- semantics
    const S2 = {x: R.x - S.x * k + S.x * k, y: R.y - S.y * k + S.y * k};
    const datum = slide >= 1 ? 'after' : slide <= 0 ? 'before' : 'changing';
    const datumValue = slide >= 1 ? L.target === 'milestoneDay' ? L.dA.milestone : L.dA.cases[L.fi].day : L.target === 'milestoneDay' ? L.dB.milestone : L.dB.cases[L.fi].day;
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {nodes, semantic: {
      beat, datum, datumValue,
      contextShows: back ? 'new' : 'old',
      lensOpen: r(lensP, 3), lensVisible: r(lensVis, 3), thumbScale: r(kC, 3),
      lensMapsSource: Math.abs(S2.x - R.x) < 0.5 && Math.abs(S2.y - R.y) < 0.5 && Math.abs(S.w * k - R.w) < 0.5 && Math.abs(S.h * k - R.h) < 0.5,
      lensRect: {x: r(R.x), y: r(R.y)}, lensZoom: r(k, 3), lensZoomOpen: r(L.zoom, 3), lensSrc: {x: r(L.S.x), y: r(L.S.y), w: r(L.S.w), h: r(L.S.h)},
      post: pl.semantic.post, postCtx: pc.semantic.post,
      sidesNow: L.dB.cases.map((c, i) => sideNow(i)), sidesBefore: L.sidesBefore, sidesAfter: L.sidesAfter, changedCards: L.changed,
      markerShown: r(mk, 3), ghost: r(ghostOn, 3),
      coverage: (() => {
        const A = {x: oC.x, y: oC.y, w: L.W * kC, h: L.H * kC};
        const B = lensVis > 0 ? R : {x: 0, y: 0, w: 0, h: 0};
        const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)), iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
        return r((A.w * A.h + B.w * B.h - ix * iy) / (L.W * L.H), 3);
      })(),
      largest: r(Math.max(kC * kC, lensVis > 0 ? (R.w * R.h) / (L.W * L.H) : 0), 3),
      allReached: true,
      textPx: r(L.sized.px, 2), broken: C.brokenList,
    }};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-10-inspect',
    title: 'Transitional rule — inspect the supplied milestone and change it',
    titleEs: 'Regla transitoria — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Regla transitoria',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The band desk after the action shrinks to a thumbnail while a real enlarged copy of the post, its tag and the nearby case cards opens beside it; the supplied milestone (or one case\'s day) is substituted there — the post slides, a ghost keeps the old position, only the card whose side changes updates its strip — and the view returns to the desk with a neutral changed-datum marker. No version is said to apply.',
    tags: ['sources', 'transitional rule', 'inspect', 'lens', 'milestone', 'substitution', 'versions', 'timeline', 'cases'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/regla-transitoria.js', 'src/animations/sources/kits/ambito-temporal.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
