/**
 * LAW-0049 — Historial de una norma · story
 *
 * Storyboard (frontal library reading station; the researcher's arms enter
 * from the frame edge):
 *  0.00–0.15  rest: bookshelf (anchor) with the consolidated volume shelved
 *             spine-out, catalogue kiosk with an empty search field, empty
 *             lectern with its date rail, research card on the counter.
 *  0.15–0.42  the right hand types the query and the date; the kiosk returns
 *             the result and the volume's slot lights up; the left hand pulls
 *             the volume off the shelf and, while bringing it forward, turns
 *             it from spine to face.
 *  0.42–0.73  the volume is hung on the lectern; the left hand pulls the front
 *             sheet down so the TEMPORAL LAYERS fan out (oldest at the top,
 *             newest in front); the right hand takes the research card, clips
 *             it on the rail and slides it up to the selected date; the layer
 *             the author marks for that date is outlined and the later layers
 *             become ghosts.
 *  0.73–1.00  hold: the supplied final state (date marked / versions shown /
 *             volume located). No legal effect is inferred.
 * @module animations/research/LAW-0049
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {readingStation, placeNote, STATION} from './kits/historial-de-una-norma.js';
import {historialFields, researcherField, HISTORIAL_DEFAULTS, HISTORIAL_STRINGS, selectedIndex} from './kits/historial-fields.js';

const ID = 'LAW-0049';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows. */
const W = {
  toKeys: [0.09, 0.15], type: [0.15, 0.22], dated: [0.22, 0.25], locate: [0.25, 0.28], backR: [0.26, 0.33],
  toVol: [0.27, 0.34], pull: [0.34, 0.38], carry: [0.38, 0.47], settle: [0.47, 0.49],
  toFan: [0.49, 0.52], fan: [0.52, 0.59], releaseL: [0.59, 0.66],
  toCard: [0.47, 0.52], liftCard: [0.52, 0.575], slide: [0.595, 0.675], clip: [0.675, 0.695], releaseR: [0.695, 0.8],
  select: [0.675, 0.745], note: [0.8, 0.88],
};
const ACTION_END = 0.8;

const sceneSchema = {
  ...historialFields,
  ...researcherField,
  ...storyFields({
    volume: str('Label printed on the volume spine (defaults to the first citation)', 40),
    card: str('Header printed on the research card', 30),
    search: str('Header of the catalogue search screen', 40),
  }, ['selected', 'later', 'card', 'search', 'library'], ['date-marked', 'versions-shown', 'located']),
};

