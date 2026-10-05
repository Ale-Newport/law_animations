/**
 * LAW-0184 — Interpretación lingüística · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] context: the state produced by the action — the first speaker's
 *              bubble (tab: its language), the ribbon, the interpreter's
 *              rendering in her own bubble (tail at HER mouth, tab: the
 *              language of the rendering as supplied, e.g. "Language 2") and
 *              the listener turned to it. Above the scene, the supplied relationships
 *              as a map of the three name chips (shown at rest and at the hold; it
 *              steps aside 0.20–0.25 — overlapping the lens opening — and returns
 *              0.72–0.76 while the lens uses that band; with labels hidden there is
 *              no map). The caption and the key sit in one row under the table.
 *  [0.20–0.37] isolate: the context dims and a lens grows out of the
 *              rendering's language tab (and the ribbon's arrival) — a real
 *              enlarged copy drawn at the same coordinates (zoom ≥ 1.5×). The
 *              copy is shown only on the opaque window, never over its source.
 *  [0.37–0.64] substitute (inside the lens only): the old label is struck
 *              through and turns grey but stays readable (traceable); the tab
 *              grows upward and the supplied new label appears above it with
 *              its own glyph and colour — the only dependent state.
 *  [0.64–0.80] return: the lens closes back onto its source (0.64–0.72); the
 *              same substitution happens on the tab in context (from 0.68)
 *              and the neutral Δ marker with its label marks the changed
 *              datum. Main action complete by 0.78; the rest is the hold.
 * The speakers, the bubbles, their tails and the words never change. Seeking
 * back restores the old label exactly. Nothing is assessed: no accuracy,
 * validity, sufficiency or outcome.
 * @module animations/roles/LAW-0184
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g, h} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, obj, oneOf, list, party} from '../../schemas/fields.js';
import {connector} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {lens} from '../../frameworks/lens.js';
import {
  INTERP_DEFAULTS, KIT_STRINGS, interpFields, interpStage, placeExchange, langTabSwap, langColor, LANG_GLYPHS, captionOf, roleOf, tokenWidth, glueTail,
  wchip, overlaps, keyChip, freeSpot, gridCands, segHits,
} from './kits/interpretacion-linguistica.js';

const ID = 'LAW-0184';
const DURATION = 8000;
const BEATS = {context: [0, 0.2], isolate: [0.2, 0.37], substitute: [0.37, 0.64], back: [0.64, 1]};
const W = {
  open: [0.2, 0.34],
  lStrike: [0.38, 0.43], lOld: [0.42, 0.46], lGrow: [0.44, 0.5], lNew: [0.47, 0.54],
  close: [0.64, 0.72],
  cStrike: [0.68, 0.71], cOld: [0.7, 0.72], cGrow: [0.69, 0.72], cNew: [0.7, 0.74],
  marker: [0.74, 0.77], markLabel: [0.74, 0.78],
  // (the map's fade-out overlaps the lens opening, so the band is never blank)
  mapOut: [0.2, 0.25], mapIn: [0.72, 0.76],
};
const OLD_TRACE = 0.6;
// the lens window is translucent while its open progress is below 0.25 (lens.js: opacity = 4p); the copy
// is shown only on the OPAQUE card or once the window is clear of its source — never two copies at once
const WIN_OPAQUE = 0.25;
const COPY_FADE = 0.12;
const LENS_CLEAR = 10;
// the lens magnifies 2.2–2.4× (never below 2.1)
const ZMIN = 2.1;
/** The two cone lines of the lens framework (same rule as frameworks/lens.js). */
function coneCorners(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2}, rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x, rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [{x: sx, y: S.y}, {x: rx, y: R.y}, {x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y, ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [{x: S.x, y: sy}, {x: R.x, y: ry}, {x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}];
}
const copyVisible = (open, pClear) => clamp((open - Math.min(WIN_OPAQUE, pClear)) / COPY_FADE);

const STRINGS = {en: {...KIT_STRINGS.en}, es: {...KIT_STRINGS.es}};

const sceneSchema = {
  actors: list('Speaker A, speaker B and the interpreter, in this order (fictional people)', party, 3, 3),
  roles: obj('Descriptive role captions (never a legal finding)', {
    a: str('Role caption for speaker A', 40), b: str('Role caption for speaker B', 40), interpreter: str('Role caption for the interpreter', 40),
  }),
  relationships: {
    ...interpFields.relationships,
    description: 'Relationships drawn as labelled links between the three people’s name chips under the table, styled by kind (neighbours: a straight link; the two speakers: an arc under the interpreter). The label is shown on or beside its own link (array replaces the previous value)',
    items: obj('A relationship between two of the three people', {
      ...interpFields.relationships.items.properties,
      label: str('Label beside the link (empty = the name of its kind)', 50),
    }, ['from', 'to', 'kind']),
  },
  props: obj('Context content (supplied text; unchanged by the substitution)', {
    sourceLanguage: str('Language label of the first speaker’s bubble, as supplied', 40),
    utterance: str('What the first speaker says, as supplied', 120),
    rendering: str('The interpreter’s rendering, as supplied', 120),
  }),
  focusTarget: oneOf('Detail that is enlarged and substituted: the language label of the interpreter’s rendering', ['rendering-language']),
  beforeValue: str('Language label of the rendering before the substitution, as supplied', 40),
  afterValue: str('Language label of the rendering after the substitution (the alternative datum supplied by the preset)', 40),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Maximum magnification of the lens', 1.5, 4),
    placement: oneOf('Where the lens sits relative to its source', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  contextLabels: obj('Labels of the context view', {context: str('Caption of the context view', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  actors: INTERP_DEFAULTS.actors,
  roles: INTERP_DEFAULTS.roles,
  relationships: [
    {from: 'a', to: 'interpreter', kind: 'communication', label: 'Heard by the interpreter'},
    {from: 'interpreter', to: 'b', kind: 'communication', label: 'Rendered for the listener'},
    {from: 'a', to: 'b', kind: 'sequence', label: 'Speaks first'},
  ],
  props: {
    sourceLanguage: 'Language 1',
    utterance: 'Dejé las llaves en la recepción a las nueve.',
    rendering: 'I left the keys at the reception desk at nine.',
  },
  focusTarget: 'rendering-language',
  beforeValue: 'Language 2',
  afterValue: 'Language 3',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'After the exchange: two bubbles linked by the interpreter', marker: 'Changed datum (as supplied)'},
};

// compact staging (opt-in kit options, as in LAW-0183): a shallow tabletop with a thin front, the interpreter
// seated a little lower — so the people can be large; seats far apart on wide boxes so the scene fills them
const CFG = {
  landscape: {X: 700, kMax: 2.1, kMin: 0.8, kGood: 1.5, size: 26, bubMax: 620},
  square: {X: 420, kMax: 1.8, kMin: 0.5, kGood: 1.1, size: 24, bubMax: 440},
  portrait: {X: 240, kMax: 2.6, kMin: 0.9, kGood: 1.4, size: 28, bubMax: 520},
};
const STAGE = {yS: -150, zI: 0.8, table: {far: -98, near: -50}, crop: -28};
// tall boxes: the table stands on the floor (its legs and the people's legs shown), so the scene fills the height
const STAGE_TALL = {...STAGE, crop: 140, floor: true, panelLocal: 40};

/**
 * The supplied relationships as a map under the table: the three people's name chips ("Name · role", each
 * under its person), a straight labelled link between neighbours (A–interpreter, interpreter–B) and an arc
 * under the interpreter's chip between the two speakers. Labels sit on their link when they fit, else
 * right under it.
 */
function relMap(ctx, o) {
  const p = ctx.params, th = ctx.theme;
  const {x0, x1, y, S, showKey, showAll} = o;
  const problems = [];
  const who = ['a', 'interpreter', 'b'];
  const colW = Math.min((x1 - x0) * 0.27, 320);
  const w2 = id => {
    const name = p.actors[id === 'a' ? 0 : id === 'b' ? 1 : 2].name, role = roleOf(p, id);
    return Math.min(colW, Math.max(110, (role ? Math.max(ctx.measure(`${name} ·`, S, 600, 'sans'), ctx.measure(role, S, 600, 'sans')) : ctx.measure(name, S, 600, 'sans')) + 30));
  };
  const chip0 = {};
  for (const id of who) chip0[id] = wchip(ctx, captionOf(p, id), {x: 0, y: 0, maxWidth: w2(id), size: S, minSize: S, maxLines: 6, weight: 600, padX: 10});
  if (Object.values(chip0).some(c => c.fit.truncated)) problems.push('map-names');
  const chipH = showKey ? Math.max(...who.map(id => chip0[id].box.h)) : S * 1.6;
  const W = id => (showKey ? chip0[id].box.w : 40);
  // centred under each person, kept inside the band and apart
  const cx = {...o.xs};
  // the speakers at the two ends of the band, the interpreter under her
  const L = {a: x0, b: x1 - W('b')};
  // (the interpreter's chip under her, slid toward the middle of the room when that keeps both links long)
  L.interpreter = Math.max(L.a + W('a') + 62, Math.min(L.b - 62 - W('interpreter'), cx.interpreter - W('interpreter') / 2));
  if (L.a + W('a') > L.interpreter - 60 || L.interpreter + W('interpreter') > L.b - 60) problems.push('map-crowded');
  const cy = y + chipH / 2;
  const chips = {};
  if (showKey) for (const id of who) chips[id] = wchip(ctx, captionOf(p, id), {x: L[id], y: y + (chipH - chip0[id].box.h) / 2, maxWidth: w2(id), size: S, minSize: S, maxLines: 6, weight: 600, padX: 10, name: `chip-${id}`});
  const edge = (id, side) => (side > 0 ? L[id] + W(id) : L[id]);
  const rels = p.relationships.map((rel, i) => ({rel, i})).filter(({rel}) => rel.from !== rel.to);
  const links = [], labels = [];
  let below = y + chipH;
  const labelBoxes = [];
  // (never narrower than its widest glued group: "Listened\u00a0to" stays on one line)
  const lab = (rel, i, mx, ly, maxW) => wchip(ctx, glueTail(rel.label || rel.kind), {x: mx, y: ly, anchor: 'middle', maxWidth: Math.max(maxW, tokenWidth(ctx, rel.label || rel.kind, S, 600) + 18), size: S, minSize: S, maxLines: 3, weight: 600, padX: 8, fill: th.card, stroke: kindColor(ctx, rel.kind), color: th.ink, name: `rlab${i}`});
  // neighbours first (straight links), then the speakers' arc
  const order = id => who.indexOf(id);
  const adj = rels.filter(({rel}) => Math.abs(order(rel.from) - order(rel.to)) === 1);
  const far = rels.filter(({rel}) => Math.abs(order(rel.from) - order(rel.to)) === 2);
  const pairN = {};
  for (const {rel, i} of adj) {
    const lr = order(rel.from) < order(rel.to);
    const left = lr ? rel.from : rel.to, right = lr ? rel.to : rel.from;
    const key = `${left}|${right}`;
    const nth = pairN[key] = (pairN[key] ?? -1) + 1;
    const xa = edge(left, 1) + 6, xb = edge(right, -1) - 6;
    // (a label that cannot sit on its link hangs under it: that link then runs low in the chips' row)
    const t0 = showAll ? lab(rel, i, 0, 0, xb - xa - 30) : null;
    const onLink = !nth && t0 && !t0.fit.truncated && t0.box.h <= chipH + 1 && t0.box.w <= xb - xa - 30;
    const yy = (showAll && !onLink ? y + chipH - Math.min(8, chipH / 4) : cy) + (nth ? 10 : 0) * (nth % 2 ? 1 : -1);
    if (xb - xa < 48) problems.push('map-arrow-short');
    const from = lr ? {x: xa, y: yy} : {x: xb, y: yy}, to = lr ? {x: xb, y: yy} : {x: xa, y: yy};
    const c = connector(ctx, {name: `rl${i}`, from, to, kind: rel.kind, c1: {x: from.x + (to.x - from.x) / 3, y: yy}, c2: {x: from.x + (to.x - from.x) * 2 / 3, y: yy}, color: kindColor(ctx, rel.kind)});
    const line = c.node.children.find(ch => ch.attrs && ch.attrs.name === `rl${i}-line`);
    if (line) line.attrs['data-conn'] = `rl${i}`;
    links.push(c);
    if (!showAll) continue;
    const mx = (xa + xb) / 2;
    let lb;
    if (onLink) lb = lab(rel, i, mx, yy - t0.box.h / 2, xb - xa - 30);
    else {
      // under its link, never wider than the room between the two links' middles
      // (and inside the speakers' arc, whose ends leave the chips' outer ends)
      const mids = [(edge('a', 1) + edge('interpreter', -1)) / 2, (edge('interpreter', 1) + edge('b', -1)) / 2];
      const lo = far.length ? L.a + Math.min(26, W('a') / 4) + 90 : x0, hi = far.length ? L.b + W('b') - Math.min(26, W('b') / 4) - 90 : x1;
      const mw = Math.min(Math.max(xb - xa + 60, 160), mids[1] - mids[0] - 14, hi - lo);
      lb = lab(rel, i, 0, 0, mw);
      const cxl = Math.max(lo + lb.box.w / 2, Math.min(hi - lb.box.w / 2, mx));
      lb = lab(rel, i, cxl, below + 8, mw);
    }
    labels.push({i, conn: `rl${i}`, lb, hang: !onLink});
  }
  // two labels under their links that would touch: the second one steps down a row
  for (let q = 1; q < labels.length; q++) {
    const prev = labels.slice(0, q).map(z => z.lb.box);
    let lb = labels[q].lb;
    if (prev.some(bx => overlaps(bx, lb.box, 6))) {
      const rel = p.relationships[labels[q].i];
      const yy = Math.max(...prev.map(bx => bx.y + bx.h)) + 8;
      lb = lab(rel, labels[q].i, lb.box.cx, yy, lb.box.w + 2);
      labels[q].lb = lb;
    }
  }
  const underAdj = Math.max(y + chipH, ...labels.map(q => q.lb.box.y + q.lb.box.h));
  far.forEach(({rel, i}, j) => {
    const lr = order(rel.from) < order(rel.to);
    // (it leaves and reaches the speakers' chips at their outer ends, clear of the labels under the links)
    const xa = L.a + Math.min(26, W('a') / 4) + (j ? 12 : 0), xb = L.b + W('b') - Math.min(26, W('b') / 4) - (j ? 12 : 0);
    const lbW = Math.min(360, (L.b + W('b') - L.a) * 0.5);
    const lbH = showAll ? lab(rel, i, 0, 0, lbW).box.h : 0;
    const ya = y + chipH + 3, yArc = underAdj + Math.max(labels.some(q => q.hang) ? 60 : 30, 12 + lbH / 2) + j * 16;
    // (a cubic whose two control points share a y dips to 3/4 of the way down to them)
    const yc = ya + (yArc - ya) / 0.75;
    // (each end leaves its own chip's lower edge — chips of different heights are centred in the row)
    const yEnd = id => (showKey ? y + (chipH + chip0[id].box.h) / 2 + 3 : ya);
    const from = lr ? {x: xa, y: yEnd('a')} : {x: xb, y: yEnd('b')}, to = lr ? {x: xb, y: yEnd('b')} : {x: xa, y: yEnd('a')};
    const c = connector(ctx, {name: `rl${i}`, from, to, kind: rel.kind, c1: {x: from.x, y: yc}, c2: {x: to.x, y: yc}, color: kindColor(ctx, rel.kind)});
    // (clear of the other labels: farther than their own links are from them)
    const lbs0 = labels.map(q => ({...q.lb.box, m: q.hang ? 26 : 12}));
    if (Array.from({length: 41}, (_, t) => c.at(t / 40)).some(pt => lbs0.some(bx => pt.x > bx.x - bx.m && pt.x < bx.x + bx.w + bx.m && pt.y > bx.y - bx.m && pt.y < bx.y + bx.h + bx.m))) problems.push('map-arc-label');
    const line = c.node.children.find(ch => ch.attrs && ch.attrs.name === `rl${i}-line`);
    if (line) line.attrs['data-conn'] = `rl${i}`;
    links.push(c);
    if (!showAll) return;
    labels.push({i, conn: `rl${i}`, lb: lab(rel, i, (xa + xb) / 2, yArc - lbH / 2, lbW)});
  });
  const all = [...Object.values(chips).map(c => c.box), ...labels.map(q => q.lb.box)];
  for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) if (overlaps(all[a], all[b], 6)) problems.push('map-overlap');
  if (labels.some(q => q.lb.fit.truncated)) problems.push('map-label-truncated');
  const bottom = Math.max(y + chipH, underAdj, ...labels.map(q => q.lb.box.y + q.lb.box.h), far.length ? underAdj + (labels.some(q => q.hang) ? 66 : 36) + 16 * (far.length - 1) : 0);
  const node = g({name: 'relmap'}, links.map(c => c.node), Object.values(chips).map(c => c.node), labels.map(q => g({'data-rel-label': q.conn}, q.lb.node)));
  const frame = () => Object.assign({}, ...links.map(c => c.frame(1, 1)));
  const items = [...Object.entries(chips).map(([id, c]) => ({name: `chip-${id}`, box: c.box})), ...labels.map(q => ({name: `rlab${q.i}`, box: q.lb.box}))];
  return {node, frame, chips: Object.values(chips), labelBoxes: labels.map(q => q.lb.box), boxes: all, items, bottom, problems, box: {x: x0, y, w: x1 - x0, h: bottom - y}};
}

function tryLayout(ctx, S, k, Ay, hx = 0.5) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const C = CFG[shape];
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const probeOnly = Ay === null;
  const minS = Math.max(17, S * 0.86);
  // generic labels (caption, key, marker label): 90 % of the text size, never under 20 px while S allows
  const labS = Math.max(17, Math.min(22, Math.max(S * 0.9, Math.min(S, 20))));
  const problems = [];
  const X = C.X;
  const stageW = (X + 132) * k;
  if (stageW > D.w - 12) return {ok: false, problems: ['too-wide']};
  // (hx: where the stage sits across the free width — off-centre leaves a free column for the lens)
  const Ax = (D.w - stageW) * hx + 66 * k;
  const SG = shape === 'portrait' ? STAGE_TALL : STAGE;
  const st = interpStage(ctx, {prefix: 'st', k, A: {x: Ax, y: Ay ?? 0}, X, crop: SG.crop, floor: SG.floor, panelLocal: SG.panelLocal, actors: p.actors, yS: SG.yS, zI: SG.zI, table: SG.table});
  // (the rendering leaves room at its right for the changed-datum marker)
  const markRoom = Math.max(13, S * 0.72) * 2 + 24;
  const ex = placeExchange(ctx, {st, S, minS, region: {x: 0, y: -4000, w: D.w - markRoom, h: 8000}, utterance: p.props.utterance, rendering: p.props.rendering, langS: p.props.sourceLanguage, langD: p.beforeValue, showText: showAll, bubMax: C.bubMax, noTabR: true, tabS: S});
  problems.push(...ex.problems);
  const oldLang = ex.lD, newLang = {color: langColor(ctx, 2), glyph: LANG_GLYPHS[2]};
  const markR = Math.max(13, ex.MR.tabS * 0.7);
  // (never narrower than the widest glued token: "Language 2" stays on one line; a wrapped old value gets a
  // strike through each of its lines)
  const tokW = Math.max(tokenWidth(ctx, p.beforeValue, ex.MR.tabS), tokenWidth(ctx, p.afterValue, ex.MR.tabS)) + 2;
  // the changed-datum label sits right beside its marker (no leader), shown with the key
  const faces = [st.faceBox('a'), st.faceBox('b'), st.faceBox('i')];
  const ribPts = ex.rib.poly.pts;
  const inBox = (q, b, m = 4) => q.x > b.x - m && q.x < b.x + b.w + m && q.y > b.y - m && q.y < b.y + b.h + m;
  // (the grown tab as wide as the bubble allows — fewer, shorter rows — unless that reaches the ribbon)
  let swapOpt, swap;
  // (the widest tab that stays clear of where the ribbon arrives; with labels hidden the rows hold glyphs only,
  // so they are measured without the values)
  const tabRight = ex.bubR.tab.x + ex.bubR.tab.w;
  const ribEnd = Math.max(...ribPts.filter(q => q.y < ex.bubR.body.y + 10).map(q => q.x), -Infinity);
  const rowPads = ex.MR.tabPadX * 2 + ex.MR.glyphR * 2 + ex.MR.tabS * 0.4;
  const clearW = Number.isFinite(ribEnd) ? tabRight - ribEnd - 16 - rowPads : Infinity;
  for (const f of [0.9, 0.75, 0.62]) {
    swapOpt = {tab: ex.bubR.tab, M: ex.MR, oldText: showAll ? p.beforeValue : '·', newText: showAll ? p.afterValue : '·', oldLang, newLang, showText: showAll, maxW: Math.max(tokW, Math.min(Math.max(120, ex.MR.w * f - 40), clearW)), strikeEach: true};
    swap = langTabSwap(ctx, {...swapOpt, name: 'cs', marker: {r: markR}});
    if (!ribPts.some(q => inBox(q, swap.extent, 6))) break;
  }
  if (swap.fOld.truncated || swap.fNew.truncated) problems.push('tab-truncated');
  const E = swap.extent;
  if (ribPts.some(q => inBox(q, E, 6))) problems.push('swap-ribbon');
  if (faces.some(f => overlaps(E, f, 4)) || overlaps(E, ex.bubS.box, 6)) problems.push('swap-clash');
  if (E.x + E.w > D.w - 6) problems.push('swap-out');
  let mkLab = null;
  if (showKey) {
    const mk = swap.mk;
    const lab0 = wchip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: 300, size: labS, minSize: labS, maxLines: 3, weight: 600, fill: th.card, stroke: th.accent2, color: th.ink});
    const lw = lab0.box.w, lh = lab0.box.h;
    const cands = [
      {x: mk.x + mk.r + 6, y: mk.y - lh / 2},                               // right of the marker
      {x: Math.min(D.w - 8 - lw, mk.x - lw / 2), y: mk.y - mk.r - 4 - lh},        // right above the marker
      {x: Math.min(D.w - 8 - lw, mk.x + mk.r - lw), y: mk.y - mk.r - 4 - lh},
      ...[0, 0.25, 0.5, 0.75, 1].map(f => ({x: E.x + E.w - lw - f * Math.max(0, lw - E.w * 0.5), y: E.y - lh - 6})), // above the tab
      {x: E.x - lw - 8, y: swap.yNew + swap.h1 / 2 - lh / 2},                 // left of the new row
      {x: E.x - lw - 8, y: E.y - lh - 6},
    ];
    const ok = c => {
      const b = {x: c.x, y: c.y, w: lab0.box.w, h: lab0.box.h};
      return b.x >= 8 && b.x + b.w <= D.w - 8 && !overlaps(b, E, 4) && !faces.some(f => overlaps(b, f, 4)) && !overlaps(b, ex.bubS.box, 6) && !overlaps(b, ex.bubR.body, 2) && !ribPts.some(q => inBox(q, b, 6));
    };
    const c = cands.find(ok);
    if (!c) problems.push('mark-label');
    const cc = c || cands[0];
    mkLab = wchip(ctx, p.contextLabels.marker, {x: cc.x, y: cc.y, maxWidth: 300, size: lab0.fit.size, minSize: lab0.fit.size, maxLines: 3, weight: 600, fill: th.card, stroke: th.accent2, color: th.ink, name: 'mark-label'});
  }
  // --- lens source: the tab after the change (both rows + marker) with the ribbon's arrival; its lower edge
  // stops above the rendering's first text line, so no text is ever cut by the rim
  const pad = 12;
  const src = {x: E.x - pad, y: E.y - pad, w: 0, h: 0};
  src.w = E.x + E.w + pad - src.x;
  // (a text's box starts above its block top by about a quarter of the font size)
  // (never above the tab's own lower edge: the copy — the whole tab — is never cut by the rim)
  src.h = Math.max(E.y + E.h + 4, Math.min(ex.bubR.textBox.y - ex.MR.text.size * 0.3 - 4, E.y + E.h + pad)) - src.y;
  const source = src;
  const sceneTop = Math.min(ex.top, E.y, ...(mkLab ? [mkLab.box.y] : []));
  const T0 = st.table;
  // --- the supplied relationships: a compact map of the three name chips in the band ABOVE the scene. It is
  // shown at rest and at the hold; while the lens is open it steps aside and the lens uses that band.
  const mapS = Math.max(16, Math.min(22, Math.max(20, S * 0.9), S));
  const xs = {a: st.Lx(0), interpreter: st.shI.x, b: st.Lx(X)};
  const map0 = relMap(ctx, {x0: 8, x1: D.w - 8, y: 0, S: mapS, showKey, showAll, xs});
  // (labels hidden: no map at all — links without their name chips would end in empty space)
  const mapH = showKey ? map0.bottom : 0;
  // (the band is tall enough for the map, and for a lens of at least the minimum magnification above the tab)
  const zNeed = Math.min(ZMIN + 0.1, p.detailGeometry.zoom);
  // (square boxes: the open lens may also cover the first speaker's bubble wholly, so it needs less band)
  const overS = shape !== 'landscape' ? Math.max(0, ex.bubS.box.y + ex.bubS.box.h + 10 - source.y) : 0;
  const bandH = Math.max(mapH, zNeed * source.h + 26 + 8 - (source.y - sceneTop) - 14 - overS);
  // (the map sits right above the scene; the band above it is only as tall as the lens needs)
  const mapY = sceneTop - 14 - mapH;
  const rmap = relMap(ctx, {x0: 8, x1: D.w - 8, y: mapY, S: mapS, showKey, showAll, xs});
  if (showKey) problems.push(...rmap.problems);
  const mapBoxes = rmap.boxes;
  // --- caption (context) and key: one row under the table, never under the lens's path
  // (never larger than any supplied text: the words, the language tabs, the map)
  const capS = Math.max(Math.min(16, mapS), Math.min(labS, ex.MS.text.size, ex.MR.text.size, ex.MS.tabText.size, ex.MR.tabText.size, mapS));
  const rowY = T0.yBottom + 14;
  let caption = null, key = null;
  const rowW = D.w - 16;
  const key0 = showKey ? keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: Math.min(rowW * 0.4, 420), size: capS, minSize: capS, maxLines: 3}) : null;
  if (showAll) {
    const capMax = rowW - (key0 ? key0.box.w + 24 : 0);
    caption = wchip(ctx, p.contextLabels.context, {x: 8, y: rowY, maxWidth: Math.min(capMax, 900), size: capS, minSize: capS, maxLines: 3, weight: 700, fill: th.paperShade, name: 'caption'});
    if (caption.fit.truncated) problems.push('caption');
  }
  if (showKey) {
    key = keyChip(ctx, ctx.t.key, {x: D.w - 8, y: rowY, anchor: 'end', maxWidth: Math.min(rowW * 0.4, 420), size: capS, minSize: capS, maxLines: 3, name: 'key'});
    if (key.fit.truncated) problems.push('key');
  }
  const top = Math.min(mapY, sceneTop - 14 - bandH);
  const bottom = Math.max(T0.yBottom, ...(caption ? [caption.box.y + caption.box.h] : []), ...(key ? [key.box.y + key.box.h] : []));
  if (probeOnly) return {ok: false, probe: true, problems, top, bottom};
  if (top < 6 || bottom > D.h - 4) problems.push('out-of-frame');
  if (problems.length) return {ok: false, problems};

  // rim: no context text lies partly inside the source (the copy would show it cut)
  const texts = [ex.bubS.textBox, ex.bubS.tab, ex.bubR.textBox];
  const partial = b => overlaps(b, source, 0) && !(b.x >= source.x && b.y >= source.y && b.x + b.w <= source.x + source.w && b.y + b.h <= source.y + source.h);
  if (texts.some(partial)) problems.push('rim');

  // --- lens destination: the largest magnification that fits a free region (capped by the preset). The
  // relation map is hidden while the lens is open, so its band is free; the caption and key are not.
  const B = {x: 10, y: 10, w: D.w - 20, h: D.h - 20};
  const m = 26;
  const cand = [];
  const zMin = Math.min(ZMIN, p.detailGeometry.zoom);
  const persons = [st.personBox('a'), st.personBox('b'), st.interpBox()];
  const rowBoxes = [caption, key].filter(Boolean).map(c => c.box);
  const avoidAll = [...faces, ex.bubS.box, ex.bubR.box, ...persons, {x: T0.x0 - 60 * k, y: T0.yFar, w: T0.x1 - T0.x0 + 120 * k, h: T0.yBottom - T0.yFar}, ...rowBoxes];
  // while it opens and closes the window never covers a head, a body, the ribbon or any text (not even
  // partly) — the rendering's words right under the tab included — and its cone lines cross no face or text
  const textBoxes = [ex.bubS.textBox, ex.bubS.tab, ex.bubR.textBox, ...rowBoxes];
  const winR = (d, q) => ({x: lerp(source.x, d.x, q), y: lerp(source.y, d.y, q), w: lerp(source.w, d.w, q), h: lerp(source.h, d.h, q)});
  const inside = (b, R) => b.x >= R.x && b.y >= R.y && b.x + b.w <= R.x + R.w && b.y + b.h <= R.y + R.h;
  const ribHead = ribPts.slice(-Math.max(3, Math.ceil(ribPts.length * 0.3)));
  const inBoxR = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
  const pathOk = d => {
    const crowded = avoid !== avoidAll;
    const Dw = {x: d.x - 4, y: d.y - 4, w: d.w + 16, h: d.h + 20};
    // (crowded pass: the open window may cover the first speaker's words wholly, never partly)
    if (textBoxes.some(b => overlaps(Dw, b, 2) && !(crowded && b !== ex.bubR.textBox && !rowBoxes.includes(b) && inside(b, d)))) return false;
    for (let q = 0.0625; q <= 1.0001; q += 0.0625) {
      const R = winR(d, q);
      const Rs = {x: R.x - 4, y: R.y - 4, w: R.w + 8 + 8, h: R.h + 8 + 12};
      if (faces.some(f => overlaps(Rs, f, 6)) || (!lastResort && persons.some(b => overlaps(Rs, b, 2)))) return false;
      if (q > 0.07 && overlaps(R, ex.bubR.textBox, 0)) return false;
      if (textBoxes.some(b => b !== ex.bubR.textBox && overlaps(Rs, b, 2) && !(crowded && !rowBoxes.includes(b) && inside(b, d)))) return false;
      // (the ribbon's arrival — its arrowhead at the rendering — is never under the window)
      if (q > 0.07 && ribHead.some(pt => inBoxR(pt, Rs))) return false;
      if (q > 0.2 && Math.round(q * 16) % 4 === 0) {
        const [a1, a2, b1, b2] = coneCorners(source, R);
        const hitAny = (u0, u1) => [...faces, ...textBoxes].some(b => segHits(u0, u1, {x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8}));
        if (hitAny(a1, a2) || hitAny(b1, b2)) return false;
      }
    }
    return true;
  };
  let avoid = avoidAll, lastResort = false, zLow = zMin;
  const region = (name, x, y, w, hh) => {
    if (w <= 0 || hh <= 0) return;
    const zTop = Math.min(w / source.w, hh / source.h, p.detailGeometry.zoom);
    for (let z = zTop; z >= zLow - 1e-6; z -= 0.1) {
      const dw = source.w * z, dh = source.h * z;
      // the nearest free position whose opening path is clear (cheap tests first)
      const ds = [];
      for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) {
        const d = {x: x + (w - dw) * (i / 10), y: y + (hh - dh) * (j / 10), w: dw, h: dh};
        if (avoid.some(f => overlaps(d, f, 6))) continue;
        ds.push({d, dist: Math.hypot(d.x + dw / 2 - (source.x + source.w / 2), d.y + dh / 2 - (source.y + source.h / 2))});
      }
      ds.sort((a, b) => a.dist - b.dist);
      const bestD = ds.find(q => pathOk(q.d));
      if (bestD) { cand.push({name, z, dest: bestD.d}); return; }
    }
  };
  const regions = () => {
    region('top', B.x, B.y, B.w, source.y - m - B.y);
    region('left', B.x, B.y, source.x - m - B.x, B.h);
    region('right', source.x + source.w + m, B.y, B.x + B.w - (source.x + source.w + m), B.h);
    region('bottom', B.x, source.y + source.h + m, B.w, B.y + B.h - (source.y + source.h + m));
  };
  regions();
  // second pass (crowded boxes): the open window may also cover a whole text block (never part of one)
  if (!cand.length || Math.max(...cand.map(c => c.z)) < 1.8) { avoid = [...faces, ...rowBoxes]; regions(); }
  // last resort (very long supplied labels in a small box): heads stay clear, bodies may be passed over and
  // the magnification may drop to 1.5×; reported in the semantic state
  if (!cand.length) { lastResort = true; zLow = Math.min(zMin, 1.5); regions(); }
  const pref = {top: 0, left: 1, right: 2, bottom: 3};
  cand.sort((a, b) => (b.z - a.z) || (pref[a.name] - pref[b.name]));
  const pick = p.detailGeometry.placement === 'auto' ? cand[0] : cand.find(c => c.name === p.detailGeometry.placement) || cand[0];
  if (!pick || pick.z < zLow) return {ok: false, problems: ['lens-small']};
  const dest = pick.dest;
  const hideMap = [];
  // the lens copy holds the language tab only — both rows, glyphs and strikes — at the SAME coordinates;
  // its texts carry a zero-width mark (the open lens deliberately overprints the dimmed context)
  const ls = langTabSwap(ctx, {...swapOpt, name: 'ls', zw: true, marker: null});
  const ctxBox = {x: 4, y: Math.max(4, top - 10), w: D.w - 8, h: bottom - Math.max(4, top - 10) + 4};
  const lz = lens(ctx, {name: 'lens', source, dest, content: g(null, ls.node), frame: ctxBox, color: th.accent2});
  const winAt = q => ({x: lerp(source.x, dest.x, q), y: lerp(source.y, dest.y, q), w: lerp(source.w, dest.w, q) + 8, h: lerp(source.h, dest.h, q) + 12});
  if (overlaps(winAt(1), source, LENS_CLEAR)) problems.push('lens-on-source');
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (overlaps(winAt(mid), source, LENS_CLEAR)) lo = mid; else hi = mid; }
  const pClear = hi;
  if (faces.some(f => overlaps(dest, f, 4))) problems.push('lens-face');
  if (problems.length) return {ok: false, problems};
  // the label sits on the changed datum: next to its marker or against the changed tab
  const boxGap = (a, b) => Math.hypot(Math.max(a.x - b.x - b.w, 0, b.x - a.x - a.w), Math.max(a.y - b.y - b.h, 0, b.y - a.y - a.h));
  const markGap0 = mkLab ? Math.hypot(Math.max(mkLab.box.x - (swap.mk.x + swap.mk.r), 0, swap.mk.x - swap.mk.r - mkLab.box.x - mkLab.box.w), Math.max(mkLab.box.y - (swap.mk.y + swap.mk.r), 0, swap.mk.y - swap.mk.r - mkLab.box.y - mkLab.box.h)) : null;
  const markGap = mkLab ? Math.min(markGap0, boxGap(mkLab.box, E)) : null;
  return {ok: true, problems, S, k, st, ex, swap, ls, lz, source, dest, zoom: pick.z, placement: pick.name, pClear, rmap, caption, key, mkLab, markGap, capS,
    // (height the scene and the map cover: map top — or the scene's top without labels — to the scene's bottom)
    fillH: (T0.yBottom - (showKey ? mapY : sceneTop)) / D.h,
    showMap: showKey, lensClear: faces.concat(persons), textBoxes, hideMap, lensFallback: lastResort, hideR: false};
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const C = CFG[ctx.view.shape];
    const D = ctx.design;
    const tries = [];
    let best = null;
    for (let S = C.size; S >= 16 - 1e-6; S -= 1) {
      if (best && !best.lensFallback && best.k >= C.kGood - 1e-6 && (S < best.S - 3 || S < 20)) break;
      for (let k = C.kMax; k >= C.kMin - 1e-6; k -= 0.05) {
        if (best && !best.lensFallback && k <= best.k) break;
        const probe = tryLayout(ctx, S, k, null, 0.5);
        if (probe.problems.length) { tries.push(`${S}/${r(k)}:${probe.problems.join('+')}`); continue; }
        const hgt = probe.bottom - probe.top;
        if (hgt > D.h - 16) { tries.push(`${S}/${r(k)}:too-tall`); continue; }
        // centred first; off-centre when that leaves room for a larger lens
        let L = null, backup = null;
        for (const hx of [0.5, 0.15]) {
          for (const va of [0.5, 0, 1]) {
            const Ay = 8 + (D.h - 16 - hgt) * va - probe.top;
            const T = tryLayout(ctx, S, k, Ay, hx);
            if (T.ok && !T.lensFallback && !T.hideR) { L = T; break; }
            if (T.ok && (!backup || (backup.lensFallback && !T.lensFallback))) backup = T;
            if (!T.ok) tries.push(`${S}/${r(k)}/${hx}/${va}:${T.problems.join('+')}`);
          }
          if (L) break;
        }
        L = L || backup;
        if (!L) continue;
        // (a last-resort lens only when nothing else fits)
        // (text of at least 20 px first, then the largest figures, then the largest text)
        // (figures at least at their good size first — heads like LAW-0164/0172's — then text of at least 20 px,
        // then the largest figures and text)
        const score = L.lensFallback ? -10 + L.zoom + 0.1 * (S / C.size) : (k >= C.kGood - 1e-6 ? 10 : 0) + (S >= 20 ? 5 : 0) + 3 * (k / C.kMax) + S / C.size;
        if (!best || score > best.score) best = {...L, score};
        if (!L.lensFallback && !L.hideR) break;
      }
    }
    if (best) return {...best, tries: tries.slice(-8)};
    throw new Error(`${ID}: no layout fits (${tries.slice(-8).join(' | ')})`);
  },
  build(ctx, L) {
    return g(null,
      L.st.node,
      L.showMap ? L.rmap.node : null,
      L.ex.bubS.node,
      L.ex.bubR.node,
      L.ex.rib.node,
      L.swap.node,
      L.mkLab && L.mkLab.node,
      L.caption && L.caption.node,
      L.key && L.key.node,
      L.lz.node,
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const x = w => seg(u, w[0], w[1]);
    const nodes = {};
    const st = L.st;
    // the context: the state produced by the exchange (listener turned to the rendering, interpreter to the listener)
    const posed = st.pose({a: {tilt: -6}, b: {lean: 4, tilt: -10}, i: {tilt: 9, look: 1}, notes: [1, 1, 1]});
    Object.assign(nodes, posed.nodes);
    Object.assign(nodes, L.ex.bubS.frame(1, reduced), L.ex.bubR.frame(1, reduced), L.ex.rib.frame(1));
    // lens open / close; the copy is visible only on the opaque window (no double image)
    const open = ease.inOutCubic(x(W.open)) * (1 - ease.inOutCubic(x(W.close)));
    Object.assign(nodes, L.lz.frame(open, open));
    const copyVis = copyVisible(open, L.pClear);
    nodes['lens-content'] = {...nodes['lens-content'], opacity: r(copyVis, 3)};
    if (L.showMap) Object.assign(nodes, L.rmap.frame());
    // the relation map is shown at rest and at the hold; it steps aside while the lens uses its band
    if (L.showMap) nodes.relmap = {opacity: r(clamp(1 - x(W.mapOut) + x(W.mapIn)), 3)};
    // substitution inside the lens
    const lens = {strike: x(W.lStrike), old: lerp(1, OLD_TRACE, x(W.lOld)), grow: ease.inOutSine(x(W.lGrow)), reveal: ease.inOutSine(x(W.lNew))};
    Object.assign(nodes, L.ls.frame(lens));
    // the same substitution in context, after the lens has started to close
    const cx = {strike: x(W.cStrike), old: lerp(1, OLD_TRACE, x(W.cOld)), grow: ease.inOutSine(x(W.cGrow)), reveal: ease.inOutSine(x(W.cNew)), marker: x(W.marker)};
    Object.assign(nodes, L.swap.frame(cx));
    if (L.mkLab) nodes['mark-label'] = {opacity: r(x(W.markLabel), 3)};
    const datumOf = s => (s.strike === 0 && s.reveal === 0 && s.grow === 0 ? 'before' : s.reveal >= 1 && s.grow >= 1 ? 'after' : 'changing');
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'back';
    const zx = L.dest.w / L.source.w, zy = L.dest.h / L.source.h;
    const R3 = v => r(v, 3);
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        lensOpen: R3(open), lensCopyVisible: R3(copyVis), pClear: R3(L.pClear),
        datum: datumOf(lens), contextDatum: datumOf(cx),
        lens: {strike: R3(lens.strike), old: R3(lens.old), grow: R3(lens.grow), reveal: R3(lens.reveal)},
        context: {strike: R3(cx.strike), old: R3(cx.old), grow: R3(cx.grow), reveal: R3(cx.reveal)},
        markerShown: R3(cx.marker), markLabelShown: L.mkLab ? R3(x(W.markLabel)) : 0,
        oldTraceable: cx.old >= 0.5 && lens.old >= 0.5,
        zoom: r(L.zoom, 2), placement: L.placement, fillH: r(L.fillH, 3), lensFallback: L.lensFallback,
        lensCopyMatches: Math.abs(zx - zy) < 1e-6 && L.zoom >= 1.5,
        values: {before: ctx.params.beforeValue, after: ctx.params.afterValue},
        speakersUnchanged: true,
        labelsFit: L.ok, textSize: L.S, scale: r(L.k, 2), layoutTries: L.tries,
        markNoteGap: L.markGap === null ? null : r(L.markGap, 1),
        mainActionEnd: W.markLabel[1],
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.2.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-06-inspect',
    title: 'Language interpretation — inspecting and substituting the rendering’s language label',
    titleEs: 'Interpretación lingüística — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Interpretación lingüística',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the table after the exchange — the first speaker’s bubble, the ribbon and the interpreter’s rendering in her own bubble, the listener turned to it. A lens copies the rendering’s language tab at the same coordinates; the old label is struck but stays readable, the tab grows and the supplied new label appears with its own glyph and colour. Back in context the same change is made and a neutral Δ marks the changed datum. Speakers, bubbles and words never change; seeking back restores the old label.',
    tags: ['interpreter', 'inspect', 'lens', 'language label', 'speech bubble', 'rendering', 'changed datum', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/interpretacion-linguistica.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/animations/roles/kits/entrevista-a-cliente.js', 'src/frameworks/lens.js', 'src/primitives/person.js', 'src/primitives/paper.js', 'src/primitives/annotate.js', 'src/primitives/markers.js', 'src/primitives/people-style.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
