/**
 * LAW-0349 — Devolución para nuevo examen · story
 *
 * Storyboard (a top-down desk laid out as the supplied return route: one in-tray per supplied point, each under its
 * name plate, and the review desk mat where the folder lies; a lane with chevron arrows runs from the review desk
 * past every tray; at each tray mouth a pair of filter doors — only the doors of the configured return point stand
 * open, swung across the lane; a slip of review notes lies on the mat; a desk calendar is a fixture only; the two
 * hands of a generic clerk rest at the desk's edge):
 *  0.00–0.15  rest: the folder (decision of the initial examination inside) lies on the review mat; nothing moves.
 *  0.15–0.42  the action starts: the right hand picks up the slip of review notes and presses it onto the folder;
 *             then it grips the folder and slides it off the mat onto the lane, in the return direction, to the
 *             hand-over point half way along the lane; the left hand reaches the same point.
 *  0.42–0.73  hand-over at a shared point (both hands on the folder), the left hand carries it on along the lane to
 *             the open doors of the configured point and pushes it into that tray, lets go; both hands go back.
 *  0.73–1.00  hold: the folder with its notes lies in the configured tray; the legend shows the route, the notes
 *             (as supplied), the supplied state and "renewed examination: not shown, no outcome"; key "as supplied ·
 *             no conclusion drawn". No doctrine about where a case goes back to, no result of a new examination.
 * @module animations/review/LAW-0349
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {topArm, deskWindow} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  dnFields, DN_EN, DN_ES, localisedDn, resolveDn, boardModel, returnPath, laneArt, folderArt, slipArt, trayArt, matArt,
  plateArt, doorArt, doorT, calendarNode, panelLayout, panelNode, ringRect, noteColors, R2,
} from './kits/devolucion-nuevo-examen.js';

const ID = 'LAW-0349';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  reachPad: [0.15, 0.2], carryNote: [0.2, 0.26], press: [0.26, 0.28], toGrip: [0.28, 0.31], slideR: [0.31, 0.42],
  reachL: [0.34, 0.42], handoff: [0.42, 0.45], slideL: [0.45, 0.6], release: [0.6, 0.62], retractR: [0.45, 0.57],
  retractL: [0.62, 0.73], notes: [0.74, 0.79], state: [0.75, 0.8], renewed: [0.76, 0.81],
};
const TARGETS = ['folder', 'notes', 'doors', 'calendar'];
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {pending: 'The folder stays on the review desk (as supplied)'},
  es: {pending: 'La carpeta sigue en la mesa de revisión (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {a: 'Hands of a clerk (fictional, generic)'},
  objectLabels: {filter: 'Filter doors: only those of the configured point stand open', calendar: 'Desk calendar (no date marked)'},
  annotations: [{target: 'doors', text: 'The open doors only show the supplied route'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos de un auxiliar (ficticias, genéricas)'},
  objectLabels: {filter: 'Puertas filtro: solo las del punto configurado están abiertas', calendar: 'Calendario de mesa (sin fechas marcadas)'},
  annotations: [{target: 'doors', text: 'Las puertas abiertas solo muestran la ruta aportada'}],
  stateCaption: '',
};
const EN = {...DN_EN, ...OWN_EN};
const ES = {...DN_ES, ...OWN_ES};

const sceneSchema = {
  ...dnFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the clerk\'s hands (generic)', 60)}, ['a']),
  objectLabels: obj('Captions of the desk objects in the legend', {
    filter: str('Caption for the filter doors at the tray mouths', 80),
    calendar: str('Caption for the desk calendar (a fixture only)', 70),
  }, ['filter', 'calendar']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): returned — the folder lies in the configured tray; pending — the folder stays on the review mat', ['returned', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: outcomes.returned, or the built-in pending caption)', 110),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'returned'};

function legendRows(ctx, P, R) {
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'lane', text: P.labels.route, name: 'lg-route'});
  if (showKey) rows.push({kind: 'item', icon: 'folder', text: P.decisions.title, name: 'lg-folder'});
  if (showKey) R.notes.forEach((t, i) => rows.push({kind: 'item', icon: 'note', index: i, text: t, name: `lg-note${i}`}));
  if (showKey) rows.push({kind: 'item', icon: 'pin', text: P.labels.point, name: 'lg-point'});
  if (showAll) rows.push({kind: 'item', icon: 'doors', text: P.objectLabels.filter, name: 'lg-doors'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
  if (showAll) rows.push({kind: 'item', icon: 'hand', text: P.actorLabels.a, name: 'lg-hand'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || (P.finalState === 'returned' ? P.outcomes.returned : ctx.t.pending), name: 'state-tag'});
  if (showKey) rows.push({kind: 'item', icon: 'blank', text: P.outcomes.renewed, name: 'lg-renewed'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Compose desk + board + legend for a font size F and an arrangement. */
