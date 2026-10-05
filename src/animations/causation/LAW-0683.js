/**
 * LAW-0683 — Cadena causal · contrast
 *
 * Storyboard (two complete, identical side-view scenes):
 *  0.00–0.17 base      Two identical floors: a pendulum held by a tether, one
 *                      upright tile per supplied event in the supplied order,
 *                      a plinth with the same urn. Shared event legend below.
 *  0.17–0.40 change    ONE fact changes, locally and visibly: the same link
 *                      (event k → event k+1) is ringed in both scenes — solid
 *                      "proposed" ring in A, dashed "?" ring in B — and in B
 *                      the alternative event put forward against that link
 *                      drops in behind it as a barrier. Nothing else differs.
 *  0.36–0.77 parallel  Both tethers release at the same instant; identical
 *                      bobs strike identical first tiles; both chains run the
 *                      same physics frame for frame until the changed link.
 *                      A: the chain continues and the urn tips and cracks.
 *                      B: the chain reaches the disputed link and holds; every
 *                      downstream tile and the urn switch to an unresolved
 *                      double outline (standing AND fallen) — B does not
 *                      assert that the chain breaks or that it holds.
 *  0.77–1.00 guide     A comparison guide joins the two rings (the changed
 *                      detail), routed above the scenes (side by side) or
 *                      down a margin beyond the floors (stacked); neutral
 *                      note. No winner, score or outcome.
 * Side by side on wide boxes, stacked on square and tall boxes (square: the
 * event legend and notes move to a column beside the stacked scenes).
 * B's alternative is a tall barricade standing on the floor behind the tiles;
 * B's downstream bodies stay upright (dimmed) with dashed fallen outlines.
 * @module animations/causation/LAW-0683
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry} from '../../frameworks/paired.js';
import {balancedWidth} from './kits/place.js';
import {chainFields, CHAIN_STRINGS, resolveChain, chainStage, fitChainH, chainWidth, dieFace, tileColor, lossArt} from './kits/causal-chain.js';
import {bodyPoint, DEG} from './kits/topple.js';

const ID = 'LAW-0683';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {legend: [0.02, 0.1], ring: [0.2, 0.28], barrier: [0.25, 0.34], changeChip: [0.19, 0.26], release: 0.36, start: 0.42, strike: 0.66, guide: [0.78, 0.9], note: [0.87, 0.94]};
const RAISED = -50;
const GAP = 0.3;
const SHARDS = 0.22;

const sceneSchema = {
  ...chainFields,
  ...contrastFields(),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+1 min'},
    {label: 'Display stand shakes', time: 'T+2 min'},
  ],
  causalLinks: [{from: 1, kind: 'sequence', status: 'disputed'}],
  alternatives: [{label: 'Cleaning cart passes by', link: 1, status: 'alleged'}],
  losses: [{label: 'Ceramic vase cracked'}],
  scenarioA: {label: 'Proposed chain', caption: 'Link 2 → 3 put forward as proposed'},
  scenarioB: {label: 'Disputed link', caption: 'Link 2 → 3 disputed; an alternative is put forward'},
  changedFact: 'Only link 2 → 3 differs: proposed in A, disputed in B',
  sharedFacts: ['Same events, order and spacing', 'Same trigger', 'Same loss object'],
  comparisonLabels: {guide: 'Changed fact: link 2 → 3', neutral: 'Two situations compared — the disputed link is not resolved here'},
};

const ARRANGE = {landscape: 'row', square: 'column', portrait: 'column'};
const PANEL = {row: {w: 1000, h: 470}, column: {w: 1000, h: 430}};
const HEADER = {row: 150, column: 136};
/** Stacked panels: room kept right of the floors (and their shards) for the guide's vertical run. */
const GUIDE_ROOM = 64;
/** Square boxes: the event legend and notes go in a column beside the stacked scenes. */
const SIDE_W = 470;

