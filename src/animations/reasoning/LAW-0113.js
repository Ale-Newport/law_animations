/**
 * LAW-0113 — Hecho contrafactual · story
 *
 * Storyboard (front view of a tabletop diorama on a studio shelf; the rule
 * notice and the script card are pinned on the studio wall beside it):
 *  0.00–0.15 rest     The diorama at rest: a figurine on a round stand holds
 *                     the parcel at the garden end; the pennant flag stands on
 *                     spot A (the base circumstance, e.g. the porch bench).
 *                     Identifiers (figurine, parcel, flag) are shown.
 *  0.15–0.42 action   TAKE A: the reels on the plinth turn forward, the blue
 *                     take lamp lights and the figurine carries the parcel to
 *                     spot A, leaves it and steps back. A dashed ghost traces
 *                     the base result around the parcel. REWIND: the reels
 *                     spin backwards and the take runs in exact reverse — the
 *                     parcel is lifted back into the figurine's hands and the
 *                     figurine glides back to the start. The ghost stays.
 *  0.42–0.73 complete The ONE circumstance changes: the analyst's hand comes
 *                     down, lifts the flag from spot A and plants it on spot B
 *                     (cause), then withdraws. TAKE B: the orange lamp lights
 *                     and the same take replays — identical speed and path as
 *                     take A until the figurine stops at the nearer/farther
 *                     spot B, where it leaves the parcel (effect).
 *  0.73–1.00 hold     Parcel on B, dashed ghost on A, flag on B. A/B badges
 *                     match the script card rows ("Base: …", "What if: …
 *                     (hypothetical)"); a plain relation joins the changed
 *                     circumstance to the rule condition it concerns (as
 *                     supplied); issue, assumption and the key "same scene
 *                     replayed · one circumstance changed · as supplied · no
 *                     conclusion drawn — outcome of the hypothetical run: not
 *                     supplied". Nothing is inferred from the replay.
 * Wide boxes: wall panels on the left, diorama on the right. Tall boxes: the
 * diorama on top, panels stacked below. Square boxes: diorama on top, rule +
 * notes and the script card side by side below.
 * Legal content: fictional, jurisdiction unspecified, illustrative text.
 * @module animations/reasoning/LAW-0113
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {party, storyFields} from '../../schemas/fields.js';
import {topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {chip} from '../../primitives/annotate.js';
import {placeChip, calloutChip, leaderPoly} from '../causation/kits/place.js';
import {
  HC_STRINGS, hcFields, DEFAULT_CONTENT, STAGE, SPOTS, PW, PH, FLAG_H, fill, hcColors,
  takePlan, takeState, standX, parcelAt, flagBase, flagTop, spotBox,
  dioramaArt, parcelArt, ghostArt, flagArt, figurine, ghostFigure, reelAngle,
  letterBadge, ruleNotice, scriptCard, noteChip, boxHit,
} from './kits/hecho-contrafactual.js';

const ID = 'LAW-0113';
const DURATION = 8000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const RATE = 0.17; // u per unit of take time (the longest take lasts 0.17 u = 1.36 s at 8 s)
const REWIND = 0.76; // the rewind lasts 76 % of the forward take (a true time-reverse, no fast-forward)
const W = {
  idsIn: [0.01, 0.08], idsOut: [0.13, 0.15],
  baseStart: 0.15, trace: 0.05,
  handIn: 0.045, carry: 0.05, handOut: 0.04,
};
const M = 12;
const CROP_TOP = 64; // native rows of empty sky hidden in square boxes

const sceneSchema = {
  ...hcFields,
  courier: party,
  ...storyFields(
    {parcel: {type: 'string', maxLength: 30, description: 'Label of the parcel prop'}, flag: {type: 'string', maxLength: 40, description: 'Label of the flag pin that marks the circumstance'}},
    ['fact', 'rule', 'connector', 'flag'],
    ['replayed-as-supplied', 'rewound-awaiting-replay'],
  ),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  courier: {name: 'Courier C', role: 'Courier'},
  actorLabels: {a: 'Courier C (figurine)', b: 'Analyst · sets the what-if'},
  objectLabels: {parcel: 'Parcel 7', flag: 'Spot flag'},
  actionProgress: 1,
  annotations: [],
  finalState: 'replayed-as-supplied',
};

/** Timeline windows derived from the two takes (pure). Beats run strictly in sequence. */
function timeline(pA, pB) {
  const baseEnd = W.baseStart + RATE * pA.tEnd;
  const placedA = W.baseStart + RATE * pA.tPlaced;
  const trace = [placedA - 0.01, placedA - 0.01 + W.trace];
  const rewind = [baseEnd + 0.012, baseEnd + 0.012 + REWIND * RATE * pA.tEnd];
  const handIn = [rewind[1] + 0.01, rewind[1] + 0.01 + W.handIn];
  const carry = [handIn[1], handIn[1] + W.carry];
  const handOut = [carry[1], carry[1] + W.handOut];
  const replayStart = handOut[1] + 0.005;
  const replayEnd = replayStart + RATE * pB.tEnd;
  // the hold: badges, relation, notes, key and identifiers come in right after the replay (all done ≥ 1 s before the end)
  const mk = hs => ({start: hs, badges: [hs, hs + 0.04], rel: [hs + 0.01, hs + 0.06], notes: [hs + 0.02, hs + 0.07], key: [hs + 0.03, hs + 0.08], ids: [hs + 0.03, hs + 0.08], ann: [hs + 0.04, hs + 0.09], complete: hs + 0.09});
  return {baseEnd, placedA, trace, rewind, handIn, carry, handOut, replayStart, replayEnd, placedB: replayStart + RATE * pB.tPlaced,
    hold: mk(Math.max(BEATS.hold[0], replayEnd + 0.01)), holdAwait: mk(Math.max(BEATS.hold[0], handOut[1] + 0.01))};
}

