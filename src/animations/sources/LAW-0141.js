/**
 * LAW-0141 — Ámbito territorial · story
 *
 * Storyboard (a table seen from above; brief beats in brackets):
 *  [0.00–0.15] rest: the organiser of the editable hierarchy holds the
 *              closed Text 1 (its article slip sticks out of the top edge)
 *              and Text 2 in the compartments supplied; the board of neutral
 *              hexagonal tiles shows the fictional zones with their plaques;
 *              the numbered fact pawns wait in their dish; the magnifier
 *              lies beside it. The reader's left hand comes in for the slip.
 *  [0.15–0.42] the hand pulls the slip out of the book, carries it over the
 *              board and lays it on the zone the slip names; a translucent
 *              amber sheet spreads from under it over exactly that zone's
 *              tiles (where the text is placed, as supplied). Meanwhile the
 *              right hand takes the first pawn from the dish.
 *  [0.42–0.73] the right hand sets every pawn on a tile of the zone supplied
 *              for it; each tag slides out from under its pawn. Once the
 *              sheet is down, a solid amber ring marks a pawn in the text's
 *              zone and a dashed grey ring one in another zone. The hand then
 *              takes the magnifier over the pawn placed in another zone (the
 *              lens enlarges the pawn and the boundary) and lays it back.
 *  [0.73–1.00] hold: slip, sheet, pawns, tags and rings stay; the key reads
 *              "as supplied · no conclusion drawn". `finalState` can stop
 *              after the text is placed or skip the magnifier. Nothing says
 *              that a text applies in a zone or that a fact falls under it.
 * @module animations/sources/LAW-0141
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, lerp, r} from '../../core/time.js';
import {storyFields, str, obj} from '../../schemas/fields.js';
import {
  territorialFields, CONTENT_EN, KIT_STRINGS, resolvePlacement, boardStage, STAGE, TOKEN_R,
  placeNotes, gridCands,
} from './kits/ambito-territorial.js';

const ID = 'LAW-0141';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {goL: [0.03, 0.11], pull: [0.11, 0.16], carry: [0.16, 0.26], lay: [0.26, 0.29], outL: [0.29, 0.37], spread: [0.29, 0.39], t0: 0.12, trip: 0.128};
const FINAL = ['placed-examined', 'placed', 'text-placed'];
const TARGETS = ['article', 'zone', 'fact', 'book', 'hierarchy', 'lupa'];

const sceneSchema = {
  ...territorialFields,
  ...storyFields({
    dish: str('Label on the dish holding the fact tokens', 30),
  }, TARGETS, FINAL),
};
sceneSchema.actorLabels = obj('Role caption shown next to the reader', {a: str('Caption for the reader (the hands)', 40)});

const defaultParams = {
  ...CONTENT_EN,
  actorLabels: {a: 'Reader'},
  objectLabels: {dish: 'Facts (fictional)'},
  actionProgress: 1,
  annotations: [{target: 'article', text: 'The slip names the zone where the text is placed'}],
  finalState: 'placed-examined',
};

/** Free desk regions for the notes per shape (stage units); the board itself is a fallback with a penalty. */
const NOTE_REGIONS = {
  landscape: st => {
    const lb = st.lupaBox(st.lupaRest);
    const y0 = lb.y + lb.h + 14, y1 = (st.chipBox ? st.chipBox.y : st.key.box.y) - 14;
    return [{x: 1326, y: y0, w: 348, h: Math.max(0, y1 - y0 - 60)}];
  },
  portrait: () => [],
  square: () => [],
};

