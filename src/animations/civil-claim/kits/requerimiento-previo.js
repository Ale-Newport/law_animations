/**
 * Motif kit for "Requerimiento previo" (LAW-0241..0244): fields, fictional
 * defaults, the shared office stage and its pose solver. Each entry owns its
 * own timeline, layout, labels and semantics.
 *
 * The stage (side view, stage units, floor at y = 0):
 *   case file on a wall shelf · Party A seated at the left end of a long table ·
 *   the letter standing on a sled on the table's groove track · … · Party B's
 *   letter tray at the right end · Party B seated at the right end.
 *   Under the table top a return rail runs from Party B's end back to a reply
 *   pocket hanging on the table front at Party A's end. The calendar strip
 *   (the response space) hangs on the wall above the table.
 *
 * Action (clock c ∈ [0,1], `choreo`):
 *   A picks up the pen, signs the letter, puts the pen down and pushes the
 *   sled; the letter slides along the track into B's tray (c 0.62). The
 *   response space opens: the calendar unfolds day by day and A's reply
 *   pocket lights up (neutral). Plan "received": B tears the reply slip off
 *   the letter, lowers it onto the return rail and lets go; it runs back and
 *   drops into A's pocket, and a paper glyph drops into the supplied day's
 *   slot on the calendar. Plan "pending": nothing comes back; the pocket and
 *   every calendar slot stay empty (neutral dashed outlines).
 * Props always follow SOLVED hand positions (IK, `allReached`); nothing
 * teleports. Nothing here states a period, a legal effect of silence, or
 * any consequence: dates and states are supplied data drawn as supplied.
 * @module animations/civil-claim/kits/requerimiento-previo
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';
import {pen} from '../../../primitives/paper.js';
import {actorLook} from '../../../primitives/people-style.js';
import {wchip} from '../../roles/kits/mediation-labels.js';
import {
  glue, fitG, caseFile, wallShelf, filingCabinet, backWall, officeChair, seatedParty, longTable,
  letterSheet, sled, letterTray, replyPocket, calendarStrip,
} from './civil-claim-art.js';

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

export const partiesField = list('Party A (sends the pre-claim communication) and Party B (receives it), in this order; fictional', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) on the shelf', {ref: str('Reference on the file tab', 30), title: str('Title on the file plate', 60)}, ['ref', 'title']),
  letter: obj('The pre-claim letter', {ref: str('Reference printed on the letter', 30), title: str('Supplied contents printed on the letter', 90)}, ['ref', 'title']),
  replySlip: str('Text on the tear-off reply slip', 50),
}, ['caseFile', 'letter', 'replySlip']);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  sent: str('Date line printed on the letter', 50),
  window: list('Day labels of the response space drawn on the calendar strip (as supplied)', str('Day label', 24), 2, 7),
  replyDay: int('Zero-based index of the day on which the reply lands (only used when a reply is supplied)', 0, 6),
}, ['sent', 'window', 'replyDay']);
export const stagesField = obj('Stage captions shown as tags (descriptive only)', {
  sent: str('Tag where the letter leaves Party A', 50),
  delivered: str('Tag at Party B’s tray once the letter lands', 50),
  replied: str('Tag at Party A’s reply pocket when a reply is supplied', 50),
  pending: str('Tag at Party A’s reply pocket when no reply is supplied', 50),
}, ['sent', 'delivered', 'replied', 'pending']);
export const propLabelProps = {
  calendar: str('Title on the calendar strip (the response space)', 50),
  inTray: str('Label plate on Party B’s tray', 36),
  replyTray: str('Label on Party A’s reply pocket', 36),
};

export const RP_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Sender'}, {name: 'Party B', role: 'Recipient'}],
  documents: {
    caseFile: {ref: 'CF-0412', title: 'Case file · fictional claim'},
    letter: {ref: 'Ref. CF-0412/1', title: 'Request to return the fictional item (as supplied)'},
    replySlip: 'Reply slip (as supplied)',
  },
  dates: {sent: 'Sent: Day 0 (as supplied)', window: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], replyDay: 2},
  stages: {sent: 'Sent by Party A', delivered: 'In Party B’s tray', replied: 'Reply received', pending: 'Reply pending'},
  labels: {calendar: 'Response space (as supplied)', inTray: 'In · Party B', replyTray: 'Replies · Party A'},
};
export const RP_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Remitente'}, {name: 'Parte B', role: 'Destinataria'}],
  documents: {
    caseFile: {ref: 'EXP-0412', title: 'Expediente · reclamación ficticia'},
    letter: {ref: 'Ref. EXP-0412/1', title: 'Solicitud de devolver el objeto ficticio (según lo aportado)'},
    replySlip: 'Resguardo de respuesta (según lo aportado)',
  },
  dates: {sent: 'Enviada: día 0 (según lo aportado)', window: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'], replyDay: 2},
  stages: {sent: 'Enviada por la Parte A', delivered: 'En la bandeja de la Parte B', replied: 'Respuesta recibida', pending: 'Respuesta pendiente'},
  labels: {calendar: 'Espacio de respuesta (según lo aportado)', inTray: 'Entrada · Parte B', replyTray: 'Respuestas · Parte A'},
};

export const RP_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'según lo aportado'},
};

/** "Name · role" caption for party index i. */
export function partyCaption(p, i) {
  const a = p.parties[i];
  return a.role ? `${a.name} · ${a.role}` : a.name;
}
export function looksOf(ctx, p) {
  return {a: actorLook(ctx, p.parties[0], 0), b: actorLook(ctx, p.parties[1], 1)};
}
/** Day label of the reply (clamped to the supplied day labels). */
export function replyDayLabel(p) {
  const w = p.dates.window;
  return w[Math.max(0, Math.min(w.length - 1, p.dates.replyDay))];
}
/** Final pocket tag text for a plan. */
export function outcomeText(p, plan) {
  return plan === 'received' ? `${p.stages.replied} · ${replyDayLabel(p)}` : p.stages.pending;
}

/** Word-wrapping chip with glued numbers. */
export function gchip(ctx, text, o) {
  return wchip(ctx, glue(text), o);
}
/** The neutral "as supplied · no conclusion drawn" key chip. */
export function keyChip(ctx, o) {
  const th = ctx.theme;
  return gchip(ctx, `◦ ${ctx.t.key}`, {x: o.x, y: o.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: o.name ?? 'key'});
}

export const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/* ======================================================================== */
/* Stage                                                                     */
/* ======================================================================== */