/* ------------------------------------------------------------------------ */
/* Layout                                                                   */
/* ------------------------------------------------------------------------ */

function panelsFor(ctx, s, cap, w, x, y, which, twoCol = false) {
  const p = ctx.params;
  const t = ctx.t;
  const col = hcColors(ctx);
  const c = p.circumstance;
  const cond = Math.min(c.condition ?? 0, p.rules.conditions.length - 1);
  if (which === 'rule') return ruleNotice(ctx, {name: 'rule', x, y, w, size: s, cap, title: p.rules.title, conditions: p.rules.conditions, kind: t.ruleKind, highlight: cond});
  return scriptCard(ctx, {name: 'script', x, y, w, size: s, cap, kind: t.factKind, title: p.facts.title, events: p.facts.events, label: c.label, circHeading: t.circumstance, aText: fill(t.baseT, {x: c.baseText}), bText: fill(t.whatIfT, {x: c.altText}), colors: col, relText: ctx.show('all') ? fill(t.concerns, {n: cond + 1}) : null, relColor: col.rule, twoCol});
}

function notesFor(ctx, s, maxWidth) {
  const p = ctx.params;
  const t = ctx.t;
  if (!ctx.show('all')) return [];
  const out = [];
  p.issues.forEach((q, i) => out.push({name: `issue${i}`, text: `${t.issue}: ${q}`, color: ctx.theme.accent3}));
  p.assumptions.forEach((q, i) => out.push({name: `assume${i}`, text: `${t.assumed}: ${q}`, color: '#7d8b93'}));
  return out.map(n => ({...n, probe: noteChip(ctx, n.text, {x: 0, y: 0, size: s, maxWidth, maxLines: 3})}));
}

function keyText(ctx) {
  const t = ctx.t;
  return `${t.key} — ${ctx.params.finalState === 'rewound-awaiting-replay' ? t.notReplayed : t.outcome}`;
}

