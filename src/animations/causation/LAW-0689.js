/**
 * LAW-0689 — Causas concurrentes · story
 *
 * Storyboard (side view: two marble runs, one vase, two presenters):
 *  0.00–0.15 rest     Two racks stand on one floor, one per supplied route,
 *                     with a vase on a display plinth between them. Each rack
 *                     has one sloped plank per supplied event (die face = its
 *                     place in the supplied order, colour = its route) and a
 *                     marble held at the top by a striped release gate. Each
 *                     presenter stands outside their route's rack. Route
 *                     plates, the legend (events, alternatives, links) and the
 *                     loss appear.
 *  0.05–0.20          Both presenters reach their lever at the same time and
 *                     press it (hand on the knob); each gate swings open.
 *  0.20–0.62 action   Both marbles roll down their own planks under gravity
 *                     (deterministic simulation), drop through each turn onto
 *                     the next plank — a link seal pops on each lip as the
 *                     marble passes — and arrive together.
 *  0.62–0.73 complete Route A's marble meets the vase's left shoulder, route
 *                     B's its right shoulder: two separate cracks, two chips.
 *                     Nothing merges, nothing is added up: two contact points.
 *  0.73–1.00 hold     The presenters open a hand toward their route; the
 *                     status tag, notes and the key "As supplied · routes not
 *                     added up · no conclusion drawn" fade in by 0.86.
 *  finalState 'unresolved-at-disputed-link': a route with a disputed link has
 *  a pause pin on that plank's lip; its marble rests against it and a dashed
 *  ghost path and marble show where it would go — never decided.
 * Wide/short boxes: the legend below the stage (two columns, one per route)
 * or, when that leaves the art too small, one column beside each rack.
 * Tall boxes: the legend below.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified;
 * no apportionment, share, fault, liability, causation test or outcome.
 * @module animations/causation/LAW-0689
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {personRig} from '../../primitives/person.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  ccFields, CC_STRINGS, ROUTES, resolveRoutes, routeColors, routeBadge, badgeWidth, concurrentStage, runMetrics, rackNeed,
  legendColumns, legendFrame, routeItems, lossItems, flowRows, chipG, fitG, balancedG, FLOOR_T, VASE_W,
} from './kits/causas-concurrentes.js';

const ID = 'LAW-0689';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  legend: [0.015, 0.12], plates: [0, 0.06],
  reach: [0.05, 0.13], press: [0.13, 0.19], gate: [0.14, 0.2], start: 0.2, strike: 0.62,
  withdraw: [0.24, 0.31], present: [0.66, 0.74],
  tag: [0.74, 0.8], notes: [0.77, 0.84], key: [0.8, 0.86],
};

const sceneSchema = {
  ...ccFields,
  presenters: obj('The two presenters (fictional): one beside each route', {a: party, b: party}, ['a', 'b']),
  actorLabels: obj('Role captions shown with each presenter', {
    a: str('Caption for the presenter of route A (descriptive, not a finding)', 60),
    b: str('Caption for the presenter of route B (descriptive, not a finding)', 60),
  }),
  objectLabels: obj('Labels printed in the scene', {
    tag: str('Status tag shown in the final hold when both routes reach the loss', 70),
    stand: str('Optional label printed on the display plinth', 24),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['loss', 'route-a', 'route-b']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold: both routes reach the loss, or a route with a disputed link is held there, unresolved (never decided)', ['reaches-loss', 'unresolved-at-disputed-link']),
};

const defaultParams = {
  events: {
    a: [
      {label: 'Kitchen tap left running', time: 'T0'},
      {label: 'Sink overflows', time: 'T+4 min'},
      {label: 'Water spreads to the shelf', time: 'T+9 min'},
    ],
    b: [
      {label: 'Roof gutter blocked', time: 'T0'},
      {label: 'Rain seeps through the wall', time: 'T+6 min'},
      {label: 'Water drips onto the shelf', time: 'T+9 min'},
    ],
  },
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase on the shelf cracked'}],
  routeLabels: {a: 'Cause A', b: 'Cause B'},
  presenters: {
    a: {name: 'Rin Adeyemi', role: 'Presenter'},
    b: {name: 'Tomás Varga', role: 'Presenter', appearance: {skin: 1, hair: 'curly', outfit: 2}},
  },
  actorLabels: {a: 'Runs route A as supplied', b: 'Runs route B as supplied'},
  objectLabels: {tag: 'Two routes, one loss (as supplied)', stand: ''},
  actionProgress: 1,
  annotations: [{target: 'loss', text: 'Each route reaches the same vase on its own side'}],
  finalState: 'reaches-loss',
};

const SHAPES = {
  landscape: {size: 24, baseMin: 20, minSize: 17, modes: ['below', 'side']},
  square: {size: 24, baseMin: 20, minSize: 17, modes: ['below', 'side']},
  portrait: {size: 25, baseMin: 20.5, minSize: 17, modes: ['below']},
};
const MARGIN = 10;
/** Keep the shared result prominent (≥ ~100 units) when the racks are small: a larger vase, met lower on its body. */
const vaseOpts = V => (V >= 100 ? {} : {vaseK: 100 / V, shoulder: 0.45, contactK: 0.98, minPlinth: 6});
const personK = V => clamp((V * 1.5) / 420, 0.42, 1.05);
const zoneOf = V => { const m = runMetrics(V); return Math.max(46, m.R * 3.2) + 88 * personK(V); };

