/**
 * LAW-0379 — Inventario de objetos · contrast
 *
 * Storyboard (two complete inventory stations side by side on wide frames, stacked on tall ones; each with its own
 * bench, source bag holding the SAME fictional objects, compartment rack with tagged cells, clipboard list and gloved
 * arm; A/B headers; a shared strip with the shared facts, custodians, times, the changed fact, the neutral note and the
 * key):
 *  0.00–0.17  base: both stations identical — objects in the bag, empty cells, blank tags, the list holds the rows of
 *             the other objects; the changed object's row space is empty in both lists.
 *  0.17–0.40  the one changed fact is introduced locally: in A that object's row is written on the list ("object
 *             inventoried"); in B the row space stays empty ("object without entry"). The row space is ringed in both,
 *             with identical timing and weight.
 *  0.40–0.77  in parallel, both hands take the objects out and put each into its cell; listed objects get their tag
 *             written and joined to their row. In A the changed object is joined to its new row; in B its tag stays
 *             blank and no line is drawn — the only difference in geometry and sequence.
 *  0.77–1.00  a comparison guide rings the changed cell and row space in both stations; the neutral note says no
 *             winner, score or consequence is drawn. Nothing is said about what a missing entry means.
 * @module animations/evidence-custody/LAW-0379
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, list, int} from '../../schemas/fields.js';
import {contrastFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {scenarioHeader} from '../../frameworks/paired.js';
import {localised, benchNode, gloveArm, panelLayout, R2, fitG, textAt, INK} from './kits/evidence-art.js';
import {
  ioFields, IO_EN, IO_ES, IO_LABELS_EN, IO_LABELS_ES, ioLabelFields, fitStation, stationNodes, stationProps,
  itemWindows, travelWeights, routeAt, legendNodes, F_SIZES,
} from './kits/inventario-objetos.js';

const ID = 'LAW-0379';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W_ROW = [0.2, 0.32];
const W_RING = [0.17, 0.24];
const ACT = [0.4, 0.77];
const W_GUIDE = [0.78, 0.86];
const W_NOTE = [0.8, 0.88];

const OWN_EN = {
  labels: IO_LABELS_EN,
  changedItem: 3,
  scenarioA: {label: 'A · Object inventoried', caption: 'Object 3 has a row on the list'},
  scenarioB: {label: 'B · Object without entry', caption: 'Object 3 has no row on the list'},
  changedFact: 'Only difference: whether Object 3 has a row on the inventory list',
  sharedFacts: ['Same bag, same three objects, same rack and list', 'Same hand, same order of placing'],
  comparisonLabels: {guide: 'Only this cell and row space differ', neutral: 'Two supplied situations side by side · no winner, score or consequence is drawn'},
};
const OWN_ES = {
  labels: IO_LABELS_ES,
  changedItem: 3,
  scenarioA: {label: 'A · Objeto inventariado', caption: 'El objeto 3 tiene fila en el listado'},
  scenarioB: {label: 'B · Objeto sin entrada', caption: 'El objeto 3 no tiene fila en el listado'},
  changedFact: 'Única diferencia: si el objeto 3 tiene una fila en el listado de inventario',
  sharedFacts: ['Misma bolsa, mismos tres objetos, misma bandeja y listado', 'Misma mano, mismo orden de colocación'],
  comparisonLabels: {guide: 'Solo difieren esta celda y este hueco de fila', neutral: 'Dos situaciones aportadas lado a lado · sin ganador, puntuación ni consecuencia'},
};
const EN = {...IO_EN, ...OWN_EN};
const ES = {...IO_ES, ...OWN_ES};
/** Spanish defaults (used by the baseline-es preset). */
export const ES_PARAMS = ES;

const sceneSchema = {
  ...ioFields,
  ...ioLabelFields,
  ...contrastFields(),
  changedItem: int('Which object (1 = top cell) has a list row in A and none in B; its row in `records` is A\'s row', 1, 5),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 3),
};

const defaultParams = {...EN};