function compose(ctx, s, dsK) {
  const D = ctx.design;
  const shape = ctx.view.shape;
  const sc = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  const px = v => v / sc;
  const cap = Math.min(s, Math.max(s * 0.64, px(15)));
  const win = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const gap = s * 0.7;
  const head = px(26); // room above the diorama for the analyst's arm
  const L = {s, cap, sc, px, win, shape, fits: true};
  const keyProbe = w => noteChip(ctx, keyText(ctx), {x: 0, y: 0, size: s, maxWidth: w, maxLines: 3, weight: 600});
  const gut = px(34); // gutter for the relation line
  if (shape === 'landscape') {
    const keyH = ctx.show('key') ? keyProbe(Math.min(win.w * 0.62, 1250)).box.h : 0;
    const ds = Math.min((win.h - head - keyH - 28) / STAGE.h, (win.w * 0.68) / STAGE.w) * dsK;
    const dw = STAGE.w * ds, dh = STAGE.h * ds;
    L.dio = {x: win.x + win.w - 22 - dw, y: win.y + win.h - keyH - 22 - dh, ds, w: dw, h: dh};
    const colX = win.x + 22, colW = L.dio.x - gut - 14 - colX;
    if (colW < px(300)) L.fits = false;
    const rule = panelsFor(ctx, s, cap, colW, colX, 0, 'rule');
    const script = panelsFor(ctx, s, cap, colW, colX, 0, 'script');
    const notes = notesFor(ctx, s, colW);
    const total = rule.box.h + gap + script.box.h + notes.reduce((a, n) => a + n.probe.box.h + gap * 0.6, 0);
    if (total > win.h - 36) L.fits = false;
    let y = win.y + Math.max(18, (win.h - total) / 2);
    L.rule = panelsFor(ctx, s, cap, colW, colX, y, 'rule');
    y += L.rule.box.h + gap;
    L.script = panelsFor(ctx, s, cap, colW, colX, y, 'script');
    y += L.script.box.h + gap * 0.6;
    L.notes = notes.map(n => { const c = {...noteChip(ctx, n.text, {name: n.name, x: colX, y, size: s, maxWidth: colW, maxLines: 3, color: n.color}), name: n.name}; y += c.box.h + gap * 0.6; return c; });
    L.key = ctx.show('key') ? noteChip(ctx, keyText(ctx), {name: 'key', x: L.dio.x + dw / 2, y: L.dio.y + dh + 12, anchor: 'middle', size: s, maxWidth: Math.min(dw, 1250), maxLines: 3, color: ctx.theme.ink}) : null;
    L.relSide = 'right';
  } else if (shape === 'portrait') {
    const ds = ((win.w - 40) / STAGE.w) * dsK;
    const dw = STAGE.w * ds, dh = STAGE.h * ds;
    L.dio = {x: win.x + (win.w - dw) / 2, y: win.y + head, ds, w: dw, h: dh};
    let y = L.dio.y + dh + 12;
    L.key = ctx.show('key') ? noteChip(ctx, keyText(ctx), {name: 'key', x: win.x + win.w / 2, y, anchor: 'middle', size: s, maxWidth: win.w - 40, maxLines: 3, color: ctx.theme.ink}) : null;
    y += (L.key ? L.key.box.h : 0) + gap;
    const colX = win.x + 20, colW = win.w - 40 - gut - 6;
    L.rule = panelsFor(ctx, s, cap, colW, colX, y, 'rule');
    y += L.rule.box.h + gap;
    L.script = panelsFor(ctx, s, cap, colW, colX, y, 'script');
    y += L.script.box.h + gap * 0.6;
    L.notes = notesFor(ctx, s, win.w - 40).map(n => { const c = {...noteChip(ctx, n.text, {name: n.name, x: colX, y, size: s, maxWidth: win.w - 40, maxLines: 3, color: n.color}), name: n.name}; y += c.box.h + gap * 0.6; return c; });
    if (y > win.y + win.h - 10) L.fits = false;
    L.relSide = 'right';
  } else {
    // square: [diorama | rule + notes] over [script card (full width) + key]
    const inner = win.w - 40 - gut;
    const crop = CROP_TOP; // square boxes show the stage without the empty upper sky
    const ds = (inner * 0.66 / STAGE.w) * dsK;
    const dw = STAGE.w * ds, dh = (STAGE.h - crop) * ds;
    const lx = win.x + 20;
    L.dio = {x: lx, y: win.y + head, ds, w: dw, h: dh, crop};
    const rx = lx + dw + gap * 1.2, rw = lx + inner - rx;
    const bottom = win.y + win.h - 10;
    L.rule = panelsFor(ctx, s, cap, rw, rx, win.y + 18, 'rule');
    let y = L.rule.box.y + L.rule.box.h + gap * 0.6;
    const topEnd0 = L.dio.y + dh;
    const notes = notesFor(ctx, s, rw).map(n => ({...n, maxLines: 5}));
    L.notes = [];
    const rest = [];
    for (const n of notes) {
      const c = noteChip(ctx, n.text, {name: n.name, x: rx, y, size: s, maxWidth: rw, maxLines: n.maxLines, color: n.color});
      if (!rest.length && !c.fit.truncated && y + c.box.h <= Math.max(topEnd0, L.rule.box.y + L.rule.box.h) + gap * 4) { L.notes.push({...c, name: n.name}); y += c.box.h + gap * 0.6; } else rest.push(n);
    }
    const topEnd = Math.max(topEnd0, y - gap * 0.6);
    let by = topEnd + gap;
    L.script = panelsFor(ctx, s, cap, inner, lx, by, 'script', true);
    by = L.script.box.y + L.script.box.h + gap * 0.6;
    const bottomItems = [...rest, ...(ctx.show('key') ? [{name: 'key', text: keyText(ctx), color: ctx.theme.ink}] : [])];
    let bx = lx, rowH = 0;
    L.key = null;
    for (const it of bottomItems) {
      const mw = (inner - gap * 0.6) / 2;
      const probe = noteChip(ctx, it.text, {x: 0, y: 0, size: s, maxWidth: mw, maxLines: 5});
      if (bx > lx && bx + probe.box.w > lx + inner) { bx = lx; by += rowH + gap * 0.6; rowH = 0; }
      const c = noteChip(ctx, it.text, {name: it.name, x: bx, y: by, size: s, maxWidth: mw, maxLines: 5, color: it.color});
      if (c.fit.truncated) L.fits = false;
      bx += c.box.w + gap * 0.6;
      rowH = Math.max(rowH, c.box.h);
      if (it.name === 'key') L.key = c; else L.notes.push({...c, name: it.name});
    }
    if (by + rowH > bottom || L.script.box.y + L.script.box.h > bottom || L.rule.box.y + L.rule.box.h > topEnd + 1) L.fits = false;
    if (rw < px(250)) L.fits = false;
    L.relSide = 'right';

  }
  return L;
}

