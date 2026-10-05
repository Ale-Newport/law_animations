/**
 * LAW-0443 — Oferta comunicada · contrast
 *
 * Storyboard (two complete, identical scenes; exactly one fact differs —
 * whether the offer REACHES the offeree):
 *  0.00–0.17  base: in both panels the offeror (A) holds the open offer
 *             (same terms), a neutral relay tray stands between the parties,
 *             the offeree (B) waits.
 *  0.17–0.40  change: both offers are folded and sealed identically; the
 *             planned route appears as a guide with an end marker — in
 *             scenario B it continues from the relay to the offeree's hand, in
 *             scenario A it ends at the relay (the localized, explicit
 *             difference). The changed fact is named.
 *  0.40–0.77  parallel action: both offers are sent and land in the relay at
 *             the same time. In A it stays there (sent, in transit). In B it
 *             continues to B's hand, the seal is broken and the same terms
 *             open in front of B.
 *  0.77–1.00  guide: a neutral line joins the two places where the offer
 *             ends up; shared facts and a neutral note (no winner, score or
 *             legal consequence).
 * Row (side by side) on wide boxes, column (stacked) on tall boxes. 1:1 uses
 * tall side-by-side panels with the relay tray raised on a post, so the frame
 * is filled top to bottom. Stacked, the closing guide runs in a lane outside
 * the panels (never across an actor or header text). Name chips and scenario
 * captions wrap to two lines instead of being cut.
 * @module animations/contract-formation/LAW-0443
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields, str} from '../../schemas/fields.js';
import {chip, connector, statusTag, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, scenarioHeader, neutralNote} from '../../frameworks/paired.js';
import {offerFields} from './kits/offer-fields.js';
import {offerStage} from './kits/offer-letter.js';
import {roundRectPath as roundRectPathLocal} from '../../core/geometry.js';

const ID = 'LAW-0443';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  fold: [0.18, 0.3], seal: [0.3, 0.33], ghost1: [0.31, 0.36], ghost2: [0.34, 0.4], changeChip: [0.2, 0.28],
  windup: [0.4, 0.44], launch: [0.44, 0.47], travel: [0.47, 0.55], returnA: [0.48, 0.56],
  travel2: [0.58, 0.65], reach: [0.58, 0.65], bring: [0.65, 0.69], open: [0.68, 0.71], unfold: [0.7, 0.77],
  tags: [0.72, 0.77], guide: [0.78, 0.9],
  // footer captions share one slot, so they never cross-fade: each leaves before the next arrives
  changeOut: [0.47, 0.5], sharedIn: [0.51, 0.55], sharedOut: [0.84, 0.865], note: [0.875, 0.93],
};

const STRINGS = {
  en: {from: 'From', to: 'To', inTransit: 'In transit'},
  es: {from: 'De', to: 'Para', inTransit: 'En tránsito'},
};

const sceneSchema = {
  ...offerFields,
  ...contrastFields(),
  relayLabel: str('Label printed on the relay tray between the parties (the in-transit point, same in both scenes)', 30),
};

const defaultParams = {
  parties: [{name: 'Nadia Park', role: 'Party A'}, {name: 'Tomás Ribeiro', role: 'Party B'}],
  offer: {reference: 'OF-2041', title: 'Offer to supply'},
  terms: [
    {key: 'item', label: 'Item', value: 'Oak office chairs'},
    {key: 'delivery', label: 'Delivery', value: 'Day 10'},
    {key: 'quantity', label: 'Quantity', value: '40'},
    {key: 'unitPrice', label: 'Unit price (hypothetical)', value: '130'},
  ],
  scenarioA: {label: 'Offer sent', caption: 'It has left Party A and is still on its way'},
  scenarioB: {label: 'Offer received', caption: 'It reaches Party B, who opens it'},
  changedFact: 'Only one fact differs: whether the offer reaches Party B',
  sharedFacts: ['Same terms', 'Same parties', 'Same route and timing'],
  comparisonLabels: {guide: 'Changed fact: where the offer ends up', neutral: 'Two situations side by side — no legal effect is stated'},
  relayLabel: 'Post',
};

/**
 * Panel stage per arrangement: size, character scale and positions (panel-local units).
 * 1:1 uses tall side-by-side panels: the relay tray stands on a tall post above the parties'
 * heads, so the offer is lobbed up to it and (in B) down to the offeree — the square frame is
 * used top to bottom instead of showing the wide 16:9 panels as a thin band.
 */