function compose(ctx, P, R, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const rows = legendRows(ctx, P, R);
  const gap = F * 1.2;
  let desk, panel = null, PL = null;
  const problems = [];
  if (!rows.length) desk = {x: 0, y: 0, w: DW, h: DH};
  else if (v.panel === 'below') {
    if (v.cols === 2) {
      // two legend columns (the hold rows — notes, state, renewed, key — stay together in the second)
      const cut = Math.ceil(rows.length / 2);
      const cg = F * 1.4, cw = (DW - 8 - cg) / 2;
      const A = panelLayout(ctx, rows.slice(0, cut), {w: cw, F}), Bq = panelLayout(ctx, rows.slice(cut), {w: cw, F});
      PL = {rows: [...A.rows, ...Bq.rows.map(rw => ({...rw, dx: cw + cg}))], h: Math.max(A.h, Bq.h), w: cw, F, ok: A.ok && Bq.ok};
    } else PL = panelLayout(ctx, rows, {w: DW - 8, F});
    desk = {x: 0, y: 0, w: DW, h: DH - PL.h - gap - F * 0.3};
    panel = {x: 4, y: DH - PL.h - F * 0.3};
  } else {
    const PW = DW * v.pw;
    PL = panelLayout(ctx, rows, {w: PW, F});
    desk = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) problems.push('panel-tall');
  }
  if (PL && !PL.ok) problems.push('panel-text');
  const inset = Math.max(20, F * 1.0);
  const box = {x: desk.x + inset, y: desk.y + inset, w: desk.w - inset * 2, h: desk.h - inset * 2};
  const B = boardModel(ctx, {orient: v.orient, box, F, names: P.routes.stations, origin: P.routes.origin, showText: ctx.show('key'), target: R.target, slipN: R.notes.length, plateW: v.plateW ? box.w * (ctx.show('key') ? v.plateW : 0.2) : undefined, maxFw: v.orient === 'row' ? 300 : 340});
  problems.push(...B.problems);
  if (box.h < 200) problems.push('desk-small');
  const path = returnPath(B, R.target);
  const c = path.corners;
  const sH = (c[1] + c[2]) / 2;
  const slipOff = {x: B.fw * 0.3, y: -B.fh * 0.2};
  const row = B.orient === 'row';
  const gripOff = side => (row ? {x: (side === 'R' ? 1 : -1) * B.fw * 0.26, y: B.fh * 0.4} : {x: B.fw * 0.4, y: (side === 'R' ? 1 : -1) * B.fh * 0.22});
  const shoulderR = B.shoulder('R'), shoulderL = B.shoulder('L');
  const restR = B.handRest('R'), restL = B.handRest('L');
  const at = s => path.poly.at(s);
  const add = (p, q) => ({x: p.x + q.x, y: p.y + q.y});
  const tR = [B.slipRest, add(at(0), slipOff), add(at(0), gripOff('R')), add(at(sH), gripOff('R')), restR];
  const tL = [add(at(sH), gripOff('L')), add(at(1), gripOff('L')), add(at(0.85), gripOff('L')), restL];
  const far = (sh, ts) => Math.max(...ts.map(p => Math.hypot(p.x - sh.x, p.y - sh.y)));
  const lenR = far(shoulderR, tR) * 0.5 + 24, lenL = far(shoulderL, tL) * 0.5 + 24;
  const armW = Math.max(36, Math.min(52, F * 2.1));
  return {F, desk, box, panel, PL, B, path, sH, slipOff, gripOff, shoulderR, shoulderL, restR, restL, lenR, lenL, armW, orient: v.orient, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedDn(ctx, EN, ES);
    const R = resolveDn(P);
    const shape = ctx.view.shape;
    const variants = shape === 'landscape'
      ? [0.3, 0.33, 0.36, 0.4].map(pw => ({orient: 'row', panel: 'right', pw}))
      : shape === 'portrait'
        ? [{orient: 'column', panel: 'below', plateW: 0.34}, {orient: 'column', panel: 'below', plateW: 0.4}, {orient: 'column', panel: 'below', plateW: 0.34, cols: 2}, {orient: 'row', panel: 'below'}]
        : [{orient: 'row', panel: 'below', cols: 2}, {orient: 'row', panel: 'below'}, ...[0.4, 0.44].flatMap(pw => [0.38, 0.44].map(plateW => ({orient: 'column', panel: 'right', pw, plateW})))];
    const sizes = shape === 'portrait' || !ctx.show('key') ? [30, 28, 26, 24.5, ...SIZES] : SIZES;
    let C = null, best = null;
    outer: for (const F of sizes) for (const v of variants) {
      const c = compose(ctx, P, R, F, v);
      if (c.ok) { C = c; break outer; }
      if (!best || c.problems.length < best.problems.length) best = c;
    }
    C = C || best;
    const look = actorLook(ctx, {appearance: {}}, 0);
    const arm = (name, len) => topArm(ctx, {name, skin: look.skin, sleeve: look.outfit, handed: name.endsWith('L') ? 'left' : 'right', upper: len, lower: len, width: C.armW, handScale: 1.3});
    const armL = arm('armL', C.lenL), armR = arm('armR', C.lenR);
    const notes = noteColors(ctx.theme);
    const B = C.B;
    const end = C.path.poly.at(1);
    const tgt = name => {
      const pad = 10;
      if (name === 'folder') return {x: end.x - B.fw / 2 - pad, y: end.y - B.fh / 2 - pad * 2, w: B.fw + pad * 2, h: B.fh + pad * 3};
      if (name === 'notes') return {x: end.x + C.slipOff.x - B.slipS * 0.75 - pad, y: end.y + C.slipOff.y - B.slipS * 0.6 - pad, w: B.slipS * 1.5 + pad * 2, h: B.slipS * 1.2 + pad * 2};
      if (name === 'calendar') return {x: B.cal.x - pad, y: B.cal.y - pad * 1.6, w: B.cal.w + pad * 2, h: B.cal.h + pad * 2.6};
      const s = B.slots[R.target];
      return {x: s.tray.x - pad * 1.5, y: s.tray.y - pad, w: s.tray.w + pad * 3, h: s.tray.h + pad * 2.5};
    };
    const rings = ctx.show('all') ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return {P, R, C, armL, armR, rings};
  },
  build(ctx, L) {
    const {C, R, P} = L;
    const B = C.B;
    const showKey = ctx.show('key');
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const mouth = B.orient === 'row' ? 'bottom' : 'right';
    const slots = B.slots.map(s => g(null,
      g({transform: T(s.plate.x, s.plate.y)}, plateArt(ctx, {w: s.plate.w, h: s.plate.h, F: C.F, fit: s.fit || s.plate.fit, pin: s.station && s.i === R.target, name: `plate${s.i}`})),
      g({transform: T(s.tray.x, s.tray.y)}, s.station ? trayArt(ctx, {w: s.tray.w, h: s.tray.h, mouth}) : matArt(ctx, {w: s.tray.w, h: s.tray.h})),
    ));
    const doors = B.doors.map(d => d.halves.map((hv, k) => g({name: `door${d.i}${k}`, transform: doorT(hv, d.i === R.target ? 1 : 0)}, doorArt(ctx, {len: hv.len, t: B.doorT}))));
    const slip = slipArt(ctx, {n: R.notes.length, s: B.slipS});
    return g({name: 'scene'},
      desk.surface,
      g({'clip-path': desk.clip},
        laneArt(ctx, B, {branchArrow: R.target}),
        slots,
        g({transform: T(B.cal.x, B.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: B.cal.w, h: B.cal.h})),
        doors,
        g({name: 'folder'}, folderArt(ctx, {w: B.fw, h: B.fh})),
        g({name: 'slip'}, slip.node),
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm, L.armL.thumb, L.armR.thumb,
      ),
      desk.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null,
    );
    void showKey; void P;
  },
  frame(ctx, L, u) {
    const {P, C} = L;
    const B = C.B;
    const nodes = {};
    const returned = P.finalState === 'returned';
    const cap = lerp(W.reachPad[0], W.retractL[1], clamp(P.actionProgress));
    const done = P.actionProgress >= 1;
    const ua = done ? u : Math.min(u, cap);
    const on = w => (returned ? seg(ua, ...w) : 0);
    const E = ease.inOutCubic;
    const kPad = E(on(W.reachPad)), kCarry = E(on(W.carryNote)), kGrip = E(on(W.toGrip));
    const kSR = E(on(W.slideR)), kSL = E(on(W.slideL)), kReachL = E(on(W.reachL));
    const kBackR = E(on(W.retractR)), kBackL = E(on(W.retractL));
    const s = kSL > 0 ? lerp(C.sH, 1, kSL) : lerp(0, C.sH, kSR);
    const f = C.path.poly.at(s);
    const add = (p, q) => ({x: p.x + q.x, y: p.y + q.y});
    const mix = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
    nodes.folder = {transform: T(f.x, f.y)};
    // right hand: rest → slip → (slip carried) folder's clip spot → grip → slides → back
    const clipSpot = add(C.path.poly.at(0), C.slipOff);
    const gR = add(f, C.gripOff('R'));
    const gL = add(f, C.gripOff('L'));
    let hR;
    if (kBackR > 0) hR = mix(add(C.path.poly.at(C.sH), C.gripOff('R')), C.restR, kBackR);
    else if (kGrip > 0) hR = mix(clipSpot, gR, kGrip);
    else if (kCarry > 0) hR = mix(B.slipRest, clipSpot, kCarry);
    else hR = mix(C.restR, B.slipRest, kPad);
    // left hand: rest → the hand-over point → carries → back
    let hL;
    if (kBackL > 0) hL = mix(add(C.path.poly.at(1), C.gripOff('L')), C.restL, kBackL);
    else if (on(W.handoff) > 0) hL = gL;
    else hL = mix(C.restL, add(C.path.poly.at(C.sH), C.gripOff('L')), kReachL);
    const row = B.orient === 'row';
    const pr = L.armR.pose(C.shoulderR, hR, row ? -1 : 1);
    const pl = L.armL.pose(C.shoulderL, hL, row ? 1 : -1);
    Object.assign(nodes, pr.nodes, pl.nodes);
    // slip: on the mat → in the right hand → on the folder
    const carried = kPad >= 1 && ua < W.press[1];
    const attached = ua >= W.press[1] && returned;
    const slipP = attached ? add(f, C.slipOff) : carried ? hR : B.slipRest;
    nodes.slip = {transform: T(slipP.x, slipP.y)};
    const holder = !returned ? 'none' : ua < W.slideR[0] ? 'none' : ua < W.handoff[0] ? 'R' : ua < W.handoff[1] ? 'both' : ua < W.release[0] ? 'L' : 'none';
    const subK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    const renK = done ? seg(u, ...W.renewed) : 0;
    nodes.rings = {opacity: r(subK, 3)};
    if (C.PL) for (const rw of C.PL.rows) {
      if (rw.name.startsWith('note')) nodes[rw.name] = {opacity: r(subK, 3)};
      if (rw.name === 'state-tag') nodes[rw.name] = {opacity: r(stateK, 3)};
      if (rw.name === 'lg-renewed') nodes[rw.name] = {opacity: r(renK, 3)};
    }
    const phase = !returned || ua < W.reachPad[0] ? 'rest' : ua < W.press[1] ? 'notes' : ua < W.toGrip[1] ? 'grip' : ua < W.handoff[0] ? 'slide-right-hand' : ua < W.handoff[1] ? 'handoff' : ua < W.release[0] ? 'slide-left-hand' : ua < W.retractL[1] ? 'release' : 'placed';
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const tgtRest = B.slots[L.R.target].rest;
    return {
      nodes,
      semantic: {
        beat, phase, holder,
        folderC: R2(f), slipC: R2(slipP), handR: R2(pr.hand), handL: R2(pl.hand), gripR: R2(gR), gripL: R2(gL),
        slipCarried: carried, slipAttached: attached, pathS: r(s, 4),
        allReached: pr.reached && pl.reached,
        target: L.R.target, inTarget: Math.hypot(f.x - tgtRest.x, f.y - tgtRest.y) < 1,
        atReview: Math.hypot(f.x - B.slots[B.n].rest.x, f.y - B.slots[B.n].rest.y) < 1,
        openDoors: B.doors.filter(d => d.i === L.R.target).map(d => d.i),
        finalState: P.finalState, actionCapped: P.actionProgress < 1 && u > cap,
        states: r(stateK, 3), problems: C.problems, textPx: r(C.F, 1), orient: B.orient,
        board: {x: r(C.desk.x), y: r(C.desk.y), w: r(C.desk.w), h: r(C.desk.h)},
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
    slug: 'review-08-story',
    title: 'Return for a new examination — two hands clip review notes to a folder and carry it back along the supplied route into the configured tray',
    titleEs: 'Devolución para nuevo examen — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Devolución para nuevo examen',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down desk laid out as the supplied return route: one in-tray per supplied point under its name plate, the review desk mat and a lane with chevron arrows. Only the filter doors of the configured return point stand open. A clerk\'s right hand presses a slip of review notes onto the folder that holds the decision of the initial examination and slides it along the lane; at a shared point the left hand takes over and pushes it into the configured tray. The hold lists the notes as supplied and states that the renewed examination is not shown and has no outcome. Calendar is a fixture; jurisdiction unspecified.',
    tags: ['review', 'return for a new examination', 'remand as supplied', 'folder', 'review notes', 'route', 'filter doors', 'arrows', 'calendar', 'hands', 'hand-over'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/devolucion-nuevo-examen.js', 'src/animations/review/kits/limites-de-revision.js', 'src/primitives/desk.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