/** Largest vase height whose racks fit a stage box of w × h (h = rack top → floor slab bottom). */
function fitV(w, h, nMax) {
  const ok = V => {
    const m = runMetrics(V);
    const zone = zoneOf(V);
    const rackW = (w - 2 * zone - m.vw - 2 * 2.4 * m.R) / 2;
    const span = rackW - 10 - (2 * m.R + 14) - 6;
    if (span < Math.max(6 * m.R, 110)) return false;
    return rackNeed(nMax, span, V) + FLOOR_T <= h && V <= h * 0.36;
  };
  let lo = 60, hi = 420;
  if (!ok(lo)) return null;
  if (ok(hi)) return hi;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  return lo;
}

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = {w: ctx.design.w, h: cfg.DH ?? ctx.design.h};
  const {C, held, unresolved} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const size = cfg.size;
  const side = cfg.mode === 'side' && keyOn;
  const col = routeColors(ctx);
  const looks = {a: actorLook(ctx, p.presenters.a, 0), b: actorLook(ctx, p.presenters.b, 1)};
  const nMax = Math.max(C.routes.a.n, C.routes.b.n);

  // ---- legend items per route (presenter caption first)
  const whoText = k => [p.presenters[k].name, p.presenters[k].role, p.actorLabels[k]].filter(Boolean).join(' · ');
  const items = k => (keyOn ? routeItems(ctx, C, k, {who: whoText(k), look: looks[k]}) : []);

  // ---- route plates above the racks (up to two lines, never cut)
  const plateSize = size;
  const plateFit = (kk, wMax) => fitG(ctx, C.routes[kk].name, {maxWidth: wMax, size: plateSize, minSize: plateSize, maxLines: 2, weight: 700});

  // ---- layout of stage + legend + band (the band sits under the stage only)
  const iconS = size * 1.35;
  let legW = 0, stageX = MARGIN, stageW = D.w - 2 * MARGIN;
  let lg = {rows: [], bottom: 0, minPx: Infinity};
  if (side) {
    legW = cfg.legW;
    stageX = MARGIN + legW + 18;
    stageW = D.w - 2 * stageX;
    const cols = ROUTES.map((k, i) => ({x: i ? D.w - MARGIN - legW : MARGIN, y: 0, w: legW, items: items(k)}));
    lg = legendColumns(ctx, {cols, size, maxLines: cfg.maxLines ?? 5, gap: 9, prefix: 'lg'});
    if (lg.bottom > D.h || lg.truncated) return {bad: 'legend', over: lg.bottom - D.h, ext: {h: lg.bottom}};
  }
  const bandW = stageW;
  const probe = (text, mw) => chipG(ctx, text, {x: 0, y: 0, maxWidth: balancedG(ctx, text, {maxWidth: mw, size, maxLines: 5}), size, maxLines: 5});
  const tagText = p.objectLabels.tag || '';
  const heldText = unresolved ? `${C.routes[unresolved].name} · ${t.heldAt}` : '';
  const bandItems = [];
  if (keyOn) {
    lossItems(ctx, C).forEach(it => bandItems.push({...it, icon: 'loss', mw: Math.min(bandW, 620)}));
    if (tagText) bandItems.push({key: 'tag', kind: 'tag', text: tagText, mw: Math.min(bandW, 560)});
    if (heldText) bandItems.push({key: 'held', kind: 'tag', text: heldText, mw: Math.min(bandW, 560)});
    if (allOn) p.annotations.forEach((a, i) => bandItems.push({key: `note${i}`, kind: 'note', icon: a.target, text: a.text, target: a.target, mw: Math.min(bandW, 580)}));
    bandItems.push({key: 'key', kind: 'key', text: t.key, mw: Math.min(bandW, 540)});
    if (p.objectLabels.stand && allOn && cfg.standInBand) bandItems.splice(1, 0, {key: 'stand', kind: 'stand', text: p.objectLabels.stand, mw: Math.min(bandW, 360)});
  }
  const bandChips = bandItems.map(it => {
    const iw = it.icon ? (it.icon === 'loss' ? iconS + 10 : badgeWidth(ctx, iconS * 0.45) + 10) : 0;
    const b = probe(it.text, it.mw - iw).box;
    return {...it, iw, w: b.w + iw, h: Math.max(b.h, iw ? iconS : 0)};
  });
  const bandProbe = flowRows(bandChips, {x: stageX, y: 0, w: bandW, gap: 20, rowGap: 9});
  const bandH = bandChips.length ? bandProbe.bottom + 14 : 0;
  let legY = 0;
  let legH = 0;
  if (!side && keyOn) {
    const colW = (D.w - 2 * MARGIN - 30) / 2;
    const cols0 = ROUTES.map((k, i) => ({x: MARGIN + i * (colW + 30), y: 0, w: colW, items: items(k)}));
    const probeLg = legendColumns(ctx, {cols: cols0, size, maxLines: cfg.maxLines ?? 3, gap: 8, prefix: 'lgp'});
    if (probeLg.truncated) return {bad: 'cut'};
    legH = probeLg.bottom + 14;
    lg = {cols0};
  }
  // plates: the tallest of the two (same height for both lanes)
  const rackWguess = (stageW - 2 * 120) / 2 - 60;
  const pf = ROUTES.map(kk => (keyOn ? plateFit(kk, Math.max(160, rackWguess - 2 * plateSize * 0.62 - 30)) : null));
  const plateH = keyOn ? Math.max(...pf.map(f => f.height)) + plateSize * 0.7 + 4 : 30;
  const stageTop = plateH + 16;
  const stageH = D.h - bandH - legH - stageTop;
  if (!side && keyOn) {
    legY = stageTop + stageH + 14;
    lg = legendColumns(ctx, {cols: lg.cols0.map(c => ({...c, y: legY})), size, maxLines: cfg.maxLines ?? 3, gap: 8, prefix: 'lg'});
  }
  if (stageH < 200) return {bad: 'stage', over: 200 - stageH, ext: {h: D.h + 200 - stageH}};
  const V = fitV(stageW, stageH, nMax);
  if (!V) return {bad: 'V', over: 1, ext: {h: D.h + 1}};
  // the plinth label is printed on the plinth when it fits there (≥ 16.5 px, ≤ 2 lines), else it joins the band
  if (p.objectLabels.stand && allOn && !cfg.standInBand) {
    // printed on the front of the floor slab under the plinth (one line)
    const f = fitG(ctx, p.objectLabels.stand, {maxWidth: Math.min(360, stageW * 0.3), size: 17, minSize: 16.5, maxLines: 1, weight: 600});
    if (f.truncated || f.broken) return compose(ctx, base, {...cfg, standInBand: true});
  }
  if (cfg.dry) return {V, cfg: {...cfg, dry: false}, ext: {h: D.h}};

  // ---- stage
  const k = personK(V);
  const zone = zoneOf(V);
  const box = {x: stageX, y: stageTop, w: stageW, h: stageH};
  const F0 = box.y + box.h - FLOOR_T;
  const stage = concurrentStage(ctx, {prefix: 'st', box, V, C, outer: zone, held, levers: true, leverY: F0 - 238 * k, fitTop: true, ...vaseOpts(V)});
  const F = stage.F;

  // ---- presenters (outside the racks, facing their rack)
  const actors = {};
  for (const kk of ROUTES) {
    const K = stage.racks[kk];
    const s = K.s;
    const ax = K.xOut - s * (Math.max(46, stage.R * 3.2) + 40 * k);
    const rig = personRig(ctx, {name: `actor${kk}`, look: looks[kk], pose: 'standing'});
    const restNear = {x: ax + s * 22 * k, y: F - 156 * k};
    const presentAt = {x: ax + s * 118 * k, y: F - 250 * k};
    const headTop = F - 420 * k;
    actors[kk] = {rig, ax, s, restNear, presentAt, headTop, box: {x: ax - 60 * k, y: headTop, w: 120 * k, h: F - headTop}};
  }

  // ---- route plates: centred over each rack's rail
  const plates = ROUTES.map((kk, i) => {
    const rb = stage.rackBox(kk);
    const R0 = Math.max(plateSize * 0.62, 17 * 0.8);
    // same fit as the one that sized plateH (the plate may be wider than its rack; it stays centred over it)
    const txt = keyOn ? pf[ROUTES.indexOf(kk)] : null;
    const bw = badgeWidth(ctx, R0);
    const wP = (txt ? txt.width + 12 : 0) + bw + 16;
    const x0 = clamp(rb.x + rb.w / 2 - wP / 2, MARGIN, D.w - MARGIN - wP);
    const yc = stage.rackTop - 8 - plateH / 2 - 6;
    return g({name: `plate${kk}`},
      h('path', {d: `M${r(rb.x + rb.w / 2)} ${r(yc + plateH / 2)}V${r(stage.rackTop - 8)}`, stroke: th.metalDark, 'stroke-width': 3}),
      h('rect', {x: r(x0), y: r(yc - plateH / 2), width: r(wP), height: r(plateH), rx: r(Math.min(plateH / 2, R0 + 8)), fill: th.card, stroke: col.of(kk), 'stroke-width': 3}),
      routeBadge(ctx, {x: x0 + 8 + R0, y: yc, R: R0, color: col.of(kk), letter: kk.toUpperCase()}),
      txt ? textBlock(txt, {x: x0 + bw + 18, y: yc - txt.height / 2, fill: th.fg}) : null);
  });

  // ---- plinth label
  let standLabel = null;
  if (p.objectLabels.stand && allOn && !cfg.standInBand) {
    const f = fitG(ctx, p.objectLabels.stand, {maxWidth: Math.min(360, stageW * 0.3), size: 17, minSize: 16.5, maxLines: 1, weight: 600});
    standLabel = g(null,
      h('rect', {x: r(stage.cx - f.width / 2 - 8), y: r(F + 11), width: r(f.width + 16), height: r(FLOOR_T - 13), rx: 3, fill: th.paper, stroke: th.ink, 'stroke-width': 1.5}),
      textBlock(f, {x: stage.cx, y: F + 11 + (FLOOR_T - 13 - f.size) / 2, anchor: 'middle', fill: th.ink}));
  }

  // ---- bottom band (under the stage): loss, status tag, notes (target icon + leader when clean), key
  const bandTop = D.h - bandH + 6;
  const placedBand = flowRows(bandChips, {x: stageX, y: bandTop, w: bandW, gap: 20, rowGap: 9}).placed;
  const textBoxes = [...(lg.rows || []).map(rw => rw.chip), ...placedBand.map(it => ({x: it.x, y: it.y, w: it.w, h: it.h}))];
  const band = placedBand.map(it => {
    const mw = balancedG(ctx, it.text, {maxWidth: it.mw - it.iw, size, maxLines: 5});
    const c0 = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: mw, size, maxLines: 5});
    const c = chipG(ctx, it.text, {x: it.x + it.iw, y: it.y + (it.h - c0.box.h) / 2, maxWidth: mw, size, maxLines: 5,
      fill: it.kind === 'loss' ? th.accent3Soft : th.card, stroke: it.kind === 'loss' ? th.accent3 : it.kind === 'tag' ? th.fgSoft : th.inkSoft});
    let icon = null;
    const cy = it.y + it.h / 2;
    if (it.icon === 'loss') icon = g({transform: T(it.x + iconS * 0.5, cy + iconS / 2)}, stageLossIcon(ctx, iconS));
    else if (it.icon === 'route-a' || it.icon === 'route-b') {
      const kk = it.icon === 'route-a' ? 'a' : 'b';
      icon = routeBadge(ctx, {x: it.x + Math.max(iconS * 0.45, Math.max(iconS * 0.47, 17) * 0.8), y: cy, R: iconS * 0.45, color: col.of(kk), letter: kk.toUpperCase()});
    }
    let lead = null;
    if (it.kind === 'note') {
      const rb = it.target === 'loss' ? null : stage.rackBox(it.target === 'route-a' ? 'a' : 'b');
      const tg = it.target === 'loss' ? {x: stage.cx, y: stage.plinthTop - stage.V * 0.2} : {x: rb.x + rb.w / 2, y: F - 44};
      const from = {x: clamp(tg.x, c.box.x + 16, c.box.x + c.box.w - 16), y: c.box.y};
      // a leader only when it crosses no other text on its way
      const crosses = textBoxes.some(b => !(b.x === it.x && b.y === it.y) && segBox(from, tg, b));
      if (!crosses) {
        const len = Math.hypot(tg.x - from.x, tg.y - from.y);
        lead = {len, node: g(null,
          h('line', {name: `${it.key}-lead`, x1: r(from.x), y1: r(from.y), x2: r(tg.x), y2: r(tg.y), stroke: th.ink, 'stroke-width': 2.5, 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
          h('circle', {name: `${it.key}-dot`, cx: r(tg.x), cy: r(tg.y), r: 7, fill: th.ink, stroke: th.card, 'stroke-width': 2.5, opacity: 0}))};
      }
    }
    return {key: it.key, kind: it.kind, lead, node: g({name: `band-${it.key}`, opacity: 0}, lead && lead.node, icon, c.node), box: {x: it.x, y: it.y, w: it.w, h: it.h}};
  });

  // ---- presenter caption leaders (legend row → head)
  const whoLeads = [];
  if (keyOn) {
    for (const kk of ROUTES) {
      const rw = lg.rows.find(q => q.key === `who${kk}`);
      if (!rw) continue;
      const A = actors[kk];
      const tgt = {x: A.ax, y: A.headTop - 4};
      let from;
      if (side) from = {x: kk === 'a' ? rw.chip.x + rw.chip.w : rw.box.x, y: rw.chip.y + rw.chip.h / 2};
      else from = {x: clamp(tgt.x, rw.chip.x + 14, rw.chip.x + rw.chip.w - 14), y: rw.box.y};
      // only when the caption is near enough for a clean leader (below: under the presenter)
      whoLeads.push(g({name: `wholead${kk}`, opacity: 0},
        h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(tgt.x)} ${r(side ? tgt.y : F + FLOOR_T + 2)}`, stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'})));
    }
  }

  const ext = {x: 0, y: 0, w: D.w, h: D.h};
  return {stage, actors, plates, standLabel, band, lg, whoLeads, V, k, size, side, ext, F, bandH, legW};
}

/** Does segment a→b pass through box (inflated by 4)? */
function segBox(a, b, bx) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(2, Math.ceil(L / 6));
  for (let i = 1; i < n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n, y = a.y + ((b.y - a.y) * i) / n;
    if (x > bx.x - 4 && x < bx.x + bx.w + 4 && y > bx.y - 4 && y < bx.y + bx.h + 4) return true;
  }
  return false;
}

/** Vase icon for the loss chip in the band (local origin = bottom centre). */
function stageLossIcon(ctx, s) {
  const th = ctx.theme;
  const w = s * 0.62;
  const c = 0;
  const X = f => r(c + f * w), Y = f => r(-f * s);
  return h('path', {d: `M${X(-0.36)} 0H${X(0.36)}C${X(0.44)} ${Y(0.3)} ${X(0.49)} ${Y(0.6)} ${X(0.46)} ${Y(0.84)}H${X(0.5)}V${Y(1)}H${X(-0.5)}V${Y(0.84)}H${X(-0.46)}C${X(-0.49)} ${Y(0.6)} ${X(-0.44)} ${Y(0.3)} ${X(-0.36)} 0Z`, fill: th.accent3, stroke: th.ink, 'stroke-width': 2});
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const C = resolveRoutes(p);
    // unresolved: every route with a disputed link holds at its first one (route B's middle link if none supplied)
    let held = {a: null, b: null};
    let unresolved = null;
    if (p.finalState === 'unresolved-at-disputed-link') {
      for (const k of ROUTES) if (C.routes[k].disputed !== null && C.routes[k].disputed < C.routes[k].n - 1) held[k] = C.routes[k].disputed;
      if (held.a === null && held.b === null) {
        const i = Math.max(0, Math.floor((C.routes.b.n - 2) / 2));
        C.routes.b.links[i] = {...C.routes.b.links[i], status: 'disputed'};
        C.routes.b.disputed = i;
        held.b = i;
      }
      unresolved = held.a !== null ? 'a' : 'b';
    }
    const base = {C, held, unresolved};
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 1) out.push(s); out.push(b); return out; };
    const cands = [];
    const why = [];
    const legWs = [0.2, 0.24, 0.28, 0.32].map(f => ctx.design.w * f);
    for (const [pass, sizes] of [[0, sizesIn(SH.size, SH.baseMin)], [1, sizesIn(SH.baseMin, SH.minSize)]]) {
      for (const size of sizes) {
        for (const mode of ctx.show('key') ? SH.modes : ['below']) {
          const cfgs = mode === 'side' ? legWs.map(legW => ({mode, size, legW})) : [{mode, size}, {mode, size, maxLines: 4}, {mode, size, maxLines: 6}];
          for (const cfg of cfgs) {
            const X = compose(ctx, base, {...cfg, dry: true});
            if (!X.V && size <= 18) why.push(`${mode}${cfg.maxLines ?? ''}${cfg.legW ? Math.round(cfg.legW) : ''}@${size}:${X.bad}${X.over ? Math.round(X.over) : ''}`);
            if (X.V) cands.push({cfg: X.cfg, V: X.V, pass, size});
          }
        }
      }
      // prefer the largest art among the largest text sizes of this pass
      if (cands.length) break;
    }
    let pick = null;
    if (cands.length) {
      const maxSize = Math.max(...cands.map(c => c.size));
      // text within 3 units of the largest possible (never below the baseline floor when that is reachable,
      // 1 unit below the floor pass otherwise), then the biggest vase
      const lo = maxSize >= SH.baseMin ? Math.max(SH.baseMin, maxSize - 3) : maxSize - 0.5;
      pick = cands.filter(c => c.size >= lo - 1e-9).sort((a, b) => b.V - a.V || b.size - a.size)[0];
    }
    let L;
    if (pick) {
      L = compose(ctx, base, pick.cfg);
      L.kScale = 1;
    } else {
      // nothing fits at the text floor: grow a virtual design height until a layout exists, then scale it
      // into the box (text then falls below the floor — reported by the tests, never hidden)
      const D = ctx.design;
      let found = null;
      for (let DH = D.h + 20; DH <= D.h * 3 && !found; DH += 20) {
        for (const mode of ctx.show('key') ? SH.modes : ['below']) {
          const cfgs = mode === 'side' ? [0.24, 0.28, 0.32].map(f => ({mode, size: SH.minSize, legW: D.w * f, DH})) : [{mode, size: SH.minSize, maxLines: 5, DH}];
          for (const cfg of cfgs) {
            const X = compose(ctx, base, {...cfg, dry: true});
            if (X.V) { found = X.cfg; break; }
          }
          if (found) break;
        }
      }
      L = compose(ctx, base, found);
      L.kScale = D.h / found.DH;
    }
    L.dx = (ctx.design.w - ctx.design.w * L.kScale) / 2;
    L.base = base;
    L.why = why.slice(-12);
    L.fallback = !pick;
    return L;
  },
  build(ctx, L) {
    return g({transform: L.kScale < 1 ? T(L.dx, 0, 0, L.kScale) : null},
      L.stage.back,
      L.plates,
      L.stage.main,
      L.standLabel,
      ROUTES.map(k => L.actors[k].rig.node),
      L.whoLeads,
      L.lg.rows.map(rw => rw.node),
      L.band.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const reduced = ctx.reduced;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const tau = (a - W.start) / (W.strike - W.start);
    const press = ease.inOutCubic(seg(a, ...W.press));
    const gate = ease.inOutCubic(seg(a, ...W.gate));
    const posed = L.stage.pose({a: tau, b: tau}, {gate: {a: gate, b: gate}, lever: {a: press, b: press}, released: {a: true, b: true}});
    const nodes = posed.nodes;
    const S = posed.semantic;

    // presenters: reach → press (hand on the knob) → withdraw → present
    const reach = ease.inOutCubic(seg(a, ...W.reach));
    const withdraw = ease.inOutCubic(seg(a, ...W.withdraw));
    const present = done ? ease.inOutCubic(seg(u, ...W.present)) : 0;
    const hands = {}, knobs = {};
    let allReached = true;
    for (const k of ROUTES) {
      const A = L.actors[k];
      const knob = L.stage.leverKnob(k, press);
      knobs[k] = {x: r(knob.x), y: r(knob.y)};
      const grip = {x: knob.x, y: knob.y};
      let near;
      if (a < W.press[0]) near = mix(A.restNear, grip, reach);
      else if (a < W.withdraw[0]) near = grip;
      else near = mix(mix(grip, A.restNear, withdraw), A.presentAt, present);
      const lean = 6 * reach * (1 - withdraw);
      const watch = seg(a, W.start, W.strike);
      const headTilt = reduced ? 0 : -5 * Math.sin(Math.PI * clamp(watch * 1.1));
      const posedRig = A.rig.frame({x: A.ax, y: L.F + 4, facing: A.s, scale: L.k, lean, headTilt, near, far: null, mouth: 0});
      Object.assign(nodes, posedRig.nodes);
      hands[k] = {x: r(posedRig.hands.near.x), y: r(posedRig.hands.near.y)};
      allReached = allReached && posedRig.reached;
    }

    // labels
    const lgP = seg(u, ...W.legend);
    Object.assign(nodes, legendFrame(L.lg.rows, rw => clamp(lgP * 1.6 - (rw.kind === 'event' ? 0.1 : 0))));
    ROUTES.forEach(k => { if (L.whoLeads.length) nodes[`wholead${k}`] = {opacity: r(lgP, 3)}; });
    for (const b of L.band) {
      const pr = b.kind === 'loss' ? lgP : b.kind === 'tag' ? (done ? seg(u, ...W.tag) : 0) : b.kind === 'note' ? (done ? seg(u, ...W.notes) : 0) : seg(u, ...W.key);
      nodes[`band-${b.key}`] = {opacity: r(clamp(pr * 1.4), 3)};
      if (b.lead) {
        nodes[`${b.key}-lead`] = {'stroke-dashoffset': r(b.lead.len * (1 - clamp(pr * 1.4)))};
        nodes[`${b.key}-dot`] = {opacity: pr >= 0.7 ? 1 : 0};
      }
    }

    const m = S.marbles;
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      marbleA: m.a, marbleB: m.b,
      handA: hands.a, handB: hands.b, knobA: knobs.a, knobB: knobs.b,
      state: S.state, joints: S.joints, cracked: S.cracked, lossState: S.lossState, gateOpen: S.gateOpen, board: S.board, contact: S.contact, ghost: S.ghost,
      held: L.base.held,
      statusChips: L.band.filter(b => b.kind === 'tag').map(b => b.key),
      // the two marbles never meet: each stays on its own side of the vase
      apart: Math.abs(m.a.x - m.b.x) >= L.stage.vw * 0.9,
      pressing: a >= W.press[0] && a < W.withdraw[0],
      allReached,
      actionCapped: p.actionProgress < 1 && u > capU,
      layout: {why: L.why, V: r(L.V), size: r(L.size), side: L.side, fallback: L.fallback, fits: L.stage.fits, k: r(L.kScale, 3)},
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-03-story',
    title: 'Concurrent causes — two marble runs reach the same vase',
    titleEs: 'Causas concurrentes — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Causas concurrentes',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side-view microscene: two presenters each release a marble at the top of their route’s rack of sloped planks (one plank per supplied event, in the supplied order). Both marbles roll down under gravity, dropping through each link, and meet the same vase from opposite sides: two separate cracks, nothing merged or added up. An alternative final state holds a route at a disputed link, unresolved.',
    tags: ['causation', 'concurrent causes', 'two routes', 'marble run', 'same loss', 'not added up', 'presenters', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causas-concurrentes.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/primitives/person.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
