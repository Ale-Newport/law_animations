/**
 * LAW-0465 — Intención de vincularse · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks):
 *  0.00–0.15  rest: Party A's rack holds A's message (●), Party B's rack holds B's message (◆), at equal weight.
 *  0.15–0.42  the conversation: each party takes its own message in the supplied order of the "sent" events; the hand
 *             grips its edge, slides it out, the card turns and sets off; the routes cross.
 *  0.42–0.73  each message lands face up at the other party; then the context's station: the supplied surroundings
 *             draw themselves round the same conversation — a soft frame round the parties, racks and cards and the
 *             setting badge (two cups for a social gathering, a table with a notepad for a negotiation meeting) — and
 *             the band (from the rest) names the context "as supplied, no automatic conclusion". Nothing in the conversation changes.
 *  0.73–1.00  hold: "Context as supplied · nothing concluded from it" and the key "As supplied · no conclusion drawn".
 * No presumption about any kind of context, no intention to be bound, no binding force, enforceability, validity,
 * formation or outcome; no jurisdiction.
 * @module animations/contract-formation/LAW-0465
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, KIT_STRINGS, FINAL_STATES, SETTINGS, layoutScene, buildScene, poseScene, localizeScene} from './kits/intencion-vincularse.js';

const ID = 'LAW-0465';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// events are spread over [EV0, EV1] in the supplied order (even spacing: order only, not a time scale)
const EV0 = 0.24, EV1 = 0.68;
const W = {strip: [0.12, 0.16], final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};

const STRINGS = KIT_STRINGS;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (sends message ●)', 50), b: str('Caption for Party B (sends message ◆)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['messageA', 'messageB', 'sequence']), 0, 2),
  finalState: oneOf('Final state supplied for the hold: context-as-supplied (a tag "Context as supplied · nothing concluded") or sequence-to-examine (the strip bracketed as a time sequence to be examined). No legal effect is inferred from either', FINAL_STATES),
  setting: oneOf('The supplied setting of the context — surroundings only (a badge: two cups for a social gathering, a table with a notepad for a negotiation meeting); nothing is concluded from it', SETTINGS),
  contextLabel: str('The context as supplied, in a few words (shown in the band, said to conclude nothing automatically)', 50),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Sends message M-401', b: 'Sends message M-402'},
  objectLabels: {outgoing: 'Rack A', incoming: 'Rack B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'context-as-supplied',
  setting: 'social',
  contextLabel: 'a social gathering',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  parties: [{name: 'Priya Nair', role: 'Parte A'}, {name: 'Jonas Weber', role: 'Parte B'}],
  offer: {reference: 'M-401', title: 'Puedo llevarnos a la feria'},
  terms: [
    {key: 'item', label: 'Día', value: 'Sábado'},
    {key: 'quantity', label: 'Asientos', value: 'Dos'},
  ],
  responses: [{reference: 'M-402', text: 'Comparto el gasto de gasolina'}],
  sequence: [
    {event: 'messageA-sent', time: 'Día 1, 18:00 (ficticio)'},
    {event: 'messageB-sent', time: 'Día 1, 18:05 (ficticio)'},
    {event: 'messageA-received', time: 'Día 1, 18:10 (ficticio)'},
    {event: 'messageB-received', time: 'Día 1, 18:15 (ficticio)'},
    {event: 'context', time: 'Reunión social'},
  ],
  actorLabels: {a: 'Envía el mensaje M-401', b: 'Envía el mensaje M-402'},
  objectLabels: {outgoing: 'Casillero A', incoming: 'Casillero B'},
  annotations: [],
  contextLabel: 'una reunión social',
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
      plates: p.objectLabels, ev: [EV0, EV1], contextLabel: p.contextLabel, setting: p.setting,
      // (five stations with the context: rows of three as well)
      arrs: shape === 'landscape' ? [{arr: 'row', strip: 'below', cols: 5}, {arr: 'row', strip: 'below', cols: 3}, {arr: 'row', strip: 'mid', cols: 2}]
        : shape === 'square' ? [{arr: 'row', strip: 'below', cols: 3}, {arr: 'row', strip: 'below', cols: 2}, {arr: 'stack', strip: 'mid', cols: 1}, {arr: 'row', strip: 'below', cols: 5}]
          : [{arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 2}, {arr: 'stack', strip: 'below', cols: 1}, {arr: 'stack', strip: 'below', cols: 3}],
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
        contextLabel: p.contextLabel,
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
    slug: 'contract-formation-07-story',
    title: 'Intention to be bound, without a conclusion — the supplied context surrounds the same conversation',
    titleEs: 'Intención de vincularse — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Intención de vincularse',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks hold a conversation: Party A sends its message (●) and Party B its message (◆), at equal weight; the routes cross and each message lands at the other party. Then the supplied context draws itself round the same conversation — a soft frame and a setting badge (two cups for a social gathering, a table with a notepad for a negotiation meeting) — and the band names the context as supplied, with no automatic conclusion. Each event adds a station with its fictional label to the strip "Sequence as supplied (illustrative)". No presumption, no intention to be bound, no legal effect is stated.',
    tags: ['conversation', 'message', 'context', 'setting', 'surroundings', 'no automatic conclusion', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/intencion-vincularse.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
