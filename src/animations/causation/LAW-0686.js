/**
 * LAW-0686 — Prueba contrafactual causal · mechanism
 *
 * Storyboard (an exploded "model board", not a row of boxes and not the stage
 * of the story): the supplied events are cards set on a slalom path — two
 * staggered rows on wide boxes, a staggered column on tall ones — ending at
 * the loss card.
 *  0.00–0.18 separate  The cards slide into their places in the supplied order
 *                      (die faces tie them to the story's tiles); the loss card
 *                      and any alternative (barrier) cards follow.
 *  0.18–0.43 relate    Only the supplied relations are drawn, one by one:
 *                      every chain link is a SEQUENCE arrow unless a link is
 *                      supplied as causal (thick accent arrow) or disputed
 *                      (dotted, no arrowhead); each alternative is tied to its
 *                      link by a plain relation (no arrow); extra relationships
 *                      are drawn with their supplied kind.
 *  0.43–0.75 trace     Pass 1 — the tracer runs the supplied traversal order
 *                      with every event in the model; the focus element grows
 *                      while the tracer passes; the loss card is marked
 *                      "reached (as supplied)". Then the SELECTED event's card
 *                      slides out of the path into its bay (dashed outline left)
 *                      and its two links fade to dashed ghosts. Pass 2 — the
 *                      tracer replays the order without it and follows the
 *                      SUPPLIED result: with "loss still occurs" a bypass link
 *                      labelled "model without it (as supplied)" is drawn and
 *                      the tracer reaches the loss; with "does not occur" it
 *                      stops at the gap (a neutral stop bar) and the loss card
 *                      stays unmarked.
 *  0.75–1.00 gather    Tracer gone; both passes' results side by side under
 *                      the loss card, the legend of the relation kinds used,
 *                      the link captions and the key "As supplied · no
 *                      conclusion drawn". No legal test, causation or outcome.
 * Legal content: fictional, jurisdiction unspecified, illustrative-unverified.
 * @module animations/causation/LAW-0686
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
import {unionBounds} from './kits/place.js';
import {tileArt, tileColor, lossArt, barrierArt} from './kits/causal-chain.js';
import {shade} from '../../primitives/paper.js';
import {cfFields, resultField, CF_STRINGS, resolveModel, chipG, balancedG, clampNote, legend, legendFrame} from './kits/prueba-contrafactual.js';

const ID = 'LAW-0686';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  slide: [0.0, 0.16], relate: [0.18, 0.42], pass1: [0.43, 0.575], remove: [0.58, 0.615], bypass: [0.615, 0.64], pass2: [0.64, 0.765],
  results: [0.77, 0.81], strip: [0.78, 0.83], key: [0.8, 0.85],
};
const IDS = ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'alt1', 'alt2', 'loss'];
const FONT = "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif";

const sceneSchema = {
  ...cfFields,
  withoutResult: resultField('SUPPLIED result of the replay without the selected event (never inferred)'),
  elements: list('Optional label overrides by component id (e1–e6 = events, alt1–alt2 = alternatives, loss)', obj('Component label', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 90),
  }, ['id', 'label']), 0, 9),
  relationships: list('Extra explicit relationships between components; the kind sets the line style (causal only when supplied)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal', ['relation', 'communication', 'sequence', 'causal']),
    label: str('Caption for this relationship', 60),
  }, ['from', 'to', 'kind']), 0, 3),
  focusElement: oneOf('Component enlarged while the tracer passes (default: the selected event)', IDS),
  relationLabels: obj('Captions for each connection kind', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links', 50),
    causal: str('Caption for supplied causal links', 50),
    disputed: str('Caption for disputed links', 50),
    without: str('Caption for the bypass drawn when the supplied result says the loss still occurs', 60),
  }),
  traversalOrder: list('Order in which the tracer visits components (ids as in elements)', oneOf('Component id', IDS), 2, 9),
};

const defaultParams = {
  events: [
    {label: 'Crate left in the aisle', time: 'T0'},
    {label: 'Trolley hits the crate', time: 'T+1 min'},
    {label: 'Shelf unit is jolted', time: 'T+1 min'},
    {label: 'Display stand shakes', time: 'T+2 min'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Ceramic vase cracked'}],
  selectedEvent: 1,
  withoutResult: 'loss-does-not-occur',
  elements: [],
  relationships: [],
  focusElement: 'e2',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence (supplied order)', causal: 'causal (as supplied)', disputed: 'disputed', without: 'model without it (as supplied)'},
  traversalOrder: ['e1', 'e2', 'e3', 'e4', 'loss'],
};

const SHAPES = {
  // rows: stations per row (0 = all in one row); the second row runs back right → left (boustrophedon)
  landscape: {rows: 1, size: 27, baseMin: 24, minSize: 20},
  square: {rows: 1, size: 31, baseMin: 29.4, minSize: 24.5},
  portrait: {rows: 2, size: 29, baseMin: 20.5, minSize: 17.5},
};
const MARGIN = 24;
const STONE = '#ddd5c6';
const TW = 0.2; // tile width × tile height (the pilot's tiles)
const PED = 0.34; // pedestal height × tile height
const LIFT_UP = 1.05; // the removed tile rises this far (× tile height): clear of the arcs' crests

/** Stone pedestal (as the pilot LAW-0682's cascade steps). (x, top) = top-left; stands on groundY. */
function pedestalArt(ctx, {x, top, w, groundY}) {
  const th = ctx.theme;
  const hh = groundY - top;
  return g(null,
    h('path', {d: roundRectPath(x + 6, top + 12, w - 12, Math.max(4, hh - 12), 3), fill: STONE, stroke: th.ink, 'stroke-width': th.stroke}),
    hh > 40 ? h('path', {d: roundRectPath(x + 14, top + 24, w - 28, hh - 40, 3), fill: 'none', stroke: shade(STONE, -0.18), 'stroke-width': 2}) : null,
    h('path', {d: roundRectPath(x, top, w, 14, 4), fill: shade(STONE, 0.1), stroke: th.ink, 'stroke-width': th.stroke}),
  );
}

