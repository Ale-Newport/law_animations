/**
 * LAW-0333 — Límites de revisión · story
 *
 * Storyboard (a top-down desk; a placeholder decision sheet with its numbered sections as supplied; two arrow tags
 * — ● question A / ◆ question B, equal weight — lie at its left margin, each pointing at the section it refers to (as
 * supplied); a closed, expandable review frame lies below the sheet; a desk calendar beside the title is a fixture
 * only; the reviewer's two hands rest at the desk's lower edge):
 *  0.00–0.15  rest: everything still; the frame lies closed below the sheet, nothing is enclosed yet.
 *  0.15–0.42  the action starts: both hands go to the frame's grip knobs (the cause) and lift it; carrying it closed,
 *             they bring its lower rail up to the last supplied section; then the right hand pushes the upper rail up
 *             to the first supplied section — the frame opens over exactly the supplied range.
 *  0.42–0.73  the frame is laid flat on the sheet (shadow closes in), its neutral filter glass settles over the
 *             enclosed sections, the hands let go and return to the desk's edge.
 *  0.73–1.00  hold: under each question, where its arrow's section lies — inside / outside the frame — as plain
 *             description of the supplied data (equal-weight icons), notes, the supplied state and the key "as
 *             supplied · no conclusion drawn". No rule about what a review may cover, no admission, no outcome.
 * @module animations/review/LAW-0333
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {topArm} from '../../primitives/desk.js';
import {deskWindow} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  lrFields, LR_EN, LR_ES, localisedLr, resolveLr, sheetModel, sheetNode, frameExtent, frameNode, frameProps,
  arrowNode, calendarNode, panelLayout, panelNode, ringRect, noteColors, R2,
} from './kits/limites-de-revision.js';

const ID = 'LAW-0333';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  reach: [0.15, 0.2], lift: [0.2, 0.23], carry: [0.23, 0.36], stretch: [0.36, 0.5], lay: [0.5, 0.54],
  glass: [0.54, 0.62], retract: [0.62, 0.73], subs: [0.74, 0.79], notes: [0.75, 0.8], state: [0.76, 0.81],
};
const TARGETS = ['frame', 'questionA', 'questionB', 'calendar'];
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {delimited: 'The frame lies over the supplied sections (as supplied)', pending: 'The frame is not laid yet (as supplied)'},
  es: {delimited: 'El marco abarca los apartados aportados (según lo aportado)', pending: 'El marco aún no se ha colocado (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {a: 'Reviewer\'s hands (fictional, generic)'},
  objectLabels: {filter: 'Filter glass inside the frame (neutral tint)', calendar: 'Desk calendar (no date marked)'},
  annotations: [{target: 'frame', text: 'The frame encloses only the sections supplied'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos de quien revisa (ficticias, genéricas)'},
  objectLabels: {filter: 'Cristal filtro dentro del marco (tono neutro)', calendar: 'Calendario de mesa (sin fechas marcadas)'},
  annotations: [{target: 'frame', text: 'El marco abarca solo los apartados aportados'}],
  stateCaption: '',
};
const EN = {...LR_EN, ...OWN_EN};
const ES = {...LR_ES, ...OWN_ES};

const sceneSchema = {
  ...lrFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the reviewer\'s hands (generic)', 60)}, ['a']),
  objectLabels: obj('Captions of the desk objects in the legend', {
    filter: str('Caption for the filter glass held by the frame (neutral tint)', 70),
    calendar: str('Caption for the desk calendar (a fixture only)', 70),
  }, ['filter', 'calendar']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): delimited — the frame is laid over the supplied sections; pending — the frame stays closed at rest', ['delimited', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 110),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'delimited'};

/** Compose the desk for a font size F; returns null-free geometry with `ok`. */
function compose(ctx, P, R, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'frame', text: P.labels.frame, name: 'lg-frame'});
  if (showKey) R.qs.forEach(q => rows.push({kind: 'item', icon: q.side, text: q.text, sub: P.finalState === 'delimited' ? (q.inside ? P.outcomes.inside : P.outcomes.outside) : null, subIcon: q.inside ? 'inside' : 'outside', name: `lg-q${q.side}`}));
  if (showAll) rows.push({kind: 'item', icon: 'filter', text: P.objectLabels.filter, name: 'lg-filter'});
  if (showAll) rows.push({kind: 'item', icon: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
  if (showAll) rows.push({kind: 'item', icon: 'hand', text: P.actorLabels.a, name: 'lg-hand'});
  if (showAll) P.annotations.forEach((a, i) => rows.push({kind: 'item', icon: 'ring', color: notes[i % 2], text: a.text, name: `note${i}`}));
  if (showKey) rows.push({kind: 'state', text: P.stateCaption || ctx.t[P.finalState], name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});

  const gap = F * 1.4;
  let desk, panel = null, PL = null;
  if (!rows.length) desk = {x: 0, y: 0, w: DW, h: DH};
  else if (shape === 'portrait') {
    PL = panelLayout(ctx, rows, {w: DW - 8, F});
    desk = {x: 0, y: 0, w: DW, h: DH - PL.h - gap};
    panel = {x: 4, y: DH - PL.h};
  } else {
    const PW = DW * opts.pw;
    PL = panelLayout(ctx, rows, {w: PW, F});
    desk = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
    if (PL.h > DH) PL.ok = false;
  }
  const inset = Math.max(22, F * 1.1);
  const inner = {x: desk.x + inset, y: desk.y + inset, w: desk.w - inset * 2, h: desk.h - inset * 2};
  const AW = clamp(F * 6.4, 112, 170);
  const gapA = F * 0.4;
  const t = Math.max(12, F * 0.62);
  const m = Math.max(16, F * 0.9);
  const kn = t * 1.5;
  const rightRoom = m + kn + 6;
  const maxSW = shape === 'landscape' ? 700 : shape === 'square' ? 560 : 660;
  const SW = Math.min(maxSW, inner.w - AW - gapA - rightRoom);
  let M = null;
  for (const bars of [2, 1, 0]) {
    M = sheetModel(ctx, {w: SW, F, title: P.decisions.title, sections: P.decisions.sections, showText: showKey, bars});
    const need = M.h + F * 0.9 + 2 * t + 10;
    if (need <= inner.h) break;
  }
  const restGap = F * 0.9;
  const blockH = M.h + restGap + 2 * t;
  const fits = blockH <= inner.h + 0.5 && SW >= 260;
  const blockW = AW + gapA + SW + rightRoom;
  const sx = inner.x + (inner.w - blockW) / 2 + AW + gapA;
  const sy = inner.y + Math.max(0, (inner.h - blockH) / 2);
  const E = frameExtent(M, R.from, R.to, {t, margin: m});
  const yR = M.h + restGap; // rest: closed frame, top rail top (sheet-local)
  // arrows: tips on the sheet's left margin, at their section rows (two on one row share it)
  const aH = Math.min(M.rowH * 0.62, F * 2.2);
  const arrows = R.qs.map((q, i) => {
    const row = M.rows[q.section];
    const same = R.qs[0].section === R.qs[1].section;
    const dy = same ? (i === 0 ? -1 : 1) * Math.min(M.rowH * 0.24, aH * 0.55) : 0;
    return {side: q.side, tip: {x: sx + F * 0.62, y: sy + row.cy + dy}, len: AW + F * 0.62 - 4, hgt: same ? aH * 0.82 : aH};
  });
  const cal = {w: Math.min(AW - 14, F * 4.6), h: Math.min(AW - 14, F * 4.6) * 0.82};
  cal.x = sx - gapA - AW + (AW - cal.w) / 2 - 4;
  cal.y = sy + Math.max(4, (M.head - cal.h) / 2);
  // the calendar must not touch an arrow
  const calClear = arrows.every(a => a.tip.y - a.hgt / 2 > cal.y + cal.h + 6);
  // arms: shoulders below the desk's lower edge
  const fx = sx + E.x;
  const deskB = desk.y + desk.h;
  const sOff = Math.max(120, desk.h * 0.16);
  const shoulderL = {x: fx + E.w * 0.08, y: deskB + sOff};
  const shoulderR = {x: fx + E.w * 0.92, y: deskB + sOff};
  const gripL = yb => ({x: fx - kn / 2 + 2, y: sy + yb + t / 2});
  const gripR = yt => ({x: fx + E.w + kn / 2 - 2, y: sy + yt + t / 2});
  const restL = {x: shoulderL.x + F * 1.2, y: deskB - F * 0.5};
  const restR = {x: shoulderR.x - F * 1.2, y: deskB - F * 0.5};
  const far = Math.max(
    Math.hypot(gripR(E.yTop).x - shoulderR.x, gripR(E.yTop).y - shoulderR.y),
    Math.hypot(gripL(E.yBot).x - shoulderL.x, gripL(E.yBot).y - shoulderL.y),
    Math.hypot(gripR(E.yBot - t).x - shoulderR.x, gripR(E.yBot - t).y - shoulderR.y),
  );
  const armLen = far * 0.5 + 24;
  const armW = clamp(F * 2.1, 38, 52);
  const ok = fits && M.ok && (!PL || PL.ok) && calClear;
  return {F, desk, inner, panel, PL, M, sx, sy, E, t, m, kn, yR, arrows, cal, shoulderL, shoulderR, gripL, gripR, restL, restR, armLen, armW, ok, problems: [!fits && 'sheet-does-not-fit', M && !M.ok && 'sheet-text', PL && !PL.ok && 'panel-text', !calClear && 'calendar-arrow'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedLr(ctx, EN, ES);
    const R = resolveLr(P);
    const shape = ctx.view.shape;
    const pws = shape === 'square' ? [0.38, 0.42, 0.46] : [0.3, 0.34, 0.38];
    let C = null;
    outer: for (const F of SIZES) {
      for (const pw of shape === 'portrait' ? [1] : pws) {
        const c = compose(ctx, P, R, F, {pw});
        if (c.ok) { C = c; break outer; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
    }
    const look = actorLook(ctx, {appearance: {}}, 0);
    const arm = name => topArm(ctx, {name, skin: look.skin, sleeve: look.outfit, handed: name.endsWith('L') ? 'left' : 'right', upper: C.armLen, lower: C.armLen, width: C.armW, handScale: 1.3});
    const armL = arm('armL'), armR = arm('armR');
    const notes = noteColors(ctx.theme);
    const showAll = ctx.show('all');
    const tgt = name => {
      const pad = 10;
      if (name === 'frame') return {x: C.sx + C.E.x - C.kn - pad, y: C.sy + C.E.yTop - pad, w: C.E.w + C.kn * 2 + pad * 2, h: C.E.yBot + C.t - C.E.yTop + pad * 2};
      if (name === 'calendar') return {x: C.cal.x - pad, y: C.cal.y - pad * 1.6, w: C.cal.w + pad * 2, h: C.cal.h + pad * 2.6};
      const a = C.arrows[name === 'questionA' ? 0 : 1];
      return {x: a.tip.x - a.len - pad, y: a.tip.y - a.hgt / 2 - pad, w: a.len + pad * 2, h: a.hgt + pad * 2};
    };
    const rings = showAll ? P.annotations.map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return {P, R, C, armL, armR, rings};
  },
  build(ctx, L) {
    const {C, R, P} = L;
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const sheet = sheetNode(ctx, C.M, {prefix: 'sheet', showText: ctx.show('key')});
    const frame = frameNode(ctx, {prefix: 'frame', w: C.E.w, t: C.t, knob: C.kn, yTop: C.yR, yBot: C.yR + C.t});
    return g({name: 'scene'},
      desk.surface,
      g({'clip-path': desk.clip},
        g({transform: T(C.cal.x, C.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: C.cal.w, h: C.cal.h})),
        g({transform: T(C.sx, C.sy)}, sheet),
        C.arrows.map((a, i) => g({transform: T(a.tip.x, a.tip.y)}, arrowNode(ctx, {prefix: `arrow${R.qs[i].side}`, side: a.side, len: a.len, hgt: a.hgt}))),
        frame,
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm, L.armL.thumb, L.armR.thumb,
      ),
      desk.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL)) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, R, C} = L;
    const nodes = {};
    const delimited = P.finalState === 'delimited';
    const cap = lerp(W.reach[0], W.retract[1], clamp(P.actionProgress));
    const done = P.actionProgress >= 1;
    const ua = done ? u : Math.min(u, cap);
    const on = w => (delimited ? seg(ua, ...w) : 0);
    const kReach = ease.inOutCubic(on(W.reach));
    const kLift = ease.inOutCubic(on(W.lift));
    const kCarry = ease.inOutCubic(on(W.carry));
    const kStretch = ease.inOutCubic(on(W.stretch));
    const kLay = ease.inOutCubic(on(W.lay));
    const kGlass = on(W.glass);
    const kBack = ease.inOutCubic(on(W.retract));
    const {E, t} = C;
    // rails (sheet-local y): closed at rest → bottom rail carried to the last section → top rail pushed to the first
    const yBotRest = C.yR + t;
    const yBot = lerp(yBotRest, E.yBot, kCarry);
    const yTopClosed = yBot - t;
    const yTop = lerp(yTopClosed, E.yTop, kStretch);
    const lift = kLift * (1 - kLay);
    const fs = {x: C.sx + E.x, y: C.sy, yTop, yBot, t, w: E.w, glass: kGlass, lift};
    Object.assign(nodes, frameProps('frame', fs));
    // grips follow the frame's lift transform
    const sc = 1 + lift * 0.035;
    const cx = E.w / 2, cy = (yTop + yBot + t) / 2;
    const xf = p => ({x: fs.x + cx + (p.x - fs.x - cx) * sc, y: fs.y + cy + (p.y - fs.y - cy) * sc});
    const gL = xf(C.gripL(yBot));
    const gR = xf(C.gripR(yTop));
    const held = kReach >= 1 && kBack <= 0;
    const mixP = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
    let hL, hR;
    if (kBack > 0) { hL = mixP(gL, C.restL, kBack); hR = mixP(gR, C.restR, kBack); }
    else { hL = mixP(C.restL, gL, kReach); hR = mixP(C.restR, gR, kReach); }
    const pl = L.armL.pose(C.shoulderL, hL, 1);
    const pr = L.armR.pose(C.shoulderR, hR, -1);
    Object.assign(nodes, pl.nodes, pr.nodes);
    const subK = done && delimited ? seg(u, ...W.subs) : 0;
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const row of C.PL.rows) {
      if (row.sub) nodes[`${row.name}-sub`] = {opacity: r(subK, 3)};
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const phase = !delimited || ua < W.reach[0] ? 'rest' : ua < W.reach[1] ? 'reach' : ua < W.carry[1] ? 'carry' : ua < W.stretch[1] ? 'stretch' : ua < W.lay[1] ? 'lay' : ua < W.retract[0] ? 'laid-held' : ua < W.retract[1] ? 'retract' : 'laid';
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const enclosed = R.qs.map(q => {
      const row = C.M.rows[q.section];
      return row.y >= yTop + t - 1 && row.y + row.h <= yBot + 1;
    });
    return {
      nodes,
      semantic: {
        beat, phase,
        handL: R2(pl.hand), handR: R2(pr.hand), gripL: R2(gL), gripR: R2(gR),
        frameC: R2({x: fs.x + cx, y: fs.y + cy}),
        frameTop: r(C.sy + yTop), frameBot: r(C.sy + yBot + t),
        held, reach: r(kReach, 3), lift: r(lift, 3), glass: r(kGlass, 3), back: r(kBack, 3),
        allReached: pl.reached && pr.reached,
        from: R.from, to: R.to, sections: R.qs.map(q => q.section), inside: R.qs.map(q => q.inside), enclosed,
        subs: r(subK, 3), finalState: P.finalState, actionCapped: P.actionProgress < 1 && u > cap,
        problems: C.problems, textPx: r(C.F, 1),
        sheet: {x: r(C.sx), y: r(C.sy), w: r(C.M.w), h: r(C.M.h)},
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
    slug: 'review-04-story',
    title: 'Review limits — two hands carry an expandable frame onto a placeholder decision and open it over exactly the supplied sections',
    titleEs: 'Límites de revisión — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Límites de revisión',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down desk. A placeholder decision sheet shows its numbered sections (supplied tags); two equal arrow tags (● question A, ◆ question B) point at the sections they refer to (as supplied); a desk calendar is a fixture only. The reviewer\'s hands take a closed, expandable review frame, carry its lower rail up to the last supplied section and push its upper rail up to the first, then lay it flat: its neutral filter glass settles over exactly the supplied range and the hands return. The hold describes where each arrow\'s section lies — inside or outside the frame — as supplied. No rule about what a review may cover, no admission and no outcome are drawn; jurisdiction unspecified.',
    tags: ['review', 'review limits', 'scope as supplied', 'frame', 'filter', 'decision sections', 'arrows', 'calendar', 'desk', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/limites-de-revision.js', 'src/primitives/desk.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