const scene = {
  sizes: {landscape: [STAGE.landscape.w, STAGE.landscape.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.portrait.w, STAGE.portrait.h]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const st0 = STAGE[shape];
    const s = Math.min(ctx.design.w / st0.w, ctx.design.h / st0.h);
    const ox = (ctx.design.w - st0.w * s) / 2, oy = (ctx.design.h - st0.h * s) / 2;
    const res = resolvePlacement(p);
    const textPlaced = res.textZone >= 0;
    const placing = p.finalState !== 'text-placed';
    // the magnifier reads the first pawn placed in another zone (else the first placed pawn)
    let exIdx = res.facts.findIndex(f => f.rel === 'different');
    if (exIdx < 0) exIdx = res.facts.findIndex(f => f.zone >= 0);
    const examineWanted = p.finalState === 'placed-examined' && placing && exIdx >= 0;
    const stage = boardStage(ctx, {prefix: 'st', shape, params: p, res, arms: true, examine: examineWanted ? exIdx : null});
    const examine = examineWanted && stage.lupaExam ? exIdx : null;
    // right-hand program: one trip per placed pawn, then the magnifier (or out)
    const order = placing ? res.facts.map((f, i) => i).filter(i => stage.slots[i]) : [];
    const stepsR = [];
    let t0 = W.t0;
    const setEnd = {};
    for (const k of order) {
      stepsR.push({kind: 'go', k, w: [t0, t0 + 0.05]}, {kind: 'carry', k, w: [t0 + 0.05, t0 + 0.115]}, {kind: 'set', k, w: [t0 + 0.115, t0 + 0.128]});
      setEnd[k] = t0 + 0.128;
      t0 += W.trip;
    }
    if (examine !== null) {
      stepsR.push({kind: 'toLupa', w: [t0, t0 + 0.06]}, {kind: 'lupaTo', w: [t0 + 0.06, t0 + 0.115]}, {kind: 'exam', w: [t0 + 0.115, t0 + 0.145]}, {kind: 'lupaBack', w: [t0 + 0.145, t0 + 0.2]}, {kind: 'out', w: [t0 + 0.2, t0 + 0.245]});
      t0 += 0.245;
    } else if (order.length) {
      stepsR.push({kind: 'out', w: [t0, t0 + 0.06]});
      t0 += 0.06;
    }
    // tags open once a pawn is set; rings once both the pawn and the sheet are down
    const sheetDown = W.spread[1];
    const tagW = res.facts.map((f, i) => (setEnd[i] !== undefined ? [setEnd[i], setEnd[i] + 0.03] : f.zone < 0 && placing ? [Math.max(sheetDown, t0 - 0.03), Math.max(sheetDown, t0 - 0.03) + 0.03] : null));
    const ringW = res.facts.map((f, i) => {
      if (setEnd[i] !== undefined && textPlaced) return [Math.max(setEnd[i] + 0.01, sheetDown), Math.max(setEnd[i] + 0.01, sheetDown) + 0.03];
      if (setEnd[i] !== undefined) return [setEnd[i] + 0.01, setEnd[i] + 0.04];
      if (f.zone < 0 && placing) return [tagW[i][0], tagW[i][1]];
      return null;
    });
    const endAll = Math.max(W.outL[1], sheetDown, t0, ...ringW.filter(Boolean).map(q => q[1]), ...tagW.filter(Boolean).map(q => q[1]));
    // notes: editorial callouts and the attributed reading, in free space
    const targets = targetPoints(stage, res, examine ?? exIdx);
    const obstacles = obstaclesOf(stage);
    const regions = NOTE_REGIONS[shape](stage);
    const B = stage.B;
    const iw = B.inner.w;
    const pen = regions.length ? 260 : 0;
    const boardRegions = [
      {x: B.inner.x, y: B.inner.y + 6, w: iw, h: B.inner.h - 60, cols: 5, maxWidth: Math.min(360, iw * 0.62), pen},
      {x: B.inner.x, y: B.inner.y + 6, w: iw, h: B.inner.h - 60, cols: 9, maxWidth: 220, pen: pen + 30},
    ];
    const annots = ctx.show('all') ? p.annotations.map(a => ({text: a.text, target: targets[a.target] || targets.article})) : [];
    const it = ctx.show('all') && p.interpretations.length && placing ? p.interpretations[0] : null;
    const reading = it ? {by: it.by, text: it.text, target: targets.boundary} : null;
    const size = Math.min(20, stage.keySizeUsed ?? 20);
    // a note lying on the board stays inside the zone its target is in (it never straddles a boundary)
    const penFn = (box, tgt) => {
      if (!(box.x < B.inner.x + B.inner.w && box.x + box.w > B.inner.x && box.y < B.inner.y + B.inner.h && box.y + box.h > B.inner.y)) return 0;
      const z = B.zoneAt(tgt.x, tgt.y);
      return (1 - B.coverage(box, z, 5)) * 900;
    };
    const N = placeNotes(ctx, {annots, reading, cands: gridCands([...regions, ...boardRegions], 20), obstacles, size, penFn, bounds: {x: 8, y: 8, w: stage.W - 16, h: stage.H - 16}});
    return {stage, s, ox, oy, res, order, stepsR, tagW, ringW, examine, placing, textPlaced, actionEnd: endAll, notes: N.notes, reading: N.reading};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)}, L.stage.node, L.reading && L.reading.node, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(W.goL[0], L.actionEnd, p.actionProgress);
    const a = Math.min(u, capU);
    const stepL = [
      {kind: 'go', p: seg(a, ...W.goL)}, {kind: 'pull', p: seg(a, ...W.pull)}, {kind: 'carry', p: seg(a, ...W.carry)},
      {kind: 'lay', p: seg(a, ...W.lay)}, {kind: 'out', p: seg(a, ...W.outL)},
    ];
    const v = {
      L: L.textPlaced ? stepL : [],
      R: L.stepsR.map(st => ({kind: st.kind, k: st.k, p: seg(a, ...st.w)})),
      spread: L.textPlaced ? seg(a, ...W.spread) : 0,
      tags: L.tagW.map(w => (w ? seg(a, ...w) : 0)),
      rings: L.ringW.map(w => (w ? seg(a, ...w) : 0)),
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteStart = Math.max(0.76, L.actionEnd + 0.01);
    const noteP = done ? seg(u, noteStart, noteStart + 0.08) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.reading) Object.assign(nodes, L.reading.frame(noteP));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    const st = L.stage;
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        rels: L.res.facts.map(f => f.rel),
        zones: L.res.facts.map(f => f.zone),
        textZone: L.res.textZone,
        slotZones: st.slots.map(q => (q ? st.B.zoneAt(q.x, q.y) : -1)),
        examined: L.examine,
        finalState: p.finalState,
        notesShown: r(noteP, 3),
        actionCapped: p.actionProgress < 1 && u > capU,
        actionEnd: r(L.actionEnd, 3),
        slipOnZone: st.slipSpot ? st.B.zoneAt(st.slipSpot.cx, st.slipSpot.cy) : -1,
        slipCoverage: st.slipSpot ? r(st.slipSpot.cov, 3) : 0,
        propsClear: propsClear(st),
        lupaParkedClear: lupaClear(st, sem.lupa),
      },
    };
  },
};

