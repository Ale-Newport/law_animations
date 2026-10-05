/**
 * LAW-0114 — Hecho contrafactual · mechanism
 *
 * Storyboard (exploded diorama: the scene is built from stacked layers like
 * animation cels; no actors perform here — the parts are laid out as cards):
 *  0.00–0.18 separate  At first the layers lie registered on top of each
 *                      other and read as ONE diorama: the SET board (house,
 *                      garden), the transparent EVENTS cel (the figurine with
 *                      the parcel at the start, its dotted route and numbered
 *                      event pins) and the CIRCUMSTANCE cel (the flag and the
 *                      dashed spot where the parcel is left). The layers slide
 *                      apart into their cards; a twin circumstance cel B peels
 *                      off cel A — still identical. The rule card slides out.
 *  0.18–0.43 relate    Only on cel B, the flag and its dashed spot move from
 *                      spot A to spot B (the ONE changed part; a dotted trace
 *                      keeps the old spot). Then only the SUPPLIED
 *                      relationships are drawn, from a port on one card's edge
 *                      to a port on the other's: plain relations without
 *                      arrowheads, sequences with one; causal style only when
 *                      supplied. Each caption sits beside its own link.
 *  0.43–0.75 trace     A tracer runs the supplied traversal order along the
 *                      drawn links while a magnifier, faded in beside the focus
 *                      card, lies over it; its glass shows a real, enlarged copy
 *                      of that layer.
 *  0.75–1.00 gather    The magnifier fades away; the whole mechanism stays
 *                      visible: origin (set + events, same in both takes), the
 *                      transformation (cel B only) and the state (the
 *                      hypothetical's outcome is not supplied, no conclusion
 *                      is drawn). Issues and assumptions sit in the notes band.
 * Wide/square boxes: set → events on row 1, cel A — rule — cel B on row 2,
 * notes band below. Tall boxes: set | events, cel A | cel B, rule, notes.
 * Links never share a path with notes or captions: notes live in their own band.
 * Legal content: fictional, jurisdiction unspecified, illustrative text.
 * @module animations/reasoning/LAW-0114
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, cubicPolyline, polyline} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, textBlock, connector, tracer} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  HC_STRINGS, hcFields, DEFAULT_CONTENT, STAGE, SPOTS, PW, PH, fill, hcColors,
  takePlan, takeState, parcelAt, flagBase,
  dioramaArt, flagArt, figurine, ruleNotice, noteChip, bake, bars, wordSafe,
} from './kits/hecho-contrafactual.js';

const ID = 'LAW-0114';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {sep: [0.02, 0.16], caps: [0.08, 0.17], swap: [0.185, 0.26], links: [0.26, 0.42], trace: [0.44, 0.74], lensIn: [0.4, 0.45], lensOut: [0.75, 0.8], notes: [0.78, 0.84], key: [0.8, 0.86]};
const EL = ['set', 'events', 'spotA', 'spotB', 'rule'];
const CROP = {x: 438, y: 222, w: 544, h: 214}; // native region holding every spot (flag tops to bench legs)

const sceneSchema = {
  ...hcFields,
  ...mechanismFields(EL),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  elements: [
    {id: 'set', label: 'Set · same in both takes'},
    {id: 'events', label: 'Events · same in both takes'},
    {id: 'spotA', label: 'Circumstance cel A'},
    {id: 'spotB', label: 'Circumstance cel B'},
    {id: 'rule', label: 'Rule notice'},
  ],
  relationships: [
    {from: 'set', to: 'events', kind: 'relation'},
    {from: 'events', to: 'spotA', kind: 'sequence'},
    {from: 'events', to: 'spotB', kind: 'sequence'},
    {from: 'spotA', to: 'rule', kind: 'relation'},
    {from: 'spotB', to: 'rule', kind: 'relation'},
  ],
  focusElement: 'spotB',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['set', 'events', 'spotA', 'rule', 'spotB'],
};

/* ------------------------------------------------------------------------ */

const labelOf = (p, id) => (p.elements.find(e => e.id === id) || {}).label || id;

/** Header text of a card (circumstance cels add the supplied spot text). */
function captionOf(ctx, id) {
  const p = ctx.params;
  const t = ctx.t;
  const c = p.circumstance;
  const lab = labelOf(p, id);
  if (id === 'spotA') return `${lab} — ${fill(t.baseT, {x: c.baseText})}`;
  if (id === 'spotB') return `${lab} — ${fill(t.whatIfT, {x: c.altText})}`;
  if (id === 'rule') return lab.toLowerCase().includes(t.illustrativeText.split(' ')[0].toLowerCase()) ? lab : `${lab} (${t.illustrativeText})`;
  return lab;
}

function capColor(ctx, id) {
  const col = hcColors(ctx);
  return id === 'spotA' ? col.a : id === 'spotB' ? col.b : id === 'rule' ? col.rule : ctx.theme.ink;
}

function notesList(ctx) {
  const p = ctx.params;
  const t = ctx.t;
  const out = [];
  if (ctx.show('all')) {
    p.issues.forEach((q, i) => out.push({name: `issue${i}`, text: `${t.issue}: ${q}`, color: ctx.theme.accent3}));
    p.assumptions.forEach((q, i) => out.push({name: `assume${i}`, text: `${t.assumed}: ${q}`, color: '#7d8b93'}));
  }
  if (ctx.show('key')) out.push({name: 'key', text: t.keyOutcome, color: ctx.theme.ink});
  return out;
}

/** Notes in a band: chips flow in `cols` equal columns (shortest column first). */
function notesBand(ctx, items, o) {
  const gap = o.s * 0.5;
  const colW = (o.w - gap * (o.cols - 1)) / o.cols;
  const ys = new Array(o.cols).fill(o.y);
  const out = [];
  for (const it of items) {
    const ci = ys.indexOf(Math.min(...ys));
    const c = noteChip(ctx, it.text, {name: it.name, x: o.x + ci * (colW + gap), y: ys[ci], size: o.s, minSize: o.s, maxWidth: colW, maxLines: 5, color: it.color});
    out.push({name: it.name, c});
    ys[ci] += c.box.h + gap;
  }
  return {out, h: items.length ? Math.max(...ys) - gap - o.y : 0};
}

