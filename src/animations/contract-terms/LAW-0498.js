/**
 * LAW-0498 — Cláusula de terminación · mechanism
 *
 * Storyboard (the contract taken apart into its parts; no people):
 *  0.00–0.18  separate: the assembled contract (head plate over the two panels) comes apart — the plate lifts, the circumstance
 *             panel ("Circumstance": the circumstance card "Circumstance 1 (supplied)" with its supplied state row, ● provided or ◆ undescribed,
 *             drawn alike) slides left and the section panel ("Section of clauses": the supplied clause cards,
 *             with the bracket "[" standing open in its track at their left) slides right.
 *  0.18–0.43  relate: only the explicit relations are drawn, all plain (no arrowhead, no causality): the contract with
 *             each panel ("Part of the contract") and the supplied configured link between the circumstance card and the
 *             bracket's knob ("Configured link (as supplied)"), drawn from both ends at once.
 *  0.43–0.75  trace: a neutral marker runs the supplied stages along the relations — contract, circumstance, link, section —
 *             while the focus element enlarges. When it reaches the knob, with the state "provided" the bracket slides
 *             shut on the supplied section (it MARKS the section, nothing else); with "undescribed" it stays open.
 *  0.75–1.00  gather: the parts close in part with every element, relation and label visible; "Section marked as
 *             supplied" (or "Section not marked · as supplied") and the key "As supplied · no conclusion drawn".
 * No rule on conditions: no fulfilment, no automatic effect, no clause becoming due, binding or enforceable; no
 * jurisdiction. The configured link is a plain relation, never a cause.
 * @module animations/contract-terms/LAW-0498
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {r, seg, ease, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath, mix} from '../../core/geometry.js';
import {str, obj, list, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, STATES, PX_BASE, PX_STRESS, INK,
  measureEvent, measureObl, eventCard, oblCard, bracketArt, bracketMetrics, sectionRows, fitG, chipG, localizeScene, overlaps,
} from './kits/clausula-terminacion.js';

const ID = 'LAW-0498';
const DURATION = 7000;
const W = {
  explode: [0.04, 0.16],
  rel: [0.2, 0.3], relLabels: [0.28, 0.34], link: [0.32, 0.42], linkLabel: [0.4, 0.44],
  trace: [0.46, 0.72], focusUp: [0.45, 0.52], focusDown: [0.72, 0.77],
  gather: [0.77, 0.86], final: [0.8, 0.85], key: [0.84, 0.89],
};
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const STAGES = ['contract', 'circumstance', 'link', 'section'];
const FOCI = ['circumstance', 'link', 'section'];
const GATHER = 0.2;
const CLOSE = 0.06;

const sceneSchema = {
  ...motifFields,
  caseState: oneOf('The supplied state of the circumstance: provided (the bracket slides shut on the supplied section) or undescribed (the bracket stays open). Equal weight; nothing is inferred from either', STATES),
  relationships: list('Relations drawn, as supplied: "part" (the contract with each panel) and "config" (the configured link between the circumstance card and the bracket). All are plain relations: no arrowhead, no causality', oneOf('Relation kind', ['part', 'config']), 1, 2),
  relationLabels: obj('Labels of the relations', {
    part: str('Label of the contract–panel relation', 40),
    config: str('Label of the configured link', 50),
  }, ['part', 'config']),
  focusElement: oneOf('The element that enlarges while the marker runs', FOCI),
  traversalOrder: list('Stages the marker runs (always along the relations, in this order): contract, circumstance, link, section', oneOf('Stage', STAGES), 1, 4),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  caseState: 'provided',
  relationships: ['part', 'config'],
  relationLabels: {part: 'Part of the contract', config: 'Configured link (as supplied)'},
  focusElement: 'circumstance',
  traversalOrder: ['contract', 'circumstance', 'link', 'section'],
};

const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  relationLabels: {part: 'Parte del contrato', config: 'Enlace configurado (según lo aportado)'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.clauses, p.circumstance.label].some(t => t.length > 40);

/** Solve the exploded layout at body size F. Returns null when it does not fit. */
function solve(ctx, p, F, upx, box, labelMode) {
  const show = ctx.show('all'), showKey = ctx.show('key');
  const Bm = bracketMetrics(F);
  const ci = F * 0.42;
  const hasConfig = p.relationships.includes('config');
  const hasPart = p.relationships.includes('part');
  // the configured link's label (in the gutter, on the link)
  const linkFit = show && hasConfig ? fitG(p.relationLabels.config, {maxWidth: F * 11, size: F, maxLines: 3, weight: 600}) : null;
  if (linkFit && linkFit.bad) return null;
  const lw = linkFit ? linkFit.width + F * 1.2 : F * 2;
  const trackW = Bm.gapC + Bm.travel + Bm.knobDx + Bm.hr + F * 0.4;
  // (the link's label on the link, in the gutter; or, where the gutter cannot hold it, under the panels with a leader)
  const onLink = labelMode === 'on' || !linkFit;
  const gw = onLink ? F * 0.8 + lw * (1 + GATHER * 1.3) + F * 1.2 + trackW : F * 2.6 + trackW;
  const linkLabH = onLink ? 0 : linkFit.height + F * 0.72 + F * 0.9;
  const colW = (box.w - gw) / 2;
  const cw = colW - 2 * ci;
  const ME = measureEvent(p, F, cw, show);
  const MO = measureObl(p.clauses, F, cw, show);
  if (!ME || !MO) return null;
  let chO = Math.max(MO.ch, 71 / upx);
  let chE = Math.max(ME.ch, 90 / upx);
  const headFits = show ? [fitG(p.panels.circumstance, {maxWidth: colW - F * 1.2, size: F, maxLines: 2, weight: 700, strict: true}), fitG(p.panels.section, {maxWidth: colW - F * 1.2, size: F, maxLines: 2, weight: 700, strict: true})] : [null, null];
  if (headFits.some(f => f && f.bad)) return null;
  const colHH = show ? Math.max(...headFits.map(f => f.height)) + F * 0.8 : F * 1.6;
  // the plate
  const plateFit = show ? fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: Math.min(box.w * 0.7, F * 26), size: F, maxLines: 3, weight: 700}) : null;
  if (plateFit && plateFit.bad) return null;
  const plateW = plateFit ? plateFit.width + F * 1.6 : Math.min(box.w * 0.4, F * 10);
  const plateH = plateFit ? plateFit.height + F * 1.1 : F * 1.8;
  // relation labels
  const partFit = show && hasPart ? fitG(p.relationLabels.part, {maxWidth: Math.min(colW * 0.7, F * 12), size: F, maxLines: 2, weight: 600}) : null;
  if (partFit && partFit.bad) return null;
  const labH = partFit ? partFit.height + F * 0.72 : 0;
  // bottom notes
  const finFit = show ? fitG(p.caseState === 'undescribed' ? ctx.t.unmarked : ctx.t.marked, {maxWidth: box.w - F * 2, size: F, maxLines: 2, weight: 600}) : null;
  const keyFit = showKey ? fitG(ctx.t.key, {maxWidth: box.w - F * 2, size: F, maxLines: 2, weight: 600}) : null;
  const bottomH = (finFit ? finFit.height + F * 1.12 : 0) + (keyFit ? keyFit.height + F * 1.12 : 0) + linkLabH;
  const n = p.clauses.length;
  let gS = Math.max(F * 0.6, Bm.sw + F * 0.4);
  const colH0 = colHH + F * 0.4 + Math.max(n * chO + (n - 1) * gS, chE + F * 0.4) + F * 0.5;
  const gapMin = Math.max(F * 2.4, labH * 1.3 + F * 1.2);
  const layersUp = F * 0.9;
  const plateY = box.y + layersUp;
  const spare = box.y + box.h - (plateY + plateH + gapMin + colH0 + bottomH + F * 0.4);
  if (spare < -0.5) return null;
  const gapRel = gapMin + spare * 0.35;
  let left = spare * 0.65;
  if (n > 1) { const add = Math.min(chO * 0.9, (left * 0.45) / (n - 1)); gS += add; left -= add * (n - 1); }
  // (more height still: the clause cards grow — real objects, never thin strips — up to 2×)
  const grow = Math.max(0, Math.min(chO, left / n));
  chO += grow;
  left -= grow * n;
  const Hr = n * chO + (n - 1) * gS;
  const colY = plateY + plateH + gapRel;
  const colH = colHH + F * 0.4 + Math.max(Hr, chE + F * 0.4) + F * 0.5 + Math.max(0, left * 0.6);
  const cols = [{x: box.x, y: colY, w: colW, h: colH}, {x: box.x + box.w - colW, y: colY, w: colW, h: colH}];
  const rows0 = colY + colHH + F * 0.4 + (colH - colHH - F * 0.9 - Math.max(Hr, chE + F * 0.4)) / 2 + Math.max(0, (chE + F * 0.4 - Hr) / 2);
  const rowY = [...Array(n).keys()].map(i => rows0 + chO / 2 + i * (chO + gS));
  const tr = sectionRows(p);
  const e = Math.min(gS * 0.5, F * 0.45);
  const brTop = rowY[tr.i0] - chO / 2 - e, brH = rowY[tr.i1] + chO / 2 + e - brTop;
  // the circumstance card: level with the bracket's middle (a straight link), inside its panel's rows area
  // (the circumstance card as tall as the bracket's span, when its panel allows: the link joins the two middles)
  chE = Math.max(chE, Math.min(brH, colH - colHH - F * 1.3));
  const evY = clamp(brTop + brH / 2, colY + colHH + F * 0.4 + chE / 2, colY + colH - F * 0.5 - chE / 2);
  const ev = {x: cols[0].x + colW / 2, y: evY};
  // the bracket "[" at the section's left: closed against the cards, open by `travel` to the left
  const cardsL = cols[1].x + colW / 2 - cw / 2;
  const closedX = cardsL - Bm.gapC, openX = closedX - Bm.travel;
  const knobY = clamp(evY - brTop, Bm.hr + Bm.sw, Math.max(Bm.hr + Bm.sw, brH - Bm.hr - Bm.sw));
  const B = {...Bm, top: brTop, h: brH, closedX, openX, knobY: evY - brTop};
  void knobY;
  const plate = {x: box.x + box.w / 2 - plateW / 2, y: plateY, w: plateW, h: plateH};
  // the assembled state: the panels close in (the track against the circumstance panel), the plate on them
  const g0 = trackW + F * 1.4;
  const asmD = (gw - g0) / 2;
  const asmDy = colY - F * 0.3 - plateH - plateY;
  return {onLink, linkLabH, F, upx, Bm, B, ci, cw, ME, MO, chO, chE, colHH, headFits, plate, plateFit, partFit, labH, linkFit, lw, finFit, keyFit, bottomH, cols, colW, gw, rowY, ev, tr, n, asmD, asmDy, box, show, showKey, trackW, hasConfig, hasPart, gS};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const box = {x: 8, y: 6, w: D.w - 16, h: D.h - 12};
    let L = null, fallback = null;
    for (const px of stress ? PX_STRESS : PX_BASE) for (const mode of ['on', 'below']) {
      if (L) break;
      const S = solve(ctx, p, px / upx, upx, box, mode);
      if (!S) continue;
      const Lc = {ok: true, why: [], ...S};
      placeLabels(Lc);
      if (Lc.ok) { L = Lc; break; }
      if (!fallback) fallback = Lc;
    }
    if (!L) L = fallback;
    if (!L) return {ok: false, why: ['no-layout-fits'], problems: ['no-layout-fits']};
    const F = L.F;
    let y = L.box.y + L.box.h - L.bottomH + F * 0.4 + L.linkLabH;
    L.notes = [];
    for (const [nm, f] of [['final', L.finFit], ['key', L.keyFit]]) {
      if (!f) continue;
      const c = chipG(ctx, f.full, {x: L.box.x + L.box.w / 2, y, anchor: 'middle', maxWidth: L.box.w - F, size: F, fit: f, weight: 600});
      L.notes.push({name: nm, c});
      y += c.box.h + F * 0.4;
    }
    L.stages = STAGES.filter(s => p.traversalOrder.includes(s) && (s !== 'link' || L.hasConfig));
    if (!L.stages.length) L.stages = ['contract'];
    L.focus = p.focusElement;
    L.provided = p.caseState === 'provided';
    // when the marker reaches the knob, the bracket slides (provided): the first moment (u step 0.001) at which the marker,
    // on the route as it is drawn then (focus included), has reached the knob; the slide takes CLOSE after it
    let uK = null;
    if (L.stages.includes('link')) {
      for (let uu = W.trace[0]; uu <= W.trace[1] + 1e-9; uu += 0.001) {
        const Gu = geometry(L, {ex: 1, sc: focusScales(L, uu), br: 0});
        const ru = routeOf(L, Gu);
        if (ease.inOutSine(seg(uu, ...W.trace)) >= ru.cum[ru.stageIdx.link] / (ru.tot || 1) - 1e-6) { uK = uu; break; }
      }
    }
    if (uK === null) uK = (W.trace[0] + W.trace[1]) / 2;
    L.closeW = [uK, Math.min(uK + CLOSE, W.gather[0] - 0.005)];
    L.problems = L.why;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    if (!L.cols) return g({name: 'scene'});
    const th = ctx.theme;
    const F = L.F;
    const relW = r(Math.max(4, 3.4 / L.upx), 2);
    const rels = L.hasPart ? ['e', 't'].flatMap(s => [
      h('line', {name: `rel-part-${s}`, stroke: th.inkSoft, 'stroke-width': relW, 'stroke-linecap': 'round', opacity: 0}),
      h('circle', {name: `rel-part-${s}-a`, r: r(Math.max(5, F * 0.2), 2), fill: th.inkSoft, opacity: 0}),
      h('circle', {name: `rel-part-${s}-b`, r: r(Math.max(5, F * 0.2), 2), fill: th.inkSoft, opacity: 0})]) : [];
    const panel = (i, nm) => {
      const c = L.cols[i];
      const kids = [
        h('path', {d: roundRectPath(c.x + 4, c.y + 6, c.w, c.h, 12), fill: th.shadow}),
        h('path', {name: `${nm}-panel`, d: roundRectPath(c.x, c.y, c.w, c.h, 12), fill: shade(th.accent2Soft, 0.55), stroke: INK, 'stroke-width': 2.6}),
        h('path', {d: `M${r(c.x + 10)} ${r(c.y + 4)}H${r(c.x + c.w - 10)}`, stroke: th.inkSoft, 'stroke-width': r(Math.max(7, F * 0.28), 2), 'stroke-linecap': 'round'}),
      ];
      const f = L.headFits[i];
      if (f) kids.push(g({name: `${nm}-head`}, textBlock(f, {x: r(c.x + c.w / 2), y: r(c.y + (L.colHH - f.height) / 2 + 2), anchor: 'middle', fill: INK})));
      else kids.push(h('rect', {x: r(c.x + c.w * 0.3), y: r(c.y + L.colHH / 2 - F * 0.12), width: r(c.w * 0.4), height: r(F * 0.3), rx: 3, fill: INK, opacity: 0.5}));
      return kids;
    };
    const evG = g({name: 'grp-circumstance'}, panel(0, 'circumstance'),
      g({transform: T(r(L.ev.x, 2), r(L.ev.y, 2))}, eventCard(ctx, {name: 'ev-in', cw: L.cw, ch: L.chE, M: L.ME, F, state: p.caseState})));
    const B = L.B;
    const tx0 = B.openX - B.knobDx - B.hr - F * 0.3, tx1 = B.closedX + B.sw;
    const trG = g({name: 'grp-section'}, panel(1, 'section'),
      h('path', {name: 'track', d: roundRectPath(tx0, B.top - B.sw * 1.2, tx1 - tx0, B.h + B.sw * 2.4, 10), fill: shade(th.paperShade, -0.05), stroke: th.inkSoft, 'stroke-width': 1.8}),
      p.clauses.map((t, i) => g({transform: T(r(L.cols[1].x + L.colW / 2, 2), r(L.rowY[i], 2))}, oblCard(ctx, {name: `obl${i}-in`, cw: L.cw, ch: L.chO, M: L.MO, F, fit: L.show ? fitG(t, {maxWidth: L.MO.tw, size: F, maxLines: 3, weight: 600}) : null}))),
      // (the bracket "[": the stage's "]" mirrored about its spine — its knob faces the circumstance panel)
      g({name: 'br', transform: brT(L, 0)}, bracketArt(ctx, {name: 'br-art', bh: B.h, B})));
    const plate = g({name: 'plate'},
      h('path', {d: roundRectPath(L.plate.x + 16, L.plate.y - 14, L.plate.w, L.plate.h, 10), fill: shade(th.card, -0.1), stroke: INK, 'stroke-width': 2}),
      h('path', {d: roundRectPath(L.plate.x + 8, L.plate.y - 7, L.plate.w, L.plate.h, 10), fill: shade(th.card, -0.05), stroke: INK, 'stroke-width': 2}),
      h('path', {name: 'plate-sheet', d: roundRectPath(L.plate.x, L.plate.y, L.plate.w, L.plate.h, 10), fill: th.paperShade, stroke: INK, 'stroke-width': 2.6}),
      L.plateFit ? textBlock(L.plateFit, {x: r(L.plate.x + L.plate.w / 2), y: r(L.plate.y + (L.plate.h - L.plateFit.height) / 2), anchor: 'middle', fill: INK})
        : h('rect', {x: r(L.plate.x + L.plate.w * 0.2), y: r(L.plate.y + L.plate.h / 2 - F * 0.17), width: r(L.plate.w * 0.6), height: r(F * 0.34), rx: 3, fill: INK, opacity: 0.6}));
    const sw = r(Math.max(5, 4 / L.upx), 2);
    const link = L.hasConfig ? g({name: 'link', opacity: 0},
      h('path', {name: 'link-a', fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round'}),
      h('path', {name: 'link-b', fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round'}),
      h('circle', {name: 'link-pa', r: r(Math.max(6, F * 0.24), 2), fill: INK, opacity: 0}),
      h('circle', {name: 'link-pb', r: r(Math.max(6, F * 0.24), 2), fill: INK, opacity: 0})) : null;
    const labels = L.labels.map(lb => g({name: `lab-${lb.k}${lb.s}`, opacity: 0},
      lb.lead ? h('path', {d: `M${r(lb.lead.x)} ${r(lb.lead.y0)}V${r(lb.lead.y1)}`, stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-linecap': 'round'}) : null,
      h('path', {d: roundRectPath(lb.box.x, lb.box.y, lb.box.w, lb.box.h, Math.min(lb.box.h / 2, F * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
      textBlock(lb.fit, {x: r(lb.box.x + lb.box.w / 2), y: r(lb.box.y + F * 0.36), anchor: 'middle', fill: INK})));
    const tracer = g({name: 'tracer', opacity: 0},
      h('circle', {r: r(F * 0.8, 2), fill: th.accent2Soft, opacity: 0.55}),
      h('circle', {r: r(F * 0.42, 2), fill: th.paper, stroke: INK, 'stroke-width': r(Math.max(3, F * 0.14), 2)}),
      h('circle', {r: r(F * 0.16, 2), fill: INK}));
    return g({name: 'scene'}, rels, plate, evG, trG, link, tracer, labels, L.notes.map(q => g({name: q.name, opacity: 0}, q.c.node)));
  },
  frame(ctx, L, u) {
    if (!L.cols) return {nodes: {}, semantic: {layoutOk: false, why: L.why.join(','), problems: L.problems}};
    const F = L.F;
    const nodes = {};
    const exP = ease.inOutSine(seg(u, ...W.explode));
    const ex = exP * (1 - GATHER * ease.inOutSine(seg(u, ...W.gather)));
    const fz = focusAt(u);
    const sc = focusScales(L, u);
    const br = L.provided ? ease.inOutSine(seg(u, ...L.closeW)) : 0;
    const G = geometry(L, {ex, exP, sc, br});
    nodes['grp-circumstance'] = {transform: G.T.e};
    nodes['grp-section'] = {transform: G.T.t};
    nodes.plate = {transform: G.T.plate};
    nodes.br = {transform: brT(L, br)};
    // relations: from both ends at once — plain, no arrowhead
    const rp = ease.inOutSine(seg(u, ...W.rel));
    if (L.hasPart) for (const s of ['e', 't']) {
      const ln = G[`part-${s}`];
      const m = mix(ln.a, ln.b, 0.5);
      const a = mix(m, ln.a, rp), b = mix(m, ln.b, rp);
      nodes[`rel-part-${s}`] = {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: rp > 0 ? 1 : 0};
      nodes[`rel-part-${s}-a`] = {cx: r(ln.a.x), cy: r(ln.a.y), opacity: r(seg(rp, 0.9, 1), 3)};
      nodes[`rel-part-${s}-b`] = {cx: r(ln.b.x), cy: r(ln.b.y), opacity: r(seg(rp, 0.9, 1), 3)};
    }
    // the configured link: from the circumstance card's port and from the knob at once, joined in the middle
    const lp = L.hasConfig ? seg(u, ...W.link) : 0;
    const lf = L.focus === 'link' ? fz : 0;
    if (L.hasConfig) {
      const pa = G.port, pb = G.knob;
      const mid = mix(pa, pb, 0.5);
      const dr = ease.inOutSine(seg(lp, 0.1, 1));
      const qa = mix(pa, mid, dr), qb = mix(pb, mid, dr);
      const swl = Math.max(5, 4 / L.upx) * (1 + 0.6 * lf);
      nodes.link = {opacity: lp > 0 ? 1 : 0};
      nodes['link-a'] = {d: `M${r(pa.x, 2)} ${r(pa.y, 2)}L${r(qa.x, 2)} ${r(qa.y, 2)}`, 'stroke-width': r(swl, 2)};
      nodes['link-b'] = {d: `M${r(pb.x, 2)} ${r(pb.y, 2)}L${r(qb.x, 2)} ${r(qb.y, 2)}`, 'stroke-width': r(swl, 2)};
      nodes['link-pa'] = {cx: r(pa.x, 2), cy: r(pa.y, 2), r: r(Math.max(6, F * 0.24) * (1 + 0.5 * lf), 2), opacity: r(seg(lp, 0, 0.1), 3)};
      nodes['link-pb'] = {cx: r(pb.x, 2), cy: r(pb.y, 2), r: r(Math.max(6, F * 0.24) * (1 + 0.5 * lf), 2), opacity: r(seg(lp, 0, 0.1), 3)};
    }
    for (const lb of L.labels) {
      const op = lb.k === 'config' ? seg(u, ...W.linkLabel) : seg(u, ...W.relLabels);
      const d = labelShift(L, G, lb);
      nodes[`lab-${lb.k}${lb.s}`] = {opacity: r(op, 3), transform: T(r(d.x, 2), r(d.y, 2))};
    }
    // the marker
    const tr = seg(u, ...W.trace);
    const trOp = u >= W.trace[0] && u < W.trace[1] + 0.02 ? 1 : 0;
    const route = routeOf(L, G);
    const q = tracePos(route, tr);
    // (smaller only through the tight gap between the part chip and the panel's top edge; full size elsewhere)
    const out = Math.max(route.band[0] - q.y, q.y - route.band[1], 0);
    const rk = route.ringK + (1 - route.ringK) * clamp(out / route.R0);
    nodes.tracer = {transform: `${T(r(q.x, 2), r(q.y, 2))}${rk < 1 ? ` scale(${r(rk, 3)})` : ''}`, opacity: trOp};
    for (const nt of L.notes) nodes[nt.name] = {opacity: r(seg(u, ...(nt.name === 'key' ? W.key : W.final)), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat, exploded: r(ex, 3), focus: L.focus, focusScale: r(fz, 3), relations: rp > 0.99 && L.hasPart ? ['part'] : [],
        linkProgress: r(lp, 3), tracer: {x: r(q.x), y: r(q.y)}, stages: L.stages,
        markerPastKnob: route.stageIdx.link === undefined ? null : u >= W.trace[0] && ease.inOutSine(clamp(tr)) >= route.cum[route.stageIdx.link] / (route.tot || 1) - 1e-6,
        bracket: br >= 1 ? 'closed' : br > 0 ? 'moving' : 'open', caseState: L.provided ? 'provided' : 'undescribed',
        linkEnds: L.hasConfig ? [G.port.x, G.port.y, G.knob.x, G.knob.y].map(v => r(v)) : null,
        plate: {x: r(L.plate.x + L.plate.w / 2), y: r(L.plate.y + G.dy.plate)},
        colE: {x: r(L.cols[0].x + G.dx.e), y: r(L.cols[0].y)}, colT: {x: r(L.cols[1].x + G.dx.t), y: r(L.cols[1].y)},
        keyShown: r(seg(u, ...W.key), 3), finalShown: r(seg(u, ...W.final), 3),
        layoutOk: L.ok, why: L.why.join(','), problems: L.problems,
        textPx: r(F * L.upx, 2),
      },
    };
  },
};

/** The focus element's enlargement at time u (0..1). */
function focusAt(u) {
  return ease.inOutSine(seg(u, ...W.focusUp)) * (1 - ease.inOutSine(seg(u, ...W.focusDown)));
}

/** The panels' focus scales at time u (the circumstance panel or the section panel enlarges; the link thickens instead). */
function focusScales(L, u) {
  const fz = focusAt(u);
  const sc = {};
  if (L.focus === 'circumstance') sc.e = 1 + 0.08 * fz;
  if (L.focus === 'section') sc.t = 1 + 0.06 * fz;
  return sc;
}

/** The bracket's transform at close progress q (0 open, 1 closed): the "]" art mirrored about its spine. */
function brT(L, q) {
  const B = L.B;
  const x = B.openX + (B.closedX - B.openX) * q;
  return `translate(${r(x, 2)} ${r(B.top, 2)}) scale(-1 1)`;
}

/** Geometry at explode ex (1 = exploded), focus scales and bracket progress: group transforms, ports, relation ends. */
function geometry(L, {ex, exP = ex, sc, br}) {
  const dx = {e: L.asmD * (1 - ex), t: -L.asmD * (1 - ex)};
  const dy = {plate: L.asmDy * (1 - exP)};
  const cE = {x: L.cols[0].x + L.colW / 2 + dx.e, y: L.cols[0].y + L.cols[0].h / 2};
  const cT = {x: L.cols[1].x + L.colW / 2 + dx.t, y: L.cols[1].y + L.cols[1].h / 2};
  const ke = sc.e ?? 1, kt = sc.t ?? 1;
  const tf = (c, k, d) => q => ({x: c.x + (q.x + d - c.x) * k, y: c.y + (q.y - c.y) * k});
  const tE = tf(cE, ke, dx.e), tT = tf(cT, kt, dx.t);
  const gT = (c, k, d) => `translate(${r(c.x * (1 - k) + d * k, 2)} ${r(c.y * (1 - k), 2)}) scale(${r(k, 4)})`;
  const out = {dx, dy, T: {e: gT(cE, ke, dx.e), t: gT(cT, kt, dx.t), plate: `translate(0 ${r(dy.plate, 2)})`}};
  const B = L.B;
  const plateB = {x: L.plate.x + L.plate.w / 2, y: L.plate.y + L.plate.h + dy.plate};
  out['part-e'] = {a: {x: plateB.x - L.plate.w * 0.3, y: plateB.y}, b: tE({x: L.cols[0].x + L.colW * 0.72, y: L.cols[0].y})};
  out['part-t'] = {a: {x: plateB.x + L.plate.w * 0.3, y: plateB.y}, b: tT({x: L.cols[1].x + L.colW * 0.28, y: L.cols[1].y})};
  out.port = tE({x: L.ev.x + L.cw / 2, y: L.ev.y});
  const bx = B.openX + (B.closedX - B.openX) * br;
  // (the knob of the mirrored bracket: left of its spine)
  out.knob = tT({x: bx - B.knobDx, y: B.top + B.knobY});
  out.knobOpen = tT({x: B.openX - B.knobDx, y: B.top + B.knobY});
  out.spineMid = tT({x: bx, y: B.top + B.h / 2});
  out.panelE = tE({x: L.cols[0].x + L.colW, y: L.cols[0].y});
  return out;
}

/**
 * The marker's route (always along the relations): the plate's left foot → the circumstance panel's top edge → down the
 * panel's right side (in the gutter) to the circumstance card's port → along the configured link to the knob → the bracket's
 * spine. The supplied stages pick the part of the route that runs between the first and the last of them.
 */
function routeOf(L, G) {
  // (the marker's halo stays clear of the circumstance panel's heading: it leaves the part relation just above the panel's top
  // edge, runs above it to the gutter and goes down the gutter wholly outside the panel)
  // (where the part chip leaves less than the halo's height above the panel, the leg runs midway in that gap and the
  // marker is drawn smaller, ringK, so that it touches neither the chip's rim nor the panel's heading)
  const R0 = L.F * 0.8 + 3;
  const e = G['part-e'];
  const lb = (L.labels || []).find(q => q.k === 'part' && q.s === 'e');
  const chipB = lb ? lb.box.y + lb.box.h + labelShift(L, G, lb).y : -Infinity;
  const gap = e.b.y - chipB;
  const ringK = gap >= 2 * R0 + 6 ? 1 : clamp((gap - 6) / (2 * R0), 0.45, 1);
  const yA = gap >= 2 * R0 + 6 ? e.b.y - R0 - 2 : (chipB + e.b.y) / 2;
  const tA = e.b.y === e.a.y ? 1 : clamp((yA - e.a.y) / (e.b.y - e.a.y));
  const gx = Math.max(G.panelE.x + L.F * 0.4, Math.min(G.panelE.x + R0, G.knobOpen.x - L.B.hr - R0));
  const full = [
    {s: 'contract', p: e.a},
    {p: mix(e.a, e.b, tA)},
    {p: {x: gx, y: Math.min(yA, e.b.y)}},
    {p: {x: gx, y: G.port.y}},
    {s: 'circumstance', p: G.port},
    {s: 'link', p: G.knob},
    {s: 'section', p: G.spineMid},
  ];
  // (without the part relations the route starts on the plate's foot and drops straight into the gutter)
  const idx = s => full.findIndex(q => q.s === s);
  const i0 = idx(L.stages[0]), i1 = idx(L.stages[L.stages.length - 1]);
  const pts = full.slice(i0, i1 + 1);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].p.x - pts[i - 1].p.x, pts[i].p.y - pts[i - 1].p.y));
  const stageIdx = {};
  pts.forEach((q, i) => { if (q.s) stageIdx[q.s] = i; });
  return {pts: pts.map(q => q.p), cum, tot: cum[cum.length - 1], stageIdx, ringK, band: [chipB - R0, e.b.y + R0], R0};
}

function tracePos(route, t) {
  const {pts, cum, tot} = route;
  if (pts.length === 1 || !tot) return pts[0];
  const d = ease.inOutSine(clamp(t)) * tot;
  for (let i = 1; i < pts.length; i++) if (d <= cum[i] || i === pts.length - 1) return mix(pts[i - 1], pts[i], cum[i] > cum[i - 1] ? clamp((d - cum[i - 1]) / (cum[i] - cum[i - 1])) : 1);
  return pts[pts.length - 1];
}

/** Place the relation labels (the two part labels on their lines, mirrored; the link's label on the link). */
function placeLabels(L) {
  const F = L.F, box = L.box;
  L.labels = [];
  if (!L.show) return;
  const G0 = geometry(L, {ex: 1, sc: {}, br: 0});
  const obst = [L.plate, ...L.cols];
  const placed = [];
  if (L.hasPart) {
    const f = L.partFit, w = f.width + F * 1.2, hh = f.height + F * 0.72;
    const ts = [0, 0.08, -0.08, 0.16, -0.16, 0.24, -0.24, 0.32, -0.32];
    const cand = (s, i) => {
      const ln = G0[`part-${s}`];
      const q = mix(ln.a, ln.b, 0.5 + ts[i % ts.length]);
      const side = Math.floor(i / ts.length);
      const out = s === 'e' ? -1 : 1;
      const x = side === 0 ? q.x - w / 2 : side === 1 ? (out < 0 ? q.x - w - F * 0.5 : q.x + F * 0.5) : (out < 0 ? q.x + F * 0.5 : q.x - w - F * 0.5);
      return {x: clamp(x, box.x, box.x + box.w - w), y: q.y - hh / 2, w, h: hh};
    };
    let pick = null;
    // (preferred: the chips high enough on their lines that the marker, running just above the circumstance panel's top edge,
    // passes under them clear of their rims — see routeOf; else anywhere clear of the parts)
    const ringRoom = 2 * (F * 0.8 + 3) + 4;
    for (const roomy of [true, false]) for (let i = 0; i < ts.length * 3 && !pick; i++) {
      const a = cand('e', i), b = cand('t', i);
      if (roomy && (a.y + a.h > L.cols[0].y - ringRoom || b.y + b.h > L.cols[1].y - ringRoom)) continue;
      if (![...obst].some(o => overlaps(a, o, 2) || overlaps(b, o, 2)) && !overlaps(a, b, 4)) pick = [a, b];
    }
    if (!pick) { L.why.push('label-part'); L.ok = false; pick = [cand('e', 0), cand('t', 0)]; }
    ['e', 't'].forEach((s, i) => { placed.push(pick[i]); L.labels.push({k: 'part', s, box: pick[i], fit: f}); });
  }
  if (L.hasConfig && L.linkFit) {
    // (centred on the link, in the gutter between the circumstance card's port and the open knob, also when gathered)
    const f = L.linkFit, w = L.lw, hh = f.height + F * 0.72;
    const Gg = geometry(L, {ex: 1 - GATHER, sc: {}, br: 0});
    const x0 = Gg.port.x + F * 0.35, x1 = Gg.knob.x - L.B.hr - F * 0.35;
    const cx = (G0.port.x + G0.knobOpen.x) / 2;
    if (L.onLink) {
      const b = {x: cx - w / 2, y: G0.port.y - hh / 2, w, h: hh};
      if (b.x < x0 - 0.5 || b.x + w > x1 + 0.5) { L.why.push('label-config'); L.ok = false; }
      placed.push(b);
      L.labels.push({k: 'config', s: '', box: b, fit: f});
    } else {
      // (under the panels, centred under the gutter, with a leader up the gutter to the link's middle)
      const colB = L.cols[0].y + L.cols[0].h;
      const b = {x: clamp(cx - w / 2, box.x, box.x + box.w - w), y: colB + F * 0.5, w, h: hh};
      if (cx < x0 || cx > x1) { L.why.push('label-config-lead'); L.ok = false; }
      placed.push(b);
      L.labels.push({k: 'config', s: '', box: b, fit: f, lead: {x: cx, y0: b.y, y1: G0.port.y + Math.max(6, F * 0.24)}});
    }
  }
}

/** A label's displacement: it follows its line's middle as the parts move (placed when exploded). */
function labelShift(L, G, lb) {
  const G0 = geometry(L, {ex: 1, sc: {}, br: 0});
  if (lb.k === 'config') {
    // (the link's label stays centred between the port and the knob's open place)
    const k0 = {x: (G0.port.x + G0.knobOpen.x) / 2, y: G0.port.y};
    return {x: (G.port.x + G.knobOpen.x) / 2 - k0.x, y: G.port.y - k0.y};
  }
  const ln0 = G0[`part-${lb.s}`], ln = G[`part-${lb.s}`];
  const m0 = mix(ln0.a, ln0.b, 0.5), m = mix(ln.a, ln.b, 0.5);
  return {x: m.x - m0.x, y: m.y - m0.y};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-05-mechanism',
    title: 'Activation circumstance, without a rule — the contract taken apart: circumstance card, configured link, bracket and section as supplied',
    titleEs: 'Cláusula de terminación — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The assembled contract comes apart: the head plate lifts, the circumstance panel (the circumstance card "Circumstance 1 (supplied)" with its supplied state, ● provided or ◆ undescribed, drawn alike) slides left and the section panel (the supplied clause cards, with a neutral bracket open in its track) slides right. Only explicit plain relations are drawn, with no arrowheads: the contract with each panel and the supplied configured link between the circumstance card and the bracket\'s knob. A neutral marker runs the supplied stages along the relations while the focus element enlarges; with the state "provided" the bracket then slides shut on the supplied section — it only marks it. The parts close in part with everything visible, "Section marked as supplied" (or not marked) and the key "As supplied · no conclusion drawn".',
    tags: ['activation circumstance', 'circumstance', 'section', 'bracket', 'exploded view', 'layers', 'relation', 'configured link', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-terminacion.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
