/**
 * LAW-0690 — Causas concurrentes · mechanism
 *
 * Storyboard (an exploded "model board" in the category's physical vocabulary
 * — tiles on stone pedestals, as the accepted LAW-0686 — not the story's
 * marble racks and not a row of boxes):
 *  0.00–0.18 separate  The stations slide out from the middle into their
 *                      places: route A's release point and one tile per
 *                      supplied event on the left, route B's mirrored on the
 *                      right (wide boxes; on tall boxes route A on the top
 *                      floor, route B on the bottom floor), the vase on its
 *                      pedestal between them. Chips hang under the pedestals.
 *                      Alternatives stand as barricades between two stations.
 *  0.18–0.43 relate    Only the SUPPLIED relationships are drawn, one by one,
 *                      as arcs anchored to the tile tops, in the style of
 *                      their kind (plain relation: no arrowhead; causal only
 *                      where supplied). The last arcs land on the vase at two
 *                      SEPARATE points, one per side. A disputed link carries
 *                      a dashed seal (dashes mean "disputed" only).
 *  0.43–0.75 trace     Two tracer marbles move at the same time, each over its
 *                      own route's elements in the supplied order; the focus
 *                      element swells while a tracer is on it; each marble
 *                      lands on its own side of the vase: nothing added up.
 *  0.75–1.00 gather    Both arrival states at equal weight, the kind legend,
 *                      links, alternatives and the key "As supplied · routes
 *                      not added up · no conclusion drawn".
 * Route identity: colour plus a symmetric solid marker (● route A, ◆ route B)
 * and letter badges — never a dash.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0690
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {str, oneOf, list, obj} from '../../schemas/fields.js';
import {connector} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {kindColor} from '../../frameworks/graph.js';
import {tileArt, lossArt, barrierArt} from './kits/causal-chain.js';
import {packLabels} from './kits/place.js';
import {
  ccFields, CC_STRINGS, ROUTES, resolveRoutes, routeColors, routeBadge, badgeWidth, marbleArt, routeMark, sealArt, linkName,
  flowRows, chipG, balancedG, FLOOR_T, VASE_W, legendColumns, legendFrame, routeItems,
} from './kits/causas-concurrentes.js';

const ID = 'LAW-0690';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {spread: [0.02, 0.16], relate: [0.19, 0.42], trace: [0.45, 0.72], focusUp: 0.035, focusDown: [0.74, 0.78], states: [0.76, 0.82], band: [0.78, 0.86], key: [0.8, 0.86]};
const IDS = ['sourceA', 'a1', 'a2', 'a3', 'a4', 'a5', 'sourceB', 'b1', 'b2', 'b3', 'b4', 'b5', 'loss'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const sceneSchema = {
  ...ccFields,
  elements: list('Labels of the components that are not events: the two release points and the loss card (ids fixed by the scene)', obj('Component', {
    id: oneOf('Component id', ['sourceA', 'sourceB', 'loss']),
    label: str('Visible label', 60),
  }, ['id', 'label']), 0, 3),
  relationships: list('Explicit relationships (only these are drawn). Event ids: a1–a5 / b1–b5 in the supplied order; kind sets the style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source id', IDS),
    to: oneOf('Target id', IDS),
    kind: oneOf('relation | communication | sequence | causal', KINDS),
    label: str('Optional caption for this relationship', 50),
  }, ['from', 'to', 'kind']), 0, 12),
  focusElement: oneOf('Component that swells while a tracer passes it', IDS),
  relationLabels: obj('Caption used for each relation kind in the legend', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracers visit components (each route’s tracer follows the ids of its own route, then the loss)', oneOf('Component id', IDS), 2, 14),
};

const seqRel = (k, n) => [
  {from: `source${k.toUpperCase()}`, to: `${k}1`, kind: 'sequence'},
  ...Array.from({length: n - 1}, (_, i) => ({from: `${k}${i + 1}`, to: `${k}${i + 2}`, kind: 'sequence'})),
  {from: `${k}${n}`, to: 'loss', kind: 'sequence'},
];

const defaultParams = {
  events: {
    a: [
      {label: 'Kitchen tap left running', time: 'T0'},
      {label: 'Sink overflows', time: 'T+4 min'},
      {label: 'Water spreads to the shelf', time: 'T+9 min'},
    ],
    b: [
      {label: 'Roof gutter blocked', time: 'T0'},
      {label: 'Rain seeps through the wall', time: 'T+6 min'},
      {label: 'Water drips onto the shelf', time: 'T+9 min'},
    ],
  },
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase on the shelf cracked'}],
  routeLabels: {a: 'Cause A', b: 'Cause B'},
  elements: [{id: 'sourceA', label: 'Start of route A'}, {id: 'sourceB', label: 'Start of route B'}, {id: 'loss', label: 'Loss (as described)'}],
  relationships: [...seqRel('a', 3), ...seqRel('b', 3)],
  focusElement: 'loss',
  relationLabels: {relation: 'relation (no direction)', communication: 'communication', sequence: 'sequence (as supplied)', causal: 'causal (as supplied)'},
  traversalOrder: ['sourceA', 'a1', 'a2', 'a3', 'loss', 'sourceB', 'b1', 'b2', 'b3', 'loss'],
};

const SHAPES = {
  landscape: {size: 23, baseMin: 20, minSize: 17, modes: ['h']},
  square: {size: 23, baseMin: 20, minSize: 17, modes: ['h', 'v', 'vp']},
  portrait: {size: 25, baseMin: 20.5, minSize: 17, modes: ['v', 'vp']},
};
const MARGIN = 10;
const STONE = '#ddd5c6';
const TW = 0.2; // tile width × tile height (the pilot's tiles)
const PED = 0.34; // pedestal height × tile height

/** Stone pedestal (as the accepted LAW-0686 model board). (x, top) = top-left; stands on groundY. */
function pedestalArt(ctx, {x, top, w, groundY}) {
  const th = ctx.theme;
  const hh = groundY - top;
  return g(null,
    h('path', {d: roundRectPath(x + 6, top + 12, w - 12, Math.max(4, hh - 12), 3), fill: STONE, stroke: th.ink, 'stroke-width': th.stroke}),
    hh > 40 ? h('path', {d: roundRectPath(x + 14, top + 24, w - 28, hh - 40, 3), fill: 'none', stroke: shade(STONE, -0.18), 'stroke-width': 2}) : null,
    h('path', {d: roundRectPath(x, top, w, 14, 4), fill: shade(STONE, 0.1), stroke: th.ink, 'stroke-width': th.stroke}),
  );
}