const STAGES = {
  landscape: {arrangement: 'row', w: 1100, h: 700, k: 1, ax: 90, bx: 1010, floor: 632, lift: 170, relayH: 250, chip: 30},
  square: {arrangement: 'row', w: 780, h: 900, k: 0.92, ax: 60, bx: 720, floor: 834, lift: 150, relayH: 470, chip: 30},
  portrait: {arrangement: 'column', w: 1100, h: 700, k: 0.95, ax: 90, bx: 1010, floor: 632, lift: 150, relayH: 250, chip: 30},
};

/** Width of the guide lane outside the stacked panels (9:16). */
const LANE = 70;

/**
 * Comparison guide along a polyline with rounded corners (plain relation style: no arrow, end
 * dots), drawn on by arc length. Same frame/at interface as primitives/annotate `connector`.
 */
function laneGuide(ctx, name, pts, rad, color) {
  // rounded corners: straight runs joined by quadratic turns
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  const samples = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const la = Math.hypot(b.x - a.x, b.y - a.y), lc = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, la / 2, lc / 2);
    const p1 = {x: b.x + ((a.x - b.x) / (la || 1)) * rr, y: b.y + ((a.y - b.y) / (la || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (lc || 1)) * rr, y: b.y + ((c.y - b.y) / (lc || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    samples.push(p1);
    for (let k = 1; k <= 6; k++) {
      const t = k / 6;
      samples.push({x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * b.x + t * t * p2.x, y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * b.y + t * t * p2.y});
    }
  }
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  samples.push(last);
  const cum = [0];
  for (let i = 1; i < samples.length; i++) cum.push(cum[i - 1] + Math.hypot(samples[i].x - samples[i - 1].x, samples[i].y - samples[i - 1].y));
  const total = cum[cum.length - 1];
  const at = t => {
    const L = clamp(t) * total;
    let i = 1;
    while (i < samples.length - 1 && cum[i] < L) i++;
    const f = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return {x: samples[i - 1].x + (samples[i].x - samples[i - 1].x) * f, y: samples[i - 1].y + (samples[i].y - samples[i - 1].y) * f};
  };
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: pts[0].x, cy: pts[0].y, r: 4.8, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: last.x, cy: last.y, r: 4.8, fill: color, opacity: 0}));
  const frame = (pr, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - pr))},
    [`${name}-dotA`]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: pr >= 0.985 ? 1 : 0},
  });
  return {node, frame, at, total, from: pts[0], to: last};
}

