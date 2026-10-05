/**
 * LAW-0065 — Extracción de hechos · story
 *
 * Storyboard (open stage: the library bay is the anchor, the search box is
 * the secondary object the user works with, the index card is the support):
 *  0.00–0.15  rest: the library bay shows an OUT-guide in the gap left by the
 *             volume, which lies open on a reading stand at the source page
 *             (numbered sentences). The search box lists the facts the user
 *             indicated; each row holds its own coloured index flag. The fact
 *             card is empty. The user's pointer rests by the search field.
 *  0.15–0.42  the pointer presses Extract; one flag after another leaves its
 *             row, travels along the lane beside the page and sticks at the
 *             end of the sentence that states that fact (the ¶ is SUPPLIED);
 *             a highlight sweeps from the flag over the sentence and the tab
 *             shows its pinpoint (¶3, ¶2, ¶4).
 *  0.42–0.73  one flag after another (never two at once) peels a copy strip
 *             of its sentence: the copy rolls up onto the flag (grip = flag
 *             stick point), travels rolled beside the page — never over the
 *             page text, the card's header or another copy — and unrolls into
 *             its slot, entering it level with the slot. The page keeps its
 *             text: highlight + edge notch remain.
 *  0.73–1.00  hold: rows ticked, "Facts extracted" on the card and "Source
 *             page unchanged" under the page; optional editorial callouts.
 *             finalState "flagged" stops after marking (flags stay on the
 *             page, card empty). No legal assessment of the facts is made.
 * With labels hidden the flags, highlights, notches and strips still show
 * what was pulled out of which sentence and where it went.
 * @module animations/research/LAW-0065
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {statusTag, callout, chip} from '../../primitives/annotate.js';
import {extractionFields, extractionStage, requestPanel, SOURCES_EN, QUERY_EN, CITATIONS_DEFAULT, DATES_EN, EXTRACTION_STRINGS, sentenceIndex, FLAG} from './kits/extraccion-de-hechos.js';

const ID = 'LAW-0065';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  pointerMove: [0.15, 0.19], press: [0.19, 0.22], pointerAway: [0.23, 0.29],
  tagState: [0.77, 0.83], tagSource: [0.8, 0.86], note: [0.86, 0.94],
};
const fly = k => [0.21 + 0.035 * k, 0.31 + 0.035 * k];
const mark = k => [0.31 + 0.035 * k, 0.35 + 0.035 * k];
// copies are pulled one at a time: the next strip is only peeled once the previous one has landed,
// so two strips are never in the air together (the complete beat is shared by the n requests)
const PULL = [0.43, 0.715];
const pullSpan = n => (PULL[1] - PULL[0]) / Math.max(1, n);
const peel = (k, n) => [PULL[0] + pullSpan(n) * k, PULL[0] + pullSpan(n) * (k + 0.17)];
const carry = (k, n) => [PULL[0] + pullSpan(n) * (k + 0.17), PULL[0] + pullSpan(n) * (k + 0.99)];
const tick = k => [0.74 + 0.025 * k, 0.78 + 0.025 * k];

const sceneSchema = {
  ...extractionFields,
  actorLabels: obj('Captions for the actors', {user: str('Caption on the user\'s pointer', 40), markers: str('Caption for the index flags (search box footer)', 40)}),
  objectLabels: obj('Labels printed on objects', {search: str('Title of the search box', 40), card: str('Title of the fact card', 40)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold (the chip sits inside its target: under the page text or under the filed slots)', annotation(['page', 'card']), 0, 2),
  finalState: oneOf('State supplied for the final hold: filed (copies pulled onto the card) or flagged (facts marked on the page, nothing pulled yet). No legal effect is inferred', ['filed', 'flagged']),
};

const defaultParams = {
  query: QUERY_EN,
  sources: SOURCES_EN,
  citations: CITATIONS_DEFAULT,
  dates: DATES_EN,
  actorLabels: {user: 'Researcher', markers: 'Index flags'},
  objectLabels: {search: 'Search the file', card: 'Fact card'},
  actionProgress: 1,
  annotations: [{target: 'card', text: 'Copies of the indicated sentences, each with its ¶'}],
  finalState: 'filed',
};

const M = 14;
const STAND = 42;

const annSize = shape => (shape === 'landscape' ? 24 : shape === 'square' ? 23 : 24);
const annMax = shape => (shape === 'landscape' ? 520 : shape === 'square' ? 420 : 760);
const TAG = 26;
const TAG_HDR = 24;
const cardTitleSize = shape => (shape === 'square' ? 28 : 30);

/**
 * Chip width that splits a wrapped text into lines of similar length: the narrowest width that
 * keeps the same line count and size (no one-word last line), never narrower than its longest word.
 */
