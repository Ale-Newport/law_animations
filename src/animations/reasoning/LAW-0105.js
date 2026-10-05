/**
 * LAW-0105 — Razonamiento circular · story
 *
 * Storyboard (side view of a table against a wall; an analyst stands just
 * off-frame — the left arm holds a magnifier, the right arm moves cards):
 *  0.00–0.15 rest     On the table the CLAIM card (attributed to a fictional
 *                     speaker: portrait medallion + "said by") and its
 *                     PREMISE card lean on each other — an A-frame whose tops
 *                     touch. The EXTERNAL premise card is propped against the
 *                     claim's other side, mixed into the pile. An archive box
 *                     (the outside support, label as supplied) stands apart;
 *                     the rule plaque (text as supplied) hangs on the wall.
 *  0.15–0.42 action   A support arrow leaves the premise and arcs onto the
 *                     claim (premise → claim). A second arrow leaves the
 *                     claim, rises higher and comes back down onto the SAME
 *                     premise: the two arcs close into a loop. Its arrowhead
 *                     travels at the drawing tip; the magnifier catches it on
 *                     the way down and follows it to where it lands.
 *  0.42–0.73 complete The right hand takes the external premise by its top
 *                     edge, pulls it upright, lifts it clear and carries it to
 *                     the archive box (on the same table in wide/square
 *                     boxes; up onto a wall shelf in tall boxes), then leans
 *                     it on the box. Only once it rests there do the chain
 *                     arrows draw: box → external premise → claim.
 *  0.73–1.00 hold     State tag (the supplied finalState), key (loop / chain
 *                     glyphs), issue note pinned beside the claim, footnote
 *                     with the assumptions and "as supplied · no conclusion
 *                     drawn". finalState 'loop-only' leaves the external card
 *                     where it was (no chain is drawn).
 * The scene only shows the structure of support as supplied: nothing falls,
 * nothing is marked wrong, no winner or outcome.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/reasoning/LAW-0105
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, dist} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  RC_STRINGS, RC_DEFAULTS, claimField, rulesField, issuesField, assumptionsField, supportLabelField,
  rcColors, px1080, measureCard, cardArt, measureBox, boxArt, ribbonArrow, arcPts, lupaArt, stageArt,
  measurePlaque, plaqueArt, tagChip, measureKey, keyArt, loopGlyph, chainGlyph, noteArt, noteSize, footArt,
  speakerLook, attributionText, leanPose, freePose, aFrame, onEdgeAtY, findSpot, segBoxes, poseBox, topAt, sideAt,
  union, inflate, contactShadow,
} from './kits/razonamiento-circular.js';

const ID = 'LAW-0105';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  chips: [0.01, 0.1],
  arrow1: [0.15, 0.27], arrow2: [0.27, 0.41],
  lensGo: [0.3, 0.365], view: [0.34, 0.38], lensBack: [0.45, 0.53], viewOut: [0.45, 0.5],
  reachR: [0.39, 0.49], upright: [0.49, 0.52], lift: [0.52, 0.55], carry: [0.55, 0.642], lower: [0.642, 0.667], lean: [0.667, 0.69],
  release: [0.69, 0.77], arrowBE: [0.69, 0.71], arrowEC: [0.71, 0.73],
  tag: [0.735, 0.78], issue: [0.745, 0.79], foot: [0.76, 0.8], notes: [0.77, 0.81],
};
const TH = 8;       // lean of the A-frame and of the separated card (deg)
const TH_E = 11;    // lean of the external card propped on the claim (deg)
const M = 12;

const STRINGS = {
  en: {...RC_STRINGS.en, setApart: 'External premise set apart on its own support · as supplied', loopOnly: 'Loop traced; external premise left where it was · as supplied'},
  es: {...RC_STRINGS.es, setApart: 'Premisa externa separada sobre su propio soporte · según lo aportado', loopOnly: 'Bucle trazado; la premisa externa queda donde estaba · según lo aportado'},
};

const sceneSchema = {
  speaker: party,
  claim: claimField,
  facts: list('Premises as supplied (fictional): [0] the premise offered for the claim, which leans on the claim (the loop); [1] the external premise, which is set apart onto the outside support', str('Premise', 110), 2, 2),
  supportLabel: supportLabelField,
  rules: rulesField,
  issues: issuesField,
  assumptions: assumptionsField,
  analyst: party,
  actorLabels: obj('Role captions', {a: str('Caption for the analyst whose arms enter the frame (descriptive)', 60)}),
  objectLabels: obj('Kind labels printed on the objects', {
    claim: str('Kind label on the claim card', 30),
    premise: str('Kind label on the premise card', 30),
    external: str('Kind label on the external premise card', 30),
    support: str('Kind label on the archive box', 30),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['claim', 'premise', 'external', 'support', 'connector', 'lupa']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: the external premise is set apart on its own support (external-set-apart), or it is left propped where it was and only the loop is traced (loop-only). No conclusion is drawn in either', ['external-set-apart', 'loop-only']),
};

const defaultParams = {
  speaker: RC_DEFAULTS.speaker,
  claim: RC_DEFAULTS.claim,
  facts: [RC_DEFAULTS.premise, RC_DEFAULTS.external],
  supportLabel: RC_DEFAULTS.supportLabel,
  rules: RC_DEFAULTS.rules,
  issues: RC_DEFAULTS.issues,
  assumptions: RC_DEFAULTS.assumptions,
  analyst: {name: 'Rin', role: 'Analyst'},
  actorLabels: {a: 'Analyst · follows the support lines'},
  objectLabels: {claim: 'Claim', premise: 'Premise', external: 'External premise', support: 'Outside support'},
  actionProgress: 1,
  annotations: [],
  finalState: 'external-set-apart',
};

/* ------------------------------------------------------------------ */

function sizes(ctx, s) {
  const k = px1080(ctx);
  return {
    k, s,
    // captions and supplied side texts: >= 20 px when room allows, never larger than the card content
    ks: Math.min(s, Math.max(16.5 / k, s * 0.66)),
    as: Math.min(s, Math.max(20 / k, s * 0.82)),
    cs: Math.min(s, Math.max(20 / k, s * 0.8)),
  };
}

