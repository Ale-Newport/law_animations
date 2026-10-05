/**
 * LAW-0072 — Comprobación de jurisdicción · inspect
 *
 * Storyboard (front view of the sorting cabinet the filter produced):
 *  0.00–0.20  build: a two-compartment cabinet — "= key" (same jurisdiction as
 *             the research card) and "≠ key" — receives the sorted source
 *             documents, each standing face-out with its declared seal; the
 *             research card with the key is pinned beside it.
 *  0.20–0.45  isolate: a lens lifts a REAL copy of the focused document's
 *             declaration (same coordinates as the context) into an enlarged
 *             window; the rest dims. A chip names the current datum.
 *  0.45–0.75  substitute: inside the lens the declared name is struck and
 *             fades out, then the alternative value and its emblem appear
 *             (never on top of each other); the context copy follows. Only the
 *             dependent state changes: that one document moves to the
 *             compartment its new declaration belongs to, with the lens still
 *             tethered to it; a dashed outline keeps the old slot traceable.
 *  0.75–1.00  return: the enlarged copy empties in place, then the empty lens
 *             frame shrinks and withdraws towards the document's current place,
 *             fading out before it reaches the cabinet (it never boxes or crosses
 *             a document, the card or a label); the red source frame on the
 *             document fades last. A single marker "datum changed" (old → new)
 *             stays next to it; in wide boxes the Before/After chips stay in the
 *             lens column as a summary. Seeking back restores the previous datum
 *             exactly.
 * Square boxes: compartments side by side (documents in library order; a
 * changed document rises over its neighbours, under the headers, and sets down
 * in the other compartment). Wide and tall boxes: compartments stacked; every
 * document keeps its own column (its library position) on the shelf of its
 * compartment, so the changed document drops straight down its own column.
 * The focused document is drawn above the others; the lens window (and its
 * cone) fades in only once it has lifted clear of every document. The dashed
 * cone lines pass behind the labels, the card and the caption (masked out).
 * Legal content: fictional; the declared labels are supplied; nothing about
 * validity, applicable law or outcome is deduced.
 * @module animations/research/LAW-0072
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {inspectFields, str, obj} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {calloutChip} from '../causation/kits/place.js';
import {jurFields, JUR_DEFAULTS, JUR_STRINGS, resolveJur, jurByName, sourceSheet, indexCard, rulePlate, plateSize, jurColor, packInZones, hyCtx, hitBox, seal} from './kits/comprobacion-de-jurisdiccion.js';

const ID = 'LAW-0072';
const DURATION = 8000;
const TARGETS = ['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6'];
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  file: [0.02, 0.15], caption: [0.0, 0.08], open: [0.22, 0.4], before: [0.37, 0.44],
  strike: [0.47, 0.52], oldOut: [0.52, 0.55], newIn: [0.555, 0.6], after: [0.58, 0.64], arrow: [0.6, 0.64],
  move: [0.63, 0.72], close: [0.76, 0.89], chipsOut: [0.76, 0.8], marker: [0.89, 0.95], plate: [0.86, 0.92],
};

const STRINGS = {
  en: {...JUR_STRINGS.en, before: 'Before', after: 'After'},
  es: {...JUR_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  ...jurFields,
  ...inspectFields(TARGETS),
};
sceneSchema.focusTarget = {...sceneSchema.focusTarget, description: 'Source document (doc-1 = first) whose declared jurisdiction is enlarged and substituted'};
sceneSchema.beforeValue = {...sceneSchema.beforeValue, description: 'Jurisdiction name the focused document declares before the substitution (matched to the listed jurisdictions by name)'};
sceneSchema.afterValue = {...sceneSchema.afterValue, description: 'Alternative jurisdiction name (matched by name; an unlisted name gets a neutral dashed emblem)'};
sceneSchema.contextLabels = obj('Labels for the context view', {
  context: str('Context caption', 80),
  marker: str('Label of the changed-datum marker', 40),
  relevant: str('Label of the compartment for the jurisdiction marked on the card', 50),
  other: str('Label of the compartment for other jurisdictions', 50),
});

const defaultParams = {
  ...JUR_DEFAULTS,
  focusTarget: 'doc-3',
  beforeValue: 'Northvale',
  afterValue: 'Eastmere',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Sorted by the jurisdiction each document declares', marker: 'Datum changed', relevant: 'Relevant jurisdiction', other: 'Other jurisdiction'},
};

/** Layout per shape: cabinet, card and lens area (design units). */
function plan(shape, D) {
  if (shape === 'portrait') {
    return {
      stacked: true, dw: 150,
      caption: {x: 24, y: 14, w: D.w - 48},
      card: {x: 24, y: 86, w: 380, h: 214},
      chips: {x: 24, y: 330, w: 380, h: 300},
      lens: {x: 430, y: 86, w: D.w - 454, h: 560},
      marker: {x: 24, y: 330, w: D.w - 48, h: 320},
      cabinet: {x: 20, y: 660, w: D.w - 40, h: D.h - 660 - 16},
    };
  }
  if (shape === 'square') {
    return {
      stacked: false, dw: 152,
      caption: {x: 24, y: 14, w: D.w - 48},
      card: {x: 24, y: 80, w: 360, h: 206},
      chips: {x: 24, y: 310, w: 360, h: 245},
      lens: {x: 410, y: 70, w: D.w - 434, h: 530},
      marker: {x: 24, y: 300, w: D.w - 48, h: 256},
      // (taller compartments: a document crossing to the other one passes well under the headers)
      cabinet: {x: 20, y: 570, w: D.w - 40, h: D.h - 570 - 12},
    };
  }
  // (a lens column no wider than the enlarged copy, and larger documents: the cabinet takes the
  // room, so the frame is not a third empty once the lens has folded back)
  const lensW = Math.min(470, D.w * 0.3);
  const cabX = 390;
  return {
    stacked: true, dw: 172,
    // compartment headers outside the cabinet, in the column under the card
    headers: {x: 24, w: cabX - 24 - 16, minY: 96 + 204 + 24},
    caption: {x: 24, y: 14, w: D.w - lensW - 70},
    card: {x: 24, y: 96, w: 340, h: 204},
    chips: {x: D.w - lensW - 20, y: 600, w: lensW, h: 280},
    lens: {x: D.w - lensW - 20, y: 60, w: lensW, h: 520},
    marker: {x: D.w - lensW - 20, y: 60, w: lensW, h: 800},
    cabinet: {x: cabX, y: 70, w: D.w - lensW - 20 - cabX - 36, h: 816},
  };
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx0) {
    const ctx = hyCtx(ctx0);
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const M = resolveJur(p);
    const PL = plan(ctx.view.shape, D);
    const fi = Math.min(TARGETS.indexOf(p.focusTarget), M.docs.length - 1);
    const focus = M.docs[fi];
    const bJ = jurByName(p, p.beforeValue) || {key: 'none', name: p.beforeValue};
    const aJ = jurByName(p, p.afterValue) || {key: 'none', name: p.afterValue};
    const beforeRel = bJ.key === p.relevant;
    const afterRel = aJ.key === p.relevant;
    // documents in each compartment (the focused one uses the BEFORE value for its compartment)
    const relOf = d => (d.i === focus.i ? beforeRel : d.relevant);
    const cab = PL.cabinet;
    const dw = PL.dw, dh = dw * 1.32;

    // ---------------------------------------------------------------- cabinet
    const plateS = 44;
    const ps = plateSize(plateS);
    const comps = PL.stacked
      ? [{x: cab.x + 16, y: cab.y + 16, w: cab.w - 32, h: (cab.h - 48) / 2}, {x: cab.x + 16, y: cab.y + 32 + (cab.h - 48) / 2, w: cab.w - 32, h: (cab.h - 48) / 2}]
      : [{x: cab.x + 16, y: cab.y + 16, w: (cab.w - 48) / 2, h: cab.h - 32}, {x: cab.x + 32 + (cab.w - 48) / 2, y: cab.y + 16, w: (cab.w - 48) / 2, h: cab.h - 32}];
    const compLabel = [p.contextLabels.relevant, p.contextLabels.other];
    const parts = [
      h('path', {d: roundRectPath(cab.x + 8, cab.y + 10, cab.w, cab.h, 14), fill: th.shadow}),
      h('path', {d: roundRectPath(cab.x, cab.y, cab.w, cab.h, 14), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    ];
    comps.forEach(c => {
      parts.push(h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 8), fill: shade(th.woodDark, 0.12), stroke: th.ink, 'stroke-width': 1.8}));
      for (let px = c.x + 90; px < c.x + c.w - 30; px += 90) parts.push(h('line', {x1: px, x2: px, y1: c.y + 4, y2: c.y + c.h - 30, stroke: shade(th.woodDark, -0.1), 'stroke-width': 2, opacity: 0.5}));
      parts.push(h('rect', {x: c.x, y: c.y, width: c.w, height: 10, fill: '#000', opacity: 0.2}));
      // shelf lip at the bottom of the compartment
      parts.push(h('path', {d: roundRectPath(c.x - 4, c.y + c.h - 30, c.w + 8, 30, 5), fill: shade(th.wood, 0.1), stroke: th.ink, 'stroke-width': 2}));
    });
    // documents stand behind the lip (their tops at `top(k)`)
    const top = k => comps[k].y + comps[k].h - 30 + dh * 0.22 - dh;
    const fromK = beforeRel ? 0 : 1, toK = afterRel ? 0 : 1;
    const moves = fromK !== toK;
    const pos = {};
    let startPos, endPos;
    if (PL.stacked) {
      // stacked compartments: every document keeps its own column (its place in the library
      // order) on the shelf of its compartment, so the changed document drops (or rises)
      // straight into the other compartment, through its own empty column: it never passes
      // over another document (round-7 review: it cut through DOC-15)
      const c = comps[0];
      const n = M.docs.length;
      const sp = n > 1 ? Math.min(dw + 18, (c.w - 36 - dw) / (n - 1)) : 0;
      M.docs.forEach((d, j) => { const k = relOf(d) ? 0 : 1; pos[d.i] = {x: c.x + 18 + j * sp, y: top(k), k}; });
      startPos = pos[focus.i];
      endPos = moves ? {x: startPos.x, y: top(toK), k: toK} : startPos;
    } else {
      // side-by-side compartments: left to right in library order; each compartment reserves
      // room for one more (the focused document may arrive)
      const idsIn = k => M.docs.filter(d => (k === 0) === relOf(d)).map(d => d.i);
      const I0 = idsIn(0), I1 = idsIn(1);
      const nMax = [I0.length + (afterRel && !beforeRel ? 1 : 0), I1.length + (!afterRel && beforeRel ? 1 : 0)];
      const slotX = (k, j) => {
        const c = comps[k];
        const sp = Math.min(dw + 18, (c.w - 36 - dw) / Math.max(1, nMax[k] - 1));
        return c.x + 18 + j * sp;
      };
      [I0, I1].forEach((ids, k) => ids.forEach((id, j) => { pos[id] = {x: slotX(k, j), y: top(k), k}; }));
      startPos = pos[focus.i];
      endPos = moves ? {x: slotX(toK, (toK === 0 ? I0 : I1).length), y: top(toK), k: toK} : startPos;
    }

    // compartment headers: "=" / "≠" plate + label
    const labelChips = [];
    const plateBoxes = [];
    const chipOpt = (k, mw, ml = 2) => ({maxWidth: mw, size: 28, maxLines: ml, stroke: k === 0 ? jurColor(ctx, M.relevant.key).c : th.inkSoft});
    if (PL.headers) {
      // wide boxes: each header stands outside the cabinet, against its compartment and level
      // with its documents (plate above the label): the inside of the cabinet stays free for the
      // documents, for the one that changes compartment and for the lens lifting off it
      const HA = PL.headers;
      const right = cab.x - 16;
      comps.forEach((c, k) => {
        const cc = ctx.show('key') ? chip(ctx, compLabel[k], {x: right, y: 0, anchor: 'end', ...chipOpt(k, HA.w)}) : null;
        const hh = ps.h + (cc ? 10 + cc.box.h : 0);
        const y0 = clamp(top(k) + dh / 2 - hh / 2, Math.max(HA.minY, c.y), c.y + c.h - hh);
        const pcx = cc ? right - cc.box.w / 2 : right - ps.w / 2;
        parts.push(rulePlate(ctx, {name: `plate-${k}`, same: k === 0, key: M.relevant.key, s: plateS, x: pcx, y: y0, strap: false}));
        plateBoxes.push({x: pcx - ps.w / 2, y: y0, w: ps.w, h: ps.h});
        if (cc) {
          const lab = chip(ctx, compLabel[k], {x: right, y: y0 + ps.h + 10, anchor: 'end', ...chipOpt(k, HA.w)});
          // a short tab ties the label to its compartment's wall
          const ty = lab.box.cy;
          const tab = h('path', {d: `M${r(right)} ${r(ty - 7)}L${r(cab.x + 2)} ${r(ty - 7)}L${r(cab.x + 2)} ${r(ty + 7)}L${r(right)} ${r(ty + 7)}Z`, fill: k === 0 ? jurColor(ctx, M.relevant.key).c : th.inkSoft, stroke: th.ink, 'stroke-width': 1.5});
          labelChips.push({node: g({name: `lab-comp-${k}`}, tab, lab.node), box: lab.box});
        }
      });
    } else {
      // at the top right of each compartment. In a stacked cabinet the focused document's column
      // stays free: the changed document drops (or rises) through the lower compartment's header
      // band, and the lens lifts off it towards the lens area above the cabinet. A header in the
      // way stands beside that column instead (its label on more lines if needed), so neither
      // the document nor the lens window crosses it
      const lensAbove = PL.lens.y + PL.lens.h <= cab.y + 1;
      const colTop = lensAbove ? cab.y : Math.min(startPos.y, endPos.y) - 10;
      const sweep = PL.stacked && (moves || lensAbove) ? {x: startPos.x - 12, y: colTop, w: dw + 24, h: Math.max(startPos.y, endPos.y) + dh + 10 - colTop} : null;
      comps.forEach((c, k) => {
        const hy = c.y + 14;
        const widths = ctx.show('key') ? [[c.w - ps.w - 60, 2], [330, 2], [300, 3], [260, 3]] : [[0, 2]];
        const lo = c.x + 14;
        let pick = null;
        for (const [mw, ml] of widths) {
          const probe = mw ? chip(ctx, compLabel[k], {x: 0, y: 0, ...chipOpt(k, mw, ml)}) : null;
          if (probe && (probe.fit.truncated || probe.fit.midWord) && mw !== widths[0][0]) continue;
          const hw = ps.w + (probe ? 12 + probe.box.w : 0);
          const hh = Math.max(ps.h, probe ? probe.box.h : 0);
          const hi = c.x + c.w - 14 - hw;
          const xs = [hi, ...(sweep ? [sweep.x + sweep.w + 8, sweep.x - 8 - hw, lo] : [])];
          const x = xs.find(x0 => x0 >= lo - 0.5 && x0 <= hi + 0.5 && !(sweep && hitBox({x: x0, y: hy, w: hw, h: hh}, sweep)));
          if (x !== undefined) { pick = {x, mw, ml}; break; }
          if (!sweep) break;
        }
        // (no room beside the column: the header keeps its place and steps aside while the document passes, see frame)
        if (!pick) {
          const [mw, ml] = widths[0];
          const probe = mw ? chip(ctx, compLabel[k], {x: 0, y: 0, ...chipOpt(k, mw, ml)}) : null;
          pick = {x: c.x + c.w - 14 - ps.w - (probe ? 12 + probe.box.w : 0), mw, ml};
        }
        parts.push(rulePlate(ctx, {name: `plate-${k}`, same: k === 0, key: M.relevant.key, s: plateS, x: pick.x + ps.w / 2, y: hy, strap: false}));
        plateBoxes.push({x: pick.x, y: hy, w: ps.w, h: ps.h});
        if (pick.mw) {
          const probe = chip(ctx, compLabel[k], {x: 0, y: 0, ...chipOpt(k, pick.mw, pick.ml)});
          labelChips.push(chip(ctx, compLabel[k], {x: pick.x + ps.w + 12, y: hy + Math.max(0, (ps.h - probe.box.h) / 2), name: `lab-comp-${k}`, ...chipOpt(k, pick.mw, pick.ml)}));
        }
      });
    }
    // bottom of each compartment's header (plate or label, whichever is lower)
    const headBottom = comps.map((c, k) => (PL.headers ? c.y + 2 : Math.max(plateBoxes[k].y + plateBoxes[k].h, ...(labelChips[k] ? [labelChips[k].box.y + labelChips[k].box.h] : []))));

    // ---------------------------------------------------------------- documents
    const docs = M.docs.map(d => {
      const isF = d.i === focus.i;
      const sheet = sourceSheet(ctx, {prefix: `cd${d.i}`, w: dw, h: dh, doc: d, jur: isF ? bJ : {key: d.key, name: d.name}, alt: isF ? aJ : null, detail: 'full'});
      return {d, isF, sheet, node: g({name: `cdoc${d.i}`, transform: T(pos[d.i].x, pos[d.i].y)}, sheet.node)};
    });
    // the old slot stays traceable: a tinted, heavily dashed outline (readable at phone size, labels off)
    const ghost = h('path', {name: 'ghost', d: roundRectPath(startPos.x, startPos.y, dw, dh, 6), fill: th.accentSoft, 'fill-opacity': 0.55, stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': '14 9', opacity: 0});

    // ---------------------------------------------------------------- card
    const card = indexCard(ctx, {prefix: 'icard', w: PL.card.w, h: PL.card.h, query: p.query, jur: M.relevant});
    const cardNode = g({transform: T(PL.card.x, PL.card.y)}, card.node);

    // ---------------------------------------------------------------- lens (real copy, source tethered to the document)
    const lensSheet = sourceSheet(ctx, {prefix: 'ld', w: dw, h: dh, doc: focus, jur: bJ, alt: aJ, detail: 'full'});
    // the lens always includes the whole declaration (seal + strip), however the title wraps
    const srcLocal = {x: -6, y: -6, w: dw + 12, h: Math.min(dh + 12, lensSheet.strip.y + lensSheet.strip.h + 16)};
    const zoomWant = p.detailGeometry.zoom;
    const la = PL.lens;
    const zoom = Math.min(zoomWant, la.w / srcLocal.w, la.h * 0.72 / srcLocal.h);
    const dest = {w: srcLocal.w * zoom, h: srcLocal.h * zoom};
    dest.x = la.x + (la.w - dest.w) / 2;
    dest.y = la.y + 8;
    const strikeLen = dw * 0.55;
    const multiLine = lensSheet.strip.h > dw * 0.3 + 1;
    const strikeTotal = Math.hypot(strikeLen, multiLine ? lensSheet.strip.h * 0.4 : 0);
    const lensContent = g({name: 'lens-content'},
      g({name: 'lens-doc'}, lensSheet.node,
        // (a name wrapped on two lines is struck across both)
        h('line', {name: 'lens-strike', x1: lensSheet.strip.x + lensSheet.strip.w * 0.36, y1: lensSheet.strip.y + lensSheet.strip.h * (multiLine ? 0.5 : 0.7), x2: lensSheet.strip.x + lensSheet.strip.w * 0.36 + strikeLen, y2: lensSheet.strip.y + lensSheet.strip.h * (multiLine ? 0.9 : 0.7), stroke: th.accent, 'stroke-width': 2.2, 'stroke-dasharray': `${r(strikeTotal)} ${r(strikeTotal + 4)}`, 'stroke-dashoffset': r(strikeTotal), opacity: 0})));
    const clipId = 'lens-clip';
    // the dashed cone lines pass behind every text-bearing label (compartment labels and
    // plates, the card, the caption): the mask cuts them out there, so no dashed line ever
    // crosses label text (round-8 review: 'Other jurisdiction' in 1:1, '= Declares the
    // jurisdiction' in 9:16 long-labels). Registered below, once the labels are known.
    const coneMaskId = 'lens-cone-mask';
    const capChip = ctx.show('all') && p.contextLabels.context ? chip(ctx, `${ctx.t.context}: ${p.contextLabels.context}`, {x: PL.caption.x, y: PL.caption.y, maxWidth: PL.caption.w, size: 26, maxLines: 2, name: 'ctx-caption', stroke: 'none', fill: th.dark ? '#2c3036' : '#f1efea'}) : null;
    // (and behind the other documents: no dashed line across a neighbour's title or seal)
    const coneHoles = [...labelChips.map(c => c.box), ...plateBoxes, PL.card, ...[capChip].filter(Boolean).map(c => c.box),
      ...M.docs.filter(d => d.i !== focus.i).map(d => ({x: pos[d.i].x, y: pos[d.i].y, w: dw, h: dh}))]
      .map(b => h('rect', {x: r(b.x - 5), y: r(b.y - 5), width: r(b.w + 10), height: r(b.h + 10), rx: 12, fill: '#000'}));
    const lensNode = g({name: 'lens'},
      h('path', {name: 'lens-dim', d: '', 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
      h('path', {name: 'lens-src', d: '', fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0}),
      h('defs', null, h('mask', {id: ctx.id(coneMaskId), maskUnits: 'userSpaceOnUse', x: -D.w, y: -D.h, width: D.w * 3, height: D.h * 3},
        h('rect', {x: -D.w, y: -D.h, width: D.w * 3, height: D.h * 3, fill: '#fff'}),
        coneHoles)),
      g({mask: ctx.ref(coneMaskId)},
        h('line', {name: 'lens-coneA', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
        h('line', {name: 'lens-coneB', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0})),
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'lens-cliprect', rx: 22}))),
      g({name: 'lens-win', opacity: 0},
        h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
        h('rect', {name: 'lens-bg', rx: 22, fill: th.paper}),
        g({'clip-path': ctx.ref(clipId)}, lensContent),
        h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.accent, 'stroke-width': 5})),
    );

    // ---------------------------------------------------------------- before / after chips
    const chipsOn = ctx.show('key');
    // wide boxes: the Before/After chips stay in the lens column after the lens has folded
    // back, as a readable summary of the substitution (the column is otherwise empty at the hold)
    const keepChips = chipsOn && ctx.view.shape === 'landscape';
    const ca = PL.chips;
    const beforeText = `${ctx.t.before}: ${p.beforeValue}`;
    const afterText = `${ctx.t.after}: ${p.afterValue}`;
    const cw = Math.min(ca.w, 460);
    const bChip = chipsOn ? chip(ctx, beforeText, {x: ca.x + ca.w / 2, y: ca.y, anchor: 'middle', maxWidth: cw, size: 30, maxLines: 2, name: 'chip-before', fill: th.card, stroke: jurColor(ctx, bJ.key).c}) : null;
    const arrowY = ca.y + (bChip ? bChip.box.h : 50) + 10;
    const aChip = chipsOn ? chip(ctx, afterText, {x: ca.x + ca.w / 2, y: arrowY + 44, anchor: 'middle', maxWidth: cw, size: 30, maxLines: 2, name: 'chip-after', fill: jurColor(ctx, aJ.key).soft, stroke: jurColor(ctx, aJ.key).c}) : null;
    const bStrike = bChip ? h('line', {name: 'chip-before-strike', x1: bChip.box.x + 14, y1: bChip.box.cy, x2: bChip.box.x + bChip.box.w - 14, y2: bChip.box.cy, stroke: th.accent, 'stroke-width': 3, opacity: 0}) : null;
    // the arrow belongs to the Before/After chips: it exists only when they do
    const arrow = chipsOn ? g({name: 'chip-arrow', opacity: 0},
      h('line', {x1: ca.x + ca.w / 2, y1: arrowY + 4, x2: ca.x + ca.w / 2, y2: arrowY + 34, stroke: th.ink, 'stroke-width': 3}),
      h('path', {d: `M${r(ca.x + ca.w / 2 - 8)} ${r(arrowY + 26)}L${r(ca.x + ca.w / 2)} ${r(arrowY + 38)}L${r(ca.x + ca.w / 2 + 8)} ${r(arrowY + 26)}Z`, fill: th.ink})) : null;

    // wide boxes: once the lens has withdrawn, a plate gathers the kept chips under the
    // document's reference — a readable summary of the substitution in the lens column
    let resultPlate = null;
    if (keepChips) {
      const tFit = ctx.fit(`${focus.id} · ${focus.title}`, {maxWidth: ca.w - 56, size: 27, minSize: 22, maxLines: 2, weight: 700, family: 'sans'});
      const chipW = Math.max(bChip.box.w, aChip.box.w);
      const pw = Math.min(ca.w, Math.max(tFit.width, chipW) + 56);
      const py = ca.y - tFit.height - 32;
      const pb = aChip.box.y + aChip.box.h + 20;
      const px = ca.x + ca.w / 2 - pw / 2;
      resultPlate = {box: {x: px, y: py, w: pw, h: pb - py}, node: g({name: 'result-plate', opacity: 0},
        h('path', {d: roundRectPath(px + 5, py + 7, pw, pb - py, 16), fill: th.shadow}),
        h('path', {d: roundRectPath(px, py, pw, pb - py, 16), fill: th.card, stroke: th.accent, 'stroke-width': 3}),
        textBlock(tFit, {x: ca.x + ca.w / 2, y: py + 14, anchor: 'middle', fill: th.ink}),
        h('line', {x1: r(px + 20), x2: r(px + pw - 20), y1: r(ca.y - 12), y2: r(ca.y - 12), stroke: th.paperLine || th.inkSoft, 'stroke-width': 1.5}))};
    } else if (ctx.view.shape === 'landscape') {
      // (labels hidden: the same summary without text — the old seal struck, an arrow, the new seal)
      const R0 = 46, cx = ca.x + ca.w / 2, y1 = ca.y + 22 + R0, y2 = y1 + R0 * 2 + 64;
      const px = cx - R0 - 44, py = ca.y, pw = (R0 + 44) * 2, ph = y2 + R0 + 22 - py;
      resultPlate = {box: {x: px, y: py, w: pw, h: ph}, node: g({name: 'result-plate', opacity: 0},
        h('path', {d: roundRectPath(px + 5, py + 7, pw, ph, 16), fill: th.shadow}),
        h('path', {d: roundRectPath(px, py, pw, ph, 16), fill: th.card, stroke: th.accent, 'stroke-width': 3}),
        seal(ctx, {key: bJ.key, R: R0, x: cx, y: y1}),
        h('line', {x1: r(cx - R0 - 10), y1: r(y1 + R0 * 0.55), x2: r(cx + R0 + 10), y2: r(y1 - R0 * 0.55), stroke: th.accent, 'stroke-width': 5, 'stroke-linecap': 'round'}),
        h('line', {x1: r(cx), y1: r(y1 + R0 + 12), x2: r(cx), y2: r(y2 - R0 - 20), stroke: th.ink, 'stroke-width': 3}),
        h('path', {d: `M${r(cx - 9)} ${r(y2 - R0 - 26)}L${r(cx)} ${r(y2 - R0 - 12)}L${r(cx + 9)} ${r(y2 - R0 - 26)}Z`, fill: th.ink}),
        seal(ctx, {key: aJ.key, R: R0, x: cx, y: y2}))};
    }

    // ---------------------------------------------------------------- context caption + marker
    const endSeal = {x: endPos.x + lensSheet.sealC.x, y: endPos.y + lensSheet.sealC.y};
    let marker = null;
    if (ctx.show('key')) {
      const text = `${p.contextLabels.marker}: ${p.beforeValue} → ${p.afterValue}`;
      const target = {x: endSeal.x, y: endSeal.y - lensSheet.R - 4};
      // obstacles at the final hold: other documents, compartment headers (labels and plates), the card
      const obstacles = [
        ...M.docs.filter(d => d.i !== focus.i).map(d => ({x: pos[d.i].x, y: pos[d.i].y, w: dw, h: dh})),
        ...labelChips.map(c => c.box), ...plateBoxes.map(b => ({x: b.x - 4, y: b.y - 6, w: b.w + 8, h: b.h + 12})),
        {x: PL.card.x, y: PL.card.y, w: PL.card.w, h: PL.card.h},
        // the marked document's own body below its seal (the leader comes to the seal from above or beside it)
        {x: endPos.x + 4, y: endSeal.y + lensSheet.R + 2, w: dw - 8, h: endPos.y + dh - (endSeal.y + lensSheet.R + 2)},
      ];
      // (long names: wider chips on more lines before any ellipsis)
      const sizes = [[460, 2], [360, 3], [520, 3], [600, 3], [280, 4], [440, 4], [560, 4]].map(([mw, ml]) => [Math.min(PL.marker.w, mw), ml]).map(([mw, ml]) => {
        const c = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: 28, maxLines: ml});
        return {mw, ml, w: c.box.w, h: c.box.h, cut: c.fit.truncated || Boolean(c.fit.midWord)};
      }).filter((q, k, all) => !q.cut || k === all.length - 1);
      const zone = {x: PL.marker.x, y: PL.marker.y, w: PL.marker.w, h: PL.marker.h};
      // also the free inside of each compartment at the final hold (right of its documents, under its header)
      const inner = comps.map((c, k) => {
        const ids = M.docs.filter(d => (d.i === focus.i ? toK : pos[d.i].k) === k).map(d => (d.i === focus.i ? endPos.x : pos[d.i].x));
        const right = ids.length ? Math.max(...ids) + dw + 16 : c.x + 16;
        const top = headBottom[k] + 12;
        return {x: right, y: top, w: c.x + c.w - 12 - right, h: c.y + c.h - 36 - top};
      }).filter(z => z.w > 120 && z.h > 60);
      // and the band between each compartment's header and the tops of its documents
      comps.forEach((c, k) => {
        const top = headBottom[k] + 12;
        const docsTop = c.y + c.h - 30 + dh * 0.22 - dh - 10;
        if (docsTop - top > 60) inner.push({x: c.x + 12, y: top, w: c.w - 24, h: docsTop - top});
      });
      // the marker stays next to the document it marks: a short leader beats the roomy side zone
      const res = packInZones(sizes, target, [...inner, zone], obstacles, {pad: 8, zonePenalty: 30, sizePenalty: 60});
      const pick = res ? sizes[res.k] : sizes[sizes.length - 1];
      const at = res ? {x: res.box.x + res.box.w / 2, y: res.box.y} : {x: zone.x + zone.w / 2, y: zone.y};
      marker = calloutChip(ctx, {name: 'marker', text, chipAt: at, target, maxWidth: pick.mw, maxLines: pick.ml, size: 28, color: th.accent});
    }
    const markerDot = h('circle', {name: 'marker-ring', cx: endSeal.x, cy: endSeal.y, r: lensSheet.R + 8, fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0});

    // lens travel: the window opens from and folds back onto its document along a path that
    // keeps clear of the compartment labels and plates, the card and the caption (a corner
    // waypoint when needed)
    const grow = b => ({x: b.x - 3, y: b.y - 3, w: b.w + 6, h: b.h + 6});
    const lensObst = [...labelChips.map(c => c.box), ...plateBoxes].map(grow);
    const lensSoft = [{x: PL.card.x, y: PL.card.y, w: PL.card.w, h: PL.card.h}, ...[capChip].filter(Boolean).map(c => c.box)].map(grow);
    // folding back, the window also keeps off the other documents as far as it can (it
    // arrives over its own document instead of sliding along the row over its neighbours)
    const otherDocs = M.docs.filter(d => d.i !== focus.i).map(d => ({x: pos[d.i].x, y: pos[d.i].y, w: dw, h: dh}));
    const lensFrame = {x: 4, y: 4, w: D.w - 8, h: D.h - 8};
    const srcBox = q => ({x: q.x + srcLocal.x, y: q.y + srcLocal.y, w: srcLocal.w, h: srcLocal.h});
    // side-by-side compartments: the moving document rises until its bottom clears its
    // neighbours' tops, bounded by the compartment headers above: its lens frame (6 units
    // outside the document) keeps a clear gap under the labels and plates
    // (1:1 review: with a 16-unit margin its bottom edge still grazed the next document's top;
    // round 7: at the top of the rise its frame touched the label and the plate)
    const headerBottom = Math.max(...headBottom);
    const lift = Math.max(70, Math.min(dh + 14, Math.min(startPos.y, endPos.y) - headerBottom - 16));
    // opening: the window lifts off its document and heads for the lens area along a path that
    // keeps off the other documents as far as it can (straight up first when that clears the
    // row, never sliding along the row over its neighbours)
    const docPenalty = c => {
      let cost = 0;
      for (let q = 0.02; q < 0.99; q += 0.02) {
        const b = c.at(q);
        for (const o of otherDocs) {
          // (a near graze counts too)
          const ix = Math.min(b.x + b.w, o.x + o.w + 6) - Math.max(b.x, o.x - 6), iy = Math.min(b.y + b.h, o.y + o.h + 6) - Math.max(b.y, o.y - 6);
          if (ix > 0 && iy > 0) cost += 1 + (ix * iy) / (o.w * o.h);
        }
      }
      return cost * 160;
    };
    // (opening, the window also keeps off the context caption: it lifts off towards the lens area)
    const openObst = [...lensObst, ...[capChip].filter(Boolean).map(c => grow(c.box))];
    const openPath = lensRoute(srcBox(startPos), dest, openObst, lensFrame, lensSoft, docPenalty, true);
    // the window becomes visible only once it has lifted clear of every document (its own
    // included) and stays clear from there on: no copy ever stands over or beside a document
    // while it appears (round-7 review: a translucent copy straddled DOC-13 and DOC-15)
    // (nor over the card, the caption or a compartment label: nothing with text under a translucent copy)
    const allDocs = [...otherDocs, {x: startPos.x, y: startPos.y, w: dw, h: dh}, {x: PL.card.x, y: PL.card.y, w: PL.card.w, h: PL.card.h}, ...[capChip, ...labelChips].filter(Boolean).map(c => c.box)].map(b => ({x: b.x - 3, y: b.y - 3, w: b.w + 6, h: b.h + 6}));
    let openClear = 0;
    for (let q = 1; q >= 0; q -= 0.005) {
      if (allDocs.some(o => hitBox(openPath.at(q), o))) { openClear = Math.min(1, q + 0.005); break; }
    }
    openClear = Math.min(openClear, 0.8);
    // folding back: the copy empties at the lens place, then the empty frame shrinks and
    // withdraws straight towards the document's CURRENT (final) position and fades out before
    // it would touch the cabinet, a document, the card, the caption, a compartment header or
    // a Before/After chip: it never boxes or crosses anything on its way back (round-8 review:
    // the oversized empty frame swept through the cabinet over DOC-15, DOC-13's old slot,
    // DOC-12/DOC-14 and the card). The red source frame on the document stays until the end.
    const closeObstRaw = [
      {x: cab.x, y: cab.y, w: cab.w + 8, h: cab.h + 10},
      ...M.docs.map(d => ({x: pos[d.i].x, y: pos[d.i].y, w: dw, h: dh})),
      {x: startPos.x, y: startPos.y, w: dw, h: dh}, {x: endPos.x, y: endPos.y, w: dw, h: dh},
      {x: PL.card.x, y: PL.card.y, w: PL.card.w, h: PL.card.h},
      ...[capChip, ...labelChips, bChip, aChip, resultPlate].filter(Boolean).map(c => c.box),
      ...plateBoxes,
    ];
    const closeObst = closeObstRaw.map(b => ({x: b.x - CLOSE_GAP, y: b.y - CLOSE_GAP, w: b.w + CLOSE_GAP * 2, h: b.h + CLOSE_GAP * 2}));
    const closePath = retractRoute(srcBox(endPos), dest, closeObst, closeObstRaw, lensFrame);

    // the dim overlay covers the whole frame: its box in design units comes from the fit transform
    const fit = fitDesign(ctx.view, D.w, D.h);
    const frameBox = {x: -fit.ox / fit.scale - 2, y: -fit.oy / fit.scale - 2, w: ctx.view.width / fit.scale + 4, h: ctx.view.height / fit.scale + 4};
    return {M, PL, lift, focus, plateBoxes, openClear, closeObst: closeObstRaw, keepChips, resultPlate, docBoxes: M.docs.map(d => ({x: pos[d.i].x, y: pos[d.i].y, w: dw, h: dh})), bJ, aJ, moves, startPos, endPos, docs, ghost, card, cardNode, parts, labelChips, lensNode, srcLocal, dest, zoom, bChip, aChip, bStrike, arrow, capChip, marker, markerDot, frameBox, dw, dh, comps, pos, lensSheet, openPath, closePath, lensObst, strikeTotal};
  },
  build(ctx, L) {
    return g(null,
      L.capChip && L.capChip.node,
      L.cardNode,
      g({name: 'cabinet'}, L.parts),
      L.ghost,
      // the focused document is drawn above every other document (it is the one that moves)
      L.docs.filter(d => !d.isF).map(d => d.node),
      L.docs.filter(d => d.isF).map(d => d.node),
      L.labelChips.map(c => c.node),
      L.markerDot,
      L.lensNode,
      L.resultPlate && L.resultPlate.node,
      L.bChip && L.bChip.node, L.bStrike, L.arrow, L.aChip && L.aChip.node,
      L.marker && L.marker.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const s = w => seg(u, ...W[w]);
    // --- build: documents drop onto their compartment shelves in library order
    L.docs.forEach((d, i) => {
      const q = ease.outCubic(seg(u, W.file[0] + i * 0.015, W.file[0] + i * 0.015 + 0.07));
      const P0 = L.pos[d.d.i];
      let x = P0.x, y = P0.y - 60 * (1 - q);
      if (d.isF) {
        const mp = movePos(L, L.moves ? s('move') : 0);
        x = mp.x;
        y = mp.y - 60 * (1 - q);
      }
      nodes[`cdoc${d.d.i}`] = {transform: T(x, y), opacity: r(clamp(q * 2), 3)};
    });
    const f = L.docs.find(d => d.isF);
    const fm = L.moves ? ease.inOutCubic(s('move')) : 0;
    const {x: fx, y: fy} = movePos(L, L.moves ? s('move') : 0);
    // while it travels, the focused document is drawn above the other documents: a neighbour's
    // text is hidden only where the moving document actually covers it (no text on text)
    const coveredBy = (m, b) => {
      const ix = Math.max(0, Math.min(m.x + m.w, b.x + b.w) - Math.max(m.x, b.x));
      const iy = Math.max(0, Math.min(m.y + m.h, b.y + b.h) - Math.max(m.y, b.y));
      return fm > 0 && fm < 1 ? clamp((ix * iy) / Math.max(1, b.w * b.h) * 12) : 0;
    };
    const covered = b => coveredBy({x: fx, y: fy, w: L.dw, h: L.dh}, b);
    // (headers: the document's lens frame, 6 units outside it, counts too)
    const coveredFramed = b => coveredBy({x: fx - 10, y: fy - 10, w: L.dw + 20, h: L.dh + 20}, b);
    // (a neighbour's text starts below its top margin: the moving document grazing that
    // margin hides nothing)
    const margin = L.dw * 0.07;
    L.docs.forEach(d => {
      if (d.isF) return;
      const P0 = L.pos[d.d.i];
      const op = r(1 - covered({x: P0.x, y: P0.y + margin, w: L.dw, h: L.dh - margin}), 3);
      nodes[`cd${d.d.i}-txt`] = {opacity: op};
      nodes[`cd${d.d.i}-dname`] = {opacity: op};
    });
    const labelCoverDoc = L.labelChips.map(c => 1 - coveredFramed(c.box));
    // --- datum in the context copy: old out, then new in (sequential)
    const oldOut = s('oldOut'), newIn = s('newIn');
    nodes[`cd${f.d.i}-decl`] = {opacity: r(1 - oldOut, 3)};
    nodes[`cd${f.d.i}-alt`] = {opacity: r(newIn, 3)};
    nodes['ld-decl'] = {opacity: r(1 - oldOut, 3)};
    nodes['ld-alt'] = {opacity: r(newIn, 3)};
    const strike = s('strike');
    const sl = L.strikeTotal;
    nodes['lens-strike'] = {'stroke-dashoffset': r(sl * (1 - strike)), opacity: strike > 0 && oldOut < 1 ? r(1 - oldOut, 3) : 0};
    nodes.ghost = {opacity: L.moves ? r(clamp(fm * 4) * 0.9, 3) : 0};

    // --- lens: open → substitute (tethered while the document moves) → fold back onto it
    const open = ease.inOutCubic(s('open'));
    const close = ease.inOutCubic(s('close'));
    const pOpen = open * (1 - close);
    const S = {x: fx + L.srcLocal.x, y: fy + L.srcLocal.y, w: L.srcLocal.w, h: L.srcLocal.h};
    const Dd = L.dest;
    // opening follows the open path (clear of labels); while fully open the window stays put
    // and only the source (the document) moves. Opening, the window (and its cone) appears
    // only once it has lifted clear of the documents. Folding back, the copy empties at the
    // lens place, then the empty frame withdraws towards the document along the retract route
    // and has faded out before it would reach the cabinet or anything with text
    const retract = clamp((pOpen - RETRACT_END) / (CLOSE_EMPTY - RETRACT_END));
    const R = close > 0 ? L.closePath.at(lerp(L.closePath.kStop, 1, retract)) : L.openPath.at(pOpen);
    const appear = clamp((pOpen - L.openClear) / OPEN_FADE);
    const k = R.w / S.w;
    const visible = pOpen > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    const F = L.frameBox;
    nodes['lens-dim'] = {d: `M${r(F.x)} ${r(F.y)}h${r(F.w)}v${r(F.h)}h${r(-F.w)}Z M${r(S.x)} ${r(S.y)}v${r(S.h)}h${r(S.w)}v${r(-S.h)}Z`, opacity: r(0.38 * pOpen, 3)};
    // (the red source frame on the document stays until the lens has withdrawn, then fades)
    nodes['lens-src'] = {d: roundRectPath(S.x, S.y, S.w, S.h, 8), opacity: visible ? (close > 0 ? r(clamp(pOpen / RETRACT_END), 3) : 1) : 0};
    const cone = coneCorners(S, R);
    // opening: fades in once clear of the documents; folding back: the empty frame fades out
    // over the second half of its withdrawal (gone before it reaches the cabinet)
    const winOp = visible ? r(close > 0 ? clamp(retract / 0.5) : appear, 3) : 0;
    const coneOn = close > 0 ? winOp : r(appear, 3);
    nodes['lens-coneA'] = {x1: r(cone[0].x), y1: r(cone[0].y), x2: r(cone[1].x), y2: r(cone[1].y), opacity: coneOn};
    nodes['lens-coneB'] = {x1: r(cone[2].x), y1: r(cone[2].y), x2: r(cone[3].x), y2: r(cone[3].y), opacity: coneOn};
    nodes['lens-cliprect'] = rect;
    nodes['lens-win'] = {opacity: winOp};
    // folding back, the enlarged copy (and the window's paper) fades out while the window is
    // still at its own place: only the empty lens frame withdraws, so no second copy of the
    // document ever stands near it
    const glass = close > 0 ? r(clamp((pOpen - CLOSE_EMPTY) / (1 - CLOSE_EMPTY)), 3) : 1;
    nodes['lens-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height, opacity: glass};
    nodes['lens-bg'] = {...rect, opacity: glass};
    nodes['lens-border'] = rect;
    // content: the copy drawn at the document's own coordinates, mapped source → window
    nodes['lens-content'] = {transform: `${T(R.x - S.x * k, R.y - S.y * k)} scale(${r(k, 4)})`, opacity: glass};
    nodes['lens-doc'] = {transform: T(fx, fy)};

    // --- chips (key): before, strike, arrow + after; they leave when the lens folds back
    // (wide boxes: they stay in the lens column as the summary of the substitution)
    const chipsOut = L.keepChips ? 1 : 1 - s('chipsOut');
    if (L.bChip) nodes['chip-before'] = {opacity: r(s('before') * chipsOut, 3)};
    if (L.bStrike) nodes['chip-before-strike'] = {opacity: r(strike * chipsOut, 3)};
    if (L.arrow) nodes['chip-arrow'] = {opacity: r(s('arrow') * chipsOut, 3)};
    if (L.aChip) nodes['chip-after'] = {opacity: r(s('after') * chipsOut, 3)};
    if (L.resultPlate) nodes['result-plate'] = {opacity: r(ease.inOutSine(s('plate')), 3)};
    if (L.capChip) nodes['ctx-caption'] = {opacity: r(s('caption'), 3)};
    // a compartment label steps aside (fades) while the moving document or the lens window passes over it
    const lensOver = b => {
      if (!winOp) return 0;
      const ix = Math.max(0, Math.min(R.x + R.w, b.x + b.w) - Math.max(R.x, b.x));
      const iy = Math.max(0, Math.min(R.y + R.h, b.y + b.h) - Math.max(R.y, b.y));
      return clamp((ix * iy) / Math.max(1, b.w * b.h) * 12);
    };
    L.labelChips.forEach((c, i) => { nodes[`lab-comp-${i}`] = {opacity: r(s('caption') * labelCoverDoc[i] * (1 - lensOver(c.box)), 3)}; });
    // (and so does a plate, when a header could not stand beside the document's path)
    L.plateBoxes.forEach((b, i) => { nodes[`plate-${i}`] = {opacity: r((1 - coveredFramed(b)) * (1 - lensOver(b)), 3)}; });
    const mk = s('marker');
    if (L.marker) Object.assign(nodes, L.marker.frame(mk));
    nodes['marker-ring'] = {opacity: r(mk, 3)};

    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const contextValue = newIn > 0.5 ? L.aJ.name : L.bJ.name;
    return {
      nodes,
      semantic: {
        beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return',
        lensOpen: r(pOpen, 3),
        datum,
        contextValue,
        lensValue: newIn > 0.5 ? L.aJ.name : L.bJ.name,
        contextKey: newIn > 0.5 ? L.aJ.key : L.bJ.key,
        focus: L.focus.id,
        docCenter: {x: r(fx + L.dw / 2), y: r(fy + L.dh / 2)},
        source: {x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)},
        sourceOffset: {x: r(S.x - fx), y: r(S.y - fy)},
        compartment: fm >= 1 ? (L.endPos.k === 0 ? 'relevant' : 'other') : fm > 0 ? 'moving' : (L.startPos.k === 0 ? 'relevant' : 'other'),
        moves: L.moves,
        othersStill: true,
        ghost: r(clamp(fm * 4), 3),
        marker: r(mk, 3),
        zoom: r(L.zoom, 3),
        lensHits: [r(L.openPath.hits, 2), r(L.closePath.hits, 2)],
        beforeAfterArrow: Boolean(L.arrow),
        beforeAfterChips: L.aChip ? r(s('after') * chipsOut, 3) : 0,
        lensClearOfLabels: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].every(q => [L.openPath.at(q), L.closePath.at(lerp(L.closePath.kStop, 1, q))].every(b => !L.lensObst.some(o => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y))),
        // folding back: whenever the window (or its frame) is visible it is clear of the
        // cabinet, every document (current places, the old slot included), the card, the
        // caption, the compartment headers and the Before/After chips — it never boxes an
        // unrelated document (round-8 review)
        closeClearOfDocs: close <= 0 || winOp === 0 || !L.closeObst.some(o => hitBox(R, o)),
        // the whole withdrawal (every point where the frame can be visible) is clear too
        closeRouteClear: Array.from({length: 51}, (_, i) => lerp(L.closePath.kStop, 1, i / 50)).every(q => !L.closeObst.some(o => hitBox(L.closePath.at(q), o))),
        // it withdraws towards the document's current position (never away from it) and shrinks
        closeTowardDoc: (() => {
          const c = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
          const d0 = c(L.closePath.at(1)), d1 = c(L.closePath.at(L.closePath.kStop)), dc = {x: fx + L.srcLocal.x + L.srcLocal.w / 2, y: fy + L.srcLocal.y + L.srcLocal.h / 2};
          return Math.hypot(d1.x - dc.x, d1.y - dc.y) <= Math.hypot(d0.x - dc.x, d0.y - dc.y) + 0.5 && L.closePath.at(L.closePath.kStop).w <= L.closePath.at(1).w + 0.5;
        })(),
        closeFrameVisible: winOp,
        lensCopy: glass,
        // the moving document never passes over another document
        moverClearOfDocs: L.docBoxes.every((o, i) => L.M.docs[i].i === L.focus.i || !(fx < o.x + o.w - 0.5 && fx + L.dw > o.x + 0.5 && fy < o.y + o.h - 0.5 && fy + L.dh > o.y + 0.5)),
        // opening: the window is visible only where it is clear of every document
        openVisibleClearOfDocs: close > 0 || winOp === 0 || !L.docBoxes.some(o => R.x < o.x + o.w && R.x + R.w > o.x && R.y < o.y + o.h && R.y + R.h > o.y),
        // while folding back, the copy is only visible while the window is still far from its
        // document (at least half a document width away): never a copy beside the document
        copyOnlyAtLens: close <= 0 || glass === 0 || Math.max(R.x - (S.x + S.w), S.x - (R.x + R.w), R.y - (S.y + S.h), S.y - (R.y + R.h)) > S.w * 0.5,
        lensHasDeclaration: L.srcLocal.y + L.srcLocal.h >= L.lensSheet.strip.y + L.lensSheet.strip.h + 4 && L.srcLocal.y <= L.lensSheet.sealC.y - L.lensSheet.R,
      },
    };
  },
};

