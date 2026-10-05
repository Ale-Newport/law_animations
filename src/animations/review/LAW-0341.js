/**
 * LAW-0341 — Confirmación ilustrativa · story
 *
 * Storyboard (a top-down desk; two decision cards of the same size — A, the original decision, lying in place; B, the
 * confirmatory decision as supplied, lying loose beside it, offset and turned; each card prints its supplied role,
 * title, reference, reasons line and result; an arrow mark on each card's facing edge sits on the configured row;
 * a neutral filter strip is parked above the cards; a desk calendar is a fixture only; a participant's two hands rest
 * at the desk's edges):
 *  0.00–0.15  rest: everything still; B is not aligned (its arrow mark misses A's).
 *  0.15–0.42  the action starts: the right hand reaches B's lower corner (the cause), lifts it slightly and slides and
 *             turns it towards its place beside A.
 *  0.42–0.73  B is set down square beside A — the two arrow marks meet tip to tip on one line; the right hand lets go;
 *             the left hand takes the filter strip by its tab and lays it across the aligned rows of both cards; the
 *             hands return to the desk's edges. The printed results never change: only the cards move.
 *  0.73–1.00  hold: the two cards aligned under the strip, notes, the supplied state and the key "as supplied · no
 *             conclusion drawn". No doctrine on what a confirmation means; no result is compared or judged.
 * @module animations/review/LAW-0341
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
  ciFields, CI_EN, CI_ES, localisedCi, cardModel, cardNode, arrowMark, filterStrip, calendarNode, panelLayout, panelNode,
  ringRect, noteColors, planDesk, arrowTip, cardPoint, cardTransform, cardBounds, overlaps, R2,
} from './kits/confirmacion-ilustrativa.js';

const ID = 'LAW-0341';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  reach: [0.15, 0.21], lift: [0.21, 0.24], slide: [0.21, 0.43], down: [0.41, 0.45], release: [0.46, 0.56],
  reachL: [0.45, 0.51], strip: [0.51, 0.63], lay: [0.63, 0.66], backL: [0.66, 0.73], notes: [0.75, 0.8], state: [0.76, 0.81],
};
const TARGETS = ['cards', 'arrows', 'filter', 'calendar'];
const SIZES = [26, 25, 24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const STRINGS = {
  en: {aligned: 'The two cards lie aligned; both printed results are unchanged (as supplied)', pending: 'The supplied card is not aligned yet (as supplied)'},
  es: {aligned: 'Las dos tarjetas quedan alineadas; los resultados impresos no cambian (según lo aportado)', pending: 'La tarjeta suministrada aún no está alineada (según lo aportado)'},
};

const OWN_EN = {
  actorLabels: {a: 'Hands of a participant (fictional, generic)'},
  objectLabels: {arrows: 'Arrow marks on the facing edges (alignment only)', result: 'Result field of each card: as supplied, never changed', calendar: 'Desk calendar (no date marked)'},
  annotations: [{target: 'arrows', text: 'The arrow marks meet: the cards are aligned, nothing on them changes'}],
  stateCaption: '',
};
const OWN_ES = {
  actorLabels: {a: 'Manos de una persona participante (ficticias, genéricas)'},
  objectLabels: {arrows: 'Marcas de flecha en los bordes enfrentados (solo alineación)', result: 'Campo de resultado de cada tarjeta: según lo aportado, nunca cambia', calendar: 'Calendario de mesa (sin fechas marcadas)'},
  annotations: [{target: 'arrows', text: 'Las flechas se encuentran: las tarjetas quedan alineadas, nada en ellas cambia'}],
  stateCaption: '',
};
const EN = {...CI_EN, ...OWN_EN};
const ES = {...CI_ES, ...OWN_ES};

const sceneSchema = {
  ...ciFields,
  actorLabels: obj('Caption of the actor (legend)', {a: str('Caption for the participant\'s hands (generic)', 70)}, ['a']),
  objectLabels: obj('Captions of the desk objects in the legend', {
    arrows: str('Caption for the arrow marks (alignment marks only)', 80),
    result: str('Caption for the result fields (as supplied, never changed)', 90),
    calendar: str('Caption for the desk calendar (a fixture only)', 70),
  }, ['arrows', 'result', 'calendar']),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the hold; each is keyed to a ring on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 100),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author (no conclusion is inferred): aligned — card B is set beside card A and the strip laid across the aligned rows; pending — nothing moves, card B stays where it lies', ['aligned', 'pending']),
  stateCaption: str('Caption of the supplied state in the hold (empty: the built-in caption of that state)', 110),
};

const defaultParams = {...EN, actionProgress: 1, finalState: 'aligned'};

/** Compose desk + panel at text size F. */
function compose(ctx, P, F, opts) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const notes = noteColors(ctx.theme);
  const rows = [];
  if (showKey) rows.push({kind: 'heading', icon: 'filter', text: P.routes.label, name: 'lg-guide'});
  if (showAll) rows.push({kind: 'item', icon: 'arrows', text: P.objectLabels.arrows, name: 'lg-arrows'});
  if (showAll) rows.push({kind: 'item', icon: 'result', text: P.objectLabels.result, name: 'lg-result'});
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
  const inset = opts.tight ? Math.max(14, F * 0.6) : Math.max(18, F * 0.8);
  const inner = {x: desk.x + inset, y: desk.y + inset, w: desk.w - inset * 2, h: desk.h - inset * 2};
  const mode = opts.mode || (opts.band || inner.w / Math.max(1, inner.h) <= 1.25 ? 'v' : 'h');
  // the widest card whose plan fits the desk's width (cards are capped so they never become banners)
  const planFor = (cw, bars) => {
    const M = cardModel(P, {w: cw, F, showText: showKey, bars, foot: opts.tight ? F * 1.3 : undefined});
    return {M, plan: planDesk(M, {F, mode, align: P.routes.align, restK: opts.restK, tight: opts.tight, avail: inner})};
  };
  let best = null;
  // (quick refusal: even the widest card without filler bars is too tall for this desk)
  const cap = Math.min(F * (showKey ? 24 : 20), inner.w * 0.5);
  const quick = planFor(cap, 0);
  if (quick.plan.needH > inner.h + 0.5) {
    return {F, problems: ['desk-height'], ok: false};
  }
  // (the width does not depend on the filler bars: find the widest card once, then keep as many bars as the height allows)
  let lo = F * 9, hi = cap;
  if (planFor(lo, 0).plan.needW > inner.w) best = planFor(lo, 0);
  else {
    for (let it = 0; it < 7; it++) {
      const mid = (lo + hi) / 2;
      if (planFor(mid, 0).plan.needW <= inner.w) lo = mid; else hi = mid;
    }
    for (const bars of [2, 1, 0]) {
      best = planFor(lo, bars);
      if (best.plan.needH <= inner.h) break;
    }
  }
  const {M, plan} = best;
  // a band layout: the desk is only as tall as its block needs (the panel follows it; the whole is centred)
  if (opts.band && PL) {
    const hh = Math.min(desk.h, plan.needH + inset * 2 + F * (opts.tight ? 0.4 : 1.2));
    desk.h = hh;
    inner.h = hh - inset * 2;
    panel.y = hh + gap;
  }
  const fitsW = plan.needW <= inner.w + 0.5;
  const fitsH = plan.needH <= inner.h + 0.5;
  const ox = inner.x + (inner.w - plan.needW) / 2;
  const oy = inner.y + Math.max(0, (inner.h - plan.needH) / 2);
  const off = q => ({...q, x: q.x + ox, y: q.y + oy});
  const A = off(plan.A), Bt = off(plan.Bt), Bs = off(plan.Bs);
  const strip = {...plan.strip, x: plan.strip.x + ox, yRest: plan.strip.yRest + oy, yLaid: plan.strip.yLaid + oy};
  const cal = plan.cal ? off(plan.cal) : null;
  // arms: the right one from below the desk (holds B by its lower right corner), the left one from the left edge
  // (takes the strip by its left tab)
  const gripLocal = {x: M.w * 0.8, y: M.footY + M.foot * 0.5};
  const deskB = desk.y + desk.h, deskR = desk.x + desk.w;
  const sOff = Math.max(110, F * 5);
  const gS = cardPoint(Bs, M, gripLocal), gT = cardPoint(Bt, M, gripLocal);
  const shoulderR = {x: Math.min(deskR + sOff * 0.2, Math.max(gS.x, gT.x) + F * 3), y: deskB + sOff};
  const bsB = cardBounds(Bs, M);
  const restR = {x: Math.min(deskR - F * 1.6, Math.max(gS.x + F * 2.5, bsB.x + bsB.w + F * 1.6)), y: deskB - F * 0.7};
  const gripS = y => ({x: strip.x + strip.tab / 2, y: y + strip.h / 2});
  const shoulderL = {x: desk.x - sOff, y: (strip.yLaid + strip.h / 2) * 0.5 + (deskB) * 0.5};
  const restL = {x: desk.x + F * 1.1, y: shoulderL.y + F * 0.6};
  const far = Math.max(
    Math.hypot(gS.x - shoulderR.x, gS.y - shoulderR.y), Math.hypot(gT.x - shoulderR.x, gT.y - shoulderR.y),
    Math.hypot(gripS(strip.yRest).x - shoulderL.x, gripS(strip.yRest).y - shoulderL.y),
    Math.hypot(gripS(strip.yLaid).x - shoulderL.x, gripS(strip.yLaid).y - shoulderL.y));
  const armLen = far * 0.5 + 26;
  const armW = clamp(F * 2.1, 38, 54);
  // the parked strip and the calendar must not touch the cards
  const aBox = cardBounds(A, M), btBox = cardBounds(Bt, M);
  const stripRest = {x: strip.x, y: strip.yRest, w: strip.w, h: strip.h};
  const clear = !overlaps(stripRest, aBox, 4) && !overlaps(stripRest, bsB, 4) && !overlaps(aBox, bsB, 4)
    && (!cal || (!overlaps(cal, aBox, 6) && !overlaps(cal, bsB, 6) && !overlaps(cal, btBox, 6) && !overlaps(cal, stripRest, 6)));
  const usedH = PL ? Math.max(desk.y + desk.h, panel.y + PL.h) : desk.y + desk.h;
  const dy = Math.max(0, (DH - usedH) / 2);
  const problems = [!fitsW && 'desk-width', !fitsH && 'desk-height', !M.ok && 'card-text', PL && !PL.ok && 'panel-text', !clear && 'objects-touch'].filter(Boolean);
  return {F, desk, inner, panel, PL, M, plan, A, Bt, Bs, strip, cal, gripLocal, shoulderR, shoulderL, restR, restL, gripS, armLen, armW, mode, dy, ok: !problems.length, problems};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedCi(ctx, EN, ES);
    const shape = ctx.view.shape;
    const showKey = ctx.show('key');
    const arrangements = shape === 'portrait' ? [{band: true}, {band: true, cols: 2}]
      : shape === 'square' ? [{band: true, cols: 2, mode: 'hs'}, {band: true, cols: 2, mode: 'hs', tight: true}, {band: true, cols: 3, mode: 'hs', tight: true}, {band: true, cols: 3, mode: 'hs', tight: true, restK: 0.7}, {band: true, cols: 2}]
        : [{pw: 0.27}, {pw: 0.31}, {pw: 0.35}, {pw: 0.39}];
    const pxu = (fitDesign(ctx.view, ctx.design.w, ctx.design.h).scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
    const sizes = (!showKey ? [50, 46, 42, 38, 35, 32, 29, 26, ...SIZES] : SIZES).map(v => v / pxu);
    let C = null;
    outer: for (const F of sizes) {
      for (const a of arrangements) {
        const c = compose(ctx, P, F, a);
        if (c.ok) { C = c; break outer; }
        if (c.M && (!C || c.problems.length < C.problems.length)) C = c;
      }
    }
    const look = actorLook(ctx, {appearance: {}}, 0);
    const arm = name => topArm(ctx, {name, skin: look.skin, sleeve: look.outfit, handed: name.endsWith('L') ? 'left' : 'right', upper: C.armLen, lower: C.armLen, width: C.armW, handScale: 1.3});
    const armL = arm('armL'), armR = arm('armR');
    const notes = noteColors(ctx.theme);
    const showAll = ctx.show('all');
    const {M, plan} = C;
    const tgt = name => {
      const pad = 12;
      if (name === 'calendar' && C.cal) return {x: C.cal.x - pad, y: C.cal.y - pad * 1.6, w: C.cal.w + pad * 2, h: C.cal.h + pad * 2.6};
      if (name === 'filter') return {x: C.strip.x - pad, y: C.strip.yLaid - pad, w: C.strip.w + pad * 2, h: C.strip.h + pad * 2};
      if (name === 'arrows') {
        const t = arrowTip(C.A, M, plan, 'a');
        const R = plan.arrow.hgt * 0.5 + pad;
        return {x: t.x - plan.arrow.len - R * 0.4, y: t.y - R, w: plan.arrow.len * 2 + R * 0.8, h: R * 2};
      }
      return {x: C.A.x - pad, y: C.A.y - pad, w: C.Bt.x + M.w - C.A.x + pad * 2, h: M.h + pad * 2};
    };
    const rings = showAll ? P.annotations.filter(a => a.target !== 'calendar' || C.cal).map((a, i) => ringRect(tgt(a.target), notes[i % 2], 4)) : [];
    return {P, C, armL, armR, rings, look, pxu};
  },
  build(ctx, L) {
    const {C} = L;
    const {M, plan} = C;
    const desk = deskWindow(ctx, {prefix: 'desk', x: C.desk.x, y: C.desk.y, w: C.desk.w, h: C.desk.h, radius: 26});
    const card = side => g({name: `card${side}`, transform: cardTransform(side === 'a' ? C.A : C.Bs, M)},
      cardNode(ctx, M, side, {prefix: `card${side}-art`}),
      g({transform: T(side === 'a' ? M.w + plan.arrow.len : -plan.arrow.len, plan.arrow.y)}, arrowMark(ctx, {prefix: `arrow${side}`, side, len: plan.arrow.len, hgt: plan.arrow.hgt, dir: side === 'a' ? 1 : -1})));
    return g({name: 'scene', transform: C.dy ? T(0, C.dy) : undefined},
      desk.surface,
      g({'clip-path': desk.clip},
        C.cal ? g({transform: T(C.cal.x, C.cal.y)}, calendarNode(ctx, {prefix: 'calendar', w: C.cal.w, h: C.cal.h})) : null,
        card('a'), card('b'),
        g({name: 'strip', transform: T(C.strip.x, C.strip.yRest)}, filterStrip(ctx, {prefix: 'strip-art', w: C.strip.w, h: C.strip.h, tab: C.strip.tab})),
        L.armL.arm, L.armR.arm, L.armL.palm, L.armR.palm, L.armL.thumb, L.armR.thumb,
      ),
      desk.frame,
      g({name: 'rings', opacity: 0}, L.rings),
      C.PL ? g({name: 'panel', transform: T(C.panel.x, C.panel.y)}, panelNode(ctx, C.PL, {skin: L.look.skin})) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, C} = L;
    const {M, plan} = C;
    const nodes = {};
    const aligned = P.finalState === 'aligned';
    const cap = lerp(W.reach[0], W.backL[1], clamp(P.actionProgress));
    const done = P.actionProgress >= 1;
    const ua = done ? u : Math.min(u, cap);
    const on = w => (aligned ? seg(ua, ...w) : 0);
    const e = ease.inOutCubic;
    const kReach = e(on(W.reach)), kSlide = e(on(W.slide)), kRel = e(on(W.release));
    const lift = e(on(W.lift)) * (1 - e(on(W.down)));
    const kReachL = e(on(W.reachL)), kStrip = e(on(W.strip)), kBackL = e(on(W.backL));
    const liftS = e(on(W.strip)) > 0 ? Math.sin(Math.PI * on(W.strip)) * (1 - on(W.lay)) : 0;
    // card B: from its resting place to its place beside A (position and turn eased together), lifted a little
    const B = {x: lerp(C.Bs.x, C.Bt.x, kSlide), y: lerp(C.Bs.y, C.Bt.y, kSlide), deg: lerp(C.Bs.deg, C.Bt.deg, kSlide), s: 1 + 0.025 * lift};
    nodes.cardb = {transform: cardTransform(B, M)};
    nodes.carda = {transform: cardTransform(C.A, M)};
    const gripB = cardPoint(B, M, C.gripLocal);
    // the strip: parked above the cards, carried down to the aligned rows and laid
    const sy = lerp(C.strip.yRest, C.strip.yLaid, kStrip);
    const ss = 1 + 0.02 * liftS;
    const scx = C.strip.x + C.strip.w / 2, scy = sy + C.strip.h / 2;
    nodes.strip = {transform: `${T(scx, scy, 0, ss)} translate(${r(-C.strip.w / 2)} ${r(-C.strip.h / 2)})`};
    const gS0 = C.gripS(sy);
    const gripS = {x: scx + (gS0.x - scx) * ss, y: scy + (gS0.y - scy) * ss};
    const mix = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
    const hR = kRel > 0 ? mix(gripB, C.restR, kRel) : mix(C.restR, gripB, kReach);
    const hL = kBackL > 0 ? mix(gripS, C.restL, kBackL) : mix(C.restL, gripS, kReachL);
    const pr = L.armR.pose(C.shoulderR, hR, -1);
    const pl = L.armL.pose(C.shoulderL, hL, 1);
    Object.assign(nodes, pr.nodes, pl.nodes);
    const heldB = kReach >= 1 && kRel <= 0;
    const heldS = kReachL >= 1 && kBackL <= 0;
    const noteK = done ? seg(u, ...W.notes) : 0;
    const stateK = done ? seg(u, ...W.state) : 0;
    nodes.rings = {opacity: r(noteK, 3)};
    if (C.PL) for (const row of C.PL.rows) {
      if (row.name.startsWith('note')) nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(stateK, 3)};
    }
    const tipA = arrowTip(C.A, M, plan, 'a'), tipB = arrowTip(B, M, plan, 'b');
    const regA = cardPoint(C.A, M, {x: M.w / 2, y: plan.reg.y}), regB = cardPoint(B, M, {x: M.w / 2, y: plan.reg.y});
    const phase = !aligned || ua < W.reach[0] ? 'rest' : ua < W.reach[1] ? 'reach' : ua < W.slide[1] ? 'slide' : ua < W.release[0] ? 'set' : ua < W.strip[0] ? 'release' : ua < W.lay[1] ? 'strip' : ua < W.backL[1] ? 'back' : 'laid';
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        beat, phase,
        handR: R2(pr.hand), handL: R2(pl.hand), gripB: R2(gripB), gripS: R2(gripS),
        cardB: R2({x: B.x + M.w / 2, y: B.y + M.h / 2}), cardBdeg: r(B.deg, 2), stripC: R2({x: scx, y: scy}),
        heldB, heldS, reach: r(kReach, 3), slide: r(kSlide, 3), strip: r(kStrip, 3), lift: r(lift, 3),
        tipGap: r(Math.hypot(tipA.x - tipB.x, tipA.y - tipB.y), 2), tipDy: r(Math.abs(tipA.y - tipB.y), 2), rowDy: r(Math.abs(regA.y - regB.y), 2),
        stripOnRow: r(Math.abs(scy - regA.y), 2),
        results: [P.outcomes.a, P.outcomes.b], align: P.routes.align,
        allReached: pr.reached && pl.reached,
        finalState: P.finalState, actionCapped: P.actionProgress < 1 && u > cap,
        problems: C.problems, textPx: r(C.F * L.pxu, 1), mode: C.mode,
        cardA: {x: r(C.A.x), y: r(C.A.y), w: r(M.w), h: r(M.h)},
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
    slug: 'review-06-story',
    title: 'Illustrative confirmation — a hand slides the supplied confirmatory card into line beside the original decision card; nothing printed on either changes',
    titleEs: 'Confirmación ilustrativa — Microescena con objetos y actores',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Confirmación ilustrativa',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A top-down desk with two decision cards of the same size: A, the original decision, and B, the confirmatory decision as supplied, each printing its supplied role, title, reference, reasons line and result. B lies loose and turned beside A. A participant\'s right hand slides and turns B into place beside A until the arrow marks on their facing edges meet on one line; the left hand lays a neutral filter strip across the aligned rows. Only the cards move: the printed results are never changed, compared or judged. A desk calendar is a fixture only. Illustrative; no doctrine on what a confirmation means; jurisdiction unspecified.',
    tags: ['review', 'confirmation', 'as supplied', 'decision cards', 'alignment', 'arrow marks', 'filter strip', 'calendar', 'desk', 'hands', 'result unchanged'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/confirmacion-ilustrativa.js', 'src/primitives/desk.js', 'src/primitives/paper.js', 'src/primitives/people-style.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
