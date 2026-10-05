/**
 * LAW-0509 — Ley y foro pactados · story
 *
 * Storyboard (the contract sheet as anchor, two destination plaques across the table, one loupe):
 *  0.00–0.15  rest: the contract "CT-508 · Contract (fictional)" shows two separate clause blocks — "Clause 14 · Choice
 *             of law" (open-book disc) and "Clause 15 · Choice of forum" (hall disc) — each with its own index tab and
 *             compass dial resting against the sheet, needles pointing back at their clause. Across the table stand two
 *             plaques: "Law X (fictional)" (tablet top, book emblem) and "Forum Y (fictional)" (pediment top, hall
 *             emblem). The loupe rests on the table.
 *  0.15–0.42  the loupe slides over the first clause block (it lights in its lane colour); that block's tab slides out
 *             carrying its dial; the needle swings round to its plaque and a sight line is drawn from the dial to it.
 *  0.30–0.64  the loupe moves on to the second clause block; its own tab slides out, its own needle swings to the other
 *             plaque and its sight line is drawn. The first needle does not move (each clause acts on its own).
 *  0.58–0.73  the loupe returns to its place; each plaque's rim lights when its line arrives.
 *  0.73–1.00  hold: two separate lines, never joined or crossed; the note "Two separate clauses · each points to its
 *             own choice" and the key "As supplied · no conclusion drawn".
 * No conflict-of-laws or jurisdiction doctrine: fictional labels only; no validity, effect, priority or outcome; neither
 * clause decides the other.
 * @module animations/contract-terms/LAW-0509
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {list, oneOf, annotation} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clausesField, destinationsField, localizeScene, unitPx, fitG, chipG,
  contractSheet, blockHeight, clauseTab, compassDial, plaque, plaqueTop, plaqueTextX, stackedPlaqueH, sightLine, sightFrame, loupe, loupeBox,
  laneColor, toDeg, overlaps,
} from './kits/ley-y-foro.js';

const ID = 'LAW-0509';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  to1: [0.15, 0.21], hl1: [0.2, 0.24], tab1: [0.22, 0.29], needle1: [0.28, 0.37], line1: [0.36, 0.43], rim1: [0.42, 0.45],
  to2: [0.31, 0.37], hl2: [0.37, 0.41], tab2: [0.4, 0.47], needle2: [0.46, 0.55], line2: [0.54, 0.62], rim2: [0.61, 0.64],
  back: [0.6, 0.68], note: [0.72, 0.77], key: [0.74, 0.79], ann: [0.76, 0.81],
};

const sceneSchema = {
  contract: contractField,
  clauses: clausesField,
  destinations: destinationsField,
  order: oneOf('Which clause comes first in the contract (and is read first): law-first or forum-first. Each clause still points only to its own plaque', ['law-first', 'forum-first']),
  annotations: list('Editorial callouts shown in the final hold', annotation(['law', 'forum', 'contract']), 0, 2),
};
const defaultParams = {...CONTENT, order: 'law-first', annotations: []};
const defaultParamsEs = {...CONTENT_ES};

const isStress = p => [p.contract.title, p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum].some(t => t.length > 40) || p.annotations.length > 1;
const kindsOf = p => (p.order === 'forum-first' ? ['forum', 'law'] : ['law', 'forum']);

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const hz = ctx.view.shape === 'landscape';
  const sq = false;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14;
  const kinds = kindsOf(p);
  // notes along the bottom
  const notes = [];
  if (show) notes.push({name: 'sep', kind: 'note0', text: ctx.t.separate});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const gap = 12;
  const nw = D.w - pad * 2;
  const cols = notes.length > 1 ? Math.min(notes.length, ctx.view.shape === 'landscape' ? 3 : ctx.view.shape === 'square' ? 2 : 1) : 1;
  const cw = (nw - gap * (cols - 1)) / cols;
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: Math.max(F * 0.95, minF), minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'note0' ? ctx.theme.accent4Soft : '#ffffff'});
  const rowsN = Math.ceil(notes.length / cols);
  const sizes = notes.map(q => chipOf(q, 0, 0, cw).box.h);
  const nh = notes.length ? Array.from({length: rowsN}, (_, k) => Math.max(...sizes.slice(k * cols, k * cols + cols))).reduce((a, b) => a + b + gap, -gap) : 0;
  const A = {x: pad, y: pad + 10, w: D.w - pad * 2, h: D.h - pad * 2 - 10 - (nh ? nh + 22 : 0)};
  const R = clamp(Math.min(A.w, A.h) * (hz ? 0.1 : 0.125), 48, 112); // dial radius
  const discR = clamp(F * 1.05, 20, 28);
  const LR = clamp(R * 0.85, 40, 74); // loupe radius
  // the sheet
  const sheet = hz
    ? {x: A.x, y: A.y, w: A.w * (sq ? 0.47 : 0.36), h: A.h}
    : {x: A.x, y: A.y, w: A.w, h: A.h * (ctx.view.shape === 'square' ? 0.3 : 0.36)};
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: sheet.w - 48 - 40, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 800});
  const headH = head.height + 30;
  const blockW = hz ? sheet.w - 36 : (sheet.w - 36 - 22) / 2;
  const bFit = k => fitG(p.clauses[k], {maxWidth: blockW - 20 - discR * 2 - 14 - 16, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const fits = {law: bFit('law'), forum: bFit('forum')};
  const fl = hz ? 4 : 3;
  const bh0 = Math.max(blockHeight(fits.law, discR, fl), blockHeight(fits.forum, discR, fl));
  const bh = hz ? Math.max(bh0, Math.min(bh0 * 1.5, (sheet.h - headH - 3 * 46) / 2)) : Math.max(bh0, Math.min(bh0 * 1.6, sheet.h - headH - 2 * 34));
  const blocks = [];
  if (hz) {
    const free = sheet.h - headH - 2 * bh;
    if (free < 3 * 26) why.push('sheet-blocks');
    const gy = free / 3;
    kinds.forEach((k, i) => blocks.push({kind: k, x: 18, y: headH + gy + i * (bh + gy), w: blockW, h: bh, fit: fits[k]}));
  } else {
    const free = sheet.h - headH - bh;
    if (free < 30) why.push('sheet-blocks');
    kinds.forEach((k, i) => blocks.push({kind: k, x: 18 + i * (blockW + 22), y: headH + free / 2, w: blockW, h: bh, fit: fits[k]}));
  }
  // plaques
  const pR = discR * (hz ? 1.5 : 1.8);
  const pFitW = pw => (hz ? pw - plaqueTextX(pR) - 22 : pw - 40);
  let pw, plaques = [];
  if (hz) pw = A.w * (sq ? 0.4 : 0.3);
  else pw = (A.w - 30) / 2;
  const pFits = {law: fitG(p.destinations.law, {maxWidth: pFitW(pw), size: F * 1.05, minSize: minF, maxLines: stress ? 3 : 2, weight: 800}), forum: fitG(p.destinations.forum, {maxWidth: pFitW(pw), size: F * 1.05, minSize: minF, maxLines: stress ? 3 : 2, weight: 800})};
  const ph = hz ? Math.max(pFits.law.height, pFits.forum.height, pR * 2) + 64 : stackedPlaqueH(pR, pFits.law.height > pFits.forum.height ? pFits.law : pFits.forum);
  const top = plaqueTop(pw);
  if (hz) {
    const px = A.x + A.w - pw - 6;
    plaques = kinds.map((k, i) => ({kind: k, x: px, y: i === 0 ? A.y + top + 6 : A.y + A.h - ph - 8, w: pw, h: ph, fit: pFits[k]}));
  } else {
    const py = A.y + A.h - ph - 8;
    plaques = kinds.map((k, i) => ({kind: k, x: A.x + i * (pw + 30), y: py, w: pw, h: ph, fit: pFits[k]}));
  }
  // tabs + dials: rest = dial just outside the sheet edge; out = slid outward by `slide`
  const dials = blocks.map((b, i) => {
    const cy = b.y + 18 + discR;
    if (hz) {
      const ex = sheet.x + sheet.w;
      const restC = {x: ex + 30 + R, y: sheet.y + cy};
      const room = plaques[0].x - 70 - R - restC.x;
      const slide = clamp(room * 0.55, 60, 200);
      if (room < 60) why.push('dial-room');
      return {kind: b.kind, tab0: {x: ex - 40, y: restC.y}, rest: restC, out: {x: restC.x + slide, y: restC.y}, dir: 0, restA: 180, spin: i === 0 ? 1 : -1};
    }
    const ey = sheet.y + sheet.h;
    const cx = sheet.x + b.x + b.w / 2;
    const restC = {x: cx, y: ey + 30 + R};
    const room = plaques[0].y - top - 60 - R - restC.y;
    const slide = clamp(room * 0.4, 40, 260);
    if (room < 60) why.push('dial-room');
    return {kind: b.kind, tab0: {x: cx, y: ey - 40}, rest: restC, out: {x: cx, y: restC.y + slide}, dir: 90, restA: -90, spin: i === 0 ? -1 : 1};
  });
  // ports and target angles
  dials.forEach((d, i) => {
    const P = plaques[i];
    d.port = hz ? {x: P.x - 4, y: P.y + P.h / 2} : {x: P.x + P.w / 2, y: P.y - top - 4};
    const ta = toDeg(d.out, d.port);
    let delta = ((ta - d.restA) % 360 + 360) % 360;
    if (d.spin < 0) delta -= 360;
    d.delta = delta;
    d.targetA = d.restA + delta;
    const rad = (ta * Math.PI) / 180;
    d.lineA = {x: d.out.x + Math.cos(rad) * (R + 10), y: d.out.y + Math.sin(rad) * (R + 10)};
    d.lineB = d.port;
  });
  // loupe: rest position and reading positions (over each clause heading)
  const loupeRest = hz
    ? {x: plaques[0].x + pw * 0.25, y: (plaques[0].y + plaques[0].h + plaques[1].y - top) / 2 - LR * 0.5}
    : {x: A.x + A.w / 2 - LR * 0.4, y: (dials[0].out.y + plaques[0].y - top) / 2 - LR * 0.6};
  const reads = blocks.map(b => ({x: sheet.x + b.x + 20 + discR * 2 + 14 + Math.min(b.fit.width, b.w * 0.5) * 0.55, y: sheet.y + b.y + 18 + discR + 2}));
  // collisions: plaques vs dials/lines, loupe rest vs everything
  const lb = loupeBox(loupeRest.x, loupeRest.y, LR);
  const boxes = [...plaques.map(P => ({x: P.x, y: P.y - top, w: P.w, h: P.h + top})), {x: sheet.x, y: sheet.y, w: sheet.w, h: sheet.h}, ...dials.map(d => ({x: d.out.x - R - 6, y: d.out.y - R - 6, w: 2 * R + 12, h: 2 * R + 12}))];
  if (boxes.some(b => overlaps(b, lb, 4))) why.push('loupe-rest');
  if (segHitsBox(dials[0].lineA, dials[0].lineB, lb) || segHitsBox(dials[1].lineA, dials[1].lineB, lb)) why.push('loupe-line');
  if ([head, fits.law, fits.forum, pFits.law, pFits.forum].some(f => f.bad)) why.push('text');
  // notes placement
  let notesPl = null;
  if (notes.length) {
    let ny = D.h - pad - nh;
    notesPl = [];
    for (let k = 0; k < rowsN; k++) {
      const row = notes.slice(k * cols, k * cols + cols);
      let rh = 0;
      row.forEach((q, j) => { const c = chipOf(q, pad + j * (cw + gap), ny, cw); if (c.bad) why.push('note-text'); rh = Math.max(rh, c.box.h); notesPl.push({q, c}); });
      ny += rh + gap;
    }
  }
  return {ok: !why.length, why, F, minF, hz, A, R, LR, discR, pR, sheet, head, headH, blocks, plaques, top, dials, loupeRest, reads, notesPl, kinds};
}

function segHitsBox(a, b, bx) {
  for (let i = 0; i <= 40; i++) { const t = i / 40; const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; if (x > bx.x && x < bx.x + bx.w && y > bx.y && y < bx.y + bx.h) return true; }
  return false;
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
    return L;
  },
  build(ctx, L) {
    const show = ctx.show('all');
    const S = L.sheet;
    const tabs = L.dials.map((d, i) => {
      const len = Math.hypot(d.rest.x - d.tab0.x, d.rest.y - d.tab0.y);
      return g({name: `tab${i}`, transform: `${T(d.tab0.x, d.tab0.y)} rotate(${d.dir})`}, clauseTab(ctx, d.kind, len, L.R * 0.7));
    });
    const dials = L.dials.map((d, i) => g({name: `dialpos${i}`, transform: T(d.rest.x, d.rest.y)}, compassDial(ctx, d.kind, `dial${i}`, L.R)));
    const lines = L.dials.map((d, i) => sightLine(ctx, `line${i}`, d.lineA, d.lineB, laneColor(ctx, d.kind)));
    const plaques = L.plaques.map((P, i) => g({transform: T(P.x, P.y)},
      plaque(ctx, {kind: P.kind, w: P.w, h: P.h, fit: P.fit, showText: show, discR: L.pR, stack: !L.hz}),
      h('path', {name: `rim${i}`, d: `M-8 -8H${r(P.w + 8)}V${r(P.h + 8)}H-8Z`, fill: 'none', stroke: laneColor(ctx, P.kind), 'stroke-width': 5, 'stroke-linejoin': 'round', opacity: 0}),
    ));
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    return g({name: 'scene'},
      lines,
      tabs,
      g({transform: T(S.x, S.y)}, contractSheet(ctx, {w: S.w, h: S.h, head: L.head, headH: L.headH, blocks: L.blocks, showText: show, prefix: '', discR: L.discR})),
      dials,
      plaques,
      g({name: 'loupe', transform: T(L.loupeRest.x, L.loupeRest.y)}, loupe(ctx, 'loupe-art', L.LR)),
      notes,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const sem = {dials: [], needles: [], lines: [], tabs: []};
    const keys = [['tab1', 'needle1', 'line1', 'hl1', 'rim1'], ['tab2', 'needle2', 'line2', 'hl2', 'rim2']];
    L.dials.forEach((d, i) => {
      const [tk, nk, lk, hk, rk] = keys[i];
      const tq = ease.inOutCubic(seg(u, ...W[tk]));
      const c = {x: lerp(d.rest.x, d.out.x, tq), y: lerp(d.rest.y, d.out.y, tq)};
      const len = Math.hypot(c.x - d.tab0.x, c.y - d.tab0.y);
      const len0 = Math.hypot(d.rest.x - d.tab0.x, d.rest.y - d.tab0.y);
      nodes[`tab${i}`] = {transform: `${T(d.tab0.x, d.tab0.y)} rotate(${d.dir}) scale(${r(len / len0, 4)} 1)`};
      nodes[`dialpos${i}`] = {transform: T(r(c.x, 2), r(c.y, 2))};
      const nq = ease.inOutCubic(seg(u, ...W[nk]));
      const wob = 3 * Math.sin(u * 40 + i) * (1 - seg(u, W[nk][0] - 0.05, W[nk][0]));
      const a = d.restA + d.delta * nq + (nq > 0 ? 0 : wob);
      nodes[`dial${i}-needle`] = {transform: `rotate(${r(a, 2)})`};
      const lq = ease.inOutSine(seg(u, ...W[lk]));
      Object.assign(nodes, sightFrame(`line${i}`, d.lineA, d.lineB, lq));
      nodes[`hl-${d.kind}`] = {opacity: r(seg(u, ...W[hk]), 3)};
      nodes[`rim${i}`] = {opacity: r(seg(u, ...W[rk]), 3)};
      const rad = (a * Math.PI) / 180;
      sem.dials.push({x: r(c.x), y: r(c.y)});
      sem.needles.push({x: r(c.x + Math.cos(rad) * L.R * 0.78), y: r(c.y + Math.sin(rad) * L.R * 0.78)});
      sem.lines.push(r(lq, 3));
      sem.tabs.push(r(tq, 3));
    });
    // loupe path: rest → read 1 → read 2 → rest
    const q1 = ease.inOutCubic(seg(u, ...W.to1)), q2 = ease.inOutCubic(seg(u, ...W.to2)), q3 = ease.inOutCubic(seg(u, ...W.back));
    const [r1, r2] = L.reads;
    let lp;
    if (u < W.to2[0]) lp = {x: lerp(L.loupeRest.x, r1.x, q1), y: lerp(L.loupeRest.y, r1.y, q1) - Math.sin(q1 * Math.PI) * 30};
    else if (u < W.back[0]) lp = {x: lerp(r1.x, r2.x, q2), y: lerp(r1.y, r2.y, q2)};
    else lp = {x: lerp(r2.x, L.loupeRest.x, q3), y: lerp(r2.y, L.loupeRest.y, q3) - Math.sin(q3 * Math.PI) * 30};
    nodes.loupe = {transform: T(r(lp.x, 2), r(lp.y, 2))};
    const noteO = seg(u, ...W.note), keyO = seg(u, ...W.key), annO = seg(u, ...W.ann);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : pl.q.kind === 'ann' ? annO : noteO, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const reading = u >= W.to1[1] && u < W.to2[0] ? L.kinds[0] : u >= W.to2[1] && u < W.back[0] ? L.kinds[1] : null;
    const ends = L.dials.map(d => ({x: r(d.lineB.x), y: r(d.lineB.y)}));
    const parked = u < W.to1[0] || u >= W.back[1];
    return {
      nodes,
      semantic: {
        beat, order: L.kinds.join('>'), reading, loupe: {x: r(lp.x), y: r(lp.y)}, loupeParked: parked,
        loupeBox: (() => { const b = loupeBox(lp.x, lp.y, L.LR); return {x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)}; })(),
        dialA: sem.dials[0], dialB: sem.dials[1], needleA: sem.needles[0], needleB: sem.needles[1],
        needleDeg: L.dials.map((d, i) => r(d.restA + d.delta * ease.inOutCubic(seg(u, ...W[keys[i][1]])), 1)),
        targetDeg: L.dials.map(d => r(d.targetA, 1)), restDeg: L.dials.map(d => r(d.restA, 1)),
        lines: sem.lines, tabs: sem.tabs, ends,
        plaqueBoxes: L.plaques.map(P => ({kind: P.kind, x: r(P.x), y: r(P.y - L.top), w: r(P.w), h: r(P.h + L.top)})),
        kinds: L.kinds,
        linesCross: crosses(L.dials[0].lineA, L.dials[0].lineB, L.dials[1].lineA, L.dials[1].lineB),
        rims: [r(seg(u, ...W.rim1), 3), r(seg(u, ...W.rim2), 3)], keyShown: r(keyO, 3), noteShown: r(noteO, 3),
        textBoxes: [{x: r(L.sheet.x), y: r(L.sheet.y), w: r(L.sheet.w), h: r(L.sheet.h)}],
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
      },
    };
  },
};

function crosses(a, b, c, d) {
  const o = (p, q, s) => Math.sign((q.x - p.x) * (s.y - p.y) - (q.y - p.y) * (s.x - p.x));
  return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-08-story',
    title: 'Agreed law and forum, without doctrine — two separate clause tabs slide out of the contract; each compass needle swings to its own plaque (law, forum) and a sight line is drawn',
    titleEs: 'Ley y foro pactados — Microescena con objetos y actores',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Ley y foro pactados',
    treatment: 'story',
    family: 'staged-scene',
    description: 'The contract sheet holds two separate clause blocks (choice of law, choice of forum), each with its own index tab and compass dial. A loupe passes over the first clause; its tab slides out, its needle swings round to its own plaque ("Law X (fictional)") and a sight line is drawn. The loupe moves to the second clause; its own tab, needle and line reach the other plaque ("Forum Y (fictional)"). The lines never join or cross; note "Two separate clauses · each points to its own choice"; key "As supplied · no conclusion drawn". No conflict-of-laws or jurisdiction doctrine, no real places or courts, no outcome.',
    tags: ['choice of law', 'choice of forum', 'governing law clause', 'forum clause', 'compass', 'plaques', 'loupe', 'separate clauses'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/ley-y-foro.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
