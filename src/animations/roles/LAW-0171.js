/**
 * LAW-0171 — Declaración de testigo · contrast
 *
 * Storyboard (two complete, equally scaled statement tables; side by side on
 * wide frames, stacked on tall ones, whichever gives larger people on square):
 *  0.00–0.17  base: the same situation twice — the witness seated at the
 *             table, the clerk behind it with a pad of blank cards, an empty
 *             rail slot, and top-left a vignette of "what happened" (a neutral
 *             gate-and-van pictogram); an empty lane behind the witness.
 *  0.17–0.40  the change, physical: A (direct observation): an eye badge
 *             appears just above the witness's head and a solid line of sight
 *             is drawn from what happened to it. B (information received): the
 *             neighbour STEPS IN behind the witness (she fades in whole at her
 *             place, never cut by the panel's edge); her line of
 *             sight goes to what happened, then a "told" arrow runs from her
 *             mouth to the witness (speech badge). The route to what happened
 *             is direct in A and passes through another person in B — with
 *             labels hidden, B has one more person in it.
 *  0.42–0.77  in parallel both witnesses say the SAME statement (same bubble
 *             text, filling in on the top card as it is said), both clerks
 *             write the card's stated-source label and set it in the rail.
 *             Only the label differs (eye tag vs told tag, plus "from: …").
 *  0.77–1.00  a comparison guide rings the two source tags and the two route
 *             badges; side by side, dotted leaders run down the free corridor
 *             under each card into the guide chip (on tall frames the chip
 *             sits between the scenes); a neutral note and the key "as
 *             supplied · no conclusion drawn". No winner, score, credibility
 *             or weight is shown.
 * @module animations/roles/LAW-0171
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf, party, RELATION_KINDS} from '../../schemas/fields.js';
import {actorLook} from '../../primitives/people-style.js';
import {LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  WITNESS_DEFAULTS, WITNESS_STRINGS, captionOf, fitCards, fitQuote, stageGeometry, witnessStage,
  recountScript, recountClock, sourceGlyph, sourceColor, eventIcon, fitWords, wchip,
} from './kits/declaracion-de-testigo.js';
import {personRig} from '../../primitives/person.js';

const ID = 'LAW-0171';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const CHANGE = {head: [0.17, 0.21], eye: [0.2, 0.25], sight: [0.25, 0.36], nb: [0.19, 0.29], nbLink: [0.29, 0.34], told: [0.34, 0.4]};
/** Recount (kit recountClock): the statement is said from ACT[0], the card is set and the hands rest by ACT[1]. */
const ACT = [0.42, 0.77];
const GUIDE = [0.77, 0.86];

const STRINGS = {
  en: {...WITNESS_STRINGS.en, same: 'Same in both'},
  es: {...WITNESS_STRINGS.es, same: 'Igual en ambos'},
};

const PARTS = ['event', 'informant', 'witness'];
const sceneSchema = {
  actors: list('The witness, the clerk and the person the witness says they heard from in B, in this order (fictional people)', party, 3, 3),
  roles: obj('Descriptive role captions (never a finding about credibility or reliability)', {
    witness: str('Role caption for the person giving the statement', 40),
    clerk: str('Role caption for the person writing the card', 40),
    informant: str('Role caption for the person the witness says they heard from (scenario B)', 40),
  }),
  relationships: list('How what happened reaches the witness in each scenario; the kind sets the line style (A: event → witness; B: event → informant → witness)', obj('Link', {
    from: oneOf('From', PARTS), to: oneOf('To', PARTS),
    kind: oneOf('relation | communication | sequence | causal (causal only when supplied)', RELATION_KINDS),
  }, ['from', 'to', 'kind']), 1, 4),
  props: obj('Supplied statement content (identical in both scenes)', {
    statement: str('What the witness says in both scenes (written on the card)', 90),
    via: str('Scenario B: from whom the information was received, as stated', 40),
    sourceLabels: obj('Label printed on the card for the stated source type', {
      observed: str('Label for a direct observation (keep “as stated”)', 48),
      received: str('Label for information received (keep “as stated”)', 48),
    }),
  }),
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  actors: WITNESS_DEFAULTS.actors,
  roles: WITNESS_DEFAULTS.roles,
  relationships: [
    {from: 'event', to: 'witness', kind: 'relation'},
    {from: 'event', to: 'informant', kind: 'relation'},
    {from: 'informant', to: 'witness', kind: 'communication'},
  ],
  props: {
    statement: 'The van left before midnight',
    via: 'a neighbour',
    sourceLabels: WITNESS_DEFAULTS.props.sourceLabels,
  },
  scenarioA: {label: 'Direct observation', caption: 'The witness says they saw it'},
  scenarioB: {label: 'Information received', caption: 'The witness says a neighbour told them'},
  changedFact: 'How the witness says they know it',
  sharedFacts: ['Same witness and clerk', 'Same words in the statement'],
  comparisonLabels: {guide: 'Only the stated source differs', neutral: 'Both cards record the source as stated; neither is ranked'},
};

