/**
 * "Lectura de resolución" kit (LAW-0317..0320, hearings-10): a generic, fictional hearing room drawn as a floor plan,
 * built for the reading of a document whose content is ONLY supplied placeholder text. Along the top wall hangs a
 * READING BOARD with two places of the SAME size, in the order supplied (a sequence as configured, illustrative): the
 * place of section A (●, by default "Grounds (supplied text)") and the place of section B (◆, by default "Operative part
 * (supplied text)"). Each section card carries only its supplied heading and neutral placeholder bars — never any
 * content of a decision. Below the board stands the READING TABLE, where the document's numbered apartados lie
 * (editable placeholder tags). One generic, neutral participant (the reader) stands at a lectern below the table, the
 * closed document on it; any other participants sit beside, facing the board. A wall clock is the room's fixture only
 * (it implies no time limit).
 *
 * The concrete action — "a document emerges and separates its editable apartados": the reader's hand goes to the
 * document on the lectern (the cause); the document rises from the lectern and grows as it moves onto the reading table; then it separates:
 * the two section cards come out of it, at the same moment and the same pace, to their two places on the board, and the
 * numbered apartados spread out of it to their places along the table; finally a line runs from each section card to every
 * apartado placed in it (as supplied), its marker (● for A, ◆ for B — equal ink) resting on the apartado. A line means
 * only "placed in this section (as supplied)": nothing is decided, granted or found; neither section is preferred or
 * drawn heavier.
 *
 * Generic art comes from ./hearings-art.js and ../../courts/kits/courts-art.js; text, chip placement and panel helpers
 * from ./apertura-audiencia.js — all imported READ-ONLY. The structure is copied from ./conclusiones-partes.js
 * (hearings-09) and adapted here, never imported, so that kit and its entries stay unchanged.
 * @module animations/hearings/kits/lectura-resolucion
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {floorArea, wallRing, planChair, planPerson, planLectern, planTable, PERSON} from '../../courts/kits/courts-art.js';
import {hearingColors, stateGlyph, wallClock, plainDoor, toWorld, reachRecords} from './hearings-art.js';
import {FONT, WALL, fitG, fitWords, textAt, measureSpeakerChip, placeLabels, mapper, mapBox, legendGlyph, rowNode, layoutRows, pxPerUnit} from './apertura-audiencia.js';
import {measure} from '../../../core/text.js';

const INK = '#1f2328';
/** The link lines: one colour and one weight for both sections (the markers tell them apart). */
export const LINK = {color: '#3b4550', width: 4.5, glyph: 8.5, dot: 5.5};
/** Apartado sheet size and spacing on the table (template units): a sheet is EXW·s wide and EXH·s tall. */
export const EX = {s: 56, step: 100};
export const EXW = 0.74, EXH = 0.9;
/** Listeners' distance from the room's axis; the reader's distance below the table's lower edge (template units). */
const LIS_CHIPS = 330, LIS_BADGES = 200;
const RD = 120;
/** Height of the neutral placeholder bars under a section card's heading (template units). */
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