/** Person scale and fixed heights (stage units). */
/** base person scale (stage units); people grow a little with very large supplied text (see stageAt) */
export const PK0 = 1.3;
export const TOP0 = -196 * PK0;
const SLED_H = 12;
const PEN_L = 124;
const PEN_GRIP = PEN_L * 0.36;

/**
 * Build the office stage.
 * @param {any} ctx
 * @param {{prefix:string, W:number, ts:number, p:any, looks:{a:any,b:any}, showText:boolean, markIdx?:number, calCols?:number|null}} o
 *   p: resolved params with parties / documents / dates / labels; W: distance between the two seats.
 */
const STAGE_CACHE = new WeakMap();
const PARAM_IDS = new WeakMap();
let paramSeq = 0;
/** Stage builds are memoised per layout pass (ctx) — the fitting scans rebuild the same candidates often. */
export function claimStage(ctx, o) {
  let cache = STAGE_CACHE.get(ctx);
  if (!cache) { cache = new Map(); STAGE_CACHE.set(ctx, cache); }
  const pid = o.p && typeof o.p === 'object' ? (PARAM_IDS.get(o.p) ?? (PARAM_IDS.set(o.p, ++paramSeq), paramSeq)) : 0;
  const lk = o.looks && typeof o.looks === 'object' ? (PARAM_IDS.get(o.looks) ?? (PARAM_IDS.set(o.looks, ++paramSeq), paramSeq)) : 0;
  const key = JSON.stringify(Object.keys(o).sort().map(k => [k, k === 'p' ? pid : k === 'looks' ? lk : typeof o[k] === 'number' ? Math.round(o[k] * 1e4) / 1e4 : o[k]]));
  if (cache.has(key)) return cache.get(key);
  const st = claimStageRaw(ctx, o);
  cache.set(key, st);
  return st;
}
function claimStageRaw(ctx, o) {
  // above TSMAX the whole stage (people included) is drawn larger instead of the text alone, so that
  // props sized by long supplied text stay within the parties' reach and in proportion
  // (a compact stage without its calendar carries no text: nothing grows with the text size)
  const k = o.compact && o.noCal ? 1 : Math.max(1, o.ts / (o.tsMax ?? TSMAX));
  const st = stageAt(ctx, k > 1 ? {...o, ts: o.ts / k, W: o.W / k} : o);
  st.k = k; // callers map the stage's own (inner) units with scale × k
  return st;
}
/** Largest text size in stage units before the stage scales up as a whole. */
export const TSMAX = 27;

