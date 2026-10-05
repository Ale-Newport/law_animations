/**
 * LAW-0032 — Cadena de versiones · inspect
 *
 * Storyboard:
 *  0.00–0.20  context: the filed chain on the desk, with the index tab on the
 *             selected copy (the state produced by the story).
 *  0.20–0.45  isolate: a lens opens from the header bands that carry the
 *             distinguishing detail (which copy the tab is on, or that copy’s
 *             date / identifier) into the desk area freed by the piles. The
 *             lens content is a real second drawing at the same coordinates.
 *  0.45–0.75  substitute ONE datum inside the lens: the tab slides from the
 *             before-copy’s band to the after-copy’s band (or the date / id
 *             text is replaced). A dashed ghost keeps the old position
 *             traceable; the before chip is struck through, the after chip
 *             appears.
 *  0.71–1.00  return: the lens closes and the before → after chips travel with
 *             it back to the chain (they settle beside the changed copy); only
 *             then does the context tab / datum change, keeping a ghost of the
 *             old one, and a “datum changed” marker appears. Seeking back
 *             restores the previous datum exactly. No validity or effect is
 *             inferred.
 * @module animations/documents/LAW-0032
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r, lerp} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {documentsFields, inspectFields, str} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {versionDesk, versionFields, versionIndex, indexTab, tightChip, STAGE, TAB_COLOR} from './kits/cadena-de-versiones.js';
import {shade} from '../../primitives/paper.js';

const ID = 'LAW-0032';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.71], return: [0.71, 1]};
/** The context datum changes only after the lens has closed, so the two never animate at once. */
const W = {
  ctxCaption: [0.03, 0.12], open: [0.2, 0.38], before: [0.34, 0.42], strike: [0.45, 0.5],
  change: [0.48, 0.65], ghost: [0.5, 0.58], after: [0.6, 0.67], close: [0.71, 0.79], annBack: [0.75, 0.82], ctxUpdate: [0.79, 0.86], marker: [0.86, 0.91],
};

const STRINGS = {
  en: {selection: 'Tab on', date: 'Date', versionId: 'Version'},
  es: {selection: 'Pestaña en', date: 'Fecha', versionId: 'Versión'},
};

const sceneSchema = {
  ...documentsFields,
  ...versionFields,
  ...inspectFields(['selection', 'date', 'versionId']),
  folderLabel: str('Label printed on the file tab', 40),
};

