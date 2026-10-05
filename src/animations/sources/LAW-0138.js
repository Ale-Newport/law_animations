/**
 * LAW-0138 — Ámbito material · mechanism
 *
 * Storyboard (exploded view of the subject filter; brief beats in brackets):
 *  [0.00–0.18] separate: the parts start packed together and move apart to
 *              their places — the editable-hierarchy stand, the book (source),
 *              the article (passage with its subject list), the collection of
 *              activity cards, the filter (rail, gates, key plates), the bins
 *              of listed subjects, the side bin and the magnifier.
 *  [0.18–0.43] only the supplied relationships are drawn, one by one, each
 *              anchored to the edges of its two parts and captioned by kind:
 *              plain relations have no arrow; sequences have one; causal
 *              links appear only when the author supplies them.
 *  [0.43–0.75] a tracer follows `traversalOrder` along those relationships;
 *              the focus part swells while the tracer is on it. On the way the
 *              marks of the article rows fly into the key plates (what links
 *              the passage to the filter) and, once the filter is keyed, the
 *              cards pass: each gate opens only for its own key; an unlisted
 *              tag goes on to the side bin.
 *  [0.75–1.00] the mechanism holds together: origin (book, article),
 *              transformation (filter) and the supplied states ("subject
 *              included" / "subject not classified") stay visible.
 * @module animations/sources/LAW-0138
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {catmullRom, polyline, roundRectPath} from '../../core/geometry.js';
import {mechanismFields, str} from '../../schemas/fields.js';
import {chip, LINK_STYLES} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {
  sourcesFields, activitiesField, CONTENT_EN, KIT_STRINGS, kitStrings, resolveScope, fitWords,
  articleSlip, openBook, closedBook, hierarchyRack, lupaArt, binArt, railArt, railGeo, keyPlate, markDisc,
  activityCard, cardLayout, CARD_W, arcRoute, chipStatus,
} from './kits/ambito-material.js';

const ID = 'LAW-0138';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const IDS = ['hierarchy', 'source', 'article', 'activities', 'filter', 'included', 'unclassified', 'magnifier'];

const sceneSchema = {
  ...sourcesFields,
  activities: activitiesField,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = str('Optional caption of this relationship (defaults to the caption of its kind)', 40);
sceneSchema.relationships.maxItems = 10;

const defaultParams = {
  ...CONTENT_EN,
  elements: [
    {id: 'hierarchy', label: 'Editable hierarchy'},
    {id: 'source', label: 'Book (source)'},
    {id: 'article', label: 'Article (passage)'},
    {id: 'activities', label: 'Collection of activities'},
    {id: 'filter', label: 'Subject filter'},
    {id: 'included', label: 'Bins of listed subjects'},
    {id: 'unclassified', label: 'Side bin'},
    {id: 'magnifier', label: 'Magnifier'},
  ],
  relationships: [
    {from: 'hierarchy', to: 'source', kind: 'relation', label: 'shelf as supplied'},
    {from: 'source', to: 'article', kind: 'relation', label: 'contains'},
    {from: 'article', to: 'filter', kind: 'sequence', label: 'keys the gates'},
    {from: 'activities', to: 'filter', kind: 'sequence', label: 'enter one by one'},
    {from: 'filter', to: 'included', kind: 'sequence', label: 'tag listed'},
    {from: 'filter', to: 'unclassified', kind: 'sequence', label: 'tag not listed'},
    {from: 'magnifier', to: 'unclassified', kind: 'relation', label: 'reads the tag'},
  ],
  focusElement: 'filter',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['hierarchy', 'source', 'article', 'filter', 'unclassified', 'magnifier'],
};

const STRINGS = {
  en: {legend: 'Line style = kind of relationship'},
  es: {legend: 'Estilo de línea = tipo de relación'},
};

/** Exploded geometry per shape (stage units). */
const MG = {
  landscape: {
    W: 1840, H: 870, fs: 1,
    hier: {x: 24, y: 36, w: 320, shelves: [156, 286]},
    source: {x: 420, y: 64, w: 400, h: 250},
    article: {x: 880, y: 70, k: 0.78},
    deck: {x: 40, y: 510, w: 220, bottom: 778},
    rail: {p0: {x: 420, y: 506}, p1: {x: 1370, y: 532}}, gates: [560, 1366],
    bins: {bottom: 778, drop: 118}, side: {x: 1470, y: 632, w: 206, bottom: 778},
    lupa: {x: 1700, y: 380, rot: -28}, cluster: {x: 900, y: 450},
    legend: {x: 1826, y: 24, anchor: 'end'},
    labels: {hierarchy: 'below', source: 'below', article: 'right', activities: 'above', filter: 'aboveEnd', included: 'below', unclassified: 'below', magnifier: 'above'},
  },
  portrait: {
    W: 1000, H: 1490, fs: 1,
    hier: {x: 24, y: 50, w: 340, shelves: [196, 352]},
    source: {x: 420, y: 60, w: 556, h: 280},
    article: {x: 300, y: 490, k: 0.9},
    deck: {x: 24, y: 870, w: 176, bottom: 1180},
    rail: {p0: {x: 316, y: 950}, p1: {x: 980, y: 974}}, gates: [400, 976],
    bins: {bottom: 1220, drop: 150}, side: {x: 770, y: 1262, w: 200, bottom: 1422},
    lupa: {x: 250, y: 1320, rot: 40}, cluster: {x: 500, y: 790},
    legend: {x: 976, y: 420, anchor: 'end'},
    labels: {hierarchy: 'below', source: 'below', article: 'left', activities: 'above', filter: 'aboveEnd', included: 'belowStart', unclassified: 'left', magnifier: 'above'},
  },
  square: {
    W: 1160, H: 975, fs: 1.08,
    hier: {x: 20, y: 44, w: 290, shelves: [170, 300]},
    source: {x: 380, y: 50, w: 330, h: 230},
    article: {x: 744, y: 60, k: 0.9},
    deck: {x: 20, y: 570, w: 200, bottom: 882},
    rail: {p0: {x: 300, y: 540}, p1: {x: 910, y: 558}}, gates: [390, 906],
    bins: {bottom: 882, drop: 112}, side: {x: 944, y: 710, w: 200, bottom: 882},
    lupa: {x: 1040, y: 540, rot: -20}, cluster: {x: 580, y: 500},
    legend: {x: 1140, y: 350, anchor: 'end'},
    labels: {hierarchy: 'belowStart', source: 'below', article: 'below', activities: 'above', filter: 'left', included: 'below', unclassified: 'above', magnifier: 'above'},
  },
};