/** Supplied events inside the events card. */
function eventsText(ctx, o) {
  const p = ctx.params;
  const s = o.s;
  const nodes = [];
  let y = o.y;
  const gs = ctx.glyphSize || s * 0.7;
  const numW = s * 1.7;
  p.facts.events.forEach((ev, i) => {
    const sz = wordSafe(ctx, ev, o.w - numW, s);
    const f = ctx.fit(ev, {maxWidth: o.w - numW, size: sz, minSize: sz, maxLines: 6, weight: 500});
    const th = ctx.theme;
    nodes.push(h('circle', {cx: r(o.x + s * 0.55), cy: r(y + s * 0.45), r: r(Math.max(s * 0.55, gs * 0.78)), fill: '#3d5566'}));
    if (ctx.show('key')) {
      nodes.push(h('text', {x: r(o.x + s * 0.55), y: r(y + s * 0.45 + gs * 0.36), 'text-anchor': 'middle', 'font-size': r(gs), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, String(i + 1)));
      nodes.push(textBlock(f, {x: o.x + numW, y, fill: th.ink, name: `ev${i}`}));
    } else nodes.push(bars(f, o.x + numW, y, th.inkSoft, 0.6));
    y += f.height + s * 0.4;
  });
  return {nodes, h: y - o.y - s * 0.4};
}

/** Card header (label) fitted to a width. */
function headerFit(ctx, id, w, s) {
  if (!ctx.show('key')) return {fit: null, h: s * 1.1};
  const pad = s * 0.5;
  const f = ctx.fit(captionOf(ctx, id), {maxWidth: w - pad * 2, size: s, minSize: s, maxLines: 5, weight: 700});
  return {fit: f, h: f.height + pad * 1.2, truncated: f.truncated};
}

/* ------------------------------------------------------------------------ */
/* Layout                                                                   */
/* ------------------------------------------------------------------------ */

function compose(ctx, s, k, sc, g = 3.6) {
  const D = ctx.design;
  const p = ctx.params;
  const t = ctx.t;
  const shape = ctx.view.shape;
  const m = 24;
  const avail = D.w - 2 * m;
  ctx.capSize = Math.min(s, Math.max(s * 0.64, 15 / sc));
  ctx.glyphSize = Math.min(s, Math.max(s * 0.7, 15.5 / sc));
  const L = {s, m, fits: true, shape, cards: {}};
  const inset = 10;
  const card = (id, x, y, w, bodyH) => {
    const hd = headerFit(ctx, id, w, s);
    if (hd.truncated) L.fits = false;
    return {id, x, y, w, headH: hd.h, head: hd.fit, bodyY: y + hd.h, bodyH, h: hd.h + bodyH};
  };
  const imgCard = (id, x, y, w, aspect) => {
    const iw = w - inset * 2;
    return {...card(id, x, y, w, iw * aspect + inset * 2), img: {w: iw, h: iw * aspect}};
  };
  const ruleCard = (x, y, w) => {
    const n = ruleNotice(ctx, {name: 'x', x: 0, y: 0, w, size: s, cap: ctx.capSize, title: p.rules.title, conditions: p.rules.conditions, kind: null});
    return {...card('rule', x, y, w, n.box.h), rule: true};
  };
  const eventsCard = (x, y, imgW, listW, below) => {
    const list = eventsText(ctx, {x: 0, y: 0, w: listW, s});
    const w = below ? imgW + inset * 2 : imgW + listW + inset * 3;
    const imgH = imgW * 0.6;
    const bodyH = below ? inset * 2 + imgH + s * 0.6 + list.h + inset : inset * 2 + Math.max(imgH, list.h);
    return {...card('events', x, y, w, bodyH), img: {w: imgW, h: imgH}, list: {w: listW, below}};
  };
  const aspectCel = CROP.h / CROP.w;
  const notes = notesList(ctx);
  if (shape === 'square') {
    // three rows: set → events | cel A · cel B | rule + notes
    const rowGap = Math.max(s * g, 56);
    const setW = avail * 0.26 * k;
    const set = imgCard('set', m, m + 4, setW, 0.6);
    const evImgW = avail * 0.22 * k;
    // the events list takes whatever width row 1 leaves (fewer lines, lower card)
    const evListW = Math.max(s * 9, D.w - m - (set.x + set.w + Math.max(s * 11, 200)) - evImgW - 30);
    const ev = eventsCard(0, m + 4, evImgW, evListW, false);
    ev.x = D.w - m - ev.w;
    if (ev.x < set.x + set.w + s * 5) L.fits = false;
    const y2 = m + 4 + Math.max(set.h, ev.h) + rowGap;
    const celW = (avail - s * 2.2) / 2 * (0.55 + 0.45 * k);
    const A0 = imgCard('spotA', m, y2, celW, aspectCel), B0 = imgCard('spotB', D.w - m - celW, y2, celW, aspectCel);
    const hd = Math.max(A0.headH, B0.headH);
    const A = imgCard('spotA', m, y2 + hd - A0.headH, celW, aspectCel);
    const B = imgCard('spotB', D.w - m - celW, y2 + hd - B0.headH, celW, aspectCel);
    const y3 = Math.max(A.y + A.h, B.y + B.h) + rowGap;
    const ruleW = avail * 0.54;
    const rule = ruleCard(m + avail * 0.02, y3, ruleW);
    L.cards = {set, events: ev, spotA: A, spotB: B, rule};
    // notes: beside the rule, or under it when that column ends higher
    const nx = rule.x + ruleW + s * 1.2;
    const cols = [{x: nx, w: D.w - m - nx, y: y3}, {x: rule.x, w: ruleW, y: rule.y + rule.h + s * 0.6}];
    L.notes = [];
    for (const it of notes) {
      const col = cols[0].y <= cols[1].y ? cols[0] : cols[1];
      const cc = noteChip(ctx, it.text, {name: it.name, x: col.x, y: col.y, size: s, minSize: s, maxWidth: col.w, maxLines: 5, color: it.color});
      L.notes.push({name: it.name, c: cc});
      col.y += cc.box.h + s * 0.5;
    }
    const bottom = Math.max(rule.y + rule.h, ...L.notes.map(nn => nn.c.box.y + nn.c.box.h));
    if (bottom > D.h - m) L.fits = false;
  } else if (shape !== 'portrait') {
    const sq = false;
    const gapX = Math.max(s * 5.5, 110);
    const celW = avail * (sq ? 0.31 : 0.28) * k;
    const ruleW = Math.min(avail - 2 * celW - 2 * gapX, s * (sq ? 16 : 19));
    if (ruleW < s * 10) L.fits = false;
    const rowGap = Math.max(s * 4.6, 110);
    // row 1: set → events (image + list side by side), events centred over the rule
    const setW = avail * (sq ? 0.24 : 0.2) * k;
    const set = imgCard('set', m, m + 4, setW, 0.6);
    const evImgW = avail * (sq ? 0.2 : 0.18) * k;
    const evListW = Math.max(s * 9, avail * (sq ? 0.25 : 0.2));
    let ev = eventsCard(0, m + 4, evImgW, evListW, false);
    const ruleX = m + celW + gapX + (avail - 2 * celW - 2 * gapX - ruleW) / 2;
    ev.x = clamp(ruleX + ruleW / 2 - ev.w / 2, set.x + set.w + gapX, D.w - m - ev.w);
    if (ev.x + ev.w > D.w - m + 0.5) L.fits = false;
    const row1 = Math.max(set.h, ev.h);
    const y2 = m + 4 + row1 + rowGap;
    const A = imgCard('spotA', m, y2, celW, aspectCel);
    const B = imgCard('spotB', D.w - m - celW, y2, celW, aspectCel);
    const hd = Math.max(A.headH, B.headH);
    const A2 = imgCard('spotA', m, y2 + hd - A.headH, celW, aspectCel);
    const B2 = imgCard('spotB', D.w - m - celW, y2 + hd - B.headH, celW, aspectCel);
    const rule = ruleCard(ruleX, y2, ruleW);
    L.cards = {set, events: ev, spotA: A2, spotB: B2, rule};
    const rowEnd = Math.max(A2.y + A2.h, B2.y + B2.h, rule.y + rule.h);
    const band = notesBand(ctx, notes, {x: m, y: rowEnd + s * 1.1, w: avail, s, cols: sq ? 2 : 3});
    L.notes = band.out;
    if (band.h && rowEnd + s * 1.1 + band.h > D.h - m) L.fits = false;
    if (!band.h && rowEnd > D.h - m) L.fits = false;
  } else {
    const rowGap = Math.max(s * 4.6, 100);
    const setW = avail * 0.42 * k, evW = avail * 0.52;
    const set = imgCard('set', m, m + 4, setW, 0.6);
    const ev = eventsCard(D.w - m - evW, m + 4, evW - 20, evW - 20, true);
    const row1 = Math.max(set.h, ev.h);
    const y2 = m + 4 + row1 + rowGap;
    const celW = (avail - s * 2) / 2;
    const A0 = imgCard('spotA', m, y2, celW, aspectCel), B0 = imgCard('spotB', D.w - m - celW, y2, celW, aspectCel);
    const hd = Math.max(A0.headH, B0.headH);
    const A = imgCard('spotA', m, y2 + hd - A0.headH, celW, aspectCel);
    const B = imgCard('spotB', D.w - m - celW, y2 + hd - B0.headH, celW, aspectCel);
    const y3 = Math.max(A.y + A.h, B.y + B.h) + rowGap;
    const ruleW = Math.min(avail * 0.8, s * 30);
    const rule = ruleCard((D.w - ruleW) / 2, y3, ruleW);
    L.cards = {set, events: ev, spotA: A, spotB: B, rule};
    const band = notesBand(ctx, notes, {x: m, y: rule.y + rule.h + s * 1.1, w: avail, s, cols: 2});
    L.notes = band.out;
    if ((band.h ? rule.y + rule.h + s * 1.1 + band.h : rule.y + rule.h) > D.h - m) L.fits = false;
  }
  L.y0 = m + 4;
  return L;
}

/** Ports: where a link leaves card a and lands on card b (on their edges), with outward normals. */
function ports(a, b) {
  const ax1 = a.x + a.w, bx1 = b.x + b.w, ay1 = a.y + a.h, by1 = b.y + b.h;
  const ovY0 = Math.max(a.y, b.y), ovY1 = Math.min(ay1, by1);
  if ((ax1 <= b.x || bx1 <= a.x) && ovY1 - ovY0 >= 40) {
    const y = (ovY0 + ovY1) / 2;
    return ax1 <= b.x
      ? {from: {x: ax1, y}, to: {x: b.x, y}, nf: {x: 1, y: 0}, nt: {x: -1, y: 0}}
      : {from: {x: a.x, y}, to: {x: bx1, y}, nf: {x: -1, y: 0}, nt: {x: 1, y: 0}};
  }
  const acx = a.x + a.w / 2, bcx = b.x + b.w / 2;
  const fx = clamp(bcx, a.x + a.w * 0.2, a.x + a.w * 0.8), tx = clamp(acx, b.x + b.w * 0.2, b.x + b.w * 0.8);
  return ay1 <= b.y
    ? {from: {x: fx, y: ay1}, to: {x: tx, y: b.y}, nf: {x: 0, y: 1}, nt: {x: 0, y: -1}}
    : {from: {x: fx, y: a.y}, to: {x: tx, y: by1}, nf: {x: 0, y: -1}, nt: {x: 0, y: 1}};
}

const box = c => ({x: c.x, y: c.y, w: c.w, h: c.h});
const hitBox = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

function finish(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const col = hcColors(ctx);
  const D = ctx.design;
  const s = L.s;
  const C = L.cards;
  const inset = 10;
  const cond = Math.min(p.circumstance.condition ?? 0, p.rules.conditions.length - 1);
  L.cond = cond;
  const c = p.circumstance;

  // --- layer art (native units)
  L.art = dioramaArt(ctx, {prefix: 'm'});
  const look = actorLook(ctx, {appearance: {}}, 0);
  const plan = takePlan(c.base, Math.max(SPOTS[c.base].cx, SPOTS[c.alt].cx) - 34 - STAGE.startX);
  const st0 = takeState(plan, 0);
  const fig = figurine(ctx, {name: 'mfig', look});
  const figBaked = bake(fig.node, fig.pose({x: st0.figX, lift: 0, near: st0.near, far: st0.far}).nodes);
  const parcelBox = q => h('g', {transform: T(q.x, q.y)},
    h('rect', {x: -PW / 2, y: -PH / 2, width: PW, height: PH, rx: 3, fill: '#c8955c', stroke: th.ink, 'stroke-width': 2.2}),
    h('rect', {x: -4, y: -PH / 2, width: 8, height: PH, fill: '#e6c690', opacity: 0.9}));
  const n = p.facts.events.length;
  const routeX1 = CROP.x + 20;
  const pins = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(STAGE.startX, routeX1, n === 1 ? 0 : i / (n - 1));
    pins.push(g({transform: T(x, STAGE.floorY + 6)}, h('circle', {r: 16, fill: '#3d5566', stroke: th.ink, 'stroke-width': 2}), h('circle', {r: 6, fill: '#ffffff'})));
  }
  L.eventsArt = g(null,
    h('path', {d: `M${STAGE.startX + 40} ${STAGE.floorY + 6}H${routeX1}`, stroke: '#3d5566', 'stroke-width': 5, 'stroke-dasharray': '4 12', 'stroke-linecap': 'round', fill: 'none'}),
    pins, figBaked, parcelBox(st0.parcel));
  const spotOutline = (name, q, color) => h('rect', {name, x: -PW / 2 - 6, y: -PH / 2 - 6, width: PW + 12, height: PH + 12, rx: 5, fill: color, 'fill-opacity': 0.3, stroke: color, 'stroke-width': 4.4, 'stroke-dasharray': '9 5', transform: T(q.x, q.y)});
  L.flagA = flagArt(ctx, 'flagA', col.flag);
  L.flagB = flagArt(ctx, 'flagB', col.flag);

  // --- image placement (native → world) inside each card; assembled registration at the centre
  const imgAt = cd => ({x: cd.x + inset, y: cd.bodyY + inset});
  const sI = imgAt(C.set), eI = imgAt(C.events), aI = imgAt(C.spotA), bI = imgAt(C.spotB);
  const ds = C.set.img.w / STAGE.w, dsE = C.events.img.w / STAGE.w, dsA = C.spotA.img.w / CROP.w, dsB = C.spotB.img.w / CROP.w;
  const setAt = {x: sI.x, y: sI.y, k: ds};
  const evAt = {x: eI.x, y: eI.y, k: dsE};
  const aAt = {x: aI.x - CROP.x * dsA, y: aI.y - CROP.y * dsA, k: dsA};
  const bAt = {x: bI.x - CROP.x * dsB, y: bI.y - CROP.y * dsB, k: dsB};
  // the opening frame: the registered stack is large and centred (it fills the safe box, then splits)
  const asmK = Math.max(ds, dsE, Math.min((D.w * 0.84) / STAGE.w, (D.h * 0.84) / STAGE.h));
  const asm = {x: D.w / 2 - STAGE.w * asmK / 2, y: D.h / 2 - STAGE.h * asmK / 2, k: asmK};
  L.asmBox = {x: asm.x, y: asm.y, w: STAGE.w * asmK, h: STAGE.h * asmK};
  L.at = {set: setAt, events: evAt, spotA: aAt, spotB: bAt, asm};
  const clipRect = (id, b) => h('clipPath', {id: ctx.id(id)}, h('rect', {x: b.x, y: b.y, width: b.w, height: b.h, rx: 4}));
  const celSheet = (w, hh, x0, y0, name) => g({name},
    h('rect', {x: x0, y: y0, width: w, height: hh, rx: 10, fill: '#ffffff', 'fill-opacity': 0.18, stroke: '#5f8098', 'stroke-width': 3.4}),
    h('circle', {cx: x0 + w * 0.3, cy: y0 + 14, r: 7, fill: '#e9edf0', stroke: '#5f8098', 'stroke-width': 2}),
    h('circle', {cx: x0 + w * 0.7, cy: y0 + 14, r: 7, fill: '#e9edf0', stroke: '#5f8098', 'stroke-width': 2}));
  L.setNode = g({name: 'pSet', transform: T(asm.x, asm.y, 0, asm.k)}, L.art.back, L.art.boxFront, L.art.apron);
  L.evNode = g({name: 'pEvents', transform: T(asm.x, asm.y, 0, asm.k)}, g({name: 'evUnder', opacity: 0}, bake(L.art.back)), celSheet(STAGE.w - 8, STAGE.h - 8, 4, 4, 'evCel'), L.eventsArt);
  const pa = parcelAt(c.base), pb = parcelAt(c.alt);
  const fa = flagBase(c.base);
  L.aNode = g({name: 'pA', transform: T(asm.x, asm.y, 0, asm.k)},
    g({'clip-path': ctx.ref('clipA')}, g({name: 'aUnder', opacity: 0}, bake(L.art.back)), celSheet(CROP.w, CROP.h, CROP.x, CROP.y, 'aCel'), spotOutline('aSpot', pa, col.a)),
    g({transform: T(fa.x, fa.y)}, L.flagA));
  L.bNode = g({name: 'pB', transform: T(asm.x, asm.y, 0, asm.k)},
    g({'clip-path': ctx.ref('clipB')}, g({name: 'bUnder', opacity: 0}, bake(L.art.back)), celSheet(CROP.w, CROP.h, CROP.x, CROP.y, 'bCel'),
      h('rect', {name: 'bTrace', x: pa.x - PW / 2 - 6, y: pa.y - PH / 2 - 6, width: PW + 12, height: PH + 12, rx: 5, fill: 'none', stroke: col.a, 'stroke-width': 3, 'stroke-dasharray': '3 6', opacity: 0}),
      spotOutline('bSpot', pa, col.b)),
    g({name: 'bFlagT', transform: T(fa.x, fa.y)}, L.flagB));
  L.defs = h('defs', null, clipRect('clipA', {x: CROP.x - 2, y: CROP.y - 2, w: CROP.w + 4, h: CROP.h + 4}), clipRect('clipB', {x: CROP.x - 2, y: CROP.y - 2, w: CROP.w + 4, h: CROP.h + 4}));
  L.pa = pa;
  L.pb = pb;
  L.fa = fa;
  L.fb = flagBase(c.alt);

  // --- card frames and headers (fade in as the layers settle into them)
  L.frames = Object.values(C).map(cd => {
    const colr = capColor(ctx, cd.id);
    const pad = s * 0.55;
    const parts = [];
    if (!cd.rule) {
      parts.push(h('path', {d: roundRectPath(cd.x + 5, cd.y + 7, cd.w, cd.h, 12), fill: th.shadow}));
      parts.push(h('path', {d: roundRectPath(cd.x, cd.y, cd.w, cd.h, 12), fill: cd.id === 'set' ? '#f4efe6' : '#f7f9fa', stroke: colr, 'stroke-width': 3}));
    }
    parts.push(h('path', {d: `M${r(cd.x + 12)} ${r(cd.y)}H${r(cd.x + cd.w - 12)}Q${r(cd.x + cd.w)} ${r(cd.y)} ${r(cd.x + cd.w)} ${r(cd.y + 12)}V${r(cd.y + cd.headH)}H${r(cd.x)}V${r(cd.y + 12)}Q${r(cd.x)} ${r(cd.y)} ${r(cd.x + 12)} ${r(cd.y)}Z`, fill: cd.id === 'spotB' ? '#fbe9e3' : cd.id === 'spotA' ? '#e3edf5' : cd.id === 'rule' ? '#d3e0d6' : '#ece9e1', stroke: colr, 'stroke-width': 3}));
    if (cd.head) parts.push(textBlock(cd.head, {x: cd.x + s * 0.5, y: cd.y + s * 0.5 * 0.6, fill: th.ink}));
    else parts.push(h('rect', {x: r(cd.x + pad), y: r(cd.y + cd.headH * 0.35), width: r(cd.w * 0.5), height: r(cd.headH * 0.3), rx: 4, fill: colr, opacity: 0.6}));
    return g({name: `frame-${cd.id}`, opacity: 0}, parts);
  });
  L.rule = ruleNotice(ctx, {name: 'rule', x: C.rule.x, y: C.rule.bodyY, w: C.rule.w, size: s, cap: ctx.capSize, title: p.rules.title, conditions: p.rules.conditions, kind: null, highlight: cond});
  L.evList = C.events.list.below
    ? eventsText(ctx, {x: C.events.x + inset, y: eI.y + C.events.img.h + s * 0.6, w: C.events.list.w, s})
    : eventsText(ctx, {x: eI.x + C.events.img.w + inset, y: eI.y, w: C.events.list.w, s});

  // --- links: port to port on the card edges, captions beside their own link
  L.boxes = Object.fromEntries(Object.entries(C).map(([id, cd]) => [id, box(cd)]));
  const rels = p.relationships.filter(rl => rl.from !== rl.to && C[rl.from] && C[rl.to]);
  const labels = {relation: p.relationLabels.relation || t.relation, communication: p.relationLabels.communication || t.communication, sequence: p.relationLabels.sequence || t.sequence, causal: p.relationLabels.causal || t.causal};
  const noteBoxes = L.notes.map(nn => nn.c.box);
  const placed = [];
  L.labelsOk = true;
  L.labelsSeated = true;
  L.links = rels.map((rl, i) => {
    const pt = ports(C[rl.from], C[rl.to]);
    const dist = Math.hypot(pt.to.x - pt.from.x, pt.to.y - pt.from.y);
    const d = Math.max(30, dist * 0.42);
    const c1 = {x: pt.from.x + pt.nf.x * d, y: pt.from.y + pt.nf.y * d};
    const c2 = {x: pt.to.x + pt.nt.x * d, y: pt.to.y + pt.nt.y * d};
    const kc = kindColor(ctx, rl.kind);
    const cn = connector(ctx, {name: `lk${i}`, from: pt.from, to: pt.to, c1, c2, kind: rl.kind, color: kc});
    const poly = cubicPolyline(pt.from, c1, c2, pt.to, 40);
    return {rel: rl, pt, cn, poly, color: kc, text: labels[rl.kind] || rl.kind};
  });
  // caption placement: along the link, on either side, clear of cards, notes, other captions and link ends
  const cardBoxes = Object.values(L.boxes);
  const linkPolys = L.links.map(lk => lk.poly.pts);
  L.links.forEach((lk, i) => {
    lk.lab = null;
    if (!ctx.show('all')) return;
    let best = null;
    // seated on the connector first (every width and position), only then beside it (with a leader)
    for (const pass of [[[0, 1]], [[1, 1], [-1, 1], [1, 1.9], [-1, 1.9], [1, 2.8], [-1, 2.8]]]) {
    if (best) break;
    for (const mw of [s * 9, s * 12, s * 7, s * 15, s * 20, s * 25, s * 6]) {
      const probe = chip(ctx, lk.text, {x: 0, y: 0, maxWidth: mw, size: s, minSize: s, maxLines: 4});
      if (probe.fit.truncated) continue;
      const bw = probe.box.w, bh = probe.box.h;
      for (const tt of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
        const q = lk.poly.at(tt);
        const nx = -Math.sin(q.a), ny = Math.cos(q.a);
        for (const [side, far] of pass) {
          const off = side === 0 ? 0 : (Math.abs(nx) * bw / 2 + Math.abs(ny) * bh / 2) * far + (far === 1 ? 2 : 10);
          const cx = q.x + nx * off * side, cy = q.y + ny * off * side;
          const b = {x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh};
          if (b.x < L.m - 6 || b.y < 4 || b.x + b.w > D.w - L.m + 6 || b.y + b.h > D.h - 4) continue;
          if (cardBoxes.some(cb => hitBox(b, cb, 6)) || noteBoxes.some(nb => hitBox(b, nb, 6)) || placed.some(pb2 => hitBox(b, pb2, 8))) continue;
          // never over another link, nor over this link's ends
          if (linkPolys.some((pp, j) => j !== i && pp.some(v => v.x > b.x - 6 && v.x < b.x + b.w + 6 && v.y > b.y - 6 && v.y < b.y + b.h + 6))) continue;
          if ([lk.pt.from, lk.pt.to].some(v => v.x > b.x - 9 && v.x < b.x + b.w + 9 && v.y > b.y - 9 && v.y < b.y + b.h + 9)) continue;
          best = {mw, cx, cy, b, on: side === 0, q, far: far > 1};
          break;
        }
        if (best) break;
      }
      if (best) break;
    }
    }
    if (!best) { L.labelsOk = false; return; }
    if (!best.on && best.far) L.labelsSeated = false;
    placed.push(best.b);
    const cc = chip(ctx, lk.text, {x: best.cx, y: best.b.y, anchor: 'middle', maxWidth: best.mw, size: s, minSize: s, maxLines: 4, fill: th.card, stroke: lk.color, name: `lkl${i}`, weight: 600});
    // a caption moved away from its link keeps a short dotted leader to it
    // (a caption beside its link, not seated on it, always keeps a short dotted leader to it)
    const lead = !best.on && best.far ? (() => {
      const bx = clamp(best.q.x, cc.box.x, cc.box.x + cc.box.w), by = clamp(best.q.y, cc.box.y, cc.box.y + cc.box.h);
      return h('line', {x1: r(bx), y1: r(by), x2: r(best.q.x), y2: r(best.q.y), stroke: lk.color, 'stroke-width': 2.2, 'stroke-dasharray': '3 5'});
    })() : null;
    const bx0 = clamp(best.q.x, cc.box.x, cc.box.x + cc.box.w), by0 = clamp(best.q.y, cc.box.y, cc.box.y + cc.box.h);
    lk.lab = {node: g(null, lead, cc.node), box: cc.box, on: best.on, q: best.q, gap: Math.hypot(bx0 - best.q.x, by0 - best.q.y), leader: !!lead};
  });

  // --- tracer route along the supplied order (following the drawn links)
  const order = p.traversalOrder.filter(id => C[id]);
  const center = id => ({x: C[id].x + C[id].w / 2, y: C[id].y + C[id].h / 2});
  const pts = [];
  const visitsIdx = [];
  order.forEach((id, q) => {
    if (q === 0) { pts.push(center(id)); visitsIdx.push({id, i: 0}); return; }
    const prev = order[q - 1];
    const lk = L.links.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    if (lk) {
      const fw = lk.rel.from === prev;
      const seq = fw ? lk.poly.pts : lk.poly.pts.slice().reverse();
      pts.push(...seq);
    }
    pts.push(center(id));
    visitsIdx.push({id, i: pts.length - 1});
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  L.route = {poly: polyline(pts), visits: visitsIdx.map(v => ({id: v.id, t: cum[v.i] / total}))};
  L.tracer = tracer(ctx, 'tracer');

  // --- magnifier over the focus card (fades in beside it, never enters from off the frame)
  const focus = p.focusElement;
  L.focus = focus;
  const fcard = C[focus];
  const R = Math.max(54, Math.min((fcard.img ? fcard.img.h : fcard.bodyH) * 0.46, 104));
  L.R = R;
  const fp0 = focusPoint(L, focus, inset);
  const bodyBox = {x: fcard.x + inset, y: fcard.bodyY + inset, w: fcard.w - 2 * inset, h: fcard.bodyH - 2 * inset};
  const fp = {x: clamp(fp0.x, bodyBox.x + R, bodyBox.x + bodyBox.w - R), y: clamp(fp0.y, bodyBox.y + R, bodyBox.y + bodyBox.h - R)};
  if (bodyBox.w < 2 * R) fp.x = bodyBox.x + bodyBox.w / 2;
  if (bodyBox.h < 2 * R) fp.y = bodyBox.y + bodyBox.h / 2;
  L.lensAt = fp;
  L.lensFrom = {x: fp.x + R * 0.9 * (fp.x > D.w / 2 ? -1 : 1), y: fp.y - R * 0.6};
  const zoom = 1.9;
  L.zoom = zoom;
  const copyOf = id => {
    if (id === 'rule') return bake(L.rule.node, {});
    const A = L.at[id];
    const tf = T(A.x, A.y, 0, A.k);
    if (id === 'set') return g({transform: tf}, bake(L.art.back), bake(L.art.boxFront), bake(L.art.apron));
    if (id === 'events') return g({transform: tf}, g({opacity: 0.5}, bake(L.art.back)), bake(L.eventsArt));
    const q = id === 'spotB' ? pb : pa;
    const fq = id === 'spotB' ? L.fb : fa;
    const cl = id === 'spotB' ? col.b : col.a;
    return g({transform: tf}, g({opacity: 0.5}, bake(L.art.back)), g({transform: T(q.x, q.y)}, h('rect', {x: -PW / 2 - 6, y: -PH / 2 - 6, width: PW + 12, height: PH + 12, rx: 5, fill: cl, 'fill-opacity': 0.3, stroke: cl, 'stroke-width': 4.4, 'stroke-dasharray': '9 5'})), g({transform: T(fq.x, fq.y)}, bake(flagArt(ctx, 'x', col.flag))));
  };
  L.lens = g({name: 'lupa', opacity: 0, transform: T(fp.x, fp.y)},
    h('circle', {r: R + 10, fill: th.shadow, transform: T(6, 9)}),
    h('line', {x1: R * 0.72, y1: R * 0.72, x2: R * 1.45, y2: R * 1.45, stroke: '#5a3b24', 'stroke-width': 18, 'stroke-linecap': 'round'}),
    h('line', {x1: R * 0.72, y1: R * 0.72, x2: R * 0.95, y2: R * 0.95, stroke: '#9aa4ad', 'stroke-width': 22, 'stroke-linecap': 'butt'}),
    h('circle', {r: R, fill: '#f6f8f9'}),
    h('defs', null, h('clipPath', {id: ctx.id('lensClip')}, h('circle', {r: R - 3}))),
    g({'clip-path': ctx.ref('lensClip')}, g({name: 'lupa-copy', transform: `${scaleAbout(0, 0, zoom)} ${T(-fp.x, -fp.y)}`}, copyOf(focus))),
    h('circle', {r: R, fill: 'none', stroke: '#9aa4ad', 'stroke-width': 10}),
    h('circle', {r: R, fill: 'none', stroke: th.ink, 'stroke-width': 2.4}),
  );
  return L;
}

/** Point of an element where the lens looks. */
function focusPoint(L, id, inset) {
  const cd = L.cards[id];
  if (id === 'spotA' || id === 'spotB') {
    const A = L.at[id];
    const q = id === 'spotB' ? L.pb : L.pa;
    return {x: A.x + (q.x + 14) * A.k, y: A.y + (q.y - 18) * A.k};
  }
  if (id === 'events') return {x: L.at.events.x + (STAGE.startX + 30) * L.at.events.k, y: L.at.events.y + (STAGE.floorY - 110) * L.at.events.k};
  if (id === 'set') return {x: L.at.set.x + 700 * L.at.set.k, y: L.at.set.y + 330 * L.at.set.k};
  const a = L.rule.anchors[L.cond];
  return {x: a.box.x + a.box.w * 0.35, y: a.box.y + a.box.h / 2 + inset * 0};
}

/* ------------------------------------------------------------------------ */

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1080], portrait: [900, 1400]},
  layout(ctx) {
    const D = ctx.design;
    const sc = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h);
    const base = 22 / sc;
    let first = null, okFirst = null;
    // keep text ≥ ~20 px while the cards may shrink to ~80 %; then go down towards ~16 px
    const tries = [];
    for (const k of [1, 0.94, 0.88, 0.82]) for (const kk of [1, 0.95, 0.91]) tries.push([kk, k]);
    for (const k of [0.76, 0.7, 0.64, 0.58]) tries.push([0.9, k]);
    for (const k of [1, 0.94, 0.88, 0.82, 0.76, 0.7, 0.64, 0.58]) for (const kk of [0.87, 0.83, 0.79, 0.76, 0.73]) tries.push([kk, k]);
    // square boxes also try tighter row gaps (the captions move beside their links) before the text shrinks
    const gaps = ctx.view.shape === 'square' ? [3.6, 3, 2.4] : [3.6];
    for (const [kk, k] of tries) {
      for (const gg of gaps) {
        const C = compose(ctx, base * kk, k, sc, gg);
        if (!C.fits) continue;
        C.sc = sc;
        const F = finish(ctx, C);
        if (F.labelsOk && F.labelsSeated) return F;
        if (F.labelsOk && !okFirst) okFirst = F;
        if (!first) first = F;
      }
    }
    if (okFirst) return okFirst;
    if (first) return first;
    const C = compose(ctx, base * 0.73, 0.7, sc);
    C.sc = sc;
    return finish(ctx, C);
  },
  build(ctx, L) {
    return g(null,
      L.defs,
      L.frames,
      L.setNode,
      g({name: 'links'}, L.links.map(lk => lk.cn.node)),
      L.evNode,
      L.aNode,
      L.bNode,
      g({name: 'evListG', opacity: 0}, L.evList.nodes),
      g({name: 'ruleG', opacity: 0}, L.rule.node),
      L.tracer,
      L.links.map((lk, i) => lk.lab && g({name: `lklG${i}`, opacity: 0}, lk.lab.node)),
      L.lens,
      L.notes.map(nn => nn.c.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const D = ctx.design;
    const reduced = ctx.reduced;
    const nodes = {};
    // --- separate: every layer glides from the registered stack into its card (staggered)
    const sepOf = i => (reduced ? ease.outCubic : ease.inOutCubic)(seg(u, W.sep[0] + i * 0.02, W.sep[1] - (3 - i) * 0.012));
    const place = (A, B, k) => T(lerp(A.x, B.x, k), lerp(A.y, B.y, k), 0, lerp(A.k, B.k, k));
    const kS = sepOf(0), kE = sepOf(1), kA = sepOf(2), kB = sepOf(3);
    nodes.pSet = {transform: place(L.at.asm, L.at.set, kS)};
    nodes.pEvents = {transform: place(L.at.asm, L.at.events, kE)};
    nodes.pA = {transform: place(L.at.asm, L.at.spotA, kA)};
    nodes.pB = {transform: place(L.at.asm, L.at.spotB, kB)};
    nodes.evUnder = {opacity: r(0.45 * kE, 3)};
    nodes.aUnder = {opacity: r(0.5 * kA, 3)};
    nodes.bUnder = {opacity: r(0.5 * kB, 3)};
    const capK = seg(u, ...W.caps);
    for (const id of Object.keys(L.cards)) nodes[`frame-${id}`] = {opacity: r(capK, 3)};
    nodes.evListG = {opacity: r(capK, 3)};
    nodes.ruleG = {opacity: r(seg(u, 0.1, 0.18), 3)};

    // --- the one changed part: cel B's flag and spot move A → B (a dotted trace keeps A)
    const sw = ease.inOutCubic(seg(u, ...W.swap));
    const lift = Math.sin(Math.PI * sw) * 50;
    const fB = {x: lerp(L.fa.x, L.fb.x, sw), y: lerp(L.fa.y, L.fb.y, sw) - lift};
    const sB = {x: lerp(L.pa.x, L.pb.x, sw), y: lerp(L.pa.y, L.pb.y, sw) - lift};
    nodes.bFlagT = {transform: T(fB.x, fB.y)};
    nodes.bSpot = {transform: T(sB.x, sB.y)};
    nodes.bTrace = {opacity: r(p.circumstance.base === p.circumstance.alt ? 0 : seg(sw, 0.2, 0.6), 3)};

    // --- links drawn one after another (only the supplied ones); captions after their link
    const nL = L.links.length;
    const linkP = i => ease.inOutCubic(seg(u, W.links[0] + (i * (W.links[1] - W.links[0])) / (nL + 0.5), W.links[0] + ((i + 1.5) * (W.links[1] - W.links[0])) / (nL + 0.5)));
    L.links.forEach((lk, i) => {
      const pp = linkP(i);
      Object.assign(nodes, lk.cn.frame(pp, pp > 0 ? 1 : 0));
      if (lk.lab) nodes[`lklG${i}`] = {opacity: r(seg(pp, 0.55, 1), 3)};
    });
    const ruleLinked = L.links.some((lk, i) => (lk.rel.to === 'rule' || lk.rel.from === 'rule') && linkP(i) >= 1);
    nodes[`rule-hl${L.cond}`] = {opacity: ruleLinked ? 1 : 0};

    // --- tracer
    const te = ease.inOutSine(seg(u, ...W.trace));
    const tracing = u >= W.trace[0] && u <= W.trace[1] + 0.02;
    const tp = L.route.poly.at(te);
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: tracing ? 1 : 0};
    const visited = L.route.visits.filter(v => u >= W.trace[0] && te >= v.t - 1e-6).map(v => v.id);

    // --- magnifier: fades in beside the focus card and settles over it; fades away at the gather beat
    const kIn = ease.inOutSine(seg(u, ...W.lensIn));
    const kOut = ease.inOutSine(seg(u, ...W.lensOut));
    const lensK = kIn * (1 - kOut);
    const lensC = {x: lerp(L.lensFrom.x, L.lensAt.x, kIn), y: lerp(L.lensFrom.y, L.lensAt.y, kIn)};
    const scl = 0.75 + 0.25 * lensK;
    nodes.lupa = {transform: `${T(lensC.x, lensC.y)} scale(${r(scl, 4)})`, opacity: r(lensK, 3)};
    nodes['lupa-copy'] = {transform: `${scaleAbout(0, 0, L.zoom)} ${T(-lensC.x, -lensC.y)}`};

    // --- notes / key (in their own band)
    const nk = seg(u, ...W.notes);
    L.notes.forEach((nn, i) => { nodes[nn.name] = {opacity: r(nn.name === 'key' ? seg(u, ...W.key) : clamp(nk * 1.5 - i * 0.15), 3)}; });

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const edgeGap = (q, b) => {
      const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
      const out = Math.hypot(dx, dy);
      return out > 0 ? out : Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y);
    };
    const links = L.links.map((lk, i) => ({from: lk.rel.from, to: lk.rel.to, kind: lk.rel.kind, drawn: r(linkP(i), 3), fromGap: r(edgeGap(lk.pt.from, L.boxes[lk.rel.from]), 2), toGap: r(edgeGap(lk.pt.to, L.boxes[lk.rel.to]), 2), arrow: ['sequence', 'communication', 'causal'].includes(lk.rel.kind), end: P2(lk.pt.to), start: P2(lk.pt.from)}));
    // does a link pass through another card, a note or a caption? (ends excluded)
    const crossings = [];
    L.links.forEach((lk, i) => {
      const inner = lk.poly.pts.slice(3, -3);
      Object.entries(L.boxes).forEach(([id, b]) => { if (id !== lk.rel.from && id !== lk.rel.to && inner.some(v => v.x > b.x && v.x < b.x + b.w && v.y > b.y && v.y < b.y + b.h)) crossings.push(`${i}:card:${id}`); });
      L.notes.forEach(nn => { const b = nn.c.box; if (inner.some(v => v.x > b.x && v.x < b.x + b.w && v.y > b.y && v.y < b.y + b.h)) crossings.push(`${i}:note:${nn.name}`); });
      L.links.forEach((o2, j) => { if (j !== i && o2.lab) { const b = o2.lab.box; if (inner.some(v => v.x > b.x && v.x < b.x + b.w && v.y > b.y && v.y < b.y + b.h)) crossings.push(`${i}:label:${j}`); } });
    });
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      separated: r(Math.min(kS, kE, kA, kB), 3),
      assembled: kS === 0 && kE === 0 && kA === 0 && kB === 0,
      stackShare: {w: r(L.asmBox.w / D.w, 3), h: r(L.asmBox.h / D.h, 3)},
      bSwap: r(sw, 3),
      flagA: p.circumstance.base,
      flagB: sw >= 1 ? p.circumstance.alt : sw <= 0 ? p.circumstance.base : null,
      changedLayers: sw > 0 && p.circumstance.base !== p.circumstance.alt ? ['spotB'] : [],
      links,
      linkCrossings: crossings,
      labelsPlaced: L.links.every(lk => !ctx.show('all') || !!lk.lab),
      // every caption is seated on (or touching) its connector, or tied to it by a visible leader
      captionSeats: L.links.filter(lk => lk.lab).map(lk => ({gap: r(lk.lab.gap, 1), leader: lk.lab.leader})),
      causalLinks: links.filter(e => e.kind === 'causal').length,
      tracer: P2(tp),
      tracerOn: tracing,
      visited,
      visitOrder: L.route.visits.map(v => v.id),
      focus: L.focus,
      lens: P2(lensC),
      lensVisible: lensK > 0,
      lensOverFocus: lensK >= 0.999 && Math.hypot(lensC.x - L.lensAt.x, lensC.y - L.lensAt.y) < 0.5,
      lensAway: lensK <= 0.001,
      lensBox: {x: r(lensC.x - L.R * scl), y: r(lensC.y - L.R * scl), w: r(2.45 * L.R * scl), h: r(2.45 * L.R * scl)},
      boxes: Object.fromEntries(Object.entries(L.boxes).map(([k2, b]) => [k2, {x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)}])),
      labelBoxes: L.links.filter(lk => lk.lab).map(lk => ({x: r(lk.lab.box.x), y: r(lk.lab.box.y), w: r(lk.lab.box.w), h: r(lk.lab.box.h)})),
      noteBoxes: L.notes.map(nn => ({x: r(nn.c.box.x), y: r(nn.c.box.y), w: r(nn.c.box.w), h: r(nn.c.box.h)})),
      notes: L.notes.map(nn => nn.c.fit.lines.join(' ')),
      celShare: r(L.cards.spotA.w / ctx.design.w, 3),
      design: {w: r(ctx.design.w), h: r(ctx.design.h)},
      ruleHighlighted: ruleLinked ? L.cond : null,
      outcome: 'not-supplied',
      winner: null,
      complete: W.key[1],
      textPx: r(L.s * L.sc, 2),
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
    slug: 'reasoning-09-mechanism',
    title: 'Counterfactual fact — an exploded diorama: set and events stay, only the circumstance cel is swapped',
    titleEs: 'Hecho contrafactual — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho contrafactual',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The diorama starts as one registered stack of layers — set board, transparent events cel (figurine, route, numbered event pins) and circumstance cel (flag and spot) — and explodes into labelled cards. A twin circumstance cel B peels off and only its flag moves to the other spot. The supplied relationships are drawn from port to port on the cards’ edges (plain relation without arrowheads, sequence with one, causal only if supplied), each captioned beside its own link; a tracer follows the supplied order while a magnifier shows a real enlarged copy of the focus layer. Outcome of the hypothetical not supplied; no conclusion drawn.',
    tags: ['reasoning', 'counterfactual', 'hypothetical', 'mechanism', 'exploded view', 'layers', 'cel', 'relation', 'tracer', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-contrafactual.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HC_STRINGS,
  scene,
});
