/**
 * LAW-0381 — Copia de evidencia digital · story
 *
 * Storyboard (a digital imaging station on the category's top-down evidence bench: the ORIGINAL storage device — a
 * fictional 2.5" drive, USB stick or memory card, as supplied — lies in an open evidence bag with its manila tag on a
 * ball chain; a duplicator dock with a source bay and a target bay sits in the middle; a blank copy device waits in a
 * grey tray; an unattached tag for the copy lies on the mat; two gloved hands rest at the bench edge; a legend lists
 * the item, the copy tag's rows, custodians, times, captions, notes, the supplied state and the neutral key):
 *  0.00–0.15  rest: nothing moves; the original's block map is complete, the copy's cells are empty outlines.
 *  0.15–0.42  the action starts: the left hand lifts the original out of its bag and seats it in the source bay
 *             (its tag and chain travel with it); the right hand takes the blank copy from the tray and seats it in
 *             the target bay; the hands withdraw, both lamps turn blue and blocks travel through the dock's window
 *             from the source bay to the target bay while the copy's block map is written cell by cell with exactly
 *             the original's pattern (cause precedes effect).
 *  0.42–0.73  completion: the lamps return to white; the left hand takes the original back into its bag (its block
 *             map never changed); the right hand moves the copy to its own spot, then picks up the waiting tag and
 *             clips it to the copy's eyelet — the ball chain appears between them: the copy is identified.
 *  0.73–1.00  hold: original in its bag with its tag, identified copy beside the dock with its tag. finalState:
 *             identified (the copy carries its tag) · pending (as supplied: the copy is made but its tag stays
 *             unattached on the mat). No doctrine on digital evidence, integrity or admissibility.
 * @module animations/evidence-custody/LAW-0381
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {
  ecFields, localised, benchNode, gloveArm, ringRect, noteColors, R2, bagBack, bagFront, chainNode, chainProps, pathAt,
} from './kits/evidence-art.js';
import {
  DC_EN, DC_ES, dcFields, dcRecords, dcRecordLine, dcStage, deviceArt, cellsOf, copyCellProps, dockArt, dockFlowProps,
  trayArt, tagT, origTagArt, copyTagArt, dcLegendFor, dcPanels,
} from './kits/copia-digital.js';

const ID = 'LAW-0381';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TARGETS = ['original', 'copy', 'dock', 'tag'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const W = {
  flowOn: [0.28, 0.3], flow: [0.3, 0.46], flowOff: [0.46, 0.48],
  chain: [0.69, 0.72], notes: [0.77, 0.83], state: [0.77, 0.83],
};

const STRINGS = {
  en: {
    identified: 'A copy is made; the original goes back to its bag and the copy carries its own tag (as supplied)',
    pending: 'A copy is made and the original goes back to its bag; the copy\'s tag is not yet attached (as supplied)',
  },
  es: {
    identified: 'Se hace una copia; el original vuelve a su bolsa y la copia lleva su propia etiqueta (según lo aportado)',
    pending: 'Se hace una copia y el original vuelve a su bolsa; la etiqueta de la copia aún no está unida (según lo aportado)',
  },
};

const OWN_EN = {
  actorLabels: {a: 'Gloved hands of the person making the copy (fictional, generic)'},
  objectLabels: {original: 'Original device, back in its bag', copy: 'Copy device with its block map written', dock: 'Duplicator dock: source bay and target bay', tag: 'Tag on a ball chain', bag: 'Open evidence bag'},
  annotations: [{target: 'copy', text: 'The copy carries its own tag'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos enguantadas de quien hace la copia (ficticias, genéricas)'},
  objectLabels: {original: 'Dispositivo original, de vuelta en su bolsa', copy: 'Dispositivo copia con su mapa de bloques escrito', dock: 'Duplicador: bahía de origen y bahía de destino', tag: 'Etiqueta en una cadena de bolas', bag: 'Bolsa de pruebas abierta'},
  annotations: [{target: 'copy', text: 'La copia lleva su propia etiqueta'}],
  stateCaption: '',
};
const EN = {...DC_EN, ...OWN_EN};
const ES = {...DC_ES, ...OWN_ES};

const {items: _ei, records: _er, ...ecRest} = ecFields;
const sceneSchema = {
  ...ecRest,
  ...dcFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the gloved hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the props in the legend', {
    original: str('Caption for the original device', 60),
    copy: str('Caption for the copy device', 60),
    dock: str('Caption for the duplicator dock', 60),
    tag: str('Caption for the tags and chains', 60),
    bag: str('Caption for the evidence bag', 60),
  }, ['original', 'copy', 'dock', 'tag', 'bag']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 80),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): identified — the copy carries its own tag; pending — the copy is made but its tag is not yet attached', ['identified', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 120),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'identified'};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const it = P.items[0];
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: `dc-orig-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: dcRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) rows.push({kind: 'item', icon: `dc-orig-${it.kind}`, text: P.objectLabels.original, name: 'lg-orig'});
  if (showAll) rows.push({kind: 'item', icon: `dc-copy-${it.kind}`, text: P.objectLabels.copy, name: 'lg-copy'});
  if (showAll) rows.push({kind: 'item', icon: 'dc-dock', text: P.objectLabels.dock, name: 'lg-dock'});
  if (showAll) rows.push({kind: 'item', icon: 'tag', text: P.objectLabels.tag, name: 'lg-tag'});
  if (showAll) rows.push({kind: 'item', icon: 'bag', text: P.objectLabels.bag, name: 'lg-bag'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.actorLabels.a, name: 'lg-hands'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function compose(ctx, P, recs, LG, orient) {
  const {bench, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset * 1.4, y: bench.y + inset * 1.4, w: bench.w - inset * 2.8, h: bench.h - inset * 2.8};
  const G = bench.w > 200 && bench.h > 200 ? dcStage(mat, {kind: P.items[0].kind, orient, rows: recs.length}) : null;
  const ok = (!PL || PL.ok) && G && G.S >= 95;
  return {bench, mat, panel: LG.panel, PL, G, ok, problems: [PL && !PL.ok && 'panel-text', (!G || G.S < 95) && 'stage-small'].filter(Boolean)};
}

/** Hand / prop plan (u windows) for the supplied state. */
function makePlan(G, C, P) {
  const tagged = P.finalState !== 'pending';
  const off = G.tagC.w * 0.42;
  const grip = p => ({x: p.x + off, y: p.y});
  const L = [[0.15, C.restL], [0.19, G.origRest], [0.27, G.srcBay], [0.33, C.restL], [0.47, C.restL], [0.52, G.srcBay], [0.6, G.origRest], [0.66, C.restL]];
  const R = [[0.15, C.restR], [0.19, G.copyRest], [0.27, G.dstBay], [0.33, C.restR], [0.47, C.restR], [0.52, G.dstBay], [0.6, G.copySpot]];
  if (tagged) R.push([0.63, grip(G.tagLie)], [0.7, grip(G.tagFinal)], [0.76, C.restR]);
  else R.push([0.66, C.restR]);
  return {L, R, tagged, off};
}

