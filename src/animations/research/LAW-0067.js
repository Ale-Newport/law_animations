/**
 * LAW-0067 — Extracción de hechos · contrast
 *
 * Storyboard (two complete, equally scaled scenes: side by side on wide and
 * square boxes, one above the other on tall boxes; the SAME volume, page,
 * index card, pen and flag in both — and the same library bay where the box
 * leaves room for it):
 *  0.00–0.17  base: both scenes identical — the request box of each scene is
 *             still empty, its flag parked at the right end of the row.
 *  0.17–0.40  change: the user types the request. A asks for a fact the page
 *             states (quote mark appears); B asks for one the page does not
 *             state (pencil mark appears). Rings mark the two rows; the
 *             changed-fact caption names the single difference.
 *  0.40–0.77  parallel action, same timing: both flags drop into the gap under
 *             the request box and run down the lane beside the page (never
 *             across the card) to ¶2 and mark it.
 *             A: the copy of ¶2 rolls up onto the flag, travels rolled (never
 *             over the page text) and unrolls into its slot, level with ¶2.
 *             B: the flag hops straight down the page edge to ¶3 (the basis
 *             is two sentences), lands on the card, and the pen writes an
 *             annotated-inference note that the flag tags "¶2+3". Nothing is
 *             copied from the page in B.
 *  0.77–1.00  a guide links the two request rows (the changed detail) and
 *             carries its own caption; each card shows what its entry is
 *             (quoted / annotated inference); neutral note. No winner, score or
 *             legal consequence.
 * Sizes: the changed fact (page ¶2/¶3, A's copy, B's note) has priority size;
 * chrome is kept small, and unrequested sentences are condensed to simulated
 * lines only where the box needs it. As the last resort for very long text
 * (before the page text shrinks below its preferred size) the page is shown as
 * an excerpt: the unrequested sentences are left out and an ellipsis marks
 * where, and the chrome is tightened — identically in both scenes.
 * Everything that differs comes from the supplied requests (mode, ¶, basis,
 * note); the scene never decides what a page means.
 * @module animations/research/LAW-0067
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, r} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {contrastFields, obj} from '../../schemas/fields.js';
import {statusTag, chip, textBlock} from '../../primitives/annotate.js';
import {extractionFields, extractionStage, requestPanel, requestField, fitBalanced, EXTRACTION_STRINGS, sentenceIndex, FLAG, SOURCES_EN} from './kits/extraccion-de-hechos.js';

const ID = 'LAW-0067';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  type: [0.19, 0.32], icon: [0.32, 0.36], ring: [0.34, 0.4], changed: [0.2, 0.24], changedOut: [0.4, 0.43],
  shared: [0.45, 0.49], sharedOut: [0.73, 0.76],
  fly: [0.41, 0.5], mark: [0.5, 0.54],
  peel: [0.55, 0.58], carry: [0.58, 0.69],
  hop: [0.55, 0.6], mark2: [0.6, 0.63], toCard: [0.63, 0.69], frame: [0.67, 0.7], lift: [0.66, 0.7], write: [0.7, 0.76], back: [0.76, 0.8],
  guide: [0.78, 0.88], tags: [0.8, 0.86], notes: [0.86, 0.93],
};

const STRINGS = {
  en: {request: 'Request', quoted: 'Quoted from the page', annotated: 'Annotated inference', same: 'Same'},
  es: {request: 'Solicitud', quoted: 'Citado de la página', annotated: 'Inferencia anotada', same: 'Igual'},
};

const {query: _q, ...researchBase} = extractionFields;
const sceneSchema = {
  ...researchBase,
  query: obj('The request typed in each scene (the only thing that differs); mode, ¶ and basis are supplied by the author', {a: requestField, b: requestField}, ['a', 'b']),
  ...contrastFields(),
};

const defaultParams = {
  query: {
    a: {label: 'When the goods were collected', mode: 'documented', sentence: 2, basis: [2], note: ''},
    b: {label: 'When the goods reached Party B', mode: 'inference', sentence: 2, basis: [2, 3], note: 'Goods reached Party B by Day 4'},
  },
  sources: {...SOURCES_EN, sentences: SOURCES_EN.sentences.filter((_, i) => i !== 3)},
  citations: {page: 'p. 12', pinpoint: '¶'},
  dates: {source: 'Day 7', extracted: 'Day 9'},
  scenarioA: {label: 'Documented fact', caption: 'The page states what was asked'},
  scenarioB: {label: 'Annotated inference', caption: 'The page does not state it; a note is written'},
  changedFact: 'Only the request differs: the page states it in A, not in B',
  sharedFacts: ['Same volume and page', 'Same card', 'Same flag and timing'],
  comparisonLabels: {guide: 'Changed fact: what the user asked for', neutral: 'Both entries stay on file as written; no conclusion is drawn from either'},
};

const M = 14;
const STAND = 26;

/**
 * Sizes per layout shape (design units). The design space is fitted into the
 * caption-safe box at ≈0.82 (16:9), ≈0.84 (1:1) and ≈0.97 (9:16) px per unit
 * at 1080p. The fact that changes (page sentences ¶2/¶3, A's copy, B's note)
 * gets priority size (≥ 20 px); chrome (request title, card header) is smaller.
 */
