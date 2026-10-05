/**
 * LAW-0694 — Evento interviniente · mechanism
 *
 * Storyboard (an exploded "sequence board", not the story's stage and not a
 * row of boxes: each piece stands on its own pedestal on a rail, and the later
 * event arrives on a spur rail that joins the main rail like a switch):
 *  0.00–0.18 separate  The pedestals of the initial sequence (die faces = the
 *                      supplied order) stand close together on the main rail,
 *                      ending at the loss (vase). The pieces after the entry
 *                      point slide apart to open a gap, and the later event
 *                      (◆ tile) slides down the spur rail from its dock into
 *                      the gap. Each piece's label chip hangs from it.
 *  0.18–0.43 relate    Only the supplied relations are drawn, one by one, in
 *                      the order of the sequence after entry: sequence arrows
 *                      by default, a thick accent arrow only for a link
 *                      supplied as causal, a dotted line without arrowhead for
 *                      a disputed link; each alternative is tied to its link by
 *                      a plain relation (no arrow); extra supplied
 *                      relationships use their own kind. A strip names each
 *                      kind used (relationLabels).
 *  0.43–0.75 trace     A tracer runs the supplied traversal order along those
 *                      relations; the focus element (default: the later event)
 *                      grows while the tracer passes it and stays marked.
 *  0.75–1.00 gather    Tracer gone; origin (first piece), the entered piece and
 *                      the loss stay visible with every label, the kinds strip
 *                      and the key "As supplied · no conclusion drawn". No
 *                      relation is shown as causal unless supplied; nothing is
 *                      said about interruption, responsibility or outcome.
 * Wide/square boxes: horizontal rail, labels hang below in up to three rows.
 * Tall boxes: vertical rail on the left, labels to the right.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0694
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, oneOf, list, obj} from '../../schemas/fields.js';
import {connector, tracer} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {shade} from '../../primitives/paper.js';
import {unionBounds, packLabels} from './kits/place.js';
import {tileArt, tileColor, lossArt, barrierArt} from './kits/causal-chain.js';
import {ieFields, IE_STRINGS, resolveIE, addedTileArt, chipG, balancedG, legendIcon, clampNote, pieceName} from './kits/evento-interviniente.js';

const ID = 'LAW-0694';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  appear: [0, 0.05], chips: [0.02, 0.1], open: [0.04, 0.11], slide: [0.08, 0.17], chipX: [0.15, 0.19],
  relate: [0.19, 0.42], trace: [0.44, 0.74], out: [0.74, 0.77], strip: [0.2, 0.26], key: [0.78, 0.84],
};
const IDS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'x', 'alt1', 'alt2', 'loss'];
const STONE = '#ddd5c6';
const FONT = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

const sceneSchema = {
  ...ieFields,
  elements: list('Optional label overrides by component id (e1–e6 = events of the initial sequence, x = the later event, alt1–alt2 = alternatives, loss)', obj('Component label', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 90),
  }, ['id', 'label']), 0, 10),
  relationships: list('Extra explicit relationships between components; the kind sets the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal', ['relation', 'communication', 'sequence', 'causal']),
    label: str('Caption for this relationship', 60),
  }, ['from', 'to', 'kind']), 0, 2),
  focusElement: oneOf('Component enlarged while the tracer passes (default: the later event)', IDS),
  relationLabels: obj('Captions for each connection kind', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links', 50),
    causal: str('Caption for supplied causal links', 50),
    disputed: str('Caption for disputed links', 50),
  }),
  traversalOrder: list('Order in which the tracer visits components (ids as in elements)', oneOf('Component id', IDS), 2, 10),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+2 min'},
    {label: 'Display stand shakes', time: 'T+3 min'},
  ],
  addedEvent: {label: 'Cleaner nudges the stand', time: 'T+2 min', after: 1},
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  elements: [],
  relationships: [],
  focusElement: 'x',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence (supplied order)', causal: 'causal (as supplied)', disputed: 'disputed link'},
  traversalOrder: ['e1', 'e2', 'x', 'e3', 'e4', 'loss'],
};

const SHAPES = {
  landscape: {size: 24, baseMin: 20, minSize: 17, modes: ['h']},
  square: {size: 24, baseMin: 20, minSize: 17, modes: ['h', 'v']},
  portrait: {size: 30, baseMin: 20.5, minSize: 17, modes: ['g', 'v']},
};
const MARGIN = 12;

/** Stone pedestal; (x, top) = top-left; stands on groundY. */
function pedestalArt(ctx, {x, top, w, groundY}) {
  const th = ctx.theme;
  const hh = groundY - top;
  return g(null,
    h('path', {d: roundRectPath(x + 6, top + 10, w - 12, Math.max(4, hh - 10), 3), fill: STONE, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(x, top, w, 12, 4), fill: shade(STONE, 0.1), stroke: th.ink, 'stroke-width': th.stroke}),
  );
}

/** Element id of each piece of the sequence after entry (and of the loss). */
const pieceId = (M, j) => (j >= M.N ? 'loss' : M.pieces[j].kind === 'added' ? 'x' : `e${M.pieces[j].i + 1}`);

