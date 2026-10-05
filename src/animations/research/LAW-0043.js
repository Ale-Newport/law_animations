/**
 * LAW-0043 — Búsqueda por términos · contrast
 *
 * Storyboard (two complete, identical library search scenes):
 *  0.00–0.17  base: the same bookcase, the same volumes, the same kiosk and
 *             the same query typed into both search boxes. Directly under
 *             each scene a matched detail panel (with the scene's A/B badge)
 *             enlarges the same two things of that scene: the related-
 *             wording slot under its search box and the one passage whose
 *             treatment will differ (identical in A and B at this point).
 *  0.17–0.40  change: exactly one fact differs — the matching mode. In B
 *             (contextual) the related wording supplied for each term drops
 *             down under the search box (in the scene and in its detail); A
 *             (exact) shows nothing extra and its slot says so neutrally
 *             ('No related wording'). Both searches are then run.
 *  0.40–0.77  parallel: the exact matches travel identically in both scenes
 *             (same tokens, threads, tabs and highlights at the same times);
 *             afterwards only B sends the related-wording tokens (dashed
 *             threads, outlined tabs, dotted underlines) to the extra
 *             passages; B's detail draws the same dashed thread to its
 *             enlarged passage. Each recorded passage prints a line on the
 *             card (both cards print at one common size).
 *  0.77–1.00  guide: the passage only B links is ringed in both scenes, a
 *             comparison guide joins the two enlarged passages and carries
 *             its caption, and a neutral note states that no mode is
 *             ranked. No winner, score, relevance or outcome.
 * Matches are computed from the supplied query and passage text.
 * @module animations/research/LAW-0043
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {neutralNote} from '../../frameworks/paired.js';
import {researchFields, RESEARCH_DEFAULTS} from './kits/busqueda-por-terminos-fields.js';
import {searchStage, stageSize, termPalette, relatedList, passageStrip, thread} from './kits/busqueda-por-terminos.js';

const ID = 'LAW-0043';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  type: [0.04, 0.15], bloom: [0.2, 0.3], press: [0.31, 0.37],
  exact: [0.4, 0.52], ctxDepart: [0.55, 0.63], travel: 0.1, tab: 0.025, mark: 0.04, print: 0.025,
  changeChip: [0.2, 0.28], guide: [0.78, 0.9], note: [0.88, 0.94],
};
const COVER_COLORS = ['#6d3b3b', '#2f4f6b', '#4d5e3a', '#5b4a6e'];

const sceneSchema = {
  ...researchFields,
  ...contrastFields(),
};

const defaultParams = {
  ...RESEARCH_DEFAULTS,
  query: {...RESEARCH_DEFAULTS.query, mode: 'exact'},
  scenarioA: {label: 'Exact match', caption: 'Only the literal query words are linked'},
  scenarioB: {label: 'Contextual match', caption: 'Related wording supplied for each word is linked too'},
  changedFact: 'Only the matching mode differs',
  sharedFacts: ['Same query', 'Same three volumes', 'Same kiosk'],
  comparisonLabels: {guide: 'Changed fact: related wording is linked', neutral: 'Two search modes shown side by side — neither is ranked'},
};

/**
 * row: the two scenes side by side, each with its detail panel underneath
 * (A's panel mirrors B's so the two enlarged passages face each other across
 * the gap). column: A (header, scene, its detail panel), the guide caption,
 * then B (header, scene, its detail panel); the guide runs down a left
 * gutter between the two enlarged passages. Every detail panel sits under
 * its own scene and carries that scene's letter badge. Sizes of key text are
 * set in 1080p pixels (≥ 20 px).
 */
const ARRANGE = {
  landscape: {arrangement: 'row', size: [2700, 1280], detail: 'side'},
  square: {arrangement: 'row', size: [2700, 2100], detail: 'below'},
  portrait: {arrangement: 'column', size: [1320, 2560], detail: 'side'},
};

