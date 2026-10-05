/**
 * LAW-0229 — Deliberación separada · story
 *
 * Storyboard (a floor plan seen from above, inside a generic building: on one
 * side the public space — the hearing room, marked ● — with its public benches
 * and the generic participants seated on them, each with a letter badge; on
 * the other side the ABSTRACT deliberation zone, marked ◆ — an empty tinted
 * space, nobody in it. A generic partition with a door joins them. On wide
 * frames the spaces stand side by side with their name chips above; on tall
 * frames the plan is turned so the public space stands below the zone, the
 * chips beside them. A panel holds the legend (●, ◆, participants, benches,
 * track, partition, separation), the notes, the state and the key):
 *  0.00–0.15  rest: the two spaces side by side, the door in the partition
 *             open; every name, badge and caption is editable.
 *  0.15–0.42  the action starts: the door in the partition swings closed (the
 *             cause, before anything moves); the track draws on in the building
 *             margin; the public space — floor, walls, benches and the seated
 *             participants with their badges, and its name chip — starts to
 *             travel along the track, away from the zone.
 *  0.42–0.73  the displacement completes: the public space comes to rest at the
 *             end of the track; a visible separation (the building's corridor
 *             floor) now lies between the two spaces. Labels, people and
 *             benches travel together; nobody walks, nobody enters the zone.
 *  0.73–1.00  hold: the supplied final state (apart — or, as supplied,
 *             adjacent with the door closed), notes keyed to solid rings on the
 *             plan, and the key "as supplied · no conclusion drawn". Nothing
 *             says who may attend, what happens in the zone, or any outcome.
 * @module animations/courts/LAW-0229
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {
  delibFields, DELIB_EN, DELIB_STRINGS, delibGeometry, delibArt, participantLooks, seatedPose,
  legendItem, legendItem2, keyItem, stateItem, noteItem, layoutPanel, overlaps, unionBox, pxPerUnit, R2, searchLayout, planScene, LETTERS,
} from './kits/deliberacion-separada.js';

const ID = 'LAW-0229';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], start: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {door: [0.15, 0.22], rails: [0.19, 0.27], move: [0.23, 0.69], notes: [0.75, 0.8], state: [0.76, 0.81]};
const TARGETS = ['publicSpace', 'zone', 'partition', 'separation'];

const STRINGS = {en: {...DELIB_STRINGS.en}, es: {...DELIB_STRINGS.es}};

const sceneSchema = {
  ...delibFields,
  actorLabels: obj('Caption of the participants in the legend', {
    participants: str('Caption for the generic participants seated in the public space', 60),
  }),
  objectLabels: obj('Captions of the ● and ◆ markers in the legend', {
    hearing: str('Caption for ● (the public space, audiencia)', 60),
    deliberation: str('Caption for ◆ (the abstract zone, deliberación)', 60),
  }),
  actionProgress: num('How far the moving apart is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a solid ring drawn on its target in the plan', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied for the final hold: apart = the public space stands apart from the zone; adjacent = it stays beside the zone with the partition door closed', ['apart', 'adjacent']),
};

// (concise defaults, shared with the other entries' concise baselines: the plan stays the subject in every ratio)
const defaultParams = {
  courts: {building: 'Building (fictional)', hearing: 'Hearing room (fictional)', deliberation: 'Deliberation zone (fictional)'},
  routes: {track: 'Track (as configured)', partition: 'Partition with a door'},
  seats: {bench: 'Benches', participants: [{name: 'Participant A'}, {name: 'Participant B'}, {name: 'Participant C'}]},
  labels: {gap: 'Separation (illustrative)', sequence: DELIB_EN.labels.sequence, key: DELIB_EN.labels.key},
  actorLabels: {participants: 'Participants (generic)'},
  objectLabels: {hearing: 'Audiencia: public space', deliberation: 'Deliberación: abstract zone'},
  actionProgress: 1,
  annotations: [{target: 'separation', text: 'Separation shown as configured'}],
  finalState: 'apart',
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const rh of [420, 380]) {
        for (const pf of [0.24, 0.27, 0.3, 0.34]) arrs.push({rot: false, panel: 'column', pf, rh});
        for (const pf of [0.36, 0.4, 0.44]) arrs.push({rot: false, panel: 'column', pf, cols: 2, rh});
      }
    } else if (shape === 'square') {
      // square: deeper rooms so the plan is no thin band; the ● / ◆ names join the legend (the solid markers in the
      // rooms key them) and the participants share one row
      for (const rh of [600, 520, 440, 380, 330, 290]) for (const pf of [0.3, 0.36, 0.42, 0.48, 0.54]) for (const cols of [3, 4]) arrs.push({rot: false, panel: 'band', pf, cols, bname: 'panel', chips: false, packed: true, rh});
    } else {
      for (const rh of [420, 360]) for (const pf of [0.24, 0.28, 0.32, 0.36]) for (const cw of [0.3, 0.36]) arrs.push({rot: true, panel: 'band', pf, cols: 2, cw, rh});
    }
    for (const A of arrs) A.key = `${A.panel}/${A.pf}/${A.cols || ''}/${A.cw || ''}/${A.rh || ''}${A.chips === false ? '/L' : ''}`;
    // (the larger plan wins among the compositions that fit)
    return searchLayout((v, A) => compose(ctx, p, v / px, px, A), arrs, L => L.k + 1.5 * (L.planShare || 0));
  },
  build(ctx, L) {
    return g(null,
      g({name: 'plan', transform: L.M.transform},
        L.art.node,
        L.people.map(pp => pp.node)),
      g({name: 'notes', opacity: 0}, L.rings),
      L.badgeNodes,
      L.zoneChipNode,
      L.buildingChipNode,
      L.hearingChipNode,
      L.panelNode,
      L.stateNode,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G;
    const nodes = {};
    const capU = lerp(W.door[0], W.move[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    // the door closes first (the cause), then the public space moves along the track
    const open = 1 - ease.inOutCubic(seg(ua, ...W.door));
    const mq = ease.inOutCubic(seg(ua, ...W.move));
    const move = L.moveEnd * mq;
    const railP = L.moveEnd > 0 ? seg(ua, ...W.rails) : 0;
    Object.assign(nodes, L.art.frame(move, open, railP, railP > 0 ? 1 : 0));
    // participants stay seated on their benches: they travel with the public space
    L.people.forEach((pp, i) => Object.assign(nodes, seatedPose(pp, G.seatPts[i], move)));
    const dv = L.moveVec(move);
    L.badgeAt.forEach((b, i) => { if (L.badgeNodes.length) nodes[`badge${i}`] = {transform: T(r(b.x + dv.x, 2), r(b.y + dv.y, 2))}; });
    if (L.hearingChipNode) nodes['hearing-chip'] = {transform: T(r(dv.x, 2), r(dv.y, 2))};
    // hold: notes and state
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.notes) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    if (L.stateNode) nodes.state = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    const toD = L.M.toD;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.start[1] ? 'start' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const pubC = toD({x: G.rw / 2 - move, y: G.rh / 2});
    const sem = {
      beat,
      doorOpen: r(open, 3),
      move: r(move, 2),
      moveFrac: r(L.moveEnd > 0 ? move / L.moveEnd : 0, 3),
      gapTU: r(move, 1),
      separated: move >= G.gap - 0.5,
      adjacent: move <= 0.5,
      rails: r(railP, 3),
      pub: R2(pubC),
      zone: R2(toD({x: G.zone.x + G.rw / 2, y: G.rh / 2})),
      finalState: p.finalState,
      actionCapped: p.actionProgress < 1 && u > capU,
      doorClosedBeforeMove: !(mq > 0 && open > 0.001),
      people: L.people.map((pp, i) => R2(toD({x: G.seatPts[i].x - move, y: G.seatPts[i].y}))),
      allReached: true,
      textPx: r(L.F * L.px, 1),
      personPx: r(L.personPx, 1),
      k: r(L.M.k, 3),
      arrangement: L.arrangement,
      problems: L.problems,
      log: L.log,
    };
    L.people.forEach((pp, i) => { sem[`p${i}`] = sem.people[i]; });
    if (L.badgeNodes.length) L.badgeAt.forEach((b, i) => { sem[`badge${i}`] = R2({x: b.x + dv.x, y: b.y + dv.y}); sem[`badge${i}Seat`] = R2(toD({x: L.badgeTU[i].x - move, y: L.badgeTU[i].y})); });
    if (L.hearingChipNode) { sem.chipLead = R2({x: L.chipLead.x + dv.x, y: L.chipLead.y + dv.y}); sem.chipLeadTarget = R2(toD({x: L.chipLeadTU.x - move, y: L.chipLeadTU.y})); }
    return {nodes, semantic: sem};
  },
};

/** One composition at text size F (design units) for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const G = delibGeometry({n: p.seats.participants.length, rh: A.rh});
  const moveEnd = p.finalState === 'apart' ? G.gap : 0;
  const rot = A.rot;
  // ---- panel
  const items = panelItems(ctx, p, F, showAll, showKey, A.bname === 'panel', A.chips === false, A.packed);
  let region = {x: 0, y: 0, w: D.w, h: D.h};
  let panel = null, panelBox = null;
  if (items.length) {
    if (A.panel === 'column') {
      const pw = D.w * A.pf;
      panelBox = {x: D.w - pw, y: 0, w: pw, h: D.h};
      region = {x: 0, y: 0, w: D.w - pw - 30, h: D.h};
      panel = layoutPanel(items, panelBox, F, A.cols === 2 ? 'band' : 'column', A.cols);
      panel.place(panelBox);
    } else {
      panelBox = {x: 0, y: D.h * (1 - A.pf), w: D.w, h: D.h * A.pf};
      panel = layoutPanel(items, panelBox, F, 'band', A.cols);
      const used = Math.min(panel.height, panelBox.h);
      panelBox = {x: 0, y: D.h - used, w: D.w, h: used};
      region = {x: 0, y: 0, w: D.w, h: D.h - used - 26};
      panel.place(panelBox);
    }
    if (panel.problem) problems.push(panel.problem);
  }
  // ---- the plan, the ● / ◆ name chips beside their spaces, the building's chip, participants and badges
  const S = planScene(ctx, p, F, px, {G, region, rot, cw: A.cw, bname: A.bname, moveEnd, chips: A.chips !== false});
  problems.push(...S.problems);
  const {M, k, bOuter, zoneD, moveVec, people, badgeAt, badgeTU, badgeNodes, hearingChipNode, zoneChipNode, buildingChipNode, chipLead, chipLeadTU} = S;
  const personPx = S.personPx;
  if (personPx < 60.5) problems.push('small');
  const texts = [...S.texts];
  // ---- notes: solid rings on their targets (final positions)
  const notes = showAll ? p.annotations : [];
  const noteColors = [th.accent3, th.accent4];
  const partD = M.box({x: G.zone.x - G.t - 20, y: G.door.y0 - 20, w: G.t + 40, h: G.door.y1 - G.door.y0 + 40});
  const rings = notes.map((nt, i) => {
    let b;
    if (nt.target === 'publicSpace') b = M.box(G.pubOuter(moveEnd));
    else if (nt.target === 'zone') b = zoneD;
    else if (nt.target === 'separation' && moveEnd > 0) b = M.box(G.gapBox(moveEnd));
    else b = partD;
    return h('rect', {x: r(b.x - 8), y: r(b.y - 8), width: r(b.w + 16), height: r(b.h + 16), rx: 16, fill: 'none', stroke: noteColors[i % 2], 'stroke-width': 5});
  });
  // ---- audit: texts in the frame and apart
  const all = [...texts, ...(panel ? panel.boxes : [])];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlaps(all[i], all[j], 2)) { problems.push('overlap'); i = all.length; break; }
  if (panel && panel.boxes.some(b => overlaps(b, bOuter, 2))) problems.push('panel-on-plan');
  // the scene (plan, chips, panel) fills the design box: >= 0.8 of it on both axes when labels are shown
  if (showKey) {
    const ext = unionBox([bOuter, ...texts, ...(panel ? panel.boxes : [])]);
    if (Math.min(ext.w / D.w, ext.h / D.h) < 0.8) problems.push('fill');
  }
  const art = delibArt(ctx, G, {prefix: 's', closure: 'door', rails: moveEnd > 0});
  return {
    planShare: (bOuter.w * bOuter.h) / (D.w * D.h), F, px, M, G, art, people, badgeAt, badgeTU, badgeNodes, moveEnd, moveVec,
    hearingChipNode, zoneChipNode, buildingChipNode, chipLead, chipLeadTU,
    rings, noteCount: notes.length,
    panelNode: panel ? panel.node : null, stateNode: panel ? panel.stateNode : null,
    personPx, problems, k, arrangement: `${A.panel}/${A.pf}/${A.cols || ''}/${A.cw || ''}/rh${G.rh}${A.chips === false ? '/names-in-legend' : ''}`,
  };
}

/** The panel's items. */
function panelItems(ctx, p, F, showAll, showKey, bname, namesInLegend, packed) {
  const th = ctx.theme;
  const items = [];
  if (namesInLegend && showKey) {
    // the space names join their ● / ◆ rows (same style for both: equal weight)
    items.push(showAll ? legendItem2(ctx, {kind: 'pub', title: p.courts.hearing, text: p.objectLabels.hearing, F, name: 'legend-pub'}) : legendItem(ctx, {kind: 'pub', text: p.courts.hearing, F, name: 'legend-pub', weight: 700}));
    items.push(showAll ? legendItem2(ctx, {kind: 'zone', title: p.courts.deliberation, text: p.objectLabels.deliberation, F, name: 'legend-zone'}) : legendItem(ctx, {kind: 'zone', text: p.courts.deliberation, F, name: 'legend-zone', weight: 700}));
  } else if (showAll) {
    items.push(legendItem(ctx, {kind: 'pub', text: p.objectLabels.hearing, F, name: 'legend-pub'}));
    items.push(legendItem(ctx, {kind: 'zone', text: p.objectLabels.deliberation, F, name: 'legend-zone'}));
  }
  if (showKey && bname) items.push(legendItem(ctx, {kind: 'building', text: p.courts.building, F, name: 'legend-building', weight: 600}));
  if (showKey) {
    if (packed) {
      // one row: the participants' caption over their names in badge order (A, B, C…)
      const names = p.seats.participants.map(q => q.name).join(' · ');
      items.push(showAll ? legendItem2(ctx, {kind: 'person', title: p.actorLabels.participants, text: names, F, name: 'legend-people', maxLines2: 12, glyphOpts: {look: participantLooks(ctx, p)[0]}}) : legendItem(ctx, {kind: 'letter', text: names, F, name: 'legend-people', maxLines: 12, glyphOpts: {letter: LETTERS[0]}}));
    } else {
      if (showAll) items.push(legendItem(ctx, {kind: 'person', text: p.actorLabels.participants, F, name: 'legend-people', weight: 600, glyphOpts: {look: participantLooks(ctx, p)[0]}}));
      p.seats.participants.forEach((q, i) => items.push(legendItem(ctx, {kind: 'letter', text: q.name, F, name: `legend-p${i}`, glyphOpts: {letter: LETTERS[i]}})));
    }
  }
  if (showAll) {
    items.push(legendItem(ctx, {kind: 'bench', text: p.seats.bench, F, name: 'legend-bench'}));
    if (p.finalState === 'apart') items.push(legendItem(ctx, {kind: 'track', text: p.routes.track, F, name: 'legend-track'}));
    items.push(legendItem(ctx, {kind: 'partition', text: p.routes.partition, F, name: 'legend-partition'}));
    if (p.finalState === 'apart') items.push(legendItem(ctx, {kind: 'gap', text: p.labels.gap, F, name: 'legend-gap'}));
    // the order shown (the door closes, then the public space moves) is captioned as configured — only when there is
    // such an order (with the final state 'adjacent' nothing moves after the door)
    if (p.finalState === 'apart') items.push(legendItem(ctx, {kind: 'sequence', text: p.labels.sequence, F, name: 'legend-sequence'}));
    p.annotations.forEach((nt, i) => items.push(noteItem(ctx, nt.text, F, [th.accent3, th.accent4][i % 2], `note${i}`)));
  }
  if (showKey) {
    items.push(stateItem(ctx, p.finalState === 'apart' ? ctx.t.apart : ctx.t.adjacent, F, {name: 'state'}));
    items.push(keyItem(ctx, p.labels.key, F));
  }
  return items;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-08-story',
    title: 'Separate deliberation — the public space moves apart from an abstract deliberation zone',
    titleEs: 'Deliberación separada — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Deliberación separada',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A floor plan inside a generic, fictional building: a public space (the hearing room, ●) with benches and generic participants, and an abstract, empty deliberation zone (◆) behind a partition with a door. The door closes, then the public space — floor, walls, benches and seated participants — travels along a drawn track away from the zone, leaving a visible separation. Shown as configured (illustrative): no secrecy rule, attendance rule, vote, decision or outcome.',
    tags: ['floor plan', 'hearing room', 'public space', 'deliberation zone', 'partition', 'door', 'separation', 'participants', 'building', 'top-down people'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/deliberacion-separada.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
