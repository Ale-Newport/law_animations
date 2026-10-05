/**
 * LAW-0230 — Deliberación separada · mechanism
 *
 * Storyboard (the floor plan of the generic building, decomposed into the
 * elements of the action: the public space (●, with its benches and seated
 * participants), the abstract zone (◆), the partition with its door, the
 * track in the building margin and the building itself. Each element listed
 * in `elements` has a card beside its part of the plan, tied to it by a
 * leader; the cards stand above the plan (and the building's below it). The
 * SUPPLIED relationships run between the cards as plain lines routed above
 * them — never through the plan — each labelled by its kind; nothing has an
 * arrowhead. A panel holds the names, the captions, the states and the key):
 *  0.00–0.18  the elements are separated: the partition door closes, then the
 *             public space moves apart from the zone along its track; the
 *             cards and their leaders appear on their parts.
 *  0.18–0.43  only the explicit relationships are drawn, one after another,
 *             with their kind ("linked as configured"; a sequence link shows
 *             its steps 1 · 2 and the caption "sequence as configured
 *             (illustrative)"; a causal link only when the author supplies it).
 *  0.43–0.75  a tracer follows the relationships in the supplied traversal
 *             order while the focus element (the partition by default) is
 *             enlarged: its card grows and its part of the plan is outlined.
 *  0.75–1.00  the mechanism is gathered: origin (the faint outline where the
 *             public space stood), transformation (the track) and state (the
 *             separation) stay visible with their captions and the key "as
 *             supplied · no conclusion drawn". Nothing states a rule,
 *             attendance, a vote or an outcome.
 * @module animations/courts/LAW-0230
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {polyline} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {
  delibFields, DELIB_EN, DELIB_STRINGS, delibGeometry, delibArt, seatedPose, planScene, legendItem, legendItem2, keyItem, captionItem, cardChip, delibGlyph,
  layoutPanel, overlaps, unionBox, pxPerUnit, R2, LETTERS, searchLayout, textAt, fitG, letterBadge,
} from './kits/deliberacion-separada.js';

const ID = 'LAW-0230';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {door: [0.02, 0.06], move: [0.05, 0.16], cards: [0, 0.03], rels: [0.18, 0.42], trace: [0.44, 0.74], focus: [0.44, 0.5], unfocus: [0.7, 0.75], gather: [0.77, 0.83]};
const EIDS = ['publicSpace', 'zone', 'partition', 'track', 'participants', 'building'];
// cards above the plan (their relationships run above them); the building's card stands below it
const TOP = new Set(['track', 'participants', 'publicSpace', 'partition', 'zone']);

const STRINGS = {
  en: {...DELIB_STRINGS.en, states: 'Origin: the spaces joined · transformation: along the track · state: apart (as configured)'},
  es: {...DELIB_STRINGS.es, states: 'Origen: espacios unidos · transformación: por el recorrido · estado: apartados (según lo configurado)'},
};

const sceneSchema = {
  ...delibFields,
  ...mechanismFields(EIDS),
};

// (concise defaults: the relationships and their labels share the frame with the plan)
const defaultParams = {
  courts: {building: 'Building (fictional)', hearing: 'Hearing room (fictional)', deliberation: 'Deliberation zone (fictional)'},
  routes: {track: 'Track (as configured)', partition: 'Partition with a door'},
  seats: {bench: 'Benches', participants: [{name: 'Participant A'}, {name: 'Participant B'}, {name: 'Participant C'}]},
  labels: {gap: 'Separation (illustrative)', sequence: DELIB_EN.labels.sequence, key: DELIB_EN.labels.key},
  elements: [
    {id: 'publicSpace', label: 'Public space (moves)'},
    {id: 'zone', label: 'Abstract zone (stays)'},
    {id: 'partition', label: 'Partition and its door'},
    {id: 'track', label: 'Track'},
    {id: 'participants', label: 'Seated participants'},
    {id: 'building', label: 'Building around both'},
  ],
  relationships: [
    {from: 'participants', to: 'publicSpace', kind: 'relation'},
    {from: 'publicSpace', to: 'partition', kind: 'relation'},
    {from: 'partition', to: 'zone', kind: 'relation'},
    {from: 'partition', to: 'track', kind: 'sequence'},
  ],
  focusElement: 'partition',
  relationLabels: {relation: 'Linked', communication: 'Communication as configured', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link as supplied'},
  traversalOrder: ['participants', 'publicSpace', 'partition', 'track'],
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const geo of [{rh: 600, m: 70, tb: 22}, {rh: 480, m: 50, tb: 20}, {rh: 360, m: 36, tb: 18}, {rh: 300, m: 28, tb: 16}]) for (const pf of [0.24, 0.28, 0.32]) arrs.push({panel: 'column', pf, ...geo});
    } else if (shape === 'square') {
      for (const geo of [{rh: 230, m: 16, tb: 14}, {rh: 240, m: 20, tb: 14}, {rh: 270, m: 22, tb: 14}]) {
        for (const cols of [3, 4]) arrs.push({panel: 'band', cols, ...geo, bname: 'panel'});
        // fallback (standing rule): a right-hand text column beside the plan
        for (const pf of [0.3, 0.34]) arrs.push({panel: 'column', pf, ...geo, bname: 'panel'});
      }
    } else {
      // (tall frames: deeper rooms and a wider building margin, so the plan — width-bound — stands taller)
      for (const geo of [{rh: 820, m: 110, tb: 24}, {rh: 700, m: 100, tb: 22}, {rh: 600, m: 90, tb: 22}, {rh: 440, m: 70, tb: 20}, {rh: 330, m: 32, tb: 18}]) for (const cols of [2, 3]) arrs.push({panel: 'band', cols, ...geo});
    }
    // card widths: a fifth, a sixth or a seventh of the plan's width (narrower cards wrap onto more lines)
    // (and the gap between neighbouring cards: wider gaps give the brackets' labels room)
    // (and whether the cards carry the parts' supplied names as captions — then the legend drops them)
    const all = arrs.flatMap(A => [4.6, 5.6].flatMap(cf => [1.2, 2.4].flatMap(cg => [false, true].map(cap => ({...A, cf, cg, cap})))));
    arrs.length = 0; arrs.push(...all);
    for (const A of arrs) A.key = `${A.panel}/${A.pf || A.cols}/${A.rh}/c${A.cf}/g${A.cg}${A.cap ? '/cap' : ''}${A.bname ? '/b' : ''}`;
    // (the bracket levels are estimated before the cards are placed; when the placed cards need more, the
    // composition is redone with that count)
    return searchLayout((v, A) => {
      const L = compose(ctx, p, v / px, px, A);
      return L.levelsNeeded ? compose(ctx, p, v / px, px, {...A, levelsHint: L.levelsNeeded}) : L;
    }, arrs, L => 0.3 * L.k + 2 * (L.planShare || 0));
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({name: 'map', transform: L.M.transform},
        L.art.node,
        h('rect', {name: 'origin-ghost', x: r(-L.G.t), y: r(-L.G.t), width: r(L.G.rw + 2 * L.G.t), height: r(L.G.rh + 2 * L.G.t), rx: 6, fill: 'none', stroke: th.accent3, 'stroke-width': r(3 / L.k, 2), opacity: 0}),
        L.people.map(pp => pp.node)),
      L.badgeNodes,
      g({name: 'focus-outline', opacity: 0}, h('rect', {x: r(L.focusPart.x - 8), y: r(L.focusPart.y - 8), width: r(L.focusPart.w + 16), height: r(L.focusPart.h + 16), rx: 10, fill: 'none', stroke: th.accent2, 'stroke-width': 4.5})),
      L.rels.map(q => q.node),
      // the tracer rides the lines beneath the cards and the relation labels (it never hides a text)
      h('circle', {name: 'tracer', r: r(L.F * 0.45), fill: th.accent2, stroke: '#fff', 'stroke-width': 3, opacity: 0}),
      L.cards.map(c => c.node),
      L.rels.map(q => q.labelNode),
      L.panelNode,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const G = L.G;
    const open = 1 - ease.inOutCubic(seg(u, ...W.door));
    const move = G.gap * ease.inOutCubic(seg(u, ...W.move));
    const railP = seg(u, W.move[0], W.move[0] + 0.05);
    Object.assign(nodes, L.art.frame(move, open, railP, railP > 0 ? 1 : 0));
    L.people.forEach((pp, i) => Object.assign(nodes, seatedPose(pp, G.seatPts[i], move)));
    const dv = L.moveVec(move);
    L.badgeAt.forEach((b, i) => { nodes[`badge${i}`] = {transform: T(r(b.x + dv.x, 2), r(b.y + dv.y, 2))}; });
    // cards and leaders
    const cardOp = seg(u, ...W.cards);
    void 0;
    const fIn = ease.inOutCubic(seg(u, ...W.focus)) * (1 - ease.inOutCubic(seg(u, ...W.unfocus)));
    for (const c of L.cards) {
      const sc = c.id === L.focusId ? 1 + (L.focusScale - 1) * fIn : 1;
      nodes[`card-${c.id}`] = {opacity: r(cardOp, 3), transform: scaleAbout(c.anchor.x, c.anchor.y, r(sc, 4))};
    }
    nodes['focus-outline'] = {opacity: r(fIn, 3)};
    // relationships drawn one after another
    const nR = L.rels.length;
    L.rels.forEach((q, i) => {
      const a = W.rels[0] + ((W.rels[1] - W.rels[0]) * i) / nR, b = W.rels[0] + ((W.rels[1] - W.rels[0]) * (i + 0.8)) / nR;
      const p = seg(u, a, b);
      nodes[`rel${i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`rel${i}-line`] = {'stroke-dashoffset': r(q.poly.total * (1 - p), 1)};
      if (q.lb) nodes[`rel${i}-label`] = {opacity: r(seg(u, b - 0.01, b + 0.02), 3), transform: T(r(q.dx, 2), r(q.dy || 0, 2))};
      if (q.steps) nodes[`rel${i}-steps`] = {opacity: r(seg(u, b - 0.01, b + 0.02), 3)};
    });
    // the tracer follows the traversal order along the relationships
    const tp = seg(u, ...W.trace);
    let tr = null, trIdx = -1;
    if (L.route.total > 0 && u >= W.trace[0] - 1e-9) {
      tr = L.route.at(tp);
      // which element the tracer last reached
      const d = tp * L.route.total;
      L.routeMarks.forEach((m, j) => { if (d >= m.at - 1e-6) trIdx = j; });
    }
    nodes.tracer = tr ? {cx: r(tr.x, 2), cy: r(tr.y, 2), opacity: r(1 - seg(u, W.gather[0], W.gather[0] + 0.04), 3)} : {cx: r(L.route.pts[0] ? L.route.pts[0].x : 0, 2), cy: r(L.route.pts[0] ? L.route.pts[0].y : 0, 2), opacity: 0};
    // gathered: origin, transformation and state
    const ga = seg(u, ...W.gather);
    nodes['origin-ghost'] = {opacity: r(0.8 * ga, 3)};
    if (L.hasStates) nodes['states'] = {opacity: r(ga, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        door: r(open, 3),
        move: r(move, 2),
        separated: move >= G.gap - 0.5,
        relationsDrawn: L.rels.map((q, i) => r(seg(u, W.rels[0] + ((W.rels[1] - W.rels[0]) * i) / nR, W.rels[0] + ((W.rels[1] - W.rels[0]) * (i + 0.8)) / nR), 3)),
        relationKinds: L.rels.map(q => q.kind),
        relationEnds: L.rels.map(q => [q.from, q.to]),
        tracer: tr ? R2(tr) : null,
        tracerAt: trIdx >= 0 ? L.routeMarks[trIdx].id : null,
        traversal: L.routeMarks.map(m => m.id),
        focus: L.focusId,
        focusScale: r(L.cards.some(c => c.id === L.focusId) ? 1 + (L.focusScale - 1) * fIn : 1, 3),
        gathered: r(ga, 3),
        cardsClear: L.cardsClear,
        labelsClear: L.labelsClear,
        pub: R2(L.M.toD({x: G.rw / 2 - move, y: G.rh / 2})),
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: L.arrangement,
        problems: L.problems,
        log: L.log,
      },
    };
  },
};

/** One composition at text size F (design units) for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const G = delibGeometry({n: p.seats.participants.length, rh: A.rh, margin: A.m, tb: A.tb});
  // ---- panel
  const listed = p.elements.filter((e, i, arr) => EIDS.includes(e.id) && arr.findIndex(q => q.id === e.id) === i);
  const items = panelItems(ctx, p, F, showAll, showKey, A.bname === 'panel', A.cap ? new Set(listed.filter(e => !(e.id === 'building' && A.bname === 'panel')).map(e => e.id)) : new Set());
  let region = {x: 0, y: 0, w: D.w, h: D.h}, panel = null;
  if (items.length) {
    if (A.panel === 'column') {
      const pw = D.w * A.pf;
      const box = {x: D.w - pw, y: 0, w: pw, h: D.h};
      panel = layoutPanel(items, box, F, 'column');
      panel.place(box);
      region = {x: 0, y: 0, w: D.w - pw - 30, h: D.h};
    } else {
      panel = layoutPanel(items, {x: 0, y: 0, w: D.w, h: D.h}, F, 'band', A.cols);
      const box = {x: 0, y: D.h - panel.height, w: D.w, h: panel.height};
      panel.place(box);
      region = {x: 0, y: 0, w: D.w, h: D.h - panel.height - 18};
    }
    if (panel.problem) problems.push(panel.problem);
  }
  // ---- cards (only for the listed elements; the building's below the plan unless it lives in the panel)
  const cardW = Math.min(region.w / A.cf, 300);
  // (labels hidden: each card is a glyph token without text — the relationships still read)
  const captionOf = id => (!A.cap ? null : ({publicSpace: p.courts.hearing, zone: p.courts.deliberation, partition: p.routes.partition, track: p.routes.track, participants: p.seats.participants.map(q => q.name).join(' · '), building: p.courts.building})[id]);
  const cards = listed.filter(e => !(e.id === 'building' && A.bname === 'panel' && showKey)).map(e => ({id: e.id, label: e.label, top: TOP.has(e.id), chip: showKey
    ? cardChip(ctx, e.label, captionOf(e.id), {F, maxWidth: cardW, glyph: e.id === 'publicSpace' ? 'pub' : e.id === 'zone' ? 'zone' : null, stroke: th.ink})
    : tokenCard(ctx, e.id, F)}));
  if (cards.some(c => c.chip.fit.truncated)) problems.push('card-trunc');
  const idsWithCard = new Set(cards.map(c => c.id));
  // ---- relationships that can be drawn (both ends have a card): same band only above/below; else around the left end
  const rels0 = p.relationships.filter(q => idsWithCard.has(q.from) && idsWithCard.has(q.to) && q.from !== q.to);
  const chipH = F * 1.72;
  // (levels far enough apart that a label sits >= 20 px nearer its own line than the next level's)
  const lvH = showAll ? chipH + 30 : 2 * F + 12;
  // (no labels drawn with the labels hidden: the brackets need room only for their own lines)
  const labW = kind => { if (!showAll) return 2 * F; const f = fitG((p.relationLabels && p.relationLabels[kind]) || kind, {maxWidth: 1e4, size: F, minSize: F, maxLines: 1, weight: 600}); return f.width + F * 1.0 + 12; };
  const nLevels = A.levelsHint || assignLevels(rels0, cards, region, labW).levels;
  const topCardH = Math.max(0, ...cards.filter(c => c.top).map(c => c.chip.h));
  const botCardH = Math.max(0, ...cards.filter(c => !c.top).map(c => c.chip.h));
  const leadGap = 16;
  const topBand = cards.some(c => c.top) ? topCardH + leadGap + (nLevels.top ? nLevels.top * lvH + 10 : 0) : 0;
  const botBand = cards.some(c => !c.top) ? botCardH + leadGap + (nLevels.bottom ? nLevels.bottom * lvH + 10 : 0) : 0;
  const bname = 'panel';
  const planRegion = {x: region.x + 12, y: region.y + topBand, w: region.w - 24, h: region.h - topBand - botBand};
  if (planRegion.h < 120) problems.push('plan-height');
  const S = planScene(ctx, p, F, px, {G, region: planRegion, rot: false, bname, moveEnd: G.gap, chips: false});
  problems.push(...S.problems);
  const {M, k, bOuter, people, badgeAt, badgeNodes, moveVec} = S;
  if (S.personPx < 60.5) problems.push('small');
  // ---- component boxes (design, final state)
  const toD = M.toD;
  const move = G.gap;
  const parts = {
    publicSpace: M.box(G.pubOuter(move)),
    zone: M.box(G.zoneOuter()),
    partition: M.box({x: G.zone.x - G.t - 6, y: G.door.y0 - 6, w: G.t + 12, h: G.door.y1 - G.door.y0 + 12}),
    track: M.box({x: G.track[0][1].x, y: G.track[0][0].y - 10, w: G.track[0][0].x - G.track[0][1].x, h: 20}),
    participants: unionBox(G.seatPts.map(q => { const d = toD({x: q.x - move, y: q.y}); const rr = 44 * k; return {x: d.x - rr, y: d.y - rr, w: 2 * rr, h: 2 * rr}; })),
    building: bOuter,
  };
  // ---- place the cards over their parts (x at the part's centre), pushed apart without overlap
  const placeRow = (row, y) => {
    row.sort((a, b) => (parts[a.id].x + parts[a.id].w / 2) - (parts[b.id].x + parts[b.id].w / 2));
    const gap = F * A.cg;
    let x = region.x;
    for (const c of row) { const want = parts[c.id].x + parts[c.id].w / 2 - c.chip.w / 2; c.x = Math.max(x, want); x = c.x + c.chip.w + gap; }
    const over = x - gap - (region.x + region.w);
    if (over > 0) { for (let i = row.length - 1, lim = region.x + region.w; i >= 0; i--) { const c = row[i]; c.x = Math.min(c.x, lim - c.chip.w); lim = c.x - gap; } }
    for (const c of row) c.y = y(c);
    if (row.length && row[0].x < region.x - 0.5) problems.push('cards-wide');
  };
  const topRow = cards.filter(c => c.top), botRow = cards.filter(c => !c.top);
  placeRow(topRow, c => bOuter.y - leadGap - c.chip.h);
  placeRow(botRow, () => bOuter.y + bOuter.h + leadGap);
  for (const c of cards) {
    c.box = {x: c.x, y: c.y, w: c.chip.w, h: c.chip.h};
    c.anchor = {x: c.x + c.chip.w / 2, y: c.top ? c.y + c.chip.h : c.y};
    const pt = parts[c.id];
    const lx = clamp(c.anchor.x, pt.x + 6, pt.x + pt.w - 6);
    const ly = c.top ? pt.y : pt.y + pt.h;
    c.leadTo = {x: lx, y: ly};
    c.node = g({name: `card-${c.id}`, opacity: 0},
      h('path', {d: `M${r(c.anchor.x)} ${r(c.anchor.y)}L${r(lx)} ${r(ly)}`, stroke: th.ink, 'stroke-width': 2.2}),
      h('circle', {cx: r(lx), cy: r(ly), r: 4.5, fill: th.ink}),
      c.chip.node(c.x, c.y, `card-${c.id}-chip`));
  }
  // ---- relationships: brackets above the top cards (below the bottom ones), around the left end across bands
  const cardOf = id => cards.find(c => c.id === id);
  const lv = assignLevels(rels0, cards, region, labW);
  let levelsNeeded = null;
  if (lv.levels.top > nLevels.top || lv.levels.bottom > nLevels.bottom) {
    problems.push('levels');
    if (!A.levelsHint) levelsNeeded = {top: Math.max(lv.levels.top, nLevels.top), bottom: Math.max(lv.levels.bottom, nLevels.bottom)};
  }
  const attach = {};
  const slot = (c, side) => { attach[c.id + side] = (attach[c.id + side] || 0) + 1; return attach[c.id + side]; };
  const rels = rels0.map((q, i) => {
    const a = cardOf(q.from), b = cardOf(q.to);
    const kind = q.kind;
    let pts, labelAt;
    const nA = relsAt(rels0, q.from), nB = relsAt(rels0, q.to);
    const ax = a.x + (a.chip.w * slot(a, 't')) / (nA + 1), bx = b.x + (b.chip.w * slot(b, 't')) / (nB + 1);
    if (a.top === b.top) {
      const up = a.top;
      const edgeA = up ? a.y : a.y + a.chip.h, edgeB = up ? b.y : b.y + b.chip.h;
      const base = up ? Math.min(...topRow.map(c => c.y)) - 10 : Math.max(...botRow.map(c => c.y + c.chip.h)) + 10;
      // the line runs at the near edge of its level; its label sits beside it, on the far side (never on the line,
      // so the tracer riding the line never passes over it)
      const yL = up ? base - lvH * lv.of[i] - 6 : base + lvH * lv.of[i] + 6;
      pts = [{x: ax, y: edgeA}, {x: ax, y: yL}, {x: bx, y: yL}, {x: bx, y: edgeB}];
      labelAt = {x: (ax + bx) / 2, y: yL, side: up ? -1 : 1};
    } else {
      const t = a.top ? a : b, bo = a.top ? b : a;
      const xs = region.x + 6 + 10 * lv.of[i];
      const yT = t.y + t.chip.h / 2, yB = bo.y + bo.chip.h / 2;
      pts = a.top ? [{x: t.x, y: yT}, {x: xs, y: yT}, {x: xs, y: yB}, {x: bo.x, y: yB}] : [{x: bo.x, y: yB}, {x: xs, y: yB}, {x: xs, y: yT}, {x: t.x, y: yT}];
      labelAt = {x: xs + 8, y: (yT + yB) / 2};
      problems.push('cross-route');
    }
    const poly = polyline(pts);
    const col = kind === 'sequence' ? th.accent4 : kind === 'communication' ? th.accent2 : kind === 'causal' ? th.accent3 : th.inkSoft;
    const sw = kind === 'causal' ? 5 : 3.2;
    const text = (p.relationLabels && p.relationLabels[kind]) || kind;
    const lf = fitG(text, {maxWidth: 1e4, size: F, minSize: F, maxLines: 1, weight: 600});
    const lw = lf.width + F * 1.0 + (kind === 'sequence' ? 0 : 0), lh = lf.height + F * 0.6;
    const gapL = 5;
    const lb = labelAt.side ? {x: labelAt.x - lw / 2, y: labelAt.side < 0 ? labelAt.y - lh - gapL : labelAt.y + gapL, w: lw, h: lh} : {x: labelAt.x - lw / 2, y: labelAt.y - lh / 2, w: lw, h: lh};
    const node = g({name: `rel${i}`, opacity: 0},
      h('path', {name: `rel${i}-line`, d: poly.d(1), fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(poly.total, 1)} ${r(poly.total + 10, 1)}`, 'stroke-dashoffset': r(poly.total, 1)}),
      h('circle', {cx: r(pts[0].x), cy: r(pts[0].y), r: 4.5, fill: col}),
      h('circle', {cx: r(pts[pts.length - 1].x), cy: r(pts[pts.length - 1].y), r: 4.5, fill: col}));
    // a sequence shows its steps (1 at its start, 2 at its end) — an order as configured, no arrowhead
    const R = F * 1.0;
    const steps = kind === 'sequence' ? g({name: `rel${i}-steps`, opacity: 0},
      g({transform: T(pts[1].x, pts[1].y)}, letterBadge(ctx, '1', R, {text: showKey})),
      g({transform: T(pts[2].x, pts[2].y)}, letterBadge(ctx, '2', R, {text: showKey}))) : null;
    const labelNode = g(null,
      !showAll ? null : g({name: `rel${i}-label`, opacity: 0, transform: T(0, 0)},
        h('rect', {x: r(lb.x), y: r(lb.y), width: r(lb.w), height: r(lb.h), rx: r(Math.min(lb.h / 2, F * 0.6)), fill: th.card, stroke: col, 'stroke-width': 2.4}),
        textAt(lf, lb.x + F * 0.5, lb.y + F * 0.3, th.ink)),
      steps);
    const stepBoxes = kind === 'sequence' ? [pts[1], pts[2]].map(q => ({x: q.x - R, y: q.y - R, w: 2 * R, h: 2 * R})) : [];
    const rec = {kind, from: q.from, to: q.to, pts, poly, node, labelNode, lb: showAll ? lb : null, steps, stepBoxes, dx: 0};
    rec.moveLabel = d => { rec.dx += d; };
    return rec;
  });
  // ---- each label slides along its own bracket to where it is >= 20 px nearer its own line than any other line
  // (items 5 / 16: traceable), and no other line passes under it
  const segDist = (b, a, c) => {
    // distance from box b to segment a–c (axis-aligned segments)
    const x0 = Math.min(a.x, c.x), x1 = Math.max(a.x, c.x), y0 = Math.min(a.y, c.y), y1 = Math.max(a.y, c.y);
    const dx = Math.max(x0 - (b.x + b.w), 0, b.x - x1), dy = Math.max(y0 - (b.y + b.h), 0, b.y - y1);
    return Math.hypot(dx, dy);
  };
  const segsOf = o => o.pts.slice(0, -1).map((a, k2) => [a, o.pts[k2 + 1]]);
  const tracePx = 20 / px;
  rels.forEach((q, i) => {
    if (!q.lb) return;
    const own = segsOf(q), others = rels.filter((o, j) => j !== i).flatMap(segsOf);
    const ok = b => {
      const dOwn = Math.min(...own.map(([a, c]) => segDist(b, a, c)));
      const dOther = others.length ? Math.min(...others.map(([a, c]) => segDist(b, a, c))) : 1e9;
      return dOther >= dOwn + tracePx && dOther > 0.5;
    };
    if (ok(q.lb)) return;
    const lo = Math.min(q.pts[1].x, q.pts[2].x) - q.lb.w * 0.5, hi = Math.max(q.pts[1].x, q.pts[2].x) - q.lb.w * 0.5;
    // on the far side of its line first, else on the near side (between its line and the level below)
    const yL = q.pts[1].y, ys = [q.lb.y, yL + 5 * (q.lb.y < yL ? 1 : -1) - (q.lb.y < yL ? 0 : q.lb.h)];
    let best = null;
    for (const [si, y] of ys.entries()) for (let x = lo; x <= hi + 1e-6; x += 4) {
      const b = {...q.lb, x, y};
      const cost = Math.abs(x - q.lb.x) + si * 1000;
      if (ok(b) && !cards.some(c => overlaps(b, c.box, 4)) && (!best || cost < best.cost)) best = {b, cost};
    }
    if (best) { q.dx = best.b.x - q.lb.x; q.dy = best.b.y - q.lb.y; q.lb = best.b; } else problems.push('label-trace');
  });
  // ---- the tracer route: consecutive pairs of the traversal order, along their relationship (or straight)
  const order = (p.traversalOrder || []).filter(id => idsWithCard.has(id));
  const route = [];
  const routeMarks = [];
  order.forEach((id, j) => {
    const c = cardOf(id);
    if (j === 1 && !route.length) { /* the route starts on the first connector (below) */ }
    if (j === 0) { routeMarks.push({id, at: 0}); return; }
    const prev = order[j - 1];
    const q = rels.find(rr => (rr.from === prev && rr.to === id) || (rr.from === id && rr.to === prev));
    const lift = pts => pts.map((pt, k2) => (k2 === 0 || k2 === pts.length - 1 ? {x: pt.x, y: pt.y + (pts[1] && pts[1].y < pt.y ? -1 : 1) * (F * 0.45 + 8)} : pt));
    const seq = q ? lift(q.from === prev ? q.pts : [...q.pts].reverse()) : [c.top ? {x: c.anchor.x, y: c.y - F * 0.45 - 8} : {x: c.anchor.x, y: c.y + c.chip.h + F * 0.45 + 8}];
    for (const pt of seq) route.push(pt);
    const len = polyline(route).total;
    routeMarks.push({id, at: len});
    if (j === 1) routeMarks[0].at = 0;
  });
  const routePoly = polyline(route.length ? route : [{x: 0, y: 0}]);
  // ---- audit: cards, relation labels, steps and panel apart; nothing outside the frame
  const cardBoxes = cards.map(c => c.box);
  const focusId = p.focusElement;
  const focusScale = 1.18;
  const fc = cardOf(focusId);
  const labelBoxes = rels.map(q => q.lb).filter(Boolean);
  const all = [...cardBoxes, ...labelBoxes, ...rels.flatMap(q => q.stepBoxes), ...(panel ? panel.boxes : [])];
  let cardsClear = true, labelsClear = true;
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlaps(all[i], all[j], 3)) { problems.push('overlap'); labelsClear = false; i = all.length; break; }
  if (fc) {
    // the enlarged focus card must stay clear of its neighbours and of every label
    const fb = {x: fc.anchor.x - (fc.anchor.x - fc.box.x) * focusScale, y: fc.anchor.y - (fc.anchor.y - fc.box.y) * focusScale, w: fc.box.w * focusScale, h: fc.box.h * focusScale};
    if ([...cardBoxes.filter(b => b !== fc.box), ...labelBoxes].some(b => overlaps(fb, b, 2))) { cardsClear = false; problems.push('focus-overlap'); }
  }
  if (all.some(b => b.x < -0.5 || b.y < -0.5 || b.x + b.w > D.w + 0.5 || b.y + b.h > D.h + 0.5)) problems.push('frame');
  if (panel && panel.boxes.some(b => overlaps(b, bOuter, 2))) problems.push('panel-on-plan');
  if (showKey) {
    const ext = unionBox([bOuter, ...all]);
    if (Math.min(ext.w / D.w, ext.h / D.h) < 0.78) problems.push('fill');
  }
  const art = delibArt(ctx, G, {prefix: 's', closure: 'door', rails: true});
  return {
    planShare: (bOuter.w * bOuter.h) / (ctx.design.w * ctx.design.h), levelsNeeded, F, px, k, M, G, art, people, badgeAt, badgeNodes, moveVec, cards, rels, route: routePoly, routeMarks,
    focusId, focusScale, focusPart: parts[focusId] || parts.partition, cardsClear, labelsClear,
    panelNode: panel ? panel.node : null, hasStates: Boolean(panel && showAll),
    personPx: S.personPx, problems, arrangement: `${A.key}/tb${Math.round(topBand)}/lv${nLevels.top}/pb${Math.round(panel ? panel.height : 0)}`,
  };
}

