/**
 * LAW-0060 — Lectura de sumario · inspect
 *
 * Storyboard:
 *  0.00–0.20 build       Context: the summary card is clipped to a tall reading
 *                        stand, the decision text hangs opened beneath it, the
 *                        bracket runs from the card's pointer (→ ¶ n) to the
 *                        highlighted passage. Bookcase and search box around.
 *  0.20–0.45 isolate     A lens lifts a real enlarged copy of the card's
 *                        pointer region (same coordinates) into free space
 *                        (a spot checked against the search box, the stand,
 *                        the strip and its bracket); the whole frame dims.
 *  0.45–0.75 substitute  Inside the lens the pointer datum is replaced
 *                        (beforeValue → afterValue): the old value lifts out
 *                        before the new one settles; a single editorial
 *                        annotation beside the lens keeps the old value,
 *                        struck through.
 *  0.75–1.00 return      The annotation leaves with the lens, which closes
 *                        back onto the card. Only the dependent geometry
 *                        updates: the bracket (routed right of the stand
 *                        board) re-routes to the new paragraph and the
 *                        highlighter moves there, while the old bracket stays
 *                        as a dashed grey trace with its end dot. A "datum
 *                        changed" pin sits on the card edge above the
 *                        bracket's start, and the before → after annotation
 *                        re-appears under its chip, next to the pointer.
 * Other focus targets: the decision date or the decision identifier (shown on
 * the card and on the decision header). Seeking back restores the old datum.
 * @module animations/research/LAW-0060
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {inspectFields} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {sumarioContentFields, SUMARIO_STRINGS, PARAGRAPHS} from './kits/lectura-de-sumario-fields.js';
import {readingStage, summaryCard, STAGE, hyphenCtx} from './kits/lectura-de-sumario.js';

const ID = 'LAW-0060';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.02, 0.1], ctxLink: [0.04, 0.14], ctxMark: [0.1, 0.18], open: [0.22, 0.42], before: [0.36, 0.44],
  strike: [0.47, 0.53], change: [0.5, 0.66], after: [0.62, 0.7], annOut: [0.765, 0.8], close: [0.78, 0.88], ctxUpdate: [0.82, 0.88],
  reroute: [0.85, 0.93], marker: [0.89, 0.94], ctxAnn: [0.92, 0.98],
};

const sceneSchema = {
  ...sumarioContentFields,
  ...inspectFields(['pointer', 'date', 'citation']),
};

const defaultParams = {
  query: 'notice letter Day 3',
  sources: {library: 'Case library', volume: 'Vol. 12', database: 'Case search (fictional)'},
  citations: {decision: 'FD-118', paragraph: 3},
  dates: {decision: 'Day 12'},
  summaryText: 'The decision discusses the notice letter that Party A sent on Day 3.',
  passageText: 'The panel reviewed the letter dated Day 3 and the reply sent by Party B.',
  focusTarget: 'pointer',
  beforeValue: '¶ 3',
  afterValue: '¶ 2',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Summary card opened to its passage', marker: 'Datum changed'},
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
const SHAPES = ['landscape', 'square', 'portrait'];
/**
 * Where the lens may open (stage units), in order of preference. The lens may
 * cover the dimmed search box or shelf, never the card, its strip or its
 * bracket. The before→after annotation is then placed next to the lens in a
 * spot checked against the search box, the stand (board + clip), the strip,
 * the bracket, the shelf, the library chip and the context caption.
 */
const LENS_REGIONS = {
  horizontal: [{x: 924, y: 344, w: 662, h: 500}, {x: 924, y: 14, w: 662, h: 640}],
  square: [{x: 520, y: 12, w: 670, h: 390}, {x: 790, y: 12, w: 400, h: 1040}],
  vertical: [{x: 16, y: 352, w: 933, h: 330}, {x: 16, y: 14, w: 933, h: 340}],
};

