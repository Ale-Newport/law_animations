/**
 * "Conclusiones de las partes" kit (LAW-0313..0316, hearings-09): a generic, fictional hearing room drawn as a floor
 * plan, built for the parties' closing arguments. Along the top wall hangs an ARGUMENT BOARD with two places of the SAME
 * size, in the order supplied (a sequence as configured, illustrative — never an order of speaking): the card of
 * argument A (●) and the card of argument B (◆), each with its text as supplied. Below the board stands the EVIDENCE
 * TABLE with the exhibits lying on it, numbered. The two participants supplied as the parties stand at two identical
 * lecterns on either side of the table, each on the side of its own card (no rank implied); any other participants sit
 * facing the board. A wall clock is the room's fixture only (it implies no time limit).
 *
 * The concrete action — "each party connects its arguments with the evidence it invokes": both parties raise a hand
 * towards their own card at the same moment (the cause); then, link by link and at the same pace on both sides, a line
 * runs out of each card's lower edge down to an exhibit it invokes, its marker (● for A, ◆ for B — equal ink) riding the
 * tip and coming to rest on the exhibit's upper edge. A link means only "invoked by the party (as supplied)": nothing is
 * proved, supported, weighed or decided; neither side is preferred or drawn heavier.
 *
 * Generic art comes from ./hearings-art.js and ../../courts/kits/courts-art.js; text, chip placement and panel helpers
 * from ./apertura-audiencia.js — all imported READ-ONLY. The structure follows ./pausa-audiencia.js (copied and adapted
 * here, never imported, so that kit stays unchanged).
 * @module animations/hearings/kits/conclusiones-partes
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {floorArea, wallRing, planChair, planPerson, planLectern, planTable, PERSON} from '../../courts/kits/courts-art.js';
import {hearingColors, stateGlyph, wallClock, exhibitBox, plainDoor, facing, toWorld, reachRecords} from './hearings-art.js';
import {FONT, WALL, fitG, fitWords, textAt, measureSpeakerChip, placeLabels, mapper, mapBox, legendGlyph, rowNode, layoutRows, pxPerUnit} from './apertura-audiencia.js';
import {measure} from '../../../core/text.js';

const INK = '#1f2328';
/** The link lines: one colour and one weight for both parties (the markers tell them apart). */
export const LINK = {color: '#3b4550', width: 4.5, glyph: 8.5, dot: 5.5};
/** Exhibit size and spacing on the table (template units). */
export const EX = {s: 54, step: 104};
/** How far the parties stand from the table's ends (template units). */
const SIDE_GAP = 102;
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
export const cpFields = {
  hearing: obj('Generic, fictional hearing room', {room: str('Name of the room (fictional)', 60)}, ['room']),
  speakers: list('Participants (generic, fictional): the two parties stand at the two identical lecterns, any others sit facing the board. No rank, role rule or order of speaking is implied', obj('Participant', {
    label: str('Label of this participant (as supplied)', 50),
    appearance,
  }, ['label']), 2, 4),
  parties: obj('Which participants are the two parties (indices in `speakers`): a puts forward argument A (●), b argument B (◆)', {
    a: int('Index of the party of argument A', 0, 3),
    b: int('Index of the party of argument B', 0, 3),
  }, ['a', 'b']),
  statements: list('The two arguments on the board, one per party (fictional, as supplied). Neither is weighed, preferred or decided', obj('Argument', {
    side: oneOf('a (argument A, ●) or b (argument B, ◆)', ['a', 'b']),
    text: str('Argument text (fictional, as supplied)', 70),
  }, ['side', 'text']), 2, 2),
  exhibits: list('Exhibits lying on the evidence table, numbered in this order (fictional tags)', str('Exhibit tag (fictional)', 50), 2, 4),
  links: obj('The exhibits each argument invokes (indices in `exhibits`, as supplied). A link means only "invoked by the party (as supplied)" — never that anything is proved or supported', {
    a: list('Exhibits invoked in argument A (as supplied)', int('Index in `exhibits`', 0, 3), 1, 3),
    b: list('Exhibits invoked in argument B (as supplied)', int('Index in `exhibits`', 0, 3), 1, 3),
  }, ['a', 'b']),
  sequence: list('Order of the two arguments along the board (indices in `statements`): a sequence as configured (illustrative), never an order of speaking', int('Index in `statements`', 0, 1), 1, 2),
  states: obj('Captions of the two link markers (equal weight)', {
    a: str('Caption of ● (invoked in argument A, as supplied)', 60),
    b: str('Caption of ◆ (invoked in argument B, as supplied)', 60),
  }, ['a', 'b']),
  labels: obj('Editable captions', {
    sequence: str('Caption of the order of the cards on the board (keep "as configured")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['sequence', 'key']),
};

export const CP_EN = {
  hearing: {room: 'Hearing room 2 (fictional)'},
  speakers: [{label: 'Party A'}, {label: 'Party B'}, {label: 'Participant C'}],
  parties: {a: 0, b: 1},
  statements: [
    {side: 'a', text: 'Argument A: the parcel was handed over (as supplied)'},
    {side: 'b', text: 'Argument B: the parcel was not handed over (as supplied)'},
  ],
  exhibits: ['Exhibit 1: delivery note', 'Exhibit 2: email from the depot', 'Exhibit 3: gate camera log'],
  links: {a: [0, 1], b: [1, 2]},
  sequence: [0, 1],
  states: {a: 'Invoked in argument A (as supplied)', b: 'Invoked in argument B (as supplied)'},
  labels: {sequence: 'Order on the board as configured (illustrative)', key: 'As supplied · no conclusion drawn'},
};

export const CP_ES = {
  hearing: {room: 'Sala de audiencias 2 (ficticia)'},
  speakers: [{label: 'Parte A'}, {label: 'Parte B'}, {label: 'Participante C'}],
  parties: {a: 0, b: 1},
  statements: [
    {side: 'a', text: 'Argumento A: el paquete se entregó (aportado)'},
    {side: 'b', text: 'Argumento B: el paquete no se entregó (aportado)'},
  ],
  exhibits: ['Prueba 1: albarán de entrega', 'Prueba 2: correo del almacén', 'Prueba 3: registro de la cámara'],
  links: {a: [0, 1], b: [1, 2]},
  sequence: [0, 1],
  states: {a: 'Invocada en el argumento A (aportado)', b: 'Invocada en el argumento B (aportado)'},
  labels: {sequence: 'Orden en el panel según lo configurado (ilustrativo)', key: 'Según lo aportado · sin conclusión'},
};

const uniq = (xs, n) => {
  const out = [];
  for (const v of xs || []) { const q = Math.round(v); if (q >= 0 && q < n && !out.includes(q)) out.push(q); }
  return out.length ? out : [0];
};

/**
 * Resolve the supplied content: the two parties and the others, the two arguments (A ●, B ◆) in the configured order,
 * the exhibits and each argument's invoked exhibits.
 * @param {any} ctx
 * @param {any} P localised params
 * @param {{links?:any}} [o] links override (inspect: the substituted links)
 */
export function resolveCp(ctx, P, o = {}) {
  const n = P.speakers.length;
  const speakers = P.speakers.map((s, i) => {
    const ap = {...(s.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[(i * 2 + Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length)) % SAFE_OUTFITS.length];
    return {index: i, label: s.label, look: actorLook(ctx, {appearance: ap}, i), statements: []};
  });
  let pa = clamp(Math.round(P.parties?.a ?? 0), 0, n - 1), pb = clamp(Math.round(P.parties?.b ?? 1), 0, n - 1);
  if (pb === pa) pb = pa === 0 ? 1 : 0;
  const listeners = speakers.map(sp => sp.index).filter(i => i !== pa && i !== pb).slice(0, 2);
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
  return {n, speakers, party: {a: pa, b: pb}, listeners, exhibits, args, order, left, right, links};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

/** A plate's size for a text fit (glyph on the left), or a text-free placeholder. */
const plateSize = (fit, gs) => (fit ? {w: TX(gs) + fit.width * 1.06 + 16, h: fit.height + 18} : {w: 200, h: 62});
/** Text inset of a plate: the glyph (radius gs) sits at 12 + gs from the left edge, the text a gap after it. */
export const TX = gs => 12 + 2 * gs + 10;
const GX = gs => 12 + gs;

/**
 * Link end points for one side and one set of invoked exhibits: ports along the inner part of the card's lower edge (in
 * the order of their exhibits, so a party's lines never cross) and marker points just above each exhibit's upper edge,
 * on the party's own half of the exhibit (an exhibit invoked by both sides gets one port on each half).
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
    // (each side always lands on its own half of an exhibit — shared or not — so a substituted link of one side never
    // moves the other side's line)
    const dx = (leftSide ? -1 : 1) * EX.s * 0.24;
    return {ex, from: {x: card.x + card.w * f, y: card.y + card.h}, to: {x: e.cx + dx, y: e.cy - EX.s * 0.37 - LINK.glyph - 3}, shared};
  });
}

/**
 * @param {number} W
 * @param {number} H
 * @param {any} R resolveCp()
 * @param {{cardFits?:any, refsFits?:any, dockH?:number, dockW?:number, markR?:number, Ft?:number|null, exStep?:number, extraGap?:number, linksAlt?:any}} [o]
 */
export function cpGeometry(W, H, R, o = {}) {
  const t = WALL;
  const pad = 14, gapC = 46 + (o.extraGap || 0);
  const gs = o.Ft ? o.Ft * 0.32 : 7;
  const cf = o.cardFits || {}, rf = o.refsFits || null;
  const pA = plateSize(cf.a, gs), pB = plateSize(cf.b, gs);
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
  const cardH = Math.max(pA.h, pB.h, 56);
  const dockH = o.dockH || 0;
  // (the changed-datum marker sits in the free space right of A's reference plate; a strip is added only when that
  // space is narrower than the marker needs)
  const markNeed = o.markR || 0;
  const markR = rf && markNeed ? Math.max(0, markNeed - (inner - refsW)) : markNeed;
  const colW = inner + markR;
  const bw = pad * 2 + colW * 2 + gapC;
  const ne = R.exhibits.length;
  const step = o.exStep || EX.step;
  const numFt = o.Ft || o.numFt || 0;
  const exNumH = numFt ? numFt * 1.75 + 8 : 0;
  const tableW = (ne - 1) * step + EX.s + 72;
  const tableH = EX.s * 0.74 + 40 + exNumH;
  const nL = R.listeners.length;
  // widths: the board with margins; the table with both parties and their lecterns beside it; the listeners' row
  const sideNeed = SIDE_GAP + PERSON.half + 40;
  const needW = Math.max(bw + 2 * 22, tableW + 2 * sideNeed, 600);
  const board = {x: (W - bw) / 2, y: 8, w: bw, h: 0};
  const colX = {[R.left]: board.x + pad, [R.right]: board.x + pad + colW + gapC};
  // (the free strip for the changed-datum marker is on each column's OUTER side; both columns are the same width)
  // (each column's content starts at its left edge; a marker strip, when needed, is on the right of both columns)
  const cx = s => colX[s];
  let y = board.y + pad;
  const refs = rf ? {a: {x: cx('a'), y, w: refsW, h: refsH}, b: {x: cx('b'), y, w: refsW, h: refsH}} : null;
  // (the dock lies under A's reference plate: "was" on its first line, the old value under it)
  const dock = !dockH ? null : {x: cx('a'), y: y + refsH + 8, w: Math.max(refsW, o.dockW || 0), h: dockH};
  if (rf) y += refsH + 8;
  if (dockH) y += dockH + 8;
  const card = {a: {x: cx('a'), y, w: inner, h: cardH}, b: {x: cx('b'), y, w: inner, h: cardH}};
  board.h = y + cardH + pad - board.y;
  const yB = board.y + board.h;
  const Cx = board.x + board.w / 2;
  // heights
  const linkGap0 = o.linkGap || 114;
  const rowL = nL ? tableH + 76 + PERSON.half : 0;
  // (the bottom margin keeps room for the participants' label chips; without chips, only for their number badges)
  const need0 = yB + linkGap0 + Math.max(tableH / 2 + PERSON.half + 30, rowL) + 34 + (o.Ft ? 20 + o.Ft * (o.noChips ? 0.9 : 1.7) : 26);
  const needH = Math.max(need0, 520);
  const spare = Math.max(0, H - needH);
  const linkGap = linkGap0 + spare * 0.45;
  const table = {x: Cx - tableW / 2, y: yB + linkGap, w: tableW, h: tableH};
  const exY = table.y + 18 + EX.s * 0.37;
  const exhibits = R.exhibits.map((_, i) => ({cx: table.x + 36 + EX.s / 2 + i * step, cy: exY, s: EX.s, numY: exY + EX.s * 0.37 + 6 + numFt * 0.85}));
  // the parties: beside the table, each on the side of its own card, facing its card; a lectern in front of each
  const py = table.y + Math.min(tableH / 2, 70);
  const seats = [];
  const lecterns = {};
  const aims = {};
  for (const s of SIDES) {
    const leftSide = s === R.left;
    const home = {x: leftSide ? table.x - SIDE_GAP : table.x + tableW + SIDE_GAP, y: py};
    const c = card[s];
    const deg = facing(home, {x: c.x + c.w / 2, y: c.y + c.h});
    const pose = {x: home.x, y: home.y, deg};
    seats[R.party[s]] = {x: home.x, y: home.y, deg, standing: true, side: s, angle: 90};
    const lc = toWorld(pose, {x: 0, y: -80});
    lecterns[s] = {cx: lc.x, cy: lc.y, deg, s: 58};
    // (the raised hand towards the card: the arm on the card's side, within reach)
    aims[s] = {arm: leftSide ? 'armR' : 'armL', target: toWorld(pose, {x: leftSide ? 26 : -26, y: -68})};
  }
  // the others sit facing the board, below the table
  const lY = table.y + tableH + 76 + spare * 0.2;
  const xs = nL === 1 ? [Cx] : [Cx - 120, Cx + 120];
  R.listeners.forEach((pi, j) => { seats[pi] = {x: xs[j], y: lY, deg: 0, angle: 90}; });
  const clock = {cx: 46, cy: yB + 52, R: 28};
  const door = {a: Math.min(W - 150, Math.max(Cx + 190, W * 0.66)), b: Math.min(W - 70, Math.max(Cx + 270, W * 0.66 + 80))};
  const problems = [];
  if (W + 0.5 < needW) problems.push('room-width');
  if (H + 0.5 < needH) problems.push('room-height');
  const G = {W, H, t, board, colX, colW, inner, card, refs, dock, markR, left: R.left, right: R.right, yB, Cx, table, exhibits, seats, lecterns, aims, clock, door, needW, needH, problems, step,
    extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t}};
  G.links = {a: linkEnds(G, 'a', R.links.a, R.links), b: linkEnds(G, 'b', R.links.b, R.links)};
  if (o.linksAlt) G.linksAlt = {a: linkEnds(G, 'a', o.linksAlt.a, o.linksAlt), b: linkEnds(G, 'b', o.linksAlt.b, o.linksAlt)};
  G.markC = !markNeed ? null : refs ? {x: refs.a.x + refsW + (inner + markR - refsW) / 2, y: refs.a.y + refs.a.h / 2} : {x: colX.a + inner + markR / 2, y: card.a.y + card.a.h / 2};
  return G;
}

/** Obstacles of the room for label placement (template units): board, table, lecterns, clock, door. */
export function cpObstacles(G) {
  const out = [
    {x: G.board.x - 8, y: 0, w: G.board.w + 16, h: G.yB + 8},
    {x: G.table.x - 8, y: G.table.y - 8, w: G.table.w + 16, h: G.table.h + 16},
    {x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R - 6, w: 2 * G.clock.R + 12, h: 2 * G.clock.R + 12},
    {x: G.door.a, y: G.H - (G.door.b - G.door.a), w: G.door.b - G.door.a, h: G.door.b - G.door.a},
  ];
  for (const s of SIDES) { const l = G.lecterns[s]; out.push({x: l.cx - 40, y: l.cy - 40, w: 80, h: 80}); }
  return out;
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

/** ● / ◆ plate body + glyph + text (or placeholder bars when no text is shown). */
function plateParts(ctx, name, box, fit, kind, Ft, o = {}) {
  const c = hearingColors(ctx);
  const gs = Ft ? Ft * 0.32 : 7;
  const gx = box.x + GX(gs), gy = fit ? box.y + 7 + fit.size * 0.55 : box.y + box.h / 2;
  const bars = [];
  if (!fit) for (let i = 0; i < 2; i++) bars.push(`M${r(box.x + 34)} ${r(box.y + box.h * (0.36 + i * 0.3))}H${r(box.x + box.w - (i ? 50 : 14))}`);
  return [
    h('path', {name: `${name}-body`, d: roundRectPath(box.x, box.y, box.w, box.h, 7), fill: o.fill || c.card, stroke: INK, 'stroke-width': 2.2}),
    o.noGlyph ? null : stateGlyph(ctx, {name: `${name}-g`, kind, cx: gx, cy: gy, s: gs}),
    o.noText ? null : fit ? g({name: `${name}-text`}, textAt(fit, box.x + TX(gs), box.y + 7, INK)) : h('path', {d: bars.join(''), stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}),
  ];
}

/** The glyph of a side: ● for A, ◆ for B. */
export const kindOf = s => (s === 'a' ? 'dot' : 'diamond');

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G cpGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, cardFits?:any, refsFits?:any, keep?:(b:any)=>boolean, sides?:string[], cardsIn?:boolean, datum?:any, noLinks?:boolean, pulse?:boolean, places?:boolean}} o
 *   sides: whose links exist (contrast: one per room); cardsIn: the cards arrive from the parties' hands (contrast);
 *   datum (inspect): {fits: {before, after}, wasFit} — argument A's reference plate in both values, the old one docked
 */
export function cpRoom(ctx, G, o) {
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
    {side: 'left', a: Math.max(G.yB + 100, H * 0.6), b: Math.max(G.yB + 170, H * 0.6 + 70), kind: 'window'},
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
    if (keepRefs.b) boardParts.push(g({name: `${P}-refs-b`}, plateParts(ctx, `${P}-refs-b`, G.refs.b, fB, 'diamond', o.Ft, {fill: '#ffffff'})));
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
          : h('path', {d: `M${r(ra.x + 34)} ${r(ra.y + ra.h / 2)}H${r(ra.x + ra.w - 14)}`, stroke: c.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'})));
      if (fits) boardParts.push(g({name: `${P}-refs-a-v-before`, opacity: 1, transform: 'translate(0 0)'}, g({name: `${P}-refs-a-v-before-text`}, textAt(fits.before, ra.x + TX(gs), ra.y + 7, INK))));
    }
  }
  for (const s of SIDES) {
    if (!keepCard[s]) continue;
    const fit = o.cardFits ? o.cardFits[s] : null;
    boardParts.push(g({name: `${P}-card-${s}`, transform: 'translate(0 0) scale(1)', opacity: o.cardsIn ? 0 : 1},
      h('path', {d: roundRectPath(G.card[s].x + 3, G.card[s].y + 4, G.card[s].w, G.card[s].h, 7), fill: th.shadow}),
      plateParts(ctx, `${P}-card-${s}`, G.card[s], fit, kindOf(s), o.Ft)));
  }
  parts.push(g({name: `${P}-board`, transform: 'translate(0 0)'}, boardParts));
  // the evidence table with its exhibits (numbered when text is shown)
  const tb = G.table;
  const keepTable = keep(tb);
  // (exhibit numbers: at the text size, or — text-free rooms keyed to a shared panel — at `numFt`)
  const nF = o.Ft || o.numFt || 0;
  if (keepTable) {
    parts.push(g({name: `${P}-evidence`, transform: 'translate(0 0)'},
      planTable(ctx, {name: `${P}-table`, cx: tb.x + tb.w / 2, cy: tb.y + tb.h / 2, w: tb.w, h: tb.h, seedKey: 'evidence-table'}),
      G.exhibits.map((e, i) => g({name: `${P}-ex${i}`, transform: 'translate(0 0)'},
        exhibitBox(ctx, {name: `${P}-exhibit${i}`, cx: e.cx, cy: e.cy, s: e.s, deg: 0}),
        nF ? g({name: `${P}-exnum${i}`},
          h('circle', {cx: r(e.cx), cy: r(e.numY), r: r(nF * 0.8), fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
          h('text', {x: r(e.cx), y: r(e.numY + nF * 0.35), 'font-family': FONT, 'font-size': r(nF, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(i + 1))) : null))));
  }
  // lecterns (identical, mirrored), chairs
  for (const s of SIDES) {
    const l = G.lecterns[s];
    if (keep({x: l.cx - 30, y: l.cy - 30, w: 60, h: 60})) parts.push(planLectern(ctx, {name: `${P}-lectern-${s}`, cx: l.cx, cy: l.cy, s: l.s, deg: l.deg}));
  }
  R.listeners.forEach(i => { const s = G.seats[i]; if (keep(personBox(s))) parts.push(planChair(ctx, {name: `${P}-chair${i}`, cx: toWorld(s, {x: 0, y: 14}).x, cy: toWorld(s, {x: 0, y: 14}).y, deg: s.deg, s: 64})); });
  // the links: one line per invoked exhibit, a start dot on the card's lower edge and the side's marker at the tip
  const linkNodes = [];
  const keepLinks = !o.noLinks && (!o.keep || false);
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

  /**
   * @param {{clockDeg:number, reach?:{a?:any, b?:any}, draw?:{a?:number[], b?:number[]}, cardIn?:{a?:number,b?:number},
   *   cardScale?:{a?:number,b?:number}, tableScale?:number, spread?:number, rest?:any, textK?:number, cue?:number,
   *   datum?:{move:number, newIn:number, copy?:number, was?:number, dockK?:number, mark?:number}, personScale?:any}} st
   */
  function frame(st) {
    const nodes = {};
    Object.assign(nodes, door.frame(0));
    if (keepClock) Object.assign(nodes, clock.frame(st.clockDeg));
    const tk = st.textK ?? 1;
    const spread = st.spread ?? 1;
    // (mechanism: at rest the cards stand closer together and the exhibits lie closer together; they separate)
    const rest = st.rest || null;
    const cardDx = s => (rest ? rest.card[s] * (1 - spread) : 0);
    const exDx = i => (rest ? rest.ex[i] * (1 - spread) : 0);
    // where a point of a card / of an exhibit is drawn now (spread offset, then the card's or the table's scale): the
    // links follow their card and their exhibit exactly
    const cardMap = (s, p) => {
      const cb = G.card[s], sc = st.cardScale ? st.cardScale[s] ?? 1 : 1;
      const ccx = cb.x + cb.w / 2 + cardDx(s), ccy = cb.y + cb.h;
      return {x: ccx + (p.x + cardDx(s) - ccx) * sc, y: ccy + (p.y - ccy) * sc};
    };
    const exMap = (i0, p, i1 = i0) => {
      const ts = st.tableScale ?? 1;
      const tcx = G.table.x + G.table.w / 2, tcy = G.table.y + G.table.h / 2;
      const dx = i0 === i1 ? exDx(i0) : 0;
      return {x: tcx + (p.x + dx - tcx) * ts, y: tcy + (p.y - tcy) * ts};
    };
    for (const s of SIDES) {
      if (!keepCard[s]) continue;
      const cb = G.card[s];
      const inK = o.cardsIn ? clamp(st.cardIn ? st.cardIn[s] ?? 0 : 0) : 1;
      const sc = st.cardScale ? st.cardScale[s] ?? 1 : 1;
      let tr = `translate(${r(cardDx(s))} 0)`;
      if (o.cardsIn) {
        // (the card comes out of its party's raised hand, growing, to its place)
        const q = ease.inOutCubic(inK);
        // (it appears just beyond the raised hand, towards its place: the card never lies on the arm that brings it)
        const h0 = G.aims[s].target;
        const dx0 = cb.x + cb.w / 2 - h0.x, dy0 = cb.y + cb.h / 2 - h0.y, d0 = Math.hypot(dx0, dy0) || 1;
        const a0 = {x: h0.x + (dx0 / d0) * 46, y: h0.y + (dy0 / d0) * 46};
        const s0 = 0.18;
        const sx = lerp(s0, 1, q);
        const x0 = lerp(a0.x - cb.w * s0 * 0.5, cb.x, q), y0 = lerp(a0.y - cb.h * s0 * 0.5, cb.y, q);
        tr = `translate(${r(x0 - cb.x * sx)} ${r(y0 - cb.y * sx)}) scale(${r(sx, 4)})`;
      } else if (sc !== 1) {
        // (shifted by its spread offset, then scaled about the middle of its lower edge: see cardMap)
        const ccx = cb.x + cb.w / 2 + cardDx(s), ccy = cb.y + cb.h;
        tr = `translate(${r(ccx * (1 - sc) + cardDx(s) * sc)} ${r(ccy * (1 - sc))}) scale(${r(sc, 4)})`;
      }
      nodes[`${P}-card-${s}`] = {transform: tr, opacity: r(o.cardsIn ? (inK > 0 ? 1 : 0) : 1, 3)};
      // (st.cardTextK: a card whose enlarged copy a lens holds hides its own text meanwhile — one copy at a time)
      const ck = st.cardTextK ? st.cardTextK[s] ?? 1 : 1;
      if (o.cardFits && o.cardFits[s]) nodes[`${P}-card-${s}-text`] = {opacity: r((o.cardsIn ? tk * clamp((inK - 0.85) / 0.15) : tk) * ck, 3)};
      if (st.cardTextK) nodes[`${P}-card-${s}-g`] = {opacity: r(ck, 3)};
    }
    if (keepTable) {
      const ts = st.tableScale ?? 1;
      const tcx = G.table.x + G.table.w / 2, tcy = G.table.y + G.table.h / 2;
      nodes[`${P}-evidence`] = {transform: ts === 1 ? 'translate(0 0)' : `translate(${r(tcx - tcx * ts)} ${r(tcy - tcy * ts)}) scale(${r(ts, 4)})`};
      G.exhibits.forEach((_, i) => {
        nodes[`${P}-ex${i}`] = {transform: `translate(${r(exDx(i))} 0)`};
        if (nF) nodes[`${P}-exnum${i}`] = {opacity: r(o.Ft ? tk : 1, 3)};
      });
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
        const to = exMap(lk0.ex, lk.to, G.linksAlt && cue >= 1 ? G.linksAlt[s][j].ex : lk0.ex);
        const q = clamp(dr[j] ?? 0);
        const e = ease.inOutSine(q);
        const tip = {x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e)};
        tips[s][j] = tip;
        // (data-ex / data-full: the exhibit this line lands on and whether it has landed — read by the anchoring checks)
        const exNow = !G.linksAlt || cue <= 0 ? lk0.ex : cue >= 1 ? G.linksAlt[s][j].ex : '';
        nodes[`${P}-link-${s}${j}`] = {opacity: q > 0 ? 1 : 0, d: `M${r(from.x)} ${r(from.y)}L${r(tip.x)} ${r(tip.y)}`, 'data-ex': String(exNow), 'data-full': q >= 1 ? 1 : 0};
        nodes[`${P}-link-${s}${j}-s`] = {opacity: q > 0 ? 1 : 0, cx: r(from.x), cy: r(from.y)};
        // (the marker shows once the tip has left the card's edge by more than its own radius: it never covers the card)
        const run = Math.hypot(tip.x - from.x, tip.y - from.y);
        nodes[`${P}-link-${s}${j}-m`] = {opacity: r(q > 0 ? clamp((run - LINK.glyph - 10) / 14) : 0, 3), transform: `translate(${r(tip.x)} ${r(tip.y)})`};
      });
    }
    // people: everybody stays in place; the parties raise a hand towards their own card when supplied
    let reached = true;
    const hands = [];
    rigs.forEach((rg, i) => {
      if (!rg) return;
      const s = G.seats[i];
      const ps = st.personScale ? st.personScale[i] ?? 1 : 1;
      const pose = {x: s.x, y: s.y, deg: s.deg, seated: s.standing ? 0 : 1, scale: ps};
      Object.assign(nodes, rg.pose(pose));
      const side = s.standing ? s.side : null;
      const rc = side && st.reach ? st.reach[side] : null;
      const arm = side ? G.aims[side].arm : 'armR';
      const rr = reachRecords({name: `${P}-p${i}`}, pose, rc ? rc.target : pose, {k: rc ? rc.k : 0, arm});
      if (rc) Object.assign(nodes, rr.nodes);
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
 * Timing (u) of the action inside [t0, t1]: both parties raise a hand towards their card (cause); the links are drawn
 * link by link, the j-th link of A and the j-th link of B in the same window (equal pace, no order between the sides);
 * the hands come down once every link has landed.
 */
export function cpTiming(t0, t1, n) {
  const L = t1 - t0;
  const at = f => t0 + L * f;
  const nn = Math.max(1, n);
  const d0 = at(0.16), d1 = at(0.9);
  const span = (d1 - d0) / nn;
  const windows = Array.from({length: nn}, (_, j) => [d0 + j * span, d0 + j * span + span * 0.82]);
  return {point: [at(0), at(0.12)], windows, lower: [at(0.92), at(1)], t0, t1};
}

/** The stage at u: hand raise per side and each link's drawing progress (the same for both sides at every u). */
export function cpStageAt(G, R, TM, u, o = {}) {
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  const e = ease.inOutCubic;
  const sides = o.sides || SIDES;
  const k = e(pos(u, ...TM.point)) * (1 - e(pos(u, ...TM.lower)));
  const reach = {};
  const draw = {a: [], b: []};
  for (const s of SIDES) {
    const on = sides.includes(s);
    reach[s] = on && k > 0 && !o.noHands ? {target: G.aims[s].target, k} : null;
    G.links[s].forEach((_, j) => { draw[s][j] = on ? pos(u, ...(TM.windows[j] || TM.windows[TM.windows.length - 1])) : 0; });
  }
  const all = sides.flatMap(s => draw[s]);
  const state = !all.length ? 'none' : all.every(q => q >= 1) ? 'linked' : all.some(q => q > 0) ? 'linking' : 'none';
  return {k: o.noHands ? 0 : k, reach, draw, state};
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box, with its chips (design units)   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolveCp()
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {number} F label text size (design units)
 * @param {{scale?:number, chips?:boolean, text?:boolean, align?:any, refs?:{a:{before:string, after:string}, b:string}|null,
 *   wasText?:string, marker?:boolean, extraH?:number, chipMaxW?:number, exStep?:number, extraGap?:number, linksAlt?:any}} [o]
 */
export function composeCp(ctx, P, R, box, F, o = {}) {
  const t = WALL;
  const sc = o.scale ?? 1;
  const ar = box.w / box.h;
  const withText = o.text !== false;
  const geoAt = (W, H, k) => {
    const Ft = F / k;
    // (plates wrap into at most three lines, or four without a lone short word on a line — item 13: the plate widens
    // instead; the first untruncated fit is the fallback)
    const lone = f => f.lines.length > 1 && f.lines.some(ln => ln.trim().split(/\s+/).length === 1);
    // (a tall room box takes narrower cards with more lines; a wide one wider cards with fewer)
    // (o.cardLines: an entry may ask for taller, narrower cards — opt-in, the default is unchanged)
    const maxL = o.cardLines ?? (ar < 1.05 ? 5 : ar > 1.9 ? 2 : 3);
    const fitAt = (text, maxW, mL = maxL) => {
      let f = null, first = null;
      for (const q of [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.35, 1.5, 1.7, 1.9, 2.2, 2.5, 2.8, 3.4, 4.2]) {
        if (q < 0.7 && mL < 3) continue;
        f = fitCp(text, {maxWidth: Math.max(maxW * q, Ft * 4), size: Ft, minSize: Ft, maxLines: 6, weight: 600});
        if (f.truncated) continue;
        if (!first) first = f;
        if (!lone(f) && f.lines.length <= mL) return f;
      }
      return first || f;
    };
    const plateW = clamp(Ft * 9.5, 180, 260);
    const cardFits = withText ? {a: fitAt(R.args.a.text, plateW), b: fitAt(R.args.b.text, plateW)} : null;
    let refsFits = null, dockH = 0, dockW = 0, wasFit = null;
    if (o.refs) {
      if (withText) {
        const rL = ar > 1.9 ? 2 : 3;
        refsFits = {a: {before: fitAt(o.refs.a.before, plateW, rL), after: fitAt(o.refs.a.after, plateW, rL)}, b: fitAt(o.refs.b, plateW, rL)};
        const fa = refsFits.a;
        refsFits.a = {...fa, width: Math.max(fa.before.width, fa.after.width), height: Math.max(fa.before.height, fa.after.height), size: fa.before.size};
        wasFit = fitG(o.wasText || 'was', {maxWidth: 200, size: Ft, minSize: Ft, maxLines: 1, weight: 500});
        dockH = wasFit.height + Ft * 0.6 + fa.before.height + 18;
        dockW = Math.max(wasFit.width, fa.before.width) + 20;
      } else {
        refsFits = {a: null, b: null};
        dockH = 30;
      }
    }
    const G = cpGeometry(W, H, R, {cardFits, refsFits: o.refs ? refsFits : null, dockH, dockW, linkGap: o.linkGap, Ft: withText ? Ft : null, numFt: o.numbers ? Ft : 0, noChips: !o.chips, markR: o.marker ? (withText ? Ft * 2.6 : 60) : 0, exStep: o.exStep, extraGap: o.extraGap, linksAlt: o.linksAlt});
    G.Ft = withText ? Ft : null;
    G.numFt = o.numbers ? Ft : 0;
    G.cardFits = cardFits;
    G.refsFits = refsFits;
    G.refsFitsAB = refsFits && refsFits.a && refsFits.a.before ? {before: refsFits.a.before, after: refsFits.a.after} : null;
    G.wasFit = wasFit;
    return G;
  };
  let k = box.w / 1200, G = null, W = 0, H = 0;
  for (let it = 0; it < 4; it++) {
    const G0 = geoAt(2000, 2000, k);
    W = Math.max(G0.needW * sc, 640 * sc);
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
  // a line never crosses a person other than... nobody: the links run from the board to the table only
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
      for (const s2 of SIDES) {
        const l2 = G.lecterns[s2];
        for (let i = 0; i <= 20; i++) {
          const x = lerp(lk.from.x, lk.to.x, i / 20), y = lerp(lk.from.y, lk.to.y, i / 20);
          if (Math.hypot(x - l2.cx, y - l2.cy) < 40) { problems.push('link-over-lectern'); break; }
        }
      }
    }
  }
  const bounds = {x: ox + 10 * k, y: oy + 10 * k, w: (W - 20) * k, h: (H - 20) * k};
  const equip = [...cpObstacles(G), ...linkSamples(G, ['links', 'linksAlt'])].map(bD);
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

/** Legend rows: ● / ◆ (equal weight) and the numbered exhibits. */
export function cpRows(R, P, prefix = 'lg', o = {}) {
  const rows = [];
  rows.push({kind: 'legend', glyphKind: 'started', text: P.states.a, name: `${prefix}-a`});
  rows.push({kind: 'legend', glyphKind: 'pending', text: P.states.b, name: `${prefix}-b`});
  if (o.exhibits !== false) R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `${prefix}-ex${i}`}));
  return rows;
}

/** Panel row node: this motif's glyphs (argument cards, the link kinds, the board, the table), else the shared rows. */
export function cpRowNode(ctx, m, o = {}) {
  const KINDS = ['argA', 'argB', 'board', 'table', 'kind-relation', 'kind-communication', 'kind-sequence', 'kind-causal', 'room'];
  if (m.kind === 'legend' && KINDS.includes(m.glyphKind)) {
    const th = ctx.theme;
    const s = m.glyph;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    if (m.glyphKind === 'argA' || m.glyphKind === 'argB') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.44), y: r(-s * 0.26), width: r(s * 0.88), height: r(s * 0.52), rx: 4, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
        stateGlyph(ctx, {kind: m.glyphKind === 'argA' ? 'dot' : 'diamond', cx: -s * 0.24, cy: 0, s: s * 0.11, fill: INK}),
        h('path', {d: `M${r(-s * 0.06)} ${r(-s * 0.08)}H${r(s * 0.34)}M${r(-s * 0.06)} ${r(s * 0.1)}H${r(s * 0.22)}`, stroke: '#9aa4ae', 'stroke-width': 2, 'stroke-linecap': 'round'}));
    } else if (m.glyphKind === 'board') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.46), y: r(-s * 0.26), width: r(s * 0.92), height: r(s * 0.52), rx: 4, fill: '#e9edf1', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.38), y: r(-s * 0.15), width: r(s * 0.34), height: r(s * 0.3), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.2}),
        h('rect', {x: r(s * 0.04), y: r(-s * 0.15), width: r(s * 0.34), height: r(s * 0.3), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.2}));
    } else if (m.glyphKind === 'table') {
      const c = hearingColors(ctx);
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.46), y: r(-s * 0.24), width: r(s * 0.92), height: r(s * 0.48), rx: 4, fill: c.wood, stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.3), y: r(-s * 0.11), width: r(s * 0.22), height: r(s * 0.16), rx: 2, fill: c.box, stroke: INK, 'stroke-width': 1.2}),
        h('rect', {x: r(s * 0.08), y: r(-s * 0.11), width: r(s * 0.22), height: r(s * 0.16), rx: 2, fill: c.box, stroke: INK, 'stroke-width': 1.2}));
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
 * ("Exhibit 1"); a lone capital letter (a party's letter) stays with the word BEFORE it ("argument A", "Party B") and never with the next one; a
 * short lower-case word (1–2 letters: "in", "de", "a") travels with the next word; a separator (·, –) stays at the end of the line before it;
 * "(as supplied)" / "(según lo aportado)" stays in one piece; the last two short groups stay together (no widow).
 */
export function cpGlue(text) {
  return String(text ?? '')
    .replace(/(\S)\s+(\d[\d.,:]*[)\]]?)(?=[\s,.;:)]|$)/g, '$1\u00a0$2')
    // a number never ends a line before its unit ("2 m", "5 %", "3 km", "10 min"): glued here, in this motif's wrap path
    // (fitWords keeps U+00A0 groups whole), never left to core wrap
    .replace(/(\d[\d.,]*)[ \t]+(mm|cm|m|km|m²|km²|ha|mg|g|kg|t|ml|l|s|min|h|d|%|‰|°C|°|€|\$|£)(?=[\s,.;:)]|$)/g, '$1\u00a0$2')
    .replace(/(\S)\s+([A-ZÁÉÍÓÚÑ])(?=[\s,.;:)]|$)/g, '$1\u00a0$2')
    .replace(/(^|\s)(\p{Ll}{1,2})\s+(?=\S)/gu, '$1$2\u00a0')
    .replace(/(\S)\s+([·–—])\s+/g, '$1\u00a0$2 ')
    .replace(/\((as|según)\s+(supplied|lo\s+aportado)\)/gi, m0 => m0.replace(/\s+/g, '\u00a0'))
    // (no widow: the last two groups travel together when they are short)
    .replace(/^(.*[^ \t])[ \t]+([^ \t]+)[ \t]+([^ \t]+)$/s, (m0, a, b, c) => ((b + c).length <= 24 ? `${a} ${b}\u00a0${c}` : m0));
}

