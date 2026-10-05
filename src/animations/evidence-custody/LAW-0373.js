/**
 * LAW-0373 — Registro fotográfico · story
 *
 * Storyboard (the category's top-down evidence bench; a fictional object (mug / key / box, as supplied) lies on the
 * mat with its manila tag hung on a ball chain and an open evidence bag beside it; an L-shaped photo scale rests to
 * one side; an abstract camera sits folded on a two-segment stand arm clamped to the bench edge; a photo board with
 * one dashed numbered slot per supplied view waits beside the subject; two gloved hands rest at the bench edge; a
 * legend lists item, views, tag rows, custodians, times, captions, notes, the supplied state and the neutral key):
 *  0.00–0.15  rest: nothing moves; scale apart, camera parked, board empty.
 *  0.15–0.42  the action starts: the right hand takes the scale and lays it along the object's lower-left corner
 *             while the left hand takes the camera's rear handle; the right hand moves onto the shutter button. The
 *             left hand swings the camera on its arm to the first station: a view wedge runs from the lens to the
 *             bracketed field (overview = far station, wide field). Shutter: a flash, and a real copy of exactly the
 *             framed field lifts off the mat (white border fading in) and flies to slot 1 on the board.
 *  0.42–0.73  the camera is moved closer for each further view (detail with the scale; the tag on its chain): new
 *             wedge, new smaller field, flash, and each copy flies to its own slot. Cause precedes effect: a print
 *             exists only after its exposure.
 *  0.73–1.00  hold: the hands return; a thread joins every print to the same pin on the object — several views,
 *             one object. finalState: linked (every view taken and joined) · pending (the last view is framed but not
 *             taken, as supplied: its slot stays empty and the wedge stays on). No doctrine on photographic evidence.
 * @module animations/evidence-custody/LAW-0373
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {ecFields, localised, benchNode, gloveArm, panelLayout, ringRect, noteColors, R2} from './kits/evidence-art.js';
import {
  RF_EN, RF_ES, rfFields, rfRecords, rfRecordLine, rfStage, rfPose, subjectArt, rulerArt, cameraArt, standNodes,
  standProps, wedgeNodes, wedgeProps, printArt, boardArt, threadD, threadLen, pinNode, rfPanelNode, PRINT_AR, THREAD_COLOR,
} from './kits/registro-fotografico.js';

const ID = 'LAW-0373';
const DURATION = 8000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TARGETS = ['object', 'scale', 'camera', 'board'];
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {
    linked: 'Every view is photographed and each print is joined to the same object (as supplied)',
    pending: 'The last view is framed but not yet taken; the other prints are joined to the object (as supplied)',
  },
  es: {
    linked: 'Todas las vistas están fotografiadas y cada copia queda unida al mismo objeto (según lo aportado)',
    pending: 'La última vista está encuadrada pero aún sin tomar; las demás copias quedan unidas al objeto (según lo aportado)',
  },
};

const OWN_EN = {
  actorLabels: {a: 'Gloved hands of the person photographing (fictional, generic)'},
  objectLabels: {camera: 'Abstract camera on a stand arm', scale: 'Photo scale beside the object', prints: 'Prints on the photo board', tag: 'Tag on a ball chain', bag: 'Open evidence bag'},
  annotations: [{target: 'board', text: 'Each print is joined to the same object'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos enguantadas de quien fotografía (ficticias, genéricas)'},
  objectLabels: {camera: 'Cámara abstracta en un brazo de soporte', scale: 'Escala fotográfica junto al objeto', prints: 'Copias en el tablero de fotos', tag: 'Etiqueta en una cadena de bolas', bag: 'Bolsa de pruebas abierta'},
  annotations: [{target: 'board', text: 'Cada copia queda unida al mismo objeto'}],
  stateCaption: '',
};
const EN = {...RF_EN, ...OWN_EN};
const ES = {...RF_ES, ...OWN_ES};

const sceneSchema = {
  ...ecFields,
  ...rfFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the gloved hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the props in the legend', {
    camera: str('Caption for the camera on its stand', 60),
    scale: str('Caption for the photo scale', 60),
    prints: str('Caption for the prints on the board', 60),
    tag: str('Caption for the tag and its chain', 60),
    bag: str('Caption for the evidence bag', 60),
  }, ['camera', 'scale', 'prints', 'tag', 'bag']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 80),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): linked — every view is taken and each print is joined to the object; pending — the last view is framed but not taken', ['linked', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 120),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'linked'};

function makePlan(targets, finalState) {
  const n = targets.length;
  const v0 = 0.33, v1 = 0.73, B = (v1 - v0) / n;
  const views = Array.from({length: n}, (_, i) => {
    const t0 = v0 + i * B;
    return {target: targets[i], move: [t0, t0 + B * 0.42], shoot: [t0 + B * 0.48, t0 + B * 0.6], fly: [t0 + B * 0.6, t0 + B * 0.96]};
  });
  return {
    ruler: true, rulerReach: [0.15, 0.2], rulerCarry: [0.2, 0.28], camReach: [0.16, 0.24], auxReach: [0.28, 0.33],
    views, back: [0.74, 0.8], shots: views.map((_, i) => finalState !== 'pending' || i < n - 1), keepWedge: finalState === 'pending',
  };
}
const W = {threads: [0.76, 0.84], pin: [0.75, 0.78], notes: [0.8, 0.86], state: [0.8, 0.86]};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  const it = P.items[0];
  if (showKey) rows.push({kind: 'heading', icon: `object-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) P.views.forEach((v, i) => rows.push({kind: 'item', icon: 'rf-print', text: v.label, name: `lg-view${i}`}));
  if (showKey) recs.forEach((rw, i) => rows.push({kind: 'item', icon: rw.filled ? 'row-filled' : 'row-blank', text: rfRecordLine(rw, P.labels.blank), name: `lg-rec${i}`}));
  if (showAll) P.custodians.forEach((c, i) => rows.push({kind: 'item', icon: i === 0 ? 'glove' : 'custodian', text: `${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => rows.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showAll) rows.push({kind: 'item', icon: 'rf-camera', text: P.objectLabels.camera, name: 'lg-camera'});
  if (showAll) rows.push({kind: 'item', icon: 'rf-scale', text: P.objectLabels.scale, name: 'lg-scale'});
  if (showAll) rows.push({kind: 'item', icon: 'rf-thread', text: P.objectLabels.prints, name: 'lg-prints'});
  if (showAll) rows.push({kind: 'item', icon: 'tag', text: P.objectLabels.tag, name: 'lg-tag'});
  if (showAll) rows.push({kind: 'item', icon: 'bag', text: P.objectLabels.bag, name: 'lg-bag'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.actorLabels.a, name: 'lg-hands'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function legendFor(ctx, rows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const gap = F * 1.3;
  if (!rows.length) return {bench: {x: 0, y: 0, w: DW, h: DH}, panel: null, PL: null};
  if (opt.mode === 'below') {
    const cols = opt.cols;
    const colW = (DW - 8 - (cols - 1) * F * 1.2) / cols;
    let PLs = [panelLayout(ctx, rows, {w: colW, F})];
    if (cols === 2) {
      let best = null;
      for (let i = 1; i < rows.length; i++) {
        const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
        if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
      }
      if (best) PLs = best.cols;
    }
    const ph = Math.max(...PLs.map(q => q.h));
    return {bench: {x: 0, y: 0, w: DW, h: DH - ph - gap}, panel: {x: 4, y: DH - ph}, PL: {cols: PLs, h: ph, ok: PLs.every(q => q.ok), colW}};
  }
  const PW = DW * opt.pw;
  const one = panelLayout(ctx, rows, {w: PW, F});
  return {bench: {x: 0, y: 0, w: DW - PW - gap, h: DH}, panel: {x: DW - PW, y: Math.max(0, (DH - one.h) / 2)}, PL: {cols: [one], h: one.h, ok: one.ok && one.h <= DH, colW: PW}};
}

function compose(ctx, P, recs, LG, st) {
  const {bench, PL} = LG;
  const inset = Math.max(14, Math.min(bench.w, bench.h) * 0.035);
  const mat = {x: bench.x + inset * 1.6, y: bench.y + inset * 1.6, w: bench.w - inset * 3.2, h: bench.h - inset * 3.2};
  const G = bench.h > 200 && bench.w > 200 ? rfStage(mat, {kind: P.items[0].kind, targets: P.views.map(v => v.target), slots: P.views.length, rows: recs.length, ...st}) : null;
  const printOk = G && G.tray.pw >= G.S * 1.05;
  const ok = (!PL || PL.ok) && G && G.fits && G.S >= 95 && printOk;
  return {bench, mat, panel: LG.panel, PL, G, ok, problems: [PL && !PL.ok && 'panel-text', (!G || !G.fits) && 'stage-fit', (!G || G.S < 95) && 'stage-small', G && !printOk && 'print-small'].filter(Boolean)};
}

function poseAt(L, u) {
  const P = L.P;
  const capU = lerp(0.15, 0.8, clamp(P.actionProgress));
  const ua = P.actionProgress >= 1 ? u : Math.min(u, capU);
  const s = rfPose(L.G, L.C, L.plan, ua);
  s.capped = P.actionProgress < 1 && u > capU;
  return s;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const recs = rfRecords(P);
    const rows = legendRows(ctx, P, recs);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{mode: 'below', cols: 1}, {mode: 'below', cols: 2}]
      : shape === 'square' ? [{mode: 'side', pw: 0.4}, {mode: 'side', pw: 0.46}, {mode: 'side', pw: 0.52}, {mode: 'below', cols: 2}]
        : [{mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.3}, {mode: 'side', pw: 0.35}];
    const stages = shape === 'landscape'
      ? [0.26, 0.3, 0.34].flatMap(f => [{tray: 'right', trayFrac: f, approach: 'left'}, {tray: 'right', trayFrac: f, approach: 'down'}])
      : [{tray: 'right', trayFrac: 0.3, approach: 'down'}, {tray: 'right', trayFrac: 0.36, approach: 'down'}, {tray: 'top', trayFrac: 0.24, approach: 'down'}, {tray: 'top', trayFrac: 0.3, approach: 'down'}];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const opt of opts) {
        const LG = legendFor(ctx, rows, F, opt);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const st of stages) {
          const c = compose(ctx, P, recs, LG, st);
          c.F = F;
          const score = (c.G ? c.G.S * Math.pow(Math.min(1, c.G.tray.pw / (2 * c.G.S)), 0.5) : 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    if (!C.G) C.G = rfStage({x: 20, y: 20, w: Math.max(300, C.mat.w), h: Math.max(300, C.mat.h)}, {kind: P.items[0].kind, targets: P.views.map(v => v.target), slots: P.views.length, rows: recs.length, tray: 'right', trayFrac: 0.3});
    const G = C.G;
    const bb = C.bench.y + C.bench.h;
    const sOff = Math.max(70, C.bench.h * 0.08);
    // shoulders below the hands' working areas (short, natural arms)
    const plan0 = makePlan(P.views.map(v => v.target), P.finalState);
    const cams = [G.park, ...plan0.views.map(v => G.stations[v.target])];
    const camX = cams.reduce((a, c) => a + c.x, 0) / cams.length;
    const auxX = (G.ruler.rest.x + G.ruler.placed.x + cams.reduce((a, c) => a + c.x, 0) / cams.length) / 3 + G.S * 0.5;
    const lx = clamp(camX - G.S * 0.6, C.bench.x + C.bench.w * 0.08, C.bench.x + C.bench.w * 0.6);
    const rx = clamp(Math.max(auxX + G.S * 0.4, lx + C.bench.w * 0.28), C.bench.x + C.bench.w * 0.35, C.bench.x + C.bench.w * 0.92);
    C.shoulderR = {x: rx, y: bb + sOff};
    C.shoulderL = {x: lx, y: bb + sOff};
    const armW = clamp(G.S * 0.17, 30, 46);
    C.restAux = {x: C.shoulderR.x - armW * 0.6, y: bb - armW * 0.9};
    C.restCam = {x: C.shoulderL.x + armW * 0.6, y: bb - armW * 0.9};
    const plan = makePlan(P.views.map(v => v.target), P.finalState);
    const L0 = {P, G, C, plan};
    let far = 0;
    for (let i = 0; i <= 100; i++) {
      const s = poseAt(L0, i / 100);
      far = Math.max(far, Math.hypot(s.aux.x - C.shoulderR.x, s.aux.y - C.shoulderR.y), Math.hypot(s.camHand.x - C.shoulderL.x, s.camHand.y - C.shoulderL.y));
    }
    const armLen = far * 0.56 + 20;
    const armR = gloveArm(ctx, {name: 'armR', handed: 'right', upper: armLen, lower: armLen, width: armW});
    const armL = gloveArm(ctx, {name: 'armL', handed: 'left', upper: armLen, lower: armLen, width: armW});
    const notes = noteColors(ctx.theme);
    const pad = 12;
    const Tr = G.tray;
    const end = poseAt(L0, 1);
    const tgt = name => {
      if (name === 'object') return {x: G.objC.x - G.M.w / 2 - pad, y: G.objC.y - G.M.h / 2 - pad, w: G.M.w + pad * 2, h: G.M.h + pad * 2};
      if (name === 'scale') { const R0 = G.ruler.placed; return {x: R0.x - pad, y: R0.y - G.ruler.Lv - pad, w: G.ruler.L + pad * 2, h: G.ruler.Lv + pad * 2}; }
      if (name === 'camera') { const c = end.cam, R = G.CM.radius; return {x: c.x - R - pad, y: c.y - R - pad, w: (R + pad) * 2, h: (R + pad) * 2}; }
      const xs = Tr.slots.map(s => s.x), ys = Tr.slots.map(s => s.y);
      const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
      return {x: x0, y: y0, w: Math.max(...Tr.slots.map(s => s.x + s.w)) + pad - x0, h: Math.max(...Tr.slots.map(s => s.y + s.h)) + pad - y0};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    const sag = G.S * 0.25;
    const threads = Tr.slots.map(s => {
      const a = {x: s.x + s.w / 2, y: s.y};
      return {a, d: threadD(a, G.pin, sag), len: threadLen(a, G.pin, sag)};
    });
    return {P, recs, C, G, plan, armR, armL, rings, threads};
  },
  build(ctx, L) {
    const {C, G, P} = L;
    const bench = benchNode(ctx, {prefix: 'bench', x: C.bench.x, y: C.bench.y, w: C.bench.w, h: C.bench.h});
    const pw = G.tray.pw, ph = pw / PRINT_AR;
    const prints = lvl => P.views.map((v, i) => printArt(ctx, G, G.fields[v.target], {name: `pr${lvl}${i}`, pw, ph, index: i, rows: L.recs, ruler: true, numberText: ctx.show('key') ? String(i + 1) : null}));
    const threads = L.threads.map((t, i) => h('path', {name: `th${i}`, d: t.d, fill: 'none', stroke: THREAD_COLOR, 'stroke-width': Math.max(3, G.S * 0.025), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(t.len)} ${r(t.len + 20)}`, 'stroke-dashoffset': r(t.len)}));
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, rfPanelNode(ctx, PLc))) : [];
    return g({name: 'scene'},
      bench.surface,
      g({'clip-path': bench.clip},
        boardArt(ctx, G, {name: 'board'}),
        subjectArt(ctx, G, {name: 'subject', prefix: 'sc', rows: L.recs, ruler: false}),
        g({name: 'rulerLo'}, rulerArt(ctx, G)),
        prints('L'),
        standNodes(ctx, G, 'stand'),
        wedgeNodes(ctx, 'wd'),
        threads,
        pinNode(ctx, G, 'objpin'),
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm,
        g({name: 'rulerHi', opacity: 0}, rulerArt(ctx, G)),
        g({name: 'cam'}, cameraArt(ctx, G.CM, {name: 'camArt'})),
        h('circle', {name: 'flash', r: r(G.S * 0.32), fill: '#fffbe6', opacity: 0}),
        L.armL.thumb, L.armR.thumb,
        prints('H'),
      ),
      bench.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      panels,
    );
  },
  frame(ctx, L, u) {
    const {C, G, P, plan} = L;
    const s = poseAt(L, u);
    const done = P.actionProgress >= 1;
    const nodes = {};
    nodes.rulerLo = {transform: T(s.rul.x, s.rul.y, s.rul.a), opacity: s.rulerHeld ? 0 : 1};
    nodes.rulerHi = {transform: T(s.rul.x, s.rul.y, s.rul.a), opacity: s.rulerHeld ? 1 : 0};
    nodes.cam = {transform: T(s.cam.x, s.cam.y, s.cam.a)};
    Object.assign(nodes, standProps('stand', G, s.cam));
    const vi = Math.max(0, s.vi);
    Object.assign(nodes, wedgeProps('wd', G, s.cam, G.fields[P.views[vi].target], s.wedgeOp));
    const tip = {x: s.cam.x + Math.sin(s.cam.a * Math.PI / 180) * G.CM.Cs * 0.7, y: s.cam.y - Math.cos(s.cam.a * Math.PI / 180) * G.CM.Cs * 0.7};
    nodes.flash = {cx: r(tip.x), cy: r(tip.y), opacity: r(s.flash * 0.9, 3)};
    s.prints.forEach((p, i) => {
      const hi = p.state === 'captured' || p.state === 'flying';
      const lo = p.state === 'placed';
      nodes[`prH${i}`] = {transform: T(p.x, p.y, 0, p.s), opacity: hi ? 1 : 0};
      nodes[`prL${i}`] = {transform: T(p.x, p.y, 0, p.s), opacity: lo ? 1 : 0};
      nodes[`prH${i}-border`] = {opacity: r(p.border || 0, 3)};
      nodes[`prL${i}-border`] = {opacity: 1};
    });
    const pr = L.armR.pose(C.shoulderR, s.aux, -1);
    const pl = L.armL.pose(C.shoulderL, s.camHand, 1);
    Object.assign(nodes, pr.nodes, pl.nodes);
    const thK = L.threads.map((t, i) => {
      const a = W.threads[0] + i * 0.025;
      return done && plan.shots[i] ? seg(u, a, a + 0.06) : 0;
    });
    thK.forEach((k, i) => { nodes[`th${i}`] = {'stroke-dashoffset': r(L.threads[i].len * (1 - k), 1)}; });
    const pinK = done ? seg(u, ...W.pin) : 0;
    nodes.objpin = {opacity: r(pinK, 3)};
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const btnPress = {x: s.btnG.x, y: s.btnG.y + s.press * G.S * 0.03};
    return {
      nodes,
      semantic: {
        beat, phase: s.phase, view: s.vi,
        handR: R2(pr.hand), handL: R2(pl.hand), cam: R2(s.cam), camAngle: r(s.cam.a, 2), camGrip: R2(s.camG), btn: R2(btnPress), rulerGrip: R2(s.rulerG), ruler: R2(s.rul),
        rulerHeld: s.rulerHeld, rulerPlaced: s.placedRuler, camHeld: s.camHeld, onButton: s.auxOn, flash: r(s.flash, 3), wedge: r(s.wedgeOp, 3),
        prints: s.prints.map(p => p.state), print0: R2(s.prints[0]), print1: R2(s.prints[1]), print2: s.prints[2] ? R2(s.prints[2]) : {x: 0, y: 0},
        threads: thK.map(k => r(k, 3)), pin: r(pinK, 3),
        allReached: pr.reached && pl.reached,
        rows: L.recs.map(rw => rw.filled), finalState: P.finalState, actionCapped: s.capped,
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1), approach: G.approach,
        bench: {x: r(C.bench.x), y: r(C.bench.y), w: r(C.bench.w), h: r(C.bench.h)},
        stage: {x: r(G.stageBox.x), y: r(G.stageBox.y), w: r(G.stageBox.w), h: r(G.stageBox.h)}, printW: r(G.tray.pw, 1),
        fields: P.views.map(v => r(G.fields[v.target].w, 1)),
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
    slug: 'evidence-custody-04-story',
    title: 'Photographic record — gloved hands lay a scale beside an object and move a camera on a stand arm through several framings; each exposure becomes a print joined to the same object',
    titleEs: 'Registro fotográfico — Microescena con objetos y actores',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Registro fotográfico',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down evidence bench. A fictional object (mug, key or box, as supplied) with its tag on a ball chain and an open evidence bag; an L-shaped photo scale; an abstract camera on a two-segment stand arm; a photo board with one slot per view. The right hand lays the scale along the object; the left hand moves the camera from a far station (overview, wide field) to closer ones (detail with the scale, the tag) while the right hand presses the shutter. Each exposure lifts a copy of exactly the framed field and carries it to its slot; in the hold a thread joins every print to the same pin on the object. Supplied state: linked, or the last view framed but not taken. No doctrine on photographic evidence; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'photography', 'photographic record', 'camera', 'scale', 'overview', 'detail', 'prints', 'gloves', 'tag', 'chain'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/registro-fotografico.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