/** Flow items (w,h) into rows inside a band; returns positions and height. */
function flow(items, x0, width, gap, rowGap) {
  const out = [];
  let x = x0, y = 0, rowH = 0;
  for (const it of items) {
    if (x > x0 && x + it.w > x0 + width) { x = x0; y += rowH + rowGap; rowH = 0; }
    out.push({x, y});
    x += it.w + gap;
    rowH = Math.max(rowH, it.h);
  }
  return {pos: out, h: items.length ? y + rowH : 0};
}

/** Geometry for one text size. */
function compose(ctx, s0, extras = [], csCap = Infinity) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = sizes(ctx, s0);
  S.cs = Math.min(S.cs, csCap);
  S.as = Math.min(S.as, Math.max(S.cs, csCap));
  const {s, ks, as, cs} = S;
  const show = ctx.show('key');
  const all = ctx.show('all');
  const stack = ctx.view.shape === 'portrait';
  const stage = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const R = clamp(s * 2.1, 40, 72);
  const Lh = R * 1.75;
  const leftMargin = R * 2.2 + 30;
  const plankT = Math.max(34, s * 1.35);
  const sn = Math.sin(TH * Math.PI / 180);
  const kinds = {
    claim: p.objectLabels.claim || t.claimKind,
    premise: p.objectLabels.premise || t.premiseKind,
    external: p.objectLabels.external || t.externalKind,
    support: p.objectLabels.support || t.supportKind,
  };

  // ---- bottom band: key, state tag, footnote, analyst caption (measured first)
  const bandW = stage.w - 40;
  const items = [];
  let key = null, tagProbe = null, footProbe = null, whoProbe = null;
  const setApart = p.finalState === 'external-set-apart';
  if (show) {
    const C = rcColors(ctx);
    key = measureKey(ctx, [
      {glyph: (x, y, u) => loopGlyph(x, y, u, C.loop), text: t.loopKey},
      ...(setApart ? [{glyph: (x, y, u) => chainGlyph(x, y, u, C.chain), text: t.chainKey}] : []),
    ], stack ? bandW : bandW * 0.27, cs);
    items.push({id: 'key', w: key.w + cs * 1.2, h: key.h + cs * 1.2});
    tagProbe = tagChip(ctx, setApart ? t.setApart : t.loopOnly, {x: 0, y: 0, size: cs, maxWidth: stack ? bandW : bandW * 0.3});
    items.push({id: 'tag', w: tagProbe.box.w, h: tagProbe.box.h});
    const footText = p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ${t.noConclusion}` : t.noConclusion;
    footProbe = footArt(ctx, {name: 'probe', text: footText, x: 0, y: 0, size: cs, maxWidth: stack ? bandW : bandW * 0.4});
    items.push({id: 'foot', w: footProbe.box.w, h: footProbe.box.h, text: footText});
  }
  if (all) {
    const who = [p.analyst.name, p.actorLabels.a].filter(Boolean).join(' · ');
    if (who) {
      whoProbe = {text: who};
    }
  }
  // notes that found no free wall space move into the band (second layout pass)
  for (const ex of extras) {
    if (ex === 'plaque' && p.rules.length) {
      const m = measurePlaque(ctx, {w: stack ? Math.min(bandW, 640) : Math.min(bandW * 0.36, 620), s: cs, ks, head: t.ruleHead, text: p.rules[0], show});
      items.unshift({id: 'plaque', w: m.w + 14, h: m.h + 37, m});
    }
    if (ex === 'issue' && all && p.issues.length) {
      const text = `${t.issue}: ${p.issues[0]}`;
      const mw = stack ? Math.min(bandW, 640) : Math.min(bandW * 0.34, 560);
      const sz = noteSize(ctx, text, mw, cs, 5);
      items.push({id: 'issue', w: sz.w, h: sz.h, text, mw});
    }
    const nm = /^note(\d)$/.exec(ex);
    if (nm && all && p.annotations[+nm[1]]) {
      const text = p.annotations[+nm[1]].text;
      const mw = stack ? Math.min(bandW, 640) : Math.min(bandW * 0.34, 560);
      const sz = noteSize(ctx, text, mw, cs, 6);
      items.push({id: ex, w: sz.w, h: sz.h, text, mw});
    }
    if (ex === 'who' && all && whoProbe) {
      const c0 = chip(ctx, whoProbe.text, {x: 0, y: 0, maxWidth: Math.min(bandW, 460), size: cs, minSize: cs, maxLines: 5});
      items.push({id: 'who', w: c0.box.w, h: c0.box.h, text: whoProbe.text});
    }
  }
  const band = flow(items, stage.x + 20, bandW, 22, 14);
  const bandH = band.h ? band.h + 24 : 12;

  // ---- cards and box
  const look = speakerLook(ctx, p.speaker);
  const attr = attributionText(t, p.speaker);
  const measure = (w, kind, body, withAttr) => measureCard(ctx, {w, s, ks, as, kind, body, attribution: withAttr ? attr : null, show, floor: 16.3 / S.k});
  const tableY = stage.y + stage.h - bandH - plankT;
  const ASP = stack ? 1.62 : 1.38; // cards stand taller than wide
  let u;
  if (!stack) {
    // P, C, E and the box in one row: u = width of P and C, capped so the A-frame and its loop fit the wall height
    const avail = stage.w - leftMargin - 24;
    const uW = (avail - 150 - 30) / (2 + 2 * ASP * sn + 0.86 + 0.8);
    const hMax = (tableY - stage.y - 16) / 1.56;
    u = clamp(Math.min(uW, hMax / ASP), 170, 440);
  } else {
    const avail = stage.w - leftMargin - 16;
    u = clamp((avail - 40 - 70) / (2 + 2 * ASP * sn + 0.86), 170, 440);
  }
  const wE = u * 0.86;
  let mP = measure(u, kinds.premise, p.facts[0], false);
  let mC = measure(u, kinds.claim, p.claim, true);
  const hA = Math.max(mP.h, mC.h, u * ASP);
  mP = {...mP, h: hA};
  mC = {...mC, h: hA};
  let mE = measure(wE, kinds.external, p.facts[1], false);
  mE = {...mE, h: Math.max(mE.h, wE * 1.3)};
  const bw = stack ? Math.max(u * 1.35, s * 6) : Math.max(u * 0.8, s * 6);
  const mB = measureBox(ctx, {w: bw, s: cs, ks, label: p.supportLabel, kind: kinds.support, show, minH: mE.h * 0.5, floor: 16.3 / S.k});
  // the separated card must stand taller than the box it leans on
  if (mB.h > mE.h * 0.78) mE = {...mE, h: mB.h / 0.78};

  // ---- vertical placement
  const lift = Math.max(36, s * 1.5);
  let Li = Math.max(50, hA * 0.2);
  let Lo = Li + Math.max(66, hA * 0.26);
  // smallest supplied-content size actually used (word-safe fitting may shrink a card's text)
  const used = [mP.bodyFit, mC.bodyFit, mC.attrFit, mE.bodyFit, mB.fit].filter(Boolean).map(f => f.size);
  const minContent = used.length ? Math.min(...used) : s;
  const L = {S, stage, R, Lh, plankT, tableY, stack, minContent, band, bandH, items, extras, key, tagProbe, footProbe, whoProbe, mP, mC, mE, mB, hA, u, wE, bw, lift, look, kinds, Li, Lo};

  // ---- A-frame
  let x0;
  if (!stack) {
    const rowW = u + 2 * hA * sn + u + 150 + wE + mB.h * Math.tan(TH * Math.PI / 180) + bw;
    x0 = stage.x + leftMargin + Math.max(0, (stage.w - leftMargin - 24 - rowW) / 2);
  } else {
    x0 = stage.x + leftMargin;
  }
  const A = aFrame(u, u, hA, x0, tableY, TH);
  L.A = A;
  // wall room above the cards: the loop's arcs flatten rather than leave the frame (dense texts)
  const room = A.apex.y - u * sn - (stack ? 0 : stage.y + 20);
  if (!stack && Lo > room) {
    const k2 = Math.max(0.45, room / Lo);
    Li = Math.max(30, Li * k2); Lo = Math.max(Li + 40, Lo * k2);
    L.Li = Li; L.Lo = Lo;
  }
  L.P = A.p;
  L.C = A.c;

  // ---- external card propped on the claim's right edge
  const cosE = Math.cos(TH_E * Math.PI / 180), sinE = Math.sin(TH_E * Math.PI / 180);
  const cr = {a: A.c.corners.br, b: A.c.corners.tr};
  let footE0;
  if (tableY - mE.h * cosE >= cr.b.y) {
    const q = onEdgeAtY(cr.a, cr.b, tableY - mE.h * cosE);
    footE0 = q.x + mE.h * sinE;
  } else {
    footE0 = cr.b.x + (tableY - cr.b.y) * Math.tan(TH_E * Math.PI / 180);
  }
  L.E0 = leanPose(wE, mE.h, footE0, tableY, -TH_E);
  L.footE0 = footE0;

  // ---- outside support (archive box) and the separated card's final pose
  const tn = Math.tan(TH * Math.PI / 180);
  if (!stack) {
    const boxX = stage.x + stage.w - 24 - bw;
    L.box = {x: boxX, y: tableY, w: bw, h: mB.h};
    // the external card leans right onto the box's top-left corner
    const pivot = boxX - mB.h * tn;
    L.Ef = leanPose(wE, mE.h, pivot - wE, tableY, TH);
    L.shelf = null;
  } else {
    // tall boxes: a wall shelf above the loop carries the box (left) and the card (leaning left onto it)
    const loopTop = A.apex.y - u * sn - Lo - 16;
    const shelfY = loopTop - plankT - 14;
    const boxX = stage.x + 30;
    L.box = {x: boxX, y: shelfY, w: bw, h: mB.h};
    const foot = boxX + bw + mB.h * tn;
    L.Ef = leanPose(wE, mE.h, foot, shelfY, -TH);
    const shelfEnd = Math.max(L.Ef.corners.br.x, L.Ef.corners.tr.x) + 26;
    L.shelf = {x0: stage.x - 10, x1: shelfEnd, y: shelfY};
  }
  L.surfaceF = L.stack ? L.shelf.y : tableY;

  // ---- loop arrows (premise → claim, claim → back to the premise)
  const a = topAt(A.p, 0.74), c = topAt(A.c, 0.26);
  // the return lands left of the premise's (right-aligned) kind label, where the magnifier can hover over it
  const a2f = clamp((mP.labelLeftR - R - 10) / u, 0.12, 0.3);
  const c2 = topAt(A.c, 0.7), a2 = topAt(A.p, a2f);
  L.loopPts1 = arcPts(a, c, Li);
  L.loopPts2 = arcPts(c2, a2, Lo);
  L.a2 = a2;

  // ---- chain arrows (box → external premise → claim)
  if (!stack) {
    const bt = {x: L.box.x + L.box.w * 0.55, y: tableY - mB.h + 2};
    const et = topAt(L.Ef, 0.62);
    L.chainPts1 = arcPts(bt, et, Math.max(40, s * 1.6), 0);
    const es = topAt(L.Ef, 0.16);
    const ct = sideAt(A.c, 'right', 0.2);
    L.chainPts2 = [es, {x: es.x - 30, y: es.y - Li * 0.6}, {x: (es.x + ct.x) / 2, y: Math.min(es.y, ct.y) - Li * 0.55}, {x: ct.x + 30, y: ct.y - 10}, ct];
  } else {
    const bt = {x: L.box.x + L.box.w * 0.62, y: L.shelf.y - mB.h + 2};
    const et = topAt(L.Ef, 0.4);
    L.chainPts1 = arcPts(bt, et, Math.max(30, s * 1.1), 0);
    const es = sideAt(L.Ef, 'right', 0.35);
    const ct = sideAt(A.c, 'right', 0.22);
    L.chainPts2 = [es, {x: es.x + 40, y: es.y + 10}, {x: Math.max(es.x, ct.x) + 50, y: (es.y + ct.y) / 2}, {x: ct.x + 36, y: ct.y - 6}, ct];
  }

  // ---- carry path of the external card: grip on its top edge near the right corner
  L.gripLocal = {x: wE * 0.8, y: -mE.h + 4};
  L.footLift0 = {x: footE0, y: tableY - lift};
  const fUp = L.stack ? {x: footE0, y: L.shelf.y - lift} : null;
  const upright = L.stack ? L.Ef.corners.bl.x : L.Ef.corners.br.x - wE; // upright foot of the final pose
  L.footLiftF = {x: upright, y: L.surfaceF - lift};
  L.carryVia = fUp;

  // ---- lupa: rest at the left of the premise; the grip always stays left of the glass
  const loopTop = Math.min(A.apex.y - u * sn - Lo, ...L.loopPts2.map(q => q.y));
  L.loopTop = loopTop;
  // (tall cards leave little room above them: the magnifier then rests beside the premise, never cut by the frame)
  const restY = A.p.corners.tl.y - R * 1.45;
  const minY = L.stage.y + R * 1.12 + 8;
  L.lensMinY = minY;
  L.lensRest = restY >= minY ? {x: A.p.corners.tl.x - R * 0.25, y: restY} : {x: A.p.corners.tl.x - R * 1.3, y: Math.max(minY, A.p.corners.tl.y - R * 0.2)};
  L.lensHold = {x: a2.x, y: a2.y - R * 0.45};
  return L;
}

/** Pose of the external card for action progress (world). */
function externalPose(L, a) {
  const up = ease.inOutCubic(seg(a, ...W.upright));
  const li = ease.inOutCubic(seg(a, ...W.lift));
  const ca = ease.inOutSine(seg(a, ...W.carry));
  const lo = ease.inOutCubic(seg(a, ...W.lower));
  const le = ease.inOutCubic(seg(a, ...W.lean));
  const wE = L.wE, hE = L.mE.h;
  if (a < W.lift[0]) return {pose: leanPose(wE, hE, L.footE0, L.tableY, -TH_E * (1 - up)), phase: up > 0 ? 'upright' : 'propped'};
  if (a < W.carry[0]) return {pose: freePose(wE, hE, 0, 0, L.footE0, L.tableY - L.lift * li, 0), phase: 'lifted'};
  if (a < W.lower[0]) {
    let f;
    if (L.carryVia) {
      // tall boxes: straight up past the shelf level, then across onto the shelf
      const k = ca < 0.55 ? ease.inOutSine(ca / 0.55) : 1;
      const k2 = ca < 0.55 ? 0 : ease.inOutSine((ca - 0.55) / 0.45);
      const up2 = {x: L.footE0, y: lerp(L.footLift0.y, L.carryVia.y, k)};
      f = {x: lerp(up2.x, L.footLiftF.x, k2), y: lerp(up2.y, L.footLiftF.y, k2)};
    } else {
      f = {x: lerp(L.footLift0.x, L.footLiftF.x, ca), y: lerp(L.footLift0.y, L.footLiftF.y, ca) - Math.sin(Math.PI * ca) * L.lift * 0.6};
    }
    return {pose: freePose(wE, hE, 0, 0, f.x, f.y, 0), phase: 'carried'};
  }
  if (a < W.lean[0]) return {pose: freePose(wE, hE, 0, 0, L.footLiftF.x, lerp(L.footLiftF.y, L.surfaceF, lo), 0), phase: 'lowered'};
  const ang = (L.stack ? -TH : TH) * le;
  return {pose: leanPose(wE, hE, L.footLiftF.x, L.surfaceF, ang), phase: le >= 1 ? 'on-box' : 'leaning'};
}

function lupaPlan(L, a) {
  // lens: rest → catches the returning arrow's tip → follows it down to where it lands
  const p2 = ease.inOutSine(seg(a, ...W.arrow2));
  const go = ease.inOutCubic(seg(a, ...W.lensGo));
  const tipAt = q => {
    const pt = L.arrow2.at(q);
    return {x: pt.x, y: Math.max(L.lensMinY, pt.y - L.R * 0.45)};
  };
  const pCatch = ease.inOutSine(seg(W.lensGo[1], ...W.arrow2));
  let c;
  if (a <= W.lensGo[1]) c = mix(L.lensRest, tipAt(pCatch), go);
  else c = tipAt(Math.max(pCatch, p2));
  // after the landing has been shown, the magnifier goes back to its free spot (never parked on a card)
  const back = ease.inOutCubic(seg(a, ...W.lensBack));
  if (back > 0) c = mix(tipAt(1), L.lensRest, back);
  return {c, p2, back};
}


/** Arms, props and editorial placement. */
function finish(ctx, L) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const C = rcColors(ctx);
  const {S, stage} = L;
  const all = ctx.show('all');
  const show = ctx.show('key');

  // ---- art
  L.cardP = cardArt(ctx, {name: 'cardP', m: L.mP, kind: 'premise', color: C.premise, idKey: 'cp', labelRight: true});
  L.cardC = cardArt(ctx, {name: 'cardC', m: L.mC, kind: 'claim', color: C.claim, look: L.look, idKey: 'cc'});
  L.cardE = cardArt(ctx, {name: 'cardE', m: L.mE, kind: 'external', color: C.external, idKey: 'ce'});
  L.boxNode = boxArt(ctx, {name: 'box', m: L.mB});
  L.arrow1 = ribbonArrow(ctx, {name: 'loop1', pts: L.loopPts1, color: C.loop, width: Math.max(9, S.s * 0.38), travel: true});
  L.arrow2 = ribbonArrow(ctx, {name: 'loop2', pts: L.loopPts2, color: C.loop, width: Math.max(9, S.s * 0.38), travel: true});
  L.chain1 = ribbonArrow(ctx, {name: 'chain1', pts: L.chainPts1, color: C.chain, width: Math.max(9, S.s * 0.38), travel: true});
  L.chain2 = ribbonArrow(ctx, {name: 'chain2', pts: L.chainPts2, color: C.chain, width: Math.max(9, S.s * 0.38), travel: true});
  // real enlarged copy for the magnifier glass (same world coordinates, text-free)
  L.copyA1 = ribbonArrow(ctx, {name: 'lc-a1', pts: L.loopPts1, color: C.loop, width: Math.max(9, S.s * 0.38), travel: true});
  L.copyA2 = ribbonArrow(ctx, {name: 'lc-a2', pts: L.loopPts2, color: C.loop, width: Math.max(9, S.s * 0.38), travel: true});
  const copy = g(null,
    h('rect', {x: -4000, y: -4000, width: 8000, height: 8000, fill: C.wall}),
    g({transform: L.P.transform}, cardArt(ctx, {m: L.mP, kind: 'premise', color: C.premise, textless: true, named: false, idKey: 'lcp', labelRight: true})),
    g({transform: L.C.transform}, cardArt(ctx, {m: L.mC, kind: 'claim', color: C.claim, textless: true, named: false, look: L.look, idKey: 'lcc'})),
    g({name: 'lc-E', transform: L.E0.transform}, cardArt(ctx, {m: L.mE, kind: 'external', color: C.external, textless: true, named: false, idKey: 'lce'})),
    L.copyA1.node, L.copyA2.node);
  L.lupa = lupaArt(ctx, {name: 'lupa', R: L.R, handle: L.Lh, copy, zoom: 1.7, fill: C.wall});

  // ---- arms (the analyst stands off-frame and leans in: each shoulder slides along a fixed entry
  // direction behind its hand, so the arm stays almost straight and always enters from the frame edge)
  const look = actorLook(ctx, p.analyst, 0);
  const HAND = 24 * 1.3;
  const unit = (x, y) => { const n = Math.hypot(x, y); return {x: x / n, y: y / n}; };
  L.dirL = unit(-1, 0.36);
  L.dirR = unit(1, L.stack ? 0.1 : -0.1);
  L.angL = Math.atan2(L.dirL.y, L.dirL.x) * 180 / Math.PI;
  const samplesL = [];
  for (let i = 0; i <= 24; i++) {
    const a = W.lensGo[0] + (W.arrow2[1] - W.lensGo[0]) * (i / 24);
    samplesL.push(lupaPlan(L, a).c);
  }
  samplesL.push(L.lensRest);
  const gripOf = c => ({x: c.x + L.dirL.x * (L.R + L.Lh * 0.62), y: c.y + L.dirL.y * (L.R + L.Lh * 0.62)});
  const KL = Math.max(...samplesL.map(c => (gripOf(c).x - (stage.x - 70)) / -L.dirL.x));
  L.KL = KL;
  const lenL = KL / 0.95;
  L.armL = topArm(ctx, {name: 'armL', skin: look.skin, sleeve: look.outfit, handed: 'left', width: 44, upper: lenL * 0.5, lower: lenL * 0.5 - HAND});
  // right arm: the hand enters from off-frame right above the box, takes the card, and leaves again
  const grip0 = L.E0.toWorld(L.gripLocal);
  const gripF = L.Ef.toWorld(L.gripLocal);
  L.restR0 = {x: stage.x + stage.w + 70, y: grip0.y - 40};
  L.restR1 = {x: stage.x + stage.w + 70, y: gripF.y - 50};
  const sampR = [grip0, gripF];
  for (let i = 0; i <= 30; i++) {
    const a = W.upright[0] + (W.lean[1] - W.upright[0]) * (i / 30);
    sampR.push(externalPose(L, a).pose.toWorld(L.gripLocal));
  }
  const KR = Math.max(...sampR.map(q => (stage.x + stage.w + 70 - q.x) / L.dirR.x));
  L.KR = KR;
  const lenR = KR / 0.95;
  L.armR = topArm(ctx, {name: 'armR', skin: look.skin, sleeve: look.outfit, handed: 'right', width: 44, upper: lenR * 0.5, lower: lenR * 0.5 - HAND});
  L.shoulderOf = (side, q) => (side === 'L' ? {x: q.x + L.dirL.x * L.KL, y: q.y + L.dirL.y * L.KL} : {x: q.x + L.dirR.x * L.KR, y: q.y + L.dirR.y * L.KR});

  // ---- obstacles for text placement (everything that is drawn or moves)
  L.boxC = poseBox(L.C);
  const obst = [
    poseBox(L.P), L.boxC, poseBox(L.E0), poseBox(L.Ef),
    {x: L.box.x - 6, y: L.box.y - L.mB.h - 4, w: L.box.w + 12, h: L.mB.h + 4},
    inflate(L.arrow1.bbox, 16), inflate(L.arrow2.bbox, 16),
  ];
  if (p.finalState === 'external-set-apart') obst.push(inflate(L.chain1.bbox, 14), inflate(L.chain2.bbox, 14));
  for (let i = 0; i <= 20; i++) {
    const a = W.upright[0] + (W.lean[1] - W.upright[0]) * (i / 20);
    obst.push(poseBox(externalPose(L, a).pose));
  }
  samplesL.forEach(c => obst.push({x: c.x - L.R - 8, y: c.y - L.R - 8, w: 2 * L.R + 16, h: 2 * L.R + 16}));
  const armBoxes = (arm, side, pts, bend) => pts.flatMap(q => {
    const sh = L.shoulderOf(side, q);
    const ps = arm.pose(sh, q, bend);
    const el = {x: ps.nodes[`${arm === L.armL ? 'armL' : 'armR'}-upper`].x2, y: ps.nodes[`${arm === L.armL ? 'armL' : 'armR'}-upper`].y2};
    return [...segBoxes(sh, el, 56), ...segBoxes(el, ps.hand, 56), {x: ps.hand.x - 40, y: ps.hand.y - 40, w: 80, h: 80}];
  });
  obst.push(...armBoxes(L.armL, 'L', samplesL.map(gripOf), -1));
  obst.push(...armBoxes(L.armR, 'R', [...sampR, L.restR0, L.restR1], 1));
  if (L.shelf) obst.push({x: L.shelf.x0, y: L.shelf.y - 6, w: L.shelf.x1 - L.shelf.x0, h: L.plankT + 40});
  obst.push({x: stage.x, y: L.tableY - 4, w: stage.w, h: L.plankT + 8});
  L.obst = obst;
  const wall = {x: stage.x + 12, y: stage.y + 12, w: stage.w - 24, h: L.tableY - stage.y - 20};

  // ---- rule plaque on the wall (key content)
  L.plaque = null;
  L.placeFail = [];
  if (p.rules.length && !L.extras.includes('plaque')) {
    const tries = (L.stack ? [0.56, 0.48, 0.4, 0.33, 0.28] : [0.34, 0.3, 0.26, 0.22]).map(f => Math.max(260, stage.w * f));
    for (const pw of tries) {
      const m = measurePlaque(ctx, {w: pw, s: S.cs, ks: S.ks, head: t.ruleHead, text: p.rules[0], show, floor: 16.3 / S.k});
      const size = {w: m.w + 14, h: m.h + 37};
      const prefs = L.stack
        ? [{x: stage.x + size.w / 2 + 20, y: stage.y + size.h / 2 + 16}, {x: stage.x + stage.w - size.w / 2 - 20, y: stage.y + size.h / 2 + 16}]
        : [{x: stage.x + stage.w - size.w / 2 - 24, y: stage.y + size.h / 2 + 16}, {x: stage.x + stage.w / 2, y: stage.y + size.h / 2 + 16}];
      const at = findSpot(size, prefs, obst, wall, {pad: 12, maxR: 900});
      if (at) {
        L.plaque = plaqueArt(ctx, {name: 'plaque', m, x: at.x + 7, y: at.y + 30});
        obst.push(L.plaque.box);
        break;
      }
    }
    if (!L.plaque) L.placeFail.push('plaque');
  }

  // ---- issue note pinned beside the claim, with a leader to the claim's header
  L.issue = null;
  if (all && p.issues.length && !L.extras.includes('issue')) {
    // the leader lands on the claim's top-right corner (clear of the loop's start)
    const target = {x: L.C.corners.tr.x - 6, y: L.C.corners.tr.y + 2};
    const txt = `${t.issue}: ${p.issues[0]}`;
    const cBox = L.boxC;
    for (const mw of [Math.min(520, stage.w * 0.34), Math.min(420, stage.w * 0.3), 340, 280]) {
      const sz = noteSize(ctx, txt, mw, S.cs, 5);
      if (sz.truncated) continue;
      const prefs = [{x: target.x + sz.w * 0.55, y: target.y - L.Li - sz.h}, {x: target.x + sz.w * 0.2, y: target.y - L.Lo - sz.h * 0.6}, {x: stage.x + stage.w / 2, y: stage.y + sz.h}];
      let at = findSpot(sz, prefs, obst, wall, {pad: 12, maxR: 900, leader: {target, allow: [cBox]}});
      let lead = target;
      if (!at && L.stack) { at = findSpot(sz, prefs, obst, wall, {pad: 12, maxR: 1400}); lead = null; }
      if (at) {
        L.issue = noteArt(ctx, {name: 'issue', text: txt, x: at.x, y: at.y + 4, maxWidth: mw, size: S.cs, maxLines: 5, target: lead});
        obst.push(L.issue.box);
        break;
      }
    }
    if (!L.issue) L.placeFail.push('issue');
  }

  // ---- bottom band (key, tag, foot, analyst)
  const bandY = L.tableY + L.plankT + 12;
  const pos = Object.fromEntries(L.items.map((it, i) => [it.id, {x: L.band.pos[i].x, y: bandY + L.band.pos[i].y, it}]));
  if (pos.key) L.keyNode = keyArt(ctx, 'key', L.key, pos.key.x + S.cs * 0.6, pos.key.y + S.cs * 0.6);
  if (pos.tag) L.tag = tagChip(ctx, p.finalState === 'external-set-apart' ? t.setApart : t.loopOnly, {x: pos.tag.x, y: pos.tag.y, size: S.cs, maxWidth: L.tagProbe.box.w + 2, name: 'state-tag', color: C.ink});
  if (pos.plaque) L.plaque = plaqueArt(ctx, {name: 'plaque', m: pos.plaque.it.m, x: pos.plaque.x + 7, y: pos.plaque.y + 30});
  if (pos.issue) L.issue = noteArt(ctx, {name: 'issue', text: pos.issue.it.text, x: pos.issue.x, y: pos.issue.y + 4, maxWidth: pos.issue.it.mw, size: S.cs, maxLines: 5});
  if (pos.who) L.who = chip(ctx, pos.who.it.text, {x: pos.who.x, y: pos.who.y, maxWidth: Math.min(L.stage.w - 40, 460), size: S.cs, minSize: S.cs, maxLines: 5, name: "who"});
  if (pos.foot) L.foot = footArt(ctx, {name: 'foot', text: pos.foot.it.text, x: pos.foot.x, y: pos.foot.y, size: S.cs, maxWidth: L.footProbe.box.w + 2});
  // analyst caption on the wall, near where the arms enter (left) — never on a card or a prop's path
  if (!pos.who) L.who = null;
  if (L.whoProbe && !L.extras.includes('who')) {
    for (const [mw, ml] of [[360, 2], [300, 3], [240, 4]]) {
      const c0 = chip(ctx, L.whoProbe.text, {x: 0, y: 0, maxWidth: mw, size: S.cs, minSize: S.cs, maxLines: ml});
      if (c0.fit.truncated) continue;
      const prefs = [{x: stage.x + c0.box.w / 2 + 16, y: L.tableY - c0.box.h / 2 - 14}, {x: stage.x + stage.w - c0.box.w / 2 - 16, y: L.tableY - c0.box.h / 2 - 14}];
      const at = findSpot(c0.box, prefs, obst, wall, {pad: 10, maxR: 500});
      if (at) {
        L.who = chip(ctx, L.whoProbe.text, {x: at.x, y: at.y, maxWidth: mw, size: S.cs, minSize: S.cs, maxLines: ml, name: 'who'});
        obst.push(L.who.box);
        break;
      }
    }
    if (!L.who) L.placeFail.push('who');
  }

  // ---- editorial annotations (final hold)
  L.notes = [];
  if (all) {
    p.annotations.forEach((an, i) => {
      if (L.extras.includes(`note${i}`)) return;
      const tg = annotationTarget(L, an.target);
      let n = null;
      for (const mw of [Math.min(460, stage.w * 0.3), 360, 280, 220]) {
        const sz = noteSize(ctx, an.text, mw, S.cs, 6);
        if (sz.truncated) continue;
        const at = findSpot(sz, [{x: tg.x, y: tg.y - sz.h}, {x: tg.x, y: tg.y + sz.h}, {x: stage.x + stage.w / 2, y: stage.y + sz.h}], obst, wall, {pad: 8, maxR: 1400, leader: {target: tg, allow: []}});
        if (at) { n = noteArt(ctx, {name: `note${i}`, text: an.text, x: at.x, y: at.y + 4, maxWidth: mw, size: S.cs, maxLines: 6, target: tg}); break; }
      }
      if (n) { obst.push(n.box); L.notes.push(n); } else L.placeFail.push(`note${i}`);
    });
  }
  // annotations that found no wall space sit in the band (their target named in the text by the author)
  L.items.forEach((it, i) => {
    if (!/^note\d$/.test(it.id)) return;
    const q = {x: L.band.pos[i].x, y: bandY + L.band.pos[i].y};
    L.notes.push(noteArt(ctx, {name: it.id, text: it.text, x: q.x, y: q.y + 4, maxWidth: it.mw, size: S.cs, maxLines: 6}));
  });
  return L;
}

function annotationTarget(L, target) {
  switch (target) {
    case 'claim': return topAt(L.C, 0.5);
    case 'premise': return topAt(L.P, 0.5);
    case 'external': return topAt(L.Ef, 0.5);
    case 'support': return {x: L.box.x + L.box.w / 2, y: L.box.y - L.mB.h};
    case 'lupa': return {x: L.lensHold.x, y: L.lensHold.y - L.R};
    default: return L.arrow2.at(0.5);
  }
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1500]},
  layout(ctx) {
    const k = px1080(ctx);
    const run = extras => {
      let s = (ctx.view.shape === "portrait" ? 29 : 25) / k;
      let L;
      for (let it = 0; it < 14; it++) {
        L = compose(ctx, s, extras);
        if (L.minContent < L.S.cs - 0.01) L = compose(ctx, s, extras, L.minContent);
        const topOk = L.stack ? L.box.y - L.mB.h - L.lift - L.mE.h > L.stage.y + 16 : L.loopTop > L.stage.y + 16;
        const widthOk = L.stack
          ? Math.max(L.E0.corners.br.x, L.E0.corners.tr.x) < L.stage.x + L.stage.w - 8 && L.shelf.x1 < L.footE0 - 20
          : L.Ef.corners.bl.x - Math.max(L.C.corners.br.x, L.C.corners.tr.x) > 120;
        if ((topOk && widthOk) || s * k <= 16.6) break;
        s = Math.max(16.5 / k, s * 0.95);
      }
      return finish(ctx, L);
    };
    // first choice: every note on the wall, at the largest text size where that works (down to ~19.5 px)
    for (let sz = (ctx.view.shape === 'portrait' ? 29 : 25) / k; sz * k >= 19.4; sz *= 0.95) for (const ex of [[], ['who']]) {
      const c = compose(ctx, sz, ex);
      const topOk = c.stack ? c.box.y - c.mB.h - c.lift - c.mE.h > c.stage.y + 16 : c.loopTop > c.stage.y + 16;
      const widthOk = c.stack
        ? Math.max(c.E0.corners.br.x, c.E0.corners.tr.x) < c.stage.x + c.stage.w - 8 && c.shelf.x1 < c.footE0 - 20
        : c.Ef.corners.bl.x - Math.max(c.C.corners.br.x, c.C.corners.tr.x) > 120;
      if (!topOk || !widthOk) continue;
      const f = finish(ctx, c);
      if (!f.placeFail.length) return f;
    }
    // otherwise notes without free wall space move into the band; moving one can shrink the wall, so repeat
    let moved = [];
    let L = run(moved);
    for (let pass = 0; pass < 3; pass++) {
      const more = L.placeFail.filter(f => /^(plaque|issue|who|note\d)$/.test(f) && !moved.includes(f));
      if (!more.length) break;
      moved = [...moved, ...more];
      L = run(moved);
    }
    return L;
  },
  build(ctx, L) {
    const C = rcColors(ctx);
    const planks = [{x0: L.stage.x - 10, x1: L.stage.x + L.stage.w + 10, y: L.tableY, t: L.plankT, kind: 'table'}];
    if (L.shelf) planks.push({x0: L.shelf.x0, x1: L.shelf.x1, y: L.shelf.y, t: L.plankT * 0.8, kind: 'shelf'});
    const stage = stageArt(ctx, {prefix: 'stage', box: L.stage, planks, floorY: L.tableY + L.plankT + 60, railY: L.stack ? null : L.stage.y + 8});
    return g(null,
      stage.back,
      g({'clip-path': stage.clip},
        L.plaque && L.plaque.node,
        L.issue && L.issue.node,
        contactShadow('shP', L.P.corners.bl.x, L.P.corners.br.x, L.tableY),
        contactShadow('shC', L.C.corners.bl.x, L.C.corners.br.x, L.tableY),
        contactShadow('shB', L.box.x, L.box.x + L.box.w, L.box.y),
        h('ellipse', {name: 'shE', cx: 0, cy: 0, rx: 10, ry: 7, fill: '#000000', opacity: 0.18}),
        g({transform: T(L.box.x, L.box.y)}, L.boxNode),
        g({transform: L.P.transform}, L.cardP),
        g({transform: L.C.transform}, L.cardC),
        g({name: 'E', transform: L.E0.transform}, L.cardE),
        L.arrow1.node, L.arrow2.node, L.chain1.node, L.chain2.node,
        L.armL.arm, L.armL.palm, L.lupa.view, L.lupa.prop, L.armL.thumb,
        L.armR.arm, L.armR.palm, L.armR.thumb,
      ),
      stage.frame,
      L.keyNode && L.keyNode.node,
      L.tag && L.tag.node,
      L.foot && L.foot.node,
      L.who && L.who.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const done = p.actionProgress >= 1;
    const capU = lerp(BEATS.action[0], W.release[1], p.actionProgress);
    const a = Math.min(u, capU);
    const setApart = p.finalState === 'external-set-apart';
    const nodes = {};

    // --- loop arrows
    const p1 = ease.inOutSine(seg(a, ...W.arrow1));
    const {c: lens, p2, back} = lupaPlan(L, a);
    Object.assign(nodes, L.arrow1.frame(p1), L.arrow2.frame(p2), L.copyA1.frame(p1), L.copyA2.frame(p2));

    // --- magnifier (always held by the left hand)
    const lf = L.lupa.frame(lens, L.angL, r(ease.inOutSine(seg(a, ...W.view)) * (1 - ease.inOutSine(seg(a, ...W.viewOut))), 3));
    Object.assign(nodes, lf.nodes);
    const pl = L.armL.pose(L.shoulderOf('L', lf.grip), lf.grip, -1);
    Object.assign(nodes, pl.nodes);

    // --- external card (moved only when the supplied final state says so)
    const ex = setApart ? externalPose(L, a) : {pose: L.E0, phase: 'propped'};
    const E = ex.pose;
    nodes.E = {transform: E.transform};
    nodes['lc-E'] = {transform: E.transform};
    const eb = poseBox(E);
    const onSurface = ex.phase === 'propped' || ex.phase === 'upright' || ex.phase === 'on-box' || ex.phase === 'leaning';
    const surfY = ex.phase === 'on-box' || ex.phase === 'leaning' ? L.surfaceF : L.tableY;
    nodes.shE = {cx: r(eb.x + eb.w / 2), cy: r(surfY + 3), rx: r(eb.w / 2 + 8), opacity: onSurface ? 0.18 : r(0.18 * 0.4, 3)};
    const gripE = E.toWorld(L.gripLocal);

    // --- right hand: rest → grip (holds while the card moves) → back to rest
    const reach = ease.inOutSine(seg(a, ...W.reachR));
    const rel = ease.inOutSine(seg(a, ...W.release));
    let handR = L.restR0;
    let holding = false;
    if (setApart) {
      if (a < W.reachR[1]) handR = mix(L.restR0, gripE, reach);
      else if (a < W.release[0]) { handR = gripE; holding = true; }
      else {
        const lift = {x: gripE.x + 20, y: gripE.y - 40};
        handR = rel < 0.25 ? mix(gripE, lift, rel / 0.25) : mix(lift, L.restR1, (rel - 0.25) / 0.75);
      }
    }
    const pr = L.armR.pose(L.shoulderOf('R', handR), handR, 1);
    Object.assign(nodes, pr.nodes);

    // --- chain arrows (only after the card rests on the box)
    const q1 = setApart ? ease.inOutSine(seg(a, ...W.arrowBE)) : 0;
    const q2 = setApart ? ease.inOutSine(seg(a, ...W.arrowEC)) : 0;
    Object.assign(nodes, L.chain1.frame(q1), L.chain2.frame(q2));

    // --- editorial layer
    if (L.plaque) nodes.plaque = {opacity: r(seg(u, ...W.chips), 3)};
    if (L.issue) nodes.issue = {opacity: done ? r(seg(u, ...W.issue), 3) : 0};
    if (L.keyNode) nodes.key = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    if (L.tag) nodes['state-tag'] = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    if (L.foot) nodes.foot = {opacity: done ? r(seg(u, ...W.foot), 3) : 0};
    if (L.who) nodes.who = {opacity: r(seg(u, ...W.chips), 3)};
    L.notes.forEach((n, i) => { nodes[`note${i}`] = {opacity: done ? r(seg(u, ...W.notes), 3) : 0}; });

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const eCenter = E.toWorld({x: L.wE / 2, y: -L.mE.h / 2});
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      layout: L.stack ? 'stack' : 'row',
      loopDrawn: [r(p1, 3), r(p2, 3)],
      loopClosed: p2 >= 1,
      returnLanding: P2(L.a2),
      returnEnd: P2(L.arrow2.end),
      returnOnPremise: r(segDist(L.arrow2.end, L.P.corners.tl, L.P.corners.tr), 2),
      firstEndOnClaim: r(segDist(L.arrow1.end, L.C.corners.tl, L.C.corners.tr), 2),
      firstStartOnPremise: r(segDist(L.arrow1.start, L.P.corners.tl, L.P.corners.tr), 2),
      returnStartOnClaim: r(segDist(L.arrow2.start, L.C.corners.tl, L.C.corners.tr), 2),
      premiseTop: [P2(L.P.corners.tl), P2(L.P.corners.tr)],
      apexTouch: r(dist(L.P.corners.tr, L.C.corners.tl), 2),
      lupa: P2(lens),
      lupaGrip: P2(lf.grip),
      handL: P2(pl.hand),
      lupaOverReturn: dist(lens, L.lensHold) < 2,
      lupaParked: back >= 1 && dist(lens, L.lensRest) < 1,
      lupaBox: {x: r(lens.x - L.R - 10), y: r(lens.y - L.R - 10), w: r(2 * L.R + 20), h: r(2 * L.R + 20)},
      cardBoxes: [poseBox(L.P), poseBox(L.C), eb].map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
      E: P2(eCenter),
      eAngle: r(E.angle, 2),
      ePhase: ex.phase,
      eSupport: ex.phase === 'on-box' ? 'box' : ex.phase === 'propped' ? 'claim' : 'moving',
      eBoxContact: setApart && ex.phase === 'on-box' ? r(boxContact(L, E), 2) : null,
      eMovedBeforeLoopClosed: setApart && a < W.arrow2[1] && ex.phase !== 'propped',
      gripE: P2(gripE),
      handR: P2(pr.hand),
      holdingE: holding,
      chainDrawn: [r(q1, 3), r(q2, 3)],
      chainBeforeRest: (q1 > 0 || q2 > 0) && ex.phase !== 'on-box',
      allReached: pl.reached && pr.reached,
      reach: {left: pl.reached, right: pr.reached},
      actionCapped: p.actionProgress < 1 && u > capU,
      placeFail: L.placeFail,
      inBand: L.extras,
      textPx: textPx(L),
    };
    return {nodes, semantic};
  },
};

/** Distance from point q to segment a–b. */
function segDist(q, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(q.x - a.x - dx * t, q.y - a.y - dy * t);
}

/** Distance between the separated card's leaning edge and the box's top corner. */
function boxContact(L, E) {
  const corner = L.stack ? {x: L.box.x + L.box.w, y: L.box.y - L.mB.h} : {x: L.box.x, y: L.box.y - L.mB.h};
  const a = L.stack ? E.corners.bl : E.corners.br, b = L.stack ? E.corners.tl : E.corners.tr;
  const q = onEdgeAtY(a, b, corner.y);
  return Math.abs(q.x - corner.x);
}

/** Rendered text sizes at 1080p (content, key labels, generic captions). */
function textPx(L) {
  const k = L.S.k;
  return {content: r(L.S.s * k, 2), kind: r(L.S.ks * k, 2), attribution: r(L.S.as * k, 2), caption: r(L.S.cs * k, 2)};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-07-story',
    title: 'Circular reasoning — a support arrow returns to its own premise and an external premise is set apart',
    titleEs: 'Razonamiento circular — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Razonamiento circular',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a table: a claim card (attributed to a fictional speaker) and its premise card lean on each other. A support arrow runs from the premise onto the claim and a second one runs from the claim back down onto the same premise, closing a loop, while the analyst’s magnifier follows it. The analyst’s other hand then lifts the external premise out of the pile and leans it on an archive box (the outside support, as supplied); only then do the chain arrows box → premise → claim draw. Structures are shown as supplied; nothing is marked valid or invalid.',
    tags: ['reasoning', 'circular reasoning', 'claim', 'premise', 'support', 'loop', 'external premise', 'magnifier', 'hands', 'cards'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/razonamiento-circular.js', 'src/primitives/desk.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
