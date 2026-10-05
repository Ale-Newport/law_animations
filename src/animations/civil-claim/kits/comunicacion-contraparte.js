/**
 * Motif kit for "Comunicación a la contraparte" (LAW-0253..0256): fields, fictional defaults, strings, the shared
 * side-view office stage with its editable notification route, the route choreography and small text helpers.
 * Each entry owns its own timeline, layout, labels and semantics.
 *
 * The stage (side view, stage units, floor at y = 0):
 *   Party A seated at the left with a small desk and an out-tray holding the case file · the ROUTE, a wall track
 *   rising above A's tray, running across the wall through the supplied stops (small wall boxes with a plate and a
 *   neutral lamp) and coming down above Party B's in-tray · Party B seated at the right · a calendar hanging between
 *   the two risers, one cell per leg with the supplied date label.
 * Action (clock c ∈ [0,1], `frame(c)`):
 *   A reaches the case file and lifts it into the carrier's clip; the carrier takes it up the riser, across the
 *   stops (it pauses at each; the stop's lamp lights, neutral) and down to B's tray; as each leg completes, that
 *   leg's calendar cell unfolds with its supplied date. B takes the file from the clip and sets it in the tray.
 * The route, its stops and its dates are SUPPLIED and editable; the track is drawn as plain rails (no arrowheads)
 * and captioned "Sequence as configured (illustrative)". Final states are supplied data only:
 *   documented — a neutral ● chip "communication documented (as supplied)";
 *   questioned — a neutral ◆ chip "questioned in this example (as supplied)" and a dashed outline (the disputed
 *                marker) around the supplied leg. Nothing states a valid method, a deadline, "deemed" service or an
 *                effect of a questioned communication.
 * Props follow SOLVED hand positions (person-rig IK); nothing teleports.
 * @module animations/civil-claim/kits/comunicacion-contraparte
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp, lerp, ease, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, party, oneOf} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {actorLook} from '../../../primitives/people-style.js';
import {fitG, glue, backWall, officeChair, seatedParty, letterTray} from './civil-claim-art.js';

const INK = '#1f2328';
/** Stand-in text that sizes a tray's plate when labels are hidden (drawn as filler bars, never as text). */
const TRAY_FILLER = 'Tray · label';
const STOP_FILLER = 'Stop name';

/* ======================================================================== */
/* Fields and defaults                                                       */
/* ======================================================================== */

export const partiesField = list('Party A (starts the communication) and Party B (the other party), in this order; fictional', party, 2, 2);
export const documentsField = obj('Documents drawn in the scene (fictional, as supplied)', {
  caseFile: obj('The case file (expediente) that travels along the route', {ref: str('Reference on the file tab', 30), title: str('Title on the file plate', 60)}, ['ref', 'title']),
}, ['caseFile']);
export const stagesField = list('Stops of the notification route, in the configured order (supplied and editable; descriptive only)', str('Stop name', 50), 1, 3);
export const datesField = obj('Dates, all supplied placeholders (nothing is inferred from them)', {
  legs: list('Date label of each leg of the route, in order (one more than the stops; missing labels are drawn as "—")', str('Date label', 40), 2, 4),
}, ['legs']);
export const objectLabelProps = {
  outTray: str('Label plate on Party A’s out-tray', 36),
  inTray: str('Label plate on Party B’s in-tray', 36),
  calendar: str('Title of the calendar with the legs’ dates', 50),
  route: str('Caption of the route (the order shown is only the configured one)', 60),
  documented: str('Final-state chip when the communication is supplied as documented', 70),
  questioned: str('Final-state chip when the communication is supplied as questioned (only that someone questions it here)', 70),
};

export const CC_DEFAULTS = {
  parties: [{name: 'Party A', role: 'Sending party'}, {name: 'Party B', role: 'Other party'}],
  documents: {caseFile: {ref: 'CF-0530', title: 'Case file · fictional claim'}},
  stages: ['Mail room (fictional)', 'Front desk (fictional)'],
  dates: {legs: ['Day 1 (as supplied)', 'Day 2 (as supplied)', 'Day 3 (as supplied)']},
  labels: {
    outTray: 'Out · Party A', inTray: 'In · Party B', calendar: 'Leg dates (as supplied)', route: 'Sequence as configured (illustrative)',
    documented: 'Communication documented (as supplied)', questioned: 'Communication questioned in this example (as supplied)',
  },
};
export const CC_DEFAULTS_ES = {
  parties: [{name: 'Parte A', role: 'Parte que comunica'}, {name: 'Parte B', role: 'Otra parte'}],
  documents: {caseFile: {ref: 'EXP-0530', title: 'Expediente · reclamación ficticia'}},
  stages: ['Correspondencia (ficticia)', 'Recepción (ficticia)'],
  dates: {legs: ['Día 1 (según lo aportado)', 'Día 2 (según lo aportado)', 'Día 3 (según lo aportado)']},
  labels: {
    outTray: 'Salida · Parte A', inTray: 'Entrada · Parte B', calendar: 'Fechas de los tramos (según lo aportado)', route: 'Secuencia según lo configurado (ilustrativa)',
    documented: 'Comunicación documentada (según lo aportado)', questioned: 'Comunicación cuestionada en este ejemplo (según lo aportado)',
  },
};
export const CC_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', was: 'was', leg: 'Leg'},
  es: {key: 'Según lo aportado · sin conclusión', was: 'antes', leg: 'Tramo'},
};

/**
 * With locale "es", every field still at its English default is shown with its Spanish default instead (a field the
 * user has set is kept as supplied). Same contract as the civil-claim-02 helper (copied here: this kit owns its own).
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
export const CC_COMMON_ES = {parties: CC_DEFAULTS_ES.parties, documents: CC_DEFAULTS_ES.documents, stages: CC_DEFAULTS_ES.stages, dates: CC_DEFAULTS_ES.dates, objectLabels: CC_DEFAULTS_ES.labels};

export function partyCaption(p, i, override) {
  if (override) return override;
  const a = p.parties[i];
  return a.role ? `${a.name} · ${a.role}` : a.name;
}
export function looksOf(ctx, p) {
  return {a: actorLook(ctx, p.parties[0], 0), b: actorLook(ctx, p.parties[1], 1)};
}
/** Leg date labels, one per leg (stops + 1). */
export function legLabels(p) {
  const n = p.stages.length + 1;
  return Array.from({length: n}, (_, i) => p.dates.legs[i] ?? '—');
}

export const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
export const unionBox = bs => {
  const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y));
  return {x: x0, y: y0, w: Math.max(...bs.map(b => b.x + b.w)) - x0, h: Math.max(...bs.map(b => b.y + b.h)) - y0};
};

/* ======================================================================== */
/* Cues and chips                                                            */
/* ======================================================================== */

/** ● documented / ◆ questioned: solid glyphs of equal ink area (never a colour, a tick or a cross). */
export function stateCue(ctx, kind, s, o = {}) {
  const th = ctx.theme;
  if (kind === 'questioned') {
    const a = s * Math.sqrt(0.08 * Math.PI); // same area as the circle of radius 0.4 s
    return h('path', {name: o.name, d: `M0 ${r(-a)}L${r(a)} 0L0 ${r(a)}L${r(-a)} 0Z`, fill: th.ink});
  }
  return h('circle', {name: o.name, cx: 0, cy: 0, r: r(s * 0.4), fill: th.ink});
}

/**
 * A chip with an optional ● / ◆ cue: card, cue and whole-word text (glued numbers). dashed: a dashed outline (only the
 * questioned state uses it).
 * @returns {{w:number, h:number, fit:any, node:(x:number,y:number)=>any}}
 */
export function cueChip(ctx, o) {
  const th = ctx.theme;
  const F = o.size;
  const pad = F * 0.5, gs = o.cue ? F * 1.1 : 0, gap = o.cue ? F * 0.45 : 0;
  // (an empty text with a cue gives a glyph-only chip: labels hidden keep the ● / ◆ scenario badge, no letters)
  const bare = !o.text && o.cue;
  const fit = bare ? {width: 0, height: 0, lines: [], truncated: false} : fitG(o.text, {maxWidth: Math.max(F * 3, o.maxWidth - 2 * pad - gs - gap), size: F, minSize: F, maxLines: o.maxLines ?? 4, weight: o.weight ?? 700});
  const w = bare ? gs + 2 * pad : fit.width + 2 * pad + gs + gap, hh = Math.max(fit.height, gs) + pad * 1.2;
  return {
    w, h: hh, fit,
    node: (x, y) => g({name: o.name, opacity: o.opacity},
      h('path', {d: roundRectPath(x + 3, y + 4, w, hh, Math.min(hh / 2, F * 0.6)), fill: th.shadow}),
      h('path', {name: o.name && `${o.name}-card`, d: roundRectPath(x, y, w, hh, Math.min(hh / 2, F * 0.6)), fill: th.card, stroke: o.stroke ?? th.accent2, 'stroke-width': 2.6}),
      o.cue ? g({transform: T(x + pad + gs / 2, y + hh / 2)}, stateCue(ctx, o.cue, gs, {name: o.name && `${o.name}-cue`})) : null,
      bare ? null : textBlock(fit, {x: x + pad + gs + gap, y: y + (hh - fit.height) / 2, fill: th.ink, name: o.name && `${o.name}-text`})),
  };
}

