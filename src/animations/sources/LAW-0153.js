/**
 * LAW-0153 — Interpretaciones concurrentes · story
 *
 * Storyboard (top-down light-table desk; brief beats in brackets):
 *  [0.00–0.15] rest: the open source book (anchor) with its passage band
 *              marked and a ribbon running to the passage slip, which lies
 *              on an unlit light table; two empty-looking tracing overlays
 *              rest in two equal reading trays (A, B), each tray labelled
 *              with its reader; the editable hierarchy board lies on the
 *              desk. Reader A leans in and flips the table's
 *              switch; reader B reaches for the tab of overlay B.
 *  [0.15–0.42] action: the table lights up (cause → effect). Each hand takes
 *              its overlay by the pull tab and slides it out of its tray onto
 *              the lit passage; both overlays register exactly on the slip.
 *              The light shows the words through the vellum and a scan line
 *              traces the passage onto BOTH overlays.
 *  [0.42–0.73] complete: each overlay gets its OWN highlight pattern — A
 *              over the words reading A focuses on (square ends), B over the
 *              words reading B focuses on (round ends): one passage, two
 *              patterns at once. The hands slide the overlays apart, back
 *              into their trays (off the glass they turn opaque again), let
 *              go and withdraw. An attributed reading card appears under each
 *              overlay: "Proposed (as supplied)". The passage stays, whole,
 *              on the table between them.
 *  [0.73–1.00] hold: the supplied final state tag, the neutral key "as
 *              supplied · no conclusion drawn" and the author's annotations.
 *              Both readings keep equal size and weight; none is marked
 *              correct, preferred or prevailing.
 * finalState 'separated' (default) runs the whole action; 'traced' stops with
 * both overlays still stacked on the passage (both patterns visible);
 * 'placed' stops once the overlays lie on the passage, before tracing.
 * actionProgress < 1 freezes the action part-way.
 *
 * Layouts: 16:9 = tray A | table | tray B with the book above the table and
 * the board and notes beside and below it; arms reach in from the far (top)
 * edge. 9:16 = book + board, table, trays side by side, notes; 1:1 = book |
 * table | board over the two trays. In 9:16 the arms reach in from the side
 * edges, in 1:1 from the near (bottom) edge, clear of the board. In 9:16 and
 * 1:1 the view pushes in on the light table while the overlays are traced
 * (the emptied trays leave the frame) and pulls back before the overlays are
 * slid apart into the trays.
 * @module animations/sources/LAW-0153
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {mix, dist, ik2} from '../../core/geometry.js';
import {storyFields, str} from '../../schemas/fields.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  icFields, IC_DEFAULTS, IC_STRINGS, kitT, icColors, laneOf, sourceOf, pxPerUnit,
  passageLayout, phraseSpan, passageSlip, overlayArt, overlayFrame, lightTable, lightTableFrame,
  trayArt, trayLipH, readingCardArt, openBook, ribbonArt, hierarchyBoard, notePlate, measureNote,
  overlaps, inside, segmentHits, TRACE_MARK, STRIPE,
} from './kits/interpretaciones-concurrentes.js';

const ID = 'LAW-0153';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  enterA: [0.02, 0.1], press: [0.1, 0.125], light: [0.12, 0.17], toTabA: [0.125, 0.195],
  enterB: [0.05, 0.195],
  slide: [0.2, 0.34], trace: [0.35, 0.45], band: [0.43, 0.52],
  zoomIn: [0.33, 0.4], zoomOut: [0.485, 0.54],
  lift: [0.515, 0.545], split: [0.545, 0.67], release: [0.67, 0.69], withdraw: [0.69, 0.77],
  cards: [0.64, 0.73], state: [0.75, 0.81], key: [0.77, 0.83], notes: [0.8, 0.88],
};
const FINAL = ['separated', 'traced', 'placed'];
/** Where the hands let go and leave, per supplied final state. */
const STOP = {separated: W.split[1], traced: W.band[1] + 0.01, placed: W.slide[1] + 0.01};
const ACTION_START = W.enterA[0];
const GRIP = 0.195;

const sceneSchema = {
  ...icFields,
  ...storyFields({table: str('Label on the light table frame', 40)}, ['book', 'passage', 'board', 'table'], FINAL),
};
sceneSchema.actorLabels.properties.a.description = 'Reader A (printed on tray A, the tray of overlay A)';
sceneSchema.actorLabels.properties.b.description = 'Reader B (printed on tray B, the tray of overlay B)';

const defaultParams = {
  ...IC_DEFAULTS,
  actorLabels: {a: 'Reader A', b: 'Reader B'},
  objectLabels: {table: 'Light table'},
  actionProgress: 1,
  annotations: [{target: 'passage', text: 'One passage, two highlight patterns'}],
  finalState: 'separated',
};

const STRINGS = {en: {}, es: {}};
for (const loc of ['en', 'es']) Object.assign(STRINGS[loc], IC_STRINGS[loc]);

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

/**
 * Greedy packing of note items into free zones (top to bottom). Each item
 * tries its preferred zones in order; `accept(box)` can reject a spot (e.g.
 * when the leader from there would cross an object).
 */