function compose(ctx, base, cfg) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const size = cfg.size;
  const grid = cfg.mode === 'g';
  const vert = cfg.mode === 'v' || grid;
  const S = M.N + 1; // stations: pieces, then the loss
  const over = id => (p.elements || []).find(e => e.id === id)?.label;
  const labelOf = j => {
    if (j >= M.N) return over('loss') ?? `${t.lossAs}: ${M.losses.map(l => l.label).join(' · ')}`;
    const pc = M.pieces[j];
    if (pc.kind === 'added') { const ad = M.added; return over('x') ?? `${t.added}: ${ad.label}${ad.time ? ` · ${ad.time.replace(/ /g, ' ')}` : ''}`; }
    const e = M.events[pc.i];
    return over(`e${pc.i + 1}`) ?? `${pc.i + 1}. ${e.label}${e.time ? ` · ${e.time.replace(/ /g, ' ')}` : ''}`;
  };
  const chipW = cfg.chipW;
  const chips = keyOn ? Array.from({length: S}, (_, j) => {
    const text = labelOf(j);
    const mw = vert ? chipW : balancedG(ctx, text, {maxWidth: chipW, size, maxLines: cfg.maxLines ?? 4});
    const c = chipG(ctx, text, {x: 0, y: 0, maxWidth: mw, size, maxLines: cfg.maxLines ?? 4});
    return {text, mw, w: c.box.w, h: c.box.h, bad: c.fit.truncated || c.fit.broken};
  }) : [];
  if (chips.some(c => c.bad)) return {bad: 'chip'};

  // ---- strip: kinds used, alternatives, extra relationships, clamp note, key
  const kinds = [];
  M.links.forEach(l => { const k0 = l.status === 'disputed' ? 'disputed' : l.kind === 'causal' ? 'causal' : 'sequence'; if (!kinds.includes(k0)) kinds.push(k0); });
  if (M.alternatives.length && !kinds.includes('relation')) kinds.push('relation');
  (p.relationships || []).forEach(rl => { if (!kinds.includes(rl.kind)) kinds.push(rl.kind); });
  const strip = [];
  if (keyOn) {
    kinds.forEach(k0 => strip.push({key: `kind-${k0}`, kind: k0, text: (p.relationLabels || {})[k0] || t[k0] || k0, sample: true}));
    M.alternatives.forEach((a, j) => strip.push({key: `alt${j}`, icon: 'alt', text: `${over(`alt${j + 1}`) ?? `${t.other}: ${a.label}`} (${a.status === 'alleged' ? t.alleged : t.proposed})`}));
    M.links.forEach(l => { if (l.label) strip.push({key: `lk${l.from}`, text: `${t.link} ${pieceName(t, M, l.from)} → ${pieceName(t, M, l.from + 1)}: ${l.label}`}); });
    (p.relationships || []).forEach((rl, i) => { if (rl.label) strip.push({key: `rl${i}`, kind: rl.kind, sample: true, text: `${rl.from} — ${rl.to}: ${rl.label}`}); });
    const cn = clampNote(ctx, M);
    if (cn) strip.push({key: 'clamp', text: cn});
    strip.push({key: 'key', text: t.key});
  }
  const sampleW = size * 2.6;
  const stripItems = strip.map(it => {
    const iw = it.sample ? sampleW + 10 : it.icon ? size * 1.45 + 12 : 0;
    const mw = Math.min(cfg.stripW - iw, 560);
    const bw = balancedG(ctx, it.text, {maxWidth: mw, size, maxLines: 4});
    const c = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size, maxLines: 4});
    return {...it, iw, bw, w: c.box.w + iw, h: Math.max(c.box.h, it.icon ? size * 1.45 : 0), bad: c.fit.truncated || c.fit.broken};
  });
  if (stripItems.some(c => c.bad)) return {bad: 'strip'};
  const flowOf = (x0, y0, w0) => {
    let x = x0, y = y0, rh = 0;
    const out = [];
    for (const it of stripItems) {
      if (x > x0 && x + it.w > x0 + w0) { x = x0; y += rh + 10; rh = 0; }
      out.push({...it, x, y});
      x += it.w + 18; rh = Math.max(rh, it.h);
    }
    return {out, bottom: out.length ? y + rh : y0};
  };

  // ---- geometry
  let Ht, step, stations = [], chipPos = [], stripY, stripX, stripW, dock, trackY, trackX, gridInfo = null;
  const altN = M.alternatives.length;
  if (!vert) {
    // horizontal rail; station centres evenly spaced; labels below in rows; dock + alternatives above
    const x0 = MARGIN + 40, x1 = D.w - MARGIN - 40;
    step = (x1 - x0) / Math.max(1, S - 1 + 0.9);
    const xs = Array.from({length: S}, (_, j) => x0 + step * 0.45 + j * step);
    const stripProbe = flowOf(0, 0, cfg.stripW);
    const packed = keyOn ? packLabels(chips.map((c, j) => ({x: xs[j], w: c.w, h: c.h})), {y: 0, minX: MARGIN, maxX: D.w - MARGIN, maxRows: 3, gap: 12, rowGap: 10}) : [];
    const chipsH = keyOn ? Math.max(...packed.map(q => q.bottom)) : 0;
    const textH = (keyOn ? chipsH + 22 : 0) + (stripItems.length ? stripProbe.bottom + 16 : 0);
    // above the rail: the dock of the later event (1.25·Ht), the station (1.35·Ht)
    const extraN = (p.relationships || []).length;
    const head = 2.72 + (altN ? 0.3 : 0); // (headroom: lift, alternatives; arcs over the lift need a fixed band more)
    const arcBand = extraN ? 100 : 0;
    Ht = Math.min(step * 1.5, (step - 70) / 0.3, (D.h - textH - 30 - arcBand) / head, 320);
    if (Ht < 90) return {bad: 'H', Ht};
    trackY = 20 + arcBand + head * Ht;
    stations = xs.map(x => ({x, y: trackY}));
    const chipTop = trackY + 22;
    chipPos = packed.map(q => ({x: q.x, y: chipTop + q.y}));
    stripY = chipTop + (keyOn ? chipsH + 22 : 0);
    stripX = MARGIN; stripW = D.w - 2 * MARGIN;
    // the dock sits between the piece before the slot and the closed-up piece after it, level with the tile tops
    // the later event waits on a lift right above its slot, clear of the closed-up piece under it
    dock = {x: xs[M.k], y: trackY - Ht * 1.3 - 16};
  } else if (grid) {
    // tall boxes: two columns of pedestals — down the left one, across the bottom, up the right one — labels on the
    // outer sides, the later event's dock and the alternatives in the gap between the columns
    const n1 = Math.ceil(S / 2);
    const topY = 30, botY = D.h - (stripItems.length ? flowOf(0, 0, cfg.stripW).bottom + 20 : 0) - 10;
    step = (botY - topY) / (n1 - 0.25);
    Ht = Math.min(step / 1.42, cfg.htMax ?? 240);
    if (Ht < 80) return {bad: 'H', Ht};
    const pw0 = Math.max(Math.min(0.6 * Ht, 120) + 22, Ht * 0.42);
    const gapIn = pw0 + 60; // (between the pedestals: the dock, one pedestal wide, with ~30 on each side)
    const chipSide = (D.w - 2 * MARGIN - 2 * pw0 - gapIn - 48) / 2;
    if (keyOn && chipSide < size * 7) return {bad: 'chipside'};
    const xL = MARGIN + chipSide + 24 + pw0 / 2, xR = xL + pw0 + gapIn;
    const rowOf = j => (j < n1 ? j : 2 * n1 - 1 - j);
    stations = Array.from({length: S}, (_, j) => ({x: j < n1 ? xL : xR, y: topY + 1.35 * Ht + rowOf(j) * step}));
    // labels re-fitted to the side width
    for (let j = 0; j < chips.length; j++) {
      const c = chips[j];
      const mw = balancedG(ctx, c.text, {maxWidth: chipSide, size, maxLines: cfg.maxLines ?? 4});
      const f = chipG(ctx, c.text, {x: 0, y: 0, maxWidth: mw, size, maxLines: cfg.maxLines ?? 4});
      if (f.fit.truncated || f.fit.broken) return {bad: 'chip', why: c.text.slice(0, 30) + (f.fit.broken ? '/broken' : '/trunc') + Math.round(chipSide)};
      chips[j] = {...c, mw, w: f.box.w, h: f.box.h};
    }
    chipPos = chips.map((c, j) => ({x: j < n1 ? xL - pw0 / 2 - 22 - c.w : xR + pw0 / 2 + 22, y: stations[j].y - 0.65 * Ht - c.h / 2}));
    for (let j = 0; j < chipPos.length; j++) for (let q = 0; q < j; q++) {
      if ((q < n1) === (j < n1) && chipPos[j].y < chipPos[q].y + chips[q].h + 6 && chipPos[q].y < chipPos[j].y + chips[j].h + 6) return {bad: 'chiph'};
    }
    if (chipPos.some((q, j) => q.y < 0 || q.y + chips[j].h > botY)) return {bad: 'chipy'};
    stripY = botY + 14; stripX = MARGIN; stripW = D.w - 2 * MARGIN;
    const kx = stations[M.k].x;
    dock = {x: kx === xL ? xL + pw0 + 30 : xR - pw0 - 30, y: stations[M.k].y};
    trackX = null; trackY = null;
    gridInfo = {xL, xR, n1, gapX: (xL + xR) / 2};
  } else {
    // vertical rail on the left; labels to the right; dock + alternatives left of the rail
    const topY = 30, botY = D.h - (stripItems.length ? flowOf(0, 0, cfg.stripW).bottom + 20 : 0) - 10;
    step = (botY - topY) / (S - 0.2);
    Ht = Math.min(step / 1.42, 230);
    if (Ht < 70) return {bad: 'H', Ht};
    const pw0 = Math.max(Math.min(0.8 * Ht, 150) + 22, Ht * 0.42);
    trackX = MARGIN + 1.5 * pw0 + 56;
    stations = Array.from({length: S}, (_, j) => ({x: trackX, y: topY + 1.35 * Ht + j * step}));
    const cx = trackX + pw0 / 2 + 26;
    const cw = D.w - MARGIN - cx;
    if (keyOn && chips.some(c => c.w > cw + 1)) return {bad: 'chipw'};
    chipPos = chips.map((c, j) => ({x: cx, y: stations[j].y - 0.65 * Ht - c.h / 2}));
    // chips must not overlap each other
    for (let j = 1; j < chipPos.length; j++) if (chipPos[j].y < chipPos[j - 1].y + chips[j - 1].h + 6) return {bad: 'chiph'};
    stripY = botY + 14; stripX = MARGIN; stripW = D.w - 2 * MARGIN;
    dock = {x: trackX - pw0 - 36, y: stations[M.k].y};
    trackY = null;
  }
  if (cfg.dry) return {Ht, size, cfg: {...cfg, dry: false}};

  // ---- stations (pedestal + tile/vase), each in a group so it can slide and grow
  const tw = grid ? Math.min(0.6 * Ht, 120) : vert ? Math.min(0.8 * Ht, 150) : Ht * 0.3; // wider than the stage tiles, so the die face reads (tall boxes: chunky blocks)
  const pedW = Math.max(tw + 22, Ht * 0.42), pedH = Ht * 0.3;
  const stationNodes = stations.map((st, j) => {
    const isLoss = j >= M.N;
    const pc = isLoss ? null : M.pieces[j];
    const tileH = Ht;
    let art;
    if (isLoss) art = g({transform: T(Ht * 0.18, -pedH)}, lossArt(ctx, {name: `st${j}-vase`, w: Ht * 0.36, h: Ht * 0.62, kind: 'vase'}).node);
    else if (pc.kind === 'added') art = g({transform: T(tw / 2, -pedH)}, addedTileArt(ctx, {w: tw, h: tileH}));
    else art = g({transform: T(tw / 2, -pedH)}, tileArt(ctx, {w: tw, h: tileH, index: pc.i, color: tileColor(ctx, pc.i)}));
    return g({name: `st${j}`, transform: T(st.x, st.y)},
      g({name: `st${j}-grow`},
        pedestalArt(ctx, {x: -pedW / 2, top: -pedH, w: pedW, groundY: 0}),
        art));
  });
  // element boxes (at rest) for connectors
  const boxOf = j => {
    const st = stations[j];
    return {x: st.x - pedW / 2, y: st.y - pedH - Ht, w: pedW, h: Ht + pedH};
  };
  const tileMid = j => ({x: stations[j].x, y: stations[j].y - pedH - Ht * (j >= M.N ? 0.31 : 0.5)});
  // the rail
  const railD = grid
    ? `M${r(gridInfo.xL)} ${r(stations[0].y - Ht * 1.5)}V${r(stations[gridInfo.n1 - 1].y + 10)}H${r(gridInfo.xR)}V${r(Math.min(...stations.slice(gridInfo.n1).map(q => q.y)) - Ht * 1.5)}`
    : vert
    ? `M${r(trackX)} ${r(stations[0].y - Ht * 1.5)}V${r(stations[S - 1].y + 10)}`
    : `M${r(stations[0].x - step * 0.4)} ${r(trackY + 4)}H${r(stations[S - 1].x + step * 0.4)}`;
  const rail = g(null,
    h('path', {d: railD, stroke: th.metalDark, 'stroke-width': 10, 'stroke-linecap': 'round', fill: 'none'}),
    h('path', {d: railD, stroke: th.metal, 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none'}));
  // spur rail: from the dock down to the gap
  const gapPt = stations[M.k];
  const spurLine = (x1, y1, x2, y2) => g(null,
    h('path', {d: `M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}`, stroke: th.metalDark, 'stroke-width': 8, 'stroke-linecap': 'round', fill: 'none'}),
    h('path', {d: `M${r(x1)} ${r(y1)}L${r(x2)} ${r(y2)}`, stroke: addedColorOf(ctx), 'stroke-width': 3, 'stroke-linecap': 'round', fill: 'none'}));
  const topY = dock.y - pedH - Ht - 14;
  const spur = vert
    ? (() => {
      const sd = Math.sign(gapPt.x - dock.x) || 1; // the dock is on this side of the slot (−1: right of it)
      const back = dock.x - sd * (pedW / 2 + 10);
      return g({name: 'spur'}, [-1, 1].map(sg => spurLine(back, gapPt.y + sg * 6 - 2, gapPt.x - sd * (pedW / 2 + 4), gapPt.y + sg * 6 - 2)),
        h('path', {d: roundRectPath(back - sd * 10 - 6, gapPt.y - pedH - Ht * 0.22, 12, Ht * 0.22 + pedH, 4), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2})); // (a low stop: the links at mid-tile height pass over it)
    })()
    : g({name: 'spur'}, [-1, 1].map(sg => spurLine(gapPt.x + sg * (pedW / 2 + 8), topY, gapPt.x + sg * (pedW / 2 + 8), gapPt.y - pedH - Ht - 10)),
      h('path', {d: roundRectPath(gapPt.x - pedW / 2 - 16, topY - 10, pedW + 32, 14, 4), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}));

  // ---- relations: consecutive pieces (sequence / causal / disputed), from tile edge to tile edge
  const conns = [];
  for (let j = 0; j < S - 1; j++) {
    const l = M.links[j];
    const kind = l.status === 'disputed' ? 'disputed' : l.kind === 'causal' ? 'causal' : 'sequence';
    const A = boxOf(j), B = boxOf(j + 1);
    let from, to;
    if (Math.abs(stations[j].x - stations[j + 1].x) < 1) {
      // same column: down (or up, in the second column of a two-column board)
      const down = stations[j + 1].y > stations[j].y;
      from = down ? {x: stations[j].x, y: A.y + A.h + 4} : {x: stations[j].x, y: A.y - 4};
      to = down ? {x: stations[j + 1].x, y: B.y - 8} : {x: stations[j + 1].x, y: B.y + B.h + 8};
    } else {
      const rt = stations[j + 1].x > stations[j].x;
      from = {x: rt ? A.x + A.w + 6 : A.x - 6, y: tileMid(j).y};
      to = {x: rt ? B.x - 12 : B.x + B.w + 12, y: tileMid(j + 1).y};
    }
    const c = connector(ctx, {name: `lk${j}`, from, to, kind, bend: 0, color: kindColor(ctx, kind === 'disputed' ? 'relation' : kind)});
    conns.push({key: `lk${j}`, from: pieceId(M, j), to: pieceId(M, j + 1), c, kind});
  }
  // extra relationships: arcs on the free side of the rail
  const idPos = id => {
    if (id === 'loss') return M.N;
    if (id === 'x') return M.k;
    if (id.startsWith('e')) { const i = Number(id.slice(1)) - 1; return i < M.n ? (i < M.after + 1 ? i : i + 1) : null; }
    return null;
  };
  const extras = (p.relationships || []).map((rl, i) => {
    const ja = idPos(rl.from), jb = idPos(rl.to);
    if (ja === null || jb === null || ja === jb) return null;
    const A = boxOf(ja), B = boxOf(jb);
    const inner = q => (grid ? (stations[q].x < gridInfo.gapX ? 1 : -1) : -1); // grid: the side facing the gap
    let from = vert ? {x: grid ? (inner(ja) > 0 ? A.x + A.w + 8 : A.x - 8) : A.x - 8, y: A.y + A.h / 2} : {x: A.x + A.w / 2, y: A.y - 8};
    let to = vert ? {x: grid ? (inner(jb) > 0 ? B.x + B.w + 12 : B.x - 12) : B.x - 12, y: B.y + B.h / 2} : {x: B.x + B.w / 2, y: B.y - 14};
    // routed clear of the later event's lift: over its top bar (horizontal rail) or left of its dock (vertical rail)
    let c1, c2;
    if (grid) { c1 = {x: gridInfo.gapX, y: from.y}; c2 = {x: gridInfo.gapX, y: to.y}; } else if (vert) { const cx0 = dock.x - pedW - 60; c1 = {x: cx0, y: from.y}; c2 = {x: cx0, y: to.y}; } else {
      const liftTop = dock.y - pedH - Ht - 34;
      // an end on the later event leaves it sideways, under the lift's rails, and climbs only past them
      const dir = Math.sign(jb - ja);
      // (high on the later event's side — well above the mid-height link — then climbing steeply past the rails' ends)
      const xT = q => ({x: stations[q].x, y: stations[q].y - pedH - Ht * 0.85});
      if (ja === M.k) from = {x: xT(ja).x + dir * (tw / 2 + 4), y: xT(ja).y};
      if (jb === M.k) to = {x: xT(jb).x - dir * (tw / 2 + 8), y: xT(jb).y};
      const cy = (liftTop - 30 - 0.125 * (from.y + to.y)) / 0.75;
      c1 = ja === M.k ? {x: from.x + dir * step * 0.55, y: from.y - Ht * 0.3} : {x: from.x, y: cy};
      c2 = jb === M.k ? {x: to.x - dir * step * 0.55, y: to.y - Ht * 0.3} : {x: to.x, y: cy};
      if (ja === M.k) c2.y = Math.min(c2.y, cy); if (jb === M.k) c1.y = Math.min(c1.y, cy);
    }
    const c = connector(ctx, {name: `rl${i}`, from, to, kind: rl.kind, c1, c2, color: kindColor(ctx, rl.kind)});
    return {key: `rl${i}`, from: rl.from, to: rl.to, c, kind: rl.kind};
  }).filter(Boolean);

  // routing: the extra supplied arcs and the alternatives' icons stay clear of the later event's lift / dock
  const liftBox = vert
    ? {x: Math.min(dock.x, gapPt.x) - pedW / 2 - 24, y: gapPt.y - pedH - Ht * 0.3, w: Math.abs(gapPt.x - dock.x) + pedW + 16, h: pedH + Ht * 0.3 + 6}
    : {x: gapPt.x - pedW / 2 - 20, y: topY - 14, w: pedW + 40, h: gapPt.y - pedH - Ht - 10 - (topY - 14)};
  const inBox = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
  const overB = (A, B) => A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h;
  const arcPts = extras.flatMap(x => Array.from({length: 49}, (_, i) => x.c.at((i + 1) / 50)));
  const stationBoxes = stations.map((_, j) => boxOf(j));
  // alternatives: barrier icons off the rail, tied to their link by a plain relation; the first candidate spot clear of
  // the lift / dock, the stations, the extra arcs and the other icons wins
  const altBoxOf = (pos, s0) => ({x: pos.x - s0 / 2 - 6, y: pos.y + s0 / 2 - 0.9 * s0 - 6, w: s0 + 12, h: 0.9 * s0 + 12});
  const placedAlt = [];
  const alts = M.alternatives.map((a, j) => {
    const lc = conns[Math.min(a.link, conns.length - 1)].c;
    const s0 = Math.max(size * 1.9, Ht * 0.34);
    const cands = [];
    if (grid) {
      for (const dy of [0, -1, 1, -2, 2, -3, 3]) for (const dx of [0, -0.4, 0.4]) cands.push({x: gridInfo.gapX + dx * s0, y: lc.mid.y - s0 / 2 + dy * s0 * 1.1});
    } else if (vert) {
      for (const dy of [0, -1, 1, -2, 2]) for (const dx of [0, 1, 2]) cands.push({x: trackX - Ht * 0.75 - dx * s0 * 1.2, y: lc.mid.y + dy * s0 * 1.1});
    } else {
      for (const dy of [0, 0.7, 1.3]) for (const dx of [0, -0.6, 0.6, -1.2, 1.2, -1.8, 1.8]) cands.push({x: lc.mid.x + dx * s0, y: trackY - pedH - Ht - 0.5 * Ht - dy * s0});
    }
    const ok = q => { const b = altBoxOf(q, s0); return !overB(b, liftBox) && !stationBoxes.some(sb => overB(b, sb)) && !arcPts.some(pt => inBox(pt, b)) && !placedAlt.some(pb => overB(b, pb)); };
    const pos = cands.find(ok) || cands[0];
    placedAlt.push(altBoxOf(pos, s0));
    const s = s0;
    const node = g({name: `alt${j}`, opacity: 0}, g({transform: T(pos.x, pos.y + s / 2)}, barrierArt(ctx, {name: `alt${j}-a`, w: s, h: s * 0.9})));
    const fromPt = grid || vert ? {x: pos.x + (lc.mid.x > pos.x ? 1 : -1) * s * 0.55, y: pos.y + s * 0.1} : {x: pos.x, y: pos.y + s * 0.55};
    const c = connector(ctx, {name: `alk${j}`, from: fromPt, to: lc.mid, kind: 'relation', bend: 0, color: kindColor(ctx, 'relation')});
    return {node, c, pos, s, box: altBoxOf(pos, s0)};
  });
  const altBoxes = alts.map(a => a.box);
  const extrasClear = extras.every(x => { for (let t0 = 0.02; t0 <= 0.98; t0 += 0.02) { const q = x.c.at(t0); if (inBox(q, liftBox) || altBoxes.some(b => inBox(q, b))) return false; } return true; });
  const altsClear = alts.every(a => !overB(a.box, liftBox));

  // ---- label chips (hang from their station; slide with it)
  const chipNodes = keyOn ? chips.map((c, j) => {
    const q = chipPos[j];
    const ch = chipG(ctx, c.text, {x: q.x, y: q.y, maxWidth: c.mw, size, maxLines: cfg.maxLines ?? 4, fill: j >= M.N ? th.accent3Soft : th.card, stroke: j >= M.N ? th.accent3 : M.pieces[j].kind === 'added' ? addedColorOf(ctx) : th.accent2});
    const leftChip = q.x < stations[j].x;
    const tick = vert
      ? h('path', {d: `M${r(stations[j].x + (leftChip ? -1 : 1) * (pedW / 2 + 4))} ${r(q.y + c.h / 2)}H${r(leftChip ? q.x + c.w : q.x)}`, stroke: th.inkSoft, 'stroke-width': 2})
      : h('path', {d: `M${r(stations[j].x)} ${r(stations[j].y + 6)}V${r(q.y)}`, stroke: th.inkSoft, 'stroke-width': 2});
    return {node: g({name: `chip${j}`, opacity: 0}, tick, ch.node), box: ch.box};
  }) : [];
  // ---- strip
  const stripPlaced = flowOf(stripX, stripY, stripW).out;
  const stripNodes = stripPlaced.map(it => {
    let icon = null;
    if (it.sample) {
      const yc = it.y + it.h / 2;
      const c = connector(ctx, {name: `smp-${it.key}`, from: {x: it.x + 2, y: yc}, to: {x: it.x + sampleW, y: yc}, kind: it.kind, bend: 0, color: kindColor(ctx, it.kind === 'disputed' ? 'relation' : it.kind)});
      icon = {c};
    } else if (it.icon) icon = {node: legendIcon(ctx, {kind: it.icon}, it.x, it.y + it.h / 2, size * 1.45, `s-${it.key}`)};
    const ch = chipG(ctx, it.text, {x: it.x + it.iw, y: it.y + (it.h - (it.h)) / 2, maxWidth: it.bw, size, maxLines: 4, fill: th.card, stroke: it.key === 'key' ? th.inkSoft : th.inkSoft});
    return {key: it.key, node: g({name: `strip-${it.key}`, opacity: 0}, icon && icon.c ? icon.c.node : icon && icon.node, ch.node), sample: icon && icon.c ? icon.c : null, box: {x: it.x, y: it.y, w: it.w, h: it.h}};
  });

  // ---- tracer route: consecutive traversal ids along the relation that joins them (else a straight hop)
  const allConns = [...conns, ...extras];
  const centreOf = id => {
    if (id.startsWith('alt')) { const a = alts[Number(id.slice(3)) - 1]; return a ? {x: a.pos.x, y: a.pos.y + a.s * 0.5} : null; }
    const j = idPos(id);
    return j === null ? null : tileMid(j);
  };
  const order = (p.traversalOrder || []).filter(id => centreOf(id));
  const legs = [];
  for (let i = 1; i < order.length; i++) {
    const a = order[i - 1], b = order[i];
    const cn = allConns.find(q => q.from === a && q.to === b);
    const back = !cn && allConns.find(q => q.from === b && q.to === a);
    const pa = centreOf(a), pb = centreOf(b);
    const pts = [];
    if (cn) { pts.push(pa); for (let s0 = 0; s0 <= 12; s0++) pts.push(cn.c.at(s0 / 12)); pts.push(pb); } else if (back) { pts.push(pa); for (let s0 = 12; s0 >= 0; s0--) pts.push(back.c.at(s0 / 12)); pts.push(pb); } else pts.push(pa, pb);
    legs.push({a, b, pts});
  }
  const route = legs.flatMap((lg, i) => (i ? lg.pts.slice(1) : lg.pts));
  let L0 = 0;
  const cum = route.map((q, i) => (i ? (L0 += Math.hypot(q.x - route[i - 1].x, q.y - route[i - 1].y)) : 0));
  // time at which the tracer reaches each traversal element
  const visits = [];
  {
    let acc = 0, idx = 0;
    visits.push({id: order[0], d: 0});
    for (const lg of legs) {
      for (let q = 1; q < lg.pts.length; q++) { acc += Math.hypot(lg.pts[q].x - lg.pts[q - 1].x, lg.pts[q].y - lg.pts[q - 1].y); idx++; }
      visits.push({id: lg.b, d: acc});
    }
  }
  const tr = tracer(ctx, 'tracer', th.accent2);
  const focus = p.focusElement || 'x';
  const focusJ = idPos(focus);
  // every relation ends at its element's edge (distance from the end point to the element box)
  const boxDist = (q, b) => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h));
  const connectorGaps = conns.map((cn, j) => Math.max(boxDist(cn.c.from, boxOf(j)), boxDist(cn.c.to, boxOf(j + 1))));
  const ext = unionBounds([vert ? null : {x: MARGIN, y: 0, w: D.w - 2 * MARGIN, h: 1}, ...stations.map((_, j) => boxOf(j)), ...extras.map(x => ({x: Math.min(x.c.from.x, x.c.to.x, x.c.c1.x), y: Math.min(x.c.from.y, x.c.to.y, x.c.mid.y), w: Math.abs(x.c.to.x - x.c.from.x) + Math.abs(x.c.c1.x - x.c.from.x), h: 1})), {x: dock.x - pedW, y: dock.y - Ht - 20, w: pedW * 2, h: Ht + 20}, ...chipNodes.map(c => c.box), ...stripNodes.map(c => c.box), ...alts.map(a => ({x: a.pos.x - a.s / 2, y: a.pos.y, w: a.s, h: a.s}))]);
  return {extrasClear, altsClear, connectorGaps, stations, stationNodes, rail, spur, conns, alts, extras, chipNodes, stripNodes, route, cum, total: L0, visits, tr, dock, Ht, step, pedH, size, vert, focusJ, ext, cfg, S};
}

