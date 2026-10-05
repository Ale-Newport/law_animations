/**
 * LAW-0273 — Intervención de tercero · story
 *
 * Storyboard (side view of an open room: Party C — the newcomer, a fictional third party — at the left beside her tray
 * (bandeja), which holds her card, the request to intervene as supplied, with a push bar behind it; in the middle the
 * case file stands open on an easel: it represents the procedural relation, with Party A's and Party B's cards in their
 * slots and a third, empty slot level with Party C's tray; the calendar hangs on the wall right of the easel; Party A and
 * Party B stand at the right; the action clock c runs from u = 0.15 to u = 0.80):
 *  0.00–0.15  rest: the represented relation as it initially is — Party A's and Party B's cards inside one frame and one
 *             spine (● initial relation, named on the plate); Party C's card in her tray; names, the configuration key
 *             and the "as supplied · no conclusion drawn" key.
 *  0.15–0.42  Party C's hand reaches the push bar and pushes her card rightwards out of the tray (hand on the bar's grip
 *             throughout), as far as the tray allows.
 *  0.42–0.73  Party C lets go at the tray's end; the card glides on into the empty slot of the case file. Every card keeps
 *             its own label; the newcomer's card is drawn exactly like the others.
 *  0.73–1.00  hold: the supplied configuration of the relation now shown — "intervention requested" (◆): one frame and
 *             one spine round all three cards — and its caption on the plate; the calendar marks the supplied day; the
 *             callout. The request is shown only as supplied: nothing shows it granted or refused.
 * Both configurations are supplied values drawn with equal weight; nothing shows a standing or interest test, a type of
 * intervention, an admission or refusal, an effect or an outcome.
 * @module animations/civil-claim/LAW-0273
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf, annotation} from '../../schemas/fields.js';
import {
  IT_DEFAULTS, IT_DEFAULTS_ES, IT_COMMON_ES, IT_STRINGS, partiesField, documentsField, datesField, stagesField, labelProps,
  partyCaption, looksOf3, gchip, keyChip, hit, solveStage, placeStage, deskStage, choreo, configKeyText, localizeDefaults, glue, cardTexts,
} from './kits/intervencion-tercero.js';

const ID = 'LAW-0273';
const DURATION = 6000;
const C0 = 0.15, C1 = 0.8;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** the configuration of the relation (u): the initial marks go, then the requested ones come — once the card is in its
 * slot (the glide ends at u = 0.67) */
const CONFIG_OUT = [0.672, 0.705], CONFIG_IN = [0.71, 0.76];
const NOTES = [0.8, 0.86];
const SIZE = {landscape: 25.5, portrait: 22, square: 30.5};
const S_MIN = {landscape: 0.3, square: 0.3, portrait: 0.3};
const TARGETS = ['caseFile', 'cards', 'trays', 'calendar'];

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  actorLabels: obj('Chip captions under each party (empty = "name · role")', {a: str('Caption for Party A', 60), b: str('Caption for Party B', 60), c: str('Caption for Party C (the newcomer)', 60)}),
  objectLabels: obj('Labels printed on the props', labelProps),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('Configuration of the represented relation at the hold (as supplied; descriptive only — nothing is inferred from it): "requested" (Party C\'s card is brought into the empty slot and one frame round all three cards is drawn, ◆ intervention requested) or "initial" (Party C\'s card stays in her tray and the initial relation stays drawn, ●). The request is never shown as granted or refused', ['requested', 'initial']),
};

const defaultParams = {
  parties: IT_DEFAULTS.parties,
  documents: IT_DEFAULTS.documents,
  stages: IT_DEFAULTS.stages,
  dates: IT_DEFAULTS.dates,
  actorLabels: {a: '', b: '', c: ''},
  objectLabels: IT_DEFAULTS.labels,
  actionProgress: 1,
  annotations: [{target: 'cards', text: 'Party C’s card is added as a request (as supplied)'}],
  finalState: 'requested',
};
/** Spanish counterparts of the English defaults (applied with locale "es" to values left at their default). */
const DEFAULTS_ES = {
  ...IT_COMMON_ES,
  objectLabels: IT_DEFAULTS_ES.labels,
  annotations: [{target: 'cards', text: 'La tarjeta de la Parte C se añade como solicitud (aportada)'}],
};

