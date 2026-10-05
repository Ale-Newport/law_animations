/**
 * LAW-0133 — Ámbito temporal · story
 *
 * Storyboard (top-down reading desk; reader A leans in from the top edge,
 * reader B from the bottom edge — the left edge in portrait):
 *  0.00–0.15  rest: the editable hierarchy stand (one compartment per
 *             user-supplied level) holds the source books; Text 1 lies open
 *             with the ARTICLE card on its right page; the wooden timeline
 *             ruler is graduated in fictional days and the fact cards lie
 *             around it, each tied by a thread to a pin at its supplied day.
 *  0.15–0.42  A pinches the article card, lifts it off the book (the empty
 *             outline stays on the page) and carries it towards the ruler;
 *             B reaches up and takes it at a shared point (both hands hold the
 *             card for a moment, then A lets go and withdraws).
 *  0.42–0.73  B lowers the card against the ruler so its tape housing meets
 *             the supplied START day, then pulls the tape clip along the ruler
 *             to the supplied END day: the norm now lies over the interval.
 *             Each pin the tape covers turns tape-blue as the clip passes it
 *             (cause before effect); once the tape is laid, pins beyond it
 *             turn hollow and a pin on a boundary day half-amber. The fact
 *             cards then show their strip: inside / outside / not classified.
 *  0.73–1.00  hold: B withdraws; the supplied final state stays readable.
 *             Nothing is inferred beyond positions on the ruler: no rule,
 *             effect or outcome is stated.
 * @module animations/sources/LAW-0133
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {scopeFields, readersField, SCOPE_DEFAULTS, SCOPE_STRINGS, scopeData, scopeDesk, DESK, placeCallout, stateTag, bestSpot, stateColors, overlaps} from './kits/ambito-temporal.js';

const ID = 'LAW-0133';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows. */
const W = {
  aReach: [0.07, 0.17], lift: [0.17, 0.22], aCarry: [0.22, 0.34], bReach: [0.25, 0.34], handoff: [0.34, 0.38],
  aBack: [0.38, 0.5], bCarry: [0.38, 0.5], bToTab: [0.5, 0.55], pull: [0.55, 0.67],
  classifyRest: [0.67, 0.7], strips: [0.69, 0.73], bBack: [0.68, 0.78], note: [0.79, 0.87],
};
const ACTION_END = 0.78;

const sceneSchema = {
  ...scopeFields,
  ...readersField,
  ...storyFields({
    interval: str('Caption printed on the article card above the interval (defaults to the built-in "Supplied interval")', 40),
  }, ['article', 'interval', 'inside', 'outside', 'book'], ['facts-marked', 'interval-placed', 'article-taken']),
};

