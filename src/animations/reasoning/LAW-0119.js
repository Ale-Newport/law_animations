/**
 * LAW-0119 — Límite de una conclusión · contrast
 *
 * Storyboard (two complete survey maps, no hands — a brass line-marking reel
 * lays each cord; the proposition plate and the notes are drawn ONCE and shared):
 *  0.00–0.17 base      Two identical maps: the same situation cards in the
 *                      same places, a tie post at the top of each map with the
 *                      cord tied to it and the reel parked beside it. The
 *                      changed situation sits in its own column between the
 *                      others; a dashed highlight picks it out on BOTH maps.
 *  0.17–0.40 change    The highlight hands over to a large frame around that
 *                      card, drawn in the language of the result markers: a
 *                      solid cord-coloured frame (supplied as covered) or a
 *                      thick dashed frame (supplied as not examined). The
 *                      scenario labels appear with the frames.
 *  0.40–0.77 parallel  Both reels start at the same instant and roll around
 *                      their maps laying the cord around the covered cards.
 *                      Every other card is treated identically. When both
 *                      loops are closed, pennants appear inside and dashed
 *                      rings outside.
 *  0.77–1.00 guide     A guide line joins the changed card of A and of B
 *                      ("changed detail"); the only-change line and the
 *                      neutral note are shown. No winner, no score, no
 *                      conclusion: both maps are supplied variants.
 * Cards print their supplied text when the maps have room; otherwise they are
 * numbered tiles (never placeholder bars) and the texts are listed once in a
 * compact legend beside the notes. Wide boxes: maps side by side (each >= 40%
 * of the width), guide under them, the shared strip below in columns. Tall
 * boxes: maps stacked full width, the guide runs down the right margin. Square
 * boxes: whichever of the two keeps the maps larger.
 * Legal content: fictional, jurisdiction unspecified; which situations lie
 * inside each cord is supplied by the author (outside = not examined, never
 * excluded or decided).
 * @module animations/reasoning/LAW-0119
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {int, oneOf, contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  limFields, LIM_STRINGS, LIM_DEFAULTS, SCOPES, SANS, resolveSituations, limColors, unitsPer1080px, packZone, cardArt, cardTransform,
  cardGeom, tileGeom, plaqueGeom, plaqueArt, mapSheet, cordArt, cordFrame, reelArt, cordPath, track, boxBounds, distToBox, inside, tiePost, flagGlyph, fitOk,
} from './kits/limite-de-una-conclusion.js';

const ID = 'LAW-0119';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  staticNotes: [0.01, 0.1], hi: [0.07, 0.14], mark: [0.19, 0.3], labels: [0.28, 0.38],
  lay: [0.42, 0.72], flags: [0.735, 0.775], rings: [0.745, 0.785], guide: [0.8, 0.88], guideLabel: [0.85, 0.91], dynNotes: [0.86, 0.95],
};

const EXTRA = {
  en: {sameIn: 'Same in A and B', onlyChange: 'Only change', situations: 'Situations (as supplied)'},
  es: {sameIn: 'Igual en A y B', onlyChange: 'Único cambio', situations: 'Supuestos (según lo aportado)'},
};
const STRINGS = {en: {...LIM_STRINGS.en, ...EXTRA.en}, es: {...LIM_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...limFields,
  ...contrastFields(),
  changedSituation: int('Zero-based index of the situation whose supplied scope differs between A and B (its own scope in `facts` is replaced by scopeA / scopeB)', 0, 5),
  scopeA: oneOf('Scope supplied for the changed situation in scene A', SCOPES),
  scopeB: oneOf('Scope supplied for the changed situation in scene B', SCOPES),
};

const defaultParams = {
  ...LIM_DEFAULTS,
  changedSituation: 1,
  scopeA: 'included',
  scopeB: 'not-examined',
  scenarioA: {label: 'Situation 2 supplied as covered', caption: 'The cord is laid around it'},
  scenarioB: {label: 'Situation 2 supplied as not examined', caption: 'The cord passes it by'},
  changedFact: 'the supplied scope of situation 2 (covered in A, not examined in B)',
  sharedFacts: ['same proposition', 'same four situations in the same places', 'same cord and laying speed'],
  comparisonLabels: {guide: 'Changed detail: situation 2', neutral: 'Two supplied variants compared — no winner, no score'},
};

const M = 16;

/**
 * Geometry of one map panel (local coordinates, identical for A and B).
 * textMode: every token is a situation card printing its supplied text (no legend needed);
 * otherwise tokens are numbered tiles (no placeholder text) and the texts go to the shared legend once.
 */