function finish(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const col = hcColors(ctx);
  const c = p.circumstance;
  const {ds} = L.dio;
  const oy = L.dio.y - (L.dio.crop || 0) * ds; // native y = 0 in world units
  L.dio.oy = oy;
  const W2 = q => ({x: L.dio.x + q.x * ds, y: oy + q.y * ds});
  L.W2 = W2;
  const dMax = Math.max(standX(c.base), standX(c.alt)) - STAGE.startX;
  L.pA = takePlan(c.base, dMax);
  L.pB = takePlan(c.alt, dMax);
  L.tl = timeline(L.pA, L.pB);
  L.same = c.base === c.alt;

  // --- diorama parts (native units inside the placed group)
  L.art = dioramaArt(ctx, {prefix: 'dio'});
  L.parcel = parcelArt(ctx, 'parcel');
  L.ghost = ghostArt(ctx, 'ghost', col.a);
  L.flag = flagArt(ctx, 'flag', col.flag);
  L.look = actorLook(ctx, p.courier, 0);
  L.fig = figurine(ctx, {name: 'fig', look: L.look});
  L.ghostFig = ghostFigure(ctx, {name: 'ghostFig', look: L.look, state: takeState(L.pA, L.pA.tPlaced - 1e-6)});
  const bR = L.s * 0.78 / ds;
  const badgeAt = spot => ({x: SPOTS[spot].cx - PW / 2 - bR - 6, y: SPOTS[spot].y - PH - bR - 4});
  L.badgeA = {at: badgeAt(c.base), node: letterBadge(ctx, {name: 'badgeA', x: badgeAt(c.base).x, y: badgeAt(c.base).y, r: bR, color: col.a, letter: 'A', opacity: 0})};
  L.badgeB = {at: badgeAt(c.alt), node: letterBadge(ctx, {name: 'badgeB', x: badgeAt(c.alt).x, y: badgeAt(c.alt).y, r: bR, color: col.b, letter: 'B', opacity: 0})};

  // --- analyst's arm: comes down from above the window, moves the flag, leaves
  const fa = W2(flagTop(c.base)), fb = W2(flagTop(c.alt));
  const midX = (fa.x + fb.x) / 2;
  const shoulder = {x: midX, y: L.win.y - L.px(430)};
  const HAND = 24 * 1.3;
  const arcTop = Math.min(fa.y, fb.y) - L.px(46);
  const need = Math.max(...[fa, fb, {x: midX, y: arcTop}].map(q => Math.hypot(q.x - shoulder.x, q.y - shoulder.y))) + L.px(50) - HAND;
  L.arm = topArm(ctx, {name: 'opArm', skin: actorLook(ctx, {appearance: {}}, 2).skin, sleeve: '#4f5d68', handed: 'left', width: 46, upper: need * 0.5, lower: need * 0.5});
  L.shoulder = shoulder;
  L.reach = L.arm.reach;
  L.arcTop = arcTop;
  L.fa = fa;
  L.fb = fb;

  // --- relation line (conector): script card's circumstance row → the rule condition (as supplied)
  const cond = Math.min(c.condition ?? 0, p.rules.conditions.length - 1);
  L.cond = cond;
  const an = L.rule.anchors[cond];
  const rl = L.script.relLine || {left: {x: L.script.box.x, y: L.script.circBox.y + L.s * 0.6}, right: {x: L.script.box.x + L.script.box.w, y: L.script.circBox.y + L.s * 0.6}};
  let from, to, c1, c2;
  if (L.relSide === 'right') {
    from = rl.right;
    to = an.right;
    const gx = Math.max(from.x, to.x) + L.px(26);
    c1 = {x: gx, y: from.y};
    c2 = {x: gx, y: to.y};
  } else {
    from = rl.right;
    to = an.left;
    const mx = (from.x + to.x) / 2;
    c1 = {x: mx, y: from.y};
    c2 = {x: mx, y: to.y};
  }
  L.rel = {from, to, c1, c2, d: `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`};
  L.relLen = (() => { let len = 0, prev = from; for (let i = 1; i <= 40; i++) { const tt = i / 40, u1 = 1 - tt; const q = {x: u1 ** 3 * from.x + 3 * u1 * u1 * tt * c1.x + 3 * u1 * tt * tt * c2.x + tt ** 3 * to.x, y: u1 ** 3 * from.y + 3 * u1 * u1 * tt * c1.y + 3 * u1 * tt * tt * c2.y + tt ** 3 * to.y}; len += Math.hypot(q.x - prev.x, q.y - prev.y); prev = q; } return len; })();
  const bounds = {x: L.win.x + 8, y: L.win.y + 8, w: L.win.w - 16, h: L.win.h - 16};
  const panels = [L.rule.box, L.script.box, ...L.notes.map(n => n.box), L.key && L.key.box].filter(Boolean);
  const spotW = spot => { const b = spotBox(spot); const p0 = W2({x: b.x, y: b.y}); return {x: p0.x, y: p0.y, w: b.w * ds, h: b.h * ds}; };
  const figFinal = (() => {
    const st = takeState(p.finalState === 'rewound-awaiting-replay' ? L.pA : L.pB, p.finalState === 'rewound-awaiting-replay' ? 0 : 1);
    const q = W2({x: st.figX - 40, y: STAGE.floorY - 215});
    return {x: q.x, y: q.y, w: 90 * ds, h: 225 * ds};
  })();
  const badgeBox = at => { const q = W2(at); const rr = bR * ds + 4; return {x: q.x - rr, y: q.y - rr, w: 2 * rr, h: 2 * rr}; };
  const art = [spotW(c.base), spotW(c.alt), figFinal]; // artwork: chips stay off it, leaders may cross it
  const obstacles = [...panels, ...art, badgeBox(L.badgeA.at), badgeBox(L.badgeB.at)];
  L.relLabel = null;

  // --- identifier chips (rest + hold): figurine, parcel, flag; analyst chip while the hand is in
  // rest and hold identifiers are never visible together: each set has its own obstacle list
  const chipAt = (name, text, target, order, list, own) => {
    const size = L.s * 0.92;
    const all = ['above', 'aboveR', 'aboveL', 'right', 'left', 'rightLow', 'leftLow', 'rightHigh', 'leftHigh', 'belowR', 'belowL', 'below'];
    // narrower (taller) versions of the chip are tried before giving up on a clean spot
    const fits = [[430, 3], [320, 4], [240, 5], [190, 6]].map(([w, ml]) => ({w: L.px(w), ml, box: chip(ctx, text, {x: 0, y: 0, maxWidth: L.px(w), size, minSize: size, maxLines: ml}).box}));
    const ok = fits.filter(f => !chip(ctx, text, {x: 0, y: 0, maxWidth: f.w, size, minSize: size, maxLines: f.ml}).fit.truncated);
    let res = null, f = ok[0] || fits[0];
    for (const cand of ok) {
      res = placeChip({w: cand.box.w, h: cand.box.h}, target, {obstacles: list, own, bounds, order, gaps: [14, 28, 46, 70, 100, 140]})
        || placeChip({w: cand.box.w, h: cand.box.h}, target, {obstacles: list, own, bounds, order: all, gaps: [14, 28, 46, 70, 100, 140, 190, 250, 320]});
      if (res) { f = cand; break; }
    }
    if (!res) res = placeChip({w: f.box.w, h: f.box.h}, target, {obstacles: list, bounds, order: all, gaps: [14, 28, 46, 70, 100, 140], leastBad: true});
    const cc = calloutChip(ctx, {name, text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: f.w, maxLines: f.ml, size, color: th.ink});
    list.push(cc.box, leaderPoly(cc.box, res.end));
    return cc;
  };
  L.ids = {rest: [], hold: []};
  L.keyBoxes = [];
  if (ctx.show('all')) {
    const figTop0 = W2({x: STAGE.startX + 6, y: STAGE.floorY - 212});
    const actor = [p.courier.name && !p.actorLabels.a.includes(p.courier.name) ? p.courier.name : null, p.actorLabels.a].filter(Boolean).join(' — ');
    const fig0 = {x: L.dio.x + (STAGE.startX - 40) * ds, y: oy + (STAGE.floorY - 215) * ds, w: 90 * ds, h: 225 * ds};
    const restList = [...panels, spotW(c.base), fig0];
    L.ids.rest.push(chipAt('idActor', actor, figTop0, ['above', 'aboveR', 'aboveL'], restList, [fig0]));
    const parcel0 = W2({x: STAGE.startX + 34, y: STAGE.floorY - 108});
    L.ids.rest.push(chipAt('idParcel', p.objectLabels.parcel, {x: parcel0.x + PW * ds * 0.5, y: parcel0.y}, ['right', 'rightHigh', 'aboveR', 'rightLow'], restList, [fig0]));
    const flag0 = W2(flagTop(c.base));
    L.ids.rest.push(chipAt('idFlag', p.objectLabels.flag, flag0, ['aboveL', 'above', 'aboveR', 'left'], restList, [spotW(c.base)]));
    // hold: the same identifiers at the end state (figurine stepped back, parcel and flag on the hypothetical spot)
    const awaitingEnd = p.finalState === 'rewound-awaiting-replay';
    const holdList = [...obstacles];
    const figEnd = figFinal;
    L.ids.hold.push(chipAt('idFlagHold', p.objectLabels.flag, W2(flagTop(c.alt)), ['aboveR', 'above', 'aboveL', 'right'], holdList, art));
    const pEnd = awaitingEnd ? W2({x: STAGE.startX + 34, y: STAGE.floorY - 108}) : W2(parcelAt(c.alt));
    L.ids.hold.push(chipAt('idParcelHold', p.objectLabels.parcel, {x: pEnd.x, y: pEnd.y + PH * ds * 0.5}, ['below', 'belowL', 'belowR', 'rightLow', 'leftLow'], holdList, art));
    L.ids.hold.push(chipAt('idActorHold', actor, {x: figEnd.x + figEnd.w / 2, y: figEnd.y + 4}, ['above', 'aboveL', 'aboveR', 'leftHigh'], holdList, art));
    // key scene elements (tight boxes): both spots with their parcel/ghost and flag, and the A/B badges
    const tight = spot => { const b = spotBox(spot, 3); const p0 = W2({x: b.x, y: b.y}); return {x: p0.x, y: p0.y, w: b.w * ds, h: b.h * ds}; };
    L.keyBoxes = [tight(c.base), tight(c.alt), badgeBox(L.badgeA.at), badgeBox(L.badgeB.at)];
    obstacles.push(...holdList.slice(obstacles.length));
    // analyst chip beside the arm's entry at the window top
    const text = p.actorLabels.b;
    const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: L.px(360), size: L.s * 0.92, maxLines: 2});
    const ax = Math.min(L.win.x + L.win.w - probe.box.w / 2 - 16, Math.max(L.win.x + probe.box.w / 2 + 16, Math.min(fa.x, fb.x) - L.px(60) - probe.box.w / 2));
    L.analyst = chip(ctx, text, {x: ax, y: L.win.y + 10, anchor: 'middle', maxWidth: L.px(360), size: L.s * 0.92, maxLines: 2, fill: th.card, stroke: th.ink, name: 'idAnalyst', weight: 600});
  }

  // --- editorial annotations (hold)
  L.ann = [];
  if (ctx.show('all')) {
    p.annotations.forEach((a, i) => {
      const tg = a.target === 'rule' ? an.left.x > L.win.x + 40 ? an.left : an.bottom
        : a.target === 'connector' ? {x: (c1.x + c2.x) / 2, y: (from.y + to.y) / 2}
          : a.target === 'flag' ? W2(flagTop(c.alt))
            : W2(parcelAt(c.alt));
      const size = L.s * 0.92;
      const probe = chip(ctx, a.text, {x: 0, y: 0, maxWidth: L.px(420), size, maxLines: 3});
      const res = placeChip({w: probe.box.w, h: probe.box.h}, tg, {obstacles, own: art, bounds, gaps: [20, 40, 70, 110, 160]})
        || placeChip({w: probe.box.w, h: probe.box.h}, tg, {obstacles, bounds, leastBad: true});
      const cc = calloutChip(ctx, {name: `ann${i}`, text: a.text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: L.px(420), maxLines: 3, size, color: th.ink});
      obstacles.push(cc.box, leaderPoly(cc.box, res.end));
      L.ann.push(cc);
    });
  }
  return L;
}