const defaultParams = {
  ...SCOPE_DEFAULTS,
  readers: [{name: 'Rin Park', role: 'Reader A'}, {name: 'Ada Mensah', role: 'Reader B'}],
  actorLabels: {a: 'Reader A', b: 'Reader B'},
  objectLabels: {interval: 'Supplied interval'},
  actionProgress: 1,
  annotations: [{target: 'interval', text: 'The tape covers the supplied interval'}],
  finalState: 'facts-marked',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

/** Inverse of ease.inOutCubic (for the moment the tape clip reaches a pin). */
function invInOutCubic(y) {
  const v = clamp(y);
  return v < 0.5 ? Math.cbrt(v / 4) : 1 - Math.cbrt(2 * (1 - v)) / 2;
}

const scene = {
  sizes: {landscape: [DESK.horizontal.w, DESK.horizontal.h], square: [DESK.square.w, DESK.square.h], portrait: [DESK.vertical.w, DESK.vertical.h]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const axis = AXIS[ctx.view.shape];
    const st = DESK[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const d = scopeData(p);
    // frame pixels per desk unit (the desk sizes its text from it: key text ≥ ~19 px, all text ≥ ~16 px)
    const pxu = s * Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h);
    const desk = scopeDesk(ctx, {prefix: 'dk', axis, p, d, readers: p.readers, actorLabels: p.actorLabels, intervalLabel: p.objectLabels.interval, pxu});
    const C = stateColors(ctx);
    const hor = axis !== 'vertical';

    // --- moments at which the tape clip covers each inside pin
    const span = desk.endA - desk.startA;
    const factTimes = d.facts.map(f => {
      if (f.state !== 'inside' || span <= 0) return null;
      const frac = (desk.geo.along(f.day) - desk.startA) / span;
      return lerp(W.pull[0], W.pull[1], invInOutCubic(frac));
    });

    // --- free zones for the state tag and editorial callouts
    const g0 = desk.geo;
    const cardBox = p.finalState === 'article-taken' ? null : desk.cardDestBox;
    const obstacles = [
      desk.standBox, g0.box, ...desk.factBoxes, ...desk.handBoxes, ...desk.chipBoxes,
      ...(cardBox ? [cardBox] : []),
      ...(p.finalState === 'article-taken' ? [desk.handoffBox] : []),
    ];
    // free desk: the band between the stand and the ruler (horizontal) / the card column (vertical),
    // the corner right of the stand, and (vertical) the facts column
    const zones = hor
      ? [{x: 16, y: desk.standBottom + 12, w: st.w - 32, h: g0.e0 - desk.standBottom - 22}, desk.topFree]
      : [{x: 14, y: desk.standBottom + 12, w: g0.e0 - 26, h: desk.winH - desk.standBottom - 24}, desk.topFree, {x: g0.e1 + 18, y: desk.standBottom + 12, w: st.w - g0.e1 - 32, h: desk.winH - desk.standBottom - 24}];
    // --- annotation targets
    const pinOf = state => {
      const i = d.facts.findIndex(f => f.state === state);
      return i < 0 ? null : desk.pins[i];
    };
    const mid = g0.at((d.start + d.end) / 2, 0);
    // a point on the tape's card-side edge, beside the card (free space is on that side)
    const tapeTarget = (() => {
      if (!cardBox) return mid;
      const a0 = hor ? cardBox.x + cardBox.w + 16 : cardBox.y + cardBox.h + 16;
      const lo = desk.startA + 10, hi = desk.endA - 10;
      const along = hi > lo ? clamp(Math.max(a0, (lo + hi) / 2), lo, hi) : (desk.startA + desk.endA) / 2;
      return hor ? {x: along, y: g0.e0 + 9} : {x: g0.e0 + 9, y: along};
    })();
    const targets = {
      article: cardBox ? {x: cardBox.x + cardBox.w * 0.5, y: cardBox.y + 6} : desk.handoffPoint,
      interval: tapeTarget,
      inside: pinOf('inside') || mid,
      outside: pinOf('outside') || mid,
      book: desk.openBookBox ? {x: desk.openBookBox.x + desk.openBookBox.w * 0.25, y: desk.openBookBox.y + desk.openBookBox.h - 6} : mid,
    };
    // text hierarchy: callouts and the state tag never exceed the smallest fact text on the desk
    const capSize = v => Math.min(v, L0factSize);
    const L0factSize = Math.min(desk.factSize ?? 99, desk.nameSize ?? 99);
    const notes = [];
    if (ctx.show('all')) {
      p.annotations.forEach((a, i) => {
        const note = placeCallout(ctx, {name: `note${i}`, text: a.text, target: targets[a.target], zones, obstacles, maxWidth: hor ? 460 : 380, size: capSize(24), maxLines: 6});
        if (note) {
          notes.push(note);
          obstacles.push(note.box);
        }
      });
    }
    const stateText = p.finalState === 'facts-marked' ? t.stateMarked : p.finalState === 'interval-placed' ? t.statePlaced : t.stateLifted;
    let tag = null;
    if (ctx.show('key')) {
      // close to the article card (or the hand-off point when the article is not placed);
      // narrower, taller variants are tried for tight layouts
      const near = cardBox ? {x: cardBox.x + cardBox.w, y: cardBox.y + cardBox.h / 2} : desk.handoffPoint;
      for (const mw of [hor ? 560 : 420, 360, 290, 240]) {
        const tg = stateTag(ctx, stateText, {name: 'state-tag', size: capSize(24), maxWidth: mw, maxLines: 3, color: p.finalState === 'facts-marked' ? C.inside : ctx.theme.inkSoft});
        const spot = bestSpot(tg.w, tg.h, zones, obstacles, near, {pad: 14, noLeader: true});
        if (spot) {
          tag = {node: tg.build(spot.x, spot.y), box: {x: spot.x, y: spot.y, w: tg.w, h: tg.h}};
          obstacles.push(tag.box);
          break;
        }
      }
    }
    return {desk, s, ox, oy, d, factTimes, tag, notes};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.desk.node,
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const places = p.finalState !== 'article-taken';
    const marks = p.finalState === 'facts-marked';
    const on = (flag, w) => (flag ? seg(a, ...w) : 0);
    const v = {
      aReach: seg(a, ...W.aReach), lift: seg(a, ...W.lift), aCarry: seg(a, ...W.aCarry), bReach: seg(a, ...W.bReach),
      handoff: seg(a, ...W.handoff), aBack: seg(a, ...W.aBack),
      bCarry: on(places, W.bCarry), bToTab: on(places, W.bToTab), pull: on(places, W.pull), bBack: on(places, W.bBack),
    };
    // pins turn as the clip passes them; the rest once the tape is laid
    v.classify = L.d.facts.map((f, i) => {
      if (!marks) return 0;
      const ti = L.factTimes[i];
      return ti === null ? seg(a, ...W.classifyRest) : seg(a, ti, ti + 0.012);
    });
    v.strips = L.d.facts.map((f, i) => {
      if (!marks) return 0;
      const ti = L.factTimes[i];
      return ti === null ? seg(a, ...W.strips) : seg(a, ti + 0.015, ti + 0.05);
    });
    const posed = L.desk.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    // where the hands are relative to the fact cards (a hand must not rest or pass on a card in the hold)
    const onFacts = q => (q ? L.desk.factBoxes.map((b, i) => (overlaps(L.desk.handBoxOf(q), b, -2) ? i : -1)).filter(i => i >= 0) : []);
    const box = b => b && {x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat,
      handOnFacts: {A: onFacts(posed.semantic.handA), B: onFacts(posed.semantic.handB)},
      chips: {A: box(L.desk.chipA), B: box(L.desk.chipB), restA: L.desk.restA, restB: L.desk.restB}, deskWinH: L.desk.winH, cardBeforeStart: L.desk.cardBeforeStart, pullOnCardSide: L.desk.pullOnCardSide, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU, expectedStates: L.d.facts.map(f => f.state)}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-04-story',
    title: 'Temporal scope — the article laid over a supplied interval',
    titleEs: 'Ámbito temporal — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito temporal',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down reading desk: reader A takes the article card out of the open source book on the editable hierarchy stand and hands it to reader B, who sets it against a timeline ruler at the supplied start day and pulls its tape to the supplied end day. Fact cards pinned around the ruler show whether their day lies inside or outside the supplied interval; a boundary day stays not classified.',
    tags: ['sources', 'temporal scope', 'interval', 'timeline', 'ruler', 'facts', 'book', 'hierarchy', 'hand-off', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-temporal.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: SCOPE_STRINGS,
  scene,
});
