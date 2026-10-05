/**
 * LAW-0684 — Cadena causal · inspect
 *
 * Storyboard:
 *  0.00–0.20 build       The state produced by the action: the settled chain
 *                        (tiles leaning on one another in the supplied order,
 *                        urn cracked on its plinth), a link seal at every
 *                        contact point, event labels under the floor.
 *  0.20–0.45 isolate     A lens — a real second copy of the stage drawn at the
 *                        same coordinates — lifts the contact point of ONE
 *                        link (event k → event k+1) out of the dimmed context.
 *  0.45–0.75 substitute  Exactly one datum of that link is replaced inside the
 *                        lens and only its local geometry changes:
 *                          status: proposed → disputed — the two interlocked
 *                                  rings of the seal pull apart, turn dashed and
 *                                  a "?" appears between them (or the reverse);
 *                          kind:   sequence → causal — the thin grey arrow
 *                                  across the contact (on a tab tucked beside
 *                                  the seal, never over its rings) becomes the
 *                                  thick accent arrow (or the reverse).
 *                        A before → after annotation keeps the old value
 *                        traceable (struck through line by line, still
 *                        readable). The lens takes the largest clear spot
 *                        above the chain (it may reach down over the chain's
 *                        low end), up to the requested magnification.
 *  0.75–1.00 return      The lens closes back onto its source; the context seal
 *                        now shows the new datum and a "changed" marker. The
 *                        tiles, the loss and every other link stay untouched.
 * Seeking back before the substitution restores the previous datum exactly.
 * Legal content: the substitution is a supplied datum, not a finding.
 * @module animations/causation/LAW-0684
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {int} from '../../schemas/fields.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {placeChip, packLabels, leaderFrom, segmentHits, hitsAny, boundsOf, unionBounds} from './kits/place.js';
import {lens} from '../../frameworks/lens.js';
import {chainFields, CHAIN_STRINGS, resolveChain, chainStage, fitChainH, chainWidth, wrapExtents, dieFace, tileColor, lossArt} from './kits/causal-chain.js';
import {bodyPoint, DEG} from './kits/topple.js';

const ID = 'LAW-0684';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], tiles: [0.02, 0.14], seals: [0.1, 0.18], labels: [0.05, 0.16],
  open: [0.22, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53], change: [0.5, 0.68], after: [0.62, 0.7],
  close: [0.76, 0.87], ctxUpdate: [0.8, 0.87], marker: [0.87, 0.94],
};
const FONT = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

const sceneSchema = {
  ...chainFields,
  ...inspectFields(['status', 'kind']),
  focusLink: int('Link inspected by the lens: 0 = event 1 → event 2, … (the link after the last event ends at the loss)', 0, 5),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+1 min'},
    {label: 'Display stand shakes', time: 'T+2 min'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  focusTarget: 'status',
  focusLink: 1,
  beforeValue: 'Proposed',
  afterValue: 'Disputed',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
  contextLabels: {context: 'Proposed chain as supplied by Party A', marker: 'Datum changed'},
};

const SHAPES = {
  landscape: {mode: 'row', maxH: 400, size: 27, annW: 620},
  square: {mode: 'row', maxH: 380, size: 29, annW: 480},
  // tall boxes: two levels (landing → lower floor) with a stacked legend, so the
  // stage and the lens both get real size instead of a thin landscape band
  portrait: {mode: 'wrap', maxH: 340, size: 31},
};
const MARGIN = 30;
const SHARDS = 0.3;
const ANN_W = 440; // side annotation column (before → after)
const ANN_SIZE = 30; // before → after chip text size
const DIM = 0.66; // how far the context fades while the lens is open

/** Two-level plan: the split (m tiles on the landing) that allows the tallest tiles in width W. */
function wrapPlan(n, lc, W, maxH) {
  const lowGap = m => (n - m >= 3 ? 0.5 : 0.36);
  const width = (m, H) => {
    const ex = wrapExtents(n, m, H, lc, undefined, lowGap(m));
    return {ex, w: Math.max(ex.row1 + 30, SHARDS * H - ex.row2Left) + ex.reach + 10};
  };
  let best = null;
  for (let m = 1; m < n; m++) {
    let lo = 60, hi = maxH;
    if (width(m, lo).w > W) continue;
    if (width(m, hi).w <= W) lo = hi;
    else for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (width(m, mid).w <= W) lo = mid; else hi = mid; }
    const score = lo - Math.abs(m - n / 2) * 2;
    if (!best || score > best.score) best = {m, H: lo, score};
  }
  return best && {...best, lowGap: lowGap(best.m)};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const shape = ctx.view.shape;
    const SH = SHAPES[shape];
    const C = resolveChain(p);
    const n = C.n;
    const k = Math.min(p.focusLink, n - 1);
    const target = p.focusTarget;
    const lossCount = Math.min(2, p.losses.length);
    const link = C.links[k];
    // before/after data (geometry follows the target; the strings are display values)
    const beforeDisputed = link.status === 'disputed';
    const beforeCausal = link.kind === 'causal';
    const size = SH.size;
    const wrapMode = SH.mode === 'wrap';
    const lossText = `${t.lossAs}: ${p.losses.map(l => l.label).join(' · ')}`;

    // ---- context caption (two lines rather than a shrunken single line)
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: MARGIN, y: 8, maxWidth: D.w - 2 * MARGIN, size: 32, maxLines: 2, name: 'ctx-caption', weight: 600}) : null;
    const capBottom = ctxCap ? 8 + ctxCap.box.h : 0;
    const label = target === 'status' ? t.status : t.kind;
    const annTexts = [`${label}: ${p.beforeValue}`, `${label}: ${p.afterValue}`];
    const linkText = `${t.link} ${k + 1} → ${k + 2 <= n ? k + 2 : t.lossAs}`;
    const tabH = ctx.show('key') ? chip(ctx, linkText, {x: 0, y: 0, maxWidth: 400, size: 26, maxLines: 1}).box.h : 0;
    const lensTop = capBottom + Math.max(16, tabH - 22 + 12);

    // ---- stage plan at tile height H (context and lens copies share it)
    const planFor = maxH => {
      if (wrapMode) {
        const wp = wrapPlan(n, lossCount, D.w - 2 * MARGIN, maxH);
        if (wp) {
          const H = wp.H;
          const ex = wrapExtents(n, wp.m, H, lossCount, undefined, wp.lowGap);
          const l0 = Math.min(-ex.row1 - 30, ex.row2Left - SHARDS * H), r0 = ex.reach + 10;
          const xe = D.w / 2 - (l0 + r0) / 2;
          return {H, x0: xe - ex.row1, floorLeft: xe - ex.row1 - 30, wrap: {m: wp.m, floorLeft: Math.min(xe + ex.row2Left - SHARDS * H, xe - ex.row1 - 30), floorRight: xe + r0, lowGap: wp.lowGap}};
        }
      }
      const H = fitChainH(n, D.w - 2 * MARGIN - SHARDS * maxH, maxH, lossCount);
      const cw = chainWidth(n, H, lossCount);
      const x0 = (D.w - cw - SHARDS * H) / 2;
      return {H, x0, floorLeft: x0 - 40, floorRight: x0 + cw + SHARDS * H, wrap: null};
    };
    const mkStage = (prefix, F, pl) => chainStage(ctx, {prefix, x0: pl.x0, floorY: F, H: pl.H, n, lossCount, links: C.links, start: 0.1, strike: 0.5, floorLeft: pl.floorLeft, floorRight: pl.floorRight, wrap: pl.wrap});

    // ---- event labels: chips hanging from ticks (rows), or a stacked legend with die icons (two levels)
    // stacked legend with die icons (one or more columns): used on tall boxes, and on
    // wide boxes when the labels are too long to hang from ticks under the tiles
    const legendFor = (top, size, cols) => {
      const out = [];
      const boxes = [];
      const iconS = size * 1.5;
      const colGap = 30;
      const colW = (D.w - 2 * MARGIN - (cols - 1) * colGap) / cols;
      const rows = [...C.events.map((e, i) => ({key: `ev${i}`, text: `${i + 1}. ${e.label}`, i})), {key: 'loss', text: lossText, i: -1}];
      const perCol = Math.ceil(rows.length / cols);
      let bottom = top;
      for (let ci = 0; ci < cols; ci++) {
        const x = MARGIN + 6 + ci * (colW + colGap);
        let y = top;
        rows.slice(ci * perCol, (ci + 1) * perCol).forEach(rw => {
          const isLoss = rw.i < 0;
          const mw = colW - iconS - 20;
          const c = chip(ctx, rw.text, {x: 0, y: 0, maxWidth: mw, size, maxLines: 4});
          const rh = Math.max(c.box.h, iconS);
          const c2 = chip(ctx, rw.text, {x: x + iconS + 14, y: y + (rh - c.box.h) / 2, maxWidth: mw, size, maxLines: 4, fill: isLoss ? th.accent3Soft : th.card, stroke: isLoss ? th.accent3 : th.accent2});
          const icon = isLoss
            ? g({transform: T(x + iconS * 0.8, y + (rh + iconS) / 2)}, lossArt(ctx, {name: 'legend-vase', w: iconS * 0.62, h: iconS, kind: 'vase'}).node)
            : g({transform: T(x, y + (rh - iconS) / 2)}, dieFace(ctx, {s: iconS, k: rw.i + 1, fill: tileColor(ctx, rw.i), pip: '#ffffff'}));
          out.push(g({name: `lab-${rw.key}`, opacity: 0}, icon, c2.node));
          boxes.push({x, y, w: c2.box.x + c2.box.w - x, h: rh});
          y += rh + 14;
        });
        bottom = Math.max(bottom, y - 14);
      }
      return {nodes: out, boxes, bottom};
    };
    const labelsFor = (stage, F, size = SH.size) => {
      const out = [];
      if (!ctx.show('key')) return {nodes: out, boxes: [], h: 0};
      const top = stage.floorY2 + 34 + (wrapMode ? 26 : 16);
      if (wrapMode) {
        const lg = legendFor(top, size, 1);
        return {nodes: lg.nodes, boxes: lg.boxes, h: lg.bottom - (stage.floorY2 + 34)};
      }
      const mk = mw => C.events.map((e, i) => ({key: `ev${i}`, text: `${i + 1}. ${e.label}`, x: stage.tiles[i].left + stage.w / 2, mw}));
      let items = mk(stage.spacing - 12);
      const fits = items.every(it => {
        const f = chip(ctx, it.text, {x: 0, y: 0, maxWidth: it.mw, size, maxLines: 3}).fit;
        return !f.truncated && f.size >= size * 0.92;
      });
      if (!fits) items = mk(stage.spacing * 2 - 18);
      items.push({key: 'loss', text: lossText, x: stage.plinth.x + stage.plinth.w / 2, mw: Math.max(stage.plinth.w + 60, 360), loss: true});
      const probes = items.map(it => chip(ctx, it.text, {x: 0, y: 0, maxWidth: it.mw, size, maxLines: 6}));
      // long labels: a legend in columns keeps every word, at a readable size
      if (probes.some(pr => pr.fit.lines.length > 3 || pr.fit.size < size * 0.92)) {
        const lg = legendFor(top + 6, size, ctx.view.shape === 'landscape' ? 3 : 2);
        return {nodes: lg.nodes, boxes: lg.boxes, h: lg.bottom - (stage.floorY2 + 34)};
      }
      // ticks never pass through a chip of a row above their own (see kits/place.js)
      const pk = packLabels(items.map((it, i) => ({x: it.x, w: probes[i].box.w, h: probes[i].box.h})), {y: top, minX: 8, maxX: D.w - 8, gap: 10, rowGap: 10, maxRows: 3});
      const boxes = [];
      items.forEach((it, i) => {
        const cc = chip(ctx, it.text, {x: pk[i].x, y: pk[i].y, maxWidth: it.mw, size, maxLines: 6, fill: it.loss ? th.accent3Soft : th.card, stroke: it.loss ? th.accent3 : th.accent2});
        out.push(g({name: `lab-${it.key}`, opacity: 0}, h('line', {x1: r(it.x), x2: r(it.x), y1: r(stage.floorY2 + 36), y2: r(pk[i].y), stroke: it.loss ? th.accent3 : th.accent2, 'stroke-width': 2, opacity: 0.8}), cc.node));
        boxes.push(cc.box);
      });
      return {nodes: out, boxes, h: Math.max(0, ...pk.map(q => q.bottom)) - (stage.floorY2 + 34)};
    };

    // ---- fit: stage at the bottom, lens + before/after note in the room above it; shrink
    // the tiles until that room holds the note and a lens of at least ~70 % of the zoom
    const zoom0 = p.detailGeometry.zoom;
    const annSideW0 = Math.min(SH.annW ?? ANN_W, D.w * 0.4);
    const annH = w => (ctx.show('key') ? annTexts.map(tx => chip(ctx, tx, {x: 0, y: 0, maxWidth: w, size: ANN_SIZE, maxLines: 4}).box.h).reduce((a, b) => a + b, 0) + 44 : 0);
    const sideNeed = annH(annSideW0) + 8;
    // two levels with long labels: a tighter legend so the stage and the lens keep real size
    let legendSize = SH.size;
    let maxH = SH.maxH;
    let plan, stage, F, labs, fin, settledTop;
    for (let it = 0; it < 14; it++) {
      plan = planFor(maxH);
      stage = mkStage('ctx', 0, plan);
      labs = labelsFor(stage, 0, legendSize);
      if (wrapMode && legendSize > 26 && labs.h > D.h * 0.36) { legendSize = 26; labs = labelsFor(stage, 0, legendSize); }
      const dropH = stage.floorY2 - stage.floorY;
      const bottomRel = dropH + 34 + (wrapMode ? 26 : 16) + labs.h;
      F = D.h - 8 - bottomRel;
      stage = mkStage('ctx', F, plan);
      fin = stage.pose(1);
      settledTop = Math.min(...stage.polygonsAt(1).flatMap(poly => poly.map(q => q.y)), ...fin.semantic.joints.filter(Boolean).map(q => q.y - 30));
      const need = Math.max(0.46 * plan.H * zoom0 * 0.7, sideNeed, wrapMode ? 200 : 150);
      if (settledTop - 30 - lensTop >= need || it === 13) break;
      maxH = plan.H * 0.94;
    }
    labs = labelsFor(stage, F, legendSize);
    const H = plan.H;
    const finCtx = fin;

    // ---- the inspected contact point and its seal (context + lens copies)
    const contact = stage.settledJoint(k);
    // contact normal: across tile k+1's face (or into the loss object)
    const nrm = (() => {
      const nb = stage.bodies[k + 1];
      const ang = finCtx.semantic.angles[k + 1] * DEG;
      const bl = bodyPoint(nb, ang, {x: -nb.w, y: 0}), tl = bodyPoint(nb, ang, {x: -nb.w, y: -nb.h});
      const dx = tl.x - bl.x, dy = tl.y - bl.y, L = Math.hypot(dx, dy) || 1;
      const d = nb.dir ?? 1;
      return {x: (-dy / L) * d, y: (dx / L) * d}; // perpendicular to the face, pointing into tile k+1
    })();
    const sealR = Math.max(16, H * 0.075);
    const seal = prefix => sealArt(ctx, {prefix, R: sealR, nrm, beforeDisputed, beforeCausal, target});
    const ctxSeal = seal('cs');
    const lensSeal = seal('ls');
    // the kind tab beside the context seal (screen coordinates), if any
    const tabPoly = ctxSeal.tabPoly ? ctxSeal.tabPoly.map(q => ({x: contact.x + q.x, y: contact.y + q.y})) : null;

    // ---- settled geometry the lens, the note and the marker must keep clear of
    const polysFin = stage.polygonsAt(1);
    const jointBoxes = finCtx.semantic.joints.map((q, i) => (q && i !== k ? {x: q.x - 26, y: q.y - 26, w: 52, h: 52} : null)).filter(Boolean);
    const landR = stage.wrap ? stage.wrap.xe + 10 : (plan.floorRight ?? stage.right) + 20;
    const floorBoxes = [{x: plan.floorLeft - 10, y: stage.floorY - 30, w: landR - plan.floorLeft + 10, h: 66}, {x: 0, y: stage.floorY2 - 30, w: D.w, h: 66}];
    const plinthBox = {x: stage.plinth.x - 4, y: stage.plinth.top, w: stage.plinth.w + 8, h: stage.plinth.floorY - stage.plinth.top};

    // ---- lens: a real enlarged copy of the stage around the contact, in the room above it
    const regW = Math.max(stage.spacing * 1.15, H * 0.6), regH = H * 0.46;
    let source = {x: contact.x - regW / 2, y: contact.y - regH * 0.52, w: regW, h: regH};
    if (tabPoly) {
      // the region always holds the whole kind tab
      const b = boundsOf(tabPoly);
      const x0 = Math.min(source.x, b.x - 14), y0 = Math.min(source.y, b.y - 14);
      const x1 = Math.max(source.x + source.w, b.x + b.w + 14), y1 = Math.max(source.y + source.h, b.y + b.h + 14);
      source = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
    }
    const zoom = p.detailGeometry.zoom;
    const roomH = Math.max(120, Math.min(settledTop, source.y) - 30 - lensTop);
    const probeAnn = w => annTexts.map(tx => chip(ctx, tx, {x: 0, y: 0, maxWidth: w, size: ANN_SIZE, maxLines: 4}).box);
    const annSideW = Math.min(SH.annW ?? ANN_W, D.w * 0.4);
    let dw = source.w * zoom, dh = source.h * zoom;
    // beside the lens when the box is wide enough; otherwise stacked under it
    const sideAnn = ctx.show('key') ? D.w - 2 * MARGIN - annSideW - 40 >= Math.min(dw, D.w * 0.45) : true;
    const stackH = ctx.show('key') && !sideAnn ? probeAnn(D.w - 2 * MARGIN).reduce((a, b) => a + b.h, 0) + 44 + 20 : 0;
    const maxLensW = (D.w - 2 * MARGIN - (sideAnn && ctx.show('key') ? annSideW + 40 : 0)) * (shape === 'landscape' ? 0.7 : 1);
    const fitK = Math.min(1, maxLensW / dw, (roomH - stackH) / dh);
    dw *= fitK; dh *= fitK;
    const place = p.detailGeometry.placement;
    const blockW = dw + (sideAnn && ctx.show('key') ? 40 + annSideW : 0);
    let bx = contact.x - dw / 2;
    if (place === 'left') bx = MARGIN;
    if (place === 'right') bx = D.w - MARGIN - blockW;
    bx = Math.max(MARGIN, Math.min(D.w - MARGIN - blockW, bx));
    const spareY = Math.max(0, roomH - stackH - dh);
    let dest = {x: bx, y: lensTop + Math.min(spareY * 0.5, 40), w: dw, h: dh};
    // the settled chain is not equally tall everywhere (its low end lies almost flat): a larger
    // lens (+ the note beside it) may reach down to the tiles actually under it rather than stop
    // at the tallest one. Largest clear size wins, then the position nearest the contact.
    let annLeft = false; // the before → after note sits right of the lens, or left of it
    if (place === 'auto' && sideAnn) {
      const ann = ctx.show('key') ? probeAnn(annSideW) : [];
      const annW = ann.length ? Math.max(...ann.map(b => b.w)) : 0;
      const annHt = ann.length ? ann[0].h + 44 + ann[1].h : 0;
      const obs = [...polysFin, ...finCtx.semantic.joints.filter(Boolean).map(q => ({x: q.x - 26, y: q.y - 26, w: 52, h: 52})), ...labs.boxes, ...floorBoxes, plinthBox, source, tabPoly].filter(Boolean);
      const w0 = source.w * zoom, h0 = source.h * zoom;
      const sMax = Math.min(1, maxLensW / w0);
      let best = null;
      for (let s = sMax; s > fitK * 1.1 && !best; s -= 0.02) {
        const w = w0 * s, hh = h0 * s;
        const span = w + (annW ? 40 + annW : 0);
        for (const left of annW ? [false, true] : [false]) {
          for (let bx0 = MARGIN; bx0 <= D.w - MARGIN - span + 0.01; bx0 += 6) {
            const x = left ? bx0 + 40 + annW : bx0;
            const lensBox = {x, y: lensTop, w, h: hh};
            const annBox = annW ? {x: left ? bx0 : x + w + 40, y: lensTop + 8, w: annW, h: annHt} : null;
            if (hitsAny(lensBox, obs, 26) || (annBox && hitsAny(annBox, obs, 18))) continue;
            // the cone lines from the source to the lens must not run through the note
            if (annBox && coneLines(source, lensBox).some(([c1, c2]) => segmentHits(c1, c2, [{x: annBox.x - 20, y: annBox.y - 20, w: annBox.w + 40, h: annBox.h + 40}], 0))) continue;
            const dist = Math.abs(x + w / 2 - contact.x) + (left ? 1 : 0);
            if (!best || dist < best.dist) best = {x, w, h: hh, dist, left};
          }
        }
      }
      if (best) { dw = best.w; dh = best.h; dest = {x: best.x, y: lensTop, w: dw, h: dh}; annLeft = best.left; }
    }
    const lensStage = mkStage('lz', F, plan);
    const finLens = lensStage.pose(1);
    const lensContent = g(null, lensStage.back, lensStage.main, g({transform: T(contact.x, contact.y)}, lensSeal.node));
    // no grey box over the context: the context itself fades (see frame), the lens stays crisp
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, color: th.accent2});

    // ---- single editorial annotation (before → after): beside the lens, or stacked under it
    let beforeChip = null, afterChip = null, strike = null, arrow = null, strikeSegs = [];
    if (ctx.show('key')) {
      if (sideAnn) {
        // right of the lens: left-aligned; left of the lens: right-aligned towards it
        const ax = annLeft ? dest.x - 40 : dest.x + dest.w + 40;
        const mw = annLeft ? Math.min(annSideW, ax - MARGIN) : Math.min(annSideW, D.w - MARGIN - ax);
        const anchor = annLeft ? 'end' : 'start';
        beforeChip = chip(ctx, annTexts[0], {x: ax, y: dest.y + 8, anchor, maxWidth: mw, size: ANN_SIZE, maxLines: 4, fill: th.card, name: 'ann-before'});
        const ay = beforeChip.box.y + beforeChip.box.h + 8;
        const arX = annLeft ? ax - 30 : ax + 30;
        arrow = h('path', {d: `M${r(arX)} ${r(ay)}v26m-9 -10l9 10l9 -10`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
        afterChip = chip(ctx, annTexts[1], {x: ax, y: ay + 36, anchor, maxWidth: mw, size: ANN_SIZE, maxLines: 4, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      } else {
        const cx = dest.x + dest.w / 2;
        const mw = D.w - 2 * MARGIN;
        beforeChip = chip(ctx, annTexts[0], {x: cx, y: dest.y + dest.h + 20, anchor: 'middle', maxWidth: mw, size: ANN_SIZE, maxLines: 4, fill: th.card, name: 'ann-before'});
        const ay = beforeChip.box.y + beforeChip.box.h + 8;
        arrow = h('path', {d: `M${r(cx)} ${r(ay)}v26m-9 -10l9 10l9 -10`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
        afterChip = chip(ctx, annTexts[1], {x: cx, y: ay + 36, anchor: 'middle', maxWidth: mw, size: ANN_SIZE, maxLines: 4, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
      }
      // one strike segment per fitted line of the old value, through that line's x-height
      // (a single line at the chip's centre falls between two wrapped lines and reads as an
      // underline); the chip centres its lines, so each segment spans its own line's width
      const f = beforeChip.fit;
      const top = beforeChip.box.y + ANN_SIZE * 0.38; // chip() padY
      strikeSegs = f.lines.map((ln, i) => {
        const lw = ctx.measure(ln, f.size, f.weight, f.family);
        const y = top + f.size * 0.8 + i * f.lineHeight - f.size * 0.27;
        const x1 = beforeChip.box.cx - lw / 2 - 5, x2 = beforeChip.box.cx + lw / 2 + 5;
        return {x1, x2, y, len: x2 - x1};
      });
      strike = g({name: 'ann-strike'}, strikeSegs.map((s, i) => h('line', {name: `ann-strike${i}`, x1: r(s.x1), x2: r(s.x2), y1: r(s.y), y2: r(s.y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(s.len)} ${r(s.len + 10)}`, 'stroke-dashoffset': r(s.len)})));
    }
    const linkCap = ctx.show('key') ? chip(ctx, linkText, {x: dest.x + 16, y: dest.y - 22, maxWidth: Math.max(dest.w - 32, 200), size: 26, maxLines: 1, fill: th.card, stroke: th.accent2, color: th.accent2, name: 'link-cap'}) : null;

    // ---- changed marker: a callout pinned to the context seal, placed clear of every tile
    const annBoxes = [beforeChip && beforeChip.box, afterChip && afterChip.box].filter(Boolean);
    const markText = p.contextLabels.marker;
    const badgeR = 18;
    const haloR = sealR * 1.55 + 3;
    // the marker belongs to the seal, not to the note: keep it visibly apart from the
    // before → after chips (a marker hugging the after chip reads as a third line of the note)
    const annKeep = annBoxes.map(bx => ({x: bx.x - 14, y: bx.y - 14, w: bx.w + 28, h: bx.h + 40}));
    const markObs = [...polysFin, ...jointBoxes, ...labs.boxes, ...annKeep, ...floorBoxes, plinthBox, tabPoly, ctxCap && ctxCap.box].filter(Boolean);
    const markBounds = {x: 10, y: capBottom + 6, w: D.w - 20, h: D.h - capBottom - 16};
    const markChipAt = (mw, x, y) => chip(ctx, markText, {x, y, maxWidth: mw, size: 26, maxLines: 3, fill: th.card, stroke: th.accent2});
    const sizeOf = c0 => (c0 ? {w: c0.box.w + badgeR * 2 + 10, h: Math.max(c0.box.h, badgeR * 2 + 4)} : {w: badgeR * 2 + 4, h: badgeR * 2 + 4});
    // widest label first; a narrower (2–3 line) label fits the gaps beside a tall tile
    let markW = 360, markChip0 = ctx.show('key') ? markChipAt(360, 0, 0) : null, mSize = sizeOf(markChip0), mres1 = null;
    for (const mw of ctx.show('key') ? [360, 250, 190] : [360]) {
      const c0 = ctx.show('key') ? markChipAt(mw, 0, 0) : null;
      if (c0 && mw < 360 && c0.fit.truncated) break;
      const sz = sizeOf(c0);
      const found = placeChip(sz, {x: contact.x, y: contact.y, r: haloR}, {
        obstacles: markObs, bounds: markBounds, pad: 8, skipEnd: 24,
        order: ['aboveL', 'above', 'aboveR', 'left', 'right', 'leftHigh', 'rightHigh', 'leftLow', 'rightLow', 'belowL', 'belowR', 'below'],
        gaps: [16, 30, 50, 75, 105, 140, 180, 230, 290],
      })
      // tight spots (the seal wedged between the two tiles): the leader may cross the two tiles
      // of the inspected link right next to their seal, never anything else
      || placeChip(sz, {x: contact.x, y: contact.y, r: haloR}, {
        obstacles: markObs, own: [polysFin[k], polysFin[k + 1]], bounds: markBounds, pad: 8, skipEnd: 24,
        order: ['aboveR', 'aboveL', 'above', 'right', 'left', 'rightHigh', 'leftHigh'],
        gaps: [16, 30, 50, 75, 105, 140, 180, 230, 290],
      });
      if (found) { mres1 = found; markW = mw; markChip0 = c0; mSize = sz; break; }
    }
    // no room for the labelled marker by the seal: only the check badge sits by the seal and
    // its label joins the before → after note, tied to the badge by a dashed leader
    const split = !mres1 && Boolean(markChip0) && Boolean(afterChip);
    const bSize = {w: badgeR * 2 + 4, h: badgeR * 2 + 4};
    const bOpts = {obstacles: [...polysFin, ...jointBoxes, ...labs.boxes, ...annBoxes, ...floorBoxes, plinthBox, tabPoly].filter(Boolean), own: [polysFin[k], polysFin[k + 1]], bounds: {x: 10, y: capBottom + 6, w: D.w - 20, h: D.h - capBottom - 16}, pad: 6, skipEnd: 24, gaps: [10, 20, 32, 46, 62, 80, 100]};
    const mres = mres1
      || (split ? placeChip(bSize, {x: contact.x, y: contact.y, r: haloR}, bOpts) || placeChip(bSize, {x: contact.x, y: contact.y, r: haloR}, {...bOpts, leastBad: true}) : null)
      || placeChip(mSize, {x: contact.x, y: contact.y, r: haloR}, {obstacles: [...polysFin, ...jointBoxes, ...labs.boxes, ...annBoxes, tabPoly].filter(Boolean), bounds: {x: 10, y: capBottom + 6, w: D.w - 20, h: D.h - capBottom - 16}, leastBad: true});
    const mbox = mres.box;
    const mend = mres.end;
    const badgeC = {x: mbox.x + badgeR + 2, y: mbox.y + mbox.h / 2};
    let markChip = null;
    if (markChip0 && !split) markChip = markChipAt(markW, mbox.x + badgeR * 2 + 10, mbox.y + (mbox.h - markChip0.box.h) / 2);
    let labelLead = null; // split marker: label → badge
    if (split) {
      // the label goes to the nearest free spot around the badge (2–3 lines if that helps), tied
      // to it by a short leader; only when there is none does it hang under the note, well apart
      const sealBox = {x: contact.x - haloR, y: contact.y - haloR, w: haloR * 2, h: haloR * 2};
      let lres = null;
      for (const mw of [360, 250, 190]) {
        const c0 = markChipAt(mw, 0, 0);
        if (mw < 360 && c0.fit.truncated) break;
        lres = placeChip({w: c0.box.w, h: c0.box.h}, {x: badgeC.x, y: badgeC.y, r: badgeR + 3}, {
          obstacles: [...markObs, sealBox], own: [polysFin[k], polysFin[k + 1]], bounds: markBounds, pad: 8, skipEnd: 6,
          gaps: [14, 26, 42, 60, 85, 115, 150, 190, 240],
        });
        if (lres) { markChip = markChipAt(mw, lres.box.x, lres.box.y); break; }
      }
      if (lres) {
        const lf = leaderFrom(markChip.box, lres.end);
        labelLead = h('line', {x1: r(lf.x), y1: r(lf.y), x2: r(lres.end.x), y2: r(lres.end.y), stroke: th.accent2, 'stroke-width': 2.5});
      } else {
        const a = afterChip.box;
        markChip = chip(ctx, markText, {x: a.x, y: a.y + a.h + 26, maxWidth: Math.max(a.w, 260), size: 26, maxLines: 3, fill: th.card, stroke: th.accent2});
      }
    }
    const mFrom = leaderFrom(mbox, mend);
    const marker = g({name: 'marker', opacity: 0},
      h('line', {x1: r(mFrom.x), y1: r(mFrom.y), x2: r(mend.x), y2: r(mend.y), stroke: th.accent2, 'stroke-width': 2.5}),
      h('circle', {cx: r(mend.x), cy: r(mend.y), r: 5, fill: th.accent2}),
      labelLead,
      markChip && markChip.node,
      h('circle', {cx: r(badgeC.x), cy: r(badgeC.y), r: badgeR, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(badgeC.x)} ${r(badgeC.y - 7)}l7 12.25h-14z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    // after the lens returns, the before → after note stays tied to the changed seal
    let annLead = null;
    if (afterChip) {
      const labelByBadge = split && Boolean(labelLead);
      const a = split && !labelByBadge ? markChip.box : afterChip.box;
      const to = split && !labelByBadge ? {x: badgeC.x, y: badgeC.y - badgeR} : labelByBadge ? {x: markChip.box.cx, y: markChip.box.y} : {x: mbox.x + mbox.w / 2, y: mbox.y};
      const from = {x: clamp(to.x, a.x + 14, a.x + a.w - 14), y: a.y + a.h};
      const clean = !segmentHits(from, to, split && !labelByBadge ? [...polysFin.filter((_, i) => i !== k && i !== k + 1), ...floorBoxes.slice(0, 1), plinthBox] : [...polysFin, ...floorBoxes, plinthBox], 6);
      if (to.y > from.y + 12 && clean) annLead = h('path', {name: 'ann-lead', d: `M${r(from.x)} ${r(from.y)}L${r(to.x)} ${r(to.y)}`, stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '7 7', fill: 'none', opacity: 0});
    }

    // clearance between the changed marker (badge + label) and the before → after note
    const boxGap = (A, B) => Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w), B.y - (A.y + A.h), A.y - (B.y + B.h));
    const markBox = markChip ? unionBounds([mbox, markChip.box]) : mbox;
    const markerNoteGap = annBoxes.length ? Math.min(...annBoxes.map(bx => boxGap(markBox, bx))) : null;
    const tabB = tabPoly ? boundsOf(tabPoly) : null;
    const sourceContainsTab = !tabB || (tabB.x >= source.x && tabB.y >= source.y && tabB.x + tabB.w <= source.x + source.w && tabB.y + tabB.h <= source.y + source.h);
    return {markerClean: Boolean(mres1) || split, markerSplit: split, markerNoteGap, sourceContainsTab, stage, lensStage, finCtx, finLens, labelNodes: labs.nodes, contact, ctxSeal, lensSeal, source, dest, L2, beforeChip, afterChip, strike, strikeSegs, arrow, annLead, ctxCap, linkCap, marker, k, n, target, beforeDisputed, beforeCausal};
  },
  build(ctx, L) {
    return g(null,
      L.ctxCap && L.ctxCap.node,
      L.stage.back,
      L.stage.main,
      g({name: 'ctx-seal-at', transform: T(L.contact.x, L.contact.y)}, L.ctxSeal.node),
      L.labelNodes,
      L.L2.node,
      L.linkCap && L.linkCap.node,
      L.annLead,
      L.marker,
      L.beforeChip && g({name: 'ann', opacity: 0}, L.beforeChip.node, L.strike, L.arrow, L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    // context: the settled state; tiles fade in along the supplied order, seals pop in after
    Object.assign(nodes, L.finCtx.nodes, L.finLens.nodes);
    const n = L.n;
    // lens open / close; the context (except the two tiles of the inspected link) fades meanwhile
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    const dim = 1 - DIM * lp;
    const keep = i => i === L.k || i === L.k + 1;
    for (let i = 0; i < n; i++) {
      const pr = seg(u, W.tiles[0] + (i * (W.tiles[1] - W.tiles[0])) / (n + 1), W.tiles[0] + ((i + 1.5) * (W.tiles[1] - W.tiles[0])) / (n + 1));
      const dk = keep(i) ? 1 : dim;
      nodes[`ctx-tile${i}`] = {...nodes[`ctx-tile${i}`], opacity: r(pr * dk, 3)};
      nodes[`ctx-sh${i}`] = {...nodes[`ctx-sh${i}`], opacity: r(0.16 * pr * dk, 3)};
      const sp = seg(u, W.seals[0] + i * 0.012, W.seals[0] + i * 0.012 + 0.03);
      if (i !== L.k) nodes[`ctx-joint${i}`] = {...nodes[`ctx-joint${i}`], opacity: r(sp * dim, 3)};
      else nodes[`ctx-joint${i}`] = {...nodes[`ctx-joint${i}`], opacity: 0};
      nodes[`lz-joint${i}`] = {...nodes[`lz-joint${i}`], opacity: i === L.k ? 0 : 1};
    }
    const lossP = seg(u, W.tiles[1] - 0.02, W.tiles[1] + 0.03);
    const lossKeep = L.k === n - 1 ? 1 : dim;
    L.stage.losses.forEach((_, j) => {
      nodes[`ctx-loss${j}`] = {...nodes[`ctx-loss${j}`], opacity: r(lossP * lossKeep, 3)};
      nodes[`ctx-sh${n + j}`] = {...nodes[`ctx-sh${n + j}`], opacity: r(0.16 * lossP * lossKeep, 3)};
    });
    nodes['ctx-back'] = {opacity: r(dim, 3)};
    L.stage.losses.forEach((_, j) => [0, 1, 2].forEach(q => {
      const nm = `ctx-shard${j}-${q}`;
      if (nodes[nm]) nodes[nm] = {...nodes[nm], opacity: r((nodes[nm].opacity ?? 1) * lossKeep, 3)};
    }));
    nodes['ctx-plinth'] = {opacity: r(lossKeep, 3)};
    nodes['ctx-seal-at'] = {opacity: r(seg(u, W.seals[0] + L.k * 0.012, W.seals[0] + L.k * 0.012 + 0.03), 3)};
    L.labelNodes.forEach((_, i) => { nodes[L.labelNodes[i].attrs.name] = {opacity: r(seg(u, W.labels[0] + i * 0.012, W.labels[0] + i * 0.012 + 0.04) * dim, 3)}; });
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    Object.assign(nodes, L.L2.frame(lp));
    // the link tab rides on the lens window's top-left corner while it opens / closes
    if (L.linkCap) nodes['link-cap'] = {opacity: r(clamp((lp - 0.3) / 0.35), 3), transform: T(lerp(L.source.x, L.dest.x, lp) - L.dest.x, lerp(L.source.y, L.dest.y, lp) - L.dest.y)};

    // substitution: inside the lens first, then in the context after the lens returns
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = ease.inOutSine(seg(u, ...W.ctxUpdate));
    Object.assign(nodes, L.lensSeal.frame(change), L.ctxSeal.frame(ctxUpd));

    if (L.beforeChip) {
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0};
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      // the strike runs through the old value line by line, in reading order
      const total = L.strikeSegs.reduce((a, s) => a + s.len, 0);
      let done = seg(u, ...W.strike) * total;
      L.strikeSegs.forEach((s, i) => {
        const q = clamp(done / s.len);
        done -= s.len;
        nodes[`ann-strike${i}`] = {'stroke-dashoffset': r(s.len * (1 - q))};
      });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
    }
    if (L.annLead) nodes['ann-lead'] = {opacity: r(seg(u, ...W.marker), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};

    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const S = L.source;
    const c = L.contact;
    const statusOf = v => (L.target === 'status' ? ((L.beforeDisputed ? v < 0.5 : v >= 0.5) ? 'disputed' : 'proposed') : (L.beforeDisputed ? 'disputed' : 'proposed'));
    const kindOf = v => (L.target === 'kind' ? ((L.beforeCausal ? v < 0.5 : v >= 0.5) ? 'causal' : 'sequence') : (L.beforeCausal ? 'causal' : 'sequence'));
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        contextDim: r(1 - dim, 3),
        datum,
        focusTarget: L.target,
        focusLink: L.k,
        lensValue: r(change, 3),
        contextValue: r(ctxUpd, 3),
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        contextStatus: statusOf(ctxUpd),
        contextKind: kindOf(ctxUpd),
        lensStatus: statusOf(change),
        lensKind: kindOf(change),
        contact: {x: r(c.x), y: r(c.y)},
        source: {x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)},
        sourceContainsContact: c.x > S.x && c.x < S.x + S.w && c.y > S.y && c.y < S.y + S.h,
        tileAngles: L.finCtx.semantic.angles,
        lossState: L.finCtx.semantic.lossState,
        otherJointsVisible: L.finCtx.semantic.joints.filter((_, i) => i !== L.k).length,
        markerClean: L.markerClean,
        markerSplit: L.markerSplit,
        markerNoteGap: L.markerNoteGap === null ? null : r(L.markerNoteGap),
        sourceContainsTab: L.sourceContainsTab,
        lens: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
        lensZoom: r(L.dest.w / L.source.w, 3), // effective magnification (the zoom param is its cap)
        // the old value is struck through line by line (one segment per wrapped line)
        beforeLines: L.beforeChip ? L.beforeChip.fit.lines.length : 0,
        strikeLines: L.strikeSegs.length,
        strikeOnLines: L.strikeSegs.every((sg, i) => {
          const f = L.beforeChip.fit;
          const base = L.beforeChip.box.y + ANN_SIZE * 0.38 + f.size * 0.8 + i * f.lineHeight;
          return sg.y < base && sg.y > base - f.size * 0.6;
        }),
      },
    };
  },
};

/** The two cone lines the lens framework draws between the source and the lens (frameworks/lens.js). */
function coneLines(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x;
    const rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [[{x: sx, y: S.y}, {x: rx, y: R.y}], [{x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}]];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y;
  const ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [[{x: S.x, y: sy}, {x: R.x, y: ry}], [{x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}]];
}

/**
 * Link seal drawn at a contact point (local origin = contact).
 * status: two interlocked rings that pull apart and turn dashed with a "?".
 * kind:   an arrow across the contact, thin (sequence) ↔ thick (causal), drawn on a
 *         small tab tucked under the seal on the upper side of the contact — beside
 *         the rings, never over them (an arrow over the rings reads as a knot).
 * `tabPoly` is the tab's outline in screen units relative to the contact.
 */
function sealArt(ctx, {prefix, R, nrm, beforeDisputed, beforeCausal, target}) {
  const th = ctx.theme;
  const P = prefix;
  const a = Math.atan2(nrm.y, nrm.x);
  const ang = a * 180 / Math.PI;
  const ringRx = R * 0.62, ringRy = R * 0.4;
  const show = ctx.show('key');
  const ringsSolid = (name, dx, color) => h('ellipse', {name, cx: r(dx), cy: 0, rx: r(ringRx), ry: r(ringRy), fill: 'none', stroke: color, 'stroke-width': Math.max(3, R * 0.2)});
  // kind tab: along the contact normal (the arrow crosses the contact), offset along the
  // face to the side that points up on screen (away from the floor and the next tile's foot)
  const isKind = target === 'kind';
  const side = Math.cos(a) > 0 ? -1 : 1; // local +y is (-sin a, cos a) on screen
  const tabOff = R * 2.0, tabW = R * 2.8, tabH = R * 1.2;
  const tipX = R * 1.08, headL = R * 0.5, headH = R * 0.3;
  const toScreen = (x, y) => ({x: x * Math.cos(a) - y * Math.sin(a), y: x * Math.sin(a) + y * Math.cos(a)});
  const ty = side * tabOff;
  const tabPoly = isKind ? [toScreen(-tabW / 2, ty - tabH / 2), toScreen(tabW / 2, ty - tabH / 2), toScreen(tabW / 2, ty + tabH / 2), toScreen(-tabW / 2, ty + tabH / 2)] : null;
  const node = g({name: `${P}-seal`},
    isKind ? g({transform: `rotate(${r(ang)})`},
      h('rect', {name: `${P}-tab`, x: r(-tabW / 2), y: r(ty - tabH / 2), width: r(tabW), height: r(tabH), rx: r(tabH / 2), fill: th.card, stroke: th.fg, 'stroke-width': 2.5}),
      h('path', {name: `${P}-arrow`, d: `M${r(-R * 1.0)} ${r(ty)}H${r(tipX - headL * 0.8)}`, stroke: th.fg, 'stroke-width': 3, 'stroke-linecap': 'round'}),
      g({transform: T(tipX, ty)}, h('path', {name: `${P}-head`, d: `M0 0l${r(-headL)} ${r(-headH)}v${r(headH * 2)}z`, fill: th.fg}))) : null,
    h('circle', {name: `${P}-halo`, r: r(R * 1.55), fill: th.card, stroke: th.accent4, 'stroke-width': 3.5, opacity: 0.95}),
    g({transform: `rotate(${r(ang)})`},
      // status rings (proposed = interlocked; disputed = apart + dashed)
      g({name: `${P}-rA`}, ringsSolid(`${P}-rA-e`, -ringRx * 0.45, th.accent4)),
      g({name: `${P}-rB`}, ringsSolid(`${P}-rB-e`, ringRx * 0.45, th.accent4)),
    ),
    g({name: `${P}-q`, opacity: 0},
      show
        ? h('text', {x: 0, y: r(R * 0.36), 'text-anchor': 'middle', 'font-size': r(R * 1.0), 'font-weight': 800, 'font-family': FONT, fill: th.accent}, '?')
        : h('circle', {r: r(R * 0.14), fill: th.accent})),
  );
  const frame = v => {
    const out = {};
    // disputed-ness d in [0,1] for status; causal-ness c for kind
    const d = target === 'status' ? (beforeDisputed ? 1 - v : v) : (beforeDisputed ? 1 : 0);
    const c = target === 'kind' ? (beforeCausal ? 1 - v : v) : (beforeCausal ? 1 : 0);
    const apart = d * ringRx * 1.05;
    const col = d >= 0.5 ? th.accent : th.accent4;
    out[`${P}-rA`] = {transform: T(-apart, 0)};
    out[`${P}-rB`] = {transform: T(apart, 0)};
    out[`${P}-rA-e`] = {'stroke-dasharray': d > 0.02 ? `${r(4 + 6 * (1 - d))} ${r(2 + 5 * d)}` : 'none', stroke: col};
    out[`${P}-rB-e`] = {'stroke-dasharray': d > 0.02 ? `${r(4 + 6 * (1 - d))} ${r(2 + 5 * d)}` : 'none', stroke: col};
    out[`${P}-halo`] = {stroke: col, 'stroke-dasharray': d >= 0.5 ? '6 5' : 'none'};
    out[`${P}-q`] = {opacity: r(clamp((d - 0.4) / 0.4), 3)};
    if (isKind) {
      const kc = c >= 0.5 ? th.accent : th.fg;
      out[`${P}-arrow`] = {'stroke-width': r(3 + 4.5 * c, 2), stroke: kc};
      out[`${P}-head`] = {fill: kc, transform: `scale(${r(1 + 0.4 * c, 3)})`};
      out[`${P}-tab`] = {stroke: kc, 'stroke-width': r(2.5 + 1 * c, 2)};
    }
    return out;
  };
  return {node, frame, tabPoly};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-01-inspect',
    title: 'Causal chain — inspect one link and change a datum',
    titleEs: 'Cadena causal — Inspección y cambio de un dato',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Cadena causal',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The settled chain is the context; a lens (a real copy at the same coordinates) enlarges the contact point of one link, substitutes one datum of that link — status proposed ↔ disputed (the seal’s rings pull apart and turn dashed with a “?”) or kind sequence ↔ causal (the arrow thickens) — keeps the previous value traceable, and returns to the context with a changed-datum marker.',
    tags: ['causation', 'chain', 'inspect', 'lens', 'link', 'disputed', 'status', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CHAIN_STRINGS,
  scene,
});
