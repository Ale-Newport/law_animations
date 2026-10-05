/**
 * LAW-0082 — Hecho y regla · mechanism
 *
 * Storyboard (parts diagram on a plain ground: no hands, no desk):
 *  0.00–0.18 separate  The docked assembly comes apart: the fact card slides
 *                      one way, the rule plate the other, and the latch bolts
 *                      (the connector) leave the card's channels and are laid
 *                      in a connector tray — a grooved tray under the gap on
 *                      wide boxes (its label band carries the component name
 *                      and the supplied working assumptions), a grooved rack
 *                      across the gap on tall boxes (rows are columns there;
 *                      the label and the resting magnifier lie between its
 *                      grooves).
 *  0.18–0.43 relate    Only the SUPPLIED relationships are drawn, one after
 *                      the other, each in its own style and edge-anchored:
 *                      fact↔connector from each attribute's channel mouth to
 *                      that row's bolt, connector↔rule from each bolt's tip to
 *                      the socket with the same profile, fact↔rule across the
 *                      headers, the magnifier's link to the focus bolt. A plain
 *                      relation has end dots and NO arrowhead; sequence /
 *                      communication get an arrowhead; a thick causal arrow
 *                      appears only when supplied.
 *  0.43–0.75 trace     A tracer follows `traversalOrder` along the drawn links
 *                      of the focus row; the focus element enlarges while the
 *                      tracer passes it. Once the tracer has reached the
 *                      connector the magnifier glides onto the focus bolt; its
 *                      glass shows a real enlarged copy of what lies under it.
 *  0.75–1.00 gather    The mechanism is gathered WITHOUT hiding its origin:
 *                      card and plate close in part (wide boxes) but stay
 *                      apart; the tray stays, with dashed outlines where the
 *                      bolts lay. Every bolt whose status is supplied as
 *                      coinciding or disputed is lifted out of the tray onto
 *                      its row and runs to the stop of that status — seated
 *                      in its socket (registration closes) or stopping short
 *                      with a '?' disc; a pending bolt stays in the tray. The
 *                      fact↔connector wires stay attached to the bolts the
 *                      whole time; the magnifier rides the focus bolt to its
 *                      joint. The final hold labels every supplied connection
 *                      on its own wire (with its kind) and keys the joint
 *                      states; the supplied issue hangs on the joint.
 * Wide/square boxes: rows horizontal, tray under the gap. Tall boxes: rows as
 * columns, rack across the gap, a legend under the parts.
 * Legal content: fictional, jurisdiction unspecified; the rule text is the
 * author's illustrative text; states are descriptive, never a finding.
 * @module animations/reasoning/LAW-0082
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor, roundRectPath} from '../../core/geometry.js';
import {str, oneOf, list, obj} from '../../schemas/fields.js';
import {chip, tracer, textBlock} from '../../primitives/annotate.js';
import {placeChip, placeChipAny, calloutChip, segPolys, leaderPoly, leaderFrom} from '../causation/kits/place.js';
import {
  hrFields, HR_STRINGS, DEFAULT_CONTENT, resolveRows, focusRowOf, assemblyGeometry, cardArt, plateArt, boltArt,
  lupaArt, hrColors, linkSeg, kindSample, stateIcon, trayArt, surfaceKindColor, questionGlyph,
} from './kits/hecho-y-regla.js';
import {shade} from '../../primitives/paper.js';

const ID = 'LAW-0082';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  explode: [0.02, 0.08], slideOut: [0.07, 0.115], drop: [0.11, 0.17], slideOutY: [0.07, 0.165], stations: [0.06, 0.15], chips: [0.145, 0.18],
  relate: [0.19, 0.42], tracer: [0.45, 0.73], tracerFade: [0.73, 0.755],
  close: [0.765, 0.82], rise: [0.8, 0.885], stops: [0.885, 0.955],
  key: [0.9, 0.95], labels: [0.915, 0.97], issue: [0.935, 0.985],
};
const EL = ['fact', 'connector', 'rule', 'lupa'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const EXTRA = {
  en: {
    el_fact: 'Fact card', el_connector: 'Connector bolts', el_rule: 'Rule plate', el_lupa: 'Magnifier',
    keySeated: 'seated · as supplied', keyShort: 'stops short · disputed', keyPending: 'stays in the tray · pending',
    statesNote: 'States as supplied · no conclusion drawn',
  },
  es: {
    el_fact: 'Tarjeta del hecho', el_connector: 'Pernos conectores', el_rule: 'Placa de la regla', el_lupa: 'Lupa',
    keySeated: 'encajado · según lo aportado', keyShort: 'se detiene antes · discutido', keyPending: 'queda en la bandeja · pendiente',
    statesNote: 'Estados según lo aportado · sin conclusión',
  },
};
const STRINGS = {en: {...HR_STRINGS.en, ...EXTRA.en}, es: {...HR_STRINGS.es, ...EXTRA.es}};

const sceneSchema = {
  ...hrFields,
  elements: list('Component labels. Ids are fixed by the scene (fact = fact card, connector = the latch bolts, rule = rule plate, lupa = magnifier); labels are editable. Unlisted components use their built-in label', obj('Component', {
    id: oneOf('Component id', EL),
    label: str('Visible label', 40),
  }, ['id', 'label']), 2, 4),
  relationships: list('Explicit relationships between components. The kind sets the line style: a plain relation has end dots and no arrowhead; sequence/communication get an arrowhead; causal (thick) only when the author supplies it. fact↔connector and connector↔rule are drawn for every row', obj('Relationship', {
    from: oneOf('Source component id', EL),
    to: oneOf('Target component id', EL),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Optional caption for this relationship (defaults to the kind caption)', 60),
  }, ['from', 'to', 'kind']), 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', EL),
  relationLabels: obj('Caption used for each relation kind (in the key and on unlabelled links)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components (follows a drawn link when one joins two consecutive ids)', oneOf('Component id', EL), 2, 8),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  elements: [
    {id: 'fact', label: 'Fact card'},
    {id: 'connector', label: 'Connector bolts'},
    {id: 'rule', label: 'Rule plate'},
    {id: 'lupa', label: 'Magnifier'},
  ],
  relationships: [
    {from: 'fact', to: 'connector', kind: 'relation', label: 'each attribute carries a bolt'},
    {from: 'connector', to: 'rule', kind: 'relation', label: 'each bolt faces its socket'},
    {from: 'lupa', to: 'connector', kind: 'relation', label: 'enlarges the joint in focus'},
  ],
  focusElement: 'connector',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['fact', 'connector', 'rule'],
};

const SHAPES = {
  landscape: {axis: 'x', size: 40, eK: 7.2},
  square: {axis: 'x', size: 36, eK: 5.4},
  portrait: {axis: 'y', size: 42},
};
const M = 32;
const pairKey = (a, b) => [a, b].sort().join('|');
const mix = (a, b, q) => ({x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q)});

/** Normalised relationships: no self-links, one per unordered pair (first wins). */
function relationsOf(p) {
  const seen = new Set();
  const out = [];
  for (const rel of p.relationships) {
    if (rel.from === rel.to) continue;
    const k = pairKey(rel.from, rel.to);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({...rel, key: k});
  }
  return out;
}

/** Key (legend) as a list: icon + up to two lines of text per item, in one or two columns. */
function keyLayout(ctx, groups, box, size) {
  const th = ctx.theme;
  const cols = groups.length;
  const gapC = size * 1.4;
  const colW = (box.w - gapC * (cols - 1)) / cols;
  const parts = [];
  let height = 0;
  groups.forEach((items, ci) => {
    let y = box.y;
    const x0 = box.x + ci * (colW + gapC);
    items.forEach(it => {
      const f = ctx.fit(it.text, {maxWidth: colW - it.iconW - size * 0.6, size, minSize: size * 0.86, maxLines: 3, weight: 500});
      const rowH = Math.max(f.height, size * 1.3);
      parts.push(it.icon(x0, y + rowH / 2));
      parts.push(textBlock(f, {x: x0 + it.iconW + size * 0.6, y: y + (rowH - f.height) / 2, fill: th.fg}));
      y += rowH + size * 0.45;
    });
    height = Math.max(height, y - box.y - size * 0.45);
  });
  return {parts, h: height};
}

/** Widest text of a key column (to size a compact key box). */
function keyTextW(ctx, items, size, maxW) {
  return Math.max(0, ...items.map(it => ctx.fit(it.text, {maxWidth: maxW - it.iconW - size * 0.6, size, minSize: size * 0.86, maxLines: 3, weight: 500}).width + it.iconW + size * 0.6));
}

