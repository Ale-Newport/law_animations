/**
 * LAW-0079 — Trazabilidad de una cita · contrast
 *
 * Storyboard (two complete, identical first-person library bays; exactly one
 * fact differs — whether the ORIGINAL itself is opened):
 *  0.00–0.17  base: in both compact bays the catalogue screen shows the query
 *             and its result, the citing article stands on its lectern, the
 *             intermediate reference lies open on its cradle (its slot in the
 *             short shelf is empty), the original folio waits in a closed, hinged
 *             archive box, the left hand holds an empty trail card and the right
 *             hand rests on the counter (both hands always in view).
 *  0.17–0.40  change: in A the right hand swings the box lid open (access to
 *             the original) and rests on the box rim; in B the lid stays shut and
 *             a dashed "cited in" line runs from the treatise's own footnote to
 *             the closed box — the source is known only as the treatise gives it.
 *             The changed fact is named in the footer.
 *  0.40–0.77  parallel action: the same brass chain runs in both bays from the
 *             footnote of the note to the quoted passage of the treatise. In A
 *             the hand lifts the original out and a second chain runs from the
 *             treatise's footnote to the cited entry; in B nothing more is
 *             opened and the card records row 3 as "as cited in …" (dashed).
 *  0.77–1.00  guide: a close-up of each card's third row (the recorded
 *             difference: chain badge vs dashed "as cited in …") opens beside the
 *             card; a neutral guide joins the two boxes (open and emptied vs
 *             closed); shared facts, then a neutral note — no winner, score or
 *             verdict about either citation.
 * Row (side by side) on wide boxes, column (stacked) on tall ones; on 1:1 two
 * tall bays (the same props, stacked vertically) stand side by side and fill the
 * box's height. The guide runs in a lane outside the bays.
 * @module animations/research/LAW-0079
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {chip, statusTag, textBlock} from '../../primitives/annotate.js';
import {neutralNote} from '../../frameworks/paired.js';
import {trailFields, TRAIL_DEFAULTS, KIT_STRINGS, trailBay, bayPlacement, labelPlacer, chainRoute, BRASS} from './kits/trazabilidad-de-una-cita.js';

const ID = 'LAW-0079';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  toLid: [0.18, 0.24], lidOpen: [0.24, 0.31], lidBack: [0.31, 0.38], ghost2: [0.24, 0.36], changeChip: [0.2, 0.28],
  chain1: [0.41, 0.52], pulse0: [0.4, 0.45], noteHl: [0.4, 0.44], row0: [0.41, 0.45], pulse1: [0.52, 0.57], row1: [0.52, 0.56], innerHl: [0.53, 0.57], pulse2: [0.55, 0.6],
  toBox: [0.53, 0.58], lift: [0.58, 0.62], present: [0.62, 0.68], chain2: [0.58, 0.74], pulse3: [0.74, 0.78], entryHl: [0.74, 0.77], row2: [0.74, 0.77], row2b: [0.72, 0.76],
  tags: [0.74, 0.79], inset: [0.775, 0.81], guide: [0.78, 0.9],
  // footer captions share one slot and never cross-fade
  changeOut: [0.47, 0.5], sharedIn: [0.51, 0.55], sharedOut: [0.84, 0.865], note: [0.875, 0.93],
};

const sceneSchema = {
  ...trailFields,
  ...contrastFields(),
};

const defaultParams = {
  ...TRAIL_DEFAULTS,
  scenarioA: {label: 'Access to the original', caption: 'The box is opened and the chain reaches the entry itself'},
  scenarioB: {label: 'Indirect citation', caption: 'The box stays closed; the source is cited as the treatise gives it'},
  changedFact: 'Only one fact differs: whether the original itself is opened',
  sharedFacts: ['Same note', 'Same treatise and page', 'Same cited entry'],
  comparisonLabels: {guide: 'Changed fact: where the trail ends', neutral: 'Two ways of recording the same citation — no judgement on either'},
};

/**
 * Panel arrangement per shape. Every panel holds a compact bay (shelf, catalogue screen,
 * lectern, cradle, hinged box, card) scaled to the panel: the wide 'pair' bay on 16:9 and
 * 9:16, the tall 'pairTall' bay on 1:1 (the same props, stacked, so two bays side by side fill
 * the square's height instead of forming a thin band). The close-up of the card's third row
 * (the recorded difference) sits on the counter front of each bay, beside the card. Inset text
 * sizes give about 17 px at 1080p.
 * 'row' = side by side (16:9, 1:1), 'column' = stacked with the header above each bay (9:16).
 * laneR: a lane right of the second bay; the guide then runs from A's box through the gap
 * between the bays, under B and up that lane to B's box (both boxes stand at their bay's
 * right edge).
 */
