/**
 * LAW-0687 — Prueba contrafactual causal · contrast
 *
 * Storyboard (two complete copies of the same model stage; no rewind — the
 * two supposed situations run side by side, in parallel):
 *  0.00–0.17 base      Two identical stages: the same tiles in the supplied
 *                      order, the same vase on its plinth, the same tethered
 *                      pendulum, the same claw parked over the SELECTED event.
 *                      Both header badges are neutral grey; the shared legend
 *                      of events sits below. Nothing differs (lookA = lookB).
 *  0.17–0.40 change    The headers take their lane colours and labels
 *                      ("Event present" / "event removed from the model").
 *                      Rings mark the selected event in both scenes (solid in
 *                      A, dashed in B). ONLY in B the claw lowers, grips the
 *                      tile and lifts it clear of the model; a dashed outline
 *                      stays in B's empty slot. A's claw stays parked.
 *  0.40–0.77 parallel  Both tethers drop at the same instant and the same take
 *                      runs in both (same speed, same frames) — identical
 *                      until B's gap. A: the chain reaches the vase, which
 *                      cracks. B: follows the SUPPLIED result — the tile
 *                      before the gap either reaches the tile after it (loss
 *                      still occurs) or lies in the empty slot while
 *                      everything downstream stays standing (loss does not
 *                      occur). The kit never infers it.
 *  0.77–1.00 guide     A guide (with the neutral Δ marker) joins the two slots
 *                      — the one changed detail — under the floors; each
 *                      scene shows its supplied result at equal weight; the
 *                      changed fact, the shared facts, the neutral note and
 *                      the key "As supplied · no conclusion drawn". No winner,
 *                      score, legal test, causation or outcome.
 * Side by side on wide boxes (each scene ≥ 40 % of the width); stacked on
 * square and tall boxes (each scene full width), the guide down the margin.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0687
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {roundRectPath} from '../../core/geometry.js';
import {changedMarker} from '../../primitives/markers.js';
import {unionBounds} from './kits/place.js';
import {
  cfFields, resultField, CF_STRINGS, resolveModel, cfStage, stageMetrics, stageAbove, STAGE_BELOW, fitStageH, stageGeom, fitGeomH, wrapChoices,
  chipG, fitG, balancedG, legend, legendFrame,
} from './kits/prueba-contrafactual.js';

const ID = 'LAW-0687';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const TAKE = {start: 0.05, strike: 0.21, T: 0.3};
const W = {
  legend: [0.02, 0.1], heads: [0.17, 0.22], rings: [0.18, 0.24], changeChip: [0.2, 0.26],
  drop: [0.22, 0.28], grip: [0.28, 0.295], lift: [0.295, 0.35], slot: [0.33, 0.37],
  run: [0.4, 0.72], guide: [0.77, 0.84], results: [0.76, 0.81], notes: [0.8, 0.86], key: [0.82, 0.87],
};

const sceneSchema = {
  ...cfFields,
  ...contrastFields(),
  withoutResult: resultField('SUPPLIED result of scenario B (the replay without the selected event); the animation never infers it'),
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
  selectedEvent: 1,
  withoutResult: 'loss-does-not-occur',
  scenarioA: {label: 'Event present', caption: 'Event 2 stays in the model'},
  scenarioB: {label: 'Event removed from the model', caption: 'Event 2 is lifted out; the same run is repeated'},
  changedFact: 'Only event 2 differs: present in A, removed from the model in B',
  sharedFacts: ['Same events, order and spacing', 'Same trigger and timing', 'Same loss object'],
  comparisonLabels: {guide: 'Changed fact: event 2', neutral: 'Two runs of the model compared — no winner and no conclusion'},
};

const ARRANGE = {landscape: 'row', square: 'column', portrait: 'column'};
const SHAPES = {
  landscape: {size: 27, baseMin: 24, minSize: 20, maxH: 300},
  // design scale ≈ 0.62 (1:1) and 0.87 (9:16): baseMin → 19.5 px, minSize → 16 px at 1080p
  square: {size: 33, baseMin: 31.8, minSize: 26.2, maxH: 260},
  portrait: {size: 30, baseMin: 22.6, minSize: 18.5, maxH: 260},
};
const GAP_X = 70;
const GAP_X_SQ = 120; // square boxes: side-by-side floors kept clearly apart
const GUIDE_ROOM = 54; // stacked: room right of the stages for the guide's vertical run
const FONT = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

/** Scenario header: lane badge (neutral until the change beat) + label + caption. */
function header(ctx, o) {
  const th = ctx.theme;
  const size = o.size * (o.headK ?? 1.2);
  const letter = Math.max(size * 0.95, o.size * 1.05); // the badge letter is never smaller than the text
  const R = Math.max(size * 0.72, letter * 0.72);
  const parts = [];
  const badge = g({name: `${o.name}-badge`},
    h('circle', {name: `${o.name}-disc`, cx: r(o.x + R), cy: r(o.y + R + 2), r: r(R), fill: th.inkFaint, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: r(o.x + R), y: r(o.y + R + 2 + letter * 0.34), 'text-anchor': 'middle', 'font-size': r(letter), 'font-weight': 800, 'font-family': FONT, fill: '#fff'}, o.letter) : null);
  parts.push(badge);
  const tx = o.x + 2 * R + 16;
  const mw = o.w - 2 * R - 16;
  let y = o.y;
  let hh = 2 * R + 4;
  const texts = [];
  if (ctx.show('key')) {
    const f = fitG(ctx, o.label, {maxWidth: mw, size, minSize: size, maxLines: 2, weight: 700});
    texts.push(textBlock(f, {x: tx, y: y + Math.max(0, (2 * R - f.height) / 2) * (f.lines.length === 1 ? 1 : 0), fill: th.fg}));
    y += Math.max(f.height + 8, f.lines.length === 1 ? 2 * R + 6 : 0);
  }
  if (o.caption && ctx.show('all')) {
    const f2 = fitG(ctx, o.caption, {maxWidth: mw, size: o.size, minSize: o.size, maxLines: 3, weight: 500});
    texts.push(textBlock(f2, {x: tx, y, fill: th.fgSoft}));
    y += f2.height + 6;
  }
  hh = Math.max(hh, y - o.y);
  const node = g({name: o.name}, badge, g({name: `${o.name}-text`, opacity: 0}, texts));
  return {node, h: hh, box: {x: o.x, y: o.y, w: o.w, h: hh}};
}

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
  return {node, frame, len, pts};
}