function poseAt(L, u) {
  const {P, G, plan} = L;
  const capU = lerp(0.15, 0.8, clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const hL = pathAt(plan.L, ua), hR = pathAt(plan.R, ua);
  let orig, origAt;
  if (ua < 0.19) { orig = G.origRest; origAt = 'bag'; }
  else if (ua < 0.27) { orig = hL; origAt = 'carried'; }
  else if (ua < 0.52) { orig = G.srcBay; origAt = 'dock'; }
  else if (ua < 0.6) { orig = hL; origAt = 'carried'; }
  else { orig = G.origRest; origAt = 'bag'; }
  let copy, copyAt;
  if (ua < 0.19) { copy = G.copyRest; copyAt = 'tray'; }
  else if (ua < 0.27) { copy = hR; copyAt = 'carried'; }
  else if (ua < 0.52) { copy = G.dstBay; copyAt = 'dock'; }
  else if (ua < 0.6) { copy = hR; copyAt = 'carried'; }
  else { copy = G.copySpot; copyAt = 'placed'; }
  let tag = G.tagLie, tagState = 'lying';
  if (plan.tagged && ua >= 0.63) {
    if (ua < 0.7) { tag = {x: hR.x - plan.off, y: hR.y}; tagState = 'carried'; }
    else { tag = G.tagFinal; tagState = 'attached'; }
  }
  const flowA = seg(ua, ...W.flowOn) * (1 - seg(ua, ...W.flowOff));
  const flowK = seg(ua, ...W.flow);
  return {hL, hR, orig, origAt, copy, copyAt, tag, tagState, flowA, flowK, capped: P.actionProgress < 1 && u > capU, ua};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = dcRecords(P);
    const rows = legendRows(ctx, P, recs);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.36}, {mode: 'side', pw: 0.42}, {mode: 'side', pw: 0.48}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.24}, {mode: 'side', pw: 0.28}, {mode: 'side', pw: 0.33}];
    const orients = shape === 'landscape' ? ['h'] : ['v', 'h'];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const opt of opts) {
        const LG = dcLegendFor(ctx, rows, F, opt);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const orient of orients) {
          const c = compose(ctx, P, recs, LG, orient);
          c.F = F;
          const score = (c.G ? c.G.S : 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    if (!C.G) C.G = dcStage({x: 20, y: 20, w: Math.max(400, C.mat.w), h: Math.max(300, C.mat.h)}, {kind: P.items[0].kind, orient: 'h', rows: recs.length});
    const G = C.G;
    const bb = C.bench.y + C.bench.h;
    const sOff = Math.max(70, G.S * 0.5);
    const armW = clamp(G.S * 0.2, 30, 46);
    const xs = [G.origRest.x, G.srcBay.x];
    const xr = [G.copyRest.x, G.dstBay.x, G.copySpot.x, G.tagFinal.x + G.tagC.w * 0.4];
    const lx = clamp(Math.min(...xs) + G.S * 0.2, C.bench.x + C.bench.w * 0.1, C.bench.x + C.bench.w * 0.5);
    const rx = clamp(Math.max(...xr) - G.S * 0.1, Math.max(lx + C.bench.w * 0.3, C.bench.x + C.bench.w * 0.5), C.bench.x + C.bench.w * 0.92);
    C.shoulderL = {x: lx, y: bb + sOff};
    C.shoulderR = {x: rx, y: bb + sOff};
    C.restL = {x: lx + armW * 0.8, y: bb - armW * 0.9};
    C.restR = {x: rx - armW * 0.8, y: bb - armW * 0.9};
    const plan = makePlan(G, C, P);
    const L0 = {P, G, C, plan};
    let far = 0;
    for (let i = 0; i <= 100; i++) {
      const s = poseAt(L0, i / 100);
      far = Math.max(far, Math.hypot(s.hL.x - C.shoulderL.x, s.hL.y - C.shoulderL.y), Math.hypot(s.hR.x - C.shoulderR.x, s.hR.y - C.shoulderR.y));
    }
    const armLen = far * 0.55 + 16;
    const armL = gloveArm(ctx, {name: 'armL', handed: 'left', upper: armLen, lower: armLen, width: armW});
    const armR = gloveArm(ctx, {name: 'armR', handed: 'right', upper: armLen, lower: armLen, width: armW});
    const notes = noteColors(ctx.theme);
    const pad = 12;
    const M = G.M;
    const tgt = name => {
      if (name === 'original') return {x: G.bag.x - pad / 2, y: G.bag.y - pad / 2, w: G.bag.w + pad, h: G.bag.h + pad};
      if (name === 'copy') return {x: G.copySpot.x - M.w / 2 - pad, y: G.copySpot.y - M.h / 2 - pad, w: M.w + pad * 2, h: M.h + pad * 2};
      if (name === 'dock') return {x: G.dock.x - pad, y: G.dock.y - pad, w: G.dock.w + pad * 2, h: G.dock.h + pad * 2};
      const t = plan.tagged ? G.tagFinal : G.tagLie;
      return {x: t.x + G.tagC.x0 - pad, y: t.y - G.tagC.h / 2 - pad, w: G.tagC.w + pad * 2, h: G.tagC.h + pad * 2};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    const nCells = cellsOf(M).length;
    return {P, recs, C, G, plan, armL, armR, rings, nCells};
  },
  build(ctx, L) {
    const {C, G, P} = L;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const bw = Math.max(5, G.S * 0.045);
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        g({transform: T(G.tray.x, G.tray.y)}, trayArt(ctx, G.tray.w, G.tray.h)),
        g({transform: T(G.dock.x, G.dock.y)}, dockArt(ctx, G.D, {prefix: 'dk'})),
        g({transform: T(G.bag.x, G.bag.y)}, bagBack(ctx, G.bag.B, {})),
        g({name: 'origLo'}, deviceArt(ctx, G.M, {prefix: 'oL', role: 'original'})),
        g({transform: T(G.bag.x, G.bag.y)}, bagFront(ctx, G.bag.B, {})),
        chainNode('chO', {bead: bw}),
        g({name: 'tagO'}, origTagArt(ctx, G, 'tO')),
        g({name: 'tagCLo'}, copyTagArt(ctx, G, 'tCL', L.recs)),
        chainNode('chC', {bead: bw}),
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm,
        g({name: 'origHi'}, deviceArt(ctx, G.M, {prefix: 'oH', role: 'original'})),
        g({name: 'copy'}, deviceArt(ctx, G.M, {prefix: 'cp', role: 'copy'})),
        g({name: 'tagCHi', opacity: 0}, copyTagArt(ctx, G, 'tCH', L.recs)),
        L.armL.thumb, L.armR.thumb,
      ),
      bench.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      dcPanels(ctx, C),
    );
  },
  frame(ctx, L, u) {
    const {C, G, P} = L;
    const s = poseAt(L, u);
    const done = P.actionProgress >= 1;
    const nodes = {};
    const inBag = s.origAt === 'bag';
    nodes.origLo = {transform: T(s.orig.x, s.orig.y), opacity: inBag ? 1 : 0};
    nodes.origHi = {transform: T(s.orig.x, s.orig.y), opacity: inBag ? 0 : 1};
    const holeO = G.holeOf(s.orig);
    nodes.tagO = {transform: tagT(holeO)};
    Object.assign(nodes, chainProps('chO', G.eyeOf(s.orig), holeO, G.S * 0.06));
    nodes.copy = {transform: T(s.copy.x, s.copy.y)};
    Object.assign(nodes, copyCellProps('cp', L.nCells, s.flowK * L.nCells));
    Object.assign(nodes, dockFlowProps('dk', G.D, s.flowK, s.flowA, G.dock.x, G.dock.y));
    const carried = s.tagState === 'carried';
    nodes.tagCLo = {transform: tagT(s.tag), opacity: carried ? 0 : 1};
    nodes.tagCHi = {transform: tagT(s.tag), opacity: carried ? 1 : 0};
    const chK = s.tagState === 'attached' ? seg(s.ua, ...W.chain) : 0;
    Object.assign(nodes, chainProps('chC', G.eyeOf(s.copy), G.holeOf(s.copy), G.S * 0.06));
    nodes.chC = {opacity: r(chK, 3)};
    const pl = L.armL.pose(C.shoulderL, s.hL, 1);
    const pr = L.armR.pose(C.shoulderR, s.hR, -1);
    Object.assign(nodes, pl.nodes, pr.nodes);
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const tagGrip = {x: s.tag.x + L.plan.off, y: s.tag.y};
    return {
      nodes,
      semantic: {
        beat, handL: R2(pl.hand), handR: R2(pr.hand), orig: R2(s.orig), copy: R2(s.copy), tag: R2(s.tag), tagGrip: R2(tagGrip),
        origAt: s.origAt, copyAt: s.copyAt, tagState: s.tagState, flow: r(s.flowA, 3), copied: r(s.flowK, 3),
        copyCells: Math.floor(s.flowK * L.nCells + 1e-6), cells: L.nCells, origCells: L.nCells, chain: r(chK, 3),
        allReached: pl.reached && pr.reached, rows: L.recs.map(rw => rw.filled), finalState: P.finalState, actionCapped: s.capped,
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1), orient: G.orient,
        bench: {x: r(C.bench.x), y: r(C.bench.y), w: r(C.bench.w), h: r(C.bench.h)},
        stage: {x: r(G.ext.x), y: r(G.ext.y), w: r(G.ext.w), h: r(G.ext.h)},
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
    slug: 'evidence-custody-06-story',
    title: 'Digital evidence copy — gloved hands seat an original storage device and a blank device in a duplicator dock; the copy\'s block map is written from the original, the original goes back to its bag and the copy receives its own tag',
    titleEs: 'Copia de evidencia digital — Microescena con objetos y actores',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Copia de evidencia digital',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A digital imaging station on the top-down evidence bench. The original storage device (fictional 2.5" drive, USB stick or memory card, as supplied) lies in an open evidence bag with its tag on a ball chain; a duplicator dock has a source bay and a target bay; a blank copy device waits in a tray and an unattached tag lies on the mat. The left hand seats the original in the source bay, the right hand seats the blank device in the target bay; blocks travel through the dock and the copy\'s block map is written cell by cell with the original\'s pattern, while the original\'s map never changes. The original goes back to its bag; the copy is moved to its own spot and its tag is clipped to its eyelet. Supplied state: identified, or the tag not yet attached. No doctrine on digital evidence; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'digital evidence', 'copy', 'forensic copy', 'storage device', 'duplicator', 'block map', 'tag', 'chain', 'bag', 'gloves'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/copia-digital.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
