/**
 * LAW-0106 — Razonamiento circular · mechanism
 *
 * Storyboard (a perforated mechanism board; the parts are the same cards as
 * in the story, now mounted as separate components):
 *  0.00–0.18 separate  The five parts — claim (attributed to the fictional
 *                      speaker), premise, external premise, outside support
 *                      (archive box standing on its own base plate) and the
 *                      rule card — start packed into one tight cluster and
 *                      slide apart to their exploded positions.
 *  0.18–0.43 relate    Only the SUPPLIED relationships are drawn, one after
 *                      the other, each anchored to the real edges of its two
 *                      parts. Kind sets the style: plain relation = line with
 *                      end dots (no arrowhead), sequence = arrow, dashed arrow
 *                      = communication, heavy arrow = causal (only when the
 *                      author supplies it). Any directed cycle in the supplied
 *                      links (by default premise → claim → premise) is found
 *                      from the data; its links are drawn in the loop colour
 *                      and bend into a ring, and a loop badge appears.
 *  0.43–0.75 trace     A small magnifier (the tracking marker) travels along
 *                      the links in the supplied traversal order — round the
 *                      ring and back to the premise, then out along the chain
 *                      to the external premise and down to the outside
 *                      support. The focus part is enlarged while the marker is
 *                      on it; its links stay attached to its enlarged edges.
 *  0.75–1.00 gather    The parts slide back towards each other (links stay
 *                      attached), keeping origin, links and states visible:
 *                      key of link kinds, "structure as supplied · no
 *                      conclusion drawn", issue note and assumptions.
 * The scene never labels the argument as valid or invalid and never shows an
 * outcome; a relation is never drawn as causation unless supplied.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/reasoning/LAW-0106
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, cubic, polyline, roundRectPath, dist} from '../../core/geometry.js';
import {str, list, party, mechanismFields} from '../../schemas/fields.js';
import {
  RC_STRINGS, RC_DEFAULTS, claimField, rulesField, issuesField, assumptionsField, supportLabelField,
  rcColors, px1080, measureCard, cardArt, measureBox, boxArt, lupaArt, tagChip, measureKey, keyArt, loopGlyph,
  noteArt, noteSize, footArt, speakerLook, attributionText, INK,
} from './kits/razonamiento-circular.js';

const ID = 'LAW-0106';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {explode: [0.02, 0.165], links: [0.19, 0.42], badge: [0.4, 0.44], trace: [0.45, 0.74], gather: [0.755, 0.83], key: [0.77, 0.81], tag: [0.78, 0.82], issue: [0.79, 0.83], foot: [0.8, 0.84]};
const IDS = ['claim', 'premise', 'external', 'support', 'rule'];
const M = 12;
const FOCUS_K = 1.16;

const STRINGS = {
  en: {...RC_STRINGS.en, ruleKind: 'Rule', structure: 'Structure of support as supplied · no conclusion drawn', cycle: 'Links form a cycle (as supplied)'},
  es: {...RC_STRINGS.es, ruleKind: 'Regla', structure: 'Estructura de apoyo según lo aportado · sin conclusión', cycle: 'Los vínculos forman un ciclo (según lo aportado)'},
};

const sceneSchema = {
  speaker: party,
  claim: claimField,
  facts: list('Premises as supplied (fictional): [0] the premise offered for the claim; [1] the external premise', str('Premise', 110), 2, 2),
  supportLabel: supportLabelField,
  rules: rulesField,
  issues: issuesField,
  assumptions: assumptionsField,
  ...mechanismFields(IDS),
};

const defaultParams = {
  speaker: RC_DEFAULTS.speaker,
  claim: RC_DEFAULTS.claim,
  facts: [RC_DEFAULTS.premise, RC_DEFAULTS.external],
  supportLabel: RC_DEFAULTS.supportLabel,
  rules: RC_DEFAULTS.rules,
  issues: RC_DEFAULTS.issues,
  assumptions: RC_DEFAULTS.assumptions,
  elements: [
    {id: 'claim', label: 'Claim'},
    {id: 'premise', label: 'Premise'},
    {id: 'external', label: 'External premise'},
    {id: 'support', label: 'Outside support'},
    {id: 'rule', label: 'Rule'},
  ],
  relationships: [
    {from: 'premise', to: 'claim', kind: 'sequence'},
    {from: 'claim', to: 'premise', kind: 'sequence'},
    {from: 'external', to: 'claim', kind: 'sequence'},
    {from: 'support', to: 'external', kind: 'relation'},
    {from: 'rule', to: 'claim', kind: 'relation'},
  ],
  focusElement: 'premise',
  relationLabels: {relation: 'related · rests on (as supplied)', communication: 'communicated (as supplied)', sequence: 'offered as support (as supplied)', causal: 'causal (as supplied)'},
  traversalOrder: ['premise', 'claim', 'premise', 'claim', 'external', 'support'],
};

/** Grid cells [column, row] of the exploded arrangement per layout shape. */
const GRID = {
  landscape: {cols: 3, at: {premise: [0, 0], claim: [1, 0], external: [2, 0], rule: [1, 1], support: [2, 1]}},
  square: {cols: 2, at: {premise: [0, 0], claim: [1, 0], rule: [0, 1], external: [1, 1], support: [1, 2]}},
  portrait: {cols: 2, at: {premise: [0, 0], claim: [1, 0], rule: [0, 1], external: [1, 1], support: [1, 2]}},
};

const STYLE = {
  relation: {width: 5, arrow: false, dots: true, dash: null},
  sequence: {width: 6.5, arrow: true, dots: false, dash: null},
  communication: {width: 6, arrow: true, dots: false, dash: '14 10'},
  causal: {width: 9, arrow: true, dots: false, dash: null},
};

/**
 * Grid cells for the supplied relationships: every assignment of the five parts to the grid's cells (the one free
 * cell, which holds the notes in cell mode, in the last row) is scored on its straight links — length, diagonals,
 * links passing over another part's cell, crossings — and the best kept (ties: closest to the default grid). So
 * each supplied structure gets short, uncrossed, traceable links (AUTHORING items 5, 16).
 */
