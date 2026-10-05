/**
 * LAW-0510 — Ley y foro pactados · mechanism
 *
 * Storyboard (a split tree: the contract as root, two separate clause cards, two destination plaques):
 *  0.00–0.12  components at rest: the contract card "CT-508 · Contract (fictional)" (two clause bands marked by their
 *             glyphs), the two clause cards drawn as layered sheets (capas) — "Clause 14 · Choice of law" and "Clause 15 ·
 *             Choice of forum" — and the two plaques "Law X (fictional)" / "Forum Y (fictional)". Landscape: root left,
 *             clauses in the middle (upper / lower), plaques right; portrait and square: root on top, clauses in a middle
 *             row, plaques in a bottom row.
 *  0.12–0.30  plain relation links (no arrowheads) are drawn from the contract's edge to each clause card, labelled
 *             "in the contract".
 *  0.30–0.52  route 1: a tracer leaves the contract, reaches the first clause card (the loupe moves over it and the card
 *             enlarges: focus), then the link "points to" is drawn to its own plaque and the tracer follows it there.
 *  0.52–0.72  route 2: the same for the second clause and the other plaque. No link is ever drawn between the two clauses
 *             or between the two plaques.
 *  0.72–1.00  hold: every link visible; a neutral seam between the two clause cards; note "Two separate clauses · each
 *             points to its own choice"; key "As supplied · no conclusion drawn".
 * Relations are plain (association, not causation). No conflict-of-laws or jurisdiction doctrine, no real places or
 * courts, no validity, priority or outcome; neither clause decides the other.
 * @module animations/contract-terms/LAW-0510
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath, edgeAnchor, polyline} from '../../core/geometry.js';
import {list, oneOf, annotation} from '../../schemas/fields.js';
import {connector, tracer} from '../../primitives/annotate.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clausesField, destinationsField, localizeScene, unitPx, fitG, chipG, txt,
  glyphDisc, plaque, plaqueTop, plaqueTextX, stackedPlaqueH, loupe, loupeBox, laneColor, laneSoft, overlaps,
} from './kits/ley-y-foro.js';

const ID = 'LAW-0510';
const DURATION = 6500;
const BEATS = {rest: [0, 0.12], relate: [0.12, 0.3], route1: [0.3, 0.52], route2: [0.52, 0.72], hold: [0.72, 1]};
const W = {
  links: [0.12, 0.28], labs0: [0.24, 0.3],
  r1a: [0.3, 0.37], f1: [0.36, 0.42], r1l: [0.4, 0.47], r1b: [0.42, 0.5], lit1: [0.49, 0.52],
  r2a: [0.52, 0.58], f2: [0.57, 0.63], r2l: [0.61, 0.67], r2b: [0.63, 0.7], lit2: [0.69, 0.72],
  park: [0.68, 0.79], seam: [0.72, 0.77], note: [0.74, 0.79], key: [0.76, 0.81], ann: [0.78, 0.83],
};
const STRINGS = {
  en: {...KIT_STRINGS.en, holds: 'in the contract', points: 'points to'},
  es: {...KIT_STRINGS.es, holds: 'en el contrato', points: 'apunta a'},
};

const sceneSchema = {
  contract: contractField,
  clauses: clausesField,
  destinations: destinationsField,
  order: oneOf('Traversal order of the two routes (law-first or forum-first); each route only reaches its own plaque', ['law-first', 'forum-first']),
  annotations: list('Editorial callouts shown in the final hold', annotation(['law', 'forum', 'contract']), 0, 2),
};
const defaultParams = {...CONTENT, order: 'law-first', annotations: []};
const defaultParamsEs = {...CONTENT_ES};

const isStress = p => [p.contract.title, p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum].some(t => t.length > 40) || p.annotations.length > 1;
const KINDS = ['law', 'forum'];

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const hz = ctx.view.shape === 'landscape';
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14;
  const notes = [];
  if (show) notes.push({name: 'sep', kind: 'note0', text: ctx.t.separate});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const gap = 12;
  const cols = notes.length > 1 ? Math.min(notes.length, hz ? 3 : ctx.view.shape === 'square' ? 2 : 1) : 1;
  const cw = (D.w - pad * 2 - gap * (cols - 1)) / cols;
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: Math.max(F * 0.95, minF), minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'note0' ? ctx.theme.accent4Soft : '#ffffff'});
  const rowsN = Math.ceil(notes.length / cols);
  const sizes = notes.map(q => chipOf(q, 0, 0, cw).box.h);
  const nh = notes.length ? Array.from({length: rowsN}, (_, k) => Math.max(...sizes.slice(k * cols, k * cols + cols))).reduce((a, b) => a + b + gap, -gap) : 0;
  const A = {x: pad, y: pad + 8, w: D.w - pad * 2, h: D.h - pad * 2 - 8 - (nh ? nh + 22 : 0)};
  const discR = clamp(F * 1.1, 20, 30);
  const pR = discR * (hz ? 1.45 : 1.6);
  const sqStack = false;
  // boxes
  let root, cards = {}, plq = {};
  const sqr = ctx.view.shape === 'square';
  const colW = hz ? A.w * (sqr ? 0.27 : 0.25) : A.w;
  const rootW = hz ? colW : Math.min(A.w * 0.62, 640);
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: rootW - 44, size: F, minSize: minF, maxLines: stress ? 4 : 2, weight: 800});
  const rootH = head.height + 30 + 2 * (discR * 2 + 22) + (hz ? 30 : sqr ? 40 : 90);
  const cardW = hz ? A.w * (sqr ? 0.3 : 0.27) : (A.w - 70) / 2;
  const cFit = k => fitG(p.clauses[k], {maxWidth: cardW - 30 - discR * 2 - 14 - 26, size: F, minSize: F, maxLines: stress ? 3 : 2, weight: 700});
  const cFits = {law: cFit('law'), forum: cFit('forum')};
  const cardH = Math.max(cFits.law.height, cFits.forum.height, discR * 2) + 40 + (hz ? 3 : sqr ? 3 : 7) * 22 + 10;
  const plW = hz ? A.w * (sqr ? 0.3 : 0.27) : (A.w - 70) / 2;
  const pFit = k => fitG(p.destinations[k], {maxWidth: hz && !sqStack ? plW - plaqueTextX(pR) - 22 : plW - 40, size: F * 1.05, minSize: F, maxLines: stress ? 3 : 2, weight: 800});
  const pFits = {law: pFit('law'), forum: pFit('forum')};
  const pBig = pFits.law.height > pFits.forum.height ? pFits.law : pFits.forum;
  const plH = hz && !sqStack ? Math.max(pBig.height, pR * 2) + 56 : stackedPlaqueH(pR * (sqStack ? 1.2 : 1), pBig);
  const top = plaqueTop(plW);
  if (hz) {
    root = {x: A.x, y: A.y + (A.h - rootH) / 2, w: rootW, h: rootH};
    const cx = A.x + A.w * 0.355;
    const gapY = A.h - 2 * cardH;
    if (gapY < 120) why.push('cards');
    cards.law = {x: cx, y: A.y + gapY * 0.18, w: cardW, h: cardH};
    cards.forum = {x: cx, y: A.y + A.h - cardH - gapY * 0.18, w: cardW, h: cardH};
    const px = A.x + A.w - plW - 4;
    plq.law = {x: px, y: A.y + top + 4, w: plW, h: plH};
    plq.forum = {x: px, y: A.y + A.h - plH - 6, w: plW, h: plH};
  } else {
    root = {x: A.x + (A.w - rootW) / 2, y: A.y, w: rootW, h: rootH};
    const bandY = root.y + rootH;
    const plY = A.y + A.h - plH - 6;
    const free = plY - top - bandY - cardH;
    if (free < (sqr ? 150 : 200)) why.push('rows');
    cards.law = {x: A.x, y: bandY + free * 0.45, w: cardW, h: cardH};
    cards.forum = {x: A.x + A.w - cardW, y: bandY + free * 0.45, w: cardW, h: cardH};
    plq.law = {x: A.x, y: plY, w: plW, h: plH};
    plq.forum = {x: A.x + A.w - plW, y: plY, w: plW, h: plH};
  }
  // links (edge-anchored): root → card (relation), card → plaque (relation)
  const plBox = k => ({x: plq[k].x, y: plq[k].y - top, w: plq[k].w, h: plq[k].h + top});
  const links = [];
  for (const k of KINDS) {
    const c = cards[k];
    const cc = {x: c.x + c.w / 2, y: c.y + c.h / 2};
    const rc = {x: root.x + root.w / 2, y: root.y + root.h / 2};
    const from = hz ? {x: root.x + root.w + 10, y: clamp(cc.y, root.y + 30, root.y + root.h - 30)} : {x: clamp(cc.x, root.x + 40, root.x + root.w - 40), y: root.y + root.h + 10};
    const to = hz ? {x: c.x - 10, y: cc.y} : {x: cc.x, y: c.y - 14};
    void rc;
    links.push({id: `in-${k}`, kind: k, stage: 0, from, to});
    const pb = plBox(k);
    const from2 = hz ? {x: c.x + c.w + 10, y: cc.y} : {x: cc.x, y: c.y + c.h + 10};
    const to2 = hz ? {x: pb.x - 10, y: pb.y + pb.h / 2 + top / 2} : {x: pb.x + pb.w / 2, y: pb.y - 10};
    links.push({id: `to-${k}`, kind: k, stage: 1, from: from2, to: to2});
  }
  // relation labels at the link midpoints, nudged clear of boxes
  const boxes = [root, cards.law, cards.forum, plBox('law'), plBox('forum')];
  const labs = [];
  if (show) {
    for (const ln of links) {
      const text = ln.stage === 0 ? ctx.t.holds : ctx.t.points;
      const mid = {x: (ln.from.x + ln.to.x) / 2, y: (ln.from.y + ln.to.y) / 2};
      const size = Math.max(F * 0.85, minF);
      let best = null;
      for (const d of [0, 30, -30, 60, -60, 90, -90, 120, -120]) {
        const dx = ln.to.x - ln.from.x, dy = ln.to.y - ln.from.y, L = Math.hypot(dx, dy) || 1;
        const px = -dy / L, py = dx / L;
        const c = chipG(ctx, text, {x: mid.x + px * d, y: mid.y + py * d - size * 0.9, anchor: 'middle', maxWidth: hz ? A.w * 0.12 : A.w * 0.3, size, minSize: minF, maxLines: 2, weight: 600, fill: '#ffffff', stroke: laneColor(ctx, ln.kind), name: `lab-${ln.id}`});
        const inA = c.box.x >= 0 && c.box.x + c.box.w <= D.w && c.box.y >= 0;
        if (inA && !boxes.some(b => overlaps(b, c.box, 4)) && !labs.some(l => overlaps(l.box, c.box, 6))) { best = c; break; }
      }
      if (!best) { why.push('label'); best = chipG(ctx, text, {x: mid.x, y: mid.y, anchor: 'middle', maxWidth: 200, size, minSize: minF, maxLines: 2, weight: 600, fill: '#ffffff', stroke: laneColor(ctx, ln.kind), name: `lab-${ln.id}`}); }
      labs.push({id: ln.id, stage: ln.stage, kind: ln.kind, node: best.node, box: best.box, bad: best.bad});
    }
  }
  // the seam between the two clause cards
  const seam = hz
    ? {a: {x: cards.law.x + 20, y: (cards.law.y + cards.law.h + cards.forum.y) / 2}, b: {x: cards.law.x + cards.law.w - 20, y: (cards.law.y + cards.law.h + cards.forum.y) / 2}}
    : {a: {x: (cards.law.x + cards.law.w + cards.forum.x) / 2, y: cards.law.y + 20}, b: {x: (cards.law.x + cards.law.w + cards.forum.x) / 2, y: cards.law.y + cards.law.h - 20}};
  // loupe: park position (free spot), focus positions over each card's glyph
  const LR = clamp(discR * 2.1, 44, 66);
  const focus = {};
  for (const k of KINDS) focus[k] = {x: cards[k].x + 30 + discR, y: cards[k].y + 22 + discR};
  const cands = hz
    ? [{x: root.x + root.w * 0.4, y: root.y + root.h + LR * 1.7}, {x: root.x + root.w * 0.4, y: root.y - LR * 2.3}, {x: (cards.law.x + cards.law.w + plq.law.x) / 2, y: A.y + A.h / 2}]
    : [{x: root.x - LR * 2.4, y: root.y + root.h * 0.5}, {x: root.x + root.w + LR * 1.3, y: root.y + root.h * 0.4}, {x: A.x + A.w / 2 - LR, y: (cards.law.y + cards.law.h + plq.law.y - top) / 2}];
  const linkHit = (lb) => links.some(ln => { for (let i = 0; i <= 30; i++) { const t = i / 30, x = lerp(ln.from.x, ln.to.x, t), y = lerp(ln.from.y, ln.to.y, t); if (x > lb.x && x < lb.x + lb.w && y > lb.y && y < lb.y + lb.h) return true; } return false; });
  let park = null;
  for (const c of cands) {
    const lb = loupeBox(c.x, c.y, LR);
    if (lb.x < 0 || lb.y < 0 || lb.x + lb.w > D.w || lb.y + lb.h > A.y + A.h + 10) continue;
    if (boxes.some(b => overlaps(b, lb, 6)) || labs.some(l => overlaps(l.box, lb, 6)) || linkHit(lb)) continue;
    park = c; break;
  }
  if (!park) { why.push('loupe-park'); park = cands[0]; }
  if ([head, cFits.law, cFits.forum, pFits.law, pFits.forum].some(f => f.bad) || labs.some(l => l.bad)) why.push('text');
  let notesPl = null;
  if (notes.length) {
    let ny = D.h - pad - nh;
    notesPl = [];
    for (let k = 0; k < rowsN; k++) {
      let rh = 0;
      notes.slice(k * cols, k * cols + cols).forEach((q, j) => { const c = chipOf(q, pad + j * (cw + gap), ny, cw); if (c.bad) why.push('note-text'); rh = Math.max(rh, c.box.h); notesPl.push({q, c}); });
      ny += rh + gap;
    }
  }
  return {ok: !why.length, why, sqStack, F, minF, hz, A, discR, pR, root, head, cards, cFits, plq, pFits, top, links, labs, seam, LR, focus, park, notesPl};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1600]},
  layout(ctx) {
    const upx = unitPx(ctx);
    const stress = isStress(ctx.params);
    const minF = (stress ? 16.6 : 20) / upx;
    let L = null;
    for (const fpx of stress ? [20, 18.5, 17.5, 16.8] : [26, 24, 22, 20.4]) { L = geom(ctx, fpx / upx, minF); if (L.ok) break; }
    L.upx = upx;
    // connectors + routes (pure functions of the layout)
    L.conns = L.links.map(ln => connector(ctx, {name: `ln-${ln.id}`, from: ln.from, to: ln.to, kind: 'relation', bend: 0.06, color: laneColor(ctx, ln.kind)}));
    L.routes = {};
    for (const k of KINDS) {
      const c0 = L.conns[L.links.findIndex(l => l.id === `in-${k}`)], c1 = L.conns[L.links.findIndex(l => l.id === `to-${k}`)];
      const a = Array.from({length: 41}, (_, i) => c0.at(i / 40)), b = Array.from({length: 41}, (_, i) => c1.at(i / 40));
      const pa = polyline(a), pb = polyline([a[40], ...b]);
      L.routes[k] = {poly: polyline([...a, ...b]), f0: pa.total / (pa.total + pb.total)};
    }
    return L;
  },
  build(ctx, L) {
    const show = ctx.show('all');
    const th = ctx.theme;
    const R = L.root;
    // the contract card (root): head + two clause bands (glyph + simulated lines; no duplicated text)
    const bandH = L.discR * 2 + 22;
    const rootNode = g({transform: T(R.x, R.y)},
      h('rect', {x: 9, y: 12, width: r(R.w), height: r(R.h), rx: 12, fill: th.shadow}),
      h('path', {d: roundRectPath(0, 0, R.w, R.h, 12), fill: '#fdfbf5', stroke: INK, 'stroke-width': 2.6}),
      h('path', {d: roundRectPath(2, 2, R.w - 4, L.head.height + 24, 10), fill: th.accent4Soft}),
      show ? txt(L.head, {x: 20, y: 14, fill: INK}) : h('path', {d: `M20 ${r(14 + L.head.height / 2)}h${r(R.w * 0.5)}`, stroke: '#9fb08f', 'stroke-width': 10, 'stroke-linecap': 'round'}),
      KINDS.map((k, i) => {
        const y = L.head.height + 40 + i * (bandH + 10);
        return g(null,
          h('path', {d: roundRectPath(14, y, R.w - 28, bandH, 8), fill: '#ffffff', stroke: '#cfc4ae', 'stroke-width': 2}),
          h('rect', {x: 14, y: r(y), width: 8, height: r(bandH), rx: 4, fill: laneColor(ctx, k)}),
          glyphDisc(ctx, k, 34 + L.discR, y + bandH / 2, L.discR),
          h('path', {d: `M${r(48 + L.discR * 2)} ${r(y + bandH / 2 - 8)}h${r((R.w - 90 - L.discR * 2) * 0.9)}M${r(48 + L.discR * 2)} ${r(y + bandH / 2 + 10)}h${r((R.w - 90 - L.discR * 2) * 0.6)}`, stroke: '#e3dccb', 'stroke-width': 6, 'stroke-linecap': 'round'}),
        );
      }),
    );
    // clause cards as layered sheets (capas), each in its own focus group
    const cardNode = k => {
      const c = L.cards[k], f = L.cFits[k];
      const col = laneColor(ctx, k);
      const tx = 30 + L.discR * 2 + 14;
      const lines = [];
      const y0 = 22 + Math.max(L.discR * 2, f.height) + 22;
      for (let y = y0, j = 0; y < c.h - 14; y += 22, j++) lines.push(`M${r(tx)} ${r(y)}h${r((c.w - tx - 26) * (0.95 - 0.25 * (j % 3) / 2))}`);
      return g({name: `card-${k}`, transform: 'translate(0 0)'},
        g({transform: T(c.x, c.y)},
          h('rect', {x: 22, y: 20, width: r(c.w), height: r(c.h), rx: 12, fill: laneSoft(ctx, k), stroke: INK, 'stroke-width': 1.8, opacity: 0.75}),
          h('rect', {x: 11, y: 10, width: r(c.w), height: r(c.h), rx: 12, fill: '#f6f1e6', stroke: INK, 'stroke-width': 1.8, opacity: 0.9}),
          h('rect', {x: 7, y: 11, width: r(c.w), height: r(c.h), rx: 12, fill: th.shadow}),
          h('path', {d: roundRectPath(0, 0, c.w, c.h, 12), fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
          h('rect', {x: 0, y: 0, width: 12, height: r(c.h), rx: 6, fill: col}),
          glyphDisc(ctx, k, 30 + L.discR, 22 + L.discR, L.discR),
          show ? txt(f, {x: tx, y: 22 + Math.max(0, (L.discR * 2 - f.height) / 2), fill: INK}) : h('path', {d: `M${r(tx)} ${r(22 + L.discR)}h${r(Math.min(c.w - tx - 30, 240))}`, stroke: '#cdbfa6', 'stroke-width': 10, 'stroke-linecap': 'round'}),
          h('path', {d: lines.join(''), stroke: '#e6dfcf', 'stroke-width': 5, 'stroke-linecap': 'round'}),
          h('path', {name: `ring-${k}`, d: roundRectPath(-8, -8, c.w + 16, c.h + 16, 16), fill: 'none', stroke: col, 'stroke-width': 4.5, opacity: 0}),
        ));
    };
    const plaques = KINDS.map(k => {
      const P = L.plq[k];
      return g({transform: T(P.x, P.y)},
        plaque(ctx, {kind: k, w: P.w, h: P.h, fit: L.pFits[k], showText: show, discR: L.sqStack ? L.pR * 1.2 : L.pR, stack: !L.hz || L.sqStack}),
        h('path', {name: `lit-${k}`, d: roundRectPath(-9, -9, P.w + 18, P.h + 18, 16), fill: 'none', stroke: laneColor(ctx, k), 'stroke-width': 5, opacity: 0}));
    });
    const labs = L.labs.map(l => g({name: `lg-${l.id}`, opacity: 0}, l.node));
    const seam = h('path', {name: 'seam', d: `M${r(L.seam.a.x)} ${r(L.seam.a.y)}L${r(L.seam.b.x)} ${r(L.seam.b.y)}`, stroke: ctx.theme.fgSoft ?? INK, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0});
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'},
      L.conns.map(c => c.node),
      rootNode, plaques, cardNode('law'), cardNode('forum'), seam, labs,
      tracer(ctx, 'tr-law', laneColor(ctx, 'law')), tracer(ctx, 'tr-forum', laneColor(ctx, 'forum')),
      g({name: 'loupe', transform: T(L.park.x, L.park.y)}, loupe(ctx, 'loupe-art', L.LR)),
      notes,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const order = p.order === 'forum-first' ? ['forum', 'law'] : ['law', 'forum'];
    const idx = id => L.links.findIndex(l => l.id === id);
    const lq = ease.inOutSine(seg(u, ...W.links));
    const prog = {};
    for (const k of KINDS) prog[`in-${k}`] = lq;
    const rk = [['r1a', 'f1', 'r1l', 'r1b', 'lit1'], ['r2a', 'f2', 'r2l', 'r2b', 'lit2']];
    const lit = {}, focus = {};
    order.forEach((k, j) => {
      const [, fk, lk, , ik] = rk[j];
      prog[`to-${k}`] = ease.inOutSine(seg(u, ...W[lk]));
      lit[k] = seg(u, ...W[ik]);
      focus[k] = Math.sin(Math.PI * seg(u, ...W[fk]));
    });
    L.links.forEach((ln, i) => Object.assign(nodes, L.conns[i].frame(prog[ln.id], prog[ln.id] > 0 ? 1 : 0)));
    for (const l of L.labs) nodes[`lg-${l.id}`] = {opacity: r(l.stage === 0 ? seg(u, ...W.labs0) : clamp((prog[l.id] - 0.6) / 0.4), 3)};
    // one tracer per route, each continuous: waits hidden at the contract edge, runs to its card, then on to its plaque
    const trs = {};
    let active = null;
    order.forEach((k, j) => {
      const [ak, , , bk] = rk[j];
      const R = L.routes[k];
      const a = ease.inOutSine(seg(u, ...W[ak])), b = ease.inOutSine(seg(u, ...W[bk]));
      const t = b > 0 ? R.f0 + (1 - R.f0) * b : R.f0 * a;
      const pt = R.poly.at(t);
      const o = u < W[ak][0] ? 0 : u < W[bk][1] ? 1 : clamp(1 - (u - W[bk][1]) / 0.03);
      nodes[`tr-${k}`] = {transform: T(r(pt.x, 2), r(pt.y, 2)), opacity: r(o, 3)};
      trs[k] = {x: r(pt.x), y: r(pt.y), o};
      if (u >= W[ak][0] && u < W[bk][1]) active = k;
    });
    // focus: the card being traced enlarges a little about its centre; the loupe hovers over its glyph
    for (const k of KINDS) {
      const c = L.cards[k];
      const s = 1 + 0.07 * focus[k];
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      nodes[`card-${k}`] = {transform: `translate(${r(cx, 2)} ${r(cy, 2)}) scale(${r(s, 4)}) translate(${r(-cx, 2)} ${r(-cy, 2)})`};
      nodes[`ring-${k}`] = {opacity: r(Math.max(focus[k], seg(u, W.park[0], W.park[1]) * 0), 3)};
      nodes[`lit-${k}`] = {opacity: r(lit[k], 3)};
    }
    // loupe path: park → focus 1 (during r1a/f1) → focus 2 → park
    const [k1, k2] = order;
    const go1 = ease.inOutCubic(seg(u, W.r1a[0], W.f1[0] + 0.01)), go2 = ease.inOutCubic(seg(u, W.r1b[1], W.f2[0] + 0.01)), back = ease.inOutCubic(seg(u, ...W.park));
    let lp;
    if (u < W.r1b[1]) lp = {x: lerp(L.park.x, L.focus[k1].x, go1), y: lerp(L.park.y, L.focus[k1].y, go1)};
    else if (u < W.park[0]) lp = {x: lerp(L.focus[k1].x, L.focus[k2].x, go2), y: lerp(L.focus[k1].y, L.focus[k2].y, go2)};
    else lp = {x: lerp(L.focus[k2].x, L.park.x, back), y: lerp(L.focus[k2].y, L.park.y, back)};
    nodes.loupe = {transform: T(r(lp.x, 2), r(lp.y, 2))};
    nodes.seam = {opacity: r(seg(u, ...W.seam), 3)};
    const noteO = seg(u, ...W.note), keyO = seg(u, ...W.key), annO = seg(u, ...W.ann);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'ann' ? annO : noteO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.relate[1] ? 'relate' : u < BEATS.route1[1] ? 'route1' : u < BEATS.route2[1] ? 'route2' : 'hold';
    const plB = k => ({x: r(L.plq[k].x), y: r(L.plq[k].y - L.top), w: r(L.plq[k].w), h: r(L.plq[k].h + L.top)});
    const bx = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    return {
      nodes,
      semantic: {
        beat, order: order.join('>'), active, tracerLaw: {x: trs.law.x, y: trs.law.y}, tracerForum: {x: trs.forum.x, y: trs.forum.y}, tracerShown: r(Math.max(trs.law.o, trs.forum.o), 3), loupe: {x: r(lp.x), y: r(lp.y)},
        loupeParked: u < W.r1a[0] || u >= W.park[1],
        loupeBox: (() => { const b = loupeBox(lp.x, lp.y, L.LR); return bx(b); })(),
        links: L.links.map(ln => ({id: ln.id, kind: ln.kind, from: {x: r(ln.from.x), y: r(ln.from.y)}, to: {x: r(ln.to.x), y: r(ln.to.y)}, drawn: r(prog[ln.id], 3)})),
        linkKinds: L.links.map(() => 'relation'), arrows: 0,
        boxes: {root: bx(L.root), law: bx(L.cards.law), forum: bx(L.cards.forum), plaqueLaw: plB('law'), plaqueForum: plB('forum')},
        focus: {law: r(focus.law, 3), forum: r(focus.forum, 3)}, lit: {law: r(lit.law, 3), forum: r(lit.forum, 3)},
        seamShown: r(seg(u, ...W.seam), 3), keyShown: r(keyO, 3), noteShown: r(noteO, 3), labels: L.labs.map(l => bx(l.box)),
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
      },
    };
  },
};
void edgeAnchor;

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-08-mechanism',
    title: 'Agreed law and forum, without doctrine — a split tree: the contract holds two separate clause cards, and a tracer runs each clause\'s plain link to its own plaque (law, forum)',
    titleEs: 'Ley y foro pactados — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Ley y foro pactados',
    treatment: 'mechanism',
    family: 'relation-graph',
    description: 'Components placed as a split tree: the contract card (root), two clause cards drawn as layered sheets (choice of law, choice of forum) and two destination plaques ("Law X (fictional)", "Forum Y (fictional)"). Plain relation links (no arrowheads) are drawn from the contract to each clause ("in the contract"); then a tracer runs route 1 (contract → first clause → its plaque, "points to") while the loupe focuses the clause card, then route 2 to the other plaque. No link is drawn between the clauses or between the plaques; a neutral seam separates the clause cards. Note "Two separate clauses · each points to its own choice"; key "As supplied · no conclusion drawn". No conflict-of-laws or jurisdiction doctrine.',
    tags: ['choice of law', 'choice of forum', 'mechanism', 'relation graph', 'tracer', 'layers', 'separate clauses', 'plaques'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/ley-y-foro.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
