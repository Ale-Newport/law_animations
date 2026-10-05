/**
 * LAW-0066 — Extracción de hechos · mechanism
 *
 * Storyboard (an exploded view around the marker — the component that turns
 * the user's indication and a passage of the page into a card entry):
 *  0.00–0.18  separate: the parts drift apart from a tight cluster into their
 *             places — library bay (with the OUT-guide of the volume), the
 *             loose source page, the user's request box, the index flag and
 *             the fact card.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             each anchored to the edges of its two parts and styled by kind
 *             (plain relation: no arrowhead; communication: dashed arrow;
 *             sequence: solid arrow; causal only if supplied). The sides each
 *             link uses are chosen together (no crossings, no link through a
 *             part, none shorter than the chips need); a ¶ relation lands on
 *             the page at its sentence row; the copy's way into the card lands
 *             beside its slot or under it (never across the card's header).
 *             Captions sit beside their link's middle.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order along the
 *             connectors (request → flag → page → flag → card by default),
 *             stopping only where there is no text (flag adhesive, page
 *             margin, the copy's grip). The focus part (the flag) enlarges
 *             while the tracer is on it; at the page the pinpointed sentence is
 *             highlighted; from there the copy — rolled up, with its ¶ tab at
 *             full size — rides with the tracer (behind the flag while it
 *             passes it) and unrolls into its slot on the card.
 *  0.75–1.00  gather: every state stays visible — origin (highlighted ¶ on the
 *             page), transformation (flag tab with the ¶) and state (the copy
 *             filed on the card, the request ticked) — with a legend of the
 *             connector kinds.
 * No connector implies causation unless the author supplies kind "causal".
 * @module animations/research/LAW-0066
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline, cubicPolyline, roundRectPath} from '../../core/geometry.js';
import {str, obj, list, oneOf, int, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, chip, tracer, statusTag, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {extractionFields, sourceSheet, libraryShelf, requestPanel, factCard, flagMarker, factStrip, factPalette, coverColor, sentenceIndex, pinText, roundedRoute, fitBalanced, FLAG, MAX_SENTENCES,
  SOURCES_EN, CITATIONS_DEFAULT, DATES_EN} from './kits/extraccion-de-hechos.js';

const ID = 'LAW-0066';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {separate: [0.0, 0.16], relate: [0.19, 0.42], trace: [0.44, 0.74], legend: [0.78, 0.86], state: [0.8, 0.88]};
const IDS = ['library', 'page', 'query', 'marker', 'card'];

const STRINGS = {
  en: {filed: 'Copy filed', legend: 'Connector kinds'},
  es: {filed: 'Copia archivada', legend: 'Tipos de conector'},
};

const {query: _q, ...researchBase} = extractionFields;
const sceneSchema = {
  ...researchBase,
  query: obj('The fact the user indicates (the ¶ that states it is supplied)', {
    label: str('Request typed by the user', 60),
    sentence: int('¶ number (1-based) of the sentence that states it', 1, MAX_SENTENCES),
  }, ['label', 'sentence']),
  elements: list('Component labels; ids are fixed by the scene, labels are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
    label: str('Caption on this connector (defaults to the caption of its kind)', 50),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption used for each relation kind (legend and connectors without their own caption)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components (a component may be visited again)', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {
  query: {label: 'Who signed the delivery note', sentence: 3},
  sources: SOURCES_EN,
  citations: CITATIONS_DEFAULT,
  dates: DATES_EN,
  elements: [
    {id: 'library', label: 'Case library'},
    {id: 'page', label: 'Source page'},
    {id: 'query', label: 'User’s request'},
    {id: 'marker', label: 'Index flag'},
    {id: 'card', label: 'Fact card'},
  ],
  relationships: [
    {from: 'library', to: 'page', kind: 'relation', label: 'holds the volume'},
    {from: 'query', to: 'marker', kind: 'communication', label: 'indicates the fact'},
    {from: 'marker', to: 'page', kind: 'relation', label: 'pinpoints ¶3'},
    {from: 'marker', to: 'card', kind: 'sequence', label: 'files a copy'},
  ],
  focusElement: 'marker',
  relationLabels: {relation: 'Relation', communication: 'Communication', sequence: 'Sequence', causal: 'Causal (as supplied)'},
  traversalOrder: ['query', 'marker', 'page', 'marker', 'card'],
};

const M = 14;

/**
 * Sizes per layout shape (design units). The design space is fitted into the
 * caption-safe box at ≈0.82 (16:9), ≈0.84 (1:1) and ≈0.97 (9:16) px per unit
 * at 1080p: relation chips, part labels and page text stay ≥ 20 px.
 */
const SZ = {
  landscape: {chip: 26, part: 27, page: 28, pageMin: 25, legend: 25, tag: 25, K: 1.9, cardTitle: 30, req: 27, source: 21},
  square: {chip: 25, part: 26, page: 26, pageMin: 24, legend: 24, tag: 24, K: 1.3, cardTitle: 28, req: 25, source: 20},
  portrait: {chip: 23, part: 24, page: 26, pageMin: 21, legend: 23, tag: 23, K: 1.6, cardTitle: 28, req: 24, source: 20},
};

function overlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/**
 * Chip max width that splits a wrapped text into lines of similar length (no orphan word). Never
 * narrower than the longest word plus the chip's padding: a word is never broken.
 */
function balancedMax(ctx, text, o) {
  const c = chip(ctx, text, {...o, x: 0, y: 0});
  const n = c.fit.lines.length;
  if (n < 2 || c.fit.truncated) return o.maxWidth;
  const longest = Math.max(...String(text).split(/\s+/).map(w => ctx.measure(w, c.fit.size, o.weight ?? 600, 'sans'))) + (o.size ?? 26) * 1.2 + 2;
  let lo = Math.max(c.box.w / n, longest), hi = o.maxWidth;
  for (let k = 0; k < 10; k++) {
    const mid = (lo + hi) / 2;
    const cc = chip(ctx, text, {...o, x: 0, y: 0, maxWidth: mid});
    if (!cc.fit.truncated && cc.fit.lines.length === n && cc.fit.size === c.fit.size) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi) + 1;
}