/**
 * Position of the focused document while it changes compartment (t = 0..1, linear). Stacked
 * compartments: it drops (or rises) straight down its own column into the other
 * compartment. Side-by-side compartments: it first rises above its neighbours (under the
 * compartment headers), crosses over, then sets down. Either way it never passes over
 * another document.
 */
function movePos(L, t) {
  const a = L.startPos, b = L.endPos;
  if (L.PL.stacked || !L.moves) {
    const m = ease.inOutCubic(t);
    return {x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m)};
  }
  // (it crosses only once it has fully risen, and sets down only after crossing)
  const rise = ease.inOutSine(clamp(t / 0.3));
  const fall = ease.inOutSine(clamp((t - 0.7) / 0.3));
  const across = ease.inOutSine(clamp((t - 0.28) / 0.44));
  return {x: lerp(a.x, b.x, across), y: lerp(a.y, b.y, across) - L.lift * Math.min(rise, 1 - fall)};
}

/** Share of the opening over which the window fades in, once it is clear of the documents. */
const OPEN_FADE = 0.1;
/** Open share above which the folding window still shows its copy (it empties before it withdraws). */
const CLOSE_EMPTY = 0.9;
/** Open share below which the withdrawing lens frame has gone (only the source frame and the dim fade on). */
const RETRACT_END = 0.25;
/** Clearance (design units) the withdrawing frame keeps from the cabinet, documents, card and labels. */
const CLOSE_GAP = 10;
/** Size exponent of the withdrawal: the frame shrinks quickly as it leaves the lens place. */
const RETRACT_PW = 3;
/** Rates at which the withdrawing frame's centre heads for the document (share of its shrink). */
const RETRACT_RATES = [1, 0.7, 0.5, 0.35, 0.2];