const SZ = {
  landscape: {text: 28, min: 25, label: 34, cap: 25, chip: 26, req: 26, reqTitle: 20, cardTitle: 24, tag: 24, lane: 134, pen: 118},
  square: {text: 26, min: 24, label: 28, cap: 24, chip: 25, req: 25, reqTitle: 17, cardTitle: 22, tag: 23, lane: 0, pen: 104},
  portrait: {text: 25, min: 21.5, label: 30, cap: 23, chip: 24, req: 24, reqTitle: 19, cardTitle: 23, tag: 22, lane: 134, pen: 110},
};

/**
 * Scenario header: letter badge (a coloured disc that stays with labels hidden), the scenario
 * label and its caption on a second line.
 */
function header(ctx, o) {
  const th = ctx.theme;
  const R = o.label * 0.62;
  const cy = o.y + R + 2;
  const parts = [h('circle', {cx: o.x + R, cy, r: R, fill: o.color, stroke: th.ink, 'stroke-width': 2.5})];
  if (ctx.show('key')) {
    parts.push(h('text', {x: o.x + R, y: cy + o.label * 0.34, 'text-anchor': 'middle', 'font-size': r(o.label * 0.95), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter));
    const f = ctx.fit(o.text, {maxWidth: o.w - R * 2 - 20, size: o.label, minSize: o.label * 0.75, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: o.x + R * 2 + 14, y: o.y, fill: th.fg}));
    if (o.capFit && ctx.show('all')) parts.push(textBlock(o.capFit, {x: o.x + R * 2 + 14, y: o.y + f.size * 1.26 + 5, fill: th.fgSoft}));
  }
  return g({name: o.name}, parts);
}

/** Scenario caption: one line, or two balanced lines rather than being cut. */
function captionFit(ctx, text, w, S, cap = S.cap) {
  const mw = w - S.label * 0.62 * 2 - 20;
  const one = ctx.fit(text, {maxWidth: mw, size: cap, minSize: cap * 0.85, maxLines: 1, weight: 500});
  return one.truncated ? fitBalanced(ctx, text, {maxWidth: mw, size: cap, minSize: cap * 0.85, maxLines: 2, weight: 500}) : one;
}

/**
 * Chip max width that splits a wrapped text into lines of similar length (no one-word last line),
 * never narrower than the longest word plus the chip's padding.
 */
function balancedMax(ctx, text, o) {
  const c = chip(ctx, text, {...o, x: 0, y: 0});
  const n = c.fit.lines.length;
  if (n < 2 || c.fit.truncated) return o.maxWidth;
  const longest = Math.max(...String(text).split(/\s+/).map(w => ctx.measure(w, c.fit.size, o.weight ?? 600, 'sans'))) + o.size * 1.2 + 2;
  let lo = Math.max(c.box.w / n, longest), hi = o.maxWidth;
  for (let k = 0; k < 12; k++) {
    const mid = (lo + hi) / 2;
    const cc = chip(ctx, text, {...o, x: 0, y: 0, maxWidth: mid});
    if (!cc.fit.truncated && cc.fit.lines.length === n && cc.fit.size === c.fit.size) hi = mid;
    else lo = mid;
  }
  return Math.min(o.maxWidth, Math.ceil(hi) + 1);
}

/** Shift an explicit stage geometry by (dx, dy). */
function shift(geo, dx, dy) {
  const s = b => (b ? {...b, x: b.x + dx, y: b.y + dy} : b);
  return {...geo, shelf: s(geo.shelf), panel: s(geo.panel), book: s(geo.book), card: s(geo.card), laneX: geo.laneX + dx, flyGapY: geo.flyGapY != null ? geo.flyGapY + dy : undefined,
    penRest: geo.penRest && {x: geo.penRest.x + dx, y: geo.penRest.y + dy}};
}

/**
 * Per-scene geometry (scene-local coordinates) for a panel of pw × ph.
 * wide (16:9, 9:16): request box across the top; the open book on the left; the card beside
 *   it with its entry at the height of the copied sentence (the copy only moves sideways), the
 *   library bay under the card; flags drop into the gap under the request box and run down the
 *   lane beside the page (they never cross the card).
 * tall (1:1): request row, open book, card underneath (no library bay: it is the same in A and B).
 */