function planPanel(ctx, o) {
  const {w, h: hh, sits, changed, px, textMode, s} = o;
  const C = sits.filter(q => q.i !== changed && q.scope === 'included');
  const O = sits.filter(q => q.i !== changed && q.scope !== 'included');
  const pad = textMode ? 16 : 12;
  const ks = px(16.8);
  const ts0 = textMode ? s : Math.max(s, px(20));
  const colsW = (n, tw, gx) => (n ? n * tw + (n - 1) * gx : 0);
  const maxTok = textMode ? Math.min(s * 12, w / 3) : Math.min(ts0 * 6.5, w / 4.2);
  for (let tokW = maxTok; tokW >= (textMode ? s * 6.2 : ts0 * 3.2); tokW -= 4) {
    // tiles grow with the room they get (the number on them stays >= the text size)
    const ts = textMode ? s : clamp(tokW / 3.3, ts0, ts0 * 1.8);
    const geoOf = tw => (it => (textMode
      ? cardGeom(ctx, {text: it.text, n: it.n, w: tw, s: ts, tags: false, kindSize: ks, maxLines: 6})
      : tileGeom({w: tw, s: ts, n: it.n, text: it.text})));
    const geo = geoOf(tokW);
    const geos = sits.map(it => geo(it, tokW));
    if (geos.some(q => q.truncated)) continue;
    const tokH = Math.max(...geos.map(q => q.h));
    const m = clamp(tokW * (textMode ? 0.22 : 0.3), 26, 58);
    const gap = m;
    const gx = tokW * 0.12, gy = Math.max(12, ts * 0.8);
    const rr = clamp(m * 0.25, 7, 12);
    const fp = geos[0].head * 0.45;
    const top = pad + rr * 2 + m * (textMode ? 1.35 : 1.05) + fp;
    const zoneH = hh - top - m - pad;
    if (zoneH < tokH) continue;
    const opts = key => ({s: ts, maxW: tokW, minW: tokW * 0.99, geo, tags: false, kindSize: ks, seedKey: key, gx, gy, jitter: 0.6, maxLines: 6});
    // choose the fewest columns per zone whose rows fit the zone height
    const colsFor = list => { for (let c = 1; c <= list.length; c++) { if (packZone(ctx, {x: 0, y: 0, w: colsW(c, tokW, gx), h: zoneH}, list, {...opts('probe'), forceCols: c}).fits) return c; } return 0; };
    const colsC = C.length ? colsFor(C) : 0, colsO = O.length ? colsFor(O) : 0;
    if ((C.length && !colsC) || (O.length && !colsO)) continue;
    const needW = pad + m + (C.length ? colsW(colsC, tokW, gx) + m + gap : 0) + tokW + (O.length ? m + gap + colsW(colsO, tokW, gx) : m) + pad;
    if (needW > w) continue;
    const off = (w - needW) / 2;
    let x = off + pad + m;
    const zC = C.length ? {x, y: top, w: colsW(colsC, tokW, gx), h: zoneH} : null;
    if (zC) x += zC.w + m + gap;
    const zF = {x, y: top, w: tokW, h: zoneH};
    x += tokW + m + gap;
    const zO = O.length ? {x, y: top, w: colsW(colsO, tokW, gx), h: zoneH} : null;
    const pC = zC ? packZone(ctx, zC, C, {...opts('cz'), forceCols: colsC}) : {cards: [], fits: true};
    const pF = packZone(ctx, zF, sits.filter(q => q.i === changed), {...opts('fz'), forceCols: 1});
    const pO = zO ? packZone(ctx, zO, O, {...opts('oz'), forceCols: colsO}) : {cards: [], fits: true};
    if (!pC.fits || !pF.fits || !pO.fits) continue;
    const cards = [...pC.cards, ...pF.cards, ...pO.cards].sort((a, b) => a.i - b.i);
    const ringX = zC ? zC.x + zC.w / 2 : zF.x + zF.w / 2;
    const ring = {x: ringX, y: pad + rr * 1.6};
    const rest = {x: ring.x + m * 0.9, y: ring.y + m * 0.45};
    return {w, h: hh, tokW, tokH, ts, m, gap, rr, cards, ring, rest, zC, zF, zO, ok: true, textMode};
  }
  return {ok: false};
}

/** Notes rows (the shared notes under the maps). */
/**
 * tier (only when nothing else fits at the text floor): primary rows (the only-change line) keep s; the
 * secondary notes (issues, assumptions) use tier.ns; generic captions (shared facts, key, neutral line) tier.cs <= ns.
 */
function noteRows(ctx, p, t, maxW, s, tier = null) {
  const rows = [];
  const add = (kind, text, o = {}) => {
    const sz = !tier ? s : o.tierSize === 'ns' ? tier.ns : o.tierSize === 'cs' ? tier.cs : s;
    rows.push({kind, dyn: !!o.dyn, fit: ctx.fit(text, {maxWidth: maxW - (o.icon ? s * 1.3 : 0), size: sz, minSize: tier ? sz : sz * 0.94, maxLines: 6, weight: o.weight ?? 500}), icon: !!o.icon, italic: !!o.italic});
  };
  if (ctx.show('all')) {
    if (p.sharedFacts.length) add('shared', `${t.sameIn}: ${p.sharedFacts.join(' · ')}`, {weight: 600, tierSize: 'cs'});
    p.issues.forEach(q => add('issue', `${t.issue}: ${q}`, {weight: 600, tierSize: 'ns'}));
    p.assumptions.forEach(q => add('assumed', `${t.assumed}: ${q}`, {italic: true, tierSize: 'ns'}));
  }
  if (ctx.show('key')) {
    add('in', t.keyInside, {icon: true, weight: 600, tierSize: 'cs'});
    add('out', t.keyOutside, {icon: true, weight: 600, tierSize: 'cs'});
  }
  if (ctx.show('all') && p.changedFact) add('change', `${t.onlyChange}: ${p.changedFact}`, {weight: 700, dyn: true});
  if (ctx.show('key')) add('neutral', [ctx.show('all') ? p.comparisonLabels.neutral : null, t.noConclusion].filter(Boolean).join(' · '), {weight: 700, dyn: true, tierSize: 'cs'});
  return rows;
}

/**
 * The shared text strip under the maps, drawn once: the legend (tile mode only) and the notes, flowed into 1–3
 * columns (whichever is shortest). Each column holds legend rows and/or one notes card.
 */
