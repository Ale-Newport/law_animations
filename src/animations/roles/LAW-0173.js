/**
 * LAW-0173 — Intervención de perito · story
 *
 * Storyboard (side view of a workbench; a report board on an easel beside it):
 *  0.00–0.15  rest: the specialist stands behind the bench, hands on it. On the
 *             bench: a magnifier lying on the left, the examined object on a
 *             stand, and a manila tag tied to the object by a string, hanging
 *             over the bench edge. The report page on the board shows its
 *             title and empty sections (figure frame, data rows, opinion).
 *  0.15–0.42  the specialist picks up the magnifier (grip = solved hand),
 *             holds the lens over the object and sweeps it; the lens shows an
 *             enlarged copy of the object while a dimension line is drawn
 *             across it; the magnifier is laid back down in its place.
 *  0.42–0.73  the same hand takes the tag and carries it up to the board (the
 *             string follows from the object's tie point), pins it next to the
 *             figure frame (cause first). Only then: the figure is drawn as a
 *             mirror of the object, the supplied data rows fill, the dashed
 *             scope fence closes around the supplied opinion and its scope.
 *  0.73–1.00  hold: object ↔ tag ↔ Fig. 1 linked; "data examined (as
 *             supplied)" and "opinion, scope as stated" kept apart; key
 *             "as supplied · no conclusion drawn". Nothing says the opinion is
 *             correct, decisive or accepted; no cause, fault or outcome.
 * finalState 'data-only' keeps the opinion block empty ("no opinion supplied").
 * Relationships (object → figure | data | opinion) mark the linked sections with
 * a small tag glyph of the same manila colour as the tag.
 * @module animations/roles/LAW-0173
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {actorLook} from '../../primitives/people-style.js';
import {peritoFields, PERITO_DEFAULTS, PERITO_STRINGS, LAB, labGeometry, labStage, specialistCaption, leaderChip, labRegions, labChipSpecs, placeLabelSet, linkMarks, segHitsBox, overlaps, ACT} from './kits/intervencion-de-perito.js';

const ID = 'LAW-0173';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** u → action clock: examination ends (magnifier parked) at u 0.42; the hand is back at rest by u 0.66. */
const U0 = 0.15, U1 = 0.42, U2 = 0.66, C1 = ACT.park[1];
const clockOf = u => (u <= U0 ? 0 : u <= U1 ? ((u - U0) / (U1 - U0)) * C1 : u <= U2 ? C1 + ((u - U1) / (U2 - U1)) * (1 - C1) : 1);
const uOf = c => (c <= C1 ? U0 + (c / C1) * (U1 - U0) : U1 + ((c - C1) / (1 - C1)) * (U2 - U1));
const U_PIN = uOf(ACT.pin[0] + (ACT.pin[1] - ACT.pin[0]) * 0.5);
const W = {fig: [0.6, 0.68], leader: [0.6, 0.64], rows: 0.64, fence: [0.7, 0.755], op: [0.725, 0.77], sc: [0.745, 0.79], key: [0.77, 0.81], marks: [0.66, 0.72], notes: [0.79, 0.86]};
const TARGETS = ['object', 'report'];
const SECTIONS = ['figure', 'data', 'opinion'];

