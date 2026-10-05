/**
 * LAW-0157 — Regla transitoria · story
 *
 * Storyboard (top-down desk; reader A leans in from the top edge, reader B
 * from the bottom edge):
 *  0.00–0.15  rest: the editable hierarchy rack lists the user-supplied
 *             levels (spine-coloured tabs mark the level of each version);
 *             "Version 1 (fictional)" and "Version 2 (fictional)" lie bound
 *             at the two ends of a wooden ruler graduated in fictional days;
 *             the transitional band is still rolled up against version 1;
 *             the milestone post lies in its holder; a paper tag
 *             "Day 20 (supplied milestone)" lies at the supplied day; the case
 *             cards wait stacked in a tray at the left end of the card row (only
 *             the top card is readable); an attributed reading note.
 *  0.10–0.32  A takes the roll and pulls the band along the ruler, unrolling
 *             it (its printed passage appears as it unrolls) until its end is
 *             tucked under version 2: the band now bridges the two versions.
 *  0.08–0.72  meanwhile B (resting under the tray) reaches the tray and deals
 *             the case cards one at a time, latest slot first: grip the top
 *             card, slide it right along the row to its supplied day (it only
 *             passes over empty slots) and let its pin drop into the ruler at
 *             that day (a thread ties card and pin).
 *  0.32–0.48  A lifts the post out of the holder, turns it upright and plants
 *             it into the band's lane through the tag's eyelet at the
 *             supplied milestone day; from the post the lane is marked out:
 *             amber hatch towards version 1 (before), blue dots towards
 *             version 2 (after). A pinned card's strip changes only once the
 *             marking reaches its pin (cause before effect).
 *  0.72–1.00  hold: both readers withdraw; each card reads "before / after /
 *             on the supplied milestone"; the neutral key says positions are
 *             as supplied and no conclusion is drawn on which version applies.
 *             Nothing states the transitional provision's effect or an outcome.
 * @module animations/sources/LAW-0157
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {transitionFields, RT_DEFAULTS, RT_STRINGS, rtData, bandDesk, sizeStageW, stageFit, overlaps} from './kits/regla-transitoria.js';
import {placeCallout} from './kits/ambito-temporal.js';

const ID = 'LAW-0157';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows. */
const W = {
  aReach: [0.05, 0.155], pull: [0.155, 0.29], toPost: [0.29, 0.38], carry: [0.38, 0.46], plant: [0.45, 0.48],
  aBack: [0.5, 0.6], zones: [0.48, 0.54], deal: [0.16, 0.72], bReach0: 0.08, bBack: [0.72, 0.85], notes: [0.85, 0.91],
};
const ACTION_END = 0.85;
const KEY_PX = 20.6;
/** portrait has height to spare: larger text for phone viewing */
const KEY_PX_TALL = 26;

const sceneSchema = {
  ...transitionFields,
  ...storyFields({
    tray: str('Label printed on the tray the cases are dealt from', 50),
  }, ['band', 'milestone', 'before', 'after'], ['cases-placed', 'milestone-set', 'band-laid']),
};

const defaultParams = {
  ...RT_DEFAULTS,
  actorLabels: {a: 'Reader A', b: 'Reader B'},
  objectLabels: {tray: 'Supplied cases'},
  actionProgress: 1,
  annotations: [{target: 'band', text: 'The band bridges the two versions'}],
  finalState: 'cases-placed',
};

const MODE = {landscape: 'wide', square: 'square', portrait: 'tall'};
const STAGE_W = {wide: 1900, square: 1080, tall: 900};

/** Inverse of ease.outCubic. */
const invOutCubic = y => 1 - Math.cbrt(1 - clamp(y));

/** Deal schedule: per card [start, end] inside the deal window. */
function dealWindows(n) {
  const span = (W.deal[1] - W.deal[0]) / n;
  return Array.from({length: n}, (_, i) => [W.deal[0] + i * span, W.deal[0] + (i + 1) * span]);
}
const DEAL = {reach: [0, 0.4], grip: [0.4, 0.44], slide: [0.44, 0.86], pin: [0.86, 1]};