/* ======================================================================== */
/* Stage art                                                                 */
/* ======================================================================== */

export const PK = 1.3;
const SEAT = -132 * PK;
export const TOP = -196 * PK;       // desk top
const TRX = 164;                     // tray centre in front of the seat point
const CARRIER = {w: 46, h: 26, cord: 26};
const LIFT = 34;                     // the file rises this much from the tray into the clip
const TRAY_BASE = 8;

function desk(ctx, {x0, x1, P, top = TOP}) {
  const th = ctx.theme;
  const w = x1 - x0;
  const TOP = top;
  return g({name: `${P}-desk`},
    h('rect', {x: r(x0 + 16), y: r(TOP + 18), width: 16, height: r(-TOP - 18), fill: th.woodDark, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(x1 - 32), y: r(TOP + 18), width: 16, height: r(-TOP - 18), fill: th.woodDark, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(x0 + w * 0.38, TOP + 18, w * 0.5, 70, 6), fill: th.wood, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(x0 + w * 0.56), y: TOP + 46, width: r(w * 0.14), height: 9, rx: 4, fill: th.metalDark}),
    h('rect', {x: r(x0), y: r(TOP), width: r(w), height: 20, rx: 5, fill: th.woodTop, stroke: INK, 'stroke-width': 2.6}),
  );
}

/**
 * A compact case-file folder seen from the front (original art): back cover, sheet edges, front cover with a spine
 * band and an elastic band, a reference tab and a title label. Local origin = bottom-left of the front cover.
 * Height follows the supplied text (never cut).
 */
