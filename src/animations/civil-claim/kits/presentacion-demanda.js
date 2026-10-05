/**
 * Motif kit for "Presentación de demanda" (LAW-0249..0252): fields, fictional
 * defaults, the registry stage and its pose solver. Each entry owns its own
 * timeline, layout, labels and semantics. Built on the civil-claim pilot kits
 * (civil-claim-art.js, requerimiento-previo.js), which are used read-only.
 *
 * The stage (side view, stage units, floor at y = 0):
 *   case file on a wall shelf above Party A · Party A (claimant) seated at the
 *   left end of a registry counter · the written filing standing in Party A's
 *   sled on the counter's groove track above her drafts plaque · the registry intake
 *   tray at the right end · the registry clerk (Party B) seated at the right end
 *   with a reference stamp on its pad · a registry calendar on the wall.
 *
 * Action (clock c ∈ [0,1], `choreo`):
 *   A signs the filing, puts the pen down and pushes the sled: the filing slides
 *   off her place along the track into the registry intake tray
 *   (c 0.62). The clerk takes the reference stamp, presses it on the filing's
 *   reference box and returns it: the supplied reference appears on the filing
 *   and a small entry glyph drops into the supplied day of the registry
 *   calendar. Plan "draft": A signs but the filing is not handed in — it stays
 *   on the counter in front of her; the reference box stays blank; the clerk does not move.
 * Props always follow SOLVED hand positions (IK, `allReached`). Nothing here
 * states a filing rule, fee, court, admissibility, period or any effect of
 * registering or not: the reference and the dates are supplied, fictional data
 * drawn as supplied; "draft" is only a different configured state (no red, no
 * cross, no defect marker).
 * @module animations/civil-claim/kits/presentacion-demanda
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {roundRectPath, cubicPolyline} from '../../../core/geometry.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';
import {pen, signatureMark, shade} from '../../../primitives/paper.js';
import {textBlock, LINK_STYLES} from '../../../primitives/annotate.js';
import {
  glue, fitG, caseFile, wallShelf, filingCabinet, backWall, officeChair, seatedParty, sled, letterTray, calendarStrip,
} from './civil-claim-art.js';
import {gchip, keyChip, hit, placeTag, partyCaption, looksOf, needsTextColumn} from './requerimiento-previo.js';

export {gchip, keyChip, hit, placeTag, partyCaption, looksOf, needsTextColumn, glue, fitG};

const INK = '#1f2328';

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

export const partiesField = list('Party A (files the written claim) and the registry desk (receives it), in this order; fictional', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) on the shelf', {ref: str('Reference on the file tab', 30), title: str('Title on the file plate', 60)}, ['ref', 'title']),
  filing: obj('The written filing (escrito)', {title: str('Supplied contents printed on the filing', 90), dated: str('Date line printed on the filing (as supplied)', 50)}, ['title', 'dated']),
  reference: str('Reference the (fictional, generic) registry stamps on the filing', 40),
}, ['caseFile', 'filing', 'reference']);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  window: list('Day labels of the registry calendar (as supplied)', str('Day label', 24), 2, 7),
  entryDay: int('Zero-based index of the calendar day on which the entry is marked (only when the filing is registered)', 0, 6),
}, ['window', 'entryDay']);
export const stagesField = obj('Stage captions shown as tags (descriptive only)', {
  sent: str('Tag where the filing leaves Party A', 50),
  registered: str('Tag at the filing once it carries the reference', 50),
  draft: str('Tag at the filing when the filing is not handed in', 50),
}, ['sent', 'registered', 'draft']);
export const propLabelProps = {
  calendar: str('Title on the registry calendar', 50),
  intake: str('Label plate on the registry intake tray', 36),
  drafts: str('Label plaque under Party A’s drafts place', 36),
};

export const FD_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Claimant'}, {name: 'Registry desk', role: 'Clerk (fictional)'}],
  documents: {
    caseFile: {ref: 'CF-0417', title: 'Case file · fictional claim'},
    filing: {title: 'Written claim about the fictional item (as supplied)', dated: 'Dated: Day 1 (as supplied)'},
    reference: 'Ref. REG-0417 (fictional)',
  },
  dates: {window: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], entryDay: 1},
  stages: {sent: 'Handed in by Party A', registered: 'Registered · reference received', draft: 'Draft, not filed (as supplied)'},
  labels: {calendar: 'Registry calendar (as supplied)', intake: 'Registry intake', drafts: 'Drafts · Party A'},
};
export const FD_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Demandante'}, {name: 'Mesa de registro', role: 'Personal (ficticio)'}],
  documents: {
    caseFile: {ref: 'EXP-0417', title: 'Expediente · reclamación ficticia'},
    filing: {title: 'Escrito sobre el objeto ficticio (según lo aportado)', dated: 'Fechado: día 1 (según lo aportado)'},
    reference: 'Ref. REG-0417 (ficticia)',
  },
  dates: {window: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'], entryDay: 1},
  stages: {sent: 'Entregado por la Parte A', registered: 'Registrado · referencia recibida', draft: 'Borrador sin presentar (según lo aportado)'},
  labels: {calendar: 'Calendario del registro (según lo aportado)', intake: 'Entrada del registro', drafts: 'Borradores · Parte A'},
};

export const FD_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied', sequence: 'Sequence as configured (illustrative)'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'según lo aportado', sequence: 'Secuencia según la configuración (ilustrativa)'},
};

/**
 * Spanish defaults for a module whose params kept their English defaults: with locale "es", every value still equal
 * to the module's English default is replaced by its Spanish counterpart (supplied values are left as supplied).
 */
export function localizeDefaults(params, en, es) {
  if (!params || params.locale !== 'es') return params;
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const walk = (p, e, s2) => {
    if (s2 === undefined) return p;
    if (same(p, e)) return JSON.parse(JSON.stringify(s2));
    if (Array.isArray(p) && Array.isArray(e) && Array.isArray(s2) && p.length === e.length) return p.map((v, i) => walk(v, e[i], s2[i]));
    if (p && e && s2 && typeof p === 'object' && typeof e === 'object' && !Array.isArray(p)) {
      const out = {...p};
      for (const k of Object.keys(s2)) if (k in p && k in e) out[k] = walk(p[k], e[k], s2[k]);
      return out;
    }
    return p;
  };
  return walk(params, en, es);
}
/** The shared Spanish defaults keyed like the modules' params. */
export const FD_COMMON_ES = {parties: FD_DEFAULTS_ES.parties, documents: FD_DEFAULTS_ES.documents, stages: FD_DEFAULTS_ES.stages, dates: FD_DEFAULTS_ES.dates};