function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}

const linkOf = (p, from, to, fallback) => (p.relationships.find(q => q.from === from && q.to === to) || {kind: fallback}).kind;

/**
 * "What happened" vignette (top-left of each scene, identical in A and B): the
 * neutral gate-and-van pictogram in a round frame (local origin = centre).
 */
function vignette(ctx, o) {
  const th = ctx.theme;
  return g({name: o.name, transform: T(o.x, o.y)},
    h('circle', {r: r(o.R + 8), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '9 6'}),
    eventIcon(ctx, {R: o.R}));
}

/**
 * A drawn link between two world points in its kind's style (draw-on);
 * returns {node, frame(p), a, b} (a/b = the visible ends).
 */
function linkLine(ctx, o) {
  const {a: a0, b: b0, kind, name} = o;
  const dx = b0.x - a0.x, dy = b0.y - a0.y, Ln = Math.hypot(dx, dy) || 1;
  const a = {x: a0.x + (dx / Ln) * o.gapA, y: a0.y + (dy / Ln) * o.gapA}, b = {x: b0.x - (dx / Ln) * o.gapB, y: b0.y - (dy / Ln) * o.gapB};
  const st = LINK_STYLES[kind] || LINK_STYLES.relation;
  const col = kindColor(ctx, kind);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const head = st.arrow ? h('path', {name: `${name}-h`, d: 'M0 0l-18 -10l5 10l-5 10z', fill: col, transform: T(b.x, b.y, (Math.atan2(dy, dx) * 180) / Math.PI), opacity: 0}) : null;
  return {
    a, b, len,
    node: g(null,
      h('line', {name, x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: col, 'stroke-width': st.width + 1.5, 'stroke-linecap': 'round', 'stroke-dasharray': st.dash ? `${st.dash}` : `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': st.dash ? 0 : r(len), opacity: 0}),
      st.endDots ? h('circle', {name: `${name}-d`, cx: r(b.x), cy: r(b.y), r: 5, fill: col, opacity: 0}) : null,
      head),
    frame: q => ({
      [name]: st.dash ? {opacity: q > 0 ? 1 : 0, x2: r(lerp(a.x, b.x, q)), y2: r(lerp(a.y, b.y, q))} : {opacity: q > 0 ? 1 : 0, 'stroke-dashoffset': r(len * (1 - q))},
      ...(st.endDots ? {[`${name}-d`]: {opacity: q >= 0.98 ? 1 : 0}} : {}),
      ...(st.arrow ? {[`${name}-h`]: {opacity: q >= 0.98 ? 1 : 0}} : {}),
    }),
  };
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 960], portrait: [1000, 1455]},
  layout(ctx) {
    // side by side on wide frames, stacked on tall ones; square frames take whichever
    // arrangement gives the larger people (a long statement may need the full width)
    const shape = ctx.view.shape;
    if (shape !== 'square') return arrange(ctx, shape === 'portrait');
    const a = arrange(ctx, false), b = arrange(ctx, true);
    const pick = (b.fits && !a.fits) || (b.fits === a.fits && b.witnessPx > a.witnessPx * 1.08) ? b : a;
    pick.tried = [{fits: a.fits, px: Math.round(a.witnessPx), why: a.why}, {fits: b.fits, px: Math.round(b.witnessPx), why: b.why}];
    return pick;
  },
  build(ctx, L) {
    return buildScene(ctx, L);
  },
  frame(ctx, L, u, timeMs) {
    return frameScene(ctx, L, u, timeMs);
  },
};

function arrange(ctx, stacked) {
  {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const F0 = 22.5 / px, Fmin = 16.3 / px;
    const m = 16;
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const colA = th.accent2, colB = sourceColor(ctx, 'received');

    // ---- bottom band: the comparison guide chip (side-by-side frames) and the key
    const guideText = p.changedFact ? `${p.comparisonLabels.guide} — ${p.changedFact}` : p.comparisonLabels.guide;
    const band = F => bottomBand(ctx, p, {w: D.w - 2 * m, size: F, guideText: showKey && !stacked ? guideText : ''});
    let bandL = showKey ? band(F0) : null;
    const headerCap = i => [(i ? p.scenarioB : p.scenarioA).caption, i ? captionOf(p, 'informant') : ''].filter(Boolean).join(' · ');
    const headerMeasure = (F, w) => Math.max(...[0, 1].map(i => {
      const l = fitWords((i ? p.scenarioB : p.scenarioA).label, {maxWidth: w - F * 2.4, size: F * 1.15, minSize: F, maxLines: 2, weight: 800});
      const c = showAll ? fitWords(headerCap(i), {maxWidth: w - 8, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
      return Math.max(F * 2.1, l.height + F * 0.5) + (c ? c.height + F * 0.35 : 0) + 8;
    }));
    const headerH = showKey ? headerMeasure(F0, stacked ? D.w - 2 * m : (D.w - 2 * m - 28) / 2) : F0 * 2.2;
    // tall frames: the guide chip sits in the gap between the two scenes
    const gOpts = {anchor: 'middle', size: F0, minSize: F0, maxLines: 3, fill: '#fff8e1', stroke: th.accent3, name: 'guide-chip', weight: 700};
    const stackChip0 = showKey && stacked ? wchip(ctx, guideText, {...gOpts, x: 0, y: 0, maxWidth: D.w - 2 * m - 40}) : null;
    const gap = stacked ? (stackChip0 ? stackChip0.box.h + 30 : 28) : 28;
    // the band leaves a lane above it for the guide's leaders
    const bandH = bandL ? bandL.h + (stacked ? 16 : 30) : 0;
    const avail = {x: m, y: m, w: D.w - 2 * m, h: D.h - 2 * m - bandH};
    const panelW = stacked ? avail.w : (avail.w - gap) / 2;
    const panelH = stacked ? (avail.h - 2 * headerH - gap) / 2 : avail.h - headerH;
    const facts = [{text: p.props.statement, source: 'observed', via: ''}, {text: p.props.statement, source: 'received', via: p.props.via}];
    const items = facts.map(f => ({text: f.text, tag: f.source === 'received' ? p.props.sourceLabels.received : p.props.sourceLabels.observed, fromText: f.source === 'received' && f.via ? `${ctx.t.from}: ${f.via}` : ''}));
    // hold notes shown where the bubble was: shared facts in A, the neutral note in B
    const holdNotes = [p.sharedFacts.length ? `= ${ctx.t.same}: ${p.sharedFacts.join(' · ')}` : '', p.comparisonLabels.neutral || ''];

    // Each scene: a lane at the left (the "what happened" vignette on top; in B the
    // neighbour stands in it), the witness seated at the table, the clerk behind
    // it, the card slot beside the witness; the speech bubble in the band above
    // the people. The largest scale whose scene fits the panel wins.
    let best = null;
    // first pass keeps text ≥ 19.6 px (the baseline floor); only a layout that cannot fit
    // that way goes down to the 16.3 px floor
    search:
    for (const Ffloor of [Math.max(Fmin, 19.6 / px), Fmin])
    for (let z = 1.8; z >= 0.4; z -= 0.03) {
     // the narrowest card that lets the scene fit (a long statement gets a wider, lower card)
     // widest card the panel allows at this scale (everything else in the row is scale-bound)
     const maxCW = panelW - 80 - 66 * 1.4 * z - 110 * 1.4 * z - 172 * z;
     const widths = [170, 195, 225, 260, 300].map(k => k * z).filter(w => w < maxCW).concat(maxCW > 170 * z ? [maxCW] : [170 * z]);
     // text size: as large as possible (a long statement in a narrow panel goes down to the floor)
     for (const cardW of widths) for (const Fcap of [F0, (F0 + Ffloor) / 2, Ffloor]) {
      const cw = r(cardW / z);
      const cf = fitCards(ctx, {w: cardW, items, size: Fcap, minSize: Ffloor});
      if (!cf.ok && cardW < widths[widths.length - 1]) continue;
      const F = cf.size;
      const kW = 1.4 * z;
      // the neighbour's lane overlaps the back of the witness's chair (she stands just behind her)
      const laneW = 66 * kW;
      const qs = Math.min(24 / px, F + 2 / px);
      const bubX = m + laneW + 24;
      const bubW = panelW - m - bubX;
      let quote = null, qh = F * 2.4;
      if (showAll && bubW > 60) {
        quote = fitQuote(ctx, p.props.statement, {maxWidth: bubW - 44, size: qs, minSize: qs, maxLines: 3});
        qh = quote.height + 44;
      }
      const noteChips = showAll && bubW > 60 ? holdNotes.filter(Boolean).map(t => wchip(ctx, t, {x: 0, y: 0, maxWidth: bubW, size: F, minSize: F, maxLines: 6})) : [];
      const noteH = Math.max(0, ...noteChips.map(c => c.box.h));
      const noteCut = noteChips.some(c => c.fit.truncated);
      const Rv = clamp(laneW * 0.36, 24, 90);
      const bandH0 = Math.max(qh, noteH, 2 * Rv + 18);
      // name chips under the crop line: the witness left, the clerk right (in one row when they fit)
      const caps = [captionOf(p, 'witness'), captionOf(p, 'clerk')];
      const half = (panelW - 24) / 2;
      const inRow = caps.map(t => wchip(ctx, t, {x: 0, y: 0, maxWidth: half, size: F, minSize: F, maxLines: 4}));
      const chipH = showKey ? Math.max(...inRow.map(c => c.box.h)) + 4 : 8;
      const chipCut = showKey && inRow.some(c => c.fit.truncated);
      const G = stageGeometry({mode: 'row', W: panelW, H: panelH, z, n: 1, cardW, cardH: cf.H, doc: {w: 1, h: 1}, noDoc: true, bubbleH: 0, chipH, sideCol: laneW, band: bandH0, padRight: 70, railGap: 56, closeup: true});
      // the clerk's chair (cx + 104z) and resting right hand (moved in to cx + 80z, mitt to
      // cx + 112z) are never cut by the panel's side
      G.restR = {x: G.cx + 80 * z, y: G.sy - 40 * z};
      const rightExt = G.cx + 116 * z;
      // the neighbour's head stays clear of the vignette above her (her line of sight must read)
      const nbTop = G.floor - 404 * kW;
      const vigBottom = m + 2 * Rv + 16;
      const fits = G.overflowX <= 0 && rightExt <= panelW - 2 && G.overflowY <= 0 && cf.ok && !(quote && quote.truncated) && !chipCut && !noteCut && bubW > 150 && nbTop >= Math.max(m + bandH0 + 16, vigBottom + 46);
      const miss = Math.max(G.overflowX, rightExt - panelW + 2, G.overflowY, Math.max(m + bandH0 + 16, vigBottom + 46) - nbTop, 0) + (cf.ok ? 0 : 1e4) + (quote && quote.truncated ? 1e4 : 0) + (bubW > 150 ? 0 : 1e3) + (chipCut || noteCut ? 1e3 : 0);
      const why = {ph: r(panelH), hh: r(headerH), band: r(bandH), b0: r(bandH0), hc: r(cf.H), cw, ox: r(G.overflowX), re: r(rightExt - panelW + 2), oy: r(G.overflowY), nb: r(m + bandH0 + 16 - nbTop), cf: cf.ok, q: !(quote && quote.truncated), chip: !chipCut, note: !noteCut, bub: r(bubW)};
      const cand = {miss, z, cf, F, G, quote, qh, fits, laneW, Rv, bandH0, bubX, bubW, kW, why};
      if (fits) { best = cand; break search; }
      if (!best || miss < best.miss) best = cand;
     }
    }
    const {cf, F, G, quote, laneW, Rv, bandH0, bubX, bubW, kW} = best;
    if (showKey && F < F0) bandL = band(F);
    const z = G.z;

    // panel origins
    const panels = [0, 1].map(i => (stacked
      ? {x: avail.x, y: avail.y + headerH + i * (panelH + headerH + gap), hy: avail.y + i * (panelH + headerH + gap)}
      : {x: avail.x + i * (panelW + gap), y: avail.y + headerH, hy: avail.y}));

    // band above the people: the vignette over the lane, the bubble (later the hold note) right of it
    const bubBox = {x: bubX, y: m, w: bubW, h: bandH0};
    // (at the top of the band, so the neighbour's line of sight below it has room)
    const vc = {x: m + laneW * 0.5, y: m + Rv + 8};
    const notesHold = [0, 1].map(i => {
      if (!showAll || !holdNotes[i]) return null;
      const probe = wchip(ctx, holdNotes[i], {x: 0, y: 0, anchor: 'middle', maxWidth: bubW, size: F, minSize: F, maxLines: 6});
      return wchip(ctx, holdNotes[i], {x: bubBox.x + bubW / 2, y: bubBox.y + Math.max(0, (bandH0 - probe.box.h) / 2), anchor: 'middle', maxWidth: bubW, size: F, minSize: F, maxLines: 6, fill: i ? th.card : '#eef3f7', stroke: th.inkSoft, name: `hold${i}`, weight: i ? 500 : 600});
    });
    const looks = [0, 1, 2].map(i => actorLook(ctx, p.actors[i], i));
    const stages = [0, 1].map(i => witnessStage(ctx, {prefix: i ? 'B' : 'A', G: {...G, bubble: bubBox}, actors: p.actors, cards: [{content: cf.contents[i], source: facts[i].source}], quotes: [quote], docTitle: ''}));
    const scripts = stages.map(st => recountScript(st, {plan: 'all'}));

    // ---- the changed fact, physically: A — a line of sight from what happened to the witness
    //      (eye badge beside her head); B — the neighbour walks in and stands behind the witness,
    //      her line of sight goes to what happened and a "told" arrow to the witness (speech badge)
    const headC = {x: G.hip.x + 5 * kW, y: G.seatY - 176 * kW};
    const badgeR = clamp(18 * kW, 14, 34);
    // the route's end: just above the witness's head (the eye in A, the "told" glyph in B)
    const spot = {x: headC.x + 4 * kW, y: headC.y - 36 * kW - badgeR - 12};
    // she stands just behind the witness's chair, wholly inside B's panel (her back edge ≈ x − 46kW)
    const nbAt = {x: m + 46 * kW, y: G.floor};
    const nbHead = {x: nbAt.x + 5 * kW, y: nbAt.y - 366 * kW};
    const nbMouth = {x: nbAt.x + 35 * kW, y: nbAt.y - 346 * kW};
    const kindSight = linkOf(p, 'event', 'witness', 'relation');
    const kindEvNb = linkOf(p, 'event', 'informant', 'relation');
    const kindNbW = linkOf(p, 'informant', 'witness', 'communication');
    const vig = [0, 1].map(i => vignette(ctx, {name: `vig${i ? 'B' : 'A'}`, x: vc.x, y: vc.y, R: Rv}));
    const sight = linkLine(ctx, {name: 'A-sight', a: vc, b: spot, kind: kindSight, gapA: Rv + 12, gapB: badgeR + 6});
    const nbLink = linkLine(ctx, {name: 'B-nbl', a: vc, b: {x: nbHead.x, y: nbHead.y - 40 * kW}, kind: kindEvNb, gapA: Rv + 12, gapB: 6});
    const told = linkLine(ctx, {name: 'B-told', a: nbMouth, b: spot, kind: kindNbW, gapA: 10 * kW, gapB: badgeR + 6});
    const badgeNode = (name, src) => g({name, opacity: 0, transform: T(spot.x, spot.y)},
      h('circle', {r: r(badgeR), fill: src === 'observed' ? th.accent2Soft : '#efe7f3', stroke: sourceColor(ctx, src), 'stroke-width': 2.5}),
      sourceGlyph(ctx, src, {x: 0, y: 0, size: badgeR * 0.72}));
    const nbRig = personRig(ctx, {name: 'B-nb', look: looks[2], pose: 'standing'});

    // chips (identical in both panels): witness left, clerk right, clear of the guide's corridor
    const tagOf2 = i => {
      const c = cf.contents[i];
      const ls = c.lines.filter(q => q.kind === 'tag' || q.kind === 'glyph' || q.kind === 'via');
      const x0 = Math.min(...ls.map(q => q.x)) - 8, x1 = Math.max(...ls.map(q => q.x + q.w)) + 8;
      const y0 = Math.min(...ls.map(q => q.top)) - 8, y1 = Math.max(...ls.map(q => q.top + q.h)) + 10;
      return {x: G.R.left + x0, y: G.rowTop + y0, w: x1 - x0, h: y1 - y0};
    };
    const tagLocal = [tagOf2(0), tagOf2(1)];
    const corridorX = (tagLocal[0].x + tagLocal[0].w / 2 + tagLocal[1].x + tagLocal[1].w / 2) / 2;
    const extras = [[], []];
    const chipBoxes = [];
    let corridorFree = true;
    if (showKey) {
      const y = G.clipY + 6;
      const capW = captionOf(p, 'witness'), capC = captionOf(p, 'clerk');
      const wx = Math.max(8, G.hip.x - 60 * kW);
      const wMax = corridorX - 16 - wx;
      const cMax = panelW - 8 - (corridorX + 16);
      const cw = wchip(ctx, capW, {x: wx, y, anchor: 'start', maxWidth: Math.max(60, wMax), size: F, minSize: F, maxLines: 4});
      const cc = wchip(ctx, capC, {x: panelW - 8, y, anchor: 'end', maxWidth: Math.max(60, cMax), size: F, minSize: F, maxLines: 4});
      corridorFree = !cw.fit.truncated && !cc.fit.truncated && wMax > 60 && cMax > 60;
      const cwF = corridorFree ? cw : wchip(ctx, capW, {x: 8, y, anchor: 'start', maxWidth: (panelW - 24) / 2, size: F, minSize: F, maxLines: 4});
      const ccF = corridorFree ? cc : wchip(ctx, capC, {x: panelW - 8, y, anchor: 'end', maxWidth: (panelW - 24) / 2, size: F, minSize: F, maxLines: 4});
      for (let i = 0; i < 2; i++) {
        const P = i ? 'B' : 'A';
        extras[i].push(wchip(ctx, capW, {x: cwF.box.x, y, anchor: 'start', maxWidth: cwF.box.w + 1, size: F, minSize: F, maxLines: 4, name: `${P}-chipW`}).node);
        extras[i].push(wchip(ctx, capC, {x: ccF.box.x + ccF.box.w, y, anchor: 'end', maxWidth: ccF.box.w + 1, size: F, minSize: F, maxLines: 4, fill: '#f7f1e3', name: `${P}-plate`}).node);
      }
      chipBoxes.push(cwF.box, ccF.box);
    }
    const headers = [0, 1].map(i => header(ctx, {
      name: `head${i ? 'B' : 'A'}`, letter: i ? 'B' : 'A', color: i ? colB : colA,
      label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      who: i ? captionOf(p, 'informant') : '', x: panels[i].x, y: panels[i].hy, w: panelW, h: headerH, size: F, showKey, showAll,
    }));

    // guide: rings on both source tags and on both route badges; side by side, leaders run from
    // each tag ring straight down the free corridor under the card (between the name chips),
    // along the lane above the band, into the chip; tall frames: the chip sits between the scenes
    const tags = [0, 1].map(i => ({...tagLocal[i], x: panels[i].x + tagLocal[i].x, y: panels[i].y + tagLocal[i].y}));
    const badges = [0, 1].map(i => ({x: panels[i].x + spot.x - badgeR - 7, y: panels[i].y + spot.y - badgeR - 7, w: 2 * badgeR + 14, h: 2 * badgeR + 14}));
    let guide = null;
    if (showKey) {
      if (stacked) {
        const cy = panels[1].hy - gap + 14;
        guide = {chip: wchip(ctx, guideText, {...gOpts, size: F, minSize: F, x: D.w / 2, y: cy, maxWidth: D.w - 2 * m - 40}), leads: []};
      } else {
        const bx = D.w / 2 - bandL.w / 2, by = D.h - 16 - bandL.h;
        const chip = bandL.guide(bx, by);
        const laneY = by - 15;
        const leads = corridorFree ? tags.map((b, j) => {
          const x = panels[j].x + corridorX;
          const cx = j ? chip.box.x + chip.box.w - 22 : chip.box.x + 22;
          return [{x: b.x + b.w / 2, y: b.y + b.h}, {x, y: b.y + b.h + 10}, {x, y: laneY}, {x: cx, y: laneY}, {x: cx, y: chip.box.y}];
        }) : [];
        guide = {chip, leads};
      }
    }
    return {
      notesHold, G, stages, scripts, panels, headers, extras, guide, tags, badges, bandL, bandH, F, px, stacked, headerH, avail, panelW, panelH, looks,
      vig, sight, nbLink, told, badgeNode, nbRig, nbAt, spot, vc, kW, laneW, bubBox, corridorFree, chipBoxes,
      fits: best.fits, why: best.why, sceneShare: panelW / D.w,
      witnessPx: (G.clipY - (G.seatY - 212 * kW)) * px, rightExt: G.cx + 116 * z,
    };
  }
}

function buildScene(ctx, L) {
  {
    const th = ctx.theme;
    const parts = [];
    L.panels.forEach((pn, i) => {
      parts.push(L.headers[i].node);
      const cid = `crop${i}`;
      const P = i ? 'B' : 'A';
      parts.push(g({transform: T(pn.x, pn.y)},
        h('defs', null, h('clipPath', {id: ctx.id(cid)}, h('rect', {x: 0, y: -4, width: r(L.panelW), height: r(L.G.clipY + 4)}))),
        L.vig[i],
        g({'clip-path': ctx.ref(cid)},
          // B: the neighbour stands in the lane behind the witness (drawn behind the stage)
          i ? g({name: 'B-nbw', opacity: 0}, L.nbRig.node) : null,
          L.stages[i].node),
        h('path', {d: `M${r(L.G.tableL)} ${r(L.G.clipY)}H${r(L.G.tableR)}`, stroke: ctx.theme.ink, 'stroke-width': 2, opacity: 0.35}),
        i ? g(null, L.nbLink.node, L.told.node) : L.sight.node,
        L.badgeNode(`${P}-badge`, i ? 'received' : 'observed'),
        L.notesHold[i] ? g({name: `holdw${i}`, opacity: 0}, L.notesHold[i].node) : null,
        L.extras[i]));
    });
    if (L.guide) {
      const rings = [...L.tags, ...L.badges].map((b, j) => h('path', {name: `ring${j}`, d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: 'none', stroke: th.accent3, 'stroke-width': 4, opacity: 0}));
      const leads = L.guide.leads.map((pts, j) => h('path', {name: `lead${j}`, d: pts.map((q, k) => `${k ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent3, 'stroke-width': 3, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}));
      parts.push(g(null, rings, leads, L.guide.chip ? g({name: 'guide', opacity: 0}, L.guide.chip.node) : null));
    }
    if (L.bandL) {
      const bx = ctx.design.w / 2 - L.bandL.w / 2, by = ctx.design.h - 16 - L.bandL.h;
      parts.push(g({name: 'band', opacity: 0}, L.bandL.build(bx, by)));
    }
    return g(null, parts);
  }
}