function folderArt(ctx, o) {
  const th = ctx.theme;
  const {w, ts} = o;
  const c = '#c9a15e';
  const refFit = fitG(o.ref, {maxWidth: w * 0.78 - ts * 0.8, size: ts, minSize: ts, maxLines: 3, weight: 700, family: 'mono'});
  const inner = w - ts * 1.9;
  // (filler folder: three neutral lines whatever the supplied title, which the entry prints elsewhere)
  const titleFit0 = fitG(o.title, {maxWidth: inner - ts * 0.6, size: ts, minSize: ts, maxLines: 6, weight: 700, family: 'serif'});
  const titleFit = o.showText ? titleFit0 : {...titleFit0, lines: ['', '', ''], height: ts * 1.18 * 2 + ts, truncated: false};
  const tabH = refFit.height + ts * 0.6, tabW = Math.max(w * 0.46, refFit.width + ts * 1.0);
  const plateH = titleFit.height + ts * 0.7;
  const bodyH = Math.max(w * 0.86, plateH + ts * 1.6);
  const top = -bodyH;
  const px = ts * 0.95, py = top + ts * 0.6;
  const band = w - ts * 0.75;
  const node = g({name: o.prefix},
    h('path', {d: roundRectPath(7, top - 2, w, bodyH + 2, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(ts * 0.3, top - ts * 0.4, w, bodyH, 8), fill: shade(c, -0.22), stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(ts * 0.45), y: r(top - ts * 0.26), width: r(w - ts * 0.4), height: r(ts * 0.42), rx: 3, fill: th.paper, stroke: INK, 'stroke-width': 1.3}),
    h('path', {d: `M${r(w - tabW - 6)} ${r(top + 2)}V${r(top - tabH + 8)}Q${r(w - tabW - 6)} ${r(top - tabH)} ${r(w - tabW + 2)} ${r(top - tabH)}H${r(w - 14)}Q${r(w - 6)} ${r(top - tabH)} ${r(w - 6)} ${r(top - tabH + 8)}V${r(top + 2)}Z`, fill: shade(c, 0.1), stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(0, top, w, bodyH, 8), fill: c, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: 0, y: r(top), width: r(ts * 0.5), height: r(bodyH), rx: 4, fill: shade(c, -0.18)}),
    h('rect', {x: r(band), y: r(top), width: r(ts * 0.3), height: r(bodyH), fill: '#5b4b6b', opacity: 0.85}),
    h('path', {d: roundRectPath(px, py, inner, plateH, 5), fill: th.paper, stroke: INK, 'stroke-width': 1.6}),
    o.showText ? textBlock(refFit, {x: w - tabW - 6 + (tabW - 8) / 2, y: top - tabH + ts * 0.3, anchor: 'middle', fill: INK, name: `${o.prefix}-ref`})
      : h('rect', {'data-bar': 1, x: r(w - tabW + ts * 0.3), y: r(top - tabH + ts * 0.45), width: r(Math.max(4, tabW - ts * 1.4)), height: r(ts * 0.34), rx: 3, fill: th.paperLine}),
    o.showText ? textBlock(titleFit, {x: px + ts * 0.3, y: py + ts * 0.35, fill: INK, name: `${o.prefix}-title`})
      : titleFit.lines.map((_, i) => h('rect', {'data-bar': 1, x: r(px + ts * 0.3), y: r(py + ts * 0.5 + i * ts * 1.18), width: r(Math.max(4, (inner - ts * 0.6) * (i === titleFit.lines.length - 1 ? 0.6 : 0.9))), height: r(ts * 0.34), rx: 3, fill: th.paperLine})),
  );
  return {node, w, h: bodyH + tabH, bodyH, refFit, titleFit};
}

/** The carrier: a small trolley riding the track, a cord and a clip. Origin = trolley centre. */
function carrierArt(ctx, P) {
  const th = ctx.theme;
  const {w, h: ch, cord} = CARRIER;
  return g({name: `${P}-carrier`},
    h('line', {x1: 0, y1: r(ch / 2), x2: 0, y2: r(ch / 2 + cord), stroke: INK, 'stroke-width': 3}),
    h('path', {d: roundRectPath(-12, ch / 2 + cord - 6, 24, 12, 3), fill: th.metalDark, stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(-w / 2, -ch / 2, w, ch, 7), fill: '#6f8797', stroke: INK, 'stroke-width': 2.4}),
    h('circle', {cx: r(-w * 0.26), cy: r(-ch / 2), r: 6, fill: INK}),
    h('circle', {cx: r(w * 0.26), cy: r(-ch / 2), r: 6, fill: INK}),
  );
}

/** A route stop: a small wall box on the track with a neutral lamp and a label plate above it. */
function stopArt(ctx, o) {
  const th = ctx.theme;
  const {x, y, ts, P, i} = o;
  const bw = Math.max(64, ts * 2.6), bh = 34;
  // (never narrower than the widest kept-together word group: a word is never split)
  // (labels hidden: the plate is sized by a short stand-in and carries a filler bar — never a blank plate sized by a long name)
  const nm = o.showText ? o.name : STOP_FILLER;
  const widest = Math.max(...glue(nm).split(' ').filter(Boolean).map(t => fitG(t, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width));
  const fit = fitG(nm, {maxWidth: Math.max(o.plateW - ts * 1.0, widest + 2), size: ts, minSize: ts, maxLines: o.maxLines ?? 5, weight: 700});
  // (o.noPlate: the stop's name is printed elsewhere — the box and its lamp only)
  const ph = o.noPlate ? 0 : fit.height + ts * 0.7, pw = Math.max(fit.width + ts * 1.0, bw + 10);
  const boxY = y - bh - 16;
  const plateY = o.noPlate ? boxY : boxY - 10 - ph;
  const node = g({name: `${P}-stop${i}`},
    h('rect', {x: r(x - 5), y: r(boxY + bh), width: 10, height: 18, fill: th.metalDark}),
    h('path', {d: roundRectPath(x - bw / 2 + 4, boxY + 5, bw, bh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x - bw / 2, boxY, bw, bh, 8), fill: '#c9d4dc', stroke: INK, 'stroke-width': 2.4}),
    h('circle', {cx: r(x), cy: r(boxY + bh / 2), r: 11, fill: th.paper, stroke: INK, 'stroke-width': 2}),
    h('circle', {name: `${P}-lamp${i}`, cx: r(x), cy: r(boxY + bh / 2), r: 11, fill: th.accent2, stroke: INK, 'stroke-width': 2, opacity: 0}),
    o.noPlate ? null : h('path', {d: roundRectPath(x - pw / 2 + 4, plateY + 5, pw, ph, 6), fill: th.shadow}),
    o.noPlate ? null : h('path', {d: roundRectPath(x - pw / 2, plateY, pw, ph, 6), fill: th.paper, stroke: INK, 'stroke-width': 2}),
    o.noPlate ? null : o.showText
      ? textBlock(fit, {x, y: plateY + (ph - fit.height) / 2, anchor: 'middle', fill: INK, name: `${P}-stop${i}-name`})
      : h('rect', {'data-bar': 1, x: r(x - pw * 0.3), y: r(plateY + ph / 2 - ts * 0.18), width: r(pw * 0.6), height: r(ts * 0.36), rx: r(ts * 0.18), fill: th.paperLine}),
  );
  return {node, box: {x: x - pw / 2, y: plateY, w: pw, h: y - plateY + 4}, plate: {x: x - pw / 2, y: plateY, w: pw, h: ph}, fit, lamp: {x, y: boxY + bh / 2}};
}

/**
 * The legs' calendar: a hanging header (rings, supplied title) and one cell per leg that unfolds from its left hinge
 * with the leg's supplied date label (no empty slots: a cell only shows its date). Design of the category's calendar
 * strip, compacted for the route. Origin = top-left of the header.
 */
function legCalendar(ctx, o) {
  const th = ctx.theme;
  const {prefix, x, y, w, ts, days} = o;
  const n = days.length;
  const cols = Math.max(1, Math.min(o.cols, n));
  const rows = Math.ceil(n / cols);
  const cw = w / cols;
  const titleFit = fitG(o.title || ' ', {maxWidth: w - ts * 2, size: ts, minSize: ts, maxLines: 3, weight: 700});
  // (o.noTitle: the header bar carries only its rings — the calendar is named by a chip elsewhere)
  const noTitle = Boolean(o.noTitle);
  const headH = o.showText && !noTitle ? titleFit.height + ts * 0.9 : ts * 1.6;
  const dayFits = days.map(d => fitG(d, {maxWidth: cw - ts * 0.8, size: ts, minSize: ts, maxLines: 4, weight: 700}));
  // (a cell narrower than a date's widest kept-together word would split it: reported, the layout widens the stage)
  const widest = Math.max(...days.map(d => Math.max(...glue(d).split(' ').filter(Boolean).map(t => fitG(t, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width))));
  const split = o.showText && widest > cw - ts * 0.8;
  const dayH = o.showText ? Math.max(...dayFits.map(f => f.height)) : ts;
  const cellH = dayH + ts * 1.0;
  const top = y + headH;
  const H = headH + rows * cellH;
  const cellBox = i => ({x: x + (i % cols) * cw, y: top + Math.floor(i / cols) * cellH, w: cw, h: cellH});
  const rings = [];
  const nr = Math.max(2, Math.round(w / 130));
  for (let i = 0; i < nr; i++) {
    const rx = x + ((i + 0.5) / nr) * w;
    rings.push(h('path', {d: `M${r(rx)} ${r(y + ts * 0.3)}v-${r(ts * 0.9)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}));
  }
  const header = g({name: `${prefix}-head`},
    h('path', {d: roundRectPath(x + 6, y + 8, w, headH, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, headH, 10), fill: th.accent2, stroke: INK, 'stroke-width': 2.6}),
    rings,
    noTitle ? null : o.showText ? textBlock(titleFit, {x: x + w / 2, y: y + (headH - titleFit.height) / 2, anchor: 'middle', fill: '#fff', name: `${prefix}-title`})
      : h('rect', {'data-bar': 1, x: r(x + w * 0.25), y: r(y + headH / 2 - ts * 0.2), width: r(w * 0.5), height: r(ts * 0.4), rx: 3, fill: 'rgba(255,255,255,0.55)'}));
  const pack = g({name: `${prefix}-pack`},
    ...[3, 2, 1, 0].map(k => h('path', {d: roundRectPath(x + k * 4, top + k * 3, Math.min(cw, w) * 0.3, cellH * 0.9, 6), fill: k ? th.paperShade : th.paper, stroke: INK, 'stroke-width': 2})));
  const cells = days.map((d, i) => {
    const c = cellBox(i);
    return g({name: `${prefix}-cell${i}`, transform: `translate(${r(c.x)} ${r(c.y)}) scale(0.001 1) translate(${r(-c.x)} ${r(-c.y)})`, opacity: 0},
      h('rect', {x: r(c.x), y: r(c.y), width: r(c.w), height: r(c.h), fill: th.paper, stroke: INK, 'stroke-width': 2.2}),
      h('rect', {x: r(c.x + 5), y: r(c.y + 5), width: r(ts * 0.9), height: 5, rx: 2, fill: th.accent2}),
      g({name: `${prefix}-ct${i}`, opacity: 0},
        o.showText ? textBlock(dayFits[i], {x: c.x + c.w / 2, y: c.y + (c.h - dayFits[i].height) / 2, anchor: 'middle', fill: INK, name: `${prefix}-day${i}`})
          : h('rect', {'data-bar': 1, x: r(c.x + c.w * 0.25), y: r(c.y + c.h / 2 - ts * 0.2), width: r(c.w * 0.5), height: r(ts * 0.4), rx: 3, fill: th.paperLine})));
  });
  function frame(open) {
    const out = {};
    const each = 1 / (n * 0.7 + 0.3);
    days.forEach((d, i) => {
      const c = cellBox(i);
      const p = ease.outCubic(seg(open, i * each * 0.7, i * each * 0.7 + each * 0.3 + 1e-6));
      out[`${prefix}-cell${i}`] = {transform: `translate(${r(c.x)} ${r(c.y)}) scale(${r(Math.max(0.001, p), 4)} 1) translate(${r(-c.x)} ${r(-c.y)})`, opacity: p > 0 ? 1 : 0};
      const t0 = i * each * 0.7 + each * 0.3 + 1e-6;
      out[`${prefix}-ct${i}`] = {opacity: p < 1 ? 0 : r(seg(open, t0, t0 + each * 0.25), 3)};
    });
    out[`${prefix}-pack`] = {opacity: r(1 - seg(open, 0, 0.35), 3)};
    return {nodes: out};
  }
  return {
    node: () => g({name: prefix}, header, pack, cells), frame, cellBox, titleFit, dayFits,
    box: {x, y: y - ts * 0.7, w, h: H + ts * 0.7}, h: H, headH, cellH, cols, rows, split,
  };
}

/** Rounded polyline path through points (corner radius rad). */
function roundPath(pts, rad) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const k = Math.min(rad, l1 / 2, l2 / 2);
    const p1 = {x: b.x + (a.x - b.x) * k / l1, y: b.y + (a.y - b.y) * k / l1};
    const p2 = {x: b.x + (c.x - b.x) * k / l2, y: b.y + (c.y - b.y) * k / l2};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
  }
  const z = pts[pts.length - 1];
  return d + `L${r(z.x)} ${r(z.y)}`;
}

/** Arc-length parametrised polyline (corners cut by a radius, as drawn). */
function polyline(pts) {
  const segs = [];
  let L = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    segs.push({a, b, l, s0: L});
    L += l;
  }
  const at = s => {
    const q = clamp(s, 0, L);
    const sg = segs.find(z => q <= z.s0 + z.l + 1e-9) || segs[segs.length - 1];
    const t = sg.l ? (q - sg.s0) / sg.l : 0;
    return {x: lerp(sg.a.x, sg.b.x, t), y: lerp(sg.a.y, sg.b.y, t)};
  };
  return {L, at, segs};
}

const RIGS = new WeakMap();
function rigOf(ctx, name, look) {
  let m = RIGS.get(ctx);
  if (!m) { m = new Map(); RIGS.set(ctx, m); }
  const key = `${name}|${JSON.stringify(look)}`;
  if (!m.has(key)) m.set(key, seatedParty(ctx, {name, look}));
  return m.get(key);
}

/**
 * Build the stage.
 * @param {any} ctx
 * @param {{P:string, p:any, looks:{a:any,b:any}, ts:number, showText:boolean, W:number, RY:number, calCols:number,
 *   plan:'documented'|'questioned', qLeg:number, noCal?:boolean}} o
 */
export function routeStage(ctx, o) {
  const th = ctx.theme;
  const {P, p, ts, showText} = o;
  const W = o.W;
  // (o.ps: people, chairs and desks drawn larger than the props — compact scenes keep readable people)
  const q = o.ps ?? 1;
  const PKq = PK * q, SEAT = -132 * PKq, TOP = -196 * PKq;
  const xA = 0, xB = W;
  const labels = p.objectLabels;
  // ---- the case file (width follows the text size; its title wraps inside)
  // the folder's reference and title are printed on the folder (o.fileText) or, when the entry prints them once in
  // its own caption, the folder carries neutral filler lines and keeps a fixed size relative to the people
  const fileText = o.fileText !== false && showText;
  let fw = fileText ? Math.max(128, ts * 6.6) : 150;
  const mkFile = () => folderArt(ctx, {prefix: `${P}-cf`, w: fw, ref: p.documents.caseFile.ref, title: p.documents.caseFile.title, ts: fileText ? ts : 22, showText: fileText});
  let file = mkFile();
  while (fileText && (file.titleFit.truncated || file.titleFit.lines.length > 5 || file.refFit.truncated) && fw < ts * 11) {
    fw += ts * 0.6;
    file = mkFile();
  }
  const fileH = file.h;
  // ---- trays
  // (a tray is never narrower than its label's widest word: a word is never split)
  const wordW = t => widestWord(t, ts);
  // (the tray's plate text box is the tray width less 2.6 text sizes: it holds the widest word with a small margin)
  let trayW = Math.max(fw + 44, showText ? Math.max(wordW(labels.outTray), wordW(labels.inTray)) + ts * 2.9 : 0);
  // (and it widens a little, up to 8 text sizes, so that its label plate keeps to two lines)
  const lblLines = w => Math.max(...[labels.outTray, labels.inTray].map(t => fitG(t, {maxWidth: w - ts * 2.6, size: ts, minSize: ts, maxLines: 8, weight: 700}).lines.length));
  for (let k = 0; showText && k < 16 && lblLines(trayW) > 2 && trayW < fw + 44 + ts * 8; k++) trayW += ts * 0.5;
  // (the label plate at the tray's far end keeps clear of the column where the party's hand holds the file's near edge)
  const oneLine0 = t => fitG(t, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width;
  const plateMax0 = t => Math.max(Math.min((fw + 44) * 0.62, oneLine0(t) + ts * 2.5), wordW(t) + ts * 2.5, oneLine0(t) / 3.3 + ts * 2.5);
  for (let k = 0; showText && k < 40 && trayW < fw + 44 + ts * 7 && Math.max(plateMax0(labels.outTray), plateMax0(labels.inTray)) > trayW / 2 + fw / 2 - 44 - ts * 0.3; k++) trayW += ts * 0.5;
  const lipH = Math.max(40, ts * 1.4 + 14);
  // (each label plate keeps to the tray's far end from its party, and no wider than its text needs, so that the
  // party's reaching arm never passes over it)
  const oneLine = t => fitG(t, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width;
  const plateMax = plateMax0;
  // (labels hidden: the plates carry filler bars of a fixed, short length — a long supplied label never sizes a blank plate)
  const lbl = t => (showText ? t : TRAY_FILLER);
  const trayA = letterTray(ctx, {prefix: `${P}-ta`, w: trayW, lipTop: -lipH, rackTop: -Math.max(lipH + 30, fileH * 0.42), label: lbl(labels.outTray), size: ts, showText, noIcon: true, plateAlign: 'end', plateMaxW: plateMax(lbl(labels.outTray))});
  const trayB = letterTray(ctx, {prefix: `${P}-tb`, w: trayW, lipTop: -lipH, rackTop: -Math.max(lipH + 30, fileH * 0.42), label: lbl(labels.inTray), size: ts, showText, noIcon: true, plateMaxW: plateMax(lbl(labels.inTray))});
  // (the tray keeps the file clear of the seated party's head: a wider file stands a little further out)
  const trx = Math.max(TRX * q, 92 * q + fw / 2);
  const xTA = xA + trx, xTB = xB - trx;
  // the file standing in a tray: bottom at the tray base; grip on the top edge of its cover
  const restY = TOP - TRAY_BASE; // file bottom
  const hangDrop = CARRIER.h / 2 + CARRIER.cord + 4; // trolley centre → file top
  const yC0 = restY - fileH - LIFT - hangDrop;      // carrier parked at the foot of each riser
  // ---- the route
  const N = p.stages.length;
  // o.flat: the track runs straight across at the carrier's height (no risers; the calendar hangs low between the
  // desks); otherwise it rises above the trays and runs across higher up the wall (the calendar hangs under it)
  const flat = Boolean(o.flat);
  const RY = flat ? yC0 : o.rise != null ? yC0 - Math.max(100, o.rise) : Math.min(o.RY, yC0 - 100); // (o.rise: risers of that height)
  const pts = flat ? [{x: xTA, y: yC0}, {x: xTB, y: yC0}] : [{x: xTA, y: yC0}, {x: xTA, y: RY}, {x: xTB, y: RY}, {x: xTB, y: yC0}];
  const poly = polyline(pts);
  const railD = roundPath(pts, 70);
  const span = xTB - xTA;
  const stopX = i => xTA + span * (i + 1) / (N + 1);
  const plateW = Math.max(ts * 5, span / (N + 1) - 24);
  const stops = p.stages.map((name, i) => stopArt(ctx, {P, i, x: stopX(i), y: RY - 10, ts, name, plateW, showText, noPlate: o.noPlates}));
  // arc positions of the stops and of the route's end
  const sV = flat ? 0 : yC0 - RY; // riser length
  const stopS = stops.map((_, i) => sV + (stopX(i) - xTA));
  const Ltot = poly.L;
  // legs: 0 = A's riser → stop 0, …, N = last stop → B's riser foot
  const legS = [0, ...stopS, Ltot];
  // ---- calendar between the risers, under the file hanging from the track
  const days = legLabels(p);
  // (the calendar keeps between the two desks, so it may hang down to the baseboard)
  const deskEndA = xTA + trayW / 2 + 26, deskEndB = xTB - trayW / 2 - 26;
  const calX0 = Math.max(xTA + fw / 2 + 24, deskEndA + 8), calX1 = Math.min(xTB - fw / 2 - 24, deskEndB - 8);
  const calTop = flat ? restY - LIFT + 30 : RY + hangDrop + fileH + 34;
  // (the calendar keeps a readable width: at most ~11 text sizes per cell, centred under the track)
  const nDays = p.stages.length + 1;
  const calCols0 = Math.max(1, Math.min(o.calCols ?? nDays, nDays));
  const calWmax = ts * 11 * calCols0;
  const calW0 = calX1 - calX0;
  const calW = Math.min(calW0, calWmax);
  const calXc = (calX0 + calX1) / 2;
  const calXa = calXc - calW / 2;
  const cols = Math.max(1, Math.min(o.calCols ?? days.length, days.length));
  const cal = o.noCal ? null : legCalendar(ctx, {prefix: `${P}-cal`, x: calXa, y: calTop, w: calW, cols, days, title: labels.calendar, ts, showText});
  const calBottom = cal ? calTop + cal.h : calTop;
  // desks end just past the trays
  const deskA = desk(ctx, {x0: xA + 58 * q, x1: xTA + trayW / 2 + 26, P: `${P}-da`, top: TOP});
  const deskB = desk(ctx, {x0: xTB - trayW / 2 - 26, x1: xB - 58 * q, P: `${P}-db`, top: TOP});
  const deskA1 = xTA + trayW / 2 + 26, deskB0 = xTB - trayW / 2 - 26;
  const calOverDesk = cal && (calXa < deskA1 || calXa + calW > deskB0);
  const calFloor = calOverDesk ? TOP - 16 : -30;
  const calClear = !cal || calBottom <= calFloor;
  // ---- people
  // (the seated rigs do not depend on the scale or the text size: built once per layout pass)
  const pa = rigOf(ctx, `${P}-pa`, o.looks.a), pb = rigOf(ctx, `${P}-pb`, o.looks.b);
  const chairA = g({transform: `${T(xA, SEAT)} scale(${r(q, 4)})`}, officeChair(ctx, {facing: 1, seatY: -SEAT / q}));
  const chairB = g({transform: `${T(xB, SEAT)} scale(${r(q, 4)})`}, officeChair(ctx, {facing: -1, seatY: -SEAT / q}));
  // rest pose → head box (static: nobody leans)
  // (at rest the near hand lies on the lap, clear of the desk, the tray and its label plate)
  const lapA = {x: xA + 52 * q, y: SEAT - 16 * q}, lapB = {x: xB - 52 * q, y: SEAT - 16 * q};
  const restA = pa.frame({x: xA, y: SEAT, facing: 1, scale: PKq, nearRest: lapA});
  const restB = pb.frame({x: xB, y: SEAT, facing: -1, scale: PKq, nearRest: lapB});
  const headBox = hd => ({x: hd.x - 62 * q, y: hd.y - 66 * q, w: 124 * q, h: 118 * q});
  const heads = [headBox(restA.head), headBox(restB.head)];
  // ---- disputed marker (questioned plan): a dashed outline around the supplied leg
  const qLeg = clamp(Math.round(o.qLeg ?? N), 0, N);
  const legPts = i => {
    const a = legS[i], b = legS[i + 1];
    const out = [];
    for (let k = 0; k <= 24; k++) out.push(poly.at(a + (b - a) * k / 24));
    return out;
  };
  const qp = legPts(qLeg);
  const qb0 = unionBox(qp.map(q => ({x: q.x, y: q.y, w: 0, h: 0})));
  const qBox = {x: qb0.x - 26, y: qb0.y - 26, w: qb0.w + 52, h: qb0.h + 52};
  // (o.markLeg: the documented plan also outlines the same leg — a SOLID outline of the same weight — so the two states
  // differ only in the outline's dashes and the ● / ◆ cue)
  const marker = o.plan === 'questioned'
    ? g({name: `${P}-qmark`, opacity: 0, 'data-disputed': 1},
      h('path', {d: roundRectPath(qBox.x, qBox.y, qBox.w, qBox.h, 22), fill: 'none', stroke: th.inkSoft, 'stroke-width': o.markW ?? 3.2, 'stroke-dasharray': o.markW ? `${r(o.markW * 3.6)} ${r(o.markW * 2.7)}` : '12 9', 'stroke-linecap': 'round'}))
    : g({name: `${P}-qmark`, opacity: 0},
      o.markLeg ? h('path', {d: roundRectPath(qBox.x, qBox.y, qBox.w, qBox.h, 22), fill: 'none', stroke: th.inkSoft, 'stroke-width': o.markW ?? 3.2, 'stroke-linecap': 'round'}) : null);
  // ---- the route's caption: a sign hanging at the top of the wall, centred over the track (labels shown)
  const stopsTop = Math.min(...stops.map(s => s.plate.y));
  const signFit = o.caption ? fitG(o.caption, {maxWidth: Math.max(ts * 8, Math.min(span + fw, ts * 22)), size: ts, minSize: ts, maxLines: 3, weight: 700}) : null;
  const signW = signFit ? signFit.width + ts * 1.4 : 0, signH = signFit ? signFit.height + ts * 0.8 : 0;
  // (in the stops' row, left of the first stop, when it fits there; else above the stops)
  const rowBottom = RY - 10 - 34 - 16 - 10;
  const leftRoom = {x0: xTA + 60, x1: Math.min(...stops.map(s2 => s2.plate.x)) - 24};
  const inRow = signFit && leftRoom.x1 - leftRoom.x0 >= signW;
  const signY = inRow ? rowBottom - signH : stopsTop - 26 - signH;
  const signX = inRow ? leftRoom.x1 - signW : (xTA + xTB) / 2 - signW / 2;
  const sign = signFit ? g({name: `${P}-sign`},
    h('path', {d: `M${r(signX + signW * 0.2)} ${r(signY)}V${r(signY - 18)}M${r(signX + signW * 0.8)} ${r(signY)}V${r(signY - 18)}`, stroke: th.metalDark, 'stroke-width': 3}),
    h('path', {d: roundRectPath(signX + 4, signY + 5, signW, signH, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(signX, signY, signW, signH, 8), fill: th.card, stroke: th.accent2, 'stroke-width': 2.6}),
    showText ? textBlock(signFit, {x: signX + signW / 2, y: signY + (signH - signFit.height) / 2, anchor: 'middle', fill: INK, name: `${P}-sign-text`}) : null) : null;
  // ---- cue badges: ● at the route's end (documented) or ◆ at the disputed marker (questioned), same art and size
  const badgeR = o.badgeR ?? Math.max(22, ts * 0.95);
  const badgeAt = o.plan === 'questioned' || o.markLeg ? {x: qBox.x + qBox.w, y: qBox.y} : {x: xTB + fw / 2 + badgeR + 10, y: yC0 - badgeR - 6};
  const badge = g({name: `${P}-cue`, opacity: 0},
    h('circle', {cx: r(badgeAt.x + 3), cy: r(badgeAt.y + 4), r: r(badgeR), fill: th.shadow}),
    h('circle', {cx: r(badgeAt.x), cy: r(badgeAt.y), r: r(badgeR), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
    g({transform: T(badgeAt.x, badgeAt.y)}, stateCue(ctx, o.plan === 'questioned' ? 'questioned' : 'documented', badgeR * 1.1, {name: `${P}-cue-mark`})));
  // ---- art layers
  const wallTop = Math.min((sign ? Math.min(signY, stopsTop) - 30 : stopsTop - 34), heads[0].y - 60);
  const x0 = xA - 90 * q, x1 = xB + 90 * q;
  const wall = backWall(ctx, {x0, x1, top: wallTop, plantX: null});
  const brackets = [];
  for (let k = 0; k <= 8; k++) {
    const x = xTA + 30 + (span - 60) * k / 8;
    brackets.push(h('path', {d: `M${r(x)} ${r(RY - 4)}V${r(RY - 26)}`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}));
  }
  const rail = g({name: `${P}-rail`},
    brackets,
    h('path', {d: railD, fill: 'none', stroke: INK, 'stroke-width': 12, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}),
    h('path', {d: railD, fill: 'none', stroke: '#b9c6cf', 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}),
    h('path', {name: `${P}-trail`, d: railD, fill: 'none', stroke: th.accent2, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${r(Ltot + 10)}`, 'data-draw': 1}),
  );
  const carrier = carrierArt(ctx, P);
  const trayAt = (tr, x) => ({
    back: g({transform: T(x, TOP)}, tr.back),
    front: g({transform: T(x, TOP)}, tr.front),
  });
  const TA = trayAt(trayA, xTA), TB = trayAt(trayB, xTB);
  const fileNode = g({name: `${P}-file`}, g({transform: T(-fw / 2, 0)}, file.node));
  // layer order: wall · calendar · rail · stops · chairs · desks · bodies · tray backs · carrier + file · tray fronts ·
  // near arms · disputed marker
  const node = g({name: P},
    g({name: `${P}-wall`}, wall),
    cal ? g({name: `${P}-calg`}, cal.node()) : null,
    rail,
    stops.map(s => s.node),
    chairA, chairB,
    deskA, deskB,
    pa.body, pb.body,
    TA.back, TB.back,
    carrier, fileNode,
    TA.front, TB.front,
    pa.near, pb.near,
    marker, badge, sign,
  );
  // ---- extents and boxes (stage units)
  const trayBox = (tr, x) => ({x: x + tr.box.x, y: TOP + tr.box.y, w: tr.box.w, h: -tr.box.y});
  const props = [
    {name: 'trayA', ...trayBox(trayA, xTA)}, {name: 'trayB', ...trayBox(trayB, xTB)},
    ...stops.map((s, i) => ({name: `stop${i}`, ...s.box})),
    ...(cal ? [{name: 'calendar', ...cal.box}] : []),
    {name: 'deskA', x: xA + 58 * q, y: TOP, w: deskA1 - xA - 58 * q, h: -TOP}, {name: 'deskB', x: deskB0, y: TOP, w: xB - 58 * q - deskB0, h: -TOP},
    // (the file's swept path: both risers and the band under the track)
    ...(flat ? [] : [{name: 'riserA', x: xTA - fw / 2 - 8, y: RY - 20, w: fw + 16, h: restY - RY + 20},
      {name: 'riserB', x: xTB - fw / 2 - 8, y: RY - 20, w: fw + 16, h: restY - RY + 20}]),
    {name: 'track', x: xTA - fw / 2 - 8, y: RY - 20, w: span + fw + 16, h: hangDrop + fileH + 30},
    {name: 'fileA', x: xTA - fw / 2, y: restY - fileH, w: fw + 8, h: fileH},
    {name: 'fileB', x: xTB - fw / 2, y: restY - fileH, w: fw + 8, h: fileH},
  ];
  const bodies = [{x: xA - 80 * q, y: heads[0].y, w: 170 * q, h: -heads[0].y}, {x: xB - 90 * q, y: heads[1].y, w: 170 * q, h: -heads[1].y}];
  // (the extent stops 16 below the floor line: the lower floor boards may run under the chips' band)
  const ext = {x: x0, y: wallTop, w: x1 - x0, h: (o.floorExt ?? 16) - wallTop}; // (floorExt 48: the whole floor band)
  const texts = [...stops.map(s => s.plate), ...(cal ? [cal.box] : []), ...(signFit ? [{x: signX, y: signY, w: signW, h: signH}] : [])];
  props.push({name: 'badge', x: badgeAt.x - badgeR, y: badgeAt.y - badgeR, w: 2 * badgeR, h: 2 * badgeR});
  const problems = [];
  if (!calClear) problems.push('cal-floor');
  if (calW < ts * (o.calMin ?? 4)) problems.push('cal-narrow');
  if (stops.some(s => s.fit.truncated)) problems.push('stop-trunc');
  if (cal && showText && (cal.dayFits.some(f => f.truncated) || cal.split || cal.titleFit.truncated)) problems.push('cal-trunc');
  if (fileText && (file.titleFit.truncated || file.refFit.truncated)) problems.push('file-trunc');
  // stop plates keep apart
  if (!o.noPlates) for (let i = 1; i < stops.length; i++) if (hit(stops[i - 1].plate, stops[i].plate, 8)) problems.push('stop-overlap');
  if (signFit && signFit.truncated) problems.push('sign-trunc');
  if (showText && Math.max(plateMax0(labels.outTray), plateMax0(labels.inTray)) > trayW / 2 + fw / 2 - 44 - ts * 0.3 + 0.5) problems.push('arm-plate');
  if (showText && (trayA.fit.lines.length > 4 || trayB.fit.lines.length > 4 || trayA.fit.truncated || trayB.fit.truncated)) problems.push('tray-label');
  // the file hanging from the track keeps clear of the risers' parties' heads (it runs between them)
  if (xTA - fw / 2 < heads[0].x + heads[0].w + 10 || xTB + fw / 2 > heads[1].x - 10) problems.push('file-head');

  // ---- choreography
  const WIN = {reachA: [0, 0.07], liftA: [0.07, 0.13], letA: [0.13, 0.18], travel: [0.19, 0.84], reachB: [0.84, 0.89], lowerB: [0.89, 0.94], letB: [0.94, 1]};
  const DWELL = 0.035;
  // travel clock → arc position with a dwell at each stop
  const nMove = N + 1, moveT = (WIN.travel[1] - WIN.travel[0] - DWELL * N);
  const legLen = legS.slice(1).map((s, i) => s - legS[i]);
  const totL = Ltot;
  const arcAt = c => {
    let t = c - WIN.travel[0];
    if (t <= 0) return {s: 0, leg: 0, dwell: -1};
    for (let i = 0; i < nMove; i++) {
      const dur = moveT * legLen[i] / totL;
      if (t <= dur) return {s: legS[i] + legLen[i] * ease.inOutSine(t / dur), leg: i, dwell: -1};
      t -= dur;
      if (i < N) { if (t <= DWELL) return {s: legS[i + 1], leg: i + 1, dwell: i}; t -= DWELL; }
    }
    return {s: totL, leg: N + 1, dwell: -1};
  };
  // the arc position where leg i completes (for the lamps and the calendar)
  const legDoneAt = i => { // clock at which leg i ends
    let t = WIN.travel[0];
    for (let k = 0; k <= i; k++) { t += moveT * legLen[k] / totL; if (k < i) t += DWELL; }
    return t;
  };
  const gripOf = fileBottom => ({x: 0, y: fileBottom - fileH + 16});
  function frame(c, opt = {}) {
    const nodes = {};
    const reachA = ease.inOutSine(seg(c, ...WIN.reachA)), liftA = ease.inOutSine(seg(c, ...WIN.liftA)), letA = ease.inOutSine(seg(c, ...WIN.letA));
    const reachB = ease.inOutSine(seg(c, ...WIN.reachB)), lowerB = ease.inOutSine(seg(c, ...WIN.lowerB)), letB = ease.inOutSine(seg(c, ...WIN.letB));
    const arc = arcAt(c);
    const onRoute = c >= WIN.travel[0] && c < WIN.travel[1];
    // carrier position
    const car = c < WIN.travel[0] ? pts[0] : c >= WIN.travel[1] ? pts[pts.length - 1] : poly.at(arc.s);
    let fileBottom, fileX, holder;
    if (c < WIN.liftA[0]) { fileX = xTA; fileBottom = restY; holder = 'trayA'; }
    else if (c < WIN.travel[0]) { fileX = xTA; fileBottom = restY - LIFT * liftA; holder = liftA < 1 ? 'handA' : 'clip'; }
    else if (c < WIN.lowerB[0]) { fileX = car.x; fileBottom = car.y + hangDrop + fileH; holder = c < WIN.travel[1] ? 'clip' : 'clip'; }
    else { fileX = xTB; fileBottom = restY - LIFT * (1 - lowerB); holder = lowerB < 1 ? 'handB' : 'trayB'; }
    if (c >= WIN.letB[1] - 1e-9 || (c >= WIN.lowerB[1])) holder = 'trayB';
    const docAt = c < WIN.travel[0] ? 'A' : c < WIN.travel[1] ? 'route' : 'B';
    // hands: A holds the grip while reaching / lifting, then returns; B likewise at the end
    // (each party holds the file by its near edge, a little above the middle)
    const gripA = {x: xTA - fw / 2 + 12, y: (c < WIN.liftA[0] ? restY : restY - LIFT * liftA) - fileH * 0.58};
    const gripB = {x: xTB + fw / 2 - 4, y: (c < WIN.lowerB[0] ? restY - LIFT : restY - LIFT * (1 - lowerB)) - fileH * 0.58};
    const restHandA = restA.hands.near, restHandB = restB.hands.near;
    const wA = c < WIN.letA[0] ? reachA : 1 - letA;
    const wB = c < WIN.letB[0] ? reachB : 1 - letB;
    const handA = {x: lerp(restHandA.x, gripA.x, wA), y: lerp(restHandA.y, gripA.y, wA)};
    const handB = {x: lerp(restHandB.x, gripB.x, wB), y: lerp(restHandB.y, gripB.y, wB)};
    const fa = pa.frame({x: xA, y: SEAT, facing: 1, scale: PKq, near: wA > 0 ? handA : null, nearRest: lapA});
    const fb = pb.frame({x: xB, y: SEAT, facing: -1, scale: PKq, near: wB > 0 ? handB : null, nearRest: lapB});
    Object.assign(nodes, fa.nodes, fb.nodes);
    nodes[`${P}-carrier`] = {transform: T(r(car.x, 2), r(car.y, 2))};
    nodes[`${P}-file`] = {transform: T(r(fileX, 2), r(fileBottom, 2))};
    // travelled part of the track (neutral accent), lamps and calendar cells
    const sDone = c < WIN.travel[0] ? 0 : c >= WIN.travel[1] ? totL : arc.s;
    nodes[`${P}-trail`] = {'stroke-dasharray': `${r(sDone, 1)} ${r(totL + 10, 1)}`};
    const lamps = stops.map((_, i) => r(seg(c, legDoneAt(i) - 0.012, legDoneAt(i) + 0.004), 3));
    lamps.forEach((v, i) => { nodes[`${P}-lamp${i}`] = {opacity: v}; });
    let legsDone = 0;
    for (let i = 0; i <= N; i++) if (c >= legDoneAt(i)) legsDone = i + 1;
    if (cal) {
      const n = days.length, each = 1 / (n * 0.7 + 0.3);
      const openAt = i => i * each * 0.7 + each * 0.3 + 1e-6;
      // calendar cell i unfolds as leg i completes (0.03 of the clock)
      let open = 0;
      for (let i = 0; i <= N; i++) {
        const q = seg(c, legDoneAt(i) - 0.005, legDoneAt(i) + 0.03);
        // (cells 0..i open, cell i's date label faded in; the next cell has not started)
        const target = i === N ? 1 : openAt(i) + each * 0.26;
        if (q > 0) open = lerp(i ? openAt(i - 1) + each * 0.26 : 0, target, q);
      }
      Object.assign(nodes, cal.frame(Math.min(1, open)).nodes);
    }
    const qm = opt.marker ?? 0;
    nodes[`${P}-qmark`] = {opacity: r(o.plan === 'questioned' || o.markLeg ? qm : 0, 3)};
    nodes[`${P}-cue`] = {opacity: r(opt.cue ?? qm, 3)};
    return {
      nodes,
      s: {
        docAt, holder, legsDone, onRoute,
        file: {x: fileX, y: fileBottom - fileH / 2}, fileGrip: holder === 'handB' || c >= WIN.reachB[0] ? gripB : gripA,
        handA: fa.hands.near, handB: fb.hands.near, carrier: car,
        allReached: fa.reached && fb.reached,
        lamps,
      },
    };
  }
  return {
    node, frame, props, heads, bodies, ext, texts, problems, WIN,
    geo: {xA, xB, xTA, xTB, RY, yC0, fw, fileH, restY, trayW, pts, legS, stopS, stopX, span, calX0, calX1, calTop, calBottom, qBox, qLeg, N, Ltot, deskA1, deskB0, heads, badgeAt, badgeR},
    trays: {a: trayA, b: trayB}, stops, cal, file,
    anchors: {
      sent: {x: xTA, y: RY + (yC0 - RY) * 0.45},
      delivered: {x: xTB, y: TOP - 6},
      route: {x: (xTA + xTB) / 2, y: RY + 6},
      outcome: {x: qBox.x + qBox.w / 2, y: qBox.y},
      file: {x: xTB, y: restY - fileH * 0.6},
      calendar: cal ? {x: (calX0 + calX1) / 2, y: calTop} : {x: (xTA + xTB) / 2, y: RY},
      partyA: {x: xA, y: 20}, partyB: {x: xB, y: 20},
    },
  };
}

/* ======================================================================== */
/* Layout helpers                                                            */
/* ======================================================================== */

/** Text sizes (px at 1080p) tried from large to small; >= 19.8 preferred (baseline floor 19.5). */
export const SIZES = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6];

/** px at 1080p per design unit. */
export function pxPerUnit(ctx) {
  return Math.min(ctx.view.content.w / ctx.design.w, ctx.view.content.h / ctx.design.h) * 1080 / Math.min(ctx.view.width, ctx.view.height);
}

/**
 * Free-space placement of a chip near an anchor: candidates on rings around the anchor, the chip wholly inside
 * `bounds`, clear of every occupied box; the leader (chip edge → anchor) at most maxLead and crossing no occupied box
 * (except the one holding the anchor). Returns the best candidate (clear first, then shortest leader).
 */
export function placeNear(o) {
  const {w, h: hh, A, bounds, occupied} = o;
  const maxLead = o.maxLead ?? 34;
  const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  const nearest = b => ({x: clamp(A.x, b.x, b.x + b.w), y: clamp(A.y, b.y, b.y + b.h)});
  const inB = (pt, z) => pt.x > z.x + 1 && pt.x < z.x + z.w - 1 && pt.y > z.y + 1 && pt.y < z.y + z.h - 1;
  let best = null;
  for (let d = o.minLead ?? 6; d <= maxLead + 1e-6; d += 4) {
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2 + (o.phase ?? 0);
      const cx = A.x + Math.cos(a) * (d + w / 2 * Math.abs(Math.cos(a)));
      const cy = A.y + Math.sin(a) * (d + hh / 2);
      const b = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
      const q = nearest(b);
      const lead = Math.hypot(q.x - A.x, q.y - A.y);
      if (lead > maxLead + 0.5) continue;
      if (!inside(b)) continue;
      const bad = occupied.filter(z => hit(b, z, o.pad ?? 6)).length + occupied.filter(z => !inB(A, z) && [0.2, 0.4, 0.6, 0.8].some(t => inB({x: q.x + (A.x - q.x) * t, y: q.y + (A.y - q.y) * t}, z))).length;
      const score = bad * 1000 + lead;
      if (!best || score < best.score) best = {b, q, lead, score, clear: bad === 0};
    }
    if (best && best.clear) break;
  }
  return best;
}

/** A tag: a cue chip with a thin solid leader to its anchor dot (a guide, not an arrow; dashes are kept for the disputed marker). */
export function tagNode(ctx, o) {
  const th = ctx.theme;
  const {chip, at, A, name} = o;
  const q = {x: clamp(A.x, at.x, at.x + chip.w), y: clamp(A.y, at.y, at.y + chip.h)};
  const lead = Math.hypot(q.x - A.x, q.y - A.y);
  return g({name, opacity: 0},
    lead > 3 ? h('path', {name: `${name}-lead`, d: `M${r(q.x)} ${r(q.y)}L${r(A.x)} ${r(A.y)}`, stroke: o.color ?? th.accent2, 'stroke-width': 2.5, 'stroke-linecap': 'round'}) : null,
    h('circle', {name: `${name}-dot`, cx: r(A.x), cy: r(A.y), r: 5.5, fill: o.color ?? th.accent2, stroke: th.card, 'stroke-width': 2}),
    chip.node(at.x, at.y));
}

export {glue, fitG};
export const clamp01 = v => clamp(v, 0, 1);
export {shade, oneOf};

/* ======================================================================== */
/* Mechanism parts (LAW-0254) and small legend helpers                       */
/* ======================================================================== */

/**
 * The route on its own (a component of the exploded mechanism): a straight wall track with its supplied stops (box,
 * neutral lamp, name plate). Template units; origin = the track's left end. Returns the node, its box, the stop and
 * leg boxes and the lamp names.
 */
export function routeArt(ctx, o) {
  const th = ctx.theme;
  const {P, len, ts, stages, showText} = o;
  const N = stages.length;
  const plateW = Math.max(ts * 5, len / (N + 1) - 20);
  const stops = stages.map((name, i) => stopArt(ctx, {P, i, x: (len * (i + 1)) / (N + 1), y: -10, ts, name, plateW, showText}));
  const top = Math.min(...stops.map(s => s.plate.y));
  const brackets = [];
  for (let k = 0; k <= 6; k++) brackets.push(h('path', {d: `M${r(20 + (len - 40) * k / 6)} -4V-22`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}));
  const node = g({name: `${P}-route`},
    brackets,
    h('path', {d: `M0 0H${r(len)}`, stroke: INK, 'stroke-width': 12, 'stroke-linecap': 'round'}),
    h('path', {d: `M0 0H${r(len)}`, stroke: '#b9c6cf', 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {name: `${P}-trail`, d: `M0 0H${r(len)}`, stroke: th.accent2, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${r(len + 10)}`, 'data-draw': 1}),
    h('circle', {cx: 0, cy: 0, r: 10, fill: th.card, stroke: INK, 'stroke-width': 3}),
    h('circle', {cx: r(len), cy: 0, r: 10, fill: th.card, stroke: INK, 'stroke-width': 3}),
    stops.map(s => s.node));
  const stopXs = stops.map((_, i) => (len * (i + 1)) / (N + 1));
  const legX = [0, ...stopXs, len];
  const legBox = i => ({x: legX[i] - 14, y: -30, w: legX[i + 1] - legX[i] + 28, h: 50});
  const problems = [];
  if (stops.some(s => s.fit.truncated)) problems.push('stop-trunc');
  for (let i = 1; i < stops.length; i++) if (hit(stops[i - 1].plate, stops[i].plate, 8)) problems.push('stop-overlap');
  return {node, box: {x: -14, y: top - 4, w: len + 28, h: -top + 24}, stops, stopXs, legX, legBox, problems, plates: stops.map(s => s.plate), N};
}

/**
 * The route running DOWN the page (tall frames): a vertical wall track with its stops; each stop's box sits on the
 * track and its name plate to the LEFT of it (text stays horizontal). Template units; origin = the track's top end.
 */
export function routeArtV(ctx, o) {
  const th = ctx.theme;
  const {P, len, ts, stages, showText} = o;
  const N = stages.length;
  const plateW = o.plateW ?? ts * 7;
  const stopYs = stages.map((_, i) => (len * (i + 1)) / (N + 1));
  const stops = stages.map((name0, i) => {
    const name = showText ? name0 : STOP_FILLER;
    const y = stopYs[i];
    const widest = Math.max(...glue(name).split(' ').filter(Boolean).map(t => fitG(t, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width));
    const fit = fitG(name, {maxWidth: Math.max(plateW - ts, widest + 2), size: ts, minSize: ts, maxLines: 5, weight: 700});
    const pw = fit.width + ts, ph = fit.height + ts * 0.7;
    const bw = 34, bh = Math.max(56, ts * 2.4);
    const px = -bw / 2 - 12 - pw;
    const node = g({name: `${P}-stop${i}`},
      h('path', {d: roundRectPath(-bw / 2 + 4, y - bh / 2 + 5, bw, bh, 8), fill: th.shadow}),
      h('path', {d: roundRectPath(-bw / 2, y - bh / 2, bw, bh, 8), fill: '#c9d4dc', stroke: INK, 'stroke-width': 2.4}),
      h('circle', {cx: 0, cy: r(y), r: 11, fill: th.paper, stroke: INK, 'stroke-width': 2}),
      h('circle', {name: `${P}-lamp${i}`, cx: 0, cy: r(y), r: 11, fill: th.accent2, stroke: INK, 'stroke-width': 2, opacity: 0}),
      h('path', {d: roundRectPath(px + 4, y - ph / 2 + 5, pw, ph, 6), fill: th.shadow}),
      h('path', {d: roundRectPath(px, y - ph / 2, pw, ph, 6), fill: th.paper, stroke: INK, 'stroke-width': 2}),
      showText ? textBlock(fit, {x: px + pw / 2, y: y - fit.height / 2, anchor: 'middle', fill: INK, name: `${P}-stop${i}-name`})
        : h('rect', {'data-bar': 1, x: r(px + pw * 0.2), y: r(y - ts * 0.18), width: r(pw * 0.6), height: r(ts * 0.36), rx: r(ts * 0.18), fill: th.paperLine}));
    return {node, fit, plate: {x: px, y: y - ph / 2, w: pw, h: ph}};
  });
  const brackets = [];
  for (let k = 0; k <= 6; k++) brackets.push(h('path', {d: `M4 ${r(20 + (len - 40) * k / 6)}H22`, stroke: th.metalDark, 'stroke-width': 5, 'stroke-linecap': 'round'}));
  const node = g({name: `${P}-route`},
    brackets,
    h('path', {d: `M0 0V${r(len)}`, stroke: INK, 'stroke-width': 12, 'stroke-linecap': 'round'}),
    h('path', {d: `M0 0V${r(len)}`, stroke: '#b9c6cf', 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {name: `${P}-trail`, d: `M0 0V${r(len)}`, stroke: th.accent2, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': `0 ${r(len + 10)}`, 'data-draw': 1}),
    h('circle', {cx: 0, cy: 0, r: 10, fill: th.card, stroke: INK, 'stroke-width': 3}),
    h('circle', {cx: 0, cy: r(len), r: 10, fill: th.card, stroke: INK, 'stroke-width': 3}),
    stops.map(s2 => s2.node));
  const left = Math.min(-30, ...stops.map(s2 => s2.plate.x));
  const legX = [0, ...stopYs, len];
  const legBox = i => ({x: -30, y: legX[i] - 14, w: 60, h: legX[i + 1] - legX[i] + 28});
  const problems = [];
  if (stops.some(s2 => s2.fit.truncated)) problems.push('stop-trunc');
  for (let i = 1; i < stops.length; i++) if (hit(stops[i - 1].plate, stops[i].plate, 8)) problems.push('stop-overlap');
  return {node, box: {x: left - 4, y: -14, w: -left + 4 + 30, h: len + 28}, stops, stopXs: stopYs, legX, legBox, problems, plates: stops.map(s2 => s2.plate), N, vertical: true};
}

/** A tray standing on a short stand (the mechanism's out-tray / in-tray component). Origin = base centre. */
export function trayPart(ctx, o) {
  const th = ctx.theme;
  const {P, w, ts, showText, plateAlign} = o;
  const label = showText ? o.label : TRAY_FILLER;
  const lipH = Math.max(40, ts * 1.4 + 14);
  const oneLine = fitG(label, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width;
  const tray = letterTray(ctx, {prefix: P, w, lipTop: -lipH, rackTop: -Math.max(lipH + 30, o.rack ?? 70), label, size: ts, showText, noIcon: true, plateAlign, plateMaxW: Math.max(Math.min(w * 0.9, oneLine + ts * 2.5), oneLine / 2.6 + ts * 2.5, widestWord(label, ts) + ts * 2.5)});
  const plateBottom = tray.plate.y + tray.plate.h;
  const standH = Math.max(26, plateBottom + 16);
  const node = g({name: `${P}-part`},
    h('path', {d: roundRectPath(-w * 0.34, 0, w * 0.68, standH, 8), fill: th.woodTop, stroke: INK, 'stroke-width': 2.4}),
    tray.back, tray.front);
  return {node, tray, box: {x: -w / 2 - 6, y: -Math.max(lipH + 30, o.rack ?? 70), w: w + 12, h: Math.max(lipH + 30, o.rack ?? 70) + standH}, lipH, problems: tray.fit.truncated ? ['tray-trunc'] : []};
}

/** Width of the widest glued word of a label at text size ts (bold): a box narrower than this would split a word. */
export function widestWord(t, ts) {
  // (a lone separator — "·", "/", "–" — travels with the word after it: "· Parte B" is one unit when wrapping)
  const units = [];
  for (const q of glue(t).split(' ').filter(Boolean)) {
    if (units.length && /^[·/–—-]$/.test(units[units.length - 1])) units[units.length - 1] += ' ' + q; else units.push(q);
  }
  return Math.max(0, ...units.map(q => fitG(q, {maxWidth: 1e5, size: ts, minSize: ts, maxLines: 1, weight: 700}).width));
}

/** Line glyph for a legend row: plain relation, communication (accent line) or sequence (solid start, hollow end). */
export function lineGlyph(ctx, kind, w) {
  const th = ctx.theme;
  const col = kind === 'communication' ? th.accent2 : th.ink;
  return g(null,
    h('line', {x1: 0, y1: 0, x2: r(w), y2: 0, stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: 0, r: 6, fill: col}),
    h('circle', {cx: r(w), cy: 0, r: 6, fill: kind === 'sequence' ? th.card : col, stroke: col, 'stroke-width': 3}));
}

/** A legend row: a glyph (node at its left-centre, glyph width gw) and whole-word text. */
export function legendRow(ctx, o) {
  const th = ctx.theme;
  const {F, gw} = o;
  const fit = fitG(o.text, {maxWidth: Math.max(F * 3, o.maxWidth - gw - F * 0.6), size: F, minSize: F, maxLines: o.maxLines ?? 4, weight: o.weight ?? 600});
  const hh = Math.max(fit.height, F * 1.2);
  return {w: gw + F * 0.6 + fit.width, h: hh, fit, node: (x, y) => g({name: o.name, opacity: o.opacity},
    g({transform: T(x, y + hh / 2)}, o.glyph),
    textBlock(fit, {x: x + gw + F * 0.6, y: y + (hh - fit.height) / 2, fill: th.ink, name: o.name && `${o.name}-text`}))};
}

/** Pack items ({w,h}) into rows within width W (gap g); returns rows with x offsets and the total height. */
export function packRows(items, W, gap) {
  const rows = [];
  for (const it of items) {
    const row = rows[rows.length - 1];
    if (row && row.w + gap + it.w <= W) { row.items.push(it); row.w += gap + it.w; row.h = Math.max(row.h, it.h); }
    else rows.push({items: [it], w: it.w, h: it.h});
  }
  return {rows, height: rows.reduce((a, b) => a + b.h, 0) + gap * Math.max(0, rows.length - 1)};
}

/**
 * The legs' calendar as a stand-alone part (centred on its origin). frame(legsF): legsF legs completed, fractional
 * while a cell unfolds (cell i opens as leg i completes; its date label fades in once the cell is open).
 */
export function legCalendarPart(ctx, o) {
  const cal = legCalendar(ctx, {prefix: o.P, x: 0, y: 0, w: o.w, cols: o.cols, days: o.days, title: o.title, ts: o.ts, showText: o.showText, noTitle: o.noTitle});
  const n = o.days.length, each = 1 / (n * 0.7 + 0.3);
  const target = i => (i < 0 ? 0 : i >= n - 1 ? 1 : i * each * 0.7 + each * 0.3 + 1e-6 + each * 0.26);
  const dx = -o.w / 2, dy = -cal.h / 2;
  const problems = [];
  if (cal.dayFits.some(f => f.truncated) || cal.split || (!o.noTitle && cal.titleFit.truncated)) problems.push('cal-trunc');
  return {
    node: g({transform: T(dx, dy)}, cal.node()),
    box: {x: dx, y: dy + cal.box.y, w: o.w, h: cal.box.h},
    frame(legsF) {
      const i = Math.floor(clamp(legsF, 0, n)), f = clamp(legsF, 0, n) - i;
      const open = i >= n ? 1 : lerp(target(i - 1), target(i), f);
      return cal.frame(open).nodes;
    },
    problems, cal,
  };
}

/** The case-file folder as a stand-alone part with filler lines (centred on its origin). */
export function folderPart(ctx, o) {
  const f = folderArt(ctx, {prefix: o.P, w: o.w, ref: '', title: '', ts: 22, showText: false});
  return {node: g({name: `${o.P}-part`, transform: T(-o.w / 2, f.h / 2)}, f.node), box: {x: -o.w / 2, y: -f.h / 2, w: o.w + 8, h: f.h}};
}
