/**
 * LAW-0107 — Razonamiento circular · contrast
 *
 * Storyboard (two complete side-view tables; side by side in wide and square
 * boxes, one above the other in tall boxes; same scale, same timing). Dense
 * square/long layouts move the scenario captions (and, if needed, the rule
 * plaque) into the notes under the lanes, and may print the identical claim /
 * premise texts once in a shared strip (lane cards then keep their kind labels):
 *  0.00–0.17 base      Both lanes are identical: the same claim card
 *                      (attributed to the same fictional speaker) and the same
 *                      premise card stand upright in wooden chocks; an empty
 *                      spot on the table at the premise's left. Only neutral
 *                      A / B badges.
 *  0.17–0.40 change    The ONE supplied difference — what the premise rests
 *                      on — is introduced locally: in B an archive box (the
 *                      outside support, label as supplied) slides into the
 *                      empty spot; then a cord is tied from the premise's
 *                      top corner to what it rests on: in A to the claim, in B
 *                      to the box. The scenario labels and captions appear.
 *  0.40–0.77 parallel  In both lanes the chocks slide away and the cards lean
 *                      along their cords: A → the premise and the claim lean on
 *                      each other (an A-frame); B → the premise leans on the
 *                      box and the claim leans on the premise (a chain). Then
 *                      the support arrows draw with the same timing: A → the
 *                      premise → claim arrow and the arrow that comes back from
 *                      the claim to the same premise (a loop); B → box →
 *                      premise and premise → claim (the chain ends on the box).
 *  0.77–1.00 guide     A ring marks the changed detail in each lane — where the
 *                      second arrow lands on the premise — and a bracket joins
 *                      the two rings with the supplied changed fact. Neutral
 *                      note: no winner, no score, no conclusion.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/reasoning/LAW-0107
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, dist} from '../../core/geometry.js';
import {str, list, party, contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {
  RC_STRINGS, RC_DEFAULTS, claimField, rulesField, issuesField, assumptionsField, supportLabelField,
  rcColors, px1080, measureCard, cardArt, measureBox, boxArt, ribbonArrow, arcPts, stageArt, measurePlaque, plaqueArt,
  tagChip, measureKey, keyArt, loopGlyph, chainGlyph, noteArt, noteSize, footArt, speakerLook, attributionText,
  leanPose, leanLeftOnto, topAt, poseBox, wordSafeSize, INK,
} from './kits/razonamiento-circular.js';

const ID = 'LAW-0107';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  box: [0.18, 0.29], cord: [0.28, 0.37], labels: [0.3, 0.36],
  chocks: [0.41, 0.46], lean: [0.46, 0.56], cordOut: [0.55, 0.59], arrow1: [0.57, 0.66], arrow2: [0.66, 0.76],
  rings: [0.77, 0.8], guide: [0.785, 0.83], note: [0.8, 0.84], foot: [0.8, 0.845], issue: [0.81, 0.85],
};
const TH = 6;
const GUTTER = 40;
const GUIDE_RUN = 44;
const M = 12;

const STRINGS = {
  en: {...RC_STRINGS.en, changedFact: 'Changed fact', sameIn: 'Same in A and B', neutralDefault: 'Two structures of support as supplied — no winner, no score, no conclusion'},
  es: {...RC_STRINGS.es, changedFact: 'Hecho cambiado', sameIn: 'Igual en A y B', neutralDefault: 'Dos estructuras de apoyo según lo aportado — sin ganador, sin puntuación, sin conclusión'},
};

const sceneSchema = {
  speaker: party,
  claim: claimField,
  facts: list('The premise offered for the claim — identical in A and B (fictional)', str('Premise', 110), 1, 1),
  supportLabel: supportLabelField,
  rules: rulesField,
  issues: issuesField,
  assumptions: assumptionsField,
  ...contrastFields(),
};

const defaultParams = {
  speaker: RC_DEFAULTS.speaker,
  claim: RC_DEFAULTS.claim,
  facts: ['The ledger’s totals are right'],
  supportLabel: RC_DEFAULTS.supportLabel,
  rules: RC_DEFAULTS.rules,
  issues: ['Where does each premise lean for its support?'],
  assumptions: ['Both scenes use the same fictional facts'],
  scenarioA: {label: 'Cycle of claims', caption: 'The premise rests on the claim itself'},
  scenarioB: {label: 'Independent support', caption: 'The premise rests on bank statement B-7'},
  changedFact: 'What the premise rests on: the claim itself (A) or an outside record (B)',
  sharedFacts: ['Same claim, same speaker, same premise text'],
  comparisonLabels: {guide: 'Only this changes', neutral: 'Two structures of support as supplied — no winner, no score, no conclusion'},
};

function sizes(ctx, s) {
  const k = px1080(ctx);
  return {k, s, ks: Math.min(s, Math.max(16.5 / k, s * 0.66)), as: Math.min(s, Math.max(20 / k, s * 0.82)), cs: Math.min(s, Math.max(20 / k, s * 0.8))};
}

/** Lane header: letter badge + label (bold) + caption, wrapped (never ellipsised). */
function headerArt(ctx, o) {
  const th = ctx.theme;
  const R = o.size * 0.95;
  const parts = [h('circle', {cx: r(o.x + R), cy: r(o.y + R), r: r(R), fill: o.color, stroke: INK, 'stroke-width': 2.5})];
  if (ctx.show('key')) parts.push(textBlock(ctx.fit(o.letter, {maxWidth: R * 2, size: o.size * 1.05, maxLines: 1, weight: 800}), {x: o.x + R, y: o.y + R - o.size * 0.55, anchor: 'middle', fill: '#ffffff'}));
  let lab = null, cap = null;
  let hh = R * 2;
  if (ctx.show('key') && o.label) {
    const lsz = wordSafeSize(ctx, o.label, o.w - R * 2 - 16, o.size, 800, 'sans', o.floor ?? o.size);
    lab = ctx.fit(o.label, {maxWidth: o.w - R * 2 - 16, size: lsz, minSize: lsz, maxLines: 8, weight: 800});
    hh = Math.max(hh, lab.height);
  }
  if (ctx.show('all') && o.caption) {
    const csz = wordSafeSize(ctx, o.caption, o.w - R * 2 - 16, o.csize, 500, 'sans', o.floor ?? o.csize);
    cap = ctx.fit(o.caption, {maxWidth: o.w - R * 2 - 16, size: csz, minSize: csz, maxLines: 10, weight: 500});
    hh = Math.max(hh, (lab ? lab.height + 6 : 0) + cap.height);
  }
  const labNode = lab ? textBlock(lab, {x: o.x + R * 2 + 16, y: o.y, fill: th.fg}) : null;
  const capNode = cap ? textBlock(cap, {x: o.x + R * 2 + 16, y: o.y + (lab ? lab.height + 6 : 0), fill: th.fgSoft}) : null;
  return {badge: g({name: `${o.name}-badge`}, parts), labels: g({name: `${o.name}-labels`, opacity: 0}, labNode, capNode), h: hh};
}