/** A text-less token card for an element (labels hidden): its glyph on a card. */
function tokenCard(ctx, id, F) {
  const th = ctx.theme;
  const s = F * 2.4;
  const kind = {publicSpace: 'pub', zone: 'zone', partition: 'partition', track: 'track', participants: 'person', building: 'building'}[id];
  return {
    w: s, h: s, fit: {truncated: false},
    node: (x, y, name) => g({name},
      h('rect', {name: name && `${name}-body`, x: r(x), y: r(y), width: r(s), height: r(s), rx: r(s * 0.25), fill: th.card, stroke: th.ink, 'stroke-width': 2.4}),
      g({transform: T(x + s / 2, y + s / 2)}, delibGlyph(ctx, kind, s * 0.8))),
  };
}

/** How many drawable relationships touch element id. */
function relsAt(rels, id) {
  return rels.filter(q => q.from === id || q.to === id).length;
}

/**
 * Levels of the same-band brackets: shortest spans lowest; a relationship takes the lowest level where its span
 * (between the two card centres) does not overlap another one's. Returns {of: level per relationship, levels}.
 */
function assignLevels(rels, cards, region, labW) {
  const cx = id => { const c = cards.find(q => q.id === id); return c ? (c.x ?? 0) + c.chip.w / 2 : 0; };
  // (before the cards are placed, their order along the plan is enough: spans by index)
  const order = ['track', 'participants', 'publicSpace', 'partition', 'zone', 'building'];
  const pos = id => (cards.find(q => q.id === id) && cards.find(q => q.id === id).x !== undefined ? cx(id) : order.indexOf(id) * 100 + region.x);
  const of = rels.map(() => 0);
  const byBand = {top: [], bottom: []};
  rels.forEach((q, i) => {
    const a = cards.find(c => c.id === q.from), b = cards.find(c => c.id === q.to);
    if (!a || !b || a.top !== b.top) return;
    // the span covers both attach points and the label centred between them
    const c0 = Math.min(pos(q.from), pos(q.to)), c1 = Math.max(pos(q.from), pos(q.to));
    const mid = (c0 + c1) / 2, hw = labW(q.kind) / 2;
    byBand[a.top ? 'top' : 'bottom'].push({i, s0: Math.min(c0, mid - hw), s1: Math.max(c1, mid + hw), len: c1 - c0});
  });
  const levels = {top: 0, bottom: 0};
  for (const band of ['top', 'bottom']) {
    const list = byBand[band].sort((p, q) => p.len - q.len);
    const used = [];
    for (const it of list) {
      let L = 0;
      while ((used[L] || []).some(o => it.s0 < o.s1 + 1 && o.s0 < it.s1 - 1)) L++;
      (used[L] = used[L] || []).push(it);
      of[it.i] = L;
    }
    levels[band] = used.length;
  }
  return {of, levels};
}