const GRID_CACHE = new Map();
function gridFor(shape, rels) {
  const ck = `${shape}|${JSON.stringify(rels.map(q => [q.from, q.to]))}`;
  if (GRID_CACHE.has(ck)) return GRID_CACHE.get(ck);
  const base = GRID[shape];
  const cols = base.cols, rows = Math.ceil((IDS.length + 1) / cols);
  const cells = [];
  for (let rw = 0; rw < rows; rw++) for (let cl = 0; cl < cols; cl++) cells.push([cl, rw]);
  const pairs = [];
  for (const rl of rels) {
    const key = [rl.from, rl.to].sort().join('|');
    if (!pairs.some(q => q.key === key)) pairs.push({key, a: rl.from, b: rl.to, twin: rels.some(q => q.from === rl.to && q.to === rl.from)});
  }
  const cross = (p1, p2, p3, p4) => {
    const d = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  };
  const score = at => {
    let sc = 0;
    const segs = pairs.map(q => [at[q.a], at[q.b], q]);
    for (const [a, b, q] of segs) {
      const dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]);
      sc += dx + dy + (dx && dy ? 1.5 : 0);
      // a straight run over another part's cell
      for (const id of IDS) {
        if (id === q.a || id === q.b) continue;
        const c = at[id];
        const t = ((c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1);
        if (t > 0 && t < 1 && Math.hypot(a[0] + (b[0] - a[0]) * t - c[0], a[1] + (b[1] - a[1]) * t - c[1]) < 0.45) sc += 6;
      }
      if (q.twin && !(dy === 0 && dx === 1)) sc += 3;
      if (q.twin && a[1] !== 0) sc += 3;
    }
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) if (cross(segs[i][0], segs[i][1], segs[j][0], segs[j][1])) sc += 5;
    for (const id of IDS) if (at[id][0] !== base.at[id][0] || at[id][1] !== base.at[id][1]) sc += 0.01;
    return sc;
  };
  let best = null;
  const used = new Set();
  const at = {};
  const rec = i => {
    if (i === IDS.length) {
      const free = cells.filter(c => !used.has(`${c[0]},${c[1]}`));
      if (free.some(c => c[1] !== rows - 1)) return;
      const sc = score(at);
      if (!best || sc < best.sc - 1e-9) best = {sc, at: {...at}};
      return;
    }
    for (const c of cells) {
      const key = `${c[0]},${c[1]}`;
      if (used.has(key)) continue;
      used.add(key); at[IDS[i]] = c;
      rec(i + 1);
      used.delete(key);
    }
  };
  rec(0);
  const out = {cols, at: best.at, score: best.sc};
  GRID_CACHE.set(ck, out);
  return out;
}

function kindColor(C, kind, inCycle) {
  if (inCycle) return C.loop;
  return kind === 'communication' ? C.claim : kind === 'causal' ? '#9c4f4f' : kind === 'sequence' ? C.chain : '#6b7680';
}

/** Directed cycles among arrow-kind links (relation links are undirected, never part of a support cycle). */
function cycleLinks(rels) {
  const out = new Set();
  const dir = rels.map((rl, i) => ({...rl, i})).filter(rl => rl.kind !== 'relation' && rl.from !== rl.to);
  // an edge is on a cycle when its target can reach its source
  const reach = (a, b) => {
    const seen = new Set([a]);
    const stack = [a];
    while (stack.length) {
      const x = stack.pop();
      if (x === b) return true;
      for (const e of dir) if (e.from === x && !seen.has(e.to)) { seen.add(e.to); stack.push(e.to); }
    }
    return false;
  };
  for (const e of dir) if (reach(e.to, e.from)) out.add(e.i);
  return out;
}

function sizes(ctx, s) {
  const k = px1080(ctx);
  return {k, s, ks: Math.min(s, Math.max(16.5 / k, s * 0.66)), as: Math.min(s, Math.max(20 / k, s * 0.82)), cs: Math.min(s, Math.max(20 / k, s * 0.8))};
}

function flow(items, x0, width, gap, rowGap) {
  const out = [];
  let x = x0, y = 0, rowH = 0;
  for (const it of items) {
    if (x > x0 && x + it.w > x0 + width) { x = x0; y += rowH + rowGap; rowH = 0; }
    out.push({x, y});
    x += it.w + gap;
    rowH = Math.max(rowH, it.h);
  }
  return {pos: out, h: items.length ? y + rowH : 0};
}

