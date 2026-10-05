/**
 * LAW-0044 — Búsqueda por términos · inspect
 *
 * Storyboard:
 *  0.00–0.20  build: a miniature of the finished search — bookcase with the
 *             open volumes, threads from the kiosk's search box to the tabs
 *             of the matching passages, highlighted words.
 *  0.20–0.45  isolate: a lens (a real enlarged copy drawn at the same
 *             coordinates) opens on the detail that decides the match: the
 *             passage line with its highlighted word and tab (focus
 *             "passage") or the query term chip (focus "term"). The previous
 *             value is written on the annotation.
 *  0.45–0.75  substitute: only that datum is replaced (beforeValue →
 *             afterValue): the old word lifts out with its highlight, the
 *             following words slide to their new places, the new word settles
 *             in, then the dependent state is recomputed from the text — the
 *             tab, thread and kiosk result dot retract where the words no
 *             longer match and are drawn where they now match. The lens and
 *             its source in the context change together (one copy). The old
 *             value stays readable, struck through, on the annotation, which
 *             leaves before the lens closes.
 *  0.75–1.00  return: the lens closes onto its (already identical) source,
 *             the context returns to full size showing the new datum and its
 *             consequence for the links, and a marker pins the changed datum
 *             (marker, previous value struck, → new value). Seeking back
 *             restores the previous datum exactly. No relevance, validity or
 *             outcome is inferred.
 * @module animations/research/LAW-0044
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, r} from '../../core/time.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, caption, textBlock} from '../../primitives/annotate.js';
import {roundRectPath} from '../../core/geometry.js';
import {lens} from '../../frameworks/lens.js';
import {researchFields, RESEARCH_DEFAULTS} from './kits/busqueda-por-terminos-fields.js';
import {searchStage, stageSize, findMatches, matchKey, wordsOf, normWord} from './kits/busqueda-por-terminos.js';

const ID = 'LAW-0044';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  swap: [0.5, 0.62], depend: [0.6, 0.7], after: [0.64, 0.71], annOut: [0.72, 0.76], close: [0.76, 0.85], marker: [0.91, 0.97],
  // the context eases aside (wide: right, stacked: down) for the lens and comes back
  aside: [0.15, 0.21], back: [0.86, 0.92],
};

const STRINGS = {
  en: {passage: 'Word in the passage', term: 'Query term'},
  es: {passage: 'Palabra del pasaje', term: 'Término de la consulta'},
};

const sceneSchema = {
  ...researchFields,
  ...inspectFields(['passage', 'term']),
};

const defaultParams = {
  ...RESEARCH_DEFAULTS,
  focusTarget: 'passage',
  beforeValue: 'notice',
  afterValue: 'notification',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'Results of the term search on the library shelves', marker: 'Word changed'},
};

/**
 * Every layout shows the context full size at build and in the final hold.
 * aside (wide): while the lens is open the context eases to the RIGHT
 * (smaller) and the lens opens on the left, next to the bookcase, so the lens
 * never travels across the kiosk or the researcher. stacked (square /
 * portrait): the context eases down and the lens opens above it, next to the
 * bookcase crown. Portrait recomposes the stage vertically (kiosk under the
 * bookcase, researcher at the kiosk) like the story scene.
 */
const LAYOUT = {
  landscape: {size: [1900, 1000], mode: 'aside', axis: 'horizontal', person: true},
  square: {size: [1300, 1260], mode: 'stacked', axis: 'horizontal', person: false, share: 0.66},
  portrait: {size: [900, 1520], mode: 'stacked', axis: 'vertical', person: true, share: 0.72},
};