const scene = {
  sizes: {landscape: [2070, 900], square: [1100, 1200], portrait: [1000, 1560]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const arrangement = ARRANGE[ctx.view.shape];
    const C = resolveChain(p);
    const n = C.n;
    const k = C.disputed ?? Math.floor((n - 1) / 2);
    const lossCount = Math.min(2, p.losses.length);
    const stageSize = PANEL[arrangement];
    const side = arrangement === 'column' && ctx.view.shape === 'square';
    const header = HEADER[arrangement];
    // stacked: the band between the panels must hold the guide chip
    const guideProbe = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: stageSize.w * 0.62, size: 30, maxLines: 2}) : null;
    const colGap = Math.max(46, (guideProbe ? guideProbe.box.h : 0) + 20 - 36);
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap: arrangement === 'row' ? 70 : colGap});

    // ---- chain geometry inside a panel (same for A and B)
    const F = stageSize.h - 70;
    const room = stageSize.w - (arrangement === 'column' ? GUIDE_ROOM : 0);
    let H = 240;
    for (let it = 0; it < 6; it++) H = fitChainH(n, room - 30 - pendZone(H) - SHARDS * H, Math.min(260, (F - 40) / 1.36), lossCount, GAP);
    const pz = pendZone(H);
    const used = pz + chainWidth(n, H, lossCount, GAP) + SHARDS * H;
    const left = (room - used) / 2;
    const x0 = left + pz;
    const linksA = C.links.map((l, i) => (i === k ? {...l, status: 'proposed'} : l));
    const linksB = C.links.map((l, i) => (i === k ? {...l, status: 'disputed'} : l));
    const altAtK = C.alternatives.filter(a => a.link === k).slice(0, 1);
    const mk = (prefix, links, stop, bars) => chainStage(ctx, {
      prefix, x0, floorY: F, H, n, lossCount, links, barriers: bars, start: W.start, strike: W.strike,
      stopAtLink: stop, floorLeft: left - 6, floorRight: room - left + 6, maxTileDur: 0.2, gapRatio: GAP,
    });
    const stages = [mk('sa', linksA, null, []), mk('sb', linksB, k, altAtK.map(a => ({link: a.link})))];

    // pendulum trigger: the bob's right edge meets tile 0's face when the string hangs straight
    const tile0 = stages[0].bodies[0];
    const rb = H * 0.12;
    const hitLocal = {x: -tile0.w, y: -0.74 * H};
    const hit = bodyPoint(tile0, 0, hitLocal);
    const Lp = H * 0.56;
    const pivot = {x: hit.x - rb, y: hit.y - Lp};
    const pend = ['a', 'b'].map(key => pendulumArt(ctx, {name: `pend-${key}`, pivot, L: Lp, rb, floorY: F, H}));

    // ---- panels, headers
    const colors = [th.accent4, th.accent];
    const headers = geo.panels.map((pn, i) => sceneHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x + 10, y: pn.headerY + 6, w: pn.w - (arrangement === 'row' ? 20 : 20 + GUIDE_ROOM), h: header - 12, color: colors[i],
    }));
    // ring around the changed link (contact zone of tile k and its successor)
    const st = stages[0];
    const kx = k < n - 1 ? (st.tiles[k].pivot.x + st.tiles[k + 1].left) / 2 : (st.tiles[n - 1].pivot.x + st.plinth.x) / 2;
    // the ring rides on link k's contact point (tile k's top corner), offset into the gap before contact
    const ring = {rx: Math.max(st.spacing * 0.62, H * 0.24), ry: 0.27 * H, gapHalf: (k < n - 1 ? st.tiles[k + 1].left - st.tiles[k].pivot.x : st.plinth.x - st.tiles[k].pivot.x) / 2, kx};
    const ringCenter = (stage, angles) => {
      const b = stage.bodies[k];
      const tr = bodyPoint(b, angles[k] * DEG, {x: 0, y: -b.h});
      const c0 = stage.sim.contactTh[k] || 0.3;
      const m = clamp(angles[k] * DEG / c0);
      return {x: tr.x + ring.gapHalf * (1 - m), y: tr.y + 0.12 * H * (1 - m)};
    };
    const ringNodes = geo.panels.map((pn, i) => g({name: `ring-${i}`, opacity: 0},
      h('ellipse', {rx: r(ring.rx), ry: r(ring.ry), fill: i ? th.accentSoft : th.accent4Soft, 'fill-opacity': 0.16, stroke: colors[i], 'stroke-width': 4.5, 'stroke-dasharray': i ? '12 9' : null}),
      i && ctx.show('key') ? g({name: 'ring-1-q', transform: T(ring.rx * 0.78, -ring.ry * 0.86)},
        h('circle', {r: 19, fill: th.card, stroke: th.accent, 'stroke-width': 3}),
        h('text', {x: 0, y: 8, 'text-anchor': 'middle', 'font-size': 23, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.accent}, '?')) : null,
    ));

    // ---- legend of events + changing notes: a footer under the scenes, or (square
    // boxes) a column beside the stacked scenes so the block fills the box
    const bw0 = geo.w;
    const size = 30;
    const sideX = bw0 + 44;
    const items = [...C.events.map((e, i) => ({i, text: `${i + 1}. ${e.label}`})), {i: -1, text: `${t.lossAs}: ${p.losses.map(l => l.label).join(' · ')}`}];
    const iconS = side ? 44 : size * 1.25;
    const iconOf = (it, x, iy) => (it.i >= 0
      ? g({transform: T(x, iy)}, dieFace(ctx, {s: iconS, k: it.i + 1, fill: tileColor(ctx, it.i), pip: '#ffffff'}))
      : g({transform: T(x + iconS * 0.82, iy + iconS)}, lossArt(ctx, {name: 'legend-urn', w: iconS * 0.64, h: iconS, kind: 'vase'}).node));
    const chipOf = (it, x, y, maxW) => chip(ctx, it.text, {x, y, maxWidth: maxW, size: side ? 33 : size * 0.9, maxLines: side ? 5 : 2, fill: it.i < 0 ? th.accent3Soft : th.card, stroke: it.i < 0 ? th.accent3 : th.accent2});
    let legend = null;
    let legendBottom = side ? 0 : geo.h + 18;
    const parts = [];
    if (ctx.show('key') && side) {
      let y = 0;
      const maxW = SIDE_W - iconS - 12;
      for (const it of items) {
        const probe = chipOf(it, 0, 0, maxW);
        const rh = Math.max(probe.box.h, iconS);
        parts.push(iconOf(it, sideX, y + (rh - iconS) / 2));
        parts.push(chipOf(it, sideX + iconS + 12, y + (rh - probe.box.h) / 2, maxW).node);
        y += rh + 12;
      }
      legendBottom = y;
    } else if (ctx.show('key')) {
      const footTop = geo.h + 18;
      const maxW = arrangement === 'row' ? Math.min(560, bw0 / Math.min(items.length, 3) - 40) : bw0 / 2 - 30;
      const cells = items.map(it => ({...it, c: chipOf(it, 0, 0, maxW)}));
      // flow layout: wrap into rows centred on the block
      const rows = [];
      let cur = [], wsum = 0;
      for (const cl of cells) {
        const wv = cl.c.box.w + iconS + 12;
        if (cur.length && wsum + wv + 24 > bw0) { rows.push(cur); cur = []; wsum = 0; }
        cur.push(cl); wsum += wv + 24;
      }
      if (cur.length) rows.push(cur);
      let y = footTop;
      rows.forEach(row => {
        const rw = row.reduce((a, cl) => a + cl.c.box.w + iconS + 12, 0) + 24 * (row.length - 1);
        let x = (bw0 - rw) / 2;
        const rh = Math.max(...row.map(cl => cl.c.box.h));
        row.forEach(cl => {
          parts.push(iconOf(cl, x, y + (rh - iconS) / 2));
          parts.push(chipOf(cl, x + iconS + 12, y + (rh - cl.c.box.h) / 2, maxW).node);
          x += cl.c.box.w + iconS + 12 + 24;
        });
        y += rh + 12;
      });
      legendBottom = y;
    }
    if (parts.length) legend = g({name: 'legend', opacity: 0}, parts);
    const noteY = legendBottom + (legend ? 12 : 0);
    const noteX = side ? sideX + SIDE_W / 2 : bw0 / 2;
    const noteW = side ? SIDE_W : bw0 * 0.95;
    // balanced lines (no orphan word on a second line)
    const cSize = side ? 31 : 36, nSize = side ? 31 : 32;
    const changeW = balancedWidth(ctx, p.changedFact, {maxWidth: side ? SIDE_W : bw0 * 0.92, size: cSize, maxLines: side ? 4 : 2});
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: noteX, y: noteY, anchor: 'middle', maxWidth: changeW, size: cSize, maxLines: side ? 4 : 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const sharedText = `${t.sameFacts}: ${p.sharedFacts.join(' · ')}`;
    const noteMax = side ? 4 : 2;
    const shared = p.sharedFacts.length && ctx.show('all') ? chip(ctx, sharedText, {x: noteX, y: noteY, anchor: 'middle', maxWidth: balancedWidth(ctx, sharedText, {maxWidth: noteW, size: nSize, maxLines: noteMax, weight: 500}), size: nSize, maxLines: noteMax, fill: th.card, name: 'shared-note', weight: 500}) : null;
    const neutral = ctx.show('all') ? chip(ctx, p.comparisonLabels.neutral, {x: noteX, y: noteY, anchor: 'middle', maxWidth: balancedWidth(ctx, p.comparisonLabels.neutral, {maxWidth: noteW, size: nSize, maxLines: noteMax, weight: 500}), size: nSize, maxLines: noteMax, fill: th.card, name: 'neutral-note', weight: 500}) : null;
    const notesH = Math.max(changeChip ? changeChip.box.h : 0, shared ? shared.box.h : 0, neutral ? neutral.box.h : 0);
    const footH = side ? 0 : legendBottom - (geo.h + 18) + 10 + notesH + 24;
    const sideH = side ? noteY + notesH : 0;
    // square: centre the side column against the stacked scenes
    const sideDy = side ? Math.max(0, (geo.h - sideH) / 2) : 0;

    // ---- guide joining the two rings (the changed detail), routed clear of both scenes
    const fin = stages.map(stg => stg.pose(1).semantic.angles);
    const rc = geo.panels.map((pn, i) => {
      const q = ringCenter(stages[i], fin[i]);
      return {x: pn.x + q.x, y: pn.y + q.y};
    });
    const topA = rc[0].y - ring.ry, topB = rc[1].y - ring.ry;
    const beamTop = pivot.y - 18 - 8; // pendulum arm (panel coordinates)
    const bars = stages[1].barriers;
    let guide, guideChip = null;
    if (arrangement === 'row') {
      // up out of ring A, across ABOVE both scenes (pendulum arm, barrier board), down into ring B
      const localTop = Math.min(beamTop, ...bars.map(b => b.y - 6), topA - geo.panels[0].y, topB - geo.panels[1].y, F - 1.08 * H);
      const yRun = geo.panels[0].y + localTop - 26;
      guide = orthoGuide(ctx, {name: 'guide', pts: [{x: rc[0].x, y: topA}, {x: rc[0].x, y: yRun}, {x: rc[1].x, y: yRun}, {x: rc[1].x, y: topB}], color: th.fg});
      if (ctx.show('key')) {
        // ON the run, over scene A's right part (nothing stands there after the fall),
        // clear of the headers above and scene B's pendulum arm
        const x0 = rc[0].x + 24, x1 = geo.panels[0].x + geo.panels[0].w + 30;
        const probe = chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, maxWidth: Math.min(560, Math.max(260, x1 - x0)), size: 32, maxLines: 2});
        const cx = x1 - x0 >= probe.box.w ? (x0 + x1) / 2 : (rc[0].x + rc[1].x) / 2;
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: cx, y: yRun - probe.box.h / 2, anchor: 'middle', maxWidth: Math.min(560, Math.max(260, x1 - x0)), size: 32, maxLines: 2, fill: th.card, stroke: th.fg, name: 'guide-chip'});
      }
    } else {
      // up out of ring A, right to the margin beyond the floors and shards, down past
      // the gap, left above scene B's standing tiles, down into ring B
      const xr = stageSize.w - GUIDE_ROOM / 2 + 4;
      const yA = Math.min(topA - 22, geo.panels[0].y + F - 0.98 * H);
      const yB = Math.min(topB - 22, geo.panels[1].y + F - 1.1 * H - 22);
      guide = orthoGuide(ctx, {name: 'guide', pts: [{x: rc[0].x, y: topA}, {x: rc[0].x, y: yA}, {x: xr, y: yA}, {x: xr, y: yB}, {x: rc[1].x, y: yB}, {x: rc[1].x, y: topB}], color: th.fg});
      if (ctx.show('key')) {
        // in the band between panel A's floor and panel B's header, left of the vertical run
        const bandTop = geo.panels[0].y + F + 36, bandBottom = geo.panels[1].headerY + 4;
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: xr - 16, y: (bandTop + bandBottom) / 2 - guideProbe.box.h / 2, anchor: 'end', maxWidth: stageSize.w * 0.62, size: 30, maxLines: 2, fill: th.card, stroke: th.fg, name: 'guide-chip'});
      }
    }

    const bw = side ? sideX + SIDE_W : bw0;
    const bh = side ? Math.max(geo.h, sideH) : geo.h + 18 + footH;
    const D = ctx.design;
    const s = Math.min(D.w / bw, D.h / bh);
    const ox = (D.w - bw * s) / 2, oy = (D.h - bh * s) / 2;
    return {contactU: stages[1].sim.starts[k + 1], ringCenter, geo, stages, pend, pivot, Lp, rb, headers, ringNodes, legend, changeChip, shared, neutral, sideDy, guide, guideChip, s, ox, oy, arrangement, k, n, hitLocal, altAtK};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)},
        L.stages[i].back,
        L.pend[i].node,
        L.stages[i].main,
      )),
      L.ringNodes,
      L.guide.node,
      L.guideChip && L.guideChip.node,
      g({transform: T(0, L.sideDy)},
        L.legend,
        L.changeChip && L.changeChip.node,
        L.shared && L.shared.node,
        L.neutral && L.neutral.node,
      ),
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const nodes = {};
    const barrierIn = seg(u, ...W.barrier);
    const a = L.stages[0].pose(u, {});
    const b = L.stages[1].pose(u, {barrierIn: L.altAtK.map(() => barrierIn)});
    Object.assign(nodes, a.nodes, b.nodes);
    // pendulums: held by a tether, released together, strike at W.start, small recoil, settle
    const bobs = L.pend.map((pd, i) => {
      const ang = pendAngle(u, reduced);
      Object.assign(nodes, pd.pose(ang, u < W.release ? 1 : 1 - seg(u, W.release, W.release + 0.012)));
      return pd.bobAt(ang);
    });
    // change beat
    const rp = seg(u, ...W.ring);
    [a, b].forEach((S, i) => {
      const q = L.ringCenter(L.stages[i], S.semantic.angles);
      const pn = L.geo.panels[i];
      nodes[`ring-${i}`] = {opacity: r(rp, 3), transform: T(pn.x + q.x, pn.y + q.y)};
    });
    // the ring's "?" hands over to the joint's "?" once the chain reaches the link
    if (ctx.show('key')) nodes['ring-1-q'] = {opacity: r(1 - seg(u, L.contactU, L.contactU + 0.03), 3)};
    const gp = ease.inOutCubic(seg(u, ...W.guide));
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const cp = seg(u, ...W.changeChip);
    const noteP = seg(u, ...W.note);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - seg(u, 0.5, 0.55)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(seg(u, 0.55, 0.6) * (1 - noteP), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};

    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const sem = (S) => ({angles: S.semantic.angles, started: S.semantic.started, lossState: S.semantic.lossState, cracked: S.semantic.cracked, ghost: S.semantic.ghost, joints: S.semantic.joints});
    const A = sem(a), B = sem(b);
    const semantic = {
      beat,
      arrangement: L.arrangement,
      changedLink: L.k,
      a: A,
      b: B,
      bobA: P2(bobs[0]),
      bobEdgeA: P2({x: bobs[0].x + L.rb, y: bobs[0].y}),
      bobB: P2(bobs[1]),
      hitA: P2(bodyPoint(L.stages[0].bodies[0], a.semantic.angles[0] * DEG, L.hitLocal)),
      ringShown: rp >= 1,
      barrierB: r(barrierIn, 3),
      guideProgress: r(gp, 3),
      contactU: r(L.stages[1].sim.starts[L.k + 1], 4),
    };
    a.semantic.tops.forEach((q, i) => { semantic[`a${i}`] = q; });
    b.semantic.tops.forEach((q, i) => { semantic[`b${i}`] = q; });
    return {nodes, semantic};
  },
};