function compose(ctx, base, H0, size, cfg = {}) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M, lossCount} = base;
  const GX = ctx.view.shape === 'square' ? GAP_X_SQ : GAP_X;
  const arrangement = cfg.arr ?? base.arrangement;
  const H = Math.max(100, H0);
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  // cfg.side: stacked stages in a left column, shared text in a right column of that width (1:1 fallback)
  let sideW = cfg.side ?? 0;
  const row = arrangement === 'row' && !sideW;
  const m = {...stageMetrics(M.n, H, lossCount, M.gap), width: stageGeom(M.n, H, lossCount, M.gap, cfg.wrapM ?? null).width};
  // each panel takes its full share of the width (the stage is centred in it)
  let sw = row ? (D.w - GX) / 2 - 14 : D.w - GUIDE_ROOM - 22 - (sideW ? sideW + 36 : 0);
  // stacked stages beside a text column: a short chain (tiles at their largest) keeps a column its own width;
  // the text column takes the rest
  if (sideW && m.width < 0.71 * sw) { const sw2 = m.width / 0.8; sideW += sw - sw2; sw = sw2; }
  const stageOff = Math.max(0, (sw - m.width) / 2);
  const colors = [th.accent4, th.accent2];

  // ---- panels: header + stage + (guide run, result chip) under the floor
  const panelX = row ? [0, sw + GX] : [0, 0];
  const heads = [0, 1].map(i => header(ctx, {name: `head${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption, x: panelX[i], y: 0, w: sw - (row ? 0 : GUIDE_ROOM) + (row ? 0 : GUIDE_ROOM * 0.6), size, headK: cfg.headK}));
  const headH = Math.max(heads[0].h, heads[1].h);
  const resTexts = [t.withOccurs, M.reach ? t.occurs : t.notOccurs];
  const resW = row ? Math.min(sw * 0.72, 560) : Math.min(sw * 0.9, 760); // (stacked: one result per full-width panel)
  const resProbe = keyOn ? resTexts.map(tx => chipG(ctx, tx, {x: 0, y: 0, maxWidth: resW, size, maxLines: 2})) : null;
  const resH = keyOn ? Math.max(resProbe[0].box.h, resProbe[1].box.h) : 0;
  const runGap = 40; // floor → guide run (the guide chip stays clear of the floor's lip)
  const gProbe = keyOn ? chipG(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: row ? Math.min(560, GX + sw * 0.7) : sw * 0.8, size, maxLines: 2}).box.h : 0;
  const resOff = gProbe / 2 + 12; // results sit under the guide chip's row
  const underH = runGap + (keyOn ? resOff + resH : 8);
  const geom = stageGeom(M.n, H, lossCount, M.gap, cfg.wrapM ?? null);
  const stageH = geom.above + geom.below;
  const panelH = headH + 14 + stageH + underH;
  const PGAP = 64; // stacked scenes are clearly apart (with a divider)
  const panelY = row ? [0, 0] : [0, panelH + PGAP];
  if (!row) heads[1] = header(ctx, {name: 'head1', letter: 'B', label: p.scenarioB.label, caption: p.scenarioB.caption, x: panelX[1], y: panelY[1], w: sw - GUIDE_ROOM + GUIDE_ROOM * 0.6, size, headK: cfg.headK});
  const blockW = row ? 2 * sw + GX : sw + GUIDE_ROOM;
  const scenesH = row ? panelH : 2 * panelH + PGAP;

  // ---- shared legend + notes (below the scenes)
  const items = [];
  if (keyOn) {
    M.events.forEach((e, i) => items.push({key: `ev${i}`, kind: 'event', i, text: `${i + 1}. ${e.label}${e.time ? ` · ${e.time}` : ''}`}));
    p.losses.forEach((l, j) => items.push({key: `loss${j}`, kind: 'loss', text: `${t.lossAs}: ${l.label}`}));
    M.alternatives.forEach((a, j) => items.push({key: `alt${j}`, kind: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`}));
    M.links.forEach(l => {
      const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputedLink : null, l.label || null].filter(Boolean);
      if (bits.length) items.push({key: `lk${l.from}`, kind: 'link', dim: l.status === 'disputed', text: `${t.link} ${l.from + 1} → ${l.from + 1 < M.n ? l.from + 2 : t.lossAs}: ${bits.join(' · ')}`});
    });
  }
  // stacked stages beside a text column must still span >= 0.71 of their column (and never overflow it)
  if (sideW && cfg.dry && (m.width > sw - 8 || m.width < 0.71 * sw)) return {ext: {w: 1e9, h: 1e9}};
  const footW = sideW || blockW;
  const footX = sideW ? blockW + 36 : 0;
  const cols = cfg.cols ?? (row ? 3 : 2);
  const footY = sideW ? 0 : scenesH + 22;
  const lg = items.length ? legend(ctx, items, {x: footX, y: footY, w: footW, cols: Math.min(cols, items.length), size, minSize: size, maxLines: cfg.maxLines ?? 3, iconS: size * 1.4, prefix: 'lg', gap: cfg.gap ?? 10, icons: cfg.icons, padY: cfg.padY}) : {rows: [], h: 0};
  let y = footY + (lg.h ? lg.h + 18 : 0);
  // notes: changed fact + shared facts on one row when they fit, then the neutral note + key
  const noteChip = (text, name, mw, o2 = {}) => chipG(ctx, text, {x: 0, y: 0, maxWidth: balancedG(ctx, text, {maxWidth: mw, size, maxLines: 5}), size, maxLines: 5, name, opacity: 0, ...o2});
  const notes = [];
  const rowOf = list => {
    // lay chips in a row (centred) if they fit the width, else stack them
    const gap = 20;
    const total = list.reduce((a, c) => a + c.w, 0) + gap * (list.length - 1);
    if (total <= footW) {
      let x = footX + (footW - total) / 2;
      const rh = Math.max(...list.map(c => c.h));
      for (const c of list) { notes.push({...c, x, y: y + (rh - c.h) / 2}); x += c.w + gap; }
      y += rh + 14;
    } else {
      for (const c of list) { notes.push({...c, x: footX + (footW - c.w) / 2, y}); y += c.h + 14; }
    }
  };
  if (keyOn) {
    const fw = (k1, k2) => (sideW ? footW : footW * k1) * (k2 ?? 1);
    const chA = noteChip(p.changedFact, 'probe', fw(0.48)).box;
    const chB = p.sharedFacts.length && allOn ? noteChip(`${t.sameFacts}: ${p.sharedFacts.join(' · ')}`, 'probe', fw(0.48)).box : null;
    rowOf([{key: 'change', text: p.changedFact, w: chA.w, h: chA.h, mw: fw(0.48), fill: th.accentSoft, stroke: th.accent}, ...(chB ? [{key: 'shared', text: `${t.sameFacts}: ${p.sharedFacts.join(' · ')}`, w: chB.w, h: chB.h, mw: fw(0.48)}] : [])]);
    const nB = allOn ? noteChip(p.comparisonLabels.neutral, 'probe', fw(0.56)).box : null;
    const kB = noteChip(t.key, 'probe', fw(0.4)).box;
    rowOf([...(nB ? [{key: 'neutral', text: p.comparisonLabels.neutral, w: nB.w, h: nB.h, mw: fw(0.56)}] : []), {key: 'key', text: t.key, w: kB.w, h: kB.h, mw: fw(0.4), stroke: th.inkSoft}]);
  }
  const nf = sideW ? 1 : 0; // (side column: notes may use its full width)
  void nf;
  const totalH = sideW ? Math.max(scenesH, y) : y;
  const fullW = sideW ? footX + footW : blockW;
  if (cfg.dry) return {ext: {w: fullW, h: totalH}};

  // ---- stages
  const stages = [0, 1].map(i => cfStage(ctx, {prefix: i ? 'sb' : 'sa', x: panelX[i] + stageOff, span: [panelX[i] + 8, panelX[i] + sw - 4], floorY: panelY[i] + headH + 14 + stageAbove(H), H, M, lossCount, take: TAKE, wrapM: cfg.wrapM ?? null}));
  const F = stages.map(s => s.floorY);
  const ringR = {rx: Math.max(m.w * 1.25, H * 0.3), ry: H * 0.62};
  const ringC = stages.map((s, i) => ({x: s.slotX, y: F[i] - H * 0.5}));
  const rings = [0, 1].map(i => g({name: `ring${i}`, opacity: 0, transform: T(ringC[i].x, ringC[i].y)},
    h('ellipse', {rx: r(ringR.rx), ry: r(ringR.ry), fill: i ? th.accent2Soft : th.accent4Soft, 'fill-opacity': 0.14, stroke: colors[i], 'stroke-width': 4.5, 'stroke-dasharray': i ? '12 9' : null})));

  // ---- guide: from under A's slot to under B's slot (under the floors; down the margin when stacked)
  const F2s = stages.map(st => st.plinth.floorY);
  const underY = F2s.map(f => f + STAGE_BELOW + runGap - 8);
  let pts;
  if (row) {
    pts = [{x: ringC[0].x, y: F2s[0] + STAGE_BELOW + 2}, {x: ringC[0].x, y: underY[0]}, {x: ringC[1].x, y: underY[1]}, {x: ringC[1].x, y: F2s[1] + STAGE_BELOW + 2}];
  } else {
    const xr = sw + GUIDE_ROOM * 0.55;
    pts = [{x: ringC[0].x, y: F2s[0] + STAGE_BELOW + 2}, {x: ringC[0].x, y: underY[0]}, {x: xr, y: underY[0]}, {x: xr, y: underY[1]}, {x: ringC[1].x, y: underY[1]}, {x: ringC[1].x, y: F2s[1] + STAGE_BELOW + 2}];
  }
  const guide = orthoGuide(ctx, {name: 'guide', pts, color: th.fg});
  // guide chip with the neutral Δ marker, on the run (the Δ glyph stays when labels are hidden)
  let guideChip = null;
  {
    const gs = size;
    const probe = keyOn ? chipG(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: row ? Math.min(560, GX + sw * 0.7) : sw * 0.8, size: gs, maxLines: 2}) : {box: {w: 0, h: gs * 1.6}};
    const R = gs * 0.62;
    const cw = probe.box.w + 2 * R + (keyOn ? 8 : 0);
    const cx = row ? (ringC[0].x + ringC[1].x) / 2 : Math.min(sw - cw / 2, (ringC[0].x + sw) / 2 + cw * 0.1);
    const cy = underY[0];
    const c = keyOn ? chipG(ctx, p.comparisonLabels.guide, {x: cx - cw / 2 + 2 * R + 8, y: cy - probe.box.h / 2, maxWidth: row ? Math.min(560, GX + sw * 0.7) : sw * 0.8, size: gs, maxLines: 2, stroke: th.fg}) : null;
    guideChip = {node: g({name: 'guide-chip', opacity: 0}, changedMarker(ctx, {x: cx - cw / 2 + R, y: cy, radius: R}), c && c.node), box: {x: cx - cw / 2, y: cy - probe.box.h / 2, w: cw, h: probe.box.h}};
  }
  // a divider keeps the two scenes visibly apart (between the stacked panels, or between the side-by-side floors)
  const divider = row
    ? h('path', {d: `M${r(sw + GX / 2)} ${r(headH * 0.6)}V${r(F2s[0] + STAGE_BELOW)}`, stroke: th.inkFaint, 'stroke-width': 3, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round'})
    : h('path', {d: `M${r(0)} ${r(panelY[1] - PGAP / 2)}H${r(sw + GUIDE_ROOM * 0.3)}`, stroke: th.inkFaint, 'stroke-width': 3, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round'});

  // ---- supplied result of each scene, under its plinth (equal size and weight)
  // both results: the same box size, the same place under the plinth, the same neutral colours
  const resFits = keyOn ? resTexts.map(tx => chipG(ctx, tx, {x: 0, y: 0, maxWidth: resW, size, maxLines: 2})) : [];
  const RW = keyOn ? Math.max(...resFits.map(c => c.box.w)) : 0, RH = keyOn ? Math.max(...resFits.map(c => c.box.h)) : 0;
  const results = keyOn ? [0, 1].map(i => {
    const st2 = stages[i];
    const x = Math.min(panelX[i] + sw - RW, Math.max(panelX[i], st2.plinth.x + st2.plinth.w / 2 - RW / 2));
    const y = underY[i] + resOff;
    const f = resFits[i].fit;
    const node = g({name: `result${i}`, opacity: 0},
      h('path', {d: roundRectPath(x, y, RW, RH, Math.min(RH / 2, size * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 2.5}),
      textBlock(f, {x: x + RW / 2, y: y + (RH - f.height) / 2, anchor: 'middle', fill: th.ink}));
    return {node, box: {x, y, w: RW, h: RH}};
  }) : [];
  const noteNodes = notes.map(c => chipG(ctx, c.text, {x: c.x, y: c.y, maxWidth: balancedG(ctx, c.text, {maxWidth: c.mw, size, maxLines: 5}), size, maxLines: 5, name: `note-${c.key}`, opacity: 0, fill: c.fill, stroke: c.stroke}));
  const ext = unionBounds([{x: -4, y: 0, w: fullW + 8, h: totalH}, ...results.map(c => c.box), guideChip && guideChip.box, ...noteNodes.map(c => c.box)]);
  return {stages, heads, rings, ringC, guide, guideChip, divider, results, lg, notes: noteNodes, ext, H, size, row, arrangement: sideW ? 'column+side' : arrangement, blockW, chainW: m.width, colW: sw, sideW};
}

/** What is visible in one scene, in that scene's own coordinates (relative to its floor line). */
function lookOf(S, floorY, extra) {
  return {angles: S.angles, started: S.started, lossState: S.lossState, cracked: S.cracked, joints: S.joints.map(j => Boolean(j)), bridge: Boolean(S.bridge), lift: S.lift, grip: S.grip, claw: Math.round(S.claw.y - floorY), bob: Math.round(S.bob.y - floorY), ...extra};
}

const scene = {
  sizes: {landscape: [2070, 900], square: [1100, 1200], portrait: [1000, 1560]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const arrangement = ARRANGE[ctx.view.shape];
    const SH = SHAPES[ctx.view.shape];
    const M = resolveModel(p, p.withoutResult);
    const lossCount = Math.min(2, p.losses.length);
    const base = {M, arrangement, lossCount};
    const row = arrangement === 'row';
    // the stages fill the width: side by side, or full width when stacked
    const H0 = fitStageH(M.n, row ? (D.w - GAP_X) / 2 - 16 : D.w - GUIDE_ROOM - 24, SH.maxH, lossCount, M.gap);
    const sizesIn = (a, b) => { const out = []; for (let sz = a; sz > b + 1e-6; sz *= 0.97) out.push(sz); out.push(b); return out; };
    const passes = [
      {sizes: sizesIn(SH.size, SH.baseMin), hMin: 0.5},
      {sizes: sizesIn(SH.baseMin, SH.minSize), hMin: 0.5},
      {sizes: sizesIn(SH.baseMin, SH.minSize), hMin: 0.25},
    ];
    const cfgs = [{}, {cols: row ? 4 : 3, maxLines: 4, gap: 8}, {cols: 3, maxLines: 6, gap: 5, icons: false, padY: 6}, {cols: row ? 4 : 3, maxLines: 6, gap: 5, icons: false, padY: 6}, {cols: 3, maxLines: 6, gap: 4, icons: false, padY: 5, headK: 1}, {cols: 4, maxLines: 7, gap: 4, icons: false, padY: 5, headK: 1}];
    const fits = X => X.ext.h <= D.h - 8 && X.ext.w <= D.w - 8;
    let L = null;
    const tried = [];
    if (ctx.view.shape === 'square') {
      // square boxes: side-by-side two-level stages, stacked full-width stages, side-by-side single floors or
      // stacked stages with a text column — each sized (tallest tiles, then largest text); the largest stage wins
      const wm = wrapChoices(M.n, M.k).length ? wrapChoices(M.n, M.k).reduce((b2, mm) => { const hh = fitGeomH(M.n, (D.w - GAP_X_SQ) / 2 - 16, SH.maxH, lossCount, M.gap, mm); return !b2 || hh > b2.H ? {m: mm, H: hh} : b2; }, null) : null;
      // in order of preference: stacked full-width stages; stacked stages with a text column (narrowest first);
      // two-level stages side by side; single floors side by side (clearly apart)
      const cands = [];
      const lay = cfgs;
      cands.push(...lay.map(c => ({...c, arr: 'column', H0: fitStageH(M.n, D.w - GUIDE_ROOM - 24, SH.maxH, lossCount, M.gap)})));
      for (const kw of [0.3, 0.34, 0.38, 0.42, 0.46, 0.5]) for (const c2 of [{cols: 1, maxLines: 6, gap: 6, headK: 1}, {cols: 1, maxLines: 7, gap: 5, icons: false, padY: 6, headK: 1}, {cols: 2, maxLines: 8, gap: 5, icons: false, padY: 6, headK: 1}]) {
        cands.push({...c2, arr: 'column', side: D.w * kw, H0: fitStageH(M.n, D.w - GUIDE_ROOM - 22 - D.w * kw - 36 - 16, SH.maxH, lossCount, M.gap)});
      }
      if (wm) cands.push(...lay.map(c => ({...c, arr: 'row', wrapM: wm.m, H0: wm.H})));
      cands.push(...lay.map(c => ({...c, arr: 'row', H0: fitStageH(M.n, (D.w - GAP_X_SQ) / 2 - 16, SH.maxH, lossCount, M.gap)})));
      const areaOf = (cfg, H) => { const gm = stageGeom(M.n, H, lossCount, M.gap, cfg.wrapM ?? null); return gm.width * (gm.above + gm.below); };
      for (const ps of [passes[0], passes[2]]) {
        let best = null;
        for (const cfg of cands) {
          let got = null;
          for (let f = 1; f >= 0.3 - 1e-9 && !got; f -= 0.05) {
            const H = Math.max(100, cfg.H0 * f);
            for (const size of ps.sizes) { if (fits(compose(ctx, base, H, size, {...cfg, dry: true}))) { got = {H, size}; break; } }
            if (H <= 100) break;
          }
          if (!got) continue;
          const area = areaOf(cfg, got.H);
          tried.push({arr: cfg.arr, wrap: cfg.wrapM ?? null, side: cfg.side ? r(cfg.side / D.w, 2) : null, H: r(got.H), size: r(got.size), area: Math.round(area)});
          if (!best) best = {cfg, ...got, area}; // (first fit in the order of preference)
        }
        if (best) {
          for (let H = best.H; H >= 100 && !L; H = H > 100 ? Math.max(100, H * 0.96) : 99) {
            const X = compose(ctx, base, H, best.size, best.cfg);
            if (fits(X)) L = X;
          }
          if (L) break;
        }
      }
    }
    // scenes keep their full width; the block is scaled to the design width, so text is sized for that scale
    if (!L) search: for (const ps of passes) {
      for (let f = 1; f >= ps.hMin - 1e-9; f -= 0.05) {
        for (const cfg of cfgs) {
          for (const size of ps.sizes) {
            const H = H0 * f;
            const X = compose(ctx, base, H, size, {...cfg, dry: true});
            if (!fits(X)) continue;
            L = compose(ctx, base, H, size, cfg);
            if (fits(L)) break search;
          }
        }
      }
    }
    if (!L) L = compose(ctx, base, H0 * 0.25, SH.minSize, cfgs[cfgs.length - 1]);
    const k = Math.min(1, (D.w - 8) / L.ext.w, (D.h - 8) / L.ext.h);
    L.k = k;
    L.dx = (D.w - L.ext.w * k) / 2 - L.ext.x * k;
    L.dy = (D.h - L.ext.h * k) / 2 - L.ext.y * k;
    L.M = M;
    L.tried = tried;
    return L;
  },
  build(ctx, L) {
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.heads.map(hd => hd.node),
      L.stages.map(s => s.back),
      L.rings,
      L.stages.map(s => s.main),
      L.divider,
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.results.map(c => c.node),
      L.lg.rows.map(rw => rw.node),
      L.notes.map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const th = ctx.theme;
    const M = L.M;
    const nodes = {};
    const tau = TAKE.T * seg(u, ...W.run);
    const drop = seg(u, ...W.drop), grip = seg(u, ...W.grip), lift = seg(u, ...W.lift);
    const a = L.stages[0].pose('with', tau, {});
    const bRun = u < W.lift[0] ? 'with' : 'without';
    const b = L.stages[1].pose(bRun, tau, {drop, grip, lift, slot: seg(u, ...W.slot)});
    Object.assign(nodes, a.nodes, b.nodes);
    // change beat: lane colours + labels, rings on the selected event in both
    const hp = seg(u, ...W.heads);
    const colors = [th.accent4, th.accent2];
    L.heads.forEach((hd, i) => {
      nodes[`head${i}-disc`] = {fill: hp > 0.5 ? colors[i] : th.inkFaint};
      nodes[`head${i}-text`] = {opacity: r(hp, 3)};
    });
    const rp = seg(u, ...W.rings);
    nodes.ring0 = {opacity: r(rp, 3)};
    nodes.ring1 = {opacity: r(rp, 3)};
    Object.assign(nodes, legendFrame(L.lg.rows, seg(u, ...W.legend)));
    const gp = ease.inOutCubic(seg(u, ...W.guide));
    Object.assign(nodes, L.guide.frame(gp));
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    const resP = seg(u, ...W.results);
    L.results.forEach((c, i) => { nodes[`result${i}`] = {opacity: r(resP, 3)}; });
    const cp = seg(u, ...W.changeChip), np = seg(u, ...W.notes), kp = seg(u, ...W.key);
    for (const c of L.notes) {
      const nm = c.node.attrs.name;
      nodes[nm] = {opacity: r(nm === 'note-change' ? cp : nm === 'note-key' ? kp : np, 3)};
    }
    const A = a.semantic, B = b.semantic;
    const changed = u >= W.heads[0];
    const semantic = {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
      arrangement: L.arrangement,
      selected: M.k,
      withoutResult: ctx.params.withoutResult,
      a: A, b: B,
      // what is visible in each scene (the headers' labels and lane colours come in with the change beat)
      lookA: lookOf(A, L.stages[0].floorY, {head: changed ? 'A' : 'neutral', ring: r(rp, 3), slot: 0}),
      lookB: lookOf(B, L.stages[1].floorY, {head: changed ? 'B' : 'neutral', ring: r(rp, 3), slot: r(seg(u, ...W.slot), 3)}),
      bobA: A.bob, bobB: B.bob, clawB: B.claw, gripB: L.stages[1].gripPoint(bRun, tau, lift),
      guideProgress: r(gp, 3),
      resultsShown: resP >= 1,
      layout: {H: r(L.H), size: r(L.size), k: r(L.k, 3), row: L.row, arrangement: L.arrangement, stageW: r(L.stages[0].right - L.stages[0].left), blockW: r(L.blockW), chainOfCol: r(L.chainW / L.colW, 3)}, tried: L.tried,
    };
    A.tops.forEach((q, i) => { semantic[`a${i}`] = q; });
    B.tops.forEach((q, i) => { semantic[`b${i}`] = q; });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-02-contrast',
    title: 'Counterfactual replay — event present vs event removed from the model',
    titleEs: 'Prueba contrafactual causal — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Prueba contrafactual causal',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical model stages run the same take in parallel. Only one fact differs: in B a claw lifts the selected event out of the model before the run. A reaches the loss; B follows the SUPPLIED result (the loss still occurs, or it does not). A guide joins the two slots; equal weight, no winner, no legal test or conclusion.',
    tags: ['causation', 'counterfactual', 'comparison', 'removed event', 'model as supplied', 'side-by-side', 'stacked', 'dominoes', 'claw'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/primitives/markers.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CF_STRINGS,
  scene,
});
