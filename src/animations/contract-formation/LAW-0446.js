/**
 * LAW-0446 — Aceptación y contrapropuesta · mechanism
 *
 * Storyboard (an exploded, flat anatomy of the response — not the story's
 * stage with another camera): Party A's portrait on one side, the offer sheet
 * (field labels + printed pieces), the copy set pulled out into its own column,
 * the reply sheet (empty slots) and Party B's portrait on the other side; the
 * rows of the three columns line up, so each copy sits between the offer's
 * piece it copies and the reply slot it fills.
 *  0.00–0.18  separate: the copies slide out of the offer into the middle
 *             column (the offer keeps its printed pieces); when the supplied
 *             response replaces a piece, B's different piece slides out beside
 *             B's portrait.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             anchored to the elements' edges, each captioned by its kind
 *             (relation / communication / sequence); a plain relation has no
 *             arrowhead; causal only when supplied.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order along the
 *             connectors; the supplied focus element swells while visited.
 *  0.75–1.00  gather: the copies slide on into the reply's slots; with a
 *             replacement, that copy slides back to the offer and B's piece
 *             takes its slot (Δ). Origin (offer), transformation (the copy set)
 *             and state (the reply as supplied) stay visible with the key.
 *             No legal effect is stated.
 * @module animations/contract-formation/LAW-0446
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {fitDesign} from '../../core/layout.js';
import {seg, clamp, lerp, r, ease, stagger} from '../../core/time.js';
import {roundRectPath, polyline, cubic} from '../../core/geometry.js';
import {list, str, obj, oneOf} from '../../schemas/fields.js';
import {mechanismFields} from '../../schemas/fields.js';
import {textBlock, connector, tracer} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {changedMarker} from '../../primitives/markers.js';
import {actorLook} from '../../primitives/people-style.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  motifFields, responseItem, DEFAULT_CONTENT, KIT_STRINGS, resolveResponse, measureDocs, pieceArt, tabColor, chipW, fitW,
  overlaps, insideBox, unionBox, legendChip, segHitsBox, SHEET, TILE,
} from './kits/aceptacion-contrapropuesta.js';

const ID = 'LAW-0446';
const DURATION = 7000;
const IDS = ['offeror', 'offer', 'pieces', 'reply', 'offeree'];
// gather is sequenced so no moving tile ever passes over text: the replaced copy returns (ret), the copies slide
// into the reply (copies), then the different piece slides into its slot (diff)
const W = {separate: [0.02, 0.17], relate: [0.18, 0.43], trace: [0.45, 0.74], gather: [0.76, 0.92], ret: [0.76, 0.81], copies: [0.8, 0.87], diff: [0.86, 0.92], tags: [0.9, 0.95], key: [0.9, 0.94]};

const STRINGS = {
  en: {...KIT_STRINGS.en, copied: 'Copies placed in the reply (as supplied)', legendTitle: 'Connector kinds'},
  es: {...KIT_STRINGS.es, copied: 'Copias colocadas en la respuesta (según lo aportado)', legendTitle: 'Tipos de conexión'},
};

const mf = mechanismFields(IDS);
const sceneSchema = {
  ...motifFields,
  responses: list('The supplied response (the mechanism uses the first one): which pieces the reply carries', responseItem, 1, 2),
  ...mf,
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  responses: [{reference: 'RE-2041', mode: 'one-piece-substituted', termIndex: 1, value: 'Day 14'}],
  elements: [
    {id: 'offeror', label: 'Offering party'},
    {id: 'offer', label: 'Offer (printed pieces)'},
    {id: 'pieces', label: 'Copy set'},
    {id: 'reply', label: 'Reply message'},
    {id: 'offeree', label: 'Answering party'},
  ],
  relationships: [
    {from: 'offeror', to: 'offer', kind: 'communication'},
    {from: 'offer', to: 'pieces', kind: 'relation'},
    {from: 'pieces', to: 'reply', kind: 'sequence'},
    {from: 'offeree', to: 'reply', kind: 'relation'},
    {from: 'reply', to: 'offeror', kind: 'communication'},
  ],
  focusElement: 'pieces',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['offeror', 'offer', 'pieces', 'reply', 'offeror'],
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

/**
 * Anatomy layout for one text size. Rows align across offer | copies | reply so
 * the copies slide straight; the sheets, gaps and row pitch stretch to fill the
 * frame. Landscape/square: one row of columns under the two portraits (A over
 * the offer, B over the reply). Portrait: offer | copies on top, the reply under
 * the copies, B's portrait below the reply.
 */