function compose(ctx, base, size, cfg = {}) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const {M, SH} = base;
  const keyOn = ctx.show('key'), allOn = ctx.show('all');
  const n = M.n, k = M.k;
  const over = id => (p.elements || []).find(e => e.id === id)?.label;
  const W0 = D.w - 2 * MARGIN;
  const N = n + 1; // stations: events, then the loss
  const rowsN = SH.rows > 1 && N >= 4 ? 2 : 1;
  // two rows: split so the removed event and both its neighbours share a row (the bypass stays straight)
  let split = rowsN > 1 ? Math.ceil(N / 2) : N;
  if (rowsN > 1) {
    const ok = c => (k + 1 < c || k - 1 >= c) && c >= 2 && N - c >= 1;
    const opts = Array.from({length: N}, (_, c) => c).filter(ok).sort((a1, b1) => Math.abs(a1 - N / 2) - Math.abs(b1 - N / 2));
    if (opts.length) split = opts[0];
  }
  const rowOf = i => (i < split ? 0 : 1);
  const perRow = Math.max(split, N - split);

  // ---- bottom strip (results, kinds, captions, key): measured first
  const strip = [];
  const push = (key, text, o2 = {}) => {
    const mw = o2.mw ?? W0 * 0.48;
    const c = chipG(ctx, text, {x: 0, y: 0, maxWidth: balancedG(ctx, text, {maxWidth: mw, size, maxLines: 3}), size, maxLines: 3});
    strip.push({key, text, w: c.box.w, h: c.box.h, mw, fill: o2.fill, stroke: o2.stroke, swatch: o2.swatch});
  };
  if (keyOn) {
    push('res1', `${t.run1}: ${t.withOccurs}`, {stroke: th.accent2});
    push('res2', `${t.run2}: ${M.reach ? t.occurs : t.notOccurs}`, {stroke: th.accent2});
  }
  const kindsUsed = new Set(M.links.map(l => (l.status === 'disputed' ? 'disputed' : l.kind)));
  if (M.alternatives.length) kindsUsed.add('relation');
  for (const rl of p.relationships || []) kindsUsed.add(rl.kind);
  if (allOn) {
    for (const kd of ['sequence', 'causal', 'disputed', 'relation', 'communication']) if (kindsUsed.has(kd)) push(`kind-${kd}`, p.relationLabels[kd] || t[kd] || kd, {swatch: kd, mw: W0 * 0.34});
    if (M.reach) push('kind-without', p.relationLabels.without || t.run2, {swatch: 'without', mw: W0 * 0.34});
    M.links.forEach(l => { if (l.label) push(`lk${l.from}`, `${t.link} ${l.from + 1} → ${l.from + 1 < n ? l.from + 2 : t.lossAs}: ${l.label}`); });
    (p.relationships || []).forEach((rl, i) => { if (rl.label) push(`rel${i}`, `${rl.from} → ${rl.to}: ${rl.label}`); });
    const cn = clampNote(ctx, p, M);
    if (cn) push('clamp', cn, {mw: W0 * 0.7});
  }
  if (keyOn) push('key', t.key, {stroke: th.inkSoft, mw: W0 * 0.4});
  const SW = 64;
  const flow = y0 => {
    const placed = [];
    let y = y0, row = [], rw = 0;
    const flush = () => {
      if (!row.length) return;
      let x = MARGIN + (W0 - rw) / 2;
      const rh = Math.max(...row.map(c => c.h));
      for (const c of row) { placed.push({...c, x: x + (c.swatch ? SW : 0), y: y + (rh - c.h) / 2, sx: x}); x += c.w + (c.swatch ? SW : 0) + 18; }
      y += rh + 12; row = []; rw = 0;
    };
    for (const c of strip) {
      const cwid = c.w + (c.swatch ? SW : 0);
      if (row.length && rw + 18 + cwid > W0) flush();
      rw += (row.length ? 18 : 0) + cwid;
      row.push(c);
    }
    flush();
    return {placed, h: y - y0};
  };
  const stripH = flow(0).h;

  // ---- station chips (under the pedestals), measured for a column width
  const chipTexts = [
    ...M.events.map((e, i) => `${i + 1}. ${over(`e${i + 1}`) || e.label}${e.time ? ` · ${e.time}` : ''}`),
    over('loss') || `${t.lossAs}: ${p.losses.map(l => l.label).join(' · ')}`,
  ];
  const altTexts = M.alternatives.map((a, j) => `${t.other}: ${over(`alt${j + 1}`) || a.label} (${a.status === 'alleged' ? t.alleged : t.proposed})`);

  // ---- geometry: TH (tile height) from the width, then from the height left
  const S = W0 / perRow; // station pitch
  const rowCount = r0 => (r0 === 0 ? split : N - split);
  // chips may use the room their row leaves (a short row has wider chips)
  const chipWOf = i => W0 / rowCount(rowOf(i)) - 16;
  const chipW = S - 16;
  // a long loss description gets a wide chip of its own under the row (its station's slot stays free for the leader)
  const useLegend = Boolean(cfg.legend) && keyOn;
  const lossNarrow = keyOn && !useLegend ? chipG(ctx, chipTexts[n], {x: 0, y: 0, maxWidth: chipWOf(n), size, maxLines: cfg.maxLines ?? 5}).fit : null;
  const lossWide = keyOn && !useLegend && (lossNarrow.truncated || lossNarrow.broken);
  const lossW = Math.min(W0 * 0.6, S * 3);
  const chipMW = i => (i === n && lossWide ? lossW : chipWOf(i));
  const chipBoxes = keyOn && !useLegend ? chipTexts.map((tx, i) => chipG(ctx, tx, {x: 0, y: 0, maxWidth: chipMW(i), size, maxLines: cfg.maxLines ?? 5}).box) : [];
  // legend mode (long texts on square boxes): die-face legend in columns under the board instead of chips per station
  const lgItems = useLegend ? [...M.events.map((e, i) => ({key: `ev${i}`, kind: 'event', i, text: chipTexts[i]})), ...p.losses.map((l, j) => ({key: `loss${j}`, kind: 'loss', text: `${t.lossAs}: ${l.label}`})), ...altTexts.map((tx, j) => ({key: `alt${j}`, kind: 'alt', text: tx}))] : [];
  const lgProbe = useLegend ? legend(ctx, lgItems, {x: MARGIN, y: 0, w: W0, cols: cfg.cols ?? 2, size, minSize: size, maxLines: 6, iconS: size * 1.4, prefix: 'lgp', gap: 6, padY: 6}) : null;
  const altBoxes = keyOn && !useLegend ? altTexts.map(tx => chipG(ctx, tx, {x: 0, y: 0, maxWidth: Math.min(W0 * 0.45, S * 1.6), size, maxLines: 4}).box) : [];
  const rowOthersH = r0 => Math.max(0, ...chipBoxes.filter((_, i) => rowOf(i) === r0 && !(i === n && lossWide)).map(b => b.h));
  const rowChipH = r0 => (keyOn && !useLegend ? rowOthersH(r0) + (lossWide && rowOf(n) === r0 ? chipBoxes[n].h + 14 : 0) + 20 : 0);
  const truncated = keyOn && !useLegend && chipTexts.some((tx, i) => { const f = chipG(ctx, tx, {x: 0, y: 0, maxWidth: chipMW(i), size, maxLines: cfg.maxLines ?? 5}).fit; return f.truncated || f.broken; });
  const altRowFits = altBoxes.reduce((q, b) => q + b.w + 16, 0) - 16 <= W0;
  const altH = altBoxes.length ? (altRowFits ? Math.max(...altBoxes.map(b => b.h)) : altBoxes.reduce((q, b) => q + b.h + 10, 0)) + 18 : 0;
  // per row: headroom (lifted tile + arcs) + tile + pedestal + chips
  const lgH = lgProbe ? lgProbe.h + 20 : 0;
  const avail = D.h - 14 - stripH - 24 - altH - lgH;
  let TH = Math.min(S * 0.95, 380);
  const rowH = th0 => (LIFT_UP + 1 + PED) * th0 + 30;
  const totalRows = th0 => Array.from({length: rowsN}, (_, r0) => rowH(th0) + rowChipH(r0)).reduce((q, v) => q + v, 0) + (rowsN - 1) * 20;
  for (let i = 0; i < 40 && totalRows(TH) > avail; i++) TH *= 0.96;
  TH = Math.max(cfg.minTH ?? 120, TH);
  const totalH = totalRows(TH) + altH + lgH + 24 + stripH;
  if (cfg.dry) return {ext: {h: totalH, w: D.w}, truncated, TH};

  // ---- stations
  const tw = Math.round(TW * TH), ph = PED * TH, pw = Math.max(tw * 2.6, TH * 0.55);
  const stations = [];
  let yRow = 0;
  for (let r0 = 0; r0 < rowsN; r0++) {
    const ground = yRow + (LIFT_UP + 1 + PED) * TH + 30;
    const first = r0 === 0 ? 0 : split, cnt = r0 === 0 ? split : N - split;
    for (let j = 0; j < cnt; j++) {
      const i = first + j;
      // short rows spread over the full width; the second row runs back from the right (boustrophedon)
      const pitch = W0 / cnt;
      const cx = r0 % 2 === 0 ? MARGIN + pitch * (j + 0.5) : MARGIN + W0 - pitch * (j + 0.5);
      stations.push({i, r0, cx, ground, pedTop: ground - ph, tileTop: ground - ph - TH});
    }
    yRow = ground + rowChipH(r0) + 20;
  }
  const altY = yRow;
  const lgY = altY + altH;
  const lg = useLegend ? legend(ctx, lgItems, {x: MARGIN, y: lgY, w: W0, cols: cfg.cols ?? 2, size, minSize: size, maxLines: 6, iconS: size * 1.4, prefix: 'lg', gap: 6, padY: 6}) : {rows: []};
  const stripY = lgY + lgH + 4;

  // art
  const pedNodes = stations.map(st => pedestalArt(ctx, {x: st.cx - pw / 2, top: st.pedTop, w: pw, groundY: st.ground}));
  const tiles = stations.slice(0, n).map((st, i) => ({st, box: {x: st.cx - tw / 2, y: st.tileTop, w: tw, h: TH}}));
  const tileNodes = tiles.map((tl, i) => g({name: `tileg-${i}`, transform: T(0, 0)}, g({name: `tile-${i}`}, g({transform: T(tl.box.x + tw, tl.box.y + TH)}, tileArt(ctx, {w: tw, h: TH, index: i, color: tileColor(ctx, i)})))));
  const ls = stations[n];
  const vw = TH * 0.42, vh = TH * 0.72;
  const lossA = lossArt(ctx, {name: 'lossv', w: vw, h: vh, kind: 'vase'});
  const lossBox = {x: ls.cx - vw / 2, y: ls.pedTop - vh, w: vw, h: vh};
  const lossNode = g({name: 'loss'}, g({transform: T(ls.cx + vw / 2, ls.pedTop)}, lossA.node));
  const jug = p.losses.length > 1 ? g(null, g({transform: T(ls.cx + vw / 2 + TH * 0.32, ls.pedTop)}, lossArt(ctx, {name: 'lossj', w: TH * 0.26, h: TH * 0.32, kind: 'jug', color: shade(th.accent4, 0.25)}).node)) : null;
  const ground = g(null, [...new Set(stations.map(st => st.ground))].map(gy => h('path', {d: `M${r(MARGIN - 6)} ${r(gy)}H${r(D.w - MARGIN + 6)}`, stroke: th.inkSoft, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.6})));

  // ---- anchors: every connector starts and ends on its element
  const topOf = i => (i < n ? {x: tiles[i].box.x + tw / 2, y: tiles[i].box.y - 6} : {x: lossBox.x + vw / 2, y: lossBox.y - 8});
  const arch = TH * 0.55;
  const arcConn = (name, a, b2, kind, color) => {
    const A = topOf(a), B = topOf(b2);
    const sameRow = stations[a].r0 === stations[b2].r0;
    const dir = Math.sign(B.x - A.x) || 1;
    // same row: an arch over the gap; row change: out around the row end
    const c1 = sameRow ? {x: A.x + (B.x - A.x) * 0.2, y: Math.min(A.y, B.y) - arch} : {x: A.x + dir * 0 + S * 0.55, y: A.y - arch * 0.6};
    const c2 = sameRow ? {x: A.x + (B.x - A.x) * 0.8, y: Math.min(A.y, B.y) - arch} : {x: B.x + S * 0.55, y: B.y - arch * 0.9};
    return connector(ctx, {name, from: A, to: B, kind, c1, c2, color});
  };
  const links = M.links.map((l, i) => {
    const kind = l.status === 'disputed' ? 'disputed' : l.kind === 'causal' ? 'causal' : 'sequence';
    return {i, fromId: `e${i + 1}`, toId: i + 1 < n ? `e${i + 2}` : 'loss', kind, c: arcConn(`lk${i}`, i, i + 1, kind, kind === 'disputed' ? th.accent : kindColor(ctx, kind))};
  });

  // alternatives: a barrier on the ground in the gap of its link, tied by a plain relation to the arc's crest
  const alts = M.alternatives.map((a, j) => {
    const li = Math.min(a.link, n - 1);
    const A = stations[li], B = stations[li + 1];
    const sameRow = A.r0 === B.r0;
    const gx = sameRow ? (A.cx + B.cx) / 2 : A.cx + (A.r0 % 2 === 0 ? 1 : -1) * S * 0.42;
    const bw = Math.min(S * 0.45, TH * 0.6), bh = TH * 0.34; // low: the bypass passes above the board
    const node = g({name: `altg${j}`, opacity: 0}, g({transform: T(gx, A.ground)}, barrierArt(ctx, {name: `alt${j}-b`, w: bw, h: bh})));
    const crest = links[li].c.at(0.5);
    const rel = connector(ctx, {name: `altrel${j}`, from: {x: gx, y: A.ground - bh - 4}, to: {x: crest.x, y: crest.y + 8}, kind: 'relation', bend: 0.05, color: kindColor(ctx, 'relation')});
    return {j, gx, node, rel, box: {x: gx - bw / 2, y: A.ground - bh, w: bw, h: bh}};
  });

  // extra relationships (plain relation, communication, sequence or causal as supplied) between element tops
  const idAnchor = id => (id === 'loss' ? topOf(n) : id.startsWith('alt') ? (alts[+id.slice(3) - 1] ? {x: alts[+id.slice(3) - 1].gx, y: alts[+id.slice(3) - 1].box.y - 4} : null) : topOf(+id.slice(1) - 1));
  const extras = (p.relationships || []).map((rl, i) => {
    const A = idAnchor(rl.from), B = idAnchor(rl.to);
    if (!A || !B || rl.from === rl.to || (rl.from.startsWith('e') && +rl.from.slice(1) > n) || (rl.to.startsWith('e') && +rl.to.slice(1) > n)) return null;
    return {...rl, c: connector(ctx, {name: `rel${i}`, from: A, to: B, kind: rl.kind, bend: 0.28, color: kindColor(ctx, rl.kind)})};
  }).filter(Boolean);

  // the removed tile rises out of the model (dashed outline on its pedestal); bypass (if supplied) at mid height,
  // under the ghost arcs, from the face of the tile before the gap to the face of the tile after it
  const kt = tiles[k].box;
  const ghostSlot = h('path', {name: 'slotghost', d: roundRectPath(kt.x, kt.y, tw, TH, tw * 0.14), fill: 'none', stroke: th.fgSoft, 'stroke-width': 3, 'stroke-dasharray': '9 7', opacity: 0});
  const lift = LIFT_UP * TH;
  const Bk0 = tiles[k - 1].box, Bk2 = tiles[k + 1].box;
  const sameRowBy = stations[k - 1].r0 === stations[k + 1].r0;
  const byFrom = sameRowBy ? {x: (Bk2.x > Bk0.x ? Bk0.x + tw : Bk0.x) + (Bk2.x > Bk0.x ? 8 : -8), y: Bk0.y + TH * 0.4} : topOf(k - 1);
  const byTo = sameRowBy ? {x: (Bk2.x > Bk0.x ? Bk2.x : Bk2.x + tw) + (Bk2.x > Bk0.x ? -10 : 10), y: Bk2.y + TH * 0.4} : topOf(k + 1);
  const bypass = M.reach ? connector(ctx, {name: 'bypass', from: byFrom, to: byTo, kind: 'sequence', bend: sameRowBy ? 0 : 0.3, color: th.accent2}) : null;
  const stopAt = {x: byFrom.x + (Bk2.x > Bk0.x ? 8 : -8), y: Bk0.y + TH * 0.4};
  const stop = h('path', {name: 'stopbar', d: `M${r(stopAt.x)} ${r(stopAt.y - 22)}V${r(stopAt.y + 22)}`, stroke: th.ink, 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0});
  let removedTag = null;
  if (keyOn) {
    const tb = chipG(ctx, t.removedShort, {x: 0, y: 0, maxWidth: Math.min(S * 1.8, W0 * 0.4), size, maxLines: 2});
    const tx = Math.min(D.w - MARGIN - tb.box.w / 2, Math.max(MARGIN + tb.box.w / 2, kt.x + tw / 2 + tw + tb.box.w / 2 + 12));
    removedTag = chipG(ctx, t.removedShort, {x: tx, y: kt.y - lift + TH * 0.3, anchor: 'middle', maxWidth: Math.min(S * 1.8, W0 * 0.4), size, maxLines: 2, name: 'removed-tag', fill: th.card, stroke: th.fgSoft, dash: '6 5', opacity: 0});
  }
  // reached rings on the loss (pass 1 / pass 2): neutral accent2, solid and dashed
  const ring = (name, dash, pad) => h('ellipse', {name, cx: r(lossBox.x + vw / 2), cy: r(lossBox.y + vh * 0.5), rx: r(vw * 0.5 + pad), ry: r(vh * 0.5 + pad), fill: 'none', stroke: th.accent2, 'stroke-width': 5, 'stroke-dasharray': dash, opacity: 0});
  const rings = [ring('reach1', null, 14), ring('reach2', '12 8', 28)];

  // chips under the pedestals, with ticks
  const chipNodes = keyOn && !useLegend ? stations.map((st, i) => {
    const b0 = chipBoxes[i];
    const wide = i === n && lossWide;
    const y = wide ? st.ground + 14 + rowOthersH(st.r0) + 14 : st.ground + 14;
    const x = Math.min(D.w - MARGIN - b0.w, Math.max(MARGIN, st.cx - b0.w / 2));
    const c = chipG(ctx, chipTexts[i], {x, y, maxWidth: chipMW(i), size, maxLines: cfg.maxLines ?? 5, fill: i === n ? th.accent3Soft : th.card, stroke: i === n ? th.accent3 : th.accent2});
    const lead = wide ? h('path', {d: `M${r(st.cx)} ${r(st.ground + 4)}V${r(y)}`, stroke: th.accent3, 'stroke-width': 2.5}) : null;
    return {node: g({name: `chipg-${i}`, opacity: 0}, lead, c.node), box: c.box};
  }) : [];
  const altChips = [];
  if (keyOn && !useLegend) {
    const xs = alts.map((a, j) => Math.min(D.w - MARGIN - altBoxes[j].w, Math.max(MARGIN, a.gx - altBoxes[j].w / 2)));
    const order2 = alts.map((_, j) => j).sort((a1, b1) => xs[a1] - xs[b1]);
    for (let q = 1; q < order2.length; q++) { const a1 = order2[q - 1], b1 = order2[q]; xs[b1] = Math.max(xs[b1], xs[a1] + altBoxes[a1].w + 16); }
    // pushed past the right edge: slide the row back left
    for (let q = order2.length - 1; q >= 0; q--) {
      const j = order2[q];
      const lim = q === order2.length - 1 ? D.w - MARGIN - altBoxes[j].w : xs[order2[q + 1]] - 16 - altBoxes[j].w;
      xs[j] = Math.min(xs[j], lim);
    }
    const overflow = altRowFits === false;
    let yy = altY;
    alts.forEach((a, j) => {
      const x = overflow ? Math.min(D.w - MARGIN - altBoxes[j].w, Math.max(MARGIN, a.gx - altBoxes[j].w / 2)) : xs[j];
      const c = chipG(ctx, altTexts[j], {x, y: overflow ? yy : altY, maxWidth: Math.min(W0 * 0.45, S * 1.6), size, maxLines: 4, fill: th.accentSoft, stroke: th.accent});
      if (overflow) yy += c.box.h + 10;
      altChips.push({node: g({name: `altchip${j}`, opacity: 0}, c.node), box: c.box});
    });
  }

  // ---- tracer routes (the traversal order, with / without the selected event)
  const nodeAt = id => (id === 'loss' ? topOf(n) : id.startsWith('alt') ? idAnchor(id) : +id.slice(1) <= n ? topOf(+id.slice(1) - 1) : null);
  const order = (p.traversalOrder || []).filter(id => nodeAt(id));
  const connBetween = (a, b2) => {
    for (const lk of links) { if (lk.fromId === a && lk.toId === b2) return {c: lk.c, rev: false}; if (lk.fromId === b2 && lk.toId === a) return {c: lk.c, rev: true}; }
    for (const ex of extras) { if (ex.from === a && ex.to === b2) return {c: ex.c, rev: false}; if (ex.from === b2 && ex.to === a) return {c: ex.c, rev: true}; }
    return null;
  };
  const sel = `e${k + 1}`;
  const route = (ids, useBypass) => {
    const segs = [];
    for (let i = 1; i < ids.length; i++) {
      const a = ids[i - 1], b2 = ids[i];
      let cb = connBetween(a, b2);
      if (useBypass && bypass && a === `e${k}` && b2 === `e${k + 2}`) cb = {c: bypass, rev: false};
      const A = nodeAt(a), B = nodeAt(b2);
      const at = cb ? (tt => cb.c.at(cb.rev ? 1 - tt : tt)) : (tt => ({x: lerp(A.x, B.x, tt), y: lerp(A.y, B.y, tt)}));
      if (segs.length) {
        const prev = segs[segs.length - 1];
        const P0 = prev.at(1), P1 = at(0);
        if (Math.hypot(P1.x - P0.x, P1.y - P0.y) > 1) segs.push({a, b: a, at: tt => ({x: lerp(P0.x, P1.x, tt), y: lerp(P0.y, P1.y, tt)}), inside: true});
      }
      segs.push({a, b: b2, at});
    }
    return segs;
  };
  const route1 = route(order, false);
  const order2 = [];
  let stopped = false;
  for (const id of order) {
    if (id === sel) { if (!M.reach) { stopped = true; break; } continue; }
    order2.push(id);
  }
  const route2 = route(order2, true);
  const tr = tracer(ctx, 'tracer', th.accent2);

  const placedStrip = flow(stripY).placed;
  const stripNodes = placedStrip.map(c => {
    const node = chipG(ctx, c.text, {x: c.x, y: c.y, maxWidth: balancedG(ctx, c.text, {maxWidth: c.mw, size, maxLines: 3}), size, maxLines: 3, name: `strip-${c.key}`, opacity: 0, fill: c.fill, stroke: c.stroke});
    let sw = null;
    if (c.swatch) {
      const yy = c.y + c.h / 2;
      const col = c.swatch === 'disputed' ? th.accent : c.swatch === 'without' ? th.accent2 : kindColor(ctx, c.swatch);
      const dash = c.swatch === 'disputed' ? '4 10' : c.swatch === 'communication' ? '10 9' : null;
      const wdt = c.swatch === 'causal' ? 5 : 3.5;
      const arrow = c.swatch !== 'relation' && c.swatch !== 'disputed';
      sw = g(null, h('path', {d: `M${r(c.sx + 4)} ${r(yy)}H${r(c.sx + SW - 16)}`, stroke: col, 'stroke-width': wdt, 'stroke-dasharray': dash, 'stroke-linecap': 'round'}),
        arrow ? h('path', {d: `M${r(c.sx + SW - 8)} ${r(yy)}l-14 -8v16z`, fill: col}) : h('circle', {cx: r(c.sx + SW - 12), cy: r(yy), r: 5, fill: col}));
    }
    return {key: c.key, node: g({name: `stripg-${c.key}`, opacity: 0}, sw, node.node), box: {x: c.sx, y: c.y, w: c.w + (c.swatch ? SW : 0), h: c.h}};
  });
  const boxes = {loss: lossBox};
  tiles.forEach((tl, i) => { boxes[`e${i + 1}`] = tl.box; });
  const ext = unionBounds([{x: MARGIN, y: 0, w: W0, h: stripY}, ...stripNodes.map(q => q.box), ...chipNodes.map(q => q.box), ...altChips.map(q => q.box), ...lg.rows.map(q => q.box)]);
  const conLens = links.map(lk => lk.c.total);
  return {lg, stations, tiles, tileNodes, pedNodes, lossNode, jug, ground, links, alts, altChips, extras, bypass, stop, ghostSlot, removedTag, rings, route1, route2, stopped, order, order2, tr, stripNodes, chipNodes, ext, size, k, n, lift, TH, boxes, sel, conLens};
}

