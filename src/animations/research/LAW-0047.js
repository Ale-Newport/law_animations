/**
 * LAW-0047 — Cita localizada · contrast
 *
 * Storyboard — two complete library nooks run on one clock (brief beats):
 *  [0.00–0.17] base: both scenes are identical — same shelf, search box,
 *              board and index card; each card carries the same reference
 *              as written, with no pinpoint yet.
 *  [0.17–0.40] change: in A the missing part (default: the paragraph
 *              pinpoint "¶ 3") is written onto the card in the part's colour;
 *              in B an empty dashed slot marks that it is not given. Both
 *              references are then lifted into their search boxes and cut:
 *              A yields four parts, B three parts and an empty compartment.
 *  [0.40–0.77] parallel: the same hands pull the same volume, lay it on the
 *              board and open it at the same page. Only A's paragraph part
 *              lands and highlights a paragraph; B's route stops where its
 *              reference stops (the page stays unmarked).
 *  [0.79–1.00] guide: rings mark the two cards' pinpoint slots — the only
 *              fact that differs — and the visible consequence in each scene
 *              (A's tagged, highlighted paragraph; the same place unmarked in
 *              B). Leaders carry the two slots into one enlarged callout
 *              (the part as written vs an empty "not given" slot, each with a
 *              small page icon of its consequence), joined by the guide, with
 *              a neutral note. No winner, score or legal consequence is shown.
 * The right hands slide in to take the cards and leave once they are laid
 * down, so nothing rests clipped in a corner.
 * `missingPart` chooses where B's reference stops (paragraph, page or
 * volume): B gives neither that part nor any later one, and its route stops
 * at the last part it has.
 * @module animations/research/LAW-0047
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields, oneOf} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, scenarioHeader, neutralNote} from '../../frameworks/paired.js';
import {libraryStage, STAGE, SEG_KEYS, researchFields, citationParts, locateDepth, KIT_STRINGS, segColor, segIcon, fitWords} from './kits/cita-localizada.js';

const ID = 'LAW-0047';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.79], guide: [0.79, 1]};
const W = {
  grab: [0.08, 0.16], present: [0.16, 0.24], write: [0.23, 0.31], changeChip: [0.22, 0.3],
  strip: [0.31, 0.37], split: [0.36, 0.42], cardDown: [0.405, 0.485], release: [0.49, 0.555],
  flySource: [0.41, 0.47], flyVolume: [0.46, 0.52], reach: [0.48, 0.54],
  pull: [0.54, 0.58], carry: [0.58, 0.65], toEdge: [0.65, 0.67], open: [0.67, 0.72], retreat: [0.72, 0.79],
  // page and paragraph parts fly one after the other (never over each other)
  flyPage: [0.672, 0.712], flyPara: [0.71, 0.775], hl: [0.765, 0.79],
  guide: [0.8, 0.92], note: [0.9, 0.97],
};
const PART_KEY = {paragraph: 'paragraph', page: 'page', volume: 'volume'};

const sceneSchema = {
  ...researchFields,
  ...contrastFields(),
  missingPart: oneOf('Where scenario B\'s reference stops: B gives neither this part nor any later one (A gives them)', ['paragraph', 'page', 'volume']),
};
sceneSchema.query = {...sceneSchema.query, description: 'The shared part of the reference as written on both cards; scenario A then adds the contrasted part (fictional)'};

const defaultParams = {
  query: 'Casebook of Examples, 4, 112,',
  sources: ['Journal of Sample Studies', 'Casebook of Examples', 'Practice Notes'],
  citations: [{source: 'Casebook of Examples', volume: 'Vol. 4', page: 'p. 112', paragraph: '¶ 3'}],
  dates: ['Noted on day 12', 'Edition of day 3'],
  pinpointRow: 3,
  missingPart: 'paragraph',
  scenarioA: {label: 'Locatable reference', caption: 'Source, volume, page and paragraph are given'},
  scenarioB: {label: 'Incomplete reference', caption: 'The paragraph pinpoint is not given'},
  changedFact: 'Only the paragraph pinpoint differs',
  sharedFacts: ['Same source and volume', 'Same page', 'Same search and shelf'],
  comparisonLabels: {guide: 'Changed fact: the paragraph pinpoint', neutral: 'Two references shown side by side — no outcome is stated'},
};

/** Stage axis and arrangement per available shape. */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row'},
  square: {axis: 'vertical', arrangement: 'row'},
  portrait: {axis: 'horizontal', arrangement: 'column'},
};

