/**
 * LAW-0449 — Retirada de propuesta · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks):
 *  0.00–0.15  rest: Party A's outgoing rack holds two cards of the same size,
 *             face up and readable — the PROPOSAL (● its reference, title and
 *             terms) and the WITHDRAWAL message (◆ its reference and text).
 *             Party B's incoming rack is empty. The sequence strip is empty.
 *  0.15–0.42  A takes each card in the supplied order of the "sent" events: the
 *             hand grips its edge, lifts it, the card turns to its back
 *             (text hidden while it turns) and sets off along its route. The
 *             two routes cross once: the withdrawal message's journey crosses
 *             the proposal's (the cards never touch).
 *  0.42–0.73  each card lands in B's rack in the supplied order of the
 *             "received" events: B's hand meets it, it grows back and turns
 *             face up. Each event adds its station (●/◆, verb, the supplied
 *             fictional time label) to the strip "Sequence as supplied
 *             (illustrative)"; events supplied with the same position share
 *             one station inside a dashed bracket "order to be examined".
 *  0.73–1.00  hold: the supplied final state — "withdrawal communicated (as
 *             supplied)" tied to the ◆ card, or "time sequence to be examined"
 *             with a dashed bracket around the strip — and the key "As supplied
 *             · no conclusion drawn".
 * Nothing says when a withdrawal takes effect, whether a message arrived in
 * time, which one prevails, or whether the proposal is revoked or still open.
 * The strip's spacing is the supplied order only, never a time scale.
 * @module animations/contract-formation/LAW-0449
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, KIT_STRINGS, layoutScene, buildScene, poseScene} from './kits/retirada-propuesta.js';
import {localizeScene} from './kits/retirada-propuesta.js';

const ID = 'LAW-0449';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// events are spread over [EV0, EV1] in the supplied order (even spacing: order only, not a time scale)
const EV0 = 0.24, EV1 = 0.68;
const W = {strip: [0.12, 0.16], final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};
const MSGS = ['proposal', 'withdrawal'];

const STRINGS = KIT_STRINGS;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (sends both messages)', 50), b: str('Caption for Party B (the addressee)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['proposal', 'withdrawal', 'sequence']), 0, 2),
  finalState: oneOf('State supplied for the final hold: withdrawal-communicated (a tag on the withdrawal message) or sequence-to-examine (the strip bracketed as a time sequence to be examined). No legal effect is inferred', ['withdrawal-communicated', 'sequence-to-examine']),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Sends both messages', b: 'Addressee'},
  objectLabels: {outgoing: 'Outgoing', incoming: 'Incoming'},
  actionProgress: 1,
  annotations: [],
  finalState: 'withdrawal-communicated',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  "parties": [
    {
      "name": "Nadia Park",
      "role": "Parte A"
    },
    {
      "name": "Tomás Ribeiro",
      "role": "Parte B"
    }
  ],
  "offer": {
    "reference": "OF-2041",
    "title": "Propuesta de suministro"
  },
  "terms": [
    {
      "key": "item",
      "label": "Artículo",
      "value": "Sillas de roble"
    },
    {
      "key": "quantity",
      "label": "Cantidad",
      "value": "40"
    }
  ],
  "responses": [
    {
      "reference": "RT-2041",
      "text": "Retirada de la propuesta OF-2041"
    }
  ],
  "sequence": [
    {
      "event": "proposal-sent",
      "time": "Día 1, 09:00 (ficticio)"
    },
    {
      "event": "withdrawal-sent",
      "time": "Día 1, 11:00 (ficticio)"
    },
    {
      "event": "withdrawal-received",
      "time": "Día 2, 10:00 (ficticio)"
    },
    {
      "event": "proposal-received",
      "time": "Día 2, 16:00 (ficticio)"
    }
  ],
  "actorLabels": {
    "a": "Envía ambos mensajes",
    "b": "Destinatario"
  },
  "objectLabels": {
    "outgoing": "Salida",
    "incoming": "Entrada"
  },
  "annotations": []
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
    slug: 'contract-formation-03-story',
    title: 'Withdrawal of a proposal — a withdrawal message crosses the proposal\'s journey',
    titleEs: 'Retirada de propuesta — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Retirada de propuesta',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks. Party A takes the proposal card (●) and the withdrawal card (◆) from its rack in the supplied order and sends them along two routes that cross; they land face up in Party B\'s rack in the supplied order, and each event adds a station with its fictional time label to the strip "Sequence as supplied (illustrative)". The hold shows the supplied final state (withdrawal communicated, or a time sequence to be examined). No effect of the order is inferred.',
    tags: ['proposal', 'offer', 'withdrawal', 'message', 'crossing', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/retirada-propuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
