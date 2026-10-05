/**
 * LAW-0457 — Intercambio de promesas · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks):
 *  0.00–0.15  rest: Party A's rack holds A's commitment card (● its reference,
 *             title, terms and "Holder: <A>"), Party B's rack holds B's commitment
 *             card (◆ its reference, text and "Holder: <B>"). The strip is empty.
 *  0.15–0.42  each party takes its own card in the supplied order of the "sent"
 *             events: the hand grips its edge, slides it out, the card turns to
 *             its back and sets off. The two routes cross: the commitments cross
 *             between the parties.
 *  0.42–0.73  each card lands face up at the OTHER party, in the supplied order of
 *             the "received" events — still printing its own holder, its route still
 *             joined to its holder's rack (the commitment changes hands, not its
 *             holder). Each event adds its station (●/◆, verb, fictional time label)
 *             to the strip "Sequence as supplied (illustrative)".
 *  0.73–1.00  hold: the supplied configuration — "Reciprocal commitments (as
 *             supplied)" or "Unilateral promise (as supplied)", or the strip
 *             bracketed as a time sequence to be examined — and the key "As supplied
 *             · no conclusion drawn".
 * A unilateral configuration (only A's commitment in the supplied sequence) shows
 * one card and one route, with no empty or "missing" slot. Nothing says whether a
 * commitment binds or is enforceable, whether anything is given in exchange or
 * whether a contract is formed.
 * @module animations/contract-formation/LAW-0457
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, KIT_STRINGS, FINAL_STATES, layoutScene, buildScene, poseScene, localizeScene} from './kits/intercambio-promesas.js';

const ID = 'LAW-0457';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// events are spread over [EV0, EV1] in the supplied order (even spacing: order only, not a time scale)
const EV0 = 0.24, EV1 = 0.68;
const W = {strip: [0.12, 0.16], final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};

const STRINGS = KIT_STRINGS;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (holder of commitment ●)', 50), b: str('Caption for Party B (holder of commitment ◆)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['commitmentA', 'commitmentB', 'sequence']), 0, 2),
  finalState: oneOf('Configuration supplied for the final hold: reciprocal (a tag "Reciprocal commitments, as supplied"), unilateral (a tag "Unilateral promise, as supplied") or sequence-to-examine (the strip bracketed as a time sequence to be examined). It only names who holds which commitment; no legal effect is inferred', FINAL_STATES),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Holder of C-101', b: 'Holder of C-102'},
  objectLabels: {outgoing: 'Rack A', incoming: 'Rack B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'reciprocal',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  parties: [{name: 'Nadia Park', role: 'Parte A'}, {name: 'Tomás Ribeiro', role: 'Parte B'}],
  offer: {reference: 'C-101', title: 'Suministrar 40 sillas'},
  terms: [
    {key: 'item', label: 'Artículo', value: 'Sillas de roble'},
    {key: 'quantity', label: 'Cantidad', value: '40'},
  ],
  responses: [{reference: 'C-102', text: 'Pagar las 40 sillas'}],
  sequence: [
    {event: 'commitmentA-sent', time: 'Día 1, 09:00 (ficticio)'},
    {event: 'commitmentB-sent', time: 'Día 1, 09:30 (ficticio)'},
    {event: 'commitmentA-received', time: 'Día 1, 11:00 (ficticio)'},
    {event: 'commitmentB-received', time: 'Día 1, 11:30 (ficticio)'},
  ],
  actorLabels: {a: 'Titular de C-101', b: 'Titular de C-102'},
  objectLabels: {outgoing: 'Casillero A', incoming: 'Casillero B'},
  annotations: [],
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const captions = [0, 1].map(i => (p.actorLabels[i ? 'b' : 'a'] ? `${p.parties[i].name} · ${p.actorLabels[i ? 'b' : 'a']}` : p.parties[i].name));
    // people at least this large (px at 1080p) before the text steps down (never under 19.6 px while a layout fits there)
    const headTarget = shape === 'landscape' ? 120 : shape === 'portrait' ? 120 : 85;
    return layoutScene(ctx, p, {
      box: {x: 6, y: 4, w: D.w - 12, h: D.h - 8}, shape, upx: unitPx(ctx), prefix: '', headTarget,
      sequence: p.sequence, finalState: p.finalState, annotations: p.annotations, showFinal: true, captions,
      plates: p.objectLabels, ev: [EV0, EV1],
      arrs: shape === 'landscape' ? [{arr: 'row', strip: 'below', cols: 5}, {arr: 'row', strip: 'below', cols: 3}, {arr: 'row', strip: 'mid', cols: 2}] : undefined,
      // (a card in flight never passes over the other card's slots)
      clearRacks: true,
    });
  },
  build(ctx, L) {
    return buildScene(ctx, L);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], BEATS.hold[0] + 0.02, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const posed = poseScene(ctx, L, a, {strip: W.strip, hold: {u, done, final: W.final, key: W.key, notes: W.notes}});
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes: posed.nodes,
      semantic: {
        beat,
        ...posed.sem,
        finalState: p.finalState,
        flightGap: r(L.sepMin, 1),
        layoutOk: L.ok,
        why: L.why.join(','),
        problems: L.problems,
        textPx: r(L.F * L.upx, 2),
        headPx: r(88 * L.G.k * L.upx, 1),
        actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'contract-formation-05-story',
    title: 'Exchange of promises — two commitments cross between the parties and keep their holders',
    titleEs: 'Intercambio de promesas — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Intercambio de promesas',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks. Each takes its own commitment card (● Party A\'s, ◆ Party B\'s, each printing its holder) and sends it along its route; the routes cross and each card lands face up at the other party, still printing its own holder, its route still joined to its holder\'s rack. Each event adds a station with its fictional time label to the strip "Sequence as supplied (illustrative)". The hold shows the supplied configuration (reciprocal commitments, a unilateral promise, or a time sequence to be examined). A unilateral configuration shows one card and one route, with no empty slot. No legal effect is inferred.',
    tags: ['promise', 'commitment', 'exchange', 'holder', 'reciprocal', 'unilateral', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/intercambio-promesas.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