function anatomy(ctx, p, o) {
  const shape = ctx.view.shape;
  const DW = ctx.design.w, DH = ctx.design.h;
  const {F, FL, R} = o;
  const show = ctx.show('all');
  const why = [];
  const tw = o.tw, lw = o.lw;
  // the parties are the portraits: the offer shows reference + title; the reply its tag + reference (a band above its slots)
  const M = measureDocs(ctx, {terms: p.terms, offer: p.offer, parties: p.parties, response: R, replyTag: ctx.params.locale === 'es' ? 'Respuesta' : 'Reply', tw, lw, hw: 0, above: true, F, FL, show, compact: 'title', replyHdrW: SHEET.cp * 2 + tw, inlineHdr: true});
  if (M.bad.length) why.push('text');
  const N = p.terms.length;
  const m = 14;
  const cp = SHEET.cp;
  const cw = cp + tw + cp;
  const offerW = lw + cw, replyW = cw;                // the reply: a header band over its slots
  const hO = M.offerHdr.h, hR = M.replyHdr.h;
  const elLabel = id => (p.elements.find(e => e.id === id) || {}).label || id;
  const Rb = clamp(F * 2.1, 56, 84);
  const nameFit = i => (ctx.show('key') ? fitW(`${p.parties[i].name} · ${elLabel(i ? 'offeree' : 'offeror')}`, {maxWidth: Math.max(Rb * 3.4, 300), size: FL, minSize: FL, maxLines: 3, weight: 600}) : null);
  const badgeLab = [0, 1].map(nameFit);
  badgeLab.forEach(f => { if (f && f.bad) why.push('name'); });
  const nameH = Math.max(...badgeLab.map(f => (f ? f.height + FL * 0.72 : 0)));
  const capH = ctx.show('key') ? FL * 2 * 1.18 + FL * 0.72 + 12 : 0;   // element captions under the columns
  // the closing tags row (legend + key): as many lines as its chips take
  const tagLines = Math.max(1, ...[ctx.show('all') ? ctx.t.copied : null, ctx.show('key') ? ctx.t.key : null].filter(Boolean).map(t => fitW(t, {maxWidth: DW * 0.46 - FL * 3, size: FL, minSize: FL, maxLines: 3, weight: 600}).lines.length));
  const footH = (ctx.show('all') || ctx.show('key')) ? FL * 1.18 * tagLines + FL * 0.72 + 24 : 0;
  const th0 = M.th, tgMin = 8;
  const lo = M.labelsAbove ? M.labH + 6 : 0;          // label line(s) printed above each offer piece (all columns keep the rows aligned)
  // B's different piece waits beside its slot (right of the reply in a row; left of it when tall), at its own row
  // (diffBelow, a row too narrow for that: it waits right under the reply, above the reply's caption, and rises into
  // its slot through empty slots only)
  const diffRoom = R.substituted && !o.diffBelow ? tw + 34 : 0;
  let pos;
  if (shape !== 'portrait' && !o.tall) {
    const need = offerW + cw + replyW + diffRoom + 2 * m;
    const gap = (DW - need) / 2;
    if (gap < (o.minGap ?? 130)) why.push('width');
    const gapW = Math.round(gap);
    const g2 = gap;
    const x0 = (DW - (offerW + cw + replyW + diffRoom + 2 * g2)) / 2;
    const xO = x0, xP = xO + offerW + g2, xR = xP + cw + g2;
    // sheets start below the portraits, their names and the return arc; a party's connector to its sheet runs at
    // least three caption lines
    // (the connector also runs sideways from the portrait to the sheet's middle: the vertical gap makes up the rest)
    // portraits: A over the offer's left part, B over the reply's right part (their links run sideways too)
    const Ax = xO + Math.min(offerW / 2, Rb + 40), Bx = diffRoom ? Math.min(xR + replyW + diffRoom / 2, DW - m - Rb) : Math.min(xR + replyW - Rb * 0.6, DW - m - Rb);
    const dxA = Math.min(Math.abs(Ax - (xO + offerW / 2)), Math.abs(Bx - (xR + replyW / 2)));
    const top = m + 2 * Rb + nameH + Math.max(56, 2.2 * FL + 28, Math.sqrt(Math.max(0, (3.2 * FL * 1.18 + 12) ** 2 - dxA ** 2)));
    const rowTop = top + Math.max(hO, hR) + cp;
    const avail = DH - m - footH - capH - rowTop - cp - (o.diffBelow ? th0 + 16 : 0);
    const pitch = clamp((avail - lo) / N, th0 + tgMin + lo, (th0 + tgMin + lo) * 2.2);
    if (avail < N * (th0 + tgMin + lo) - tgMin) why.push('height');
    const bandH = lo + (N - 1) * pitch + th0;
    pos = {
      A: {x: Ax, y: m + Rb},
      B: {x: Bx, y: m + Rb},
      offer: {x: xO, y: rowTop - cp - hO, w: offerW, h: hO + bandH + 2 * cp},
      pieces: {x: xP, y: rowTop - cp, w: cw, h: bandH + 2 * cp},
      reply: {x: xR, y: rowTop - cp - hR, w: replyW, h: hR + bandH + 2 * cp},
      rowTopO: rowTop, rowTopR: rowTop, pitch, bandH, gapW,
      diffHome: !R.substituted ? null : o.diffBelow ? () => ({x: xR + cp + tw, y: rowTop + bandH + cp + 8 + th0 / 2}) : i => ({x: xR + replyW + 24 + tw, y: rowTop + lo + th0 / 2 + i * pitch}),
    };
  } else {
    const gap = DW - 2 * m - offerW - cw;
    if (gap < 110) why.push('width');
    const g2 = Math.min(gap, 200);
    const x0 = (DW - (offerW + cw + g2)) / 2;
    const xO = x0, xP = xO + offerW + g2;
    const dxA = Math.abs(offerW / 2 - Rb - 10);
    // (room for the link's caption on it)
    const topA = m + 2 * Rb + nameH + Math.max(40, 2.2 * FL + 28, Math.sqrt(Math.max(0, (3.2 * FL * 1.18 + 12) ** 2 - dxA ** 2)));
    const rowTop = topA + hO + cp;
    // B's portrait (and B's different piece under it) sit left of the reply, under the offer
    const leftH = 2 * Rb + nameH + 20 + (R.substituted ? th0 + 24 : 0);
    // the copy set → reply link runs down the column's left side: three caption lines between them
    const gapPR = Math.max(3.4 * FL * 1.18 + 16, 70);
    const fixed = rowTop + cp + capH + gapPR + hR + 2 * cp + capH + footH + m;
    const avail = (DH - fixed) / 2;                      // two row bands (offer/copies, reply)
    const pitch = clamp((avail - lo) / N, th0 + tgMin + lo, (th0 + tgMin + lo) * 1.8);
    if (avail < N * (th0 + tgMin + lo) - tgMin) why.push('height');
    const bandH = lo + (N - 1) * pitch + th0;
    const replyTop = rowTop + bandH + cp + capH + gapPR;
    // tall: the reply's header band sits under its slots (the copies come down from the copy set above)
    const rowTopR = replyTop + cp;
    const replyBottom = replyTop + hR + bandH + 2 * cp;
    // B's portrait at the top of the left column, or at its bottom when B's different piece waits (at its own
    // row, left of the reply) where the portrait would be
    const dY = R.substituted ? rowTopR + lo + th0 / 2 + R.k * pitch : null;
    const topBox = [replyTop, replyTop + 2 * Rb + nameH + 8];
    // the piece waits right beside the reply; the portrait (and its name) keep to the left of it
    const nwB0 = badgeLab[1] ? badgeLab[1].width + FL * 1.2 : 0;
    const bRight = Math.max(xO + 2 * Rb + 20, xO + Rb + 10 + nwB0 / 2);
    const clashX = bRight + 12 > xP - 16 - tw;
    const clash = b => dY !== null && clashX && dY + th0 / 2 + 8 > b[0] && dY - th0 / 2 - 8 < b[1];
    // (else under the reply's last row, beside its header band)
    const By = !clash(topBox) ? replyTop + Rb : Math.max(replyBottom - nameH - 8 - Rb, rowTopR + lo + (N - 1) * pitch + th0 / 2 + 12 + Rb);
    if (clash([By - Rb, By + Rb + nameH + 8])) why.push('diff');
    if (By + Rb + nameH + 8 + footH + m > DH) why.push('height');
    pos = {
      A: {x: xO + Rb + 10, y: m + Rb},
      B: {x: xO + Rb + 10, y: By},
      offer: {x: xO, y: topA, w: offerW, h: hO + bandH + 2 * cp},
      pieces: {x: xP, y: rowTop - cp, w: cw, h: bandH + 2 * cp},
      reply: {x: xP, y: replyTop, w: replyW, h: hR + bandH + 2 * cp},
      rowTopO: rowTop, rowTopR, pitch, bandH,
      diffHome: R.substituted ? i => ({x: xP - 16, y: rowTopR + lo + th0 / 2 + i * pitch}) : null,
    };
    if (replyTop + Math.max(leftH, hR + bandH + 2 * cp) + capH + footH > DH - m) why.push('height');
    if (R.substituted && xP - 16 - tw < xO) why.push('diff');
    const nwB = badgeLab[1] ? badgeLab[1].width + FL * 1.2 : 0;
    if (Math.max(xO + 2 * Rb + 20, xO + Rb + 10 + nwB / 2, m + nwB) > xP - 16) why.push('nameB');
  }
  return {lo, diffBelow: Boolean(o.diffBelow), tall: shape === 'portrait' || !!o.tall, M, N, th: th0, tg: pos.pitch - th0, pitch: pos.pitch, bandH: pos.bandH, cw, offerW, replyW, tw, lw, pos, Rb, badgeLab, why, F, FL, elLabel};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const DW = ctx.design.w, DH = ctx.design.h;
    const upx = unitPx(ctx);
    const R = resolveResponse(p, p.responses[0]);
    const big = [{F: 40, FL: 32, min: 30}, {F: 36, FL: 29, min: 27}, {F: 32, FL: 26, min: 25}, {F: 29, FL: 24, min: 23}];
    const pxSets = [...big, {F: 26, FL: 22, min: 21}, {F: 23, FL: 20.5, min: 20}, {F: 21, FL: 19.8, min: 19.6}, {F: 18, FL: 17, min: 16.5}, {F: 16.6, FL: 16.1, min: 16.05}];
    let best = null;
    for (const px of pxSets) {
      const F = px.F / upx, FL = Math.max(px.min, px.FL) / upx;
      // column gaps: 130 (room for the relation captions); 96 only when nothing fits at this text size
      // (below the reply first: it keeps the row as wide as the frame at the end, when the piece has left)
      const dA = R.substituted && shape !== 'portrait' ? [true, false] : [false];
      for (const [tall, minGap, diffBelow] of (shape === 'square' ? [[false, 130], [true, 130], [false, 96], [false, 84]] : [[false, 130], [false, 96]]).flatMap(q => (q[0] ? [[...q, false]] : dA.map(d => [...q, d])))) {
      if (best && best.ok) break;
      for (const twf of [6, 7, 8.5, 10, 12, 14, 17, 20]) {
        for (const lwf of [4, 5, 6.5, 8, 10, 12, 0]) {
          const A = anatomy(ctx, p, {F, FL, R, tall, minGap, diffBelow, tw: twf * F + TILE.tabW + TILE.padL + TILE.gripM, lw: lwf ? lwf * FL + SHEET.lp * 2 : 0});
          const C = A.why.length ? null : compose(ctx, p, A, R, upx);
          const cand = C || {...A, ok: false};
          if (!best || (cand.ok && !best.ok) || (!cand.ok && !best.ok && cand.why.length < best.why.length)) best = cand;
          if (cand.ok) break;
        }
        if (best.ok) break;
      }
      }
      if (best.ok) break;
    }
    if (!best.nodes) best = compose(ctx, p, best, R, upx, true);
    return {...best, R, upx};
  },
  build(ctx, L) {
    return g({transform: L.dy ? T(0, L.dy) : undefined}, L.nodes);
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const sep = ease.inOutCubic(seg(u, ...W.separate));
    const N = L.N;
    const sub = L.R.substituted, kk = L.R.k;
    // copies: offer → middle column (separate) → reply slots (gather); a replaced copy goes back to the offer
    // gather, in turn: the replaced copy slides back toward the offer and dissolves before it reaches the offer's
    // own piece; the copies slide straight into their slots (in parallel, keeping their spacing); then B's
    // different piece slides straight into its slot — no tile ever passes over a text
    // (a piece waiting above its slot drops in before the copies arrive: it only passes empty slots)
    const wC = L.diffBelow ? W.diff : W.copies, wD = L.diffBelow ? [W.copies[0], W.copies[0] + (W.diff[1] - W.diff[0])] : W.diff;
    const ret = ease.inOutCubic(seg(u, ...W.ret)), cps = ease.inOutCubic(seg(u, ...wC)), dif = ease.inOutCubic(seg(u, ...wD));
    const pieces = [];
    for (let i = 0; i < N; i++) {
      const a = L.slotOffer(i), m = L.slotMid(i);
      let q, op = 1;
      if (sep < 1 || u < W.ret[0]) q = {x: lerp(a.x, m.x, sep), y: lerp(a.y, m.y, sep) - Math.sin(Math.PI * sep) * 24};
      else if (sub && i === kk) {
        q = {x: lerp(m.x, a.x, ret), y: m.y};
        // gone before its body reaches the offer's printed piece
        op = clamp((q.x - (a.x + L.tw)) / (L.tw * 0.6));
      } else {
        const z = L.slotReply(i);
        q = {x: lerp(m.x, z.x, cps), y: lerp(m.y, z.y, cps)};
      }
      nodes[`cp${i}`] = {transform: T(q.x, q.y), opacity: r(op, 3)};
      pieces.push({x: r(q.x), y: r(q.y)});
    }
    let diff = null;
    if (sub) {
      const a = L.diffHome, z = L.slotReply(kk);
      const outP = ease.inOutCubic(seg(u, 0.06, 0.17));
      const q = {x: lerp(a.x, z.x, dif), y: lerp(a.y, z.y, dif)};
      nodes.diff = {transform: T(q.x, q.y), opacity: r(Math.min(1, outP * 1.5), 3)};
      diff = {x: r(q.x), y: r(q.y)};
    }
    const gat = ease.inOutCubic(seg(u, ...W.gather));
    // the copy set's frame follows the middle column while the copies sit there
    // (it stays after the gather: the copy set is the transformation between origin and state)
    nodes['set-frame'] = {opacity: r(sep, 3)};
    nodes['set-ghost'] = {opacity: r(clamp((gat - 0.15) / 0.5), 3)};
    // relations, one by one
    const n = L.conns.length;
    const drawn = L.conns.map((c, i) => r(stagger(u, i, n, W.relate[0], W.relate[1], 0.25), 3));
    L.conns.forEach((c, i) => {
      Object.assign(nodes, c.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
      // (a caption in a tile path steps aside while the tiles pass)
      const aside = c.stepAside ? 1 - clamp((u - (W.gather[0] - 0.03)) / 0.03) + clamp((u - W.gather[1]) / 0.03) : 1;
      if (c.lab) nodes[`lab${i}`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45) * Math.min(1, aside), 3)};
    });
    // tracer along the supplied order
    const tp = seg(u, ...W.trace);
    const tr = L.route.poly.at(ease.inOutSine(tp));
    const te = ease.inOutSine(tp);
    const tOn = L.route.runs.reduce((m, [a, b]) => Math.max(m, Math.min(clamp((te - a) / 0.015), clamp((b - te) / 0.015))), 0);
    const tVis = tp > 0 && tp < 1 && tOn > 0;
    nodes.tracer = {opacity: tVis ? r(tOn, 3) : 0, transform: T(tr.x, tr.y)};
    const visited = L.route.visits.filter(v => tp > 0 && ease.inOutSine(tp) >= v.t - 1e-6).map(v => v.id);
    // focus element swells while the tracer is on it
    const fv = L.route.visits.find(v => v.id === p.focusElement);
    const near = fv && tVis ? clamp(1.4 - Math.abs(ease.inOutSine(tp) - fv.t) / 0.2) : 0;
    const fs = 1 + 0.08 * ease.inOutSine(near);
    const fb = L.focusBox;
    nodes['focus'] = {transform: fb && fs !== 1 ? scaleAbout(fb.x + fb.w / 2, fb.y + fb.h / 2, fs) : ''};
    // gather: tags and key
    nodes.tags = {opacity: r(seg(u, ...W.tags), 3)};
    if (L.hasKey) nodes.key = {opacity: r(seg(u, ...W.key), 3)};
    if (sub) nodes['d-mark'] = {opacity: r(seg(u, ...W.tags), 3)};
    const beat = u < 0.18 ? 'separate' : u < 0.43 ? 'relate' : u < 0.75 ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tilesOut: r(sep, 3),
        gathered: r(gat, 3),
        relationsDrawn: drawn,
        relationKinds: L.conns.map(c => c.rel.kind),
        arrows: L.conns.map(c => ({kind: c.rel.kind, arrow: c.rel.kind !== 'relation' && c.rel.kind !== 'disputed'})),
        tracerVisible: tVis,
        tracer: {x: r(tr.x), y: r(tr.y)},
        visitOrder: visited,
        focusScale: r(fs, 3),
        anchoredEnds: L.anchored,
        labelDistPx: L.labelDist || [],
        diffBelow: Boolean(L.diffBelow),
        connectorPx: L.conns.map(c => Math.round((c.len || 0) * L.upx)),
        labelsClear: L.labelsClear,
        pieces,
        diff,
        replaced: sub ? kk : null,
        layoutOk: L.ok,
        why: L.why.join(','),
      },
    };
  },
};