/**
 * The default callout follows finalState: it says the card "is added as a request" only when the card is brought into
 * the slot; with finalState "initial" the default callout says, neutrally, that the card stays in her tray. A supplied
 * (non-default) callout is shown as supplied.
 */
const NOTE_BY_STATE = {
  requested: {en: defaultParams.annotations[0].text, es: DEFAULTS_ES.annotations[0].text},
  initial: {en: 'Party C’s card stays in her tray (as supplied)', es: 'La tarjeta de la Parte C sigue en su bandeja (aportada)'},
};
function stateNotes(p) {
  const st = p.finalState === 'initial' ? 'initial' : 'requested';
  return p.annotations.map(a => {
    for (const lang of ['en', 'es']) if (a.text === NOTE_BY_STATE.requested[lang] || a.text === NOTE_BY_STATE.initial[lang]) return {...a, text: NOTE_BY_STATE[st][lang]};
    return a;
  });
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    ctx.params = {...ctx.params, annotations: stateNotes(ctx.params)};
    const shape = ctx.view.shape;
    const ok = L => L.fitted && !L.truncated.length && L.m >= 1;
    // (score: the people's heads at the story floor (52 px, with a margin) first; then the folders' text as large as
    // possible, up to GLYPH_CAP; then the larger heads)
    const score = L => (!ok(L) ? -1 : L.headPx >= HEAD_MIN ? 1000 + Math.min(L.glyphPx, GLYPH_CAP[shape] + (ctx.show('all') ? 0 : 6)) * 10 + L.headPx : L.headPx);
    const best = Ls => Ls.reduce((a, b) => (score(b) > score(a) ? b : a));
    const tall = shape !== 'landscape';
    const PKS = PKS_BY[shape];
    const L0 = best([7, 9, 12].flatMap(k => PKS.flatMap(pk => (ctx.show('all') ? [20] : [40, 20]).map(cTs => compose(ctx, false, k, null, pk, cTs)))));
    if (ok(L0) && !tall && L0.headPx >= HEAD_MIN) return L0;
    // (the text column is a fallback: compact props, the texts beside the scene — under it on tall frames)
    const Lcs = [];
    for (const colK of tall ? [null] : [0.26, 0.32]) for (const pk of PKS) for (const cTs of [40, 20]) Lcs.push(compose(ctx, true, 9, colK, pk, cTs));
    let Lc = best(Lcs);
    if (tall && score(Lc) < 1000) {
      const Lds = [];
      for (const pk of PKS) for (const cTs of [40, 20]) Lds.push(compose(ctx, true, 9, null, pk, cTs, 0.76));
      const Ld = best(Lds);
      if (score(Ld) > score(Lc)) Lc = Ld;
    }
    if (!ok(L0)) return ok(Lc) ? Lc : L0;
    return score(Lc) > score(L0) * (tall ? 1 : 1.1) ? Lc : L0;
  },
  build(ctx, L) { return buildScene(ctx, L); },
  frame(ctx, L, u) { return frameScene(ctx, L, u); },
};

/** people scales tried (larger people first matter: the story floor is on the head) */
const PKS_BY = {landscape: [3, 2.2, 1.6, 1.3, 1], square: [2.6, 2.2, 1.9, 1.6, 1.3], portrait: [4, 3.5, 3, 2.2, 1.6, 1]};
/** the story head floor (52 px) with a margin */
const HEAD_MIN = 53.5;
const HEAD_K = 0.86;
/** folder text size (px) beyond which larger people win */
const GLYPH_CAP = {landscape: 24, square: 20, portrait: 22};

