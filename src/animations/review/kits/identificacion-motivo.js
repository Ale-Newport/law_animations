/**
 * "Identificación de motivo" kit (LAW-0321..0324, review-01 / hearings-11): a generic, fictional examination room drawn
 * as a floor plan, built for locating, with a magnifier, the apartado of a decision that a party intends to challenge
 * (as supplied). The decision's content is ONLY supplied placeholder text. Along the top wall hangs a LABEL BOARD with
 * two places of the SAME size, in the order supplied (a sequence as configured, illustrative): the place of label A (●,
 * by default "Factual discrepancy (as supplied)") and the place of label B (◆, by default "Legal question raised (as
 * supplied)") — two neutral labels SUPPLIED BY THE PARTY, of equal weight; neither is stronger and neither says that an
 * apartado is wrong. Below the board stands the TABLE, where the decision's numbered apartados lie (editable placeholder
 * sheets, each with its number). One generic, neutral participant (the party with the magnifier) stands at the table's
 * lower edge, the magnifier lying on the table in front of it; any other participants stand further along, facing the
 * board. A wall calendar is the room's fixture only (no date is marked; it implies no time limit).
 *
 * The concrete action — "a magnifier locates the apartado that is intended to be challenged (as supplied)": the party's
 * hand takes the magnifier (the cause); the party carries it along the table's edge so that the lens passes over the
 * apartados one by one; over each apartado located (as supplied) it stops and a neutral bracket frame settles round that
 * sheet (the same frame for every located apartado, whichever label it gets); the magnifier is laid back; finally a line
 * runs from each label card to every apartado it was attached to (as supplied), its marker (● for A, ◆ for B — equal
 * ink) resting on the apartado. A line means only "this label was attached here by the party (as supplied)": nothing is
 * evaluated, decided or found; neither label is preferred or drawn heavier.
 *
 * Generic art comes from ../../hearings/kits/hearings-art.js and ../../courts/kits/courts-art.js; text, chip placement
 * and panel helpers from ../../hearings/kits/apertura-audiencia.js — all imported READ-ONLY. The structure is copied from
 * ../../hearings/kits/lectura-resolucion.js (hearings-10) and adapted here, never imported, so that kit and its entries
 * stay unchanged.
 * @module animations/review/kits/identificacion-motivo
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {floorArea, wallRing, planChair, planPerson, planTable, PERSON} from '../../courts/kits/courts-art.js';
import {hearingColors, stateGlyph, plainDoor, toWorld, reachRecords, REACH, SHOULDER} from '../../hearings/kits/hearings-art.js';
import {FONT, WALL, fitG, fitWords, textAt, measureSpeakerChip, placeLabels, mapper, mapBox, legendGlyph, rowNode, layoutRows, pxPerUnit, localised} from '../../hearings/kits/apertura-audiencia.js';
import {measure} from '../../../core/text.js';

const INK = '#1f2328';
/** The link lines: one colour and one weight for both labels (the markers tell them apart). */
export const LINK = {color: '#3b4550', width: 4.5, glyph: 8.5, dot: 5.5};
/** Apartado sheet size and spacing on the table (template units): a sheet is EXW·s wide and EXH·s tall. */
export const EX = {s: 72, step: 124};
export const EXW = 0.74, EXH = 0.9;
/** Listeners stand beside the table's ends, this far out from them (template units), facing the table — clear of the
 * lane along the table's lower edge where the party walks with the magnifier. */
