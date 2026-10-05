/**
 * LAW-0485 — Término definido · story
 *
 * Storyboard (standing microscene; two parties with their pigeonhole racks):
 *  0.00–0.15  rest: Party A's rack holds Party A's definitions sheet (●) with the definition slip ("Definition 1
 *             (supplied text)", a placeholder) in the dock at its foot; Party B's rack holds Party B's contract (◆, its
 *             layers behind it), its own dock empty and its row — the word “Delivery” and its clause — under a cover
 *             sheet, at equal weight.
 *  0.15–0.42  Party A hands the definitions sheet to Party B in the supplied order: the hand grips its edge, slides it
 *             out, the sheet turns and sets off, and lands in Party B's rack, above the contract; then the term station.
 *  0.42–0.73  the concrete action: Party B's hand takes the definition slip out of the sheet's dock and sets it into the
 *             contract's dock (with the supplied configuration "defined term"; with "term with no linked definition"
 *             the slip stays where it is); then Party B hands the contract to Party A, where it lands and is unfolded:
 *             its cover lifts, the row shows with the word underlined and a thread draws from the word to the
 *             definition slip in the contract's dock — the word links to its definition (no thread when the slip is
 *             outside the contract).
 *  0.73–1.00  hold: the supplied configuration — "Defined term (as supplied)" or "Term with no linked definition (as
 *             supplied)", neutral and of equal weight, no mark on either — and the key "As supplied · no conclusion
 *             drawn".
 * No interpretation rule (no contra proferentem, no plain meaning, no canon of construction) and no conclusion about
 * what the word means; the word is generic and fictional, the definition and the clause are placeholders; no
 * jurisdiction. Adapted from LAW-0481 (copied).
 * @module animations/contract-terms/LAW-0485
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, FINAL_STATES, layoutScene, buildScene, poseScene, localizeScene, statusContradiction} from './kits/termino-definido.js';

const ID = 'LAW-0485';
const DURATION = 6000;

const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
// events are spread over [EV0, EV1] in the supplied order (even spacing — the interval after the clause station one
// unit longer, for the slip's hand-over: order only, not a time scale)
const EV0 = 0.2, EV1 = 0.66, LINK_GAP = 1;
const W = {strip: [0.11, 0.15], final: [0.75, 0.8], key: [0.78, 0.83], notes: [0.8, 0.85]};

const STRINGS = KIT_STRINGS;
// (racks this far further from the people, in figure units: each document at rest clears both people's whole outlines —
// hair and arms included)
const FIG_GAP = 16;

const sceneSchema = {
  ...motifFields,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for Party A (hands over the definitions sheet ●)', 50), b: str('Caption for Party B (holds the contract ◆)', 50)}),
  objectLabels: obj('Labels printed on the racks', {outgoing: str('Plate on Party A\'s rack', 30), incoming: str('Plate on Party B\'s rack', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['sheet', 'contract', 'sequence']), 0, 2),
  finalState: oneOf('Configuration supplied for the hold: term-defined (the definition slip passes into the contract\'s dock and, when the contract is unfolded, a thread links the word to it; a tag "Defined term, as supplied") or term-unlinked (the slip stays in the definitions sheet\'s dock, no thread; a tag "Term with no linked definition, as supplied"). Both are neutral and of equal weight; nothing is inferred from either', FINAL_STATES),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  actorLabels: {a: 'Passes sheet DS-801', b: 'Holds contract CT-802'},
  objectLabels: {outgoing: 'Rack A', incoming: 'Rack B'},
  actionProgress: 1,
  annotations: [],
  finalState: 'term-defined',
};

/** Spanish defaults (the baseline-es content): used for every parameter left at its default when locale is 'es'. */
const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  actorLabels: {a: 'Pasa la hoja HD-801', b: 'Tiene el contrato CT-802'},
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
      plates: p.objectLabels, ev: [EV0, EV1], linkGap: LINK_GAP,
      arrs: shape === 'landscape' ? [{arr: 'row', strip: 'below', cols: 5}, {arr: 'row', strip: 'below', cols: 3}, {arr: 'row', strip: 'mid', cols: 2}]
        : shape === 'square' ? [{arr: 'row', strip: 'below', cols: 3}, {arr: 'row', strip: 'below', cols: 2}, {arr: 'stack', strip: 'mid', cols: 1}, {arr: 'row', strip: 'below', cols: 5}]
          : [{arr: 'stack', strip: 'mid', cols: 1}, {arr: 'stack', strip: 'below', cols: 2}, {arr: 'stack', strip: 'below', cols: 1}, {arr: 'stack', strip: 'below', cols: 3}],
      // (a document in flight never passes over the other document's slots)
      clearRacks: true,
      // (the racks stand clear of the people: no document ever overlaps a person's outline)
      // (1:1: the racks stand at the original spacing and documents fly a little smaller — the two racks of documents
      // and the gap between them fit the square frame at the baseline text size)
      figGap: shape === 'square' ? 2 : FIG_GAP, colFs: shape === 'square' ? [11, 13, 15, 8, 8.6, 9.2] : undefined, chipWFor: shape === 'square' ? {event: 'term-station', w: 99} : undefined, stripGap: shape === 'square' ? 1 : undefined, fly: shape === 'square' ? 0.38 : undefined, innerFs: shape === 'square' ? [22, 20, 18, 15, 14, 13, 12, 11] : [22, 18, 15, 14, 13, 12, 11], leadClear: true,
    });
    // the clause station's supplied label and the supplied configuration never contradict each other: a contradiction
    // is flagged (layoutOk false), never drawn silently
    const lab = (p.sequence.find(e => e.event === 'term-station') || {}).time || '';
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
    slug: 'contract-terms-02-story',
    title: 'Defined term, without a rule — unfolding the contract, a word links to its definition slip as supplied',
    titleEs: 'Término definido — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Término definido',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties with pigeonhole racks. Party A hands its definitions sheet (●), a placeholder definition slip in the dock at its foot, to Party B, whose contract (◆) rests in the same rack with its row — the word and its clause — under a cover sheet. At the term station Party B\'s hand takes the definition slip out of the sheet\'s dock and sets it into the contract\'s dock (supplied configuration "defined term"; with "term with no linked definition" the slip stays in the sheet). Party B then hands the contract to Party A, where it is unfolded: the cover lifts, the word shows underlined and a thread draws from it to the definition slip. Each event adds a station to the strip "Sequence as supplied (illustrative)". The hold shows the supplied configuration, neutral and of equal weight. No interpretation rule and no conclusion about what the word means.',
    tags: ['defined term', 'definition', 'definitions sheet', 'contract', 'unfold', 'thread', 'dock', 'sequence', 'rack', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/termino-definido.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
