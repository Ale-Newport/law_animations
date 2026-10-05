/**
 * LAW-0254 — Comunicación a la contraparte · mechanism
 *
 * Storyboard (an exploded "comb": the notification ROUTE — a wall track with its supplied stops — runs across the
 * top; under it hang, left to right, Party A with the out-tray, the case file, the calendar of the legs' dates, and
 * the in-tray with Party B; every connector to the route meets the track straight below or above its own point, so
 * no line crosses a component):
 *  0.00–0.18  separate: the components start gathered and move apart to their places; name chips appear.
 *  0.18–0.43  only the supplied relationships are drawn, one by one, edge to edge, in their kind's style (plain
 *             relation: ink line; communication: accent line; sequence: solid start, hollow end — the order is only
 *             the configured one) and labelled beside their own connector. No arrowheads; a causal mark only when a
 *             relationship is supplied as causal.
 *  0.43–0.75  a tracer follows the supplied traversal order along the relationships and along the track; the focus
 *             element (the route by default) enlarges while the tracer is on it; each stop's lamp lights (neutral) as
 *             the tracer passes it and the calendar opens that leg's cell.
 *  0.75–1.00  gather: the mechanism stays visible with origin (Party A's tray), route and state: the supplied final
 *             state as a ● documented / ◆ questioned chip; for "questioned" a dashed outline (the disputed marker)
 *             around the supplied leg. Nothing states a valid method, a deadline, "deemed" service or an effect.
 * @module animations/civil-claim/LAW-0254
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, list, obj, oneOf} from '../../schemas/fields.js';
import {personBadge} from '../../primitives/badges.js';
import {
  CC_DEFAULTS, CC_STRINGS, partiesField, documentsField, stagesField, datesField, objectLabelProps,
  looksOf, legLabels, cueChip, stateCue, routeArt, routeArtV, trayPart, lineGlyph, legendRow, packRows, hit, unionBox, SIZES, pxPerUnit,
  fitG, glue, legCalendarPart, folderPart, widestWord,
  localizeDefaults, CC_COMMON_ES,
} from './kits/comunicacion-contraparte.js';

const ID = 'LAW-0254';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {explode: [0.02, 0.14], chips: [0.12, 0.18], draw: [0.19, 0.42], trace: [0.44, 0.73], focusOut: [0.745, 0.785], state: [0.78, 0.83]};
const IDS = ['partyA', 'outTray', 'file', 'route', 'calendar', 'inTray', 'partyB'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];
const FOCUS_SCALE = 1.15;

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  objectLabels: obj('Labels printed on the parts and the state chip', objectLabelProps),
  elements: list('Component labels; ids are fixed by the scene, labels are editable (a component without a label shows its default name)', obj('Component', {
    id: oneOf('Component id', IDS),
    label: str('Visible label', 60),
  }, ['id', 'label']), 2, IDS.length),
  relationships: list('Explicit relationships between components; kind sets the line style (causal only when the author supplies it); label is shown beside the line', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
    label: str('Label shown beside the line (as supplied)', 50),
  }, ['from', 'to', 'kind']), 1, 8),
  focusElement: oneOf('Component enlarged while the tracer is on it', IDS),
  relationLabels: obj('Caption of each line kind in the legend', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links', 60),
    causal: str('Caption for supplied causal links', 50),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', IDS), 2, 8),
  finalState: oneOf('State supplied for the gather beat: documented, or questioned in this configured example (no validity, deadline or effect is inferred)', ['documented', 'questioned']),
  questionedLeg: int('Zero-based leg that is questioned (only drawn when the final state is "questioned")', 0, 3),
};

const defaultParams = {
  parties: CC_DEFAULTS.parties,
  documents: CC_DEFAULTS.documents,
  stages: CC_DEFAULTS.stages,
  dates: CC_DEFAULTS.dates,
  objectLabels: CC_DEFAULTS.labels,
  elements: [
    {id: 'file', label: 'The case file'},
    {id: 'calendar', label: 'Calendar of the legs'},
  ],
  relationships: [
    {from: 'partyA', to: 'outTray', kind: 'relation', label: 'places the file'},
    {from: 'outTray', to: 'route', kind: 'sequence'},
    {from: 'file', to: 'route', kind: 'relation', label: 'travels along it'},
    {from: 'calendar', to: 'route', kind: 'relation', label: 'a date per leg'},
    {from: 'route', to: 'inTray', kind: 'sequence'},
    {from: 'inTray', to: 'partyB', kind: 'relation', label: 'in Party B’s tray'},
  ],
  focusElement: 'route',
  relationLabels: {relation: 'Relation (plain line)', communication: 'Communication (blue line)', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['partyA', 'outTray', 'route', 'inTray', 'partyB'],
  finalState: 'documented',
  questionedLeg: 2,
};

const ctr = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
const scaleBox = (b, s) => ({x: b.x + b.w / 2 - (b.w * s) / 2, y: b.y + b.h / 2 - (b.h * s) / 2, w: b.w * s, h: b.h * s});
function exitPoint(a, q) {
  const c = ctr(a);
  const dx = q.x - c.x, dy = q.y - c.y;
  const tx = dx ? (a.w / 2) / Math.abs(dx) : Infinity, ty = dy ? (a.h / 2) / Math.abs(dy) : Infinity;
  const t = Math.min(tx, ty, 1);
  return {x: c.x + dx * t, y: c.y + dy * t};
}

/** Spanish defaults: with locale es, every field still at its English default is shown in Spanish. */
const DEFAULTS_ES = {...CC_COMMON_ES,
  elements: [{id: 'file', label: 'El expediente'}, {id: 'calendar', label: 'Calendario de los tramos'}],
  relationships: [
    {from: 'partyA', to: 'outTray', kind: 'relation', label: 'deja el expediente'},
    {from: 'outTray', to: 'route', kind: 'sequence'},
    {from: 'file', to: 'route', kind: 'relation', label: 'la recorre'},
    {from: 'calendar', to: 'route', kind: 'relation', label: 'una fecha por tramo'},
    {from: 'route', to: 'inTray', kind: 'sequence'},
    {from: 'inTray', to: 'partyB', kind: 'relation', label: 'en la bandeja de B'},
  ],
  relationLabels: {relation: 'Relación (línea simple)', communication: 'Comunicación (línea azul)', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal (según lo aportado)'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    let pick = null, best = null;
    const log = [];
    // (every part is sized from the text size: larger sizes than the story's are tried too, so the diagram fills the frame)
    for (const T0 of [27, 25.2, 23.4, ...SIZES.filter(v => v >= 19.8 - 1e-6 || [18.9, 17.1, 16.6].includes(v))]) {
      for (const cols of [9, 3, 2]) for (const panel of ctx.view.shape === 'portrait' ? ['band'] : ['column', 'band']) for (const side of ctx.view.shape === 'landscape' ? ['side', 'below'] : ctx.view.shape === 'portrait' ? ['vert', 'grid', 'below'] : ['grid', 'below', 'side']) for (const spread of ctx.view.shape === 'portrait' && T0 >= 19.8 - 1e-6 ? [1, 1.6, 2.2, 3, 4] : [1]) {
        let L = compose(ctx, T0, {cols, panel, side, spread});
        // (when the enlarged diagram leaves a chip or label without a place, it is tried at scale 1)
        if (L.problems.length && L.k > 1 + 1e-6 && !L.problems.some(q => q.startsWith('no-fit'))) {
          const L1 = compose(ctx, T0, {cols, panel, side, spread, noGrow: true});
          if (L1.problems.length < L.problems.length) L = L1;
        }
        log.push(`${T0}/${L.arrangement}:${L.problems.join('+')}`);
        L.log = log;
        const sc = L.problems.length * 100 - L.k * 10 - T0;
        if (!best || sc < best.sc) best = {L, sc};
        // (among clean layouts with text >= 19.8 px: the fuller frame, then the larger people)
        const val = q => q.fill * 300 + q.headPx;
        if (!L.problems.length && (!pick || (T0 >= 19.8 - 1e-6 && val(L) > val(pick) + 0.5) || (pick.T < 19.8 - 1e-6 && T0 > pick.T))) pick = L;
      }
      if (pick && T0 < 19.8 + 1e-6) break;
    }
    return pick || best.L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({name: 'plan', transform: `${T(L.ox, L.oy)} scale(${r(L.k, 5)})`},
        L.rels.map((rl, i) => g({name: `rel${i}`},
          h('path', {name: `rel${i}-line`, 'data-from': rl.from, 'data-to': rl.to, d: 'M0 0L1 0', fill: 'none', stroke: rl.color, 'stroke-width': r(4 / 1, 2), 'stroke-linecap': 'round', 'stroke-dasharray': '1 1', 'stroke-dashoffset': 0, 'data-draw': 1, 'vector-effect': 'non-scaling-stroke'}),
          h('circle', {name: `rel${i}-a`, r: r(7 / L.k, 2), fill: rl.color, stroke: rl.color, 'stroke-width': 3, opacity: 0, 'vector-effect': 'non-scaling-stroke'}),
          h('circle', {name: `rel${i}-b`, r: r(7 / L.k, 2), fill: rl.kind === 'sequence' ? th.card : rl.color, stroke: rl.color, 'stroke-width': 3, opacity: 0, 'vector-effect': 'non-scaling-stroke'}),
          rl.kind === 'causal' ? h('path', {name: `rel${i}-mark`, d: `M${r(-12 / L.k)} ${r(-10 / L.k)}L${r(4 / L.k)} 0L${r(-12 / L.k)} ${r(10 / L.k)}`, fill: 'none', stroke: rl.color, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0, 'vector-effect': 'non-scaling-stroke'}) : null)),
        IDS.map(id => g({name: `cmp-${id}`, transform: T(0, 0)}, L.parts[id].node)),
        h('circle', {name: 'tracer', r: r(11 / L.k, 2), fill: th.accent2, stroke: '#fff', 'stroke-width': 3, opacity: 0, 'vector-effect': 'non-scaling-stroke'}),
      ),
      L.chipNodes,
      L.relLabelNodes,
      L.panelNode,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const ex = ease.inOutCubic(seg(u, ...W.explode));
    // tracer and focus
    const tq = seg(u, ...W.trace);
    const s = L.tracerLen > 0 ? ease.inOutSine(tq) * L.tracerLen : 0;
    const focusIn = L.focusAt !== null ? clamp((s - L.focusAt) / 60) : 0;
    const focusS = 1 + (FOCUS_SCALE - 1) * ease.inOutCubic(focusIn) * (1 - ease.inOutCubic(seg(u, ...W.focusOut)));
    const boxes = {};
    for (const id of IDS) {
      const P0 = L.at[id], G0 = L.gathered[id];
      const ei = ease.inOutCubic(seg(u, W.explode[0] + 0.012 * G0.i, W.explode[1] - 0.012 * (IDS.length - 1 - G0.i)));
      const c = {x: lerp(G0.x, P0.x, ei), y: lerp(G0.y, P0.y, ei)};
      const sc = id === L.focus ? focusS : 1;
      const pb = L.parts[id].box; // local box around the part's origin
      nodes[`cmp-${id}`] = {transform: `${T(r(c.x, 2), r(c.y, 2))} scale(${r(sc, 4)})`};
      boxes[id] = {x: c.x + pb.x * sc, y: c.y + pb.y * sc, w: pb.w * sc, h: pb.h * sc};
    }
    // relationships: drawn one after another, edge to edge (they follow their components)
    const n = L.rels.length;
    L.rels.forEach((rl, i) => {
      const a0 = W.draw[0] + ((W.draw[1] - W.draw[0]) * i) / n, a1 = W.draw[0] + ((W.draw[1] - W.draw[0]) * (i + 0.8)) / n;
      const dp = ease.inOutSine(seg(u, a0, a1));
      const [pa, pb] = L.ends(rl, boxes);
      const len = Math.hypot(pb.x - pa.x, pb.y - pa.y);
      nodes[`rel${i}-line`] = {d: `M${r(pa.x)} ${r(pa.y)}L${r(pb.x)} ${r(pb.y)}`, 'stroke-dasharray': `${r(len + 2)} ${r(len + 2)}`, 'stroke-dashoffset': r((len + 2) * (1 - dp))};
      nodes[`rel${i}-a`] = {cx: r(pa.x), cy: r(pa.y), opacity: r(dp > 0 ? 1 : 0, 3)};
      nodes[`rel${i}-b`] = {cx: r(pb.x), cy: r(pb.y), opacity: r(dp >= 1 ? 1 : 0, 3)};
      if (rl.kind === 'causal') {
        const m = {x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2};
        nodes[`rel${i}-mark`] = {transform: T(r(m.x), r(m.y), r((Math.atan2(pb.y - pa.y, pb.x - pa.x) * 180) / Math.PI, 2)), opacity: r(dp >= 1 ? 1 : 0, 3)};
      }
      nodes[`rlab${i}`] = {opacity: r(seg(u, a1 - 0.004, a1 + 0.012), 3)};
    });
    // tracer along the traversal
    const tp = L.tracerPath(boxes, s);
    // (the tracer shows on the connectors and along the track; it is not drawn across a component's face)
    const inside = tp.on && tp.on.startsWith('in:') && tp.on !== 'in:route';
    nodes.tracer = {cx: r(tp.x), cy: r(tp.y), opacity: r(tq > 0 && tq < 1 && !inside ? 1 : 0, 3)};
    // stops' lamps and the calendar's cells as the tracer passes the stops along the track (or on a clock when the
    // traversal does not run along the route)
    const R = L.parts.route;
    // (legsF: legs completed, fractional while that leg's calendar cell unfolds)
    const legsF = L.trackAt !== null
      ? R.legX.slice(1).reduce((acc, x) => acc + clamp((s - (L.trackAt + (x - R.legX[0]))) / 40), 0)
      : seg(u, 0.5, 0.7) * (R.N + 1);
    const legsDone = Math.floor(legsF + 1e-9);
    const lampDone = i => (L.trackAt !== null ? clamp((s - (L.trackAt + R.stopXs[i])) / 20) : (legsDone > i ? 1 : 0));
    R.stops.forEach((_, i) => { nodes[`m-lamp${i}`] = {opacity: r(lampDone(i), 3)}; });
    const trail = L.trackAt !== null ? clamp(s - L.trackAt, 0, R.legX[R.legX.length - 1]) : R.legX[legsDone] ?? R.legX[R.legX.length - 1];
    nodes['m-trail'] = {'stroke-dasharray': `${r(u >= W.trace[1] ? R.legX[R.legX.length - 1] : trail, 1)} ${r(R.legX[R.legX.length - 1] + 10, 1)}`};
    Object.assign(nodes, L.parts.calendar.frame(u >= W.trace[1] ? R.N + 1 : legsF));
    // chips appear with the separation; the state (and the disputed marker when questioned) with the gather
    const chipOp = seg(u, ...W.chips);
    for (const nm of L.chipNames) nodes[nm] = {opacity: r(chipOp, 3)};
    const st = seg(u, ...W.state);
    nodes['m-qmark'] = {opacity: r(L.plan === 'questioned' ? st : 0, 3)};
    nodes['m-cue'] = {opacity: r(st, 3)};
    if (L.hasState) nodes['state-wrap'] = {opacity: r(st, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const D = q => ({x: r(L.ox + q.x * L.k, 2), y: r(L.oy + q.y * L.k, 2)});
    return {
      nodes,
      semantic: {
        beat,
        explode: r(ex, 3),
        relationsDrawn: L.rels.map((rl, i) => r(seg(u, W.draw[0] + ((W.draw[1] - W.draw[0]) * i) / n, W.draw[0] + ((W.draw[1] - W.draw[0]) * (i + 0.8)) / n), 3)),
        relationKinds: L.rels.map(rl => rl.kind),
        arrowheads: L.rels.filter(rl => rl.kind === 'causal').length,
        tracer: D(tp),
        tracerOn: tp.on,
        tracerVisible: tq > 0 && tq < 1,
        focus: L.focus,
        focusScale: r(focusS, 3),
        legsDone,
        legs: R.N + 1,
        visited: L.visitOrder,
        plan: L.plan,
        stateShown: r(st, 3),
        markerShown: r(L.plan === 'questioned' ? st : 0, 3),
        textPx: r(L.T, 1),
        partsTextPx: r(L.T * L.k, 1),
        headPx: r(L.headPx, 1),
        k: r(L.k, 3),
        arrangement: L.arrangement,
        problems: L.problems,
        log: L.log,
      },
    };
  },
};

/** Widest kept-together word of the texts at size ts (bold). */
function wordMax(texts, ts) {
  return Math.max(...texts.flatMap(t => glue(t).split(' ').filter(Boolean)).map(t => fitG(t, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width));
}

/** One composition at text size T0 (px at 1080p). */
function compose(ctx, T0, A) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const F = T0 / px;
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const shape = ctx.view.shape;
  const plan = p.finalState === 'questioned' ? 'questioned' : 'documented';
  const problems = [];
  const looks = looksOf(ctx, p);
  // ---- relationships (only between known components; a self-link is ignored)
  const rels = (p.relationships || []).filter(rl => rl.from !== rl.to && IDS.includes(rl.from) && IDS.includes(rl.to)).map(rl => ({
    ...rl,
    color: rl.kind === 'communication' ? th.accent2 : th.ink,
    // (a relationship without a supplied label draws none: its style and the legend give its kind)
    text: rl.label || null,
  }));
  const kindsUsed = KINDS.filter(kd => rels.some(rl => rl.kind === kd));
  // ---- the panel: legend of the kinds used, the state chip (gather) and the key
  const panelItems = [];
  const legendW = Math.min(D.w * (A.panel === 'column' ? 0.28 : 0.46), F * 17);
  if (showAll) for (const kd of kindsUsed) panelItems.push(legendRow(ctx, {name: `legend-${kd}`, text: p.relationLabels[kd] || kd, F, gw: F * 2.2, glyph: lineGlyph(ctx, kd, F * 2.2), maxWidth: legendW}));
  const stateChip = showKey ? cueChip(ctx, {name: 'state-chip', text: plan === 'questioned' ? p.objectLabels.questioned : p.objectLabels.documented, size: F, maxWidth: Math.min(D.w * 0.5, F * 18), maxLines: 3, cue: plan}) : null;
  const key = showKey ? cueChip(ctx, {name: 'key', text: `◦ ${ctx.t.key}`, size: F, maxWidth: Math.min(D.w * 0.5, F * 18), maxLines: 2, stroke: th.inkSoft, weight: 600}) : null;
  if (stateChip) panelItems.push({...stateChip, state: true});
  if (key) panelItems.push({...key, isKey: true});
  for (const it of panelItems) if (it.fit.truncated) problems.push('panel-trunc');
  const gap = F * 0.8;
  let region = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  let panelBox = null, packed = null;
  if (panelItems.length) {
    if (A.panel === 'column') {
      const cw = Math.max(...panelItems.map(q => q.w));
      packed = packRows(panelItems, cw, gap);
      panelBox = {x: D.w - 8 - cw, y: 8 + Math.max(0, (D.h - 16 - packed.height) / 2), w: cw, h: packed.height};
      region = {x: 8, y: 8, w: D.w - 16 - cw - 30, h: D.h - 16};
      // (column: one item per row)
      packed = {rows: panelItems.map(it => ({items: [it], w: it.w, h: it.h})), height: panelItems.reduce((a, b) => a + b.h, 0) + gap * (panelItems.length - 1)};
      panelBox.h = packed.height;
      panelBox.y = 8 + Math.max(0, (D.h - 16 - packed.height) / 2);
    } else {
      packed = packRows(panelItems, D.w - 16, gap);
      panelBox = {x: 8, y: D.h - 8 - packed.height, w: D.w - 16, h: packed.height};
      region = {x: 8, y: 8, w: D.w - 16, h: D.h - 16 - packed.height - 24};
    }
    if (panelBox.h > D.h - 16) problems.push('panel-height');
  }
  // ---- parts (template units); the text on them is sized for the scale k found below (two passes)
  const label = id => ((p.elements || []).find(e => e.id === id) || {}).label;
  // (the calendar's name chip carries its supplied title when no element label is given: the header bar has none here)
  const defaults = {partyA: `${p.parties[0].name} · ${p.parties[0].role}`, partyB: `${p.parties[1].name} · ${p.parties[1].role}`, outTray: null, inTray: null, file: `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`, route: null, calendar: p.objectLabels.calendar};
  const nameOf = id => label(id) || defaults[id];
  let k = 1, parts = null, E = null, PLc = null;
  // the parts' text is sized for the scale k, and the scale depends on the parts' size: the largest k whose build
  // still fits the region (bisection)
  const buildAt = k => {
    const ts = F / k;
    const problems = [];
    let parts, E, PLc;
    // (a badge shows head and shoulders: its shoulders, ~1.44 R across, keep >= ~80 px and the badge >= 112 px)
    const Rbadge = Math.max(48.5 / (k * px), ts * 2.4);
    // (a tray is never narrower than its label's widest word plus the plate's margins: no word is split)
    const trayW = showAll ? Math.max(ts * 7, widestWord(p.objectLabels.outTray, ts) + ts * 2.9, widestWord(p.objectLabels.inTray, ts) + ts * 2.9) : ts * 7;
    const outTray = trayPart(ctx, {P: 'm-ta', w: trayW, ts, label: p.objectLabels.outTray, showText: showAll, plateAlign: 'end'});
    const inTray = trayPart(ctx, {P: 'm-tb', w: trayW, ts, label: p.objectLabels.inTray, showText: showAll});
    const cal = legCalendarPart(ctx, {P: 'm-cal', w: Math.max(Math.max(ts * 5.2, wordMax(legLabels(p), ts) + ts * 1.1) * Math.min(A.cols, p.stages.length + 1), ts * 9), cols: A.cols, days: legLabels(p), title: p.objectLabels.calendar, ts, showText: showAll, noTitle: true});
    const file = folderPart(ctx, {P: 'm-cf', w: ts * 3.8});
    const bA = personBadge(ctx, {name: 'm-pa-badge', x: 0, y: 0, radius: Rbadge, look: looks.a});
    const bB = personBadge(ctx, {name: 'm-pb-badge', x: 0, y: 0, radius: Rbadge, look: looks.b});
    // ---- places (template units): the parts hang in a row under the route — out-tray, file, calendar, in-tray —
    // and the parties stand beside their trays (side) or under them (below); the route runs from tray to tray
    const G = ts * 2 * (A.spread || 1);
    const pos = {};
    let route, len;
    if (A.side === 'grid') {
      // (square frames: two rows under the route — the trays at its two ends; below them the parties at the ends and,
      // between them, the file and the calendar, whose connectors rise between the trays to the track)
      const R2 = Rbadge;
      const colA = Math.max(R2 * 2, outTray.box.w), colB = Math.max(R2 * 2, inTray.box.w);
      const G2 = G * 0.8;
      let x = colA / 2;
      pos.partyA = {x, y: 0};
      // (room beside the parties' connectors for their labels)
      const lblRoom = t => (t ? Math.min(ts * 7, fitG(t, {maxWidth: ts * 6, size: ts, minSize: ts, maxLines: 3, weight: 600}).width + ts) : 0);
      const relTo = (a2, b2) => (p.relationships || []).find(q => (q.from === a2 && q.to === b2) || (q.from === b2 && q.to === a2));
      const roomA = Math.max(0, lblRoom((relTo('partyA', 'outTray') || {}).label) - colA / 2 + ts * 0.8);
      const roomB = Math.max(0, lblRoom((relTo('partyB', 'inTray') || {}).label) - colB / 2 + ts * 0.8);
      x += colA / 2 + Math.max(G2, roomA);
      pos.file = {x: x - file.box.x, y: 0};
      x += file.box.w + G2;
      pos.calendar = {x: x - cal.box.x, y: 0};
      x += cal.box.w + Math.max(G2, roomB);
      pos.partyB = {x: x + colB / 2, y: 0};
      const row2H = Math.max(2 * R2, file.box.h, cal.box.h);
      const trayH = Math.max(outTray.box.h, inTray.box.h);
      const row1Y = -row2H / 2 - G - trayH / 2 - ts * 1.2;
      // (the parties sit at the bottom of the row: their connectors to the trays leave room for a label)
      pos.partyA.y = row2H / 2 - R2;
      pos.partyB.y = row2H / 2 - R2;
      pos.outTray = {x: pos.partyA.x, y: row1Y - (outTray.box.y + outTray.box.h / 2)};
      pos.inTray = {x: pos.partyB.x, y: row1Y - (inTray.box.y + inTray.box.h / 2)};
      // (the file and the calendar hang at the row's top: their connectors are the shortest)
      pos.file.y = -row2H / 2 + file.box.h / 2 - file.box.y - file.box.h / 2;
      pos.calendar.y = -row2H / 2 - cal.box.y;
      len = pos.inTray.x - pos.outTray.x;
      route = routeArt(ctx, {P: 'm', len, ts, stages: p.stages, showText: showAll});
      pos.route = {x: pos.outTray.x + len / 2, y: row1Y - trayH / 2 - ts * 3.4};
    } else if (A.side === 'vert') {
      // (tall frames: the route runs down the left; the parts hang to its right in a column — out-tray, file,
      // calendar, in-tray — and each party stands to the right of its tray)
      const col = [['outTray', outTray.box], ['file', file.box], ['calendar', cal.box], ['inTray', inTray.box]];
      const colW = Math.max(...col.map(([, b]) => b.w));
      const colX = ts * 7 + colW / 2;
      let cy = 0;
      col.forEach(([id, b], i) => { if (i) cy += G; pos[id] = {x: colX - (b.x + b.w / 2), y: cy - b.y}; cy += b.h; });
      len = (pos.inTray.y + inTray.box.y + inTray.box.h / 2) - (pos.outTray.y + outTray.box.y + outTray.box.h / 2);
      route = routeArtV(ctx, {P: 'm', len, ts, stages: p.stages, showText: showAll, plateW: ts * 6});
      pos.route = {x: 0, y: pos.outTray.y + outTray.box.y + outTray.box.h / 2 + len / 2};
      pos.partyA = {x: colX + colW / 2 + G + Rbadge, y: pos.outTray.y + outTray.box.y + outTray.box.h / 2};
      pos.partyB = {x: colX + colW / 2 + G + Rbadge, y: pos.inTray.y + inTray.box.y + inTray.box.h / 2};
    } else {
      // the parts hang in a row under the route — out-tray, file, calendar, in-tray — and the parties stand beside
      // their trays (side) or under them (below); the route runs from tray to tray
      const row = [['outTray', outTray.box], ['file', file.box], ['calendar', cal.box], ['inTray', inTray.box]];
      let cx = 0;
      const rowH = Math.max(...row.map(([, b]) => b.h));
      row.forEach(([id, b], i) => { if (i) cx += G; pos[id] = {x: cx - b.x, y: -(b.y + b.h / 2)}; cx += b.w; });
      const routeY = -rowH / 2 - ts * 5.5;
      len = pos.inTray.x - pos.outTray.x;
      route = routeArt(ctx, {P: 'm', len, ts, stages: p.stages, showText: showAll});
      pos.route = {x: pos.outTray.x + len / 2, y: routeY};
      if (A.side === 'side') {
        pos.partyA = {x: pos.outTray.x + outTray.box.x - G - Rbadge, y: 0};
        pos.partyB = {x: pos.inTray.x + inTray.box.x + inTray.box.w + G + Rbadge, y: 0};
      } else {
        const py = rowH / 2 + G + Rbadge + ts * 1.5;
        pos.partyA = {x: pos.outTray.x, y: py};
        pos.partyB = {x: pos.inTray.x, y: py};
      }
    }
    PLc = pos;
    parts = {
      route: route.vertical
        ? {node: g({transform: T(0, -len / 2)}, route.node, qMarker(ctx, route, plan, p.questionedLeg)), box: {...route.box, y: route.box.y - len / 2}, route, off: {x: 0, y: -len / 2}, marks: qMarker.last}
        : {node: g({transform: T(-len / 2, 0)}, route.node, qMarker(ctx, route, plan, p.questionedLeg)), box: {...route.box, x: route.box.x - len / 2}, route, off: {x: -len / 2, y: 0}, marks: qMarker.last},
      outTray: {node: outTray.node, box: outTray.box, part: outTray},
      inTray: {node: inTray.node, box: inTray.box, part: inTray},
      calendar: {node: cal.node, box: cal.box, frame: cal.frame, part: cal},
      file: {node: file.node, box: file.box},
      partyA: {node: bA.node, box: {x: -Rbadge, y: -Rbadge, w: 2 * Rbadge, h: 2 * Rbadge}, R: Rbadge},
      partyB: {node: bB.node, box: {x: -Rbadge, y: -Rbadge, w: 2 * Rbadge, h: 2 * Rbadge}, R: Rbadge},
    };
    parts.route.legX = route.legX; parts.route.stopXs = route.stopXs; parts.route.stops = route.stops; parts.route.N = route.N;
    parts.calendar.frame = legsDone => cal.frame(legsDone);
    for (const q of [route, outTray, inTray, cal]) problems.push(...q.problems.filter(x => !problems.includes(x)));
    // extents (the focus enlarged) plus a margin for the name chips
    const at0 = PLc;
    const boxesT = IDS.map(id => { const b = parts[id].box, c = at0[id]; const bb = {x: c.x + b.x, y: c.y + b.y, w: b.w, h: b.h}; return id === (p.focusElement || 'route') ? scaleBox(bb, FOCUS_SCALE) : bb; });
    const ub = unionBox(boxesT);
    const mg = showKey ? ts * 3.2 : 16;
    // (a top margin only when the route carries a name chip, which stands above it)
    const topM = nameOf('route') ? mg * 0.6 : mg * 0.05;
    E = {x: ub.x - mg * 0.25, y: ub.y - topM, w: ub.w + mg * 0.5, h: ub.h + topM + mg * 0.65};
    return {parts, E, PLc, problems, fitK: Math.min(region.w / E.w, region.h / E.h, 1.6)};
  };
  // (every part is sized from the text size, so the diagram is drawn at scale 1 in design units: it fits or it does not,
  // and the size search over T picks the largest text that fits)
  k = 1;
  const B0 = buildAt(k);
  ({parts, E, PLc} = B0);
  for (const q of B0.problems) if (!problems.includes(q)) problems.push(q);
  if (B0.fitK < 1 - 1e-6) problems.push(`no-fit:${(B0.E.w * k / region.w).toFixed(2)}x${(B0.E.h * k / region.h).toFixed(2)}`);
  // (with room to spare the diagram is drawn larger: up to 1.2 × with labels shown — the text printed on the parts then
  // runs a little larger than the chips' — and up to 2 × with the labels hidden)
  else if (!A.noGrow) k = Math.min(B0.fitK, showAll ? 1.2 : 2);
  const at = PLc;
  const ox = region.x + (region.w - E.w * k) / 2 - E.x * k;
  const oy = region.y + (region.h - E.h * k) / 2 - E.y * k;
  const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
  const boxD = b => ({x: ox + b.x * k, y: oy + b.y * k, w: b.w * k, h: b.h * k});
  // (people: the badge's diameter at 1080p; its head circle is 0.6 of it)
  const headPx = parts.partyA.R * 2 * k * px;
  if (headPx < 96) problems.push('small-people');
  // the gathered start positions: 45 % of the way to the centre of the extents
  const cE = ctr(E);
  // (separate: each part settles into its own place from just above it, one after another — never scaled, so its text
  // keeps its size, and never stacked over another part)
  const gathered = Object.fromEntries(IDS.map((id, i) => [id, {x: at[id].x, y: at[id].y - F * 0.9, i}]));
  const focus = p.focusElement || 'route';
  const boxT = id => { const b = parts[id].box, c = at[id]; return {x: c.x + b.x, y: c.y + b.y, w: b.w, h: b.h}; };
  const bigT = id => (id === focus ? scaleBox(boxT(id), FOCUS_SCALE) : boxT(id));
  // connector ends: to the route, straight down (or up) onto the track at the other part's x; else edge to edge
  const ends = (rl, boxes) => {
    const trackY = b => b.y + b.h - (24 * (b.h / parts.route.box.h));
    const one = (a, bId, bx) => {
      if (bId === 'route') {
        const rb = bx.route;
        const other = bx[a];
        const sc = rb.w / parts.route.box.w;
        if (parts.route.route.vertical) {
          // (the track runs down the page: a connector meets it level with the other part's centre)
          let y = clamp(ctr(other).y, rb.y + 14 * sc, rb.y + rb.h - 14 * sc);
          // (a connector meets the track clear of the stops' boxes and plates)
          const top0 = rb.y + 14 * sc;
          for (const sy of parts.route.route.stopXs.map(v => top0 + v * sc)) {
            const hw = 44 * sc;
            if (Math.abs(y - sy) < hw) { const up = sy - hw, dn = sy + hw; y = (Math.abs(up - ctr(other).y) <= Math.abs(dn - ctr(other).y) && up > other.y + 6) || dn > other.y + other.h - 6 ? up : dn; }
          }
          return [{x: other.x, y}, {x: rb.x + rb.w - 30 * sc, y}];
        }
        const x = clamp(ctr(other).x, rb.x + 14 * sc, rb.x + rb.w - 14 * sc);
        return [{x, y: other.y}, {x, y: trackY(rb)}];
      }
      return null;
    };
    if (rl.to === 'route') return one(rl.from, 'route', boxes) || [];
    if (rl.from === 'route') { const e = one(rl.to, 'route', boxes); return [e[1], e[0]]; }
    const A2 = boxes[rl.from], B2 = boxes[rl.to];
    return [exitPoint(A2, ctr(B2)), exitPoint(B2, ctr(A2))];
  };
  const boxesT0 = Object.fromEntries(IDS.map(id => [id, boxT(id)]));
  const boxesBig = Object.fromEntries(IDS.map(id => [id, bigT(id)]));
  const segs = rels.map(rl => ends(rl, boxesT0).map(toD));
  const segsBig = rels.map(rl => ends(rl, boxesBig).map(toD));
  segsBig.forEach(([a, b]) => { if (Math.hypot(b.x - a.x, b.y - a.y) < 30) problems.push('short-connector'); });
  // no line passes through a component other than its two ends
  rels.forEach((rl, i) => {
    const [a, b] = segsBig[i];
    for (const id of IDS) {
      if (id === rl.from || id === rl.to) continue;
      const q = boxD(bigT(id));
      for (let j = 1; j < 40; j++) { const x = a.x + (b.x - a.x) * j / 40, y = a.y + (b.y - a.y) * j / 40; if (x > q.x + 2 && x < q.x + q.w - 2 && y > q.y + 2 && y < q.y + q.h - 2) { problems.push(`line-through-${id}`); break; } }
    }
  });
  const hard = IDS.map(id => boxD(bigT(id)));
  // (the disputed marker and the state cue drawn on the route keep clear of labels and chips too)
  for (const mb of [parts.route.marks.mark, parts.route.marks.cue].filter(Boolean)) {
    const c0 = at.route, o0 = parts.route.off;
    hard.push(boxD({x: c0.x + o0.x + mb.x, y: c0.y + o0.y + mb.y, w: mb.w, h: mb.h}));
  }
  const texts = [];
  const inDesign = b => b.x >= 2 && b.y >= 2 && b.x + b.w <= D.w - 2 && b.y + b.h <= D.h - 2;
  const segDist = (bx, sg) => { let m = Infinity; const [a, b] = sg; for (let j = 0; j <= 40; j++) { const q = {x: a.x + (b.x - a.x) * j / 40, y: a.y + (b.y - a.y) * j / 40}; m = Math.min(m, Math.hypot(Math.max(bx.x - q.x, 0, q.x - bx.x - bx.w), Math.max(bx.y - q.y, 0, q.y - bx.y - bx.h))); } return m; };
  const segHits = (bx, pad = 4) => segsBig.some(([a, b]) => { for (let j = 0; j <= 30; j++) { const q = {x: a.x + (b.x - a.x) * j / 30, y: a.y + (b.y - a.y) * j / 30}; if (q.x > bx.x - pad && q.x < bx.x + bx.w + pad && q.y > bx.y - pad && q.y < bx.y + bx.h + pad) return true; } return false; });
  const panelBoxes = [];
  // ---- relationship labels: beside their own line (<= 20 design units from it), nearer it than any other line
  const relLabelNodes = [];
  rels.forEach((rl, i) => {
    const [a, b] = segs[i];
    const [ab, bb] = segsBig[i];
    if (!showKey || !rl.text) { relLabelNodes.push(g({name: `rlab${i}`, opacity: 0})); return; }
    const lenB = Math.hypot(bb.x - ab.x, bb.y - ab.y) || 1;
    const horiz = Math.abs(bb.x - ab.x) / lenB;
    const mw0 = horiz > 0.7 ? Math.max(F * 4.5, Math.min(F * 11, lenB * 0.86 - F * 0.9)) : Math.min(F * 11, D.w * 0.3);
    const pad = F * 0.35;
    const dx = b.x - a.x, dy = b.y - a.y, L0 = Math.hypot(dx, dy) || 1;
    const nx = -dy / L0, ny = dx / L0;
    let best = null, fit = null, w = 0, hh = 0;
    const sides = Math.abs(nx) < Math.abs(ny) ? (ny < 0 ? [1, -1] : [-1, 1]) : (nx > 0 ? [1, -1] : [-1, 1]);
    let anyFit = false;
    const why = {};
    const no = kk => { why[kk] = (why[kk] || 0) + 1; };
    for (const mw of [mw0, mw0 * 0.7, mw0 * 0.52, Math.min(F * 14, D.w * 0.4)]) {
      fit = fitG(rl.text, {maxWidth: Math.max(F * 4.5, mw), size: F, minSize: F, maxLines: 4, weight: 600});
      if (fit.truncated) continue;
      anyFit = true;
      w = fit.width + 2 * pad; hh = fit.height + 2 * pad * 0.7;
      for (const t of [0.5, 0.4, 0.6, 0.3, 0.7]) for (const side of sides) for (const gp of [8, 14]) {
        const m = {x: lerp(ab.x, bb.x, t), y: lerp(ab.y, bb.y, t)};
        const cx = m.x + side * nx * (gp + Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2);
        const cy = m.y + side * ny * (gp + Math.abs(nx) * w / 2 + Math.abs(ny) * hh / 2);
        const bx = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
        if (!inDesign(bx)) { no('frame'); continue; }
        if (hard.some(q => hit(q, bx, 4))) { no('hard'); continue; }
        if (texts.some(q => hit(q, bx, 6))) { no('text'); continue; }
        if (panelBox && hit(panelBox, bx, 6)) { no('panel'); continue; }
        // (beside its own connector both at rest and with the focus enlarged, nearer it than any other connector)
        const own = Math.max(segDist(bx, [ab, bb]), segDist(bx, [a, b]));
        const other = Math.min(Infinity, ...segsBig.filter((_, j) => j !== i).map(sg => segDist(bx, sg)), ...segs.filter((_, j) => j !== i).map(sg => segDist(bx, sg)));
        if (own > 20 || other <= own + 6) { no('dist'); continue; }
        best = {bx}; break;
      }
      if (best) break;
    }
    if (!anyFit) problems.push('rel-label-trunc');
    if (!best) { problems.push(`rel-label-${i}:${Object.entries(why).map(([a2, b2]) => a2 + b2).join('.')}`); best = {bx: {x: (a.x + b.x) / 2 - w / 2, y: (a.y + b.y) / 2 - hh / 2, w, h: hh}}; }
    const {bx} = best;
    texts.push(bx);
    relLabelNodes.push(g({name: `rlab${i}`, opacity: 0},
      h('path', {name: `rlab${i}-card`, d: roundRectPath(bx.x, bx.y, w, hh, Math.min(hh / 2, F * 0.5)), fill: th.card, stroke: rl.color, 'stroke-width': 2}),
      g({name: `rlab${i}-t`}, fitNode(fit, bx.x + pad, bx.y + (hh - fit.height) / 2, th.ink, `rlab${i}-text`))));
  });
  // ---- component name chips (near their component, clear of every component, line, label and the panel)
  const chipNames = [], chipNodes = [];
  if (showKey) {
    const free = bx => inDesign(bx) && !hard.some(q => hit(q, bx, 4)) && !texts.some(q => hit(q, bx, 8)) && !(panelBox && hit(panelBox, bx, 6)) && !segHits(bx, 6);
    const atSide = (pt, side, gp, f, c) => (side === 'above' ? {x: pt.x + pt.w / 2 - c.w / 2 + f * (pt.w / 2 + c.w / 2), y: pt.y - gp - c.h, w: c.w, h: c.h}
      : side === 'below' ? {x: pt.x + pt.w / 2 - c.w / 2 + f * (pt.w / 2 + c.w / 2), y: pt.y + pt.h + gp, w: c.w, h: c.h}
        : side === 'right' ? {x: pt.x + pt.w + gp, y: pt.y + pt.h / 2 - c.h / 2 + f * (pt.h / 2 + c.h / 2), w: c.w, h: c.h}
          : {x: pt.x - gp - c.w, y: pt.y + pt.h / 2 - c.h / 2 + f * (pt.h / 2 + c.h / 2), w: c.w, h: c.h});
    for (const id of ['partyA', 'partyB', 'route', 'file', 'calendar', 'outTray', 'inTray']) {
      const text = nameOf(id);
      if (!text || !showAll) continue;
      const part = boxD(bigT(id));
      const order = id === 'route' ? ['above', 'below', 'left', 'right'] : id.startsWith('party') ? ['below', 'above', id === 'partyA' ? 'left' : 'right'] : ['below', 'right', 'left', 'above'];
      let best = null;
      for (const mw of [Math.min(D.w * 0.3, F * 13), F * 10, F * 7.5]) {
        const c = cueChip(ctx, {name: `chip-${id}-chip`, text, size: F, maxWidth: mw, maxLines: 4, stroke: th.ink});
        if (c.fit.truncated) continue;
        for (const side of order) {
          for (const gp of [6, 12, 22, 34]) {
            for (const f of [0, -0.25, 0.25, -0.5, 0.5, -0.75, 0.75]) {
              const bx = atSide(part, side, gp, f, c);
              if (free(bx)) { best = {bx, c}; break; }
            }
            if (best) break;
          }
          if (best) break;
        }
        if (best) break;
      }
      if (!best) { problems.push(`chip-place-${id}`); const c = cueChip(ctx, {name: `chip-${id}-chip`, text, size: F, maxWidth: F * 13, maxLines: 4}); best = {bx: {x: part.x, y: part.y - c.h - 6, w: c.w, h: c.h}, c}; }
      texts.push(best.bx);
      const nm = `chip-${id}`;
      chipNames.push(nm);
      chipNodes.push(g({name: nm, opacity: 0}, leader(best.bx, part, th.inkSoft), best.c.node(best.bx.x, best.bx.y)));
    }
  }
  // ---- the panel's nodes
  let panelNode = null;
  if (packed) {
    const nodesP = [];
    let y = panelBox.y;
    for (const row of packed.rows) {
      let x = panelBox.x + (A.panel === 'column' ? 0 : (panelBox.w - row.w) / 2);
      for (const it of row.items) {
        const b = {x, y: y + (row.h - it.h) / 2, w: it.w, h: it.h};
        panelBoxes.push(b);
        nodesP.push(it.state ? g({name: 'state-wrap', opacity: 0}, it.node(b.x, b.y)) : it.node(b.x, b.y));
        x += it.w + gap;
      }
      y += row.h + gap;
    }
    panelNode = g({name: 'panel'}, nodesP);
    if (panelBoxes.some(b => hard.some(q => hit(q, b, 2)))) problems.push('panel-on-plan');
  }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (hit(texts[i], texts[j], 2)) { problems.push('overlap'); i = texts.length; break; }
  // ---- traversal: along the relationships between consecutive components (edge to edge), and along the track
  // between the route's entry and exit points
  const order = (p.traversalOrder || []).filter(id => IDS.includes(id));
  const steps = [];
  for (let i = 0; i + 1 < order.length; i++) steps.push([order[i], order[i + 1]]);
  const pathAt = boxes => {
    const pts = [];
    steps.forEach(([a, b]) => {
      const rl = rels.find(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
      let e = rl ? ends(rl, boxes) : [exitPoint(boxes[a], ctr(boxes[b])), exitPoint(boxes[b], ctr(boxes[a]))];
      if (rl && rl.from === b) e = [e[1], e[0]];
      pts.push(e[0], e[1]);
    });
    return pts;
  };
  const restPts = pathAt(boxesT0);
  const cum = [0];
  for (let i = 1; i < restPts.length; i++) cum.push(cum[i - 1] + Math.hypot(restPts[i].x - restPts[i - 1].x, restPts[i].y - restPts[i - 1].y));
  const tracerLen = cum[cum.length - 1] || 0;
  const arrival = id => { const j = steps.findIndex(([, b]) => b === id); if (j >= 0) return cum[2 * j + 1]; const j0 = steps.findIndex(([a]) => a === id); return j0 >= 0 ? cum[2 * j0] : null; };
  // (the arc position where the tracer enters the track at its left end, when it runs along it)
  const ri = steps.findIndex(([a, b]) => b === 'route') ;
  const vert = Boolean(parts.route.route.vertical);
  const trackStart = vert ? at.route.y + parts.route.box.y + 14 : at.route.x + parts.route.box.x + 14;
  const trackAt = ri >= 0 && steps[ri + 1] && steps[ri + 1][0] === 'route' ? cum[2 * ri + 1] - ((vert ? restPts[2 * ri + 1].y : restPts[2 * ri + 1].x) - trackStart) : null;
  const tracerPath = (boxes, s) => {
    const pts = pathAt(boxes);
    if (pts.length < 2) return {x: 0, y: 0, on: null};
    let acc = 0;
    for (let j = 0; j < pts.length - 1; j++) {
      const l = Math.hypot(pts[j + 1].x - pts[j].x, pts[j + 1].y - pts[j].y);
      const l0 = cum[j + 1] - cum[j];
      if (s <= cum[j + 1] + 1e-9 || j === pts.length - 2) {
        const t = l0 ? clamp((s - cum[j]) / l0) : 0;
        const on = j % 2 === 0 ? `${steps[j / 2][0]}>${steps[j / 2][1]}` : `in:${steps[(j - 1) / 2][1]}`;
        return {x: lerp(pts[j].x, pts[j + 1].x, t), y: lerp(pts[j].y, pts[j + 1].y, t), on};
      }
      acc += l;
    }
    return {x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, on: null};
  };
  const ext = unionBox([...hard, ...texts, ...panelBoxes]);
  const fill = Math.min(ext.w / D.w, ext.h / D.h);
  return {
    T: T0, F, px, k, ox, oy, parts, at, gathered, rels, ends, relLabelNodes, chipNodes, chipNames, focus,
    tracerLen, tracerPath, focusAt: arrival(focus), trackAt, visitOrder: order,
    panelNode, hasState: Boolean(stateChip), plan,
    headPx, problems, fill, arrangement: `${A.panel}/${A.side}/c${A.cols}/s${A.spread || 1}/k${r(k, 3)}`,
  };
}

/** The disputed marker (questioned plan): a dashed outline around the supplied leg of the route, and the state cue. */
function qMarker(ctx, route, plan, qLeg) {
  const th = ctx.theme;
  const i = clamp(Math.round(qLeg ?? route.N), 0, route.N);
  const b = route.legBox(i);
  const cueAt = plan === 'questioned' ? {x: b.x + b.w, y: b.y - 6} : route.vertical ? {x: 40, y: route.legX[route.legX.length - 1] + 36} : {x: route.legX[route.legX.length - 1] + 30, y: -40};
  const R = 22;
  qMarker.last = {mark: plan === 'questioned' ? {x: b.x - 4, y: b.y - 4, w: b.w + 8, h: b.h + 8} : null, cue: {x: cueAt.x - R - 4, y: cueAt.y - R - 4, w: 2 * R + 8, h: 2 * R + 8}};
  return g(null,
    g({name: 'm-qmark', opacity: 0, 'data-disputed': 1}, h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 16), fill: 'none', stroke: th.inkSoft, 'stroke-width': 3.2, 'stroke-dasharray': '12 9', 'stroke-linecap': 'round'})),
    g({name: 'm-cue', opacity: 0},
      h('circle', {cx: r(cueAt.x), cy: r(cueAt.y), r: R, fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
      g({transform: T(cueAt.x, cueAt.y)}, stateCue(ctx, plan, R * 1.1, {name: 'm-cue-mark'}))));
}

function fitNode(fit, x, y, fill, name) {
  return h('text', {name, x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i ? r(fit.lineHeight, 2) : 0}, ln)));
}

