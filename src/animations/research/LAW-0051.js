/**
 * LAW-0051 — Historial de una norma · contrast
 *
 * Storyboard (two complete reading stations, identical except ONE fact):
 *  0.00–0.17  base: both stations show the same shelf, catalogue kiosk with the
 *             same query, the same fanned temporal layers on the lectern and a
 *             research card on the counter; the date fields are still empty.
 *  0.17–0.40  change: the right hand types the selected date. Only this datum
 *             differs: A types the date the author marks inside one layer
 *             ("version for the selected date"), B types a later date that the
 *             author marks inside a later layer ("later version").
 *  0.40–0.77  parallel: the same gestures with the same timing — take the card,
 *             clip it on the rail, slide it up to the date. The card in B stops
 *             lower (a later layer); in A the layers after the marked one turn
 *             into ghosts, in B none does. Geometry and ghosting differ; nothing
 *             else does.
 *  0.77–1.00  guide: rings on the two cards and a comparison guide joining them;
 *             neutral note. No winner, score, validity or legal consequence.
 * @module animations/research/LAW-0051
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {contrastFields, str, int, obj} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {readingStation, STATION} from './kits/historial-de-una-norma.js';
import {historialFields, HISTORIAL_DEFAULTS, HISTORIAL_STRINGS, selectedIndex} from './kits/historial-fields.js';

const ID = 'LAW-0051';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  toKeys: [0.17, 0.22], dated: [0.22, 0.31], cardDate: [0.29, 0.35], backR: [0.32, 0.39],
  toCard: [0.4, 0.45], liftCard: [0.45, 0.5], slide: [0.51, 0.62], clip: [0.62, 0.64], releaseR: [0.64, 0.75],
  select: [0.62, 0.7], changeChip: [0.2, 0.28], rings: [0.78, 0.84], guide: [0.79, 0.9],
  // footer notes share one row: each one lifts out completely before the next fades in (no superimposed text)
  changeOut: [0.5, 0.535], sharedIn: [0.56, 0.6], sharedOut: [0.815, 0.85], note: [0.87, 0.93],
};

const sceneSchema = {
  ...historialFields,
  ...contrastFields(),
  alternative: obj('The single changed fact in scenario B: the selected date and the layer the author marks for it (supplied, never computed)', {
    date: str('Selected date typed in scenario B (fictional)', 30),
    selectedVersion: int('Index (0 = oldest) of the layer marked for scenario B’s date', 0, 3),
  }, ['date', 'selectedVersion']),
};

const defaultParams = {
  ...HISTORIAL_DEFAULTS,
  alternative: {date: '14 Jun 2024', selectedVersion: 2},
  scenarioA: {label: 'Version for the selected date', caption: 'The card stops inside Version 2'},
  scenarioB: {label: 'Later version', caption: 'A later date: the card stops inside Version 3'},
  changedFact: 'Only the selected date differs (14 Jun 2021 / 14 Jun 2024)',
  sharedFacts: ['Same provision and versions', 'Same query', 'Same gestures and timing'],
  comparisonLabels: {guide: 'Changed fact: selected date', neutral: 'Two look-ups side by side — no legal effect is stated'},
};

/**
 * Panel geometry and arrangement per available shape. The compact panels keep
 * the lectern large inside each panel; the design spaces have the proportions
 * of the caption-safe boxes, so the two stations fill the frame.
 */
const ARRANGE = {
  landscape: {axis: 'panelRow', arrangement: 'row'},
  square: {axis: 'panelSq', arrangement: 'row'},
  portrait: {axis: 'panelCol', arrangement: 'column'},
};
const HEADER = 100;
const GUIDE_SIZE = 30;
const NOTE_SIZE = 32;