/** The connector's label: component name (bold caps) and the supplied working assumptions. */
function connectorLabel(ctx, s, width, maxLines) {
  const p = ctx.params;
  const t = ctx.t;
  const labelOf = id => { const e = p.elements.find(x => x.id === id); return e && e.label ? e.label : t[`el_${id}`]; };
  const name = ctx.show('key') ? ctx.fit(labelOf('connector').toUpperCase(), {maxWidth: width, size: Math.max(21, s * 0.6), minSize: 19, maxLines: 3, weight: 800}) : null;
  const txt = p.assumptions.slice(0, 2).map(a => `${t.assumed}: ${a}`).join(' · ');
  const size = Math.max(22, s * 0.6);
  const body = ctx.show('all') && p.assumptions.length ? ctx.fit(txt, {maxWidth: width, size, minSize: 20, maxLines, weight: 600}) : null;
  const gap = s * 0.45;
  const hh = (name ? name.height : s * 0.36) + (body ? gap + body.height : 0);
  return {name, body, gap, h: hh, w: Math.max(name ? name.width : width * 0.6, body ? body.width : 0)};
}

function connectorLabelArt(ctx, lab, cx, y, textless) {
  const parts = [];
  if (lab.name && !textless) parts.push(textBlock(lab.name, {x: cx, y, anchor: 'middle', fill: '#2c3a46'}));
  else parts.push(h('rect', {x: r(cx - lab.w * 0.35), y: r(y + 2), width: r(lab.w * 0.7), height: r(Math.max(8, lab.h * 0.3)), rx: 4, fill: '#bcc6cf'}));
  if (lab.body && !textless) parts.push(textBlock(lab.body, {x: cx, y: y + lab.name.height + lab.gap, anchor: 'middle', fill: '#1f2328'}));
  return parts;
}

/** Geometry for one text size. */
function compose(ctx, s) {
  const p = ctx.params;
  const t = ctx.t;
  const D = ctx.design;
  const S = SHAPES[ctx.view.shape];
  const X = S.axis === 'x';
  const rows = resolveRows(p);
  const n = rows.length;
  const focus = focusRowOf(rows);
  const labelOf = id => { const e = p.elements.find(x => x.id === id); return e && e.label ? e.label : t[`el_${id}`]; };
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const G0 = s * 3.1, Dd = s * 1.2;
  const BL = G0 + Dd + s * 1.1;
  const common = {rows, size: s, show: showKey, kinds: {fact: labelOf('fact'), rule: labelOf('rule')}, titles: {fact: p.facts.title, rule: p.rules.title}, G: G0, D: Dd};
  const rels = relationsOf(p);
  const statusesUsed = ['as-supplied', 'disputed', 'pending'].filter(st => rows.some(rw => rw.attr && rw.cond !== null && rw.status === st));
  const keySize = Math.max(26, s * 0.76);
  const moving = rows.filter(rw => rw.attr && rw.cond !== null && (rw.status === 'as-supplied' || rw.status === 'disputed')).map(rw => rw.i);
  const issue = showAll ? (p.issues.find(x => x.attribute === focus) || p.issues[0]) : null;
  const issueOk = !!(issue && rows[issue.attribute] && rows[issue.attribute].attr);
  const stateItems = statusesUsed.map(st => ({icon: (x, y) => g({transform: T(x, y)}, stateIcon(ctx, st, keySize * 0.95)), iconW: keySize * 3.1, text: st === 'as-supplied' ? t.keySeated : st === 'disputed' ? t.keyShort : t.keyPending}));
  let L;
  if (X) {
    const tabL = s * 1.25;
    const E = BL + s * S.eK;
    const dC = (E - G0) / 2;
    const Ef = Math.min(E, BL + s * 3);
    const offF = (Ef - G0) / 2;
    const inner = D.w - 2 * M - tabL - E;
    const cardW = inner * 0.48, plateW = inner - cardW;
    const x0 = M + tabL + dC;
    const geo0 = assemblyGeometry(ctx, {...common, axis: 'x', x: x0, y: 0, cardW, plateW});
    const BW = geo0.BW, pitch = BW + s * 0.8;
    const trayW = BL + s * 1.7;
    const R = clamp(s * 2.05, 52, 84);
    const Lh = R * 1.45;
    // the connector's riveted plaque hangs under the tray (component name + supplied assumptions)
    const plaqueW = Math.max(trayW + s * 2.6, Math.min(D.w * 0.28, trayW + s * 7));
    const lab = connectorLabel(ctx, s, plaqueW - s * 0.8, 6);
    const plaqueH = lab.h + s * 0.7;
    // room under the last groove: the magnifier resting on the focus bolt must not reach the plaque
    const lastPad = focus === n - 1 ? Math.max(s * 0.75 + BW / 2, R * 1.1 + 10) : s * 0.75 + BW / 2;
    const trayH = s * 0.75 + BW / 2 + (n - 1) * pitch + lastPad;
    const exH = geo0.card.h + s * 0.55 + trayH + plaqueH - 8;
    const y0 = M + Math.max(0, (D.h - 2 * M - exH) / 2);
    const geo = assemblyGeometry(ctx, {...common, axis: 'x', x: x0, y: y0, cardW, plateW});
    const gx = geo.card.x + geo.card.w + G0 / 2;
    const trayTop = geo.card.y + geo.card.h + s * 0.55;
    const tray = {x: gx - trayW / 2, y: trayTop, w: trayW, h: trayH};
    const plaque = {x: gx - plaqueW / 2, y: trayTop + trayH - 8, w: plaqueW, h: plaqueH};
    const slots = rows.map((rw, i) => ({x: gx, y: trayTop + s * 0.75 + BW / 2 + i * pitch}));
    const tipTray = slots.map(q => ({x: q.x + BL / 2, y: q.y}));
    // magnifier station right of the tray, level with the focus groove (its link to the focus bolt runs flat), handle out to the right
    const lupaAng0 = 15;
    const reachX = R + Math.cos(Math.PI / 12) * (R + Lh) + 8;
    const drop0 = R + Math.sin(Math.PI / 12) * (Lh + 4);
    const lupa0 = {x: Math.min(Math.max(tray.x + tray.w + R + s * 2.6, geo.plate.x + dC + geo.plate.w * 0.3), D.w - M - reachX), y: clamp(slots[focus].y, geo.card.y + geo.card.h + R + s * 0.4, D.h - M - drop0)};
    const lupaBottom0 = lupa0.y + drop0;
    // final states key: lower left, under the card and left of the tray's plaque (the magnifier and the joint labels use the right)
    const regionX1 = Math.min(tray.x, plaque.x) - s * 0.6;
    const regionTop = geo.card.y + geo.card.h + s * 0.5;
    const keyMaxW = regionX1 - M - s * 0.6;
    const keyItems = showAll ? stateItems : [];
    const noteFit = showAll ? ctx.fit(t.statesNote, {maxWidth: Math.max(keyMaxW, 100), size: keySize * 0.9, minSize: 19, maxLines: 2, weight: 600}) : null;
    const kW = showAll ? Math.max(keyTextW(ctx, keyItems, keySize, keyMaxW), noteFit.width) : 0;
    const kProbe = showAll ? keyLayout(ctx, [keyItems], {x: 0, y: 0, w: kW}, keySize) : {h: 0};
    const kH = showAll ? kProbe.h + keySize * 0.5 + noteFit.height : 0;
    const keyBox = showAll ? {x: M + s * 0.3 + (geo.tab.x - dC - M) * 0, y: D.h - M - s * 0.3 - kH, w: kW, h: kH} : null;
    const fits = exH <= D.h - 2 * M + 0.5 && lupaBottom0 <= D.h - M && lupa0.x - R >= tray.x + tray.w + 12
      && (!showAll || (keyMaxW >= kW - 0.5 && keyBox.y - s * 0.3 >= regionTop));
    L = {X, E, dC, Ef, offF, geo, tray, plaque, slots, tipTray, R, Lh, lupa0, lupaAng0, lab, gx, keyBox, noteFit, keyItems, pitch, fits,
      budget: {exH: r(exH), room: r(D.h - 2 * M), lupaBottom0: r(lupaBottom0), keyTop: keyBox ? r(keyBox.y) : null, regionTop: r(regionTop)}};
  } else {
    const Wd = D.w - 2 * M;
    const geo0 = assemblyGeometry(ctx, {...common, axis: 'y', x: M, y: 0, width: Wd});
    const BW = geo0.BW, P = geo0.P;
    const gw = BW * 0.62;
    const gapW = P - BW - s * 0.5;
    let R = clamp(s * 1.7, 44, 70);
    const Lh0 = 1.45;
    // magnifier and connector label lie between the rack's grooves; with two columns they share the single gap
    const lensGap = focus >= 1 ? focus - 1 : 0;
    const shared = n < 3;
    const labelGap = shared ? lensGap : (lensGap === 0 ? n - 2 : 0);
    R = Math.min(R, (shared ? gapW * 0.42 : gapW) / 2 - 6);
    const Lh = R * Lh0;
    const labW = Math.max(60, shared ? gapW - 2 * R - s * 0.9 : gapW - s * 0.3);
    const lab = connectorLabel(ctx, s, labW, 9);
    const zone = 0.4 * G0 + BL + s * 0.8;
    const hr = Math.max(BL + s * 1.0, lab.h + s * 1.1, 2 * R + Lh + s * 0.8);
    const lr = s * 1.35;
    const E = zone + hr + lr;
    const dC = (E - G0) / 2;
    const keyBoxW = {x: M + s * 0.3, w: Wd - s * 0.6};
    // legend under the parts: every supplied relation with its kind, the joint states, the supplied issue
    const issueItem = issueOk ? [{icon: (x, y) => g({transform: T(x + keySize * 0.75, y)}, h('circle', {r: r(keySize * 0.62), fill: hrColors(ctx).disputed, stroke: ctx.theme.ink, 'stroke-width': 2}), questionGlyph(keySize * 0.8, '#ffffff')), iconW: keySize * 1.6, text: `${t.issue} · ${t.attribute} ${issue.attribute + 1}: ${issue.text}`}] : [];
    const relItems = showAll ? rels.map(rel => ({icon: (x, y) => g({transform: T(x, y)}, kindSample(ctx, rel.kind, surfaceKindColor(ctx, rel.kind), keySize * 2.1)), iconW: keySize * 2.4, text: `${rel.label || p.relationLabels[rel.kind] || rel.kind} · ${p.relationLabels[rel.kind] || rel.kind}`})) : [];
    const groups = showAll ? [relItems, [...stateItems, ...issueItem]] : [];
    const probe = showAll ? keyLayout(ctx, groups, {...keyBoxW, y: 0}, keySize) : {h: 0};
    const noteFit = showAll ? ctx.fit(t.statesNote, {maxWidth: keyBoxW.w, size: keySize * 0.9, minSize: 19, maxLines: 2, weight: 600}) : null;
    const keyH = showAll ? probe.h + keySize * 0.5 + noteFit.height : 0;
    const keyBox = {...keyBoxW, y: D.h - M - s * 0.3 - keyH, h: keyH};
    const exH = geo0.plate.h + E + (geo0.tab.y + geo0.tab.h - geo0.card.y);
    const roomBottom = showAll ? keyBox.y - s * 0.7 : D.h - M;
    const y0 = M + dC + Math.max(0, (roomBottom - M - exH) / 2);
    const geo = assemblyGeometry(ctx, {...common, axis: 'y', x: M, y: y0, width: Wd});
    const plateBottomEx = geo.plate.y + geo.plate.h - dC;
    const rackTop = plateBottomEx + zone;
    const cx = geo.cells.map(c => c.cx);
    const tray = {x: cx[0] - P / 2 + s * 0.2, y: rackTop, w: (n - 1) * P + P - s * 0.4, h: hr};
    const slots = rows.map((rw, i) => ({x: cx[i], y: rackTop + hr / 2}));
    const tipTray = slots.map(q => ({x: q.x, y: q.y - BL / 2}));
    const gapX0 = k => cx[k] + BW / 2 + s * 0.25, gapX1 = k => cx[k + 1] - BW / 2 - s * 0.25;
    // resting magnifier: handle down, in its gap (on the focus side when the gap is shared)
    const lensCx = shared ? (focus >= 1 ? gapX1(lensGap) - R - 4 : gapX0(lensGap) + R + 4) : (gapX0(lensGap) + gapX1(lensGap)) / 2;
    const lupa0 = {x: lensCx, y: rackTop + s * 0.4 + R};
    const labCx = shared ? (focus >= 1 ? gapX0(labelGap) + labW / 2 : gapX1(labelGap) - labW / 2) : (gapX0(labelGap) + gapX1(labelGap)) / 2;
    const labBox = {x: labCx - Math.min(lab.w + s * 0.5, labW + s * 0.25) / 2, y: rackTop + (hr - lab.h - s * 0.5) / 2, w: Math.min(lab.w + s * 0.5, labW + s * 0.25), h: lab.h + s * 0.5};
    const exBottom = geo.tab.y + geo.tab.h + dC;
    const fits = exBottom <= roomBottom + 0.5 && R >= 30 && labW >= 90;
    L = {X, E, dC, Ef: E, offF: dC, geo, tray, slots, tipTray, R, Lh, lupa0, lupaAng0: 90, lab, labBox, labCx, keyBox, noteFit, groups, zone, hr, fits,
      budget: {exBottom: r(exBottom), roomBottom: r(roomBottom), keyH: r(keyH), R: r(R), labW: r(labW)}};
  }
  return {...L, s, rows, n, focus, G0, Dd, BL, rels, keySize, moving, issue: issueOk ? issue : null, labelOf, statusesUsed};
}