const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** At the hold nothing that carries text overlaps: slip, pawns, tags, plaques. */
function propsClear(st) {
  const boxes = [];
  if (st.slipSpot) boxes.push({x: st.slipSpot.x, y: st.slipSpot.y, w: st.slipDims.W, h: st.slipDims.H});
  st.tokenBoxes.forEach((tb, i) => { if (st.slots[i]) boxes.push(tb.pawn, tb.tag); });
  st.board.plaques.forEach(q => boxes.push(q.box));
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (hit(boxes[i], boxes[j], -2)) return false;
  return true;
}

/** The magnifier (lens and handle) rests clear of every card, tag, plaque, book, dish and key. */
function lupaClear(st, pose) {
  if (!pose) return true;
  const lbs = st.lupaBoxes({x: pose.x, y: pose.y, rot: st.lupaRest.rot});
  const obs = [st.dish.box, st.key.box, ...st.bookBoxes, ...st.board.plaques.map(q => q.box), {...st.B.inner}];
  if (st.dish.labelBox) obs.push(st.dish.labelBox);
  if (st.chipBox) obs.push(st.chipBox);
  return !obs.some(q => lbs.some(lb => hit(lb, q, 2)));
}

/** Leader targets of the editorial notes (stage units). */
function targetPoints(st, res, exIdx) {
  const sp = st.slipSpot;
  const slipT = sp ? {x: sp.x + st.slipDims.W, y: sp.y + st.slipDims.H * 0.5, alts: [{x: sp.x, y: sp.y + st.slipDims.H * 0.5}, {x: sp.x + st.slipDims.W * 0.5, y: sp.y + st.slipDims.H}, {x: sp.x + st.slipDims.W * 0.25, y: sp.y + st.slipDims.H}]} : {x: st.slipRest.x, y: st.slipRest.y};
  const pl = st.board.plaques[Math.max(0, res.textZone)];
  const zoneT = pl ? {x: pl.box.x + pl.box.w / 2, y: pl.box.y + pl.box.h} : slipT;
  const ex = exIdx !== null && exIdx >= 0 && st.slots[exIdx] ? st.slots[exIdx] : null;
  const factT = ex ? {x: ex.x, y: ex.y + TOKEN_R + 10, alts: [{x: ex.x, y: ex.y - TOKEN_R - 10}, {x: ex.x + (ex.side === 'left' ? TOKEN_R + 10 : -TOKEN_R - 10), y: ex.y}]} : slipT;
  const b0 = st.bookBoxes[0];
  const bookT = b0 ? {x: b0.x + b0.w, y: b0.y + b0.h / 2} : slipT;
  const pl0 = st.org.plates[0];
  const hierT = pl0 ? {x: pl0.x + pl0.w, y: pl0.y + pl0.h / 2} : bookT;
  const lupaT = {x: st.lupaRest.x, y: st.lupaRest.y};
  // a boundary midpoint (for the attributed reading)
  const e = st.B.boundary[Math.floor(st.B.boundary.length / 2)];
  const bnd = e ? {x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2} : slipT;
  return {article: slipT, zone: zoneT, fact: factT, book: bookT, hierarchy: hierT, lupa: lupaT, boundary: bnd};
}

