/**
 * LAW-0108 — Razonamiento circular · inspect
 *
 * Storyboard (the table of the story, no hands; a manila "rests on" tag is
 * tied by a string to the premise card's top-left corner):
 *  0.00–0.20 context   The state produced by the action: the premise and the
 *                      claim lean on each other (A-frame) and the support arrows
 *                      have drawn — premise → claim and the arrow that returns
 *                      from the claim to the same premise. The tag reads the
 *                      supplied BEFORE value ("rests on: …"). Context caption.
 *  0.20–0.45 isolate   A detail lens opens (in place, on a free panel) on the tag
 *                      and the premise's top edge where the returning arrow lands:
 *                      a true enlarged copy of that region (same coordinates, same
 *                      card rotation, same texts), the context dims. Both focus
 *                      targets contain the tag, i.e. the datum that changes.
 *  0.45–0.75 replace   One datum is substituted: the before value is struck and
 *                      lifted away (it stays traceable as a struck "before" note
 *                      under the tag), then the supplied AFTER value appears.
 *                      Only the geometry that depends on it updates: the arrow
 *                      returning from the claim fades out, an archive box (the
 *                      outside support, label as supplied) slides into the
 *                      empty spot, the premise re-leans onto the box and the
 *                      claim follows onto the premise; the arrows box → premise
 *                      and premise → claim draw. The lens shows all of it.
 *  0.75–1.00 return    The lens window fades out where it is (it never slides back
 *                      over the live cards); the context caption (relabelled
 *                      "Before — …" once the datum was replaced) stays; a Δ marker (neutral
 *                      glyph, supplied label) stays on the tag; assumptions and
 *                      "as supplied · no conclusion drawn". Seeking back to any
 *                      earlier time restores the before value exactly.
 * Layout: wide boxes put the lens window right of the table and, once it has
 * closed, the notes (rule plaque, Δ change note, footnote, issue) in that same
 * column; tall/square boxes put the window below the table and the notes on
 * the floor under it after the window has closed.
 * Nothing is judged valid or invalid; no outcome is inferred.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/reasoning/LAW-0108
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, dist} from '../../core/geometry.js';
import {str, list, party, inspectFields} from '../../schemas/fields.js';
import {textBlock, chip} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {
  RC_STRINGS, RC_DEFAULTS, claimField, rulesField, issuesField, assumptionsField, supportLabelField,
  rcColors, px1080, measureCard, cardArt, measureBox, boxArt, ribbonArrow, arcPts, stageArt, measurePlaque, plaqueArt,
  tagChip, noteArt, noteSize, footArt, speakerLook, attributionText, leanPose, leanLeftOnto, topAt, wordSafeSize, INK,
} from './kits/razonamiento-circular.js';

const ID = 'LAW-0108';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.45], replace: [0.45, 0.75], back: [0.75, 1]};
const W = {
  arrow1: [0.02, 0.09], arrow2: [0.09, 0.17], caption: [0.02, 0.1],
  open: [0.22, 0.34],
  strike: [0.45, 0.48], liftOld: [0.48, 0.53], newVal: [0.53, 0.58], ghost: [0.55, 0.6],
  retOut: [0.58, 0.62], box: [0.6, 0.66], relean: [0.65, 0.71], arrowB: [0.7, 0.735], arrowPC: [0.715, 0.75],
  close: [0.76, 0.82], marker: [0.8, 0.84], notes: [0.8, 0.85], capOut: [0.53, 0.56], capIn: [0.565, 0.6],
};
const TH = 7;
const M = 12;

const STRINGS = {
  en: {...RC_STRINGS.en, restsOnHead: 'Rests on', before: 'Before', changed: 'Δ'},
  es: {...RC_STRINGS.es, restsOnHead: 'Se apoya en', before: 'Antes', changed: 'Δ'},
};

const sceneSchema = {
  speaker: party,
  claim: claimField,
  facts: list('The premise offered for the claim (fictional)', str('Premise', 110), 1, 1),
  supportLabel: supportLabelField,
  rules: rulesField,
  issues: issuesField,
  assumptions: assumptionsField,
  ...inspectFields(['support-tag', 'premise-top']),
};

const defaultParams = {
  speaker: RC_DEFAULTS.speaker,
  claim: RC_DEFAULTS.claim,
  facts: ['The ledger’s totals are right'],
  supportLabel: RC_DEFAULTS.supportLabel,
  rules: RC_DEFAULTS.rules,
  issues: ['Does the premise need the claim to stand?'],
  assumptions: ['Both values are supplied by the author; neither is verified'],
  focusTarget: 'support-tag',
  beforeValue: 'The claim itself (the ledger is accurate)',
  afterValue: 'Bank statement B-7 (an outside record)',
  detailGeometry: {zoom: 2, placement: 'auto'},
  contextLabels: {context: 'Context: the premise and the claim lean on each other (fictional)', marker: 'Changed datum (as supplied)'},
};

function sizes(ctx, s) {
  const k = px1080(ctx);
  return {k, s, ks: Math.min(s, Math.max(16.5 / k, s * 0.66)), as: Math.min(s, Math.max(20 / k, s * 0.82)), cs: Math.min(s, Math.max(20 / k, s * 0.8))};
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

/** Tag sizes: head (micro) + value (content) in a manila tag of width tw. */
function measureTag(ctx, S, tw, before, after, head, show, ghostHead, marker) {
  const pad = S.s * 0.5;
  const hole = S.s * 0.9;
  const inner = tw - pad * 2 - hole;
  const vs = show ? Math.min(wordSafeSize(ctx, before, inner, S.s, 700, 'sans', 16.3 / S.k), wordSafeSize(ctx, after, inner, S.s, 700, 'sans', 16.3 / S.k)) : S.s;
  const headFit = show ? ctx.fit(head.toUpperCase(), {maxWidth: inner, size: S.ks, minSize: S.ks, maxLines: 2, weight: 800}) : null;
  const fb = show ? ctx.fit(before, {maxWidth: inner, size: vs, minSize: vs, maxLines: 8, weight: 700, leading: 1.14}) : null;
  const fa = show ? ctx.fit(after, {maxWidth: inner, size: vs, minSize: vs, maxLines: 8, weight: 700, leading: 1.14}) : null;
  const valH = Math.max(fb ? fb.height : S.s * 1.2, fa ? fa.height : S.s * 1.2);
  // the struck "before" note sits inside the tag, under the value (space reserved from the start)
  const gs = Math.max(16.3 / S.k, vs * 0.86);
  const gf = show && ghostHead ? ctx.fit(`${ghostHead}: ${before}`, {maxWidth: inner, size: gs, minSize: gs, maxLines: 8, weight: 500}) : null;
  const mf = show && marker ? ctx.fit(`Δ ${marker}`, {maxWidth: inner, size: gs, minSize: gs, maxLines: 4, weight: 700}) : null;
  const th = pad * 1.2 + (headFit ? headFit.height + Math.max(pad * 0.5, S.ks * 0.6) : 0) + valH + (gf ? pad * 0.6 + gf.height : 0) + (mf ? pad * 0.4 + mf.height : 0) + pad * 1.2;
  return {w: tw, h: th, pad, hole, headFit, fb, fa, vs, gf, mf, valH};
}

