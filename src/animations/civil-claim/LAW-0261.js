/**
 * LAW-0261 — Reconvención ilustrativa · story
 *
 * Storyboard (side view of a filing counter: Party A at its left end, Party B at its right end, a flat tray in front of
 * each; in the middle the case file stands open as a rack with two sleeves — the left one, open towards Party A, holds
 * the initial claim (● header); the right one, open towards Party B, is empty; the calendar hangs on the wall above the
 * left lane; the action clock c runs from u = 0.15 to u = 0.80):
 *  0.00–0.15  rest: the initial claim in its sleeve, its lane marked as travelled (dotted, its colour); Party B's
 *             additional claim (◆ header) stands at the far end of the right lane; names, the claim key and the
 *             "as supplied · no conclusion drawn" key.
 *  0.15–0.42  Party B's hand reaches the additional claim and pushes it leftwards along the track — the opposite
 *             direction to the initial claim's lane — as far as the reach allows (hand on the sheet's edge throughout).
 *  0.42–0.73  Party B lets go; the additional claim glides on into the right sleeve; the hand returns to rest. The
 *             initial claim never moves and is never covered: both claims stand side by side, equal weight.
 *  0.73–1.00  hold: the calendar marks the supplied day, the "both claims kept in the case file" tag, the callout.
 * finalState "held" (as supplied): the hand rests on the additional claim; it stays at the lane's end; nothing marked.
 * No rule for an additional claim (admissibility, connection, set-off, time limits) and no effect is shown.
 * @module animations/civil-claim/LAW-0261
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {
  RI_DEFAULTS, RI_DEFAULTS_ES, RI_COMMON_ES, RI_STRINGS, partiesField, documentsField, datesField, stagesField, labelProps,
  partyCaption, looksOf, gchip, keyChip, hit, placeTag, solveStage, placeStage, counterStage, choreo, claimKeyText, localizeDefaults, glue,
} from './kits/reconvencion-ilustrativa.js';

const ID = 'LAW-0261';
const DURATION = 6000;
const C0 = 0.15, C1 = 0.8;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const TAG = [0.9, 0.97];
const NOTES = [0.8, 0.86];
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
const S_MIN = {landscape: 0.3, square: 0.3, portrait: 0.3};
const TARGETS = ['caseFile', 'initialClaim', 'additionalClaim', 'calendar'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  actorLabels: obj('Chip captions under each party (empty = "name · role")', {a: str('Caption for Party A (initial claim)', 60), b: str('Caption for Party B (additional claim)', 60)}),
  objectLabels: obj('Labels printed on the props', labelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('Where the additional claim ends (as supplied; descriptive only — no effect is inferred)', ['filed', 'held']),
};

const defaultParams = {
  parties: RI_DEFAULTS.parties,
  documents: RI_DEFAULTS.documents,
  stages: RI_DEFAULTS.stages,
  dates: RI_DEFAULTS.dates,
  actorLabels: {a: '', b: ''},
  objectLabels: RI_DEFAULTS.labels,
  actionProgress: 1,
  annotations: [{target: 'caseFile', text: 'The additional claim joins the file; the initial claim stays'}],
  finalState: 'filed',
};
/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...RI_COMMON_ES,
  objectLabels: RI_DEFAULTS_ES.labels,
  annotations: [{target: 'caseFile', text: 'La pretensión adicional se suma al expediente; la inicial permanece'}],
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    const shape = ctx.view.shape;
    const ok = L => L.fitted && !L.truncated.length && L.m >= 1;
    // (the printed stage first, with wider or narrower sheets; the larger people win)
    // (score: the claims' glyphs — the one difference the action makes — as large as possible, up to ~36 px, with the
    // people at least 120 px tall; then the larger people)
    // (score: the people's heads at the story floor (52 px, with a margin) first; then the claims' glyphs — the one
    // difference the action makes — as large as possible, up to GLYPH_CAP; then the larger heads)
    const score = L => (!ok(L) ? -1 : L.headPx >= HEAD_MIN ? 1000 + Math.min(L.glyphPx, GLYPH_CAP[shape]) * 10 + L.headPx : L.headPx);
    const best = Ls => Ls.reduce((a, b) => (score(b) > score(a) ? b : a));
    const tall = shape !== 'landscape';
    const PKS = PKS_BY[shape];
    // (labels hidden: the compact props may print larger sheets — their glyphs stay legible beside larger people)
    const L0 = best([7, 9, 12].flatMap(k => PKS.flatMap(pk => (ctx.show('all') ? [20] : [40, 20]).map(cTs => compose(ctx, false, k, null, pk, cTs)))));
    if (ok(L0) && !tall && L0.headPx >= HEAD_MIN) return L0;
    // (the text column is a fallback: compact props, the texts beside the scene — under it on tall frames)
    const Lcs = [];
    for (const colK of tall ? [null] : [0.26, 0.32]) for (const pk of PKS) for (const cTs of [40, 20]) Lcs.push(compose(ctx, true, 9, colK, pk, cTs));
    let Lc = best(Lcs);
    // (tall and square frames: when no column layout keeps the heads at the floor — long supplied texts — the column's
    // text, the keys and the name chips step down towards the 16.4 px floor)
    if (tall && score(Lc) < 1000) {
      const Lds = [];
      for (const pk of PKS) for (const cTs of [40, 20]) Lds.push(compose(ctx, true, 9, null, pk, cTs, 0.76));
      const Ld = best(Lds);
      if (score(Ld) > score(Lc)) Lc = Ld;
    }
    if (!ok(L0)) return ok(Lc) ? Lc : L0;
    return score(Lc) > score(L0) * 1.1 ? Lc : L0;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** people scales tried (larger people first matter: the story floor is on the head) */
