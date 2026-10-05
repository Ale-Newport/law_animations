/**
 * LAW-0334 — Límites de revisión · mechanism
 *
 * Storyboard (an exploded explanatory view — not the story's desk: the placeholder decision sheet with its arrows at
 * the left margin, the review frame lifted off it as a separate component, and one card per supplied question):
 *  0.00–0.18  separate: the frame starts laid on the decision over the supplied sections; it lifts and slides out to
 *             its own place (beside the decision on wide frames, below it on tall ones), keeping its size, so the
 *             gap it leaves shows exactly which sections it enclosed. Its filter glass is now empty.
 *  0.18–0.43  draw only the supplied relationships, one after the other (plain relations by default: no arrowheads;
 *             a causal style only if the author supplies it), each anchored on the edges of its two components.
 *  0.43–0.75  a tracer follows `traversalOrder` along those relationships; the focus component enlarges while the
 *             tracer passes; when it reaches the frame, copies of the enclosed sections slide into the filter glass
 *             (the transformation) while the origin rows on the decision are outlined.
 *  0.75–1.00  everything stays visible: origin (decision), transformation (frame with its copies) and state (each
 *             card shows where its section lies — inside / outside the frame, as supplied). Key: "as supplied · no
 *             conclusion drawn". No doctrine on what a review may cover is drawn.
 * @module animations/review/LAW-0334
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {roundRectPath} from '../../core/geometry.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {tracer, chip} from '../../primitives/annotate.js';
import {
  lrFields, LR_EN, LR_ES, localisedLr, resolveLr, sheetModel, sheetNode, rowParts, frameExtent, frameNode, frameProps,
  arrowNode, legendIcon, indexPip, fitG, textAt, overlaps, INK, R2,
} from './kits/limites-de-revision.js';

const ID = 'LAW-0334';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], hold: [0.75, 1]};
const W = {explode: [0.04, 0.17], relate: [0.18, 0.42], trace: [0.44, 0.74], copies: 0.07, states: [0.75, 0.8]};
const IDS = ['decision', 'frame', 'questionA', 'questionB'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  elements: [
    {id: 'decision', label: 'Decision (placeholder sheet)'},
    {id: 'frame', label: 'Review frame with filter glass'},
    {id: 'questionA', label: 'Question A'},
    {id: 'questionB', label: 'Question B'},
  ],
  relationships: [
    {from: 'decision', to: 'frame', kind: 'relation', label: 'frame laid over the supplied sections'},
    {from: 'frame', to: 'questionA', kind: 'relation'},
    {from: 'frame', to: 'questionB', kind: 'relation'},
  ],
  focusElement: 'frame',
  relationLabels: {relation: 'where its section lies', communication: 'communication (as supplied)', sequence: 'sequence (as supplied)', causal: 'causal link (supplied)'},
  traversalOrder: ['decision', 'frame', 'questionA', 'frame', 'questionB'],
};
const OWN_ES = {
  elements: [
    {id: 'decision', label: 'Resolución (hoja provisional)'},
    {id: 'frame', label: 'Marco de revisión con cristal filtro'},
    {id: 'questionA', label: 'Cuestión A'},
    {id: 'questionB', label: 'Cuestión B'},
  ],
  relationships: [
    {from: 'decision', to: 'frame', kind: 'relation', label: 'marco sobre los apartados aportados'},
    {from: 'frame', to: 'questionA', kind: 'relation'},
    {from: 'frame', to: 'questionB', kind: 'relation'},
  ],
  focusElement: 'frame',
  relationLabels: {relation: 'dónde queda su apartado', communication: 'comunicación (según lo aportado)', sequence: 'secuencia (según lo aportado)', causal: 'vínculo causal (aportado)'},
  traversalOrder: ['decision', 'frame', 'questionA', 'frame', 'questionB'],
};
const EN = {...LR_EN, ...OWN_EN};
const ES = {...LR_ES, ...OWN_ES};

const sceneSchema = {
  ...lrFields,
  elements: list('Component captions; ids are fixed by the scene, captions are editable', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 2, 4),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Optional caption of this relationship (otherwise the caption of its kind)', 60),
  }, ['from', 'to', 'kind']), 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', IDS),
  relationLabels: obj('Caption used for each relation kind', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links', 50),
    causal: str('Caption for supplied causal links', 50),
  }, ['relation', 'communication', 'sequence', 'causal']),
  traversalOrder: list('Order in which the tracer visits components (repeats allowed)', oneOf('Component id', IDS), 2, 8),
};

const defaultParams = {...EN};

/** One question card (local origin = top-left). */
function cardModel(ctx, P, q, w, F) {
  const showKey = ctx.show('key');
  const pad = F * 0.7;
  const iconW = F * 2.2;
  const pipR = F * 0.62;
  const tw = w - pad * 2 - iconW - pipR * 2 - F * 0.4;
  const cap = (P.elements.find(e => e.id === `question${q.side.toUpperCase()}`) || {}).label;
  const head = showKey && cap ? fitG(cap, {maxWidth: tw, size: F, maxLines: 2, weight: 700}) : null;
  const text = showKey ? fitG(q.text, {maxWidth: tw, size: F, maxLines: 4, weight: 500}) : null;
  const sub = showKey ? fitG(q.inside ? P.outcomes.inside : P.outcomes.outside, {maxWidth: w - pad * 2 - F * 1.5, size: F, maxLines: 4, weight: 600}) : null;
  const headH = head ? head.height + F * 0.3 : 0;
  const textH = text ? text.height : F * 1.6;
  const subH = sub ? sub.height : F * 1.1;
  const hh = pad + headH + Math.max(textH, F * 1.4) + F * 0.6 + subH + pad;
  return {w, h: hh, pad, iconW, pipR, tw, head, text, sub, headH, textH, subH, F, ok: [head, text, sub].every(f => !f || f.ok)};
}

