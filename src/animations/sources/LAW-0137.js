/**
 * LAW-0137 — Ámbito material · story
 *
 * Storyboard (first-person workshop wall; brief beats in brackets):
 *  [0.00–0.15] rest: the stand (editable hierarchy) with its level plates
 *              holds the open Text 1 and the closed Text 2; the article slip
 *              sits in the book's right page; the filter holder is empty, the
 *              gate plates show empty key sockets, the collection of activity
 *              cards waits in the magazine and the magnifier stands in its
 *              cup. The reader's hand enters and takes the article by its tab.
 *  [0.15–0.42] the hand lifts the article out of the book, carries it across
 *              and clips it into the filter holder; the mark of every listed
 *              subject flies from its row into the socket of one gate plate
 *              (the article keys the filter), then the magazine gate lifts.
 *  [0.42–0.73] the cards slide down the rail one after another: over its
 *              own key the gate opens and the card drops into that bin; a
 *              card whose tag matches no key rolls off the end into the side
 *              bin. The other hand takes the magnifier and reads that tag.
 *  [0.73–1.00] hold: the magnifier is set down on the side-bin rim above the
 *              read card (its name stays visible), still showing the enlarged
 *              tag; the supplied state is
 *              shown ("subject included" / "subject not classified") with no
 *              legal conclusion. `finalState` can stop at "filter-set".
 * The match is a verbatim comparison of supplied strings; nothing is inferred.
 * @module animations/sources/LAW-0137
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, lerp, r} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {callout} from '../../primitives/annotate.js';
import {sourcesFields, activitiesField, CONTENT_EN, KIT_STRINGS, kitStrings, resolveScope, sorterStage, STAGE, cardSchedule, cardValues, attributedNote, pickSpot} from './kits/ambito-material.js';

const ID = 'LAW-0137';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  reachA: [0.06, 0.155], pull: [0.155, 0.2], carry: [0.2, 0.29], insert: [0.29, 0.32], outA: [0.325, 0.42],
  keys: [0.315, 0.4], flap: [0.395, 0.425], t0: 0.425, stagger: 0.056, slideSpan: 0.1, fallSpan: 0.03,
};
const FINAL = ['sorted-examined', 'sorted', 'filter-set'];
const TARGETS = ['article', 'filter', 'included', 'unclassified', 'book', 'hierarchy'];

const sceneSchema = {
  ...sourcesFields,
  activities: activitiesField,
  ...storyFields({
    collection: str('Label on the magazine holding the collection of activities', 30),
  }, TARGETS, FINAL),
};
sceneSchema.actorLabels.properties.a.description = 'Caption for the reader (the hands)';
sceneSchema.actorLabels.properties.b.description = 'Label of the filter holder (the filter keyed by the article)';

const defaultParams = {
  ...CONTENT_EN,
  actorLabels: {a: 'Reader', b: 'Subject filter'},
  objectLabels: {collection: 'Activities'},
  actionProgress: 1,
  annotations: [{target: 'article', text: 'The article supplies the list that keys the gates'}],
  finalState: 'sorted-examined',
};

const scene = {
  sizes: {landscape: [STAGE.landscape.w, STAGE.landscape.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.portrait.w, STAGE.portrait.h]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const st0 = STAGE[shape];
    const s = Math.min(ctx.design.w / st0.w, ctx.design.h / st0.h);
    const ox = (ctx.design.w - st0.w * s) / 2, oy = (ctx.design.h - st0.h * s) / 2;
    const scope = resolveScope(ctx, p);
    const exIdx = scope.acts.findIndex(a => a.state === 'unclassified');
    const examine = p.finalState === 'sorted-examined' && exIdx >= 0 ? exIdx : null;
    const stage = sorterStage(ctx, {prefix: 'st', shape, params: p, scope, arms: true, examine});
    // card timeline (distance-proportional slides, one after another)
    const sched = cardSchedule(stage, {t0: W.t0, stagger: W.stagger, slideSpan: W.slideSpan, fallSpan: W.fallSpan});
    const allFallen = Math.max(...sched.map(q => q.fallEnd));
    // magnifier steps follow the landing of the examined card
    let WB = null;
    if (examine !== null) {
      const L = sched[examine].fallEnd;
      WB = {reach: [Math.max(0.43, L - 0.11), L - 0.035], carry: [L - 0.035, L + 0.05], exam: [L + 0.05, L + 0.09], lay: [L + 0.09, L + 0.125], out: [L + 0.125, L + 0.19]};
    }
    const sorting = p.finalState !== 'filter-set';
    const actionEnd = !sorting ? W.keys[1] + 0.02 : WB ? WB.out[1] : allFallen + 0.01;
    const inc = scope.acts.filter(a => a.state === 'included');
    const statusInAt = sorting && inc.length ? Math.max(allFallen, 0.72) : null;
    const statusUnAt = sorting && exIdx >= 0 ? (WB ? WB.lay[1] : Math.max(allFallen, 0.72)) : null;
    // editorial notes and the attributed reading: in free wall space, clear of the props
    const notes = [];
    const t = kitStrings(p.locale);
    const {place: obstacles, lead: leadObstacles} = obstaclesOf(stage, scope);
    const targets = targetPoints(stage, scope);
    const cands = noteSlots(stage, shape);
    // the attributed reading and the editorial notes: both placement orders are
    // tried and the one whose leaders cross the fewest parts (then the shorter) is kept
    const it = ctx.show('all') && p.interpretations.length && sorting ? p.interpretations[0] : null;
    const annots = ctx.show('all') ? p.annotations : [];
    const arrange = readingFirst => {
      const placed = [];
      const out = {reading: null, notes: [], score: 0};
      const putReading = () => {
        if (!it) return;
        out.reading = attributedNote(ctx, {name: 'reading', by: it.by, text: it.text, heading: t.reading, tagline: t.attributed, cands, obstacles: [...obstacles, ...placed], leadObstacles: [...leadObstacles, ...placed], target: targets.unclassified, size: 19 * stage.G.fs});
        placed.push(out.reading.box);
        out.score += out.reading.score;
      };
      if (readingFirst) putReading();
      annots.forEach((a, i) => {
        const tgt = targets[a.target] || targets.article;
        const c = placeCallout(ctx, {name: `note${i}`, text: a.text, target: tgt, cands, obstacles: [...obstacles, ...placed], leadObstacles: [...leadObstacles, ...placed], size: 21 * stage.G.fs});
        placed.push(c.box);
        out.notes.push(c);
        out.score += c.score;
      });
      if (!readingFirst) putReading();
      return out;
    };
    const A1 = arrange(true);
    const best = it && annots.length ? [A1, arrange(false)].sort((x, y) => x.score - y.score)[0] : A1;
    const reading = best.reading;
    notes.push(...best.notes);
    const endAll = Math.max(actionEnd, statusInAt !== null ? statusInAt + 0.045 : 0, statusUnAt !== null ? statusUnAt + 0.045 : 0);
    return {stage, s, ox, oy, scope, sched, WB, exIdx, examine, sorting, actionEnd: endAll, statusInAt, statusUnAt, notes, reading, allFallen};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)}, L.stage.node, L.reading && L.reading.node, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(W.reachA[0], L.actionEnd, p.actionProgress);
    const a = Math.min(u, capU);
    const A = {reach: seg(a, ...W.reachA), pull: seg(a, ...W.pull), carry: seg(a, ...W.carry), insert: seg(a, ...W.insert), out: seg(a, ...W.outA)};
    const nK = L.scope.listed.length;
    const keys = L.scope.listed.map((_, j) => {
      const span = W.keys[1] - W.keys[0];
      const each = span * 0.55;
      const start = W.keys[0] + (nK > 1 ? (j * (span - each)) / (nK - 1) : 0);
      return seg(a, start, start + each);
    });
    const v = {a: A, keys, flap: L.sorting ? seg(a, ...W.flap) : 0};
    v.cards = L.sorting ? cardValues(a, L.sched) : undefined;
    if (L.WB) v.b = {reach: seg(a, ...L.WB.reach), carry: seg(a, ...L.WB.carry), exam: seg(a, ...L.WB.exam), lay: seg(a, ...L.WB.lay), out: seg(a, ...L.WB.out)};
    v.statusIn = L.statusInAt !== null ? seg(a, L.statusInAt, L.statusInAt + 0.04) : 0;
    v.statusUn = L.statusUnAt !== null ? seg(a, L.statusUnAt, L.statusUnAt + 0.04) : 0;
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteStart = Math.max(0.78, L.actionEnd + 0.01);
    const noteP = done ? seg(u, noteStart, noteStart + 0.09) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.reading) Object.assign(nodes, L.reading.frame(noteP));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        heldA: sem.articleHolder === 'hand' ? sem.artGrip : null,
        heldB: sem.lupaHolder === 'hand' ? sem.lupaGrip : null,
        states: L.scope.acts.map(x => x.state),
        examined: L.examine,
        finalState: p.finalState,
        statusIn: r(v.statusIn, 3),
        statusUn: r(v.statusUn, 3),
        notesShown: r(noteP, 3),
        actionCapped: p.actionProgress < 1 && u > capU,
        actionEnd: r(L.actionEnd, 3),
      },
    };
  },
};

/**
 * Boxes the notes must avoid (`place`) and boxes their leaders must not cross
 * (`lead`: every part carrying text or the magnifier; the thin rail plank and
 * the stand's back board may be crossed). Stage coordinates.
 */