function balancedWidth(ctx, text, size, mw, maxLines = 3) {
  const probe = w => chip(ctx, text, {x: 0, y: 0, maxWidth: w, size, maxLines});
  const c = probe(mw);
  const n = c.fit.lines.length;
  if (n < 2 || c.fit.truncated) return Math.min(mw, c.box.w + 2);
  const longest = Math.max(...String(text).split(/\s+/).map(w => ctx.measure(w, size, 600, 'sans'))) + size * 1.2 + 4;
  let lo = Math.max(c.box.w / n, longest), hi = mw;
  for (let k = 0; k < 12; k++) {
    const mid = (lo + hi) / 2;
    const cc = probe(mid);
    if (!cc.fit.truncated && cc.fit.lines.length === n && cc.fit.size === c.fit.size) hi = mid;
    else lo = mid;
  }
  return Math.min(mw, Math.ceil(hi) + 1);
}

/**
 * Where each editorial annotation's chip goes: `natural` keeps each chip inside its own target
 * (under the page text, or inside the card below the slots); `band` puts them in a strip under the
 * stage, each one directly below its own target. A callout never sits on the other object.
 */
function notePlan(ctx, mode) {
  return ctx.params.annotations.map(a => (mode === 'band' ? 'band' : isAside(mode) ? `aside-${a.target}` : a.target));
}

/**
 * Aside modes (square box, long text): the callouts leave their targets so the page and the card keep
 * their text large — a page callout sits in the gap row right above the page (short leader down onto
 * the page's top edge); the state tag and the card callouts stand in a column under the library bay
 * (leader down onto the card's top edge). The gap row and that column are empty in the hold: the flags
 * only pass through them during the action. `aside-nt` also drops the page's title line (the header
 * keeps volume · date · page).
 */
const isAside = mode => mode === 'aside' || mode === 'aside-nt';
const ASIDE_LINES = 5;

/** Heights the aside modes need: the column under the bay (tag + card callouts + leader room) and the gap row. */
function asidePlan(ctx, shape, colW, rowW, ns = 1) {
  const p = ctx.params;
  const size = annSize(shape) * ns;
  const all = ctx.show('all');
  const probe = (text, mw, maxLines) => callout(ctx, {name: 'probe', text, chipAt: {x: 0, y: 0}, target: {x: 0, y: 0}, maxWidth: balancedWidth(ctx, text, size, mw, maxLines), size, maxLines}).box.h;
  const cards = all ? p.annotations.filter(a => a.target === 'card') : [];
  const pages = all ? p.annotations.filter(a => a.target === 'page') : [];
  const stateText = p.finalState === 'filed' ? ctx.t.extracted : ctx.t.flagged;
  const tagH = ctx.show('key') ? statusTag(ctx, stateText, {x: 0, y: 0, size: TAG}).box.h : 0;
  const cardHs = cards.map(a => probe(a.text, colW - 8, ASIDE_LINES));
  const pageHs = pages.map(a => probe(a.text, rowW, 2));
  const colH = tagH + cardHs.reduce((a, hh) => a + hh + 12, 0) + (cards.length ? 30 : 12);
  const rowH = pageHs.length ? pageHs.reduce((a, hh) => a + hh + 8, -8) + 22 : 0;
  return {colH, rowH, tagH, size, pageNotes: pages.length};
}

/** Band mode: the callouts sit side by side in a strip under the whole stage, each under its target. */
function bandNotes(ctx, shape, D, ns = 1) {
  const p = ctx.params;
  if (!ctx.show('all') || !p.annotations.length) return {h: 0, cw: 0};
  const n = p.annotations.length;
  const cw = (D.w - 2 * M - 30 * (n - 1)) / n;
  const size = annSize(shape) * ns;
  const hh = Math.max(...p.annotations.map(a => callout(ctx, {name: 'probe', text: a.text, chipAt: {x: 0, y: 0}, target: {x: 0, y: 0}, maxWidth: balancedWidth(ctx, a.text, size, cw), size, maxLines: 3}).box.h));
  return {h: hh + 46, cw};
}

/**
 * Space reserved inside the card (callouts + the state tag when the header has
 * no room for it) and under the page text (callouts + the source tag).
 */
