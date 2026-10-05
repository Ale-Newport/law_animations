/**
 * Sorting line for the story of "Comprobación de jurisdicción" (LAW-0069).
 *
 * Front view of a library filing line: source documents hang from trolleys on
 * a rail that leaves the library bookcase, pass through a reading arch (the
 * filter) and reach a switch. The reader compares the emblem printed on each
 * document with the key set by the research card in the search terminal, and
 * only then the switch blade turns: same jurisdiction → branch A (relevant
 * rack), different → branch B (other rack). The researcher lowers the card
 * into the terminal; a pulse runs up the cable and keys the reader.
 *
 * Wide boxes: branch B stays on the upper rail, branch A drops to a lower
 * rack. Tall boxes: a mezzanine holds the bookcase, researcher and terminal;
 * both branches descend to two racks stacked below it.
 *
 * Pure geometry + drawing. The entry owns timing windows and labels.
 * @module animations/research/kits/comprobacion-de-jurisdiccion-line
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, seg, ease} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {sourceSheet, bookcase, emblem, filleted, arcTo, relGlyph, jurColor, coverFraction, fitHy} from './comprobacion-de-jurisdiccion.js';

const DEG = Math.PI / 180;

/**
 * Stage plan per layout shape (design units). W = design width.
 * In tall boxes `o.rackA` / `o.rackB` move the two racks down so each rack's
 * label sits just above its own rail (the entry measures the labels first).
 * @param {'landscape'|'square'|'portrait'} shape
 * @param {{w:number,h:number}} D
 * @param {{rackA?:number, rackB?:number}} [o]
 */
export function linePlan(shape, D, o = {}) {
  const W = D.w;
  if (shape === 'portrait') {
    const doc = {w: 124, h: 168, hook: 16};
    const railY = 130;
    const k = 0.85;
    const F = 704;
    // the drop to rack A and the far rail stay clear of a free column for the notes
    const pivotX = 668;
    const rackA = o.rackA ?? 850, rackB = o.rackB ?? 1130;
    const bx = W - 34;
    const hang = doc.hook + doc.h;
    const bottomY = rackB + hang + 10;
    return {
      shape, doc, railY, k, F, floorX: [0, 612],
      book: {x: 16, y: 72, w: 370, h: F - 72},
      researcher: {x: 432}, kiosk: {x: 552}, arch: {gx: 540},
      pivot: {x: pivotX, y: railY}, blade: 60, thetaA: 90, thetaB: 0,
      branchA: [{x: pivotX, y: rackA}, {x: 30, y: rackA}],
      branchB: [{x: bx, y: railY}, {x: bx, y: rackB}, {x: 30, y: rackB}],
      fillet: 56,
      zones: {
        library: {x: 16, y: 14, w: 370},
        filter: {x: 540 + 78, y: 14, w: W - 540 - 78 - 12, anchor: 'start'},
        actor: {x: 16, y: F + 22, w: 590},
        // rack labels hang above their own rail, at the end where documents gather
        A: {x: 24, y: rackA - 14, w: pivotX - 24 - 40, above: true},
        B: {x: 24, y: rackB - 14, w: bx - 24 - 44, above: true},
        free: {x: pivotX + 20, y: 196, w: bx - pivotX - 40, h: rackB - 40 - 196},
        notes: [
          {x: pivotX + 20, y: 196, w: bx - pivotX - 40, h: rackB - 40 - 196},
          {x: 36, y: rackB + 12, w: bx - 36 - 22, h: hang},
          {x: 36, y: rackA + 12, w: pivotX - 36 - 22, h: hang},
          {x: 24, y: bottomY, w: W - 48, h: Math.max(0, D.h - bottomY - 8)},
        ],
        note: 'right',
      },
    };
  }
  if (shape === 'square') {
    const doc = {w: 130, h: 176, hook: 17};
    const railY = 196;
    const k = 0.9;
    const F = D.h - 100;
    const pivotX = 760;
    const rackA = 878;
    return {
      shape, doc, railY, k, F, floorX: [0, 690],
      book: {x: 20, y: 110, w: 380, h: F - 110},
      researcher: {x: 492}, kiosk: {x: 622}, arch: {gx: 598},
      pivot: {x: pivotX, y: railY}, blade: 64, thetaA: 90, thetaB: 0,
      branchA: [{x: pivotX, y: rackA}, {x: W - 30, y: rackA}],
      branchB: [{x: W - 30, y: railY}],
      fillet: 60,
      zones: {
        library: {x: 20, y: 18, w: 380},
        filter: {cx: 598, y: 12, w: 330},
        actor: {x: 20, y: F + 20, w: 670},
        A: {x: 860, y: rackA - 14, w: W - 890, above: true, alignRight: true},
        B: {x: 860, y: railY - 14, w: W - 890, above: true, alignRight: true},
        free: {x: 830, y: railY + doc.hook + doc.h + 30, w: W - 850, h: rackA - railY - doc.hook - doc.h - 160},
        notes: [{x: 830, y: railY + doc.hook + doc.h + 24, w: W - 846, h: rackA - railY - doc.hook - doc.h - 130}],
        note: 'right',
      },
    };
  }
  const doc = {w: 150, h: 200, hook: 18};
  const railY = 166;
  const k = 0.9;
  const F = 796;
  const pivotX = 1120;
  const rackA = 520;
  return {
    shape: 'landscape', doc, railY, k, F, floorX: [0, 1080],
    book: {x: 34, y: 96, w: 450, h: F - 96},
    researcher: {x: 600}, kiosk: {x: 745}, arch: {gx: 950},
    pivot: {x: pivotX, y: railY}, blade: 74, thetaA: 65, thetaB: 0,
    branchA: [{x: pivotX + 130, y: rackA}, {x: W - 36, y: rackA}],
    branchB: [{x: W - 36, y: railY}],
    fillet: 70,
    zones: {
      library: {x: 34, y: 20, w: 450},
      filter: {right: 950 - 66 - 14, w: 360, beside: true},
      actor: {cx: 600, y: F + 18, w: 520},
      A: {x: 1290, y: rackA - 14, w: W - 1320, above: true, alignRight: true},
      B: {x: 1290, y: railY - 14, w: W - 1320, above: true, alignRight: true},
      free: {x: 1290, y: rackA + doc.hook + doc.h + 14, w: W - 1320, h: 120},
      // under the arch and left of the lower rack (the drop rail is kept clear by the entry), below the lower rack, top
      // the wedge between the drop rail and the upper rack's documents
      notes: [{x: 870, y: 418, w: 470, h: F - 10 - 418}, {x: 1190, y: railY + 16, w: 480, h: rackA - railY - 60}, {x: 1290, y: rackA + doc.hook + doc.h + 14, w: W - 1320, h: D.h - (rackA + doc.hook + doc.h + 14) - 10}, {x: 500, y: 20, w: 330, h: 130}],
      note: 'below',
    },
  };
}

