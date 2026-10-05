/**
 * LAW-0110 — Premisa oculta · mechanism
 *
 * Storyboard (an exploded, two-layer parts diagram on a plain ground; no hands,
 * no table). The SURFACE layer is the argument as written (fact card and
 * conclusion card on the walk line); the BENEATH layer is what lies in the gap:
 *  0.00–0.18 separate  The walk starts closed: fact and conclusion abut and
 *                      hide the intermediate card under their seam, each with
 *                      its brass hinge folded back. The parts come apart: the
 *                      two cards slide out to the ends of the walk line, which
 *                      leaves the GAP (a dashed slot); the intermediate card
 *                      drops out of it into the layer beneath (dashed drop
 *                      lines keep it tied to the slot); both hinges come off
 *                      their edges, open flat and lie in a parts tray (the
 *                      connector); the magnifier waits at a station.
 *  0.18–0.43 relate    Only the SUPPLIED relationships are drawn, one after the
 *                      other, each anchored to the edges of its two parts and in
 *                      its own style: a plain relation has end dots and NO
 *                      arrowhead; sequence / communication get an arrowhead; a
 *                      thick causal arrow only when the author supplies it. The
 *                      default set includes the argument as written — fact,
 *                      then conclusion — arcing OVER the empty gap.
 *  0.43–0.75 trace     A tracer follows `traversalOrder` along the drawn links;
 *                      the focus part enlarges while the tracer is on it and the
 *                      magnifier glides over it (its glass shows a real,
 *                      text-free enlarged copy), then back to its station.
 *  0.75–1.00 gather    The mechanism is gathered with its origin kept in view
 *                      (the tray and its dashed outlines stay; the links stay
 *                      attached to the moving edges). The SUPPLIED status
 *                      decides the end state, nothing is inferred: stated → the
 *                      card rises into the gap and both hinges latch it into
 *                      the walk; unstated → the card stays in the layer beneath
 *                      the empty gap and both hinges fold back onto their own
 *                      cards. Every link is labelled on its own wire, a key
 *                      names the link kinds and the state "as supplied · no
 *                      conclusion drawn"; the supplied issue and assumption
 *                      are shown.
 * Every box: surface row above, beneath row below (tall boxes spread their
 * spare height into the gap between the layers). During the action the diagram
 * is centred in the frame; at the gather it slides up to make room for the key
 * band. The hinges leave their cards straight down their own inner margins and
 * travel along the gap between the layers (never across the premise), and the
 * card drops only after they have passed. The tracer fades while it is inside a
 * part (over its text). A link whose two parts end up overlapping (a hinge
 * folded back on its card) is not drawn; its caption keeps a solid leader to
 * the part instead.
 * Legal content: fictional, jurisdiction unspecified; texts, links and status
 * are the author's; relation is never drawn as causation by default.
 * @module animations/reasoning/LAW-0110
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, oneOf, list, obj} from '../../schemas/fields.js';
import {chip, tracer, textBlock} from '../../primitives/annotate.js';
import {hitsAny, segPolys, balancedWidth, segmentHits} from '../causation/kits/place.js';
import {
  poFields, premiseStatusField, PO_STRINGS, DEFAULT_CONTENT, walkGeometry, cardArt, recessShade, hingeUnit, walkCopy,
  lupaArt, notesSize, notesColumn, keyChip, centerOf, unitsPer1080px, curveLink, linkSample, linkColor, qAt, poColors, markChip,
} from './kits/premisa-oculta.js';

const ID = 'LAW-0110';
const DURATION = 8000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  part: [0.02, 0.1], hingesOff: [0.03, 0.08], toTray: [0.035, 0.135], drop: [0.12, 0.175], slot: [0.12, 0.175], names: [0.11, 0.18], cam: [0.76, 0.815],
  relate: [0.19, 0.42], trace: [0.45, 0.72], tracerOut: [0.72, 0.745],
  // gather and labelling end by 0.86 so the complete final state holds for > 1 s (8 s default)
  labelsOut: [0.745, 0.76], gather: [0.76, 0.815], hingesBack: [0.745, 0.83], fold: [0.8, 0.825], labels: [0.83, 0.85], key: [0.83, 0.855], notes: [0.835, 0.86],
};
const EL = ['fact', 'connector', 'rule', 'conclusion', 'lupa'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const M = 26;
const P2 = q => ({x: r(q.x), y: r(q.y)});
const mixP = (a, b, k) => ({x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k)});
const box = (b, dx = 0, dy = 0) => ({x: b.x + dx, y: b.y + dy, w: b.w, h: b.h});
const scaleBox = (b, k) => ({x: b.x + b.w / 2 - (b.w * k) / 2, y: b.y + b.h / 2 - (b.h * k) / 2, w: b.w * k, h: b.h * k});

const EXTRA = {
  en: {el_fact: 'Fact', el_connector: 'Hinge links', el_rule: 'Intermediate premise', el_conclusion: 'Conclusion', el_lupa: 'Magnifier', kinds: 'Link kinds'},
  es: {el_fact: 'Hecho', el_connector: 'Bisagras de enlace', el_rule: 'Premisa intermedia', el_conclusion: 'Conclusión', el_lupa: 'Lupa', kinds: 'Tipos de enlace'},
};
const STRINGS = {en: {...PO_STRINGS.en, ...EXTRA.en}, es: {...PO_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...poFields,
  premiseStatus: premiseStatusField,
  elements: list('Component labels. Ids are fixed by the scene (fact = fact card, connector = the two brass hinges, rule = the intermediate card, conclusion = conclusion card, lupa = magnifier); labels are editable. Unlisted components use their built-in label', obj('Component', {
    id: oneOf('Component id', EL),
    label: str('Visible label', 40),
  }, ['id', 'label']), 2, 5),
  relationships: list('Explicit relationships between components. The kind sets the line style: a plain relation has end dots and no arrowhead; sequence/communication get an arrowhead; causal (thick) only when the author supplies it', obj('Relationship', {
    from: oneOf('Source component id', EL),
    to: oneOf('Target component id', EL),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Optional caption for this relationship (defaults to the kind caption)', 60),
  }, ['from', 'to', 'kind']), 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes (the magnifier glides over it)', EL),
  relationLabels: obj('Caption used for each relation kind (in the key and on unlabelled links)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components (it follows a drawn link when one joins two consecutive ids)', oneOf('Component id', EL), 2, 8),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  premiseStatus: 'unstated',
  elements: [
    {id: 'fact', label: 'Fact'},
    {id: 'connector', label: 'Hinge links'},
    {id: 'rule', label: 'Intermediate premise'},
    {id: 'conclusion', label: 'Conclusion'},
    {id: 'lupa', label: 'Magnifier'},
  ],
  relationships: [
    {from: 'fact', to: 'conclusion', kind: 'sequence', label: 'as written: fact, then conclusion'},
    {from: 'fact', to: 'connector', kind: 'relation', label: 'hinge on the fact’s edge'},
    {from: 'connector', to: 'rule', kind: 'relation', label: 'links a stated card into the walk'},
    {from: 'rule', to: 'conclusion', kind: 'relation', label: 'the step the gap hides'},
    {from: 'lupa', to: 'rule', kind: 'relation', label: 'reads the card'},
  ],
  focusElement: 'rule',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence (as written)', causal: 'causal (as supplied)'},
  traversalOrder: ['fact', 'connector', 'rule', 'conclusion'],
};

const SHAPES = {
  landscape: {arr: 'rows', size: 54},
  square: {arr: 'rows', size: 52},
  portrait: {arr: 'rows', size: 42},
};

/** Normalised relationships: no self-links, one per unordered pair (first wins). */
function relationsOf(p) {
  const seen = new Set();
  const out = [];
  for (const rel of p.relationships) {
    if (rel.from === rel.to) continue;
    const k = [rel.from, rel.to].sort().join('|');
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({...rel});
  }
  return out;
}

/**
 * Anchors of a link between boxes A and B: facing edges when the boxes are
 * apart along one axis, an arc over their top edges (rows) / beside their
 * outer edges (cols) when they are adjacent, and for the direct fact →
 * conclusion link always an arc around the walk line (over the gap).
 */
