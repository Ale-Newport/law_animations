/**
 * Motif kit for "Reconvención ilustrativa" (LAW-0261..0264): fields, fictional defaults, the counter stage, its
 * choreography and its solver. Each entry owns its own timeline, layout, labels and semantics. Built on the civil-claim
 * kits (civil-claim-art.js, requerimiento-previo.js, presentacion-demanda.js, contestacion-estructurada.js), used
 * read-only.
 *
 * The stage (side view of a filing counter, stage units, floor at y = 0):
 *   Party A (filed the initial claim) standing at the left end of the counter, Party B standing at the right end · a
 *   flat tray in front of each · in the middle the case file, standing open on the counter as a rack with two
 *   sleeves: the left sleeve, open towards Party A, holds the initial claim (● header); the right sleeve, open towards
 *   Party B, is empty · a track runs along the counter top from each side into its sleeve · the calendar hangs on the
 *   wall above the left lane.
 * Action (clock c ∈ [0,1], `choreo`): Party B's additional claim (◆ header) stands on the counter at the right end of
 * the right lane; Party B's hand pushes it leftwards along the track — the opposite direction to the initial claim's
 * lane — then it glides on into the right sleeve. The initial claim stays where it is, whole and readable: the
 * additional claim never covers, moves or erases it. The calendar marks the supplied day of the additional claim.
 * Nothing here states a rule for an additional claim (admissibility, connection, set-off, time limits) or any effect:
 * both claims are supplied values of this fictional example, shown with equal weight.
 * @module animations/civil-claim/kits/reconvencion-ilustrativa
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {personRig} from '../../../primitives/person.js';
import {glue, fitG, backWall, letterTray, calendarStrip} from './civil-claim-art.js';
import {gchip, keyChip, hit, placeTag, partyCaption, looksOf} from './requerimiento-previo.js';
import {localizeDefaults} from './presentacion-demanda.js';
import {stateBadge, caseFileW} from './contestacion-estructurada.js';

export {gchip, keyChip, hit, placeTag, partyCaption, looksOf, glue, fitG, localizeDefaults, stateBadge, caseFileW};

const INK = '#1f2328';
export const PK0 = 1.3;

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

const claimDoc = label => obj(label, {title: str('Title on the claim sheet', 50), summary: str('What the claim asks for, in a few words (fictional, as supplied)', 80)}, ['title', 'summary']);
export const partiesField = list('Party A (filed the initial claim) and Party B (files the additional claim), in this order; fictional', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) standing open on the counter', {ref: str('Reference on the case file tab', 30), title: str('Title on the case file', 60)}, ['ref', 'title']),
  initialClaim: claimDoc('The initial claim of Party A (fictional)'),
  additionalClaim: claimDoc('The additional claim of Party B (fictional)'),
}, ['caseFile', 'initialClaim', 'additionalClaim']);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  window: list('Day labels of the calendar (as supplied)', str('Day label', 24), 2, 7),
  initialDay: int('Zero-based index of the day marked for the initial claim (as supplied)', 0, 6),
  additionalDay: int('Zero-based index of the day marked for the additional claim (as supplied)', 0, 6),
}, ['window', 'initialDay', 'additionalDay']);
export const stagesField = obj('Captions of the supplied states (descriptive only)', {
  initial: str('Caption of the initial claim', 50),
  additional: str('Caption of the additional claim', 50),
  both: str('Caption once both claims are in the case file', 60),
}, ['initial', 'additional', 'both']);
export const labelProps = {
  calendar: str('Title on the calendar', 50),
  trayA: str('Label plate on Party A’s tray', 36),
  trayB: str('Label plate on Party B’s tray', 36),
};

export const RI_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Claimant'}, {name: 'Party B', role: 'Respondent'}],
  documents: {
    caseFile: {ref: 'CF-0612', title: 'Case file · fictional dispute'},
    initialClaim: {title: 'Initial claim · Party A', summary: 'Return of a lent bicycle'},
    additionalClaim: {title: 'Additional claim · Party B', summary: 'Payment for repairs made'},
  },
  dates: {window: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'], initialDay: 0, additionalDay: 3},
  stages: {initial: 'Initial claim (as supplied)', additional: 'Additional claim (as supplied)', both: 'Both claims kept in the case file'},
  labels: {calendar: 'Calendar (as supplied)', trayA: 'Party A', trayB: 'Party B'},
};
export const RI_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Demandante'}, {name: 'Parte B', role: 'Demandada'}],
  documents: {
    caseFile: {ref: 'EXP-0612', title: 'Expediente · disputa ficticia'},
    initialClaim: {title: 'Demanda inicial · Parte A', summary: 'Devolución de una bicicleta prestada'},
    additionalClaim: {title: 'Pretensión adicional · Parte B', summary: 'Pago de reparaciones realizadas'},
  },
  dates: {window: ['Día 1', 'Día 2', 'Día 3', 'Día 4', 'Día 5'], initialDay: 0, additionalDay: 3},
  stages: {initial: 'Pretensión inicial (según lo aportado)', additional: 'Pretensión adicional (según lo aportado)', both: 'Ambas pretensiones constan en el expediente'},
  labels: {calendar: 'Calendario (según lo aportado)', trayA: 'Parte A', trayB: 'Parte B'},
};
export const RI_COMMON_ES = {parties: RI_DEFAULTS_ES.parties, documents: RI_DEFAULTS_ES.documents, stages: RI_DEFAULTS_ES.stages, dates: RI_DEFAULTS_ES.dates};

export const RI_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', asSupplied: 'as supplied', sequence: 'Sequence as configured (illustrative)'},
  es: {key: 'Según lo aportado · sin conclusión', asSupplied: 'según lo aportado', sequence: 'Secuencia según la configuración (ilustrativa)'},
};

/** The "● initial · ◆ additional" key text (the two supplied claims, told apart by solid glyphs of equal weight). */
export function claimKeyText(p) {
  return `● ${p.stages.initial}  ·  ◆ ${p.stages.additional}`;
}
/** Day indexes clamped to the supplied day labels. */
export function dayOf(p, k) {
  const n = p.dates.window.length;
  return Math.max(0, Math.min(n - 1, k ? p.dates.additionalDay : p.dates.initialDay));
}