function obstaclesOf(st, scope) {
  const place = [st.holderBox, st.mag.box, st.sideBin.box, ...st.bins.map(b => b.box), ...st.plates.map(q => q.box)];
  place.push({x: st.G.rack.x - 8, y: st.G.rack.y, w: st.G.rack.w + 16, h: st.rackBottom - st.G.rack.y + 8});
  const rest = st.lupaRest;
  // the magnifier's cup (and, when it is never taken, the magnifier standing in it)
  const cupBox = st.lupaPark
    ? {x: st.cupPos.x - 66, y: st.cupPos.y - (st.G.cup.ch ?? 62) - 4, w: 132, h: (st.G.cup.ch ?? 62) + 46}
    : {x: rest.x - 70, y: rest.y - 70, w: 140, h: 330};
  place.push(cupBox);
  const lead = [st.holderBox, st.mag.box, ...st.plates.map(q => q.box), st.bookBox, ...st.rack.plates];
  if (st.text2Box) lead.push(st.text2Box);
  // bins other than the one holding the unclassified card
  const ex = scope.acts.findIndex(a => a.state === 'unclassified');
  const exC = ex >= 0 ? st.plans[ex].container : null;
  st.bins.forEach((b, j) => { if (exC !== j) lead.push(b.box); });
  if (exC !== 'side') lead.push(st.sideBin.box);
  // the magnifier set down on the rim (lens + handle)
  const pk = st.lupaPark;
  if (pk) {
    const R = st.lupa.R + 6, a = (pk.rot * Math.PI) / 180, Lh = st.lupa.R + 12 + st.lupa.L;
    const end = {x: pk.x - Math.sin(a) * Lh, y: pk.y + Math.cos(a) * Lh};
    const lens = {x: pk.x - R, y: pk.y - R, w: 2 * R, h: 2 * R};
    // the handle as a chain of small boxes (a diagonal handle is not a big rectangle)
    const handle = Array.from({length: 6}, (_, i) => {
      const k = (i + 0.5) / 6;
      const q = {x: pk.x + (end.x - pk.x) * (0.3 + 0.7 * k), y: pk.y + (end.y - pk.y) * (0.3 + 0.7 * k)};
      return {x: q.x - 16, y: q.y - 16, w: 32, h: 32};
    });
    place.push(lens, ...handle);
    lead.push(lens, ...handle);
  }
  for (const b of [st.magLabel && st.magLabel.box, st.chipBox]) if (b) { place.push(b); lead.push(b); }
  // the rail plank (notes appear at the hold, once every card has left the rail)
  const {p0, p1} = st.RG;
  place.push({x: Math.min(p0.x, p1.x), y: Math.min(p0.y, p1.y) - 10, w: Math.abs(p1.x - p0.x), h: Math.abs(p1.y - p0.y) + 46});
  const status = {x: 0, y: st.G.statusY - 6, w: st.W, h: 60};
  place.push(status);
  lead.push(status);
  return {place, lead};
}