function packZones(zones, items, gap) {
  const cur = zones.map(z => ({...z, cy: z.y, cx: z.x, rowH: 0}));
  return items.map(it => {
    const order = it.zones ? it.zones.map(i => cur[i]).filter(Boolean) : cur;
    for (const z of order) {
      if (z.flow) {
        // row flow: items side by side, wrapping to a new row (centred rows are not needed here)
        // try the rest of the current row first, then a new row
        const rest = z.x + z.w - z.cx;
        let m = rest > 0 ? it.measure(rest) : null;
        let x = z.cx, y = z.cy;
        if (!m || m.truncated || m.w > rest + 0.5 || y + m.h > z.y + z.h + 0.5) {
          m = it.measure(z.w);
          if (m.truncated || m.w > z.w + 0.5) continue;
          if (x > z.x) { x = z.x; y = z.cy + z.rowH + gap; }
        }
        if (y + m.h > z.y + z.h + 0.5) continue;
        const out = {x, y, w: m.w, h: m.h, maxW: z.x + z.w - x};
        if (it.accept && !it.accept(out)) continue;
        if (y !== z.cy) { z.cy = y; z.rowH = 0; }
        z.cx = x + m.w + gap;
        z.rowH = Math.max(z.rowH, m.h);
        return out;
      }
      const m = it.measure(z.w);
      if (m.w <= z.w + 0.5 && z.cy + m.h <= z.y + z.h + 0.5 && !m.truncated) {
        const x = z.align === 'right' ? z.x + z.w - m.w : z.align === 'center' ? z.x + (z.w - m.w) / 2 : z.x;
        const out = {x, y: z.cy, w: m.w, h: m.h, maxW: z.w};
        if (it.accept && !it.accept(out)) continue;
        z.cy += m.h + gap;
        return out;
      }
    }
    return null;
  });
}

/** Nearest point of a box to a point. */
const nearest = (b, q) => ({x: clamp(q.x, b.x, b.x + b.w), y: clamp(q.y, b.y, b.y + b.h)});