/** Build all nodes for an anatomy; returns layout data + ok flag. */
function compose(ctx, p, A, R, upx, force) {
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const DW = ctx.design.w, DH = ctx.design.h;
  const show = ctx.show('all');
  const why = [...A.why];
  const {M, N, pos, F, FL, tw, cw} = A;
  const hh = A.th;
  const rowTopO = pos.rowTopO;
  const rowTopR = pos.rowTopR;
  const rowY = (top, i) => top + A.lo + hh / 2 + i * A.pitch;
  const gripX = box => box.x + box.w - SHEET.cp;           // piece right end inside a column
  const slotOffer = i => ({x: gripX(pos.offer), y: rowY(rowTopO, i)});
  const slotMid = i => ({x: gripX(pos.pieces), y: rowY(pos.pieces.y + SHEET.cp, i)});
  const slotReply = i => ({x: gripX(pos.reply), y: rowY(rowTopR, i)});
  const looks = [actorLook(ctx, p.parties[0], 0), actorLook(ctx, p.parties[1], 1)];
  const nodes = [];
  // ---- sheets
  const sheet = (box, fill, hdr, labels, name, hdrBottom = false) => {
    // offer: header band on top; reply: the same, or (tall) a band under its slots
    const hy = hdrBottom ? box.h - hdr.h : 0;
    const parts = [
      h('path', {d: roundRectPath(box.x + 5, box.y + 7, box.w, box.h, 8), fill: th.shadow}),
      h('path', {d: roundRectPath(box.x, box.y, box.w, box.h, 8), fill, stroke: th.ink, 'stroke-width': 2.4}),
      h('path', {d: `M${r(box.x + 10)} ${r(box.y + (hdrBottom ? box.h - hdr.h : hdr.h))}H${r(box.x + box.w - 10)}`, stroke: th.paperLine, 'stroke-width': 2}),
    ];
    hdr.lines.forEach(ln => parts.push(ln.fit ? textBlock(ln.fit, {x: box.x + SHEET.hp + (ln.x || 0), y: box.y + hy + ln.y, fill: ln.color, name: `${name}-${ln.key}`}) : h('rect', {x: r(box.x + SHEET.hp), y: r(box.y + hy + ln.y + ln.h * 0.2), width: r(ln.w * 0.7), height: r(ln.h * 0.5), rx: 3, fill: th.paperLine})));
    if (labels) {
      p.terms.forEach((t, i) => {
        const f = M.labels[i];
        const y = rowY(rowTopO, i);
        const lx = M.labelsAbove ? box.x + box.w - SHEET.cp - tw + 4 : box.x + SHEET.lp;
        const ly = M.labelsAbove ? y - hh / 2 - A.lo : null;
        parts.push(f ? textBlock(f, {x: lx, y: ly ?? y - f.height / 2, fill: th.inkSoft, name: `${name}-lab${i}`}) : h('rect', {x: r(lx), y: r(ly !== null ? ly + 4 : y - 5), width: r((M.labelsAbove ? tw : A.offerW) * 0.18), height: 10, rx: 3, fill: th.paperLine}));
      });
    }
    return g({name}, parts);
  };
  nodes.push(sheet(pos.offer, th.paper, M.offerHdr, true, 'offer'));
  // printed pieces on the offer
  p.terms.forEach((t, i) => {
    const art = pieceArt(ctx, {tw, th: hh, kind: 'printed', tab: tabColor(ctx, i), value: show ? M.values[i] : null, bars: show ? 0 : 0.6});
    nodes.push(g({transform: T(slotOffer(i).x, slotOffer(i).y)}, art.front));
  });
  nodes.push(sheet(pos.reply, th.card, M.replyHdr, false, 'reply', A.tall));
  p.terms.forEach((t, i) => {
    const s = slotReply(i);
    nodes.push(h('path', {d: roundRectPath(s.x - tw, s.y - hh / 2, tw, hh, 7), fill: 'none', stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
  });
  // copy-set column frame (focus element: swells as a group)
  const pb = pos.pieces;
  const focusParts = [g({name: 'set-frame', opacity: 0},
    h('path', {d: roundRectPath(pb.x, pb.y, pb.w, pb.h, 10), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2, 'stroke-dasharray': '8 6', opacity: 0.7})),
    // once the copies have left, the set keeps the outline of every copy it carried (tab colour + dashed body)
    g({name: 'set-ghost', opacity: 0}, p.terms.map((t, i) => {
      const q = slotMid(i);
      return g(null,
        h('path', {d: roundRectPath(q.x - tw, q.y - hh / 2, tw, hh, 7), fill: th.card, 'fill-opacity': 0.55, stroke: th.accent2, 'stroke-width': 2, 'stroke-dasharray': '7 6'}),
        h('path', {d: roundRectPath(q.x - tw, q.y - hh / 2, TILE.tabW, hh, 4), fill: tabColor(ctx, i), opacity: 0.55}));
    }))];
  // ---- badges (A left/top, B right/bottom)
  const badges = [0, 1].map(i => personBadge(ctx, {name: i ? 'badgeB' : 'badgeA', x: i ? pos.B.x : pos.A.x, y: i ? pos.B.y : pos.A.y, radius: A.Rb, look: looks[i]}));
  badges.forEach(b => nodes.push(b.node));
  const nameChips = [0, 1].map(i => {
    if (!A.badgeLab[i]) return null;
    const b = badges[i];
    const w = A.badgeLab[i].width + FL * 1.2;
    const cx = clamp(b.circle.x, 14 + w / 2, DW - 14 - w / 2);    // never past the design box edge
    return chipW(ctx, '', {x: cx, y: b.circle.y + A.Rb + 10, anchor: 'middle', size: FL, fit: A.badgeLab[i], maxWidth: A.Rb * 3.4, name: `name${i}`});
  });
  // (the tracer paints under the name chips, element captions and relation labels, so it never covers their text)
  nodes.push(tracer(ctx, 'tracer', th.accent));
  nameChips.forEach(c => c && nodes.push(c.node));
  // element captions (supplied labels) right under the offer, the copy set and the reply
  const elCaps = ['offer', 'pieces', 'reply'].map(id => {
    const b = pos[id];
    if (!ctx.show('key')) return null;
    const above = A.tall && id === 'pieces';
    const probe = above ? chipW(ctx, A.elLabel(id), {x: 0, y: 0, anchor: 'middle', maxWidth: Math.max(b.w, 200), size: FL, maxLines: 2, weight: 700}) : null;
    const c = chipW(ctx, A.elLabel(id), {x: b.x + b.w / 2, y: above ? b.y - 12 - probe.box.h : b.y + b.h + 12 + (A.diffBelow && id === 'reply' ? A.th + 16 : 0), anchor: 'middle', maxWidth: Math.max(b.w, 200), size: FL, maxLines: 2, weight: 700, stroke: th.inkSoft, name: `cap-${id}`});
    if (c.fit.bad) why.push(`cap-${id}`);
    nodes.push(c.node);
    return c;
  });
  // ---- elements for connectors
  const els = {
    offeror: {circle: badges[0].circle, chip: nameChips[0] && nameChips[0].box},
    offer: {box: pos.offer},
    pieces: {box: pos.pieces},
    reply: {box: pos.reply},
    offeree: {circle: badges[1].circle, chip: nameChips[1] && nameChips[1].box},
  };
  const center = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
  // connector anchors: sheet-to-sheet links attach above the rows (in the header band) so no line crosses a piece
  const anchorOf = (id, toward, rel) => {
    const e = els[id];
    if (e.circle) {
      const c = e.circle, t = toward;
      // a sheet below the portrait: from under the name chip (the line never runs through the name)
      if (e.chip && t.y > e.chip.y + e.chip.h) return {x: e.chip.x + e.chip.w / 2, y: e.chip.y + e.chip.h + 8};
      const a = Math.atan2(t.y - c.y, t.x - c.x);
      return {x: c.x + (c.r + 8) * Math.cos(a), y: c.y + (c.r + 8) * Math.sin(a)};
    }
    const b = e.box;
    const hdrY = b.y + Math.min(26, b.h * 0.1);
    if (toward.x > b.x + b.w) return {x: b.x + b.w + 8, y: id === 'pieces' ? b.y + 18 : hdrY};
    if (toward.x < b.x) return {x: b.x - 8, y: id === 'pieces' ? b.y + 18 : hdrY};
    return {x: b.x + b.w / 2, y: toward.y < b.y ? b.y - 8 : b.y + b.h + 8};
  };
  const conns = p.relationships.map((rel, i) => {
    const eA = els[rel.from], eB = els[rel.to];
    let from = anchorOf(rel.from, center(eB), rel), to = anchorOf(rel.to, center(eA), rel);
    // a link between the reply and a portrait on the far side (or the offer and the far portrait) runs round
    // the diagram: over the columns (16:9, 1:1) or up the right margin (9:16)
    const farPair = ['reply', 'offeror'].includes(rel.from) && ['reply', 'offeror'].includes(rel.to)
      || ['offer', 'offeree'].includes(rel.from) && ['offer', 'offeree'].includes(rel.to)
      || ['pieces', 'offeror'].includes(rel.from) && ['pieces', 'offeror'].includes(rel.to) && A.tall;
    let c1, c2;
    if (farPair) {
      const sheetEnd = rel.from === 'offeror' || rel.from === 'offeree' ? 'to' : 'from';
      const sheetId = sheetEnd === 'from' ? rel.from : rel.to;
      const badgeId = sheetEnd === 'from' ? rel.to : rel.from;
      const b = els[sheetId].box, c = els[badgeId].circle;
      let sp, bp2, cs, cb;
      if (!A.tall) {
        const leftOfSheet = c.x < b.x;
        // (from the sheet's top edge, near the side facing the portrait, so it leaves the gap between the columns —
        // where the copy set's link and its caption sit — clear)
        sp = {x: leftOfSheet ? b.x + Math.min(24, b.w * 0.12) : b.x + b.w - Math.min(24, b.w * 0.12), y: b.y - 8};
        bp2 = {x: c.x + (leftOfSheet ? c.r + 8 : -c.r - 8), y: c.y};
        const corridor = Math.min(pos.offer.y, pos.reply.y) - 34;
        cs = {x: sp.x + (leftOfSheet ? -40 : 40), y: Math.min(corridor, sp.y - 70)};
        cb = {x: bp2.x + (leftOfSheet ? 220 : -220), y: c.y};
      } else if (sheetId === 'reply') {
        // tall: out of the reply's right side, up the right margin past the copy set, then over the top of the
        // columns to the portrait (it crosses no other connector and no sheet)
        sp = {x: b.x + b.w + 8, y: b.y + Math.min(40, b.h * 0.2)};
        bp2 = {x: c.x + c.r + 8, y: c.y};
        const xM = Math.min(DW - 10, Math.max(pos.pieces.x + pos.pieces.w, b.x + b.w) + 40);
        cs = {x: xM, y: sp.y - 40};
        cb = {x: xM, y: c.y};
      } else {
        sp = {x: b.x + b.w + 8, y: b.y + 22};
        bp2 = {x: c.x + c.r + 8, y: c.y};
        cs = {x: DW - 12, y: sp.y};
        cb = {x: DW - 12, y: c.y};
      }
      if (sheetEnd === 'from') { from = sp; to = bp2; c1 = cs; c2 = cb; } else { from = bp2; to = sp; c1 = cb; c2 = cs; }
    }
    // a narrow row: neighbouring sheets are linked by an arch over the gap (from top edge to top edge), so the link's
    // caption sits on the arch above the columns, not squeezed between them
    const pairs = [['offer', 'pieces'], ['pieces', 'reply']];
    if (!A.tall && pos.gapW < 120 && pairs.some(q => q.includes(rel.from) && q.includes(rel.to))) {
      const [lId, rId] = pos[rel.from].x < pos[rel.to].x ? [rel.from, rel.to] : [rel.to, rel.from];
      const bl = pos[lId], br = pos[rId];
      const pl = {x: bl.x + bl.w - 18, y: bl.y - 8}, pr = {x: br.x + 18, y: br.y - 8};
      const lift = Math.max(3.4 * FL * 1.18, 70);
      const [a0, b0] = rel.from === lId ? [pl, pr] : [pr, pl];
      from = a0; to = b0;
      c1 = {x: a0.x, y: Math.min(a0.y, b0.y) - lift};
      c2 = {x: b0.x, y: Math.min(a0.y, b0.y) - lift};
    }
    // tall: the copy set and the reply stand in one column, and the copies come straight down it at the gather; their
    // link runs round the column's left side (its caption beside it, clear of the tiles' path)
    if (A.tall && ['pieces', 'reply'].includes(rel.from) && ['pieces', 'reply'].includes(rel.to)) {
      const pB = {x: pos.pieces.x - 8, y: pos.pieces.y + pos.pieces.h - 18}, rT = {x: pos.reply.x - 8, y: pos.reply.y + 18};
      const [a0, b0] = rel.from === 'pieces' ? [pB, rT] : [rT, pB];
      from = a0; to = b0;
      c1 = {x: a0.x - 60, y: a0.y + (b0.y - a0.y) * 0.25};
      c2 = {x: b0.x - 60, y: a0.y + (b0.y - a0.y) * 0.75};
    }
    // dashes are reserved for disputed relations: a supplied communication is drawn solid (arrowed, in its colour)
    const c = connector(ctx, {name: `c${i}`, from, to, kind: rel.kind === 'communication' ? 'sequence' : rel.kind, bend: 0.08, color: kindColor(ctx, rel.kind), c1, c2});
    return {rel, c, from, to, far: farPair};
  });
  // relation captions: on (or right beside) their own connector — within 40 px of it and nearer to it than to any
  // other connector — clear of the sheets, portraits, names, captions and the paths the tiles take at the gather
  const hhT = hh;
  const corridors = [];
  if (!A.tall) {
    corridors.push({x: pos.pieces.x, y: pos.pieces.y, w: pos.reply.x + pos.reply.w - pos.pieces.x, h: pos.pieces.h});
    if (R.substituted) corridors.push({x: pos.offer.x, y: slotOffer(R.k).y - hhT / 2 - 6, w: pos.pieces.x + pos.pieces.w - pos.offer.x, h: hhT + 12});
  } else {
    corridors.push({x: pos.pieces.x, y: pos.pieces.y, w: pos.pieces.w, h: pos.reply.y + pos.reply.h - pos.pieces.y});
    if (R.substituted) corridors.push({x: pos.offer.x, y: slotOffer(R.k).y - hhT / 2 - 6, w: pos.pieces.x + pos.pieces.w - pos.offer.x, h: hhT + 12});
  }
  if (R.substituted) {
    const q = pos.diffHome(R.k); const sR = slotReply(R.k);
    if (A.diffBelow) corridors.push({x: sR.x - tw - 6, y: sR.y - hhT / 2 - 6, w: tw + 12, h: q.y - sR.y + hhT + 12});
    else { const xa = Math.min(q.x, sR.x) - tw, xb = Math.max(q.x, sR.x); corridors.push({x: xa, y: sR.y - hhT / 2 - 6, w: xb - xa, h: hhT + 12}); }
  }
  const obstaclesFixed = [pos.offer, pos.pieces, pos.reply, ...badges.map(b => b.box), ...nameChips.filter(Boolean).map(c => c.box), ...elCaps.filter(Boolean).map(c => c.box)];
  const obstacles = [...obstaclesFixed, ...corridors];
  if (R.substituted) { const q = pos.diffHome(R.k); const db = {x: q.x - tw, y: q.y - hh / 2, w: tw, h: hh}; obstacles.push(db); if ([...badges.map(b => b.box), ...nameChips.filter(Boolean).map(c => c.box), ...elCaps.filter(Boolean).map(c => c.box)].some(b => overlaps(db, b, 4))) why.push('diff'); }
  if (A.overlapsCaps) why.push('caps');
  const placed = [];
  const bounds = {x: 6, y: 6, w: DW - 12, h: DH - 12};
  let labelsClear = true;
  const samples = conns.map(y => Array.from({length: 61}, (_, t) => y.c.at(t / 60)));
  const lh = FL * 1.18;
  // every connector runs at least three caption lines (no stubs)
  conns.forEach((x, i) => { let len = 0; for (let t = 1; t < samples[i].length; t++) len += Math.hypot(samples[i][t].x - samples[i][t - 1].x, samples[i][t].y - samples[i][t - 1].y); x.len = len; if (len < 3 * lh) why.push(`stub${i}`); });
  const near = 40 / upx;   // 40 px at 1080p
  const distBox = (pts, b) => Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)))));
  const labelDist = [];
  conns.forEach((x, i) => {
    if (!show) return;
    const text = p.relationLabels[x.rel.kind] || x.rel.kind;
    const probe = chipW(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: 360, size: FL, maxLines: 2, weight: 600});
    const w = probe.box.w, hgt = probe.box.h;
    let got = null;
    // (second pass: a caption that can only sit in a tile path steps aside while the tiles pass — it fades out for the
    // gather and back in once they have gone)
    for (const pass of [0, 1]) {
    if (got) break;
    const obs = pass ? [...obstaclesFixed, ...(R.substituted ? [(() => { const q = pos.diffHome(R.k); return {x: q.x - tw, y: q.y - hh / 2, w: tw, h: hh}; })()] : [])] : obstacles;
    for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.2, 0.8, 0.14, 0.86]) {
      const P = x.c.at(t), P1 = x.c.at(Math.min(1, t + 0.01)), P0 = x.c.at(Math.max(0, t - 0.01));
      const tx = P1.x - P0.x, ty = P1.y - P0.y, tl = Math.hypot(tx, ty) || 1;
      const nx = -ty / tl, ny = tx / tl;
      const ext = Math.abs(nx) * w / 2 + Math.abs(ny) * hgt / 2;
      for (const off of [0, ext + 8, -(ext + 8), ext + 20, -(ext + 20), ext + 32, -(ext + 32), ext + 44, -(ext + 44)]) {
        const cx = P.x + nx * off, cy = P.y + ny * off;
        const box = {x: cx - w / 2, y: cy - hgt / 2, w, h: hgt};
        if (!insideBox(box, bounds) || obs.some(b => overlaps(box, b, 6)) || placed.some(b => overlaps(box, b, 6))) continue;
        const own = distBox(samples[i], box);
        if (own > near) continue;
        if (conns.some((y, j) => j !== i && distBox(samples[j], box) <= Math.max(own + 4, 6))) continue;
        got = chipW(ctx, text, {x: cx, y: box.y, anchor: 'middle', maxWidth: 360, size: FL, maxLines: 2, weight: 600, stroke: kindColor(ctx, x.rel.kind), name: `labc${i}`});
        labelDist[i] = Math.round(own * upx);
        x.stepAside = pass === 1 && corridors.some(b => overlaps(box, b, 2));
        break;
      }
      if (got) break;
    }
    }
    if (!got) { labelsClear = false; const P = x.c.at(0.5); got = chipW(ctx, text, {x: P.x, y: P.y - hgt / 2, anchor: 'middle', maxWidth: 360, size: FL, maxLines: 2, weight: 600, stroke: kindColor(ctx, x.rel.kind), name: `labc${i}`}); why.push(`label${i}`); }
    placed.push(got.box);
    x.lab = g({name: `lab${i}`, opacity: 0}, got.node);
    x.labBox = got.box;
  });
  // connectors are drawn below the sheets' texts? no: under the pieces (they never cross them)
  nodes.unshift(...conns.map(x => x.c.node));
  conns.forEach(x => x.lab && nodes.push(x.lab));
  // copies (moving) and the different piece
  const copies = p.terms.map((t, i) => {
    const art = pieceArt(ctx, {tw, th: hh, kind: 'copy', tab: tabColor(ctx, i), value: show ? M.values[i] : null, bars: show ? 0 : 0.6});
    return g({name: `cp${i}`, transform: T(slotOffer(i).x, slotOffer(i).y), 'data-occludes': 1}, art.front);
  });
  const focusNode = g({name: 'focus'}, focusParts, copies);
  nodes.push(focusNode);
  let diffHome = null;
  if (R.substituted) {
    const art = pieceArt(ctx, {tw, th: hh, kind: 'spare', value: show ? M.spare : null, bars: show ? 0 : 0.6});
    diffHome = pos.diffHome(R.k);
    nodes.push(g({name: 'diff', transform: T(diffHome.x, diffHome.y), opacity: 0, 'data-occludes': 1}, art.front));
    const s = slotReply(R.k);
    nodes.push(changedMarker(ctx, {name: 'd-mark', x: s.x - tw + 3, y: s.y - hh / 2 + 3, radius: Math.max(13, FL * 0.6), opacity: 0}));
    if (!insideBox({x: diffHome.x - tw, y: diffHome.y - hh / 2, w: tw, h: hh}, bounds)) why.push('diff');
  }
  // tracer route along the supplied order (via connectors where they exist)
  // The tracer travels only along connectors; between connectors (across an
  // element's own text) it is hidden, so it never sits on printed text.
  const pts = [];
  const visits = [];
  const onRuns = [];
  const order = p.traversalOrder.filter(id => els[id]);
  order.forEach((id, i) => {
    if (i === 0) { visits.push({id, idx: 0, pending: true}); return; }
    const prev = order[i - 1];
    const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    if (link) {
      const fw = link.rel.from === prev;
      const a = pts.length;
      pts.push(fw ? link.from : link.to);
      for (let k = 1; k <= 30; k++) pts.push(link.c.at(fw ? k / 30 : 1 - k / 30));
      onRuns.push([a, pts.length - 1]);
    } else pts.push(center(els[id]));
    visits.push({id, idx: pts.length - 1});
  });
  if (!pts.length) order.length && pts.push(center(els[order[0]]));
  const poly = polyline(pts.length > 1 ? pts : [pts[0] ?? {x: 0, y: 0}, pts[0] ?? {x: 0, y: 0}]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const runs = onRuns.map(([a, b]) => [cum[a] / total, cum[b] / total]);
  const route = {poly, runs, visits: visits.map(v => ({id: v.id, t: v.pending ? 0 : cum[v.idx] / total}))};
  // anchored ends: every connector end within 12 of its element edge
  const edgeGap = (id, q) => { const e = els[id]; if (e.circle) { const dc = Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r); if (!e.chip) return dc; const b = e.chip; return Math.min(dc, Math.hypot(Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), Math.max(b.y - q.y, 0, q.y - (b.y + b.h)))); } const b = e.box; const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h)); return Math.hypot(dx, dy); };
  const anchored = conns.every(x => edgeGap(x.rel.from, x.from) <= 12 && edgeGap(x.rel.to, x.to) <= 12);
  // ---- tags: a caption under the reply + legend of kinds + key (shown at the gather)
  const tagParts = [];
  let hasKey = false;
  const low = Math.max(pos.offer.y + pos.offer.h, pos.pieces.y + pos.pieces.h, pos.reply.y + pos.reply.h, ...badges.map(b => b.box.y + b.box.h + 60), ...nameChips.filter(Boolean).map(c => c.box.y + c.box.h), ...elCaps.filter(Boolean).map(c => c.box.y + c.box.h));
  let ty = low + 18;
  const tagItems = [];
  if (show) tagItems.push({kind: R.substituted ? 'legend' : 'chip', text: R.substituted ? `${ctx.t.copied}` : ctx.t.copied});
  if (ctx.show('key')) tagItems.push({kind: 'chip', text: ctx.t.key, stroke: th.inkSoft, name: 'key'});
  let tx = 12;
  const tagBoxes = [];
  tagItems.forEach(it => {
    const make = x => (it.kind === 'legend' ? legendChip(ctx, it.text, {x, y: ty, maxWidth: DW * 0.46, size: FL, name: it.name}) : chipW(ctx, it.text, {x, y: ty, maxWidth: DW * 0.46, size: FL, maxLines: 3, weight: 600, stroke: it.stroke ?? th.ink, name: it.name, opacity: it.name === 'key' ? 0 : undefined}));
    let c = make(tx);
    if (tx + c.box.w > DW - 12) { tx = 12; ty += 60; c = make(tx); }
    if (it.name === 'key') { hasKey = true; nodes.push(c.node); } else { const n = c.node; n.attrs.opacity = undefined; tagParts.push(n); }
    tagBoxes.push(c.box);
    if (c.fit.bad) why.push('tag');
    tx += c.box.w + 12;
  });
  nodes.push(g({name: 'tags', opacity: 0}, tagParts));
  const all = unionBox([pos.offer, pos.pieces, pos.reply, ...badges.map(b => b.box), ...tagBoxes, ...placed]);
  if (all.y < 4 || all.y + all.h > DH - 4) why.push('height');
  const focusBox = p.focusElement === 'pieces' ? pos.pieces : null;
  // centre the whole anatomy vertically in the design space (never a band at the top only)
  const bb = unionBox([all, ...badges.map(b => b.box), ...nameChips.filter(Boolean).map(c => c.box), ...(diffHome ? [{x: diffHome.x - tw, y: diffHome.y - hh / 2, w: tw, h: hh}] : [])]);
  const dy = Math.max(0, (DH - bb.h) / 2 - bb.y);
  return {...A, dy, nodes, conns, route, slotOffer, slotMid, slotReply, diffHome, anchored, labelsClear, labelDist, hasKey, focusBox, ok: why.length === 0, why, all};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-02-mechanism',
    title: 'Acceptance and counter-offer — anatomy of a reply: printed pieces, copies and one replaced piece',
    titleEs: 'Aceptación y contrapropuesta — Mecanismo o relación explicada',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Aceptación y contrapropuesta',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded, row-aligned anatomy: the offer (field labels and printed pieces), the copy set pulled out into its own column and the reply with empty slots, between portraits of the two parties. Only the supplied relationships are drawn, anchored to element edges and captioned by kind (relation, communication, sequence; causal only when supplied). A tracer follows the supplied order while the focus element swells; at the end the copies fill the reply and, with a supplied replacement, one copy returns to the offer and the answering party\'s piece takes its slot. No legal effect is stated.',
    tags: ['offer', 'reply', 'pieces', 'copy', 'relations', 'tracer', 'anatomy', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/aceptacion-contrapropuesta.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/markers.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