/** Trapezoidal motion profile: accelerate, cruise, decelerate (distance fraction at time fraction x). */
export function trapez(x, a = 0.18, d = 0.28) {
  const t = clamp(x);
  const vmax = 1 / (1 - a / 2 - d / 2);
  if (t < a) return (0.5 * vmax * t * t) / a;
  if (t <= 1 - d) return vmax * (a / 2 + (t - a));
  const y = 1 - t;
  return 1 - (0.5 * vmax * y * y) / d;
}
const CRUISE = 1 - 0.18 / 2 - 0.28 / 2;

/**
 * Build the sorting line.
 * @param {any} ctx
 * @param {{plan:any, model:any, query:string, dispatch:[number,number], arrive:number, textLevel?:string}} o
 */
export function sortingLine(ctx, o) {
  const th = ctx.theme;
  const P = o.plan;
  const M = o.model;
  const DOC = P.doc;
  const n = M.docs.length;
  const railY = P.railY;
  const k = P.k;

  // ---------------------------------------------------------------- bookcase
  const crown = Math.max(18, P.book.h * 0.035);
  const railCompH = railY + DOC.hook + DOC.h + 16 - (P.book.y + crown);
  const restH = P.book.h - crown - Math.max(16, P.book.h * 0.03) - Math.max(8, P.book.h * 0.014) * 2 - 4 - railCompH;
  const bookRows = Math.max(2, Math.round(restH / 175));
  const plankH = Math.max(8, P.book.h * 0.014);
  const restH2 = restH - plankH * (bookRows - 2);
  const bc = bookcase(ctx, {prefix: 'lib', w: P.book.w, h: P.book.h, rows: [{kind: 'rail', h: railCompH}, ...Array.from({length: bookRows}, () => ({kind: 'books', h: restH2 / bookRows}))], seedKey: 'jur-lib'});
  const comp = bc.inner[0];
  const compX0 = P.book.x + comp.x + 6;
  const compX1 = P.book.x + comp.x + comp.w - 6;

  // ------------------------------------------------------------------- routes
  const pivot = P.pivot;
  const tip = th0 => ({x: pivot.x + P.blade * Math.cos(th0 * DEG), y: pivot.y + P.blade * Math.sin(th0 * DEG)});
  const tipA = tip(P.thetaA), tipB = tip(P.thetaB);
  const start = {x: compX0, y: railY};
  const mkRoute = (tp, rest) => {
    const pts = [start, {x: pivot.x, y: railY}, tp, ...rest];
    return filleted(pts, P.fillet);
  };
  // the first corner (at the pivot) is the blade joint: keep it tight
  const routeA = mkRoute(tipA, P.branchA);
  const routeB = mkRoute(tipB, P.branchB);
  const pivotArc = pivot.x - start.x;
  const tipArcA = arcTo(routeA.poly, tipA), tipArcB = arcTo(routeB.poly, tipB);

  // compartment start positions: document 0 nearest the exit (rightmost)
  const span = compX1 - compX0 - DOC.w;
  const sp = n > 1 ? Math.min(DOC.w * 0.42, span / (n - 1)) : 0;
  const startX = M.docs.map((d, i) => compX1 - DOC.w / 2 - i * sp);

  // rack slots: first arrival goes to the far end of its rack
  const slotGap = 12;
  const rackSlots = {};
  for (const which of ['A', 'B']) {
    const route = which === 'A' ? routeA : routeB;
    const ids = M.docs.filter(d => (which === 'A') === d.relevant).map(d => d.i);
    const L = route.poly.total;
    const last = which === 'A' ? P.branchA : P.branchB;
    const segStart = last.length >= 2 ? last[last.length - 2] : (which === 'A' ? tipA : tipB);
    const segEnd = last[last.length - 1];
    const corner = last.length >= 2 ? P.fillet : 0;
    const segLen = Math.hypot(segEnd.x - segStart.x, segEnd.y - segStart.y) - corner;
    const endMargin = DOC.w / 2 + 8;
    const room = Math.max(DOC.w, segLen - endMargin - DOC.w / 2);
    const spacing = ids.length > 1 ? Math.min(DOC.w + slotGap + 24, room / (ids.length - 1)) : 0;
    ids.forEach((id, j) => { rackSlots[id] = L - endMargin - j * spacing; });
  }

  // motion: leg 1 library → reader (the document STOPS under the reader), a
  // dwell while its seal is read and the switch is set, then leg 2 reader →
  // rack slot. The reader serves one document at a time, in library order:
  // a document only enters the arch once the previous one has left it (gap
  // `G` between the sheets ≥ the arch width). When a long list cannot keep
  // that spacing inside the action window, the gap shrinks gradually, never
  // below a clear margin between the sheets.
  const gx = P.arch.gx;
  const readArc = gx - start.x;
  const archWidth = DOC.w + 44;
  const [r0, rLast] = o.reads;
  const dR = n > 1 ? (rLast - r0) / (n - 1) : 0;
  const DW = o.dwell ?? 0.022;
  const FLIP = 0.014;
  const trips = M.docs.map((d, i) => ({i, route: d.relevant ? routeA : routeB, s0: startX[i] - start.x, s1: rackSlots[i], which: d.relevant ? 'A' : 'B', plan: r0 + i * dR}));
  const v1 = (readArc - trips[0].s0) / ((r0 - o.leave) * CRUISE);
  // waiting point: the sheet's leading edge (and its shadow) visibly clear of the arch's post
  const Wq = readArc - (archWidth / 2 + DOC.w / 2 + 12);
  trips.forEach((tr, i) => {
    tr.d2 = tr.s1 - readArc;
    tr.W = i ? Math.max(tr.s0, Wq) : readArc;
    tr.D1a = (tr.W - tr.s0) / (v1 * CRUISE);
    // the short step into the arch keeps one pace in every layout
    tr.D1b = i ? clamp((readArc - tr.W) / (v1 * CRUISE), 0.016, 0.026) : 0;
  });
  // leg 1a: library → waiting point (the first document goes straight to the reader);
  // wait; leg 1b: waiting point → reader; dwell; leg 2: reader → rack slot
  const sOf = (tr, u) => {
    if (u <= tr.t1) return tr.s0;
    if (u < tr.aW) return tr.s0 + (tr.W - tr.s0) * trapez(seg(u, tr.t1, tr.aW));
    if (u < tr.go) return tr.W;
    if (u < tr.read) return tr.W + (readArc - tr.W) * trapez(seg(u, tr.go, tr.read));
    if (u < tr.depart) return readArc;
    return readArc + tr.d2 * trapez(seg(u, tr.depart, tr.t2));
  };
  const leg2At = (tr, sArc) => {
    let lo = tr.depart, hi = tr.t2;
    for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (sOf(tr, mid) < sArc) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  // smallest gap between the sheets of `prev` (ahead) and `tr` over [u0, u1]
  const gapOver = (prev, tr, u0, u1) => {
    let m = Infinity;
    for (let u = Math.max(u0, prev.t1); u <= u1 + 1e-9; u += 0.0012) m = Math.min(m, sOf(prev, u) - sOf(tr, u) - DOC.w);
    return m;
  };
  // earliest value in [lo, lo + span] for which ok() holds (ok is monotone)
  const earliest = (lo, span, ok) => {
    if (ok(lo)) return lo;
    let a = lo, b = lo + span;
    for (let it = 0; it < 26; it++) { const mid = (a + b) / 2; if (ok(mid)) b = mid; else a = mid; }
    return b;
  };
  const QUEUE_GAP = 14;
  const tipArc = w => (w === 'A' ? tipArcA : tipArcB);
  const want = tr => (tr.which === 'A' ? P.thetaA : P.thetaB);
  let flips = [];
  const pass = (v2, G) => {
    let angle = P.thetaB;
    flips = [];
    trips.forEach((tr, i) => {
      const prev = i ? trips[i - 1] : null;
      if (!prev) {
        tr.read = tr.plan; tr.t1 = tr.read - tr.D1a; tr.aW = tr.read; tr.go = tr.read;
      } else {
        // leg 1b: the document enters the arch only when the previous one is `G` ahead
        const setRead = R => { tr.read = R; tr.go = R - tr.D1b; tr.aW = tr.go; tr.t1 = tr.aW - tr.D1a; };
        const R = earliest(Math.max(tr.plan, prev.read + DW), 0.5, x => { setRead(x); return gapOver(prev, tr, tr.go, x) >= G; });
        setRead(R);
        // leg 1a: reach the waiting point as early as possible, a clear gap behind the previous sheet
        const setArrive = aW => { tr.aW = aW; tr.t1 = aW - tr.D1a; };
        const aW = earliest(Math.max(o.leave + tr.D1a, tr.go - 0.25), 0.25, x => { setArrive(x); return gapOver(prev, tr, tr.t1, tr.go) >= QUEUE_GAP; });
        setArrive(Math.min(aW, tr.go));
      }
      let depart = tr.read + DW;
      if (want(tr) !== angle) {
        // the blade turns only after the seal has been read and the previous document has left it
        const a0 = Math.max(tr.read + DW * 0.4, prev ? prev.uTip + 0.002 : 0);
        const a1 = a0 + FLIP;
        flips.push({from: angle, to: want(tr), a: a0, b: a1, doc: i});
        depart = Math.max(depart, a1 + 0.004);
        angle = want(tr);
      }
      tr.depart = depart;
      tr.t2 = depart + tr.d2 / (v2 * CRUISE);
      tr.uPivot = leg2At(tr, pivotArc - DOC.w * 0.05);
      tr.uTip = leg2At(tr, tipArc(tr.which) + 4);
    });
    return Math.max(...trips.map(tr => tr.d2 / (Math.max(0.012, o.arrive - tr.depart) * CRUISE)));
  };
  // raise the leg-2 cruise speed until every document arrives by o.arrive
  const solve = G => {
    let v2 = Math.max(...trips.map(tr => tr.d2 / ((o.arrive - tr.plan - DW) * CRUISE)));
    for (let it = 0; it < 20; it++) {
      const need = pass(v2, G);
      if (need <= v2 * 1.0001) break;
      v2 = need;
    }
    return v2;
  };
  // the widest gap is used that keeps leg 2 about as calm as the tightest queue needs
  // (never a blur): first the tightest queue, then wider gaps within that speed budget
  const vMin = solve(QUEUE_GAP);
  const vCap = Math.max(v1 * 1.9, vMin * 1.3);
  const gaps = [archWidth + 6, archWidth * 0.75, archWidth * 0.5, archWidth * 0.3];
  let gapUsed = null;
  for (const G of gaps) {
    const v2 = solve(G);
    if (v2 <= vCap && trips.every(tr => tr.t2 <= o.arrive + 1e-6)) { gapUsed = G; break; }
  }
  if (gapUsed === null) { gapUsed = QUEUE_GAP; solve(gapUsed); }
  // check: consecutive sheets never overlap on the shared line (before the switch)
  let minSheetGap = Infinity;
  trips.forEach((tr, i) => {
    if (!i) return;
    for (let u = tr.t1; u <= tr.t2; u += 0.001) {
      if (sOf(tr, u) > pivotArc) break;
      minSheetGap = Math.min(minSheetGap, sOf(trips[i - 1], u) - sOf(tr, u) - DOC.w);
    }
  });
  trips.forEach(tr => { tr.start = tr.t1; tr.end = tr.t2; });
  const bladeAngle = u => {
    let ang = P.thetaB;
    for (const f of flips) {
      if (u >= f.b) ang = f.to;
      else if (u > f.a) return f.from + (f.to - f.from) * ease.inOutCubic((u - f.a) / (f.b - f.a));
      else return ang;
    }
    return ang;
  };

  // --------------------------------------------------------------- drawing
  const parts = {};
  // floor
  const [fx0, fx1] = P.floorX;
  parts.floor = g(null,
    h('rect', {x: fx0, y: P.F, width: fx1 - fx0, height: 16, fill: shade(th.wood, -0.15), stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: fx1 - 22, y: P.F + 16, width: 16, height: 30, fill: shade(th.wood, -0.3), stroke: th.ink, 'stroke-width': 1.5}),
  );
  parts.book = g({transform: T(P.book.x, P.book.y)}, bc.node);

  // rails
  const railC = th.metalDark;
  const railLine = d => h('path', {d, fill: 'none', stroke: railC, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  const mainD = `M${r(start.x - 4)} ${r(railY)}L${r(pivot.x)} ${r(railY)}`;
  const branchD = (tp, rest) => filleted([tp, ...rest], P.fillet).d;
  // hangers from the top edge along the upper rail (outside the bookcase)
  const hangers = [];
  const topRailEnd = P.branchB[0].x;
  for (let x = P.book.x + P.book.w + 40; x < topRailEnd - 20; x += 260) {
    if (Math.abs(x - gx) < 120 || Math.abs(x - pivot.x) < 60) continue;
    hangers.push(h('line', {x1: x, x2: x, y1: Math.max(0, railY - 150), y2: railY, stroke: th.metal, 'stroke-width': 3}));
  }
  parts.rails = g(null, hangers,
    railLine(mainD),
    railLine(branchD(tipA, P.branchA)),
    railLine(branchD(tipB, P.branchB)),
    // end stops
    ...['A', 'B'].map(w => {
      const last = (w === 'A' ? P.branchA : P.branchB);
      const e = last[last.length - 1];
      return h('circle', {cx: e.x, cy: e.y, r: 9, fill: th.ink});
    }),
  );

  // arch (filter): back panel behind documents, posts and reader in front
  const archW = DOC.w + 44;
  const archTop = railY - 40;
  const archBot = railY + DOC.hook + DOC.h + 20;
  const archX = gx - archW / 2;
  const post = 16;
  const archBack = g(null,
    h('rect', {x: archX, y: archTop, width: archW, height: archBot - archTop, rx: 10, fill: th.accent2Soft, opacity: 0.55}),
  );
  const readerW = 132, readerH = 56;
  const readerY = archTop - readerH + 6;
  const win = {x: gx - 30, y: readerY + readerH / 2 + 1, r: 20};
  const glyphAt = {x: gx + 36, y: readerY + readerH / 2 + 1};
  const archFront = g(null,
    // hanger to the top edge
    h('line', {x1: gx, x2: gx, y1: 0, y2: readerY, stroke: th.metal, 'stroke-width': 4}),
    h('rect', {x: archX, y: archTop, width: post, height: archBot - archTop, rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 2.5}),
    h('rect', {x: archX + archW - post, y: archTop, width: post, height: archBot - archTop, rx: 5, fill: th.metal, stroke: th.ink, 'stroke-width': 2.5}),
    h('rect', {x: archX - 6, y: archTop - 4, width: archW + 12, height: 22, rx: 6, fill: shade(th.metal, -0.1), stroke: th.ink, 'stroke-width': 2.5}),
    h('rect', {x: archX - 6, y: archBot - 16, width: archW + 12, height: 18, rx: 6, fill: shade(th.metal, -0.1), stroke: th.ink, 'stroke-width': 2.5}),
    // reader head
    h('path', {d: roundRectPath(gx - readerW / 2, readerY, readerW, readerH, 12), fill: '#e9edf1', stroke: th.ink, 'stroke-width': 2.5}),
    h('circle', {cx: win.x, cy: win.y, r: win.r + 4, fill: '#2b3137', stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(glyphAt.x - 26, glyphAt.y - 18, 52, 36, 8), fill: '#2b3137', stroke: th.ink, 'stroke-width': 2}),
  );
  // key shown in the reader window once the card has keyed it
  const readerKey = g({name: 'reader-key', opacity: 0}, emblem(ctx, {key: M.relevant.key, s: win.r * 1.5, x: win.x, y: win.y, stroke: '#ffffff'}));
  const readerRing = h('circle', {name: 'reader-ring', cx: win.x, cy: win.y, r: win.r + 4, fill: 'none', stroke: jurColor(ctx, M.relevant.key).c, 'stroke-width': 4, opacity: 0});
  const glyphSame = g({name: 'glyph-same', opacity: 0}, relGlyph(ctx, {same: true, x: glyphAt.x, y: glyphAt.y, s: 26, color: '#ffffff'}));
  const glyphDiff = g({name: 'glyph-diff', opacity: 0}, relGlyph(ctx, {same: false, x: glyphAt.x, y: glyphAt.y, s: 26, color: '#ffd166'}));
  // scanning beam from the reader down to seal height
  const sealY = railY + DOC.hook + DOC.w * 0.085 + DOC.w * 0.155;
  const beam = h('path', {name: 'beam', d: `M${r(gx - 14)} ${r(archTop + 16)}L${r(gx + 14)} ${r(archTop + 16)}L${r(gx + 46)} ${r(sealY + 26)}L${r(gx - 46)} ${r(sealY + 26)}Z`, fill: '#ffe58a', opacity: 0});

  // switch: blade + pivot bolt + small motor box
  const blade = g({name: 'blade'},
    h('line', {x1: 0, y1: 0, x2: P.blade, y2: 0, stroke: th.ink, 'stroke-width': 15, 'stroke-linecap': 'round'}),
    h('line', {x1: 0, y1: 0, x2: P.blade, y2: 0, stroke: th.accent3, 'stroke-width': 10, 'stroke-linecap': 'round'}),
    h('circle', {cx: P.blade, cy: 0, r: 4, fill: th.ink}),
  );
  const motor = g(null,
    h('line', {x1: pivot.x, x2: pivot.x, y1: Math.max(0, railY - 150), y2: railY - 34, stroke: th.metal, 'stroke-width': 4}),
    h('path', {d: roundRectPath(pivot.x - 28, railY - 46, 56, 34, 8), fill: th.metal, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: `M${r(pivot.x - 14)} ${r(railY - 29)}h28`, stroke: th.ink, 'stroke-width': 2, opacity: 0.5}),
  );
  const bolt = h('circle', {cx: pivot.x, cy: railY, r: 10, fill: th.accent3, stroke: th.ink, 'stroke-width': 2.5});

  // terminal (search kiosk) on the floor, card slot on top
  const kx = P.kiosk.x;
  // research card (keyed at the top so the emblem and name stay visible when inserted)
  const CW = 136 * Math.min(1, k + 0.05), CH = 86 * Math.min(1, k + 0.05);
  const card = cardNode(ctx, {prefix: 'card', w: CW, h: CH, query: o.query, jur: M.relevant, textLevel: o.textLevel});
  // the same card drawn in front of the terminal: used while the card is carried in front of
  // the terminal head; the entry swaps to `card` (behind the head) once the card is above the
  // slot, where both copies render identically
  const cardFront = cardNode(ctx, {prefix: 'cardF', w: CW, h: CH, query: o.query, jur: M.relevant, textLevel: o.textLevel});
  const headW = Math.max(132 * k, CW + 16), headH = 62 * k;
  // a table-height terminal: the slot sits below the researcher's chin, so the card is carried
  // and lowered into it at chest height, never level with her face
  const slotY = P.F - 220 * k;
  const kiosk = {
    back: g(null,
      h('ellipse', {cx: kx, cy: P.F + 2, rx: 44 * k, ry: 9 * k, fill: th.ink, opacity: 0.85}),
      h('rect', {x: kx - 11 * k, y: slotY + headH - 4, width: 22 * k, height: P.F - slotY - headH + 4, fill: th.metal, stroke: th.ink, 'stroke-width': 2.5}),
      // slot mouth (behind the card)
      h('path', {d: roundRectPath(kx - CW / 2 - 4, slotY - 7, CW + 8, 12, 4), fill: '#1e2226'}),
    ),
    front: g(null,
      h('path', {d: `M${r(kx - headW / 2)} ${r(slotY)}H${r(kx + headW / 2)}L${r(kx + headW / 2 + 6)} ${r(slotY + headH)}H${r(kx - headW / 2 - 6)}Z`, fill: '#e9edf1', stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
      h('path', {d: roundRectPath(kx - headW / 2 + 12, slotY + 12, headW - 24, headH - 22, 6), fill: '#27313a', stroke: th.ink, 'stroke-width': 1.5}),
      // magnifier glyph on the screen
      h('circle', {cx: kx - headW / 2 + 32, cy: slotY + headH / 2 + 1, r: 8 * k, fill: 'none', stroke: '#9fd3ff', 'stroke-width': 3}),
      h('line', {x1: kx - headW / 2 + 38, y1: slotY + headH / 2 + 7, x2: kx - headW / 2 + 45, y2: slotY + headH / 2 + 14, stroke: '#9fd3ff', 'stroke-width': 3, 'stroke-linecap': 'round'}),
      h('rect', {x: kx - headW / 2 + 54, y: slotY + headH / 2 - 7, width: headW * 0.42, height: 5, rx: 2, fill: '#9fd3ff', opacity: 0.8}),
      h('rect', {x: kx - headW / 2 + 54, y: slotY + headH / 2 + 4, width: headW * 0.28, height: 5, rx: 2, fill: '#9fd3ff', opacity: 0.5}),
      h('rect', {x: kx - headW / 2, y: slotY - 3, width: headW, height: 6, fill: shade('#e9edf1', -0.15)}),
    ),
    slotY, box: {x: kx - headW / 2 - 6, y: slotY - 8, w: headW + 12, h: P.F - slotY + 8},
  };
  // cable from the terminal head up to the arch (keys the reader)
  const c0 = {x: kx + headW / 2 - 4, y: slotY + headH * 0.5};
  const toLeft = c0.x < archX + archW * 0.5;
  const c3 = toLeft ? {x: archX + post / 2, y: archBot - 8} : {x: archX + archW - post / 2, y: archBot - 8};
  const c1 = {x: c0.x + 60, y: c0.y + 30}, c2 = {x: c3.x + (toLeft ? -40 : 40), y: c3.y + Math.max(60, (c0.y - c3.y) * 0.8)};
  const cableD = `M${r(c0.x)} ${r(c0.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(c3.x)} ${r(c3.y)}`;
  const cablePoint = t => {
    const u1 = 1 - t;
    return {x: u1 ** 3 * c0.x + 3 * u1 * u1 * t * c1.x + 3 * u1 * t * t * c2.x + t ** 3 * c3.x, y: u1 ** 3 * c0.y + 3 * u1 * u1 * t * c1.y + 3 * u1 * t * t * c2.y + t ** 3 * c3.y};
  };
  const cable = g(null,
    h('path', {d: cableD, fill: 'none', stroke: th.ink, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {d: cableD, fill: 'none', stroke: '#6b7580', 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
  );
  const pulse = g({name: 'pulse', opacity: 0},
    h('circle', {r: 13, fill: jurColor(ctx, M.relevant.key).c, opacity: 0.3}),
    h('circle', {r: 6.5, fill: jurColor(ctx, M.relevant.key).c, stroke: '#ffffff', 'stroke-width': 2}));


  // documents (index order = draw order: later docs on top)
  const docs = M.docs.map(d => {
    const sheet = sourceSheet(ctx, {prefix: `doc${d.i}-sheet`, w: DOC.w, h: DOC.h, doc: d, jur: {key: d.key, name: d.name}, detail: 'small'});
    return {
      d, sheet,
      node: g({name: `doc${d.i}`},
        h('line', {x1: 0, y1: 0, x2: 0, y2: DOC.hook + 4, stroke: th.ink, 'stroke-width': 2.2}),
        h('circle', {cx: -8, cy: -4, r: 5.5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.8}),
        h('circle', {cx: 8, cy: -4, r: 5.5, fill: th.metal, stroke: th.ink, 'stroke-width': 1.8}),
        g({transform: T(-DOC.w / 2, DOC.hook)}, sheet.node,
          h('path', {d: roundRectPath(DOC.w / 2 - 9, -5, 18, 12, 3), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5})),
      ),
    };
  });

  /**
   * Pose documents, switch and reader for action time `a` (already capped).
   * @param {number} a
   * @param {{run:boolean, keyed:number}} s
   */
  function pose(a, s) {
    const nodes = {};
    const sem = {docs: []};
    const boxes = [];
    const ang = s.run ? bladeAngle(a) : P.thetaB;
    nodes.blade = {transform: T(pivot.x, pivot.y, ang)};
    let reading = null;
    trips.forEach((tr, i) => {
      const sArc = s.run ? sOf(tr, a) : tr.s0;
      const q = tr.route.poly.at(sArc / tr.route.poly.total);
      const l1a = s.run ? seg(a, tr.t1, tr.aW) : 0;
      const l1b = s.run && tr.read > tr.go ? seg(a, tr.go, tr.read) : 0;
      const l2 = s.run ? seg(a, tr.depart, tr.t2) : 0;
      const legSwing = x => (x > 0 && x < 1 ? -4 * Math.sin(2 * Math.PI * x) : 0);
      const swing = ctx.reduced || !s.run ? 0 : legSwing(l1a) + legSwing(l1b) * 0.6 + legSwing(l2);
      nodes[`doc${i}`] = {transform: T(q.x, q.y, swing)};
      const state = !s.run || a <= tr.t1 ? 'library' : a >= tr.t2 ? tr.which : a >= tr.read && a < tr.depart ? 'reading' : a >= tr.aW && a < tr.go ? 'waiting' : 'moving';
      sem.docs.push({id: M.docs[i].id, state, x: r(q.x), y: r(q.y)});
      sem[`doc${i}`] = {x: r(q.x), y: r(q.y)};
      boxes.push({x: q.x - DOC.w / 2, y: q.y + DOC.hook, w: DOC.w, h: DOC.h});
      if (s.run && a >= tr.read - 0.01 && a < tr.depart + 0.01) {
        const on = Math.min(clamp((a - tr.read + 0.01) / 0.012), clamp((tr.depart + 0.01 - a) / 0.012));
        if (!reading || on > reading.on) reading = {i, on};
      }
    });
    // hide the text of a sheet while a later-drawn sheet covers it (no text on text)
    trips.forEach((tr, i) => {
      let cov = 0;
      for (let j = i + 1; j < n; j++) cov = Math.max(cov, coverFraction(boxes[i], boxes[j]));
      const op = r(1 - clamp((cov - 0.015) / 0.05), 3);
      nodes[`doc${i}-sheet-txt`] = {opacity: op};
      nodes[`doc${i}-sheet-dname`] = {opacity: op};
    });
    // reader: key after keying; beam + comparison glyph while a sheet passes
    nodes['reader-key'] = {opacity: r(s.keyed, 3)};
    nodes['reader-ring'] = {opacity: r(s.keyed, 3)};
    const beamOn = reading ? reading.on : 0;
    nodes.beam = {opacity: r(0.55 * beamOn, 3)};
    const rel = reading ? M.docs[reading.i].relevant : null;
    const glyphOn = reading ? clamp((a - trips[reading.i].read) / 0.008) * clamp((trips[reading.i].depart + 0.012 - a) / 0.012) : 0;
    nodes['glyph-same'] = {opacity: rel === true ? r(glyphOn, 3) : 0};
    nodes['glyph-diff'] = {opacity: rel === false ? r(glyphOn, 3) : 0};
    sem.bladeAngle = r(ang, 2);
    sem.reading = reading && reading.on > 0.5 ? M.docs[reading.i].id : null;
    sem.boxes = boxes;
    return {nodes, semantic: sem};
  }

  // check the schedule: the blade is set for each document when it passes the pivot
  const switchOk = trips.every(tr => Math.abs(bladeAngle(tr.uPivot) - (tr.which === 'A' ? P.thetaA : P.thetaB)) < 0.01 && Math.abs(bladeAngle(tr.uTip) - (tr.which === 'A' ? P.thetaA : P.thetaB)) < 0.01);
  const readBeforeFlip = flips.every(f => f.a >= trips[f.doc].read + 0.004);
  const departAfterSet = trips.every(tr => Math.abs(bladeAngle(tr.depart) - want(tr)) < 0.01);

  return {
    parts: {...parts, archBack, archFront, readerKey, readerRing, glyphSame, glyphDiff, beam, blade, bolt, motor, kiosk, cable, pulse, card, cardFront, docs},
    pose, trips, flips, switchOk, readBeforeFlip, departAfterSet, cablePoint, gap: gapUsed, minSheetGap: n > 1 ? minSheetGap : null,
    geo: {start, pivot, tipA, tipB, gx, archX, archW, archTop, archBot, readerY, readerW, slotY, kx, headW, CW, CH, cardVisible: card.visible, compX0, compX1, bc, routeA, routeB, rackSlots},
  };
}

/**
 * Research card for the story: the key row (emblem + relevant jurisdiction)
 * sits ABOVE the red rule, so it stays visible when the card's lower part is
 * inside the terminal slot. A long name wraps (at its hyphens first) and the
 * rule moves down to make room; `visible` is the height that must stay above
 * the slot. Local origin = top-left; grip = top centre.
 */
function cardNode(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const cardFill = '#fbf6e6';
  const showTxt = ctx.show(o.textLevel ?? 'all');
  const padX = w * 0.06;
  const es = hh * 0.3;
  const tx = padX + es * 1.15;
  const maxW = w - tx - padX * 0.8;
  let nameF = null;
  if (showTxt && o.jur.name) {
    const size = Math.max(12, hh * 0.19);
    const tries = [[1, size, 12], [2, size, 11.5], [3, size * 0.9, 10], [3, size * 0.9, 8]];
    for (const [ml, sz, mn] of tries) {
      nameF = fitHy(ctx, o.jur.name, {maxWidth: maxW, size: sz, minSize: mn, maxLines: ml, weight: 800});
      if (!nameF.truncated && !nameF.midWord) break;
    }
  }
  const blockH = nameF ? nameF.height : es;
  const rule = Math.min(hh * 0.76, Math.max(hh * 0.5, blockH + hh * 0.2));
  const rowY = rule * 0.5;
  const parts = [
    h('path', {d: roundRectPath(4, 6, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: cardFill, stroke: th.ink, 'stroke-width': 2.2}),
    h('line', {x1: 3, x2: w - 3, y1: rule, y2: rule, stroke: '#c8553d', 'stroke-width': 2}),
    rule + hh * 0.2 < hh - 6 ? h('line', {x1: 3, x2: w - 3, y1: rule + hh * 0.2, y2: rule + hh * 0.2, stroke: '#9fbfd6', 'stroke-width': 1.1}) : null,
    h('circle', {cx: w / 2, cy: hh - hh * 0.1, r: 3.2, fill: shade(cardFill, -0.35), stroke: th.ink, 'stroke-width': 1.2}),
    emblem(ctx, {key: o.jur.key, s: es, x: padX + es * 0.55, y: rowY}),
  ];
  const txt = [];
  if (nameF) {
    txt.push(textBlock(nameF, {x: tx, y: rowY - nameF.height / 2 - nameF.size * 0.04, fill: jurColor(ctx, o.jur.key).c}));
  } else {
    parts.push(h('rect', {x: tx, y: rowY - hh * 0.05, width: w * 0.45, height: hh * 0.1, rx: 2, fill: jurColor(ctx, o.jur.key).c, opacity: 0.6}));
  }
  if (hh - rule > hh * 0.3) {
    if (showTxt && o.query) {
      const f = ctx.fit(o.query, {maxWidth: w - w * 0.1, size: Math.max(9, hh * 0.13), minSize: 7, maxLines: 1, weight: 500});
      txt.push(textBlock(f, {x: w * 0.05, y: rule + hh * 0.05, fill: th.inkSoft}));
    } else {
      parts.push(h('rect', {x: w * 0.05, y: rule + hh * 0.07, width: w * 0.7, height: hh * 0.07, rx: 2, fill: th.inkSoft, opacity: 0.5}));
    }
  }
  return {node: g({name: o.prefix}, parts, g({name: `${o.prefix}-txt`}, txt)), w, h: hh, grip: {x: w / 2, y: 0}, rule, visible: rule + 5};
}