function cardNode(ctx, C, q, name) {
  const th = ctx.theme;
  const {pad, F} = C;
  const parts = [h('path', {d: roundRectPath(5, 7, C.w, C.h, 14), fill: th.shadow}), h('path', {d: roundRectPath(0, 0, C.w, C.h, 14), fill: th.card, stroke: INK, 'stroke-width': 2.5})];
  let y = pad;
  parts.push(g({transform: T(pad + C.iconW * 0.42, y + Math.min(C.textH + C.headH, F * 1.6) / 2 + 2)}, legendIcon(ctx, q.side, F * 1.7)));
  if (C.head) { parts.push(textAt(C.head, {x: pad + C.iconW, y, fill: INK})); y += C.headH; }
  if (C.text) parts.push(textAt(C.text, {x: pad + C.iconW, y, fill: INK}));
  else parts.push(h('rect', {x: pad + C.iconW, y: y + F * 0.3, width: C.tw * 0.8, height: F * 0.5, rx: 4, fill: th.paperLine}));
  parts.push(g({transform: T(C.w - pad - C.pipR, pad + C.pipR)}, indexPip(q.section, C.pipR)));
  const sy = pad + C.headH + Math.max(C.textH, F * 1.4) + F * 0.6;
  parts.push(h('line', {x1: pad, x2: C.w - pad, y1: sy - F * 0.3, y2: sy - F * 0.3, stroke: th.paperLine, 'stroke-width': 1.5}));
  parts.push(g({name: `${name}-state`, opacity: 0},
    g({transform: T(pad + F * 0.55, sy + Math.min(C.subH, F * 1.2) / 2)}, legendIcon(ctx, q.inside ? 'inside' : 'outside', F * 1.05)),
    C.sub ? textAt(C.sub, {x: pad + F * 1.5, y: sy, fill: INK}) : null));
  return g({name}, parts);
}

