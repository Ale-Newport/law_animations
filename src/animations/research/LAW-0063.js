/**
 * LAW-0063 — Fuente primaria y comentario · contrast
 *
 * Storyboard (two complete, identical reading boards; exactly ONE fact
 * differs — what the side note beside passage ¶n carries):
 *   A "Source text": the side note is a copied strip of the passage's own
 *     words (same serif, underlined), cut from the page as a COPY.
 *   B "Commentator's interpretation": the side note is the commentator's
 *     index card (ochre band, italic, attributed), taken from the
 *     commentaries shelf.
 *  0.00–0.17  base: identical boards in both panels — library shelf units
 *             (source texts left, commentaries right), source page pinned in
 *             the left column, empty margin column behind a dashed gutter.
 *  0.17–0.40  change: A underlines the exact words of the passage line by
 *             line; B brackets the same passage and the commentary volume
 *             lights up on its shelf. The changed fact is named.
 *  0.40–0.77  parallel action: in A a copy of the underlined words slides
 *             out from beneath the page (the original stays, a dashed trace
 *             marks what was copied) and travels right across the gutter into
 *             the margin column; in B the card slides down out of the commentary
 *             shelf into the margin column. Both are pinned and tied by a
 *             thread to the same passage — beside it, never on it.
 *  0.77–1.00  guide: a neutral line joins the two side notes (the changed
 *             detail); shared facts, then a neutral note. No winner, no score,
 *             no legal consequence.
 * Row (side by side) on wide boxes, shelves above each board; column (stacked)
 * on tall boxes with the guide running in a lane outside the panels. Square
 * boxes stack the pair too, but each board is flanked by two narrow bookcases
 * (source texts left, commentaries right: B's card slides out of the right one)
 * and the page is fitted to its passages, so the pair fills the caption-safe
 * box; there the guide drops straight from A's side note to B's.
 * @module animations/research/LAW-0063
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry} from '../../frameworks/paired.js';
import {
  fpcContentFields, FPC_DEFAULTS, FPC_STRINGS, fpcColors, linkedPassage, pinLabel,
  sourcePage, noteCard, corkBoard, bookcase, pushPin, threadD, stateChip, polyGuide, scenarioTitle,
} from './kits/fuente-primaria-y-comentario.js';

const ID = 'LAW-0063';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  mark: [0.18, 0.32], glow: [0.28, 0.38], lift: [0.4, 0.44], travel: [0.42, 0.62], emerge: [0.42, 0.62],
  pin: [0.63, 0.67], thread: [0.66, 0.72], tags: [0.72, 0.77], guide: [0.78, 0.9],
  changeIn: [0.2, 0.26], changeOut: [0.4, 0.43], sharedIn: [0.45, 0.5], sharedOut: [0.77, 0.8],
  guideLabel: [0.86, 0.92], neutral: [0.84, 0.9],
};
const SAG = 12;

const sceneSchema = {...fpcContentFields, ...contrastFields()};

const defaultParams = {
  ...FPC_DEFAULTS,
  scenarioA: {label: 'Source text', caption: 'The side note copies the words of ¶2'},
  scenarioB: {label: 'Commentator’s interpretation', caption: 'The side note gives R. Ferrer’s reading of ¶2'},
  changedFact: 'Only one fact differs: what the side note beside ¶2 carries',
  sharedFacts: ['Same source page', 'Same passage ¶2', 'Same board and gutter'],
  comparisonLabels: {guide: 'Changed fact: the side note’s content', neutral: 'Two side notes, both kept beside the text — neither is ranked or preferred'},
};

/** Panel stage per layout shape (panel-local units). */
const STAGES = {
  landscape: {arrangement: 'row', pw: 900, ph: 650, shelfH: 100, header: 100, gap: 70, text: 21, title: 24, side: 22, chip: 26, tag: 22, lane: 0},
  // square: each board is flanked by two narrow bookcases (source texts left, commentaries
  // right) instead of a shelf row above it, so the stacked pair is wide and short enough to
  // fill the caption-safe box; the page height is fitted to its passages (no empty slots) and
  // the closing guide runs straight down from A's side note to B's (no side lane).
  // (pw is derived: page + gutter + a margin column as wide as the copied strip, + bookcases)
  square: {arrangement: 'column', sideShelves: true, shelfW: 90, shelfGap: 10, inset: 22, pageInner: 500, padL: 62, padR: 58, gutterGap: 40,
    header: 94, gap: 16, text: 24.5, title: 27, side: 25, cardHead: 24, cardFoot: 24, chip: 29, tag: 29, titleSize: 44, lane: 0, slotMax: 1300, chipPadY: 0.3},
  portrait: {arrangement: 'column', pw: 840, ph: 520, shelfH: 88, header: 98, gap: 40, text: 20, title: 23, side: 20, chip: 26, tag: 22, lane: 70},
};