/** Category fields shared by the four entries (brief: speakers, statements, exhibits, sequence). */
export const lrFields = {
  hearing: obj('Generic, fictional hearing room', {room: str('Name of the room (fictional)', 60)}, ['room']),
  speakers: list('Participants (generic, fictional): one reads the document at the lectern (see `reader`), the others sit facing the board. No rank, role rule or order is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 2, 3),
  reader: int('Index in `speakers` of the participant who reads the document (generic and neutral)', 0, 2),
  statements: list('The two sections of the document, one per place on the board (editable placeholder headings, as supplied). Each section shows only its heading and neutral placeholder bars — never the content of a decision', obj('Section', {
    side: oneOf('a (section A, ●) or b (section B, ◆)', ['a', 'b']),
    text: str('Heading of the section (editable placeholder, as supplied)', 70),
  }, ['side', 'text']), 2, 2),
  exhibits: list('The document\'s apartados lying on the reading table, numbered in this order (editable placeholder tags, as supplied)', str('Apartado tag (placeholder)', 50), 2, 4),
  links: obj('The apartados placed in each section (indices in `exhibits`, as supplied). A line means only "placed in this section (as supplied)"', {
    a: list('Apartados placed in section A (as supplied)', int('Index in `exhibits`', 0, 3), 1, 3),
    b: list('Apartados placed in section B (as supplied)', int('Index in `exhibits`', 0, 3), 1, 3),
  }, ['a', 'b']),
  sequence: list('Order of the two sections along the board (indices in `statements`): a sequence as configured (illustrative)', int('Index in `statements`', 0, 1), 1, 2),
  states: obj('Captions of the two line markers (equal weight)', {
    a: str('Caption of ● (placed in section A, as supplied)', 70),
    b: str('Caption of ◆ (placed in section B, as supplied)', 70),
  }, ['a', 'b']),
  labels: obj('Editable captions', {
    sequence: str('Caption of the order of the sections on the board (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['sequence', 'key']),
};

export const LR_EN = {
  hearing: {room: 'Hearing room 3 (fictional)'},
  speakers: [{label: 'Reader (fictional)'}, {label: 'Participant B'}, {label: 'Participant C'}],
  reader: 0,
  statements: [
    {side: 'a', text: 'Grounds (supplied text)'},
    {side: 'b', text: 'Operative part (supplied text)'},
  ],
  exhibits: ['Paragraph 1 (as supplied)', 'Paragraph 2 (as supplied)', 'Paragraph 3 (as supplied)', 'Paragraph 4 (as supplied)'],
  links: {a: [0, 1], b: [2, 3]},
  sequence: [0, 1],
  states: {a: 'In the grounds (as supplied)', b: 'In the operative part (as supplied)'},
  labels: {sequence: 'Order as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const LR_ES = {
  hearing: {room: 'Sala 3 de audiencias (ficticia)'},
  speakers: [{label: 'Persona que lee (ficticia)'}, {label: 'Participante B'}, {label: 'Participante C'}],
  reader: 0,
  statements: [
    {side: 'a', text: 'Fundamentos (texto suministrado)'},
    {side: 'b', text: 'Parte dispositiva (texto suministrado)'},
  ],
  exhibits: ['Apartado 1 (aportado)', 'Apartado 2 (aportado)', 'Apartado 3 (aportado)', 'Apartado 4 (aportado)'],
  links: {a: [0, 1], b: [2, 3]},
  sequence: [0, 1],
  states: {a: 'En los fundamentos (según lo aportado)', b: 'En la parte dispositiva (según lo aportado)'},
  labels: {sequence: 'Orden según lo configurado (ilustrativo)', key: 'Según lo aportado · sin conclusión'},
};

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
export function resolveLr(ctx, P, o = {}) {
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
const plateSize = (fit, gs, bars = false) => (fit ? {w: TX(gs) + fit.width * 1.06 + 16, h: fit.height + 18 + (bars ? BARS_H : 0)} : {w: 200, h: 62});
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
    const dx = (leftSide ? -1 : 1) * EX.s * 0.17;
    return {ex, from: {x: card.x + card.w * f, y: card.y + card.h}, to: {x: e.cx + dx, y: e.cy - EX.s * EXH / 2 - LINK.glyph - 3}, shared};
  });
}

/**
 * @param {number} W
 * @param {number} H
 * @param {any} R resolveLr()
 * @param {{cardFits?:any, refsFits?:any, dockH?:number, dockW?:number, markR?:number, Ft?:number|null, numFt?:number, noChips?:boolean, exStep?:number, extraGap?:number, linksAlt?:any, linkGap?:number}} [o]
 */
export function lrGeometry(W, H, R, o = {}) {
  const t = WALL;
  const pad = 14, gapC = 46 + (o.extraGap || 0);
  const gs = o.Ft ? o.Ft * 0.32 : 7;
  const cf = o.cardFits || {}, rf = o.refsFits || null;
  const pA = plateSize(cf.a, gs, true), pB = plateSize(cf.b, gs, true);
  let inner = Math.max(pA.w, pB.w, 180, o.dockW || 0);
  let refsH = 0, refsW = 0;
  if (rf) {
    // (the two reference plates: the same size as each other, as narrow as their text allows — the lens crop on one of
    // them stays small; the dock under A's plate is as wide as its "was" text needs)
    const ra = plateSize(rf.a, gs), rb = plateSize(rf.b, gs);
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
  const step = o.exStep || EX.step;
  const numFt = o.Ft || o.numFt || 0;
  const exNumH = numFt ? numFt * 1.75 + 8 : 0;
  const tableW = (ne - 1) * step + EX.s + 72;
  const tableH = EX.s * EXH + 40 + exNumH;
  // widths: the board with margins; the table; the reader with the listeners beside
  // (with label chips the listeners sit further out, so each chip stays nearer its own person)
  const LIS = o.Ft && !o.noChips ? LIS_CHIPS : LIS_BADGES;
  const needW = Math.max(bw + 2 * 22, tableW + 2 * 30, 2 * (LIS + PERSON.half + 40), 520);
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
  const linkGap0 = o.linkGap || 86;
  // (the bottom margin keeps room for the participants' label chips; without chips, only for their number badges)
  // (under the reader: its body, then — with chips — the reader's chip (o.chipH, the tallest participant chip,
  // measured) with its gaps; without chips a plain margin for the number badges)
  const below = RD + PERSON.half + (o.Ft ? (o.noChips ? 20 + o.Ft * 1.8 : 30 + Math.max(o.chipH || 0, o.Ft * 1.6)) : 40);
  const need0 = yB + linkGap0 + tableH + below;
  const needH = Math.max(need0, 520);
  const spare = Math.max(0, H - needH);
  const linkGap = linkGap0 + spare * 0.45;
  const table = {x: Cx - tableW / 2, y: yB + linkGap, w: tableW, h: tableH};
  const exY = table.y + 18 + EX.s * EXH / 2;
  const exhibits = R.exhibits.map((_, i) => ({cx: table.x + 36 + EX.s / 2 + i * step, cy: exY, s: EX.s, numY: exY + EX.s * EXH / 2 + 6 + numFt * 0.85}));
  // the reader: below the table on the room's axis, facing the board; the lectern (with the document) in front
  const rowY = table.y + tableH + RD + spare * 0.15;
  const seats = [];
  const pose = {x: Cx, y: rowY, deg: 0};
  seats[R.reader] = {x: Cx, y: rowY, deg: 0, standing: true, angle: 90};
  const lc = toWorld(pose, {x: 0, y: -80});
  const lectern = {cx: lc.x, cy: lc.y, deg: 0, s: 58};
  // (the reader's hand goes to the document lying on the lectern: the arm on the right, well within reach)
  const aim = {arm: 'armR', target: toWorld(pose, {x: 18, y: -64})};
  const docRest = toWorld(pose, {x: -4, y: -82});
  // (where the document comes to lie open once it has risen from the lectern: the middle of the reading table, level
  // with the row of apartados it will separate into)
  const docMid = {x: Cx, y: exY};
  // (contrast: the apartados already lie on the table, so the document opens over the free floor above it)
  const docFloor = {x: Cx, y: (yB + table.y) / 2};
  // the others sit beside the reader, facing the board
  const xs = R.listeners.length === 1 ? [Cx + LIS] : [Cx - LIS, Cx + LIS];
  R.listeners.forEach((pi, j) => { seats[pi] = {x: xs[j], y: rowY + 6, deg: 0, angle: 90}; });
  const clock = {cx: 46, cy: yB + 52, R: 28};
  const door = {a: Math.min(W - 150, Math.max(Cx + LIS + 90, W * 0.7)), b: Math.min(W - 70, Math.max(Cx + LIS + 170, W * 0.7 + 80))};
  const problems = [];
  if (W + 0.5 < needW) problems.push('room-width');
  if (H + 0.5 < needH) problems.push('room-height');
  const G = {W, H, t, board, colX, colW, inner, card, refs, dock, markR, left: R.left, right: R.right, yB, Cx, table, exhibits, seats, lectern, aim, docRest, docMid, docFloor, clock, door, needW, needH, problems, step, readerPose: pose,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t}};
  G.links = {a: linkEnds(G, 'a', R.links.a, R.links), b: linkEnds(G, 'b', R.links.b, R.links)};
  if (o.linksAlt) G.linksAlt = {a: linkEnds(G, 'a', o.linksAlt.a, o.linksAlt), b: linkEnds(G, 'b', o.linksAlt.b, o.linksAlt)};
  G.markC = !markNeed ? null : refs ? {x: refs.a.x + refsW + (inner + markR - refsW) / 2, y: refs.a.y + refs.a.h / 2} : {x: colX.a + inner + markR / 2, y: card.a.y + card.a.h / 2};
  return G;
}

/** Obstacles of the room for label placement (template units): board, table, lectern, clock, door. */
export function lrObstacles(G) {
  const l = G.lectern;
  return [
    {x: G.board.x - 8, y: 0, w: G.board.w + 16, h: G.yB + 8},
    {x: G.table.x - 8, y: G.table.y - 8, w: G.table.w + 16, h: G.table.h + 16},
    {x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R - 6, w: 2 * G.clock.R + 12, h: 2 * G.clock.R + 12},
    {x: G.door.a, y: G.H - (G.door.b - G.door.a), w: G.door.b - G.door.a, h: G.door.b - G.door.a},
    {x: l.cx - 40, y: l.cy - 40, w: 80, h: 80},
  ];
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
  const gs = Ft ? Ft * 0.32 : 7;
  const gx = box.x + GX(gs), gy = fit ? box.y + 7 + fit.size * 0.55 : box.y + box.h / 2;
  const bars = [];
  if (!fit) for (let i = 0; i < 2; i++) bars.push(`M${r(box.x + 34)} ${r(box.y + box.h * (0.36 + i * 0.3))}H${r(box.x + box.w - (i ? 50 : 14))}`);
  const tx = box.x + TX(gs);
  return [
    h('path', {name: `${name}-body`, d: roundRectPath(box.x, box.y, box.w, box.h, 7), fill: o.fill || c.card, stroke: INK, 'stroke-width': 2.2}),
    o.noGlyph ? null : stateGlyph(ctx, {name: `${name}-g`, kind, cx: gx, cy: gy, s: gs}),
    o.noText ? null : fit ? g({name: `${name}-text`}, textAt(fit, tx, box.y + 7, INK)) : h('path', {d: bars.join(''), stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}),
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

/** An apartado sheet from above (white paper, neutral filler lines), centred on the origin. */
function sheetArt(ctx, s) {
  const c = hearingColors(ctx);
  const w = s * EXW, hh = s * EXH;
  const lines = [];
  for (let i = 0; i < 4; i++) lines.push(`M${r(-w / 2 + 7)} ${r(-hh / 2 + 10 + i * (hh - 18) / 3.2)}H${r(w / 2 - 7 - (i === 3 ? w * 0.3 : 0))}`);
  return [
    h('rect', {x: r(-w / 2 + 3), y: r(-hh / 2 + 4), width: r(w), height: r(hh), rx: 3, fill: ctx.theme.shadow}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 2}),
    h('path', {d: lines.join(''), stroke: c.paperLine, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
  ];
}

/** The closed document (a small stack of sheets with a cover band), centred on the origin; 36 × 46 units at scale 1. */
function docArt(ctx) {
  const c = hearingColors(ctx);
  const w = 36, hh = 46;
  return [
    h('rect', {x: r(-w / 2 + 5), y: r(-hh / 2 + 6), width: w, height: hh, rx: 3, fill: ctx.theme.shadow}),
    h('rect', {x: r(-w / 2 + 3), y: r(-hh / 2 + 3), width: w, height: hh, rx: 3, fill: '#f4f1ea', stroke: INK, 'stroke-width': 1.4}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: w, height: hh, rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: w, height: 9, rx: 3, fill: '#cfd6dd', stroke: INK, 'stroke-width': 1.4}),
    h('path', {d: `M${r(-w / 2 + 6)} ${r(-hh / 2 + 17)}H${r(w / 2 - 6)}M${r(-w / 2 + 6)} ${r(-hh / 2 + 25)}H${r(w / 2 - 6)}M${r(-w / 2 + 6)} ${r(-hh / 2 + 33)}H${r(w / 2 - 12)}`, stroke: c.paperLine, 'stroke-width': 2, 'stroke-linecap': 'round'}),
  ];
}

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G lrGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, numFt?:number, cardFits?:any, refsFits?:any, keep?:(b:any)=>boolean, sides?:string[], cardsIn?:boolean, exIn?:boolean, doc?:boolean, datum?:any, noLinks?:boolean, linkStyle?:any}} o
 *   sides: whose links exist (contrast: one per room); cardsIn: the cards come out of the document (story, contrast);
 *   exIn: the apartados come out of the document (story); doc: the document is drawn (story, contrast);
 *   datum (inspect): {fits: {before, after}, wasFit} — section A's reference plate in both values, the old one docked
 */
export function lrRoom(ctx, G, o) {
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
    {side: 'bottom', a: G.door.a, b: G.door.b, kind: 'door'},
    {side: 'left', a: Math.max(G.yB + 100, H * 0.42), b: Math.max(G.yB + 170, H * 0.42 + 70), kind: 'window'},
  ]}));
  const door = plainDoor(ctx, {name: `${P}-door`, hinge: {x: G.door.b, y: H + t / 2}, width: G.door.b - G.door.a, closedDeg: 180, openDeg: 80});
  parts.push(door.node);
  const clock = wallClock(ctx, {name: `${P}-clock`, cx: G.clock.cx, cy: G.clock.cy, R: G.clock.R});
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
  if (G.refs) {
    const fB = o.refsFits ? o.refsFits.b : null;
    const mk = o.refMarks && !fB ? o.refMarks : null;
    if (keepRefs.b && mk) {
      const q = refSlots(G.refs.b, G.exhibits.length, gs);
      boardParts.push(g({name: `${P}-refs-b`}, plateParts(ctx, `${P}-refs-b`, G.refs.b, null, 'diamond', o.Ft, {fill: '#ffffff', noText: true}), refSheets(G.refs.b, G.exhibits.length, gs),
        G.links.b.map((lk, j) => stateGlyph(ctx, {name: `${P}-rmk-b${j}`, kind: 'diamond', cx: q.cx(lk.ex), cy: q.cy, s: q.s * 0.2}))));
    } else if (keepRefs.b) boardParts.push(g({name: `${P}-refs-b`}, plateParts(ctx, `${P}-refs-b`, G.refs.b, fB, 'diamond', o.Ft, {fill: '#ffffff'})));
    if (keepRefs.a) {
      const ra = G.refs.a;
      const fits = datum ? datum.fits : null;
      if (G.dock && fits && keep(G.dock)) {
        boardParts.push(g({name: `${P}-dock`, opacity: 0}, h('path', {d: roundRectPath(G.dock.x, G.dock.y, G.dock.w, G.dock.h, 6), fill: '#f3f4f5', stroke: '#9aa4ae', 'stroke-width': 1.6})));
        boardParts.push(g({name: `${P}-was`, opacity: 0}, textAt(datum.wasFit, G.dock.x + 10, G.dock.y + 8, '#57606a', {italic: true})));
      }
      boardParts.push(g({name: `${P}-refs-a`},
        h('path', {name: `${P}-refs-a-body`, d: roundRectPath(ra.x, ra.y, ra.w, ra.h, 7), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
        g({name: `${P}-refs-a-mark`}, stateGlyph(ctx, {name: `${P}-refs-a-g`, kind: 'dot', cx: ra.x + GX(gs), cy: fits ? ra.y + 7 + fits.before.size * 0.55 : ra.y + ra.h / 2, s: gs})),
        fits ? g({name: `${P}-refs-a-v-after`, opacity: 0, transform: 'translate(0 0)'}, g({name: `${P}-refs-a-v-after-text`}, textAt(fits.after, ra.x + TX(gs), ra.y + 7, INK)))
          : mk ? g(null, refSheets(ra, G.exhibits.length, gs), G.links.a.map((lk, j) => { const q = refSlots(ra, G.exhibits.length, gs); return stateGlyph(ctx, {name: `${P}-rmk-a${j}`, kind: 'dot', cx: q.cx(lk.ex), cy: q.cy, s: q.s * 0.2}); }))
            : h('path', {d: `M${r(ra.x + 34)} ${r(ra.y + ra.h / 2)}H${r(ra.x + ra.w - 14)}`, stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'})));
      if (fits) boardParts.push(g({name: `${P}-refs-a-v-before`, opacity: 1, transform: 'translate(0 0)'}, g({name: `${P}-refs-a-v-before-text`}, textAt(fits.before, ra.x + TX(gs), ra.y + 7, INK))));
    }
  }
  for (const s of SIDES) {
    if (!keepCard[s]) continue;
    const fit = o.cardFits ? o.cardFits[s] : null;
    boardParts.push(g({name: `${P}-card-${s}`, transform: 'translate(0 0) scale(1)', opacity: o.cardsIn ? 0 : 1},
      h('path', {d: roundRectPath(G.card[s].x + 3, G.card[s].y + 4, G.card[s].w, G.card[s].h, 7), fill: th.shadow}),
      plateParts(ctx, `${P}-card-${s}`, G.card[s], fit, kindOf(s), o.Ft, {bars: true})));
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
      G.exhibits.map((e, i) => g({name: `${P}-ex${i}`, transform: 'translate(0 0)', opacity: o.exIn ? 0 : 1},
        g({name: `${P}-exhibit${i}`, transform: T(e.cx, e.cy)}, sheetArt(ctx, e.s)),
        nF ? g({name: `${P}-exnum${i}`},
          h('circle', {cx: r(e.cx), cy: r(e.numY), r: r(nF * 0.8), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
          h('text', {x: r(e.cx), y: r(e.numY + nF * 0.35), 'font-family': FONT, 'font-size': r(nF, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(i + 1))) : null))));
  }
  // the lectern, the listeners' chairs
  const l = G.lectern;
  if (keep({x: l.cx - 30, y: l.cy - 30, w: 60, h: 60})) parts.push(planLectern(ctx, {name: `${P}-lectern`, cx: l.cx, cy: l.cy, s: l.s, deg: l.deg}));
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
  // the document (story, contrast): it rests on the lectern, rises onto the middle of the table, and separates
  if (o.doc && !o.keep) parts.push(g({name: `${P}-doc`, transform: `translate(${r(G.docRest.x)} ${r(G.docRest.y)}) scale(1)`, opacity: 1}, docArt(ctx)));
  const rigs = R.speakers.map(sp => (keep(personBox(G.seats[sp.index])) ? planPerson(ctx, {name: `${P}-p${sp.index}`, look: sp.look}) : null));
  parts.push(rigs.filter(Boolean).map(rg => rg.node));

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
    if (o.doc && !o.keep) {
      const d = st.doc || {x: G.docRest.x, y: G.docRest.y, s: 1, op: 1};
      nodes[`${P}-doc`] = {transform: `translate(${r(d.x, 2)} ${r(d.y, 2)}) scale(${r(d.s, 4)})`, opacity: r(clamp(d.op), 3)};
    }
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
      const dx = D ? D.x + 10 - (G.refs.a.x + TX(gs)) : 0;
      const dy = D ? D.y + 8 + datum.wasFit.height + datum.wasFit.size * 0.6 - (G.refs.a.y + 7) : 0;
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
    // people: everybody stays in place; the reader's hand goes to the document when supplied
    let reached = true;
    const hands = [];
    rigs.forEach((rg, i) => {
      if (!rg) return;
      const s = G.seats[i];
      const ps = st.personScale ? st.personScale[i] ?? 1 : 1;
      const pose = {x: s.x, y: s.y, deg: s.deg, seated: s.standing ? 0 : 1, scale: ps};
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
export function lrTiming(t0, t1, n, {together = false} = {}) {
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
export function lrDrawAt(G, TM, u, o = {}) {
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
 * The document's path: at rest on the lectern (scale 1); `lift` 0→1 carries it to `to` (by default the middle of the
 * reading table), growing to `big`; `fade` 0→1 lets it go as its pieces come out.
 */
export function docAt(G, lift, fade, big = 1.7, to = G.docMid) {
  const q = ease.inOutCubic(clamp(lift));
  return {x: lerp(G.docRest.x, to.x, q), y: lerp(G.docRest.y, to.y, q), s: lerp(1, big, q), op: 1 - clamp(fade)};
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its chips (design units)   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolveLr()
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {number} F label text size (design units)
 * @param {{scale?:number, chips?:boolean, text?:boolean, align?:any, refs?:{a:{before:string, after:string}, b:string}|null,
 *   wasText?:string, marker?:boolean, extraH?:number, chipMaxW?:number, exStep?:number, extraGap?:number, linksAlt?:any,
 *   numbers?:boolean, linkGap?:number, cardLines?:number, cardText?:boolean}} [o]
 */
export function composeLr(ctx, P, R, box, F, o = {}) {
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
        f = fitLr(text, {maxWidth: Math.max(maxW * q, sz * 4), size: sz, minSize: sz, maxLines: 6, weight: 600});
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
          const gs0 = Ft * 0.32;
          const plateWd = TX(gs0) + Math.max(fa.before.width, fa.after.width, refsFits.b.width) * 1.06 + 16;
          const room = Math.max(Ft * 4, plateWd - 20 - (o.dockInline ? wasFit.width + Ft * 0.5 : 0));
          recFit = null;
          for (const q of [1, 0.92, 0.84, 0.76, 0.68, 0.6, 1.15, 1.3, 1.5, 1.8]) {
            const f = fitLr(o.refs.a.before, {maxWidth: room * q, size: Ft, minSize: Ft, maxLines: 6, weight: 600});
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
    const G = lrGeometry(W, H, R, {chipH: chipH < 1e8 ? chipH : 0, cardFits, refsFits: o.refs ? refsFits : null, dockH, dockW, linkGap: o.linkGap, Ft: withText ? Ft : null, numFt: o.numbers ? Ft : 0, noChips: !o.chips, markR: o.marker ? (withText ? Ft * 2 : 60) : 0, exStep: o.exStep, extraGap: o.extraGap, linksAlt: o.linksAlt});
    G.Ft = withText ? Ft : null;
    G.numFt = o.numbers ? Ft : 0;
    G.cardFits = cardFits;
    G.refsFits = refsFits;
    G.refsFitsAB = refsFits && refsFits.a && refsFits.a.before ? {before: refsFits.a.before, after: refsFits.a.after} : null;
    G.wasFit = wasFit;
    G.recFit = recFit;
    return G;
  };
  let k = box.w / 1200, G = null, W = 0, H = 0;
  for (let it = 0; it < 4; it++) {
    const G0 = geoAt(2000, 2000, k);
    W = Math.max(G0.needW * sc, 520 * sc);
    H = Math.max(G0.needH * sc + (o.extraH || 0), 520 * sc);
    if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
    const k2 = Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t));
    if (Math.abs(k2 - k) < 1e-4) { k = k2; break; }
    k = k2;
  }
  G = geoAt(W, H, k);
  for (let it = 0; it < 10 && (G.problems.includes('room-width') || G.problems.includes('room-height')); it++) {
    W = Math.max(W, G.needW + 1);
    H = Math.max(H, G.needH + 1);
    if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
    k = Math.min(box.w / (W + 2 * t), box.h / (H + 2 * t));
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
  const equip = [...lrObstacles(G), ...linkSamples(G, ['links', 'linksAlt'])].map(bD);
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
    const res = placeLabels(items, {bounds, circles: people, boxes: equip, placed: []});
    items.forEach((it, j) => { chips[it.i] = res.labels[j]; });
    for (const f of res.fails) problems.push(`chip-${f}`);
  }
  return {F, k, W, H, G, E, ox, oy, toD, bD, chips, problems, rad, box, people, equip, bounds,
    planRect: {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k}};
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/** Legend rows: ● / ◆ (equal weight) and the numbered apartados. */
export function lrRows(R, P, prefix = 'lg', o = {}) {
  const rows = [];
  rows.push({kind: 'legend', glyphKind: 'started', text: P.states.a, name: `${prefix}-a`});
  rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.b, name: `${prefix}-b`});
  if (o.exhibits !== false) R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'para', seqNumber: String(i + 1), text: tx, name: `${prefix}-ex${i}`}));
  return rows;
}

/** Panel row node: this motif's glyphs (sections, apartados, lectern, board, table, link kinds), else the shared rows. */
export function lrRowNode(ctx, m, o = {}) {
  const KINDS = ['secA', 'secB', 'para', 'lectern', 'board', 'table', 'kind-relation', 'kind-communication', 'kind-sequence', 'kind-causal', 'room'];
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
    } else if (m.glyphKind === 'lectern') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.36), y: r(-s * 0.3), width: r(s * 0.72), height: r(s * 0.6), rx: 4, fill: c.wood, stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.14), y: r(-s * 0.2), width: r(s * 0.28), height: r(s * 0.36), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.2}));
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
export function lrGlue(text, {lead = true} = {}) {
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
export function fitLr(text, o) {
  const sz = o.minSize ?? o.size;
  const needOf = t => Math.max(0, ...t.split(/[ \t\n]+/).filter(Boolean).map(w => measure(w.replace(/\u00a0/g, ' '), sz, o.weight ?? 600, 'sans')));
  let t = lrGlue(text);
  let need = needOf(t);
  // (the leading word stays with its bracketed tag only while that group fits the box)
  if (need > o.maxWidth + 0.5) { const t2 = lrGlue(text, {lead: false}); const n2 = needOf(t2); if (n2 < need) { t = t2; need = n2; } }
  return fitWords(t, {...o, maxWidth: Math.max(o.maxWidth, need + 0.5)});
}

/** Panel row measure (the shared row kinds, ./apertura-audiencia.js `measureRow`) with this motif's glue. */
export function measureRowG(row, F, w) {
  const glyph = F * 1.9;
  if (row.kind === 'heading' || row.kind === 'state') {
    const padX = F * 0.6, padY = F * 0.36;
    const fit = fitLr(row.text, {maxWidth: w - padX * 2, size: F, minSize: F, maxLines: 4, weight: 700});
    return {...row, fit, h: fit.height + padY * 2, w: fit.width + padX * 2, padX, padY};
  }
  if (row.kind === 'legend' || row.kind === 'note') {
    const fit = fitLr(row.text, {maxWidth: w - glyph - F * 0.6, size: F, minSize: F, maxLines: 5, weight: 500});
    return {...row, fit, glyph, h: Math.max(glyph * 0.9, fit.height), w: glyph + F * 0.6 + fit.width};
  }
  if (row.kind === 'key') {
    const fit = fitLr(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 4, weight: 500});
    return {...row, fit, h: fit.height + F * 0.5, w: fit.width};
  }
  const fit = fitLr(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: row.bold ? 700 : 500});
  return {...row, fit, h: fit.height, w: fit.width};
}

/** True when a wrapped text has a line holding a single word (a widow on a label or a plate). */
export const hasLoneWord = f => !!f && f.lines.length > 1 && f.lines.some(ln => ln.trim().split(/\s+/).filter(Boolean).length === 1);

/**
 * Measure a panel row (shared row kinds), re-wrapping it narrower when a line would hold a single word: the text is
 * rebalanced instead of leaving a widow; the column width is unchanged.
 */
export function measureRowLr(row, F, w) {
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
export function searchLr(ctx, rows, o) {
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
      const ms = rows.map(rw => measureRowLr(rw, F, pw));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, 1);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, 1, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols: 1};
    });
    if (shape !== 'portrait') for (const [cf, cols] of o.sidePanels || []) arrangements.push(F => {
      const pw = D.w * cf;
      const colW = (pw - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowLr(rw, F, colW));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, cols);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, cols, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols};
    });
    if (shape !== 'landscape') for (const cols of o.bandCols || [2, 3]) arrangements.push(F => {
      const colW = (D.w - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowLr(rw, F, colW));
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