const scene = {
  sizes: {landscape: [1900, 900], square: [1080, 900], portrait: [900, 1340]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const mode = MODE[ctx.view.shape];
    const Wst = STAGE_W[mode];
    const d = rtData(p);
    const stateText = p.finalState === 'cases-placed' ? t.statePlaced : p.finalState === 'milestone-set' ? t.stateMilestone : t.stateBand;
    const build = (Wd, K) => bandDesk(ctx, {
      prefix: 'dk', mode, W: Wd, K, p, d, stableDom: true,
      // (the resting hand and its sleeve keep clear of the reading note on their right)
      restAInset: K * 1.9, shoulderADx: -K * 2.2,
      // (the key and state chips at the content size: ≥ 19.5 px in the baseline square frame)
      capRatio: 1,
      trayLabel: p.objectLabels.tray, actorLabels: p.actorLabels,
      keyText: t.key, stateText, calloutTexts: ctx.show('all') ? p.annotations.map(a => a.text) : [],
    });
    // key text ≥ ~20 px at 1080p: size the desk text from its own on-screen scale
    let sized = sizeStageW(ctx, build, mode === 'square' ? [Wst, Wst * 1.1, Wst * 1.2, Wst * 1.3, Wst * 1.4] : [Wst], mode === 'tall' ? KEY_PX_TALL : KEY_PX);
    // fine refinement (quarter-unit steps, slightly different widths) when the target was not reached
    if (sized.px < (mode === 'tall' ? KEY_PX_TALL : KEY_PX) - 0.1) {
      const W0 = sized.desk.W, K0 = sized.K;
      for (const fw of [1, 0.94, 0.97, 1.03, 1.06, 1.1]) {
        for (let k = K0 + 0.25; k <= K0 * 1.08; k += 0.25) {
          const dk = build(W0 * fw, k);
          if (dk.broken) continue;
          const f = stageFit(ctx, dk.W, dk.H);
          if (k * f.pxu > sized.px) sized = {desk: dk, fit: f, px: k * f.pxu, K: k};
        }
      }
    }
    const desk = sized.desk;
    const fit = sized.fit;

    // --- milestone and sides
    const mX = desk.along(d.milestone);
    // --- when each card's strip may show: once its pin is in AND the lane marking has reached it
    const dw = dealWindows(d.cases.length);
    const marks = p.finalState === 'cases-placed';
    const zoneStart = W.zones[0], zoneLen = W.zones[1] - W.zones[0];
    const stripAt = d.cases.map((c, i) => {
      const k = desk.rank[i];
      const pinT = lerp(dw[k][0], dw[k][1], DEAL.pin[1]);
      const reach = Math.max(1, (c.day <= d.milestone ? mX - desk.bandX0 : desk.bandX1 - mX));
      const sweepT = zoneStart + zoneLen * invOutCubic(Math.min(1, Math.abs(desk.pinXs[i] - mX) / reach));
      return Math.max(pinT, sweepT);
    });

    // --- editorial annotations in the free zone above the band (never over the tag or the holder)
    const obstacles = [desk.tagBox(mX), desk.holder].filter(Boolean);
    // targets on the ribbon's top edge, tried from the preferred point outwards, never under the tag
    const tb = desk.tagBox(mX);
    const edge = (x0, x1, pref) => {
      const xs = [];
      for (let k = 0; k <= 12; k++) xs.push(lerp(x0, x1, k / 12));
      return xs.filter(x => x < tb.x - 24 || x > tb.x + tb.w + 24).sort((p1, p2) => Math.abs(p1 - pref) - Math.abs(p2 - pref)).map(x => ({x, y: desk.ribbonTop + 2}));
    };
    const targetsOf = {
      band: () => edge(desk.bandX0 + 30, desk.bandX1 - 30, desk.bandX0 + 120),
      before: () => edge(desk.bandX0 + 24, mX - 30, (desk.bandX0 + mX) / 2),
      after: () => edge(mX + 30, desk.bandX1 - 24, (mX + desk.bandX1) / 2),
      milestone: () => [{x: tb.x + tb.w, y: tb.y + tb.h * 0.5}, {x: tb.x, y: tb.y + tb.h * 0.5}, {x: tb.x + tb.w / 2, y: tb.y}],
    };
    const notes = [];
    if (ctx.show('all')) {
      p.annotations.forEach((an, i) => {
        for (const target of targetsOf[an.target]()) {
          const note = placeCallout(ctx, {name: `note${i}`, text: an.text, target, zones: [desk.zone], obstacles, maxWidth: Math.min(desk.zone.w - 28, 34 * desk.K), altWidths: [desk.zone.w * 0.8, desk.zone.w * 0.64, 400, 340, 280, 240, 200, 170], size: desk.capSize, maxLines: 6, minLead: 10, maxLead: 1000, maxHostRun: 1000});
          if (note) {
            notes.push(note);
            obstacles.push(note.box);
            break;
          }
        }
      });
    }
    return {desk, fit, d, mX, dw, stripAt, notes, marks, textPx: sized.px};
  },
  build(ctx, L) {
    return g({transform: T(L.fit.ox, L.fit.oy, 0, L.fit.s)},
      L.desk.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const d = L.d;
    const desk = L.desk;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const plants = p.finalState !== 'band-laid';
    const deals = p.finalState === 'cases-placed';

    // --- reader A: band, then (unless band-laid) the post
    const band = seg(a, ...W.pull);
    let aPose;
    if (a < W.aReach[0]) aPose = {phase: 'rest', p: 0};
    else if (a < W.pull[0]) aPose = {phase: 'reach', p: seg(a, ...W.aReach)};
    else if (a < W.toPost[0]) aPose = {phase: 'pull', p: 0};
    else if (!plants) aPose = {phase: 'back', from: 'roll', p: seg(a, W.toPost[0], W.toPost[0] + 0.1)};
    else if (a < W.carry[0]) aPose = {phase: 'toPost', p: seg(a, ...W.toPost)};
    else if (a < W.plant[1]) aPose = {phase: 'carry', p: 0};
    else if (a < W.aBack[0]) aPose = {phase: 'hold', p: 0};
    else aPose = {phase: 'back', from: 'post', p: seg(a, ...W.aBack)};
    const postState = !plants || a < W.carry[0] ? 'parked' : a < W.plant[1] ? 'carried' : 'planted';
    const zones = plants ? seg(a, ...W.zones) : 0;

    // --- reader B: deals the cards one by one
    const cards = d.cases.map(() => ({state: 'deck', slide: 0, up: 0, pin: 0, strip: 0}));
    let bHand = {kind: 'rest'};
    let bHolds = null;
    if (deals) {
      // cards are dealt in deck order (rank 0 = top card = rightmost slot)
      const order = d.cases.map((c, i) => i).sort((x, y) => desk.rank[x] - desk.rank[y]);
      let prev = desk.restB;
      for (let k = 0; k < order.length; k++) {
        const i = order[k];
        const [t0, t1] = L.dw[k];
        const l = seg(a, t0, t1);
        const at = w => seg(l, ...w);
        const c = cards[i];
        if (a >= t1) {
          Object.assign(c, {state: 'slot', pin: 1});
          prev = desk.slotGrip(i);
          continue;
        }
        if (a < t0) {
          if (k === 0 && a >= W.bReach0) bHand = {kind: 'to', from: prev, to: desk.deckGrip(i), e: seg(a, W.bReach0, lerp(t0, t1, DEAL.reach[1]))};
          break;
        }
        // (the first reach starts early: B rests at the far end of the desk)
        if (l < DEAL.reach[1]) bHand = {kind: 'to', from: prev, to: desk.deckGrip(i), e: k === 0 ? seg(a, W.bReach0, lerp(t0, t1, DEAL.reach[1])) : at(DEAL.reach)};
        else if (l < DEAL.slide[0]) bHand = {kind: 'card', card: i};
        else if (l < DEAL.pin[0]) {
          Object.assign(c, {state: 'moving', slide: at(DEAL.slide)});
          bHand = {kind: 'card', card: i};
          bHolds = `card${i}`;
        } else {
          Object.assign(c, {state: 'slot', pin: at(DEAL.pin)});
          bHand = {kind: 'card', card: i};
        }
        break;
      }
      const lastI = order[order.length - 1];
      const lastT = L.dw[order.length - 1][1];
      if (a >= lastT) bHand = {kind: 'to', from: desk.slotGrip(lastI), to: desk.restB, e: seg(a, ...W.bBack)};
      if (L.marks) cards.forEach((c, i) => { c.strip = seg(a, L.stripAt[i], L.stripAt[i] + 0.03); });
    }
    const posed = desk.pose({band, a: aPose, postState, carry: seg(a, ...W.carry), plant: seg(a, ...W.plant), zones, cards, bHand});
    const nodes = posed.nodes;

    // --- notes (key, state tag, annotations) in the hold, after the action
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.notes) : 0;
    for (const nm of ['dk-key', 'dk-state']) nodes[nm] = {opacity: r(clamp(noteP * 1.6), 3)};
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));

    const s = posed.semantic;
    const cardHolder = cards.map((c, i) => (c.state === 'deck' ? 'tray' : c.state === 'moving' ? 'B' : 'slot'));
    const sides = cards.map((c, i) => (c.strip >= 1 ? d.cases[i].side : 'neutral'));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    // hands at rest must not lie on a card, the tag, a note, the reading note or the level rack
    const handOn = q => (q ? [...desk.slots, desk.tagBox(L.mX), ...desk.notes, desk.note, desk.rack].filter(Boolean).filter(b => overlaps(desk.handBox(q), b, -2)).length : 0);
    const semantic = {
      ...s, beat, cardHolder, sides,
      expectedSides: d.cases.map(c => c.side),
      postState, zones: r(zones, 3),
      milestoneX: r(L.mX), postOnMilestone: postState === 'planted' ? Math.abs(s.post.x - L.mX) < 0.5 : null,
      sidesKept: desk.sidesKept,
      cardsLeftOfPost: cards.map((c, i) => (c.state === 'slot' ? desk.slotCx[i] < L.mX : null)),
      pinsX: desk.pinXs.map(x => r(x)),
      card0: s.cards[0], cardGrip0: s.cardGrips[0],
      card1: s.cards[1] || null, cardGrip1: s.cardGrips[1] || null,
      card2: s.cards[2] || null, cardGrip2: s.cardGrips[2] || null,
      handOnStuff: {A: handOn(s.handA), B: handOn(s.handB)},
      finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU,
      notesShown: r(noteP, 3),
      textPx: r(L.textPx, 2),
      broken: desk.brokenList,
      notesPlaced: L.notes.length, zone: desk.zone, tagBox: desk.tagBox(L.mX), holder: desk.holder,
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
    slug: 'sources-10-story',
    title: 'Transitional rule — a band between two versions sorts cases by date',
    titleEs: 'Regla transitoria — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Regla transitoria',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down desk: reader A unrolls a transitional band from version 1 to version 2 of a fictional text along a timeline ruler and plants a milestone post at the supplied relative day; reader B deals the case cards to their supplied days and pins them. Each card then reads only "before / after the supplied milestone"; the key says no conclusion is drawn on which version applies.',
    tags: ['sources', 'transitional rule', 'versions', 'milestone', 'timeline', 'ruler', 'cases', 'band', 'hierarchy', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/regla-transitoria.js', 'src/animations/sources/kits/ambito-temporal.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RT_STRINGS,
  scene,
});
