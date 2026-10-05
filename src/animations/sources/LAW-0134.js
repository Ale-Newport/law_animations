/**
 * LAW-0134 — Ámbito temporal · mechanism
 *
 * Storyboard (exploded "projection" diagram, not a row of boxes):
 *  0.00–0.18  separate: the parts of the action slide apart into their own
 *             places — the editable hierarchy (a ladder of user-supplied
 *             levels), the source book, the article card, an attributed
 *             reading note, the interval as a floating tape strip drawn at
 *             the timeline's scale, the large time axis and the fact tags
 *             hanging from their pins.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             each anchored to the real edges of its two parts and styled by
 *             kind (plain relation = no arrow; communication = dashed arrow;
 *             sequence = solid arrow; causal only when supplied).
 *  0.43–0.75  trace: a tracer runs the supplied traversal order along the
 *             drawn connectors; each part pulses as it is reached and the
 *             focus part enlarges under a magnifying glass.
 *  0.75–1.00  gather: the interval strip projects straight down onto the axis
 *             (dashed guides + tinted column) — the transformation — and every
 *             fact tag shows its supplied-position state: inside / outside the
 *             supplied interval, or not classified (boundary day). Origin,
 *             transformation and state stay visible. No rule or outcome is
 *             inferred.
 * @module animations/sources/LAW-0134
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {connector, textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  scopeFields, SCOPE_DEFAULTS, SCOPE_STRINGS, scopeData, stateColors, rulerGeometry, rulerArt, articleCard, closedBook,
  levelLadder, readingNote, magnifier, factCard, measureFact, pushPin, intervalPhrases, relax1d, overlaps, bestSpot,
  fitWords, segmentHitsBox, unionBox, unitRuler,
} from './kits/ambito-temporal.js';

const ID = 'LAW-0134';
const DURATION = 7000;
const IDS = ['hierarchy', 'source', 'article', 'interval', 'timeline', 'facts', 'reading'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {project: [0.77, 0.86], states: [0.84, 0.93], lensOut: [0.75, 0.82]};

const sceneSchema = {
  ...scopeFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships = JSON.parse(JSON.stringify(sceneSchema.relationships));
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  ...SCOPE_DEFAULTS,
  elements: [
    {id: 'hierarchy', label: 'Editable hierarchy'},
    {id: 'source', label: 'Source book'},
    {id: 'article', label: 'Article card'},
    {id: 'interval', label: 'Supplied interval'},
    {id: 'timeline', label: 'Timeline (fictional days)'},
    {id: 'facts', label: 'Facts'},
    {id: 'reading', label: 'Attributed reading'},
  ],
  relationships: [
    {from: 'hierarchy', to: 'source', kind: 'relation', label: 'holds'},
    {from: 'source', to: 'article', kind: 'relation', label: 'contains'},
    {from: 'article', to: 'interval', kind: 'relation', label: 'supplies'},
    {from: 'interval', to: 'timeline', kind: 'sequence', label: 'laid over'},
    {from: 'timeline', to: 'facts', kind: 'relation', label: 'positions'},
    {from: 'reading', to: 'article', kind: 'communication', label: 'proposes a reading'},
  ],
  focusElement: 'interval',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['hierarchy', 'source', 'article', 'interval', 'timeline', 'facts'],
};

/**
 * Hand-placed parts per shape (design units). Horizontal axis for landscape
 * and square (strip above the axis, facts below); vertical axis for portrait
 * (strip left of the axis, facts right). The design spaces have the
 * proportions of the caption-safe box so key labels stay ≥ ~20 px at 1080p.
 */
const PLACES = {
  landscape: {
    size: [1800, 880],
    ladder: {x: 22, y: 18, w: 300}, source: {x: 480, y: 40, w: 240, h: 150}, article: {x: 860, y: 16, w: 300}, reading: {x: 1450, y: 22, w: 330},
    axis: {o: 'h', a0: 70, a1: 1730, c: 540, thick: 66, pad: 50}, strip: {cross: 372, thick: 48},
    facts: {top: 680, w: 250, gap: 16, lo: 20, hi: 1780, bottom: 870},
    legendZones: [{x: 1650, y: 20, w: 140, h: 260}],
    minLabel: 20,
    txt: {el: 24, rel: 23, num: 24, fact: 24, day: 24, strip: 24, ref: 26, iv: 26, book: 24, plate: 24, note: 22, body: 21},
  },
  square: {
    // (the square box is width-limited: the extra height costs no scale and gives the ruler → facts link
    // room for its chip)
    size: [1120, 950],
    ladder: {x: 16, y: 16, w: 268}, source: {x: 444, y: 34, w: 196, h: 140}, article: {x: 790, y: 14, w: 314}, reading: {x: 16, y: 262, w: 250, side: true},
    // (the ruler sits low and the fact row close under it, leaving the right column tall enough for the
    // attributed reading note under the article card, with a real gap for its connector)
    axis: {o: 'h', a0: 24, a1: 1096, c: 626, thick: 60, pad: 42}, strip: {cross: 440, thick: 44},
    facts: {top: 752, w: 208, gap: 12, lo: 12, hi: 1108, bottom: 948, reserveLeft: true},
    legendZones: [],
    // (1:1 renders at ~0.78 px per unit: key text ≥ 24.5 units ≈ 19 px, body text ≥ 21 units ≈ 16 px)
    minLabel: 20.8,
    txt: {el: 22, rel: 21.5, num: 22, fact: 24.5, day: 24.5, strip: 24.5, ref: 25, iv: 25, book: 24.5, plate: 24.5, note: 21.5, by: 24.5, body: 21.5},
  },
  portrait: {
    size: [1000, 1440],
    ladder: {x: 18, y: 18, w: 300}, source: {x: 470, y: 36, w: 230, h: 150}, article: {x: 660, y: 300, w: 320}, reading: {x: 18, y: 300, w: 330},
    axis: {o: 'v', a0: 590, a1: 1420, c: 440, thick: 64, pad: 42}, strip: {cross: 210, thick: 46},
    facts: {left: 676, w: 316, gap: 14, lo: 700, hi: 1430},
    legendZones: [],
    minLabel: 18,
    txt: {el: 23, rel: 22, num: 23, fact: 23, day: 23, strip: 23, ref: 26, iv: 26, book: 22, plate: 22, note: 22, body: 21},
  },
};

const STRINGS = {
  en: {...SCOPE_STRINGS.en, projection: 'projected onto the timeline'},
  es: {...SCOPE_STRINGS.es, projection: 'proyectado sobre la línea de tiempo'},
};