/** Card rest per stage axis (stage units) and the cover grip height (see layout). */
const CARD_REST = {
  square: {x: 1140, y: 968, rot: 0, k: 0.8},
  horizontal: {x: 1440, y: 772, rot: 0, k: 0.8},
  vertical: {x: 858, y: 1320, rot: 0, k: 0.9},
};
const CARD_REST_HIGH = {horizontal: {x: 1418, y: 374, rot: 0, k: 0.86}};
/**
 * Second low place (smaller, on the board's front edge) tried before the high
 * one: a tall paragraph tag at a low row then leaves the card where it is,
 * out of the lane the paragraph tag flies down (the high place is in it).
 */
const CARD_REST_LOWER = {horizontal: {x: 1450, y: 782, rot: 0, k: 0.68}};
const EDGE_Y = {square: 0.1, horizontal: 0.12, vertical: 0.08};
/** A long paragraph tag stays this far from the stage's right border (its ring then stays on the board). */
const PARA_INSET = 64;

/** Box union / inflate helpers (block coordinates). */
const union = (a, b) => {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y};
};
const inflate = (b, d) => ({x: b.x - d, y: b.y - d, w: b.w + d * 2, h: b.h + d * 2});

/**
 * Enlarged copy of one card's pinpoint slot for the comparison callout:
 * scenario badge, the slot as written (the part in its colour, or an empty
 * dashed slot marked "not given") and a small page icon of the consequence.
 * Local origin = top-left of the cell.
 */