const STAGES = {
  landscape: {size: [2110, 1000], arrangement: 'row', placement: 'pair', header: 118, gap: 44, lane: 64, footer: 104, insetSize: 23},
  square: {size: [1480, 1160], arrangement: 'row', placement: 'pairTall', header: 112, gap: 52, lane: 58, laneR: 40, footer: 106, insetSize: 25},
  portrait: {size: [1040, 1560], arrangement: 'column', placement: 'pair', header: 108, gap: 70, lane: 60, footer: 120, insetSize: 20.5},
};

/**
 * Fit text with balanced lines: when it wraps, the width is narrowed to the smallest one that
 * keeps the same line count and size, so no line is left with a single orphaned word.
 */
function balancedFit(ctx, text, o) {
  const f = ctx.fit(text, o);
  if (f.lines.length < 2 || f.truncated) return f;
  let lo = o.maxWidth * 0.45, hi = o.maxWidth, best = f;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const q = ctx.fit(text, {...o, maxWidth: mid});
    if (q.lines.length === f.lines.length && !q.truncated && q.size === f.size) { best = q; hi = mid; } else lo = mid;
  }
  return best;
}

/** Chip width that wraps a footer text into balanced lines (chip padding as in annotate.chip). */
function balancedChipW(ctx, text, maxWidth, size, weight, maxLines = 2) {
  const padX = size * 0.6;
  const f = balancedFit(ctx, text, {maxWidth: maxWidth - padX * 2, size, minSize: size * 0.75, maxLines, weight});
  return Math.min(maxWidth, f.width + padX * 2 + 2);
}

