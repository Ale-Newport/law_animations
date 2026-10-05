/**
 * LAW-0499 — Cláusula de terminación · contrast
 *
 * Storyboard (two complete rooms, identical except one supplied fact: the state of the circumstance — "Circumstance provided (as
 * supplied)" in room A, "Circumstance undescribed (as supplied)" in room B):
 *  0.00–0.17  base: both rooms show the same contract board, the same two people, the same circumstance card "Circumstance 1
 *             (supplied)" seated in its slot with its state window still blank, and the same clause cards with the
 *             bracket open in its track — identical.
 *  0.17–0.40  change: the state row appears on each circumstance card, ringed — ● "Circumstance provided (as supplied)" in room A,
 *             ◆ "Circumstance undescribed (as supplied)" in room B (same glyph area, colour, stroke and type); the room headers
 *             name the supplied variant.
 *  0.42–0.66  the concrete action, as the supplied configuration: in the room whose circumstance is provided, Party B's hand
 *             slides the bracket shut on the supplied section (it marks the section, nothing else); in the room whose
 *             circumstance is undescribed the bracket stays open and the hand stays at rest. The geometry differs only there.
 *  0.77–1.00  guide: the state row ringed in both rooms with the same tag "Only this differs"; the shared strip names the
 *             changed fact, each room's supplied configuration (equal chips), the parties, the shared facts and the key
 *             "As supplied · no conclusion drawn". No winner, score or outcome.
 * No rule on conditions: no fulfilment, no automatic effect, no clause becoming due, binding or enforceable; no
 * jurisdiction. Provided and undescribed have equal weight.
 * @module animations/contract-terms/LAW-0499
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {r, seg} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, STATES, PX_BASE, PX_STRESS, INK,
  layoutStage, stageArt, makeRigs, oblNodes, eventNode, bracketNode, moveAt, grabFor, handOf, holding,
  localizeScene, fitG, chipG, placeNotes, notesHeight, headBox, overlaps, armClear,
} from './kits/clausula-terminacion.js';

const ID = 'LAW-0499';
const DURATION = 7500;
const W = {head: [0.17, 0.22], state: [0.2, 0.3], ringIn: [0.22, 0.28], ringOut: [0.36, 0.4], br: [0.42, 0.66], guide: [0.78, 0.83], strip: [0.8, 0.85]};
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};

const STRINGS = {
  en: {...KIT_STRINGS.en, only: 'Only this differs', partiesT: 'Left: {a} · right: {b}', changedIs: 'Changed fact: {fact}', roomMarked: '{b}: section marked as supplied', roomUnmarked: '{b}: section not marked · as supplied', stateIs: '{b}: {s}'},
  es: {...KIT_STRINGS.es, only: 'Solo esto cambia', partiesT: 'Izquierda: {a} · derecha: {b}', changedIs: 'Hecho que cambia: {fact}', roomMarked: '{b}: apartado marcado según lo aportado', roomUnmarked: '{b}: apartado sin marcar · según lo aportado', stateIs: '{b}: {s}'},
};

const scenario = d => obj(d, {
  label: str('Header of the room: the supplied variant', 70),
  state: oneOf('The supplied state of the circumstance in this room', STATES),
}, ['label', 'state']);

const sceneSchema = {
  ...motifFields,
  changedFact: obj('The single changed fact', {label: str('Name of the changed fact, shown in the shared strip', 70)}, ['label']),
  scenarioA: scenario('Room A'),
  scenarioB: scenario('Room B'),
  sharedFacts: list('Facts shared by both rooms, shown in the shared strip', str('Shared fact', 70), 0, 2),
  comparisonLabels: obj('Badge letters of the two rooms', {a: str('Badge of room A', 3), b: str('Badge of room B', 3)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  clauses: ['Clause 1 (supplied text)', 'Clause 2 (supplied text)'],
  section: {from: 1, to: 2},
  changedFact: {label: 'the state of circumstance 1'},
  scenarioA: {label: 'Circumstance 1 provided (as supplied)', state: 'provided'},
  scenarioB: {label: 'Circumstance 1 undescribed (as supplied)', state: 'undescribed'},
  sharedFacts: ['Same contract, parties, clauses and section'],
  comparisonLabels: {a: 'A', b: 'B'},
};

const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  clauses: ['Apartado 1 (texto aportado)', 'Apartado 2 (texto aportado)'],
  changedFact: {label: 'el estado de la comunicación 1'},
  scenarioA: {label: 'Comunicación 1 previsto (según lo aportado)', state: 'provided'},
  scenarioB: {label: 'Comunicación 1 no descrito (según lo aportado)', state: 'undescribed'},
  sharedFacts: ['Mismo contrato, partes, apartados y apartado'],
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.clauses, p.circumstance.label].some(t => t.length > 40);
const ROOMS = ['a', 'b'];

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 1000], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const upx = unitPx(ctx);
    const show = ctx.show('all'), showKey = ctx.show('key');
    const stress = isStress(p);
    const pxs = stress ? PX_STRESS : PX_BASE;
    const headMin = stress ? 45 : shape === 'square' ? 55 : 60;
    const box = {x: 6, y: 4, w: D.w - 12, h: D.h - 8};
    const scen = {a: p.scenarioA, b: p.scenarioB};
    let best = null;
    // arrangements, preferred first: [rooms side by side | stacked, cards printed | print bars with their texts in the strip]
    // [rooms side by side | stacked, cards printed | print bars, panel = strip below | column at the right (1:1: CF
    // CONTRAST 1:1 STAGE SHARE decision, 2026-10-04)]
    // 1:1 'compact' fallback (three clauses, where the stacked rooms cannot hold three rows and the people): the rooms
    // side by side, each a tall board — printed cards stacked (section and its track on top, the circumstance card under them,
    // its tag in the heading band above it) or, for the longest texts, print bars with their texts in the strip —; the
    // contract heading moves to the strip, the track is shorter, the people's heads ≥ 48 px and the text ≥ 16 px.
    const arrs = shape === 'landscape' ? [['side', true, 'strip'], ['side', false, 'strip']]
      : shape === 'square' ? [['stack', true, 'col'], ['stack', false, 'col'], ['side', false, 'strip'], ['side', true, 'strip', 'compact'], ['side', false, 'strip', 'compact']]
        : [['stack', true, 'strip'], ['stack', false, 'strip']];
    const tagChip = (F, w) => chipG(ctx, ctx.t.only, {x: 0, y: 0, anchor: 'middle', maxWidth: w, size: F, maxLines: 2, weight: 700, stroke: ctx.theme.accent});
    for (const [arr, cardText, panel, compact] of arrs) for (const px of (compact ? PX_STRESS : pxs)) for (const eventShare of [0.5, 0.58]) {
      if (best) break;
      const F = px / upx;
      const side = arr === 'side';
      const hm = compact ? Math.min(headMin, 48) : headMin;
      const colW = panel === 'col' ? Math.max(box.w * 0.34, F * 14) : 0;
      const roomW = side ? (box.w - F * 0.8) / 2 : box.w - (colW ? colW + F * 0.6 : 0);
      const headFits = ROOMS.map(s => (show ? fitG(scen[s].label, {maxWidth: roomW - F * 3.2, size: F, maxLines: 2, weight: 700}) : null));
      if (headFits.some(f => f && f.bad)) continue;
      const headH = headFits[0] ? Math.max(...headFits.map(f => f.height)) + F * 0.7 : F * 1.6;
      const items = [];
      if (show && (!cardText || panel === 'col' || compact)) items.push({name: 'contract', kind: 'legend', text: `${p.contract.reference} · ${p.contract.title}`});
      if (show && !cardText) {
        items.push({name: 'legend-ev', kind: 'legend', text: `${p.panels.circumstance}: ${p.circumstance.label}`});
        p.clauses.forEach((t, j) => items.push({name: `legend-o${j}`, kind: 'legend', text: `${p.panels.section}: ${t}`}));
      }
      if (show) items.push({name: 'changed', kind: 'changed', text: ctx.t.changedIs.replace('{fact}', p.changedFact.label)});
      if (show) ROOMS.forEach(s => items.push({name: `cfg-${s}`, kind: 'cfg', text: (scen[s].state === 'provided' ? ctx.t.roomMarked : ctx.t.roomUnmarked).replace('{b}', p.comparisonLabels[s])}));
      if (showKey) items.push({name: 'parties', kind: 'shared', text: ctx.t.partiesT.replace('{a}', p.parties[0].name).replace('{b}', p.parties[1].name)});
      if (show) p.sharedFacts.forEach((t, i) => items.push({name: `shared${i}`, kind: 'shared', text: t}));
      if (showKey) items.push({name: 'key', kind: 'key', text: ctx.t.key});
      const stripH = panel === 'col' ? 0 : notesHeight(ctx, items, box.w - F, F, 2);
      if (!Number.isFinite(stripH)) continue;
      let colPl = null;
      if (panel === 'col') {
        colPl = placeNotes(ctx, items, {x: box.x + box.w - colW, y: box.y, w: colW, h: box.h}, F, 1);
        if (!colPl) continue;
        const hh = colPl.placed.reduce((a, q) => a + q.c.box.h + F * 0.45, -F * 0.45);
        if (hh > box.h) continue;
        let y = box.y + (box.h - hh) / 2;
        for (const q of colPl.placed) { q.x = box.x + box.w - colW + (colW - q.c.box.w) / 2; q.y = y; y += q.c.box.h + F * 0.45; }
      }
      const avail = box.h - stripH - (stripH ? F * 0.5 : 0);
      const roomH = side ? avail : (avail - F * 0.6) / 2;
      // (each room ≥ 0.40 of the frame along its arrangement axis — with a margin for the rendered text widths)
      if (!side && roomH / box.h < 0.41) continue;
      const rooms = ROOMS.map((s, i) => (side ? {x: box.x + i * (roomW + F * 0.8), y: box.y, w: roomW, h: roomH} : {x: box.x, y: box.y + i * (roomH + F * 0.6), w: roomW, h: roomH}));
        const Ls = [];
      rooms.forEach((rb, i) => Ls.push(layoutStage(ctx, {kOnly: i && Ls[0].ok ? Ls[0].k : undefined,
        box: {x: rb.x + F * 0.3, y: rb.y + headH + F * 0.3, w: rb.w - F * 0.6, h: rb.h - headH - F * 0.5}, upx, prefix: `${ROOMS[i]}-`, p,
        px: [px], headMin: hm, headTarget: 0, kMax: arr === 'stack' && panel === 'strip' ? 1.6 : Math.min(1.6, (hm + 8) / (90 * upx)), tight: true, cardText, headText: cardText && panel !== 'col' && !compact, headings: cardText && !compact,
        names: null, plates: null, notes: [], tray: false, minCh: (compact ? (cardText ? 54 : 44) : 71) / upx, minChE: (compact && !cardText ? 60 : shape === 'square' && !stress && !compact ? 86 : 71) / upx, compactTrack: !!compact, stack: !!compact && cardText, eventFullWidth: !!compact && cardText,
        slotRoom: show && cardText ? (F0, w) => tagChip(F0, w).box.h + F0 * 0.5 : null, eventShare, minCwE: (shape === 'square' && !stress && !compact ? 86 : 71) / upx, minCwO: 71 / upx, reachEvent: false,
      })));
      if (Ls.some(L => !L.ok)) continue;
      best = {px, F, Ls, rooms, headFits, headH, items, stripH, roomW, arr, cardText, panel, colPl, compact: !!compact};
    }
    if (!best) return {ok: false, why: ['no-layout-fits'], problems: ['no-layout-fits']};
    const {F, Ls, rooms, headFits, headH, items, stripH} = best;
    void items;
    const L = {ok: true, why: [], F, FL: F, upx, show, showKey, Ls, rooms, headFits, headH, box, scen, cardText: best.cardText, arr: best.arr};
    Ls.forEach((Lr, i) => {
      Lr.rigs = makeRigs(ctx, Lr, p.parties);
      Lr.state = scen[ROOMS[i]].state;
    });
    const sb = {x: box.x + F * 0.5, y: box.y + box.h - stripH, w: box.w - F, h: stripH};
    L.strip = best.colPl || (items.length ? placeNotes(ctx, items, sb, F, 2) : null);
    // the "only this differs" tags: under each room's circumstance card
    L.tags = Ls.map((Lr, i) => {
      if (!show || !L.cardText) return null;
      const G = Lr.G;
      const c = chipG(ctx, ctx.t.only, {x: G.slot.x, y: 0, anchor: 'middle', maxWidth: G.We - F * 0.4, size: F, maxLines: 2, weight: 700, stroke: ctx.theme.accent, name: `${ROOMS[i]}-tag`});
      if (G.stack) {
        // (the compact 1:1 fallback — a stacked board —: the tag in the circumstance panel's heading band, above the card)
        const room = G.slot.y - G.chE / 2 - G.panelE.y;
        return {c, y: G.panelE.y + (room - c.box.h) / 2, ok: c.box.h <= room - 2};
      }
      const yTop = G.slot.y + G.chE / 2 + Math.max(8, F * 0.3);
      return {c, y: yTop, ok: yTop + c.box.h <= G.panelE.y + G.panelE.h - 2};
    });
    L.tagsFit = L.tags.every(t => !t || t.ok);
    L.headsClear = Ls.every(Lr => [headBox(Lr.G.figA), headBox(Lr.G.figB)].every(hb => !overlaps(hb, Lr.G.board, -1)));
    L.roomShare = Math.min(...rooms.map(rb => (best.arr === 'side' ? rb.w / box.w : rb.h / box.h)));
    if (!L.tagsFit) L.why.push('tag-under-card');
    if (!L.headsClear) L.why.push('head-over-board');
    L.ok = L.tagsFit && L.headsClear;
    L.problems = L.why;
    return L;
  },
  build(ctx, L) {
    const p = ctx.params;
    if (!L.Ls) return g({name: 'scene'});
    const th = ctx.theme;
    const F = L.F;
    const rooms = L.Ls.map((Lr, i) => {
      const s = ROOMS[i];
      const rb = L.rooms[i];
      const badgeR = F * 0.82;
      const bx = rb.x + F * 0.4 + badgeR, by = rb.y + L.headH / 2;
      const head = g({name: `${s}-head`},
        h('circle', {cx: r(bx), cy: r(by), r: r(badgeR), fill: s === 'a' ? th.accent2 : th.accent3, stroke: INK, 'stroke-width': 2.4}),
        L.show || L.showKey ? textBlock(fitG(p.comparisonLabels[s], {maxWidth: badgeR * 1.8, size: F, maxLines: 1, weight: 800}), {x: r(bx), y: r(by - F * 0.5), anchor: 'middle', fill: '#fff'}) : null,
        L.headFits[i] ? g({name: `${s}-head-label`, opacity: 0}, textBlock(L.headFits[i], {x: r(bx + badgeR + F * 0.5), y: r(by - L.headFits[i].height / 2), fill: th.fg})) : null);
      const tag = L.tags[i] ? g({name: `${s}-tagg`, opacity: 0, transform: T(0, L.tags[i].y)}, L.tags[i].c.node) : null;
      return g({name: `${s}-room`},
        h('path', {name: `${s}-frame`, d: roundRectPath(rb.x, rb.y, rb.w, rb.h, 16), fill: th.dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,253,248,0.55)', stroke: th.inkSoft, 'stroke-width': 2}),
        head,
        stageArt(ctx, Lr),
        oblNodes(ctx, Lr, p.clauses),
        bracketNode(ctx, Lr, false),
        eventNode(ctx, Lr, Lr.state, {at: Lr.G.slot, ring: true}),
        tag,
        Lr.rigs[0].node, Lr.rigs[1].node);
    });
    const strip = L.strip ? L.strip.placed.map(q => g({name: q.it.name, opacity: 0, transform: T(q.x - q.c.box.x, q.y - q.c.box.y)}, q.c.node)) : [];
    return g({name: 'scene'}, rooms, strip);
  },
  frame(ctx, L, u) {
    if (!L.Ls) return {nodes: {}, semantic: {layoutOk: false, why: L.why.join(','), problems: ['no-layout-fits']}};
    const nodes = {};
    const sem = {};
    const looks = [];
    L.Ls.forEach((Lr, i) => {
      const s = ROOMS[i];
      const G = Lr.G, P = Lr.P;
      const provided = Lr.state === 'provided';
      // the state row appears (the changed fact), ringed
      const st = seg(u, ...W.state);
      nodes[`${P}ev-in-st-${Lr.state}`] = {opacity: r(st, 3)};
      const ring = Math.max(seg(u, ...W.ringIn) * (1 - seg(u, ...W.ringOut)), seg(u, ...W.guide));
      nodes[`${P}ev-in-ring`] = {opacity: r(ring, 3)};
      // the bracket: shut by Party B's hand where the circumstance is provided; open where it is undescribed
      const from = {x: G.B.openX, y: G.B.top}, to = {x: G.B.closedX, y: G.B.top};
      const br = moveAt(provided ? W.br : null, from, to, u);
      nodes[`${P}br`] = {transform: T(r(br.pos.x, 2), r(br.pos.y, 2))};
      const rest = [G.figA, G.figB].map((fg, k) => Lr.rigs[k].frame({x: fg.x, y: fg.floor, facing: fg.f, scale: fg.k}).hands.near);
      const knob = q => G.knobAt(q.x);
      const hB = provided ? handOf([grabFor(W.br, from, to, knob)], rest[1], u) : null;
      const pa = Lr.rigs[0].frame({x: G.figA.x, y: G.figA.floor, facing: 1, scale: G.k, headTilt: 3});
      const pb = Lr.rigs[1].frame({x: G.figB.x, y: G.figB.floor, facing: -1, scale: G.k, near: hB, headTilt: br.moving ? -4 : 3});
      Object.assign(nodes, pa.nodes, pb.nodes);
      if (L.headFits[i]) nodes[`${s}-head-label`] = {opacity: r(seg(u, ...W.head), 3)};
      if (L.tags[i]) nodes[`${s}-tagg`] = {opacity: r(seg(u, ...W.guide), 3)};
      const S = s.toUpperCase();
      sem[`br${S}`] = {x: r(br.pos.x), y: r(br.pos.y)};
      sem[`hand${S}B`] = {x: r(pb.hands.near.x), y: r(pb.hands.near.y)};
      sem[`hand${S}A`] = {x: r(pa.hands.near.x), y: r(pa.hands.near.y)};
      sem[`held${S}`] = provided && holding(W.br, u) ? {grip: {x: r(knob(br.pos).x), y: r(knob(br.pos).y)}} : null;
      sem[`reached${s}`] = pa.reached && pb.reached;
      sem[`armsClear${s}`] = armClear(pa.nodes, `${P}A`) && armClear(pb.nodes, `${P}B`);
      sem[`state${S}`] = st > 0 ? Lr.state : 'none';
      sem[`bracket${S}`] = br.where === 'to' ? 'closed' : br.moving ? 'moving' : 'open';
      const rb = L.rooms[i];
      looks.push(JSON.stringify({st: st > 0 ? 'shown' : 'none', ring: r(ring, 2), br: [r(br.pos.x - rb.x), r(br.pos.y - rb.y)], hB: hB ? [r(hB.x - rb.x), r(hB.y - rb.y)] : null}));
    });
    if (L.strip) for (const q of L.strip.placed) {
      const nm = q.it.name;
      const op = q.it.kind === 'legend' || nm === 'parties' ? 1 : nm.startsWith('cfg-') || nm === 'changed' || q.it.kind === 'shared' || nm === 'key' ? seg(u, ...W.strip) : 1;
      nodes[nm] = {opacity: r(op, 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat, ...sem,
        lookA: looks[0], lookB: looks[1],
        allReached: sem.reacheda && sem.reachedb, armsClear: sem.armsCleara && sem.armsClearb,
        guide: r(seg(u, ...W.guide), 3),
        layoutOk: L.ok, why: L.why.join(','), problems: L.problems,
        textPx: r(L.F * L.upx, 2), headPx: r(90 * L.Ls[0].G.k * L.upx, 1), roomShare: r(L.roomShare, 3),
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
    slug: 'contract-terms-05-contrast',
    title: 'Activation circumstance, without a rule — the same contract with the circumstance provided or undescribed, in two rooms',
    titleEs: 'Cláusula de terminación — Comparación de dos supuestos',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Cláusula de terminación',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two rooms with the same contract board, the same two parties, the same circumstance card "Circumstance 1 (supplied)" seated in its slot and the same clause cards with a neutral bracket open in its track. Only the supplied state of the circumstance differs: the state row appears ringed — ● "Circumstance provided (as supplied)" in room A, ◆ "Circumstance undescribed (as supplied)" in room B, drawn alike. As the supplied configuration, in the room whose circumstance is provided Party B slides the bracket shut on the supplied section (it only marks it); in the other room the bracket stays open. The state row is ringed in both rooms with "Only this differs"; the shared strip names the changed fact, each room\'s configuration, the shared facts and the key "As supplied · no conclusion drawn". No winner, score or outcome.',
    tags: ['activation circumstance', 'circumstance', 'provided', 'undescribed', 'section', 'bracket', 'comparison', 'changed fact', 'equal weight', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/clausula-terminacion.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