/** Boxes the notes must stay clear of (stage units). */
function obstaclesOf(st) {
  const out = [st.org.box, st.dish.box, st.key.box, ...st.lupaBoxes(st.lupaRest), ...st.board.plaques.map(q => q.box)];
  if (st.dish.labelBox) out.push(st.dish.labelBox);
  if (st.chipBox) out.push(st.chipBox);
  if (st.slipSpot) out.push({x: st.slipSpot.x - 6, y: st.slipSpot.y - 6, w: st.slipDims.W + 12, h: st.slipDims.H + 12});
  st.tokenBoxes.forEach(tb => out.push(tb.pawn, tb.tag));
  return out;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-06-story',
    title: 'Territorial scope — placing a text and facts on neutral zones',
    titleEs: 'Ámbito territorial — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito territorial',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Table seen from above: the reader pulls the article slip out of the fictional Text 1 (in the compartment of the editable hierarchy supplied for it) and lays it on the zone of a hexagonal board that the slip names; a translucent sheet spreads over that zone. The other hand sets numbered fact pawns on the zones supplied for them; rings mark a fact placed in the same zone as the text or in another zone, and the magnifier enlarges one pawn by the boundary. Neutral abstract zones with fictional names; only supplied placements are shown and no conclusion is drawn.',
    tags: ['territorial scope', 'zones', 'board', 'article', 'book', 'editable hierarchy', 'magnifier', 'facts', 'placement', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-territorial.js', 'src/animations/sources/kits/ambito-material.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
