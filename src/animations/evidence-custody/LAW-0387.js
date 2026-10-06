/**
 * LAW-0387 — Comparación de huellas digitales · contrast
 *
 * Storyboard (two complete, identical comparison stations — A and B — side by side on wide frames, stacked on tall
 * and square ones; each is an evidence bench with the object in its open bag and its tag on a ball chain, a light box
 * holding the reference card (upper row) and the lifted card (lower row) with their symbolic chains, a parked reading
 * frame and one gloved hand; a shared legend strip lists the item, cards, pair states, the changed fact, shared facts,
 * tag rows, custodians, times, the guide caption, the neutral note and the key):
 *  0.00–0.17  base: both stations identical (the hand takes the frame's handle in both at the same time).
 *  0.17–0.40  the one changed fact: in B only, the lifted chain's tile of the chosen segment turns over and shows the
 *             alternative symbol (a ring marks where); A keeps the base symbol.
 *  0.40–0.77  the same action runs in parallel: each hand slides its frame segment by segment and every pair is
 *             linked once the frame sits on it — so at the changed segment A gets a bridge and B two open stubs. Every
 *             other pair is linked identically.
 *  0.77–1.00  hold: frames parked; a guide joins the changed pair in A and in B; a neutral note. No winner, score or
 *             conclusion; the two situations are supplied, nothing follows from them.
 * @module animations/evidence-custody/LAW-0387
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, int, list, obj, oneOf} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {scenarioHeader} from '../../frameworks/paired.js';
import {ecFields, localised, benchNode, gloveArm, R2, pathAt} from './kits/evidence-art.js';
import {
  FC_EN, FC_ES, fcFields, fcRecords, fcRecordLine, SYMBOLS, fcStage, cardArt, lightBoxArt, linkArt, linkProps, readerArt,
  stationBag, poseAt, fcLegendFor, fcPanels,
} from './kits/comparacion-huellas.js';

const ID = 'LAW-0387';
const DURATION = 7500;
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];
const W = {reach: [0.04, 0.12], ring: [0.18, 0.38], flipOut: [0.22, 0.27], flipIn: [0.27, 0.32], toCol: [0.4, 0.45], steps: [0.45, 0.74], park: [0.74, 0.78], back: [0.78, 0.82], guide: [0.79, 0.85], note: [0.82, 0.87]};
const TS_FLOOR = 30;

const BASE_SEG = [{a: 'arc', b: 'arc'}, {a: 'fork', b: 'fork'}, {a: 'loop', b: 'loop'}, {a: 'dot', b: 'dot'}, {a: 'end', b: 'end'}];
const OWN_EN = {
  segments: BASE_SEG,
  scenarioA: {label: 'Values match', caption: 'Every symbol pair supplied as equal'},
  scenarioB: {label: 'Illustrative discrepancy', caption: 'One symbol on the lifted chain differs'},
  changeIndex: 2,
  changeSymbol: 'fork',
  changedFact: 'Only the third lifted symbol differs (loop in A, fork in B)',
  sharedFacts: ['Same cards, item and order'],
  comparisonLabels: {guide: 'The only pair that differs in A and B', neutral: 'Two supplied situations · no conclusion drawn'},
};
const OWN_ES = {
  segments: BASE_SEG,
  scenarioA: {label: 'Valores coincidentes', caption: 'Cada par de símbolos aportado como igual'},
  scenarioB: {label: 'Discrepancia ilustrativa', caption: 'Un símbolo de la cadena levantada difiere'},
  changeIndex: 2,
  changeSymbol: 'fork',
  changedFact: 'Solo difiere el tercer símbolo levantado (lazo en A, bifurcación en B)',
  sharedFacts: ['Mismas tarjetas, objeto y orden'],
  comparisonLabels: {guide: 'El único par distinto entre A y B', neutral: 'Dos situaciones aportadas · sin conclusión'},
};
const EN = {...FC_EN, ...OWN_EN};
const ES = {...FC_ES, ...OWN_ES};

const scen = d => obj(d, {label: str('Scenario label', 50), caption: str('Scenario caption (shown with all labels)', 70)}, ['label', 'caption']);
const sceneSchema = {
  ...ecFields,
  ...fcFields,
  scenarioA: scen('Scenario A (base symbols)'),
  scenarioB: scen('Scenario B (one symbol of the lifted chain replaced)'),
  changeIndex: int('Zero-based segment whose lifted symbol differs in B (clamped to the segment count)', 0, 5),
  changeSymbol: oneOf('Symbol shown on the lifted chain at that segment in B', SYMBOLS),
  changedFact: str('Description of the one changed fact', 110),
  sharedFacts: list('Facts that stay the same in A and B', str('Shared fact', 80), 0, 3),
  comparisonLabels: obj('Comparison captions', {guide: str('Caption of the guide joining the changed pair', 70), neutral: str('Neutral note (no winner, no conclusion)', 90)}, ['guide', 'neutral']),
};
const defaultParams = {...EN};

function legendRows(ctx, P, recs) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const rows = [];
  const it = P.items[0];
  if (showKey) rows.push({kind: 'heading', icon: `object-${it.kind}`, text: `${it.id} — ${it.label}`, name: 'lg-item'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-cardA', text: P.cards.a, name: 'lg-cardA'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-cardB', text: P.cards.b, name: 'lg-cardB'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-same', text: P.matchLabels.same, name: 'lg-same'});
  if (showKey) rows.push({kind: 'item', icon: 'fc-differ', text: P.matchLabels.differ, name: 'lg-differ'});
  if (showKey) rows.push({kind: 'item', icon: `fc-sym-${P.changeSymbol}`, text: P.changedFact, name: 'lg-changed'});
  if (showAll) P.sharedFacts.forEach((f, i) => rows.push({kind: 'item', icon: 'fc-chain', text: f, name: `lg-shared${i}`}));
  if (showKey) rows.push({kind: 'item', icon: 'tag', text: recs.map(rw => fcRecordLine(rw, P.labels.blank)).join(' · '), name: 'lg-recs'});
  if (showAll) rows.push({kind: 'item', icon: 'glove', text: P.custodians.map(c => `${c.name} · ${c.role}`).join('; '), name: 'lg-cus'});
  if (showAll) rows.push({kind: 'item', icon: 'clock', text: P.timestamps.map(t => `${t.label} · ${t.time}`).join('; '), name: 'lg-times'});
  if (showKey) rows.push({kind: 'item', icon: 'ring', color: ctx.theme.accent, text: P.comparisonLabels.guide, name: 'lg-guide'});
  if (showKey) rows.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'state-tag'});
  if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
  return rows;
}

function compose(ctx, P, recs, LG, arrangement, pairing, F) {
  const A = LG.area;
  const head = F * 2.7;
  const gap = F * 1.2;
  const pw = pairing === 'row' ? (A.w - gap) / 2 : A.w;
  const ph = pairing === 'row' ? A.h : (A.h - gap) / 2;
  const benches = [0, 1].map(i => {
    const x = pairing === 'row' ? A.x + i * (pw + gap) : A.x;
    const y = pairing === 'row' ? A.y : A.y + i * (ph + gap);
    return {x, y: y + head, w: pw, h: ph - head, hx: x, hy: y, hh: head};
  });
  const b0 = benches[0];
  const inset = Math.max(12, Math.min(b0.w, b0.h) * 0.035);
  const mat = {x: b0.x + inset * 1.2, y: b0.y + inset * 1.2, w: b0.w - inset * 2.4, h: b0.h - inset * 2.4};
  const G = fcStage(mat, {n: P.segments.length, rows: recs.length, kind: P.items[0].kind, arrangement, cardRest: false, compact: true});
  const ok = (!LG.PL || LG.PL.ok) && G.fits && G.ts >= TS_FLOOR && b0.h > 200;
  return {F, LG, benches, mat, G, pairing, ok, problems: [LG.PL && !LG.PL.ok && 'panel-text', !G.fits && 'stage-fit', G.ts < TS_FLOOR && 'stage-small'].filter(Boolean)};
}

function plan(n) {
  const B = (W.steps[1] - W.steps[0]) / n;
  return Array.from({length: n}, (_, i) => {
    const a = W.steps[0] + i * B;
    return {arrive: a, link: [a + B * 0.08, a + B * 0.55], move: i < n - 1 ? [a + B * 0.6, a + B] : null};
  });
}

/** Station pose in bench-local coordinates of bench 0 (identical for A and B). */
function stationPose(L, u) {
  const {G, C, pairs} = L;
  const e = ease.inOutCubic;
  const col = i => G.column(i);
  let reader;
  if (u < W.toCol[0]) reader = {...G.park};
  else if (u < W.toCol[1]) {
    const k = e(seg(u, ...W.toCol)), c0 = col(0);
    reader = {x: lerp(G.park.x, c0.x, k), y: lerp(G.park.y, c0.y, k), a: lerp(G.park.a, 0, k)};
  } else if (u < W.park[0]) {
    reader = {...col(0)};
    for (let j = 0; j < pairs.length; j++) {
      const pj = pairs[j];
      if (u >= pj.arrive) reader = {...col(j)};
      if (pj.move && u >= pj.move[0] && u < pj.move[1]) {
        const k = e(seg(u, ...pj.move)), a0 = col(j), a1 = col(j + 1);
        reader = {x: lerp(a0.x, a1.x, k), y: lerp(a0.y, a1.y, k), a: 0};
        break;
      }
    }
  } else {
    const k = e(seg(u, ...W.park)), cl = col(pairs.length - 1);
    reader = {x: lerp(cl.x, G.park.x, k), y: lerp(cl.y, G.park.y, k), a: lerp(0, G.park.a, k)};
  }
  const grip = poseAt(reader, G.RM.grip);
  let hand;
  if (u < W.reach[0]) hand = {...C.rest};
  else if (u < W.reach[1]) hand = pathAt([[W.reach[0], C.rest], [W.reach[1], poseAt(G.park, G.RM.grip)]], u);
  else if (u < W.back[0]) hand = {...grip};
  else hand = pathAt([[W.back[0], poseAt(G.park, G.RM.grip)], [W.back[1], C.rest]], u);
  const links = pairs.map(p => seg(u, ...p.link));
  return {reader, grip, hand, links};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    const P = {...P0, changeIndex: clamp(P0.changeIndex, 0, P0.segments.length - 1)};
    const recs = fcRecords(P);
    const rows = legendRows(ctx, P, recs);
    const shape = ctx.view.shape;
    const opts = shape === 'landscape' ? [{mode: 'below', cols: 3}, {mode: 'below', cols: 2}, {mode: 'side', pw: 0.26}, {mode: 'side', pw: 0.32}]
      : [{mode: 'below', cols: 2}, {mode: 'below', cols: 3}, {mode: 'below', cols: 4}, {mode: 'side', pw: 0.34}, {mode: 'side', pw: 0.4}, {mode: 'side', pw: 0.45}, {mode: 'side', pw: 0.5}];
    const pairings = shape === 'portrait' ? ['column'] : ['row', 'column'];
    let C = null, best = null, bestScore = -1, firstOk = -1;
    for (const [fi, F] of SIZES.entries()) {
      if (firstOk >= 0 && fi > firstOk + 2) break;
      for (const opt of opts) {
        const LG = fcLegendFor(ctx, rows, F, opt);
        if (LG.PL && !LG.PL.ok && C) continue;
        for (const pairing of pairings) for (const arr of ['wide', 'wideLow', 'tall']) {
          const c = compose(ctx, P, recs, LG, arr, pairing, F);
          const score = c.G.ts * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
          if (c.ok && firstOk < 0 && F >= 19.5) firstOk = fi;
          if (c.ok && score > bestScore) { best = c; bestScore = score; }
          if (!C || c.problems.length < C.problems.length) C = c;
        }
      }
    }
    if (best) C = best;
    const G = C.G;
    const b0 = C.benches[0];
    const bb = b0.y + b0.h;
    const armW = clamp(G.ts * 0.62, 24, 44);
    const xs = clamp(G.column(G.n - 1).x, b0.x + b0.w * 0.4, b0.x + b0.w * 0.92);
    C.shoulder = {x: xs, y: bb + Math.max(60, b0.h * 0.1)};
    C.rest = {x: xs - armW * 0.6, y: bb - armW * 0.9};
    const pairs = plan(P.segments.length);
    const L0 = {G, C, pairs};
    let far = 0;
    for (let i = 0; i <= 100; i++) { const s = stationPose(L0, i / 100); far = Math.max(far, Math.hypot(s.hand.x - C.shoulder.x, s.hand.y - C.shoulder.y)); }
    const armLen = far * 0.56 + 20;
    const arms = ['A', 'B'].map(k => gloveArm(ctx, {name: `arm${k}`, handed: 'right', upper: armLen, lower: armLen, width: armW}));
    const off = C.benches.map(b => ({x: b.x - b0.x, y: b.y - b0.y}));
    return {P, recs, C, G, pairs, arms, off};
  },
  build(ctx, L) {
    const {C, G, P} = L;
    const th = ctx.theme;
    const k = P.changeIndex;
    const segsB = P.segments.map((s, i) => (i === k ? {a: P.changeSymbol, b: s.b} : s));
    const b0 = C.benches[0];
    const stations = ['A', 'B'].map((K, bi) => {
      const b = C.benches[bi];
      const bench = benchNode(ctx, {prefix: `bench${K}`, x: b.x, y: b.y, w: b.w, h: b.h});
      const o = L.off[bi];
      const links = P.segments.map((sg, i) => {
        const tb = G.tileB(i), ta = G.tileA(i);
        const top = {x: tb.x, y: tb.y + G.ts * 0.5}, bot = {x: ta.x, y: ta.y - G.ts * 0.5};
        const sameA = sg.a === sg.b, sameB = segsB[i].a === segsB[i].b;
        // B carries both link variants at the changed segment: the base one until the flip, the new one after
        return g(null,
          linkArt(ctx, `lk${K}${i}`, top, bot, sameA, G.ts),
          bi === 1 && i === k && sameA !== sameB ? linkArt(ctx, `lk${K}${i}n`, top, bot, sameB, G.ts) : null);
      });
      const tk = G.tileA(k);
      return g({name: `station${K}`},
        bench.surface,
        g({'clip-path': bench.clip},
          g({transform: T(o.x, o.y)},
            lightBoxArt(ctx, G.LB, {}),
            g({transform: T(G.slotB.x, G.slotB.y)}, cardArt(ctx, G.CM, {prefix: `c${K}b`, symbols: P.segments.map(s => s.b), role: 'b'})),
            g({transform: T(G.slotA.x, G.slotA.y)}, cardArt(ctx, G.CM, {prefix: `c${K}a`, symbols: P.segments.map(s => s.a), role: 'a', alt: bi === 1 ? {i: k, sym: P.changeSymbol} : null})),
            stationBag(ctx, G, {prefix: `st${K}`, rows: L.recs}),
            links,
            h('rect', {name: `ring${K}`, x: r(tk.x - G.ts * 0.72), y: r(tk.y - G.ts * 0.72), width: r(G.ts * 1.44), height: r(G.ts * 1.44), rx: r(G.ts * 0.25), fill: 'none', stroke: th.accent2, 'stroke-width': r(Math.max(4, G.ts * 0.08), 2), opacity: 0}),
            g({name: `reader${K}`}, readerArt(ctx, G.RM, {})),
            g({transform: T(-o.x, -o.y)}, L.arms[bi].arm, L.arms[bi].palm, L.arms[bi].thumb),
          ),
        ),
        bench.frame,
        scenarioHeader(ctx, {name: `head${K}`, letter: K, label: bi ? P.scenarioB.label : P.scenarioA.label, caption: bi ? P.scenarioB.caption : P.scenarioA.caption, x: b.hx, y: b.hy, w: b.w, h: b.hh, color: bi ? th.accent2 : th.accent3}),
      );
    });
    // guide: a highlight box around the changed pair in each station and a line joining them
    const gb = bi => {
      const o = L.off[bi], tb = G.tileB(k), ta = G.tileA(k);
      return {x: tb.x + o.x - G.ts * 0.8, y: tb.y + o.y - G.ts * 0.8, w: G.ts * 1.6, h: ta.y - tb.y + G.ts * 1.6};
    };
    const g0 = gb(0), g1 = gb(1);
    const row = C.pairing === 'row';
    const p0 = row ? {x: g0.x + g0.w, y: g0.y + g0.h / 2} : {x: g0.x + g0.w / 2, y: g0.y + g0.h};
    const p1 = row ? {x: g1.x, y: g1.y + g1.h / 2} : {x: g1.x + g1.w / 2, y: g1.y};
    const guide = g({name: 'guide', opacity: 0},
      [g0, g1].map(b => h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, G.ts * 0.3), fill: 'none', stroke: th.accent, 'stroke-width': 5})),
      h('path', {d: `M${r(p0.x)} ${r(p0.y)}L${r(p1.x)} ${r(p1.y)}`, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    );
    void b0;
    return g({name: 'scene'}, stations, guide, fcPanels(ctx, C.LG));
  },
  frame(ctx, L, u) {
    const {C, G, P} = L;
    const k = P.changeIndex;
    const s = stationPose(L, u);
    const nodes = {};
    const sameA = P.segments[k].a === P.segments[k].b;
    const sameB = P.changeSymbol === P.segments[k].b;
    const flipped = u >= W.flipOut[1];
    const looks = {};
    ['A', 'B'].forEach((K, bi) => {
      nodes[`reader${K}`] = {transform: T(s.reader.x, s.reader.y, s.reader.a)};
      const o = L.off[bi];
      const pose = L.arms[bi].pose({x: C.shoulder.x + o.x, y: C.shoulder.y + o.y}, {x: s.hand.x + o.x, y: s.hand.y + o.y}, -1);
      Object.assign(nodes, pose.nodes);
      s.links.forEach((lk, i) => {
        if (bi === 1 && i === k && sameA !== sameB) {
          Object.assign(nodes, linkProps(`lk${K}${i}`, sameA, flipped ? 0 : lk));
          Object.assign(nodes, linkProps(`lk${K}${i}n`, sameB, flipped ? lk : 0));
        } else Object.assign(nodes, linkProps(`lk${K}${i}`, P.segments[i].a === P.segments[i].b, lk));
      });
      looks[K] = {reader: R2({x: s.reader.x, y: s.reader.y}), hand: R2({x: pose.hand.x - o.x, y: pose.hand.y - o.y}), links: s.links.map(x => r(x, 3)), reached: pose.reached};
    });
    // B: the lifted tile of the changed segment turns over (scaleX 1 → 0, swap glyph, 0 → 1)
    const fo = ease.inOutCubic(seg(u, ...W.flipOut)), fi = ease.inOutCubic(seg(u, ...W.flipIn));
    const sx = u < W.flipOut[1] ? 1 - fo : fi;
    const tk = G.tileA(k);
    nodes[`cBa-t${k}`] = {transform: T(tk.x, tk.y, 0, Math.max(0.02, sx), 1)};
    nodes[`cBa-g${k}`] = {opacity: flipped ? 0 : 1};
    nodes[`cBa-x${k}`] = {opacity: flipped ? 1 : 0};
    const ringK = Math.sin(Math.PI * seg(u, ...W.ring));
    nodes.ringB = {opacity: r(ringK, 3)};
    nodes.ringA = {opacity: 0};
    const guideK = seg(u, ...W.guide), noteK = seg(u, ...W.note);
    nodes.guide = {opacity: r(guideK, 3)};
    if (C.LG.PL) for (const col of C.LG.PL.cols) for (const row of col.rows) {
      if (row.name === 'state-tag') nodes[row.name] = {opacity: r(noteK, 3)};
      if (row.name === 'lg-guide') nodes[row.name] = {opacity: r(guideK, 3)};
    }
    const shownB = flipped ? P.changeSymbol : P.segments[k].a;
    const lookA = {...looks.A, sym: P.segments[k].a, link: sameA ? 'bridge' : 'open'};
    const lookB = {...looks.B, sym: shownB, link: (flipped ? sameB : sameA) ? 'bridge' : 'open'};
    const beat = u < 0.17 ? 'base' : u < 0.4 ? 'change' : u < 0.77 ? 'parallel' : 'hold';
    const R = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    return {
      nodes,
      semantic: {
        beat, lookA, lookB, flipped, guide: r(guideK, 3), note: r(noteK, 3),
        handA: lookA.hand, handB: {x: r(lookB.hand.x + L.off[1].x), y: r(lookB.hand.y + L.off[1].y)}, gripA: R2(s.grip), gripB: R2({x: s.grip.x + L.off[1].x, y: s.grip.y + L.off[1].y}),
        readerA: R2(s.reader), readerB: R2({x: s.reader.x + L.off[1].x, y: s.reader.y + L.off[1].y}),
        linkA: lookA.link, linkB: lookB.link, linksA: looks.A.links, linksB: looks.B.links,
        allReached: looks.A.reached && looks.B.reached, pairing: C.pairing,
        problems: C.problems, textPx: r(C.F, 1), ts: r(G.ts, 1), benches: C.benches.map(R),
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
    slug: 'evidence-custody-07-contrast',
    title: 'Fingerprint comparison — two identical comparison stations; in B one symbol of the lifted chain turns over, so when both frames are slid along the chains that pair gets open stubs in B and a bridge in A',
    titleEs: 'Comparación de huellas digitales — Comparación de dos supuestos',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Comparación de huellas digitales',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete, identical comparison stations (A: values match; B: an illustrative discrepancy), side by side on wide frames and stacked on tall ones. Each has the object in its open bag with its tag, a light box with the reference and lifted cards and their symbolic chains, a reading frame and a gloved hand. In B only, one tile of the lifted chain turns over to show a different symbol. Then both hands slide their frames segment by segment in parallel; each pair is linked once the frame sits on it, so the changed pair gets a bridge in A and open stubs in B. A guide joins the changed pair in A and B; a neutral note. No winner, score or conclusion; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'fingerprint', 'comparison', 'contrast', 'symbolic chain', 'segments', 'light box', 'reading frame', 'discrepancy'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/comparacion-huellas.js', 'src/frameworks/paired.js', 'src/primitives/desk.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