function compose(ctx, P, R, F, variant) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const key = showKey ? fitG(P.labels.key, {maxWidth: DW, size: F, maxLines: 2, weight: 600}) : null;
  // (1:1 fallback: the frame's caption joins the key strip, with the frame icon, freeing the space above the frame)
  const legendCap = variant.capLegend && showKey ? fitG(P.labels.frame, {maxWidth: DW - F * 2, size: F, maxLines: 2, weight: 700}) : null;
  // (labels with no free place beside their connector become numbered footnotes above the key: a numbered badge sits
  // on the connector and the same number leads the caption — readable, never shrunk)
  const relsE = P.relationships.filter(x => x.from !== x.to && P.elements.some(e => e.id === x.from) && P.elements.some(e => e.id === x.to));
  const foot = showAll && variant.foot ? variant.foot.map((i, k) => ({i, n: k + 1, fit: fitG(relsE[i].label || P.relationLabels[relsE[i].kind] || relsE[i].kind, {maxWidth: DW - F * 2.4, size: F, maxLines: 2, weight: 600})})) : [];
  const footH = foot.reduce((a, f) => a + f.fit.height + F * 0.45, 0);
  const keyH = (key ? key.height + F * 0.8 : 0) + (legendCap ? legendCap.height + F * 0.5 : 0) + footH;
  {
    let fy0 = DH - keyH + (legendCap ? legendCap.height + F * 0.5 : 0) + F * 0.2;
    for (const f of foot) { f.y = fy0; fy0 += f.fit.height + F * 0.45; if (!f.fit.ok) problems.push('footnote-text'); }
  }
  const AW = ctx.view.shape === 'square' ? clamp(F * 3.3, 64, 90) : clamp(F * 4.6, 90, 130);
  const t = Math.max(12, F * 0.62);
  const m = Math.max(16, F * 0.9);
  const problems = [];
  let SW, CW, sx, sy, fx, fy, cards;
  const arr = shape === 'landscape' ? 'row' : shape === 'portrait' ? 'column' : 'split';
  const abLink = P.relationships.some(x => (x.from === 'questionA' && x.to === 'questionB') || (x.from === 'questionB' && x.to === 'questionA'));
  const cardGap = abLink ? F * (arr === 'row' ? 4.8 : 13) : F * (arr === 'row' ? 1.6 : 1.3);
  const mk = sw => sheetModel(ctx, {w: sw, F, title: P.decisions.title, sections: P.decisions.sections, showText: showKey, bars: variant.bars});
  let M;
  const capFit = w => (showKey ? fitG(P.labels.frame, {maxWidth: w, size: F, maxLines: 2, weight: 700}) : null);
  let cap = null;
  if (arr === 'row') {
    SW = variant.sw; CW = variant.cw;
    M = mk(SW);
    const FW = SW + 2 * m;
    const rest = DW - AW - SW - FW - CW;
    const gap = rest * 0.58;
    if (gap < F * 10.5 || rest - gap < F * 6) problems.push('row-gap');
    sx = AW; sy = Math.max(0, (DH - keyH - M.h) / 2);
    const E = frameExtent(M, R.from, R.to, {t, margin: m});
    fx = sx + SW + gap + m; // sheet-origin x of the exploded frame (its left rail at fx - m)
    cap = capFit(FW);
    const capH = cap ? cap.height + F * 0.5 : 0;
    fy = clamp(sy, capH - E.yTop, DH - keyH - (E.yBot + t) - 4);
    const cs = R.qs.map(q => cardModel(ctx, P, q, CW, F));
    const tot = cs[0].h + cs[1].h + cardGap;
    const fcy = fy + (E.yTop + E.yBot + t) / 2;
    let cy0 = clamp(fcy - tot / 2, 0, DH - keyH - tot);
    cards = cs.map((c, i) => { const o = {...c, x: DW - CW, y: cy0}; cy0 += c.h + cardGap; return o; });
    if (tot > DH - keyH) problems.push('cards-tall');
    if (M.h > DH - keyH) problems.push('sheet-tall');
  } else if (arr === 'column') {
    SW = variant.sw;
    M = mk(SW);
    const E = frameExtent(M, R.from, R.to, {t, margin: m});
    sx = AW + (DW - AW - SW) / 2 - AW * 0.15; sy = 0;
    const cw = (DW - cardGap) / 2;
    const cs = R.qs.map(q => cardModel(ctx, P, q, cw, F));
    const cardsH = Math.max(cs[0].h, cs[1].h);
    // (the caption stands right of the decision–frame connector, which runs down the centre line)
    cap = showKey ? fitG(P.labels.frame, {maxWidth: (SW + 2 * m) / 2 - F * 1.2, size: F, maxLines: 3, weight: 700}) : null;
    const capH = cap ? cap.height + F * 0.5 : 0;
    const gapY = F * 5.2;
    fx = sx;
    fy = sy + M.h + gapY + capH - E.yTop;
    const frameB = fy + E.yBot + t;
    const cyy = frameB + gapY;
    cards = cs.map((c, i) => ({...c, x: i ? DW - cw : 0, y: cyy}));
    const need = cyy + cardsH + keyH;
    if (need > DH) problems.push('column-tall');
    // centre the whole stack vertically
    const dy = Math.max(0, (DH - need) / 2);
    sy += dy; fy += dy; cards.forEach(c => { c.y += dy; });
  } else {
    // split (1:1): decision left, the frame lifted out to the right at the height of its rows, the cards in a row below
    SW = variant.sw;
    M = mk(SW);
    const E = frameExtent(M, R.from, R.to, {t, margin: m});
    const FW = SW + 2 * m;
    const cw = (DW - cardGap) / 2;
    const cs = R.qs.map(q => cardModel(ctx, P, q, cw, F));
    const cardsH = Math.max(cs[0].h, cs[1].h);
    const avail = DH - keyH;
    const gapY = F * (variant.foot ? 3.2 : 4.4);
    sx = AW; sy = 0;
    fx = DW - FW + m;
    if (fx - m - (sx + SW) < F * 3.4) problems.push('split-gap');
    cap = legendCap ? null : capFit(FW);
    const capH = cap ? cap.height + F * 0.5 : 0;
    const frameH = E.yBot + t - E.yTop;
    const topH = Math.max(M.h, capH + frameH);
    fy = clamp(sy, capH - E.yTop, topH - frameH - E.yTop);
    const cyy = topH + gapY;
    cards = cs.map((c, i) => ({...c, x: i ? DW - cw : 0, y: cyy}));
    if (globalThis.__LRDBG) console.log('split', F, SW, M.h, capH + frameH, cardsH, gapY, avail);
    if (cyy + cardsH > avail) problems.push('split-tall');
    const dy = Math.max(0, (avail - cyy - cardsH) / 2);
    sy += dy; fy += dy; cards.forEach(c => { c.y += dy; });
  }
  const E = frameExtent(M, R.from, R.to, {t, margin: m});
  if (!M.ok) problems.push('sheet-text');
  cards.forEach(c => { if (!c.ok) problems.push('card-text'); });
  if (cap && !cap.ok) problems.push('caption-text');
  if (key && !key.ok) problems.push('key-text');
  // components (design coords)
  const decBox = {x: sx - AW, y: sy, w: SW + AW, h: M.h};
  const frBox = {x: fx + E.x, y: fy + E.yTop, w: E.w, h: E.yBot + t - E.yTop};
  const capX = arr === 'column' ? frBox.x + frBox.w / 2 + F * 1.2 : frBox.x;
  const capBox = cap ? {x: capX, y: frBox.y - cap.height - F * 0.5, w: cap.width, h: cap.height} : null;
  const legendBox = legendCap ? {x: F * 2, y: DH - keyH + F * 0.2, w: legendCap.width, h: legendCap.height} : null;
  if (legendCap && !legendCap.ok) problems.push('caption-text');
  const els = {decision: {box: decBox}, frame: {box: frBox}, questionA: {box: {x: cards[0].x, y: cards[0].y, w: cards[0].w, h: cards[0].h}}, questionB: {box: {x: cards[1].x, y: cards[1].y, w: cards[1].w, h: cards[1].h}}};
  const boxes = Object.values(els).map(e => e.box);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (overlaps(boxes[i], boxes[j], 8)) problems.push('elements-overlap');
  boxes.forEach(b => { if (b.x < -0.5 || b.y < -0.5 || b.x + b.w > DW + 0.5 || b.y + b.h > DH - keyH + 0.5) problems.push('element-outside'); });
  if (problems.length && !variant.force) return {ok: false, problems};
  const known = new Set(P.elements.map(e => e.id));
  const rels = P.relationships.filter(x => x.from !== x.to && known.has(x.from) && known.has(x.to));
  const crossing = graph => {
    const bad = new Set();
    let cap = false;
    graph.conns.forEach((c, ci) => {
      for (const [id, e] of Object.entries(els)) {
        if (id === c.rel.from || id === c.rel.to) continue;
        for (let k = 1; k < 20; k++) { const q = c.c.at(k / 20); if (q.x > e.box.x - 4 && q.x < e.box.x + e.box.w + 4 && q.y > e.box.y - 4 && q.y < e.box.y + e.box.h + 4) { bad.add(ci); break; } }
      }
      if (capBox) for (let k = 1; k < 20; k++) { const q = c.c.at(k / 20); if (q.x > capBox.x - 4 && q.x < capBox.x + capBox.w + 4 && q.y > capBox.y - 4 && q.y < capBox.y + capBox.h + 4) { bad.add(ci); cap = true; break; } }
    });
    return bad;
  };
  const BENDS = [0.08, 0.32, -0.32];
  const bends = rels.map(() => 0);
  let graph = null;
  // (the graph draws the connectors only; this entry places its own labels: up to three lines, never shrunk)
  const quiet = {...ctx, show: lvl => (lvl === 'all' ? false : ctx.show(lvl))};
  for (let pass = 0; pass < 3; pass++) {
    graph = relationGraph(quiet, {
      name: 'rel', elements: els, relationships: rels, relationLabels: P.relationLabels, bend: (rel, i) => BENDS[bends[i]],
    });
    const bad = crossing(graph);
    if (!bad.size) break;
    if (pass === 2) { problems.push('conn-crosses'); break; }
    bad.forEach(i => { bends[i] = Math.min(2, bends[i] + 1); });
  }
  const labels = [];
  const unplaced = [];
  if (showAll) {
    const bounds = {x: 0, y: 0, w: DW, h: DH - keyH};
    const obst = [...boxes, capBox].filter(Boolean);
    const samples = graph.conns.map(c => Array.from({length: 24}, (_, k) => c.c.at((k + 0.5) / 24)));
    const cm = arr === 'row' ? Math.max(180, (DW - AW - SW - (SW + 2 * m) - CW) * 0.42 - 16) : 260;
    graph.conns.forEach((c, i) => {
      const ft = foot.find(f => f.i === i);
      if (ft) { labels.push({i, foot: ft, base: c.c.at(0.5), box: {x: c.c.at(0.5).x - F * 0.8, y: c.c.at(0.5).y - F * 0.8, w: F * 1.6, h: F * 1.6}}); return; }
      const text = c.rel.label || P.relationLabels[c.rel.kind] || c.rel.kind;
      const dx = c.c.to.x - c.c.from.x, dy = c.c.to.y - c.c.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len;
      let found = null;
      const ax = dx / len, ay = dy / len;
      const inBox = (q, b, pad) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
      search: for (const mw of [cm, cm * 1.25, cm * 1.6, cm * 2]) {
        const base = c.c.at(0.5);
        const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: F, minSize: F, maxLines: 3, weight: 600});
        if (probe.fit.truncated) continue;
        for (let d = 0; d <= 380; d += 12) {
          for (const lat of [0, 40, -40, 80, -80, 120, -120, 170, -170, 220, -220]) {
            for (const sg of d ? [-1, 1] : [1]) {
              const at = {x: base.x + px * d * sg + ax * lat, y: base.y + py * d * sg + ay * lat};
              const bx = {x: at.x - probe.box.w / 2, y: at.y - probe.box.h / 2, w: probe.box.w, h: probe.box.h};
              if (bx.x < bounds.x || bx.y < bounds.y || bx.x + bx.w > bounds.x + bounds.w || bx.y + bx.h > bounds.y + bounds.h) continue;
              if (obst.some(q => overlaps(bx, q, 6)) || labels.some(q => overlaps(bx, q.box, 6))) continue;
              if (samples.some((ss, j) => j !== i && ss.some(q => inBox(q, bx, 4)))) continue;
              const far = Math.hypot(at.x - base.x, at.y - base.y) > 24;
              if (far) {
                // the leader from the connector to the chip stays clear of components, the caption and other labels
                const lead = Array.from({length: 12}, (_, k) => ({x: lerp(base.x, at.x, (k + 1) / 13), y: lerp(base.y, at.y, (k + 1) / 13)})).filter(q => !inBox(q, bx, 0));
                if (lead.some(q => obst.some(b => inBox(q, b, 2)) || labels.some(lb => inBox(q, lb.box, 2)))) continue;
              }
              found = {i, text, mw, at: {x: at.x, y: bx.y}, box: bx, base, far};
              break search;
            }
          }
        }
      }
      if (globalThis.__LRDBG && !found) console.log('unplaced', F, SW, text);
      if (!found) { problems.push('label-unplaced'); unplaced.push(i); }
      else labels.push(found);
    });
  }
  return {F, M, E, t, m, AW, SW, sx, sy, fx, fy, cards, key, keyH, cap, capBox, legendCap, legendBox, els, graph, labels, unplaced, rels, arr, ok: !problems.length, problems};

}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localisedLr(ctx, EN, ES);
    const R = resolveLr(P);
    const shape = ctx.view.shape;
    const variants = shape === 'landscape'
      ? [{sw: 440, cw: 380}, {sw: 420, cw: 360}, {sw: 400, cw: 340}, {sw: 380, cw: 320}].flatMap(v => [2, 1, 0].map(bars => ({...v, bars})))
      : shape === 'portrait' ? [680, 640, 600, 560, 520].flatMap(sw => [2, 1, 0].map(bars => ({sw, bars})))
        : [false, true].flatMap(capLegend => [410, 390, 370, 350].flatMap(sw => [2, 1, 0].map(bars => ({sw, bars, capLegend}))));
    let C = null;
    let best = null;
    outer: for (const F of SIZES) {
      for (const v of variants) {
        const c = compose(ctx, P, R, F, v);
        if (globalThis.__LRDBG) console.log(F, JSON.stringify(v), c.problems.join(","));
        if (c.ok) { C = c; break outer; }
        if (shape === 'square' && c.unplaced && c.unplaced.length && c.problems.every(q => q === 'label-unplaced')) {
          const c2 = compose(ctx, P, R, F, {...v, foot: c.unplaced});
          if (globalThis.__LRDBG) console.log('foot', F, JSON.stringify(v), c2.problems.join(','));
          if (c2.ok) { C = c2; break outer; }
        }
        if (!best || c.problems.length < best.n) best = {n: c.problems.length, F, v};
      }
    }
    // nothing composes cleanly: the composition with the fewest problems, flagged in semantic.problems
    if (!C) C = compose(ctx, P, R, best.F, {...best.v, force: true});
    const route = C.graph.route(P.traversalOrder.filter(id => C.els[id]));
    return {P, R, C, route};
  },
  build(ctx, L) {
    const {C, R} = L;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const sheet = sheetNode(ctx, C.M, {prefix: 'dec', showText: showKey});
    const aH = Math.min(C.M.rowH * 0.6, C.F * 2.0);
    const arrows = R.qs.map((q, i) => {
      const same = R.qs[0].section === R.qs[1].section;
      const dy = same ? (i ? 1 : -1) * Math.min(C.M.rowH * 0.24, aH * 0.55) : 0;
      return g({transform: T(C.F * 0.62, C.M.rows[q.section].cy + dy)}, arrowNode(ctx, {prefix: `arrow${q.side}`, side: q.side, len: C.AW + C.F * 0.62 - 4, hgt: same ? aH * 0.8 : aH}));
    });
    // origin outline on the decision: the rows the frame enclosed
    const oy = C.M.rows[R.from].y - 4, oh = C.M.rows[R.to].y + C.M.rowH - C.M.rows[R.from].y + 8;
    const origin = h('path', {name: 'origin', d: roundRectPath(C.M.pad * 0.3, oy, C.M.w - C.M.pad * 0.6, oh, 10), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0});
    const copies = [];
    for (let i = R.from; i <= R.to; i++) copies.push(g({name: `copy${i}`, opacity: 0}, rowParts(ctx, C.M, i, {prefix: 'cp', showText: showKey})));
    const frame = frameNode(ctx, {prefix: 'fr', w: C.E.w, t: C.t, yTop: C.E.yTop, yBot: C.E.yBot, knobs: false});
    const elWrap = (id, child) => g({name: `el-${id}`}, child);
    return g({name: 'scene'},
      elWrap('decision', g({transform: T(C.sx, C.sy)}, sheet, arrows, origin)),
      C.cap ? g({name: 'fr-cap', opacity: 0}, textAt(C.cap, {x: C.capBox.x, y: C.capBox.y, fill: th.fg})) : null,
      C.legendCap ? g({name: 'fr-legend'}, g({transform: T(C.F * 0.75, C.legendBox.y + C.F * 0.6)}, legendIcon(ctx, 'frame', C.F * 1.2)), textAt(C.legendCap, {x: C.legendBox.x, y: C.legendBox.y, fill: th.fg})) : null,
      elWrap('frame', g(null, g({name: 'copies'}, copies), frame)),
      elWrap('questionA', g({transform: T(C.cards[0].x, C.cards[0].y)}, cardNode(ctx, C.cards[0], R.qs[0], 'cardA'))),
      elWrap('questionB', g({transform: T(C.cards[1].x, C.cards[1].y)}, cardNode(ctx, C.cards[1], R.qs[1], 'cardB'))),
      C.graph.node,
      C.labels.filter(lb => lb.foot).map(lb => g({name: `rel-lg${lb.i}`, opacity: 0},
        h('circle', {cx: r(lb.base.x), cy: r(lb.base.y), r: r(C.F * 0.78), fill: th.card, stroke: kindColor(ctx, C.rels[lb.i].kind), 'stroke-width': 2.5}),
        h('text', {x: r(lb.base.x), y: r(lb.base.y + C.F * 0.36), 'text-anchor': 'middle', 'font-size': r(C.F), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: INK}, String(lb.foot.n)),
        h('circle', {cx: r(C.F * 0.8), cy: r(lb.foot.y + C.F * 0.55), r: r(C.F * 0.78), fill: th.card, stroke: kindColor(ctx, C.rels[lb.i].kind), 'stroke-width': 2.5}),
        h('text', {x: r(C.F * 0.8), y: r(lb.foot.y + C.F * 0.91), 'text-anchor': 'middle', 'font-size': r(C.F), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: INK}, String(lb.foot.n)),
        textAt(lb.foot.fit, {x: C.F * 2.1, y: lb.foot.y, fill: th.fg}))),
      C.labels.filter(lb => !lb.foot).map(lb => g({name: `rel-lg${lb.i}`, opacity: 0},
        lb.far ? h('line', {x1: r(lb.base.x), y1: r(lb.base.y), x2: r(lb.box.x + lb.box.w / 2), y2: r(lb.box.y + lb.box.h / 2), stroke: kindColor(ctx, C.rels[lb.i].kind), 'stroke-width': 2}) : null,
        chip(ctx, lb.text, {x: lb.at.x, y: lb.at.y, anchor: 'middle', maxWidth: lb.mw, size: C.F, minSize: C.F, maxLines: 3, fill: th.card, stroke: kindColor(ctx, C.rels[lb.i].kind), weight: 600, name: `rel-l${lb.i}`}).node)),
      tracer(ctx, 'tracer', th.accent2),
      C.key ? textAt(C.key, {x: 0, y: ctx.design.h - C.key.height, fill: th.fg, italic: true, name: 'key'}) : null,
    );
  },
  frame(ctx, L, u) {
    const {P, R, C, route} = L;
    const nodes = {};
    const kEx = ease.inOutCubic(seg(u, ...W.explode));
    const {E, t} = C;
    // frame: laid on the decision at u=0, slid out to its own place (pure translation)
    const on = {x: C.sx + E.x, y: C.sy};
    const off = {x: C.fx + E.x, y: C.fy};
    const pos = {x: lerp(on.x, off.x, kEx), y: lerp(on.y, off.y, kEx)};
    const lift = Math.sin(Math.PI * kEx);
    const tr = seg(u, ...W.trace);
    const kt = ease.inOutSine(tr);
    const tp = route.poly.at(kt);
    const n = Math.max(1, C.rels.length);
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: tr > 0 && tr < 1 ? 1 : u >= W.trace[1] ? 0 : 0};
    // focus: enlarged while the tracer is near its visits
    const near = id => {
      let best = 0;
      for (const v of route.visits) if (v.id === id) best = Math.max(best, 1 - clamp(Math.abs(kt - v.t) / 0.12));
      return tr > 0 && tr < 1 ? ease.inOutSine(best) : 0;
    };
    const fe = P.focusElement;
    const growK = near(fe);
    for (const id of IDS) {
      const b = C.els[id].box;
      const s = id === fe ? 1 + 0.05 * growK : 1;
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      nodes[`el-${id}`] = {transform: `${T(cx, cy, 0, s)} translate(${r(-cx)} ${r(-cy)})`};
    }
    Object.assign(nodes, frameProps('fr', {x: pos.x, y: pos.y, yTop: E.yTop, yBot: E.yBot, t, w: E.w, glass: 1, lift}));
    if (C.cap) nodes['fr-cap'] = {opacity: r(seg(u, W.explode[1] - 0.02, W.explode[1] + 0.03), 3)};
    // copies slide into the glass when the tracer reaches the frame for the first time
    const vFrame = route.visits.find(v => v.id === 'frame');
    const kc = vFrame ? ease.inOutCubic(clamp((kt - (vFrame.t - 0.02)) / W.copies)) * (tr > 0 ? 1 : 0) : 0;
    const kCopies = u >= W.trace[1] ? (vFrame ? 1 : 0) : kc;
    const dx = C.sx - C.fx, dy = C.sy - C.fy;
    for (let i = R.from; i <= R.to; i++) {
      const k = clamp(kCopies * (1 + 0.12 * (R.to - R.from)) - (i - R.from) * 0.12);
      nodes[`copy${i}`] = {opacity: r(clamp(k * 3), 3), transform: T(C.fx + dx * (1 - k) * 0.35, C.fy + dy * (1 - k) * 0.35)};
    }
    nodes.origin = {opacity: r(kCopies, 3)};
    // relationships drawn one after the other
    const relP = i => ease.inOutCubic(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 1) * (W.relate[1] - W.relate[0])) / n));
    Object.assign(nodes, C.graph.frame(relP));
    for (const lb of C.labels) nodes[`rel-lg${lb.i}`] = {opacity: r(clamp((relP(lb.i) - 0.55) / 0.45), 3)};
    const stK = seg(u, ...W.states);
    nodes['cardA-state'] = {opacity: r(stK, 3)};
    nodes['cardB-state'] = {opacity: r(stK, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'hold';
    return {
      nodes,
      semantic: {
        beat,
        frame: R2({x: pos.x + E.w / 2, y: pos.y + (E.yTop + E.yBot + t) / 2}),
        tracer: tr > 0 && tr < 1 ? R2(tp) : null,
        traceK: r(kt, 3),
        visits: route.visits.map(v => ({id: v.id, t: r(v.t, 3)})),
        reached: route.visits.filter(v => kt >= v.t - 1e-6).map(v => v.id),
        connectors: C.graph.conns.map((x, i) => ({from: x.rel.from, to: x.rel.to, kind: x.rel.kind, a: R2(x.c.from), b: R2(x.c.to), drawn: r(relP(i), 3), arrow: x.rel.kind !== 'relation' && x.rel.kind !== 'disputed'})),
        boxes: Object.fromEntries(Object.entries(C.els).map(([k, e]) => [k, {x: r(e.box.x), y: r(e.box.y), w: r(e.box.w), h: r(e.box.h)}])),
        focus: fe, focusScale: r(1 + 0.05 * growK, 4),
        copies: r(kCopies, 3), states: r(stK, 3),
        from: R.from, to: R.to, inside: R.qs.map(q => q.inside), sections: R.qs.map(q => q.section),
        exploded: r(kEx, 3),
        problems: C.problems, textPx: r(C.F, 1), arrangement: C.arr,
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
    slug: 'review-04-mechanism',
    title: 'Review limits — exploded view: the frame lifted off the decision, its filter glass receiving copies of exactly the supplied sections',
    titleEs: 'Límites de revisión — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Límites de revisión',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded explanatory view. The review frame starts laid on a placeholder decision over the supplied sections, then lifts out to its own place keeping its size (beside the decision on wide frames, below it on tall ones). Only the supplied relationships are drawn, anchored on component edges (plain relations by default, no arrowheads). A tracer follows the supplied traversal order; the focus component enlarges; copies of the enclosed sections slide into the frame\'s filter glass while their origin rows are outlined. Cards for question A (●) and question B (◆) end with where each one\'s section lies — inside or outside the frame — as supplied. No doctrine on review scope; jurisdiction unspecified.',
    tags: ['review', 'review limits', 'mechanism', 'exploded view', 'frame', 'filter', 'scope as supplied', 'relations', 'tracer', 'questions'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/limites-de-revision.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