function anchorsFor(A, B, o) {
  const ovX = Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x);
  const ovY = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
  if (o.around) {
    if (o.rows) {
      const a = {x: A.x + A.w - Math.min(40, A.w * 0.12), y: A.y}, b = {x: B.x + Math.min(40, B.w * 0.12), y: B.y};
      return {a, b, c: {x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - o.arc * 2}};
    }
    const a = {x: A.x, y: A.y + A.h - Math.min(34, A.h * 0.18)}, b = {x: B.x, y: B.y + Math.min(34, B.h * 0.18)};
    return {a, b, c: {x: Math.min(a.x, b.x) - o.arc * 2, y: (a.y + b.y) / 2}};
  }
  const gapX = Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w));
  const gapY = Math.max(B.y - (A.y + A.h), A.y - (B.y + B.h));
  if (gapY > 24 && ovX > Math.min(A.w, B.w) * 0.15) {
    const x = Math.max(A.x, B.x) + ovX / 2;
    const up = A.y < B.y;
    const a = {x, y: up ? A.y + A.h : A.y}, b = {x, y: up ? B.y : B.y + B.h};
    return {a, b, c: mixP(a, b, 0.5)};
  }
  if (gapX > 24 && ovY > Math.min(A.h, B.h) * 0.15) {
    const y = Math.max(A.y, B.y) + ovY / 2;
    const left = A.x < B.x;
    const a = {x: left ? A.x + A.w : A.x, y}, b = {x: left ? B.x : B.x + B.w, y};
    return {a, b, c: mixP(a, b, 0.5)};
  }
  if (gapX <= 24 && gapY <= 24 && (ovX > 0 || ovY > 0)) {
    // adjacent parts: an arc over the top edges (rows) or beside the right edges (cols)
    if (o.rows) {
      // below the walk line: the layer beneath has room (the arc over the top is kept for the argument as written)
      const left = A.x + A.w / 2 < B.x + B.w / 2;
      const a = {x: left ? A.x + A.w * 0.72 : A.x + A.w * 0.28, y: A.y + A.h}, b = {x: left ? B.x + B.w * 0.28 : B.x + B.w * 0.72, y: B.y + B.h};
      return {a, b, c: {x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + o.arc}};
    }
    const top = A.y + A.h / 2 < B.y + B.h / 2;
    const a = {x: A.x + A.w, y: top ? A.y + A.h * 0.72 : A.y + A.h * 0.28}, b = {x: B.x + B.w, y: top ? B.y + B.h * 0.28 : B.y + B.h * 0.72};
    return {a, b, c: {x: Math.max(a.x, b.x) + o.arc, y: (a.y + b.y) / 2}};
  }
  // diagonal: from the corner region of A facing B to the one of B facing A
  const ca = centerOf(A), cb = centerOf(B);
  const pick = (X, toward) => {
    const c = centerOf(X);
    const dx = toward.x - c.x, dy = toward.y - c.y;
    const s = Math.min((X.w / 2) / Math.abs(dx || 1e-9), (X.h / 2) / Math.abs(dy || 1e-9));
    return {x: c.x + dx * s, y: c.y + dy * s};
  };
  const a = pick(A, cb), b = pick(B, ca);
  return {a, b, c: mixP(a, b, 0.5)};
}

/** Distance from a point to the border of a box (0 = on the edge). */
function edgeDist(q, b) {
  const inside = q.x >= b.x - 0.5 && q.x <= b.x + b.w + 0.5 && q.y >= b.y - 0.5 && q.y <= b.y + b.h + 0.5;
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  if (!inside) return Math.hypot(dx, dy);
  return Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h));
}

function compose(ctx, s) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = SHAPES[ctx.view.shape];
  const rows = S.arr === 'rows';
  const u = unitsPer1080px(ctx);
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const stated = p.premiseStatus === 'stated';
  const labelOf = id => { const e = p.elements.find(x => x.id === id); return e && e.label ? e.label : t[`el_${id}`]; };
  const rels = relationsOf(p);
  const ns = Math.min(s, Math.max(s * 0.62, 21 * u));
  const arc = Math.max(46, s * 1.4);
  const common = {s, u, show: showKey, maxLines: 5, kinds: {fact: labelOf('fact'), premise: labelOf('rule'), conclusion: labelOf('conclusion')}, texts: {fact: p.facts, premise: p.rules, conclusion: p.conclusion}, tabs: false};
  // bottom band: key of link kinds · state key · notes
  const kindsUsed = KINDS.filter(k => rels.some(rl => rl.kind === k));
  const notes = showAll ? [...p.issues.map(q => ({kind: 'issue', text: `${t.issue}: ${q}`})), ...p.assumptions.map(a => ({kind: 'assumed', text: `${t.assumed}: ${a}`}))] : [];
  const bandW = D.w - 2 * M;
  const keyW = Math.min(bandW, rows ? bandW * 0.42 : bandW);
  const kp = showKey ? keyChip(ctx, stated ? 'stated' : 'unstated', {x: 0, y: 0, size: ns, maxWidth: keyW, maxLines: 3}) : null;
  const legendItems = showAll ? kindsUsed.map(k => ({kind: k, text: p.relationLabels[k] || k})) : [];
  const legendRowH = ns * 1.7;
  const sampleW = ns * 2.4;
  const legendW = legendItems.reduce((a, it) => a + sampleW + ns * 0.5 + ctx.measure(it.text, ns, 500, 'sans') + ns * 1.2, 0);
  const legendRows = legendItems.length ? Math.ceil(legendW / (rows ? bandW - (kp ? kp.box.w + 30 : 0) : bandW)) : 0;
  const legendH = legendRows * legendRowH;
  const noteW = rows ? (bandW - 20) / 2 : bandW;
  const nsz = notesSize(ctx, notes.filter(n => n.kind === 'issue'), noteW, ns, 4);
  const nsz2 = notesSize(ctx, notes.filter(n => n.kind === 'assumed'), noteW, ns, 4);
  const notesH = rows ? Math.max(nsz.h, nsz2.h) : nsz.h + (nsz.h && nsz2.h ? 10 : 0) + nsz2.h;
  const topRowH = rows ? Math.max(legendH, kp ? kp.box.h : 0) : legendH + (legendH && kp ? 10 : 0) + (kp ? kp.box.h : 0);
  const bandH = topRowH + (notesH ? 12 + notesH : 0);
  let geo, E, tray, lupaSt, R, Lh, lupaAng, fits;
  const hingeW = s * 1.3 * 2 + 8;
  if (rows) {
    const cw = (D.w - 2 * M - 2 * Math.max(10, s * 0.42)) / 3;
    const g0 = walkGeometry(ctx, {...common, axis: 'x', x: M, y: 0, cw});
    const H = g0.H;
    const topRoom = arc + ns * 2.6;
    let rowGap = Math.max(s * 3.4, ns * 5);
    let stackH = topRoom + H + rowGap + H + (bandH ? s * 0.9 + bandH : 0);
    // tall boxes are width-bound: spare height goes into the gap between the layers (longer links, room for captions)
    const spare = Math.max(0, D.h - 2 * M - stackH);
    const grow = Math.min(spare * 0.6, H * 1.3);
    rowGap += grow;
    stackH += grow;
    const free = Math.max(0, D.h - 2 * M - stackH);
    const y0 = M + topRoom + free * 0.35;
    const dy = y0 - g0.boxes.fact.y;
    geo = {...g0, boxes: Object.fromEntries(Object.entries(g0.boxes).map(([k, b]) => [k, box(b, 0, dy)])), hinge: {fact: {...g0.hinge.fact, y: g0.hinge.fact.y + dy}, conclusion: {...g0.hinge.conclusion, y: g0.hinge.conclusion.y + dy}}};
    const Pw = geo.boxes.premise;
    const drop = H + rowGap;
    E = {premise: box(Pw, 0, drop)};
    // parts tray: beneath the fact, left of the dropped card; magnifier station: beneath the conclusion
    const trayW = Math.min(cw * 0.75, Math.max(hingeW + s * 2.2, 280));
    const trayH = Math.min(H, s * 2.3 * 2 + s * 1.6);
    const fb0 = geo.boxes.fact;
    tray = {x: Math.max(M + 6, fb0.x + fb0.w * 0.3 - trayW / 2), y: E.premise.y + (E.premise.h - trayH) / 2, w: trayW, h: trayH};
    R = clamp(s * 1.55, 44, 72);
    Lh = R * 1.45;
    lupaAng = 35;
    const cb0 = geo.boxes.conclusion;
    lupaSt = {x: Math.min(cb0.x + cb0.w * 0.62, D.w - M - (R + Lh) * Math.cos(lupaAng * Math.PI / 180) - 10), y: E.premise.y + E.premise.h / 2 - R * 0.2};
    const bandTop = E.premise.y + E.premise.h + s * 0.9;
    fits = stackH <= D.h - 2 * M + 0.5 && !g0.truncated && tray.x >= M + 4 && !nsz.truncated && !nsz2.truncated;
    const diagTop = y0 - topRoom, diagBottom = Math.max(E.premise.y + E.premise.h, tray.y + tray.h, lupaSt.y + R + (R + Lh) * 0.6);
    const camOff = Math.max(0, ((D.h - M) - diagBottom - (diagTop - M)) / 2);
    Object.assign(E, {bandTop, camOff, rowBottom: geo.boxes.fact.y + H, rowGap});
  } else {
    // left margin: room for the "as written" arc and its caption beside the walk column
    const lm = Math.max(s * 1.6 + 30, 190);
    const Wc = (D.w - 2 * M - lm - 64) / 2;
    const g0 = walkGeometry(ctx, {...common, axis: 'y', x: M + lm, y: 0, width: Wc});
    const H = g0.H;
    const walkH = 3 * H + 2 * g0.J;
    const stackH = walkH + (bandH ? s * 0.9 + bandH : 0);
    const free = Math.max(0, D.h - 2 * M - stackH);
    const y0 = M + free * 0.4;
    const dy = y0 - g0.boxes.fact.y;
    const dxW = 0;
    geo = {...g0, boxes: Object.fromEntries(Object.entries(g0.boxes).map(([k, b]) => [k, box(b, dxW, dy)])), hinge: {fact: {...g0.hinge.fact, y: g0.hinge.fact.y + dy}, conclusion: {...g0.hinge.conclusion, y: g0.hinge.conclusion.y + dy}}};
    const Pw = geo.boxes.premise;
    const shift = D.w - M - (Pw.x + Pw.w);
    E = {premise: box(Pw, shift, 0)};
    // tall boxes: the two hinges lie side by side in a flat tray above the dropped card
    const trayW = Math.min(E.premise.w, 2 * hingeW + s * 1.6);
    const trayH = s * 2.2 + s * 1.0;
    const fb = geo.boxes.fact;
    tray = {x: E.premise.x + E.premise.w - trayW, y: fb.y + Math.max(s * 1.1, 16.5 * u * 2 + 12), w: trayW, h: trayH};
    R = clamp(s * 1.5, 44, 70);
    Lh = R * 1.4;
    lupaAng = 40;
    const cb = geo.boxes.conclusion;
    lupaSt = {x: E.premise.x + E.premise.w * 0.42, y: cb.y + cb.h / 2 - R * 0.3};
    const bandTop = y0 + walkH + s * 0.9;
    fits = stackH <= D.h - 2 * M + 0.5 && !g0.truncated && !nsz.truncated && !nsz2.truncated && shift > 40;
    Object.assign(E, {bandTop});
  }
  return {s, u, rows, stated, geo, E, tray, lupaSt, R, Lh, lupaAng, arc, ns, rels, labelOf, kindsUsed, kp, legendItems, legendRowH, sampleW, notes, noteW, bandH, topRowH, fits, keyW};
}

