/**
 * LAW-0144 — Ámbito territorial · inspect
 *
 * Storyboard (brief beats in brackets):
 *  [0.00–0.20] build: the state produced by the placement fills the frame —
 *              the organiser with the fictional texts, the zone board with the
 *              article slip on its zone and the amber sheet over that zone,
 *              every fact pawn on the tile supplied for it (tags out, rings
 *              shown) and the key. The focus pawn's tag also carries the zone
 *              supplied for it (the datum that will be replaced).
 *  [0.20–0.45] isolate: while the table shrinks into a framed context miniature
 *              (simplified only while it is small; the full context below it
 *              stays solid) a detail window grows out of the region around
 *              the focus pawn. Its card is blank while it is translucent; once
 *              opaque, its real enlarged copy (with real text, same coordinates)
 *              fades in — no double image. A text the rim would cut is left out
 *              of the copy. Two sight lines tie it to its source; a note shows
 *              the fact and the zone as supplied.
 *  [0.45–0.69] substitute: in the window only, the old zone line is struck and
 *              lifts out, the alternative datum slides in; the tag folds in,
 *              the pawn crosses to a tile of the new zone (wholly inside it,
 *              clear of every border), the tag opens again and its ring follows
 *              the supplied placement (solid = same zone as the text, dashed =
 *              another zone). The window follows the pawn when its new place is
 *              far.
 *  [0.69–1.00] return: the copy fades out on the opaque card, the context
 *              pawn moves the same way, and only then does the blank card close
 *              into its source and fade while the context grows back to full
 *              size with all its text (main action done by u 0.8). A Δ marker
 *              stays beside the pawn; a card on free desk space, led to the Δ by
 *              a leader that crosses no text, keeps the context caption, the Δ
 *              title, the old zone struck through → the new zone and the new
 *              state (as supplied). Seeking back restores the old datum and place
 *              exactly. No validity, application or outcome is inferred.
 * @module animations/sources/LAW-0144
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {inspectFields} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  territorialFields, CONTENT_EN, KIT_STRINGS, kitStrings, resolvePlacement, boardStage, STAGE, TOKEN_R, fitWords,
  greek, ZONE_FILL, ZONE_EDGE, NEUTRAL, sheetDark, pawnInterior,
} from './kits/ambito-territorial.js';

const ID = 'LAW-0144';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  // the window opens out of the source region while the context shrinks (no empty transition)
  // (the window card is blank while translucent; its copy fades in only once the card is opaque)
  // the card turns opaque at once (0.2–0.214); its copy fades in on the opaque card right after (≤ ~200 ms blank)
  shrink: [0.2, 0.32], greek: [0.27, 0.29], open: [0.2, 0.34], cardIn: [0.2, 0.214], copyIn: [0.214, 0.222], note: [0.33, 0.39],
  strike: [0.43, 0.48], sub: [0.46, 0.53], fold: [0.53, 0.56], move: [0.56, 0.63], unfold: [0.63, 0.66], rel: [0.63, 0.66], after: [0.56, 0.63],
  // return: the window closes back into its source while the context grows back to full size with its real text
  // (the copy leaves first; the blank card closes; the context is updated before the card turns translucent)
  // (the copy stays on the opaque card while it closes; it leaves just before the card turns translucent)
  copyOut: [0.748, 0.756], close: [0.69, 0.77], cardOut: [0.756, 0.77], grow: [0.69, 0.79], ungreek: [0.7, 0.72], undim: [0.69, 0.75], lines: [0.69, 0.72], noteOut: [0.69, 0.73],
  cSub: [0.69, 0.7], cFold: [0.69, 0.71], cMove: [0.71, 0.735], cUnfold: [0.735, 0.745], cRel: [0.735, 0.745],
  marker: [0.8, 0.84], state: [0.8, 0.84], noteR: [0.8, 0.84],
};
const TARGETS = ['fact-1', 'fact-2', 'fact-3'];

const STRINGS = {
  en: {context: 'Context', zoneSupplied: 'Zone supplied', now: 'Now'},
  es: {context: 'Contexto', zoneSupplied: 'Zona aportada', now: 'Ahora'},
};

// (attributed readings are not part of this inspection: the field is left out rather than never drawn)
const {interpretations: _noReadings, ...placementFields} = territorialFields;
const sceneSchema = {
  ...placementFields,
  ...inspectFields(TARGETS),
};
sceneSchema.focusTarget.description = 'Fact pawn whose supplied zone is enlarged and substituted (fact-1 = first fact)';
sceneSchema.beforeValue.description = 'Zone supplied for that fact before the substitution (it replaces the zone of that fact; compared verbatim with the zone names)';
sceneSchema.afterValue.description = 'Alternative zone supplied after the substitution (compared verbatim with the zone names)';
sceneSchema.detailGeometry.properties.zoom.description = 'Magnification of the detail window relative to the full-size context (reduced only if the window would not fit)';

const {interpretations: _noReadings2, ...CONTENT_NO_READINGS} = CONTENT_EN;
const defaultParams = {
  ...CONTENT_NO_READINGS,
  focusTarget: 'fact-2',
  beforeValue: 'Zone Birch (fictional)',
  afterValue: 'Zone Alder (fictional)',
  detailGeometry: {zoom: 2.2, placement: 'auto'},
  contextLabels: {context: 'Facts and text placed on the zones', marker: 'Datum changed'},
};

/**
 * Composition per shape (stage units):
 *  C1 / C2  the context miniature during the inspection / at the return (top-left, scale k)
 *  I1 / I2  the box the detail window is centred in
 *  note     the single editorial note
 */
const COMPOSE = {
  landscape: {C1: {x: 14, y: 14, k: 0.5}, C2: {x: 14, y: 14, k: 0.52}, I1: {x: 884, y: 14, w: 792, h: 700}, I2: {x: 914, y: 14, w: 762, h: 660}, note: {x: 14, y: 'belowC', w: 860}, noteR: {x: 884, y: 'belowI', w: 792}},
  portrait: {C1: {x: 14, y: 14, k: 0.5}, C2: {x: 14, y: 14, k: 0.58}, I1: {x: 14, y: 760, w: 922, h: 585}, I2: {x: 14, y: 872, w: 922, h: 473}, note: {x: 'rightC', y: 14, w: 0}},
  square: {C1: {x: 14, y: 14, k: 0.44}, C2: {x: 14, y: 14, k: 0.5}, I1: {x: 14, y: 400, w: 922, h: 324}, I2: {x: 14, y: 440, w: 922, h: 284}, note: {x: 'rightC', y: 14, w: 0}},
};

const STAGE_KEY = {landscape: 20, portrait: 20, square: 18};
const mapRect = (C, q) => ({x: C.x + q.x * C.k, y: C.y + q.y * C.k, w: q.w * C.k, h: q.h * C.k});
const mixC = (a, b, e) => ({x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), k: lerp(a.k, b.k, e)});
const lerpRect = (a, b, e) => ({x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), w: lerp(a.w, b.w, e), h: lerp(a.h, b.h, e)});
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const union = (a, b) => {
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  return {x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y};
};

