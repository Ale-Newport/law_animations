/**
 * LAW-0691 — Causas concurrentes · contrast
 *
 * Storyboard (two complete copies of the same two-route model, run side by
 * side in parallel; the SUPPLIED scenario data say which route is run in each):
 *  0.00–0.17 base      Two identical scenes: the same two racks (route A and
 *                      route B, one plank per supplied event), the same vase
 *                      on its plinth, both marbles held by closed gates. The
 *                      scenario badges are neutral grey; the shared legend of
 *                      events sits below. Nothing differs (lookA = lookB).
 *  0.17–0.40 change    The badges take their colours and labels. A padlock is
 *                      clipped onto the gate of the route that is NOT run in
 *                      that scene (default: in A, route B's gate; in B, route
 *                      A's gate) — a localized, explicit change of the model,
 *                      ringed in both scenes.
 *  0.40–0.77 parallel  Every gate without a lock opens at the same instant and
 *                      the same run plays in both scenes (same speed, same
 *                      frames): in A the "Cause A" marble reaches the vase's
 *                      left shoulder, in B the "Cause B" marble its right
 *                      shoulder. Each leaves its own crack. Nothing is added up.
 *  0.77–1.00 guide     A guide with the neutral Δ marker joins the locked
 *                      gates (the one changed fact); each scene shows its
 *                      supplied result at equal weight; changed fact, shared
 *                      facts, neutral note and the key "As supplied · routes
 *                      not added up · no conclusion drawn". No winner, score,
 *                      share, fault or outcome.
 * Side by side on wide boxes (each scene ≥ 40 % of the width); stacked on tall
 * boxes (each scene full width); 1:1 takes whichever gives the larger art.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0691
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {contrastFields, oneOf, obj} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  ccFields, CC_STRINGS, ROUTES, resolveRoutes, routeColors, routeBadge, concurrentStage, runMetrics, rackNeed,
  legendColumns, legendFrame, routeItems, lossItems, flowRows, chipG, fitG, balancedG, FLOOR_T, vaseHeight, VASE_W,
} from './kits/causas-concurrentes.js';

const ID = 'LAW-0691';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  legend: [0.02, 0.1], heads: [0.17, 0.22], lock: [0.19, 0.27], rings: [0.22, 0.28], changeChip: [0.24, 0.3],
  gate: [0.4, 0.45], start: 0.43, strike: 0.7,
  results: [0.76, 0.81], guide: [0.77, 0.84], notes: [0.8, 0.86], key: [0.82, 0.87],
};
const RELEASE = ['a', 'b', 'both'];

const sceneSchema = {
  ...ccFields,
  ...contrastFields(),
  released: obj('SUPPLIED scenario data: which route is run in each scene (the other gate gets a padlock)', {
    scenarioA: oneOf('Route(s) run in scene A', RELEASE),
    scenarioB: oneOf('Route(s) run in scene B', RELEASE),
  }, ['scenarioA', 'scenarioB']),
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
  released: {scenarioA: 'a', scenarioB: 'b'},
  scenarioA: {label: 'Cause A run', caption: 'Only route A’s gate opens'},
  scenarioB: {label: 'Cause B run', caption: 'Only route B’s gate opens'},
  changedFact: 'Only one fact differs: which route’s gate is locked',
  sharedFacts: ['Same events and planks', 'Same timing', 'Same vase'],
  comparisonLabels: {guide: 'Changed fact: the locked gate', neutral: 'Two runs of the same model side by side — no winner, no share, no conclusion'},
};

const SHAPES = {
  landscape: {size: 24, baseMin: 20, minSize: 17, arr: ['row']},
  square: {size: 24, baseMin: 20, minSize: 17, arr: ['row', 'column', 'stack']},
  portrait: {size: 25, baseMin: 20.5, minSize: 17, arr: ['column']},
};
const MARGIN = 10;
const GAP_X = 56;
const GUIDE_ROOM = 46;
const VASE_K = 2.1; // the shared result is drawn larger (lower plinth, marbles meet it lower on its body)
const VASE_SH = 0.4;
const CONTACT_K = 0.78; // marble contact height (× V): the big vase stands on the floor slab
const BAND = 34; // guide band above the racks

/** Largest vase height whose racks fit w × h (no presenters). */
function fitVc(w, h, nMax) {
  const ok = V => {
    const m = runMetrics(V);
    const rackW = (w - 12 - vaseHeight(V, VASE_K, VASE_SH, CONTACT_K, 5) * VASE_W - 2 * 2.4 * m.R) / 2;
    const span = rackW - 10 - (2 * m.R + 14) - 6;
    if (span < Math.max(6 * m.R, 90)) return false;
    return rackNeed(nMax, span, V, CONTACT_K) + FLOOR_T <= h && V <= h * 0.4;
  };
  let lo = 50, hi = 420;
  if (!ok(lo)) return null;
  if (ok(hi)) return hi;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
  return lo;
}