function compose(ctx, col, lwK, colK, peopleK = 1, compactTs = 20, fMin = 1) {
  const p = ctx.params;
  const th = ctx.theme;
  const shape = ctx.view.shape;
  const D = ctx.design;
  const B = SIZE[shape];
  const pxPer = Math.min(ctx.view.content.w / D.w, ctx.view.content.h / D.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const looks = looksOf3(ctx, p);
  const sp = {...p, labels: p.objectLabels};
  const small = B * 0.96;
  const stacked = col && shape !== 'landscape';
  const colW = stacked ? D.w - 16 : col ? Math.round(D.w * colK) : 0;
  const colX = stacked ? 8 : D.w - 8 - colW;
  const bandW = D.w - 16 - (col && !stacked ? colW + 20 : 0);
  const colTexts = col && showAll ? [
    `${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`,
    ...cardTexts(p),
    p.objectLabels.trays,
    `${p.objectLabels.calendar}: ${p.dates.window.join(' · ')}`,
  ] : [];
  // ---- top band and column at text step f (the keys and callouts step with the column)
  let key, stKey, notes, bandY, keyBandY, colChips, colY;
  for (const f of [1, 0.92, 0.84, 0.76].filter(f2 => f2 === 1 || (col && small * f2 * pxPer >= 16.4))) {
    const keySize = Math.max(small * f, 16.2 / pxPer);
    key = showKey ? keyChip(ctx, {x: D.w - 8, y: 8, anchor: 'end', maxWidth: D.w * 0.42, size: keySize}) : null;
    stKey = showKey ? gchip(ctx, configKeyText(p), {x: 8, y: 8, anchor: 'start', maxWidth: D.w - 32 - (key ? key.box.w : 0), size: keySize, minSize: keySize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 700, name: 'claim-key'}) : null;
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
    if (stacked ? f <= fMin + 1e-9 : colY <= D.h - 8) break;
  }
  const colReserve = stacked ? colY - bandY + 6 : 0;
  const colFits = colY <= D.h - 8;
  // ---- name chips band
  const capOf = i => [p.actorLabels.a, p.actorLabels.b, p.actorLabels.c][i] || partyCaption(p, i);
  const availW0 = D.w - 16 - (col && !stacked ? colW + 20 : 0);
  const longWord = Math.max(...[0, 1, 2].flatMap(i => glue(capOf(i)).split(' ')).map(w => ctx.measure(w.replace(/ /g, ' '), small, 600, 'sans')));
  // (three name chips share the band under the floor: each at most a third of it, never narrower than its longest word)
  const chipMax = Math.max((availW0 - 20) / 3, longWord + small * 1.6);
  const probe = showKey ? [0, 1, 2].map(i => gchip(ctx, capOf(i), {x: 0, y: 0, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 8})) : [];
  const chipBand = probe.length ? Math.max(...probe.map(c => c.box.h)) + 14 : 6;
  const top0 = bandY + colReserve;
  const tightX = shape === 'portrait' ? -Math.round(46 * 1.3 * peopleK) : 0;
  // (tall frames: the calendar hangs high on the wall above the tray and the board — a narrower room, larger people)
  const stOpts = {prefix: 'st', p: sp, looks, showText: showAll, compact: col || !showAll, lwK: col || !showAll ? (shape === 'landscape' ? lwK : 6) : lwK, peopleK, compactTs, calHigh: shape === 'portrait'};
  const sol = solveStage(ctx, {B, availW: availW0, availH: D.h - top0 - chipBand - 8, sMin: S_MIN[shape], fillH: true, scMin: col || !showAll ? 0.1 : 0.2,
    opts: {...stOpts, wallExtraL: tightX, wallExtraX: tightX}});
  let stage = sol.stage;
  const s = sol.s;
  const PL = placeStage(sol, {x0: 8, top0, availW: availW0, bottom: D.h - 4, chipBand});
  {
    // (the room's wall runs to the box's sides: no bare margins beside a narrow stage)
    const E0 = stage.ext;
    const left = PL.ox + E0.x * s - 8, right = 8 + availW0 - (PL.ox + (E0.x + E0.w) * s);
    if (left > 2 || right > 2) stage = deskStage(ctx, {...stOpts, ts: sol.ts, wallExtra: stage.wallExtra ?? 0, wallExtraL: tightX + Math.max(0, Math.round(left / s)), wallExtraX: tightX + Math.max(0, Math.round(right / s))});
  }
  const bx = PL.boxes, G = stage.G, M = PL.M;
  const occupied = [bx.personA, bx.personB, bx.personC, bx.board, bx.cal, bx.rack, ...bx.plates, bx.stripStart, bx.rows];
  if (key) occupied.push(key.box);
  if (stKey) occupied.push(stKey.box);
  notes.forEach(n => occupied.push(n.c.box));
  occupied.push(...colChips.map(c => c.box));
  // ---- name chips under each party
  const chips = [];
  if (showKey) {
    const cxs = packChips([M({x: G.xA, y: 0}).x, M({x: G.xB, y: 0}).x, M({x: G.xC, y: 0}).x], probe.map(c => c.box.w), 8, 8 + availW0);
    [0, 1, 2].forEach(i => {
      const c = gchip(ctx, capOf(i), {x: cxs[i], y: PL.floor + 8, anchor: 'middle', maxWidth: chipMax, size: small, minSize: small, maxLines: 8, name: `chip-${'abc'[i]}`});
      chips.push(c);
      occupied.push(c.box);
    });
  }
  // ---- callout markers beside their targets
  const markR = small * 0.62;
  const un = (a2, b2) => { const x = Math.min(a2.x, b2.x), y = Math.min(a2.y, b2.y); return {x, y, w: Math.max(a2.x + a2.w, b2.x + b2.w) - x, h: Math.max(a2.y + a2.h, b2.y + b2.h) - y}; };
  // (the cards' target is the board that holds them at the hold; the tray's target takes in its plate)
  const targetBox = {caseFile: bx.board, cards: bx.board, trays: un(bx.rack, bx.plates[0]), calendar: bx.cal};
  const labelish = [...chips.map(c => c.box), ...colChips.map(c => c.box), ...notes.map(n => n.c.box)];
  const marks = notes.map(n => {
    const b = targetBox[n.a.target];
    const spots = [[b.x - markR - 4, b.y + markR], [b.x + markR, b.y - markR - 4], [b.x + b.w / 2, b.y - markR - 4], [b.x + b.w + markR + 4, b.y + markR], [b.x - markR - 4, b.y + b.h / 2], [b.x + b.w / 2, b.y + b.h + markR + 4], [b.x + markR, b.y + b.h + markR + 4], [b.x + b.w + markR + 4, b.y + b.h / 2], [b.x - markR - 4, b.y + b.h - markR]];
    const cost = ([x2, y2]) => { const mb = {x: x2 - markR, y: y2 - markR, w: 2 * markR, h: 2 * markR}; return occupied.filter(z => hit(mb, z, 2)).length + labelish.filter(z => hit(mb, z, 2)).length + (mb.x < 4 || mb.y < 4 || mb.x + mb.w > D.w - 4 || mb.y + mb.h > D.h - 4 ? 9 : 0); };
    const [x, y] = spots.reduce((a2, b2) => (cost(b2) < cost(a2) ? b2 : a2));
    occupied.push({x: x - markR, y: y - markR, w: 2 * markR, h: 2 * markR});
    return {x, y};
  });
  const labelBoxes = [...chips.map(c => c.box), key && key.box, stKey && stKey.box, ...notes.map(n => n.c.box), ...colChips.map(c => c.box)].filter(Boolean);
  const truncated = [...stage.fits, ...colChips.map(c => c.fit), ...chips.map(c => c.fit), key && key.fit, stKey && stKey.fit, ...notes.map(n => n.c.fit)].filter(f => f && f.truncated).map(f => f.full);
  const faces = [bx.headA, bx.headB, bx.headC];
  const figPx = Math.min(bx.personA.h, bx.personB.h, bx.personC.h) * pxPer;
  const headPx = Math.min(bx.headA.w, bx.headB.w, bx.headC.w) * HEAD_K * pxPer;
  const glyphPx = (col || !showAll ? 1.32 : 1) * G.ts * s * pxPer;
  return {pk: peopleK, headPx, glyphPx, PL, col, stacked, colChips, chips, key, stKey, notes, marks, markR, stage, s, m: sol.m, labelBoxes, truncated, faces, figPx, small,
    fitted: sol.fitted && colFits, labelsClear: labelBoxes.every((b2, i) => labelBoxes.every((c, j) => i === j || !hit(b2, c, 1))), textPx: r(G.ts * s, 2)};
}

/**
 * Centres for name chips of widths ws under the people at xs, inside [lo, hi]: each as near its person as it can be,
 * in the people's order, never touching another (10 units apart).
 */
function packChips(xs, ws, lo, hi) {
  const order = xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b]);
  const c = xs.map((x, i) => clamp(x, lo + ws[i] / 2, hi - ws[i] / 2));
  for (let k = 1; k < order.length; k++) { const i = order[k], j = order[k - 1]; c[i] = Math.max(c[i], c[j] + ws[j] / 2 + 10 + ws[i] / 2); }
  for (let k = order.length - 1; k >= 0; k--) { const i = order[k]; c[i] = Math.min(c[i], k === order.length - 1 ? hi - ws[i] / 2 : c[order[k + 1]] - ws[order[k + 1]] / 2 - 10 - ws[i] / 2); }
  return c;
}

