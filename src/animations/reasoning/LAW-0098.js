/**
 * LAW-0098 — Condiciones acumulativas · mechanism
 *
 * Storyboard (exploded assembly drawing on a drafting sheet; on wide and square
 * boxes the gear line is VERTICAL, unlike the story's wide bench; on tall boxes
 * it is horizontal with the pieces pulled out above and below the plates):
 *  0.00–0.18 separate  The assembled rule board (brass header with the rule as
 *                      supplied, one plate per condition, drive gear with
 *                      crank at one end, joint dial at the other) lies on
 *                      the sheet with its fact pieces seated. The pieces are
 *                      pulled straight out of their pockets, clear of the
 *                      board, and stay separated: every pocket shows its
 *                      empty recess and axle peg. A pending condition has no
 *                      piece: a dashed outline marks where it would come from.
 *                      Component captions (rule / connector / joint dial).
 *  0.18–0.43 relate    Only the SUPPLIED relationships are drawn, one by one,
 *                      in their order, anchored on the real parts: fact piece
 *                      ↔ its condition plate (plain relation: grey, end dots,
 *                      no arrow), drive → peg → … → dial along the gear line
 *                      (sequence: thin arrows). Causal style appears only if
 *                      a relationship is supplied as causal. A legend names
 *                      the kinds actually used (relationLabels).
 *  0.43–0.75 trace     A tracer runs along the relationships in
 *                      `traversalOrder` (default: down the gear line through
 *                      every pocket to the dial); the focus element enlarges
 *                      while the tracer passes it.
 *  0.75–1.00 gather    The pieces slide back along their axes (supplied →
 *                      seated; disputed → back beside its pocket, askew, not
 *                      seated; pending → stays out), then a test half-turn of
 *                      the drive: the line turns up to the first gap, the
 *                      dial moves only when every pocket holds a seated piece.
 *                      Origin (fact text on the pieces), transformation (the
 *                      turned line) and the SUPPLIED state stay visible.
 * Legal content: fictional rule and facts, jurisdiction unspecified; which
 * piece is supplied / pending / disputed is supplied by the author. Nothing
 * here decides that a condition is met in law, that the rule applies or any
 * outcome.
 * @module animations/reasoning/LAW-0098
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {mix, polyline, edgeAnchor, circleAnchor, dist, roundRectPath} from '../../core/geometry.js';
import {chip, connector, tracer, textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {placeChip, calloutChip, stateTag, leaderPoly, segPolys, leaderFrom} from '../causation/kits/place.js';
import {
  CA_STRINGS, caFields, caMechFields, CA_DEFAULTS, resolveSlots, stateLine, planBoard, boardArt, pieceArt,
  trainPose, doubtBadge, noteCard, findSpot, draftSheet, missingPieceArt, headerBlock, dialBounds, calloutSpot, stateTagWrap, segHitsBox,
} from './kits/condiciones-acumulativas.js';

const ID = 'LAW-0098';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  explode: [0.04, 0.16], captions: [0.1, 0.18], pending: [0.1, 0.17],
  links: [0.19, 0.41], legend: [0.37, 0.43],
  trace: [0.45, 0.73],
  gatherIn: [0.76, 0.86], turn: [0.86, 0.95], tag: [0.9, 0.97], note: [0.92, 0.99],
};

const sceneSchema = {...caFields, ...caMechFields};

const defaultParams = {
  ...CA_DEFAULTS,
  elements: [
    {id: 'rule', label: 'Rule: one pocket per listed condition'},
    {id: 'connector', label: 'Connector: the gear line'},
    {id: 'dial', label: 'Joint dial'},
  ],
  relationships: [
    {from: 'fact1', to: 'cond1', kind: 'relation'},
    {from: 'fact2', to: 'cond2', kind: 'relation'},
    {from: 'fact3', to: 'cond3', kind: 'relation'},
    {from: 'connector', to: 'cond1', kind: 'sequence'},
    {from: 'cond1', to: 'cond2', kind: 'sequence'},
    {from: 'cond2', to: 'cond3', kind: 'sequence'},
    {from: 'cond3', to: 'dial', kind: 'sequence'},
  ],
  focusElement: 'cond2',
  relationLabels: {
    relation: 'fact piece supplied for this pocket',
    communication: 'communication (as supplied)',
    sequence: 'gear line: motion passes on in order',
    causal: 'causal link (as supplied)',
  },
  traversalOrder: ['connector', 'cond1', 'cond2', 'cond3', 'dial'],
};

// Line colours on the fixed pale sheet (never the background-adaptive fg).
const kindColor = (th, kind) => (kind === 'communication' ? th.accent2 : kind === 'causal' ? th.accent : kind === 'sequence' ? th.ink : th.inkSoft);

// column: gear line vertical, pieces pulled out sideways fully clear of the board;
// row (tall boxes): gear line horizontal, pieces pulled out above/below beyond
// the condition plates, rule plaque on top of the drawing.
const SHAPE = {
  // landscape hold: the tag and the note take the side freed by the gathered pieces, larger
  landscape: {axis: 'column', sizes: {fact: 26, cond: 24, header: 30}, maxR: 84, maxD: 300, maxD2: 430, gap: 34, bottom: 0, chip: 24, holdChip: 28, holdLeft: true},
  square: {axis: 'column', sizes: {fact: 31, cond: 28, header: 34}, maxR: 80, maxD: 290, maxD2: 340, gap: 30, bottom: 196, chip: 28, legendBottom: true},
  portrait: {axis: 'row', sizes: {fact: 24, cond: 22, header: 29}, maxR: 80, maxD: 300, gap: 64, bottom: 170, chip: 23},
};
const PAD = 16; // board edge padding used by planBoard
const MIN_LINK = 110; // shortest fact ↔ peg assembly axis (column mode)

/**
 * Plan the board with explode room that depends on the gear size and text.
 * P.E = distance a piece travels from its seat to its exploded place.
 */