/** Element boxes in a given state: 'A' closed walk, 'E' exploded, 'G' gathered. */
function boxesAt(L, st) {
  const b = L.geo.boxes;
  const cl = L.geo.closed;
  if (st === 'A') return {fact: box(b.fact, cl.fact.dx, cl.fact.dy), conclusion: box(b.conclusion, cl.conclusion.dx, cl.conclusion.dy), rule: b.premise};
  if (st === 'E') return {fact: b.fact, conclusion: b.conclusion, rule: L.E.premise};
  return {fact: b.fact, conclusion: b.conclusion, rule: L.stated ? b.premise : L.E.premise};
}

/** Hinge poses (position of the hinge line, angle, leaf k) in each state. */
function hingePoses(L) {
  const geo = L.geo;
  const hF = geo.hinge.fact, hC = geo.hinge.conclusion;
  const cl = geo.closed;
  const tr = L.tray;
  const inTray = L.rows
    ? k => ({x: tr.x + tr.w / 2, y: tr.y + tr.h * (k === 0 ? 0.36 : 0.74), angle: 0})
    : k => ({x: tr.x + tr.w * (k === 0 ? 0.27 : 0.73), y: tr.y + tr.h * 0.47, angle: 0});
  // on their cards: folded (k = −1) at their edges; the conclusion's hinge points back towards the premise
  const onCard = (hg, off) => ({x: hg.x + off.dx, y: hg.y + off.dy, angle: hg.angle});
  return {
    A: [{pos: onCard(hF, cl.fact), k: -1}, {pos: onCard(hC, cl.conclusion), k: -1}],
    E: [{pos: inTray(0), k: 1}, {pos: inTray(1), k: 1}],
    // stated: latched across the joints (fixed leaf on its card, moving leaf on the premise); unstated: folded back home
    G: L.stated ? [{pos: {...hF}, k: 1}, {pos: {...hC}, k: 1}] : [{pos: {...hF}, k: -1}, {pos: {...hC}, k: -1}],
  };
}

