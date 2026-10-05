/**
 * LAW-0077 — Trazabilidad de una cita · story
 *
 * Storyboard (first-person library bay; the viewer's own hands act):
 *  0.00–0.15  rest: the citing article stands on a lectern with its footnote
 *             (note 12), the catalogue screen types the work the note names
 *             and lights the result with its shelf mark; the matching shelf
 *             plate glows. The left hand holds the citation-trail card; the
 *             intermediate reference stands in its shelf slot; the original
 *             folio waits in an open archive box.
 *  0.15–0.42  action: a brass chain hooks onto the footnote's eyelet and runs
 *             out toward the library; the right hand pulls the book from the
 *             slot, brings it forward (it turns from spine to cover and grows)
 *             onto the cradle and flips the cover open. The chain's clasp lands
 *             on the eyelet beside the quoted passage (p. 88). Card row 1, 2.
 *  0.42–0.73  complete: the book's own footnote lights; the hand returns to the
 *             counter, runs along it to the archive box's right side (never over
 *             its plate), pulls the original out by its tab and raises it — the
 *             elbow swings outward so the forearm comes from the right edge and
 *             stays off the page; a second chain runs from the book's footnote
 *             eyelet to the eyelet of the cited entry on the original, which is
 *             highlighted. Row 3.
 *  0.73–1.00  hold: the chain note → intermediate → source stays readable;
 *             descriptive stop tags, supplied final state and callouts.
 * The right hand starts and (when it has nothing to hold) ends resting on the
 * counter, in view: it never crosses the frame edge on its own.
 * finalState "intermediate-only": the original is never opened — the hand
 * returns to the counter after the book, a dashed "cited in" link marks the
 * reference the book gives, and card row 3 reads "as cited in …". No verdict
 * about the citation's accuracy or validity is drawn.
 * @module animations/research/LAW-0077
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {statusTag, chip, textBlock} from '../../primitives/annotate.js';
import {trailFields, TRAIL_DEFAULTS, KIT_STRINGS, trailBay, chainRoute, labelPlacer, bayPlacement} from './kits/trazabilidad-de-una-cita.js';

const ID = 'LAW-0077';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  type: [0.02, 0.1], result: [0.1, 0.14], plate: [0.12, 0.17],
  pulse0: [0.15, 0.21], noteHl: [0.15, 0.19], chain1: [0.16, 0.42], row0: [0.17, 0.21],
  reach: [0.12, 0.22], pull: [0.22, 0.25], away: [0.393, 0.45], carry: [0.25, 0.33], release: [0.33, 0.36], open: [0.36, 0.42],
  pulse1: [0.42, 0.48], row1: [0.42, 0.46], innerHl: [0.44, 0.48], pulse2: [0.47, 0.53],
  // the hand drifts back to the counter, then runs along it and up the box's right side
  toBox: [0.45, 0.52], lift: [0.52, 0.57], present: [0.57, 0.64],
  chain2: [0.5, 0.68], pulse3: [0.68, 0.74], entryHl: [0.68, 0.72], row2: [0.68, 0.72],
  // intermediate-only: the hand returns, a dashed cited-in link appears
  handBack: [0.44, 0.54], ghost2: [0.5, 0.64], row2b: [0.64, 0.68],
  cardLift: [0.7, 0.78], tag0: [0.74, 0.79], tag1: [0.76, 0.81], tag2: [0.78, 0.83], tagF: [0.8, 0.86], note: [0.85, 0.93],
};
const ACTION_END = 0.73;

const sceneSchema = {
  ...trailFields,
  actorLabels: obj('Caption for the first-person researcher (whose hands act)', {researcher: str('Caption shown at the researcher’s hands', 50)}),
  objectLabels: obj('Labels printed on props', {
    search: str('Title of the catalogue search screen', 40),
    card: str('Title printed on the citation-trail card (ficha)', 40),
    box: str('Label on the archive box that holds the original', 30),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['note', 'intermediate', 'source', 'card', 'chain']), 0, 2),
  finalState: oneOf('State supplied for the final hold: source-reached (the chain reaches the opened original) or intermediate-only (the chain ends at the intermediate reference; the original stays unopened). No judgement on the citation is inferred', ['source-reached', 'intermediate-only']),
};

const defaultParams = {
  ...TRAIL_DEFAULTS,
  actorLabels: {researcher: 'Researcher'},
  objectLabels: {search: 'Catalogue search', card: 'Citation trail', box: 'Archive · HB'},
  actionProgress: 1,
  annotations: [{target: 'source', text: 'The chain ends on the entry the treatise cites'}],
  finalState: 'source-reached',
};

/** Status tag with a dotted leader to its target point. */
function leaderTag(ctx, text, o) {
  const t = statusTag(ctx, text, {x: o.x, y: o.y, anchor: o.anchor ?? 'middle', size: o.size, color: o.color, maxWidth: o.maxWidth});
  const b = t.box;
  const tg = o.target;
  const from = tg.y < b.y ? {x: clamp(tg.x, b.x + b.h / 2, b.x + b.w - b.h / 2), y: b.y}
    : tg.y > b.y + b.h ? {x: clamp(tg.x, b.x + b.h / 2, b.x + b.w - b.h / 2), y: b.y + b.h}
      : {x: tg.x < b.x ? b.x : b.x + b.w, y: b.cy};
  const long = Math.hypot(tg.x - from.x, tg.y - from.y) > 10;
  return {
    node: g({name: o.name, opacity: 0},
      long ? h('line', {x1: r(from.x), y1: r(from.y), x2: r(tg.x), y2: r(tg.y), stroke: o.color, 'stroke-width': 2.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null,
      long ? h('circle', {cx: r(tg.x), cy: r(tg.y), r: 5, fill: o.color, stroke: ctx.theme.card, 'stroke-width': 2}) : null,
      t.node),
    box: b,
    lead: long ? {x1: from.x, y1: from.y, x2: tg.x, y2: tg.y} : null,
  };
}

/** Callout chip + leader (hold annotations). */
function noteCallout(ctx, o) {
  const th = ctx.theme;
  const c = chip(ctx, o.text, {x: o.x, y: o.y, anchor: o.anchor ?? 'middle', maxWidth: o.maxWidth, size: o.size ?? 26, maxLines: o.maxLines ?? 3, fill: th.card, stroke: th.ink, name: `${o.name}-chip`});
  const b = c.box;
  const tg = o.target;
  const from = tg.y > b.y + b.h ? {x: clamp(tg.x, b.x + 16, b.x + b.w - 16), y: b.y + b.h} : tg.y < b.y ? {x: clamp(tg.x, b.x + 16, b.x + b.w - 16), y: b.y} : {x: tg.x < b.x ? b.x : b.x + b.w, y: b.cy};
  const len = Math.hypot(tg.x - from.x, tg.y - from.y);
  const node = g({name: o.name, opacity: 0},
    // a light halo keeps the leader readable where it crosses dark shelves
    h('line', {name: `${o.name}-halo`, x1: r(from.x), y1: r(from.y), x2: r(tg.x), y2: r(tg.y), stroke: th.card, 'stroke-width': 6.5, 'stroke-linecap': 'round', opacity: 0.85, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('line', {name: `${o.name}-lead`, x1: r(from.x), y1: r(from.y), x2: r(tg.x), y2: r(tg.y), stroke: th.ink, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(tg.x), cy: r(tg.y), r: 7, fill: th.ink, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
    c.node);
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-halo`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: r(clamp((p - 0.45) / 0.55), 3)},
  });
  return {node, frame, box: b, lead: {x1: from.x, y1: from.y, x2: tg.x, y2: tg.y}};
}

const scene = {
  sizes: {landscape: [1900, 900], square: [1380, 1160], portrait: [1040, 1560]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const t = ctx.t;
    const pl0 = bayPlacement(shape);
    // 9:16: the treatise stands in the left half of the shelf, so the reach for it (from the
    // counter, bowing left of the archive box) never passes over the box, its plate or the
    // original standing in it
    const pl = shape === 'portrait' ? {...pl0, bookcase: {...pl0.bookcase, targetRow: 2, targetX: 540}, reachCtl: {x: 610, y: 1080}} : pl0;
    const [bw, bh] = pl.size;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const finalMode = p.finalState === 'intermediate-only' ? 'intermediate' : 'source';
    const stage = trailBay(ctx, {prefix: 'st', pl: {...pl, reachR: pl.reachR, reachL: pl.reachL}, p, t, finalMode});

    // ---- labels (key: stop tags + final state; all: annotations) placed clear of the props
    const B = pl.book;
    const spread = {x: pl.cradle.x - B.cw * pl.bookK - 8, y: pl.cradle.y - (B.hB / 2) * pl.bookK - 8, w: B.cw * 2 * pl.bookK + 16, h: B.hB * pl.bookK + 16};
    // the cradle's wedges and base, under the open book, down to the counter
    const standHalf = B.cw * pl.bookK * 0.9 + 10;
    const stand = {x: pl.cradle.x - standHalf, y: spread.y + spread.h - 8, w: standHalf * 2, h: pl.counterY + 8 - (spread.y + spread.h - 8)};
    const folioBox = finalMode === 'source' ? stage.folioPresentBox : stage.folioInBoxBox;
    const pageBox = {x: pl.page.x - 6, y: pl.page.y - 6, w: pl.page.w + 12, h: pl.page.h + 12};
    const cb0 = stage.cardBox;
    const cardBox = {x: cb0.x - 8, y: cb0.y - (pl.card.lift ?? 0) - 8, w: cb0.w + 16, h: cb0.h + (pl.card.lift ?? 0) + 16};
    const boxBox = {x: pl.archive.x - pl.archive.w / 2, y: pl.archive.y - pl.archive.h - 20, w: pl.archive.w, h: pl.archive.h + 20};
    const screenBox = {...pl.screen, y: pl.screen.y - 28, h: pl.screen.h + 28};
    const inner = pl.box;
    const placer = labelPlacer(inner, {leadSamples: 48, leadPad: 5});
    // the shelf plate carries the shelf mark: labels keep off it too
    const plateBox = {x: stage.caseG.plate.x - 8, y: stage.caseG.plate.y - 8, w: stage.caseG.plate.w + 16, h: stage.caseG.plate.h + 16};
    // props that carry text are solid: no label covers them and no leader crosses them (the shelf
    // plate carries the shelf mark)
    for (const ob of [spread, folioBox, pageBox, cardBox, screenBox, plateBox]) placer.addObstacle({...ob, solid: true});
    // the lectern's board and rim around the article
    const LB = pl.lecternBoard;
    const lecternBox = {x: LB.x - 8, y: LB.y - 4, w: LB.w + 16, h: LB.h + 20};
    for (const ob of [stand, boxBox, lecternBox]) placer.addObstacle(ob);
    // a placed leader is kept clear by the labels placed after it (no chip sits on a leader)
    const guardLead = res => {
      if (!res || !res.lead) return;
      const {x1, y1, x2, y2} = res.lead;
      const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 14));
      for (let i = 0; i <= n; i++) placer.addObstacle({x: lerp(x1, x2, i / n) - 7, y: lerp(y1, y2, i / n) - 7, w: 14, h: 14, solid: false});
    };
    // exact final chain routes (same routing as the stage)
    const finPose = stage.pose(finalPose(finalMode));
    const fin = finPose.semantic;
    const routes = [chainRoute(fin.noteHook, fin.inHook, pl.route1(fin.noteHook, fin.inHook))];
    if (finalMode === 'source') routes.push(chainRoute(fin.outHook, fin.folioHook, pl.route2(fin.outHook, fin.folioHook)));
    for (const rt of routes) for (let i = 0; i <= 30; i++) { const q = rt.at(i / 30); placer.addObstacle({x: q.x - 13, y: q.y - 13, w: 26, h: 26}); }
    // arms (solved IK polylines inside the window) and their hands (the fist is larger than the
    // arm's width): both arms at the final hold are obstacles for the hold labels
    const inWin = q => q.x > inner.x - 40 && q.x < inner.x + inner.w + 40 && q.y > inner.y - 40 && q.y < inner.y + inner.h + 40;
    const armBoxes = (path, n = 24) => {
      const out = [];
      for (let k = 1; k < path.length; k++) {
        for (let i = 0; i <= n; i++) {
          const q = {x: lerp(path[k - 1].x, path[k].x, i / n), y: lerp(path[k - 1].y, path[k].y, i / n)};
          if (inWin(q)) out.push({x: q.x - 46, y: q.y - 46, w: 92, h: 92});
        }
      }
      const hd = path[path.length - 1];
      out.push({x: hd.x - 58, y: hd.y - 58, w: 116, h: 116});
      return out;
    };
    for (const path of [finPose.armR, finPose.armL]) if (path) for (const b of armBoxes(path)) placer.addObstacle(b);
    // researcher caption (always shown) along the bottom edge: it stays up for the whole scene,
    // so it keeps clear of both arms wherever they move (sampled over the timeline)
    let who = null;
    if (ctx.show('key') && p.actorLabels.researcher) {
      const sweep = [];
      for (let i = 0; i <= 60; i++) {
        const ps = stage.pose(actionValues(p, finalMode, i / 60).v);
        sweep.push([ps.armR, ps.armL].filter(Boolean).flatMap(path => armBoxes(path, 12)));
      }
      const hitsOf = b => sweep.reduce((n, bs) => n + (bs.some(o => o.x < b.x + b.w && o.x + o.w > b.x && o.y < b.y + b.h && o.y + o.h > b.y) ? 1 : 0), 0);
      const whoW = shape === 'portrait' ? 320 : 440;
      const probe = chip(ctx, p.actorLabels.researcher, {x: 0, y: 0, anchor: 'end', maxWidth: whoW, size: 24, maxLines: 2});
      const yb = inner.y + inner.h - 20 - probe.box.h;
      const cands = [{x: inner.x + inner.w - 24, y: yb, anchor: 'end'}];
      for (let f = 0.9; f >= 0.3; f -= 0.025) cands.push({x: inner.x + inner.w * f, y: yb, anchor: 'end'});
      // under the card, right of the left forearm
      for (let f = 0.1; f <= 0.45; f += 0.025) cands.push({x: inner.x + inner.w * f, y: yb, anchor: 'start'});
      // (a long caption) up the right edge, or just above the card
      for (let y = yb - 30; y > pl.counterY + 20; y -= 30) cands.push({x: inner.x + inner.w - 24, y, anchor: 'end'});
      for (let f = 0.02; f <= 0.4; f += 0.04) cands.push({x: inner.x + inner.w * f, y: cardBox.y - probe.box.h - 4, anchor: 'start'});
      // never over a prop, a hold label or an arm at rest/hold; among those, the spot the moving
      // arms cross least often (none, wherever the scene leaves such a spot)
      let bestK = Infinity;
      for (const c of cands) {
        const res = chip(ctx, p.actorLabels.researcher, {x: c.x, y: c.y, anchor: c.anchor, maxWidth: whoW, size: 24, maxLines: 2, name: 'who'});
        const hard = placer.scoreOf(res);
        if (hard === Infinity) continue;
        const k = (hard > 0 ? 1e6 + hard : 0) + hitsOf(res.box) * 1000;
        if (k < bestK) { bestK = k; who = res; }
        if (k === 0) break;
      }
      if (who) placer.addLabel(who.box);
    }
    const tagSize = shape === 'landscape' ? 26 : 28;
    const around = (tg, box, extra = []) => [
      {x: box.x + box.w / 2, y: box.y - tagSize * 2.6, anchor: 'middle'},
      {x: box.x + box.w / 2, y: box.y + box.h + 10, anchor: 'middle'},
      {x: box.x - 14, y: tg.y - tagSize, anchor: 'end'},
      {x: box.x + box.w + 14, y: tg.y - tagSize, anchor: 'start'},
      ...extra,
    ];
    const tags = [];
    let finalTag = null;
    const placeTags = () => {
      if (!ctx.show('key')) return;
      // most constrained first: the source (next to the raised arm), the intermediate, the note
      const srcTarget = finalMode === 'source' ? {x: folioBox.x + folioBox.w / 2, y: folioBox.y + 6} : {x: boxBox.x + boxBox.w / 2, y: boxBox.y + 18};
      const srcText = finalMode === 'source' ? t.source : `${t.source} · ${t.notOpened}`;
      const srcTag = placer.place(around(srcTarget, finalMode === 'source' ? folioBox : boxBox, [{x: folioBox.x - 14, y: folioBox.y + folioBox.h * 0.5, anchor: 'end'}]), c => leaderTag(ctx, srcText, {...c, name: 'tag-src', color: th.accent4, size: tagSize, target: srcTarget, maxWidth: 440}), srcTarget);
      guardLead(srcTag);
      // the intermediate's tag points at the open book from above (gutter top) or from below
      // (gutter foot, the tag standing on the counter under the cradle): the clearer one wins
      const intOpts = [
        {target: {x: pl.cradle.x, y: spread.y + 8}, cands: around({x: pl.cradle.x, y: spread.y + 8}, spread, [{x: spread.x + spread.w / 2, y: spread.y - tagSize * 4.4, anchor: 'middle'}])},
        {target: {x: pl.cradle.x, y: spread.y + spread.h - 10}, cands: [
          {x: pl.cradle.x, y: stand.y + stand.h + 6, anchor: 'middle'},
          {x: pl.cradle.x - 40, y: stand.y + stand.h + 6, anchor: 'start'},
          {x: pl.cradle.x + 40, y: stand.y + stand.h + 6, anchor: 'end'},
          {x: spread.x - 14, y: spread.y + spread.h - tagSize * 2.2, anchor: 'end'},
          {x: spread.x + spread.w + 14, y: spread.y + spread.h - tagSize * 2.2, anchor: 'start'},
        ]},
      ];
      let intTag = null, intSc = Infinity;
      for (const o of intOpts) {
        const res = placer.place(o.cands, c => leaderTag(ctx, t.intermediate, {...c, name: 'tag-int', color: '#8a5a1f', size: tagSize, target: o.target, maxWidth: 420}), o.target, {register: false});
        const b = res.box;
        const sc = placer.scoreOf(res) + Math.hypot(b.x + b.w / 2 - o.target.x, b.y + b.h / 2 - o.target.y) * 1.5;
        if (sc < intSc) { intSc = sc; intTag = res; }
      }
      placer.addLabel(intTag.box);
      guardLead(intTag);
      const noteTag = placer.place(around(fin.noteHook, pageBox, [{x: pageBox.x + pageBox.w + 14, y: pageBox.y + 10, anchor: 'start'}]), c => leaderTag(ctx, `${t.note} ${p.citations.noteNumber}`, {...c, name: 'tag-note', color: th.accent2, size: tagSize, target: fin.noteHook, maxWidth: 360}), fin.noteHook);
      guardLead(noteTag);
      tags.push(noteTag, intTag, srcTag);
      // final-state tag next to the card (the record of the trail): above it, or beside it —
      // where the space beside the card is narrow the tag wraps to two balanced lines
      const txt = finalMode === 'source' ? t.sourceReached : t.intermediateOnly;
      const cb = cardBox;
      const right = cb.x + cb.w + 16;
      const cands = [
        {x: cb.x + cb.w / 2, y: cb.y - tagSize * 2.2, anchor: 'middle', mw: 520},
        {x: cb.x + 4, y: cb.y - tagSize * 2.2, anchor: 'start', mw: 520},
      ];
      for (const mw of [520, 420, 320, 260]) {
        for (const f of [0.3, 0.05, 0.55, 0.8]) cands.push({x: right, y: cb.y + cb.h * f, anchor: 'start', mw, lines: mw < 300 ? 3 : 2});
      }
      cands.push({x: cb.x + cb.w / 2, y: cb.y + cb.h + 6, anchor: 'middle', mw: 520});
      finalTag = placer.place(cands, c => stateTag(ctx, txt, {x: c.x, y: c.y, anchor: c.anchor, size: tagSize, color: th.ink, maxWidth: c.mw ?? 420, maxLines: c.lines ?? 2, name: 'tag-final'}), {x: cb.x + cb.w / 2, y: cb.y + cb.h / 2}, {maxDist: 260});
    };
    // annotations
    const notes = [];
    const placeNotes = () => {
      if (!ctx.show('all')) return;
      // the chain annotation may point at any point along its chain: the one whose callout sits
      // clearest wins
      const chainRt = finalMode === 'source' ? routes[1] : routes[0];
      const targets = {
        note: [fin.noteHook],
        intermediate: [{x: pl.cradle.x - B.cw * pl.bookK * 0.5, y: spread.y + spread.h * 0.3}],
        // the cited entry (where the chain ends) or, where no clear leader reaches it, the
        // original's heading edge
        source: finalMode === 'source' ? [{x: folioBox.x + 10, y: fin.folioHook.y}, {x: folioBox.x + 6, y: folioBox.y + folioBox.h * 0.2}] : [{x: boxBox.x + 12, y: boxBox.y + 30}],
        card: [{x: cardBox.x + cardBox.w - 14, y: cardBox.y + cardBox.h * 0.35}],
        chain: [0.5, 0.35, 0.65, 0.25, 0.75].map(q => chainRt.at(q)),
      };
      const size = shape === 'landscape' ? 24 : 26;
      const mw = shape === 'landscape' ? 340 : 360;
      for (const [i, a] of p.annotations.entries()) {
        let best = null, bestSc = Infinity;
        for (const tg of targets[a.target]) {
          // candidates around the target, nearest first (centred, beside or above/below it)
          const cands = [];
          for (const dy of [-200, -130, 70, 140]) for (const dx of [-240, 0, 240]) cands.push({x: tg.x + dx, y: tg.y + dy, anchor: dx < 0 ? 'end' : dx > 0 ? 'start' : 'middle'});
          for (const dy of [-220, -160, -100, 24, 44, 90]) for (let dx = -300; dx <= 300; dx += 60) cands.push({x: tg.x + dx, y: tg.y + dy, anchor: 'middle'});
          // the free wall under the lectern board (left of the treatise)
          for (const f of [0.5, 0.2, 0.02]) cands.push({x: lecternBox.x + lecternBox.w * f, y: lecternBox.y + lecternBox.h + 10, anchor: f === 0.5 ? 'middle' : 'start'});
          cands.sort((a2, b2) => Math.hypot(a2.x - tg.x, a2.y - tg.y) - Math.hypot(b2.x - tg.x, b2.y - tg.y));
          const res = placer.place(cands, q => noteCallout(ctx, {name: `note${i}`, text: a.text, x: q.x, y: q.y, anchor: q.anchor, target: tg, maxWidth: mw, size, maxLines: 3}), tg, {maxDist: 460, register: false});
          const b = res.box;
          const sc = placer.scoreOf(res) + Math.hypot(b.x + b.w / 2 - tg.x, b.y + b.h / 2 - tg.y) * 1.5;
          if (sc < bestSc) { bestSc = sc; best = res; }
        }
        placer.addLabel(best.box);
        guardLead(best);
        notes.push(best);
      }
    };
    placeTags();
    placeNotes();
    return {stage, tags, finalTag, notes, who, s, ox, oy, finalMode, pl};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.tags.map(x => x.node),
      L.finalTag && L.finalTag.node,
      L.who && L.who.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const src = L.finalMode === 'source';
    const {v, capU} = actionValues(p, L.finalMode, u);
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const fade = w => (done ? r(seg(u, ...W[w]), 3) : 0);
    if (L.tags.length) {
      nodes['tag-note'] = {opacity: fade('tag0')};
      nodes['tag-int'] = {opacity: fade('tag1')};
      nodes['tag-src'] = {opacity: fade('tag2')};
    }
    if (L.finalTag) nodes['tag-final'] = {opacity: fade('tagF')};
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    const chainStops = ['note'];
    if (sem.chain1 >= 1) chainStops.push('intermediate');
    if (src && sem.chain2 >= 1) chainStops.push('source');
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        finalState: p.finalState,
        chainStops,
        cardRows: v.rows.map(q => r(q, 3)),
        actionCapped: p.actionProgress < 1 && u > capU,
      },
    };
  },
};

/**
 * Stage pose values at time u (the action is capped by actionProgress). Shared by frame() and by
 * the layout, which samples the arms over the whole timeline to keep the caption clear of them.
 */
function actionValues(p, finalMode, u) {
  const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
  const a = Math.min(u, capU);
  const s = w => seg(a, ...W[w]);
  const src = finalMode === 'source';
  const v = {
    type: seg(u, ...W.type), result: seg(u, ...W.result), plate: seg(u, ...W.plate),
    reach: s('reach'), pull: s('pull'), carry: s('carry'), release: s('release'), open: s('open'), away: s('away'),
    chain1: s('chain1'), pulse0: s('pulse0'), pulse1: s('pulse1'), noteHl: s('noteHl'), innerHl: s('innerHl'),
    rows: [s('row0'), s('row1'), src ? s('row2') : s('row2b')],
    cardLift: s('cardLift'),
  };
  if (src) Object.assign(v, {toBox: s('toBox'), lift: s('lift'), present: s('present'), chain2: s('chain2'), pulse2: s('pulse2'), pulse3: s('pulse3'), entryHl: s('entryHl')});
  else Object.assign(v, {handBack: s('handBack'), ghost2: s('ghost2'), pulse2: s('pulse2')});
  return {v, capU};
}

/**
 * Final-state tag (status-tag look) whose text may wrap to two balanced lines where the space
 * beside the card is narrow; it is never cut.
 */
function stateTag(ctx, text, o) {
  const size = o.size;
  const padX = size * 0.7, padY = size * 0.4;
  let inner = o.maxWidth - padX * 2 - size * 0.9;
  const fitOpts = {size, minSize: size * 0.82, maxLines: o.maxLines ?? 2, weight: 700};
  let fit = ctx.fit(text, {...fitOpts, maxWidth: inner});
  // too narrow for two lines: the tag widens rather than cutting the text
  while (fit.truncated && inner < 1200) { inner += 24; fit = ctx.fit(text, {...fitOpts, maxWidth: inner}); }
  if (fit.lines.length > 1 && !fit.truncated) {
    let lo = inner * 0.45, hi = inner;
    for (let i = 0; i < 10; i++) {
      const m = (lo + hi) / 2;
      const q = ctx.fit(text, {...fitOpts, maxWidth: m});
      if (q.lines.length === fit.lines.length && !q.truncated && q.size === fit.size) { fit = q; hi = m; } else lo = m;
    }
  }
  const w = fit.width + padX * 2 + size * 0.9;
  const hh = Math.max(size * 1.75, fit.height + padY * 2);
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const node = g({name: o.name, opacity: 0},
    h('rect', {x: r(x), y: r(o.y), width: r(w), height: r(hh), rx: r(Math.min(hh / 2, size * 0.875)), fill: ctx.theme.card, stroke: o.color, 'stroke-width': 2}),
    h('circle', {cx: r(x + padX + size * 0.2), cy: r(o.y + (fit.lines.length > 1 ? padY + fit.size * 0.5 : hh / 2)), r: r(size * 0.26), fill: o.color}),
    textBlock(fit, {x: r(x + padX + size * 0.75), y: r(o.y + (hh - fit.height) / 2 + fit.size * 0.02), fill: o.color, letterSpacing: 0.5}),
  );
  return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}};
}

/** Pose values of the final hold (for label placement). */
function finalPose(mode) {
  const base = {type: 1, result: 1, plate: 1, reach: 1, pull: 1, carry: 1, release: 1, open: 1, chain1: 1, rows: [1, 1, 1], cardLift: 1};
  return mode === 'source' ? {...base, toBox: 1, lift: 1, present: 1, chain2: 1} : {...base, handBack: 1, ghost2: 1};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-10-story',
    title: 'Citation traceability — a chain from the note to the source',
    titleEs: 'Trazabilidad de una cita — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Trazabilidad de una cita',
    treatment: 'story',
    family: 'staged-scene',
    description: 'First-person library bay: a brass chain hooks onto the footnote of an article, runs to the intermediate reference that the researcher’s hand pulls from its shelf and opens on a cradle, then from that book’s own footnote to the original entry the hand lifts out of an archive box. Supplied final state: traced to the source, or only to the intermediate (original unopened, dashed cited-in link). Descriptive only.',
    tags: ['citation', 'traceability', 'footnote', 'intermediate reference', 'source document', 'original', 'library', 'catalogue search', 'index card', 'chain', 'archive'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/trazabilidad-de-una-cita.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
