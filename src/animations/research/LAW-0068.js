/**
 * LAW-0068 — Extracción de hechos · inspect
 *
 * Storyboard:
 *  0.00–0.20  context: the state the extraction produced — the volume open on
 *             its stand (highlights + edge notches where flags were), the
 *             library bay with its OUT-guide, and the fact card holding the
 *             copied entries. Dotted trails draw from each entry back to the
 *             sentence it was copied from (solid = the wording is on the page).
 *  0.20–0.45  isolate: the context dims first; then a lens lifts a REAL
 *             enlarged copy of the first entry (same coordinates: strip,
 *             wording, ¶ tab and its state tag) out to a window placed on a
 *             spot of the context that holds no writing (the card's blank
 *             lower lines, library art); the before-wording is named in a
 *             chip docked right under the entry's state tag.
 *  0.45–0.75  substitute: inside the lens only the entry's wording changes
 *             (old wording lifts out and is struck through in the chip, then
 *             the new wording drops in). Its dependent state follows a plain
 *             text comparison with the page: if the new wording is not written
 *             on the page the strip loses its copied highlight, its edge turns
 *             dashed and the tag (old tag lifts out first) reads "Not written
 *             on the page"; if it is written at another ¶, the ¶ tab and the
 *             trail move there.
 *  0.75–1.00  return: the lens folds back onto the entry; the context shows
 *             the new wording and the updated trail. The struck-through old
 *             wording stays docked under the entry (the old value remains
 *             traceable) and a neutral change marker (Δ) joins the entry row.
 * Seeking back before the substitution restores the old wording exactly.
 * The comparison is textual only: nothing is said about whether a wording
 * is true, admissible or legally relevant.
 * @module animations/research/LAW-0068
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {cubicPolyline, roundRectPath} from '../../core/geometry.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, caption, statusTag} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {extractionFields, openBook, libraryShelf, factCard, flagMarker, requestIcon, textOrBars, factPalette, coverColor, sentenceIndex, pinText, findOnPage, fitBalanced, roundedRoute, FLAG,
  SOURCES_EN, CITATIONS_DEFAULT, DATES_EN, EXTRACTION_STRINGS} from './kits/extraccion-de-hechos.js';

const ID = 'LAW-0068';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.02, 0.1], trails: [0.05, 0.17], dim: [0.2, 0.25], grow: [0.25, 0.29], open: [0.29, 0.4], before: [0.41, 0.46],
  // the old wording lifts out of the lens (0.50–0.57) together with its old tag; only then is it struck
  // through in the docked chip, while the new wording and its tag drop in (0.57–0.65)
  change: [0.5, 0.64], state: [0.5, 0.65], strike: [0.58, 0.635],
  close: [0.76, 0.84], shrink: [0.84, 0.88], ctxUpdate: [0.8, 0.88], marker: [0.89, 0.96],
};

const STRINGS = {
  en: {wording: 'Wording', quotedAt: 'Quoted from the page', notOnPage: 'Not written on the page'},
  es: {wording: 'Redacción', quotedAt: 'Citado de la página', notOnPage: 'No figura en la página'},
};

const sceneSchema = {
  ...extractionFields,
  ...inspectFields(['wording']),
};
sceneSchema.focusTarget = {...sceneSchema.focusTarget, description: 'Detail that is enlarged and substituted: the wording of the first entry on the fact card'};
sceneSchema.beforeValue = {...sceneSchema.beforeValue, description: 'Wording of the first entry before the substitution (by default the copy of its sentence)'};
sceneSchema.afterValue = {...sceneSchema.afterValue, description: 'Alternative wording. Its state is a plain text comparison with the page: written there (quoted, ¶ found) or not written on the page'};

const defaultParams = {
  query: {
    facts: [
      {label: 'Who signed the delivery note', sentence: 3},
      {label: 'When the goods were collected', sentence: 2},
    ],
    placeholder: 'Facts to extract…',
  },
  sources: SOURCES_EN,
  citations: CITATIONS_DEFAULT,
  dates: DATES_EN,
  focusTarget: 'wording',
  beforeValue: 'Party B signed the delivery note on Day 4.',
  afterValue: 'Party B received the goods on Day 4.',
  detailGeometry: {zoom: 1.9, placement: 'auto'},
  contextLabels: {context: 'Fact card after the extraction', marker: 'Wording changed'},
};

const M = 14;
const CAP = 56;
const STAND = 34;

/**
 * Sizes per layout shape (design units). The design space is fitted into the
 * caption-safe box at ≈0.82 (16:9), ≈0.84 (1:1) and ≈0.97 (9:16) px per unit
 * at 1080p, so entry text, tags and chips stay ≥ 20 px in every ratio.
 */
const SZ = {
  landscape: {text: 30, min: 25, tag: 25, ann: 27, marker: 25, cardTitle: 30, source: 21, plate: 28},
  square: {text: 28, min: 24, tag: 24, ann: 26, marker: 24, cardTitle: 29, source: 20, plate: 26},
  portrait: {text: 27, min: 21, tag: 23, ann: 25, marker: 23, cardTitle: 28, source: 20, plate: 25},
};

