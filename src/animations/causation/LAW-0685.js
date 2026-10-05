/**
 * LAW-0685 — Prueba contrafactual causal · story
 *
 * Storyboard (side view of one model stage under a gantry; nothing but the
 * rig moves the pieces):
 *  0.00–0.09 rest     The model as supplied: one upright tile per event in the
 *                     supplied order (die faces give the order without text),
 *                     a vase on a plinth at the end, a long pendulum held back
 *                     by a tether, and a claw parked on the gantry right over
 *                     the SELECTED event's tile (tag "Event present"). Two run
 *                     lamps: ① run with the event, ② replay without it.
 *  0.09–0.30 run 1    Lamp ① lights. The tether drops, the bob swings down and
 *                     strikes tile 1; every tile only starts when the previous
 *                     one touches it (the pilot's contact solver); the last
 *                     one tips the vase, which cracks (loss as described).
 *  0.31–0.49 rewind   The rewind glyph lights and the SAME take runs backwards
 *                     at the same speed: shards fly back, the crack undraws,
 *                     tiles stand up, the bob swings back and is re-tethered.
 *  0.49–0.61 remove   The claw lowers onto the selected tile's top, closes and
 *                     lifts it clear of the model; a dashed outline stays in
 *                     the empty slot; the tag now reads "Removed from the
 *                     model" (the old tag leaves first — no cross-fade).
 *  0.61–0.82 replay   Lamp ② lights. The same take replays without the tile.
 *                     The replay follows the SUPPLIED result (finalState): the
 *                     model's spacing (identical in both runs) is chosen so
 *                     that the tile before the gap either reaches the tile
 *                     after it (loss still occurs) or lies down in the empty
 *                     slot while everything downstream stays standing (loss
 *                     does not occur). Cause always precedes visible effect.
 *  0.79–1.00 hold     Result callout on the loss "Replay without it: <result>
 *                     (as supplied)", the key "As supplied · no conclusion
 *                     drawn" and editorial callouts. No legal test is named or
 *                     applied; no causation, liability or outcome is stated.
 * Wide boxes: stage left, legend column right. Square: stage over a
 * two-column legend. Tall: stage over a one-column legend.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0685
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, num, obj, list, annotation} from '../../schemas/fields.js';
import {placeChip, unionBounds, leaderPoly, stateTag} from './kits/place.js';
import {
  cfFields, resultField, CF_STRINGS, resolveModel, cfStage, stageMetrics, stageGeom, fitGeomH, wrapChoices,
  chipG, balancedG, legend, legendFrame, runLamps, calloutG, clampNote,
} from './kits/prueba-contrafactual.js';

const ID = 'LAW-0685';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TAKE = {start: 0.05, strike: 0.2, T: 0.3};
const W = {
  legend: [0.0, 0.08], lamps: [0, 0.04], tagIn: [0.03, 0.08],
  run1: [0.09, 0.3], rewind: [0.31, 0.49],
  tagOut: [0.49, 0.52], drop: [0.487, 0.537], grip: [0.535, 0.55], lift: [0.55, 0.605], slot: [0.575, 0.61], tagIn2: [0.595, 0.63],
  replay: [0.61, 0.82], result: [0.79, 0.84], key: [0.81, 0.86], notes: [0.82, 0.87],
};

const sceneSchema = {
  ...cfFields,
  actorLabels: obj('Captions for the two machine actors of the model', {
    a: str('Caption for the trigger (the pendulum that starts every run)', 80),
    b: str('Caption for the claw that takes the selected event out of the model', 80),
  }),
  objectLabels: obj('Labels printed in the scene', {
    chain: str('Status tag over the stage', 70),
    present: str('Tag on the selected event before it is removed', 60),
    removed: str('Tag on the selected event once it is lifted out of the model', 60),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['removed', 'gap', 'loss', 'model']), 0, 2),
  finalState: resultField('SUPPLIED result of the replay without the selected event (the animation never infers it)'),
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
  actorLabels: {a: 'Trigger: starts each run the same way', b: 'Claw: takes the selected event out'},
  objectLabels: {chain: 'Model as supplied by Party A', present: 'Event present', removed: 'Event removed from the model'},
  actionProgress: 1,
  annotations: [{target: 'gap', text: 'Only this event is taken out; everything else stays as supplied'}],
  finalState: 'loss-does-not-occur',
};

const SHAPES = {
  // minSize: the design size that still renders >= 16 px at 1080p in that ratio
  // baseMin: >= 19.5 px at 1080p (baseline presets)
  landscape: {mode: 'side', size: 28, baseMin: 24, minSize: 20, maxH: 360, legendW: 0.3, cols: 2},
  square: {mode: 'below', size: 31, baseMin: 29.4, minSize: 24.5, maxH: 380, cols: 2, sideWrap: true},
  portrait: {mode: 'below', size: 31, baseMin: 20.5, minSize: 17.5, maxH: 330, cols: 1, wrap: true},
};
const MARGIN = 24;

/** Map normalized time to (run, take time, removal state). */
function timeline(u) {
  const Tk = TAKE.T;
  if (u < W.run1[0]) return {run: 'with', tau: 0, phase: 'rest'};
  if (u < W.rewind[0]) return {run: 'with', tau: Tk * seg(u, ...W.run1), phase: 'run1'};
  if (u < W.drop[0]) {
    const p = seg(u, ...W.rewind);
    // constant speed (the forward take's) in the middle, gentle at both ends
    const A = 0.08;
    const f = p < A ? p * p / (2 * A) : p > 1 - A ? 1 - A - (1 - p) * (1 - p) / (2 * A) : p - A / 2;
    return {run: 'with', tau: Tk * (1 - f / (1 - A)), phase: 'rewind'};
  }
  if (u < W.replay[0]) return {run: u < W.lift[0] ? 'with' : 'without', tau: 0, phase: 'remove'};
  return {run: 'without', tau: Tk * seg(u, ...W.replay), phase: u < W.replay[1] ? 'replay' : 'hold'};
}