/** Whole-word fit with this motif's glue; a box is never narrower than its widest glued group (measured). */
export function fitCp(text, o) {
  const t = cpGlue(text);
  const sz = o.minSize ?? o.size;
  const need = Math.max(0, ...t.split(/[ \t\n]+/).filter(Boolean).map(w => measure(w.replace(/\u00a0/g, ' '), sz, o.weight ?? 600, 'sans')));
  return fitWords(t, {...o, maxWidth: Math.max(o.maxWidth, need + 0.5)});
}

/** Panel row measure (the shared row kinds, ./apertura-audiencia.js `measureRow`) with this motif's glue. */
export function measureRowG(row, F, w) {
  const glyph = F * 1.9;
  if (row.kind === 'heading' || row.kind === 'state') {
    const padX = F * 0.6, padY = F * 0.36;
    const fit = fitCp(row.text, {maxWidth: w - padX * 2, size: F, minSize: F, maxLines: 4, weight: 700});
    return {...row, fit, h: fit.height + padY * 2, w: fit.width + padX * 2, padX, padY};
  }
  if (row.kind === 'legend' || row.kind === 'note') {
    const fit = fitCp(row.text, {maxWidth: w - glyph - F * 0.6, size: F, minSize: F, maxLines: 5, weight: 500});
    return {...row, fit, glyph, h: Math.max(glyph * 0.9, fit.height), w: glyph + F * 0.6 + fit.width};
  }
  if (row.kind === 'key') {
    const fit = fitCp(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 4, weight: 500});
    return {...row, fit, h: fit.height + F * 0.5, w: fit.width};
  }
  const fit = fitCp(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: row.bold ? 700 : 500});
  return {...row, fit, h: fit.height, w: fit.width};
}