const sceneSchema = {
  ...peritoFields,
  relationships: list('Which report sections the tag links the object to (a small tag glyph marks each linked section)', obj('Link from the object to a report section', {
    from: oneOf('Source (the examined object)', ['object']),
    to: oneOf('Report section', SECTIONS),
  }, ['from', 'to']), 1, 3),
  actorLabels: obj('Caption next to the specialist (empty = role caption)', {specialist: str('Caption for the specialist', 50)}),
  objectLabels: obj('Identifiers of props shown on the bench (editable)', {tool: str('Label of the examination tool (the magnifier)', 40)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied by the author for the hold: the report holds data and a stated opinion, or data only (no opinion supplied). No conclusion is inferred', ['data-and-opinion', 'data-only']),
};

const defaultParams = {
  ...PERITO_DEFAULTS,
  relationships: [{from: 'object', to: 'figure'}, {from: 'object', to: 'data'}],
  actorLabels: {specialist: ''},
  objectLabels: {tool: 'Magnifier'},
  actionProgress: 1,
  annotations: [{target: 'report', text: 'Fig. 1 mirrors the object on the bench'}],
  finalState: 'data-and-opinion',
};

const scene = {
  sizes: {landscape: [1800, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const cfg = LAB[shape];
    const W0 = ctx.design.w, H0 = ctx.design.h;
    const showAll = ctx.show('all');
    const dataOnly = p.finalState === 'data-only';
    const G = labGeometry(ctx, {W: W0, H: H0, cfg, report: p.props.report, tagText: p.props.tag, keyText: ctx.show('key') ? ctx.t.key : null, show: showAll, kind: p.props.objectKind, opinionText: dataOnly ? ctx.t.noOpinion : null, headReserve: 1.4});
    const look = actorLook(ctx, p.actors[0], 0);
    const stage = labStage(ctx, {prefix: 'st', G, look, kind: p.props.objectKind, show: showAll, tagText: p.props.tag});
    const S = G.PL.S;
    const k = G.k;
    const cap = Math.min(S, cfg.S);

    // ---- identifiers (tool, object, specialist) and hold-only notes, placed in free space
    const R = labRegions(G, stage, shape);
    const fbx = G.page.x + G.PL.figBox.x, fby = G.page.y + G.PL.figBox.y, fbw = G.PL.figBox.w, fbh = G.PL.figBox.h;
    const targetPt = {
      object: [{x: G.obj.x, y: G.obj.y - G.obj.R * 0.9}, {x: G.obj.x - G.obj.R * 0.9, y: G.obj.y}, {x: G.obj.x + G.obj.R * 0.42, y: G.benchTopY + 4}],
      report: [{x: fbx + fbw - 10, y: fby + fbh * 0.62}, {x: fbx + 10, y: fby + fbh * 0.62}, {x: fbx + 10, y: fby + fbh - 10}, {x: fbx + fbw - 10, y: fby + fbh - 10}, {x: fbx + fbw * 0.5, y: fby + 10},
        // the page's lower edge under the figure column: reachable through the board margin
        {x: fbx + fbw * 0.5, y: G.page.y + G.page.h - 3}],
    };
    const chipSpecs = ctx.show('key') ? labChipSpecs(G, R, {tool: p.objectLabels.tool, object: p.props.object, specialist: specialistCaption(p, p.actorLabels.specialist)}) : [];
    // square frames: notes prefer the free upper-left area (it would otherwise stay empty)
    const noteRegions = shape === 'square' ? [...R.free.map((f, i) => ({...f, bias: i >= 2 ? 0 : 320})), {...R.panel, bias: 320}] : undefined;
    // leaders keep off every text block of the page (the key included) and off the person
    const noteSpecs = ctx.show('all') ? p.annotations.map((a, i) => ({name: `note${i}`, text: a.text, targets: targetPt[a.target], regions: noteRegions,
      avoidExtra: a.target === 'report' ? [R.person, R.objBox, R.tagPinned, ...R.blocks] : [R.person, R.objBox, R.tagPinned, R.pageBox]})) : [];
    const pass = placeLabelSet(ctx, {R, chips: chipSpecs, notes: noteSpecs, size: cap, Smin: cfg.Smin, maxWidth: shape === 'portrait' ? 440 : 480});
    const chips = pass.placed.filter(x => x.spec.atRest);
    const notes = pass.placed.filter(x => !x.spec.atRest);
    const chipsFit = pass.chipsFit, notesFit = pass.notesFit;
    const magBox = R.magBox;

    // ---- linked-section tag glyphs (relationships)
    const {links, marks} = linkMarks(ctx, G, p.relationships);
    // every leader: from its chip edge to its target, clear of the page's text blocks and the person
    const leadersClear = [...chips, ...notes].every(c => !c.target || [...R.blocks, R.person].every(q => {
      const inside = c.target.x >= q.x && c.target.x <= q.x + q.w && c.target.y >= q.y && c.target.y <= q.y + q.h;
      const b = c.box;
      const from = {x: clamp(c.target.x, b.x, b.x + b.w), y: clamp(c.target.y, b.y, b.y + b.h)};
      return inside || !segHitsBox(from, c.target, q);
    }));
    const sp = chips.find(c => c.node.attrs.name === 'chip-sp');
    const nameLeader = !ctx.show('key') || Boolean(sp && sp.target);
    return {G, stage, chips, notes, marks, links, notesFit, chipsFit, dataOnly, S, magBox, leadersClear, nameLeader};
  },
  build(ctx, L) {
    return g(null, L.stage.node, L.marks.map(m => m.node), L.chips.map(c => c.node), L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const cap = p.actionProgress;
    const done = cap >= 1;
    const c = Math.min(clockOf(u), cap);
    const reveal = (a, b) => (done ? seg(u, a, b) : 0);
    const rows = L.G.PL.rows.map((_, i) => reveal(W.rows + 0.03 * i, W.rows + 0.04 + 0.03 * i));
    const pageState = {
      fig: reveal(...W.fig), rows,
      fence: reveal(...W.fence), op: reveal(...W.op), sc: L.dataOnly ? 0 : reveal(...W.sc), key: reveal(...W.key),
    };
    const posed = L.stage.pose({c, pageState, leader: reveal(...W.leader)});
    const nodes = posed.nodes;
    L.marks.forEach(m => { nodes[m.name] = {opacity: r(reveal(...W.marks), 3)}; });
    L.notes.forEach(n => { nodes[n.node.attrs.name] = {opacity: r(reveal(...W.notes), 3)}; });
    // the tool label steps back while the magnifier is in the hand, returns when it is parked
    if (L.chips.some(ch => ch.node.attrs.name === 'chip-tool')) nodes['chip-tool'] = {opacity: r(clamp(1 - seg(u, 0.155, 0.185) + seg(u, 0.42, 0.45)), 3)};
    const s = posed.semantic;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...s,
        beat,
        clock: r(c, 4),
        allReached: s.reached,
        fig: r(pageState.fig, 3), rows: rows.map(v => r(v, 3)), fence: r(pageState.fence, 3), opinion: r(pageState.op, 3), scope: r(pageState.sc, 3), key: r(pageState.key, 3),
        linked: L.links,
        finalState: p.finalState,
        actionCapped: !done && clockOf(u) > cap,
        notesFit: L.notesFit, chipsFit: L.chipsFit, placed: [...L.chips, ...L.notes].map(c => c.node.attrs.name),
        nameLeader: L.nameLeader, leadersClear: L.leadersClear,
        magParkClear: !L.chips.some(ch => overlaps(ch.box, L.magBox, 0)) && !L.notes.some(n => overlaps(n.box, L.magBox, 0)),
        pinU: r(U_PIN, 4),
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
    slug: 'roles-04-story',
    title: 'Specialist intervention — a tagged object is pinned to an illustrated report',
    titleEs: 'Intervención de perito — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Intervención de perito',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a workbench: a fictional specialist examines an object (gear wheel or sample jar) with a magnifier while a dimension line is drawn, lays the magnifier down, then carries the tag tied to the object and pins it on a report board. Only after the pin: the figure mirrors the object, the supplied data rows fill and a dashed scope fence closes around the supplied opinion. As supplied; no conclusion drawn.',
    tags: ['specialist', 'expert', 'report', 'magnifier', 'tag string', 'figure', 'data examined', 'opinion scope', 'workbench', 'person'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/intervencion-de-perito.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: PERITO_STRINGS,
  scene,
});