/** Exact smallest distance between segments a–b and c–d (0 when they cross). */
function segDist(a, b, c, d) {
  const cross = (o, p, q) => (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  const d1 = cross(c, d, a), d2 = cross(c, d, b), d3 = cross(a, b, c), d4 = cross(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  const ptSeg = (p, s0, s1) => {
    const vx = s1.x - s0.x, vy = s1.y - s0.y;
    const L2 = vx * vx + vy * vy || 1;
    const t = clamp(((p.x - s0.x) * vx + (p.y - s0.y) * vy) / L2);
    return Math.hypot(p.x - (s0.x + vx * t), p.y - (s0.y + vy * t));
  };
  return Math.min(ptSeg(a, c, d), ptSeg(b, c, d), ptSeg(c, a, b), ptSeg(d, a, b));
}

/** Anchor on a box facing a point; long thin boxes anchor straight across. */
function anchorOn(box, toward, pad = 6) {
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const longH = box.w > box.h * 2.6, longV = box.h > box.w * 2.6;
  if (longH) {
    const x = clamp(toward.x, box.x + 24, box.x + box.w - 24);
    return {x, y: toward.y < cy ? box.y - pad : box.y + box.h + pad};
  }
  if (longV) {
    const y = clamp(toward.y, box.y + 24, box.y + box.h - 24);
    return {x: toward.x < cx ? box.x - pad : box.x + box.w + pad, y};
  }
  const dx = toward.x - cx, dy = toward.y - cy;
  if (Math.abs(dx) * box.h > Math.abs(dy) * box.w) {
    const x = dx > 0 ? box.x + box.w + pad : box.x - pad;
    return {x, y: clamp(cy + (dy / Math.abs(dx || 1)) * (box.w / 2), box.y + 14, box.y + box.h - 14)};
  }
  const y = dy > 0 ? box.y + box.h + pad : box.y - pad;
  return {x: clamp(cx + (dx / Math.abs(dy || 1)) * (box.h / 2), box.x + 18, box.x + box.w - 18), y};
}

function legendNode(ctx, kinds, labels, at, size) {
  const th = ctx.theme;
  const rows = kinds.map((k, i) => {
    const color = kindColor(ctx, k);
    const dash = k === 'communication' ? '10 8' : null;
    const arrow = k !== 'relation';
    const y = at.y + i * (size * 1.6);
    const f = fitWords(ctx, labels[k] || k, {maxWidth: at.w - 70, size, minSize: size * 0.8, maxLines: 1, weight: 500});
    return g({transform: T(at.x, y)},
      h('line', {x1: 0, x2: 50, y1: 0, y2: 0, stroke: color, 'stroke-width': k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M52 0l-12 -7l3 7l-3 7z', fill: color}) : [h('circle', {cx: 50, cy: 0, r: 5, fill: color}), h('circle', {cx: 0, cy: 0, r: 5, fill: color})],
      textBlock(f, {x: 62, y: -f.size * 0.62, fill: th.fg}));
  });
  return g({name: 'legend', opacity: 0}, rows);
}

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const C = stateColors(ctx);
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const TX = Pl.txt;
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const d = scopeData(p);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const hasReading = d.readings.length > 0;

    // ---------------- parts ----------------
    // content text sizes actually drawn (every part's own text): labels are capped at their minimum
    const sink = [];
    const parts = {};
    // hierarchy ladder
    const src = d.sources[d.sourceIndex];
    const lad = levelLadder(ctx, {w: Pl.ladder.w, levels: d.levels, highlight: src.level, size: TX.plate, sink});
    parts.hierarchy = {art: lad.node, box: {x: Pl.ladder.x, y: Pl.ladder.y, w: lad.w, h: lad.h}};
    // source book
    const bookArt = closedBook(ctx, {x: 0, y: 0, w: Pl.source.w, h: Pl.source.h, color: '#2f5d62', title: src.label, titleSize: TX.book, sink});
    parts.source = {art: bookArt, box: {x: Pl.source.x, y: Pl.source.y, w: Pl.source.w, h: Pl.source.h}};
    // article card
    const card = articleCard(ctx, {w: Pl.article.w, hx: 34, edge: 'bottom', ref: d.article.ref, text: d.article.text,
      intervalPhrases: intervalPhrases(d, d.start, d.end), intervalLabel: t.suppliedInterval, refSize: TX.ref, ivSize: TX.iv, textSize: TX.body, ivLabSize: TX.body, sink});
    parts.article = {art: g(null, h('path', {d: roundRectPath(6, 9, card.w, card.h, 9), fill: th.shadow}), card.parts), box: {x: Pl.article.x, y: Pl.article.y, w: card.w, h: card.h}};
    // reading note
    if (hasReading) {
      const rd = d.readings[0];
      // (square: the note carries its supplied element label as a header band — the caption stays attached
      // to its part and is always drawn, however dense the diagram is)
      const bandCaption = Pl.reading.side && label('reading') ? label('reading') : null;
      const mkNote = w => readingNote(ctx, {w, head: t.readingProposed, by: `${t.by} ${rd.by}`, text: rd.text, size: TX.note, bySize: TX.by, textSize: TX.body, caption: bandCaption, captionSize: Math.max(Pl.minLabel ?? 18, Math.min(TX.el * 0.9, 20)), bandName: 'reading-band', sink});
      let note = mkNote(Pl.reading.w);
      let rb = {x: Pl.reading.x, y: Math.max(Pl.reading.y, parts.hierarchy.box.x + parts.hierarchy.box.w > Pl.reading.x && parts.hierarchy.box.x < Pl.reading.x + note.w ? parts.hierarchy.box.y + parts.hierarchy.box.h + 60 : 0), w: note.w, h: note.h};
      if (Pl.reading.side) {
        // square: under the ladder or under the article, whichever stays clear of the interval strip and the
        // ruler; the narrowest note width that fits wins (it leaves room beside it for the element caption)
        const AXu = unitRuler(ctx, Pl.axis, d, TX.num);
        const sA0 = rulerGeometry(AXu, d).along(d.start), eA0 = rulerGeometry(AXu, d).along(d.end);
        const strip0 = {x: sA0 - 20, y: Pl.strip.cross - Pl.strip.thick / 2 - 30, w: eA0 - sA0 + 40, h: Pl.strip.thick + 60};
        const axisTop = Pl.axis.c - Pl.axis.thick / 2 - 20;
        let found = null;
        const artBottom = parts.article.box.y + parts.article.box.h;
        for (const w of [Pl.reading.w - 20, Pl.reading.w, Pl.reading.w + 30, Pl.reading.w + 60, Pl.reading.w + 90, Pl.reading.w + 120]) {
          const n2 = mkNote(w);
          // (a gap of 60–92 units under the article gives the reading link length and room for its label)
          const gapR = clamp(axisTop - artBottom - n2.h, 60, 92);
          const cands = [
            {x: Pl.ladder.x, y: parts.hierarchy.box.y + parts.hierarchy.box.h + 66, w: n2.w, h: n2.h},
            {x: S.w - n2.w - 16, y: artBottom + gapR, w: n2.w, h: n2.h},
          ];
          const ok = cands.find(c => !overlaps(c, strip0, 0) && c.y + c.h < axisTop);
          if (ok) { found = {note: n2, rb: ok}; break; }
        }
        if (!found) {
          const n2 = mkNote(Pl.reading.w + 90);
          found = {note: n2, rb: {x: S.w - n2.w - 16, y: Math.max(parts.article.box.y + parts.article.box.h + 40, axisTop - n2.h), w: n2.w, h: n2.h}};
        }
        note = found.note;
        rb = found.rb;
      }
      parts.reading = {art: note.node, box: rb, band: note.captionBand};
    }
    // timeline axis (a ruler strip)
    const AX = unitRuler(ctx, Pl.axis, d, TX.num);
    const geo = rulerGeometry(AX, d);
    const hor = geo.hor;
    const axisArt = rulerArt(ctx, {R: AX, d, geo, numSize: TX.num, minLabelGap: TX.num * 2.2});
    parts.timeline = {art: axisArt, box: geo.box};
    // interval strip (floating tape at the axis scale)
    const sA = geo.along(d.start), eA = geo.along(d.end);
    const ST = Pl.strip;
    const stripBox = hor ? {x: sA, y: ST.cross - ST.thick / 2, w: Math.max(8, eA - sA), h: ST.thick} : {x: ST.cross - ST.thick / 2, y: sA, w: ST.thick, h: Math.max(8, eA - sA)};
    const clipD = (a, sgn) => (hor
      ? `M${r(a + 9 * sgn)} ${r(stripBox.y - 10)}H${r(a)}V${r(stripBox.y + stripBox.h + 10)}H${r(a + 9 * sgn)}`
      : `M${r(stripBox.x - 10)} ${r(a + 9 * sgn)}V${r(a)}H${r(stripBox.x + stripBox.w + 10)}V${r(a + 9 * sgn)}`);
    // the strip is a tape measure at the timeline's scale: a tick every day (half-day minor ticks) on both edges
    const stripTicks = () => {
      const dd = [];
      for (let k = Math.ceil(d.start * 2); k <= Math.floor(d.end * 2); k++) {
        const a = geo.along(k / 2);
        const len = k % 2 ? 6 : 12;
        if (hor) dd.push(`M${r(a)} ${r(stripBox.y + 2)}v${len}M${r(a)} ${r(stripBox.y + stripBox.h - 2)}v${-len}`);
        else dd.push(`M${r(stripBox.x + 2)} ${r(a)}h${len}M${r(stripBox.x + stripBox.w - 2)} ${r(a)}h${-len}`);
      }
      return h('path', {d: dd.join('') || 'M0 0', fill: 'none', stroke: C.tape, 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.9});
    };
    const makeStripArt = () => g(null,
      h('path', {d: roundRectPath(stripBox.x, stripBox.y, stripBox.w, stripBox.h, 6), fill: C.tape, opacity: 0.32}),
      h('path', {d: roundRectPath(stripBox.x, stripBox.y, stripBox.w, stripBox.h, 6), fill: 'none', stroke: C.tape, 'stroke-width': 3.5}),
      stripTicks(),
      [clipD(sA, 1), clipD(eA, -1)].map(dd => g(null,
        h('path', {d: dd, fill: 'none', stroke: th.ink, 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        h('path', {d: dd, fill: 'none', stroke: C.tape, 'stroke-width': 6.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}))),
    );
    const stripArt = makeStripArt();
    parts.interval = {art: stripArt, box: {x: stripBox.x - 12, y: stripBox.y - 12, w: stripBox.w + 24, h: stripBox.h + 24}, strip: stripBox};
    // facts: tags hanging from pins on the axis
    const FA = Pl.facts;
    const fw = FA.w;
    let fsize = TX.fact;
    let measures = d.facts.map(f => measureFact(ctx, f, {w: fw, dayText: d.dayText(f.day), labelSize: fsize, daySize: TX.day}));
    if (hor) {
      // (fact labels never shrink below the ~16 px floor of the shape)
      while (Math.max(...measures.map(m => m.h)) > FA.bottom - FA.top && fsize - 1 >= Math.max(TX.fact * 0.8, Pl.minLabel ?? 0)) {
        fsize -= 1;
        measures = d.facts.map(f => measureFact(ctx, f, {w: fw, dayText: d.dayText(f.day), labelSize: fsize, daySize: TX.day}));
      }
    }
    const fh = Math.max(...measures.map(m => m.h));
    // smallest key-content text on the fact tags (labels, day chips), design units
    const factSizes = measures.flatMap(m => [m.labelFit && m.labelFit.size, m.dayFit && m.dayFit.size]).filter(Boolean);
    const presentStates = [...new Set(d.facts.map(f => f.state))];
    const stripSizes = showKey ? presentStates.map(st => ctx.fit(st === 'inside' ? t.inside : st === 'outside' ? t.outside : t.unclassified, {maxWidth: fw - 24 - 16, size: TX.strip, minSize: 15, maxLines: 1, weight: 800}).size) : [];
    sink.push(...factSizes, ...stripSizes);
    // the smallest content text of the whole diagram (facts, card, book, ladder, reading note)
    const factSize = sink.length ? Math.min(...sink) : null;
    const pinCross = AX.thick / 2 - 12;
    const pins = d.facts.map(f => geo.at(f.day, pinCross));
    let tagBoxes;
    if (hor) {
      // (square: a long facts caption that cannot stand in two lines above the row gets a reserved column at
      // the row's left; the cards keep their order and threads, shifted right as little as needed)
      let lo = FA.lo;
      if (FA.reserveLeft && showKey && label('facts')) {
        const two = fitWords(ctx, label('facts'), {maxWidth: 200, size: Pl.minLabel, minSize: Pl.minLabel, floorSize: Pl.minLabel, maxLines: 2, weight: 700});
        if (two.truncated || two.width + Pl.minLabel * 1.1 > 180) {
          const four = fitWords(ctx, label('facts'), {maxWidth: 140, size: Pl.minLabel, minSize: Pl.minLabel, floorSize: Pl.minLabel, maxLines: 4, weight: 700});
          lo = Math.max(lo, 16 + four.width + Pl.minLabel * 1.1 + 24);
        }
      }
      const xs = relax1d(d.facts.map(f => ({c: geo.along(f.day), s: fw})), FA.gap, lo, FA.hi);
      tagBoxes = xs.map(x => ({x: x - fw / 2, y: FA.top, w: fw, h: fh}));
    } else {
      const ys = relax1d(d.facts.map(f => ({c: geo.along(f.day), s: fh})), FA.gap, FA.lo, FA.hi);
      tagBoxes = ys.map(y => ({x: FA.left, y: y - fh / 2, w: fw, h: fh}));
    }
    const tagAnchor = b => (hor ? {x: b.x + b.w / 2, y: b.y} : {x: b.x, y: b.y + b.h / 2});
    const factArt = d.facts.map((f, i) => {
      const fc = factCard(ctx, {prefix: `ft${i}`, w: fw, h: fh, fact: f, measure: measures[i], t, stripSize: TX.strip});
      return g({transform: T(tagBoxes[i].x, tagBoxes[i].y)}, fc.parts);
    });
    const threads = d.facts.map((f, i) => {
      const a = pins[i], b = tagAnchor(tagBoxes[i]);
      return g(null,
        h('line', {name: `thr${i}`, x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: th.inkSoft, 'stroke-width': 2.2}),
        h('line', {name: `thri${i}`, x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: C.inside, 'stroke-width': 4, opacity: 0}),
        h('circle', {cx: r(b.x), cy: r(b.y), r: 5, fill: th.ink}));
    });
    const pinArt = d.facts.map((f, i) => g({transform: T(pins[i].x, pins[i].y)}, pushPin(ctx, `pin${i}`, 10)));
    // the facts GROUP: a bracket hugging the tag row on the axis side; relations to "facts" land on it
    // (never on one particular tag, which would read as a specific day)
    const tagsU = unionBox(tagBoxes);
    const BR = 16;
    const bracket = hor
      ? {x0: tagsU.x + 4, x1: tagsU.x + tagsU.w - 4, at: tagsU.y - BR, tip: tagsU.y - 3}
      : {x0: tagsU.y + 4, x1: tagsU.y + tagsU.h - 4, at: tagsU.x - BR, tip: tagsU.x - 3};
    // the ruler → facts link drops STRAIGHT from one end cap of the ruler (beyond the day marks, so no day is
    // suggested) onto the facts bracket, whose arm reaches under that cap; the cap farther from every pin
    // thread is used (the link's label then has room beside it)
    const caps = [AX.a0 + AX.pad * 0.45, AX.a1 - AX.pad * 0.45];
    const threadAt = d.facts.map(f => geo.along(f.day));
    const capSide = caps.map(c => Math.min(...threadAt.map(a => Math.abs(a - c)))).reduce((bi, v, k, arr) => (v > arr[bi] ? k : bi), 0);
    const capA = caps[capSide];
    if (capSide === 0) bracket.x0 = Math.min(bracket.x0, capA - 10); else bracket.x1 = Math.max(bracket.x1, capA + 10);
    const bracketBox = hor
      ? {x: bracket.x0 - 2, y: bracket.at - 3, w: bracket.x1 - bracket.x0 + 4, h: BR}
      : {x: bracket.at - 3, y: bracket.x0 - 2, w: BR, h: bracket.x1 - bracket.x0 + 4};
    const bracketArt = h('path', {d: hor
      ? `M${r(bracket.x0)} ${r(bracket.tip)}V${r(bracket.at)}H${r(bracket.x1)}V${r(bracket.tip)}`
      : `M${r(bracket.tip)} ${r(bracket.x0)}H${r(bracket.at)}V${r(bracket.x1)}H${r(bracket.tip)}`,
    fill: 'none', stroke: th.inkSoft, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'});
    const threadSegs = d.facts.map((f, i) => ({a: pins[i], b: tagAnchor(tagBoxes[i])}));
    parts.facts = {art: g(null, threads, pinArt, bracketArt, factArt), box: unionBox([...tagBoxes, bracketBox]), tags: tagBoxes, bracket: bracketBox};

    // projection (gather): dashed guides from the strip ends onto the axis + tinted column
    const proj = hor
      ? {x: sA, y: stripBox.y + stripBox.h, w: eA - sA, h: geo.e0 - (stripBox.y + stripBox.h)}
      : {x: stripBox.x + stripBox.w, y: sA, w: geo.e0 - (stripBox.x + stripBox.w), h: eA - sA};
    const projArt = g({name: 'proj', opacity: 0},
      h('path', {name: 'proj-col', d: roundRectPath(proj.x, proj.y, Math.max(1, proj.w), Math.max(1, proj.h), 2), fill: C.tape, opacity: 0.14}),
      hor
        ? h('path', {d: `M${r(sA)} ${r(proj.y)}V${r(geo.e1)}M${r(eA)} ${r(proj.y)}V${r(geo.e1)}`, stroke: C.tape, 'stroke-width': 3, 'stroke-dasharray': '9 7'})
        : h('path', {d: `M${r(proj.x)} ${r(sA)}H${r(geo.e1)}M${r(proj.x)} ${r(eA)}H${r(geo.e1)}`, stroke: C.tape, 'stroke-width': 3, 'stroke-dasharray': '9 7'}),
      // the band laid on the axis itself
      hor
        ? h('path', {d: roundRectPath(sA, geo.e0 + 4, eA - sA, AX.thick - 8, 3), fill: C.tape, opacity: 0.3})
        : h('path', {d: roundRectPath(geo.e0 + 4, sA, AX.thick - 8, eA - sA, 3), fill: C.tape, opacity: 0.3}),
    );

    // ---------------- connectors ----------------
    const present = id => Boolean(parts[id]);
    const rels = p.relationships.filter(rl => present(rl.from) && present(rl.to) && rl.from !== rl.to);
    const centerOf = id => {
      const b = parts[id].box;
      return {x: b.x + b.w / 2, y: b.y + b.h / 2};
    };
    const boxOf = id => (id === 'interval' ? parts.interval.box : parts[id].box);
    /** end points of a link between two boxes: straight across when they overlap on one axis */
    const linkPoints = (A, B, padA, padB) => {
      const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
      const ox0 = Math.max(A.x, B.x) + 22, ox1 = Math.min(A.x + A.w, B.x + B.w) - 22;
      if (ox1 >= ox0 && (A.y + A.h <= B.y || B.y + B.h <= A.y)) {
        const x = clamp((ca.x + cb.x) / 2, ox0, ox1);
        return A.y < B.y ? [{x, y: A.y + A.h + padA}, {x, y: B.y - padB}] : [{x, y: A.y - padA}, {x, y: B.y + B.h + padB}];
      }
      const oy0 = Math.max(A.y, B.y) + 16, oy1 = Math.min(A.y + A.h, B.y + B.h) - 16;
      if (oy1 >= oy0 && (A.x + A.w <= B.x || B.x + B.w <= A.x)) {
        const y = clamp((ca.y + cb.y) / 2, oy0, oy1);
        return A.x < B.x ? [{x: A.x + A.w + padA, y}, {x: B.x - padB, y}] : [{x: A.x - padA, y}, {x: B.x + B.w + padB, y}];
      }
      return [anchorOn(A, cb, padA), anchorOn(B, ca, padB)];
    };
    const conns = rels.map((rl, i) => {
      const padTo = rl.kind === 'relation' ? 7 : 12;
      let fromBox, toBox, from, to;
      if (rl.from === 'facts' || rl.to === 'facts') {
        // land on the tag nearest to the other part, beside (not along) that tag's own thread
        const otherId = rl.from === 'facts' ? rl.to : rl.from;
        const ob = boxOf(otherId);
        const oc = {x: ob.x + ob.w / 2, y: ob.y + ob.h / 2};
        const tag = parts.facts.bracket;
        let pts;
        if (otherId === 'timeline') {
          // from the end cap of the ruler (beyond the first / last day, so no day is suggested) to the same
          // end of the facts bracket; the end whose link stays farthest from every pin thread wins
          pts = hor ? [{x: capA, y: geo.e1 + 7}, {x: capA, y: bracket.at - 7}] : [{x: geo.e1 + 7, y: capA}, {x: bracket.at - 7, y: capA}];
        } else pts = linkPoints(ob, tag, 7, 7);
        if (rl.from === 'facts') { from = pts[1]; to = pts[0]; fromBox = tag; toBox = ob; } else { from = pts[0]; to = pts[1]; fromBox = ob; toBox = tag; }
        if (rl.to === 'facts' && rl.kind !== 'relation') to = hor ? {x: to.x, y: to.y - 5} : {x: to.x - 5, y: to.y};
      } else {
        fromBox = boxOf(rl.from);
        toBox = boxOf(rl.to);
        [from, to] = linkPoints(fromBox, toBox, 7, padTo);
      }
      const straight = Math.abs(to.x - from.x) < 4 || Math.abs(to.y - from.y) < 4;
      const c = connector(ctx, {name: `c${i}`, from, to, kind: rl.kind, bend: straight ? 0 : 0.12, color: kindColor(ctx, rl.kind)});
      return {rl, c, from, to, fromBox, toBox};
    });

    // ---------------- focus (enlarged under the magnifier during the trace) ----------------
    const order0 = p.traversalOrder.filter(id => Boolean(parts[id]));
    const focus = parts[p.focusElement] ? p.focusElement : order0[0];
    const fb = focus === 'interval' ? parts.interval.strip : parts[focus].box;
    // (over the interval strip the glass takes the strip's whole thickness, so its magnified copy shows
    // both edges and the day ticks)
    const lensR = focus === 'interval' ? clamp(Math.min(fb.w, fb.h) * 1.25, 52, 96) : clamp(Math.max(Math.min(fb.w, fb.h) * 0.62, 44), 44, 96);
    const lensAt = {x: fb.x + fb.w / 2, y: fb.y + fb.h / 2};
    // the focus part enlarges as much as the design space allows (long parts only a little)
    const fbb = focus === 'facts' ? parts.facts.box : parts[focus].box;
    const fc = {x: fbb.x + fbb.w / 2, y: fbb.y + fbb.h / 2};
    // the interval strip only thickens (its length IS its position on the day scale, so it keeps it);
    // other parts enlarge uniformly
    const fAx = focus === 'interval' ? (hor ? {x: 0, y: 1} : {x: 1, y: 0}) : {x: 1, y: 1};
    const roomX = Math.min((fc.x - 8) / (fbb.w / 2), (S.w - 8 - fc.x) / (fbb.w / 2));
    const roomY = Math.min((fc.y - 8) / (fbb.h / 2), (S.h - 8 - fc.y) / (fbb.h / 2));
    const room = Math.min(fAx.x ? roomX : 9, fAx.y ? roomY : 9);
    // ... and never so much that its focus frame would touch another part
    const othersF = Object.entries(parts).filter(([k]) => k !== focus && !(focus === 'interval' && k === 'timeline')).map(([k, v]) => (k === 'facts' ? v.tags : [v.box])).flat();
    let focusK = clamp(room, 1, focus === 'interval' ? 1.3 : 1.14) - 1;
    const kxy = k => ({x: 1 + (k - 1) * fAx.x, y: 1 + (k - 1) * fAx.y});
    const haloAt = k => {
      const q = kxy(k);
      return {x: fc.x - (fbb.w / 2 + 10) * q.x - 4, y: fc.y - (fbb.h / 2 + 10) * q.y - 4, w: (fbb.w + 20) * q.x + 8, h: (fbb.h + 20) * q.y + 8};
    };
    while (focusK > 0.06 && othersF.some(b => overlaps(haloAt(1 + focusK), b, 2))) focusK -= 0.01;
    const halo = h('path', {name: 'halo', d: roundRectPath(fbb.x - 10, fbb.y - 10, fbb.w + 20, fbb.h + 20, 16), fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});
    // the largest extent of the enlarged part + its focus frame: every label stays outside it
    const kMax = 1 + focusK;
    const kM = kxy(kMax);
    const haloBox = {x: fc.x - (fbb.w / 2 + 10) * kM.x - 6, y: fc.y - (fbb.h / 2 + 10) * kM.y - 6, w: (fbb.w + 20) * kM.x + 12, h: (fbb.h + 20) * kM.y + 12};
    // the magnifier's glass over the focus (its handle is oriented later, away from every label)
    const lensDisk = {x: lensAt.x - lensR - 18, y: lensAt.y - lensR - 18, w: 2 * lensR + 36, h: 2 * lensR + 36};

    // ---------------- labels (element captions + relation chips) ----------------
    const obstacles = [
      ...Object.entries(parts).filter(([k]) => k !== 'facts').map(([, v]) => v.box),
      ...parts.facts.tags, parts.facts.bracket,
      haloBox, lensDisk,
    ];
    // the pin threads (pin → tag) are thin obstacles: no label may hide one
    const threadObst = threadSegs.map(t => ({x: Math.min(t.a.x, t.b.x) - 3, y: Math.min(t.a.y, t.b.y) - 3, w: Math.abs(t.a.x - t.b.x) + 6, h: Math.abs(t.a.y - t.b.y) + 6}));
    const segBoxes = conns.map((x, ci) => {
      const pts = x.c.at ? [0, 0.25, 0.5, 0.75, 1].map(tt => x.c.at(tt)) : [x.from, x.to];
      return pts.slice(1).map((q, k) => ({a: pts[k], b: q, ci}));
    }).flat();
    const bounds = {x: 6, y: 6, w: S.w - 12, h: S.h - 12};
    const inBounds = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
    // labels are placed at full size; if any caption or relation chip finds no free spot (very long
    // labels) the whole set is placed again slightly smaller
    const placeLabels = (k, chipsFirst, rev) => {
    // (supplied element / relation labels never render below MIN_LABEL design units, ≈ 14.4 px in 1:1)
    // (per shape: the unit size that renders at ~16 px at 1080p)
    const MIN_LABEL = Pl.minLabel ?? 17.8;
    // (generic labels are never set larger than the fact text actually used — AUTHORING item 17)
    const TXk = {el: Math.max(Math.min(TX.el * k, factSize ?? 99), Math.min(MIN_LABEL, TX.el)), rel: Math.max(Math.min(TX.rel * k, factSize ?? 99), Math.min(MIN_LABEL, TX.rel))};
      const placed = [];
      const clearOf = (b, extra = [], ignore = [], ownConn = -1) => inBounds(b) && !obstacles.some(q => !ignore.includes(q) && overlaps(b, q, 6)) && !extra.some(q => overlaps(b, q, 6)) && !placed.some(q => overlaps(b, q, 8)) && !segBoxes.some(sg => sg.ci !== ownConn && segmentHitsBox(sg.a, sg.b, b, 4)) && !threadSegs.some(t => segmentHitsBox(t.a, t.b, b, 5));
      // narrower, taller variants are tried when a wide chip finds no free spot (long labels)
      const WIDTHS = [300, 220, 170, 130, 110];
      const mkChip = (text, size, color, bold, mw = 300) => {
        const f = fitWords(ctx, text, {maxWidth: mw, size, minSize: size * 0.8, maxLines: mw < 170 ? 4 : mw < 300 ? 3 : 2, weight: bold ? 700 : 600});
        return {f, w: f.width + size * 1.1, h: f.height + size * 0.7, size, color, text};
      };
      // relation chips: beside the connector midpoint, clear of parts, captions and other links
      let relChips = [];
      const placeChips = () => {
      relChips = conns.map(() => null);
      const cOrder = conns.map((_, i) => (rev ? conns.length - 1 - i : i));
      const mkRel = (x, i) => {
        if (!showAll) return null;
        const text = x.rl.label || p.relationLabels[x.rl.kind] || x.rl.kind;
        const color = kindColor(ctx, x.rl.kind);
        let cp = null;
        const mid = x.c.at(0.5);
        // chips stay off the projection column unless they name the link that crosses it (strip → axis)
        const crossesProj = ['interval', 'timeline'].includes(x.rl.from) && ['interval', 'timeline'].includes(x.rl.to);
        const extra = crossesProj ? [] : [proj];
        // the clear chip position closest to the connector's midpoint (never on a part, label or link)
        let pick = null;
        let best = null;
        WIDTHS.forEach((mw, wi) => {
        const cpw = mkChip(text, TXk.rel, color, false, mw);
        if (cpw.f.truncated || cpw.f.size < Math.max(TXk.rel * 0.9, MIN_LABEL)) return;
        let bestD = Infinity, pk = null;
        for (let oy = -340; oy <= 340; oy += 10) {
          for (let ox = -340; ox <= 340; ox += 10) {
            const bb = {x: mid.x + ox - cpw.w / 2, y: mid.y + oy - cpw.h / 2, w: cpw.w, h: cpw.h};
            const dxb = Math.max(bb.x - mid.x, 0, mid.x - (bb.x + bb.w)), dyb = Math.max(bb.y - mid.y, 0, mid.y - (bb.y + bb.h));
            const dist = Math.hypot(dxb, dyb);
            if (dist >= bestD) continue;
            if (!clearOf(bb, extra)) continue;
            // a leader (drawn when the chip is not beside its link) crosses no part and no other label
            if (dist > cpw.h * 0.6) {
              const tip = {x: clamp(mid.x, bb.x, bb.x + bb.w), y: clamp(mid.y, bb.y, bb.y + bb.h)};
              const holds = q => mid.x >= q.x - 2 && mid.x <= q.x + q.w + 2 && mid.y >= q.y - 2 && mid.y <= q.y + q.h + 2;
            if (obstacles.some(q => !holds(q) && segmentHitsBox(mid, tip, q, 2)) || placed.some(q => segmentHitsBox(mid, tip, q, 2))) continue;
            if (threadSegs.some(t => segDist(mid, tip, t.a, t.b) < 6)) continue;
            // a relation label stays beside its own link: a short leader that crosses no other connector
            if (dist > Math.max(cpw.h * 2.2, 96)) continue;
            if (segBoxes.some(sg => sg.ci !== i && segDist(mid, tip, sg.a, sg.b) < 6)) continue;
            }
            bestD = dist;
            pk = bb;
          }
        }
        // a narrower (taller) chip is used only when it sits clearly closer to its connector
        if (pk && (!best || bestD + wi * 40 < best.score)) best = {score: bestD + wi * 40, pick: pk, cp: cpw};
        });
        if (!best) {
          // last resort (long labels, short links): the chip sits ON its own connector, which passes behind
          // it, leaving both ends of the connector visible
          const ends = [x.from, x.to].map(q => ({x: q.x - 16, y: q.y - 16, w: 32, h: 32}));
          WIDTHS.forEach(mw => {
            if (best) return;
            const cpw = mkChip(text, TXk.rel, color, false, mw);
            for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7]) {
              const q = x.c.at(tt);
              // centred on the link, or slid across it while still covering it
              for (const f of [0, -0.3, 0.3, -0.42, 0.42]) {
              const bb = {x: q.x - cpw.w / 2 + f * cpw.w, y: q.y - cpw.h / 2, w: cpw.w, h: cpw.h};
              if (!ends.some(e => overlaps(bb, e, 0)) && clearOf(bb, extra, [], i)) { best = {pick: bb, cp: cpw, onLink: true}; return; }
              }
            }
          });
        }
        if (!best) return null;
        pick = best.pick;
        cp = best.cp;
        placed.push(pick);
        const c0 = {x: pick.x + pick.w / 2, y: pick.y + pick.h / 2};
        const tipL = {x: clamp(mid.x, pick.x, pick.x + pick.w), y: clamp(mid.y, pick.y, pick.y + pick.h)};
        const leadInfo = {dist: Math.hypot(tipL.x - mid.x, tipL.y - mid.y), crosses: segBoxes.filter(sg => sg.ci !== i && segDist(mid, tipL, sg.a, sg.b) < 4).length};
        const lead = Math.hypot(c0.x - mid.x, c0.y - mid.y) > cp.h ? h('line', {x1: r(mid.x), y1: r(mid.y), x2: r(clamp(mid.x, pick.x, pick.x + pick.w)), y2: r(clamp(mid.y, pick.y, pick.y + pick.h)), stroke: color, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null;
        return {box: pick, crossesProj, truncated: Boolean(cp.f.truncated), size: cp.f.size, leadInfo, chipH: cp.h, node: g({name: `rl${i}`, opacity: 0}, lead,
          h('path', {d: roundRectPath(pick.x, pick.y, pick.w, pick.h, Math.min(pick.h / 2, 14)), fill: th.card, stroke: color, 'stroke-width': 2}),
          textBlock(cp.f, {x: pick.x + pick.w / 2, y: pick.y + cp.size * 0.35, anchor: 'middle', fill: th.ink}))};
      };
      for (const i of cOrder) relChips[i] = mkRel(conns[i], i);
      };

      // element captions: next to their part (below, then above, then sides)
      const captions = [];
      const placeCaptions = () => {
      if (showKey) {
        for (const id of rev ? IDS.slice().reverse() : IDS) {
          if (!parts[id] || !label(id)) continue;
          if (parts[id].band) {
            const pb = parts[id].box;
            captions.push({id, box: {x: pb.x, y: pb.y, w: pb.w, h: parts[id].band.h}, shift: {x: 0, y: 0}, gap: 0, led: false, truncated: parts[id].band.truncated, size: parts[id].band.size, inPart: true, node: g({name: `cap-${id}`, opacity: 0})});
            continue;
          }
          const b = id === 'interval' ? parts.interval.strip : parts[id].box;
          // the focus part's caption sits beside the part and slides outward by the enlargement while the
          // focus frame is up (so the frame never runs through it)
          const shiftFor = bb => {
            if (id !== focus || !overlaps(bb, haloBox, 6)) return {x: 0, y: 0};
            const gx = kM.x > 1 ? (fbb.w / 2 + 10) * (kM.x - 1) + 18 : 0, gy = kM.y > 1 ? (fbb.h / 2 + 10) * (kM.y - 1) + 18 : 0;
            const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2;
            if (cx > b.x + b.w) return {x: gx, y: 0};
            if (cx < b.x) return {x: -gx, y: 0};
            return {x: 0, y: cy < b.y + b.h / 2 ? -gy : gy};
          };
          let pick = null;
          let shift = {x: 0, y: 0};
          let cp = null;
          for (const mw of WIDTHS) {
          cp = mkChip(label(id), TXk.el, th.ink, true, mw);
          // a width that would cut the caption with an ellipsis, or shrink it well below its size, is never used
          if (cp.f.truncated || cp.f.size < Math.max(TXk.el * 0.9, MIN_LABEL)) continue;
          const cands = id === 'facts'
            ? (hor
              ? [{x: b.x - cp.w - 12, y: b.y + 8}, {x: b.x + b.w + 12, y: b.y + 8}, {x: b.x, y: b.y + b.h + 10}, {x: b.x + b.w - cp.w, y: b.y + b.h + 10},
                // just above the bracket, in a gap between two pin threads (the threads are obstacles)
                ...Array.from({length: Math.max(1, Math.ceil((b.x + b.w - cp.w - bounds.x) / 16) + 1)}, (_, k) => ({x: bounds.x + k * 16, y: b.y - cp.h - 8})),
                ...Array.from({length: Math.max(1, Math.ceil((b.x + b.w - cp.w - bounds.x) / 16) + 1)}, (_, k) => ({x: bounds.x + k * 16, y: parts.facts.tags[0].y - cp.h - 8}))]
              : [{x: b.x + b.w - cp.w, y: b.y - cp.h - 12}, {x: b.x, y: b.y - cp.h - 12}, {x: b.x + b.w - cp.w, y: b.y + b.h + 12},
                ...Array.from({length: Math.max(1, Math.ceil((b.h - cp.h) / 16) + 1)}, (_, k) => ({x: b.x - cp.w - 8, y: b.y + k * 16}))])
            : id === 'timeline'
              ? (hor ? [{x: b.x + 4, y: b.y - cp.h - 10}, {x: b.x + 4, y: b.y + b.h + 10}, {x: b.x + b.w - cp.w - 4, y: b.y + b.h + 10}] : [{x: b.x - cp.w - 12, y: b.y + b.h - cp.h}, {x: b.x + b.w + 12, y: b.y - cp.h - 8}, {x: b.x - cp.w - 12, y: b.y + 4}])
              : id === 'interval'
                ? (hor ? [{x: b.x + b.w + 32, y: b.y + (b.h - cp.h) / 2}, {x: b.x - cp.w - 32, y: b.y + (b.h - cp.h) / 2}, {x: b.x + (b.w - cp.w) / 2, y: b.y - cp.h - 30}] : [{x: b.x + (b.w - cp.w) / 2, y: b.y - cp.h - 30}, {x: b.x + (b.w - cp.w) / 2, y: b.y + b.h + 30}, {x: b.x - cp.w - 30, y: b.y}])
                : [{x: b.x, y: b.y + b.h + 12}, {x: b.x + b.w - cp.w, y: b.y + b.h + 12}, {x: b.x + b.w + 14, y: b.y}, {x: b.x - cp.w - 14, y: b.y}, {x: b.x, y: b.y - cp.h - 12}];
          for (const q of cands) {
            const bb = {x: q.x, y: q.y, w: cp.w, h: cp.h};
            const sh = shiftFor(bb);
            const moved = {...bb, x: bb.x + sh.x, y: bb.y + sh.y};
            const ok = id === focus && (sh.x || sh.y)
              ? clearOf(bb, [proj], [haloBox, lensDisk]) && clearOf(moved, [proj]) && !overlaps(bb, haloAt(1), 4)
              : id === focus
                // beside the part on a side that does not grow: clear of the drawn (enlarged) frame is enough
                ? clearOf(bb, [proj], [haloBox]) && !overlaps(bb, haloAt(kMax), 3)
                // (the facts caption may lie across its own group bracket — never on a tag, thread or the ruler)
                : id === 'facts' ? clearOf(bb, [proj], [parts.facts.bracket]) : clearOf(bb, [proj]);
            if (ok) { pick = bb; shift = sh; break; }
          }
          if (pick) break;
          }
          if (!pick) {
            // fallback: the free spot nearest to the part (every non-truncating width, the full clearance test:
            // parts, labels, connectors, pin threads), never far from it; a leader is added below when needed
            for (const mw of WIDTHS) {
              const c2 = mkChip(label(id), TXk.el, th.ink, true, mw);
              if (c2.f.truncated || c2.f.size < Math.max(TXk.el * 0.9, MIN_LABEL)) continue;
              const zx0 = Math.max(bounds.x, b.x - c2.w - 60), zy0 = Math.max(bounds.y, b.y - c2.h - 60);
              const zx1 = Math.min(bounds.x + bounds.w, b.x + b.w + c2.w + 60), zy1 = Math.min(bounds.y + bounds.h, b.y + b.h + c2.h + 60);
              let bestB = null, bestD = Infinity;
              for (let y = zy0; y + c2.h <= zy1; y += 8) {
                for (let x = zx0; x + c2.w <= zx1; x += 8) {
                  const bb = {x, y, w: c2.w, h: c2.h};
                  const dd = Math.hypot(Math.max(b.x - (x + c2.w), 0, x - (b.x + b.w)), Math.max(b.y - (y + c2.h), 0, y - (b.y + b.h)));
                  if (dd >= bestD || !clearOf(bb, [proj])) continue;
                  bestD = dd; bestB = bb;
                }
              }
              if (bestB) { cp = c2; pick = bestB; break; }
            }
          }
          let capLead = null;
          if (!pick) {
            // last resort (very long labels): the nearest free spot anywhere, tied to its part by a leader
            const near = {x: b.x + b.w / 2, y: b.y + b.h / 2};
            for (const mw of WIDTHS) {
              const c2 = mkChip(label(id), TXk.el, th.ink, true, mw);
              const sp = bestSpot(c2.w, c2.h, [bounds], [...obstacles, ...placed, proj, ...threadObst, ...segBoxes.map(sg => ({x: Math.min(sg.a.x, sg.b.x) - 2, y: Math.min(sg.a.y, sg.b.y) - 2, w: Math.abs(sg.a.x - sg.b.x) + 4, h: Math.abs(sg.a.y - sg.b.y) + 4}))], near, {pad: 8, step: 10, maxLead: 340});
              if (sp) {
                cp = c2;
                pick = {x: sp.x, y: sp.y, w: c2.w, h: c2.h};
                const a0 = {x: clamp(near.x, pick.x, pick.x + pick.w), y: clamp(near.y, pick.y, pick.y + pick.h)};
                const a1 = {x: clamp(a0.x, b.x, b.x + b.w), y: clamp(a0.y, b.y, b.y + b.h)};
                capLead = h('line', {x1: r(a0.x), y1: r(a0.y), x2: r(a1.x), y2: r(a1.y), stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '3 5'});
                break;
              }
            }
          }
          if (!pick) continue;
          // a caption that does not sit right beside its part is tied to it by a leader
          const partB = id === 'facts' ? parts.facts.box : b;
          const gapTo = Math.hypot(Math.max(partB.x - (pick.x + pick.w), 0, pick.x - (partB.x + partB.w)), Math.max(partB.y - (pick.y + pick.h), 0, pick.y - (partB.y + partB.h)));
          if (!capLead && !(shift.x || shift.y) && gapTo > (id === 'interval' ? 40 : 16)) {
            const pc = {x: partB.x + partB.w / 2, y: partB.y + partB.h / 2};
            const a0 = {x: clamp(pc.x, pick.x, pick.x + pick.w), y: clamp(pc.y, pick.y, pick.y + pick.h)};
            const a1 = {x: clamp(a0.x, partB.x, partB.x + partB.w), y: clamp(a0.y, partB.y, partB.y + partB.h)};
            capLead = h('line', {x1: r(a0.x), y1: r(a0.y), x2: r(a1.x), y2: r(a1.y), stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '3 5'});
          }
          placed.push(pick);
          if (shift.x || shift.y) placed.push({...pick, x: pick.x + shift.x, y: pick.y + shift.y});
          captions.push({id, box: pick, shift, gap: r(gapTo), led: Boolean(capLead), truncated: Boolean(cp.f.truncated), size: cp.f.size, node: g({name: `cap-${id}`, opacity: 0}, capLead,
            h('path', {d: roundRectPath(pick.x, pick.y, pick.w, pick.h, Math.min(pick.h / 2, 16)), fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.8}),
            textBlock(cp.f, {x: pick.x + pick.w / 2, y: pick.y + cp.size * 0.35, anchor: 'middle', fill: th.ink}))});
        }
      }
      };
      // captions first; when that leaves something unplaced, the chips (whose links can be short) go first
      if (chipsFirst) { placeChips(); placeCaptions(); } else { placeCaptions(); placeChips(); }

      // legend (kinds actually used), in the first free zone
      const kinds = [...new Set(conns.map(x => x.rl.kind))].sort((a, b) => ['relation', 'communication', 'sequence', 'causal'].indexOf(a) - ['relation', 'communication', 'sequence', 'causal'].indexOf(b));
      let legend = null;
      if (showAll && kinds.length) {
        const lsize = TXk.rel;
        const lw = Math.max(...kinds.map(k => ctx.measure(p.relationLabels[k] || k, lsize, 500, 'sans'))) + 80;
        const lh = kinds.length * lsize * 1.6;
        const zones = [...Pl.legendZones, bounds];
        const sp = bestSpot(lw, lh, zones, [...obstacles, ...placed, ...threadObst, ...segBoxes.map(sg => ({x: Math.min(sg.a.x, sg.b.x) - 2, y: Math.min(sg.a.y, sg.b.y) - 2, w: Math.abs(sg.a.x - sg.b.x) + 4, h: Math.abs(sg.a.y - sg.b.y) + 4}))], {x: S.w, y: S.h}, {pad: 10, noLeader: true, step: 12});
        if (sp) {
          legend = legendNode(ctx, kinds, p.relationLabels, {x: sp.x + 6, y: sp.y + lsize * 0.8, w: lw}, lsize);
          placed.push({x: sp.x, y: sp.y, w: lw, h: lh});
        }
      }

    const missing = (showKey ? IDS.filter(id => parts[id] && label(id)).length - captions.length : 0) + relChips.filter((c, i) => showAll && !c).length;
    // ranking of the tries: a missing relation chip or caption costs most; a missing caption of a part that
    // prints its own name (the article card, the attributed reading note) costs least
    const selfNamed = ['article', 'reading'];
    const cost = (showKey ? IDS.filter(id => parts[id] && label(id) && !captions.some(c => c.id === id)).reduce((acc, id) => acc + (selfNamed.includes(id) ? 1 : 10), 0) : 0) + relChips.filter(c => showAll && !c).length * 10;
    return {placed, captions, relChips, legend, kinds, missing, cost, k};
    };
    let LB = null;
    // (orders tried: captions / chips first, forward / reversed; then the same slightly smaller)
    const tries = [1, 0.96, 0.92].flatMap(k => [[k, false, false], [k, true, false], [k, false, true], [k, true, true]]);
    for (const [k, cf, rv] of tries) {
      const res = placeLabels(k, cf, rv);
      if (!LB || res.cost < LB.cost) LB = res;
      if (!LB.cost) break;
    }
    const {placed, captions, relChips, legend, kinds} = LB;
    const labelsMissing = LB.missing;

    // ---------------- magnifier: handle away from labels; rest in free space ----------------
    const legendBox = legend ? placed[placed.length - 1] : null;
    /** label boxes with the focus caption moved by the given share of its outward slide */
    const labelBoxesAt = k => [...captions.map(c => ({...c.box, x: c.box.x + c.shift.x * k, y: c.box.y + c.shift.y * k})), ...relChips.filter(Boolean).map(c => c.box), ...(legendBox ? [legendBox] : [])];
    const labelBoxes = [...labelBoxesAt(0), ...labelBoxesAt(1)];
    const otherParts = [...Object.entries(parts).filter(([k]) => k !== focus && k !== 'facts').map(([, v]) => v.box), ...parts.facts.tags];
    const handleSeg = (at, deg) => {
      const a = (deg * Math.PI) / 180;
      return [{x: at.x + Math.cos(a) * (lensR + 4), y: at.y + Math.sin(a) * (lensR + 4)}, {x: at.x + Math.cos(a) * lensR * 2.1, y: at.y + Math.sin(a) * lensR * 2.1}];
    };
    const handleHits = (at, deg) => {
      const [q0, q1] = handleSeg(at, deg);
      const hw = lensR * 0.2 + 4;
      const out = !inBounds({x: Math.min(q0.x, q1.x) - hw, y: Math.min(q0.y, q1.y) - hw, w: Math.abs(q1.x - q0.x) + 2 * hw, h: Math.abs(q1.y - q0.y) + 2 * hw});
      return (out ? 100 : 0) + labelBoxes.filter(b => segmentHitsBox(q0, q1, b, hw)).length * 10 + otherParts.filter(b => segmentHitsBox(q0, q1, b, hw)).length;
    };
    const handleDeg = [40, 140, -40, -140, 90, -90, 0, 180].map(dg => ({dg, cost: handleHits(lensAt, dg)})).sort((a, b) => a.cost - b.cost)[0].dg;
    /** does the drawn lens (rim + handle) at `at` touch box b? */
    const lensHits = (at, b) => {
      const dx = Math.max(b.x - at.x, 0, at.x - b.x - b.w), dy = Math.max(b.y - at.y, 0, at.y - b.y - b.h);
      if (Math.hypot(dx, dy) < lensR + 15) return true;
      const [q0, q1] = handleSeg(at, handleDeg);
      return segmentHitsBox(q0, q1, b, lensR * 0.17);
    };
    const lensBox = at => {
      const [, q1] = handleSeg(at, handleDeg);
      const R2 = lensR + 16;
      const hw = lensR * 0.2;
      const x0 = Math.min(at.x - R2, q1.x - hw), y0 = Math.min(at.y - R2, q1.y - hw);
      return {x: x0, y: y0, w: Math.max(at.x + R2, q1.x + hw) - x0, h: Math.max(at.y + R2, q1.y + hw) - y0};
    };
    // parked where it covers nothing: no part, label, connector or the projection column
    const lb0 = lensBox({x: 0, y: 0});
    const segObst = segBoxes.map(sg => ({x: Math.min(sg.a.x, sg.b.x) - 2, y: Math.min(sg.a.y, sg.b.y) - 2, w: Math.abs(sg.a.x - sg.b.x) + 4, h: Math.abs(sg.a.y - sg.b.y) + 4}));
    let restSpot = null;
    for (const pad of [34, 22, 12]) {
      restSpot = bestSpot(lb0.w, lb0.h, [bounds], [...obstacles, ...placed, ...segObst, proj], lensAt, {pad, noLeader: true, step: 12});
      if (restSpot) break;
    }
    const lensRest = restSpot
      ? {x: restSpot.x - lb0.x, y: restSpot.y - lb0.y, parked: true}
      : {x: S.w + ox / s + lb0.w + 40, y: lensAt.y, parked: false};
    // the glide between the rest and the focus bows to the side that passes over the fewest labels
    const quad = (a, c, b, tt) => ({x: (1 - tt) * (1 - tt) * a.x + 2 * (1 - tt) * tt * c.x + tt * tt * b.x, y: (1 - tt) * (1 - tt) * a.y + 2 * (1 - tt) * tt * c.y + tt * tt * b.y});
    const lmid = {x: (lensRest.x + lensAt.x) / 2, y: (lensRest.y + lensAt.y) / 2};
    const ldist = Math.hypot(lensRest.x - lensAt.x, lensRest.y - lensAt.y) || 1;
    const perp = {x: -(lensRest.y - lensAt.y) / ldist, y: (lensRest.x - lensAt.x) / ldist};
    const lensCtrl = [0, 0.35, -0.35, 0.6, -0.6].map(k => ({x: lmid.x + perp.x * ldist * k, y: lmid.y + perp.y * ldist * k}))
      .map(c => {
        let hits = 0;
        for (let q = 1; q < 12; q++) {
          const at = quad(lensRest, c, lensAt, q / 12);
          const box = lensBox(at);
          hits += labelBoxes.filter(b => overlaps(b, box, 0)).length + (inBounds(box) ? 0 : 0.5);
        }
        return {c, hits};
      })
      .sort((a, b) => a.hits - b.hits)[0].c;
    const lensPath = tt => quad(lensRest, lensCtrl, lensAt, tt);

    // ---------------- tracer route ----------------
    const order = p.traversalOrder.filter(id => present(id));
    const pts = [];
    const visits = [];
    const cOf = id => (id === 'interval' ? {x: parts.interval.strip.x + parts.interval.strip.w / 2, y: parts.interval.strip.y + parts.interval.strip.h / 2} : centerOf(id));
    order.forEach((id, k) => {
      if (k === 0) {
        pts.push(cOf(id));
        visits.push({id, idx: 0});
        return;
      }
      const prev = order[k - 1];
      const link = conns.find(x => (x.rl.from === prev && x.rl.to === id) || (x.rl.from === id && x.rl.to === prev));
      if (link) {
        const fwd = link.rl.from === prev;
        const n = 28;
        for (let q = 0; q <= n; q++) pts.push(link.c.at(fwd ? q / n : 1 - q / n));
      } else {
        pts.push(cOf(prev));
      }
      pts.push(cOf(id));
      visits.push({id, idx: pts.length - 1});
    });
    const route = polyline(pts);
    const cum = [0];
    for (let q = 1; q < pts.length; q++) cum.push(cum[q - 1] + Math.hypot(pts[q].x - pts[q - 1].x, pts[q].y - pts[q - 1].y));
    const total = cum[cum.length - 1] || 1;
    const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / total}));

    // magnified copy shown inside the glass while it rests on the focus: a second, unnamed copy of the
    // interval strip scaled about the lens centre (text-free, so it never overlaps the labels underneath).
    // Parts that carry text keep the plain glass + enlargement (their copy would duplicate the text).
    const MAG = 1.75;
    const mag = focus === 'interval' ? {art: makeStripArt(), k: MAG} : null;
    return {S, s, ox, oy, d, parts, conns, captions, mag, factSize, legendSize: legend ? Math.min(TX.rel * LB.k, factSize ?? 99) : null, relChips, legend, route, visitT, order, focus, fb, lensR, lensAt, lensRest, projArt, proj, hor, geo, pins, kinds, focusK, fc, halo, fAx, fbb,
      threadSegs, labelsMissing, handleDeg, haloBox, labelBoxes, labelBoxesAt, otherParts, lensBox, lensHits, handleHits, lensPath};
  },
  build(ctx, L) {
    const partNodes = Object.entries(L.parts).map(([id, v]) => g({name: `part-${id}`, opacity: 0},
      id === 'timeline' || id === 'interval' || id === 'facts' ? v.art : g({transform: T(v.box.x, v.box.y)}, v.art)));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      g({name: 'z-parts'}, partNodes.filter((_, i) => Object.keys(L.parts)[i] === 'timeline')),
      L.projArt,
      g(null, partNodes.filter((_, i) => Object.keys(L.parts)[i] !== 'timeline')),
      L.conns.map(x => x.c.node),
      L.halo,
      L.captions.map(c => c.node),
      L.relChips.map(c => c && c.node),
      L.legend,
      // tracer: a large dot with a short fading trail along the route
      [4, 3, 2, 1].map(k => h('circle', {name: `trail${k}`, r: r(17 - k * 2.2), fill: ctx.theme.accent, opacity: 0})),
      g({name: 'tracer', opacity: 0},
        h('circle', {r: 34, fill: ctx.theme.accent, opacity: 0.2}),
        h('circle', {r: 19, fill: ctx.theme.accent, stroke: ctx.theme.paper, 'stroke-width': 5})),
      L.mag && g({name: 'mag', opacity: 0},
        h('defs', null, h('clipPath', {id: ctx.id('mag-clip')}, h('circle', {name: 'mag-circ', r: L.lensR}))),
        g({'clip-path': ctx.ref('mag-clip')},
          h('circle', {name: 'mag-bg', r: L.lensR, fill: ctx.theme.background || ctx.theme.paper}),
          g({name: 'mag-zoom'}, g({name: 'mag-part'}, L.mag.art)))),
      magnifier(ctx, 'lens', L.lensR, {opacity: 0, handleDeg: L.handleDeg}),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const p = ctx.params;
    const ids = Object.keys(L.parts);
    // --- separate
    const sepP = {};
    ids.forEach((id, i) => {
      sepP[id] = ease.outCubic(seg(u, 0.01 + i * 0.018, 0.1 + i * 0.018));
    });
    // --- relate: connectors one by one
    const n = L.conns.length;
    const relDraw = L.conns.map((_, i) => seg(u, BEATS.relate[0] + (i / Math.max(1, n)) * 0.22, BEATS.relate[0] + ((i + 0.8) / Math.max(1, n)) * 0.22));
    // --- trace
    const tr = seg(u, 0.45, 0.73);
    const tracerOn = u >= 0.45 && u <= 0.745;
    const tp = L.route.at(ease.inOutSine(tr));
    const visitIdx = L.visitT.filter(v => ease.inOutSine(tr) >= v.t - 1e-6 && u >= 0.45).map(v => v.id);
    // focus enlarges once the tracer reaches it and keeps its size to the end of the trace
    const fVisit = L.visitT.find(v => v.id === L.focus);
    const fT = fVisit ? lerp(0.45, 0.73, invSine(fVisit.t)) : 0.55;
    const grow = seg(u, fT - 0.04, fT + 0.02) * (1 - seg(u, 0.76, 0.82));
    const focusScale = 1 + L.focusK * ease.inOutSine(grow);
    const fsx = 1 + (focusScale - 1) * L.fAx.x, fsy = 1 + (focusScale - 1) * L.fAx.y;
    // pulses of reached parts
    const pulse = id => {
      const v = L.visitT.find(q => q.id === id);
      if (!v || u < 0.45) return 0;
      const at = lerp(0.45, 0.73, invSine(v.t));
      const k = seg(u, at, at + 0.035);
      return k > 0 && k < 1 ? Math.sin(Math.PI * k) : 0;
    };
    ids.forEach(id => {
      const b = id === 'interval' ? L.parts.interval.strip : L.parts[id].box;
      const c = {x: b.x + b.w / 2, y: b.y + b.h / 2};
      const e = sepP[id];
      const cen = {x: L.S.w / 2, y: L.S.h * 0.45};
      const dx = (cen.x - c.x) * 0.22 * (1 - e), dy = (cen.y - c.y) * 0.22 * (1 - e);
      const pk = 1 + 0.04 * pulse(id);
      const kx = (id === L.focus ? fsx : 1) * pk, ky = (id === L.focus ? fsy : 1) * pk;
      nodes[`part-${id}`] = {opacity: r(e, 3), transform: `${T(dx, dy)} ${scaleAbout(c.x, c.y, kx, ky)}`};
    });
    L.conns.forEach((x, i) => Object.assign(nodes, x.c.frame(relDraw[i], relDraw[i] > 0 ? 1 : 0)));
    const gE = ease.inOutSine(grow);
    L.captions.forEach(c => {
      nodes[`cap-${c.id}`] = {opacity: r(clamp((sepP[c.id] - 0.7) / 0.3), 3), transform: T(r(c.shift.x * gE, 2), r(c.shift.y * gE, 2))};
    });
    L.relChips.forEach((c, i) => { if (c) nodes[`rl${i}`] = {opacity: r(clamp((relDraw[i] - 0.6) / 0.4), 3)}; });
    if (L.legend) nodes.legend = {opacity: r(seg(u, 0.2, 0.3), 3)};
    nodes.tracer = {opacity: tracerOn ? 1 : 0, transform: T(tp.x, tp.y)};
    [1, 2, 3, 4].forEach(k => {
      const q = L.route.at(ease.inOutSine(clamp(tr - k * 0.012)));
      nodes[`trail${k}`] = {opacity: tracerOn && tr - k * 0.012 > 0 ? r(0.5 - k * 0.1, 3) : 0, cx: r(q.x), cy: r(q.y)};
    });
    nodes.halo = {opacity: r(ease.inOutSine(grow), 3), transform: scaleAbout(L.fc.x, L.fc.y, fsx, fsy)};
    // magnifier: appears in free space (never on a label), slides to the focus as the tracer reaches it,
    // slides back to that free spot at the start of gather and disappears there
    const lensFade = L.lensRest.parked ? seg(u, fT - 0.1, fT - 0.075) * (1 - seg(u, W.lensOut[1], W.lensOut[1] + 0.025)) : (u >= fT - 0.1 && u <= W.lensOut[1] ? 1 : 0);
    const lensIn = seg(u, fT - 0.075, fT);
    const lensOut = seg(u, ...W.lensOut);
    const lq = L.lensPath(ease.inOutCubic(lensIn) * (1 - ease.inOutCubic(lensOut)));
    nodes.lens = {opacity: r(lensFade, 3), transform: T(lq.x, lq.y)};
    // the magnified view appears once the glass has arrived on the focus and leaves before it slides away
    const magP = L.mag ? lensFade * clamp((lensIn - 0.75) / 0.25) * (1 - clamp(lensOut / 0.2)) : 0;
    if (L.mag) {
      nodes.mag = {opacity: r(magP, 3)};
      nodes['mag-circ'] = {cx: r(lq.x), cy: r(lq.y)};
      nodes['mag-bg'] = {cx: r(lq.x), cy: r(lq.y)};
      nodes['mag-zoom'] = {transform: `translate(${r(lq.x)} ${r(lq.y)}) scale(${L.mag.k}) translate(${r(-lq.x)} ${r(-lq.y)})`};
      nodes['mag-part'] = {transform: nodes[`part-${L.focus}`].transform};
    }
    // the lens footprint where it stands still (parked or on the focus): must cover no label
    const lensStill = lensFade > 0 && (lensIn === 0 || lensOut === 1 || (lensIn === 1 && lensOut === 0));
    const lensOnLabels = lensStill ? L.labelBoxesAt(gE).filter(b => L.lensHits(lq, b)).length + (lensIn === 1 && lensOut === 0 ? 0 : L.otherParts.filter(b => L.lensHits(lq, b)).length) : 0;
    // the drawn focus frame (5 units wide) at its current scale
    const haloNow = {x: L.fc.x - (L.fbb.w / 2 + 12.5) * fsx, y: L.fc.y - (L.fbb.h / 2 + 12.5) * fsy, w: (L.fbb.w + 25) * fsx, h: (L.fbb.h + 25) * fsy};
    const haloOnLabels = grow > 0 ? L.labelBoxesAt(gE).filter(b => overlaps(b, haloNow, -2)).length : 0;
    // --- gather: projection + states
    const pr = seg(u, ...W.project);
    nodes.proj = {opacity: r(pr, 3)};
    const stP = seg(u, ...W.states);
    const states = [];
    L.d.facts.forEach((f, i) => {
      const st = f.state;
      nodes[`pin${i}-in`] = {opacity: st === 'inside' ? r(stP, 3) : 0};
      nodes[`pin${i}-out`] = {opacity: st === 'outside' ? r(stP, 3) : 0};
      nodes[`pin${i}-unc`] = {opacity: st === 'unclassified' ? r(stP, 3) : 0};
      nodes[`thri${i}`] = {opacity: st === 'inside' ? r(stP, 3) : 0};
      nodes[`thr${i}`] = {'stroke-dasharray': st === 'outside' && stP > 0.5 ? '7 6' : 'none'};
      nodes[`ft${i}-s1`] = {opacity: st === 'inside' ? r(stP, 3) : 0};
      nodes[`ft${i}-s2`] = {opacity: st === 'outside' ? r(stP, 3) : 0};
      nodes[`ft${i}-s3`] = {opacity: st === 'unclassified' ? r(stP, 3) : 0};
      nodes[`ft${i}-s0`] = {opacity: r(1 - stP, 3)};
      states.push(stP >= 1 ? st : 'neutral');
    });
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    // landing check: each connector end lies on (or within a few units of) its part's box edge
    const onEdge = (pt, b) => {
      const inX = pt.x >= b.x - 16 && pt.x <= b.x + b.w + 16, inY = pt.y >= b.y - 16 && pt.y <= b.y + b.h + 16;
      const dEdge = Math.min(Math.abs(pt.x - b.x), Math.abs(pt.x - b.x - b.w), Math.abs(pt.y - b.y), Math.abs(pt.y - b.y - b.h));
      return inX && inY && dEdge <= 16;
    };
    return {
      nodes,
      semantic: {
        beat,
        relationsDrawn: relDraw.map(v => r(v, 3)),
        relationKinds: L.conns.map(x => x.rl.kind),
        arrowKinds: [...new Set(L.conns.filter(x => LINK_STYLES[x.rl.kind].arrow).map(x => x.rl.kind))],
        causalLinks: L.conns.filter(x => x.rl.kind === 'causal').length,
        connectorsLand: L.conns.every(x => onEdge(x.from, x.fromBox) && onEdge(x.to, x.toBox)),
        tracerVisible: tracerOn,
        tracer: {x: r(tp.x), y: r(tp.y)},
        visitOrder: L.visitT.map(v => v.id),
        visited: visitIdx,
        focus: L.focus,
        focusScale: r(focusScale, 3),
        lensVisible: lensFade > 0,
        lensRest: {x: r(L.lensRest.x), y: r(L.lensRest.y), parked: L.lensRest.parked},
        relChipsMissing: ctx.show('all') ? L.relChips.filter(c => !c).length : 0,
        labelsMissing: L.labelsMissing,
        captionsMissingFor: ctx.show('key') ? IDS.filter(id => L.parts[id] && !L.captions.some(c => c.id === id) && (p.elements.find(e => e.id === id) || {}).label) : [],
        relChipsMissingFor: ctx.show('all') ? L.conns.filter((x, i) => !L.relChips[i]).map(x => `${x.rl.from}>${x.rl.to}`) : [],
        chipsOnProjection: L.relChips.filter(c => c && !c.crossesProj && overlaps(c.box, L.proj, -2)).length,
        lensOnLabels,
        magnified: L.mag ? {k: L.mag.k, visible: r(magP, 3), onFocus: r(Math.hypot(lq.x - L.lensAt.x, lq.y - L.lensAt.y), 1)} : null,
        factsLink: (() => {
          // relation(s) touching "facts": end on the facts bracket; clearance from every pin thread
          const x = L.conns.find(c => c.rl.from === 'facts' || c.rl.to === 'facts');
          if (!x) return null;
          const end = x.rl.to === 'facts' ? x.to : x.from;
          const b = L.parts.facts.bracket;
          const onBracket = end.x >= b.x - 10 && end.x <= b.x + b.w + 10 && end.y >= b.y - 10 && end.y <= b.y + b.h + 10;
          return {onBracket, threadClearance: r(Math.min(...L.threadSegs.map(t => segDist(x.from, x.to, t.a, t.b))), 1)};
        })(),
        labelsOnThreads: [...L.captions.map(c => c.box), ...L.relChips.filter(Boolean).map(c => c.box)].filter(b => L.threadSegs.some(t => segmentHitsBox(t.a, t.b, b, 1))).length,
        textPx: (() => {
          const fk = L.s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
          const caps = [...L.captions.map(c => c.size), ...L.relChips.filter(Boolean).map(c => c.size), ...(L.legendSize ? [L.legendSize] : [])];
          return {fact: L.factSize ? r(L.factSize * fk, 1) : null, maxCaption: caps.length ? r(Math.max(...caps) * fk, 1) : null};
        })(),
        // per relation: connector length (design units), the label's distance from its link midpoint and
        // how many other connectors its leader crosses
        relLinks: L.conns.map((x, i) => ({rel: `${x.rl.from}>${x.rl.to}`, len: r(Math.hypot(x.to.x - x.from.x, x.to.y - x.from.y), 1),
          labelDist: L.relChips[i] ? r(L.relChips[i].leadInfo.dist, 1) : null, labelH: L.relChips[i] ? r(L.relChips[i].chipH, 1) : null, leaderCrosses: L.relChips[i] ? L.relChips[i].leadInfo.crosses : 0})),
        labelsTruncated: [...L.captions, ...L.relChips.filter(Boolean)].filter(c => c.truncated).length,
        captionsDetached: L.captions.filter(c => c.gap > (c.id === 'interval' ? 40 : 16) && !c.led && !(c.shift.x || c.shift.y)).map(c => c.id),
        lensHandleHits: L.handleHits(L.lensAt, L.handleDeg),
        haloOnLabels,
        projection: r(pr, 3),
        factStates: states,
        expectedStates: L.d.facts.map(f => f.state),
      },
    };
  },
};

/** inverse of ease.inOutSine */
function invSine(y) {
  return Math.acos(1 - 2 * clamp(y)) / Math.PI;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-04-mechanism',
    title: 'Temporal scope — the interval projected onto the timeline',
    titleEs: 'Ámbito temporal — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito temporal',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded projection diagram: editable hierarchy ladder, source book, article card, attributed reading note, the supplied interval as a floating tape strip at the timeline scale, the time axis and fact tags on their pins. Only the supplied relationships are drawn by kind; a tracer follows the traversal order while the focus part enlarges under a magnifier; the strip then projects onto the axis and each fact shows inside / outside the supplied interval or not classified.',
    tags: ['sources', 'temporal scope', 'interval', 'timeline', 'projection', 'facts', 'hierarchy', 'reading', 'mechanism', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-temporal.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