const LIS_OUT = 92;
/** The party's distance below the table's lower edge (template units): the magnifier's lens reaches every sheet. */
const RD = 46;
/** The magnifier (template units): lens radius, and the grip at the end of its handle (offset from the lens centre). */
export const LUPA = {r: 24, ring: 4.6, grip: {x: 16, y: 52}, lift: 1.1};
/** The party stands this far to the left of the lens while it carries the magnifier (its right hand on the grip). */
const CARRY_DX = 20;
/** Height of the neutral placeholder bars under a label card's heading (template units). */
export const BARS_H = 26;
const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];
export const SIDES = ['a', 'b'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Category fields shared by the four entries (brief: decisions, grounds, routes, outcomes). */
export const imFields = {
  decisions: obj('The decision under examination (fictional; placeholder text only)', {
    title: str('Name of the decision (fictional, as supplied)', 60),
    sections: list('The decision\'s apartados lying on the table, numbered in this order (editable placeholder tags, as supplied)', str('Apartado tag (placeholder)', 50), 2, 4),
  }, ['title', 'sections']),
  speakers: list('Participants (generic, fictional): one holds the magnifier (see `examiner`), any others stand further along the table. No rank, role rule or order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 1, 3),
  examiner: int('Index in `speakers` of the participant who holds the magnifier (generic and neutral)', 0, 2),
  grounds: list('The two labels the party supplies, one per place on the board (neutral, equal weight, as supplied). A label never says that an apartado is wrong', obj('Label', {
    side: oneOf('a (label A, ●) or b (label B, ◆)', ['a', 'b']),
    text: str('Text of the label (as supplied by the party)', 70),
  }, ['side', 'text']), 2, 2),
  routes: obj('The apartados the magnifier locates for each label (indices in `decisions.sections`, as supplied). A line means only "this label was attached here by the party (as supplied)"', {
    a: list('Apartados located for label A (as supplied)', int('Index in `decisions.sections`', 0, 3), 1, 3),
    b: list('Apartados located for label B (as supplied)', int('Index in `decisions.sections`', 0, 3), 1, 3),
  }, ['a', 'b']),
  sequence: list('Order of the two labels along the board (indices in `grounds`): a sequence as configured (illustrative)', int('Index in `grounds`', 0, 1), 1, 2),
  outcomes: obj('Captions of the two line markers: the state supplied by the party only (equal weight; nothing is inferred)', {
    a: str('Caption of ● (label A attached, as supplied)', 70),
    b: str('Caption of ◆ (label B attached, as supplied)', 70),
  }, ['a', 'b']),
  labels: obj('Editable captions', {
    sequence: str('Caption of the order of the labels on the board (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['sequence', 'key']),
};

export const IM_EN = {
  decisions: {title: 'Decision under examination (fictional)', sections: ['Section 1 (supplied text)', 'Section 2 (supplied text)', 'Section 3 (supplied text)', 'Section 4 (supplied text)']},
  speakers: [{label: 'Party with the magnifier (fictional)'}],
  examiner: 0,
  grounds: [
    {side: 'a', text: 'Factual discrepancy (as supplied)'},
    {side: 'b', text: 'Legal question raised (as supplied)'},
  ],
  routes: {a: [1], b: [2]},
  sequence: [0, 1],
  outcomes: {a: 'Labelled a factual discrepancy (as supplied)', b: 'Labelled a legal question raised (as supplied)'},
  labels: {sequence: 'Order of the labels as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const IM_ES = {
  decisions: {title: 'Resolución examinada (ficticia)', sections: ['Apartado 1 (texto aportado)', 'Apartado 2 (texto aportado)', 'Apartado 3 (texto aportado)', 'Apartado 4 (texto aportado)']},
  speakers: [{label: 'Parte con la lupa (ficticia)'}],
  examiner: 0,
  grounds: [
    {side: 'a', text: 'Discrepancia fáctica (según lo aportado)'},
    {side: 'b', text: 'Cuestión jurídica señalada (según lo aportado)'},
  ],
  routes: {a: [1], b: [2]},
  sequence: [0, 1],
  outcomes: {a: 'Etiquetado como discrepancia fáctica (según lo aportado)', b: 'Etiquetado como cuestión jurídica señalada (según lo aportado)'},
  labels: {sequence: 'Orden de las etiquetas según lo configurado (ilustrativo)', key: 'Según lo aportado · sin conclusión'},
};

/**
 * Localise (untouched defaults follow locale=es) and map this motif's field names onto the structure the room code
 * reads: `exhibits` (the apartados), `statements` (the two labels), `links` (the routes), `states` (the outcome
 * captions), `reader` (the examiner) and `hearing.room` (the decision's name).
 */
export function localisedIm(ctx, EN, ES) {
  const P = {...localised(ctx, EN, ES)};
  P.exhibits = (P.decisions && P.decisions.sections) || [];
  P.hearing = {room: (P.decisions && P.decisions.title) || ''};
  P.statements = P.grounds || [];
  P.links = P.routes || {a: [0], b: [1]};
  P.states = P.outcomes || {a: '', b: ''};
  P.reader = P.examiner ?? 0;
  return P;
}

const uniq = (xs, n) => {
  const out = [];
  for (const v of xs || []) { const q = Math.round(v); if (q >= 0 && q < n && !out.includes(q)) out.push(q); }
  return out.length ? out : [0];
};

/**
 * Resolve the supplied content: the reader and the others, the two sections (A ●, B ◆) in the configured order, the
 * apartados and each section's apartados.
 * @param {any} ctx
 * @param {any} P localised params
 * @param {{links?:any}} [o] links override (inspect: the substituted links)
 */
export function resolveIm(ctx, P, o = {}) {
  const sp0 = (P.speakers || []).slice(0, 3);
  const n = sp0.length;
  const speakers = sp0.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  const reader = clamp(Math.round(P.reader ?? 0), 0, Math.max(0, n - 1));
  const listeners = speakers.map(sp => sp.index).filter(i => i !== reader).slice(0, 2);
  const exhibits = (P.exhibits || []).slice(0, 4);
  const ne = exhibits.length;
  const sts = (P.statements || []).slice(0, 2);
  let ai = sts.findIndex(s => s.side === 'a'), bi = sts.findIndex(s => s.side === 'b');
  if (ai < 0) ai = bi === 0 ? 1 : 0;
  if (bi < 0 || bi === ai) bi = ai === 0 ? 1 : 0;
  const args = {a: {i: ai, text: (sts[ai] && sts[ai].text) || ''}, b: {i: bi, text: (sts[bi] && sts[bi].text) || ''}};
  const order = [];
  for (const q of P.sequence || []) if (q < 2 && !order.includes(q)) order.push(q);
  for (const i of [0, 1]) if (!order.includes(i)) order.push(i);
  const left = order[0] === ai ? 'a' : 'b';
  const right = left === 'a' ? 'b' : 'a';
  const L = o.links || P.links || {};
  const links = {a: uniq(L.a, ne), b: uniq(L.b, ne)};
  return {n, speakers, reader, listeners, exhibits, args, order, left, right, links};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

/** A plate's size for a text fit (glyph on the left), or a text-free placeholder; a section card adds its bars. */
/** Top padding of a plate's text: room for the glyphs' ascent at large sizes (never less than 7 units). */
const padT = fit => Math.max(7, fit.size * 0.2);
const plateSize = (fit, gs, bars = false) => (fit ? {w: TX(gs) + fit.width * 1.06 + 16, h: fit.height + 11 + 2 * padT(fit) + (bars ? BARS_H : 0)} : {w: 200, h: 62});
/** Text inset of a plate: the glyph (radius gs) sits at 12 + gs from the left edge, the text a gap after it. */
export const TX = gs => 12 + 2 * gs + 10;
const GX = gs => 12 + gs;

/**
 * Line end points for one side and one set of apartados: ports along the inner part of the card's lower edge (in the
 * order of their apartados, so a section's lines never cross) and marker points just above each apartado's upper edge,
 * on the section's own half of the sheet (an apartado placed in both sections gets one port on each half).
 * @param {any} G
 * @param {'a'|'b'} side
 * @param {number[]} exs
 * @param {{a:number[], b:number[]}} all both sides' links (for the shared ports)
 */
export function linkEnds(G, side, exs, all) {
  const card = G.card[side];
  const leftSide = side === G.left;
  const sorted = [...exs].sort((p, q) => G.exhibits[p].cx - G.exhibits[q].cx);
  const n = sorted.length;
  const f0 = leftSide ? 0.42 : 0.12, f1 = leftSide ? 0.88 : 0.58;
  const other = side === 'a' ? 'b' : 'a';
  return sorted.map((ex, j) => {
    const f = n === 1 ? (f0 + f1) / 2 : lerp(f0, f1, j / (n - 1));
    const e = G.exhibits[ex];
    const shared = all[other].includes(ex);
    // (each side always lands on its own half of a sheet — shared or not — so a substituted link of one side never
    // moves the other side's line)
    const dx = (leftSide ? -1 : 1) * e.s * 0.24;
    return {ex, from: {x: card.x + card.w * f, y: card.y + card.h}, to: {x: e.cx + dx, y: e.cy - e.s * EXH / 2 - LINK.glyph - 3}, shared};
  });
}

/**
 * @param {number} W
 * @param {number} H
 * @param {any} R resolveIm()
 * @param {{cardFits?:any, refsFits?:any, dockH?:number, dockW?:number, markR?:number, Ft?:number|null, numFt?:number, noChips?:boolean, exStep?:number, extraGap?:number, linksAlt?:any, linkGap?:number, exK?:number, lupaK?:number, lupaDx?:number, walkPad?:number}} [o]
 *   exK (opt-in): the apartado sheets drawn exK times their standard size (the step scales with them unless exStep is
 *   given); lupaK (opt-in): the magnifier drawn lupaK times its standard size; lupaDx: the magnifier's rest moved this
 *   far along x from the gap centre (template units). All default to the standard room.
 */
export function imGeometry(W, H, R, o = {}) {
  const t = WALL;
  const pad = 14, gapC = 46 + (o.extraGap || 0);
  const gs = o.Ft ? o.Ft * 0.32 : 7;
  const cf = o.cardFits || {}, rf = o.refsFits || null;
  // (opt-in plateH: a text-free section card drawn this tall — its large glyph grows with it)
  const pA = cf.a || !o.plateH ? plateSize(cf.a, gs, true) : {w: 200, h: o.plateH}, pB = cf.b || !o.plateH ? plateSize(cf.b, gs, true) : {w: 200, h: o.plateH};
  let inner = Math.max(pA.w, pB.w, 180, o.dockW || 0);
  let refsH = 0, refsW = 0;
  if (rf) {
    // (the two reference plates: the same size as each other, as narrow as their text allows — the lens crop on one of
    // them stays small; the dock under A's plate is as wide as its "was" text needs)
    // (the reference plates' glyph scales with their own text size: a ◆ never shrinks to read as a dot)
    const gsR = rf.a && rf.a.size ? rf.a.size * 0.32 : gs;
    const ra = plateSize(rf.a, gsR), rb = plateSize(rf.b, gsR);
    refsW = Math.max(ra.w, rb.w, 150);
    inner = Math.max(inner, refsW);
    refsH = Math.max(ra.h, rb.h);
  }
  // (the two cards — and the two reference plates — are the SAME size: the larger of the two supplied texts)
  const cardH = Math.max(pA.h, pB.h, 62);
  const dockH = o.dockH || 0;
  const markNeed = o.markR || 0;
  const markR = rf && markNeed ? Math.max(0, markNeed - (inner - refsW)) : markNeed;
  const colW = inner + markR;
  const bw = pad * 2 + colW * 2 + gapC;
  const ne = R.exhibits.length;
  const exK = o.exK || 1;
  const exS = EX.s * exK;
  const lupaK = o.lupaK || 1;
  const step = o.exStep || EX.step * exK;
  const numFt = o.Ft || o.numFt || 0;
  // (each apartado's number is printed ON its sheet: the sheets lie near the table's lower edge, within the reach of the
  // magnifier carried along that edge)
  const tableW = (ne - 1) * step + exS + 40;
  const tableH = exS * EXH + 40;
  // widths: the board with margins; the table; the reader with the listeners beside
  // (with label chips the listeners sit further out, so each chip stays nearer its own person)
  // (the listeners' places only when there are listeners; the party's walk along the table always)
  // (o.chipW: the party's chip, which travels with it — the room holds it at both ends of the walk)
  const walkHalf = Math.max(Math.abs((ne - 1) * step / 2 + CARRY_DX), Math.abs((ne - 1) * step / 2 - CARRY_DX)) + Math.max(PERSON.half + 16, (o.chipW || 0) / 2 + 24) + (o.walkPad || 0);
  // (rounded up to whole steps of 4 units: a sub-unit difference in a measured text width — the shared measure cache can
  // hold a width taken before a system font face settled — never moves the room's scale)
  const needW = Math.ceil(Math.max(bw + 2 * 22, tableW + 2 * 30, R.listeners.length ? tableW + 2 * (LIS_OUT + PERSON.half + (o.Ft && !o.noChips ? 70 : 40)) : 0, o.walk ? 2 * walkHalf : 0, 520) / 4) * 4;
  const board = {x: (W - bw) / 2, y: 8, w: bw, h: 0};
  const colX = {[R.left]: board.x + pad, [R.right]: board.x + pad + colW + gapC};
  const cx = s => colX[s];
  let y = board.y + pad;
  const refs = rf ? {a: {x: cx('a'), y, w: refsW, h: refsH}, b: {x: cx('b'), y, w: refsW, h: refsH}} : null;
  const dock = !dockH ? null : {x: cx('a'), y: y + refsH + 8, w: Math.max(refsW, o.dockW || 0), h: dockH};
  if (rf) y += refsH + 8;
  if (dockH) y += dockH + 8;
  const card = {a: {x: cx('a'), y, w: inner, h: cardH}, b: {x: cx('b'), y, w: inner, h: cardH}};
  board.h = y + cardH + pad - board.y;
  const yB = board.y + board.h;
  const Cx = board.x + board.w / 2;
  // heights: board, the free floor (links), the table, the lectern and the reader's row
  const linkGap0 = o.linkGap || 68;
  // (the bottom margin keeps room for the participants' label chips; without chips, only for their number badges)
  // (under the reader: its body, then — with chips — the reader's chip (o.chipH, the tallest participant chip,
  // measured) with its gaps; without chips a plain margin for the number badges)
  const below = RD + PERSON.half + (o.Ft ? (o.noChips ? 20 + o.Ft * 1.8 : 30 + Math.max(o.chipH || 0, o.Ft * 1.6)) : 40);
  const need0 = yB + linkGap0 + tableH + below;
  const needH = Math.max(need0, 400);
  const spare = Math.max(0, H - needH);
  const linkGap = linkGap0 + spare * 0.45;
  const table = {x: Cx - tableW / 2, y: yB + linkGap, w: tableW, h: tableH};
  const exY = table.y + 18 + exS * EXH / 2;
  const exhibits = R.exhibits.map((_, i) => ({cx: table.x + 20 + exS / 2 + i * step, cy: exY, s: exS, numY: exY + numFt * 0.36}));
  // the party: just below the table's lower edge on the room's axis, facing the board
  const rowY = table.y + tableH + RD;
  // (opt-in restAtLupa: the party stands right below the magnifier's rest — with an odd number of sheets the rest is
  // off the room's axis, in the gap beside the middle sheet)
  const restX = o.restAtLupa ? (ne % 2 === 0 ? Cx : Cx + step / 2) + (o.lupaDx || 0) : Cx;
  const seats = [];
  const pose = {x: restX, y: rowY, deg: 0};
  seats[R.reader] = {x: restX, y: rowY, deg: 0, standing: true, angle: 90};
  // the magnifier lies on the table in front of the party, its lens in the gap between two sheets nearest the axis (on
  // the axis itself when the number of sheets is even), its handle towards the party
  const gapX = (ne % 2 === 0 ? Cx : Cx + step / 2) + (o.lupaDx || 0);
  const lupaRest = {x: gapX, y: exY};
  // (the "lectern" of the hearings kit: here the magnifier's resting place — an obstacle for labels and lines)
  const lectern = {cx: gapX, cy: exY + 12 * lupaK, deg: 0, s: 58 * lupaK};
  // (the party's right hand goes to the magnifier's grip — well within reach)
  const aim = {arm: 'armR', target: {x: lupaRest.x + LUPA.grip.x * lupaK, y: lupaRest.y + LUPA.grip.y * lupaK}};
  // (while it carries the magnifier the party walks along the table's lower edge: from the first sheet to the last)
  const walk = {min: Math.min(restX, exhibits[0].cx - CARRY_DX), max: Math.max(restX, exhibits[ne - 1].cx - CARRY_DX)};
  const docMid = {x: Cx, y: exY};
  const docFloor = {x: Cx, y: (yB + table.y) / 2};
  // the others sit beside the reader, facing the board
  // (the others stand beside the table's ends, facing it: the right end first when there is one)
  const ends = R.listeners.length === 1 ? [1] : [0, 1];
  R.listeners.forEach((pi, j) => {
    const right = ends[j] === 1;
    seats[pi] = {x: right ? table.x + tableW + LIS_OUT : table.x - LIS_OUT, y: table.y + tableH / 2, deg: right ? -90 : 90, angle: right ? 0 : 180};
  });
  const clock = {cx: 46, cy: yB + 52, R: 28};
  // (opt-in calFree: when the table reaches the calendar's place on the left wall, the calendar hangs in the top-left
  // corner beside the board instead — or in the top-right corner — wherever it lies clear of board and table)
  if (o.calFree) {
    const cBox = q => ({x: q.cx - q.R * 0.95 - 8, y: q.cy - q.R * 1.05 - 12, w: q.R * 1.9 + 16, h: q.R * 2.1 + 20});
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const tb0 = {x: Cx - tableW / 2, y: yB + linkGap, w: tableW, h: tableH};
    const bd = {x: board.x, y: board.y, w: board.w, h: board.h};
    const ok = q => { const b = cBox(q); return b.x >= 0 && b.x + b.w <= W && b.y >= 0 && !hit(b, tb0) && !hit(b, bd); };
    if (!ok(clock)) {
      const alt = [{cx: board.x / 2, cy: board.y + board.h / 2, R: 28}, {cx: (board.x + board.w + W) / 2, cy: board.y + board.h / 2, R: 28}].find(ok);
      if (alt) Object.assign(clock, alt);
    }
  }
  const door = {a: Math.min(W - 150, Math.max(Cx + walkHalf + 40, W * 0.7)), b: Math.min(W - 70, Math.max(Cx + walkHalf + 120, W * 0.7 + 80))};
  // (opt-in doorTop: the door in the top wall, right of the board, when it fits there — clear of the party's walk;
  // otherwise the room is drawn without a door)
  if (o.doorTop) { const a0 = Math.max(board.x + bw + 40, W - 150); if (a0 + 80 <= W - 40 && !(clock.cx > Cx && clock.cy < yB)) { door.a = a0; door.b = a0 + 80; door.top = true; } else door.none = true; }
  const problems = [];
  if (W + 0.5 < needW) problems.push('room-width');
  if (H + 0.5 < needH) problems.push('room-height');
  const G = {restX, lupaK, W, H, t, board, colX, colW, inner, card, refs, dock, markR, left: R.left, right: R.right, yB, Cx, table, exhibits, seats, lectern, aim, lupaRest, walk, docMid, docFloor, clock, door, needW, needH, problems, step, readerPose: pose,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t}};
  G.links = {a: linkEnds(G, 'a', R.links.a, R.links), b: linkEnds(G, 'b', R.links.b, R.links)};
  if (o.linksAlt) G.linksAlt = {a: linkEnds(G, 'a', o.linksAlt.a, o.linksAlt), b: linkEnds(G, 'b', o.linksAlt.b, o.linksAlt)};
  G.markC = !markNeed ? null : refs ? {x: refs.a.x + refsW + (inner + markR - refsW) / 2, y: refs.a.y + refs.a.h / 2} : {x: colX.a + inner + markR / 2, y: card.a.y + card.a.h / 2};
  return G;
}

/** Obstacles of the room for label placement (template units): board, table, the magnifier's rest, calendar, door. */
export function imObstacles(G) {
  const l = G.lectern;
  return [
    {x: G.board.x - 8, y: 0, w: G.board.w + 16, h: G.yB + 8},
    {x: G.table.x - 8, y: G.table.y - 8, w: G.table.w + 16, h: G.table.h + 16},
    {x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R - 6, w: 2 * G.clock.R + 12, h: 2 * G.clock.R + 12},
    G.door.none ? null : {x: G.door.a, y: G.door.top ? 0 : G.H - (G.door.b - G.door.a), w: G.door.b - G.door.a, h: G.door.b - G.door.a},
    {x: l.cx - 40 * (G.lupaK || 1), y: l.cy - 40 * (G.lupaK || 1), w: 80 * (G.lupaK || 1), h: 80 * (G.lupaK || 1)},
  ].filter(Boolean);
}

/** Sample boxes along every link (template units), so labels keep off the lines. */
export function linkSamples(G, sets = ['links']) {
  const out = [];
  for (const key of sets) {
    const L = G[key];
    if (!L) continue;
    for (const s of SIDES) for (const lk of L[s]) for (let q = 0; q <= 14; q++) {
      const x = lerp(lk.from.x, lk.to.x, q / 14), y = lerp(lk.from.y, lk.to.y, q / 14);
      out.push({x: x - 10, y: y - 10, w: 20, h: 20});
    }
  }
  return out;
}

export const personBox = s => ({x: s.x - PERSON.half - 8, y: s.y - PERSON.half - 8, w: PERSON.half * 2 + 16, h: PERSON.half * 2 + 16});

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/** Neutral placeholder bars (simulated filler text of a section; never content). */
function barsPath(x0, x1, y0) {
  return `M${r(x0)} ${r(y0)}H${r(x1)}M${r(x0)} ${r(y0 + 13)}H${r(x0 + (x1 - x0) * 0.62)}`;
}

/**
 * ● / ◆ plate body + glyph + text (or placeholder bars when no text is shown); a section card (o.bars) adds two neutral
 * placeholder bars under its heading.
 */
function plateParts(ctx, name, box, fit, kind, Ft, o = {}) {
  const c = hearingColors(ctx);
  // (o.big, text-free cards only: the side's glyph large — the label that differs reads at a glance inside the scene)
  const big = !fit && o.big;
  const gs = big ? box.h * 0.3 : Ft ? Ft * 0.32 : 7;
  const gx = box.x + (big ? 14 + gs : GX(gs)), gy = fit ? box.y + padT(fit) + fit.size * 0.55 : box.y + box.h / 2;
  const bars = [];
  const bx0 = big ? box.x + 28 + gs * 2 : box.x + 34;
  if (!fit) for (let i = 0; i < 2; i++) bars.push(`M${r(bx0)} ${r(box.y + box.h * (0.36 + i * 0.3))}H${r(box.x + box.w - (i ? 50 : 14))}`);
  const tx = box.x + TX(gs);
  return [
    h('path', {name: `${name}-body`, d: roundRectPath(box.x, box.y, box.w, box.h, 7), fill: o.fill || c.card, stroke: INK, 'stroke-width': 2.2}),
    o.noGlyph ? null : stateGlyph(ctx, {name: `${name}-g`, kind, cx: gx, cy: gy, s: gs}),
    o.noText ? null : fit ? g({name: `${name}-text`}, textAt(fit, tx, box.y + padT(fit), INK)) : h('path', {d: bars.join(''), stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    fit && o.bars ? h('path', {name: `${name}-bars`, d: barsPath(tx, box.x + box.w - 16, box.y + box.h - BARS_H + 4), stroke: c.paperLine, 'stroke-width': 3.4, 'stroke-linecap': 'round'}) : null,
  ];
}

/** The glyph of a side: ● for A, ◆ for B. */
export const kindOf = s => (s === 'a' ? 'dot' : 'diamond');

/**
 * Labels hidden (opt-in `refMarks`, inspect): a reference plate shows, instead of its placeholder bar, one small sheet
 * per paragraph — the side's glyph on each sheet it holds —, so which paragraphs it holds reads without text.
 * @returns {{cx:(i:number)=>number, cy:number, s:number}}
 */
function refSlots(box, n, gs) {
  const x0 = box.x + GX(gs) + gs + 12, x1 = box.x + box.w - 10;
  const pitch = (x1 - x0) / Math.max(1, n);
  const s = Math.min(pitch * 0.78, box.h * 0.62);
  return {cx: i => x0 + pitch * (i + 0.5), cy: box.y + box.h / 2, s};
}
function refSheets(box, n, gs) {
  const q = refSlots(box, n, gs);
  const d = [];
  for (let i = 0; i < n; i++) d.push(roundRectPath(q.cx(i) - q.s * EXW / 2, q.cy - q.s / 2, q.s * EXW, q.s, 3));
  return h('path', {d: d.join(''), fill: '#ffffff', stroke: '#9aa4ae', 'stroke-width': 1.6});
}

/**
 * An apartado sheet from above (white paper, neutral filler lines), centred on the origin. With a number printed on it
 * (`numbered`), the filler lines keep to the top and bottom edges, clear of the number.
 */
function sheetArt(ctx, s, numbered = false) {
  const c = hearingColors(ctx);
  const w = s * EXW, hh = s * EXH;
  const lines = [];
  if (numbered) for (const y of [-hh / 2 + 6, hh / 2 - 6]) lines.push(`M${r(-w / 2 + 7)} ${r(y)}H${r(w / 2 - 7)}`);
  else for (let i = 0; i < 4; i++) lines.push(`M${r(-w / 2 + 7)} ${r(-hh / 2 + 10 + i * (hh - 18) / 3.2)}H${r(w / 2 - 7 - (i === 3 ? w * 0.3 : 0))}`);
  return [
    h('rect', {x: r(-w / 2 + 3), y: r(-hh / 2 + 4), width: r(w), height: r(hh), rx: 3, fill: ctx.theme.shadow}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 2}),
    h('path', {d: lines.join(''), stroke: c.paperLine, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
  ];
}

/**
 * The magnifier seen from above, centred on its lens: a dark ring round a lightly tinted glass with a small highlight,
 * and a handle running from the ring towards the grip (LUPA.grip). Never a token: a real hand magnifier.
 */
export function lupaArt(ctx, name, o = {}) {
  const th = ctx.theme;
  const R0 = LUPA.r;
  const gx = LUPA.grip.x, gy = LUPA.grip.y;
  const len = Math.hypot(gx, gy), ux = gx / len, uy = gy / len;
  const a = {x: ux * (R0 + LUPA.ring * 0.5), y: uy * (R0 + LUPA.ring * 0.5)};
  const b = {x: gx + ux * 6, y: gy + uy * 6};
  return g({name, transform: `translate(0 0) scale(${r(o.k ?? 1, 4)})`},
    g({name: `${name}-shadow`, transform: 'translate(3 5)'},
      h('circle', {cx: 0, cy: 0, r: r(R0 + LUPA.ring / 2), fill: th.shadow}),
      h('line', {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: th.shadow, 'stroke-width': 10, 'stroke-linecap': 'round'})),
    h('line', {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: '#2b2f36', 'stroke-width': 9, 'stroke-linecap': 'round'}),
    h('line', {x1: r(a.x + ux * 4), y1: r(a.y + uy * 4), x2: r(b.x - ux * 6), y2: r(b.y - uy * 6), stroke: '#6b5a44', 'stroke-width': 4.2, 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: 0, r: R0, fill: '#cfe4f2', 'fill-opacity': 0.32, stroke: '#2b2f36', 'stroke-width': LUPA.ring}),
    // (o.copy: a real enlarged copy of the apartado number under the lens — the sheet's own number hides meanwhile, so
    // it is shown in one place at a time)
    o.copy ? h('defs', null, h('clipPath', {id: ctx.id(`${name}-clip`)}, h('circle', {cx: 0, cy: 0, r: r(R0 - LUPA.ring / 2)}))) : null,
    o.copy ? g({'clip-path': ctx.ref(`${name}-clip`)}, h('text', {name: `${name}-num`, x: 0, y: 0, 'font-family': FONT, 'font-size': r(o.copy.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK, opacity: 0}, '')) : null,
    h('path', {d: `M${r(-R0 * 0.62)} ${r(-R0 * 0.18)}A${r(R0 * 0.66)} ${r(R0 * 0.66)} 0 0 1 ${r(-R0 * 0.18)} ${r(-R0 * 0.62)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.85}));
}

/**
 * A blank wall calendar (a fixture of the room only): a hanging sheet with a header band and an empty grid. No date is
 * marked, circled or counted — it implies no time limit.
 */
function wallCalendar(ctx, {name, cx, cy, R}) {
  const w = R * 1.9, hh = R * 2.1;
  const x0 = cx - w / 2, y0 = cy - hh / 2;
  const grid = [];
  const gx0 = x0 + 6, gx1 = x0 + w - 6, gy0 = y0 + hh * 0.36, gy1 = y0 + hh - 6;
  for (let i = 0; i <= 4; i++) { const x = lerp(gx0, gx1, i / 4); grid.push(`M${r(x)} ${r(gy0)}V${r(gy1)}`); }
  for (let j = 0; j <= 3; j++) { const y = lerp(gy0, gy1, j / 3); grid.push(`M${r(gx0)} ${r(y)}H${r(gx1)}`); }
  const node = g({name},
    h('rect', {x: r(x0 + 3), y: r(y0 + 5), width: r(w), height: r(hh), rx: 4, fill: ctx.theme.shadow}),
    h('rect', {x: r(x0), y: r(y0), width: r(w), height: r(hh), rx: 4, fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: r(x0), y: r(y0), width: r(w), height: r(hh * 0.28), rx: 4, fill: '#9aa4ae', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(cx - w * 0.22)} ${r(y0 - 4)}V${r(y0 + 7)}M${r(cx + w * 0.22)} ${r(y0 - 4)}V${r(y0 + 7)}`, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('path', {d: grid.join(''), stroke: '#b9c1c9', 'stroke-width': 1.6}));
  return {node, frame: () => ({}), box: {x: x0, y: y0 - 4, w, h: hh + 4}};
}

/**
 * The neutral "located" frame round an apartado sheet: two side brackets ([ ]) in the line ink, the same for every
 * located apartado whichever label it gets. Its top ends stay clear of the line markers that land on the sheet's upper
 * edge.
 */
function locatedFrame(e, name) {
  const w = e.s * EXW, hh = e.s * EXH;
  const m = 9, f = 7;
  const xl = e.cx - w / 2 - m, xr = e.cx + w / 2 + m, yt = e.cy - hh / 2 + 2, yb = e.cy + hh / 2 + m;
  const d = `M${r(xl + f)} ${r(yt)}H${r(xl)}V${r(yb)}H${r(xl + f + 5)}M${r(xr - f)} ${r(yt)}H${r(xr)}V${r(yb)}H${r(xr - f - 5)}`;
  // (a pale neutral backing under the sheet, and the brackets round it)
  return g({name, opacity: 0, transform: 'translate(0 0) scale(1)'},
    h('rect', {x: r(xl + 2), y: r(yt), width: r(xr - xl - 4), height: r(yb - yt - 2), rx: 4, fill: '#dde4ea'}),
    h('path', {d, fill: 'none', stroke: LINK.color, 'stroke-width': 4.4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}));
}

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G imGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, numFt?:number, cardFits?:any, refsFits?:any, keep?:(b:any)=>boolean, sides?:string[], cardsIn?:boolean, exIn?:boolean, doc?:boolean, datum?:any, noLinks?:boolean, linkStyle?:any}} o
 *   sides: whose links exist (contrast: one per room); cardsIn: the cards come out of the document (story, contrast);
 *   exIn: the apartados come out of the document (story); doc: the document is drawn (story, contrast);
 *   datum (inspect): {fits: {before, after}, wasFit} — section A's reference plate in both values, the old one docked
 */
export function imRoom(ctx, G, o) {
  const P = o.prefix;
  const c = hearingColors(ctx);
  const th = ctx.theme;
  const R = o.R;
  const {W, H, t} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const sides = o.sides || SIDES;
  const parts = [];
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 64}));
  parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: [
    G.door.none ? null : {side: G.door.top ? 'top' : 'bottom', a: G.door.a, b: G.door.b, kind: 'door'},
    {side: 'left', a: Math.max(G.yB + 100, H * 0.42), b: Math.max(G.yB + 170, H * 0.42 + 70), kind: 'window'},
  ].filter(Boolean)}));
  const door = G.door.none ? {node: null, frame: () => ({})} : G.door.top ? plainDoor(ctx, {name: `${P}-door`, hinge: {x: G.door.b, y: -t / 2}, width: G.door.b - G.door.a, closedDeg: 180, openDeg: -80})
    : plainDoor(ctx, {name: `${P}-door`, hinge: {x: G.door.b, y: H + t / 2}, width: G.door.b - G.door.a, closedDeg: 180, openDeg: 80});
  parts.push(door.node);
  // (the wall calendar keeps the hearings kit's `clock` place and node prefix: a fixture only, no date marked)
  const clock = wallCalendar(ctx, {name: `${P}-clock`, cx: G.clock.cx, cy: G.clock.cy, R: G.clock.R});
  const keepClock = keep(clock.box);
  if (keepClock) parts.push(clock.node);
  // the board with its two places (same size); the cards on them
  const B0 = G.board;
  const boardParts = [
    h('path', {d: roundRectPath(B0.x + 4, B0.y + 6, B0.w, B0.h, 10), fill: th.shadow}),
    h('path', {name: `${P}-board-body`, d: roundRectPath(B0.x, B0.y, B0.w, B0.h, 10), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
  ];
  const keepCard = {}, keepRefs = {};
  for (const s of SIDES) {
    const cb = G.card[s];
    keepCard[s] = keep(cb);
    keepRefs[s] = G.refs ? keep(G.refs[s]) : false;
    if (keepCard[s]) boardParts.push(h('path', {name: `${P}-place-${s}`, d: roundRectPath(cb.x - 4, cb.y - 4, cb.w + 8, cb.h + 8, 9), fill: '#ffffff', stroke: '#9aa4ae', 'stroke-width': 2}));
  }
  // reference plates (inspect): B's static, A's in both values with the old one moving to the dock
  const datum = o.datum || null;
  const gs = o.Ft ? o.Ft * 0.32 : 7;
  // (the reference plates' glyph and text inset follow the plates' own text size — see imGeometry)
  const gsR = o.refsFits && o.refsFits.a && o.refsFits.a.size ? o.refsFits.a.size * 0.32 : gs;
  if (G.refs) {
    const fB = o.refsFits ? o.refsFits.b : null;
    const mk = o.refMarks && !fB ? o.refMarks : null;
    if (keepRefs.b && mk) {
      const q = refSlots(G.refs.b, G.exhibits.length, gs);
      boardParts.push(g({name: `${P}-refs-b`}, plateParts(ctx, `${P}-refs-b`, G.refs.b, null, 'diamond', o.Ft, {fill: '#ffffff', noText: true}), refSheets(G.refs.b, G.exhibits.length, gs),
        G.links.b.map((lk, j) => stateGlyph(ctx, {name: `${P}-rmk-b${j}`, kind: 'diamond', cx: q.cx(lk.ex), cy: q.cy, s: q.s * 0.2}))));
    } else if (keepRefs.b) boardParts.push(g({name: `${P}-refs-b`}, plateParts(ctx, `${P}-refs-b`, G.refs.b, fB, 'diamond', fB && fB.size ? fB.size : o.Ft, {fill: '#ffffff'})));
    if (keepRefs.a) {
      const ra = G.refs.a;
      const fits = datum ? datum.fits : null;
      if (G.dock && fits && keep(G.dock)) {
        boardParts.push(g({name: `${P}-dock`, opacity: 0}, h('path', {d: roundRectPath(G.dock.x, G.dock.y, G.dock.w, G.dock.h, 6), fill: '#f3f4f5', stroke: '#9aa4ae', 'stroke-width': 1.6})));
        boardParts.push(g({name: `${P}-was`, opacity: 0}, textAt(datum.wasFit, G.dock.x + 10, G.dock.y + 8, '#57606a', {italic: true})));
      }
      boardParts.push(g({name: `${P}-refs-a`},
        h('path', {name: `${P}-refs-a-body`, d: roundRectPath(ra.x, ra.y, ra.w, ra.h, 7), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
        g({name: `${P}-refs-a-mark`}, stateGlyph(ctx, {name: `${P}-refs-a-g`, kind: 'dot', cx: ra.x + GX(gsR), cy: fits ? ra.y + padT(fits.before) + fits.before.size * 0.55 : ra.y + ra.h / 2, s: gsR})),
        fits ? g({name: `${P}-refs-a-v-after`, opacity: 0, transform: 'translate(0 0)'}, g({name: `${P}-refs-a-v-after-text`}, textAt(fits.after, ra.x + TX(gsR), ra.y + padT(fits.after), INK)))
          : mk ? g(null, refSheets(ra, G.exhibits.length, gs), G.links.a.map((lk, j) => { const q = refSlots(ra, G.exhibits.length, gs); return stateGlyph(ctx, {name: `${P}-rmk-a${j}`, kind: 'dot', cx: q.cx(lk.ex), cy: q.cy, s: q.s * 0.2}); }))
            : h('path', {d: `M${r(ra.x + 34)} ${r(ra.y + ra.h / 2)}H${r(ra.x + ra.w - 14)}`, stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'})));
      if (fits) boardParts.push(g({name: `${P}-refs-a-v-before`, opacity: 1, transform: 'translate(0 0)'}, g({name: `${P}-refs-a-v-before-text`}, textAt(fits.before, ra.x + TX(gsR), ra.y + padT(fits.before), INK))));
    }
  }
  for (const s of SIDES) {
    if (!keepCard[s]) continue;
    const fit = o.cardFits ? o.cardFits[s] : null;
    boardParts.push(g({name: `${P}-card-${s}`, transform: 'translate(0 0) scale(1)', opacity: o.cardsIn ? 0 : 1},
      h('path', {d: roundRectPath(G.card[s].x + 3, G.card[s].y + 4, G.card[s].w, G.card[s].h, 7), fill: th.shadow}),
      plateParts(ctx, `${P}-card-${s}`, G.card[s], fit, kindOf(s), o.Ft, {bars: true, big: o.bigGlyph})));
  }
  parts.push(g({name: `${P}-board`, transform: 'translate(0 0)'}, boardParts));
  // the reading table with the apartados (numbered when text is shown)
  const tb = G.table;
  const keepTable = keep(tb);
  // (apartado numbers: at the text size, or — text-free rooms keyed to a shared panel — at `numFt`)
  const nF = o.Ft || o.numFt || 0;
  if (keepTable) {
    parts.push(g({name: `${P}-evidence`, transform: 'translate(0 0)'},
      planTable(ctx, {name: `${P}-table`, cx: tb.x + tb.w / 2, cy: tb.y + tb.h / 2, w: tb.w, h: tb.h, seedKey: 'reading-table'}),
      // (the neutral "located" frames: one per apartado the magnifier locates, the same for both labels — under the sheets)
      o.located ? G.exhibits.map((e, i) => (o.located.includes(i) ? locatedFrame(e, `${P}-loc${i}`) : null)) : null,
      G.exhibits.map((e, i) => g({name: `${P}-ex${i}`, transform: 'translate(0 0)', opacity: o.exIn ? 0 : 1},
        g({name: `${P}-exhibit${i}`, transform: T(e.cx, e.cy)}, sheetArt(ctx, e.s, !!nF)),
        // (the apartado's number, printed on its own sheet)
        nF ? g({name: `${P}-exnum${i}`},
          h('text', {x: r(e.cx), y: r(e.cy + nF * 0.36), 'font-family': FONT, 'font-size': r(nF, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(i + 1))) : null))));
  }
  // the lectern, the listeners' chairs
  const l = G.lectern;
  void l;
  R.listeners.forEach(i => { const s = G.seats[i]; if (keep(personBox(s))) parts.push(planChair(ctx, {name: `${P}-chair${i}`, cx: toWorld(s, {x: 0, y: 14}).x, cy: toWorld(s, {x: 0, y: 14}).y, deg: s.deg, s: 64})); });
  // the lines: one per apartado placed in a section, a start dot on the card's lower edge and the side's marker at the tip
  const linkNodes = [];
  const keepLinks = !o.noLinks && !o.keep;
  if (keepLinks) for (const s of sides) {
    G.links[s].forEach((lk, j) => {
      // (o.linkStyle: a supplied relation kind other than the plain one recolours the side's lines, never its marker)
      const ls = (o.linkStyle && o.linkStyle[s]) || {color: LINK.color, width: LINK.width};
      linkNodes.push(h('path', {name: `${P}-link-${s}${j}`, 'data-ex': String(lk.ex), 'data-full': 0, d: 'M0 0', fill: 'none', stroke: ls.color, 'stroke-width': ls.width, 'stroke-linecap': 'round', opacity: 0}));
      linkNodes.push(h('circle', {name: `${P}-link-${s}${j}-s`, cx: r(lk.from.x), cy: r(lk.from.y), r: LINK.dot, fill: ls.color, opacity: 0}));
      linkNodes.push(g({name: `${P}-link-${s}${j}-m`, transform: 'translate(0 0)', opacity: 0},
        h('circle', {cx: 0, cy: 0, r: r(LINK.glyph + 4), fill: '#ffffff', stroke: ls.color, 'stroke-width': 2}),
        stateGlyph(ctx, {name: `${P}-link-${s}${j}-g`, kind: kindOf(s), cx: 0, cy: 0, s: LINK.glyph * 0.72})));
    });
  }
  parts.push(g({name: `${P}-links`}, linkNodes));
  const rigs = R.speakers.map(sp => (keep(personBox(G.seats[sp.index])) ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null));
  parts.push(rigs.filter(Boolean).map(rg => rg.node));
  // the magnifier: lying on the table in front of the party (it is drawn over the party's hand only while carried —
  // from above, the lens is held out in front of the body)
  const lr0 = G.lupaRest;
  const lk = G.lupaK || 1;
  const keepLupa = keep({x: lr0.x - (LUPA.r + 6) * lk, y: lr0.y - (LUPA.r + 6) * lk, w: (LUPA.grip.x + LUPA.r + 18) * lk, h: (LUPA.grip.y + LUPA.r + 18) * lk});
  const LZ = 1.6;
  const copyOn = !!(nF && keepLupa && o.lupa !== false && !o.keep);
  if (keepLupa && o.lupa !== false) parts.push(g({name: `${P}-lupa-at`, transform: `translate(${r(lr0.x)} ${r(lr0.y)})`}, lupaArt(ctx, `${P}-lupa`, {k: lk, copy: copyOn ? {size: nF * LZ / LUPA.lift / lk} : null})));

  /**
   * @param {{clockDeg:number, reach?:any, draw?:{a?:number[], b?:number[]}, cardIn?:{a?:number,b?:number},
   *   cardScale?:{a?:number,b?:number}, tableScale?:number, textK?:number, cue?:number, exIn?:number,
   *   doc?:{x:number,y:number,s:number,op:number}, cardTextK?:any,
   *   datum?:{move:number, newIn:number, copy?:number, was?:number, dockK?:number}, personScale?:any}} st
   */
  function frame(st) {
    const nodes = {};
    Object.assign(nodes, door.frame(0));
    if (keepClock) Object.assign(nodes, clock.frame(st.clockDeg));
    const tk = st.textK ?? 1;
    // where a point of a card / of an apartado is drawn now (the card's or the table's scale): the lines follow their
    // card and their apartado exactly
    const cardMap = (s, p) => {
      const cb = G.card[s], sc = st.cardScale ? st.cardScale[s] ?? 1 : 1;
      const ccx = cb.x + cb.w / 2, ccy = cb.y + cb.h;
      return {x: ccx + (p.x - ccx) * sc, y: ccy + (p.y - ccy) * sc};
    };
    const exMap = (i0, p) => {
      const ts = st.tableScale ?? 1;
      const tcx = G.table.x + G.table.w / 2, tcy = G.table.y + G.table.h / 2;
      return {x: tcx + (p.x - tcx) * ts, y: tcy + (p.y - tcy) * ts};
    };
    for (const s of SIDES) {
      if (!keepCard[s]) continue;
      const cb = G.card[s];
      const inK = o.cardsIn ? clamp(st.cardIn ? st.cardIn[s] ?? 0 : 0) : 1;
      const sc = st.cardScale ? st.cardScale[s] ?? 1 : 1;
      let tr = 'translate(0 0)';
      if (o.cardsIn) {
        // (the card comes out of the open document, growing, to its place; st.cardFrom: where the document lies open)
        const q = ease.inOutCubic(inK);
        const a0 = st.cardFrom || G.docMid;
        const s0 = 0.18;
        const sx = lerp(s0, 1, q);
        const x0 = lerp(a0.x - cb.w * s0 * 0.5, cb.x, q), y0 = lerp(a0.y - cb.h * s0 * 0.5, cb.y, q);
        tr = `translate(${r(x0 - cb.x * sx)} ${r(y0 - cb.y * sx)}) scale(${r(sx, 4)})`;
      } else if (sc !== 1) {
        const ccx = cb.x + cb.w / 2, ccy = cb.y + cb.h;
        tr = `translate(${r(ccx * (1 - sc))} ${r(ccy * (1 - sc))}) scale(${r(sc, 4)})`;
      }
      nodes[`${P}-card-${s}`] = {transform: tr, opacity: r(o.cardsIn ? (inK > 0 ? 1 : 0) : 1, 3)};
      // (st.cardTextK: a card whose enlarged copy a lens holds hides its own text meanwhile — one copy at a time)
      const ck = st.cardTextK ? st.cardTextK[s] ?? 1 : 1;
      // (a card coming out of the document shows its text only once it is (nearly) at full size: never under the floor)
      if (o.cardFits && o.cardFits[s]) nodes[`${P}-card-${s}-text`] = {opacity: r((o.cardsIn ? tk * clamp((inK - 0.9) / 0.1) : tk) * ck, 3)};
      if (st.cardTextK) nodes[`${P}-card-${s}-g`] = {opacity: r(ck, 3)};
    }
    if (keepTable) {
      const ts = st.tableScale ?? 1;
      const tcx = G.table.x + G.table.w / 2, tcy = G.table.y + G.table.h / 2;
      nodes[`${P}-evidence`] = {transform: ts === 1 ? 'translate(0 0)' : `translate(${r(tcx - tcx * ts)} ${r(tcy - tcy * ts)}) scale(${r(ts, 4)})`};
      // (story: each apartado comes out of the open document to its place on the table, growing from half size)
      const xk = o.exIn ? clamp(st.exIn ?? 0) : 1;
      const q = ease.inOutCubic(xk);
      G.exhibits.forEach((e, i) => {
        if (o.exIn) {
          const sc = lerp(0.5, 1, q);
          const dx = (G.docMid.x - e.cx) * (1 - q), dy = (G.docMid.y - e.cy) * (1 - q);
          nodes[`${P}-ex${i}`] = {transform: `translate(${r(e.cx * (1 - sc) + dx, 3)} ${r(e.cy * (1 - sc) + dy, 3)}) scale(${r(sc, 4)})`, opacity: xk > 0 ? 1 : 0};
        } else nodes[`${P}-ex${i}`] = {transform: 'translate(0 0)', opacity: 1};
        // (the number shows once its sheet has landed: never under the text floor)
        if (nF) nodes[`${P}-exnum${i}`] = {opacity: r((o.Ft ? tk : 1) * (o.exIn ? clamp((xk - 0.92) / 0.08) : 1), 3)};
      });
    }
    // the document
    void 0;
    // reference plates and the datum (inspect)
    const dm = st.datum || null;
    const cue = clamp(st.cue ?? 0);
    if (G.refs && keepRefs.a && datum) {
      // (the context copy is hidden whole — text AND the plate's marker — while the lens holds the datum)
      nodes[`${P}-refs-a-mark`] = {opacity: r(dm ? clamp(dm.copy ?? 1) : 1, 3)};
    }
    if (G.refs && keepRefs.a && datum && datum.fits) {
      const copy = dm ? clamp(dm.copy ?? 1) : 1;
      const mv = dm ? ease.inOutCubic(clamp(dm.move)) : 0;
      const D = G.dock;
      const dx = D ? D.x + 10 - (G.refs.a.x + TX(gsR)) : 0;
      const dy = D ? D.y + 8 + datum.wasFit.height + datum.wasFit.size * 0.6 - (G.refs.a.y + padT(datum.fits.before)) : 0;
      nodes[`${P}-refs-a-v-before`] = {opacity: r(copy, 3), transform: `translate(${r(dx * mv)} ${r(dy * mv)})`};
      nodes[`${P}-refs-a-v-after`] = {opacity: r((dm ? clamp(dm.newIn) : 0) * copy, 3), transform: 'translate(0 0)'};
      if (D && keep(D)) {
        nodes[`${P}-dock`] = {opacity: r(clamp(dm ? dm.dockK ?? mv : 0) * copy, 3)};
        nodes[`${P}-was`] = {opacity: r(clamp(dm ? dm.was ?? mv : 0) * copy, 3)};
      }
    }
    if (G.refs && keepRefs.a && o.refMarks && !(datum && datum.fits) && G.linksAlt) {
      // (labels hidden: each of A's marks slides from its old sheet to its new one — only the changed one moves —; the
      // context copy is hidden with the datum's)
      const q = refSlots(G.refs.a, G.exhibits.length, gs);
      const p = dm ? ease.inOutCubic(clamp(dm.marks ?? 0)) : 0;
      const op = dm ? clamp(dm.copy ?? 1) : 1;
      G.links.a.forEach((lk, j) => {
        const to = G.linksAlt.a[j] ? G.linksAlt.a[j].ex : lk.ex;
        nodes[`${P}-rmk-a${j}`] = {cx: r(lerp(q.cx(lk.ex), q.cx(to), p)), cy: r(q.cy), opacity: r(op, 3)};
      });
    }
    if (G.refs && keepRefs.b && o.refsFits && o.refsFits.b) nodes[`${P}-refs-b-text`] = {opacity: r(tk, 3)};
    // links
    const tips = {a: [], b: []};
    if (keepLinks) for (const s of sides) {
      const dr = (st.draw && st.draw[s]) || [];
      G.links[s].forEach((lk0, j) => {
        let lk = lk0;
        if (G.linksAlt && cue > 0) {
          const alt = G.linksAlt[s][j];
          lk = {from: {x: lerp(lk0.from.x, alt.from.x, cue), y: lerp(lk0.from.y, alt.from.y, cue)}, to: {x: lerp(lk0.to.x, alt.to.x, cue), y: lerp(lk0.to.y, alt.to.y, cue)}};
        }
        const from = cardMap(s, lk.from);
        const to = exMap(lk0.ex, lk.to);
        const q = clamp(dr[j] ?? 0);
        const e = ease.inOutSine(q);
        const tip = {x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e)};
        tips[s][j] = tip;
        // (data-ex / data-full: the apartado this line lands on and whether it has landed — read by the anchoring checks)
        const exNow = !G.linksAlt || cue <= 0 ? lk0.ex : cue >= 1 ? G.linksAlt[s][j].ex : '';
        nodes[`${P}-link-${s}${j}`] = {opacity: q > 0 ? 1 : 0, d: `M${r(from.x)} ${r(from.y)}L${r(tip.x)} ${r(tip.y)}`, 'data-ex': String(exNow), 'data-full': q >= 1 ? 1 : 0};
        nodes[`${P}-link-${s}${j}-s`] = {opacity: q > 0 ? 1 : 0, cx: r(from.x), cy: r(from.y)};
        // (the marker shows once the tip has left the card's edge by more than its own radius: it never covers the card)
        const run = Math.hypot(tip.x - from.x, tip.y - from.y);
        nodes[`${P}-link-${s}${j}-m`] = {opacity: r(q > 0 ? clamp((run - LINK.glyph - 10) / 14) : 0, 3), transform: `translate(${r(tip.x)} ${r(tip.y)})`};
      });
    }
    // the located frames: each settles (from a little larger) as the magnifier stops over its apartado
    if (o.located && keepTable) for (const i of o.located) {
      const q = clamp(st.loc ? st.loc[i] ?? 0 : 0);
      const e = G.exhibits[i];
      const sc = 1 + 0.35 * (1 - ease.outCubic(q));
      nodes[`${P}-loc${i}`] = {opacity: r(q > 0 ? Math.min(1, q * 2) : 0, 3), transform: `translate(${r(e.cx * (1 - sc))} ${r(e.cy * (1 - sc))}) scale(${r(sc, 4)})`};
    }
    // the magnifier: at rest on the table, or carried (st.lupa: lens centre and lift scale)
    if (keepLupa && o.lupa !== false) {
      const lp = st.lupa || {x: lr0.x, y: lr0.y, s: 1};
      nodes[`${P}-lupa-at`] = {transform: `translate(${r(lp.x, 2)} ${r(lp.y, 2)})`};
      nodes[`${P}-lupa`] = {transform: `translate(0 0) scale(${r(lp.s * lk, 4)})`};
      nodes[`${P}-lupa-shadow`] = {transform: `translate(${r(3 + 6 * (lp.s - 1) / (LUPA.lift - 1 || 1), 2)} ${r(5 + 9 * (lp.s - 1) / (LUPA.lift - 1 || 1), 2)})`};
      if (copyOn) {
        // the sheet under the lens (only while lifted, over the middle of a sheet): its number is shown enlarged in the
        // lens, and the sheet's own number hides — one copy at a time
        const half = G.exhibits[0].s * EXW * 0.42;
        const under = lp.s > 1.0001 ? G.exhibits.findIndex(e => Math.abs(e.cx - lp.x) < half) : -1;
        if (under >= 0) {
          const e = G.exhibits[under];
          nodes[`${P}-lupa-num`] = {text: String(under + 1), opacity: 1, x: r((e.cx - lp.x) * LZ / (lp.s * lk), 2), y: r(((e.cy - lp.y) * LZ + nF * 0.36 * LZ) / (lp.s * lk), 2)};
        } else nodes[`${P}-lupa-num`] = {text: '', opacity: 0, x: 0, y: 0};
        G.exhibits.forEach((_, i) => { if (i === under) nodes[`${P}-exnum${i}`] = {...(nodes[`${P}-exnum${i}`] || {}), opacity: 0}; });
      }
    }
    // people: everybody stays in place, except the party with the magnifier, who walks along the table's lower edge
    // while carrying it (st.readerX); its hand goes to the magnifier's grip when supplied
    let reached = true;
    const hands = [];
    rigs.forEach((rg, i) => {
      if (!rg) return;
      const s = G.seats[i];
      const ps = st.personScale ? st.personScale[i] ?? 1 : 1;
      const px0 = s.standing && st.readerX !== undefined ? st.readerX : s.x;
      const pose = {x: px0, y: s.y, deg: s.deg, seated: s.standing ? 0 : 1, scale: ps};
      Object.assign(nodes, rg.pose(pose));
      const rc = s.standing && st.reach ? st.reach : null;
      const rr = reachRecords({name: `${P}-p${i}`}, pose, rc ? rc.target : pose, {k: rc ? rc.k : 0, arm: G.aim.arm});
      if (s.standing) Object.assign(nodes, rr.nodes);
      if (rc && !rr.reached && rc.k > 0) reached = false;
      hands[i] = rr.hand;
    });
    return {nodes, reached, hands, tips, cardMap, exMap};
  }
  return {node: g({name: `${P}-room`}, parts), frame, rigs, clock};
}

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

/**
 * Timing (u) of the lines inside [t0, t1]: the j-th line of A and the j-th line of B in the same window (equal pace, no
 * order between the sides); `together`: every line in one window.
 */
export function imTiming(t0, t1, n, {together = false} = {}) {
  const L = t1 - t0;
  const at = f => t0 + L * f;
  const nn = Math.max(1, n);
  if (together) return {windows: Array.from({length: nn}, () => [at(0.04), at(0.96)]), t0, t1};
  const d0 = at(0.16), d1 = at(0.9);
  const span = (d1 - d0) / nn;
  const windows = Array.from({length: nn}, (_, j) => [d0 + j * span, d0 + j * span + span * 0.82]);
  return {windows, t0, t1};
}

/** Each line's drawing progress at u (the same for both sides at every u). */
export function imDrawAt(G, TM, u, o = {}) {
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  const sides = o.sides || SIDES;
  const draw = {a: [], b: []};
  for (const s of SIDES) {
    const on = sides.includes(s);
    G.links[s].forEach((_, j) => { draw[s][j] = on ? pos(u, ...(TM.windows[j] || TM.windows[TM.windows.length - 1])) : 0; });
  }
  const all = sides.flatMap(s => draw[s]);
  const state = !all.length ? 'none' : all.every(q => q >= 1) ? 'linked' : all.some(q => q > 0) ? 'linking' : 'none';
  return {draw, state};
}

/**
 * The located apartados: every apartado either label is attached to (as supplied), in table order — the magnifier
 * stops over each of them once, whichever label it gets.
 */
export function locatedOf(G, sets = ['links']) {
  const out = new Set();
  for (const key of sets) if (G[key]) for (const s of SIDES) for (const lk of G[key][s]) out.add(lk.ex);
  return [...out].sort((a, b) => a - b);
}

/**
 * The magnifier's action at u (template units): the party's hand goes to the grip (`reach`), lifts the magnifier
 * (`lift`), carries it along the table's lower edge so that the lens passes over the apartados from the first to the
 * last and back (`scan`) — stopping over each located apartado while its frame settles —, lays it back on its rest
 * (`put`) and lets go (`release`). The party walks with it: its x follows the lens (CARRY_DX to its left); only the
 * party moves, never anybody else.
 * @param {any} G imGeometry()
 * @param {number[]} located indices of the located apartados
 * @param {{reach:number[], lift:number[], scan:number[], put:number[], release:number[]}} Wn windows (u)
 */
export function imScan(G, located, Wn, u, {sweep = true} = {}) {
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  const e = ease.inOutCubic;
  const rest = G.lupaRest;
  const xs = G.exhibits.map(q => q.cx);
  // waypoints: the rest, the first sheet, every located sheet, the last sheet, the rest again (pauses at located ones)
  const stops = [{x: rest.x, p: 0}];
  const add = (x, pause, i) => { const last = stops[stops.length - 1]; if (Math.abs(last.x - x) < 0.5) { if (pause) { last.p = 1; last.i = i; } return; } stops.push({x, p: pause ? 1 : 0, i}); };
  // (sweep: over every apartado, first to last; otherwise straight to the located ones, in table order)
  if (sweep) {
    add(xs[0], located.includes(0), 0);
    for (let i = 1; i < xs.length - 1; i++) if (located.includes(i)) add(xs[i], true, i);
    add(xs[xs.length - 1], located.includes(xs.length - 1), xs.length - 1);
  } else for (const i of [...located].sort((a, b) => a - b)) add(xs[i], true, i);
  add(rest.x, false);
  const [t0, t1] = Wn.scan;
  const T = t1 - t0;
  const nP = stops.filter(q => q.p).length;
  const pauseT = Math.min(0.045, (T * 0.42) / Math.max(1, nP));
  let dist = 0;
  for (let j = 1; j < stops.length; j++) dist += Math.abs(stops[j].x - stops[j - 1].x);
  const moveT = T - pauseT * nP;
  // the timeline of the scan: [start, end] of every move and pause
  const plan = [];
  let t = t0;
  for (let j = 0; j < stops.length; j++) {
    if (j > 0) { const d = Math.abs(stops[j].x - stops[j - 1].x); const dt = moveT * (d / Math.max(1e-9, dist)); plan.push({kind: 'move', a: stops[j - 1].x, b: stops[j].x, t0: t, t1: t + dt}); t += dt; }
    if (stops[j].p) { plan.push({kind: 'pause', x: stops[j].x, i: stops[j].i, t0: t, t1: t + pauseT}); t += pauseT; }
  }
  let x = rest.x;
  const loc = {};
  let state = u < Wn.scan[0] ? 'before' : 'after';
  let over = null;
  for (const st of plan) {
    if (st.kind === 'pause') {
      loc[st.i] = pos(u, st.t0 + (st.t1 - st.t0) * 0.15, st.t1 - (st.t1 - st.t0) * 0.1);
      if (u >= st.t0) x = st.x;
      if (u >= st.t0 && u < st.t1) { state = 'locating'; over = st.i; }
    } else if (u >= st.t0) {
      // (a gentle walk: sine easing — its peak speed is ~1.6× the mean, not 3× as with a cubic)
      const q = ease.inOutSine(pos(u, st.t0, st.t1));
      x = lerp(st.a, st.b, q);
      if (u < st.t1) state = 'scanning';
    }
  }
  if (u >= t1) x = rest.x;
  const k = e(pos(u, ...Wn.reach)) * (1 - e(pos(u, ...Wn.release)));
  const carry = e(pos(u, ...Wn.lift)) * (1 - e(pos(u, ...Wn.put)));
  const lens = {x, y: rest.y, s: lerp(1, LUPA.lift, carry)};
  const readerX = lerp(G.restX ?? G.Cx, x - CARRY_DX, carry);
  const lk = G.lupaK || 1;
  const grip = {x: lens.x + LUPA.grip.x * lens.s * lk, y: lens.y + LUPA.grip.y * lens.s * lk};
  const phase = u < Wn.reach[0] ? 'rest' : u < Wn.lift[0] ? 'reaching' : u < Wn.scan[0] ? 'lifting' : u < Wn.scan[1] ? state : u < Wn.put[1] ? 'laying' : u < Wn.release[1] ? 'releasing' : 'laid';
  return {lens, readerX, carry, k, reach: k > 0 ? {target: grip, k} : null, loc, phase, over, plan};
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its chips (design units)   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolveIm()
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {number} F label text size (design units)
 * @param {{scale?:number, chips?:boolean, text?:boolean, align?:any, refs?:{a:{before:string, after:string}, b:string}|null,
 *   wasText?:string, marker?:boolean, extraH?:number, chipMaxW?:number, exStep?:number, extraGap?:number, linksAlt?:any,
 *   numbers?:boolean, linkGap?:number, cardLines?:number, cardText?:boolean, exK?:number, lupaK?:number, lupaDx?:number}} [o]
 *   plateH (opt-in): the height of a text-free section card (template units);
 *   restAtLupa (opt-in): the party's place is right below the magnifier's rest (off the axis for an odd sheet count);
 *   calFree (opt-in): the wall calendar moves to a free top corner when the table reaches its place;
 *   doorTop (opt-in): the door in the top wall right of the board (when it fits) instead of the bottom wall;
 *   walkNarrow (opt-in): the party's travelling chip uses only the narrow variants the walk was sized for;
 *   walkPad (opt-in, design units): extra room at both ends of the party's walk, for its travelling chip;
 *   crop (opt-in): the room keeps the size its content needs (no empty floor added to match the box's shape); a number:
 *   at most that many times its need in each direction
 */
export function composeIm(ctx, P, R, box, F, o = {}) {
  const t = WALL;
  const sc = o.scale ?? 1;
  const ar = box.w / box.h;
  const withText = o.text !== false;
  const geoAt = (W, H, k) => {
    const Ft = F / k;
    const lone = f => f.lines.length > 1 && f.lines.some(ln => ln.trim().split(/\s+/).length === 1);
    const maxL = o.cardLines ?? (ar < 1.05 ? 5 : ar > 2.2 ? 1 : ar > 1.9 ? 2 : 3);
    const fitAt = (text, maxW, mL = maxL, sz = Ft) => {
      let f = null, first = null;
      for (const q of [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.35, 1.5, 1.7, 1.9, 2.2, 2.5, 2.8, 3.4, 4.2]) {
        if (q < 0.7 && mL < 3) continue;
        f = fitIm(text, {maxWidth: Math.max(maxW * q, sz * 4), size: sz, minSize: sz, maxLines: 6, weight: 600});
        if (f.truncated) continue;
        if (!first) first = f;
        if (!lone(f) && f.lines.length <= mL) return f;
      }
      return first || f;
    };
    const plateW = clamp(Ft * 9.5, 180, 260);
    // (o.cardText false: text-free section cards — placeholder bars only — whose headings an entry lists elsewhere)
    let cardFits = withText && o.cardText !== false ? {a: fitAt(R.args.a.text, plateW), b: fitAt(R.args.b.text, plateW)} : null;
    // (one line only while it stays a moderate width; long headings take two)
    if (cardFits && maxL === 1 && Math.max(cardFits.a.width, cardFits.b.width) > Ft * 21) cardFits = {a: fitAt(R.args.a.text, plateW, 2), b: fitAt(R.args.b.text, plateW, 2)};
    // (the two section headings take the same number of lines: equal weight)
    if (cardFits && cardFits.a.lines.length !== cardFits.b.lines.length) {
      const nL = Math.max(cardFits.a.lines.length, cardFits.b.lines.length);
      for (const s of SIDES) if (cardFits[s].lines.length < nL) { const f2 = fitAt(R.args[s].text, plateW, nL); if (!f2.truncated) cardFits[s] = f2; }
    }
    let refsFits = null, dockH = 0, dockW = 0, wasFit = null, recFit = null;
    if (o.refs) {
      if (withText) {
        const rL = o.refsLines ?? (ar > 1.9 ? 2 : 3);
        // (opt-in o.refsSize: the reference plates' text at that multiple of the text size — the dock's record of the old
        // value, o.dockRecord, stays at the text size, so the dock is sized for it)
        const rs = o.refsSize ?? 1;
        const fR = (text, mL) => (rs === 1 ? fitAt(text, plateW, mL) : fitAt(text, plateW * rs, mL, Ft * rs));
        refsFits = {a: {before: fR(o.refs.a.before, rL), after: fR(o.refs.a.after, rL)}, b: fR(o.refs.b, rL)};
        const fa = refsFits.a;
        refsFits.a = {...fa, width: Math.max(fa.before.width, fa.after.width), height: Math.max(fa.before.height, fa.after.height), size: fa.before.size};
        wasFit = fitG(o.wasText || 'was', {maxWidth: 200, size: Ft, minSize: Ft, maxLines: 1, weight: 500});
        recFit = fa.before;
        if (o.dockRecord) {
          // (the record wraps to the plate's width — its "was" before it when inline —: as few lines as it can, none a
          // single word)
          const gs0 = (fa.before.size || Ft) * 0.32;
          const plateWd = TX(gs0) + Math.max(fa.before.width, fa.after.width, refsFits.b.width) * 1.06 + 16;
          const room = Math.max(Ft * 4, plateWd - 20 - (o.dockInline ? wasFit.width + Ft * 0.5 : 0));
          recFit = null;
          for (const q of [1, 0.92, 0.84, 0.76, 0.68, 0.6, 1.15, 1.3, 1.5, 1.8]) {
            const f = fitIm(o.refs.a.before, {maxWidth: room * q, size: Ft, minSize: Ft, maxLines: 6, weight: 600});
            if (f.truncated) continue;
            if (!hasLoneWord(f)) { recFit = f; break; }
            if (!recFit) recFit = f;
          }
          if (!recFit) recFit = fitAt(o.refs.a.before, plateW, rL);
        }
        // (opt-in o.dockInline: "was" stands before the record, on its first line, instead of above it)
        dockH = o.dockInline ? Math.max(wasFit.height, recFit.height) + 18 : wasFit.height + Ft * 0.6 + recFit.height + 18;
        dockW = o.dockInline ? wasFit.width + Ft * 0.5 + recFit.width + 20 : Math.max(wasFit.width, recFit.width) + 20;
      } else {
        refsFits = {a: null, b: null};
        dockH = 30;
      }
    }
    // (the participant chips' height, so the floor under the reader holds the reader's chip)
    const chipH = o.chips ? Math.max(...R.speakers.map(sp => Math.min(...[o.chipMaxW ?? 340, (o.chipMaxW ?? 340) * 0.8, (o.chipMaxW ?? 340) * 0.64].map(mw => measureSpeakerChip(sp, 0, F, mw, {seqDisc: false, maxLines: 4})).filter(m => !m.truncated && !hasLoneWord(m.label)).map(m => m.h).concat([1e9])))) / k : 0;
    // (the party's chip width: the narrowest clean variant — the room keeps it inside at both ends of the walk)
    const chipW = o.chips && o.walk ? Math.min(...[o.chipMaxW ?? 340, (o.chipMaxW ?? 340) * 0.8, (o.chipMaxW ?? 340) * 0.64, (o.chipMaxW ?? 340) * 0.52].map(mw => measureSpeakerChip(R.speakers[R.reader], 0, F, mw, {seqDisc: false, maxLines: 4})).filter(m => !m.truncated && !hasLoneWord(m.label)).map(m => m.w).concat([1e9])) / k : 0;
    // (walkNarrow: the room's floor under the party holds the narrow chip the party carries along its walk)
    let chipHw = chipH;
    if (o.walkNarrow && o.chips && chipW < 1e8) {
      const vn = [o.chipMaxW ?? 340, (o.chipMaxW ?? 340) * 0.8, (o.chipMaxW ?? 340) * 0.64, (o.chipMaxW ?? 340) * 0.52].map(mw => measureSpeakerChip(R.speakers[R.reader], 0, F, mw, {seqDisc: false, maxLines: 4})).filter(m => !m.truncated && !hasLoneWord(m.label) && m.w / k <= chipW + 1e-6);
      if (vn.length) chipHw = Math.max(chipH < 1e8 ? chipH : 0, Math.max(...vn.map(m => m.h)) / k);
    }
    const G = imGeometry(W, H, R, {walk: !!o.walk, chipW: chipW < 1e8 ? chipW : 0, chipH: chipHw < 1e8 ? chipHw : 0, cardFits, refsFits: o.refs ? refsFits : null, dockH, dockW, linkGap: o.linkGap, Ft: withText ? Ft : null, numFt: o.numbers ? Ft : 0, noChips: !o.chips, markR: o.marker ? (withText ? Ft * 2 : 60) : 0, exStep: o.exStep, extraGap: o.extraGap, linksAlt: o.linksAlt, exK: o.exK, lupaK: o.lupaK, lupaDx: o.lupaDx, walkPad: o.walkPad ? o.walkPad / k : 0, doorTop: o.doorTop, calFree: o.calFree, restAtLupa: o.restAtLupa, plateH: o.plateH});
    G.Ft = withText ? Ft : null;
    G.chipWalkW = chipW < 1e8 ? chipW : 0;
    G.numFt = o.numbers ? Ft : 0;
    G.cardFits = cardFits;
    G.refsFits = refsFits;
    G.refsFitsAB = refsFits && refsFits.a && refsFits.a.before ? {before: refsFits.a.before, after: refsFits.a.after} : null;
    G.wasFit = wasFit;
    G.recFit = recFit;
    return G;
  };
  // (the scale never falls so low that a text size in room units leaves the range a canvas font accepts: a degenerate
  // box — negative or near-zero — would otherwise set an invalid font, and the shared measure cache would keep a width
  // taken in whatever font was set before, making later layouts depend on history)
  const kMin = Math.max(1e-6, F / 2000);
  const kOk = q => (Number.isFinite(q) && q > kMin ? q : kMin);
  let k = kOk(box.w / 1200), G = null, W = 0, H = 0;
  // (the room takes the box's shape — the spare floor goes to the links — unless o.crop: then it keeps the size its
  // content needs, or at most o.crop times it in each direction when o.crop is a number)
  const cropK = o.crop === true ? 1 : o.crop || 0;
  const fill = () => {
    const W0 = W, H0 = H;
    if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
    if (cropK) { W = Math.min(W, W0 * cropK); H = Math.min(H, H0 * cropK); }
  };
  for (let it = 0; it < 4; it++) {
    const G0 = geoAt(2000, 2000, k);
    W = Math.max(G0.needW * sc, 520 * sc);
    H = Math.max(G0.needH * sc + (o.extraH || 0), 400 * sc);
    fill();
    const k2 = kOk(Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t)));
    if (Math.abs(k2 - k) < 1e-4) { k = k2; break; }
    k = k2;
  }
  G = geoAt(W, H, k);
  for (let it = 0; it < 10 && (G.problems.includes('room-width') || G.problems.includes('room-height')); it++) {
    W = Math.max(W, G.needW + 1);
    H = Math.max(H, G.needH + 1);
    fill();
    k = kOk(Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t)));
    G = geoAt(W, H, k);
  }
  const E = G.extents;
  const al = o.align || {x: 0.5, y: 0.5};
  const ox = box.x + (box.w - E.w * k) * al.x - E.x * k;
  const oy = box.y + (box.h - E.h * k) * al.y - E.y * k;
  const toD = mapper(ox, oy, k);
  const bD = mapBox(ox, oy, k);
  const problems = [...G.problems];
  for (const f of [G.cardFits && G.cardFits.a, G.cardFits && G.cardFits.b]) if (f && f.truncated) problems.push('plate-text');
  // a line never crosses a person or the lectern: the lines run from the board to the table only
  const rad = PERSON.half * k;
  const people = R.speakers.map(sp => ({...toD(G.seats[sp.index]), rad: rad + 4}));
  for (const key of ['links', 'linksAlt']) {
    if (!G[key]) continue;
    for (const s of SIDES) for (const lk of G[key][s]) {
      for (const sp of R.speakers) {
        const q = G.seats[sp.index];
        for (let i = 0; i <= 20; i++) {
          const x = lerp(lk.from.x, lk.to.x, i / 20), y = lerp(lk.from.y, lk.to.y, i / 20);
          if (Math.hypot(x - q.x, y - q.y) < PERSON.half + 6) { problems.push('link-over-person'); break; }
        }
      }
      const l2 = G.lectern;
      for (let i = 0; i <= 20; i++) {
        const x = lerp(lk.from.x, lk.to.x, i / 20), y = lerp(lk.from.y, lk.to.y, i / 20);
        if (Math.hypot(x - l2.cx, y - l2.cy) < 40) { problems.push('link-over-lectern'); break; }
      }
    }
  }
  const bounds = {x: ox + 10 * k, y: oy + 10 * k, w: (W - 20) * k, h: (H - 20) * k};
  const equip = [...imObstacles(G), ...linkSamples(G, ['links', 'linksAlt'])].map(bD);
  const chips = [];
  const chipMaxW = o.chipMaxW ?? 340;
  if (o.chips) {
    const widths = [chipMaxW, chipMaxW * 0.8, chipMaxW * 0.64, chipMaxW * 0.52, chipMaxW * 0.44];
    const vs = R.speakers.map(sp => { const all = widths.map(mw => measureSpeakerChip(sp, 0, F, mw, {seqDisc: false, maxLines: 4})).filter(m => !m.truncated); const clean = all.filter(m => !hasLoneWord(m.label)); return clean.length ? clean : all; });
    if (vs.some(v => !v.length)) problems.push('chip-truncated');
    const owners = R.speakers.map(sp => toD(G.seats[sp.index]));
    const items = R.speakers.map(sp => {
      const i = sp.index;
      return {key: `sp${i}`, i, variants: (vs[i].length ? vs[i] : [measureSpeakerChip(sp, 0, F, chipMaxW, {seqDisc: false, maxLines: 6})]).map(m => ({w: m.w, h: m.h, m})), at: toD(G.seats[i]), rad, rim: rad * 0.84, prefer: G.seats[i].angle, owners, maxGap: 56};
    });
    if (o.walk) {
      // (the walking party's chip first; then the others' chips keep off the lane the party and its chip sweep — its
      // body and arms, its chip and the chip's leader — at every point of the walk)
      const ri = items.findIndex(it => it.i === R.reader);
      // (opt-in walkNarrow: the party's chip takes only the variants the room's walk was sized for)
      if (o.walkNarrow && G.chipWalkW) { const vn = items[ri].variants.filter(v => v.w <= G.chipWalkW * k + 0.5); if (vn.length) items[ri] = {...items[ri], variants: vn}; }
      const r0 = placeLabels([items[ri]], {bounds, circles: people, boxes: equip, placed: []});
      chips[R.reader] = r0.labels[0];
      for (const f of r0.fails) problems.push(`chip-${f}`);
      const d0 = (G.walk.min - G.restX) * k, d1 = (G.walk.max - G.restX) * k;
      const pc = people[R.reader];
      const lane = [{x: pc.x + d0 - pc.rad - 20 * k, y: pc.y - pc.rad, w: d1 - d0 + 2 * pc.rad + 40 * k, h: 2 * pc.rad}];
      const cb = chips[R.reader] && chips[R.reader].box;
      if (cb) lane.push({x: Math.min(cb.x, pc.x - 4) + d0, y: Math.min(cb.y, pc.y), w: Math.max(cb.x + cb.w, pc.x + 4) - Math.min(cb.x, pc.x - 4) + d1 - d0, h: Math.max(cb.y + cb.h, pc.y) - Math.min(cb.y, pc.y)});
      const rest = items.filter(it => it.i !== R.reader);
      const r1 = placeLabels(rest, {bounds, circles: people, boxes: [...equip, ...lane], placed: cb ? [cb] : []});
      rest.forEach((it, j) => { chips[it.i] = r1.labels[j]; });
      for (const f of r1.fails) problems.push(`chip-${f}`);
    } else {
      const res = placeLabels(items, {bounds, circles: people, boxes: equip, placed: []});
      items.forEach((it, j) => { chips[it.i] = res.labels[j]; });
      for (const f of res.fails) problems.push(`chip-${f}`);
    }
    // (o.walk: the party carries the magnifier along the table and its chip travels with it — at every point of the
    // walk the chip stays inside the room, off the room's equipment, off the other people and their chips)
    const ch = chips[R.reader];
    if (o.walk && ch) {
      const others = R.speakers.filter(sp => sp.index !== R.reader);
      for (let q = 0; q <= 1.0001; q += 0.05) {
        const dx = (lerp(G.walk.min, G.walk.max, q) - G.restX) * k;
        const b = {x: ch.box.x + dx, y: ch.box.y, w: ch.box.w, h: ch.box.h};
        const hit = (a, c, pad = 6) => a.x < c.x + c.w + pad && c.x < a.x + a.w + pad && a.y < c.y + c.h + pad && c.y < a.y + a.h + pad;
        if (b.x < bounds.x || b.x + b.w > bounds.x + bounds.w) { problems.push('chip-walk-out'); break; }
        if (equip.some(e => hit(b, e, 4))) { problems.push('chip-walk-equip'); break; }
        if (others.some(sp => { const c = people[sp.index]; return hit(b, {x: c.x - c.rad, y: c.y - c.rad, w: 2 * c.rad, h: 2 * c.rad}); })) { problems.push('chip-walk-person'); break; }
        if (others.some(sp => chips[sp.index] && hit(b, chips[sp.index].box))) { problems.push('chip-walk-chip'); break; }
      }
    }
  }
  return {F, k, W, H, G, E, ox, oy, toD, bD, chips, problems, rad, box, people, equip, bounds,
    planRect: {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k}};
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/** Legend rows: ● / ◆ (equal weight) and the numbered apartados. */
export function imRows(R, P, prefix = 'lg', o = {}) {
  const rows = [];
  rows.push({kind: 'legend', glyphKind: 'started', text: P.states.a, name: `${prefix}-a`});
  rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.b, name: `${prefix}-b`});
  if (o.exhibits !== false) R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'para', seqNumber: String(i + 1), text: tx, name: `${prefix}-ex${i}`}));
  return rows;
}

/** Panel row node: this motif's glyphs (sections, apartados, lectern, board, table, link kinds), else the shared rows. */
export function imRowNode(ctx, m, o = {}) {
  const KINDS = ['secA', 'secB', 'para', 'lupa', 'calendar', 'located', 'board', 'table', 'kind-relation', 'kind-communication', 'kind-sequence', 'kind-causal', 'room'];
  if (m.kind === 'legend' && KINDS.includes(m.glyphKind)) {
    const th = ctx.theme;
    const c = hearingColors(ctx);
    const s = m.glyph;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    if (m.glyphKind === 'secA' || m.glyphKind === 'secB') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.44), y: r(-s * 0.26), width: r(s * 0.88), height: r(s * 0.52), rx: 4, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
        stateGlyph(ctx, {kind: m.glyphKind === 'secA' ? 'dot' : 'diamond', cx: -s * 0.24, cy: 0, s: s * 0.11, fill: INK}),
        h('path', {d: `M${r(-s * 0.06)} ${r(-s * 0.08)}H${r(s * 0.34)}M${r(-s * 0.06)} ${r(s * 0.1)}H${r(s * 0.22)}`, stroke: '#9aa4ae', 'stroke-width': 2, 'stroke-linecap': 'round'}));
    } else if (m.glyphKind === 'para') {
      // (an apartado: a sheet with its number, dark ink on white)
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.3), y: r(-s * 0.4), width: r(s * 0.6), height: r(s * 0.8), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
        h('text', {x: 0, y: r(m.fit.size * 0.35), 'font-family': FONT, 'font-size': r(m.fit.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, m.seqNumber || ''));
    } else if (m.glyphKind === 'lupa') {
      // (the magnifier: ring, glass and handle)
      glyph = g({transform: T(gx, gy)},
        h('line', {x1: r(s * 0.08), y1: r(s * 0.08), x2: r(s * 0.38), y2: r(s * 0.38), stroke: '#2b2f36', 'stroke-width': r(s * 0.13), 'stroke-linecap': 'round'}),
        h('circle', {cx: r(-s * 0.1), cy: r(-s * 0.1), r: r(s * 0.25), fill: '#cfe4f2', stroke: '#2b2f36', 'stroke-width': r(s * 0.07)}));
    } else if (m.glyphKind === 'calendar') {
      // (a blank wall calendar: header band and an empty grid; no date marked)
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.34), y: r(-s * 0.38), width: r(s * 0.68), height: r(s * 0.76), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.34), y: r(-s * 0.38), width: r(s * 0.68), height: r(s * 0.2), rx: 3, fill: '#9aa4ae', stroke: INK, 'stroke-width': 1.4}),
        h('path', {d: `M${r(-s * 0.12)} ${r(-s * 0.14)}V${r(s * 0.32)}M${r(s * 0.12)} ${r(-s * 0.14)}V${r(s * 0.32)}M${r(-s * 0.28)} ${r(s * 0.1)}H${r(s * 0.28)}`, stroke: '#b9c1c9', 'stroke-width': 1.4}));
    } else if (m.glyphKind === 'located') {
      // (the neutral "located" frame round a sheet)
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.2), y: r(-s * 0.27), width: r(s * 0.4), height: r(s * 0.54), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.6}),
        h('path', {d: `M${r(-s * 0.24)} ${r(-s * 0.3)}H${r(-s * 0.34)}V${r(s * 0.36)}H${r(-s * 0.22)}M${r(s * 0.24)} ${r(-s * 0.3)}H${r(s * 0.34)}V${r(s * 0.36)}H${r(s * 0.22)}`, fill: 'none', stroke: LINK.color, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    } else if (m.glyphKind === 'board') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.46), y: r(-s * 0.26), width: r(s * 0.92), height: r(s * 0.52), rx: 4, fill: '#e9edf1', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.38), y: r(-s * 0.15), width: r(s * 0.34), height: r(s * 0.3), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.2}),
        h('rect', {x: r(s * 0.04), y: r(-s * 0.15), width: r(s * 0.34), height: r(s * 0.3), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.2}));
    } else if (m.glyphKind === 'table') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.46), y: r(-s * 0.24), width: r(s * 0.92), height: r(s * 0.48), rx: 4, fill: c.wood, stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.3), y: r(-s * 0.15), width: r(s * 0.16), height: r(s * 0.22), rx: 1.5, fill: '#ffffff', stroke: INK, 'stroke-width': 1.2}),
        h('rect', {x: r(s * 0.1), y: r(-s * 0.15), width: r(s * 0.16), height: r(s * 0.22), rx: 1.5, fill: '#ffffff', stroke: INK, 'stroke-width': 1.2}));
    } else if (m.glyphKind === 'room') {
      glyph = g({transform: T(gx, gy)}, h('rect', {x: r(-s * 0.42), y: r(-s * 0.3), width: r(s * 0.84), height: r(s * 0.6), rx: 3, fill: '#f4efe6', stroke: '#5b6470', 'stroke-width': 3.2}));
    } else {
      const kind = m.glyphKind.slice(5);
      const col = linkColor(th, kind);
      const x0 = -s * 0.42, x1 = s * 0.42;
      const ends = kind === 'relation' ? [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('circle', {cx: r(x1), cy: 0, r: 3.6, fill: col})]
        : kind === 'communication' ? [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('circle', {cx: r(x1), cy: 0, r: 4.4, fill: th.card, stroke: col, 'stroke-width': 2.2})]
          : kind === 'sequence' ? [h('rect', {x: r(x0 - 3.5), y: -3.5, width: 7, height: 7, fill: col}), h('rect', {x: r(x1 - 3.5), y: -3.5, width: 7, height: 7, fill: col})]
            : [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('path', {d: `M${r(x1 + 2)} 0L${r(x1 - 9)} -6L${r(x1 - 9)} 6Z`, fill: col})];
      glyph = g({transform: T(gx, gy)}, h('path', {d: `M${r(x0)} 0H${r(x1)}`, stroke: col, 'stroke-width': 3.4, 'stroke-linecap': 'round'}), ends);
    }
    return g({name: o.name}, glyph, textAt(m.fit, m.x + m.glyph + m.fit.size * 0.6, m.y + Math.max(0, (m.h - m.fit.height) / 2), th.fg));
  }
  return rowNode(ctx, m, o);
}