/**
 * Scenario header (letter badge + label + caption), like frameworks/paired.js
 * scenarioHeader() but the caption may take two lines instead of shrinking a
 * long caption to an unreadable size.
 */
function sceneHeader(ctx, o) {
  const th = ctx.theme;
  const size = Math.min(54, o.h * 0.4);
  const badgeR = size * 0.78;
  const tx = o.x + badgeR * 2 + 18;
  const mw = o.w - badgeR * 2 - 24;
  const parts = [
    h('circle', {cx: r(o.x + badgeR), cy: r(o.y + badgeR + 2), r: r(badgeR), fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    // with labels hidden the badge stays as a coloured marker (A = left/top, B = right/bottom)
    ctx.show('key') ? h('text', {x: r(o.x + badgeR), y: r(o.y + badgeR + 2 + size * 0.36), 'text-anchor': 'middle', 'font-size': r(size), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
  ];
  let y = o.y + 2;
  if (ctx.show('key')) {
    const f = ctx.fit(o.label, {maxWidth: mw, size, minSize: size * 0.7, maxLines: 1, weight: 700});
    parts.push(textBlock(f, {x: tx, y, fill: th.fg}));
    y += f.size * 1.24; // clear of the label's descenders
  }
  if (o.caption && ctx.show('all')) {
    const room = o.y + o.h - y;
    let cs = size * 0.6;
    let f2 = ctx.fit(o.caption, {maxWidth: mw, size: cs, minSize: cs, maxLines: 1, weight: 500});
    if (f2.truncated) {
      cs = Math.min(cs, (room / 2) / 1.2);
      f2 = ctx.fit(o.caption, {maxWidth: mw, size: cs, minSize: Math.min(cs, 20), maxLines: 2, weight: 500});
    }
    parts.push(textBlock(f2, {x: tx, y, fill: th.fgSoft}));
  }
  return g({name: o.name}, parts);
}

/**
 * Orthogonal guide through the given points with rounded corners (draws on,
 * no arrowhead: it links the two changed details, it does not assert a cause).
 */
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
      const p1 = {x: b.x - ((b.x - a.x) / la) * k1, y: b.y - ((b.y - a.y) / la) * k1};
      const p2 = {x: b.x + ((c.x - b.x) / lc) * k2, y: b.y + ((c.y - b.y) / lc) * k2};
      d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    } else d += `L${r(b.x)} ${r(b.y)}`;
  }
  const from = pts[0], to = pts[pts.length - 1];
  const node = g({name},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${name}-dotA`, cx: r(from.x), cy: r(from.y), r: 5.5, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(to.x), cy: r(to.y), r: 5.5, fill: color, opacity: 0}));
  const frame = (p, op = 1) => ({
    [name]: {opacity: op},
    [`${name}-line`]: {'stroke-dashoffset': r(len * (1 - p))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame, from, to};
}

/** Horizontal room the pendulum and its post need left of the first tile. */
function pendZone(H) {
  return H * 0.56 * Math.sin(-RAISED * DEG) + H * 0.12 * 2 + 44;
}

/** Pendulum angle (deg) over time: held, released, strike at W.start, small recoil, settle. */
function pendAngle(u, reduced) {
  if (u < W.release) return RAISED;
  if (u < W.start) {
    const tau = (u - W.release) / (W.start - W.release);
    return RAISED * (1 - ease.inQuad(tau));
  }
  if (reduced) return 0;
  const tau = clamp((u - W.start) / 0.08);
  return -5 * Math.sin(Math.PI * tau) * (1 - tau * 0.3);
}

/** Pendulum on a post: arm, string, bob and a tether that holds it until release. */
function pendulumArt(ctx, {name, pivot, L, rb, floorY, H}) {
  const th = ctx.theme;
  const reach = L * Math.sin(-RAISED * DEG) + rb + 20;
  const postX = pivot.x - reach;
  const topY = pivot.y - 18;
  const raisedBob = {x: pivot.x + L * Math.sin(RAISED * DEG), y: pivot.y + L * Math.cos(RAISED * DEG)};
  const node = g({name},
    h('rect', {x: r(postX - 9), y: r(topY), width: 18, height: r(floorY - topY + 6), rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(postX - 30), y: r(floorY - 4), width: 60, height: 14, rx: 4, fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(postX)} ${r(topY + 8)}H${r(pivot.x + 12)}`, stroke: th.ink, 'stroke-width': 12, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(postX)} ${r(topY + 8)}H${r(pivot.x + 12)}`, stroke: th.metal, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(pivot.x), cy: r(pivot.y), r: 6, fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    h('line', {name: `${name}-tether`, x1: r(postX + 9), y1: r(raisedBob.y - rb * 0.2), x2: r(raisedBob.x - rb * 0.6), y2: r(raisedBob.y), stroke: th.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '2 3'}),
    h('line', {name: `${name}-string`, x1: r(pivot.x), y1: r(pivot.y), stroke: th.fgSoft, 'stroke-width': 3}),
    g({name: `${name}-bob`},
      h('circle', {r: r(rb), fill: th.metalDark, stroke: th.ink, 'stroke-width': th.stroke}),
      h('circle', {cx: r(-rb * 0.35), cy: r(-rb * 0.35), r: r(rb * 0.28), fill: '#ffffff', opacity: 0.35})),
  );
  const bobAt = deg => ({x: pivot.x + L * Math.sin(deg * DEG), y: pivot.y + L * Math.cos(deg * DEG)});
  const pose = (deg, tether) => {
    const q = bobAt(deg);
    return {
      [`${name}-string`]: {x2: r(q.x), y2: r(q.y)},
      [`${name}-bob`]: {transform: T(q.x, q.y)},
      [`${name}-tether`]: {opacity: r(tether, 3)},
    };
  };
  return {node, pose, bobAt, H};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-01-contrast',
    title: 'Causal chain — proposed chain vs disputed link',
    titleEs: 'Cadena causal — Comparación de dos supuestos',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Cadena causal',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical toppling chains released by identical pendulums. Only one link differs: proposed in A (the chain runs on and the urn cracks), disputed in B (an alternative barrier stands behind it; the chain reaches the link and everything downstream is shown unresolved, neither fallen nor standing). A guide joins the changed link; no outcome is stated.',
    tags: ['causation', 'chain', 'comparison', 'disputed link', 'proposed', 'unresolved', 'side-by-side', 'stacked', 'pendulum'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causal-chain.js', 'src/animations/causation/kits/topple.js', 'src/frameworks/paired.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CHAIN_STRINGS,
  scene,
});