function panelGeometry(variant, pw, ph, panelH, card, S, tagW = 0, titleMax = undefined, tight = false, kindSize = S.tag) {
  const cardH = card.h;
  if (variant === 'tall') {
    // compact chrome: the page header keeps volume · date · page, the card keeps its title and
    // carries the entry's kind tag in its header; the pen rests under the entry
    // (`tight`, the last resort for very long text: thinner request title bar, smaller gaps and a
    // shorter card foot, so the page text keeps its size)
    const bookW = pw - 96;
    const rowY = panelH + (tight ? 8 : 12);
    return {
      // (a long request takes two lines at a slightly smaller size before a third line: the height
      // goes to the page and the card, which show the changed fact too)
      panel: {x: 0, y: 0, w: pw - (FLAG.w - FLAG.stick) - 4, parkSide: 'right', labelSize: S.req, rowMin: 54, titleMin: 30, titleSize: S.reqTitle, titlePad: tight ? 12 : undefined, compact: true, labelMinFrac: 0.78, labelMaxLines: 3, labelOneLine: true},
      book: {x: 0, y: rowY, w: bookW, h: ph - rowY - (tight ? 10 : 14) - cardH, leftW: 16, standH: 0, titleSize: 22, noTitle: true, maxLines: 4, idWrap: false, padT: tight ? 9 : 10, ruleGap: tight ? 10 : 12, rowGap: tight ? 10 : undefined, padL: 44, padR: 18},
      // (the entry's kind tag stands in the card's header, `kindTop` under its top edge)
      card: {x: 0, y: ph - cardH, w: tallCardW(pw), h: cardH, titleSize: S.cardTitle, titleMax, titleLines: 2, sourceMinY: tight ? kindSize * 1.75 + 16 : S.tag * 1.75 + 14, sourceSize: 17, noSource: true, stripX: 10, bottomPad: tight ? 40 : undefined, notePadY: tight ? 8 : undefined},
      kindTop: tight ? 8 : 10,
      shelf: null,
      laneX: bookW + 4,
      laneMax: tallLaneMax(pw),
      cardSide: 'below',
      hopStraight: true,
      // (the pen rests level at the card's lower left, under the entry and left of the punch hole)
      penRest: {x: 26, y: ph - (tight ? 13.5 : 15)},
      penAngle: -3,
      tagInHeader: true,
    };
  }
  const lane = S.lane;
  const bookW = Math.floor((pw - lane - 33) / 2);
  const cardX = bookW + lane;
  const cardW = pw - cardX;
  const rowY = panelH + 16 + (card.bookShift || 0);
  const cardY = card.y ?? rowY + 60;
  const shelfY = cardY + cardH + 16;
  const low = penLow(pw, cardX, S, tagW);
  return {
    panel: {x: 0, y: 0, w: pw - (FLAG.w - FLAG.stick) - 4, parkSide: 'right', labelSize: S.req, rowMin: 56, titleMin: 36, titleSize: S.reqTitle, compact: true, labelMinFrac: 0.85, labelMaxLines: 3},
    // (page chrome stays on one line: the height goes to the sentences that change between A and B)
    book: {x: 0, y: rowY, w: bookW, h: ph - rowY - STAND, leftW: 30, standH: STAND, titleSize: 24, maxLines: 4, idWrap: false},
    card: {x: cardX, y: cardY, w: cardW, h: cardH, titleSize: S.cardTitle, sourceSize: 18},
    shelf: ph - shelfY >= 72 ? {x: cardX, y: shelfY, w: cardW, h: ph - shelfY, rows: ph - shelfY > 190 ? 2 : 1, gapRow: 0, gapAt: 0.55, plateSize: S.chip, plateW: 0.7, plate: ph - shelfY >= 118} : null,
    laneX: bookW + 4,
    flyGapY: panelH + 8 + (card.bookShift || 0) / 2,
    cardSide: 'right',
    hopStraight: true,
    // the pen rests right of the entry's kind tag, or — on a card too narrow for both — on its own
    // lane under the tag row, at the card's lower right
    penRest: low ? {x: pw - S.pen * 0.98 - 14, y: cardY + cardH - 13} : {x: cardX + 22 + tagW + 22, y: cardY + cardH - 22},
    penAngle: low ? -4 : -12,
  };
}

/** Tall variant: the lane the flags run down beside the page (the flag's left edge, as far right as the scene allows). */
const tallLaneMax = pw => pw - FLAG.w + 16;

/**
 * Tall variant: the card ends short of that lane (≥ 16 units of clearance, so a flag running down the
 * lane never touches the card's header); a flag enters its slot through the card's right edge and the
 * filed flag's tab stands out past that edge like an index tab.
 */
const tallCardW = pw => Math.min(pw, pw - 96 - 14, tallLaneMax(pw) - 16);

