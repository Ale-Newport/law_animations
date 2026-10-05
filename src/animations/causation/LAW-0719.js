/**
 * LAW-0719 — Distribución ilustrativa de pérdidas · contrast
 *
 * Storyboard (two complete stages of equal size and timing; only the
 * supplied values differ — by default ONE boundary):
 *  0.00–0.17 base      Two identical stages, A and B: the rail with its blades
 *                      parked, the whole bar on its shelf, the guide rails and
 *                      the same trays. Head chips "● A · Proposed allocation"
 *                      and "◆ B · Alternative allocation" (equal chips, same
 *                      colour). The event names both share are drawn ONCE.
 *  0.17–0.40 change    Each stage receives its own supplied values under its
 *                      trays (0.19–0.25); a value that differs from the other
 *                      stage gets a highlight ring (0.24–0.30) and the blades
 *                      slide to the boundaries the values give (0.26–0.36) —
 *                      only the blade on the changed boundary stands
 *                      elsewhere. The "Changed fact" chip names it.
 *  0.40–0.77 run       In parallel the same action runs on both: blades cut
 *                      (0.40–0.47), pieces spread (0.47–0.54) and run down into
 *                      their trays (0.55–0.74).
 *  0.77–1.00 guide     A solid guide joins the changed blade of A to the same
 *                      blade of B and carries "Only this differs: …" (0.77–
 *                      0.84); the neutral note "No winner, no conclusion" and the
 *                      key "As supplied · no conclusion drawn". Neither stage is
 *                      faded, ranked or decided; no red, no percentage.
 * Wide boxes: A and B side by side. Tall boxes: A above B.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0719
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {contrastFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  dpFields, DP_STRINGS, DP_DEFAULTS, DP_ES_DEFAULTS, resolveDP, linkNotes, altText, fmtV,
  stageGeom, stageArt, pieceArt, bladeArt, dropPos, valueChip, valueChipSize, arrangeScene, placePanel, fillDrop, DROP_CAP, sideMark,
  chipG, fitG, unwidow, glueN,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/distribucion-perdidas.js';

const ID = 'LAW-0719';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], run: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  heads: [0, 0.04], shared: [0, 0.05], vals: [0.19, 0.25], ring: [0.24, 0.3], changed: [0.24, 0.3], slide: [0.26, 0.36],
  cut: [0.4, 0.47], spread: [0.47, 0.54], drop: [0.55, 0.74], lift: [0.74, 0.77],
  line: [0.77, 0.81], guide: [0.79, 0.84], note: [0.82, 0.87], key: [0.84, 0.89],
};

const strings = {
  en: {...DP_STRINGS.en, shared: 'Same in A and B (as supplied)', changed: 'Changed fact', guide: 'Only this differs', neutral: 'No winner, no conclusion: two allocations side by side', boundary: 'boundary after event', values: 'values'},
  es: {...DP_STRINGS.es, shared: 'Igual en A y B (según lo aportado)', changed: 'Hecho que cambia', guide: 'Solo esto cambia', neutral: 'Sin ganador ni conclusión: dos asignaciones comparadas', boundary: 'límite tras el evento', values: 'valores'},
};

const sceneSchema = {
  ...dpFields,
  ...contrastFields(),
};

const defaultParams = {
  ...DP_DEFAULTS,
  scenarioA: {label: 'Proposed allocation', caption: 'as supplied'},
  scenarioB: {label: 'Alternative allocation', caption: 'as supplied'},
  changedFact: 'Only where the boundary between events 1 and 2 falls differs: after 40 in A, after 30 in B',
  sharedFacts: ['Same total, same events, same rails and trays'],
  comparisonLabels: {guide: 'Only this differs: the first boundary', neutral: 'No winner, no conclusion: two allocations side by side'},
};

const defaultParamsEs = {
  ...DP_ES_DEFAULTS,
  scenarioA: {label: 'Asignación propuesta', caption: 'según lo aportado'},
  scenarioB: {label: 'Asignación alternativa', caption: 'según lo aportado'},
  changedFact: 'Solo cambia dónde cae el límite entre los eventos 1 y 2: tras 40 en A, tras 30 en B',
  sharedFacts: ['Mismo total, mismos eventos, mismas guías y bandejas'],
  comparisonLabels: {guide: 'Solo esto cambia: el primer límite', neutral: 'Sin ganador ni conclusión: dos asignaciones comparadas'},
};

const SHAPES = {
  landscape: {sizes: [26, 16], arr: ['row'], modes: ['below', 'side'], sideWs: [0.24, 0.3, 0.36]},
  square: {sizes: [24, 16], arr: ['row', 'column'], modes: ['below', 'side'], sideWs: [0.3, 0.36, 0.42]},
  portrait: {sizes: [20, 16], arr: ['column'], modes: ['below'], sideWs: []},
};
const HEAD_GAP = 6, PAIR_GAP = 34;
// stacked stages leave room between them for the guide's chip (up to two lines)
const pairGap = size => Math.round(size * 2.5 + 18);
const GUIDE_MW = 520;

function panelItems(ctx, p, M) {
  const t = ctx.t;
  if (!ctx.show('key')) return [];
  const allOn = ctx.show('all');
  const out = [];
  out.push({key: 'bar', icon: 'bar', text: `${p.losses[0].label}: ${t.total}`, when: 'shared'});
  p.events.forEach((e, i) => out.push({key: `ev${i}`, icon: 'tray', i, text: e.label, when: 'shared'}));
  if (allOn) p.sharedFacts.forEach((s0, i) => out.push({key: `sf${i}`, icon: 'note', text: `${t.shared}: ${s0}`, when: 'shared'}));
  if (p.losses[1]) out.push({key: 'loss1', icon: 'note', text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'shared'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: altText(ctx, a), when: 'shared'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, when: 'shared'}));
  // the rows that appear late come first, so the chips shown from the first frame take the panel's last rows
  const late = [];
  if (p.changedFact) late.push({key: 'changed', icon: 'alloc', side: 'b', text: `${t.changed}: ${p.changedFact}`, when: 'changed'});
  late.push({key: 'note', icon: 'status', text: p.comparisonLabels.neutral || t.neutral, when: 'note'});
  late.push({key: 'key', text: t.key, when: 'key'});
  return [...late, ...out];
}

/** Head chip: solid ●/◆ cue (equal weight, same colour) + "A · label — caption". */
function headChip(ctx, side, label, caption, size, maxW, unit) {
  const th = ctx.theme;
  const R = size * 0.8;
  // (the values under the trays are bare numbers: the head names their unit, e.g. "values (hypothetical)")
  const text = ctx.show('key') ? glueN(`${side === 'a' ? 'A' : 'B'} · ${label} · ${ctx.t.values} (${unit})${caption && ctx.show('all') ? ` — ${caption}` : ''}`) : null;
  const fo = {maxWidth: maxW - 2 * R - 34, size, minSize: size, maxLines: 3, weight: 700};
  const fit = text ? fitG(ctx, unwidow(text, t0 => fitG(ctx, t0, fo)), fo) : null;
  const w = 2 * R + 30 + (fit ? fit.width : 0) + (fit ? 6 : 0);
  const hh = Math.max(2 * R + 12, fit ? fit.height + size * 0.7 : 0);
  return {
    w, h: hh, bad: fit ? fit.truncated || fit.broken : false,
    build(x, y, name) {
      return g({name, opacity: 0},
        h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.8)), fill: th.card, stroke: th.accent2, 'stroke-width': 2.5}),
        sideMark(ctx, {cx: x + R + 10, cy: y + hh / 2, s: R * 1.5, side}),
        fit ? textOf(fit, x + 2 * R + 24, y + (hh - fit.height) / 2, th.ink) : null);
    },
  };
}
const textOf = (fit, x, y, fill) => textBlock(fit, {x, y, fill});