function bottomBlock(ctx, p, t, s, px, legend, sits, W, tier = null, plateOf = null) {
  const badge = Math.max(s * 1.2, px(16.8) * 1.5);
  const legGap = s * 0.16;
  const colGap = s * 1.1;
  const gapV = s * 0.5;
  let best = null;
  for (let k = 1; k <= 3; k++) {
    const colW = (W - (k - 1) * colGap) / k;
    if (k > 1 && colW < s * 13) break;
    const leg = legend ? sits.map(q => ({type: 'leg', i: q.i, n: q.n, fit: ctx.fit(q.text, {maxWidth: colW - badge - s * 1.4, size: s, minSize: s * 0.94, maxLines: 5, weight: 500})})) : [];
    leg.forEach(it => { it.h = Math.max(it.fit.height, badge) + legGap * 2; });
    const notes = noteRows(ctx, p, t, colW - s * 1.2, s, tier).map(rw => ({...rw, type: 'note', h: rw.fit.height}));
    const pl = plateOf ? plateOf(colW) : null;
    const items = [...(pl ? [{type: 'plate', pg: pl, h: pl.h, fit: null}] : []), ...leg, ...notes];
    if (!items.length) return {k: 0, cols: [], h: 0, truncated: false, badge, legGap, colGap, gapV, colW: W};
    const noteGap = s * 0.38;
    const colH = list => {
      const pp = list.filter(it => it.type === 'plate'), l = list.filter(it => it.type === 'leg'), n = list.filter(it => it.type === 'note');
      const hp = pp.length ? pp[0].h : 0;
      const hl = l.length ? l.reduce((a, it) => a + it.h, 0) + (l.length - 1) * 4 : 0;
      const hn = n.length ? n.reduce((a, it) => a + it.h, 0) + (n.length - 1) * noteGap + s * 1.2 : 0;
      return hp + hl + hn + (Math.max(1, (hp ? 1 : 0) + (hl ? 1 : 0) + (hn ? 1 : 0)) - 1) * gapV;
    };
    // contiguous split into k columns minimising the tallest (key rows kept together)
    const N = items.length;
    const cuts = k === 1 ? [[]] : k === 2 ? [...Array(N - 1).keys()].map(a => [a + 1]) : [...Array(N - 1).keys()].flatMap(a => [...Array(N - a - 2).keys()].map(b => [a + 1, a + b + 2]));
    let bk = null;
    for (const c of cuts) {
      if (c.some(x => items[x - 1] && items[x - 1].kind === 'in' && items[x].kind === 'out')) continue;
      const edges = [0, ...c, N];
      const cols = edges.slice(1).map((e, j) => items.slice(edges[j], e));
      const hh = Math.max(...cols.map(colH));
      if (!bk || hh < bk.h - 0.5) bk = {cols: cols.map(list => ({items: list, h: colH(list)})), h: hh};
    }
    if (!bk) continue;
    const truncated = items.some(it => !fitOk(it.fit)) || !!(pl && pl.truncated);
    if (!best || bk.h < best.h - s * 0.5) best = {k, colW, cols: bk.cols, h: bk.h, truncated, badge, legGap, colGap, gapV, noteGap};
  }
  return best;
}