/** Paragraph number carried by a pointer value such as "¶ 3" (null if none). */
const paraOf = v => {
  const m = /(\d+)/.exec(String(v));
  return m ? Math.min(PARAGRAPHS, Math.max(1, Number(m[1]))) : null;
};
/** The two cone lines lens.js draws between the source and the lens window. */
function coneSegs(S, R) {
  const sc = {x: S.x + S.w / 2, y: S.y + S.h / 2};
  const rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
  if (Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y)) {
    const sx = rc.x > sc.x ? S.x + S.w : S.x;
    const rx = rc.x > sc.x ? R.x : R.x + R.w;
    return [[{x: sx, y: S.y}, {x: rx, y: R.y}], [{x: sx, y: S.y + S.h}, {x: rx, y: R.y + R.h}]];
  }
  const sy = rc.y > sc.y ? S.y + S.h : S.y;
  const ry = rc.y > sc.y ? R.y : R.y + R.h;
  return [[{x: S.x, y: sy}, {x: R.x, y: ry}], [{x: S.x + S.w, y: sy}, {x: R.x + R.w, y: ry}]];
}
const crosses = (b, segs, pad = 0) => segs.some(([a, c]) => Array.from({length: 33}, (_, i) => ({x: a.x + ((c.x - a.x) * i) / 32, y: a.y + ((c.y - a.y) * i) / 32}))
  .some(q => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad));
const hit = (a, b, pad = 0) => Boolean(a && b) && a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/**
 * Before → after annotation as a row (old · arrow · new) or a stack (old,
 * arrow down, new). The old value is struck line by line (per text line of
 * its chip). Long identifiers wrap after their hyphens, never mid-token.
 * When `animated`, the arrow is its own node (`${prefix}-arrow`) so it can
 * appear together with the new value it points to. Stage units.
 * @returns {{node:any, box:any, strikes:{name:string,len:number}[]}}
 */