/** Locks of a scene: the route(s) NOT run in it. */
const locksOf = rel => ({a: rel === 'b', b: rel === 'a'});

/** Scenario header: badge (neutral until the change beat) + label + caption. */
function header(ctx, o) {
  const th = ctx.theme;
  const size = o.size * 1.12;
  const R = Math.max(size * 0.72, 17 * 0.8);
  const tx = o.x + 2 * R + 14;
  const mw = o.w - 2 * R - 14;
  let y = o.y;
  const texts = [];
  let hh = 2 * R + 4;
  let captionDone = false;
  if (ctx.show('key')) {
    const f = fitG(ctx, o.label, {maxWidth: mw, size, minSize: size, maxLines: 2, weight: 700});
    const ly = y + (f.lines.length === 1 ? Math.max(0, R - f.height / 2) : 0);
    texts.push(textBlock(f, {x: tx, y: ly, fill: th.fg}));
    // compact (stacked 1:1): a one-line caption that fits beside a one-line label shares its line
    if (o.compact && o.caption && ctx.show('all') && f.lines.length === 1) {
      const lw = ctx.measure(f.lines[0], size, 700, 'sans');
      const f2 = fitG(ctx, o.caption, {maxWidth: mw - lw - 18, size: o.size, minSize: o.size, maxLines: 1, weight: 500});
      if (!f2.truncated && !f2.broken && f2.lines.length === 1 && mw - lw - 18 > 60) {
        texts.push(textBlock(f2, {x: tx + lw + 18, y: ly + (f.height - f2.height) / 2 + 1, fill: th.fgSoft}));
        captionDone = true;
      }
    }
    y += Math.max(f.height + 6, f.lines.length === 1 ? 2 * R + 4 : 0);
  }
  if (o.caption && ctx.show('all') && !captionDone) {
    const f2 = fitG(ctx, o.caption, {maxWidth: mw, size: o.size, minSize: o.size, maxLines: 3, weight: 500});
    texts.push(textBlock(f2, {x: tx, y, fill: th.fgSoft}));
    y += f2.height + 4;
  }
  hh = Math.max(hh, y - o.y);
  const badge = routeBadge(ctx, {name: `${o.name}-badge`, x: o.x + R, y: o.y + R + 2, R, color: th.inkFaint, letter: o.letter, plain: true});
  const node = g({name: o.name}, badge, g({name: `${o.name}-text`, opacity: 0}, texts));
  return {node, h: hh};
}