/**
 * Route of the lens window between its source box S (on the document) and its
 * destination D: the centre travels straight or via one corner waypoint, the
 * size follows the distance travelled. The candidate that crosses the fewest
 * obstacles (then the shortest) is used. at(k): k = 0 at the source, 1 at D.
 * `extra(candidate)` may add a cost of its own; `liftFirst` adds routes that first
 * move straight off the source towards D's side before turning.
 */
function lensRoute(S, D, obst, frame, soft = [], extra = null, liftFirst = false) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2}, dc = {x: D.x + D.w / 2, y: D.y + D.h / 2};
  const mk = (way, pw) => {
    const pts = [sc, ...way, dc];
    const lens = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    const at = k => {
      let dist = clamp(k) * total;
      let i = 0;
      while (i < lens.length - 1 && dist > lens[i]) { dist -= lens[i]; i++; }
      const f = lens[i] ? dist / lens[i] : 0;
      const c = {x: lerp(pts[i].x, pts[i + 1].x, f), y: lerp(pts[i].y, pts[i + 1].y, f)};
      // pw > 1: the window keeps close to its source size while it is near the source
      const g = clamp(k) ** pw;
      const w = lerp(S.w, D.w, g), hh = lerp(S.h, D.h, g);
      return {x: c.x - w / 2, y: c.y - hh / 2, w, h: hh};
    };
    let hits = 0, softHits = 0;
    const over = (b, o) => b.x < o.x + o.w && b.x + b.w > o.x && b.y < o.y + o.h && b.y + b.h > o.y;
    // dense samples (a brief touch counts too); each weighs a third of a coarse sample
    for (let k = 0.04; k < 0.975; k += 0.01) {
      const b = at(k);
      hits += obst.filter(o => over(b, o)).length / 3;
      softHits += soft.filter(o => over(b, o)).length / 3;
      // the window never leaves the design space
      if (b.x < frame.x || b.y < frame.y || b.x + b.w > frame.x + frame.w || b.y + b.h > frame.y + frame.h) hits += 1;
    }
    return {at, hits: Math.round(hits * 3) / 3, softHits, total};
  };
  const ways = [[], [{x: sc.x, y: dc.y}], [{x: dc.x, y: sc.y}], [{x: sc.x, y: (sc.y + dc.y) / 2}], [{x: (sc.x + dc.x) / 2, y: sc.y}], [{x: (sc.x + dc.x) / 2, y: dc.y}]];
  // or a small sideways step first (while the window is still near its source size), then up/down
  // (sideways steps that pass just beside each label or plate are candidates too)
  const dxs = [-90, -45, 45, 90, ...obst.flatMap(o => [0.56, 0.75, 1].flatMap(f => [o.x - S.w * f - 8 - sc.x, o.x + o.w + S.w * f + 8 - sc.x]))];
  // and the middle of every gap between two labels/plates (a window slightly larger than the
  // document can pass there)
  for (const a of obst) for (const b of obst) if (b.x > a.x + a.w) dxs.push((a.x + a.w + b.x) / 2 - sc.x);
  for (const dx of dxs) {
    ways.push([{x: sc.x + dx, y: sc.y}, {x: sc.x + dx, y: dc.y}], [{x: sc.x + dx, y: sc.y}, {x: sc.x + dx, y: (sc.y + dc.y) / 2}]);
  }
  // liftFirst: or first straight off the source towards the destination's side (clear of its
  // row), then sideways, then on
  if (liftFirst) {
    const dir = dc.y < sc.y ? -1 : 1;
    for (const f of [0.6, 0.85, 1.1, 1.35, 1.6, 1.85, 2.1]) {
      const yb = sc.y + dir * S.h * f;
      ways.push([{x: sc.x, y: yb}]);
      // (sideways: the obstacle-derived steps, or most of the way across towards D)
      for (const dx of [...dxs, ...[0.5, 0.65, 0.8, 0.95].map(f => (dc.x - sc.x) * f)]) ways.push([{x: sc.x, y: yb}, {x: sc.x + dx, y: yb}, {x: sc.x + dx, y: dc.y}], [{x: sc.x, y: yb}, {x: sc.x + dx, y: yb}]);
    }
  }
  const pws = [1, 1.6, 2.4, 3.5];
  const cands = pws.flatMap((pw, pi) => ways.map(w => ({...mk(w, pw), pi, nw: w.length})));
  // a clear path wins; when every path must cross a label, a simple one is used (the label
  // then steps aside while the window passes, see frame)
  // (extra: an additional cost of a candidate, e.g. the closing route's approach)
  const score = c => c.hits * 150 + c.softHits * 90 + c.total + c.pi * 250 + c.nw * 120 + (extra ? extra(c) : 0);
  const clear = cands.filter(c => c.hits === 0);
  return (clear.length ? clear : cands).reduce((best, c) => (score(c) < score(best) ? c : best));
}