/** Geometry of one lane (local coordinates, origin top-left), for the given sizes. */
function laneGeom(ctx, S, o) {
  const {u, hA, bw, mB, lift0} = o;
  const sn = Math.sin(TH * Math.PI / 180), tn = Math.tan(TH * Math.PI / 180);
  const g0 = 2 * hA * sn;
  // loop room: the arcs span card tops about one card width apart, so tall narrow cards don't need more
  const hL = Math.min(hA, u * 1.5);
  const Li = o.headBeside ? Math.max(30, hL * 0.16) : Math.max(44, hL * 0.2);
  const Lo = Li + (o.headBeside ? Math.max(40, hL * 0.2) : Math.max(46, hL * 0.22));
  // (stacked lanes keep a clear strip above the arrows for the guide bracket's run to the gutter)
  const top = o.headBeside ? Lo + u * sn + 16 + GUIDE_RUN : o.headH + 16 + Lo + u * sn + 12;
  const T0 = top + hA; // table top
  const m = 26;
  const boxX = m, boxR = m + bw;
  const footP = boxR + mB.h * tn;
  const footC = footP + u + g0;
  const w = footC + u + m + 10;
  const h0 = T0 + o.plankT + 16;
  return {u, hA, bw, g0, Li, Lo, T0, boxX, boxR, footP, footC, w, h: h0, mB, lift0};
}

function lanePoses(L, lane, variant, le) {
  const {u, hA, T0, footP, footC} = lane;
  if (variant === 'A') {
    const P = leanPose(u, hA, footP, T0, TH * le);
    const C = leanPose(u, hA, footC, T0, -TH * le);
    return {P, C};
  }
  const P = leanPose(u, hA, footP, T0, -TH * le);
  const psi = lane.psi;
  const C = leanPose(u, hA, footC, T0, -psi * le);
  return {P, C, psi};
}

