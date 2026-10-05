/**
 * LAW-0357 — Cierre de itinerario · story
 *
 * Storyboard (a top-down desk; an open case file whose inner sheet prints a route map: the starting resolution, one
 * pale track per supplied route and an end card at the end of each track; a tray of filter clips and a desk calendar
 * (a fixture only) lie beside the starting resolution; a participant's right hand rests at the desk's lower edge holding
 * a tracing puck, the left hand rests at the other side):
 *  0.00–0.15  rest: everything still; every track is pale and every end card's badge neutral.
 *  0.15–0.42  the action starts: the right hand carries the puck to the port of the first route supplied as concluded
 *             and traces it — ink and direction chevrons appear behind the puck — up to its end card, whose badge then
 *             shows the supplied state (●). Further concluded routes are traced in turn.
 *  0.42–0.73  the right hand returns to rest; the left hand takes a filter clip from the tray by its tab and lays it
 *             across the track of each route supplied as pending a check; that card's badge shows ◆. The hands return.
 *  0.73–1.00  hold: traced routes and the filtered ways stay as marked, with notes, the supplied state and the key
 *             "as supplied · no conclusion drawn". Nothing says whether any route is closed or available.
 * @module animations/review/LAW-0357
 */
import {defineAnimation} from '../../core/define.js';
import {fitDesign} from '../../core/layout.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {topArm, deskWindow} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  ciiFields, CII_EN, CII_ES, localisedCi, fitG, originModel, originNode, endModel, endNode, mapPlan, shiftPlan, trackNode,
  inkNode, chevron, filterClip, clipGrip, puckNode, trayNode, calendarNode, folderNode, panelLayout, panelNode, ringRect,
  noteColors, inkColor, overlaps, R2,
} from './kits/cierre-de-itinerario.js';