function stageAt(ctx, o) {
  const {prefix: P, ts, p, showText} = o;
  // (o.peopleK: a compact stage whose texts are printed elsewhere may draw its people larger relative to the props)
  const PK = PK0 * Math.min(1.2, Math.max(1, (o.compact ? Math.min(ts, 20) : ts) / 25)) * (o.peopleK ?? 1);
  const q = PK / PK0;
  const SEAT = -132 * PK;          // hips of a seated party
  const TOP = -196 * PK;           // table top
  const APRON = TOP + 50 * q;      // apron bottom
  // (o.left0: a static end-state stage, where nobody signs, may keep the letter's start closer to Party A)
  const LEFT0 = (o.left0 ?? 170) * q;           // letter's left edge at the start: clear of Party A's head while she signs
  const POCKET_L = 138 * q;
  let W = o.W;
  const trayLabelProbe = letterTray(ctx, {prefix: `${P}-tp`, w: ts * 12.4 + 44, lipTop: -40, rackTop: -120, label: p.labels.inTray, size: ts, showText});
  const lipH = SLED_H + (o.compact ? Math.min(ts, 22) : ts) * 1.25;
  // compact stages (o.compact): props keep their reference / labels as text, the letter's long supplied lines
  // become filler bars at a fixed size (the entry prints them once, e.g. in a shared strip)
  const lts = o.compact ? Math.min(ts, 20) : ts;
  const makeLetter = w => letterSheet(ctx, {prefix: `${P}-lt`, w, size: lts, refSize: o.compact ? lts : ts, barsOnly: Boolean(o.compact), fixedFiller: Boolean(o.compact) && !o.fillerFromText, ref: p.documents.letter.ref, title: p.documents.letter.title, date: p.dates.sent, slip: p.documents.replySlip, signer: p.parties[0].name, showText, sigW: 110, lipCover: lipH - SLED_H + 4, liftClear: o.liftClear ? lipH - SLED_H + 16 : 0});
  // letter width follows its supplied text (a sheet, not a ribbon): the narrowest width with a paper-like aspect
  // (o.grow: the seats may move apart so that a wide letter keeps a long enough route)
  const lwMin = o.compact ? 260 : Math.max(ts * (o.lwK ?? 12.4), 250), lwMax = Math.max(lwMin, Math.min(ts * 22, o.grow ? ts * 22 : W - 470));
  // the coupon (0.56 of the sheet) is never narrower than the slip text's longest word: no word is ever split
  const longestWord = Math.max(0, ...glue(p.documents.replySlip).split(/[\s]+/).filter(Boolean).map(wd => fitG(wd, {maxWidth: 1e5, size: lts, minSize: lts, maxLines: 1, weight: 700}).width));
  let LW = Math.max(lwMin, o.compact ? 0 : (longestWord * (o.slipWordK ?? 1) + lts * 1.2 + 6) / 0.56), letter = makeLetter(LW);
  if (o.compact) { LW = 300; letter = makeLetter(LW); }
  while (letter.h > LW * (o.aspect ?? 1.3) && LW < lwMax) {
    LW = Math.min(lwMax, LW + ts);
    letter = makeLetter(LW);
  }
  // the coupon riding on the return rail stays below the table top, and the pocket under the rail stays above the
  // floor: a taller coupon (long slip text) widens the sheet so that its coupon wraps into fewer lines
  {
    const pts0 = o.compact ? lts : ts;
    const frontOf = lt => {
      const cw = lt.cw, lblW = !o.compact ? fitG(p.labels.replyTray, {maxWidth: 1e5, size: pts0, minSize: pts0, maxLines: 1, weight: 700}).width + pts0 * 1.6 + 4 : 0;
      const pw = Math.max(cw + 40, Math.min(lblW, cw * 1.7 + 40));
      const f = fitG(p.labels.replyTray, {maxWidth: pw - pts0 * 1.6, size: pts0, minSize: pts0, maxLines: 3, weight: 700});
      return Math.max(lt.slipBlank + 10, f.height + pts0 * 0.8);
    };
    const room = -TOP - 18;
    // (o.railClear: stages where the coupon actually rides the rail)
    for (let k = 0; o.railClear && k < 40 && letter.slipH + frontOf(letter) > room; k++) { LW += ts; letter = makeLetter(LW); }
  }
  const CWD = letter.cw, SOX = letter.slipOffX; // coupon width and its offset from the letter's centre
  const trayW = LW + 44;
  if (o.grow) W = Math.max(W, 2 * LW + o.grow);
  // the route (and the return rail) always keep a usable length between the pocket and the tray
  W = Math.max(W, 2 * LW + (o.route ?? 460));
  const LH = letter.h;
  const X0 = LEFT0 + LW / 2;
  const X1 = W - 104 - trayW / 2;
  const letterBottom = TOP - SLED_H;
  const letterTop = letterBottom - LH;
  // the plate keeps left of the column where the coupon is lowered past the tray's front
  const tray = letterTray(ctx, {prefix: `${P}-tray`, w: trayW, lipTop: -lipH, rackTop: -(SLED_H + LH * 0.45), label: p.labels.inTray, size: o.compact ? lts : ts, showText, icon: 'in', plain: Boolean(o.compact)});
  const pts = o.compact ? lts : ts;  // compact stages carry no label text: prop sizes do not follow the text size
  // the pocket is wide enough for its label on one line when it can be (a shorter front leaves room under the
  // table for the coupon riding on the rail below the table top)
  const pkLabelW = showText && !o.compact ? fitG(p.labels.replyTray, {maxWidth: 1e5, size: pts, minSize: pts, maxLines: 1, weight: 700}).width + pts * 1.6 + 4 : 0;
  const PW = Math.max(CWD + 40, Math.min(pkLabelW, CWD * 1.7 + 40));
  const PX = POCKET_L + PW / 2;
  const blank = letter.slipBlank;
  const pocket = replyPocket(ctx, {prefix: `${P}-pk`, w: PW, depth: blank + 10, backRise: letter.slipH - blank + pts * 0.7, label: p.labels.replyTray, size: pts, showText: showText && !o.compact});
  // running surface of the return rail: the riding coupon clears the apron when there is room, and the pocket
  // under the rail always stays above the floor
  const RAIL = Math.min(APRON + letter.slipH + 16, -(pocket.frontH + 14));
  const slipRest = {x: PX, y: RAIL + blank - 6};   // slip bottom-centre inside the pocket
  // coupon centre when lowered to the rail: straight down from where it clears the tray's lip (the tray's label plate
  // stays left of this column, so the coupon never passes in front of the plate's text)
  const RS = X1 + SOX + 14;
  const railX0 = POCKET_L + PW + 2, railX1 = W - 96;

  // case file on the shelf above Party A
  const fileW = Math.max(ts * 8.2, 196);
  const cf = caseFile(ctx, {prefix: `${P}-cf`, w: fileW, ref: p.documents.caseFile.ref, title: p.documents.caseFile.title, size: ts, showText});
  // 'shelf': on a wall shelf above Party A (narrow stages); 'cabinet': on a low filing cabinet behind Party A's chair
  const onCab = o.fileMode === 'cabinet';
  const noFile = o.fileMode === 'none';
  const cabW = fileW + 50, cabH = 300;
  const shelfY = onCab ? -cabH - 6 : SEAT - 224 * PK - 40;
  const fileX = onCab ? -104 - cabW + 25 : LEFT0 - 18 - fileW;
  // calendar strip: in the free wall space between the letter's start and B's tray ('middle', wide stages) or
  // above the table right of the case file ('above')
  const days = p.dates.window;
  // (o.dayWrap: a day label may wrap onto two lines at whole words, so the strip keeps more columns and fewer rows)
  const lineW = t => ctx.measure(t.replace(/\u00a0/g, ' '), ts, 700, 'sans');
  const twoLineW = d => { const w = glue(d).split(' ').filter(Boolean); if (w.length < 2) return lineW(w.join(' ')); let b = Infinity; for (let k = 1; k < w.length; k++) b = Math.min(b, Math.max(lineW(w.slice(0, k).join(' ')), lineW(w.slice(k).join(' ')))); return b; };
  const dayProbe = days.map(d => (o.dayWrap ? twoLineW(d) : lineW(glue(d))));
  const minCell = Math.max(...dayProbe) + ts * 1.1;
  const onCab0 = o.fileMode === 'cabinet';
  const left0 = onCab0 ? -104 - (Math.max(ts * 8.2, 196) + 50) - 30 : (o.tight ? -130 : -190);
  // 'above': right of the shelf; 'wide': across the whole wall (above the case file on its cabinet)
  const wideCal = o.calMode === 'wide' || o.fileMode === 'none';
  let calX0 = wideCal ? left0 + 24 : LEFT0 + 16, calX1 = wideCal ? W + (o.tight ? 96 : 166) : W + (o.tight ? 90 : 70), mode = wideCal ? 'wide' : 'above';
  // ('free': a static end-state stage — the letter already stands in B's tray, so the wall from A's side to the
  // tray is free)
  if (o.calMode === 'middle' || o.calMode === 'free') {
    const m0 = o.calMode === 'free' ? LEFT0 + 16 : X0 + LW / 2 + 30, m1 = X1 - trayW / 2 - 30;
    if (m1 - m0 >= Math.min(days.length, 3) * minCell && m1 - m0 >= ts * 12) { calX0 = m0; calX1 = m1; mode = 'middle'; }
  }
  let cols = o.calCols ?? days.length;
  while (cols > 1 && (calX1 - calX0) / cols < minCell) cols--;
  // (balanced rows: a wrapped strip never leaves a lone day on its last row — 5 days as 3 + 2, not 4 + 1)
  // (o.keepTogether [i, j]: two days that must share a row — an inspected move between them — keep the unbalanced
  // count when balancing would split them)
  if (cols < days.length) {
    const bal = Math.ceil(days.length / Math.ceil(days.length / cols));
    const kt = o.keepTogether;
    const split = c => kt && Math.floor(kt[0] / c) !== Math.floor(kt[1] / c);
    if (!(split(bal) && !split(cols))) cols = bal;
  }
  const calOpt = {prefix: `${P}-cal`, x: calX0, w: calX1 - calX0, cols, days, title: p.labels.calendar, size: ts, showText, showTitle: !o.compact, slotH: ts * (o.slotK ?? 1.6)};
  const cal0 = calendarStrip(ctx, {...calOpt, y: 0});
  const calY = mode === 'middle' ? Math.min(letterTop + 10, TOP - 60 - cal0.h) : letterTop - 40 - cal0.h;
  const cal = calendarStrip(ctx, {...calOpt, y: calY});
  const fileTop = shelfY - cf.h;
  // (o.noCal: the entry draws the calendar itself, outside the stage, in design units)
  const wallTop = Math.min(o.noCal ? 0 : calY - ts * 1.6, noFile ? 0 : fileTop - 30, letterTop - 40, SEAT - 230 * PK);

  const A = seatedParty(ctx, {name: `${P}-pa`, look: o.looks.a});
  const Bp = seatedParty(ctx, {name: `${P}-pb`, look: o.looks.b});
  const table = longTable(ctx, {x0: 44, x1: W - 44, top: TOP, apron: APRON, legs: [POCKET_L + PW + 60, W - 250], trackX0: LEFT0 - 10, trackX1: W - 100, railX0, railX1, railY: RAIL});
  const pn = pen(ctx, {name: `${P}-pen`, length: PEN_L});
  const markIdx = o.markIdx ?? 0;

  const node = g({name: P},
    backWall(ctx, {x0: onCab ? -104 - cabW - 30 : Math.min(o.tight ? -130 : -190, noFile ? 0 : fileX - 36), x1: o.tight ? W + 120 : W + 190, top: wallTop, plantX: o.tight ? null : W + 132}),
    noFile ? null : onCab ? g({transform: T(-104 - cabW, 0)}, filingCabinet(ctx, {w: cabW, h: cabH})) : g({transform: T(fileX - 30, shelfY)}, wallShelf(ctx, {w: fileW + 60})),
    noFile ? null : g({transform: T(fileX, shelfY)}, cf.node),
    o.noCal ? null : cal.node(markIdx),
    g({transform: T(PX, RAIL)}, pocket.glow),
    g({transform: T(0, SEAT)}, g({transform: `scale(${PK})`}, officeChair(ctx, {facing: 1}))),
    g({transform: T(W, SEAT)}, g({transform: `scale(${PK})`}, officeChair(ctx, {facing: -1}))),
    // the letter and the tray stand on the table behind the seated parties (a leaning head passes in front
    // of the sheet, never behind it); the near arms are drawn last
    g({transform: T(X1, TOP)}, tray.back),
    g({name: `${P}-letter`, transform: T(X0, letterBottom)},
      g({transform: T(0, SLED_H)}, sled(ctx, {name: `${P}-sled`, w: LW - 16})),
      letter.body,
      g({name: `${P}-slipin`, transform: T(SOX, 0)}, letter.slip('')),
    ),
    // the coupon while it is lifted out of the tray: still behind the tray's front until it clears the lip
    g({name: `${P}-sliplift`, opacity: 0}, letter.slip('-l')),
    g({transform: T(X1, TOP)}, tray.front),
    A.body, Bp.body,
    table.node,
    g({transform: T(PX, RAIL)}, pocket.back, g({name: `${P}-pkempty`}, pocket.empty)),
    g({name: `${P}-slipout`, opacity: 0}, letter.slip('-o')),
    g({transform: T(PX, RAIL)}, pocket.front),
    pn.node,
    A.near, Bp.near,
  );

  const shoulderOf = (sx, facing, lean) => {
    const loc = {x: 12, y: -112};
    const a = (lean || 0) * Math.PI / 180;
    const x = loc.x * Math.cos(a) - loc.y * Math.sin(a), y = loc.x * Math.sin(a) + loc.y * Math.cos(a);
    return {x: sx + x * PK * facing, y: SEAT + y * PK};
  };

  /**
   * @param {any} v  action values from choreo()
   */
  function pose(v) {
    const nodes = {};
    const fa = A.frame({x: 0, y: SEAT, facing: 1, scale: PK, lean: v.leanA, near: v.handA, headTilt: v.headA ?? 0});
    const fb = Bp.frame({x: W, y: SEAT, facing: -1, scale: PK, lean: v.leanB, near: v.handB, headTilt: v.headB ?? 0});
    Object.assign(nodes, fa.nodes, fb.nodes);
    nodes[`${P}-letter`] = {transform: T(v.letterX, letterBottom)};
    Object.assign(nodes, letter.sig.frame(v.sig));
    nodes[`${P}-pen`] = {transform: T(v.pen.x, v.pen.y, v.pen.ang)};
    // slip: attached (drawn inside the letter group, behind the tray lip) or out (own world position, in front)
    const out = v.slip.mode === 'out' || v.slip.mode === 'lift';
    const behind = v.slip.mode === 'lift';
    nodes[`${P}-slipin`] = {opacity: out ? 0 : 1};
    nodes[`${P}-sliplift`] = {opacity: behind ? 1 : 0, transform: T(v.slip.x, v.slip.y, v.slip.rot || 0)};
    nodes[`${P}-slipout`] = {opacity: out && !behind ? 1 : 0, transform: T(v.slip.x, v.slip.y, v.slip.rot || 0)};
    nodes[`${P}-pkempty`] = {opacity: r(v.pocketEmpty, 3)};
    nodes[`${P}-pk-glow`] = {opacity: r(v.lit * 0.75, 3)};
    const cf2 = o.noCal ? {allOpen: v.calOpen >= 1} : cal.frame(v.calOpen, v.markP, markIdx);
    if (!o.noCal) Object.assign(nodes, cf2.nodes);
    const penTip = {x: v.pen.x, y: v.pen.y};
    const slipC = out ? {x: v.slip.x, y: v.slip.y - letter.slipH / 2} : {x: v.letterX + SOX, y: letterBottom - letter.slipH / 2};
    const semantic = {
      handA: fa.hands.near, handB: fb.hands.near, headA: fa.head, headB: fb.head,
      pen: penTip, penGrip: {x: v.pen.x + Math.cos(v.pen.ang * Math.PI / 180) * PEN_GRIP, y: v.pen.y + Math.sin(v.pen.ang * Math.PI / 180) * PEN_GRIP},
      letter: {x: v.letterX, y: letterBottom - LH / 2},
      letterGrip: {x: v.letterX - LW / 2 + 4, y: letterBottom - 44},
      sigTip: sigTipAt(v.sig, v.letterX),
      slip: slipC,
      slipGrip: {x: slipC.x + CWD / 2 - 12, y: slipC.y},
      allReached: fa.reached && fb.reached,
      calOpen: r(v.calOpen, 3), calAllOpen: cf2.allOpen, markP: r(v.markP, 3),
    };
    return {nodes, semantic};
  }

  function sigTipAt(p, x) {
    const q = letter.sig.tipAt(p);
    return {x: x + q.x, y: letterBottom + q.y};
  }

  const G = {
    W, ts, LW, LH, X0, X1, RS, rail: RAIL, CW: CWD, SOX, PX, PW, letterBottom, letterTop, slipH: letter.slipH, slipRest, trayW,
    lipTop: TOP - lipH, penRest: {x: 176 * q, y: TOP - 6}, restA: {x: 84 * q, y: TOP - 10}, restB: {x: W - 84 * q, y: TOP - 10}, top: TOP,
    sigStart: sigTipAt(0, X0), sigAt: pp => sigTipAt(pp, X0),
    shoulderA: lean => shoulderOf(0, 1, lean), shoulderB: lean => shoulderOf(W, -1, lean), reach: (80 + 76 + 9) * PK,
  };
  const heads = {a: {x: 6 * PK, y: SEAT + (-176) * PK}, b: {x: W - 6 * PK, y: SEAT + (-176) * PK}};
  const R = 46 * PK;
  const boxes = {
    headA: {x: heads.a.x - R, y: heads.a.y - R - 8, w: R * 2, h: R * 2 + 8},
    headB: {x: heads.b.x - R, y: heads.b.y - R - 8, w: R * 2, h: R * 2 + 8},
    personA: {x: -80, y: heads.a.y - R - 8, w: 210, h: -heads.a.y + R + 8},
    personB: {x: W - 130, y: heads.b.y - R - 8, w: 210, h: -heads.b.y + R + 8},
    file: noFile ? {x: 0, y: 0, w: 0, h: 0} : {x: fileX, y: fileTop, w: fileW + 8, h: cf.h},
    shelf: noFile ? {x: 0, y: 0, w: 0, h: 0} : onCab ? {x: -104 - cabW - 6, y: -cabH - 6, w: cabW + 12, h: cabH + 6} : {x: fileX - 30, y: shelfY, w: fileW + 60, h: 60},
    cal: o.noCal ? {x: 0, y: 0, w: 0, h: 0} : {x: calX0, y: calY - ts * 0.9, w: calX1 - calX0, h: cal.h + ts * 0.9},
    trayAt: {x: X1 - trayW / 2 - 6, y: letterTop - 8, w: trayW + 12, h: -letterTop + TOP + 8 + Math.max(0, tray.plate.y + tray.plate.h)},
    letterStart: {x: X0 - LW / 2 - 6, y: letterTop - 8, w: LW + 14, h: LH + 22},
    letterEnd: {x: X1 - LW / 2 - 6, y: letterTop - 8, w: LW + 14, h: LH + 22},
    // the region the coupon crosses on its way from B's tray down to the rail (labels keep out of it)
    slipPath: {x: X1 + SOX - CWD / 2 - 6, y: TOP - lipH - 16 - letter.slipH, w: RS - (X1 + SOX) + CWD + 12, h: RAIL - (TOP - lipH - 16 - letter.slipH) + 6},
    pocket: {x: PX - PW / 2 - 6, y: RAIL + pocket.box.y - 4, w: PW + 12, h: pocket.box.h + 8},
    slipIn: {x: PX - CWD / 2 - 6, y: slipRest.y - letter.slipH - 6, w: CWD + 12, h: letter.slipH + 12},
    table: {x: 44, y: TOP, w: W - 88, h: -TOP},
    // the tray's label plate alone (its only printed text)
    trayPlate: {x: X1 + tray.plate.x, y: TOP + tray.plate.y, w: tray.plate.w, h: tray.plate.h},
  };
  const x0 = onCab ? -104 - cabW - 30 : Math.min(o.tight ? -130 : -190, noFile ? 0 : fileX - 36);
  const x1 = o.tight ? W + 120 : W + 190;
  const em = o.compact ? 24 : ts * (o.wallPad ?? 1.2);
  const ext = {x: x0, y: wallTop - em, w: x1 - x0, h: -wallTop + em + 48};
  return {node, pose, G, boxes, heads, ext, cal, letter, calMode: mode, fits: [...(o.compact ? [] : letter.fits), ...(noFile ? [] : [cf.refFit, cf.titleFit]), ...(o.compact ? [] : [cal.titleFit, tray.fit, pocket.fit]), ...(o.noCal ? [] : cal.dayFits)], markIdx, cols};
}

