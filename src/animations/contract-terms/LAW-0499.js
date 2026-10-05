/**
 * LAW-0499 — Cláusula de terminación · contrast
 *
 * Storyboard (two identical filing walls, side by side on wide boxes, stacked on tall ones):
 *  0.00–0.17  each wall carries the contract plate ("CT-731 · Contract (fictional) · Termination clause"), an overhead
 *             rail with a carrier whose clip holds the slip "Communication 1 (supplied)", the supplied sections as
 *             plates (each with a closed slot at its right end) and a tray at the bottom right. A and B are identical.
 *  0.20–0.34  the one changed fact, at the same slot (the supplied section): in A ("Case provided for (as supplied)")
 *             a hook swings out of the slot (● on its base); in B ("Case not described (as supplied)") a flush cover
 *             slides over the slot (◆ on it). Same size, colour and timing.
 *  0.40–0.56  both carriers run along their rails to the same place above the slip column (identical motion).
 *  0.58–0.72  both slips are lowered on their cords for the same time: in A the slip's hole catches on the hook beside
 *             the supplied section; in B the slip passes the covered slot and settles in the tray. The cords reel up.
 *  0.77–1.00  hold: "Section linked as supplied" (A) and "No section linked · as supplied" (B), a guide outlining the
 *             same slot in both walls ("Only this differs: the supplied case") and the neutral note "Same communication
 *             and clause · as supplied · no conclusion drawn". No winner, no outcome.
 * No termination doctrine: no ground or right to terminate, no notice period or time limit, no effect, no validity
 * judgement, no jurisdiction.
 * @module animations/contract-terms/LAW-0499
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {ease, lerp, r, seg, clamp} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {obj, str} from '../../schemas/fields.js';
import {
  INK, CONTENT, CONTENT_ES, KIT_STRINGS, contractField, clauseTitleField, clausesField, sectionField, communicationField,
  sectionIndex, localizeScene, unitPx, fitG, chipG, txt, caseGlyph, peg,
} from './kits/terminacion-comunicaciones.js';

const ID = 'LAW-0499';
const DURATION = 6500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], hold: [0.77, 1]};
const W = {change: [0.2, 0.34], run: [0.4, 0.56], lower: [0.58, 0.72], reel: [0.72, 0.77], guide: [0.77, 0.82], tags: [0.78, 0.83], notes: [0.81, 0.86]};

const sceneSchema = {
  contract: contractField,
  clauseTitle: clauseTitleField,
  clauses: clausesField,
  section: sectionField,
  communication: communicationField,
  scenarioA: obj('Scenario A (left / top): the supplied case "provided for"', {label: str('Label of scenario A', 60)}, ['label']),
  scenarioB: obj('Scenario B (right / bottom): the supplied case "not described"', {label: str('Label of scenario B', 60)}, ['label']),
  changedFact: str('The single fact that differs between A and B (the label of the guide)', 90),
  comparisonLabels: obj('Neutral note under the comparison', {neutral: str('Neutral note (no winner, no outcome)', 110)}, ['neutral']),
  objectLabels: obj('Label of the tray', {tray: str('Label of the tray at the bottom of each wall', 34)}, ['tray']),
};

const defaultParams = {
  contract: CONTENT.contract,
  clauseTitle: CONTENT.clauseTitle,
  clauses: CONTENT.clauses,
  section: CONTENT.section,
  communication: CONTENT.communication,
  scenarioA: {label: CONTENT.stateLabels.provided},
  scenarioB: {label: CONTENT.stateLabels.undescribed},
  changedFact: 'Only this differs: the supplied case',
  comparisonLabels: {neutral: 'Same communication and clause · as supplied · no conclusion drawn'},
  objectLabels: {tray: 'Tray'},
};
const defaultParamsEs = {
  contract: CONTENT_ES.contract,
  clauseTitle: CONTENT_ES.clauseTitle,
  clauses: CONTENT_ES.clauses,
  communication: CONTENT_ES.communication,
  scenarioA: {label: CONTENT_ES.stateLabels.provided},
  scenarioB: {label: CONTENT_ES.stateLabels.undescribed},
  changedFact: 'Solo esto cambia: el supuesto aportado',
  comparisonLabels: {neutral: 'Misma comunicación y cláusula · según lo aportado · sin conclusión'},
  objectLabels: {tray: 'Bandeja'},
};

const isStress = p => [...p.clauses, p.communication.label, p.contract.title, p.scenarioA.label, p.scenarioB.label].some(t => t.length > 40);

/** Geometry of one wall in lane-local coordinates (both lanes share it). */
function laneGeom(ctx, F, minF, w, hgt, slipShare = 0.3) {
  const p = ctx.params;
  const stress = isStress(p);
  const why = [];
  const headF = F;
  const labels = [p.scenarioA.label, p.scenarioB.label].map(t => fitG(t, {maxWidth: w - F * 2.6 - 20, size: headF, minSize: minF, maxLines: 2, weight: 700}));
  const headH = Math.max(labels[0].height, labels[1].height, F * 1.6) + 18;
  const wall = {x: 0, y: headH + 10, w, h: hgt - headH - 10};
  const railY = wall.y + 28;
  // the slip
  const slipW = clamp(Math.max(F * 8.4, w * slipShare), 210, Math.max(300, F * 9, w * slipShare));
  const slipFit = fitG(p.communication.label, {maxWidth: slipW - 28, size: F, minSize: minF, maxLines: stress ? 4 : 3, weight: 700});
  const slipH = slipFit.height + 54;
  const carrierH = 34;
  const restSlipY = railY + carrierH + 30; // slip top while carried
  const plateTop = restSlipY + slipH + 26;
  // section plates (left), slip column (right)
  const colW = slipW + 56;
  const px = wall.x + 18, pw = w - 36 - colW;
  const rowFits = p.clauses.map(c => fitG(c, {maxWidth: pw - 50, size: F, minSize: minF, maxLines: stress ? 3 : 2, weight: 600}));
  const trayLab = fitG(p.objectLabels.tray, {maxWidth: slipW + 10, size: Math.max(F * 0.9, minF), minSize: minF, maxLines: 2, weight: 700});
  const trayH = slipH * 0.58 + 10;
  const trayY = wall.y + wall.h - 16 - trayH;
  const rowsH = trayY - 10 - plateTop;
  const rowH0 = rowFits.map(f => f.height + 28);
  const need = rowH0.reduce((a, b) => a + b, 0) + 16 * (rowFits.length - 1);
  if (labels.some(f => f.bad) || slipFit.bad || rowFits.some(f => f.bad) || trayLab.bad) why.push('text');
  // the slip hung on the last section must stay above the tray
  const spare = Math.max(0, rowsH - need);
  const grow = Math.min(spare * 0.45 / rowFits.length, F * 2.2);
  const rgap = 16 + Math.min((spare - grow * rowFits.length) / Math.max(1, rowFits.length), F * 2);
  let y = plateTop;
  const rows = rowFits.map((fit, i) => { const row = {x: px, y, w: pw, h: rowH0[i] + grow, fit}; y += row.h + rgap; return row; });
  if (need > rowsH + 0.5) why.push('rows-do-not-fit');
  const si = sectionIndex(p);
  const row = rows[si];
  const slot = {x: px + pw, y: row.y + row.h / 2};
  const colX = px + pw + 28 + slipW / 2; // slip centre x (column)
  // the hook's tip: the hung slip is centred on the section's row, raised if it would reach the tray
  const tipLo = restSlipY + 6, tipHi = trayY - 12 - slipH + 6;
  const hookTip = {x: colX, y: clamp(row.y + row.h / 2 - slipH / 2 + 6, tipLo, Math.max(tipLo, tipHi))};
  const hungTop = hookTip.y - 6; // the slip's hole sits on the tip
  const trayTop = trayY - (44 + slipFit.height + 10); // slip top resting in the tray (its label stays above the rim)
  if (tipHi < tipLo) why.push('hung-slip-over-tray');
  const startX = wall.x + 26 + slipW / 2;
  const contentF = Math.min(slipFit.size, ...rowFits.map(f => f.size));
  return {why, contentF, headH, labels, wall, railY, slipW, slipH, slipFit, carrierH, restSlipY, rows, row, si, slot, colX, hookTip, hungTop, trayTop, trayY, trayH, trayLab, startX};
}