/** Index of the first boundary whose position differs between A and B (or -1). */
function changedBoundary(M) {
  let a = 0, b = 0;
  for (let j = 0; j < M.n - 1; j++) {
    a += M.fA[j]; b += M.fB[j];
    if (Math.abs(a - b) > 1e-9) return j;
  }
  return -1;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveDP(p);
    const fmax = M.fA.map((q, i) => Math.max(q, M.fB[i]));
    const showVals = ctx.show('key');
    const tA = M.vA.map(fmtV), tB = M.vB.map(fmtV);
    const items = panelItems(ctx, p, M);
    const memo = new Map();
    const cbx = changedBoundary(M);
    const guideText = p.comparisonLabels.guide || ctx.t.guide;
    const bandMemo = new Map();
    const guideBand = size => {
      if (!bandMemo.has(size)) bandMemo.set(size, cbx < 0 ? 0 : ctx.show('key') ? chipG(ctx, glueN(guideText), {x: 0, y: 0, maxWidth: GUIDE_MW, size, maxLines: 3}).box.h + 16 : 18);
      return bandMemo.get(size);
    };
    const stMemo = new Map();
    const headMemo = new Map();
    const stage = size => {
      let st = stMemo.get(size);
      if (st) return st;
      const cs = showVals ? M.vA.map((_, i) => { const a = valueChipSize(ctx, tA[i], size, 360), b = valueChipSize(ctx, tB[i], size, 360); return {w: Math.max(a.w, b.w), h: Math.max(a.h, b.h), bad: a.bad || b.bad}; }) : [];
      const chipWs = cs.map(c => c.w), chipH = cs.length ? Math.max(...cs.map(c => c.h)) : 0;
      st = [];
      for (const arr of SH.arr) for (const compact of [false, true]) for (const stagger of [false, true]) {
        const go = {chipWs, chipH, compact, stagger: stagger && cs.length > 0};
        const dims0 = S => stageGeom(S, M.n, fmax, go);
        // head chips: measured once per size at a few widths (the narrowest that keeps them in two lines is used)
        const hk = `${size}`;
        if (!headMemo.has(hk)) headMemo.set(hk, [1400, 900, 700, 560, 440, 360].map(mw => [headChip(ctx, 'a', p.scenarioA.label, p.scenarioA.caption, size, mw, p.unit), headChip(ctx, 'b', p.scenarioB.label, p.scenarioB.caption, size, mw, p.unit)]));
        const head = S => { const G = dims0(S); const opts = headMemo.get(hk).filter(hc => hc.every(q => !q.bad && q.w <= G.W + 1)); return opts.length ? opts[0] : headMemo.get(hk)[headMemo.get(hk).length - 1]; };
        // (side by side: a band between the head chips and the rails holds the guide's top line and its chip)
        const band = arr === 'row' ? guideBand(size) : 0;
        const pairDims = (S, G) => {
          const hc = head(S);
          if (hc.some(q => q.bad || q.w > G.W + 1)) return {w: 1e9, h: 1e9};
          const hh = Math.max(hc[0].h, hc[1].h) + HEAD_GAP + band;
          return arr === 'row' ? {w: 2 * G.W + PAIR_GAP, h: G.H + hh} : {w: G.W, h: 2 * (G.H + hh) + pairGap(size)};
        };
        st.push({arr, go, bad: cs.some(c => c.bad), head, dimsMax: S => pairDims(S, stageGeom(S, M.n, fmax, {...go, drop: DROP_CAP})), dims: S => {
          return pairDims(S, dims0(S));
        }});
      }
      stMemo.set(size, st);
      return st;
    };
    let A = arrangeScene(ctx, {items, stage, modes: SH.modes, sizes: SH.sizes, sideWs: SH.sideWs, memo, sMax: 1200, areaSat: items.length ? 0.55 : 0.85, areaW: items.length ? 0.3 : 0.5});
    const problems = [];
    if (!A) {
      problems.push('no-layout-fits');
      A = {size: SH.sizes[1], mode: 'below', S: 100, pw: ctx.design.w - 20, panel: {placed: [], h: 0}, st: stage(SH.sizes[1])[0], bh: 0};
    }
    const go0 = A.st.go;
    const G0 = stageGeom(A.S, M.n, fmax, go0);
    const hc = A.st.head(A.S);
    const band = A.st.arr === 'row' ? guideBand(A.size) : 0;
    const headH = Math.max(hc[0].h, hc[1].h) + HEAD_GAP + band;
    const arr = A.st.arr;
    // grow the rail zone so the pair fills its box's height
    const PG = arr === 'row' ? PAIR_GAP : pairGap(A.size);
    const perH = arr === 'row' ? A.bh - headH : (A.bh - PG) / 2 - headH;
    const G = stageGeom(A.S, M.n, fmax, {...go0, drop: A.bh ? fillDrop(G0, perH) : undefined});
    const D = ctx.design;
    const MG = 10, GAP = 26;
    const pairW = arr === 'row' ? 2 * G.W + PAIR_GAP : G.W;
    const pairH = arr === 'row' ? G.H + headH : 2 * (G.H + headH) + PG;
    let x0, y0, px, py;
    if (A.mode === 'side') {
      const extra = Math.max(0, D.w - 2 * MG - pairW - GAP - A.pw);
      x0 = MG + extra * 0.4; y0 = (D.h - pairH) / 2; px = x0 + pairW + GAP + extra * 0.2; py = Math.max(MG, (D.h - A.panel.h) / 2);
    } else {
      const blockH = pairH + (A.panel.h ? GAP + A.panel.h : 0);
      const top = Math.max(MG, (D.h - blockH) / 2);
      x0 = (D.w - pairW) / 2; y0 = top; px = MG; py = top + pairH + GAP;
    }
    const origins = arr === 'row'
      ? [{x: x0, y: y0 + headH}, {x: x0 + G.W + PAIR_GAP, y: y0 + headH}]
      : [{x: x0, y: y0 + headH}, {x: x0, y: y0 + headH + G.H + PG + headH}];
    const heads = hc.map((c, k) => c.build(origins[k].x + (G.W - c.w) / 2, origins[k].y - headH, `head-${k ? 'b' : 'a'}`));
    const bandNodes = placePanel(ctx, A.panel, px, py, it => (it.key === 'changed' ? {fill: ctx.theme.accent2Soft, stroke: ctx.theme.accent2} : {}));
    const cb = changedBoundary(M);
    const diff = M.vA.map((v, i) => v !== M.vB[i]);
    const chips = [tA, tB].map((tx, k) => (showVals ? G.trayX.map((x, i) => valueChip(ctx, tx[i], {x: origins[k].x + x, y: origins[k].y + G.chipRowY(i), size: A.size, mw: G.stagger ? 360 : G.slot[i] + G.gap * 0.8, name: `val${k}-${i}`})) : []));
    // the guide: from A's changed blade to B's (row: an arch above both heads' level; column: down the left side)
    let guide = null;
    if (cb >= 0) {
      const xa = origins[0].x + G.gapX(M.fA)[cb], xb = origins[1].x + G.gapX(M.fB)[cb];
      const ya = origins[0].y + G.bladeRestY - G.bladeH - G.bladeW, yb = origins[1].y + G.bladeRestY - G.bladeH - G.bladeW;
      let d, mid;
      if (arr === 'row') {
        const top = origins[0].y - band / 2;
        d = `M${r(xa)} ${r(ya)}V${r(top)}H${r(xb)}V${r(yb)}`;
        mid = {x: (xa + xb) / 2, y: top};
      } else {
        const lx = x0 + Math.min(G.shelfX0, G.rowX0) - 4;
        const ys = origins[0].y + G.barMid, ys2 = origins[1].y + G.barMid;
        d = `M${r(xa)} ${r(ya)}V${r(ya - 6)}H${r(lx)}V${r(ys2 - G.barMid + G.bladeRestY - G.bladeH - G.bladeW - 6)}H${r(xb)}V${r(yb)}`;
        mid = {x: lx, y: (ys + ys2) / 2};
      }
      let lab = null;
      if (ctx.show('key')) {
        const text = p.comparisonLabels.guide || ctx.t.guide;
        const mw = arr === 'row' ? GUIDE_MW : Math.min(G.W * 0.9, 560);
        const c0 = chipG(ctx, glueN(text), {x: 0, y: 0, maxWidth: mw, size: A.size, maxLines: 3});
        const cx = arr === 'row' ? clamp(mid.x, x0 + c0.box.w / 2, x0 + pairW - c0.box.w / 2) : clamp(mid.x + c0.box.w / 2 + 8, x0 + c0.box.w / 2, x0 + pairW - c0.box.w / 2);
        // row: centred on the arch's top line, in the gap above the rail zone; column: in the gap between A and B
        const cy = arr === 'row' ? origins[0].y - band / 2 : origins[1].y - headH - PG / 2;
        lab = chipG(ctx, glueN(text), {x: cx, y: cy - c0.box.h / 2, anchor: 'middle', maxWidth: mw, size: A.size, maxLines: 3, fill: ctx.theme.card, stroke: ctx.theme.accent2, name: 'guide-chip'});
        lab.bad = lab.fit.truncated || lab.fit.broken;
      }
      guide = {d, lab};
    }
    return {M, G, origins, heads, bandNodes, chips, cb, diff, guide, size: A.size, mode: A.mode, arr, S: A.S, x0, y0, pairW, pairH, problems};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {G, M, origins} = L;
    const fs = [M.fA, M.fB];
    const scenes = origins.map((o, k) => {
      const P = k ? 'b-' : 'a-';
      const f = fs[k];
      const art = stageArt(ctx, G, {P, ox: o.x, oy: o.y, f, links: M.links});
      const rx = G.restX(f);
      const park = j => o.x + G.shelfX0 + G.S * 0.06 + j * G.bladeW * 1.5;
      return g({name: `scene-${k ? 'b' : 'a'}`},
        art.back, art.guides,
        g({name: `${P}bar`, transform: T(o.x + G.cx, o.y + G.barMid)}, pieceArt(ctx, {w: G.S, t: G.t})),
        f.map((q, i) => g({name: `${P}seg${i}`, transform: T(o.x + rx[i], o.y + G.barMid), opacity: 0}, pieceArt(ctx, {w: q * G.S, t: G.t}))),
        art.front,
        f.slice(1).map((_, j) => g({name: `${P}blade${j}`, transform: T(park(j), o.y + G.bladeRestY)}, bladeArt(ctx, {bw: G.bladeW, bh: G.bladeH}))),
        L.chips[k].map((c, i) => g({name: `${P}valg${i}`, opacity: 0}, c.node,
          L.diff[i] ? h('path', {name: `${P}ring${i}`, d: roundRectPath(c.box.x - 5, c.box.y - 5, c.box.w + 10, c.box.h + 10, Math.min(c.box.h / 2 + 5, 20)), fill: 'none', stroke: th.accent2, 'stroke-width': 3.5, opacity: 0}) : null)),
      );
    });
    return g(null,
      L.heads,
      scenes,
      L.guide ? h('path', {name: 'guide', d: L.guide.d, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0}) : null,
      L.guide && L.guide.lab ? g({name: 'guide-lab', opacity: 0}, L.guide.lab.node) : null,
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const {G, M, origins} = L;
    const n = M.n;
    const nodes = {};
    const fs = [M.fA, M.fB];
    const sl = ease.inOutCubic(seg(u, ...W.slide)), ct = ease.inOutCubic(seg(u, ...W.cut)), sp = ease.inOutCubic(seg(u, ...W.spread)), lf = ease.inOutCubic(seg(u, ...W.lift));
    const sem = {};
    const look = [];
    origins.forEach((o, k) => {
      const P = k ? 'b-' : 'a-';
      const f = fs[k];
      const park = j => o.x + G.shelfX0 + G.S * 0.06 + j * G.bladeW * 1.5;
      const cut = G.cutX(f), gap = G.gapX(f), rx = G.restX(f), sx = G.spreadX(f);
      const bl = [];
      for (let j = 0; j < n - 1; j++) {
        const x = sp > 0 ? lerp(o.x + cut[j], o.x + gap[j], sp) : lerp(park(j), o.x + cut[j], sl);
        const y = o.y + lerp(lerp(G.bladeRestY, G.bladeCutY, ct), G.bladeRestY, lf);
        nodes[`${P}blade${j}`] = {transform: T(x, y)};
        bl.push({x: r(x - o.x), y: r(y - o.y)});
        if (j === Math.max(0, L.cb)) sem[`blade${k ? 'B' : 'A'}`] = {x: r(x), y: r(y)};
      }
      const cutDone = ct >= 1;
      nodes[`${P}bar`] = {opacity: cutDone ? 0 : 1};
      const span = W.drop[1] - W.drop[0];
      const each = span / (1 + (n - 1) * 0.55);
      const segs = [];
      for (let i = 0; i < n; i++) {
        const d0 = W.drop[0] + i * each * 0.55;
        const q = seg(u, d0, d0 + each);
        const P0 = q > 0 ? dropPos(G, sx[i], i, q) : {x: lerp(rx[i], sx[i], sp), y: G.barMid};
        nodes[`${P}seg${i}`] = {transform: T(o.x + P0.x, o.y + P0.y), opacity: cutDone ? 1 : 0};
        segs.push({x: r(P0.x), y: r(P0.y), q: r(q, 3)});
        if (i === 0) sem[`seg${k ? 'B' : 'A'}`] = {x: r(o.x + P0.x), y: r(o.y + P0.y)};
      }
      L.chips[k].forEach((_, i) => {
        nodes[`${P}valg${i}`] = {opacity: r(seg(u, ...W.vals), 3)};
        if (L.diff[i]) nodes[`${P}ring${i}`] = {opacity: r(seg(u, ...W.ring), 3)};
      });
      // (the pieces are hidden until the cut: before it the look holds only what is visible)
      look.push({blades: bl, segs: cutDone ? segs : 'hidden', bar: !cutDone});
    });
    if (L.guide) {
      nodes.guide = {opacity: r(seg(u, ...W.line), 3)};
      if (L.guide.lab) nodes['guide-lab'] = {opacity: r(seg(u, ...W.guide), 3)};
    }
    const hd = seg(u, ...W.heads);
    nodes['head-a'] = {opacity: r(hd, 3)};
    nodes['head-b'] = {opacity: r(hd, 3)};
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(seg(u, ...W[b.when]), 3)};
    Object.assign(sem, {
      beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.run[1] ? 'run' : 'guide',
      lookA: look[0], lookB: look[1],
      boundariesA: G.cutX(M.fA).map(x => r(x, 1)), boundariesB: G.cutX(M.fB).map(x => r(x, 1)),
      changedBoundary: L.cb, differs: L.diff,
      valuesA: M.vA, valuesB: M.vB,
      widthsA: M.fA.map(q => r(q * G.S, 3)), widthsB: M.fB.map(q => r(q * G.S, 3)),
      valuesShown: r(seg(u, ...W.vals), 3), guideShown: seg(u, ...W.guide) >= 1, keyShown: seg(u, ...W.key) >= 1,
      slide: r(sl, 3), cut: r(ct, 3), spread: r(sp, 3),
      layout: {S: r(L.S), size: L.size, mode: L.mode, arr: L.arr},
      ...(L.problems.length ? {problems: L.problems} : {}),
    });
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-10-contrast',
    title: 'Illustrative loss distribution — proposed and alternative allocation, two identical stages that differ only in where one supplied boundary falls',
    titleEs: 'Distribución ilustrativa de pérdidas — Contraste A/B',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Distribución ilustrativa de pérdidas',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical stages (a hypothetical total bar, barrier blades, guide rails and one tray per fictional event) receive their own supplied values: A the proposed allocation, B the alternative one. Only the blade on the changed boundary stands elsewhere; in parallel both bars are cut and the pieces run into their trays. A guide joins the changed blade on both stages. Equal weight, no winner, nothing computed, no conclusion drawn.',
    tags: ['causation', 'loss distribution', 'contrast', 'proposed allocation', 'alternative allocation', 'supplied values', 'hypothetical', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/distribucion-perdidas.js', 'src/animations/causation/kits/alcance-dano.js', 'src/animations/causation/kits/prueba-contrafactual.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
