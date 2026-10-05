/**
 * LAW-0717 — Distribución ilustrativa de pérdidas · story
 *
 * Storyboard (front view; objects only — no person, no fault, no rule):
 *  0.00–0.15 rest     A top rail with the barrier blades parked at its left end;
 *                     below it the whole bar (the hypothetical total, its label
 *                     printed on it) on a shelf; guide rails (connectors) run from
 *                     the shelf down to a row of trays on pedestals — one tray per
 *                     fictional event, numbered and tinted. The panel lists the
 *                     total, the events and BOTH supplied allocations (● A, ◆ B)
 *                     in identical chips.
 *  0.15–0.42 begin    The supplied value of each event appears under its tray
 *                     ("40 (hypothetical)", 0.15–0.20) — the values come first.
 *                     The blades slide along the rail to the boundaries those
 *                     values give (0.19–0.27), drop through the bar (0.27–0.33)
 *                     and push the pieces apart on the shelf (0.33–0.41).
 *  0.42–0.73 carry    One after another the pieces leave the shelf and run down
 *                     their guide rail into their own tray (0.42–0.66); the
 *                     blades lift back to the rail (0.66–0.71).
 *  0.73–1.00 hold     Each tray holds a piece as long as its supplied value; the
 *                     status "Total divided only with the supplied values" (or,
 *                     when supplied, marked disputed — never decided), notes and
 *                     the key "As supplied · no conclusion drawn". No share rule,
 *                     percentage, fault or outcome is stated; the other supplied
 *                     allocation stays listed at equal weight, never ranked.
 * Wide boxes: stage left, panel right (or below). Tall boxes: stage above the
 * panel. The layout search keeps the stage as large as the text allows.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0717
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {str, num, obj, list, oneOf, annotation} from '../../schemas/fields.js';
import {
  dpFields, DP_STRINGS, DP_DEFAULTS, DP_ES_DEFAULTS, resolveDP, linkNotes, altText, allocText, valueText,
  stageGeom, stageArt, pieceArt, bladeArt, dropPos, valueChip, valueChipSize, arrangeScene, placePanel, fitG, fillDrop,
  clamp, ease, lerp, r, seg, localizeScene,
} from './kits/distribucion-perdidas.js';
import {textBlock} from '../../primitives/annotate.js';

const ID = 'LAW-0717';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  legend: [0, 0.04], vals: [0.15, 0.2], label: [0.15, 0.19], slide: [0.19, 0.27], cut: [0.27, 0.33], spread: [0.33, 0.41],
  drop: [0.42, 0.66], lift: [0.66, 0.71], status: [0.74, 0.78], notes: [0.76, 0.8], key: [0.78, 0.82],
};
const FINAL = ['divided-as-supplied', 'division-disputed'];

const sceneSchema = {
  ...dpFields,
  allocation: oneOf('Which supplied allocation this scene divides the bar by (A or B); the other stays listed at equal weight, never ranked', ['a', 'b']),
  actorLabels: obj('Captions for the two acting parts of the scene', {
    a: str('Caption for the barrier blades', 70),
    b: str('Caption for the guide rails and trays', 70),
  }),
  objectLabels: obj('Labels printed in the scene', {
    bar: str('Label printed on the bar at rest (empty = the total\'s description)', 48),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['bar', 'trays', 'values']), 0, 2),
  finalState: oneOf('SUPPLIED final state: divided as supplied, or marked disputed (never decided)', FINAL),
};

const defaultParams = {
  ...DP_DEFAULTS,
  allocation: 'a',
  actorLabels: {a: 'Blades: cut where the supplied values end', b: 'Rails and trays: one tray per event'},
  objectLabels: {bar: ''},
  actionProgress: 1,
  annotations: [{target: 'values', text: 'Each piece is only as long as its supplied value'}],
  finalState: 'divided-as-supplied',
};

const defaultParamsEs = {
  ...DP_ES_DEFAULTS,
  actorLabels: {a: 'Cuchillas: cortan donde acaban los valores aportados', b: 'Guías y bandejas: una bandeja por evento'},
  annotations: [{target: 'values', text: 'Cada pieza mide solo lo que su valor aportado'}],
};

const strings = {
  en: {...DP_STRINGS.en, shownHere: 'Divided here', alsoSupplied: 'Also supplied', shown: 'Total divided only with the supplied values', disputedState: 'Division disputed (as supplied) · undecided'},
  es: {...DP_STRINGS.es, shownHere: 'Repartido aquí', alsoSupplied: 'También aportada', shown: 'Total repartido solo con los valores aportados', disputedState: 'Reparto discutido (según lo aportado) · sin decidir'},
};

const SHAPES = {
  landscape: {sizes: [30, 16], modes: ['side', 'below'], sideWs: [0.3, 0.36, 0.42, 0.5, 0.58]},
  square: {sizes: [24, 16], modes: ['below', 'side'], sideWs: [0.36, 0.42, 0.5]},
  portrait: {sizes: [25, 16], modes: ['below'], sideWs: []},
};

function panelItems(ctx, p, M) {
  const t = ctx.t;
  if (!ctx.show('key')) return [];
  const allOn = ctx.show('all');
  const side = p.allocation;
  const other = side === 'a' ? 'b' : 'a';
  const out = [];
  out.push({key: 'bar', icon: 'bar', text: `${p.losses[0].label}: ${t.total}`, when: 'legend'});
  p.events.forEach((e, i) => out.push({key: `ev${i}`, icon: 'tray', i, text: e.label, when: 'legend'}));
  // the two supplied allocations: identical chips (same icon size, stroke and timing), neither ranked
  out.push({key: `alloc-${side}`, icon: 'alloc', side, text: `${t.shownHere}: ${allocText(ctx, p, M, side)}`, when: 'legend'});
  out.push({key: `alloc-${other}`, icon: 'alloc', side: other, text: `${t.alsoSupplied}: ${allocText(ctx, p, M, other)}`, when: 'legend'});
  if (p.losses[1]) out.push({key: 'loss1', icon: 'note', text: `${t.alsoNoted}: ${p.losses[1].label}`, when: 'legend'});
  M.alternatives.forEach((a, j) => out.push({key: `alt${j}`, icon: 'alt', text: altText(ctx, a), when: 'legend'}));
  linkNotes(ctx, M).forEach(l => out.push({...l, when: 'legend'}));
  if (allOn && p.actorLabels.a) out.push({key: 'actA', icon: 'alt', text: p.actorLabels.a, when: 'legend'});
  if (allOn && p.actorLabels.b) out.push({key: 'actB', icon: 'tray', i: 0, text: p.actorLabels.b, when: 'legend'});
  out.push({key: 'status', icon: 'status', text: p.finalState === 'division-disputed' ? t.disputedState : t.shown, when: 'status'});
  if (allOn) p.annotations.forEach((a, i) => out.push({key: `note${i}`, icon: a.target === 'bar' ? 'bar' : a.target === 'trays' ? 'tray' : 'note', i: 0, text: a.text, when: 'notes'}));
  out.push({key: 'key', text: t.key, when: 'key'});
  return out;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveDP(p);
    const side = p.allocation;
    const f = side === 'a' ? M.fA : M.fB;
    const vals = side === 'a' ? M.vA : M.vB;
    const vtext = vals.map(v => valueText(p, v));
    const showVals = ctx.show('key');
    const items = panelItems(ctx, p, M);
    const memo = new Map();
    const stageMemo = new Map();
    const stage = size => {
      let st = stageMemo.get(size);
      if (st) return st;
      const cs = showVals ? vtext.map(tx => valueChipSize(ctx, tx, size, 360)) : [];
      const bad = cs.some(c => c.bad);
      const chipWs = cs.map(c => c.w);
      const chipH = cs.length ? Math.max(...cs.map(c => c.h)) : 0;
      // stage variants: regular, compact (shorter rail zone) and staggered value chips (two rows)
      st = [false, true].flatMap(compact => [false, true].map(stagger => {
        const go = {chipWs, chipH, compact, stagger: stagger && cs.length > 0};
        return {bad, go, dims: S => { const G = stageGeom(S, M.n, f, go); return {w: G.W, h: G.H}; }};
      }));
      stageMemo.set(size, st);
      return st;
    };
    let A = arrangeScene(ctx, {items, stage, modes: SH.modes, sizes: SH.sizes, sideWs: SH.sideWs, memo, sMax: 1400});
    const problems = [];
    if (!A) {
      // last resort (never throws): the smallest size, the panel below, whatever stage remains
      problems.push('no-layout-fits');
      const size = SH.sizes[1];
      A = {size, mode: 'below', S: 120, pw: ctx.design.w - 20, panel: {placed: [], h: 0}, st: stage(size)[0]};
    }
    const go = A.st ? A.st.go : stage(A.size)[0].go;
    const G0 = stageGeom(A.S, M.n, f, go);
    // the guide-rail zone grows so the stage fills its box's height
    const G = stageGeom(A.S, M.n, f, {...go, drop: A.bh ? fillDrop(G0, A.bh) : undefined});
    const D = ctx.design;
    const MG = 10, GAP = 26;
    let ox, oy, px, py;
    if (A.mode === 'side') {
      const blockW = G.W + GAP + A.pw;
      const extra = Math.max(0, D.w - 2 * MG - blockW);
      ox = MG + extra * 0.35;
      oy = (D.h - G.H) / 2;
      px = ox + G.W + GAP + extra * 0.3;
      py = Math.max(MG, (D.h - A.panel.h) / 2);
    } else {
      const blockH = G.H + (A.panel.h ? GAP + A.panel.h : 0);
      const top = Math.max(MG, (D.h - blockH) / 2);
      ox = (D.w - G.W) / 2;
      oy = top;
      px = MG;
      py = top + G.H + GAP;
    }
    const bandNodes = placePanel(ctx, A.panel, px, py, it => (it.key === 'status' ? {fill: ctx.theme.accent2Soft, stroke: ctx.theme.accent2} : {}));
    // value chips under each tray (centred, kept inside their tray's column)
    const chips = showVals ? G.trayX.map((tx, i) => valueChip(ctx, vtext[i], {x: ox + tx, y: oy + G.chipRowY(i), size: A.size, mw: G.stagger ? 360 : G.slot[i] + G.gap * 0.8, name: `val${i}`})) : [];
    // the label printed on the bar at rest (only when it fits on one line inside the bar)
    let barLabel = null;
    if (ctx.show('key')) {
      const fo = {maxWidth: A.S * 0.9, size: Math.min(A.size, G.t * 0.5), minSize: 16, maxLines: 1, weight: 700};
      const fit = fitG(ctx, p.objectLabels.bar || p.losses[0].label, fo);
      if (!fit.truncated && !fit.broken && fit.size >= 16) barLabel = fit;
    }
    return {M, f, vals, vtext, G, ox, oy, size: A.size, mode: A.mode, S: A.S, bandNodes, chips, barLabel, problems};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {G, ox, oy, M, f} = L;
    const art = stageArt(ctx, G, {P: '', ox, oy, f, links: M.links});
    const rx = G.restX(f);
    const park = j => ox + G.shelfX0 + G.S * 0.06 + j * G.bladeW * 1.5;
    return g(null,
      art.back,
      art.guides,
      // the whole bar (until the blades are down), then its pieces
      g({name: 'bar', transform: T(ox + G.cx, oy + G.barMid)}, pieceArt(ctx, {w: G.S, t: G.t}),
        L.barLabel ? g({name: 'bar-label'}, textBlock(L.barLabel, {x: 0, y: -L.barLabel.size * 0.42, anchor: 'middle', fill: th.ink})) : null),
      f.map((q, i) => g({name: `seg${i}`, transform: T(ox + rx[i], oy + G.barMid), opacity: 0}, pieceArt(ctx, {w: q * G.S, t: G.t}))),
      art.front,
      g({name: 'blades'}, f.slice(1).map((_, j) => g({name: `blade${j}`, transform: T(park(j), oy + G.bladeRestY)}, bladeArt(ctx, {bw: G.bladeW, bh: G.bladeH})))),
      g({name: 'vals'}, L.chips.map((c, i) => g({name: `valg${i}`, opacity: 0}, c.node))),
      L.bandNodes.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const {G, ox, oy, f} = L;
    const capU = lerp(BEATS.action[0], BEATS.hold[0], p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const n = f.length;
    const nodes = {};
    const park = j => ox + G.shelfX0 + G.S * 0.06 + j * G.bladeW * 1.5;
    const cut = G.cutX(f), gap = G.gapX(f), rx = G.restX(f), sx = G.spreadX(f);
    const sl = ease.inOutCubic(seg(a, ...W.slide)), ct = ease.inOutCubic(seg(a, ...W.cut)), sp = ease.inOutCubic(seg(a, ...W.spread)), lf = ease.inOutCubic(seg(a, ...W.lift));
    const blades = [];
    for (let j = 0; j < n - 1; j++) {
      const x = sp > 0 ? lerp(ox + cut[j], ox + gap[j], sp) : lerp(park(j), ox + cut[j], sl);
      const y = oy + lerp(lerp(G.bladeRestY, G.bladeCutY, ct), G.bladeRestY, lf);
      nodes[`blade${j}`] = {transform: T(x, y)};
      blades.push({x: r(x), y: r(y)});
    }
    const cutDone = ct >= 1;
    nodes.bar = {opacity: cutDone ? 0 : 1};
    if (L.barLabel) nodes['bar-label'] = {opacity: r(1 - seg(a, ...W.label), 3)};
    // pieces: spread on the shelf, then one after another down their rail into their tray
    const segs = [], drops = [];
    const span = W.drop[1] - W.drop[0];
    const each = span / (1 + (n - 1) * 0.55);
    for (let i = 0; i < n; i++) {
      const d0 = W.drop[0] + i * each * 0.55;
      const q = seg(a, d0, d0 + each);
      const x0 = lerp(rx[i], sx[i], sp);
      const P0 = q > 0 ? dropPos(G, sx[i], i, q) : {x: x0, y: G.barMid};
      const P = {x: ox + P0.x, y: oy + P0.y};
      nodes[`seg${i}`] = {transform: T(P.x, P.y), opacity: cutDone ? 1 : 0};
      segs.push({x: r(P.x), y: r(P.y)});
      drops.push(r(q, 3));
    }
    const vs = seg(u, ...W.vals);
    L.chips.forEach((_, i) => { nodes[`valg${i}`] = {opacity: r(a >= W.vals[0] ? clamp((Math.min(u, capU) - W.vals[0]) / (W.vals[1] - W.vals[0])) : 0, 3)}; });
    const lg = seg(u, ...W.legend);
    for (const b of L.bandNodes) {
      const pr = b.when === 'legend' ? lg : b.when === 'key' ? seg(u, ...W.key) : done ? seg(u, ...W[b.when]) : 0;
      nodes[`band-${b.key}`] = {opacity: r(pr, 3)};
    }
    const sem = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      allocation: p.allocation, finalState: p.finalState,
      values: L.vals, widths: f.map(q => r(q * G.S, 3)), valueTexts: L.vtext,
      slide: r(sl, 3), cut: r(ct, 3), spread: r(sp, 3), lift: r(lf, 3), drops,
      valuesShown: L.chips.length ? r(vs, 3) : null,
      inTray: drops.map(q => q >= 1),
      barWhole: !cutDone,
      keyShown: seg(u, ...W.key) >= 1,
      statusShown: done && seg(u, ...W.status) >= 1,
      actionCapped: p.actionProgress < 1 && u > capU,
      trayX: G.trayX.map(x => r(ox + x)), landY: r(oy + G.landY),
      layout: {S: r(L.S), size: L.size, mode: L.mode},
      ...(L.problems.length ? {problems: L.problems} : {}),
    };
    segs.forEach((s0, i) => { sem[`seg${i}`] = s0; });
    blades.forEach((b, j) => { sem[`blade${j}`] = b; });
    return {nodes, semantic: sem};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-10-story',
    title: 'Illustrative loss distribution — blades cut a hypothetical total bar where the supplied values end and the pieces run down rails into one tray per event',
    titleEs: 'Distribución ilustrativa de pérdidas — Microescena con objetos y actores',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Distribución ilustrativa de pérdidas',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A fictional hypothetical total is one bar on a shelf. The supplied value of each fictional event appears under its tray; barrier blades slide to the boundaries those values give, cut the bar and push the pieces apart; each piece runs down its guide rail into its own tray. Both supplied allocations (A proposed, B alternative) are listed at equal weight; only supplied values set the lengths. No share rule, percentage, fault or outcome is stated and no conclusion is drawn.',
    tags: ['causation', 'loss distribution', 'segments', 'supplied values', 'hypothetical', 'allocation', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/distribucion-perdidas.js', 'src/animations/causation/kits/alcance-dano.js', 'src/animations/causation/kits/prueba-contrafactual.js'],
  }),
  sceneSchema,
  defaultParams,
  strings,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