/** Line colour of a relation kind (mechanism). */
export function linkColor(th, kind) {
  return kind === 'relation' ? LINK.color : kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.accent4 : th.ink;
}

export {legendGlyph};

/* ------------------------------------------------------------------ */
/* Panel rows without one-word lines; arrangement search               */
/* ------------------------------------------------------------------ */

/**
 * This motif's word glue (U+00A0, honoured by the shared whole-word fit): numbers stay with the word before them
 * ("Apartado 1"); a number never ends a line before its unit; a lone capital letter stays with the word BEFORE it; a
 * short lower-case word (1–2 letters: "of", "de", "a") travels with the next word; a separator (·, –) stays at the end
 * of the line before it; a short bracketed tag ("(texto aportado)", "(as supplied)", "(según lo aportado)") stays in
 * one piece; the last two short groups stay together (no widow).
 */
export function imGlue(text, {lead = true} = {}) {
  return String(text ?? '')
    .replace(/(\S)\s+(\d[\d.,:]*[)\]]?)(?=[\s,.;:)]|$)/g, '$1 $2')
    .replace(/(\d[\d.,]*)[ \t]+(mm|cm|m|km|m²|km²|ha|mg|g|kg|t|ml|l|s|min|h|d|%|‰|°C|°|€|\$|£)(?=[\s,.;:)]|$)/g, '$1 $2')
    .replace(/(\S)\s+([A-ZÁÉÍÓÚÑ])(?=[\s,.;:)]|$)/g, '$1 $2')
    .replace(/(^|\s)(\p{Ll}{1,2})\s+(?=\S)/gu, '$1$2 ')
    .replace(/(\S)\s+([·–—])\s+/g, '$1 $2 ')
    .replace(/\([^()]{1,24}\)/g, m0 => m0.replace(/\s+/g, ' '))
    // (a single leading word never stays alone before its bracketed tag: "Fundamentos (texto suministrado)")
    .replace(/^(\S{1,14})\s+(\([^()]{1,24}\))/, (m0, a, b) => (lead ? `${a}\u00a0${b.replace(/\s+/g, '\u00a0')}` : m0))
    // (no widow: the last two groups travel together when they are short — unless a single word would be left before them)
    .replace(/^(.*[^ \t])[ \t]+([^ \t]+)[ \t]+([^ \t]+)$/s, (m0, a, b, c) => ((b + c).length <= 24 && /[ \t]/.test(a.trim()) ? `${a} ${b} ${c}` : m0));
}