function frameScene(ctx, L, u, timeMs) {
  {
    const nodes = {};
    const c = recountClock(u, ACT[0], ACT[1], 1);
    const looks = [];
    const sem = [];
    const kW = L.kW;
    // the change (B: the neighbour walks in, looks at what happened, then tells the witness)
    const eye = ease.outCubic(seg(u, ...CHANGE.eye));
    const sightP = ease.inOutSine(seg(u, ...CHANGE.sight));
    const nbP = seg(u, ...CHANGE.nb);
    const nbLinkP = ease.inOutSine(seg(u, ...CHANGE.nbLink));
    const toldP = ease.inOutSine(seg(u, ...CHANGE.told));
    Object.assign(nodes, L.sight.frame(sightP), L.nbLink.frame(nbLinkP), L.told.frame(toldP));
    nodes['A-badge'] = {opacity: r(eye, 3)};
    nodes['B-badge'] = {opacity: toldP >= 0.98 ? 1 : 0};
    // she appears whole at her standing spot (never cut by the panel's edge): she fades in while
    // stepping in place (a small bob and sway), then settles
    const nbX = L.nbAt.x;
    const nbShow = ease.inOutSine(seg(nbP, 0, 0.45));
    const stepping = nbP > 0 && nbP < 1 && !ctx.reduced;
    const talking = u >= CHANGE.told[0] && u <= CHANGE.told[1] + 0.02;
    const nbPose = L.nbRig.frame({x: nbX, y: L.nbAt.y - (stepping ? Math.abs(Math.sin(nbP * Math.PI * 4)) * 5 * kW * (1 - nbP) : 0), facing: 1, scale: kW, lean: talking ? 6 : stepping ? 2 + 3 * Math.sin(nbP * Math.PI * 4) * (1 - nbP) : 2, headTilt: u < CHANGE.nbLink[1] && nbP >= 1 ? -8 : 4, mouth: talking && !ctx.reduced ? 0.25 + 0.5 * Math.abs(Math.sin(timeMs * 0.015)) : 0});
    Object.assign(nodes, nbPose.nodes);
    nodes['B-nbw'] = {opacity: r(nbShow, 3)};
    L.stages.forEach((st, i) => {
      const input = L.scripts[i](c, timeMs, ctx.reduced);
      const posed = st.pose(input);
      Object.assign(nodes, posed.nodes);
      const hd = seg(u, ...CHANGE.head);
      nodes[`head${i ? 'B' : 'A'}`] = {opacity: r(hd, 3)};
      const s = posed.semantic;
      looks.push({
        eye: i === 0 ? r(eye, 3) : 0, sight: i === 0 ? r(sightP, 3) : 0,
        neighbour: i === 1 ? r(nbP, 3) : 0, relay: i === 1 ? r(nbLinkP, 3) : 0, told: i === 1 ? r(toldP, 3) : 0,
        bubble: s.bubbles[0], written: s.written[0], dictated: s.dictated[0], cardAt: s.cardAt[0], header: r(hd, 3),
      });
      sem.push(s);
    });
    const gp = seg(u, ...GUIDE);
    if (L.guide) {
      for (let j = 0; j < 4; j++) nodes[`ring${j}`] = {opacity: r(seg(gp, 0, 0.35), 3)};
      L.guide.leads.forEach((_, j) => { nodes[`lead${j}`] = {opacity: r(seg(gp, 0.25, 0.6), 3)}; });
      if (L.guide.chip) nodes.guide = {opacity: r(seg(gp, 0.45, 0.9), 3)};
    }
    if (L.bandL) nodes.band = {opacity: r(seg(u, 0.05, 0.12), 3)};
    L.notesHold.forEach((nt, i) => { if (nt) nodes[`holdw${i}`] = {opacity: r(seg(u, 0.78, 0.84), 3)}; });
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const A = sem[0], B = sem[1];
    return {
      nodes,
      semantic: {
        beat,
        scenes: 2,
        lookA: looks[0], lookB: looks[1],
        // what differs: the route to what happened (and so the card's stated source)
        routeA: sightP >= 1 ? 'direct' : sightP > 0 ? 'drawing' : 'none',
        routeB: toldP >= 1 ? 'via-informant' : nbLinkP > 0 || nbP > 0 ? 'drawing' : 'none',
        // the neighbour is a person standing in B's scene (not a symbol in a frame)
        neighbourInScene: nbP >= 1 && Math.abs(nbX - L.nbAt.x) < 0.5,
        // whenever she is visible she is whole: never cut by the side of B's panel
        neighbourClipped: nbShow > 0 && (nbX - 48 * kW < 0 || nbX + 52 * kW > L.panelW),
        neighbourAt: {x: r(nbX), y: r(L.nbAt.y)},
        sourceA: 'observed', sourceB: 'received',
        cardA: A.cardAt[0], cardB: B.cardAt[0], writtenA: A.written[0], writtenB: B.written[0],
        sameAction: JSON.stringify([A.cardAt, A.written, A.dictated, A.bubbles]) === JSON.stringify([B.cardAt, B.written, B.dictated, B.bubbles]),
        penA: A.pen, writeTargetA: A.writeTarget, handRA: A.handR, gripRA: A.gripR, handLA: A.handL, gripLA: A.gripL,
        penB: B.pen, writeTargetB: B.writeTarget, handRB: B.handR, gripRB: B.gripR,
        cardPosA: A.card0, cardPosB: B.card0,
        guideProgress: r(gp, 3),
        // leaders exist only where they run through the free corridor (never across a chip or a figure);
        // guideLinked: the chip is joined to the rings (leaders, or the chip between stacked scenes)
        guideRouted: true,
        guideLinked: L.stacked || (L.corridorFree && L.guide && L.guide.leads.length === 2),
        allReached: A.allReached && B.allReached,
        reach: {A: A.reach, B: B.reach},
        layoutFits: L.fits,
        layoutWhy: L.fits ? null : L.why,
        arrangements: L.tried || null,
        // scene size: share of the frame width per scene, the witness's visible height (px at 1080p),
        // and the stage's right extent inside its panel (no clipping at the panel's side)
        sceneShare: r(L.sceneShare, 3),
        witnessPx: r(L.witnessPx),
        sideClear: L.rightExt <= L.panelW - 1,
        z: L.G.z,
        textPx: r(L.F * L.px, 1),
      },
    };
  }
}

