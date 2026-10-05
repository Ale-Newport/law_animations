/**
 * LAW-0135 — Ámbito temporal · contrast
 *
 * Storyboard (two complete compact desks, side by side on wide boxes,
 * stacked on tall ones; the same article, the same supplied interval and the
 * same other facts in both — only ONE supplied fact differs: the day on which
 * the changed fact happened):
 *  0.00–0.17  base: both desks are identical — open source book with the
 *             article card, timeline ruler, the other fact cards pinned at
 *             their days; each reader holds the changed fact card at the same
 *             spot, not yet placed.
 *  0.17–0.40  change: each reader lays the held card in its slot and pins it —
 *             A at a day inside the supplied interval, B at a day beyond it.
 *             The pin lands at a different place on the ruler (geometry, not
 *             only a label); a "changed fact" ring marks the card in both.
 *  0.40–0.77  the same action runs in parallel: each reader takes the article
 *             card from the book, sets it against the ruler at the supplied
 *             start day and pulls its tape to the supplied end day; pins turn
 *             as the clip passes them. In A the changed fact ends under the
 *             tape; in B it stays beyond it.
 *  0.77–1.00  a comparison guide joins the changed card in A and in B through
 *             the free margin and names the changed fact; a neutral note says
 *             that nothing else differs and that no legal effect is stated.
 *             No winner, score or outcome.
 * @module animations/sources/LAW-0135
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields, int, obj, str} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {scopeFields, SCOPE_DEFAULTS, SCOPE_STRINGS, scopeData, scopePanel, PANEL, fitWords, stateColors} from './kits/ambito-temporal.js';

const ID = 'LAW-0135';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  place: [0.19, 0.33], pin: [0.33, 0.39], header: [0.33, 0.38], ring: [0.3, 0.38], toCard: [0.41, 0.47], carry: [0.47, 0.58], toTab: [0.58, 0.62], pull: [0.62, 0.72],
  classifyRest: [0.72, 0.745], strips: [0.735, 0.77], back: [0.72, 0.78], guide: [0.78, 0.88], guideChip: [0.84, 0.9], shared: [0.2, 0.26], sharedOut: [0.74, 0.77], neutral: [0.86, 0.92],
};

const sceneSchema = {
  ...scopeFields,
  ...contrastFields(),
  changed: obj('The single changed fact: which fact, and its supplied day in scenario A and in scenario B (fictional days)', {
    fact: int('Index of the changed fact in `facts`', 0, 4),
    dayA: int('Supplied day of the changed fact in scenario A', -99, 1000),
    dayB: int('Supplied day of the changed fact in scenario B', -99, 1000),
  }, ['fact', 'dayA', 'dayB']),
  reader: obj('Reader shown at both desks (same person, same gestures)', {name: str('Name (fictional)', 60)}),
};

const defaultParams = {
  ...SCOPE_DEFAULTS,
  facts: [
    {label: 'Notice sent', day: 3, icon: 'envelope', state: 'auto'},
    {label: 'Keys handed over', day: 10, icon: 'key', state: 'auto'},
    {label: 'Invoice issued', day: 18, icon: 'invoice', state: 'auto'},
  ],
  changed: {fact: 1, dayA: 10, dayB: 15},
  reader: {name: 'Rin Park'},
  scenarioA: {label: 'Fact inside', caption: 'Keys handed over on Day 10'},
  scenarioB: {label: 'Outside the supplied interval', caption: 'Keys handed over on Day 15'},
  changedFact: 'Day on which the keys were handed over',
  sharedFacts: ['Same article and interval (Day 5 – Day 13)', 'Same other facts', 'Same gestures and timing'],
  comparisonLabels: {guide: 'Changed fact', neutral: 'Only this supplied day differs. No legal effect or outcome is stated.'},
};

const STRINGS = {
  en: {...SCOPE_STRINGS.en, same: 'Same', changedMark: 'Changed'},
  es: {...SCOPE_STRINGS.es, same: 'Igual', changedMark: 'Cambiado'},
};

/**
 * Arrangement per shape: panel orientation, arrangement and the design
 * space (proportions of the caption-safe box).
 */