const ID = 'LAW-0357';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const WR = [0.15, 0.47], WRback = [0.47, 0.54];
const WL = [0.44, 0.7], WLback = [0.7, 0.75];
const W = {notes: [0.76, 0.81], state: [0.77, 0.82]};
const TARGETS = ['origin', 'arrows', 'filter', 'calendar'];
const SIZES = [26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {marked: 'Each route shows the state it was supplied with; nothing else is concluded', unmarked: 'The routes are not marked yet (as supplied)'},
  es: {marked: 'Cada ruta muestra el estado con que se aportó; no se concluye nada más', unmarked: 'Las rutas aún no están marcadas (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {a: 'Hands of a participant (fictional, generic)'},
  objectLabels: {arrows: 'Ink and arrows: the route traced as travelled', filter: 'Filter clip: the way is pending a check', calendar: 'Desk calendar (no date marked)'},
  annotations: [{target: 'filter', text: 'A clip only marks a way as not yet checked'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos de una persona participante (ficticias, genéricas)'},
  objectLabels: {arrows: 'Tinta y flechas: la ruta trazada como recorrida', filter: 'Pinza filtro: la vía queda pendiente de comprobar', calendar: 'Calendario de mesa (sin fechas marcadas)'},
  annotations: [{target: 'filter', text: 'Una pinza solo marca una vía como aún no comprobada'}],
  stateCaption: '',
};
const EN = {...CII_EN, ...OWN_EN};
const ES = {...CII_ES, ...OWN_ES};

const sceneSchema = {
  ...ciiFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the participant\'s hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the desk objects in the legend', {
    arrows: str('Caption for the ink and direction arrows of a traced route', 80),
    filter: str('Caption for the filter clips (a way pending a check)', 80),
    calendar: str('Caption for the desk calendar (a fixture only)', 70),
  }, ['arrows', 'filter', 'calendar']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 100),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): marked — each route is marked with its supplied state; unmarked — nothing moves, the routes stay pale', ['marked', 'unmarked']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 110),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'marked'};

/** Compose desk + panel at text size F. */
function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const n = P.routes.length;
  const rows = [];
  if (showKey) rows.push({kind: 'item', icon: 'concluded', text: P.outcomes.concluded, name: 'lg-concluded'});
  if (showKey) rows.push({kind: 'item', icon: 'pending', text: P.outcomes.pending, name: 'lg-pending'});
  if (showAll) rows.push({kind: 'item', icon: 'trace', text: P.objectLabels.arrows, name: 'lg-arrows'});
  if (showAll) rows.push({kind: 'item', icon: 'clip', text: P.objectLabels.filter, name: 'lg-filter'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
  if (showAll) rows.push({kind: 'item', icon: 'hand', text: P.actorLabels.a, name: 'lg-hand'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});

  const gap = F * 1.4;
  let desk, panel = null, PL = null;
  if (!rows.length) desk = {x: 0, y: 0, w: DW, h: DH};
  else if (opts.band) {
    PL = panelLayout(rows, {w: DW - 8, F, cols: opts.cols || 1, tight: opts.tight});
    desk = {x: 0, y: 0, w: DW, h: DH - PL.h - gap - F * 0.4};
    panel = {x: 4, y: DH - PL.h - F * 0.4};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(rows, {w: PW, F});
    desk = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  if (desk.h < F * 10) return {F, ok: false, problems: ['desk-height']};
  const orient = opts.orient;
  // the folder: its tab label (supplied), its inner sheet holds the map
  const tabFit = showKey ? fitG(P.labels.file, {maxWidth: desk.w * 0.6, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  const tabH = tabFit ? tabFit.height + F * 0.7 : F * 1.5;
  const tabW = tabFit ? tabFit.width + F * 1.6 : F * 8;
  const mI = Math.max(12, F * 0.6);
  const restBand = Math.max(F * 1.8, 36);
  const pF = Math.max(10, F * 0.5) + F * 0.5;
  const folder = {x: desk.x + mI, y: desk.y + mI + tabH, w: desk.w - 2 * mI};
  const mapW = folder.w - 2 * pF;
  const mapHmax = desk.h - mI - tabH - 2 * pF - restBand;
  const np = P.routes.filter(rt => rt.state === 'pending').length;
  const slots = Math.max(1, np);
  let OM, EM, plan;
  if (orient === 'h') {
    const gapM = Math.max(F * 7, mapW * 0.16);
    const tot = Math.min(F * 34, mapW - gapM);
    if (tot < F * 16) return {F, ok: false, problems: ['map-width']};
    // the split between the starting resolution and the end cards: even first, then whichever side needs room
    for (const k of [0.5, 0.56, 0.44, 0.6]) {
      OM = originModel(P, {w: tot * k, F, showText: showKey});
      EM = endModel(P, {w: tot * (1 - k), F, showText: showKey});
      if (OM.ok && EM.ok) break;
    }
    plan = mapPlan(P, OM, EM, {F, orient, gap: Math.min(gapM * 1.25, mapW - tot), slots});
    // spare height spreads the end cards apart (a fuller sheet, never a blank band)
    const spare = mapHmax - plan.needH;
    if (spare > 1 && n > 1) plan = mapPlan(P, OM, EM, {F, orient, gap: Math.min(gapM * 1.25, mapW - tot), slots, gx: Math.max(F * 0.8, 14) + Math.min(F * 2.2, spare / (n - 1))});
  } else {
    const gx = Math.max(F * 0.8, 14);
    const ew = Math.min(F * 15, (mapW - (n - 1) * gx) / n);
    const ow = Math.min(F * 17, mapW - 2 * (F * 3.4 + F * 0.9));
    if (ew < F * 7.5 || ow < F * 8) return {F, ok: false, problems: ['map-width']};
    OM = originModel(P, {w: ow, F, showText: showKey});
    EM = endModel(P, {w: ew, F, showText: showKey});
    const gapM = clamp(mapHmax - Math.max(OM.h, F * 3.4 * 0.84) - EM.h, F * 6.5, F * 11);
    plan = mapPlan(P, OM, EM, {F, orient, gap: gapM, slots});
  }
  if (globalThis.__trace) globalThis.__trace.push({F: r(F,1), mapW: r(mapW), mapHmax: r(mapHmax), needW: r(plan.needW), needH: r(plan.needH), oh: r(OM.h), eh: r(EM.h), PL: PL && r(PL.h), DH});
  const fitsW = plan.needW <= mapW + 0.5;
  const fitsH = plan.needH <= mapHmax + 0.5;
  // the folder is as tall as its map needs; the desk keeps its rest band below it
  folder.h = plan.needH + 2 * pF;
  const ox = folder.x + pF + (mapW - plan.needW) / 2;
  const oy = folder.y + pF;
  const pl = shiftPlan(plan, ox, oy);
  const deskH = Math.min(desk.h, mI + tabH + folder.h + restBand);
  desk.h = deskH;
  if (panel && opts.band) panel.y = desk.y + desk.h + gap;
  const deskB = desk.y + desk.h, deskR = desk.x + desk.w;
  const D = plan.D;
  // hands: right from below the desk's right part (holds the puck), left from below-left ('h') or the left edge ('v')
  const sOff = Math.max(110, F * 5);
  const restR = {x: deskR - Math.max(F * 3.2, 60), y: deskB - restBand * 0.5};
  const shoulderR = {x: restR.x + F * 2.4, y: deskB + sOff};
  const restL = orient === 'h' ? {x: desk.x + Math.max(F * 3.2, 60), y: deskB - restBand * 0.45} : {x: desk.x + F * 1.2, y: (pl.tray ? pl.tray.y + pl.tray.h : deskB) + F * 2};
  const shoulderL = orient === 'h' ? {x: restL.x - F * 2.4, y: deskB + sOff} : {x: desk.x - sOff, y: restL.y + F * 1.2};
  const pend = [], conc = [];
  P.routes.forEach((rt, i) => (rt.state === 'pending' ? pend : conc).push(i));
  const targetsR = [restR, ...conc.flatMap(i => [pl.routes[i].pts[0], pl.routes[i].pts[pl.routes[i].pts.length - 1]]), ...conc.flatMap(i => pl.routes[i].pts)];
  const clipSize = orient === 'h' ? {w: D.along, h: D.across} : {w: D.across, h: D.along};
  const grip = clipGrip(clipSize);
  const targetsL = [restL, ...pl.slotsAt.map(p => ({x: p.x + grip.x, y: p.y + grip.y})), ...pend.map(i => ({x: pl.routes[i].clipC.x + grip.x, y: pl.routes[i].clipC.y + grip.y}))];
  const far = s => Math.max(...s.targets.map(p => Math.hypot(p.x - s.sh.x, p.y - s.sh.y)));
  const armLenR = far({targets: targetsR, sh: shoulderR}) * 0.5 + 26;
  const armLenL = far({targets: targetsL, sh: shoulderL}) * 0.5 + 26;
  const armW = clamp(F * 2.1, 38, 54);
  // the parked tray, the calendar and the cards must not touch
  const boxes = [pl.O, ...pl.E, pl.tray, pl.cal].filter(Boolean);
  let clear = true;
  for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) if (overlaps(boxes[a], boxes[b], 4)) clear = false;
  const inDesk = boxes.every(b => b.x >= desk.x && b.x + b.w <= deskR && b.y >= desk.y && b.y + b.h <= deskB);
  const usedH = PL ? Math.max(desk.y + desk.h, panel.y + PL.h) : desk.y + desk.h;
  const dy = Math.max(0, (DH - usedH) / 2);
  const problems = [!fitsW && 'map-width', !fitsH && 'map-height', !OM.ok && 'origin-text', !EM.ok && 'end-text', !plan.ok && plan.problems.join('+'),
    PL && !PL.ok && 'panel-text', !clear && 'objects-touch', !inDesk && 'outside-desk', usedH > DH + 0.5 && 'frame-height', tabFit && !tabFit.ok && 'tab-text'].filter(Boolean);
  return {F, desk, panel, PL, OM, EM, pl, D, folder, tabFit, tabH, tabW, pF, orient, restR, restL, shoulderR, shoulderL, armLenR, armLenL, armW, clipSize, grip, pend, conc, dy, ok: !problems.length, problems};
}

/** Right hand: rest → (hop to the port, trace the route) per concluded route → back to rest. */
function rightHand(C, u) {
  const nc = C.conc.length;
  const inks = {};
  for (const i of C.conc) inks[i] = 0;
  if (!nc || u <= WR[0]) return {p: C.restR, inks, phase: 'rest', route: null};
  const span = (WR[1] - WR[0]) / nc;
  let prev = C.restR;
  for (let j = 0; j < nc; j++) {
    const i = C.conc[j];
    const rt = C.pl.routes[i];
    const a = WR[0] + j * span, b = a + span;
    const hopEnd = a + span * 0.3;
    if (u < hopEnd) {
      const k = ease.inOutCubic(seg(u, a, hopEnd));
      const lift = Math.sin(Math.PI * k);
      return {p: {x: lerp(prev.x, rt.pts[0].x, k), y: lerp(prev.y, rt.pts[0].y, k)}, inks, phase: 'hop', route: i, lift};
    }
    if (u < b) {
      const k = ease.inOutSine(seg(u, hopEnd, b));
      inks[i] = k;
      const q = rt.poly.at(k);
      return {p: {x: q.x, y: q.y}, inks, phase: 'trace', route: i};
    }
    inks[i] = 1;
    prev = rt.pts[rt.pts.length - 1];
  }
  const k = ease.inOutCubic(seg(u, ...WRback));
  return {p: {x: lerp(prev.x, C.restR.x, k), y: lerp(prev.y, C.restR.y, k)}, inks, phase: k >= 1 ? 'rest' : 'back', route: null, lift: Math.sin(Math.PI * k)};
}

/** Left hand + clips: rest → (reach the slot, carry the clip to its track, let go) per pending route → back to rest. */
function leftHand(C, u) {
  const np = C.pend.length;
  const clips = C.pend.map((i, k) => ({...C.pl.slotsAt[k]}));
  const laid = C.pend.map(() => 0);
  const gripOf = c => ({x: c.x + C.grip.x, y: c.y + C.grip.y});
  if (!np || u <= WL[0]) return {p: C.restL, clips, laid, held: -1, phase: 'rest'};
  const span = (WL[1] - WL[0]) / np;
  let prev = C.restL;
  for (let k = 0; k < np; k++) {
    const i = C.pend[k];
    const a = WL[0] + k * span, b = a + span;
    const t1 = a + span * 0.3, t2 = a + span * 0.85;
    const slot = C.pl.slotsAt[k], tgt = C.pl.routes[i].clipC;
    if (u < t1) {
      const e = ease.inOutCubic(seg(u, a, t1));
      const g0 = gripOf(slot);
      return {p: {x: lerp(prev.x, g0.x, e), y: lerp(prev.y, g0.y, e)}, clips, laid, held: -1, phase: 'reach', k};
    }
    if (u < t2) {
      const e = ease.inOutCubic(seg(u, t1, t2));
      clips[k] = {x: lerp(slot.x, tgt.x, e), y: lerp(slot.y, tgt.y, e), s: 1 + 0.06 * Math.sin(Math.PI * e)};
      const c = clips[k];
      return {p: {x: c.x + C.grip.x * c.s, y: c.y + C.grip.y * c.s}, clips, laid, held: k, phase: 'carry', k};
    }
    clips[k] = {...tgt};
    laid[k] = 1;
    if (u < b) return {p: gripOf(tgt), clips, laid, held: -1, phase: 'let-go', k};
    prev = gripOf(tgt);
  }
  const e = ease.inOutCubic(seg(u, ...WLback));
  return {p: {x: lerp(prev.x, C.restL.x, e), y: lerp(prev.y, C.restL.y, e)}, clips, laid, held: -1, phase: e >= 1 ? 'rest' : 'back'};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const arrangements = shape === 'portrait' ? [{band: true, orient: 'v'}, {band: true, cols: 2, orient: 'v'}, {band: true, cols: 2, orient: 'h'}]
      : shape === 'square' ? [{pw: 0.3, orient: 'h'}, {pw: 0.34, orient: 'h'}, {band: true, cols: 2, orient: 'h'}, {band: true, cols: 2, orient: 'v'}, {band: true, cols: 2, orient: 'h', tight: true}, {band: true, cols: 3, orient: 'h', tight: true}, {pw: 0.36, orient: 'v'}]
        : [{pw: 0.27, orient: 'h'}, {pw: 0.31, orient: 'h'}, {pw: 0.35, orient: 'h'}, {pw: 0.39, orient: 'h'}];
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const sizes = (!showKey ? [48, 44, 40, 36, 32, 29, ...SIZES] : [32, 30, 28, 27, ...SIZES]).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements) {
        const c = compose(ctx, P, F, a);
        if (globalThis.__trace) globalThis.__trace.push([r(F * pxu, 1), JSON.stringify(a), c.problems]);
        if (c.ok) { C = c; break outer; }
        if (c.pl && (!C || c.problems.length < C.problems.length)) C = c;
      }
    }
    if (!C) {
      for (const a of arrangements) { const c = compose(ctx, P, sizes[sizes.length - 1], a); if (c.pl) { C = c; break; } }
    }
    const look = actorLook(ctx, {appearance: {}}, 0);
    const arm = (name, len) => topArm(ctx, {name, skin: look.skin, sleeve: look.outfit, handed: name.endsWith('L') ? 'left' : 'right', upper: len, lower: len, width: C.armW, handScale: 1.3});
    const armL = arm('armL', C.armLenL), armR = arm('armR', C.armLenR);
    const notes = noteColors(ctx.theme);
    const showAll = ctx.show('all');
    const pad = 12;
    const tgt = name => {
      const pl = C.pl;
      if (name === 'calendar' && pl.cal) return {x: pl.cal.x - pad, y: pl.cal.y - pad * 1.6, w: pl.cal.w + pad * 2, h: pl.cal.h + pad * 2.6};
      if (name === 'filter' && C.pend.length) { const b = pl.routes[C.pend[0]].clip; return {x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2}; }
      if (name === 'arrows' && C.conc.length) {
        const rt = pl.routes[C.conc[0]];
        const xs = rt.pts.map(p => p.x), ys = rt.pts.map(p => p.y);
        const half = C.D.tw / 2 + pad;
        return {x: Math.min(...xs) - half * 0.4, y: Math.min(...ys) - half, w: Math.max(...xs) - Math.min(...xs) + half * 0.8, h: Math.max(...ys) - Math.min(...ys) + half * 2};
      }
      return {x: pl.O.x - pad, y: pl.O.y - pad, w: pl.O.w + pad * 2, h: pl.O.h + pad * 2};
    };
    const rings = showAll ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return {P, C, armL, armR, rings, look, pxu};
  },
  build(ctx, L) {
    const {C, P} = L;
    const {pl, D} = C;
    const th = ctx.theme;
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const tracks = pl.routes.map((rt, i) => trackNode(ctx, rt, D, {prefix: `track${i}`}));
    const inks = C.conc.map(i => inkNode(ctx, pl.routes[i], D, {prefix: `ink${i}`, color: inkColor(th)}));
    const chevs = C.conc.map(i => g(null, pl.routes[i].chev.map((c, j) => chevron(D, {name: `chev${i}-${j}`, transform: T(c.x, c.y, c.a), opacity: 0}))));
    const ends = pl.E.map((b, i) => g({transform: T(b.x, b.y)}, endNode(ctx, C.EM, i, P.routes[i], {prefix: `end${i}`})));
    const clips = C.pend.map((i, k) => g({name: `clip${k}`, transform: T(pl.slotsAt[k].x, pl.slotsAt[k].y)}, filterClip(ctx, {prefix: `clip${k}-art`, w: C.clipSize.w, h: C.clipSize.h})));
    return g({name: 'scene', transform: C.dy ? T(0, C.dy) : undefined},
      desk.surface,
      g({'clip-path': desk.clip},
        g({transform: T(C.folder.x, C.folder.y)}, folderNode(ctx, {prefix: 'folder', w: C.folder.w, h: C.folder.h, tabW: C.tabW, tabH: C.tabH, labelFit: C.tabFit, F: C.F})),
        pl.cal ? g({transform: T(pl.cal.x, pl.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: pl.cal.w, h: pl.cal.h})) : null,
        pl.tray ? g({transform: T(pl.tray.x, pl.tray.y)}, trayNode(ctx, pl.tray, {name: 'tray'})) : null,
        g({name: 'tracks'}, tracks), g({name: 'inks'}, inks), g({name: 'chevs'}, chevs),
        g({transform: T(pl.O.x, pl.O.y)}, originNode(ctx, C.OM, {prefix: 'origin'})),
        ends,
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm,
        clips,
        g({name: 'puck', transform: T(C.restR.x, C.restR.y)}, puckNode(ctx, D.puck)),
        L.armL.thumb, L.armR.thumb,
      ),
      desk.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL, {skin: L.look.skin})) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, C} = L;
    const {pl} = C;
    const nodes = {};
    const marked = P.finalState === 'marked';
    const cap = lerp(WR[0], WLback[1], clamp(P.actionProgress));
    const done = P.actionProgress >= 1;
    const ua = !marked ? 0 : done ? u : Math.min(u, cap);
    const RH = rightHand(C, ua);
    const LH = leftHand(C, ua);
    const lift = RH.lift || 0;
    nodes.puck = {transform: T(RH.p.x, RH.p.y, 0, 1 + 0.08 * lift)};
    const states = P.routes.map(() => 0);
    for (const i of C.conc) {
      const rt = pl.routes[i];
      const k = RH.inks[i];
      nodes[`ink${i}`] = {'stroke-dashoffset': r(rt.len * (1 - k), 1)};
      rt.chev.forEach((c, j) => { nodes[`chev${i}-${j}`] = {opacity: k * rt.len >= c.s + C.D.puck ? 1 : 0}; });
      states[i] = k >= 1 ? 1 : 0;
    }
    C.pend.forEach((i, k) => {
      const c = LH.clips[k];
      nodes[`clip${k}`] = {transform: T(c.x, c.y, 0, c.s || 1)};
      states[i] = LH.laid[k];
    });
    // the state badge of an end card appears once its route is marked (ink at the card / clip laid)
    const stK = P.routes.map((rt, i) => states[i]);
    P.routes.forEach((rt, i) => { nodes[`end${i}-st`] = {opacity: stK[i]}; });
    const pr = L.armR.pose(C.shoulderR, RH.p, -1);
    const plh = L.armL.pose(C.shoulderL, LH.p, 1);
    Object.assign(nodes, pr.nodes, plh.nodes);
    const noteK = done && marked ? seg(u, ...W.notes) : 0;
    const stateK = done || !marked ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const row of C.PL.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const held = LH.held;
    const gripS = held >= 0 ? {x: LH.clips[held].x + C.grip.x * (LH.clips[held].s || 1), y: LH.clips[held].y + C.grip.y * (LH.clips[held].s || 1)} : null;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const clipOnTrack = C.pend.map((i, k) => r(Math.hypot(LH.clips[k].x - pl.routes[i].clipC.x, LH.clips[k].y - pl.routes[i].clipC.y), 2));
    return {
      nodes,
      semantic: {
        beat, phaseR: RH.phase, phaseL: LH.phase,
        handR: R2(pr.hand), handL: R2(plh.hand), puck: R2(RH.p), gripS: R2(gripS), heldS: held >= 0,
        clip0: C.pend.length > 0 ? R2(LH.clips[0]) : null, clip1: C.pend.length > 1 ? R2(LH.clips[1]) : null, clip2: C.pend.length > 2 ? R2(LH.clips[2]) : null,
        inks: P.routes.map((rt, i) => (rt.state === 'concluded' ? r(RH.inks[i], 3) : null)),
        laid: P.routes.map((rt, i) => (rt.state === 'pending' ? LH.laid[C.pend.indexOf(i)] : null)),
        badges: stK, clipOnTrack, states: P.routes.map(rt => rt.state), ends: P.routes.map(rt => rt.end),
        tracing: RH.phase === 'trace' ? RH.route : null,
        allReached: pr.reached && plh.reached,
        finalState: P.finalState, actionCapped: P.actionProgress < 1 && u > cap,
        problems: C.problems, textPx: r(C.F * L.pxu, 1), orient: C.orient,
        desk: {x: r(C.desk.x), y: r(C.desk.y), w: r(C.desk.w), h: r(C.desk.h)},
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
    slug: 'review-10-story',
    title: 'Route closure — on an open case file a hand traces the route supplied as concluded and the other hand lays filter clips on the ways supplied as pending a check',
    titleEs: 'Cierre de itinerario — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Cierre de itinerario',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down desk with an open case file whose inner sheet prints a route map: the starting resolution, one track per supplied route and an end card for each. A participant\'s right hand carries a tracing puck along each route supplied as concluded — ink and direction arrows appear behind it and the end card\'s badge shows the supplied state — and the left hand takes filter clips from a tray and lays them across the routes supplied as pending a check. A desk calendar is a fixture only. The states are supplied; no finality doctrine; nothing says whether any route is closed or available. Illustrative; jurisdiction unspecified.',
    tags: ['review', 'route closure', 'case file', 'routes as supplied', 'route concluded', 'pending a check', 'resolutions', 'arrows', 'filter clips', 'calendar', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/cierre-de-itinerario.js', 'src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/desk.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