function compose(ctx, s, textMode, arr, tier = null) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const u = unitsPer1080px(ctx);
  const px = v => v * u;
  const col = arr === 'col';
  const sits = resolveSituations(p.facts);
  const changed = clamp(p.changedSituation, 0, sits.length - 1);
  const gapV = s * 0.7;
  // shared proposition plate
  const plW = D.w - 2 * M;
  const plateGeo = w => plaqueGeom(ctx, {w, s, kind: t.propKind, kindSize: Math.min(s, Math.max(s * 0.72, px(16.5))), title: p.rules.title, text: p.rules.proposition, maxLines: tier && tier.plateInStrip ? 8 : 3});
  // (tiered stress layout: the plate may join the shared strip so the maps keep their share of the frame)
  const inStrip = !!(tier && tier.plateInStrip);
  const pg = inStrip ? {h: 0, truncated: false} : plateGeo(plW);
  const plate = {x: (D.w - plW) / 2, y: M, w: plW, h: inStrip ? -gapV : pg.h};
  // shared text strip (legend in tile mode + notes)
  const bb = bottomBlock(ctx, p, t, s, px, !textMode && ctx.show('key'), sits, D.w - 2 * M, tier, inStrip ? plateGeo : null);
  const bottomH = bb.h;
  // headers
  const hs = s;
  const capS = tier ? tier.cs : Math.min(s, Math.max(s * 0.9, px(16.3)));
  const guideRight = col ? s * 1.4 : 0;
  const pwEst = col ? D.w - 2 * M - guideRight : (D.w - 2 * M - s * 1.6) / 2;
  const brH = Math.max(hs * 0.62, px(16.8) * 0.85);
  const oneLine = !ctx.show('all') || (!tier && [p.scenarioA, p.scenarioB].every(sc => {
    if (!sc.caption) return true;
    const f = ctx.fit(sc.label, {maxWidth: 1e5, size: hs, minSize: hs, maxLines: 1, weight: 700});
    const f2 = ctx.fit(` · ${sc.caption}`, {maxWidth: 1e5, size: hs, minSize: hs, maxLines: 1, weight: 500});
    return f.width + 4 + f2.width <= pwEst - brH * 2 - 24;
  }));
  const hwEst = pwEst - brH * 2 - 20;
  const labFit = sc => ctx.fit(sc.label, {maxWidth: hwEst, size: hs, minSize: hs, maxLines: 2, weight: 700});
  const capFit = sc => ctx.fit(sc.caption, {maxWidth: hwEst, size: capS, minSize: capS, maxLines: 2, weight: 500});
  const labH = ctx.show('key') ? Math.max(...[p.scenarioA, p.scenarioB].map(sc => labFit(sc).height)) : hs;
  const capH = ctx.show('all') && !oneLine ? Math.max(...[p.scenarioA, p.scenarioB].map(sc => (sc.caption ? capFit(sc).height + capS * 0.35 : 0))) : 0;
  const headTrunc = ctx.show('key') && [p.scenarioA, p.scenarioB].some(sc => !fitOk(labFit(sc)) || (ctx.show('all') && sc.caption && !fitOk(capFit(sc))));
  const headH = Math.max(labH + 6, px(16.8) * 1.7 + 4) + capH + 8;
  // guide room
  const guideStrip = col ? 0 : s * 2.3;
  const guideGap = col ? s * 2.9 : 0;
  const yTop = plate.y + plate.h + gapV;
  const yBot = D.h - M - bottomH - (bottomH ? gapV : 0) - guideStrip;
  let panels;
  if (!col) {
    const pw = (D.w - 2 * M - s * 1.6) / 2;
    const ph = yBot - yTop - headH;
    panels = [0, 1].map(k => ({x: M + k * (pw + s * 1.6), y: yTop + headH, w: pw, h: ph, hy: yTop}));
  } else {
    const pw = D.w - 2 * M - guideRight;
    const ph = (yBot - yTop - 2 * headH - guideGap) / 2;
    panels = [0, 1].map(k => ({x: M, y: yTop + headH + k * (ph + headH + guideGap), w: pw, h: ph, hy: yTop + k * (ph + headH + guideGap)}));
  }
  // the scenes stay the subject (AUTHORING item 18): side by side each map is ≥ ~40% of the width and a good part of
  // the height; stacked each is full width and not a strip
  const mapFrac = panels[0].h / D.h;
  const mapOk = col ? mapFrac >= 0.25 : mapFrac >= 0.3;
  const P = panels[0].h > 60 ? planPanel(ctx, {w: panels[0].w, h: panels[0].h, sits, changed, px, textMode, s}) : {ok: false};
  const fits = P.ok && mapOk && !headTrunc && !pg.truncated && !bb.truncated;
  const fitInfo = {P: P.ok, mapFrac: Math.round(mapFrac * 1000) / 1000, pg: !pg.truncated, bb: !bb.truncated, bottomH: Math.round(bottomH), k: bb.k, panelH: Math.round(panels[0].h), plateH: Math.round(pg.h), head: !headTrunc};
  return {tier, fitInfo, arr, mapFrac, oneLine, s, u, px, col, textMode, sits, changed, plate, pg, gapV, bb, bottomH, headH, hs, capS, panels, P, fits, yBot, guideStrip, guideGap, guideRight};
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const Cc = limColors(ctx);
  const P = L.P;
  const scopes = [p.scopeA, p.scopeB];
  L.scenes = [0, 1].map(k => {
    const pan = L.panels[k];
    const pre = k === 0 ? 'a' : 'b';
    const cards = P.cards.map(c => ({...c, scope: c.i === L.changed ? scopes[k] : c.scope}));
    const covered = cards.filter(c => c.scope === 'included');
    const cp = cordPath(covered, P.rest, P.m, {emptyAt: {x: P.rest.x, y: P.rest.y + P.m * 1.6}});
    const tr = track([P.ring, P.rest, ...cp.loop]);
    const lead = Math.hypot(P.rest.x - P.ring.x, P.rest.y - P.ring.y);
    const chg = cards.find(c => c.i === L.changed);
    return {k, pre, pan, cards, covered, cp, tr, lead, chg, scope: scopes[k]};
  });
  // nodes per scene (local coordinates, translated to the panel)
  L.sceneNodes = L.scenes.map(S => {
    const {pan, pre} = S;
    const tok = S.cards.map(c => cardArt(ctx, c.geo, {prefix: pre, i: c.i, transform: cardTransform(c.box)}));
    const b = boxBounds(S.chg.box);
    const hi = h('path', {name: `${pre}-hi`, d: roundRectPath(b.x - 14, b.y - 16, b.w + 28, b.h + 30, 16), fill: 'none', stroke: th.accent3, 'stroke-width': 4, 'stroke-dasharray': '10 7', opacity: 0});
    // change marker around the changed card (the supplied scope, drawn large and in the same language as the
    // result markers): A solid cord-coloured frame = supplied as covered; a thick dashed frame = not examined
    const cg = S.chg.geo;
    const fh = cg.h - cg.tagH * 0.5;
    const solid = S.scope === 'included';
    const mark = g({name: `${pre}-mark`, transform: cardTransform(S.chg.box), opacity: 0},
      solid ? h('path', {d: roundRectPath(-11, -11, cg.w + 22, fh + 22, 14), fill: 'none', stroke: Cc.cordDark, 'stroke-width': 9}) : null,
      h('path', {d: roundRectPath(-11, -11, cg.w + 22, fh + 22, 14), fill: 'none', stroke: solid ? Cc.cord : Cc.ring, 'stroke-width': solid ? 5.5 : 5, 'stroke-dasharray': solid ? undefined : '12 8', 'stroke-linecap': 'round'}));
    return g({name: `${pre}-scene`, transform: T(pan.x, pan.y)},
      mapSheet(ctx, {name: `${pre}-map`, x: 0, y: 0, w: pan.w, h: pan.h, step: 44, compass: 0, tapes: true}),
      hi,
      mark,
      tok,
      tiePost(ctx, {name: `${pre}-post`, x: P.ring.x, y: P.ring.y + P.rr * 0.5, rr: P.rr}),
      cordArt(ctx, `${pre}-cord`, clamp(P.tokW * 0.05, 4, 6)),
      g({name: `${pre}-reel`}, reelArt(ctx, `${pre}-reelA`, clamp(P.tokW * 0.13, 11, 20))),
    );
  });
  // headers
  const letter = ['A', 'B'];
  L.headers = L.scenes.map(S => {
    const pan = S.pan;
    const br = Math.max(L.hs * 0.62, L.px(16.8) * 0.85);
    const sc = S.k === 0 ? p.scenarioA : p.scenarioB;
    const parts = [
      h('circle', {cx: r(pan.x + br), cy: r(pan.hy + br + 2), r: r(br), fill: th.ink, stroke: th.ink, 'stroke-width': 2}),
      ctx.show('key') ? h('text', {x: r(pan.x + br), y: r(pan.hy + br + 2 + Math.max(br * 1.2, L.px(16.8)) * 0.36), 'text-anchor': 'middle', 'font-size': r(Math.max(br * 1.2, L.px(16.8))), 'font-weight': 800, 'font-family': SANS, fill: '#fff'}, letter[S.k]) : null,
    ];
    let lab = null;
    if (ctx.show('key')) {
      const hw = pan.w - br * 2 - 20;
      const ly0 = pan.hy + 2 + br;
      if (L.oneLine && sc.caption && ctx.show('all')) {
        // one line: the label (bold) followed by the caption (regular), measured separately
        const f = ctx.fit(sc.label, {maxWidth: hw, size: L.hs, minSize: L.hs, maxLines: 1, weight: 700});
        const sep = ' · ';
        const f2 = ctx.fit(sep + sc.caption, {maxWidth: Math.max(40, hw - f.width), size: L.hs, minSize: L.hs, maxLines: 1, weight: 500});
        lab = g({name: `${S.pre}-label`, opacity: 0},
          textBlock(f, {x: pan.x + br * 2 + 14, y: ly0 - f.height * 0.55, fill: th.fg}),
          textBlock(f2, {x: pan.x + br * 2 + 14 + f.width + 4, y: ly0 - f.height * 0.55, fill: th.fgSoft}));
        L.labelTrunc = (L.labelTrunc || false) || f.truncated || f2.truncated;
        return g(null, parts, lab);
      }
      const f = ctx.fit(sc.label, {maxWidth: hw, size: L.hs, minSize: L.hs, maxLines: 2, weight: 700});
      const f2 = ctx.show('all') && sc.caption ? ctx.fit(sc.caption, {maxWidth: hw, size: L.capS, minSize: L.capS, maxLines: 2, weight: 500}) : null;
      const ly = ly0 - f.size * 0.55;
      lab = g({name: `${S.pre}-label`, opacity: 0},
        textBlock(f, {x: pan.x + br * 2 + 14, y: ly, fill: th.fg}),
        f2 ? textBlock(f2, {x: pan.x + br * 2 + 14, y: ly + f.height + L.capS * 0.35, fill: th.fgSoft}) : null);
      L.labelTrunc = (L.labelTrunc || false) || f.truncated || !!(f2 && f2.truncated);
    }
    return g(null, parts, lab);
  });
  // shared plate
  L.plateArt = L.tier && L.tier.plateInStrip ? null : plaqueArt(ctx, L.pg, {x: L.plate.x, y: L.plate.y, name: 'plate', ring: 'none'});
  // shared strip: legend rows (tile mode) and notes, in columns
  L.legend = null;
  L.noteCards = [];
  {
    const bb = L.bb;
    const sS = L.s;
    const pad = sS * 0.6;
    const y0 = D.h - M - L.bottomH;
    const legParts = [];
    let mark = null;
    bb.cols.forEach((cl, ci) => {
      const x = M + ci * (bb.colW + bb.colGap);
      let y = y0;
      const pl = cl.items.find(it => it.type === 'plate');
      if (pl) {
        L.plateArt = plaqueArt(ctx, pl.pg, {x, y, name: 'plate', ring: 'none'});
        y += pl.h + bb.gapV;
      }
      const leg = cl.items.filter(it => it.type === 'leg'), notes = cl.items.filter(it => it.type === 'note');
      leg.forEach(rw => {
        const rh = rw.h;
        legParts.push(h('path', {d: roundRectPath(x, y, bb.colW, rh, 10), fill: th.card, stroke: th.paperLine, 'stroke-width': 1.6}));
        const cx = x + sS * 0.4 + bb.badge / 2, cy = y + rh / 2;
        legParts.push(h('circle', {cx: r(cx), cy: r(cy), r: r(bb.badge / 2), fill: th.ink}));
        legParts.push(h('text', {x: r(cx), y: r(cy + Math.max(bb.badge * 0.58, L.px(16.8)) * 0.36), 'text-anchor': 'middle', 'font-size': r(Math.max(bb.badge * 0.58, L.px(16.8))), 'font-weight': 800, 'font-family': SANS, fill: '#fff'}, String(rw.n)));
        legParts.push(textBlock(rw.fit, {x: x + bb.badge + sS * 0.9, y: cy - rw.fit.height / 2, fill: th.ink}));
        if (rw.i === L.changed) mark = h('path', {name: 'leg-hi', d: roundRectPath(x - 5, y - 5, bb.colW + 10, rh + 10, 13), fill: 'none', stroke: th.accent3, 'stroke-width': 4, 'stroke-dasharray': '10 7', opacity: 0});
        y += rh + 4;
      });
      if (leg.length && notes.length) y += bb.gapV - 4;
      if (notes.length) {
        const hh = notes.reduce((a, it) => a + it.h, 0) + (notes.length - 1) * bb.noteGap + sS * 1.2;
        const st = [], dy = [];
        let yy = y + pad;
        notes.forEach(rw => {
          const tx = x + pad + (rw.icon ? sS * 1.3 : 0);
          const cy = yy + rw.fit.size * 0.55;
          const glyph = rw.kind === 'in'
            ? h('path', {d: flagGlyph(x + pad + sS * 0.45, cy, sS * 0.9), fill: Cc.cord})
            : rw.kind === 'out' ? h('path', {d: roundRectPath(x + pad, cy - sS * 0.42, sS * 0.84, sS * 0.84, sS * 0.2), fill: 'none', stroke: Cc.ring, 'stroke-width': 2.2, 'stroke-dasharray': '4 3'}) : null;
          const color = rw.kind === 'assumed' ? th.inkSoft : th.ink;
          (rw.dyn ? dy : st).push(g(null, glyph, textBlock(rw.fit, {x: tx, y: yy, fill: color, italic: rw.italic})));
          yy += rw.fit.height + bb.noteGap;
        });
        // a card holding only the late rows (only change, neutral note) arrives with them — never an empty card
        const paper = [h('path', {d: roundRectPath(x + 4, y + 7, bb.colW, hh, 8), fill: th.shadow}),
          h('path', {d: roundRectPath(x, y, bb.colW, hh, 8), fill: Cc.note, stroke: th.ink, 'stroke-width': 2})];
        const lateOnly = !st.length;
        L.noteCards.push({ci, box: {x, y, w: bb.colW, h: hh}, dyn: dy.length > 0, lateOnly, node: g(null,
          lateOnly ? null : g({name: `notesS${ci}`, opacity: 0}, paper, st),
          dy.length ? g({name: `notesD${ci}`, opacity: 0}, lateOnly ? paper : null, dy) : null)});
      }
    });
    if (legParts.length) L.legend = g({name: 'legend'}, legParts, mark);
  }
  // guide between the changed tokens
  const tokA = L.scenes[0], tokB = L.scenes[1];
  const bA = boxBounds(tokA.chg.box), bB = boxBounds(tokB.chg.box);
  const gA = (q, pan) => ({x: pan.x + q.x, y: pan.y + q.y});
  let pts, labelAt;
  const gs = L.tier ? L.tier.cs : Math.min(L.s, Math.max(L.s * 0.92, L.px(16.3)));
  const gtext = ctx.show('all') ? p.comparisonLabels.guide : null;
  const gfit = gtext ? ctx.fit(gtext, {maxWidth: L.col ? D.w * 0.6 : D.w * 0.4, size: gs, minSize: gs * 0.94, maxLines: 2, weight: 700}) : null;
  const gw = gfit ? gfit.width + gs * 1.2 : 0, gh = gfit ? gfit.height + gs * 0.7 : 0;
  if (!L.col) {
    const a0 = gA({x: bA.x + bA.w / 2, y: bA.y + bA.h + 8}, tokA.pan), b0 = gA({x: bB.x + bB.w / 2, y: bB.y + bB.h + 8}, tokB.pan);
    const gy = L.yBot + L.guideStrip * 0.5;
    pts = [a0, {x: a0.x, y: gy}, {x: b0.x, y: gy}, b0];
    labelAt = {x: (a0.x + b0.x) / 2 - gw / 2, y: gy - gh / 2};
  } else {
    // tall boxes: from each changed card through free map space (a lane that passes no other card) to the right
    // margin, and down the margin between them — the guide touches only the changed cards
    const gx = tokA.pan.x + tokA.pan.w + L.guideRight * 0.5;
    const lane = S => {
      const pan = S.pan, b = boxBounds(S.chg.box);
      const others = S.cards.filter(c => c.i !== L.changed).map(c => {
        const o = boxBounds(c.box);
        // (clear of the card's dashed ring too, which is drawn 11 units out)
        return {x: pan.x + o.x - 26, y: pan.y + o.y - 26, w: o.w + 52, h: o.h + 52};
      });
      const cb = {x: pan.x + b.x, y: pan.y + b.y, w: b.w, h: b.h};
      const clear = (p0, p1) => {
        const n = Math.max(2, Math.ceil(Math.hypot(p1.x - p0.x, p1.y - p0.y) / 6));
        for (let k = 0; k <= n; k++) {
          const q = {x: p0.x + ((p1.x - p0.x) * k) / n, y: p0.y + ((p1.y - p0.y) * k) / n};
          if (others.some(o => q.x > o.x && q.x < o.x + o.w && q.y > o.y && q.y < o.y + o.h)) return false;
        }
        return true;
      };
      const ys = [];
      for (let y = pan.y + 10; y <= pan.y + pan.h - 10; y += 6) ys.push(y);
      ys.sort((a, c) => Math.abs(a - (cb.y + cb.h / 2)) - Math.abs(c - (cb.y + cb.h / 2)));
      for (const y of ys) {
        if (y > cb.y + 10 && y < cb.y + cb.h - 10) {
          const st = {x: cb.x + cb.w + 6, y};
          if (clear(st, {x: gx, y})) return {path: [st, {x: gx, y}], y};
        } else {
          const st = {x: cb.x + cb.w / 2, y: y >= cb.y + cb.h ? cb.y + cb.h + 6 : cb.y - 12};
          if (clear(st, {x: st.x, y}) && clear({x: st.x, y}, {x: gx, y})) return {path: [st, {x: st.x, y}, {x: gx, y}], y};
        }
      }
      return null;
    };
    const la = lane(tokA), lb = lane(tokB);
    L.guideLanesFree = !!(la && lb);
    if (la && lb) pts = [...la.path, ...lb.path.slice().reverse()];
    else {
      const cx = tokA.pan.x + bA.x + bA.w / 2;
      const a0 = gA({x: bA.x + bA.w / 2, y: bA.y + bA.h + 8}, tokA.pan), b0 = gA({x: bB.x + bB.w / 2, y: bB.y - 16}, tokB.pan);
      const yA = tokA.pan.y + Math.min(tokA.pan.h - 8, bA.y + bA.h + L.P.m * 0.55);
      const yB = tokB.pan.y + Math.max(8, L.P.zF.y - L.P.m * 0.9);
      pts = [a0, {x: cx, y: yA}, {x: gx, y: yA}, {x: gx, y: yB}, {x: cx, y: yB}, b0];
    }
    const midY = tokA.pan.y + tokA.pan.h + L.guideGap / 2;
    labelAt = {x: gx - gw - 12, y: midY - gh / 2};
  }
  const glen = pts.slice(1).reduce((a, q, i) => a + Math.hypot(q.x - pts[i].x, q.y - pts[i].y), 0);
  L.guideLen = glen;
  L.guidePts = pts;
  L.guide = g({name: 'guide', opacity: 0},
    h('path', {name: 'guide-line', d: pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent3, 'stroke-width': 3.4, 'stroke-dasharray': `${r(glen)} ${r(glen + 8)}`, 'stroke-dashoffset': r(glen), 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(pts[0].x), cy: r(pts[0].y), r: 6, fill: th.accent3}),
    h('circle', {name: 'guide-end', cx: r(pts[pts.length - 1].x), cy: r(pts[pts.length - 1].y), r: 6, fill: th.accent3, opacity: 0}),
    gfit ? g({name: 'guide-label', opacity: 0},
      h('path', {d: roundRectPath(labelAt.x, labelAt.y, gw, gh, Math.min(gh / 2, gs * 0.8)), fill: th.card, stroke: th.accent3, 'stroke-width': 2.4}),
      textBlock(gfit, {x: labelAt.x + gw / 2, y: labelAt.y + (gh - gfit.height) / 2, anchor: 'middle', fill: th.ink})) : null);
  L.guideLabelBox = gfit ? {x: labelAt.x, y: labelAt.y, w: gw, h: gh} : null;
  return L;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1400]},
  layout(ctx) {
    const shape = ctx.view.shape;
    const s0 = shape === 'portrait' ? 30 : 28;
    const minS = 16.3 * unitsPer1080px(ctx);
    // wide boxes: maps side by side; tall boxes: stacked; square boxes: side by side or stacked (full width)
    const arrs = shape === 'landscape' ? ['row'] : shape === 'portrait' ? ['col'] : ['row', 'col'];
    // cards that print their own text first (down to the text floor); numbered tiles + the shared legend otherwise
    const search = (textMode, floor) => {
      let first = null;
      for (let s = s0, it = 0; it < 40; it++, s = Math.max(floor, s * 0.97)) {
        for (const arr of arrs) {
          const c = compose(ctx, s, textMode, arr);
          if (c.fits) return c;
          first = first || c;
        }
        if (s <= floor) break;
      }
      return first;
    };
    // supplied text on the cards (down to the 16 px floor) with large maps first; numbered tiles + the shared legend
    // only when the cards cannot hold their text (comfortable size first, then down to the floor)
    const comfy = Math.max(minS, 19.5 * unitsPer1080px(ctx));
    let L = search(true, minS);
    if (!L.fits) L = search(false, comfy);
    if (!L.fits) L = search(false, minS);
    if (!L.fits) {
      // two text tiers (the long-labels stress content in a square box): the primary supplied content (plate,
      // situations, only-change line, A/B labels) stays at the 16 px floor; the secondary notes (issues,
      // assumptions) may go down to 14.5 px and the generic captions never exceed them
      const px = v => v * unitsPer1080px(ctx);
      for (let ns = minS; ns >= px(14.5) - 0.01 && !L.fits; ns = Math.max(px(14.5), ns - px(0.25))) {
        for (const plateInStrip of [false, true]) {
          const tier = {ns, cs: Math.max(px(14.2), Math.min(ns, px(14.6))), plateInStrip};
          for (const arr of arrs) { const c = compose(ctx, minS, false, arr, tier); if (c.fits) { L = c; break; } }
          if (L.fits) break;
        }
        if (ns <= px(14.5)) break;
      }
    }

    // last resort (never expected with the shipped presets): smaller text in tile mode
    for (let s = minS, it = 0; it < 20 && !L.fits; it++) {
      s *= 0.95;
      for (const arr of arrs) { const c = compose(ctx, s, false, arr); if (c.fits) { L = c; break; } }
      if (!L.fits && it === 19) L = compose(ctx, s, false, arrs[arrs.length - 1]);
    }
    // diagnostics: why nothing fitted at the comfortable size (or, below it, at the text floor)
    if (L.s < minS - 0.01) {
      const px = v => v * unitsPer1080px(ctx);
      L.tierInfo = arrs.flatMap(arr => [false, true].map(pis => ({arr, pis, ...compose(ctx, minS, false, arr, {ns: px(14.5), cs: px(14.2), plateInStrip: pis}).fitInfo})));
    }
    if (L.s < comfy - 0.01) L.floorInfo = arrs.flatMap(arr => [true, false].map(tm => ({arr, tm, at: L.s < minS - 0.01 ? 'floor' : 'comfy', ...compose(ctx, L.s < minS - 0.01 ? minS : comfy, tm, arr).fitInfo})));
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    return g(null,
      L.plateArt.node,
      L.headers,
      L.sceneNodes,
      L.guide,
      L.legend,
      L.noteCards.map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const reduced = ctx.reduced;
    const hiP = seg(u, ...W.hi);
    const markP = seg(u, ...W.mark);
    const labP = seg(u, ...W.labels);
    const lay = ease.inOutSine(seg(u, ...W.lay));
    const closed = lay >= 1;
    const looks = [];
    L.scenes.forEach(S => {
      const {pre, tr, lead} = S;
      const drawn = lead + (tr.total - lead) * lay;
      Object.assign(nodes, cordFrame(`${pre}-cord`, tr.d(Math.max(drawn, 0.5))));
      const at = tr.at(drawn);
      const reelR = clamp(L.P.tokW * 0.13, 11, 20);
      nodes[`${pre}-reel`] = {transform: T(at.x, at.y)};
      nodes[`${pre}-reelA-spokes`] = {transform: `rotate(${r(((drawn - lead) / reelR) * 57.2958 % 360, 2)})`};
      nodes[`${pre}-mark`] = {opacity: r(ease.inOutSine(markP), 3)};
      // the base highlight (identical on both maps) hands over to the change marker
      nodes[`${pre}-hi`] = {opacity: r(hiP * (1 - markP), 3)};
      if (ctx.show('key')) nodes[`${pre}-label`] = {opacity: r(labP, 3)};
      const flags = [], rings = [];
      S.cards.forEach((c, j) => {
        if (c.scope === 'included') {
          const e = closed ? seg(u, W.flags[0] + j * 0.004, W.flags[1] + j * 0.004) : 0;
          const e2 = e > 0 ? (reduced ? ease.outCubic(e) : ease.outBack(e)) : 0;
          nodes[`${pre}-flag${c.i}`] = {opacity: e > 0 ? 1 : 0};
          nodes[`${pre}-flagS${c.i}`] = {transform: `scale(${r(Math.max(0.001, e2), 3)})`};
          flags.push(r(e, 3));
          rings.push(0);
        } else {
          const e = closed ? seg(u, W.rings[0] + j * 0.004, W.rings[1] + j * 0.004) : 0;
          nodes[`${pre}-ring${c.i}`] = {opacity: r(e, 3)};
          rings.push(r(e, 3));
          flags.push(0);
        }
      });
      // scene "look" relative to its own panel (compared between A and B before the change beat)
      looks.push({
        tokens: S.cards.map(c => [r(c.box.x), r(c.box.y), r(c.box.rot || 0)]),
        flags, rings,
        mark: r(markP, 3),
        markKind: markP > 0 ? S.scope : null,
        label: r(labP, 3),
        hi: r(hiP * (1 - markP), 3),
        cordDrawn: r(drawn, 2),
        reel: [r(at.x), r(at.y)],
      });
    });
    nodes.guide = {opacity: seg(u, ...W.guide) > 0 ? 1 : 0};
    nodes['guide-line'] = {'stroke-dashoffset': r(L.guideLen * (1 - ease.inOutCubic(seg(u, ...W.guide))))};
    nodes['guide-end'] = {opacity: seg(u, ...W.guide) >= 1 ? 1 : 0};
    if (L.guideLabelBox) nodes['guide-label'] = {opacity: r(seg(u, ...W.guideLabel), 3)};
    if (L.legend) nodes['leg-hi'] = {opacity: r(hiP, 3)};
    L.noteCards.forEach(c => {
      if (!c.lateOnly) nodes[`notesS${c.ci}`] = {opacity: r(seg(u, ...W.staticNotes), 3)};
      if (c.dyn) nodes[`notesD${c.ci}`] = {opacity: r(seg(u, ...W.dynNotes), 3)};
    });

    const [A, B] = L.scenes;
    const insideOf = S => S.cards.map(c => inside({x: c.box.x + c.box.w / 2, y: c.box.y + c.box.h / 2}, S.cp.loop));
    const clearOf = S => S.cards.every(c => S.cp.loop.every(q => distToBox(q, boxBounds(c.box)) > L.P.m * 0.55));
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      textSize: r(L.s, 2),
      textMode: L.textMode,
      arrangement: L.col ? 'column' : 'row',
      scenes: 2,
      changed: L.changed,
      scopeA: A.scope,
      scopeB: B.scope,
      lookA: looks[0],
      lookB: looks[1],
      differingSituations: A.cards.filter((c, j) => c.scope !== B.cards[j].scope).map(c => c.i),
      insideA: insideOf(A),
      insideB: insideOf(B),
      scopesA: A.cards.map(c => c.scope),
      scopesB: B.cards.map(c => c.scope),
      loopLenA: r(A.tr.total, 1),
      loopLenB: r(B.tr.total, 1),
      clearA: clearOf(A),
      clearB: clearOf(B),
      laid: r(lay, 4),
      closed,
      labelsShown: r(labP, 3),
      marks: r(markP, 3),
      arrangementFits: L.fitInfo,
      mapFrac: r(L.mapFrac, 3),
      panelW: r(L.panels[0].w / ctx.design.w, 3),
      tiles: !L.textMode,
      // on a numbered tile the pennant stays clear of the number disc
      pennantsClearOfDiscs: L.P.cards.every(c => {
        const q = c.geo;
        if (!q.tile) return true;
        const br = Math.max(q.head * 0.34, (q.ks ?? 0) * 0.8);
        return q.w - q.pad * 0.7 - q.head * 0.8 * (q.flagK ?? 1) >= q.pad + 2 * br + 2;
      }),
      // the changed-detail guide passes no card other than the changed one (in either map)
      guideClear: L.scenes.every(S => S.cards.filter(c => c.i !== L.changed).every(c => {
        const o = boxBounds(c.box);
        const bx = {x: S.pan.x + o.x - 18, y: S.pan.y + o.y - 18, w: o.w + 36, h: o.h + 36};
        return L.guidePts.slice(1).every((q, k) => {
          const p0 = L.guidePts[k];
          for (let j = 0; j <= 20; j++) {
            const x = p0.x + ((q.x - p0.x) * j) / 20, y = p0.y + ((q.y - p0.y) * j) / 20;
            if (x > bx.x && x < bx.x + bx.w && y > bx.y && y < bx.y + bx.h) return false;
          }
          return true;
        });
      })),
      tier: L.tier ? {ns: r(L.tier.ns / unitsPer1080px(ctx), 2), cs: r(L.tier.cs / unitsPer1080px(ctx), 2), plateInStrip: L.tier.plateInStrip} : null,
      guide: r(seg(u, ...W.guide), 3),
      notesStatic: r(seg(u, ...W.staticNotes), 3),
      notesDyn: r(seg(u, ...W.dynNotes), 3),
      reelA: {x: r(A.pan.x + looks[0].reel[0]), y: r(A.pan.y + looks[0].reel[1])},
      reelB: {x: r(B.pan.x + looks[1].reel[0]), y: r(B.pan.y + looks[1].reel[1])},
      fits: L.fits,
      floorInfo: L.floorInfo || null,
      tierInfo: L.tierInfo || null,
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-10-contrast',
    title: 'Limit of a conclusion — the same map with one situation supplied as covered vs not examined',
    titleEs: 'Límite de una conclusión — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Límite de una conclusión',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical survey maps with the same situations; one shared proposition plate and notes. A frame marks the one changed situation: solid (supplied as covered) in A, dashed (supplied as not examined) in B. Brass reels then lay each cord in parallel — in A the loop takes that situation in, in B it passes it by — and pennants and dashed rings follow. A guide joins the changed detail; no winner, score or conclusion.',
    tags: ['reasoning', 'proposition', 'scope', 'limit', 'contrast', 'paired', 'cord', 'map', 'not examined', 'covered'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/limite-de-una-conclusion.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