/* ======================================================================== */
/* Art: claim sheet, case-file rack                                          */
/* ======================================================================== */

/**
 * A claim sheet standing upright: a coloured header band with its glyph (● initial, ◆ additional — the same size and
 * stroke), the title and the summary (or filler bars when the text is printed elsewhere). Origin = bottom-left.
 * @returns {{node:any, w:number, h:number, fits:any[]}}
 */
export function claimSheet(ctx, o) {
  const th = ctx.theme;
  const {w, size: ts, kind} = o;
  const pad = ts * 0.5;
  // (the glyph is the sheet's sign: larger on a sheet that prints no text)
  const R = ts * (o.showText ? 0.5 : 0.66);
  const head = kind === 'additional' ? th.accent3 : th.accent2;
  const textW = w - pad * 2;
  const titleFit = fitG(o.title, {maxWidth: textW - R * 2.6, size: ts, minSize: ts, maxLines: 4, weight: 700});
  const sumFit = fitG(o.summary, {maxWidth: textW, size: ts, minSize: ts, maxLines: 5, weight: 600});
  const bars = !o.showText;
  const headH = Math.max((bars ? ts * 1.4 : titleFit.height) + pad * 1.2, R * 2.7);
  const bodyH = bars ? ts * 2.2 : sumFit.height + pad * 1.4;
  // (a deeper bottom margin: the sheet stands in a tray whose lip covers that margin only)
  const H = headH + bodyH + Math.max(pad * 0.6, ts * 1.75);
  const parts = [
    h('path', {d: roundRectPath(5, -H + 6, w, H, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(0, -H, w, H, 6), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(2, -H + 2, w - 4, headH - 2, 5), fill: head, opacity: 0.32}),
    h('path', {d: `M0 ${r(-H + headH)}H${r(w)}`, stroke: INK, 'stroke-width': 2}),
    stateGlyph(ctx, {name: `${o.prefix}-glyph`, kind, x: pad + R, y: -H + headH / 2, R}),
  ];
  if (bars) {
    parts.push(h('rect', {'data-bar': 1, x: r(pad + R * 2.6), y: r(-H + headH / 2 - ts * 0.2), width: r((textW - R * 2.6) * 0.75), height: r(ts * 0.4), rx: 3, fill: th.paperLine}));
    [0, 1].forEach(k => parts.push(h('rect', {'data-bar': 1, x: r(pad), y: r(-H + headH + pad + k * ts * 0.9), width: r(textW * (k ? 0.55 : 0.85)), height: r(ts * 0.36), rx: 3, fill: th.paperLine})));
  } else {
    parts.push(textBlock(titleFit, {x: pad + R * 2.6, y: -H + (headH - titleFit.height) / 2, fill: INK, name: `${o.prefix}-title`}));
    parts.push(textBlock(sumFit, {x: pad, y: -H + headH + pad * 0.7, fill: INK, name: `${o.prefix}-summary`}));
  }
  return {node: g({name: o.prefix}, parts), w, h: H, headH, fits: bars ? [] : [titleFit, sumFit]};
}

/** The claim glyph: ● (initial) or ◆ (additional), equal size and stroke. */
export function stateGlyph(ctx, {name, kind, x, y, R, opacity}) {
  const th = ctx.theme;
  const shape = kind === 'additional'
    ? h('path', {d: `M${r(x)} ${r(y - R * 1.22)}L${r(x + R * 1.22)} ${r(y)}L${r(x)} ${r(y + R * 1.22)}L${r(x - R * 1.22)} ${r(y)}Z`, fill: th.accent3, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'})
    : h('circle', {cx: r(x), cy: r(y), r: r(R), fill: th.accent2, stroke: INK, 'stroke-width': 2.4});
  return g({name, opacity}, shape);
}

/* ======================================================================== */
/* Stage                                                                     */
/* ======================================================================== */

const STAGE_CACHE = new WeakMap();
const IDS = new WeakMap();
let seq = 0;
const idOf = v => (v && typeof v === 'object' ? (IDS.get(v) ?? (IDS.set(v, ++seq), seq)) : 0);

/**
 * Build the counter stage (memoised per layout pass).
 * @param {any} ctx
 * @param {{prefix:string, ts:number, p:any, looks:{a:any,b:any}, showText:boolean, compact?:boolean, compactTs?:number,
 *   peopleK?:number, lwK?:number, finalState?:string, boardOnly?:boolean, wallExtra?:number, wallExtraX?:number,
 *   withAdditional?:boolean}} o
 */
export function counterStage(ctx, o) {
  let cache = STAGE_CACHE.get(ctx);
  if (!cache) { cache = new Map(); STAGE_CACHE.set(ctx, cache); }
  const key = JSON.stringify(Object.keys(o).sort().map(k => [k, k === 'p' || k === 'looks' ? idOf(o[k]) : typeof o[k] === 'number' ? Math.round(o[k] * 1e4) / 1e4 : o[k]]));
  if (cache.has(key)) return cache.get(key);
  const st = stageAt(ctx, o);
  if (cache.size > 24) cache.delete(cache.keys().next().value);
  cache.set(key, st);
  return st;
}

function stageAt(ctx, o) {
  const th = ctx.theme;
  const {prefix: P, ts, p, showText} = o;
  const lts = o.compact ? Math.min(ts, o.compactTs ?? 20) : ts;
  const PK = PK0 * (o.peopleK ?? 1);
  const q = PK / PK0;
  const withAdd = o.withAdditional !== false;
  // ---- the two claim sheets (same width)
  // (a sheet is never narrower than its longest printed word: no word breaks on a sheet)
  const words = [p.documents.initialClaim.title, p.documents.initialClaim.summary, p.documents.additionalClaim.title, p.documents.additionalClaim.summary];
  const wordW = showText && !o.compact ? Math.max(...words.flatMap(t => glue(t).split(' ')).map(w => ctx.measure(w.replace(/\u00a0/g, ' '), lts, 700, 'sans'))) : 0;
  // (compact sheets print no text: they may be narrower)
  const SW = Math.max(lts * (o.lwK ?? 9), o.compact ? 130 : 200, wordW + lts * 2.2);
  const sheetI = claimSheet(ctx, {prefix: `${P}-ci`, w: SW, size: lts, kind: 'initial', title: p.documents.initialClaim.title, summary: p.documents.initialClaim.summary, showText: showText && !o.compact});
  const sheetA = claimSheet(ctx, {prefix: `${P}-ca`, w: SW, size: lts, kind: 'additional', title: p.documents.additionalClaim.title, summary: p.documents.additionalClaim.summary, showText: showText && !o.compact});
  const sheetH = Math.max(sheetI.h, sheetA.h);
  // ---- the counter, its top at CT; the case file rack on it
  const CT = -176 * PK;
  const pad = lts * 0.6;
  const gap = lts * 1.2;
  const cfFit = fitG(`${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`, {maxWidth: (o.stackedRack ? SW + pad : SW * 2 + gap) - lts, size: lts, minSize: lts, maxLines: 4, weight: 700});
  const rackHead = (showText && !o.compact ? cfFit.height : lts * 1.2) + lts * 0.9;
  // (o.stackedRack: the two sleeves one above the other — the upper one, open to the left, on a shelf fed from Party
  // A's side; the lower one, open to the right, on the counter — a narrower stage for tall and square frames)
  const stk = Boolean(o.stackedRack);
  const rackW = SW + pad * 2 + (stk ? 0 : SW + gap);
  const rackH = (stk ? 2 * (sheetH + pad) : sheetH + pad * 1.6) + rackHead;
  // ---- horizontal: A · tray A · left lane · rack · right lane · tray B · B
  // (a tray is never narrower than its label's longest word: no word breaks inside the plate)
  const trayWord = showText && !o.compact ? Math.max(...[p.labels.trayA, p.labels.trayB].flatMap(t => glue(t).split(' ')).map(w => ctx.measure(w.replace(/\u00a0/g, ' '), lts, 700, 'sans'))) : 0;
  const trayW = Math.max(110 * q, lts * 5, trayWord + lts * 3.2);
  const laneW = SW + 30 * q;
  const xA = 0;
  // (o.near: the people stand close to the counter's ends — a narrower stage)
  const reachIn = (o.near ? 46 : 72) * PK;
  const trayAX = reachIn + trayW / 2;
  const laneL0 = trayAX + trayW / 2 + 18 * q;
  const rackX = laneL0 + laneW;
  const laneR0 = rackX + rackW;
  const trayBX = laneR0 + laneW + 18 * q + trayW / 2;
  const xB = trayBX + trayW / 2 + reachIn;
  const counter = {x0: trayAX - trayW / 2 - 30 * q, x1: trayBX + trayW / 2 + 30 * q};
  // sleeves: left sleeve open to the left, right sleeve open to the right; sheets stand on the sleeve floor
  const floorY = CT - pad * 0.6;
  const slotL = stk ? {x: rackX + pad, y: floorY - sheetH - pad} : {x: rackX + pad, y: floorY}, slotR = stk ? {x: rackX + pad, y: floorY} : {x: rackX + pad + SW + gap, y: floorY};
  // the additional claim starts standing in Party B's tray (her outgoing tray), at the outer end of the right lane
  const startA = {x: Math.max(laneR0 + laneW - SW, trayBX - SW / 2), y: CT};
  // ---- calendar on the wall above the left lane
  const days = p.dates.window;
  const calX0 = stk ? laneR0 + 10 * q : laneL0, calW = Math.max(laneW, lts * 9);
  // (printed days set the cell width; a calendar without text keeps a nominal cell)
  const minCell = showText && !o.compact ? Math.max(...days.map(d => ctx.measure(glue(d).replace(/ /g, ' '), lts, 700, 'sans'))) + lts * 1.1 : lts * 3;
  let cols = days.length;
  while (cols > 1 && calW / cols < minCell - 0.5) cols--;
  if (cols < days.length) cols = Math.ceil(days.length / Math.ceil(days.length / cols));
  const calOpt = {prefix: `${P}-cal`, x: calX0, w: calW, cols, days, title: p.labels.calendar, size: lts, showText: showText && !o.compact, showTitle: !o.compact, slotH: lts * 1.5};
  const cal0 = calendarStrip(ctx, {...calOpt, y: 0});
  const rackTop = CT - rackH;
  // (above the lanes and their sheets)
  const calY = Math.min(CT - sheetH - lts * 1.6 - cal0.h, rackTop + lts * 1.2);
  const cal = calendarStrip(ctx, {...calOpt, y: calY});
  // ---- trays (flat, on the counter)
  const trays = [0, 1].map(k => letterTray(ctx, {prefix: `${P}-tr${k}`, w: trayW, lipTop: -(lts * 1.6), rackTop: -(lts * 3), label: k ? p.labels.trayB : p.labels.trayA, size: lts, showText: showText && !o.compact, plain: Boolean(o.compact), noIcon: true}));
  // ---- people
  const rigA = personRig(ctx, {name: `${P}-pa`, look: o.looks.a, pose: 'standing'});
  const rigB = personRig(ctx, {name: `${P}-pb`, look: o.looks.b, pose: 'standing'});
  const wallTop = -(o.wallExtra ?? 0) + Math.min(calY - lts * 1.4, rackTop - lts, -420 * PK);
  // (o.wallExtraX / o.wallExtraL: the wall runs further right / left — the room fills its box)
  const x0 = -110 * PK - (o.wallExtraL ?? 0), x1 = xB + 110 * PK + (o.wallExtraX ?? 0);
  const R0 = 46 * PK;
  const heads = {a: {x: xA + 5 * PK, y: -366 * PK}, b: {x: xB - 5 * PK, y: -366 * PK}};
  const reach = (80 + 76 + 9) * PK * 0.96;
  const shoulderB = {x: xB - 12 * PK, y: -302 * PK};
  // the hand pushes the sheet by its right edge, at mid height of the sheet
  const gripY = CT - sheetH * 0.45;
  const restB = {x: xB - 40 * PK, y: -180 * PK};
  const startGrip = {x: startA.x + SW, y: gripY};
  // the hand pushes as far as the reach allows, then the sheet glides on alone
  // (the reach is measured from the shoulder: the higher or lower the grip, the shorter the horizontal reach)
  const dyG = Math.abs(gripY - shoulderB.y);
  const reachX = Math.sqrt(Math.max(0, (reach * 0.92) ** 2 - dyG ** 2));
  const pushMax = Math.max(0, startGrip.x - (shoulderB.x - reachX));
  const travel = startA.x - slotR.x;
  const pushD = Math.min(travel, pushMax);
  const counterNode = g(null,
    ...[counter.x0 + 30 * q, counter.x1 - 30 * q].map(x => h('rect', {x: r(x - 10), y: r(CT + 16), width: 20, height: r(-CT - 16), fill: '#8a6a4a', stroke: INK, 'stroke-width': 2.2})),
    h('rect', {x: r(counter.x0), y: r(CT), width: r(counter.x1 - counter.x0), height: 18, rx: 6, fill: '#c69c6d', stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: r(counter.x0 + 12), y: r(CT + 18), width: r(counter.x1 - counter.x0 - 24), height: r(30 * q), fill: '#a8825a', stroke: INK, 'stroke-width': 2.2}),
  );
  // tracks along the counter top into each sleeve (plain lines: no arrowheads)
  const tracks = [[laneL0, rackX + pad, stk ? slotL.y + 3 : CT - 3], [rackX + rackW - pad, laneR0 + laneW, CT - 3]].map(([a, b, yy], k) => h('path', {name: `${P}-track${k}`, d: `M${r(a)} ${r(yy)}H${r(b)}`, stroke: '#6b5338', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.55}));
  // (stacked: the shelf that carries the upper lane, fixed to the wall)
  const shelf = stk ? g(null, h('rect', {x: r(laneL0), y: r(slotL.y), width: r(rackX - laneL0 + pad), height: r(lts * 0.6), rx: 3, fill: '#c69c6d', stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(laneL0 + 20 * q)} ${r(slotL.y + lts * 0.6)}l${r(lts)} ${r(lts * 1.4)}`, stroke: INK, 'stroke-width': 3})) : null;
  // the rack: a back panel, the header with the case file's reference and title, two sleeves
  const rackBack = g({name: `${P}-rack`},
    h('path', {d: roundRectPath(rackX + 6, rackTop + 8, rackW, rackH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(rackX, rackTop, rackW, rackH, 10), fill: '#c9a15e', stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(rackX + lts * 0.3, rackTop + lts * 0.3, rackW - lts * 0.6, rackHead - lts * 0.4, 6), fill: '#e8d3a8', stroke: INK, 'stroke-width': 1.8}),
    showText && !o.compact ? textBlock(cfFit, {x: rackX + rackW / 2, y: rackTop + (rackHead - cfFit.height) / 2, anchor: 'middle', fill: INK, name: `${P}-cf-text`})
      : h('rect', {'data-bar': 1, x: r(rackX + rackW * 0.25), y: r(rackTop + rackHead / 2 - lts * 0.2), width: r(rackW * 0.5), height: r(lts * 0.4), rx: 3, fill: '#b08a4e'}),
    // sleeve backs
    [slotL, slotR].map(s0 => h('path', {d: roundRectPath(s0.x - 4, s0.y - sheetH - pad * 0.5, SW + 8, sheetH + pad * 0.5, 6), fill: '#b48c4f', stroke: INK, 'stroke-width': 1.6})),
  );
  // sleeve fronts: a low lip along each sleeve floor (open on the outer side) — over the sheet's bottom margin only
  const lipH = pad * 0.5;
  const rackFront = g(null,
    h('path', {d: roundRectPath(slotL.x - 2, slotL.y - lipH, SW + 6, lipH + pad * 0.6, 3), fill: '#a07a40', stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(slotR.x - 4, slotR.y - lipH, SW + 6, lipH + pad * 0.6, 3), fill: '#a07a40', stroke: INK, 'stroke-width': 1.8}),
  );
  const sheetIG = g({name: `${P}-ci-g`, transform: T(slotL.x, slotL.y)}, sheetI.node);
  const sheetAG = withAdd ? g({name: `${P}-ca-g`, transform: T(startA.x, startA.y)}, sheetA.node) : null;
  // the trail of the additional claim along its lane (dotted, drawn as it travels; no arrowheads)
  const trailD = `M${r(startA.x + SW)} ${r(CT - 12)}H${r(slotR.x + SW)}`;
  const trailLen = startA.x - slotR.x;
  const trail = withAdd ? h('path', {name: `${P}-trail`, d: trailD, stroke: th.accent3, 'stroke-width': 4, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round', fill: 'none', opacity: 0}) : null;
  // the initial claim's own lane, already travelled (the same dotted mark, its colour)
  const trailI = h('path', {name: `${P}-trailI`, d: `M${r(laneL0 + 10)} ${r((stk ? slotL.y : CT) - 12)}H${r(slotL.x)}`, stroke: th.accent2, 'stroke-width': 4, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round', fill: 'none', opacity: 0.85});
  const boardG = g(null, rackBack, sheetIG, sheetAG, rackFront);
  // (o.boardOnly: the rack alone — with o.withCal, the calendar too — for a lens copy)
  const node = o.boardOnly ? g({name: P}, o.withCal ? cal.node(dayOf(p, 1)) : null, boardG) : g({name: P},
    backWall(ctx, {x0, x1, top: wallTop, plantX: null}),
    cal.node(dayOf(p, 1)),
    counterNode, shelf,
    tracks, trailI, trail,
    trays.map((t, k) => g({transform: T(k ? trayBX : trayAX, CT)}, t.back)),
    rackBack, sheetIG, rackFront, sheetAG,
    // (the trays' fronts over the sheet standing in Party B's tray: the lip hides its bottom margin only)
    trays.map((t, k) => g({transform: T(k ? trayBX : trayAX, CT)}, t.front)),
    rigA.node, rigB.node,
  );
  const box = (x, y, w, hh) => ({x, y, w, h: hh});
  const boxes = {
    headA: box(heads.a.x - R0, heads.a.y - R0 - 8, 2 * R0, 2 * R0 + 8),
    headB: box(heads.b.x - R0, heads.b.y - R0 - 8, 2 * R0, 2 * R0 + 8),
    personA: box(xA - 60 * PK, heads.a.y - R0 - 8, 120 * PK, -heads.a.y + R0 + 8),
    personB: box(xB - 60 * PK, heads.b.y - R0 - 8, 120 * PK, -heads.b.y + R0 + 8),
    rack: box(rackX, rackTop, rackW, rackH + 8),
    sheetI: box(slotL.x, slotL.y - sheetI.h, SW, sheetI.h),
    sheetEnd: box(slotR.x, slotR.y - sheetA.h, SW, sheetA.h),
    sheetStart: box(startA.x, startA.y - sheetA.h, SW, sheetA.h),
    cal: box(calX0, calY - lts * 0.9, calW, cal.h + lts * 0.9),
    trays: [trayAX, trayBX].map(x => box(x - trayW / 2 - 8, CT - lts * 3 - 8, trayW + 16, lts * 3 + 8 + lts * 1.6)),
    counter: box(counter.x0, CT, counter.x1 - counter.x0, -CT),
    laneL: box(laneL0, (stk ? slotL.y : CT) - sheetH, laneW, sheetH),
  };
  const G = {PK, ts: lts, SW, sheetH, CT, slotL, slotR, startA, rackX, rackW, rackTop, rackH, xA, xB, shoulderB, reach, gripY, restB, startGrip, pushD, travel, trailLen, laneL0, laneR0, laneW, withAdd};
  function pose(v) {
    const nodes = {};
    const fa = rigA.frame({x: xA, y: 0, facing: 1, scale: PK, lean: 0, near: null, headTilt: 0});
    Object.assign(nodes, fa.nodes);
    const handAt = v.hand;
    const fb = rigB.frame({x: xB, y: 0, facing: -1, scale: PK, lean: 0, near: handAt, headTilt: 0});
    Object.assign(nodes, fb.nodes);
    if (withAdd) {
      nodes[`${P}-ca-g`] = {transform: T(r(startA.x - v.sheetD), r(startA.y))};
      // (the lane's dotted mark shows once the sheet has started along it)
      nodes[`${P}-trail`] = {opacity: r(clamp(v.sheetD / Math.max(1, travel * 0.25)), 3)};
    }
    const cf2 = cal.frame(1, v.markP, dayOf(p, 1));
    Object.assign(nodes, cf2.nodes);
    return {nodes, semantic: {hand: fb.hands.near, grip: handAt, headA: fa.head, headB: fb.head, allReached: fb.reached, markP: r(v.markP, 3)}};
  }
  const em = o.compact ? 24 : lts * 0.6;
  const ext = {x: x0, y: wallTop - em, w: x1 - x0, h: -wallTop + em + 48};
  const fitsList = o.compact ? [] : [...sheetI.fits, ...(withAdd ? sheetA.fits : []), ...(showText ? [cfFit] : []), ...(cal ? [cal.titleFit, ...cal.dayFits] : []), ...trays.map(t => t.fit)].filter(Boolean);
  return {node, pose, G, boxes, heads, ext, fits: showText && !o.compact ? fitsList : [], cal, PK, wallExtra: o.wallExtra ?? 0};
}

/* ======================================================================== */
/* Choreography                                                              */
/* ======================================================================== */

/**
 * Action values for clock c: Party B's hand reaches the additional claim's right edge, pushes it leftwards along the
 * track as far as the reach allows, lets go — the sheet glides on into the right sleeve — and comes back to rest. The
 * initial claim does not move. finalState "held": the hand rests on the sheet; the sheet stays at the lane's end.
 * @param {number} c 0..1
 * @param {any} G stage geometry
 * @param {{held?:boolean}} [o]
 */
export function choreo(c, G, o = {}) {
  const e = ease.inOutSine;
  const mix = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
  if (!G.withAdd) return {hand: G.restB, sheetD: 0, phase: 'rest', slotted: false, markP: 0, pushed: 0};
  const reach = [0.06, 0.22], push = [0.22, 0.48], glide = [0.48, 0.8], back = [0.5, 0.66];
  let hand = G.restB, phase = 'rest';
  // (the push speeds up and the glide slows down: the sheet keeps its speed when the hand lets go)
  const pushT = o.held ? 0 : ease.inQuad(seg(c, ...push));
  const pushD = G.pushD * pushT;
  const glideT = o.held ? 0 : ease.outQuad(seg(c, ...glide));
  const sheetD = pushD + (G.travel - G.pushD) * glideT;
  const grip = {x: G.startGrip.x - pushD, y: G.startGrip.y};
  if (c >= reach[0] && c < reach[1]) { hand = mix(G.restB, G.startGrip, e(seg(c, ...reach))); phase = 'reach'; }
  else if (c >= reach[1] && (o.held || c < push[1])) { hand = grip; phase = o.held ? 'hold' : 'push'; }
  else if (!o.held && c >= push[1] && c < back[1]) { hand = mix(grip, G.restB, e(seg(c, ...back))); phase = c < glide[1] ? 'glide' : 'return'; }
  if (!o.held && c >= back[1]) phase = c < glide[1] ? 'glide' : 'rest';
  return {hand, sheetD, phase, slotted: !o.held && glideT >= 1, markP: o.held ? 0 : seg(c, 0.82, 0.92), pushed: r(pushT, 3)};
}

/* ======================================================================== */
/* Fitting a stage into a box                                                */
/* ======================================================================== */

/**
 * Fit a counter stage into a design box: the stage's text is sized in stage units (B·m / scale); the largest scale
 * that fits is found by scanning down and refining; long supplied text may step the text down (m ≥ 0.82).
 */
export function solveStage(ctx, o) {
  let m = 1;
  const tsOf = sc => Math.round(((o.B * m) / sc) * 20) / 20;
  const build = sc => counterStage(ctx, {...o.opts, ts: tsOf(sc)});
  const fitsAt = sc => { const st = build(sc); return st.ext.w * sc <= o.availW && (st.ext.h - 30) * sc <= o.availH; };
  const solve = () => {
    let found = null, prev = null, lastW = Infinity, flat = 0;
    for (let sc = 1.6; sc >= (o.scMin ?? 0.2); prev = sc, sc *= 0.86) {
      if (fitsAt(sc)) { found = sc; break; }
      const st = build(sc);
      const wNow = Math.max(st.ext.w * sc / o.availW, (st.ext.h - 30) * sc / o.availH);
      flat = wNow > lastW * 0.985 ? flat + 1 : 0;
      lastW = wNow;
      if (flat >= 2) break;
    }
    if (found === null) return 0;
    let lo = found, hi = prev ?? found / 0.86;
    for (let i = 0; i < 7; i++) { const mid = (lo + hi) / 2; if (fitsAt(mid)) lo = mid; else hi = mid; }
    return lo;
  };
  let sc = solve();
  if (!sc) {
    for (const mm of [0.94, 0.88, 0.82]) { m = mm; sc = solve(); if (sc) break; }
  }
  const fitted = Boolean(sc);
  if (!sc) sc = 0.2;
  let stage = build(sc);
  if (o.fillH && fitted) {
    const spare = o.availH / sc - (stage.ext.h - 30);
    if (spare > 2) stage = counterStage(ctx, {...o.opts, ts: tsOf(sc), wallExtra: Math.round(spare)});
  }
  return {stage, s: sc, m, fitted, ts: tsOf(sc)};
}

/** Place a solved stage in a box (centred in width, bottom-aligned above the chip band). */
export function placeStage(sol, f) {
  const s = sol.s;
  const E = sol.stage.ext;
  const h1 = (E.h - 30) * s;
  const free = Math.max(0, f.bottom - f.chipBand - f.top0 - h1);
  const top = f.top0 + free / 2;
  const ox = f.x0 + (f.availW - E.w * s) / 2 - E.x * s, oy = top - E.y * s + 2;
  const M = q2 => ({x: ox + q2.x * s, y: oy + q2.y * s});
  const Mb = b => ({x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: b.h * s});
  const bx = sol.stage.boxes;
  const boxes = Object.fromEntries(Object.entries(bx).map(([k, v]) => [k, Array.isArray(v) ? v.map(Mb) : Mb(v)]));
  return {s, ox, oy, M, Mb, boxes, floor: oy};
}
