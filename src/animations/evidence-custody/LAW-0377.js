/**
 * LAW-0377 — Inventario de objetos · story
 *
 * Storyboard (an inventory station on the evidence bench: an open evidence bag holding several fictional objects, a
 * grey compartment rack with one cell per object — each cell with a manila tag hung on a short ball chain — and a
 * clipboard inventory list whose rows line up with the cells; one gloved arm enters from the bench's lower edge; a
 * legend lists the objects, custodians, times, captions, notes, the supplied state and the neutral key):
 *  0.00–0.15  rest: the objects lie in the bag, the cells are empty, the tags blank, no row joined.
 *  0.15–0.70  the hand takes the objects out one by one (top cell first): reach into the bag, grip, lift, carry to
 *             the object's cell, lower it in and let go. Right after each placement, if the object has a supplied
 *             list entry, its tag is written (the entry reference) and a plain line joins the tag to that row of the
 *             list; an object without an entry (as supplied) keeps a blank tag and no line.
 *  0.70–0.76  the hand returns to the bench edge.
 *  0.76–1.00  hold: objects in their cells, listed ones joined to their rows; notes, the supplied state and "as
 *             supplied · no conclusion drawn". Nothing is said about what a missing entry means.
 * @module animations/evidence-custody/LAW-0377
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {localised, benchNode, gloveArm, panelLayout, ringRect, noteColors, R2, fitG} from './kits/evidence-art.js';
import {
  ioFields, IO_EN, IO_ES, IO_LABELS_EN, IO_LABELS_ES, ioLabelFields, entryOf, rowText, composeScene, stationNodes,
  stationProps, itemWindows, travelWeights, routeAt, legendNodes,
} from './kits/inventario-objetos.js';

const ID = 'LAW-0377';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const ACT = [0.15, 0.76];
const W_NOTES = [0.77, 0.83];
const W_STATE = [0.78, 0.84];
const TARGETS = ['bag', 'rack', 'list'];

const STRINGS = {
  en: {
    linked: 'Each object lies in its cell; listed objects are joined to their rows (as supplied)',
    placed: 'The objects lie in their cells; no row is joined yet (as supplied)',
    pending: 'The objects are still in the bag (as supplied)',
  },
  es: {
    linked: 'Cada objeto está en su celda; los objetos listados quedan unidos a su fila (según lo aportado)',
    placed: 'Los objetos están en sus celdas; aún no se une ninguna fila (según lo aportado)',
    pending: 'Los objetos siguen en la bolsa (según lo aportado)',
  },
};

const OWN_EN = {
  labels: IO_LABELS_EN,
  actorLabels: {a: 'Gloved hand of the person making the inventory (fictional)'},
  objectLabels: {bag: 'Evidence bag the objects come from', rack: 'Compartment rack, one cell per object', list: 'Inventory list'},
  annotations: [{target: 'list', text: 'Each tag is joined to one row of the list'}],
  stateCaption: '',
};
const OWN_ES = {
  labels: IO_LABELS_ES,
  actorLabels: {a: 'Mano enguantada de quien hace el inventario (ficticia)'},
  objectLabels: {bag: 'Bolsa de la que salen los objetos', rack: 'Bandeja de celdas, una por objeto', list: 'Listado de inventario'},
  annotations: [{target: 'list', text: 'Cada etiqueta queda unida a una fila del listado'}],
  stateCaption: '',
};
const EN = {...IO_EN, ...OWN_EN};
const ES = {...IO_ES, ...OWN_ES};
/** Spanish defaults (used by the baseline-es preset). */
export const ES_PARAMS = ES;

const sceneSchema = {
  ...ioFields,
  ...ioLabelFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the gloved hand (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the props', {
    bag: str('Caption for the source bag', 60),
    rack: str('Caption for the compartment rack', 60),
    list: str('Title of the inventory list (clipboard)', 40),
  }, ['bag', 'rack', 'list']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 80),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): linked — objects placed and listed ones joined to their rows; placed — objects placed, no rows joined; pending — objects stay in the bag', ['linked', 'placed', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 100),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'linked'};