/**
 * The right-hand text column is a FALLBACK: an entry uses it only when the stage with the texts printed on its props
 * fails one of the floors — it does not fit, the people are under the head floor, or the stage is under its share of
 * the frame. Label placement alone never triggers it (tags are re-placed instead).
 * @param {{fitted:boolean, headPx:number, frameW:number}} L  the stacked layout: head px at 1080p, stage width / frame width
 * @param {{head:number, frameW:number}} floors
 */
export function needsTextColumn(L, floors) {
  return !L.fitted || L.headPx < floors.head || L.frameW < floors.frameW;
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

/**
 * Smallest forward lean (≥ base, ≤ 42°) that brings `target` within arm reach; continuous in the target, so
 * the body leans in smoothly when a large prop puts a hand target further away.
 */
function leanFor(shoulderAt, target, base, reach) {
  if (!target) return base;
  const R = reach * 0.985;
  const d = lean => { const q = shoulderAt(lean); return Math.hypot(target.x - q.x, target.y - q.y); };
  if (d(base) <= R) return base;
  let lo = base, hi = 48;
  if (d(hi) > R) return hi;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (d(mid) <= R) hi = mid; else lo = mid; }
  return hi;
}

/** Clock windows (c) of the shared action. */
export const CW = {
  grabPen: [0, 0.07], liftPen: [0.07, 0.13], sign: [0.13, 0.3], dropPen: [0.3, 0.37], toSled: [0.37, 0.42],
  push: [0.42, 0.47], slide: [0.47, 0.62], handBack: [0.47, 0.55], open: [0.62, 0.76],
  toSlip: [0.66, 0.72], lift: [0.72, 0.78], lower: [0.78, 0.84], bBack: [0.84, 0.92], ride: [0.84, 0.95], drop: [0.95, 1],
};
const S = (c, w) => seg(c, w[0], w[1]);
/** fraction of the lower window after which Party B lets go of the coupon (it then drops onto the rail) */
const REL_K = 0.5;
const mixP = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
const PUSH = 70;

