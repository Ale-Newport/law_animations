/**
 * LAW-0720 — Distribución ilustrativa de pérdidas · inspect
 *
 * Storyboard (the produced state, one datum substituted, then back):
 *  0.00–0.20 build     The state produced by the division (allocation A as
 *                      supplied) is built: the rack with its blades up and the
 *                      empty shelf, the guide rails, and one tray per event; the
 *                      pieces settle into their trays (0.03–0.14) and each
 *                      tray's supplied value appears under it (0.05–0.10).
 *  0.20–0.45 isolate   A real lens (the same drawing, magnified) opens from the
 *                      focus tray — its piece, tray and value — to a free area
 *                      beside the scene (0.22–0.36); the context dims; the
 *                      context copy of the value hides as the lens appears, so
 *                      the datum is shown in one place only.
 *  0.45–0.75 replace   Inside the lens the supplied value lifts out (0.46–0.52),
 *                      the piece takes the length of the alternative value
 *                      (0.50–0.62) — only this piece changes, in the lens and in
 *                      the context alike — the new value fades in (0.58–0.64)
 *                      and a small "before: …" line keeps the old value
 *                      traceable (0.62–0.68).
 *  0.75–1.00 return    The lens closes back onto its source (0.76–0.86); the
 *                      context shows the new value with its "before" line and a
 *                      neutral changed-datum marker (Δ on the accent disc,
 *                      0.85–0.90); one editorial note and the key "As supplied ·
 *                      no conclusion drawn". Seeking back restores the old value
 *                      exactly. No share rule, percentage, fault or outcome.
 * Wide boxes: scene left, lens to its right (panel under the lens or below).
 * Tall boxes: scene above, lens below it.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0720
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields} from '../../schemas/fields.js';
import {lens as lensFw} from '../../frameworks/lens.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  dpFields, DP_STRINGS, DP_DEFAULTS, DP_ES_DEFAULTS, resolveDP, linkNotes, altText, allocText, valueText,
  stageGeom, stageArt, pieceArt, pieceFrame, bladeArt, dropPos, ST, trayBack, trayFront, valueChip, valueChipSize, arrangeScene, placePanel, fillDrop, DROP_CAP,
  chipG, glueN, fitG,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/distribucion-perdidas.js';

const ID = 'LAW-0720';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], replace: [0.45, 0.75], back: [0.75, 1]};
const W = {
  legend: [0, 0.04], settle: [0.03, 0.14], vals: [0.05, 0.1], open: [0.22, 0.36], dim: [0.22, 0.32],
  out: [0.46, 0.52], grow: [0.5, 0.62], in: [0.58, 0.64], trace: [0.62, 0.68], close: [0.76, 0.86], marker: [0.85, 0.9], note: [0.86, 0.9], key: [0.88, 0.92],
};
const TARGETS = ['event-1', 'event-2', 'event-3', 'event-4'];
const VMW = 440; // widest value chip
const FMW = 320; // widest focus value chip (two lines): it sets the lens's width
const TR = 1; // the trace line's text size (× the value chips')

const strings = {
  en: {...DP_STRINGS.en, before: 'before', changed: 'Changed datum', ctx: 'State produced'},
  es: {...DP_STRINGS.es, before: 'antes', changed: 'Dato cambiado', ctx: 'Estado producido'},
};

const sceneSchema = {
  ...dpFields,
  ...inspectFields(TARGETS),
};
// (the before / after values drive the piece's length through their first number; without one the event's supplied
// A / B values are used)
sceneSchema.beforeValue = {...sceneSchema.beforeValue, description: 'Value shown before the substitution (its first number sets the piece length; default: the event\'s value under A)'};
sceneSchema.afterValue = {...sceneSchema.afterValue, description: 'Value shown after the substitution, the alternative datum (its first number sets the new piece length; default: the event\'s value under B)'};

const defaultParams = {
  ...DP_DEFAULTS,
  focusTarget: 'event-1',
  beforeValue: '40 (hypothetical)',
  afterValue: '30 (hypothetical)',
  detailGeometry: {zoom: 1.6, placement: 'auto'},
  contextLabels: {context: 'State produced by the proposed allocation (as supplied)', marker: 'Changed datum: event 1'},
};

const defaultParamsEs = {
  ...DP_ES_DEFAULTS,
  beforeValue: '40 (hipotético)',
  afterValue: '30 (hipotético)',
  contextLabels: {context: 'Estado producido por la asignación propuesta (según lo aportado)', marker: 'Dato cambiado: evento 1'},
};

const SHAPES = {
  landscape: {sizes: [26, 16], modes: ['below'], sideWs: [], lens: ['right', 'above']},
  square: {sizes: [24, 16], modes: ['side', 'below'], sideWs: [0.3, 0.34, 0.38, 0.42, 0.46], lens: ['above', 'right']},
  portrait: {sizes: [25, 16], modes: ['below'], sideWs: [], lens: ['above', 'below']},
};

const num0 = s => { const m = String(s).match(/-?\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(',', '.')) : NaN; };

function panelItems(ctx, p, M) {
  const t = ctx.t;
  if (!ctx.show('key')) return [];
  const allOn = ctx.show('all');
  const out = [];
  // the context caption and the total share one chip (the total's pieces are in the trays)
  out.push(allOn && p.contextLabels.context ? {key: 'ctx', icon: 'status', text: `${p.contextLabels.context} · ${p.losses[0].label}`, when: 'legend'} : {key: 'bar', icon: 'bar', text: `${p.losses[0].label}: ${t.total}`, when: 'legend'});
  p.events.forEach((e, i) => out.push({key: `ev${i}`, icon: 'tray', i, text: e.label, when: 'legend'}));
  out.push({key: 'alloc-a', icon: 'alloc', side: 'a', text: allocText(ctx, p, M, 'a'), when: 'legend'});
  out.push({key: 'alloc-b', icon: 'alloc', side: 'b', text: allocText(ctx, p, M, 'b'), when: 'legend'});
  if (p.losses[1]) out.push({key: 'loss1', icon: 'note', text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'legend'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: altText(ctx, a), when: 'legend'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, when: 'legend'}));
  // the single editorial annotation (the changed-datum note) and the key appear late: they come first, so the chips
  // shown from the first frame take the panel's last rows
  return [{key: 'note', icon: 'note', text: p.contextLabels.marker || t.changed, when: 'note'}, {key: 'key', text: t.key, when: 'key'}, ...out];
}

/** Text of the "before: …" trace line. */
const traceText = (ctx, p) => `${ctx.t.before}: ${p.beforeValue}`;

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveDP(p);
    const k = Math.min(M.n - 1, TARGETS.indexOf(p.focusTarget));
    const sumA = M.vA.reduce((a, b) => a + b, 0) || 1;
    const vBefore = Number.isFinite(num0(p.beforeValue)) ? num0(p.beforeValue) : M.vA[k];
    const vAfter = Number.isFinite(num0(p.afterValue)) ? num0(p.afterValue) : M.vB[k];
    // one scale for every piece (length = value × S / ΣA): only the focus piece changes
    const fBefore = M.fA.slice(), fAfter = M.fA.slice();
    fBefore[k] = vBefore / sumA; fAfter[k] = vAfter / sumA;
    const fmax = M.fA.map((q, i) => (i === k ? Math.max(fBefore[k], fAfter[k], q) : q));
    const showVals = ctx.show('key');
    const texts = M.vA.map(v => valueText(p, v));
    texts[k] = p.beforeValue;
    const items = panelItems(ctx, p, M);
    const memo = new Map();
    const v = ctx.view, D = ctx.design;
    const kf = Math.min(v.content.w / D.w, v.content.h / D.h);
    // the lens's smaller side >= 0.355 of the frame's short side (reviewers' bar: roughly >= 35–45 %)
    const needLens = 0.355 * Math.min(v.width, v.height) / kf;
    const zp = (p.detailGeometry && p.detailGeometry.zoom) || 2;
    const stMemo = new Map();
    const LGAP = 30;
    const stage = size => {
      let st = stMemo.get(size);
      if (st) return st;
      const cs = showVals ? texts.map((tx, i) => { if (i !== k) return valueChipSize(ctx, tx, size, VMW); const a = valueChipSize(ctx, tx, size, FMW); const b = valueChipSize(ctx, p.afterValue, size, FMW); const c = valueChipSize(ctx, traceText(ctx, p), size * TR, FMW); return {w: Math.max(a.w, b.w, c.w), h: Math.max(a.h, b.h) + c.h + 4, bad: a.bad || b.bad || c.bad}; }) : [];
      st = [];
      // (labels hidden — no panel — : the lens opens over the rack, so the scene alone fills the box at rest)
      // (others: false — tight boxes — : only the focus tray carries its value chip; the other values stay listed in the
      // allocation chips of the panel)
      for (const others of [true, false]) for (const lp of items.length ? SH.lens : ['above']) for (const compact of [false, true]) for (const stagger of others ? [false, true] : [false]) {
        const chipWs = cs.map((c, i) => (others || i === k ? c.w : 0)), chipH = cs.length ? Math.max(...cs.filter((c, i) => others || i === k).map(c => c.h)) : 0;
        const go = {chipWs, chipH, compact, stagger: stagger && cs.length > 0, others};
        const lensOf = S => {
          let G = stageGeom(S, M.n, fmax, go);
          if (lp === 'above') {
            // the lens opens over the rack, above the trays: the rail zone grows to hold it
            const hh0 = G.floorY + ST.floor + (chipH ? 10 + chipH * (go.stagger ? 2 : 1) : 0) - (G.trayTop - G.t * 1.1) + 12;
            const w0 = Math.max(G.slot[k] + 16, (chipWs[k] ?? 0) + 24);
            const z0 = clamp(Math.max(Math.min(zp, 4), needLens / Math.min(w0, hh0)), 1.5, 4);
            const zone = z0 * hh0 + 24 + G.t * 1.1;
            const drop = (zone - (G.trayTop - G.dropMin * S)) / S;
            if (drop > 1.6) return {G, src: {w: w0, h: hh0}, z: z0, lw: 1e9, lh: 1e9};
            G = stageGeom(S, M.n, fmax, {...go, drop: Math.max(G.dropMin, drop)});
            return {G, src: {w: w0, h: hh0}, z: z0, lw: w0 * z0, lh: hh0 * z0, drop: Math.max(G.dropMin, drop)};
          }
          // (a near-square source round the focus column: piece, tray, pedestal, value chips; nothing else is drawn in it)
          const hh = G.floorY + ST.floor + (chipH ? 10 + chipH : 0) - (G.trayTop - G.t * 1.1) + 12;
          const w0 = Math.max(G.slot[k] + 16, (chipWs[k] ?? 0) + 24, hh * 0.95);
          const src = {w: w0, h: Math.max(hh, w0 * 0.82)};
          const z = clamp(Math.max(Math.min(zp, 4), needLens / Math.min(src.w, src.h)), 1.5, 4);
          return {G, src, z, lw: src.w * z, lh: src.h * z};
        };
        // lens to the right: it may reach over the panel below the scene (an opaque window, only while open), never
        // over the scene itself; lens below: its room is reserved under the scene
        // (the area that counts is the scene's own, at rest: the lens room is empty while the lens is closed)
        const areaOf = (S, bh) => {
          const q = lensOf(S);
          if (lp === 'below') return q.G.W * q.G.H;
          const Hf = Math.min(bh, stageGeom(S, M.n, fmax, {...go, drop: Math.max(q.drop ?? 0, DROP_CAP)}).H);
          return q.G.W * Math.max(q.G.H, Hf);
        };
        st.push({lp, go, bad: cs.some(c => c.bad), lensOf, areaOf, dims: S => {
          const q = lensOf(S);
          if (q.lh > D.h - 20) return {w: 1e9, h: 1e9};
          if (lp === 'above') return {w: Math.max(q.G.W, q.lw), h: q.G.H};
          return lp === 'right' ? {w: q.G.W + LGAP + q.lw, h: q.G.H} : {w: Math.max(q.G.W, q.lw), h: q.G.H + LGAP + q.lh};
        }});
      }
      stMemo.set(size, st);
      return st;
    };
    let A = arrangeScene(ctx, {items, stage, modes: SH.modes, sizes: SH.sizes, sideWs: SH.sideWs, memo, sMax: 1200, areaSat: items.length ? 0.4 : 0.85, areaW: items.length ? 0.3 : 0.5});
    const problems = [];
    if (!A) { problems.push('no-layout-fits'); A = {size: SH.sizes[1], mode: 'below', S: 120, pw: D.w - 20, panel: {placed: [], h: 0}, st: stage(SH.sizes[1])[0], bw: D.w, bh: D.h}; }
    const st = A.st;
    const q0 = st.lensOf(A.S);
    // the rail zone grows so the scene fills the box's height (lens to the right) — the lens keeps its size
    // (and the tray row spreads out to use the box's width)
    const minW = Math.max(0, (A.bw || D.w) - (st.lp === 'right' ? LGAP + q0.lw : 0) - 10);
    const G = st.lp === 'right' ? stageGeom(A.S, M.n, fmax, {...st.go, drop: fillDrop(q0.G, A.bh), minW}) : st.lp === 'above' ? stageGeom(A.S, M.n, fmax, {...st.go, drop: Math.min(1.6, (q0.drop ?? q0.G.dropMin) + Math.max(0, (A.bh || D.h) - q0.G.H) / A.S), minW}) : stageGeom(A.S, M.n, fmax, {...st.go, minW});
    const {z} = q0;
    const MG = 10, GAP = 26;
    const blockW = st.lp === 'right' ? G.W + LGAP + q0.lw : Math.max(G.W, q0.lw);
    const blockH = st.lp === 'right' || st.lp === 'above' ? G.H : G.H + LGAP + q0.lh;
    let bx, by, px, py;
    if (A.mode === 'side') { bx = MG; by = (D.h - blockH) / 2; px = MG + A.bw + GAP; py = Math.max(MG, (D.h - A.panel.h) / 2); } else { const tot = blockH + (A.panel.h ? GAP + A.panel.h : 0); by = Math.max(MG, (D.h - tot) / 2); bx = (D.w - blockW) / 2; px = MG; py = by + blockH + GAP; }
    const ox = st.lp === 'right' ? bx : bx + (blockW - G.W) / 2;
    const oy = st.lp === 'right' ? by + (blockH - G.H) / 2 : by;
    // the lens: source = the focus tray's column (piece, tray, pedestal, value); destination beside / below the scene
    const colH = G.floorY + ST.floor + (G.chipH ? 10 + G.chipH * (G.stagger ? 2 : 1) : 0) - (G.trayTop - G.t * 1.1) + 12;
    const src = {x: ox + G.trayX[k] - q0.src.w / 2, y: oy + G.trayTop - G.t * 1.1 - (st.lp === 'above' ? 0 : Math.max(0, q0.src.h - colH)), w: q0.src.w, h: q0.src.h};
    // (the floor strip in the lens copy spans the source)
    const lw = src.w * z, lh = src.h * z;
    const dest = st.lp === 'above'
      ? {x: clamp(src.x + src.w / 2 - lw / 2, ox, ox + G.W - lw), y: Math.max(oy + 4, src.y - 16 - lh), w: lw, h: lh}
      : st.lp === 'right'
      ? {x: ox + G.W + LGAP, y: clamp(src.y + src.h / 2 - lh / 2, 10, D.h - 10 - lh), w: lw, h: lh}
      : {x: clamp(src.x + src.w / 2 - lw / 2, bx, bx + blockW - lw), y: oy + G.H + LGAP, w: lw, h: lh};
    const bandNodes = placePanel(ctx, A.panel, px, py, it => (it.key === 'note' ? {fill: ctx.theme.accent2Soft, stroke: ctx.theme.accent2} : {}));
    // value chips (context): the focus chip has a before and an after version and a trace line
    const chipAt = (tx, i, name, y0 = oy + G.chipRowY(i), size = A.size) => valueChip(ctx, tx, {x: ox + G.trayX[i], y: y0, size, mw: i === k ? FMW : G.stagger ? VMW : G.slot[i] + G.gap * 0.8, name});
    const othersOn = st.go.others !== false;
    const chips = showVals ? texts.map((tx, i) => (othersOn || i === k ? chipAt(tx, i, `val${i}`) : null)) : [];
    const after = showVals ? chipAt(p.afterValue, k, 'valAfter') : null;
    const trace = showVals ? (() => { const c = valueChip(ctx, traceText(ctx, p), {x: ox + G.trayX[k], y: oy + G.chipRowY(k) + Math.max(chips[k].box.h, after.box.h) + 4, size: A.size * TR, mw: FMW, name: 'trace', stroke: ctx.theme.inkSoft}); return c; })() : null;
    const th = ctx.theme;
    // lens content: a real copy of the focus column, in the same coordinates
    const content = g(null,
      g({transform: T(ox + G.trayX[k], oy + G.trayTop)}, trayBack(ctx, {tw: G.tws[k], td: G.td, ph: G.pedH, i: k})),
      g({name: 'lz-piece', transform: T(ox + G.trayX[k], oy + G.landY)}, pieceArt(ctx, {w: fBefore[k] * G.S, t: G.t, name: 'lz-piece-art'})),
      g({transform: T(ox + G.trayX[k], oy + G.trayTop)}, trayFront(ctx, {tw: G.tws[k], td: G.td, ph: G.pedH, i: k, numText: null})),
      h('rect', {x: r(src.x - 2), y: r(oy + G.floorY), width: r(src.w + 4), height: 14, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}),
      chips.length ? g({name: 'lz-before'}, valueChip(ctx, chips[k].fit.full, {x: ox + G.trayX[k], y: chips[k].box.y, size: A.size, mw: chips[k].box.w + 2}).node) : null,
      after ? g({name: 'lz-after', opacity: 0}, valueChip(ctx, after.fit.full, {x: ox + G.trayX[k], y: after.box.y, size: A.size, mw: after.box.w + 2, stroke: th.accent2}).node) : null,
      trace ? g({name: 'lz-trace', opacity: 0}, valueChip(ctx, trace.fit.full, {x: ox + G.trayX[k], y: trace.box.y, size: A.size * TR, mw: FMW, stroke: th.inkSoft}).node) : null,
    );
    const lz = lensFw(ctx, {name: 'lz', source: src, dest: dest, content, frame: {x: ox - 6, y: oy - 6, w: G.W + 12, h: G.H + 12}, color: th.accent2});
    // the lens window is opaque: text lying under it while it is open counts as covered
    const win = lz.node.children.find(c => c && c.attrs && c.attrs.name === 'lz-win');
    if (win) win.attrs['data-occludes'] = 1;
    return {M, k, G, ox, oy, src, dest, z, fBefore, fAfter, chips, after, trace, bandNodes, lz, size: A.size, mode: A.mode, lp: st.lp, S: A.S, blockBox: {x: bx, y: by, w: blockW, h: blockH}, problems};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {G, ox, oy, M, k} = L;
    const art = stageArt(ctx, G, {P: '', ox, oy, f: M.fA, links: M.links});
    const sx = G.spreadX(M.fA);
    // blades up on the rail at the boundaries' gaps (the state after the division)
    const gapX = G.gapX(M.fA);
    const piece = (i, name) => g({name, transform: T(ox + G.trayX[i], oy + G.landY)}, pieceArt(ctx, {w: L.fBefore[i] * G.S, t: G.t, name: `${name}-art`}));
    return g(null,
      art.back, art.guides,
      M.fA.map((_, i) => piece(i, `seg${i}`)),
      art.front,
      gapX.map((x, j) => g({name: `blade${j}`, transform: T(ox + x, oy + G.bladeRestY)}, bladeArt(ctx, {bw: G.bladeW, bh: G.bladeH}))),
      g({name: 'vals'}, L.chips.map((c, i) => (c ? g({name: `valg${i}`, opacity: 0}, c.node) : null)),
        L.after ? g({name: 'valAfterg', opacity: 0}, h('path', {d: roundRectPath(L.after.box.x, L.after.box.y, L.after.box.w, L.after.box.h, Math.min(L.after.box.h / 2, 16)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}), L.after.node) : null,
        L.trace ? g({name: 'traceg', opacity: 0}, L.trace.node) : null),
      g({name: 'marker', opacity: 0}, changedMarker(ctx, {x: ox + G.trayX[k] + G.tws[k] / 2 + 6, y: oy + G.trayTop - G.t * 0.2, radius: Math.max(16, G.S * 0.035)})),
      L.bandNodes.map(b => b.node),
      // (the lens window is drawn last: when it reaches over the panel it covers it while open)
      L.lz.node,
    );
  },
  frame(ctx, L, u) {
    const {G, ox, oy, M, k} = L;
    const n = M.n;
    const nodes = {};
    // build: the pieces settle from the shelf into their trays
    const st = seg(u, ...W.settle);
    const sx = G.spreadX(M.fA);
    const gr = ease.inOutCubic(seg(u, ...W.grow));
    const wk = lerp(L.fBefore[k], L.fAfter[k], gr) * G.S;
    const segs = [];
    for (let i = 0; i < n; i++) {
      const d0 = i * 0.12;
      const q = clamp((st - d0) / (1 - 0.12 * (n - 1)));
      const P = dropPos(G, sx[i], i, q);
      nodes[`seg${i}`] = {transform: T(ox + P.x, oy + P.y)};
      segs.push({x: r(ox + P.x), y: r(oy + P.y)});
    }
    // lens
    const op = ease.inOutCubic(seg(u, ...W.open)), cl = ease.inOutCubic(seg(u, ...W.close));
    const pOpen = u < W.close[0] ? op : 1 - cl;
    Object.assign(nodes, L.lz.frame(pOpen, pOpen));
    // value chips: the focus chip hides while the lens holds its copy; after the return the new value + trace show
    const vs = seg(u, ...W.vals);
    const lensOn = pOpen > 0.001;
    const swapped = u >= W.in[0];
    L.chips.forEach((c, i) => { if (c) nodes[`valg${i}`] = {opacity: r(i === k ? (lensOn || swapped ? 0 : vs) : vs, 3)}; });
    if (L.after) {
      nodes.valAfterg = {opacity: r(!lensOn && swapped ? 1 : 0, 3)};
      nodes.traceg = {opacity: r(!lensOn && swapped ? 1 : 0, 3)};
      nodes['lz-before'] = {opacity: r(1 - seg(u, ...W.out), 3), transform: T(0, -seg(u, ...W.out) * 12)};
      nodes['lz-after'] = {opacity: r(seg(u, ...W.in), 3)};
      nodes['lz-trace'] = {opacity: r(seg(u, ...W.trace), 3)};
    }
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const lg = seg(u, ...W.legend);
    for (const b of L.bandNodes) nodes[`band-${b.key}`] = {opacity: r(b.when === 'legend' ? lg : seg(u, ...W[b.when]), 3)};
    // piece widths: rebuild the focus piece's art paths (context + lens)
    // only the focus piece changes length (context and lens alike)
    Object.assign(nodes, pieceFrame(`seg${k}-art`, wk, G.t), pieceFrame('lz-piece-art', wk, G.t));
    const sem = {
      beat: u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.replace[1] ? 'replace' : 'back',
      focus: k, lensOpen: r(pOpen, 3), zoom: r(L.z, 3), source: roundBox(L.src), dest: roundBox(L.dest),
      focusWidth: r(wk, 3), widths: M.fA.map((q, i) => r(i === k ? wk : q * G.S, 3)),
      beforeWidth: r(L.fBefore[k] * G.S, 3), afterWidth: r(L.fAfter[k] * G.S, 3),
      shownValue: !L.after ? null : lensOn ? (u >= W.in[0] ? 'after' : 'before') + '@lens' : swapped ? 'after@context' : 'before@context',
      traceShown: Boolean(L.after) && (lensOn ? seg(u, ...W.trace) >= 1 : swapped),
      markerShown: seg(u, ...W.marker) >= 1, keyShown: seg(u, ...W.key) >= 1,
      settled: r(st, 3),
      layout: {S: r(L.S), size: L.size, mode: L.mode, lens: L.lp},
      ...(L.problems.length ? {problems: L.problems} : {}),
    };
    segs.forEach((s0, i) => { sem[`seg${i}`] = s0; });
    return {nodes, semantic: sem};
  },
};

const roundBox = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-10-inspect',
    title: 'Illustrative loss distribution — a lens on one event’s tray; its supplied value is replaced by the alternative one and only that piece changes length',
    titleEs: 'Distribución ilustrativa de pérdidas — Inspección y sustitución',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Distribución ilustrativa de pérdidas',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The state produced by dividing a hypothetical total among fictional events (allocation A as supplied) is built; a real lens magnifies one tray with its piece and supplied value; that one value is replaced by the alternative datum, only that piece changes length, and a "before" line keeps the old value traceable. Back in context a neutral changed-datum marker stays. Nothing is computed, attributed or decided; no conclusion drawn.',
    tags: ['causation', 'loss distribution', 'inspect', 'lens', 'supplied value', 'alternative datum', 'hypothetical'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/distribucion-perdidas.js', 'src/animations/causation/kits/alcance-dano.js', 'src/animations/causation/kits/prueba-contrafactual.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