function compose(ctx, s0, mode = 'cell') {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = sizes(ctx, s0);
  const {s, ks, as, cs} = S;
  const show = ctx.show('key');
  const all = ctx.show('all');
  const C = rcColors(ctx);
  const stage = {x: M, y: M, w: D.w - 2 * M, h: D.h - 2 * M};
  const shape = ctx.view.shape;
  const rels = p.relationships.filter(rl => rl.from !== rl.to && IDS.includes(rl.from) && IDS.includes(rl.to));
  const cyc = cycleLinks(rels);
  const labelOf = id => (p.elements.find(e => e.id === id) || {}).label || {claim: t.claimKind, premise: t.premiseKind, external: t.externalKind, support: t.supportKind, rule: t.ruleKind}[id];

  // ---- editorial items: in the grid's free cell ('cell') or, when they do not fit there, in a bottom band
  const G00 = gridFor(shape, rels);
  const sideW = clamp(stage.w * (shape === 'square' ? 0.3 : 0.25), 340, 560);
  // 'split' (wide boxes): the key sits in the grid's free cell, the other notes in the column at the right
  const partsW = mode === 'side' || mode === 'split' ? stage.w - 40 - sideW - 34 : stage.w - 40;
  const gx0 = Math.max(130, partsW * 0.08);
  const cellW = (partsW - (G00.cols - 1) * gx0) / G00.cols;
  const bandW = mode === 'cell' ? cellW : mode === 'side' || mode === 'split' ? sideW : stage.w - 40;
  const wide = mode === 'band' && shape === 'landscape';
  const items = [];
  let key = null;
  if (show) {
    const kinds = [...new Set(rels.map(rl => rl.kind))];
    const rows = kinds.map(kd => ({kind: kd, text: p.relationLabels[kd] || t[kd] || kd, glyph: (x, y, u) => kindSample(kd, x, y, u, kindColor(C, kd, false))}));
    if (cyc.size) rows.push({text: `${t.loopKey} — ${t.cycle}`, glyph: (x, y, u) => loopGlyph(x, y, u, C.loop)});
    // one small key panel per link kind (and one for the cycle), flowed across the band
    key = rows.map((rw, i) => {
      const K = measureKey(ctx, [rw], wide ? bandW * 0.3 : (mode === 'split' ? cellW : bandW) - cs * 1.2, cs);
      items.push({id: `key${i}`, w: K.w + cs * 1.2, h: K.h + cs * 1.2});
      return K;
    });
    const tagProbe = tagChip(ctx, t.structure, {x: 0, y: 0, size: cs, maxWidth: wide ? bandW * 0.3 : bandW});
    items.push({id: 'tag', w: tagProbe.box.w, h: tagProbe.box.h});
    const footText = p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ${t.noConclusion}` : t.noConclusion;
    const fp = footArt(ctx, {name: 'probe', text: footText, x: 0, y: 0, size: cs, maxWidth: wide ? bandW * 0.36 : bandW});
    items.push({id: 'foot', w: fp.box.w, h: fp.box.h, text: footText, mw: wide ? bandW * 0.36 : bandW});
  }
  if (all && p.issues.length) {
    const text = `${t.issue}: ${p.issues[0]}`;
    const mw = wide ? bandW * 0.34 : bandW;
    const sz = noteSize(ctx, text, mw, cs, 5);
    items.push({id: 'issue', w: sz.w, h: sz.h, text, mw});
  }
  const band = mode === 'band' ? flow(items, stage.x + 20, bandW, 22, 14) : {pos: [], h: 0};
  const bandH = band.h ? band.h + 26 : 12;

  // ---- parts area and component sizes
  const ringTop = Math.max(130, partsW * 0.08) * 0.42; // the premise ⇄ claim ring bulges above the top row
  const area = {x: stage.x + 20, y: stage.y + 20 + ringTop, w: partsW, h: stage.h - bandH - 36 - ringTop};
  const G0 = G00;
  const cw = clamp(Math.min((area.w - (G0.cols - 1) * Math.max(130, area.w * 0.08)) / G0.cols * 0.98, mode === 'band' ? Infinity : s * 15), 200, 560);
  const look = speakerLook(ctx, p.speaker);
  const floor = 16.3 / S.k;
  const meas = {
    claim: measureCard(ctx, {w: cw, s, ks, as, kind: labelOf('claim'), body: p.claim, attribution: attributionText(t, p.speaker), show, floor}),
    premise: measureCard(ctx, {w: cw, s, ks, as, kind: labelOf('premise'), body: p.facts[0], attribution: null, show, floor}),
    external: measureCard(ctx, {w: cw, s, ks, as, kind: labelOf('external'), body: p.facts[1], attribution: null, show, floor}),
    rule: measureCard(ctx, {w: cw * 1.08, s: cs, ks, as, kind: labelOf('rule'), body: p.rules[0] || t.ruleHead, attribution: null, show, floor}),
    support: measureBox(ctx, {w: cw * 0.95, s: cs, ks, label: p.supportLabel, kind: labelOf('support'), show, floor, minH: cw * 0.34}),
  };
  for (const id of ['claim', 'premise', 'external', 'rule']) meas[id] = {...meas[id], h: Math.max(meas[id].h, meas[id].w * 0.4)};
  const baseH = Math.max(cs * 1.1, 26); // the support's own base plate
  const dims = Object.fromEntries(IDS.map(id => [id, {w: meas[id].w, h: meas[id].h + (id === 'support' ? baseH : 0)}]));
  // exploded arrangement: a grid of cells (3 × 2 in wide/square boxes, 2 × 3 in tall ones)
  const G = G00;
  const gx = Math.max(130, area.w * 0.08);
  const colW = (area.w - (G.cols - 1) * gx) / G.cols;
  const rowH = [];
  for (const id of IDS) { const [, rw] = G.at[id]; rowH[rw] = Math.max(rowH[rw] ?? 0, dims[id].h); }
  // cell mode: the free cell (last row) must hold the editorial items
  const usedCells = new Set(Object.values(G.at).map(([cl, rw]) => `${cl},${rw}`));
  let freeCell = null;
  for (let rw = rowH.length - 1; rw >= 0 && !freeCell; rw--) for (let cl = 0; cl < G.cols && !freeCell; cl++) if (!usedCells.has(`${cl},${rw}`)) freeCell = [cl, rw];
  // rows spread over the board height (longer links), within bounds
  const sumRows = rowH.reduce((a, b) => a + b, 0);
  const spare = (area.h - sumRows) / Math.max(1, rowH.length - 1);
  let gy = clamp(spare, Math.min(Math.max(92, s * 3.3), Math.max(46, spare)), area.h * 0.3);
  const totalH = rowH.reduce((a, b) => a + b, 0) + (rowH.length - 1) * gy;
  // (cell mode keeps the grid at the top so the free cell below gets the spare height)
  const y0 = area.y + Math.max(0, (area.h - totalH) / 2);
  const rowY = [];
  rowH.forEach((hh, i) => { rowY[i] = (i ? rowY[i - 1] + rowH[i - 1] + gy : y0); });
  const exploded = {};
  for (const id of IDS) {
    const [cl, rw] = G.at[id];
    const cx = area.x + cl * (colW + gx) + colW / 2;
    // cards hang from the top of their row; the support stands on the bottom of its row
    const cy = id === 'support' ? rowY[rw] + rowH[rw] - dims[id].h / 2 : rowY[rw] + dims[id].h / 2;
    exploded[id] = {x: cx, y: cy};
  }
  const fits = totalH <= area.h + 0.5;
  // free grid cell: the editorial items stand in its column, from below the part above it to the board's bottom
  const freeRegion = fc => {
    const top = fc[1] > 0 ? rowY[fc[1] - 1] + rowH[fc[1] - 1] + 24 : area.y;
    return {y: top, h: stage.y + stage.h - 14 - top};
  };
  let cellPos = null;
  if (mode === 'side') {
    // editorial column at the right of the parts, vertically centred
    const fx = area.x + area.w + 34;
    const need = items.reduce((a, it) => a + it.h, 0) + Math.max(0, items.length - 1) * 14;
    if (need <= area.h && Math.max(0, ...items.map(it => it.w)) <= sideW + 1) {
      let y = area.y + (area.h - need) / 2;
      cellPos = items.map(it => { const q = {x: fx, y}; y += it.h + 14; return q; });
    }
  }
  if (mode === 'split' && freeCell) {
    const fx = area.x + area.w + 34;
    const keys = items.map((it, i) => [it, i]).filter(([it]) => it.id.startsWith('key'));
    const rest = items.map((it, i) => [it, i]).filter(([it]) => !it.id.startsWith('key'));
    const need = rest.reduce((a, [it]) => a + it.h, 0) + Math.max(0, rest.length - 1) * 14;
    const kx = area.x + freeCell[0] * (colW + gx);
    const reg = freeRegion(freeCell);
    const kneed = keys.reduce((a, [it]) => a + it.h, 0) + Math.max(0, keys.length - 1) * 12;
    if (need <= area.h && Math.max(0, ...rest.map(([it]) => it.w)) <= sideW + 1 && kneed <= reg.h && Math.max(0, ...keys.map(([it]) => it.w)) <= colW + 1) {
      cellPos = [];
      let y = area.y + (area.h - need) / 2;
      for (const [it, i] of rest) { cellPos[i] = {x: fx, y}; y += it.h + 14; }
      // the key stands in the free cell's column, centred on the bottom-row parts where it fits
      let yk = clamp(rowY[freeCell[1]] + (rowH[freeCell[1]] - kneed) / 2, reg.y, reg.y + reg.h - kneed);
      for (const [it, i] of keys) { cellPos[i] = {x: kx, y: yk}; yk += it.h + 12; }
    }
  }
  if (mode === 'cell') {
    const free = freeCell;
    if (free) {
      const fx = area.x + free[0] * (colW + gx);
      const reg = freeRegion(free);
      const fl = flow(items, fx, colW, 12, 12);
      // the notes stand in the free cell's column, centred on its row where they fit
      const fy = clamp(rowY[free[1]] + (rowH[free[1]] - fl.h) / 2, reg.y, reg.y + reg.h - fl.h);
      if (fl.h <= reg.h && Math.max(0, ...items.map(it => it.w)) <= colW + 1) cellPos = fl.pos.map(q => ({x: q.x, y: fy + q.y}));
    }
  }
  const minGap = boxesGap(dims, exploded);
  return {G: G00, S, stage, area, rels, cyc, meas, dims, exploded, band, bandH, items, key, look, labelOf, baseH, minGap, cw, shape, fits, mode, cellPos};
}

function boxAt(dims, id, c, k = 1) {
  const d = dims[id];
  return {x: c.x - (d.w * k) / 2, y: c.y - (d.h * k) / 2, w: d.w * k, h: d.h * k};
}

/** Smallest gap between any two part boxes (negative = overlap); the focus part counted enlarged. */
function boxesGap(dims, centres, focus = null, k = 1) {
  let m = Infinity;
  for (let i = 0; i < IDS.length; i++) {
    for (let j = i + 1; j < IDS.length; j++) {
      const a = boxAt(dims, IDS[i], centres[IDS[i]], IDS[i] === focus ? k : 1), b = boxAt(dims, IDS[j], centres[IDS[j]], IDS[j] === focus ? k : 1);
      const dx = Math.max(a.x - (b.x + b.w), b.x - (a.x + a.w));
      const dy = Math.max(a.y - (b.y + b.h), b.y - (a.y + a.h));
      m = Math.min(m, Math.max(dx, dy));
    }
  }
  return m;
}

/** Centres pulled toward their centroid by f (0 = exploded, 1 = at the centroid). */
function pulled(exploded, f) {
  const cx = IDS.reduce((a, id) => a + exploded[id].x, 0) / IDS.length;
  const cy = IDS.reduce((a, id) => a + exploded[id].y, 0) / IDS.length;
  return Object.fromEntries(IDS.map(id => [id, {x: lerp(exploded[id].x, cx, f), y: lerp(exploded[id].y, cy, f)}]));
}

/** Largest pull toward the centroid that keeps every gap ≥ gap. */
function maxPull(dims, exploded, gap, limit = 0.9) {
  let lo = 0, hi = limit;
  if (boxesGap(dims, pulled(exploded, 0)) < gap) return 0;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (boxesGap(dims, pulled(exploded, mid)) >= gap) lo = mid; else hi = mid;
  }
  return lo;
}

/** Sample of a link kind for the key. */
function kindSample(kind, x, y, u, color) {
  const st = STYLE[kind];
  const x0 = x - u * 0.55, x1 = x + u * 0.55;
  return g(null,
    h('path', {d: `M${r(x0)} ${r(y)}H${r(st.arrow ? x1 - u * 0.25 : x1)}`, stroke: color, 'stroke-width': Math.min(st.width, u * 0.2), 'stroke-dasharray': st.dash ? '6 5' : undefined, 'stroke-linecap': st.dash ? 'butt' : 'round'}),
    st.arrow ? h('path', {d: `M${r(x1)} ${r(y)}l${r(-u * 0.34)} ${r(-u * 0.2)}v${r(u * 0.4)}Z`, fill: color}) : null,
    st.dots ? h('circle', {cx: r(x0), cy: r(y), r: 4, fill: color}) : null,
    st.dots ? h('circle', {cx: r(x1), cy: r(y), r: 4, fill: color}) : null);
}

/** Geometry of link i between the current boxes of its parts. */
function linkPath(L, i, boxes, centres) {
  const rl = L.rels[i];
  const A = boxes[rl.from], B = boxes[rl.to];
  const ca = centres[rl.from], cb = centres[rl.to];
  const st = STYLE[rl.kind];
  const pad = st.dots ? 7 : 6;
  // a pair linked both ways bends into a ring (each link to its own side); others arc gently
  const twin = L.rels.findIndex((q, j) => j !== i && q.from === rl.to && q.to === rl.from);
  const bend = twin >= 0 ? 0.5 : (L.bends ? L.bends[i] : 0.12);
  // anchor on the edge facing the other part, shifted along the bend so ring links leave from different points
  const dx = cb.x - ca.x, dy = cb.y - ca.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const off = twin >= 0 ? 0.35 : 0;
  const ta = {x: cb.x + nx * len * off, y: cb.y + ny * len * off};
  const tb = {x: ca.x + nx * len * off, y: ca.y + ny * len * off};
  const padB = rl.kind === 'relation' ? pad : pad + 2;
  let a = edgeAnchor(A, ta, pad);
  let b = edgeAnchor(B, tb, padB);
  // ends that would share a spot on a part's edge are spread along that edge (distinct endpoints)
  const sh = L.endShift ? L.endShift[i] : null;
  if (sh) { a = shiftOnEdge(A, a, sh.a, pad); b = shiftOnEdge(B, b, sh.b, padB); }
  const ex = b.x - a.x, ey = b.y - a.y;
  const c1 = {x: a.x + ex * 0.3 + -ey * bend, y: a.y + ey * 0.3 + ex * bend};
  const c2 = {x: a.x + ex * 0.7 + -ey * bend, y: a.y + ey * 0.7 + ex * bend};
  const pts = [];
  for (let k = 0; k <= 48; k++) pts.push(cubic(a, c1, c2, b, k / 48));
  return {poly: polyline(pts), a, b, st};
}

/** Side of the (padded) box an anchor lies on: 'l' | 'r' | 't' | 'b'. */
function sideOf(box, q, pad) {
  const d = {l: Math.abs(q.x - (box.x - pad)), r: Math.abs(q.x - (box.x + box.w + pad)), t: Math.abs(q.y - (box.y - pad)), b: Math.abs(q.y - (box.y + box.h + pad))};
  return Object.keys(d).sort((m, n) => d[m] - d[n])[0];
}

/** Move an edge anchor along its side by `amount`, staying clear of the corners. */
function shiftOnEdge(box, q, amount, pad) {
  if (!amount) return q;
  const sd = sideOf(box, q, pad);
  if (sd === 'l' || sd === 'r') return {x: q.x, y: clamp(q.y + amount, box.y + 14, box.y + box.h - 14)};
  return {x: clamp(q.x + amount, box.x + 16, box.x + box.w - 16), y: q.y};
}

/** Shifts that keep the link ends on each side of each part at least `gap` apart. */
function endShifts(L, boxes, centres, gap) {
  L.endShift = null;
  const ends = [];
  L.rels.forEach((rl, i) => {
    const pa = linkPath(L, i, boxes, centres);
    const pad = STYLE[rl.kind].dots ? 7 : 6;
    ends.push({i, which: 'a', id: rl.from, q: pa.a, pad});
    ends.push({i, which: 'b', id: rl.to, q: pa.b, pad: rl.kind === 'relation' ? pad : pad + 2});
  });
  const out = L.rels.map(() => ({a: 0, b: 0}));
  const groups = {};
  for (const e of ends) {
    const sd = sideOf(boxes[e.id], e.q, e.pad);
    const key = `${e.id}|${sd}`;
    (groups[key] = groups[key] || []).push({...e, sd, v: sd === 'l' || sd === 'r' ? e.q.y : e.q.x});
  }
  for (const key of Object.keys(groups)) {
    const gp = groups[key].sort((m, n) => m.v - n.v || m.i - n.i);
    if (gp.length < 2) continue;
    const bx = boxes[gp[0].id];
    const vert = gp[0].sd === 'l' || gp[0].sd === 'r';
    const lo = vert ? bx.y + 14 : bx.x + 16, hi = vert ? bx.y + bx.h - 14 : bx.x + bx.w - 16;
    const g = Math.min(gap, (hi - lo) / Math.max(1, gp.length - 1));
    const pos = gp.map(e => e.v);
    for (let it = 0; it < 40; it++) {
      for (let j = 1; j < pos.length; j++) {
        const def = g - (pos[j] - pos[j - 1]);
        if (def > 0) { pos[j - 1] -= def / 2; pos[j] += def / 2; }
      }
      for (let j = 0; j < pos.length; j++) pos[j] = clamp(pos[j], lo, hi);
    }
    gp.forEach((e, j) => { out[e.i][e.which] = pos[j] - e.v; });
  }
  return out;
}

function finish(ctx, L) {
  const p = ctx.params;
  const t = ctx.t;
  const C = rcColors(ctx);
  const {S, stage} = L;
  // cluster (start) and gathered (end) arrangements
  L.fPack = maxPull(L.dims, L.exploded, 10);
  L.fGather = Math.min(L.fPack, maxPull(L.dims, L.exploded, Math.max(96, S.s * 3.4)));
  L.packed = pulled(L.exploded, L.fPack);
  L.gathered = pulled(L.exploded, L.fGather);
  // component art (local origin bottom-left) — the support stands on its own base plate
  const art = {
    claim: cardArt(ctx, {name: 'art-claim', m: L.meas.claim, kind: 'claim', color: C.claim, look: L.look, idKey: 'mc'}),
    premise: cardArt(ctx, {name: 'art-premise', m: L.meas.premise, kind: 'premise', color: C.premise, idKey: 'mp'}),
    external: cardArt(ctx, {name: 'art-external', m: L.meas.external, kind: 'external', color: C.external, idKey: 'me'}),
    rule: cardArt(ctx, {name: 'art-rule', m: L.meas.rule, kind: 'rule', color: C.rule, idKey: 'mr'}),
    support: g({name: 'art-support'},
      boxArt(ctx, {m: L.meas.support, named: true, name: 'box'}),
      h('path', {d: roundRectPath(-20, 0, L.meas.support.w + 40, L.baseH, 6), fill: ctx.theme.woodTop, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M-14 ${r(L.baseH * 0.55)}H${r(L.meas.support.w + 14)}`, stroke: ctx.theme.woodDark, 'stroke-width': 2, opacity: 0.6})),
  };
  L.art = art;
  // each link keeps one fixed bend, chosen once so that its curve clears every other part (no link runs
  // across a card it does not belong to); link ends sharing a spot on an edge are spread apart first
  L.bends = null;
  const boxesE = Object.fromEntries(IDS.map(id => [id, boxAt(L.dims, id, L.exploded[id])]));
  const boxesG = Object.fromEntries(IDS.map(id => [id, boxAt(L.dims, id, L.gathered[id])]));
  L.endShift = endShifts(L, boxesE, L.exploded, Math.max(56, S.s * 2));
  const bends = L.rels.map(() => 0.12);
  L.rels.forEach((rl, i) => {
    const others = IDS.filter(id => id !== rl.from && id !== rl.to);
    const clearFor = (bx, cs) => {
      L.bends = bends;
      const pa = linkPath(L, i, bx, cs);
      const st = L.stage;
      for (let k = 1; k < 40; k++) {
        const pt = pa.poly.at(k / 40);
        if (pt.x < st.x + 14 || pt.x > st.x + st.w - 14 || pt.y < st.y + 14 || pt.y > st.y + st.h - 14) return false;
      }
      if (others.some(id => {
        const q = bx[id];
        for (let k = 1; k < 40; k++) {
          const pt = pa.poly.at(k / 40);
          if (pt.x > q.x - 14 && pt.x < q.x + q.w + 14 && pt.y > q.y - 14 && pt.y < q.y + q.h + 14) return true;
        }
        return false;
      })) return false;
      // nor may it cross a link already placed (twins excepted: they form the ring together)
      for (let j = 0; j < i; j++) {
        if (L.rels[j].from === rl.to && L.rels[j].to === rl.from) continue;
        if (polysCross(pa.poly, linkPath(L, j, bx, cs).poly)) return false;
      }
      return true;
    };
    for (const b of [0.12, -0.12, 0.2, -0.2, 0.28, -0.28, 0.36, -0.36, 0.46, -0.46, 0.56, -0.56]) {
      bends[i] = b;
      if (clearFor(boxesE, L.exploded) && clearFor(boxesG, L.gathered)) break;
    }
  });
  L.bends = bends;
  // links: nodes whose path data are set per frame
  L.linkNodes = L.rels.map((rl, i) => {
    const col = kindColor(C, rl.kind, L.cyc.has(i));
    const st = STYLE[rl.kind];
    return g({name: `lk${i}`, opacity: 0},
      h('path', {name: `lk${i}-halo`, fill: 'none', stroke: '#fbf7ef', 'stroke-width': st.width + 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.9}),
      h('path', {name: `lk${i}-line`, fill: 'none', stroke: col, 'stroke-width': st.width, 'stroke-linecap': st.dash ? 'butt' : 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': st.dash || undefined}),
      st.arrow ? h('path', {name: `lk${i}-head`, d: `M0 0L${r(-st.width * 3.6)} ${r(-st.width * 1.9)}L${r(-st.width * 2.6)} 0L${r(-st.width * 3.6)} ${r(st.width * 1.9)}Z`, fill: col, stroke: '#fbf7ef', 'stroke-width': 2, opacity: 0}) : null,
      st.dots ? h('circle', {name: `lk${i}-dotA`, r: r(st.width * 1.4), fill: col, opacity: 0}) : null,
      st.dots ? h('circle', {name: `lk${i}-dotB`, r: r(st.width * 1.4), fill: col, opacity: 0}) : null);
  });
  // tracer: a small magnifier without an enlarged copy
  L.R = clamp(S.s * 1.05, 22, 36);
  L.tracer = lupaArt(ctx, {name: 'tracer', R: L.R, handle: L.R * 1.5, fill: 'rgba(255,255,255,0.35)'});
  // loop badge at the centre of the cycle's parts
  const cycIds = [...new Set([...L.cyc].flatMap(i => [L.rels[i].from, L.rels[i].to]))];
  L.cycIds = cycIds;
  L.badgeU = Math.max(18, S.s * 1.1);
  // ---- band (key, tag, foot, issue)
  const bandY = stage.y + stage.h - L.bandH + 6;
  const pos = Object.fromEntries(L.items.map((it, i) => [it.id, L.cellPos ? {x: L.cellPos[i].x, y: L.cellPos[i].y, it} : {x: L.band.pos[i].x, y: bandY + L.band.pos[i].y, it}]));
  L.keyCycle = L.cyc.size > 0;
  L.keyNodes = (L.key || []).map((K, i) => keyArt(ctx, `key${i}`, K, pos[`key${i}`].x + S.cs * 0.6, pos[`key${i}`].y + S.cs * 0.6));
  if (pos.tag) L.tag = tagChip(ctx, t.structure, {x: pos.tag.x, y: pos.tag.y, size: S.cs, maxWidth: pos.tag.it.w + 2, name: 'state-tag'});
  if (pos.foot) L.foot = footArt(ctx, {name: 'foot', text: pos.foot.it.text, x: pos.foot.x, y: pos.foot.y, size: S.cs, maxWidth: pos.foot.it.mw});
  if (pos.issue) L.issue = noteArt(ctx, {name: 'issue', text: pos.issue.it.text, x: pos.issue.x, y: pos.issue.y + 4, maxWidth: pos.issue.it.mw, size: S.cs, maxLines: 5});
  L.bandY = bandY;
  L.itemBoxes = [...(L.keyNodes || []).map(k => k.box), L.tag && L.tag.box, L.foot && L.foot.box, L.issue && L.issue.box].filter(Boolean);
  // route of the tracer (element ids) and focus
  L.order = p.traversalOrder.filter(id => IDS.includes(id));
  return L;
}

/** Centres of the parts at time u. */
function centresAt(L, u) {
  const e = ease.inOutCubic(seg(u, ...W.explode));
  const gth = ease.inOutCubic(seg(u, ...W.gather));
  const c = {};
  for (const id of IDS) {
    const a = L.packed[id], b = L.exploded[id], q = L.gathered[id];
    c[id] = gth > 0 ? {x: lerp(b.x, q.x, gth), y: lerp(b.y, q.y, gth)} : {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e)};
  }
  return c;
}