/** Whole-word fit with this motif's glue; a box is never narrower than its widest glued group (measured). */
export function fitIm(text, o) {
  const sz = o.minSize ?? o.size;
  const needOf = t => Math.max(0, ...t.split(/[ \t\n]+/).filter(Boolean).map(w => measure(w.replace(/\u00a0/g, ' '), sz, o.weight ?? 600, 'sans')));
  let t = imGlue(text);
  let need = needOf(t);
  // (the leading word stays with its bracketed tag only while that group fits the box)
  if (need > o.maxWidth + 0.5) { const t2 = imGlue(text, {lead: false}); const n2 = needOf(t2); if (n2 < need) { t = t2; need = n2; } }
  return fitWords(t, {...o, maxWidth: Math.max(o.maxWidth, need + 0.5)});
}

/** Panel row measure (the shared row kinds, ./apertura-audiencia.js `measureRow`) with this motif's glue. */
export function measureRowG(row, F, w) {
  const glyph = F * 1.9;
  if (row.kind === 'heading' || row.kind === 'state') {
    const padX = F * 0.6, padY = F * 0.36;
    const fit = fitIm(row.text, {maxWidth: w - padX * 2, size: F, minSize: F, maxLines: 4, weight: 700});
    return {...row, fit, h: fit.height + padY * 2, w: fit.width + padX * 2, padX, padY};
  }
  if (row.kind === 'legend' || row.kind === 'note') {
    const fit = fitIm(row.text, {maxWidth: w - glyph - F * 0.6, size: F, minSize: F, maxLines: 5, weight: 500});
    return {...row, fit, glyph, h: Math.max(glyph * 0.9, fit.height), w: glyph + F * 0.6 + fit.width};
  }
  if (row.kind === 'key') {
    const fit = fitIm(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 4, weight: 500});
    return {...row, fit, h: fit.height + F * 0.5, w: fit.width};
  }
  const fit = fitIm(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: row.bold ? 700 : 500});
  return {...row, fit, h: fit.height, w: fit.width};
}