/** Per-scene row texts: A keeps every supplied row, B drops the changed object's row. */
function rowTexts(P, k, scen) {
  return P.items.map((_, i) => {
    const rw = P.records[i];
    if (!rw || !String(rw.value || '').trim()) return null;
    if (scen === 'B' && i === k) return null;
    return `${rw.field}: ${rw.value}`;
  });
}

function stripRows(ctx, P, k) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  if (showKey) rows.push({kind: 'heading', text: P.changedFact, name: 'changed'});
  if (showAll && P.scenarioA.caption) rows.push({kind: 'item', icon: 'row-filled', text: `A: ${P.scenarioA.caption}`, name: 'capA'});
  if (showAll && P.scenarioB.caption) rows.push({kind: 'item', icon: 'row-blank', text: `B: ${P.scenarioB.caption}`, name: 'capB'});
  if (showKey) rows.push({kind: 'item', icon: 'ring', color: ctx.theme.accent3, text: P.comparisonLabels.guide, name: 'guide-row'});
  // compact: shared content is drawn once, one row per field (items, custodians, times)
  if (showAll) rows.push({kind: 'item', icon: `item-${P.items[k].kind}`, text: P.items.map((it, i) => (i === k ? `${it.id} (B: ${P.labels.noEntry})` : it.id)).join(' · '), name: 'lg-items'});
  if (showAll) P.sharedFacts.forEach((f, i) => rows.push({kind: 'item', icon: 'row-filled', text: f, name: `shared${i}`}));
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.custodians.map(c => `${c.name} (${c.role})`).join(' · '), name: 'lg-cus'});
  if (showAll) rows.push({kind: 'item', icon: 'clock', text: P.timestamps.map(t => `${t.label} ${t.time}`).join(' · '), name: 'lg-time'});
  if (showKey) rows.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'neutral'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

/** Split rows into `cols` balanced columns. */
function columns(ctx, rows, cols, colW, F) {
  if (!rows.length) return {cols: [], h: 0, ok: true, colW};
  const all = panelLayout(ctx, rows, {w: colW, F});
  let PLs = [all];
  if (cols > 1 && rows.length > 1) {
    const half = all.h / cols;
    let idx = all.rows.findIndex(rw => rw.y + rw.h > half);
    idx = Math.max(1, Math.min(rows.length - 1, idx + 1));
    PLs = [panelLayout(ctx, rows.slice(0, idx), {w: colW, F}), panelLayout(ctx, rows.slice(idx), {w: colW, F})];
  }
  return {cols: PLs, h: Math.max(...PLs.map(q => q.h)), ok: PLs.every(q => q.ok), colW};
}