const scene = {
  sizes: {landscape: [MG.landscape.W, MG.landscape.H], square: [MG.square.W, MG.square.H], portrait: [MG.portrait.W, MG.portrait.H]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const M = MG[shape];
    const s0 = Math.min(ctx.design.w / M.W, ctx.design.h / M.H);
    const ox = (ctx.design.w - M.W * s0) / 2, oy = (ctx.design.h - M.H * s0) / 2;
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const S = resolveScope(ctx, p);
    const fs = M.fs;
    const showKey = ctx.show('key');

    /* --- parts --------------------------------------------------------- */
    const parts = {};
    // hierarchy: a two-shelf stand with the two texts standing on their supplied shelves
    const nLv = Math.max(1, Math.min(2, p.hierarchy.levels.length));
    const shelves = M.hier.shelves.slice(0, nLv);
    const rackBottom = shelves[nLv - 1] + 34 + 14;
    const rack = hierarchyRack(ctx, {prefix: 'hier-rack', x: M.hier.x, y: M.hier.y, w: M.hier.w, bottom: rackBottom, shelves, levels: p.hierarchy.levels.slice(0, nLv), fs: 0.95});
    const place = i => clamp(Math.round(p.hierarchy.placement[i] ?? Math.min(i, nLv - 1)), 0, nLv - 1);
    const minis = p.sources.map((src, i) => {
      const sh = place(i);
      // below the plank above and below the level plate hanging from it
      const top = sh === 0 ? M.hier.y + 16 : Math.max(shelves[sh - 1] + 34 + 10, rack.plates[sh - 1] ? rack.plates[sh - 1].y + rack.plates[sh - 1].h + 8 : 0);
      const hh = Math.min(120, shelves[sh] - top);
      const same = p.sources.filter((_, k) => k < i && place(k) === sh).length;
      return closedBook(ctx, {prefix: `hier-b${i}`, x: M.hier.x + 26 + same * 140, y: shelves[sh], w: 132, h: hh, title: src.title, titleSize: 16, color: i === 0 ? '#2f4a6b' : '#6b3f4f'}).node;
    });
    parts.hierarchy = {node: g(null, rack.node, minis), box: {x: M.hier.x - 6, y: M.hier.y, w: M.hier.w + 12, h: rack.bottom - M.hier.y}};
    // source: the open book
    const book = openBook(ctx, {prefix: 'src-book', w: M.source.w, h: M.source.h, source: p.sources[0], seedKey: 'am-book'});
    parts.source = {node: g({transform: T(M.source.x, M.source.y)}, book.node), box: {x: M.source.x, y: M.source.y, w: M.source.w, h: M.source.h + 12}};
    // article (slip) + a faint copy of the slip on the book page (where it comes from)
    const art = articleSlip(ctx, {prefix: 'art', passage: S.passage, listed: S.listed});
    const ghost = articleSlip(ctx, {prefix: 'art-ghost', passage: S.passage, listed: S.listed, noText: true});
    // the article keeps clear of the band above the rail (long headings make it taller)
    const CL0 = cardLayout(ctx, S.acts);
    const railTop = Math.min(M.rail.p0.y, M.rail.p1.y) - CL0.H * 0.8 - 70;
    const kA = M.article.y + (art.H + art.tab.h) * M.article.k > railTop && M.article.y < M.rail.p0.y
      ? Math.max(0.55, Math.min(M.article.k, (railTop - M.article.y) / (art.H + art.tab.h)))
      : M.article.k;
    parts.article = {node: g({transform: T(M.article.x, M.article.y, 0, kA)}, art.node), box: {x: M.article.x, y: M.article.y - art.tab.h * kA, w: art.W * kA, h: (art.H + art.tab.h) * kA}};
    const ghostNode = g({transform: T(M.source.x + book.slot.x, M.source.y + book.slot.y, 0, book.slot.k), opacity: 0.55}, ghost.node);
    // filter: rail + gates + key plates
    const RG = railGeo(M.rail.p0, M.rail.p1);
    const nG = S.listed.length;
    const pitch = Math.abs(M.gates[1] - M.gates[0]) / nG;
    const gates = S.listed.map((_, j) => ({j, cx: M.gates[0] + pitch * (j + 0.5), w: pitch - 14}));
    const CL = cardLayout(ctx, S.acts);
    const deckInner = M.deck.w - 24;
    const s = Math.min(0.8, (pitch - 34) / CARD_W, (M.side.w - 22) / CARD_W, deckInner / CARD_W);
    const cw = CARD_W * s, chh = CL.H * s;
    const plateH = 46;
    const nameFits = S.listed.map(ls => (showKey ? fitWords(ctx, ls.name, {maxWidth: pitch - 14 - 8 - 54, size: 19 * fs, minSize: 13, maxLines: 2, weight: 700}) : null));
    const pH = Math.max(plateH, ...nameFits.filter(Boolean).map(f => f.height + 14));
    const plates = gates.map((gt, j) => keyPlate(ctx, {name: `plate${j}`, x: gt.cx - (pitch - 14) / 2 + 4, y: RG.y(gt.cx) + 34, w: pitch - 22, h: pH, fit: nameFits[j], color: S.listed[j].color}));
    const rail = railArt(ctx, {prefix: 'rail', geo: RG, gates});
    // the filter includes the band above the rail where the cards travel
    const fy0 = Math.min(RG.p0.y, RG.p1.y) - CL.H * s - 10, fy1 = Math.max(...plates.map(q => q.box.y + q.box.h));
    // the filter is drawn as one object: a glazed housing around the rail, its gates and key plates
    const fbox = {x: Math.min(RG.p0.x, RG.p1.x) - 12, y: fy0, w: Math.abs(RG.p1.x - RG.p0.x) + 24, h: fy1 - fy0 + 10};
    const bolt = (x, y) => h('circle', {cx: r(x), cy: r(y), r: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.6});
    const housing = g({name: 'filter-housing'},
      h('path', {d: roundRectPath(fbox.x + 5, fbox.y + 7, fbox.w, fbox.h, 16), fill: th.shadow}),
      h('path', {d: roundRectPath(fbox.x, fbox.y, fbox.w, fbox.h, 16), fill: '#e3ecf1', stroke: th.ink, 'stroke-width': 2.6}),
      h('path', {d: roundRectPath(fbox.x + 10, fbox.y + 10, fbox.w - 20, fbox.h - 20, 10), fill: 'none', stroke: '#b9cbd6', 'stroke-width': 2, 'stroke-dasharray': '10 7'}),
      bolt(fbox.x + 14, fbox.y + 14), bolt(fbox.x + fbox.w - 14, fbox.y + 14), bolt(fbox.x + 14, fbox.y + fbox.h - 14), bolt(fbox.x + fbox.w - 14, fbox.y + fbox.h - 14));
    parts.filter = {node: g(null, housing, rail.leaves, rail.stat), box: fbox};
    // bins of listed subjects
    const binTop = gt => RG.y(gt.cx) + M.bins.drop;
    const bins = gates.map((gt, j) => {
      const bw = Math.min(pitch - 12, cw + 34);
      return binArt(ctx, {prefix: `bin${j}`, x: gt.cx - bw / 2, y: binTop(gt), w: bw, h: M.bins.bottom - binTop(gt)});
    });
    const bx0 = Math.min(...bins.map(b => b.box.x)), bx1 = Math.max(...bins.map(b => b.box.x + b.box.w));
    const by0 = Math.min(...bins.map(b => b.box.y));
    parts.included = {node: g(null, bins.map(b => b.back)), front: g(null, bins.map(b => b.front)), box: {x: bx0, y: by0, w: bx1 - bx0, h: M.bins.bottom + 10 - by0}};
    const side = binArt(ctx, {prefix: 'side', x: M.side.x, y: M.side.y, w: M.side.w, h: M.side.bottom - M.side.y, side: true});
    parts.unclassified = {node: g(null, side.back), front: side.front, box: {...side.box, h: side.box.h + 10}};
    // deck (collection in a clear tray)
    const deck = binArt(ctx, {prefix: 'deck', x: M.deck.x, y: M.deck.y, w: M.deck.w, h: M.deck.bottom - M.deck.y});
    parts.activities = {node: g(null, deck.back), front: deck.front, box: {...deck.box, h: deck.box.h + 10}};
    // magnifier (static, reading the side bin)
    const lp = lupaArt(ctx, {prefix: 'mlupa', R: 50, L: 96});
    // its box covers the lens and the handle (labels keep off both)
    const la = (M.lupa.rot * Math.PI) / 180, hl = lp.R + 12 + lp.L;
    const hEnd = {x: M.lupa.x - Math.sin(la) * hl, y: M.lupa.y + Math.cos(la) * hl};
    const mx0 = Math.min(M.lupa.x - 58, hEnd.x - 14), mx1 = Math.max(M.lupa.x + 58, hEnd.x + 14);
    const my0 = Math.min(M.lupa.y - 58, hEnd.y - 14), my1 = Math.max(M.lupa.y + 58, hEnd.y + 14);
    parts.magnifier = {node: g({transform: T(M.lupa.x, M.lupa.y, M.lupa.rot)}, lp.back, lp.front), circle: {x: M.lupa.x, y: M.lupa.y, r: lp.R + 4}, box: {x: mx0, y: my0, w: mx1 - mx0, h: my1 - my0}};

    // corridor of the cards between the tray and the upper end of the rail
    const liftX0 = M.deck.x + M.deck.w - 10, liftY0 = Math.min(RG.p0.y - CL.H * s - 10, M.deck.y);
    const liftBox = {x: liftX0, y: liftY0, w: Math.max(RG.p0.x, M.deck.x + M.deck.w + CL.W * s + 24) - liftX0, h: M.deck.bottom - liftY0};
    /* --- labels of the parts -------------------------------------------- */
    const labelOf = id => (p.elements.find(e => e.id === id) || {}).label;
    const partLabels = {};
    const labelModes = {};
    if (showKey) {
      const placedL = [];
      const hit = (a, b, pad = 4) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
      for (const id of IDS) {
        const text = labelOf(id);
        if (!text) continue;
        const b = parts[id].box;
        const mw = Math.max(240, Math.min(440, b.w + 80));
        // full size first; a long name that finds no clean spot is set smaller (never below ~18 px at 1080p)
        let size = 23 * fs, hh = 0;
        const spot = mode => {
          if (mode === 'below') return {x: b.x + b.w / 2, y: b.y + b.h + 8, anchor: 'middle'};
          if (mode === 'belowStart') return {x: b.x, y: b.y + b.h + 8, anchor: 'start'};
          if (mode === 'above') return {x: b.x + b.w / 2, y: b.y - hh - 8, anchor: 'middle'};
          if (mode === 'aboveEnd') return {x: b.x + b.w, y: b.y - hh - 6, anchor: 'end'};
          if (mode === 'aboveStart') return {x: b.x + 10, y: b.y - hh - 6, anchor: 'start'};
          if (mode === 'right') return {x: b.x + b.w + 14, y: b.y + b.h / 2 - hh / 2, anchor: 'start'};
          return {x: b.x - 14, y: b.y + b.h / 2 - hh / 2, anchor: 'end'};
        };
        const modes = [M.labels[id], 'below', 'above', 'right', 'left', 'aboveEnd', 'aboveStart', 'belowStart'];
        let c = null;
        let chosen = null;
        let best = Infinity;
        const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        for (const sz of [23 * fs, 20 * fs]) {
        if (best === 0) break;
        size = sz;
        hh = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size, minSize: 18, maxLines: 2, fill: th.card}).box.h;
        for (const mode of modes) {
          const cand = chip(ctx, text, {...spot(mode), maxWidth: mw, size, minSize: 18, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: `lab-${id}`});
          const q = cand.box;
          const inside = q.x >= 4 && q.y >= 4 && q.x + q.w <= M.W - 4 && q.y + q.h <= M.H - 4;
          if (!inside) continue;
          // other labels weigh more than parts; the tray corridor is avoided too
          const cost = placedL.reduce((acc, o) => acc + 3 * area(q, o), 0) + area(q, liftBox) + Object.entries(parts).reduce((acc, [k, pt]) => acc + (k !== id ? area(q, pt.box) : 0), 0);
          if (cost < best) { best = cost; c = cand; chosen = cost === 0 ? mode : `${mode}~`; }
          if (cost === 0) break;
        }
        }
        if (best > 0) {
          // no clean spot beside the part: the nearest clean spot around it, tied back by a short leader
          const gap = q => Math.hypot(Math.max(b.x - (q.x + q.w), 0, q.x - (b.x + b.w)), Math.max(b.y - (q.y + q.h), 0, q.y - (b.y + b.h)));
          let bestG = Infinity, got = null;
          for (let gy = b.y - 240; gy <= b.y + b.h + 240; gy += 16) {
            for (let gx = b.x - 300; gx <= b.x + b.w + 300; gx += 20) {
              const cand = chip(ctx, text, {x: gx, y: gy, anchor: 'start', maxWidth: mw, size, minSize: 18, maxLines: 2, fill: th.card, stroke: th.inkSoft});
              const q = cand.box;
              if (q.x < 4 || q.y < 4 || q.x + q.w > M.W - 4 || q.y + q.h > M.H - 4) continue;
              const d = gap(q);
              if (d >= bestG) continue;
              const cost = placedL.reduce((acc, o) => acc + area(q, o), 0) + area(q, liftBox) + Object.values(parts).reduce((acc, pt) => acc + area(q, pt.box), 0);
              if (cost === 0) { bestG = d; got = {gx, gy}; }
            }
          }
          if (got) {
            const cand = chip(ctx, text, {x: got.gx, y: got.gy, anchor: 'start', maxWidth: mw, size, minSize: 18, maxLines: 2, fill: th.card, stroke: th.inkSoft});
            const q = cand.box;
            const qc = {x: q.x + q.w / 2, y: q.y + q.h / 2};
            const e = {x: Math.max(b.x, Math.min(qc.x, b.x + b.w)), y: Math.max(b.y, Math.min(qc.y, b.y + b.h))};
            const from = {x: Math.max(q.x, Math.min(e.x, q.x + q.w)), y: Math.max(q.y, Math.min(e.y, q.y + q.h))};
            c = {box: q, node: g({name: `lab-${id}`}, bestG > 10 ? h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(e.x)} ${r(e.y)}`, stroke: th.inkSoft, 'stroke-width': 2, fill: 'none'}) : null, bestG > 10 ? h('circle', {cx: r(e.x), cy: r(e.y), r: 4, fill: th.inkSoft}) : null, cand.node)};
            chosen = 'nearby';
          }
        }
        if (!c) { c = chip(ctx, text, {...spot('below'), maxWidth: mw, size, minSize: 18, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: `lab-${id}`}); chosen = 'below!'; }
        labelModes[id] = chosen;
        placedL.push(c.box);
        partLabels[id] = c;
      }
    }
    /* --- relationships ---------------------------------------------------- */
    const elements = {};
    for (const id of IDS) elements[id] = parts[id].circle ? {circle: parts[id].circle} : {box: parts[id].box};
    const labelBoxes = Object.values(partLabels).map(c => c.box);
    const rels = p.relationships.filter(rl => rl.from !== rl.to);
    let stIn = null, stUn = null;
    if (showKey) {
      const at = (id, fb) => {
        const c = partLabels[id];
        if (!c) return fb;
        const pb = parts[id].box;
        const cx = c.box.x + c.box.w / 2;
        const y = c.box.y + c.box.h / 2 - 18 * fs;
        if (c.box.x + c.box.w <= pb.x + 2) return {x: c.box.x + c.box.w, anchor: 'end', y, maxWidth: 330};
        if (c.box.x >= pb.x + pb.w - 2) return {x: c.box.x, anchor: 'start', y, maxWidth: 330};
        return {x: cx, y, maxWidth: Math.max(c.box.w + 80, 260)};
      };
      if (S.acts.some(a => a.state === 'included')) stIn = chipStatus(ctx, t.included, {...at('included', {x: (bx0 + bx1) / 2, y: M.bins.bottom + 16, maxWidth: bx1 - bx0}), size: 20 * fs, name: 'st-in'});
      if (S.acts.some(a => a.state === 'unclassified')) stUn = chipStatus(ctx, t.unclassified, {...at('unclassified', {x: side.box.x + side.box.w / 2, y: M.side.bottom + 16, maxWidth: 330}), size: 20 * fs, dashed: true, name: 'st-un'});
      // keep inside the stage
      for (const st of [stIn, stUn]) if (st && (st.box.x < 4 || st.box.x + st.box.w > M.W - 4)) void 0;
    }

    // connectors from the shared graph helper; their captions are placed here
    // (scanning along each connector on both sides) so they stay clear of parts,
    // part names and each other
    const noLabelCtx = {...ctx, show: level => (level === 'all' ? false : ctx.show(level))};
    const graph = relationGraph(noLabelCtx, {
      name: 'rel', elements, relationships: rels, relationLabels: p.relationLabels, chipSize: 20 * fs, chipMax: 230,
      bend: (rl, i) => (i % 2 ? 0.1 : -0.1),
    });
    const relLabels = [];
    if (ctx.show('all')) {
      const partBoxes = Object.values(parts).map(q => q.box);
      const obst = [...partBoxes, ...labelBoxes, liftBox, ...[stIn, stUn].filter(Boolean).map(q => q.box)];
      const placedR = [];
      const hitR = (a, b, pad = 5) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
      graph.conns.forEach((x, i) => {
        const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
        const col = kindColor(ctx, x.rel.kind);
        const dx = x.c.to.x - x.c.from.x, dy = x.c.to.y - x.c.from.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const make = (q, size, lines) => chip(ctx, text, {x: q.x, y: q.y - size * 0.95, anchor: 'middle', maxWidth: 260, size, minSize: size * 0.85, maxLines: lines, fill: th.card, stroke: col, name: `rl${i}`, weight: 600});
        const inside = b => b.x >= 6 && b.y >= 6 && b.x + b.w <= M.W - 6 && b.y + b.h <= M.H - 6;
        const clear = b => inside(b) && !obst.some(o => hitR(b, o)) && !placedR.some(o => hitR(b, o));
        let pick = null;
        // a dashed leader from the connector to a displaced caption must not cross another part
        const leaderClear = (m, b) => {
          const c = {x: b.x + b.w / 2, y: b.y + b.h / 2};
          const L = Math.hypot(c.x - m.x, c.y - m.y);
          for (let k = 14; k < L; k += 8) {
            const q = {x: m.x + ((c.x - m.x) * k) / L, y: m.y + ((c.y - m.y) * k) / L};
            if (q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h) break;
            if (partBoxes.some(o => q.x > o.x + 2 && q.x < o.x + o.w - 2 && q.y > o.y + 2 && q.y < o.y + o.h - 2)) return false;
          }
          return true;
        };
        const near = (size, lines) => {
          for (const off of [0, 30, -30, 55, -55, 85, -85, 120, -120]) {
            for (const tt of [0.5, 0.38, 0.62, 0.28, 0.72]) {
              const m = x.c.at(tt);
              const cand = make({x: m.x + nx * off, y: m.y + ny * off}, size, lines);
              if (clear(cand.box) && (Math.abs(off) < 40 || leaderClear(m, cand.box))) return {cand, m};
            }
          }
          return null;
        };
        const around = (size, lines) => {
          let bestD = Infinity, got = null;
          for (const tt of [0.5, 0.35, 0.65, 0.2, 0.8]) {
            const m = x.c.at(tt);
            for (let dy = -300; dy <= 300; dy += 20) {
              for (let dx = -360; dx <= 360; dx += 24) {
                const d = Math.hypot(dx, dy);
                if (d >= bestD) continue;
                const cand = make({x: m.x + dx, y: m.y + dy}, size, lines);
                if (clear(cand.box) && leaderClear(m, cand.box)) { bestD = d; got = {cand, m}; }
              }
            }
          }
          return got;
        };
        // full size beside the connector, then full size nearby (with a leader), then smaller
        for (const [size, lines] of [[22 * fs, 2], [19 * fs, 2], [17 * fs, 3]]) {
          pick = near(size, lines) || around(size, lines);
          if (pick) break;
        }
        if (!pick) {
          const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
          let best = Infinity;
          for (const off of [0, 30, -30, 55, -55, 85, -85, 120, -120]) {
            for (const tt of [0.5, 0.38, 0.62, 0.28, 0.72]) {
              const m = x.c.at(tt);
              const cand = make({x: m.x + nx * off, y: m.y + ny * off}, 16 * fs, 2);
              if (!inside(cand.box)) continue;
              const cost = obst.reduce((acc, b) => acc + area(cand.box, b), 0) + placedR.reduce((acc, b) => acc + 4 * area(cand.box, b), 0);
              if (cost < best) { best = cost; pick = {cand, m}; }
            }
          }
          if (!pick) { const m = x.c.at(0.5); pick = {cand: make(m, 16 * fs, 2), m}; }
        }
        placedR.push(pick.cand.box);
        const cb = pick.cand.box;
        const far = Math.hypot(cb.x + cb.w / 2 - pick.m.x, cb.y + cb.h / 2 - pick.m.y) > cb.h * 0.9;
        relLabels.push({i, node: g({name: `rlg${i}`, opacity: 0}, far ? h('line', {x1: r(pick.m.x), y1: r(pick.m.y), x2: r(cb.x + cb.w / 2), y2: r(cb.y + cb.h / 2), stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null, pick.cand.node), box: cb});
      });
    }
    const order = p.traversalOrder.filter((id, i, a) => IDS.includes(id) && (i === 0 || a[i - 1] !== id));
    const route = graph.route(order);
    const tracer = graph.tracerNode('tracer');
    // connectors land on their parts: both ends within the anchor padding of the box/circle edge
    const edgeDist = (e, q) => {
      if (e.circle) return Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r);
      const b = e.box;
      const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
      return Math.hypot(dx, dy);
    };
    const landed = graph.conns.every(c => edgeDist(elements[c.rel.from], c.c.from) <= 8 * Math.SQRT2 + 0.6 && edgeDist(elements[c.rel.to], c.c.to) <= 14 * Math.SQRT2 + 0.6);

    /* --- legend ------------------------------------------------------------ */
    let legend = null;
    if (ctx.show('all')) {
      const kinds = [...new Set(rels.map(rl => rl.kind))];
      const size = 21 * fs;
      const rows = kinds.map(k => ({k, fit: fitWords(ctx, p.relationLabels[k] || k, {maxWidth: 260, size, minSize: 16, maxLines: 1, weight: 600})}));
      const rowH = size * 1.6;
      const w = 76 + Math.max(...rows.map(q => q.fit.width));
      const x0 = M.legend.anchor === 'end' ? M.legend.x - w : M.legend.x;
      const lbox = {x: x0 - 6, y: M.legend.y - 6, w: w + 12, h: rowH * rows.length + 12};
      const hitL = b => lbox.x < b.x + b.w && lbox.x + lbox.w > b.x && lbox.y < b.y + b.h && lbox.y + lbox.h > b.y;
      const blocked = [...Object.values(parts).map(q => q.box), ...labelBoxes, ...relLabels.map(q => q.box)].some(hitL);
      if (!blocked) legend = {node: g({name: 'legend', opacity: 0}, rows.map((q, i) => {
        const y = M.legend.y + i * rowH + rowH / 2;
        const st = LINK_STYLES[q.k];
        const col = kindColor(ctx, q.k);
        return g(null,
          h('path', {d: `M${x0} ${r(y)}H${x0 + 54}`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || null, fill: 'none'}),
          st.arrow ? h('path', {d: `M${x0 + 58} ${r(y)}l-12 -6.5l3 6.5l-3 6.5Z`, fill: col}) : h('circle', {cx: x0 + 54, cy: r(y), r: st.width * 1.6, fill: col}),
          h('text', {x: x0 + 70, y: r(y + q.fit.size * 0.35), 'font-size': r(q.fit.size), 'font-weight': 600, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: th.fgSoft}, q.fit.lines[0]));
      })), box: lbox};
    }

    /* --- cards --------------------------------------------------------------- */
    const cards = S.acts.map((a, i) => activityCard(ctx, {prefix: `card${i}`, act: a, CL, fit: CL.fits[i]}));
    const offset = Math.min(CL.stripH * s + 4, (M.deck.bottom - M.deck.y - 16 - chh) / Math.max(1, S.acts.length - 1));
    const deckSlot = k => ({x: M.deck.x + M.deck.w / 2, y: M.deck.bottom - 12 - chh / 2 - k * offset, rot: 0});
    const aRad = Math.atan(RG.slope);
    const onRail = x => ({x: x + Math.sin(aRad) * chh / 2, y: RG.y(x) - Math.cos(aRad) * chh / 2, rot: RG.angle});
    const startX = RG.p0.x + cw / 2 + 16;
    // out of the tray through its side, then up onto the upper end of the rail
    const d0 = deckSlot(0), railIn = onRail(startX);
    const outX = M.deck.x + M.deck.w + cw / 2 + 8;
    const liftRoute = polyline(catmullRom([d0, {x: outX, y: d0.y}, {x: outX + 10, y: Math.min(d0.y - 40, railIn.y + 40)}, railIn], 14));
    const counts = {};
    const plans = S.acts.map(a => {
      const c = a.listedIdx >= 0 ? a.listedIdx : 'side';
      const k = counts[c] || 0;
      counts[c] = k + 1;
      const b = c === 'side' ? side.box : bins[c].box;
      const rest = {x: b.x + b.w / 2 + (k % 2 ? 12 : k ? -12 : 0) * s, y: b.y + b.h - 12 - chh / 2 - k * 9 * s, rot: k % 2 ? 3 : k ? -3 : -1};
      const targetX = c === 'side' ? RG.p1.x + 12 : gates[c].cx;
      return {container: c, stack: k, rest, targetX, dist: Math.abs(targetX - startX)};
    });
    const keys = S.listed.map((ls, j) => markDisc(ctx, {shape: ls.mark, color: ls.color, R: 16, name: `key${j}`, opacity: 0}));
    const keyRoutes = S.listed.map((ls, j) => arcRoute({x: M.article.x + art.rows[j].mark.x * kA, y: M.article.y + art.rows[j].mark.y * kA}, plates[j].socket, 40));

    /* --- states (hold) ----------------------------------------------------- */
    /* --- timeline ----------------------------------------------------------- */
    const tr = {a: 0.44, b: 0.72};
    const visitT = {};
    route.visits.forEach(v => { if (visitT[v.id] === undefined) visitT[v.id] = lerp(tr.a, tr.b, v.t); });
    const focus = p.focusElement;
    const fT = visitT[focus];
    const focusWin = fT !== undefined ? [Math.max(tr.a, fT - 0.035), fT + 0.06] : null;
    const tArt = visitT.article ?? 0.47, tFil = visitT.filter ?? 0.56;
    let keyA = Math.min(tArt, tFil - 0.06);
    if (focus === 'article' && focusWin) keyA = Math.max(keyA, focusWin[1]);
    // keys land before the filter swells (they then swell with it)
    const keyB = Math.max(keyA + 0.06, focus === 'filter' && focusWin ? Math.min(tFil, focusWin[0]) : tFil);
    let cardsT0 = Math.max(tFil + 0.015, keyB + 0.01);
    if ((focus === 'filter' || focus === 'activities' || focus === 'included' || focus === 'unclassified') && focusWin) cardsT0 = Math.max(cardsT0, focusWin[1]);
    const n = S.acts.length;
    const maxD = Math.max(1, ...plans.map(pl => pl.dist));
    const span = 0.84 - cardsT0;
    const stagger = n > 1 ? Math.min(0.045, (span - 0.1) / (n - 1)) : 0;
    const sched = plans.map((pl, i) => {
      const st = cardsT0 + i * stagger;
      const lift = st + 0.028;
      const slideEnd = lift + Math.max(0.018, (0.05 * pl.dist) / maxD);
      return {st, lift, slideEnd, fallEnd: slideEnd + 0.024};
    });

    return {liftRoute, relLabels, labelModes, M, s0, ox, oy, S, parts, partLabels, graph, route, order, tracer, landed, legend, cards, plans, sched, keys, keyRoutes, plates, gates, RG, onRail, deckSlot, startX, stIn, stUn, visitT, focusWin, keyA, keyB, cw, chh, s, CL, ghostNode, rels, pH};
  },
  build(ctx, L) {
    const part = id => g({name: `el-${id}`}, L.parts[id].node);
    return g({transform: T(L.ox, L.oy, 0, L.s0)},
      g({name: 'ghost'}, L.ghostNode),
      L.graph.node,
      part('hierarchy'), part('source'), part('magnifier'),
      part('included'), part('unclassified'), part('activities'), part('filter'),
      g({name: 'cards'}, L.cards.slice().reverse().map(c => c.node)),
      g({name: 'front-included'}, L.parts.included.front),
      g({name: 'front-unclassified'}, L.parts.unclassified.front),
      g({name: 'front-activities'}, L.parts.activities.front),
      g({name: 'plates'}, L.plates.map(q => q.node)),
      part('article'),
      g({name: 'keys'}, L.keys),
      L.relLabels.map(q => q.node),
      Object.values(L.partLabels).map(c => c.node),
      L.legend && L.legend.node,
      L.stIn && g({name: 'st-in-g', opacity: 0}, L.stIn.node),
      L.stUn && g({name: 'st-un-g', opacity: 0}, L.stUn.node),
      L.tracer,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const M = L.M;
    /* separate: parts start packed around the cluster point and move apart */
    const explode = {};
    // groups drawn outside a part's own group move and scale with that part
    const extra = {filter: ['plates', 'keys'], included: ['front-included'], unclassified: ['front-unclassified'], activities: ['front-activities', 'cards'], source: ['ghost']};
    IDS.forEach((id, i) => {
      const e = ease.inOutCubic(seg(u, 0.01 + i * 0.012, 0.1 + i * 0.012));
      explode[id] = e;
      const b = L.parts[id].box;
      const c = {x: b.x + b.w / 2, y: b.y + b.h / 2};
      const off = {x: (M.cluster.x - c.x) * 0.7 * (1 - e), y: (M.cluster.y - c.y) * 0.7 * (1 - e)};
      let k = lerp(0.55, 1, e);
      if (id === ctx.params.focusElement && L.focusWin) k *= 1 + 0.08 * Math.sin(Math.PI * seg(u, L.focusWin[0], L.focusWin[1]));
      const tf = `translate(${r(c.x + off.x)} ${r(c.y + off.y)}) scale(${r(k, 4)}) translate(${r(-c.x)} ${r(-c.y)})`;
      const op = r(clamp(e * 3), 3);
      nodes[`el-${id}`] = {transform: tf, opacity: op};
      (extra[id] || []).forEach(name => { nodes[name] = {transform: tf, opacity: name === 'keys' ? 1 : op}; });
    });
    const ex = explode;
    const allOut = Math.min(...Object.values(ex));
    Object.keys(L.partLabels).forEach(id => { nodes[`lab-${id}`] = {opacity: r(seg(u, 0.12, 0.18) * (ex[id] >= 1 ? 1 : 0), 3)}; });

    /* relate: connectors one after another */
    const nR = L.rels.length;
    const relP = i => ease.inOutSine(seg(u, 0.19 + (i * 0.23) / nR, 0.19 + ((i + 1) * 0.23) / nR));
    Object.assign(nodes, L.graph.frame(relP));
    L.relLabels.forEach(q => { nodes[`rlg${q.i}`] = {opacity: r(clamp((relP(q.i) - 0.55) / 0.45), 3)}; });
    if (L.legend) nodes.legend = {opacity: r(seg(u, 0.19, 0.24), 3)};

    /* trace */
    const tp = seg(u, 0.44, 0.72);
    const tracerOn = u >= 0.44 && u <= 0.75;
    const tq = L.route.poly.at(ease.inOutSine(tp));
    nodes.tracer = {transform: T(tq.x, tq.y), opacity: tracerOn ? r(clamp(seg(u, 0.44, 0.455) * (1 - seg(u, 0.73, 0.75))), 3) : 0};
    const visited = L.route.visits.filter(v => ease.inOutSine(tp) >= v.t - 1e-6 && u >= 0.44).map(v => v.id);

    /* keys: the article rows key the plates */
    const keyed = L.S.listed.map((_, j) => {
      const n = L.S.listed.length;
      const each = (L.keyB - L.keyA) * 0.6;
      const st = L.keyA + (n > 1 ? (j * (L.keyB - L.keyA - each)) / (n - 1) : 0);
      const kp = seg(u, st, st + each);
      const e = ease.inOutSine(kp);
      const pos = L.keyRoutes[j].at(e);
      nodes[`key${j}`] = {transform: T(pos.x, pos.y, 0, lerp(0.78, 1, e)), opacity: kp > 0 ? 1 : 0};
      nodes[`plate${j}-name`] = {opacity: r(clamp((kp - 0.8) / 0.2), 3)};
      return kp;
    });

    /* cards pass the filter */
    const gateOpen = L.gates.map(() => 0);
    const holders = [];
    const cardPos = [];
    const cleared = L.sched.map(q => seg(u, q.st, q.lift));
    L.plans.forEach((pl, i) => {
      const q = L.sched[i];
      let pose, holder;
      if (u >= q.slideEnd) {
        const f = seg(u, q.slideEnd, q.fallEnd);
        const from = L.onRail(pl.targetX);
        const to = pl.rest;
        if (pl.container === 'side') {
          const tip = Math.sin(clamp(f * 1.4) * Math.PI / 2);
          pose = {x: lerp(from.x, to.x, ease.outQuad(f)), y: lerp(from.y, to.y, f * f), rot: lerp(from.rot, to.rot, f) + 26 * tip * (1 - f)};
        } else {
          pose = {x: lerp(from.x, to.x, f), y: lerp(from.y, to.y, f * f), rot: lerp(from.rot, to.rot, f)};
          gateOpen[pl.container] = Math.max(gateOpen[pl.container], 1 - seg(u, q.fallEnd + 0.004, q.fallEnd + 0.03));
        }
        holder = f >= 1 ? (pl.container === 'side' ? 'side' : `bin${pl.container}`) : 'falling';
      } else if (u >= q.lift) {
        const e = ease.inOutSine(seg(u, q.lift, q.slideEnd));
        pose = L.onRail(L.startX + (pl.targetX - L.startX) * e);
        holder = 'rail';
        if (pl.container !== 'side') gateOpen[pl.container] = Math.max(gateOpen[pl.container], seg(u, q.slideEnd - 0.012, q.slideEnd));
      } else if (u >= q.st) {
        // from the tray up onto the upper end of the rail
        const e = seg(u, q.st, q.lift);
        const q2 = L.liftRoute.at(ease.inOutSine(e));
        pose = {x: q2.x, y: q2.y, rot: lerp(0, L.RG.angle, ease.inOutSine(clamp((e - 0.5) / 0.5)))};
        holder = 'moving';
      } else {
        let slot = i;
        for (let j = 0; j < i; j++) slot -= cleared[j];
        pose = L.deckSlot(slot);
        holder = 'tray';
      }
      nodes[`card${i}`] = {transform: T(pose.x, pose.y, pose.rot, L.s)};
      holders.push(holder);
      cardPos.push(pose);
      const tx = L.cards[i].texts;
      if (tx) {
        const top = pose.y - L.chh / 2;
        const stripB = top + L.CL.stripH * L.s;
        const labT = stripB + 10 * L.s, labB = labT + L.cards[i].labelH * L.s;
        let hideLabel = holder === 'tray' && i > 0 && cleared.slice(0, i).reduce((acc, v) => acc - v, i) > 0.5;
        let hideStrip = false;
        if (/^bin|^side/.test(holder) && holders.some((hq, k) => k < i && hq === holder)) hideLabel = hideStrip = true;
        if (holder === 'falling' && pl.container !== 'side') {
          const pb = L.plates[pl.container].box;
          hideStrip = stripB > pb.y && top < pb.y + pb.h;
          hideLabel = hideLabel || (labB > pb.y && labT < pb.y + pb.h);
        }
        if (tx.label) nodes[tx.label] = {opacity: hideLabel ? 0 : 1};
        nodes[tx.num] = {opacity: hideStrip ? 0 : 1};
        if (tx.tag) nodes[tx.tag] = {opacity: hideStrip ? 0 : 1};
      }
    });
    L.gates.forEach((gt, j) => {
      const op = ease.inOutSine(clamp(gateOpen[j]));
      nodes[`rail-g${j}-L`] = {transform: T(gt.cx - gt.w / 2, L.RG.y(gt.cx - gt.w / 2), L.RG.angle + op * 80)};
      nodes[`rail-g${j}-R`] = {transform: T(gt.cx + gt.w / 2, L.RG.y(gt.cx + gt.w / 2), L.RG.angle - op * 80)};
    });

    /* gather: the supplied states */
    const lastFall = Math.max(...L.sched.map(q => q.fallEnd));
    const hold = seg(u, Math.max(0.76, lastFall + 0.005), Math.max(0.8, lastFall + 0.045));
    // the state takes the place of the bins' name: the name leaves before the state arrives
    const nameOut = seg(u, Math.max(0.745, lastFall), Math.max(0.765, lastFall + 0.02));
    const stateIn = seg(u, Math.max(0.77, lastFall + 0.025), Math.max(0.81, lastFall + 0.065));
    if (L.stIn) {
      nodes['st-in-g'] = {opacity: r(stateIn, 3)};
      if (nodes['lab-included']) nodes['lab-included'].opacity = r(nodes['lab-included'].opacity * (1 - nameOut), 3);
    }
    if (L.stUn) {
      nodes['st-un-g'] = {opacity: r(stateIn, 3)};
      if (nodes['lab-unclassified']) nodes['lab-unclassified'].opacity = r(nodes['lab-unclassified'].opacity * (1 - nameOut), 3);
    }

    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const fw = L.focusWin;
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        labelModes: L.labelModes,
        separated: r(allOut, 3),
        relationsDrawn: L.rels.map((_, i) => r(relP(i), 3)),
        kinds: L.rels.map(rl => rl.kind),
        arrowOnPlainRelation: L.rels.some(rl => rl.kind === 'relation' && LINK_STYLES.relation.arrow),
        connectorsLand: L.landed,
        tracer: tracerOn ? P2(tq) : null,
        tracerVisible: nodes.tracer.opacity > 0,
        visitOrder: L.route.visits.map(v => v.id),
        visited,
        focus: ctx.params.focusElement,
        focusScale: fw ? r(1 + 0.08 * Math.sin(Math.PI * seg(u, fw[0], fw[1])), 4) : 1,
        keyed: keyed.map(k => k >= 1),
        holders,
        states: L.S.acts.map(a => a.state),
        statesShown: r(L.stIn || L.stUn ? seg(u, Math.max(0.77, Math.max(...L.sched.map(q => q.fallEnd)) + 0.025), Math.max(0.81, Math.max(...L.sched.map(q => q.fallEnd)) + 0.065)) : hold, 3),
        ...Object.fromEntries(cardPos.map((q, i) => [`c${i}`, P2(q)])),
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
    slug: 'sources-05-mechanism',
    title: 'Material scope — exploded view of the subject filter',
    titleEs: 'Ámbito material — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito material',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: the editable-hierarchy stand, the fictional book, the article with its subject list, the collection of activity cards, the filter (rail, gates and key plates), the bins, the side bin and the magnifier move apart; only the supplied relationships are drawn, anchored to the parts and styled by kind (a plain relation has no arrow). A tracer follows the supplied order while the focus part swells; the article marks key the plates and the cards pass: each gate opens only for its own key and an unlisted tag goes to the side bin. The supplied states stay visible.',
    tags: ['material scope', 'mechanism', 'exploded view', 'subject filter', 'article', 'editable hierarchy', 'relations', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-material.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...KIT_STRINGS.en, ...STRINGS.en}, es: {...KIT_STRINGS.es, ...STRINGS.es}},
  scene,
});
