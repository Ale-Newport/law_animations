/**
 * LAW-0682 — Cadena causal · mechanism
 *
 * Storyboard (exploded timeline, not a row of cards):
 *  0.00–0.18 separate  The axis of SUPPLIED ORDER draws out (on wide boxes it is
 *                      the ground line of a descending cascade of stepped
 *                      pedestals — one step per event, the loss on the lowest);
 *                      the event tokens (upright tiles with die faces, as in
 *                      the story) are set down on their steps in order; the loss
 *                      node and any alternative barriers appear — a barrier
 *                      stands on the ground IN THE GAP of the link it is put
 *                      forward against, its sign above it.
 *  0.18–0.43 relate    Only the supplied links are drawn, one by one, as arcs
 *                      between neighbouring tokens. Style follows the data:
 *                      sequence (thin arrow) by default, causal (thick accent
 *                      arrow) ONLY when a link says kind 'causal', disputed
 *                      (dotted, no arrowhead, "?" badge). Each alternative is
 *                      tied to the link it is put forward against with a plain
 *                      relation line (grey, no arrow) that ends on the link's
 *                      "?" badge (or the arc). Extra relationships, if
 *                      supplied, are drawn anchored to their elements.
 *  0.43–0.75 trace     A tracer follows `traversalOrder` along the arcs; each
 *                      token it reaches lights up, the focus element enlarges
 *                      while the tracer passes, and the loss node shows its
 *                      crack only when the tracer arrives (the part that
 *                      changes, "as described").
 *  0.75–1.00 gather    Tracer leaves; everything stays in place with states
 *                      visible; legend of the connection kinds actually used.
 * Cascade on wide boxes; vertical axis (labels left, arcs right, a right
 * column for link captions and alternatives, gaps stretched where an
 * alternative needs room) on square and tall boxes. The whole drawing is fitted
 * into the design space, so no label can leave the caption-safe box.
 * Legal content: links are shown as supplied/proposed/disputed only; the
 * animation never decides causation or a disputed link.
 * @module animations/causation/LAW-0682
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor, roundRectPath} from '../../core/geometry.js';
import {shade} from '../../primitives/paper.js';
import {str, oneOf, list, obj} from '../../schemas/fields.js';
import {chip, connector, tracer, statusTag, textBlock, caption} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {chainFields, CHAIN_STRINGS, resolveChain, tileArt, tileColor, lossArt, barrierArt} from './kits/causal-chain.js';
import {placeChip, segPolys, hitsAny, balancedWidth} from './kits/place.js';

const ID = 'LAW-0682';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const IDS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'alt1', 'alt2', 'loss'];
const LINK_IDS = ['link1', 'link2', 'link3', 'link4', 'link5', 'link6'];

const sceneSchema = {
  ...chainFields,
  elements: list('Optional label overrides by component id (e1–e6 = events, alt1–alt2 = alternatives, loss); unlisted components use their event/alternative/loss label', obj('Component label', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 90),
  }, ['id', 'label']), 0, 9),
  relationships: list('Extra explicit relationships between components (the chain links themselves come from causalLinks); kind controls the line style and a causal arrow is only drawn when supplied', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal', ['relation', 'communication', 'sequence', 'causal']),
    label: str('Caption for this relationship', 40),
  }, ['from', 'to', 'kind']), 0, 4),
  focusElement: oneOf('Component or link (link1 = event 1 → event 2 …) enlarged while the tracer passes', [...IDS, ...LINK_IDS]),
  relationLabels: obj('Captions used for each connection kind', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 60),
    causal: str('Caption for supplied causal links', 60),
    disputed: str('Caption added to disputed links', 60),
  }),
  traversalOrder: list('Order in which the tracer visits components (ids as in elements)', oneOf('Component id', IDS), 2, 9),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+1 min'},
    {label: 'Display stand shakes', time: 'T+2 min'},
  ],
  causalLinks: [
    {from: 1, kind: 'causal', status: 'proposed'},
    {from: 2, kind: 'causal', status: 'disputed'},
  ],
  alternatives: [{label: 'Cleaning cart passes by', link: 2, status: 'alleged'}],
  losses: [{label: 'Ceramic vase cracked'}],
  elements: [],
  relationships: [],
  focusElement: 'link3',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)', disputed: 'disputed'},
  traversalOrder: ['e1', 'e2', 'e3', 'e4', 'loss'],
};

const SHAPES = {
  // wide boxes: a descending cascade of stepped pedestals along the ground axis
  landscape: {dir: 'h', size: 28, chip: 27},
  // square and tall boxes: vertical axis, labels left, arcs right, alternatives in a right column
  square: {dir: 'v', axisX: 0.3, size: 34, chip: 31, tokMax: 230, tokK: 0.8, legendMax: 0.9},
  portrait: {dir: 'v', axisX: 0.4, size: 30, chip: 28, tokMax: 200, legendMax: 1},
};

const FONT = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";
const STONE = '#ddd5c6';

/** Stone pedestal (a step of the cascade). (x, top) = top-left; stands on groundY. */
function pedestalArt(ctx, {x, top, w, groundY}) {
  const th = ctx.theme;
  const hh = groundY - top;
  return g(null,
    h('path', {d: roundRectPath(x + 6, top + 12, w - 12, Math.max(4, hh - 12), 3), fill: STONE, stroke: th.ink, 'stroke-width': th.stroke}),
    hh > 60 ? h('path', {d: roundRectPath(x + 16, top + 26, w - 32, hh - 50, 3), fill: 'none', stroke: shade(STONE, -0.18), 'stroke-width': 2}) : null,
    h('path', {d: roundRectPath(x, top, w, 14, 4), fill: shade(STONE, 0.1), stroke: th.ink, 'stroke-width': th.stroke}),
  );
}

