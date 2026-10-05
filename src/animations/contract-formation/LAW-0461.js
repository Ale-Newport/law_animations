/**
 * LAW-0461 — Consideration como concepto · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks):
 *  0.00–0.15  rest: Party A's rack holds A's PROMISE token (● its reference, the promise and its terms), Party B's
 *             rack holds B's PERFORMANCE token (◆ its reference and the performance as supplied), at equal weight.
 *             The band names the concept label as supplied and illustrative.
 *  0.15–0.42  each party takes its own token in the supplied order of the "sent" events: the hand grips its edge,
 *             slides it out, the token turns and sets off; the routes cross.
 *  0.42–0.73  each token lands face up at the other party in the supplied order of the "received" events; then the
 *             link station: a plain line draws itself from the promise token to the performance token and is
 *             captioned "Linked as supplied" (no arrowhead, no direction). Each event adds its station to the strip.
 *  0.73–1.00  hold: the supplied status of the performance — "Performance identified (as supplied)" or "Question to
 *             be analysed (as supplied)" (then the link and a ring round the performance token use the dashed
 *             pending marker) — and the key "As supplied · no conclusion drawn".
 * "Consideration" appears only as the supplied, illustrative concept label. Nothing states a rule about it, nor any
 * validity, enforceability, binding force or formation, nor any effect of either status.
 * @module animations/contract-formation/LAW-0461
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, KIT_STRINGS, FINAL_STATES, layoutScene, buildScene, poseScene, localizeScene} from './kits/consideration-concepto.js';

const ID = 'LAW-0461';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// events are spread over [EV0, EV1] in the supplied order (even spacing: order only, not a time scale)
const EV0 = 0.24, EV1 = 0.68;
const W = {strip: [0.12, 0.16], final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};

const STRINGS = KIT_STRINGS;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (gives the promise token ●)', 50), b: str('Caption for Party B (gives the performance token ◆)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['promise', 'performance', 'sequence']), 0, 2),
  finalState: oneOf('Status of the performance as supplied, for the final hold: performance-identified (a tag "Performance identified, as supplied"), question-to-analyse (a tag "Question to be analysed, as supplied"; the link and a ring round the performance token use the dashed pending marker: an open question, not a failure) or sequence-to-examine (the strip bracketed as a time sequence to be examined). No legal effect is inferred from any of them', FINAL_STATES),
  conceptLabel: str('Concept label shown as supplied and illustrative (a doctrinal term kept in its origin, e.g. "consideration"); nothing is said about the concept', 40),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Gives promise P-201', b: 'Gives performance Q-201'},
  objectLabels: {outgoing: 'Rack A', incoming: 'Rack B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'performance-identified',
  conceptLabel: 'consideration',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  parties: [{name: 'Lena Okafor', role: 'Parte A'}, {name: 'Marco Bellini', role: 'Parte B'}],
  offer: {reference: 'P-201', title: 'Pagar 300 por la valla'},
  terms: [
    {key: 'item', label: 'Importe', value: '300 (ficticio)'},
    {key: 'quantity', label: 'Por', value: 'La valla'},
  ],
  responses: [{reference: 'Q-201', text: 'Repintar la valla'}],
  sequence: [
    {event: 'promise-sent', time: 'Día 1, 09:00 (ficticio)'},
    {event: 'performance-sent', time: 'Día 1, 09:30 (ficticio)'},
    {event: 'promise-received', time: 'Día 1, 11:00 (ficticio)'},
    {event: 'performance-received', time: 'Día 1, 11:30 (ficticio)'},
    {event: 'linked', time: 'Día 1, 12:00 (ficticio)'},
  ],
  actorLabels: {a: 'Da la promesa P-201', b: 'Da la prestación Q-201'},
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
      plates: p.objectLabels, ev: [EV0, EV1], conceptLabel: p.conceptLabel, linkStatus: p.finalState === 'question-to-analyse' ? 'to-analyse' : 'identified',
      // (five stations with the link: rows of three as well)
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
        conceptLabel: p.conceptLabel,
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
    slug: 'contract-formation-06-story',
    title: 'Consideration as a concept label — a promise token and a performance token linked as supplied',
    titleEs: 'Consideration como concepto — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Consideration como concepto',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks. Party A sends its promise token (●) and Party B its performance token (◆), at equal weight; the routes cross and each token lands at the other party. Then a plain line draws itself between the two tokens, captioned "Linked as supplied" — no arrowhead, no direction. Each event adds a station with its fictional time label to the strip "Sequence as supplied (illustrative)". The hold shows the supplied status of the performance (identified, or a question to be analysed with the dashed pending marker) and the concept label "consideration" marked as supplied and illustrative. No rule about the concept and no legal effect is stated.',
    tags: ['promise', 'performance', 'token', 'link', 'concept label', 'consideration', 'question to be analysed', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/consideration-concepto.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