function reserves(ctx, shape, cardW, pageW, mode, ns = 1) {
  const p = ctx.params;
  if (isAside(mode)) {
    const pageNote = ctx.show('all') && p.annotations.some(a => a.target === 'page');
    return {card: 0, page: pageNote ? 0 : 32, tagInHeader: false, tagAside: true, sourceTag: !pageNote, titleMax: cardW - 56};
  }
  const plan0 = notePlan(ctx, mode);
  const pageNote = ctx.show('all') && plan0.includes('page');
  const out = {card: 0, page: pageNote ? 0 : 32, tagInHeader: true, sourceTag: !pageNote};
  out.titleMax = cardW - 56;
  if (ctx.show('key')) {
    // the card title may shrink (not below 20) to leave the state tag room in the header
    const text = p.finalState === 'filed' ? ctx.t.extracted : ctx.t.flagged;
    const tb = statusTag(ctx, text, {x: 0, y: 0, size: TAG_HDR}).box;
    const tbCorner = statusTag(ctx, text, {x: 0, y: 0, size: TAG}).box;
    const room = cardW - 26 - 24 - tb.w - (shape === 'landscape' ? 34 : 18);
    const tf = ctx.fit(p.objectLabels.card, {maxWidth: room, size: cardTitleSize(shape), minSize: 20, maxLines: 1, weight: 800});
    if (tf.truncated) {
      out.tagInHeader = false;
      // square: the tag stands just above the card's top-right corner (in the gap under the library
      // bay); elsewhere the card keeps its bottom-right corner free for it
      if (shape === 'square') out.tagAbove = true;
      else out.card += tbCorner.h + 36;
    } else {
      out.titleMax = room;
      // the tag spans the title row; the card's source line starts under the tag
      out.sourceMinY = 8 + TAG_HDR * 1.75 + 8;
    }
  }
  if (!ctx.show('all')) return out;
  const plan = notePlan(ctx, mode);
  p.annotations.forEach((a, i) => {
    if (plan[i] === 'band') return;
    const zw = plan[i] === 'card' ? cardW - 60 : pageW - 80;
    const mw = balancedWidth(ctx, a.text, annSize(shape) * ns, Math.min(zw, annMax(shape)));
    const hh = callout(ctx, {name: 'probe', text: a.text, chipAt: {x: 0, y: 0}, target: {x: 0, y: 0}, maxWidth: mw, size: annSize(shape) * ns, maxLines: 3}).box.h + 34;
    out[plan[i]] += hh;
  });
  return out;
}