/** Leader targets for the editorial notes. */
function targetPoints(st, scope) {
  const hold = st.artHold;
  const artC = {x: hold.x + (st.art.W * hold.k) / 2, y: hold.y + st.art.H * hold.k * 0.55};
  const pl = st.plates[0];
  const ex = scope.acts.findIndex(a => a.state === 'unclassified');
  const exP = ex >= 0 ? st.plans[ex].rest : {x: st.sideBin.box.x + st.sideBin.box.w / 2, y: st.sideBin.box.y + 40};
  // the unclassified card is reached at the left edge of its tag strip (the parked lens is above it)
  const tagY = exP.y - st.chh / 2 + (st.cardsL.stripH * st.s) / 2;
  const exTag = {x: exP.x - st.cw / 2 + 2, y: tagY, alt: {x: exP.x + st.cw / 2 - 2, y: tagY}};
  // the magnifier set down above it shows that card's tag enlarged: its rim is a further anchor
  const pk = ex >= 0 && ex === st.examined ? st.lupaPark : null;
  if (pk) exTag.alts = [{x: pk.x - st.lupa.R - 6, y: pk.y}, {x: pk.x + st.lupa.R + 6, y: pk.y}];
  const inc = scope.acts.findIndex(a => a.state === 'included');
  const incP = inc >= 0 ? st.plans[inc].rest : {x: st.bins[0].box.x + st.bins[0].box.w / 2, y: st.bins[0].box.y + 60};
  return {
    article: {x: hold.x + st.art.W * hold.k, y: artC.y, alt: {x: hold.x, y: artC.y}},
    filter: {x: pl.socket.x, y: pl.box.y},
    included: {x: incP.x, y: incP.y - st.chh / 2},
    unclassified: exTag,
    book: {x: st.bookPos.x + st.book.slot.x + 40, y: st.bookPos.y + 30},
    hierarchy: {x: st.G.rack.x + st.G.rack.w / 2, y: st.rack.plates[0] ? st.rack.plates[0].y : st.G.shelves[0]},
  };
}