/** True when a wrapped text has a line holding a single word (a widow on a label or a plate). */
export const hasLoneWord = f => !!f && f.lines.length > 1 && f.lines.some(ln => ln.trim().split(/\s+/).filter(Boolean).length === 1);

/**
 * Measure a panel row (shared row kinds), re-wrapping it narrower when a line would hold a single word: the text is
 * rebalanced instead of leaving a widow; the column width is unchanged.
 */
export function measureRowIm(row, F, w) {
  let first = null;
  for (const q of [1, 0.94, 0.88, 0.82, 0.77, 0.72, 0.67, 0.62, 0.57]) {
    const m = measureRowG(row, F, w * q);
    if (!first) first = m;
    if (m.fit.truncated) break;
    if (!hasLoneWord(m.fit)) return m;
  }
  return {...first, lone: hasLoneWord(first.fit)};
}

/**
 * Copy of the shared arrangement search (./apertura-audiencia.js `searchLayout`, read-only there) with this motif's row
 * measure: a panel row that cannot avoid a one-word line makes the arrangement fail at that size.
 * @param {any} ctx
 * @param {Array<any>} rows
 * @param {{sizes:number[], minF:number, colFracs?:number[], bandCols?:number[], sidePanels?:any[], bandMax?:number, minPersonPx?:number, scales?:number[], targetPx?:number, compose:(box:any,F:number,scale:number)=>any}} o
 */