function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const geo = L.geo;
  const col = poColors(ctx);
  const look = L.stated ? 'stated' : 'unstated';
  L.cards = {
    fact: cardArt(ctx, geo, 'fact', {prefix: 'fct', tab: false}),
    conclusion: cardArt(ctx, geo, 'conclusion', {prefix: 'cnc', tab: false}),
    rule: g(null, cardArt(ctx, geo, 'premise', {prefix: 'prm', look}), look === 'unstated' ? recessShade(ctx, geo, 'recess') : null),
  };
  L.hinges = [hingeUnit(ctx, geo, 'hA'), hingeUnit(ctx, geo, 'hB')];
  L.poses = hingePoses(L);
  // the gap: a dashed slot on the walk line (where the card lies when it is in the walk)
  const Pw = geo.boxes.premise;
  const q = geo.s * 0.18;
  L.slot = {x: Pw.x - q, y: Pw.y - q, w: Pw.w + 2 * q, h: Pw.h + 2 * q};
  L.slotNode = g({name: 'slot', opacity: 0},
    h('path', {d: roundRectPath(L.slot.x, L.slot.y, L.slot.w, L.slot.h, 12), fill: th.dark ? 'rgba(255,255,255,0.05)' : 'rgba(31,35,40,0.04)', stroke: th.dark ? th.fgSoft : th.inkFaint, 'stroke-width': 2.6, 'stroke-dasharray': '12 9'}));
  // drop lines: slot corners → dropped card corners (exploded-view projection)
  const Ep = L.E.premise;
  const corners = L.rows ? [[L.slot.x, L.slot.y + L.slot.h, Ep.x, Ep.y], [L.slot.x + L.slot.w, L.slot.y + L.slot.h, Ep.x + Ep.w, Ep.y]] : [[L.slot.x + L.slot.w, L.slot.y, Ep.x, Ep.y], [L.slot.x + L.slot.w, L.slot.y + L.slot.h, Ep.x, Ep.y + Ep.h]];
  L.dropLines = corners.map((c, i) => ({name: `dropl${i}`, a: {x: c[0], y: c[1]}, b: {x: c[2], y: c[3]}}));
  L.dropNode = g({name: 'drops', opacity: 0}, L.dropLines.map(dl => h('line', {name: dl.name, x1: r(dl.a.x), y1: r(dl.a.y), x2: r(dl.a.x), y2: r(dl.a.y), stroke: th.dark ? th.fgSoft : th.inkFaint, 'stroke-width': 2.2, 'stroke-dasharray': '6 7'})));
  // parts tray (the connector's station) with dashed outlines where the hinges lay
  const tr = L.tray;
  // the tray's part name, printed like the cards' kind labels (same size, whole words, up to 3 lines)
  const tSz = Math.min(...L.geo.kindSizes);
  const tTxt = L.labelOf('connector').toUpperCase();
  const tLong = Math.max(...tTxt.split(/\s+/).map(wd => ctx.measure(wd, tSz, 800, 'sans')));
  const tSz2 = tLong > tr.w - 20 ? Math.max(16 * L.u, tSz * (tr.w - 20) / tLong * 0.97) : tSz;
  const trayLabel = ctx.show('key') ? ctx.fit(tTxt, {maxWidth: tr.w - 20, size: tSz2, minSize: tSz2, maxLines: 5, weight: 800}) : null;
  const headH = trayLabel ? trayLabel.height + 12 : L.s * 0.7;
  L.trayHeadH = headH;
  L.trayNode = g({name: 'tray', opacity: 1},
    h('path', {d: roundRectPath(tr.x + 6, tr.y + 9, tr.w, tr.h + headH, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(tr.x, tr.y - headH, tr.w, tr.h + headH, 14), fill: '#dfe4e9', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(tr.x + 7, tr.y + 2, tr.w - 14, tr.h - 9, 10), fill: '#eef1f4', stroke: '#c5ccd3', 'stroke-width': 2}),
    trayLabel ? g({'data-role': 'caption'}, textBlock(trayLabel, {x: tr.x + tr.w / 2, y: tr.y - headH + 6, anchor: 'middle', fill: '#2c3a46'})) : h('rect', {x: r(tr.x + tr.w * 0.25), y: r(tr.y - headH + headH * 0.35), width: r(tr.w * 0.5), height: r(headH * 0.3), rx: 4, fill: '#bcc6cf'}),
    L.poses.E.map(ps => {
      const ext = L.hinges[0].extent(ps.pos, 1);
      return h('path', {d: roundRectPath(ext.x + 3, ext.y + 3, ext.w - 6, ext.h - 6, 8), fill: '#e6eaee', stroke: '#6f7c88', 'stroke-width': 2, 'stroke-dasharray': '7 6'});
    }));
  L.trayBox = {x: tr.x, y: tr.y - headH, w: tr.w, h: tr.h + headH};
  // magnifier (copy: the walk in the gathered state, text-free)
  const copy = walkCopy(ctx, geo, {look, k: L.stated ? 1 : -1, prefix: 'lc'});
  L.lupa = lupaArt(ctx, {name: 'lupa', R: L.R, handle: L.Lh, copy, zoom: 1.6, lensFill: th.paper});
  const lupaLabel = ctx.show('all') ? chip(ctx, L.labelOf('lupa'), {x: L.lupaSt.x, y: L.lupaSt.y + L.R + 14, anchor: 'middle', maxWidth: 260, size: L.ns, minSize: L.ns, maxLines: 2, name: 'lupa-name', fill: th.card, stroke: th.inkFaint}) : null;
  if (lupaLabel) markChip(lupaLabel.node);
  L.lupaLabel = lupaLabel;
  const lupaHandle = ang => segPolys([L.lupaSt, {x: L.lupaSt.x + Math.cos(ang * Math.PI / 180) * (L.R + L.Lh), y: L.lupaSt.y + Math.sin(ang * Math.PI / 180) * (L.R + L.Lh)}], 34);
  L.lupaObst = [{x: L.lupaSt.x - L.R - 10, y: L.lupaSt.y - L.R - 10, w: 2 * L.R + 20, h: 2 * L.R + 20}, ...lupaHandle(L.lupaAng)];

  // links
  L.links = L.rels.map((rel, i) => ({rel, i, c: curveLink(ctx, `lk${i}`, rel.kind, linkColor(ctx, rel.kind)), text: rel.label || p.relationLabels[rel.kind] || rel.kind}));
  // label placement at the exploded (relate/trace) geometry and at the gathered geometry
  const bounds = {x: M * 0.5, y: M * 0.5, w: D.w - M, h: (L.E.bandTop - M * 0.2)};
  // the bottom band is empty while the exploded captions show (it fades in at the hold), so they may use the full height
  // the bottom band is empty while the exploded captions show (they may use the height the camera leaves free)
  L.labelsE = placeLabels(ctx, L, 'E', {...bounds, h: D.h - M - L.E.camOff - bounds.y}, 'lbE');
  L.labelsG = placeLabels(ctx, L, 'G', bounds, 'lbG');
  // bottom band: link kinds, state key, notes
  const bandTop = L.E.bandTop;
  L.legend = null;
  if (L.legendItems.length) {
    const parts = [];
    let x = M, y = bandTop;
    const maxX = L.rows ? D.w - M - (L.kp ? L.kp.box.w + 30 : 0) : D.w - M;
    L.legendItems.forEach(it => {
      const f = ctx.fit(it.text, {maxWidth: maxX - M - L.sampleW, size: L.ns, minSize: L.ns, maxLines: 1, weight: 500});
      const w = L.sampleW + L.ns * 0.5 + f.width;
      if (x + w > maxX && x > M) { x = M; y += L.legendRowH; }
      const cy = y + L.legendRowH / 2;
      parts.push(g({transform: T(x, cy)}, linkSample(ctx, it.kind, linkColor(ctx, it.kind), L.sampleW - 14)));
      parts.push(g({'data-role': 'content'}, textBlock(f, {x: x + L.sampleW + L.ns * 0.3, y: cy - f.size * 0.62, fill: th.fg})));
      x += w + L.ns * 1.2;
    });
    L.legend = g({name: 'legend', opacity: 0}, parts);
  }
  L.key = L.kp ? keyChip(ctx, L.stated ? 'stated' : 'unstated', {x: L.rows ? D.w - M - L.kp.box.w : M, y: L.rows ? bandTop : bandTop + (L.legendItems.length ? L.topRowH - L.kp.box.h : 0), size: L.ns, maxWidth: L.keyW, maxLines: 3, name: 'key'}) : null;
  const notesTop = bandTop + L.topRowH + 12;
  const iss = L.notes.filter(n => n.kind === 'issue'), ass = L.notes.filter(n => n.kind === 'assumed');
  L.notesL = iss.length ? notesColumn(ctx, iss, {x: M, y: notesTop, w: L.noteW, size: L.ns, maxLines: 4, name: 'notesL'}) : null;
  const n2y = L.rows ? notesTop : notesTop + (L.notesL ? L.notesL.h + 10 : 0);
  L.notesR = ass.length ? notesColumn(ctx, ass, {x: L.rows ? D.w - M - L.noteW : M, y: n2y, w: L.noteW, size: L.ns, maxLines: 4, name: 'notesR', align: L.rows ? 'right' : 'left'}) : null;

  // tracer route (exploded geometry)
  L.route = route(L);
  L.tracerNode = tracer(ctx, 'tracer', th.accent);
  return L;
}

/** Element boxes (fact, conclusion, rule, connector, lupa) for anchoring at a named state. */
function anchorBoxes(L, st) {
  const bx = boxesAt(L, st);
  const lupa = {x: L.lupaSt.x - L.R, y: L.lupaSt.y - L.R, w: 2 * L.R, h: 2 * L.R};
  const out = {...bx, lupa, connector: L.trayBox};
  if (st === 'G') out.connectorParts = L.poses.G.map(ps => L.hinges[0].extent(ps.pos, ps.k));
  return out;
}

/** Connector box used for a link towards `other` (the tray, or the hinge nearest to the other part once gathered). */
function connectorBox(L, boxes, other, gatherK, hingeBoxes) {
  if (gatherK <= 0 || !hingeBoxes) return L.trayBox;
  const oc = centerOf(boxes[other]);
  const finals = L.poses.G.map(ps => L.hinges[0].extent(ps.pos, ps.k));
  const d = finals.map(b => Math.hypot(centerOf(b).x - oc.x, centerOf(b).y - oc.y));
  return hingeBoxes[d[0] <= d[1] ? 0 : 1];
}