/** Scenario header: lane badge + label (up to two lines); caption line(s) with B's informant under it. */
function header(ctx, o) {
  const th = ctx.theme;
  const s = o.size;
  const R = s * 0.95;
  const parts = [h('circle', {cx: r(o.x + R + 4), cy: r(o.y + R + 6), r: r(R), fill: o.color, stroke: th.ink, 'stroke-width': 2.5})];
  if (o.showKey) {
    parts.push(h('text', {x: r(o.x + R + 4), y: r(o.y + R + 6 + s * 0.4), 'text-anchor': 'middle', 'font-size': r(s * 1.1, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter));
    const f = fitWords(o.label, {maxWidth: o.w - s * 2.4, size: s * 1.15, minSize: s, maxLines: 2, weight: 800});
    parts.push(textAt(f, o.x + 2 * R + 16, o.y + Math.max(R + 6 - f.height / 2, 4), th.fg));
    const cap = o.showAll ? [o.caption, o.who].filter(Boolean).join(' · ') : '';
    if (cap) {
      const f2 = fitWords(cap, {maxWidth: o.w - 8, size: s, minSize: s, maxLines: 3, weight: 500});
      parts.push(textAt(f2, o.x + 4, o.y + Math.max(s * 2.1, f.height + s * 0.5), th.fgSoft));
    }
  }
  return {node: g({name: o.name, opacity: 0}, parts)};
}

/**
 * Bottom band: the comparison guide chip (wide/square frames) and the key
 * "as supplied · no conclusion drawn", on one row when they fit.
 */
function bottomBand(ctx, p, o) {
  const th = ctx.theme;
  const s = o.size;
  const note = fitWords(ctx.t.keyNote, {maxWidth: o.w - s, size: s, minSize: s, maxLines: 2, weight: 600});
  const noteW = note.width + s * 0.8, noteH = note.height + s * 0.4;
  const gOpts = {anchor: 'start', maxWidth: Math.min(o.w, 720), size: s, minSize: s, maxLines: 3, fill: '#fff8e1', stroke: th.accent3, name: 'guide-chip', weight: 700};
  const gp = o.guideText ? wchip(ctx, o.guideText, {...gOpts, x: 0, y: 0}) : null;
  const one = gp && gp.box.w + s + noteW <= o.w;
  const w = gp ? (one ? gp.box.w + s + noteW : Math.max(gp.box.w, noteW)) : noteW;
  const hgt = gp ? (one ? Math.max(gp.box.h, noteH) : gp.box.h + s * 0.4 + noteH) : noteH;
  return {
    h: hgt, w,
    guide(x0, y0) {
      if (!gp) return null;
      return wchip(ctx, o.guideText, {...gOpts, x: x0 + (one ? 0 : (w - gp.box.w) / 2), y: y0 + (one ? (hgt - gp.box.h) / 2 : 0)});
    },
    build(x0, y0) {
      const x = gp ? (one ? x0 + gp.box.w + s : x0 + (w - noteW) / 2) : x0;
      const y = gp ? (one ? y0 + (hgt - noteH) / 2 : y0 + gp.box.h + s * 0.4) : y0;
      return g(null,
        h('rect', {x: r(x), y: r(y), width: r(noteW), height: r(noteH), rx: r(s * 0.35), fill: '#f7f1e3', stroke: th.ink, 'stroke-width': 2}),
        textAt(note, x + s * 0.4, y + s * 0.2, th.ink));
    },
  };
}

function textAt(f, x, y, fill, anchor, italic) {
  return h('text', {x: r(x), y: r(y + f.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(f.size, 2), 'font-weight': f.weight, 'font-style': italic ? 'italic' : undefined, fill},
    f.lines.map((line, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(f.lineHeight, 2)}, line)));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-03-contrast',
    title: 'Witness statement — the same statement, seen directly vs heard from someone else',
    titleEs: 'Declaración de testigo — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Declaración de testigo',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical statement tables. Only one fact changes: in A a line of sight runs from what happened to the witness; in B a neighbour steps in behind the witness, sees what happened and tells her (a "told" arrow). Both witnesses then say the same words and both clerks write the same card; only its stated source label differs. A guide rings the two labels and the two route badges; no winner, score, credibility or weight.',
    tags: ['witness', 'statement', 'contrast', 'direct observation', 'information received', 'as stated', 'paired scenes', 'fact card'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/declaracion-de-testigo.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/badges.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