export function searchIm(ctx, rows, o) {
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const shape = ctx.view.shape;
  const gap = 30, colGap = 28;
  const scales = o.scales || [1, 1.25, 1.55];
  const minPerson = o.minPersonPx ?? 64;
  const sizes = o.sizes.filter(v => v >= o.minF - 1e-6).sort((a, b) => b - a);
  const log = [];
  const lay = (ms, box, F, cols) => {
    const L = layoutRows(ms, box, F, cols, colGap);
    if (ms.some(m => m.lone)) L.ok = false;
    return L;
  };
  const arrangements = [];
  if (!rows.length) arrangements.push(() => ({lay: null, roomBox: {x: 0, y: 0, w: D.w, h: D.h}, panelBox: null, cols: 0}));
  else {
    if (shape !== 'portrait') for (const cf of o.colFracs || [0.25, 0.3, 0.35, 0.39]) arrangements.push(F => {
      const pw = D.w * cf;
      const ms = rows.map(rw => measureRowIm(rw, F, pw));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, 1);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, 1, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols: 1};
    });
    if (shape !== 'portrait') for (const [cf, cols] of o.sidePanels || []) arrangements.push(F => {
      const pw = D.w * cf;
      const colW = (pw - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowIm(rw, F, colW));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, cols);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, cols, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols};
    });
    if (shape !== 'landscape') for (const cols of o.bandCols || [2, 3]) arrangements.push(F => {
      const colW = (D.w - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowIm(rw, F, colW));
      const probe = lay(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, cols);
      if (!probe.ok || probe.usedH > D.h * (o.bandMax ?? 0.5)) return null;
      const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, cols, colGap), roomBox: {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap}, panelBox, cols};
    });
  }
  let best = null;
  const evalAt = (arr, i, scale) => {
    const Fpx = sizes[i];
    const F = Fpx / px;
    const a = arr(F);
    if (!a) return null;
    const C = o.compose(a.roomBox, F, scale);
    const personPx = 100 * C.k * px;
    const problems = [...C.problems];
    if (personPx < minPerson) problems.push('people-small');
    const score = -1000 * problems.length + (Fpx >= 19.5 - 1e-6 ? 500 : 0) + Math.min(personPx, 110) + 3 * Fpx;
    log.push(`${Fpx.toFixed(1)} ${a.cols}c s${scale} ${personPx.toFixed(0)} ${problems.join('+')}`);
    const cand = {score, F, C, lay: a.lay, roomBox: a.roomBox, panelBox: a.panelBox, cols: a.cols, problems, personPx, scale};
    if (!best || score > best.score) best = cand;
    return cand;
  };
  outer: for (const arr of arrangements) {
    for (const scale of scales) {
      const last = evalAt(arr, sizes.length - 1, scale);
      if (!last || last.problems.length) continue;
      let lo = 0, hi = sizes.length - 1;
      const first = evalAt(arr, 0, scale);
      if (first && !first.problems.length) hi = 0;
      else while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        const c = evalAt(arr, mid, scale);
        if (c && !c.problems.length) hi = mid; else lo = mid;
      }
      if (hi === 0 && best && !best.problems.length && best.personPx >= (o.targetPx ?? 80) && sizes[0] >= 19.5) break outer;
      if (hi === 0) break;
    }
  }
  if (!best) {
    // never throw from layout: the whole area at the smallest size, with its problems flagged
    const F = sizes[sizes.length - 1] / px;
    const C = o.compose({x: 0, y: 0, w: D.w, h: D.h}, F, scales[0]);
    best = {score: -1e9, F, C, lay: null, roomBox: {x: 0, y: 0, w: D.w, h: D.h}, panelBox: null, cols: 0, problems: [...C.problems, 'panel-overflow'], personPx: 100 * C.k * px, scale: scales[0]};
  }
  best.log = log;
  return best;
}