/**
 * Action values for clock c.
 * @param {number} c 0..1
 * @param {'received'|'pending'} plan
 * @param {any} G stage geometry (claimStage().G)
 * @param {{reduced?:boolean}} [opt]
 */
export function choreo(c, plan, G, opt = {}) {
  const e = ease.inOutCubic;
  const penRestTip = G.penRest;
  const gripOf = (tip, ang) => ({x: tip.x + Math.cos(ang * Math.PI / 180) * PEN_GRIP, y: tip.y + Math.sin(ang * Math.PI / 180) * PEN_GRIP});
  const WRITE = 158; // pen body down-left from the nib (held low, below the signer's face)
  // ---- pen
  let penTip = penRestTip, penAng = 180, held = false;
  const lift = e(S(c, CW.liftPen)), sig = S(c, CW.sign), drop = e(S(c, CW.dropPen));
  if (c >= CW.liftPen[0] && c < CW.sign[0]) {
    // (the pen travels forward low over the table first and rises to the signature line last: it never
    // passes in front of the signer's face)
    const liftRaw = S(c, CW.liftPen);
    penTip = {x: lerp(penRestTip.x, G.sigStart.x, e(Math.min(1, liftRaw / 0.7))), y: lerp(penRestTip.y, G.sigStart.y, e(seg(liftRaw, 0.45, 1)))};
    penAng = lerp(180, WRITE, lift);
    held = true;
  } else if (c >= CW.sign[0] && c < CW.dropPen[0]) {
    penTip = G.sigAt(sig);
    penAng = WRITE;
    held = true;
  } else if (c >= CW.dropPen[0] && c < CW.dropPen[1]) {
    penTip = mixP(G.sigAt(1), penRestTip, drop);
    penAng = lerp(WRITE, 180, drop);
    held = true;
  }
  // ---- letter
  const push = e(S(c, CW.push));
  const slide = ease.inOutSine(S(c, CW.slide));
  const letterX = c < CW.slide[0] ? G.X0 + PUSH * push : lerp(G.X0 + PUSH, G.X1, slide);
  const letterGrip = {x: letterX - G.LW / 2 + 4, y: G.letterBottom - 44};
  // ---- Party A's near hand
  let handA;
  const penGrip = gripOf(penRestTip, 180);
  if (c < CW.grabPen[1]) handA = mixP(G.restA, penGrip, e(S(c, CW.grabPen)));
  else if (held) handA = gripOf(penTip, penAng);
  else if (c < CW.toSled[1]) handA = mixP(penGrip, {x: G.X0 - G.LW / 2 + 4, y: G.letterBottom - 44}, e(S(c, CW.toSled)));
  else if (c < CW.push[1]) handA = letterGrip;
  else handA = mixP({x: G.X0 + PUSH - G.LW / 2 + 4, y: G.letterBottom - 44}, G.restA, e(S(c, CW.handBack)));
  // lean forward while signing / pushing
  const leanA = 12 * Math.min(1, S(c, [0.06, 0.13])) * (1 - S(c, [0.47, 0.55]));
  // ---- slip and Party B
  let slip = {mode: 'in', x: 0, y: 0, rot: 0};
  let handB = G.restB;
  let pocketEmpty = 1, markP = 0;
  const up = {x: G.RS, y: G.lipTop - 10};
  const RAIL = G.rail;
  const onRail = {x: G.RS, y: RAIL};
  const side = {x: G.RS, y: up.y}; // (= up: the coupon is let go straight above the rail)
  const REL = CW.lower[0] + REL_K * (CW.lower[1] - CW.lower[0]);   // B lets go of the coupon
  if (plan === 'received') {
    const t1 = e(S(c, CW.lift)), t2 = e(S(c, CW.lower)), ride = ease.inOutSine(S(c, CW.ride)), dr = ease.outCubic(S(c, CW.drop));
    const inTray = {x: G.X1 + G.SOX, y: G.letterBottom};
    let sp = null;
    if (c >= CW.lift[0] && c < CW.lift[1]) sp = {...mixP(inTray, up, t1), rot: 4 * Math.sin(Math.PI * t1)};
    // lifted clear of the lip, then let go: it drops onto the return rail (accelerating, no hand)
    else if (c >= CW.lower[0] && c < CW.lower[1]) {
      const e2 = S(c, CW.lower);
      sp = e2 < REL_K ? {...mixP(up, side, e(e2 / REL_K)), rot: 0} : {...mixP(side, onRail, ((e2 - REL_K) / (1 - REL_K)) ** 2), rot: 0};
    }
    else if (c >= CW.ride[0] && c < CW.drop[0]) sp = {x: lerp(G.RS, G.PX, ride), y: RAIL, rot: 0};
    else if (c >= CW.drop[0]) sp = {x: G.PX, y: lerp(RAIL, G.slipRest.y, dr), rot: 0};
    // (drawn behind the tray's front while its bottom is still below the lip)
    if (sp) slip = {mode: c < CW.lift[1] && sp.y > G.lipTop - 2 ? 'lift' : 'out', ...sp};
    const grip = q => ({x: q.x + G.CW / 2 - 12, y: q.y - G.slipH / 2});
    const inGrip = grip(inTray);
    if (c < CW.toSlip[0]) handB = G.restB;
    else if (c < CW.toSlip[1]) handB = mixP(G.restB, inGrip, e(S(c, CW.toSlip)));
    else if (c < REL) handB = grip(slip.mode === 'in' ? inTray : slip);
    else handB = mixP(grip(side), G.restB, e(S(c, [REL, CW.bBack[1]])));
    if (c >= CW.bBack[1]) handB = G.restB;
    pocketEmpty = 1 - S(c, [0.96, 1]);
    markP = S(c, CW.drop);
  }
  const lit = S(c, [0.62, 0.7]);
  return {
    handA, handB,
    leanA: leanFor(G.shoulderA, handA, leanA, G.reach),
    leanB: leanFor(G.shoulderB, handB, 0, G.reach),
    pen: {x: penTip.x, y: penTip.y, ang: penAng}, penHeld: held,
    sig, letterX, slip, pocketEmpty, lit, calOpen: S(c, CW.open), markP,
    landed: c >= CW.slide[1],
    docAt: c < CW.slide[0] ? 'A' : c < CW.slide[1] ? 'route' : 'trayB',
    slipAt: slip.mode === 'in' ? 'letter' : c < REL ? 'handB' : c < CW.lower[1] ? 'dropping' : c < CW.drop[1] ? 'rail' : 'pocketA',
  };
}