function compose(ctx, base, H0, size0, cfg = {}) {
  // tiles never smaller than 100 units (the tile art needs room for its die face)
  const H = Math.max(100, H0);
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M, SH, lossCount} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const side = (cfg.mode ?? SH.mode) === 'side';
  const geom = stageGeom(M.n, H, lossCount, M.gap, cfg.wrapM ?? null);
  const stageW = geom.width;
  const stageX = side ? MARGIN : (D.w - stageW) / 2;
  const colX = side ? stageX + stageW + 40 : MARGIN;
  const colW = side ? D.w - colX - MARGIN : D.w - 2 * MARGIN;
  // side mode: the notes (result, key, callouts) go in the legend column, or under the stage (notesLeft)
  const nLeft = side && cfg.notesLeft;
  const nX = nLeft ? stageX : colX, nW = nLeft ? stageW : colW;
  const sideCols = cfg.cols ?? 1;

  // ---- legend content (measured first: generic captions never exceed its text size)
  const items = [];
  if (keyOn) {
    M.events.forEach((e, i) => items.push({key: `ev${i}`, kind: 'event', i, text: `${i + 1}. ${e.label}${e.time ? ` · ${e.time}` : ''}`}));
    p.losses.forEach((l, j) => items.push({key: `loss${j}`, kind: 'loss', text: `${t.lossAs}: ${l.label}`}));
    M.alternatives.forEach((a, j) => items.push({key: `alt${j}`, kind: 'alt', text: `${t.other}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`}));
    M.links.forEach(l => {
      const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputedLink : null, l.label || null].filter(Boolean);
      if (bits.length) items.push({key: `lk${l.from}`, kind: 'link', dim: l.status === 'disputed', text: `${t.link} ${l.from + 1} → ${l.from + 1 < M.n ? l.from + 2 : t.lossAs}: ${bits.join(' · ')}`});
    });
    if (allOn && p.actorLabels.a) items.push({key: 'pend', kind: 'pend', text: p.actorLabels.a});
    if (allOn && p.actorLabels.b) items.push({key: 'claw', kind: 'claw', text: p.actorLabels.b});
    const cn = clampNote(ctx, p, M);
    if (cn) items.push({key: 'clamp', kind: 'note', text: cn});
  }
  const cols = side ? sideCols : (items.length >= 5 ? (cfg.cols ?? SH.cols) : 1);
  const lgOpts = y => ({x: colX, y, w: colW, cols, size: size0, minSize: Math.max(SH.minSize, size0 * 0.86), maxLines: cfg.maxLines ?? 3, iconS: size0 * 1.45, prefix: 'lg', gap: cfg.gap ?? 12, icons: cfg.icons, padY: cfg.padY});
  const probeLg = items.length ? legend(ctx, items, lgOpts(0)) : null;
  // captions and tags are never larger than the smallest legend text
  const size = probeLg ? Math.min(size0, probeLg.minPx) : size0;

  // ---- top row: status tag + run lamps (one row when they fit, else two)
  const tagText = p.objectLabels.chain || t.model;
  // every generic label (tag, lamps, key) is set at the same size as the legend text
  const tagSize = size;
  const lampSize = size;
  const lampW = Math.max(stageW, D.w - 2 * MARGIN - (side ? colW + 40 : 0));
  const lampProbe = runLamps(ctx, {name: 'lamps-probe', x: 0, y: 0, w: lampW, size: lampSize, labels: keyOn ? [t.run1, t.run2] : null});
  let chainTag = null;
  let y = 0;
  let lamps;
  if (keyOn) {
    const tagProbe = chipG(ctx, tagText, {x: 0, y: 0, maxWidth: stageW * 0.62, size: tagSize, maxLines: 2});
    const oneRow = tagProbe.box.w + 30 + lampProbe.box.w <= stageW;
    if (oneRow) {
      const rowH = Math.max(tagProbe.box.h, lampProbe.box.h);
      chainTag = chipG(ctx, tagText, {x: stageX, y: (rowH - tagProbe.box.h) / 2, maxWidth: stageW * 0.62, size: tagSize, maxLines: 2, name: 'chain-tag', fill: th.accent2Soft, stroke: th.accent2, opacity: 0});
      const lx = stageX + tagProbe.box.w + 30;
      lamps = runLamps(ctx, {name: 'lamps', x: lx, y: (rowH - lampProbe.box.h) / 2, w: stageX + stageW - lx, size: lampSize, labels: [t.run1, t.run2]});
      y = rowH + 16;
    } else {
      chainTag = chipG(ctx, tagText, {x: stageX + stageW / 2, y: 0, anchor: 'middle', maxWidth: stageW, size: tagSize, maxLines: 2, name: 'chain-tag', fill: th.accent2Soft, stroke: th.accent2, opacity: 0});
      y = chainTag.box.h + 12;
      lamps = runLamps(ctx, {name: 'lamps', x: stageX + stageW / 2 - lampW / 2, y, w: lampW, size: lampSize, labels: [t.run1, t.run2]});
      y += lamps.box.h + 16;
    }
  } else {
    lamps = runLamps(ctx, {name: 'lamps', x: stageX, y: 0, w: stageW, size: lampSize, labels: null});
    y = lamps.box.h + 16;
  }
  const resultText = `${t.run2}: ${M.reach ? t.occurs : t.notOccurs}`;
  if (cfg.dry) {
    // cheap height estimate for the layout search (no stage, no placement)
    const lgH = probeLg ? probeLg.h : 0;
    const stageH = y + geom.above + geom.below;
    if (!keyOn) return {ext: {h: stageH}};
    const rp = chipG(ctx, resultText, {x: 0, y: 0, maxWidth: side ? colW : Math.min(colW * 0.56, Math.max(stageMetrics(M.n, H, lossCount, M.gap).plinthW + 160, colW * 0.42)), size, maxLines: 3}).box.h;
    const kp = chipG(ctx, t.key, {x: 0, y: 0, maxWidth: colW, size, maxLines: 2}).box.h;
    const noteH = allOn ? p.annotations.reduce((a, an) => a + chipG(ctx, an.text, {x: 0, y: 0, maxWidth: nW, size, maxLines: 4}).box.h + 14, 0) : 0;
    if (nLeft) return {ext: {h: Math.max(stageH + 22 + rp + 14 + kp + 14 + noteH, lgH)}};
    if (side) return {ext: {h: Math.max(stageH, lgH + 22 + rp + 14 + kp + 14 + noteH)}};
    const noteRow = allOn && p.annotations.length ? Math.max(...p.annotations.map(an => chipG(ctx, an.text, {x: 0, y: 0, maxWidth: p.annotations.length > 1 ? (D.w - 2 * MARGIN - 24) / 2 : D.w * 0.8, size, maxLines: 4}).box.h)) + 14 : 0;
    return {ext: {h: stageH + 22 + rp + 22 + (kp + 22) * 0.5 + lgH + 20 + noteRow}};
  }
  const F = y + geom.above;
  const stage = cfStage(ctx, {prefix: 'st', x: stageX, floorY: F, H, M, lossCount, take: TAKE, wrapM: cfg.wrapM ?? null, span: side ? null : [MARGIN, D.w - MARGIN]});
  const stageBottom = F + geom.below;
  const F2 = stage.plinth.floorY;
  const lossC = stage.lossCenter('without', TAKE.T);

  // ---- below-mode: a row right under the floor for the result (under the loss) and the key
  const sp = cfg.tight ? 12 : 22;
  let below = stageBottom + sp;
  let result = null, key = null, resultLead = false;
  const placedNotes = [];
  if (keyOn && !side) {
    const rw = Math.min(colW * 0.56, Math.max(stage.plinth.w + 160, colW * 0.42));
    const rp = chipG(ctx, resultText, {x: 0, y: 0, maxWidth: rw, size, maxLines: 3});
    const rx = Math.min(D.w - MARGIN - rp.box.w, Math.max(MARGIN, stage.plinth.x + stage.plinth.w / 2 - rp.box.w / 2));
    result = calloutG(ctx, {name: 'result', text: resultText, chipAt: {x: rx + rp.box.w / 2, y: below}, target: {x: lossC.x, y: F2 + 14}, maxWidth: rw, maxLines: 3, size, color: th.accent2, fill: th.accent2Soft});
    resultLead = true;
    const kw = rx - MARGIN - 24;
    const kp = chipG(ctx, t.key, {x: 0, y: 0, maxWidth: Math.max(260, kw), size, maxLines: 2});
    if (kp.box.w <= kw) key = chipG(ctx, t.key, {x: MARGIN, y: below + (rp.box.h - kp.box.h) / 2, maxWidth: kw, size, maxLines: 2, name: 'key', stroke: th.inkSoft, opacity: 0});
    below += rp.box.h + sp;
    if (!key) {
      key = chipG(ctx, t.key, {x: D.w / 2, y: below, anchor: 'middle', maxWidth: colW, size, maxLines: 2, name: 'key', stroke: th.inkSoft, opacity: 0});
      below += key.box.h + 22;
    }
    placedNotes.push(result.box, key.box);
  }

  // ---- legend
  const lg = items.length ? legend(ctx, items, lgOpts(side ? 0 : below)) : {rows: [], h: 0, minPx: size};
  let notesY = nLeft ? stageBottom + 22 : side ? (lg.h ? lg.h + 22 : 0) : (lg.h ? below + lg.h + sp : below);

  // ---- obstacles in the stage (every pose of both runs), for tags and callouts
  const polys = [];
  for (const run of ['with', 'without']) for (const tau of [0, 0.08, 0.12, 0.16, 0.2, 0.24, 0.3]) polys.push(...stage.polysAt(run, tau, 1));
  const beamBand = {x: stage.left - 20, y: stage.beamY - 6, w: stageW + 40, h: 30 + H * 0.07};
  const postBoxes = [{x: stage.left - 12, y: stage.beamY, w: 30, h: F - stage.beamY}, {x: stage.right - 40, y: stage.beamY, w: 30, h: F2 - stage.beamY}];
  const pendBox = {x: stage.raisedBob.x - stage.rb - 6, y: stage.pivot.y, w: stage.hit.x - stage.raisedBob.x + 2 * stage.rb + 12, h: Math.max(stage.raisedBob.y, stage.hit.y) + stage.rb - stage.pivot.y + 10};
  const floorBoxes = stage.floorBoxes;
  const plinthBox = {x: stage.plinth.x - 4, y: stage.plinth.top, w: stage.plinth.w + 8, h: F2 - stage.plinth.top + 30};
  const cableBox = {x: stage.slotX - 8, y: stage.beamY, w: 16, h: F - H - stage.beamY};
  const bars = stage.barriers.flatMap(b => [b.box, b.stand]);
  const inStage = {x: stage.left + 20, y: stage.beamY + 30, w: stageW - 40, h: F - stage.beamY - 60};
  const obstacles = [beamBand, ...postBoxes, pendBox, ...floorBoxes, plinthBox, stage.hangBox, cableBox, ...bars, ...polys];
  const placed = [];
  const leads = [];

  // ---- selected event's tag (present → removed), beside the lifted position
  let tagP = null, tagR = null;
  if (keyOn) {
    const hb = stage.hangBox;
    const target = {x: hb.x + hb.w, y: hb.y + hb.h * 0.55};
    const mwBase = Math.max(260, Math.min(520, stageW * 0.36));
    const texts = [p.objectLabels.present || t.present, p.objectLabels.removed || t.removed];
    const probe = texts.map(tx => chipG(ctx, tx, {x: 0, y: 0, maxWidth: mwBase, size, maxLines: 3}).box);
    const sz = {w: Math.max(...probe.map(b => b.w)), h: Math.max(...probe.map(b => b.h))};
    const po = {obstacles, bounds: inStage, order: ['right', 'left', 'rightHigh', 'leftHigh', 'rightLow', 'leftLow'], gaps: [24, 40, 70, 110, 160], own: [stage.hangBox]};
    let res = placeChip(sz, target, po);
    if (!res) res = placeChip(sz, {x: hb.x, y: target.y}, {...po, order: ['left', 'leftHigh', 'leftLow']});
    if (!res) res = placeChip(sz, target, {...po, leastBad: true});
    if (!res) res = {x: Math.min(inStage.x + inStage.w - sz.w / 2, target.x + 30 + sz.w / 2), y: Math.max(inStage.y, target.y - sz.h / 2)};
    const leftSide = res.x < stage.slotX;
    const edgeX = leftSide ? hb.x : hb.x + hb.w;
    const mk = (tx, i, tgt) => calloutG(ctx, {name: `tag${i}`, text: tx, chipAt: {x: res.x, y: res.y + (sz.h - probe[i].h) / 2}, target: tgt, maxWidth: mwBase, maxLines: 3, size, color: i ? th.fgSoft : th.accent2});
    tagP = mk(texts[0], 0, {x: stage.slotX, y: F - H});
    tagR = mk(texts[1], 1, {x: edgeX, y: target.y});
    tagP.leftSide = leftSide;
    placed.push({x: res.x - sz.w / 2, y: res.y, w: sz.w, h: sz.h});
    leads.push(leaderPoly({x: res.x - sz.w / 2, y: res.y, w: sz.w, h: sz.h}, {x: edgeX, y: target.y}));
  }

  // ---- side mode: result beside the stage at the loss's height, tied to it by a leader; key under it
  if (keyOn && side) {
    const rp = chipG(ctx, resultText, {x: 0, y: 0, maxWidth: nW, size, maxLines: 3});
    const ry = nLeft ? notesY : Math.max(notesY, lossC.y - rp.box.h / 2);
    const tgt = nLeft ? {x: lossC.x, y: stage.plinth.floorY + 14} : {x: lossC.x + H * 0.08, y: lossC.y}; // the leader ends on the vase itself
    const rx = nLeft ? Math.min(nX + nW - rp.box.w, Math.max(nX, lossC.x - rp.box.w / 2)) : nX;
    result = calloutG(ctx, {name: 'result', text: resultText, chipAt: {x: rx + rp.box.w / 2, y: ry}, target: tgt, maxWidth: nW, maxLines: 3, size, color: th.accent2, fill: th.accent2Soft});
    resultLead = true;
    notesY = ry + result.box.h + 14;
    key = chipG(ctx, t.key, {x: nX, y: notesY, maxWidth: nW, size, maxLines: 2, name: 'key', stroke: th.inkSoft, opacity: 0});
    notesY += key.box.h + 14;
  }

  // ---- annotations: callouts in the stage when there is room, else in the notes region
  const polysFin = stage.polysAt('without', TAKE.T, 1);
  const finObs = [beamBand, ...postBoxes, pendBox, ...floorBoxes, plinthBox, stage.hangBox, cableBox, ...bars, ...polysFin, ...placed, ...leads];
  const B = stage.bodies;
  const targets = {
    removed: {x: stage.hangBox.x + stage.hangBox.w / 2, y: stage.hangBox.y + stage.hangBox.h * 0.35},
    gap: {x: stage.slotX, y: F - H * 0.5},
    loss: lossC,
    model: {x: B[0].pivot.x - B[0].w / 2, y: F - H - 10},
  };
  let rowH = 0;
  const notes = allOn ? p.annotations.map((a, i) => {
    const tg = targets[a.target];
    const mw = Math.min(560, stageW * 0.4);
    const nsize = size;
    const fits = [[mw, 2], [mw * 0.75, 3], [mw * 0.6, 4]].map(([wd, ml]) => { const c = chipG(ctx, a.text, {x: 0, y: 0, maxWidth: wd, size: nsize, maxLines: ml}); return {wd, ml, box: c.box, bad: c.fit.truncated || c.fit.broken}; });
    let res = null, kk = 0;
    for (let q = 0; q < fits.length && !res; q++) { if (fits[q].bad) continue; res = placeChip(fits[q].box, tg, {obstacles: [...finObs, ...placed, ...leads], bounds: inStage, own: a.target === 'removed' ? [stage.hangBox] : [], gaps: [40, 70, 110, 160, 220]}); kk = q; }
    if (!res && a.target === 'gap' && stage.wrapM) {
      // two-level stage: hang the note on the riser wall right under the empty slot, its leader up to the slot
      const riser = stage.floorBoxes[1];
      const obs2 = [...finObs.filter(ob => ob !== riser), ...placed, ...leads];
      const tg2 = {x: stage.slotX, y: F - 8};
      const bnd = {x: stage.left + 10, y: F + 36, w: stageW - 20, h: stage.plinth.floorY - F - 60};
      for (let q = 0; q < fits.length && !res; q++) { if (fits[q].bad) continue; res = placeChip(fits[q].box, tg2, {obstacles: obs2, bounds: bnd, own: [stage.floorBoxes[0]], order: ['below', 'belowR', 'belowL'], gaps: [44, 60, 80, 110], skipEnd: 40}); kk = q; }
    }
    if (res) {
      const c = calloutG(ctx, {name: `note${i}`, text: a.text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: fits[kk].wd, maxLines: fits[kk].ml, size: nsize});
      placed.push(c.box);
      leads.push(leaderPoly(c.box, res.end));
      return c;
    }
    // no room in the stage: a chip in the notes region (no leader across the scene); below the
    // legend two notes share a row
    const half = !side && p.annotations.length > 1;
    const mw2 = side ? nW : half ? (D.w - 2 * MARGIN - 24) / 2 : D.w * 0.8;
    const cx = side ? nX : half ? (i % 2 ? D.w / 2 + 12 : MARGIN) : D.w / 2;
    const c = chipG(ctx, a.text, {x: cx, y: notesY, anchor: side || half ? 'start' : 'middle', maxWidth: balancedG(ctx, a.text, {maxWidth: mw2, size: nsize, maxLines: 4}), size: nsize, maxLines: 4, name: `note${i}`, opacity: 0});
    if (!half || i % 2 === 1 || i === p.annotations.length - 1) notesY += Math.max(c.box.h, rowH) + 14;
    rowH = half && i % 2 === 0 ? c.box.h : 0;
    return {node: c.node, box: c.box, frame: pp => ({[`note${i}`]: {opacity: r(clamp(pp), 3)}})};
  }) : [];

  const ext = unionBounds([
    {x: stage.left - 8, y: 0, w: stageW + 16, h: stageBottom},
    chainTag && chainTag.box, lamps.box,
    ...lg.rows.map(rw => rw.box),
    ...placed, ...placedNotes,
    result && result.box, key && key.box,
    ...notes.map(nn => nn.box),
  ]);
  return {stage, chainTag, lamps, lg, tagP, tagR, result, resultLead, key, notes, ext, F, H, size, size0, side};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveModel(p, p.finalState);
    const lossCount = Math.min(2, p.losses.length);
    const base = {M, SH, lossCount};
    const side = SH.mode === 'side';
    const topRow = 70;
    // tallest tiles for a width and the height left for the stage (one floor, or a two-level stage)
    const hFor = (width, wrapM) => fitGeomH(M.n, width, SH.maxH, lossCount, M.gap, wrapM ?? null, D.h - topRow - 10);
    // landing size of a two-level stage: the one that allows the tallest tiles
    const wraps = wrapChoices(M.n, M.k);
    const bestWrap = width => wraps.reduce((b, m) => { const H = hFor(width, m); return !b || H > b.H ? {m, H} : b; }, null);
    let L = null;
    const fits = X => X.ext.h <= D.h - 10 && (!X.ext.w || X.ext.w <= D.w - 4);
    const sizesIn = (a, b) => { const out = []; for (let sz = a; sz > b + 1e-6; sz *= 0.97) out.push(sz); out.push(b); return out; };
    // passes: baseline text (>= 19.5 px) with the largest stage first; then smaller text (>= 16 px); then smaller tiles
    const passes = [
      {sizes: sizesIn(SH.size, SH.baseMin), hMin: 0.5},
      {sizes: sizesIn(SH.baseMin, SH.minSize), hMin: 0.7},
      {sizes: sizesIn(SH.baseMin, SH.minSize), hMin: 0.3},
    ];
    const wideSide = [{legendW: 0.3, cols: 1}, {legendW: 0.36, cols: 1}, {legendW: 0.44, cols: 2, maxLines: 4}, {legendW: 0.5, cols: 2, maxLines: 4}];
    const below = [{}, {cols: SH.cols + 1, maxLines: 4, gap: 8}, {cols: SH.cols, maxLines: 4, gap: 6, icons: false, padY: 7}, {cols: SH.cols + 1, maxLines: 5, gap: 6, icons: false, padY: 7}, {cols: SH.cols + 1, maxLines: 5, gap: 4, icons: false, padY: 5, tight: true}];
    const widthOf = cfg => (!ctx.show('key') ? D.w - 2 * MARGIN : (cfg.mode ?? SH.mode) === 'side' ? D.w * (1 - cfg.legendW) - MARGIN - 40 : D.w - 2 * MARGIN - 16);
    const base0 = side ? wideSide : below;
    // groups are searched in order; within a group, larger text first, then larger tiles
    // candidate compositions; each is sized (largest tiles, then largest text), the largest stage wins
    const cands = [];
    if (side) {
      cands.push(...base0, ...base0.map(c => ({...c, notesLeft: true})));
      if (wraps.length) {
        const bw = bestWrap(widthOf(wideSide[2]));
        // two-level stage beside the legend; the result, key and callouts go under it (the left column fills)
        cands.push(...base0.map(c => ({...c, wrapM: bw.m, notesLeft: true})));
      }
      // stage across the full width, legend below in columns
      cands.push(...below.map(c => ({...c, mode: 'below', cols: Math.max(3, (c.cols ?? 1) + 1)})));
    } else {
      cands.push(...below);
      if (wraps.length) { const bw = bestWrap(widthOf({})); cands.push(...below.map(c => ({...c, wrapM: bw.m}))); }
      if (SH.sideWrap) {
        const sideCfgs = [0.44, 0.5, 0.56].flatMap(lw => [{mode: 'side', notesLeft: true, legendW: lw, cols: 2, maxLines: 6, gap: 6}, {mode: 'side', notesLeft: true, legendW: lw, cols: 2, maxLines: 7, gap: 4, icons: false, padY: 5}]);
        const bw = wraps.length ? bestWrap(D.w * 0.5 - MARGIN - 40) : null;
        cands.push(...sideCfgs.map(c => ({...c, wrapM: bw ? bw.m : null})), ...sideCfgs);
      }
    }
    const areaOf = (cfg, H) => { const gm = stageGeom(M.n, H, lossCount, M.gap, cfg.wrapM ?? null); return gm.width * (gm.above + gm.below); };
    const fitsAt = (cfg, H, size) => fits(compose(ctx, base, H, size, {...cfg, dry: true}));
    // largest H (>= 100) at which a composition fits with this text size, or null
    const maxH = (cfg, size) => {
      const H1 = hFor(widthOf(cfg), cfg.wrapM);
      if (fitsAt(cfg, H1, size)) return H1;
      if (!fitsAt(cfg, 100, size)) return null;
      let lo = 100, hi = H1;
      for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (fitsAt(cfg, mid, size)) lo = mid; else hi = mid; }
      return lo;
    };
    const tiers = [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)];
    const tried = [];
    tiers: for (const sizes of tiers) {
      const list = [];
      for (const cfg of cands) {
        const floor = sizes[sizes.length - 1];
        const Hf = maxH(cfg, floor);
        if (Hf === null) continue;
        // the largest text that keeps (almost) the same stage
        let size = floor;
        for (const sz of sizes) { const hh = maxH(cfg, sz); if (hh !== null && hh >= Hf * 0.97) { size = sz; break; } }
        const H = Math.min(Hf, maxH(cfg, size) ?? Hf);
        const area = areaOf(cfg, H);
        tried.push({mode: cfg.mode ?? SH.mode, wrap: cfg.wrapM ?? null, legendW: cfg.legendW ?? null, H: r(H), size: r(size), area: Math.round(area)});
        list.push({cfg, H, size, area});
      }
      // largest stage first (larger text breaks near-ties); the full composition confirms the estimate
      list.sort((a1, b1) => (Math.abs(a1.area - b1.area) < 0.02 * Math.max(a1.area, b1.area) ? b1.size - a1.size : b1.area - a1.area));
      for (const c of list) {
        // (the estimate leaves out callouts that may fit in the stage: start from the tallest tiles)
        for (let H = hFor(widthOf(c.cfg), c.cfg.wrapM); H >= 100 - 1e-6; H = H > 100 ? Math.max(100, H * 0.96) : 99) {
          for (const sz of sizes) {
            if (sz > c.size + 1e-6 && H < c.H) continue;
            if (!fitsAt(c.cfg, H, sz) && H <= c.H) continue;
            const X = compose(ctx, base, H, sz, c.cfg);
            if (fits(X)) { L = X; break tiers; }
          }
        }
      }
    }
    const cfgs = cands;
    if (!L || !fits(L)) L = compose(ctx, base, hFor(widthOf(cfgs[cfgs.length - 1]), cfgs[cfgs.length - 1].wrapM) * 0.3, SH.minSize, cfgs[cfgs.length - 1]);
    // last resort (nothing fits at the text floor): scale the whole block into the box, never let it overflow
    L.k = Math.min(1, (D.h - 10) / L.ext.h, (D.w - 10) / L.ext.w);
    L.dx = (D.w - L.ext.w * L.k) / 2 - L.ext.x * L.k;
    L.dy = (D.h - L.ext.h * L.k) / 2 - L.ext.y * L.k;
    L.M = M;
    L.tried = tried;
    return L;
  },
  build(ctx, L) {
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.stage.back,
      L.stage.main,
      L.chainTag && L.chainTag.node,
      L.lamps.node,
      L.lg.rows.map(rw => rw.node),
      L.tagP && L.tagP.node,
      L.tagR && L.tagR.node,
      L.result && L.result.node,
      L.key && L.key.node,
      L.notes.map(nn => nn.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const M = L.M;
    const k = M.k;
    // actionProgress caps the concrete action (the replay is its last part)
    const capU = lerp(W.run1[0], W.replay[1], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const tl = timeline(a);
    const drop = tl.phase === 'remove' || tl.run === 'without' ? seg(a, ...W.drop) : 0;
    const grip = seg(a, ...W.grip);
    const lift = seg(a, ...W.lift);
    const run = tl.run;
    const posed = L.stage.pose(run, tl.tau, {drop, grip, lift, slot: seg(a, ...W.slot)});
    const nodes = posed.nodes;
    const S = posed.semantic;

    // lamps: ① during run 1, rewind glyph during the rewind, ② from the removal on
    const active = tl.phase === 'rest' ? null : tl.phase === 'run1' ? 0 : tl.phase === 'rewind' ? null : 1;
    Object.assign(nodes, L.lamps.frame({show: seg(u, ...W.lamps), active, rewind: tl.phase === 'rewind' ? 1 : 0}));
    if (L.chainTag) nodes['chain-tag'] = {opacity: r(seg(u, ...W.lamps), 3)};
    Object.assign(nodes, legendFrame(L.lg.rows, rw => seg(u, W.legend[0] + 0.004 * L.lg.rows.indexOf(rw), W.legend[1])));
    // tag: "present" until the claw comes down, then (after it has gone) "removed"
    if (L.tagP) {
      const pIn = seg(u, ...W.tagIn), pOut = seg(a, ...W.tagOut);
      Object.assign(nodes, L.tagP.frame(pIn * (1 - pOut) > 0 ? 1 : 0));
      nodes.tag0 = {opacity: r(clamp(pIn) * (1 - pOut), 3)};
      // the leader stays on the selected tile's top while it falls and stands up again
      const tip = L.stage.gripPoint('with', run === 'with' ? tl.tau : 0, 0);
      nodes['tag0-lead'] = {x2: tip.x, y2: tip.y, 'stroke-dasharray': 'none'};
      nodes['tag0-dot'] = {cx: tip.x, cy: tip.y};
      const rIn = seg(a, ...W.tagIn2);
      Object.assign(nodes, L.tagR.frame(rIn));
    }
    const resP = done ? seg(u, ...W.result) : 0;
    if (L.result) Object.assign(nodes, L.result.frame(resP));
    if (L.key) nodes.key = {opacity: r(done ? seg(u, ...W.key) : 0, 3)};
    L.notes.forEach(nn => Object.assign(nodes, nn.frame(done ? seg(u, ...W.notes) : 0)));

    const gripPt = L.stage.gripPoint(run, tl.tau, lift);
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      phase: tl.phase,
      run,
      tau: r(tl.tau, 4),
      finalState: p.finalState,
      selected: k,
      angles: S.angles,
      started: S.started,
      joints: S.joints,
      bridge: S.bridge,
      lossState: S.lossState,
      cracked: S.cracked,
      bob: S.bob,
      bobEdge: S.bobEdge,
      claw: S.claw,
      gripPt,
      grip: S.grip,
      lift: S.lift,
      removed: run === 'without',
      resultShown: resP >= 1,
      actionCapped: p.actionProgress < 1 && u > capU,
      tried: L.tried, layout: {H: r(L.H), size: r(L.size), size0: r(L.size0), k: r(L.k, 3), wrapM: L.stage.wrapM, side: L.side, ext: {x: r(L.ext.x), y: r(L.ext.y), w: r(L.ext.w), h: r(L.ext.h)}, design: {w: r(ctx.design.w), h: r(ctx.design.h)}},
    };
    S.tops.forEach((q, i) => { semantic[i < M.n ? `tile${i}` : `loss${i - M.n}`] = q; });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-02-story',
    title: 'Counterfactual replay — the same run repeated without the selected event',
    titleEs: 'Prueba contrafactual causal — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Prueba contrafactual causal',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side-view model stage under a gantry: a pendulum starts a toppling chain of event tiles that reaches a vase (loss as described); the take rewinds, a claw lifts the selected event out of the model (dashed outline left in its slot) and the same take replays without it, following the SUPPLIED result (the loss still occurs, or it does not). Model as supplied; no legal test, causation or outcome is stated.',
    tags: ['causation', 'counterfactual', 'replay', 'rewind', 'removed event', 'model as supplied', 'dominoes', 'claw', 'pendulum', 'loss'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/animations/causation/kits/place.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CF_STRINGS,
  scene,
});
