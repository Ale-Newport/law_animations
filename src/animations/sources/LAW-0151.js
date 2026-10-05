/**
 * LAW-0151 — Remisión entre artículos · contrast
 *
 * Storyboard — two complete copies of the same open volume on one clock
 * (side by side on wide boxes, stacked on tall ones; brief beats):
 *  [0.00–0.17] base: both scenes are identical — the same volume, divisions,
 *              articles and the same page flag lying on Art. 4's printed
 *              cross-reference phrase. In both, the cue row of the changed
 *              article (Art. 9 by default) is an empty dashed slot. The A/B
 *              badges share one neutral colour; no scenario label yet.
 *  [0.17–0.40] change: the ONE changed fact is written in. In B the slot is
 *              inked with Art. 9's own onward phrase (as supplied); in A the
 *              slot closes into a plain line (Art. 9 prints no onward
 *              reference). Scenario labels and lane colours appear.
 *  [0.40–0.77] parallel: both flags make the same first hop at the same
 *              moment, from Art. 4's phrase round the page text to Art. 9.
 *              In A the path ends: Art. 9 is ringed. In B the flag slides to
 *              Art. 9's new phrase and hops again to Art. 12 (the supplied
 *              chain), which is ringed. Only the sequence differs.
 *  [0.77–1.00] guide: dashed frames mark the changed row in both scenes and a
 *              guide line joins them through the changed-fact label; the
 *              shared facts and the neutral note ("both paths as supplied;
 *              no conclusion drawn") complete the hold. No winner, score or
 *              legal consequence: neither path is resolved into a rule.
 * @module animations/sources/LAW-0151
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {contrastFields, int} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {deskWindow} from '../../primitives/desk.js';
import {
  sourcesFields, pathField, RA_STRINGS, cleanPath, pxScale, volumeArt, ringArt, cueOutline, cuePill,
  flagArt, flagPose, flagBox, hopRoute, trailArt, hopBadge, badgeSpot, noteCard, fitWords, overlaps, flagInk, ringColor, levelColor,
} from './kits/remision-entre-articulos.js';

const ID = 'LAW-0151';
const DURATION = 7500;

const sceneSchema = {
  ...sourcesFields,
  pathA: {...pathField, description: 'Scenario A: the supplied reference path (indices of the articles the marker visits). ' + pathField.description},
  pathB: {...pathField, description: 'Scenario B: the supplied reference path. ' + pathField.description},
  changedArticle: int('Index of the article whose own cross-reference phrase is printed in scenario B only (the one changed fact); in A its cue row stays a plain line', 0, 3),
  ...contrastFields(),
};

const defaultParams = {
  sources: [{title: 'Text 1 (fictional)'}],
  hierarchy: {levels: ['Part 1 (user-supplied)', 'Part 2 (user-supplied)']},
  passages: [
    {ref: 'Text 1 · Art. 4 (fictional)', cue: 'as set out in Art. 9', level: 0},
    {ref: 'Art. 9 (fictional)', cue: 'see Art. 12', level: 1},
    {ref: 'Art. 12 (fictional)', cue: '', level: 1},
  ],
  interpretations: [],
  pathA: [0, 1],
  pathB: [0, 1, 2],
  changedArticle: 1,
  scenarioA: {label: 'Direct reference', caption: 'Art. 9 prints no onward reference'},
  scenarioB: {label: 'Chain of references', caption: 'Art. 9 prints its own reference'},
  changedFact: 'Only Art. 9 differs: its own reference to Art. 12 is printed in B',
  sharedFacts: ['Same volume and divisions', 'Same phrase in Art. 4', 'Same marker, same start'],
  comparisonLabels: {guide: 'The one changed detail', neutral: 'Both paths as supplied; neither is preferred'},
};

const C = {
  slot: [0.2, 0.32], labels: [0.28, 0.36], hops: [0.4, 0.74], ringLen: 0.05,
  guide: [0.77, 0.85], chip: [0.8, 0.86], neutral: [0.84, 0.9],
};

const scene = {
  sizes: {landscape: [1840, 800], square: [1108, 860], portrait: [1000, 1430]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const W = ctx.design.w, H = ctx.design.h;
    const k = pxScale(ctx);
    const D = v => v / k;
    const px = {head: D(22.5), cue: D(21.5), tab: D(20), run: D(20), min: D(16.5)};
    const size = D(20.5), min = D(16.5);
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    const n = p.passages.length;
    const ch = clamp(p.changedArticle, 0, n - 1);
    const paths = {A: cleanPath(p.pathA, n), B: cleanPath(p.pathB, n)};
    const arrangement = shape === 'portrait' ? 'column' : 'row';
    const orient = shape === 'square' ? 'v' : 'h';

    // ---- shared strip (drawn once): same facts + neutral note + key note
    const buildStrip = (x0, y0, w, cap, withReading = arrangement !== 'row') => {
      const parts = [];
      const text = [];
      let y = y0;
      const facts = [p.sources[0].title, ...p.hierarchy.levels, ...(showAll ? p.sharedFacts : [])];
      const swatch = i => (i === 1 || i === 2 ? levelColor(ctx, i - 1) : null);
      if (showKey) {
        const title = `${t.sameFacts} · A = B`;
        const tf = fitWords(ctx, title, {maxWidth: w, size: Math.min(size * 0.92, cap), minSize: Math.min(min, cap), maxLines: 1, weight: 700});
        parts.push(textBlock(tf, {x: x0, y, fill: th.fg, name: 'same-title'}));
        const inlineTitle = arrangement !== 'row' || shape === 'landscape';
        let cx = inlineTitle ? x0 + tf.width + 22 : x0;
        if (!inlineTitle) y += tf.height + 14;
        let lineH = inlineTitle ? tf.height : 0;
        facts.forEach((f, i) => {
          const ff = fitWords(ctx, f, {maxWidth: w - 40, size: Math.min(size, cap), minSize: Math.min(min, cap), maxLines: 2, weight: i ? 600 : 700, family: i ? 'sans' : 'serif'});
          const sw = swatch(i);
          const lead = sw ? ff.size * 1.5 : 0;
          const bw = ff.width + 24 + lead, bh = ff.height + 10;
          if (cx + bw > x0 + w) { y += lineH + 8; cx = x0; lineH = 0; }
          parts.push(g({name: `same${i}`}, h('path', {d: roundRectPath(cx, y - 6, bw, bh, 10), fill: th.card, stroke: th.inkSoft, 'stroke-width': 1.6}),
            sw ? g(null, h('path', {d: roundRectPath(cx + 12, y + ff.height / 2 - ff.size * 0.45, ff.size * 1.1, ff.size * 0.9, 4), fill: sw, stroke: th.ink, 'stroke-width': 1.5}),
              ...Array.from({length: i}, (_, q) => h('circle', {cx: r(cx + 12 + ff.size * 0.55 + (q - (i - 1) / 2) * ff.size * 0.36), cy: r(y + ff.height / 2), r: r(ff.size * 0.12), fill: '#fff'}))) : null,
            textBlock(ff, {x: cx + 14 + lead, y: y, fill: th.ink})));
          text.push({x: cx, y: y - 6, w: bw, h: bh});
          cx += bw + 12;
          lineH = Math.max(lineH, bh - 6);
        });
        y += lineH + 16;
      }
      let neutral = null;
      if (showKey) {
        const body = showAll ? p.comparisonLabels.neutral : '';
        const nf = showAll ? fitWords(ctx, body, {maxWidth: w, size: Math.min(size, cap), minSize: Math.min(min, cap), maxLines: 3, weight: 600}) : null;
        const kf = fitWords(ctx, t.keyNote, {maxWidth: w, size: Math.min(size * 0.96, cap), minSize: Math.min(min, cap), maxLines: 2, weight: 500});
        const nodes = [];
        const inline = nf && nf.lines.length === 1 && nf.width + kf.width + 36 <= w && kf.lines.length === 1;
        if (nf) nodes.push(textBlock(nf, {x: x0, y, fill: th.fg, name: 'neutral-text'}));
        const ky = inline ? y : y + (nf ? nf.height + 8 : 0);
        nodes.push(textBlock(kf, {x: inline ? x0 + nf.width + 36 : x0, y: ky, fill: th.fgSoft, italic: true, name: 'keynote'}));
        neutral = g({name: 'neutral', opacity: 0}, nodes);
        y = ky + kf.height + 6;
      }
      // attributed reading (if supplied): shared by A and B, drawn once
      if (showAll && p.interpretations.length && withReading) {
        const ip = p.interpretations[0];
        const nc = noteCard(ctx, {name: 'probe-interp', x: x0, y: y + 6, w, size: Math.min(size * 0.96, cap), min: Math.min(min, cap), title: `${ip.by} · ${t.attributed}`, body: ip.text});
        parts.push(nc.node);
        y += nc.box.h + 12;
      }
      return {node: g({name: 'strip'}, parts), neutral, h: y - y0, text};
    };

    // ---- one scene in LOCAL coordinates (identical geometry for A and B)
    const buildScene = (X, sw, shh, hdr) => {
      const header = {h: hdr};
      const bookW = sw - (orient === 'v' ? 136 : 190); // room right of the book for the hop lane and its badge
      const book = orient === 'h' ? {x: 75, y: hdr + 6, w: bookW, h: shh - hdr - 12} : {x: 14, y: hdr + 6, w: bookW, h: shh - hdr - 12};
      const vol = volumeArt(ctx, {prefix: `${X}vol`, ...book, orient, articles: p.passages.map((a, i) => ({i, ...a})), levels: p.hierarchy.levels, title: p.sources[0].title, px, seedKey: 'ra-contrast', cueSlots: [ch], pillNodes: true, grow: 1.3, maxExtraBars: 1, noTitle: true, tabText: false, outerPad: orient === 'v' ? 70 : 78});
      return {vol, book, header};
    };

    // geometry per arrangement
    let SW, SH, pos, stripTop, stripW, stripX, guideBand, chipBox;
    let readingInStrip = arrangement !== 'row';
    const gap = 44;
    const hdr = D(20.5) * 3.15;
    let strip;
    const split = shape === 'square' ? 0.64 : 0.58;
    const chipW = arrangement === 'row' ? W * (1 - split) - 20 : Math.min(W * 0.8, 860);
    const geometry = cap => {
      const chipProbe = showKey ? noteCard(ctx, {name: 'probe', x: 0, y: 0, w: chipW, size: Math.min(size, cap * 1.02), min, title: showAll ? p.comparisonLabels.guide : undefined, body: p.changedFact}) : null;
      if (arrangement === 'row') {
        // bottom region: shared strip (left, under A) beside the guide chip (right, under B)
        SW = (W - gap - 20) / 2;
        stripX = 20; stripW = W * split - 50;
        const probe = buildStrip(stripX, 0, stripW, cap, false);
        const ipProbe = showAll && p.interpretations.length ? noteCard(ctx, {name: 'probe', x: 0, y: 0, w: chipW, size: Math.min(size * 0.96, cap), min: Math.min(min, cap), title: `${p.interpretations[0].by} · ${t.attributed}`, body: p.interpretations[0].text}) : null;
        const chipH = chipProbe ? chipProbe.box.h + 14 : 0;
        // the attributed reading goes under the guide chip or into the strip, whichever keeps the bottom lower
        const underChip = Math.max(probe.h, chipH + (ipProbe ? ipProbe.box.h + 12 : 0));
        const inStrip = ipProbe ? Math.max(buildStrip(stripX, 0, stripW, cap, true).h, chipH) : Infinity;
        readingInStrip = inStrip < underChip;
        const bottomH = Math.min(underChip, inStrip) + 14;
        SH = H - 12 - bottomH;
        pos = {A: {x: 10, y: 8}, B: {x: 10 + SW + gap, y: 8}};
        stripTop = 8 + SH + 20;
        guideBand = 0;
        chipBox = {x: W * split - 10, y: 8 + SH + 24};
      } else {
        SW = W - 20;
        stripX = 20; stripW = W - 40;
        const probe = buildStrip(stripX, 0, stripW, cap);
        guideBand = Math.max(D(20.5) * 3.2, (chipProbe ? chipProbe.box.h : 0) + 26);
        SH = (H - 20 - probe.h - 16 - guideBand) / 2;
        pos = {A: {x: 10, y: 8}, B: {x: 10, y: 8 + SH + guideBand}};
        stripTop = 8 + 2 * SH + guideBand + 10;
      }
    };
    // captions and shared facts never exceed the article text: size them from the scenes, then refit once
    geometry(Infinity);
    let sc = buildScene('A', SW, SH, hdr);
    let contentMin = sc.vol.minText;
    if (contentMin < size - 0.01) {
      const cap = contentMin;
      geometry(cap);
      sc = buildScene('A', SW, SH, hdr);
      contentMin = Math.min(cap, sc.vol.minText);
    }
    const scB = buildScene('B', SW, SH, hdr);
    strip = buildStrip(stripX, stripTop, stripW, contentMin, readingInStrip);

    const mkScene = (X, S, scn) => {
      const vol = S.vol;
      const B = vol.blocks;
      const path = paths[X];
      const spotOf = (i, which) => (which === 'cue' && B[i].cueSpot ? B[i].cueSpot : B[i].headSpot);
      const hops = [];
      for (let j = 0; j < path.length - 1; j++) {
        const S0 = spotOf(path[j], 'cue');
        const E = spotOf(path[j + 1], 'head');
        const route = hopRoute(S0, E, {lane: vol.lane, laneGap: orient === 'v' ? 58 : 44});
        // B's hops beyond A's path are the whole difference: drawn bold
        hops.push({S: S0, E, route, trail: trailArt(ctx, {name: `${X}trail${j}`, route, from: S0, to: E, bold: X === 'B' && j >= paths.A.length - 1})});
      }
      const last = B[path[path.length - 1]];
      const ring = ringArt(ctx, {name: `${X}ring`, box: last.box, color: ringColor(ctx)});
      const outlines = path.slice(0, -1).map((i, j) => (B[i].pill && (i !== ch || X === 'B') ? {j, node: cueOutline(ctx, {name: `${X}cue${j}`, pill: B[i].pill, color: flagInk(ctx)})} : null)).filter(Boolean);
      // hop badges beside their trail, clear of text, flags and the header
      const bSize = Math.min(size * 0.95, contentMin);
      const vtexts = [...vol.text, ...vol.tabs.filter(tb => tb.text).map(tb => tb.text), {x: 0, y: 0, w: SW, h: hdr}];
      const flagBoxes = path.flatMap(i => [flagBox(spotOf(i, 'head')), ...(B[i].cueSpot ? [flagBox(B[i].cueSpot)] : [])]);
      const badgeAt = hops.map(hp => badgeSpot(hp.trail, {R: bSize * 0.8 + 2, obstacles: [...vtexts, ...flagBoxes], bounds: {x: 2, y: hdr, w: SW - 4, h: SH - hdr - 2}}));
      const badges = hops.length > 1 ? hops.map((hp, j) => hopBadge(ctx, {name: `${X}badge${j}`, x: badgeAt[j].x, y: badgeAt[j].y, n: j + 1, size: bSize})) : [];
      // cue pills: every printed phrase; the changed article's row is a slot in both, filled in B only
      const pills = [];
      let slot = null;
      for (const pp of vol.pills) {
        if (pp.i === ch) {
          const b = pp.pill;
          slot = b;
          pills.push(h('path', {name: `${X}slot`, d: roundRectPath(b.x, b.y, b.w, b.h, Math.min(12, b.h / 2)), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '7 6'}));
          if (X === 'B') pills.push(cuePill(ctx, {pill: b, name: 'Bpill', opacity: 0}));
          else pills.push(h('rect', {name: 'Aline', x: b.x + 6, y: b.y + b.h / 2 - 4.5, width: Math.max(10, b.w - 12), height: 9, rx: 4.5, fill: th.paperLine, opacity: 0}));
        } else if (p.passages[pp.i].cue) pills.push(cuePill(ctx, {pill: pp.pill}));
      }
      // the changed-row box hugs the slot and never touches the heading above or the text below
      let fbox = null;
      if (slot) {
        const blk = B[ch];
        const headBottom = blk.headRow.y + blk.headRow.h + 3;
        const below = Math.min(Infinity, ...vol.text.filter(b => b.y > slot.y + slot.h - 1).map(b => b.y));
        const top = Math.max(slot.y - 10, headBottom + 2);
        const bottom = Math.min(slot.y + slot.h + 10, below - 3);
        fbox = {x: slot.x - 10, y: top, w: slot.w + 20, h: bottom - top};
      }
      const frame = slot ? h('path', {name: `${X}frame`, d: roundRectPath(fbox.x, fbox.y, fbox.w, fbox.h, 12), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '12 8', opacity: 0}) : null;
      const {flag, shadow} = flagArt(ctx, {name: `${X}flag`});
      // header: badge (neutral until the change) + label + caption
      const col = X === 'A' ? th.accent2 : th.cloth[7];
      const badgeR = hdr * 0.3;
      const hnodes = [
        h('circle', {cx: badgeR + 6, cy: hdr * 0.42, r: badgeR, fill: th.inkSoft, stroke: th.ink, 'stroke-width': 2.5}),
        h('circle', {name: `${X}badge`, cx: badgeR + 6, cy: hdr * 0.42, r: badgeR, fill: col, stroke: th.ink, 'stroke-width': 2.5, opacity: 0}),
      ];
      if (showKey) {
        hnodes.push(h('text', {x: badgeR + 6, y: hdr * 0.42 + badgeR * 0.42, 'text-anchor': 'middle', 'font-size': r(badgeR * 1.15), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, X));
        const lf = fitWords(ctx, scn.label, {maxWidth: SW - badgeR * 2 - 40, size: size * 1.05, minSize: min, maxLines: 1, weight: 700});
        const lbl = [textBlock(lf, {x: badgeR * 2 + 20, y: showAll && scn.caption ? 2 : hdr * 0.42 - lf.height / 2, fill: th.fg})];
        if (showAll && scn.caption) {
          const cf = fitWords(ctx, scn.caption, {maxWidth: SW - badgeR * 2 - 40, size: Math.min(size * 0.92, contentMin), minSize: Math.min(min, contentMin), maxLines: 1, weight: 500});
          lbl.push(textBlock(cf, {x: badgeR * 2 + 20, y: 2 + lf.height + lf.size * 0.32 + 4, fill: th.fgSoft}));
        }
        hnodes.push(g({name: `${X}label`, opacity: 0}, lbl));
      }
      const desk = deskWindow(ctx, {prefix: `${X}desk`, x: 0, y: hdr - 4, w: SW, h: SH - hdr + 4, radius: 22, seedKey: 'ra-desk'});
      const texts = [...vol.text, ...vol.tabs.filter(tb => tb.text).map(tb => tb.text)];
      const endSpot = hops.length ? hops[hops.length - 1].E : spotOf(path[0], 'cue');
      const flagClear = !texts.some(b => overlaps(flagBox(endSpot), b, 2));
      const inside = (b, f) => b.x >= f.x - 0.5 && b.y >= f.y - 0.5 && b.x + b.w <= f.x + f.w + 0.5 && b.y + b.h <= f.y + f.h + 0.5;
      const frameClear = !fbox || !texts.some(b => overlaps(b, fbox, 0) && !inside(b, fbox));
      const trailTextHits = hops.reduce((m, hp) => m + hp.trail.poly.pts.filter(q => texts.some(b => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h)).length, 0);
      const node = g({name: `${X}scene`, transform: T(pos[X].x, pos[X].y)},
        g(null, hnodes),
        desk.surface,
        g({'clip-path': desk.clip}, vol.node, pills, outlines.map(o => o.node), ring.node, frame, hops.map(hp => hp.trail.node), badges, shadow, flag),
        desk.frame);
      return {X, frameClear, badgeAt, fbox, node, vol, path, hops, ring, outlines, badges, slot, spotOf, origin: spotOf(path[0], 'cue'), flagClear, trailTextHits, desk};
    };
    const A = mkScene('A', sc, p.scenarioA);
    const Bs = mkScene('B', scB, p.scenarioB);

    // ---- guide: joins the two framed rows through the changed-fact label
    const world = (X, q) => ({x: pos[X].x + q.x, y: pos[X].y + q.y});
    const fr = X => (X === 'A' ? A : Bs).fbox;
    let guide = null, guideChip = null;
    const fa = fr('A'), fb = fr('B');
    if (fa && fb) {
      const a1 = world('A', {x: fa.x + fa.w, y: fa.y + fa.h / 2});
      const b1 = world('B', {x: fb.x + fb.w, y: fb.y + fb.h / 2});
      let pts, mid;
      if (arrangement === 'row') {
        const yb = pos.A.y + SH + 12;
        const xa = pos.A.x + SW - 7, xb = pos.B.x + SW - 7;
        const cx = chipBox.x + chipW * 0.3;
        pts = [a1, {x: xa, y: a1.y}, {x: xa, y: yb}, {x: cx, y: yb}, {x: cx, y: chipBox.y}, {x: cx, y: yb}, {x: xb, y: yb}, {x: xb, y: b1.y}, b1];
        mid = null;
      } else {
        const xg = pos.A.x + SW - 7;
        pts = [a1, {x: xg, y: a1.y}, {x: xg, y: b1.y}, b1];
        mid = {x: xg, y: pos.A.y + SH + guideBand / 2};
      }
      const poly = polyline(pts);
      const d = poly.d(1);
      const total = poly.total;
      guide = {pts, total, node: g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-line', d, fill: 'none', stroke: th.accent, 'stroke-width': 3.5, 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total), 'stroke-linejoin': 'round'}))};
      if (showKey) {
        const cw = chipW;
        const title = showAll ? p.comparisonLabels.guide : '';
        const nc = noteCard(ctx, {name: 'gchip', x: 0, y: 0, w: cw, size: Math.min(size, contentMin * 1.02), min, title: title || undefined, body: p.changedFact, accent: th.accent, opacity: 0});
        const gx = arrangement === 'row' ? chipBox.x : mid.x - nc.box.w;
        const gy = arrangement === 'row' ? chipBox.y : mid.y - nc.box.h / 2;
        guideChip = noteCard(ctx, {name: 'gchip', x: gx, y: gy, w: cw, size: Math.min(size, contentMin * 1.02), min, title: title || undefined, body: p.changedFact, accent: th.accent, opacity: 0});
      }
    }
    // A/B look before the change beat (compared by the identical-before-change test)
    let interpRow = null;
    if (arrangement === 'row' && !readingInStrip && showAll && p.interpretations.length) {
      const ip = p.interpretations[0];
      const y0 = guideChip ? guideChip.box.y + guideChip.box.h + 12 : chipBox.y;
      interpRow = noteCard(ctx, {name: 'interp', x: chipBox.x, y: y0, w: chipW, size: Math.min(size * 0.96, contentMin), min: Math.min(min, contentMin), title: `${ip.by} · ${t.attributed}`, body: ip.text, opacity: 0});
    }
    return {interpRow, W, H, A, B: Bs, pos, SW, SH, arrangement, orient, strip, guide, guideChip, ch, paths};
  },
  build(ctx, L) {
    return g(null, L.A.node, L.B.node, L.guide && L.guide.node, L.guideChip && L.guideChip.node, L.interpRow && L.interpRow.node, L.strip.node, L.strip.neutral);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const maxHops = Math.max(L.A.hops.length, L.B.hops.length);
    const span = (C.hops[1] - C.hops[0]) / maxHops;
    const look = {};
    for (const S of [L.A, L.B]) {
      const X = S.X;
      let pos = {x: S.origin.x, y: S.origin.y};
      let sx = S.origin.side === 'right' ? 1 : -1;
      let lift = 0;
      let at = S.path[0];
      let done = 0;
      const tp = S.hops.map(() => 0);
      S.hops.forEach((hp, j) => {
        const a0 = C.hops[0] + j * span;
        const readEnd = a0 + (j ? 0.26 * span : 0);
        if (u < a0) return;
        if (j) {
          const from = S.spotOf(S.path[j], 'head');
          const q = ease.inOutCubic(seg(u, a0 + 0.08 * span, readEnd));
          pos = {x: lerp(from.x, hp.S.x, q), y: lerp(from.y, hp.S.y, q)};
        }
        if (u < readEnd) return;
        const fly = [readEnd + 0.1 * span, a0 + 0.9 * span];
        const f = ease.inOutCubic(seg(u, ...fly));
        const pt = hp.route.at(f);
        pos = {x: pt.x, y: pt.y};
        lift = seg(u, readEnd, readEnd + 0.1 * span) * (1 - seg(u, a0 + 0.9 * span, a0 + span)) * (1 + 0.35 * Math.sin(Math.PI * f));
        const sA = hp.S.side === 'right' ? 1 : -1, sB = hp.E.side === 'right' ? 1 : -1;
        sx = sA === sB ? sA : lerp(sA, sB, ease.inOutSine(seg(f, 0.3, 0.7)));
        if (Math.abs(sx) < 0.04) sx = 0.04 * Math.sign(sB);
        tp[j] = clamp((f - hp.trail.t0) / (hp.trail.t1 - hp.trail.t0));
        at = u >= a0 + span ? S.path[j + 1] : null;
        if (u >= a0 + span) done = j + 1;
      });
      Object.assign(nodes, flagPose(`${X}flag`, {x: pos.x, y: pos.y, sx, lift: clamp(lift, 0, 1.4)}));
      S.hops.forEach((hp, j) => Object.assign(nodes, hp.trail.frame(tp[j])));
      S.badges.forEach((b, j) => { nodes[`${X}badge${j}`] = {opacity: r(seg(u, C.hops[0] + (j + 0.9) * span, C.hops[0] + (j + 1) * span + 0.02), 3)}; });
      S.outlines.forEach(o => {
        const a0 = C.hops[0] + o.j * span;
        nodes[`${X}cue${o.j}`] = {opacity: r(o.j ? seg(u, a0, a0 + 0.14 * span) : seg(u, C.hops[0] - 0.05, C.hops[0]), 3)};
      });
      const endU = C.hops[0] + S.hops.length * span;
      const ringP = done === S.hops.length ? seg(u, endU, endU + C.ringLen) : 0;
      Object.assign(nodes, S.ring.frame(ringP));
      // the changed row: slot → B inked / A closed
      const sp = seg(u, ...C.slot);
      if (S.slot) {
        nodes[`${X}slot`] = {opacity: r(1 - sp, 3)};
        if (X === 'B') nodes.Bpill = {opacity: r(ease.inOutSine(sp), 3)};
        else nodes.Aline = {opacity: r(sp, 3)};
        nodes[`${X}frame`] = {opacity: r(seg(u, ...C.guide), 3)};
      }
      const lp = seg(u, ...C.labels);
      nodes[`${X}badge`] = {opacity: r(lp, 3)};
      if (ctx.show('key')) nodes[`${X}label`] = {opacity: r(lp, 3)};
      look[X] = {
        flag: {x: r(pos.x, 1), y: r(pos.y, 1), sx: r(sx, 2), lift: r(lift, 2)}, at, done, trails: tp.map(v => r(v, 3)),
        ring: r(ringP, 3), changed: r(sp, 3), label: r(lp, 3), cueRead: S.outlines.map(o => nodes[`${X}cue${o.j}`].opacity),
      };
    }
    let guideP = 0;
    if (L.guide) {
      guideP = seg(u, ...C.guide);
      nodes.guide = {opacity: guideP > 0 ? 1 : 0};
      nodes['guide-line'] = {'stroke-dashoffset': r(L.guide.total * (1 - guideP))};
    }
    if (L.guideChip) nodes.gchip = {opacity: r(seg(u, ...C.chip), 3)};
    if (L.strip.neutral) nodes.neutral = {opacity: r(seg(u, ...C.neutral), 3)};
    if (L.interpRow) nodes.interp = {opacity: r(seg(u, ...C.neutral), 3)};
    const beat = u < 0.17 ? 'base' : u < 0.4 ? 'change' : u < 0.77 ? 'parallel' : 'guide';
    // the part of each look that can differ must be identical before the change beat
    const cmp = X => ({...look[X], cueRead: look[X].cueRead.slice(0, 1), trails: look[X].trails.slice(0, 1)});
    return {
      nodes,
      semantic: {
        beat,
        arrangement: L.arrangement,
        a: look.A,
        b: look.B,
        lookA: u < 0.4 ? cmp('A') : look.A,
        lookB: u < 0.4 ? cmp('B') : look.B,
        pathA: L.paths.A,
        pathB: L.paths.B,
        changedArticle: L.ch,
        guide: r(guideP, 3),
        neutralShown: L.strip.neutral ? r(seg(u, ...C.neutral), 3) : 0,
        scenes: 2,
        flagClear: L.A.flagClear && L.B.flagClear,
        trailTextHits: L.A.trailTextHits + L.B.trailTextHits,
        frameClear: L.A.frameClear && L.B.frameClear,
        trailLengthsB: L.B.hops.map(hp => r(hp.trail.total, 1)),
        badgesClear: [...L.A.badgeAt, ...L.B.badgeAt].every(b => b.clear),
        volumeOverflow: L.A.vol.overflow || L.B.vol.overflow,
        volumeFit: {fill: r(L.A.vol.fill, 3), compact: L.A.vol.compact, head: r(L.A.vol.px.head, 1)},
        stageW: r(L.SW / L.W, 3),
        sameGeometry: JSON.stringify(Object.values(L.A.vol.blocks).map(b => b.box)) === JSON.stringify(Object.values(L.B.vol.blocks).map(b => b.box)),
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-08-contrast',
    title: 'Cross-reference between articles — direct reference vs chain of references',
    titleEs: 'Remisión entre artículos — Comparación de dos supuestos',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Remisión entre artículos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical open volumes on one clock. The one changed fact is written in: in B, Art. 9 prints its own onward cross-reference; in A its row stays plain. Both page flags make the same first hop from Art. 4 to Art. 9; in B the flag hops again to Art. 12. A guide joins the changed rows; both paths are shown as supplied, with no winner and no conclusion.',
    tags: ['cross-reference', 'remisión', 'direct reference', 'chain of references', 'article', 'book', 'page flag', 'comparison', 'editable hierarchy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/remision-entre-articulos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RA_STRINGS,
  scene,
});