/** Link geometry for relationship i given part boxes. */
function linkGeom(L, rel, boxes, gatherK, hingeBoxes) {
  const bOf = id => (id === 'connector' ? connectorBox(L, boxes, rel.from === 'connector' ? rel.to : rel.from, gatherK, hingeBoxes) : boxes[id]);
  const A = bOf(rel.from), B = bOf(rel.to);
  const around = (rel.from === 'fact' && rel.to === 'conclusion') || (rel.from === 'conclusion' && rel.to === 'fact');
  const lg = {...anchorsFor(A, B, {rows: L.rows, arc: L.arc, around}), A, B};
  if (around) return lg;
  // a link never runs through a third part: bend it round (the control point moves off the straight line)
  const others = ['fact', 'conclusion', 'rule', 'lupa'].map(id => boxes[id]).filter(b => b && b !== A && b !== B);
  if (rel.from !== 'connector' && rel.to !== 'connector') others.push(L.trayBox);
  const hits = c => {
    for (let k = 2; k <= 22; k++) {
      const q = qAt(lg.a, c, lg.b, k / 24);
      if (others.some(b => q.x > b.x - 6 && q.x < b.x + b.w + 6 && q.y > b.y - 6 && q.y < b.y + b.h + 6)) return true;
    }
    return false;
  };
  if (!hits(lg.c)) return lg;
  const m = mixP(lg.a, lg.b, 0.5);
  const dx = lg.b.x - lg.a.x, dy = lg.b.y - lg.a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (const k of [0.3, -0.3, 0.5, -0.5]) {
    const c = {x: m.x + nx * len * k, y: m.y + ny * len * k};
    if (!hits(c)) return {...lg, c};
  }
  // route round the outside of both parts (beside their right / left edges, or below / above them)
  const cA = centerOf(A), cB = centerOf(B);
  const side = [
    () => { const a = {x: A.x + A.w, y: cA.y}, b = {x: B.x + B.w, y: cB.y}; return {a, b, c: {x: Math.max(a.x, b.x) + Math.abs(a.y - b.y) * 0.3 + 40, y: (a.y + b.y) / 2}}; },
    () => { const a = {x: A.x, y: cA.y}, b = {x: B.x, y: cB.y}; return {a, b, c: {x: Math.min(a.x, b.x) - Math.abs(a.y - b.y) * 0.3 - 40, y: (a.y + b.y) / 2}}; },
    () => { const a = {x: cA.x, y: A.y + A.h}, b = {x: cB.x, y: B.y + B.h}; return {a, b, c: {x: (a.x + b.x) / 2, y: Math.max(a.y, b.y) + Math.abs(a.x - b.x) * 0.3 + 40}}; },
    () => { const a = {x: cA.x, y: A.y}, b = {x: cB.x, y: B.y}; return {a, b, c: {x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - Math.abs(a.x - b.x) * 0.3 - 40}}; },
  ];
  for (const mk of side) {
    const cand = {...mk(), A, B};
    const saved = [lg.a, lg.b];
    lg.a = cand.a; lg.b = cand.b;
    const ok = !hits(cand.c);
    lg.a = saved[0]; lg.b = saved[1];
    if (ok) return cand;
  }
  for (const k of [0.75, -0.75, 1, -1]) {
    const c = {x: m.x + nx * len * k, y: m.y + ny * len * k};
    if (!hits(c)) return {...lg, c};
  }
  return lg;
}

function curvePts(lg, n = 24) {
  const pts = [];
  for (let k = 0; k <= n; k++) pts.push(qAt(lg.a, lg.c, lg.b, k / n));
  return pts;
}

/** Place every link's caption on (or beside) its own wire, clear of parts, other wires and other captions. */
function placeLabels(ctx, L, st, bounds, prefix) {
  const th = ctx.theme;
  if (!ctx.show('all')) return [];
  const boxes = anchorBoxes(L, st);
  const hingeBoxes = st === 'G' ? boxes.connectorParts : null;
  const gk = st === 'G' ? 1 : 0;
  const focusBox = st === 'E' && boxes[ctx.params.focusElement] && ctx.params.focusElement !== 'connector' ? scaleBox(boxes[ctx.params.focusElement], 1.2) : null;
  const parts = [boxes.fact, boxes.conclusion, boxes.rule, L.trayBox, ...L.lupaObst, focusBox, L.lupaLabel && L.lupaLabel.box, ...(hingeBoxes || [])].filter(Boolean);
  if (st === 'E') parts.push(L.slot);
  const geoms = L.links.map(lk => linkGeom(L, lk.rel, boxes, gk, hingeBoxes));
  const wires = geoms.map(lg => segPolys(curvePts(lg), 12));
  const placed = [];
  const leaders = [];
  return L.links.map((lk, i) => {
    const lg = geoms[i];
    // a link whose two parts overlap (e.g. a hinge folded on its own card) is not drawn: its caption then keeps a
    // real leader to the part it names instead of floating free
    const ox = Math.min(lg.A.x + lg.A.w, lg.B.x + lg.B.w) - Math.max(lg.A.x, lg.B.x);
    const oy = Math.min(lg.A.y + lg.A.h, lg.B.y + lg.B.h) - Math.max(lg.A.y, lg.B.y);
    const lying = ox > 0 && oy > 0 && ox * oy > 0.3 * Math.min(lg.A.w * lg.A.h, lg.B.w * lg.B.h);
    const small = lg.A.w * lg.A.h < lg.B.w * lg.B.h ? lg.A : lg.B;
    const mid = lying ? {x: small.x + small.w / 2, y: small.y} : qAt(lg.a, lg.c, lg.b, 0.5);
    const tg = qAt(lg.a, lg.c, lg.b, 0.52);
    const dx = tg.x - mid.x, dy = tg.y - mid.y;
    const Ln = Math.hypot(dx, dy) || 1;
    const nx = -dy / Ln, ny = dx / Ln;
    const others = wires.filter((_, j) => j !== i).flat();
    const size = L.ns;
    const mk = (mw, ml) => {
      const bw = balancedWidth(ctx, lk.text, {maxWidth: mw, size, minSize: size, maxLines: ml});
      return {...chip(ctx, lk.text, {x: 0, y: 0, maxWidth: bw, size, minSize: size, maxLines: ml}), bw};
    };
    const shapes = [mk(Math.min(420, bounds.w * 0.3), 2), mk(Math.min(300, bounds.w * 0.24), 3), mk(Math.min(520, bounds.w * 0.36), 2), mk(260, 4)].filter(c => !c.fit.truncated);
    let best = null;
    const along = lying ? [{q: mid, nx: 0, ny: -1}] : [0.5, 0.38, 0.62, 0.28, 0.72].map(tt => {
      const q0 = qAt(lg.a, lg.c, lg.b, tt), q1 = qAt(lg.a, lg.c, lg.b, tt + 0.02);
      const L0 = Math.hypot(q1.x - q0.x, q1.y - q0.y) || 1;
      return {q: q0, nx: -(q1.y - q0.y) / L0, ny: (q1.x - q0.x) / L0};
    });
    for (const c0 of shapes) {
      for (const d of lying ? [60, 80, 100, 130, 160, 200] : [0, 28, 48, 70, 95, 125, 160, 200, 250]) {
        for (const al of along) {
        for (const sg of d ? [1, -1] : [1]) {
          const cx = al.q.x + al.nx * d * sg, cy = al.q.y + al.ny * d * sg;
          const bx = {x: cx - c0.box.w / 2, y: cy - c0.box.h / 2, w: c0.box.w, h: c0.box.h};
          if (bx.x < bounds.x || bx.y < bounds.y || bx.x + bx.w > bounds.x + bounds.w || bx.y + bx.h > bounds.y + bounds.h) continue;
          if (hitsAny(bx, [...parts, ...placed, ...others, ...leaders], 6)) continue;
          // a leader (when the chip leaves its wire) must not cross another chip or part
          if (d > 30 && segmentHits({x: cx, y: cy}, al.q, [...placed, ...parts.filter(b => b !== lg.A && b !== lg.B)], 10)) continue;
          best = {bx, c0, d, at: al.q};
          break;
        }
        if (best) break;
        }
        if (best) break;
      }
      if (best) break;
    }
    if (!best) {
      // free-space fallback: the nearest clear spot anywhere, joined to its wire by a leader that crosses no part
      let bestD = Infinity;
      for (const c0 of shapes) {
        for (let y = bounds.y; y + c0.box.h <= bounds.y + bounds.h; y += 14) {
          for (let x = bounds.x; x + c0.box.w <= bounds.x + bounds.w; x += 14) {
            const bx = {x, y, w: c0.box.w, h: c0.box.h};
            const cc = {x: x + bx.w / 2, y: y + bx.h / 2};
            const dd = Math.hypot(cc.x - mid.x, cc.y - mid.y);
            if (dd >= bestD || dd > 720) continue;
            if (hitsAny(bx, [...parts, ...placed, ...others, ...leaders], 6)) continue;
            if (segmentHits(cc, mid, [...parts.filter(b => b !== lg.A && b !== lg.B), ...placed], 14)) continue;
            best = {bx, c0, d: dd, at: mid};
            bestD = dd;
          }
        }
        if (best) break;
      }
    }
    if (!best) {
      const c0 = shapes[0] || mk(Math.min(420, bounds.w * 0.3), 4);
      best = {bx: {x: mid.x - c0.box.w / 2, y: mid.y - c0.box.h / 2, w: c0.box.w, h: c0.box.h}, c0, d: 0, forced: true};
    }
    placed.push(best.bx);
    const anchor0 = best.at || mid;
    if (best.d > 30 || lying) leaders.push(...segPolys([anchor0, {x: best.bx.x + best.bx.w / 2, y: best.bx.y + best.bx.h / 2}], 8));
    const cc = chip(ctx, lk.text, {x: best.bx.x + best.bx.w / 2, y: best.bx.y, anchor: 'middle', maxWidth: best.c0.bw ?? best.c0.box.w + 1, size: L.ns, minSize: L.ns, maxLines: best.c0.fit.lines.length, fill: th.card, stroke: linkColor(ctx, lk.rel.kind), weight: 600});
    markChip(cc.node);
    const anchorPt = best.at || mid;
    const hasLeader = best.d > 30 || lying;
    const leader = hasLeader ? g(null,
      h('line', {x1: r(anchorPt.x), y1: r(anchorPt.y), x2: r(best.bx.x + best.bx.w / 2), y2: r(best.bx.y + best.bx.h / 2), stroke: linkColor(ctx, lk.rel.kind), 'stroke-width': lying ? 2.6 : 2, 'stroke-dasharray': lying ? undefined : '3 5'}),
      h('circle', {cx: r(anchorPt.x), cy: r(anchorPt.y), r: 6, fill: linkColor(ctx, lk.rel.kind), stroke: th.card, 'stroke-width': 2})) : null;
    return {name: `${prefix}${i}`, node: g({name: `${prefix}${i}`, opacity: 0}, leader, g({'data-role': 'content'}, cc.node)), box: best.bx, clear: !best.forced, lying, hasLeader, anchor: {x: r(anchorPt.x), y: r(anchorPt.y)}};
  });
}