function annotation(ctx0, o) {
  const ctx = hyphenCtx(ctx0);
  const th = ctx.theme;
  const {kind, x, y, size, maxWidth, before, after, prefix, animated} = o;
  const maxLines = o.maxLines ?? 3;
  const probeB = chip(ctx, before, {x: 0, y: 0, anchor: 'start', maxWidth, size, maxLines});
  const probeA = chip(ctx, after, {x: 0, y: 0, anchor: 'start', maxWidth, size, maxLines});
  const bw = probeB.box.w, bh = probeB.box.h, aw = probeA.box.w, ah = probeA.box.h;
  const row = kind === 'row';
  const W = row ? bw + ARROW + aw : Math.max(bw, aw);
  const H = row ? Math.max(bh, ah) : bh + STACK_GAP + ah;
  const bPos = row ? {x, y: y + (H - bh) / 2} : {x: x + (W - bw) / 2, y};
  const aPos = row ? {x: x + bw + ARROW, y: y + (H - ah) / 2} : {x: x + (W - aw) / 2, y: y + bh + STACK_GAP};
  const cB = chip(ctx, before, {...bPos, anchor: 'start', maxWidth, size, maxLines, fill: th.card, name: animated ? `${prefix}-before` : undefined});
  const cA = chip(ctx, after, {...aPos, anchor: 'start', maxWidth, size, maxLines, fill: th.accent2Soft, stroke: th.accent2, name: animated ? `${prefix}-after` : undefined});
  // one strike per text line of the old value (centred text)
  const f = cB.fit;
  const padY = size * 0.38;
  const strikes = [];
  const lines = f.lines.map((line, i) => {
    const lw = ctx.measure(line, f.size, f.weight, f.family) + 8;
    const ly = cB.box.y + padY + f.size * 0.8 + i * f.lineHeight - f.size * 0.32;
    const x1 = cB.box.cx - lw / 2, x2 = cB.box.cx + lw / 2;
    const name = animated ? `${prefix}-strike${i}` : undefined;
    if (name) strikes.push({name, len: lw});
    return h('line', {name, x1: r(x1), x2: r(x2), y1: r(ly), y2: r(ly), stroke: th.accent, 'stroke-width': 3.5, 'stroke-linecap': 'round',
      'stroke-dasharray': animated ? `${r(lw)} ${r(lw + 10)}` : null, 'stroke-dashoffset': animated ? r(lw) : null});
  });
  const arrowName = animated ? `${prefix}-arrow` : undefined;
  const arrow = row
    ? h('path', {name: arrowName, d: `M${r(x + bw + 9)} ${r(y + H / 2)}h${ARROW - 18}m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: animated ? 0 : null})
    : h('path', {name: arrowName, d: `M${r(x + W / 2)} ${r(y + bh + 5)}v${STACK_GAP - 10}m-9 -10l9 10l9 -10`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: animated ? 0 : null});
  return {node: g(null, cB.node, lines, arrow, cA.node), box: {x, y, w: W, h: H}, strikes, dims: {bw, bh, aw, ah}};
}
const ARROW = 44;
const STACK_GAP = 34;

/**
 * Pure geometry of the inspect scene for one axis (stage units): the clipped
 * context, the brackets, the lens source / destination, both placements of
 * the before→after annotation and the changed-datum marker, plus clearance
 * facts (used for the scene on screen and reported for all three shapes).
 */
function geometry(ctx, axis) {
  const p = ctx.params;
  const th = ctx.theme;
  const t = ctx.t;
  const st = STAGE[axis];
  const target = p.focusTarget;
  const isPtr = target === 'pointer';
  const beforeN = isPtr ? paraOf(p.beforeValue) ?? p.citations.paragraph : p.citations.paragraph;
  const afterN = isPtr ? paraOf(p.afterValue) ?? beforeN : beforeN;
  const cardSwap = {field: isPtr ? 'pointer' : target === 'date' ? 'date' : 'decision', before: p.beforeValue, after: p.afterValue};
  const headerSwap = isPtr ? null : {field: target === 'date' ? 'date' : 'decision', before: p.beforeValue, after: p.afterValue};
  const content = {
    query: p.query, database: p.sources.database, library: p.sources.library, volume: p.sources.volume,
    decision: target === 'citation' ? p.beforeValue : p.citations.decision,
    date: target === 'date' ? p.beforeValue : p.dates.decision,
    summary: p.summaryText, passage: p.passageText, paragraph: beforeN, cardHeader: t.summary,
  };
  const stage = readingStage(ctx, {prefix: 'ctx', axis, mode: 'clipped', content, withLink: false, chips: true, highlights: [...new Set([beforeN, afterN])], cardSwap, headerSwap});
  const G = stage.free;
  const stripCx = stage.sx + stage.sw / 2;
  const boardHalf = G.lectern[0] / 2;
  const edge = stage.sx + stage.sw;
  // Brackets run in the free space right of the stand board (never over the
  // wood): the old one in the outer lane, the re-routed one in the inner lane.
  const linkOff = Math.max(34, stripCx + boardHalf - edge + 34);
  const linkBefore = stage.linkFor(beforeN, 'link0', {off: linkOff});
  const linkAfter = afterN !== beforeN ? stage.linkFor(afterN, 'link1', {off: linkOff - 16}) : null;
  // the old bracket stays traceable as a dashed grey line with its end dot
  const trace = g({name: 'link0-trace', opacity: 0},
    h('path', {d: linkBefore.d, fill: 'none', stroke: th.inkSoft, 'stroke-width': 4, 'stroke-dasharray': '10 9', 'stroke-linecap': 'round'}),
    h('circle', {cx: linkBefore.to.x, cy: linkBefore.to.y, r: 6.5, fill: th.paper, stroke: th.inkSoft, 'stroke-width': 3}));

  // Lens source: the region of the card that holds the datum (card-local).
  const cw = stage.sw, chh = stage.hp, cb = stage.card.boxes;
  const k = cw / 380;
  const footY = chh - 36 * k;
  // pointer: the whole card (summary + pointer read together); date: only
  // the footer row; identifier: only the header row (no stray summary text)
  const reg = isPtr ? {x: -6, y: -20, w: cw + 12, h: chh + 26}
    : target === 'date' ? {x: -6, y: footY - 6, w: Math.min(cb.pointer.x - 4, Math.max(cw * 0.5, cb.date.x + cb.date.w + 16)) + 6, h: chh - footY + 12}
      : (() => { const x0 = Math.min(cw * 0.4, cb.decision.x - 8); return {x: x0, y: -20 * k, w: cw + 6 - x0, h: 66 * k}; })();
  const src = {x: stage.sx + reg.x, y: stage.finalTop + reg.y, w: reg.w, h: reg.h};

  // Obstacles (stage units).
  const scr = stage.screen.box;
  const screenBox = {x: scr.x - 4, y: scr.y - 30, w: scr.w + 16, h: scr.h + 46};
  const stripBox = {x: stage.sx - 10, y: stage.finalTop - 24, w: stage.sw + 20, h: stage.seat - stage.finalTop + 30};
  const standBox = {x: stripCx - boardHalf - 16, y: stage.finalTop - 72, w: boardHalf * 2 + 32, h: stage.ledge + 22 - (stage.finalTop - 72)};
  const lowest = Math.max(linkBefore.y1, linkAfter ? linkAfter.y1 : 0);
  const bracketBox = {x: edge, y: linkBefore.y0 - 12, w: linkOff + 14, h: lowest - linkBefore.y0 + 24};
  const shelfBox = stage.shelf.box;
  const libBox = stage.libChip ? stage.libChip.box : null;
  const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: st.w / 2, y: stage.floor + 14, anchor: 'middle', maxWidth: st.w - 60, size: 30, maxLines: 1, weight: 600, name: 'ctx-caption'}) : null;
  const capBox = ctxCap ? ctxCap.box : null;
  const within = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= st.w - 8 && b.y + b.h <= st.h - 8;

  // Lens destination + annotation placement: the largest zoom (≤ requested)
  // for which a clear spot exists for both.
  const keyOn = ctx.show('key');
  const label = isPtr ? t.pointer : target === 'date' ? t.date : t.citation;
  const beforeText = `${label}: ${p.beforeValue}`, afterText = `${label}: ${p.afterValue}`;
  const annSize = axis === 'square' ? 30 : 28;
  const annMax = axis === 'vertical' ? 380 : 360;
  const dimsOf = kind => annotation(ctx, {kind, x: 0, y: 0, size: annSize, maxWidth: annMax, before: beforeText, after: afterText, prefix: 'probe'}).box;
  const rowD = keyOn ? dimsOf('row') : null, stackD = keyOn ? dimsOf('stack') : null;
  const annObstacles = [screenBox, standBox, stripBox, bracketBox, shelfBox, libBox, capBox].filter(Boolean);
  const lensObstacles = [stripBox, bracketBox];
  const annAt = D => {
    const rowX = Math.min(Math.max(8, D.x + D.w / 2 - rowD.w / 2), st.w - 8 - rowD.w);
    return [
      {kind: 'row', box: {x: rowX, y: D.y + D.h + 18, w: rowD.w, h: rowD.h}},
      {kind: 'row', box: {x: rowX, y: D.y - 18 - rowD.h, w: rowD.w, h: rowD.h}},
      {kind: 'stack', box: {x: D.x + D.w + 20, y: D.y, w: stackD.w, h: stackD.h}},
      {kind: 'stack', box: {x: D.x - 20 - stackD.w, y: D.y, w: stackD.w, h: stackD.h}},
      {kind: 'stack', box: {x: Math.min(D.x + D.w - stackD.w, st.w - 8 - stackD.w), y: D.y + D.h + 18, w: stackD.w, h: stackD.h}},
      {kind: 'stack', box: {x: Math.min(Math.max(8, D.x + D.w / 2 - stackD.w / 2), st.w - 8 - stackD.w), y: D.y + D.h + 18, w: stackD.w, h: stackD.h}},
    ];
  };
  const srcIn = {x: src.x + 6, y: src.y + 6, w: src.w - 12, h: src.h - 12};
  const zMax = Math.max(1.2, p.detailGeometry.zoom);
  // pass 1 keeps the annotation off the lens's cone lines too; pass 2 lets a
  // chip sit on a cone line (the chip simply hides that bit of dashed line).
  // `offScreen`: the lens window also keeps clear of the search box, so its
  // edge never cuts through the result rows (half-cut glyphs).
  const scrPad = {x: scr.x, y: scr.y, w: scr.w, h: scr.h};
  const search = (R, strictCone, offScreen) => {
    for (let z = zMax; z >= 1.2 - 1e-9; z -= 0.05) {
      const dw = src.w * z, dh = src.h * z;
      if (dw > R.w || dh > R.h) continue;
      for (const dy of [R.y, R.y + R.h - dh, R.y + (R.h - dh) / 2]) {
        for (const dx of [R.x + (R.w - dw) / 2, R.x + R.w - dw, R.x]) {
          const dest = {x: dx, y: dy, w: dw, h: dh};
          if (!within(dest) || lensObstacles.some(o => hit(dest, o, 12))) continue;
          if (offScreen && hit(dest, scrPad, 10)) continue;
          // the cone lines must not cut across the source card's printed text
          const cone = coneSegs(src, dest);
          if (crosses(srcIn, cone)) continue;
          const ann = keyOn
            ? annAt(dest).find(q => within(q.box) && !hit(q.box, dest, 10) && !annObstacles.some(o => hit(q.box, o, 8)) && (!strictCone || !crosses(q.box, cone, 6)))
            : {kind: null, box: null};
          if (ann) return {dest, ann, z};
        }
      }
    }
    return null;
  };
  // regions in order of preference: the first one that still gives a
  // legible zoom wins (else the largest zoom found anywhere). A spot clear
  // of the search box is preferred at any zoom; only when none exists may
  // the lens cover the search box (which then fades out, see below).
  const pick = found => found.find(f => f.z >= Math.min(1.45, zMax) - 1e-9) || found.sort((m, n) => n.z - m.z)[0] || null;
  const regions = LENS_REGIONS[axis];
  let best = pick(regions.map(R => search(R, true, true) || search(R, false, true)).filter(Boolean))
    || pick(regions.map(R => search(R, true, false) || search(R, false, false)).filter(Boolean));
  const annClear = Boolean(best);
  if (!best) {
    const R = LENS_REGIONS[axis][0];
    const z = Math.min(1.2, R.w / src.w, R.h / src.h);
    const dest = {x: R.x + (R.w - src.w * z) / 2, y: R.y, w: src.w * z, h: src.h * z};
    best = {dest, z, ann: keyOn ? annAt(dest)[0] : {kind: null, box: null}};
  }
  const lensAnn = keyOn ? annotation(ctx, {kind: best.ann.kind, x: best.ann.box.x, y: best.ann.box.y, size: annSize, maxWidth: annMax, before: beforeText, after: afterText, prefix: 'ann', animated: true}) : null;

  // Changed-datum marker, pinned to the card's right edge ABOVE the bracket's
  // start (identifier: at the header row), with its chip in the free column
  // right of the brackets; after the lens closes the before→after
  // annotation re-anchors under that chip, next to the pointer.
  const cardTop = stage.finalTop;
  const pinAt = {x: edge, y: target === 'citation' ? cardTop + 22 * k : linkBefore.y0 - 34};
  const colX = linkBefore.bx + 26;
  const colW = st.w - 12 - colX;
  let markChip = null, lead = null, ctxAnn = null;
  if (keyOn) {
    const mSize = 26;
    const make = (y, mw) => chip(ctx, p.contextLabels.marker, {x: colX, y, anchor: 'start', maxWidth: mw, size: mSize, maxLines: 2, fill: th.card, stroke: th.accent2});
    const probe = make(0, colW);
    let y = pinAt.y - probe.box.h / 2;
    markChip = make(y, colW);
    if (hit(markChip.box, screenBox, 6)) {
      const narrow = screenBox.x - 12 - colX;
      markChip = narrow >= 150 ? make(y, narrow) : null;
      if (!markChip || hit(markChip.box, screenBox, 6)) { y = screenBox.y + screenBox.h + 8; markChip = make(y, colW); }
    }
    const cbx = markChip.box;
    lead = h('line', {x1: pinAt.x + 16, y1: pinAt.y, x2: cbx.x, y2: cbx.cy, stroke: th.accent2, 'stroke-width': 3});
    const cSize = axis === 'vertical' ? 24 : 26;
    const cMax = Math.min(annMax, colW);
    let ay = cbx.y + cbx.h + 14;
    // the narrow column may need a fourth line so a long identifier can wrap
    // after its hyphens instead of mid-token
    const probeC = annotation(ctx, {kind: 'stack', x: colX, y: ay, size: cSize, maxWidth: cMax, before: beforeText, after: afterText, prefix: 'cann', maxLines: 4});
    if (hit(probeC.box, screenBox, 6)) ay = Math.max(ay, screenBox.y + screenBox.h + 8);
    ctxAnn = annotation(ctx, {kind: 'stack', x: colX, y: ay, size: cSize, maxWidth: cMax, before: beforeText, after: afterText, prefix: 'cann', maxLines: 4});
  }
  const marker = g({name: 'marker', opacity: 0},
    lead,
    h('circle', {cx: pinAt.x, cy: pinAt.y, r: 16, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
    h('path', {d: `M${r(pinAt.x)} ${r(pinAt.y - 7)}l7 12.25h-14z`, fill: 'none', stroke: '#fff', 'stroke-width': 3.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    markChip && markChip.node,
    ctxAnn && g({name: 'cann', opacity: 0}, ctxAnn.node),
  );
  // the library chip only steps aside while the lens (or its annotation)
  // covers it, and comes back on return
  const libCovered = Boolean(libBox && (hit(best.dest, libBox, 6) || (lensAnn && hit(lensAnn.box, libBox, 6))));
  // a search box under the open lens window (even partly) fades out with the
  // dim — its rows would otherwise show half-cut glyphs at the lens edge —
  // and comes back as the lens closes
  const ovW = Math.min(best.dest.x + best.dest.w, scr.x + scr.w) - Math.max(best.dest.x, scr.x);
  const ovH = Math.min(best.dest.y + best.dest.h, scr.y + scr.h) - Math.max(best.dest.y, scr.y);
  const screenCovered = ovW > 0 && ovH > 0;
  const markerBoxes = [markChip && markChip.box, ctxAnn && ctxAnn.box].filter(Boolean);
  const facts = {
    annClear,
    lensOffScreen: !hit(best.dest, scrPad, 0),
    zoom: r(best.z, 3),
    pinClear: Math.hypot(pinAt.x - linkBefore.from.x, pinAt.y - linkBefore.from.y) >= 16 + 6.5 + 4 && !hit({x: pinAt.x - 16, y: pinAt.y - 16, w: 32, h: 32}, {x: edge, y: linkBefore.y0 - 4, w: linkOff + 4, h: 8}),
    markerClear: markerBoxes.every(b => within(b) && ![screenBox, standBox, stripBox, bracketBox, capBox].filter(Boolean).some(o => hit(b, o, 4))),
    bracketOffBoard: linkBefore.bx - 2.5 > stripCx + boardHalf && (!linkAfter || linkAfter.bx - 2.5 > stripCx + boardHalf),
  };
  return {st, stage, isPtr, target, beforeN, afterN, linkBefore, linkAfter, trace, src, dest: best.dest, lensAnn, marker, ctxCap, libCovered, screenCovered, facts, cardSwap, content, k};
}

const scene = {
  sizes: {landscape: [1600, 950], square: [1200, 1150], portrait: [900, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const axis = AXIS[shape];
    const Gm = geometry(ctx, axis);
    const {st, stage, src, dest} = Gm;
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2, oy = (ctx.design.h - st.h * s) / 2;
    const toDesign = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
    const source = toDesign(src);
    // Real copy of the card, drawn at the same coordinates as the context card.
    const lensCard = summaryCard(ctx, {prefix: 'lcard', w: stage.sw, h: stage.hp, header: t.summary, decision: Gm.content.decision, date: Gm.content.date, summary: p.summaryText, pointer: Gm.beforeN, showText: ctx.show('all'), swap: Gm.cardSwap});
    const lensContent = g({transform: T(ox, oy, 0, s)}, g({transform: T(stage.sx, stage.finalTop)}, lensCard.node));
    // the dimming covers the whole frame (no hard-edged grey box inside it)
    const frameBox = {x: -4000, y: -4000, w: ctx.design.w + 8000, h: ctx.design.h + 8000};
    const L2 = lens(ctx, {name: 'lens', source, dest: toDesign(dest), content: lensContent, frame: frameBox, color: th.accent2});
    // clearance of annotations / marker / brackets in every shape (for tests)
    const clearance = Object.fromEntries(SHAPES.map(sh => [sh, sh === shape ? Gm.facts : geometry(ctx, AXIS[sh]).facts]));
    return {...Gm, s, ox, oy, source, L2, clearance};
  },
  build(ctx, L) {
    const stageT = T(L.ox, L.oy, 0, L.s);
    return g(null,
      g({transform: stageT},
        L.stage.node,
        L.trace,
        L.linkBefore.node,
        L.linkAfter && L.linkAfter.node,
        L.ctxCap && L.ctxCap.node,
        L.marker),
      L.L2.node,
      L.lensAnn && g({transform: stageT}, g({name: 'ann', opacity: 0}, L.lensAnn.node)),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const change = ease.inOutSine(seg(u, ...W.change));
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const reroute = ease.inOutCubic(seg(u, ...W.reroute));
    // Context: strip opened and clipped; the pointed passage highlighted.
    const moves = L.isPtr && L.afterN !== L.beforeN;
    const marks = {[L.beforeN]: seg(u, ...W.ctxMark) * (moves ? 1 - reroute : 1)};
    if (moves) marks[L.afterN] = reroute;
    const posed = L.stage.pose({lift: 1, marks});
    Object.assign(nodes, posed.nodes);
    // Links: the old bracket turns into a dashed grey trace as the new one is drawn.
    Object.assign(nodes, L.linkBefore.frame(ease.inOutCubic(seg(u, ...W.ctxLink))));
    const traceOn = moves ? r(0.62 * reroute, 3) : 0;
    nodes.link0 = {opacity: moves ? r(1 - reroute, 3) : 1};
    nodes['link0-trace'] = {opacity: traceOn};
    if (L.linkAfter) Object.assign(nodes, L.linkAfter.frame(moves ? reroute : 0));
    // Lens open / close
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.L2.frame(lp, lp));
    if (L.screenCovered) nodes['ctx-screen'] = {opacity: r(1 - clamp(lp * 1.6), 3)};
    // Old value lifts out before the new one settles (never a double exposure).
    // (with labels hidden the card carries pips / bars under the same names)
    const swap = (prefix, pr) => {
      const out = clamp(pr * 2), inn = clamp(pr * 2 - 1);
      nodes[`${prefix}-sw0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-12 * out)})`};
      nodes[`${prefix}-sw1`] = {opacity: r(inn, 3), transform: `translate(0 ${r(12 * (1 - inn))})`};
    };
    swap('lcard', change);
    swap('ctx-card', ctxUpd);
    if (!L.isPtr && ctx.show('all')) {
      const out = clamp(ctxUpd * 2), inn = clamp(ctxUpd * 2 - 1);
      nodes['ctx-pg1-hsw0'] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
      nodes['ctx-pg1-hsw1'] = {opacity: r(inn, 3), transform: `translate(0 ${r(10 * (1 - inn))})`};
    }
    // Before→after beside the lens; it leaves with the lens and re-appears
    // (struck old value kept) next to the pointer, under the marker chip.
    const annOut = seg(u, ...W.annOut);
    if (L.lensAnn) {
      const sp = seg(u, ...W.strike);
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.4 * sp), 3)};
      const n = L.lensAnn.strikes.length;
      L.lensAnn.strikes.forEach((st, i) => { nodes[st.name] = {'stroke-dashoffset': r(st.len * (1 - clamp(sp * n - i)))}; });
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      // the arrow appears with the value it points to (never a lone arrow)
      nodes['ann-arrow'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes.ann = {opacity: u >= W.before[0] ? r(1 - annOut, 3) : 0};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    let libOp = null;
    if (L.stage.libChip) {
      const hidden = L.libCovered ? clamp(open / 0.15) * (1 - clamp((close - 0.85) / 0.15)) : 0;
      libOp = r(1 - hidden, 3);
      nodes['ctx-libchip'] = {opacity: libOp};
    }
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    if (L.lensAnn) nodes.cann = {opacity: r(seg(u, ...W.ctxAnn), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const lit = Object.entries(marks).filter(([, v]) => v >= 0.5).map(([k]) => Number(k));
    return {
      nodes,
      semantic: {
        beat,
        focusTarget: L.target,
        lensOpen: r(lp, 3),
        datum,
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        highlighted: lit,
        linkTo: moves && reroute >= 1 ? L.afterN : L.beforeN,
        oldLinkTrace: moves ? r(Math.max(1 - reroute, traceOn), 3) : 1,
        beforeParagraph: L.beforeN,
        afterParagraph: L.afterN,
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        cardTop: posed.semantic.cardTop,
        allReached: posed.semantic.allReached,
        libChip: libOp,
        clearance: L.clearance,
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
    slug: 'research-05-inspect',
    title: 'Reading a summary — inspect the pointer',
    titleEs: 'Lectura de sumario — Inspección y cambio de un dato',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Lectura de sumario',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens enlarges the pointer on a summary card (→ ¶ n) that is clipped above its opened decision text; the pointer value is replaced inside the lens with the old value kept struck through, and on return only the dependent geometry changes: the bracket re-routes and the highlighter moves to the new paragraph. Date or decision identifier can be the inspected datum instead.',
    tags: ['summary', 'sumario', 'inspect', 'lens', 'pointer', 'paragraph', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/lectura-de-sumario.js', 'src/animations/research/kits/lectura-de-sumario-fields.js', 'src/frameworks/lens.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: SUMARIO_STRINGS,
  scene,
});