/** Points walking round `box` inflated by m, from the side facing a to the side facing b (shorter way). */
function aroundBox(box, a, b, m) {
  const x0 = box.x - m, y0 = box.y - m, w = box.w + 2 * m, hh = box.h + 2 * m;
  const per = 2 * (w + hh);
  const cx = x0 + w / 2, cy = y0 + hh / 2;
  const param = q => {
    const dx = q.x - cx || 1e-6, dy = q.y - cy;
    const k = Math.min((w / 2) / Math.abs(dx), (hh / 2) / Math.abs(dy || 1e-9));
    const px = cx + dx * k, py = cy + dy * k;
    if (Math.abs(py - y0) < 1e-6) return px - x0;
    if (Math.abs(px - (x0 + w)) < 1e-6) return w + (py - y0);
    if (Math.abs(py - (y0 + hh)) < 1e-6) return w + hh + (x0 + w - px);
    return 2 * w + hh + (y0 + hh - py);
  };
  const at = t => {
    t = ((t % per) + per) % per;
    if (t < w) return {x: x0 + t, y: y0};
    if (t < w + hh) return {x: x0 + w, y: y0 + t - w};
    if (t < 2 * w + hh) return {x: x0 + w - (t - w - hh), y: y0 + hh};
    return {x: x0, y: y0 + hh - (t - 2 * w - hh)};
  };
  const ta = param(a), tb = param(b);
  let d = tb - ta;
  if (d > per / 2) d -= per;
  if (d < -per / 2) d += per;
  if (Math.abs(d) < 1) return [];
  const n = Math.max(2, Math.ceil(Math.abs(d) / 24));
  const out = [];
  for (let k = 0; k <= n; k++) out.push(at(ta + (d * k) / n));
  return out;
}