/** A thin leader from a chip to the nearest point of its component. */
function leader(box, part, col) {
  const cx = Math.max(part.x, Math.min(box.x + box.w / 2, part.x + part.w)), cy = Math.max(part.y, Math.min(box.y + box.h / 2, part.y + part.h));
  const ex = Math.max(box.x, Math.min(cx, box.x + box.w)), ey = Math.max(box.y, Math.min(cy, box.y + box.h));
  if (Math.hypot(cx - ex, cy - ey) < 3) return null;
  return h('line', {x1: r(ex), y1: r(ey), x2: r(cx), y2: r(cy), stroke: col, 'stroke-width': 2, 'stroke-linecap': 'round'});
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-04-mechanism',
    title: 'Communication to the other party — the parts of a supplied notification route and how they relate',
    titleEs: 'Comunicación a la contraparte — Mecanismo o relación explicada',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Comunicación a la contraparte',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The communication is taken apart into its parts — Party A and her out-tray, the case file, the supplied route with its stops, the calendar of the legs’ dates, the in-tray and Party B — joined only by the supplied relationships (plain relations; the route’s legs as a sequence as configured, never arrows). A tracer follows the configured order; each stop lights and each leg’s date opens as it passes. The gather shows the supplied state: documented (●) or questioned in this example (◆, with a dashed disputed marker on the leg).',
    tags: ['mechanism', 'route', 'stops', 'calendar', 'case file', 'trays', 'parties', 'sequence as configured', 'documented', 'questioned'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/comunicacion-contraparte.js', 'src/primitives/badges.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