function compose(ctx, s0, arrangement, uScale = 1, opt = {}) {
  const {shared = false, capFoot = false, barGap = 30} = opt;
  // side by side: the rule plaque always joins the notes under the lanes, so the guide bracket above the lanes
  // never runs along it (the rule is not wired to either lane)
  const plaqueFoot = opt.plaqueFoot || arrangement === 'row';
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = sizes(ctx, s0);
  const {s, ks, as, cs} = S;
  const show = ctx.show('key');
  const all = ctx.show('all');
  const stage = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const row = arrangement === 'row';
  const side = arrangement === 'colside'; // square: lanes stacked on the left, notes in a column on the right
  let gap = row ? 40 : 34;
  // stacked: a gutter at the left keeps the guide bracket outside both lane frames
  const laneW = row ? (stage.w - gap) / 2 : side ? stage.w * (shared ? 0.5 : 0.62) : stage.w - GUTTER;
  const colAspect = ctx.view.shape === 'portrait' ? 0.95 : 0.72;
  // card width from the lane width (box + premise + gap + claim); narrowed until the lane really fits
  const look = speakerLook(ctx, p.speaker);
  const floor = 16.3 / S.k;
  // cards never narrower than their longest word at the floor size (no mid-word breaks)
  const wordW = shared ? 0 : Math.max(...[p.claim, ...p.facts].join(' ').split(/\s+/).map(wd => ctx.measure(wd, 16.3 / S.k, 600, 'serif')));
  // kind labels (generic captions) may shrink to 15 px but are never hyphenated: the card is at least as wide
  // as the longest kind-label word at that size (AUTHORING item 13)
  const kMin = 15 / S.k;
  const kindW = Math.max(...[t.premiseKind, t.claimKind].flatMap(K => K.toUpperCase().split(/\s+/)).map(wd => ctx.measure(wd, kMin, 800, 'sans') + wd.length * 0.6));
  const uMin = Math.max(150, wordW + Math.max(14, s * 0.52) * 2 + 6, kindW + Math.max(14, s * 0.52) * 2 + 4);
  let u = Math.max(uMin, clamp((laneW - 60 - 20) / (2 + (row ? 0.78 : 0.9) + 0.25), 150, 460) * uScale);
  let bw, mP, mC, hA, mB;
  const sn0 = Math.sin(TH * Math.PI / 180), tn1 = Math.tan(TH * Math.PI / 180);
  for (let pass = 0; pass < 6; pass++) {
    // the box is at least wide enough for its longest word at the floor size
    const longest = Math.max(...(shared ? [''] : String(p.supportLabel).split(/\s+/)).map(wd => ctx.measure(wd, floor, 700, 'sans')), ...t.supportKind.toUpperCase().split(/\s+/).map(wd => ctx.measure(wd, Math.max(16.3 / S.k, ks), 800, 'sans') + wd.length * 0.6));
    bw = Math.max(u * (row ? 0.78 : 0.9), longest + cs * 1.6 + 12);
    mP = measureCard(ctx, {w: u, s, ks, ksMin: kMin, noHyphen: true, as, kind: t.premiseKind, body: p.facts[0], attribution: null, show, floor, bodyHidden: shared});
    mC = measureCard(ctx, {w: u, s, ks, ksMin: kMin, noHyphen: true, as, kind: t.claimKind, body: p.claim, attribution: null, show, floor, bodyHidden: shared});
    hA = Math.max(mP.h, mC.h, u * (row ? (shared ? 0.74 : 0.86) : colAspect));
    mB = measureBox(ctx, {w: bw, s: cs, ks, ksFloor: 16.3 / S.k, label: p.supportLabel, kind: t.supportKind, show, floor, minH: hA * 0.55, labelHidden: shared, noHyphen: true});
    // the premise must stand taller than the box it leans on
    const hCards = hA;
    hA = Math.max(hA, mB.h / 0.88);
    // a box-driven height: widen the box (lower, fewer label lines) while the lane still fits
    if (hA > hCards + 1) {
      let best = {bw, mB, hA};
      for (let w2 = bw * 1.08; w2 <= bw * 1.8; w2 *= 1.08) {
        const m2 = measureBox(ctx, {w: w2, s: cs, ks, ksFloor: 16.3 / S.k, label: p.supportLabel, kind: t.supportKind, show, floor, minH: hCards * 0.55, labelHidden: shared, noHyphen: true});
        const h2 = Math.max(hCards, m2.h / 0.88);
        if (26 + w2 + m2.h * tn1 + u + 2 * h2 * sn0 + u + 36 > laneW + 1) break;
        if (h2 < best.hA - 1) best = {bw: w2, mB: m2, hA: h2};
      }
      ({bw, mB, hA} = best);
    }
    const need = 26 + bw + mB.h * tn1 + u + 2 * hA * sn0 + u + 36;
    if (need <= laneW + 1 || u <= uMin) break;
    u = Math.max(uMin, u * (laneW / need) * 0.99);
  }
  const mBx = mB;
  // headers (measured at the lane width)
  const hsize = cs;
  // row mode: the header sits right of the guide's leg (which rises from the premise's top-left)
  const tn0 = Math.tan(TH * Math.PI / 180);
  const markR = Math.max(30, s * 1.35);
  const headX = row ? 26 + bw + mBx.h * tn0 + u * 0.22 + markR + 22 : 20;
  // stacked lanes: the header sits above the (empty in A) box slot, beside the loop room
  const headWord = Math.max(...[p.scenarioA.label, p.scenarioB.label].join(' ').split(/\s+/).map(wd => ctx.measure(wd, cs, 800, 'sans')));
  void headWord;
  const headW = row ? laneW - headX - 16 : laneW - 40;
  const headProbe = ['A', 'B'].map((L, i) => headerArt(ctx, {name: 'probe', x: 0, y: 0, w: headW, size: hsize, csize: cs, floor: 16.3 / S.k, letter: L, label: [p.scenarioA, p.scenarioB][i].label, caption: side || capFoot ? null : [p.scenarioA, p.scenarioB][i].caption, color: '#888'}));
  const headH = Math.max(...headProbe.map(q => q.h));
  const plankT = Math.max(30, s * 1.2);
  const lane = laneGeom(ctx, S, {u, hA: hA, bw, mB: mBx, headH, plankT, headBeside: !row});
  const laneNeedW = lane.w;
  lane.w = Math.max(lane.w, laneW);
  {
    // B: the claim leans (left) until its top corner rests on the premise's right edge
    const Pf = leanPose(u, hA, lane.footP, lane.T0, -TH);
    lane.psi = -leanLeftOnto(hA, lane.footC, lane.T0, Pf.corners.br, Pf.corners.tr);
  }
  // guide band (row: above the lanes; column: in the left margin between lanes)
  const guideText = p.comparisonLabels.guide ? `${p.comparisonLabels.guide} — ${t.changedFact}: ${p.changedFact}` : `${t.changedFact}: ${p.changedFact}`;
  const guideProbe = show ? chip(ctx, guideText, {x: 0, y: 0, maxWidth: row ? stage.w * 0.9 : laneW - 60, size: cs, minSize: cs, maxLines: 5}) : null;
  // stacked lanes: the guide chip sits in the gap between them
  // stacked lanes: the gap holds the guide chip and lane B's header; lane A's header sits above lane A
  const guideGap = !row && guideProbe ? guideProbe.box.h + 20 : 34;
  if (!row) gap = guideGap + headH + 10;
  // row mode: the shared rule plaque hangs in the top band (right), beside the guide
  let topPlaque = null;
  if (row && !plaqueFoot && p.rules.length) topPlaque = measurePlaque(ctx, {w: stage.w * 0.46, s: cs, ks, head: t.ruleHead, text: p.rules[0], show, floor});
  const guideH = Math.max(guideProbe ? guideProbe.box.h + (row ? barGap + 20 : 40) : 30, topPlaque ? topPlaque.h + 37 + 16 : 0);
  // footer: rule plaque, shared facts + assumptions + no conclusion, neutral note, issue, key
  const footW = side ? stage.w - laneW - 34 : stage.w - 40;
  const items = [];
  // dense layouts: the claim and premise (identical in A and B) are printed once, in a shared panel, and the
  // lane cards keep only their kind labels (AUTHORING: draw shared content once)
  // the (shared) speaker is named once, in the footnote, instead of on both claim cards
  const sharedLine = `${t.claimKind} ${attributionText(t, p.speaker)}. ${p.sharedFacts.length ? `${t.sameIn}: ${p.sharedFacts.join(' · ')}. ` : ''}`;
  const footText = `${sharedLine}${p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ` : ''}${t.noConclusion}`;
  if (shared && show) {
    // one panel: the shared texts, then the footnote (no second "same in A and B" panel)
    const said = `${t.claimKind} ${attributionText(t, p.speaker)}. ${p.sharedFacts.length ? `${p.sharedFacts.join(' · ')}. ` : ''}`;
    const text = `${t.sameIn} — ${t.claimKind}: ${p.claim} · ${t.premiseKind}: ${p.facts[0]}. B · ${t.supportKind}: ${p.supportLabel}. ${said}${p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ` : ''}${t.noConclusion}`;
    const mw = row ? footW * 0.5 : footW;
    const fp = footArt(ctx, {name: 'probe', text, x: 0, y: 0, size: s, maxWidth: mw, maxLines: 20});
    const re = w => { const q = footArt(ctx, {name: 'probe', text, x: 0, y: 0, size: s, maxWidth: w, maxLines: 20}); return {w: q.box.w, h: q.box.h, bad: q.fit.truncated}; };
    items.push({id: 'shared', w: fp.box.w, h: fp.box.h, text, mw, re});
  }
  if (p.rules.length && (!row || plaqueFoot)) {
    const m = measurePlaque(ctx, {w: side ? footW - 14 : footW * 0.52, s: cs, ks, head: t.ruleHead, text: p.rules[0], show, floor});
    const re = w => { const q = measurePlaque(ctx, {w: w - 14, s: cs, ks, head: t.ruleHead, text: p.rules[0], show, floor}); return {w, h: q.h + 37, m: q, bad: (q.body && q.body.truncated) || (q.head && q.head.truncated)}; };
    items.push({id: 'plaque', w: m.w + 14, h: m.h + 37, m, re});
  }
  if (show) {
    const C = rcColors(ctx);
    const key = measureKey(ctx, [
      {glyph: (x, y, uu) => loopGlyph(x, y, uu, C.loop), text: `A · ${t.loopKey}`},
      {glyph: (x, y, uu) => chainGlyph(x, y, uu, C.chain), text: `B · ${t.chainKey}`},
    ], row ? footW * 0.3 : side ? footW - cs * 1.2 : footW * 0.44 - cs * 1.2, cs);
    if (!row) items.push({id: 'key', w: key.w + cs * 1.2, h: key.h + cs * 1.2, key});
    const fp = footArt(ctx, {name: 'probe', text: footText, x: 0, y: 0, size: cs, maxWidth: row ? footW * 0.34 : footW, maxLines: 16});
    const reF = w => { const q = footArt(ctx, {name: 'probe', text: footText, x: 0, y: 0, size: cs, maxWidth: w, maxLines: 16}); return {w: q.box.w, h: q.box.h, bad: q.fit.truncated}; };
    if (!shared) items.push({id: 'foot', w: fp.box.w, h: fp.box.h, text: footText, mw: row ? footW * 0.34 : footW, re: reF});
    const neutral = p.comparisonLabels.neutral || t.neutralDefault;
    const nw = row ? footW * 0.36 : side ? footW : footW * 0.5;
    const np = tagChip(ctx, neutral, {x: 0, y: 0, size: cs, maxWidth: nw});
    const reN = w => { const q = tagChip(ctx, neutral, {x: 0, y: 0, size: cs, maxWidth: w}); return {w: q.box.w, h: q.box.h, bad: q.fit.truncated}; };
    items.push({id: 'neutral', w: np.box.w, h: np.box.h, text: neutral, mw: nw, re: reN});
  }
  // square side column: the scenario captions move into the column (the lane headers keep badge + label)
  if ((side || capFoot) && all) {
    ['A', 'B'].forEach((V, i) => {
      const cap = [p.scenarioA, p.scenarioB][i].caption;
      if (!cap) return;
      const text = `${V} · ${[p.scenarioA, p.scenarioB][i].label}: ${cap}`;
      const mw = side ? footW : footW * 0.3;
      const reC = w => { const q = footArt(ctx, {name: 'probe', text, x: 0, y: 0, size: cs, maxWidth: w, maxLines: 8}); return {w: q.box.w, h: q.box.h, bad: q.fit.truncated}; };
      const q0 = reC(mw);
      items.push({id: `cap${V}`, w: q0.w, h: q0.h, text, mw, re: reC});
    });
  }
  if (all && p.issues.length) {
    const text = `${t.issue}: ${p.issues[0]}`;
    const mw = row ? footW * 0.3 : side ? footW : footW * 0.46;
    const sz = noteSize(ctx, text, mw, cs, 5);
    const reI = w => { const q = noteSize(ctx, text, w, cs, 5); return {w: q.w, h: q.h + 4, bad: q.truncated}; };
    items.push({id: 'issue', w: sz.w, h: sz.h + 4, text, mw, re: reI});
  }
  let band = flow(items, side ? stage.x + laneW + 34 : stage.x + 20, footW, 20, 12);
  // row mode: all notes side by side in one row, widths balanced so their heights even out
  if (row && items.length > 1 && items.every(it => it.re)) {
    let pick = null;
    const one = balanceRow(items, stage.x + 20, footW, 20);
    if (one) pick = {h: one.h, apply: () => { one.apply(); return one.pos; }};
    // or two balanced rows (split anywhere)
    for (let k = 1; k < items.length; k++) {
      const r1 = balanceRow(items.slice(0, k), stage.x + 20, footW, 20), r2 = balanceRow(items.slice(k), stage.x + 20, footW, 20);
      if (!r1 || !r2) continue;
      const hh = r1.h + 12 + r2.h;
      if (!pick || hh < pick.h) pick = {h: hh, apply: () => { r1.apply(); r2.apply(); return [...r1.pos, ...r2.pos.map(q => ({x: q.x, y: r1.h + 12}))]; }};
      // or three rows
      for (let k2 = k + 1; k2 < items.length; k2++) {
        const q2 = balanceRow(items.slice(k, k2), stage.x + 20, footW, 20), q3 = balanceRow(items.slice(k2), stage.x + 20, footW, 20);
        if (!q2 || !q3) continue;
        const h3 = r1.h + 12 + q2.h + 12 + q3.h;
        if (h3 < pick.h) pick = {h: h3, apply: () => { r1.apply(); q2.apply(); q3.apply(); return [...r1.pos, ...q2.pos.map(q => ({x: q.x, y: r1.h + 12})), ...q3.pos.map(q => ({x: q.x, y: r1.h + 12 + q2.h + 12}))]; }};
      }
    }
    if (pick && pick.h < band.h - 1) band = {h: pick.h, pos: pick.apply()};
  }
  const footH = side ? 0 : band.h + 26;
  const sideH = side ? band.h : 0;
  // total height / fit
  const lanesH = row ? lane.h : lane.h * 2 + gap + headH + 10;
  const needH = Math.max((row ? guideH : 0) + lanesH + footH + 20, sideH + 20);
  const fits = needH <= stage.h && laneNeedW <= laneW + 1;
  return {barGap, capFoot, S, stage, row, side, shared, sideH, gap, guideGap, headH, laneNeedW, laneW, u, bw, look, topPlaque, headX, headW, markR, mP: {...mP, h: hA}, mC: {...mC, h: hA}, mB: mBx, hA, headH, hsize, plankT, lane, guideText, guideProbe, guideH, items, band, footH, fits, needH};
}