const scene = {
  sizes: {landscape: [2270, 1110], square: [1630, 1190], portrait: [1170, 1910]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const St = STAGES[ctx.view.shape];
    const {arrangement, k} = St;
    // scenario captions get their own (up to two-line) text under the header label, so long
    // captions wrap instead of shrinking to an unreadable size
    const capSize = 30;
    const capW = St.w - 120;
    const caps = [p.scenarioA, p.scenarioB].map(sc => (sc.caption && ctx.show('all') ? ctx.fit(sc.caption, {maxWidth: capW, size: capSize, minSize: 24, maxLines: 2, weight: 500}) : null));
    const capLines = Math.max(1, ...caps.map(f => (f ? f.lines.length : 1)));
    const header = capLines > 1 ? 188 : 150;
    // name chips: one line when they fit, else two lines (never cut); the floor rises to keep
    // them inside the panel
    const names = [p.parties[0].name, p.parties[1].name];
    const chipMax = Math.min(360, St.w * 0.42);
    const twoLineNames = ctx.show('key') && names.some(nm => chip(ctx, nm, {x: 0, y: 0, maxWidth: chipMax, size: St.chip, maxLines: 1}).fit.truncated);
    const floor = St.floor - (twoLineNames ? St.chip * 1.18 : 0);
    const footer = 140;
    const geo = pairedGeometry(ctx, {stage: {w: St.w, h: St.h}, arrangement, header, gap: 70});
    const bw = geo.w + (arrangement === 'column' ? LANE : 0), bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    const sw = 240 * k;
    const relayH = St.relayH * k;
    const stages = ['a', 'b'].map(key => offerStage(ctx, {
      prefix: `s${key}`, k, parties: p.parties, offer: p.offer, terms: p.terms, mailerLabel: '',
      A: {x: St.ax, floor}, B: {x: St.bx, floor},
      relay: {x: St.w / 2, floor, height: relayH, label: p.relayLabel, trayW: sw + 24 * k},
      apexLift: St.lift, sheetLabels: {from: ctx.t.from, to: ctx.t.to},
      captions: names, chipSize: St.chip, chipMax, chipLines: twoLineNames ? 2 : 1, width: St.w, ground: 'strip',
    }));
    const colors = [th.inkSoft, th.accent2];
    const headers = geo.panels.map((pn, i) => {
      const lab = scenarioHeader(ctx, {
        name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label,
        x: pn.x, y: pn.headerY + 8, w: pn.w, h: 134, color: colors[i],
      });
      const f = caps[i];
      // same geometry as primitives' scenario header: label size min(54, 0.4·h), text starts after the badge
      const size = Math.min(54, 134 * 0.4);
      const capNode = f ? textBlock(f, {x: pn.x + size * 0.78 * 2 + 18, y: pn.headerY + 8 + 134 * 0.42 + size * 0.78, fill: th.fgSoft}) : null;
      return g(null, lab, capNode);
    });
    // where each planned route ends (shown with the route guides in the "change" beat)
    const endMark = (name, pt) => g({name, opacity: 0},
      h('circle', {cx: pt.x, cy: pt.y, r: 30 * k, fill: th.dark ? 'none' : '#ffffff', 'fill-opacity': 0.55, stroke: th.dark ? th.fg : th.accent2, 'stroke-width': 4.5, 'stroke-dasharray': '8 6'}),
      h('circle', {cx: pt.x, cy: pt.y, r: 9 * k, fill: th.dark ? th.fg : th.accent2}));
    // where the offer ends up: in A the relay slot, in B the open sheet in B's hands (block coords)
    const A0 = stages[0], B0 = stages[1];
    const endA = {x: geo.panels[0].x + A0.legs.slot.x, y: geo.panels[0].y + A0.legs.slot.y};
    const endB = {x: geo.panels[1].x + B0.heldCenterB.x, y: geo.panels[1].y + B0.heldCenterB.y};
    const ph = A0.sheet.ph;
    const ringA = {rx: sw * 0.62, ry: ph * 0.8};
    const ringB = {rx: sw * 0.64, ry: B0.sh * 0.56};
    const row = arrangement === 'row';
    // the guide never crosses an actor or header text: above the heads when side by side; when
    // stacked it leaves A's relay upward, runs above the heads to a lane OUTSIDE the panels on the
    // right, down past B's header, and back above B's head into B's sheet
    const from = {x: endA.x, y: endA.y - ringA.ry};
    const to = {x: endB.x, y: endB.y - ringB.ry};
    const topY = geo.panels[0].y + (row ? Math.min(150 * k, Math.max(40, A0.legs.slot.y - ringA.ry - 150)) : 150 * k);
    let guide, gcPos;
    if (row) {
      guide = connector(ctx, {name: 'guide', from, to, kind: 'relation', color: th.accent, c1: {x: from.x + 60, y: topY}, c2: {x: to.x - 60, y: topY}});
      gcPos = {x: (from.x + to.x) / 2, y: topY - 78, anchor: 'middle'};
    } else {
      const laneX = geo.w + LANE / 2;
      const yA = geo.panels[0].y + 34, yB = geo.panels[1].y + 34;
      guide = laneGuide(ctx, 'guide', [from, {x: from.x, y: yA}, {x: laneX, y: yA}, {x: laneX, y: yB}, {x: to.x, y: yB}, to], 34, th.accent);
      gcPos = {x: laneX - 24, y: yA + 18, anchor: 'end'};
    }
    const guideChip = ctx.show('key') ? chip(ctx, p.comparisonLabels.guide, {...gcPos, maxWidth: row ? 620 : Math.min(560, gcPos.x - endA.x - 40), size: 30, maxLines: row ? 2 : 3, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null;
    // state tags inside each panel (descriptive)
    // state tags sit away from the guide's ends: A beside the relay pole, B under B's sheet
    const trayTop = geo.panels[0].y + floor - relayH;
    const tagA = ctx.show('key') ? statusTag(ctx, ctx.t.inTransit, {x: row ? endA.x + 22 : endA.x - 22, y: trayTop + 70 * k, anchor: row ? 'start' : 'end', size: 30, name: 'tag-a', color: th.inkSoft, opacity: 0}) : null;
    const tagB = ctx.show('key') ? statusTag(ctx, ctx.t.received, {x: endB.x, y: endB.y + B0.sh / 2 + 12, anchor: 'middle', size: 30, name: 'tag-b', color: th.accent4, opacity: 0}) : null;
    const footY = geo.h + 22;
    const changeChip = ctx.show('key') ? chip(ctx, p.changedFact, {x: geo.w / 2, y: footY, anchor: 'middle', maxWidth: geo.w * 0.92, size: 40, maxLines: 2, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'}) : null;
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: geo.w / 2, y: footY, maxWidth: geo.w * 0.95, size: 38, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: geo.w / 2, y: footY, maxWidth: geo.w * 0.95, size: 38, name: 'neutral-note'}) : null;
    const backdrops = geo.panels.map((pn, i) => h('path', {d: roundRectPathLocal(pn.x - 6, pn.y - 6, pn.w + 12, pn.h + 12, 26), fill: th.dark ? '#2c3036' : (i ? '#eef3f7' : '#f1efea'), stroke: th.dark ? '#454b53' : '#d9d4c8', 'stroke-width': 2.5}));
    const marks = [endMark('end-a', {x: endA.x, y: endA.y - 34 * k}), endMark('end-b', {x: geo.panels[1].x + B0.catchC.x, y: geo.panels[1].y + B0.catchC.y})];
    return {geo, stages, headers, backdrops, endA, endB, ringA, ringB, guide, guideChip, tagA, tagB, changeChip, shared, neutral, s, ox, oy, arrangement, marks};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ring = (i, c, R, dashed) => h('ellipse', {name: `ring-${i}`, cx: c.x, cy: c.y, rx: R.rx, ry: R.ry, fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': dashed ? '12 10' : null, opacity: 0});
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.backdrops,
      L.headers,
      // highlight rings sit behind the actors and props: the hand and the sheet stay in front
      ring(0, L.endA, L.ringA, true), ring(1, L.endB, L.ringB, false),
      L.geo.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      L.marks, // planned route ends (only during the change beat), over the tray
      L.tagA && L.tagA.node, L.tagB && L.tagB.node,
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const s = w => seg(u, ...W[w]);
    const base = {
      fold: s('fold'), seal: s('seal'), windup: s('windup'), launch: s('launch'), travel: s('travel'), returnA: s('returnA'),
      headA: 8 * (1 - s('launch')) - 4 * s('launch'), ghost1: r(0.42 * s('ghost1'), 3),
    };
    // A: the offer stays at the relay (sent, in transit); B waits, looking toward it
    const a = L.stages[0].pose({...base, headB: -4 * s('travel')});
    // B: the offer continues to the offeree, who catches, unseals and opens it
    const b = L.stages[1].pose({...base, ghost2: r(0.42 * s('ghost2'), 3), travel2: s('travel2'), reach: s('reach'), bring: s('bring'), open: s('open'), unfold: s('unfold'),
      headB: -6 * s('reach') * (1 - s('bring')) + 9 * s('bring')});
    const nodes = {...a.nodes, ...b.nodes};
    // route-end markers: A's planned route ends at the relay, B's at the offeree's hand; each
    // fades once the offer actually arrives there
    nodes['end-a'] = {opacity: r(s('ghost1') * (1 - s('travel')), 3)};
    nodes['end-b'] = {opacity: r(s('ghost2') * (1 - seg(u, W.travel2[0], W.travel2[0] + 0.04)), 3)};
    const gp = s('guide');
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    nodes['ring-0'] = {opacity: r(clamp(gp * 3), 3)};
    nodes['ring-1'] = {opacity: r(clamp(gp * 3), 3)};
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    if (L.tagA) nodes['tag-a'] = {opacity: r(s('tags'), 3)};
    if (L.tagB) nodes['tag-b'] = {opacity: r(s('tags'), 3)};
    const cp = s('changeChip');
    const noteP = s('note');
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - s('changeOut')), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(s('sharedIn') * (1 - s('sharedOut')), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const sa = a.semantic, sb = b.semantic;
    return {
      nodes,
      semantic: {
        beat,
        a: {holder: sa.holder, folded: sa.folded, sheet: sa.sheetCenter},
        b: {holder: sb.holder, folded: sb.folded, sheet: sb.sheetCenter, opened: r(s('unfold'), 3)},
        aSheet: sa.sheetCenter, bSheet: sb.sheetCenter,
        aHandA: sa.handA, aGripA: sa.gripA, bHandA: sb.handA, bGripA: sb.gripA,
        bHandB: sb.handB, bGripB: sb.gripB,
        routeToB: {a: false, b: true},
        reach: {a: sa.allReached, b: sb.allReached},
        allReached: sa.allReached && sb.allReached,
        guideProgress: r(gp, 3),
        arrangement: L.arrangement,
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-01-contrast',
    title: 'Communicated offer — sent vs received',
    titleEs: 'Oferta comunicada — Comparación de dos supuestos',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Oferta comunicada',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical scenes run in parallel: the same offer is folded, sealed and sent to a relay tray. Only one fact differs — in A it stays at the relay (sent, in transit); in B it continues to the offeree, who unseals it and sees the same terms. A neutral guide joins the two end positions; no winner or legal consequence is stated.',
    tags: ['offer', 'comparison', 'sent', 'received', 'in transit', 'relay', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/offer-letter.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/frameworks/paired.js', 'src/primitives/person.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