function geom(ctx, F, minF, arrangement) {
  const p = ctx.params;
  const D = ctx.design;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const why = [];
  const pad = 14, gap = 44;
  // the contract plate is shared content: drawn once, above both walls
  const plate = fitG(`${p.contract.reference} · ${p.contract.title} · ${p.clauseTitle}`, {maxWidth: D.w - pad * 2 - 60, size: F, minSize: minF, maxLines: 2, weight: 700});
  if (plate.bad) why.push('plate-text');
  const plateH = plate.height + 22;
  const top0 = pad + plateH + 18;
  // bottom strip: the guide label and the neutral note (measured at F first; drawn at the content size, never larger)
  const notes = [];
  if (show) notes.push({name: 'guideNote', kind: 'guide', text: p.changedFact});
  if (showKey) notes.push({name: 'neutral', kind: 'key', text: p.comparisonLabels.neutral});
  const noteW = arrangement === 'row' ? (D.w - pad * 2 - 30) / 2 : D.w - pad * 2;
  const mkChip = (q, x, y, size, anchor) => chipG(ctx, q.text, {x, y, anchor, maxWidth: noteW, size, minSize: Math.min(size, minF), maxLines: 2, weight: q.kind === 'key' ? 500 : 700, name: q.name, fill: q.kind === 'guide' ? '#fff5d6' : ctx.theme.card, stroke: q.kind === 'guide' ? ctx.theme.accent3 : ctx.theme.ink});
  const stripOf = cs => (cs.length ? (arrangement === 'row' ? Math.max(...cs.map(c => c.box.h)) : cs.reduce((a, c) => a + c.box.h + 12, -12)) + 20 : 0);
  const stripH = stripOf(notes.map(q => mkChip(q, 0, 0, F)));
  const lanes = [];
  let lw, lh;
  if (arrangement === 'row') {
    lw = (D.w - pad * 2 - gap) / 2; lh = D.h - pad - top0 - stripH;
    lanes.push({x: pad, y: top0}, {x: pad + lw + gap, y: top0});
  } else {
    lw = D.w - pad * 2; lh = (D.h - pad - top0 - stripH - gap) / 2;
    lanes.push({x: pad, y: top0}, {x: pad, y: top0 + lh + gap});
  }
  let G = null;
  for (const share of [0.3, 0.38, 0.46]) { G = laneGeom(ctx, F, minF, lw, lh, share); if (!G.why.length) break; }
  why.push(...G.why);
  const NF = Math.min(F, G.contentF);
  const chips = notes.map(q => mkChip(q, 0, 0, NF));
  if (chips.some(c => c.bad)) why.push('note-text');
  // final tags in the travel band (empty once the slip has gone down)
  const tags = show ? [ctx.t.linked, ctx.t.unlinked].map((t, i) => chipG(ctx, t, {x: G.wall.x + 22, y: G.restSlipY + 6, maxWidth: lw - 60, size: NF, minSize: Math.min(NF, minF), maxLines: 2, weight: 700, name: `tag${i}`,
    glyph: (gx, gy, rr) => caseGlyph(ctx, i === 0 ? 'provided' : 'undescribed', gx, gy, rr), fill: ctx.theme.accent2Soft})) : [];
  if (tags.some(c => c.bad || c.box.h > G.slipH + 10)) why.push('tag');
  // place the strip (bottom-aligned)
  const sh = stripOf(chips);
  const stripY = D.h - pad - sh + 10;
  let placed = [];
  if (chips.length) {
    if (arrangement === 'row') {
      const tot = chips.reduce((a, c) => a + c.box.w, 0) + 30 * (chips.length - 1);
      let x = (D.w - tot) / 2;
      placed = chips.map((c, i) => { const n = mkChip(notes[i], x, stripY, NF); x += c.box.w + 30; return n; });
    } else {
      let y = stripY;
      placed = chips.map((c, i) => { const n = mkChip(notes[i], D.w / 2, y, NF, 'middle'); y += c.box.h + 12; return n; });
    }
  }
  return {ok: !why.length, why, F, minF, arrangement, lanes, lw, lh, G, tags, placed, notes, stripH, plate, plateH, pad};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1050], portrait: [900, 1600]},
  layout(ctx) {
    const p = ctx.params;
    const upx = unitPx(ctx);
    const stress = isStress(p);
    const minF = (stress ? 16.6 : 20) / upx;
    const arrs = ctx.view.shape === 'portrait' ? ['column'] : ctx.view.shape === 'square' ? ['row', 'column'] : ['row'];
    let L = null;
    search: for (const fpx of stress ? [21, 19.5, 18, 17, 16.6] : [25, 23, 21.5]) for (const a of arrs) {
      L = geom(ctx, fpx / upx, minF, a);
      if (L.ok) break search;
    }
    L.upx = upx;
    return L;
  },
  build(ctx, L) {
    const lanes = L.lanes.map((ln, i) => g({transform: T(ln.x, ln.y)}, laneArt(ctx, L, i)));
    const notes = L.placed.map((c, i) => g({name: `${L.notes[i].name}-g`, opacity: 0}, c.node));
    // the guide: the same slot outlined in both walls, joined by a line through the gap
    const G = L.G;
    const box = {x: G.slot.x - 14, y: Math.min(G.row.y, G.hungTop) - 12, w: G.colX + G.slipW / 2 + 16 - (G.slot.x - 14), h: Math.max(G.row.y + G.row.h, G.hungTop + G.slipH) + 12 - (Math.min(G.row.y, G.hungTop) - 12)};
    const boxes = L.lanes.map(ln => ({x: ln.x + box.x, y: ln.y + box.y, w: box.w, h: box.h}));
    const th = ctx.theme;
    const guide = g({name: 'guide', opacity: 0},
      boxes.map(bx => h('path', {d: roundRectPath(bx.x, bx.y, bx.w, bx.h, 14), fill: 'none', stroke: th.accent3, 'stroke-width': 5})),
    );
    const D = ctx.design;
    const pl = {x: L.pad, y: L.pad, w: D.w - L.pad * 2, h: L.plateH};
    const plate = g(null,
      h('path', {d: roundRectPath(pl.x, pl.y, pl.w, pl.h, 8), fill: '#fbf8f1', stroke: INK, 'stroke-width': 2.2}),
      h('rect', {x: r(pl.x), y: r(pl.y), width: 12, height: r(pl.h), rx: 4, fill: th.accent2Soft}),
      ctx.show('all') ? txt(L.plate, {x: pl.x + pl.w / 2, y: pl.y + (pl.h - L.plate.height) / 2, anchor: 'middle', fill: INK})
        : h('path', {d: `M${r(pl.x + pl.w * 0.25)} ${r(pl.y + pl.h / 2)}h${r(pl.w * 0.5)}`, stroke: '#d5cdbd', 'stroke-width': 9, 'stroke-linecap': 'round'}),
      // the plate is shared by both walls: two short hangers down to each wall
      L.lanes.map(ln => h('path', {d: `M${r(ln.x + L.lw / 2)} ${r(pl.y + pl.h)}V${r(ln.y + L.G.wall.y)}`, stroke: '#9aa4ad', 'stroke-width': 4})),
    );
    return g({name: 'scene'}, plate, lanes, guide, notes);
  },
  frame(ctx, L, u) {
    const nodes = {};
    const G = L.G;
    const E = ease.inOutCubic;
    const ch = E(seg(u, ...W.change));
    const run = E(seg(u, ...W.run));
    const low = E(seg(u, ...W.lower));
    const reel = E(seg(u, ...W.reel));
    const cx = lerp(G.startX, G.colX, run);
    const looks = [];
    for (let i = 0; i < 2; i++) {
      const P = `L${i}`;
      // the change at the slot
      if (i === 0) nodes[`${P}-hook`] = {transform: `rotate(${r(lerp(-90, 0, ch), 2)} ${r(G.slot.x, 2)} ${r(G.slot.y, 2)})`, opacity: ch > 0 ? 1 : 0};
      else nodes[`${P}-cover`] = {transform: T(r(lerp(60, 0, ch), 2), 0), opacity: r(Math.min(1, ch * 3), 3)};
      // carrier and slip
      const endTop = i === 0 ? G.hungTop : G.trayTop;
      const slipTop = lerp(G.restSlipY, endTop, low);
      nodes[`${P}-carrier`] = {transform: T(r(cx, 2), 0)};
      nodes[`${P}-slip`] = {transform: T(r(cx - G.slipW / 2, 2), r(slipTop, 2))};
      // the cord: from the carrier down to the slip top; after landing it reels up
      const cordTop = G.railY + G.carrierH;
      const cordBot = low >= 1 ? lerp(slipTop, cordTop + 4, reel) : slipTop;
      nodes[`${P}-cord`] = {x1: r(cx, 2), x2: r(cx, 2), y1: r(cordTop, 2), y2: r(cordBot, 2)};
      nodes[`${P}-clip`] = {transform: T(r(cx, 2), r(cordBot, 2))};
      looks.push(`${r(cx)}|${r(slipTop)}|${r(cordBot)}|${i === 0 ? r(ch, 3) : r(ch, 3)}`);
    }
    const tq = seg(u, ...W.tags), gq = seg(u, ...W.guide), nq = seg(u, ...W.notes);
    L.tags.forEach((_, i) => { nodes[`tag${i}-g`] = {opacity: r(tq, 3)}; });
    nodes.guide = {opacity: r(gq, 3)};
    L.notes.forEach(q => { nodes[`${q.name}-g`] = {opacity: r(q.kind === 'guide' ? gq : nq, 3)}; });
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'hold';
    const slipA = {x: r(L.lanes[0].x + cx), y: r(L.lanes[0].y + lerp(G.restSlipY, G.hungTop, low))};
    const slipB = {x: r(L.lanes[1].x + cx), y: r(L.lanes[1].y + lerp(G.restSlipY, G.trayTop, low))};
    const changed = u >= W.change[0];
    return {
      nodes,
      semantic: {
        beat,
        // (before the change beat both walls are the same scene; the lane offset is not part of the look)
        lookA: changed ? `A:${looks[0]}` : looks[0], lookB: changed ? `B:${looks[1]}` : looks[1],
        slipA, slipB, carrierA: {x: r(L.lanes[0].x + cx), y: r(L.lanes[0].y + G.railY)}, carrierB: {x: r(L.lanes[1].x + cx), y: r(L.lanes[1].y + G.railY)},
        hookA: r(ch, 3), coverB: r(ch, 3), slipAAt: low >= 1 ? 'hook' : low > 0 ? 'lowering' : run > 0 ? 'running' : 'rail', slipBAt: low >= 1 ? 'tray' : low > 0 ? 'lowering' : run > 0 ? 'running' : 'rail',
        linkedA: low >= 1 ? G.si + 1 : null, linkedB: null,
        guideShown: r(gq, 3), tagsShown: r(tq, 3), keyShown: r(nq, 3),
        arrangement: L.arrangement, textPx: r(L.F * L.upx, 2),
        layoutOk: L.ok, why: L.why.join(','), problems: L.ok ? [] : L.why,
      },
    };
  },
};