function planMech(ctx, res, SH) {
  const p = ctx.params;
  const D = ctx.design;
  const conds = res.slots.map(s => s.condition), facts = res.slots.map(s => s.fact);
  if (SH.axis === 'column') {
    // Pieces are pulled out sideways as far as the width allows while the text
    // panels keep their full depth: fully clear of the board on wide boxes, with
    // the panel off the board and the gear over the empty recess on square boxes.
    // Long texts get deeper panels (fewer lines) before anything is truncated.
    const box = {x: 24, y: 24, w: D.w - 48, h: D.h - 48 - SH.bottom};
    const run = maxD => {
      let X = 300;
      let P = null;
      for (let it = 0; it < 14; it++) {
        P = planBoard(ctx, {n: res.n, axis: 'column', box, header: 'top', ruleName: p.rules.name, conds, facts, sizes: SH.sizes, maxR: SH.maxR, explode: X, maxD, condLines: SH.fallback ? 4 : 3});
        const full = P.vIn + P.D + PAD + P.G.ra + SH.gap - PAD;   // teeth clear the board edge by `gap`
        const room = (box.w - 2 * maxD - 2 * P.vIn - 2 * PAD) / 2; // keeps D at its maximum
        const least = P.G.ra + 8 + P.R * 0.3 + 6 + MIN_LINK - PAD;  // a readable assembly axis
        const nX = Math.max(least, Math.min(full, room));
        if (Math.abs(nX - X) < 0.5) { X = nX; break; }
        X = (X + nX) / 2;
      }
      P.E = X + PAD;
      return P;
    };
    const truncated = P => P.slots.some(s => (s.factFit && s.factFit.truncated) || (s.condFit && s.condFit.truncated)) || Boolean(P.header && P.header.fit && P.header.fit.truncated);
    let P = run(SH.maxD);
    if (truncated(P) && SH.maxD2) {
      const P2 = run(SH.maxD2);
      if (!truncated(P2) || P2.R >= P.R * 0.9) P = P2;
    }
    return P;
  }
  // row: plaque on top, drawing below it
  const hdr = headerBlock(ctx, p.rules.name, Math.min(D.w - 60, 820), SH.sizes.header);
  const top = 24 + hdr.h + 14;
  const box = {x: 24, y: top, w: D.w - 48, h: D.h - top - 24 - SH.bottom};
  // The pulled-out pieces need room beyond the plates; long texts need more lines. Try the
  // full gap with roomy text first, then tighter gaps, and keep the first plan that really fits
  // (drawing inside its box, no ellipsis); else the first that fits with an ellipsis.
  const fits = Q => { const e = Q.extents; return e.y >= box.y - 1 && e.y + e.h <= box.y + box.h + 1 && e.x >= box.x - 1 && e.x + e.w <= box.x + box.w + 1; };
  const trunc = Q => Q.slots.some(sl => (sl.factFit && sl.factFit.truncated) || (sl.condFit && sl.condFit.truncated));
  let P = null, gapUsed = SH.gap, firstFit = null;
  for (const gap of [SH.gap, SH.gap * 0.5, 14]) {
    for (const [cl, fl] of [[3, 4], [5, 6]]) {
      let X = 300, Q = null;
      for (let it = 0; it < 16; it++) {
        Q = planBoard(ctx, {n: res.n, axis: 'row', box, header: 'none', ruleName: p.rules.name, conds, facts, sizes: SH.sizes, maxR: SH.maxR, explode: X, condLines: cl, factLines: fl});
        const vo = Q.vIn + Q.D + Q.gp + Q.ph;
        const nX = vo + PAD + Q.G.ra + gap + Q.vIn + Q.D - vo - PAD;
        if (Math.abs(nX - X) < 0.5) { X = nX; break; }
        X = it < 10 ? nX : Math.max(X, nX);
      }
      Q = planBoard(ctx, {n: res.n, axis: 'row', box, header: 'none', ruleName: p.rules.name, conds, facts, sizes: SH.sizes, maxR: SH.maxR, explode: X, condLines: cl, factLines: fl});
      if (!fits(Q)) continue;
      if (!trunc(Q)) { P = Q; gapUsed = gap; break; }
      if (!firstFit) firstFit = {Q, gap};
    }
    if (P) break;
  }
  if (!P && firstFit) { P = firstFit.Q; gapUsed = firstFit.gap; }
  // nothing fits with the pieces pulled out above and below: a vertical gear line with the
  // pieces pulled out sideways (the square layout) keeps the drawing inside the sheet
  if (!P) return planMech(ctx, res, {...SH, axis: 'column', sizes: {fact: 22, cond: 21, header: 28}, maxD: 300, maxD2: 380, gap: 26, fallback: true});
  const vOuter = P.vIn + P.D + P.gp + P.ph;
  P.E = vOuter + PAD + P.G.ra + gapUsed;
  const ex = P.extents;
  // the plaque is as wide as the text was fitted for (never narrower than its lines)
  const fitW = Math.min(D.w - 60, 820);
  const textW = hdr.fit ? Math.max(hdr.fit.width, hdr.tag ? hdr.tag.width : 0) + 40 : 0;
  // sized to its text and aligned with the board's left edge: the room on its right takes the
  // rule's caption, with a short leader
  const w = Math.min(fitW, Math.max(textW, D.w * 0.5));
  const cx = clamp(P.board.x + w / 2, 30 + w / 2, D.w - 30 - w / 2);
  P.header = {...hdr, rect: {x: cx - w / 2, y: ex.y - hdr.h - 14, w, h: hdr.h}};
  return P;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const D = ctx.design;
    const SH = SHAPE[ctx.view.shape];
    const res = resolveSlots(p);
    // square: the strip under the drawing holds the legend strip and the state tag
    // (both stay visible in the final beat), sized from their actual text
    let SHp = SH;
    const bottomLegend = SH.legendBottom || SH.axis === 'row';
    if (bottomLegend) {
      const n0 = res.n;
      const ok = id => (id.startsWith('cond') || id.startsWith('fact') ? Number(id.slice(4)) <= n0 : true);
      const kinds0 = [...new Set(p.relationships.filter(q => q.from !== q.to && ok(q.from) && ok(q.to)).map(q => q.kind))];
      let need = 0;
      if (ctx.show('all') && kinds0.length) {
        const V = legendVariants(ctx, kinds0, SH.chip, D.w - 60);
        const v = V.inline || V.grid || V.stacked[0];
        need += v.lh + 26;
      }
      if (ctx.show('key')) need += (SH.chip + 1) * 1.75 + 26;
      SHp = {...SH, bottom: Math.max(SH.bottom, need + 20)};
    }
    const P = planMech(ctx, res, SHp);
    const R = P.R, E = P.E, n = P.n;
    const sheet = draftSheet(ctx, {name: 'sheet', x: 4, y: 4, w: D.w - 8, h: D.h - 8});
    const board = boardArt(ctx, P, {prefix: 'bd', crankAngle: 0, turnDir: 1});

    // ---- pieces: rest pose (seated / askew beside the pocket) and exploded pose
    // A gear that stays over the board (partial explode, disputed rest) must not
    // cover its own condition plate (column mode: the plate heads the holder).
    const clearPlate = (sl, v) => {
      if (P.row) return 0;
      const onBoard = v - P.G.ra < P.vIn + P.D + PAD + 4;
      const HW = 2 * R - P.gap / 2;
      return onBoard ? Math.max(0, P.ph + 10 - HW + P.G.ra) : 0;
    };
    const pieces = res.slots.map(s => {
      const sl = P.slots[s.i];
      const seat = sl.c;
      const along = P.vec(1, 0); // unit vector along the gear line
      const dOut = clearPlate(sl, E);
      const out = {x: seat.x + sl.dir.x * E + along.x * dOut, y: seat.y + sl.dir.y * E + along.y * dOut};
      const base = {i: s.i, status: s.status, sl, seat, out};
      if (s.status === 'pending') return {...base, miss: missingPieceArt(ctx, P, s.i, `miss${s.i}`)};
      // a disputed piece comes back over its pocket but is not pressed in: it hovers
      // (raised shadow, teeth not meshed), inside its own footprint, never over a plate
      const rest = {c: seat, rot: 0, hover: s.status === 'disputed'};
      return {...base, rest, pc: pieceArt(ctx, P, s.i, {name: `pc${s.i}`})};
    });
    const pieceBoxes = at => pieces.flatMap(pc => [pc.sl.panelLocal, pc.sl.tabLocal, {x: -P.G.ra, y: -P.G.ra, w: 2 * P.G.ra, h: 2 * P.G.ra}]
      .map(b => ({x: at(pc).x + b.x, y: at(pc).y + b.y, w: b.w, h: b.h})));
    const outBoxes = pieceBoxes(pc => pc.out);
    // Condition plates print their text only once their own piece has been pulled clear of
    // them (the assembled board never shows a piece lying over a plate's text): `clearAt` is
    // the explode fraction after which the piece no longer overlaps its plate.
    const hitB = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    for (const pc of pieces) {
      if (!pc.pc) continue;
      const pl = pc.sl.plate;
      let last = -1;
      for (let k = 0; k <= 60; k++) {
        const c = mix(pc.seat, pc.out, k / 60);
        const bx = [pc.sl.panelLocal, pc.sl.tabLocal, {x: -P.G.ra, y: -P.G.ra, w: 2 * P.G.ra, h: 2 * P.G.ra}].map(b => ({x: c.x + b.x, y: c.y + b.y, w: b.w, h: b.h}));
        if (bx.some(b => hitB(b, pl))) last = k / 60;
      }
      pc.clearAt = last < 0 ? null : Math.min(0.97, last + 0.02);
    }
    // the pulled-out pieces' printed panels (text a leader may not cross)
    const outPanels = pieces.filter(pc => pc.pc).map(pc => ({x: pc.out.x + pc.sl.panelLocal.x, y: pc.out.y + pc.sl.panelLocal.y, w: pc.sl.panelLocal.w, h: pc.sl.panelLocal.h}));

    // ---- elements, anchors and supplied relationships
    const pegR = R * 0.3, hubR = R * 0.4;
    const idx = id => Number(id.slice(4)) - 1;
    const valid = id => {
      if (id.startsWith('cond') || id.startsWith('fact')) return idx(id) < n;
      if (id === 'rule') return Boolean(P.header);
      return true;
    };
    const onLine = id => id === 'connector' || id === 'dial' || id.startsWith('cond');
    const linePos = id => (id === 'connector' ? 0 : id === 'dial' ? n + 1 : idx(id) + 1);
    const center = id => {
      if (id === 'rule') { const q = P.header.rect; return {x: q.x + q.w / 2, y: q.y + q.h / 2}; }
      if (id === 'connector') return P.drive.c;
      if (id === 'dial') return P.output.c;
      if (id.startsWith('cond')) return P.slots[idx(id)].c;
      return pieces[idx(id)].out;
    };
    // a condition is its axle peg for gear-line links and (column mode) for its
    // fact piece — the assembly axis through the empty pocket; on the row axis the
    // plate lies between the pulled-out piece and the peg, so the link ends on the plate
    const plateOf = id => P.slots[idx(id)].plate;
    const usePeg = (id, other) => onLine(other) || (!P.row && other.startsWith('fact'));
    const towardPt = (id, other) => {
      if (other.startsWith('cond') && !usePeg(other, id)) { const q = plateOf(other); return {x: q.x + q.w / 2, y: q.y + q.h / 2}; }
      return center(other);
    };
    const anchorOf = (id, other) => {
      const toward = towardPt(id, other);
      if (id === 'rule') return edgeAnchor(P.header.rect, toward, 6);
      if (id.startsWith('fact')) return circleAnchor(center(id), P.G.ra + 8, toward);
      if (id.startsWith('cond')) return usePeg(id, other) ? circleAnchor(center(id), pegR + 6, toward) : edgeAnchor(plateOf(id), toward, 6);
      return circleAnchor(center(id), onLine(other) ? hubR + 4 : P.G.ra + 8, toward);
    };
    const rels = p.relationships.filter(rel => rel.from !== rel.to && valid(rel.from) && valid(rel.to));
    const skipped = p.relationships.length - rels.length;
    const links = rels.map((rel, j) => {
      const from = anchorOf(rel.from, rel.to), to = anchorOf(rel.to, rel.from);
      const own = (a, b) => a.startsWith('fact') && b === `cond${a.slice(4)}`;
      const adjacent = onLine(rel.from) && onLine(rel.to) && Math.abs(linePos(rel.from) - linePos(rel.to)) === 1;
      const straight = own(rel.from, rel.to) || own(rel.to, rel.from) || adjacent;
      const color = kindColor(th, rel.kind);
      const c = connector(ctx, {name: `ln${j}`, from, to, kind: rel.kind, bend: straight ? 0 : 0.3, color});
      const under = rel.from.startsWith('fact') || rel.to.startsWith('fact');
      const d = `M${r(from.x)} ${r(from.y)}C${r(c.c1.x)} ${r(c.c1.y)} ${r(c.c2.x)} ${r(c.c2.y)} ${r(to.x)} ${r(to.y)}`;
      // white casing: the line stays readable over the pale sheet and the slate board alike
      const casing = h('path', {name: `ln${j}-case`, d, fill: 'none', stroke: '#ffffff', 'stroke-width': LINK_STYLES[rel.kind].width + 7, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(c.total)} ${r(c.total + 10)}`, 'stroke-dashoffset': r(c.total), opacity: 0});
      // does each end sit on its element's anchor shape?
      const onShape = (pt, id, other) => dist(pt, anchorOf(id, other)) < 0.5;
      const pts = [];
      for (let k = 0; k <= 24; k++) pts.push(c.at(k / 24));
      return {rel, c, under, casing, ends: onShape(c.from, rel.from, rel.to) && onShape(c.to, rel.to, rel.from), polys: segPolys(pts, 10)};
    });

    // ---- tracer route through traversalOrder (along a connector when one links the pair)
    const order = p.traversalOrder.filter(valid);
    const rpts = [];
    const visits = [];
    order.forEach((id, k) => {
      if (k === 0) { rpts.push(center(id)); visits.push({id, idx: 0}); return; }
      const prev = order[k - 1];
      const link = links.find(l => (l.rel.from === prev && l.rel.to === id) || (l.rel.from === id && l.rel.to === prev));
      if (link) {
        const fwd = link.rel.from === prev;
        for (let s = 0; s <= 30; s++) rpts.push(link.c.at(fwd ? s / 30 : 1 - s / 30));
      }
      rpts.push(center(id));
      visits.push({id, idx: rpts.length - 1});
    });
    const route = polyline(rpts.length > 1 ? rpts : [rpts[0] || P.drive.c, rpts[0] || P.drive.c]);
    const cum = [0];
    for (let k = 1; k < rpts.length; k++) cum.push(cum[k - 1] + dist(rpts[k - 1], rpts[k]));
    const tot = cum[cum.length - 1] || 1;
    const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / tot}));
    const focus = valid(p.focusElement) ? p.focusElement : null;
    const fv = visitT.find(v => v.id === focus);
    const focusT = fv ? fv.t : 0.5;

    // ---- focus geometry (what enlarges, around which point)
    let focusNode = null;
    if (focus) {
      if (focus === 'rule') { const q = P.header.rect; focusNode = {name: 'bd-header', about: {x: q.x + q.w / 2, y: q.y + q.h / 2}}; }
      else if (focus === 'connector') focusNode = {name: 'bd-drive', local: true};
      else if (focus === 'dial') focusNode = {name: 'dial', about: P.output.c};
      else if (focus.startsWith('cond')) { const q = P.slots[idx(focus)].plate; focusNode = {name: `bd-plate${idx(focus)}`, about: {x: q.x + q.w / 2, y: q.y + q.h / 2}}; }
      else focusNode = pieces[idx(focus)].status === 'pending' ? {name: `miss${idx(focus)}`, piece: idx(focus)} : {name: `pc${idx(focus)}`, piece: idx(focus)};
    }

    // ---- pending chips on the missing outlines, doubt badges on disputed pieces
    const pendChips = [];
    for (const pc of pieces) {
      if (pc.status !== 'pending' || !ctx.show('key')) continue;
      const q = pc.sl.panelLocal;
      const cx = pc.out.x + q.x + q.w / 2, cy = pc.out.y + q.y + q.h / 2;
      const c = chip(ctx, t.pendingPiece, {x: cx, y: cy - 18, anchor: 'middle', maxWidth: Math.max(120, q.w - 12), size: 21, maxLines: 2, fill: '#ffffff', stroke: th.inkSoft, weight: 700});
      pendChips.push({i: pc.i, node: g({name: `pend${pc.i}`, opacity: 0}, c.node), box: c.box});
    }
    const badges = pieces.filter(pc => pc.status === 'disputed').map(pc => ({i: pc.i, node: doubtBadge(ctx, {name: `doubt${pc.i}`, x: 0, y: 0, rad: Math.max(18, R * 0.26)})}));

    // ---- obstacles for free-space placement (both the exploded and the gathered state)
    const dialR = P.output.dialR + board.dial.iconR * 2 + 12;
    // text-bearing parts (leaders never cross them) + the bare board (chips stay off it,
    // leaders may cross its slate). Exploded pieces count only for what is shown while
    // they are out (captions, legend); the tag and note appear after they return.
    const dialBox = dialBounds(P, board.dial);
    const textParts = [P.header && P.header.rect, ...P.slots.map(s => s.plate), ...P.slots.map(s => s.panelAbs), dialBox, ...pendChips.map(c => c.box)].filter(Boolean);
    const missBoxes = pieceBoxes(pc => pc.out).filter((b, k) => pieces[Math.floor(k / 3)].status === 'pending');
    const obstacles = [P.board, ...textParts, ...outBoxes];
    const finalObstacles = [P.board, ...textParts, ...missBoxes];
    const linkPolys = links.flatMap(l => l.polys);
    const bounds = {x: 22, y: 22, w: D.w - 44, h: D.h - 44};
    const placed = [];

    const leads = [];
    // ---- legend of the connection kinds actually drawn
    let legend = null;
    const kinds = [...new Set(links.map(l => l.rel.kind))];
    if (ctx.show('all') && kinds.length) {
      const size = SH.chip;
      const sw = 64;
      const pad = 16;
      const rowH = rw => Math.max(30, rw.fit.height);
      const V = legendVariants(ctx, kinds, size, D.w - 60);
      const bottomFirst = P.row || SH.legendBottom;
      const pref = bottomFirst ? {x: D.w / 2, y: D.h - 40} : {x: 40, y: 40};
      const obsL = [...obstacles, ...placed, ...leads.map(boxOf), ...linkPolys.map(boxOf)];
      const variants = (bottomFirst ? [V.inline, V.grid, ...V.stacked] : [...V.stacked, V.inline, V.grid]).filter(Boolean);
      let spot = null, L0 = null;
      for (const v of variants) {
        L0 = v;
        spot = findSpot({w: v.lw, h: v.lh}, pref, obsL, bounds, {pad: 12});
        if (spot) break;
      }
      if (spot) {
        const {title, rows, lw, lh} = L0;
        const x0 = spot.x, y0 = spot.y;
        const parts = [
          h('path', {d: roundRectPath(x0 + 4, y0 + 6, lw, lh, 12), fill: th.shadow}),
          h('path', {d: roundRectPath(x0, y0, lw, lh, 12), fill: '#ffffff', stroke: '#9fb3c2', 'stroke-width': 2}),
        ];
        if (L0.mode === 'inline') {
          const cy = y0 + lh / 2;
          parts.push(textBlock(title, {x: x0 + pad, y: cy - title.height / 2, fill: th.inkSoft, letterSpacing: 0.4}));
          let x = x0 + pad + title.width + 22;
          for (const rw of rows) {
            parts.push(kindSample(th, rw.k, x, cy, sw));
            parts.push(textBlock(rw.fit, {x: x + sw + 12, y: cy - rw.fit.height / 2, fill: th.ink}));
            x += sw + 12 + rw.fit.width + 26;
          }
        } else if (L0.mode === 'grid') {
          parts.push(textBlock(title, {x: x0 + pad, y: y0 + pad, fill: th.inkSoft, letterSpacing: 0.4}));
          let y = y0 + pad + title.height + 12;
          L0.lines.forEach((ln, li) => {
            const cy = y + L0.lineH[li] / 2;
            ln.forEach((rw, ci) => {
              const x = x0 + pad + L0.colX[ci];
              parts.push(kindSample(th, rw.k, x, cy, sw));
              parts.push(textBlock(rw.fit, {x: x + sw + 12, y: cy - rw.fit.height / 2, fill: th.ink}));
            });
            y += L0.lineH[li] + 10;
          });
        } else {
          parts.push(textBlock(title, {x: x0 + pad, y: y0 + pad, fill: th.inkSoft, letterSpacing: 0.4}));
          let y = y0 + pad + title.height + 12;
          for (const rw of rows) {
            const hh = rowH(rw);
            const cy = y + hh / 2;
            parts.push(kindSample(th, rw.k, x0 + pad, cy, sw));
            parts.push(textBlock(rw.fit, {x: x0 + pad + sw + 14, y: cy - rw.fit.height / 2, fill: th.ink}));
            y += hh + 10;
          }
        }
        legend = {node: g({name: 'legend', opacity: 0}, parts), box: {x: x0, y: y0, w: lw, h: lh}};
        placed.push(legend.box);
      }
    }

    // ---- component captions (callouts with leaders)
    // candidate anchors per component, best first; each lists what the leader may enter
    const capTargets = {
      rule: P.header ? (() => {
        const q = P.header.rect, k3 = 3;
        return [{x: q.x + q.w, y: q.y + q.h * 0.5, r: 3}, {x: q.x, y: q.y + q.h * 0.5, r: 3}, {x: q.x + q.w + k3, y: q.y + q.h + k3, r: 0}, {x: q.x - k3, y: q.y + q.h + k3, r: 0}, {x: q.x + q.w / 2, y: q.y, r: 3}]
          .map(tg => ({tg, own: [P.board]}))
          // the rule is the whole board (plaque + one pocket per condition): its slate edge too
          .concat([{x: P.board.x, y: P.board.y + P.board.h - 30, r: 3}, {x: P.board.x + P.board.w, y: P.board.y + P.board.h - 30, r: 3}, {x: P.board.x + 30, y: P.board.y + P.board.h, r: 3}]
            .map(tg => ({tg, own: [P.board]})));
      })() : null,
      // the gear line's port at the drive: its free sides first (the leader then runs in the
      // board margin beside the line, never across a piece)
      connector: [
        {x: P.drive.c.x - P.G.ra * 0.95, y: P.drive.c.y + P.G.ra * 0.3, r: 3}, {x: P.drive.c.x + P.G.ra * 0.95, y: P.drive.c.y + P.G.ra * 0.3, r: 3},
        {x: P.drive.c.x - P.G.ra * 0.3, y: P.drive.c.y - P.G.ra * 0.95, r: 3}, {x: P.drive.c.x - P.G.ra * 0.3, y: P.drive.c.y + P.G.ra * 0.95, r: 3},
      ].map(tg => ({tg, own: [P.board]})),
      dial: [{...board.dial.tip(0.5), r: 5}, {...board.dial.end, r: board.dial.iconR + 4}].map(tg => ({tg, own: [P.board, dialBox]})),
    };
    const captions = [];
    const capModes = [];
    if (ctx.show('all')) {
      for (const el of p.elements) {
        const cands = capTargets[el.id];
        if (!cands || !el.label) continue;
        const mw = Math.min(360, D.w * 0.4);
        const sizes = [[mw, 2], [mw * 0.75, 3], [mw, 3], [mw * 0.8, 4]]
          .map(([wd, ml]) => ({wd, ml, c: chip(ctx, el.label, {x: 0, y: 0, maxWidth: wd, size: SH.chip, maxLines: ml})}))
          .filter((z, j, all) => !z.c.fit.truncated || j === all.length - 1)
          .map(z => ({wd: z.wd, ml: z.ml, box: z.c.box}));
        const obs = [...obstacles, ...placed, ...leads, ...linkPolys];
        let at = null, k = 0, mode = 'near', tg = cands[0].tg;
        // every anchor is tried close by first; only then a grid search anywhere
        for (const cd of cands) {
          tg = cd.tg;
          mode = 'near';
          // printed text a leader must never cross: plates, panels (seated AND pulled out), chips
          const textOk = [...textParts, ...outPanels, ...placed].filter(q => !cd.own.includes(q));
          const crosses = a => textOk.some(q => segHitsBox(leaderFrom(a.box, a.end), a.end, q, 2) && !(q.x <= a.end.x && a.end.x <= q.x + q.w && q.y <= a.end.y && a.end.y <= q.y + q.h));
          for (k = 0; k < sizes.length && !at; k++) {
            at = placeChip(sizes[k].box, tg, {obstacles: obs, bounds, own: cd.own, gaps: [26, 50, 80, 120, 170]});
            if (at && crosses(at)) at = null;
          }
          if (at) break;
        }
        for (const cd of at ? [] : cands) {
          tg = cd.tg;
          // grid search: chip in free room, leader clear of every text (it may cross bare slate)
          const polysB = [...leads, ...linkPolys].map(boxOf);
          const textOk = [...textParts, ...outPanels, ...placed].filter(q => !cd.own.includes(q));
          mode = 'grid';
          for (k = 0; k < sizes.length && !at; k++) at = calloutSpot(sizes[k].box, tg, {block: [...obstacles, ...placed, ...polysB], text: textOk, bounds, prefer: tg, gap: tg.r ?? 0});
          if (at) break;
        }
        k = Math.max(0, k - 1);
        if (!at) { tg = cands[0].tg; k = sizes.length - 1; mode = 'leastBad'; at = placeChip(sizes[k].box, tg, {obstacles: obs, bounds, own: cands[0].own, leastBad: true}); }
        if (!at) continue;
        capModes.push(`${el.id}:${mode}`);
        const c = calloutChip(ctx, {name: `cap-${el.id}`, text: el.label, chipAt: {x: at.x, y: at.y}, target: at.end, maxWidth: sizes[k].wd, maxLines: sizes[k].ml, size: SH.chip, color: th.ink});
        const f0 = leaderFrom(c.box, at.end);
        c.name = `cap-${el.id}`;
        c.len = Math.hypot(at.end.x - f0.x, at.end.y - f0.y);
        placed.push(c.box);
        leads.push(leaderPoly(c.box, at.end));
        captions.push(c);
      }
    }

    // ---- state tag (gather): one line where it fits, else wrapped to two lines in a narrow column
    let tag = null;
    if (ctx.show('key')) {
      const text = stateLine(t, res);
      const mw = Math.min(D.w - 60, 720);
      const size = SH.holdChip ?? SH.chip + 1;
      const pref = P.row ? {x: D.w / 2, y: D.h - 40} : SH.holdLeft ? {x: (P.board.x - 20) / 2 + 10, y: D.h * 0.36} : {x: 40 + 200, y: D.h - 50};
      const obsT = [...finalObstacles, ...placed, ...leads.map(boxOf)];
      const probe = stateTag(ctx, text, {x: 0, y: 0, size, maxWidth: mw});
      const spot = findSpot({w: probe.box.w, h: probe.box.h}, pref, obsT, bounds, {pad: 10});
      if (spot) tag = stateTag(ctx, text, {x: spot.x, y: spot.y, size, maxWidth: mw, name: 'state-tag', color: res.complete ? th.accent2 : th.inkSoft, opacity: 0});
      else {
        for (const w2 of [420, 340, 280]) {
          const pr2 = stateTagWrap(ctx, text, {x: 0, y: 0, size, maxWidth: w2});
          if (pr2.fit.truncated) continue;
          const sp2 = findSpot({w: pr2.box.w, h: pr2.box.h}, pref, obsT, bounds, {pad: 10});
          if (sp2) { tag = stateTagWrap(ctx, text, {x: sp2.x, y: sp2.y, size, maxWidth: w2, name: 'state-tag', color: res.complete ? th.accent2 : th.inkSoft, opacity: 0}); break; }
        }
      }
      if (tag) placed.push(tag.box);
    }

    // ---- note with the author's issue / assumptions (final hold, free space)
    let note = null;
    const noteSize = SH.holdChip ?? SH.chip;
    const leftW = P.board.x - 60;
    const noteWs = SH.holdLeft && leftW >= 300 ? [[leftW, 4], [leftW, 6], [320, 7]] : [[Math.min(D.w - 60, P.row ? 600 : 420), 3], [320, 5], [260, 7]];
    for (const [mw, ml] of noteWs) {
      const probe = noteCard(ctx, {name: 'note-probe', x: 0, y: 0, maxWidth: mw, issues: p.issues, assumptions: p.assumptions, size: noteSize, maxLines: ml});
      if (!probe) break;
      const pref = P.row ? {x: D.w / 2, y: D.h - 120} : SH.holdLeft ? {x: 30 + probe.box.w / 2, y: D.h * 0.66} : {x: D.w - probe.box.w / 2 - 30, y: D.h / 2};
      const spot = findSpot({w: probe.box.w, h: probe.box.h}, pref, [...finalObstacles, ...placed, ...leads.map(boxOf)], bounds, {pad: 10});
      if (spot) {
        note = noteCard(ctx, {name: 'note', x: spot.x, y: spot.y, maxWidth: mw, issues: p.issues, assumptions: p.assumptions, size: noteSize, maxLines: ml});
        placed.push(note.box);
        break;
      }
    }

    const trc = tracer(ctx, 'tracer', th.accent);
    return {P, res, sheet, board, pieces, links, skipped, route, visitT, focus, focusNode, focusT, pendChips, badges, legend, tag, captions, note, trc, capModes};
  },
  build(ctx, L) {
    return g(null,
      L.sheet,
      L.board.node,
      L.links.filter(l => l.under).map(l => g(null, l.casing, l.c.node)),
      L.pieces.filter(pc => pc.miss).map(pc => g({transform: T(pc.out.x, pc.out.y)}, pc.miss)),
      L.pieces.filter(pc => pc.pc).map(pc => pc.pc.node),
      L.links.filter(l => !l.under).map(l => g(null, l.casing, l.c.node)),
      L.badges.map(b => b.node),
      L.pendChips.map(c => c.node),
      L.trc,
      L.legend && L.legend.node,
      L.captions.map(c => c.node),
      L.tag && L.tag.node,
      L.note && L.note.node,
    );
  },
  frame(ctx, L, u) {
    const P = L.P;
    const R = P.R;
    const reduced = ctx.reduced;
    const nodes = {};
    const sem = {};

    // ---- separate / gather
    const ex = ease.inOutCubic(seg(u, ...W.explode));
    const back = ease.inOutCubic(seg(u, ...W.gatherIn));
    const off = ex * (1 - back);
    const moving = u < 0.5 ? ex : back;
    const lift = reduced ? 0 : Math.sin(Math.PI * moving);

    // ---- tracer and focus
    const q = ease.inOutSine(seg(u, ...W.trace));
    const tracing = u > W.trace[0] && u < W.trace[1];
    const bump = tracing ? ease.inOutSine(clamp(1 - Math.abs(q - L.focusT) / 0.16)) : 0;
    const fs = 1 + (reduced ? 0.18 : 0.24) * bump;

    const states = [];
    for (const pc of L.pieces) {
      if (pc.status === 'pending') {
        const s = L.focusNode && L.focusNode.piece === pc.i ? fs : 1;
        nodes[`miss${pc.i}`] = {opacity: r(ex, 3), transform: `scale(${r(s, 4)})`};
        states.push('absent');
        continue;
      }
      const c = mix(pc.rest.c, pc.out, off);
      const rot = pc.rest.rot * (1 - off);
      const hover = pc.rest.hover ? Math.max(lift, 1 - off) : 0;
      const raise = Math.max(lift, hover);
      const s = (L.focusNode && L.focusNode.piece === pc.i ? fs : 1) * (1 + 0.03 * raise);
      nodes[`pc${pc.i}`] = {transform: T(c.x, c.y, rot, s)};
      nodes[`pc${pc.i}-sh`] = {transform: T(7 * raise, 11 * raise), opacity: r(0.55 + 0.45 * raise, 3)};
      sem[`pc${pc.i}`] = {x: r(c.x), y: r(c.y)};
      const st = off >= 0.999 ? 'exploded' : off <= 0.001 ? (pc.status === 'disputed' ? 'unseated' : u < 0.5 ? 'assembled' : 'seated') : u < 0.5 ? 'separating' : 'returning';
      states.push(st);
    }

    // ---- condition text: revealed as each piece clears its plate (separate beat)
    if (ctx.show('key')) {
      for (const pc of L.pieces) {
        if (pc.clearAt == null || !pc.sl.condFit) continue;
        nodes[`bd-cond${pc.i}`] = {opacity: u < 0.5 ? r(clamp((ex - pc.clearAt) / 0.12), 3) : 1};
      }
    }

    // ---- relationships: drawn one by one in the supplied order
    const m = L.links.length;
    const step = m ? (W.links[1] - W.links[0]) / m : 0;
    const drawn = [];
    L.links.forEach((l, j) => {
      const pj = ease.inOutSine(seg(u, W.links[0] + j * step, W.links[0] + (j + 1) * step));
      const op = l.under ? 1 - back : 1;
      Object.assign(nodes, l.c.frame(pj, pj > 0 ? r(op, 3) : 0));
      nodes[`ln${j}-case`] = {'stroke-dashoffset': r(l.c.total * (1 - pj)), opacity: pj > 0 ? r(0.92 * op, 3) : 0};
      drawn.push(r(pj, 3));
    });

    // ---- tracer
    const tp = L.route.at(q);
    nodes.tracer = {transform: T(tp.x, tp.y, 0, Math.max(1.2, R / 55)), opacity: tracing ? 1 : 0};
    sem.tracer = {x: r(tp.x), y: r(tp.y)};
    const visited = u >= W.trace[0] ? L.visitT.filter(v => v.t <= q + 1e-9).map(v => v.id) : [];

    // ---- focus element
    if (L.focusNode) {
      const F = L.focusNode;
      if (F.local) nodes[F.name] = {transform: `scale(${r(fs, 4)})`};
      else if (F.name === 'dial') {
        nodes['bd-dial'] = {transform: scaleAbout(F.about.x, F.about.y, fs)};
        nodes['bd-out'] = {transform: `scale(${r(fs, 4)})`};
      } else if (F.about) nodes[F.name] = {transform: scaleAbout(F.about.x, F.about.y, fs)};
    }

    // ---- test half-turn after the gather
    const theta = 180 * ease.inOutSine(seg(u, ...W.turn));
    const tp2 = trainPose(P, theta, L.res.breakAt, {drive: 'bd-drive', out: 'bd-out', pieceRot: i => (L.pieces[i].status === 'pending' ? null : `pc${i}-g-rot`)});
    Object.assign(nodes, tp2.nodes);
    for (const pc of L.pieces) if (pc.status === 'disputed') nodes[`pc${pc.i}-g-rot`] = {transform: `rotate(${r(pc.sl.phase + P.G.p * 0.45)})`};
    const dialK = tp2.outTurns ? theta / 180 : 0;
    const df = L.board.dial.frame(dialK, dialK >= 0.99);
    if (L.focusNode && L.focusNode.name === 'dial') {
      const a = L.board.dial.a0 + (L.board.dial.a1 - L.board.dial.a0) * dialK;
      df['bd-dial-ptr'] = {transform: T(P.output.c.x, P.output.c.y, a, fs)};
    }
    Object.assign(nodes, df);

    // ---- badges, chips, legend, captions, tag, note
    const holdK = seg(u, ...W.tag);
    for (const b of L.badges) {
      const pc = L.pieces[b.i];
      const c = mix(pc.rest.c, pc.out, off);
      // on the gear's board-side teeth: rides with the piece, never over printed text
      nodes[`doubt${b.i}`] = {transform: T(c.x - pc.sl.dir.x * P.G.ra * 0.55, c.y - pc.sl.dir.y * P.G.ra * 0.55), opacity: r(holdK, 3)};
    }
    for (const c of L.pendChips) nodes[`pend${c.i}`] = {opacity: r(seg(u, ...W.pending), 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    // a caption's leader grows out of its anchor while its label fades in: never a bare stroke
    for (const c of L.captions) {
      const k = ease.inOutSine(seg(u, ...W.captions));
      Object.assign(nodes, c.frame(k), {
        [`${c.name}-lead`]: {'stroke-dashoffset': r(-c.len * (1 - k)), opacity: r(k, 3)},
        [`${c.name}-dot`]: {opacity: r(Math.min(1, k * 2), 3)},
        [`${c.name}-chip`]: {opacity: r(k, 3)},
      });
    }
    if (L.tag) nodes['state-tag'] = {opacity: r(holdK, 3)};
    if (L.note) nodes.note = {opacity: r(seg(u, ...W.note), 3)};

    const turned = [Math.abs(theta) > 0.5];
    for (const s of P.slots) turned.push(Math.abs(theta) > 0.5 && (L.res.breakAt < 0 || s.i < L.res.breakAt) && L.pieces[s.i].status === 'supplied');
    turned.push(tp2.outTurns && Math.abs(theta) > 0.5);
    Object.assign(sem, {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      layout: P.axis,
      n: P.n,
      statuses: L.res.slots.map(s => s.status),
      breakAt: L.res.breakAt,
      complete: L.res.complete,
      explode: r(off, 3),
      pieces: states,
      relationsDrawn: drawn,
      linkKinds: L.links.map(l => l.rel.kind),
      linkPairs: L.links.map(l => `${l.rel.from}>${l.rel.to}`),
      linkEnds: L.links.map(l => l.ends),
      arrowheads: L.links.map((l, j) => drawn[j] >= 0.985 && LINK_STYLES[l.rel.kind].arrow),
      skippedRelationships: L.skipped,
      tracerVisible: tracing,
      visitOrder: L.visitT.map(v => v.id),
      visited,
      focus: L.focus,
      focusScale: r(fs, 3),
      theta: r(theta),
      turned,
      dial: r(dialK, 3),
      dialLamp: dialK >= 0.99,
      seated: states.filter(s => s === 'seated').length,
      gearR: r(R),
      capModes: L.capModes,
      labels: {legend: Boolean(L.legend), tag: Boolean(L.tag), note: Boolean(L.note), captions: L.captions.length},
    });
    return {nodes, semantic: sem};
  },
};

/**
 * Legend layouts for the connection kinds actually drawn: `inline` (title and
 * kinds on one strip), `grid` (title, then kinds two per row) and `stacked`
 * cards of decreasing width. Texts are never truncated in the strip layouts.
 */
function legendVariants(ctx, kinds, size, maxW) {
  const t = ctx.t, p = ctx.params;
  const sw = 64, pad = 16;
  const rowH = rw => Math.max(30, rw.fit.height);
  const label = k => p.relationLabels[k] || k;
  const out = {};
  {
    const title = ctx.fit(`${t.connections}:`, {maxWidth: 220, size: size - 3, maxLines: 3, weight: 700});
    const each = Math.min(420, (maxW - 2 * pad - title.width - 22) / kinds.length - sw - 12 - 26);
    if (each >= 150) {
      const rows = kinds.map(k => ({k, fit: ctx.fit(label(k), {maxWidth: each, size, minSize: size * 0.85, maxLines: 3, weight: 600})}));
      const lw = pad + title.width + 22 + rows.reduce((a, rw) => a + sw + 12 + rw.fit.width + 26, 0) - 26 + pad;
      const lh = 2 * pad + Math.max(title.height, ...rows.map(rowH));
      if (lw <= maxW && !rows.some(rw => rw.fit.truncated)) out.inline = {mode: 'inline', title, rows, lw, lh};
    }
  }
  if (kinds.length > 1) {
    const cols = 2;
    const title = ctx.fit(t.connections, {maxWidth: maxW - 2 * pad, size: size - 3, maxLines: 1, weight: 700});
    const colW = (maxW - 2 * pad - 26 * (cols - 1)) / cols;
    const rows = kinds.map(k => ({k, fit: ctx.fit(label(k), {maxWidth: colW - sw - 12, size, minSize: size * 0.85, maxLines: 3, weight: 600})}));
    if (!rows.some(rw => rw.fit.truncated)) {
      const lines = [];
      for (let i = 0; i < rows.length; i += cols) lines.push(rows.slice(i, i + cols));
      const lineH = lines.map(ln => Math.max(...ln.map(rowH)));
      const colWs = Array.from({length: cols}, (_, c) => Math.max(0, ...lines.filter(ln => ln[c]).map(ln => sw + 12 + ln[c].fit.width)));
      const colX = colWs.map((_, c) => colWs.slice(0, c).reduce((a, b) => a + b + 26, 0));
      const usedW = colWs.reduce((a, b) => a + b, 0) + 26 * (cols - 1);
      const lw = Math.max(title.width, usedW) + 2 * pad;
      const lh = pad + title.height + 12 + lineH.reduce((a, b) => a + b + 10, 0) - 10 + pad;
      if (lw <= maxW) out.grid = {mode: 'grid', title, rows, lines, lineH, colX, lw, lh};
    }
  }
  out.stacked = [Math.min(maxW, 520), 420, 330].map(mw => {
    const title = ctx.fit(t.connections, {maxWidth: mw - 2 * pad, size: size - 3, maxLines: 1, weight: 700});
    const rows = kinds.map(k => ({k, fit: ctx.fit(label(k), {maxWidth: mw - 2 * pad - sw - 14, size, minSize: size * 0.85, maxLines: 3, weight: 600})}));
    const lw = Math.min(mw, Math.max(title.width, ...rows.map(rw => sw + 14 + rw.fit.width)) + 2 * pad);
    const lh = pad + title.height + 12 + rows.reduce((a, rw) => a + rowH(rw) + 10, 0) - 10 + pad;
    return {mode: 'stacked', title, rows, lw, lh};
  });
  return out;
}

/** Bounding box of a polygon. */
function boxOf(poly) {
  const xs = poly.map(q => q.x), ys = poly.map(q => q.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

/** A short sample of a connector style for the legend. */
function kindSample(th, kind, x, y, w) {
  const st = LINK_STYLES[kind];
  const col = kindColor(th, kind);
  const parts = [h('line', {x1: r(x + 2), y1: r(y), x2: r(x + w - (st.arrow ? 10 : 2)), y2: r(y), stroke: col, 'stroke-width': st.width, 'stroke-linecap': 'round', 'stroke-dasharray': st.dash || undefined})];
  if (st.arrow) {
    const hl = st.width * 4.2;
    parts.push(h('path', {d: `M${r(x + w)} ${r(y)}L${r(x + w - hl)} ${r(y - hl * 0.55)}L${r(x + w - hl * 0.72)} ${r(y)}L${r(x + w - hl)} ${r(y + hl * 0.55)}Z`, fill: col}));
  }
  if (st.endDots) {
    parts.push(h('circle', {cx: r(x + 2), cy: r(y), r: r(st.width * 1.6), fill: col}));
    parts.push(h('circle', {cx: r(x + w - 2), cy: r(y), r: r(st.width * 1.6), fill: col}));
  }
  return g(null, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-05-mechanism',
    title: 'Cumulative conditions — exploded gear board: which piece connects to which',
    titleEs: 'Condiciones acumulativas — Mecanismo o relación explicada',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Condiciones acumulativas',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded assembly drawing of the rule board: the fact pieces are pulled out of their pockets, only the supplied relationships are drawn by kind (fact ↔ pocket as a plain relation, the gear line as a sequence), a tracer runs the traversal order down the gear line while the focus element enlarges, then the pieces return and a test half-turn shows how far the motion passes. Piece statuses are supplied; nothing is decided.',
    tags: ['reasoning', 'cumulative conditions', 'all required', 'mechanism', 'exploded view', 'gears', 'relations', 'tracer', 'rule', 'facts', 'pending', 'disputed'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/condiciones-acumulativas.js', 'src/animations/causation/kits/place.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CA_STRINGS,
  scene,
});