/** Orthogonal guide with rounded corners (draws on; no arrowhead) and a Δ marker at its middle. */
function orthoGuide(ctx, {name, pts, color, mR}) {
  const q = 14;
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    len += Math.hypot(b.x - a.x, b.y - a.y);
    if (i < pts.length - 1) {
      const c = pts[i + 1];
      const la = Math.hypot(b.x - a.x, b.y - a.y) || 1, lc = Math.hypot(c.x - b.x, c.y - b.y) || 1;
      const k1 = Math.min(q, la / 2), k2 = Math.min(q, lc / 2);
      d += `L${r(b.x - ((b.x - a.x) / la) * k1)} ${r(b.y - ((b.y - a.y) / la) * k1)}Q${r(b.x)} ${r(b.y)} ${r(b.x + ((c.x - b.x) / lc) * k2)} ${r(b.y + ((c.y - b.y) / lc) * k2)}`;
    } else d += `L${r(b.x)} ${r(b.y)}`;
  }
  // Δ marker on the longest segment's middle
  let best = 1, bl = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); if (l > bl) { bl = l; best = i; } }
  const mid = {x: (pts[best].x + pts[best - 1].x) / 2, y: (pts[best].y + pts[best - 1].y) / 2};
  const from = pts[0], to = pts[pts.length - 1];
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${name}-dotA`, cx: r(from.x), cy: r(from.y), r: 6.5, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(to.x), cy: r(to.y), r: 6.5, fill: color, opacity: 0}),
    changedMarker(ctx, {name: `${name}-delta`, x: mid.x, y: mid.y, radius: mR, opacity: 0}));
  const frame = p => ({
    [name]: {opacity: p > 0 ? 1 : 0},
    [`${name}-line`]: {'stroke-dashoffset': r(len * (1 - p))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
    [`${name}-delta`]: {opacity: r(clamp((p - 0.5) * 2), 3)},
  });
  return {node, frame, pts, mid};
}

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = {w: ctx.design.w, h: cfg.DH ?? ctx.design.h};
  const {C, rel} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const size = cfg.size;
  // tight: a denser 1:1 composition (smaller guide band, row gaps and chip padding), never smaller text
  const BANDc = cfg.tight ? 26 : cfg.arr === 'row' ? BAND : cfg.arr === 'stack' ? BAND - 2 : BAND + 14;
  const lgGap = cfg.tight || cfg.dense ? 4 : 8;
  const lgPad = cfg.tight || cfg.dense ? size * 0.22 : undefined;
  const row = cfg.arr === 'row';
  // stack (square): the two scenes stacked on the left, the legend and notes in one column on the right
  const stack = cfg.arr === 'stack';
  const col = routeColors(ctx);
  const nMax = Math.max(C.routes.a.n, C.routes.b.n);

  // ---- panel geometry
  const sw = row ? (D.w - 2 * MARGIN - GAP_X) / 2 : stack ? cfg.stackW : D.w - 2 * MARGIN - GUIDE_ROOM;
  const rx = MARGIN + sw + GUIDE_ROOM + 12, rw = D.w - MARGIN - rx;
  const panelX = row ? [MARGIN, MARGIN + sw + GAP_X] : [MARGIN, MARGIN];
  const scen = [p.scenarioA, p.scenarioB];
  const heads0 = [0, 1].map(i => header(ctx, {name: 'probe', letter: i ? 'B' : 'A', label: scen[i].label, caption: scen[i].caption, x: 0, y: 0, w: sw, size, compact: stack}));
  const headH = Math.max(heads0[0].h, heads0[1].h);
  const resText = i => {
    const rr = i ? rel.b : rel.a;
    return rr === 'both' ? `${C.routes.a.name} · ${C.routes.b.name}: ${t.reaches}` : `${C.routes[rr].name}: ${t.reaches}`;
  };
  const resW = Math.min(sw, 560);
  const resProbe = keyOn ? [0, 1].map(i => chipG(ctx, resText(i), {x: 0, y: 0, maxWidth: resW, size, maxLines: 3})) : null;
  // tight: the result chip hangs over the front of the floor slab (never over text)
  const resH = keyOn ? Math.max(resProbe[0].box.h, resProbe[1].box.h) + (cfg.tight ? 4 - FLOOR_T * 0.7 : 8) : 0;

  // ---- shared legend (below the scenes) + notes
  const legItems = k => (keyOn ? routeItems(ctx, C, k, {head: `${t.route} ${k.toUpperCase()} · ${C.routes[k].name}`}) : []);
  const nc = cfg.noteCols ?? (cfg.cols4 ? 2 : 0);
  const nCols = 2 + nc;
  const colW = (D.w - 2 * MARGIN - 30 * (nCols - 1)) / nCols;
  let cols0 = ROUTES.map((k, i) => ({x: MARGIN + i * (colW + 30), y: 0, w: colW, items: legItems(k)}));
  if (stack && keyOn) {
    const la = legendColumns(ctx, {cols: [{x: rx, y: 0, w: rw, items: legItems('a')}], size, maxLines: cfg.maxLines ?? 5, gap: lgGap, padY: lgPad, prefix: 'lgq'});
    cols0 = ROUTES.map((k, i) => ({x: rx, y: i ? la.bottom + (cfg.dense || cfg.tight ? 8 : 16) : 0, w: rw, items: legItems(k)}));
  }
  const lgProbe = keyOn ? legendColumns(ctx, {cols: cols0, size, maxLines: cfg.maxLines ?? (stack ? 5 : 3), gap: lgGap, padY: lgPad, prefix: 'lgp'}) : {bottom: 0};
  const noteItems = [];
  if (keyOn) {
    lossItems(ctx, C).forEach(it => noteItems.push({...it, mw: 620}));
    noteItems.push({key: 'change', kind: 'change', text: p.changedFact, mw: 560});
    if (allOn && p.sharedFacts.length) noteItems.push({key: 'shared', kind: 'shared', text: `${t.sameFacts}: ${p.sharedFacts.join(' · ')}`, mw: 620});
    noteItems.push({key: 'guide', kind: 'guide', text: p.comparisonLabels.guide, mw: 520});
    if (allOn && p.comparisonLabels.neutral) noteItems.push({key: 'neutral', kind: 'neutral', text: p.comparisonLabels.neutral, mw: 640});
    noteItems.push({key: 'key', kind: 'key', text: t.key, mw: 540});
  }
  const iconS = size * 1.35;
  const noteChips = noteItems.map(it => {
    const iw = it.kind === 'loss' || it.kind === 'guide' ? iconS + 10 : 0;
    const mw = Math.min(D.w - 2 * MARGIN, it.mw) - iw;
    const b = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: balancedG(ctx, it.text, {maxWidth: mw, size, maxLines: 5}), size, maxLines: 5}).box;
    return {...it, iw, mwi: mw, w: b.w + iw, h: Math.max(b.h, iw ? iconS : 0)};
  });
  // four-column mode: the notes fill columns 3 and 4 beside the two route columns
  const noteLeg = it => ({key: it.key, kind: it.kind === 'loss' ? 'loss' : it.kind === 'guide' ? 'delta' : 'note', text: it.text, maxLines: Math.max(5, cfg.maxLines ?? 5),
    fill: it.kind === 'change' ? th.accentSoft : undefined, stroke: it.kind === 'change' ? th.accent : it.kind === 'guide' ? th.fg : undefined});
  let noteCols = null;
  // stack: the first `split` notes continue the right-hand column; the rest run full width under the scenes and the column
  const colNotes = stack && keyOn ? Math.min(noteItems.length, cfg.split ?? noteItems.length) : 0;
  if (colNotes) noteCols = [{x: rx, y: lgProbe.bottom + (cfg.dense || cfg.tight ? 8 : 18), w: rw, items: noteItems.slice(0, colNotes).map(noteLeg)}];
  else if (stack) noteCols = null;
  else if (nc && keyOn) {
    const all = noteItems.map(noteLeg);
    const per = Math.ceil(all.length / nc);
    noteCols = Array.from({length: nc}, (_, j) => ({x: MARGIN + (2 + j) * (colW + 30), y: 0, w: colW, items: all.slice(j * per, (j + 1) * per)}));
  }
  const nProbe = noteCols ? legendColumns(ctx, {cols: noteCols, size, maxLines: Math.max(5, cfg.maxLines ?? 5), gap: lgGap, padY: lgPad, prefix: 'ntp'}) : null;
  const belowChips = stack ? noteChips.slice(colNotes) : noteCols ? [] : noteChips;
  const notesProbe = flowRows(belowChips, {x: MARGIN, y: 0, w: D.w - 2 * MARGIN, gap: 18, rowGap: 9});
  if (lgProbe.truncated || (nProbe && nProbe.truncated)) return {bad: 'cut'};
  const legH = keyOn && !stack ? Math.max(lgProbe.bottom, nProbe ? nProbe.bottom : 0) + 12 : 0;
  const notesH = belowChips.length ? notesProbe.bottom + 10 : 0;
  if (stack && keyOn) {
    const colBottom = nProbe ? nProbe.bottom : lgProbe.bottom;
    if (colBottom > D.h - notesH) return {bad: 'column', over: colBottom - (D.h - notesH)};
  }
  const panelsH = D.h - legH - notesH;
  const PGAP = stack ? 14 : 20;
  const perPanel = row ? panelsH : (panelsH - PGAP) / 2;
  const stageH = perPanel - headH - BANDc - resH;
  if (stageH < 150) return {bad: 'stage', over: 150 - stageH};
  const V = fitVc(sw - (row ? 0 : 0), stageH, nMax);
  if (!V) return {bad: 'V', over: 1};
  if (cfg.dry) return {V, cfg: {...cfg, dry: false}};

  // ---- panels
  const panelY = row ? [0, 0] : [0, perPanel + PGAP];
  const heads = [0, 1].map(i => header(ctx, {name: `head${i}`, letter: i ? 'B' : 'A', label: scen[i].label, caption: scen[i].caption, x: panelX[i], y: panelY[i], w: sw, size, compact: stack}));
  const stages = [0, 1].map(i => concurrentStage(ctx, {prefix: i ? 'sb' : 'sa', box: {x: panelX[i], y: panelY[i] + headH + BANDc, w: sw, h: stageH}, V, C, locks: true, fitTop: false, vaseK: VASE_K, shoulder: VASE_SH, contactK: CONTACT_K, minPlinth: 5}));
  const locks = [locksOf(rel.a), locksOf(rel.b)];

  // ---- rings on the changed detail (the locked gate; a dashed ring on the matching free gate)
  const changedRoutes = ROUTES.filter(k => locks[0][k] !== locks[1][k]);
  const rings = [];
  const ringAt = [];
  [0, 1].forEach(i => {
    for (const k of changedRoutes) {
      const gt = stages[i].gateOf(k);
      const R = Math.max(stages[i].R * 2.6, 34);
      const cx = (gt.x + gt.marble.x) / 2, cy = (gt.y + gt.marble.y) / 2;
      ringAt.push({i, k, x: cx, y: cy, R, locked: locks[i][k]});
      rings.push(g({name: `ring${i}${k}`, opacity: 0},
        h('ellipse', {cx: r(cx), cy: r(cy), rx: r(R * 1.2), ry: r(R), fill: 'none', stroke: col.of(k), 'stroke-width': 4})));
    }
  });

  // ---- guide: from scene A's ring to scene B's ring for the first changed route, through the band above the racks
  let guide = null;
  if (changedRoutes.length) {
    const k0 = changedRoutes.includes('b') && rel.a === 'a' ? 'b' : changedRoutes[0];
    const A = ringAt.find(q => q.i === 0 && q.k === k0);
    const kB = rel.b === 'b' && changedRoutes.includes('a') ? 'a' : k0;
    const B = ringAt.find(q => q.i === 1 && q.k === kB);
    // the guide runs in the middle of the free band between each header and its racks
    const bandY = [0, 1].map(i => panelY[i] + headH + BANDc / 2 - 4);
    let pts;
    if (row) pts = [{x: A.x, y: A.y - A.R}, {x: A.x, y: bandY[0]}, {x: B.x, y: bandY[1]}, {x: B.x, y: B.y - B.R}];
    else {
      const xr = MARGIN + sw + GUIDE_ROOM * 0.55;
      pts = [{x: A.x, y: A.y - A.R}, {x: A.x, y: bandY[0]}, {x: xr, y: bandY[0]}, {x: xr, y: bandY[1]}, {x: B.x, y: bandY[1]}, {x: B.x, y: B.y - B.R}];
    }
    guide = orthoGuide(ctx, {name: 'guide', pts, color: th.fg, mR: Math.max(13, size * 0.55)});
  }

  // ---- results (equal chips under each stage)
  const results = keyOn ? [0, 1].map(i => {
    const b = resProbe[i].box;
    const x = panelX[i] + sw / 2 - b.w / 2;
    return chipG(ctx, resText(i), {x, y: stages[i].F + (cfg.tight ? FLOOR_T * 0.3 : FLOOR_T + 6), maxWidth: resW, size, maxLines: 3, name: `result${i}`, fill: th.card, stroke: th.fgSoft, opacity: 0});
  }) : [];

  // ---- legend + notes
  const scenesBottom = row ? panelsH : panelsH;
  const lg = keyOn ? legendColumns(ctx, {cols: cols0.map(c => ({...c, y: stack ? c.y : scenesBottom + 6})), size, maxLines: cfg.maxLines ?? (stack ? 5 : 3), gap: lgGap, padY: lgPad, prefix: 'lg'}) : {rows: []};
  const notesTop = keyOn ? (stack ? scenesBottom + 6 : lg.bottom + 14) : scenesBottom;
  const notes = [];
  if (noteCols) {
    const nl = legendColumns(ctx, {cols: noteCols.map(c => ({...c, y: stack ? c.y : scenesBottom + 6})), size, maxLines: Math.max(5, cfg.maxLines ?? 5), gap: lgGap, padY: lgPad, prefix: 'note'});
    notes.push(...nl.rows.map(rw => ({key: rw.key, kind: noteItems.find(q => q.key === rw.key).kind, node: rw.node})));
  }
  if (belowChips.length) notes.push(...flowRows(belowChips, {x: MARGIN, y: notesTop, w: D.w - 2 * MARGIN, gap: 18, rowGap: 9}).placed.map(it => {
    const mw = balancedG(ctx, it.text, {maxWidth: it.mwi, size, maxLines: 5});
    const c0 = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: mw, size, maxLines: 5});
    const c = chipG(ctx, it.text, {x: it.x + it.iw, y: it.y + (it.h - c0.box.h) / 2, maxWidth: mw, size, maxLines: 5,
      fill: it.kind === 'loss' ? th.accent3Soft : it.kind === 'change' ? th.accentSoft : th.card,
      stroke: it.kind === 'loss' ? th.accent3 : it.kind === 'change' ? th.accent : it.kind === 'guide' ? th.fg : th.inkSoft});
    let icon = null;
    const cy = it.y + it.h / 2;
    if (it.kind === 'loss') icon = g({transform: T(it.x + iconS * 0.5, cy + iconS / 2)}, vaseIcon(ctx, iconS));
    if (it.kind === 'guide') icon = changedMarker(ctx, {x: it.x + iconS / 2, y: cy, radius: iconS * 0.45});
    return {key: it.key, kind: it.kind, node: g({name: `note-${it.key}`, opacity: 0}, icon, c.node)};
  }));

  return {arr: cfg.arr, stages, heads, rings, ringAt, guide, results, lg, notes, V, size, row, locks, changedRoutes, sw, panelX, panelY, stageH, headH};
}

/** Vase icon (local origin = bottom centre). */
function vaseIcon(ctx, s) {
  const th = ctx.theme;
  const w = s * 0.62;
  const X = f => r(f * w), Y = f => r(-f * s);
  return h('path', {d: `M${X(-0.36)} 0H${X(0.36)}C${X(0.44)} ${Y(0.3)} ${X(0.49)} ${Y(0.6)} ${X(0.46)} ${Y(0.84)}H${X(0.5)}V${Y(1)}H${X(-0.5)}V${Y(0.84)}H${X(-0.46)}C${X(-0.49)} ${Y(0.6)} ${X(-0.44)} ${Y(0.3)} ${X(-0.36)} 0Z`, fill: th.accent3, stroke: th.ink, 'stroke-width': 2});
}

/** What is visible in one scene, relative to its own stage (so both scenes compare equal). */
function lookOf(S, stage, extra) {
  const rel = q => ({x: Math.round(q.x * 10) / 10, y: Math.round(q.y * 10) / 10});
  return {marbles: {a: rel(S.raw.a), b: rel(S.raw.b)}, state: S.state, joints: S.joints, cracked: S.cracked, gate: S.gateOpen, lock: S.lock, lossState: S.lossState, ...extra};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const C = resolveRoutes(p);
    const rel = {a: p.released.scenarioA, b: p.released.scenarioB};
    const base = {C, rel};
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 0.5) out.push(s); out.push(b); return out; };
    const cands = [];
    for (const sizes of [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)]) {
      for (const size of sizes) {
        for (const arr of SH.arr.filter(a2 => a2 !== 'stack' || ctx.show('key'))) {
          for (const cfg of arr === 'stack' ? [0.54, 0.57, 0.6, 0.64].flatMap(f => [9, 5, 4, 3, 2, 0].flatMap(split => [{arr, size, split, stackW: ctx.design.w * f}, {arr, size, split, stackW: ctx.design.w * f, dense: true}, {arr, size, split, stackW: ctx.design.w * f, tight: true}])) : arr === 'row' ? [{arr, size}, {arr, size, maxLines: 4}, {arr, size, noteCols: 1, maxLines: 5}, {arr, size, noteCols: 2}, {arr, size, noteCols: 2, maxLines: 5}, {arr, size, tight: true}, {arr, size, tight: true, maxLines: 4}, {arr, size, noteCols: 2, maxLines: 5, tight: true}, {arr, size, noteCols: 2, maxLines: 7, tight: true}, {arr, size, noteCols: 1, maxLines: 7, tight: true}] : [{arr, size}, {arr, size, maxLines: 4}, {arr, size, noteCols: 1, maxLines: 5}, {arr, size, maxLines: 6, tight: true}]) {
            const X = compose(ctx, base, {...cfg, dry: true});
            if (X.V) cands.push({cfg: X.cfg, V: X.V, size});
          }
        }
      }
      // square: keep looking down to 19.5 for the stacked arrangement (wider legend rows) before settling
      if (cands.length && !(ctx.view.shape === 'square' && ctx.show('key') && !cands.some(c => c.cfg.arr === 'stack') && sizes[0] > 19.5)) break;
    }
    let L;
    // square: the stacked arrangement (scenes >= 0.55 wide, one wide text column) wins whenever it fits at >= 19.5 px
    const stackC = cands.filter(c => c.cfg.arr === 'stack' && c.size >= 19.5);
    if (stackC.length) cands.splice(0, cands.length, ...stackC);
    if (cands.length) {
      const maxSize = Math.max(...cands.map(c => c.size));
      const lo = maxSize >= SH.baseMin ? Math.max(SH.baseMin, maxSize - 3) : maxSize;
      const pick = cands.filter(c => c.size >= lo - 1e-9).sort((a, b) => b.V - a.V || b.size - a.size)[0];
      L = compose(ctx, base, pick.cfg);
      L.kScale = 1;
      L.fallback = false;
    } else {
      // nothing fits at the text floor: grow a virtual design height, then scale into the box (reported by the tests)
      let found = null;
      for (let DH = ctx.design.h + 20; DH <= ctx.design.h * 3 && !found; DH += 20) {
        for (const arr of SH.arr) {
          for (const c4 of arr === 'row' ? [true, false] : [false]) {
            const X = compose(ctx, base, {arr, size: SH.minSize, maxLines: 5, cols4: c4, DH, dry: true});
            if (X.V) { found = X.cfg; break; }
          }
          if (found) break;
        }
      }
      L = compose(ctx, base, found);
      L.kScale = ctx.design.h / found.DH;
      L.fallback = true;
    }
    L.dx = (ctx.design.w - ctx.design.w * L.kScale) / 2;
    L.base = base;
    return L;
  },
  build(ctx, L) {
    return g({transform: L.kScale < 1 ? T(L.dx, 0, 0, L.kScale) : null},
      L.heads.map(hd => hd.node),
      L.stages.map(s => s.back),
      L.stages.map(s => s.main),
      L.rings,
      L.guide && L.guide.node,
      L.results.map(c => c.node),
      L.lg.rows.map(rw => rw.node),
      L.notes.map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const th = ctx.theme;
    const col = routeColors(ctx);
    const nodes = {};
    const tau = (u - W.start) / (W.strike - W.start);
    const gp = ease.inOutCubic(seg(u, ...W.gate));
    const lk = ease.inOutCubic(seg(u, ...W.lock));
    const sem = [0, 1].map(i => {
      const lock = L.locks[i];
      const gate = {a: lock.a ? 0 : gp, b: lock.b ? 0 : gp};
      const released = {a: !lock.a, b: !lock.b};
      const lockP = {a: lock.a ? lk : 0, b: lock.b ? lk : 0};
      const posed = L.stages[i].pose({a: tau, b: tau}, {gate, released, lock: lockP});
      Object.assign(nodes, posed.nodes);
      return posed.semantic;
    });
    // change beat: badges take their colours, captions appear; rings mark the changed detail
    const hp = seg(u, ...W.heads);
    L.heads.forEach((hd, i) => {
      // the badge takes the colour of the route run in that scene (ink when both run)
      const rr = i ? L.base.rel.b : L.base.rel.a;
      nodes[`head${i}-badge-disc`] = {fill: hp > 0.5 ? (rr === 'both' ? th.inkSoft : col.of(rr)) : th.inkFaint};
      nodes[`head${i}-text`] = {opacity: r(hp, 3)};
    });
    const rp = seg(u, ...W.rings);
    L.ringAt.forEach(q => { nodes[`ring${q.i}${q.k}`] = {opacity: r(rp, 3)}; });
    Object.assign(nodes, legendFrame(L.lg.rows, seg(u, ...W.legend)));
    const gd = ease.inOutCubic(seg(u, ...W.guide));
    if (L.guide) Object.assign(nodes, L.guide.frame(gd));
    const resP = seg(u, ...W.results);
    L.results.forEach((c, i) => { nodes[`result${i}`] = {opacity: r(resP, 3)}; });
    for (const c of L.notes) {
      const pr = c.kind === 'loss' ? seg(u, ...W.legend) : c.kind === 'change' ? seg(u, ...W.changeChip) : c.kind === 'key' ? seg(u, ...W.key) : c.kind === 'guide' ? seg(u, ...W.guide) : seg(u, ...W.notes);
      nodes[`note-${c.key}`] = {opacity: r(pr, 3)};
    }
    const changed = u >= W.heads[0];
    const [A, B] = sem;
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      released: {a: L.base.rel.a, b: L.base.rel.b},
      a: A, b: B,
      lookA: lookOf(A, L.stages[0], {head: changed ? 'A' : 'neutral', ring: r(rp, 3)}),
      lookB: lookOf(B, L.stages[1], {head: changed ? 'B' : 'neutral', ring: r(rp, 3)}),
      aMarbleA: A.marbles.a, aMarbleB: A.marbles.b, bMarbleA: B.marbles.a, bMarbleB: B.marbles.b,
      changedRoutes: L.changedRoutes,
      guideProgress: r(gd, 3),
      resultsShown: resP >= 1,
      layout: {V: r(L.V), vase: r(L.stages[0].Vv), size: r(L.size), row: L.row, arr: L.arr, k: r(L.kScale, 3), fallback: L.fallback, fits: L.stages.every(s => s.fits), stageW: r(L.sw), blockW: r(ctx.design.w - 2 * MARGIN)},
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
    slug: 'causation-03-contrast',
    title: 'Concurrent causes — Cause A run vs Cause B run, same model',
    titleEs: 'Causas concurrentes — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Causas concurrentes',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical two-route marble-run scenes. Only one fact differs: a padlock on the gate of the route that is not run (default: A runs route A, B runs route B). Both scenes then run in parallel and each running marble reaches the same vase from its own side. A guide with a neutral Δ joins the locked gates; equal weight, nothing added up, no winner, share or conclusion.',
    tags: ['causation', 'concurrent causes', 'comparison', 'two routes', 'same loss', 'side-by-side', 'stacked', 'marble run', 'padlock'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causas-concurrentes.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/prueba-contrafactual.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
