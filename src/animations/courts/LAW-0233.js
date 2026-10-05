/**
 * LAW-0233 — Archivo judicial · story
 *
 * Storyboard (a floor plan seen from above: a generic, fictional archive room
 * with two blocks of mobile shelving on floor rails — the ● block for files
 * supplied as active, the ◆ block for files supplied as archived, mirror
 * images of equal weight — and, in the front wall, a counter with two trays
 * (● and ◆) and the request slip. A generic clerk stands behind the counter.
 * The identifier chip is led to the slip; a panel holds the legend, the
 * notes, the state and the key):
 *  0.00–0.15  rest: the clerk's hands on the slip; every unit packed; every
 *             name, identifier and caption is editable.
 *  0.15–0.42  the action starts: a pulse runs along the locator link from the
 *             counter to the block that holds the identifier (the block of the
 *             supplied state) and its lamp lights (the cause); then the other
 *             two units of that block roll along their rails and open the
 *             aisle at the file; the clerk walks to the aisle.
 *  0.42–0.73  the clerk walks into the aisle, takes the file from the shelf
 *             (hands on the file, the file in the hands), carries it back and
 *             sets it in the tray of its state. Labels, file and hands stay
 *             together; nothing teleports.
 *  0.73–1.00  hold: the supplied final state (the file in its tray — or, as
 *             supplied, located with the aisle open), notes keyed to solid
 *             rings, the key "as supplied · no conclusion drawn". Nothing
 *             says what archiving means, any time span, access or outcome.
 * @module animations/courts/LAW-0233
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {
  archFields, ARCH_EN, ARCH_STRINGS, archGeometry, archArt, filePose, clerkLook, archScene, legendItem, legendItem2,
  keyItem, stateItem, noteItem, layoutPanel, overlaps, unionBox, pxPerUnit, R2, searchLayout, planPerson, clerkNodes,
  walkAt, carryPoint, fileProp, STATES,
} from './kits/archivo-judicial.js';

const ID = 'LAW-0233';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], start: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  pulse: [0.15, 0.2], lamp: [0.195, 0.225], roll: [0.23, 0.37], release: [0.225, 0.255], out: [0.25, 0.46],
  reach: [0.46, 0.49], pull: [0.49, 0.52], back: [0.53, 0.69], letgo: [0.7, 0.725], notes: [0.75, 0.8], state: [0.76, 0.81],
};
const TARGETS = ['activeShelves', 'archivedShelves', 'aisle', 'counter', 'file'];

const STRINGS = {en: {...ARCH_STRINGS.en}, es: {...ARCH_STRINGS.es}};

const sceneSchema = {
  ...archFields,
  actorLabels: obj('Caption of the clerk in the legend', {
    clerk: str('Caption for the generic clerk', 60),
  }),
  objectLabels: obj('Captions of the ● / ◆ blocks and of the file in the legend', {
    active: str('Caption for ● (the block of files supplied as active)', 60),
    archived: str('Caption for ◆ (the block of files supplied as archived)', 60),
    file: str('Caption for the case file prop', 60),
  }),
  actionProgress: num('How far the locating is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a solid ring drawn on its target in the plan', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied for the final hold: atCounter = the file is set in the tray of its state; located = the file stays on its shelf with the aisle open', ['atCounter', 'located']),
};

const defaultParams = {
  ...ARCH_EN,
  actorLabels: {clerk: 'Walks to the shelf and back (generic)'},
  objectLabels: {active: 'Block of files supplied as active', archived: 'Block of files supplied as archived', file: 'The case file (fictional prop)'},
  actionProgress: 1,
  annotations: [{target: 'aisle', text: 'The aisle opens at the unit that holds the identifier'}],
  finalState: 'atCounter',
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const pf of [0.3, 0.34, 0.38]) arrs.push({panel: 'column', pf, cols: 1});
      for (const pf of [0.4, 0.44, 0.48]) arrs.push({panel: 'column', pf, cols: 2});
      for (const pf of [0.4, 0.44, 0.48]) arrs.push({panel: 'column', pf, cols: 2, chips: false});
      for (const pf of [0.3, 0.36]) arrs.push({panel: 'band', pf, cols: 3});
    } else if (shape === 'square') {
      for (const pf of [0.3, 0.34, 0.38, 0.42, 0.46, 0.5]) arrs.push({panel: 'band', pf, cols: 3, chips: false});
      for (const pf of [0.3, 0.34, 0.38]) arrs.push({panel: 'band', pf, cols: 2, chips: false});
      for (const pf of [0.34, 0.38]) arrs.push({panel: 'band', pf, cols: 3});
    } else {
      for (const pf of [0.36, 0.4, 0.44, 0.48, 0.52]) for (const cols of [2, 1]) arrs.push({panel: 'band', pf, cols});
      for (const pf of [0.4, 0.44, 0.48, 0.52]) arrs.push({panel: 'band', pf, cols: 2, chips: false});
      // the plan turned a quarter (its long side up the page): the ● / ◆ chips on the left, the identifier on the right
      for (const pf of [0.3, 0.34, 0.38, 0.42]) for (const cols of [2, 3]) arrs.push({panel: 'band', pf, cols, rot: true});
    }
    for (const A of arrs) A.key = `${A.panel}/${A.pf}/${A.cols}${A.chips === false ? '/L' : ''}${A.rot ? '/rot' : ''}`;
    // a larger plan (up to k 1.3) and a fuller frame both count
    return searchLayout((v, A) => compose(ctx, p, v / px, px, A), arrs, L => Math.min(L.k, 1.3) + 0.8 * L.fill);
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({name: 'plan', transform: L.M.transform},
        L.art.node,
        g({name: 'spine-ring', opacity: 0}, h('rect', {x: r(L.spineBox.x), y: r(L.spineBox.y), width: r(L.spineBox.w), height: r(L.spineBox.h), rx: 8, fill: 'none', stroke: th.accent2, 'stroke-width': 4})),
        L.fileNode,
        L.clerk.node),
      g({name: 'notes', opacity: 0}, L.rings),
      L.sectionNodes,
      L.idNode,
      L.panelNode,
      L.stateNode,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G;
    const b = L.fb;
    const reduced = ctx.reduced;
    const nodes = {};
    const capU = lerp(W.pulse[0], W.back[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const located = p.finalState === 'located';
    // the pulse runs from the counter to the lamp of the block that holds the identifier; then the lamp lights
    const pu = seg(ua, ...W.pulse);
    const lit = seg(ua, ...W.lamp);
    const pulseOp = pu > 0 && lit < 1 ? 1 : 0;
    // the other two units of that block roll and open the aisle
    const open = ease.inOutCubic(seg(ua, ...W.roll));
    // the clerk: hands on the slip, then out to the aisle, reach, pull, back, set the file in its tray
    const qo = seg(ua, ...W.out), qb = located ? 0 : seg(ua, ...W.back);
    let st;
    let carry;
    const legs = G.legs[b];
    if (qb > 0) st = walkAt(legs.back, qb, reduced);
    else st = walkAt(legs.out, qo, reduced);
    const reach = ease.inOutSine(seg(ua, ...W.reach));
    const release = ease.inOutSine(seg(ua, ...W.release));
    const letgo = located ? 0 : ease.inOutSine(seg(ua, ...W.letgo));
    // (continuous: the hands leave the slip, hang while walking, reach the file, hold it, let it go in the tray)
    carry = Math.max(1 - release, reach * (1 - letgo));
    Object.assign(nodes, clerkNodes(L.clerk, 'clerk', st, carry));
    // the file: on its shelf (spine) until the pull; in the hands; set in its tray
    const pull = located ? 0 : ease.inOutSine(seg(ua, ...W.pull));
    const B = G.blocks[b];
    let holder = 'shelf';
    const cp = carryPoint(st);
    const placed = qb >= 1 && letgo > 0;
    const fileAt = pull <= 0 ? B.spine : placed ? {x: G.trays[b].x, y: G.trays[b].y} : pull < 1 ? {x: lerp(B.spine.x, cp.x, pull), y: lerp(B.spine.y, cp.y, pull)} : cp;
    if (pull <= 0) Object.assign(nodes, filePose('file', B.spine, L.faceDeg, 0.25, 0));
    else {
      Object.assign(nodes, filePose('file', fileAt, placed ? 180 : pull < 1 ? L.faceDeg : st.deg, lerp(0.25, 1, pull), 1));
      holder = placed ? 'tray' : 'clerk';
    }
    Object.assign(nodes, L.art.frame({open: [b === 0 ? open : 0, b === 1 ? open : 0], lit: [b === 0 ? lit : 0, b === 1 ? lit : 0], pulse: {b, p: pu, op: pulseOp}, spine: pull > 0 ? 0 : seg(open, 0.35, 0.8)}));
    // hold: notes and state (and the located ring)
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.notes) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    if (L.stateNode) nodes.state = {opacity: r(done ? seg(u, ...W.state) : 0, 3)};
    nodes['spine-ring'] = {opacity: r(located && done ? seg(u, ...W.notes) : 0, 3)};
    const toD = L.M.toD;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.start[1] ? 'start' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const hands = cp;
    const sem = {
      beat,
      state: p.file.state,
      block: STATES[b],
      pulse: r(pu, 3),
      lamp: r(lit, 3),
      open: r(open, 3),
      carry: r(carry, 3),
      holder,
      clerk: R2(toD(st)),
      file: R2(toD(fileAt)),
      hands: R2(toD(hands)),
      inAisle: st.y < G.Y1 - 10,
      aisleOpenWhenEntering: !(st.y < G.Y1 + 30 && Math.abs(st.x - B.aisleX) < 90 && open < 0.999),
      lampBeforeRoll: !(open > 0 && lit < 1),
      finalState: p.finalState,
      actionCapped: p.actionProgress < 1 && u > capU,
      allReached: true,
      textPx: r(L.F * L.px, 1),
      personPx: r(L.personPx, 1),
      k: r(L.M.k, 3),
      arrangement: L.arrangement,
      problems: L.problems,
      log: L.log,
    };
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
  const G = archGeometry();
  const fb = p.file.state === 'archived' ? 1 : 0;
  // ---- panel
  const items = panelItems(ctx, p, F, showAll, showKey, A.chips === false);
  let region = {x: 0, y: 0, w: D.w, h: D.h};
  let panel = null;
  if (items.length) {
    if (A.panel === 'column') {
      const pw = D.w * A.pf;
      const pb = {x: D.w - pw, y: 0, w: pw, h: D.h};
      region = {x: 0, y: 0, w: D.w - pw - 30, h: D.h};
      panel = layoutPanel(items, pb, F, A.cols === 2 ? 'band' : 'column', A.cols);
      panel.place(pb);
    } else {
      const pb0 = {x: 0, y: D.h * (1 - A.pf), w: D.w, h: D.h * A.pf};
      panel = layoutPanel(items, pb0, F, 'band', A.cols);
      const used = Math.min(panel.height, pb0.h);
      const pb = {x: 0, y: D.h - used, w: D.w, h: used};
      region = {x: 0, y: 0, w: D.w, h: D.h - used - 24};
      panel.place(pb);
    }
    if (panel.problem) problems.push(panel.problem);
  }
  // ---- the plan with the ● / ◆ chips and the identifier chip
  const S = archScene(ctx, p, F, px, {G, region, rot: Boolean(A.rot), chips: A.chips !== false, idChip: true});
  problems.push(...S.problems);
  const {M, k} = S;
  const personPx = S.personPx;
  if (personPx < 60.5) problems.push('small');
  const texts = [...S.texts];
  // ---- the clerk and the file
  const clerk = planPerson(ctx, {name: 'clerk', look: clerkLook(ctx, p)});
  // (the shelved file shows once the aisle opens at it; before, the packed unit hides the shelf face)
  const fileNode = fileProp(ctx, {name: 'file'});
  const B = G.blocks[fb];
  const spineBox = {x: B.spine.x - 20, y: B.spine.y - 44, w: 40, h: 88};
  // ---- notes: solid rings on their targets (final positions)
  const notes = showAll ? p.annotations : [];
  const noteColors = [th.accent3, th.accent4];
  const tgt = {
    activeShelves: M.box({x: G.blocks[0].span.x - 10, y: G.Y0 - 12, w: G.blocks[0].span.w + 20, h: G.UL + 24}),
    archivedShelves: M.box({x: G.blocks[1].span.x - 10, y: G.Y0 - 12, w: G.blocks[1].span.w + 20, h: G.UL + 24}),
    aisle: M.box({x: B.aisle.x + 6, y: G.Y0 + 4, w: G.AW - 12, h: G.UL - 8}),
    counter: M.box({x: G.counterBox.x - 8, y: G.counterBox.y - 8, w: G.counterBox.w + 16, h: G.counterBox.h + 16}),
    file: p.finalState === 'located' ? M.box({x: B.spine.x - 16, y: B.spine.y - 40, w: 32, h: 80}) : M.box({x: G.trays[fb].x - 50, y: G.trays[fb].y - 24, w: 100, h: 52}),
  };
  const rings = notes.map((nt, i) => {
    const bx = tgt[nt.target];
    return h('rect', {x: r(bx.x - 4), y: r(bx.y - 4), width: r(bx.w + 8), height: r(bx.h + 8), rx: 12, fill: 'none', stroke: noteColors[i % 2], 'stroke-width': 5});
  });
  // ---- audit: texts in the frame and apart; the panel off the plan; the scene fills the design box
  const all = [...texts, ...(panel ? panel.boxes : [])];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlaps(all[i], all[j], 2)) { problems.push('overlap'); i = all.length; break; }
  if (panel && panel.boxes.some(bx => overlaps(bx, S.planD, 2))) problems.push('panel-on-plan');
  const ext = unionBox([S.planD, ...texts, ...(panel ? panel.boxes : [])]);
  const fill = Math.min(ext.w / D.w, ext.h / D.h);
  if (showKey && fill < 0.8) problems.push('fill');
  const art = archArt(ctx, G, {prefix: 's', fileBlock: fb});
  return {
    F, px, M, G, art, clerk, fileNode, fb, faceDeg: fb ? 90 : 270, spineBox,
    sectionNodes: S.sectionNodes, idNode: S.idNode,
    rings, noteCount: notes.length,
    panelNode: panel ? panel.node : null, stateNode: panel ? panel.stateNode : null,
    personPx, problems, k, fill, arrangement: A.key,
  };
}

/** The panel's items. */
function panelItems(ctx, p, F, showAll, showKey, namesInLegend) {
  const th = ctx.theme;
  const items = [];
  if (namesInLegend && showKey) {
    // the block names join their ● / ◆ rows (same style for both: equal weight)
    for (const [b, kind] of [[0, 'active'], [1, 'archived']]) {
      const title = b ? p.courts.archived : p.courts.active, text = b ? p.objectLabels.archived : p.objectLabels.active;
      items.push(showAll ? legendItem2(ctx, {kind, title, text, F, name: `legend-${kind}`}) : legendItem(ctx, {kind, text: title, F, name: `legend-${kind}`, weight: 700}));
    }
  } else if (showAll) {
    items.push(legendItem(ctx, {kind: 'active', text: p.objectLabels.active, F, name: 'legend-active'}));
    items.push(legendItem(ctx, {kind: 'archived', text: p.objectLabels.archived, F, name: 'legend-archived'}));
  }
  if (showKey) {
    items.push(showAll ? legendItem2(ctx, {kind: 'room', title: p.courts.archive, text: p.courts.building, F, name: 'legend-room'}) : legendItem(ctx, {kind: 'room', text: p.courts.archive, F, name: 'legend-room', weight: 700}));
    items.push(showAll ? legendItem2(ctx, {kind: 'person', title: p.seats.clerk.name, text: p.actorLabels.clerk, F, name: 'legend-clerk', glyphOpts: {look: clerkLook(ctx, p)}}) : legendItem(ctx, {kind: 'person', text: p.seats.clerk.name, F, name: 'legend-clerk', weight: 700, glyphOpts: {look: clerkLook(ctx, p)}}));
  }
  if (showAll) {
    items.push(legendItem(ctx, {kind: 'file', text: p.objectLabels.file, F, name: 'legend-file'}));
    items.push(legendItem(ctx, {kind: 'unit', text: p.routes.rails, F, name: 'legend-rails'}));
    items.push(legendItem(ctx, {kind: 'locator', text: p.routes.locator, F, name: 'legend-locator'}));
    items.push(legendItem(ctx, {kind: 'counter', text: p.seats.counter, F, name: 'legend-counter'}));
    // the order shown (the lamp lights, then the units roll, then the clerk fetches the file) is captioned as configured
    items.push(legendItem(ctx, {kind: 'sequence', text: p.labels.sequence, F, name: 'legend-sequence'}));
    p.annotations.forEach((nt, i) => items.push(noteItem(ctx, nt.text, F, [th.accent3, th.accent4][i % 2], `note${i}`)));
  }
  if (showKey) {
    items.push(stateItem(ctx, p.finalState === 'located' ? ctx.t.located : ctx.t.atCounter, F, {name: 'state'}));
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
    slug: 'courts-09-story',
    title: 'Court archive — mobile shelves locate a case file by its identifier',
    titleEs: 'Archivo judicial — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Archivo judicial',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A floor plan of a generic, fictional archive room: two mirrored blocks of mobile shelving on rails (● files supplied as active, ◆ files supplied as archived) and a counter with two trays and a request slip. A pulse runs along the locator link to the block that holds the identifier, its lamp lights, the units roll and open the aisle at the file, and a generic clerk fetches the file and sets it in the tray of its state. Shown as supplied (illustrative): no retention, access or archiving rule, no time span and no outcome.',
    tags: ['floor plan', 'archive', 'mobile shelving', 'identifier', 'case file', 'clerk', 'counter', 'active', 'archived', 'top-down people'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/archivo-judicial.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