const scene = {
  sizes: {landscape: [1700, 950], square: [1300, 1250], portrait: [950, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    const hor = SH.dir === 'h';
    const C = resolveChain(p);
    const n = C.n;
    const N = n + 1; // events + loss
    const margin = 40;
    const override = id => (p.elements.find(e => e.id === id) || {}).label;
    const evLabel = i => override(`e${i + 1}`) || C.events[i].label;
    const altLabel = j => override(`alt${j + 1}`) || C.alternatives[j].label;
    const lossLabel = override('loss') || p.losses.map(l => l.label).join(' · ');
    const altText = j => `${t.alternative} (${C.alternatives[j].status === 'alleged' ? t.alleged : t.proposed}): ${altLabel(j)}`;
    const kindText = l => l.label || (l.kind === 'causal' ? p.relationLabels.causal : p.relationLabels.sequence);
    const linkText = l => (l.status === 'disputed' ? `${kindText(l)} · ${p.relationLabels.disputed || t.disputed}` : kindText(l));
    const relColor = kindColor(ctx, 'relation'); // a plain relation is never drawn in the causal colour
    const linkStyle = l => (l.status === 'disputed' ? 'disputed' : l.kind);
    const linkColor = l => (l.status === 'disputed' ? th.accent3 : kindColor(ctx, l.kind));
    const bchip = (text, o) => chip(ctx, text, {...o, maxWidth: balancedWidth(ctx, text, {maxWidth: o.maxWidth, size: o.size, maxLines: o.maxLines})});

    // ---- geometry of the nodes
    let slot, tokH, tokW, lossW, lossH, centerOf, nodeBox, axisStart, axisEnd, P = null, groundY = 0, axisX = 0;
    const altPlan = []; // per alternative: {j, i, x, w, chipW}
    let gapOf = null; // distance between node i and node i + 1 along the axis
    let rx0v = 0, rx1v = 0; // vertical: the right column (link captions, alternatives)
    if (hor) {
      const x0 = margin + 20, x1 = D.w - margin;
      const byLink = {};
      C.alternatives.forEach((a, j) => { (byLink[a.link] = byLink[a.link] || []).push(j); });
      // a link that carries an alternative gets a wider gap: its barrier and sign stand in it
      const signW = j => clamp((altText(j).length / 4) * 12.5 + 40, 220, 400); // ≈ four lines
      // heights that do not depend on the tile size (labels under the axis, link captions)
      const stampH = C.events.some(e => e.time) && ctx.show('all') ? 40 : 6;
      const probeLabels = uu => (ctx.show('key') ? Math.max(...Array.from({length: N}, (_, i) => chip(ctx, i === n ? `${t.lossAs}: ${lossLabel}` : `${i + 1}. ${evLabel(i)}`, {x: 0, y: 0, maxWidth: uu - 14, size: SH.size, maxLines: 5}).box.h)) : 0);
      const probeLinks = uu => (ctx.show('all') ? Math.max(...C.links.map(l => bchip(linkText(l), {x: 0, y: 0, maxWidth: uu * 0.96, size: SH.chip, maxLines: 4}).box.h)) : 0);
      let u = (x1 - x0) / N;
      let extra = new Array(N).fill(0);
      let dy = 40;
      const pedWith = (i, th0) => (i < n ? th0 * 0.42 : th0 * 0.62 + 30) + 44;
      for (let it = 0; it < 4; it++) {
        const bandH = 90;
        const avail = D.h - 30 - bandH - 26 - probeLinks(u) - 18 - probeLabels(u) - stampH - 40;
        const bul = Math.min(u * 0.36, 150);
        const perStep = 1 + 0.24 * (N - 1);
        tokH = clamp(Math.min(u * 0.8, 260, (avail - 30 - 0.85 * bul) / perStep), 100, 260);
        dy = clamp((avail - 30 - 0.85 * bul - tokH) / (N - 1), 24, 90);
        extra = new Array(N).fill(0);
        for (const [lk, js] of Object.entries(byLink)) {
          const i = Number(lk);
          const need = js.reduce((a, j) => a + signW(j), 0) + 12 * (js.length - 1);
          const have = u - (pedWith(i, tokH) + pedWith(i + 1, tokH)) / 2 - 20;
          extra[i] = Math.max(0, need - have);
        }
        u = (x1 - x0 - extra.reduce((a, b) => a + b, 0)) / N;
      }
      slot = u;
      tokW = tokH * 0.42;
      lossW = tokH * 0.62; lossH = tokH * 0.9;
      const pedW = i => pedWith(i, tokH);
      P = Array.from({length: N}, (_, i) => 30 + (N - 1 - i) * dy);
      const cxs = [x0 + u / 2];
      for (let i = 1; i < N; i++) cxs.push(cxs[i - 1] + u + extra[i - 1]);
      const cx = i => cxs[i];
      gapOf = i => cx(i + 1) - cx(i);
      // alternatives stand on the ground in the gap of their link, a sign above them;
      // the steps before that gap rise if the sign needs more headroom
      for (const [lk, js] of Object.entries(byLink)) {
        const i = Number(lk);
        const gl = cx(i) + pedW(i) / 2 + 10, gr = cx(i + 1) - pedW(i + 1) / 2 - 10;
        const part = (gr - gl) / js.length;
        let need = 0;
        js.forEach((j, q) => {
          const w = part - 8;
          const bw = Math.min(120, w * 0.8);
          const probe = ctx.show('key') ? bchip(altText(j), {x: 0, y: 0, maxWidth: Math.max(120, w), size: SH.chip * 0.92, maxLines: 8}).box : {w: bw, h: 0};
          altPlan.push({j, i, x: gl + part * (q + 0.5), w, bw, bh: bw * 0.6, chipW: probe.w, chipH: probe.h});
          need = Math.max(need, bw * 0.6 + (probe.h ? probe.h + 16 : 0) + 30);
        });
        // headroom under the arc ≈ the lower step's height + its token
        const room = P[i + 1] + (i + 1 < n ? tokH : lossH + 22) - 16;
        if (need > room) {
          P[i + 1] += need - room;
          for (let k2 = i; k2 >= 0; k2--) P[k2] = Math.max(P[k2], P[k2 + 1] + dy);
        }
      }
      centerOf = i => ({x: cx(i), y: groundY - P[i]});
      nodeBox = i => {
        const c = centerOf(i);
        const w = i < n ? tokW : lossW + 30;
        const hh = i < n ? tokH : lossH + 22;
        return {x: c.x - w / 2, y: c.y - hh, w, h: hh};
      };
      axisStart = {x: x0 - 20, y: groundY};
      axisEnd = {x: x1 + 10, y: groundY};
    } else {
      // vertical axis: labels left, arcs right; the right column holds the link captions
      // and the alternatives; gaps with an alternative stretch so nothing overlaps
      const y0 = 150, y1 = D.h - 110;
      const s0 = (y1 - y0) / N;
      tokH = Math.min(SH.tokMax ?? 200, s0 * (SH.tokK ?? 0.7));
      tokW = tokH * 0.46;
      lossW = tokH * 0.62; lossH = tokH * 0.9;
      axisX = D.w * SH.axisX;
      const half = Math.max(tokW, lossW + 30) / 2;
      const vBulge = Math.min(s0 * 0.62, D.w * 0.19);
      rx0v = axisX + half + 8 + vBulge * 0.8 + 30;
      rx1v = D.w - margin * 0.5;
      const lmw = axisX - half - 26 - margin + 10;
      const blockH = Array.from({length: N}, (_, i) => (ctx.show('key') ? chip(ctx, i === n ? `${t.lossAs}: ${lossLabel}` : `${i + 1}. ${evLabel(i)}`, {x: 0, y: 0, maxWidth: lmw, size: SH.size, maxLines: 5}).box.h + (i < n && C.events[i].time && ctx.show('all') ? 33 : 0) : 0));
      const linkH = C.links.map((l, i) => (ctx.show('all') ? bchip(linkText(l), {x: 0, y: 0, maxWidth: rx1v - rx0v - (C.alternatives.some(a => a.link === i) ? Math.min(140, D.w * 0.14) + 26 : 0), size: SH.chip, maxLines: 4}).box.h : 0));
      const s = Math.max(s0, Math.max(...blockH) + 20, tokH + 36);
      const bwv = Math.min(140, D.w * 0.14), bhv = bwv * 0.62;
      const extra = new Array(N).fill(0);
      C.links.forEach((l, i) => {
        const js = C.alternatives.map((a, j) => (a.link === i ? j : -1)).filter(j => j >= 0);
        if (!js.length) return;
        const relLabH = j => (ctx.show('all') ? p.relationships.filter(x => (x.from === `alt${j + 1}` || x.to === `alt${j + 1}`) && x.kind === 'relation').reduce((a, x) => a + bchip(x.label || p.relationLabels.relation || 'relation', {x: 0, y: 0, maxWidth: 300, size: SH.chip * 0.9, maxLines: 3}).box.h + 22, 0) : 0);
        const altH = js.reduce((a, j) => a + (ctx.show('key') ? bchip(altText(j), {x: 0, y: 0, maxWidth: rx1v - rx0v - bwv - 20, size: SH.chip, maxLines: 6}).box.h : 0) + 14 + relLabH(j), 0);
        const below = Math.max(bhv / 2, 0) + 12 + Math.max(altH, bhv / 2) + 14 + (linkH[i + 1] ?? 0) / 2;
        const above = 22 + linkH[i] + 14 + (linkH[i - 1] ?? 0) / 2;
        extra[i] = Math.max(0, 2 * below - 2 * s, 2 * above - 2 * s);
      });
      slot = s;
      const cys = [y0 + s / 2];
      for (let i = 1; i < N; i++) cys.push(cys[i - 1] + s + extra[i - 1]);
      axisStart = {x: axisX, y: y0 - 50};
      axisEnd = {x: axisX, y: cys[N - 1] + s / 2 + 20};
      centerOf = i => ({x: axisX, y: cys[i]});
      nodeBox = i => {
        const c = centerOf(i);
        const w = i < n ? tokW : lossW + 30;
        const hh = i < n ? tokH : lossH + 22;
        return {x: c.x - w / 2, y: c.y - hh / 2, w, h: hh};
      };
      gapOf = i => cys[i + 1] - cys[i];
    }
    const bulge = hor ? Math.min(slot * 0.36, 150) : Math.min(((D.h - 260) / N) * 0.62, D.w * 0.19);

    // ---- steps (pedestals) / ledges
    const steps = hor
      ? Array.from({length: N}, (_, i) => {
        const b = nodeBox(i);
        const w = b.w + 44;
        return pedestalArt(ctx, {x: b.x + b.w / 2 - w / 2, top: b.y + b.h, w, groundY});
      })
      : Array.from({length: N}, (_, i) => {
        const b = nodeBox(i);
        const w = b.w + 34;
        return g(null,
          h('path', {d: roundRectPath(b.x + b.w / 2 - w / 2, b.y + b.h, w, 12, 3), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
          h('path', {d: `M${r(b.x + b.w / 2 - 8)} ${r(b.y + b.h + 12)}l8 12l8 -12`, fill: th.wood, stroke: th.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round'}));
      });

    // ---- tokens
    const tokens = C.events.map((e, i) => {
      const b = nodeBox(i);
      const art = tileArt(ctx, {w: tokW, h: tokH, index: i, color: tileColor(ctx, i)});
      const glow = h('path', {name: `tok${i}-glow`, d: roundRectPath(b.x - 12, b.y - 12, b.w + 24, b.h + 24, 12), fill: th.accent3Soft, stroke: th.accent3, 'stroke-width': 3, opacity: 0});
      return {box: b, center: {x: b.x + b.w / 2, y: b.y + b.h / 2}, node: g({name: `tok${i}`},
        glow,
        g({name: `tok${i}-body`}, g({transform: T(b.x + b.w, b.y + b.h)}, art)))};
    });
    const lb = nodeBox(n);
    const lossArtNode = lossArt(ctx, {name: 'lossnode-art', w: lossW, h: lossH, kind: 'vase', color: th.accent3});
    const lossNode = g({name: 'lossnode'},
      h('path', {name: 'lossnode-glow', d: roundRectPath(lb.x - 12, lb.y - 12, lb.w + 24, lb.h + 24, 12), fill: th.accentSoft, stroke: th.accent, 'stroke-width': 3, opacity: 0}),
      g({name: 'lossnode-body'},
        h('rect', {x: r(lb.x), y: r(lb.y + lb.h - 22), width: r(lb.w), height: 22, rx: 4, fill: '#d8d0c0', stroke: th.ink, 'stroke-width': th.stroke}),
        g({transform: T(lb.x + 15 + lossW, lb.y + lb.h - 22)}, lossArtNode.node)));

    // ---- axis of supplied order (the ground line on wide boxes)
    const axisLen = Math.hypot(axisEnd.x - axisStart.x, axisEnd.y - axisStart.y);
    const axisNode = g({name: 'axis'},
      h('line', {name: 'axis-line', x1: r(axisStart.x), y1: r(axisStart.y), x2: r(axisEnd.x), y2: r(axisEnd.y), stroke: th.fgSoft, 'stroke-width': hor ? 5 : 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(axisLen)} 99999`, 'stroke-dashoffset': r(axisLen)}),
      h('path', {name: 'axis-head', d: hor ? 'M0 0l-18 -10v20z' : 'M0 0l-10 -18h20z', fill: th.fgSoft, transform: T(axisEnd.x, axisEnd.y), opacity: 0}),
      Array.from({length: N}, (_, i) => {
        const c = hor ? {x: centerOf(i).x, y: groundY} : centerOf(i);
        return h('path', {name: `tick${i}`, d: hor ? `M${r(c.x)} ${r(c.y - 8)}V${r(c.y + 8)}` : `M${r(c.x - 8)} ${r(c.y)}H${r(c.x + 8)}`, stroke: th.fgSoft, 'stroke-width': 3, opacity: 0});
      }),
    );
    const axisCaption = ctx.show('all') && !hor ? caption(ctx, `${t.supplied} ↓`, {x: axisX + 16, y: axisStart.y - 16, maxWidth: D.w * 0.4, size: 24, weight: 600, fill: th.fgSoft, name: 'axis-cap'}) : null;

    // ---- event / loss labels (+ supplied time)
    const labels = [];
    const labelBoxes = [];
    if (ctx.show('key')) {
      for (let i = 0; i < N; i++) {
        const isLoss = i === n;
        const text = isLoss ? `${t.lossAs}: ${lossLabel}` : `${i + 1}. ${evLabel(i)}`;
        const time = !isLoss && C.events[i].time && ctx.show('all') ? C.events[i].time : '';
        const b = nodeBox(i);
        let chipNode, timeNode = null, timeBox = null;
        if (hor) {
          const cx = b.x + b.w / 2;
          let ty = groundY + 16;
          if (time) {
            const ft = ctx.fit(time, {maxWidth: slot - 16, size: 25, minSize: 20, maxLines: 1, weight: 600, family: 'mono'});
            timeNode = textBlock(ft, {x: cx, y: ty, anchor: 'middle', fill: th.fgSoft});
            timeBox = {x: cx - ft.width / 2, y: ty, w: ft.width, h: ft.height};
            ty += ft.height + 10;
          } else ty += 6;
          // the loss sits at the end of the axis: its label may grow to the right (never
          // into its neighbour's column)
          if (isLoss) {
            const x0 = cx - (slot - 14) / 2;
            const mw = Math.max(slot - 14, Math.min(slot + 60, D.w - margin * 0.5 - x0));
            const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: SH.size, maxLines: 5});
            const cxL = Math.max(cx, x0 + probe.box.w / 2);
            chipNode = chip(ctx, text, {x: cxL, y: ty, anchor: 'middle', maxWidth: mw, size: SH.size, maxLines: 5, fill: th.accent3Soft, stroke: th.accent3});
          } else chipNode = chip(ctx, text, {x: cx, y: ty, anchor: 'middle', maxWidth: slot - 14, size: SH.size, maxLines: 5, fill: th.card, stroke: th.accent2});
        } else {
          const right = axisX - Math.max(tokW, lossW + 30) / 2 - 26;
          const mw = right - margin + 10;
          // (block heights were planned with this width, see the vertical geometry)
          const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: SH.size, maxLines: 5});
          const fitTime = time ? ctx.fit(time, {maxWidth: mw, size: 23, minSize: 18, maxLines: 1, weight: 600, family: 'mono'}) : null;
          const blockH = probe.box.h + (fitTime ? fitTime.height + 6 : 0);
          const top = b.y + b.h / 2 - blockH / 2;
          if (fitTime) { timeNode = textBlock(fitTime, {x: right - 4, y: top, anchor: 'end', fill: th.fgSoft}); timeBox = {x: right - 4 - fitTime.width, y: top, w: fitTime.width, h: fitTime.height}; }
          chipNode = chip(ctx, text, {x: right, y: top + (fitTime ? fitTime.height + 6 : 0), anchor: 'end', maxWidth: mw, size: SH.size, maxLines: 5, fill: isLoss ? th.accent3Soft : th.card, stroke: isLoss ? th.accent3 : th.accent2});
        }
        labels.push(g({name: `lab${i}`, opacity: 0}, timeNode, chipNode.node));
        labelBoxes[i] = chipNode.box;
        if (timeBox) labelBoxes.push(timeBox);
      }
    }

    // ---- chain links as arcs between neighbours
    const anchorOut = i => {
      const b = nodeBox(i);
      return hor ? {x: b.x + b.w * 0.78, y: b.y - 6} : {x: b.x + b.w + 8, y: b.y + b.h * 0.72};
    };
    const anchorIn = i => {
      const b = nodeBox(i);
      return hor ? {x: b.x + b.w * 0.22, y: b.y - 6} : {x: b.x + b.w + 8, y: b.y + b.h * 0.28};
    };
    const hasAlt = i => C.alternatives.some(a => a.link === i);
    const links = C.links.map((l, i) => {
      const from = anchorOut(i), to = anchorIn(i + 1);
      // descending arc: it rises out of the higher token and drops into the lower one
      const gw = hor ? gapOf(i) : slot;
      const c1 = hor ? {x: from.x + gw * 0.16, y: from.y - bulge} : {x: from.x + bulge, y: from.y + slot * 0.1};
      const c2 = hor ? {x: to.x - gw * 0.16, y: Math.min(from.y, to.y) - bulge * 0.85} : {x: to.x + bulge, y: to.y - slot * 0.1};
      const conn = connector(ctx, {name: `link${i}`, from, to, c1, c2, kind: linkStyle(l), color: linkColor(l)});
      const pts = Array.from({length: 41}, (_, q) => conn.at(q / 40));
      const apex = hor ? pts.reduce((a, b) => (b.y < a.y ? b : a)) : pts.reduce((a, b) => (b.x > a.x ? b : a));
      const mid = conn.at(0.5);
      let lab = null;
      if (ctx.show('all')) {
        const text = linkText(l);
        if (hor) {
          const mw = Math.min(gapOf(i), slot * 1.6) * 0.96;
          const probe = bchip(text, {x: 0, y: 0, maxWidth: mw, size: SH.chip, maxLines: 4});
          lab = bchip(text, {x: apex.x, y: apex.y - 18 - probe.box.h, anchor: 'middle', maxWidth: mw, size: SH.chip, maxLines: 4, fill: th.card, stroke: linkColor(l), name: `link${i}-lab`});
        } else {
          // beside an alternative, the caption keeps clear of the barrier at the right edge
          const mw = rx1v - rx0v - (hasAlt(i) ? Math.min(140, D.w * 0.14) + 26 : 0);
          const probe = bchip(text, {x: 0, y: 0, maxWidth: mw, size: SH.chip, maxLines: 4});
          // a link carrying an alternative keeps the air right of its "?" free for the relation
          const y = hasAlt(i) ? mid.y - 22 - probe.box.h : apex.y - probe.box.h / 2;
          lab = bchip(text, {x: rx0v, y, anchor: 'start', maxWidth: mw, size: SH.chip, maxLines: 4, fill: th.card, stroke: linkColor(l), name: `link${i}-lab`});
        }
      }
      // "?" badge for disputed links, at the middle of the arc (text only when labels are on)
      const badge = l.status === 'disputed'
        ? g({name: `link${i}-q`, opacity: 0, transform: T(mid.x, mid.y)},
          h('circle', {r: 17, fill: th.card, stroke: th.accent3, 'stroke-width': 3.5, 'stroke-dasharray': '5 4'}),
          ctx.show('key') ? h('text', {x: 0, y: 7.5, 'text-anchor': 'middle', 'font-size': 21, 'font-weight': 800, 'font-family': FONT, fill: th.accent3}, '?') : null)
        : null;
      return {l, conn, lab, badge, apex: mid, top: apex, style: linkStyle(l), arrow: l.status !== 'disputed'};
    });

    // ---- alternatives: a barrier with its sign, tied to its link's "?" by a plain relation
    const alts = new Array(C.alternatives.length);
    if (hor) {
      for (const ap of altPlan) {
        const j = ap.j;
        const lk = links[ap.i];
        const xg = clamp(lk.apex.x, ap.x - ap.w / 2 + Math.max(ap.bw, ap.chipW) / 2, ap.x + ap.w / 2 - Math.max(ap.bw, ap.chipW) / 2);
        const base = {x: xg, y: groundY};
        const lab = ctx.show('key') ? bchip(altText(j), {x: xg, y: groundY - ap.bh - 14 - ap.chipH, anchor: 'middle', maxWidth: Math.max(120, ap.w), size: SH.chip * 0.92, maxLines: 8, fill: th.accentSoft, stroke: th.accent}) : null;
        const top = {x: xg, y: groundY - ap.bh - 2};
        const q = {x: lk.apex.x, y: lk.apex.y + 19};
        const elbowY = (lab ? lab.box.y : top.y) - 14;
        const pts = Math.abs(q.x - xg) < 1.5 ? [top, q] : [top, {x: xg, y: elbowY}, {x: q.x, y: elbowY}, q];
        const rel = relPath(ctx, {name: `altrel${j}`, pts, color: relColor});
        const box = {x: xg - ap.bw / 2, y: groundY - ap.bh, w: ap.bw, h: ap.bh};
        const node = g({name: `alt${j}`, opacity: 0}, g({name: `alt${j}-body`}, g({transform: T(base.x, base.y)}, barrierArt(ctx, {name: `alt${j}-art`, w: ap.bw, h: ap.bh}))), lab && lab.node);
        alts[j] = {a: C.alternatives[j], box, base, rel, node, lab, mode: 'gap', relColor, center: {x: xg, y: groundY - ap.bh / 2}};
      }
    } else {
      // right column: each barrier at the right edge, level with its link's "?", so the plain
      // relation runs straight across onto the badge; its sign hangs below it, clear of the
      // link caption above (the gap was stretched for it)
      const bw = Math.min(140, D.w * 0.14), bh = bw * 0.62;
      const nextY = {};
      C.alternatives.forEach((a, j) => {
        const lk = links[a.link];
        const cy = lk.apex.y;
        // the barrier stands just beyond its link's caption (not at the far edge of a wide box)
        const mwA = rx1v - rx0v - bw - 20;
        const altW = ctx.show('key') ? bchip(altText(j), {x: 0, y: 0, maxWidth: mwA, size: SH.chip, maxLines: 6}).box.w : 0;
        const capW = lk.lab ? lk.lab.box.w : 0;
        const right = Math.min(rx1v, rx0v + Math.max(capW + bw + 40, altW + 10, bw + 150));
        const bx = right - bw / 2 - 6;
        const base = {x: bx, y: cy + bh / 2};
        let lab = null;
        const box = {x: base.x - bw / 2, y: base.y - bh, w: bw, h: bh};
        const top = nextY[a.link] ?? base.y + 12;
        if (ctx.show('key')) {
          lab = bchip(altText(j), {x: right, y: top, anchor: 'end', maxWidth: mwA, size: SH.chip, maxLines: 6, fill: th.accentSoft, stroke: th.accent});
          nextY[a.link] = lab.box.y + lab.box.h + 14;
        }
        const from = {x: box.x - 6, y: cy};
        const target = {x: lk.apex.x + 19, y: cy};
        const rel = relPath(ctx, {name: `altrel${j}`, pts: [from, target], color: relColor});
        const node = g({name: `alt${j}`, opacity: 0}, g({name: `alt${j}-body`}, g({transform: T(base.x, base.y)}, barrierArt(ctx, {name: `alt${j}-art`, w: bw, h: bh}))), lab && lab.node);
        alts[j] = {a, box, base, rel, node, lab, mode: 'column', relColor, center: {x: base.x, y: base.y - bh / 2}};
      });
    }

    // ---- extra relationships between components (edge-anchored, kind-styled)
    const boxOf = id => {
      if (id === 'loss') return nodeBox(n);
      if (id.startsWith('e')) {
        const i = Number(id.slice(1)) - 1;
        return i < n ? nodeBox(i) : null;
      }
      const j = Number(id.slice(3)) - 1;
      return alts[j] ? (alts[j].lab && alts[j].mode === 'gap' ? unionBox(alts[j].box, alts[j].lab.box) : alts[j].box) : null;
    };
    const sample = (c, k2 = 16) => Array.from({length: k2 + 1}, (_, q) => c.at(q / k2));
    const busy = [
      ...labelBoxes.filter(Boolean), ...alts.flatMap(a => [a.box, a.lab && a.lab.box]).filter(Boolean),
      ...Array.from({length: N}, (_, i) => nodeBox(i)), ...links.map(lk => lk.lab && lk.lab.box).filter(Boolean),
      ...alts.flatMap(a => segPolys(sample(a.rel), 8)), ...links.flatMap(lk => segPolys(sample(lk.conn), 8)),
    ];
    const extras = p.relationships.map((rel, i) => {
      const A = boxOf(rel.from), B = boxOf(rel.to);
      if (!A || !B || rel.from === rel.to) return null;
      const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
      const altEnd = [rel.from, rel.to].find(id => id.startsWith('alt'));
      const evEnd = [rel.from, rel.to].find(id => id === 'loss' || /^e\d$/.test(id));
      const evI = evEnd ? (evEnd === 'loss' ? n : Number(evEnd.slice(1)) - 1) : null;
      const al = altEnd ? alts[Number(altEnd.slice(3)) - 1] : null;
      let conn;
      if (hor && rel.kind === 'relation' && al && al.mode === 'gap' && evI !== null && labelBoxes[evI]) {
        // on the cascade: from the barrier's foot down through the ground axis and across
        // to the event's own label — clear of the arcs, the steps and the sign
        const ev = labelBoxes[evI];
        const lowY = Math.max(...labelBoxes.filter(Boolean).map(b => b.y + b.h)) + 26;
        const adjacent = evI === al.a.link || evI === al.a.link + 1;
        const side = ev.x + ev.w / 2 > al.base.x ? 1 : -1;
        const pts0 = adjacent
          ? [{x: al.base.x, y: groundY + 6}, {x: al.base.x, y: ev.y + ev.h / 2}, {x: side > 0 ? ev.x - 6 : ev.x + ev.w + 6, y: ev.y + ev.h / 2}]
          : [{x: al.base.x, y: groundY + 6}, {x: al.base.x, y: lowY}, {x: ev.x + ev.w / 2, y: lowY}, {x: ev.x + ev.w / 2, y: ev.y + ev.h + 6}];
        conn = relPath(ctx, {name: `rel${i}`, pts: rel.from === altEnd ? pts0 : pts0.slice().reverse(), color: kindColor(ctx, rel.kind)});
      } else if (!hor && rel.kind === 'relation' && al && evI !== null) {
        // vertical axis: down from the alternative's sign through its caption (hung just
        // below the sign), along the corridor left of the right column, then straight
        // across at the event's mid-height (between the arcs that leave and enter it)
        const tb = nodeBox(evI);
        const ye = tb.y + tb.h / 2, xe = tb.x + tb.w + 10;
        const src = al.lab ? al.lab.box : al.box;
        const xc = rx0v - 14;
        const text = rel.label || p.relationLabels[rel.kind] || rel.kind;
        const probe = ctx.show('all') ? bchip(text, {x: 0, y: 0, maxWidth: 300, size: SH.chip * 0.9, maxLines: 3}).box : {w: 0, h: 0};
        const lx = clamp(rx0v + probe.w / 2, src.x + 14, src.x + src.w - 14);
        const ly = src.y + src.h + 22 + (al.relY || 0);
        al.relY = (al.relY || 0) + probe.h + 22;
        const lcy = ly + probe.h / 2;
        const pts0 = [{x: lx, y: src.y + src.h + 2}, {x: lx, y: lcy}, {x: xc, y: lcy}, {x: xc, y: ye}, {x: xe, y: ye}];
        conn = relPath(ctx, {name: `rel${i}`, pts: rel.from === altEnd ? pts0 : pts0.slice().reverse(), color: kindColor(ctx, rel.kind)});
        conn.fixedLabel = {x: lx, y: ly};
      } else {
        const from = edgeAnchor(A, cb, 10), to = edgeAnchor(B, ca, rel.kind === 'relation' ? 10 : 16);
        conn = connector(ctx, {name: `rel${i}`, from, to, kind: rel.kind, bend: hor ? 0.28 : -0.28, color: kindColor(ctx, rel.kind)});
      }
      let lab = null;
      if (ctx.show('all')) {
        const text = rel.label || p.relationLabels[rel.kind] || rel.kind;
        const probe = bchip(text, {x: 0, y: 0, maxWidth: 300, size: SH.chip * 0.9, maxLines: 3}).box;
        const own = segPolys(sample(conn), 8);
        const mid = conn.at(0.5);
        const bnd = {x: margin * 0.5, y: -D.h, w: D.w - margin, h: 3 * D.h};
        const po = {obstacles: [...busy, ...own], bounds: bnd, noLeader: true, pad: 4, gaps: [4, 14, 28, 46, 70, 100, 140, 190], order: ['below', 'above', 'right', 'left', 'belowR', 'belowL', 'aboveR', 'aboveL']};
        const res = conn.fixedLabel || placeChip(probe, mid, po) || placeChip(probe, mid, {...po, leastBad: true});
        lab = bchip(text, {x: res.x, y: res.y, anchor: 'middle', maxWidth: 300, size: SH.chip * 0.9, maxLines: 3, fill: th.card, stroke: kindColor(ctx, rel.kind), name: `rel${i}-lab`});
        busy.push(lab.box);
      }
      return {rel, conn, lab};
    }).filter(Boolean);

    // ---- tracer route in traversal order
    const posOf = id => {
      if (id === 'loss') return {kind: 'node', i: n};
      if (id.startsWith('e')) {
        const i = Number(id.slice(1)) - 1;
        return i < n ? {kind: 'node', i} : null;
      }
      const j = Number(id.slice(3)) - 1;
      return alts[j] ? {kind: 'alt', j} : null;
    };
    const topOf = q => (q.kind === 'node' ? (() => { const b = nodeBox(q.i); return hor ? {x: b.x + b.w / 2, y: b.y - 6} : {x: b.x + b.w + 8, y: b.y + b.h / 2}; })() : alts[q.j].center);
    const order = p.traversalOrder.filter(id => posOf(id));
    const pts = [];
    const visits = [];
    const push = (conn, fwd, a = 0, b = 1) => { for (let q = 0; q <= 40; q++) { const tt = a + (b - a) * (q / 40); pts.push(conn.at(fwd ? tt : 1 - tt)); } };
    order.forEach((id, k2) => {
      const q = posOf(id);
      if (k2 === 0) {
        pts.push(topOf(q));
        visits.push({id, idx: 0});
        return;
      }
      const prevId = order[k2 - 1];
      const pq = posOf(prevId);
      const altQ = q.kind === 'alt' ? q : pq.kind === 'alt' ? pq : null;
      const nodeQ = q.kind === 'node' ? q : pq.kind === 'node' ? pq : null;
      const al = altQ && alts[altQ.j];
      if (pq.kind === 'node' && q.kind === 'node' && Math.abs(pq.i - q.i) === 1) {
        push(links[Math.min(pq.i, q.i)].conn, q.i > pq.i);
      } else if (al && nodeQ && (al.a.link === nodeQ.i || al.a.link + 1 === nodeQ.i)) {
        // along the link's arc to its "?", then along the relation to the alternative (or back)
        const lk = links[al.a.link];
        const fromStart = nodeQ.i === al.a.link;
        if (q.kind === 'alt') { push(lk.conn, fromStart, 0, 0.5); push(al.rel, false); }
        else { push(al.rel, true); push(lk.conn, !fromStart, 0.5, 1); }
      } else {
        const ex = extras.find(x => (x.rel.from === prevId && x.rel.to === id) || (x.rel.from === id && x.rel.to === prevId));
        if (ex) push(ex.conn, ex.rel.from === prevId);
        else { pts.push(topOf(pq)); pts.push(topOf(q)); }
      }
      pts.push(topOf(q));
      visits.push({id, idx: pts.length - 1});
    });
    const route = polyline(pts.length > 1 ? pts : [pts[0] || axisStart, pts[0] || axisEnd]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / total}));
    const linkT = links.map((lk, i) => {
      const a = i === n - 1 ? 'loss' : `e${i + 2}`;
      const b = `e${i + 1}`;
      for (let k2 = 1; k2 < visitT.length; k2++) {
        const pair = [visitT[k2 - 1].id, visitT[k2].id];
        if ((pair[0] === b && pair[1] === a) || (pair[0] === a && pair[1] === b)) return (visitT[k2 - 1].t + visitT[k2].t) / 2;
      }
      return null;
    });

    // ---- extents of the drawing (header and legend go above / below it)
    const arcBoxes = links.map(lk => boundsOfPts(sample(lk.conn, 24)));
    const content = unionBox(...Array.from({length: N}, (_, i) => nodeBox(i)), ...labelBoxes.filter(Boolean), ...links.map(lk => lk.lab && lk.lab.box).filter(Boolean),
      ...alts.flatMap(a => [a.box, a.lab && a.lab.box]).filter(Boolean), ...extras.map(x => x.lab && x.lab.box).filter(Boolean), ...arcBoxes,
      hor ? {x: axisStart.x, y: groundY - 10, w: axisLen, h: 20} : {x: axisX - 10, y: axisStart.y - 40, w: 20, h: axisLen + 40});
    const kinds = ['axis', ...new Set(links.map(x => x.style).concat(extras.map(x => x.rel.kind)).concat(alts.length ? ['relation'] : []))];
    const legendLabels = {...p.relationLabels, disputed: p.relationLabels.disputed || t.disputed, axis: t.supplied};
    const header = ctx.show('key') ? statusTag(ctx, t.proposedChain, {x: 0, y: 0, size: 28, maxWidth: D.w - margin, name: 'header', color: th.accent2, opacity: 0}) : null;
    let legend = null, legendBox = null, headerAt = null;
    if (hor) {
      // one band above the cascade: header left, legend right (it wraps when needed)
      const headerW = header ? header.box.w + 40 : 0;
      const lw = D.w - margin - headerW;
      const rows = ctx.show('all') ? legendRows(ctx, kinds, legendLabels, lw) : 0;
      const bandH = Math.max(header ? header.box.h : 0, rows * 25 * 1.6);
      const bandY = content.y - 26 - bandH;
      headerAt = {x: margin * 0.5, y: bandY};
      if (ctx.show('all')) {
        legend = legendNode(ctx, kinds, legendLabels, {x: D.w - margin * 0.5, y: bandY + 14, align: 'right', down: true}, lw);
        legendBox = {x: D.w - margin * 0.5 - lw, y: bandY, w: lw, h: rows * 25 * 1.6};
      }
    } else {
      headerAt = {x: margin * 0.5, y: axisStart.y - 110};
      if (ctx.show('all')) {
        const lw = (D.w - margin * 2) * SH.legendMax;
        const rows = legendRows(ctx, kinds, legendLabels, lw);
        const ly = content.y + content.h + 30 + (rows - 1) * 25 * 1.6;
        legend = legendNode(ctx, kinds, legendLabels, {x: D.w / 2, y: ly}, lw);
        legendBox = {x: margin, y: ly - (rows - 1) * 40 - 20, w: D.w - 2 * margin, h: (rows - 1) * 40 + 40};
      }
    }
    const headerNode = header ? g({transform: T(headerAt.x, headerAt.y)}, header.node) : null;
    const all = unionBox(content, legendBox, header && {x: headerAt.x, y: headerAt.y, w: header.box.w, h: header.box.h}, {x: headerAt.x, y: headerAt.y, w: 1, h: 1});
    // fit the whole drawing into the design space (never outside the caption-safe box)
    const pad = 8;
    const fs = Math.min(1, (D.w - 2 * pad) / all.w, (D.h - 2 * pad) / all.h);
    const fx = (D.w - all.w * fs) / 2 - all.x * fs;
    const fy = (D.h - all.h * fs) / 2 - all.y * fs;
    return {fit: {s: fs, x: fx, y: fy}, axisLen, hor, n, P, tokens, steps, lossNode, lossArtNode, axisNode, axisCaption, labels, links, alts, extras, route, visitT, linkT, header, headerNode, legend, centerOf, nodeBox, slot, axisStart, groundY};
  },
  build(ctx, L) {
    return g({transform: `translate(${r(L.fit.x)} ${r(L.fit.y)}) scale(${r(L.fit.s, 5)})`},
      L.headerNode,
      L.axisCaption && L.axisCaption.node,
      g({name: 'steps'}, L.steps),
      L.axisNode,
      L.extras.map(x => x.conn.node),
      L.alts.map(a => a.rel.node),
      L.links.map(x => x.conn.node),
      L.tokens.map(tk => tk.node),
      L.lossNode,
      L.labels,
      L.alts.map(a => a.node),
      L.links.map(x => x.badge),
      L.links.map(x => x.lab && x.lab.node),
      L.extras.map(x => x.lab && x.lab.node),
      tracer(ctx, 'tracer'),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const nodes = {};
    const n = L.n;

    // 1) separate: axis draws; the tokens take their places in the supplied order, each one
    // set down onto its own step from just above it (no token passes through another)
    const axisP = ease.inOutCubic(seg(u, 0, 0.12));
    nodes['axis-line'] = {'stroke-dashoffset': r(L.axisLen * (1 - axisP))};
    nodes['axis-head'] = {opacity: axisP >= 0.98 ? 1 : 0};
    if (L.axisCaption) nodes['axis-cap'] = {opacity: r(seg(u, 0.02, 0.08), 3)};
    nodes.steps = {opacity: r(seg(u, 0, 0.05), 3)};
    const tokPos = [];
    for (let i = 0; i < n; i++) {
      const st0 = 0.02 + i * (0.1 / Math.max(1, n));
      const pr = seg(u, st0, st0 + 0.05);
      const target = L.centerOf(i);
      const lift = reduced ? 0 : 70 * (1 - ease.outCubic(pr));
      const q = {x: target.x, y: target.y - lift};
      tokPos.push({pr, d: {x: 0, y: q.y - target.y}, q, op: clamp(pr * 2.5)});
    }
    // 2) relate: links draw in supplied order; alternatives and extras afterwards
    const nl = L.links.length;
    const linkP = L.links.map((_, i) => ease.inOutCubic(seg(u, 0.18 + (i * 0.2) / nl, 0.18 + ((i + 1) * 0.2) / nl)));
    L.links.forEach((lk, i) => {
      Object.assign(nodes, lk.conn.frame(linkP[i], linkP[i] > 0 ? 1 : 0));
      if (lk.lab) nodes[`link${i}-lab`] = {opacity: r(clamp((linkP[i] - 0.6) / 0.4), 3)};
    });
    const altP = ease.inOutCubic(seg(u, 0.38, 0.43));
    L.alts.forEach((al, j) => {
      nodes[`alt${j}`] = {opacity: r(seg(u, 0.12, 0.18), 3)};
      Object.assign(nodes, al.rel.frame(altP, altP > 0 ? 1 : 0));
    });
    const exP = ease.inOutCubic(seg(u, 0.38, 0.43));
    L.extras.forEach((ex, i) => {
      Object.assign(nodes, ex.conn.frame(exP, exP > 0 ? 1 : 0));
      if (ex.lab) nodes[`rel${i}-lab`] = {opacity: r(clamp((exP - 0.6) / 0.4), 3)};
    });

    // 3) trace
    const tp = ease.inOutSine(seg(u, 0.44, 0.74));
    const tracerOn = u >= 0.43 && u < 0.77;
    const tpos = L.route.at(tp);
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const visited = new Set(u >= 0.74 ? L.visitT.map(v => v.id) : (u >= 0.44 ? L.visitT.filter(v => tp >= v.t - 1e-6).map(v => v.id) : []));
    const pulseAt = vt => (vt === null || vt === undefined || !tracerOn ? 0 : clamp(1 - Math.abs(tp - vt) / 0.09));
    const focus = p.focusElement;
    const scaleFor = (id, vt) => 1 + (id === focus ? (reduced ? 0.12 : 0.24) : (reduced ? 0.03 : 0.07)) * ease.inOutSine(pulseAt(vt));
    const visitOf = id => (L.visitT.find(v => v.id === id) || {}).t;
    for (let i = 0; i < n; i++) {
      const id = `e${i + 1}`;
      const b = L.nodeBox(i);
      const k = scaleFor(id, visitOf(id));
      const tk = tokPos[i];
      nodes[`tok${i}`] = {transform: T(tk.d.x, tk.d.y), opacity: r(tk.op, 3)};
      nodes[`tok${i}-body`] = {transform: scaleAbout(b.x + b.w / 2, L.hor ? b.y + b.h : b.y + b.h / 2, k)};
      nodes[`tok${i}-glow`] = {opacity: visited.has(id) ? 0.9 : 0};
      nodes[`tick${i}`] = {opacity: r(tk.pr, 3)};
      if (L.labels[i]) nodes[`lab${i}`] = {opacity: r(clamp((tk.pr - 0.5) * 2), 3)};
    }
    const lb = L.nodeBox(n);
    const lossAppear = seg(u, 0.1, 0.16);
    nodes.lossnode = {opacity: r(lossAppear, 3)};
    nodes[`tick${n}`] = {opacity: r(lossAppear, 3)};
    if (L.labels[n]) nodes[`lab${n}`] = {opacity: r(lossAppear, 3)};
    nodes['lossnode-body'] = {transform: scaleAbout(lb.x + lb.w / 2, L.hor ? lb.y + lb.h : lb.y + lb.h / 2, scaleFor('loss', visitOf('loss')))};
    const lossReached = visited.has('loss');
    const lossVt = visitOf('loss');
    const crackP = lossVt === undefined ? 0 : (u >= 0.74 ? 1 : (tracerOn ? clamp((tp - lossVt + 0.001) / 0.04) : 0));
    nodes['lossnode-art-crack'] = {'stroke-dashoffset': r(L.lossArtNode.crackLen * (1 - ease.outCubic(crackP)))};
    nodes['lossnode-art-crackg'] = {opacity: r(clamp((crackP - 0.5) * 2), 3)};
    nodes['lossnode-glow'] = {opacity: lossReached ? 0.9 : 0};
    L.alts.forEach((al, j) => {
      const id = `alt${j + 1}`;
      nodes[`alt${j}-body`] = {transform: scaleAbout(al.center.x, al.center.y, scaleFor(id, visitOf(id)))};
    });
    // focus on a link: stroke thickens and its label grows while the tracer passes
    L.links.forEach((lk, i) => {
      const id = `link${i + 1}`;
      const pul = pulseAt(L.linkT[i]);
      const k = 1 + (id === focus ? (reduced ? 0.15 : 0.3) : 0.06) * ease.inOutSine(pul);
      const baseW = lk.style === 'causal' ? 5 : lk.style === 'disputed' ? 3.5 : 3.5;
      nodes[`link${i}-line`] = {...nodes[`link${i}-line`], 'stroke-width': r(baseW * (id === focus ? 1 + 0.9 * ease.inOutSine(pul) : 1), 2)};
      if (lk.lab) nodes[`link${i}-lab`] = {...nodes[`link${i}-lab`], transform: scaleAbout(lk.lab.box.cx, lk.lab.box.cy, k)};
      if (lk.badge) nodes[`link${i}-q`] = {opacity: linkP[i] >= 1 ? 1 : 0, transform: `${T(lk.apex.x, lk.apex.y)} scale(${r(k, 4)})`};
    });
    // 4) gather
    if (L.header) nodes.header = {opacity: r(seg(u, 0.03, 0.09), 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, 0.76, 0.84), 3)};

    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const ends = L.links.map((lk, i) => {
      const a = L.nodeBox(i), b = L.nodeBox(i + 1);
      const inBox = (q, bx, pad) => q.x >= bx.x - pad && q.x <= bx.x + bx.w + pad && q.y >= bx.y - pad && q.y <= bx.y + bx.h + pad;
      return inBox(lk.conn.from, a, 12) && inBox(lk.conn.to, b, 12);
    });
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        relationsDrawn: linkP.map(v => r(v, 3)),
        linkStyles: L.links.map(lk => lk.style),
        arrowheads: L.links.map(lk => lk.arrow && linkP[L.links.indexOf(lk)] >= 0.985),
        extraKinds: L.extras.map(x => x.rel.kind),
        linkEnds: ends,
        visitOrder: L.visitT.map(v => v.id),
        visited: [...visited],
        lossCracked: r(crackP, 3),
        focus,
        tokens: tokPos.map(tk => ({x: r(tk.q.x), y: r(tk.q.y)})),
        tok0: {x: r(tokPos[0].q.x), y: r(tokPos[0].q.y)},
        tokLast: {x: r(tokPos[n - 1].q.x), y: r(tokPos[n - 1].q.y)},
        // an alternative is tied to its link by a plain relation: never the causal colour
        altRelationColors: L.alts.map(a => a.relColor),
        causalColor: ctx.theme.accent,
        altModes: L.alts.map(a => a.mode),
      },
    };
  },
};

/** Union bounds of boxes (null entries ignored). */
function unionBox(...list) {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}

/** Bounds of sampled points. */
function boundsOfPts(pts) {
  const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
  return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
}

/**
 * Plain relation drawn as a polyline (straight runs, no arrowhead) with the
 * same frame contract as primitives/annotate.js connector().
 */
function relPath(ctx, {name, pts, color}) {
  const poly = polyline(pts);
  const total = poly.total;
  const d = poly.d(2);
  const from = pts[0], to = pts[pts.length - 1];
  const node = g({name},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: r(from.x), cy: r(from.y), r: 4.8, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(to.x), cy: r(to.y), r: 4.8, fill: color, opacity: 0}));
  const frame = (pp, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - pp))},
    [`${name}-dotA`]: {opacity: pp > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: pp >= 0.985 ? 1 : 0},
  });
  return {node, frame, at: tt => poly.at(tt), total, mid: poly.at(0.5), from, to};
}

/** Number of legend rows (mirrors legendNode's wrapping). */
function legendRows(ctx, kinds, labels, maxW) {
  const widths = kinds.map(k => 70 + ctx.measure(labels[k] || k, 25, 500, 'sans'));
  let rows = 1, wsum = 0;
  widths.forEach((w, i) => {
    if (i && wsum + 40 + w > maxW) { rows++; wsum = w; } else wsum += (i ? 40 : 0) + w;
  });
  return rows;
}

function legendNode(ctx, kinds, labels, at, maxW) {
  const th = ctx.theme;
  const size = 25;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const gap = 40;
  // wrap into rows (bottom-anchored at `at.y`)
  const rows = [];
  let cur = [], wsum = 0;
  items.forEach((it, i) => {
    if (cur.length && wsum + gap + widths[i] > maxW) { rows.push(cur); cur = []; wsum = 0; }
    wsum += (cur.length ? gap : 0) + widths[i];
    cur.push(i);
  });
  if (cur.length) rows.push(cur);
  const lineH = size * 1.6;
  const parts = [];
  rows.forEach((row, ri) => {
    const total = row.reduce((a, i) => a + widths[i], 0) + gap * (row.length - 1);
    let x = at.align === 'right' ? at.x - total : at.x - total / 2;
    const y = at.down ? at.y + ri * lineH : at.y - (rows.length - 1 - ri) * lineH;
    for (const i of row) {
      const it = items[i];
      const color = it.k === 'disputed' ? th.accent3 : it.k === 'axis' ? th.fgSoft : kindColor(ctx, it.k);
      const dash = it.k === 'communication' ? '10 8' : it.k === 'disputed' ? '4 8' : null;
      const arrow = it.k !== 'relation' && it.k !== 'disputed';
      parts.push(g({transform: T(x, y)},
        h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' || it.k === 'axis' ? 5 : 3.5, 'stroke-dasharray': dash, 'stroke-linecap': 'round'}),
        arrow ? h('path', {d: 'M58 0l-14 -8l3 8l-3 8z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
        arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
        h('text', {x: 68, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': FONT, fill: th.fg}, it.text)));
      x += widths[i] + gap;
    }
  });
  return g({name: 'legend', opacity: 0}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-01-mechanism',
    title: 'Causal chain — supplied links on an ordered axis',
    titleEs: 'Cadena causal — Mecanismo o relación explicada',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Cadena causal',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded cascade: event tokens stand on descending steps along the axis of supplied order (a vertical axis on square and tall boxes); only the supplied links are drawn as arcs (sequence by default, causal only when supplied, disputed dotted with a “?”), an alternative event stands in the gap of its link tied to it by a plain grey relation, and a tracer follows the traversal order while the focus element enlarges and the loss node cracks only when reached.',
    tags: ['causation', 'chain', 'timeline', 'links', 'sequence', 'causal', 'disputed', 'alternative', 'tracer', 'mechanism'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causal-chain.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CHAIN_STRINGS,
  scene,
});