/** Chip max width that splits a wrapped text into lines of similar length (no orphan word). */
function balancedMax(ctx, text, o) {
  const c = chip(ctx, text, {...o, x: 0, y: 0});
  const n = c.fit.lines.length;
  if (n < 2 || c.fit.truncated) return o.maxWidth;
  let lo = c.box.w / n, hi = o.maxWidth;
  for (let k = 0; k < 10; k++) {
    const mid = (lo + hi) / 2;
    const cc = chip(ctx, text, {...o, x: 0, y: 0, maxWidth: mid});
    if (!cc.fit.truncated && cc.fit.lines.length === n && cc.fit.size === c.fit.size) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi) + 1;
}

/** Neutral change glyph (Δ in a disc): drawn, so it stays with labels hidden. */
function deltaGlyph(ctx, cx, cy, R) {
  const th = ctx.theme;
  const s = R * 0.55;
  return g(null,
    h('circle', {cx: r(cx), cy: r(cy), r: R, fill: th.accent2, stroke: th.paper, 'stroke-width': 3.5}),
    h('path', {d: `M${r(cx)} ${r(cy - s)}L${r(cx + s * 0.95)} ${r(cy + s * 0.72)}L${r(cx - s * 0.95)} ${r(cy + s * 0.72)}Z`, fill: 'none', stroke: '#fff', 'stroke-width': 3.4, 'stroke-linejoin': 'round'}));
}

