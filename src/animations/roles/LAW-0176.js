/**
 * LAW-0176 — Intervención de perito · inspect
 *
 * Storyboard (same workbench stage as the story, seen after the action):
 *  0.00–0.20  build: the state produced by the action — the tag tied to the
 *             object is pinned on the report board; the figure, the supplied
 *             data rows and the opinion (dashed scope fence) come up in turn,
 *             then the scope zone the opinion covers is outlined on the figure
 *             and on the object (dashed, neutral blue).
 *  0.20–0.45  isolate: a lens lifts a REAL copy of the page region that
 *             separates "opinion, scope as stated" from "data examined" (the
 *             scope line; or a measurement row) from its own coordinates to a
 *             large window; the rest dims. Nothing changes yet.
 *  0.45–0.75  substitute ONE supplied datum: the old value lifts out and fades,
 *             reappears below as a struck slip (kept traceable), then the new
 *             value fades in. Only its dependent geometry updates: the scope
 *             zone on the figure and on the object (old outline out first, new
 *             in) — or, for a measurement, the dimension lines are re-traced.
 *  0.75–1.00  return: the lens closes onto its source; the context shows the
 *             new value; a neutral Δ marker and a card with the struck old
 *             value mark the changed datum. Held from 0.89.
 * Seeking back restores the previous datum exactly (pure function of time).
 * No validity, responsibility or outcome is inferred from the new value.
 * @module animations/roles/LAW-0176
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r, ease} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {actorLook} from '../../primitives/people-style.js';
import {changedMarker} from '../../primitives/markers.js';
import {peritoFields, PERITO_DEFAULTS, PERITO_STRINGS, ZONES, LAB, labGeometry, labStage, reportPage, pageFrame, specialistCaption,
  labRegions, labChipSpecs, placeLabelSet, linkMarks, fitW, textOrBars, strikeLines, findSpot, drawOn, overlaps, ACT} from './kits/intervencion-de-perito.js';

const ID = 'LAW-0176';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  fig: [0.02, 0.07], rows: [0.05, 0.1], fence: [0.08, 0.13], op: [0.1, 0.14], sc: [0.12, 0.16], key: [0.14, 0.18], zone: [0.15, 0.19], marks: [0.12, 0.17],
  open: [0.21, 0.33], oldOut: [0.46, 0.52], slip: [0.52, 0.56], newIn: [0.56, 0.61], dimLow: [0.6, 0.63], zoneOut: [0.62, 0.66], zoneIn: [0.67, 0.71], dimBack: [0.71, 0.74],
  close: [0.75, 0.82], ctxOld: [0.755, 0.78], ctxNew: [0.785, 0.815], marker: [0.83, 0.88],
};
const SECTIONS = ['figure', 'data', 'opinion'];

const STRINGS = {
  en: {...PERITO_STRINGS.en, before: 'Before'},
  es: {...PERITO_STRINGS.es, before: 'Antes'},
};

const sceneSchema = {
  ...peritoFields,
  relationships: list('Which report sections the tag links the object to (a small tag glyph marks each linked section)', obj('Link from the object to a report section', {
    from: oneOf('Source (the examined object)', ['object']),
    to: oneOf('Report section', SECTIONS),
  }, ['from', 'to']), 1, 3),
  focusTarget: oneOf('Datum that is enlarged and substituted: the stated scope of the opinion, or one measurement row', ['scope', 'measurement']),
  beforeValue: str('Value shown before the substitution (replaces the scope, or the chosen measurement row, as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative supplied datum)', 90),
  detailGeometry: obj('Lens geometry and the dependent scope zone', {
    zoom: num('Maximum magnification of the lens', 1.5, 4),
    placement: oneOf('Where the lens window opens (auto = the largest free area that leaves the figure visible)', ['auto', 'left', 'right', 'top', 'bottom']),
    row: num('Measurement row substituted when the focus is a measurement (0-based)', 0, 2),
    zoneBefore: oneOf('Part of the object covered by the scope before (outer = rim/lid, inner = hub/contents)', ZONES),
    zoneAfter: oneOf('Part of the object covered by the scope after', ZONES),
  }),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  ...PERITO_DEFAULTS,
  relationships: [{from: 'object', to: 'figure'}, {from: 'object', to: 'opinion'}],
  focusTarget: 'scope',
  beforeValue: 'Scope: teeth of item 7, surface only',
  afterValue: 'Scope: the whole of item 7, surface only',
  detailGeometry: {zoom: 2.4, placement: 'auto', row: 0, zoneBefore: 'outer', zoneAfter: 'whole'},
  contextLabels: {context: 'Context: item 7 tagged and pinned to its report', marker: 'Scope changed (as supplied)'},
};

const scene = {
  sizes: {landscape: [1800, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const cfg = LAB[shape];
    const W0 = ctx.design.w, H0 = ctx.design.h;
    const showAll = ctx.show('all');
    const focus = p.focusTarget;
    const dg = p.detailGeometry;
    const rep = JSON.parse(JSON.stringify(p.props.report));
    const rowI = Math.min(Math.round(dg.row ?? 0), rep.measurements.length - 1);
    if (focus === 'scope') rep.scope = p.beforeValue;
    else rep.measurements[rowI] = p.beforeValue;
    const zones = focus === 'scope' ? [...new Set([dg.zoneBefore, dg.zoneAfter])] : [];
    // the changed-datum card lives on the page, right under the section that holds the datum
    const cardFits = (ww, S) => {
      const cs = Math.min(S, cfg.S); // the marker label is a caption: never larger than the chips
      const lab = fitW(p.contextLabels.marker, {maxWidth: ww - S * 2.6, size: cs, minSize: cs, maxLines: 3, weight: 700});
      const old = fitW(`${ctx.t.before}: ${p.beforeValue}`, {maxWidth: ww - S * 2.6, size: S, minSize: S, maxLines: 4, weight: 500});
      return {lab, old, pad: S * 0.5, h: lab.height + S * 0.3 + old.height + S};
    };
    const G = labGeometry(ctx, {W: W0, H: H0, cfg, report: rep, tagText: p.props.tag, keyText: ctx.show('key') ? ctx.t.key : null, show: showAll, kind: p.props.objectKind, headReserve: 1.4,
      noteSize: ctx.show('key') ? (ww, S) => cardFits(ww, S).h : null, noteAfter: focus === 'scope' ? 'opinion' : 'data',
      scopeAlt: focus === 'scope' ? p.afterValue : null, rowAlt: focus === 'measurement' ? {i: rowI, text: p.afterValue} : null});
    const look = actorLook(ctx, p.actors[0], 0);
    const stage = labStage(ctx, {prefix: 'st', G, look, kind: p.props.objectKind, show: showAll, tagText: p.props.tag, pageZones: zones, objZones: zones});
    const PL = G.PL;
    const S = PL.S;
    const cap = Math.min(S, cfg.S);
    const pg = q => ({x: G.page.x + q.x, y: G.page.y + q.y});

    // ---- the focus datum (page-local): its position, the old/new fits and the slip
    const ip = S * 0.6;
    const F = focus === 'scope'
      ? {x: PL.scX, y: PL.scY, oldFit: PL.sc, newFit: PL.scAlt}
      : {x: PL.rows[rowI].x, y: PL.rows[rowI].y, oldFit: PL.rows[rowI].fit, newFit: PL.rows[rowI].alt};
    const textW = Math.max(F.oldFit.width, F.newFit.width);
    const textH = Math.max(F.oldFit.height, F.newFit.height);
    F.box = focus === 'scope'
      ? {x: PL.opX - S * 0.2, y: F.y - S * 0.35, w: S * 1.1 + textW + S * 0.3, h: textH + S * 0.7}
      : {x: PL.rows[rowI].bx - S * 0.2, y: F.y - S * 0.3, w: (F.x - PL.rows[rowI].bx) + textW + S * 0.5, h: textH + S * 0.6};
    // the lens isolates the whole section that holds the datum (the fenced opinion block, or the
    // data section); the struck slip with the old value appears just under it inside the lens
    const secBox = focus === 'scope'
      ? {x: PL.opBox.x - S * 0.9, y: PL.opBox.y - S * 0.35, w: PL.opBox.w + S * 1.3, h: PL.opBox.h + S * 0.5}
      : {x: PL.dataHeadX - S * 0.35, y: PL.dataHeadY - S * 0.45, w: Math.max(PL.dataHeadW, ...PL.rows.map(q => q.bw)) + S * 0.7, h: PL.rows[PL.rows.length - 1].y + PL.rows[PL.rows.length - 1].h - PL.dataHeadY + S * 0.8};
    const slipFit = fitW(`${ctx.t.before}: ${p.beforeValue}`, {maxWidth: Math.max(secBox.w - S * 1.6, S * 9), size: S, minSize: S, maxLines: 4, weight: 500});
    const slipPad = S * 0.45;
    const slipBox = {x: secBox.x + S * 0.6, y: secBox.y + secBox.h + S * 0.1, w: slipFit.width + slipPad * 2, h: slipFit.height + slipPad * 2};
    const srcLocal = {x: secBox.x, y: secBox.y, w: Math.max(secBox.w, slipBox.x + slipBox.w - secBox.x + S * 0.4), h: slipBox.y + slipBox.h - secBox.y + S * 0.4};
    const source = {...pg(srcLocal), w: srcLocal.w, h: srcLocal.h};

    // ---- camera: the context shrinks to a thumbnail (left or top) while the lens opens in the
    // freed area; the arrangement giving the larger enlargement is used
    const options = [
      {thumb: shape === 'landscape' ? 0.5 : 0.46, camA: {x: 14, y: H0 / 2}, side: 'right'},
      {thumb: shape === 'portrait' ? 0.46 : 0.42, camA: shape === 'portrait' ? {x: W0 / 2, y: 14} : {x: 14, y: 14}, side: 'below'},
    ].map(o => {
      const area = o.side === 'right'
        ? {x: 14 + o.thumb * (W0 - 14) + 26, y: 24, w: W0 - 20 - (14 + o.thumb * (W0 - 14) + 26), h: H0 - 48}
        : {x: 20, y: 14 + o.thumb * (H0 - 14) + 24, w: W0 - 40, h: H0 - 20 - (14 + o.thumb * (H0 - 14) + 24)};
      const zoom = Math.min(dg.zoom, area.w / source.w, area.h / source.h);
      return {...o, area, zoom};
    });
    const pick = dg.placement === 'bottom' || dg.placement === 'top' ? options[1] : dg.placement === 'left' || dg.placement === 'right' ? options[0] : options.reduce((x, y) => (y.zoom > x.zoom + 0.05 ? y : x));
    const {thumb, camA, area, zoom} = pick;
    const dest = {x: area.x + (area.w - source.w * zoom) / 2, y: area.y + (area.h - source.h * zoom) / 2, w: source.w * zoom, h: source.h * zoom};
    // the lens copy: the same page at the same coordinates (no key line, so the slip has room)
    const copyL = {...PL, key: null};
    const copyPage = reportPage(ctx, copyL, {prefix: 'lz-pg', h: G.page.h, show: showAll, kind: p.props.objectKind, zones});
    const bullet = focus === 'measurement'
      ? g(null, h('path', {d: `M${r(PL.rows[rowI].bx + S * 0.05)} ${r(F.y + S * 0.12)}h${r(S * 0.72)}v${r(S * 0.72)}h${r(-S * 0.72)}Z`, fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2}),
        h('circle', {cx: r(PL.rows[rowI].bx + S * 0.41), cy: r(F.y + S * 0.48), r: r(S * 0.13), fill: th.accent2}))
      : null;
    const newNode = (prefix, fit) => g({name: `${prefix}-new`, opacity: 0}, bullet,
      textOrBars(ctx, fit, {x: F.x, y: F.y, fill: '#1f2328', show: showAll, italic: focus === 'scope', barFill: th.paperLine}));
    const slip = g({name: 'lz-slip', opacity: 0},
      h('path', {d: `M${r(slipBox.x)} ${r(slipBox.y)}h${r(slipBox.w)}v${r(slipBox.h)}h${r(-slipBox.w)}Z`, fill: '#fbf6e8', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '6 5'}),
      textOrBars(ctx, slipFit, {x: slipBox.x + slipPad, y: slipBox.y + slipPad, fill: th.inkSoft, show: showAll, barFill: th.paperLine}),
      strikeLines(ctx, slipFit, {x: slipBox.x + slipPad, y: slipBox.y + slipPad, color: th.inkSoft}));
    // only the isolated section (and the slip under it) is shown inside the lens
    const secClip = 'lz-secclip';
    const copy = g({transform: T(G.page.x, G.page.y)},
      h('defs', null, h('clipPath', {id: ctx.id(secClip)}, h('rect', {x: r(srcLocal.x), y: r(srcLocal.y), width: r(srcLocal.w), height: r(srcLocal.h)}))),
      g({'clip-path': ctx.ref(secClip)},
        h('rect', {x: r(srcLocal.x), y: r(srcLocal.y), width: r(srcLocal.w), height: r(srcLocal.h), fill: th.paper}),
        g({'clip-path': ctx.ref(`${secClip}-in`)}, copyPage),
        h('defs', null, h('clipPath', {id: ctx.id(`${secClip}-in`)}, h('rect', {x: r(secBox.x), y: r(secBox.y), width: r(secBox.w), height: r(secBox.h)}))),
        newNode('lz', F.newFit), slip));
    const clipId = 'lz-clip';
    const lensNode = g({name: 'lz'},
      h('path', {name: 'lz-dim', 'fill-rule': 'evenodd', fill: '#1f2328', opacity: 0}),
      h('path', {name: 'lz-src', fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      h('line', {name: 'lz-coneA', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'lz-coneB', stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'lz-cliprect', rx: 22}))),
      g({name: 'lz-win', opacity: 0, 'data-occludes': 1},
        h('rect', {name: 'lz-shadow', rx: 22, fill: th.shadow}),
        h('rect', {name: 'lz-bg', rx: 22, fill: th.paper}),
        g({'clip-path': ctx.ref(clipId)}, g({name: 'lz-content'}, copy)),
        h('rect', {name: 'lz-border', rx: 22, fill: 'none', stroke: th.accent2, 'stroke-width': 5})));
    const ctxNew = g({transform: T(G.page.x, G.page.y)}, newNode('cx', F.newFit));

    // ---- changed marker on the focus line (right edge of the fence / row)
    const markR = S * 0.55;
    const markAt = focus === 'scope'
      ? pg({x: PL.opBox.x + PL.opBox.w, y: F.y + Math.min(F.newFit.height, F.oldFit.height) / 2})
      : pg({x: PL.rows[rowI].bx + S * 0.41, y: F.y + S * 0.48}); // on the row's own bullet: the leader below runs along the bullets, never through text
    const marker = g({name: 'mk', opacity: 0, transform: T(markAt.x, markAt.y)}, changedMarker(ctx, {radius: markR}));

    // ---- labels: context caption, specialist and object chips; the marker card (hold)
    const R = labRegions(G, stage, shape);
    const chipSpecs = [];
    if (ctx.show('all') && p.contextLabels.context) chipSpecs.push({name: 'chip-ctx', text: p.contextLabels.context, targets: [{x: 0, y: 0}], noLeader: true, atRest: true, regions: R.free, avoidExtra: []});
    if (ctx.show('key')) chipSpecs.push(...labChipSpecs(G, R, {object: p.props.object, specialist: specialistCaption(p)}));
    // chips: one caption size (never above the page text, never below the floor)
    const pass = placeLabelSet(ctx, {R, chips: chipSpecs, notes: [], size: cap, Smin: cfg.Smin, maxWidth: shape === 'portrait' ? 440 : 480});
    // the changed-datum card, on the page under the datum's section, with a short leader to the Δ
    let card = null;
    const cardFit = !ctx.show('key') || Boolean(PL.noteBox);
    if (ctx.show('key') && PL.noteBox) {
      const nb = PL.noteBox;
      const cf = cardFits(nb.w, S);
      const bx = {x: G.page.x + nb.x, y: G.page.y + nb.y, w: nb.w, h: cf.h};
      const pad = cf.pad;
      const oy = bx.y + pad + cf.lab.height + S * 0.3;
      const lx = bx.x + S * 1.7;
      const from = {x: clamp(markAt.x, bx.x + S * 0.3, bx.x + bx.w - S * 0.3), y: bx.y};
      card = {box: bx, leader: true, from, node: g({name: 'card', opacity: 0},
        h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(markAt.x)} ${r(markAt.y + markR)}`, stroke: th.accent2, 'stroke-width': 2.4}),
        h('rect', {x: r(bx.x), y: r(bx.y), width: r(bx.w), height: r(bx.h), rx: r(S * 0.4), fill: '#fff', stroke: th.accent2, 'stroke-width': 2.4}),
        g({transform: T(bx.x + S * 0.85, bx.y + pad + S * 0.5)}, changedMarker(ctx, {radius: S * 0.45})),
        textOrBars(ctx, cf.lab, {x: lx, y: bx.y + pad, fill: '#1f2328', show: true}),
        textOrBars(ctx, cf.old, {x: lx, y: oy, fill: th.inkSoft, show: true}),
        strikeLines(ctx, cf.old, {x: lx, y: oy, color: th.inkSoft}))};
    }
    const chips = pass.placed;
    const {links, marks} = linkMarks(ctx, G, p.relationships);
    const sp = pass.placed.find(c => c.node.attrs.name === 'chip-sp');
    const nameLeader = !ctx.show('key') || Boolean(sp && sp.target);
    return {nameLeader, G, stage, PL, F, focus, zones, rowI, lensNode, copyL, ctxNew, marker, markAt, chips, card, cardFit, chipsFit: pass.chipsFit, links, marks, source, dest, zoom, S, camA, thumb, W0, H0, shape, side: pick.side};
  },
  build(ctx, L) {
    return g(null, g({name: 'cam'}, L.stage.node, L.ctxNew, L.marks.map(m => m.node), L.marker, L.chips.map(c => c.node), L.card && L.card.node), L.lensNode);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const dg = p.detailGeometry;
    const focus = L.focus;
    const zb = dg.zoneBefore, za = dg.zoneAfter;
    // --- build: the linked state comes up
    const zoneState = {};
    if (focus === 'scope') {
      const zIn = seg(u, ...W.zone);
      const out = zb === za ? 0 : ease.inOutSine(seg(u, ...W.zoneOut));
      const inn = zb === za ? 0 : ease.inOutSine(seg(u, ...W.zoneIn));
      zoneState[zb] = zIn * (1 - out);
      if (za !== zb) zoneState[za] = inn;
    }
    const rowsN = L.PL.rows.length;
    const pageState = {
      fig: seg(u, ...W.fig), rows: Array.from({length: rowsN}, (_, i) => seg(u, W.rows[0] + 0.012 * i, W.rows[1] + 0.012 * i)),
      fence: seg(u, ...W.fence), op: seg(u, ...W.op), sc: seg(u, ...W.sc), key: seg(u, ...W.key), zones: zoneState,
    };
    // re-traced dimension lines (measurement focus): drawn off, then on again
    const retrace = focus === 'measurement' ? 1 - seg(u, ...W.zoneOut) + seg(u, ...W.zoneIn) : 1;
    const dimP = Math.min(seg(u, ...W.fig), retrace);
    const posed = L.stage.pose({c: 1, pageState, leader: seg(u, ...W.fig), objZones: zoneState, dim: dimP});
    const nodes = posed.nodes;
    Object.assign(nodes, drawOn('st-pg-figdim', dimP));
    L.marks.forEach(m => { nodes[m.name] = {opacity: r(seg(u, ...W.marks), 3)}; });
    // --- lens: open, substitute inside it, close
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const dimK = 1; // steady dim while the lens is open (no un-dim / re-dim flicker)
    // camera and lens window: the source follows the shrinking context exactly
    const sc = 1 + (L.thumb - 1) * open;
    const A = L.camA;
    nodes.cam = {transform: sc === 1 ? '' : `translate(${r(A.x)} ${r(A.y)}) scale(${r(sc, 4)}) translate(${r(-A.x)} ${r(-A.y)})`};
    const src = {x: A.x + sc * (L.source.x - A.x), y: A.y + sc * (L.source.y - A.y), w: L.source.w * sc, h: L.source.h * sc};
    const D = L.dest;
    const R = {x: src.x + (D.x - src.x) * open, y: src.y + (D.y - src.y) * open, w: src.w + (D.w - src.w) * open, h: src.h + (D.h - src.h) * open};
    const kk = R.w / L.source.w;
    const vis = open > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    const tb = {x: A.x + sc * (0 - A.x), y: A.y + sc * (0 - A.y), w: L.W0 * sc, h: L.H0 * sc};
    nodes['lz-dim'] = {d: `M${r(tb.x)} ${r(tb.y)}h${r(tb.w)}v${r(tb.h)}h${r(-tb.w)}ZM${r(src.x)} ${r(src.y)}v${r(src.h)}h${r(src.w)}v${r(-src.h)}Z`, opacity: r(0.38 * open * dimK, 3)};
    nodes['lz-src'] = {d: `M${r(src.x)} ${r(src.y)}h${r(src.w)}v${r(src.h)}h${r(-src.w)}Z`, opacity: vis ? 1 : 0};
    const horiz = L.side === 'right';
    const cA = horiz ? [{x: src.x + src.w, y: src.y}, {x: R.x, y: R.y}] : [{x: src.x, y: src.y + src.h}, {x: R.x, y: R.y}];
    const cB = horiz ? [{x: src.x + src.w, y: src.y + src.h}, {x: R.x, y: R.y + R.h}] : [{x: src.x + src.w, y: src.y + src.h}, {x: R.x + R.w, y: R.y}];
    nodes['lz-coneA'] = {x1: r(cA[0].x), y1: r(cA[0].y), x2: r(cA[1].x), y2: r(cA[1].y), opacity: open > 0.05 ? 1 : 0};
    nodes['lz-coneB'] = {x1: r(cB[0].x), y1: r(cB[0].y), x2: r(cB[1].x), y2: r(cB[1].y), opacity: open > 0.05 ? 1 : 0};
    nodes['lz-cliprect'] = rect;
    // opaque whenever visible: the copy never shows through the page text (no doubled text)
    nodes['lz-win'] = {opacity: vis ? 1 : 0};
    nodes['lz-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['lz-bg'] = rect;
    nodes['lz-border'] = rect;
    nodes['lz-content'] = {transform: `${T(R.x - L.source.x * kk, R.y - L.source.y * kk)} scale(${r(kk, 4)})`};
    const lzCopy = pageFrame('lz-pg', L.copyL, {...pageState, key: 0});
    Object.assign(nodes, lzCopy);
    const oldOut = seg(u, ...W.oldOut);
    const newIn = seg(u, ...W.newIn);
    const S = L.S;
    const oldName = focus === 'scope' ? 'lz-pg-sc' : `lz-pg-row${L.rowI}`;
    // same text-in mapping as pageFrame (a row's text arrives after its placeholder has left)
    const baseOld = focus === 'scope' ? pageState.sc : clamp((pageState.rows[L.rowI] - 0.4) / 0.6);
    nodes[oldName] = {opacity: r(baseOld * (1 - oldOut), 3), transform: T(0, -S * 0.5 * ease.outCubic(oldOut))};
    if (focus === 'measurement') nodes[`lz-pg-ph-row${L.rowI}`] = {opacity: 0};
    nodes['lz-new'] = {opacity: r(newIn, 3)};
    const slipK = seg(u, ...W.slip);
    nodes['lz-slip'] = {opacity: r(slipK, 3)};
    // --- context datum swaps only while the lens returns (old out first, then new in)
    const ctxOld = seg(u, ...W.ctxOld), ctxNew = seg(u, ...W.ctxNew);
    const ctxName = focus === 'scope' ? 'st-pg-sc' : `st-pg-row${L.rowI}`;
    nodes[ctxName] = {opacity: r(baseOld * (1 - ctxOld), 3)};
    if (focus === 'measurement') nodes[`st-pg-ph-row${L.rowI}`] = {opacity: r(1 - clamp(pageState.rows[L.rowI] / 0.4), 3)};
    nodes['cx-new'] = {opacity: r(ctxNew, 3)};
    const mk = seg(u, ...W.marker);
    nodes.mk = {opacity: r(mk, 3)};
    if (L.card) nodes.card = {opacity: r(mk, 3)};
    // --- semantics
    const datum = newIn >= 1 ? 'after' : oldOut > 0 ? 'changing' : 'before';
    const contextDatum = ctxNew > 0 ? 'after' : 'before';
    const zoneNow = focus !== 'scope' || zb === za ? 'same' : (zoneState[za] || 0) > 0 ? 'after' : 'before';
    const lensRect = {x: r(R.x), y: r(R.y), w: r(R.w), h: r(R.h)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {
      nodes,
      semantic: {
        beat,
        allReached: posed.semantic.reached,
        tagHolder: posed.semantic.tagHolder,
        lensOpen: r(open, 3), lensRect, lensC: {x: r(lensRect.x + lensRect.w / 2), y: r(lensRect.y + lensRect.h / 2)},
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        zoom: r(L.zoom, 3),
        lensAtSource: Math.abs(R.x - src.x) < 0.5 && Math.abs(R.y - src.y) < 0.5 && Math.abs(R.w - src.w) < 0.5,
        camScale: r(sc, 4), thumbScale: L.thumb, contextThumb: sc <= L.thumb + 1e-6, lensScaleOnPage: r(kk / sc, 3),
        datum, contextDatum,
        lensValue: datum === 'after' ? p.afterValue : p.beforeValue,
        contextValue: contextDatum === 'after' ? p.afterValue : p.beforeValue,
        oldInLens: r(1 - oldOut, 3), newInLens: r(newIn, 3), slip: r(seg(u, ...W.slip), 3),
        oldInContext: r(1 - ctxOld, 3), newInContext: r(ctxNew, 3),
        zoneNow, zones: Object.fromEntries(Object.entries(zoneState).map(([k, v]) => [k, r(v, 3)])),
        dim: r(dimP, 3),
        markerVisible: mk >= 1, marker: {x: r(L.markAt.x), y: r(L.markAt.y)},
        figure: r(pageState.fig, 3), rows: pageState.rows.map(v => r(v, 3)), opinion: r(pageState.op, 3), scopeShown: r(pageState.sc, 3),
        focus, linked: L.links,
        chipsFit: L.chipsFit, cardFit: L.cardFit,
        cardClear: !L.card || !L.chips.some(c => overlaps(c.box, L.card.box, 2)), cardLeader: Boolean(L.card && L.card.leader), cardOnPage: !L.card || (L.card.box.x >= L.G.page.x - 1 && L.card.box.x + L.card.box.w <= L.G.page.x + L.G.page.w + 1 && L.card.box.y + L.card.box.h <= L.G.page.y + L.G.page.h + 1),
        cardGap: L.card ? r(Math.max(0, L.card.box.y - L.markAt.y)) : 0, dimOpacity: r(0.38 * open * dimK, 3), nameLeader: L.nameLeader, handsOnBench: posed.semantic.handsOnBench, S: r(L.S, 2),
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
    slug: 'roles-04-inspect',
    title: 'Specialist intervention — inspect and replace one supplied datum of the report',
    titleEs: 'Intervención de perito — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Intervención de perito',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'After the specialist has pinned the tagged object to the report, a lens lifts a real copy of the scope line (or a measurement row) from its place; one supplied datum is replaced (the old value leaves as a struck slip), only the dependent scope zone on the figure and on the object is redrawn (or the dimension lines re-traced), and the view returns with a neutral Δ marker and the struck old value. As supplied; no conclusion drawn.',
    tags: ['specialist', 'expert', 'report', 'lens', 'scope', 'measurement', 'substitution', 'changed datum', 'tag string', 'person'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/intervencion-de-perito.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