/** Points along the outside of a box's border from a to b (the shorter way round), offset outward by o. */
function aroundBox(b, a, c, o) {
  const B = {x: b.x - o, y: b.y - o, w: b.w + 2 * o, h: b.h + 2 * o};
  const per = 2 * (B.w + B.h);
  // perimeter parameter of a point (clockwise from the top-left corner), after projecting it onto the border
  const tOf = q => {
    const x = clamp(q.x, B.x, B.x + B.w), y = clamp(q.y, B.y, B.y + B.h);
    const d = [Math.abs(y - B.y), Math.abs(x - (B.x + B.w)), Math.abs(y - (B.y + B.h)), Math.abs(x - B.x)];
    const side = d.indexOf(Math.min(...d));
    if (side === 0) return x - B.x;
    if (side === 1) return B.w + (y - B.y);
    if (side === 2) return B.w + B.h + (B.x + B.w - x);
    return 2 * B.w + B.h + (B.y + B.h - y);
  };
  const at = t => {
    t = ((t % per) + per) % per;
    if (t <= B.w) return {x: B.x + t, y: B.y};
    if (t <= B.w + B.h) return {x: B.x + B.w, y: B.y + t - B.w};
    if (t <= 2 * B.w + B.h) return {x: B.x + B.w - (t - B.w - B.h), y: B.y + B.h};
    return {x: B.x, y: B.y + B.h - (t - 2 * B.w - B.h)};
  };
  const ta = tOf(a), tc = tOf(c);
  let dt = tc - ta;
  if (dt > per / 2) dt -= per;
  if (dt < -per / 2) dt += per;
  const n = Math.max(2, Math.ceil(Math.abs(dt) / 20));
  const pts = [];
  for (let k = 0; k <= n; k++) pts.push(at(ta + (dt * k) / n));
  return pts;
}

/**
 * Tracer route along the drawn links only (exploded geometry): from wire to wire it runs round the OUTSIDE of the
 * part it visits (never across its text). A part is "visited" when the tracer arrives on its border.
 */