function compose(ctx, P, k) {
  const {w: DW, h: DH} = ctx.design;
  const shape = ctx.view.shape;
  const n = P.items.length;
  const tA = rowTexts(P, k, 'A'), tB = rowTexts(P, k, 'B');
  const opts = shape === 'portrait'
    ? [{arr: 'column', strip: 'below', cols: 1}, {arr: 'column', strip: 'below', cols: 2}]
    : shape === 'square'
      ? [{arr: 'row', strip: 'below', cols: 2}, {arr: 'row', strip: 'below', cols: 1}, {arr: 'column', strip: 'side', pw: 0.36}, {arr: 'row', strip: 'side', pw: 0.3}, {arr: 'column', strip: 'side', pw: 0.3}]
      : [{arr: 'row', strip: 'below', cols: 2}, {arr: 'row', strip: 'side', pw: 0.24}, {arr: 'row', strip: 'side', pw: 0.3}];
  let best = null, bestScore = -1, fallback = null;
  for (const F of F_SIZES) {
    const rows = stripRows(ctx, P, k);
    const headerH = ctx.show('key') ? Math.max(F * 2.6, 56) : 40;
    for (const opt of opts) {
      const gap = F * 1.1;
      let area = {x: 0, y: 0, w: DW, h: DH}, strip = null, PL = null;
      if (rows.length) {
        if (opt.strip === 'below') {
          const colW = (DW - 8 - (opt.cols - 1) * F * 1.2) / opt.cols;
          PL = columns(ctx, rows, opt.cols, colW, F);
          area = {x: 0, y: 0, w: DW, h: DH - PL.h - gap};
          strip = {x: 4, y: DH - PL.h};
        } else {
          const PW = DW * opt.pw;
          PL = columns(ctx, rows, 1, PW, F);
          PL.ok = PL.ok && PL.h <= DH;
          area = {x: 0, y: 0, w: DW - PW - gap, h: DH};
          strip = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
        }
      }
      if (area.h < 240) continue;
      const sg = Math.max(24, F * 1.4);
      const scenes = opt.arr === 'row'
        ? [0, 1].map(i => ({x: area.x + i * ((area.w - sg) / 2 + sg), y: area.y, w: (area.w - sg) / 2, h: area.h}))
        : [0, 1].map(i => ({x: area.x, y: area.y + i * ((area.h - sg) / 2 + sg), w: area.w, h: (area.h - sg) / 2}));
      const benches = scenes.map(sc => ({x: sc.x, y: sc.y + headerH, w: sc.w, h: sc.h - headerH}));
      const b0 = benches[0];
      const inset = Math.max(12, Math.min(b0.w, b0.h) * 0.035);
      const pad = inset + 10;
      const box = {w: b0.w - pad * 2, h: b0.h - pad * 2 - Math.min(40, b0.h * 0.06)};
      let st = null;
      for (const bagMode of ['left', 'top']) {
        const sA = fitStation(box, {n, texts: tA, F, bagMode, title: null, tagText: ctx.show('key'), sheetFrac: [0.34, 0.44, 0.54, 0.62], minS: 26});
        if (!sA) continue;
        // B uses the same S and sheet width as A (identical scale); only its row texts differ
        if (!st || sA.G.S > st.G.S) st = sA;
      }
      const c = {F, opt, area, strip, PL, scenes, benches, headerH, pad, st, box};
      c.ok = Boolean(st) && (!PL || PL.ok);
      c.problems = [!st && 'station-fit', PL && !PL.ok && 'strip-text'].filter(Boolean);
      if (!fallback || c.problems.length < fallback.problems.length) fallback = c;
      if (!c.ok) continue;
      const score = st.G.S * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
      if (score > bestScore) { best = c; bestScore = score; }
    }
  }
  return best || fallback;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const n = P.items.length;
    const k = Math.min(n, P.changedItem) - 1;
    const C = compose(ctx, P, k);
    let G = C.st ? C.st.G : null;
    let SFA = C.st ? C.st.SF : null;
    if (!G) {
      const fs = fitStation({w: 2000, h: 2000}, {n, texts: rowTexts(P, k, 'A'), F: 16, bagMode: 'left', sheetFrac: [0.3]});
      G = fs.G; SFA = fs.SF;
    }
    const SFB = {...SFA, fits: SFA.fits.map((f, i) => (i === k ? null : f))};
    const linkedA = P.items.map((_, i) => Boolean(P.records[i] && String(P.records[i].value || '').trim()));
    const linkedB = linkedA.map((v, i) => (i === k ? false : v));
    const tagFits = linked => P.items.map((_, i) => {
      if (!ctx.show('key') || !linked[i]) return null;
      const f = fitG(P.records[i].field, {maxWidth: G.tagW * 0.62, size: Math.min(C.F, G.tagH * 0.5), minSize: 16, maxLines: 1, weight: 700});
      return f.ok ? f : null;
    });
    const sides = [0, 1].map(si => {
      const bench = C.benches[si];
      const ox = bench.x + C.pad + (C.box.w - G.W) / 2, oy = bench.y + C.pad + (C.box.h - G.H) / 2;
      const linked = si === 0 ? linkedA : linkedB;
      const pref = si === 0 ? 'a' : 'b';
      const X = v => ox + v, Y = v => oy + v;
      const world = {slots: G.slots.map(p => ({x: X(p.x), y: Y(p.y)})), cells: G.cells.map(c => ({x: X(c.cx), y: Y(c.cy)}))};
      const bb = bench.y + bench.h;
      const armW = Math.max(24, Math.min(46, G.S * 0.26));
      const rackMid = X(G.rackX + G.rackW / 2), bagMid = X(G.bag.x + G.bag.w / 2);
      const shoulder = {x: clamp(G.bagMode === 'left' ? (rackMid + bagMid) / 2 : rackMid + G.S * 0.3, bench.x + 40, bench.x + bench.w - 40), y: bb + Math.max(50, bench.h * 0.08)};
      world.rest = {x: shoulder.x + armW * 0.3, y: bb - armW * 1.6};
      const N = stationNodes(ctx, G, {prefix: pref, ox, oy, kinds: P.items.map(it => it.kind), SF: si === 0 ? SFA : SFB, tagFits: tagFits(linked), showText: ctx.show('key'), tagWritable: linked});
      return {bench, ox, oy, linked, pref, world, shoulder, armW, N};
    });
    const W = itemWindows(n, ACT[0], ACT[1], 0.05, travelWeights(sides[0].world));
    for (const sd of sides) {
      let far = 0;
      for (let i = 0; i <= 80; i++) {
        const s = routeAt(W, {...sd.world, n, S: G.S, doPlace: n, doLink: true, linked: sd.linked}, i / 80);
        far = Math.max(far, Math.hypot(s.hand.x - sd.shoulder.x, s.hand.y - sd.shoulder.y));
      }
      const len = far * 0.58 + 20;
      sd.arm = gloveArm(ctx, {name: `arm${sd.pref}`, handed: 'right', upper: len, lower: len, width: sd.armW});
    }
    // guide rings: the changed cell + tag + row space band, in both stations
    const guide = sides.map(sd => {
      const c = G.cells[k];
      const x0 = sd.ox + c.x - 10, x1 = sd.ox + G.sheet.x + G.sheet.w + 8;
      const y0 = sd.oy + c.y - G.gC / 2 - 4, y1 = sd.oy + c.y + c.h + G.gC / 2 + 4;
      return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
    });
    const rowRing = sides.map(sd => ({x: sd.ox + G.sheet.x + 6, y: sd.oy + G.rows[k].top + 2, w: G.sheet.w - 12, h: G.rows[k].h - 4}));
    let guideFit = null;
    if (ctx.show('key')) {
      guideFit = fitG(P.comparisonLabels.guide, {maxWidth: Math.min(C.benches[0].w * 0.9, 520), size: Math.min(C.F, 22), minSize: 16, maxLines: 2, weight: 700});
    }
    return {P, n, k, C, G, sides, W, guide, rowRing, guideFit};
  },
  build(ctx, L) {
    const {C, G, P} = L;
    const th = ctx.theme;
    const colors = [th.accent, th.accent2];
    const parts = [];
    L.sides.forEach((sd, si) => {
      const bench = benchNode(ctx, {prefix: `bench${sd.pref}`, x: sd.bench.x, y: sd.bench.y, w: sd.bench.w, h: sd.bench.h});
      const sc = C.scenes[si];
      const sTxt = si === 0 ? P.scenarioA : P.scenarioB;
      parts.push(scenarioHeader(ctx, {name: `hdr${sd.pref}`, letter: si === 0 ? 'A' : 'B', label: sTxt.label, x: sc.x, y: sc.y, w: sc.w, h: C.headerH, color: colors[si]}));
      const N = sd.N;
      parts.push(bench.surface,
        g({'clip-path': bench.clip},
          N.rack, N.sheet, N.bagBack, N.inBag, N.bagFront, N.placed, N.tags, N.links,
          h('path', {name: `ring${sd.pref}`, d: roundRectPath(L.rowRing[si].x, L.rowRing[si].y, L.rowRing[si].w, L.rowRing[si].h, 10), fill: 'none', stroke: th.accent3, 'stroke-width': 4, opacity: 0}),
          sd.arm.arm, sd.arm.palm, N.carried, sd.arm.thumb,
        ),
        bench.frame,
        h('path', {name: `guide${sd.pref}`, d: roundRectPath(L.guide[si].x, L.guide[si].y, L.guide[si].w, L.guide[si].h, 14), fill: 'none', stroke: th.accent3, 'stroke-width': 5, opacity: 0}),
      );
    });
    if (C.PL) C.PL.cols.forEach((PLc, i) => parts.push(g({name: `strip${i}`, transform: T(C.strip.x + i * (C.PL.colW + C.F * 1.2), C.strip.y)}, legendNodes(ctx, PLc))));
    return g({name: 'scene'}, parts);
  },
  frame(ctx, L, u) {
    const {C, G, P, n, k} = L;
    const nodes = {};
    const sem = {};
    const rowK = seg(u, ...W_ROW);
    const ringK = u < W_RING[0] ? 0 : u < 0.36 ? seg(u, ...W_RING) : 1 - seg(u, 0.36, 0.4);
    const guideK = seg(u, ...W_GUIDE);
    const looks = [];
    L.sides.forEach((sd, si) => {
      const s = routeAt(L.W, {...sd.world, n, S: G.S, doPlace: n, doLink: true, linked: sd.linked}, u);
      // the changed row: written in A during the change beat; never in B (its slot has no row node content)
      s.items.forEach((it, i) => { it.row = i === k ? (si === 0 ? rowK : 0) : 1; });
      Object.assign(nodes, stationProps(G, sd.N, {prefix: sd.pref, ox: sd.ox, oy: sd.oy}, s.items));
      const pa = sd.arm.pose(sd.shoulder, s.hand, 1);
      Object.assign(nodes, pa.nodes);
      nodes[`ring${sd.pref}`] = {opacity: r(ringK, 3)};
      nodes[`guide${sd.pref}`] = {opacity: r(guideK, 3)};
      const look = {states: s.items.map(it => it.state), links: s.items.map(it => r(it.link, 3)), rows: s.items.map(it => r(it.row, 3)), hand: R2({x: s.hand.x - sd.ox, y: s.hand.y - sd.oy})};
      looks.push(look);
      sem[`hand${si ? 'B' : 'A'}`] = R2(pa.hand);
      sem[`grip${si ? 'B' : 'A'}`] = R2(s.holding >= 0 ? s.items[s.holding].pos : s.hand);
      sem[`reached${si ? 'B' : 'A'}`] = pa.reached;
    });
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) { if (row.name === 'neutral') nodes[row.name] = {opacity: r(seg(u, ...W_NOTE), 3)}; if (row.name === 'guide-row') nodes[row.name] = {opacity: r(guideK, 3)}; }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        ...sem, beat, k, lookA: looks[0], lookB: looks[1],
        linkA: looks[0].links[k], linkB: looks[1].links[k], rowA: looks[0].rows[k], rowB: looks[1].rows[k],
        diffCount: looks[0].links.filter((v, i) => v !== looks[1].links[i]).length,
        guide: r(guideK, 3), allReached: sem.reachedA && sem.reachedB,
        problems: C.problems, textPx: r(C.F, 1), S: r(G.S, 1), arrangement: C.opt ? C.opt.arr : null,
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
    slug: 'evidence-custody-05-contrast',
    title: 'Object inventory — two identical inventory stations; only whether one object has a row on the list differs, so only that cell\'s tag is joined to the list in A',
    titleEs: 'Inventario de objetos — Comparación de dos supuestos',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Inventario de objetos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete inventory stations (bag with the same fictional objects, compartment rack with tagged cells, clipboard list, gloved hand), side by side on wide frames and stacked on tall ones. The one changed fact: in A the chosen object has a row on the list (object inventoried), in B its row space stays empty (object without entry). Both hands then place the objects in parallel; listed objects are joined to their rows, so only the changed object\'s tag and line differ. A guide rings the changed cell and row space; the neutral note draws no winner, score or consequence. Fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'inventory', 'list', 'comparison', 'missing entry', 'rack', 'cells', 'tag'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/inventario-objetos.js', 'src/frameworks/paired.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