/** The two sight lines between a source rect and the window. */
function sightLines(S, R) {
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

function layoutOnce(ctx, geo0, rSize, strips = false, fullSize = true, quick = false) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const st0 = STAGE[shape];
    const s0 = Math.min(ctx.design.w / st0.w, ctx.design.h / st0.h);
    const ox = (ctx.design.w - st0.w * s0) / 2, oy = (ctx.design.h - st0.h * s0) / 2;
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const showKey = ctx.show('key'), showAll = ctx.show('all');
    const K = COMPOSE[shape];
    const fi = Math.min(p.facts.length - 1, TARGETS.indexOf(p.focusTarget));
    const res = resolvePlacement(p, {[fi]: p.beforeValue});
    const after = res.zoneOf(p.afterValue);
    const focus = {index: fi, after, rel: res.relOf(after), beforeText: p.beforeValue, afterText: p.afterValue};
    // (no magnifier on this table: the detail window is the lens)
    // (and no fact dish when every fact lies on the board before and after the substitution)
    const noDish = res.facts.every(f => f.zone >= 0) && after >= 0;
    // 1:1: a shorter organiser leaves room below it for the return card
    const geo = shape === 'square' && noDish ? geo0 : null;
    // the key's caption is never larger than the return card's supplied text
    // (interior: every pawn, before and after the substitution, lies wholly inside its zone)
    const opts = {interior: true, strips, fullSize, shape, params: p, res, arms: false, lupa: false, staticSheet: true, focus, noDish, geo, noTuck: true, keySize: Math.min(rSize, STAGE_KEY[shape] ?? 20)};
    const stage = boardStage(ctx, {prefix: 'st', ...opts});
    // quick checks first (a search step stops here when they fail)
    const q00 = stage.afterSlot;
    const orgOk = !stage.bookBoxes.some(b => stage.org.plates.some(q => hit({x: b.x, y: b.y, w: b.w, h: b.h - 8}, q)))
      && stage.books.filter(Boolean).every(b => b.label.y + b.label.h <= b.box.y + b.box.h - 10 + 0.5);
    const pawnsInterior = res.facts.every((f, i) => !stage.slots[i] || pawnInterior(stage.B, stage.slots[i], f.zone))
      && (!q00 || pawnInterior(stage.B, q00, after));
    const allPlacedAll = res.facts.every((f, i) => f.zone < 0 || Boolean(stage.slots[i])) && (after < 0 || Boolean(q00));
    if (quick && !(orgOk && pawnsInterior && allPlacedAll)) return {orgOk, pawnsInterior, allPlacedAll, noteRClear: false};
    const mini = quick ? null : boardStage(ctx, {prefix: 'mn', ...opts});
    const detail = quick ? null : boardStage(ctx, {prefix: 'dw', ...opts});
    // the miniature is simplified only while it is small; the window is a real copy with real text
    const miniNode = quick ? null : greek(mini.node);
    const detailNode = quick ? null : detail.node;
    const q0 = stage.slots[fi];
    const qa = stage.afterSlot;

    /* --- detail window: a source region around the focus pawn (and tag), before and after --------- */
    const tb = stage.tokenBoxes[fi];
    const m = 22;
    const grow = b => ({x: b.x - m, y: b.y - m, w: b.w + 2 * m, h: b.h + 2 * m});
    const fpA = grow(union(tb.pawn, tb.tag));
    const fpB = qa ? grow(union(qa.pawnBox, qa.tagBox)) : fpA;
    const I = K.I1;
    const zoomFor = S => Math.min(p.detailGeometry.zoom, (I.w - 8) / S.w, (I.h - 8) / S.h);
    // widen a region to the window's aspect (uniform enlargement), centred on the same point, kept on the stage
    const toAspect = (c, w0, h0) => {
      const z = zoomFor({w: w0, h: h0});
      const w = Math.max(w0, (I.w - 8) / z), hh = Math.max(h0, (I.h - 8) / z);
      return {x: clamp(c.x - w / 2, 0, Math.max(0, st0.w - w)), y: clamp(c.y - hh / 2, 0, Math.max(0, st0.h - hh)), w, h: hh};
    };
    const U = union(fpA, fpB);
    const ctr = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    let srcA, srcB;
    if (zoomFor(U) >= 1.5 || !qa) {
      // both places fit one enlarged view: the window stays still while the pawn crosses
      srcA = srcB = toAspect(ctr(U), U.w, U.h);
    } else {
      // far apart: the window follows the pawn (source frame and window move together); each end frames its own
      // place at the largest zoom that fits (the window keeps its size and aspect, the magnification eases between)
      srcA = toAspect(ctr(fpA), fpA.w, fpA.h);
      srcB = toAspect(ctr(fpB), fpB.w, fpB.h);
    }
    const src1 = srcA;
    const z1 = Math.min((I.w - 8) / srcA.w, (I.h - 8) / srcA.h);
    const win1 = {x: I.x + (I.w - srcA.w * z1) / 2, y: I.y + (I.h - srcA.h * z1) / 2, w: srcA.w * z1, h: srcA.h * z1};

    /* --- the context caption: below the miniature, or above it when a sight line would cross it */
    const fact = res.facts[fi];
    const capS = 20;
    const capFit = showAll ? fitWords(ctx, `${t.context}: ${p.contextLabels.context}`, {maxWidth: st0.w * K.C1.k - 20, size: capS, minSize: 16, maxLines: 2, weight: 600}) : null;
    const capH = capFit ? capFit.height + 12 : 0;
    // segment a→b meets box q (Liang–Barsky clipping)
    const segHits = (a, b, q) => {
      let t0 = 0, t1 = 1;
      const dx = b.x - a.x, dy = b.y - a.y;
      for (const [pp, qq] of [[-dx, a.x - q.x], [dx, q.x + q.w - a.x], [-dy, a.y - q.y], [dy, q.y + q.h - a.y]]) {
        if (Math.abs(pp) < 1e-9) { if (qq < 0) return false; continue; }
        const t = qq / pp;
        if (pp < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
      }
      return t0 <= t1;
    };
    // the dashed leader from a card's nearest edge to a target (it stops at the Δ's rim): does it cross a box?
    // (kind: 'line' straight, 'hv' / 'vh' an elbow that goes round the texts)
    const leadCrosses = (b, tg, boxes, kind = 'line') => {
      const pts = leaderPoints(b, tg, kind);
      if (!pts) return true;
      for (let k = 1; k < pts.length; k++) if (boxes.some(q => segHits(pts[k - 1], pts[k], {x: q.x + 2, y: q.y + 2, w: q.w - 4, h: q.h - 4}))) return true;
      return false;
    };
    const capOptions = [{above: false, C1: K.C1}, {above: true, C1: {...K.C1, y: K.C1.y + capH}}];
    const capBoxOf = o => (o.above ? {x: o.C1.x, y: o.C1.y - capH, w: capFit ? capFit.width : 0, h: capH} : {x: o.C1.x, y: o.C1.y + st0.h * o.C1.k + 10, w: capFit ? capFit.width : 0, h: capH});
    const crosses = o => capFit && [srcA, srcB].some(S0 => sightLines(mapRect(o.C1, S0), win1).some(([a, b]) => segHits(a, b, capBoxOf(o))));
    const capO = capOptions.find(o => !crosses(o)) || capOptions[0];
    const C1 = capO.C1;
    const capBox = capBoxOf(capO);

    /* --- note (during the inspection): fact, zone before (struck) → after, new state, neutrality line */
    let nb;
    if (K.note.x === 'rightC') {
      const x0 = C1.x + st0.w * C1.k + 16;
      nb = {x: x0, y: K.note.y, w: st0.w - 14 - x0};
    } else {
      nb = {x: K.note.x, y: C1.y + st0.h * C1.k + (capO.above ? 0 : capH) + 18, w: K.note.w};
    }
    const note = buildNote(ctx, {t, p, fact, focus, box: nb, size: 22, capS, res});
    // landscape: when the note would run off the stage below the miniature, it moves under the window
    let noteBox = note.box;
    if (noteBox.y + noteBox.h > st0.h - 8 && K.noteR) {
      const nb2 = {x: K.noteR.x, y: win1.y + win1.h + 18, w: K.noteR.w};
      const n2 = buildNote(ctx, {t, p, fact, focus, box: nb2, size: 22, capS, res});
      if (n2.box.y + n2.box.h <= st0.h - 8) {
        Object.assign(note, n2);
        noteBox = n2.box;
      }
    }

    /* --- changed-datum marker (context coordinates, beside the pawn at its new place) */
    const endQ = qa || stage.nests[fi];
    // the Δ sits beside the pawn at its new place, clear of every pawn, tag, plaque and the slip
    const mkObst = [];
    stage.tokenBoxes.forEach((tb2, i) => {
      if (i === fi && qa) mkObst.push(qa.pawnBox, qa.tagBox);
      else if (stage.slots[i]) mkObst.push(tb2.pawn, tb2.tag);
    });
    stage.board.plaques.forEach(q => mkObst.push(q.box));
    if (stage.slipSpot && stage.slipDims) mkObst.push({x: stage.slipSpot.x, y: stage.slipSpot.y, w: stage.slipDims.W, h: stage.slipDims.H});
    // every free spot for the Δ beside the pawn, best first (the return card below picks the one its leader reaches clear)
    const mkCands = [];
    for (let a = 0; a < 24; a++) {
      for (const d of [TOKEN_R + 36, TOKEN_R + 56, TOKEN_R + 80, TOKEN_R + 110]) {
        const c = {x: endQ.x + d * Math.cos((a * Math.PI) / 12 - Math.PI * 0.75), y: endQ.y + d * Math.sin((a * Math.PI) / 12 - Math.PI * 0.75)};
        const b = {x: c.x - 31, y: c.y - 31, w: 62, h: 62};
        if (b.x < stage.B.inner.x || b.y < stage.B.inner.y || b.x + b.w > stage.B.inner.x + stage.B.inner.w || b.y + b.h > stage.B.inner.y + stage.B.inner.h) continue;
        if (mkObst.some(q => hit(b, q))) continue;
        mkCands.push({...c, sc: d + a * 0.3});
      }
    }
    mkCands.sort((p1, p2) => p1.sc - p2.sc);
    if (!mkCands.length) mkCands.push({x: endQ.x + (qa && qa.side === 'left' ? TOKEN_R + 44 : -TOKEN_R - 44), y: endQ.y - TOKEN_R - 22, sc: 0});
    let mk = mkCands[0];
    /* --- the return card: the same note, compact, on the full-size context in free space, led to the pawn.
       It carries the context caption, the Δ title, the zone before (struck) → after and the new state. */
    const obst = [];
    stage.tokenBoxes.forEach((tb2, i) => {
      if (i === fi && qa) obst.push(qa.pawnBox, qa.tagBox);
      else if (stage.slots[i]) obst.push(tb2.pawn, tb2.tag);
    });
    stage.board.plaques.forEach(q => obst.push(q.box));
    if (stage.slipSpot && stage.slipDims) obst.push({x: stage.slipSpot.x, y: stage.slipSpot.y, w: stage.slipDims.W, h: stage.slipDims.H});
    // the organiser's plates and books (its wooden rim is not text)
    obst.push(...stage.bookBoxes, ...stage.org.plates, stage.org.box, stage.key.box);
    if (stage.dish.node) obst.push(stage.dish.box);
    if (stage.dish.labelBox) obst.push(stage.dish.labelBox);
    // a leader may pass over the organiser's wooden frame (not text): only texts, pawns and the slip block it
    const leadObst = obst.filter(q => q !== stage.org.box);
    // the card (a few widths) and the Δ spot are chosen together: the card covers nothing, its leader crosses no text
    const rws = shape === 'landscape' ? [356] : shape === 'square' ? [316, 324, 280, 380, 440] : [330, 400];
    const rOpts0 = {t, p, fact, focus, size: rSize, capS: Math.min(capS, stage.keySizeUsed), res, compact: true, capLine: capFit ? `${t.context}: ${p.contextLabels.context}` : null, name: 'noteR'};
    let spot = null, bestS = Infinity;
    const rdist = (b, m) => Math.hypot(Math.max(b.x, Math.min(m.x, b.x + b.w)) - m.x, Math.max(b.y, Math.min(m.y, b.y + b.h)) - m.y);
    for (const rw of rws) {
      const probe = buildNote(ctx, {...rOpts0, box: {x: 0, y: 0, w: rw}, target: {x: 0, y: 0}}).box;
      // free positions, nearest (lower bound of the score) first; the search stops once no position can do better
      const free = [];
      for (let y = 8; y <= st0.h - probe.h - 6; y += 6) {
        for (let x = 8; x <= st0.w - rw - 8; x += 8) {
          const b = {x, y, w: probe.w, h: probe.h};
          if (obst.some(q => hit({x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12}, q))) continue;
          const lb = Math.min(...mkCands.slice(0, 24).map(m => rdist(b, m) + m.sc * 2)) + (hit(b, stage.B.inner) ? 1500 : 0) + (rw === rws[0] ? 0 : 200);
          free.push({x, y, b, lb});
        }
      }
      free.sort((f1, f2) => f1.lb - f2.lb);
      for (const {x, y, b, lb} of free) {
        if (lb >= bestS) break;
        {
          for (const m of mkCands.slice(0, 24)) {
            if (hit({x: m.x - 30, y: m.y - 30, w: 60, h: 60}, {x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12})) continue;
            for (const kind of ['line', 'hv', 'vh']) {
              if (leadCrosses(b, m, leadObst, kind)) continue;
              const pts = leaderPoints(b, m, kind);
              let len = 0;
              for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y);
              // free desk space is preferred to lying on the board's tiles; the first Δ spots and straight leaders too
              const sc = len + (kind === 'line' ? 0 : 60) + (hit(b, stage.B.inner) ? 1500 : 0) + m.sc * 2 + (rw === rws[0] ? 0 : 200);
              if (sc < bestS) { bestS = sc; spot = {x, y, rw, m, kind}; }
            }
          }
        }
      }
      if (spot && bestS < 1500) break;
    }
    if (spot) mk = spot.m;
    const target = {x: mk.x, y: mk.y};
    obst.push({x: mk.x - 30, y: mk.y - 30, w: 60, h: 60});
    // no card position with a straight or elbow leader: the free card spot nearest its Δ, with an orthogonal leader
    // routed round every text (grid search)
    let leadPts = null;
    if (!spot) {
      for (const rw of rws) {
        const probe = buildNote(ctx, {...rOpts0, box: {x: 0, y: 0, w: rw}, target: {x: 0, y: 0}}).box;
        let best = null;
        for (let y = 8; y <= st0.h - probe.h - 6; y += 6) {
          for (let x = 8; x <= st0.w - rw - 8; x += 8) {
            const b = {x, y, w: probe.w, h: probe.h};
            if (obst.some(q => hit({x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12}, q))) continue;
            const m = mkCands[0];
            const d = Math.hypot(Math.max(b.x, Math.min(m.x, b.x + b.w)) - m.x, Math.max(b.y, Math.min(m.y, b.y + b.h)) - m.y);
            if (!best || d < best.d) best = {x, y, d, b};
          }
        }
        if (!best) continue;
        for (const m of mkCands.slice(0, 8)) {
          const path = routeLeader(best.b, m, leadObst, st0);
          if (path) { spot = {x: best.x, y: best.y, rw, m, kind: 'path'}; leadPts = path; mk = m; break; }
        }
        if (spot) break;
      }
      if (spot) { target.x = mk.x; target.y = mk.y; obst[obst.length - 1] = {x: mk.x - 30, y: mk.y - 30, w: 60, h: 60}; }
    }
    const leadKind = spot ? spot.kind : 'line';
    const noteR = buildNote(ctx, {...rOpts0, target, leadKind, leadPts, box: {x: (spot || {x: 8}).x, y: (spot || {y: 8}).y, w: spot ? spot.rw : rws[0]}});
    // clear: the card covers nothing (the organiser's frame included) and its leader crosses no text
    const noteRClear = Boolean(spot) && (leadPts ? true : !leadCrosses(noteR.box, target, leadObst, leadKind));
    const mkClearAll = !mkObst.some(q => hit({x: mk.x - 26, y: mk.y - 26, w: 52, h: 52}, q));
    const marker = changedMarker(ctx, {name: 'ctx-marker', x: mk.x, y: mk.y, radius: 24, opacity: 0});



    if (quick) return {orgOk, pawnsInterior, allPlacedAll, noteRClear};
    /* --- lens copy: an element the window's rim would cut is left out of the copy (whole or nothing) */
    const inside = q => [srcA, srcB].every(S0 => q.x >= S0.x - 0.5 && q.y >= S0.y - 0.5 && q.x + q.w <= S0.x + S0.w + 0.5 && q.y + q.h <= S0.y + S0.h + 0.5);
    const hideInLens = {};
    // whole or nothing: a pawn with its tag, a book, the organiser (compartments, plates and books), a plaque, the slip
    detail.tokenBoxes.forEach((tb, i) => {
      if (i === fi || !detail.slots[i]) return;
      if (!inside(tb.pawn) || !inside(tb.tag)) hideInLens[`dw-tok${i}`] = true;
    });
    const orgWhole = [detail.org.box, ...detail.bookBoxes];
    if (!orgWhole.every(inside)) hideInLens['dw-org'] = true;
    detail.board.plaques.forEach((q, j) => { if (!inside(q.box)) hideInLens[`dw-board-plaque${j}`] = true; });
    if (detail.slipSpot && detail.slipDims && !inside({x: detail.slipSpot.x - 4, y: detail.slipSpot.y - 6, w: detail.slipDims.W + 8, h: detail.slipDims.H + 12})) hideInLens['dw-slip'] = true;
    detail.books.forEach((b, si) => { if (b && (!inside(b.box) || hideInLens['dw-org'])) hideInLens[`dw-book${si}`] = true; });
    if (!inside(detail.key.box)) hideInLens['dw-key'] = true;
    // (only nodes the copy actually draws)
    const drawn = new Set();
    (function walk(n) {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) { n.forEach(walk); return; }
      if (n.attrs && typeof n.attrs.name === 'string') drawn.add(n.attrs.name);
      walk(n.children);
    })(detail.node);
    for (const k of Object.keys(hideInLens)) if (!drawn.has(k)) delete hideInLens[k];

    return {allPlacedAll, pawnsInterior, hideInLens, orgOk, mkClearAll, s0, ox, oy, t, K, C1, capAbove: capO.above, capBox, capCross: crosses(capO), st0, stage, mini, detail, miniNode, detailNode, fi, res, focus, q0, qa, src: src1, srcA, srcB, panning: srcA !== srcB, win1, note, noteBox, noteR, noteRClear, capFit, capH, marker, mk};
  
}

