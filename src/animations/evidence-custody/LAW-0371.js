/**
 * LAW-0371 — Transferencia de custodia · contrast
 *
 * Storyboard (two complete hand-off rooms of identical size, A and B — side by side on wide frames, stacked on tall
 * ones; each has custodian A and custodian B seen from above at opposite ends, an own desk and an own clipboard sheet
 * for each, a counter with the hand-off tray, and the same sealed bag with object, tag and chain on A's desk; letter
 * badges and scenario labels head each room; a shared strip lists the changed fact, item, custodians, the rows of both
 * sheets, shared facts, times, the guide label, a neutral note and the key):
 *  0.00–0.17  base: the two rooms are identical (same positions, both sheets unwritten, nothing marked).
 *  0.17–0.40  the change, in B only: a neutral ring and the changed-datum marker (Δ) appear on room B's sheet B — the
 *             supplied fact that this sheet receives no entry for the hand-off ("hueco documental"); room A stays as
 *             it is ("Transferencia registrada"). Nobody acts during this beat; it is a supplied fact.
 *  0.40–0.77  in parallel, the same hand-off in both rooms: A carries the bag onto the tray, both hands hold it there,
 *             B takes it to B's desk; A writes sheet A. Then in room A, B writes sheet B; in room B, B's pen hand stays
 *             at rest and sheet B stays blank — the only circumstance that differs (it changes an arm's motion and the
 *             ink on the sheet, not only a colour).
 *  0.77–1.00  a comparison guide outlines sheet B in both rooms and joins them; a neutral note. No winner, no score and
 *             no consequence of the gap (nothing about custody, admissibility or validity).
 * @module animations/evidence-custody/LAW-0371
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r} from '../../core/time.js';
import {contrastFields} from '../../schemas/fields.js';
import {T} from '../../core/transform.js';
import {roundRectPath} from '../../core/geometry.js';
import {changedMarker} from '../../primitives/markers.js';
import {localised, R2, fitG, textAt, ringRect} from './kits/evidence-art.js';
import {
  TC_EN, TC_ES, tcFields, tcLogs, tcRecordLine, tcStage, tcPose, tcArms, bagUnit, tcSceneNodes, tcFrameNodes, tcWriteProps,
  tcPanelLayout, tcPanelNode,
} from './kits/transferencia-custodia.js';

const ID = 'LAW-0371';
const DURATION = 9000;
const CHANGE_AT = 0.17;
const W = {
  ring: [0.2, 0.28], mark: [0.26, 0.33],
  aReach: [0.4, 0.43], aCarry: [0.43, 0.5], bReach: [0.46, 0.5], aBack: [0.54, 0.58], bCarry: [0.54, 0.61], bBack: [0.61, 0.65],
  aWrite: [0.59, 0.68], bWrite: [0.67, 0.76], guide: [0.79, 0.85], note: [0.82, 0.87],
};
const SIZES = [24, 23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  scenarioA: {label: 'Transfer recorded', caption: 'Each custodian writes an own sheet'},
  scenarioB: {label: 'Documentary gap', caption: 'Sheet B receives no entry (as supplied)'},
  changedFact: 'Only in B, sheet B receives no entry for the hand-off (supplied fact)',
  sharedFacts: ['Same bag, same hand-off over the counter tray'],
  comparisonLabels: {guide: 'Only sheet B differs', neutral: 'Two supplied situations side by side; no conclusion is drawn about either'},
};
const OWN_ES = {
  scenarioA: {label: 'Transferencia registrada', caption: 'Cada custodio escribe su propia hoja'},
  scenarioB: {label: 'Hueco documental', caption: 'La hoja B no recibe registro (según lo aportado)'},
  changedFact: 'Solo en B, la hoja B no recibe registro de la entrega (hecho aportado)',
  sharedFacts: ['Misma bolsa, misma entrega sobre la bandeja del mostrador'],
  comparisonLabels: {guide: 'Solo cambia la hoja B', neutral: 'Dos supuestos aportados, uno junto a otro; no se extrae ninguna conclusión'},
};
const EN = {...TC_EN, ...OWN_EN};
const ES = {...TC_ES, ...OWN_ES};

const sceneSchema = {...tcFields, ...contrastFields()};
const defaultParams = {...EN};

function legendRows(ctx, P, rows) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const out = [];
  if (showKey) out.push({kind: 'state', text: P.changedFact, name: 'lg-changed'});
  if (showKey) out.push({kind: 'heading', icon: `object-${P.items[0].kind}`, text: `${P.items[0].id} — ${P.items[0].label}`, name: 'lg-item'});
  if (showKey) P.custodians.forEach((c, i) => out.push({kind: 'item', icon: i === 0 ? 'cus-a' : 'cus-b', text: `${i === 0 ? 'A' : 'B'} · ${c.name} · ${c.role}`, name: `lg-cus${i}`}));
  if (showKey) for (const key of ['a', 'b']) if (rows[key].length) out.push({kind: 'item', icon: `log-${key}`, text: `${key === 'a' ? P.labels.logA : P.labels.logB} · ${rows[key].map(rw => tcRecordLine(rw, P.labels.blank)).join(' · ')}`, name: `lg-rec-${key}`});
  if (showAll) P.sharedFacts.forEach((f, i) => out.push({kind: 'item', icon: 'ring', color: ctx.theme.fgSoft, text: f, name: `lg-shared${i}`}));
  if (showAll) P.timestamps.forEach((t, i) => out.push({kind: 'item', icon: 'clock', text: `${t.label} · ${t.time}`, name: `lg-time${i}`}));
  if (showKey) out.push({kind: 'item', icon: 'ring', color: ctx.theme.accent, text: P.comparisonLabels.guide, name: 'lg-guide'});
  if (showAll) out.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'lg-note'});
  if (showKey) out.push({kind: 'key', text: P.labels.key, name: 'key'});
  return out;
}

function panelFor(ctx, rows, F, w, cols) {
  if (cols === 1) { const one = tcPanelLayout(ctx, rows, {w, F}); return {cols: [one], h: one.h, ok: one.ok, colW: w}; }
  const colW = (w - (cols - 1) * F * 1.2) / cols;
  let best = null;
  if (cols === 2) {
    for (let i = 1; i < rows.length; i++) {
      const a = tcPanelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = tcPanelLayout(ctx, rows.slice(i), {w: colW, F});
      if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b]};
    }
  } else {
    for (let i = 1; i < rows.length - 1; i++) for (let j = i + 1; j < rows.length; j++) {
      const a = tcPanelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = tcPanelLayout(ctx, rows.slice(i, j), {w: colW, F}), c = tcPanelLayout(ctx, rows.slice(j), {w: colW, F});
      const hh = Math.max(a.h, b.h, c.h);
      if (!best || hh < best.h) best = {h: hh, cols: [a, b, c]};
    }
  }
  if (!best) { const one = tcPanelLayout(ctx, rows, {w: colW, F}); best = {h: one.h, cols: [one]}; }
  return {cols: best.cols, h: best.h, ok: best.cols.every(q => q.ok), colW};
}

function compose(ctx, P, rows, lrows, F, opt) {
  const {w: DW, h: DH} = ctx.design;
  const show = ctx.show('key');
  const gap = F * 1.2;
  const headH = show ? F * 2.9 : F * 2.2;
  let area, PL = null, panel = null;
  if (!lrows.length) area = {x: 0, y: 0, w: DW, h: DH};
  else if (opt.legend === 'below') {
    PL = panelFor(ctx, lrows, F, DW - 8, opt.cols);
    area = {x: 0, y: 0, w: DW, h: DH - PL.h - gap};
    panel = {x: 4, y: DH - PL.h};
  } else {
    const PW = DW * opt.pw;
    PL = panelFor(ctx, lrows, F, PW, 1);
    PL.ok = PL.ok && PL.h <= DH;
    area = {x: 0, y: 0, w: DW - PW - gap, h: DH};
    panel = {x: DW - PW, y: Math.max(0, (DH - PL.h) / 2)};
  }
  const sg = F * 1.4;
  const boxes = [];
  if (opt.arr === 'row') {
    const sw = (area.w - sg) / 2, sh = area.h - headH;
    for (let i = 0; i < 2; i++) boxes.push({x: area.x + i * (sw + sg), y: area.y + headH, w: sw, h: sh, headY: area.y});
  } else {
    const sh = (area.h - sg - headH * 2) / 2;
    for (let i = 0; i < 2; i++) boxes.push({x: area.x, y: area.y + headH + i * (sh + headH + sg), w: area.w, h: sh, headY: area.y + i * (sh + headH + sg)});
  }
  const fits = boxes[0].w > 200 && boxes[0].h > 180;
  const G = fits ? boxes.map(b => tcStage(b, opt.orient, {kind: P.items[0].kind, rowsA: rows.a.length, rowsB: rows.b.length})) : null;
  // headers
  const heads = [P.scenarioA, P.scenarioB].map(sc => {
    if (!show) return {};
    const tw = boxes[0].w - F * 3.2;
    const lab = fitG(sc.label, {maxWidth: tw, size: F * 1.1, minSize: F, maxLines: 1, weight: 700});
    const cap = ctx.show('all') && sc.caption ? fitG(sc.caption, {maxWidth: tw, size: F * 0.9, minSize: Math.min(F, 16), maxLines: 1, weight: 500}) : null;
    return {lab, cap, ok: lab.ok && (!cap || cap.ok)};
  });
  const headOk = heads.every(hd => hd.ok !== false) && (!show || heads.every(hd => hd.lab.height + (hd.cap ? hd.cap.height + F * 0.2 : 0) <= headH - 6));
  const ok = (!PL || PL.ok) && G && G.every(q => q.fits) && G[0].S >= 120 && headOk;
  return {F, area, boxes, G, PL, panel, heads, headH, ok, problems: [PL && !PL.ok && 'panel-text', (!G || !G.every(q => q.fits)) && 'stage-fit', (!G || G[0].S < 120) && 'stage-small', !headOk && 'header-text'].filter(Boolean)};
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const rows = tcLogs(P);
    const rowsB = {a: rows.a, b: rows.b.map(rw => ({...rw, filled: false}))};
    const lrows = legendRows(ctx, P, rows);
    const shape = ctx.view.shape;
    const opts = shape === 'portrait' ? [{arr: 'col', orient: 'h', legend: 'below', cols: 1}, {arr: 'col', orient: 'h', legend: 'below', cols: 2}]
      : shape === 'square' ? [{arr: 'row', orient: 'v', legend: 'below', cols: 2}, {arr: 'col', orient: 'h', legend: 'side', pw: 0.34}, {arr: 'col', orient: 'h', legend: 'side', pw: 0.3}]
        : [{arr: 'row', orient: 'h', legend: 'below', cols: 3}, {arr: 'row', orient: 'h', legend: 'below', cols: 2}, {arr: 'row', orient: 'v', legend: 'side', pw: 0.24}];
    let C = null, best = null, bestScore = -1;
    for (const F of SIZES) {
      for (const opt of opts) {
        const c = compose(ctx, P, rows, lrows, F, opt);
        const score = (c.G ? c.G[0].S : 0) * Math.sqrt(F / 24) * (F < 19.5 ? 0.3 : 1);
        if (c.ok && score > bestScore) { best = c; bestScore = score; }
        if (!C || c.problems.length < C.problems.length) C = c;
      }
      if (best && F <= 19.5) break;
    }
    if (best) C = best;
    if (!C.G) C.G = C.boxes.map(b => tcStage(b, 'h', {kind: P.items[0].kind, rowsA: rows.a.length, rowsB: rows.b.length}));
    const Ls = C.G.map((G, i) => {
      const L0 = {G, rows: i ? rowsB : rows};
      const samples = [];
      for (let k = 0; k <= 80; k++) samples.push(tcPose(ctx, G, W, k / 80, {writeA: true, writeB: i === 0, rows: L0.rows, seed: 'tcc'}));
      L0.arms = tcArms(ctx, G, samples, i ? 'sb' : 'sa');
      L0.unit = bagUnit(ctx, G, `${i ? 'sb' : 'sa'}-bag`);
      return L0;
    });
    return {P, rows, rowsB, C, Ls};
  },
  build(ctx, L) {
    const {C, P} = L;
    const th = ctx.theme;
    const parts = [];
    C.G.forEach((G, i) => {
      const pfx = i ? 'sb' : 'sa';
      const N = tcSceneNodes(ctx, G, L.Ls[i], pfx, {seed: 'tcc'});
      const b = C.boxes[i];
      const clipId = `${pfx}-win`;
      const SB = G.sheets.b;
      parts.push(g({name: `stage-${pfx}`},
        h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 20)}))),
        g({'clip-path': ctx.ref(clipId)}, N.stage, N.sheets, N.shadow, N.bag, N.arms, N.palms, N.pens, N.thumbs, N.persons),
        h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 20), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2}),
        i === 1 ? g({name: 'gap-ring', opacity: 0}, ringRect({x: SB.paper.x - 5, y: SB.paper.y - 5, w: SB.paper.w + 10, h: SB.paper.h + 10}, th.accent2, 4)) : null,
        i === 1 ? changedMarker(ctx, {name: 'gap-mark', x: SB.x + SB.w - 6, y: SB.y + 8, radius: clamp(G.S * 0.09, 16, 26), opacity: 0}) : null,
      ));
      const hd = C.heads[i];
      const R = C.headH * 0.36;
      const tx = b.x + R * 2 + C.F * 0.6;
      parts.push(g({name: `head-${pfx}`},
        h('circle', {cx: r(b.x + R + 2), cy: r(b.headY + C.headH * 0.45), r: r(R), fill: i ? th.accent2 : th.accent3, stroke: th.ink, 'stroke-width': 2.5}),
        ctx.show('key') ? h('text', {x: r(b.x + R + 2), y: r(b.headY + C.headH * 0.45 + R * 0.42), 'text-anchor': 'middle', 'font-size': r(R * 1.2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, i ? 'B' : 'A') : null,
        hd.lab ? textAt(hd.lab, {x: tx, y: b.headY + 2, fill: th.fg}) : null,
        hd.cap ? textAt(hd.cap, {x: tx, y: b.headY + 2 + hd.lab.height + C.F * 0.2, fill: th.fgSoft}) : null,
      ));
    });
    parts.push(g({name: 'guide', opacity: 0},
      h('path', {name: 'guide-line', fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round'}),
      h('rect', {name: 'guide-a', fill: 'none', stroke: th.accent, 'stroke-width': 4, rx: 8}),
      h('rect', {name: 'guide-b', fill: 'none', stroke: th.accent, 'stroke-width': 4, rx: 8}),
    ));
    const panels = C.PL ? C.PL.cols.map((PLc, i) => g({name: `panel${i}`, transform: T(C.panel.x + i * (C.PL.colW + C.F * 1.2), C.panel.y)}, tcPanelNode(ctx, PLc))) : [];
    return g({name: 'scene'}, parts, panels);
  },
  frame(ctx, L, u) {
    const {C} = L;
    const nodes = {};
    const looks = [];
    const sem = {};
    C.G.forEach((G, i) => {
      const pfx = i ? 'sb' : 'sa';
      const Li = L.Ls[i];
      const s = tcPose(ctx, G, W, u, {writeA: true, writeB: i === 0, rows: Li.rows, seed: 'tcc'});
      const F = tcFrameNodes(ctx, G, s, Li, pfx);
      Object.assign(nodes, F.nodes, tcWriteProps(pfx, Li.rows, s.progress));
      const o = {x: C.boxes[i].x, y: C.boxes[i].y};
      const rel = p => ({x: r(p.x - o.x), y: r(p.y - o.y)});
      const writtenB = Li.rows.b.map((rw, k) => (rw.filled ? r(s.progress.b[k], 3) : 0));
      looks.push({bag: rel(s.bag), holder: s.holder, handAc: rel(s.hands.a.carry), handBc: rel(s.hands.b.carry), handAp: rel(s.hands.a.pen), handBp: rel(s.hands.b.pen),
        writtenA: s.progress.a.map(v => r(v, 3)), writtenB, gapMark: 0});
      const k = i ? 'B' : 'A';
      Object.assign(sem, {
        [`bag${k}`]: R2(s.bag), [`holder${k}`]: s.holder, [`handAc${k}`]: R2(s.hands.a.carry), [`handBc${k}`]: R2(s.hands.b.carry),
        [`handAp${k}`]: R2(s.hands.a.pen), [`handBp${k}`]: R2(s.hands.b.pen), [`gripA${k}`]: R2(s.grips.a), [`gripB${k}`]: R2(s.grips.b),
        [`penGripA${k}`]: R2({x: s.tips.a.x - s.pens.a.off.x, y: s.tips.a.y - s.pens.a.off.y}), [`penGripB${k}`]: R2({x: s.tips.b.x - s.pens.b.off.x, y: s.tips.b.y - s.pens.b.off.y}),
        [`atB${k}`]: s.atB, [`writtenA${k}`]: s.progress.a.map(v => r(v, 3)), [`writtenB${k}`]: writtenB, [`reached${k}`]: F.allReached,
      });
    });
    const ringK = seg(u, ...W.ring), markK = seg(u, ...W.mark);
    nodes['gap-ring'] = {opacity: r(ringK, 3)};
    nodes['gap-mark'] = {opacity: r(markK, 3)};
    looks[1].gapMark = r(Math.max(ringK, markK), 3);
    // guide: outlines of sheet B in both rooms, joined
    const gk = seg(u, ...W.guide);
    const pad = 12;
    const bx = C.G.map(G => ({x: G.logs.b.x - pad, y: G.logs.b.y - pad, w: G.logs.b.w + pad * 2, h: G.logs.b.h + pad * 2}));
    const [ba, bb] = bx;
    let ea, eb, bend;
    if (C.boxes[0].y === C.boxes[1].y) {
      // side by side: from the bottom edges of the outlines, dipping below the rooms' sheets
      ea = {x: ba.x + ba.w / 2, y: ba.y + ba.h}; eb = {x: bb.x + bb.w / 2, y: bb.y + bb.h};
      bend = {x: (ea.x + eb.x) / 2, y: Math.max(ea.y, eb.y) + Math.min(60, C.F * 2.2)};
      ea.y = Math.min(ea.y, C.boxes[0].y + C.boxes[0].h - 2); eb.y = Math.min(eb.y, C.boxes[1].y + C.boxes[1].h - 2);
      bend.y = Math.min(bend.y, C.boxes[0].y + C.boxes[0].h + C.F * 0.9);
    } else {
      // stacked: straight down from the upper outline's bottom edge to the lower outline's top edge (the sheets sit
      // at the same x in both rooms), crossing only the gap between the rooms
      ea = {x: ba.x + ba.w / 2, y: ba.y + ba.h}; eb = {x: bb.x + bb.w / 2, y: bb.y};
      bend = {x: (ea.x + eb.x) / 2, y: (ea.y + eb.y) / 2};
    }
    const lenG = Math.hypot(bend.x - ea.x, bend.y - ea.y) + Math.hypot(eb.x - bend.x, eb.y - bend.y);
    nodes.guide = {opacity: r(Math.min(1, gk * 3), 3)};
    nodes['guide-line'] = {d: `M${r(ea.x)} ${r(ea.y)}Q${r(bend.x)} ${r(bend.y)} ${r(eb.x)} ${r(eb.y)}`, 'stroke-dasharray': `${r(lenG * 1.2)} ${r(lenG * 1.2 + 10)}`, 'stroke-dashoffset': r(lenG * 1.2 * (1 - gk))};
    nodes['guide-a'] = {x: r(ba.x), y: r(ba.y), width: r(ba.w), height: r(ba.h)};
    nodes['guide-b'] = {x: r(bb.x), y: r(bb.y), width: r(bb.w), height: r(bb.h)};
    const noteK = seg(u, ...W.note);
    if (C.PL) for (const col of C.PL.cols) for (const row of col.rows) {
      if (row.name === 'lg-guide') nodes[row.name] = {opacity: r(gk, 3)};
      if (row.name === 'lg-note') nodes[row.name] = {opacity: r(noteK, 3)};
    }
    const beat = u < CHANGE_AT ? 'base' : u < 0.4 ? 'change' : u < 0.77 ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        beat, ...sem, lookA: looks[0], lookB: looks[1], gapRing: r(ringK, 3), gapMark: r(markK, 3), guide: r(gk, 3), note: r(noteK, 3),
        allReached: sem.reachedA && sem.reachedB, arrangement: C.boxes[0].y === C.boxes[1].y ? 'row' : 'column', orient: C.G[0].orient,
        problems: C.problems, textPx: r(C.F, 1), S: r(C.G[0].S, 1), sameSize: C.G[0].S === C.G[1].S,
        stageA: {x: r(C.boxes[0].x), y: r(C.boxes[0].y), w: r(C.boxes[0].w), h: r(C.boxes[0].h)},
        stageB: {x: r(C.boxes[1].x), y: r(C.boxes[1].y), w: r(C.boxes[1].w), h: r(C.boxes[1].h)},
        guideA: {x: r(ba.x), y: r(ba.y), w: r(ba.w), h: r(ba.h)}, guideB: {x: r(bb.x), y: r(bb.y), w: r(bb.w), h: r(bb.h)},
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
    slug: 'evidence-custody-03-contrast',
    title: 'Custody transfer — the same counter hand-off in two rooms: both sheets written (A) or sheet B left without entry (B)',
    titleEs: 'Transferencia de custodia — Comparación de dos supuestos',
    category: 'evidence-custody',
    categoryName: 'Recogida y custodia de pruebas',
    motif: 'Transferencia de custodia',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical hand-off rooms (side by side or stacked): custodian A carries the sealed bag onto the counter tray, both hands hold it, custodian B takes it to B\'s desk and A writes A\'s own sheet. In room A, B then writes sheet B; in room B the supplied documentary gap applies: sheet B is marked with a neutral ring and Δ before the action and stays blank because B\'s pen hand never writes. A guide outlines sheet B in both rooms; a neutral note. No winner, no score, no consequence of the gap; fictional; jurisdiction unspecified.',
    tags: ['evidence', 'custody', 'transfer', 'hand-off', 'contrast', 'documentary gap', 'record sheet', 'counter', 'evidence bag'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/evidence-custody/kits/evidence-art.js', 'src/animations/evidence-custody/kits/transferencia-custodia.js', 'src/primitives/desk.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
