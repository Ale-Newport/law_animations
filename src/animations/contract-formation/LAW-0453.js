/**
 * LAW-0453 — Vencimiento de propuesta · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks and a
 * clock standing on Party B's rack, beside the proposal):
 *  0.00–0.15  rest: Party A's rack holds the PROPOSAL card (● its reference,
 *             title and terms), Party B's rack holds the RESPONSE card (◆ its
 *             reference and text). The clock's hand rests away from its single
 *             solid mark — the milestone as supplied, captioned "Milestone as
 *             supplied (illustrative)". The sequence strip is empty.
 *  0.15–0.42  the clock's hand starts towards the mark; the proposal travels from
 *             A to B and lands face up beside the clock; events add their stations.
 *  0.42–0.73  B takes the response card, it turns to its back and travels to A's
 *             rack, landing face up; the hand reaches the mark at the milestone's
 *             station (one equal step per station: the supplied order only, never
 *             a time scale) and moves on by the later stations. Each event adds its
 *             station (●/◆/dial, verb, the supplied fictional time label) to the
 *             strip "Sequence as supplied (illustrative)".
 *  0.73–1.00  hold: the supplied final state — "Response before / after the
 *             supplied milestone (as supplied)" under the strip's title, or the
 *             strip bracketed as a time sequence to be examined — and the key
 *             "As supplied · no conclusion drawn".
 * "Before" and "after" are positions relative to the supplied mark only. Nothing
 * says what follows from them: no state of the proposal or of the response is
 * shown or implied.
 * @module animations/contract-formation/LAW-0453
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, KIT_STRINGS, FINAL_STATES, layoutScene, buildScene, poseScene, localizeScene} from './kits/hito-propuesta.js';

const ID = 'LAW-0453';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// events are spread over [EV0, EV1] in the supplied order (even spacing: order only, not a time scale)
const EV0 = 0.3, EV1 = 0.68;
const W = {strip: [0.12, 0.16], final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85], clock: 0.17};

const STRINGS = KIT_STRINGS;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (sends the proposal)', 50), b: str('Caption for Party B (sends the response)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['proposal', 'response', 'sequence', 'clock']), 0, 2),
  finalState: oneOf('State supplied for the final hold: response-before or response-after (a tag stating the response\'s position relative to the supplied milestone, as supplied) or sequence-to-examine (the strip bracketed as a time sequence to be examined). No legal effect is inferred', FINAL_STATES),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Proposer', b: 'Addressee'},
  objectLabels: {outgoing: 'Rack A', incoming: 'Rack B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'response-before',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  parties: [{name: 'Nadia Park', role: 'Parte A'}, {name: 'Tomás Ribeiro', role: 'Parte B'}],
  offer: {reference: 'OF-2041', title: 'Oferta de suministro'},
  terms: [
    {key: 'item', label: 'Artículo', value: 'Sillas de roble'},
    {key: 'quantity', label: 'Cantidad', value: '40'},
  ],
  responses: [{reference: 'RS-2041', text: 'Respuesta a la propuesta OF-2041'}],
  sequence: [
    {event: 'proposal-received', time: 'Día 1, 09:00 (ficticio)'},
    {event: 'response-sent', time: 'Día 2, 10:00 (ficticio)'},
    {event: 'response-received', time: 'Día 2, 15:00 (ficticio)'},
    {event: 'milestone', time: 'Día 3, 12:00 (ficticio)'},
  ],
  actorLabels: {a: 'Proponente', b: 'Destinatario'},
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
    const posed = poseScene(ctx, L, a, {strip: W.strip, clockStart: W.clock, hold: {u, done, final: W.final, key: W.key, notes: W.notes}});
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
    slug: 'contract-formation-04-story',
    title: 'Proposal and a supplied milestone — an editable clock reaches its mark beside the proposal',
    titleEs: 'Vencimiento de propuesta — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Vencimiento de propuesta',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks and an editable clock on Party B\'s rack, beside the proposal. The proposal card (●) travels from A to B; B sends the response card (◆) back to A. The clock\'s hand turns one step per station of the supplied sequence and reaches its single mark — the milestone as supplied — at the milestone\'s station. Each event adds a station with its fictional time label to the strip "Sequence as supplied (illustrative)". The hold shows the supplied position of the response relative to the supplied milestone (before or after, as supplied) or a time sequence to be examined. No consequence of that position is shown or inferred.',
    tags: ['proposal', 'offer', 'response', 'milestone', 'clock', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/hito-propuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
