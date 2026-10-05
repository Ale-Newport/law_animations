/**
 * LAW-0150 — Remisión entre artículos · mechanism
 *
 * Storyboard — an exploded view of the bound volume (brief beats):
 *  [0.00–0.18] separate: the volume lies closed at the side, its index tabs
 *              marking the user-supplied divisions. Each division opens as a
 *              band (a shelf) across the stage, and the articles slide out of
 *              the volume as loose leaves onto the band of their division:
 *              the referring provision, the intermediate article (chains
 *              only) and the referenced text.
 *  [0.18–0.43] relate: only the SUPPLIED relationships are drawn, one after
 *              another, anchored to the real edges of the leaves — "printed
 *              in" (a plain relation: no arrowhead) from the volume to a leaf
 *              and "refers to" (a sequence link: thin arrow, never the causal
 *              style unless supplied) from a leaf's printed phrase to the next.
 *  [0.43–0.75] trace: the page flag (the marker) docks on the first leaf,
 *              then travels along the relations in the supplied traversal
 *              order, docking at each leaf; the focus leaf swells while the
 *              flag is on it. A numbered badge stays at each dock.
 *  [0.75–1.00] gather: every leaf, relation, dock badge and the flag on the
 *              last leaf stay visible, with the key "path as supplied · no
 *              conclusion drawn". Nothing states what any article says.
 * @module animations/sources/LAW-0150
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {textBlock, chip} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {
  sourcesFields, RA_STRINGS, pxScale, fitWords, flagArt, flagPose, FLAG, hopBadge, noteCard, overlaps, levelColor, flagInk, articleBlock, cuePill,
} from './kits/remision-entre-articulos.js';

const ID = 'LAW-0150';
const DURATION = 7000;
const IDS = ['volume', 'provision', 'relay', 'referenced'];
// the tracking marker is a small page flag (half size), so it can ride the connectors without covering labels
const TS = 0.5;
const COVER = '#2f4a6b';

const sceneSchema = {
  ...sourcesFields,
  passages: {...sourcesFields.passages, maxItems: 3, description: 'The articles pulled out of the volume, in path order: [0] the referring provision, [1] the intermediate article (chains only), last the referenced text. Each prints its cross-reference phrase exactly as supplied; nothing is read or resolved'},
  ...mechanismFields(IDS),
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
  elements: [
    {id: 'volume', label: 'Bound volume'},
    {id: 'provision', label: 'Referring provision'},
    {id: 'relay', label: 'Intermediate article'},
    {id: 'referenced', label: 'Referenced text'},
  ],
  relationships: [
    {from: 'volume', to: 'provision', kind: 'relation'},
    {from: 'provision', to: 'relay', kind: 'sequence'},
    {from: 'relay', to: 'referenced', kind: 'sequence'},
  ],
  focusElement: 'relay',
  relationLabels: {relation: 'printed in', communication: 'communication', sequence: 'refers to', causal: 'causal (as supplied)'},
  traversalOrder: ['provision', 'relay', 'referenced'],
};

const M = {out: [0.02, 0.16], bands: [0.0, 0.08], rel: [0.18, 0.42], trace: [0.45, 0.74], key: [0.76, 0.84], interp: [0.8, 0.86]};

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
    const size = D(20.5), min = D(16.5);
    const big = shape === 'landscape' ? 1.2 : 1;
    const px = {head: D(23) * big, cue: D(22) * big, tab: D(20.5), run: D(20.5), min};
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    // passage → element id (path order)
    const n = p.passages.length;
    const roleOf = i => (i === 0 ? 'provision' : i === n - 1 ? 'referenced' : 'relay');
    const leafIds = p.passages.map((a, i) => roleOf(i));
    const present = new Set(['volume', ...leafIds]);
    const labelOf = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
    const rels = p.relationships.filter(q => present.has(q.from) && present.has(q.to) && q.from !== q.to);
    const order = p.traversalOrder.filter(id => present.has(id) && id !== 'volume').filter((id, i, a) => a[i - 1] !== id);

    // ---- bottom strip: key note (+ attributed reading) — sized first
    const interpProbe = showAll && p.interpretations.length ? noteCard(ctx, {name: 'probe', x: 0, y: 0, w: Math.min(W - 60, 1100), size: size * 0.98, min, title: `${p.interpretations[0].by} · ${t.attributed}`, body: p.interpretations[0].text}) : null;
    const stripH0 = size * 2.2 + (interpProbe ? interpProbe.box.h + 10 : 0);
    // ---- geometry per shape
    const wide = shape !== 'portrait';
    const volW = shape === 'landscape' ? 230 : 216;
    // element label of the volume, above it
    const volCapProbe = showKey ? chip(ctx, labelOf('volume'), {x: 0, y: 0, maxWidth: wide ? volW + 20 : W - 60, size: size * 0.98, minSize: min, maxLines: 3, weight: 700}) : null;
    const volTop = 16 + (volCapProbe ? volCapProbe.box.h + 12 : 0);
    const vol = wide ? {x: 24, y: volTop, w: volW, h: H - volTop - stripH0 - 30} : {x: 30, y: volTop, w: W - 60, h: 150};
    const area = wide ? {x: vol.x + vol.w + 40, y: 16, w: W - (vol.x + vol.w + 40) - 16, h: H - 16 - stripH0 - 20} : {x: 20, y: vol.y + vol.h + 40, w: W - 40, h: H - (vol.y + vol.h + 40) - stripH0 - 20};
    const levels = [0, 1];
    // square stages: the two divisions stand side by side as columns (leaves stacked in each), which leaves
    // room beside every connector for its label; wide stages use rows, tall stages stacked rows
    const columns = shape === 'square';
    const bandGap = columns ? 150 : 26;
    const bands = levels.map(lv => (columns
      ? {x: area.x + lv * (area.w + bandGap) / 2, y: area.y, w: (area.w - bandGap) / 2, h: area.h}
      : {x: area.x, y: area.y + lv * (area.h + bandGap) / 2, w: area.w, h: (area.h - bandGap) / 2}));
    const volCap = showKey ? chip(ctx, labelOf('volume'), {x: vol.x, y: 16, maxWidth: wide ? volW + 20 : W - 60, size: size * 0.98, minSize: min, maxLines: 3, fill: th.card, stroke: th.inkSoft, weight: 700, name: 'cap-volume'}) : null;
    // band header chips (hierarchy level labels)
    const bandHeads = bands.map((b, lv) => {
      if (!showKey) return {node: null, box: {x: b.x + b.w - 14, y: b.y + 10, w: 0, h: 20}};
      // wide stages: the division label sits at the band's top-right, clear of connectors entering the leaves
      const hw = columns ? b.w - 28 : wide ? b.w * 0.62 : b.w * 0.5;
      const probe = chip(ctx, p.hierarchy.levels[lv], {x: 0, y: 0, maxWidth: hw, size, minSize: min, maxLines: 2, weight: 700});
      const cx0 = b.x + b.w - 14 - probe.box.w;
      return chip(ctx, p.hierarchy.levels[lv], {x: cx0, y: b.y + 12, maxWidth: hw, size, minSize: min, maxLines: 2, fill: levelColor(ctx, lv), stroke: th.ink, color: '#ffffff', weight: 700});
    });
    // leaves per band — fitted: decorative bars are dropped first, then text shrinks in bounded steps
    const dockRoom = FLAG.L + 36;
    const gapV = size * (columns ? 5.6 : !wide ? 6.4 : 3.6); // room for a relation label (beside its line, clear of its ends) and the marker between stacked leaves
    const layoutLeaves = (kf, compact) => {
      const out = {};
      let fitsAll = true;
      const pxk = {...px, head: Math.max(min, px.head * kf), cue: Math.max(min, px.cue * kf)};
      levels.forEach(lv => {
        const idx = p.passages.map((a, i) => i).filter(i => p.passages[i].level === lv);
        const b = bands[lv];
        const top = bandHeads[lv].box.y + bandHeads[lv].box.h + 14;
        const m = idx.length;
        if (!m) return;
        const horizontal = wide && !columns;
        const gapH = 210; // room between side-by-side leaves for the "refers to" label beside its connector
        const LW = horizontal ? Math.min(620, (b.w - 48 - (m - 1) * gapH) / m) : columns ? b.w - 48 : b.w - dockRoom - 60;
        let yCursor = top;
        idx.forEach((i, j) => {
          const id = roleOf(i);
          const a = p.passages[i];
          const lx = horizontal ? b.x + 24 + (m > 1 ? j * (b.w - 48 - LW) / (m - 1) : 0) : b.x + 24;
          // the element label is a tag printed INSIDE the leaf, so connectors reaching the leaf's edge never cross it
          const capProbe = showKey ? chip(ctx, labelOf(id), {x: lx, y: 0, maxWidth: LW - 36, size: Math.min(size * 0.98, pxk.head), minSize: min, maxLines: 2, weight: 700}) : null;
          const capH = capProbe ? capProbe.box.h + 6 : 0;
          const ly0 = horizontal ? top : yCursor;
          const blk = articleBlock(ctx, {prefix: `leaf-${id}`, i, ref: a.ref, cue: a.cue, x: 22, y: 20 + capH, w: LW - 44, px: pxk, side: 'right', seedKey: 'ra-mech', showText: showKey, compact});
          const LH = blk.h + 40 + capH;
          const box = {x: lx, y: ly0, w: LW, h: LH};
          const cap = capProbe ? chip(ctx, labelOf(id), {x: lx + 14, y: ly0 + 12, maxWidth: LW - 36, size: Math.min(size * 0.98, pxk.head), minSize: min, maxLines: 2, fill: shade(th.paperShade, 0.2), stroke: th.inkSoft, weight: 700, name: `cap-${id}`}) : null;
          const fits = box.y + box.h <= b.y + b.h - 8;
          if (!fits) fitsAll = false;
          out[id] = {id, i, box, blk, cap, level: lv, fits};
          yCursor = box.y + box.h + gapV;
        });
      });
      return {leaves: out, fitsAll, pxk};
    };
    let LL = null;
    outer: for (const kf of [1, 0.93, 0.86, 0.8, 0.75, 0.7]) {
      for (const compact of [0, 1, 2]) {
        LL = layoutLeaves(kf, compact);
        if (LL.fitsAll) break outer;
      }
    }
    const leaves = LL.leaves;
    // column stages: spread the leaves down their column (space-around) instead of packing them at the top
    if (columns) {
      levels.forEach(lv => {
        const ids = Object.keys(leaves).filter(id => leaves[id].level === lv);
        if (!ids.length) return;
        const b = bands[lv];
        const lastB = Math.max(...ids.map(id => leaves[id].box.y + leaves[id].box.h));
        const free = Math.max(0, b.y + b.h - 12 - lastB);
        ids.forEach((id, j) => {
          const dy = Math.min(free * (j + 1) / (ids.length + 1), free);
          if (dy < 1) return;
          const l = leaves[id];
          l.box = {...l.box, y: l.box.y + dy};
          if (l.cap) l.cap = chip(ctx, labelOf(id), {x: l.cap.box.x, y: l.cap.box.y + dy, maxWidth: l.box.w - 36, size: l.cap.fit.size, minSize: l.cap.fit.size, maxLines: 2, fill: shade(th.paperShade, 0.2), stroke: th.inkSoft, weight: 700, name: `cap-${id}`});
        });
      });
    }
    const contentMin0 = Math.min(...Object.values(leaves).map(l => Math.min(l.blk.minText, l.cap ? l.cap.fit.size : Infinity)), ...bandHeads.filter(c => c.fit).map(c => c.fit.size));
    const contentMin = Number.isFinite(contentMin0) ? contentMin0 : size;
    // volume element box
    // the graph sees only the volume's fore-edge strip, so a relation label may rest on the cover art
    // (never on the title plate, which is an obstacle)
    const volStrip = wide ? {x: vol.x + vol.w - 28, y: vol.y, w: 28, h: vol.h} : {x: vol.x, y: vol.y + vol.h - 28, w: vol.w, h: 28};
    const elements = {volume: {box: volStrip}};
    for (const id of Object.keys(leaves)) elements[id] = {box: leaves[id].box};
    const stripBox = {x: 0, y: H - stripH0 - 12, w: W, h: stripH0 + 12};
    // title plate on the cover (the volume's title, wrapped; never broken mid-word)
    const tw = wide ? vol.w - 36 : Math.min(vol.w - 60, 560);
    let plate = null;
    let plateBox = {x: vol.x, y: vol.y, w: 0, h: 0};
    if (showKey) {
      const f = fitWords(ctx, p.sources[0].title, {maxWidth: tw - 24, size: D(21), minSize: min, maxLines: 9, weight: 700, family: 'serif'});
      const pw = f.width + 24, ph = f.height + 20;
      const px0 = vol.x + (wide ? Math.max(6, (vol.w - 24 - pw) / 2) : (vol.w - pw) / 2);
      const py0 = wide ? vol.y + 40 : vol.y + (vol.h - 24 - ph) / 2;
      plate = {f, x: px0, y: py0, w: pw, h: ph};
      plateBox = {x: px0, y: py0, w: pw, h: ph};
    }
    const badgeBoxes = Object.values(leaves).map(l => ({x: l.box.x + l.box.w - 22, y: l.box.y - 22, w: 44, h: 44}));
    const obstacles = [...Object.values(leaves).map(l => l.cap && l.cap.box).filter(Boolean), ...bandHeads.map(c => c.box), ...(volCap ? [volCap.box] : []), stripBox, ...badgeBoxes, plateBox];
    // connectors come from the shared graph; their labels are placed here (the graph's own chips stay hidden):
    // each label sits BESIDE its line — a marker's half-width plus a margin away — clear of every connector end
    // (arrowheads stay visible on their cards), of the leaves, captions, band labels and of each other, and is
    // tied to its line by a short dotted leader. Width and line count adapt before anything shrinks.
    const graph = relationGraph(ctx, {name: 'rel', elements, relationships: rels, relationLabels: p.relationLabels, obstacles, bounds: {x: 0, y: 0, w: W, h: H}, separateLabels: true, chipSize: Math.min(size, contentMin), chipMax: D(300), bend: (rel) => (rel.kind === 'relation' ? 0.06 : 0.14)});
    const ER = 24; // arrowheads and end dots stay uncovered (the line itself is kept clear by lineBoxes)
    const endBoxes = graph.conns.flatMap(x => [x.c.from, x.c.to].map(q => ({x: q.x - ER, y: q.y - ER, w: 2 * ER, h: 2 * ER})));
    const LB = (FLAG.H * TS) / 2 + 12;
    const lineBoxes = graph.conns.flatMap(x => Array.from({length: 21}, (_, q) => { const pt = x.c.at(q / 20); return {x: pt.x - LB, y: pt.y - LB, w: 2 * LB, h: 2 * LB}; }));
    const coverLabels = [];
    const lsize = Math.min(size, contentMin);
    const placedL = [];
    const baseObs = [...Object.values(leaves).map(l => l.box), ...bandHeads.map(c => c.box), ...(volCap ? [volCap.box] : []), stripBox, ...badgeBoxes, plateBox];
    if (showAll) {
      graph.conns.forEach((x, i) => {
        const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
        const fromVol = x.rel.from === 'volume' || x.rel.to === 'volume';
        if (wide && fromVol) {
          // wide stages: a relation leaving the volume is labelled on the cover, beside where it leaves
          const an = x.rel.from === 'volume' ? x.c.from : x.c.to;
          const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: vol.w - 30, size: lsize, minSize: Math.min(min, lsize), maxLines: 3, weight: 600});
          const cy = Math.max(an.y - probe.box.h / 2, plateBox.y + plateBox.h + 10);
          const c = chip(ctx, text, {x: vol.x + vol.w - 36, y: cy, anchor: 'end', maxWidth: vol.w - 30, size: lsize, minSize: Math.min(min, lsize), maxLines: 3, fill: ctx.theme.card, stroke: ctx.theme.fgSoft, weight: 600, name: `vlab${i}`});
          coverLabels.push({i, node: c.node, box: c.box, lead: {x1: c.box.x + c.box.w, y1: c.box.y + c.box.h / 2, x2: an.x, y2: an.y}});
          placedL.push(c.box);
          return;
        }
        const obs = [...baseObs, ...endBoxes, ...lineBoxes, ...placedL, ...(wide ? [] : [vol])];
        const clear = bx => bx.x >= 4 && bx.y >= 4 && bx.x + bx.w <= W - 4 && bx.y + bx.h <= H - 4 && !obs.some(o => overlaps(bx, o, 3));
        let found = null;
        // nearest clear spot first (distance outermost), then the widest chip that fits there
        // widths that would leave a stranded one- or two-letter line ("refers / to") are not used
        const stranded = f => f.lines.slice(1).some(l => l.trim().length <= 2 && !/^\d+$/.test(l.trim()));
        const probes = [D(300), D(230), D(180), D(140), D(115), D(95)].map(mw => {
          const c0 = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: lsize, minSize: Math.min(min, lsize), maxLines: 3, weight: 600});
          return {mw, box: c0.box, ok: !stranded(c0.fit)};
        }).filter((pb, k, all) => pb.ok || k === 0 && !all.some(q => q.ok));
        search: for (let d = 8; d <= 300; d += 8) {
          for (const t of [0.5, 0.4, 0.6, 0.3, 0.7]) {
            const P = x.c.at(t);
            const nx = -Math.sin(P.a), ny = Math.cos(P.a);
            for (const pb of probes) {
              const bw = pb.box.w, bh = pb.box.h;
              for (const sg of [1, -1]) {
                const off = d + Math.abs(nx) * bw / 2 + Math.abs(ny) * bh / 2;
                const cx = P.x + nx * sg * off, cy = P.y + ny * sg * off;
                const bx = {x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh};
                if (clear(bx)) { found = {bx, mw: pb.mw, P}; break search; }
              }
            }
          }
        }
        if (!found) {
          const P = x.c.at(0.5);
          const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: D(180), size: lsize, minSize: Math.min(min, lsize), maxLines: 3, weight: 600});
          found = {bx: {x: P.x + 30, y: P.y - probe.box.h / 2, w: probe.box.w, h: probe.box.h}, mw: D(180), P, forced: true};
        }
        const c = chip(ctx, text, {x: found.bx.x + found.bx.w / 2, y: found.bx.y, anchor: 'middle', maxWidth: found.mw, size: lsize, minSize: Math.min(min, lsize), maxLines: 3, fill: ctx.theme.card, stroke: kindColor(ctx, x.rel.kind), weight: 600, name: `vlab${i}`});
        const bxc = c.box;
        const ex = Math.max(bxc.x, Math.min(found.P.x, bxc.x + bxc.w)), ey = Math.max(bxc.y, Math.min(found.P.y, bxc.y + bxc.h));
        coverLabels.push({i, node: c.node, box: bxc, lead: {x1: ex, y1: ey, x2: found.P.x, y2: found.P.y}, forced: !!found.forced});
        placedL.push(bxc);
      });
    }
    // the marker never passes over a relation label: its path bends round every label (inflated by half the
    // flag's width), then is smoothed while staying clear
    const labBoxes = coverLabels.map(c => c.box);
    const PADL = (FLAG.H * TS) / 2 + 6;
    const inflated = labBoxes.map(b => ({x: b.x - PADL, y: b.y - PADL, w: b.w + 2 * PADL, h: b.h + 2 * PADL}));
    const insideAny = q => inflated.some(b => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h);
    const detour = pts0 => {
      if (!inflated.length || pts0.length < 3) return pts0;
      // resample densely so the bend is smooth
      const P0 = polyline(pts0);
      const n = 90;
      let pts = Array.from({length: n + 1}, (_, i) => { const q = P0.at(i / n); return {x: q.x, y: q.y}; });
      const push = (q, i) => {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)];
        const tl = Math.hypot(b.x - a.x, b.y - a.y) || 1;
        const nx = -(b.y - a.y) / tl, ny = (b.x - a.x) / tl;
        let best = null;
        for (let d = 4; d <= 260 && !best; d += 4) {
          for (const sg of [1, -1]) {
            const c = {x: q.x + nx * d * sg, y: q.y + ny * d * sg};
            if (!insideAny(c)) { best = c; break; }
          }
        }
        return best || q;
      };
      for (let it = 0; it < 3; it++) {
        pts = pts.map((q, i) => (i === 0 || i === n || !insideAny(q) ? q : push(q, i)));
        // smooth, but never back into a label
        pts = pts.map((q, i) => {
          if (i === 0 || i === n) return q;
          const m = {x: (pts[i - 1].x + 2 * q.x + pts[i + 1].x) / 4, y: (pts[i - 1].y + 2 * q.y + pts[i + 1].y) / 4};
          return insideAny(m) ? q : m;
        });
      }
      return pts;
    };
    // tracer track: the flag rides each supplied connector tip-first, and between two legs walks
    // round the outline of the leaf it reached (tip always pointing at the leaf, body outside it)
    const outlines = {};
    for (const id of Object.keys(leaves)) outlines[id] = roundedOutline(leaves[id].box, 16);
    const legs = [];
    for (let j = 1; j < order.length; j++) {
      const a = order[j - 1], b2 = order[j];
      const link = graph.conns.find(x => (x.rel.from === a && x.rel.to === b2) || (x.rel.from === b2 && x.rel.to === a));
      let pts;
      if (link) {
        const fwd = link.rel.from === a;
        pts = Array.from({length: 61}, (_, q) => { const pt = link.c.at(fwd ? q / 60 : 1 - q / 60); return {x: pt.x, y: pt.y}; });
      } else {
        const A = outlines[a].nearest(center(leaves[b2].box)), B2 = outlines[b2].nearest(center(leaves[a].box));
        pts = [A, B2];
      }
      legs.push({from: a, to: b2, poly: polyline(detour(pts)), linked: Boolean(link)});
    }
    // parking spot on the referenced leaf: a point of its free edge whose parked (small) flag stays clear of
    // every connector end (arrowheads stay visible) and line, every leaf, caption, band label, relation label
    // and the strip
    const FLp = FLAG.L * TS, FHp = FLAG.H * TS;
    const connPts = graph.conns.flatMap(x => Array.from({length: 41}, (_, q) => x.c.at(q / 40)));
    const connEnds = graph.conns.flatMap(x => [x.c.from, x.c.to]);
    const parkObstacles = [...Object.values(leaves).map(l => l.box), ...Object.values(leaves).map(l => l.cap && l.cap.box).filter(Boolean), ...bandHeads.map(c => c.box), ...labBoxes, stripBox, ...(volCap ? [volCap.box] : []), vol, ...badgeBoxes];
    const parkOf = id => {
      const bx = leaves[id].box;
      const inLeg = legs.find(lg => lg.to === id);
      const from = inLeg ? inLeg.poly.at(1) : {x: bx.x, y: bx.y};
      const fr = [0.12, 0.25, 0.38, 0.5, 0.62, 0.75, 0.88];
      const cands = [
        ...fr.map(f => ({x: bx.x + bx.w, y: bx.y + bx.h * f, nx: 1, ny: 0})), ...fr.map(f => ({x: bx.x, y: bx.y + bx.h * f, nx: -1, ny: 0})),
        ...fr.map(f => ({x: bx.x + bx.w * f, y: bx.y + bx.h, nx: 0, ny: 1})), ...fr.map(f => ({x: bx.x + bx.w * f, y: bx.y, nx: 0, ny: -1})),
      ];
      const flagRect = c => {
        const hw = FHp / 2 + 3;
        return c.nx ? {x: c.nx > 0 ? c.x + 2 : c.x - FLp - 8, y: c.y - hw, w: FLp + 6, h: hw * 2} : {x: c.x - hw, y: c.ny > 0 ? c.y + 2 : c.y - FLp - 8, w: hw * 2, h: FLp + 6};
      };
      const ok = c => {
        const f = flagRect(c);
        const grown = {x: f.x - 10, y: f.y - 10, w: f.w + 20, h: f.h + 20};
        const inBox = (q, b2) => q.x > b2.x && q.x < b2.x + b2.w && q.y > b2.y && q.y < b2.y + b2.h;
        return f.x >= 4 && f.y >= 4 && f.x + f.w <= W - 4 && f.y + f.h <= H - 4
          && !parkObstacles.filter(o => o !== bx).some(o => overlaps(f, o, 14))
          && !connEnds.some(q => inBox(q, {x: f.x - 26, y: f.y - 26, w: f.w + 52, h: f.h + 52}))
          && !connPts.some(q => inBox(q, grown));
      };
      const good = cands.filter(ok).sort((c1, c2) => Math.hypot(c1.x - from.x, c1.y - from.y) - Math.hypot(c2.x - from.x, c2.y - from.y));
      return good[0] || cands[0];
    };
    // between two legs (and after the last one) the marker moves from where it arrived to where it leaves —
    // by the first of these paths that keeps the whole flag off every relation label: a low or high hop
    // over the leaf, or a walk round its outline (either way round)
    const HLf = (FLAG.L * TS) / 2;
    const unitL = v => { const m = Math.hypot(v.x, v.y) || 1; return {x: v.x / m, y: v.y / m}; };
    const tanL = (poly, f) => { const a1 = poly.at(Math.max(0, f - 0.01)), b1 = poly.at(Math.min(1, f + 0.01)); return unitL({x: b1.x - a1.x, y: b1.y - a1.y}); };
    const bodyClear = sm => { const d = {x: Math.cos(sm.a), y: Math.sin(sm.a)}; return [0, 0.5, 1, 1.5, 2].every(kk => !insideAny({x: sm.x - d.x * HLf * kk, y: sm.y - d.y * HLf * kk})); };
    const arounds = legs.map((lg, j) => {
      const O = outlines[lg.to];
      const arrival = lg.poly.at(1);
      const d0 = tanL(lg.poly, 0.99);
      const a0 = Math.atan2(d0.y, d0.x);
      let exitTip, exitDir;
      if (j === legs.length - 1) {
        const pk = parkOf(lg.to);
        const q0 = O.at(O.proj(pk));
        exitTip = {x: q0.x + q0.nx * 6, y: q0.y + q0.ny * 6};
        exitDir = {x: -q0.nx, y: -q0.ny};
      } else {
        const t2 = tanL(legs[j + 1].poly, 0.02);
        exitTip = legs[j + 1].poly.at(0);
        exitDir = {x: -t2.x, y: -t2.y};
      }
      let a1 = Math.atan2(exitDir.y, exitDir.x);
      while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI;
      while (a1 - a0 < -Math.PI) a1 += 2 * Math.PI;
      const N = 40;
      const len = Math.hypot(exitTip.x - arrival.x, exitTip.y - arrival.y) || 1;
      const nrm = {x: -(exitTip.y - arrival.y) / len, y: (exitTip.x - arrival.x) / len};
      const cands = [];
      for (const kf of [0.35, 0.7]) for (const sg of [-1, 1]) {
        const k = Math.min(kf > 0.5 ? 170 : 90, len * kf);
        cands.push(Array.from({length: N + 1}, (_, i) => { const w = i / N; const b = Math.sin(Math.PI * w) * k * sg; return {x: lerp(arrival.x, exitTip.x, w) + nrm.x * b, y: lerp(arrival.y, exitTip.y, w) + nrm.y * b, a: a0 + (a1 - a0) * w, hop: true}; }));
      }
      const sA = O.proj(arrival), sB = O.proj(exitTip);
      for (const way of [1, -1]) {
        let dS = sB - sA;
        if (way > 0 && dS < 0) dS += O.total;
        if (way < 0 && dS > 0) dS -= O.total;
        cands.push(Array.from({length: N + 1}, (_, i) => {
          const w = i / N;
          const q = O.at(sA + dS * w);
          const ain = Math.atan2(-q.ny, -q.nx);
          let aa = ain;
          if (w < 0.15) { let da = ain - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; aa = a0 + da * (w / 0.15); }
          return {x: q.x + q.nx * 6, y: q.y + q.ny * 6, a: aa, hop: false};
        }));
      }
      // or slide ALONG the outline (the flag lying on the leaf's edge, tip first), turning at both ends
      const wrapA = (a, ref) => { let x = a; while (x - ref > Math.PI) x -= 2 * Math.PI; while (x - ref < -Math.PI) x += 2 * Math.PI; return x; };
      for (const way of [1, -1]) {
        let dS = sB - sA;
        if (way > 0 && dS < 0) dS += O.total;
        if (way < 0 && dS > 0) dS -= O.total;
        const pts = Array.from({length: N + 1}, (_, i) => { const q = O.at(sA + dS * (i / N)); return {x: q.x + q.nx * 8, y: q.y + q.ny * 8}; });
        cands.push(pts.map((q, i) => {
          const w = i / N;
          const b1 = pts[Math.min(N, i + 1)], a1p = pts[Math.max(0, i - 1)];
          let at = Math.atan2(b1.y - a1p.y, b1.x - a1p.x);
          if (w < 0.12) at = lerp(a0, wrapA(at, a0), w / 0.12);
          else if (w > 0.88) at = lerp(at, wrapA(a1, at), (w - 0.88) / 0.12);
          return {x: q.x, y: q.y, a: at, hop: false};
        }));
      }
      const plen = c => c.reduce((m, q, i) => (i ? m + Math.hypot(q.x - c[i - 1].x, q.y - c[i - 1].y) : 0), 0);
      const byLen = cands.slice().sort((c1, c2) => plen(c1) - plen(c2));
      const pick = byLen.find(c => c.every(bodyClear)) || byLen[0];
      return {samples: pick, clear: pick.every(bodyClear), exitTip};
    });
    const {flag, shadow} = flagArt(ctx, {name: 'tracer'});
    const badges = order.map((id, j) => {
      const bx = leaves[id].box;
      return hopBadge(ctx, {name: `dock${j}`, x: bx.x + bx.w, y: bx.y, n: j + 1, size: size * 0.9});
    });

    // strip: key note + attributed reading
    const stripY = H - stripH0 - 6;
    let key = null, interp = null;
    if (showKey) {
      const kf = fitWords(ctx, t.keyNote, {maxWidth: W - 60, size: Math.min(size * 0.98, contentMin), minSize: Math.min(min, contentMin), maxLines: 2, weight: 500});
      key = g({name: 'key', opacity: 0}, textBlock(kf, {x: 30, y: stripY + size * 0.3, fill: th.fgSoft, italic: true}));
    }
    if (showAll && p.interpretations.length) {
      const ip = p.interpretations[0];
      interp = noteCard(ctx, {name: 'interp', x: 30, y: stripY + size * 1.9, w: Math.min(W - 60, 1100), size: size * 0.98, min, title: `${ip.by} · ${t.attributed}`, body: ip.text, opacity: 0});
    }
    // checks
    const allBoxes = Object.values(leaves).map(l => l.box);
    const landing = graph.conns.map(x => ({from: x.rel.from, to: x.rel.to, ok: nearEdge(elements[x.rel.from].box, x.c.from) && nearEdge(elements[x.rel.to].box, x.c.to)}));
    const leavesFit = Object.values(leaves).every(l => l.fits);
    const leavesClear = allBoxes.every((b, i) => allBoxes.every((c, j) => i === j || !overlaps(b, c, 4)));
    return {columns, chipBoxes: [...bandHeads.filter(c => c.fit).map(c => c.box), ...Object.values(leaves).map(l => l.cap && l.cap.box).filter(Boolean), ...(volCap ? [volCap.box] : [])], connEnds, arounds, labBoxes, plate, coverLabels, contentMin, volCap, titleSize: D(21), minSize: min, W, H, vol, bands, bandHeads, leaves, graph, rels, order, legs, outlines, parkOf, flag, shadow, badges, key, interp, landing, leavesFit, leavesClear, elements, stripY, wide};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const p = ctx.params;
    const V = L.vol;
    // closed volume seen from above: cover, page edges on the fore-edge, one tab per division at its band
    const volParts = [
      h('path', {d: roundRectPath(V.x + 8, V.y + 12, V.w, V.h, 14), fill: th.shadow}),
      h('path', {d: roundRectPath(V.x, V.y, V.w, V.h, 14), fill: COVER, stroke: th.ink, 'stroke-width': 2.6}),
    ];
    if (L.wide) {
      volParts.push(h('rect', {x: V.x + V.w - 24, y: V.y + 10, width: 18, height: V.h - 20, rx: 4, fill: th.paper, stroke: th.ink, 'stroke-width': 1.5}));
      for (let q = 0; q < 5; q++) volParts.push(h('path', {d: `M${r(V.x + V.w - 20 + q * 3.2)} ${r(V.y + 14)}V${r(V.y + V.h - 14)}`, stroke: th.paperLine, 'stroke-width': 1}));
    } else {
      volParts.push(h('rect', {x: V.x + 10, y: V.y + V.h - 24, width: V.w - 20, height: 18, rx: 4, fill: th.paper, stroke: th.ink, 'stroke-width': 1.5}));
      for (let q = 0; q < 5; q++) volParts.push(h('path', {d: `M${r(V.x + 14)} ${r(V.y + V.h - 20 + q * 3.2)}H${r(V.x + V.w - 14)}`, stroke: th.paperLine, 'stroke-width': 1}));
    }
    L.bands.forEach((b, lv) => {
      const c = levelColor(ctx, lv);
      const ty = L.columns ? V.y + V.h * 0.55 + lv * 60 : L.wide ? clamp(b.y + 30, V.y + 20, V.y + V.h - 60) : V.y + V.h - 6;
      volParts.push(L.wide
        ? h('path', {d: roundRectPath(V.x + V.w - 6, ty, 26, 44, 6), fill: c, stroke: th.ink, 'stroke-width': 2})
        : h('path', {d: roundRectPath(V.x + 30 + lv * 90, ty, 60, 26, 6), fill: c, stroke: th.ink, 'stroke-width': 2}));
    });
    const plate = L.plate ? g(null, h('path', {d: roundRectPath(L.plate.x, L.plate.y, L.plate.w, L.plate.h, 8), fill: '#f4ecd8', stroke: shade(COVER, -0.3), 'stroke-width': 1.6}), textBlock(L.plate.f, {x: L.plate.x + L.plate.w / 2, y: L.plate.y + 10, anchor: 'middle', fill: th.ink, name: 'vol-title'})) : null;
    const bandNodes = L.bands.map((b, lv) => g({name: `band${lv}`, opacity: 0},
      h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 18), fill: shade(levelColor(ctx, lv), 0.86), stroke: shade(levelColor(ctx, lv), 0.3), 'stroke-width': 2}),
      L.bandHeads[lv].node));
    const leafNodes = Object.values(L.leaves).map(l => {
      const b = l.box;
      const pillNode = l.blk.pill && ctx.params.passages[l.i].cue ? cuePill(ctx, {pill: l.blk.pill}) : null;
      return g({name: `leaf-${l.id}`},
        g({name: `leafbody-${l.id}`},
          h('path', {d: roundRectPath(b.x + 6, b.y + 9, b.w, b.h, 10), fill: th.shadow}),
          h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}),
          h('path', {d: `M${r(b.x + b.w - 26)} ${r(b.y)}l26 26`, stroke: th.paperLine, 'stroke-width': 1.5}),
          g({transform: T(b.x, b.y)}, l.blk.parts, pillNode),
          l.cap && l.cap.node));
    });
    return g(null,
      bandNodes,
      g({name: 'volume'}, volParts, plate),
      L.volCap && L.volCap.node,
      L.graph.node,
      leafNodes,
      L.graph.labelsNode,
      L.coverLabels.map(cl => g({name: `vlabg${cl.i}`, opacity: 0}, h('line', {...cl.lead, stroke: th.fgSoft, 'stroke-width': 2}), cl.node)),
      L.badges,
      L.shadow,
      L.flag,
      L.key,
      L.interp && L.interp.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    // separate: bands open, leaves slide out of the volume onto their band
    const V = L.vol;
    const bandsP = seg(u, ...M.bands);
    L.bands.forEach((b, lv) => { nodes[`band${lv}`] = {opacity: r(clamp(bandsP * 1.5), 3)}; });
    const ids = Object.keys(L.leaves);
    const leafOut = {};
    ids.forEach((id, j) => {
      const l = L.leaves[id];
      // one leaf after another (each lands before the next leaves the volume)
      const each = (M.out[1] - M.out[0]) / ids.length;
      const q = ease.inOutCubic(seg(u, M.out[0] + j * each, M.out[0] + (j + 1) * each));
      // the leaf leaves the volume small, travels along the free corridor (the gap between the bands
      // on wide stages, the right margin on tall ones) and only grows to full size as it lands
      const cx = l.box.x + l.box.w / 2, cy = l.box.y + l.box.h / 2;
      const C0 = L.wide ? {x: V.x + V.w - 10, y: V.y + V.h / 2} : {x: V.x + V.w / 2, y: V.y + V.h - 10};
      const band = L.bands[l.level];
      const gapY = L.bands[0].y + L.bands[0].h + 13;
      const K = L.wide ? {x: (C0.x + cx) / 2, y: gapY} : {x: L.W - 24, y: (C0.y + cy) / 2};
      const qq = 1 - q;
      const px2 = qq * qq * C0.x + 2 * qq * q * K.x + q * q * cx;
      const py2 = qq * qq * C0.y + 2 * qq * q * K.y + q * q * cy;
      const sc = lerp(0.18, 1, Math.pow(q, 3));
      const dx = px2 - cx, dy = py2 - cy;
      nodes[`leaf-${id}`] = {transform: `${T(dx, dy)} ${scaleAbout(cx, cy, sc)}`, opacity: r(clamp(q * 3), 3)};
      leafOut[id] = r(q, 3);
    });
    // relations drawn one after another in the supplied order
    const nr = L.graph.conns.length;
    const span = (M.rel[1] - M.rel[0]) / Math.max(1, nr);
    const relP = L.graph.conns.map((x, i) => seg(u, M.rel[0] + i * span, M.rel[0] + (i + 1) * span - 0.01));
    Object.assign(nodes, L.graph.frame(i => relP[i]));
    L.graph.conns.forEach((x, i) => { if (nodes[`rel-lg${i}`]) nodes[`rel-lg${i}`].opacity = 0; });
    L.coverLabels.forEach(cl => {
      nodes[`vlabg${cl.i}`] = {opacity: r(clamp((relP[cl.i] - 0.55) / 0.45), 3)};
    });
    // tracer: docked on the first leaf, then per leg: turn round, ride the connector, walk round the leaf reached
    const tr0 = M.trace[0], tr1 = M.trace[1];
    const T0 = tr0 + 0.03;
    const nLegs = L.legs.length;
    const legSpan = (tr1 - T0) / Math.max(1, nLegs);
    const phaseOf = j => {
      const a0 = T0 + j * legSpan;
      const last = j === nLegs - 1;
      const wTurn = 0.12, wTravel = last ? 0.42 : 0.46;
      // after the last leg the marker moves off the line to dock on the referenced leaf's free edge, clear of
      // every connector end (the last arrowhead stays visible)
      return {turn: [a0, a0 + legSpan * wTurn], travel: [a0 + legSpan * wTurn, a0 + legSpan * (wTurn + wTravel)], around: [a0 + legSpan * (wTurn + wTravel), a0 + legSpan], last};
    };
    const HL = (FLAG.L * TS) / 2;
    let tip = null, dir = {x: -1, y: 0}, lift = 0, at = null, flipSx = 1;
    const visited = [];
    const visible = u >= tr0 && L.order.length > 0;
    const unit = v => { const m = Math.hypot(v.x, v.y) || 1; return {x: v.x / m, y: v.y / m}; };
    const tanAt = (poly, f) => { const a1 = poly.at(Math.max(0, f - 0.01)), b1 = poly.at(Math.min(1, f + 0.01)); return unit({x: b1.x - a1.x, y: b1.y - a1.y}); };
    if (L.order.length) {
      visited.push(L.order[0]);
      at = L.order[0];
      if (nLegs) {
        const P0 = L.legs[0].poly;
        const t0 = tanAt(P0, 0.02);
        tip = P0.at(0);
        dir = t0;
        flipSx = -1;
      } else {
        const bx = L.leaves[L.order[0]].box;
        tip = {x: bx.x + bx.w + 4, y: bx.y + 30};
        dir = {x: -1, y: 0};
      }
      for (let j = 0; j < nLegs; j++) {
        const ph = phaseOf(j);
        if (u < ph.turn[0]) break;
        const P = L.legs[j].poly;
        const t0 = tanAt(P, 0.02);
        const A = P.at(0);
        // turn in place ON the line (a flip about the grip, no sweep): from pointing back into the leaf
        // to pointing along the connector
        const G = {x: A.x + t0.x * HL, y: A.y + t0.y * HL};
        const q = ease.inOutSine(seg(u, ...ph.turn));
        dir = t0;
        flipSx = lerp(-1, 1, q);
        if (Math.abs(flipSx) < 0.04) flipSx = 0.04;
        tip = {x: G.x + t0.x * HL * flipSx, y: G.y + t0.y * HL * flipSx};
        lift = 0.5 * q;
        at = q < 1 ? L.legs[j].from : null;
        if (u < ph.travel[0]) break;
        // ride the connector tip-first
        flipSx = 1;
        const total = P.total;
        const s0 = Math.min(FLAG.L * TS, total * 0.5) / Math.max(1, total);
        const f = lerp(s0, 1, ease.inOutCubic(seg(u, ...ph.travel)));
        const pt = P.at(f);
        tip = {x: pt.x, y: pt.y};
        dir = tanAt(P, Math.min(0.99, f));
        lift = 0.5 + 0.5 * Math.sin(Math.PI * seg(u, ...ph.travel)) - 0.5 * seg(u, ph.travel[1] - (ph.travel[1] - ph.travel[0]) * 0.2, ph.travel[1]);
        if (u >= ph.travel[1]) {
          at = L.legs[j].to;
          visited.push(at);
          lift = 0;
        }
        if (!ph.around || u < ph.around[0]) break;
        // move to where the next connector leaves the leaf (or to the parking spot) by the precomputed
        // label-free path (hop over the leaf or walk round its outline)
        const AR = L.arounds[j].samples;
        const w = ease.inOutSine(seg(u, ...ph.around));
        const fi = w * (AR.length - 1);
        const i0 = Math.floor(fi), i1 = Math.min(AR.length - 1, i0 + 1), fr = fi - i0;
        const sm = {x: lerp(AR[i0].x, AR[i1].x, fr), y: lerp(AR[i0].y, AR[i1].y, fr), a: lerp(AR[i0].a, AR[i1].a, fr)};
        tip = {x: sm.x, y: sm.y};
        dir = {x: Math.cos(sm.a), y: Math.sin(sm.a)};
        lift = AR[0].hop ? 0.9 * Math.sin(Math.PI * w) : 0.15 * Math.sin(Math.PI * w);
        if (w >= 1 && !ph.last) at = L.legs[j].to;
      }
    }
    // grip on the line behind the tip; flipSx < 0 mirrors the flag so its tip points back along the line
    const grip = tip ? {x: tip.x - dir.x * HL * flipSx, y: tip.y - dir.y * HL * flipSx} : {x: 0, y: 0};
    const rot = (Math.atan2(dir.y, dir.x) * 180) / Math.PI - 180;
    const appear = seg(u, tr0, tr0 + 0.02);
    Object.assign(nodes, flagPose('tracer', {x: grip.x, y: grip.y, rot, sx: flipSx, lift: clamp(lift, 0, 1), opacity: visible ? appear : 0, scale: TS}));
    const pos = grip;
    L.order.forEach((id, j) => {
      const tj = j === 0 ? tr0 : phaseOf(j - 1).travel[1];
      nodes[`dock${j}`] = {opacity: r(seg(u, tj, tj + 0.025), 3)};
    });
    const focus = ctx.params.focusElement;
    let focusScale = 1;
    ids.forEach(id => {
      const l = L.leaves[id];
      // swell in / out smoothly around the dwell
      let s = 1;
      if (id === focus && L.order.includes(id)) {
        const j = L.order.indexOf(id);
        const arrive = j === 0 ? tr0 : phaseOf(j - 1).travel[1];
        const leave = j < nLegs ? phaseOf(j).travel[0] : tr1;
        s = 1 + 0.08 * Math.min(seg(u, arrive - 0.01, arrive + 0.02), 1 - seg(u, leave - 0.02, leave + 0.01));
      }
      if (id === focus) focusScale = s;
      nodes[`leafbody-${id}`] = {transform: s !== 1 ? scaleAbout(l.box.x + l.box.w / 2, l.box.y + l.box.h / 2, s) : ''};
    });
    if (L.key) nodes.key = {opacity: r(seg(u, ...M.key), 3)};
    if (L.interp) nodes.interp = {opacity: r(seg(u, ...M.interp), 3)};
    const beat = u < 0.18 ? 'separate' : u < 0.43 ? 'relate' : u < 0.75 ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        separated: Math.min(...Object.values(leafOut)),
        relationsDrawn: relP.map(v => r(v, 3)),
        kinds: L.rels.map(q => q.kind),
        arrowOnPlainRelation: false,
        connectorsLand: L.landing.every(x => x.ok),
        visitOrder: L.order,
        visited,
        tracerVisible: visible && appear > 0,
        tip: tip ? {x: r(tip.x), y: r(tip.y)} : null,
        parkedClearOfEnds: !tip || L.connEnds.every(q => [tip, grip, {x: 2 * grip.x - tip.x, y: 2 * grip.y - tip.y}, {x: (tip.x + grip.x) / 2, y: (tip.y + grip.y) / 2}].every(f => Math.hypot(f.x - q.x, f.y - q.y) >= 20)),
        lastLinkLength: r(L.graph.conns.filter(x => x.rel.kind !== 'relation').slice(-1).map(x => x.c.total)[0] || 0, 1),
        tracerOverLabel: !!tip && visible && L.labBoxes.some(b => [tip, grip, {x: (tip.x + grip.x) / 2, y: (tip.y + grip.y) / 2}, {x: 2 * grip.x - tip.x, y: 2 * grip.y - tip.y}].some(q => q.x > b.x - FLAG.H * TS / 2 && q.x < b.x + b.w + FLAG.H * TS / 2 && q.y > b.y - FLAG.H * TS / 2 && q.y < b.y + b.h + FLAG.H * TS / 2)),
        labelsClearOfEnds: L.coverLabels.every(cl => L.graph.conns.every(x => [x.c.from, x.c.to].every(q => !(q.x > cl.box.x - 6 && q.x < cl.box.x + cl.box.w + 6 && q.y > cl.box.y - 6 && q.y < cl.box.y + cl.box.h + 6)))),
        labelsPlaced: L.coverLabels.every(cl => !cl.forced),
        // each label is nearer to its own line than to any other line (it can always be matched to it)
        labelsOwnLine: L.coverLabels.every(cl => {
          const c = {x: cl.box.x + cl.box.w / 2, y: cl.box.y + cl.box.h / 2};
          const dTo = x => Math.min(...Array.from({length: 41}, (_, q) => { const pt = x.c.at(q / 40); return Math.hypot(pt.x - c.x, pt.y - c.y); }));
          const own = dTo(L.graph.conns[cl.i]);
          return L.graph.conns.every((x, j) => j === cl.i || dTo(x) > own);
        }),
        labelLeads: L.coverLabels.map(cl => r(Math.hypot(cl.lead.x2 - cl.lead.x1, cl.lead.y2 - cl.lead.y1), 0)),
        labelsClearOfChips: L.coverLabels.every(cl => !L.chipBoxes.some(b => overlaps(cl.box, b, 0))) && L.coverLabels.every((c1, i1) => L.coverLabels.every((c2, i2) => i1 === i2 || !overlaps(c1.box, c2.box, 0))),
        linesClearOfChips: L.graph.conns.every(x => Array.from({length: 41}, (_, q) => x.c.at(q / 40)).every(pt => !L.chipBoxes.some(b => pt.x > b.x + 2 && pt.x < b.x + b.w - 2 && pt.y > b.y + 2 && pt.y < b.y + b.h - 2))),
        aroundsClear: L.arounds.map(x => x.clear),
        aroundHop: L.arounds.map(x => x.samples[0].hop),
        tracerClear: !tip || Object.values(L.leaves).every(l => !insideBox(grip, l.box, -4)),
        tracer: {x: r(pos.x), y: r(pos.y)},
        at,
        focus,
        focusScale: r(focusScale, 3),
        docks: L.order.map((id, j) => r(nodes[`dock${j}`].opacity, 3)),
        leaves: Object.keys(L.leaves),
        leavesFit: L.leavesFit,
        contentMin: r(L.contentMin, 2),
        leavesClear: L.leavesClear,
        keyShown: L.key ? r(seg(u, ...M.key), 3) : 0,
      },
    };
  },
};

const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
const insideBox = (pt, b, pad = 0) => pt.x > b.x - pad && pt.x < b.x + b.w + pad && pt.y > b.y - pad && pt.y < b.y + b.h + pad;

/**
 * Rounded-rectangle outline parametrised by arc length (clockwise from the top edge):
 * at(s) → point + outward normal; proj(pt) → nearest arc length; nearest(pt) → nearest point.
 */
