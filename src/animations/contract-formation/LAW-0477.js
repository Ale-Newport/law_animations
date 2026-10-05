/**
 * LAW-0477 — Aceptación digital · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks):
 *  0.00–0.15  rest: Party A's rack holds Party A's screen (●), Party B's rack holds Party B's action device (◆), at equal
 *             weight; each device closed — its head and heading show, a shade covers its rows.
 *  0.15–0.42  Party A hands its screen to Party B in the supplied order: the hand grips its edge, slides it out, the
 *             device turns and sets off, and lands at Party B.
 *  0.42–0.73  the terms-shown station: the screen's shade slides up and the screen shows its placeholder term rows and a
 *             generic button, a scroll rail drawing past each row (the terms are shown before any action); then Party
 *             B hands over its action device (the same button, pressed), which lands at Party A and opens there: the
 *             action recorded, as supplied.
 *  0.73–1.00  hold: the supplied status — "Informed action (as supplied)" or "Presentation to be examined (as supplied)"
 *             (then a dashed pending outline just inside the indicated device's border: a supplied, pending question
 *             only, never a finding, a deficiency or a warning) — and the key "As supplied · no conclusion drawn".
 * No rule on online acceptance (no validity of click or browse agreements, no consent standard, no consumer-protection
 * or prominence test, no enforceability); the rows are generic placeholders, never real terms; no jurisdiction.
 * Adapted from LAW-0473 (copied).
 * @module animations/contract-formation/LAW-0477
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, FINAL_STATES, layoutScene, buildScene, poseScene, localizeScene, statusContradiction} from './kits/aceptacion-digital.js';

const ID = 'LAW-0477';
const DURATION = 6000;

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
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (hands over the screen ●)', 50), b: str('Caption for Party B (hands over the action device ◆)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['screen', 'action', 'sequence']), 0, 2),
  finalState: oneOf('Status supplied for the hold: action-recorded (a tag "Informed action, as supplied"), presentation-to-examine (a tag "Presentation to be examined, as supplied"; a dashed pending outline inside the indicated device\'s border — a supplied, pending question only) or sequence-to-examine. No legal effect is inferred from any of them', FINAL_STATES),
  pendingParty: oneOf('Whose device carries the pending outline when the status is presentation to be examined', ['A', 'B']),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Shows screen SC-701', b: 'Sends action AC-702'},
  objectLabels: {outgoing: 'Rack A', incoming: 'Rack B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'action-recorded',
  pendingParty: 'A',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  actorLabels: {a: 'Muestra la pantalla SC-701', b: 'Envía la acción AC-702'},
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
      plates: p.objectLabels, ev: [EV0, EV1], pending: p.finalState === 'presentation-to-examine', pendingParty: p.pendingParty === 'A' ? 'proposal' : 'response',
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
    // the connection's supplied label and the supplied final state never contradict each other: a contradiction is
    // flagged (layoutOk false), never drawn silently
    const lab = (p.sequence.find(e => e.event === 'terms-shown') || {}).time || '';
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
    slug: 'contract-formation-10-story',
    title: 'Digital acceptance, without a rule — a screen shows terms before a user action is recorded',
    titleEs: 'Aceptación digital — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Aceptación digital',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks. Party A hands its screen (●) to Party B; at the terms-shown station the screen\'s shade slides up and it shows generic placeholder term rows and a generic button, a scroll rail drawing past each row. Then Party B hands over its action device (◆, the same button pressed, at equal weight), which opens at Party A: action recorded, as supplied. Each event adds a station to the strip "Sequence as supplied (illustrative)". The hold shows the supplied status: informed action, or presentation to be examined (a dashed pending outline inside the indicated device — a supplied, pending question only). No rule on online acceptance and no legal effect is stated.',
    tags: ['screen', 'terms shown', 'user action', 'action recorded', 'presentation to be examined', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/aceptacion-digital.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