/** Manila tag, local origin = the string hole (right end, vertical centre). Body extends to the left. */
function tagArt(ctx, m, pfx, show) {
  const C = rcColors(ctx);
  const w = m.w, hh = m.h;
  const x0 = -w, y0 = -hh / 2;
  const cut = Math.min(hh * 0.3, 22);
  const body = `M${r(x0)} ${r(y0)}H${r(-cut)}L0 ${r(y0 + cut)}V${r(-y0 - cut)}L${r(-cut)} ${r(-y0)}H${r(x0)}Z`;
  const tx = x0 + m.pad;
  let ty = y0 + m.pad * 1.2;
  const parts = [
    h('path', {d: body, fill: '#e9cf98', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(-m.hole * 0.55), cy: 0, r: r(m.hole * 0.22), fill: '#fbf7ef', stroke: INK, 'stroke-width': 2}),
  ];
  if (show && m.headFit) {
    parts.push(textBlock(m.headFit, {x: tx, y: ty, fill: '#6b4f2c', letterSpacing: 0.6, name: `${pfx}head`}));
    ty += m.headFit.height + Math.max(m.pad * 0.5, m.headFit.size * 0.6);
  }
  if (show) {
    parts.push(g({name: `${pfx}old`}, textBlock(m.fb, {x: tx, y: ty, fill: INK}),
      h('path', {name: `${pfx}strike`, d: m.fb.lines.map((ln, i) => `M${r(tx - 2)} ${r(ty + i * m.fb.lineHeight + m.vs * 0.5)}h${r(ctx.measure(ln, m.vs, 700, 'sans') + 4)}`).join(''), stroke: '#57606a', 'stroke-width': 3, fill: 'none', 'stroke-dasharray': '2000', 'stroke-dashoffset': '2000'})));
    parts.push(g({name: `${pfx}new`, opacity: 0}, textBlock(m.fa, {x: tx, y: ty, fill: INK})));
    if (m.gf) {
      const gy = ty + m.valH + m.pad * 0.6;
      parts.push(g({name: `${pfx}ghost`, opacity: 0},
        h('path', {d: `M${r(tx - 4)} ${r(gy - 4)}H${r(-m.hole)}`, stroke: '#b99a63', 'stroke-width': 1.5, 'stroke-dasharray': '5 4'}),
        textBlock(m.gf, {x: tx, y: gy, fill: '#5b4a33', name: `${pfx}ghost-text`}),
        h('path', {d: m.gf.lines.map((ln, i) => `M${r(tx - 2)} ${r(gy + i * m.gf.lineHeight + m.gf.size * 0.5)}h${r(ctx.measure(ln, m.gf.size, 500, 'sans') + 4)}`).join(''), stroke: '#57606a', 'stroke-width': 2})));
      if (m.mf) parts.push(g({name: `${pfx}mark`, opacity: 0}, textBlock(m.mf, {x: tx, y: gy + m.gf.height + m.pad * 0.4, fill: '#3f464e', name: `${pfx}mark-text`})));
    }
  } else {
    parts.push(h('rect', {x: r(tx), y: r(ty + m.vs * 0.2), width: r((w - m.pad * 2 - m.hole) * 0.8), height: r(m.vs * 0.4), rx: 3, fill: '#b99a63', name: `${pfx}bar`}));
  }
  return g(null, parts);
}