/** Candidate note positions per shape (stage coordinates), scanned top to bottom per free column. */
function noteSlots(st, shape) {
  const W0 = st.W;
  const cols = [];
  if (shape === 'landscape') {
    const hx1 = st.holderBox.x + st.holderBox.w;
    const lx = st.lupaRest.x - 80;
    cols.push({x: (hx1 + lx) / 2, maxWidth: Math.max(200, lx - hx1 - 24), y0: 30, y1: 330});
    const mx1 = st.mag.box.x + st.mag.box.w;
    cols.push({x: (mx1 + st.holderBox.x) / 2, maxWidth: Math.max(160, st.holderBox.x - mx1 - 24), y0: 30, y1: 300});
    // top-right corner above the magnifier's cup (free at the hold once the magnifier was used)
    if (st.lupaPark) {
      // two narrow columns: one left of the parked magnifier's handle, one right of it
      cols.push({x: hx1 + 124, maxWidth: 228, y0: 24, y1: 330});
      cols.push({x: W0 - 108, maxWidth: 196, y0: 24, y1: 240});
    }
  } else if (shape === 'portrait') {
    const rx1 = st.G.rack.x + st.G.rack.w + 12;
    cols.push({x: (rx1 + st.lupaRest.x - 70) / 2, maxWidth: Math.max(200, st.lupaRest.x - 70 - rx1 - 16), y0: st.holderBox.y + st.holderBox.h + 12, y1: 640});
    cols.push({x: (st.mag.box.x + st.mag.box.w + st.lupaRest.x - 70) / 2, maxWidth: Math.max(240, st.lupaRest.x - 70 - st.mag.box.x - st.mag.box.w - 30), y0: st.holderBox.y + st.holderBox.h + 12, y1: 820});
  } else {
    cols.push({x: st.holderBox.x / 2 + 8, maxWidth: Math.max(180, st.holderBox.x - 30), y0: 20, y1: 200});
    const gx0 = st.mag.box.x + st.mag.box.w + 12, gx1 = st.G.rack.x - 12, y0 = st.holderBox.y + st.holderBox.h + 10;
    cols.push({x: (gx0 + gx1) / 2, maxWidth: gx1 - gx0 - 6, y0, y1: 520});
    // two narrower columns side by side (two notes then share the band above the rail)
    cols.push({x: gx0 + (gx1 - gx0) / 4, maxWidth: (gx1 - gx0) / 2 - 8, y0, y1: 540});
    cols.push({x: gx0 + (3 * (gx1 - gx0)) / 4, maxWidth: (gx1 - gx0) / 2 - 8, y0, y1: 540});
  }
  const out = [];
  for (const c of cols) for (let y = c.y0; y <= c.y1; y += 20) out.push({x: c.x, y, anchor: 'middle', maxWidth: c.maxWidth});
  return out;
}

const overlap = (a, b, pad = 6) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** Callout at the free spot nearest its target whose leader crosses nothing. */
function placeCallout(ctx, o) {
  const make = (c, tgt) => {
    // a target with two anchors (the article, the unclassified card) is reached at the anchor pickSpot chose
    return callout(ctx, {name: o.name, text: o.text, chipAt: {x: c.x, y: c.y}, anchor: c.anchor, target: {x: tgt.x, y: tgt.y}, maxWidth: c.maxWidth, size: o.size, maxLines: 3});
  };
  return pickSpot(o.cands, make, o.obstacles, o.target, o.leadObstacles);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-05-story',
    title: 'Material scope — activities through a subject filter',
    titleEs: 'Ámbito material — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito material',
    treatment: 'story',
    family: 'staged-scene',
    description: 'First-person workshop wall: the reader lifts the article slip out of the open fictional Text 1 (standing on the editable-hierarchy stand) and clips it into the filter holder; the marks of its listed subjects fly into the gate plates. The collection of activity cards slides down the rail: each gate opens only for the card whose tag matches its key and the card drops into that bin; a card whose tag matches no listed subject rolls into the side bin and is read with the magnifier. Only supplied states are shown.',
    tags: ['material scope', 'subject filter', 'article', 'book', 'editable hierarchy', 'magnifier', 'activities', 'sorting', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-material.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