const scene = {
  sizes: {landscape: [STAGE.landscape.w, STAGE.landscape.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.portrait.w, STAGE.portrait.h]},
  layout(ctx) {
    // the first layout that places every pawn wholly inside its zone (before and after) and gives the return card
    // free room: the text first keeps its full size; three zones may be laid out as strips; in 1:1 the organiser is
    // shortened (never below what its books and plates need) and the card's text steps down (never below 16 px)
    // (the search runs quick probes; the chosen arguments are then laid out in full)
    const ok = L => L.orgOk && L.noteRClear && L.allPlacedAll && L.pawnsInterior;
    let fallback = null;
    const full = args => layoutOnce(ctx, ...args);
    for (const fullSize of [true, false]) {
      for (const strips of [false, true]) {
        if (ctx.view.shape !== 'square') {
          const A = [null, 20, strips, fullSize];
          const L = layoutOnce(ctx, ...A, true);
          if (ok(L)) return full(A);
          if (L.allPlacedAll && L.pawnsInterior && !fallback) fallback = A;
          continue;
        }
        // (the organiser stands at the top of the right column, or at its foot so the card can sit above it)
        // (the pawn placement does not depend on the organiser: a combination whose pawns do not fit is skipped)
        const P0 = layoutOnce(ctx, {hier: {h: 424}}, 16, strips, fullSize, true);
        if (!(P0.allPlacedAll && P0.pawnsInterior)) continue;
        for (const [hh, low] of [424, 440, 456, 472, 488].flatMap(v => [[v, false], [v, true]])) {
          for (const rs of [20, 18, 16]) {
            const A = [{hier: low ? {h: hh, y: STAGE.square.h - 14 - hh} : {h: hh}}, rs, strips, fullSize];
            const L = layoutOnce(ctx, ...A, true);
            if (ok(L)) return full(A);
            if (L.orgOk && L.allPlacedAll && L.pawnsInterior && !fallback) fallback = A;
            if (!L.orgOk) break;
          }
        }
      }
    }
    return full(fallback || [null, 16, false, false]);
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {st0} = L;
    const clipId = 'dw-winclip';
    const color = th.accent2;
    return g({transform: T(L.ox, L.oy, 0, L.s0)},
      // context: full-size stage (real text) cross-fading to its greeked copy
      g({name: 'ctx'},
        g({name: 'ctx-full'}, L.stage.node),
        g({name: 'ctx-mini', opacity: 0}, L.miniNode),
        h('path', {name: 'ctx-dim', d: '', 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0}),
        h('path', {name: 'ctx-src', d: roundRectPath(L.src.x, L.src.y, L.src.w, L.src.h, 16), fill: 'none', stroke: color, 'stroke-width': 7, opacity: 0}),
        L.marker,
        L.noteR.node),
      h('path', {name: 'ctx-frame', d: roundRectPath(0, 0, st0.w, st0.h, 30), fill: 'none', stroke: th.ink, 'stroke-width': 3, opacity: 0}),
      L.capFit ? textBlock(L.capFit, {x: 0, y: 0, fill: th.fg, name: 'ctx-cap'}) : null,
      h('line', {name: 'cone-a', stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'cone-b', stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      // detail window: the same stage again, enlarged about its source coordinates
      // an opaque overlay: what lies under it counts as hidden
      g({name: 'win', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: 'win-cliprect', rx: 22}))),
        h('rect', {name: 'win-shadow', rx: 22, fill: th.shadow}),
        h('rect', {name: 'win-bg', rx: 22, fill: th.paper}),
        g({'clip-path': ctx.ref(clipId)}, g({name: 'win-content-op', opacity: 0}, g({name: 'win-content'}, L.detailNode))),
        h('rect', {name: 'win-border', rx: 22, fill: 'none', stroke: color, 'stroke-width': 6})),
      L.note.node,
    );
  },
  frame(ctx, L, u) {
    const {K, st0} = L;
    const nodes = {};
    /* context placement: full → miniature (inspection) → full again (return) */
    const shrink = ease.inOutCubic(seg(u, ...W.shrink));
    const grow = ease.inOutCubic(seg(u, ...W.grow));
    const full = {x: 0, y: 0, k: 1};
    let C = mixC(full, L.C1, shrink);
    if (grow > 0) C = mixC(L.C1, full, grow);
    nodes.ctx = {transform: T(C.x, C.y, 0, C.k)};
    // the full-size context stays solid; its simplified copy fades in on top while it is small (and out again)
    const gk = seg(u, ...W.greek) * (1 - seg(u, ...W.ungreek));
    // (once the simplified copy covers it completely, the full context below it is switched off: never half-faded)
    nodes['ctx-full'] = {opacity: gk >= 1 ? 0 : 1};
    nodes['ctx-mini'] = {opacity: r(gk, 3)};
    nodes['ctx-frame'] = {transform: T(C.x, C.y, 0, C.k), opacity: r(shrink * (1 - grow), 3)};
    const capOp = seg(u, W.shrink[1] - 0.04, W.shrink[1] + 0.02) * (1 - seg(u, ...W.noteOut));
    if (L.capFit) nodes['ctx-cap'] = {transform: L.capAbove ? T(C.x, C.y - L.capH) : T(C.x, C.y + st0.h * C.k + 10), opacity: r(capOp, 3)};
    const dim = seg(u, W.shrink[0] + 0.03, W.open[1]) * (1 - seg(u, ...W.undim));
    // the source region follows the pawn in the window (identical when both places fit one view)
    const S = lerpRect(L.srcA, L.srcB, ease.inOutSine(seg(u, ...W.move)));
    nodes['ctx-dim'] = {d: `M0 0H${st0.w}V${st0.h}H0Z` + `M${r(S.x)} ${r(S.y)}V${r(S.y + S.h)}H${r(S.x + S.w)}V${r(S.y)}Z`, opacity: r(0.4 * dim, 3)};
    const openP = ease.inOutCubic(seg(u, ...W.open));
    const closeP = ease.inOutCubic(seg(u, ...W.close));
    nodes['ctx-src'] = {opacity: openP > 0 && closeP < 1 ? r(1 - seg(u, W.close[1] - 0.02, W.close[1]), 3) : 0, d: roundRectPath(S.x, S.y, S.w, S.h, 16)};

    /* window: grows out of the source (mapped into the miniature) to its place, and closes back into it at the return */
    const srcNow = mapRect(C, S);
    let R = lerpRect(srcNow, L.win1, openP);
    if (closeP > 0) R = lerpRect(L.win1, srcNow, closeP);
    const z = R.w / S.w;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    const winOp = openP > 0 ? seg(u, ...W.cardIn) * (1 - seg(u, ...W.cardOut)) : 0;
    // the copy shows whenever the card is opaque (the card is blank only while it is translucent over its source)
    const copyVis = winOp >= 0.999 ? seg(u, ...W.copyIn) * (1 - seg(u, ...W.copyOut)) : 0;
    nodes.win = {opacity: r(winOp, 3)};
    nodes['win-content-op'] = {opacity: r(copyVis, 3)};
    nodes['win-cliprect'] = rect;
    nodes['win-bg'] = rect;
    nodes['win-border'] = rect;
    nodes['win-shadow'] = {x: r(R.x + 8), y: r(R.y + 12), width: rect.width, height: rect.height};
    nodes['win-content'] = {transform: `${T(R.x - S.x * z, R.y - S.y * z)} scale(${r(z, 4)})`};
    const lineOp = openP > 0.05 ? 1 - seg(u, ...W.lines) : 0;
    const [la, lb] = sightLines(srcNow, R);
    nodes['cone-a'] = {x1: r(la[0].x), y1: r(la[0].y), x2: r(la[1].x), y2: r(la[1].y), opacity: r(lineOp, 3)};
    nodes['cone-b'] = {x1: r(lb[0].x), y1: r(lb[0].y), x2: r(lb[1].x), y2: r(lb[1].y), opacity: r(lineOp, 3)};

    /* the substitution: window first, then the context */
    const all = L.res.facts.map(() => 1);
    const winV = {preplaced: true, tags: all, rings: all, focus: {
      strike: seg(u, ...W.strike), sub: seg(u, ...W.sub),
      tag: 1 - seg(u, ...W.fold) + seg(u, ...W.unfold), move: seg(u, ...W.move), rel: seg(u, ...W.rel)}};
    const ctxV = {preplaced: true, tags: all, rings: all, focus: {
      strike: 0, sub: seg(u, ...W.cSub),
      tag: 1 - seg(u, ...W.cFold) + seg(u, ...W.cUnfold), move: seg(u, ...W.cMove), rel: seg(u, ...W.cRel)}};
    const pd = L.detail.pose(winV);
    const pc = L.stage.pose(ctxV);
    const pm = L.mini.pose(ctxV);
    Object.assign(nodes, pd.nodes, pc.nodes, pm.nodes);
    for (const nm of Object.keys(L.hideInLens)) nodes[nm] = {...(nodes[nm] || {}), opacity: 0};
    const mkP = seg(u, ...W.marker);
    nodes['ctx-marker'] = {opacity: r(mkP, 3)};

    /* notes: the inspection note leaves with the window; the return card stays on the full-size context */
    Object.assign(nodes, L.note.frame({
      show: seg(u, ...W.note) * (1 - seg(u, ...W.noteOut)), strike: seg(u, ...W.strike), after: seg(u, ...W.after), title: 0, state: 0,
    }));
    const nr = seg(u, ...W.noteR);
    Object.assign(nodes, L.noteR.frame({show: nr, strike: nr, after: nr, title: nr, state: nr}));

    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const fw = pd.semantic.focus || {}, fc = pc.semantic.focus || {};
    // where the source region's centre lands in the window vs the pawn's first place (same coordinates)
    const srcC = {x: S.x + S.w / 2, y: S.y + S.h / 2};
    const inWin = {x: R.x - S.x * z + srcC.x * z, y: R.y - S.y * z + srcC.y * z};
    const winRect = {x: R.x, y: R.y, w: R.w, h: R.h};
    const ctxRect = {x: C.x, y: C.y, w: st0.w * C.k, h: st0.h * C.k};
    return {
      nodes,
      semantic: {
        beat,
        contextScale: r(C.k, 3),
        lensOpen: r(openP, 3),
        lensDatum: fw.datum || null,
        contextDatum: fc.datum || null,
        windowPawn: fw.at || null,
        focusHolder: fc.at || null,
        focusRel: fc.relShown || null,
        windowRel: fw.relShown || null,
        focus: fc.pos || null,
        winFocus: fw.pos || null,
        markerShown: r(mkP, 3),
        stateShown: r(nr, 3),
        // review fixes: the context returns to full size with real text; the window closes back into its source
        greeked: r(gk, 3),
        windowShown: r(winOp, 3),
        copyShown: r(copyVis, 3),
        copyOnlyWhenOpaque: copyVis === 0 || winOp >= 0.999,
        contextUpdatedBeforeCardFades: seg(u, ...W.cardOut) === 0 || (fc.datum === 'after'),
        pawnsInterior: L.pawnsInterior,
        returnCardClear: L.noteRClear,
        captionCrossed: Boolean(L.capCross),
        captionShown: r(capOp, 3),
        inspectNoteShown: r(seg(u, ...W.note) * (1 - seg(u, ...W.noteOut)), 3),
        // share of the frame covered by the context and the window (no small thumbnail on a blank frame)
        frameFill: r(Math.min(1, (st0.w * C.k * st0.h * C.k + (winOp > 0.5 ? R.w * R.h : 0)) / (st0.w * st0.h)), 3),
        // while its tag is open, the focus pawn's tag lies inside the region the window shows
        focusTagInWindow: focusTagInside(L, fw, S, u),
        sightLines: r(lineOp, 3),
        zoom: r(z, 3),
        winCentre: {x: r(inWin.x), y: r(inWin.y)},
        winRectCentre: {x: r(R.x + R.w / 2), y: r(R.y + R.h / 2)},
        srcHasPawn: Boolean(fw.pos && S.x <= fw.pos.x - TOKEN_R && S.x + S.w >= fw.pos.x + TOKEN_R && S.y <= fw.pos.y - TOKEN_R && S.y + S.h >= fw.pos.y + TOKEN_R),
        panning: L.panning,
        windowClearOfContext: openP < 1 || closeP > 0 || !hit(winRect, ctxRect),
        noteClear: closeP > 0 || (!hit(L.noteBox, winRect) && !hit(L.noteBox, ctxRect)),
        beforeZone: L.res.facts[L.fi].zone,
        afterZone: L.focus.after,
        afterRel: L.focus.rel,
        beforeRel: L.res.facts[L.fi].rel,
        others: L.res.facts.filter((f, i) => i !== L.fi).map(f => f.rel),
        othersStill: pc.semantic.tokens.every((q, i) => { const q0 = L.stage.slots[i] || L.stage.nests[i]; return i === L.fi || (Math.abs(q.x - q0.x) < 0.01 && Math.abs(q.y - q0.y) < 0.01); }),
        allPlaced: L.res.facts.every((f, i) => f.zone < 0 || Boolean(L.stage.slots[i])),
        afterSlotZone: L.qa ? L.stage.B.zoneAt(L.qa.x, L.qa.y) : -1,
        markerClearOfTag: markerClear(L) && L.mkClearAll,
        allReached: true,
      },
    };
  },
};