function compose(ctx, s0, us = 1) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = sizes(ctx, s0);
  const {s, ks, as, cs} = S;
  const show = ctx.show('key');
  const all = ctx.show('all');
  const stage = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const shape = ctx.view.shape;
  const wide = shape === 'landscape';
  const floor = 16.3 / S.k;
  // scene part (left in wide boxes, top in tall ones) and the lens panel (right / below)
  const sceneW = wide ? stage.w * (shape === 'square' ? 0.6 : 0.58) : stage.w;
  // stacked (tall / square boxes): the scene takes about the upper half, the lens panel the lower half
  // (tall boxes: taller cards and a bigger scene, so the table scene is not a strip at the top of the frame)
  const aspect = wide ? 1.1 : shape === 'portrait' ? 1.45 : 0.95;
  const uH = wide ? Infinity : ((stage.h - 220) * (shape === 'portrait' ? 0.6 : 0.56) - 110) / 1.35 / aspect;
  const u = clamp(Math.min((sceneW - 90) / (2 + 0.95 + 0.3), uH) * us, 170, 420);
  // spare width goes to the box slot, which is also where the (wide) tag hangs
  const bw = Math.max(u * 0.95, Math.min(u * 2, sceneW - 110 - u * 2.45));
  const look = speakerLook(ctx, p.speaker);
  const mP = measureCard(ctx, {w: u, s, ks, ksMin: floor, as, kind: t.premiseKind, body: p.facts[0], attribution: null, show, floor});
  const mC = measureCard(ctx, {w: u, s, ks, ksMin: floor, as, kind: t.claimKind, body: p.claim, attribution: attributionText(t, p.speaker), show, floor});
  let hA = Math.max(mP.h, mC.h, u * aspect);
  const mB = measureBox(ctx, {w: bw, s: cs, ks, ksFloor: floor, label: p.supportLabel, kind: t.supportKind, show, floor, minH: hA * 0.4});
  hA = Math.max(hA, mB.h / 0.8);
  return {S, stage, sceneW, wide, u, bw, look, mP: {...mP, h: hA, labelLeftR: mP.labelLeftR}, mC: {...mC, h: hA}, mB, hA, floor, shape, show, all};
}