/** One row of text items whose widths are shared out by text area (heights even out); null if any would truncate. */
function balanceRow(items, x0, width, gap) {
  const avail = width - gap * (items.length - 1);
  let area = items.map(it => it.w * it.h);
  let ws = [];
  let ms = [];
  for (let it = 0; it < 4; it++) {
    const sum = area.reduce((a, b) => a + b, 0);
    ws = area.map(a => Math.max(avail * 0.14, avail * a / sum));
    const k = avail / ws.reduce((a, b) => a + b, 0);
    ws = ws.map(w => w * k);
    ms = items.map((q, i) => q.re(ws[i]));
    area = ms.map((m, i) => ws[i] * m.h);
  }
  if (ms.some(m => m.bad)) return null;
  const pos = [];
  let x = x0;
  items.forEach((q, i) => { pos.push({x, y: 0}); x += ws[i] + gap; });
  const apply = () => items.forEach((q, i) => { q.mw = ws[i]; q.w = ms[i].w; q.h = ms[i].h; if (ms[i].m) q.m = ms[i].m; });
  return {pos, h: Math.max(...ms.map(m => m.h)), apply};
}

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

function finish(ctx, L) {
  const p = ctx.params;
  const t = ctx.t;
  const C = rcColors(ctx);
  let {stage} = L;
  const {lane, S} = L;
  // last resort (only when even the floor text size does not fit): scale the whole comparison to the
  // design box; semantic.zoom reports it
  const needW = L.row ? 2 * L.laneNeedW + L.gap : L.side ? L.laneNeedW + 34 + (stage.w - L.laneW - 34) : L.laneNeedW + GUTTER;
  L.zoom = Math.min(1, stage.h / L.needH, stage.w / Math.max(stage.w, needW));
  L.zoomT = L.zoom < 1 ? `translate(${r(stage.x + stage.w * (1 - L.zoom) / 2)} ${r(stage.y)}) scale(${r(L.zoom, 4)}) translate(${r(-stage.x)} ${r(-stage.y)})` : null;
  if (L.zoom < 1) {
    // lay out in the virtual (unscaled) height
    stage = {...stage, h: L.needH};
    L.stageV = stage;
  }
  // lane origins
  const top = stage.y + (L.row ? L.guideH : 8);
  const lanesH = L.row ? lane.h : lane.h * 2 + L.gap + L.headH + 10;
  const spare = Math.max(0, stage.h - (top - stage.y) - lanesH - L.footH - 8);
  const y0 = top + spare * 0.5;
  L.origin = L.row
    ? [{x: stage.x, y: y0}, {x: stage.x + L.laneW + L.gap, y: y0}]
    : [{x: stage.x + GUTTER, y: y0 + L.headH + 10}, {x: stage.x + GUTTER, y: y0 + L.headH + 10 + lane.h + L.gap}];
  L.a2f = clamp((L.mP.labelLeftR - L.markR - 8) / L.u, 0.12, 0.3);
  // same geometry in both lanes (local), variant differs only after the change beat
  L.lanes = ['A', 'B'].map((V, i) => {
    const pfx = V.toLowerCase();
    const o = L.origin[i];
    const loc = q => ({x: q.x + o.x, y: q.y + o.y});
    const fin = lanePoses(L, lane, V, 1);
    const a1 = V === 'A' ? arcPts(loc(topAt(fin.P, 0.74)), loc(topAt(fin.C, 0.26)), lane.Li)
      : arcPts(loc({x: lane.boxX + lane.bw * 0.55, y: lane.T0 - L.mB.h + 2}), loc(topAt(fin.P, L.a2f)), lane.Li);
    const a2 = V === 'A' ? arcPts(loc(topAt(fin.C, 0.7)), loc(topAt(fin.P, L.a2f)), lane.Lo)
      : arcPts(loc(topAt(fin.P, 0.74)), loc(topAt(fin.C, 0.26)), lane.Li);
    const col = V === 'A' ? C.loop : C.chain;
    const ar1 = ribbonArrow(ctx, {name: `${pfx}ar1`, pts: a1, color: col, width: Math.max(8, S.s * 0.34), travel: true});
    const ar2 = ribbonArrow(ctx, {name: `${pfx}ar2`, pts: a2, color: col, width: Math.max(8, S.s * 0.34), travel: true});
    const head = headerArt(ctx, {name: `${pfx}head`, x: o.x + L.headX, y: L.row ? o.y + 12 : o.y - L.headH - 6, w: L.headW, size: L.hsize, csize: S.cs, floor: 16.3 / S.k, letter: V, label: [p.scenarioA, p.scenarioB][i].label, caption: L.side || L.capFoot ? null : [p.scenarioA, p.scenarioB][i].caption, color: V === 'A' ? '#8a7aa6' : '#6f8fa0'});
    // the changed detail: where the second / first arrow lands on the premise's top-left
    const mark = V === 'A' ? ar2.end : ar1.end;
    return {V, pfx, o, loc, ar1, ar2, head, mark, markR: L.markR, fin};
  });
  // guide bracket between the two rings. Each leg leaves its ring on the first route that crosses no arrow,
  // card or box; side by side the bar runs above the lanes with the callout resting on it over the gap
  // between the lanes; stacked, the bar runs down a gutter outside both lane frames and the callout hangs
  // from it in the gap between the lanes (AUTHORING items 5, 8, 16).
  const [A, B] = L.lanes;
  const obst = laneObstacles(L);
  const clearLeg = pts => obst.every(ob => polyClear(pts, ob));
  const legFor = (ln, kinds) => {
    const m = ln.mark, R = ln.markR;
    const cands = kinds.map(kd => kd(m, R, ln));
    return cands.find(clearLeg) || cands[0];
  };
  if (L.row) {
    const barY = L.origin[0].y - L.barGap;
    const up = m => [{x: m.x, y: m.y - L.markR}, {x: m.x, y: barY}];
    const leftUp = d => m => [{x: m.x - L.markR, y: m.y}, {x: m.x - L.markR - d, y: m.y}, {x: m.x - L.markR - d, y: barY}];
    const legA = legFor(A, [leftUp(20), up, leftUp(40)]);
    const legB = legFor(B, [up, leftUp(20), leftUp(40)]);
    L.guidePts = [...legA, ...legB.slice().reverse()];
    if (L.guideProbe) {
      const gw = L.guideProbe.box.w, gh = L.guideProbe.box.h;
      const x0 = legA[legA.length - 1].x, x1 = legB[legB.length - 1].x;
      // over the gap between the lanes, inside the stage, and resting on the bar between the two legs
      const gcx = clamp(clamp(stage.x + L.laneW + L.gap / 2, stage.x + gw / 2 + 6, stage.x + stage.w - gw / 2 - 6), x0 + 10, x1 - 10);
      L.guideChip = chip(ctx, L.guideText, {x: gcx, y: barY - gh, anchor: 'middle', maxWidth: gw + 2, size: S.cs, minSize: S.cs, maxLines: 5, name: 'guide-chip', fill: '#fbf8f1', stroke: INK});
      L.guideStub = null;
    }
  } else {
    const gx = stage.x + GUTTER * 0.45;
    // up from the ring, over the lane's arrows (in the strip kept free for it), then left out to the gutter
    const upLeft = (m, R, ln) => {
      const arcTop = Math.min(...[ln.ar1, ln.ar2].flatMap(ar => Array.from({length: 21}, (_, k) => ar.at(k / 20).y - ar.width)));
      const yTop = Math.max(ln.o.y + 22, Math.min(arcTop - 18, (ln.o.y + arcTop) / 2));
      return [{x: m.x, y: m.y - R}, {x: m.x, y: yTop}, {x: gx, y: yTop}];
    };
    const leftUp = (m, R) => [{x: m.x - R, y: m.y}, {x: m.x - R - 12, y: m.y - 18}, {x: gx, y: m.y - 18}];
    const legA = legFor(A, [leftUp, upLeft]);
    const legB = legFor(B, [leftUp, upLeft]);
    L.guidePts = [...legA, ...legB.slice().reverse()];
    if (L.guideProbe) {
      const gy = L.origin[0].y + lane.h + L.guideGap / 2;
      const cp = chip(ctx, L.guideText, {x: 0, y: 0, maxWidth: L.laneW - 60, size: S.cs, minSize: S.cs, maxLines: 5});
      const cx = gx + 22;
      L.guideChip = chip(ctx, L.guideText, {x: cx, y: gy - cp.box.h / 2, maxWidth: L.laneW - 60, size: S.cs, minSize: S.cs, maxLines: 5, name: 'guide-chip', fill: '#fbf8f1', stroke: INK});
      L.guideStub = [{x: gx, y: gy}, {x: L.guideChip.box.x, y: gy}];
    }
  }
  L.guidePath = L.guidePts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  L.guideLen = L.guidePts.slice(1).reduce((a, q, i) => a + dist(q, L.guidePts[i]), 0);
  L.guideObstacles = obst;
  // footer band
  const bandY = L.side ? stage.y + (stage.h - L.sideH) / 2 : stage.y + stage.h - L.footH + 10;
  const pos = Object.fromEntries(L.items.map((it, i) => [it.id, {x: L.band.pos[i].x, y: bandY + L.band.pos[i].y, it}]));
  if (pos.plaque) L.plaque = plaqueArt(ctx, {name: 'plaque', m: pos.plaque.it.m, x: pos.plaque.x + 7, y: pos.plaque.y + 30});
  if (L.topPlaque) L.plaque = plaqueArt(ctx, {name: 'plaque', m: L.topPlaque, x: stage.x + stage.w - L.topPlaque.w - 20, y: stage.y + 34});
  if (pos.key) L.keyNode = keyArt(ctx, 'key', pos.key.it.key, pos.key.x + S.cs * 0.6, pos.key.y + S.cs * 0.6);
  if (pos.shared) L.sharedNode = footArt(ctx, {name: 'shared', text: pos.shared.it.text, x: pos.shared.x, y: pos.shared.y, size: S.s, maxWidth: pos.shared.it.mw, maxLines: 20});
  if (pos.foot) L.foot = footArt(ctx, {name: 'foot', text: pos.foot.it.text, x: pos.foot.x, y: pos.foot.y, size: S.cs, maxWidth: pos.foot.it.mw, maxLines: 16});
  if (pos.neutral) L.neutral = tagChip(ctx, pos.neutral.it.text, {x: pos.neutral.x, y: pos.neutral.y, size: S.cs, maxWidth: pos.neutral.it.mw, name: 'neutral'});
  L.caps = ['A', 'B'].filter(V => pos[`cap${V}`]).map(V => footArt(ctx, {name: `cap${V}`, text: pos[`cap${V}`].it.text, x: pos[`cap${V}`].x, y: pos[`cap${V}`].y, size: S.cs, maxWidth: pos[`cap${V}`].it.mw, maxLines: 8}));
  if (pos.issue) L.issue = noteArt(ctx, {name: 'issue', text: pos.issue.it.text, x: pos.issue.x, y: pos.issue.y + 4, maxWidth: pos.issue.it.mw, size: S.cs, maxLines: 5});
  L.bandY = bandY;
  return L;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1500]},
  layout(ctx) {
    const k = px1080(ctx);
    const fitFor = (arrangement, opt = {}) => {
      let s = 26 / k;
      let L;
      // shrink the cards first (shorter lanes), then the text size
      outer: for (let it = 0; it < 18; it++) {
        for (const us of [1, 0.92, 0.84, 0.76]) {
          L = compose(ctx, s, arrangement, us, opt);
          if (L.fits) break outer;
        }
        if (s * k <= 16.6) break;
        // (the 19.5 px baseline is tried exactly before stepping below it)
        const next = Math.max(16.5 / k, s * 0.975);
        s = s * k > 19.52 && next * k < 19.5 ? 19.52 / k : next;
      }
      return L;
    };
    const arr = ctx.view.shape === 'portrait' ? ['column'] : ['row'];
    const over = c => Math.max(0, c.needH - c.stage.h) + 2 * Math.max(0, c.laneNeedW - c.laneW);
    const best = list => list.filter(c => c.fits).sort((x, y) => y.S.s - x.S.s)[0] || null;
    const ok = list => { const b = best(list); return b && b.S.s * k >= 19.5; };
    let cands = arr.map(a => fitFor(a));
    // row, dense: the scenario captions join the notes under the lanes (headers keep badge + label), and/or
    // the rule plaque does (the top band keeps only the guide)
    if (arr.includes('row')) {
      for (const opt of [{capFoot: true}, {plaqueFoot: true}, {capFoot: true, plaqueFoot: true}]) {
        if (ok(cands)) break;
        cands.push(fitFor('row', opt));
      }
    }
    let L = best(cands);
    // denser still: print the shared claim/premise once and keep the lanes' cards text-free
    if (!L || L.S.s * k < 19.5) {
      const sh = [];
      for (const [a, opt] of [...arr.map(a => [a, {}]), ...(arr.includes('row') ? [['row', {capFoot: true}], ['row', {capFoot: true, plaqueFoot: true}]] : [])]) {
        sh.push(fitFor(a, {...opt, shared: true}));
        if (ok(sh)) break;
      }
      const b2 = best(sh);
      if (b2 && (!L || b2.S.s > L.S.s + 0.01)) L = b2;
      cands = [...cands, ...sh];
    }
    // last resort before smaller text: a tighter bar above the lanes (still outside them)
    if (arr.includes('row') && (!L || L.S.s * k < 19.5)) {
      const L0 = L;
      const c2 = fitFor('row', {capFoot: !!(L0 && L0.capFoot), shared: !!(L0 && L0.shared), barGap: 20});
      if (c2.fits && (!L || c2.S.s > L.S.s + 0.01)) L = c2;
    }
    if (!L) L = cands.sort((x, y) => over(x) - over(y))[0];
    return finish(ctx, L);
  },
  build(ctx, L) {
    const C = rcColors(ctx);
    const lanesNodes = L.lanes.map(ln => {
      const {pfx, o} = ln;
      const lane = L.lane;
      const box = {x: o.x, y: o.y, w: L.laneW, h: lane.h};
      const st = stageArt(ctx, {prefix: `${pfx}stage`, box, planks: [{x0: o.x - 10, x1: o.x + L.laneW + 10, y: o.y + lane.T0, t: L.plankT, kind: 'table'}], floorY: o.y + lane.T0 + L.plankT + 4, radius: 20});
      const chock = (name, x, y) => h('path', {name, d: `M${r(x - 16)} ${r(y)}L${r(x - 10)} ${r(y - 22)}H${r(x + 10)}L${r(x + 16)} ${r(y)}Z`, fill: ctx.theme.woodTop, stroke: INK, 'stroke-width': 2});
      return g(null,
        st.back,
        g({'clip-path': st.clip},
          ln.V === 'B' ? g({name: `${pfx}box`, transform: T(o.x + lane.boxX, o.y + lane.T0)}, boxArt(ctx, {m: L.mB, name: `${pfx}bx`})) : null,
          g({name: `${pfx}P`}, cardArt(ctx, {name: `${pfx}cardP`, m: L.mP, kind: 'premise', color: C.premise, idKey: `${pfx}p`, labelRight: true})),
          g({name: `${pfx}C`}, cardArt(ctx, {name: `${pfx}cardC`, m: L.mC, kind: 'claim', color: C.claim, look: L.look, idKey: `${pfx}c`})),
          [['cP0', lane.footP], ['cP1', lane.footP + lane.u], ['cC0', lane.footC], ['cC1', lane.footC + lane.u]].map(([nm, x]) => chock(`${pfx}${nm}`, o.x + x, o.y + lane.T0)),
          h('path', {name: `${pfx}cord`, fill: 'none', stroke: '#6b5234', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0}),
          h('circle', {name: `${pfx}knot`, r: 6, fill: '#6b5234', stroke: INK, 'stroke-width': 1.5, opacity: 0}),
          ln.ar1.node, ln.ar2.node,
          h('circle', {name: `${pfx}ring`, cx: r(ln.mark.x), cy: r(ln.mark.y), r: r(ln.markR), fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-dasharray': '10 7', opacity: 0}),
        ),
        st.frame,
        ln.head.badge, ln.head.labels,
      );
    });
    return g({transform: L.zoomT || undefined},
      lanesNodes,
      h('path', {name: 'guide', d: L.guidePath, fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-dasharray': `${r(L.guideLen)} ${r(L.guideLen + 10)}`, 'stroke-dashoffset': r(L.guideLen)}),
      L.guideChip && g({name: 'guide-wrap', opacity: 0},
        L.guideStub ? h('path', {d: `M${r(L.guideStub[0].x)} ${r(L.guideStub[0].y)}H${r(L.guideStub[1].x)}`, stroke: INK, 'stroke-width': 3}) : null,
        h('circle', {cx: r(L.guideStub ? L.guideStub[0].x : L.guideChip.box.x + L.guideChip.box.w / 2), cy: r(L.guideStub ? L.guideStub[0].y : L.guideChip.box.y + L.guideChip.box.h), r: 5.5, fill: INK}),
        L.guideChip.node),
      L.plaque && L.plaque.node,
      L.keyNode && L.keyNode.node,
      L.foot && L.foot.node,
      L.sharedNode && L.sharedNode.node,
      L.neutral && L.neutral.node,
      L.issue && L.issue.node,
      (L.caps || []).map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const lane = L.lane;
    const le = ease.inOutCubic(seg(u, ...W.lean));
    const chk = ease.inOutCubic(seg(u, ...W.chocks));
    const bx = ease.outCubic(seg(u, ...W.box));
    const cd = ease.inOutSine(seg(u, ...W.cord));
    const cdOut = seg(u, ...W.cordOut);
    const q1 = ease.inOutSine(seg(u, ...W.arrow1));
    const q2 = ease.inOutSine(seg(u, ...W.arrow2));
    const labels = ease.inOutSine(seg(u, ...W.labels));
    const looks = {};
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const sem = {};
    for (const ln of L.lanes) {
      const {pfx, o, V} = ln;
      const {P, C, psi} = lanePoses(L, lane, V, le);
      const tr = pose => `${T(o.x, o.y)} ${pose.transform}`;
      nodes[`${pfx}P`] = {transform: tr(P)};
      nodes[`${pfx}C`] = {transform: tr(C)};
      // chocks slide away (outwards) and fade
      const off = 40 * chk;
      [['cP0', -1], ['cP1', 1], ['cC0', -1], ['cC1', 1]].forEach(([nm, sg]) => { nodes[`${pfx}${nm}`] = {transform: T(sg * off, 0), opacity: r(1 - chk, 3)}; });
      // B's box slides in from the lane's left edge
      if (V === 'B') nodes[`${pfx}box`] = {transform: T(o.x + lane.boxX - (lane.boxX + lane.bw + 30) * (1 - bx), o.y + lane.T0), opacity: bx > 0 ? 1 : 0};
      // cord from the premise's top corner to what it rests on
      const hook = V === 'A' ? P.corners.tr : P.corners.tl;
      const target = V === 'A' ? C.corners.tl : {x: lane.boxR, y: lane.T0 - L.mB.h};
      const a = ln.loc(hook), b = ln.loc(target);
      const mid = {x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + 18 * (1 - le)};
      const cordPts = [];
      for (let k = 0; k <= 20; k++) {
        const tt = (k / 20) * cd;
        cordPts.push({x: (1 - tt) * (1 - tt) * a.x + 2 * (1 - tt) * tt * mid.x + tt * tt * b.x, y: (1 - tt) * (1 - tt) * a.y + 2 * (1 - tt) * tt * mid.y + tt * tt * b.y});
      }
      nodes[`${pfx}cord`] = {d: cordPts.map((q, k) => `${k ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), opacity: cd > 0 ? r(1 - cdOut, 3) : 0};
      nodes[`${pfx}knot`] = {cx: r(cordPts[cordPts.length - 1].x), cy: r(cordPts[cordPts.length - 1].y), opacity: cd >= 1 ? r(1 - cdOut, 3) : 0};
      Object.assign(nodes, ln.ar1.frame(q1), ln.ar2.frame(q2));
      nodes[`${pfx}ring`] = {opacity: r(seg(u, ...W.rings), 3)};
      nodes[`${pfx}head-labels`] = {opacity: r(labels, 3)};
      looks[V] = {
        P: [r(P.angle, 2), P2(P.corners.bl), P2(P.corners.tr)],
        C: [r(C.angle, 2), P2(C.corners.bl), P2(C.corners.tr)],
        chocks: r(chk, 3),
        arrows: [r(q1, 3), r(q2, 3)],
        cordVisible: cd > 0,
        boxVisible: V === 'B' ? bx > 0 : false,
        labels: r(labels, 3),
      };
      sem[V] = {P, C, psi, cd, target: b, hook: a};
    }
    const gd = ease.inOutSine(seg(u, ...W.guide));
    nodes.guide = {'stroke-dashoffset': r(L.guideLen * (1 - gd))};
    if (L.guideChip) nodes['guide-wrap'] = {opacity: r(seg(u, W.guide[0] + 0.03, W.guide[1]), 3)};
    if (L.plaque) nodes.plaque = {opacity: r(seg(u, 0.01, 0.08), 3)};
    if (L.keyNode) nodes.key = {opacity: r(seg(u, ...W.note), 3)};
    if (L.foot) nodes.foot = {opacity: r(seg(u, ...W.foot), 3)};
    if (L.sharedNode) nodes.shared = {opacity: r(seg(u, 0.01, 0.08), 3)};
    if (L.neutral) nodes.neutral = {opacity: r(seg(u, ...W.note), 3)};
    if (L.issue) nodes.issue = {opacity: r(seg(u, ...W.issue), 3)};
    (L.caps || []).forEach((c, i) => { nodes[`cap${['A', 'B'][i]}`] = {opacity: r(seg(u, ...W.labels), 3)}; });

    // --- semantics
    const la = L.lanes[0], lb = L.lanes[1];
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      arrangement: L.row ? 'row' : L.side ? 'colside' : 'column',
      scenes: 2,
      // identical-before-change: the looks of A and B compared in lane-local coordinates
      // (card corners are lane-local already, so equal looks mean visually identical lanes)
      lookA: {...looks.A, boxVisible: looks.A.boxVisible},
      lookB: {...looks.B, boxVisible: looks.B.boxVisible},
      boxInB: looks.B.boxVisible,
      lean: r(le, 3),
      premiseRestsOn: {A: 'claim', B: 'outside support'},
      cordA: {visible: looks.A.cordVisible, toClaim: dist(sem.A.target, la.loc(sem.A.C.corners.tl)) < 1},
      cordB: {visible: looks.B.cordVisible, toBox: dist(sem.B.target, lb.loc({x: lane.boxR, y: lane.T0 - L.mB.h})) < 1},
      apexA: r(dist(sem.A.P.corners.tr, sem.A.C.corners.tl), 2),
      boxContactB: r(boxContact(lane, L, sem.B.P), 2),
      claimOnPremiseB: r(onEdgeGap(sem.B.C.corners.tl, sem.B.P.corners.br, sem.B.P.corners.tr), 2),
      psiB: r(sem.B.psi, 2),
      arrowsA: [r(q1, 3), r(q2, 3)],
      arrowsB: [r(q1, 3), r(q2, 3)],
      loopA: {returnStart: 'claim', returnEnd: 'premise', endOnPremise: r(segDist(la.ar2.end, la.loc(sem.A.P.corners.tl), la.loc(sem.A.P.corners.tr)), 2)},
      chainB: {firstStart: 'outside support', endOnPremise: r(segDist(lb.ar1.end, lb.loc(sem.B.P.corners.tl), lb.loc(sem.B.P.corners.tr)), 2), secondEndOnClaim: r(segDist(lb.ar2.end, lb.loc(sem.B.C.corners.tl), lb.loc(sem.B.C.corners.tr)), 2)},
      differsOnly: ['premiseRestsOn'],
      rings: r(seg(u, ...W.rings), 3),
      guide: r(gd, 3),
      markA: P2(la.mark),
      markB: P2(lb.mark),
      guideClear: L.guideObstacles.every(ob => polyClear(L.guidePts, ob)),
      guideOutsideLanes: L.row
        ? L.guidePts.filter((q, i) => i > 0 && L.guidePts[i - 1].y === q.y && Math.abs(L.guidePts[i - 1].x - q.x) > 60).every(q => q.y < L.origin[0].y)
        : L.guidePts.filter(q => Math.abs(q.x - (L.stage.x + GUTTER * 0.45)) < 0.5).length >= 2 && L.stage.x + GUTTER * 0.45 < L.origin[0].x - 6,
      // distance of the bracket's horizontal runs from the lane frames' top / bottom edges (never along a frame)
      guideFrameGap: r(Math.min(...L.guidePts.slice(1).flatMap((q, i) => {
        const p0 = L.guidePts[i];
        if (Math.abs(p0.y - q.y) > 0.5) return [Infinity];
        return L.origin.map(o => (Math.max(p0.x, q.x) > o.x && Math.min(p0.x, q.x) < o.x + L.laneW) ? Math.min(Math.abs(q.y - o.y), Math.abs(q.y - (o.y + L.lane.h))) : Infinity);
      })), 1),
      guidePlaqueGap: L.plaque && L.plaque.box ? r(Math.min(...L.guidePts.slice(1).map((q, i) => rectSegGap(L.plaque.box, L.guidePts[i], q))), 1) : null,
      guideChipAttached: L.guideChip ? (L.guideStub
        ? Math.abs(L.guideStub[1].x - L.guideChip.box.x) < 0.5 && L.guidePts.some((q, i) => i > 0 && segDist(L.guideStub[0], L.guidePts[i - 1], q) < 0.5)
        : L.guidePts.some((q, i) => i > 0 && segDist({x: L.guideChip.box.x + L.guideChip.box.w / 2, y: L.guideChip.box.y + L.guideChip.box.h}, L.guidePts[i - 1], q) < 0.5)) : null,
      markLocalSame: Math.abs((la.mark.y - la.o.y) - (lb.mark.y - lb.o.y)) < 60,
      zoom: r(L.zoom, 3),
      textPx: {content: r(L.S.s * L.S.k * L.zoom, 2), caption: r(L.S.cs * L.S.k * L.zoom, 2)},
    };
    return {nodes, semantic};
  },
};

/** Arrows, cards and the box of both lanes at the final state (world), as polylines / polygons. */
function laneObstacles(L) {
  const out = [];
  for (const ln of L.lanes) {
    for (const ar of [ln.ar1, ln.ar2]) out.push({kind: 'line', pts: Array.from({length: 41}, (_, k) => ar.at(k / 40)), pad: ar.width / 2 + 5});
    for (const pose of [ln.fin.P, ln.fin.C]) out.push({kind: 'poly', pts: ['tl', 'tr', 'br', 'bl'].map(c => ln.loc(pose.corners[c])), pad: 2});
    if (ln.V === 'B') {
      const x = ln.o.x + L.lane.boxX, y = ln.o.y + L.lane.T0 - L.mB.h, w = L.lane.bw, hh = L.mB.h;
      out.push({kind: 'poly', pts: [{x, y}, {x: x + w, y}, {x: x + w, y: y + hh}, {x, y: y + hh}], pad: 2});
    }
  }
  return out;
}

/** Smallest distance between a rectangle and a segment (0 when they touch). */
function rectSegGap(b, p, q) {
  const corners = [{x: b.x, y: b.y}, {x: b.x + b.w, y: b.y}, {x: b.x + b.w, y: b.y + b.h}, {x: b.x, y: b.y + b.h}];
  const inside = z => z.x >= b.x && z.x <= b.x + b.w && z.y >= b.y && z.y <= b.y + b.h;
  if (inside(p) || inside(q) || corners.some((c, i) => segsCross(p, q, c, corners[(i + 1) % 4]))) return 0;
  return Math.min(...corners.map(c => segDist(c, p, q)), ...[p, q].map(z => Math.hypot(Math.max(b.x - z.x, 0, z.x - b.x - b.w), Math.max(b.y - z.y, 0, z.y - b.y - b.h))));
}

function segsCross(p1, p2, p3, p4) {
  const d = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/** True when the polyline `pts` keeps clear of the obstacle (crossing none of its edges, off its padding). */
function polyClear(pts, ob) {
  const edges = ob.kind === 'poly' ? ob.pts.map((q, i) => [q, ob.pts[(i + 1) % ob.pts.length]]) : ob.pts.slice(1).map((q, i) => [ob.pts[i], q]);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    for (const [c, d] of edges) {
      if (segsCross(a, b, c, d)) return false;
      if (ob.kind === 'line' && Math.min(segDist(c, a, b), segDist(a, c, d), segDist(b, c, d)) < ob.pad) return false;
    }
    if (ob.kind === 'poly' && insidePoly({x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}, ob.pts)) return false;
  }
  return true;
}

function insidePoly(q, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > q.y) !== (b.y > q.y) && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function segDist(q, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(q.x - a.x - dx * t, q.y - a.y - dy * t);
}
function onEdgeGap(q, a, b) { return segDist(q, a, b); }
function boxContact(lane, L, P) {
  const corner = {x: lane.boxR, y: lane.T0 - L.mB.h};
  return segDist(corner, P.corners.bl, P.corners.tl);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-07-contrast',
    title: 'Circular reasoning — the same claim and premise, resting on the claim (a cycle) or on an outside record (independent support)',
    titleEs: 'Razonamiento circular — Comparación de dos supuestos',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Razonamiento circular',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical side-view tables (side by side or stacked) with the same claim (attributed to a fictional speaker) and premise standing in chocks. Only what the premise rests on changes: a cord ties it to the claim in A, to an archive box that slides in in B. The chocks slide away and the cards lean along their cords — an A-frame in A, a chain onto the box in B — and the support arrows draw with the same timing: a loop back to the premise in A, a chain from the box in B. Rings and a bracket join the changed detail. No winner, score or conclusion.',
    tags: ['reasoning', 'circular reasoning', 'contrast', 'cycle', 'independent support', 'claim', 'premise', 'outside record'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/razonamiento-circular.js', 'src/primitives/annotate.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
