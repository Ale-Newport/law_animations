/**
 * LAW-0385 — Comparación de huellas digitales · story
 *
 * Storyboard (a fingerprint comparison station on the category's evidence bench: a steel-rimmed light box with two
 * card rows; the REFERENCE card (slate strip) already lies in the upper row with its symbolic chain of tiles; the
 * LIFTED card (manila strip) with its own chain lies askew on the mat below its empty dashed slot; beside them the
 * fictional object in its open evidence bag with the manila tag on a ball chain; a reading frame stands parked beside
 * the light box; two gloved hands rest at the bench edge; a legend lists the item, both cards, the two pair states,
 * tag rows, custodians, times, captions, notes, the supplied state and the neutral key):
 *  0.00–0.15  rest: nothing moves; identifiers editable in the legend.
 *  0.15–0.42  the action starts: the left hand takes the lifted card at its lower edge and slides it into the lower
 *             row so its chain lines up tile by tile under the reference chain; the right hand takes the reading
 *             frame by its handle and sets it over the first segment pair. The comparison starts: the pair under the
 *             frame is linked — equal supplied symbols get a plain bridge, differing ones two open stubs.
 *  0.42–0.73  the frame is slid segment by segment along both chains, always held by the right hand; each pair is
 *             linked only once the frame sits on it (cause before effect).
 *  0.73–1.00  hold: the frame goes back to its place, the hands rest; every compared pair keeps its bridge or open
 *             stubs. finalState: compared (every pair) · pending (as supplied: the last pair is left uncompared, no
 *             link). Nothing is said about identity, reliability or any outcome.
 * @module animations/evidence-custody/LAW-0385
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {ecFields, localised, benchNode, gloveArm, ringRect, noteColors, R2, pathAt} from './kits/evidence-art.js';
import {
  FC_EN, FC_ES, fcFields, fcRecords, fcRecordLine, sameAt, fcStage, cardArt, slotOutline, lightBoxArt, linkArt, linkProps,
  readerArt, stationBag, poseAt, fcLegendFor, fcPanels,
} from './kits/comparacion-huellas.js';

const ID = 'LAW-0385';
const DURATION = 7000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TARGETS = ['object', 'cards', 'pairs', 'reader'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const W = {reachL: [0.15, 0.2], carry: [0.2, 0.3], backL: [0.3, 0.36], reachR: [0.17, 0.24], toCol: [0.28, 0.36], steps: [0.36, 0.72], park: [0.73, 0.79], backR: [0.79, 0.85], notes: [0.8, 0.86], state: [0.8, 0.86]};

const STRINGS = {
  en: {
    compared: 'Every segment pair is compared in turn: equal values bridged, differing values left open (as supplied)',
    pending: 'The last segment pair is not yet compared; the other pairs are linked as supplied',
  },
  es: {
    compared: 'Cada par de segmentos se compara por turno: valores iguales con puente, distintos abiertos (según lo aportado)',
    pending: 'El último par de segmentos aún no se compara; los demás pares quedan unidos según lo aportado',
  },
};

const OWN_EN = {
  actorLabels: {a: 'Gloved hands of the person comparing (fictional, generic)'},
  objectLabels: {lightbox: 'Light box with two card rows', reader: 'Reading frame slid pair by pair', tag: 'Tag on a ball chain', bag: 'Open evidence bag'},
  annotations: [{target: 'pairs', text: 'Each pair is linked only once the frame sits on it'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos enguantadas de quien compara (ficticias, genéricas)'},
  objectLabels: {lightbox: 'Caja de luz con dos filas de tarjetas', reader: 'Marco de lectura deslizado par a par', tag: 'Etiqueta en una cadena de bolas', bag: 'Bolsa de pruebas abierta'},
  annotations: [{target: 'pairs', text: 'Cada par se une solo cuando el marco está sobre él'}],
  stateCaption: '',
};
const EN = {...FC_EN, ...OWN_EN};
const ES = {...FC_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...fcFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the gloved hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the props in the legend', {
    lightbox: str('Caption for the light box', 60),
    reader: str('Caption for the reading frame', 60),
    tag: str('Caption for the tag and its chain', 60),
    bag: str('Caption for the evidence bag', 60),
  }, ['lightbox', 'reader', 'tag', 'bag']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 80),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): compared — every segment pair is compared; pending — the last pair is left uncompared', ['compared', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 130),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'compared'};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  const it = P.items[0];
  if (showKey) rows.push({kind: 'heading', icon: `object-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-cardA', text: P.cards.a, name: 'lg-cardA'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-cardB', text: P.cards.b, name: 'lg-cardB'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-same', text: P.matchLabels.same, name: 'lg-same'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-differ', text: P.matchLabels.differ, name: 'lg-differ'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: fcRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) rows.push({kind: 'item', icon: 'fc-lightbox', text: P.objectLabels.lightbox, name: 'lg-lightbox'});
  if (showAll) rows.push({kind: 'item', icon: 'fc-reader', text: P.objectLabels.reader, name: 'lg-reader'});
  if (showAll) rows.push({kind: 'item', icon: 'tag', text: P.objectLabels.tag, name: 'lg-tag'});
  if (showAll) rows.push({kind: 'item', icon: 'bag', text: P.objectLabels.bag, name: 'lg-bag'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.actorLabels.a, name: 'lg-hands'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function compose(ctx, P, recs, LG, arrangement) {
  const bench = LG.area;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset * 1.6, y: bench.y + inset * 1.6, w: bench.w - inset * 3.2, h: bench.h - inset * 3.2};
  const G = fcStage(mat, {n: P.segments.length, rows: recs.length, kind: P.items[0].kind, arrangement, cardRest: true});
  const ok = (!LG.PL || LG.PL.ok) && G.fits && G.ts >= 44;
  return {bench, mat, LG, G, ok, problems: [LG.PL && !LG.PL.ok && 'panel-text', !G.fits && 'stage-fit', G.ts < 44 && 'stage-small'].filter(Boolean)};
}

function plan(P) {
  const n = P.segments.length;
  const B = (W.steps[1] - W.steps[0]) / n;
  const compared = P.segments.map((_, i) => P.finalState !== 'pending' || i < n - 1);
  const last = compared.lastIndexOf(true);
  const pairs = P.segments.map((_, i) => {
    const a = W.steps[0] + i * B;
    return {arrive: a, link: [a + B * 0.08, a + B * 0.55], move: i < last ? [a + B * 0.6, a + B] : null};
  });
  return {n, B, pairs, compared, last};
}

function poseAtU(L, u) {
  const {G, C, PL0, P} = L;
  const capU = lerp(0.15, 0.8, clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const e = ease.inOutCubic;
  // card A: rest → slot
  const kc = e(seg(ua, ...W.carry));
  const card = {x: lerp(G.restA.x, G.slotA.x, kc), y: lerp(G.restA.y, G.slotA.y, kc) - Math.sin(Math.PI * kc) * G.ts * 0.15, a: lerp(G.restA.a, 0, kc)};
  const gripL = {x: G.CM.cw * 0.5, y: G.CM.ch * 0.88};
  const cardGrip = poseAt(card, gripL);
  // reader: park → column 0 → … → last compared column → park
  let reader, at = -1;
  const col = i => G.column(i);
  if (ua < W.toCol[0]) reader = {...G.park};
  else if (ua < W.toCol[1]) {
    const k = e(seg(ua, ...W.toCol));
    const c0 = col(0);
    reader = {x: lerp(G.park.x, c0.x, k), y: lerp(G.park.y, c0.y, k), a: lerp(G.park.a, 0, k)};
  } else if (ua < W.park[0]) {
    let i = 0;
    reader = {...col(0)};
    for (let j = 0; j <= PL0.last; j++) {
      const pj = PL0.pairs[j];
      if (ua >= pj.arrive) { i = j; reader = {...col(j)}; }
      if (pj.move && ua >= pj.move[0] && ua < pj.move[1]) {
        const k = e(seg(ua, ...pj.move));
        const a0 = col(j), a1 = col(j + 1);
        reader = {x: lerp(a0.x, a1.x, k), y: lerp(a0.y, a1.y, k), a: 0};
        i = -1;
        break;
      }
      if (pj.move && ua >= pj.move[1]) { i = j + 1; reader = {...col(j + 1)}; }
    }
    at = i;
  } else {
    const k = e(seg(ua, ...W.park));
    const cl = col(Math.max(0, PL0.last));
    reader = {x: lerp(cl.x, G.park.x, k), y: lerp(cl.y, G.park.y, k), a: lerp(0, G.park.a, k)};
  }
  const readerGrip = poseAt(reader, G.RM.grip);
  // left hand (card)
  let handL;
  if (ua < W.reachL[0]) handL = {...C.restL};
  else if (ua < W.reachL[1]) handL = pathAt([[W.reachL[0], C.restL], [W.reachL[1], poseAt({...G.restA}, gripL)]], ua);
  else if (ua < W.carry[1]) handL = {...cardGrip};
  else handL = pathAt([[W.backL[0], poseAt({...G.slotA, a: 0}, gripL)], [W.backL[1], C.restL]], ua);
  // right hand (reader)
  let handR;
  if (ua < W.reachR[0]) handR = {...C.restR};
  else if (ua < W.reachR[1]) handR = pathAt([[W.reachR[0], C.restR], [W.reachR[1], poseAt(G.park, G.RM.grip)]], ua);
  else if (ua < W.backR[0]) handR = {...readerGrip};
  else handR = pathAt([[W.backR[0], poseAt(G.park, G.RM.grip)], [W.backR[1], C.restR]], ua);
  const links = PL0.pairs.map((p, i) => (PL0.compared[i] ? seg(ua, ...p.link) : 0));
  const phase = ua < W.reachL[0] ? 'rest' : ua < W.carry[1] ? 'card' : ua < W.steps[0] ? 'frame' : ua < W.park[0] ? 'compare' : ua < W.backR[1] ? 'return' : 'hold';
  return {card, cardGrip, reader, readerGrip, handL, handR, links, at, phase, capped: P.actionProgress < 1 && u > capU,
    cardHeld: ua >= W.carry[0] && ua <= W.carry[1], readerHeld: ua >= W.reachR[1] && ua <= W.backR[0], cardPlaced: ua >= W.carry[1]};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = fcRecords(P);
    const rows = legendRows(ctx, P, recs);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.42}, {mode: 'side', pw: 0.5}, {mode: 'below', cols: 2}, {mode: 'below', cols: 3}]
        : [{mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.34}, {mode: 'side', pw: 0.4}, {mode: 'side', pw: 0.46, cols: 2}, {mode: 'side', pw: 0.52, cols: 2}];
    const arrs = ['wide', 'wideLow', 'tall'];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const opt of opts) {
        const LG = fcLegendFor(ctx, rows, F, opt);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const arr of arrs) {
          const c = compose(ctx, P, recs, LG, arr);
          c.F = F;
          const score = c.G.ts * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    const G = C.G;
    const bb = C.bench.y + C.bench.h;
    const sOff = Math.max(70, C.bench.h * 0.08);
    const armW = clamp(G.ts * 0.62, 28, 46);
    const xL = clamp(G.restA.x + G.CM.cw * 0.2, C.bench.x + C.bench.w * 0.08, C.bench.x + C.bench.w * 0.5);
    const xR = clamp(Math.max(G.park.x, G.column(G.n - 1).x) - G.ts * 0.4, xL + C.bench.w * 0.3, C.bench.x + C.bench.w * 0.94);
    C.shoulderL = {x: xL, y: bb + sOff};
    C.shoulderR = {x: xR, y: bb + sOff};
    C.restL = {x: xL + armW * 0.6, y: bb - armW * 0.9};
    C.restR = {x: xR - armW * 0.6, y: bb - armW * 0.9};
    const PL0 = plan(P);
    const L0 = {P, G, C, PL0};
    let farL = 0, farR = 0;
    for (let i = 0; i <= 120; i++) {
      const s = poseAtU(L0, i / 120);
      farL = Math.max(farL, Math.hypot(s.handL.x - C.shoulderL.x, s.handL.y - C.shoulderL.y));
      farR = Math.max(farR, Math.hypot(s.handR.x - C.shoulderR.x, s.handR.y - C.shoulderR.y));
    }
    const armLenL = farL * 0.56 + 20, armLenR = farR * 0.56 + 20;
    const armL = gloveArm(ctx, {name: 'armL', handed: 'left', upper: armLenL, lower: armLenL, width: armW});
    const armR = gloveArm(ctx, {name: 'armR', handed: 'right', upper: armLenR, lower: armLenR, width: armW});
    const notes = noteColors(ctx.theme);
    const pad = 10;
    const tgt = name => {
      if (name === 'object') return {x: G.bag.x - pad, y: G.bag.y - pad, w: G.bag.B.w + pad * 2, h: G.bag.B.h + pad * 2};
      if (name === 'cards') return {x: G.slotB.x - pad, y: G.slotB.y - pad, w: G.CM.cw + pad * 2, h: G.slotA.y + G.CM.ch - G.slotB.y + pad * 2};
      if (name === 'reader') {
        const p = G.park, RM = G.RM;
        return p.a ? {x: p.x - RM.len / 2 - pad, y: p.y - RM.w / 2 - pad, w: RM.len + pad * 2, h: RM.w + pad * 2}
          : {x: p.x - RM.w / 2 - pad, y: p.y - RM.h / 2 - pad, w: RM.w + pad * 2, h: RM.len + pad * 2};
      }
      const t0 = G.tileB(0), t1 = G.tileA(G.n - 1);
      return {x: t0.x - G.ts * 0.5 - pad, y: t0.y - G.ts * 0.5 - pad, w: t1.x - t0.x + G.ts + pad * 2, h: t1.y - t0.y + G.ts + pad * 2};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return {P, recs, C, G, PL0, armL, armR, rings};
  },
  build(ctx, L) {
    const {C, G, P} = L;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const links = P.segments.map((sg, i) => {
      const tb = G.tileB(i), ta = G.tileA(i);
      return linkArt(ctx, `lk${i}`, {x: tb.x, y: tb.y + G.ts * 0.5}, {x: ta.x, y: ta.y - G.ts * 0.5}, sameAt(P.segments, i), G.ts);
    });
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        lightBoxArt(ctx, G.LB, {name: 'lightbox'}),
        slotOutline(G.CM, G.slotA),
        g({transform: T(G.slotB.x, G.slotB.y)}, cardArt(ctx, G.CM, {prefix: 'cB', symbols: P.segments.map(s => s.b), role: 'b'})),
        stationBag(ctx, G, {name: 'station', prefix: 'st', rows: L.recs}),
        links,
        g({name: 'cardA'}, cardArt(ctx, G.CM, {prefix: 'cA', symbols: P.segments.map(s => s.a), role: 'a'})),
        g({name: 'reader'}, readerArt(ctx, G.RM, {})),
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm,
        L.armL.thumb, L.armR.thumb,
      ),
      bench.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      fcPanels(ctx, C.LG),
    );
  },
  frame(ctx, L, u) {
    const {C, G, P} = L;
    const s = poseAtU(L, u);
    const done = P.actionProgress >= 1;
    const nodes = {};
    nodes.cardA = {transform: T(s.card.x, s.card.y, s.card.a)};
    nodes.reader = {transform: T(s.reader.x, s.reader.y, s.reader.a)};
    s.links.forEach((k, i) => Object.assign(nodes, linkProps(`lk${i}`, sameAt(P.segments, i), k)));
    const pl = L.armL.pose(C.shoulderL, s.handL, 1);
    const pr = L.armR.pose(C.shoulderR, s.handR, -1);
    Object.assign(nodes, pl.nodes, pr.nodes);
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.LG.PL) for (const col of C.LG.PL.cols) for (const row of col.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const R = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    return {
      nodes,
      semantic: {
        beat, phase: s.phase, at: s.at,
        handL: R2(pl.hand), handR: R2(pr.hand), card: R2(s.card), cardGrip: R2(s.cardGrip), reader: R2(s.reader), readerGrip: R2(s.readerGrip),
        cardHeld: s.cardHeld, cardPlaced: s.cardPlaced, readerHeld: s.readerHeld,
        links: s.links.map(k => r(k, 3)), same: P.segments.map((_, i) => sameAt(P.segments, i)),
        tileA0: R2(G.tileA(0)), tileB0: R2(G.tileB(0)), slotA: R2(G.slotA), park: R2(G.park),
        allReached: pl.reached && pr.reached, finalState: P.finalState, actionCapped: s.capped,
        problems: C.problems, textPx: r(C.F, 1), ts: r(G.ts, 1), arrangement: G.arrangement,
        bench: R(C.bench), stage: R(G.stageBox),
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
    slug: 'evidence-custody-07-story',
    title: 'Fingerprint comparison — gloved hands slide a lifted card under a reference card on a light box and move a reading frame along their two symbolic chains, linking each segment pair in turn',
    titleEs: 'Comparación de huellas digitales — Microescena con objetos y actores',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Comparación de huellas digitales',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A comparison station on the evidence bench: a light box with two card rows; the reference card (slate strip) with its symbolic chain of glyph tiles in the upper row; the lifted card (manila strip) lying askew on the mat; the fictional object in its open bag with its tag on a ball chain; a parked reading frame. The left hand slides the lifted card into the lower row so both chains line up; the right hand moves the reading frame segment by segment, and each pair is linked once the frame sits on it: a plain bridge where the supplied symbols are equal, two open stubs where they differ. Supplied state: every pair compared, or the last pair left uncompared. The chains are symbolic; nothing about identity, reliability or outcome; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'fingerprint', 'comparison', 'light box', 'print card', 'symbolic chain', 'segments', 'reading frame', 'gloves', 'tag', 'bag'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/comparacion-huellas.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