/**
 * Orthogonal leader from the edge of box b to the rim of the Δ at m (radius 30), routed on an 8-px grid round every
 * obstacle box (grown 5 px); turns are penalised so the path has few elbows. Returns the simplified points or null.
 */
function routeLeader(b, m, boxes, st0) {
  const C = 8, nx = Math.ceil(st0.w / C), ny = Math.ceil(st0.h / C);
  const blocked = new Uint8Array(nx * ny);
  const grow = 5;
  for (const q of boxes) {
    const x0 = Math.max(0, Math.floor((q.x - grow) / C)), x1 = Math.min(nx - 1, Math.floor((q.x + q.w + grow) / C));
    const y0 = Math.max(0, Math.floor((q.y - grow) / C)), y1 = Math.min(ny - 1, Math.floor((q.y + q.h + grow) / C));
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) blocked[j * nx + i] = 1;
  }
  // the card itself is blocked except its rim cells (the start)
  const cx0 = Math.floor(b.x / C), cx1 = Math.floor((b.x + b.w) / C), cy0 = Math.floor(b.y / C), cy1 = Math.floor((b.y + b.h) / C);
  for (let j = cy0; j <= cy1; j++) for (let i = cx0; i <= cx1; i++) if (i >= 0 && j >= 0 && i < nx && j < ny) blocked[j * nx + i] = 1;
  const goal = (i, j) => { const d = Math.hypot((i + 0.5) * C - m.x, (j + 0.5) * C - m.y); return d >= 26 && d <= 34; };
  // Dijkstra over (cell, direction) with a turn penalty
  const INF = 1e9, dist = new Float64Array(nx * ny * 4).fill(INF), prev = new Int32Array(nx * ny * 4).fill(-1);
  const heap = [];
  const push = (d, k) => { heap.push([d, k]); let c = heap.length - 1; while (c > 0) { const pnt = (c - 1) >> 1; if (heap[pnt][0] <= heap[c][0]) break; [heap[pnt], heap[c]] = [heap[c], heap[pnt]]; c = pnt; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, rr = l + 1; let sm = c; if (l < heap.length && heap[l][0] < heap[sm][0]) sm = l; if (rr < heap.length && heap[rr][0] < heap[sm][0]) sm = rr; if (sm === c) break; [heap[sm], heap[c]] = [heap[c], heap[sm]]; c = sm; } } return top; };
  const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  // start: the free cells just outside the card's rim, heading away from it
  for (let i = cx0; i <= cx1; i++) for (const [j, dd] of [[cy0 - 1, 3], [cy1 + 1, 2]]) if (i >= 0 && i < nx && j >= 0 && j < ny && !blocked[j * nx + i]) { const k = (j * nx + i) * 4 + dd; dist[k] = 0; push(0, k); }
  for (let j = cy0; j <= cy1; j++) for (const [i, dd] of [[cx0 - 1, 1], [cx1 + 1, 0]]) if (i >= 0 && i < nx && j >= 0 && j < ny && !blocked[j * nx + i]) { const k = (j * nx + i) * 4 + dd; dist[k] = 0; push(0, k); }
  let end = -1;
  while (heap.length) {
    const [d, k] = pop();
    if (d > dist[k]) continue;
    const cell = k >> 2, dir = k & 3, i = cell % nx, j = (cell / nx) | 0;
    if (goal(i, j)) { end = k; break; }
    DIR.forEach(([di, dj], nd) => {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= nx || jj >= ny || blocked[jj * nx + ii]) return;
      const kk = (jj * nx + ii) * 4 + nd;
      const dd = d + 1 + (nd === dir ? 0 : 12);
      if (dd < dist[kk]) { dist[kk] = dd; prev[kk] = k; push(dd, kk); }
    });
  }
  if (end < 0) return null;
  const cells = [];
  for (let k = end; k >= 0; k = prev[k]) { const cell = k >> 2; cells.push({x: (cell % nx + 0.5) * C, y: (((cell / nx) | 0) + 0.5) * C}); }
  cells.reverse();
  // the first point sits on the card's rim; keep only the corners
  const f = cells[0];
  const start = {x: Math.max(b.x, Math.min(f.x, b.x + b.w)), y: Math.max(b.y, Math.min(f.y, b.y + b.h))};
  const pts = [start, ...cells];
  const out = [pts[0]];
  for (let k = 1; k < pts.length - 1; k++) {
    const a = out[out.length - 1], c = pts[k + 1], q = pts[k];
    if ((Math.abs(a.x - q.x) < 0.5 && Math.abs(q.x - c.x) < 0.5) || (Math.abs(a.y - q.y) < 0.5 && Math.abs(q.y - c.y) < 0.5)) continue;
    out.push(q);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

/**
 * Leader points from a card box to a target (it stops at the Δ's rim, radius 26): 'line' from the nearest edge point;
 * 'hv' leaves a vertical edge horizontally then turns vertical; 'vh' leaves a horizontal edge vertically then turns.
 */
function leaderPoints(b, tg, kind) {
  const stop = (p0, p1) => { const d = Math.hypot(p1.x - p0.x, p1.y - p0.y); return d <= 26 ? null : {x: p1.x - ((p1.x - p0.x) * 26) / d, y: p1.y - ((p1.y - p0.y) * 26) / d}; };
  if (kind === 'line') {
    const c = {x: Math.max(b.x, Math.min(tg.x, b.x + b.w)), y: Math.max(b.y, Math.min(tg.y, b.y + b.h))};
    const e = stop(c, tg);
    return e ? [c, e] : [c, c];
  }
  if (kind === 'hv') {
    if (tg.x >= b.x && tg.x <= b.x + b.w) return null;
    const y = Math.max(b.y + 12, Math.min(tg.y, b.y + b.h - 12));
    const s0 = {x: tg.x < b.x ? b.x : b.x + b.w, y};
    const c = {x: tg.x, y};
    const e = stop(c, tg);
    return e && Math.abs(c.y - tg.y) > 30 ? [s0, c, e] : null;
  }
  if (tg.y >= b.y && tg.y <= b.y + b.h) return null;
  const x = Math.max(b.x + 12, Math.min(tg.x, b.x + b.w - 12));
  const s0 = {x, y: tg.y < b.y ? b.y : b.y + b.h};
  const c = {x, y: tg.y};
  const e = stop(c, tg);
  return e && Math.abs(c.x - tg.x) > 30 ? [s0, c, e] : null;
}

/** The focus tag (at its before / after side) lies inside the source region S while it is open. */
function focusTagInside(L, fw, S, u) {
  if (!fw.pos) return true;
  const moving = u > W.fold[0] && u < W.unfold[1];
  if (moving) return true;
  const after = u >= W.unfold[1];
  const slot = after ? L.qa : L.stage.slots[L.fi];
  if (!slot) return true;
  const tb = after ? L.qa.tagBox : L.stage.tokenBoxes[L.fi].tag;
  const q = {x: fw.pos.x + tb.x - slot.x, y: fw.pos.y + tb.y - slot.y, w: tb.w, h: tb.h};
  return q.x >= S.x - 1 && q.y >= S.y - 1 && q.x + q.w <= S.x + S.w + 1 && q.y + q.h <= S.y + S.h + 1;
}

/** The Δ marker never covers the pawn or its tag at the new place. */
function markerClear(L) {
  if (!L.qa) return true;
  const mb = {x: L.mk.x - 30, y: L.mk.y - 30, w: 60, h: 60};
  return !hit(mb, L.qa.pawnBox) && !hit(mb, L.qa.tagBox);
}

/**
 * The single editorial note: title (at the return), the fact, the zone
 * supplied before (struck) → after, the new dependent state, the key line.
 */
function buildNote(ctx, o) {
  const th = ctx.theme;
  const {t, p, fact, focus, box, res} = o;
  const N = o.name || 'note';
  const compact = Boolean(o.compact);
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const pad = o.compact ? 10 : 16;
  const w = box.w;
  const inner = w - pad * 2;
  const size = o.size;
  const lab = showKey && !compact ? fitWords(ctx, `${fact.num} · ${fact.label}`, {maxWidth: inner, size, minSize: 16, maxLines: 2, weight: 700}) : null;
  const zb = showKey ? fitWords(ctx, p.beforeValue, {maxWidth: inner - 40, size, minSize: 16, maxLines: 2, weight: 600}) : null;
  const za = showKey ? fitWords(ctx, p.afterValue, {maxWidth: inner - 40, size, minSize: 16, maxLines: 2, weight: 600}) : null;
  const cs = Math.min(o.capS, ...[lab, zb, za].filter(Boolean).map(f => f.size));
  const ttl = showAll ? fitWords(ctx, p.contextLabels.marker, {maxWidth: inner - 40, size: cs, minSize: Math.min(cs, 16), maxLines: 1, weight: 700}) : null;
  const zs = showAll && !compact ? fitWords(ctx, `${t.zoneSupplied}:`, {maxWidth: inner, size: cs, minSize: Math.min(cs, 16), maxLines: 1, weight: 600}) : null;
  const stTxt = `${t.now}: ${focus.rel === 'shared' ? t.shared : focus.rel === 'different' ? t.other : t.offBoard} (${t.asSupplied})`;
  const stF = showAll ? fitWords(ctx, stTxt, {maxWidth: inner - 40, size: cs, minSize: Math.min(cs, 16), maxLines: 2, weight: 600}) : null;
  const cl = compact && o.capLine && showAll ? fitWords(ctx, o.capLine, {maxWidth: inner, size: Math.min(o.capS, size), minSize: 16, maxLines: 3, weight: 600}) : null;
  const keyF = showKey && !compact ? fitWords(ctx, t.keyNote, {maxWidth: inner, size: cs, minSize: Math.min(cs, 16), maxLines: 2, weight: 600}) : null;
  const parts = [];
  const dyn = [];
  let y = box.y + pad;
  const clY = y;
  if (cl) y += cl.height + 8;
  // title row (marker + title), reserved from the start
  const titleY = y;
  y += Math.max(compact ? 32 : 36, ttl ? ttl.height : 0) + (compact ? 4 : 8);
  const labY = y;
  if (!compact) y += (lab ? lab.height : 26) + 10;
  const zsY = y;
  y += (zs ? zs.height : 0) + (zs ? 6 : 0);
  const bY = y;
  const rowH = f => Math.max(30, f ? f.height + 8 : 30);
  y += rowH(zb) + 6;
  const aY = y;
  y += rowH(za) + 10;
  const stY = y;
  y += Math.max(30, stF ? stF.height : 0) + 12;
  const ruleY = y;
  const keyY = y + 10;
  if (!compact) y += 10 + (keyF ? keyF.height : 20) + pad;
  else y += pad - 12;
  const H = y - box.y;
  const zchip = (f, zi, yy, name, extra = []) => {
    const hh = rowH(f);
    return g({name, opacity: 0},
      h('path', {d: roundRectPath(box.x + pad, yy, 26, hh, 6), fill: zi >= 0 ? ZONE_FILL[zi % 3] : '#fff', stroke: zi >= 0 ? ZONE_EDGE[zi % 3] : NEUTRAL, 'stroke-width': 2}),
      f ? textBlock(f, {x: box.x + pad + 38, y: yy + (hh - f.height) / 2, fill: th.ink}) : h('rect', {x: box.x + pad + 38, y: yy + hh / 2 - 5, width: inner * 0.5, height: 10, rx: 5, fill: th.paperLine}),
      ...extra);
  };
  if (o.target) {
    // a dashed leader from the card to the Δ beside the pawn it describes (straight, or an elbow round the texts)
    const pts = o.leadPts || leaderPoints({x: box.x, y: box.y, w, h: H}, o.target, o.leadKind || 'line') || [{x: box.x, y: box.y}, o.target];
    parts.push(h('path', {d: pts.map((q, k) => `${k ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), stroke: th.fgSoft, 'stroke-width': 2.4, 'stroke-dasharray': '7 6', fill: 'none'}));
  }
  parts.push(h('path', {d: roundRectPath(box.x + 5, box.y + 7, w, H, 12), fill: th.shadow}));

  parts.push(h('path', {d: roundRectPath(box.x, box.y, w, H, 12), fill: '#fffdf6', stroke: th.ink, 'stroke-width': 2}));
  if (cl) parts.push(textBlock(cl, {x: box.x + pad, y: clY, fill: th.inkSoft}));
  dyn.push(g({name: `${N}-title`, opacity: 0},
    changedMarker(ctx, {x: box.x + pad + 16, y: titleY + (compact ? 16 : 18), radius: 16}),
    ttl ? textBlock(ttl, {x: box.x + pad + 42, y: titleY + (compact ? 16 : 18) - ttl.height / 2, fill: th.ink}) : null));
  if (lab) parts.push(textBlock(lab, {x: box.x + pad, y: labY, fill: th.ink}));
  else if (!compact) parts.push(h('rect', {x: box.x + pad, y: labY + 6, width: inner * 0.6, height: 12, rx: 6, fill: th.paperLine}));
  if (zs) parts.push(textBlock(zs, {x: box.x + pad, y: zsY, fill: th.inkSoft}));
  const bf = zb;
  dyn.push(zchip(zb, res.facts[fact.i].zone, bY, `${N}-before`,
    // a strike through every line of the old value
    [h('path', {name: `${N}-strike`, d: bf
      ? bf.lines.map((ln, k) => {
        const y0 = bY + (rowH(bf) - bf.height) / 2 + (k + 0.55) * (bf.height / bf.lines.length);
        const lw = ctx.measure ? ctx.measure(ln, bf.size, bf.weight, bf.family) : bf.width;
        return `M${box.x + pad + 34} ${r(y0)}H${r(box.x + pad + 42 + lw)}`;
      }).join('')
      : `M${box.x + pad + 32} ${r(bY + rowH(bf) / 2)}H${r(box.x + pad + 44 + inner * 0.5)}`, stroke: NEUTRAL, 'stroke-width': 3, opacity: 0})]));
  dyn.push(g({name: `${N}-after`, opacity: 0},
    h('path', {d: `M${box.x + pad + 13} ${r(bY + rowH(zb) - 2)}V${r(aY + 6)}m-6 -8l6 8l6 -8`, fill: 'none', stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'})));
  dyn.push(zchip(za, focus.after, aY, `${N}-after-row`));
  const glyph = focus.rel === 'shared'
    ? h('circle', {cx: box.x + pad + 13, cy: stY + 15, r: 12, fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 4})
    : h('circle', {cx: box.x + pad + 13, cy: stY + 15, r: 12, fill: 'none', stroke: NEUTRAL, 'stroke-width': 3, 'stroke-dasharray': '5 4'});
  dyn.push(g({name: `${N}-state`, opacity: 0}, glyph, stF ? textBlock(stF, {x: box.x + pad + 38, y: stY + Math.max(0, (30 - stF.height) / 2), fill: th.ink}) : null));
  if (!compact) parts.push(h('path', {d: `M${box.x + pad} ${r(ruleY)}H${box.x + w - pad}`, stroke: th.paperLine, 'stroke-width': 2}));
  if (keyF) parts.push(textBlock(keyF, {x: box.x + pad, y: keyY, fill: th.ink, italic: true}));
  const node = g({name: N, opacity: 0}, parts, dyn);
  const frame = v => ({
    [N]: {opacity: r(v.show, 3)},
    [`${N}-title`]: {opacity: r(v.title, 3)},
    [`${N}-before`]: {opacity: r(v.show, 3)},
    [`${N}-strike`]: {opacity: r(v.strike, 3)},
    [`${N}-after`]: {opacity: r(v.after, 3)},
    [`${N}-after-row`]: {opacity: r(v.after, 3)},
    [`${N}-state`]: {opacity: r(v.state, 3)},
  });
  return {node, frame, box: {x: box.x, y: box.y, w, h: H}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-06-inspect',
    title: 'Territorial scope — inspecting the zone supplied for one fact',
    titleEs: 'Ámbito territorial — Inspección y cambio de un dato',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Ámbito territorial',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The placed state (text slip and sheet on its zone, fact pawns on the zones supplied for them) shrinks into a context miniature; a detail window grows out of one pawn and the boundary beside it (a real enlarged copy at the same coordinates). The zone supplied for that fact is replaced by the alternative datum: the old value is struck, the pawn crosses to a tile of the new zone and its ring follows the supplied placement. Back in context only that pawn moves and a Δ marker stays; seeking back restores the old datum. No conclusion is drawn.',
    tags: ['territorial scope', 'zones', 'inspect', 'detail window', 'substitution', 'changed datum', 'board', 'fact pawn'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/ambito-territorial.js', 'src/animations/sources/kits/ambito-material.js', 'src/primitives/markers.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