const scene = {
  sizes: {landscape: STAGES.landscape.size, square: STAGES.square.size, portrait: STAGES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const St = STAGES[shape];
    const S = {w: St.size[0], h: St.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const pl = bayPlacement(St.placement);
    const [bw, bh] = pl.size;
    const row = St.arrangement === 'row';
    const laneR = St.laneR ?? 0;
    // panel width (design units): side by side, or the full width left of the stacked lane
    const panelW = row ? (S.w - St.gap - laneR) / 2 : S.w - St.lane;
    // scenario captions wrap (balanced) instead of being cut; the header grows with them
    const capW0 = panelW - 110;
    const capFits = [p.scenarioA, p.scenarioB].map(sc => (sc.caption && ctx.show('all') ? balancedFit(ctx, sc.caption, {maxWidth: capW0, size: 26, minSize: 21, maxLines: 2, weight: 500}) : null));
    const capLines = Math.max(1, ...capFits.map(f => (f ? f.lines.length : 1)));
    // scenario labels wrap to a second line instead of an ellipsis (narrow panels)
    const hh0 = St.header - 12;
    const hSize = Math.min(54, hh0 * 0.4);
    const labW = panelW - 12 - hSize * 0.78 * 2 - 24;
    const labFits = [p.scenarioA, p.scenarioB].map(sc => (ctx.show('key') ? balancedFit(ctx, sc.label, {maxWidth: labW, size: hSize, minSize: hSize * 0.72, maxLines: 2, weight: 700}) : null));
    const labLines = Math.max(1, ...labFits.map(f => (f ? f.lines.length : 1)));
    const labExtra = labLines > 1 ? Math.max(...labFits.map(f => (f ? f.lineHeight : 0))) : 0;
    // both headers share one height
    const header = St.header + (capLines - 1) * 30 + labExtra;
    // panel boxes (design units)
    const panelH = row ? S.h - header - St.lane - St.footer : (S.h - header * 2 - St.gap - St.footer) / 2;
    const k = Math.min(panelW / bw, panelH / bh);
    const panels = [0, 1].map(i => {
      const px = row ? i * (panelW + St.gap) : 0;
      const py = row ? header : header + i * (panelH + header + St.gap);
      const bx = px + (panelW - bw * k) / 2;
      const by = py + (panelH - bh * k) / 2;
      return {x: px, y: py, w: panelW, h: panelH, bx, by, k, headerY: py - header};
    });
    const toD = (i, q) => ({x: panels[i].bx + q.x * k, y: panels[i].by + q.y * k});
    const boxD = (i, b) => ({x: panels[i].bx + b.x * k, y: panels[i].by + b.y * k, w: b.w * k, h: b.h * k});
    // two bays: A consults the original (dashed link never used), B cites it as the treatise gives it
    const stages = ['a', 'b'].map((key, i) => trailBay(ctx, {prefix: `s${key}`, pl, p, t, finalMode: i === 0 ? 'source' : 'intermediate', lid: true, bookOpen: true, altSlot: true, altWrap: true}));
    const altOf = i => (i === 0 ? null : stages[i].altText);
    // close-up of each card's third row (the recorded difference), with lens lines to the row
    // both close-ups use one text size (the smaller one that keeps each text whole), so the two
    // recorded rows differ only in what they say
    const inOptsOf = i => ({name: `inset-${i}`, size: St.insetSize, consulted: i === 0, title: p.sources.source, place: p.citations.folio, alt: altOf(i), showText: ctx.show('all'), zone: boxD(i, pl.insetZone)});
    const insetSize = Math.min(...[0, 1].map(i => rowInset(ctx, inOptsOf(i)).size));
    const insets = [0, 1].map(i => {
      const st = stages[i];
      const cd = st.card;
      const r3 = cd.rows[2];
      const xl = cd.x0 + cd.strip, xr = cd.x0 + cd.w - 4;
      const corners = [{x: xl, y: r3.y}, {x: xr, y: r3.y}, {x: xr, y: r3.y + r3.h}, {x: xl, y: r3.y + r3.h}].map(q => toD(i, st.cardPt(q)));
      const ins = rowInset(ctx, {...inOptsOf(i), size: insetSize, fixed: true});
      const b = ins.box;
      // lens lines: from the row's corners to the facing corners of the close-up (right of the
      // row on the counter front)
      const pairs = [[corners[1], {x: b.x, y: b.y}], [corners[2], {x: b.x, y: b.y + b.h}]];
      const outline = `M${corners.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}Z`;
      const node = g({name: `inset-${i}`, opacity: 0},
        h('path', {d: outline, fill: 'none', stroke: th.accent, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
        pairs.map(([q1, q2]) => h('line', {x1: r(q1.x), y1: r(q1.y), x2: r(q2.x), y2: r(q2.y), stroke: th.accent, 'stroke-width': 1.8, 'stroke-dasharray': '4 5', opacity: 0.8})),
        ins.node);
      return {node, box: b};
    });

    // scenario headers
    const colors = [th.accent4, th.inkSoft];
    const headers = panels.map((pn, i) => {
      const hd = pairHeader(ctx, {name: `head-${i}`, letter: i ? 'B' : 'A', fit: labFits[i], x: pn.x + 6, y: pn.headerY + 6, h: hh0, color: colors[i]});
      const f = capFits[i];
      const capNode = f ? textBlock(f, {x: pn.x + 6 + hSize * 0.78 * 2 + 18, y: pn.headerY + 6 + hh0 * 0.42 + hSize * 0.62 + labExtra, fill: th.fgSoft}) : null;
      return g(null, hd, capNode);
    });

    // final geometry (bay units → design) for tags and the guide
    const fin = stages.map((st, i) => st.pose(finalValues(i === 0)).semantic);
    const boxTop = i => {
      const A = pl.archive;
      return toD(i, {x: A.x, y: A.y - A.h});
    };
    // B's closed lid band rises above the box; A's lid is swung open behind it
    const boxBox = i => boxD(i, {x: pl.archive.x - pl.archive.w / 2, y: pl.archive.y - pl.archive.h + (i ? -20 : 12), w: pl.archive.w, h: pl.archive.h + (i ? 20 : -12)});
    const placer = labelPlacer({x: 0, y: 0, w: S.w, h: S.h}, {margin: 6});
    // obstacles: key props of both bays and the close-ups (the tags must not cover them)
    for (const i of [0, 1]) {
      const st = stages[i];
      placer.addObstacle(boxBox(i));
      placer.addObstacle(boxD(i, i === 0 ? st.folioPresentBox : st.folioInBoxBox));
      const B = pl.book;
      placer.addObstacle(boxD(i, {x: pl.cradle.x - B.cw * pl.bookK - 8, y: pl.cradle.y - (B.hB / 2) * pl.bookK - 8, w: B.cw * 2 * pl.bookK + 16, h: B.hB * pl.bookK + 16}));
      placer.addObstacle(boxD(i, {x: pl.page.x - 6, y: pl.page.y - 6, w: pl.page.w + 12, h: pl.page.h + 12}));
      placer.addObstacle(boxD(i, {...pl.screen, y: pl.screen.y - 30, h: pl.screen.h + 30}));
      placer.addObstacle(boxD(i, stages[i].cardBox));
      placer.addObstacle(insets[i].box);
      // the drawn chains (final routes, as the stage routes them): a tag never sits on a chain
      const f = fin[i];
      const routes = [chainRoute(f.noteHook, f.inHook, pl.route1 ? pl.route1(f.noteHook, f.inHook) : {})];
      if (i === 0) routes.push(chainRoute(f.outHook, f.folioHook, pl.route2 ? pl.route2(f.outHook, f.folioHook) : {}));
      for (const rt of routes) for (let m = 0; m <= 30; m++) {
        const q = toD(i, rt.at(m / 30));
        placer.addObstacle({x: q.x - 9 * k, y: q.y - 9 * k, w: 18 * k, h: 18 * k});
      }
      // the right arm: A holds the original up (from the right edge), B rests on the counter
      const path = st.armPath(fin[i].handR).map(q => toD(i, q));
      for (let j = 1; j < path.length; j++) for (let m = 0; m <= 20; m++) {
        const q = {x: path[j - 1].x + (path[j].x - path[j - 1].x) * m / 20, y: path[j - 1].y + (path[j].y - path[j - 1].y) * m / 20};
        placer.addObstacle({x: q.x - 40 * k, y: q.y - 40 * k, w: 80 * k, h: 80 * k});
      }
    }
    // outside the bays is off limits except the lane/footers (keep tags inside their own bay)
    const tall = St.placement === 'pairTall';
    const tagSize = 26;
    const tags = [];
    if (ctx.show('key') && tall) {
      // 1:1: each tag stands on the counter right under its own box — the same place in both
      // bays, clear of the raised original, the shelf and the screen (no leader needed)
      const inBay = i => ({x: panels[i].bx, y: panels[i].by, w: bw * k, h: bh * k});
      for (const [i, text, color, name] of [[0, t.opened, th.accent4, 'tag-a'], [1, t.notOpened, th.inkSoft, 'tag-b']]) {
        const bb = inBay(i);
        const pz = labelPlacer(bb, {margin: 3});
        pz.obstacles.push(...placer.obstacles);
        const target = toD(i, {x: pl.archive.x, y: pl.archive.y});
        const cands = [0, 20, 40, 60, 90, 120].flatMap(dx => [{x: target.x + dx, y: target.y + 3, anchor: 'middle'}, {x: bb.x + bb.w - 16 - dx * 0.2, y: target.y + 3, anchor: 'end'}]);
        // (candidates only: the tag never wanders off to a spot that needs a long leader)
        const res = pz.place(cands, c => leaderTag(ctx, text, {...c, name, color, size: tagSize, target, maxWidth: bb.w * 0.8}));
        placer.addLabel(res.box);
        tags.push(res);
      }
    } else if (ctx.show('key')) {
      const inBay = i => ({x: panels[i].bx, y: panels[i].by, w: bw * k, h: bh * k});
      const tagFor = (i, text, target, color, name, below = false) => {
        const bb = inBay(i);
        const pz = labelPlacer(bb, {margin: 3});
        pz.obstacles.push(...placer.obstacles);
        const candsOf = sz => {
          const dy = below ? 4 : -sz * 2.8;
          return [
            {x: target.x, y: target.y + dy, anchor: 'middle'},
            {x: target.x + 30, y: target.y + dy, anchor: 'end'},
            {x: bb.x + bb.w - 5, y: target.y + dy, anchor: 'end'},
            {x: target.x - 60, y: target.y + dy, anchor: 'end'},
            {x: target.x + 60, y: target.y + dy, anchor: 'start'},
          ];
        };
        const make = (sz, lines = 1, mw = bb.w * 0.8) => c => (lines > 1
          ? leaderTag2(ctx, text, {...c, name, color, size: sz, target, maxWidth: mw})
          : leaderTag(ctx, text, {...c, name, color, size: sz, target, maxWidth: mw}));
        // clear = inside its bay, over no prop, chain, arm, close-up or other label
        const clear = res => {
          const b = res.box;
          if (res.cut || b.x < bb.x + 3 || b.y < bb.y + 3 || b.x + b.w > bb.x + bb.w - 3 || b.y + b.h > bb.y + bb.h - 3) return false;
          return ![...pz.obstacles, ...placer.labels].some(o2 => o2.x < b.x + b.w && o2.x + o2.w > b.x && o2.y < b.y + b.h && o2.y + o2.h > b.y);
        };
        const tries = [];
        // 1) right by the target (full size)
        for (const c of candsOf(tagSize)) tries.push(() => make(tagSize)(c));
        // 2) (the raised original) the free counter front right of the close-up, in one line or
        //    two balanced lines, with its leader up to the original — never over the chain
        if (below) {
          const ib = insets[i].box;
          const x0 = ib.x + ib.w + 10, x1 = bb.x + bb.w - 8;
          const y0 = panels[i].by + pl.counterY * k + 10, y1 = bb.y + bb.h - 8;
          if (x1 - x0 > tagSize * 4) {
            for (const lines of [1, 2]) {
              for (let yy = y0; yy < y1 - tagSize * 1.75; yy += 12) tries.push(() => make(tagSize, lines, x1 - x0)({x: x1, y: yy, anchor: 'end'}));
            }
          }
        }
        // 3) right by the target, a little smaller (still ≥ 20 px at 1080p)
        for (const c of candsOf(tagSize * 0.92)) tries.push(() => make(tagSize * 0.92)(c));
        for (const tr of tries) {
          const res = tr();
          if (clear(res)) { placer.addLabel(res.box); return res; }
        }
        const res = pz.place(candsOf(tagSize), make(tagSize), target, {maxDist: 320});
        placer.addLabel(res.box);
        return res;
      };
      // A: the tag hangs just below the raised original, clear of its chain (its leader never
      // crosses the page); where that band is too tight it stands on the free counter front
      const fA = boxD(0, stages[0].folioPresentBox);
      tags.push(tagFor(0, t.opened, {x: fA.x + fA.w * 0.5, y: fA.y + fA.h - 2}, th.accent4, 'tag-a', true));
      const bt = boxTop(1);
      tags.push(tagFor(1, t.notOpened, {x: bt.x, y: bt.y - 20 * k}, th.inkSoft, 'tag-b'));
    }

    // guide: joins the two boxes through a lane outside the bays
    const endA = {x: boxTop(0).x, y: panels[0].by + (pl.archive.y) * k};
    const endB = {x: boxTop(1).x, y: panels[1].by + (pl.archive.y) * k};
    let lanePts;
    if (row && laneR) {
      // from the right edge of each bay, level with its box: A through the gap between the
      // bays, B up the lane at its right; the two join under B
      const ly = Math.max(panels[0].by + bh * k, panels[1].by + bh * k) + St.lane * 0.5;
      const midY = pl.archive.y - pl.archive.h * 0.5;
      const aR = {x: panels[0].bx + bw * k, y: panels[0].by + midY * k};
      const bR = {x: panels[1].bx + bw * k, y: panels[1].by + midY * k};
      const gx = (aR.x + panels[1].bx) / 2;
      const rx = Math.min(S.w - 6, bR.x + laneR * 0.6);
      lanePts = [aR, {x: gx, y: aR.y}, {x: gx, y: ly}, {x: rx, y: ly}, {x: rx, y: bR.y}, bR];
    } else if (row) {
      const ly = Math.max(panels[0].by + bh * k, panels[1].by + bh * k) + St.lane * 0.5;
      lanePts = [endA, {x: endA.x, y: ly}, {x: endB.x, y: ly}, endB];
    } else {
      const lx = S.w - St.lane * 0.5;
      const aR = {x: panels[0].bx + bw * k, y: endA.y - pl.archive.h * 0.5 * k};
      const bR = {x: panels[1].bx + bw * k, y: endB.y - pl.archive.h * 0.5 * k};
      lanePts = [aR, {x: lx, y: aR.y}, {x: lx, y: bR.y}, bR];
    }
    const guide = laneGuide(ctx, 'guide', lanePts, 28, th.accent);
    let guideChip = null;
    if (ctx.show('key')) {
      if (row) {
        // on the lane's horizontal run (1:1: the run under B)
        const [h1, h2] = laneR ? [lanePts[2], lanePts[3]] : [lanePts[1], lanePts[2]];
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: (h1.x + h2.x) / 2, y: h1.y - 22, anchor: 'middle', maxWidth: Math.min(700, Math.abs(h2.x - h1.x) - 80), size: 28, maxLines: 1, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      } else {
        // stacked: the caption sits in the gap between A's bay and B's header, left of the lane
        const lx = lanePts[1].x;
        const gapTop = panels[0].by + bh * k, gapBot = panels[1].headerY + 6;
        const probe = chip(ctx, p.comparisonLabels.guide, {x: 0, y: 0, anchor: 'end', maxWidth: S.w * 0.8, size: 26, maxLines: 1});
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: lx - 14, y: (gapTop + gapBot) / 2 - probe.box.h / 2, anchor: 'end', maxWidth: S.w * 0.8, size: 26, maxLines: 1, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      }
    }
    // footer: changed fact → shared facts → neutral note (one slot, no cross-fade)
    const footY = S.h - St.footer + 14;
    const footW = S.w * 0.94;
    // (two-line footers wrap into balanced lines: no single word is left alone on the second)
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: S.w / 2, y: footY, anchor: 'middle', maxWidth: balancedChipW(ctx, p.changedFact, footW, 34, 600), size: 34, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const sharedText = `${t.sameFacts}: ${p.sharedFacts.join(' · ')}`;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, sharedText, {x: S.w / 2, y: footY, maxWidth: balancedChipW(ctx, sharedText, footW, 32, 500), size: 32, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: S.w / 2, y: footY, maxWidth: balancedChipW(ctx, p.comparisonLabels.neutral, footW, 32, 500), size: 32, name: 'neutral-note'}) : null;
    return {S, s, ox, oy, panels, k, stages, headers, tags, guide, guideChip, changeChip, shared, neutral, pl, row, arrangement: St.arrangement, insets};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.panels.map((pn, i) => g({transform: T(pn.bx, pn.by, 0, L.k)}, L.stages[i].node)),
      L.insets.map(x => x.node),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.tags.map(x => x.node),
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    // the catalogue search is part of the shared base situation: typed, result lit
    const common = {
      type: 1, result: 1,
      chain1: s('chain1'), pulse0: s('pulse0'), noteHl: s('noteHl'), pulse1: s('pulse1'), innerHl: s('innerHl'),
    };
    const vA = {...common, toLid: s('toLid'), lidOpen: s('lidOpen'), lidBack: s('lidBack'), toBox: s('toBox'), lift: s('lift'), present: s('present'), chain2: s('chain2'), pulse2: s('pulse2'), pulse3: s('pulse3'), entryHl: s('entryHl'),
      rows: [s('row0'), s('row1'), s('row2')]};
    const vB = {...common, ghost2: s('ghost2'), pulse2: s('pulse2'), rows: [s('row0'), s('row1'), s('row2b')]};
    const a = L.stages[0].pose(vA);
    const b = L.stages[1].pose(vB);
    const nodes = {...a.nodes, ...b.nodes};
    const insetP = r(s('inset'), 3);
    nodes['inset-0'] = {opacity: insetP};
    nodes['inset-1'] = {opacity: insetP};
    const gp = s('guide');
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    if (L.tags.length) {
      nodes['tag-a'] = {opacity: r(s('tags'), 3)};
      nodes['tag-b'] = {opacity: r(s('tags'), 3)};
    }
    if (L.changeChip) nodes['change-chip'] = {opacity: r(s('changeChip') * (1 - s('changeOut')), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(s('sharedIn') * (1 - s('sharedOut')), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(s('note'), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const sa = a.semantic, sb = b.semantic;
    const stops = (sem, second) => ['note', ...(sem.chain1 >= 1 ? ['intermediate'] : []), ...(second && sem.chain2 >= 1 ? ['source'] : [])];
    return {
      nodes,
      semantic: {
        beat,
        a: {lidOpen: sa.lidOpen, folioHolder: sa.folioHolder, chainStops: stops(sa, true), holderR: sa.holderR, chain1: sa.chain1, chain2: sa.chain2, handInView: sa.handRInView},
        b: {lidOpen: sb.lidOpen, folioHolder: sb.folioHolder, chainStops: stops(sb, false), holderR: sb.holderR, chain1: sb.chain1, chain2: sb.chain2, handInView: sb.handRInView},
        aHand: sa.handR, aLidEdge: sa.lidEdge, aFolioGrip: sa.folioGrip, aClasp1: sa.clasp1, aClasp2: sa.clasp2, aFolioHook: sa.folioHook,
        bHand: sb.handR, bClasp1: sb.clasp1, aHandL: sa.handL, bHandL: sb.handL, aCardGrip: sa.cardGrip, bCardGrip: sb.cardGrip, aFolioTop: sa.folioTop, bFolioTop: sb.folioTop,
        sameBook: JSON.stringify(sa.bookCenter) === JSON.stringify(sb.bookCenter),
        sameFolio: JSON.stringify(sa.folioTop) === JSON.stringify(sb.folioTop),
        sameChain1: JSON.stringify(sa.clasp1) === JSON.stringify(sb.clasp1),
        sameHandAtRest: JSON.stringify(sa.handR) === JSON.stringify(sb.handR),
        ghostB: r(s('ghost2'), 3),
        cardRowsA: vA.rows.map(q => r(q, 3)), cardRowsB: vB.rows.map(q => r(q, 3)),
        insets: insetP,
        guideProgress: r(gp, 3),
        arrangement: L.arrangement,
        reach: {a: sa.allReached, b: sb.allReached},
        allReached: sa.allReached && sb.allReached,
      },
    };
  },
};

/**
 * Close-up of a card's third row (the recorded difference), sized for ~18 px at 1080p:
 * the row's badge (brass link = followed to the original; dashed ring = cited as given by
 * the intermediate), the source work and place, and — for the indirect citation — the
 * "as cited in …" line. With labels hidden it keeps the badge and shows bars.
 */
function rowInset(ctx, o) {
  const th = ctx.theme;
  const z = o.zone;
  let size = o.size;
  // the work title (up to three lines), its place on a line of its own, then the alternative
  const build = sz => {
    const pad = sz * 0.6, strip = sz * 0.8, badgeR = sz * 0.72;
    const textX = z.x + strip + pad + badgeR * 2 + pad * 0.7;
    const right = z.x + z.w - pad;
    const tf = o.showText ? balancedFit(ctx, o.title, {maxWidth: right - textX, size: sz, minSize: sz * 0.85, maxLines: 3, weight: 600}) : null;
    const pf = o.showText ? ctx.fit(o.place, {maxWidth: right - textX, size: sz, minSize: sz * 0.85, maxLines: 1, weight: 800}) : null;
    const af = o.showText && o.alt ? balancedFit(ctx, o.alt, {maxWidth: right - textX, size: sz * 0.92, minSize: sz * 0.8, maxLines: 3, weight: 500}) : null;
    const tH = (tf ? tf.height : sz * 1.3) + sz * 0.25 + (pf ? pf.height : sz * 1.1);
    const aH = o.alt ? (af ? af.height : sz * 1.1) : 0;
    const hh = pad + tH + (o.alt ? sz * 0.45 + aH : 0) + pad;
    return {pad, strip, badgeR, textX, right, pf, tf, af, tH, hh};
  };
  let L = build(size);
  // the close-up never cuts its text: it shrinks (to 70 % at most) until the title and the
  // "as cited in …" line fit whole and the block fits its zone
  const cut = q => (q.tf && q.tf.truncated) || (q.af && q.af.truncated);
  if (!o.fixed) while ((L.hh > z.h || cut(L)) && size > o.size * 0.72) { size *= 0.95; L = build(size); }
  const x = z.x, y = z.y, w = z.w;
  const bc = {x: x + L.strip + L.pad + L.badgeR, y: y + L.pad + Math.min(L.tH, size * 1.2) / 2 + 2};
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 8, w, L.hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, L.hh, 10), fill: '#fcf7e9', stroke: th.ink, 'stroke-width': 2.4}),
    h('line', {x1: x + L.strip, x2: x + L.strip, y1: y + 4, y2: y + L.hh - 4, stroke: '#c8553d', 'stroke-width': 1.8, opacity: 0.8}),
  ];
  if (o.consulted) {
    const R = L.badgeR;
    parts.push(h('circle', {cx: bc.x, cy: bc.y, r: R, fill: BRASS.mid, stroke: BRASS.dark, 'stroke-width': 2.4}),
      h('rect', {x: bc.x - R * 0.62, y: bc.y - R * 0.3, width: R * 0.8, height: R * 0.6, rx: R * 0.3, fill: 'none', stroke: '#fff', 'stroke-width': 2.4}),
      h('rect', {x: bc.x - R * 0.18, y: bc.y - R * 0.3, width: R * 0.8, height: R * 0.6, rx: R * 0.3, fill: 'none', stroke: '#fff', 'stroke-width': 2.4}));
  } else {
    parts.push(h('circle', {cx: bc.x, cy: bc.y, r: L.badgeR, fill: '#ffffff', stroke: th.inkSoft, 'stroke-width': 2}),
      h('circle', {cx: bc.x, cy: bc.y, r: L.badgeR * 0.72, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.6, 'stroke-dasharray': '3 4'}));
  }
  const ty = y + L.pad;
  const ink = th.ink, inkSoft = th.inkSoft;
  if (o.showText) {
    parts.push(textBlock(L.tf, {x: L.textX, y: ty, fill: ink}));
    parts.push(textBlock(L.pf, {x: L.textX, y: ty + L.tf.height + size * 0.25, fill: th.accent2}));
    if (L.af) parts.push(textBlock(L.af, {x: L.textX, y: ty + L.tH + size * 0.45, fill: inkSoft, italic: true}));
  } else {
    parts.push(h('rect', {x: L.textX, y: ty + size * 0.3, width: (L.right - L.textX) * 0.7, height: size * 0.5, rx: size * 0.25, fill: ink, opacity: 0.55}));
    parts.push(h('rect', {x: L.textX, y: ty + size * 1.85, width: (L.right - L.textX) * 0.3, height: size * 0.5, rx: size * 0.25, fill: th.accent2}));
    if (o.alt) parts.push(h('rect', {x: L.textX, y: ty + L.tH + size * 0.45 + size * 0.25, width: (L.right - L.textX) * 0.8, height: size * 0.42, rx: size * 0.21, fill: inkSoft, opacity: 0.5}));
  }
  return {node: g(null, parts), box: {x, y, w, h: L.hh}, size};
}

/**
 * Scenario header (same look as frameworks/paired scenarioHeader: letter badge + label) whose
 * label may take two lines; the caption is drawn by the layout below it.
 */
function pairHeader(ctx, o) {
  const th = ctx.theme;
  const size = Math.min(54, o.h * 0.4);
  const badgeR = size * 0.78;
  return g({name: o.name},
    h('circle', {cx: o.x + badgeR, cy: o.y + o.h * 0.42, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    // with labels hidden the badge stays as a coloured marker (A = left/top, B = right/bottom)
    ctx.show('key') ? h('text', {x: o.x + badgeR, y: o.y + o.h * 0.42 + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
    o.fit ? textBlock(o.fit, {x: o.x + badgeR * 2 + 18, y: o.y + o.h * 0.42 - o.fit.size * 0.62, fill: th.fg}) : null);
}

/** Pose values of the final hold of bay A (source) or B (indirect). */
function finalValues(consults) {
  const base = {chain1: 1, rows: [1, 1, 1]};
  return consults ? {...base, toLid: 1, lidOpen: 1, lidBack: 1, toBox: 1, lift: 1, present: 1, chain2: 1} : {...base, ghost2: 1};
}

/** Status tag with a dotted leader to its target point. */
function leaderTag(ctx, text, o) {
  const tg = statusTag(ctx, text, {x: o.x, y: o.y, anchor: o.anchor ?? 'middle', size: o.size, color: o.color, maxWidth: o.maxWidth});
  const b = tg.box;
  const q = o.target;
  const from = q.y < b.y ? {x: clamp(q.x, b.x + b.h / 2, b.x + b.w - b.h / 2), y: b.y}
    : q.y > b.y + b.h ? {x: clamp(q.x, b.x + b.h / 2, b.x + b.w - b.h / 2), y: b.y + b.h}
      : {x: q.x < b.x ? b.x : b.x + b.w, y: b.cy};
  const long = Math.hypot(q.x - from.x, q.y - from.y) > 10;
  return {
    node: g({name: o.name, opacity: 0},
      long ? h('line', {x1: r(from.x), y1: r(from.y), x2: r(q.x), y2: r(q.y), stroke: o.color, 'stroke-width': 2.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null,
      long ? h('circle', {cx: r(q.x), cy: r(q.y), r: 5, fill: o.color, stroke: ctx.theme.card, 'stroke-width': 2}) : null,
      tg.node),
    box: b,
    lead: long ? {x1: from.x, y1: from.y, x2: q.x, y2: q.y} : null,
  };
}

/**
 * Status tag (same look as statusTag) whose text wraps to two balanced lines where the free spot
 * is narrow, with a dotted leader to its target point. `cut` reports a text that did not fit.
 */
function leaderTag2(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = size * 0.7, padY = size * 0.4;
  const fit = balancedFit(ctx, text, {maxWidth: o.maxWidth - padX * 2 - size * 0.9, size, minSize: size * 0.9, maxLines: 2, weight: 700});
  const w = fit.width + padX * 2 + size * 0.9;
  const hh = Math.max(size * 1.75, fit.height + padY * 2);
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const b = {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2};
  const q = o.target;
  const from = q.y < b.y ? {x: clamp(q.x, b.x + size, b.x + b.w - size), y: b.y}
    : q.y > b.y + b.h ? {x: clamp(q.x, b.x + size, b.x + b.w - size), y: b.y + b.h}
      : {x: q.x < b.x ? b.x : b.x + b.w, y: b.cy};
  const long = Math.hypot(q.x - from.x, q.y - from.y) > 10;
  return {
    node: g({name: o.name, opacity: 0},
      long ? h('line', {x1: r(from.x), y1: r(from.y), x2: r(q.x), y2: r(q.y), stroke: o.color, 'stroke-width': 2.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null,
      long ? h('circle', {cx: r(q.x), cy: r(q.y), r: 5, fill: o.color, stroke: th.card, 'stroke-width': 2}) : null,
      h('rect', {x: r(x), y: r(o.y), width: r(w), height: r(hh), rx: r(Math.min(hh / 2, size * 0.875)), fill: th.card, stroke: o.color, 'stroke-width': 2}),
      h('circle', {cx: r(x + padX + size * 0.2), cy: r(o.y + (fit.lines.length > 1 ? padY + fit.size * 0.55 : hh / 2)), r: r(size * 0.26), fill: o.color}),
      textBlock(fit, {x: r(x + padX + size * 0.75), y: r(o.y + (hh - fit.height) / 2 + fit.size * 0.02), fill: o.color, letterSpacing: 0.5})),
    box: b,
    lead: long ? {x1: from.x, y1: from.y, x2: q.x, y2: q.y} : null,
    cut: fit.truncated,
  };
}

/** Comparison guide along a polyline with rounded corners (plain relation style: no arrow, end dots). */
function laneGuide(ctx, name, pts, rad, color) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let total = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const la = Math.hypot(b.x - a.x, b.y - a.y), lc = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, la / 2, lc / 2);
    const p1 = {x: b.x + ((a.x - b.x) / (la || 1)) * rr, y: b.y + ((a.y - b.y) / (la || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (lc || 1)) * rr, y: b.y + ((c.y - b.y) / (lc || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: r(pts[0].x), cy: r(pts[0].y), r: 7, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(last.x), cy: r(last.y), r: 7, fill: color, opacity: 0}));
  const frame = (pr, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - pr))},
    [`${name}-dotA`]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: pr >= 0.985 ? 1 : 0},
  });
  return {node, frame, total, from: pts[0], to: last};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-10-contrast',
    title: 'Citation traceability — access to the original vs indirect citation',
    titleEs: 'Trazabilidad de una cita — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Trazabilidad de una cita',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical first-person library bays: the same note, the same open treatise, the same original in a closed archive box. Only one fact differs — in A the hand opens the box, lifts the original and the chain reaches its entry; in B the box stays closed and the source is recorded as cited in the treatise (dashed link, dashed card row). A close-up of each card’s third row shows the recorded difference; a neutral guide joins the two boxes; no judgement on either citation.',
    tags: ['citation', 'traceability', 'comparison', 'access to the original', 'indirect citation', 'archive box', 'chain', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/trazabilidad-de-una-cita.js', 'src/frameworks/paired.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