/** Release point: a short sloped plank with the route's marble held by a striped gate (the story's source, in miniature). */
function sourceArt(ctx, {cx, base, s, route, color}) {
  const th = ctx.theme;
  const w = s * 1.1;
  return g(null,
    h('path', {d: roundRectPath(cx - w / 2, base - s * 0.2, w, s * 0.14, 3), fill: color, stroke: th.ink, 'stroke-width': 2, transform: `rotate(-8 ${r(cx)} ${r(base)})`}),
    g({transform: T(cx - w * 0.18, base - s * 0.52)}, marbleArt(ctx, {R: s * 0.28, color, route})),
    h('path', {d: roundRectPath(cx + w * 0.16, base - s * 0.95, s * 0.16, s * 0.72, 3), fill: '#ffffff', stroke: th.ink, 'stroke-width': 2}),
    [0, 1, 2].map(i => h('path', {d: `M${r(cx + w * 0.16)} ${r(base - s * 0.88 + i * s * 0.22)}h${r(s * 0.16)}v${r(s * 0.1)}h${r(-s * 0.16)}Z`, fill: th.accent})),
  );
}

/**
 * Stations of one layout. 'h' (wide): one floor, route A left → the vase ← route B right (mirror).
 * 'v' (tall): three floors — route A on top, the vase in the middle, route B at the bottom (mirror about the middle);
 * each chip stands beside its tile. 'vp': the same three floors with the chips packed under each floor (longer texts).
 */