const scene = {
  sizes: {landscape: [2060, 975], square: [1334, 1125], portrait: [1110, 1658]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const stageSize = STATION[axis];
    // Guide route: 'top' (wide panels side by side: up through the free wall
    // between rail and kiosk), 'bottom' (tall panels: the kiosk spans the top, so
    // run under the panels), 'column' (stacked: straight down between the cards).
    const route = arrangement === 'column' ? 'column' : axis === 'panelSq' ? 'bottom' : 'top';
    const n = p.versions.length;
    const selA = selectedIndex(p);
    const selB = Math.max(0, Math.min(n - 1, p.alternative.selectedVersion));
    const dataB = {...p, dates: {selected: p.alternative.date}};
    const stations = [
      readingStation(ctx, {prefix: 'sa', axis, data: p, selected: selA, leftArm: false, volumeStart: 'hung'}),
      readingStation(ctx, {prefix: 'sb', axis, data: dataB, selected: selB, leftArm: false, volumeStart: 'hung'}),
    ];
    // Scenario headers wrap (label up to two lines) instead of truncating; stacked, B's header
    // stops left of the vertical guide, whose chip sits in the same band.
    const cardCx = stations[0].cardWait.x + stations[0].cardBoxAt(stations[0].cardWait).w / 2;
    const headW = [stageSize.w, route === 'column' ? cardCx - 18 : stageSize.w];
    const headFits = [p.scenarioA, p.scenarioB].map((sc, i) => headerFits(ctx, sc, headW[i]));
    const header = Math.max(HEADER, ...headFits.map(f => f.h + 18));
    const geo = pairedGeometry(ctx, {stage: stageSize, arrangement, header, gap: 50});
    const showKey = ctx.show('key');
    const bw = geo.w;
    const guideFit = chipText => chip(ctx, chipText, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(760, bw * 0.62), size: GUIDE_SIZE, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
    const probe = showKey ? guideFit(p.comparisonLabels.guide) : null;
    const top = route === 'top' && probe ? probe.box.h + 16 : 0;
    const bottomBand = route === 'bottom' ? (probe ? probe.box.h + 44 : 40) : 0;
    const noteProbe = [
      showKey ? chip(ctx, p.changedFact, {x: 0, y: 0, anchor: 'middle', maxWidth: bw * 0.92, size: NOTE_SIZE + 2, maxLines: 2, name: 'change-chip'}) : null,
      p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: 0, y: 0, maxWidth: bw * 0.94, size: NOTE_SIZE, name: 'shared-note'}) : null,
      ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: 0, y: 0, maxWidth: bw * 0.94, size: NOTE_SIZE, name: 'neutral-note'}) : null,
    ].filter(Boolean);
    const footer = Math.max(70, ...noteProbe.map(c => c.box.h + 22));
    const bh = top + geo.h + bottomBand + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const colors = [ctx.theme.inkSoft, ctx.theme.accent2];
    const headers = geo.panels.map((pn, i) => headerNode(ctx, headFits[i], {name: `head-${i}`, letter: i ? 'B' : 'A', x: pn.x, y: pn.headerY + (header - 12 - headFits[i].h) / 2, color: colors[i]}));
    // Final card boxes (block coordinates) for the rings and the guide.
    const cardFinal = stations.map((st, i) => {
      const cb = st.cardBoxAt({x: st.cardWait.x, y: st.dateAt(i ? selB : selA)});
      const pn = geo.panels[i];
      return {x: pn.x + cb.x, y: pn.y + cb.y, w: cb.w, h: cb.h};
    });
    const pad = 12;
    const rings = cardFinal.map((b, i) => h('path', {name: `ring-${i}`, d: rr(b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2, 14), fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': i ? null : '12 9', opacity: 0}));
    const ax = cardFinal[0].x + cardFinal[0].w / 2, bx = cardFinal[1].x + cardFinal[1].w / 2;
    const gx = route === 'column' ? ax : geo.panels[0].x + geo.panels[0].w + (geo.panels[1].x - geo.panels[0].x - geo.panels[0].w) / 2;
    let guideD, guideLen, chipPos = null, leader = null;
    if (route === 'top') {
      const yTop = geo.panels[0].y + 14;
      const ay = cardFinal[0].y - pad, by = cardFinal[1].y - pad;
      guideD = `M${r(ax)} ${r(ay)}V${r(yTop + 16)}Q${r(ax)} ${r(yTop)} ${r(ax + 16)} ${r(yTop)}H${r(bx - 16)}Q${r(bx)} ${r(yTop)} ${r(bx)} ${r(yTop + 16)}V${r(by)}`;
      guideLen = (ay - yTop) + (bx - ax) + (by - yTop);
      if (probe) {
        chipPos = {x: gx, y: -top + 6};
        leader = `M${r(gx)} ${r(-top + 6 + probe.box.h)}V${r(yTop)}`;
      }
    } else if (route === 'bottom') {
      const yBot = geo.h + 24;
      const ay = cardFinal[0].y + cardFinal[0].h + pad, by = cardFinal[1].y + cardFinal[1].h + pad;
      guideD = `M${r(ax)} ${r(ay)}V${r(yBot - 16)}Q${r(ax)} ${r(yBot)} ${r(ax + 16)} ${r(yBot)}H${r(bx - 16)}Q${r(bx)} ${r(yBot)} ${r(bx)} ${r(yBot - 16)}V${r(by)}`;
      guideLen = (yBot - ay) + (bx - ax) + (yBot - by);
      if (probe) chipPos = {x: gx, y: yBot + 14};
    } else {
      const ay = cardFinal[0].y + cardFinal[0].h + pad, by = cardFinal[1].y - pad;
      guideD = `M${r(ax)} ${r(ay)}V${r(by)}`;
      guideLen = by - ay;
    }
    const guide = h('path', {name: 'guide', d: guideD, fill: 'none', stroke: th.accent, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(guideLen)} ${r(guideLen + 20)}`, 'stroke-dashoffset': r(guideLen)});
    let guideChip = null;
    if (showKey) {
      if (chipPos) guideChip = chip(ctx, p.comparisonLabels.guide, {x: chipPos.x, y: chipPos.y, anchor: 'middle', maxWidth: Math.min(760, bw * 0.62), size: GUIDE_SIZE, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      else {
        // stacked: in panel B's header band, right of the vertical guide (header text is kept left of it)
        const pn1 = geo.panels[1];
        const gc = chip(ctx, p.comparisonLabels.guide, {x: ax + 20, y: 0, anchor: 'start', maxWidth: bw - ax - 30, size: 30, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
        guideChip = chip(ctx, p.comparisonLabels.guide, {x: ax + 20, y: pn1.headerY + (header - gc.box.h) / 2, anchor: 'start', maxWidth: bw - ax - 30, size: 30, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
      }
    }
    const leaderNode = leader ? h('path', {name: 'guide-lead', d: leader, fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '6 6', opacity: 0}) : null;
    const footY = geo.h + bottomBand + 14;
    const changeChip = showKey ? chip(ctx, p.changedFact, {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.92, size: NOTE_SIZE + 2, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.94, size: NOTE_SIZE, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.94, size: NOTE_SIZE, name: 'neutral-note'}) : null;
    return {top, route, leaderNode, geo, stations, headers, rings, guide, guideLen, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, selA, selB, cardFinal};
  },
  build(ctx, L) {
    return g({transform: `${T(L.ox, L.oy, 0, L.s)} translate(0 ${L.top})`},
      L.headers,
      L.leaderNode,
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stations[i].node)),
      L.guide,
      L.rings,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const v = {
      toKeys: seg(u, ...W.toKeys), type: 1, dated: seg(u, ...W.dated), locate: 1, backR: seg(u, ...W.backR),
      toVol: 0, pull: 0, carry: 1, settle: 1, toFan: 1, fan: 1, releaseL: 1,
      toCard: seg(u, ...W.toCard), liftCard: seg(u, ...W.liftCard), slide: seg(u, ...W.slide), clip: seg(u, ...W.clip), releaseR: seg(u, ...W.releaseR),
      select: seg(u, ...W.select), cardDate: seg(u, ...W.cardDate),
    };
    const a = L.stations[0].pose(v);
    const b = L.stations[1].pose(v);
    const nodes = {...a.nodes, ...b.nodes};
    const rp = seg(u, ...W.rings);
    const gp = ease.inOutCubic(seg(u, ...W.guide));
    nodes['ring-0'] = {opacity: r(rp, 3)};
    nodes['ring-1'] = {opacity: r(rp, 3)};
    nodes.guide = {'stroke-dashoffset': r(L.guideLen * (1 - gp)), opacity: gp > 0 ? 1 : 0};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    if (L.leaderNode) nodes['guide-lead'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    // footer row: change chip → shared facts → neutral note, each gone (lifted) before the next arrives
    const lift = (inP, outP) => ({opacity: r(clamp(inP) * (1 - outP), 3), transform: `translate(0 ${r(-18 * outP + 10 * (1 - clamp(inP)))})`});
    if (L.changeChip) nodes['change-chip'] = lift(seg(u, ...W.changeChip), seg(u, ...W.changeOut));
    if (L.shared) nodes['shared-note'] = lift(seg(u, ...W.sharedIn), seg(u, ...W.sharedOut));
    if (L.neutral) nodes['neutral-note'] = lift(seg(u, ...W.note), 0);
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = sm => ({card: sm.card, holder: sm.cardHolder, selected: sm.selected, later: sm.laterLayers, fan: sm.fan});
    return {
      nodes,
      semantic: {
        beat,
        a: pick(a.semantic),
        b: pick(b.semantic),
        dateTyped: r(v.dated, 3),
        cardA: a.semantic.card,
        cardB: b.semantic.card,
        handA: a.semantic.handR,
        handB: b.semantic.handR,
        cardGripA: a.semantic.cardGrip,
        cardGripB: b.semantic.cardGrip,
        targets: {a: L.selA, b: L.selB},
        targetY: {a: a.semantic.cardTargetY, b: b.semantic.cardTargetY},
        allReached: a.semantic.allReached && b.semantic.allReached,
        guideProgress: r(gp, 3),
        arrangement: L.arrangement,
        guideRoute: L.route,
      },
    };
  },
};

/**
 * Scenario header measurements: letter badge, label (one line, or two smaller
 * lines rather than an ellipsis) and caption (one or two lines).
 */
function headerFits(ctx, sc, w) {
  const R = 25;
  const tw = w - R * 2 - 16;
  let lf = null, cf = null;
  if (ctx.show('key')) {
    lf = ctx.fit(sc.label, {maxWidth: tw, size: 34, minSize: 27, maxLines: 1, weight: 700});
    if (lf.truncated) lf = ctx.fit(sc.label, {maxWidth: tw, size: 28, minSize: 20, maxLines: 2, weight: 700});
  }
  if (sc.caption && ctx.show('all')) {
    cf = ctx.fit(sc.caption, {maxWidth: tw, size: 21, minSize: 17, maxLines: 1, weight: 500});
    if (cf.truncated) cf = ctx.fit(sc.caption, {maxWidth: tw, size: 19, minSize: 15, maxLines: 2, weight: 500});
  }
  const textH = (lf ? lf.height : 0) + (cf ? cf.height + 12 : 0);
  return {R, lf, cf, h: Math.max(R * 2 + 4, textH)};
}

function headerNode(ctx, f, o) {
  const th = ctx.theme;
  const tx = o.x + f.R * 2 + 16;
  const textH = (f.lf ? f.lf.height : 0) + (f.cf ? f.cf.height + 12 : 0);
  const ty = o.y + (f.h - textH) / 2;
  return g({name: o.name},
    h('circle', {cx: o.x + f.R, cy: o.y + f.h / 2, r: f.R, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    // with labels hidden the badge stays as a coloured marker (A = left/top, B = right/bottom)
    ctx.show('key') ? textBlock(ctx.fit(o.letter, {maxWidth: 60, size: 30, maxLines: 1, weight: 800}), {x: o.x + f.R, y: o.y + f.h / 2 - 15, anchor: 'middle', fill: '#fff'}) : null,
    f.lf ? textBlock(f.lf, {x: tx, y: ty, fill: th.fg}) : null,
    f.cf ? textBlock(f.cf, {x: tx, y: ty + (f.lf ? f.lf.height + 12 : 0), fill: th.fgSoft}) : null,
  );
}

function rr(x, y, w, hh, rad) {
  const q = Math.min(rad, w / 2, hh / 2);
  return `M${r(x + q)} ${r(y)}H${r(x + w - q)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + q)}V${r(y + hh - q)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - q)} ${r(y + hh)}H${r(x + q)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - q)}V${r(y + q)}Q${r(x)} ${r(y)} ${r(x + q)} ${r(y)}Z`;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-03-contrast',
    title: 'History of a provision — selected date vs later date',
    titleEs: 'Historial de una norma — Comparación de dos supuestos',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Historial de una norma',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical reading stations run the same gestures; only the typed date differs. The research card travels a different distance on the date rail and stops in a different temporal layer; later layers become ghosts only where one exists. A closing guide joins the two cards without stating any outcome.',
    tags: ['legal research', 'versions', 'comparison', 'timeline', 'date', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/historial-de-una-norma.js', 'src/animations/research/kits/historial-fields.js', 'src/frameworks/paired.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HISTORIAL_STRINGS,
  scene,
});