function roundedOutline(b, R) {
  const segs = [];
  const line = (x0, y0, x1, y1, nx, ny) => segs.push({len: Math.hypot(x1 - x0, y1 - y0), at: t => ({x: lerp(x0, x1, t), y: lerp(y0, y1, t), nx, ny})});
  const arc = (cx, cy, a0) => segs.push({len: (Math.PI / 2) * R, at: t => { const a = a0 + (Math.PI / 2) * t; return {x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, nx: Math.cos(a), ny: Math.sin(a)}; }});
  line(b.x + R, b.y, b.x + b.w - R, b.y, 0, -1);
  arc(b.x + b.w - R, b.y + R, -Math.PI / 2);
  line(b.x + b.w, b.y + R, b.x + b.w, b.y + b.h - R, 1, 0);
  arc(b.x + b.w - R, b.y + b.h - R, 0);
  line(b.x + b.w - R, b.y + b.h, b.x + R, b.y + b.h, 0, 1);
  arc(b.x + R, b.y + b.h - R, Math.PI / 2);
  line(b.x, b.y + b.h - R, b.x, b.y + R, -1, 0);
  arc(b.x + R, b.y + R, Math.PI);
  const total = segs.reduce((m, q) => m + q.len, 0);
  const at = s => {
    let x = ((s % total) + total) % total;
    for (const q of segs) {
      if (x <= q.len || q === segs[segs.length - 1]) return q.at(q.len ? Math.min(1, x / q.len) : 0);
      x -= q.len;
    }
    return segs[0].at(0);
  };
  const proj = pt => {
    let best = 0, bd = Infinity;
    for (let i = 0; i < 400; i++) {
      const s = (i / 400) * total;
      const q = at(s);
      const d = Math.hypot(q.x - pt.x, q.y - pt.y);
      if (d < bd) { bd = d; best = s; }
    }
    return best;
  };
  return {total, at, proj, nearest: pt => { const q = at(proj(pt)); return {x: q.x, y: q.y}; }};
}

/** A connector end lies on (or just outside) the edge of its element box. */
function nearEdge(b, pt, tol = 16) {
  const inX = pt.x >= b.x - tol && pt.x <= b.x + b.w + tol;
  const inY = pt.y >= b.y - tol && pt.y <= b.y + b.h + tol;
  const onV = Math.min(Math.abs(pt.x - b.x), Math.abs(pt.x - b.x - b.w)) <= tol;
  const onH = Math.min(Math.abs(pt.y - b.y), Math.abs(pt.y - b.y - b.h)) <= tol;
  return inX && inY && (onV || onH);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-08-mechanism',
    title: 'Cross-reference between articles — exploded volume and the path of the marker',
    titleEs: 'Remisión entre artículos — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Remisión entre artículos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view of a fictional bound volume: its divisions open as bands and the articles slide out as leaves onto their band. Only the supplied relationships are drawn, anchored to the leaves ("printed in" as a plain relation, "refers to" as a sequence link), and the page flag travels them in the supplied order while the focus leaf swells. No conclusion is drawn.',
    tags: ['cross-reference', 'remisión', 'mechanism', 'article', 'book', 'editable hierarchy', 'page flag', 'chain of references', 'relation'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/remision-entre-articulos.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RA_STRINGS,
  scene,
});