const defaultParams = {
  ...HISTORIAL_DEFAULTS,
  researcher: {name: 'Noa Silva', role: 'Researcher'},
  actorLabels: {a: 'Researcher', b: 'Catalogue search'},
  objectLabels: {volume: 'Art. 12', card: 'Research card', search: 'Catalogue search'},
  actionProgress: 1,
  annotations: [{target: 'later', text: 'Later layers stay visible as outlines'}],
  finalState: 'date-marked',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

const scene = {
  sizes: {landscape: [1600, 900], square: [1110, 900], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const axis = AXIS[ctx.view.shape];
    const st = STATION[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const sel = selectedIndex(p);
    const who = p.researcher && p.researcher.name ? {name: p.researcher.name, role: p.actorLabels.a} : p.actorLabels.a;
    const stage = readingStation(ctx, {
      prefix: 'st', axis, data: p, selected: sel,
      labels: {volume: p.objectLabels.volume, card: p.objectLabels.card, search: p.actorLabels.b || p.objectLabels.search},
      researcher: p.researcher, actorCaption: who,
    });
    // Editorial callouts (final hold): chips go to free wall right of the rail,
    // clear of the card's final box and the kiosk; the leader never crosses them.
    const n = stage.n;
    const marks = p.finalState === 'date-marked';
    const cardBox = marks ? stage.cardFinalBox(sel) : stage.cardRestBox;
    const ghostX = stage.outlineRightX(n - 1) - 27;
    const bandMid = i => (stage.layerTop(i) + stage.SH + 14 + stage.layerTop(n - 1) + stage.SH - 6) / 2;
    const selTop = stage.layerTop(sel);
    const gapAbove = marks ? cardBox.y - selTop : stage.dy;
    const targets = {
      // the marked layer's outline, inside that layer's own band (above the hanging card)
      selected: [
        {x: stage.outlineRightX(sel), y: selTop + Math.max(6, Math.min(14, gapAbove / 2))},
        {x: stage.outlineRightX(sel), y: selTop + stage.dy * 0.5, penalty: 80},
      ],
      // the front-most ghost's dashed edge, below the marked layer's outline
      later: sel < n - 1 ? [{x: ghostX, y: bandMid(sel)}] : [{x: ghostX, y: stage.layerTop(n - 1) + stage.SH * 0.6}],
      card: [{x: cardBox.x + cardBox.w * 0.6, y: cardBox.y + cardBox.h}, {x: cardBox.x + cardBox.w * 0.6, y: cardBox.y}],
      search: [{x: stage.kioskBox.x + stage.kioskBox.w / 2, y: stage.kioskBox.y + stage.kioskBox.h}, {x: stage.kioskBox.x, y: stage.kioskBox.y + stage.kioskBox.h / 2}],
      library: stage.shelfBox ? [{x: stage.shelfBox.x + stage.shelfBox.w, y: stage.shelfBox.y + stage.shelfBox.h * 0.4}, {x: stage.shelfBox.x + stage.shelfBox.w * 0.5, y: stage.shelfBox.y}] : [{x: 100, y: 100}],
    };
    const tag = stage.tagBox(sel);
    const obstacles = [cardBox, ...stage.kioskObstacles, ...(stage.shelfBox ? [stage.shelfBox] : []), ...(tag && marks ? [tag] : [])];
    const notes = [];
    if (ctx.show('all')) {
      p.annotations.forEach((a, i) => {
        const note = placeNote(ctx, stage, {name: `note${i}`, text: a.text, targets: targets[a.target], obstacles: [...obstacles, ...notes.map(q => q.box)], size: 26, maxLines: 4, maxWidth: 360});
        notes.push(note);
      });
    }
    return {stage, s, ox, oy, notes, sel};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const retrieve = p.finalState !== 'located';
    const marks = p.finalState === 'date-marked';
    const on = (flag, w) => (flag ? seg(a, ...w) : 0);
    const v = {
      toKeys: seg(a, ...W.toKeys), type: seg(a, ...W.type), dated: seg(a, ...W.dated), locate: seg(a, ...W.locate), backR: seg(a, ...W.backR),
      toVol: on(retrieve, W.toVol), pull: on(retrieve, W.pull), carry: on(retrieve, W.carry), settle: on(retrieve, W.settle),
      toFan: on(retrieve, W.toFan), fan: on(retrieve, W.fan), releaseL: on(retrieve, W.releaseL),
      toCard: on(marks, W.toCard), liftCard: on(marks, W.liftCard), slide: on(marks, W.slide), clip: on(marks, W.clip), releaseR: on(marks, W.releaseR),
      select: on(marks, W.select),
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(nn => Object.assign(nodes, nn.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-03-story',
    title: 'History of a provision — reading-station microscene',
    titleEs: 'Historial de una norma — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Historial de una norma',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Library reading station: the researcher types the query, pulls the consolidated volume off the shelf and hangs it on the lectern, fans its sheets into temporal layers (one per version) and slides the research card along the date rail to the selected date; the layer the author marks for that date is outlined and later layers become ghosts.',
    tags: ['legal research', 'versions', 'timeline', 'library', 'search', 'index card', 'layers', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/historial-de-una-norma.js', 'src/animations/research/kits/historial-fields.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HISTORIAL_STRINGS,
  scene,
});