/* ======================================================================== */
/* Label placement                                                           */
/* ======================================================================== */

/**
 * Place a tag chip beside its anchor point: tries positions at growing
 * distances (8 … maxLead design units) in 16 directions and keeps the first
 * whose box clears every occupied box and stays inside `bounds`; falls back to
 * the candidate with the fewest collisions. A dotted leader joins the chip edge
 * to the anchor (with a dot on the anchor). The chip text is fitted once.
 * @param {any} ctx
 * @param {{name:string, text:string, anchor:{x:number,y:number}, occupied:any[], bounds:any, maxWidth:number, size:number, color:string, maxLead?:number, maxLines?:number, avoidSegs?:any[]}} o
 */
const TAG_PROBES = new WeakMap();
/** Measured size of a tag chip at one width (memoised per layout pass). */
function probeTag(ctx, o, mw, mkW) {
  let m = TAG_PROBES.get(ctx);
  if (!m) { m = new Map(); TAG_PROBES.set(ctx, m); }
  const key = `${o.text}\u0000${o.size}\u0000${mw}\u0000${o.maxLines ?? 5}`;
  if (!m.has(key)) { const c = mkW(0, 0, mw); m.set(key, {w: c.box.w, h: c.box.h, truncated: c.fit.truncated}); }
  return m.get(key);
}
export function placeTag(ctx, o) {
  const th = ctx.theme;
  const mkW = (x, y, mw) => gchip(ctx, o.text, {x, y, anchor: 'start', maxWidth: mw, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 5, fill: th.card, stroke: o.color, color: th.ink, weight: 700, name: `${o.name}-chip`});
  const A = o.anchor;
  const maxLead = o.maxLead ?? 34;
  const inside = b => b.x >= o.bounds.x && b.y >= o.bounds.y && b.x + b.w <= o.bounds.x + o.bounds.w && b.y + b.h <= o.bounds.y + o.bounds.h;
  const nearest = b => ({x: clamp(A.x, b.x, b.x + b.w), y: clamp(A.y, b.y, b.y + b.h)});
  let best = null, bestHits = Infinity, mwBest = o.maxWidth;
  // a narrower (taller) chip is tried when the full-width one finds no free spot
  // (never narrower than the widest kept-together word group, which would otherwise be released into loose words)
  const widestGroup = Math.max(...glue(o.text).split(' ').filter(Boolean).map(t => ctx.measure(t.replace(/\u00a0/g, ' '), o.size, 700, 'sans'))) + o.size * 1.8;
  // (o.narrow: two more, narrower widths — several short lines — for crowded tall frames)
  for (const f of o.narrow ? [1, 0.72, 0.52, 0.4, 0.3] : [1, 0.72, 0.52]) {
    const mw = Math.max(o.size * (o.narrow ? 4 : 5), o.maxWidth * f, Math.min(o.maxWidth, widestGroup));
    const probe = probeTag(ctx, o, mw, mkW);
    if (probe.truncated) continue;
    const w = probe.w, hh = probe.h;
    // (only boxes that a chip or leader within reach of the anchor could touch take part: same result, faster)
    const Rx = maxLead + w + 10, Ry = maxLead + hh + 10;
    const occ = o.occupied.filter(z => z.x < A.x + Rx && z.x + z.w > A.x - Rx && z.y < A.y + Ry && z.y + z.h > A.y - Ry);
    for (let d = 6; d <= maxLead + 1e-6; d += 4) {
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const cx = A.x + Math.cos(a) * (d + w / 2 * Math.abs(Math.cos(a)));
        const cy = A.y + Math.sin(a) * (d + hh / 2);
        const b = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
        const q = nearest(b);
        const lead = Math.hypot(q.x - A.x, q.y - A.y);
        if (lead > maxLead || lead < 4) continue;
        if (!inside(b)) continue;
        // the leader (chip edge → anchor) may not run through another occupied box (except the one holding the anchor)
        const inB = (pt, z) => pt.x > z.x + 1 && pt.x < z.x + z.w - 1 && pt.y > z.y + 1 && pt.y < z.y + z.h - 1;
        const leadHits = occ.filter(z => !inB(A, z) && [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].some(t => inB({x: q.x + (A.x - q.x) * t, y: q.y + (A.y - q.y) * t}, z))).length;
        const hits = occ.filter(z => hit(b, z, 6)).length + leadHits;
        if (hits === 0) { best = {b, lead}; bestHits = 0; mwBest = mw; break; }
        if (hits < bestHits) { bestHits = hits; best = {b, lead}; mwBest = mw; }
      }
      if (bestHits === 0) break;
    }
    if (bestHits === 0) break;
  }
  const mk = (x, y) => mkW(x, y, mwBest);
  const probe = mk(0, 0);
  const w = probe.box.w, hh = probe.box.h;
  if (!best) best = {b: {x: clamp(A.x + 10, o.bounds.x, o.bounds.x + o.bounds.w - w), y: clamp(A.y - hh - 10, o.bounds.y, o.bounds.y + o.bounds.h - hh), w, h: hh}, lead: 0};
  const c = mk(best.b.x, best.b.y);
  const b = c.box;
  const q = nearest(b);
  const lead = Math.hypot(q.x - A.x, q.y - A.y);
  const node = g({name: o.name, opacity: 0},
    lead > 3 ? h('path', {d: `M${r(q.x)} ${r(q.y)}L${r(A.x)} ${r(A.y)}`, stroke: o.color, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}) : null,
    h('circle', {cx: r(A.x), cy: r(A.y), r: 5.5, fill: o.color, stroke: th.card, 'stroke-width': 2}),
    c.node);
  return {node, box: b, fit: c.fit, lead, clear: bestHits === 0, anchor: A};
}