function route(L) {
  const boxes = anchorBoxes(L, 'E');
  const order = L.orderIds;
  const pts = [];
  const visits = [];
  const boxOf = id => (id === 'connector' ? L.trayBox : boxes[id]);
  const off = 12;
  const out = (b, q) => {
    // push an anchor point outward from its box by `off`
    const c = centerOf(b);
    const dx = q.x - c.x, dy = q.y - c.y;
    const sx = Math.abs(dx) / (b.w / 2 || 1), sy = Math.abs(dy) / (b.h / 2 || 1);
    return sx >= sy ? {x: q.x + Math.sign(dx) * off, y: q.y} : {x: q.x, y: q.y + Math.sign(dy) * off};
  };
  let last = null; // last point on the current part's border
  order.forEach((id, i) => {
    if (i === 0) return;
    const prev = order[i - 1];
    const k = L.links.findIndex(lk => (lk.rel.from === prev && lk.rel.to === id) || (lk.rel.from === id && lk.rel.to === prev));
    const Bp = boxOf(prev), Bc = boxOf(id);
    let start, end, curve = [];
    if (k >= 0) {
      const lg = linkGeom(L, L.links[k].rel, boxes, 0, null);
      const fwd = L.links[k].rel.from === prev;
      start = fwd ? lg.a : lg.b;
      end = fwd ? lg.b : lg.a;
      for (let s2 = 1; s2 < 24; s2++) curve.push(qAt(lg.a, lg.c, lg.b, fwd ? s2 / 24 : 1 - s2 / 24));
    } else {
      start = centerOf(Bp);
      end = centerOf(Bc);
    }
    const s0 = out(Bp, start);
    if (!pts.length) { pts.push(s0); visits.push({id: prev, idx: 0}); }
    else if (last) for (const q of aroundBox(Bp, last, s0, off).slice(1)) pts.push(q);
    pts.push(start, ...curve, end);
    const e0 = out(Bc, end);
    pts.push(e0);
    visits.push({id, idx: pts.length - 1});
    last = e0;
  });
  if (!pts.length) pts.push(centerOf(boxOf(order[0]))), visits.push({id: order[0], idx: 0});
  const poly = polyline(pts);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  // the tracer moves with an ease-in-out along the route: visit times are the inverse of that easing
  const inv = y => Math.acos(1 - 2 * Math.min(1, Math.max(0, y))) / Math.PI;
  return {poly, visits: visits.map(v => ({id: v.id, t: inv(cum[v.idx] / total)}))};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    let s = SHAPES[ctx.view.shape].size;
    let L = compose(ctx, s);
    for (let it = 0; it < 24 && !L.fits; it++) {
      s *= 0.95;
      L = compose(ctx, s);
    }
    L.orderIds = p.traversalOrder.filter((id, i, a) => i === 0 || id !== a[i - 1]);
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    return g(null,
      g({name: 'diagram'},
      L.slotNode,
      L.dropNode,
      L.trayNode,
      g({name: 'g-rule'}, L.cards.rule),
      g({name: 'g-fact'}, L.cards.fact),
      g({name: 'g-conclusion'}, L.cards.conclusion),
      L.hinges.map(hn => hn.node),
      L.lupa.shadows, L.lupa.view, L.lupa.prop,
      L.lupaLabel && g({name: 'lupa-label', opacity: 0, 'data-role': 'content'}, L.lupaLabel.node),
      L.links.map(lk => lk.c.node),
      L.tracerNode,
      L.labelsE.map(x => x.node),
      L.labelsG.map(x => x.node)),
      L.legend,
      L.key && L.key.node,
      L.notesL && L.notesL.node,
      L.notesR && L.notesR.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const A = boxesAt(L, 'A'), E = boxesAt(L, 'E'), G = boxesAt(L, 'G');
    const camY = L.E.camOff * (1 - ease.inOutCubic(seg(u, ...W.cam)));
    nodes.diagram = {transform: T(0, camY)};
    // --- separate
    const part = ease.inOutCubic(seg(u, ...W.part));
    const drop = ease.inOutCubic(seg(u, ...W.drop));
    const gath = ease.inOutCubic(seg(u, ...W.gather));
    const cur = {
      fact: {x: lerp(A.fact.x, E.fact.x, part), y: lerp(A.fact.y, E.fact.y, part), w: A.fact.w, h: A.fact.h},
      conclusion: {x: lerp(A.conclusion.x, E.conclusion.x, part), y: lerp(A.conclusion.y, E.conclusion.y, part), w: A.conclusion.w, h: A.conclusion.h},
      rule: gath > 0 ? {x: lerp(E.rule.x, G.rule.x, gath), y: lerp(E.rule.y, G.rule.y, gath), w: E.rule.w, h: E.rule.h} : {x: lerp(A.rule.x, E.rule.x, drop), y: lerp(A.rule.y, E.rule.y, drop), w: A.rule.w, h: A.rule.h},
    };
    // --- focus enlargement while the tracer is on the focus part
    const tr = seg(u, ...W.trace);
    const tracing = u >= W.trace[0] && u < W.tracerOut[1];
    const fv = L.route.visits.find(v => v.id === p.focusElement);
    const fU = fv ? lerp(W.trace[0], W.trace[1], fv.t) : null;
    const bump = fU === null ? 0 : Math.max(0, 1 - Math.abs(u - fU) / 0.05);
    const focusK = 1 + 0.2 * ease.inOutSine(bump);
    const scaled = {...cur};
    if (p.focusElement in scaled && focusK > 1) scaled[p.focusElement] = scaleBox(cur[p.focusElement], focusK);
    const base = L.geo.boxes;
    const cardT = (id, b, k) => {
      const b0 = id === 'rule' ? base.premise : base[id];
      const c = centerOf(b0);
      const dx = b.x + b.w / 2 - c.x, dy = b.y + b.h / 2 - c.y;
      return k !== 1 ? `translate(${r(c.x + dx)} ${r(c.y + dy)}) scale(${r(k, 4)}) translate(${r(-c.x)} ${r(-c.y)})` : T(dx, dy);
    };
    nodes['g-fact'] = {transform: cardT('fact', cur.fact, p.focusElement === 'fact' ? focusK : 1)};
    nodes['g-conclusion'] = {transform: cardT('conclusion', cur.conclusion, p.focusElement === 'conclusion' ? focusK : 1)};
    // the card is only shown once the seam over it opens (fully covered before)
    nodes['g-rule'] = {transform: cardT('rule', cur.rule, p.focusElement === 'rule' ? focusK : 1), opacity: part > 0 || drop > 0 ? 1 : 0};
    // recess shade: the card lies below the walk line (it lifts flush only when stated and gathered into the gap)
    if (!L.stated) nodes.recess = {opacity: 1};
    // gap slot and drop lines
    const slotOp = seg(u, ...W.slot);
    nodes.slot = {opacity: r(slotOp * (L.stated ? 1 - gath : 1), 3)};
    const dropOp = seg(u, ...W.slot) * (L.stated ? 1 - gath : 1);
    nodes.drops = {opacity: r(dropOp * 0.9, 3)};
    L.dropLines.forEach(dl => {
      const e = mixP(dl.a, dl.b, drop);
      nodes[dl.name] = {x2: r(e.x), y2: r(e.y)};
    });
    // --- hinges: fold → off the edges → flat in the tray → (gather) latched across the joints or folded back home
    const toTray = ease.inOutSine(seg(u, ...W.toTray));
    const fold = ease.inOutCubic(seg(u, ...W.fold));
    const hingeBoxes = [];
    const hingePts = [];
    L.hinges.forEach((hn, i) => {
      const a0 = L.poses.A[i], e0 = L.poses.E[i], g0 = L.poses.G[i];
      // on its card (A) the hinge rides the card while it parts; it unfolds (k −1 → +1) and flies to the tray
      const cardOff = i === 0 ? {dx: cur.fact.x - base.fact.x, dy: cur.fact.y - base.fact.y} : {dx: cur.conclusion.x - base.conclusion.x, dy: cur.conclusion.y - base.conclusion.y};
      const home = {x: (i === 0 ? L.geo.hinge.fact.x : L.geo.hinge.conclusion.x) + cardOff.dx, y: (i === 0 ? L.geo.hinge.fact.y : L.geo.hinge.conclusion.y) + cardOff.dy, angle: a0.pos.angle};
      let pos, k;
      const back = ease.inOutSine(seg(u, ...W.hingesBack));
      if (back > 0) {
        // the way back mirrors the way out: up out of the tray, along the gap between the layers, then up along the
        // card's inner margin to the joint (stated: latched flat across it; unstated: folding back onto its own card)
        const tgt = g0.pos;
        const side = i === 0 ? -1 : 1;
        const laneY = L.E.rowBottom + L.E.rowGap * 0.42;
        const P0 = e0.pos, P1 = {x: e0.pos.x, y: laneY}, P2 = {x: tgt.x + side * L.geo.lw * 0.5, y: laneY}, P3 = tgt;
        const d1 = Math.abs(P1.y - P0.y), d2 = Math.abs(P2.x - P1.x), d3 = Math.hypot(P3.x - P2.x, P3.y - P2.y);
        const tot = d1 + d2 + d3 || 1;
        const q = back * tot;
        let dA = tgt.angle - e0.pos.angle;
        while (dA > 180) dA -= 360;
        while (dA < -180) dA += 360;
        const kEnd = L.stated ? 1 : -1;
        if (q <= d1) { const f = q / (d1 || 1); pos = {x: P0.x, y: lerp(P0.y, P1.y, f), angle: e0.pos.angle}; k = 1; }
        else if (q <= d1 + d2) { const f = (q - d1) / (d2 || 1); pos = {x: lerp(P1.x, P2.x, f), y: P1.y, angle: e0.pos.angle + dA * ease.inOutSine(f)}; k = 1; }
        else { const f = (q - d1 - d2) / (d3 || 1); pos = {x: lerp(P2.x, P3.x, f), y: lerp(P2.y, P3.y, f), angle: tgt.angle}; k = lerp(1, kEnd, ease.inOutSine(f)); }
      } else if (toTray > 0) {
        // leg 1: straight down along its own card's inner margin (folded, over its own card, never over the premise);
        // leg 2: along the row gap to above its tray slot while it turns and opens flat; leg 3: down into the slot
        const side = i === 0 ? -1 : 1;
        const laneY = L.E.rowBottom + L.E.rowGap * 0.42;
        const P0 = home, P1 = {x: home.x + side * L.geo.lw * 0.5, y: laneY}, P2 = {x: e0.pos.x, y: laneY}, P3 = e0.pos;
        const d1 = Math.hypot(P1.x - P0.x, P1.y - P0.y), d2 = Math.hypot(P2.x - P1.x, P2.y - P1.y), d3 = Math.hypot(P3.x - P2.x, P3.y - P2.y);
        const tot = d1 + d2 + d3 || 1;
        const q = toTray * tot;
        let dA = e0.pos.angle - home.angle;
        while (dA > 180) dA -= 360;
        while (dA < -180) dA += 360;
        if (q <= d1) { const f = q / (d1 || 1); pos = {x: lerp(P0.x, P1.x, f), y: lerp(P0.y, P1.y, f), angle: home.angle}; k = -1; }
        else if (q <= d1 + d2) { const f = (q - d1) / (d2 || 1); pos = {x: lerp(P1.x, P2.x, f), y: P1.y, angle: home.angle + dA * ease.inOutSine(f)}; k = lerp(-1, 1, ease.inOutSine(f)); }
        else { const f = (q - d1 - d2) / (d3 || 1); pos = {x: P2.x, y: lerp(P2.y, P3.y, f), angle: e0.pos.angle}; k = 1; }
      } else {
        pos = home;
        k = -1;
      }
      Object.assign(nodes, hn.frame(pos, k));
      hingeBoxes.push(hn.extent(pos, k));
      hingePts.push({pos, k});
    });
    // --- tracer and magnifier (the magnifier glides over the focus part around its visit, then back to its station)
    const tp = L.route.poly.at(ease.inOutSine(tr));
    // the tracer runs along the wires; inside a part (over its text) it fades out
    const insideBy = b => Math.min(tp.x - b.x, b.x + b.w - tp.x, tp.y - b.y, b.y + b.h - tp.y);
    const deepest = Math.max(...[scaled.fact, scaled.conclusion, scaled.rule, L.trayBox].map(insideBy));
    const trOp = (u < W.trace[0] ? 0 : u < W.trace[1] ? 1 : 1 - seg(u, ...W.tracerOut)) * clamp(-(deepest + 1) / 9);
    nodes.tracer = {transform: T(tp.x, tp.y), opacity: r(trOp, 3)};
    const visited = L.route.visits.filter(v => lerp(W.trace[0], W.trace[1], v.t) <= u && u >= W.trace[0]).map(v => v.id);
    const fb = p.focusElement === 'lupa' ? null : (p.focusElement === 'connector' ? L.trayBox : scaled[p.focusElement]);
    const lupaGo = fU === null || !fb ? 0 : ease.inOutSine(clamp(1 - (Math.abs(u - fU) - 0.03) / 0.05));
    const tgt = fb ? centerOf(fb) : L.lupaSt;
    const lc = mixP(L.lupaSt, tgt, lupaGo);
    const lf = L.lupa.frame(lc, L.lupaAng, lupaGo, lupaGo);
    delete lf.grip;
    Object.assign(nodes, lf);
    if (L.lupaLabel) nodes['lupa-label'] = {opacity: r(seg(u, ...W.names) * (1 - lupaGo), 3)};
    // --- links: drawn one after the other (relate), attached to the current part edges at all times
    const n = L.links.length;
    const each = (W.relate[1] - W.relate[0]) / Math.max(1, n);
    const lupaBox = {x: lc.x - L.R, y: lc.y - L.R, w: 2 * L.R, h: 2 * L.R};
    const partBoxes = {...scaled, lupa: lupaBox};
    const drawn = [], ends = [], lengths = [];
    L.links.forEach((lk, i) => {
      const pr = ease.inOutCubic(seg(u, W.relate[0] + i * each, W.relate[0] + (i + 0.92) * each));
      const lg = linkGeom(L, lk.rel, partBoxes, gath, hingeBoxes);
      const ox = Math.min(lg.A.x + lg.A.w, lg.B.x + lg.B.w) - Math.max(lg.A.x, lg.B.x);
      const oy = Math.min(lg.A.y + lg.A.h, lg.B.y + lg.B.h) - Math.max(lg.A.y, lg.B.y);
      const lying = ox > 0 && oy > 0 && ox * oy > 0.3 * Math.min(lg.A.w * lg.A.h, lg.B.w * lg.B.h);
      Object.assign(nodes, lk.c.frame(lg.a, lg.c, lg.b, pr, lying ? 0 : 1));
      drawn.push(r(pr, 3));
      ends.push(edgeDist(lg.a, lg.A) < 1.5 && edgeDist(lg.b, lg.B) < 1.5);
      lengths.push(r(curvePts(lg, 12).reduce((acc, q, k, arr) => acc + (k ? Math.hypot(q.x - arr[k - 1].x, q.y - arr[k - 1].y) : 0), 0), 1));
    });
    // --- captions: on the exploded wires (relate/trace), then on the gathered wires (hold)
    const labOut = 1 - seg(u, ...W.labelsOut);
    L.labelsE.forEach((lb, i) => {
      const pr = seg(u, W.relate[0] + i * each, W.relate[0] + (i + 0.92) * each);
      // a caption of a magnifier link steps aside while the magnifier lies on its card (its wire is hidden then)
      const lup = L.links[i].rel.from === 'lupa' || L.links[i].rel.to === 'lupa';
      nodes[lb.name] = {opacity: r(clamp((pr - 0.55) / 0.45) * labOut * (lup ? 1 - clamp(lupaGo * 3) : 1), 3)};
    });
    const labIn = seg(u, ...W.labels);
    L.labelsG.forEach(lb => { nodes[lb.name] = {opacity: r(labIn, 3)}; });
    // --- band
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.key), 3)};
    if (L.key) nodes.key = {opacity: r(seg(u, ...W.key), 3)};
    if (L.notesL) nodes.notesL = {opacity: r(seg(u, ...W.notes), 3)};
    if (L.notesR) nodes.notesR = {opacity: r(seg(u, ...W.notes), 3)};

    // --- semantics
    const kinds = L.links.map(lk => lk.rel.kind);
    const semantic = {
      u: r(u, 4),
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      arrangement: L.rows ? 'rows' : 'cols',
      textSize: r(L.s, 2),
      wordSplit: !!L.geo.wordSplit,
      premiseStatus: p.premiseStatus,
      explode: r(Math.min(part, drop), 3),
      gather: r(gath, 3),
      fact: P2(centerOf(cur.fact)), conclusion: P2(centerOf(cur.conclusion)), rule: P2(centerOf(cur.rule)),
      ruleHiddenUnderSeam: part === 0 && drop === 0,
      ruleLevel: Math.abs(cur.rule.y - base.premise.y) < 0.5 && Math.abs(cur.rule.x - base.premise.x) < 0.5 ? 'walk' : 'beneath',
      hingeK: hingePts.map(hp => r(hp.k, 3)),
      hingeA: P2(hingePts[0].pos), hingeB: P2(hingePts[1].pos),
      hingesInTray: toTray >= 1 && gath === 0,
      latched: gath >= 1 && hingePts.every(hp => hp.k >= 1) && L.stated,
      foldedHome: gath >= 1 && hingePts.every(hp => hp.k <= -1),
      relationsDrawn: drawn,
      linkEnds: ends,
      linkLengths: lengths,
      linkKinds: kinds,
      arrowheads: L.links.map(lk => lk.c.arrow),
      causalCount: kinds.filter(k => k === 'causal').length,
      tracerVisible: trOp > 0,
      tracerInsidePart: deepest > 0,
      tracer: P2(tp),
      visited,
      visitOrder: L.route.visits.map(v => v.id),
      focus: p.focusElement,
      focusScale: r(focusK, 3),
      focusU: fU === null ? null : r(fU, 3),
      lupa: P2(lc),
      lupaOverFocus: lupaGo >= 1,
      labelsExploded: L.labelsE.map(lb => lb.clear),
      labelsGathered: L.labelsG.map(lb => lb.clear),
      // each hold caption is tied to a visible wire (its link is drawn) or has its own leader
      labelsTied: L.labelsG.map((lb, i) => lb.hasLeader || (!lb.lying && drawn[i] === 1 && lengths[i] > 30)),
      labelsLying: L.labelsG.map(lb => lb.lying),
      labelsShown: labIn >= 1,
      keyShown: !!L.key && seg(u, ...W.key) >= 1,
      notesShown: seg(u, ...W.notes) >= 1,
      keyText: L.key ? L.key.text : null,
      notes: L.notes.map(nt => nt.text),
      bodyPx1080: r(Math.min(...L.geo.bodySizes) / L.u, 2),
      notePx1080: r(L.ns / L.u, 2),
      kindPx1080: r(Math.min(...L.geo.kindSizes) / L.u, 2),
      outcome: null,
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
    slug: 'reasoning-08-mechanism',
    title: 'Hidden premise — exploded view: the gap, the card beneath it and the hinge links',
    titleEs: 'Premisa oculta — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Premisa oculta',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded two-layer diagram: the closed walk comes apart into the argument as written (fact and conclusion on the walk line, with an empty gap between them), the intermediate card in the layer beneath the gap, the two brass hinges in a parts tray and a magnifier. Only the supplied relationships are drawn, edge-anchored and styled by kind (a relation has no arrowhead); a tracer follows the supplied order while the focus part enlarges. Gathered, a stated card rises into the gap and is latched by the hinges; an unstated one stays beneath the gap with the hinges folded back. States are as supplied; no conclusion is drawn.',
    tags: ['reasoning', 'hidden premise', 'enthymeme', 'mechanism', 'exploded view', 'relation', 'sequence', 'tracer', 'hinge', 'magnifier'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/premisa-oculta.js', 'src/animations/reasoning/kits/hecho-y-regla.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