/** Tracer route (polyline) along the supplied order using the links at their current geometry. */
function routeAt(L, paths, centres, boxes) {
  const pts = [];
  const visits = [];
  const push = q => pts.push({x: q.x, y: q.y});
  for (let i = 0; i < L.order.length; i++) {
    const id = L.order[i];
    if (i === 0) {
      const first = L.order[1];
      const li = first ? L.rels.findIndex(q => (q.from === id && q.to === first) || (q.to === id && q.from === first)) : -1;
      const start = li >= 0 ? (L.rels[li].from === id ? paths[li].a : paths[li].b) : centres[id];
      push(start);
      visits.push({id, idx: 0});
      continue;
    }
    const prev = L.order[i - 1];
    const li = L.rels.findIndex(q => (q.from === prev && q.to === id) || (q.to === prev && q.from === id));
    if (li >= 0) {
      const fw = L.rels[li].from === prev;
      const P = paths[li].poly;
      const start = fw ? paths[li].a : paths[li].b;
      // from where the previous link arrived to where this one leaves: round the part, not across it
      if (pts.length) for (const q of aroundBox(boxes[prev], pts[pts.length - 1], start, L.R + 8)) push(q);
      push(start);
      for (let k = 1; k <= 30; k++) push(P.at(fw ? k / 30 : 1 - k / 30));
    } else {
      push(edgeAnchor(boxes[prev], centres[id], 6));
      push(edgeAnchor(boxes[id], centres[prev], 6));
    }
    visits.push({id, idx: pts.length - 1});
  }
  const poly = polyline(pts.length > 1 ? pts : [pts[0], pts[0]]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  return {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
}

/** Focus scale: the focus part swells while the tracer passes it for the first time. */
function focusScale(L, u, visits) {
  const v = visits.find((q, i) => i > 0 && q.id === L.focus) || visits.find(q => q.id === L.focus);
  if (!v) return {k: 1, uf: null};
  const uf = W.trace[0] + (W.trace[1] - W.trace[0]) * v.t;
  const up = ease.inOutSine(seg(u, uf - 0.05, uf));
  const down = ease.inOutSine(seg(u, uf + 0.06, uf + 0.12));
  return {k: 1 + (FOCUS_K - 1) * up * (1 - down), uf};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1500]},
  layout(ctx) {
    const k = px1080(ctx);
    const run = mode => {
      let s = (ctx.view.shape === 'landscape' ? 30 : 28) / k;
      let L;
      for (let it = 0; it < 16; it++) {
        L = compose(ctx, s, mode);
        const enlargedOk = boxesGap(L.dims, L.exploded, ctx.params.focusElement, FOCUS_K) > 36;
        if ((L.fits && L.minGap > 80 && enlargedOk && (mode === 'band' || L.cellPos)) || s * k <= 16.6) break;
        s = Math.max(16.5 / k, s * 0.95);
      }
      return L;
    };
    // editorial items in the grid's free cell when they fit there at >= 20 px, else in a bottom band
    // (wide and tall boxes: the notes fill the grid's free cell, so no quarter of the board stays empty)
    const order = ctx.view.shape === 'portrait' ? ['cell'] : ctx.view.shape === 'square' ? ['side', 'cell'] : ['cell', 'split', 'side'];
    let L = null;
    for (const m of order) {
      const c = run(m);
      if (c.cellPos && c.fits && (!L || c.S.s > L.S.s)) L = c;
      if (L && L.S.s * k >= 20) break;
    }
    if (!L) L = run('band');
    L.focus = ctx.params.focusElement;
    return finish(ctx, L);
  },
  build(ctx, L) {
    const C = rcColors(ctx);
    const {stage} = L;
    // perforated mechanism board
    const holes = [];
    const step = Math.max(34, L.S.s * 1.4);
    for (let y = stage.y + step / 2; y < stage.y + stage.h; y += step) {
      for (let x = stage.x + step / 2; x < stage.x + stage.w; x += step) holes.push(`M${r(x - 2.6)} ${r(y)}a2.6 2.6 0 1 0 5.2 0a2.6 2.6 0 1 0 -5.2 0`);
    }
    const clipId = 'board-clip';
    return g(null,
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(stage.x, stage.y, stage.w, stage.h, 24)}))),
      h('path', {d: roundRectPath(stage.x, stage.y, stage.w, stage.h, 24), fill: '#e7dcc6'}),
      g({'clip-path': ctx.ref(clipId)},
        h('path', {d: holes.join(''), fill: '#c9bba0'}),
        L.mode === 'band' ? h('rect', {x: stage.x, y: r(L.bandY - 8), width: stage.w, height: r(stage.y + stage.h - L.bandY + 8), fill: '#dccfb5'}) : null,
        g({name: 'parts'}, IDS.map(id => g({name: `part-${id}`}, L.art[id]))),
        L.linkNodes,
        L.cycIds.length ? g({name: 'badge', opacity: 0},
          h('circle', {r: r(L.badgeU * 1.25), fill: '#fbf8f1', stroke: C.loop, 'stroke-width': 3}),
          loopGlyph(0, -L.badgeU * 0.12, L.badgeU * 1.5, C.loop)) : null,
        L.tracer.view,
        L.tracer.prop,
      ),
      h('path', {d: roundRectPath(stage.x, stage.y, stage.w, stage.h, 24), fill: 'none', stroke: INK, 'stroke-width': 3}),
      (L.keyNodes || []).map(k => k.node),
      L.tag && L.tag.node,
      L.foot && L.foot.node,
      L.issue && L.issue.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    // --- first pass: centres (exploded / gathered), provisional boxes for the tracer route
    const centres = centresAt(L, u);
    const box0 = Object.fromEntries(IDS.map(id => [id, boxAt(L.dims, id, centres[id])]));
    const paths0 = L.rels.map((_, i) => linkPath(L, i, box0, centres));
    const route0 = routeAt(L, paths0, centres, box0);
    const fs = focusScale(L, u, route0.visits);
    // the enlarged focus part stays inside the board (it is nudged in while it swells)
    if (fs.k > 1) {
      const b = boxAt(L.dims, L.focus, centres[L.focus], fs.k), st = L.stage, m = 12;
      const dx = b.x < st.x + m ? st.x + m - b.x : b.x + b.w > st.x + st.w - m ? st.x + st.w - m - (b.x + b.w) : 0;
      const dy = b.y < st.y + m ? st.y + m - b.y : b.y + b.h > st.y + st.h - m ? st.y + st.h - m - (b.y + b.h) : 0;
      centres[L.focus] = {x: centres[L.focus].x + dx, y: centres[L.focus].y + dy};
    }
    const boxes = Object.fromEntries(IDS.map(id => [id, boxAt(L.dims, id, centres[id], id === L.focus ? fs.k : 1)]));
    for (const id of IDS) {
      const d = L.dims[id];
      const k = id === L.focus ? fs.k : 1;
      const lift = id === 'support' ? L.baseH : 0;
      nodes[`part-${id}`] = {transform: `${T(centres[id].x, centres[id].y, 0, k)} translate(${r(-d.w / 2)} ${r(d.h / 2 - lift)})`};
    }
    // --- links, drawn one after the other in the supplied order
    const n = L.rels.length;
    const each = (W.links[1] - W.links[0]) / Math.max(1, n);
    const drawn = [];
    const paths = L.rels.map((_, i) => linkPath(L, i, boxes, centres));
    const ends = [];
    paths.forEach((pa, i) => {
      const q = ease.inOutSine(seg(u, W.links[0] + i * each, W.links[0] + (i + 0.92) * each));
      drawn.push(r(q, 3));
      const st = pa.st;
      const total = pa.poly.total;
      const head = st.arrow ? st.width * 3.6 * 0.62 : 0;
      const upto = Math.max(0, total * q - (q >= 0.999 ? head : 0));
      const pts = [];
      const N = 40;
      for (let k = 0; k <= N; k++) pts.push(pa.poly.at((upto / total) * (k / N)));
      const d = pts.map((pt, k) => `${k ? 'L' : 'M'}${r(pt.x)} ${r(pt.y)}`).join('');
      nodes[`lk${i}`] = {opacity: q > 0 ? 1 : 0};
      nodes[`lk${i}-halo`] = {d};
      nodes[`lk${i}-line`] = {d};
      const end = pa.poly.at(1), back = pa.poly.at(Math.max(0, 1 - 8 / total));
      if (st.arrow) nodes[`lk${i}-head`] = {opacity: q >= 0.999 ? 1 : 0, transform: T(end.x, end.y, Math.atan2(end.y - back.y, end.x - back.x) * 180 / Math.PI)};
      if (st.dots) {
        nodes[`lk${i}-dotA`] = {cx: r(pa.a.x), cy: r(pa.a.y), opacity: q > 0 ? 1 : 0};
        nodes[`lk${i}-dotB`] = {cx: r(pa.b.x), cy: r(pa.b.y), opacity: q >= 0.999 ? 1 : 0};
      }
      const rl = L.rels[i];
      ends.push(onEdge(pa.a, boxes[rl.from]) && onEdge(pa.b, boxes[rl.to]));
    });
    // --- loop badge (only when the supplied links contain a cycle), at the centre of its parts
    let badgeOn = 0;
    if (L.cycIds.length) {
      const cx = L.cycIds.reduce((a, id) => a + centres[id].x, 0) / L.cycIds.length;
      const cy = L.cycIds.reduce((a, id) => a + centres[id].y, 0) / L.cycIds.length;
      const lastCyc = Math.max(...[...L.cyc]);
      const done = seg(u, W.links[0] + (lastCyc + 0.92) * each, W.links[0] + (lastCyc + 0.92) * each + 0.03);
      badgeOn = done;
      nodes.badge = {opacity: r(done, 3), transform: T(cx, cy)};
    }
    // --- tracer (magnifier) along the supplied traversal order
    const route = routeAt(L, paths, centres, boxes);
    const tr = seg(u, ...W.trace);
    const vis = u >= W.trace[0] - 0.01 && u <= W.trace[1] + 0.012 ? Math.min(1, seg(u, W.trace[0] - 0.01, W.trace[0]) * 1) * (1 - seg(u, W.trace[1], W.trace[1] + 0.012)) : 0;
    // the magnifier travels along the links and waits beside each part, never over a card's text
    const tp = pushOut(route.poly.at(ease.inOutSine(tr)), IDS.map(id => boxes[id]), L.R + 8);
    const tf = L.tracer.frame(tp, 135, 0);
    Object.assign(nodes, tf.nodes);
    nodes.tracer.opacity = r(vis, 3);
    const visited = route.visits.filter(v => ease.inOutSine(tr) >= v.t - 1e-6 && vis > 0).map(v => v.id);
    // --- editorial layer
    // the key explains each link kind as the links are drawn, and the cycle when its badge appears
    const nk = (L.keyNodes || []).length;
    (L.keyNodes || []).forEach((k, i) => {
      const win = L.keyCycle && i === nk - 1 ? [W.badge[0], W.badge[1] + 0.02] : [W.links[0] + 0.02 * i, W.links[0] + 0.05 + 0.02 * i];
      nodes[`key${i}`] = {opacity: r(seg(u, ...win), 3)};
    });
    if (L.tag) nodes['state-tag'] = {opacity: r(seg(u, ...W.tag), 3)};
    if (L.issue) nodes.issue = {opacity: r(seg(u, ...W.issue), 3)};
    if (L.foot) nodes.foot = {opacity: r(seg(u, ...W.foot), 3)};

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      explode: r(ease.inOutCubic(seg(u, ...W.explode)), 3),
      gather: r(ease.inOutCubic(seg(u, ...W.gather)), 3),
      separated: r(boxesGap(L.dims, centres), 1),
      packedGap: r(boxesGap(L.dims, L.packed), 1),
      relationsDrawn: drawn,
      linkKinds: L.rels.map(rl => rl.kind),
      arrowheads: L.rels.map(rl => STYLE[rl.kind].arrow),
      causalCount: L.rels.filter(rl => rl.kind === 'causal').length,
      linkEnds: ends,
      linkLengths: paths.map(pa => r(pa.poly.total, 1)),
      linksClear: paths.every((pa, i) => IDS.filter(id => id !== L.rels[i].from && id !== L.rels[i].to).every(id => {
        const q = boxes[id];
        for (let k = 1; k < 30; k++) { const pt = pa.poly.at(k / 30); if (pt.x > q.x && pt.x < q.x + q.w && pt.y > q.y && pt.y < q.y + q.h) return false; }
        return true;
      })),
      // every pair of link ends on the same part is apart (no arrowhead lands where another link starts)
      linkEndGap: r(Math.min(Infinity, ...L.rels.flatMap((rl, i) => L.rels.flatMap((q, j) => j <= i ? [] : [
        rl.from === q.from ? dist(paths[i].a, paths[j].a) : Infinity, rl.from === q.to ? dist(paths[i].a, paths[j].b) : Infinity,
        rl.to === q.from ? dist(paths[i].b, paths[j].a) : Infinity, rl.to === q.to ? dist(paths[i].b, paths[j].b) : Infinity]))), 1),
      // clearance of every link from the parts it does not join, and link crossings (ring twins excepted)
      linkClearance: r(Math.min(Infinity, ...paths.flatMap((pa, i) => IDS.filter(id => id !== L.rels[i].from && id !== L.rels[i].to).map(id => {
        const q = boxes[id];
        let m = Infinity;
        for (let k = 0; k <= 40; k++) { const pt = pa.poly.at(k / 40); m = Math.min(m, Math.max(q.x - pt.x, pt.x - q.x - q.w, q.y - pt.y, pt.y - q.y - q.h)); }
        return m;
      }))), 1),
      linkCrossings: paths.reduce((n, pa, i) => n + paths.filter((qa, j) => j > i && !(L.rels[j].from === L.rels[i].to && L.rels[j].to === L.rels[i].from) && polysCross(pa.poly, qa.poly)).length, 0),
      glassClear: !(vis > 0) || IDS.every(id => { const q = boxes[id]; const dx = Math.max(q.x - tp.x, 0, tp.x - q.x - q.w), dy = Math.max(q.y - tp.y, 0, tp.y - q.y - q.h); return Math.hypot(dx, dy) >= L.R; }),
      focusInStage: (() => { const q = boxes[L.focus]; return q.x >= L.stage.x + 11 && q.y >= L.stage.y + 11 && q.x + q.w <= L.stage.x + L.stage.w - 11 && q.y + q.h <= L.stage.y + L.stage.h - 11; })(),
      cycleLinks: [...L.cyc].sort((a, b) => a - b),
      cycleParts: L.cycIds,
      badge: r(badgeOn, 3),
      tracerVisible: vis > 0,
      tracer: P2(tp),
      visitOrder: route.visits.map(v => v.id),
      visited,
      focus: L.focus,
      focusScale: r(fs.k, 3),
      focusU: fs.uf === null ? null : r(fs.uf, 4),
      centres: Object.fromEntries(IDS.map(id => [id, P2(centres[id])])),
      overlaps: boxesGap(L.dims, centres, L.focus, fs.k) < 0,
      labelsClear: L.itemBoxes.every(b => IDS.every(id => { const q = boxes[id]; return b.x >= q.x + q.w || q.x >= b.x + b.w || b.y >= q.y + q.h || q.y >= b.y + b.h; })),
      // no link runs under a note of the key / tag / footnote / issue
      notesClearOfLinks: L.itemBoxes.every(b => paths.every(pa => { for (let k = 0; k <= 40; k++) { const pt = pa.poly.at(k / 40); if (pt.x > b.x - 6 && pt.x < b.x + b.w + 6 && pt.y > b.y - 6 && pt.y < b.y + b.h + 6) return false; } return true; })),
      layoutMode: L.mode,
      grid: L.G.at,
      textPx: {content: r(L.S.s * L.S.k, 2), caption: r(L.S.cs * L.S.k, 2), kind: r(L.S.ks * L.S.k, 2)},
    };
    return {nodes, semantic};
  },
};

