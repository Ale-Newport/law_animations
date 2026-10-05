/**
 * LAW-0490 — Obligaciones recíprocas · mechanism
 *
 * Storyboard (the contract taken apart into its layers; every element at equal weight on its party's side):
 *  0.00–0.18  separate: the assembled contract (head plate over the two columns, cards seated) comes apart into its
 *             layers — the head plate lifts, column A slides left and column B right — with the two parties' portrait
 *             badges at the top corners.
 *  0.18–0.43  relate: only the explicit relations are drawn, all plain relations (no arrowhead, no causality): each party
 *             with its own column ("column of the party"), the contract plate with each column ("part of the contract"),
 *             and the supplied links between performances ("linked as supplied"), drawn from both ends at once.
 *  0.43–0.75  trace: two markers (● and ◆, the same size) run the supplied traversal stages on both sides at once —
 *             parties, columns, links — and meet in the middle of the first link, while the focus element enlarges.
 *  0.75–1.00  gather: the layers close in part, keeping every element, relation and label visible; key "As supplied ·
 *             no conclusion drawn".
 * A link means only "linked as supplied": no exchange that is due, no condition, no dependency, no order of
 * performance; no breach, remedy or termination; no jurisdiction. Neither side is drawn first or larger.
 * @module animations/contract-terms/LAW-0490
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
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, PX_BASE, PX_STRESS, validLinks, INK,
  perfCard, measureCards, linkGeom, glyph, partyColor, fitG, chipG, localizeScene, overlaps,
} from './kits/obligaciones-reciprocas.js';

const ID = 'LAW-0490';
const DURATION = 7000;
const W = {
  explode: [0.04, 0.16],
  rel: [0.2, 0.3], relLabels: [0.28, 0.34], link: [0.32, 0.42], linkLabel: [0.4, 0.44],
  trace: [0.46, 0.72], focusUp: [0.45, 0.52], focusDown: [0.72, 0.77],
  gather: [0.77, 0.86], key: [0.84, 0.89],
};
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const STAGES = ['parties', 'contract', 'columns', 'links'];
const FOCI = ['contract', 'columns', 'links'];
const GATHER = 0.2;

const sceneSchema = {
  ...motifFields,
  relationships: list('Relations drawn, as supplied: "party" (each party with its own column), "part" (the contract with each column), "link" (the supplied links). All are plain relations: no arrowhead, no causality', oneOf('Relation kind', ['party', 'part', 'link']), 1, 3),
  relationLabels: obj('Labels of the relations', {
    party: str('Label of the party–column relation', 40),
    part: str('Label of the contract–column relation', 40),
    link: str('Label of the links', 40),
  }, ['party', 'part', 'link']),
  focusElement: oneOf('The element that enlarges while the markers run (the two columns enlarge together)', FOCI),
  traversalOrder: list('Stages the two markers run, on both sides at once (in this order): parties, contract, columns, links', oneOf('Stage', STAGES), 1, 4),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  relationships: ['party', 'part', 'link'],
  relationLabels: {party: 'Column of the party', part: 'Part of the contract', link: 'Linked as supplied'},
  focusElement: 'links',
  traversalOrder: ['parties', 'columns', 'links'],
};

const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  relationLabels: {party: 'Columna de la parte', part: 'Parte del contrato', link: 'Enlazadas según lo aportado'},
};

const STRINGS = KIT_STRINGS;

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.performancesA, ...p.performancesB].some(t => t.length > 40);

/** Solve the exploded layout at body size F. Returns null when it does not fit. */
function solve(ctx, p, F, upx, box, shape, stress) {
  const show = ctx.show('all'), showKey = ctx.show('key');
  const headPx = stress ? 46 : shape === 'square' ? 56 : 61;
  const R = Math.max(headPx / (0.6 * upx), F * 2.6);
  const pad = F * 0.5;
  // badges at the top corners, their names under them
  const nmW = Math.min(box.w * 0.34, Math.max(R * 2.8, F * 12));
  const names = [0, 1].map(i => (showKey ? fitG(p.parties[i].name, {maxWidth: nmW - F * 1.2, size: F, maxLines: 3, weight: 600}) : null));
  if (names.some(n => n && n.bad)) return null;
  const nameH = showKey ? Math.max(...names.map(n => n.height)) + F * 0.72 : 0;
  const bx = [box.x + Math.max(R, nmW / 2) + 2, box.x + box.w - Math.max(R, nmW / 2) - 2];
  const by = box.y + R + 2;
  const topBottom = by + R + (nameH ? F * 0.3 + nameH : 0);
  // the contract plate between the badges
  const plateMax = bx[1] - bx[0] - 2 * Math.max(R, nmW / 2) - F * 1.6;
  if (plateMax < F * 8) return null;
  const plateFit = show ? fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: plateMax - F * 1.2, size: F, maxLines: 3, weight: 700}) : null;
  if (plateFit && plateFit.bad) return null;
  const plateW = plateFit ? plateFit.width + F * 1.6 : Math.min(plateMax, F * 10);
  const plateH = plateFit ? plateFit.height + F * 1.1 : F * 1.8;
  // columns (exploded): two panels with a wide gutter for the links
  const gut = Math.max(box.w * (shape === 'portrait' ? 0.16 : 0.24), F * 5);
  const colW = (box.w - gut) / 2;
  const ci = F * 0.45;
  const cw = colW - 2 * ci;
  const C = measureCards([...p.performancesA, ...p.performancesB], F, cw, show);
  if (!C) return null;
  let ch = Math.max(C.ch, 71 / upx);
  const colFit = show ? ['a', 'b'].map(s => fitG(p.columns[s], {maxWidth: colW - F * 2.2, size: F, maxLines: 2, weight: 700})) : [null, null];
  if (colFit.some(f => f && f.bad)) return null;
  const colHH = colFit[0] ? Math.max(...colFit.map(f => f.height)) + F * 0.8 : F * 1.6;
  const nRows = Math.max(p.performancesA.length, p.performancesB.length);
  let gS = F * 0.55;
  const colH0 = colHH + F * 0.4 + nRows * ch + (nRows - 1) * gS + F * 0.5;
  // relation labels band between the top row and the columns
  const lbl = k => (show ? fitG(p.relationLabels[k], {maxWidth: Math.min(colW * 0.7, F * 14), size: F, maxLines: 2, weight: 600}) : null);
  const lab = {party: lbl('party'), part: lbl('part'), link: lbl('link')};
  if (Object.values(lab).some(f => f && f.bad)) return null;
  const labH = show ? Math.max(lab.party.height, lab.part.height) + F * 0.72 : 0;
  const keyFit = showKey ? fitG(ctx.t.key, {maxWidth: box.w - F * 2, size: F, maxLines: 2, weight: 600}) : null;
  const finFit = show && p.relationships.includes('link') && validLinks(p).length ? fitG(ctx.t.linked, {maxWidth: box.w - F * 2, size: F, maxLines: 2, weight: 600}) : null;
  // (room under the columns for the links' label when the gutter cannot hold it)
  const linkLabH = show && p.relationships.includes('link') && validLinks(p).length ? lab.link.height + F * 1.1 : 0;
  const bottomH = (keyFit ? keyFit.height + F * 0.72 : 0) + (finFit ? finFit.height + F * 1.1 : 0) + F * 0.4 + linkLabH;
  const gapMin = Math.max(F * 2.2, labH * 1.3 + F * 1.2);
  const plateY = box.y + Math.max(0, (R * 2 - plateH) / 2);
  const topRow = Math.max(topBottom, plateY + plateH);
  const spare = box.y + box.h - (topRow + gapMin + colH0 + bottomH);
  if (spare < -0.5) return null;
  // the spare height: half to the relations band, the rest to the rows' spacing (up to 0.8 card heights)
  const gapRel = gapMin + spare * 0.38;
  let left = spare * 0.6;
  if (nRows > 1) { const add = Math.min(ch * 0.8, (spare * 0.3) / (nRows - 1)); gS += add; left -= add * (nRows - 1); }
  // (more height still: the cards grow — real objects, never thin strips — up to 1.5×)
  const grow = Math.max(0, Math.min(ch * 0.5, left / nRows));
  ch += grow;
  const colH = colHH + F * 0.4 + nRows * ch + (nRows - 1) * gS + F * 0.5;
  const colY2 = topRow + gapRel;
  const cols = ['a', 'b'].map((s, i) => ({side: s, x: i ? box.x + box.w - colW : box.x, y: colY2, w: colW, h: colH, fit: colFit[i]}));
  const rowY = i => colY2 + colHH + F * 0.4 + ch / 2 + i * (ch + gS);
  // the assembled state: the columns side by side under the plate (a narrow gutter), the plate on them
  const g0 = F * 1.4;
  const asmDx = [(box.x + box.w / 2 - g0 / 2 - colW) - cols[0].x, (box.x + box.w / 2 + g0 / 2) - cols[1].x];
  const plate = {x: box.x + box.w / 2 - plateW / 2, y: plateY, w: plateW, h: plateH};
  const asmDy = colY2 - F * 0.3 - plateH - plateY;
  return {linkLabH, F, upx, R, bx, by, names, nameH, nmW, plate, plateFit, cols, colW, cw, ch, C, ci, colHH, rowY, nRows, gut, lab, labH, keyFit, finFit, bottomH, asmDx, asmDy, box, headPxDesign: headPx, show, showKey};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const box = {x: 8, y: 6, w: D.w - 16, h: D.h - 12};
    let L = null, fallback = null;
    for (const px of stress ? PX_STRESS : PX_BASE) {
      const S = solve(ctx, p, px / upx, upx, box, shape, stress);
      if (!S) continue;
      const Lc = {ok: true, why: [], ...S};
      placeLabels(Lc, p);
      if (Lc.ok) { L = Lc; break; }
      if (!fallback) fallback = Lc;
    }
    if (!L) L = fallback;
    if (!L) return {ok: false, why: ['no-layout-fits'], problems: ['no-layout-fits']};
    const F = L.F;
    L.looks = [0, 1].map(i => actorLook(ctx, p.parties[i], i));
    // bottom notes: final tag and key
    let y = L.box.y + L.box.h - L.bottomH + F * 0.4 + L.linkLabH;
    L.notes = [];
    for (const [nm, f] of [['final', L.finFit], ['key', L.keyFit]]) {
      if (!f) continue;
      const c = chipG(ctx, f.full, {x: L.box.x + L.box.w / 2, y, anchor: 'middle', maxWidth: L.box.w - F, size: F, fit: f, weight: 600});
      L.notes.push({name: nm, c});
      y += c.box.h + F * 0.4;
    }
    L.stages = p.traversalOrder.filter((s, i, a) => a.indexOf(s) === i && (s !== 'links' || L.links.length));
    L.focus = p.focusElement;
    L.problems = L.why;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    if (!L.cols) return g({name: 'scene'});
    const th = ctx.theme;
    const F = L.F;
    const relNodes = [];
    for (const k of ['party', 'part']) {
      if (!L.rels.includes(k)) continue;
      for (const s of ['a', 'b']) relNodes.push(h('line', {name: `rel-${k}-${s}`, stroke: th.inkSoft, 'stroke-width': r(Math.max(4, 3.4 / L.upx), 2), 'stroke-linecap': 'round', opacity: 0}));
    }
    const ends = [];
    for (const k of ['party', 'part']) if (L.rels.includes(k)) for (const s of ['a', 'b']) for (const e of ['a', 'b']) ends.push(h('circle', {name: `rel-${k}-${s}-${e}`, r: r(Math.max(5, F * 0.2), 2), fill: th.inkSoft, opacity: 0}));
    const cols = L.cols.map((c, i) => {
      const s = c.side;
      const kids = [
        h('path', {d: roundRectPath(c.x + 4, c.y + 6, c.w, c.h, 12), fill: th.shadow}),
        h('path', {name: `col-${s}-panel`, d: roundRectPath(c.x, c.y, c.w, c.h, 12), fill: shade(s === 'a' ? th.accent2Soft : th.accent3Soft, 0.45), stroke: INK, 'stroke-width': 2.6}),
        h('path', {d: `M${r(c.x + 10)} ${r(c.y + 4)}H${r(c.x + c.w - 10)}`, stroke: partyColor(ctx, s), 'stroke-width': r(Math.max(7, F * 0.3), 2), 'stroke-linecap': 'round'}),
      ];
      const R = F * 0.38;
      if (c.fit) {
        const tw = c.fit.width + R * 2 + F * 0.45;
        const gx = c.x + c.w / 2 - tw / 2 + R;
        kids.push(glyph(ctx, s, gx, c.y + L.colHH / 2 + 2, R), g({name: `col-${s}-head`}, textBlock(c.fit, {x: r(gx + R + F * 0.45), y: r(c.y + (L.colHH - c.fit.height) / 2 + 2), fill: INK})));
      } else kids.push(glyph(ctx, s, c.x + c.w / 2, c.y + L.colHH / 2 + 2, F * 0.5));
      const list = s === 'a' ? p.performancesA : p.performancesB;
      list.forEach((t, j) => {
        const fit = L.show ? fitG(t, {maxWidth: L.C.tw, size: F, maxLines: 3, weight: 600}) : null;
        kids.push(g({transform: T(r(c.x + c.w / 2), r(L.rowY(j)))}, perfCard(ctx, {name: `card-${s}${j}`, side: s, cw: L.cw, ch: L.ch, C: L.C, fit, F})));
      });
      return g({name: `col-${s}`}, kids);
    });
    const plate = g({name: 'plate'},
      h('path', {d: roundRectPath(L.plate.x + 16, L.plate.y - 14, L.plate.w, L.plate.h, 10), fill: shade(th.card, -0.1), stroke: INK, 'stroke-width': 2}),
      h('path', {d: roundRectPath(L.plate.x + 8, L.plate.y - 7, L.plate.w, L.plate.h, 10), fill: shade(th.card, -0.05), stroke: INK, 'stroke-width': 2}),
      h('path', {name: 'plate-sheet', d: roundRectPath(L.plate.x, L.plate.y, L.plate.w, L.plate.h, 10), fill: th.paperShade, stroke: INK, 'stroke-width': 2.6}),
      L.plateFit ? textBlock(L.plateFit, {x: r(L.plate.x + L.plate.w / 2), y: r(L.plate.y + (L.plate.h - L.plateFit.height) / 2), anchor: 'middle', fill: INK})
        : h('rect', {x: r(L.plate.x + L.plate.w * 0.2), y: r(L.plate.y + L.plate.h / 2 - F * 0.17), width: r(L.plate.w * 0.6), height: r(F * 0.34), rx: 3, fill: INK, opacity: 0.6}));
    const badges = [0, 1].map(i => {
      const b = personBadge(ctx, {name: `badge${i}`, x: L.bx[i], y: L.by, radius: L.R, look: L.looks[i], ring: i ? th.accent3 : th.accent2});
      const kids = [b.node];
      if (L.names[i]) kids.push(chipG(ctx, p.parties[i].name, {x: L.bx[i], y: L.by + L.R + F * 0.3, anchor: 'middle', maxWidth: L.nmW, size: F, fit: L.names[i], weight: 600, name: `name${i}`}).node);
      // the party's glyph on the badge's rim (equal size)
      const gq = {x: L.bx[i] + (i ? -1 : 1) * L.R * 0.74, y: L.by + L.R * 0.74};
      kids.push(h('circle', {cx: r(gq.x), cy: r(gq.y), r: r(F * 0.62), fill: th.card, stroke: INK, 'stroke-width': 2}), glyph(ctx, i ? 'b' : 'a', gq.x, gq.y, F * 0.38));
      return g({name: `badgeg${i}`, opacity: 0}, kids);
    });
    const sw = r(Math.max(5, 4 / L.upx), 2);
    const links = L.links.map((lk, j) => g({name: `link${j}`, opacity: 0},
      h('path', {name: `link${j}-a`, fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round'}),
      h('path', {name: `link${j}-b`, fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round'}),
      g({name: `link${j}-pa`, opacity: 0}, glyph(ctx, 'a', 0, 0, Math.max(7, F * 0.34))),
      g({name: `link${j}-pb`, opacity: 0}, glyph(ctx, 'b', 0, 0, Math.max(7, F * 0.34))),
      h('circle', {name: `link${j}-knot`, r: r(Number(sw) * 1.1, 2), fill: INK, opacity: 0})));
    const labels = L.labels.map((lb, i) => g({name: `lab-${lb.k}${lb.s}`, opacity: 0},
      h('path', {d: roundRectPath(lb.box.x, lb.box.y, lb.box.w, lb.box.h, Math.min(lb.box.h / 2, F * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
      textBlock(lb.fit, {x: r(lb.box.x + lb.box.w / 2), y: r(lb.box.y + F * 0.36), anchor: 'middle', fill: INK})));
    const tracers = ['a', 'b'].map(s => g({name: `tracer-${s}`, opacity: 0},
      h('circle', {r: r(F * 0.85, 2), fill: partyColor(ctx, s), opacity: 0.25}),
      glyph(ctx, s, 0, 0, F * 0.42)));
    return g({name: 'scene'},
      relNodes, ends,
      plate, cols, badges, links, labels,
      L.notes.map(n => g({name: n.name, opacity: 0}, n.c.node)),
      tracers);
  },
  frame(ctx, L, u) {
    if (!L.cols) return {nodes: {}, semantic: {layoutOk: false, why: L.why.join(','), problems: L.problems}};
    const F = L.F;
    const nodes = {};
    // explode / gather: 1 = fully exploded
    const exP = ease.inOutSine(seg(u, ...W.explode));
    const ex = exP * (1 - GATHER * ease.inOutSine(seg(u, ...W.gather)));
    // focus: the element that enlarges while the markers run
    const fz = ease.inOutSine(seg(u, ...W.focusUp)) * (1 - ease.inOutSine(seg(u, ...W.focusDown)));
    const sc = {};
    if (L.focus === 'contract') sc.plate = 1 + 0.12 * fz;
    // (the two columns enlarge together: neither side primary)
    if (L.focus === 'columns') { sc.a = 1 + 0.08 * fz; sc.b = 1 + 0.08 * fz; }
    const G = relGeometry(L, {ex, exP, sc});
    for (const s of ['a', 'b']) nodes[`col-${s}`] = {transform: G.colT[s]};
    nodes.plate = {transform: G.plateT};
    nodes.badgeg0 = {opacity: 1};
    nodes.badgeg1 = {opacity: 1};
    // relations (draw on from both ends at once — plain, no arrowhead)
    const rp = ease.inOutSine(seg(u, ...W.rel));
    for (const k of ['party', 'part']) {
      if (!L.rels.includes(k)) continue;
      for (const s of ['a', 'b']) {
        const ln = G[`${k}-${s}`];
        const m = mix(ln.a, ln.b, 0.5);
        const a = mix(m, ln.a, rp), b = mix(m, ln.b, rp);
        nodes[`rel-${k}-${s}`] = {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), opacity: rp > 0 ? 1 : 0};
        nodes[`rel-${k}-${s}-a`] = {cx: r(ln.a.x), cy: r(ln.a.y), opacity: r(seg(rp, 0.9, 1), 3)};
        nodes[`rel-${k}-${s}-b`] = {cx: r(ln.b.x), cy: r(ln.b.y), opacity: r(seg(rp, 0.9, 1), 3)};
      }
    }
    // links: from both ends at once, joined in the middle; the links' focus thickens them and enlarges the ports
    const lp = seg(u, ...W.link);
    const lf = L.focus === 'links' ? fz : 0;
    const sw = Math.max(5, 4 / L.upx) * (1 + 0.6 * lf);
    L.links.forEach((lk, j) => {
      const pa = G.port('a', lk.a - 1), pb = G.port('b', lk.b - 1);
      const geo = linkGeom(pa, pb);
      const dr = ease.inOutSine(seg(lp, 0.15, 0.9));
      nodes[`link${j}`] = {opacity: lp > 0 ? 1 : 0};
      nodes[`link${j}-a`] = {d: geo.da, 'stroke-dasharray': `${r(geo.la + 2)} ${r(geo.la + 2)}`, 'stroke-dashoffset': r((geo.la + 2) * (1 - dr), 1), 'stroke-width': r(sw, 2)};
      nodes[`link${j}-b`] = {d: geo.db, 'stroke-dasharray': `${r(geo.lb + 2)} ${r(geo.lb + 2)}`, 'stroke-dashoffset': r((geo.lb + 2) * (1 - dr), 1), 'stroke-width': r(sw, 2)};
      const mk = seg(lp, 0, 0.15);
      nodes[`link${j}-pa`] = {transform: T(r(pa.x, 2), r(pa.y, 2), 0, r(1 + 0.4 * lf, 3)), opacity: r(mk, 3)};
      nodes[`link${j}-pb`] = {transform: T(r(pb.x, 2), r(pb.y, 2), 0, r(1 + 0.4 * lf, 3)), opacity: r(mk, 3)};
      nodes[`link${j}-knot`] = {cx: r(geo.mid.x, 2), cy: r(geo.mid.y, 2), opacity: r(seg(lp, 0.88, 1), 3)};
    });
    // labels (the relation labels follow their lines' displacement during the gather)
    for (const lb of L.labels) {
      const op = lb.k === 'link' ? seg(u, ...W.linkLabel) : seg(u, ...W.relLabels);
      const d = lb.k === 'link' ? {x: 0, y: G.dy.cols} : labelShift(L, G, lb);
      nodes[`lab-${lb.k}${lb.s}`] = {opacity: r(op, 3), transform: T(r(d.x, 2), r(d.y, 2))};
    }
    // the two markers: the supplied stages, on both sides at once
    const tr = seg(u, ...W.trace);
    const trOp = u >= W.trace[0] && u < W.trace[1] + 0.02 ? 1 : 0;
    const tracer = {};
    for (const s of ['a', 'b']) {
      const pts = L.stages.map(st => stagePoint(L, G, st, s));
      const q = tracePos(pts, tr);
      nodes[`tracer-${s}`] = {transform: T(r(q.x, 2), r(q.y, 2)), opacity: trOp};
      tracer[s] = {x: r(q.x), y: r(q.y)};
    }
    for (const n of L.notes) nodes[n.name] = {opacity: r(seg(u, ...W.key), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const ports = L.links.map(lk => ({a: G.port('a', lk.a - 1), b: G.port('b', lk.b - 1)}));
    return {
      nodes,
      semantic: {
        beat, exploded: r(ex, 3), focus: L.focus, focusScale: r(fz, 3), relations: rp > 0.99 ? L.rels.filter(k => k !== 'link') : [],
        linkProgress: r(lp, 3), links: L.links.length, tracerA: tracer.a, tracerB: tracer.b, tracersMet: tr >= 1 && L.stages.includes('links') && Math.hypot(tracer.a.x - tracer.b.x, tracer.a.y - tracer.b.y) < 1,
        stages: L.stages, linkEnds: ports.map(q => [q.a.x, q.a.y, q.b.x, q.b.y].map(v => r(v))),
        plate: {x: r(L.plate.x + L.plate.w / 2), y: r(L.plate.y + G.dy.plate)},
        colA: {x: r(L.cols[0].x + G.dx.a), y: r(L.cols[0].y)}, colB: {x: r(L.cols[1].x + G.dx.b), y: r(L.cols[1].y)},
        keyShown: r(seg(u, ...W.key), 3),
        layoutOk: L.ok, why: L.why.join(','), problems: L.problems,
        textPx: r(F * L.upx, 2), headPx: r(L.R * 2 * 0.3 * L.upx, 1),
      },
    };
  },
};

/** Place the relation labels (on their lines) and the link label; flags a label that cannot be placed. */
function placeLabels(L, p) {
  const box = L.box;
  L.links = p.relationships.includes('link') ? validLinks(p) : [];
  L.rels = p.relationships;
    // relation label placement: party labels beside their line on the outer side; part labels on the inner side;
    // the link label at the top of the gutter
    const F = L.F;
    const placed = [];
    const obst = [{x: L.plate.x, y: L.plate.y, w: L.plate.w, h: L.plate.h}, ...L.bx.map(x => ({x: x - L.R, y: L.by - L.R, w: 2 * L.R, h: 2 * L.R + (L.nameH ? F * 0.3 + L.nameH : 0)})), ...L.cols.map(c => ({x: c.x, y: c.y, w: c.w, h: c.h}))];
    L.relGeo = (o) => relGeometry(L, o);
    const G0 = relGeometry(L, {ex: 1, sc: {}});
    L.labels = [];
    if (L.show) {
      // (each pair of labels — party A / party B, part A / part B — takes the same candidate on its own line, mirrored:
      // the two sides at equal weight)
      for (const k of ['party', 'part']) {
        if (!L.rels.includes(k)) continue;
        const f = L.lab[k];
        const w = f.width + F * 1.2, hh = f.height + F * 0.72;
        const ts = [0, 0.08, -0.08, 0.16, -0.16, 0.24, -0.24, 0.32, -0.32, 0.4, -0.4];
        // (centred on the line first; then just beside it, on the outer or the inner side)
        const candOf = (s, i) => {
          const ln = G0[`${k}-${s}`];
          const n = ts.length;
          const t = ts[i % n], side = Math.floor(i / n);
          const q = mix(ln.a, ln.b, 0.5 + t);
          const out = s === 'a' ? -1 : 1;
          const x = side === 0 ? q.x - w / 2 : side === 1 ? (out < 0 ? q.x - w - F * 0.5 : q.x + F * 0.5) : (out < 0 ? q.x + F * 0.5 : q.x - w - F * 0.5);
          return {x: Math.max(box.x, Math.min(x, box.x + box.w - w)), y: q.y - hh / 2, w, h: hh};
        };
        const okAt = (s, b, extra) => ![...obst, ...placed, ...extra].some(o => overlaps(b, o, 2)) && !segHits(G0, b, `${k}-${s}`);
        let pick = null;
        for (let i = 0; i < ts.length * 3 && !pick; i++) {
          const ba = candOf('a', i), bb = candOf('b', i);
          if (okAt('a', ba, []) && okAt('b', bb, [ba])) pick = [ba, bb];
        }
        if (!pick) { L.why.push(`label-${k}`); L.ok = false; pick = [candOf('a', 0), candOf('b', 0)]; }
        ['a', 'b'].forEach((s, i) => { placed.push(pick[i]); L.labels.push({k, s, box: pick[i], fit: f}); });
      }
      if (L.links.length) {
        const f = L.lab.link, w = f.width + F * 1.2, hh = f.height + F * 0.72;
        const gx = (L.cols[0].x + L.cols[0].w + L.cols[1].x) / 2;
        const gw = L.cols[1].x - L.cols[0].x - L.cols[0].w;
        // (inside the gutter at its foot when it fits, else just under the columns)
        // (inside the gutter at its foot or at its top when it fits — clear of the links' rows —, else just under the columns)
        const c0 = L.cols[0];
        const lastRow = L.rowY(L.nRows - 1) + L.ch / 2, firstRow = L.rowY(0) - L.ch / 2;
        const cands = w <= gw - F * 0.6 ? [{x: gx - w / 2, y: c0.y + c0.h - hh - F * 0.2}, {x: gx - w / 2, y: c0.y + F * 0.2}] : [];
        cands.push({x: gx - w / 2, y: c0.y + c0.h + F * 0.3});
        let b = null;
        for (const c of cands) {
          const bb = {...c, w, h: hh};
          const inGut = bb.y < c0.y + c0.h;
          if (inGut && !(bb.y >= lastRow + F * 0.2 || bb.y + bb.h <= firstRow - F * 0.2)) continue;
          if ([...obst.slice(0, 3), ...placed].some(o => overlaps(bb, o, 2))) continue;
          if (bb.y + bb.h > L.box.y + L.box.h - L.bottomH + L.linkLabH) continue;
          b = bb; break;
        }
        if (!b) { L.why.push('label-link'); L.ok = false; b = {...cands[0], w, h: hh}; }
        placed.push(b);
        L.labels.push({k: 'link', s: '', box: b, fit: f});
      }
    }
}

/** Geometry at explode ex (1 = exploded) and focus scales: element transforms, ports and relation endpoints. */
function relGeometry(L, {ex, exP = ex, sc}) {
  const dx = {a: L.asmDx[0] * (1 - ex), b: L.asmDx[1] * (1 - ex)};
  // (the plate stays lifted while the columns close in part)
  const dy = {plate: L.asmDy * (1 - exP), cols: 0};
  const colC = s => { const c = L.cols[s === 'a' ? 0 : 1]; return {x: c.x + c.w / 2 + dx[s], y: c.y + c.h / 2}; };
  const scl = s => sc[s] ?? 1;
  const tf = (s, q) => { const c = colC(s), k = scl(s); return {x: c.x + (q.x + dx[s] - c.x) * k, y: c.y + (q.y - c.y) * k}; };
  const plateC = {x: L.plate.x + L.plate.w / 2, y: L.plate.y + L.plate.h / 2 + dy.plate};
  const kp = sc.plate ?? 1;
  const out = {dx, dy};
  out.colT = {};
  for (const s of ['a', 'b']) { const c = colC(s), k = scl(s); out.colT[s] = `translate(${r(c.x * (1 - k) + dx[s] * k, 2)} ${r(c.y * (1 - k), 2)}) scale(${r(k, 4)})`; }
  out.plateT = `translate(${r(plateC.x * (1 - kp), 2)} ${r(plateC.y * (1 - kp) + dy.plate * kp, 2)}) scale(${r(kp, 4)})`;
  out.port = (s, i) => { const c = L.cols[s === 'a' ? 0 : 1]; return tf(s, {x: c.x + c.w / 2 + (s === 'a' ? 1 : -1) * L.cw / 2, y: L.rowY(i)}); };
  for (const s of ['a', 'b']) {
    const c = L.cols[s === 'a' ? 0 : 1];
    const i = s === 'a' ? 0 : 1;
    const outer = s === 'a' ? c.x + c.w * 0.22 : c.x + c.w * 0.78;
    const inner = s === 'a' ? c.x + c.w * 0.8 : c.x + c.w * 0.2;
    out[`party-${s}`] = {a: {x: L.bx[i], y: L.by + L.R + (L.nameH ? L.F * 0.3 + L.nameH : 0)}, b: tf(s, {x: outer, y: c.y})};
    const pe = {x: plateC.x + (s === 'a' ? -1 : 1) * L.plate.w * kp * 0.3, y: plateC.y + L.plate.h * kp / 2};
    out[`part-${s}`] = {a: pe, b: tf(s, {x: inner, y: c.y})};
  }
  return out;
}

/** A label's displacement: it follows its line's middle as the elements move (the label was placed when exploded). */
function labelShift(L, G, lb) {
  const G0 = relGeometry(L, {ex: 1, sc: {}});
  const ln0 = G0[`${lb.k}-${lb.s}`], ln = G[`${lb.k}-${lb.s}`];
  const m0 = mix(ln0.a, ln0.b, 0.5), m = mix(ln.a, ln.b, 0.5);
  return {x: m.x - m0.x, y: m.y - m0.y};
}

/** True when a box crosses one of the relation lines (other than its own). */
function segHits(G, b, own) {
  for (const k of ['party-a', 'party-b', 'part-a', 'part-b']) {
    if (k === own) continue;
    const ln = G[k];
    for (let i = 0; i <= 20; i++) { const q = mix(ln.a, ln.b, i / 20); if (q.x > b.x - 3 && q.x < b.x + b.w + 3 && q.y > b.y - 3 && q.y < b.y + b.h + 3) return true; }
  }
  return false;
}

/** A stage's point on a side: the badge, the plate's lower edge on that side, the column's heading, the first link's middle. */
function stagePoint(L, G, st, s) {
  if (st === 'parties') return G[`party-${s}`].a;
  if (st === 'contract') return G[`part-${s}`].a;
  if (st === 'columns') return G[`party-${s}`].b;
  const lk = L.links[0];
  return linkGeom(G.port('a', lk.a - 1), G.port('b', lk.b - 1)).mid;
}

function tracePos(pts, t) {
  if (pts.length === 1) return pts[0];
  const seglen = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seglen.push(d); tot += d; }
  let d = ease.inOutSine(clamp(t)) * tot;
  for (let i = 0; i < seglen.length; i++) {
    if (d <= seglen[i] || i === seglen.length - 1) return mix(pts[i], pts[i + 1], seglen[i] ? clamp(d / seglen[i]) : 1);
    d -= seglen[i];
  }
  return pts[pts.length - 1];
}


export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-03-mechanism',
    title: 'Reciprocal obligations, without a rule — the contract taken apart: two columns, two parties and the links as supplied',
    titleEs: 'Obligaciones recíprocas — Mecanismo o relación explicada',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Obligaciones recíprocas',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The assembled contract comes apart into its layers: the head plate lifts and the two columns, "Obligation of A" (●) and "Obligation of B" (◆), slide apart with their performance cards; the parties appear as portrait badges at the top corners. Only explicit plain relations are drawn (no arrowheads): each party with its own column, the contract with each column, and the supplied links between performances, drawn from both ends at once. Two markers of the same size run the supplied stages on both sides at once and meet in the middle of the first link while the focus element enlarges. The layers then close in part with everything visible and the key "As supplied · no conclusion drawn".',
    tags: ['reciprocal obligations', 'two columns', 'exploded view', 'layers', 'relation', 'link', 'tracer', 'equal weight', 'badges'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/obligaciones-reciprocas.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
