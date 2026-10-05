/**
 * LAW-0469 — Capacidad de las partes · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks):
 *  0.00–0.15  rest: Party A's rack holds Party A's card (●), Party B's rack holds Party B's card (◆), at equal weight;
 *             each card folded — its head and title show, a flap covers its attribute rows.
 *  0.15–0.42  each party hands its card to the other in the supplied order of the "sent" events: the hand grips its
 *             edge, slides it out, the card turns and sets off; the routes cross.
 *  0.42–0.73  each card lands at the other party; then the unfolding's station: both flaps open and the supplied
 *             attributes appear (generic, fictional: a role, "represented by (as supplied)", attribute A/B).
 *  0.73–1.00  hold: the supplied status — "Data complete (as supplied)" or "Capacity pending verification (as
 *             supplied)" (then a dashed pending ring round the indicated card: a pending state only, never a
 *             deficiency or a warning about the person) — and the key "As supplied · no conclusion drawn".
 * No rule on capacity, no threshold, no incapacity, no representation regime, no effect on a contract; no personal
 * data; no jurisdiction.
 * @module animations/contract-formation/LAW-0469
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, KIT_STRINGS, FINAL_STATES, layoutScene, buildScene, poseScene, localizeScene} from './kits/capacidad-partes.js';

const ID = 'LAW-0469';
const DURATION = 6000;

/** True when the unfolding's label names the other status than the supplied final state (EN / ES wording). */
function statusContradiction(finalState, label) {
  const pend = /pending|pendiente/i.test(label), comp = /\bcomplete|\bcomplet[oa]s?\b/i.test(label);
  if (finalState === 'data-complete') return pend;
  if (finalState === 'pending-verification') return comp && !pend;
  return false;
}
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// events are spread over [EV0, EV1] in the supplied order (even spacing: order only, not a time scale)
const EV0 = 0.24, EV1 = 0.68;
const W = {strip: [0.12, 0.16], final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};

const STRINGS = KIT_STRINGS;
// (racks this far further from the people, in figure units: each card at rest, with its pending outline, clears both
// people's whole outlines — hair and arms included)
const FIG_GAP = 16;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (hands over card ●)', 50), b: str('Caption for Party B (hands over card ◆)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['cardA', 'cardB', 'sequence']), 0, 2),
  finalState: oneOf('Status supplied for the hold: data-complete (a tag "Data complete, as supplied"), pending-verification (a tag "Capacity pending verification, as supplied"; a dashed pending ring round the indicated card — a pending state only) or sequence-to-examine. No legal effect is inferred from any of them', FINAL_STATES),
  pendingParty: oneOf('Whose card carries the pending ring when the status is pending verification', ['A', 'B']),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Hands over card PC-501', b: 'Hands over card PC-502'},
  objectLabels: {outgoing: 'Rack A', incoming: 'Rack B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'data-complete',
  pendingParty: 'B',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  parties: [{name: 'Elif Demir', role: 'Parte A'}, {name: 'Tomas Lind', role: 'Parte B'}],
  offer: {reference: 'PC-501', title: 'Parte A, según lo aportado'},
  terms: [
    {key: 'item', label: 'Papel', value: 'Vendedora'},
    {key: 'other', label: 'Representada por', value: 'Sí misma'},
  ],
  responses: [{reference: 'PC-502', text: 'Parte B, según lo aportado'}],
  termsB: [
    {key: 'item', label: 'Papel', value: 'Comprador'},
    {key: 'other', label: 'Atributo A', value: 'Valor 1'},
  ],
  sequence: [
    {event: 'cardA-sent', time: 'Día 1, 10:00 (ficticio)'},
    {event: 'cardB-sent', time: 'Día 1, 10:05 (ficticio)'},
    {event: 'cardA-received', time: 'Día 1, 10:20 (ficticio)'},
    {event: 'cardB-received', time: 'Día 1, 10:25 (ficticio)'},
    {event: 'unfolded', time: 'Datos completos (aportado)'},
  ],
  actorLabels: {a: 'Entrega la ficha PC-501', b: 'Entrega la ficha PC-502'},
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
    const L = layoutScene(ctx, p, {
      box: {x: 6, y: 4, w: D.w - 12, h: D.h - 8}, shape, upx: unitPx(ctx), prefix: '', headTarget,
      sequence: p.sequence, finalState: p.finalState, annotations: p.annotations, showFinal: true, captions,
      plates: p.objectLabels, ev: [EV0, EV1], pending: p.finalState === 'pending-verification', pendingParty: p.pendingParty === 'A' ? 'proposal' : 'response',
      // (five stations with the unfolding: rows of three as well)
      arrs: shape === 'landscape' ? [{arr: 'row', strip: 'below', cols: 5}, {arr: 'row', strip: 'below', cols: 3}, {arr: 'row', strip: 'mid', cols: 2}]
        : shape === 'square' ? [{arr: 'row', strip: 'below', cols: 3}, {arr: 'row', strip: 'below', cols: 2}, {arr: 'stack', strip: 'mid', cols: 1}, {arr: 'row', strip: 'below', cols: 5}]
          : [{arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 2}, {arr: 'stack', strip: 'below', cols: 1}, {arr: 'stack', strip: 'below', cols: 3}],
      // (a card in flight never passes over the other card's slots)
      clearRacks: true,
      // (the racks stand clear of the people, and the pending outline runs inside the card's border: neither ever
      // overlaps a person's outline)
      figGap: FIG_GAP, ringInset: true, leadClear: true,
    });
    // the unfolding's supplied label and the supplied final state never contradict each other: a contradiction is
    // flagged (layoutOk false), never drawn silently
    const lab = (p.sequence.find(e => e.event === 'unfolded') || {}).time || '';
    const contra = statusContradiction(p.finalState, lab);
    if (contra) { L.why.push('status-contradiction'); L.ok = false; }
    L.statusConsistent = !contra;
    return L;
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
        pendingParty: p.pendingParty,
        flightGap: r(L.sepMin, 1),
        layoutOk: L.ok, statusConsistent: L.statusConsistent,
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
    slug: 'contract-formation-08-story',
    title: 'Capacity of the parties, without a rule — party cards unfold their supplied attributes',
    titleEs: 'Capacidad de las partes — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Capacidad de las partes',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks. Each hands its party card to the other (● Party A\'s, ◆ Party B\'s, at equal weight); the cards arrive folded — head and title showing, a flap over the attribute rows — and at the unfolding station both flaps open and the supplied attributes appear (generic and fictional: a role, "represented by (as supplied)", attribute A). Each event adds a station to the strip "Sequence as supplied (illustrative)". The hold shows the supplied status: data complete, or capacity pending verification (a dashed pending ring round the indicated card — a pending state only). No rule on capacity and no legal effect is stated.',
    tags: ['party card', 'attributes', 'unfold', 'pending verification', 'data complete', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/capacidad-partes.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