function geometry(ctx, L) {
  const p = ctx.params;
  const t = ctx.t;
  const {S, stage, u, bw, hA} = L;
  const sn = Math.sin(TH * Math.PI / 180), tn = Math.tan(TH * Math.PI / 180);
  // band (context caption on top; notes at the bottom)
  const capText = p.contextLabels.context;
  const capFit = L.all && capText ? chip(ctx, `${t.before} — ${capText}`, {x: 0, y: 0, maxWidth: L.wide ? stage.w * 0.55 : stage.w - 40, size: S.cs, minSize: S.cs, maxLines: 3}) : null;
  const topH = capFit ? capFit.box.h + 24 : 16;
  const items = [];
  // wide boxes: the notes take the right-hand column (where the lens window was) once the lens has closed;
  // stacked boxes: a band at the bottom (the lens window may use it while open)
  const colX = stage.x + L.sceneW + 30;
  const footW = L.wide ? stage.x + stage.w - 20 - colX : stage.w - 40;
  if (p.rules.length) {
    const m = measurePlaque(ctx, {w: L.wide ? footW - 14 : footW * 0.48, s: S.cs, ks: S.ks, head: t.ruleHead, text: p.rules[0], show: L.show, floor: L.floor});
    items.push({id: 'plaque', w: m.w + 14, h: m.h + 37, m});
  }
  if (L.show) {
    // the changed-datum note: Δ (neutral, accent2 disc) + marker label, and the struck before value (traceable)
    const mw = L.wide ? footW : footW * 0.49;
    const inner = mw - S.cs * 2.6;
    const mf = p.contextLabels.marker ? ctx.fit(p.contextLabels.marker, {maxWidth: inner, size: S.cs, minSize: S.cs, maxLines: 4, weight: 700}) : null;
    const gf = ctx.fit(`${t.before}: ${p.beforeValue}`, {maxWidth: inner, size: S.cs, minSize: S.cs, maxLines: 6, weight: 500});
    const w = Math.max(mf ? mf.width : 0, gf.width) + S.cs * 2.6;
    const hh = (mf ? mf.height + S.cs * 0.35 : 0) + gf.height + S.cs * 1.1;
    items.push({id: 'change', w, h: hh, mf, gf});
  }
  if (L.show) {
    const footText = p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ${t.noConclusion}` : t.noConclusion;
    const mw = L.wide ? footW : footW * 0.49;
    const fp = footArt(ctx, {name: 'probe', text: footText, x: 0, y: 0, size: S.cs, maxWidth: mw, maxLines: 12});
    items.push({id: 'foot', w: fp.box.w, h: fp.box.h, text: footText, mw});
  }
  if (L.all && p.issues.length) {
    const text = `${t.issue}: ${p.issues[0]}`;
    const mw = L.wide ? footW : footW * 0.49;
    const sz = noteSize(ctx, text, mw, S.cs, 6);
    items.push({id: 'issue', w: sz.w, h: sz.h, text, mw});
  }
  const band = flow(items, L.wide ? colX : stage.x + 20, footW, 20, 14);
  const bandH = L.wide ? 0 : band.h + 24;
  // scene vertical budget: tag hangs above the box slot at the premise's top height; arrows above the cards
  const Li = Math.max(40, hA * 0.18), Lo = Li + Math.max(50, hA * 0.22);
  const top = stage.y + topH + Lo + u * sn + 20;
  const sceneH = L.wide ? stage.h - topH - 20 : (stage.h - topH - bandH) * (L.shape === 'portrait' ? 0.64 : 0.55);
  const tableMax = stage.y + topH + sceneH - 44;
  let tableY = Math.min(tableMax, top + hA + 30 + Math.max(0, tableMax - (top + hA + 30)) * 0.5);
  const x0 = stage.x + 20;
  const boxX = x0 + 10;
  const boxR = boxX + bw;
  const footP = boxR + L.mB.h * tn;
  const footC = footP + u + 2 * hA * sn;
  // the "rests on" tag hangs from a nail on the wall above the box spot (it never moves); its string runs to the
  // premise's top-left corner and follows the card when it re-leans (x positions do not depend on the table height)
  const P0a = leanPose(u, hA, footP, tableY, TH), P0b = leanPose(u, hA, footP, tableY, -TH);
  const tagRight = Math.min(P0b.corners.tl.x, P0a.corners.tl.x) - 22;
  const tagW = Math.max(160, tagRight - (stage.x + 14));
  L.tag = measureTag(ctx, S, tagW, p.beforeValue, p.afterValue, t.restsOnHead, L.show, null, null);
  // the table sits low enough for the tag to hang clear above the box
  tableY = Math.max(tableY, stage.y + topH + 4 + L.tag.h + 20 + L.mB.h, stage.y + topH + 16 + Lo + u * sn + hA + 24);
  const Pa = leanPose(u, hA, footP, tableY, TH);
  const Ca = leanPose(u, hA, footC, tableY, -TH);
  const Pb = leanPose(u, hA, footP, tableY, -TH);
  const psi = -leanLeftOnto(hA, footC, tableY, Pb.corners.br, Pb.corners.tr);
  const Cb = leanPose(u, hA, footC, tableY, -psi);
  const boxTop = tableY - L.mB.h;
  let tagTop = Math.min(Pa.corners.tl.y - 6, boxTop - 12 - L.tag.h);
  tagTop = Math.max(stage.y + topH + 4, tagTop);
  const tagHole = {x: tagRight, y: tagTop + L.tag.h / 2};
  const sceneRight = Math.max(Ca.corners.tr.x, Cb.corners.tr.x, Ca.corners.br.x) + 30;
  // lens: source around the tag + landing; destination in the free panel
  const a2f = clamp((L.mP.labelLeftR - 40) / u, 0.12, 0.3);
  const tagPos = () => tagHole;
  const tA = tagHole;
  const land = topAt(Pa, a2f);
  const pad = 26;
  // both focus targets contain the changed datum (the tag): 'support-tag' frames the tag and the landing point on
  // the premise; 'premise-top' frames the tag and the premise's top edge (both landings and the arrows above them)
  let src;
  if (p.focusTarget === 'premise-top') {
    const x0 = tA.x - L.tag.w - pad;
    const x1 = Math.max(topAt(Pa, 0.62).x, topAt(Pb, 0.62).x) + 16;
    const y0 = Math.min(tA.y - L.tag.h / 2, land.y - Lo * 0.75) - pad;
    const y1 = Math.max(tA.y + L.tag.h / 2, land.y + hA * 0.22) + pad;
    src = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
  } else {
    src = {x: tA.x - L.tag.w - pad, y: Math.min(tA.y - L.tag.h / 2, land.y - 36) - pad, w: (land.x + 50) - (tA.x - L.tag.w - pad), h: 0};
    src.h = Math.max(tA.y + L.tag.h / 2, land.y + 50) - src.y + pad;
  }
  src.x = Math.max(stage.x + 2, src.x);
  // destination panel
  const zoomReq = p.detailGeometry.zoom;
  let panel;
  if (L.wide) panel = {x: sceneRight + 30, y: stage.y + topH, w: stage.x + stage.w - 20 - (sceneRight + 30), h: stage.h - topH - 10};
  // stacked: the lens window may use the band area (the band's notes only appear after it has closed)
  else panel = {x: stage.x + 20, y: tableY + 60, w: stage.w - 40, h: stage.y + stage.h - 12 - (tableY + 60)};
  const z = Math.max(1.05, Math.min(zoomReq, panel.w / src.w, panel.h / src.h));
  const dest = {w: src.w * z, h: src.h * z};
  dest.x = panel.x + (panel.w - dest.w) / 2;
  dest.y = panel.y + (panel.h - dest.h) / 2;
  // the table (and its plank) stays above the notes band: wide boxes show both at once; stacked ones reuse the
  // band area for the lens only
  const bandTop = L.wide ? stage.y + stage.h - 10 : stage.y + stage.h - bandH + 10;
  const colOk = !L.wide || (band.h <= stage.h - topH - 20 && sceneRight <= colX + 10);
  const fits = colOk && sceneRight <= (L.wide ? stage.x + stage.w - 260 : stage.x + stage.w) && (L.wide || tableY + 60 + src.h * 1.3 < stage.y + stage.h - 12) && z >= (L.wide ? 1.4 : 1.3) && tagTop + L.tag.h <= boxTop - 8 && tagTop >= stage.y + topH && tableY + Math.max(30, S.s * 1.2) + 12 <= bandTop;
  return {capFit, topH, items, band, bandH, Li, Lo, tableY, boxX, boxR, footP, footC, Pa, Ca, Pb, Cb, psi, a2f, src, dest, z, panel, fits, tagPos};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1500]},
  layout(ctx) {
    const k = px1080(ctx);
    let s = 26 / k;
    let L, G;
    // smaller cards first (a lower scene), then smaller text
    outer: for (let it = 0; it < 36; it++) {
      for (const us of [1, 0.9, 0.8, 0.7, 0.6]) {
        L = compose(ctx, s, us);
        G = geometry(ctx, L);
        if (G.fits) break outer;
      }
      if (s * k <= 16.6) break;
      s = Math.max(16.5 / k, s * 0.975);
    }
    Object.assign(L, G);
    return finish(ctx, L);
  },
  build(ctx, L) {
    const C = rcColors(ctx);
    const st = stageArt(ctx, {prefix: 'stage', box: L.stage, planks: [{x0: L.stage.x - 10, x1: L.stage.x + L.stage.w + 10, y: L.tableY, t: Math.max(30, L.S.s * 1.2), kind: 'table'}], floorY: L.tableY + 60});
    return g(null,
      st.back,
      g({'clip-path': st.clip},
        L.sceneNodes('', true),
      ),
      st.frame,
      L.capNode && L.capNode.node,
      L.capNode2 && L.capNode2.node,
      L.lensObj.node,
      L.markerNode,
      L.change && L.change.node,
      L.plaque && L.plaque.node,
      L.foot && L.foot.node,
      L.issue && L.issue.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const st = sceneState(L, u);
    Object.assign(nodes, L.applyState('', st), L.applyState('z-', st));
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    // the lens window opens and closes in place, over the free panel: it never travels across the live scene, so no
    // copy of the tag or cards ever lies over the real ones (AUTHORING items 4, 19); the source frame and the
    // cone lines fade with it
    Object.assign(nodes, L.lensObj.frame(1, lp));
    const vis = r(lp, 3);
    nodes['lens-win'] = {opacity: vis};
    nodes['lens-src'] = {opacity: vis};
    nodes['lens-coneA'] = {...nodes['lens-coneA'], opacity: vis};
    nodes['lens-coneB'] = {...nodes['lens-coneB'], opacity: vis};
    // the context caption describes the before state: once the datum is replaced it is relabelled "Before — …"
    // (the old wording fades out first, then the relabelled one fades in; never both at once)
    if (L.capNode) nodes.caption = {opacity: r(seg(u, ...W.caption) * (1 - seg(u, ...W.capOut)), 3)};
    if (L.capNode2) nodes['caption-before'] = {opacity: r(seg(u, ...W.capIn), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3), transform: T(st.tagHole.x, st.tagHole.y)};
    // the notes share the lens window's area, so they appear once it has closed
    const late = [W.close[1], W.close[1] + 0.04];
    if (L.plaque) nodes.plaque = {opacity: r(seg(u, ...(late || W.caption)), 3)};
    if (L.foot) nodes.foot = {opacity: r(seg(u, ...(late || W.notes)), 3)};
    if (L.issue) nodes.issue = {opacity: r(seg(u, ...(late || W.notes)), 3)};
    if (L.change) nodes.change = {opacity: r(ease.inOutSine(seg(u, ...(late || W.ghost))), 3)};
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const semantic = {
      beat: u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.replace[1] ? 'replace' : 'back',
      focusTarget: ctx.params.focusTarget,
      value: st.newOp >= 1 ? 'after' : st.oldOp >= 1 ? 'before' : 'changing',
      valueText: st.newOp >= 1 ? ctx.params.afterValue : st.oldOp >= 1 ? ctx.params.beforeValue : null,
      oldOpacity: r(st.oldOp, 3), newOpacity: r(st.newOp, 3), overlapBoth: st.oldOp > 0.05 && st.newOp > 0.05,
      strike: r(st.strike, 3),
      ghostBefore: r(st.ghost, 3),
      lens: r(lp, 3),
      lensZoom: r(L.z, 3),
      lensSource: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
      lensContentTransform: nodes['lens-content'] ? nodes['lens-content'].transform : null,
      premiseAngle: r(st.P.angle, 2),
      claimAngle: r(st.C.angle, 2),
      box: r(st.box, 3),
      returnArrow: r(st.ret, 3),
      arrowBoxToPremise: r(st.ab, 3),
      premiseRestsOn: st.box >= 1 && st.le >= 1 ? 'outside support' : st.le > 0 ? 'moving' : 'claim',
      apex: r(dist(st.P.corners.tr, st.C.corners.tl), 2),
      tagHole: P2(st.tagHole),
      premiseTL: P2(st.P.corners.tl),
      stringEnd: P2(st.stringEnd), stringOnPremise: dist(st.stringEnd, st.P.corners.tl) < 0.5,
      marker: r(seg(u, ...W.marker), 3),
      // the lens source contains the whole changed datum (the tag) for every focus target
      lensWindow: nodes['lens-win'] ? nodes['lens-win'].opacity : null,
      // the window always sits on its destination panel, which is clear of the live tag, cards and box
      lensAtDest: nodes['lens-bg'] ? Math.abs(nodes['lens-bg'].x - r(L.dest.x)) < 0.6 && Math.abs(nodes['lens-bg'].y - r(L.dest.y)) < 0.6 : true,
      destClear: (() => {
        const d = L.dest;
        const boxes = [{x: st.tagHole.x - L.tag.w, y: st.tagHole.y - L.tag.h / 2, w: L.tag.w, h: L.tag.h}, polyBox(st.P), polyBox(st.C), {x: L.boxX, y: L.tableY - L.mB.h, w: L.bw, h: L.mB.h}];
        return boxes.every(b => b.x >= d.x + d.w || d.x >= b.x + b.w || b.y >= d.y + d.h || d.y >= b.y + b.h);
      })(),
      // how far down the stage the hold's content reaches (notes, else the table), as a fraction of the stage
      contentBottom: r((Math.max(L.tableY + 30, ...L.noteBoxes.map(b => b.y + b.h)) - L.stage.y) / L.stage.h, 3),
      layoutWide: L.wide,
      lensHasDatum: (() => { const b = {x: st.tagHole.x - L.tag.w, y: st.tagHole.y - L.tag.h / 2, w: L.tag.w, h: L.tag.h}; return b.x >= L.src.x - 0.5 && b.y >= L.src.y - 0.5 && b.x + b.w <= L.src.x + L.src.w + 0.5 && b.y + b.h <= L.src.y + L.src.h + 0.5; })(),
      caption: L.capNode ? r(seg(u, ...W.caption) * (1 - seg(u, ...W.capOut)), 3) : null,
      captionBefore: L.capNode2 ? r(seg(u, ...W.capIn), 3) : null,
      textPx: {content: r(L.S.s * L.S.k, 2), caption: r(L.S.cs * L.S.k, 2)},
    };
    return {nodes, semantic};
  },
};

/** Axis-aligned box of a pose's corners. */
function polyBox(pose) {
  const c = ['tl', 'tr', 'br', 'bl'].map(k => pose.corners[k]);
  const x = Math.min(...c.map(q => q.x)), y = Math.min(...c.map(q => q.y));
  return {x, y, w: Math.max(...c.map(q => q.x)) - x, h: Math.max(...c.map(q => q.y)) - y};
}

/** Pure state of the scene at u (shared by the context and its enlarged copy). */
function sceneState(L, u) {
  const q1 = ease.inOutSine(seg(u, ...W.arrow1));
  const q2 = ease.inOutSine(seg(u, ...W.arrow2));
  const strike = ease.inOutSine(seg(u, ...W.strike));
  const lift = ease.inOutSine(seg(u, ...W.liftOld));
  const newOp = ease.inOutSine(seg(u, ...W.newVal));
  const ghost = ease.inOutSine(seg(u, ...W.ghost));
  const ret = 1 - seg(u, ...W.retOut);
  const box = ease.outCubic(seg(u, ...W.box));
  const le = ease.inOutCubic(seg(u, ...W.relean));
  const ab = ease.inOutSine(seg(u, ...W.arrowB));
  const apc = ease.inOutSine(seg(u, ...W.arrowPC));
  const pc1 = 1 - seg(u, W.relean[0] - 0.02, W.relean[0] + 0.01);
  // premise: from leaning right (on the claim) through upright to leaning left (on the box)
  const angP = lerp(TH, -TH, le);
  const P = leanPose(L.u, L.hA, L.footP, L.tableY, angP);
  const C = leanPose(L.u, L.hA, L.footC, L.tableY, lerp(-TH, -L.psi, le));
  const tp = L.tagPos();
  const mark = ease.inOutSine(seg(u, ...W.marker));
  return {q1, q2, strike, lift, mark, oldOp: 1 - lift, newOp, ghost, ret, box, le, ab, apc, pc1, P, C, tagHole: tp, stringEnd: P.corners.tl};
}

function finish(ctx, L) {
  const p = ctx.params;
  const t = ctx.t;
  const C = rcColors(ctx);
  const {S} = L;
  const W8 = Math.max(8, S.s * 0.34);
  // arrows: A-frame loop (premise → claim, claim → premise) and, after the change, box → premise and premise → claim
  const aP = topAt(L.Pa, 0.74), aC = topAt(L.Ca, 0.26), rC = topAt(L.Ca, 0.7), rP = topAt(L.Pa, L.a2f);
  const bT = {x: L.boxX + L.bw * 0.55, y: L.tableY - L.mB.h + 2};
  const pts = {
    ar1: arcPts(aP, aC, L.Li), ar2: arcPts(rC, rP, L.Lo),
    arB: arcPts(bT, topAt(L.Pb, L.a2f), L.Li), arPC: arcPts(topAt(L.Pb, 0.74), topAt(L.Cb, 0.26), L.Li),
  };
  const mk = pfx => ({
    ar1: ribbonArrow(ctx, {name: `${pfx}ar1`, pts: pts.ar1, color: C.loop, width: W8, travel: true}),
    ar2: ribbonArrow(ctx, {name: `${pfx}ar2`, pts: pts.ar2, color: C.loop, width: W8, travel: true}),
    arB: ribbonArrow(ctx, {name: `${pfx}arB`, pts: pts.arB, color: C.chain, width: W8, travel: true}),
    arPC: ribbonArrow(ctx, {name: `${pfx}arPC`, pts: pts.arPC, color: C.chain, width: W8, travel: true}),
  });
  L.arrows = {'': mk(''), 'z-': mk('z-')};
  // ghost "before" note under the tag (content: the before value, struck)
  L.sceneNodes = (pfx, named) => {
    const nm = s => `${pfx}${s}`;
    const cards = g(null,
      g({name: nm('box'), opacity: 0}, boxArt(ctx, {m: L.mB, name: named ? 'bx' : undefined, named})),
      g({name: nm('P')}, cardArt(ctx, {name: named ? 'cardP' : undefined, named, m: L.mP, kind: 'premise', color: C.premise, idKey: `${pfx}p`, labelRight: true})),
      g({name: nm('C')}, cardArt(ctx, {name: named ? 'cardC' : undefined, named, m: L.mC, kind: 'claim', color: C.claim, look: L.look, idKey: `${pfx}c`})),
    );
    const A = L.arrows[pfx];
    const tag = g({name: nm('tag')},
      h('path', {name: nm('string'), fill: 'none', stroke: '#6b5234', 'stroke-width': 3}),
      tagArt(ctx, L.tag, pfx, L.show),
    );
    // the enlarged copy is the same scene (same poses, same texts): a true copy of its source region
    return g(null, cards, A.ar1.node, A.ar2.node, A.arB.node, A.arPC.node, tag);
  };
  L.applyState = (pfx, st) => {
    const out = {};
    const nm = s => `${pfx}${s}`;
    out[nm('P')] = {transform: st.P.transform};
    out[nm('C')] = {transform: st.C.transform};
    out[nm('box')] = {opacity: st.box > 0 ? 1 : 0, transform: T(L.boxX - (L.boxX + L.bw + 40 - L.stage.x) * (1 - st.box), L.tableY)};
    const A = L.arrows[pfx];
    Object.assign(out, A.ar1.frame(st.q1, st.pc1), A.ar2.frame(st.q2, st.ret), A.arB.frame(st.ab), A.arPC.frame(st.apc));
    const hole = st.tagHole;
    out[nm('tag')] = {transform: T(hole.x, hole.y)};
    const anchor = st.P.corners.tl;
    out[nm('string')] = {d: `M0 0Q${r((anchor.x - hole.x) * 0.5)} ${r((anchor.y - hole.y) * 0.5 + 10)} ${r(anchor.x - hole.x)} ${r(anchor.y - hole.y)}`};
    if (L.show) {
      out[nm('old')] = {opacity: r(st.oldOp, 3), transform: T(0, -14 * st.lift)};
      out[nm('strike')] = {'stroke-dashoffset': r(2000 * (1 - st.strike))};
      out[nm('new')] = {opacity: r(st.newOp, 3)};
    }
    if (L.show && L.tag.gf) out[nm('ghost')] = {opacity: r(st.ghost, 3)};
    if (L.show && L.tag.mf) out[nm('mark')] = {opacity: r(st.mark, 3)};
    return out;
  };
  // enlarged copy for the lens (same coordinates)
  const copy = g(null, h('rect', {x: -4000, y: -4000, width: 8000, height: 8000, fill: C.wall}), L.sceneNodes('z-', false));
  L.lensObj = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: copy, frame: L.stage, radius: 22, color: C.loop});
  // context caption
  if (L.capFit) L.capNode = chip(ctx, p.contextLabels.context, {x: L.stage.x + 20, y: L.stage.y + 12, maxWidth: L.wide ? L.stage.w * 0.55 : L.stage.w - 40, size: S.cs, minSize: S.cs, maxLines: 3, name: 'caption'});
  if (L.capFit) L.capNode2 = chip(ctx, `${t.before} — ${p.contextLabels.context}`, {x: L.stage.x + 20, y: L.stage.y + 12, maxWidth: L.wide ? L.stage.w * 0.55 : L.stage.w - 40, size: S.cs, minSize: S.cs, maxLines: 3, name: 'caption-before', fill: '#efe9dd'});
  // Δ marker on the tag (neutral glyph + supplied label)
  const mr = Math.max(16, S.s * 0.7);
  L.markerNode = g({name: 'marker', opacity: 0},
    h('circle', {cx: r(-mr * 0.2), cy: r(-L.tag.h / 2 + mr * 0.2), r: r(mr), fill: ctx.theme.accent2, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: `M${r(-mr * 0.2)} ${r(-L.tag.h / 2 + mr * 0.2 - mr * 0.55)}L${r(-mr * 0.2 + mr * 0.55)} ${r(-L.tag.h / 2 + mr * 0.2 + mr * 0.4)}H${r(-mr * 0.2 - mr * 0.55)}Z`, fill: 'none', stroke: '#ffffff', 'stroke-width': 2.8, 'stroke-linejoin': 'round'}));
  // bottom notes
  // stacked: the notes sit on the floor just under the table (they appear once the lens window below has closed)
  // stacked: the notes sit on the floor under the table, centred in it (they appear once the lens window below has
  // closed)
  const floorTop = L.tableY + Math.max(30, S.s * 1.2) + 30;
  const bandY = L.wide ? L.stage.y + L.topH + (L.stage.h - L.topH - L.band.h) / 2 : Math.max(floorTop, Math.min(L.stage.y + L.stage.h - L.bandH + 10, floorTop + (L.stage.y + L.stage.h - 12 - floorTop - L.band.h) / 2));
  const pos = Object.fromEntries(L.items.map((it, i) => [it.id, {x: L.band.pos[i].x, y: bandY + L.band.pos[i].y, it}]));
  if (pos.plaque) L.plaque = plaqueArt(ctx, {name: 'plaque', m: pos.plaque.it.m, x: pos.plaque.x + 7, y: pos.plaque.y + 30});
  if (pos.foot) L.foot = footArt(ctx, {name: 'foot', text: pos.foot.it.text, x: pos.foot.x, y: pos.foot.y, size: S.cs, maxWidth: pos.foot.it.mw, maxLines: 12});
  if (pos.change) {
    const {mf, gf} = pos.change.it;
    const x = pos.change.x, y = pos.change.y, cs = S.cs;
    const tx = x + cs * 2.1;
    let ty = y + cs * 0.55;
    const parts = [
      h('path', {d: roundRectPath(x, y, pos.change.it.w, pos.change.it.h, 8), fill: '#fbf8f1', stroke: '#8c959f', 'stroke-width': 1.8}),
      h('circle', {cx: r(x + cs * 1.05), cy: r(y + cs * 1.05), r: r(cs * 0.62), fill: ctx.theme.accent2, stroke: INK, 'stroke-width': 2}),
      h('path', {d: `M${r(x + cs * 1.05)} ${r(y + cs * 0.72)}L${r(x + cs * 1.4)} ${r(y + cs * 1.3)}H${r(x + cs * 0.7)}Z`, fill: 'none', stroke: '#ffffff', 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    ];
    if (mf) { parts.push(textBlock(mf, {x: tx, y: ty, fill: INK, name: 'change-mark'})); ty += mf.height + cs * 0.35; }
    parts.push(textBlock(gf, {x: tx, y: ty, fill: '#57606a', name: 'change-before'}));
    parts.push(h('path', {d: gf.lines.map((ln, i) => `M${r(tx - 2)} ${r(ty + i * gf.lineHeight + gf.size * 0.5)}h${r(ctx.measure(ln, gf.size, 500, 'sans') + 4)}`).join(''), stroke: '#57606a', 'stroke-width': 2}));
    L.change = {node: g({name: 'change', opacity: 0}, parts), box: {x, y, w: pos.change.it.w, h: pos.change.it.h}};
  }
  if (pos.issue) L.issue = noteArt(ctx, {name: 'issue', text: pos.issue.it.text, x: pos.issue.x, y: pos.issue.y + 4, maxWidth: pos.issue.it.mw, size: S.cs, maxLines: 6});
  L.noteBoxes = [L.plaque && L.plaque.box, L.foot && L.foot.box, L.change && L.change.box, L.issue && L.issue.box].filter(Boolean);
  return L;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-07-inspect',
    title: 'Circular reasoning — the premise’s “rests on” tag under a lens: the claim itself replaced by an outside record',
    titleEs: 'Razonamiento circular — Inspección y cambio de un dato',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Razonamiento circular',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The state after the action: premise and claim lean on each other and the support arrow returns to the premise. A lens opens a real enlarged copy of the premise’s “rests on” tag and the arrow landing; the supplied before value is struck and kept as a struck note, the after value appears, and only the dependent geometry changes — the returning arrow fades, an archive box slides in, the premise re-leans onto it and the chain arrows draw. The lens closes back onto the context with a neutral Δ marker. Seeking back restores the before value exactly.',
    tags: ['reasoning', 'circular reasoning', 'inspect', 'lens', 'substitution', 'premise', 'outside record', 'tag'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/razonamiento-circular.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