/** Calendar day label of the entry (clamped to the supplied days). */
export function entryDayLabel(p) {
  const w = p.dates.window;
  return w[Math.max(0, Math.min(w.length - 1, p.dates.entryDay))];
}
/** Final tag text for a plan. */
export function outcomeText(p, plan) {
  return plan === 'registered' ? `${p.stages.registered} · ${entryDayLabel(p)}` : p.stages.draft;
}

/* ======================================================================== */
/* Art: the filing and the reference stamp                                   */
/* ======================================================================== */

/**
 * The written filing: supplied contents and date line at the top; at the bottom a signature line (left) and the
 * registry's reference box (right). The box is blank until the reference is stamped into it (`${prefix}-refmark`).
 * Local origin = bottom-centre of the sheet.
 * @param {any} ctx
 * @param {{prefix:string, w:number, size:number, title:string, dated:string, reference:string, signer:string, showText:boolean,
 *   lipCover?:number, barsOnly?:boolean}} o
 */
export function filingSheet(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts, prefix} = o;
  const pad = ts * 0.6;
  const inner = w - pad * 2;
  // (compact sheets print filler bars from fixed short placeholders: the sheet stays low, the same for every preset)
  // (o.refReal: the reference box is sized for the real reference even on a compact sheet; o.showRefText prints it — the
  // inspect treatment's enlarged copy, whose box keeps the context's geometry)
  const src = o.barsOnly ? {...o, title: 'Xxxxxxx xx xxxxx', dated: 'Xxxxx: xxx 0', reference: o.refReal ? o.reference : 'Xxx. 0000'} : o;
  const refTextOn = o.showText && (!o.barsOnly || o.showRefText);
  const titleFit = fitG(src.title, {maxWidth: inner, size: ts, minSize: ts, maxLines: 8, weight: 700, family: 'serif'});
  const dateFit = fitG(src.dated, {maxWidth: inner, size: ts, minSize: ts, maxLines: 5, weight: 500});
  const lipCover = o.lipCover ?? ts * 1.3;
  // the reference box: wide enough for the supplied reference's longest word, at most ~0.6 of the sheet
  // (the box takes the reference's longest word whole: up to all but a short signature line)
  // (o.altReference: a second reference, drawn in the same box in place of the first — the inspect treatment's
  // substituted datum; the box is sized for the longer of the two)
  const refs = [src.reference, ...(o.altReference && (!o.barsOnly || o.refReal) ? [o.altReference] : [])];
  // (o.tightBox: the box only as wide as the longest word needs — a taller, narrower box, easier to enlarge)
  const boxW = Math.min(Math.max(inner * 0.62, inner - ts * 3.4), Math.max(inner * (o.tightBox ? 0.3 : 0.5), ...refs.flatMap(t => glue(t).split(' ').filter(Boolean)).map(wd => fitG(wd, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width + pad * 2)));
  const refFit = fitG(src.reference, {maxWidth: boxW - pad * 1.6, size: ts, minSize: ts, maxLines: 9, weight: 700});
  const altFit = refs[1] ? fitG(refs[1], {maxWidth: boxW - pad * 1.6, size: ts, minSize: ts, maxLines: 9, weight: 700}) : null;
  const boxH = Math.max(ts * 2.2, refFit.height + pad * 1.2, altFit ? altFit.height + pad * 1.2 : 0);
  let y = pad;
  const titleY = y; y += titleFit.height + ts * 0.45;
  const dateY = y; y += dateFit.height + ts * 0.5;
  const topH = y;
  const bottomZone = Math.max(boxH, ts * 1.9) + lipCover + 12;
  const H = topH + bottomZone;
  const fold = w * 0.1;
  const X = -w / 2, Tp = -H;
  const box = {x: X + w - pad - boxW, y: -(lipCover + 8 + boxH), w: boxW, h: boxH};
  const sigW = Math.max(ts * 3, box.x - (X + pad) - pad);
  const sigBox = {x: X + pad + ts * 0.1, y: -(lipCover + 6 + ts * 1.5), w: sigW, h: ts * 1.4};
  const sig = signatureMark(ctx, {name: `${prefix}-sig`, signer: o.signer, box: sigBox, color: '#1c3f8c', width: 3});
  const parts = [
    h('path', {d: roundRectPath(X + 6, Tp + 8, w, H, 4), fill: th.shadow}),
    h('path', {d: `M${r(X)} ${r(Tp + 4)}Q${r(X)} ${r(Tp)} ${r(X + 4)} ${r(Tp)}H${r(X + w - fold)}L${r(X + w)} ${r(Tp + fold)}V-4Q${r(X + w)} 0 ${r(X + w - 4)} 0H${r(X + 4)}Q${r(X)} 0 ${r(X)} -4Z`, fill: th.paper, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(X + w - fold)} ${r(Tp)}V${r(Tp + fold * 0.85)}Q${r(X + w - fold)} ${r(Tp + fold)} ${r(X + w - fold * 0.85)} ${r(Tp + fold)}H${r(X + w)}Z`, fill: th.paperShade, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('line', {x1: sigBox.x - ts * 0.1, x2: sigBox.x + sigBox.w, y1: r(sigBox.y + sigBox.h), y2: r(sigBox.y + sigBox.h), stroke: INK, 'stroke-width': 2}),
    sig.node,
    // the blank reference box (solid, light: nothing pending is implied by the sheet itself)
    h('rect', {name: `${prefix}-refbox`, x: r(box.x), y: r(box.y), width: r(box.w), height: r(box.h), rx: 6, fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 2}),
  ];
  if (o.showText && !o.barsOnly) {
    parts.push(textBlock(titleFit, {x: X + pad, y: Tp + titleY, fill: INK, name: `${prefix}-title`}));
    parts.push(textBlock(dateFit, {x: X + pad, y: Tp + dateY, fill: th.inkSoft, name: `${prefix}-date`}));
  } else {
    parts.push(...fillerBars(X + pad, Tp + titleY + ts * 0.2, inner, titleFit.lines.length, ts * 1.18, th, `${prefix}-t`, ctx.rng));
    parts.push(...fillerBars(X + pad, Tp + dateY + ts * 0.2, inner * 0.7, dateFit.lines.length, ts * 1.18, th, `${prefix}-d`, ctx.rng));
  }
  // the stamped reference (hidden until the stamp is pressed)
  const mark = g({name: `${prefix}-refmark`, opacity: 0},
    h('rect', {x: r(box.x + 2), y: r(box.y + 2), width: r(box.w - 4), height: r(box.h - 4), rx: 5, fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3}),
    g({name: `${prefix}-refold`}, refTextOn
      ? textBlock(refFit, {x: box.x + (box.w - refFit.width) / 2, y: box.y + (box.h - refFit.height) / 2, fill: th.accent2, name: `${prefix}-reftext`})
      : fillerBars(box.x + pad, box.y + box.h / 2 - ts * 0.2, box.w - pad * 2, 1, ts, {paperLine: th.accent2}, `${prefix}-rb`, ctx.rng)),
    // (the substituted reference: its text, or — printed text hidden / compact sheet — two shorter bars, so the change
    // still shows)
    o.altReference ? g({name: `${prefix}-refnew`, opacity: 0}, altFit && refTextOn
      ? textBlock(altFit, {x: box.x + (box.w - altFit.width) / 2, y: box.y + (box.h - altFit.height) / 2, fill: th.accent2, name: `${prefix}-reftext2`})
      : fillerBars(box.x + pad, box.y + box.h / 2 - ts * 0.55, (box.w - pad * 2) * 0.7, 2, ts * 0.9, {paperLine: th.accent2}, `${prefix}-rb2`, ctx.rng)) : null,
  );
  parts.push(mark);
  return {w, h: H, sig, sigBox, box, dateTop: Tp + dateY - ts * 0.2, body: g({name: `${prefix}-body`}, parts), fits: [titleFit, dateFit, refFit, altFit].filter(Boolean), lipCover};
}

function fillerBars(x, y, w, n, lh, th, key, rng) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const lw = i === n - 1 ? w * (0.45 + rng(`${key}-b`, i) * 0.3) : w * (0.8 + rng(`${key}-b`, i) * 0.2);
    out.push(h('rect', {'data-bar': 1, x: r(x), y: r(y + i * lh), width: r(lw), height: r(lh * 0.36), rx: r(lh * 0.18), fill: th.paperLine}));
  }
  return out;
}

/** A reference stamp (knob, neck, base). Local origin = bottom-centre of the base. */
function refStamp(ctx, {name, w = 46}) {
  const th = ctx.theme;
  return g({name},
    h('rect', {x: -w / 2 + 3, y: -12, width: w - 6, height: 12, rx: 3, fill: th.accent2, stroke: INK, 'stroke-width': 2}),
    h('rect', {x: -w / 2, y: -23, width: w, height: 12, rx: 4, fill: shade('#7a5a3a', 0.05), stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: -6, y: -42, width: 12, height: 21, rx: 4, fill: shade('#7a5a3a', -0.1), stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: -49, r: 10, fill: shade('#7a5a3a', 0.15), stroke: INK, 'stroke-width': 2.2}),
  );
}
/** Height from the stamp's base bottom to the middle of its knob (where the hand grips it). */
const STAMP_GRIP = 49;

/** The stamp pad on the counter. Local origin = bottom-centre. */
function stampPad(ctx, {w = 58}) {
  const th = ctx.theme;
  return g(null,
    h('rect', {x: -w / 2, y: -14, width: w, height: 14, rx: 4, fill: '#5d6a78', stroke: INK, 'stroke-width': 2}),
    h('rect', {x: -w / 2 + 6, y: -12, width: w - 12, height: 5, rx: 2, fill: th.accent2, opacity: 0.8}),
  );
}

/** A registry counter: side-view table with a groove track on its top (no return rail). */
function counterTable(ctx, o) {
  const th = ctx.theme;
  const wood = th.wood, top = th.woodTop;
  const W = o.x1 - o.x0;
  const legs = o.legs.map(x => g(null,
    h('rect', {x: x - 11, y: o.apron, width: 22, height: -o.apron, fill: shade(wood, -0.12), stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: x - 16, y: -8, width: 32, height: 8, rx: 3, fill: shade(wood, -0.3), stroke: INK, 'stroke-width': 2}),
  ));
  // a plain groove track (no direction chevrons: the counter itself states no direction)
  const track = h('rect', {x: o.trackX0, y: o.top - 6, width: o.trackX1 - o.trackX0, height: 6, rx: 3, fill: shade(top, -0.25), stroke: INK, 'stroke-width': 1.6});
  return g(null,
    legs,
    h('rect', {x: o.x0 + 14, y: o.top + 16, width: W - 28, height: o.apron - o.top - 16, fill: wood, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: o.x0, y: o.top, width: W, height: 18, rx: 6, fill: top, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: o.x0 + 6, y: o.top + 3, width: W - 12, height: 4, rx: 2, fill: '#fff', opacity: 0.25}),
    track,
  );
}

/* ======================================================================== */
/* Stage                                                                     */
/* ======================================================================== */

export const PK0 = 1.3;
const SLED_H = 12;
const PEN_L = 124;
const PEN_GRIP = PEN_L * 0.36;
/** Largest text size in stage units before the stage scales up as a whole. */
export const TSMAX = 27;

const STAGE_CACHE = new WeakMap();
const PARAM_IDS = new WeakMap();
let paramSeq = 0;
/**
 * Build the registry stage (memoised per layout pass).
 * @param {any} ctx
 * @param {{prefix:string, W:number, ts:number, p:any, looks:{a:any,b:any}, showText:boolean, markIdx?:number, calCols?:number|null,
 *   calMode?:string, fileMode?:string, compact?:boolean, noCal?:boolean, tsMax?:number}} o
 */
export function filingStage(ctx, o) {
  let cache = STAGE_CACHE.get(ctx);
  if (!cache) { cache = new Map(); STAGE_CACHE.set(ctx, cache); }
  const pid = o.p && typeof o.p === 'object' ? (PARAM_IDS.get(o.p) ?? (PARAM_IDS.set(o.p, ++paramSeq), paramSeq)) : 0;
  const lk = o.looks && typeof o.looks === 'object' ? (PARAM_IDS.get(o.looks) ?? (PARAM_IDS.set(o.looks, ++paramSeq), paramSeq)) : 0;
  const key = JSON.stringify(Object.keys(o).sort().map(k => [k, k === 'p' ? pid : k === 'looks' ? lk : typeof o[k] === 'number' ? Math.round(o[k] * 1e4) / 1e4 : o[k]]));
  if (cache.has(key)) return cache.get(key);
  const k = o.compact && o.noCal ? 1 : Math.max(1, o.ts / (o.tsMax ?? TSMAX));
  const st = stageAt(ctx, k > 1 ? {...o, ts: o.ts / k, W: o.W / k} : o);
  st.k = k;
  cache.set(key, st);
  return st;
}

function stageAt(ctx, o) {
  const {prefix: P, ts, p, showText} = o;
  const PK = PK0 * Math.min(1.2, Math.max(1, (o.compact ? Math.min(ts, 20) : ts) / 25)) * (o.peopleK ?? 1);
  const q = PK / PK0;
  const SEAT = -132 * PK;
  const TOP = -196 * PK;
  const APRON = TOP + 50 * q;
  const LEFT0 = 170 * q;           // the filing's left edge at the start: clear of Party A's head while she signs
  let W = o.W;
  const lipH = SLED_H + (o.compact ? Math.min(ts, 22) : ts) * 1.25;
  const lts = o.compact ? Math.min(ts, 20) : ts;
  const makeFiling = w => filingSheet(ctx, {prefix: `${P}-lt`, w, size: lts, title: p.documents.filing.title, dated: p.documents.filing.dated, reference: o.reference ?? p.documents.reference, altReference: o.altReference, tightBox: o.tightBox, refReal: o.refReal, showRefText: o.showRefText, signer: p.parties[0].name, showText, barsOnly: Boolean(o.compact), lipCover: lipH - SLED_H + 4});
  // (the sheet is at least wide enough for the reference box to take the reference's longest word whole, beside a
  // short signature line)
  const refWord = o.compact || !showText ? 0 : Math.max(...[o.reference ?? p.documents.reference, o.altReference].filter(Boolean).flatMap(t => glue(t).split(' ').filter(Boolean)).map(wd => ctx.measure(wd.replace(/\u00a0/g, ' '), lts, 700, 'sans')));
  const lwRef = refWord + lts * (0.96 + 3.4 + 1.2) + 4;
  const lwMin = o.compact ? 280 : Math.max(ts * (o.lwK ?? 12.4), 250, lwRef), lwMax = Math.max(lwMin, Math.min(ts * 22, o.grow ? ts * 22 : W - 470));
  let LW = lwMin, filing = makeFiling(LW);
  if (o.compact) { LW = o.compactLW ?? 300; filing = makeFiling(LW); }
  while (filing.h > LW * (o.aspect ?? 1.3) && LW < lwMax) {
    LW = Math.min(lwMax, LW + ts);
    filing = makeFiling(LW);
  }
  const trayW = LW + 44;
  if (o.grow) W = Math.max(W, 2 * LW + o.grow);
  // the route keeps a usable length between the filing's start and the intake tray
  W = Math.max(W, 2 * trayW + (o.route ?? 300));
  // (at rest the filing stands clear of the intake tray: a gap of at least 30 between them — also in compact scenes,
  // where a larger people scale q moves the seats' offsets apart)
  W = Math.max(W, 280 * q + 2 * LW + 44 + 30);
  const LH = filing.h;
  const X0 = LEFT0 + LW / 2;
  const X1 = W - 110 * q - trayW / 2;
  const letterBottom = TOP - SLED_H;
  const letterTop = letterBottom - LH;
  const pts = o.compact ? lts : ts;
  const trayOpt = (label, icon, plain) => ({w: trayW, lipTop: -lipH, rackTop: -(SLED_H + LH * 0.45), label, size: pts, showText, icon, plain, noIcon: true});
  const intake = letterTray(ctx, {prefix: `${P}-tray`, ...trayOpt(p.labels.intake, 'in', Boolean(o.compact))});
  // Party A's drafts place: the filing starts on its sled on the counter in front of her, above a label plaque
  // hung on the counter's front (no second tray: the stage keeps its width in tall frames)
  const dFit = fitG(p.labels.drafts, {maxWidth: Math.max(LW - pts * 1.6, pts * 6), size: pts, minSize: pts, maxLines: 6, weight: 700});
  const dPlate = {w: o.compact ? LW * 0.5 : Math.min(LW, dFit.width + pts * 1.6), h: o.compact ? pts * 1.4 : dFit.height + pts * 0.6};
  dPlate.x = -dPlate.w / 2; dPlate.y = 22;
  const draftsPlateNode = g({name: `${P}-dplate`},
    h('rect', {x: r(dPlate.x + 4), y: r(dPlate.y + 5), width: r(dPlate.w), height: r(dPlate.h), rx: 5, fill: ctx.theme.shadow}),
    h('rect', {x: r(dPlate.x), y: r(dPlate.y), width: r(dPlate.w), height: r(dPlate.h), rx: 5, fill: ctx.theme.paper, stroke: INK, 'stroke-width': 1.8}),
    !o.compact && showText ? textBlock(dFit, {x: 0, y: dPlate.y + (dPlate.h - dFit.height) / 2, anchor: 'middle', fill: INK, name: `${P}-dplate-label`})
      : h('rect', {'data-bar': 1, x: r(dPlate.x + pts * 0.6), y: r(dPlate.y + dPlate.h / 2 - pts * 0.2), width: r(dPlate.w - pts * 1.2), height: r(pts * 0.4), rx: 3, fill: ctx.theme.paperLine}),
  );
  // the reference stamp rests on its pad in front of the clerk, right of the intake tray
  const padX = W - 56 * q;
  const stampRest = {x: padX, y: TOP - 14};

  // case file on the shelf above Party A
  const fileW = Math.max(ts * 8.2, 196);
  const cf = caseFile(ctx, {prefix: `${P}-cf`, w: fileW, ref: p.documents.caseFile.ref, title: p.documents.caseFile.title, size: ts, showText});
  const onCab = o.fileMode === 'cabinet';
  const noFile = o.fileMode === 'none';
  const cabW = fileW + 50, cabH = 300;
  const shelfY = onCab ? -cabH - 6 : SEAT - 224 * PK - 40;
  const fileX = onCab ? -104 - cabW + 25 : LEFT0 - 18 - fileW;
  // registry calendar: on the wall between the case file and the intake tray ('middle'), right of the shelf
  // ('above') or across the wall ('wide')
  const days = p.dates.window;
  const lineW = t => ctx.measure(t.replace(/ /g, ' '), ts, 700, 'sans');
  const minCell = Math.max(...days.map(d => lineW(glue(d)))) + ts * 1.1;
  const left0 = onCab ? -104 - cabW - 30 : (o.tight ? -130 : -190);
  const wideCal = o.calMode === 'wide' || noFile;
  let calX0 = wideCal ? left0 + 24 : LEFT0 + 16, calX1 = wideCal ? W + (o.tight ? 96 : 166) : W + (o.tight ? 90 : 70), mode = wideCal ? 'wide' : 'above';
  if (o.calMode === 'middle') {
    const m0 = X0 + LW / 2 + 30, m1 = X1 - trayW / 2 - 30;
    if (m1 - m0 >= days.length * minCell && m1 - m0 >= ts * 12) { calX0 = m0; calX1 = m1; mode = 'middle'; }
  }
  let cols = o.calCols ?? days.length;
  while (cols > 1 && (calX1 - calX0) / cols < minCell) cols--;
  if (cols < days.length) cols = Math.ceil(days.length / Math.ceil(days.length / cols));
  const calOpt = {prefix: `${P}-cal`, x: calX0, w: calX1 - calX0, cols, days, title: p.labels.calendar, size: ts, showText, showTitle: !o.compact, slotH: ts * (o.slotK ?? 1.6)};
  const cal0 = calendarStrip(ctx, {...calOpt, y: 0});
  const calY = mode === 'middle' ? Math.min(letterTop + 10, TOP - 60 - cal0.h) : letterTop - 40 - cal0.h;
  const cal = calendarStrip(ctx, {...calOpt, y: calY});
  const fileTop = shelfY - cf.h;
  // (o.headroom: free wall above the filing, for a tag beside it — stage units)
  const wallTop = Math.min(o.noCal ? 0 : calY - ts * 1.6, noFile ? 0 : fileTop - 30, letterTop - 40 - (o.headroom ?? 0), SEAT - 230 * PK);

  const A = seatedParty(ctx, {name: `${P}-pa`, look: o.looks.a});
  const Bp = seatedParty(ctx, {name: `${P}-pb`, look: o.looks.b});
  const table = counterTable(ctx, {x0: 44, x1: W - 44, top: TOP, apron: APRON, legs: [X0 + LW / 2 + 60, W - 250], trackX0: LEFT0 - 10, trackX1: W - 100});
  const pn = pen(ctx, {name: `${P}-pen`, length: PEN_L});
  const markIdx = o.markIdx ?? 0;

  const node = g({name: P},
    backWall(ctx, {x0: onCab ? -104 - cabW - 30 : Math.min(o.tight ? -130 : -190, noFile ? 0 : fileX - 36), x1: o.tight ? W + 120 : W + 190, top: wallTop, plantX: o.tight ? null : W + 132}),
    noFile ? null : onCab ? g({transform: T(-104 - cabW, 0)}, filingCabinet(ctx, {w: cabW, h: cabH})) : g({transform: T(fileX - 30, shelfY)}, wallShelf(ctx, {w: fileW + 60})),
    noFile ? null : g({transform: T(fileX, shelfY)}, cf.node),
    o.noCal ? null : cal.node(markIdx),
    g({transform: T(X1, TOP)}, intake.glow),
    g({transform: T(0, SEAT)}, g({transform: `scale(${PK})`}, officeChair(ctx, {facing: 1}))),
    g({transform: T(W, SEAT)}, g({transform: `scale(${PK})`}, officeChair(ctx, {facing: -1}))),
    g({transform: T(X1, TOP)}, intake.back),
    g({name: `${P}-letter`, transform: T(X0, letterBottom)},
      g({transform: T(0, SLED_H)}, sled(ctx, {name: `${P}-sled`, w: LW - 16})),
      filing.body,
    ),
    A.body, Bp.body,
    table,
    // (the intake tray's front stands on the counter, drawn over it: a label plate hanging over the counter's edge
    // stays whole and visible)
    g({transform: T(X1, TOP)}, intake.front),
    g({transform: T(X0, TOP)}, draftsPlateNode),
    g({transform: T(padX, TOP)}, stampPad(ctx, {})),
    g({name: `${P}-stamp`, transform: T(stampRest.x, stampRest.y)}, refStamp(ctx, {name: `${P}-stampart`})),
    pn.node,
    A.near, Bp.near,
  );

  const shoulderOf = (sx, facing, lean) => {
    const loc = {x: 12, y: -112};
    const a = (lean || 0) * Math.PI / 180;
    const x = loc.x * Math.cos(a) - loc.y * Math.sin(a), y = loc.x * Math.sin(a) + loc.y * Math.cos(a);
    return {x: sx + x * PK * facing, y: SEAT + y * PK};
  };

  function sigTipAt(pp, x) {
    const qq = filing.sig.tipAt(pp);
    return {x: x + qq.x, y: letterBottom + qq.y};
  }
  // the reference box's centre when the filing stands in the intake tray
  const refC = {x: X1 + filing.box.x + filing.box.w / 2, y: letterBottom + filing.box.y + filing.box.h / 2};

  /** @param {any} v  action values from choreo() */
  function pose(v) {
    const nodes = {};
    const fa = A.frame({x: 0, y: SEAT, facing: 1, scale: PK, lean: v.leanA, near: v.handA, headTilt: 0});
    const fb = Bp.frame({x: W, y: SEAT, facing: -1, scale: PK, lean: v.leanB, near: v.handB, headTilt: 0});
    Object.assign(nodes, fa.nodes, fb.nodes);
    nodes[`${P}-letter`] = {transform: T(v.letterX, letterBottom)};
    Object.assign(nodes, filing.sig.frame(v.sig));
    nodes[`${P}-pen`] = {transform: T(v.pen.x, v.pen.y, v.pen.ang)};
    nodes[`${P}-stamp`] = {transform: T(v.stamp.x, v.stamp.y)};
    nodes[`${P}-lt-refmark`] = {opacity: r(v.refShown, 3)};
    nodes[`${P}-tray-glow`] = {opacity: r(v.lit * 0.75, 3)};
    const cf2 = o.noCal ? {allOpen: true} : cal.frame(1, v.markP, markIdx);
    if (!o.noCal) Object.assign(nodes, cf2.nodes);
    const semantic = {
      handA: fa.hands.near, handB: fb.hands.near, headA: fa.head, headB: fb.head,
      pen: {x: v.pen.x, y: v.pen.y},
      letter: {x: v.letterX, y: letterBottom - LH / 2},
      letterGrip: {x: v.letterX - LW / 2 + 4, y: letterBottom - 44},
      sigTip: sigTipAt(v.sig, v.letterX),
      stamp: {x: v.stamp.x, y: v.stamp.y},
      stampGrip: {x: v.stamp.x, y: v.stamp.y - STAMP_GRIP},
      refBox: {x: v.letterX + filing.box.x + filing.box.w / 2, y: letterBottom + filing.box.y + filing.box.h / 2},
      allReached: fa.reached && fb.reached,
      calAllOpen: cf2.allOpen, markP: r(v.markP, 3),
    };
    return {nodes, semantic};
  }

  const G = {
    W, ts, LW, LH, X0, X1, letterBottom, letterTop, trayW, lipTop: TOP - lipH, top: TOP,
    penRest: {x: 176 * q, y: TOP - 6}, restA: {x: 84 * q, y: TOP - 10}, restB: {x: W - 100 * q, y: TOP - 10},
    stampRest, refC, refBox: filing.box,
    sigStart: sigTipAt(0, X0), sigAt: pp => sigTipAt(pp, X0),
    shoulderA: lean => shoulderOf(0, 1, lean), shoulderB: lean => shoulderOf(W, -1, lean), reach: (80 + 76 + 9) * PK,
  };
  const heads = {a: {x: 6 * PK, y: SEAT + (-176) * PK}, b: {x: W - 6 * PK, y: SEAT + (-176) * PK}};
  const R = 46 * PK;
  const boxes = {
    headA: {x: heads.a.x - R, y: heads.a.y - R - 8, w: R * 2, h: R * 2 + 8},
    headB: {x: heads.b.x - R, y: heads.b.y - R - 8, w: R * 2, h: R * 2 + 8},
    // (scaled with the people: a larger people scale widens the seated figure and its head)
    personA: {x: -80 * q, y: heads.a.y - R - 8, w: 210 * q, h: -heads.a.y + R + 8},
    personB: {x: W - 130 * q, y: heads.b.y - R - 8, w: 210 * q, h: -heads.b.y + R + 8},
    file: noFile ? {x: 0, y: 0, w: 0, h: 0} : {x: fileX, y: fileTop, w: fileW + 8, h: cf.h},
    shelf: noFile ? {x: 0, y: 0, w: 0, h: 0} : onCab ? {x: -104 - cabW - 6, y: -cabH - 6, w: cabW + 12, h: cabH + 6} : {x: fileX - 30, y: shelfY, w: fileW + 60, h: 60},
    cal: o.noCal ? {x: 0, y: 0, w: 0, h: 0} : {x: calX0, y: calY - ts * 0.9, w: calX1 - calX0, h: cal.h + ts * 0.9},
    // each tray with the filing standing in it, its lip and its label plate
    trayAt: {x: X1 - trayW / 2 - 8, y: letterTop - 8, w: trayW + 16, h: -letterTop + TOP + 8 + Math.max(0, intake.plate.y + intake.plate.h)},
    letterStart: {x: X0 - LW / 2 - 6, y: letterTop - 8, w: LW + 14, h: LH + 34},
    letterEnd: {x: X1 - LW / 2 - 6, y: letterTop - 8, w: LW + 14, h: LH + 34},
    trayPlate: {x: X1 + intake.plate.x, y: TOP + intake.plate.y, w: intake.plate.w, h: intake.plate.h},
    draftsPlate: {x: X0 + dPlate.x, y: TOP + dPlate.y, w: dPlate.w, h: dPlate.h},
    // the reference box on the filing standing in the intake tray, and on the filing at the start
    refEnd: {x: X1 + filing.box.x, y: letterBottom + filing.box.y, w: filing.box.w, h: filing.box.h},
    refStart: {x: X0 + filing.box.x, y: letterBottom + filing.box.y, w: filing.box.w, h: filing.box.h},
    // the stamp on its pad, and the path it travels to the reference box and back
    stamp: {x: padX - 31, y: TOP - 14 - 62, w: 62, h: 76},
    stampPath: {x: Math.min(refC.x, padX) - 31, y: Math.min(refC.y - 28, TOP - 14) - 60 - 62, w: Math.abs(padX - refC.x) + 62, h: Math.abs(TOP - 14 - refC.y + 28) + 60 + 76},
    pen: {x: 20, y: TOP - 34, w: 180, h: 34},
    table: {x: 44, y: TOP, w: W - 88, h: -TOP},
  };
  const x0 = onCab ? -104 - cabW - 30 : Math.min(o.tight ? -130 : -190, noFile ? 0 : fileX - 36);
  const x1 = o.tight ? W + 120 : W + 190;
  const em = o.compact ? 24 : ts * (o.wallPad ?? 1.2);
  const ext = {x: x0, y: wallTop - em, w: x1 - x0, h: -wallTop + em + 48};
  return {node, pose, G, boxes, heads, ext, cal, filing, calMode: mode,
    fits: [...(o.compact ? (o.showRefText ? filing.fits.slice(2) : []) : filing.fits), ...(noFile ? [] : [cf.refFit, cf.titleFit]), ...(o.compact ? [] : [cal.titleFit, intake.fit, dFit]), ...(o.noCal ? [] : cal.dayFits)], markIdx, cols};
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

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
  push: [0.42, 0.47], slide: [0.47, 0.62], handBack: [0.47, 0.55], draftBack: [0.37, 0.46],
  toStamp: [0.62, 0.68], carry: [0.68, 0.76], press: [0.76, 0.8], lift: [0.8, 0.84], back: [0.84, 0.93], rest: [0.93, 1],
  mark: [0.8, 0.82], entry: [0.82, 0.9],
};
const S = (c, w) => seg(c, w[0], w[1]);
const mixP = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
const PUSH = 70;

/**
 * Action values for clock c.
 * @param {number} c 0..1
 * @param {'registered'|'draft'} plan
 * @param {any} G stage geometry (filingStage().G)
 */
export function choreo(c, plan, G) {
  const e = ease.inOutCubic;
  const penRestTip = G.penRest;
  const gripOf = (tip, ang) => ({x: tip.x + Math.cos(ang * Math.PI / 180) * PEN_GRIP, y: tip.y + Math.sin(ang * Math.PI / 180) * PEN_GRIP});
  const WRITE = 158; // pen body down-left from the nib (held low, below the signer's face)
  // ---- pen
  let penTip = penRestTip, penAng = 180, held = false;
  const lift = e(S(c, CW.liftPen)), sig = S(c, CW.sign), drop = e(S(c, CW.dropPen));
  if (c >= CW.liftPen[0] && c < CW.sign[0]) {
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
  const filed = plan === 'registered';
  // ---- filing
  const push = filed ? e(S(c, CW.push)) : 0;
  const slide = filed ? ease.inOutSine(S(c, CW.slide)) : 0;
  const letterX = c < CW.slide[0] || !filed ? G.X0 + PUSH * push : lerp(G.X0 + PUSH, G.X1, slide);
  const letterGrip = {x: letterX - G.LW / 2 + 4, y: G.letterBottom - 44};
  // ---- Party A's near hand
  let handA;
  const penGrip = gripOf(penRestTip, 180);
  if (c < CW.grabPen[1]) handA = mixP(G.restA, penGrip, e(S(c, CW.grabPen)));
  else if (held) handA = gripOf(penTip, penAng);
  else if (!filed) handA = mixP(penGrip, G.restA, e(S(c, CW.draftBack)));
  else if (c < CW.toSled[1]) handA = mixP(penGrip, {x: G.X0 - G.LW / 2 + 4, y: G.letterBottom - 44}, e(S(c, CW.toSled)));
  else if (c < CW.push[1]) handA = letterGrip;
  else handA = mixP({x: G.X0 + PUSH - G.LW / 2 + 4, y: G.letterBottom - 44}, G.restA, e(S(c, CW.handBack)));
  const leanA = 12 * Math.min(1, S(c, [0.06, 0.13])) * (1 - S(c, filed ? [0.47, 0.55] : [0.37, 0.46]));
  // ---- the clerk and the reference stamp
  let handB = G.restB;
  let stamp = {...G.stampRest};
  let refShown = 0, markP = 0;
  // (the stamp travels low, at the reference box's height, from the right: it never passes over the filing's
  // printed text; it presses with its base on the box's lower half and lifts a little before going back)
  const pressed = {x: G.refC.x + G.refBox.w * 0.12, y: G.refC.y + G.refBox.h / 2 - 4};
  const hover = {x: pressed.x + 18, y: pressed.y - 16};
  const gripS = q => ({x: q.x, y: q.y - STAMP_GRIP});
  if (filed) {
    if (c < CW.toStamp[0]) handB = G.restB;
    else if (c < CW.toStamp[1]) handB = mixP(G.restB, gripS(G.stampRest), e(S(c, CW.toStamp)));
    else {
      if (c < CW.carry[1]) {
        // lifted off the pad, carried over the counter to just above the reference box
        const t = e(S(c, CW.carry));
        const up = Math.sin(Math.PI * t) * 16;
        stamp = {x: lerp(G.stampRest.x, hover.x, t), y: lerp(G.stampRest.y, hover.y, t) - up};
      } else if (c < CW.press[1]) stamp = mixP(hover, pressed, e(S(c, CW.press)));
      else if (c < CW.lift[1]) stamp = mixP(pressed, hover, e(S(c, CW.lift)));
      else if (c < CW.back[1]) {
        const t = e(S(c, CW.back));
        const up = Math.sin(Math.PI * t) * 16;
        stamp = {x: lerp(hover.x, G.stampRest.x, t), y: lerp(hover.y, G.stampRest.y, t) - up};
      }
      handB = c < CW.back[1] ? gripS(stamp) : mixP(gripS(G.stampRest), G.restB, e(S(c, CW.rest)));
    }
    refShown = S(c, CW.mark);
    markP = S(c, CW.entry);
  }
  const lit = filed ? S(c, [0.62, 0.7]) : 0;
  return {
    handA, handB,
    leanA: leanFor(G.shoulderA, handA, leanA, G.reach),
    leanB: leanFor(G.shoulderB, handB, 0, G.reach),
    pen: {x: penTip.x, y: penTip.y, ang: penAng}, penHeld: held,
    sig, letterX, stamp, refShown, markP, lit,
    landed: filed && c >= CW.slide[1],
    docAt: !filed || c < CW.slide[0] ? 'A' : c < CW.slide[1] ? 'route' : 'registry',
    stampAt: !filed || c < CW.toStamp[1] ? 'pad' : c < CW.carry[1] ? 'carried' : c < CW.lift[1] ? 'pressing' : c < CW.back[1] ? 'returning' : 'pad',
    referenced: refShown >= 1,
  };
}

/* ======================================================================== */
/* Fitting a stage into a box                                                */
/* ======================================================================== */

/**
 * Fit a registry stage into a design box (the pilot's solver, with this motif's stage builder): the stage's text is
 * sized in stage units (B·m / scale); each mode is scanned from a large scale down and refined; long supplied text
 * may step the text down (m ≥ 0.82 ≈ 16 px) before the people would shrink below `sMin`.
 * @param {any} ctx
 * @param {{B:number, availW:number, availH:number, sMin:number, modes:Array<[string,string,number]>, opts:any, heightTrim?:number,
 *   preferWide?:boolean, wideTol?:number, minWideW?:number}} o
 */
export function solveFiling(ctx, o) {
  let m = 1, tsMax = 27, calMode = 'above', fileMode = 'shelf', Wc = o.modes[0][2];
  const trim = o.heightTrim ?? 44;
  const tsQ = sc => Math.round(((o.B * m) / sc) * 20) / 20;
  const build = sc => filingStage(ctx, {...o.opts, W: Wc, ts: tsQ(sc), tsMax, calMode, fileMode});
  const fits = (st, sc) => st.ext.w * sc * st.k <= o.availW && (st.ext.h - trim) * sc * st.k <= o.availH;
  let minEff = 0;
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
    if (o.preferWide && best.eff > 0) {
      const wide = q => { calMode = q.md; fileMode = q.fm; Wc = q.wc; tsMax = q.tm; const st = build(q.sc); return st.ext.w * q.sc * st.k; };
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
  const fixedK = Boolean(o.opts.compact && o.opts.noCal);
  const TMS = fixedK ? [27] : [27, 33, 40];
  minEff = o.sMin;
  let res = pick(o.modes, TMS);
  if (res.eff < o.sMin) {
    // (preferWide: every mode stays a candidate — the longer tables are what fill a wide frame)
    const cands = o.preferWide ? o.modes : [...res.all].sort((a2, b2) => b2.eff - a2.eff).slice(0, 2).map(q => [q.md, q.fm, q.wc]);
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
  if (!res.sc) res = {sc: 0.12};
  const stage = build(res.sc);
  return {stage, s: res.sc * stage.k, m, tsMax, calMode, fileMode, W: Wc, fitted};
}

/* ======================================================================== */
/* Links without institutional direction                                     */
/* ======================================================================== */

/**
 * Line styles for this motif: no arrowheads on relation, communication or sequence links (no directed institutional
 * arrows; an order is captioned "Sequence as configured (illustrative)" instead). Only a causal link that the author
 * supplies keeps the shared causal style with its arrowhead.
 */
export const FD_LINK_STYLES = {
  relation: {dash: null, arrow: false, width: 3, endDots: true},
  communication: {dash: '10 9', arrow: false, width: 3.5, endDots: true},
  sequence: {dash: null, arrow: false, width: 3.5, endDots: true},
  causal: LINK_STYLES.causal,
};

/**
 * Anchored cubic link with animatable drawing progress (same contract as primitives/annotate.js connector():
 * {node, frame(p, opacity), at, total, mid, from, to}), drawn with FD_LINK_STYLES.
 */
export function link(ctx, o) {
  const style = FD_LINK_STYLES[o.kind || 'relation'];
  const {from, to} = o;
  const dx = to.x - from.x, dy = to.y - from.y;
  const bend = o.bend ?? 0.25;
  const nx = -dy, ny = dx;
  const c1 = o.c1 || {x: from.x + dx * 0.3 + nx * bend, y: from.y + dy * 0.3 + ny * bend};
  const c2 = o.c2 || {x: from.x + dx * 0.7 + nx * bend, y: from.y + dy * 0.7 + ny * bend};
  const poly = cubicPolyline(from, c1, c2, to, 60);
  const total = poly.total;
  const d = `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(to.x)} ${r(to.y)}`;
  const color = o.color ?? ctx.theme.fg;
  const end = poly.at(1);
  const headLen = style.width * 4.2;
  const xs = poly.pts.map(q => q.x), ys = poly.pts.map(q => q.y);
  const pad = style.width * 6 + 20;
  const mx = Math.min(...xs) - pad, my = Math.min(...ys) - pad;
  const node = g({name: o.name},
    style.dash
      ? h('defs', null, h('mask', {id: ctx.id(`${o.name}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...xs) - mx + pad), height: r(Math.max(...ys) - my + pad)},
        h('path', {name: `${o.name}-masker`, d, fill: 'none', stroke: '#fff', 'stroke-width': style.width * 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)})))
      : null,
    style.dash
      ? h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: color, 'stroke-width': style.width, 'stroke-linecap': 'round', 'stroke-dasharray': style.dash, mask: ctx.ref(`${o.name}-mask`)})
      : h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: color, 'stroke-width': style.width, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    style.arrow ? h('path', {name: `${o.name}-head`, d: `M0 0L${r(-headLen)} ${r(-headLen * 0.55)}L${r(-headLen * 0.72)} 0L${r(-headLen)} ${r(headLen * 0.55)}Z`, fill: color, transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${o.name}-dotA`, cx: r(from.x), cy: r(from.y), r: style.width * 1.6, fill: color, opacity: 0}) : null,
    style.endDots ? h('circle', {name: `${o.name}-dotB`, cx: r(to.x), cy: r(to.y), r: style.width * 1.6, fill: color, opacity: 0}) : null,
  );
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - p));
    const out = {[o.name]: {opacity}};
    if (style.dash) out[`${o.name}-masker`] = {'stroke-dashoffset': off};
    else out[`${o.name}-line`] = {'stroke-dashoffset': off};
    if (style.arrow) out[`${o.name}-head`] = {opacity: p >= 0.985 ? 1 : 0};
    if (style.endDots) {
      out[`${o.name}-dotA`] = {opacity: p > 0 ? 1 : 0};
      out[`${o.name}-dotB`] = {opacity: p >= 0.985 ? 1 : 0};
    }
    return out;
  };
  return {node, frame, at: t => poly.at(t), total, mid: poly.at(0.5), from, to, c1, c2, arrow: style.arrow};
}

/**
 * The stamped reference as a stand-alone card (mechanism / contrast / inspect): an accent-2 bordered box with the
 * supplied reference (or, when not registered, the same box blank — neutral, no cross). Origin = top-left.
 */
export function referenceCard(ctx, o) {
  const th = ctx.theme;
  const ts = o.size;
  const fit = fitG(o.text, {maxWidth: o.w - ts * 1.2, size: ts, minSize: ts, maxLines: 5, weight: 700});
  const hgt = Math.max(ts * 2.4, fit.height + ts * 1.1);
  const node = g({name: o.name},
    h('rect', {x: 4, y: 5, width: r(o.w), height: r(hgt), rx: 8, fill: th.shadow}),
    h('rect', {x: 0, y: 0, width: r(o.w), height: r(hgt), rx: 8, fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 2}),
    g({name: `${o.name}-mark`, opacity: o.stamped ? 1 : 0},
      h('rect', {x: 2, y: 2, width: r(o.w - 4), height: r(hgt - 4), rx: 7, fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 3}),
      o.showText ? textBlock(fit, {x: o.w / 2, y: (hgt - fit.height) / 2, anchor: 'middle', fill: th.accent2, name: `${o.name}-text`})
        : h('rect', {'data-bar': 1, x: r(ts * 0.6), y: r(hgt / 2 - ts * 0.2), width: r(o.w - ts * 1.2), height: r(ts * 0.4), rx: 3, fill: th.accent2, opacity: 0.6}),
    ),
  );
  return {node, w: o.w, h: hgt, fit};
}