/** True when a wrapped text has a line holding a single word (a widow on a label or a plate). */
export const hasLoneWord = f => !!f && f.lines.length > 1 && f.lines.some(ln => ln.trim().split(/\s+/).filter(Boolean).length === 1);

/**
 * Measure a panel row (shared row kinds), re-wrapping it narrower when a line would hold a single word: the text is
 * rebalanced instead of leaving a widow; the column width is unchanged.
 */
export function measureRowCp(row, F, w) {
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
 * @param {{sizes:number[], minF:number, colFracs?:number[], bandCols?:number[], minPersonPx?:number, scales?:number[], targetPx?:number, compose:(box:any,F:number,scale:number)=>any}} o
 */
export function searchCp(ctx, rows, o) {
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
      const ms = rows.map(rw => measureRowCp(rw, F, pw));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, 1);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, 1, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols: 1};
    });
    // (a right-hand panel in two columns, for heavy panels on wide and square frames)
    if (shape !== 'portrait') for (const [cf, cols] of o.sidePanels || []) arrangements.push(F => {
      const pw = D.w * cf;
      const colW = (pw - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowCp(rw, F, colW));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, cols);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, cols, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols};
    });
    if (shape !== 'landscape') for (const cols of o.bandCols || [2, 3]) arrangements.push(F => {
      const colW = (D.w - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowCp(rw, F, colW));
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
