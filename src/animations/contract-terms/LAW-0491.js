/**
 * LAW-0491 — Obligaciones recíprocas · contrast
 *
 * Storyboard (two complete rooms, identical except one supplied fact: the column the performance "Performance 2
 * (supplied text)" is listed in — "Obligation of A" in room A, "Obligation of B" in room B):
 *  0.00–0.17  base: both rooms show the same contract board, the same people and the same shared performances seated in
 *             their columns (A1 in column A, B1 in column B); both trays empty — identical.
 *  0.17–0.40  change: in room A the performance card arrives in Party A's tray, in room B in Party B's tray, each with a
 *             highlight ring; the room headers name the supplied variant.
 *  0.42–0.77  the concrete action in parallel: in room A Party A's hand seats the card in column A, in room B Party B's
 *             hand seats it in column B (the same motion, mirrored, at the same time); then the shared links draw on
 *             from both ends at once in both rooms.
 *  0.77–1.00  guide: the changed card is ringed in both rooms with the same tag "Only this differs"; the shared strip
 *             names the changed fact and the key "As supplied · no conclusion drawn". No winner, score or outcome.
 * A link means only "linked as supplied": no exchange that is due, no condition, no order of performance, no breach,
 * remedy or termination; no jurisdiction. Obligation A and obligation B have equal weight, size and timing.
 * @module animations/contract-terms/LAW-0491
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {fitDesign} from '../../core/layout.js';
import {r, seg, ease} from '../../core/time.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, obj, list, oneOf} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  motifFields, DEFAULT_CONTENT, DEFAULT_CONTENT_ES, KIT_STRINGS, PX_BASE, PX_STRESS, validLinks, INK,
  layoutBoard, boardArt, makeRigs, nameNodes, linkNodes, cardNodes, perfCard, cardAt, grabsFor, handOf, poseLinks,
  localizeScene, fitG, chipG, placeNotes, notesHeight, headBox, overlaps, partyColor,
} from './kits/obligaciones-reciprocas.js';

const ID = 'LAW-0491';
const DURATION = 7500;
const W = {head: [0.17, 0.22], arrive: [0.2, 0.3], ringIn: [0.22, 0.28], ringOut: [0.36, 0.4], pass: [0.42, 0.62], link: [0.62, 0.74], guide: [0.78, 0.83], strip: [0.8, 0.85]};
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};

const STRINGS = {
  en: {...KIT_STRINGS.en, only: 'Only this differs', ringed: 'Ringed card: {p}', partiesT: 'Left: {a} · right: {b}', changedIs: 'Changed fact: {fact}'},
  es: {...KIT_STRINGS.es, only: 'Solo esto cambia', ringed: 'Tarjeta rodeada: {p}', partiesT: 'Izquierda: {a} · derecha: {b}', changedIs: 'Hecho que cambia: {fact}'},
};

const scenario = (d, col) => obj(d, {
  label: str('Header of the room: the supplied variant', 70),
  column: oneOf('The column the changed performance is listed in, in this room', ['a', 'b']),
}, ['label', 'column']);

const sceneSchema = {
  ...motifFields,
  changedFact: obj('The single changed fact: one performance whose column differs between the rooms', {
    performance: str('The performance, as supplied (generic, fictional placeholder)', 70),
    label: str('Name of the changed fact, shown in the shared strip', 70),
  }, ['performance', 'label']),
  scenarioA: scenario('Room A'),
  scenarioB: scenario('Room B'),
  sharedFacts: list('Facts shared by both rooms, shown in the shared strip', str('Shared fact', 70), 0, 2),
  comparisonLabels: obj('Badge letters of the two rooms', {a: str('Badge of room A', 3), b: str('Badge of room B', 3)}),
};

const defaultParams = {
  ...DEFAULT_CONTENT,
  performancesA: ['Performance A1 (supplied text)'],
  performancesB: ['Performance B1 (supplied text)'],
  links: [{a: 1, b: 1}],
  changedFact: {performance: 'Performance 2 (supplied text)', label: 'the column of Performance 2'},
  scenarioA: {label: 'Performance 2 as obligation of A (as supplied)', column: 'a'},
  scenarioB: {label: 'Performance 2 as obligation of B (as supplied)', column: 'b'},
  sharedFacts: ['Same contract, parties, A1, B1 and link'],
  comparisonLabels: {a: 'A', b: 'B'},
};

const defaultParamsEs = {
  ...DEFAULT_CONTENT_ES,
  performancesA: ['Prestación A1 (texto aportado)'],
  performancesB: ['Prestación B1 (texto aportado)'],
  changedFact: {performance: 'Prestación 2 (texto aportado)', label: 'la columna de la prestación 2'},
  scenarioA: {label: 'Prestación 2 como obligación de A (según lo aportado)', column: 'a'},
  scenarioB: {label: 'Prestación 2 como obligación de B (según lo aportado)', column: 'b'},
  sharedFacts: ['Mismo contrato, partes, A1, B1 y enlace'],
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

const isStress = p => [...p.performancesA, ...p.performancesB, p.changedFact.performance].some(t => t.length > 40);
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
    const nRows = Math.max(p.performancesA.length, p.performancesB.length) + 1;
    const captions = [0, 1].map(i => p.parties[i].name);
    const scen = {a: p.scenarioA, b: p.scenarioB};
    let best = null;
    // arrangements, preferred first: [rooms side by side | stacked, people beside | under the board, cards printed |
    // print bars with their texts drawn once in the panel, panel = strip below | column at the right]
    const arrs = shape === 'landscape' ? [['side', 'beside', true, 'strip'], ['side', 'under', true, 'strip'], ['side', 'under', false, 'strip'], ['side', 'beside', false, 'strip']]
      : shape === 'square' ? [['side', 'under', true, 'strip'], ['side', 'beside', false, 'strip'], ['side', 'under', false, 'strip'], ['stack', 'beside', false, 'col']]
        : [['stack', 'beside', true, 'strip'], ['stack', 'under', true, 'strip'], ['stack', 'beside', false, 'strip'], ['stack', 'under', false, 'strip']];
    // the changed card is a real object, never a token: ≥ 85 px at 1:1 outside the stress preset, ≥ 70 px otherwise
    const minCardPx = shape === 'square' && !stress ? 86 : 71;
    for (const [arr, mode, cardText, panel] of arrs) for (const px of pxs) {
      if (best) break;
      const F = px / upx;
      const side = arr === 'side';
      const colW = panel === 'col' ? Math.max(box.w * 0.36, F * 15) : 0;
      const roomW = side ? (box.w - F * 0.8) / 2 : box.w - (colW ? colW + F * 0.6 : 0);
      // room headers: badge + supplied label (in the panel when it is a column)
      const headIn = panel !== 'col';
      const headFits = ROOMS.map(s => (show && headIn ? fitG(scen[s].label, {maxWidth: roomW - F * 3.2, size: F, maxLines: 2, weight: 700}) : null));
      if (headFits.some(f => f && f.bad)) continue;
      const headH = headFits[0] ? Math.max(...headFits.map(f => f.height)) + F * 0.7 : F * 1.6;
      // the shared panel: room headers (column panel), card texts (print-bar cards), changed fact, parties, shared facts, key
      const items = [];
      if (show && !headIn) ROOMS.forEach(s => items.push({name: `${s}-head-chip`, kind: 'head', text: `${p.comparisonLabels[s]} · ${scen[s].label}`}));
      if (show && (panel === 'col' || !cardText)) items.push({name: 'contract', kind: 'legend', text: `${p.contract.reference} · ${p.contract.title}`});
      if (show && !cardText) {
        items.push({name: 'legend-x', kind: 'legendx', text: ctx.t.ringed.replace('{p}', p.changedFact.performance)});
        p.performancesA.forEach((t, j) => items.push({name: `legend-a${j}`, kind: 'legend', text: `${p.columns.a}: ${t}`}));
        p.performancesB.forEach((t, j) => items.push({name: `legend-b${j}`, kind: 'legend', text: `${p.columns.b}: ${t}`}));
      }
      if (show) items.push({name: 'changed', kind: 'changed', text: ctx.t.changedIs.replace('{fact}', p.changedFact.label)});
      if (showKey) items.push({name: 'parties', kind: 'shared', text: ctx.t.partiesT.replace('{a}', p.parties[0].name).replace('{b}', p.parties[1].name)});
      if (show) p.sharedFacts.forEach((t, i) => items.push({name: `shared${i}`, kind: 'shared', text: t}));
      if (showKey) items.push({name: 'key', kind: 'key', text: ctx.t.key});
      const stripH = panel === 'col' ? 0 : notesHeight(ctx, items, box.w - F, F, 2);
      if (!Number.isFinite(stripH)) continue;
      let colPl = null;
      if (panel === 'col') {
        colPl = placeNotes(ctx, items, {x: box.x + box.w - colW, y: box.y, w: colW, h: box.h}, F, 1);
        if (!colPl || colPl.h > box.h) continue;
        // (one chip per row, centred vertically in the column)
        const dy = (box.h - colPl.h) / 2;
        colPl.placed.forEach(q => { q.x = box.x + box.w - colW + (colW - q.c.box.w) / 2; });
        let y = box.y + dy;
        for (const q of colPl.placed) { q.y = y; y += q.c.box.h + F * 0.45; }
      }
      const avail = box.h - stripH - (stripH ? F * 0.5 : 0);
      const roomH = side ? avail : (avail - F * 0.6) / 2;
      const rooms = ROOMS.map((s, i) => (side ? {x: box.x + i * (roomW + F * 0.8), y: box.y, w: roomW, h: roomH} : {x: box.x, y: box.y + i * (roomH + F * 0.6), w: roomW, h: roomH}));
      // (room B is laid out at room A's figure scale: the two rooms identical)
      const Ls = [];
      rooms.forEach((rb, i) => Ls.push(layoutBoard(ctx, {kOnly: i && Ls[0].ok ? Ls[0].k : undefined,
        box: {x: rb.x + F * 0.3, y: rb.y + headH + F * 0.3, w: rb.w - F * 0.6, h: rb.h - headH - F * 0.5}, upx, prefix: `${ROOMS[i]}-`,
        px: [px], headMin, headTarget: 0, kMax: 1.6, gutter: mode === 'under' ? 0.12 : 0.22, mode, rowGap: 0.5, tight: mode === 'under' || shape === 'square',
        texts: {a: p.performancesA, b: p.performancesB, x: [p.changedFact.performance]}, nRows, cardText, headText: panel !== 'col' && cardText, minCh: minCardPx / upx,
        contract: `${p.contract.reference} · ${p.contract.title}`, columns: p.columns,
        names: null, plates: null, notes: [], trays: false,
      })));
      if (Ls.some(L => !L.ok)) continue;
      best = {px, F, Ls, rooms, headFits, headH, items, stripH, roomW, arr, mode, cardText, panel, colPl};
    }
    if (!best) return {ok: false, why: ['no-layout-fits'], problems: ['no-layout-fits']};
    const {F, Ls, rooms, headFits, headH, items, stripH} = best;
    const L = {ok: true, why: [], F, FL: F, upx, show, showKey, Ls, rooms, headFits, headH, box, scen, cardText: best.cardText, panel: best.panel};
    L.links = validLinks(p);
    L.nA = p.performancesA.length; L.nB = p.performancesB.length;
    Ls.forEach((Lr, i) => {
      Lr.rigs = makeRigs(ctx, Lr, p.parties);
      Lr.captions = captions;
      const X = scen[ROOMS[i]].column;
      Lr.X = X;
      Lr.xRow = X === 'a' ? L.nA : L.nB;
      const G = Lr.G;
      Lr.pass = {win: W.pass, from: G.trayAt(X, 0), to: G.rowAt(X, Lr.xRow)};
    });
    // the shared strip at the bottom
    const sb = {x: box.x + F * 0.5, y: box.y + box.h - stripH, w: box.w - F, h: stripH};
    L.strip = best.colPl || (items.length ? placeNotes(ctx, items, sb, F, 2) : null);
    // the "only this differs" tags: in each room, in the changed card's tray zone, under the card
    L.tags = Ls.map((Lr, i) => {
      if (!show) return null;
      const G = Lr.G, X = Lr.X;
      if (!L.cardText) return null;
      const col = G.cols[X === 'a' ? 0 : 1];
      const c = chipG(ctx, ctx.t.only, {x: col.cx, y: 0, anchor: 'middle', maxWidth: col.w - F * 0.4, size: F, maxLines: 2, weight: 700, stroke: ctx.theme.accent, name: `${ROOMS[i]}-tag`});
      const yTop = G.rowAt(X, Lr.xRow).y + G.ch / 2 + Math.max(10, F * 0.45);
      return {c, y: yTop, ok: yTop + c.box.h <= G.ledgeTop + 1};
    });
    L.tagsFit = L.tags.every(t => !t || t.ok);
    // checks: heads clear of boards, rooms apart, room share
    L.headsClear = Ls.every(Lr => [headBox(Lr.G.figA), headBox(Lr.G.figB)].every(hb => !overlaps(hb, Lr.G.board, -1)));
    L.roomShare = Math.min(...rooms.map(rb => (best.arr === 'side' ? rb.w / box.w : rb.h / box.h)));
    L.arr = best.arr; L.mode = best.mode;
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
      const G = Lr.G;
      const X = Lr.X;
      // the changed card (the same text in both rooms; its party's glyph and stripe follow its column)
      const fit = L.show && L.cardText ? fitG(p.changedFact.performance, {maxWidth: G.C.tw, size: Lr.F, maxLines: 3, weight: 600}) : null;
      const xCard = g({name: `${s}-card-x`, transform: T(0, 0), opacity: 0}, perfCard(ctx, {name: `${s}-card-x-in`, side: X, cw: G.cw, ch: G.ch, C: G.C, fit, F: Lr.F, ring: true}));
      // room frame and header: badge + supplied label
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
        boardArt(ctx, Lr),
        cardNodes(ctx, Lr, {a: p.performancesA, b: p.performancesB}),
        xCard,
        linkNodes(ctx, Lr, L.links),
        tag,
        Lr.rigs[0].node, Lr.rigs[1].node,
        null);
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
      const G = Lr.G, P = Lr.P, X = Lr.X;
      // shared cards: seated from the start
      for (const sd of ['a', 'b']) {
        const n = sd === 'a' ? L.nA : L.nB;
        for (let j = 0; j < n; j++) {
          const c = G.rowAt(sd, j);
          nodes[`${P}card-${sd}${j}`] = {transform: T(r(c.x, 2), r(c.y, 2))};
        }
      }
      // the changed card: arrives in its party's tray, then that party's hand seats it
      const arr = seg(u, ...W.arrive);
      const st = cardAt(G, X, Lr.pass.win, Lr.pass.from, Lr.pass.to, u);
      nodes[`${P}card-x`] = {transform: T(r(st.pos.x, 2), r(st.pos.y, 2)), opacity: r(arr, 3)};
      const ring = Math.max(seg(u, ...W.ringIn) * (1 - seg(u, ...W.ringOut)), seg(u, ...W.guide));
      nodes[`${P}card-x-in-ring`] = {opacity: r(ring, 3)};
      if (L.show && L.cardText) nodes[`${P}card-x-in-txt`] = {opacity: r(seg(u, W.arrive[0] + 0.04, W.arrive[1]), 3)};
      else nodes[`${P}card-x-in-bars`] = {opacity: r(seg(u, W.arrive[0] + 0.04, W.arrive[1]), 3)};
      const rest = [G.figA, G.figB].map((fg, k) => Lr.rigs[k].frame({x: fg.x, y: fg.floor, facing: fg.f, scale: fg.k}).hands.near);
      const grabs = grabsFor(G, X, [Lr.pass]);
      const hA = X === 'a' ? handOf(grabs, rest[0], u) : null;
      const hB = X === 'b' ? handOf(grabs, rest[1], u) : null;
      const pa = Lr.rigs[0].frame({x: G.figA.x, y: G.figA.floor, facing: 1, scale: G.k, near: hA, headTilt: 3});
      const pb = Lr.rigs[1].frame({x: G.figB.x, y: G.figB.floor, facing: -1, scale: G.k, near: hB, headTilt: 3});
      Object.assign(nodes, pa.nodes, pb.nodes);
      const lp = L.links.length ? seg(u, ...W.link) : 0;
      poseLinks(nodes, Lr, L.links, lp);
      if (L.headFits[i]) nodes[`${s}-head-label`] = {opacity: r(seg(u, ...W.head), 3)};
      if (L.tags[i]) nodes[`${s}-tagg`] = {opacity: r(seg(u, ...W.guide), 3)};
      sem[`card${s.toUpperCase()}x`] = {x: r(st.pos.x), y: r(st.pos.y)};
      sem[`hand${s.toUpperCase()}A`] = {x: r(pa.hands.near.x), y: r(pa.hands.near.y)};
      sem[`hand${s.toUpperCase()}B`] = {x: r(pb.hands.near.x), y: r(pb.hands.near.y)};
      sem[`reached${s}`] = pa.reached && pb.reached;
      sem[`where${s.toUpperCase()}`] = arr <= 0 ? 'none' : st.where;
      sem[`column${s.toUpperCase()}`] = X;
      sem[`links${s.toUpperCase()}`] = r(lp, 3);
      // the room's look (relative to its own room box): what a viewer sees of the scene
      const rb = L.rooms[i];
      looks.push(JSON.stringify({arr: r(arr, 2), x: arr > 0 ? r(st.pos.x - rb.x, 0) : null, y: arr > 0 ? r(st.pos.y - rb.y, 0) : null, ring: r(ring, 2), lp: r(lp, 2), hA: hA ? [r(hA.x - rb.x), r(hA.y - rb.y)] : null, hB: hB ? [r(hB.x - rb.x), r(hB.y - rb.y)] : null}));
    });
    // (the panel: the cards' texts and the parties from the start — shared by both rooms —; the ringed card's text and
    // the room headers with the change; the changed fact, shared facts and key at the guide)
    if (L.strip) for (const q of L.strip.placed) {
      const nm = q.it.name;
      const op = nm === 'legend-x' ? seg(u, ...W.arrive) : /-head-chip$/.test(nm) ? seg(u, ...W.head) : (q.it.kind === 'legend' || nm === 'parties') ? 1 : seg(u, ...W.strip);
      nodes[nm] = {opacity: r(op, 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat, ...sem,
        lookA: looks[0], lookB: looks[1],
        allReached: sem.reacheda && sem.reachedb,
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
    slug: 'contract-terms-03-contrast',
    title: 'Reciprocal obligations, without a rule — one performance listed as an obligation of A or of B, in two rooms',
    titleEs: 'Obligaciones recíprocas — Comparación de dos supuestos',
    category: 'contract-terms',
    categoryName: 'Contenido y cláusulas',
    motif: 'Obligaciones recíprocas',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two rooms with the same contract board, the same two parties and the same shared performances seated in their columns. Only one supplied fact differs: the column the performance "Performance 2 (supplied text)" is listed in. In room A it arrives in Party A\'s tray and Party A\'s hand seats it in column A ("Obligation of A"); in room B it arrives in Party B\'s tray and Party B\'s hand seats it in column B — the same motion, mirrored, at the same time. Then the shared links draw on in both rooms. The changed card is ringed in both rooms with the tag "Only this differs"; the shared strip names the changed fact, the shared facts and the key "As supplied · no conclusion drawn". No winner, score or outcome.',
    tags: ['reciprocal obligations', 'two columns', 'comparison', 'changed fact', 'performance', 'link', 'contract', 'equal weight', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-terms/kits/obligaciones-reciprocas.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeScene(scene, defaultParams, defaultParamsEs),
});