function slotCell(ctx, o) {
  const th = ctx.theme;
  const size = o.size;
  const badgeR = size * 0.42;
  const pad = size * 0.32;
  const iconW = size * 0.9, iconH = size * 1.18;
  const x0 = pad + badgeR * 2 + pad * 0.8;
  const valueMax = o.w - x0 - iconW - pad * 2.2;
  // the written part: one line when it fits at a bounded smaller size, else
  // two lines; the cell grows to hold it (text never crosses the border)
  let fVal = null, fNote = null;
  if (o.given && ctx.show('key')) {
    const one = fitWords(ctx, o.text, {maxWidth: valueMax, size, minSize: size * 0.7, maxLines: 1, weight: 700, family: 'serif'});
    fVal = !one.truncated ? one : fitWords(ctx, o.text, {maxWidth: valueMax, size: size * 0.8, minSize: size * 0.6, maxLines: 2, weight: 700, family: 'serif'});
  }
  if (!o.given && ctx.show('key') && o.note) fNote = ctx.fit(o.note, {maxWidth: Math.max(size * 2, valueMax - size * 1.8), size: size * 0.64, minSize: size * 0.48, maxLines: 2, weight: 700});
  const hh = Math.max(size * 1.55, iconH + pad * 1.4, (fVal ? fVal.height : 0) + pad * 1.6, (fNote ? fNote.height : 0) + pad * 1.6);
  const midY = hh / 2;
  const parts = [];
  let valueW = 0;
  if (o.given) {
    if (fVal) {
      const f = fVal;
      valueW = f.width;
      parts.push(textBlock(f, {x: x0, y: midY - f.height / 2, fill: o.color}));
    } else {
      valueW = Math.min(valueMax, size * 2.2);
      parts.push(h('rect', {x: x0, y: midY - size * 0.16, width: valueW, height: size * 0.32, rx: size * 0.16, fill: o.color}));
    }
  } else {
    // an empty dashed slot, then "not given" beside it
    const sw = size * 1.5;
    const sh = size * 0.95;
    parts.push(h('path', {d: roundRectPath(x0, midY - sh / 2, sw, sh, 8), fill: '#fdf1ec', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': '9 7'}));
    valueW = sw;
    if (fNote) {
      const f = fNote;
      parts.push(textBlock(f, {x: x0 + sw + size * 0.3, y: midY - f.height / 2, fill: th.accent}));
      valueW = sw + size * 0.3 + f.width;
    }
  }
  // consequence icon: a page with the pinpointed paragraph highlighted (A) or
  // unmarked (B); a closed volume when B's route stops before the page
  const ix = x0 + valueW + pad * 1.2, iy = midY - iconH / 2;
  const icon = [];
  if (o.icon === 'closed') {
    icon.push(h('path', {d: roundRectPath(ix, iy, iconW, iconH, 4), fill: '#2c4a6e', stroke: th.ink, 'stroke-width': 2.5}));
    icon.push(h('rect', {x: ix + iconW * 0.18, y: iy + iconH * 0.2, width: iconW * 0.64, height: iconH * 0.22, fill: '#f3ead3'}));
  } else if (o.icon === 'none') {
    icon.push(h('path', {d: roundRectPath(ix, iy, iconW, iconH, 4), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '6 5'}));
  } else {
    icon.push(h('path', {d: roundRectPath(ix, iy, iconW, iconH, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2.5}));
    const rows = 5;
    for (let i = 0; i < rows; i++) {
      const y = iy + iconH * (0.16 + i * 0.16);
      if (o.icon === 'marked' && i === o.row - 1) icon.push(h('rect', {x: ix + iconW * 0.1, y: y - iconH * 0.05, width: iconW * 0.8, height: iconH * 0.12, rx: 3, fill: th.highlight}));
      icon.push(h('rect', {x: ix + iconW * 0.16, y, width: iconW * (i % 2 ? 0.6 : 0.68), height: iconH * 0.035 + 1, fill: th.paperLine}));
    }
    if (o.icon === 'marked') icon.push(g({transform: T(ix + iconW, iy + iconH * (0.16 + (o.row - 1) * 0.16))}, h('circle', {r: size * 0.2, fill: segColor(ctx, 'paragraph').c, stroke: th.paper, 'stroke-width': 2}), segIcon('paragraph', size * 0.14, '#fff')));
  }
  const w = ix + iconW + pad * 1.4;
  const node = g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(5, 8, w, hh, 16), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 16), fill: th.card, stroke: o.color, 'stroke-width': 4}),
    h('circle', {cx: pad + badgeR, cy: midY, r: badgeR, fill: o.badgeColor, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: pad + badgeR, y: midY + badgeR * 0.45, 'text-anchor': 'middle', 'font-size': r(badgeR * 1.25, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
    parts, icon);
  return {node, w, h: hh};
}

/** Polyline path drawn on with a dash offset. */
function leader(name, pts, color, width, dashed) {
  const len = pts.slice(1).reduce((a, q, i) => a + Math.hypot(q.x - pts[i].x, q.y - pts[i].y), 0);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  const node = g({name, opacity: 0},
    dashed
      ? h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-dasharray': '10 8', opacity: 1})
      : h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${name}-dot`, cx: pts[0].x, cy: pts[0].y, r: width * 1.6, fill: color}));
  const frame = p => (dashed
    ? {[name]: {opacity: r(clamp(p * 3), 3)}}
    : {[name]: {opacity: p > 0 ? 1 : 0}, [`${name}-line`]: {'stroke-dashoffset': r(len * (1 - p))}});
  return {node, frame, len};
}

const scene = {
  sizes: {landscape: [2670, 1500], square: [2070, 1900], portrait: [1760, 2520]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = {...KIT_STRINGS.en, ...(KIT_STRINGS[p.locale] || {})};
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const stageSize = STAGE[axis];
    const header = 150;
    const col = arrangement === 'column';
    // B's reference stops at `missingPart`: that part and every later one are
    // absent; A writes that missing tail onto its card
    const partsA = citationParts(p);
    const missKey = PART_KEY[p.missingPart];
    const cut = SEG_KEYS.indexOf(missKey);
    const citB = {...p.citations[0]};
    SEG_KEYS.slice(cut).forEach(k => { citB[k] = ''; });
    const partsB = citationParts(p, citB);
    const appendText = partsA.slice(cut).filter(x => x.present).map(x => x.text).join(', ') || '—';
    const depthA = locateDepth(partsA), depthB = locateDepth(partsB);
    const colors = [th.accent4, th.accent];
    const pinRow = clamp(p.pinpointRow ?? 3, 1, 5);

    // comparison callout: an enlarged copy of the two slots (sized first: the
    // footer / gap that carries it is sized from it)
    const cellSize = col ? 64 : axis === 'vertical' ? 76 : 66;
    const cellW = col ? 640 : Math.min(620, stageSize.w * 0.6);
    const iconOf = i => (i === 0 ? 'marked' : depthB >= 3 ? 'plain' : depthB === 2 ? 'closed' : 'none');
    const cells = [0, 1].map(i => slotCell(ctx, {name: `cell-${i}`, letter: i ? 'B' : 'A', badgeColor: colors[i], color: i ? th.accent : segColor(ctx, missKey).c,
      given: i === 0, text: appendText, note: t.notGiven, size: cellSize, w: cellW, icon: iconOf(i), row: pinRow}));
    const cellH = Math.max(...cells.map(c => c.h));
    const chipSize = col ? 38 : 40;
    const guideProbe = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, anchor: 'middle', maxWidth: col ? 700 : 1100, size: chipSize, maxLines: 2}) : null;
    const noteProbe = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: 0, y: 0, maxWidth: (STAGE[axis].w * (col ? 1 : 2) + (col ? 110 : 70)) * 0.95, size: 40}) : null;
    const noteH = noteProbe ? noteProbe.box.h : 0;
    // earlier footer chips (changed fact, shared facts) must fit the footer too
    const earlyH = Math.max(
      ctx.show('key') ? chip(ctx, p.changedFact, {x: 0, y: 0, anchor: 'middle', maxWidth: (geoW => geoW * 0.9)(STAGE[axis].w * (col ? 1 : 2) + (col ? 110 : 70)), size: 44, maxLines: 2}).box.h : 0,
      p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: 0, y: 0, maxWidth: (STAGE[axis].w * (col ? 1 : 2) + (col ? 110 : 70)) * 0.95, size: 40}).box.h : 0);

    // row: the callout runs through a footer under the two cards; column: it
    // sits in a widened gap between the stacked stages
    const gap = col ? Math.max(170, 24 + Math.max(cellH * 2 + 14, guideProbe ? guideProbe.box.h : 0) + 30) : 70;
    const geo0 = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap});
    // row: guide chip on the joining line when the cells leave room, else below
    const margin = col ? 110 : 0; // column: B's leader runs up a right-hand margin
    const geo = geo0;
    const bw = geo.w + margin;

    // the card rests at the board's lower right, slightly smaller, and the
    // left hand grips the cover higher on its fore-edge, so neither the arm's
    // sweep (shelf → board → cover edge) nor the hand ever passes over the
    // resting card; the paragraph tag keeps clear of the stage's right border
    const common = {axis, chips: false, cardRef: p.query, sizeParts: partsA, cardTilt: false, edgeY: EDGE_Y[axis], paraDockInset: PARA_INSET};
    const mkStages = cardRest => [
      libraryStage(ctx, {...common, cardRest, prefix: 'sa', params: {...p, actorLabels: {a: ''}}, parts: partsA, cardAppend: {text: appendText, mode: 'text', key: missKey}, stripText: `${p.query} ${appendText}`}),
      libraryStage(ctx, {...common, cardRest, prefix: 'sb', params: {...p, citations: [citB, ...p.citations.slice(1)], actorLabels: {a: ''}}, parts: partsB, cardAppend: {text: appendText, mode: 'slot', key: missKey}, stripText: p.query}),
    ];
    // both scenes rest their card at the same place: the low place unless A's
    // paragraph tag (at the pinpointed row) would touch it, then the high one
    let stages = mkStages(CARD_REST[axis]);
    let restUsed = {k: 1, ...CARD_REST[axis]};
    {
      const tagHits = (st, scaled) => {
        const tk = st.tokens[3];
        const c = st.paraDockAt(pinRow, tk.w);
        const tb = {x: c.x - tk.w / 2 - 12, y: c.y - tk.h / 2 - 12, w: tk.w + 24, h: tk.h + 24};
        const rest = scaled;
        const cb = rest ? {x: rest.x - (st.G.card.w * rest.k) / 2 - 8, y: rest.y - (st.G.card.h * rest.k) / 2 - 8, w: st.G.card.w * rest.k + 16, h: st.G.card.h * rest.k + 16} : st.cardRestBox;
        return tb.x < cb.x + cb.w && tb.x + tb.w > cb.x && tb.y < cb.y + cb.h && tb.y + tb.h > cb.y;
      };
      if (tagHits(stages[0])) {
        const lower = CARD_REST_LOWER[axis] ? mkStages(CARD_REST_LOWER[axis]) : null;
        if (lower && !tagHits(lower[0], CARD_REST_LOWER[axis])) { stages = lower; restUsed = CARD_REST_LOWER[axis]; }
        else if (CARD_REST_HIGH[axis]) { stages = mkStages(CARD_REST_HIGH[axis]); restUsed = CARD_REST_HIGH[axis]; }
      }
    }
    const headers = geo.panels.map((pn, i) => scenarioHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x, y: pn.headerY + 8, w: pn.w, h: header - 16, color: colors[i],
    }));
    // pinpoint slots on the resting cards (block coordinates): the ring box is
    // the appended part's box, clear of the neighbouring glyphs
    const slots = stages.map((st, i) => {
      const b = st.card.appendBox || {x: -30, y: -15, w: 60, h: 30};
      const q = [st.cardRestPoint({x: b.x - 4, y: b.y - 4}), st.cardRestPoint({x: b.x + b.w + 4, y: b.y + b.h + 4})];
      const pn = geo.panels[i];
      const box = {x: pn.x + Math.min(q[0].x, q[1].x), y: pn.y + Math.min(q[0].y, q[1].y), w: Math.abs(q[1].x - q[0].x), h: Math.abs(q[1].y - q[0].y)};
      return {...box, cx: box.x + box.w / 2, cy: box.y + box.h / 2};
    });
    // the visible consequence: A's pinpointed paragraph with its tag; the same
    // place in B (unmarked page, closed volume or empty board)
    const consequence = stages.map((st, i) => {
      const pn = geo.panels[i];
      // B's route stops at the retrieved volume: ring the closed volume itself
      if (i === 1 && depthB === 2) {
        const v = inflate({x: st.hinge.x, y: st.spreadTop, w: st.pageW + 8, h: st.pageH + 8}, 12);
        return {x: pn.x + v.x, y: pn.y + v.y, w: v.w, h: v.h};
      }
      const pb = stages[0].paraBox(pinRow);
      const tk = stages[0].tokens[3];
      const dock = stages[0].paraDockAt(pinRow, tk.w);
      const u0 = inflate(union(pb, {x: dock.x - tk.w / 2, y: dock.y - tk.h / 2, w: tk.w, h: tk.h}), 12);
      // kept on the board, clear of the stage's border (a long tag docks
      // over the page's right margin: see PARA_INSET)
      const x1 = Math.min(u0.x + u0.w, stageSize.w - PARA_INSET + 14);
      const u = {x: u0.x, y: u0.y, w: x1 - u0.x, h: u0.h};
      return {x: pn.x + u.x, y: pn.y + u.y, w: u.w, h: u.h};
    });

    // row: cells under their cards; the guide chip goes on the joining line
    // when the cells leave room for it, else below them
    const rowCellX = (c, i) => Math.max(geo.panels[i].x + 10, Math.min(geo.panels[i].x + geo.panels[i].w - c.w - 10, slots[i].cx - c.w / 2));
    const chipBelow = !col && guideProbe ? rowCellX(cells[1], 1) - (rowCellX(cells[0], 0) + cells[0].w) < guideProbe.box.w + 60 : false;
    const footer = Math.max(30 + earlyH + 16, col ? 40 + Math.max(noteH, 70) + 24 : 34 + cellH + (chipBelow ? 16 + guideProbe.box.h : 0) + 22 + Math.max(noteH, 60) + 12);
    const bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;

    const cellPos = [];
    let guideChip = null;
    let links = [];
    let joinPts = null;
    if (!col) {
      // each cell sits in the footer under its own card; a joining line runs
      // between them with the guide chip on it (or below when they are close)
      const y0 = geo.h + 34;
      cells.forEach((c, i) => { cellPos.push({x: rowCellX(c, i), y: y0 + (cellH - c.h) / 2, w: c.w, h: c.h}); });
      const midY = y0 + cellH / 2;
      links = [0, 1].map(i => {
        const tx = Math.max(cellPos[i].x + 30, Math.min(cellPos[i].x + cellPos[i].w - 30, slots[i].cx));
        const from = {x: slots[i].cx, y: slots[i].y + slots[i].h};
        const pts = Math.abs(tx - from.x) < 1 ? [from, {x: tx, y: cellPos[i].y}] : [from, {x: from.x, y: from.y + 18}, {x: tx, y: from.y + 18}, {x: tx, y: cellPos[i].y}];
        return leader(`link-${i}`, pts, th.accent, 4, false);
      });
      joinPts = [{x: cellPos[0].x + cellPos[0].w, y: midY}, {x: cellPos[1].x, y: midY}];
      if (guideProbe) {
        const cx = (joinPts[0].x + joinPts[1].x) / 2;
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: chipBelow ? bw / 2 : cx, y: chipBelow ? y0 + cellH + 16 : midY - guideProbe.box.h / 2, anchor: 'middle', maxWidth: 1100, size: chipSize, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      }
    } else {
      // stacked in the gap between the two stages, right-aligned under A's
      // card; the guide chip stands to their left
      const gTop = geo.panels[0].y + stageSize.h + 24;
      let y = gTop + Math.max(0, ((guideProbe ? guideProbe.box.h : 0) - (cellH * 2 + 14)) / 2);
      cells.forEach(c => { cellPos.push({x: geo.w - 6 - c.w, y, w: c.w, h: c.h}); y += c.h + 14; });
      const cellLeft = Math.min(...cellPos.map(c => c.x));
      if (guideProbe) guideChip = chip(ctx, p.comparisonLabels.guide, {x: cellLeft - 36, y: (cellPos[0].y + cellPos[1].y + cellPos[1].h) / 2 - guideProbe.box.h / 2, anchor: 'end', maxWidth: 700, size: chipSize, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      // both leaders leave their card to the right and run along the margin:
      // A down to its cell, B up to its cell (their vertical runs never meet)
      const mx = geo.w + margin * 0.55;
      links = [0, 1].map(i => {
        const cy = cellPos[i].y + cellPos[i].h / 2;
        return leader(`link-${i}`, [{x: slots[i].x + slots[i].w, y: slots[i].cy}, {x: mx, y: slots[i].cy}, {x: mx, y: cy}, {x: cellPos[i].x + cellPos[i].w, y: cy}], th.accent, 4, false);
      });
      joinPts = [{x: cellLeft - 18, y: cellPos[0].y + cellPos[0].h / 2}, {x: cellLeft - 18, y: cellPos[1].y + cellPos[1].h / 2}];
      joinPts = [{x: cellPos[0].x, y: joinPts[0].y}, joinPts[0], joinPts[1], {x: cellPos[1].x, y: joinPts[1].y}];
    }
    const join = joinPts ? leader('join', joinPts, th.accent, 4, false) : null;

    const footY = !col ? bh - Math.max(noteH, 60) - 12 : geo.h + 40;
    const chipRowY = geo.h + 30;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: bw / 2, y: chipRowY, anchor: 'middle', maxWidth: bw * 0.9, size: 44, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: chipRowY, maxWidth: bw * 0.95, size: 40, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'neutral-note'}) : null;
    // the resting card (stage units), for the check that no part tag flies or
    // docks over it
    const G0 = stages[0].G;
    const restBox = {x: restUsed.x - (G0.card.w * restUsed.k) / 2, y: restUsed.y - (G0.card.h * restUsed.k) / 2, w: G0.card.w * restUsed.k, h: G0.card.h * restUsed.k};
    return {geo, stages, headers, slots, consequence, cells, cellPos, links, join, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, depthA, depthB, missKey, bw, bh, restBox};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ring = (name, b, dashed, clip) => h('path', {name, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(16, b.h / 2)), fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': dashed ? '12 10' : null, 'clip-path': clip ? ctx.ref('cons-clip') : null, opacity: 0});
    // a consequence ring that reaches the resting card passes behind it (the
    // card lies on the board in front): the card's area is cut out of the ring
    const b = L.restBox;
    const holes = L.geo.panels.map(pn => `M${r(pn.x + b.x - 3)} ${r(pn.y + b.y - 3)}h${r(b.w + 6)}v${r(b.h + 6)}h${r(-(b.w + 6))}Z`).join('');
    const clip = h('defs', null, h('clipPath', {id: ctx.id('cons-clip')}, h('path', {d: `M-4000 -4000H${r(L.bw + 4000)}V${r(L.bh + 4000)}H-4000Z${holes}`, 'clip-rule': 'evenodd'})));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      clip,
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      ring('ring-0', L.slots[0], false), ring('ring-1', L.slots[1], true),
      ring('cons-0', L.consequence[0], false, true), ring('cons-1', L.consequence[1], true, true),
      L.links.map(x => x.node),
      L.join && L.join.node,
      L.cells.map((c, i) => g({transform: T(L.cellPos[i].x, L.cellPos[i].y)}, c.node)),
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const v = d => {
      const on = (flag, w) => (flag ? seg(u, ...w) : 0);
      return {
        grab: seg(u, ...W.grab),
        release: seg(u, ...W.release),
        present: seg(u, ...W.present),
        strip: seg(u, ...W.strip),
        split: seg(u, ...W.split),
        cardDown: seg(u, ...W.cardDown),
        fly: {source: on(d >= 1, W.flySource), volume: on(d >= 2, W.flyVolume), page: on(d >= 3, W.flyPage), paragraph: on(d >= 4, W.flyPara)},
        dispatch: {source: d >= 1, volume: d >= 2, page: d >= 3, paragraph: d >= 4},
        reach: on(d >= 2, W.reach),
        pull: on(d >= 2, W.pull),
        carry: on(d >= 2, W.carry),
        toEdge: on(d >= 3, W.toEdge),
        open: on(d >= 3, W.open),
        retreat: on(d >= 3, W.retreat),
        withdraw: d === 2 ? seg(u, W.toEdge[0], W.retreat[1]) : 0,
        hl: on(d >= 4, W.hl),
      };
    };
    const a = L.stages[0].pose(v(L.depthA));
    const b = L.stages[1].pose(v(L.depthB));
    const nodes = {...a.nodes, ...b.nodes};
    // the changed fact: A's part is written in; B's empty slot appears
    const wr = seg(u, ...W.write);
    nodes['sa-card-add'] = {opacity: r(clamp(wr * 1.4), 3)};
    nodes['sb-card-add'] = {opacity: r(clamp(wr * 1.4), 3)};
    // a brief ring draws the eye to the changed spot on each card
    const pulse = seg(u, W.write[0], W.write[1] + 0.06);
    const ringOp = r(Math.sin(Math.PI * pulse) * (pulse > 0 ? 1 : 0), 3);
    nodes['sa-card-add-ring'] = {opacity: ringOp};
    nodes['sb-card-add-ring'] = {opacity: ringOp};
    // guide: rings on the slots and on the consequences, leaders into the
    // enlarged callout, then the join and the guide chip
    const gp = seg(u, ...W.guide);
    const ringP = r(clamp(gp / 0.25), 3);
    nodes['ring-0'] = {opacity: ringP};
    nodes['ring-1'] = {opacity: ringP};
    const consP = r(clamp((gp - 0.1) / 0.25), 3);
    nodes['cons-0'] = {opacity: consP};
    nodes['cons-1'] = {opacity: consP};
    L.links.forEach(x => Object.assign(nodes, x.frame(ease.inOutSine(clamp((gp - 0.15) / 0.35)))));
    nodes['cell-0'] = {opacity: r(clamp((gp - 0.45) / 0.2), 3)};
    nodes['cell-1'] = {opacity: r(clamp((gp - 0.45) / 0.2), 3)};
    if (L.join) Object.assign(nodes, L.join.frame(ease.inOutSine(clamp((gp - 0.62) / 0.25))));
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.75) / 0.2), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.5) / 0.05)), 3)};
    // (the shared-facts note fades in only once the changed-fact chip has gone: no cross-fade)
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.555) / 0.045) * (1 - clamp((u - W.guide[0] + 0.03) / 0.03)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const sa = a.semantic, sb = b.semantic;
    return {
      nodes,
      semantic: {
        beat,
        written: r(wr, 3),
        a: {holder: sa.bookHolder, open: sa.bookOpen, highlight: sa.highlight, landed: sa.landed, missing: sa.missing, split: sa.split},
        b: {holder: sb.bookHolder, open: sb.bookOpen, highlight: sb.highlight, landed: sb.landed, missing: sb.missing, split: sb.split},
        bookA: sa.book, bookB: sb.book,
        handLA: sa.handL, handLB: sb.handL, cardA: sa.card, cardB: sb.card,
        handRA: sa.handR, handRB: sb.handR, armROutA: sa.armROut, armROutB: sb.armROut,
        tokParaA: sa.tokPara, tokParaB: sb.tokPara,
        sameBookPath: sa.book.x === sb.book.x && sa.book.y === sb.book.y,
        depthA: L.depthA, depthB: L.depthB,
        missingPart: L.missKey,
        reach: {a: sa.allReached, b: sb.allReached},
        allReached: sa.allReached && sb.allReached,
        guideProgress: r(gp, 3),
        calloutShown: gp >= 0.65,
        // once the card rests, does A's paragraph tag (flying or docked) cover it?
        paraTagOverCard: (() => {
          const tk = L.stages[0].tokens[3];
          const q = sa.tokPara;
          if (!tk.present || u < W.release[0] || !q) return false;
          const kf = u > W.flyPara[0] && u < W.flyPara[1] ? 1.1 : 1; // a flying tag grows by up to 10 %
          const b = L.restBox, hw = (tk.w * kf) / 2, hh = (tk.h * kf) / 2;
          return q.x - hw < b.x + b.w && q.x + hw > b.x && q.y - hh < b.y + b.h && q.y + hh > b.y;
        })(),
        arrangement: L.arrangement,
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
    slug: 'research-02-contrast',
    title: 'Located citation — locatable vs incomplete reference',
    titleEs: 'Cita localizada — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Cita localizada',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical library nooks run in parallel. Only one part of the written reference differs: A gives it (written onto the card), B leaves an empty slot. Both references are split in their search boxes and followed with the same hands, volume and page; A’s route reaches a highlighted paragraph, B’s stops at the opened page. Rings mark the two pinpoint slots and their visible consequences; leaders carry the slots into one enlarged comparison callout joined by the guide, with a neutral note.',
    tags: ['citation', 'reference', 'comparison', 'incomplete', 'pinpoint', 'library', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/cita-localizada.js', 'src/frameworks/paired.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