/** Leader of a callout re-aimed at a moving end point (chip stays put). */
function followLeader(c, end, p) {
  const from = leaderFrom(c.box, end);
  const len = Math.hypot(end.x - from.x, end.y - from.y);
  return {
    [`${c.name}-lead`]: {x1: r(from.x), y1: r(from.y), x2: r(end.x), y2: r(end.y), 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${c.name}-dot`]: {cx: r(end.x), cy: r(end.y)},
  };
}

/** Per-row timing of the gather (rise out of the tray, run to the supplied stop). */
function gatherTiming(L) {
  const m = Math.max(1, L.moving.length);
  const dR = (W.rise[1] - W.rise[0]) / (m * 0.55 + 0.45);
  const dS = (W.stops[1] - W.stops[0]) / (m * 0.6 + 0.4);
  const out = {};
  L.moving.forEach((i, j) => {
    out[i] = {rise: [W.rise[0] + j * dR * 0.55, W.rise[0] + j * dR * 0.55 + dR], stop: [W.stops[0] + j * dS * 0.6, W.stops[0] + j * dS * 0.6 + dS]};
  });
  return out;
}

/**
 * Part poses at normalised time u (pure): card and plate offsets, bolt tips,
 * the focus scale. `withFocus` applies the tracer-driven enlargement.
 */
function stateAt(L, u, withFocus, focusK = 1) {
  const geo = L.geo;
  const dir = geo.dir;
  const X = L.X;
  const sep = ease.inOutCubic(seg(u, ...W.explode));
  const cl = X ? ease.inOutCubic(seg(u, ...W.close)) : 0;
  const off = L.dC * sep - (L.dC - L.offF) * cl;
  const cardShift = {x: -dir.x * off, y: -dir.y * off};
  const plateShift = {x: dir.x * off, y: dir.y * off};
  const pe = k0 => (withFocus ? k0 : 1);
  const kCard = pe(L.focusEl === 'fact' ? focusK : 1), kPlate = pe(L.focusEl === 'rule' ? focusK : 1);
  const cc = {x: geo.card.x + geo.card.w / 2, y: geo.card.y + geo.card.h / 2};
  const pc = {x: geo.plate.x + geo.plate.w / 2, y: geo.plate.y + geo.plate.h / 2};
  const cardPt = q => ({x: cc.x + (q.x - cc.x) * kCard + cardShift.x, y: cc.y + (q.y - cc.y) * kCard + cardShift.y});
  const platePt = q => ({x: pc.x + (q.x - pc.x) * kPlate + plateShift.x, y: pc.y + (q.y - pc.y) * kPlate + plateShift.y});
  const n = L.n;
  const tim = L.timing;
  const tips = [], travel = [], inTray = [], k = [], rise = [];
  const stag = 0.012;
  L.rows.forEach((rw, i) => {
    const port = geo.cells[i].port;
    const sock = geo.cells[i].sock;
    const inCard = cardPt({x: port.x - dir.x * 4, y: port.y - dir.y * 4});
    const trayTip = L.tipTray[i];
    let tip, placed;
    if (X) {
      // out of the channel onto its row (just clear of the exploded card edge), then down into the tray
      const exPort = {x: port.x - dir.x * L.dC, y: port.y - dir.y * L.dC};
      const floatTip = {x: exPort.x + dir.x * (L.BL + L.s * 0.6), y: exPort.y + dir.y * (L.BL + L.s * 0.6)};
      const outOrder = n - 1 - i; // the row nearest the tray goes first (nothing passes over a waiting bolt)
      const so = ease.inOutCubic(seg(u, W.slideOut[0] + outOrder * stag * 0.5, W.slideOut[1]));
      const drop = ease.inOutCubic(seg(u, W.drop[0] + outOrder * stag, W.drop[1]));
      tip = drop > 0 ? mix(floatTip, trayTip, drop) : mix(inCard, floatTip, so);
      placed = drop >= 1;
    } else {
      // straight out of the card's channel into the rack groove on the same column
      const so = ease.inOutCubic(seg(u, W.slideOutY[0] + i * stag * 0.5, W.slideOutY[1]));
      tip = mix(inCard, trayTip, so);
      placed = so >= 1;
    }
    let ri = 0, kk = 0, tr = 0;
    const tm = tim[i];
    if (tm) {
      ri = ease.inOutCubic(seg(u, ...tm.rise));
      kk = seg(u, ...tm.stop);
      if (ri > 0) {
        const S = platePt(sock);
        const ready = {x: S.x - dir.x * L.G0 * 0.8, y: S.y - dir.y * L.G0 * 0.8};
        tip = mix(trayTip, ready, ri);
        // travel from the ready point to the SUPPLIED stop: seated (tip D deep in the socket) or short (0.4·G before the mouth)
        const target = rw.status === 'as-supplied' ? L.G0 * 0.8 + L.Dd : L.G0 * 0.4;
        if (rw.status === 'as-supplied') tr = target * (L.reduced ? ease.outCubic(kk) : ease.outBack(kk));
        else {
          const q = clamp((kk - 0.7) / 0.3);
          const jam = L.reduced ? 0 : Math.sin(q * Math.PI * 2) * 4 * (1 - q);
          tr = target * ease.outCubic(clamp(kk / 0.7)) - (kk > 0.7 ? jam : 0);
        }
        tip = {x: tip.x + dir.x * tr, y: tip.y + dir.y * tr};
      }
    }
    tips.push(tip);
    travel.push(tr);
    inTray.push(placed && ri === 0);
    k.push(kk);
    rise.push(ri);
  });
  const C = geo.card, Pl = geo.plate, Tb = geo.tab;
  const box = (b, f, kk) => {
    const a = f({x: b.x, y: b.y});
    return {x: a.x, y: a.y, w: b.w * kk, h: b.h * kk};
  };
  return {sep, off, cardShift, plateShift, kCard, kPlate, cc, pc, cardPt, platePt, tips, travel, inTray, k, rise,
    cardBox: box(C, cardPt, kCard), plateBox: box(Pl, platePt, kPlate), tabBox: box(Tb, cardPt, kCard)};
}

/** Tip / tail / centre of bolt i (scaled by kb about its centre). */
function boltEnds(L, st, i, kb = 1) {
  const dir = L.geo.dir;
  const tip = st.tips[i];
  const c = {x: tip.x - dir.x * L.BL / 2, y: tip.y - dir.y * L.BL / 2};
  return {c, tip: {x: c.x + dir.x * L.BL / 2 * kb, y: c.y + dir.y * L.BL / 2 * kb}, tail: {x: c.x - dir.x * L.BL / 2 * kb, y: c.y - dir.y * L.BL / 2 * kb}};
}

/** Bounding box of a bolt whose tip is at `tip` (scale 1). */
function boltBox(L, tip) {
  const bw = L.geo.BW;
  return L.X ? {x: tip.x - L.BL, y: tip.y - bw / 2, w: L.BL, h: bw} : {x: tip.x - bw / 2, y: tip.y, w: bw, h: L.BL};
}

/** Representative point of each element (where the tracer 'visits' it). */
function elementPoints(L, st, kb = 1) {
  const f = L.focus;
  const dir = L.geo.dir;
  const c = L.geo.cells[f];
  const be = boltEnds(L, st, f, kb);
  return {
    fact: st.cardPt({x: c.port.x - dir.x * 22, y: c.port.y - dir.y * 22}),
    rule: st.platePt({x: c.sock.x + dir.x * (L.Dd + 20), y: c.sock.y + dir.y * (L.Dd + 20)}),
    connector: be.c,
    lupa: L.lupa0,
  };
}

/** Link segment end points [A on its source element, B on its target element] (source = relationship `from`). */
function linkEnds(L, st, lk, j, kb = [], lupa = {c: L.lupa0, R: L.R}) {
  const i = lk.segs[j].i;
  const geo = L.geo;
  let A, B;
  if (lk.type === 'fc') { A = st.cardPt(geo.cells[i].port); B = boltEnds(L, st, i, kb[i] ?? 1).tail; }
  else if (lk.type === 'cr') { A = boltEnds(L, st, i, kb[i] ?? 1).tip; B = st.platePt(geo.cells[i].sock); }
  else if (lk.type === 'fr') {
    A = L.X ? st.cardPt({x: geo.card.x + geo.card.w, y: geo.card.y + geo.HBc / 2}) : st.cardPt({x: geo.card.x + 16, y: geo.card.y});
    B = L.X ? st.platePt({x: geo.plate.x, y: geo.plate.y + geo.HBp / 2}) : st.platePt({x: geo.plate.x + 16, y: geo.plate.y + geo.plate.h});
  } else {
    let q;
    if (lk.other === 'connector') {
      const be = boltEnds(L, st, L.focus, kb[L.focus] ?? 1);
      if (L.X) q = {x: be.tip.x + 8, y: be.tip.y};
      else {
        const sx = Math.sign(lupa.c.x - be.c.x) || 1;
        q = {x: be.c.x + sx * geo.BW / 2, y: be.c.y};
      }
    } else q = edgeAnchor(lk.other === 'fact' ? st.cardBox : st.plateBox, lupa.c, 0);
    const Lq = Math.hypot(q.x - lupa.c.x, q.y - lupa.c.y) || 1;
    A = {x: lupa.c.x + ((q.x - lupa.c.x) / Lq) * (lupa.R + 6), y: lupa.c.y + ((q.y - lupa.c.y) / Lq) * (lupa.R + 6)};
    B = q;
  }
  const natural = lk.type === 'lupa' ? 'lupa' : lk.type === 'cr' ? 'connector' : 'fact';
  return lk.rel.from === natural ? [A, B] : [B, A];
}

/** Visibility of one link segment at time u (pure; the gather keeps the wires, a cr wire closes into its joint). */
function segVisibility(L, lk, j, u, st) {
  if (lk.type === 'lupa') return 1 - seg(u, L.lupaGo[0], L.lupaGo[0] + 0.03);
  if (lk.type === 'cr') {
    const i = lk.segs[j].i;
    return L.timing[i] ? 1 - seg(st.rise[i], 0.45, 1) : 1;
  }
  return 1;
}

/** Magnifier pose at u: station → focus bolt in the tray → rides it to its joint. */
function lupaPose(L, u, st, kb) {
  const geo = L.geo;
  const dir = geo.dir;
  const X = L.X;
  const go = ease.inOutSine(seg(u, ...L.lupaGo));
  const stIn = ease.outCubic(seg(u, ...W.stations));
  const slideIn = (1 - stIn) * 60;
  const station = {x: L.lupa0.x + (X ? 0 : slideIn), y: L.lupa0.y + (X ? slideIn : 0)};
  const onBolt = q => {
    const be = boltEnds(L, {tips: q}, L.focus, 1);
    return {x: be.tip.x - dir.x * L.BL * 0.26, y: be.tip.y - dir.y * L.BL * 0.26};
  };
  const trayOn = onBolt(L.tipTray);
  let c = {x: lerp(station.x, trayOn.x, go), y: lerp(station.y, trayOn.y, go) - Math.sin(Math.PI * go) * 24};
  let ang = go > 0.5 ? L.lupaAngTray : L.lupaAng0;
  if (go > 0 && go < 1) ang = lerp(L.lupaAng0, L.lupaAngTray, go);
  const tm = L.timing[L.focus];
  let ri = 0, settle = 0;
  if (tm) {
    ri = ease.inOutCubic(seg(u, ...tm.rise));
    settle = ease.inOutCubic(seg(u, ...tm.stop));
    if (ri > 0) {
      const ob = onBolt(st.tips);
      c = mix(ob, L.jointEnd, settle);
      ang = lerp(L.lupaAngTray, L.lupaAngEnd, ri);
    }
  }
  const lift = 0.2 + 0.6 * Math.max(Math.sin(Math.PI * go), Math.sin(Math.PI * ri));
  void kb;
  return {c, ang, lift, go, ri, settle, stIn, atJoint: tm ? settle >= 1 : go >= 1};
}

/** Nodes, static endpoints and label placement. */
function finishLayout(ctx, L) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const D = ctx.design;
  const geo = L.geo;
  const X = L.X;
  const col = hrColors(ctx);
  L.timing = gatherTiming(L);
  // --- parts
  L.card = cardArt(ctx, geo, {prefix: 'crd'});
  L.plate = plateArt(ctx, geo, {prefix: 'plt'});
  L.bolts = L.rows.map((rw, i) => (rw.attr ? boltArt(ctx, geo, i, {name: `bolt${i}`, status: rw.status}) : null));
  const ghosts = L.rows.filter(rw => rw.attr).map(rw => ({profile: rw.profile, tip: L.tipTray[rw.i], angle: geo.angle}));
  const trayOpts = textless => {
    if (X) {
      const pq = L.plaque;
      return {extra: g(null,
        h('path', {d: roundRectPath(pq.x + 4, pq.y + 6, pq.w, pq.h, 8), fill: th.shadow}),
        h('path', {d: roundRectPath(pq.x, pq.y, pq.w, pq.h, 8), fill: '#e9edf0', stroke: th.metalDark, 'stroke-width': 2}),
        h('circle', {cx: r(pq.x + 10), cy: r(pq.y + 10), r: 3.6, fill: th.metalDark}),
        h('circle', {cx: r(pq.x + pq.w - 10), cy: r(pq.y + 10), r: 3.6, fill: th.metalDark}),
        connectorLabelArt(ctx, L.lab, L.gx, pq.y + L.s * 0.35, textless))};
    }
    const lb = L.labBox;
    return {extra: g(null,
      h('path', {d: roundRectPath(lb.x + 4, lb.y + 6, lb.w, lb.h, 8), fill: th.shadow}),
      h('path', {d: roundRectPath(lb.x, lb.y, lb.w, lb.h, 8), fill: '#e9edf0', stroke: th.metalDark, 'stroke-width': 2}),
      h('circle', {cx: r(lb.x + 9), cy: r(lb.y + 9), r: 3.4, fill: th.metalDark}),
      h('circle', {cx: r(lb.x + lb.w - 9), cy: r(lb.y + 9), r: 3.4, fill: th.metalDark}),
      connectorLabelArt(ctx, L.lab, L.labCx, lb.y + L.s * 0.25, textless))};
  };
  L.trayNode = trayArt(ctx, {name: 'tray', box: L.tray, axis: geo.axis, slots: L.slots, len: L.BL, bw: geo.BW, ghosts, ...trayOpts(false)});
  // --- the magnifier and its real copy (same world coordinates, transforms mirrored per frame)
  const copyPlate = plateArt(ctx, geo, {prefix: 'zp', textless: true});
  const copyCard = cardArt(ctx, geo, {prefix: 'zc', textless: true});
  L.copyBolts = L.rows.map((rw, i) => (rw.attr ? boltArt(ctx, geo, i, {name: `zbolt${i}`, status: rw.status}) : null));
  const copy = g(null,
    trayArt(ctx, {name: 'ztray', box: L.tray, axis: geo.axis, slots: L.slots, len: L.BL, bw: geo.BW, ghosts, ...trayOpts(true)}),
    g({name: 'zplate'}, copyPlate.base),
    g({name: 'zbolts'}, L.copyBolts.map(b => b && b.node)),
    g({name: 'zcard'}, copyCard),
    g({name: 'zplate-top'}, copyPlate.top));
  L.lupa = lupaArt(ctx, {name: 'lupa', R: L.R, handle: L.Lh, copy, zoom: 1.9, lensFill: th.paper});
  L.tracerNode = tracer(ctx, 'tracer', th.accent);

  // --- links (segments per row for fact↔connector and connector↔rule)
  L.links = L.rels.map((rel, k) => {
    const pair = rel.key;
    let type;
    if (pair === pairKey('fact', 'connector')) type = 'fc';
    else if (pair === pairKey('connector', 'rule')) type = 'cr';
    else if (pair === pairKey('fact', 'rule')) type = 'fr';
    else type = 'lupa';
    const other = type === 'lupa' ? (rel.from === 'lupa' ? rel.to : rel.from) : null;
    const segs = [];
    if (type === 'fc') L.rows.forEach((rw, i) => { if (rw.attr) segs.push({i}); });
    else if (type === 'cr') L.rows.forEach((rw, i) => { if (rw.attr && rw.cond !== null) segs.push({i}); });
    else segs.push({i: -1});
    const color = surfaceKindColor(ctx, rel.kind);
    const nodes = segs.map((sg, j) => linkSeg(ctx, `lk${k}-${j}`, rel.kind, color, 1.6));
    const fwd = rel.from === (type === 'fc' ? 'fact' : type === 'cr' ? 'connector' : type === 'fr' ? 'fact' : 'lupa');
    const cap = p.relationLabels[rel.kind] || rel.kind;
    return {rel, k, type, other, segs, nodes, color, fwd, text: rel.label || cap, cap};
  });
  // static exploded state (u = 0.4): used for label placement and the tracer route
  const st = stateAt(L, 0.4, false);
  const ends0 = L.links.map(lk => lk.segs.map((sg, j) => linkEnds(L, st, lk, j)));
  L.linkPolys = ends0.flat().flatMap(([A, B]) => segPolys([A, B], 16));

  // --- magnifier: angles and the final joint
  const f = L.focus;
  const fin = stateAt(L, 1, false);
  L.lupaAngTray = X ? 25 : (f >= 1 ? 135 : 45);
  if (X) L.lupaAngEnd = f >= L.n / 2 ? 60 : -120;
  else L.lupaAngEnd = f >= 1 ? 135 : 45;
  {
    const rwf = L.rows[f];
    const S = fin.platePt(geo.cells[f].sock);
    const dir = geo.dir;
    if (L.timing[f]) {
      L.jointEnd = rwf.status === 'disputed'
        ? {x: S.x - dir.x * L.G0 * 0.2, y: S.y - dir.y * L.G0 * 0.2}
        : {x: S.x - dir.x * L.s * 0.25, y: S.y - dir.y * L.s * 0.25};
    } else {
      const be = boltEnds(L, fin, f);
      L.jointEnd = {x: be.tip.x - dir.x * L.BL * 0.26, y: be.tip.y - dir.y * L.BL * 0.26};
    }
  }

  // --- tracer route along the focus row (exploded state, bolts in the tray)
  const pts = elementPoints(L, st);
  const hop = (a, b) => {
    const lk = L.links.find(x => x.rel.key === pairKey(a, b));
    if (!lk) return [pts[a], pts[b]];
    const j = Math.max(0, lk.segs.findIndex(sg => sg.i === f || sg.i === -1));
    const [A, B] = linkEnds(L, st, lk, j);
    const [P, Q] = lk.fwd ? [A, B] : [B, A];
    const fromId = lk.rel.from, toId = lk.rel.to;
    let way = [pts[fromId], P, Q, pts[toId]];
    if (fromId !== a) way = way.slice().reverse();
    return way;
  };
  const order = p.traversalOrder.filter(id => EL.includes(id));
  const routePts = [pts[order[0]]];
  const visitIdx = [0];
  for (let q = 1; q < order.length; q++) {
    routePts.push(...hop(order[q - 1], order[q]).slice(1));
    visitIdx.push(routePts.length - 1);
  }
  const cum = [0];
  for (let q = 1; q < routePts.length; q++) cum.push(cum[q - 1] + Math.hypot(routePts[q].x - routePts[q - 1].x, routePts[q].y - routePts[q - 1].y));
  const total = cum[cum.length - 1] || 1;
  L.visits = order.map((id, q) => ({id, t: cum[visitIdx[q]] / total}));
  L.route = polyline(routePts);
  const cv = L.visits.find(v => v.id === 'connector');
  const uOf = tt => W.tracer[0] + (Math.acos(1 - 2 * tt) / Math.PI) * (W.tracer[1] - W.tracer[0]);
  const u0 = cv ? uOf(cv.t) + 0.01 : 0.55;
  L.lupaGo = [Math.min(u0, W.tracer[1] - 0.09), Math.min(u0, W.tracer[1] - 0.09) + 0.08];
  L.hopWin = [];
  for (let q = 1; q < order.length; q++) {
    const k = L.links.findIndex(x => x.rel.key === pairKey(order[q - 1], order[q]));
    if (k >= 0) L.hopWin.push({k, a: uOf(L.visits[q - 1].t), b: uOf(L.visits[q].t)});
  }

  // --- label placement (exploded state; captions show one at a time during relate / trace)
  const bounds = {x: 10, y: 10, w: D.w - 20, h: D.h - 20};
  const lupaHandle = (c, a) => segPolys([c, {x: c.x + Math.cos(a * Math.PI / 180) * (L.R + L.Lh), y: c.y + Math.sin(a * Math.PI / 180) * (L.R + L.Lh)}], 34);
  const lupaBox = c => ({x: c.x - L.R - 10, y: c.y - L.R - 10, w: 2 * L.R + 20, h: 2 * L.R + 20});
  const fixed = [st.cardBox, st.tabBox, st.plateBox, L.tray, L.plaque, lupaBox(L.lupa0), ...lupaHandle(L.lupa0, L.lupaAng0),
    ...L.rows.map((rw, i) => (rw.attr ? boltBox(L, L.tipTray[i]) : null)), ...L.linkPolys].filter(Boolean);
  const placed = [];
  const leads = [];
  const size = Math.max(22, L.s * 0.7);
  const mkChip = (name, text, target, order2, obst, color = th.ink, keep = true, sz = size) => {
    const mw = Math.min(400, D.w * 0.32);
    const fits = [[mw, 2, 1], [mw * 0.78, 3, 1], [mw * 0.62, 3, 0.94], [mw * 0.95, 2, 0.9], [mw * 0.56, 4, 0.9]]
      .map(([wd, ml, k]) => ({wd, ml, sz: sz * k, box: chip(ctx, text, {x: 0, y: 0, maxWidth: wd, size: sz * k, maxLines: ml}).box}));
    const po = {obstacles: [...obst, ...placed, ...leads], bounds, own: [], order: order2, gaps: [14, 26, 40, 60, 90, 130, 180, 240, 300, 380]};
    const targets = Array.isArray(target) ? target : [target];
    let res = null;
    let ti = 0;
    for (; ti < targets.length; ti++) { res = placeChipAny(fits.map(q => q.box), targets[ti], po); if (res) break; }
    if (!res) { ti = 0; res = {...placeChip(fits[1].box, targets[0], {...po, leastBad: true}), k: 1}; }
    const q = fits[res.k];
    const c = calloutChip(ctx, {name, text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: q.wd, maxLines: q.ml, size: q.sz, color});
    if (keep) {
      placed.push(c.box);
      leads.push(leaderPoly(c.box, res.end));
    }
    return {...c, name, ti};
  };
  L.elChips = [];
  L.linkLabels = [];
  if (ctx.show('all')) {
    L.elChips.push(mkChip('el-lupa', L.labelOf('lupa'), {x: L.lupa0.x, y: L.lupa0.y, r: L.R + 8}, X ? ['right', 'rightHigh', 'above', 'aboveR', 'rightLow', 'below'] : ['above', 'aboveL', 'aboveR', 'left', 'right'], fixed));
    if (X) L.links.forEach((lk, k) => {
      const mids = ends0[k].map(([A, B]) => ({x: (A.x + B.x) / 2, y: (A.y + B.y) / 2}));
      const cand = lk.segs.length > 1 ? mids.slice().reverse() : mids;
      const order2 = lk.type === 'fc' ? ['leftLow', 'belowL', 'left', 'below'] : lk.type === 'cr' ? ['rightLow', 'belowR', 'right', 'below']
        : lk.type === 'fr' ? ['above', 'aboveL', 'aboveR', 'below'] : ['below', 'belowL', 'belowR', 'left'];
      const c = mkChip(`lab${lk.k}`, lk.text, cand, order2, fixed, lk.color, false);
      c.seg = lk.segs.length > 1 ? lk.segs.length - 1 - c.ti : c.ti;
      L.linkLabels.push(c);
    });
  }

  // tall boxes: the current relationship is captioned in a bar in the band under the parts (the legend takes over at the end)
  L.bars = [];
  if (!X && ctx.show('all')) {
    const kb = L.keyBox;
    const bsz = L.keySize * 1.08;
    L.links.forEach((lk, k) => {
      const iconW = bsz * 2.5;
      const ft = ctx.fit(lk.text, {maxWidth: kb.w - iconW - bsz * 1.8, size: bsz, minSize: bsz * 0.8, maxLines: 2, weight: 600});
      const w = iconW + bsz * 0.6 + ft.width + bsz * 1.2;
      const hh = Math.max(ft.height, bsz * 1.3) + bsz * 0.8;
      const x0 = kb.x + (kb.w - w) / 2;
      const cy = kb.y + hh / 2;
      L.bars.push(g({name: `bar${k}`, opacity: 0},
        h('path', {d: roundRectPath(x0, kb.y, w, hh, Math.min(hh / 2, bsz)), fill: th.card, stroke: lk.color, 'stroke-width': 2.4}),
        g({transform: T(x0 + bsz * 0.6, cy)}, kindSample(ctx, lk.rel.kind, lk.color, bsz * 2)),
        textBlock(ft, {x: x0 + bsz * 0.6 + iconW, y: cy - ft.height / 2, fill: th.ink})));
    });
  }

  // --- final hold
  L.key = null;
  L.finLabels = [];
  L.issueNode = null;
  if (ctx.show('all')) {
    const kb = L.keyBox;
    const pad = L.s * 0.35;
    const lay = X ? keyLayout(ctx, [L.keyItems], kb, L.keySize) : keyLayout(ctx, L.groups, kb, L.keySize);
    L.key = g({name: 'key', opacity: 0},
      h('path', {d: roundRectPath(kb.x - pad, kb.y - pad, kb.w + 2 * pad, kb.h + 2 * pad, 14), fill: th.card, stroke: th.inkFaint, 'stroke-width': 1.6, opacity: 0.94}),
      lay.parts,
      textBlock(L.noteFit, {x: X ? kb.x : kb.x + kb.w / 2, y: kb.y + lay.h + L.keySize * 0.5, anchor: X ? 'start' : 'middle', fill: th.fgSoft}));
    const keyObst = {x: kb.x - pad - 6, y: kb.y - pad - 6, w: kb.w + 2 * pad + 12, h: kb.h + 2 * pad + 12};
    if (X) {
      // every supplied connection is labelled on its own wire in the final state (with its kind)
      const dir = geo.dir;
      const lupaA = L.lupaAngEnd;
      const finBolts = L.rows.map((rw, i) => (rw.attr ? boltBox(L, fin.tips[i]) : null));
      const finEnds = L.links.map(lk => lk.segs.map((sg, j) => ({ends: linkEnds(L, fin, lk, j, [], {c: L.jointEnd, R: L.R}), vis: segVisibility(L, lk, j, 1, fin)})));
      const finPolys = finEnds.flat().filter(q => q.vis > 0.5 && lk0Len(q.ends) > 3).flatMap(q => segPolys(q.ends, 14));
      const finObst = [fin.cardBox, fin.tabBox, fin.plateBox, L.tray, L.plaque, ...finBolts, lupaBox(L.jointEnd), ...lupaHandle(L.jointEnd, lupaA), keyObst, ...finPolys].filter(Boolean);
      // labels that point at the magnifier resting on the focus joint stand in a column right of it, ordered by
      // their target's height (leaders never cross); the others are placed next to their own wires
      const J = L.jointEnd;
      const aE = lupaA * Math.PI / 180;
      const kL = 1.07;
      const hEnd = {x: J.x + Math.cos(aE) * (L.R + L.Lh) * kL, y: J.y + Math.sin(aE) * (L.R + L.Lh) * kL};
      const rim = deg => ({x: J.x + Math.cos(deg * Math.PI / 180) * (L.R * kL + 9), y: J.y + Math.sin(deg * Math.PI / 180) * (L.R * kL + 9)});
      const csz = Math.max(22, L.s * 0.66);
      const column = [];
      const loose = [];
      const textOf = lk => (lk.text === lk.cap ? lk.cap : `${lk.text} · ${lk.cap}`);
      L.links.forEach((lk, k) => {
        const vis = finEnds[k].map((q, j) => ({...q, j})).filter(q => q.vis > 0.5 && lk0Len(q.ends) > 3);
        if (lk.type === 'cr' && !vis.length) column.push({name: `fin${k}`, text: textOf(lk), target: rim(-12), color: lk.color});
        else if (lk.type === 'lupa' && lk.other === 'connector') column.push({name: `fin${k}`, text: textOf(lk), target: hEnd, color: lk.color});
        else {
          const targets = lk.type === 'lupa' ? [{x: J.x, y: J.y, r: L.R + 10}] : vis.slice().reverse().map(q => ({x: (q.ends[0].x + q.ends[1].x) / 2, y: (q.ends[0].y + q.ends[1].y) / 2}));
          if (targets.length) loose.push({k, lk, targets});
        }
      });
      if (L.issue) {
        const txt = `${t.issue}: ${L.issue.text}`;
        if (L.issue.attribute === f) column.push({name: 'issue', text: txt, target: rim(28), color: shade(col.disputed, -0.35), issue: true});
        else loose.push({issue: true, txt, targets: [{...mid2(fin.cardPt(geo.cells[L.issue.attribute].port), fin.platePt(geo.cells[L.issue.attribute].sock)), r: 12}]});
      }
      column.sort((q1, q2) => q1.target.y - q2.target.y);
      const colX0 = Math.max(L.plaque.x + L.plaque.w, hEnd.x + 16, J.x + L.R * kL + 24) + L.s * 0.5;
      const colW = D.w - M - colX0;
      const colTop = fin.plateBox.y + fin.plateBox.h + L.s * 0.45;
      const built = column.map(q => ({...q, box: chip(ctx, q.text, {x: 0, y: 0, maxWidth: colW, size: csz, maxLines: 3}).box}));
      const colH = built.reduce((a2, q) => a2 + q.box.h, 0) + Math.max(0, built.length - 1) * L.s * 0.45;
      if (built.length && colW >= 240 && colTop + colH <= D.h - M) {
        let y = colTop + Math.max(0, Math.min(L.s * 0.6, (D.h - M - colTop - colH) / 2));
        for (const q of built) {
          const c = calloutChip(ctx, {name: q.name, text: q.text, chipAt: {x: colX0 + q.box.w / 2, y}, target: q.target, maxWidth: colW, maxLines: 3, size: csz, color: q.color});
          placed.push(c.box);
          leads.push(leaderPoly(c.box, q.target));
          if (q.issue) L.issueNode = {...c, name: q.name};
          else L.finLabels.push({...c, name: q.name});
          y += c.box.h + L.s * 0.45;
        }
      } else {
        for (const q of built) {
          const c = mkChip(q.name, q.text, {...q.target, r: 4}, ['rightLow', 'belowR', 'right', 'below'], finObst, q.color, true, csz);
          if (q.issue) L.issueNode = c; else L.finLabels.push(c);
        }
      }
      for (const q of loose) {
        if (q.issue) { L.issueNode = mkChip('issue', q.txt, q.targets, ['belowR', 'rightLow', 'below', 'belowL', 'leftLow'], finObst, shade(col.disputed, -0.35), true, csz); continue; }
        const lk = q.lk;
        const order2 = lk.type === 'fc' ? ['belowL', 'leftLow', 'below', 'aboveL', 'above'] : lk.type === 'cr' ? ['belowR', 'rightLow', 'below'] : lk.type === 'fr' ? ['above', 'aboveL', 'aboveR', 'belowL'] : ['rightLow', 'belowR', 'right', 'below', 'leftLow'];
        L.finLabels.push(mkChip(`fin${q.k}`, textOf(lk), q.targets, order2, finObst, lk.color, true, csz));
      }
    }
  }
  return L;
}

function lk0Len([A, B]) { return Math.hypot(B.x - A.x, B.y - A.y); }
function mid2(a, b) { return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}; }

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 1000], portrait: [900, 1400]},
  layout(ctx) {
    let s = SHAPES[ctx.view.shape].size;
    let L = compose(ctx, s);
    for (let it = 0; it < 18 && !L.fits; it++) {
      s *= 0.95;
      L = compose(ctx, s);
    }
    L.focusEl = ctx.params.focusElement;
    L.reduced = ctx.reduced;
    return finishLayout(ctx, L);
  },
  build(ctx, L) {
    return g(null,
      L.trayNode,
      g({name: 'plate'}, L.plate.base),
      g({name: 'bolts'}, L.bolts.map(b => b && b.node)),
      g({name: 'card'}, L.card),
      g({name: 'plate-top'}, L.plate.top),
      L.links.map(lk => lk.nodes.map(nd => nd.node)),
      L.bars,
      L.key,
      L.lupa.shadows, L.lupa.view, L.lupa.prop,
      L.elChips.map(c => c.node),
      L.linkLabels.map(c => c.node),
      L.finLabels.map(c => c.node),
      L.issueNode && L.issueNode.node,
      L.tracerNode,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const geo = L.geo;
    const nodes = {};
    const X = L.X;
    // --- tracer and focus enlargement
    const tr = seg(u, ...W.tracer);
    const trE = ease.inOutSine(tr);
    const tracerOn = u >= W.tracer[0] && u < W.tracerFade[1];
    const focusVisit = L.visits.find(v => v.id === p.focusElement);
    const bump = focusVisit
      ? (u < W.tracer[0] || u > W.tracer[1] + 0.02 ? 0 : clamp(1 - Math.abs(trE - focusVisit.t) / 0.16) ** 0.6)
      : Math.sin(Math.PI * seg(u, W.tracer[0], W.tracer[1]));
    const kz = 1 + 0.12 * ease.inOutSine(clamp(bump));
    const st = stateAt(L, u, true, kz);
    const kb = L.rows.map((rw, i) => (p.focusElement === 'connector' && i === L.focus ? kz : 1));
    const kLupa = p.focusElement === 'lupa' ? kz : 1;
    const partT = (shift, c0, k) => `${T(shift.x, shift.y)}${k !== 1 ? ` translate(${r(c0.x)} ${r(c0.y)}) scale(${r(k, 4)}) translate(${r(-c0.x)} ${r(-c0.y)})` : ''}`;
    const cardT = partT(st.cardShift, st.cc, st.kCard);
    const plateT = partT(st.plateShift, st.pc, st.kPlate);
    nodes.card = {transform: cardT};
    nodes.plate = {transform: plateT};
    nodes['plate-top'] = {transform: plateT};
    nodes.zcard = {transform: cardT};
    nodes.zplate = {transform: plateT};
    nodes['zplate-top'] = {transform: plateT};
    // --- bolts
    const seated = [], short = [];
    L.rows.forEach((rw, i) => {
      const kk = st.k[i];
      const moves = !!L.timing[i];
      const isSeated = moves && rw.status === 'as-supplied' && kk >= 1;
      seated.push(isSeated);
      short.push(moves && rw.status === 'disputed' && kk >= 1);
      if (L.bolts[i]) {
        const tip = st.tips[i];
        const base = T(tip.x, tip.y, geo.angle);
        const tf = kb[i] !== 1 ? `${base} translate(${r(-L.BL / 2)} 0) scale(${r(kb[i], 4)}) translate(${r(L.BL / 2)} 0)` : base;
        nodes[`bolt${i}`] = {transform: tf};
        nodes[`zbolt${i}`] = {transform: tf};
      }
      for (const pre of ['plt', 'zp']) {
        if (rw.cond !== null) nodes[`${pre}-rim${i}`] = {opacity: isSeated ? 1 : 0};
        if (rw.status === 'disputed' && rw.attr) nodes[`${pre}-doubt${i}`] = {opacity: moves ? r(seg(kk, 0.72, 0.95), 3) : 0};
        if (rw.status === 'pending' && rw.attr) nodes[`${pre}-ghost${i}`] = {opacity: r(0.9 * seg(u, W.stops[0], W.stops[1]), 3)};
      }
    });
    // --- tray: appears as the parts separate and stays (its outlines keep where the bolts came from)
    const trayVis = ease.inOutSine(seg(u, ...W.stations));
    nodes.tray = {opacity: r(trayVis, 3)};
    nodes.ztray = {opacity: r(trayVis, 3)};
    // --- magnifier
    const lp = lupaPose(L, u, st, kb);
    const lf = L.lupa.frame(lp.c, lp.ang, lp.lift, clamp(lp.stIn * 1.5));
    delete lf.grip;
    if (kLupa !== 1) lf.lupa = {transform: T(lp.c.x, lp.c.y, lp.ang, (1 + 0.07 * lp.lift) * kLupa)};
    Object.assign(nodes, lf);
    nodes.lupa = {...nodes.lupa, opacity: r(clamp(lp.stIn * 1.4), 3)};
    nodes['lupa-shadow'].opacity = r(clamp(lp.stIn * 1.4) * nodes['lupa-shadow'].opacity, 3);
    nodes['lupa-hshadow'].opacity = r(clamp(lp.stIn * 1.4) * nodes['lupa-hshadow'].opacity, 3);

    // --- relationships, drawn one after the other; they stay attached to their parts through the gather
    const nl = L.links.length;
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, nl);
    const linkState = [];
    const lupaNow = {c: lp.c, R: L.R * kLupa};
    // caption visibility (one at a time): relate — in when its link is drawn, out as the next link starts;
    // trace — while the tracer travels this relationship
    const capVis = L.links.map((lk, k) => {
      const inK = seg(u, W.relate[0] + k * span + span * 0.75, W.relate[0] + k * span + span * 0.95);
      const outK = k + 1 < nl ? seg(u, W.relate[0] + (k + 1) * span + span * 0.5, W.relate[0] + (k + 1) * span + span * 0.72) : seg(u, W.tracer[0] - 0.02, W.tracer[0]);
      const onHop = Math.max(0, ...L.hopWin.filter(hw => hw.k === k).map(hw => Math.min(seg(u, hw.a + 0.004, hw.a + 0.02), 1 - seg(u, hw.b - 0.012, hw.b))));
      const own = lk.type === 'lupa' ? 1 - seg(u, L.lupaGo[0], L.lupaGo[0] + 0.03) : 1;
      return Math.max(inK * (1 - outK), onHop) * own;
    });
    const cur = capVis.reduce((best, v, k) => (v > 0.02 && (best < 0 || v > capVis[best]) ? k : best), -1);
    let fcVisible = false;
    L.links.forEach((lk, k) => {
      const dp = ease.inOutSine(seg(u, W.relate[0] + k * span, W.relate[0] + k * span + span * 0.75));
      const dimOthers = cur >= 0 && cur !== k ? 1 - 0.55 * capVis[cur] : 1;
      let landed = true;
      const mids = [];
      lk.segs.forEach((sg, j) => {
        const [P0, P1] = linkEnds(L, st, lk, j, kb, lupaNow);
        mids.push({x: (P0.x + P1.x) / 2, y: (P0.y + P1.y) / 2});
        const vis = segVisibility(L, lk, j, u, st);
        Object.assign(nodes, lk.nodes[j].frame(P0, P1, dp, vis * dimOthers));
        if (lk.type === 'fc' && dp >= 1 && vis > 0.5) fcVisible = true;
        const i = sg.i;
        if (lk.type === 'fc' || lk.type === 'cr') {
          const edgeA = lk.type === 'fc' ? st.cardPt(geo.cells[i].port) : boltEnds(L, st, i, kb[i]).tip;
          const edgeB = lk.type === 'fc' ? boltEnds(L, st, i, kb[i]).tail : st.platePt(geo.cells[i].sock);
          const [eA, eB] = lk.fwd ? [edgeA, edgeB] : [edgeB, edgeA];
          landed = landed && Math.hypot(P0.x - eA.x, P0.y - eA.y) < 0.5 && Math.hypot(P1.x - eB.x, P1.y - eB.y) < 0.5;
        }
      });
      const lab = L.linkLabels[k];
      if (lab) Object.assign(nodes, lab.frame(capVis[k]), followLeader(lab, mids[lab.seg] || mids[0], capVis[k]));
      if (L.bars[k]) nodes[`bar${k}`] = {opacity: r(capVis[k], 3)};
      linkState.push({from: lk.rel.from, to: lk.rel.to, kind: lk.rel.kind, arrow: lk.nodes[0].arrow, drawn: r(dp, 3), segments: lk.segs.length, landed});
    });

    // --- tracer along the route of the focus row (exploded parts, bolts in the tray)
    nodes.tracer = {transform: T(0, 0), opacity: 0};
    const tp = L.route.at(trE);
    if (tracerOn) nodes.tracer = {transform: T(tp.x, tp.y, 0, 1.5), opacity: r(1 - seg(u, ...W.tracerFade), 3)};

    // --- labels: component chip (separate + relate), final key, wire labels, issue
    const chipsIn = seg(u, ...W.chips) * (1 - seg(u, W.relate[1] - 0.01, W.tracer[0]));
    L.elChips.forEach(c => Object.assign(nodes, c.frame(chipsIn * (1 - seg(u, L.lupaGo[0], L.lupaGo[0] + 0.03)))));
    const keyP = seg(u, ...W.key);
    if (L.key) nodes.key = {opacity: r(keyP, 3)};
    const labP = seg(u, ...W.labels);
    L.finLabels.forEach(c => Object.assign(nodes, c.frame(labP)));
    if (L.issueNode) Object.assign(nodes, L.issueNode.frame(seg(u, ...W.issue)));

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const visited = L.visits.filter(v => tracerOn && trE >= v.t - 1e-6).map(v => v.id);
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      axis: X ? 'x' : 'y',
      textSize: r(L.s, 2),
      layoutBudget: L.budget || null,
      exploded: r(L.dC ? st.off / L.dC : 0, 3),
      apart: st.off > L.G0 * 0.4,
      assembled: st.off < 0.01 && st.inTray.every(v => !v) && st.rise.every(v => v === 0),
      tracerOn,
      card: P2(st.cardPt(st.cc)),
      plate: P2(st.platePt(st.pc)),
      lupa: P2(lp.c),
      lupaOnFocusBolt: lp.go >= 1 && lp.ri === 0,
      lupaAtJoint: lp.atJoint,
      tracer: P2(tp),
      tracerVisible: tracerOn,
      tracerProgress: r(trE, 3),
      visitOrder: L.visits.map(v => v.id),
      visitT: L.visits.map(v => r(v.t, 3)),
      visited,
      tracerAt: visited.length ? visited[visited.length - 1] : null,
      focusElement: p.focusElement,
      focusScale: r(kz, 3),
      links: linkState,
      linksLanded: linkState.every(x => x.landed),
      fcWiresVisible: fcVisible,
      causalDrawn: linkState.some(x => x.kind === 'causal' && x.drawn > 0),
      arrowsOnRelations: linkState.some(x => x.kind === 'relation' && x.arrow),
      focusRow: L.focus,
      statuses: L.rows.map(rw => rw.status),
      travel: st.travel.map(v => r(v, 1)),
      seated,
      stoppedShort: short,
      boltsInTray: st.inTray,
      trayVisible: trayVis >= 1,
      keyVisible: keyP >= 1,
      wireLabels: L.finLabels.length,
      wireLabelsVisible: labP >= 1 && L.finLabels.length > 0,
    };
    L.rows.forEach((rw, i) => { if (L.bolts[i]) semantic[`tip${i}`] = P2(st.tips[i]); });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-01-mechanism',
    title: 'Fact and rule — parts diagram: attribute rows, connector bolts in a tray, rule sockets',
    titleEs: 'Hecho y regla — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Hecho y regla',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Parts diagram: the fact card and the rule plate come apart and the latch bolts that connect attribute i to condition i are laid in a labelled connector tray (with the supplied assumptions). Only the supplied relationships are drawn, edge-anchored, from each attribute row to its bolt and from each bolt to the socket with the same profile (plain relations without arrowheads); a tracer follows the supplied order while the focus element enlarges and a magnifier glides onto the focus bolt. In the gather the parts stay apart: each bolt is lifted from the tray (dashed outlines keep where it lay) to its row and runs to its supplied stop — seated, or stopping short with a question mark; a pending bolt stays in the tray — with its wire still attached. Every connection is labelled on its wire with its kind, and a key lists the joint states. No rule is said to apply.',
    tags: ['reasoning', 'fact', 'rule', 'attributes', 'alignment', 'connector', 'magnifier', 'exploded view', 'mechanism', 'relations', 'tracer', 'tray'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/hecho-y-regla.js', 'src/primitives/annotate.js', 'src/animations/causation/kits/place.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