/* ------------------------------------------------------------------------ */

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1080], portrait: [900, 1400]},
  layout(ctx) {
    const D = ctx.design;
    const sc = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
    const base = 23 / sc;
    let L = null;
    // AUTHORING item 18: the diorama stays large — text shrinks first (down to ~16 px), the scene only after
    // phase 1 keeps text ≥ ~20 px while the scene may shrink to ~80 %; phase 2 goes down to ~16 px (stress content)
    const tries = [];
    for (const dsK of [1, 0.94, 0.88, 0.82]) for (const k of [1, 0.95, 0.9, 0.87]) tries.push([k, dsK]);
    for (const dsK of [1, 0.94, 0.88, 0.82, 0.76, 0.7]) for (const k of [0.84, 0.8, 0.76, 0.72, 0.7]) tries.push([k, dsK]);
    for (const [k, dsK] of tries) {
      L = compose(ctx, base * k, dsK);
      if (L.fits) break;
    }
    return finish(ctx, L);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const col = hcColors(ctx);
    const win = L.win;
    const clipId = 'win-clip';
    const shelfY = L.dio.y + L.dio.h - 8;
    return g(null,
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(win.x, win.y, win.w, win.h, 26)}))),
      h('path', {d: roundRectPath(win.x, win.y, win.w, win.h, 26), fill: '#e9e4da'}),
      g({'clip-path': ctx.ref(clipId)},
        // studio wall texture + shelf under the diorama
        h('rect', {x: win.x, y: win.y, width: win.w, height: win.h, fill: '#ece7dd'}),
        h('path', {d: `M${r(L.dio.x - 30)} ${r(shelfY)}H${r(L.dio.x + L.dio.w + 30)}V${r(shelfY + 16)}H${r(L.dio.x - 30)}Z`, fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: `M${r(L.dio.x - 10)} ${r(shelfY + 16)}H${r(L.dio.x + L.dio.w + 10)}`, stroke: 'rgba(31,35,40,0.18)', 'stroke-width': 8}),
        L.dio.crop ? h('defs', null, h('clipPath', {id: ctx.id('dio-crop')}, h('rect', {x: r(L.dio.x - 4), y: r(L.dio.y), width: r(L.dio.w + 8), height: r(L.dio.h + 4)}))) : null,
        g({'clip-path': L.dio.crop ? ctx.ref('dio-crop') : undefined}, g({transform: T(L.dio.x, L.dio.oy, 0, L.dio.ds)},
          L.art.back,
          L.ghostFig.node,
          L.ghost.node,
          g({name: 'parcelT', transform: T(0, 0)}, L.parcel),
          g({name: 'flagT', transform: T(0, 0)}, L.flag),
          L.fig.node,
          L.art.boxFront,
          L.badgeA.node, L.badgeB.node,
          L.art.apron,
        )),
        // a cropped view keeps a wooden top rim so the diorama still reads as a framed box
        L.dio.crop ? h('path', {d: `M${r(L.dio.x)} ${r(L.dio.y)}H${r(L.dio.x + L.dio.w)}V${r(L.dio.y + 12)}H${r(L.dio.x)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': 2.4}) : null,
        L.rel ? h('path', {name: 'rel', d: L.rel.d, fill: 'none', stroke: col.rule, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(L.relLen)} ${r(L.relLen + 20)}`, 'stroke-dashoffset': r(L.relLen)}) : null,
        L.rule.node,
        L.script.node,
        L.rel ? h('circle', {name: 'relDotA', cx: r(L.rel.from.x), cy: r(L.rel.from.y), r: 6, fill: col.rule, stroke: th.ink, 'stroke-width': 1.6, opacity: 0}) : null,
        L.rel ? h('circle', {name: 'relDotB', cx: r(L.rel.to.x), cy: r(L.rel.to.y), r: 6, fill: col.rule, stroke: th.ink, 'stroke-width': 1.6, opacity: 0}) : null,
        L.notes.map(n => n.node),
        L.key && L.key.node,
        g({name: 'opArmG', opacity: 0}, L.arm.arm, L.arm.palm, L.arm.thumb),
        L.analyst && g({name: 'idAnalystG', opacity: 0}, L.analyst.node),
        L.ids.rest.map(x => x.node),
        L.ids.hold.map(x => x.node),
        L.ann.map(x => x.node),
      ),
      h('path', {d: roundRectPath(win.x, win.y, win.w, win.h, 26), fill: 'none', stroke: th.ink, 'stroke-width': 3}),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const c = p.circumstance;
    const tl = L.tl;
    const awaiting = p.finalState === 'rewound-awaiting-replay';
    const endU = awaiting ? tl.handOut[1] : tl.replayEnd;
    const capU = lerp(BEATS.action[0], endU, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const nodes = {};

    // --- which take is on the stage
    let take = 'none', tau = 0, plan = L.pA, reels = 0, dir = 0;
    const baseTurns = (tl.baseEnd - W.baseStart) / RATE;
    if (a < W.baseStart) { take = 'none'; tau = 0; plan = L.pA; }
    else if (a < tl.baseEnd) { take = 'A'; tau = (a - W.baseStart) / RATE; plan = L.pA; reels = tau; dir = 1; }
    else if (a < tl.rewind[0]) { take = 'A-held'; tau = L.pA.tEnd; plan = L.pA; reels = baseTurns; }
    else if (a < tl.rewind[1]) {
      const k = seg(a, ...tl.rewind);
      take = 'rewind'; tau = L.pA.tEnd * (1 - k); plan = L.pA; reels = baseTurns * (1 - k); dir = -1;
    } else if (awaiting || a < tl.replayStart) { take = 'rewound'; tau = 0; plan = L.pB; reels = 0; }
    else { take = a < tl.replayEnd ? 'B' : 'B-held'; tau = (a - tl.replayStart) / RATE; plan = L.pB; reels = tau; dir = a < tl.replayEnd ? 1 : 0; }
    // cumulative reel rotation: forward during a take, backwards in the rewind (3 turns per take time unit)
    const reelTurns = reels * 3;
    const st = takeState(plan, tau);
    const fp = L.fig.pose({x: st.figX, lift: reduced ? 0 : st.lift, near: st.near, far: st.far});
    Object.assign(nodes, fp.nodes);
    nodes.parcelT = {transform: T(st.parcel.x, st.parcel.y)};
    nodes['dio-reelL'] = {transform: `${T(L.art.reels.left.x, L.art.reels.left.y)} rotate(${reelAngle(reelTurns)})`};
    nodes['dio-reelR'] = {transform: `${T(L.art.reels.right.x, L.art.reels.right.y)} rotate(${reelAngle(reelTurns * 0.8)})`};
    nodes['dio-play'] = {opacity: dir === 1 ? 1 : 0};
    nodes['dio-rew'] = {opacity: dir === -1 ? 1 : 0};
    const lampA = take === 'A' || take === 'A-held' ? 1 : take === 'rewind' ? 0.45 : 0;
    const lampB = take === 'B' || take === 'B-held' ? 1 : 0;
    nodes['dio-lampA'] = {opacity: lampA};
    nodes['dio-lampB'] = {opacity: lampB};

    // --- ghost of the base result (traced once take A has left the parcel)
    const tr = seg(a, ...L.tl.trace);
    const pa = parcelAt(c.base);
    nodes.ghost = {transform: T(pa.x, pa.y), opacity: r(L.same ? 0 : tr, 3)};
    nodes.ghostFig = {opacity: r(L.same ? 0 : 0.34 * tr, 3)};

    // --- the analyst's hand moves the flag: A → B (the single changed circumstance)
    const inK = ease.inOutCubic(seg(a, ...tl.handIn));
    const carryK = ease.inOutSine(seg(a, ...tl.carry));
    const outK = ease.inOutCubic(seg(a, ...tl.handOut));
    const fa = L.fa, fb = L.fb;
    const offUpA = {x: fa.x, y: L.win.y - L.px(70)};
    const offUpB = {x: fb.x, y: L.win.y - L.px(70)};
    let hand, flagW, holder = 'spotA';
    if (a < tl.carry[0]) {
      hand = {x: lerp(offUpA.x, fa.x, inK), y: lerp(offUpA.y, fa.y, inK)};
      flagW = fa;
      holder = 'spotA';
    } else if (a < tl.carry[1]) {
      const lift = Math.sin(Math.PI * carryK);
      flagW = {x: lerp(fa.x, fb.x, carryK), y: lerp(fa.y, fb.y, carryK) - lift * (Math.min(fa.y, fb.y) - L.arcTop)};
      hand = flagW;
      holder = 'hand';
    } else {
      flagW = fb;
      hand = {x: lerp(fb.x, offUpB.x, outK), y: lerp(fb.y, offUpB.y, outK)};
      holder = 'spotB';
    }
    const ap = L.arm.pose(L.shoulder, hand, 1);
    Object.assign(nodes, ap.nodes);
    const armIn = a > tl.handIn[0] && a < tl.handOut[1];
    nodes.opArmG = {opacity: armIn ? 1 : 0};
    const ds = L.dio.ds;
    const fNative = {x: (flagW.x - L.dio.x) / ds, y: (flagW.y - L.dio.oy) / ds + FLAG_H};
    nodes.flagT = {transform: T(fNative.x, fNative.y)};

    // the "What if" row of the script card appears when the flag lands on its new spot (the change beat)
    nodes['script-rowB'] = {opacity: r(p.actionProgress >= 1 || a >= tl.carry[1] ? seg(a, tl.carry[1] - 0.012, tl.carry[1] + 0.012) : 0, 3)};
    // --- hold: badges, relation (conector), notes, key
    const HW = awaiting ? tl.holdAwait : tl.hold;
    const hold = done && u >= HW.start;
    const bk = hold ? seg(u, ...HW.badges) : 0;
    nodes.badgeA = {opacity: r(L.same ? 0 : bk, 3)};
    nodes.badgeB = {opacity: r(awaiting || L.same ? 0 : bk, 3)};
    const rk = hold ? ease.inOutCubic(seg(u, ...HW.rel)) : 0;
    if (L.rel) {
      nodes.rel = {'stroke-dashoffset': r(L.relLen * (1 - rk))};
      nodes.relDotA = {opacity: rk > 0 ? 1 : 0};
      nodes.relDotB = {opacity: rk >= 0.98 ? 1 : 0};
      nodes[`rule-hl${L.cond}`] = {opacity: r(rk, 3)};
    }
    if (L.script.relLine) nodes['script-rel'] = {opacity: r(seg(rk, 0, 0.4), 3)};
    const nk = hold ? seg(u, ...HW.notes) : 0;
    L.notes.forEach((n, i) => { nodes[n.name] = {opacity: r(clamp(nk * 1.4 - i * 0.2), 3)}; });
    if (L.key) nodes.key = {opacity: r(hold ? seg(u, ...HW.key) : 0, 3)};
    // identifiers: at rest, while the analyst's hand is in, and again in the hold
    const restK = seg(u, ...W.idsIn) * (1 - seg(u, ...W.idsOut));
    for (const x of L.ids.rest) Object.assign(nodes, x.frame(restK));
    const idHold = hold ? seg(u, ...HW.ids) : 0;
    for (const x of L.ids.hold) Object.assign(nodes, x.frame(idHold));
    if (L.analyst) nodes.idAnalystG = {opacity: r(armIn ? Math.min(seg(a, tl.handIn[0], tl.handIn[0] + 0.02), 1 - seg(a, tl.handOut[1] - 0.02, tl.handOut[1])) : 0, 3)};
    L.ann.forEach(x => Object.assign(nodes, x.frame(hold ? seg(u, ...HW.ann) : 0)));

    // --- semantics
    const W2 = L.W2;
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const parcelW = W2(st.parcel);
    const gp = {near: W2(st.near), far: W2(st.far)};
    const hands = fp.hands;
    const handsW = {near: W2(hands.near), far: W2(hands.far)};
    // lockstep with take A at the same take time (replay only)
    const baseAtTau = takeState(L.pA, tau);
    const spotOf = pt => Object.keys(SPOTS).find(k => Math.hypot(parcelAt(k).x - pt.x, parcelAt(k).y - pt.y) < 0.5) || null;
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      take,
      takeTime: r(tau, 4),
      phase: st.phase,
      holder: st.holder,
      parcelSpot: st.holder === 'spot' ? spotOf(st.parcel) : null,
      flagHolder: holder,
      flagSpot: holder === 'hand' ? null : holder === 'spotA' ? c.base : c.alt,
      baseSpot: c.base,
      altSpot: c.alt,
      changedCircumstances: c.base === c.alt ? 0 : 1,
      ghostVisible: nodes.ghost.opacity > 0,
      ghostSpot: c.base,
      reelDir: dir,
      lampA, lampB,
      armIn,
      fig: P2(W2({x: st.figX, y: STAGE.floorY - st.lift})),
      figX: r(st.figX, 3),
      baseFigXAtSameTime: r(baseAtTau.figX, 3),
      parcel: P2(parcelW),
      gripN: P2(gp.near),
      gripF: P2(gp.far),
      handN: P2(handsW.near),
      handF: P2(handsW.far),
      flag: P2(flagW),
      hand: P2(ap.hand),
      relation: {kind: 'relation', condition: L.cond, drawn: r(rk, 3)},
      holdShown: hold,
      badges: {a: nodes.badgeA.opacity, b: nodes.badgeB.opacity},
      notesShown: L.notes.length ? nk > 0 : null,
      notes: L.notes.map(n => n.fit.lines.join(' ')),
      keyText: L.key ? L.key.fit.lines.join(' ') : null,
      outcome: 'not-supplied',
      winner: null,
      textPx: r(L.s * L.sc, 2),
      capPx: r(L.cap * L.sc, 2),
      allReached: fp.reached && ap.reached,
      reach: {figurine: fp.reached, arm: ap.reached},
      actionCapped: p.actionProgress < 1 && u > capU,
      finalState: p.finalState,
      windows: {base: [W.baseStart, r(tl.baseEnd, 4)], rewind: tl.rewind.map(v => r(v, 4)), hand: [r(tl.handIn[0], 4), r(tl.handOut[1], 4)], replay: [r(tl.replayStart, 4), r(tl.replayEnd, 4)], complete: r(HW.complete, 4)},
      whatIfRow: nodes['script-rowB'].opacity,
      dioShare: {w: r(L.dio.w / L.win.w, 3), h: r(L.dio.h / L.win.h, 3)},
      figShare: r((205 * L.dio.ds) / ctx.design.h, 3),
      keyBoxes: (L.keyBoxes || []).map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
      chipBoxes: [...L.ids.hold, ...L.ann].map(c2 => ({x: r(c2.box.x), y: r(c2.box.y), w: r(c2.box.w), h: r(c2.box.h)})),
      relEnds: L.rel ? {from: P2(L.rel.from), to: P2(L.rel.to), rowAnchor: P2(L.rule.anchors[L.cond].right), rowAnchorL: P2(L.rule.anchors[L.cond].left), relLine: L.script.relLine ? {l: P2(L.script.relLine.left), r: P2(L.script.relLine.right)} : null} : null,
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-09-story',
    title: 'Counterfactual fact — a diorama take is rewound and replayed with the flag moved to one other spot',
    titleEs: 'Hecho contrafactual — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho contrafactual',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Front view of a tabletop diorama: a figurine carries a parcel to the spot marked by a flag (take A, reels forward). The take is rewound in exact reverse, leaving a dashed ghost of the base result; the analyst’s hand moves the flag to one other spot (the single changed circumstance) and the same take replays with identical speed and path until the new spot (take B). Script card rows “Base: …” and “What if: … (hypothetical)”, a plain relation to the rule condition the author names, issue, assumption and a key: as supplied, no conclusion drawn, outcome of the hypothetical run not supplied.',
    tags: ['reasoning', 'counterfactual', 'hypothetical', 'replay', 'rewind', 'diorama', 'figurine', 'flag', 'rule', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-contrafactual.js', 'src/primitives/person.js', 'src/primitives/desk.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HC_STRINGS,
  scene,
});