/**
 * Closing (withdrawal) route of the lens window: k = 1 at the lens place D, k = 0 on the
 * document box S (its current, final position). The size shrinks quickly towards the
 * document's while the centre heads straight for the document (at a rate `a` of the way,
 * chosen so the frame can shrink as far as possible before it has to stop). Only the part of
 * the route that keeps clear of every obstacle (and inside the design space) is used: kStop is
 * the lowest k down to which the whole route from D is clear; the frame has faded out there,
 * so it never enters the cabinet or covers a document, the card or a label. (An obstacle the
 * lens place itself already comes within the clearance of — e.g. a two-line caption above
 * it — only counts by its own box.)
 */
function retractRoute(S, D, grown, raw, frame) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2}, dc = {x: D.x + D.w / 2, y: D.y + D.h / 2};
  const mk = a => k => {
    const q = clamp(k), gs = q ** RETRACT_PW, m = 1 - a * (1 - q);
    const w = lerp(S.w, D.w, gs), hh = lerp(S.h, D.h, gs);
    return {x: lerp(sc.x, dc.x, m) - w / 2, y: lerp(sc.y, dc.y, m) - hh / 2, w, h: hh};
  };
  const inFrame = b => b.x >= frame.x - 0.01 && b.y >= frame.y - 0.01 && b.x + b.w <= frame.x + frame.w + 0.01 && b.y + b.h <= frame.y + frame.h + 0.01;
  const start = mk(1)(1);
  const obst = grown.map((o, i) => (hitBox(start, o) ? raw[i] : o));
  const clear = b => inFrame(b) && !obst.some(o => hitBox(b, o));
  let best = null;
  for (const a of RETRACT_RATES) {
    const at = mk(a);
    let kStop = 1;
    for (let i = 200; i >= 0; i--) {
      if (!clear(at(i / 200))) break;
      kStop = i / 200;
    }
    // (the smallest frame at the stop wins; a faster approach to the document breaks ties)
    const w = at(kStop).w;
    if (!best || w < best.w - 4) best = {at, kStop, w, a};
  }
  return {at: best.at, kStop: best.kStop, rate: best.a, hits: clear(best.at(1)) ? 0 : 1};
}

/** The two cone lines joining the source and the lens window. */
function coneCorners(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  const horizontal = Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y);
  if (horizontal) {
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
    slug: 'research-08-inspect',
    title: 'Jurisdiction check — inspect and change a declaration',
    titleEs: 'Comprobación de jurisdicción — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Comprobación de jurisdicción',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A two-compartment cabinet holds the documents the filter sorted ("= key" / "≠ key"). A lens lifts a real copy of one document\'s declaration; the declared name is struck and replaced by the alternative value, and only that document moves to the compartment its new declaration belongs to, leaving a dashed trace of its old slot. The lens folds back and a single "datum changed" marker remains. Seeking back restores the previous datum.',
    tags: ['jurisdiction', 'inspect', 'lens', 'substitution', 'declared jurisdiction', 'cabinet', 'research card', 'before/after'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/comprobacion-de-jurisdiccion.js', 'src/animations/causation/kits/place.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