/** Proper intersection of segments ab and cd. */
function segCross(a, b, c, d) {
  const o = (p, q, r2) => (q.x - p.x) * (r2.y - p.y) - (q.y - p.y) * (r2.x - p.x);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** Number of crossings between two sampled curves. */
function crossings(P, Q) {
  let n = 0;
  for (let i = 1; i < P.length; i++) {
    for (let j = 1; j < Q.length; j++) if (segCross(P[i - 1], P[i], Q[j - 1], Q[j])) n++;
  }
  return n;
}

const NORMAL = {left: {x: -1, y: 0}, right: {x: 1, y: 0}, top: {x: 0, y: -1}, bottom: {x: 0, y: 1}};

/** Point on one side of a box (kept in the middle part of the side), nearest to `toward`. */
function sidePoint(box, side, toward, pad, frac = 0.25) {
  if (side === 'left' || side === 'right') {
    return {x: side === 'left' ? box.x - pad : box.x + box.w + pad, y: clamp(toward.y, box.y + box.h * frac, box.y + box.h * (1 - frac))};
  }
  return {x: clamp(toward.x, box.x + box.w * frac, box.x + box.w * (1 - frac)), y: side === 'top' ? box.y - pad : box.y + box.h + pad};
}

/**
 * A connector drawn along a routed path (a detour around the flag) with the same styles and
 * frame API as `connector` (draw-on, arrowhead / end dots, dashed kinds through a mask).
 */
function routeLink(ctx, o) {
  const style = LINK_STYLES[o.kind || 'relation'];
  const poly = o.poly;
  const total = poly.total;
  const d = poly.d(1);
  const color = o.color ?? ctx.theme.fg;
  const from = poly.at(0), end = poly.at(1);
  const headLen = style.width * 4.2;
  const xs = poly.pts.map(q => q.x), ys = poly.pts.map(q => q.y);
  const pad = style.width * 6 + 20;
  const mx = Math.min(...xs) - pad, my = Math.min(...ys) - pad;
  const N = o.name;
  const node = g({name: N},
    style.dash
      ? h('defs', null, h('mask', {id: ctx.id(`${N}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...xs) - mx + pad), height: r(Math.max(...ys) - my + pad)},
        h('path', {name: `${N}-masker`, d, fill: 'none', stroke: '#fff', 'stroke-width': style.width * 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)})))
      : null,
    style.dash
      ? h('path', {name: `${N}-line`, d, fill: 'none', stroke: color, 'stroke-width': style.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': style.dash, mask: ctx.ref(`${N}-mask`)})
      : h('path', {name: `${N}-line`, d, fill: 'none', stroke: color, 'stroke-width': style.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    style.arrow ? h('path', {name: `${N}-head`, d: `M0 0L${r(-headLen)} ${r(-headLen * 0.55)}L${r(-headLen * 0.72)} 0L${r(-headLen)} ${r(headLen * 0.55)}Z`, fill: color, transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${N}-dotA`, cx: r(from.x), cy: r(from.y), r: style.width * 1.6, fill: color, opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${N}-dotB`, cx: r(end.x), cy: r(end.y), r: style.width * 1.6, fill: color, opacity: 0}) : null,
  );
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - p));
    const out = {[N]: {opacity}};
    if (style.dash) out[`${N}-masker`] = {'stroke-dashoffset': off};
    else out[`${N}-line`] = {'stroke-dashoffset': off};
    if (style.arrow) out[`${N}-head`] = {opacity: p >= 0.985 ? 1 : 0};
    if (style.endDots) {
      out[`${N}-dotA`] = {opacity: p > 0 ? 1 : 0};
      out[`${N}-dotB`] = {opacity: p >= 0.985 ? 1 : 0};
    }
    return out;
  };
  return {node, frame, at: t => poly.at(t), total, mid: poly.at(0.5), from: {x: from.x, y: from.y}, to: {x: end.x, y: end.y}};
}

/**
 * Part placement per layout shape (design units). The flag (hub) sits between
 * the page and the card with room for every connector (≥ ~120 units); its
 * height follows the pinpointed sentence within `cy`.
 */
function placement(shape, D, S, cardH) {
  const fw = FLAG.w * S.K, fh = FLAG.h * S.K;
  if (shape === 'portrait') {
    const pageW = 560;
    const cardY = D.h - M - cardH;
    return {
      library: {x: M, y: 54, w: 290, h: 270},
      query: {x: 350, y: 54, w: D.w - M - 350},
      page: {x: M, y: 520, w: pageW, h: Math.max(420, cardY - 110 - 520)},
      marker: {cx: M + pageW + 130 + fw / 2, fw, fh, labelSide: 'top'},
      card: {x: M, y: cardY, w: pageW + 80, h: cardH},
      legend: [{x: M + pageW + 110, y: cardY + 20, anchor: 'start'}, {x: D.w - M, y: cardY - 150, anchor: 'end'}],
      pageLabel: 'above-right',
    };
  }
  if (shape === 'square') {
    // request box across the top; page on the left; the card on the right under the request box and
    // the flag under the card, at the pinpointed sentence (the copy rises into the card from below)
    const pageW = 360;
    const cardW = pageW + 80;
    return {
      library: {x: M, y: 54, w: 230, h: 150},
      query: {x: 290, y: 54, w: D.w - M - 290},
      page: {x: M, y: 384, w: pageW, h: D.h - M - 384},
      marker: {cx: M + pageW + 190 + fw / 2, fw, fh, labelSide: 'bottom', below: true},
      card: {x: D.w - M - cardW, y: 236, w: cardW, h: cardH},
      legend: [{x: M, y: D.h - M, anchor: 'start', bottom: true}, {x: D.w - M, y: D.h - M, anchor: 'end', bottom: true}],
      pageLabel: 'above-right',
    };
  }
  // landscape: library | page | flag | card (the request box above the flag)
  const libW = 240;
  const pageX = M + libW + 280;
  const pageW = Math.round(clamp((D.w - M - pageX - 2 * 170 - fw - 80) / 2, 400, 600));
  const cardW = pageW + 80;
  const cardX = D.w - M - cardW;
  const pageR = pageX + pageW;
  return {
    library: {x: M, y: M + 48, w: libW, h: 400},
    page: {x: pageX, y: M + 48, w: pageW, h: D.h - 2 * M - 48},
    query: {x: pageR + 60, y: M, w: Math.min(820, D.w - M - pageR - 60)},
    marker: {cx: (pageR + cardX) / 2, fw, fh, labelSide: 'bottom'},
    card: {x: cardX, y: D.h - M - cardH, w: cardW, h: cardH},
    legend: [{x: M, y: D.h - M, anchor: 'start', bottom: true}, {x: D.w - M, y: D.h - M - cardH - 170, anchor: 'end'}],
    pageLabel: 'above-left',
  };
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1040, 880], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const S = SZ[shape];
    const labelOf = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
    const present = new Set(p.elements.map(e => e.id));
    const pal = factPalette(ctx);
    const color = pal[0];
    const sentences = p.sources.sentences;
    const n = sentences.length;
    const target = sentenceIndex(p.query.sentence, n);

    // --- the source page decides the copy's size; the card is sized to hold it
    const P0 = placement(shape, D, S, 240);
    const bandColors = sentences.map((_, i) => (i === target ? color.band : null));
    const sheetOpts = {prefix: 'm-page', w: P0.page.w, h: P0.page.h, volume: p.sources.volume, title: p.sources.title, pageRef: p.citations.page, date: p.dates.source,
      sentences, bandColors, size: S.page, minSize: S.pageMin, titleSize: 26};
    const makeSheet = h0 => {
      const others = sentences.map((_, i) => i).filter(i => i !== target);
      const bad = sh => sh.overflow > 0 || sh.sentences.some((x, i) => x.fit.truncated && !(sh.condensed || []).includes(i));
      let sh = sourceSheet(ctx, {...sheetOpts, h: h0});
      // very long pages: the sentences the flag does not pinpoint become simulated lines; only then
      // does the text go below its preferred size (it is never cut)
      if (bad(sh)) sh = {...sourceSheet(ctx, {...sheetOpts, h: h0, condense: others}), condensed: others};
      if (bad(sh)) sh = {...sourceSheet(ctx, {...sheetOpts, h: h0, condense: others, minSize: 15}), condensed: others};
      return sh;
    };
    let sheet = makeSheet(P0.page.h);
    let strip = factStrip(ctx, {name: 'm-strip', sentence: sheet.sentences[target], color: color.band});
    const cardOpts = w => ({prefix: 'm-card', w, title: labelOf('card'), titleSize: S.cardTitle, sourceSize: S.source,
      sourceLine: [p.sources.volume, p.citations.page, p.dates.source, p.dates.extracted ? `→ ${p.dates.extracted}` : ''].filter(Boolean).join(' · '), slots: [{h: strip.h}], gap: 10, stripX: 22});
    // the "copy filed" tag sits in the card's header when it clears the title and the source line;
    // otherwise the card gets a row for it under the slot
    const probeCard = factCard(ctx, {...cardOpts(P0.card.w), h: 1000});
    const tagProbe = ctx.show('key') ? statusTag(ctx, t.filed, {x: P0.card.w - 18, y: 10, anchor: 'end', size: S.tag}).box : null;
    const tagInHeader = !tagProbe || ![probeCard.titleBox, probeCard.sourceBox].filter(Boolean).some(o => overlap(tagProbe, o, 8));
    const cardH = probeCard.needH + 16 + (tagInHeader ? 0 : S.tag * 1.75 + 14);
    const P = placement(shape, D, S, cardH);
    if (P.page.h !== P0.page.h) {
      sheet = makeSheet(P.page.h);
      strip = factStrip(ctx, {name: 'm-strip', sentence: sheet.sentences[target], color: color.band});
    }
    const sIdx = sheet.sentences[target];
    const sentenceY = P.page.y + sIdx.strip.y + sIdx.strip.h / 2;

    // --- parts (each drawn at its local origin, then placed by a named group transform)
    const parts = {};
    {
      const b = P.library;
      const shelfOpts = {prefix: 'm-lib', w: b.w, h: b.h, rows: 2, label: labelOf('library') || p.sources.library, cover: coverColor(ctx), gapRow: 1, seedKey: 'mech-shelf', plateSize: S.part, plateW: 0.9};
      let sh = libraryShelf(ctx, shelfOpts);
      // (a wrapped plate leaves less room: one row of full-height books rather than two thin slivers)
      if (sh.rowH < 56) sh = libraryShelf(ctx, {...shelfOpts, rows: 1, gapRow: 0});
      parts.library = {node: sh.node, box: {...b}};
    }
    // a condensed page (the sentences nobody asked for drawn as simulated lines) starts with the
    // pinpointed sentence simulated as well — one bar per line, like its neighbours — so nothing picks
    // it out before the flag pinpoints it; its text resolves then (the bars leave before it appears)
    const excerpt = (sheet.condensed || []).length > 0;
    let pageNode = sheet.node;
    if (excerpt) {
      const f = sIdx.fit;
      const bars = f.lines.map((line, j) => {
        const lw = j < f.lines.length - 1 ? sheet.colW * 0.86 : clamp(ctx.measure(line, f.size, f.weight, f.family), sheet.colW * 0.3, sheet.colW * 0.86);
        const y = sIdx.textY + j * f.lineHeight + f.size * 0.5 - f.size * 0.275;
        return [h('rect', {x: r(sheet.colX), y: r(y), width: r(lw), height: r(f.size * 0.55), rx: r(f.size * 0.2), fill: th.paperLine}),
          h('rect', {x: r(sheet.colX), y: r(y), width: r(lw), height: r(f.size * 0.55), rx: r(f.size * 0.2), fill: 'none', stroke: th.inkSoft, 'stroke-width': 1, 'stroke-dasharray': '3 4', opacity: 0.6})];
      });
      pageNode = g(null, sheet.node, g({name: 'm-page-ph'}, bars));
    }
    parts.page = {node: pageNode, box: {...P.page}};
    const panel = requestPanel(ctx, {prefix: 'm-q', w: P.query.w, title: labelOf('query'), requests: [{label: p.query.label, color: color.flag, icon: 'quote'}], parkSide: 'right', compact: true, labelSize: S.req, rowMin: 58, titleMin: 48});
    parts.query = {node: panel.node, box: {x: P.query.x, y: P.query.y, w: P.query.w, h: panel.h}};
    // flag hub: at the pinpointed sentence's height when the request box and the card leave room
    const {fw, fh} = P.marker;
    const qBottom = parts.query.box.y + parts.query.box.h;
    const cyMin = P.marker.below ? P.card.y + P.card.h + 120 + fh / 2 : qBottom + 150 + fh / 2;
    const cyMax = shape === 'landscape' || P.marker.below ? D.h - M - fh / 2 - 60 : P.card.y - 130 - fh / 2;
    const cy = clamp(sentenceY, cyMin, Math.max(cyMin, cyMax));
    const flag = flagMarker(ctx, {name: 'm-flag', color: color.flag, tabInk: color.tabInk, pins: [{key: 'a', text: pinText(p.citations, target), count: 1}]});
    const flagBox = {x: P.marker.cx - fw / 2, y: cy - fh / 2, w: fw, h: fh};
    parts.marker = {node: g({transform: T(-fw / 2, 0, 0, S.K)}, flag.node), box: flagBox, center: {x: P.marker.cx, y: cy}};
    // the copy carries its own ¶ tab (a small flag stuck at its grip), like a filed entry
    const flag2 = flagMarker(ctx, {name: 'm-flag2', color: color.flag, tabInk: color.tabInk, pins: [{key: 'a', text: pinText(p.citations, target), count: 1}]});
    const card = factCard(ctx, {...cardOpts(P.card.w), h: P.card.h});
    parts.card = {node: card.node, box: {...P.card}};
    const dock = {x: P.card.x + card.slots[0].x + strip.grip.x, y: P.card.y + card.slots[0].y + strip.h / 2};
    // where the tracer stops on the flag: its translucent adhesive part (never on the ¶ text)
    const flagStop = {x: flagBox.x + (FLAG.stick * S.K) / 2, y: cy};

    // --- connectors: every candidate pair of sides is scored (crossings, running through parts,
    //     too short, leaving backwards); the page end of a ¶ relation lands at its sentence row and a
    //     copy enters the card beside its slot (never across the card's header)
    const center = id => (id === 'marker' ? parts.marker.center : {x: parts[id].box.x + parts[id].box.w / 2, y: parts[id].box.y + parts[id].box.h / 2});
    const rels = p.relationships.filter(rel => present.has(rel.from) && present.has(rel.to) && rel.from !== rel.to);
    const pageLinks = rels.filter(rel => (rel.from === 'page' || rel.to === 'page') && rel.from !== 'library' && rel.to !== 'library');
    // square: the library stands right over the page, so its link lands on the page's top edge, where
    // the page's label also sits. The label is placed FIRST — over the page's top-right corner (moved
    // right, never onto the card, when a long label would leave the link too little room) — and the
    // library's link lands on the top edge to the LEFT of it; no link may run under it (every locale,
    // every label length)
    let pageLabel = null;
    const pageMaxW = ctx.show('key') && labelOf('page') ? balancedMax(ctx, labelOf('page'), {size: S.part, maxLines: 2, maxWidth: parts.page.box.w - 30}) : 0;
    const libOverPage = shape === 'square' && present.has('library') && rels.some(rel => [rel.from, rel.to].includes('library') && [rel.from, rel.to].includes('page'));
    if (libOverPage && pageMaxW) {
      const pb = parts.page.box;
      const pw = chip(ctx, labelOf('page'), {x: 0, y: 0, maxWidth: pageMaxW, size: S.part, maxLines: 2}).box;
      const right = clamp(pb.x + 120 + pw.w, pb.x + pb.w, Math.min(D.w - M, P.card.x - 30));
      pageLabel = chip(ctx, labelOf('page'), {x: right, y: pb.y - pw.h - 8, anchor: 'end', maxWidth: pageMaxW, size: S.part, maxLines: 2, fill: th.card, stroke: th.ink, name: 'lab-page'});
    }
    const ends = (id, other, pad, rel) => {
      const box = parts[id].box;
      const oc = center(other);
      if (pageLabel && ((id === 'page' && other === 'library') || (id === 'library' && other === 'page'))) {
        // (square: straight down from the library's bottom to the page's top edge, left of its label)
        if (id === 'library') return [0.2, 0.35, 0.5, 0.65, 0.8].map(f => ({side: 'bottom', q: {x: box.x + box.w * f, y: box.y + box.h + pad}}));
        const lo = box.x + 26, hi = Math.max(lo, pageLabel.box.x - 30);
        return [0, 1 / 3, 2 / 3, 1].map(f => ({side: 'top', q: {x: lo + (hi - lo) * f, y: box.y - pad}}));
      }
      if (id === 'query' && other === 'marker' && shape === 'portrait' && P.marker.labelSide === 'top') {
        // (portrait: the flag's label holds its top side, so the request's link comes down beside the
        // label and enters the flag from the side away from the page — ports along the whole bottom)
        return [...['left', 'right', 'top', 'bottom'].map(side => ({side, q: sidePoint(box, side, oc, pad)})),
          ...[0.6, 0.7, 0.8, 0.9, 0.96].map(f => ({side: 'bottom', q: {x: box.x + box.w * f, y: box.y + box.h + pad}}))];
      }
      if (id === 'page' && other !== 'library') {
        // several ¶ links share the sentence row: each takes one of the row's ports (the combination
        // search decides which one, so they never cross on their way in)
        const nL = pageLinks.length;
        const step = Math.min(20, sIdx.strip.h / Math.max(1, nL));
        const slots = nL > 1 ? Array.from({length: nL}, (_, k) => (k - (nL - 1) / 2) * step) : [0];
        return ['left', 'right'].flatMap(side => slots.map(dy => ({side, q: {x: side === 'left' ? box.x - pad : box.x + box.w + pad, y: sentenceY + dy}})));
      }
      if (id === 'card' && other === 'marker') {
        // the copy enters beside its slot or rises from below to it; across the header only as a last resort
        return [...['left', 'right'].map(side => ({side, q: {x: side === 'left' ? box.x - pad : box.x + box.w + pad, y: dock.y}})),
          {side: 'bottom', q: {x: dock.x, y: box.y + box.h + pad}}, {side: 'top', q: sidePoint(box, 'top', oc, pad), cost: 400}];
      }
      // (the flag keeps one side free for its own label)
      if (id === 'card') {
        // any other link keeps off the copy's row and the header: lower part of the sides, or the bottom
        const y = Math.min(box.y + box.h - 16, Math.max(dock.y + strip.h / 2 + 24, box.y + box.h * 0.72));
        // (ports near the corners too: a link can reach the card beside a part that covers its middle)
        const along = side => [0.08, 0.25, 0.5, 0.75, 0.92].map(f => ({side, q: {x: box.x + box.w * f, y: side === 'top' ? box.y - pad : box.y + box.h + pad}, cost: side === 'top' ? 40 : 0}));
        return [...['left', 'right'].map(side => ({side, q: {x: side === 'left' ? box.x - pad : box.x + box.w + pad, y}})), ...along('bottom'), ...along('top')];
      }
      return ['left', 'right', 'top', 'bottom'].filter(side => id !== 'marker' || side !== P.marker.labelSide).map(side => ({side, q: sidePoint(box, side, oc, pad, id === 'marker' ? 0.5 : 0.25)}));
    };
    const partBoxes = IDS.filter(id => present.has(id)).map(id => ({id, b: parts[id].box}));
    // the flag's own label is placed on its free side: links route around it too
    let markerLabelBox = null;
    if (ctx.show('key') && labelOf('marker')) {
      const pb = chip(ctx, labelOf('marker'), {x: 0, y: 0, anchor: 'middle', maxWidth: 320, size: S.part, maxLines: 2}).box;
      const side = P.marker.labelSide, fb = flagBox;
      markerLabelBox = side === 'top' ? {x: fb.x + fb.w / 2 - pb.w / 2, y: fb.y - 14 - pb.h, w: pb.w, h: pb.h}
        : side === 'left' ? {x: fb.x - 16 - pb.w, y: fb.y + fb.h / 2 - pb.h / 2, w: pb.w, h: pb.h}
          : side === 'right' ? {x: fb.x + fb.w + 16, y: fb.y + fb.h / 2 - pb.h / 2, w: pb.w, h: pb.h} : {x: fb.x + fb.w / 2 - pb.w / 2, y: fb.y + fb.h + 14, w: pb.w, h: pb.h};
    }
    // a link between two other parts may detour around the flag (and its label) instead of running
    // under it or crossing the links that meet at the flag
    const around = (() => {
      const bs = [flagBox, markerLabelBox].filter(Boolean);
      const x0 = Math.min(...bs.map(b => b.x)) - 28, y0 = Math.min(...bs.map(b => b.y)) - 28;
      const x1 = Math.max(...bs.map(b => b.x + b.w)) + 28, y1 = Math.max(...bs.map(b => b.y + b.h)) + 28;
      return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
    })();
    const detours = (a, b) => {
      const na = NORMAL[a.side], nb = NORMAL[b.side];
      const a1 = {x: a.q.x + na.x * 30, y: a.q.y + na.y * 30}, b1 = {x: b.q.x + nb.x * 30, y: b.q.y + nb.y * 30};
      if (!(Math.min(a1.x, b1.x) < around.x && Math.max(a1.x, b1.x) > around.x + around.w)) return [];
      return [around.y + around.h, around.y].filter(ey => (na.y === 0 || (ey - a1.y) * na.y > 0) && (nb.y === 0 || (ey - b1.y) * nb.y > 0))
        .map(ey => roundedRoute([a.q, a1, {x: a1.x, y: ey}, {x: b1.x, y: ey}, b1, b.q], 34));
    };
    const onFlag = q => q.x > flagBox.x - 6 && q.x < flagBox.x + flagBox.w + 6 && q.y > flagBox.y - 6 && q.y < flagBox.y + flagBox.h + 6;
    // candidates per link (its own cost: leaving/entering backwards, too short, running through parts
    // — through the flag above all — or out of the frame), then the combination with the fewest
    // crossings, shared ports and links running alongside each other wins
    const cands = rels.map(rel => {
      const A = ends(rel.from, rel.to, 6, rel), B = ends(rel.to, rel.from, rel.kind === 'relation' ? 6 : 12, rel);
      const list = [];
      const score = (a, b, poly, extra) => {
        let cost = (a.cost || 0) + (b.cost || 0) + poly.total * 0.05 + extra;
        if (poly.total < 150) cost += (150 - poly.total) * 3;
        poly.pts.forEach((q, j) => {
          if (q.x < M || q.x > D.w - M || q.y < M || q.y > D.h - M) cost += 500;
          // (nothing runs under the page's reserved label, ends included)
          if (pageLabel && overlap({x: q.x - 6, y: q.y - 6, w: 12, h: 12}, pageLabel.box, 6)) cost += 800;
          if (j < 3 || j > poly.pts.length - 4) return;
          partBoxes.forEach(({b: box}) => { if (q.x > box.x - 4 && q.x < box.x + box.w + 4 && q.y > box.y - 4 && q.y < box.y + box.h + 4) cost += 150; });
          if (onFlag(q) && rel.from !== 'marker' && rel.to !== 'marker') cost += 450;
          if (markerLabelBox && q.x > markerLabelBox.x - 4 && q.x < markerLabelBox.x + markerLabelBox.w + 4 && q.y > markerLabelBox.y - 4 && q.y < markerLabelBox.y + markerLabelBox.h + 4) cost += 60;
        });
        return cost;
      };
      for (const a of A) {
        for (const b of B) {
          const dist = Math.hypot(b.q.x - a.q.x, b.q.y - a.q.y);
          const k = clamp(dist * 0.42, 50, 260);
          const na = NORMAL[a.side], nb = NORMAL[b.side];
          // control arms never reach past the frame (a link along an edge stays inside it)
          const room = (q, nn) => (nn.x > 0 ? D.w - M - q.x : nn.x < 0 ? q.x - M : nn.y > 0 ? D.h - M - q.y : q.y - M) - 8;
          // (the copy arrives beside its slot: a long, level approach keeps its ¶ tab off the card)
          const kIn = rel.to === 'card' && (b.side === 'left' || b.side === 'right') ? Math.max(k, FLAG.w + 60) : k;
          const ka = clamp(Math.min(k, room(a.q, na)), 24, 260), kb = clamp(Math.min(kIn, room(b.q, nb)), 24, 260);
          const c1 = {x: a.q.x + na.x * ka, y: a.q.y + na.y * ka}, c2 = {x: b.q.x + nb.x * kb, y: b.q.y + nb.y * kb};
          const poly = cubicPolyline(a.q, c1, c2, b.q, 40);
          let back = 0;
          if (na.x * (b.q.x - a.q.x) + na.y * (b.q.y - a.q.y) < 0) back += 250;
          if (nb.x * (a.q.x - b.q.x) + nb.y * (a.q.y - b.q.y) < 0) back += 250;
          list.push({cost: score(a, b, poly, back), a, b, c1, c2, pts: poly.pts.filter((_, j) => j % 2 === 0)});
          if (present.has('marker') && rel.from !== 'marker' && rel.to !== 'marker') {
            for (const route of detours(a, b)) {
              const pts = Array.from({length: 41}, (_, j) => route.at(j / 40));
              list.push({cost: score(a, b, {pts, total: route.total}, 60), a, b, route, pts: pts.filter((_, j) => j % 2 === 0)});
            }
          }
        }
      }
      list.sort((x, y) => x.cost - y.cost);
      // (a detour is longer, so it is kept among the candidates even when shorter links cost less on
      // their own: only the combination search sees what the shorter ones cross)
      const keep = list.slice(0, rels.length > 5 ? 4 : 6);
      return [...keep, ...list.filter(x => x.route && !keep.includes(x)).slice(0, 24)];
    });
    // two links that run alongside each other (closer than ~16 units away from their ends) read as one
    const alongside = (x, y) => {
      let n = 0;
      const inner = P2 => P2.filter((_, j) => j >= 3 && j <= P2.length - 4);
      const Y = inner(y.pts);
      inner(x.pts).forEach(q => { if (Y.some(w => Math.hypot(q.x - w.x, q.y - w.y) < 16)) n++; });
      return n;
    };
    const pairCost = (x, y, rx, ry) => {
      let c = crossings(x.pts, y.pts) * 1000 + alongside(x, y) * 90;
      for (const [ex, idx] of [[x.a, rx.from], [x.b, rx.to]]) {
        for (const [ey, idy] of [[y.a, ry.from], [y.b, ry.to]]) {
          if (idx !== idy) continue;
          const dd = Math.hypot(ex.q.x - ey.q.x, ex.q.y - ey.q.y);
          // (two links never share a port: on the flag each one takes its own side)
          if (dd < 6) c += 2500;
          else if (dd < 40) c += idx === 'marker' ? 1500 : 400;
        }
      }
      return c;
    };
    const pc = rels.map((_, i) => rels.map((__, j) => (j < i ? cands[i].map(ci => cands[j].map(cj => pairCost(ci, cj, rels[i], rels[j]))) : null)));
    let bestCombo = null, bestTotal = Infinity;
    const pick = new Array(rels.length);
    const pickIdx = new Array(rels.length);
    const search = (i, acc) => {
      if (acc >= bestTotal) return;
      if (i === rels.length) { bestTotal = acc; bestCombo = pick.slice(); return; }
      cands[i].forEach((cand, ci) => {
        let add = cand.cost;
        for (let j = 0; j < i; j++) add += pc[i][j][ci][pickIdx[j]];
        pick[i] = cand;
        pickIdx[i] = ci;
        search(i + 1, acc + add);
      });
    };
    search(0, 0);
    const placedPts = [];
    const conns = rels.map((rel, i) => {
      const best = bestCombo[i];
      const c = best.route
        ? routeLink(ctx, {name: `link${i}`, poly: best.route, kind: rel.kind, color: kindColor(ctx, rel.kind)})
        : connector(ctx, {name: `link${i}`, from: best.a.q, to: best.b.q, c1: best.c1, c2: best.c2, kind: rel.kind, color: kindColor(ctx, rel.kind)});
      placedPts.push(Array.from({length: 41}, (_, j) => c.at(j / 40)));
      return {rel, c, sides: [best.a.side, best.b.side]};
    });
    const pathBoxes = conns.flatMap(({c}) => Array.from({length: 31}, (_, k) => c.at(k / 30)).map(q => ({x: q.x - 7, y: q.y - 7, w: 14, h: 14})));
    // where the rolled copy (roll + ¶ tab) passes: labels keep clear of it
    const carryLinks = conns.filter(({rel}) => [rel.from, rel.to].includes('marker') && ([rel.from, rel.to].includes('page') || [rel.from, rel.to].includes('card')));
    const sweep = carryLinks.flatMap(({c}) => Array.from({length: 25}, (_, k) => c.at(k / 24)).map(q => ({x: q.x - 32, y: q.y - strip.h / 2 - 6, w: 32 + FLAG.w + 6, h: strip.h + 12})));
    const inside = b => b.x >= 6 && b.y >= 6 && b.x + b.w <= D.w - 6 && b.y + b.h <= D.h - 6;

    // --- label chips for the page and the flag (the other parts carry their label on themselves):
    //     the flag's label on the side no connector uses; the page's label above or below its
    //     corners, wherever no connector runs
    const obstacles = partBoxes.map(x => x.b);
    const partLabels = [];
    if (ctx.show('key')) {
      if (labelOf('marker')) {
        const fb = flagBox;
        const mk = (x, y, anchor) => chip(ctx, labelOf('marker'), {x, y, anchor, maxWidth: 320, size: S.part, maxLines: 2, fill: th.card, stroke: color.flag, name: 'lab-marker'});
        const probe = mk(0, 0, 'middle').box;
        const side = P.marker.labelSide;
        const c = side === 'top' ? mk(fb.x + fb.w / 2, fb.y - 14 - probe.h, 'middle')
          : side === 'left' ? mk(fb.x - 16, fb.y + fb.h / 2 - probe.h / 2, 'end')
            : side === 'right' ? mk(fb.x + fb.w + 16, fb.y + fb.h / 2 - probe.h / 2, 'start') : mk(fb.x + fb.w / 2, fb.y + fb.h + 14, 'middle');
        partLabels.push(c);
      }
      const pb = parts.page.box;
      if (pageLabel) partLabels.push(pageLabel);
      else if (labelOf('page')) {
        const pmw = pageMaxW;
        const ph = chip(ctx, labelOf('page'), {x: 0, y: 0, maxWidth: pmw, size: S.part, maxLines: 2}).box.h + 8;
        const mk = (x, y, anchor) => chip(ctx, labelOf('page'), {x, y, anchor, maxWidth: pmw, size: S.part, maxLines: 2, fill: th.card, stroke: th.ink, name: 'lab-page'});
        const cands = [mk(pb.x + pb.w - 44, pb.y - ph, 'end'), mk(pb.x + 8, pb.y - ph, 'start'), mk(pb.x + pb.w / 2, pb.y - ph, 'middle'), mk(pb.x + pb.w - 44, pb.y + pb.h + 8, 'end'), mk(pb.x + 8, pb.y + pb.h + 8, 'start')];
        const score = c => (inside(c.box) ? 0 : 1e6) + [...obstacles.filter(o => o !== pb), ...partLabels.map(x => x.box)].filter(o => overlap(c.box, o, 6)).length * 1000
          + pathBoxes.filter(o => overlap(c.box, o, 4)).length * 300 + sweep.filter(o => overlap(c.box, o, 2)).length * 60;
        partLabels.push(cands.reduce((a, b) => (score(b) < score(a) ? b : a)));
      }
    }
    partLabels.forEach(c => obstacles.push(c.box));
    // (serialized for the test: no connector — line or end dot — runs under the page's label)
    const linkPts = conns.map(({c}) => [c.from, c.to, ...Array.from({length: 81}, (_, k) => c.at(k / 80))]);
    const clearOfLinks = box => !box || linkPts.every(pts => pts.every(q => !overlap({x: q.x - 5, y: q.y - 5, w: 10, h: 10}, box, 2)));
    const pageLab = partLabels.find(c => c.node.attrs.name === 'lab-page');
    const pageLabelClear = clearOfLinks(pageLab && pageLab.box);

    // --- the card's state tag: in the header, or on the row kept for it under the slot
    let stateTag = null;
    if (ctx.show('key')) {
      const cb = P.card;
      const y = tagInHeader ? cb.y + 10 : cb.y + card.slots[0].y + card.slots[0].h + 12;
      stateTag = tagInHeader ? statusTag(ctx, t.filed, {x: cb.x + cb.w - 18, y, anchor: 'end', size: S.tag, name: 'tag-filed', color: th.accent4, opacity: 0})
        : statusTag(ctx, t.filed, {x: cb.x + 26, y, anchor: 'start', size: S.tag, name: 'tag-filed', color: th.accent4, opacity: 0});
      obstacles.push(stateTag.box);
    }

    // --- relation captions beside their connector's middle (never on its line or its ends), clear of
    //     parts, part labels, other captions and every connector
    // captions are placed one after another; several orders are tried (shortest connector first, and
    // each connector first) and the set with the fewest overlaps is kept
    const placeLabel = (i, placed) => {
      const {rel, c} = conns[i];
      if (!ctx.show('all')) return null;
      const text = rel.label || p.relationLabels[rel.kind] || rel.kind;
      // two shapes of the chip: balanced two lines, or a narrower three-line one for tight spots
      // (the narrow shape never breaks a word: it is at least as wide as the longest word)
      const longestWord = Math.max(...String(text).split(/\s+/).map(w => ctx.measure(w, S.chip, 600, 'sans')));
      const narrow = Math.max(190, longestWord + S.chip * 1.2 + 8);
      const shapes = [{maxWidth: balancedMax(ctx, text, {size: S.chip, maxLines: 2, maxWidth: 300, weight: 600}), maxLines: 2}, {maxWidth: balancedMax(ctx, text, {size: S.chip, maxLines: 3, maxWidth: narrow, weight: 600}), maxLines: 3}];
      const own = pathBoxes.slice(i * 31, i * 31 + 31);
      const others = pathBoxes.filter(b => !own.includes(b));
      const bad = b => (inside(b) ? 0 : 1e6) + [...obstacles, ...placed].filter(o => overlap(b, o, 6)).length * 1000 + others.filter(o => overlap(b, o, 3)).length * 200 + own.filter(o => overlap(b, o, 3)).length * 200
        + sweep.filter(o => overlap(b, o, 2)).length * 40;
      let best = null, bestCost = Infinity;
      let make = null, probe = null;
      for (const [si, sh] of shapes.entries()) {
        make = (cx, cy2) => {
          const pr = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: sh.maxWidth, size: S.chip, maxLines: sh.maxLines, weight: 600});
          return chip(ctx, text, {x: cx, y: cy2 - pr.box.h / 2, anchor: 'middle', maxWidth: sh.maxWidth, size: S.chip, maxLines: sh.maxLines, fill: th.card, stroke: kindColor(ctx, rel.kind), name: `link${i}-lab`, weight: 600});
        };
        probe = make(0, 0).box;
        for (const extra of [0, 18, 40, 70]) {
          for (const tt of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82]) {
            const q = c.at(tt);
            const nx = -Math.sin(q.a), ny = Math.cos(q.a);
            // beside the line (perpendicular), or straight above / below / left / right of it
            const offs = [[nx, ny], [-nx, -ny], [0, 1], [0, -1], [1, 0], [-1, 0]];
            for (const [ox, oy] of offs) {
              const d = Math.abs(ox) * probe.w / 2 + Math.abs(oy) * probe.h / 2 + 12 + extra;
              const cand = make(q.x + ox * d, q.y + oy * d);
              const cost = bad(cand.box) + extra * 2 + Math.abs(tt - 0.5) * 40 + (Math.abs(ox) === 1 || Math.abs(oy) === 1 ? 6 : 0) + si * 30;
              if (cost < bestCost) { bestCost = cost; best = {chip: cand, q}; }
            }
          }
          if (bestCost < 200) break;
        }
        if (bestCost < 200) break;
      }
      // a long connector may carry its caption on its middle (the line runs behind the chip) when
      // no spot beside it is free; never over its two ends
      if (bestCost >= 200 && c.total > probe.w * 1.4) {
        for (const tt of [0.5, 0.42, 0.58]) {
          const q = c.at(tt);
          const cand = make(q.x, q.y);
          const b = cand.box;
          const ends = own.filter((o, j) => (j < 5 || j > 25) && overlap(b, o, 3)).length;
          const cost = (inside(b) ? 0 : 1e6) + [...obstacles, ...placed].filter(o => overlap(b, o, 6)).length * 1000 + others.filter(o => overlap(b, o, 3)).length * 200 + ends * 400 + 150;
          if (cost < bestCost) { bestCost = cost; best = {chip: cand, q, onLine: true}; }
        }
      }
      placed.push(best.chip.box);
      const bx = best.chip.box;
      const near = {x: clamp(best.q.x, bx.x, bx.x + bx.w), y: clamp(best.q.y, bx.y, bx.y + bx.h)};
      const leader = !best.onLine && Math.hypot(near.x - best.q.x, near.y - best.q.y) > 34 ? {x1: best.q.x, y1: best.q.y, x2: near.x, y2: near.y} : null;
      return {chip: best.chip, leader, color: kindColor(ctx, rel.kind), cost: bestCost};
    };
    const shortest = conns.map((x, i) => i).sort((i, j) => conns[i].c.total - conns[j].c.total);
    const orders = [shortest, ...shortest.slice(1).map(k => [k, ...shortest.filter(j => j !== k)])];
    let labelSet = null;
    for (const ord of orders) {
      const pl = [];
      const labs = new Array(conns.length).fill(null);
      let total = 0;
      ord.forEach(i => { labs[i] = placeLabel(i, pl); total += labs[i] ? labs[i].cost : 0; });
      if (!labelSet || total < labelSet.total - 1e-6) labelSet = {labs, total, placed: pl};
      if (total < 60 * conns.length) break;
    }
    const linkLabels = labelSet.labs;
    const placed = labelSet.placed;

    // --- tracer route along the connectors, in the supplied traversal order; it stops at points
    //     that carry no text (flag adhesive, page margin at the sentence, the copy's grip on the card)
    const order = p.traversalOrder.filter(id => present.has(id));
    const stopAt = (id, via) => (id === 'marker' ? flagStop
      : id === 'page' ? {x: via && via.x < P.page.x + P.page.w / 2 ? P.page.x + 10 : P.page.x + P.page.w - 10, y: sentenceY}
        : id === 'card' ? dock : via || center(id));
    const pts = [];
    const visits = [];
    const legs = [];
    const push = q => pts.push({x: q.x, y: q.y});
    order.forEach((id, i) => {
      if (i === 0) {
        const nxt = order[1];
        const link = nxt && conns.find(x => (x.rel.from === id && x.rel.to === nxt) || (x.rel.from === nxt && x.rel.to === id));
        const port = link ? (link.rel.from === id ? link.c.from : link.c.to) : null;
        push(id === 'query' || id === 'library' ? (port || center(id)) : stopAt(id, port));
        visits.push({id, idx: 0});
        return;
      }
      const prev = order[i - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      const start = pts.length - 1;
      let arrive;
      // on the flag the tracer keeps to its adhesive part and its lower edge (never over the ¶ tab)
      const yb = flagBox.y + flagBox.h + 4;
      const viaFlagEdge = q => q.x > flagStop.x + 20 && q.y > flagBox.y + 10;
      if (link) {
        const fwd = link.rel.from === prev;
        const port = fwd ? link.c.from : link.c.to;
        // leaving the card: first down off the copy (the tracer never crosses its text)
        if (prev === 'card') push({x: dock.x, y: dock.y + strip.h / 2 + 12});
        if (prev === 'marker' && viaFlagEdge(port)) { push({x: flagStop.x, y: yb}); push({x: clamp(port.x, flagBox.x, flagBox.x + flagBox.w), y: yb}); }
        push(port);
        for (let k = 1; k <= 30; k++) push(link.c.at(fwd ? k / 30 : 1 - k / 30));
        arrive = fwd ? link.c.to : link.c.from;
        if (id === 'marker' && viaFlagEdge(arrive)) { push({x: clamp(arrive.x, flagBox.x, flagBox.x + flagBox.w), y: yb}); push({x: flagStop.x, y: yb}); }
      } else {
        push(edgeAnchor(parts[prev].box, center(id), 6));
        arrive = edgeAnchor(parts[id].box, center(prev), 6);
        push(arrive);
      }
      push(stopAt(id, arrive));
      visits.push({id, idx: pts.length - 1});
      legs.push({from: prev, to: id, start, end: pts.length - 1});
    });
    const route = polyline(pts.length > 1 ? pts : [pts[0], pts[0]]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / total}));
    const legT = legs.map(l => ({...l, t0: cum[l.start] / total, t1: cum[l.end] / total}));
    // the copy (rolled, with its ¶ tab) rides with the tracer from the page visit to the card visit,
    // then unrolls into its slot
    const pageVisit = visitT.findIndex(v => v.id === 'page');
    const cardVisit = visitT.findIndex((v, i) => v.id === 'card' && i > pageVisit);
    const carry = pageVisit >= 0 && cardVisit > pageVisit ? {t0: visitT[pageVisit].t, t1: visitT[cardVisit].t} : null;

    // --- anchoring check (serialized for the test): every connector end lies on its part's edge
    const onEdge = (q, b, pad) => {
      const dxl = Math.abs(q.x - (b.x - pad)), dxr = Math.abs(q.x - (b.x + b.w + pad));
      const dyt = Math.abs(q.y - (b.y - pad)), dyb = Math.abs(q.y - (b.y + b.h + pad));
      const inX = q.x >= b.x - pad - 1 && q.x <= b.x + b.w + pad + 1;
      const inY = q.y >= b.y - pad - 1 && q.y <= b.y + b.h + pad + 1;
      return (inY && Math.min(dxl, dxr) < 1.5) || (inX && Math.min(dyt, dyb) < 1.5);
    };
    const anchored = conns.every(({rel, c}) => onEdge(c.from, parts[rel.from].box, 6) && onEdge(c.to, parts[rel.to].box, rel.kind === 'relation' ? 6 : 12));
    let crossCount = 0;
    for (let i = 0; i < placedPts.length; i++) for (let j = i + 1; j < placedPts.length; j++) crossCount += crossings(placedPts[i], placedPts[j]);
    const minLink = conns.length ? Math.min(...conns.map(x => x.c.total)) : 0;

    // --- legend (kinds actually drawn)
    const kinds = [...new Set(conns.map(x => x.rel.kind))];
    let legend = null;
    let legendBox = null;
    if (ctx.show('all') && kinds.length) {
      const rows = [];
      // legend shapes, tried in order: a column of one-line kinds, one row, then a narrower column
      // whose captions wrap to two balanced lines (for long captions in a tight box) — at the legend
      // size, then slightly smaller. It never lies on a part, a label or a caption; crossing a
      // connector is the last resort.
      const shapes = [];
      for (const size of [S.legend, S.legend * 0.9]) {
        const one = kinds.map(kind => ctx.fit(p.relationLabels[kind] || kind, {maxWidth: 440, size, minSize: size * 0.85, maxLines: 1, weight: 600}));
        const colH = one.reduce((a, f) => a + f.size + 16, -16);
        shapes.push({fits: one, dir: 'col', w: 70 + Math.max(...one.map(f => f.width)), h: colH, pen: size < S.legend ? 8 : 0});
        shapes.push({fits: one, dir: 'row', w: one.reduce((a, f) => a + 70 + f.width + 30, -30), h: size + 4, pen: 3 + (size < S.legend ? 8 : 0)});
        for (const mw of [260, 210]) {
          const two = kinds.map(kind => fitBalanced(ctx, p.relationLabels[kind] || kind, {maxWidth: mw, size, minSize: size * 0.9, maxLines: 2, weight: 600}));
          if (two.some(f => f.truncated)) continue;
          shapes.push({fits: two, dir: 'col', w: 70 + Math.max(...two.map(f => f.width)), h: two.reduce((a, f) => a + f.height + 12, -12), pen: 6 + (size < S.legend ? 8 : 0)});
        }
      }
      const hardB = [...obstacles, ...placed];
      const spots = [...P.legend, {x: M, y: M, anchor: 'start'}, {x: D.w - M, y: M, anchor: 'end'}, {x: D.w - M, y: D.h - M, anchor: 'end', bottom: true}, {x: M, y: D.h - M, anchor: 'start', bottom: true}];
      const cands = [];
      for (const sh of shapes) {
        const {w: lw, h: lh} = sh;
        for (const c of spots) cands.push({x: c.anchor === 'end' ? c.x - lw : c.x, y: c.bottom ? c.y - lh : c.y, w: lw, h: lh, sh});
        // any free spot: scan the frame
        for (let y = M; y + lh <= D.h - M; y += 10) for (let x = M; x + lw <= D.w - M; x += 20) cands.push({x, y, w: lw, h: lh, sh, scan: true});
      }
      const cost = b => (inside(b) ? 0 : 1e6) + hardB.filter(o => overlap(b, o, 10)).length * 1e4 + pathBoxes.filter(o => overlap(b, o, 8)).length * 100
        + sweep.filter(o => overlap(b, o, 2)).length * 10 + (b.scan ? 5 : 0) + b.sh.pen;
      const spot = cands.reduce((a, b) => (cost(b) < cost(a) ? b : a));
      let x = spot.x, y = spot.y;
      const {fits} = spot.sh;
      for (const [ki, kind] of kinds.entries()) {
        const f = fits[ki];
        const st = LINK_STYLES[kind];
        const col = kindColor(ctx, kind);
        const my = y + f.size * 0.55;
        rows.push(g(null,
          h('line', {x1: x + 4, x2: x + 54, y1: r(my), y2: r(my), stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}),
          st.arrow ? h('path', {d: `M${x + 58} ${r(my)}l-12 -7l3 7l-3 7z`, fill: col}) : h('circle', {cx: x + 54, cy: r(my), r: 4.5, fill: col}),
          f.lines.map((line, j) => h('text', {x: x + 70, y: r(y + f.size * 0.85 + j * f.lineHeight), 'font-size': r(f.size), 'font-weight': 600, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, line))));
        if (spot.sh.dir === 'row') x += 70 + f.width + 30;
        else y += (f.lines.length > 1 ? f.height + 12 : f.size + 16);
      }
      legend = g({name: 'legend', opacity: 0}, rows);
      legendBox = {x: spot.x, y: spot.y, w: spot.w, h: spot.h};
    }

    // --- the travelling copy: rolled, with its ¶ tab; it unrolls into the slot on the card
    const rollW = 26;
    const roll = g({name: 'm-roll'},
      h('path', {d: roundRectPath(-rollW, -strip.h / 2 - 3, rollW, strip.h + 6, 11), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${-rollW + 8} ${r(-strip.h / 2 + 6)}q-5 ${r(strip.h / 2 - 6)} 0 ${r(strip.h - 12)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.6}),
      h('rect', {x: -rollW + 12, y: -strip.h / 2 + 4, width: 8, height: strip.h - 8, rx: 4, fill: color.band, opacity: 0.45}));

    // cluster start for the "separate" beat: every part starts pulled 16% toward the centre
    const mid = {x: D.w / 2, y: D.h / 2};
    const place = {};
    IDS.forEach(id => {
      const c = center(id);
      place[id] = {from: {x: lerp(c.x, mid.x, 0.16) - c.x, y: lerp(c.y, mid.y, 0.16) - c.y}, c};
    });
    // (excerpt: the pinpointed sentence's text resolves once the flag's ¶ link has reached the page — or,
    // with no such link, at the end of the relate beat, before the tracer runs)
    const pinIdx = conns.findIndex(({rel}) => [rel.from, rel.to].includes('marker') && [rel.from, rel.to].includes('page'));
    const revealAt = pinIdx >= 0 ? W.relate[0] + ((pinIdx + 0.85) * (W.relate[1] - W.relate[0])) / conns.length : W.relate[1];
    return {parts, present, flagBox, strip, flag2, roll, rollW, dock, conns, linkLabels, partLabels, route, visitT, legT, carry, anchored, crossCount, minLink, kinds, legend, stateTag, place, order,
      panel, sheet, target, sentenceY, P, K: S.K, focus: p.focusElement, excerpt, revealAt, pageLabelClear};
  },
  build(ctx, L) {
    const partNode = id => {
      const part = L.parts[id];
      if (!L.present.has(id)) return null;
      const b = part.box;
      const origin = id === 'marker' ? T(part.center.x, part.center.y) : T(b.x, b.y);
      return g({name: `part-${id}`, opacity: 0}, g({transform: origin}, part.node));
    };
    const sh = L.strip.h;
    return g(null,
      L.conns.map(x => x.c.node),
      ['library', 'page', 'query', 'card'].map(partNode),
      L.partLabels.map(c => g({name: `${c.node.attrs.name}-g`, opacity: 0}, c.node)),
      L.linkLabels.map((lab, i) => lab && g({name: `link${i}-lg`, opacity: 0},
        lab.leader ? h('line', {...lab.leader, stroke: lab.color, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null,
        lab.chip.node)),
      L.stateTag && L.stateTag.node,
      g({name: 'm-copy', opacity: 0},
        h('defs', null, h('clipPath', {id: ctx.id('m-unroll')}, h('rect', {name: 'm-unroll-r', x: 0, y: r(-sh / 2 - 14), width: r(FLAG.w + 10), height: r(sh + 28)}))),
        g({'clip-path': ctx.ref('m-unroll')}, L.strip.node),
        g({name: 'm-roll-g'}, L.roll),
        L.flag2.node),
      partNode('marker'),
      tracer(ctx, 'tracer'),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const reduced = ctx.reduced;
    // separate: parts fade in and drift from the cluster to their places (staggered)
    const sep = ['library', 'page', 'query', 'marker', 'card'];
    const tr = ease.inOutSine(seg(u, ...W.trace));
    const at = id => {
      // tracer proximity to a visit of this part (0..1), for the focus enlargement
      let best = 0;
      L.visitT.forEach(v => {
        if (v.id !== id) return;
        const d = Math.abs(tr - v.t);
        best = Math.max(best, clamp(1 - d / 0.08));
      });
      return u >= W.trace[0] && u <= W.trace[1] + 0.001 ? best : 0;
    };
    let focusScale = 1;
    sep.forEach((id, i) => {
      if (!L.present.has(id)) return;
      const k = ease.outCubic(seg(u, W.separate[0] + i * 0.02, W.separate[1] - (4 - i) * 0.01));
      const pl = L.place[id];
      const dx = pl.from.x * (1 - k), dy = pl.from.y * (1 - k);
      const focus = L.focus === id ? at(id) : 0;
      // the small flag grows most; a large part only swells slightly (it never covers its neighbours)
      const amp = id === 'marker' ? (reduced ? 0.12 : 0.22) : (reduced ? 0.04 : 0.07);
      const s = 1 + amp * ease.inOutSine(focus);
      if (L.focus === id) focusScale = s;
      const c = pl.c;
      nodes[`part-${id}`] = {opacity: r(Math.min(1, k * 1.6), 3), transform: `${T(dx, dy)} translate(${r(c.x)} ${r(c.y)}) scale(${r(s, 4)}) translate(${r(-c.x)} ${r(-c.y)})`};
    });
    L.partLabels.forEach(c => { nodes[`${c.node.attrs.name}-g`] = {opacity: r(seg(u, 0.12, 0.18), 3)}; });
    // relate: connectors one by one in the supplied order
    const nRel = L.conns.length;
    const drawn = L.conns.map((_, i) => ease.inOutSine(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / nRel, W.relate[0] + ((i + 0.85) * (W.relate[1] - W.relate[0])) / nRel)));
    L.conns.forEach((x, i) => {
      Object.assign(nodes, x.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
      if (L.linkLabels[i]) nodes[`link${i}-lg`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45), 3)};
    });
    // trace
    const tracing = u >= W.trace[0] && u < W.trace[1];
    const q = L.route.at(tr);
    nodes.tracer = {opacity: tracing ? 1 : 0, transform: T(q.x, q.y)};
    const visited = L.visitT.filter(v => u >= W.trace[0] && tr >= v.t - 1e-6).map(v => v.id);
    // page: the pinpointed sentence is highlighted when the tracer reaches it (stays: origin)
    const pageV = L.visitT.find(v => v.id === 'page');
    const band = pageV ? ease.outCubic(clamp((tr - pageV.t) / 0.06)) * (u >= W.trace[0] ? 1 : 0) : 0;
    Object.assign(nodes, L.sheet.bandFrame(L.target, band, 0, 0));
    // excerpt: the pinpointed sentence's bars lift away, then its text fades in (never both at once)
    let targetText = 1;
    if (L.excerpt) {
      const out = ease.inOutSine(seg(u, L.revealAt, L.revealAt + 0.025));
      targetText = r(ease.outCubic(seg(u, L.revealAt + 0.025, L.revealAt + 0.055)), 3);
      nodes['m-page-ph'] = {opacity: r(1 - out, 3), transform: T(0, r(-6 * out, 2))};
      nodes[`m-page-s-${L.target}`] = {opacity: targetText};
    }
    // flag tab shows the ¶ once the page has been visited
    nodes['m-flag-pin-a'] = {opacity: band > 0.5 ? 1 : 0};
    // the copy leaves the page ROLLED (its ¶ tab at the tracer, nothing laid over the page text),
    // rides the connectors with the tracer and unrolls into its slot once it reaches the card
    let packet = null;
    let docked = false;
    let unroll = 0;
    nodes['m-strip'] = {opacity: 1};
    nodes['m-flag2-pin-a'] = {opacity: 1};
    const fullW = L.strip.grip.x;
    if (L.carry && u >= W.trace[0] && tr >= L.carry.t0) {
      const k = clamp((tr - L.carry.t0) / Math.max(1e-6, L.carry.t1 - L.carry.t0));
      docked = k >= 1;
      const pos = docked ? L.dock : L.route.at(tr);
      // unrolling: after the arrival (the card is the last visit: in the first beats of the gather)
      unroll = docked ? (L.carry.t1 >= 0.999 ? seg(u, W.trace[1], W.trace[1] + 0.05) : clamp((tr - L.carry.t1) / 0.08)) : 0;
      if (!docked) unroll = 0;
      const ev = ease.inOutCubic(unroll);
      const reveal = ev * (fullW + 10);
      const appear = clamp((k - 0.02) / 0.05);
      // passing through the flag the copy goes behind it (it never shows two ¶ tabs at once)
      const fb = L.flagBox, mx = fb.w * 0.2 + 20, my = fb.h * 0.2 + 20;
      const dx = Math.max(fb.x - mx - pos.x, 0, pos.x - (fb.x + fb.w + mx)), dy = Math.max(fb.y - my - pos.y, 0, pos.y - (fb.y + fb.h + my));
      const behind = docked ? 0 : 1 - clamp(Math.hypot(dx, dy) / 40);
      nodes['m-copy'] = {opacity: r(appear * (1 - behind), 3), transform: T(pos.x, pos.y)};
      nodes['m-unroll-r'] = {x: r(-reveal), width: r(reveal + FLAG.w + 10)};
      nodes['m-roll-g'] = {transform: T(-reveal, 0), opacity: r(1 - clamp((unroll - 0.85) / 0.15), 3)};
      nodes['m-strip-shadow'] = {transform: 'translate(3 4)'};
      packet = {x: r(pos.x), y: r(pos.y)};
    } else {
      nodes['m-copy'] = {opacity: 0, transform: T(L.dock.x, L.dock.y)};
      nodes['m-unroll-r'] = {x: 0, width: r(FLAG.w + 10)};
      nodes['m-roll-g'] = {transform: T(0, 0), opacity: 1};
      nodes['m-strip-shadow'] = {transform: 'translate(3 4)'};
    }
    // request row ticked once the flag has been sent; final state tag and legend
    nodes['m-q-check-0'] = {opacity: r(seg(u, W.state[0], W.state[1]), 3)};
    if (L.stateTag) nodes['tag-filed'] = {opacity: docked ? r(seg(u, W.state[0], W.state[1]), 3) : 0};
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(q.x), y: r(q.y)},
        tracerVisible: tracing,
        packet,
        docked,
        copyUnrolled: r(unroll, 3),
        relationsDrawn: drawn.map(d => r(d, 3)),
        relationKinds: L.conns.map(x => x.rel.kind),
        arrowheads: L.conns.filter(x => LINK_STYLES[x.rel.kind].arrow).length,
        anchoredEnds: L.anchored,
        connectorCrossings: L.crossCount,
        shortestConnector: r(L.minLink),
        visitOrder: L.visitT.map(v => v.id),
        visited,
        focusElement: L.focus,
        focusScale: r(focusScale, 3),
        highlight: r(band, 3),
        pinpoint: L.target + 1,
        excerpt: L.excerpt,
        targetText,
        pageLabelClear: L.pageLabelClear,
        allReached: true,
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
    slug: 'research-07-mechanism',
    title: 'Fact extraction — how a flag turns a request and a passage into a card entry',
    titleEs: 'Extracción de hechos — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Extracción de hechos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: library bay, loose source page, the user’s request box, the index flag (hub) and the fact card separate; only the supplied relationships are drawn (relation without arrowhead, communication dashed, sequence solid), routed without crossings and captioned beside their middle; a tracer follows the supplied order while the flag enlarges, the pinpointed sentence lights up and the rolled copy with its ¶ tab rides the connectors and unrolls into its slot on the card. Legend of connector kinds at the end.',
    tags: ['fact extraction', 'mechanism', 'relations', 'tracer', 'index flag', 'source page', 'fact card', 'library', 'pinpoint'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/extraccion-de-hechos.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