/** True when two link polylines cross (sampled). */
function polysCross(P, Q, n = 40) {
  const pp = Array.from({length: n + 1}, (_, k) => P.at(k / n)), qq = Array.from({length: n + 1}, (_, k) => Q.at(k / n));
  const d = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (let i = 1; i < pp.length; i++) for (let j = 1; j < qq.length; j++) {
    const a = pp[i - 1], b = pp[i], c = qq[j - 1], e = qq[j];
    const d1 = d(c, e, a), d2 = d(c, e, b), d3 = d(a, b, c), d4 = d(a, b, e);
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  }
  return false;
}

/** Push a point out of every box inflated by `m` (radially from the box centre), a few passes. */
function pushOut(q, boxes, m) {
  let p = {x: q.x, y: q.y};
  for (let pass = 0; pass < 4; pass++) {
    for (const b of boxes) {
      const x0 = b.x - m, y0 = b.y - m, x1 = b.x + b.w + m, y1 = b.y + b.h + m;
      if (p.x <= x0 || p.x >= x1 || p.y <= y0 || p.y >= y1) continue;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const dx = p.x - cx || 1e-6, dy = p.y - cy;
      const k = Math.min((x1 - cx) / Math.abs(dx), (y1 - cy) / Math.abs(dy || 1e-9));
      p = {x: cx + dx * k * 1.0005, y: cy + dy * k * 1.0005};
    }
  }
  return p;
}

function onEdge(q, b) {
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
  const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  return Math.hypot(dx, dy) <= 10.5;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-07-mechanism',
    title: 'Circular reasoning — the support links of a claim, traced round a cycle and out to an outside support',
    titleEs: 'Razonamiento circular — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Razonamiento circular',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A perforated mechanism board: claim, premise, external premise, outside support (on its own base plate) and rule card separate from a tight cluster; only the supplied relationships are drawn, anchored to the parts’ edges and styled by kind (relation without arrowhead; causal only when supplied). A directed cycle in the supplied links is detected and bent into a ring with a loop badge. A magnifier marker follows the supplied traversal order while the focus part is enlarged; the parts then gather with every link attached. Nothing is judged valid or invalid.',
    tags: ['reasoning', 'circular reasoning', 'mechanism', 'relationships', 'cycle', 'claim', 'premise', 'support', 'tracer', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/razonamiento-circular.js', 'src/primitives/annotate.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