/** Whether the pen needs its own lane under the kind tag (wide variant). */
function penLow(pw, cardX, S, tagW) {
  return cardX + 22 + tagW + 22 + S.pen * 0.98 > pw - 6;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1040, 880], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const S = SZ[shape];
    const D = ctx.design;
    const n = p.sources.sentences.length;
    const arrangement = shape === 'portrait' ? 'column' : 'row';
    const variant = shape === 'square' ? 'tall' : 'wide';
    const showAll = ctx.show('all');
    // bottom strip: the changed fact (while it is introduced), the shared facts (during the action)
    // and the neutral note (at the end); the guide's own caption sits ON the guide
    const botMax = D.w - 2 * M;
    const chipH = text => chip(ctx, text, {x: 0, y: 0, maxWidth: botMax, size: S.chip, maxLines: 2}).box.h;
    const sharedText = p.sharedFacts.join(' · ');
    const botH = showAll ? Math.max(chipH(p.comparisonLabels.neutral), chipH(p.changedFact), sharedText ? chipH(sharedText) : 0) + 10 : 0;
    const gMax = arrangement === 'row' ? Math.min(760, D.w - 2 * M) : D.w - 2 * M - 60;
    const gW = showAll ? balancedMax(ctx, p.comparisonLabels.guide, {maxWidth: gMax, size: S.chip, maxLines: 2}) : gMax;
    const guideProbe = showAll ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: gW, size: S.chip, maxLines: 2}).box : {w: 0, h: 0};
    const guideLane = arrangement === 'row' ? Math.max(34, guideProbe.h + 8) : 34;
    const gap = arrangement === 'row' ? 40 : Math.max(48, guideProbe.h + 18);
    // scenario captions: one line, or two balanced lines (never cut); both headers share the height
    // (tight: the last resort for very long text — a slightly smaller caption and a smaller gap under it)
    const hdrW = arrangement === 'row' ? (D.w - 2 * M - gap) / 2 : D.w - 2 * M - guideLane - 4;
    const pw = arrangement === 'row' ? (D.w - 2 * M - gap) / 2 : D.w - 2 * M - guideLane;
    const frameFor = tight => {
      const cap = tight ? S.cap - 2 : S.cap;
      const capFits = [p.scenarioA, p.scenarioB].map(sc => (sc.caption && showAll ? captionFit(ctx, sc.caption, hdrW, S, cap) : null));
      const capLines = Math.max(1, ...capFits.map(f => (f ? f.lines.length : 1)));
      const hdr = ctx.show('key') ? Math.round(S.label * 1.26 + (showAll ? cap * 1.2 * capLines + 5 : 0) + (tight ? 8 : 14)) : 44;
      // (tight: the guide lane and the bottom strip keep 4 units less room around their chips)
      const lane = arrangement === 'row' && tight ? Math.max(34, guideProbe.h + 4) : guideLane;
      const bot = tight && botH ? botH - 4 : botH;
      const ph = arrangement === 'row' ? D.h - 2 * M - hdr - lane - bot : (D.h - 2 * M - 2 * hdr - gap - bot) / 2;
      const origins = arrangement === 'row'
        ? [{x: M, y: M + hdr + lane}, {x: M + pw + gap, y: M + hdr + lane}]
        : [{x: M + guideLane, y: M + hdr}, {x: M + guideLane, y: M + hdr + ph + gap + hdr}];
      const headerAt = i => (arrangement === 'row' ? {x: origins[i].x, y: M, w: pw} : {x: M + guideLane + 4, y: origins[i].y - hdr, w: D.w - 2 * M - guideLane - 4});
      return {tight, cap, capFits, hdr, ph, origins, headerAt, lane, bot};
    };

    const pal = [th.accent3, th.accent2, th.accent4];
    const reqs = ['a', 'b'].map(k => p.query[k]);
    const facts = reqs.map(q => {
      const s = sentenceIndex(q.sentence ?? 1, n);
      const basis = (q.basis && q.basis.length ? q.basis : [q.sentence ?? 1]).map(b => sentenceIndex(b, n));
      return q.mode === 'inference'
        ? {label: q.label, mode: 'annotate', basis, note: q.note || '', icon: 'note', color: {flag: pal[0], band: pal[0], tabInk: th.ink}}
        : {label: q.label, mode: 'quote', sentence: s, icon: 'quote', color: {flag: pal[0], band: pal[0], tabInk: th.ink}};
    });
    const labels = {library: p.sources.library, search: t.request, card: EXTRACTION_STRINGS[p.locale === 'es' ? 'es' : 'en'].card};
    const tagW = ctx.show('key') ? Math.max(...[t.quoted, t.annotated].map(x => statusTag(ctx, x, {x: 0, y: 0, size: S.tag}).box.w)) : 0;
    // tall variant: the entry's kind tag shares the card's header with the card title — the tag keeps
    // the largest size (≥ 0.8×) that leaves the title its room on one line; when even the smallest tag
    // leaves no room, the title wraps to two lines at its size (never cut) and the tag takes the
    // largest size that fits beside the wrapped title
    const tallCardWidth = tallCardW(pw);
    const spacing = 0.6 * labels.card.length;
    const titleW = ctx.measure(labels.card, S.cardTitle, 800, 'sans') + spacing;
    const words = String(labels.card).split(/\s+/);
    const titleW2 = words.length < 2 ? titleW : Math.min(...words.slice(1).map((_, k) => Math.max(
      ctx.measure(words.slice(0, k + 1).join(' '), S.cardTitle, 800, 'sans'), ctx.measure(words.slice(k + 1).join(' '), S.cardTitle, 800, 'sans')))) + spacing;
    const kindW = sz => Math.max(...[t.quoted, t.annotated].map(x => statusTag(ctx, x, {x: 0, y: 0, size: sz}).box.w));
    const beside = (tw, sz) => 26 + tw + 16 + kindW(sz) + 16 <= tallCardWidth;
    const kindFor = tw => {
      let sz = S.tag;
      while (sz > S.tag * 0.8 && !beside(tw, sz)) sz -= 0.5;
      return sz;
    };
    let kindSize = ctx.show('key') ? kindFor(titleW) : S.tag;
    if (ctx.show('key') && !beside(titleW, kindSize)) kindSize = kindFor(titleW2);
    const tallTitleMax = ctx.show('key') ? Math.max(90, tallCardWidth - 26 - 16 - kindW(kindSize) - 16) : undefined;
    const fitVariant = variant => {
      // the request boxes share one height (the longer request decides) so both scenes stay aligned
      // (both request rows take the taller row's height, so both boxes are exactly panelH tall)
      // (one line per request only when BOTH requests keep ≥ 90% of the size on one line; otherwise both
      // wrap at the full size — the two requests are never drawn at visibly different sizes)
      const panelFor = tight => {
        const probeGeo = panelGeometry(variant, pw, 1000, 0, {h: 200}, S, tagW, tallTitleMax, tight, kindSize);
        const panelOpts = (k, one) => ({prefix: 'probe', title: labels.search, requests: [{label: facts[k].label, color: pal[0], icon: facts[k].icon}], parkSide: 'right', compact: true, ...probeGeo.panel, labelOneLine: one && probeGeo.panel.labelOneLine});
        let probes = [0, 1].map(k => requestPanel(ctx, {...panelOpts(k, true), w: probeGeo.panel.w}));
        const oneLine = Boolean(probeGeo.panel.labelOneLine) && probes.every(q => q.rows[0].fit.lines.length === 1 && q.rows[0].fit.size >= S.req * 0.9 - 1e-9);
        if (!oneLine) probes = [0, 1].map(k => requestPanel(ctx, {...panelOpts(k, false), w: probeGeo.panel.w}));
        return {panelH: Math.max(...probes.map(q => q.h)), rowH: Math.max(...probes.map(q => q.rows[0].h)), oneLine};
      };
      const frames = [false, true].map(tight => ({...frameFor(tight), ...panelFor(tight)}));
      // sentences neither request uses may be condensed to simulated lines — identically in both scenes
      const used = new Set(facts.flatMap(f => (f.mode === 'annotate' ? f.basis : [f.sentence])));
      const unused = p.sources.sentences.map((_, i) => i).filter(i => !used.has(i));
      // the copied sentence's row: A's (or B's) first sentence — the card's entry sits level with it
      const rowSentence = facts[0].mode === 'quote' ? facts[0].sentence : facts[1].mode === 'quote' ? facts[1].sentence : facts[0].basis[0];
      const build = (F, k, geo, size, condense) => extractionStage(ctx, {prefix: k ? 'b' : 'a', geo: shift({...geo, panel: {...geo.panel, rowMin: F.rowH, labelOneLine: F.oneLine && geo.panel.labelOneLine}, book: {...geo.book, size, minSize: size}}, F.origins[k].x, F.origins[k].y),
        sources: p.sources, facts: [facts[k]], citations: p.citations, dates: p.dates, labels, typing: true, iconsLate: true, pen: true, penRest: {x: F.origins[k].x + geo.penRest.x, y: F.origins[k].y + geo.penRest.y}, penAngle: geo.penAngle ?? -12, penLength: S.pen,
        condense: condense === true ? unused : [], omit: condense === 'omit' ? unused : [], rollCopies: true, noteMinSize: Math.min(size, S.min), noteMaxLines: 4});
      // text size: the largest that fits both scenes (condensing unrequested sentences only when needed;
      // as the last resort before a smaller size, the page is shown as an excerpt: the unrequested
      // sentences are left out, an ellipsis marks where)
      const tagH = variant === 'tall' ? 0 : S.tag * 1.75;
      let stages = null;
      const tries = [];
      for (let size = S.text; size >= S.min - 1e-9; size -= 1) tries.push({size, condense: false});
      for (let size = S.text; size >= S.min - 1e-9; size -= 1) tries.push({size, condense: true});
      if (unused.length) for (let size = S.text; size >= S.min - 1e-9; size -= 0.5) tries.push({size, condense: 'omit'});
      // (below the preferred minimum: half steps first, so the largest size that fits is found)
      for (let size = S.min; size >= 14; size -= (size > S.min - 3 ? 0.5 : 1)) tries.push({size, condense: unused.length ? 'omit' : true});
      for (const {size, condense} of tries) {
        // (the excerpt stage also tightens the chrome)
        const F = frames[condense === 'omit' ? 1 : 0];
        const {ph, panelH, origins, tight} = F;
        // pass 1: the card's height; pass 2 (wide): the entry level with the copied sentence
        let card = {h: 240};
        let geo = panelGeometry(variant, pw, ph, panelH, card, S, tagW, tallTitleMax, tight, kindSize);
        let st = [0, 1].map(k => build(F, k, geo, size, condense));
        card = {h: Math.max(...st.map(x => x.cardNeedH)) + (variant === 'tall' ? -10 : tagH - 18 + (penLow(pw, geo.card.x, S, tagW) ? 16 : 0))};
        geo = panelGeometry(variant, pw, ph, panelH, card, S, tagW, tallTitleMax, tight, kindSize);
        st = [0, 1].map(k => build(F, k, geo, size, condense));
        if (variant === 'wide') {
          const A = st[0];
          const rowY = A.sentenceBox(rowSentence).y + A.sentenceBox(rowSentence).h / 2 - origins[0].y;
          const slotTop = A.card.slots[0].y;
          const firstH = Math.max(...st.map(x => x.items[0].kind === 'strip' ? x.items[0].strip.h : x.items[0].note.h));
          let cy = rowY - slotTop - firstH / 2;
          // the gap under the request box keeps room for a flag to pass (the page moves down if needed)
          const bookShift = Math.max(0, panelH + 72 - cy);
          cy += bookShift;
          card = {...card, y: cy, bookShift};
          geo = panelGeometry(variant, pw, ph, panelH, card, S, tagW, tallTitleMax, tight, kindSize);
          st = [0, 1].map(k => build(F, k, geo, size, condense));
        }
        const over = Math.max(...st.map(x => x.pageOverflow + x.cardOverflow), variant === 'wide' ? Math.max(0, st[0].cardBox.y + st[0].cardBox.h - (origins[0].y + ph)) : 0);
        if (!stages || over < stages.over) stages = {st, geo, size, over, condense, F};
        if (over <= 6) break;
      }
      return stages;
    };
    // 9:16: the wide scene (card beside the page) unless very long text needs the full width
    let stages = fitVariant(variant);
    if (shape === 'portrait' && (stages.size < S.min || stages.condense === 'omit')) {
      const tall = fitVariant('tall');
      if (tall.over <= 6 && tall.size > stages.size) stages = tall;
    }
    const [A, B] = stages.st;
    const {origins, headerAt, capFits, ph, cap, lane, bot} = stages.F;

    // --- headers
    const colors = [th.accent2, th.accent2];
    const headers = [0, 1].map(i => {
      const hb = headerAt(i);
      const sc = i ? p.scenarioB : p.scenarioA;
      return header(ctx, {name: `hdr-${i}`, letter: i ? 'B' : 'A', text: sc.label, capFit: capFits[i], x: hb.x, y: hb.y + 2, w: hb.w, label: S.label, cap, color: colors[i]});
    });

    // --- entry-kind tags inside each card, under the entry (clear of the pen at the card's bottom-right)
    const kindTags = [];
    if (ctx.show('key')) {
      [A, B].forEach((st, i) => {
        const f = st.facts[0];
        const text = f.mode === 'annotate' ? t.annotated : t.quoted;
        const sb = st.slotBox(0);
        const cb = st.cardBox;
        kindTags.push(stages.geo.tagInHeader
          ? statusTag(ctx, text, {x: cb.x + cb.w - 16, y: cb.y + stages.geo.kindTop, anchor: 'end', size: kindSize, maxWidth: cb.w - 26 - 16 - 90, name: `kind-${i}`, color: th.inkSoft, opacity: 0})
          : statusTag(ctx, text, {x: sb.x, y: sb.y + sb.h + 10, anchor: 'start', size: S.tag, maxWidth: cb.w - 40, name: `kind-${i}`, color: th.inkSoft, opacity: 0}));
      });
    }

    // --- rings around the two request rows (the changed detail) and the guide linking them
    const rowBox = st => {
      const row = st.panel.rows[0];
      const pb = st.panelBox;
      return {x: pb.x + 8, y: pb.y + row.y + 2, w: pb.w - 16, h: row.h - 4};
    };
    const rA = rowBox(A), rB = rowBox(B);
    const rings = [rA, rB].map((b, i) => h('path', {name: `ring-${i}`, d: roundRectPath(b.x - 4, b.y - 4, b.w + 8, b.h + 8, (b.h + 8) / 2), fill: 'none', stroke: th.accent, 'stroke-width': 4, opacity: 0}));
    let guidePts;
    let guideCap = null;
    if (arrangement === 'row') {
      const yl = origins[0].y - lane / 2 - 2;
      const xa = rA.x + rA.w * 0.5, xb = rB.x + rB.w * 0.5;
      guidePts = [{x: xa, y: rA.y - 4}, {x: xa, y: yl}, {x: xb, y: yl}, {x: xb, y: rB.y - 4}];
      // the guide's caption sits on the guide, halfway between the two requests
      if (showAll) guideCap = chip(ctx, p.comparisonLabels.guide, {x: (xa + xb) / 2, y: yl - guideProbe.h / 2, anchor: 'middle', maxWidth: gW, size: S.chip, maxLines: 2, fill: th.card, stroke: th.accent, name: 'cap-guide'});
    } else {
      const xl = M + guideLane / 2 - 2;
      const ya = rA.y + rA.h / 2, yb = rB.y + rB.h / 2;
      guidePts = [{x: rA.x - 4, y: ya}, {x: xl, y: ya}, {x: xl, y: yb}, {x: rB.x - 4, y: yb}];
      // the guide's caption sits on the guide where it passes between the two scenes
      if (showAll) guideCap = chip(ctx, p.comparisonLabels.guide, {x: xl - 12, y: origins[0].y + ph + gap / 2 - guideProbe.h / 2, anchor: 'start', maxWidth: gW, size: S.chip, maxLines: 2, fill: th.card, stroke: th.accent, name: 'cap-guide'});
    }
    const guidePoly = polyline(guidePts);
    const guideLen = guidePoly.total;
    const guide = h('path', {name: 'guide', d: guidePoly.d(1), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(guideLen)} ${r(guideLen + 10)}`, 'stroke-dashoffset': r(guideLen), opacity: 0});
    const guideDots = guidePts.filter((_, i) => i === 0 || i === guidePts.length - 1).map((q, i) => h('circle', {name: `guide-dot-${i}`, cx: q.x, cy: q.y, r: 7, fill: th.accent, stroke: th.paper, 'stroke-width': 2.5, opacity: 0}));

    // --- bottom strip chips
    const botY = D.h - M - bot + 6;
    const bottom = {};
    if (showAll) {
      const mid = D.w / 2;
      // (balanced widths: a wrapped chip never ends with one word alone)
      const bw = (text, weight = 600) => balancedMax(ctx, text, {maxWidth: botMax, size: S.chip, maxLines: 2, weight});
      bottom.changed = chip(ctx, p.changedFact, {x: mid, y: botY, anchor: 'middle', maxWidth: bw(p.changedFact), size: S.chip, maxLines: 2, fill: th.card, stroke: th.accent, name: 'cap-changed'});
      if (sharedText) bottom.shared = chip(ctx, sharedText, {x: mid, y: botY, anchor: 'middle', maxWidth: bw(sharedText, 500), size: S.chip, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: 'cap-shared', weight: 500});
      bottom.neutral = chip(ctx, p.comparisonLabels.neutral, {x: mid, y: botY, anchor: 'middle', maxWidth: bw(p.comparisonLabels.neutral, 500), size: S.chip, maxLines: 2, fill: th.card, stroke: th.inkSoft, name: 'cap-neutral', weight: 500});
    }
    // (the caption is ON the guide: some point of the guide lies inside its chip)
    const capOnGuide = !guideCap || Array.from({length: 41}, (_, k) => guidePoly.at(k / 40)).some(q => q.x >= guideCap.box.x && q.x <= guideCap.box.x + guideCap.box.w && q.y >= guideCap.box.y && q.y <= guideCap.box.y + guideCap.box.h);
    return {A, B, headers, kindTags, rings, guide, guideLen, guideDots, guideCap, capOnGuide, bottom, arrangement, origins, fitSize: stages.size, condensed: stages.condense};
  },
  build(ctx, L) {
    const b = L.bottom;
    return g(null,
      L.headers,
      L.A.node, L.B.node,
      L.kindTags.map(k => k.node),
      L.rings, L.guide, L.guideDots,
      L.guideCap && g({name: 'guide-cap', opacity: 0}, L.guideCap.node),
      b.changed && g({name: 'bot-changed', opacity: 0}, b.changed.node),
      b.shared && g({name: 'bot-shared', opacity: 0}, b.shared.node),
      b.neutral && g({name: 'bot-final', opacity: 0}, b.neutral.node),
    );
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    const nodes = {};
    const sem = {};
    const typed = s('type');
    const icon = s('icon');
    [L.A, L.B].forEach((st, i) => {
      const f = st.facts[0];
      const ph = f.mode === 'annotate'
        ? {fly: s('fly'), mark: s('mark'), hop: s('hop'), mark2: s('mark2'), toCard: s('toCard'), write: s('write'), frame: s('frame')}
        : {fly: s('fly'), mark: s('mark'), peel: s('peel'), carry: s('carry')};
      const pen = f.mode === 'annotate' ? {k: 0, lift: s('lift'), write: s('write'), back: s('back')} : {k: -1};
      const posed = st.pose({facts: [ph], typing: [typed], icons: [icon], ticks: [0], pen});
      Object.assign(nodes, posed.nodes);
      const key = i ? 'b' : 'a';
      const o = L.origins[i];
      const fl = posed.semantic.flags[0];
      sem[`${key}Flag`] = fl;
      sem[`${key}FlagLocal`] = {x: r(fl.x - o.x), y: r(fl.y - o.y)};
      sem[`${key}Strip`] = posed.semantic.strips[0];
      sem[`${key}CopyShown`] = posed.semantic.shown[0];
      sem[`${key}Pen`] = posed.semantic.penTip;
      sem[key] = {
        holder: posed.semantic.holders[0],
        marks: posed.semantic.marks[0],
        mode: f.mode === 'annotate' ? 'inference' : 'documented',
        pinpoints: f.mode === 'annotate' ? f.basis.map(b => b + 1) : [f.sentence + 1],
        entry: f.mode === 'annotate' ? (ph.write >= 1 ? 'note' : ph.write > 0 ? 'writing' : 'none') : (posed.semantic.docked[0] ? 'strip' : posed.semantic.strips[0] ? 'strip-moving' : 'none'),
        copiedFromPage: f.mode !== 'annotate' && posed.semantic.strips[0] !== null,
      };
    });
    const ring = s('ring');
    L.rings.forEach((_, i) => { nodes[`ring-${i}`] = {opacity: r(u < W.guide[0] ? ring * (1 - 0.6 * seg(u, 0.4, 0.46)) : 1, 3)}; });
    const gp = s('guide');
    nodes.guide = {opacity: gp > 0 ? 1 : 0, 'stroke-dashoffset': r(L.guideLen * (1 - gp))};
    L.guideDots.forEach((_, i) => { nodes[`guide-dot-${i}`] = {opacity: gp > (i ? 0.97 : 0) ? 1 : 0}; });
    L.kindTags.forEach((_, i) => { nodes[`kind-${i}`] = {opacity: r(s('tags'), 3)}; });
    if (L.bottom.changed) nodes['bot-changed'] = {opacity: r(s('changed') * (1 - s('changedOut')), 3)};
    if (L.bottom.shared) nodes['bot-shared'] = {opacity: r(s('shared') * (1 - s('sharedOut')), 3)};
    if (L.guideCap) nodes['guide-cap'] = {opacity: r(seg(u, 0.84, 0.9), 3)};
    if (L.bottom.neutral) nodes['bot-final'] = {opacity: r(s('notes'), 3)};
    const beat = u < BEATS.change[0] ? 'base' : u < BEATS.parallel[0] ? 'change' : u < BEATS.guide[0] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        ...sem,
        typed: r(typed, 3),
        changedDetail: 'request',
        guideProgress: r(gp, 3),
        arrangement: L.arrangement,
        pageSize: L.fitSize,
        guideCaptionOnGuide: L.capOnGuide,
        condensed: Boolean(L.condensed),
        excerpt: L.condensed === 'omit',
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
    slug: 'research-07-contrast',
    title: 'Fact extraction — documented fact vs annotated inference',
    titleEs: 'Extracción de hechos — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Extracción de hechos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical library scenes (same volume, page, card, pen and flag). Only the typed request differs: in A the page states the fact, so the flag rolls up a copy of ¶2 and unrolls it on the card; in B it does not, so the flag marks ¶2 and ¶3 as the basis and the pen writes an annotated-inference note. A captioned guide links the two requests; neutral note, no winner.',
    tags: ['fact extraction', 'documented fact', 'inference', 'annotation', 'contrast', 'index flag', 'index card', 'quote', 'research'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/extraccion-de-hechos.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