/** One filing wall (lane-local). */
function laneArt(ctx, L, i) {
  const th = ctx.theme;
  const show = ctx.show('all'), showKey = ctx.show('key');
  const G = L.G;
  const P = `L${i}`;
  const {wall} = G;
  const laneCol = i === 0 ? th.accent : th.accent2;
  const parts = [];
  // header: letter badge + scenario label
  const bR = Math.min(G.headH * 0.42, L.F * 1.1);
  parts.push(h('circle', {cx: r(bR + 2), cy: r(G.headH / 2), r: r(bR), fill: laneCol, stroke: INK, 'stroke-width': 2.5}));
  if (showKey) {
    parts.push(h('text', {x: r(bR + 2), y: r(G.headH / 2 + bR * 0.42), 'text-anchor': 'middle', 'font-size': r(bR * 1.15, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: '#fff'}, i === 0 ? 'A' : 'B'));
    const f = G.labels[i];
    parts.push(caseGlyph(ctx, i === 0 ? 'provided' : 'undescribed', bR * 2 + 22, G.headH / 2, Math.min(12, L.F * 0.4)));
    parts.push(txt(f, {x: bR * 2 + 42, y: (G.headH - f.height) / 2, fill: th.fg}));
  } else {
    parts.push(caseGlyph(ctx, i === 0 ? 'provided' : 'undescribed', bR * 2 + 22, G.headH / 2, Math.min(12, L.F * 0.4)));
  }
  // the wall
  parts.push(h('rect', {x: r(wall.x + 8), y: r(wall.y + 12), width: r(wall.w), height: r(wall.h), rx: 16, fill: th.shadow}));
  parts.push(h('rect', {x: r(wall.x), y: r(wall.y), width: r(wall.w), height: r(wall.h), rx: 16, fill: '#e3e8e4', stroke: INK, 'stroke-width': 2.8}));
  for (let k = 1; k < 6; k++) parts.push(h('path', {d: `M${r(wall.x + 8)} ${r(wall.y + (wall.h * k) / 6)}H${r(wall.x + wall.w - 8)}`, stroke: '#d3dad5', 'stroke-width': 2}));
  // the rail
  parts.push(h('rect', {x: r(wall.x + 14), y: r(G.railY - 7), width: r(wall.w - 28), height: 14, rx: 7, fill: '#9aa4ad', stroke: INK, 'stroke-width': 2.2}));
  for (const x of [wall.x + 30, wall.x + wall.w - 30]) parts.push(h('circle', {cx: r(x), cy: r(G.railY), r: 6, fill: '#5f6b75'}));
  // the section plates with their slots
  G.rows.forEach((row, k) => {
    parts.push(h('rect', {x: r(row.x + 5), y: r(row.y + 7), width: r(row.w), height: r(row.h), rx: 8, fill: th.shadow}));
    parts.push(h('rect', {x: r(row.x), y: r(row.y), width: r(row.w), height: r(row.h), rx: 8, fill: '#ffffff', stroke: '#8f8676', 'stroke-width': 2}));
    parts.push(h('rect', {x: r(row.x), y: r(row.y), width: 10, height: r(row.h), rx: 4, fill: th.accent3}));
    if (show) parts.push(txt(row.fit, {x: row.x + 24, y: row.y + (row.h - row.fit.height) / 2, fill: INK}));
    else parts.push(h('path', {d: `M${r(row.x + 26)} ${r(row.y + row.h / 2)}h${r(Math.min(row.w - 70, 280))}`, stroke: '#d5cdbd', 'stroke-width': 8, 'stroke-linecap': 'round'}));
    // the slot at the right end (closed)
    parts.push(h('rect', {x: r(row.x + row.w - 4), y: r(row.y + row.h / 2 - 16), width: 14, height: 32, rx: 5, fill: '#b7bdb8', stroke: INK, 'stroke-width': 2}));
    void k;
  });
  // the tray
  const tr = {x: G.colX - G.slipW / 2 - 16, y: G.trayY, w: G.slipW + 32, h: G.trayH};
  const trayBack = h('rect', {x: r(tr.x + 6), y: r(tr.y - 14), width: r(tr.w - 12), height: 18, rx: 5, fill: '#b08e60', stroke: INK, 'stroke-width': 2});
  const trayFront = g(null,
    h('path', {d: `M${r(tr.x)} ${r(tr.y)}H${r(tr.x + tr.w)}L${r(tr.x + tr.w - 10)} ${r(tr.y + tr.h)}H${r(tr.x + 10)}Z`, fill: '#c9a46c', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    show ? txt(G.trayLab, {x: tr.x + tr.w / 2, y: tr.y + (tr.h - G.trayLab.height) / 2, anchor: 'middle', fill: INK}) : null,
  );
  // the changed fact at the supplied section's slot
  const s = G.slot;
  const change = i === 0
    ? g({name: `${P}-hook`, opacity: 0},
      h('path', {d: `M${r(s.x)} ${r(s.y)}H${r(G.hookTip.x)}V${r(G.hookTip.y)}`, fill: 'none', stroke: INK, 'stroke-width': 11, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(s.x)} ${r(s.y)}H${r(G.hookTip.x)}V${r(G.hookTip.y)}`, fill: 'none', stroke: '#c79a3c', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      peg(s.x + 4, s.y, 13),
      caseGlyph(ctx, 'provided', s.x + 4, s.y, 7, {fill: th.accent2}),
    )
    : g({name: `${P}-cover`, opacity: 0},
      h('rect', {x: r(s.x - 8), y: r(s.y - 22), width: 34, height: 44, rx: 7, fill: '#d6a84a', stroke: INK, 'stroke-width': 2.4}),
      caseGlyph(ctx, 'undescribed', s.x + 9, s.y, 7, {fill: th.accent2}),
    );
  // carrier, cord, clip and slip
  const carrier = g({name: `${P}-carrier`},
    h('rect', {x: -26, y: r(G.railY - 14), width: 52, height: r(G.carrierH), rx: 8, fill: '#5f6b75', stroke: INK, 'stroke-width': 2.4}),
    h('circle', {cx: -13, cy: r(G.railY - 8), r: 6, fill: '#dfe3e6', stroke: INK, 'stroke-width': 1.6}),
    h('circle', {cx: 13, cy: r(G.railY - 8), r: 6, fill: '#dfe3e6', stroke: INK, 'stroke-width': 1.6}),
  );
  const cord = h('line', {name: `${P}-cord`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: INK, 'stroke-width': 2.6});
  const clip = g({name: `${P}-clip`}, h('path', {d: 'M-9 -2H9L6 10H-6Z', fill: '#9aa4ad', stroke: INK, 'stroke-width': 1.8}));
  const sw = G.slipW, sh = G.slipH;
  const slip = g({name: `${P}-slip`},
    h('rect', {x: 6, y: 9, width: r(sw), height: r(sh), rx: 6, fill: th.shadow}),
    h('rect', {x: 0, y: 0, width: r(sw), height: r(sh), rx: 6, fill: '#fffdf6', stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: 0, y: 0, width: r(sw), height: 12, rx: 4, fill: th.accent3}),
    h('circle', {cx: r(sw / 2), cy: 26, r: 8, fill: '#e3e8e4', stroke: INK, 'stroke-width': 2}),
    show ? txt(G.slipFit, {x: sw / 2, y: 44, anchor: 'middle', fill: INK})
      : h('path', {d: `M18 ${r(sh * 0.6)}h${r(sw - 36)}`, stroke: '#cdbfa6', 'stroke-width': 9, 'stroke-linecap': 'round'}),
  );
  const tag = L.tags[i] ? g({name: `tag${i}-g`, opacity: 0}, L.tags[i].node) : null;
  return g({name: P}, parts, trayBack, change, slip, trayFront, cord, clip, carrier, tag);
}

export default defineAnimation({
  id: ID,
  version: '2.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-terms-05-contrast',
    title: 'Termination clause, without doctrine — two identical filing walls: a communication slip hangs on a section\'s hook (A) or settles in the tray (B), as supplied',
    titleEs: 'Cláusula de terminación — Comparación de dos supuestos',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical filing walls (side by side on wide boxes, stacked on tall ones), each with the contract plate, an overhead rail whose carrier holds the slip "Communication 1 (supplied)", the supplied sections as plates with a closed slot at their right end, and a tray. The one changed fact appears at the same slot: in A ("Case provided for (as supplied)") a hook swings out; in B ("Case not described (as supplied)") a flush cover slides over it. Both carriers then run identically and lower their slips for the same time: in A the slip hangs on the hook beside the supplied section, in B it settles in the tray. A guide outlines the same slot in both walls ("Only this differs: the supplied case") and a neutral note reads "Same communication and clause · as supplied · no conclusion drawn". No termination doctrine, no winner, no outcome.',
    tags: ['termination clause', 'section', 'communication', 'slip', 'filing wall', 'rail', 'hook', 'tray', 'contract', 'paired', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/terminacion-comunicaciones.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