const ARR = {
  // (footer: guide chip / notes, then the shared article strip — `strip` units reserved at its bottom)
  landscape: {orient: 'h', arrangement: 'row', header: 100, gap: 70, footer: 184, strip: 48, margin: 0, hdr: {label: 31, cap: 25, min: 22}},
  square: {orient: 'v', arrangement: 'row', header: 94, gap: 40, footer: 164, strip: 48, margin: 0, hdr: {label: 30, cap: 28, min: 27}},
  // (portrait: tight vertical spacing, so the stacked lanes are wide enough for ~20 px facts)
  portrait: {orient: 'h', arrangement: 'column', header: 94, gap: 44, footer: 200, strip: 50, margin: 20, hdr: {label: 32, cap: 27, min: 24}},
};

/**
 * Scenario header: letter badge (always visible, identical style in A and B) plus the scenario label and
 * caption. The label and caption name the changed fact, so they are a separate group revealed only when
 * the changed card lands (`${name}-txt`). Key text is sized for mobile viewing (≥ ~20 px at 1080p).
 */
function lanesHeader(ctx, o) {
  const th = ctx.theme;
  const R = 22;
  const cx = o.x + R + 2, cy = o.y + Math.min(o.h / 2, 34);
  const tx = o.x + R * 2 + 18;
  const maxW = o.w - (tx - o.x) - 6;
  const H = o.h - 6;
  const S = o.sizes;
  // (the glyph boxes of two stacked lines stay apart: a gap of about a third of the caption size)
  const GAP = f => Math.round(f.size * 0.36) + 2;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  // label ≤ 2 lines, caption ≤ 2 lines; both shrink together (never below `min`) until they fit the height
  let lf = null, cf = null;
  for (let k = 1; k >= 0.5; k -= 0.03) {
    const ls = Math.max(S.min, S.label * k), cs = Math.max(S.min, S.cap * k);
    lf = showKey ? fitWords(ctx, o.label, {maxWidth: maxW, size: ls, minSize: ls, floorSize: ls, maxLines: 2, weight: 700}) : null;
    cf = showAll && o.caption ? fitWords(ctx, o.caption, {maxWidth: maxW, size: cs, minSize: cs, floorSize: cs, maxLines: 2, weight: 500}) : null;
    const hh = (lf ? lf.height : 0) + (lf && cf ? GAP(cf) : 0) + (cf ? cf.height : 0);
    if (hh <= H && !(lf && lf.truncated) && !(cf && cf.truncated)) break;
    if (ls === S.min && cs === S.min) break;
  }
  const hh = (lf ? lf.height : 0) + (lf && cf ? GAP(cf) : 0) + (cf ? cf.height : 0);
  const y0 = o.y + Math.max(0, (o.h - hh) / 2);
  return {
    node: g({name: o.name},
      h('circle', {cx, cy, r: R, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
      showKey ? (() => { const lf2 = ctx.fit(o.letter, {maxWidth: 40, size: Math.min(28, S.label), minSize: Math.min(20, S.label), maxLines: 1, weight: 800}); return textBlock(lf2, {x: cx, y: cy - lf2.size * 0.5, anchor: 'middle', fill: '#fff'}); })() : null,
      g({name: `${o.name}-txt`, opacity: 0},
        lf ? textBlock(lf, {x: tx, y: y0, fill: th.fg}) : null,
        cf ? textBlock(cf, {x: tx, y: y0 + (lf ? lf.height + GAP(cf) : 0), fill: th.fgSoft}) : null)),
    sizes: {label: lf ? lf.size : null, caption: cf ? cf.size : null},
  };
}

function panelOrigins(A, P) {
  if (A.arrangement === 'row') {
    const w = P.w * 2 + A.gap;
    const hh = A.header + P.h + A.footer;
    return {w, h: hh, panels: [{x: 0, y: A.header}, {x: P.w + A.gap, y: A.header}], headers: [{x: 0, y: 0}, {x: P.w + A.gap, y: 0}]};
  }
  const w = P.w + A.margin;
  const hh = (A.header + P.h) * 2 + A.gap + A.footer;
  return {w, h: hh, panels: [{x: 0, y: A.header}, {x: 0, y: A.header * 2 + P.h + A.gap}], headers: [{x: 0, y: 0}, {x: 0, y: A.header + P.h + A.gap}]};
}

/** Does segment a→b, clipped to `clip`, pass within `pad` of box b? (sampled, Euclidean distance) */
function segHits(a, q, box, pad, clip) {
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const x = a.x + (q.x - a.x) * (i / n), y = a.y + (q.y - a.y) * (i / n);
    if (x < clip.x || x > clip.x + clip.w || y < clip.y || y > clip.y + clip.h) continue;
    // true distance from the sampled arm axis point to the card (the sleeve is `pad` wide on each side)
    if (Math.hypot(Math.max(box.x - x, 0, x - box.x - box.w), Math.max(box.y - y, 0, y - box.y - box.h)) < pad) return true;
  }
  return false;
}

/** Inverse of ease.inOutCubic. */
function invInOutCubic(y) {
  const v = clamp(y);
  return v < 0.5 ? Math.cbrt(v / 4) : 1 - Math.cbrt(2 * (1 - v)) / 2;
}

const scene = {
  sizes: {
    landscape: [PANEL.h.w * 2 + ARR.landscape.gap, ARR.landscape.header + PANEL.h.h + ARR.landscape.footer],
    square: [PANEL.v.w * 2 + ARR.square.gap, ARR.square.header + PANEL.v.h + ARR.square.footer],
    portrait: [PANEL.h.w + ARR.portrait.margin, (ARR.portrait.header + PANEL.h.h) * 2 + ARR.portrait.gap + ARR.portrait.footer],
  },
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const C = stateColors(ctx);
    const A = ARR[ctx.view.shape];
    const PG = PANEL[A.orient];
    const O = panelOrigins(A, PG);
    const S = {w: O.w, h: O.h};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const d = scopeData(p);
    const ci = Math.max(0, Math.min(d.facts.length - 1, p.changed.fact));
    const changed = {index: ci, dayA: p.changed.dayA, dayB: p.changed.dayB};
    const reader = {name: p.reader && p.reader.name};
    const pa = scopePanel(ctx, {prefix: 'pa', orient: A.orient, d, changed, which: 'A', reader, intervalLabel: t.suppliedInterval});
    const pb = scopePanel(ctx, {prefix: 'pb', orient: A.orient, d, changed, which: 'B', reader, intervalLabel: t.suppliedInterval});
    // text hierarchy: the fact cards carry the key content, so no generic text (scenario headers, guide
    // chip, notes) is ever set larger than the smallest fact text actually used in the panels
    const factSize = Math.min(...[pa.factSize, pb.factSize].filter(Boolean), 99);
    const capAt = v => Math.min(v, factSize);
    // (header text shrinks, only when it must, down to the ~16 px floor, so it always stays inside its band)
    const pxu0 = s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
    const hdrSizes = {label: capAt(A.hdr.label), cap: capAt(A.hdr.cap), min: Math.min(capAt(A.hdr.min), 16.4 / pxu0)};
    const hdrH = A.header - 12;
    const hdr = [
      lanesHeader(ctx, {name: 'hdr-a', letter: 'A', label: p.scenarioA.label, caption: p.scenarioA.caption, x: O.headers[0].x + 4, y: O.headers[0].y + 2, w: PG.w - 8, h: hdrH, color: th.accent2, sizes: hdrSizes}),
      lanesHeader(ctx, {name: 'hdr-b', letter: 'B', label: p.scenarioB.label, caption: p.scenarioB.caption, x: O.headers[1].x + 4, y: O.headers[1].y + 2, w: PG.w - 8, h: hdrH, color: th.inkSoft, sizes: hdrSizes}),
    ];
    const headers = hdr.map(x => x.node);
    const headerSizes = hdr.map(x => x.sizes);

    // ---- comparison guide: a U-shaped path through free space joining the two changed cards
    const worldBox = (b, k) => ({x: b.x + O.panels[k].x, y: b.y + O.panels[k].y, w: b.w, h: b.h});
    const cA = worldBox(pa.changedBox, 0), cB = worldBox(pb.changedBox, 1);
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const guideText = `${p.comparisonLabels.guide}: ${p.changedFact}`;
    // (footer captions never exceed the header text actually drawn either — it is supplied content)
    const hdrDrawn = headerSizes.flatMap(z => [z.label, z.caption]).filter(Boolean);
    const capFoot = v => Math.min(capAt(v), ...hdrDrawn, 99);
    // ---- footer, laid out from MEASURED block heights (guide chip, neutral note, shared-facts pill, passage
    // strip): stacked when everything fits, else note and chip side by side (wide boxes); captions may shrink
    // to the ~16 px floor; the passage strip (content) stays at least as large as the captions
    const pxu = s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
    const floorSz = 16.4 / pxu;
    const art = d.article;
    const stripText = showAll && art.text ? `${art.ref}: ${art.text}` : null;
    const sharedText = p.sharedFacts.length ? `${t.same}: ${p.sharedFacts.join(' · ')}` : '';
    const footTop = S.h - A.footer + 6;
    const footAvail = S.h - 4 - footTop;
    const GAP = 8;
    const fitCap = (text, mw, size, lines, weight = 500) => fitWords(ctx, text, {maxWidth: mw, size, minSize: size, floorSize: size, maxLines: lines, weight});
    const plan = (() => {
      const g0 = capFoot(A.orient === 'v' ? 23 : 24), n0 = capFoot(22);
      const sizes = [];
      for (let k = 1; k >= 0.6; k -= 0.05) sizes.push(k);
      const ratios = A.arrangement === 'row' ? [null, 0.5, 0.55, 0.6] : [null];
      let last = null;
      for (const k of sizes) {
        const gs = Math.max(floorSz, g0 * k), ns = Math.max(floorSz, n0 * k);
        const ss = Math.max(floorSz, gs, ns, Math.min(24, factSize) * Math.max(k, 0.85));
        const strip = stripText ? fitWords(ctx, stripText, {maxWidth: S.w - 80, size: ss, minSize: Math.max(floorSz, gs, ns), floorSize: Math.max(floorSz, gs, ns), maxLines: 3, weight: 500, family: 'serif'}) : null;
        const sH = strip ? strip.height + 14 : 0;
        const sh = showAll && sharedText ? fitCap(sharedText, S.w - 70, ns, 3) : null;
        const shH = sh ? sh.height + 16 : 0;
        for (const ratio of ratios) {
          let gf, nf, row1, gW2, nWmax;
          if (ratio === null) {
            gf = showKey ? fitCap(guideText, Math.min(S.w - 40, 800) - 34, gs, 3, 700) : null;
            nf = showAll ? fitCap(p.comparisonLabels.neutral, S.w - 70, ns, 3) : null;
            row1 = (gf ? gf.height + 18 : 36) + GAP + (nf ? nf.height + 16 : 0);
          } else {
            gW2 = S.w * (1 - ratio) - 30; nWmax = S.w * ratio - 30;
            gf = showKey ? fitCap(guideText, gW2 - 34, gs, 4, 700) : null;
            nf = showAll ? fitCap(p.comparisonLabels.neutral, nWmax - 30, ns, 5) : null;
            row1 = Math.max(gf ? gf.height + 18 : 36, nf ? nf.height + 16 : 0);
          }
          const blockH = Math.max(row1, shH);
          const total = blockH + (sH ? GAP + sH : 0);
          const cand = {k, ratio, gf, nf, sh, strip, row1, blockH, sH, total, ss: strip ? strip.size : null};
          last = cand;
          if (total <= footAvail && !(gf && gf.truncated) && !(nf && nf.truncated) && !(sh && sh.truncated) && !(strip && strip.truncated)) return cand;
        }
      }
      return last;
    })();
    const sideNotes = plan.ratio !== null;
    const gFit = plan.gf;
    const gW = gFit ? gFit.width + 34 : 0, gH = gFit ? gFit.height + 18 : 36;
    // the guide's horizontal run goes through the chip's middle
    const footY = footTop + (sideNotes ? plan.row1 / 2 : gH / 2);
    let guideD;
    let chipAt;
    if (A.arrangement === 'row' && A.orient === 'h') {
      // down from each card's bottom into the footer, then across
      const ya = cA.y + cA.h + 6, yb = cB.y + cB.h + 6;
      const xa = cA.x + cA.w / 2, xb = cB.x + cB.w / 2;
      guideD = `M${r(xa)} ${r(ya)}V${r(footY)}H${r(xb)}V${r(yb)}`;
      chipAt = {x: (xa + xb) / 2, y: footY};
    } else if (A.arrangement === 'row') {
      // vertical panels: from each card's right edge along its panel's right margin, down to the footer
      const pr = k => O.panels[k].x + PG.w - 12;
      const ya = cA.y + cA.h / 2, yb = cB.y + cB.h / 2;
      guideD = `M${r(cA.x + cA.w + 4)} ${r(ya)}H${r(pr(0))}V${r(footY)}H${r(pr(1))}V${r(yb)}H${r(cB.x + cB.w + 4)}`;
      chipAt = {x: (pr(0) + pr(1)) / 2, y: footY};
    } else {
      // stacked: from A's card bottom into the gap, along the right margin, into the footer and up to B's card
      const gapY = O.panels[0].y + PG.h + 18;
      const mx = PG.w + A.margin / 2;
      const xa = cA.x + cA.w / 2, xb = cB.x + cB.w / 2;
      guideD = `M${r(xa)} ${r(cA.y + cA.h + 6)}V${r(gapY)}H${r(mx)}V${r(footY)}H${r(xb)}V${r(cB.y + cB.h + 6)}`;
      chipAt = {x: (xb + mx) / 2, y: footY};
    }
    const gx = sideNotes ? clamp(S.w * plan.ratio + (S.w * (1 - plan.ratio)) / 2 - gW / 2, S.w * plan.ratio + 10, S.w - gW - 10) : clamp(chipAt.x - gW / 2, 10, S.w - gW - 10);
    const guideNode = g({name: 'guide', opacity: 0},
      h('path', {name: 'guide-path', d: guideD, fill: 'none', stroke: C.unclassified, 'stroke-width': 4, 'stroke-dasharray': '10 8', 'stroke-linejoin': 'round'}),
      gFit ? g({name: 'guide-chip', opacity: 0},
        h('path', {d: roundRectPath(gx, chipAt.y - gH / 2, gW, gH, Math.min(gH / 2, 18)), fill: th.card, stroke: C.unclassified, 'stroke-width': 3}),
        textBlock(gFit, {x: gx + gW / 2, y: chipAt.y - gH / 2 + 9, anchor: 'middle', fill: th.ink})) : null,
    );
    // rings around the changed card in both panels (same shape, appear with the change beat)
    const ring = (b, name) => h('path', {name, d: roundRectPath(b.x - 9, b.y - 9, b.w + 18, b.h + 18, 16), fill: 'none', stroke: C.unclassified, 'stroke-width': 4, opacity: 0});
    const rings = [ring(cA, 'ring-a'), ring(cB, 'ring-b')];

    // ---- footer notes: shared facts during the parallel beat, then the neutral note (never at the same time)
    const pill = (f, name, y, cx = S.w / 2) => {
      const w = f.width + 30, hh = f.height + 16;
      return g({name, opacity: 0},
        h('path', {d: roundRectPath(cx - w / 2, y, w, hh, Math.min(hh / 2, 18)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
        textBlock(f, {x: cx, y: y + 8, anchor: 'middle', fill: th.fg}));
    };
    const shFit = plan.sh, nFit = plan.nf;
    const sharedNode = shFit ? pill(shFit, 'shared', footTop + (plan.blockH - (shFit.height + 16)) / 2) : null;
    const neutralNode = nFit ? (sideNotes
      ? pill(nFit, 'neutral', footTop + (plan.row1 - (nFit.height + 16)) / 2, (S.w * plan.ratio) / 2 + 5)
      : pill(nFit, 'neutral', footTop + gH + GAP)) : null;

    // ---- the article's supplied wording, identical in both scenes: drawn ONCE, as text, in a shared strip
    // under the notes (the cards in the lanes carry filler lines). Visible throughout: it reveals nothing of the
    // changed fact. ≥ ~16 px and never smaller than the captions around it.
    let stripNode = null, stripSize = null;
    if (plan.strip) {
      const f = plan.strip;
      stripSize = f.size;
      const w = f.width + 40, hh = f.height + 14;
      const y = footTop + plan.blockH + GAP;
      stripNode = g({name: 'passage-strip'},
        h('path', {d: roundRectPath(S.w / 2 - w / 2, y, w, hh, 8), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 1.6}),
        h('path', {d: `M${r(S.w / 2 - w / 2 + 12)} ${r(y + 7)}V${r(y + hh - 7)}`, stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round'}),
        textBlock(f, {x: S.w / 2 + 6, y: y + 7, anchor: 'middle', fill: th.ink, italic: true}));
    }

    // moments at which the tape clip reaches each inside pin (identical in both panels except the changed fact)
    const times = panel => panel.facts.map(f => {
      if (f.state !== 'inside' || panel.endA <= panel.startA) return null;
      const frac = (panel.geo.along(f.day) - panel.startA) / (panel.endA - panel.startA);
      return lerp(W.pull[0], W.pull[1], invInOutCubic(frac));
    });
    return {S, s, ox, oy, O, A, PG, pa, pb, headers, headerSizes, factSize, captionSizes: [gFit && gFit.size, shFit && shFit.size, nFit && nFit.size].filter(Boolean), guideNode, rings, sharedNode, neutralNode, stripNode, stripSize, tA: times(pa), tB: times(pb), d, ci};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      g({transform: T(L.O.panels[0].x, L.O.panels[0].y)}, L.pa.node),
      g({transform: T(L.O.panels[1].x, L.O.panels[1].y)}, L.pb.node),
      L.rings,
      L.sharedNode,
      L.guideNode,
      L.neutralNode,
      L.stripNode,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const v = times => ({
      place: seg(u, ...W.place), pin: seg(u, ...W.pin), toCard: seg(u, ...W.toCard), carry: seg(u, ...W.carry), toTab: seg(u, ...W.toTab),
      pull: seg(u, ...W.pull), back: seg(u, ...W.back),
      classify: times.map(ti => (ti === null ? seg(u, ...W.classifyRest) : seg(u, ti, ti + 0.012))),
      strips: times.map(ti => (ti === null ? seg(u, ...W.strips) : seg(u, ti + 0.015, ti + 0.05))),
    });
    const a = L.pa.pose(v(L.tA));
    const b = L.pb.pose(v(L.tB));
    Object.assign(nodes, a.nodes, b.nodes);
    // the scenario labels / captions name the changed fact: they appear only when the changed card lands
    const hdrP = r(seg(u, ...W.header), 3);
    nodes['hdr-a-txt'] = {opacity: hdrP};
    nodes['hdr-b-txt'] = {opacity: hdrP};
    const ringP = seg(u, ...W.ring);
    nodes['ring-a'] = {opacity: r(ringP, 3)};
    nodes['ring-b'] = {opacity: r(ringP, 3)};
    const gp = seg(u, ...W.guide);
    nodes.guide = {opacity: gp > 0 ? 1 : 0};
    nodes['guide-path'] = {'stroke-dasharray': gp >= 1 ? '10 8' : `${r(gp * 3000)} 4000`};
    if (L.guideNode.children.length > 1) nodes['guide-chip'] = {opacity: r(seg(u, ...W.guideChip), 3)};
    if (L.sharedNode) nodes.shared = {opacity: r(seg(u, ...W.shared) * (1 - seg(u, ...W.sharedOut)), 3)};
    if (L.neutralNode) nodes.neutral = {opacity: r(seg(u, ...W.neutral), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const toWorld = (q, k) => ({x: r(q.x + L.O.panels[k].x), y: r(q.y + L.O.panels[k].y)});
    return {
      nodes,
      semantic: {
        beat,
        a: {holder: a.semantic.cardHolder, changed: a.semantic.changedHolder, day: a.semantic.changedDay, state: a.semantic.changedState, tape: a.semantic.tapeProgress, states: a.semantic.factStates},
        b: {holder: b.semantic.cardHolder, changed: b.semantic.changedHolder, day: b.semantic.changedDay, state: b.semantic.changedState, tape: b.semantic.tapeProgress, states: b.semantic.factStates},
        sameOtherSlots: JSON.stringify(a.semantic.otherSlots) === JSON.stringify(b.semantic.otherSlots),
        sameCard: JSON.stringify(a.semantic.card) === JSON.stringify(b.semantic.card),
        changedCardA: toWorld(a.semantic.changedCard, 0),
        changedCardB: toWorld(b.semantic.changedCard, 1),
        handA: toWorld(a.semantic.hand, 0),
        handB: toWorld(b.semantic.hand, 1),
        gripA: toWorld(u < W.toCard[0] ? a.semantic.factGrip : a.semantic.cardGrip, 0),
        gripB: toWorld(u < W.toCard[0] ? b.semantic.factGrip : b.semantic.cardGrip, 1),
        tapeEndA: toWorld(a.semantic.tapeEnd, 0),
        cardA: toWorld(a.semantic.card, 0),
        cardB: toWorld(b.semantic.card, 1),
        guideProgress: r(gp, 3),
        changedIndex: L.ci,
        allReached: a.semantic.reached && b.semantic.reached,
        headerText: hdrP,
        // rendered size (frame px) of the header texts (key text sized for mobile viewing)
        headerPx: (() => {
          const fk = L.s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
          return L.headerSizes.map(z => ({label: z.label && r(z.label * fk, 1), caption: z.caption && r(z.caption * fk, 1)}));
        })(),
        // smallest key-content text on the fact cards and the largest generic caption (header, guide, notes), px
        textPx: (() => {
          const fk = L.s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
          const caps = [...L.captionSizes, ...L.headerSizes.flatMap(z => [z.label, z.caption])].filter(Boolean);
          return {fact: L.factSize < 99 ? r(L.factSize * fk, 1) : null, maxCaption: caps.length ? r(Math.max(...caps) * fk, 1) : null, factDesign: L.factSize, k: r(fk, 3)};
        })(),
        arms: [[a, 0, L.pa], [b, 1, L.pb]].map(([x, k, pn]) => {
          // arm segments clipped to the panel, tested against every fact card (pad = half the sleeve width)
          const hw = x.semantic.armHalfWidth;
          const panel = {x: 0, y: 0, w: pn.W, h: pn.H};
          const hits = pn.factBoxes.map((fb, i) => (x.semantic.armSegs.some(sg => segHits(sg.a, sg.b, fb, hw, panel)) ? i : -1)).filter(i => i >= 0);
          const el = x.semantic.elbow;
          const inPanel = el.x >= 0 && el.x <= pn.W && el.y >= 0 && el.y <= pn.H;
          const g0 = pn.geo;
          // an elbow on stage never goes beyond the ruler to the fact side, and never lies over a fact card
          const elbowOk = !inPanel || ((g0.hor ? el.y <= g0.e1 : el.x <= g0.e1) && !pn.factBoxes.some(fb => el.x >= fb.x - hw && el.x <= fb.x + fb.w + hw && el.y >= fb.y - hw && el.y <= fb.y + fb.h + hw));
          const hd = x.semantic.hand;
          // where the hand works: on the card side of the ruler (article, ruler, tape) or in the fact row
          const handSide = (g0.hor ? hd.y <= g0.e1 : hd.x <= g0.e1) ? 'card' : 'facts';
          // once the article card lies on the ruler, the arm (shoulder → wrist) never crosses it
          const cb = pn.cardDestBox;
          const armOnArticle = x.semantic.cardHolder === 'ruler' && x.semantic.armSegs.slice(0, 2).some(sg => segHits(sg.a, sg.b, {x: cb.x + 4, y: cb.y + 4, w: cb.w - 8, h: cb.h - 8}, hw, panel));
          return {elbow: toWorld(el, k), elbowInPanel: inPanel, elbowOk, armOnFacts: hits, handSide, armOnArticle};
        }),
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
    slug: 'sources-04-contrast',
    title: 'Temporal scope — a fact inside vs outside the supplied interval',
    titleEs: 'Ámbito temporal — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito temporal',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical compact desks: a reader pins the one changed fact at a different supplied day (A inside, B beyond the supplied interval), then in parallel lays the article card on the ruler and pulls its tape over the same supplied interval. A guide joins the two changed cards; a neutral note states that nothing else differs and that no legal effect is stated.',
    tags: ['sources', 'temporal scope', 'interval', 'comparison', 'timeline', 'facts', 'paired', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-temporal.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