/** The panel's items. */
function panelItems(ctx, p, F, showAll, showKey, bname, onCards) {
  const items = [];
  // (what a card already carries as its caption is not repeated here)
  if (showKey) {
    if (!onCards.has('publicSpace')) items.push(legendItem(ctx, {kind: 'pub', text: p.courts.hearing, F, name: 'legend-pub', weight: 700}));
    if (!onCards.has('zone')) items.push(legendItem(ctx, {kind: 'zone', text: p.courts.deliberation, F, name: 'legend-zone', weight: 700}));
    const b = p.elements.find(e => e.id === 'building');
    // (square: the building's card joins the legend, under the building's name)
    if (!onCards.has('building')) items.push(bname && b ? legendItem2(ctx, {kind: 'building', title: p.courts.building, text: b.label, F, name: 'legend-building'}) : legendItem(ctx, {kind: 'building', text: p.courts.building, F, name: 'legend-building', weight: 600}));
    if (!onCards.has('participants')) items.push(legendItem(ctx, {kind: 'letter', text: p.seats.participants.map(q => q.name).join(' · '), F, name: 'legend-people', maxLines: 12, glyphOpts: {letter: LETTERS[0]}}));
  }
  if (showAll) {
    items.push(legendItem(ctx, {kind: 'bench', text: p.seats.bench, F, name: 'legend-bench'}));
    if (!onCards.has('partition')) items.push(legendItem(ctx, {kind: 'partition', text: p.routes.partition, F, name: 'legend-partition'}));
    if (!onCards.has('track')) items.push(legendItem(ctx, {kind: 'track', text: p.routes.track, F, name: 'legend-track'}));
    items.push(legendItem(ctx, {kind: 'gap', text: p.labels.gap, F, name: 'legend-gap'}));
    if (p.relationships.some(q => q.kind === 'sequence')) items.push(legendItem(ctx, {kind: 'sequence', text: p.labels.sequence, F, name: 'legend-sequence'}));
    items.push({type: 'caption', make: w => { const it = captionItem(ctx, ctx.t.states, F, 'states-text').make(w); return {...it, node: (x, y) => g({name: 'states', opacity: 0}, it.node(x, y))}; }});
  }
  if (showKey) items.push(keyItem(ctx, p.labels.key, F));
  return items;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-08-mechanism',
    title: 'Separate deliberation — the elements of the moving apart and their supplied relationships',
    titleEs: 'Deliberación separada — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Deliberación separada',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The floor plan of a generic building decomposed into the elements of the action — the public space (●), the abstract zone (◆), the partition with its door, the track, the seated participants and the building — each with a card on its part. Only the supplied relationships are drawn, as plain lines labelled by kind (a sequence shows its steps; no arrowheads); a tracer follows the supplied traversal order while the focus element is enlarged; origin, transformation and state stay visible at the end. No rule, attendance, vote or outcome is shown.',
    tags: ['floor plan', 'mechanism', 'relationships', 'tracer', 'partition', 'track', 'hearing room', 'deliberation zone', 'participants', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/deliberacion-separada.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