const PKS_BY = {landscape: [3, 2.2, 1.6, 1.3, 1], square: [2.6, 2.2, 1.9, 1.6, 1.3], portrait: [4, 3.5, 3, 2.2, 1.6, 1]};
/** the story head floor (52 px) with a margin */
const HEAD_MIN = 53.5;
const HEAD_K = 0.86;
/** glyph size (px) beyond which larger people win: tall frames favour the people (the frame fills) */
const GLYPH_CAP = {landscape: 24, square: 20, portrait: 16};

function compose(ctx, col, lwK, colK, peopleK = 1, compactTs = 20, fMin = 1) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf(ctx, p);
  const sp = {...p, labels: p.objectLabels};
  const small = B * 0.96;
  const held = p.finalState === 'held';
  const stacked = col && shape !== 'landscape';
  const colW = stacked ? D.w - 16 : col ? Math.round(D.w * colK) : 0;
  const colX = stacked ? 8 : D.w - 8 - colW;
  const bandW = D.w - 16 - (col && !stacked ? colW + 20 : 0);
  const colTexts = col && showAll ? [
    `● ${p.documents.initialClaim.title}: ${p.documents.initialClaim.summary}`,
    `◆ ${p.documents.additionalClaim.title}: ${p.documents.additionalClaim.summary}`,
    `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`,
    `${p.objectLabels.trayA}  ·  ${p.objectLabels.trayB}`,
    `${p.objectLabels.calendar}: ${p.dates.window.join(' · ')}`,
    // (with the column, the "both claims kept" caption is its last item, shown at the hold)
    ...(p.finalState === 'held' ? [] : [p.stages.both]),
  ] : [];
  // ---- top band and column at text step f (the keys and callouts step with the column)
  let key, stKey, notes, bandY, keyBandY, colChips, colY;
  for (const f of [1, 0.92, 0.84, 0.76].filter(f2 => f2 === 1 || (col && small * f2 * pxPer >= 16.4))) {
    const keySize = Math.max(small * f, 16.2 / pxPer);
    key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
    stKey = showKey ? gchip(ctx, claimKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'claim-key'}) : null;
    bandY = 8 + Math.max(key ? key.box.h : 0, stKey ? stKey.box.h : 0) + (showKey ? 10 : 0);
    keyBandY = bandY;
    notes = [];
    if (showAll) {
      for (const [i, a] of p.annotations.entries()) {
        const c = gchip(ctx, `${i + 1}  ${a.text}`, {x: 8, y: bandY, anchor: 'start', maxWidth: bandW, size: small * f, minSize: small * f, maxLines: 4, fill: th.card, stroke: th.ink, color: th.ink, weight: 600, name: `note${i}-chip`});
        notes.push({i, a, c});
        bandY = c.box.y + c.box.h + 8;
      }
    }
    colChips = [];
    colY = stacked ? bandY : keyBandY;
    // (stacked under/over the scene the texts flow in rows across the width; beside it they stack)
    let cx = colX, rowH = 0;
    for (const [i, t] of colTexts.entries()) {
      const pr = gchip(ctx, t, {x: 0, y: 0, anchor: 'start', maxWidth: colW, size: small * f, minSize: small * f, maxLines: 8});
      if (!stacked || (cx > colX && cx + pr.box.w > colX + colW)) { if (i) { colY += rowH + 6; } cx = colX; rowH = 0; }
      const c = gchip(ctx, t, {x: cx, y: colY, anchor: 'start', maxWidth: colW, size: small * f, minSize: small * f, maxLines: 8, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600, name: `coltx${i}`});
      colChips.push(c);
      cx += c.box.w + 8;
      rowH = Math.max(rowH, c.box.h);
    }
    colY += rowH + (colTexts.length ? 6 : 0);
    // (stacked: the column's text steps down only to fMin — when the people would otherwise fall under their floor)
    if (stacked ? f <= fMin + 1e-9 : colY <= D.h - 8) break;
  }
  const colReserve = stacked ? colY - bandY + 6 : 0;
  const colFits = colY <= D.h - 8;
  // ---- name chips band
  const capOf = i => (i === 0 ? p.actorLabels.a : p.actorLabels.b) || partyCaption(p, i);
  const availW0 = D.w - 16 - (col && !stacked ? colW + 20 : 0);
  const longWord = Math.max(...[0, 1].flatMap(i => glue(capOf(i)).split(' ')).map(w => ctx.measure(w.replace(/ /g, ' '), small, 600, 'sans')));
  const chipMax = Math.min(availW0 * 0.5, Math.max(availW0 * 0.42, longWord + small * 1.6));
  const probe = showKey ? [0, 1].map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 8})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 14 : 6;
  const top0 = bandY + colReserve;
  // (tall frames: the wall ends just past the people — a narrower room, so the people are larger)
  const tightX = shape === 'portrait' ? -Math.round(46 * 1.3 * peopleK) : 0;
  const sol = solveStage(ctx, {B, availW: availW0, availH: D.h - top0 - chipBand - 8, sMin: S_MIN[shape], fillH: true, scMin: col || !showAll ? 0.1 : 0.2,
    opts: {prefix: 'st', p: sp, looks, showText: showAll, compact: col || !showAll, lwK: col || !showAll ? (shape === 'landscape' ? lwK : 6) : lwK, stackedRack: shape !== 'landscape', near: shape !== 'landscape', wallExtraL: tightX, wallExtraX: tightX, peopleK, compactTs}});
  let stage = sol.stage;
  const s = sol.s;
  const PL = placeStage(sol, {x0: 8, top0, availW: availW0, bottom: D.h - 4, chipBand});
  {
    // (the room's wall runs to the box's sides: no bare margins beside a narrow stage)
    const E0 = stage.ext;
    const left = PL.ox + E0.x * s - 8, right = 8 + availW0 - (PL.ox + (E0.x + E0.w) * s);
    if (left > 2 || right > 2) stage = counterStage(ctx, {prefix: 'st', p: sp, looks, showText: showAll, compact: col || !showAll, lwK: col || !showAll ? (shape === 'landscape' ? lwK : 6) : lwK, stackedRack: shape !== 'landscape', near: shape !== 'landscape', peopleK, compactTs, ts: sol.ts, wallExtra: stage.wallExtra ?? 0, wallExtraL: tightX + Math.max(0, Math.round(left / s)), wallExtraX: tightX + Math.max(0, Math.round(right / s))});
  }
  const bx = PL.boxes, G = stage.G, M = PL.M;
  const occupied = [bx.personA, bx.personB, bx.rack, bx.cal, ...bx.trays, bx.sheetStart, bx.sheetEnd, bx.counter];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  notes.forEach(n => occupied.push(n.c.box));
  occupied.push(...colChips.map(c => c.box));
  // ---- name chips under each party
  const chips = [];
  if (showKey) {
    const xs = [M({x: G.xA, y: 0}).x, M({x: G.xB, y: 0}).x];
    // (each chip under its party; two wide chips are pushed apart, each to its own half)
    const ws = probe.map(c => c.box.w);
    const cxs = [0, 1].map(i => clamp(xs[i], 8 + ws[i] / 2, 8 + availW0 - ws[i] / 2));
    if (cxs[0] + ws[0] / 2 + 8 > cxs[1] - ws[1] / 2) { cxs[0] = 8 + ws[0] / 2; cxs[1] = 8 + availW0 - ws[1] / 2; }
    [0, 1].forEach(i => {
      const cx = cxs[i];
      const c = gchip(ctx, capOf(i), {x: cx, y: PL.floor + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 8, name: `chip-${i ? 'b' : 'a'}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  // ---- the "both claims kept" tag beside the case file
  const tags = {};
  if (showKey && !held && !col) {
    const rk = bx.rack;
    const anchors = [{x: rk.x + rk.w / 2, y: rk.y - 4}, {x: rk.x + 4, y: rk.y + 4}, {x: rk.x + rk.w - 4, y: rk.y + 4}, {x: rk.x + rk.w + 4, y: rk.y + rk.h / 2}, {x: rk.x - 4, y: rk.y + rk.h / 2}, {x: rk.x + rk.w / 2, y: rk.y + rk.h * 0.25}];
    const occT = [...occupied, bx.headA, bx.headB];
    let t = null;
    for (const anchor of anchors) {
      const c2 = placeTag(ctx, {name: 'tag-both', text: p.stages.both, anchor, occupied: occT, bounds: {x: 6, y: 6, w: D.w - 12, h: D.h - 12}, maxWidth: Math.min(460, D.w * 0.45), size: small, color: th.inkSoft, maxLead: 38 / pxPer, narrow: true});
      if (!t || (c2.clear && !t.clear)) t = c2;
      if (c2.clear) break;
    }
    occupied.push(t.box);
    tags['tag-both'] = t;
  }
  // ---- callout markers beside their targets
  const markR = small * 0.62;
  const targetBox = {caseFile: bx.rack, initialClaim: bx.sheetI, additionalClaim: held ? bx.sheetStart : bx.sheetEnd, calendar: bx.cal};
  const labelish = [...chips.map(c => c.box), ...Object.values(tags).map(t => t.box), ...colChips.map(c => c.box), ...notes.map(n => n.c.box)];
  const marks = notes.map(n => {
    const b = targetBox[n.a.target];
    const spots = [[b.x - markR - 4, b.y + markR], [b.x + markR, b.y - markR - 4], [b.x + b.w / 2, b.y - markR - 4], [b.x + b.w + markR + 4, b.y + markR], [b.x - markR - 4, b.y + b.h / 2]];
    const cost = ([x2, y2]) => { const mb = {x: x2 - markR, y: y2 - markR, w: 2 * markR, h: 2 * markR}; return occupied.filter(z => hit(mb, z, 2)).length + labelish.filter(z => hit(mb, z, 2)).length + (mb.x < 4 || mb.y < 4 || mb.x + mb.w > D.w - 4 || mb.y + mb.h > D.h - 4 ? 9 : 0); };
    const [x, y] = spots.reduce((a2, b2) => (cost(b2) < cost(a2) ? b2 : a2));
    occupied.push({x: x - markR, y: y - markR, w: 2 * markR, h: 2 * markR});
    return {x, y};
  });
  const labelBoxes = [...chips.map(c => c.box), ...Object.values(tags).map(t => t.box), key && key.box, stKey && stKey.box, ...notes.map(n => n.c.box), ...colChips.map(c => c.box)].filter(Boolean);
  const truncated = [...stage.fits, ...colChips.map(c => c.fit), ...chips.map(c => c.fit), key && key.fit, stKey && stKey.fit, ...Object.values(tags).map(t => t.fit), ...notes.map(n => n.c.fit)].filter(f => f && f.truncated).map(f => f.full);
  const faces = [bx.headA, bx.headB];
  const figPx = Math.min(bx.personA.h, bx.personB.h) * pxPer;
  // (the rendered head: ~0.86 of the head box's width)
  const headPx = Math.min(bx.headA.w, bx.headB.w) * HEAD_K * pxPer;
  const glyphPx = (col || !showAll ? 1.32 : 1) * G.ts * s * pxPer;
  return {pk: peopleK, headPx, glyphPx, PL, col, stacked, colChips, chips, key, stKey, notes, marks, markR, tags, stage, s, m: sol.m, labelBoxes, truncated, faces, figPx, small, held,
    fitted: sol.fitted && colFits, labelsClear: labelBoxes.every((b2, i) => labelBoxes.every((c, j) => i === j || !hit(b2, c, 1))), textPx: r(G.ts * s, 2)};
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  return g(null,
    g({transform: `${T(L.PL.ox, L.PL.oy)} scale(${r(L.s, 5)})`}, L.stage.node),
    L.chips.map(c => c.node),
    Object.values(L.tags).map(t => t.node),
    L.notes.map((n, k) => g({name: `note${n.i}`, opacity: 0},
      n.c.node,
      h('circle', {cx: r(L.marks[k].x), cy: r(L.marks[k].y), r: r(L.markR), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      h('text', {x: r(L.marks[k].x), y: r(L.marks[k].y + L.small * 0.34), 'text-anchor': 'middle', 'font-size': r(L.small), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(n.i + 1)))),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
    L.colChips.map((c, i) => (L.col && !L.held && i === L.colChips.length - 1 ? g({name: 'tag-both'}, c.node) : c.node)),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const cRaw = (u - C0) / (C1 - C0);
  const c = clamp(cRaw, 0, p.actionProgress);
  const G = L.stage.G;
  const v = choreo(c, G, {held: L.held});
  const posed = L.stage.pose(v);
  const nodes = posed.nodes;
  const done = p.actionProgress >= 1;
  const tagP = done && !L.held ? seg(c, ...TAG) : 0;
  if (L.tags['tag-both'] || (L.col && !L.held && L.colChips.length)) nodes['tag-both'] = {opacity: r(tagP, 3)};
  const noteP = done ? seg(u, ...NOTES) : 0;
  L.notes.forEach(n => { nodes[`note${n.i}`] = {opacity: r(noteP, 3)}; });
  const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
  const S = L.s;
  const W2 = q => (q ? {x: r(L.PL.ox + q.x * S), y: r(L.PL.oy + q.y * S)} : null);
  const sem = posed.semantic;
  const sheetLeft = G.startA.x - v.sheetD;
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), phase: v.phase, finalState: p.finalState, pushed: v.pushed, slotted: v.slotted,
      // where the two claims are (stage units): the initial claim never moves; the additional one travels leftwards
      initialX: r(G.slotL.x, 2), additionalX: r(sheetLeft, 2), additionalTravel: r(v.sheetD, 2), travelDir: v.sheetD > 0 ? -1 : 0,
      // the two sheets never overlap (the initial claim is never covered)
      overlap: r(Math.max(0, Math.min(G.slotL.x + G.SW, sheetLeft + G.SW) - Math.max(G.slotL.x, sheetLeft)) * (Math.min(G.slotL.y, G.CT) - Math.max(G.slotL.y - G.sheetH, G.CT - G.sheetH) > 1 ? 1 : 0), 2),
      hand: W2(sem.hand), grip: W2(sem.grip), sheetGrip: v.phase === 'push' || v.phase === 'hold' ? W2({x: sheetLeft + G.SW, y: G.gripY}) : null,
      markP: sem.markP, tags: {both: r(tagP, 3)}, notes: r(noteP, 3), allReached: sem.allReached,
      actionCapped: p.actionProgress < 1 && cRaw > p.actionProgress,
      textColumn: Boolean(L.col), labelsClear: L.labelsClear, truncated: L.truncated, textPx: L.textPx, scale: r(L.s, 3), textMul: r(L.m, 2), figPx: r(L.figPx, 1), headPx: r(L.headPx, 1), peopleK: L.pk, glyphPx: r(L.glyphPx, 1),
      faces: L.faces.map(b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)})),
      labelsOffFaces: L.labelBoxes.every(b => L.faces.every(f => !hit(b, f, 0))),
    },
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-06-story',
    title: 'Illustrative counterclaim — an additional claim travels the opposite way into the case file without displacing the initial one',
    titleEs: 'Reconvención ilustrativa — Microescena con objetos y actores',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Reconvención ilustrativa',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of a filing counter. The case file stands open in the middle as a rack with two sleeves: the left one holds Party A’s initial claim (● header). Party B pushes the additional claim (◆ header) along the counter from the other end — the opposite direction — and it glides into the right sleeve. The initial claim never moves and is never covered: both claims stand side by side with equal weight, and the calendar marks the supplied day. No rule for an additional claim (admissibility, connection, set-off, time limits) and no effect is shown.',
    tags: ['additional claim', 'initial claim', 'case file', 'counter', 'opposite direction', 'calendar', 'trays', 'both claims kept'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: RI_STRINGS,
  scene,
});