/* ======================================================================== */
/* Fitting a stage into a box                                                */
/* ======================================================================== */

/**
 * Fit a claim stage into a design box. The stage's text is sized in stage units (B·m / scale), so the
 * extent depends on the scale and is not monotonic: each candidate placement is scanned from a large
 * scale down, then refined. Long supplied text may step the text down (m, never below 0.82 ≈ 16 px at
 * 1080p) before the people would shrink below `sMin`; if even that does not fit, props may grow
 * relative to the people (tsMax).
 * @param {any} ctx
 * @param {{B:number, availW:number, availH:number, sMin:number, modes:Array<[string,string,number]>, opts:any, heightTrim?:number}} o
 * @returns {{stage:any, s:number, m:number, tsMax:number, calMode:string, fileMode:string, W:number}}
 */
export function solveStage(ctx, o) {
  let m = 1, tsMax = 27, calMode = 'above', fileMode = 'shelf', Wc = o.modes[0][2];
  const trim = o.heightTrim ?? 44;
  // (the stage's text size in stage units is quantised, so that scans at different text steps, modes and callers
  // reuse the same memoised builds)
  const tsQ = sc => Math.round(((o.B * m) / sc) * 20) / 20;
  const build = sc => claimStage(ctx, {...o.opts, W: Wc, ts: tsQ(sc), tsMax, calMode, fileMode});
  const fits = (st, sc) => st.ext.w * sc * st.k <= o.availW && (st.ext.h - trim) * sc * st.k <= o.availH;
  let minEff = 0;
  // one mode: a coarse geometric scan from large to small (stopping once the people would be smaller than any
  // acceptable result), a finer pass between the last miss and the first fit, then a bisection
  // (the scan starts just above the scale last found for the same mode, and climbs when that already fits)
  const lastSc = new Map();
  const solve = (beat = 0) => {
    let found = null, prev = null, foundK = 1;
    const mk = `${calMode}/${fileMode}/${Wc}/${tsMax}`;
    let sc0 = 1.6;
    if (lastSc.has(mk)) {
      sc0 = Math.min(1.6, lastSc.get(mk) / 0.82);
      while (sc0 < 1.6 && fits(build(sc0), sc0)) sc0 = Math.min(1.6, sc0 / 0.82);
    }
    for (let sc = sc0; sc >= 0.12; prev = sc, sc *= 0.82) {
      const st = build(sc);
      if (fits(st, sc)) { found = sc; foundK = st.k; break; }
      if (sc * st.k < Math.max(minEff, beat) * 0.9) break;
      // (once the text passes tsMax the whole stage grows with it: smaller scales draw the same proportions)
      if (st.k > 1.0001) break;
    }
    if (found !== null) lastSc.set(mk, found);
    if (found === null) return {sc: 0, eff: 0};
    if (found * foundK < beat * 0.9) return {sc: found, eff: found * foundK};
    let hi = prev ?? found / 0.82;
    for (let sc = hi - 0.03; sc > found + 1e-6; sc -= 0.03) { if (fits(build(sc), sc)) { found = sc; break; } hi = sc; }
    let lo = found;
    for (let i = 0; i < 5; i++) { const mid = (lo + hi) / 2; if (fits(build(mid), mid)) lo = mid; else hi = mid; }
    return {sc: lo, eff: lo * build(lo).k};
  };
  // the best of some modes and tsMax values (the smallest tsMax that reaches minEff is kept per mode)
  const pick = (modes, tms) => {
    let best = null;
    const all = [];
    for (const [md, fm, wc] of modes) {
      calMode = md; fileMode = fm; Wc = wc;
      let r0 = null;
      for (const tm of tms) {
        tsMax = tm;
        const q = {md, fm, wc, tm, ...solve(best ? best.eff : 0)};
        if (!r0 || q.eff > r0.eff + 1e-3) r0 = q;
        if (q.eff >= minEff && q.eff > 0) break;
      }
      all.push(r0);
      if (!best || r0.eff > best.eff + 1e-3) best = r0;
    }
    // (o.preferWide: among the modes within 4 % of the largest scale, the widest stage — a longer table fills a
    // stacked frame's width without making the people smaller)
    if (o.preferWide && best.eff > 0) {
      const wide = q => { calMode = q.md; fileMode = q.fm; Wc = q.wc; tsMax = q.tm; const st = build(q.sc); return st.ext.w * q.sc * st.k; };
      // (o.minWideW: the largest people among the stages at least that wide; the widest one when none is)
      const wideOk = o.minWideW ? all.filter(q => q.eff > 0 && wide(q) >= o.minWideW) : [];
      if (wideOk.length) best = wideOk.reduce((a2, b2) => (b2.eff > a2.eff + 1e-3 ? b2 : a2));
      else if (o.minWideW) best = all.filter(q => q.eff > 0).reduce((a2, b2) => (wide(b2) > wide(a2) + 1 ? b2 : a2), best);
      else {
        const near = all.filter(q => q.eff >= best.eff * (o.wideTol ?? 0.96));
        best = near.reduce((a2, b2) => (wide(b2) > wide(a2) + 1 ? b2 : a2), best);
      }
    }
    calMode = best.md; fileMode = best.fm; Wc = best.wc; tsMax = best.tm;
    return {...best, all};
  };
  // (a compact stage without its calendar never grows with its text: one tsMax is enough)
  const fixedK = Boolean(o.opts.compact && o.opts.noCal);
  const TMS = fixedK ? [27] : [27, 33, 40];
  minEff = o.sMin;
  let res = pick(o.modes, TMS);
  if (res.eff < o.sMin) {
    // the supplied text must step down: only the two most promising modes are refined
    const cands = [...res.all].sort((a2, b2) => b2.eff - a2.eff).slice(0, 2).map(q => [q.md, q.fm, q.wc]);
    let lo = 0.82, hi = 1;
    m = lo;
    let rLo = pick(cands, TMS);
    if (rLo.eff < o.sMin) { minEff = 0; rLo = pick(o.modes, fixedK ? TMS : [...TMS, 48, 60, 72]); }
    let keep = [calMode, fileMode, tsMax, Wc];
    if (rLo.eff >= o.sMin) {
      for (let i = 0; i < 5; i++) {
        m = (lo + hi) / 2;
        const r1 = pick(cands, TMS);
        if (r1.eff >= o.sMin) { lo = m; rLo = r1; keep = [calMode, fileMode, tsMax, Wc]; } else hi = m;
      }
    }
    m = lo; res = rLo; [calMode, fileMode, tsMax, Wc] = keep;
  }
  minEff = 0;
  const fitted = Boolean(res.sc);
  if (!res.sc) res = {sc: 0.12};  // nothing fits: smallest scan scale (reported as fitted: false)
  const stage = build(res.sc);
  return {stage, s: res.sc * stage.k, m, tsMax, calMode, fileMode, W: Wc, fitted};
}