/** Scenario header: letter badge, label (up to three lines) and caption (up to four lines), never cut short. */
function panelHeader(ctx, o) {
  const th = ctx.theme;
  const badgeR = o.labelSize * 0.72;
  const tx = o.x + badgeR * 2 + o.labelSize * 0.4;
  const tw = o.w - (tx - o.x);
  const parts = [h('circle', {cx: r(o.x + badgeR), cy: r(o.y + badgeR + 2), r: r(badgeR), fill: o.color, stroke: th.ink, 'stroke-width': 2.5})];
  let hh = badgeR * 2 + 4;
  if (ctx.show('key')) {
    parts.push(h('text', {x: r(o.x + badgeR), y: r(o.y + badgeR + 2 + o.labelSize * 0.36), 'text-anchor': 'middle', 'font-size': r(o.labelSize), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter));
    const f = ctx.fit(o.label, {maxWidth: tw, size: o.labelSize, minSize: o.labelSize * 0.8, maxLines: 3, weight: 700});
    parts.push(textBlock(f, {x: tx, y: o.y + badgeR + 2 - o.labelSize * 0.6, fill: th.fg}));
    let y = o.y + badgeR + 2 - o.labelSize * 0.6 + f.height + o.capSize * 0.35;
    if (o.caption && ctx.show('all')) {
      const f2 = ctx.fit(o.caption, {maxWidth: tw, size: o.capSize, minSize: o.capSize * 0.9, maxLines: 4, weight: 500});
      parts.push(textBlock(f2, {x: tx, y, fill: th.fgSoft}));
      y += f2.height;
    }
    hh = Math.max(hh, y - o.y);
  }
  return {node: g({name: o.name}, parts), h: hh};
}

/**
 * Detail panel: an enlarged, matched view of the one difference. It holds the
 * related-wording slot under the search box (B's list drops into it; where
 * the scene has none, the slot states so neutrally once B's list appears)
 * and the passage only B links. `side` = where the passage sits ('left' |
 * 'right' | 'below'). Both panels have identical geometry. The scenario's
 * letter badge (header colour) sits on the panel's top edge so each panel
 * names its own scene.
 */
function detailPanel(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const fs = o.fs;
  const pad = fs * 0.9;
  const gap = fs * 0.9;
  const badgeR = o.badgeR ?? fs * 0.75;
  // both panels keep room for B's tab so their passages are laid out identically
  const tabRoom = fs * 1.6;
  const hasRelated = o.terms.some(t => (t.related || []).length);
  const rows = o.terms.filter(t => (t.related || []).length);
  // list width: wide enough for each term's related words on one row
  const need = Math.max(fs * 8, ...rows.map(t => 56 + t.related.reduce((a, w) => a + ctx.measure(w, fs, 600, 'sans') + 26, 0) + 12));
  const avail = o.w - pad * 3 - tabRoom;
  const sideListW = Math.round(Math.min(avail * 0.6, Math.max(avail * 0.36, need)));
  // side by side unless that leaves the passage too narrow (then stacked)
  const stack = o.side === 'below' || o.w - pad * 3 - sideListW - tabRoom < fs * 11;
  const listW = stack ? o.w - pad * 2 : sideListW;
  const stripW = stack ? o.w - pad * 2 - tabRoom : o.w - pad * 3 - listW - tabRoom;
  const dd = hasRelated ? relatedList(ctx, {prefix: `${P}-dd`, w: listW, rowH: fs * 1.95, terms: o.terms, colors: o.colors, size: fs}) : null;
  const listH = dd ? dd.h : 0;
  const strip = o.passage ? passageStrip(ctx, {prefix: `${P}-ps`, w: stripW, text: o.passage.text, tokens: o.passage.tokens, kind: 'contextual', color: o.passage.color, cover: o.passage.cover, sourceLabel: o.passage.source, numLabel: o.passage.num, size: fs, headSize: fs * 0.85}) : null;
  const stripH = strip ? strip.h : 0;
  const innerH = stack ? listH + (strip ? gap + stripH : 0) : Math.max(listH, stripH);
  const hh = innerH + pad * 2;
  const listX = stack ? pad : o.side === 'right' ? pad : pad * 2 + stripW + tabRoom;
  const listY = stack ? pad : pad + (innerH - listH) / 2;
  const stripX = stack ? pad : o.side === 'right' ? pad * 2 + listW : pad;
  const stripY = stack ? pad + listH + gap : pad + (innerH - stripH) / 2;
  const parts = [
    h('path', {d: roundRectPath(6, 8, o.w, hh, 20), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, o.w, hh, 20), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.5}),
  ];
  // B's link: a dashed thread from the related word to an outlined tab on the
  // passage's right edge (as on the page in the scene). The thread runs under
  // the list, so it leaves the list at that word's row; the word is ringed.
  let link = null;
  if (strip && o.link && dd && o.withList) {
    const tabH = fs * 1.2, tabL = fs * 1.3;
    const ty = stripY + strip.markY;
    const tab = {x: stripX + stripW - 8, y: ty - tabH / 2, w: tabL + 8, h: tabH};
    const it = dd.items.find(q => q.term === o.link.term && q.related === o.link.related) || dd.items.find(q => q.term === o.link.term);
    const from = it ? {x: listX + it.box.x + it.box.w / 2, y: listY + it.box.y + it.box.h / 2} : {x: listX, y: listY + listH / 2};
    const to = {x: tab.x + tab.w, y: ty};
    const c1 = stack ? {x: listX + listW + fs * 1.2, y: from.y} : {x: listX - fs * 1.5, y: from.y};
    const c2 = stack ? {x: listX + listW + fs * 1.2, y: to.y} : {x: to.x + fs * 1.5, y: to.y};
    const thr = thread(ctx, {name: `${P}-th`, from, c1, c2, to, color: o.passage.color, kind: 'contextual'});
    const tabNode = g({name: `${P}-tab`, opacity: 0},
      h('path', {d: roundRectPath(tab.x, tab.y, tab.w, tab.h, 5), fill: th.paper, stroke: o.passage.color.c, 'stroke-width': 3, 'stroke-dasharray': '5 4'}),
      h('path', {d: `M${r(tab.x + 12)} ${r(tab.y + tab.h - 5)}l${r(fs * 0.3)} -${r(tab.h - 10)}M${r(tab.x + 12 + fs * 0.45)} ${r(tab.y + tab.h - 5)}l${r(fs * 0.3)} -${r(tab.h - 10)}`, stroke: o.passage.color.c, 'stroke-width': 2.5, 'stroke-linecap': 'round'}));
    const ring = it ? h('path', {name: `${P}-src`, d: roundRectPath(listX + it.box.x - 5, listY + it.box.y - 5, it.box.w + 10, it.box.h + 10, (it.box.h + 10) / 2), fill: 'none', stroke: o.passage.color.c, 'stroke-width': 3, opacity: 0}) : null;
    link = {thr, tab, tabNode, ring};
    parts.push(thr.node);
  }
  let none = null;
  if (dd) {
    // the slot the related wording drops into
    parts.push(h('path', {d: roundRectPath(listX, listY, listW, listH, 12), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0.55}));
    if (o.withList) parts.push(g({transform: T(listX, listY)}, dd.node));
    else {
      // neutral 'no related wording' state (a short rule without labels)
      const cx = listX + listW / 2, cy = listY + listH / 2;
      if (ctx.show('all') && o.noneLabel) {
        const f = ctx.fit(o.noneLabel, {maxWidth: listW - fs * 1.6, size: fs * 0.95, minSize: fs * 0.8, maxLines: 2, weight: 600});
        none = g({name: `${P}-none`, opacity: 0}, textBlock(f, {x: cx, y: cy - f.height / 2, anchor: 'middle', fill: th.inkSoft}));
      } else {
        none = g({name: `${P}-none`, opacity: 0}, h('path', {d: `M${r(cx - fs * 1.2)} ${r(cy)}h${r(fs * 2.4)}`, stroke: th.inkSoft, 'stroke-width': 4, 'stroke-linecap': 'round'}));
      }
      parts.push(none);
    }
  }
  if (strip) parts.push(g({transform: T(stripX, stripY)}, strip.node));
  if (link) parts.push(link.tabNode, link.ring);
  if (o.letter) {
    const bx = pad + badgeR;
    parts.push(g({name: `${P}-badge`},
      h('circle', {cx: r(bx), cy: 0, r: r(badgeR), fill: o.badgeColor, stroke: th.ink, 'stroke-width': 2.5}),
      ctx.show('key') ? h('text', {x: r(bx), y: r(badgeR * 0.47), 'text-anchor': 'middle', 'font-size': r(badgeR * 1.3), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null));
  }
  const node = g({name: P, transform: T(o.x, o.y)}, parts);
  const box = {x: o.x, y: o.y, w: o.w, h: hh};
  const stripBox = strip ? {x: o.x + stripX, y: o.y + stripY, w: stripW, h: stripH} : null;
  const listBox = dd ? {x: o.x + listX, y: o.y + listY, w: listW, h: listH} : null;
  /** @param {{bloom:number, travel:number, tab:number, mark:number, none?:number}} s */
  const frame = s => {
    const out = {};
    if (dd && o.withList) Object.assign(out, dd.frame(s.bloom));
    if (none) out[`${P}-none`] = {opacity: r(clamp((s.none || 0) * 2), 3)};
    if (strip) Object.assign(out, strip.frame(s.mark));
    if (link) {
      Object.assign(out, link.thr.frame(1 - Math.pow(1 - clamp(s.travel), 2.2)));
      out[`${P}-tab`] = {opacity: r(clamp(s.tab * 3), 3)};
      if (link.ring) out[`${P}-src`] = {opacity: s.travel > 0 ? 1 : 0};
    }
    return out;
  };
  return {node, frame, box, stripBox, listBox, h: hh, badgeR};
}

const scene = {
  sizes: {landscape: ARRANGE.landscape.size, square: ARRANGE.square.size, portrait: ARRANGE.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {arrangement, detail} = ARRANGE[ctx.view.shape];
    const D = ctx.design;
    const st = stageSize('horizontal', false, 'compare');
    const colors = termPalette(ctx);
    // stage B first: stage A prints its card at B's size (same line size)
    const common = {axis: 'horizontal', withPerson: false, variant: 'compare', query: p.query, sources: p.sources, dates: p.dates, citations: p.citations, cardHeading: ''};
    const stageB = searchStage(ctx, {...common, prefix: 'sb', mode: 'contextual'});
    const stageA = searchStage(ctx, {...common, prefix: 'sa', mode: 'exact', cardMeasureLines: stageB.cardLines});
    const stages = [stageA, stageB];
    // the changed detail: first passage linked only in B
    const onlyB = stageB.links.find(l => !stageA.links.some(a => a.m.key === l.m.key)) || null;
    const passage = onlyB ? {
      text: p.sources[onlyB.m.source].passages[onlyB.m.passage], tokens: onlyB.m.tokens, color: onlyB.m.color,
      cover: COVER_COLORS[onlyB.m.source % COVER_COLORS.length], source: p.sources[onlyB.m.source].id, num: `¶${onlyB.m.passage + 1}`,
    } : null;
    const link = onlyB ? {term: onlyB.m.term, related: onlyB.m.related} : null;

    // key text sizes in 1080p pixels: the block is laid out, scaled into the
    // design space, and the text unit is corrected until it converges
    const designPx = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * (1080 / Math.min(ctx.view.width, ctx.view.height));
    const build = unit => {
      const px = n => n / unit;
      const fs = px(21);
      const gapX = arrangement === 'row' ? px(34) : px(26);
      const m = px(14);
      const headers = [0, 1].map(i => panelHeader(ctx, {
        name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
        x: 0, y: 0, w: st.w, color: i ? th.accent2 : th.inkSoft, labelSize: px(28), capSize: px(21),
      }));
      const hH = Math.max(headers[0].h, headers[1].h) + m;
      const guideSize = px(21), noteSize = px(21);
      const probeGuide = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: arrangement === 'row' ? st.w * 1.2 : st.w * 0.9, size: guideSize, maxLines: 2}) : null;
      const probeNote = ctx.show('key') ? chip(ctx, p.changedFact, {x: 0, y: 0, maxWidth: (arrangement === 'row' ? st.w * 2 : st.w) * 0.94, size: noteSize, maxLines: 2}) : null;
      const noteH = Math.max(probeNote ? probeNote.box.h : 0, ctx.show('all') ? chip(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: 0, y: 0, maxWidth: (arrangement === 'row' ? st.w * 2 : st.w) * 0.94, size: noteSize, maxLines: 2}).box.h : 0, ctx.show('all') ? chip(ctx, p.comparisonLabels.neutral, {x: 0, y: 0, maxWidth: (arrangement === 'row' ? st.w * 2 : st.w) * 0.94, size: noteSize, maxLines: 2}).box.h : 0);
      const guideH = probeGuide ? probeGuide.box.h : 0;
      // each detail panel carries its scenario's letter badge on its top edge
      const badgeR = px(17);
      const detailOf = (i, x, y, w, side) => detailPanel(ctx, {
        prefix: i ? 'db' : 'da', x, y, w, fs, side, terms: p.query.terms, colors, passage, link: i ? link : null, withList: !!i,
        letter: i ? 'B' : 'A', badgeColor: i ? th.accent2 : th.inkSoft, badgeR, noneLabel: ctx.t.noRelated,
      });
      const gapD = Math.max(m * 1.6, badgeR + m);
      let panels, details, bw, bh, guideChipAt, noteY, noteX, gutter = null;
      if (arrangement === 'row') {
        // each detail panel directly under its own scene
        const y0 = hH, yIns = hH + st.h + gapD;
        panels = [0, 1].map(i => ({x: i * (st.w + gapX), y: y0, headerY: 0}));
        const sideA = detail === 'side' ? 'right' : 'below', sideB = detail === 'side' ? 'left' : 'below';
        details = [detailOf(0, 0, yIns, st.w, sideA), detailOf(1, st.w + gapX, yIns, st.w, sideB)];
        bw = st.w * 2 + gapX;
        const gy = yIns + Math.max(details[0].h, details[1].h) + m * 1.6;
        guideChipAt = {x: bw / 2, y: gy, anchor: 'middle'};
        noteY = gy + guideH + m * 1.4;
        noteX = bw / 2;
        bh = noteY + noteH + m;
      } else {
        // A: header, scene, its detail · the guide caption · B: header,
        // scene, its detail. The comparison guide runs down a left gutter
        // from A's enlarged passage to B's, past the caption between them.
        const gut = px(46);
        const x0 = gut;
        const yA = hH;
        const dA = detailOf(0, x0, yA + st.h + gapD, st.w, 'left');
        const gy = dA.box.y + dA.h + m * 1.6;
        const yHB = gy + guideH + m * 1.6;
        const yB = yHB + hH;
        const dB = detailOf(1, x0, yB + st.h + gapD, st.w, 'left');
        details = [dA, dB];
        panels = [{x: x0, y: yA, headerY: 0}, {x: x0, y: yB, headerY: yHB}];
        guideChipAt = {x: x0 + px(10), y: gy, anchor: 'start'};
        gutter = {x: gut * 0.42, y: guideH ? gy + guideH / 2 : (dA.box.y + dA.h + yHB) / 2};
        bw = st.w + gut;
        noteY = dB.box.y + dB.h + m * 1.4;
        noteX = x0 + st.w / 2;
        bh = noteY + noteH + m;
      }
      return {px, fs, headers, hH, panels, details, bw, bh, guideChipAt, noteY, noteX, gutter, guideSize, noteSize};
    };
    // converge the text unit (block units → 1080p px)
    // in a very small caption-safe box the text could crowd the scenes out
    // (and the fit would run away): the scenes keep at least 60 % of their
    // bare fit and the text is set smaller instead
    const bare = arrangement === 'row' ? Math.min(D.w / (st.w * 2), D.h / st.h) : Math.min(D.w / st.w, D.h / (st.h * 2));
    const unitMin = designPx * bare * 0.6;
    let unit = Math.max(unitMin, designPx * 0.9);
    let B = build(unit);
    for (let k = 0; k < 12; k++) {
      const s0 = Math.min(D.w / B.bw, D.h / B.bh);
      const next = Math.max(unitMin, designPx * s0);
      if (Math.abs(next - unit) / unit < 0.004) break;
      unit = next;
      B = build(unit);
    }
    // line wraps are discrete, so the loop can settle between two states:
    // make sure key text never ends up below its size (shrink the unit)
    // (only while that actually enlarges the text on screen)
    const ratio = (BB, u) => designPx * Math.min(D.w / BB.bw, D.h / BB.bh) / u;
    for (let k = 0, q = ratio(B, unit); k < 6 && q < 0.985 && unit * 0.98 >= unitMin; k++) {
      const u2 = unit * 0.98;
      const B2 = build(u2);
      const q2 = ratio(B2, u2);
      if (q2 <= q + 1e-3) break;
      unit = u2;
      B = B2;
      q = q2;
    }
    const s = Math.min(D.w / B.bw, D.h / B.bh);
    const ox = (D.w - B.bw * s) / 2, oy = (D.h - B.bh * s) / 2;
    const {px, panels, details, bw, guideChipAt} = B;
    const headers = [0, 1].map(i => panelHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: panels[i].x, y: panels[i].headerY, w: st.w, color: i ? th.accent2 : th.inkSoft, labelSize: px(28), capSize: px(21),
    }));

    // timing: exact matches share times in both scenes; contextual ones follow in B only
    const exactN = stageA.links.length;
    const stepE = exactN > 1 ? (W.exact[1] - W.exact[0]) / (exactN - 1) : 0;
    const ctxN = stageB.links.length - exactN;
    const stepC = ctxN > 1 ? (W.ctxDepart[1] - W.ctxDepart[0]) / (ctxN - 1) : 0;
    const mkTime = t0 => ({t0, t1: t0 + W.travel, tab: t0 + W.travel + W.tab, mark: t0 + W.travel + W.tab + W.mark});
    const timing = stages.map(stg => stg.links.map((l, i) => (l.m.kind === 'exact' ? mkTime(W.exact[0] + i * stepE) : mkTime(W.ctxDepart[0] + (i - exactN) * stepC))));
    const onlyBIndex = onlyB ? stageB.links.indexOf(onlyB) : -1;

    // rings on the changed passage in both scenes (or on the search boxes)
    const ringRect = (stg, pn) => {
      if (onlyB) {
        const vol = stg.vols[onlyB.m.source];
        const row = vol.v.rows[onlyB.m.passage];
        return {x: pn.x + vol.x + vol.v.textX - 34, y: pn.y + vol.y + row.y - 5, w: vol.w - vol.v.textX + 34 + 58, h: row.h + 9};
      }
      return {x: pn.x + stg.sb.x - 12, y: pn.y + stg.sb.y - 12, w: stg.sb.w + 24, h: stg.sb.h + 24};
    };
    const rings = stages.map((stg, i) => ringRect(stg, panels[i]));
    // comparison guide: joins the two enlarged passages (or search boxes).
    // row: across the gap between the panels, a stem carries it down to its
    // caption; column: out of both passages' left edges into the gutter,
    // meeting at the caption between the two scenes
    const guideChip = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {x: guideChipAt.x, y: guideChipAt.y, anchor: guideChipAt.anchor, maxWidth: arrangement === 'row' ? st.w * 1.2 : st.w * 0.9, size: B.guideSize, maxLines: 2, fill: th.card, stroke: th.fg, name: 'guide-chip'}) : null;
    const boxOf = i => details[i].stripBox || details[i].box;
    let pts, ptsB;
    if (B.gutter) {
      const gx = B.gutter.x;
      const cy = guideChip ? guideChip.box.cy : B.gutter.y;
      const end = guideChip ? [{x: guideChip.box.x, y: cy}] : [];
      const via = i => {
        const bx = boxOf(i);
        const at = {x: bx.x, y: bx.y + bx.h / 2};
        return [at, {x: gx, y: at.y}, {x: gx, y: cy}, ...end];
      };
      pts = via(0);
      ptsB = via(1);
    } else {
      const a = {x: boxOf(0).x + boxOf(0).w, y: boxOf(0).y + boxOf(0).h / 2};
      const b2 = {x: boxOf(1).x, y: boxOf(1).y + boxOf(1).h / 2};
      const midX = (a.x + b2.x) / 2;
      // the stem down to the caption is drawn only when the caption is shown
      const stem = guideChip ? [{x: midX, y: guideChipAt.y}] : [];
      pts = [a, {x: midX, y: a.y}, ...stem];
      ptsB = [b2, {x: midX, y: b2.y}, ...stem];
    }
    const guide = routeGuide(ctx, 'guide', pts, th.fg);
    const guideB = routeGuide(ctx, 'guideb', ptsB, th.fg);
    const noteW = (arrangement === 'row' ? bw : st.w) * 0.94;
    const noteX = B.noteX;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: noteX, y: B.noteY, anchor: 'middle', maxWidth: noteW, size: B.noteSize, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: noteX, y: B.noteY, maxWidth: noteW, size: B.noteSize, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: noteX, y: B.noteY, maxWidth: noteW, size: B.noteSize, name: 'neutral-note'}) : null;
    // each detail panel sits under its own scene (and not under the other one)
    // (the nearest scene above the panel, among those it overlaps horizontally)
    const ownScene = details.map((d, i) => {
      const above = panels.map((pn, k) => ({k, pn})).filter(({pn}) => pn.y + st.h <= d.box.y + 0.5 && d.box.x < pn.x + st.w && d.box.x + d.box.w > pn.x);
      above.sort((q1, q2) => q2.pn.y - q1.pn.y);
      return above.length > 0 && above[0].k === i;
    });
    return {stages, headers, panels, details, timing, rings, guide, guideB, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, onlyB, onlyBIndex, exactN, bw, bh: B.bh, fs: B.fs, ownScene, sceneFit: s / bare};
  },
  build(ctx, L) {
    const ring = (i, dashed) => h('path', {name: `ring-${i}`, d: roundRectPath(L.rings[i].x, L.rings[i].y, L.rings[i].w, L.rings[i].h, 14), fill: 'none', stroke: ctx.theme.ink, 'stroke-width': 4, 'stroke-dasharray': dashed ? '10 8' : null, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers.map(x => x.node),
      L.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      L.details.map(d => d.node),
      ring(0, true), ring(1, false),
      L.guide.node, L.guideB.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const type = seg(u, ...W.type);
    const bloom = seg(u, ...W.bloom);
    const sem = L.stages.map((stg, i) => {
      const links = L.timing[i].map(t => ({travel: seg(u, t.t0, t.t1), tab: seg(u, t.t1, t.tab), mark: seg(u, t.tab, t.mark)}));
      const print = L.timing[i].reduce((acc, t) => acc + seg(u, t.mark, t.mark + W.print), 0);
      const posed = stg.pose({type, press: seg(u, ...W.press), bloom: i === 1 ? bloom : 0, links, print});
      Object.assign(nodes, posed.nodes);
      return posed.semantic;
    });
    // the detail panels mirror their scene: B's thread, tab and highlight run
    // with B's related-wording link; A's passage stays unlinked
    const tB = L.onlyBIndex >= 0 ? L.timing[1][L.onlyBIndex] : null;
    const linkB = tB ? {travel: seg(u, tB.t0, tB.t1), tab: seg(u, tB.t1, tB.tab), mark: seg(u, tB.tab, tB.mark)} : {travel: 0, tab: 0, mark: 0};
    // A's slot states 'no related wording' as B's list drops into its slot
    Object.assign(nodes, L.details[0].frame({bloom: 0, travel: 0, tab: 0, mark: 0, none: bloom}));
    Object.assign(nodes, L.details[1].frame({bloom, ...linkB}));
    const gp = seg(u, ...W.guide);
    Object.assign(nodes, L.guide.frame(gp), L.guideB.frame(gp));
    nodes['ring-0'] = {opacity: clamp(gp * 3)};
    nodes['ring-1'] = {opacity: clamp(gp * 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: clamp((gp - 0.5) * 2)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    // the footer notes share one place: each leaves before the next arrives
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - seg(u, 0.52, 0.56)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, 0.57, 0.61) * (1 - seg(u, 0.84, 0.87)), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = (s2, i) => (s2.tokens[i] ? s2.tokens[i] : null);
    const view = s2 => ({
      typed: s2.typed,
      linked: s2.links.filter(l => l.mark >= 1).map(l => `${l.source}:${l.passage}:${l.kind}`),
      marked: s2.marked,
      contextual: s2.links.filter(l => l.kind === 'contextual').length,
      cardLines: s2.cardLines,
      tokens: s2.tokens,
    });
    const cardA = L.stages[0].card, cardB = L.stages[1].card;
    return {
      nodes,
      semantic: {
        beat,
        a: view(sem[0]),
        b: view(sem[1]),
        bloomB: r(bloom, 3),
        tokA0: pick(sem[0], 0), tokB0: pick(sem[1], 0),
        tokA1: pick(sem[0], 1), tokB1: pick(sem[1], 1),
        tokBctx: L.exactN < sem[1].tokens.length ? sem[1].tokens[L.exactN] : null,
        changedPassage: L.onlyB ? `${L.onlyB.m.source}:${L.onlyB.m.passage}` : null,
        detailMarkB: r(linkB.mark, 3),
        detailMarkA: 0,
        cardSize: {a: cardA ? r(cardA.size, 2) : null, b: cardB ? r(cardB.size, 2) : null},
        detailFontPx: r(L.fs * L.s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * (1080 / Math.min(ctx.view.width, ctx.view.height)), 2),
        guideProgress: gp,
        arrangement: L.arrangement,
        detailsUnderOwnScene: L.ownScene.every(Boolean),
        sceneFit: r(L.sceneFit, 3),
        noRelatedA: nodes['da-none'] ? nodes['da-none'].opacity : null,
      },
    };
  },
};

/**
 * Orthogonal guide through waypoints with rounded corners, drawn on
 * progressively (no arrowhead: it relates two details, it is not a cause).
 */
function routeGuide(ctx, name, pts, color) {
  const rad = 26;
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    total += Math.hypot(b.x - a.x, b.y - a.y);
    if (i < pts.length - 1) {
      const c = pts[i + 1];
      const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
      const k1 = Math.min(rad, l1 / 2) / (l1 || 1), k2 = Math.min(rad, l2 / 2) / (l2 || 1);
      const p1 = {x: b.x - (b.x - a.x) * k1, y: b.y - (b.y - a.y) * k1};
      const p2 = {x: b.x + (c.x - b.x) * k2, y: b.y + (c.y - b.y) * k2};
      d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    } else d += `L${r(b.x)} ${r(b.y)}`;
  }
  const th = ctx.theme;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-halo`, d, fill: 'none', stroke: th.dark ? '#23262b' : '#ffffff', 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.8, 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: r(pts[0].x), cy: r(pts[0].y), r: 8, fill: color, opacity: 0}),
  );
  const frame = p => ({
    [name]: {opacity: p > 0 ? 1 : 0},
    [`${name}-halo`]: {'stroke-dashoffset': r(total * (1 - clamp(p)))},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - clamp(p)))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
  });
  return {node, frame, pts};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-01-contrast',
    title: 'Term search — exact vs contextual match',
    titleEs: 'Búsqueda por términos — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Búsqueda por términos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical library search scenes run the same query over the same volumes. A links only the literal words; B also drops down the related wording supplied for each word and links the extra passages (dashed threads, outlined tabs). Matched detail panels enlarge each scene’s search box and the passage only B links; a guide joins them. No mode is ranked.',
    tags: ['search', 'exact match', 'contextual match', 'comparison', 'library', 'passage', 'side-by-side', 'stacked', 'detail'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/busqueda-por-terminos.js', 'src/animations/research/kits/busqueda-por-terminos-fields.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {noRelated: 'No related wording'}, es: {noRelated: 'Sin términos relacionados'}},
  scene,
});
