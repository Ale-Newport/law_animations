/**
 * LAW-0518 — Cláusula de cambio · mechanism
 *
 * Storyboard (an exploded, layered view: the contract slab at the base, a column of step gates above it, the amendment
 * layer at the top; a key column at the right names each part):
 *  0.00–0.15  rest: the contract slab ("CT-517 · Supply contract (fictional)" on its front face) with the change-clause
 *             tab standing on its back-right corner; one gate ring per supplied step stacked above the slab, each held
 *             by a bracket on the post that rises from the clause tab; the amendment layer "Amendment 1 (fictional)"
 *             floats above the top gate. The key column lists the steps (with their pips) and the clause.
 *  0.12–0.30  the post lights from the clause tab upward through every bracket (the clause sets out the column of
 *             steps; a plain relation, no arrow); a tracer dot runs up the post.
 *  0.30–0.66  the layer descends: it passes through each gate in the supplied order; as it passes, the ring lights, the
 *             step's key entry enlarges and the layer gains one edge band (capas).
 *  0.66–0.75  the layer settles on the slab as its new top layer; the slab rim lights.
 *  0.75–1.00  hold: the stacked contract (one edge band per step), the lit post, the note "The amendment layer passed each
 *             supplied step" and the key "As supplied · no conclusion drawn".
 * Only the supplied steps; no doctrine on the validity or effect of a change; no outcome.
 * @module animations/contract-terms/LAW-0518
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {roundRectPath} from '../../core/geometry.js';
import {list, annotation} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseField, stepsField, proposalField, localizeScene, unitPx, T, fitG, txt,
  changeGlyph, pips, notesStrip, facePts, ptsD, obliqueSlab, gateRing, bx,
} from './kits/clausula-cambio.js';

const ID = 'LAW-0518';
const DURATION = 7000;
const BEATS = {rest: [0, 0.15], relation: [0.15, 0.42], traverse: [0.42, 0.73], hold: [0.73, 1]};
const W = {spine: [0.12, 0.3], descend: [0.3, 0.66], land: [0.66, 0.735], slab: [0.72, 0.76], note: [0.755, 0.8], key: [0.77, 0.81], ann: [0.78, 0.82]};
const STRINGS = {
  en: {...KIT_STRINGS.en, passed: 'The amendment layer passed each supplied step', clauseKey: 'sets out the steps'},
  es: {...KIT_STRINGS.es, passed: 'La capa de modificación pasó por cada paso aportado', clauseKey: 'fija los pasos'},
};

const sceneSchema = {
  contract: contractField,
  clause: clauseField,
  steps: stepsField,
  proposal: proposalField,
  annotations: list('Editorial callouts shown in the final hold', annotation(['contract', 'proposal', 'steps']), 0, 2),
};
const defaultParams = {...CONTENT, annotations: []};
const defaultParamsEs = {...CONTENT_ES};

const isStress = p => [p.contract.title, p.clause, p.proposal, ...p.steps].some(t => t.length > 44) || p.annotations.length > 1;

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14;
  const n = p.steps.length;
  const notes = [];
  if (show) notes.push({name: 'note', kind: 'note0', text: ctx.t.passed, fill: ctx.theme.accent2Soft});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const ns = notesStrip(ctx, notes, F, minF);
  const A = {x: pad, y: pad + 8, w: D.w - pad * 2, h: D.h - pad * 2 - 8 - (ns.nh ? ns.nh + 20 : 0)};
  const regW = A.w * (shape === 'portrait' ? 0.6 : 0.6);
  const colX = A.x + regW + 24, colW = A.x + A.w - colX;
  // slab
  const n0 = n;
  const thMax = 10 + n0 * 8;
  const Ws0 = regW * 0.86 - 14;
  const Wl = Ws0 * 0.68;
  const prop = fitG(p.proposal, {maxWidth: Wl - 40, size: F, minSize: minF, maxLines: 3, weight: 800});
  const loy = Math.max(prop.height + 34, regW * 0.07);
  const oyS = Math.max(regW * 0.115, loy + thMax + 26);
  const oxS = Math.min(oyS / 0.72, regW * 0.3);
  const Ws = regW - oxS - 14;
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: Ws - 40, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 800});
  const thS = head.height + 30;
  const sx = A.x + 4, sy = A.y + A.h - thS - 16;
  // layer footprint (lands on the slab's top face, its bands clear of the front edge)
  const lox = oxS * (loy / oyS);
  const fx = sx + (Ws - Wl) * 0.3 + (oxS - lox) * 0.5;
  const yLand = sy - (oyS - loy - thMax) / 2 - thMax;
  if (Wl > Ws - 20) why.push('footprint');
  const bw = clamp(F * 0.7, 12, 18);
  const y0 = A.y + loy + 14;
  const S = (yLand - y0) / (n + 1);
  if (S < loy * 0.45 + thMax + 18) why.push('levels');
  const levels = Array.from({length: n}, (_, i) => y0 + S * (i + 1));
  // post (rod) from the clause tab, right of the rings
  const rodX = fx + Wl + lox * 0.55 + bw + 34;
  if (rodX > sx + Ws + oxS - 20) why.push('rod');
  const tabY = sy - oyS * 0.55; // on the slab's top face
  // key column: one chip per step at its level; the clause entry at the slab
  const pipR = clamp(F * 0.3, 6, 9);
  const stepFits = p.steps.map(s => fitG(s, {maxWidth: colW - 30, size: F, minSize: minF, maxLines: 3, weight: 700}));
  const chips = stepFits.map((f, i) => {
    const hgt = f.height + pipR * 2 + 30;
    const cy = levels[i] - loy * 0.5;
    return {x: colX, y: cy - hgt / 2, w: Math.min(colW, Math.max(f.width + 30, pipR * 3 * (i + 1) + 30, colW * 0.6)), h: hgt, fit: f, k: i};
  });
  const clauseFit = fitG(p.clause, {maxWidth: colW - 30 - F * 2.2, size: F, minSize: minF, maxLines: 3, weight: 700});
  const ckFit = fitG(ctx.t.clauseKey, {maxWidth: colW - 30, size: Math.max(F * 0.9, minF), minSize: minF, maxLines: 2, weight: 500});
  const chH = Math.max(clauseFit.height, F * 2) + (show ? ckFit.height + 8 : 0) + 26;
  const clauseChip = {x: colX, y: Math.min(sy - oyS * 0.55 - chH / 2, A.y + A.h - chH), w: colW, h: chH, fit: clauseFit};
  for (let i = 0; i < chips.length; i++) {
    const c = chips[i];
    if (c.y < A.y) c.y = A.y;
    if (i && c.y < chips[i - 1].y + chips[i - 1].h + 10) why.push('chips');
  }
  if (chips.length && chips[n - 1].y + chips[n - 1].h + 10 > clauseChip.y) why.push('chips-clause');
  const {pl, bad} = ns.place();
  if (bad) why.push('note-text');
  if ([head, prop, clauseFit, ...stepFits].some(f => f.bad)) why.push('text');
  return {ok: !why.length, why, F, minF, n, A, regW, colX, colW, oxS, oyS, Ws, thS, sx, sy, head, Wl, lox, loy, fx, yLand, bw, thMax, y0, levels, rodX, tabY, pipR, chips, clauseChip, ckFit, prop, notesPl: pl};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1600]},
  layout(ctx) {
    const upx = unitPx(ctx);
    const stress = isStress(ctx.params);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [26, 24, 22.5, 21, 20.2]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const show = ctx.show('all');
    const n = L.n;
    // slab with filler lines on its top face
    const lines = [];
    for (let k = 1; k <= 4; k++) {
      const t = k / 5;
      const a = {x: L.oxS * t + 26, y: -L.oyS * t}, b = {x: L.Ws * 0.55 + L.oxS * t, y: -L.oyS * t};
      lines.push(`M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`);
    }
    const slab = g({transform: T(L.sx, L.sy)},
      obliqueSlab({w: L.Ws, ox: L.oxS, oy: L.oyS, th: L.thS, top: '#fdfbf5', front: th.accent4Soft, side: '#e2dac8', shadow: th.shadow, lines: lines.join('')}),
      h('path', {name: 'slab-rim', d: ptsD(facePts(0, 0, L.Ws, L.oxS, L.oyS)), fill: 'none', stroke: th.accent2, 'stroke-width': 5, opacity: 0}),
      show ? txt(L.head, {x: 20, y: (L.thS - L.head.height) / 2, fill: INK}) : h('path', {d: `M20 ${r(L.thS / 2)}h${r(Math.min(L.Ws * 0.5, 300))}`, stroke: '#9fb08f', 'stroke-width': 10, 'stroke-linecap': 'round'}),
    );
    // landing footprint (outline on the slab)
    const foot = h('path', {d: ptsD(facePts(L.fx, L.yLand, L.Wl, L.lox, L.loy)), fill: 'none', stroke: '#cdbfa6', 'stroke-width': 2.4});
    // clause tab on the slab (a raised block with the change disc) and the post
    const tabW = 54, tabH = 26;
    const R = 17;
    const tab = g(null,
      h('path', {d: roundRectPath(L.rodX - tabW / 2, L.tabY - tabH, tabW, tabH + 12, 6), fill: th.accent2Soft, stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: r(L.rodX), cy: r(L.tabY - tabH - R + 6), r: R, fill: th.accent2, stroke: INK, 'stroke-width': 2}),
      changeGlyph(L.rodX, L.tabY - tabH - R + 6, R * 0.55, '#fff', 2),
    );
    const topY = L.levels[0] - L.loy * 0.5 - 10;
    const postBase = L.tabY - tabH - R * 2 + 6;
    const postD = `M${r(L.rodX)} ${r(postBase)}V${r(topY)}`;
    const postLen = postBase - topY;
    const post = g(null,
      h('path', {d: postD, stroke: '#8a919a', 'stroke-width': 9, 'stroke-linecap': 'round'}),
      h('path', {name: 'post-lit', d: postD, stroke: th.accent2, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(postLen + 2)} ${r(postLen + 30)}`, 'stroke-dashoffset': r(postLen + 2)}),
    );
    // rings (under copies; over copies toggle when the layer has passed below)
    const rings = L.levels.map((y, i) => gateRing(ctx, {w: L.Wl, ox: L.lox, oy: L.loy, bw: L.bw, litName: `ring${i}`, pips: i + 1}));
    const ringsOver = L.levels.map((y, i) => gateRing(ctx, {w: L.Wl, ox: L.lox, oy: L.loy, bw: L.bw, litName: `ringo${i}`, pips: i + 1}));
    const brackets = L.levels.map(y => {
      const rx = L.fx + L.Wl + L.lox * 0.5 + L.bw * 0.7, ry = y - L.loy * 0.5;
      return h('path', {d: `M${r(rx)} ${r(ry)}H${r(L.rodX)}`, stroke: '#6c747d', 'stroke-width': 6, 'stroke-linecap': 'round'});
    });
    // leaders (plain relation lines) from each ring's bracket to its key chip, and from the tab to the clause entry
    const leaders = L.chips.map((c, i) => {
      const y = L.levels[i] - L.loy * 0.5;
      return h('path', {d: `M${r(L.rodX + 8)} ${r(y)}H${r(c.x - 6)}`, stroke: '#9aa3ad', 'stroke-width': 2.4});
    });
    const C = L.clauseChip;
    leaders.push(h('path', {d: `M${r(L.rodX + tabW / 2)} ${r(L.tabY - tabH / 2)}L${r(C.x - 6)} ${r(C.y + C.h / 2)}`, stroke: '#9aa3ad', 'stroke-width': 2.4}));
    const chipNodes = L.chips.map((c, i) => g({name: `chip${i}`, transform: 'translate(0 0)'},
      h('path', {d: roundRectPath(c.x + 5, c.y + 7, c.w, c.h, 10), fill: th.shadow}),
      h('path', {d: roundRectPath(c.x, c.y, c.w, c.h, 10), fill: '#fffdf7', stroke: INK, 'stroke-width': 2.2}),
      h('path', {name: `chip${i}-hl`, d: roundRectPath(c.x - 4, c.y - 4, c.w + 8, c.h + 8, 13), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      pips(i + 1, c.x + 15 + (i * L.pipR * 2.8) / 2 + L.pipR, c.y + 12 + L.pipR, L.pipR, th.accent2),
      show ? txt(c.fit, {x: c.x + 15, y: c.y + L.pipR * 2 + 20, fill: INK}) : h('path', {d: `M${r(c.x + 15)} ${r(c.y + L.pipR * 2 + 30)}h${r(Math.min(c.w - 30, 150))}`, stroke: '#d6cfc0', 'stroke-width': 10, 'stroke-linecap': 'round'}),
    ));
    const clauseNode = g(null,
      h('path', {d: roundRectPath(C.x + 5, C.y + 7, C.w, C.h, 10), fill: th.shadow}),
      h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, 10), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
      h('rect', {x: r(C.x), y: r(C.y), width: 9, height: r(C.h), rx: 4, fill: th.accent2}),
      h('circle', {cx: r(C.x + 20 + L.F * 0.8), cy: r(C.y + 13 + L.F * 0.8), r: r(L.F * 0.8), fill: th.accent2, stroke: INK, 'stroke-width': 2}),
      changeGlyph(C.x + 20 + L.F * 0.8, C.y + 13 + L.F * 0.8, L.F * 0.45, '#fff', 2),
      show ? txt(C.fit, {x: C.x + 30 + L.F * 1.6, y: C.y + 13, fill: INK}) : h('path', {d: `M${r(C.x + 30 + L.F * 1.6)} ${r(C.y + 13 + L.F * 0.8)}h${r(Math.min(C.w * 0.5, 160))}`, stroke: '#cdbfa6', 'stroke-width': 10, 'stroke-linecap': 'round'}),
      show ? txt(L.ckFit, {x: C.x + 30 + L.F * 1.6, y: C.y + 13 + Math.max(C.fit.height, L.F * 1.6) + 8, fill: th.fgSoft ?? '#5b6470'}) : null,
    );
    // the amendment layer (front-left of its top face at its own origin)
    const bands = Array.from({length: n}, (_, k) => h('path', {name: `band${k}`, d: ptsD([{x: 0, y: 10 + k * 8}, {x: L.Wl, y: 10 + k * 8}, {x: L.Wl, y: 18 + k * 8}, {x: 0, y: 18 + k * 8}]), fill: k % 2 ? th.accent2 : shade2(th.accent2), stroke: INK, 'stroke-width': 1.4, opacity: 0}));
    const layer = g({name: 'layer', transform: T(L.fx, L.y0)},
      h('path', {d: ptsD([{x: 8, y: 12}, {x: L.Wl + 8, y: 12}, {x: L.Wl + L.lox + 8, y: 12 - L.loy}, {x: L.Wl + L.lox + 8, y: 22 - L.loy}, {x: L.Wl + 8, y: 22}, {x: 8, y: 22}]), fill: th.shadow}),
      bands,
      h('path', {d: ptsD([{x: L.Wl, y: 0}, {x: L.Wl + L.lox, y: -L.loy}, {x: L.Wl + L.lox, y: 10 - L.loy}, {x: L.Wl, y: 10}]), fill: '#cfdeec', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('path', {d: ptsD([{x: 0, y: 0}, {x: L.Wl, y: 0}, {x: L.Wl, y: 10}, {x: 0, y: 10}]), fill: '#e3edf7', stroke: INK, 'stroke-width': 2}),
      h('path', {d: ptsD(facePts(0, 0, L.Wl, L.lox, L.loy)), fill: '#f6faff', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      changeGlyph(L.lox * 0.75 + 22, -L.loy + 18, 9, th.accent2, 2),
      show ? txt(L.prop, {x: L.Wl / 2 + L.lox / 2, y: -L.loy / 2 - L.prop.height / 2, anchor: 'middle', fill: INK}) : h('path', {d: `M${r(L.Wl * 0.3 + L.lox / 2)} ${r(-L.loy / 2)}H${r(L.Wl * 0.7 + L.lox / 2)}`, stroke: '#b9c7d6', 'stroke-width': 10, 'stroke-linecap': 'round'}),
    );
    const ringAt = (rg, y, part, name) => g({name, transform: T(L.fx, y)}, part === 'back' ? rg.back : part === 'front' ? rg.front : [rg.back, rg.front]);
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'},
      slab, foot, leaders, tab, post, brackets,
      h('circle', {name: 'tracer', cx: r(L.rodX), cy: r(postBase), r: 11, fill: '#ffffff', stroke: th.accent2, 'stroke-width': 5, opacity: 0}),
      rings.map((rg, i) => ringAt(rg, L.levels[i], 'both')),
      layer,
      ringsOver.map((rg, i) => g({name: `over${i}`, opacity: 0}, ringAt(rg, L.levels[i], 'front'))),
      ringsOver.map((rg, i) => g({name: `overall${i}`, opacity: 0}, ringAt(gateRing(ctx, {w: L.Wl, ox: L.lox, oy: L.loy, bw: L.bw, litName: `ringa${i}`, pips: i + 1}), L.levels[i], 'both'))),
      clauseNode, chipNodes, notes,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const n = L.n;
    const sq = ease.inOutSine(seg(u, ...W.spine));
    const topY = L.levels[0] - L.loy * 0.5 - 10;
    const postBase = L.tabY - 26 - 34 + 6;
    const postLen = postBase - topY;
    nodes['post-lit'] = {'stroke-dashoffset': r((postLen + 2) * (1 - sq))};
    nodes.tracer = {cy: r(postBase - postLen * sq), opacity: sq > 0 && sq < 1 ? 1 : 0};
    // descent: per gate, move to its level then pass
    const [t0, t1] = W.descend;
    const d = (t1 - t0) / n;
    let y = L.y0, passed = 0, focus = -1;
    for (let k = 0; k < n; k++) {
      const a = t0 + k * d;
      const mv = ease.inOutSine(seg(u, a, a + d * 0.6));
      const from = k ? L.levels[k - 1] : L.y0;
      if (u >= a) y = lerp(from, L.levels[k], mv);
      const lit = seg(u, a + d * 0.5, a + d * 0.62);
      const on = lit > 0 ? 1 : 0;
      passed += lit >= 1 ? 1 : 0;
      nodes[`band${k}`] = {opacity: lit >= 1 ? 1 : 0};
      for (const nm of [`ring${k}-b`, `ring${k}-f`, `ringo${k}-f`, `ringa${k}-b`, `ringa${k}-f`]) nodes[nm] = {opacity: r(0.6 * lit, 3)};
      const fq = Math.sin(clamp(seg(u, a + d * 0.45, a + d * 1.0)) * Math.PI);
      if (fq > 0) focus = k;
      const c = L.chips[k];
      const sc = 1 + 0.06 * fq;
      const cx = c.x, cy = c.y + c.h / 2;
      nodes[`chip${k}`] = {transform: `translate(${r(cx * (1 - sc), 2)} ${r(cy * (1 - sc), 2)}) scale(${r(sc, 4)})`};
      nodes[`chip${k}-hl`] = {opacity: r(Math.max(fq, lit >= 1 ? 0.0 : 0), 3)};
      void on;
    }
    const lq = ease.inOutSine(seg(u, ...W.land));
    if (lq > 0) y = lerp(L.levels[n - 1], L.yLand, lq);
    nodes.layer = {transform: T(r(L.fx, 2), r(y, 2))};
    // z-order of the rings relative to the layer: front strip over the layer while it passes, whole ring once below
    const th = 10 + passed * 8;
    L.levels.forEach((ly, k) => {
      nodes[`over${k}`] = {opacity: y >= ly - L.loy * 0.25 && y < ly + th + L.bw ? 1 : 0};
      nodes[`overall${k}`] = {opacity: y >= ly + th + L.bw ? 1 : 0};
    });
    nodes['slab-rim'] = {opacity: r(seg(u, ...W.slab), 3)};
    const noteO = seg(u, ...W.note), keyO = seg(u, ...W.key), annO = seg(u, ...W.ann);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'ann' ? annO : noteO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.relation[1] ? 'relation' : u < BEATS.traverse[1] ? 'traverse' : 'hold';
    const tracer = {x: r(L.rodX), y: r(postBase - postLen * sq)};
    return {
      nodes,
      semantic: {
        beat, steps: n, bands: passed, focus, spine: r(sq, 3), landed: lq >= 1, tracer,
        layer: {x: r(L.fx + L.Wl / 2), y: r(y)}, levels: L.levels.map(v => r(v)), yLand: r(L.yLand), y0: r(L.y0),
        chipBoxes: L.chips.map(bx), clauseBox: bx(L.clauseChip), slabRim: r(seg(u, ...W.slab), 3), keyShown: r(keyO, 3),
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
      },
    };
  },
};

function shade2(c) { return c === '#2f6690' ? '#4d84ad' : c; }

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-10-mechanism',
    title: 'Change clause, procedure only — exploded layers: the clause tab holds a column of step gates; the amendment layer descends through each gate, gaining one edge band per supplied step, and settles on the contract slab',
    titleEs: 'Cláusula de cambio — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de cambio',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded, layered view. The contract slab carries the change-clause tab; a post rising from the tab holds one gate ring per supplied step; the amendment layer floats above. The post lights from the clause upward (plain relation). The layer descends through the gates in the supplied order: each ring lights, its key entry enlarges and the layer gains an edge band. It settles on the slab as a new top layer. Note "The amendment layer passed each supplied step"; key "As supplied · no conclusion drawn". No doctrine on validity or effect; no outcome.',
    tags: ['change clause', 'amendment', 'variation procedure', 'layers', 'exploded view', 'gates', 'mechanism'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-cambio.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