/** Explicit stage geometry per layout shape (design units). */
function geometry(ctx, shape, D0, panelOpts0, cardNeed = 0, mode = 'natural', ns = 1, compact = false) {
  const p = ctx.params;
  const band = mode === 'band' ? bandNotes(ctx, shape, D0, ns) : {h: 0};
  const D = {w: D0.w, h: D0.h - band.h};
  const n = p.query.facts.length;
  // compact (fallback for long requests): no search field; the Extract button closes the list
  const panelOpts = {...panelOpts0, compact};
  const panelH = w => requestPanel(ctx, {...panelOpts, w}).h;
  if (shape === 'portrait') {
    // search box across the top (its requests stay on one line); the library bay stands left of the
    // open book, the lane for the flags runs right of it; the card across the bottom
    const panelW = D.w - 2 * M - (FLAG.w - FLAG.stick) - 4;
    const ph = panelH(panelW);
    const bookY = M + ph + 26;
    const cardW = D.w - 2 * M;
    const shelfW = 176;
    const bookX = M + shelfW + 18;
    const bookW = Math.min(D.w - bookX - 150, 700);
    const res = reserves(ctx, shape, cardW, bookW - 18 - 50, mode, ns);
    const cardH = cardNeed ? Math.max(260, cardNeed) : 150 + 90 * n + res.card;
    const cardY = D.h - M - cardH;
    const standP = 30;
    const bookH = cardY - 22 - standP - bookY;
    return {
      res, band,
      shelf: {x: M, y: bookY, w: shelfW, h: bookH + standP, rows: bookH > 520 ? 4 : 3, gapRow: 1, gapAt: 0.4, plateSize: 23, plateW: 0.94, plateLines: 3},
      panel: {x: M, y: M, w: panelW, parkSide: 'right', labelSize: 25, rowMin: 58, compact, ownerSize: 23, footerSize: 23},
      book: {x: bookX, y: bookY, w: bookW, h: bookH, standH: standP, leftW: 44, size: 28, titleSize: 27, reserve: res.page, noTitle: mode === 'natural-nt'},
      card: {x: M, y: cardY, w: cardW, h: cardH, reserve: res.card, titleSize: cardTitleSize(shape), titleMax: res.titleMax, sourceMinY: res.sourceMinY},
      laneX: bookX + bookW + 26,
      laneMax: D.w - M - FLAG.w - 4,
      cardSide: 'below',
    };
  }
  if (shape === 'square') {
    // two rows: search box (flags protrude on its right) + library bay; open book + fact card.
    // A gap under the search box and a lane beside the page (as wide as a flag) let the flags drop,
    // run along the gap and down the lane — they never cross the card or its header.
    const longest = Math.max(...panelOpts.requests.map(q => ctx.measure(q.label, panelOpts.labelSize, 600, 'sans')));
    const panelW = Math.round(clamp(longest + 190, D.w * 0.52, D.w * 0.7));
    const ph = panelH(panelW);
    const gapY = 76;
    // (only the card starts under the gap the flags run along; the book starts right under the box)
    const rowY = M + ph + gapY;
    const bookY = M + ph + 24;
    const laneS = 130;
    // the card holds a full-width copy strip plus its flag: the book is as wide as that allows
    const bookW = Math.floor((D.w - 2 * M - laneS - 29) / 2);
    const cardX = M + bookW + laneS;
    const shelfX = M + panelW + (FLAG.w - FLAG.stick) + 30;
    const cardW = D.w - M - cardX;
    const res = reserves(ctx, shape, cardW, bookW - 18 - 36, mode, ns);
    if (isAside(mode)) {
      // the callouts leave the page and the card (see isAside): the gap row under the search box is as
      // tall as the page callout needs, the bay is as tall as the column under it leaves
      const colW = D.w - M - shelfX;
      const A = asidePlan(ctx, shape, colW, shelfX - 14 - (M + 30), ns);
      const gap = Math.max(64, A.rowH);
      const rowA = M + ph + gap;
      const bookA = A.pageNotes ? rowA : M + ph + 24;
      const shelfH = Math.round(rowA - A.colH - 12 - M);
      // (no room left for the bay: this arrangement is not used)
      if (shelfH < 100) res.card += 1000;
      return {
        res, band, aside: {x: shelfX, w: colW, top: M + Math.max(0, shelfH) + 12, rowTop: M + ph, gap, tagH: A.tagH},
        panel: {x: M, y: M, w: panelW, parkSide: 'right', labelSize: 24, rowMin: 50, fieldH: 46, titleMin: 46, compact, ownerSize: 24, footerSize: 24},
        shelf: {x: shelfX, y: M, w: colW, h: Math.max(100, shelfH), rows: shelfH > 230 ? 2 : 1, gapRow: shelfH > 230 ? 1 : 0, gapAt: 0.5, plateSize: 25, plateW: 0.9, plateLines: 3},
        book: {x: M, y: bookA, w: bookW, h: D.h - M - 26 - bookA, standH: 26, leftW: 36, size: 27, titleSize: 24, reserve: res.page, noTitle: mode === 'aside-nt'},
        card: {x: cardX, y: rowA, w: cardW, h: D.h - M - rowA, reserve: 0, titleSize: cardTitleSize(shape), titleMax: res.titleMax},
        laneX: M + bookW + 12,
        flyGapY: M + ph + gap / 2,
        cardSide: 'right',
      };
    }
    return {
      res, band,
      panel: {x: M, y: M, w: panelW, parkSide: 'right', labelSize: 24, rowMin: 50, fieldH: 46, titleMin: 46, compact, ownerSize: 24, footerSize: 24},
      shelf: {x: shelfX, y: M, w: D.w - M - shelfX, h: ph, rows: 2, gapRow: 1, gapAt: 0.5, plateSize: 25, plateW: 0.9, plateLines: 3},
      book: {x: M, y: bookY, w: bookW, h: D.h - M - 26 - bookY, standH: 26, leftW: 36, size: 27, titleSize: 24, reserve: res.page},
      card: {x: cardX, y: rowY, w: cardW, h: D.h - M - rowY, reserve: res.card, titleSize: cardTitleSize(shape), titleMax: res.titleMax, sourceMinY: res.sourceMinY},
      laneX: M + bookW + 12,
      flyGapY: M + ph + gapY / 2,
      cardSide: 'right',
    };
  }
  const shelfW = 220;
  const bookX = M + shelfW + 26;
  const lane = 132;
  const avail = D.w - bookX - M - lane;
  const bookW = Math.round(avail * 0.5);
  const colX = bookX + bookW + lane;
  const colW = D.w - M - colX;
  const ph = panelH(colW);
  const cardY = M + ph + 26;
  const res = reserves(ctx, shape, colW, bookW - 18 - 86, mode, ns);
  return {
    res, band,
    shelf: {x: M, y: M + 40, w: shelfW, h: D.h - 2 * M - 40, rows: 5, gapRow: 2, gapAt: 0.45, plateSize: 26, plateW: 0.94, plateLines: 3},
    panel: {x: colX, y: M, w: colW, parkSide: 'left', labelSize: 26, compact, ownerSize: 26, footerSize: 26},
    book: {x: bookX, y: M, w: bookW, h: D.h - 2 * M - STAND, leftW: 86, size: 30, reserve: res.page},
    card: {x: colX, y: cardY, w: colW, h: D.h - M - cardY, reserve: res.card, titleSize: cardTitleSize(shape), titleMax: res.titleMax, sourceMinY: res.sourceMinY},
    laneX: bookX + bookW + 12,
    cardSide: 'right',
  };
}

function overlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1040, 880], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const n = p.sources.sentences.length;
    const facts = p.query.facts.map(f => ({label: f.label, sentence: sentenceIndex(f.sentence, n), mode: 'quote', icon: 'quote'}));
    const pal = [th.accent3, th.accent2, th.accent4];
    const panelOpts = {prefix: 'probe', title: p.objectLabels.search, placeholder: p.query.placeholder, owner: p.actorLabels.user,
      requests: facts.map((f, i) => ({label: f.label, color: pal[i], icon: f.icon})), parkSide: shape === 'landscape' ? 'left' : 'right',
      labelSize: shape === 'square' ? 24 : shape === 'portrait' ? 25 : 26, rowMin: shape === 'landscape' ? 64 : shape === 'square' ? 50 : 58, button: true, footer: p.actorLabels.markers,
      fieldH: shape === 'square' ? 46 : 52, titleMin: shape === 'square' ? 46 : 50,
      ownerSize: shape === 'landscape' ? 26 : shape === 'square' ? 24 : 23, footerSize: shape === 'landscape' ? 26 : shape === 'square' ? 24 : 23};
    const labels = {library: p.sources.library, search: p.objectLabels.search, card: p.objectLabels.card, markers: p.actorLabels.markers, placeholder: p.query.placeholder, user: p.actorLabels.user};
    // copies roll up onto their flag, travel rolled beside the page and unroll into their slot (a copy
    // never lies over the page text, the card's header or another copy on its way)
    const build = (geo, size, condense) => extractionStage(ctx, {prefix: 'st', geo: {...geo, book: {...geo.book, size, minSize: size}}, sources: p.sources, facts, citations: p.citations, dates: p.dates, labels, pointer: true, condense, rollCopies: true});
    // Shrink the page text until the page and the card both hold their content (portrait: the card
    // takes the height it needs). Callouts first stay inside their own target; when that target is
    // full they move to the other object (their leader still ends on the target's nearest edge).
    let stage = null;
    let geo = null;
    let mode = 'natural';
    let best = null;
    // Last resort (very long sources): sentences nobody asked for are condensed to one simulated line.
    // Largest page text first; at each size the callouts try their own target, then the page, the card
    // or a band under the stage.
    // A callout never leaves its own target: it sits inside it ("natural") or, on wide/square
    // boxes, in a band under the stage directly below its target ("band").
    const band = p.annotations.length && shape !== 'portrait';
    const s0 = geometry(ctx, shape, D, panelOpts).book.size;
    const modes = band ? ['natural', 'band'] : ['natural'];
    // the page's text is key content: first every arrangement that keeps it ≥ ~20 px without
    // condensing (callouts in their target or in a band; a compact search box), then — only for very
    // long sources — the sentences nobody asked for become simulated lines, then smaller sizes
    const keep = {landscape: 25, square: 24, portrait: 21}[shape];
    // (square box only, and only when no natural arrangement keeps the preferred size: the callouts may
    // stand aside — see isAside; portrait, likewise: the page header may drop its title line)
    const asideModes = shape === 'square' && ctx.show('all') && p.annotations.length ? ['aside', 'aside-nt'] : shape === 'portrait' ? ['natural-nt'] : [];
    const combos = (condense, nsList, extra = []) => nsList.flatMap(ns => [false, true].flatMap(compact => [...modes, ...extra].map(m => ({m, condense, ns, compact}))));
    // (when no natural arrangement keeps the preferred size, the aside / no-title arrangements are tried
    // at that size before any smaller page text)
    const asideOnly = condense => [false, true].flatMap(compact => asideModes.map(m => ({m, condense, ns: 1, compact})));
    const passes = [
      {from: s0, to: keep, list: combos(false, [1])},
      {from: s0, to: keep, list: combos(true, [1])},
      {from: s0, to: keep, list: asideOnly(false)},
      {from: s0, to: keep, list: asideOnly(true)},
      {from: keep - 1, to: 13, list: [...combos(false, [1, 0.85], asideModes), ...combos(true, [1, 0.85], asideModes)]},
    ];
    search: for (const {from, to, list} of passes) {
      for (let size = from; size >= to - 1e-9; size -= 1) {
        for (const {m, condense, ns, compact} of list) {
          let gx = geometry(ctx, shape, D, panelOpts, 0, m, ns, compact);
          let st = build(gx, size, condense);
          if (shape === 'portrait') {
            gx = geometry(ctx, shape, D, panelOpts, st.cardNeedH, m, ns, compact);
            st = build(gx, size, condense);
          }
          const over = st.cardOverflow + st.pageOverflow;
          if (!best || over < best.over) best = {over, st, gx, m, size, condense, ns, compact, pageOver: st.pageOverflow, cardOver: st.cardOverflow};
          if (over <= 6) break search; // (the page keeps a 10-unit bottom margin inside its own measure)
        }
      }
    }
    ({st: stage, gx: geo, m: mode} = best);
    const fitInfo = {mode, size: best.size, condensed: best.condense, pageOverflow: r(best.pageOver), cardOverflow: r(best.cardOver), ns: best.ns, compact: best.compact, panelH: r(stage.panelBox.h), cardH: r(stage.cardBox.h), cardNeed: r(stage.cardNeedH), bookH: r(stage.bookBox.h), textBottom: r(stage.textBottom)};
    const plan = notePlan(ctx, mode);
    const filed = p.finalState === 'filed';

    // obstacles for hold labels: page text column, card slots, search rows, flags at rest
    const obstacles = [];
    const B = stage.bookBox;
    stage.book.sentences.forEach((s, i) => obstacles.push(stage.sentenceBox(i)));
    const cardB = stage.cardBox;
    stage.facts.forEach((f, k) => obstacles.push(filed ? stage.slotBox(k) : {...stage.sentenceBox(f.sentence), w: stage.sentenceBox(f.sentence).w + FLAG.w}));
    if (stage.panelBox) obstacles.push(stage.panelBox);
    const inCard = b => b && {x: cardB.x + b.x, y: cardB.y + b.y, w: b.w, h: b.h};
    obstacles.push(inCard(stage.card.titleBox));
    if (stage.card.sourceBox) obstacles.push(inCard(stage.card.sourceBox));
    const inside = b => b.x >= 6 && b.y >= 6 && b.x + b.w <= D.w - 6 && b.y + b.h <= D.h - 6;
    const pick = cands => {
      let best = null, bc = Infinity;
      for (const c of cands) {
        const cost = (inside(c.box) ? 0 : 1e9) + obstacles.reduce((a, o) => a + (overlap(c.box, o, 6) ? 1 : 0), 0);
        if (cost < bc) { best = c; bc = cost; }
        if (cost === 0) break;
      }
      return best;
    };

    // --- state tags (key labels): the card's state in its header (or in its reserved bottom-right
    //     corner when the title leaves no room); the source tag straddles the bottom edge of the page
    const tags = [];
    if (ctx.show('key')) {
      const stateText = filed ? t.extracted : t.flagged;
      const probe = statusTag(ctx, stateText, {x: 0, y: 0, size: TAG});
      // in the header the tag spans only the title row (it ends above the source line)
      // (in the corner the tag stays above the card's punch hole)
      const y = geo.res.tagInHeader ? cardB.y + 8 : geo.res.tagAbove ? cardB.y - probe.box.h - 8 : geo.res.tagAside ? geo.aside.top : cardB.y + cardB.h - probe.box.h - 34;
      // (aside: the tag heads the column under the library bay, above the card's callouts)
      const stateTag = geo.res.tagAside
        ? statusTag(ctx, stateText, {x: geo.aside.x + geo.aside.w / 2, y, anchor: 'middle', size: TAG, name: 'tag-state', color: th.accent4, opacity: 0})
        : statusTag(ctx, stateText, {x: cardB.x + cardB.w - 18, y, anchor: 'end', size: geo.res.tagInHeader ? TAG_HDR : TAG, name: 'tag-state', color: th.accent4, opacity: 0});
      tags.push(stateTag.node);
      obstacles.push(stateTag.box);
      if (geo.res.sourceTag) {
        const cx = B.x + stage.book.page.x + stage.book.page.w / 2;
        const srcTag = statusTag(ctx, t.sourceKept, {x: cx, y: B.y + stage.book.bookH - 32, anchor: 'middle', size: 24, name: 'tag-source', color: th.accent2, opacity: 0});
        tags.push(srcTag.node);
        obstacles.push(srcTag.box);
      }
    }

    // --- editorial callouts: the chip sits in the free space reserved inside its target object
    //     (under the last filed slot of the card, or under the page text); the leader drops
    //     straight onto the target's nearest edge.
    const notes = [];
    if (ctx.show('all')) {
      const size = annSize(shape) * best.ns;
      const placed = {card: null, page: null};
      const cb = stage.cardBox;
      const pg = stage.pageBox;
      const bandY = D.h - geo.band.h + 34;
      // band: each chip directly under its own target (page: under the page's right margin, clear of
      // the source tag and of the stand; card: under the card's middle), chips kept apart left → right
      const bandItems = [];
      p.annotations.forEach((a, i) => {
        const where = plan[i];
        if (where === 'band') {
          const tgt = a.target === 'page' ? pg : cb;
          const ax = a.target === 'page' ? pg.x + pg.w - 44 : cb.x + cb.w * 0.66;
          const mw = balancedWidth(ctx, a.text, size, geo.band.cw);
          const probe = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: bandY}, anchor: 'middle', target: {x: 0, y: 0}, maxWidth: mw, size, maxLines: 3, color: th.ink});
          bandItems.push({i, a, tgt, ax, mw, w: probe.box.w, cx: clamp(ax, M + probe.box.w / 2, D.w - M - probe.box.w / 2)});
          return;
        }
        if (where === 'aside-card' || where === 'aside-page') {
          const G2 = geo.aside;
          let c;
          if (where === 'aside-card') {
            // in the column under the library bay (below the state tag); the leader drops onto the
            // card's top edge right under the chip
            const mw = balancedWidth(ctx, a.text, size, G2.w - 8, ASIDE_LINES);
            const cx = G2.x + G2.w / 2;
            const y0 = placed.asideCard ?? G2.top + (ctx.show('key') ? G2.tagH + 12 : 0);
            c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: cx, y: y0}, anchor: 'middle', target: {x: clamp(cx, cb.x + 40, cb.x + cb.w - 40), y: cb.y + 2}, maxWidth: mw, size, maxLines: ASIDE_LINES, color: th.ink});
            placed.asideCard = c.box.y + c.box.h + 12;
          } else {
            // in the gap row right above the page; a short leader drops onto the page's top edge
            const x0 = M + 30;
            const mw = balancedWidth(ctx, a.text, size, G2.x - 14 - x0, 2);
            const hh = callout(ctx, {name: 'probe', text: a.text, chipAt: {x: 0, y: 0}, target: {x: 0, y: 0}, maxWidth: mw, size, maxLines: 2}).box.h;
            const nPage = p.annotations.filter(q => q.target === 'page').length;
            const y0 = placed.asidePage ?? G2.rowTop + Math.max(8, (G2.gap - (hh + 8) * nPage + 8) / 2);
            const probeW = callout(ctx, {name: 'probe', text: a.text, chipAt: {x: 0, y: 0}, target: {x: 0, y: 0}, maxWidth: mw, size, maxLines: 2}).box.w;
            const tx = clamp(pg.x + pg.w * 0.45, x0 + 30, x0 + probeW - 30);
            c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: x0, y: y0}, anchor: 'start', target: {x: tx, y: pg.y + 2}, maxWidth: mw, size, maxLines: 2, color: th.ink});
            placed.asidePage = c.box.y + c.box.h + 8;
          }
          notes.push(c);
          obstacles.push(c.box);
          return;
        }
        let zone;
        let target;
        let right = null;
        if (where === 'page') {
          // the leader ends on the lowest MARKED sentence — at its flag, or beside its edge notch once
          // the copy has left — and drops to it through the page's right margin (clear of the text of
          // any sentence under it); the chip stands right-aligned under the text so the leader is straight
          const low = stage.sentenceBox(Math.max(...stage.facts.map(f => f.sentence)));
          const tx = pg.x + pg.w - 16;
          const ty = low.y + low.h / 2 + (filed ? 16 : FLAG.h / 2);
          // (30 under the text: the chip keeps clear of the page's bottom edge inside the reserved room)
          zone = {x: pg.x + 50, y: (placed.page ?? stage.textBottom) + 30, w: pg.w - 80};
          right = pg.x + pg.w - 4;
          target = () => ({x: tx, y: ty});
        } else {
          const base = filed ? stage.slotBox(stage.facts.length - 1) : {x: cb.x + 24, y: cb.y + stage.card.headerBottom, w: cb.w - 48, h: 0};
          zone = {x: cb.x + 30, y: (placed.card ?? base.y + base.h) + 44, w: cb.w - 60};
          const tb = filed ? {x: base.x, w: stage.stripW} : base;
          target = cx => ({x: clamp(cx, tb.x + 40, tb.x + tb.w - 40), y: base.y + base.h - 2});
        }
        const mw = balancedWidth(ctx, a.text, size, Math.min(zone.w, annMax(shape)));
        const cx = zone.x + zone.w / 2;
        const c = right !== null
          ? callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: right, y: zone.y}, anchor: 'end', target: target(cx), maxWidth: mw, size, maxLines: 3, color: th.ink})
          : callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: cx, y: zone.y}, anchor: 'middle', target: target(cx), maxWidth: mw, size, maxLines: 3, color: th.ink});
        placed[where] = c.box.y + c.box.h - 20;
        notes.push(c);
        obstacles.push(c.box);
      });
      bandItems.sort((x, y) => x.ax - y.ax);
      for (let k = 1; k < bandItems.length; k++) {
        const pv = bandItems[k - 1], it = bandItems[k];
        const minCx = pv.cx + pv.w / 2 + 30 + it.w / 2;
        if (it.cx < minCx) it.cx = minCx;
      }
      const lastB = bandItems[bandItems.length - 1];
      if (lastB && lastB.cx + lastB.w / 2 > D.w - M) {
        const dx = lastB.cx + lastB.w / 2 - (D.w - M);
        bandItems.forEach(it => { it.cx -= dx; });
      }
      bandItems.forEach(it => {
        const tp = {x: clamp(clamp(it.ax, it.cx - it.w / 2 + 20, it.cx + it.w / 2 - 20), it.tgt.x + 30, it.tgt.x + it.tgt.w - 30), y: it.tgt.y + it.tgt.h};
        const c = callout(ctx, {name: `note${it.i}`, text: it.a.text, chipAt: {x: it.cx, y: bandY}, anchor: 'middle', target: tp, maxWidth: it.mw, size, maxLines: 3, color: th.ink});
        notes.push(c);
        obstacles.push(c.box);
      });
    }
    return {stage, tags, notes, filed, fitInfo, sourceTag: ctx.show('key') && geo.res.sourceTag};
  },
  build(ctx, L) {
    return g(null, L.stage.node, L.tags, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const filed = L.filed;
    const facts = L.stage.facts.map((f, k) => ({
      fly: seg(a, ...fly(k)),
      mark: seg(a, ...mark(k)),
      peel: filed ? seg(a, ...peel(k, L.stage.facts.length)) : 0,
      carry: filed ? seg(a, ...carry(k, L.stage.facts.length)) : 0,
    }));
    const done = p.actionProgress >= 1;
    const ticks = L.stage.facts.map((f, k) => (done ? seg(u, ...tick(k)) : 0));
    const posed = L.stage.pose({
      facts,
      ticks,
      pointer: {move: seg(a, ...W.pointerMove), press: seg(a, ...W.press), away: seg(a, ...W.pointerAway)},
    });
    const nodes = posed.nodes;
    const fade = w => (done ? r(seg(u, ...W[w]), 3) : 0);
    if (ctx.show('key')) {
      nodes['tag-state'] = {opacity: fade('tagState')};
      if (L.sourceTag) nodes['tag-source'] = {opacity: fade('tagSource')};
    }
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const sem = posed.semantic;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const out = {
      beat,
      finalState: p.finalState,
      holders: sem.holders,
      docked: sem.docked,
      marks: sem.marks,
      pointer: sem.pointer,
      pressed: seg(a, ...W.press) > 0 && seg(a, ...W.press) < 1,
      launched: seg(a, ...W.press) >= 1,
      pinpoints: L.stage.facts.map(f => f.sentence + 1),
      copiesInFlight: sem.holders.filter(x => x === 'carrying').length,
      copiesShown: sem.shown,
      pageText: L.stage.book.sentences.length,
      actionCapped: p.actionProgress < 1 && u > capU,
      fit: L.fitInfo,
      allReached: true,
    };
    sem.flags.forEach((q, k) => { out[`flag${k}`] = q; });
    sem.strips.forEach((q, k) => { out[`strip${k}`] = q; });
    return {nodes, semantic: out};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-07-story',
    title: 'Fact extraction — index flags pull the indicated facts off a page',
    titleEs: 'Extracción de hechos — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Extracción de hechos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A volume from the library bay lies open on a reading stand. The user presses Extract in the search box; each requested fact\'s index flag flies to the supplied sentence and highlights it; then, one at a time, each flag rolls up a copy of its sentence, carries it beside the page and unrolls it into its slot on the fact card. The page keeps its text (highlight and notch remain). Final state supplied: filed or flagged.',
    tags: ['fact extraction', 'research', 'library', 'search', 'index flag', 'index card', 'highlight', 'copy', 'pinpoint'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/extraccion-de-hechos.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: EXTRACTION_STRINGS,
  scene,
});