/** Room under a side note for its (up to two-line) state tag: offset + tag + the board's frame. */
const tagRoom = size => 16 + size * 2.95 + 38;

/**
 * One complete reading board. variant 'quote' (A) or 'commentary' (B).
 * All geometry is identical between the two variants except the side note.
 * Shelf units sit above the board (row / portrait) or flank it (square, `sideShelves`).
 */
function buildPanel(ctx, o) {
  const th = ctx.theme;
  const C = fpcColors(ctx);
  const p = ctx.params;
  const {prefix: P, variant, pw, ph, shelfH} = o;
  const showAll = ctx.show('all');
  const li = o.li;
  const quote = variant === 'quote';
  const side = !!o.sideShelves;
  // board rectangle inside the panel
  const bx = side ? o.shelfW + o.shelfGap : 0;
  const by = side ? 0 : shelfH + 18;
  const bw = side ? pw - 2 * (o.shelfW + o.shelfGap) : pw;
  const bh = ph - by;
  const inset = side ? o.inset : 26;
  const pageW = side ? o.pageW : Math.round(bw * 0.46);
  const px = bx + inset, py = by + inset, pH = bh - 2 * inset;
  const page = sourcePage(ctx, {prefix: `${P}-src`, w: pageW, h: pH, title: p.sources.sourceTitle, ref: p.citations.source, date: p.dates.source, passages: p.sources.passages, showText: showAll, textSize: o.text, titleSize: o.title, seedKey: 'fpc-c-src',
    ...(side ? {fitSlots: true, padL: o.padL, padR: o.padR} : {})});
  const pas = page.passages[li];
  const gutterX = px + pageW + (side ? o.gutterGap : Math.round(bw * 0.055));
  const board = corkBoard(ctx, {prefix: `${P}-board`, x: bx, y: by, w: bw, h: bh, gutterX, seedKey: 'fpc-c-cork'});
  const pin = {x: px + pas.pin.x, y: py + pas.pin.y};
  const pasY = pin.y;
  const colX0 = gutterX + 14, colX1 = bx + bw - 24;
  const room = side ? tagRoom(o.tag) : 84;

  let sd;
  if (quote) {
    // copied strip: the passage block itself (same wrap, same serif), cut as a copy
    const box = pas.box;
    const tabW = 58, tabH = 38;
    const sideW = colX1 - colX0 - tabW - 6;
    const k = Math.min(1, sideW / box.w);
    const loc = (x, y) => ({x: x - box.x, y: y - box.y});
    const t0 = loc(pas.textX, pas.textY);
    const parts = [
      h('path', {d: roundRectPath(5, 8, box.w, box.h, 4), fill: th.shadow}),
      h('path', {d: roundRectPath(0, 0, box.w, box.h, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}),
      h('rect', {x: 0, y: 0, width: 7, height: r(box.h), fill: C.src}),
      // pinpoint tab on the strip's left edge (points back at the source)
      h('path', {d: `M4 ${r(box.h / 2 - tabH / 2)}H${r(-tabW + tabH * 0.42)}L${r(-tabW)} ${r(box.h / 2)}L${r(-tabW + tabH * 0.42)} ${r(box.h / 2 + tabH / 2)}H4Z`, fill: C.src, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    ];
    if (showAll) {
      parts.push(textBlock(pas.fit, {x: t0.x, y: t0.y, fill: th.ink}));
      const f = ctx.fit(pinLabel(li), {maxWidth: tabW - 22, size: side ? 24 : 20, minSize: 12, maxLines: 1, weight: 800, family: 'serif'});
      parts.push(textBlock(f, {x: -tabW / 2 + 6, y: box.h / 2 - f.size * 0.52, anchor: 'middle', fill: '#fff'}));
    } else {
      const bar = Math.max(6, o.text * 0.36);
      for (let i = 0; i < 3; i++) parts.push(h('rect', {x: r(t0.x), y: r(t0.y + i * bar * 2.1), width: r((box.w - t0.x - 12) * (i === 2 ? 0.55 : 0.92)), height: r(bar), rx: r(bar / 2), fill: th.paperLine}));
      parts.push(h('path', {d: `M${r(-tabW * 0.7)} ${r(box.h / 2)}h${r(tabW * 0.36)}`, stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round'}));
    }
    // copies of the underlines travel with the words
    for (const ln of pas.lines) {
      const a = loc(pas.textX, ln.y);
      parts.push(h('line', {x1: r(a.x), x2: r(a.x + ln.w), y1: r(a.y), y2: r(a.y), stroke: C.src, 'stroke-width': 3.4, 'stroke-linecap': 'round'}));
    }
    const knot = g({name: `${P}-knot`, opacity: 0}, h('circle', {cx: r(-tabW + 10), cy: r(box.h / 2), r: 6, fill: '#fff', stroke: C.link, 'stroke-width': 3}));
    // (square: the strip's words run almost to its right edge, so the pin sits on the corner itself)
    const pinLocal = side ? {x: box.w - 4, y: 0} : {x: box.w - 10, y: 6};
    const pinG = g({name: `${P}-spinT`, transform: T(pinLocal.x, pinLocal.y)}, pushPin(ctx, {name: `${P}-spin`, opacity: 0, radius: 10}));
    const start = {x: px + box.x, y: py + box.y};
    // (room under the side note for its two-line state tag, clear of the board frame)
    const endY = clamp(pasY - box.h * k / 2, by + 30, by + bh - box.h * k - room);
    const end = {x: colX0 + tabW * k + 6, y: endY};
    sd = {
      kind: 'strip', box, k, start, end,
      node: g({name: `${P}-strip`, opacity: 0}, parts, knot, pinG),
      trace: h('path', {name: `${P}-trace`, d: roundRectPath(px + box.x, py + box.y, box.w, box.h, 4), fill: 'none', stroke: C.src, 'stroke-width': 2.5, 'stroke-dasharray': '7 6', opacity: 0}),
      portLocal: {x: -tabW + 3, y: box.h / 2}, pinLocal,
      w: box.w * k, h: box.h * k,
    };
  } else {
    const tabW = 58;
    const sideW = colX1 - colX0 - tabW - 6;
    const sideH = side
      ? Math.round(Math.max(200, Math.min(bh - room - 40, sideW * 0.5)))
      : Math.round(Math.min(bh - 80, Math.max(170, sideW * 0.7)));
    const sizes = side ? {headSize: o.cardHead, footSize: o.cardFoot} : {};
    const probe = noteCard(ctx, {prefix: `${P}-np`, w: sideW, h: sideH, header: '', text: '', pinpoint: pinLabel(li), showText: showAll, tabW, ...sizes});
    const sideY = clamp(pasY - sideH * 0.42, by + 30, by + bh - sideH - room);
    const tabY = clamp(pasY - sideY, probe.bandH + probe.tab.h / 2 + 4, sideH - probe.tab.h / 2 - 8);
    const card = noteCard(ctx, {prefix: `${P}-card`, w: sideW, h: sideH, header: p.sources.commentator, text: p.sources.commentaryText,
      footer: `${p.citations.commentary} · ${p.dates.commentary}`, pinpoint: pinLabel(li), showText: showAll, textSize: o.side, tabW, tabY, ...sizes});
    const end = {x: colX0 + tabW + 6, y: sideY};
    const clipId = `${P}-cclip`;
    // hidden behind the commentary shelf unit at the start: above it (clipped at its lower
    // edge) when the shelves sit on top, beside it (clipped at its middle) when they flank the board
    const start = side ? {x: pw - o.shelfW + tabW + 10, y: end.y} : {x: end.x, y: shelfH - 4 - sideH - 6};
    const clipRect = side
      ? h('rect', {x: -50, y: -50, width: r(pw - o.shelfW / 2 + 50), height: r(ph + 100)})
      : h('rect', {x: -50, y: r(shelfH - 4), width: pw + 100, height: r(ph + 200)});
    sd = {
      kind: 'card', card, start, end, clipId,
      node: g(null,
        h('defs', null, h('clipPath', {id: ctx.id(clipId)}, clipRect)),
        g({'clip-path': ctx.ref(clipId)}, g({name: `${P}-cardT`, transform: T(start.x, start.y)}, card.node))),
      portLocal: card.port, pinLocal: card.pinAt, w: sideW, h: sideH,
    };
  }

  // library shelf units (same seeds in both panels → identical art)
  let shelfL, shelfR, glow = null;
  if (side) {
    // three rows each; the featured commentary volume is on the row level with where the card
    // lands (the card slides out of the bookcase at that height)
    const sh = ph - 8, rowsN = 3;
    const F = Math.max(12, Math.min(22, o.shelfW * 0.05)), B = Math.max(10, Math.min(18, sh * 0.028));
    const rh = (sh - 2 * F - (rowsN - 1) * B) / rowsN;
    const cy = sd.kind === 'card' ? sd.end.y + sd.h / 2 : pasY;
    const fr = clamp(Math.floor((cy - 8 - F) / (rh + B)), 0, rowsN - 1);
    shelfL = bookcase(ctx, {prefix: `${P}-shl`, x: 0, y: 8, w: o.shelfW, h: sh, rows: [0, 1, 2].map(() => ({kind: 'source'})), legs: false, seedKey: 'fpc-c-l'});
    shelfR = bookcase(ctx, {prefix: `${P}-shr`, x: pw - o.shelfW, y: 8, w: o.shelfW, h: sh, rows: [0, 1, 2].map(i => ({kind: 'commentary', feature: i === fr ? 1 : undefined})), legs: false, seedKey: 'fpc-c-r'});
    if (shelfR.features[fr]) glow = `${P}-shr-glow${fr}`;
  } else {
    shelfL = bookcase(ctx, {prefix: `${P}-shl`, x: 8, y: 0, w: pw * 0.5 - 22, h: shelfH, rows: [{kind: 'source', feature: 3}], legs: false, seedKey: 'fpc-c-l'});
    shelfR = bookcase(ctx, {prefix: `${P}-shr`, x: pw * 0.5 + 14, y: 0, w: pw * 0.5 - 22, h: shelfH, rows: [{kind: 'commentary', feature: 4}], legs: false, seedKey: 'fpc-c-r'});
    if (shelfR.features[0]) glow = `${P}-shr-glow0`;
  }
  return {shelfL, shelfR, glow, board, page, pas, px, py, pin, pasY, side: sd, gutterX, colX0, colX1, bx, by, bw, bh, quote, P};
}

const scene = {
  sizes: {landscape: [1880, 900], square: [1260, 1140], portrait: [920, 1440]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const C = fpcColors(ctx);
    const shape = ctx.view.shape;
    const S = STAGES[shape];
    const D = ctx.design;
    const li = linkedPassage(p);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    // square: the board is as tall as the page fitted to its passages (and never shorter than
    // the commentary card plus its tag)
    let ph = S.ph, pw = S.pw, pageW = null;
    if (S.sideShelves) {
      pageW = S.pageInner + S.padL + S.padR;
      // board: inset | page | gutter | tab + strip (the passage box: inner + 20) | margin
      const bw = S.inset + pageW + S.gutterGap + 14 + 64 + S.pageInner + 20 + 24;
      pw = bw + 2 * (S.shelfW + S.shelfGap);
      const probe = sourcePage(ctx, {prefix: 'probe', w: pageW, h: 4000, title: p.sources.sourceTitle, ref: p.citations.source, date: p.dates.source, passages: p.sources.passages, showText: showAll, textSize: S.text, titleSize: S.title, fitSlots: true, padL: S.padL, padR: S.padR});
      ph = Math.ceil(Math.max(probe.needH + 2 * S.inset, 200 + tagRoom(S.tag) + 70));
    }
    const geo = pairedGeometry(ctx, {stage: {w: pw, h: ph}, arrangement: S.arrangement, header: S.header, gap: S.gap});
    const totalW = geo.w + S.lane;
    const panels = ['quote', 'commentary'].map((variant, i) => {
      const P = i === 0 ? 'a' : 'b';
      const pan = buildPanel(ctx, {prefix: P, variant, pw, ph, shelfH: S.shelfH, li, text: S.text, title: S.title, side: S.side, tag: S.tag,
        sideShelves: S.sideShelves, shelfW: S.shelfW, shelfGap: S.shelfGap, inset: S.inset, pageW, padL: S.padL, padR: S.padR, gutterGap: S.gutterGap, cardHead: S.cardHead, cardFoot: S.cardFoot});
      return {...pan, off: {x: geo.panels[i].x, y: geo.panels[i].y}, headerY: geo.panels[i].headerY};
    });
    // square: the closing guide drops straight from A's side note to B's, inside the margin
    // column, left of both push pins (panel-local x, identical in both stacked panels)
    const vGuideX = S.sideShelves ? Math.min(...panels.map(pn => pn.side.end.x + pn.side.w)) - 60 : null;
    const headW = S.sideShelves ? vGuideX - 30 : pw;
    const headers = [
      scenarioTitle(ctx, {name: 'hdr-a', letter: 'A', label: p.scenarioA.label, caption: p.scenarioA.caption, x: geo.panels[0].x, y: geo.panels[0].headerY, w: headW, h: S.header - 8, color: C.src, size: S.titleSize}),
      scenarioTitle(ctx, {name: 'hdr-b', letter: 'B', label: p.scenarioB.label, caption: p.scenarioB.caption, x: geo.panels[1].x, y: geo.panels[1].headerY, w: headW, h: S.header - 8, color: C.com, size: S.titleSize}),
    ];

    // tags under each side note (inside the margin column)
    const tags = panels.map((pn, i) => {
      if (!showKey) return null;
      const sd = pn.side;
      const y = sd.end.y + sd.h + 16;
      // the tag ends well short of the closing guide, which leaves the side note near its right edge
      const guideX = S.sideShelves ? vGuideX : sd.end.x + sd.w - 12;
      const mw = Math.min(pn.colX1 - pn.colX0 - 44, guideX - 28 - (pn.colX0 + 6));
      const res = pn.quote
        ? stateChip(ctx, t.exactWords, {x: pn.colX0 + 6, y, anchor: 'start', size: S.tag, color: C.src, fill: th.card, maxWidth: mw, maxLines: 2, name: `tag-${pn.P}`, opacity: 0})
        : stateChip(ctx, [t.attributed, p.sources.commentator], {x: pn.colX0 + 6, y, anchor: 'start', size: S.tag, color: C.com, ink: C.comInk, fill: C.comSoft, maxWidth: mw, maxLines: 2, name: `tag-${pn.P}`, opacity: 0});
      return res;
    });

    // closing guide between the two side notes (the changed detail)
    const sideAnchor = (pn, where) => {
      const sd = pn.side;
      const x0 = pn.off.x + sd.end.x, y0 = pn.off.y + sd.end.y;
      if (where === 'bottom') return {x: x0 + sd.w - 12, y: y0 + sd.h + 2};
      return {x: x0 + sd.w + 2, y: y0 + sd.h * 0.5};
    };
    const panelsBottom = geo.h;
    let guidePts;
    let laneY = null;
    if (S.arrangement === 'row') {
      laneY = panelsBottom + 26;
      const a = sideAnchor(panels[0], 'bottom'), b = sideAnchor(panels[1], 'bottom');
      guidePts = [a, {x: a.x, y: laneY}, {x: b.x, y: laneY}, b];
    } else if (S.sideShelves) {
      const [pa, pb] = panels;
      guidePts = [{x: pa.off.x + vGuideX, y: pa.off.y + pa.side.end.y + pa.side.h + 2}, {x: pb.off.x + vGuideX, y: pb.off.y + pb.side.end.y - 2}];
    } else {
      const laneX = geo.w + S.lane / 2;
      const a = sideAnchor(panels[0], 'right'), b = sideAnchor(panels[1], 'right');
      guidePts = [a, {x: laneX, y: a.y}, {x: laneX, y: b.y}, b];
    }
    const guide = polyGuide('guide', guidePts, 22, C.link);

    // footer slots (never cross-faded: each leaves before the next arrives)
    const slotTop = S.arrangement === 'row' ? panelsBottom + 50 : panelsBottom + 20;
    const cx = totalW / 2;
    const slotMax = Math.min(totalW - 40, S.slotMax ?? 1100);
    const mk = (name, text, y, color, fill, ink = th.ink, weight = 600) => chip(ctx, text, {x: cx, y, anchor: 'middle', maxWidth: slotMax, size: S.chip, minSize: S.chip * 0.8, maxLines: 2, fill, stroke: color, color: ink, weight, name, padY: S.chipPadY ? S.chip * S.chipPadY : undefined});
    const change = showKey ? mk('foot-change', p.changedFact, slotTop, C.link, C.linkSoft) : null;
    const guideLabel = showAll && p.comparisonLabels.guide ? mk('guide-label', p.comparisonLabels.guide, slotTop, C.link, th.card, C.link, 700) : null;
    const row1h = Math.max(change ? change.box.h : 0, guideLabel ? guideLabel.box.h : 0);
    const row2 = slotTop + (row1h ? row1h + 14 : 0);
    const shared = showAll && p.sharedFacts.length ? mk('foot-shared', `${t.sameFacts}: ${p.sharedFacts.join(' · ')}`, row2, th.inkSoft, th.card) : null;
    const neutral = showAll ? mk('foot-neutral', p.comparisonLabels.neutral, row2, th.inkSoft, th.card) : null;
    const row2h = Math.max(shared ? shared.box.h : 0, neutral ? neutral.box.h : 0);
    const totalH = row2 + row2h + 8;
    const s = Math.min(D.w / totalW, D.h / totalH);
    const ox = (D.w - totalW * s) / 2;
    const oy = (D.h - totalH * s) / 2;
    // in the stacked layouts the guide label is tied to the guide by a short leader: to the
    // side lane (portrait), or up to the bottom of B's side note on the guide's line (square)
    let guideLead = null;
    if (guideLabel && S.sideShelves) {
      const b = guideLabel.box;
      const gx = guidePts[0].x;
      const pb = panels[1];
      const yTop = pb.off.y + pb.side.end.y + pb.side.h + 2;
      const d = gx >= b.x + 16 && gx <= b.x + b.w - 16 ? `M${r(gx)} ${r(b.y)}V${r(yTop)}`
        : gx > b.x + b.w ? `M${r(b.x + b.w)} ${r(b.y + b.h / 2)}H${r(gx)}V${r(yTop)}`
          : `M${r(b.x)} ${r(b.y + b.h / 2)}H${r(gx)}V${r(yTop)}`;
      guideLead = h('path', {name: 'guide-lead', d, fill: 'none', stroke: C.link, 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round', opacity: 0});
    } else if (guideLabel && S.arrangement === 'column') {
      const b = guideLabel.box;
      const lx = geo.w + S.lane / 2;
      guideLead = h('path', {name: 'guide-lead', d: `M${r(b.x + b.w)} ${r(b.y + b.h / 2)}H${r(lx)}V${r(guidePts[3].y)}`, fill: 'none', stroke: C.link, 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round', opacity: 0});
    }
    // clearance between each side note's state tag and the closing guide (or its leader) running past it
    const guideXs = S.arrangement === 'row' ? [guidePts[0].x, guidePts[3].x] : S.sideShelves ? [guidePts[0].x, guidePts[1].x] : [guidePts[1].x, guidePts[2].x];
    const tagGuideGap = Math.min(...tags.map((tg, i) => (tg ? guideXs[i] - (panels[i].off.x + tg.box.x + tg.box.w) : Infinity)));
    return {S, s, ox, oy, panels, headers, tags, guide, change, shared, neutral, guideLabel, guideLead, li, totalW, totalH, tagGuideGap};
  },
  build(ctx, L) {
    const C = fpcColors(ctx);
    const panelNode = pn => g({transform: T(pn.off.x, pn.off.y)},
      pn.board.node,
      // A's copy slides out from beneath the page (drawn under it), so it never double-prints the text
      pn.side.kind === 'strip' ? g({name: `${pn.P}-stripT`, transform: T(pn.side.start.x, pn.side.start.y)}, pn.side.node) : null,
      g({transform: T(pn.px, pn.py)}, pn.page.node),
      pn.side.trace || null,
      h('path', {name: `${pn.P}-thread`, d: threadD(pn.pin, pn.pin, 0), fill: 'none', stroke: C.link, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0}),
      g({name: `${pn.P}-srcpinT`, transform: T(pn.pin.x, pn.pin.y)}, pushPin(ctx, {name: `${pn.P}-srcpin`, opacity: 0, radius: 10})),
      pn.side.kind === 'card' ? pn.side.node : null,
      pn.shelfL.node,
      pn.shelfR.node,
      L.tags[pn.P === 'a' ? 0 : 1] && L.tags[pn.P === 'a' ? 0 : 1].node,
    );
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.panels.map(panelNode),
      L.guide.node,
      L.guideLead,
      L.change && L.change.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
      L.guideLabel && L.guideLabel.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const Sg = w => seg(u, ...W[w]);
    const E = w => ease.inOutCubic(Sg(w));
    const sem = {};
    for (const pn of L.panels) {
      const P = pn.P;
      const pas = pn.pas;
      const li = L.li;
      // passage lights up in both (found passage); A underlines, B brackets
      nodes[`${P}-src-hl-${li}`] = {opacity: r(seg(u, 0.06, 0.14), 3)};
      const mark = Sg('mark');
      if (pn.quote) {
        const n = pas.lines.length;
        pas.lines.forEach((ln, k) => { nodes[`${P}-src-ul-${li}-${k}`] = {'stroke-dashoffset': r(ln.w * (1 - clamp(mark * n - k)))}; });
      } else {
        nodes[`${P}-src-br-${li}`] = {'stroke-dashoffset': r(pas.brLen * (1 - mark))};
        const gl = Sg('glow') * (1 - seg(u, 0.62, 0.7));
        if (pn.glow) nodes[pn.glow] = {opacity: r(gl, 3)};
      }
      // side note motion
      const sd = pn.side;
      let pos, k = 1;
      if (sd.kind === 'strip') {
        const tr = E('travel');
        k = lerp(1, sd.k, tr);
        pos = {x: lerp(sd.start.x, sd.end.x, tr), y: lerp(sd.start.y, sd.end.y, tr)};
        nodes[`${P}-stripT`] = {transform: `${T(pos.x, pos.y)} scale(${r(k, 4)})`};
        nodes[`${P}-strip`] = {opacity: u >= W.lift[0] ? 1 : 0};
        nodes[`${P}-trace`] = {opacity: r(clamp(seg(u, W.lift[0], W.lift[0] + 0.04)) * 0.9, 3)};
      } else {
        const em = E('emerge');
        pos = {x: lerp(sd.start.x, sd.end.x, em), y: lerp(sd.start.y, sd.end.y, em)};
        nodes[`${P}-cardT`] = {transform: T(pos.x, pos.y)};
      }
      const port = {x: pos.x + sd.portLocal.x * k, y: pos.y + sd.portLocal.y * k};
      const pinP = Sg('pin');
      const pinName = sd.kind === 'strip' ? `${P}-spin` : `${P}-card-pin`;
      nodes[pinName] = {opacity: pinP > 0 ? 1 : 0};
      if (sd.kind === 'strip') nodes[`${P}-spinT`] = {transform: `${T(sd.pinLocal.x, sd.pinLocal.y)} scale(${r(lerp(1.6, 1, ease.outCubic(pinP)), 3)})`};
      else nodes[`${P}-card-pinT`] = {transform: `${T(sd.pinLocal.x, sd.pinLocal.y)} scale(${r(lerp(1.6, 1, ease.outCubic(pinP)), 3)})`};
      const th = Sg('thread');
      const tied = th > 0;
      nodes[`${P}-srcpin`] = {opacity: tied ? 1 : 0};
      const knotName = sd.kind === 'strip' ? `${P}-knot` : `${P}-card-knot`;
      nodes[knotName] = {opacity: tied ? 1 : 0};
      // thread pays out from the source pin to the side note's tab
      const end = {x: lerp(pn.pin.x, port.x, ease.outCubic(th)), y: lerp(pn.pin.y, port.y, ease.outCubic(th))};
      nodes[`${P}-thread`] = {d: threadD(pn.pin, end, SAG * th), opacity: tied ? 1 : 0};
      if (L.tags[P === 'a' ? 0 : 1]) nodes[`tag-${P}`] = {opacity: r(Sg('tags'), 3)};
      const gx = pn.off.x, gy = pn.off.y;
      sem[P] = {
        side: sd.kind,
        sideOrigin: sd.kind === 'strip' ? 'source page' : 'commentary shelf',
        at: {x: r(gx + pos.x), y: r(gy + pos.y)},
        center: {x: r(gx + pos.x + (sd.w / (sd.kind === 'strip' ? sd.k : 1)) * k / 2), y: r(gy + pos.y + (sd.h / (sd.kind === 'strip' ? sd.k : 1)) * k / 2)},
        landed: u >= W.travel[1],
        pinned: pinP > 0,
        tied: th >= 1,
        marked: r(mark, 3),
        clearOfPage: pos.x + (sd.kind === 'strip' ? -58 * k : -58) >= pn.px + pn.page.w - 1 || u < W.lift[0] + 0.001,
        passage: li + 1,
      };
    }
    // footers & guide
    const gp = E('guide');
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    const fade = (a, b, c, d) => r(Math.min(seg(u, a, b), 1 - seg(u, c, d)), 3);
    if (L.change) nodes['foot-change'] = {opacity: fade(W.changeIn[0], W.changeIn[1], W.changeOut[0], W.changeOut[1])};
    if (L.shared) nodes['foot-shared'] = {opacity: fade(W.sharedIn[0], W.sharedIn[1], W.sharedOut[0], W.sharedOut[1])};
    if (L.neutral) nodes['foot-neutral'] = {opacity: r(Sg('neutral'), 3)};
    if (L.guideLabel) nodes['guide-label'] = {opacity: r(Sg('guideLabel'), 3)};
    if (L.guideLead) nodes['guide-lead'] = {opacity: r(Sg('guideLabel'), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        a: sem.a,
        b: sem.b,
        samePassage: sem.a.passage === sem.b.passage,
        guideProgress: r(gp, 3),
        tagGuideGap: Number.isFinite(L.tagGuideGap) ? r(L.tagGuideGap) : null,
        footer: u < W.changeOut[1] && u >= W.changeIn[0] ? 'changed-fact' : u >= W.sharedIn[0] && u < W.sharedOut[1] ? 'shared-facts' : u >= W.neutral[0] ? 'neutral' : null,
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
    slug: 'research-06-contrast',
    title: 'Primary source and commentary — copied words vs commentator’s reading',
    titleEs: 'Fuente primaria y comentario — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Fuente primaria y comentario',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical reading boards. Only the side note differs: in A a copy of the passage’s own words slides out from beneath the page (the original stays, a dashed trace marks what was copied) and is pinned beside it; in B the commentator’s card slides out of the commentaries shelf and is pinned beside the same passage. Both are tied by a thread and kept apart by the gutter. A neutral guide links the two side notes; no ranking or outcome.',
    tags: ['research', 'primary source', 'commentary', 'quotation', 'interpretation', 'side note', 'comparison', 'gutter', 'library'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/fuente-primaria-y-comentario.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: FPC_STRINGS,
  scene,
});