const defaultParams = {
  documentId: 'DOC-311',
  documentTitle: 'Supply Agreement',
  clauses: ['Scope of supply', 'Prices (hypothetical)', 'Delivery schedule'],
  signers: [{name: 'Lena Ortiz', role: 'Clerk'}, {name: 'Kofi Mensah', role: 'Reviewer'}],
  redactions: [],
  versions: [
    {id: 'v1', date: 'Day 2'},
    {id: 'v2', date: 'Day 5'},
    {id: 'v3', date: 'Day 9'},
    {id: 'v4', date: 'Day 12'},
  ],
  selectedVersion: 'v4',
  focusTarget: 'selection',
  beforeValue: 'v4',
  afterValue: 'v3',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Filed chain, tab on the selected copy', marker: 'Datum changed'},
  folderLabel: 'Version file',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
const CAP = 64; // caption strip above the desk

const scene = {
  sizes: {
    landscape: [STAGE.horizontal.w, STAGE.horizontal.h + CAP],
    square: [STAGE.square.w, STAGE.square.h + CAP],
    portrait: [STAGE.vertical.w, STAGE.vertical.h + CAP],
  },
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const D = ctx.design;
    const target = p.focusTarget;
    const N = p.versions.length;

    // copies involved: for 'selection' the tab moves between two copies; for
    // 'date' / 'versionId' one datum of the tabbed copy is replaced
    const sel = versionIndex(p.versions, p.selectedVersion);
    const kBefore = target === 'selection' ? versionIndex(p.versions, p.beforeValue, N - 1) : sel;
    let kAfter = target === 'selection' ? versionIndex(p.versions, p.afterValue, Math.max(0, N - 2)) : sel;
    if (target === 'selection' && kAfter === kBefore) kAfter = kBefore > 0 ? kBefore - 1 : Math.min(N - 1, kBefore + 1);
    const swap = target === 'date' ? {index: sel, date: [p.beforeValue, p.afterValue]}
      : target === 'versionId' ? {index: sel, id: [p.beforeValue, p.afterValue]} : null;

    // context caption (up to two lines); the desk takes the remaining height
    const capFit = ctx.show('all') ? ctx.fit(`${t.context}: ${p.contextLabels.context}`, {maxWidth: D.w - 20, size: 36, minSize: 28, maxLines: 2, weight: 600}) : null;
    const capH = capFit ? Math.max(CAP, capFit.height + 22) : CAP;
    const k = Math.min((D.h - capH) / st.h, D.w / st.w);
    const sx = (D.w - st.w * k) / 2;
    const sy = capH;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const stage = versionDesk(ctx, {prefix: 'ctx', axis, versions: p.versions, selected: kBefore, doc, people: p.signers, folderLabel: p.folderLabel, swap: swap || undefined});
    const G = stage.G;
    const S = stage.S;
    const toDesign = q => ({x: sx + q.x * k, y: sy + q.y * k});

    // --- source region (stage coords): the band(s) + tab involved
    const lo = Math.min(kBefore, kAfter), hi = Math.max(kBefore, kAfter);
    const bLo = stage.bandBox(lo), bHi = stage.bandBox(hi);
    const tipX = Math.max(stage.tabTip(lo).x, stage.tabTip(hi).x);
    // top edge just above the band so the previous copy's band text is not sliced
    const reg = {x: bLo.x - 14, y: bLo.y - 3, w: tipX + 18 - (bLo.x - 14), h: bHi.y + bHi.h + 16 - (bLo.y - 3)};
    // a date substitution needs only the right part of the band (pips, date,
    // tab): crop the identifier badge off when the free desk area is narrow,
    // so the datum is enlarged as much as in the other ratios
    if (target === 'date') {
      const bdg = stage.sheets[sel].badge;
      const cropX = bLo.x + bdg.x + bdg.w + 3;
      const freeW = (G.chain0.x - 34 - 30) * 0.98;
      if (reg.w * p.detailGeometry.zoom > freeW && axis !== 'vertical') {
        reg.w -= cropX - reg.x;
        reg.x = cropX;
      }
    }
    const sTL = toDesign(reg);
    const source = {x: sTL.x, y: sTL.y, w: reg.w * k, h: reg.h * k};
    const ratio = source.h / source.w;

    // --- free desk area (freed by the piles) and the before/after chip metrics
    const zoom = p.detailGeometry.zoom;
    const stageBox = {x: sx, y: sy, w: st.w * k, h: st.h * k};
    let place = p.detailGeometry.placement;
    if (place === 'auto') place = axis === 'vertical' ? 'top' : 'left';
    const stacked = place === 'top' || place === 'bottom';
    const freeX0 = sx + 30 * k;
    const freeX1 = stacked ? sx + stageBox.w - 30 * k : toDesign({x: G.chain0.x - 34, y: 0}).x;
    const half = Math.min((freeX1 - freeX0) / 2 - 30, 420);
    const label = t[target];
    const beforeText = target === 'selection' ? `${label}: ${p.versions[kBefore].id}` : `${label}: ${p.beforeValue}`;
    const afterText = target === 'selection' ? `${label}: ${p.versions[kAfter].id}` : `${label}: ${p.afterValue}`;
    const size = 34 * Math.max(0.8, Math.min(1.2, k * 1.1));
    const probes = ctx.show('key') ? [beforeText, afterText].map(tx => tightChip(ctx, tx, {x: 0, y: 0, maxWidth: half, size, maxLines: 2})) : null;
    const chH = probes ? Math.max(probes[0].box.h, probes[1].box.h) : 0;

    // --- lens destination
    let dest, annY;
    if (stacked) {
      const tops = [stage.chipA, stage.chipB].filter(Boolean).map(c => c.box.y + c.box.h);
      const freeTop = sy + ((tops.length ? Math.max(...tops) : 60) + 20) * k;
      const freeBottom = toDesign({x: 0, y: G.folder.y - 60}).y;
      const annH = chH ? chH + 24 : 0;
      const w = Math.min(freeX1 - freeX0, source.w * zoom, (freeBottom - freeTop - annH) / ratio);
      const hh = w * ratio;
      dest = {x: (freeX0 + freeX1) / 2 - w / 2, y: freeTop + annH + Math.max(0, (freeBottom - freeTop - annH - hh) / 2), w, h: hh};
      annY = dest.y - 24 - chH;
    } else {
      const w = Math.min(freeX1 - freeX0, source.w * zoom);
      const hh = w * ratio;
      const cy = clamp(source.y + source.h / 2, sy + 60 * k + hh / 2, sy + stageBox.h - 60 * k - chH - hh / 2);
      dest = {x: place === 'right' ? freeX1 - w : freeX0, y: cy - hh / 2, w, h: hh};
      annY = dest.y + dest.h + 26;
    }

    // --- lens content: a real second drawing at the same coordinates
    const lensTab = indexTab(ctx, {name: 'lens-tab', ...G.tab});
    const before = stage.tabAttach(kBefore), after = stage.tabAttach(kAfter);
    const ghostPath = (name, at) => h('path', {name, d: roundRectPath(at.x - G.tab.overlap, at.y - G.tab.h / 2, G.tab.overlap + G.tab.protrude, G.tab.h, 8), fill: 'none', stroke: shade(TAB_COLOR, -0.35), 'stroke-width': 3, 'stroke-dasharray': '8 6', opacity: 0});
    const lensContent = g({transform: T(sx, sy, 0, k)},
      stage.chainCopyNode('lz', swap || undefined),
      target === 'selection' ? ghostPath('lens-ghost', before) : null,
      g({name: 'lens-tabpos', transform: T(before.x, before.y)}, lensTab.node),
    );
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // --- single editorial annotation: before → after, old value kept visible
    let beforeChip = null, afterChip = null, arrow = null;
    if (probes) {
      const cx = dest.x + dest.w / 2;
      beforeChip = tightChip(ctx, beforeText, {x: cx - 24, y: annY + (chH - probes[0].box.h) / 2, anchor: 'end', maxWidth: half, size, maxLines: 2, fill: th.card, name: 'ann-before'});
      afterChip = tightChip(ctx, afterText, {x: cx + 24, y: annY + (chH - probes[1].box.h) / 2, anchor: 'start', maxWidth: half, size, maxLines: 2, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      arrow = {x: cx, y: annY + chH / 2};
    }
    // when the lens closes, the before → after chips travel back with it and
    // settle beside the changed copy (left of the chain, at its band), or just
    // above the file when the lens was stacked above it
    let annMove = null;
    if (probes) {
      const x0 = beforeChip.box.x, x1 = afterChip.box.x + afterChip.box.w;
      const y0 = Math.min(beforeChip.box.y, afterChip.box.y);
      const y1 = Math.max(beforeChip.box.y + beforeChip.box.h, afterChip.box.y + afterChip.box.h);
      const rowW = x1 - x0, rowH = y1 - y0;
      const kChanged = target === 'selection' ? kAfter : sel;
      let tx = null, ty = null, sc = 1;
      if (place === 'left') {
        // right-aligned just left of the chain, centred on the changed copy's band
        const bb = stage.bandBox(kChanged);
        const right = toDesign({x: G.chain0.x - 26, y: 0}).x;
        sc = Math.min(1, (right - toDesign({x: 24, y: 0}).x) / rowW);
        tx = right - rowW * sc;
        ty = toDesign({x: 0, y: bb.y + bb.h / 2}).y - (rowH * sc) / 2;
      } else if (place === 'top') {
        // just above the file, between the clerk's resting arm and the pen
        const lo = toDesign({x: G.restA.x + 60, y: 0}).x, hi = toDesign({x: G.penRest.x - 24, y: 0}).x;
        sc = Math.min(1, (hi - lo) / rowW);
        tx = (lo + hi) / 2 - (rowW * sc) / 2;
        ty = toDesign({x: 0, y: G.folder.y - 34 - 18}).y - rowH * sc;
      }
      if (tx !== null) annMove = {x0, y0, tx, ty, sc};
    }
    const ctxCap = capFit ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: Math.max(10, Math.min(sx, D.w - 10 - capFit.width)), y: 8, maxWidth: D.w - 20, size: 36, minSize: 28, maxLines: 2, name: 'ctx-caption', weight: 600}) : null;

    // --- context: ghost of the old datum + changed marker pinned to the new one
    const ctxGhost = target === 'selection' ? ghostPath('ctx-ghost', before) : null;
    // the marker sits at the tip of the tab on the copy whose datum changed
    const tipAfter = toDesign(stage.tabTip(kAfter));
    const mk = {x: tipAfter.x + 6, y: tipAfter.y};
    let markChip = null;
    if (ctx.show('key')) {
      const ms = 28 * Math.max(0.85, k);
      // to the right of the tab when there is room (wrapping up to 3 lines), else to its left
      const roomR = Math.min(360, D.w - 12 - (mk.x + 26));
      const opts = roomR >= 150 ? {x: mk.x + 26, maxWidth: roomR} : {x: mk.x - 26, anchor: 'end', maxWidth: 360};
      const pr = tightChip(ctx, p.contextLabels.marker, {...opts, y: 0, size: ms, maxLines: 3});
      markChip = tightChip(ctx, p.contextLabels.marker, {...opts, y: mk.y - pr.box.h / 2, size: ms, maxLines: 3, fill: th.card, stroke: th.accent2});
    }
    const marker = g({name: 'marker', opacity: 0},
      h('circle', {cx: r(mk.x), cy: r(mk.y), r: 18, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    const strike = beforeChip ? h('line', {name: 'ann-strike', x1: r(beforeChip.box.x + 10), x2: r(beforeChip.box.x + beforeChip.box.w - 10), y1: r(beforeChip.box.cy), y2: r(beforeChip.box.cy), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(beforeChip.box.w)} ${r(beforeChip.box.w + 10)}`, 'stroke-dashoffset': r(beforeChip.box.w)}) : null;

    return {stage, k, sx, sy, source, dest, L2, lensTab, before, after, kBefore, kAfter, sel, swap, target, beforeChip, afterChip, arrow, strike, ctxCap, ctxGhost, marker, annMove};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({transform: T(L.sx, L.sy, 0, L.k)}, L.stage.node, L.ctxGhost),
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {name: 'ann-arrow', d: `M${r(L.arrow.x - 14)} ${r(L.arrow.y)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const sel = L.target === 'selection';
    // context: the final state of the story; for 'selection' the tab slides to the new copy on return
    const posed = L.stage.pose({
      order: 1, homeA: 1, tabReach: 1, tabCarry: 1, tabPress: 1, tabRelease: 1,
      penReach: 1, penApproach: 1, penWrite: 1, penReturn: 1, penWithdraw: 1,
      tabSlide: sel ? {from: L.kBefore, to: L.kAfter, p: ctxUpd} : undefined,
    });
    Object.assign(nodes, posed.nodes);
    if (L.ctxGhost) nodes['ctx-ghost'] = {opacity: r(clamp(ctxUpd * 2), 3)};
    // lens open / close
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // lens substitution
    Object.assign(nodes, L.lensTab.tickFrame(1));
    const lensTabPos = sel ? {x: lerp(L.before.x, L.after.x, change), y: lerp(L.before.y, L.after.y, change)} : L.before;
    nodes['lens-tabpos'] = {transform: T(lensTabPos.x, lensTabPos.y)};
    if (sel) nodes['lens-ghost'] = {opacity: r(seg(u, ...W.ghost), 3)};
    // text swaps: the old value lifts out before the new one settles in
    const swapText = (prefix, key, pr) => {
      if (!ctx.show(key === 'id' ? 'key' : 'all')) return;
      const out = clamp(pr * 2), inn = clamp(pr * 2 - 1);
      nodes[`${prefix}-${key}0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
      nodes[`${prefix}-${key}1`] = {opacity: r(inn, 3), transform: `translate(0 ${r(10 * (1 - inn))})`};
    };
    if (L.swap) {
      const key = L.target === 'date' ? 'date' : 'id';
      swapText(`lz${L.sel}`, key, change);
      swapText(`ctx-chain${L.sel}`, key, ctxUpd);
    }
    // annotation
    if (L.beforeChip) {
      const back = ease.inOutCubic(seg(u, ...W.annBack));
      const m = L.annMove;
      const sNow = m ? lerp(1, m.sc, back) : 1;
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0, transform: m ? `translate(${r((m.tx - m.x0 * m.sc) * back)} ${r((m.ty - m.y0 * m.sc) * back)}) scale(${r(sNow, 4)})` : 'translate(0 0) scale(1)'};
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.beforeChip.box.w * (1 - seg(u, ...W.strike)))};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes['ann-arrow'] = {opacity: r(seg(u, ...W.after), 3)};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const p = ctx.params;
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const ctxTab = posed.semantic.tab;
    const tabOnAt = q => {
      if (Math.abs(q.x - L.before.x) < 0.5 && Math.abs(q.y - L.before.y) < 0.5) return p.versions[L.kBefore].id;
      if (Math.abs(q.x - L.after.x) < 0.5 && Math.abs(q.y - L.after.y) < 0.5) return p.versions[L.kAfter].id;
      return 'moving';
    };
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        focusTarget: L.target,
        lensTabOn: tabOnAt(lensTabPos),
        contextTabOn: tabOnAt(ctxTab),
        lensTab: {x: r(lensTabPos.x), y: r(lensTabPos.y)},
        contextTab: ctxTab,
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        lensTextSwap: L.swap ? r(change, 3) : null,
        contextTextSwap: L.swap ? r(ctxUpd, 3) : null,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        dest: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
        markerVisible: u >= W.marker[1],
        allReached: posed.semantic.allReached,
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
    slug: 'documents-08-inspect',
    title: 'Version chain — inspect which copy carries the tab',
    titleEs: 'Cadena de versiones — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Cadena de versiones',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens enlarges the header bands of the filed chain where the index tab sits, substitutes one datum (the tab moves to another copy, or that copy’s date or identifier is replaced), keeps the previous value traceable with a ghost and a struck chip, and returns to the context with a changed-datum marker.',
    tags: ['versions', 'version chain', 'index tab', 'inspect', 'lens', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/cadena-de-versiones.js', 'src/frameworks/lens.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