function buildScene(ctx, L) {
  const th = ctx.theme;
  return g(null,
    g({transform: `${T(L.PL.ox, L.PL.oy)} scale(${r(L.s, 5)})`}, L.stage.node),
    L.chips.map(c => c.node),
    L.notes.map((n, k) => g({name: `note${n.i}`, opacity: 0},
      n.c.node,
      h('circle', {cx: r(L.marks[k].x), cy: r(L.marks[k].y), r: r(L.markR), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      h('text', {x: r(L.marks[k].x), y: r(L.marks[k].y + L.small * 0.34), 'text-anchor': 'middle', 'font-size': r(L.small), 'font-weight': 700, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.ink}, String(n.i + 1)))),
    L.stKey && L.stKey.node,
    L.key && L.key.node,
    L.colChips.map(c => c.node),
  );
}

function frameScene(ctx, L, u) {
  const p = ctx.params;
  const requested = p.finalState !== 'initial';
  const cRaw = (u - C0) / (C1 - C0);
  // (finalState "initial": Party C's card stays in her tray)
  const c = requested ? clamp(cRaw, 0, p.actionProgress) : 0;
  const G = L.stage.G;
  const v = choreo(c, G);
  const done = requested && p.actionProgress >= 1;
  // the relation is drawn as it initially is (●) from the start; once the card is in its slot the initial marks go and
  // the requested configuration (◆) comes — never both at once
  const outP = done ? seg(u, ...CONFIG_OUT) : 0;
  const inP = done ? seg(u, ...CONFIG_IN) : 0;
  const posed = L.stage.pose({...v, markP: done ? v.markP : 0, initP: 1 - outP, reqP: inP});
  const nodes = posed.nodes;
  const noteP = done || !requested ? seg(u, ...NOTES) : 0;
  L.notes.forEach(n => { nodes[`note${n.i}`] = {opacity: r(noteP, 3)}; });
  const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
  const S = L.s;
  const W2 = q => (q ? {x: r(L.PL.ox + q.x * S), y: r(L.PL.oy + q.y * S)} : null);
  const sem = posed.semantic;
  const fx = G.startX + v.sheetD;
  return {
    nodes,
    semantic: {
      beat, clock: r(c, 4), phase: v.phase, finalState: p.finalState, pushed: v.pushed, slotted: v.slotted,
      // where Party C's card is (stage units): it travels rightwards along its own row, into the empty slot; the other
      // cards never move
      cardX: r(fx, 2), travel: r(v.sheetD, 2), inRow: Math.abs(fx - G.rowX) < 0.5, rows: G.rowTops.map(y => r(y, 2)), cards: G.n,
      overlap: G.rowTops.some((y, i) => i && y < G.rowTops[i - 1] + G.rowHs[i - 1]) ? 1 : 0,
      barD: sem.barD, initP: sem.initP, reqP: sem.reqP, config: sem.initP > 0 ? 'initial' : sem.reqP > 0 ? 'requested' : null,
      hand: W2(sem.hand), grip: W2(sem.grip), barGrip: v.phase === 'push' ? W2({x: G.startGrip.x + sem.barD, y: G.yK}) : null,
      markP: sem.markP, notes: r(noteP, 3), allReached: sem.allReached,
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
    slug: 'civil-claim-09-story',
    title: 'Third-party intervention (illustrative) — a newcomer’s card is brought into a represented procedural relation, as a request supplied',
    titleEs: 'Intervención de tercero — Microescena con objetos y actores',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Intervención de tercero',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Side view of an open room. The case file stands open on an easel and represents the procedural relation: Party A’s and Party B’s cards stand in their slots inside one frame (● initial relation). Party C, a fictional newcomer, stands at the left beside her tray, which holds her card — the request to intervene, as supplied. She pushes the card with a push bar out of the tray; it glides on into the empty third slot, drawn exactly like the other cards. Then the initial frame goes and the supplied configuration comes — one frame round all three cards (◆ intervention requested) — and the calendar marks the supplied day. The request is shown only as supplied, never as granted or refused; both configurations have equal weight; no standing test, type of intervention, admission, effect or outcome is shown.',
    tags: ['third party', 'intervention requested', 'initial relation', 'newcomer', 'case file', 'easel', 'tray', 'push bar', 'calendar', 'party cards'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/intervencion-tercero.js', 'src/animations/civil-claim/kits/reconvencion-ilustrativa.js', 'src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/requerimiento-previo.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: IT_STRINGS,
  scene,
});
