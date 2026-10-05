/**
 * "Solicitud de autorización" kit (LAW-0329..0332, review-03): a generic, fictional room drawn as a floor plan, in which
 * a placeholder PETITION sheet passes, along a path CONFIGURED BY THE USER between abstract stations, into the
 * prior-examination tray ("bandeja de examen previo") of the path’s last stop.
 *
 * Legal risk is VERY HIGH (leave or permission to appeal), so the drawing carries no rule at all:
 *  - the stations ("Puesto A/B (ficticio)" by default) are abstract, of the SAME size, side by side on ONE row (the same
 *    baseline y), in the order supplied — no level, rank or hierarchy, no court name;
 *  - the prior-examination tray is a neutral, generic two-slot tray like every other station's tray; only a small plain
 *    tab marks it as the last stop's tray (no criterion, threshold, filter or admission gate);
 *  - the two supplied states have EQUAL weight (● and ◆ on the same disc, same ink): ● "authorization requested (as
 *    supplied)" — the petition alone —, ◆ "decision supplied (as supplied)" — a second placeholder sheet ("Decision:
 *    text supplied") lies in the tray's other slot. The decision's CONTENT is never shown (filler bars only); no
 *    outcome (granted / refused / admitted), time limit or jurisdiction is drawn or implied;
 *  - the path is only the supplied order of stations (numbered neutral steps, no arrowheads). The wall calendar is a
 *    fixture only (no date marked).
 *
 * The concrete action — "a petition passes to a prior-examination tray": a generic participant takes the petition from
 * the tray of the path's first station, carries it along every numbered step (dipping it into each tray it passes) and
 * lays it in the prior-examination tray.
 *
 * Copied from ./ruta-recurso.js (review-02; that kit and its entries stay unchanged) and adapted — never imported.
 * Generic art comes from ../../courts/kits/courts-art.js and ../../hearings/kits/hearings-art.js, and text and panel
 * helpers from ../../hearings/kits/apertura-audiencia.js — all imported READ-ONLY.
 * @module animations/review/kits/solicitud-autorizacion
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath, cubic, polyline} from '../../../core/geometry.js';
import {measure} from '../../../core/text.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {floorArea, wallRing, planPerson, PERSON} from '../../courts/kits/courts-art.js';
import {hearingColors, stateGlyph, reachRecords} from '../../hearings/kits/hearings-art.js';
import {FONT, WALL, fitWords, textAt, mapper, mapBox, rowNode, layoutRows, pxPerUnit, localised} from '../../hearings/kits/apertura-audiencia.js';

export const INK = '#1f2328';
/** Route lines: one colour and one weight for both states (the dash only says "pending"). */
export const LINE = {color: '#3b4550', base: '#b4bcc4', width: 6, dash: '17 13'};
/** The placeholder decision sheet (template units at docK = 1). */
export const DOC = {w: 64, h: 84};
/** The courier holds the sheet's lower edge: it stands CARRY_DX to the left of the sheet and HOLD below its centre. */
const CARRY_DX = 20;
const HOLD_GAP = 58;
const LIFT = 1.06;
/** After letting go, the courier steps back this far (template units), clear of the tray and the stations. */
const BACK = 46;
const SAFE_OUTFITS = [0, 2, 3, 4, 5, 7];
/** Gap between the two slots of a tray (template units). */
const SLOT_GAP = 12;
export const SIDES = ['a', 'b'];
export const LETTERS = ['A', 'B', 'C', 'D'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/** Fields shared by the four entries (brief: decisions, routes, outcomes; grounds are left out — see the presets). */
export const saFields = {
  decisions: obj('The petition and the supplied decision (fictional placeholder sheets — no text is drawn on either; the decision\'s content is never shown)', {
    title: str('Name of the petition sheet (fictional, as supplied)', 70),
    supplied: str('Name of the supplied decision placeholder sheet (its content is never shown)', 70),
  }, ['title', 'supplied']),
  routes: obj('The path as configured (as supplied): abstract, fictional stations of the same size on one row, and the supplied order in which the petition passes them; the last stop holds the prior-examination tray. No rank, level or hierarchy is drawn or implied', {
    bodies: list('Abstract stations (fictional), drawn at the same size on one row, in this order', obj('Station', {
      label: str('Label of the station (fictional, as supplied)', 60),
    }, ['label']), 2, 4),
    steps: list('The configured path: indices in `bodies`, in the supplied order (consecutive repeats are ignored). Each step between two of them is drawn and numbered; direction comes only from this order; the last stop holds the prior-examination tray', int('Index in `bodies`', 0, 3), 2, 5),
  }, ['bodies', 'steps']),
  outcomes: obj('Captions of the two supplied states (equal weight; nothing is inferred from either)', {
    a: str('Caption of ● (authorization requested, as supplied)', 80),
    b: str('Caption of ◆ (decision supplied, as supplied — a placeholder only)', 80),
  }, ['a', 'b']),
  labels: obj('Editable captions', {
    route: str('Heading of the configured path (keep "as supplied")', 80),
    sequence: str('Caption of the numbered steps (keep "as configured")', 90),
    exam: str('Caption of the prior-examination tray (a neutral tray)', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['route', 'sequence', 'exam', 'key']),
};

/** The courier (story and contrast). */
export const courierField = obj('The generic participant who carries the document (fictional; no role, rank or duty implied)', {
  label: str('Label of the participant (as supplied)', 60),
  appearance,
}, ['label']);

export const SA_EN = {
  decisions: {title: 'Petition (fictional; placeholder text)', supplied: 'Decision: text supplied (content not shown)'},
  routes: {bodies: [{label: 'Station A (fictional)'}, {label: 'Station B (fictional)'}], steps: [0, 1]},
  outcomes: {a: 'Authorization requested (as supplied)', b: 'Decision supplied (as supplied)'},
  labels: {route: 'Path as configured (as supplied)', sequence: 'Steps numbered in the supplied order (illustrative)', exam: 'Prior-examination tray: a neutral tray at the path’s last stop', key: 'As supplied · no conclusion drawn'},
};

export const SA_ES = {
  decisions: {title: 'Petición (ficticia; texto provisional)', supplied: 'Decisión: texto aportado (contenido no mostrado)'},
  routes: {bodies: [{label: 'Puesto A (ficticio)'}, {label: 'Puesto B (ficticio)'}], steps: [0, 1]},
  outcomes: {a: 'Autorización solicitada (según lo aportado)', b: 'Decisión suministrada (según lo aportado)'},
  labels: {route: 'Recorrido configurado (según lo aportado)', sequence: 'Pasos numerados en el orden aportado (ilustrativo)', exam: 'Bandeja de examen previo: una bandeja neutra en la última parada', key: 'Según lo aportado · sin conclusión'},
};

export const COURIER_EN = {label: 'Participant carrying the petition (fictional)'};
export const COURIER_ES = {label: 'Participante que lleva la petición (ficticio)'};

/** Localise (untouched defaults follow locale=es). */
export function localisedSa(ctx, EN, ES) {
  return {...localised(ctx, EN, ES)};
}

/**
 * Resolve the supplied content: the bodies, the route (consecutive repeats and unknown bodies dropped; at least two
 * stops) and the courier.
 */
export function resolveSa(ctx, P) {
  const bodies = ((P.routes && P.routes.bodies) || []).slice(0, 4).map((b, i) => ({index: i, label: b.label, letter: LETTERS[i]}));
  const n = bodies.length;
  const steps = [];
  for (const v of (P.routes && P.routes.steps) || []) {
    const q = Math.round(v);
    if (q < 0 || q >= n) continue;
    if (steps.length && steps[steps.length - 1] === q) continue;
    steps.push(q);
  }
  if (steps.length < 2) { steps.length = 0; steps.push(0, Math.min(1, n - 1)); }
  let courier = null;
  if (P.courier) {
    const ap = {...(P.courier.appearance || {})};
    if (ap.outfit === undefined) ap.outfit = SAFE_OUTFITS[Math.floor(ctx.rng('outfit-base') * SAFE_OUTFITS.length) % SAFE_OUTFITS.length];
    courier = {index: 0, label: P.courier.label, look: actorLook(ctx, {appearance: ap}, 0)};
  }
  return {n, bodies, steps, courier, exam: steps[steps.length - 1]};
}

/* ------------------------------------------------------------------ */
/* Room geometry (template units)                                      */
/* ------------------------------------------------------------------ */

const padTop = fit => (fit ? Math.max(12, fit.size * 0.32) : 14);

/**
 * @param {number} W
 * @param {number} H
 * @param {any} R resolveSa()
 * @param {{Ft?:number|null, nameFits?:any[]|null, letters?:number, docK?:number, gap?:number, courier?:boolean,
 *   board?:{w:number,h:number}|null, extraH?:number, depthK?:number}} [o]
 *   nameFits: the bodies' name fits (labels shown) — or letters (a letter badge of that size, text-free rooms) — or
 *   neither (placeholder bars); board: the size of the status board on the bottom wall (none when null).
 */
export function saGeometry(W, H, R, o = {}) {
  const t = WALL;
  const docK = o.docK || 1;
  const DW = DOC.w * docK, DH = DOC.h * docK;
  // (two-slot trays: the petition's slot on the right, the supplied decision's slot on the left — the same in every tray)
  const TW = 2 * DW + 26 + SLOT_GAP, TH = DH + 22;
  const nf = o.nameFits || null;
  const Lf = o.letters || 0;
  const nameH = nf ? Math.max(...nf.map(f => f.height)) : Lf ? Lf * 1.25 : 30;
  const nameW = nf ? Math.max(...nf.map(f => f.width)) : 0;
  // (opt-in letterSide — LAW-0329, item 18: the letter badge stands beside the tray, not above it, so a station is
  // shorter and its tray and sheets can be drawn larger in a room bound by its height; only with letters, no names)
  const side = !!(o.letterSide && Lf && !nf);
  const sideW = side ? Lf * 1.24 + 14 : 0;
  // (signLow rooms are bound by their width: the plates hug their trays a little closer)
  const SW = side ? TW + 30 + sideW : Math.max(TW + (nf ? 44 : o.signLow && o.sign ? 20 : 30), nameW * 1.04 + 30, Lf ? Lf * 1.6 + 24 : 0);
  const pT = nf ? padTop(nf[0]) : 14;
  // (opt-in tabPad — LAW-0329: extra space between the names and the trays, so the prior-examination tray's tab never
  // meets a name's last line; every station alike)
  const tabPad = nf ? o.tabPad || 0 : 0;
  const SH = side ? Math.max(14 + TH + 12, Lf * 1.24 + 28) : pT + nameH + 12 + tabPad + TH + 12;
  const n = R.n;
  const gap = o.gap ?? 84;
  const rowW = n * SW + (n - 1) * gap;
  // (the left margin holds the wall calendar and, under it, the status sign; opt-in signLow — LAW-0329, item 18: both
  // stand low on the left wall, under the courier's lane, so a room bound by its width gives that margin to the row)
  const signW = o.signW || 90;
  const low = !!(o.signLow && o.sign);
  // (opt-in padL — LAW-0331: extra floor on the left of the row, under the sign and calendar, for an inset)
  const mL = (low ? 44 : o.sign ? Math.max(124, signW + 34) : 124) + (o.padL || 0), mR = 44;
  const x0 = mL + Math.max(0, (W - mL - mR - rowW) / 2);
  const yS = 24;
  const stations = R.bodies.map((_, i) => {
    const x = x0 + i * (SW + gap);
    if (side) {
      const tray = {x: x + SW - 15 - TW, y: yS + (SH - TH) / 2, w: TW, h: TH};
      return {x, y: yS, w: SW, h: SH, cx: x + SW / 2, pcx: tray.x + TW / 2, tray, doc: {x: tray.x + TW - 13 - DW / 2, y: tray.y + TH / 2}, slotD: {x: tray.x + 13 + DW / 2, y: tray.y + TH / 2}, nameY: yS + SH / 2 - Lf * 0.62, letterX: x + 15 + Lf * 0.62};
    }
    const tray = {x: x + (SW - TW) / 2, y: yS + SH - 12 - TH, w: TW, h: TH};
    return {x, y: yS, w: SW, h: SH, cx: x + SW / 2, tray, doc: {x: tray.x + TW - 13 - DW / 2, y: tray.y + TH / 2}, slotD: {x: tray.x + 13 + DW / 2, y: tray.y + TH / 2}, nameY: yS + pT};
  });
  const yP = yS + SH + 6;
  const HOLD = DH / 2 + HOLD_GAP;
  // ---- the route: one cubic per step, port to port
  const pairs = [];
  for (let j = 0; j + 1 < R.steps.length; j++) pairs.push([R.steps[j], R.steps[j + 1]]);
  // port slots along each station's lower edge: the ends of the steps at a station are spread over it, ordered by the
  // x of their other end (an arc towards the left leaves from the left part; the farther its other end, the more
  // outer its slot), so no two steps share a port and nested arcs do not cross at the station
  const atSt = stations.map(() => []);
  const pcx = st => st.pcx ?? st.cx;
  pairs.forEach(([p, q], j) => { atSt[p].push({j, end: 'P', other: pcx(stations[q])}); atSt[q].push({j, end: 'Q', other: pcx(stations[p])}); });
  const port = pairs.map(() => ({P: null, Q: null}));
  const half = TW * 0.42;
  atSt.forEach((list0, i) => {
    const cx = stations[i].pcx ?? stations[i].cx;
    // (nested like brackets: ends whose other station lies to the left take the left part, the nearest one outermost;
    // ends towards the right the right part, the nearest one outermost — so arcs that share a station never cross there)
    const left = list0.filter(e0 => e0.other < cx).sort((a, b) => b.other - a.other);
    const right = list0.filter(e0 => e0.other >= cx).sort((a, b) => b.other - a.other);
    const sorted = [...left, ...right];
    const m = sorted.length;
    sorted.forEach((e0, k) => {
      const f = m === 1 ? (e0.other < cx ? -0.6 : 0.6) : lerp(-1, 1, k / (m - 1));
      port[e0.j][e0.end] = {x: cx + f * half, y: yP};
    });
  });
  const depthK = o.depthK || 1;
  const Ft = o.Ft || null;
  const DR = Math.max(Ft ? Ft * 0.92 : 0, Lf ? Lf * 0.62 : 0, 21);
  // (opt-in untangle — LAW-0325/0328, item 16: every step's disc on its own line, clear of every crossing; arcs that
  // overlap are stacked far enough apart in depth for a disc and its clearance to fit between their lines.
  // clear: the clearance (template units) between a disc's rim and another step's line or disc)
  const U = o.untangle || null;
  const arcs = [];
  const mkArc = (j, p, q, P, Q, d, lo, hi, stack) => {
    const c1 = {x: P.x, y: yP + d}, c2 = {x: Q.x, y: yP + d};
    const pts = [];
    const nS = U ? 80 : 40;
    for (let i = 0; i <= nS; i++) pts.push(cubic(P, c1, c2, Q, i / nS));
    return {j, from: p, to: q, P, Q, c1, c2, d, lo, hi, stack, pts, mid: cubic(P, c1, c2, Q, 0.5), deep: yP + 0.75 * d,
      dpath: `M${r(P.x)} ${r(P.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(Q.x)} ${r(Q.y)}`};
  };
  pairs.forEach(([p, q], j) => {
    const P = port[j].P, Q = port[j].Q;
    const span = Math.abs(Q.x - P.x);
    const lo = Math.min(P.x, Q.x), hi = Math.max(P.x, Q.x);
    let stack = 0;
    for (const a of arcs) { const ov = Math.min(hi, a.hi) - Math.max(lo, a.lo); if (ov > 0.3 * Math.min(hi - lo, a.hi - a.lo)) stack = Math.max(stack, a.stack + 1); }
    const d = (58 + span * 0.26 + stack * 52) * depthK;
    arcs.push(mkArc(j, p, q, P, Q, d, lo, hi, stack));
  });
  if (U) {
    const dNew = untangleDepths(arcs, {base: a => (58 + (a.hi - a.lo) * 0.26) * depthK, DR, clear: U.clear, lineW: LINE.width});
    arcs.forEach((a, i) => { arcs[i] = mkArc(a.j, a.from, a.to, a.P, a.Q, dNew.get(a), a.lo, a.hi, a.stack); });
  }
  // ---- step discs: on the arc's lowest point, or slid along it when two discs would touch
  const discs = [];
  if (U) {
    // (the courier's track: it walks HOLD below the sheet; a disc off that track is never walked over)
    const track = o.courier ? arcs.map(a => a.pts.map(pp => ({x: pp.x - CARRY_DX, y: pp.y + HOLD}))) : [];
    discs.push(...placeClearDiscs(arcs, {DR, clear: U.clear, lineW: LINE.width, yP, track, needT: PERSON.half + DR * 0.6}));
  }
  for (const a of U ? [] : arcs) {
    let pos = null;
    for (const tq of [0.5, 0.42, 0.58, 0.34, 0.66, 0.27, 0.73, 0.2, 0.8]) {
      const q = cubic(a.P, a.c1, a.c2, a.Q, tq);
      const clearArcs = arcs.every(b => b === a || b.pts.every(pp => Math.hypot(pp.x - q.x, pp.y - q.y) > DR + 5));
      if (discs.every(d0 => Math.hypot(d0.x - q.x, d0.y - q.y) > 2 * DR + 34) && clearArcs) { pos = {...q, tq}; break; }
    }
    if (!pos) {
      // (no place clear of everything: the place farthest from the other discs, off the other arcs when possible)
      let bestQ = null;
      for (let tq = 0.15; tq <= 0.851; tq += 0.05) {
        const q = cubic(a.P, a.c1, a.c2, a.Q, tq);
        const dMin = Math.min(1e9, ...discs.map(d0 => Math.hypot(d0.x - q.x, d0.y - q.y)));
        const offArcs = arcs.every(b => b === a || b.pts.every(pp => Math.hypot(pp.x - q.x, pp.y - q.y) > DR + 5));
        const sc = (offArcs ? 1e6 : 0) + Math.min(dMin, 4 * DR);
        if (dMin > 2 * DR + 10 && (!bestQ || sc > bestQ.sc)) bestQ = {...q, tq, sc, onArc: !offArcs};
      }
      if (bestQ) pos = bestQ;
    }
    if (!pos) pos = {...a.mid, tq: 0.5, clash: true};
    discs.push(pos);
  }
  const maxDeep = Math.max(yP + 40, ...discs.map(d0 => d0.y + DR), ...arcs.map(a => a.deep));
  // ---- the courier's lane (it follows the sheet HOLD below it, and steps BACK after letting go), then the board
  const courier = !!o.courier;
  const personMaxY = courier ? Math.max(...arcs.map(a => a.deep)) + HOLD : 0;
  const laneEnd = courier ? Math.max(personMaxY, Math.max(...stations.map(s => s.doc.y)) + HOLD + BACK) + PERSON.half + (side ? 12 : 22) : maxDeep + 18;
  const bd = o.board || null;
  // (clear of the route's discs: room for the source frame an inspection draws round the board)
  const boardY = laneEnd + (courier ? 6 : 36);
  let needH0 = (bd ? boardY + bd.h + 22 : laneEnd + 8) + (o.extraH || 0);
  // (the status sign hangs on the left wall under the calendar; signLow: in the bottom left corner, under the lane)
  const signH = Math.min(170, signW * 1.5);
  if (low) needH0 = Math.max(needH0, laneEnd + 10 + signH + 18);
  const sign = low ? {x: 18, y: Math.max(laneEnd + 10, H - 18 - signH), w: signW, h: signH} : o.sign ? {x: 18, y: 22, w: signW, h: signH} : null;
  // (room on the right of the last station for the courier stepping aside)
  const needW = Math.ceil(Math.max(mL + rowW + Math.max(mR, courier ? BACK + PERSON.half + 14 - (SW / 2 - CARRY_DX) : 0), bd ? bd.w + 120 : 0, 520) / 4) * 4;
  // (the wall calendar hangs on the left wall: in the top corner, or under the status sign when there is one)
  const clock = low ? {cx: sign.x + sign.w + 48, cy: sign.y + sign.h - 34, R: 28} : {cx: 56, cy: sign ? sign.y + sign.h + 52 : 58, R: 28};
  const needH = Math.ceil(Math.max(needH0, 380, low ? 0 : clock.cy + clock.R * 1.1 + 28) / 4) * 4;
  const Cx = x0 + rowW / 2;
  const board = bd ? {x: clamp(Cx - bd.w / 2, 30, W - 30 - bd.w), y: boardY + Math.max(0, (H - needH) * 0.5), w: bd.w, h: bd.h} : null;
  const problems = [];
  if (W + 0.5 < needW) problems.push('room-width');
  if (H + 0.5 < needH) problems.push('room-height');
  if (discs.some(d0 => d0.clash)) problems.push('disc-clash');
  // the journey of the document: tray → out-port → arc → in-port → tray, one polyline per step
  const journey = arcs.map(a => {
    const s0 = stations[a.from].doc, s1 = stations[a.to].doc;
    const pts = [s0, {x: a.P.x, y: a.P.y + 2}, ...a.pts.slice(1, -1), {x: a.Q.x, y: a.Q.y + 2}, s1];
    return polyline(pts);
  });
  const G = {W, H, t, docK, DW, DH, TW, TH, SW, SH, gap, stations, yS, yP, HOLD, sign, arcs, discs, DR, Ft, nameFits: nf, letters: Lf, board, clock, untangle: U,
    needW, needH, problems, journey, Cx, rowW, x0, courier, laneEnd, extents: {x: -t, y: -t, w: W + 2 * t, h: H + 2 * t}};
  G.rest = p => ({x: stations[p].doc.x - CARRY_DX, y: stations[p].doc.y + HOLD});
  return G;
}

/**
 * Untangled route depths (opt-in, item 16): every arc's control depth, widest arc outermost. An arc that overlaps a
 * narrower one (nested, or crossing it: their ends interleave) runs below it by at least a disc's radius plus the
 * clearance — so the narrower one's disc, at its lowest point, clears the wider one's line, and a crossing sits high on
 * the limbs, leaving both discs a free place lower down —; every arc is deep enough for its disc to sit below the row.
 * @param {Array<{lo:number, hi:number, j:number}>} arcs
 * @param {{base:(a:any)=>number, DR:number, clear:number, lineW:number}} o
 * @returns {Map<any, number>}
 */
export function untangleDepths(arcs, {base, DR, clear, lineW}) {
  const gapD = (DR + clear + lineW / 2 + 4) / 0.75;
  const order = [...arcs].sort((a, b) => (a.hi - a.lo) - (b.hi - b.lo) || a.j - b.j);
  const dNew = new Map();
  for (const a of order) {
    let d = Math.max(base(a), (DR + clear + 6) / 0.75);
    for (const b of order) {
      if (b === a || !dNew.has(b)) continue;
      const ov = Math.min(a.hi, b.hi) - Math.max(a.lo, b.lo);
      if (ov > 1) d = Math.max(d, dNew.get(b) + gapD);
    }
    dNew.set(a, d);
  }
  return dNew;
}

/** Distance from a point to a polyline. */
export function polyDist(q, pts) {
  let m = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a0 = pts[i - 1], b0 = pts[i];
    const vx = b0.x - a0.x, vy = b0.y - a0.y, L2 = vx * vx + vy * vy || 1e-9;
    const tt = clamp(((q.x - a0.x) * vx + (q.y - a0.y) * vy) / L2);
    m = Math.min(m, Math.hypot(a0.x + vx * tt - q.x, a0.y + vy * tt - q.y));
  }
  return m;
}

/**
 * Step discs clear of everything (opt-in, item 16): each on its own arc, its rim >= clear from every other arc's line
 * and from every other disc, below the row (yP) by the clearance; among those, off the optional tracks (the courier's
 * walk) when possible, then nearest the arc's lowest point. A disc with no clear place carries clash: true.
 * @param {Array<{P:any, c1:any, c2:any, Q:any, pts:any[], mid:any}>} arcs
 * @param {{DR:number, clear:number, lineW:number, yP:number, track?:any[][], needT?:number}} o
 */
export function placeClearDiscs(arcs, {DR, clear, lineW, yP, track = [], needT = 0}) {
  const needL = DR + clear + lineW / 2, needD = 2 * DR + clear;
  const discs = [];
  for (const a of arcs) {
    let best = null;
    for (let i = 0; i <= 36; i++) {
      const tq = 0.5 + (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.02;
      const q = cubic(a.P, a.c1, a.c2, a.Q, tq);
      if (q.y - DR < yP + clear) continue;
      const sL = Math.min(Infinity, ...arcs.filter(b => b !== a).map(b => polyDist(q, b.pts))) - needL;
      const sD = Math.min(Infinity, ...discs.map(d0 => Math.hypot(d0.x - q.x, d0.y - q.y))) - needD;
      const sT = Math.min(Infinity, ...track.map(t0 => polyDist(q, t0))) - needT;
      const hard = Math.min(sL, sD);
      const sc = (hard >= 0 ? 1e6 : hard * 100) + (sT >= 0 ? 1e4 : sT) - Math.abs(tq - 0.5) * 10;
      if (!best || sc > best.sc) best = {...q, tq, sc, slack: hard};
    }
    if (!best) best = {...(a.mid || cubic(a.P, a.c1, a.c2, a.Q, 0.5)), tq: 0.5, sc: -1e9, slack: -1};
    if (best.slack < 0) best.clash = true;
    discs.push(best);
  }
  return discs;
}

/** Obstacles of the room (template units): stations, board, calendar. */
export function saObstacles(G) {
  const out = G.stations.map(s => ({x: s.x - 6, y: s.y - 6, w: s.w + 12, h: s.h + 12}));
  if (G.board) out.push({x: G.board.x - 6, y: G.board.y - 6, w: G.board.w + 12, h: G.board.h + 12});
  out.push({x: G.clock.cx - G.clock.R - 6, y: G.clock.cy - G.clock.R * 1.1 - 10, w: 2 * G.clock.R + 12, h: 2.2 * G.clock.R + 18});
  return out;
}

export const personBox = s => ({x: s.x - PERSON.half - 8, y: s.y - PERSON.half - 8, w: PERSON.half * 2 + 16, h: PERSON.half * 2 + 16});

/* ------------------------------------------------------------------ */
/* Art                                                                 */
/* ------------------------------------------------------------------ */

/** The placeholder decision sheet from above, centred on the origin (white paper, a plain header band, filler lines). */
export function docArt(ctx, w, hh, o = {}) {
  const c = hearingColors(ctx);
  const lines = [];
  for (let i = 0; i < 4; i++) lines.push(`M${r(-w / 2 + 9)} ${r(-hh / 2 + hh * 0.36 + i * hh * 0.14)}H${r(w / 2 - 9 - (i === 3 ? w * 0.3 : 0))}`);
  const fold = Math.min(w, hh) * 0.2;
  return [
    o.noShadow ? null : h('rect', {x: r(-w / 2 + 4), y: r(-hh / 2 + 5), width: r(w), height: r(hh), rx: 3, fill: ctx.theme.shadow}),
    h('path', {d: `M${r(-w / 2)} ${r(-hh / 2)}H${r(w / 2 - fold)}L${r(w / 2)} ${r(-hh / 2 + fold)}V${r(hh / 2)}H${r(-w / 2)}Z`, fill: '#ffffff', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(w / 2 - fold)} ${r(-hh / 2)}V${r(-hh / 2 + fold)}H${r(w / 2)}`, fill: '#e3e7eb', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(-w / 2 + 8), y: r(-hh / 2 + 9), width: r(w * 0.52), height: r(hh * 0.13), rx: 2, fill: '#c3ccd5'}),
    h('path', {d: lines.join(''), stroke: c.paperLine, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
  ];
}

/** The dashed outline of the sheet (the "ghost": the configured route not checked — pending). */
function ghostArt(w, hh) {
  return [
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 4, fill: '#ffffff', 'fill-opacity': 0.45, stroke: LINE.color, 'stroke-width': 3, 'stroke-dasharray': '9 7'}),
    h('path', {d: `M${r(-w / 2 + 10)} ${r(-hh / 2 + hh * 0.38)}H${r(w / 2 - 10)}M${r(-w / 2 + 10)} ${r(-hh / 2 + hh * 0.56)}H${r(w / 2 - 18)}`, stroke: LINE.color, 'stroke-width': 2.4, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round', opacity: 0.8}),
  ];
}

/**
 * The supplied decision's placeholder sheet from above, centred on the origin: a sheet like the petition but with a full
 * grey header band and a plain frame — filler bars only (its content is never shown, nothing is written on it).
 */
export function decArt(ctx, w, hh, o = {}) {
  const c = hearingColors(ctx);
  const lines = [];
  for (let i = 0; i < 3; i++) lines.push(`M${r(-w / 2 + 12)} ${r(-hh / 2 + hh * 0.42 + i * hh * 0.15)}H${r(w / 2 - 12 - (i === 2 ? w * 0.28 : 0))}`);
  return [
    o.noShadow ? null : h('rect', {x: r(-w / 2 + 4), y: r(-hh / 2 + 5), width: r(w), height: r(hh), rx: 3, fill: ctx.theme.shadow}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(-w / 2), y: r(-hh / 2), width: r(w), height: r(hh * 0.2), rx: 3, fill: '#9aa4ae', stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(-w / 2 + 6), y: r(-hh / 2 + hh * 0.28), width: r(w - 12), height: r(hh * 0.64), rx: 2, fill: 'none', stroke: '#b9c1c9', 'stroke-width': 1.8}),
    h('path', {d: lines.join(''), stroke: c.paperLine, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
  ];
}

/** The small plain tab that marks the prior-examination tray (on the tray's top edge; no text, no symbol of a gate). */
export function examTab(tr, name) {
  const w = tr.w * 0.3, x = tr.x + tr.w * 0.6;
  return g({name},
    h('path', {d: `M${r(x)} ${r(tr.y + 1)}V${r(tr.y - 7)}Q${r(x)} ${r(tr.y - 10)} ${r(x + 3)} ${r(tr.y - 10)}H${r(x + w - 3)}Q${r(x + w)} ${r(tr.y - 10)} ${r(x + w)} ${r(tr.y - 7)}V${r(tr.y + 1)}Z`, fill: '#c3ccd5', stroke: '#5b6470', 'stroke-width': 2}),
    h('path', {d: `M${r(x + 7)} ${r(tr.y - 4)}H${r(x + w - 7)}`, stroke: '#7c8792', 'stroke-width': 2, 'stroke-linecap': 'round'}));
}

/**
 * The supplied state's icon (sign, record plate): a two-slot tray seen from above with the petition in its right slot —
 * a: the left slot empty (authorization requested); b: the supplied decision's sheet in it (decision supplied). The same
 * tray, the same ink weights for both.
 */
export function stateIcon({x, y, w, kind}) {
  const th = w * 0.46;
  const sw = w * 0.36, sh = th * 0.8;
  const sheet = (cx, band) => [
    h('rect', {x: r(cx - sw / 2), y: r(y - sh / 2), width: r(sw), height: r(sh), rx: 2, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(cx - sw / 2), y: r(y - sh / 2), width: r(band ? sw : sw * 0.5), height: r(sh * 0.22), rx: 2, fill: band ? '#9aa4ae' : '#c3ccd5'}),
  ];
  return [
    h('rect', {x: r(x), y: r(y - th / 2), width: r(w), height: r(th), rx: 4, fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 2}),
    h('path', {d: `M${r(x + w / 2)} ${r(y - th / 2 + 4)}V${r(y + th / 2 - 4)}`, stroke: '#aab3bc', 'stroke-width': 2}),
    sheet(x + w * 0.75, false),
    kind === 'b' ? sheet(x + w * 0.25, true) : null,
  ];
}

/** A blank wall calendar (a fixture only): header band and an empty grid; no date is marked. */
function wallCalendar(ctx, {name, cx, cy, R}) {
  const w = R * 1.9, hh = R * 2.1;
  const x0 = cx - w / 2, y0 = cy - hh / 2;
  const grid = [];
  const gx0 = x0 + 6, gx1 = x0 + w - 6, gy0 = y0 + hh * 0.36, gy1 = y0 + hh - 6;
  for (let i = 0; i <= 4; i++) { const x = lerp(gx0, gx1, i / 4); grid.push(`M${r(x)} ${r(gy0)}V${r(gy1)}`); }
  for (let j = 0; j <= 3; j++) { const y = lerp(gy0, gy1, j / 3); grid.push(`M${r(gx0)} ${r(y)}H${r(gx1)}`); }
  return g({name},
    h('rect', {x: r(x0 + 3), y: r(y0 + 5), width: r(w), height: r(hh), rx: 4, fill: ctx.theme.shadow}),
    h('rect', {x: r(x0), y: r(y0), width: r(w), height: r(hh), rx: 4, fill: '#ffffff', stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: r(x0), y: r(y0), width: r(w), height: r(hh * 0.28), rx: 4, fill: '#9aa4ae', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(cx - w * 0.22)} ${r(y0 - 4)}V${r(y0 + 7)}M${r(cx + w * 0.22)} ${r(y0 - 4)}V${r(y0 + 7)}`, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('path', {d: grid.join(''), stroke: '#b9c1c9', 'stroke-width': 1.6}));
}

/** A status glyph (● for a, ◆ for b) on a white disc — the same disc and the same ink for both. */
export function statusDisc(ctx, {name, kind, cx, cy, R, opacity}) {
  return g({name, opacity},
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: '#ffffff', stroke: LINE.color, 'stroke-width': r(Math.max(2, R * 0.12), 2)}),
    stateGlyph(ctx, {name: name ? `${name}-g` : undefined, kind: kind === 'a' ? 'dot' : 'diamond', cx, cy, s: R * 0.48}));
}

/** Pips for a step number (labels hidden: the order still reads without text). */
function pips(cx, cy, n, R) {
  const k = Math.min(n, 5);
  const rr = R * 0.15;
  const span = (k - 1) * rr * 2.6;
  const out = [];
  for (let i = 0; i < k; i++) out.push(h('circle', {cx: r(cx - span / 2 + i * rr * 2.6), cy: r(cy), r: r(rr), fill: LINE.color}));
  return out;
}

/**
 * Layout of the route's RECORD plate on the board (inspect), relative to the board's top-left corner (template units):
 * the plate — the state's glyph on its disc over a short route icon, and the supplied value (before / after, the same
 * box) — and, under it, the dock where the old value is kept after the substitution ("was" + the old value; labels
 * hidden: the old state's glyph and icon, small).
 * @param {{before:any, after:any}|null} fits the plate's value in both states (null: labels hidden)
 * @param {{was:any, rec:any}|null} dockFits
 * @param {number} gs glyph disc radius
 */
export function recordLayout(fits, dockFits, gs) {
  // (tight: the plate's value fills it, so an enlarged copy of the plate is mostly text; the padding keeps the glyphs'
  // ascent and descent inside the plate at large sizes)
  const pad = Math.max(10, fits ? fits.before.size * 0.24 : 0), m = 4;
  const iconW = gs * 2.2, iconH = gs * 1;
  const colW = Math.max(gs * 2, iconW);
  const textW = fits ? Math.max(fits.before.width, fits.after.width) : 70;
  const textH = fits ? Math.max(fits.before.height, fits.after.height) : 0;
  const leftH = gs * 2 + 8 + iconH;
  const plate = {x: m, y: m, w: pad + colW + (fits ? 12 + textW * 1.02 : 22) + pad, h: Math.max(textH, leftH) + 2 * pad};
  const disc = {cx: plate.x + pad + colW / 2, cy: plate.y + pad + gs};
  const icon = {x: plate.x + pad + (colW - iconW) / 2, y: plate.y + pad + gs * 2 + 8 + iconH * 0.5, w: iconW};
  const text = {x: plate.x + pad + colW + 12, y: plate.y + pad + Math.max(0, (leftH - textH) / 2)};
  const dW = dockFits ? dockFits.was.width + dockFits.rec.width + 10 * 2 + 12 : colW * 0.7 + 60;
  const dH = dockFits ? Math.max(dockFits.was.height, dockFits.rec.height) + 14 : gs * 1.4 + 20;
  const dock = {x: plate.x, y: plate.y + plate.h + 6, w: Math.max(plate.w, dW), h: dH};
  plate.w = Math.max(plate.w, dock.w);
  dock.w = plate.w;
  const w = plate.w + 2 * m, h = dock.y + dock.h + m;
  return {w, h, plate, disc, icon, text, dock, gs, pad, colW};
}

/* ------------------------------------------------------------------ */
/* Room builder                                                        */
/* ------------------------------------------------------------------ */

/**
 * Build the room (template units): nodes + frame(st).
 * @param {any} ctx
 * @param {any} G saGeometry()
 * @param {{prefix:string, R:any, Ft?:number|null, numbers?:boolean, letters?:boolean, sign?:boolean, docs?:number,
 *   keep?:(b:any)=>boolean, signFit?:any, ghost?:boolean, pins?:boolean, base?:boolean}} o
 *   numbers: the step discs carry their number (else pips); letters: the stations carry a letter badge (text-free
 *   rooms); sign: the status board shows a large ● / ◆ sign; docs: 2 draws a second sheet (inspect: the document's
 *   other place); keep: lens copies keep only what lies inside the crop.
 */
export function saRoom(ctx, G, o) {
  const P = o.prefix;
  const c = hearingColors(ctx);
  const th = ctx.theme;
  const R = o.R;
  const {W, H, t} = G;
  const keep = b => (o.keep ? o.keep(b) : true);
  const parts = [];
  parts.push(floorArea(ctx, {name: `${P}-floor`, x: 0, y: 0, w: W, h: H, kind: 'tiles', cell: 64}));
  parts.push(wallRing(ctx, {name: `${P}-walls`, x: 0, y: 0, w: W, h: H, t, gaps: []}));
  const calBox = {x: G.clock.cx - G.clock.R * 0.95, y: G.clock.cy - G.clock.R * 1.05 - 4, w: G.clock.R * 1.9, h: G.clock.R * 2.1 + 4};
  const keepClock = keep(calBox);
  if (keepClock) parts.push(wallCalendar(ctx, {name: `${P}-clock`, cx: G.clock.cx, cy: G.clock.cy, R: G.clock.R}));
  // the stations: the same size, on one row; name (or letter badge, or bars) at the top, the intake tray below
  const Ft = o.Ft || null;
  const keepSt = G.stations.map(s => keep(s));
  G.stations.forEach((s, i) => {
    if (!keepSt[i]) return;
    const fit = G.nameFits ? G.nameFits[i] : null;
    const tr = s.tray;
    const kids = [
      h('path', {d: roundRectPath(s.x + 4, s.y + 6, s.w, s.h, 10), fill: th.shadow}),
      h('path', {name: `${P}-st${i}-plate`, d: roundRectPath(s.x, s.y, s.w, s.h, 10), fill: '#eef1f4', stroke: INK, 'stroke-width': 2.4}),
      h('path', {name: `${P}-st${i}-tray`, d: roundRectPath(tr.x, tr.y, tr.w, tr.h, 6), fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 2}),
      h('path', {d: `M${r(tr.x + 6)} ${r(tr.y + 7)}H${r(tr.x + tr.w - 6)}`, stroke: '#c3cad1', 'stroke-width': 3, 'stroke-linecap': 'round'}),
      // (the divider between the two slots)
      h('path', {d: `M${r(tr.x + tr.w / 2)} ${r(tr.y + 12)}V${r(tr.y + tr.h - 8)}`, stroke: '#aab3bc', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
    ];
    // (the prior-examination tray: the same tray, marked only by a small plain tab on its top edge — no criterion or gate)
    if (i === R.exam) kids.push(examTab(tr, `${P}-exam`));
    if (fit) kids.push(g({name: `${P}-st${i}-text`}, textAt(fit, s.x + (s.w - fit.width) / 2, s.nameY, INK)));
    else if (G.letters) {
      const lr = G.letters * 0.62;
      const lx = s.letterX ?? s.cx;
      kids.push(g({name: `${P}-st${i}-lt`},
        h('circle', {cx: r(lx), cy: r(s.nameY + G.letters * 0.62), r: r(lr), fill: '#ffffff', stroke: INK, 'stroke-width': 2}),
        h('text', {name: `${P}-st${i}-ltx`, x: r(lx), y: r(s.nameY + G.letters * 0.62 + G.letters * 0.35), 'font-family': FONT, 'font-size': r(G.letters, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, LETTERS[i])));
    } else kids.push(h('path', {d: `M${r(s.x + 22)} ${r(s.nameY + 6)}H${r(s.x + s.w - 22)}M${r(s.x + 22)} ${r(s.nameY + 20)}H${r(s.x + s.w * 0.62)}`, stroke: c.paperLine, 'stroke-width': 3.4, 'stroke-linecap': 'round'}));
    parts.push(g({name: `${P}-st${i}`}, kids));
  });
  // the route: per step a neutral base line (before a status is shown), the solid line (●) and the dashed one (◆,
  // pending); one colour and one weight for both
  const keepRoute = !o.keep || G.arcs.every(a => keep({x: a.lo - 4, y: G.yP - 4, w: a.hi - a.lo + 8, h: a.d + 8}));
  const routeNodes = [];
  if (keepRoute) G.arcs.forEach(a => {
    routeNodes.push(h('path', {name: `${P}-rb${a.j}`, d: a.dpath, fill: 'none', stroke: LINE.base, 'stroke-width': LINE.width, 'stroke-linecap': 'round', opacity: 0}));
    routeNodes.push(h('path', {name: `${P}-rt${a.j}`, 'data-from': String(a.from), 'data-to': String(a.to), d: a.dpath, fill: 'none', stroke: LINE.color, 'stroke-width': LINE.width, 'stroke-linecap': 'round', opacity: 0}));
    routeNodes.push(g({'data-pending': 1}, h('path', {name: `${P}-rd${a.j}`, 'data-from': String(a.from), 'data-to': String(a.to), d: a.dpath, fill: 'none', stroke: LINE.color, 'stroke-width': LINE.width, 'stroke-linecap': 'butt', 'stroke-dasharray': LINE.dash, opacity: 0})));
    // port dots on the stations' lower edges
    routeNodes.push(h('circle', {name: `${P}-rp${a.j}a`, cx: r(a.P.x), cy: r(a.P.y), r: 6, fill: LINE.color}));
    routeNodes.push(h('circle', {name: `${P}-rp${a.j}b`, cx: r(a.Q.x), cy: r(a.Q.y), r: 6, fill: LINE.color}));
  });
  parts.push(g({name: `${P}-route`}, routeNodes));
  // step discs (number, or pips when no text is shown)
  const discNodes = [];
  if (keepRoute) G.discs.forEach((d, j) => {
    discNodes.push(g({name: `${P}-step${j}`},
      h('circle', {name: `${P}-step${j}-disc`, cx: r(d.x), cy: r(d.y), r: r(G.DR), fill: '#ffffff', stroke: LINE.color, 'stroke-width': 3}),
      o.numbers && Ft ? h('text', {name: `${P}-step${j}-n`, x: r(d.x), y: r(d.y + Ft * 0.36), 'font-family': FONT, 'font-size': r(Ft, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, String(j + 1)) : pips(d.x, d.y, j + 1, G.DR)));
  });
  parts.push(g({name: `${P}-steps`}, discNodes));
  // the status sign on the left wall (story, contrast): a large ● / ◆ on its disc over a short route icon (solid for
  // ●, dashed — pending — for ◆); the same disc and ink for both
  const S = G.sign;
  const keepSign = S && keep(S);
  if (keepSign) {
    const sR = Math.min(S.w * 0.36, 30);
    const sx = S.x + S.w / 2, sy = S.y + 14 + sR;
    parts.push(g({name: `${P}-sign`},
      h('path', {d: roundRectPath(S.x + 3, S.y + 5, S.w, S.h, 9), fill: th.shadow}),
      h('path', {name: `${P}-sign-body`, d: roundRectPath(S.x, S.y, S.w, S.h, 9), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
      SIDES.map(s0 => g({name: `${P}-sign-${s0}`, opacity: 0},
        statusDisc(ctx, {name: `${P}-sign-${s0}-d`, kind: s0, cx: sx, cy: sy, R: sR}),
        stateIcon({x: S.x + 8, y: sy + sR + 12 + (S.w - 16) * 0.23, w: S.w - 16, kind: s0})))));
  }
  // the board on the bottom wall (inspect: it holds the route's record plate, drawn by the entry)
  const B = G.board;
  const keepBoard = B && keep(B);
  const RC = o.record || null;
  const recNodes = [];
  if (keepBoard && RC) {
    // the record plate, its two states (glyph disc + icon; value), and the dock under it
    const L0 = RC.layout;
    const at = q => ({...q, x: B.x + q.x, y: B.y + q.y});
    const pl = at(L0.plate), dk = at(L0.dock), tx = at(L0.text);
    const dc = {cx: B.x + L0.disc.cx, cy: B.y + L0.disc.cy}, ic = at(L0.icon);
    recNodes.push(g({name: `${P}-dock`, opacity: 0}, h('path', {name: `${P}-dock-body`, d: roundRectPath(dk.x, dk.y, dk.w, dk.h, 7), fill: '#f3f4f5', stroke: '#9aa4ae', 'stroke-width': 1.8})));
    if (RC.dockFits) {
      recNodes.push(g({name: `${P}-was`, opacity: 0}, textAt(RC.dockFits.was, dk.x + 12, dk.y + 7, '#57606a', {italic: true})));
      recNodes.push(g({name: `${P}-dock-v`, opacity: 0}, textAt(RC.dockFits.rec, dk.x + 12 + RC.dockFits.was.width + 10, dk.y + 7, INK)));
    } else {
      // (labels hidden: the old state's glyph and icon, small, in the dock)
      const gs2 = L0.gs * 0.62;
      recNodes.push(g({name: `${P}-dock-v`, opacity: 0}, SIDES.map(s0 => g({name: `${P}-dock-m${s0}`, opacity: 0},
        statusDisc(ctx, {name: `${P}-dock-${s0}-d`, kind: s0, cx: dk.x + 14 + gs2, cy: dk.y + dk.h / 2, R: gs2}),
        stateIcon({x: dk.x + 14 + gs2 * 2 + 12, y: dk.y + dk.h / 2, w: Math.min(gs2 * 4, Math.max(40, dk.w - gs2 * 2 - 40)), kind: s0})))));
    }
    recNodes.push(g({name: `${P}-rec`},
      h('path', {d: roundRectPath(pl.x + 3, pl.y + 5, pl.w, pl.h, 8), fill: th.shadow}),
      h('path', {name: `${P}-rec-body`, d: roundRectPath(pl.x, pl.y, pl.w, pl.h, 8), fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
      RC.fits ? null : h('path', {d: `M${r(tx.x)} ${r(pl.y + pl.h * 0.4)}H${r(pl.x + pl.w - 16)}M${r(tx.x)} ${r(pl.y + pl.h * 0.62)}H${r(pl.x + pl.w * 0.7)}`, stroke: '#c9c2b4', 'stroke-width': 3, 'stroke-linecap': 'round'}),
      g({name: `${P}-rec-mark`}, SIDES.map(s0 => g({name: `${P}-rec-${s0}`, opacity: 0},
        statusDisc(ctx, {name: `${P}-rec-${s0}-d`, kind: s0, cx: dc.cx, cy: dc.cy, R: L0.gs}),
        stateIcon({x: ic.x, y: ic.y, w: ic.w, kind: s0})))),
      RC.fits ? g({name: `${P}-rec-v-before`, opacity: 1}, g({name: `${P}-rec-v-before-text`}, textAt(RC.fits.before, tx.x, tx.y, INK))) : null,
      RC.fits ? g({name: `${P}-rec-v-after`, opacity: 0}, g({name: `${P}-rec-v-after-text`}, textAt(RC.fits.after, tx.x, tx.y, INK))) : null));
  }
  if (keepBoard && !o.noBoard) parts.push(g({name: `${P}-board`},
    h('path', {d: roundRectPath(B.x + 4, B.y + 6, B.w, B.h, 10), fill: th.shadow}),
    h('path', {name: `${P}-board-body`, d: roundRectPath(B.x, B.y, B.w, B.h, 10), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
    recNodes));
  // the dashed outline of the sheet (pending) — under the participant, who is never covered by it
  const keepDoc = !o.keep || G.stations.some((s0, i) => keepSt[i] && keep(s0.tray));
  if (o.ghost !== false && keepDoc) parts.push(g({name: `${P}-ghost`, 'data-pending': 1, opacity: 0, transform: 'translate(0 0)'}, ghostArt(G.DW, G.DH)));
  // the supplied decision's sheet (in the prior-examination tray's left slot, under the participant), with its pin
  const pinR = Math.max(13, G.DW * 0.2);
  const keepDec = o.dec && (!o.keep || keep(G.stations[R.exam].tray));
  if (keepDec) parts.push(g({name: `${P}-dec`, opacity: 0, transform: 'translate(0 0)'},
    g({name: `${P}-dec-k`, transform: 'scale(1)'}, decArt(ctx, G.DW, G.DH)),
    SIDES.map(s => statusDisc(ctx, {name: `${P}-dec-pin-${s}`, kind: s, cx: G.DW / 2 - pinR - 5, cy: G.DH / 2 - pinR - 5, R: pinR, opacity: 0}))));
  // the courier
  const rig = o.R.courier && G.courier && !o.keep ? planPerson(ctx, {name: `${P}-p0`, look: o.R.courier.look}) : null;
  if (rig) parts.push(rig.node);
  // the ghost (pending outline of the sheet) and the sheet(s); each sheet carries its status pin
  const sheet = (name) => g({name, transform: 'translate(0 0)'},
    g({name: `${name}-k`, transform: 'scale(1)'}, docArt(ctx, G.DW, G.DH)),
    // (the pin lies on the sheet itself, in its lower right corner: it never reaches past the sheet's edge)
    o.pins === false ? null : SIDES.map(s => statusDisc(ctx, {name: `${name}-pin-${s}`, kind: s, cx: G.DW / 2 - pinR - 5, cy: G.DH / 2 - pinR - 5, R: pinR, opacity: 0})));
  if (keepDoc) parts.push(sheet(`${P}-doc`));
  if (keepDoc && o.docs === 2) parts.push(sheet(`${P}-doc2`));

  /**
   * @param {{doc?:{x:number,y:number,s?:number,op?:number}, doc2?:{x:number,y:number,op:number}, ghost?:{x:number,y:number,op:number}|null,
   *   person?:{x:number,y:number,phase?:number,walk?:number}|null, reach?:{targets:any[], k:number}|null,
   *   route?:{base?:number, solid?:number, dashed?:number}, sign?:{a?:number,b?:number}, pin?:{a?:number,b?:number},
   *   pin2?:{a?:number,b?:number}, textK?:number, stepText?:number}} st
   */
  function frame(st) {
    const nodes = {};
    const tk = st.textK ?? 1;
    G.stations.forEach((s, i) => {
      if (!keepSt[i]) return;
      if (G.nameFits) nodes[`${P}-st${i}-text`] = {opacity: r(tk, 3)};
      if (!G.nameFits && G.letters) nodes[`${P}-st${i}-lt`] = {opacity: r(tk, 3)};
    });
    if (keepRoute) {
      const rs = st.route || {};
      G.arcs.forEach(a => {
        nodes[`${P}-rb${a.j}`] = {opacity: r(clamp(rs.base ?? 0), 3)};
        nodes[`${P}-rt${a.j}`] = {opacity: r(clamp(rs.solid ?? 0), 3)};
        nodes[`${P}-rd${a.j}`] = {opacity: r(clamp(rs.dashed ?? 0), 3)};
      });
      // (a step's number is hidden while a sheet, the outline or a head lies over its disc: one is never drawn over it)
      const covers = st.covers || [];
      G.discs.forEach((d, j) => {
        if (!(o.numbers && Ft)) return;
        let k0 = 1;
        for (const c of covers) {
          const dx = Math.max(c.x - d.x, 0, d.x - (c.x + c.w)), dy = Math.max(c.y - d.y, 0, d.y - (c.y + c.h));
          k0 = Math.min(k0, clamp((Math.hypot(dx, dy) - G.DR) / 14));
        }
        nodes[`${P}-step${j}-n`] = {opacity: r((st.stepText ?? tk) * k0, 3)};
      });
    }
    if (keepSign) for (const s of SIDES) nodes[`${P}-sign-${s}`] = {opacity: r(clamp(st.sign ? st.sign[s] ?? 0 : 0), 3)};
    if (keepBoard && RC) {
      // st.rec: {mark:{a,b}, before, after, dock, was, dockV, dockMark:{a,b}} — every key emitted in every frame
      const rc = st.rec || {};
      for (const s0 of SIDES) nodes[`${P}-rec-${s0}`] = {opacity: r(clamp(rc.mark ? rc.mark[s0] ?? 0 : 0), 3)};
      if (RC.fits) {
        nodes[`${P}-rec-v-before`] = {opacity: r(clamp(rc.before ?? 1), 3)};
        nodes[`${P}-rec-v-after`] = {opacity: r(clamp(rc.after ?? 0), 3)};
      }
      nodes[`${P}-dock`] = {opacity: r(clamp(rc.dock ?? 0), 3)};
      nodes[`${P}-dock-v`] = {opacity: r(clamp(rc.dockV ?? 0), 3)};
      if (RC.dockFits) nodes[`${P}-was`] = {opacity: r(clamp(rc.was ?? 0), 3)};
      else for (const s0 of SIDES) nodes[`${P}-dock-m${s0}`] = {opacity: r(clamp(rc.dockMark ? rc.dockMark[s0] ?? 0 : 0), 3)};
    }
    if (keepDoc) {
      const d = st.doc || {x: G.stations[R.steps[0]].doc.x, y: G.stations[R.steps[0]].doc.y, s: 1};
      nodes[`${P}-doc`] = {transform: `translate(${r(d.x, 2)} ${r(d.y, 2)})`, opacity: r(d.op ?? 1, 3)};
      nodes[`${P}-doc-k`] = {transform: `scale(${r(d.s ?? 1, 4)})`};
      if (o.pins !== false) for (const s of SIDES) nodes[`${P}-doc-pin-${s}`] = {opacity: r(clamp(st.pin ? st.pin[s] ?? 0 : 0), 3)};
      if (o.docs === 2) {
        const d2 = st.doc2 || {x: d.x, y: d.y, op: 0};
        nodes[`${P}-doc2`] = {transform: `translate(${r(d2.x, 2)} ${r(d2.y, 2)})`, opacity: r(d2.op ?? 0, 3)};
        nodes[`${P}-doc2-k`] = {transform: 'scale(1)'};
        if (o.pins !== false) for (const s of SIDES) nodes[`${P}-doc2-pin-${s}`] = {opacity: r(clamp(st.pin2 ? st.pin2[s] ?? 0 : 0), 3)};
      }
      if (o.ghost !== false) {
        const gh = st.ghost || {x: d.x, y: d.y, op: 0};
        nodes[`${P}-ghost`] = {transform: `translate(${r(gh.x, 2)} ${r(gh.y, 2)})`, opacity: r(gh.op, 3)};
      }
    }
    if (keepDec) {
      // st.dec: {op, s, pin:{a,b}} — the sheet lies in the exam tray's left slot (s > 1: being laid down from above)
      const dc = st.dec || {op: 0};
      const q = G.stations[R.exam].slotD;
      nodes[`${P}-dec`] = {transform: `translate(${r(q.x, 2)} ${r(q.y, 2)})`, opacity: r(clamp(dc.op ?? 0), 3)};
      nodes[`${P}-dec-k`] = {transform: `scale(${r(dc.s ?? 1, 4)})`};
      for (const s of SIDES) nodes[`${P}-dec-pin-${s}`] = {opacity: r(clamp(dc.pin ? dc.pin[s] ?? 0 : 0), 3)};
    }
    let reached = true, hand = null;
    if (rig) {
      const ps = st.person || G.rest(R.steps[0]);
      const pose = {x: ps.x, y: ps.y, deg: 0, seated: 0, walk: ps.walk ?? 0, phase: ps.phase ?? 0};
      Object.assign(nodes, rig.pose(pose));
      const rc = st.reach;
      for (const [arm, ti] of [['armR', 0], ['armL', 1]]) {
        const tg = rc && rc.targets[ti] ? rc.targets[ti] : pose;
        const rr = reachRecords({name: `${P}-p0`}, pose, tg, {k: rc ? rc.k : 0, arm});
        if (rc && rc.k > 0) Object.assign(nodes, rr.nodes);
        else if (!rc) Object.assign(nodes, rr.nodes);
        if (rc && rc.k > 0 && !rr.reached) reached = false;
        if (arm === 'armR') hand = rr.hand;
      }
    }
    return {nodes, reached, hand};
  }
  return {node: g({name: `${P}-room`}, parts), frame, rig};
}

/* ------------------------------------------------------------------ */
/* The action                                                          */
/* ------------------------------------------------------------------ */

/**
 * The document's journey at u (template units). Windows (u): reach, lift, carry, put, release.
 * mode 'carry' (● route available, as supplied): the courier's hands go to the sheet in the first tray (the cause),
 * lift it, and the courier carries it along every step — the sheet dipping into each body's tray it passes —, lays it
 * in the last tray and lets go. The courier follows the sheet (CARRY_DX to its left, HOLD below its centre).
 * mode 'ghost' (◆ route not checked, as supplied: pending): the sheet stays in the first tray; its dashed outline
 * traces the configured route over the carry window and rests in the last tray; nobody moves.
 * @param {any} G
 * @param {{reach:number[], lift:number[], carry:number[], put:number[], release:number[]}} Wn
 * @param {number} u
 * @param {{mode?:'carry'|'ghost'}} [o]
 */
export function saAction(G, Wn, u, {mode = 'carry'} = {}) {
  const pos = (q, a, b) => clamp((q - a) / Math.max(1e-9, b - a));
  const e = ease.inOutCubic;
  const J = G.journey;
  const nS = J.length;
  const [t0, t1] = Wn.carry;
  const T0 = t1 - t0;
  const pauseT = nS > 1 ? Math.min(0.03, (T0 * 0.22) / (nS - 1)) : 0;
  const total = J.reduce((a, p) => a + p.total, 0);
  const moveT = T0 - pauseT * (nS - 1);
  let t = t0;
  let at = null, stepK = [], walk = 0, dist = 0, phase = 'before', over = null;
  const first = G.stations[G.arcs[0].from].doc;
  const last = G.stations[G.arcs[nS - 1].to].doc;
  let p = {x: first.x, y: first.y};
  for (let j = 0; j < nS; j++) {
    const dt = moveT * (J[j].total / Math.max(1e-9, total));
    const q = pos(u, t, t + dt);
    stepK[j] = q;
    if (u >= t) {
      const qe = ease.inOutSine(q);
      p = J[j].at(qe);
      dist += J[j].total * qe;
      if (u < t + dt) { walk = Math.sin(Math.PI * q); phase = 'carrying'; at = j; }
    }
    t += dt;
    if (j < nS - 1) {
      if (u >= t && u < t + pauseT) { phase = 'dipping'; over = G.arcs[j].to; }
      t += pauseT;
    }
  }
  if (u >= t1) { p = {x: last.x, y: last.y}; phase = 'after'; }
  if (u < t0) phase = 'before';
  const lift = e(pos(u, ...Wn.lift)) * (1 - e(pos(u, ...Wn.put)));
  const k = e(pos(u, ...Wn.reach)) * (1 - e(pos(u, ...Wn.release)));
  if (mode === 'ghost') {
    const appear = pos(u, t0 - 0.03, t0);
    const ghost = u >= t0 - 0.03 ? {x: p.x, y: p.y, op: appear} : {x: first.x, y: first.y, op: 0};
    const back0 = Wn.back ? e(pos(u, ...Wn.back)) : 0;
    // (nobody carries the sheet: the participant only steps back from the first tray, straight down, in the hold)
    const r0 = G.rest(G.arcs[0].from);
    const person0 = {x: r0.x, y: r0.y + BACK * back0, walk: Math.sin(Math.PI * back0) * 0.6, phase: back0 * 3};
    const doc0 = {x: first.x, y: first.y, s: 1};
    return {covers: saCovers(G, doc0, ghost, person0), doc: doc0, ghost, person: person0, back: back0, reach: null, k: 0, lift: 0, stepK, at, phase: u < t0 ? 'rest' : u < t1 ? 'tracing' : 'traced', over, dist: 0, mode};
  }
  const s = lerp(1, LIFT, lift);
  const doc = {x: p.x, y: p.y, s};
  const back = Wn.back ? e(pos(u, ...Wn.back)) : 0;
  const la = G.arcs[nS - 1];
  const dir = la.Q.x >= la.P.x ? 1 : -1;
  const person = {x: p.x - CARRY_DX + dir * BACK * back, y: p.y + G.HOLD + BACK * 0.5 * back, walk: Math.max(walk * 0.9, Math.sin(Math.PI * back) * 0.6), phase: dist / 15 + back * 3};
  const gy = p.y + G.DH / 2 - 6;
  const targets = [{x: p.x + G.DW * 0.22, y: gy}, {x: p.x - G.DW * 0.22, y: gy}];
  const ph = u < Wn.reach[0] ? 'rest' : u < Wn.lift[0] ? 'reaching' : u < t0 ? 'lifting' : u < t1 ? phase : u < Wn.put[1] ? 'laying' : u < Wn.release[1] ? 'releasing' : back > 0 && back < 1 ? 'stepping-back' : 'laid';
  return {doc, ghost: null, person, reach: k > 0 ? {targets, k} : null, k, lift, stepK, at, phase: ph, over, dist, mode, back, covers: saCovers(G, doc, null, person)};
}

/** Boxes (template units) of what can lie over a step disc: the sheet, the outline and the participant's head. */
export function saCovers(G, doc, ghost, person) {
  const out = [];
  const sh = (q, s = 1) => ({x: q.x - (G.DW * s) / 2, y: q.y - (G.DH * s) / 2, w: G.DW * s, h: G.DH * s});
  if (doc && (doc.op ?? 1) > 0.05) out.push(sh(doc, doc.s ?? 1));
  if (ghost && ghost.op > 0.05) out.push(sh(ghost));
  // (the participant: head and shoulders, and the arms up to the sheet's lower edge when it reaches)
  if (person) out.push({x: person.x - 52, y: person.y - (doc && Math.abs(doc.x - person.x - CARRY_DX) < 1 ? G.HOLD - G.DH / 2 + 4 : 32), w: 104, h: 76});
  return out;
}

/* ------------------------------------------------------------------ */
/* Composer: the room fitted in a box (design units)                   */
/* ------------------------------------------------------------------ */

/**
 * @param {any} ctx
 * @param {any} P localised params
 * @param {any} R resolveSa()
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {number} F label text size (design units)
 * @param {{scale?:number, text?:boolean, letters?:boolean, numbers?:boolean, courier?:boolean, board?:(Ft:number|null,k:number)=>({w:number,h:number}|null),
 *   docK?:number, gap?:number, crop?:boolean|number, align?:any, nameLines?:number, extraH?:number, depthK?:number}} [o]
 */
const FITS = new WeakMap();

export function composeSa(ctx, P, R, box, F, o = {}) {
  const t = WALL;
  const sc = o.scale ?? 1;
  const ar = box.w / box.h;
  const withText = o.text !== false;
  let dkNow = o.depthK || 1;
  let gapNow = o.gap;
  const geoFits = (Ft, maxL) => {
    let pick = null, first = null;
    for (const q of [5.5, 6.5, 7.5, 8.5, 9.5, 11, 12.5, 14, 16, 18.5, 21]) {
      const fits = R.bodies.map(b => fitSa(b.label, {maxWidth: Ft * q, size: Ft, minSize: Ft, maxLines: 6, weight: 600}));
      if (fits.some(f => f.truncated)) continue;
      if (!first) first = fits;
      if (fits.every(f => f.lines.length <= maxL && !hasLoneWord(f))) { pick = fits; break; }
    }
    return pick || first || R.bodies.map(b => fitSa(b.label, {maxWidth: Ft * 21, size: Ft, minSize: Ft, maxLines: 6, weight: 600}));
  };
  const geoAt = (W, H, k) => {
    const Ft = F / k;
    let nameFits = null;
    if (withText && o.names !== 'letters') {
      const maxL = o.nameLines ?? (ar > 1.9 ? 2 : 3);
      // (memoised per resolved content within one layout: the search tries many boxes at the same text sizes)
      const memo = FITS.get(R) || new Map();
      FITS.set(R, memo);
      // (opt-in fitsBand — LAW-0332, cold create: while a layout is searched, the names are wrapped exactly once per 10 %
      // band of text sizes and scaled to the size asked for; the chosen composition is composed again without it)
      const Fb = o.fitsBand ? Math.exp(Math.round(Math.log(Ft) / 0.06) * 0.06) : Ft;
      const key = `${o.fitsBand ? 'b' : ''}${Fb.toFixed(4)}|${maxL}`;
      if (o.fitsBand) {
        if (!memo.has(key)) memo.set(key, geoFits(Fb, maxL));
        const q = Ft / Fb;
        nameFits = memo.get(key).map(f => ({...f, width: f.width * q, height: f.height * q, size: f.size * q}));
      } else if (memo.has(key)) nameFits = memo.get(key);
      else {
      // (one width for every station — the same size —: the narrowest that keeps each name within maxL lines with no
      // one-word line; the stations are as wide as the longest name needs)
      let pick = null, first = null;
      for (const q of [5.5, 6.5, 7.5, 8.5, 9.5, 11, 12.5, 14, 16, 18.5, 21]) {
        const fits = R.bodies.map(b => fitSa(b.label, {maxWidth: Ft * q, size: Ft, minSize: Ft, maxLines: 6, weight: 600}));
        if (fits.some(f => f.truncated)) continue;
        if (!first) first = fits;
        if (fits.every(f => f.lines.length <= maxL && !hasLoneWord(f))) { pick = fits; break; }
      }
      nameFits = pick || first || R.bodies.map(b => fitSa(b.label, {maxWidth: Ft * 21, size: Ft, minSize: Ft, maxLines: 6, weight: 600}));
      memo.set(key, nameFits);
      }
    }
    const bd = o.board ? o.board(withText ? Ft : null, k) : null;
    const G = saGeometry(W, H, R, {Ft: withText || o.numbers || o.letters ? Ft : null, nameFits, letters: (withText && o.names === 'letters') || o.letters ? Ft : 0, docK: o.docK, gap: gapNow, courier: o.courier, board: bd, sign: o.sign, signW: o.signW, extraH: o.extraH, depthK: dkNow,
      ...(o.letterSide ? {letterSide: true} : {}), ...(o.signLow ? {signLow: true} : {}), ...(o.padL ? {padL: o.padL} : {}), ...(o.tabPad ? {tabPad: o.tabPad} : {}),
      untangle: o.untangle ? {clear: (o.untangle.clearPx ?? 16) / (pxPerUnit(ctx) * k)} : null});
    G.depthK = dkNow;
    G.Ft = withText || o.numbers || o.letters ? Ft : null;
    G.textOn = withText;
    G.nameTrunc = nameFits ? nameFits.some(f => f.truncated) : false;
    return G;
  };
  const saGeometryAt = (W, H, dk) => { const keep0 = dkNow; dkNow = dk; const G2 = geoAt(W, H, k); dkNow = keep0; G2.depthK = dk; return G2; };
  const kMin = Math.max(1e-6, F / 2000);
  const kOk = q => (Number.isFinite(q) && q > kMin ? q : kMin);
  let k = kOk(box.w / 1200), G = null, W = 0, H = 0;
  const cropK = o.crop === true ? 1 : o.crop || 0;
  const fill = () => {
    const W0 = W, H0 = H;
    if ((W + 2 * t) / (H + 2 * t) < ar) W = ar * (H + 2 * t) - 2 * t; else H = (W + 2 * t) / ar - 2 * t;
    if (cropK) { W = Math.min(W, W0 * cropK); H = Math.min(H, H0 * cropK); }
  };
  for (let it = 0; it < 4; it++) {
    const G0 = geoAt(2000, 2000, k);
    W = Math.max(G0.needW * sc, 520 * sc);
    H = Math.max(G0.needH * sc, 380 * sc);
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
  // (opt-in deepen: spare height in the box goes to the route — its arcs grow deeper, up to o.deepen times — instead
  // of an empty band of floor)
  if (o.deepen && !G.problems.length) {
    const roomH = box.h / k - 2 * t;
    let best = null;
    for (const dk of [1.15, 1.3, 1.5, 1.75, 2, 2.3, 2.6, 3, 3.5, 4.2, 5].filter(q => q <= o.deepen)) {
      const G2 = saGeometryAt(W, Math.max(H, roomH), dk);
      if (G2.needH > roomH + 0.5 || G2.problems.length) break;
      best = {G2, H2: Math.max(H, G2.needH)};
    }
    if (best) { H = best.H2; dkNow = best.G2.depthK; G = geoAt(W, H, k); }
  }
  // (opt-in spread: spare width goes to the gaps between the stations — up to o.spread times the gap —, so the row of
  // bodies, the acting objects, spans the room instead of an empty margin)
  if (o.spread && !G.problems.length && R.n > 1) {
    const roomW = box.w / k - 2 * t;
    const g0 = G.gap;
    const spare = roomW - G.needW;
    if (spare > 8) {
      gapNow = Math.min(g0 * o.spread, g0 + spare / (R.n - 1));
      const roomH = box.h / k - 2 * t;
      // (the wider spans would deepen the arcs: the depth is eased back so the room keeps its height)
      const dk0 = dkNow;
      let ok = false;
      for (const f of [1, 0.9, 0.8, 0.7]) {
        dkNow = dk0 * f;
        const G2 = geoAt(Math.max(W, 0), H, k);
        const only = G2.problems.every(q => q === 'room-width' || q === 'room-height');
        if (only && G2.needW <= roomW + 0.5 && G2.needH <= roomH + 0.5) { W = Math.max(W, G2.needW); H = Math.max(H, G2.needH); G = geoAt(W, H, k); ok = true; break; }
      }
      if (!ok) { dkNow = dk0; gapNow = g0; G = geoAt(W, H, k); }
    }
  }
  const E = G.extents;
  const al = o.align || {x: 0.5, y: 0.5};
  const ox = box.x + (box.w - E.w * k) * al.x - E.x * k;
  const oy = box.y + (box.h - E.h * k) * al.y - E.y * k;
  const toD = mapper(ox, oy, k);
  const bD = mapBox(ox, oy, k);
  const problems = [...G.problems];
  if (G.nameTrunc) problems.push('name-text');
  // (a room whose text outgrows it would shrink without end: below this scale the composition is refused)
  if (k < (o.minK ?? 0.3)) problems.push('room-tiny');
  return {F, k, W, H, G, E, ox, oy, toD, bD, problems, box, planRect: {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k}};
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

/** Panel row node: this motif's glyphs (sheet, station, step, tray, calendar, ghost, sign), else the shared rows. */
export function saRowNode(ctx, m, o = {}) {
  const KINDS = ['doc', 'dec', 'exam', 'station', 'step', 'tray', 'calendar', 'ghost', 'sign', 'kind-relation', 'kind-communication', 'kind-sequence', 'kind-causal'];
  if (m.kind === 'legend' && KINDS.includes(m.glyphKind)) {
    const th = ctx.theme;
    const s = m.glyph;
    const gy = m.y + Math.min(m.h, m.glyph * 0.9) / 2;
    const gx = m.x + m.glyph / 2;
    let glyph;
    if (m.glyphKind === 'doc') {
      glyph = g({transform: `${T(gx, gy)} scale(${r(s / 110, 4)})`}, docArt(ctx, 56, 74, {noShadow: true}));
    } else if (m.glyphKind === 'dec') {
      glyph = g({transform: `${T(gx, gy)} scale(${r(s / 110, 4)})`}, decArt(ctx, 56, 74, {noShadow: true}));
    } else if (m.glyphKind === 'exam') {
      const tr = {x: -s * 0.44, y: -s * 0.14, w: s * 0.88, h: s * 0.44};
      glyph = g({transform: T(gx, gy)},
        examTab(tr, undefined),
        h('rect', {x: r(tr.x), y: r(tr.y), width: r(tr.w), height: r(tr.h), rx: 4, fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 1.8}),
        h('path', {d: `M0 ${r(tr.y + 4)}V${r(tr.y + tr.h - 4)}`, stroke: '#aab3bc', 'stroke-width': 1.6}));
    } else if (m.glyphKind === 'ghost') {
      glyph = g({transform: `${T(gx, gy)} scale(${r(s / 110, 4)})`, 'data-pending': 1}, ghostArt(56, 74));
    } else if (m.glyphKind === 'station') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.44), y: r(-s * 0.36), width: r(s * 0.88), height: r(s * 0.72), rx: 4, fill: '#eef1f4', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.24), y: r(-s * 0.02), width: r(s * 0.48), height: r(s * 0.28), rx: 2, fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 1.4}),
        m.letter ? h('text', {x: 0, y: r(-s * 0.08), 'font-family': FONT, 'font-size': r(m.fit.size, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: INK}, m.letter) : h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.2)}H${r(s * 0.3)}`, stroke: '#9aa4ae', 'stroke-width': 2.4, 'stroke-linecap': 'round'}));
    } else if (m.glyphKind === 'tray') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.4), y: r(-s * 0.26), width: r(s * 0.8), height: r(s * 0.52), rx: 4, fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 1.8}),
        h('path', {d: `M${r(-s * 0.32)} ${r(-s * 0.16)}H${r(s * 0.32)}`, stroke: '#c3cad1', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
        h('path', {d: `M0 ${r(-s * 0.1)}V${r(s * 0.2)}`, stroke: '#aab3bc', 'stroke-width': 1.6}));
    } else if (m.glyphKind === 'step') {
      glyph = g({transform: T(gx, gy)},
        h('path', {d: `M${r(-s * 0.46)} ${r(-s * 0.2)}C${r(-s * 0.46)} ${r(s * 0.3)} ${r(s * 0.46)} ${r(s * 0.3)} ${r(s * 0.46)} ${r(-s * 0.2)}`, fill: 'none', stroke: LINE.color, 'stroke-width': 3.4, 'stroke-linecap': 'round'}),
        h('circle', {cx: 0, cy: r(s * 0.17), r: r(s * 0.2), fill: '#ffffff', stroke: LINE.color, 'stroke-width': 2}),
        h('circle', {cx: 0, cy: r(s * 0.17), r: r(s * 0.05), fill: LINE.color}));
    } else if (m.glyphKind === 'calendar') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.34), y: r(-s * 0.38), width: r(s * 0.68), height: r(s * 0.76), rx: 3, fill: '#ffffff', stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(-s * 0.34), y: r(-s * 0.38), width: r(s * 0.68), height: r(s * 0.2), rx: 3, fill: '#9aa4ae', stroke: INK, 'stroke-width': 1.4}),
        h('path', {d: `M${r(-s * 0.12)} ${r(-s * 0.14)}V${r(s * 0.32)}M${r(s * 0.12)} ${r(-s * 0.14)}V${r(s * 0.32)}M${r(-s * 0.28)} ${r(s * 0.1)}H${r(s * 0.28)}`, stroke: '#b9c1c9', 'stroke-width': 1.4}));
    } else if (m.glyphKind === 'sign') {
      glyph = g({transform: T(gx, gy)},
        h('rect', {x: r(-s * 0.46), y: r(-s * 0.26), width: r(s * 0.92), height: r(s * 0.52), rx: 4, fill: '#e9edf1', stroke: INK, 'stroke-width': 1.8}),
        h('circle', {cx: r(-s * 0.22), cy: 0, r: r(s * 0.15), fill: '#ffffff', stroke: LINE.color, 'stroke-width': 1.6}),
        h('rect', {x: r(-s * 0.02), y: r(-s * 0.1), width: r(s * 0.38), height: r(s * 0.2), rx: 2, fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 1.4}));
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

/**
 * Line colour of a relation kind (mechanism). Neutral inks only — never green or red, which could read as approval or
 * refusal (review-03: "sequence" was the theme's green accent4; it is th.fg, as in frameworks/graph.js).
 */
export function linkColor(th, kind) {
  return kind === 'relation' ? LINE.color : kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.fg : th.ink;
}

/* ------------------------------------------------------------------ */
/* Glue, whole-word fits, rows without one-word lines, arrangement search */
/* (copied from ./identificacion-motivo.js and adapted)                 */
/* ------------------------------------------------------------------ */

/**
 * This motif's word glue (U+00A0, honoured by the shared whole-word fit): numbers stay with the word before them
 * ("Paso 2"); a number never ends a line before its unit; a lone capital letter stays with the word BEFORE it
 * ("Órgano A"); a short lower-case word (1–2 letters) travels with the next word; a separator (·, –) stays at the end of
 * the line before it; a short bracketed tag ("(ficticio)", "(según lo aportado)") stays in one piece; the last two short
 * groups stay together (no widow).
 */
export function saGlue(text, {lead = true, widow = true} = {}) {
  const NB = ' ';
  return String(text ?? '')
    .replace(/(\S)\s+(\d[\d.,:]*[)\]]?)(?=[\s,.;:)]|$)/g, `$1${NB}$2`)
    .replace(/(\d[\d.,]*)[ \t]+(mm|cm|m|km|m²|km²|ha|mg|g|kg|t|ml|l|s|min|h|d|%|‰|°C|°|€|\$|£)(?=[\s,.;:)]|$)/g, `$1${NB}$2`)
    .replace(/(\S)\s+([A-ZÁÉÍÓÚÑ])(?=[\s,.;:)]|$)/g, `$1${NB}$2`)
    .replace(/(^|\s)(\p{Ll}{1,2})\s+(?=\S)/gu, `$1$2${NB}`)
    .replace(/(\S)\s+([·–—])\s+/g, `$1${NB}$2 `)
    .replace(/\([^()]{1,24}\)/g, m0 => m0.replace(/\s+/g, NB))
    .replace(/^(\S{1,14})\s+(\([^()]{1,24}\))/, (m0, a, b) => (lead ? `${a}${NB}${b.replace(/\s+/g, NB)}` : m0))
    .replace(/^(.*[^ \t])[ \t]+([^ \t]+)[ \t]+([^ \t]+)$/s, (m0, a, b, c) => (widow && (b + c).length <= 24 && /[ \t]/.test(a.trim()) ? `${a} ${b}${NB}${c}` : m0));
}

/** Whole-word fit with this motif's glue; a box is never narrower than its widest glued group (measured). */
export function fitSa(text, o) {
  const sz = o.minSize ?? o.size;
  const needOf = t => Math.max(0, ...t.split(/[ \t\n]+/).filter(Boolean).map(w => measure(w.replace(/ /g, ' '), sz, o.weight ?? 600, 'sans')));
  const widow = o.widow !== false;
  let t = saGlue(text, {widow});
  let need = needOf(t);
  if (need > o.maxWidth + 0.5) { const t2 = saGlue(text, {lead: false, widow}); const n2 = needOf(t2); if (n2 < need) { t = t2; need = n2; } }
  return fitWords(t, {...o, maxWidth: Math.max(o.maxWidth, need + 0.5)});
}

/** True when a wrapped text has a line holding a single word. */
export const hasLoneWord = f => !!f && f.lines.length > 1 && f.lines.some(ln => ln.trim().split(/\s+/).filter(Boolean).length === 1);

/** Panel row measure (the shared row kinds) with this motif's glue. */
export function measureRowG(row, F, w) {
  const glyph = F * 1.9;
  if (row.kind === 'heading' || row.kind === 'state') {
    const padX = F * 0.6, padY = F * 0.36;
    const fit = fitSa(row.text, {maxWidth: w - padX * 2, size: F, minSize: F, maxLines: 4, weight: 700});
    return {...row, fit, h: fit.height + padY * 2, w: fit.width + padX * 2, padX, padY};
  }
  if (row.kind === 'legend' || row.kind === 'note') {
    const fit = fitSa(row.text, {maxWidth: w - glyph - F * 0.6, size: F, minSize: F, maxLines: 5, weight: 500});
    return {...row, fit, glyph, h: Math.max(glyph * 0.9, fit.height), w: glyph + F * 0.6 + fit.width};
  }
  if (row.kind === 'key') {
    const fit = fitSa(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 4, weight: 500});
    return {...row, fit, h: fit.height + F * 0.5, w: fit.width};
  }
  const fit = fitSa(row.text, {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: row.bold ? 700 : 500});
  return {...row, fit, h: fit.height, w: fit.width};
}

/** Measure a panel row, re-wrapping it narrower when a line would hold a single word. */
export function measureRowSa(row, F, w) {
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
 * Arrangement search (copied from ./identificacion-motivo.js `searchIm`): a text panel beside (column / two-column
 * side panel) or below (band) the room; per arrangement and room scale the largest text size that composes without
 * problems. A panel row that cannot avoid a one-word line makes the arrangement fail at that size. Never throws.
 * @param {any} ctx
 * @param {Array<any>} rows
 * (bandGap: the gap between the room and a band panel below it — default 30.)
 * @param {{sizes:number[], minF:number, colFracs?:number[], bandCols?:number[], sidePanels?:any[], bandMax?:number, bandGap?:number, minPersonPx?:number, scales?:number[], targetPx?:number, compose:(box:any,F:number,scale:number)=>any}} o
 */
export function searchSa(ctx, rows, o) {
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const shape = ctx.view.shape;
  const gap = 30, colGap = 28;
  const scales = o.scales || [1, 1.25, 1.55];
  const minPerson = o.minPersonPx ?? 0;
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
      const ms = rows.map(rw => measureRowSa(rw, F, pw));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, 1);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, 1, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols: 1};
    });
    if (shape !== 'portrait') for (const [cf, cols] of o.sidePanels || []) arrangements.push(F => {
      const pw = D.w * cf;
      const colW = (pw - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowSa(rw, F, colW));
      const probe = lay(ms, {x: D.w - pw, y: 0, w: pw, h: 1e6}, F, cols);
      if (!probe.ok || probe.usedH > D.h) return null;
      const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, cols, colGap), roomBox: {x: 0, y: 0, w: D.w - pw - gap, h: D.h}, panelBox, cols};
    });
    if (shape !== 'landscape') for (const cols of o.bandCols || [2, 3]) arrangements.push(F => {
      const colW = (D.w - colGap * (cols - 1)) / cols;
      const ms = rows.map(rw => measureRowSa(rw, F, colW));
      const probe = lay(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, cols);
      if (!probe.ok || probe.usedH > D.h * (o.bandMax ?? 0.5)) return null;
      const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
      return {lay: layoutRows(ms, panelBox, F, cols, colGap), roomBox: {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - (o.bandGap ?? gap)}, panelBox, cols};
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
    const score = -1000 * problems.length + (Fpx >= 19.5 - 1e-6 ? 500 : 0) + Math.min(personPx, 110) + 3 * Fpx + (o.scoreOf ? o.scoreOf(C) : 0);
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
    const F = sizes[sizes.length - 1] / px;
    const C = o.compose({x: 0, y: 0, w: D.w, h: D.h}, F, scales[0]);
    best = {score: -1e9, F, C, lay: null, roomBox: {x: 0, y: 0, w: D.w, h: D.h}, panelBox: null, cols: 0, problems: [...C.problems, 'panel-overflow'], personPx: 100 * C.k * px, scale: scales[0]};
  }
  best.log = log;
  return best;
}