/** Replace the first whole-word occurrence of `word` in `text` (keeps punctuation). */
function replaceWord(text, word, next) {
  const ws = wordsOf(text);
  const target = wordsOf(word).map(normWord);
  for (let i = 0; i + target.length <= ws.length; i++) {
    if (target.every((w, k) => normWord(ws[i + k]) === w)) {
      const tail = (ws[i + target.length - 1].match(/[^\p{L}\p{N}]+$/u) || [''])[0];
      return {text: [...ws.slice(0, i), ...wordsOf(next).map((w, k, arr) => (k === arr.length - 1 ? w + tail : w)), ...ws.slice(i + target.length)].join(' '), at: i};
    }
  }
  return null;
}

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const LY = LAYOUT[ctx.view.shape];
    const lay = LY.mode;
    const D = ctx.design;
    const axis = LY.axis;
    const withPerson = LY.person;
    const st = stageSize(axis, withPerson);
    const target = p.focusTarget;
    const mode = p.query.mode || 'exact';
    // design units that render as `n` px in a 1080p frame (key labels ≥ 20 px)
    const unit = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * (1080 / Math.min(ctx.view.width, ctx.view.height));
    const px = n => n / unit;
    const labelSize = Math.max(30, px(22));

    // --- the datum before and after the substitution
    let sources = p.sources.map(s2 => ({...s2, passages: s2.passages.slice()}));
    let query = {...p.query, terms: p.query.terms.map(x => ({...x}))};
    let focus = {source: 0, passage: 0, term: 0};
    let alt = null;
    let extraMatches = [];
    if (target === 'passage') {
      // the first passage containing the before value; else the first matched
      // passage, whose matched word is set to the before value
      let found = null;
      sources.forEach((s2, si) => s2.passages.forEach((txt, pi) => {
        if (!found && replaceWord(txt, p.beforeValue, p.beforeValue)) found = {source: si, passage: pi};
      }));
      if (!found) {
        const m0 = findMatches(query, sources, mode)[0] || {source: 0, passage: 0, tokens: [0, 1]};
        const ws = wordsOf(sources[m0.source].passages[m0.passage]);
        ws.splice(m0.tokens[0], m0.tokens[1] - m0.tokens[0], ...wordsOf(p.beforeValue));
        sources[m0.source].passages[m0.passage] = ws.join(' ');
        found = {source: m0.source, passage: m0.passage};
      }
      focus = {...found, term: 0};
      const after = replaceWord(sources[found.source].passages[found.passage], p.beforeValue, p.afterValue);
      const altSources = sources.map((s2, si) => (si === found.source ? {...s2, passages: s2.passages.map((x, pi) => (pi === found.passage ? after.text : x))} : s2));
      const altMatches = findMatches(query, altSources, mode).filter(m => m.source === found.source && m.passage === found.passage);
      alt = {kind: 'passage', source: found.source, passage: found.passage, text: after.text, matches: altMatches};
    } else {
      let ti = query.terms.findIndex(x => normWord(x.text) === normWord(p.beforeValue));
      if (ti < 0) {
        ti = 0;
        query.terms[0].text = p.beforeValue;
      }
      focus = {source: 0, passage: 0, term: ti};
      const qAfter = {...query, terms: query.terms.map((x, i) => (i === ti ? {...x, text: p.afterValue} : x))};
      const before = findMatches(query, sources, mode).map(matchKey);
      extraMatches = findMatches(qAfter, sources, mode).filter(m => !before.includes(matchKey(m)));
      alt = {kind: 'term', index: ti, text: p.afterValue, afterKeys: findMatches(qAfter, sources, mode).map(matchKey)};
    }
    const stageOpts = {axis, withPerson, query, mode, sources, dates: p.dates, citations: p.citations, withCard: false, extraMatches, alt};
    const stage = searchStage(ctx, {...stageOpts, prefix: 'cx'});
    const lensStage = searchStage(ctx, {...stageOpts, prefix: 'ln'});

    // --- context caption (top band)
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 16, y: 6, maxWidth: D.w - 32, size: labelSize, minSize: Math.max(24, px(18)), maxLines: 1, name: 'ctx-caption', weight: 600}) : null;
    const cap = (ctxCap ? ctxCap.box.h + 22 : 20);

    // --- placement of the context (home = full size; k/sx/sy = while the lens is open)
    const kh = Math.min((D.w - 32) / st.w, (D.h - cap - 12) / st.h);
    const home = {k: kh, sx: (D.w - st.w * kh) / 2, sy: cap + (D.h - cap - st.h * kh) / 2};
    let k, sx, sy, area;
    if (lay === 'aside') {
      k = Math.min((D.w * 0.56) / st.w, (D.h - cap - 20) / st.h);
      sx = D.w - 16 - st.w * k;
      sy = cap + (D.h - cap - st.h * k) / 2;
      area = {x: 16, y: cap, w: sx - 30 - 16, h: D.h - cap};
    } else {
      k = Math.min((D.w - 32) / st.w, ((D.h - cap) * LY.share) / st.h);
      sx = (D.w - st.w * k) / 2;
      sy = D.h - 12 - st.h * k;
      area = {x: 16, y: cap, w: D.w - 32, h: sy - 24 - cap};
    }
    const toD = q => ({x: sx + q.x * k, y: sy + q.y * k});

    // --- lens source region (stage coords) and destination
    let src;
    if (target === 'passage') {
      const vol = stage.vols[focus.source];
      const row = vol.v.rows[focus.passage];
      // margin bounded by the gap to the neighbouring passages: the lens shows
      // the focused passage whole and never half of a neighbouring line
      const rows = vol.v.rows;
      const above = focus.passage > 0 ? row.y - (rows[focus.passage - 1].y + rows[focus.passage - 1].h) : row.y;
      const below = focus.passage < rows.length - 1 ? rows[focus.passage + 1].y - (row.y + row.h) : vol.h - (row.y + row.h);
      const mTop = Math.max(6, Math.min(30, above - 4));
      const mBot = Math.max(6, Math.min(30, below - 4));
      src = {x: vol.x + vol.v.textX - 38, y: vol.y + row.y - mTop, w: vol.w - vol.v.textX + 38 + 70, h: row.h + mTop + mBot};
    } else {
      const c = stage.chipWorld(focus.term);
      src = {x: c.x - 18, y: c.y - 16, w: c.w + 36, h: c.h + 32};
    }
    const a0 = toD(src);
    const source = {x: a0.x, y: a0.y, w: src.w * k, h: src.h * k};
    // the annotation (before → after) sits under the lens: measure it first
    const label = t[target];
    const half = Math.max(220, Math.min(520, (area.w - 70) / 2));
    const annSize = labelSize;
    const probeB = ctx.show('key') ? chip(ctx, `${label}: ${p.beforeValue}`, {x: 0, y: 0, maxWidth: half, size: annSize, maxLines: 2}) : null;
    const probeA = ctx.show('key') ? chip(ctx, `${label}: ${p.afterValue}`, {x: 0, y: 0, maxWidth: half, size: annSize, maxLines: 2}) : null;
    const annotH = probeB ? Math.max(probeB.box.h, probeA.box.h) + 40 : 20;
    const maxW = area.w - 20;
    const maxH = area.h - annotH - 30;
    const zoom = Math.max(1.2, Math.min(p.detailGeometry.zoom, maxW / source.w, maxH / source.h));
    const dw = source.w * zoom, dh = source.h * zoom;
    // stacked: the annotation sits above the lens, so the cone lines running
    // down to the context never cross it; aside: it sits under the lens
    const above = lay !== 'aside';
    const dest = {x: area.x + (area.w - dw) / 2, y: area.y + (above ? annotH : 0) + Math.max(10, (area.h - annotH - dh) / 2), w: dw, h: dh};
    const lensContent = g({transform: T(sx, sy, 0, k)}, lensStage.node);
    // no framework dim rectangle: the context itself recedes (masked in build)
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, color: th.fg});

    // --- single editorial annotation: before → after, old value kept visible
    const annChipH = probeB ? Math.max(probeB.box.h, probeA.box.h) : 0;
    const annY = above ? dest.y - annChipH - 22 : dest.y + dest.h + 28;
    const beforeChip = ctx.show('key') ? chip(ctx, `${label}: ${p.beforeValue}`, {x: dest.x + dest.w / 2 - 26, y: annY, anchor: 'end', maxWidth: half, size: annSize, maxLines: 2, fill: th.card, name: 'ann-before'}) : null;
    const afterChip = ctx.show('key') ? chip(ctx, `${label}: ${p.afterValue}`, {x: dest.x + dest.w / 2 + 26, y: annY, anchor: 'start', maxWidth: half, size: annSize, maxLines: 2, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}) : null;
    const arrowY = annY + (beforeChip ? beforeChip.box.h / 2 : 30);

    // --- changed-datum marker. The pin sits on the context detail; its label
    // stands in the free room above the kiosk housing (where the story's card
    // prints) and is tied to the pin by a leader. It keeps the change
    // traceable in the final hold: marker text, previous value (struck) → new.
    const H0 = home;
    const hD = q => ({x: H0.sx + q.x * H0.k, y: H0.sy + q.y * H0.k});
    const hsA = hD(src);
    const hs = {x: hsA.x, y: hsA.y, w: src.w * H0.k, h: src.h * H0.k};
    const mk = target === 'term' ? {x: hs.x + hs.w, y: hs.y} : {x: hs.x + hs.w, y: hs.y + hs.h / 2};
    const G = stage.G;
    const zoneTop = axis === 'vertical' ? G.bookcase.y + G.bookcase.h + 18 : 8;
    const zoneA = hD({x: G.housing.x, y: zoneTop});
    const zoneB = hD({x: G.housing.x + G.housing.w, y: G.housing.y - 24});
    const zone = {x: zoneA.x, y: zoneA.y, w: zoneB.x - zoneA.x, h: zoneB.y - zoneA.y};
    const markLabel = (x, y, maxW, size) => {
      const padX = size * 0.55, padY = size * 0.4;
      const inner = maxW - padX * 2;
      const f1 = ctx.fit(p.contextLabels.marker, {maxWidth: inner, size, minSize: size * 0.85, maxLines: 2, weight: 700});
      const fb = ctx.fit(p.beforeValue, {maxWidth: inner, size, minSize: size * 0.85, maxLines: 2, weight: 500});
      const fa = ctx.fit(`→ ${p.afterValue}`, {maxWidth: inner, size, minSize: size * 0.85, maxLines: 2, weight: 700});
      const gapL = size * 0.3;
      // previous and new value share a row when they fit side by side
      const oneRow = fb.lines.length === 1 && fa.lines.length === 1 && fb.width + size * 0.5 + fa.width <= inner;
      const w = Math.max(f1.width, oneRow ? fb.width + size * 0.5 + fa.width : Math.max(fb.width, fa.width)) + padX * 2;
      const hh = f1.height + gapL + (oneRow ? Math.max(fb.height, fa.height) : fb.height + gapL + fa.height) + padY * 2;
      const x0 = x - w / 2;
      const yb = y + padY + f1.height + gapL;
      const xa = oneRow ? x0 + padX + fb.width + size * 0.5 : x0 + padX;
      const ya = oneRow ? yb : yb + fb.height + gapL;
      const strikeLines = fb.lines.map((ln, i) => {
        const lw = ctx.measure(ln, fb.size, fb.weight, fb.family);
        const ly = yb + i * fb.lineHeight + fb.size * 0.55;
        return h('line', {x1: r(x0 + padX - 2), x2: r(x0 + padX + lw + 2), y1: r(ly), y2: r(ly), stroke: th.accent, 'stroke-width': 3});
      });
      return {node: g(null,
        h('path', {d: roundRectPath(x0, y, w, hh, 12), fill: th.card, stroke: th.accent2, 'stroke-width': 2.5}),
        textBlock(f1, {x: x0 + padX, y: y + padY, fill: th.ink}),
        textBlock(fb, {x: x0 + padX, y: yb, fill: th.inkSoft}),
        strikeLines,
        textBlock(fa, {x: xa, y: ya, fill: th.accent2}),
      ), box: {x: x0, y, w, h: hh}};
    };
    let markChip = null;
    let leader = null;
    if (ctx.show('key')) {
      const mSize = Math.max(26, px(21));
      const maxWm = Math.min(D.w - 20, Math.max(zone.w + 40, 300));
      const probe = markLabel(0, 0, maxWm, mSize);
      const cx = Math.max(probe.box.w / 2 + 10, Math.min(D.w - probe.box.w / 2 - 10, zone.x + zone.w / 2));
      const y = Math.max(cap + 4, zone.y + zone.h - probe.box.h);
      markChip = markLabel(cx, y, maxWm, mSize);
      // leader from the pin to the nearest point of the label
      const b = markChip.box;
      const qx = Math.max(b.x + 12, Math.min(b.x + b.w - 12, mk.x));
      const qy = Math.max(b.y, Math.min(b.y + b.h, mk.y));
      const end = mk.y > b.y + b.h ? {x: qx, y: b.y + b.h} : mk.y < b.y ? {x: qx, y: b.y} : {x: mk.x < b.x ? b.x : b.x + b.w, y: qy};
      leader = h('path', {d: `M${r(mk.x)} ${r(mk.y)}L${r(end.x)} ${r(end.y)}`, stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '6 6', fill: 'none', 'stroke-linecap': 'round'});
    }
    const marker = g({name: 'marker', opacity: 0},
      leader,
      h('circle', {cx: mk.x, cy: mk.y, r: 18, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 7)}l7 12.25h-14z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node,
    );
    // the previous value is struck through line by line (drawn on in reading order)
    const strikes = beforeChip ? beforeChip.fit.lines.map((ln, i) => {
      const f = beforeChip.fit;
      const lw = ctx.measure(ln, f.size, f.weight, f.family) + 8;
      const y = beforeChip.box.y + annSize * 0.38 + i * f.lineHeight + f.size * 0.52;
      return {len: lw, node: h('line', {name: `ann-strike${i}`, x1: r(beforeChip.box.cx - lw / 2), x2: r(beforeChip.box.cx + lw / 2), y1: r(y), y2: r(y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw)} ${r(lw + 10)}`, 'stroke-dashoffset': r(lw)})};
    }) : [];
    const strike = strikes.length ? g(null, strikes.map(x => x.node)) : null;

    // --- which links change: before-only fade out, after-only are drawn in
    const afterKeys = target === 'term' ? alt.afterKeys : null;
    const linkRole = stage.links.map(l => {
      if (target === 'passage') return l.m.source === focus.source && l.m.passage === focus.passage ? 'before' : 'shared';
      const inAfter = afterKeys.includes(l.m.key);
      const isExtra = extraMatches.some(m => matchKey(m) === l.m.key);
      return isExtra ? 'after' : inAfter ? 'shared' : 'before';
    });
    return {stage, lensStage, st, k, sx, sy, home, src, source, dest, L2, beforeChip, afterChip, arrowY, ctxCap, marker, strike, strikes: strikes.map(x => x.len), target, linkRole, focus, zoom, markBox: markChip && markChip.box};
  },
  build(ctx, L) {
    const th = ctx.theme;
    // the context recedes (fades toward the background) around the source
    // region while the lens is open: a mask on the stage itself, so only the
    // stage objects dim and a transparent background stays transparent
    const m = 40;
    const dimMask = h('defs', null, h('mask', {id: ctx.id('ctx-mask'), maskUnits: 'userSpaceOnUse', x: -m, y: -m, width: L.st.w + m * 2, height: L.st.h + m * 2},
      h('rect', {name: 'ctx-dim', x: -m, y: -m, width: L.st.w + m * 2, height: L.st.h + m * 2, fill: '#fff'}),
      h('rect', {x: r(L.src.x), y: r(L.src.y), width: r(L.src.w), height: r(L.src.h), rx: 10, fill: '#fff'})));
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctx-view', transform: T(L.sx, L.sy, 0, L.k)}, dimMask, g({mask: ctx.ref('ctx-mask')}, L.stage.node)),
      L.L2.node,
      L.marker,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {name: 'ann-arrow', d: `M${r(L.dest.x + L.dest.w / 2 - 14)} ${r(L.arrowY)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const swap = seg(u, ...W.swap);
    const depend = ease.inOutCubic(seg(u, ...W.depend));
    // pose one copy of the stage: `sw` = datum swap progress, `dp` = dependent state progress
    const poseCopy = (stg, sw, dp) => {
      const links = L.linkRole.map(role => (role === 'after' ? {travel: dp, tab: dp, mark: dp} : {travel: 1, tab: 1, mark: 1}));
      const linkFade = L.linkRole.map(role => (role === 'before' ? 1 - dp : 1));
      const altLinks = stg.altLinks.map(() => ({travel: dp, tab: dp, mark: dp}));
      return stg.pose({type: 1, press: 1, links, linkFade, alt: altLinks, altSwap: sw});
    };
    // the lens is a real copy of its source region: the context changes at
    // the same moment, so origin and enlargement always agree
    const ctxPosed = poseCopy(L.stage, swap, depend);
    Object.assign(nodes, ctxPosed.nodes);
    const lensPosed = poseCopy(L.lensStage, swap, depend);
    Object.assign(nodes, lensPosed.nodes);
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    // the closing window blends into its (already identical) source
    if (lp > 0.001 && close > 0) nodes['lens-win'] = {opacity: r(Math.min(1, lp * 4) * (1 - 0.6 * seg(close, 0.5, 1)), 3)};
    nodes['ctx-dim'] = {opacity: r(1 - 0.62 * lp, 3)};
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      const sp = seg(u, ...W.strike) * L.strikes.length;
      L.strikes.forEach((len, i) => { nodes[`ann-strike${i}`] = {'stroke-dashoffset': r(len * (1 - Math.min(1, Math.max(0, sp - i))))}; });
      const afterP = seg(u, ...W.after);
      nodes['ann-after'] = {opacity: r(afterP, 3)};
      nodes['ann-arrow'] = {opacity: r(afterP, 3)};
      // the annotation leaves before the lens starts to close; the marker
      // keeps before → after in the final hold
      nodes.ann = {opacity: u >= W.before[0] ? r(1 - seg(u, ...W.annOut), 3) : 0};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    // context placement: full size ↔ aside/stacked (only while the lens is used)
    // a gentle sine ease: the context travels far (it changes side) without a jump
    const mv = ease.inOutSine(seg(u, ...W.aside)) * (1 - ease.inOutSine(seg(u, ...W.back)));
    const view = {k: L.home.k + (L.k - L.home.k) * mv, sx: L.home.sx + (L.sx - L.home.sx) * mv, sy: L.home.sy + (L.sy - L.home.sy) * mv};
    nodes['ctx-view'] = {transform: T(view.sx, view.sy, 0, view.k)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.swap[0] ? 'before' : u >= W.swap[1] ? 'after' : 'changing';
    const linked = s2 => s2.links.filter(l => l.mark >= 1).map(l => `${l.source}:${l.passage}:${l.kind}`).sort();
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        lensSwap: r(swap, 3),
        lensDependent: r(depend, 3),
        contextSwap: r(swap, 3),
        contextDatum: swap >= 1 ? 'after' : swap > 0 ? 'changing' : 'before',
        contextLinked: linked(ctxPosed.semantic),
        lensLinked: linked(lensPosed.semantic),
        dotsLit: ctxPosed.semantic.dotsLit,
        annotationVisible: Boolean(L.beforeChip) && u >= W.before[0] && u < W.annOut[1],
        focusTarget: L.target,
        focus: L.focus,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        zoom: r(L.zoom, 3),
        view: {x: r(view.sx), y: r(view.sy), k: r(view.k, 4)},
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
    slug: 'research-01-inspect',
    title: 'Term search — inspect one word',
    titleEs: 'Búsqueda por términos — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Búsqueda por términos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens enlarges one passage line (or the query term) of a finished term search, replaces one word, recomputes whether the words still match and updates only that tab, highlight and thread; the previous value stays readable and the context returns with a changed-datum marker.',
    tags: ['search', 'inspect', 'lens', 'passage', 'query term', 'exact match', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/busqueda-por-terminos.js', 'src/animations/research/kits/busqueda-por-terminos-fields.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
