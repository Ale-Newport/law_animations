/**
 * LAW-0512 — Ley y foro pactados · inspect
 *
 * Storyboard (context = the state the story leaves: the contract with two separate clause blocks, each tab's compass
 * needle pointing along its own sight line to its own plaque):
 *  0.00–0.18  context: "CT-508 · Contract (fictional)" with "Clause 14 · Choice of law" → plaque "Law X (fictional)" and
 *             "Clause 15 · Choice of forum" → plaque "Forum Y (fictional)" (the before-value of the changed plaque).
 *  0.18–0.34  a lens opens on the changed plaque (with the end of its sight line) to a real enlarged copy (≥ 1.5×). On
 *             wide boxes the context steps aside (scaled, text-free while small); on tall boxes it stays in place,
 *             dimmed, and the lens opens over the half away from the plaque. The context's label of that plaque is
 *             blanked as the copy appears (the datum is legible in one place only).
 *  0.36–0.56  in the lens the one datum is substituted: the before-label lifts and fades, a small "was: …" trace keeps
 *             it traceable, the after-label (default "Forum Z (fictional)") fades in and holds; the emblem gains an
 *             outer ring so the change reads with labels hidden.
 *  0.66–0.80  the lens closes back onto the plaque; the context shows the after-label with the neutral changed-datum
 *             marker (white Δ on the blue disc). The other clause, its needle, line and plaque never change.
 *  0.80–1.00  hold: the note "Only the plaque named by Clause 15 changed: was Forum Y (fictional)" and the key "As supplied
 *             · no conclusion drawn". Seeking back restores the before-value exactly.
 * No conflict-of-laws or jurisdiction doctrine; fictional labels only; no validity, effect or outcome; changing one
 * clause's destination does not touch the other clause.
 * @module animations/contract-terms/LAW-0512
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, oneOf, annotation} from '../../schemas/fields.js';
import {lens} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, KINDS, contractField, clausesField, destinationsField, localizeScene, unitPx, fitG, chipG, txt,
  contractSheet, blockHeight, clauseTab, compassDial, plaque, plaqueTop, plaqueTextX, stackedPlaqueH, laneColor, toDeg,
} from './kits/ley-y-foro.js';

const ID = 'LAW-0512';
const DURATION = 6500;
const BEATS = {context: [0, 0.18], isolate: [0.18, 0.36], substitute: [0.36, 0.66], ret: [0.66, 0.8], hold: [0.8, 1]};
const W = {open: [0.18, 0.32], out: [0.4, 0.43], in: [0.43, 0.46], was: [0.46, 0.5], band: [0.46, 0.52], close: [0.66, 0.78], ctxIn: [0.775, 0.8], marker: [0.79, 0.82], notes: [0.81, 0.85], key: [0.82, 0.86]};
const STRINGS = {
  en: {...KIT_STRINGS.en, was: 'was', wasNote: 'Only the plaque named by {c} changed: was {v}'},
  es: {...KIT_STRINGS.es, was: 'antes', wasNote: 'Solo cambió la placa nombrada por {c}: antes {v}'},
};

const sceneSchema = {
  contract: contractField,
  clauses: clausesField,
  destinations: destinationsField,
  changed: oneOf('Which clause\'s destination plaque is substituted (law or forum); the other clause and plaque never change', KINDS),
  afterValue: str('The substituted plaque label (fictional, e.g. "Forum Z (fictional)"); the before-value is the plaque label in destinations', 56),
  annotations: list('Editorial callouts shown in the final hold', annotation(['plaque', 'contract']), 0, 2),
};
const defaultParams = {...CONTENT, changed: 'forum', afterValue: 'Forum Z (fictional)', annotations: []};
const defaultParamsEs = {...CONTENT_ES, afterValue: 'Foro Z (ficticio)'};

const isStress = p => [p.contract.title, p.clauses.law, p.clauses.forum, p.destinations.law, p.destinations.forum, p.afterValue].some(t => t.length > 40) || p.annotations.length > 1;
const clauseNum = s => (String(s).split('·')[0] || s).trim();

function geom(ctx, F, minF) {
  const p = ctx.params;
  const D = ctx.design;
  const hz = ctx.view.shape === 'landscape';
  const show = ctx.show('all'), showKey = ctx.show('key');
  const stress = isStress(p);
  const why = [];
  const pad = 14;
  const ck = p.changed;
  const notes = [];
  if (show) notes.push({name: 'wasnote', kind: 'was', text: ctx.t.wasNote.replace('{c}', clauseNum(p.clauses[ck])).replace('{v}', p.destinations[ck])});
  if (showKey) notes.push({name: 'key', kind: 'key', text: ctx.t.key});
  if (show) p.annotations.forEach((an, i) => notes.push({name: `ann${i}`, kind: 'ann', text: an.text}));
  const gap = 12;
  const cols = notes.length > 1 ? Math.min(notes.length, hz ? 3 : ctx.view.shape === 'square' ? 2 : 1) : 1;
  const cw = (D.w - pad * 2 - gap * (cols - 1)) / cols;
  const chipOf = (q, x, y, w) => chipG(ctx, q.text, {x, y, maxWidth: w, size: Math.max(F * 0.95, minF), minSize: minF, maxLines: 3, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: '#ffffff'});
  const rowsN = Math.ceil(notes.length / cols);
  const sizes = notes.map(q => chipOf(q, 0, 0, cw).box.h);
  const nh = notes.length ? Array.from({length: rowsN}, (_, k) => Math.max(...sizes.slice(k * cols, k * cols + cols))).reduce((a, b) => a + b + gap, -gap) : 0;
  const A = {x: pad, y: pad + 10, w: D.w - pad * 2, h: D.h - pad * 2 - 10 - (nh ? nh + 22 : 0)};
  const R = clamp(Math.min(A.w, A.h) * (hz ? 0.1 : 0.11), 46, 100);
  const discR = clamp(F * 1.05, 20, 28);
  const pR = discR * (hz ? 1.5 : 1.7);
  const sheet = hz ? {x: A.x, y: A.y, w: A.w * 0.36, h: A.h} : {x: A.x, y: A.y, w: A.w, h: A.h * 0.34};
  const head = fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: sheet.w - 90, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 800});
  const headH = head.height + 30;
  const blockW = hz ? sheet.w - 36 : (sheet.w - 58) / 2;
  const fits = {};
  for (const k of KINDS) fits[k] = fitG(p.clauses[k], {maxWidth: blockW - 20 - discR * 2 - 30, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 700});
  const bh0 = Math.max(blockHeight(fits.law, discR, hz ? 4 : 2), blockHeight(fits.forum, discR, hz ? 4 : 2));
  const blocks = [];
  if (hz) {
    const bh = Math.max(bh0, Math.min(bh0 * 1.4, (sheet.h - headH - 3 * 46) / 2));
    const gy = (sheet.h - headH - 2 * bh) / 3;
    if (gy < 20) why.push('sheet');
    KINDS.forEach((k, i) => blocks.push({kind: k, x: 18, y: headH + gy + i * (bh + gy), w: blockW, h: bh, fit: fits[k]}));
  } else {
    const bh = Math.max(bh0, sheet.h - headH - 50);
    if (sheet.h - headH - bh < 20) why.push('sheet');
    KINDS.forEach((k, i) => blocks.push({kind: k, x: 18 + i * (blockW + 22), y: headH + (sheet.h - headH - bh) / 2, w: blockW, h: bh, fit: fits[k]}));
  }
  const pw = hz ? A.w * 0.3 : (A.w - 30) / 2;
  const pfMax = hz ? pw - plaqueTextX(pR) - 22 : pw - 40;
  const pf = s => fitG(s, {maxWidth: pfMax, size: F * 1.05, minSize: minF, maxLines: stress ? 3 : 2, weight: 800});
  const pFits = {law: pf(p.destinations.law), forum: pf(p.destinations.forum)};
  const afterFit = pf(p.afterValue);
  const big = [pFits.law, pFits.forum, afterFit].reduce((a, b) => (b.height > a.height ? b : a));
  const ph = hz ? Math.max(big.height, pR * 2) + 110 : stackedPlaqueH(pR, big);
  const top = plaqueTop(pw);
  const plq = {};
  if (hz) {
    const px = A.x + A.w - pw - 6;
    plq.law = {x: px, y: A.y + top + 8, w: pw, h: ph};
    plq.forum = {x: px, y: A.y + A.h - ph - 8, w: pw, h: ph};
  } else {
    const py = A.y + A.h - ph - 8;
    plq.law = {x: A.x, y: py, w: pw, h: ph};
    plq.forum = {x: A.x + pw + 30, y: py, w: pw, h: ph};
  }
  // tabs + dials (already slid out), needles aimed at their ports, sight lines
  const dials = blocks.map(b => {
    const P = plq[b.kind];
    let tab0, c, dir;
    if (hz) { const ex = sheet.x + sheet.w; c = {x: ex + 30 + R + Math.min(120, (P.x - ex - 2 * R - 100) * 0.4), y: sheet.y + b.y + 18 + discR}; tab0 = {x: ex - 40, y: c.y}; dir = 0; } else { const cx = sheet.x + b.x + b.w / 2; const ey = sheet.y + sheet.h; c = {x: cx, y: ey + 30 + R + Math.min(140, (P.y - top - ey - 2 * R - 90) * 0.35)}; tab0 = {x: cx, y: ey - 40}; dir = 90; }
    const port = hz ? {x: P.x - 4, y: P.y + P.h / 2} : {x: P.x + P.w / 2, y: P.y - top - 4};
    const a = toDeg(c, port);
    const rad = (a * Math.PI) / 180;
    return {kind: b.kind, tab0, c, dir, a, lineA: {x: c.x + Math.cos(rad) * (R + 10), y: c.y + Math.sin(rad) * (R + 10)}, port};
  });
  // lens source: the changed plaque (+ ornament and the line end), whole fields only
  const P = plq[ck];
  const m = 26;
  const src = hz ? {x: P.x - 22, y: P.y - top - m, w: P.w + 22 + Math.min(10, D.w - (P.x + P.w) - 2), h: P.h + top + 2 * m} : {x: P.x - m * 0.6, y: P.y - top - 70, w: P.w + m * 1.2, h: P.h + top + 70 + m * 0.6};
  src.w = Math.min(src.w, D.w - src.x - 1);
  const wasSize0 = Math.max((stress ? 16.4 : 19.8) / unitPx(ctx) / 1.5, F * 0.6);
  const wasFit = fitG(`${ctx.t.was}: ${p.destinations[ck]}`, {maxWidth: P.w - 30, size: wasSize0, minSize: wasSize0, maxLines: 2, weight: 600});
  const wasH = wasFit.height + 6 + 10;
  src.h = P.y + P.h + wasH + 6 - src.y;
  let lensArea, step = null;
  if (hz) {
    step = {cs: 0.4, ax: pad, ay: D.h / 2};
    const x0 = pad + (D.w - 2 * pad) * step.cs + 40;
    lensArea = {x: x0, y: pad, w: D.w - pad - x0, h: A.y + A.h - pad};
  } else {
    lensArea = {x: pad, y: A.y + 10, w: D.w - pad * 2, h: P.y - top - 70 - 30 - A.y};
  }
  const k = Math.min(lensArea.w / src.w, lensArea.h / src.h, 3);
  if (k < 1.5) why.push('lens-small');
  if (Math.min(src.w, src.h) * k * unitPx(ctx) < 0.36 * 1080) why.push('lens-px');
  const dest = {w: src.w * k, h: src.h * k};
  dest.x = lensArea.x + (lensArea.w - dest.w) / 2;
  dest.y = lensArea.y + (lensArea.h - dest.h) / 2;
  if ([head, fits.law, fits.forum, pFits.law, pFits.forum, afterFit].some(f => f.bad)) why.push('text');
  let notesPl = null;
  if (notes.length) {
    let ny = D.h - pad - nh;
    notesPl = [];
    for (let kk = 0; kk < rowsN; kk++) {
      let rh = 0;
      notes.slice(kk * cols, kk * cols + cols).forEach((q, j) => { const c = chipOf(q, pad + j * (cw + gap), ny, cw); if (c.bad) why.push('note-text'); rh = Math.max(rh, c.box.h); notesPl.push({q, c}); });
      ny += rh + gap;
    }
  }
  return {ok: !why.length, why, ck, wasSize0, F, minF, hz, A, R, discR, pR, sheet, head, headH, blocks, plq, pFits, afterFit, top, dials, src, dest, k, step, notesPl};
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
    const p = ctx.params;
    const th = ctx.theme;
    const showAll = ctx.show('all');
    const ck = p.changed;
    // one plaque, with the before/after label pair when it is the changed one (prefix c = context, l = lens, g = ghost)
    const plaqueNode = (k, P, show) => {
      const Q = L.plq[k];
      const label = fit => (L.hz
        ? {x: plaqueTextX(L.pR), y: (Q.h - fit.height) / 2, anchor: 'start'}
        : {x: Q.w / 2, y: 16 + L.pR * 2 + 12, anchor: 'middle'});
      const lab = (fit, name, op) => (show ? g({name, opacity: op}, txt(fit, {...label(fit), fill: INK})) : null);
      const changedOne = k === ck;
      return g({transform: T(Q.x, Q.y)},
        plaque(ctx, {kind: k, w: Q.w, h: Q.h, showText: show, discR: L.pR, stack: !L.hz}),
        changedOne
          ? g(null, lab(L.pFits[k], `${P}-before`, 1), lab(L.afterFit, `${P}-after`, 0),
            g({name: `${P}-band`, opacity: 0}, bandPath(ctx, L, Q)))
          : lab(L.pFits[k], undefined, 1),
        !show ? h('path', {d: L.hz ? `M${r(plaqueTextX(L.pR))} ${r(Q.h / 2)}h${r(Math.min(Q.w - plaqueTextX(L.pR) - 24, 170))}` : `M${r(Q.w * 0.25)} ${r(16 + L.pR * 2 + 26)}H${r(Q.w * 0.75)}`, stroke: '#d6cfc0', 'stroke-width': 10, 'stroke-linecap': 'round'}) : null,
      );
    };
    const content = (P, show) => g(null,
      L.dials.map(d => g({transform: `${T(d.tab0.x, d.tab0.y)} rotate(${d.dir})`}, clauseTab(ctx, d.kind, Math.hypot(d.c.x - d.tab0.x, d.c.y - d.tab0.y), L.R * 0.7))),
      L.dials.map(d => h('path', {d: `M${r(d.lineA.x)} ${r(d.lineA.y)}L${r(d.port.x)} ${r(d.port.y)}`, stroke: laneColor(ctx, d.kind), 'stroke-width': 5.5, 'stroke-linecap': 'round'})),
      L.dials.map(d => h('circle', {cx: r(d.port.x), cy: r(d.port.y), r: 9, fill: '#fff', stroke: laneColor(ctx, d.kind), 'stroke-width': 4})),
      g({transform: T(L.sheet.x, L.sheet.y)}, contractSheet(ctx, {w: L.sheet.w, h: L.sheet.h, head: L.head, headH: L.headH, blocks: L.blocks, showText: show, discR: L.discR})),
      L.dials.map((d, i) => g({transform: T(d.c.x, d.c.y)}, staticDial(ctx, d, `${P}-dial${i}`, L.R))),
      KINDS.map(k => plaqueNode(k, P, show)),
    );
    const lensContent = g(null, plaqueNode(ck, 'l', showAll), L.dials.filter(d => d.kind === ck).map(d => h('circle', {cx: r(d.port.x), cy: r(d.port.y), r: 9, fill: '#fff', stroke: laneColor(ctx, d.kind), 'stroke-width': 4})),
      g({name: 'l-was', opacity: 0}, showAll ? wasChip(ctx, L, p) : null));
    const lz = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: lensContent, color: th.accent2});
    const Dd = ctx.design, S0 = L.src;
    const dimmer = L.step ? null : h('path', {name: 'dimmer', d: `M0 0h${r(Dd.w)}v${r(Dd.h)}h${r(-Dd.w)}Z M${r(S0.x)} ${r(S0.y)}v${r(S0.h)}h${r(S0.w)}v${r(-S0.h)}Z`, 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0});
    const Q = L.plq[ck];
    const marker = changedMarker(ctx, {name: 'marker', x: Q.x + Q.w - 4, y: Q.y + 4, radius: 18, opacity: 0});
    const notes = L.notesPl ? L.notesPl.map(pl => g({name: `${pl.q.name}-g`, opacity: 0}, pl.c.node)) : [];
    const ghost = L.step ? g({name: 'ghost', opacity: 0}, content('g', false)) : null;
    const srcS = L.step ? h('rect', {name: 'srcS', rx: 8, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}) : null;
    return g({name: 'scene'}, g({name: 'ctx'}, g({name: 'creal'}, content('c', showAll)), ghost), srcS, dimmer, marker, g({'data-occludes': 1}, lz.node), notes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const lz = lens(ctx, {name: 'lens', source: L.src, dest: L.dest, content: null});
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const pq = u < W.close[0] ? open : 1 - close;
    Object.assign(nodes, lz.frame(pq, pq));
    if (!L.step) nodes.dimmer = {opacity: r(0.42 * pq, 3)};
    const copy = clamp((pq - 0.22) / 0.2);
    nodes['lens-content'] = {...nodes['lens-content'], opacity: r(copy, 3)};
    const outQ = seg(u, ...W.out), inQ = seg(u, ...W.in);
    const sub = inQ > 0;
    const showT = ctx.show('all');
    if (showT) {
      nodes['l-before'] = {opacity: r(1 - outQ, 3), transform: `translate(0 ${r(-outQ * 14, 2)})`};
      nodes['l-after'] = {opacity: r(inQ, 3)};
    }
    const bandQ = seg(u, ...W.band);
    nodes['l-band'] = {opacity: r(bandQ, 3)};
    nodes['l-was'] = {opacity: r(seg(u, ...W.was) * (1 - seg(u, W.close[0] - 0.02, W.close[0])), 3)};
    const ctxDatum = u < W.open[0] ? 1 : u < W.close[0] ? clamp(1 - copy * 8) : 0;
    const ctxIn = seg(u, ...W.ctxIn);
    const cb = u < W.in[0] ? ctxDatum : 0;
    const ca = u < W.close[0] ? 0 : ctxIn;
    const pre = L.step ? ['c', 'g'] : ['c'];
    for (const P of pre) {
      if (showT && P === 'c') { nodes['c-before'] = {opacity: r(cb, 3), transform: 'translate(0 0)'}; nodes['c-after'] = {opacity: r(ca, 3)}; }
      nodes[`${P}-band`] = {opacity: r(u < W.close[0] ? (u < W.band[0] ? 0 : ctxDatum) : ctxIn, 3)};
    }
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    if (L.step) {
      const st = L.step;
      const sc = 1 + (st.cs - 1) * ease.inOutSine(pq);
      nodes.ctx = {transform: `translate(${r(st.ax, 2)} ${r(st.ay, 2)}) scale(${r(sc, 4)}) translate(${r(-st.ax, 2)} ${r(-st.ay, 2)})`};
      const tq = clamp((sc - 0.975) / 0.025);
      nodes.creal = {opacity: r(tq, 3)};
      nodes.ghost = {opacity: r(1 - tq, 3)};
      const S2 = L.src, X = v => st.ax + (v - st.ax) * sc, Y = v => st.ay + (v - st.ay) * sc;
      nodes.srcS = {x: r(X(S2.x)), y: r(Y(S2.y)), width: r(S2.w * sc), height: r(S2.h * sc), opacity: pq > 0.05 ? 1 : 0};
      for (const nm of ['lens-src', 'lens-coneA', 'lens-coneB']) if (nodes[nm]) nodes[nm] = {...nodes[nm], opacity: 0};
    } else nodes.ctx = {transform: 'translate(0 0)'};
    const noteO = seg(u, ...W.notes), keyO = seg(u, ...W.key);
    if (L.notesPl) for (const pl of L.notesPl) nodes[`${pl.q.name}-g`] = {opacity: r(pl.q.kind === 'key' ? keyO : noteO, 3)};
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : u < BEATS.ret[1] ? 'return' : 'hold';
    const other = KINDS.find(k => k !== p.changed);
    return {
      nodes,
      semantic: {
        beat, value: sub ? 'after' : 'before', shownValue: sub ? p.afterValue : p.destinations[p.changed], changed: p.changed,
        otherValue: p.destinations[other], otherNeedleDeg: r(L.dials.find(d => d.kind === other).a, 2),
        lensOpen: r(pq, 3), copyShown: r(copy, 3), contextDatum: r(Math.max(cb, ca), 3), bandShown: r(bandQ, 3),
        zoom: r(L.k, 3), markerShown: r(seg(u, ...W.marker), 3), keyShown: r(keyO, 3),
        lensBox: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)}, srcBox: {x: r(L.src.x), y: r(L.src.y), w: r(L.src.w), h: r(L.src.h)},
        textPx: r(L.F * L.upx, 2), layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
      },
    };
  },
};

function bandPath(ctx, L, Q) {
  const R = L.pR;
  const cx = L.hz ? 18 + R : Q.w / 2, cy = L.hz ? Q.h / 2 : 16 + R;
  return h('circle', {cx: r(cx), cy: r(cy), r: r(R + 7), fill: 'none', stroke: laneColor(ctx, 'forum') === laneColor(ctx, L.ck) ? laneColor(ctx, L.ck) : laneColor(ctx, L.ck), 'stroke-width': 4});
}
function staticDial(ctx, d, name, R) {
  return compassDial(ctx, d.kind, name, R, d.a);
}
function wasChip(ctx, L, p) {
  const Q = L.plq[p.changed];
  const size = L.wasSize0;
  const text = `${ctx.t.was}: ${p.destinations[p.changed]}`;
  const maxW = Q.w;
  return chipG(ctx, text, {x: Q.x + 4, y: Q.y + Q.h + 4, maxWidth: maxW, size, minSize: size, padY: 3, maxLines: 2, weight: 600, fill: '#ffffff'}).node;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-08-inspect',
    title: 'Agreed law and forum, without doctrine — a lens isolates the plaque one clause points to; its supplied label is substituted while the other clause and plaque stay untouched',
    titleEs: 'Ley y foro pactados — Inspección y cambio de un dato',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Ley y foro pactados',
    treatment: 'inspect',
    family: 'detail-lens',
    description: 'Context: the contract with two separate clause blocks, each tab\'s compass needle pointing along its own sight line to its own plaque ("Law X (fictional)", "Forum Y (fictional)"). A lens opens on one plaque (a real enlargement ≥ 1.5×); its supplied label is substituted (default "Forum Y (fictional)" → "Forum Z (fictional)"), a "was" trace keeps the old value and the emblem gains an outer ring. The lens closes; the context shows the new label with the neutral Δ marker; the other clause, needle, line and plaque never change. Key "As supplied · no conclusion drawn". No doctrine, no real places or courts, no outcome.',
    tags: ['choice of law', 'choice of forum', 'inspect', 'lens', 'substitution', 'plaques', 'separate clauses'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/ley-y-foro.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