function stationOrder(C, mode) {
  const A = ['sourceA', ...C.routes.a.events.map((_, i) => `a${i + 1}`)];
  const B = ['sourceB', ...C.routes.b.events.map((_, i) => `b${i + 1}`)];
  if (mode === 'h') return [{ids: [...A, 'loss', ...B.slice().reverse()]}];
  // tall: each route runs right → left, so its last tile stands at the free left end of its floor
  return [{ids: A.slice().reverse()}, {ids: ['loss']}, {ids: B.slice().reverse()}];
}

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = {w: ctx.design.w, h: cfg.DH ?? ctx.design.h};
  const {C} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const col = routeColors(ctx);
  const size = cfg.size;
  const mode = cfg.mode;
  const elLabel = id => (p.elements.find(e => e.id === id) || {}).label || '';
  const routeOf = id => (id === 'loss' ? null : /^source/.test(id) ? id.slice(6).toLowerCase() : id[0]);
  const nm = id => (id === 'loss' ? t.toLoss : id.startsWith('source') ? `${t.route} ${id.slice(6)}` : id.toUpperCase());

  // ---- station texts
  const textOf = id => {
    if (id === 'loss') return [elLabel('loss'), ...C.losses.map(l => l.label)].filter(Boolean).join(' · ');
    if (id.startsWith('source')) { const k = routeOf(id); return [`${t.route} ${k.toUpperCase()} · ${C.routes[k].name}`, elLabel(id)].filter(Boolean).join(' · '); }
    const k = id[0], i = +id.slice(1) - 1;
    const e = C.routes[k].events[i];
    return `${id.toUpperCase()}. ${e.label}${e.time ? ` · ${e.time}` : ''}`;
  };

  // ---- band: arrival states, kinds legend, links, alternatives, relation labels, key
  // legend mode: the station texts become legend rows (die / badge / vase icons match the tiles) beside or under a
  // larger board; links and alternatives then sit in the route legends instead of the band
  const LEG = Boolean(cfg.legend) && keyOn;
  const COL = LEG && cfg.colW ? cfg.colW : 0;
  const BW = COL ? D.w - COL - MARGIN - 24 : D.w;
  const kindsUsed = KINDS.filter(k => p.relationships.some(q => q.kind === k));
  const bandItems = [];
  if (keyOn) {
    ROUTES.forEach(k => bandItems.push({key: `state${k}`, kind: 'state', route: k, text: `${C.routes[k].name}: ${t.reaches}`}));
    kindsUsed.forEach(k => bandItems.push({key: `kind-${k}`, kind: 'kind', rk: k, text: p.relationLabels[k] || k}));
    if (!LEG) for (const k of ROUTES) {
      C.routes[k].links.forEach((l, i) => {
        const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputedLink : null, l.label || null].filter(Boolean);
        if (bits.length) bandItems.push({key: `lk${k}${i}`, kind: 'link', dim: l.status === 'disputed', text: `${linkName(t, C.routes[k], i)}: ${bits.join(' · ')}`});
      });
    }
    if (!LEG) C.alternatives.forEach((a, j) => bandItems.push({key: `alt${j}`, kind: 'alt', text: `${t.alternative}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed}) · ${linkName(t, C.routes[a.route], a.link)}`}));
    // a relation label identical to the supplied label of the same link is already drawn on that link's chip
    const sameAsLink = q => ROUTES.some(k => C.routes[k].links.some((l, i) => l.label === q.label && q.from === `${k}${i + 1}` && q.to === `${k}${i + 2}`));
    if (allOn) p.relationships.forEach((q, i) => { if (q.label && !sameAsLink(q)) bandItems.push({key: `rl${i}`, kind: 'rlabel', rk: q.kind, text: `${nm(q.from)} → ${nm(q.to)}: ${q.label}`}); });
    bandItems.push({key: 'key', kind: 'key', text: t.key});
  }
  const iconW = size * 1.9;
  const bandW = COL || D.w - 2 * MARGIN;
  const bandChips = bandItems.map(it => {
    const iw = it.kind === 'key' ? 0 : it.kind === 'state' ? badgeWidth(ctx, size * 0.6) + 10 : iconW + 8;
    const mw = Math.min(bandW, cfg.bandItemW ?? 560) - iw;
    const bw = balancedG(ctx, it.text, {maxWidth: mw, size, maxLines: 4});
    const c0 = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size, maxLines: 4});
    return {...it, iw, bw, w: c0.box.w + iw, h: Math.max(c0.box.h, iw ? size * 1.4 : 0), cut: c0.fit.truncated || c0.fit.broken};
  });
  if (bandChips.some(c => c.cut)) return {bad: 'cut'};
  const bandProbe = flowRows(bandChips, {x: MARGIN, y: 0, w: bandW, gap: 18, rowGap: 9});
  let bandH = bandChips.length ? bandProbe.bottom + 14 : 0;
  // legend rows: route A, route B (head = the release point's text), then the shared loss
  let lgPlan = null;
  if (LEG) {
    const itemsOf = k => routeItems(ctx, C, k, {head: textOf(`source${k.toUpperCase()}`)});
    const lossRow = [{key: 'lossel', kind: 'loss', text: textOf('loss')}];
    if (COL) {
      const cx0 = D.w - MARGIN - COL;
      const la = legendColumns(ctx, {cols: [{x: cx0, y: 0, w: COL, items: itemsOf('a')}], size, maxLines: 5, gap: 6, prefix: 'lgq'});
      const yb = la.bottom + 10;
      const lb = legendColumns(ctx, {cols: [{x: cx0, y: yb, w: COL, items: itemsOf('b')}], size, maxLines: 5, gap: 6, prefix: 'lgr'});
      const yl = lb.bottom + 10;
      const ll = legendColumns(ctx, {cols: [{x: cx0, y: yl, w: COL, items: lossRow}], size, maxLines: 5, gap: 6, prefix: 'lgs'});
      if (la.truncated || lb.truncated || ll.truncated) return {bad: 'cut'};
      lgPlan = {cols: [[cx0, 0, itemsOf('a')], [cx0, yb, itemsOf('b')], [cx0, yl, lossRow]], w: COL, bottom: ll.bottom};
      if (ll.bottom + 12 + bandH > D.h) return {bad: 'column', over: ll.bottom + 12 + bandH - D.h};
    } else {
      const cw = (D.w - 2 * MARGIN - 30) / 2;
      const lab = legendColumns(ctx, {cols: ROUTES.map((k, i) => ({x: MARGIN + i * (cw + 30), y: 0, w: cw, items: itemsOf(k)})), size, maxLines: 5, gap: 6, prefix: 'lgq'});
      const yl = lab.bottom + 8;
      const ll = legendColumns(ctx, {cols: [{x: MARGIN, y: yl, w: D.w - 2 * MARGIN, items: lossRow}], size, maxLines: 5, gap: 6, prefix: 'lgs'});
      if (lab.truncated || ll.truncated) return {bad: 'cut'};
      lgPlan = {cols: [[MARGIN, 0, itemsOf('a'), cw], [MARGIN + cw + 30, 0, itemsOf('b'), cw], [MARGIN, yl, lossRow, D.w - 2 * MARGIN]], below: true, h: ll.bottom + 12};
      bandH += lgPlan.h;
    }
  }

  // ---- rows of stations: slot widths, tile height, chips under the pedestals
  const rows = stationOrder(C, mode);
  const avail = COL ? D.h : D.h - bandH;
  const maxSlots = Math.max(...rows.map(rw => rw.ids.length + (rw.ids.includes('loss') && rw.ids.length > 1 ? 0.8 : 0) + (mode === 'v' ? 0.35 : 0)));
  const slotW = (BW - 2 * MARGIN) / maxSlots;
  const chipW = Math.min(slotW * (cfg.chipK ?? 1.9), 420);
  const mkChip = (id, x, y, mw) => chipG(ctx, textOf(id), {x, y, maxWidth: mw, size, maxLines: mode === 'v' ? 8 : (cfg.chipK ?? 1.9) < 1.9 ? 7 : 5, fill: id === 'loss' ? th.accent3Soft : th.card, stroke: id === 'loss' ? th.accent3 : col.of(routeOf(id)), name: `chip-${id}`});
  const V_MODE = mode === 'v' && !LEG;
  // x positions of stations per row: wide boxes share one floor (equal slots, the vase slot wider);
  // tall boxes put each tile at the left of its slot with its chip beside it
  const layoutRow = rw => {
    const n = rw.ids.length;
    const weights = rw.ids.map(id => (id === 'loss' && n > 1 ? 1.8 : mode === 'v' && id.startsWith('source') ? 1.35 : 1));
    const tot = weights.reduce((a2, b2) => a2 + b2, 0);
    const unit = Math.min(slotW, (BW - 2 * MARGIN) / tot);
    const x0 = (BW - unit * tot) / 2;
    let x = x0;
    return rw.ids.map((id, i) => { const w = unit * weights[i]; const c = x + w / 2; const sx = x; x += w; return {id, cx: c, w, sx}; });
  };
  const placed = rows.map(layoutRow);
  let chipPlan, packs;
  if (!V_MODE) {
    chipPlan = rows.map(rw => {
      if (!keyOn || LEG) return {items: []};
      const items = rw.ids.map(id => {
        const mw = id === 'loss' ? Math.min(D.w - 2 * MARGIN, chipW * 1.3) : chipW;
        const c = mkChip(id, 0, 0, mw);
        return {id, mw, w: c.box.w, h: c.box.h, cut: c.fit.truncated || c.fit.broken};
      });
      return {items, cut: items.some(i => i.cut)};
    });
    if (chipPlan.some(cp => cp.cut)) return {bad: 'cut'};
    packs = rows.map((rw, ri) => {
      if (!keyOn || LEG) return {h: 0, pos: []};
      const it = chipPlan[ri].items.map((c, i) => ({x: placed[ri][i].cx, w: c.w, h: c.h}));
      const pos = packLabels(it, {y: 0, minX: MARGIN, maxX: BW - MARGIN, gap: 10, rowGap: 8, maxRows: cfg.maxRows ?? 3});
      return {pos, h: pos.length ? Math.max(...pos.map(q => q.bottom)) + 14 : 0};
    });
  } else {
    packs = rows.map(() => ({h: 0, pos: []}));
    chipPlan = rows.map((rw, ri) => {
      if (!keyOn) return {items: []};
      const items = rw.ids.map((id, i) => {
        const st = placed[ri][i];
        const mw = id === 'loss' ? Math.min(420, D.w * 0.68 - 140 - MARGIN) : st.w - (id.startsWith('source') ? 142 : 64);
        const c = mkChip(id, 0, 0, mw);
        return {id, mw, w: c.box.w, h: c.box.h, cut: c.fit.truncated || c.fit.broken};
      });
      return {items, cut: items.some(i => i.cut)};
    });
    if (chipPlan.some(cp => cp.cut)) return {bad: `cut-${chipPlan.flatMap(cp => cp.items).filter(i => i.cut).map(i => i.id).join('/')}`};
  }
  // tile height: every floor = arc room + tile + pedestal + chips; floors share one tile height
  const arcK = mode === 'h' ? 0.55 : 0.45; // arc room above the tiles (× TH)
  const fixed = packs.reduce((a, pk) => a + pk.h, 0) + FLOOR_T * rows.length + (rows.length - 1) * 16;
  let TH = (avail - fixed) / (rows.length * (1 + PED + arcK));
  TH = Math.min(TH, slotW * 2.6, mode === 'h' ? 420 : 300);
  if (V_MODE && keyOn) {
    const need = Math.max(...chipPlan.flatMap(cp => cp.items.map(c => c.h))) / 0.85;
    if (TH < need) return {bad: 'chips', over: need - TH};
  }
  if (TH < 70) return {bad: `tall[band ${Math.round(bandH)} packs ${packs.map(pk => Math.round(pk.h)).join('+')}]`, over: 70 - TH};
  if (cfg.dry) return {ok: true, TH, cfg: {...cfg, dry: false}};

  // ---- floors
  const floors = [];
  let y = (avail - (rows.length * TH * (1 + PED + arcK) + fixed)) / 2;
  const stations = {};
  rows.forEach((rw, ri) => {
    const top = y + TH * arcK;
    const ground = top + TH * (1 + PED);
    const pedTop = ground - TH * PED;
    const isLossRow = rw.ids.length === 1 && rw.ids[0] === 'loss';
    placed[ri].forEach(st => {
      let pw = Math.min(st.w * 0.62, Math.max(TH * 0.5, st.id === 'loss' ? TH * 0.9 : TH * 0.42));
      if (V_MODE && !isLossRow) pw = st.id.startsWith('source') ? 110 : 44;
      let cx = st.cx;
      if (V_MODE && !isLossRow) cx = st.sx + (st.id.startsWith('source') ? 76 : 32); // tile at the left of its slot, chip beside it
      if (V_MODE && isLossRow) cx = D.w * 0.3;
      // the vase stands on a lower pedestal than the tiles so the shared result can be larger than a tile
      const pt = st.id === 'loss' ? ground - TH * PED * 0.4 : pedTop;
      stations[st.id] = {...st, cx, row: ri, ground, pedTop: pt, floorTop: y, pw, route: routeOf(st.id)};
    });
    // tall boxes: the vase stands on its own short shelf; the route floors run full width
    const pedL = Math.min(...rw.ids.map(id => stations[id].cx - stations[id].pw / 2));
    const f0 = isLossRow && V_MODE ? {x0: stations.loss.cx - stations.loss.pw / 2 - 30, x1: stations.loss.cx + stations.loss.pw / 2 + 30} : V_MODE ? {x0: Math.max(MARGIN, pedL + 4), x1: BW - MARGIN} : {x0: MARGIN, x1: BW - MARGIN};
    floors.push({ground, ...f0, chipsY: ground + FLOOR_T + 8});
    y = ground + FLOOR_T + packs[ri].h + 16;
  });

  // ---- station art
  // tiles read as solid blocks: as wide as their slot allows, up to 0.42 × their height (never thinner than the pilot's)
  const twOf = st => Math.max(TW * TH, Math.min(TH * 0.42, st.w * 0.5, V_MODE ? 40 : 1e9));
  const art = {};
  for (const st of Object.values(stations)) {
    let node, topPt, box;
    if (st.id === 'loss') {
      // the shared result stays prominent (>= ~110 units tall) even when the tiles are small: it may rise into the arc room
      let VH = Math.min(st.pedTop - st.floorTop - 6, Math.max(TH * 1.25, 160));
      VH = Math.min(VH, (st.w * 0.92) / VASE_W);
      const VW = VH * VASE_W;
      node = g(null, g({transform: T(st.cx + VW / 2, st.pedTop)}, lossArt(ctx, {name: 'lossart', w: VW, h: VH, kind: 'vase'}).node));
      box = {x: st.cx - VW / 2, y: st.pedTop - VH, w: VW, h: VH};
      // two SEPARATE landing points on the vase: route A's shoulder and route B's shoulder
      const shL = {x: st.cx - VW * 0.46, y: st.pedTop - VH * 0.72}, shR = {x: st.cx + VW * 0.46, y: st.pedTop - VH * 0.72};
      // wide: A lands on the left shoulder, B on the right; tall: A from above on the rim, B from below on the belly (mirror)
      topPt = mode === 'h' ? {a: shL, b: shR} : {a: {x: st.cx - VW * 0.44, y: st.pedTop - VH * 0.86}, b: {x: st.cx - VW * 0.4, y: st.pedTop - VH * 0.22}};
    } else if (st.id.startsWith('source')) {
      const s = mode === 'v' ? Math.min(100, TH * 0.55) : Math.min(st.w * 0.8, TH * 0.55);
      node = sourceArt(ctx, {cx: st.cx, base: st.pedTop, s, route: st.route, color: col.of(st.route)});
      box = {x: st.cx - s * 0.6, y: st.pedTop - s, w: s * 1.2, h: s};
      topPt = {x: st.cx, y: st.pedTop - s - 4};
    } else {
      const i = +st.id.slice(1) - 1;
      node = g(null,
        g({transform: T(st.cx + twOf(st) / 2, st.pedTop)}, tileArt(ctx, {w: twOf(st), h: TH, index: i, color: col.of(st.route)})),
        routeMark(ctx, {x: st.cx, y: st.pedTop - TH * 0.38, s: Math.max(10, Math.min(twOf(st) * 0.55, 30)), route: st.route}));
      box = {x: st.cx - twOf(st) / 2, y: st.pedTop - TH, w: twOf(st), h: TH};
      topPt = {x: st.cx, y: st.pedTop - TH - 4};
    }
    art[st.id] = {node, topPt, box, pedestal: pedestalArt(ctx, {x: st.cx - st.pw / 2, top: st.pedTop, w: st.pw, groundY: st.ground})};
  }
  const topOf = (id, k) => (id === 'loss' ? art.loss.topPt[k] : art[id].topPt);

  // ---- connectors: only the supplied relationships (arcs above the tiles; the last ones land on the vase)
  const arcBend = (from, to) => {
    if (mode !== 'h' && Math.abs(from.y - to.y) > 40) return (to.y > from.y ? 1 : -1) * (to.x > from.x ? 0.42 : -0.42);
    return to.x > from.x ? -0.32 : 0.32;
  };
  const rels = p.relationships.filter(q => stations[q.from] && stations[q.to] && q.from !== q.to).map((q, i) => {
    const kA = routeOf(q.from) || routeOf(q.to), kB = routeOf(q.to) || routeOf(q.from);
    const from = topOf(q.from, kB), to = topOf(q.to, kA);
    const cn = connector(ctx, {name: `rel${i}`, from, to, kind: q.kind, bend: arcBend(from, to), color: kindColor(ctx, q.kind)});
    let seal = null;
    const mA = /^([ab])(\d)$/.exec(q.from), mB = /^([ab])(\d)$/.exec(q.to);
    if (mA && (q.to === 'loss' || (mB && mB[1] === mA[1] && +mB[2] === +mA[2] + 1))) {
      const L = C.routes[mA[1]].links[+mA[2] - 1];
      if (L && L.status === 'disputed') seal = {at: cn.at(0.5)};
    }
    return {q, cn, seal, i, from, to};
  });
  const seals = rels.filter(x => x.seal).map(x => sealArt(ctx, {name: `relseal${x.i}`, disputed: true, radius: Math.max(12, size * 0.6)}));

  // ---- alternatives: a barricade on the floor between the two stations of its link (never on a path), tethered to the gap
  const bars = C.alternatives.map((a, j) => {
    const A = stations[`${a.route}${a.link + 1}`];
    const B = a.link + 1 < C.routes[a.route].n ? stations[`${a.route}${a.link + 2}`] : stations.loss;
    const gapX = (A.cx + (A.row === B.row ? B.cx : A.cx + (a.route === 'a' ? 1 : -1) * A.w)) / 2;
    const bw = Math.min(Math.abs(B.cx - A.cx) * 0.36, TH * 0.4, 60), bh = Math.min(TH * PED * 0.95, bw * 0.9);
    const ground = A.ground;
    const node = g({name: `bar${j}`, opacity: 0},
      h('path', {d: `M${r(gapX)} ${r(ground - bh)}L${r(gapX)} ${r(A.pedTop - TH * 0.6)}`, stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round'}),
      g({transform: T(gapX, ground)}, barrierArt(ctx, {name: `bar${j}-a`, w: bw, h: bh})));
    return {node, box: {x: gapX - bw / 2, y: ground - bh, w: bw, h: bh}};
  });

  // ---- tracers: each route's marble follows ITS elements in the supplied order, then lands on its own side of the vase
  const tracers = {};
  for (const k of ROUTES) {
    const own = p.traversalOrder.filter(id => id === 'loss' || (stations[id] && routeOf(id) === k));
    const seq = [];
    for (const id of own) if (seq[seq.length - 1] !== id && (id !== 'loss' || seq.length)) seq.push(id);
    const cut = seq.indexOf('loss');
    const order = cut >= 0 ? seq.slice(0, cut + 1) : seq;
    const stops = order.map(id => topOf(id, k));
    const pts = [];
    const stopS = [];
    let acc = 0;
    stops.forEach((q, i) => {
      if (i === 0) { pts.push(q); stopS.push(0); return; }
      const a0 = stops[i - 1];
      const cn = connector(ctx, {name: `tmp${k}${i}`, from: a0, to: q, kind: 'relation', bend: arcBend(a0, q)});
      for (let j = 1; j <= 24; j++) { const pt = cn.at(j / 24); acc += Math.hypot(pt.x - pts[pts.length - 1].x, pt.y - pts[pts.length - 1].y); pts.push({x: pt.x, y: pt.y}); }
      stopS.push(acc);
    });
    const R = Math.max(10, TH * 0.07);
    tracers[k] = {order, pl: pts.length > 1 ? polyline(pts) : null, stopS, total: acc, start: stops[0], node: g({name: `tracer${k}`, opacity: 0}, h('circle', {r: r(R * 1.7), fill: col.of(k), opacity: 0.2}), marbleArt(ctx, {R, color: col.of(k), route: k}))};
  }

  // ---- chips under the pedestals (ticks tie each chip to its station)
  const chips = [];
  rows.forEach((rw, ri) => {
    if (!keyOn) return;
    const fy = floors[ri].chipsY;
    chipPlan[ri].items.forEach((c, i) => {
      const st = stations[c.id];
      if (V_MODE) {
        // beside its tile (below the arcs' crests) or, for the vase, to its left
        const half = c.id === 'loss' ? art.loss.box.w / 2 : Math.max(art[c.id].box.w / 2, 10);
        const x = c.id === 'loss' ? st.cx + half + 24 : st.cx + half + 10;
        const yy = c.id === 'loss' ? st.pedTop - art.loss.box.h / 2 - c.h / 2 : st.pedTop - c.h - 6;
        const cc = mkChip(c.id, x, yy, c.mw);
        chips.push({id: c.id, node: g({name: `chipg-${c.id}`, opacity: 0}, cc.node), box: cc.box});
        return;
      }
      const pos = packs[ri].pos[i];
      const cc = mkChip(c.id, pos.x, fy + pos.y, c.mw);
      chips.push({id: c.id, node: g({name: `chipg-${c.id}`, opacity: 0},
        h('line', {x1: r(st.cx), x2: r(st.cx), y1: r(st.ground + FLOOR_T - 2), y2: r(fy + pos.y), stroke: c.id === 'loss' ? th.accent3 : col.of(st.route), 'stroke-width': 2, opacity: 0.8}),
        cc.node), box: cc.box});
    });
  });

  // ---- band
  // text: legend rows (legend mode) then the band — under the board, or in the right-hand column
  let lg = {rows: []};
  let bandTop = D.h - bandH + 6, bandX = MARGIN;
  if (lgPlan) {
    const top0 = COL ? 0 : D.h - bandH + 6;
    const rowsAll = [];
    lgPlan.cols.forEach(([x, y, items, w], j) => {
      const L0 = legendColumns(ctx, {cols: [{x, y: top0 + y, w: w || lgPlan.w, items}], size, maxLines: 5, gap: 6, prefix: `lg${j}`});
      rowsAll.push(...L0.rows);
    });
    lg = {rows: rowsAll};
    if (COL) { bandTop = lgPlan.bottom + 12; bandX = D.w - MARGIN - COL; } else bandTop = top0 + lgPlan.h;
  }
  const band = flowRows(bandChips, {x: bandX, y: bandTop, w: bandW, gap: 18, rowGap: 9}).placed.map(it => {
    const c0 = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: it.bw, size, maxLines: 4});
    const c = chipG(ctx, it.text, {x: it.x + it.iw, y: it.y + (it.h - c0.box.h) / 2, maxWidth: it.bw, size, maxLines: 4,
      fill: it.kind === 'alt' ? th.accentSoft : th.card, stroke: it.kind === 'alt' ? th.accent : it.kind === 'state' ? col.of(it.route) : th.inkSoft});
    const cy = it.y + it.h / 2;
    let icon = null;
    if (it.kind === 'kind' || it.kind === 'rlabel') {
      const cn = connector(ctx, {name: `lg-${it.key}`, from: {x: it.x + 2, y: cy}, to: {x: it.x + iconW - 2, y: cy}, kind: it.rk, bend: 0, color: kindColor(ctx, it.rk)});
      icon = {cn, node: cn.node};
    } else if (it.kind === 'link') icon = {node: g({transform: T(it.x + iconW / 2, cy)}, sealArt(ctx, {radius: size * 0.55, disputed: it.dim, opacity: 1}))};
    else if (it.kind === 'alt') icon = {node: g({transform: T(it.x + iconW / 2, cy + size * 0.6)}, barrierArt(ctx, {name: `lgb-${it.key}`, w: iconW * 0.9, h: size * 1.2}))};
    else if (it.kind === 'state') icon = {node: routeBadge(ctx, {x: it.x + Math.max(size * 0.6, Math.max(size * 0.63, 17) * 0.8), y: cy, R: size * 0.6, color: col.of(it.route), letter: it.route.toUpperCase()})};
    return {key: it.key, kind: it.kind, icon, node: g({name: `band-${it.key}`, opacity: 0}, icon && icon.node, c.node)};
  });

  const boardTop = Math.min(...Object.values(art).map(a2 => a2.box.y)) - TH * arcK;
  const boardBottom = Math.max(...floors.map(f => f.ground)) + FLOOR_T;
  return {boardShare: (boardBottom - boardTop) / D.h, lg, legend: LEG, colW: COL, BW, stations, art, floors, rels, seals, bars, tracers, chips, band, TH, size, mode, bandH, ports: {a: topOf('loss', 'a'), b: topOf('loss', 'b')}};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const SH = SHAPES[ctx.view.shape];
    const C = resolveRoutes(ctx.params);
    const base = {C};
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 1) out.push(s); out.push(b); return out; };
    let pick = null;
    // every size that fits; then the largest tiles among sizes close to the largest that fits (text stays >= baseMin)
    const cands = [];
    for (const size of sizesIn(SH.size, SH.minSize)) {
      const sq = ctx.view.shape === 'square';
      const cfgs = [];
      // labels hidden on a square: the three-floor board fills the height
      for (const mode of !ctx.show('key') && sq ? ['vp'] : SH.modes) {
        for (const chipK of mode === 'h' && sq ? [1.9, 1.65] : [1.9]) for (const maxRows of mode === 'h' && sq ? [3, 2] : [3]) cfgs.push({mode, size, chipK, maxRows});
      }
      if (ctx.show('key')) {
        // legend mode: tiles keep the board, the station texts move to legend rows under it or in a right-hand column
        cfgs.push({mode: ctx.view.shape === 'portrait' ? 'vp' : 'h', size, legend: true});
        if (sq) for (const f of [0.34, 0.38, 0.42]) cfgs.push({mode: 'vp', size, legend: true, colW: ctx.design.w * f});
      }
      for (const cfg of cfgs) { const X = compose(ctx, base, {...cfg, dry: true}); if (X.ok) cands.push({...X, size}); }
    }
    if (cands.length) {
      const maxSize = Math.max(...cands.map(c => c.size));
      const lo = maxSize >= SH.baseMin ? Math.max(SH.baseMin, maxSize - 4) : maxSize;
      pick = cands.filter(c => c.size >= lo - 1e-9).sort((a, b) => b.TH - a.TH || b.size - a.size)[0];
      // the board stays the subject (item 18): when the tiles would be small at that size, step the text down (never
      // below the floor) to the largest size whose tiles are at least TH_MIN tall, else take the largest tiles
      const TH_MIN = 140;
      if (pick.TH < TH_MIN) {
        const big = cands.filter(c => c.TH >= TH_MIN).sort((a, b) => b.size - a.size || b.TH - a.TH)[0];
        pick = big || cands.slice().sort((a, b) => b.TH - a.TH || b.size - a.size)[0];
      }
    }
    let L;
    if (pick) { L = compose(ctx, base, pick.cfg); L.kScale = 1; L.fallback = false; } else {
      let found = null;
      for (let DH = ctx.design.h + 20; DH <= ctx.design.h * 3 && !found; DH += 20) {
        for (const mode of SH.modes) { const X = compose(ctx, base, {mode, size: SH.minSize, DH, dry: true}); if (X.ok) { found = X.cfg; break; } }
      }
      if (!found) found = {mode: 'h', size: SH.minSize, DH: ctx.design.h * 3};
      L = compose(ctx, base, found);
      L.kScale = ctx.design.h / found.DH;
      L.fallback = true;
    }
    L.dx = (ctx.design.w - ctx.design.w * L.kScale) / 2;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const slab = f => g(null,
      h('path', {d: `M${r(f.x0)} ${r(f.ground - 10)}H${r(f.x1)}L${r(f.x1 + 6)} ${r(f.ground + 8)}H${r(f.x0 - 6)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(f.x0 - 6)} ${r(f.ground + 8)}H${r(f.x1 + 6)}V${r(f.ground + FLOOR_T - 4)}H${r(f.x0 - 6)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}));
    return g({transform: L.kScale < 1 ? T(L.dx, 0, 0, L.kScale) : null},
      g({name: 'floors'}, L.floors.map(slab)),
      L.bars.map(b => b.node),
      Object.entries(L.art).map(([id, a]) => g({name: `st-${id}`, opacity: 0}, a.pedestal, g({name: `sta-${id}`}, a.node))),
      L.rels.map(x => x.cn.node),
      L.seals,
      L.chips.map(c => c.node),
      L.lg.rows.map(rw => rw.node),
      ROUTES.map(k => L.tracers[k].node),
      L.band.map(b => b.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const sp = ease.inOutCubic(seg(u, ...W.spread));
    const midX = ctx.design.w / 2;
    const tr = {a: null, b: null};
    const visited = {a: [], b: []};
    const focusScaleOf = {};
    for (const k of ROUTES) {
      const T0 = L.tracers[k];
      const tp = seg(u, ...W.trace);
      const s = T0.total * ease.inOutSine(tp);
      const pt = T0.pl ? T0.pl.at(T0.total ? s / T0.total : 0) : T0.start;
      tr[k] = {x: r(pt.x), y: r(pt.y)};
      T0.order.forEach((id, i) => { if (u >= W.trace[0] && s >= T0.stopS[i] - 1e-6) visited[k].push(id); });
      nodes[`tracer${k}`] = {opacity: u >= W.trace[0] ? 1 : 0, transform: T(pt.x, pt.y)};
      const fi = T0.order.indexOf(p.focusElement);
      if (fi >= 0 && T0.total) {
        const arriveU = W.trace[0] + (W.trace[1] - W.trace[0]) * invSine(T0.stopS[fi] / T0.total);
        const leaveU = fi + 1 < T0.order.length ? W.trace[0] + (W.trace[1] - W.trace[0]) * invSine(T0.stopS[fi + 1] / T0.total) : W.focusDown[0];
        const up = seg(u, arriveU - W.focusUp, arriveU);
        const down = fi + 1 < T0.order.length ? seg(u, leaveU, leaveU + W.focusUp * 1.2) : seg(u, ...W.focusDown);
        focusScaleOf[k] = 1 + 0.12 * ease.inOutCubic(up) * (1 - ease.inOutCubic(down));
      }
    }
    const focusScale = Math.max(1, ...Object.values(focusScaleOf));
    // separate: every station slides out from the middle into its place (translation only, never scaled down)
    for (const [id, st] of Object.entries(L.stations)) {
      const dx = (midX - st.cx) * 0.2 * (1 - sp);
      nodes[`st-${id}`] = {opacity: r(clamp(sp * 1.6), 3), transform: `translate(${r(dx)} 0)`};
      const sc = id === p.focusElement ? focusScale : 1;
      nodes[`sta-${id}`] = {transform: sc !== 1 ? `translate(${r(st.cx)} ${r(st.pedTop)}) scale(${r(sc, 4)}) translate(${r(-st.cx)} ${r(-st.pedTop)})` : ''};
    }
    L.chips.forEach(c => { nodes[`chipg-${c.id}`] = {opacity: r(clamp((sp - 0.3) / 0.7), 3)}; });
    Object.assign(nodes, legendFrame(L.lg.rows, () => clamp((sp - 0.3) / 0.7)));
    L.bars.forEach((b, j) => { nodes[`bar${j}`] = {opacity: r(clamp((sp - 0.5) * 2), 3)}; });
    const nR = L.rels.length;
    const drawn = L.rels.map((x, i) => {
      const a0 = W.relate[0] + ((W.relate[1] - W.relate[0]) * i) / Math.max(1, nR);
      const pr = ease.inOutCubic(seg(u, a0, a0 + ((W.relate[1] - W.relate[0]) / Math.max(1, nR)) * 1.4));
      Object.assign(nodes, x.cn.frame(pr, pr > 0 ? 1 : 0));
      return r(pr, 3);
    });
    L.rels.forEach((x, i) => { if (x.seal) nodes[`relseal${x.i}`] = {transform: T(x.seal.at.x, x.seal.at.y), opacity: drawn[i] >= 1 ? 1 : 0}; });
    for (const b of L.band) {
      const pr = b.kind === 'key' ? seg(u, ...W.key) : b.kind === 'state' ? seg(u, ...W.states) : seg(u, ...W.band);
      nodes[`band-${b.key}`] = {opacity: r(pr, 3)};
      if (b.icon && b.icon.cn) Object.assign(nodes, b.icon.cn.frame(pr > 0 ? 1 : 0, 1));
    }
    const kinds = L.rels.map(x => ({kind: x.q.kind, arrow: x.q.kind !== 'relation'}));
    // every connector ends at its element (the top of its tile / source, or its own landing point on the vase)
    const gaps = L.rels.map(x => {
      const endA = x.q.from === 'loss' ? L.ports[x.q.to[0]] : L.art[x.q.from].topPt;
      const endB = x.q.to === 'loss' ? L.ports[x.q.from[0] === 's' ? x.q.from.slice(6).toLowerCase() : x.q.from[0]] : L.art[x.q.to].topPt;
      return r(Math.max(Math.hypot(x.cn.from.x - endA.x, x.cn.from.y - endA.y), Math.hypot(x.cn.to.x - endB.x, x.cn.to.y - endB.y)), 1);
    });
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      spread: r(sp, 3),
      relationsDrawn: drawn,
      kinds,
      connectorGaps: gaps,
      tracerA: tr.a, tracerB: tr.b,
      tracerVisible: u >= W.trace[0],
      visitOrderA: visited.a, visitOrderB: visited.b,
      atLoss: {a: visited.a.includes('loss'), b: visited.b.includes('loss')},
      portsApart: r(Math.hypot(L.ports.a.x - L.ports.b.x, L.ports.a.y - L.ports.b.y), 1),
      tracersApart: r(Math.hypot(tr.a.x - tr.b.x, tr.a.y - tr.b.y), 1),
      focusScale: r(focusScale, 3),
      stateShown: r(seg(u, ...W.states), 3),
      layout: {boardShare: r(L.boardShare, 3), size: r(L.size), mode: L.mode, legend: L.legend, boardW: r(L.BW), TH: r(L.TH), k: r(L.kScale, 3), fallback: L.fallback},
    };
    return {nodes, semantic};
  },
};

/** Inverse of ease.inOutSine on [0,1]. */
function invSine(y) {
  return Math.acos(1 - 2 * clamp(y)) / Math.PI;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-03-mechanism',
    title: 'Concurrent causes — a model board: two routes of tiles converge on one vase',
    titleEs: 'Causas concurrentes — Mecanismo o relación explicada',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Causas concurrentes',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A model board of the two supplied routes: a release point and one tile on a pedestal per event for each route, converging from opposite sides on one vase on a pedestal. Only the supplied relationships are drawn as arcs in the style of their kind (causal only where supplied); two tracer marbles move concurrently in the supplied order, the focus element swells, and each lands on its own side of the vase. Equal weight; nothing joined or added up.',
    tags: ['causation', 'concurrent causes', 'mechanism', 'two routes', 'model board', 'tiles', 'pedestals', 'tracer', 'relation kinds'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/causas-concurrentes.js', 'src/animations/causation/kits/causal-chain.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