/** Magnifier footprint (lens circle + handle) for a centre and angle. */
function magBox(c, R, len, angleDeg) {
  const a = (angleDeg * Math.PI) / 180;
  const ex = c.x + Math.cos(a) * len, ey = c.y + Math.sin(a) * len;
  const x0 = Math.min(c.x - R * 1.2, ex - R * 0.4), x1 = Math.max(c.x + R * 1.2, ex + R * 0.4);
  const y0 = Math.min(c.y - R * 1.2, ey - R * 0.4), y1 = Math.max(c.y + R * 1.2, ey + R * 0.4);
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

function tryLayout(ctx, F) {
  const p = ctx.params;
  const t = kitT(ctx);
  const C = icColors(ctx);
  const shape = ctx.view.shape;
  const Wd = ctx.design.w, Hd = ctx.design.h;
  const m = F * 0.9, gp = F * 0.8;
  const pad = F * 0.8, edge = Math.max(10, F * 0.45), tabW = Math.max(F * 1.5, 30), rail = F * 1.5, gi = F * 0.5, rim = Math.max(14, F * 0.6);
  const trayFixed = pad * 2 + tabW + gi * 3 + rim * 2;
  const tableFixed = edge + pad * 2 + (tabW + F * 0.4) * 2 + rail * 2;
  const sideMin = F * 9.5;
  let PLw;
  let trayW = null;
  if (shape === 'landscape') PLw = (Wd - m * 2 - gp * 2 - trayFixed * 2 - tableFixed) / 3;
  else if (shape === 'portrait') {
    trayW = Wd - m * 2;
    // leave room beside the table for a note
    PLw = Math.min(F * 17, Wd - m * 2 - tableFixed - F * 11);
  } else {
    trayW = (Wd - m * 2 - gp) / 2;
    PLw = trayW - trayFixed;
    if (shape === 'square') PLw = Math.min(PLw, Wd - m * 2 - gp * 2 - sideMin * 2 - tableFixed);
  }
  PLw = Math.min(PLw, F * 21);
  const PL = passageLayout(ctx, p.passages.text, {w: PLw, size: F});
  const spans = [0, 1].map(k => phraseSpan(PL, p.interpretations[k].focus));
  const slip = passageSlip(ctx, {prefix: 'slip', PL, ref: p.passages.ref, F, color: C.book, pad});
  const ov = [0, 1].map(k => overlayArt(ctx, {prefix: `ov${k}`, PL, F, lane: laneOf(ctx, k), letter: k ? 'B' : 'A', side: k ? 'right' : 'left', span: spans[k], pad, stripe: k ? 'bottom' : 'top',
    // 1:1: pull tabs on the near edge (A at one quarter, B at three quarters): the hands work from below
    ...(shape === 'square' ? {side: 'bottom', tabAt: k ? 0.75 : 0.25} : {})}));
  if (trayW === null) trayW = ov[0].w + tabW + gi * 3 + rim * 2;
  const tableW = slip.w + (tabW + F * 0.4) * 2 + rail * 2;
  const nearTab = shape === 'square' ? Math.max(F * 1.5, 30) : 0;
  // (a near-edge tab on the table hangs over the bottom rail, which is as deep as the tab)
  const tableH = slip.h + 6 + F * 1.2 + rail * 2;
  // portrait trays run the full width: the card sits beside the overlay (A: right of it, B: left of it)
  const beside = shape === 'portrait' && trayW - rim * 2 - ov[0].w - tabW - gi * 4 >= F * 11;
  const cardW = beside ? trayW - rim * 2 - ov[0].w - tabW - gi * 4 : trayW - rim * 2 - gi * 2;
  const mkCard = (k, minH) => readingCardArt(ctx, {w: cardW, F, lane: laneOf(ctx, k), letter: k ? 'B' : 'A', label: p.interpretations[k].label, text: p.interpretations[k].text, by: p.sources[sourceOf(p, k)].title, proposed: t.proposed, minH});
  const probe = [mkCard(0), mkCard(1)];
  const cardH = Math.max(probe[0].natural, probe[1].natural);
  const cards = [mkCard(0, cardH), mkCard(1, cardH)];
  const labels = [p.actorLabels.a, p.actorLabels.b];
  const lipH = Math.max(...labels.map(l => trayLipH(ctx, {w: trayW, F, label: l, rim})));
  // 1:1 trays: the card slot on top, the overlay slot below it (its near tab over the front lip)
  const trayNeed = Math.max(0, nearTab - F * 0.9) + (beside ? rim + gi + Math.max(ov[0].h, cardH) + gi + lipH : rim + gi + ov[0].h + gi + cardH + gi + lipH);
  let fits = true;
  const why = [];
  const need = (c, n) => { if (!c) { fits = false; why.push(n); } };
  let trayBox = [], tableBox, bookO, bookBox, boardO, boardBox, zones, entry;

  if (shape === 'landscape') {
    trayBox = [{x: m, y: m, w: trayW, h: trayNeed}, {x: Wd - m - trayW, y: m, w: trayW, h: trayNeed}];
    const cx0 = m + trayW + gp, Cw = Wd - m * 2 - gp * 2 - trayW * 2;
    need(Cw >= tableW, '1:Cw >= tableW');
    const bookW = Math.min(tableW, Cw - F * 6 - gp);
    bookO = openBook(ctx, {prefix: 'book', w: Math.max(F * 14, bookW), F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
    bookBox = {x: cx0 + (Cw - tableW) / 2, y: m, w: bookO.w, h: bookO.h};
    tableBox = {x: cx0 + (Cw - tableW) / 2, y: m + bookO.h + gp * 1.2, w: tableW, h: tableH};
    need(tableBox.y + tableH <= Hd - m, '2:tableBox.y + tableH <= Hd - m');
    const by = m + trayNeed + gp;
    boardO = hierarchyBoard(ctx, {prefix: 'board', w: trayW, F, p, t});
    boardBox = {x: m, y: by, w: trayW, h: boardO.h};
    need(by + boardO.h <= Hd - m, '3:by + boardO.h <= Hd - m');
    const zy = tableBox.y + tableH + gp;
    zones = [
      {x: Wd - m - trayW, y: by, w: trayW, h: Hd - m - by, align: 'center'},
      {x: cx0, y: zy, w: Cw, h: Math.max(0, Hd - m - zy), align: 'center'},
      {x: bookBox.x + bookBox.w + gp, y: m, w: cx0 + Cw - (bookBox.x + bookBox.w + gp), h: tableBox.y - gp - m, align: 'center'},
      {x: m, y: by + boardO.h + gp, w: trayW, h: Math.max(0, Hd - m - (by + boardO.h + gp)), align: 'center'},
    ];
    entry = 'top';
  } else if (shape === 'portrait') {
    // book + board | tray A | table | tray B | notes: the readings split up and down
    const colW = (Wd - m * 2 - gp) / 2;
    bookO = openBook(ctx, {prefix: 'book', w: colW, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book});
    boardO = hierarchyBoard(ctx, {prefix: 'board', w: colW, F, p, t});
    const r1 = Math.max(bookO.h, boardO.h);
    const used = m * 2 + r1 + trayNeed * 2 + tableH + gp * 4 + F * 2.4;
    need(used <= Hd, '4:portrait height');
    const gx = gp + clamp((Hd - used) / 5, 0, F * 1.6);
    bookBox = {x: m, y: m + (r1 - bookO.h) / 2, w: colW, h: bookO.h};
    boardBox = {x: m + colW + gp, y: m, w: colW, h: boardO.h};
    const ya = m + r1 + gx;
    trayBox[0] = {x: m, y: ya, w: trayW, h: trayNeed};
    // the table sits to the left; the notes use the column beside it
    tableBox = {x: m, y: ya + trayNeed + gx, w: tableW, h: tableH};
    need(tableW <= Wd - m * 2 + 0.5, '5:tableW');
    trayBox[1] = {x: m, y: tableBox.y + tableH + gx, w: trayW, h: trayNeed};
    const zy = trayBox[1].y + trayNeed + gx;
    const side = Wd - m * 2 - tableW - gp;
    zones = [
      {x: m, y: zy, w: Wd - m * 2, h: Math.max(0, Hd - m - zy), align: 'center'},
      {x: m + tableW + gp, y: tableBox.y, w: Math.max(0, side), h: tableH, align: 'center'},
      {x: m + tableW + gp, y: tableBox.y, w: 0, h: 0, align: 'center'},
      {x: m, y: bookBox.y + bookO.h + gp * 0.5, w: colW, h: Math.max(0, ya - gx - (bookBox.y + bookO.h + gp * 0.5)), align: 'center'},
    ];
    entry = 'side';
  } else {
    const sideW = (Wd - m * 2 - gp * 2 - tableW) / 2;
    need(sideW >= sideMin * 0.98, '6:sideW >= sideMin * 0.98');
    bookO = openBook(ctx, {prefix: 'book', w: sideW, F, title: p.sources[0].title, id: p.sources[0].id, color: C.book, orient: 'v'});
    boardO = hierarchyBoard(ctx, {prefix: 'board', w: sideW, F, p, t, stack: true});
    tableBox = {x: m + sideW + gp, y: m, w: tableW, h: tableH};
    const ty = Hd - m - trayNeed;
    const r1 = ty - gp * 1.2 - m;
    need(bookO.h <= r1 && boardO.h <= r1 && tableH <= r1, '7:bookO.h <= r1 && boardO.h <= r1 && table');
    bookBox = {x: m, y: m, w: sideW, h: bookO.h};
    boardBox = {x: Wd - m - sideW, y: m, w: sideW, h: boardO.h};
    trayBox = [{x: m, y: ty, w: trayW, h: trayNeed}, {x: Wd - m - trayW, y: ty, w: trayW, h: trayNeed}];
    const below = y => Math.max(0, ty - gp - y);
    zones = [
      {x: tableBox.x, y: tableBox.y + tableH + gp, w: tableW, h: below(tableBox.y + tableH + gp), flow: true},
      {x: m, y: bookBox.y + bookO.h + gp, w: sideW, h: below(bookBox.y + bookO.h + gp), align: 'center'},
      {x: boardBox.x, y: boardBox.y + boardO.h + gp, w: sideW, h: below(boardBox.y + boardO.h + gp), align: 'center'},
    ];
    entry = 'bottom';
  }

  // table art (switch on the top rail near the left corner, label on the bottom rail)
  const table = lightTable(ctx, {prefix: 'lt', w: tableW, h: tableH, rail, F, label: p.objectLabels.table, switchBottom: shape === 'square'});
  const slipPos = {x: tableBox.x + (tableW - slip.w) / 2 + (edge * 0) , y: tableBox.y + rail + F * 0.6};
  const onTable = k => ({x: slipPos.x + slip.text.x - ov[k].text.x, y: slipPos.y + slip.text.y - ov[k].text.y});
  const trays = [0, 1].map(k => trayArt(ctx, {w: trayBox[k].w, h: trayBox[k].h, lane: laneOf(ctx, k), letter: k ? 'B' : 'A', label: labels[k], F, rim}));
  const floorW = k => ({x: trayBox[k].x + trays[k].floor.x, y: trayBox[k].y + trays[k].floor.y, w: trays[k].floor.w, h: trays[k].floor.h});
  const rest = [0, 1].map(k => {
    const fl = floorW(k);
    if (nearTab) return {x: fl.x + (fl.w - ov[k].w) / 2, y: fl.y + gi + cardH + gi};
    const x = k ? fl.x + fl.w - gi - tabW + 4 - ov[k].w : fl.x + gi + tabW - 4;
    return {x: x + (k ? -gi * 0.5 : gi * 0.5), y: beside ? fl.y + Math.max(gi, (fl.h - ov[k].h) / 2) : fl.y + gi};
  });
  const cardPos = [0, 1].map(k => {
    const fl = floorW(k);
    if (beside) return {x: k ? fl.x + gi : fl.x + fl.w - gi - cardW, y: fl.y + gi};
    if (nearTab) return {x: fl.x + gi, y: fl.y + gi};
    return {x: fl.x + gi, y: rest[k].y + ov[k].h + gi};
  });
  need([0, 1].every(k => cardPos[k].y + cardH <= floorW(k).y + floorW(k).h + 0.5), '8:[0, 1].every(k => cardPos[k].y + cardH <');

  // ribbon: from the book's passage band to the slip's near edge
  const bb = {x: bookBox.x + bookO.band.x, y: bookBox.y + bookO.band.y, w: bookO.band.w, h: bookO.band.h};
  let ribFrom, ribTo, ribC1, ribC2;
  if (shape === 'landscape') {
    ribFrom = {x: bb.x + bb.w * 0.8, y: bb.y + bb.h * 0.5};
    ribTo = {x: slipPos.x + slip.w * 0.85, y: slipPos.y + 4};
    ribC1 = {x: ribFrom.x + F * 2, y: ribFrom.y + F * 1.5};
    ribC2 = {x: ribTo.x, y: ribTo.y - F * 2.5};
  } else if (shape === 'portrait') {
    ribFrom = null;
  } else {
    ribFrom = {x: bb.x + bb.w * 0.8, y: bb.y + bb.h * 0.5};
    ribTo = {x: slipPos.x + 6, y: slipPos.y + slip.h * 0.2};
    ribC1 = {x: ribFrom.x + F * 2.5, y: ribFrom.y};
    ribC2 = {x: ribTo.x - F * 3, y: ribTo.y};
  }

  // notes: state tag, key, annotations
  const all = ctx.show('all'), key = ctx.show('key');
  const noteSize = F;
  const stateText = {separated: t.stateSeparated, traced: t.stateTraced, placed: t.statePlaced}[p.finalState];
  const items = [];
  const noteM = (text, sz, wt, ml) => w => {
    const q = measureNote(ctx, text, {maxWidth: Math.min(w, F * 18), size: sz, weight: wt, maxLines: ml});
    return {w: q.w, h: q.h, truncated: q.fit.truncated};
  };
  // zone preference per layout: [notes, magnifier, annotations]
  const pref = shape === 'landscape' ? {note: [0, 2, 1, 3], ann: [1, 0, 2, 3]}
    : shape === 'portrait' ? {note: [0, 3, 1, 2], ann: [0, 3, 2, 1]}
      : {note: [0, 1, 2], ann: [0, 2, 1]};
  const slipBoxW = {x: slipPos.x, y: slipPos.y, w: slip.w, h: slip.h};
  const tgtBox = {book: bookBox, passage: slipBoxW, board: boardBox, table: tableBox};
  const container = {passage: [tableBox], table: [slipBoxW]};
  const blockers = () => [bookBox, boardBox, tableBox, trayBox[0], trayBox[1]];
  const leaderOk = (a, nb) => {
    const tb = tgtBox[a.target];
    if (!tb) return true;
    const c = {x: nb.x + nb.w / 2, y: nb.y + nb.h / 2};
    const to = nearest(tb, c), from = nearest(nb, to);
    if (dist(from, to) > F * 16) return false;
    const skip = [tb, ...(container[a.target] || [])];
    const ok = [...blockers().filter(b => !skip.includes(b)), ...taken].every(b => !segmentHits(from, to, b, 2));
    if (ok) { leaders.push([from, to]); taken.push(nb); }
    return ok;
  };
  const leaders = [], taken = [];
  const clearOfLeaders = nb => {
    const ok = leaders.every(([a, b]) => !segmentHits(a, b, nb, 4));
    if (ok) taken.push(nb);
    return ok;
  };
  if (all) p.annotations.forEach((a, i) => items.push({kind: 'note', i, zones: pref.ann, measure: noteM(a.text, noteSize, 600, 4), accept: nb => leaderOk(a, nb)}));
  if (key) items.push({kind: 'state', zones: pref.note, measure: noteM(stateText, noteSize * 0.92, 700, 4), accept: clearOfLeaders});
  if (key) items.push({kind: 'key', zones: pref.note, measure: noteM(t.key, noteSize * 0.88, 600, 4), accept: clearOfLeaders});
  const placed = packZones(zones, items, gp * 0.6);
  need(placed.every(Boolean), `9:unplaced ${items.filter((_, i) => !placed[i]).map(it => it.kind).join(",")}`);
  const pl = kind => placed[items.findIndex(it => it.kind === kind)];
  const stP = pl('state'), keyP = pl('key');
  const state = stP ? notePlate(ctx, {text: stateText, x: stP.x, y: stP.y, maxWidth: Math.min(stP.maxW, F * 18), size: noteSize * 0.92, name: 'state', color: C.b.ink, weight: 700, maxLines: 4, level: 'key'}) : null;
  const keyN = keyP ? notePlate(ctx, {text: t.key, x: keyP.x, y: keyP.y, maxWidth: Math.min(keyP.maxW, F * 18), size: noteSize * 0.88, name: 'key', weight: 600, maxLines: 4, dash: true, level: 'key'}) : null;
  const notes = [];
  items.forEach((it, idx) => {
    if (it.kind !== 'note') return;
    const P0 = placed[idx];
    if (!P0) return;
    const a = p.annotations[it.i];
    const np = notePlate(ctx, {text: a.text, x: P0.x, y: P0.y, maxWidth: Math.min(P0.maxW, F * 18), size: noteSize, name: `note${it.i}-chip`, weight: 600, maxLines: 4});
    const b = np.box;
    const c = {x: b.x + b.w / 2, y: b.y + b.h / 2};
    const tb = tgtBox[a.target];
    const tg = nearest(tb, c);
    const from = nearest(b, tg);
    const len = dist(from, tg);
    notes.push({i: it.i, np, from, to: tg, len, box: b});
  });

  // arms: shoulders solved from the grips they must reach
  const gripAt = (k, pos) => ({x: pos.x + ov[k].grip.x, y: pos.y + ov[k].grip.y});
  const sw = {x: tableBox.x + table.switchAt.x, y: tableBox.y + table.switchAt.y};
  const targetsOf = k => (k ? [gripAt(1, rest[1]), gripAt(1, onTable(1))] : [sw, gripAt(0, rest[0]), gripAt(0, onTable(0))]);
  const ARM = F * 2.1;
  const HAND = 24 * 1.3 * (ARM / 46);
  const arms = [0, 1].map(k => {
    const tg = targetsOf(k);
    const g2 = [gripAt(k, rest[k]), gripAt(k, onTable(k))];
    const off = F * 4;
    let s, dir;
    if (entry === 'top') {
      s = {x: (g2[0].x + g2[1].x) / 2, y: -off};
      dir = {x: 0, y: 1};
    } else if (entry === 'bottom') {
      // 1:1: from the near edge, below each reader's tray (never across the book or the board)
      s = {x: (g2[0].x + g2[1].x) / 2, y: Hd + off};
      dir = {x: 0, y: -1};
    } else {
      s = {x: k ? Wd + off : -off, y: (g2[0].y + g2[1].y) / 2};
      dir = {x: k ? -1 : 1, y: 0};
    }
    const dmax = Math.max(...tg.map(q => dist(s, q)));
    const L = Math.max(F * 8, (dmax * 1.06 - HAND) / 2);
    // withdrawn: the shoulder leans back out of the frame, the hand rests off the desk
    const sOut = {x: s.x - dir.x * L * 1.5, y: s.y - dir.y * L * 1.5};
    const handOut = {x: sOut.x + dir.x * L * 1.25, y: sOut.y + dir.y * L * 1.25};
    const look = actorLook(ctx, null, k);
    const rig = topArm(ctx, {name: `arm${k}`, skin: look.skin, sleeve: look.outfit, handed: k ? 'left' : 'right', upper: L, lower: L, width: ARM});
    // elbow outward (away from the other reader / towards the frame edge)
    const probeT = g2[1];
    const e1 = ik2(s, probeT, L, L + HAND, 1).elbow, e2 = ik2(s, probeT, L, L + HAND, -1).elbow;
    let bend;
    if (entry === 'top' || entry === 'bottom') bend = k ? (e1.x > e2.x ? 1 : -1) : (e1.x < e2.x ? 1 : -1);
    else bend = e1.y > e2.y ? 1 : -1;
    return {s, sOut, dir, handOut, rig, bend, L};
  });

  // layout checks (semantics)
  const objBoxes = {
    book: bookBox, board: {...boardBox, h: boardO.h}, table: tableBox,
    trayA: trayBox[0], trayB: trayBox[1],
  };
  const noteBoxes = [state && state.box, keyN && keyN.box, ...notes.map(n => n.box)].filter(Boolean);
  const notesClear = noteBoxes.every(nb => Object.values(objBoxes).every(b => !overlaps(nb, b, 0)) && inside(nb, {x: 0, y: 0, w: Wd, h: Hd}));
  const leadersClear = notes.every(n => ![bookBox, trayBox[0], trayBox[1], boardBox].some(b => segmentHits(n.from, {x: n.to.x + (n.from.x - n.to.x) * 0.02, y: n.to.y + (n.from.y - n.to.y) * 0.04}, b, -2)));
  const objectsInside = Object.values(objBoxes).every(b => inside(b, {x: 0, y: 0, w: Wd, h: Hd}, 0.5));
  const noObjOverlap = [['book', 'table'], ['board', 'table'], ['book', 'board'], ['trayA', 'table'], ['trayB', 'table'], ['trayA', 'book'], ['trayB', 'board'], ['trayA', 'board'], ['trayB', 'book']]
    .every(([a, b]) => !overlaps(objBoxes[a], objBoxes[b], -1));
  need(objectsInside && noObjOverlap && PL.fitsWords, '10:objectsInside && noObjOverlap && PL.fits');

  // camera focus: a view of the design's aspect centred on the table (9:16, 1:1 only)
  let cam = null;
  if (shape !== 'landscape') {
    const Z = Math.min(1.75, (Wd * 0.94) / tableW, (Hd * 0.92) / tableH);
    const vw = Wd / Z, vh = Hd / Z;
    const cx = tableBox.x + tableW / 2, cy = tableBox.y + tableH / 2;
    cam = {Z, x: clamp(cx - vw / 2, 0, Wd - vw), y: clamp(cy - vh / 2, 0, Hd - vh), w: vw, h: vh};
  }
  return {
    cam, fits, F, shape, Wd, Hd, PL, spans, slip, ov, table, tableBox, slipPos, onTable, trays, trayBox, rest, cards, cardPos, cardH,
    bookO, bookBox, boardO, boardBox, rib: ribFrom ? {from: ribFrom, to: ribTo, c1: ribC1, c2: ribC2} : null, state, keyN, notes, arms, sw,
    rail, entry, why, notesClear, leadersClear, objectsInside, noObjOverlap, pxu: pxPerUnit(ctx),
  };
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

const scene = {
  sizes: {landscape: [1600, 800], square: [1100, 860], portrait: [1000, 1400]},
  layout(ctx) {
    const ppu = pxPerUnit(ctx);
    // aim at ~21.5 px at 1080p for supplied text; shrink (bounded, ≥ 16.4 px) until everything fits
    let last = null;
    for (let px = ctx.view.shape === 'landscape' ? 27 : 25; px >= 16.4; px -= 0.4) {
      const L = tryLayout(ctx, px / ppu);
      if (L.fits) return L;
      last = L;
    }
    return last;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = icColors(ctx);
    const desk = deskWindow(ctx, {prefix: 'desk', x: 0, y: 0, w: L.Wd, h: L.Hd, radius: 26});
    const ov = L.ov;
    // camera (9:16, 1:1): the whole desk scales about the light table; clipped to the design box
    return g({'clip-path': ctx.ref('camclip')},
      h('defs', null, h('clipPath', {id: ctx.id('camclip')}, h('rect', {x: 0, y: 0, width: r(L.Wd), height: r(L.Hd)}))),
      g({name: 'cam'},
      desk.surface,
      g({'clip-path': desk.clip},
        g({transform: T(L.bookBox.x, L.bookBox.y)}, L.bookO.node),
        g({transform: T(L.boardBox.x, L.boardBox.y)}, L.boardO.node),
        [0, 1].map(k => g({name: `tray${k}`, transform: T(L.trayBox[k].x, L.trayBox[k].y)}, L.trays[k].node)),
        [0, 1].map(k => g({name: `card${k}`, transform: T(L.cardPos[k].x, L.cardPos[k].y), opacity: 0}, L.cards[k].node)),
        g({transform: T(L.tableBox.x, L.tableBox.y)}, L.table.node),
        g({transform: T(L.slipPos.x, L.slipPos.y)}, L.slip.node),
        L.rib && ribbonArt(ctx, {...L.rib, color: shade2(C.book), width: Math.max(8, L.F * 0.38), name: 'ribbon'}),
        [0, 1].map(k => g({name: `film${k}`, transform: T(L.rest[k].x, L.rest[k].y)}, ov[k].node)),
        L.notes.map(n => g({name: `note${n.i}`, opacity: 0},
          h('line', {name: `note${n.i}-lead`, x1: r(n.from.x), y1: r(n.from.y), x2: r(n.to.x), y2: r(n.to.y), stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': `${r(n.len)} ${r(n.len + 4)}`, 'stroke-dashoffset': r(n.len)}),
          h('circle', {cx: r(n.to.x), cy: r(n.to.y), r: 6, fill: th.inkSoft, stroke: th.card, 'stroke-width': 2}),
          n.np.node)),
        L.state && g({name: 'stateG', opacity: 0}, L.state.node),
        L.keyN && g({name: 'keyG', opacity: 0}, L.keyN.node),
        L.arms.map(a => g(null, a.rig.arm, a.rig.palm, a.rig.thumb)),
      ),
      desk.frame,
    ));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const fs = p.finalState;
    const stop = STOP[fs];
    const endU = fs === 'separated' ? W.withdraw[1] : stop + (W.withdraw[1] - W.withdraw[0]) + 0.02;
    const capU = lerp(ACTION_START, endU, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const w = name => seg(a, ...W[name]);
    const nodes = {};
    // light: flipped by reader A's press
    const glow = ease.inOutSine(w('light'));
    Object.assign(nodes, lightTableFrame('lt', glow, ease.inOutCubic(w('press')), L.rail));
    // overlays: tray → table (slide) → tray (split)
    const slideP = ease.inOutCubic(w('slide'));
    const splitP = fs === 'separated' ? ease.inOutCubic(w('split')) : 0;
    const traceP = fs === 'placed' ? 0 : ease.inOutSine(w('trace'));
    const bandP = fs === 'placed' ? 0 : ease.inOutSine(w('band'));
    const glass = {x: L.tableBox.x + L.table.glass.x, y: L.tableBox.y + L.table.glass.y, w: L.table.glass.w, h: L.table.glass.h};
    const films = [0, 1].map(k => {
      const on = L.onTable(k);
      const pos = splitP > 0 ? mix(on, L.rest[k], splitP) : mix(L.rest[k], on, slideP);
      const fb = {x: pos.x, y: pos.y, w: L.ov[k].w, h: L.ov[k].h};
      const ix = Math.max(0, Math.min(fb.x + fb.w, glass.x + glass.w) - Math.max(fb.x, glass.x));
      const iy = Math.max(0, Math.min(fb.y + fb.h, glass.y + glass.h) - Math.max(fb.y, glass.y));
      const overGlass = (ix * iy) / (fb.w * fb.h);
      // lifting the vellum off the glass (before sliding it apart) makes it opaque again
      const lifted = fs === 'separated' ? ease.inOutSine(w('lift')) * (1 - ease.inOutSine(seg(a, W.split[1] - 0.03, W.split[1]))) : 0;
      const sc = 1 + 0.025 * lifted;
      const cx = L.ov[k].w / 2, cy = L.ov[k].h / 2;
      nodes[`film${k}`] = {transform: `${T(pos.x + cx * (1 - sc), pos.y + cy * (1 - sc))} scale(${r(sc, 4)})`};
      Object.assign(nodes, overlayFrame(L.ov[k], {lit: glow * overGlass * (1 - lifted), trace: traceP, band: bandP}));
      const o0 = {x: pos.x + cx * (1 - sc), y: pos.y + cy * (1 - sc)};
      return {pos, overGlass, lifted, grip: {x: o0.x + L.ov[k].grip.x * sc, y: o0.y + L.ov[k].grip.y * sc}};
    });
    // hands
    const release = seg(a, stop, stop + 0.02);
    const out = seg(a, stop + 0.02, stop + 0.02 + (W.withdraw[1] - W.withdraw[0]));
    const reach = [];
    const hands = L.arms.map((arm, k) => {
      const grip = films[k].grip;
      let hand, lean;
      if (k === 0) {
        const e = ease.inOutCubic(w('enterA'));
        lean = e;
        const press = Math.sin(Math.PI * w('press')) * L.F * 0.25;
        const swPt = {x: L.sw.x, y: L.sw.y + press};
        if (a < W.press[1]) hand = mix(arm.handOut, swPt, e);
        else hand = mix(swPt, grip, ease.inOutCubic(w('toTabA')));
      } else {
        const e = ease.inOutCubic(w('enterB'));
        lean = clamp(e * 1.6);
        hand = mix(arm.handOut, grip, e);
      }
      let holding = a >= GRIP && release < 1;
      if (release > 0 || out > 0) {
        const lift = {x: grip.x - arm.dir.x * L.F * 0.6, y: grip.y - arm.dir.y * L.F * 0.6};
        hand = out > 0 ? mix(lift, arm.handOut, ease.inOutCubic(out)) : mix(grip, lift, ease.outCubic(release));
        lean = 1 - ease.inOutCubic(out);
        holding = false;
      }
      const sh = mix(arm.sOut, arm.s, lean);
      const pose = arm.rig.pose(sh, hand, arm.bend);
      Object.assign(nodes, pose.nodes);
      reach.push(pose.reached);
      // the drawn arm (shoulder → elbow → wrist, with its width) never lies across the hierarchy board
      const HAND = 24 * 1.3 * ((L.F * 2.1) / 46);
      const el = ik2(sh, hand, arm.L, arm.L + HAND, arm.bend).elbow;
      const bb = L.boardBox, pad = L.F * 1.05;
      const grown = {x: bb.x - pad, y: bb.y - pad, w: bb.w + pad * 2, h: L.boardO.h + pad * 2};
      const offBoard = !segmentHits(sh, el, grown, 0) && !segmentHits(el, pose.wrist, grown, 0);
      return {hand: pose.hand, holding, offBoard};
    });
    // cards, notes
    const cardsP = done ? seg(u, ...W.cards) : 0;
    [0, 1].forEach(k => { nodes[`card${k}`] = {opacity: r(clamp(cardsP * 1.4), 3), transform: T(L.cardPos[k].x, L.cardPos[k].y + (1 - ease.outCubic(cardsP)) * L.F * 0.6)}; });
    const stP = done ? seg(u, ...W.state) : 0;
    const keyP = done ? seg(u, ...W.key) : 0;
    const noteP = done ? seg(u, ...W.notes) : 0;
    if (L.state) nodes.stateG = {opacity: r(stP, 3)};
    if (L.keyN) nodes.keyG = {opacity: r(keyP, 3)};
    L.notes.forEach(n => {
      nodes[`note${n.i}`] = {opacity: noteP > 0 ? 1 : 0};
      nodes[`note${n.i}-lead`] = {'stroke-dashoffset': r(n.len * (1 - clamp(noteP * 1.6)))};
      nodes[`note${n.i}-chip`] = {opacity: r(clamp((noteP - 0.4) / 0.6), 3)};
    });
    // 9:16: while the overlays are on the table the emptied trays slide out of view (up / down) and
    // come back before the overlays are slid into them
    let trayOut = 0;
    if (L.shape === 'portrait') {
      trayOut = ease.inOutCubic(w('zoomIn')) * (1 - ease.inOutCubic(w('zoomOut')));
      [0, 1].forEach(k => {
        const dy = (k ? 1 : -1) * (L.trayBox[k].h + L.F * 2) * trayOut;
        nodes[`tray${k}`] = {transform: T(L.trayBox[k].x, L.trayBox[k].y + dy)};
      });
    }
    let camZ = 1;
    if (L.cam) {
      const z = ease.inOutCubic(w('zoomIn')) * (1 - ease.inOutCubic(w('zoomOut')));
      const V = {x: L.cam.x * z, y: L.cam.y * z, w: lerp(L.Wd, L.cam.w, z), h: lerp(L.Hd, L.cam.h, z)};
      camZ = L.Wd / V.w;
      nodes.cam = {transform: `scale(${r(camZ, 4)}) translate(${r(-V.x)} ${r(-V.y)})`};
    }
    const holder = k => (hands[k].holding ? 'hand' : films[k].overGlass > 0.98 ? 'table' : 'tray');
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const on0 = L.onTable(0), on1 = L.onTable(1);
    const regErr = Math.max(dist(films[0].pos, on0), dist(films[1].pos, on1));
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat, layout: L.shape, finalState: fs,
        handA: P2(hands[0].hand), handB: P2(hands[1].hand),
        gripA: P2(films[0].grip), gripB: P2(films[1].grip),
        filmA: P2({x: films[0].pos.x + L.ov[0].w / 2, y: films[0].pos.y + L.ov[0].h / 2}),
        filmB: P2({x: films[1].pos.x + L.ov[1].w / 2, y: films[1].pos.y + L.ov[1].h / 2}),
        holderA: holder(0), holderB: holder(1),
        lit: r(glow, 3), switchOn: w('press') >= 1,
        registered: regErr < 0.5, trace: r(traceP, 3), band: r(bandP, 3),
        bandsDiffer: JSON.stringify(L.ov[0].rects.map(q => [r(q.x), r(q.w), q.line])) !== JSON.stringify(L.ov[1].rects.map(q => [r(q.x), r(q.w), q.line])),
        focusFound: [Boolean(L.spans[0]), Boolean(L.spans[1])],
        separated: holder(0) === 'tray' && holder(1) === 'tray' && splitP >= 1,
        stacked: films[0].overGlass > 0.98 && films[1].overGlass > 0.98,
        cardsShown: cardsP >= 1, cardsEqual: L.cards[0].h === L.cards[1].h && L.cards[0].w === L.cards[1].w,
        stateShown: stP >= 1, keyShown: keyP >= 1,
        allReached: reach.every(Boolean), reach,
        actionCapped: p.actionProgress < 1 && u > capU,
        keyPx: r(L.F * L.pxu, 2), fits: L.fits,
        armsOffBoard: hands.every(q => q.offBoard),
        equalWeight: JSON.stringify(L.ov[0].style) === JSON.stringify(L.ov[1].style) && L.cards[0].h === L.cards[1].h && L.cards[0].w === L.cards[1].w && L.trayBox[0].w === L.trayBox[1].w && L.trayBox[0].h === L.trayBox[1].h,
        stripes: L.ov.map(o => o.stripe),
        // share of each band left uncovered by the other reading's band when both overlays are stacked
        bandVisible: L.ov.map((o, k) => { if (!o.stripe) return 0; const other = L.ov[1 - k]; if (!other.stripe || other.stripe === o.stripe) return k ? 1 : 0;
          const lo = o.stripe === 'bottom' ? STRIPE.from : 0, hi = lo + STRIPE.h, olo = other.stripe === 'bottom' ? STRIPE.from : 0, ohi = olo + STRIPE.h;
          return r(1 - Math.max(0, Math.min(hi, ohi) - Math.max(lo, olo)) / STRIPE.h, 3); }),
        trayOut: r(trayOut, 3), camZoom: r(camZ, 3), tableFrac: r((L.tableBox.w * camZ) / L.Wd, 3),
        notesClear: L.notesClear, leadersClear: L.leadersClear, objectsInside: L.objectsInside, noObjOverlap: L.noObjOverlap,
        slipTextShown: true, traceMark: TRACE_MARK.length === 1,
      },
    };
  },
};

/** Ribbon colour: a darker shade of the book cloth. */
function shade2(c) {
  const n = parseInt(c.slice(1), 16);
  const f = v => Math.round(v * 0.72);
  return `#${((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-09-story',
    title: 'Concurrent interpretations — two tracings of one passage',
    titleEs: 'Interpretaciones concurrentes — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Interpretaciones concurrentes',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down light-table desk: reader A switches the table on, both readers slide their tracing overlays from their trays onto one passage slip, the passage is traced onto both overlays and each gets its own highlight pattern; the overlays are slid apart into two labelled trays with attributed reading cards. The source book and an editable hierarchy board lie on the desk; in 9:16 and 1:1 the view pushes in on the table while the overlays are traced. No reading is marked correct.',
    tags: ['interpretation', 'concurrent readings', 'passage', 'tracing overlay', 'light table', 'book', 'article', 'editable hierarchy', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/interpretaciones-concurrentes.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