const scene = {
  sizes: {landscape: [1700, 900], square: [1200, 1100], portrait: [900, 1500]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const SH = SHAPES[ctx.view.shape];
    const M = resolveModel(p, p.withoutResult);
    const base = {M, SH};
    const fits = X => X.ext.h <= D.h - 10;
    const sizesIn = (a1, b1) => { const out = []; for (let sz = a1; sz > b1 + 1e-6; sz *= 0.97) out.push(sz); out.push(b1); return out; };
    let L = null;
    const tried = [];
    // baseline text first (>= 19.5 px), then down to the 16 px floor; tallest tiles for the largest text;
    // one row first, two rows (back and forth) when one row would need too many lines
    const cfgs = [{}, {maxLines: 6}, {maxLines: 8}, {rowsN: 2}, {rowsN: 2, maxLines: 8}, {legend: true, cols: 2}, {legend: true, cols: 3}, {legend: true, cols: 2, minTH: 100}, {legend: true, cols: 3, minTH: 100}];
    search: for (const sizes of [sizesIn(SH.size, SH.baseMin), sizesIn(SH.baseMin, SH.minSize)]) {
      for (const cfg of cfgs) {
        const b2 = cfg.rowsN ? {...base, SH: {...SH, rows: 2}} : base;
        for (const size of sizes) {
          const dry = compose(ctx, b2, size, {...cfg, dry: true});
          if (size === sizes[sizes.length - 1]) tried.push({cfg: JSON.stringify(cfg), h: r(dry.ext.h), trunc: dry.truncated, TH: r(dry.TH)});
          if (!fits(dry) || dry.truncated || dry.TH < (cfg.minTH ?? 120)) continue;
          L = compose(ctx, b2, size, cfg);
          if (fits(L)) break search;
        }
      }
    }
    if (!L) L = compose(ctx, {...base, SH: {...SH, rows: 2}}, SH.minSize, {maxLines: 8});
    L.k2 = Math.min(1, (D.h - 10) / L.ext.h);
    L.dx = (D.w - L.ext.w * L.k2) / 2 - L.ext.x * L.k2;
    L.dy = (D.h - L.ext.h * L.k2) / 2 - L.ext.y * L.k2;
    L.M = M;
    L.tried = tried;
    return L;
  },
  build(ctx, L) {
    return g({transform: T(L.dx, L.dy, 0, L.k2)},
      L.ground,
      L.pedNodes,
      L.alts.map(a => a.node),
      L.links.map(lk => lk.c.node),
      L.alts.map(a => a.rel.node),
      L.extras.map(ex => ex.c.node),
      L.bypass && L.bypass.node,
      L.ghostSlot,
      L.rings,
      L.lossNode, L.jug,
      L.tileNodes,
      L.stop,
      L.removedTag && L.removedTag.node,
      L.chipNodes.map(c => c.node),
      L.lg.rows.map(rw => rw.node),
      L.altChips.map(c => c.node),
      L.tr,
      L.stripNodes.map(s => s.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const M = L.M;
    const reduced = ctx.reduced;
    // separate: tiles drop onto their pedestals in the supplied order; chips follow
    L.tiles.forEach((tl, i) => {
      const s0 = W.slide[0] + (i / (L.n + 1)) * (W.slide[1] - W.slide[0]) * 0.7;
      const sp = ease.outCubic(seg(u, s0, s0 + 0.05));
      let dy = -(1 - sp) * L.TH * 0.35;
      let op = sp;
      if (i === L.k) { const rp = ease.inOutCubic(seg(u, ...W.remove)); dy -= L.lift * rp; op = sp * (1 - 0.2 * rp); }
      nodes[`tileg-${i}`] = {transform: T(0, dy), opacity: r(op, 3)};
    });
    L.chipNodes.forEach((c, i) => { nodes[`chipg-${i}`] = {opacity: r(seg(u, 0.02 + i * 0.012, 0.08 + i * 0.012), 3)}; });
    Object.assign(nodes, legendFrame(L.lg.rows, seg(u, 0.02, 0.12)));
    L.alts.forEach((a, j) => { nodes[`altg${j}`] = {opacity: r(seg(u, W.slide[1] - 0.04, W.slide[1]), 3)}; });
    L.altChips.forEach((c, j) => { nodes[`altchip${j}`] = {opacity: r(seg(u, W.slide[1] - 0.04, W.slide[1]), 3)}; });
    // relate: links one by one, then alternatives' relations and extras
    const total = L.links.length + L.alts.length + L.extras.length;
    const each = (W.relate[1] - W.relate[0]) / Math.max(1, total);
    const drawn = [];
    const rmv = seg(u, ...W.remove);
    L.links.forEach((lk, i) => {
      const pp = seg(u, W.relate[0] + i * each, W.relate[0] + (i + 1) * each);
      drawn.push(r(pp, 3));
      const ghost = (i === L.k - 1 || i === L.k) ? 1 - 0.7 * rmv : 1;
      Object.assign(nodes, lk.c.frame(pp, r(ghost, 3)));
    });
    L.alts.forEach((a, j) => Object.assign(nodes, a.rel.frame(seg(u, W.relate[0] + (L.links.length + j) * each, W.relate[0] + (L.links.length + j + 1) * each))));
    L.extras.forEach((ex, j) => Object.assign(nodes, ex.c.frame(seg(u, W.relate[0] + (L.links.length + L.alts.length + j) * each, W.relate[0] + (L.links.length + L.alts.length + j + 1) * each))));
    if (L.bypass) Object.assign(nodes, L.bypass.frame(seg(u, ...W.bypass)));
    nodes.slotghost = {opacity: r(rmv, 3)};
    if (L.removedTag) nodes['removed-tag'] = {opacity: r(seg(u, W.remove[1] - 0.01, W.remove[1] + 0.02), 3)};
    // tracer: pass 1 (with), pass 2 (without); constant speed along the route
    const pass = u >= W.pass1[0] && u < W.pass1[1] ? 1 : u >= W.pass2[0] && u < W.pass2[1] ? 2 : 0;
    const routeP = (segs, q) => {
      if (!segs.length) return null;
      const lens = segs.map(sg => { let l = 0, prev = sg.at(0); for (let j = 1; j <= 12; j++) { const c = sg.at(j / 12); l += Math.hypot(c.x - prev.x, c.y - prev.y); prev = c; } return Math.max(1, l); });
      const tot = lens.reduce((a, b) => a + b, 0);
      let d = ease.inOutSine(q) * tot;
      let i = 0;
      while (i < segs.length - 1 && d > lens[i]) { d -= lens[i]; i++; }
      const f = Math.min(1, d / lens[i]);
      const done = q >= 1 ? segs.length : i + (f >= 1 ? 1 : 0);
      return {pt: segs[i].at(f), visited: [segs[0].a, ...segs.slice(0, done).filter(sg => !sg.inside).map(sg => sg.b)]};
    };
    let tp = null, visited = [];
    if (pass === 1) { const rr = routeP(L.route1, seg(u, ...W.pass1)); if (rr) { tp = rr.pt; visited = rr.visited; } }
    if (pass === 2) {
      const rr = routeP(L.route2, seg(u, ...W.pass2));
      if (rr) { tp = rr.pt; visited = rr.visited; } else if (L.order2.length) { const q = L.order2[0]; const b = L.boxes[q] || L.boxes.loss; tp = {x: b.x + b.w / 2, y: b.y - 6}; visited = [q]; }
    }
    nodes.tracer = tp ? {transform: T(tp.x, tp.y), opacity: 1} : {transform: T(0, 0), opacity: 0};
    // focus element grows while the tracer passes near it
    const focusId = p.focusElement || L.sel;
    let fscale = 1;
    const fb = L.boxes[focusId];
    if (tp && fb) {
      const d = Math.hypot(tp.x - (fb.x + fb.w / 2), tp.y - fb.y);
      fscale = reduced ? 1 : 1 + 0.12 * clamp(1 - d / (L.TH * 0.8));
    }
    L.tiles.forEach((tl, i) => {
      const b = tl.box;
      const on = `e${i + 1}` === focusId && fscale !== 1;
      nodes[`tile-${i}`] = {transform: on ? `translate(${r(b.x + b.w / 2)} ${r(b.y + b.h)}) scale(${r(fscale, 3)}) translate(${r(-b.x - b.w / 2)} ${r(-b.y - b.h)})` : 'translate(0 0)'};
    });
    const r1 = u >= W.pass1[1] ? 1 : 0;
    const r2 = M.reach && u >= W.pass2[1] ? 1 : 0;
    nodes.reach1 = {opacity: r1};
    nodes.reach2 = {opacity: r2};
    nodes.stopbar = {opacity: !M.reach && u >= W.pass2[1] - 0.02 ? 1 : 0};
    for (const s of L.stripNodes) {
      const w = s.key.startsWith('res') ? W.results : s.key === 'key' ? W.key : W.strip;
      nodes[`stripg-${s.key}`] = {opacity: r(seg(u, ...w), 3)};
      nodes[`strip-${s.key}`] = {opacity: 1};
    }
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      pass,
      tracer: tp ? {x: r(tp.x), y: r(tp.y)} : null,
      tracerVisible: Boolean(tp),
      visitOrder: visited,
      relationsDrawn: drawn,
      linkStyles: L.links.map(lk => lk.kind),
      linkEnds: L.links.map(lk => Boolean(lk.c.from && lk.c.to)),
      minConnector: r(Math.min(...L.conLens)),
      removed: r(rmv, 3),
      bypass: L.bypass ? r(seg(u, ...W.bypass), 3) : null,
      reached: [r1, r2],
      stopped: L.stopped,
      focus: focusId,
      focusScale: r(fscale, 3),
      selected: L.k,
      withoutResult: p.withoutResult,
      layout: {size: r(L.size), k: r(L.k2, 3), TH: r(L.TH)}, tried: L.tried,
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
    slug: 'causation-02-mechanism',
    title: 'Counterfactual replay — the model board traced with and without the selected event',
    titleEs: 'Prueba contrafactual causal — Mecanismo o relación explicada',
    category: 'causation',
    categoryName: 'Causalidad y daño',
    motif: 'Prueba contrafactual causal',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded model board: event cards on a slalom path to the loss card, joined only by the supplied relations (sequence by default, causal only when supplied, disputed dotted). A tracer runs the traversal order with every event, then the selected event slides out of the path and the tracer replays without it, following the SUPPLIED result (a bypass to the loss, or a stop at the gap). No legal test or conclusion.',
    tags: ['causation', 'counterfactual', 'mechanism', 'tracer', 'removed event', 'model as supplied', 'relations', 'sequence'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/causation/kits/prueba-contrafactual.js', 'src/animations/causation/kits/causal-chain.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CF_STRINGS,
  scene,
});
