/**
 * LAW-0695 — Evento interviniente · contrast
 *
 * Storyboard (two complete copies of the same model stage; the two supposed
 * situations run side by side, in parallel, with the same take):
 *  0.00–0.17 base      Two identical stages: the same initial sequence of
 *                      tiles (die faces = supplied order), the same empty slot,
 *                      the same vase on its plinth, the same tethered pendulum
 *                      and the same later-event tile (◆) hanging in the bay of
 *                      each gantry. Headers "A · Initial sequence" and
 *                      "B · Later event" (lane badges). Nothing differs
 *                      (lookA = lookB, labels on or off).
 *  0.17–0.40 change    One localized change per scene, at the same moment and
 *                      with equal weight (identical solid rings mark the slot
 *                      in both): in A the bay latch drops, so the later event
 *                      stays in the bay; in B the crane carries the later
 *                      event along the beam and lowers it into the slot, opens
 *                      and rises.
 *  0.40–0.77 parallel  Both tethers drop at the same instant; the same take
 *                      runs in both. A: the tile before the slot reaches the
 *                      tile after it (initial sequence as supplied). B: the
 *                      sequence runs through the later event. Each follows its
 *                      SUPPLIED result (reaches the loss, or held unresolved
 *                      at a disputed link); the kit never infers it.
 *  0.77–1.00 guide     A guide with the neutral Δ marker joins the two slots —
 *                      the one changed detail — under the floors; each scene
 *                      shows its supplied result at equal weight; the changed
 *                      fact, the shared facts, the neutral note and the key
 *                      "As supplied · no conclusion drawn". No winner, score,
 *                      legal test, causation or outcome; nothing says the
 *                      later event breaks, replaces or shifts anything.
 * Side by side on wide boxes (each scene ≥ 40 % of the width); stacked on tall
 * boxes (each scene full width, the guide down the margin); square boxes:
 * stacked beside a right-hand text column, or side by side.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0695
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {contrastFields, obj} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {roundRectPath} from '../../core/geometry.js';
import {changedMarker} from '../../primitives/markers.js';
import {unionBounds} from './kits/place.js';
import {
  ieFields, resultField, IE_STRINGS, resolveIE, ieStage, ieGeom, fitIeH, STAGE_BELOW, wrapChoices,
  chipG, fitG, balancedG, ieLegend, legendFrame, modelItems,
} from './kits/evento-interviniente.js';

const ID = 'LAW-0695';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  legend: [0.02, 0.1], heads: [0, 0.06], rings: [0.18, 0.24], changeChip: [0.2, 0.26],
  latch: [0.18, 0.24], carry: [0.19, 0.32], lower: [0.32, 0.37], release: [0.37, 0.39], rise: [0.39, 0.43],
  start: 0.47, guide: [0.77, 0.84], results: [0.76, 0.81], notes: [0.8, 0.86], key: [0.82, 0.87],
};

const sceneSchema = {
  ...ieFields,
  ...contrastFields(),
  results: obj('SUPPLIED final state of each scene (the animation never infers it)', {
    a: resultField('Scene A (initial sequence, the later event stays in the bay)'),
    b: resultField('Scene B (the later event enters the sequence)'),
  }),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+2 min'},
    {label: 'Display stand shakes', time: 'T+3 min'},
  ],
  addedEvent: {label: 'Cleaner nudges the stand', time: 'T+2 min', after: 1},
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  scenarioA: {label: 'Initial sequence', caption: 'The later event stays in the bay'},
  scenarioB: {label: 'Later event', caption: 'The later event enters after event 2'},
  changedFact: 'Only difference: whether the later event enters the sequence',
  sharedFacts: ['Same four events', 'Same spacing and trigger', 'Same vase'],
  comparisonLabels: {guide: 'Changed detail: the slot after event 2', neutral: 'Two runs of the same model side by side — no winner and no conclusion'},
  results: {a: 'reaches-loss', b: 'reaches-loss'},
};

const SHAPES = {
  landscape: {size: 24, baseMin: 20, minSize: 17, arrs: ['row']},
  square: {size: 24, baseMin: 20, minSize: 17, arrs: ['side', 'row', 'column']},
  portrait: {size: 25, baseMin: 20.5, minSize: 17, arrs: ['column']},
};
const GX = 56; // gap between side-by-side scenes
const GUIDE_ROOM = 54; // stacked: room right of the stages for the guide's vertical run
const PGAP = 26; // stacked: gap between the scenes
const H_MIN = 96;
const H_MIN_SQ = 80; // stacked beside the text column (1:1): two whole stages and every field at >= 19.5 px

/** Orthogonal guide with rounded corners (draws on; no arrowhead). */
function orthoGuide(ctx, {name, pts, color}) {
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
  const from = pts[0], to = pts[pts.length - 1];
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${name}-dotA`, cx: r(from.x), cy: r(from.y), r: 6.5, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(to.x), cy: r(to.y), r: 6.5, fill: color, opacity: 0}));
  const frame = p => ({
    [name]: {opacity: p > 0 ? 1 : 0},
    [`${name}-line`]: {'stroke-dashoffset': r(len * (1 - p))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame};
}

/** Scene header: lane badge (letter) + label + caption. */
function header(ctx, {name, letter, color, label, caption, x, y, w, size}) {
  const th = ctx.theme;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const R = Math.max(size * 0.85, 19);
  const tx = x + 2 * R + 14;
  const tw = w - 2 * R - 14;
  const f1 = keyOn ? fitG(ctx, label, {maxWidth: tw, size, minSize: size, maxLines: 2, weight: 700}) : null;
  const f2 = allOn && caption ? fitG(ctx, caption, {maxWidth: tw, size, minSize: size, maxLines: 2, weight: 500}) : null;
  const th1 = f1 ? f1.height : 0, th2 = f2 ? f2.height + 6 : 0;
  const hh = Math.max(2 * R, th1 + th2);
  const cy = y + hh / 2;
  const node = g({name},
    h('circle', {cx: r(x + R), cy: r(cy), r: r(R), fill: color, stroke: th.ink, 'stroke-width': 2.5}),
    keyOn ? h('text', {x: r(x + R), y: r(cy + R * 0.42), 'text-anchor': 'middle', 'font-size': r(R * 1.15), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, letter) : null,
    f1 ? textBlock(f1, {x: tx, y: y + (hh - th1 - th2) / 2, fill: th.fg}) : null,
    f2 ? textBlock(f2, {x: tx, y: y + (hh - th1 - th2) / 2 + th1 + 6, fill: th.fgSoft}) : null);
  return {node, h: hh, bad: (f1 && (f1.truncated || f1.broken)) || (f2 && (f2.truncated || f2.broken))};
}

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M, lossCount} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const size = cfg.size;
  const arr = cfg.arr;
  const row = arr === 'row';
  const wrapM = cfg.wrapM ?? null;
  const sideW = arr === 'side' && keyOn ? Math.round(D.w * cfg.sideF) : 0;
  const colors = [th.accent4, th.accent2];
  const GR = sideW ? 30 : GUIDE_ROOM; // (beside a text column the guide's vertical run takes a narrower gutter)
  const sw = row ? (D.w - GX) / 2 : D.w - GR - (sideW ? sideW + 4 : 0);
  const panelX = row ? [0, sw + GX] : [0, 0];
  // stacked beside a text column: each scene keeps >= 0.55 of the frame width (AUTHORING item 20)
  // stacked beside a text column: each scene keeps >= 0.55 of the FRAME width (AUTHORING item 20 threshold)
  const FwD = ctx.view.width / Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
  if (sideW && sw < 0.55 * FwD) return {bad: 'sw'};
  // results: under each plinth (side by side) or at the right end of each header (stacked); equal boxes
  const resTexts = [p.results.a, p.results.b].map(v => (v === 'reaches-loss' ? t.reaches : t.held));
  const resW = row && !cfg.resHead ? Math.min(sw * 0.8, 560) : Math.min(sw * 0.44, 460);
  const resFits = keyOn ? resTexts.map(tx => chipG(ctx, tx, {x: 0, y: 0, maxWidth: resW, size, maxLines: 3})) : [];
  if (resFits.some(c => c.fit.truncated || c.fit.broken)) return {bad: 'res'};
  const RW = keyOn ? Math.max(...resFits.map(c => c.box.w)) : 0, RH = keyOn ? Math.max(...resFits.map(c => c.box.h)) : 0;
  const resInCol = Boolean(sideW) && !cfg.resHead;
  const resInHead = !resInCol && (!row || cfg.resHead);
  const headW = !resInHead ? sw : sw - (keyOn ? RW + 20 : 0);
  const heads0 = [0, 1].map(i => header(ctx, {name: `head${i}`, letter: i ? 'B' : 'A', color: colors[i], label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption, x: 0, y: 0, w: headW, size}));
  if (heads0.some(hd => hd.bad)) return {bad: 'head'};
  const headH = Math.max(heads0[0].h, heads0[1].h, resInHead ? RH : 0);
  // the guide chip: on the guide under the floors (side by side), in the shared text otherwise
  const gw = row ? Math.min(620, GX + sw * 0.8) : (sideW || D.w) * 0.9;
  const gProbe = keyOn ? chipG(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: gw, size, maxLines: 3}) : null;
  if (gProbe && (gProbe.fit.truncated || gProbe.fit.broken)) return {bad: 'guide'};
  const gR = size * 0.62;
  const gH = gProbe ? gProbe.box.h : 2 * gR + 6;
  const runGap = row ? 22 + gH / 2 : 18;
  const underH = row ? runGap + gH / 2 + (keyOn && !resInHead ? 10 + RH : 8) : runGap + 10;

  // ---- shared text (below the scenes, or in the right column)
  const items = keyOn ? modelItems(ctx, M) : [];
  const footW = sideW || D.w;
  const footX = sideW ? D.w - sideW : 0;
  const lg0 = items.length ? ieLegend(ctx, items, {x: 0, y: 0, w: footW, cols: sideW ? 1 : cfg.cols, size, maxLines: cfg.maxLines ?? 3, prefix: 'lg', gap: cfg.gap ?? 10, padY: cfg.padY}) : {rows: [], h: 0};
  if (lg0.truncated) return {bad: 'legend'};
  const noteList = [];
  if (keyOn) {
    if (resInCol) [0, 1].forEach(i => noteList.push({key: `res${i}`, text: `${i ? 'B' : 'A'} · ${resTexts[i]}`, stroke: colors[i], mw: footW}));
    if (!row) noteList.push({key: 'guide', text: p.comparisonLabels.guide, stroke: th.fg, mw: sideW ? footW : footW * 0.56, icon: true});
    noteList.push({key: 'change', text: p.changedFact, fill: th.accentSoft, stroke: th.accent, mw: sideW ? footW : footW * 0.48});
    if (allOn && p.sharedFacts.length) noteList.push({key: 'shared', text: `${t.sameFacts}: ${p.sharedFacts.join(' · ')}`, mw: sideW ? footW : footW * 0.48});
    if (allOn && p.comparisonLabels.neutral) noteList.push({key: 'neutral', text: p.comparisonLabels.neutral, mw: sideW ? footW : footW * 0.56});
    noteList.push({key: 'key', text: t.key, stroke: th.inkSoft, mw: sideW ? footW : footW * 0.4});
  }
  const noteBoxes = noteList.map(c => {
    const iw = c.icon ? 2 * gR + 10 : 0;
    const bw = balancedG(ctx, c.text, {maxWidth: c.mw - iw, size, maxLines: 5});
    const pr = chipG(ctx, c.text, {x: 0, y: 0, maxWidth: bw, size, maxLines: 5, padY: cfg.padY});
    return {...c, iw, bw, w: pr.box.w + iw, h: pr.box.h, bad: pr.fit.truncated || pr.fit.broken};
  });
  if (noteBoxes.some(c => c.bad)) return {bad: 'notes'};
  const flow = y0 => {
    const out = [];
    let y = y0, x = 0, rowItems = [], rowH = 0;
    const flush = () => {
      const tw = rowItems.reduce((a, c) => a + c.w, 0) + 20 * (rowItems.length - 1);
      let xx = footX + (footW - tw) / 2;
      for (const c of rowItems) { out.push({...c, x: xx, y: y + (rowH - c.h) / 2}); xx += c.w + 20; }
      y += rowH + (cfg.rowGap ?? 12); x = 0; rowItems = []; rowH = 0;
    };
    for (const c of noteBoxes) {
      if (rowItems.length && x + 20 + c.w > footW) flush();
      x += (rowItems.length ? 20 : 0) + c.w; rowItems.push(c); rowH = Math.max(rowH, c.h);
    }
    if (rowItems.length) flush();
    return {out, bottom: y - (cfg.rowGap ?? 12)};
  };
  const notesH = noteBoxes.length ? flow(0).bottom : 0;
  const textH = (lg0.h ? lg0.h + (cfg.rowGap ?? 16) : 0) + notesH;
  if (sideW && textH > D.h) return {bad: 'col', over: textH - D.h};

  // ---- scene size
  let H;
  if (row) H = fitIeH(M.N, sw - 8, D.h - (sideW ? 0 : textH + 16) - headH - 12 - underH, 400, lossCount, wrapM);
  else {
    const avail = (sideW ? D.h : D.h - textH - 16) - PGAP;
    H = fitIeH(M.N, sw - 8, avail / 2 - headH - 12 - underH, 400, lossCount, wrapM);
  }
  if (!H || H < (cfg.hMin ?? (ctx.view.shape === 'square' ? H_MIN_SQ : H_MIN))) return {bad: 'H', H};
  const gm = ieGeom(M.N, H, lossCount, wrapM);
  const stageH = gm.above + gm.below;
  const panelH = headH + 12 + stageH + underH;
  if (cfg.dry) return {H, size, area: gm.width * stageH, cfg: {...cfg, dry: false}};

  const scenesH = row ? panelH : 2 * panelH + PGAP;
  // (stacked beside the text column: the two scenes are centred in the height the column takes)
  const y0 = sideW ? Math.max(0, (D.h - scenesH) / 2) : 0;
  const panelY = row ? [0, 0] : [y0, y0 + panelH + PGAP];
  const heads = [0, 1].map(i => header(ctx, {name: `head${i}`, letter: i ? 'B' : 'A', color: colors[i], label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption, x: panelX[i], y: panelY[i] + (headH - heads0[i].h) / 2, w: headW, size}));
  const stageOff = Math.max(0, (sw - gm.width) / 2);
  const stages = [0, 1].map(i => ieStage(ctx, {prefix: i ? 'sb' : 'sa', x: panelX[i] + stageOff, span: [panelX[i] + 8, panelX[i] + sw - 4], floorY: panelY[i] + headH + 12 + gm.above, H, M, lossCount, take: base.take, hold: base.holds[i], wrapM}));
  const F = stages.map(s0 => s0.floorY);
  const bottoms = stages.map(s0 => s0.plinth.floorY + STAGE_BELOW);
  const ringR = {rx: Math.max(stages[0].w * 1.6, H * 0.34), ry: H * 0.64};
  const ringC = stages.map((s0, i) => ({x: s0.slotX, y: F[i] - H * 0.5}));
  // identical solid rings in both scenes (lane colours, same weight): the slot is the one place that differs
  const rings = [0, 1].map(i => g({name: `ring${i}`, opacity: 0, transform: T(ringC[i].x, ringC[i].y)},
    h('ellipse', {rx: r(ringR.rx), ry: r(ringR.ry), fill: 'none', stroke: colors[i], 'stroke-width': 4.5})));

  // ---- guide: side by side = under the floors; stacked = under each floor, then down the right margin.
  // Two-level stages: from the top of each ring, just above the tile tops (the tiles lie down by then)
  let pts;
  const underY = bottoms.map(b0 => b0 + runGap);
  if (wrapM) {
    const gy = F.map(f => f - H * 1.08);
    if (row) pts = [{x: ringC[0].x, y: ringC[0].y - ringR.ry}, {x: ringC[0].x, y: gy[0]}, {x: ringC[1].x, y: gy[1]}, {x: ringC[1].x, y: ringC[1].y - ringR.ry}];
    else {
      const xr = sw + GR * 0.55;
      pts = [{x: ringC[0].x + ringR.rx, y: ringC[0].y}, {x: xr, y: ringC[0].y}, {x: xr, y: ringC[1].y}, {x: ringC[1].x + ringR.rx, y: ringC[1].y}];
    }
  } else if (row) pts = [{x: ringC[0].x, y: bottoms[0] + 2}, {x: ringC[0].x, y: underY[0]}, {x: ringC[1].x, y: underY[1]}, {x: ringC[1].x, y: bottoms[1] + 2}];
  else {
    const xr = sw + GR * 0.55;
    pts = [{x: ringC[0].x, y: bottoms[0] + 2}, {x: ringC[0].x, y: underY[0]}, {x: xr, y: underY[0]}, {x: xr, y: underY[1]}, {x: ringC[1].x, y: underY[1]}, {x: ringC[1].x, y: bottoms[1] + 2}];
  }
  const guide = orthoGuide(ctx, {name: 'guide', pts, color: th.fg});
  let guideChip = null;
  if (row) {
    const gcw = (gProbe ? gProbe.box.w + 8 : 0) + 2 * gR;
    const gcx = (ringC[0].x + ringC[1].x) / 2;
    const gcy = wrapM ? underY[0] : underY[0];
    const gc = keyOn ? chipG(ctx, p.comparisonLabels.guide, {x: gcx - gcw / 2 + 2 * gR + 8, y: gcy - gH / 2, maxWidth: gw, size, maxLines: 3, stroke: th.fg}) : null;
    guideChip = {node: g({name: 'guide-chip', opacity: 0}, changedMarker(ctx, {x: gcx - gcw / 2 + gR, y: gcy, radius: gR}), gc && gc.node), box: {x: gcx - gcw / 2, y: gcy - gH / 2, w: gcw, h: gH}};
  } else if (!keyOn) {
    // labels hidden: the Δ marker sits on the guide's vertical run
    const xr = pts[2].x;
    const cy = (pts[1].y + pts[2].y) / 2;
    guideChip = {node: g({name: 'guide-chip', opacity: 0}, changedMarker(ctx, {x: xr, y: cy, radius: gR})), box: {x: xr - gR, y: cy - gR, w: 2 * gR, h: 2 * gR}};
  }

  // ---- results (equal boxes: under each plinth side by side, at the right end of each header stacked)
  const results = keyOn && !resInCol ? [0, 1].map(i => {
    const st2 = stages[i];
    const x = !resInHead ? Math.min(panelX[i] + sw - RW, Math.max(panelX[i], st2.plinth.x + st2.plinth.w / 2 - RW / 2)) : panelX[i] + sw - RW;
    const y = !resInHead ? underY[i] + gH / 2 + 10 : panelY[i] + (headH - RH) / 2;
    const f = resFits[i].fit;
    const node = g({name: `result${i}`, opacity: 0},
      h('path', {d: roundRectPath(x, y, RW, RH, Math.min(RH / 2, size * 0.7)), fill: th.card, stroke: colors[i], 'stroke-width': 2.5}),
      textBlock(f, {x: x + RW / 2, y: y + (RH - f.height) / 2, anchor: 'middle', fill: th.ink}));
    return {node, box: {x, y, w: RW, h: RH}};
  }) : [];

  const footY = sideW ? Math.max(0, (Math.max(D.h, scenesH) - textH) / 2) : scenesH + 16;
  const lg = items.length ? ieLegend(ctx, items, {x: footX, y: footY, w: footW, cols: sideW ? 1 : cfg.cols, size, maxLines: cfg.maxLines ?? 3, prefix: 'lg', gap: cfg.gap ?? 10, padY: cfg.padY}) : {rows: [], h: 0};
  const placedNotes = flow(footY + (lg.h ? lg.h + (cfg.rowGap ?? 16) : 0)).out;
  const notes = placedNotes.map(c => {
    const ch = chipG(ctx, c.text, {x: c.x + c.iw, y: c.y, maxWidth: c.bw, size, maxLines: 5, fill: c.fill, stroke: c.stroke, padY: cfg.padY});
    const mk = c.icon ? changedMarker(ctx, {x: c.x + gR, y: c.y + c.h / 2, radius: gR}) : null;
    return {key: c.key, node: g({name: `note-${c.key}`, opacity: 0}, mk, ch.node), box: {x: c.x, y: c.y, w: c.w, h: c.h}};
  });
  const blockW = row ? D.w : sw + GR;
  const ext = unionBounds([{x: 0, y: 0, w: sideW ? D.w : blockW, h: scenesH + y0}, ...results.map(c => c.box), guideChip && guideChip.box, ...lg.rows.map(rw => rw.box), ...notes.map(c => c.box)]);
  return {stages, heads, rings, guide, guideChip, results, lg, notes, ext, H, size, row, arr: arr === 'side' && !sideW ? 'column' : arr, sw, sideW, stageW: gm.width, cfg};
}

/** What is visible in one scene, in its own coordinates (relative to its stage origin). */
function lookOf(S, st) {
  return {
    angles: S.angles, started: S.started, lossState: S.lossState, cracked: S.cracked, joints: S.joints.map(Boolean), bridge: Boolean(S.bridge), ghost: S.ghost,
    carry: S.carry, lower: S.lower, grip: S.grip, latch: S.latch, placed: S.placed,
    claw: [Math.round(S.claw.x - st.x0), Math.round(S.claw.y - st.floorY)], bob: [Math.round(S.bob.x - st.x0), Math.round(S.bob.y - st.floorY)],
    added: [Math.round(S.addedTop.x - st.x0), Math.round(S.addedTop.y - st.floorY)],
  };
}

/** Last resort (nothing fits at the text floor): compose in a taller virtual box; the result is scaled into the real one (k < 1, reported). */
function fallbackCompose(ctx, base, cfgs, ok) {
  for (let f = 1; f <= 3.01; f += 0.1) {
    const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
    for (const cfg of cfgs) { const X = compose(c2, base, cfg); if (ok(X)) { X.ctx2 = c2; return X; } }
  }
  return null;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveIE(p);
    const lossCount = Math.min(2, p.losses.length);
    // unresolved scenes hold at the first supplied disputed link (the later event's out-link if none is supplied)
    const anyHeld = p.results.a !== 'reaches-loss' || p.results.b !== 'reaches-loss';
    if (anyHeld && M.disputed === null) { M.links[M.k] = {...M.links[M.k], status: 'disputed'}; M.disputed = M.k; }
    const holds = [{with: null, without: p.results.a !== 'reaches-loss' ? M.disputed : null}, {with: p.results.b !== 'reaches-loss' ? M.disputed : null, without: null}];
    const d = Math.min(0.042, 0.26 / (M.N + 1));
    const take = {start: W.start, d, swing: 0.05};
    const base = {M, lossCount, take, holds};
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 1) out.push(s); out.push(b); return out; };
    const wraps = [null, ...(ctx.view.shape === 'portrait' ? wrapChoices(M.N, M.k) : [])];
    const cfgsFor = (arr, size) => wraps.flatMap(wrapM => (arr === 'side'
      ? [0.3, 0.32, 0.34, 0.36].flatMap(sideF => [{arr, size, sideF, wrapM}, {arr, size, sideF, wrapM, maxLines: 5, gap: 8}, {arr, size, sideF, wrapM, maxLines: 6, gap: 5, padY: 5, rowGap: 7}, {arr, size, sideF, wrapM, maxLines: 6, gap: 5, padY: 5, rowGap: 7, resHead: true}, {arr, size, sideF, wrapM, maxLines: 7, gap: 4, padY: 4, rowGap: 5, resHead: true}])
      : [2, 3, 4].flatMap(cols => [{arr, size, cols, wrapM}, {arr, size, cols, wrapM, maxLines: 5, gap: 8}, ...(arr === 'row' ? [{arr, size, cols, wrapM, resHead: true}, {arr, size, cols, wrapM, maxLines: 5, gap: 8, resHead: true}] : [])])));
    let pick = null;
    const why = [];
    for (const sizes of [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)]) {
      const cands = [];
      for (const size of sizes) {
        for (const arr of ctx.show('key') ? SH.arrs : SH.arrs) {
          for (const cfg of cfgsFor(arr, size)) {
            const X = compose(ctx, base, {...cfg, dry: true});
            if (X.cfg) cands.push(X); else why.push(`${arr}${cfg.wrapM ?? ""}${cfg.sideF ?? cfg.cols}@${size}:${X.bad}${X.over ? "+" + Math.round(X.over) : ""}${X.H ? Math.round(X.H) : ''}`);
          }
        }
      }
      if (cands.length) {
        const maxSize = Math.max(...cands.map(c => c.size));
        const lo = Math.max(sizes[sizes.length - 1], maxSize - 3);
        pick = cands.filter(c => c.size >= lo - 1e-9).sort((a, b) => b.area - a.area || b.size - a.size)[0];
        break;
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    if (!L) {
      L = fallbackCompose(ctx, base, SH.arrs.map(a2 => ({arr: a2, size: SH.minSize, cols: 3, sideF: 0.45, maxLines: 6, gap: 5, padY: 5, rowGap: 7})), X => Boolean(X.stages));
    }
    L.fallback = !pick;
    L.why = why.filter(w0 => /@20:/.test(w0));
    L.M = M;
    const D = ctx.design;
    const e = L.ext;
    L.k = Math.min(1, D.w / e.w, D.h / e.h);
    L.dx = (D.w - e.w * L.k) / 2 - e.x * L.k;
    L.dy = (D.h - e.h * L.k) / 2 - e.y * L.k;
    return L;
  },
  build(ctx, L) {
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.stages.map(s0 => s0.back),
      L.rings,
      L.stages.map(s0 => s0.main),
      L.heads.map(hd => hd.node),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.results.map(c => c.node),
      L.lg.rows.map(rw => rw.node),
      L.notes.map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const [A, B] = L.stages;
    const pa = A.pose('without', u, {latch: seg(u, ...W.latch)});
    const pb = B.pose('with', u, {carry: seg(u, ...W.carry), lower: seg(u, ...W.lower), grip: 1 - seg(u, ...W.release), rise: seg(u, ...W.rise), latch: 0});
    Object.assign(nodes, pa.nodes, pb.nodes);
    const rp = seg(u, ...W.rings);
    L.rings.forEach((_, i) => { nodes[`ring${i}`] = {opacity: r(rp, 3)}; });
    Object.assign(nodes, legendFrame(L.lg.rows, seg(u, ...W.legend)));
    const gd = ease.inOutCubic(seg(u, ...W.guide));
    Object.assign(nodes, L.guide.frame(gd));
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(seg(u, ...W.guide), 3)};
    const resP = seg(u, ...W.results);
    L.results.forEach((_, i) => { nodes[`result${i}`] = {opacity: r(resP, 3)}; });
    for (const c of L.notes) {
      const pr = c.key.startsWith('res') ? seg(u, ...W.results) : c.key === 'guide' ? seg(u, ...W.guide) : c.key === 'change' ? seg(u, ...W.changeChip) : c.key === 'key' ? seg(u, ...W.key) : c.key === 'shared' ? seg(u, ...W.legend) : seg(u, ...W.notes);
      nodes[`note-${c.key}`] = {opacity: r(pr, 3)};
    }
    const SA = pa.semantic, SB = pb.semantic;
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      lookA: {...lookOf(SA, A), ring: r(rp, 3)},
      lookB: {...lookOf(SB, B), ring: r(rp, 3)},
      a: {angles: SA.angles, lossState: SA.lossState, cracked: SA.cracked, placed: SA.placed, latch: SA.latch, bridge: SA.bridge, joints: SA.joints, ghost: SA.ghost, claw: SA.claw, addedTop: SA.addedTop},
      b: {angles: SB.angles, lossState: SB.lossState, cracked: SB.cracked, placed: SB.placed, latch: SB.latch, joints: SB.joints, ghost: SB.ghost, claw: SB.claw, addedTop: SB.addedTop, carry: SB.carry},
      aClaw: SA.claw, bClaw: SB.claw, aAdded: SA.addedTop, bAdded: SB.addedTop, aBob: SA.bob, bBob: SB.bob,
      k: L.M.k, N: L.M.N,
      guideProgress: r(gd, 3),
      resultsShown: resP >= 1 && (L.results.length === 2 || L.notes.filter(c => c.key.startsWith('res')).length === 2),
      results: ctx.params.results,
      layout: {frameW: r(ctx.view.width / Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h)), ext: L.ext, D: ctx.design, H: r(L.H), size: r(L.size), k: r(L.k, 3), row: L.row, arr: L.arr, stageW: r(L.stageW), sw: r(L.sw), blockW: r(ctx.design.w), sideW: L.sideW, fallback: L.fallback, why: L.why},
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
    slug: 'causation-04-contrast',
    title: 'Intervening event — the initial sequence and the same model with a later event, side by side',
    titleEs: 'Evento interviniente — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Evento interviniente',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical model stages. Only one fact differs: in A the bay latch keeps the later event’s tile parked; in B the crane carries it into the slot between two supplied events. Both then run the same take in parallel, each following its supplied result. A guide with a neutral Δ joins the two slots; equal weight, no winner, no legal test and no conclusion.',
    tags: ['causation', 'intervening event', 'later event', 'contrast', 'paired scenes', 'as supplied', 'dominoes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/evento-interviniente.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: IE_STRINGS,
  scene,
});