/** Lens window rectangle: grown in place around the entry (g), then slid out to its spot (sl). */
function lensRect(S, D, g, sl) {
  const k = 1 + 0.1 * g;
  const w0 = S.w * k, h0 = S.h * k;
  const w = w0 + (D.w - w0) * sl, hh = h0 + (D.h - h0) * sl;
  const cx = S.x + S.w / 2 + (D.x + D.w / 2 - (S.x + S.w / 2)) * sl, cy = S.y + S.h / 2 + (D.y + D.h / 2 - (S.y + S.h / 2)) * sl;
  return {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
}

/** Clip for the docked old wording: everything except the lens window's rectangle. */
function annClip(L, win) {
  const F = {x: -2 * L.D.w, y: -2 * L.D.h, w: 5 * L.D.w, h: 5 * L.D.h};
  const outer = `M${r(F.x)} ${r(F.y)}h${r(F.w)}v${r(F.h)}h${r(-F.w)}Z`;
  return win ? outer + roundRectPath(win.x, win.y, win.w, win.h, 26) : outer;
}

/** Frame values for the lens nodes (see frameworks/lens.js) for a window rectangle of our own. */
function lensFrame(L, g, sl, dim) {
  const S = L.source;
  const R = lensRect(S, L.dest, g, sl);
  const k = R.w / S.w, ky = R.h / S.h;
  const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
  const on = g > 0.001;
  // cone lines between the entry and the window (only once the window has left the entry)
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2}, rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  let a1, a2, b1, b2;
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x, rx = rc.x > sc.x ? R.x : R.x + R.w;
    [a1, a2, b1, b2] = [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  } else {
    const sy = rc.y > sc.y ? S.y + S.h : S.y, ry = rc.y > sc.y ? R.y : R.y + R.h;
    [a1, a2, b1, b2] = [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
  }
  const cones = on && sl > 0.15 ? 1 : 0;
  return {
    'lens-dim': {opacity: r(0.42 * dim, 3)},
    'lens-src': {opacity: on && sl > 0.05 ? 1 : 0},
    'lens-coneA': {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: cones},
    'lens-coneB': {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: cones},
    'lens-cliprect': rect,
    'lens-win': {opacity: on ? 1 : 0},
    'lens-shadow': {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height},
    'lens-bg': rect,
    'lens-border': rect,
    'lens-content': {transform: `${T(R.x - S.x * k, R.y - S.y * ky)} scale(${r(k, 4)} ${r(ky, 4)})`},
  };
}

/**
 * One card entry: copy strip (wording + copied highlight), its index flag and
 * a state tag underneath. Drawn in WORLD coordinates so the lens can show a
 * real copy of it. `frame(p, stateP)` swaps the wording (p) and the state
 * (stateP); an old value always lifts out before the new one drops in.
 */
function cardEntry(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w, stripH} = o;
  const n = Math.max(4, Math.round(stripH / 10));
  const zig = [];
  for (let k = 0; k <= n; k++) zig.push(`${r(x + (k % 2 ? 5 : 0))} ${r(y + (stripH * k) / n)}`);
  const body = `M${zig.join('L')}H${r(x + w - 4)}Q${r(x + w)} ${r(y + stripH)} ${r(x + w)} ${r(y + stripH - 4)}V${r(y + 4)}Q${r(x + w)} ${r(y)} ${r(x + w - 4)} ${r(y)}Z`;
  const tx = x + 16, ty = y + 9;
  const bands = f => f.lines.map((line, j) => {
    const lw = ctx.measure(line, f.size, f.weight, f.family);
    return h('rect', {x: r(tx - 5), y: r(ty + j * f.lineHeight - f.size * 0.08), width: r(lw + 10), height: r(f.size * 1.16), rx: 4, fill: o.color, opacity: 0.4});
  });
  const words = (f, i, found) => g({name: `${P}-w${i}`, opacity: i ? 0 : 1},
    found ? g(null, bands(f)) : null,
    textOrBars(ctx, f, {x: tx, y: ty, fill: th.ink, show: ctx.show('all'), barOpacity: 0.5}));
  const flag = flagMarker(ctx, {name: `${P}-flag`, color: o.color, tabInk: o.tabInk, pins: [{key: 'b', text: o.pinBefore}, {key: 'a', text: o.pinAfter}]});
  const tagSize = o.tagSize ?? 22;
  const tagH = tagSize * 1.75;
  const tagY = y + stripH + 10;
  const iconR = 17;
  let tagRight = x + 2 * iconR + 8;
  const tags = [0, 1].map(i => {
    const found = i ? o.foundAfter : o.foundBefore;
    const text = found ? `${ctx.t.quotedAt} · ${i ? o.pinAfter : o.pinBefore}` : ctx.t.notOnPage;
    const icon = requestIcon(ctx, found ? 'quote' : 'note', x + iconR + 1, tagY + tagH / 2, o.color, null);
    const tag = ctx.show('key') ? statusTag(ctx, text, {x: x + 2 * iconR + 10, y: tagY, size: tagSize, maxWidth: o.tagMax ?? w, color: found ? th.inkSoft : th.accent2, fill: th.card}) : null;
    if (tag) tagRight = Math.max(tagRight, tag.box.x + tag.box.w);
    return g({name: `${P}-tag${i}`, opacity: i ? 0 : 1}, icon, tag && tag.node);
  });
  const node = g({name: P},
    h('path', {d: body, fill: th.shadow, transform: 'translate(4 6)'}),
    h('path', {d: body, fill: th.paper}),
    h('path', {name: `${P}-edge0`, d: body, fill: 'none', stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round', opacity: o.foundBefore ? 1 : 0}),
    h('path', {name: `${P}-edge1`, d: body, fill: 'none', stroke: o.color, 'stroke-width': 3, 'stroke-dasharray': '10 7', opacity: o.foundBefore ? 0 : 1}),
    words(o.fitBefore, 0, o.foundBefore),
    words(o.fitAfter, 1, o.foundAfter),
    tags,
    g({transform: T(x + w - FLAG.inset, y + stripH / 2)}, flag.node),
  );
  const fb = o.foundBefore, fa = o.foundAfter;
  const frame = (p, stateP) => {
    const out = clamp(p * 2), inn = clamp(p * 2 - 1);
    const st = clamp(stateP);
    // the old tag lifts out completely before the new one drops in (never overprinted)
    const tOut = clamp(st * 2), tIn = clamp(st * 2 - 1);
    const solid = (fb ? 1 - st : 0) + (fa ? st : 0);
    return {
      [`${P}-w0`]: {opacity: r(1 - out, 3), transform: `translate(0 ${r(-12 * out)})`},
      [`${P}-w1`]: {opacity: r(inn, 3), transform: `translate(0 ${r(12 * (1 - inn))})`},
      [`${P}-edge0`]: {opacity: r(solid, 3)},
      [`${P}-edge1`]: {opacity: r(1 - solid, 3)},
      [`${P}-tag0`]: {opacity: r(1 - tOut, 3), transform: `translate(0 ${r(-10 * tOut)})`},
      [`${P}-tag1`]: {opacity: r(tIn, 3), transform: `translate(0 ${r(10 * (1 - tIn))})`},
      [`${P}-flag-pin-b`]: {opacity: st < 0.5 ? 1 : 0},
      [`${P}-flag-pin-a`]: {opacity: st >= 0.5 ? 1 : 0},
    };
  };
  const box = {x: x - 8, y: y - 8, w: w + FLAG.w - FLAG.inset + 16, h: tagY + tagH + 8 - (y - 8)};
  return {node, frame, box, flagAt: {x: x + w - FLAG.inset, y: y + stripH / 2}, stripBox: {x, y, w, h: stripH}, tagRow: {y: tagY, h: tagH, right: tagRight}};
}

/**
 * Full layout. Every ratio keeps a text-free "lens pad" inside the context —
 * the fact card's blank lower lines (and, in square, the library bay under
 * the book) — so the lens window never covers any writing and the space it
 * uses is the card's own space after the return.
 *  landscape: library bay | open book | fact card (full height)
 *  square:    open book over the library bay | fact card (full height)
 *  portrait:  open book + library bay on top, fact card across the bottom
 * @param {any} ctx
 * @param {{bookH?:number, text?:number, condense?:boolean}} o
 */
function compose(ctx, o = {}) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const S = {...SZ[shape], ...(o.text ? {text: o.text, min: Math.min(SZ[shape].min, o.text)} : {})};
  const port = shape === 'portrait';
  const land = shape === 'landscape';
  const top = CAP + 8;
  const leftW = land ? 64 : port ? 44 : 36;
  // book width: in landscape the card column keeps ≈1.7× the entry's width for the lens
  const bookW = land ? Math.round(clamp((D.w - 316) / 2.7, 520, 720)) : port ? Math.min(640, D.w - 2 * M - 270) : Math.round(clamp(D.w * 0.44, 420, 520));
  const BX = land ? M + 254 : M, BY = top;
  const bookH = land ? D.h - top - M - STAND : (o.bookH ?? (port ? 620 : Math.round((D.h - top - M) * 0.65)));
  const sentences = p.sources.sentences;
  const n = sentences.length;
  const pal = factPalette(ctx);
  const facts = p.query.facts.slice(0, 2).map((f, i) => ({label: f.label, sentence: sentenceIndex(f.sentence, n), color: pal[i]}));
  const bandColors = sentences.map((_, i) => {
    const hit = facts.filter(f => f.sentence === i).map(f => f.color.band);
    return hit.length ? hit : null;
  });
  // last resort for very long pages: sentences no entry cites are condensed to simulated lines
  const cited = new Set([...facts.map(f => f.sentence), findOnPage(p.beforeValue, sentences), findOnPage(p.afterValue, sentences)]);
  const condense = o.condense ? sentences.map((_, i) => i).filter(i => !cited.has(i)) : [];
  const book = openBook(ctx, {prefix: 'bk', w: bookW, h: bookH, leftW, cover: coverColor(ctx), volume: p.sources.volume, title: p.sources.title,
    pageRef: p.citations.page, date: p.dates.source, sentences, bandColors, size: S.text, minSize: S.min, standH: STAND, condense});
  const size = book.size;
  const stripW = book.sentences[0].strip.w;
  const rowW = stripW + FLAG.w - FLAG.inset;

  // entries: wording at the page size inside the strip (same width as the copy), balanced lines
  const textW = stripW - 16 - 26;
  const fitW = text => fitBalanced(ctx, text, {maxWidth: textW, size, minSize: size * 0.9, maxLines: 3, weight: 500, family: 'serif', leading: 1.22});
  const stripOf = f => f.height + 18 + size * 0.25;
  const focus = facts[0];
  const before = p.beforeValue, after = p.afterValue;
  const foundB = findOnPage(before, sentences);
  const foundA = findOnPage(after, sentences);
  const citedB = foundB >= 0 ? foundB : focus.sentence;
  const citedA = foundA >= 0 ? foundA : citedB;
  const fB = fitW(before), fA = fitW(after);
  const stripH0 = Math.max(stripOf(fB), stripOf(fA));
  const others = facts.slice(1).map(f => ({f, fit: fitW(sentences[f.sentence])}));
  const tagH = S.tag * 1.75;

  // the old wording (struck through during the substitution) sits in a row docked under the
  // entry's state tag: it is attached to the entry from the moment it is named to the end
  const chipsOn = ctx.show('key');
  const beforeText = `${t.wording}: ${before}`;
  const cb = {size: S.ann, maxLines: 3, maxWidth: Math.min(rowW, 640)};
  const bMax = chipsOn ? balancedMax(ctx, beforeText, cb) : 0;
  const probeB = chipsOn ? chip(ctx, beforeText, {...cb, x: 0, y: 0, maxWidth: bMax}).box : {w: 0, h: 0};

  // change marker (Δ disc + chip) on the entry row: right of the state tag when the row has room,
  // else right of the old wording, else on its own row
  const disc = 19;
  const mMax = Math.max(160, rowW - 2 * disc - 12);
  const mProbe = chipsOn ? chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: mMax, size: S.marker, maxLines: 2}).box : {w: 0, h: 0};
  const markW = 2 * disc + (chipsOn ? 10 + mProbe.w : 0);
  const tagText = (f, c) => (f >= 0 ? `${t.quotedAt} · ${pinText(p.citations, c)}` : t.notOnPage);
  const tagW = chipsOn ? Math.max(...[[foundB, citedB], [foundA, citedA]].map(([f, c]) => 44 + statusTag(ctx, tagText(f, c), {x: 0, y: 0, size: S.tag, maxWidth: rowW - 44}).box.w)) : 44;
  const markH = Math.max(2 * disc, mProbe.h);
  let markSlot = 'tag';
  if (tagW + 18 + markW > rowW) markSlot = chipsOn && probeB.w + 18 + markW <= rowW ? 'was' : 'row';
  const wasH = chipsOn ? Math.max(probeB.h, markSlot === 'was' ? markH : 0) : 0;
  const entry1H = stripH0 + 10 + tagH + (wasH ? 14 + wasH : 0) + (markSlot === 'row' ? 12 + markH : 0);
  const otherH = f => stripOf(f) + 10 + tagH;

  // card: its place; the height reaches the bottom so its blank lower lines hold the lens pad
  const cardX = land ? BX + bookW + 60 : port ? M : M + bookW + 50;
  const cardY = port ? BY + bookH + STAND + 26 : top;
  // portrait: the card ends short of the library bay, leaving a corridor under it where the trails run
  // down to their entries OUTSIDE the card (never across its header or another entry's ¶ tab); the bay
  // stands the full height beside it. (Only when the card still holds its entries with room to spare.)
  const bayX = BX + bookW + 64;
  const narrowW = bayX - 46 - cardX;
  const corridor = port && narrowW >= 22 + rowW + 18 ? {x: cardX + narrowW + 14, step: 14} : null;
  const cardW = corridor ? narrowW : D.w - M - cardX;
  // (portrait: the source line wraps before the trail lanes at the card's right)
  const cardOpts = {prefix: 'cd', w: cardW, sourceMax: port && !corridor ? 22 + rowW + 12 - 26 : undefined, title: EXTRACTION_STRINGS[p.locale === 'es' ? 'es' : 'en'].card, titleSize: S.cardTitle, sourceSize: S.source,
    sourceLine: [p.sources.volume, p.citations.page, p.dates.source, p.dates.extracted ? `→ ${p.dates.extracted}` : ''].filter(Boolean).join(' · '),
    slots: [{h: entry1H}, ...others.map(x => ({h: otherH(x.fit)}))], gap: 20, stripX: 22};
  const need = factCard(ctx, {...cardOpts, h: 1000}).needH - 10;
  const cardH = D.h - M - cardY;
  // the card's slots keep their natural spacing (the blank lines stay together at the bottom)
  const card = factCard(ctx, {...cardOpts, h: cardH, reserve: Math.max(0, cardH - need)});
  const CX = cardX, CY = cardY;

  const mkEntry = (prefix, k) => {
    const sl = card.slots[k];
    if (k === 0) {
      return cardEntry(ctx, {prefix, x: CX + sl.x, y: CY + sl.y, w: stripW, stripH: stripH0, fitBefore: fB, fitAfter: fA, color: focus.color.band, tabInk: focus.color.tabInk,
        pinBefore: pinText(p.citations, citedB), pinAfter: pinText(p.citations, citedA), foundBefore: foundB >= 0, foundAfter: foundA >= 0, tagSize: S.tag, tagMax: rowW - 44});
    }
    const x = others[k - 1];
    const pin = pinText(p.citations, x.f.sentence);
    return cardEntry(ctx, {prefix, x: CX + sl.x, y: CY + sl.y, w: stripW, stripH: stripOf(x.fit), fitBefore: x.fit, fitAfter: x.fit, color: x.f.color.band, tabInk: x.f.color.tabInk,
      pinBefore: pin, pinAfter: pin, foundBefore: true, foundAfter: true, tagSize: S.tag, tagMax: rowW - 44});
  };
  const entries = facts.map((_, k) => mkEntry(`e${k}`, k));
  const lensEntry = mkEntry('le0', 0);
  const e0 = entries[0];

  // library bay: left of the book (landscape), beside it (portrait) or under it (square)
  let shelfBox = null;
  if (land) shelfBox = {x: M, y: top, w: 230, h: D.h - top - M, rows: 5};
  else if (port) {
    const x = BX + bookW + 64;
    const sh = corridor ? D.h - M - top : bookH + STAND;
    shelfBox = {x, y: top, w: D.w - M - x, h: sh, rows: corridor ? clamp(Math.round(sh / 200), 3, 6) : bookH > 560 ? 3 : 2};
  } else {
    const y0 = BY + bookH + STAND + 22;
    const sh = D.h - M - y0;
    if (sh >= 110) shelfBox = {x: M, y: y0, w: bookW, h: sh, rows: sh > 280 ? 2 : 1};
  }
  const shelf = shelfBox && libraryShelf(ctx, {prefix: 'sh', w: shelfBox.w, h: shelfBox.h, rows: shelfBox.rows, plate: shelfBox.h >= 130, plateSize: S.plate, plateW: land ? 0.92 : port ? 0.8 : 0.5, plateLines: 3,
    label: p.sources.library, cover: coverColor(ctx), gapRow: Math.min(1, shelfBox.rows - 1), seedKey: 'inspect-shelf'});

  // trails: from each entry back to the sentence it cites (right edge of the page, at its notch)
  const notch = i => ({x: BX + book.sentences[i].notch.x + 14, y: BY + book.sentences[i].notch.y});
  // (card below the page: each trail leaves right of its ¶ tab, in its own lane, so no trail crosses a tab)
  // (beside the strip: the trail's start ring sits fully outside the strip's zigzag edge)
  const trailFrom = (e, k) => (!port ? {x: e.stripBox.x - 10, y: e.stripBox.y + e.stripBox.h / 2}
    : corridor ? {x: e.flagAt.x + FLAG.w + 10, y: e.stripBox.y + e.stripBox.h / 2} : {x: e.flagAt.x + FLAG.w + 12 + 20 * k, y: e.stripBox.y + e.stripBox.h / 2});
  const trailPath = (a, b, k = 0) => {
    // (corridor: out of the tab's end to the corridor, up it and across to the sentence's notch)
    if (corridor) {
      const lx = corridor.x + corridor.step * k;
      return roundedRoute([a, {x: lx, y: a.y}, {x: lx, y: b.y}, b], 22);
    }
    const c1 = !port ? {x: a.x - (a.x - b.x) * 0.5, y: a.y} : {x: a.x, y: a.y - (a.y - b.y) * 0.5};
    const c2 = !port ? {x: b.x + (a.x - b.x) * 0.5, y: b.y} : {x: b.x + 40, y: b.y};
    return cubicPolyline(a, c1, c2, b, 40);
  };
  const trailDefs = [];
  entries.forEach((e, k) => {
    const citedIdx = k === 0 ? citedB : facts[k].sentence;
    trailDefs.push({key: `tr${k}`, poly: trailPath(trailFrom(e, k), notch(citedIdx), k), dashed: k === 0 ? foundB < 0 : false, color: facts[k].color.band});
  });
  trailDefs.push({key: 'tr0a', poly: trailPath(trailFrom(e0, 0), notch(citedA), 0), dashed: foundA < 0, color: focus.color.band});
  const trails = trailDefs.map(d => {
    const len = d.poly.total;
    const a = d.poly.at(0), b = d.poly.at(1);
    return {key: d.key, len, node: g({name: d.key, opacity: 0},
      h('path', {name: `${d.key}-line`, d: d.poly.d(1), fill: 'none', stroke: d.color === th.accent3 ? '#b27a1f' : d.color, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': d.dashed ? '4 9' : `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': d.dashed ? 0 : r(len)}),
      h('circle', {cx: r(a.x), cy: r(a.y), r: 6, fill: th.card, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {name: `${d.key}-end`, cx: r(b.x), cy: r(b.y), r: 6, fill: th.ink, opacity: 0}))};
  });

  // old wording chip (docked under the entry's state tag) with its strike lines
  let beforeChip = null, strikes = [];
  if (chipsOn) {
    beforeChip = chip(ctx, beforeText, {...cb, maxWidth: bMax, x: e0.stripBox.x, y: e0.tagRow.y + e0.tagRow.h + 14, anchor: 'start', fill: th.card, name: 'ann-before', textName: 'ann-before-text'});
    const f = beforeChip.fit;
    const padY = S.ann * 0.38;
    strikes = f.lines.map((line, i) => {
      const lw = ctx.measure(line, f.size, f.weight, f.family);
      const y = beforeChip.box.y + padY + f.size * 0.8 - f.size * 0.3 + i * f.lineHeight;
      return {len: lw + 8, node: h('line', {name: `ann-strike-${i}`, x1: r(beforeChip.box.cx - lw / 2 - 4), x2: r(beforeChip.box.cx + lw / 2 + 4), y1: r(y), y2: r(y), stroke: th.accent, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw + 8)} ${r(lw + 18)}`, 'stroke-dashoffset': r(lw + 8)})};
    });
  }

  // change marker on the entry row
  const markY = markSlot === 'tag' ? e0.tagRow.y + e0.tagRow.h / 2
    : markSlot === 'was' ? e0.tagRow.y + e0.tagRow.h + 14 + wasH / 2
      : e0.tagRow.y + e0.tagRow.h + (wasH ? 14 + wasH : 0) + 12 + markH / 2;
  const markX0 = markSlot === 'tag' ? e0.stripBox.x + tagW + 18 : markSlot === 'was' ? e0.stripBox.x + probeB.w + 18 : e0.stripBox.x;
  const markChip = chipsOn ? chip(ctx, p.contextLabels.marker, {x: markX0 + 2 * disc + 10, y: markY - mProbe.h / 2, maxWidth: mMax, size: S.marker, maxLines: 2, fill: th.card, stroke: th.accent2}) : null;
  const marker = g({name: 'marker', opacity: 0}, deltaGlyph(ctx, markX0 + disc, markY, disc), markChip && markChip.node);
  const markerBox = {x: markX0, y: markY - markH / 2, w: markW, h: markH};

  const ctxCap = ctx.show('all') ? caption(ctx, `${EXTRACTION_STRINGS[p.locale === 'es' ? 'es' : 'en'].context}: ${p.contextLabels.context}`, {x: M, y: 8, maxWidth: D.w - 2 * M, size: 30, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;

  // lens window: the largest zoom (≤ the requested one) whose window fits a spot that covers no
  // writing (page text, card header, old wording, marker, library plate), nearest the entry. The
  // other card entries are avoided too; only when the card is full may the window lie over them
  // (they recede under the dimming while the window covers them and come back when it folds).
  const source = e0.box;
  const hard = [source, markerBox];
  if (ctxCap) hard.push(ctxCap.box);
  hard.push({x: BX + book.page.x, y: BY + book.page.y, w: book.page.w, h: book.headerBottom - book.page.y + 8});
  book.sentences.forEach((sn, i) => { if (!condense.includes(i)) hard.push({x: BX + book.page.x, y: BY + sn.strip.y, w: sn.strip.x + sn.strip.w - book.page.x, h: sn.strip.h}); });
  hard.push({x: CX, y: CY, w: cardW, h: card.headerBottom + 4});
  if (beforeChip) hard.push(beforeChip.box);
  if (shelf && shelf.plate) hard.push({x: shelfBox.x + shelf.plate.x, y: shelfBox.y + shelf.plate.y, w: shelf.plate.w, h: shelf.plate.h});
  const soft = entries.slice(1).map(e => e.box);
  const hit = (b, q) => b.x < q.x + q.w + 10 && b.x + b.w + 10 > q.x && b.y < q.y + q.h + 10 && b.y + b.h + 10 > q.y;
  const sc = {x: source.x + source.w / 2, y: source.y + source.h / 2};
  const search = (zMin, allowSoft) => {
    for (let z = p.detailGeometry.zoom; z >= zMin - 1e-9; z = Math.round((z - 0.05) * 100) / 100) {
      const w = Math.min(D.w - 2 * M, source.w * z), hh = w * source.h / source.w;
      let found = null, bc = Infinity;
      for (let y = top; y + hh <= D.h - M; y += 8) {
        for (let x = M; x + w <= D.w - M; x += 12) {
          const b = {x, y, w, h: hh};
          if (hard.some(q => hit(b, q))) continue;
          const nSoft = soft.filter(q => hit(b, q)).length;
          if (nSoft && !allowSoft) continue;
          const cost = nSoft * 1e4 + Math.hypot(x + w / 2 - sc.x, y + hh / 2 - sc.y);
          if (cost < bc) { bc = cost; found = b; }
        }
      }
      if (found) return found;
    }
    return null;
  };
  let dest = search(1.3, false) || search(1.3, true) || search(1.15, false) || search(1.15, true);
  let lensFit = dest ? 'clear' : 'overlap';
  if (!dest) {
    // no clear spot (never reached by the presets): the least-covering spot at a modest zoom
    const w = Math.min(D.w - 2 * M, source.w * 1.15), hh = w * source.h / source.w;
    let best = Infinity;
    for (let y = top; y + hh <= D.h - M; y += 8) {
      for (let x = M; x + w <= D.w - M; x += 12) {
        const b = {x, y, w, h: hh};
        const cost = hard.filter(q => hit(b, q)).length * 1e5 + Math.hypot(x + w / 2 - sc.x, y + hh / 2 - sc.y);
        if (cost < best) { best = cost; dest = b; }
      }
    }
  }
  // entries the window lies over at its spot (only when the card is full); what it merely passes over
  // on its way stays in the context (the window is opaque: nothing shows through it)
  const covered = entries.map((e, k) => k > 0 && hit(dest, e.box));
  const L2 = lens(ctx, {name: 'lens', source, dest, content: lensEntry.node, frame: {x: -2 * D.w, y: -2 * D.h, w: 5 * D.w, h: 5 * D.h}, color: th.accent});
  // how far the window has slid when it no longer covers any part of the entry
  let clearAt = 1;
  for (let f = 0; f <= 1.0001; f += 0.02) {
    const R = lensRect(source, dest, 1, f);
    if (!(R.x < source.x + source.w && R.x + R.w > source.x && R.y < source.y + source.h && R.y + R.h > source.y)) { clearAt = f; break; }
  }

  return {book, BX, BY, shelf, shelfBox, card, CX, CY, cardNeed: need, cardMaxH: cardH, entries, lensEntry, trails, L2, source, dest, lensFit, beforeChip, strikes, ctxCap, marker, markerBox, facts,
    before, after, foundB, foundA, citedB, citedA, textSize: size, pageOverflow: book.overflow, condensed: condense.length > 0, bookH: port ? undefined : o.bookH, covered, clearAt, D};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1040, 880], portrait: [900, 1400]},
  layout(ctx) {
    const D = ctx.design;
    const shape = ctx.view.shape;
    const port = shape === 'portrait';
    const S = SZ[shape];
    // portrait: the open book takes the height the card leaves; the card keeps its entries plus a
    // blank lower part (≈1.5× an entry) that the lens window uses
    const bookFor = L => Math.max(360, D.h - M - (L.cardNeed + 1.5 * L.source.h + 40) - 26 - STAND - (CAP + 8));
    // square: the book / library split is chosen with the page, the card and the lens
    const splits = shape === 'square' ? [0.65, 0.58, 0.52].map(f => Math.round((D.h - CAP - 8 - M) * f)) : [undefined];
    const fits = L => L.cardNeed <= L.cardMaxH + 1 && L.pageOverflow <= 0;
    const score = L => (fits(L) ? 0 : 1e4) + (L.lensFit === 'clear' ? 0 : 1e3) + Math.max(0, S.min - L.textSize) * 60
      - Math.min(L.textSize, S.text) * 4 - L.dest.w / L.source.w * 10 + (L.condensed ? 15 : 0);
    const make = o => {
      let L = compose(ctx, o);
      if (port) for (let k = 0; k < 3; k++) L = compose(ctx, {...o, bookH: bookFor(L)});
      return L;
    };
    let best = null;
    // sentences no entry cites are condensed to simulated lines only when the full page does not
    // leave the entries their size or the lens a clear spot
    for (const condense of [false, true]) {
      for (const bookH of splits) {
        const L = make({condense, bookH});
        if (!best || score(L) < score(best)) best = L;
      }
      if (fits(best) && best.lensFit === 'clear' && best.textSize >= S.min) break;
    }
    let L = best;
    for (let s = Math.floor(L.textSize) - 1; !fits(L) && s >= 16; s--) L = make({text: s, condense: L.condensed, bookH: L.bookH});
    return L;
  },
  build(ctx, L) {
    return g(null,
      L.ctxCap && L.ctxCap.node,
      L.shelf && g({transform: T(L.shelfBox.x, L.shelfBox.y)}, L.shelf.node),
      g({transform: T(L.BX, L.BY)}, L.book.node),
      g({transform: T(L.CX, L.CY)}, L.card.node),
      L.trails.map(tr => tr.node),
      L.entries.map(e => e.node),
      L.marker,
      L.L2.node,
      // the docked old wording stays legible above the dimming, but the lens window hides it where the
      // window passes over it (a clip with the window's rectangle cut out)
      L.beforeChip && g({name: 'ann', opacity: 0},
        h('defs', null, h('clipPath', {id: ctx.id('ann-clip')}, h('path', {name: 'ann-clip-path', d: annClip(L, null), 'clip-rule': 'evenodd'}))),
        g({'clip-path': ctx.ref('ann-clip')}, L.beforeChip.node, g(null, L.strikes.map(s => s.node)))),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const s = w => seg(u, ...W[w]);
    // context: the extraction's result on the page (highlights + notches of the flagged sentences)
    L.facts.forEach(f => {
      const slots = L.book.sentences[f.sentence].colors;
      slots.forEach((_, c) => Object.assign(nodes, L.book.bandFrame(f.sentence, 1, 1, c)));
    });
    const change = ease.inOutSine(s('change'));
    const state = s('state');
    const ctxUpd = s('ctxUpdate');
    Object.assign(nodes, L.entries[0].frame(ctxUpd, ctxUpd));
    for (let k = 1; k < L.entries.length; k++) Object.assign(nodes, L.entries[k].frame(0, 0));
    Object.assign(nodes, L.lensEntry.frame(change, state));
    // trails: draw on, then the focus trail swaps to its updated form with the context
    const tp = s('trails');
    L.trails.forEach(tr => {
      const isNew = tr.key === 'tr0a';
      const isOld = tr.key === 'tr0';
      const op = isNew ? ctxUpd : isOld ? 1 - ctxUpd : 1;
      nodes[tr.key] = {opacity: r(tp > 0 ? op : 0, 3)};
      nodes[`${tr.key}-line`] = {'stroke-dashoffset': r(isNew ? 0 : tr.len * (1 - tp))};
      nodes[`${tr.key}-end`] = {opacity: tp >= 0.98 ? 1 : 0};
    });
    // lens: the context dims first, then the window (opaque from the start, so the growing copy
    // never shows through over the neighbouring entry) moves out to its place; it folds back later
    // the window first grows in place over the entry (covering it completely: no text is doubled),
    // then slides out to its spot; on the return it slides back and shrinks onto the entry. The
    // context entry itself steps back while the window leaves or rejoins it.
    const grow = ease.inOutSine(seg(u, ...W.grow)) * (1 - ease.inOutSine(seg(u, ...W.shrink)));
    const slide = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const lp = grow * slide;
    const dim = s('dim') * (1 - seg(u, W.close[0] + 0.04, W.shrink[1]));
    Object.assign(nodes, lensFrame(L, grow, slide, dim));
    const lifted = grow > 0 ? (slide < L.clearAt ? 1 : clamp(1 - (slide - L.clearAt) / 0.12)) : 0;
    nodes.e0 = {opacity: r(1 - lifted, 3)};
    // what the window passes over stays in the (dimmed) context at full strength — the other entries
    // (strip, words, flag, tag), the trails landing on them and the docked old wording never fade: the
    // opaque window only hides the part of them it actually covers, so nothing blinks while it passes
    const win = grow > 0.001 ? lensRect(L.source, L.dest, grow, slide) : null;
    if (L.beforeChip) {
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
      nodes['ann-clip-path'] = {d: annClip(L, win)};
      nodes['ann-before'] = {opacity: r(s('before') * (1 - 0.4 * s('strike')), 3)};
      const sp = s('strike');
      const nn = L.strikes.length;
      L.strikes.forEach((st, i) => { nodes[`ann-strike-${i}`] = {'stroke-dashoffset': r(st.len * (1 - clamp(sp * nn - i)))}; });
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(s('ctxCaption'), 3)};
    nodes.marker = {opacity: r(s('marker'), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const ctxState = ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before';
    const stateOf = found => (found >= 0 ? 'quoted' : 'not-on-page');
    const src = L.source;
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        lensWording: change >= 1 ? L.after : L.before,
        lensState: state >= 0.5 ? stateOf(L.foundA) : stateOf(L.foundB),
        contextDatum: ctxState,
        contextWording: ctxUpd >= 0.5 ? L.after : L.before,
        contextState: ctxUpd >= 0.5 ? stateOf(L.foundA) : stateOf(L.foundB),
        trailTo: (ctxUpd >= 0.5 ? L.citedA : L.citedB) + 1,
        trailStyle: (ctxUpd >= 0.5 ? L.foundA : L.foundB) >= 0 ? 'solid' : 'dashed',
        focusTarget: 'wording',
        source: {x: r(src.x), y: r(src.y), w: r(src.w), h: r(src.h)},
        entryBox: {x: r(L.entries[0].box.x), y: r(L.entries[0].box.y), w: r(L.entries[0].box.w), h: r(L.entries[0].box.h)},
        otherEntriesUnchanged: true,
        oldWordingShown: L.beforeChip ? r(s('before'), 3) : null,
        oldWordingStruck: L.beforeChip ? r(s('strike'), 3) : null,
        markerOnEntryRow: L.markerBox.y >= L.entries[0].box.y && L.markerBox.y + L.markerBox.h <= L.CY + L.card.h,
        fit: {lensZoom: r(L.dest.w / L.source.w, 3), lensPlace: L.lensFit, lensOverEntries: L.covered.filter(Boolean).length, pageOverflow: r(L.pageOverflow), condensed: L.condensed, textSize: r(L.textSize, 2), cardNeed: r(L.cardNeed), cardMaxH: r(L.cardMaxH)},
        marker: r(s('marker'), 3),
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
    slug: 'research-07-inspect',
    title: 'Fact extraction — inspect an entry\'s wording against its page',
    titleEs: 'Extracción de hechos — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Extracción de hechos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the open volume with its flagged sentences, the fact card with copied entries (each traced back to its sentence) and the library bay. The context dims and a lens window, placed on a spot that holds no writing (the card\'s blank lines, library art), enlarges the first entry and substitutes its wording; the old wording, named in a chip docked under the entry, is struck through. A plain text comparison with the page decides the dependent state (quoted with its ¶, or not written on the page: highlight removed, dashed edge, dashed trail). The lens folds back and a neutral change marker (Δ) joins the entry row; seeking back restores the old wording.',
    tags: ['fact extraction', 'inspect', 'lens', 'wording', 'quotation', 'verbatim', 'pinpoint', 'index card', 'trail'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/extraccion-de-hechos.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