const addedColorOf = ctx => (ctx.theme.cloth && ctx.theme.cloth[3]) || ctx.theme.accent2;

/** Last resort (nothing fits at the text floor): compose in a taller virtual box; the result is scaled into the real one (k < 1, reported). */
function fallbackCompose(ctx, base, cfgs, ok) {
  for (let f = 1; f <= 3.01; f += 0.1) {
    const c2 = {...ctx, design: {w: ctx.design.w, h: ctx.design.h * f}};
    for (const cfg of cfgs) { const X = compose(c2, base, cfg); if (ok(X)) { X.ctx2 = c2; return X; } }
  }
  return null;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const p = ctx.params;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveIE(p);
    const base = {M};
    const D = ctx.design;
    const sizesIn = (a, b) => { const out = []; for (let s = a; s > b + 1e-6; s -= 1) out.push(s); out.push(b); return out; };
    const cfgsFor = (mode, size) => (mode === 'h'
      ? [240, 280, 320, 380].flatMap(chipW => [{mode, size, chipW, stripW: D.w - 2 * MARGIN}, {mode, size, chipW, stripW: D.w - 2 * MARGIN, maxLines: 5}])
      : mode === 'g' ? [240, 200, 160, 130].flatMap(htMax => [4, 5, 6].map(maxLines => ({mode, size, chipW: D.w * 0.5, stripW: D.w - 2 * MARGIN, maxLines, htMax})))
      : [0.56, 0.66].flatMap(f => [{mode, size, chipW: D.w * f, stripW: D.w - 2 * MARGIN}, {mode, size, chipW: D.w * f, stripW: D.w - 2 * MARGIN, maxLines: 5}]));
    let pick = null;
    const why = [];
    for (const sizes of [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)]) {
      const cands = [];
      for (const size of sizes) for (const mode of SH.modes) for (const cfg of cfgsFor(mode, size)) {
        const X = compose(ctx, base, {...cfg, dry: true});
        if (X.cfg) cands.push(X); else why.push(`${mode}${cfg.chipW | 0}@${size}:${X.bad}${X.why ?? ''}`);
      }
      if (cands.length) {
        const maxSize = Math.max(...cands.map(c => c.size));
        // (tall boxes: the two-column board is preferred when it keeps the text at >= the baseline size)
        const lo = ctx.view.shape === 'portrait' && cands.some(c => c.cfg.mode === 'g') ? Math.max(sizes[sizes.length - 1], Math.min(maxSize - 3, Math.max(...cands.filter(c => c.cfg.mode === 'g').map(c => c.size)))) : Math.max(sizes[sizes.length - 1], maxSize - 3);
        pick = cands.filter(c => c.size >= lo - 1e-9).sort((a, b) => (ctx.view.shape === 'portrait' ? (b.cfg.mode === 'g') - (a.cfg.mode === 'g') || b.Ht - a.Ht || b.size - a.size : b.Ht - a.Ht || b.size - a.size))[0];
        break;
      }
    }
    let L = pick ? compose(ctx, base, pick.cfg) : null;
    if (!L) {
      L = fallbackCompose(ctx, base, SH.modes.map(mode => ({mode, size: SH.minSize, chipW: mode === 'h' ? 380 : D.w * 0.66, stripW: D.w - 2 * MARGIN, maxLines: 6})), X => Boolean(X.stations));
    }
    L.fallback = !pick;
    L.why = why.slice(-6);
    L.M = M;
    const e = L.ext;
    L.k = Math.min(1, D.w / e.w, D.h / e.h);
    L.dx = (D.w - e.w * L.k) / 2 - e.x * L.k;
    L.dy = (D.h - e.h * L.k) / 2 - e.y * L.k;
    return L;
  },
  build(ctx, L) {
    return g({transform: T(L.dx, L.dy, 0, L.k)},
      L.rail, L.spur,
      L.alts.map(a => a.c.node),
      L.extras.map(x => x.c.node),
      L.conns.map(x => x.c.node),
      L.alts.map(a => a.node),
      L.chipNodes.map(c => c.node),
      L.stationNodes,
      L.tr,
      L.stripNodes.map(c => c.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const M = L.M;
    const k = M.k;
    // separate: the pieces after the entry point slide one step apart, then the later event slides down its spur
    const open = ease.inOutCubic(seg(u, ...W.open));
    const slide = ease.inOutCubic(seg(u, ...W.slide));
    // (each piece after the entry point starts where the piece before it stands, and moves one place on)
    const shift = j => ({x: (L.stations[j - 1].x - L.stations[j].x) * (1 - open), y: (L.stations[j - 1].y - L.stations[j].y) * (1 - open)});
    const appear = seg(u, ...W.appear);
    // focus growth: while the tracer passes the focus element (and a little after), then settles at 1.15
    const trP = seg(u, ...W.trace);
    const dNow = trP * L.total;
    const fv = L.visits.find(v => v.id === (ctx.params.focusElement || 'x'));
    let grow = 0;
    if (fv && L.total > 0) {
      const dd = (dNow - fv.d) / Math.max(1, L.total * 0.12);
      grow = u >= W.trace[1] ? 0.5 : clamp(1 - Math.abs(dd)) * (trP > 0 ? 1 : 0);
      if (dNow > fv.d) grow = Math.max(grow, u >= W.trace[0] ? 0.5 : 0);
    }
    const stationPos = [];
    L.stations.forEach((st, j) => {
      let x = st.x, y = st.y, op = appear;
      if (j > k) { const s0 = shift(j); x += s0.x; y += s0.y; }
      if (j === k) { x = lerp(L.dock.x, st.x, slide); y = lerp(L.dock.y, st.y, slide); op = 1; }
      stationPos.push({x: r(x), y: r(y)});
      const sc = j === L.focusJ ? 1 + 0.3 * grow : 1;
      nodes[`st${j}`] = {transform: T(x, y), opacity: r(j === k ? appear : op, 3)};
      nodes[`st${j}-grow`] = {transform: `scale(${r(sc, 4)})`};
    });
    // chips follow their stations
    L.chipNodes.forEach((c, j) => {
      // (the chips of the pieces after the entry point appear once the gap is open: they never slide over others)
      const pr = j === k ? seg(u, ...W.chipX) : j > k ? seg(u, W.open[1], W.open[1] + 0.06) : seg(u, ...W.chips);
      nodes[`chip${j}`] = {opacity: r(pr, 3)};
    });
    // relations draw on one by one in sequence order, alternatives' ties and extra relationships after them
    const all = [...L.conns.map(c => c.c), ...L.alts.map(a => a.c), ...L.extras.map(x => x.c)];
    const n0 = all.length;
    all.forEach((c, i) => {
      const a0 = W.relate[0] + ((W.relate[1] - W.relate[0]) * i) / n0;
      const pr = ease.inOutCubic(seg(u, a0, a0 + (W.relate[1] - W.relate[0]) / n0));
      Object.assign(nodes, c.frame(pr, 1));
    });
    L.alts.forEach((a, j) => { nodes[`alt${j}`] = {opacity: r(seg(u, ...W.chips), 3)}; });
    // strip: kinds as soon as relations are drawn, key at the gather
    L.stripNodes.forEach(c => {
      const pr = c.key === 'key' ? seg(u, ...W.key) : seg(u, ...W.strip);
      nodes[`strip-${c.key}`] = {opacity: r(pr, 3)};
      if (c.sample) Object.assign(nodes, c.sample.frame(1, 1));
    });
    // tracer
    const outP = seg(u, ...W.out);
    let tp = L.route[0] || {x: 0, y: 0};
    if (L.route.length > 1 && L.total > 0) {
      const d0 = dNow;
      let i = 1;
      while (i < L.cum.length - 1 && L.cum[i] < d0) i++;
      const a = L.route[i - 1], b = L.route[i];
      const seglen = (L.cum[i] - L.cum[i - 1]) || 1;
      const f = clamp((d0 - L.cum[i - 1]) / seglen);
      tp = {x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f)};
    }
    nodes.tracer = {transform: T(tp.x, tp.y, 0, Math.max(1.3, L.Ht / 110)), opacity: r(u < W.trace[0] ? 0 : 1 - outP, 3)};
    const visited = L.visits.filter(v => u >= W.trace[0] && dNow >= v.d - 0.5).map(v => v.id);
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      k, N: M.N,
      stations: stationPos,
      added: stationPos[k],
      tracer: {x: r(tp.x), y: r(tp.y)},
      tracerOn: u >= W.trace[0] && outP < 1,
      visited,
      order: L.visits.map(v => v.id),
      drawn: L.conns.map(c => c.kind),
      arrows: L.conns.map(c => c.kind === 'sequence' || c.kind === 'causal'),
      altTies: L.alts.length,
      connectorGaps: L.connectorGaps.map(v => r(v, 1)),
      extrasClear: L.extrasClear, altsClear: L.altsClear,
      focusScale: r(1 + 0.3 * grow, 3),
      gapOpen: r(open, 3),
      entered: slide >= 1,
      layout: {Ht: r(L.Ht), size: r(L.size), k: r(L.k, 3), vert: L.vert, fallback: L.fallback, why: L.why},
    };
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'causation-04-mechanism',
    title: 'Intervening event — a sequence board with a spur rail for the later event',
    titleEs: 'Evento interviniente — Mecanismo o relación explicada',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Evento interviniente',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded sequence board: the pieces of the initial sequence stand on pedestals along a rail ending at the loss; the pieces after the entry point slide apart and the later event slides down a spur rail into the gap. Only supplied relations are drawn (sequence by default, causal only when supplied, disputed dotted, alternatives tied by plain relations); a tracer follows the supplied traversal order while the focus element grows. As supplied; no legal conclusion.',
    tags: ['causation', 'intervening event', 'mechanism', 'sequence', 'spur rail', 'tracer', 'relations', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/evento-interviniente.js', 'src/animations/causation/kits/causal-chain.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: IE_STRINGS,
  scene,
});