function legendRows(ctx, P) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  if (showKey) P.items.forEach((it, i) => rows.push({kind: 'item', icon: `item-${it.kind}`, text: `${it.id} — ${it.label}${entryOf(P, i) ? '' : ` · ${P.labels.noEntry}`}`, name: `lg-item${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) rows.push({kind: 'item', icon: 'bag', text: P.objectLabels.bag, name: 'lg-bag'});
  if (showAll) rows.push({kind: 'item', icon: 'rack', text: P.objectLabels.rack, name: 'lg-rack'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.actorLabels.a, name: 'lg-hand'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function plan(L, u) {
  const {P, n, W, world} = L;
  const capU = lerp(ACT[0], ACT[1], clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const s = routeAt(W, {...world, n, S: L.G.S, doPlace: P.finalState === 'pending' ? 0 : n, doLink: P.finalState === 'linked', linked: L.linked}, ua);
  s.capped = P.actionProgress < 1 && u > capU;
  return s;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const n = P.items.length;
    const texts = P.items.map((_, i) => rowText(P, i));
    const C = composeScene(ctx, {n, texts, title: ctx.show('key') ? P.objectLabels.list : null, rows: () => legendRows(ctx, P), tagText: ctx.show('key'), armRoom: true}, panelLayout);
    // panel layouts were computed per F inside composeScene; recompute for the chosen F
    const G = C.st.G, SF = C.st.SF;
    const linked = P.items.map((_, i) => Boolean(entryOf(P, i)));
    const tagFits = P.items.map((_, i) => {
      if (!ctx.show('key') || !linked[i]) return null;
      const f = fitG(P.records[i].field, {maxWidth: G.tagW * 0.62, size: Math.min(C.F, G.tagH * 0.5), minSize: 16, maxLines: 1, weight: 700});
      return f.ok ? f : null;
    });
    const X = v => C.ox + v, Y = v => C.oy + v;
    const world = {
      slots: G.slots.map(p => ({x: X(p.x), y: Y(p.y)})),
      cells: G.cells.map(c => ({x: X(c.cx), y: Y(c.cy)})),
    };
    const bb = C.bench.y + C.bench.h;
    const armW = Math.max(28, Math.min(50, G.S * 0.26));
    const rackMid = X(G.rackX + G.rackW / 2);
    const bagMid = G.bag ? X(G.bag.x + G.bag.w / 2) : rackMid;
    const shoulder = {x: clamp(G.bagMode === 'left' ? (rackMid + bagMid) / 2 : rackMid + G.S * 0.3, C.bench.x + 60, C.bench.x + C.bench.w - 60), y: bb + Math.max(60, C.bench.h * 0.08)};
    world.rest = {x: shoulder.x + armW * 0.3, y: bb - Math.max(armW * 1.6, C.bench.h * 0.1)};
    const W = itemWindows(n, ACT[0], ACT[1], 0.06, travelWeights(world));
    const L0 = {P, n, W, world, G, linked};
    let far = 0;
    for (let i = 0; i <= 80; i++) {
      const s = plan(L0, i / 80);
      far = Math.max(far, Math.hypot(s.hand.x - shoulder.x, s.hand.y - shoulder.y));
    }
    const armLen = far * 0.58 + 20;
    const arm = gloveArm(ctx, {name: 'arm', handed: 'right', upper: armLen, lower: armLen, width: armW});
    // note rings
    const notes = noteColors(ctx.theme);
    const pad = 12;
    const tgt = name => {
      if (name === 'bag' && G.bag) return {x: X(G.bag.x) - pad, y: Y(G.bag.y) - pad, w: G.bag.w + pad * 2, h: G.bag.h + pad * 2};
      if (name === 'list') return {x: X(G.sheet.x) - pad, y: Y(G.sheet.y) - pad, w: G.sheet.w + pad * 2, h: G.sheet.h + pad * 2};
      return {x: X(G.rackX) - pad, y: Y(G.rackY) - pad, w: G.rackW + pad * 2, h: G.rackH + pad * 2};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    // final panel layout at the chosen F
    const N = stationNodes(ctx, G, {prefix: 'st', ox: C.ox, oy: C.oy, kinds: P.items.map(it => it.kind), SF, tagFits, showText: ctx.show('key'), tagWritable: linked});
    return {P, n, C, G, SF, N, linked, tagFits, world, shoulder, W, arm, rings};
  },
  build(ctx, L) {
    const {C, G} = L;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const N = L.N;
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, legendNodes(ctx, PLc))) : [];
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        N.rack, N.sheet, N.bagBack, N.inBag, N.bagFront, N.placed, N.tags, N.links,
        L.arm.arm, L.arm.palm, N.carried, L.arm.thumb,
      ),
      bench.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, G, P} = L;
    const s = plan(L, u);
    const nodes = stationProps(G, L.N, {prefix: 'st', ox: C.ox, oy: C.oy}, s.items);
    const pa = L.arm.pose(L.shoulder, s.hand, 1);
    Object.assign(nodes, pa.nodes);
    const done = P.actionProgress >= 1;
    const noteK = done ? seg(u, ...W_NOTES) : 0;
    const stateK = done ? seg(u, ...W_STATE) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const held = s.holding >= 0 ? s.items[s.holding].pos : s.hand;
    const items = s.items.map((it, i) => it.state === 'carried' ? R2(it.pos) : it.state === 'placed' ? R2(L.world.cells[i]) : R2(L.world.slots[i]));
    const sem = {
      beat, hand: R2(pa.hand), grip: R2(held), holding: s.holding,
      states: s.items.map(it => it.state), links: s.items.map(it => r(it.link, 3)),
      placedCount: s.items.filter(it => it.state === 'placed').length,
      linked: L.linked, allReached: pa.reached, finalState: P.finalState, actionCapped: s.capped,
      problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1),
      cells: L.world.cells.map(R2),
      rows: G.rows.map(rw => r(C.oy + rw.y)),
      bench: {x: r(C.bench.x), y: r(C.bench.y), w: r(C.bench.w), h: r(C.bench.h)},
    };
    items.forEach((p, i) => { sem[`item${i}`] = p; });
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'evidence-custody-05-story',
    title: 'Object inventory — a gloved hand takes objects out of a bag, puts each into its rack cell and the cell tags are joined to their rows on an inventory list',
    titleEs: 'Inventario de objetos — Microescena con objetos y actores',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Inventario de objetos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'An inventory station on an evidence bench: an open evidence bag with several fictional objects (key, mug, box, phone, wallet or notebook, as supplied), a grey compartment rack with one cell per object, each cell with a manila tag on a short ball chain, and a clipboard inventory list whose rows line up with the cells. A gloved hand takes the objects out one by one and puts each into its cell; when an object has a supplied list entry its tag is written and a plain line joins it to that row; an object without an entry keeps a blank tag and no line. The hold shows the supplied state. No custody or admissibility doctrine, no meaning given to a missing entry; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'inventory', 'list', 'rack', 'cells', 'tag', 'ball chain', 'evidence bag', 'gloves', 'objects'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/inventario-objetos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
