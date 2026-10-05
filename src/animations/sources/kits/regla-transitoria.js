/**
 * Band-desk kit for the "Regla transitoria" motif (LAW-0157..0160).
 *
 * Top-down desk (original vector art):
 *   two BOUND VERSIONS of a fictional text ("Version 1 / Version 2 (fictional)")
 *   lie at the two ends of a wooden TIMELINE RULER graduated in fictional
 *   relative days · between them runs the TRANSITIONAL BAND, a paper strip
 *   printed with the supplied passage (its upper ribbon) over a plain lane:
 *   it is unrolled from under version 1 and tucked under version 2, so it
 *   bridges the two versions · a movable MILESTONE POST is planted into the
 *   lane at the supplied relative day, through the eyelet of a paper tag
 *   ("Day 20 (supplied milestone)") · CASE cards are dealt from a tray and
 *   slid to their supplied day; each is pinned to the ruler by a thread, so
 *   it lies left (before) or right (after) of the post · an editable
 *   hierarchy rack lists the user-supplied levels and marks the level of
 *   each version with its spine colour · an attributed reading note.
 *
 * Content rules encoded here:
 *  - every text is a fictional placeholder; jurisdiction unspecified;
 *  - the milestone is SUPPLIED; the scene only compares a case's supplied day
 *    with it: day < milestone = "before the supplied milestone", day >
 *    milestone = "after the supplied milestone", equal = "on the supplied
 *    milestone". It never says which version applies, what the transitional
 *    provision does, or any outcome (the neutral key says so);
 *  - the hierarchy is only the order the author supplies; it implies nothing;
 *  - readings are attributed to their fictional source, never endorsed;
 *  - side colours are neutral (amber hatch / blue dots), never a verdict.
 *
 * The kit owns geometry, art and the pose solver only; each entry owns its
 * own timeline, layout of editorial labels and semantics.
 * @module animations/sources/kits/regla-transitoria
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath, cubic} from '../../../core/geometry.js';
import {topArm, deskWindow} from '../../../primitives/desk.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, int, list, obj, oneOf} from '../../../schemas/fields.js';
import {fitWords, fitInBox, factIcon, readingNote, relax1d, overlaps} from './ambito-temporal.js';

export {overlaps};

/* ------------------------------------------------------------------------ */
/* Fields                                                                   */
/* ------------------------------------------------------------------------ */

export const CASE_ICONS = ['envelope', 'parcel', 'key', 'invoice', 'meeting'];

/** Category fields for "sources", specialised for the transitional-rule motif. */
export const transitionFields = {
  sources: list('The two bound versions of the fictional text, in this order: the earlier version (left end of the ruler) and the later version (right end)', obj('Version', {
    label: str('Title printed on the version (fictional), e.g. "Version 1 (fictional)"', 60),
    level: int('Index of the user-supplied hierarchy level the version is listed on (0 = first level)', 0, 2),
  }, ['label']), 2, 2),
  hierarchy: list('Labels of the editable hierarchy levels in the order the author supplies them. Neutral placeholders by default: no ordering rule is implied.', str('Level label', 50), 1, 3),
  passages: list('The transitional passage printed on the band (simulated wording, fictional)', obj('Passage', {
    ref: str('Reference printed on the band, e.g. "Transitional provision (fictional)"', 60),
    text: str('Simulated wording printed on the band', 100),
  }, ['ref']), 1, 1),
  interpretations: list('Readings attributed to their fictional source; shown as attributed notes, never endorsed', obj('Reading', {
    by: str('Who proposes the reading (fictional)', 50),
    text: str('The reading as proposed (fictional wording)', 90),
  }, ['by', 'text']), 0, 1),
  timeline: obj('Relative time scale printed on the ruler (fictional units; no real dates)', {
    unit: str('Unit word printed before numbers, e.g. "Day"', 16),
    from: int('First unit on the ruler', -99, 999),
    to: int('Last unit on the ruler (greater than "from"; at most 120 units are drawn)', -98, 1000),
  }, ['unit', 'from', 'to']),
  milestone: obj('The configurable milestone supplied by the author (a fictional relative day). The scene never computes or corrects it.', {
    day: int('Supplied milestone day (same unit as the ruler)', -99, 1000),
    label: str('Words printed after the day on the milestone tag, e.g. "supplied milestone"', 40),
  }, ['day', 'label']),
  cases: list('Cases (fictional) with their supplied day. The card is only placed before / after / on the supplied milestone by comparing days.', obj('Case', {
    label: str('Short description (fictional)', 60),
    day: int('Supplied day (same unit as the ruler)', -99, 1000),
    icon: oneOf('Icon printed on the case card', CASE_ICONS),
  }, ['label', 'day']), 1, 4),
};

/** Default category values (English, fictional, illustrative). */
export const RT_DEFAULTS = {
  sources: [{label: 'Version 1 (fictional)', level: 0}, {label: 'Version 2 (fictional)', level: 0}],
  hierarchy: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'],
  passages: [{ref: 'Transitional provision (fictional)', text: 'Simulated wording of a fictional transitional provision.'}],
  interpretations: [{by: 'Commentary C (fictional)', text: 'Proposes a reading of the transitional wording.'}],
  timeline: {unit: 'Day', from: 0, to: 40},
  milestone: {day: 20, label: 'supplied milestone'},
  cases: [
    {label: 'Case 1 · notice sent', day: 9, icon: 'envelope'},
    {label: 'Case 2 · goods delivered', day: 16, icon: 'parcel'},
    {label: 'Case 3 · keys handed over', day: 29, icon: 'key'},
  ],
};

/** Spanish counterparts. */
export const RT_DEFAULTS_ES = {
  sources: [{label: 'Versión 1 (ficticia)', level: 0}, {label: 'Versión 2 (ficticia)', level: 0}],
  hierarchy: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)'],
  passages: [{ref: 'Disposición transitoria (ficticia)', text: 'Redacción simulada de una disposición transitoria ficticia.'}],
  interpretations: [{by: 'Comentario C (ficticio)', text: 'Propone una lectura de la redacción transitoria.'}],
  timeline: {unit: 'Día', from: 0, to: 40},
  milestone: {day: 20, label: 'hito aportado'},
  cases: [
    {label: 'Supuesto 1 · aviso enviado', day: 9, icon: 'envelope'},
    {label: 'Supuesto 2 · mercancía entregada', day: 16, icon: 'parcel'},
    {label: 'Supuesto 3 · llaves entregadas', day: 29, icon: 'key'},
  ],
};

/** Long-labels stress counterparts (every field at least as long as the baseline, near-maximum counts). */
export const RT_LONG = {
  sources: [{label: 'Version 1 of the Fictional Delivery Code (earlier)', level: 0}, {label: 'Version 2 of the Fictional Delivery Code (later)', level: 1}],
  hierarchy: ['First level as supplied by the author', 'Second level as supplied by the author', 'Third level as supplied by the author'],
  passages: [{ref: 'Transitional provision 1, paragraph 2 (fictional)', text: 'Simulated wording of a fictional transitional provision that the author supplies for this example.'}],
  interpretations: [{by: 'Commentary C, second fictional edition', text: 'Proposes a reading of the transitional wording for cases near the supplied milestone.'}],
  timeline: {unit: 'Day', from: 0, to: 40},
  milestone: {day: 20, label: 'milestone supplied by the author'},
  cases: [
    {label: 'Case 1 · written notice sent to the other party by post', day: 6, icon: 'envelope'},
    {label: 'Case 2 · goods delivered to the warehouse loading dock', day: 15, icon: 'parcel'},
    {label: 'Case 3 · keys to the storage unit handed over', day: 27, icon: 'key'},
    {label: 'Case 4 · invoice issued for the delivered goods', day: 35, icon: 'invoice'},
  ],
};

/** Built-in strings (user content is never translated). */
export const RT_STRINGS = {
  en: {
    before: 'Before the supplied milestone',
    after: 'After the supplied milestone',
    on: 'On the supplied milestone',
    key: 'Positions as supplied · no conclusion drawn on which version applies',
    readingProposed: 'Reading proposed',
    byWord: 'by',
    statePlaced: 'Cases placed before / after the supplied milestone',
    stateMilestone: 'Milestone set · cases not yet placed',
    stateBand: 'Band laid · no milestone set yet',
  },
  es: {
    before: 'Antes del hito aportado',
    after: 'Después del hito aportado',
    on: 'En el hito aportado',
    key: 'Posiciones según lo aportado · sin conclusión sobre qué versión se aplica',
    readingProposed: 'Lectura propuesta',
    byWord: 'por',
    statePlaced: 'Supuestos colocados antes / después del hito aportado',
    stateMilestone: 'Hito fijado · supuestos aún sin colocar',
    stateBand: 'Franja tendida · sin hito todavía',
  },
};

/* ------------------------------------------------------------------------ */
/* Data                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * Position-only side of a case against the supplied milestone.
 * @returns {'before'|'after'|'on'}
 */
export function caseSide(day, milestone) {
  return day < milestone ? 'before' : day > milestone ? 'after' : 'on';
}

/**
 * Normalised data: ruler range, clamped milestone and case days, sides.
 * Nothing is inferred beyond the supplied numbers.
 * @param {any} p validated params
 * @param {{milestone?:number, caseDays?:number[]}} [over] substitute data (contrast / inspect)
 */
export function rtData(p, over = {}) {
  let from = p.timeline.from;
  let to = p.timeline.to;
  if (to <= from) to = from + 1;
  if (to - from > 120) to = from + 120;
  const cl = v => Math.max(from, Math.min(to, v));
  const mDay = cl(over.milestone ?? p.milestone.day);
  const unit = p.timeline.unit;
  const dayText = v => (unit ? `${unit} ${v}` : `${v}`);
  const cases = p.cases.map((c, i) => {
    const day = cl(over.caseDays && over.caseDays[i] !== undefined ? over.caseDays[i] : c.day);
    return {i, label: c.label, day, icon: c.icon || CASE_ICONS[i % CASE_ICONS.length], side: caseSide(day, mDay)};
  });
  const nLevels = p.hierarchy.length;
  return {
    from, to, unit, cl,
    milestone: mDay,
    milestoneLabel: p.milestone.label,
    milestoneText: v => `${dayText(v)} (${p.milestone.label})`,
    dayText,
    cases,
    versions: p.sources.map((s, i) => ({label: s.label, level: Math.max(0, Math.min(nLevels - 1, s.level ?? 0)), i})),
    levels: p.hierarchy,
    passage: p.passages[0],
    readings: p.interpretations || [],
  };
}

/* ------------------------------------------------------------------------ */
/* Scale & colours                                                          */
/* ------------------------------------------------------------------------ */

/**
 * Place a stage (W×H design units) in the design space and report the
 * frame pixels per stage unit at 1080p (the scale the text audit uses).
 */
export function stageFit(ctx, W, H) {
  const s = Math.min(ctx.design.w / W, ctx.design.h / H);
  const c = ctx.view.content;
  const fit = Math.min(c.w / ctx.design.w, c.h / ctx.design.h);
  const k = 1080 / Math.min(ctx.view.width, ctx.view.height);
  return {s, ox: (ctx.design.w - W * s) / 2, oy: (ctx.design.h - H * s) / 2, pxu: s * fit * k};
}

/** Frame pixels per design unit at 1080p for the whole design space (before a stage is placed). */
export function designPx(ctx) {
  const c = ctx.view.content;
  return Math.min(c.w / ctx.design.w, c.h / ctx.design.h) * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

/** Neutral side colours (never a verdict palette). */
export function sideColors(ctx) {
  const th = ctx.theme;
  return {
    before: shade(th.accent3, -0.28),
    beforeSoft: th.accent3Soft,
    beforeMid: th.accent3,
    after: th.accent2,
    afterSoft: th.accent2Soft,
    on: th.inkSoft,
    onSoft: '#e6e2da',
    neutral: th.metal,
  };
}

export const RULER_WOOD = '#e2c48f';
export const BOOK_COLORS = ['#2f5d62', '#7a3b3b'];
export const RIBBON = '#fbf5e6';
export const LANE = '#ece2cb';

/** Hatch (before) and dot (after) patterns, instance-scoped. */
export function sidePatterns(ctx, P) {
  const C = sideColors(ctx);
  const hid = `${P}-hatch`, did = `${P}-dots`;
  const defs = h('defs', null,
    h('pattern', {id: ctx.id(hid), width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)'},
      h('rect', {width: 14, height: 14, fill: C.beforeSoft}),
      h('rect', {width: 5, height: 14, fill: C.beforeMid, opacity: 0.55})),
    h('pattern', {id: ctx.id(did), width: 16, height: 16, patternUnits: 'userSpaceOnUse'},
      h('rect', {width: 16, height: 16, fill: C.afterSoft}),
      h('circle', {cx: 4, cy: 4, r: 2.6, fill: C.after, opacity: 0.55}),
      h('circle', {cx: 12, cy: 12, r: 2.6, fill: C.after, opacity: 0.55})),
  );
  return {defs, hatch: ctx.ref(hid), dots: ctx.ref(did)};
}

/* ------------------------------------------------------------------------ */
/* Art pieces                                                               */
/* ------------------------------------------------------------------------ */

/** Level pips (i + 1 notches) — reads the level / version index without text. */
function pips(x, y, n, color, stroke, size = 8) {
  const out = [];
  for (let k = 0; k < n; k++) out.push(h('rect', {x: r(x + k * (size + 5)), y: r(y), width: size, height: size * 1.3, rx: 2, fill: color, stroke, 'stroke-width': 1.4}));
  return out;
}

/**
 * Bound version lying on the desk (top-down): cover, spine, page edge, a
 * binding strap with a brass ring (where the band is held), title plate.
 * Local origin = top-left. The title plate is in the upper part; the lower
 * part covers the band end.
 */
export function versionBook(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const color = o.color || BOOK_COLORS[o.index % 2];
  const K = o.K;
  const plateW = w - 46;
  const fit = fitInBox(ctx, o.title, {maxWidth: plateW - 18, maxHeight: o.plateMaxH ?? K * 3.8, size: K, minSize: K, floorSize: K, weight: 700, family: 'serif'});
  const plateH = o.bare ? K * 1.5 : fit.height + K * 0.8;
  const plate = {x: 28, y: o.plateY ?? 16, w: plateW, h: plateH};
  const spineX = o.index === 0 ? 0 : w - 20;
  const edgeX = o.index === 0 ? w - 10 : 4;
  const strapY = hh - (o.strapFromBottom ?? 40);
  const node = g({name: o.name, transform: o.x !== undefined ? T(o.x, o.y) : undefined},
    h('path', {d: roundRectPath(8, 11, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: color, stroke: th.ink, 'stroke-width': th.stroke}),
    // page edge (the side facing the band's end)
    h('rect', {x: edgeX, y: 7, width: 6, height: hh - 14, fill: th.paper, stroke: th.ink, 'stroke-width': 1.2}),
    // spine
    h('rect', {x: spineX, y: 0, width: 20, height: hh, rx: 7, fill: shade(color, -0.28), stroke: th.ink, 'stroke-width': 2}),
    // cover emboss
    h('path', {d: roundRectPath(22, 8, w - 44, hh - 16, 6), fill: 'none', stroke: shade(color, 0.25), 'stroke-width': 1.6, opacity: 0.7}),
    // binding strap + ring
    h('rect', {x: 0, y: strapY - 9, width: w, height: 18, fill: shade(color, -0.4), opacity: 0.9}),
    h('circle', {cx: o.index === 0 ? w - 22 : 22, cy: strapY, r: 10, fill: '#d7b35b', stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: o.index === 0 ? w - 22 : 22, cy: strapY, r: 4, fill: shade(color, -0.4)}),
    // title plate
    h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 6), fill: '#f3ead6', stroke: th.ink, 'stroke-width': 1.6}),
    ctx.show('key') && !o.bare
      ? textBlock(fit, {x: plate.x + plate.w / 2, y: plate.y + (plate.h - fit.height) / 2, anchor: 'middle', fill: th.ink, name: o.titleName})
      : [h('rect', {x: plate.x + 14, y: plate.y + plate.h * 0.3, width: plate.w - 28, height: 8, rx: 4, fill: th.ink, opacity: 0.55}),
        h('rect', {x: plate.x + 14, y: plate.y + plate.h * 0.58, width: (plate.w - 28) * 0.55, height: 8, rx: 4, fill: th.ink, opacity: 0.4})],
    // version index pips (1 or 2) under the plate
    pips(plate.x + 4, plate.y + plate.h + 8, o.index + 1, th.paper, th.ink, 9),
  );
  return {node, w, h: hh, plate, fit, minBodyH: plate.y + plate.h + 30};
}

/** Height a version title needs (for layout). */
export function versionPlateH(ctx, title, w, K, maxH) {
  const fit = fitInBox(ctx, title, {maxWidth: w - 46 - 18, maxHeight: maxH ?? K * 3.8, size: K, minSize: K, floorSize: K, weight: 700, family: 'serif'});
  return fit.height + K * 0.8;
}

/**
 * Editable hierarchy rack (front view): one plate per user-supplied level,
 * each carrying the spine-coloured tabs of the versions listed on it.
 * Local origin = top-left.
 */
export function levelRack(ctx, o) {
  const th = ctx.theme;
  const {w, K} = o;
  const versions = o.versions;
  const tabW = 22;
  const tabsFor = i => versions.filter(v => v.level === i);
  const maxTabs = Math.max(1, ...o.levels.map((_, i) => tabsFor(i).length));
  const textW = w - 30 - 26 - maxTabs * (tabW + 6) - 14;
  const fits = o.levels.map(l => fitWords(ctx, l, {maxWidth: textW, size: K, minSize: K, floorSize: K, maxLines: 5, weight: 700}));
  const rowH = Math.max(K * 2, ...fits.map(f => f.height + K * 0.7));
  const gap = 10;
  const hh = o.levels.length * (rowH + gap) - gap + 26;
  const parts = [
    h('path', {d: roundRectPath(6, 9, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: 10, y: 8, width: 7, height: hh - 16, rx: 3.5, fill: shade(th.woodDark, -0.25)}),
    h('rect', {x: w - 17, y: 8, width: 7, height: hh - 16, rx: 3.5, fill: shade(th.woodDark, -0.25)}),
  ];
  const rows = [];
  o.levels.forEach((_, i) => {
    const y = 13 + i * (rowH + gap);
    parts.push(h('path', {d: roundRectPath(22, y, w - 44, rowH, 8), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}));
    if (ctx.show('key')) parts.push(textBlock(fits[i], {x: 34, y: y + (rowH - fits[i].height) / 2, fill: th.ink, name: o.prefix ? `${o.prefix}-lv${i}` : undefined}));
    else parts.push(h('rect', {x: 34, y: y + rowH / 2 - 5, width: textW * 0.7, height: 10, rx: 5, fill: th.ink, opacity: 0.5}));
    // spine tabs of the versions on this level (colour + pips = which version)
    tabsFor(i).forEach((v, k) => {
      const tx = w - 30 - (k + 1) * (tabW + 6);
      const col = BOOK_COLORS[v.i % 2];
      parts.push(h('path', {d: roundRectPath(tx, y + 5, tabW, rowH - 10, 4), fill: col, stroke: th.ink, 'stroke-width': 1.8}));
      for (let q = 0; q <= v.i; q++) parts.push(h('rect', {x: tx + 6, y: y + 10 + q * 10, width: tabW - 12, height: 5, rx: 2, fill: th.paper}));
    });
    rows.push({x: 22, y, w: w - 44, h: rowH});
  });
  return {node: g({name: o.name, transform: o.x !== undefined ? T(o.x, o.y) : undefined}, parts), w, h: hh, rows, fits};
}

/** Measure a rack without drawing it. */
export const rackHeight = (ctx, o) => levelRack(ctx, o).h;

/** Push-pin with side overlays. Local origin = pin centre. */
export function pinArt(ctx, P, R = 11) {
  const th = ctx.theme;
  const C = sideColors(ctx);
  return g({name: P},
    h('circle', {cx: 3, cy: 4, r: R, fill: th.shadow}),
    h('circle', {r: R, fill: C.neutral, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {name: `${P}-b`, r: R, fill: C.beforeMid, stroke: th.ink, 'stroke-width': 2, opacity: 0}),
    h('circle', {name: `${P}-a`, r: R, fill: C.after, stroke: th.ink, 'stroke-width': 2, opacity: 0}),
    g({name: `${P}-o`, opacity: 0},
      h('circle', {r: R, fill: '#ffffff', stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M0 ${-R}A${R} ${R} 0 0 1 0 ${R}Z`, fill: C.on})),
    h('circle', {cx: -R * 0.3, cy: -R * 0.35, r: R * 0.28, fill: '#ffffff', opacity: 0.6}),
  );
}

/**
 * Measure a case card (so a row of cards can share one height).
 */
export function measureCase(ctx, c, o) {
  const {w, K, t} = o;
  const pad = K * 0.5;
  const labelFit = fitWords(ctx, c.label, {maxWidth: w - pad * 2, size: K, minSize: K, floorSize: K, maxLines: 7, weight: 600});
  const dayFit = ctx.fit(o.dayText, {maxWidth: w - pad * 2 - K * 2.6, size: K, minSize: K, maxLines: 1, weight: 800});
  const sk = K * 0.94;
  const stripFits = {};
  for (const s of ['before', 'after', 'on']) stripFits[s] = fitWords(ctx, t[s], {maxWidth: w - pad * 2 - 20, size: sk, minSize: sk * 0.96, floorSize: sk * 0.96, maxLines: 4, weight: 800});
  const stripH = Math.max(...Object.values(stripFits).map(f => f.height)) + K * 0.6;
  const headH = K * 1.9;
  return {labelFit, dayFit, stripFits, stripH, headH, pad, h: pad + headH + K * 0.35 + labelFit.height + K * 0.5 + stripH + pad};
}

/**
 * Case card. Local origin = top-left. Four strips (neutral / before /
 * after / on) switched by opacity. `m` = measureCase result, `hh` = row height.
 */
export function caseCard(ctx, o) {
  const th = ctx.theme;
  const C = sideColors(ctx);
  const {w, K, m, P} = o;
  const hh = o.h;
  const pad = m.pad;
  const IR = K * 0.78;
  const stripW = w - pad * 2;
  const stripY = hh - pad - m.stripH;
  const showKey = ctx.show('key');
  const stripText = (s, color) => {
    if (!showKey) return null;
    const f = m.stripFits[s];
    return textBlock(f, {x: pad + stripW / 2, y: stripY + (m.stripH - f.height) / 2, anchor: 'middle', fill: color});
  };
  const dayW = o.dayW ?? m.dayFit.width + K * 0.9;
  const dayH = m.dayFit.size + K * 0.55;
  const parts = [
    h('path', {name: `${P}-shadow`, d: roundRectPath(5, 8, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: th.card, stroke: th.ink, 'stroke-width': th.stroke}),
    // punched hole where the thread is tied
    h('circle', {cx: w / 2, cy: 9, r: 4.5, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.5}),
    g({transform: T(pad + IR, pad + m.headH / 2)}, factIcon(ctx, o.icon, IR)),
    // day chip (a blank dashed chip stands in until the day is stamped, when o.blankName is given)
    o.blankName ? h('path', {name: o.blankName, d: roundRectPath(w - pad - dayW, pad + (m.headH - m.dayFit.size - K * 0.55) / 2, dayW, m.dayFit.size + K * 0.55, 8), fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 1.8, 'stroke-dasharray': '5 4'}) : null,
    g({name: o.dayName},
      h('path', {d: roundRectPath(w - pad - dayW, pad + (m.headH - dayH) / 2, dayW, dayH, 8), fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.6}),
      showKey ? textBlock(m.dayFit, {x: w - pad - dayW / 2, y: pad + (m.headH - dayH) / 2 + K * 0.27, anchor: 'middle', fill: th.ink, name: o.dayTextName}) : h('rect', {x: w - pad - dayW + 10, y: pad + m.headH / 2 - 4, width: dayW - 20, height: 8, rx: 4, fill: th.ink, opacity: 0.6})),
    showKey
      ? textBlock(m.labelFit, {x: pad, y: pad + m.headH + K * 0.35, fill: th.ink, name: o.labelName})
      : [h('rect', {x: pad, y: pad + m.headH + K * 0.5, width: stripW * 0.9, height: 9, rx: 4.5, fill: th.paperLine}), h('rect', {x: pad, y: pad + m.headH + K * 1.3, width: stripW * 0.6, height: 9, rx: 4.5, fill: th.paperLine})],
    // strips
    h('path', {name: `${P}-s0`, d: roundRectPath(pad, stripY, stripW, m.stripH, 7), fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '6 5'}),
    g({name: `${P}-sb`, opacity: 0},
      h('path', {d: roundRectPath(pad, stripY, stripW, m.stripH, 7), fill: o.hatch, stroke: C.before, 'stroke-width': 2.4}),
      h('path', {d: roundRectPath(pad + 6, stripY + 6, stripW - 12, m.stripH - 12, 5), fill: C.beforeSoft, opacity: 0.82}),
      stripText('before', shade(C.before, -0.45))),
    g({name: `${P}-sa`, opacity: 0},
      h('path', {d: roundRectPath(pad, stripY, stripW, m.stripH, 7), fill: C.after, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: roundRectPath(pad + 5, stripY + 5, stripW - 10, m.stripH - 10, 5), fill: 'none', stroke: '#ffffff', 'stroke-width': 1.4, 'stroke-dasharray': '2 6', opacity: 0.7}),
      stripText('after', '#ffffff')),
    g({name: `${P}-so`, opacity: 0},
      h('path', {d: roundRectPath(pad, stripY, stripW, m.stripH, 7), fill: C.onSoft, stroke: C.on, 'stroke-width': 2.2}),
      h('line', {x1: pad + stripW / 2, x2: pad + stripW / 2, y1: stripY + 3, y2: stripY + m.stripH - 3, stroke: C.on, 'stroke-width': 2, 'stroke-dasharray': '4 4', opacity: 0.4}),
      stripText('on', th.ink)),
  ];
  return {parts, w, h: hh, stripBox: {x: pad, y: stripY, w: stripW, h: m.stripH}, dayBox: {x: w - pad - dayW, y: pad + (m.headH - dayH) / 2, w: dayW, h: dayH}};
}

/**
 * Wooden timeline ruler (horizontal). Ticks along the top edge (the band
 * side), numbers under them, pins along the bottom edge (the cards side).
 * @param {{x:number,y:number,w:number,h:number, a0:number, a1:number, from:number, to:number, unit:string, K:number}} R
 */
export function rulerGeo(R) {
  const span = R.to - R.from;
  const along = day => R.a0 + ((day - R.from) / span) * (R.a1 - R.a0);
  return {...R, along, perUnit: (R.a1 - R.a0) / span, pinY: R.y + R.h - R.K * 0.62, numY: R.y + R.K * 0.62};
}

export function rulerArt(ctx, o) {
  const th = ctx.theme;
  const G = o.geo;
  const numSize = G.K * 0.95;
  const parts = [
    h('path', {d: roundRectPath(G.x + 7, G.y + 10, G.w, G.h, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(G.x, G.y, G.w, G.h, 10), fill: RULER_WOOD, stroke: th.ink, 'stroke-width': th.stroke}),
  ];
  for (let k = 0; k < 3; k++) {
    const off = (k + 1) * (G.h / 4);
    parts.push(h('path', {d: `M${G.x + 14} ${r(G.y + off)}C${r(G.x + G.w * 0.3)} ${r(G.y + off - 4)} ${r(G.x + G.w * 0.6)} ${r(G.y + off + 4)} ${G.x + G.w - 14} ${r(G.y + off - 2)}`, fill: 'none', stroke: shade(RULER_WOOD, -0.1), 'stroke-width': 1.5, opacity: 0.6}));
  }
  // numbers every `step` units, raised until they never crowd
  const numW = Math.max(...[G.from, G.to].map(v => ctx.measure(String(v), numSize, 700, 'sans')));
  const nice = [1, 2, 5, 10, 20, 25, 50, 100];
  let step = nice.find(s => G.perUnit * s >= numW + numSize * 1.3) ?? 100;
  const showKey = ctx.show('key');
  for (let day = G.from; day <= G.to; day++) {
    const major = (day - G.from) % step === 0;
    const minorEvery = G.perUnit >= 7 ? 1 : G.perUnit * 5 >= 14 ? 5 : step;
    if (!major && (day - G.from) % minorEvery !== 0) continue;
    const x = G.along(day);
    const tl = major ? G.K * 0.5 : G.K * 0.26;
    parts.push(h('line', {x1: r(x), x2: r(x), y1: G.y, y2: r(G.y + tl), stroke: th.ink, 'stroke-width': major ? 2.4 : 1.5}));
    if (major && showKey) {
      const f = ctx.fit(String(day), {maxWidth: 90, size: numSize, minSize: numSize, maxLines: 1, weight: 700});
      // (opt-in numName: each printed number is a named node `${numName}${day}`, e.g. so a lens copy can hide
      // a number its rim would cut)
      parts.push(textBlock(f, {x: r(x), y: G.y + G.K * 0.56, anchor: 'middle', fill: th.ink, ...(o.numName ? {name: `${o.numName}${day}`} : {})}));
    }
  }
  if (showKey && G.unit) {
    const f = ctx.fit(G.unit, {maxWidth: Math.max(40, G.a0 - G.x - 14), size: numSize, minSize: numSize * 0.9, maxLines: 1, weight: 800});
    parts.push(textBlock(f, {x: G.x + 12, y: G.y + G.K * 0.56, fill: shade(RULER_WOOD, -0.62), ...(o.numName ? {name: `${o.numName}u`} : {})}));
  }
  return g({name: o.name}, parts);
}

/**
 * Paper tag printed with the milestone; the post's pole goes through its eyelet.
 * Local origin = eyelet (bottom-centre of the tag).
 */
export function milestoneTag(ctx, o) {
  const th = ctx.theme;
  const f = o.fit;
  const w = f.width + o.K * 1.3;
  const hh = f.height + o.K * 0.75;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(-w / 2 + 5, -hh - 10 + 7, w, hh, 8), fill: th.shadow}),
    h('path', {d: `M${r(-w / 2)} ${r(-hh - 10)}H${r(w / 2)}V${r(-14)}L${r(w / 2 - 12)} -10H${r(12 - w / 2)}L${r(-w / 2)} -14Z`, fill: '#fff8e2', stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-w / 2 + 6)} ${r(-hh - 4)}H${r(w / 2 - 6)}`, stroke: shade(th.accent, 0), 'stroke-width': 3, opacity: 0.8}),
    ctx.show('key')
      ? textBlock(f, {x: 0, y: -hh - 10 + (hh - f.height) / 2 + 2, anchor: 'middle', fill: th.ink, name: o.textName})
      : h('rect', {x: -w * 0.35, y: -hh / 2 - 14, width: w * 0.7, height: 9, rx: 4.5, fill: th.ink, opacity: 0.55}),
    // eyelet
    h('circle', {cx: 0, cy: -2, r: 8, fill: '#d7b35b', stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: -2, r: 3.2, fill: th.paperShade}),
  );
  return {node, w, h: hh + 10};
}

/**
 * Milestone post seen from above: a turned wooden knob (planted in the lane)
 * with a brass pole. Local origin = knob centre; the pole runs up (−y) by `L`.
 */
export function postArt(ctx, o) {
  const th = ctx.theme;
  const {R, L} = o;
  return g({name: o.name},
    h('ellipse', {name: `${o.name}-shadow`, cx: 6, cy: 9, rx: R * 1.05, ry: R, fill: th.shadow}),
    h('rect', {x: -5.5, y: -L, width: 11, height: L, rx: 5, fill: '#c9a24a', stroke: th.ink, 'stroke-width': 2.2}),
    h('rect', {x: -1.5, y: -L + 6, width: 3, height: L - 12, rx: 1.5, fill: '#fff3c4', opacity: 0.7}),
    h('circle', {cx: 0, cy: -L, r: 7.5, fill: '#d7b35b', stroke: th.ink, 'stroke-width': 2}),
    h('circle', {r: R, fill: '#8e5b3a', stroke: th.ink, 'stroke-width': 2.6}),
    h('circle', {r: R * 0.66, fill: '#a86d45', stroke: shade('#8e5b3a', -0.3), 'stroke-width': 1.6}),
    h('circle', {r: R * 0.28, fill: '#d7b35b', stroke: th.ink, 'stroke-width': 1.6}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.3)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(-R * 0.1)} ${r(-R * 0.66)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5}),
  );
}

/** Wooden holder block with a groove where the post lies before it is planted. Local origin = top-left. */
export function holderArt(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  return g({name: o.name, transform: T(o.x, o.y)},
    h('path', {d: roundRectPath(6, 9, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(10, hh / 2 - 8, w - 20, 16, 8), fill: shade(th.woodDark, -0.35), stroke: shade(th.woodDark, -0.5), 'stroke-width': 1.5}),
    h('circle', {cx: w - hh / 2, cy: hh / 2, r: hh * 0.36, fill: shade(th.woodDark, -0.3), stroke: shade(th.woodDark, -0.5), 'stroke-width': 1.5}),
  );
}

/** Tray the cases are dealt from (wooden, with a lip that carries its label). Local origin = top-left. */
export function trayArt(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, lipH} = o;
  const parts = [
    h('path', {d: roundRectPath(7, 10, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 14), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(10, 10, w - 20, hh - lipH - 14, 8), fill: '#d8c29a', stroke: shade(th.woodDark, -0.3), 'stroke-width': 1.5}),
    h('path', {d: roundRectPath(20, 22, w - 40, hh - lipH - 38, 8), fill: 'none', stroke: shade('#d8c29a', -0.25), 'stroke-width': 2, 'stroke-dasharray': '9 7'}),
    h('path', {d: roundRectPath(8, hh - lipH - 2, w - 16, lipH - 6, 8), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
  ];
  if (o.fit && ctx.show('key')) parts.push(textBlock(o.fit, {x: w / 2, y: hh - lipH - 2 + (lipH - 6 - o.fit.height) / 2, anchor: 'middle', fill: th.ink, name: o.textName}));
  return g({name: o.name, transform: T(o.x, o.y)}, parts);
}

/** Neutral key / status chip (caption). Returns node + box; drawn at x,y (top-left). */
export function noteChip(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size;
  const f = fitWords(ctx, text, {maxWidth: o.maxWidth - size * 1.9, size, minSize: size * 0.9, floorSize: size * 0.82, maxLines: o.maxLines ?? 6, weight: o.weight ?? 600});
  const w = f.width + size * 1.9;
  const hh = f.height + size * 0.8;
  const x = o.anchor === 'end' ? o.x - w : o.anchor === 'middle' ? o.x - w / 2 : o.x;
  // with its text hidden the chip is not drawn at all (an empty pill would read as a missing label)
  if (!ctx.show(o.level ?? 'key')) return {node: g({name: o.name, opacity: o.opacity}), box: {x, y: o.y, w, h: hh}, fit: f, size: f.size};
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.8)), fill: th.card, stroke: o.color ?? th.inkSoft, 'stroke-width': 2, 'stroke-dasharray': o.dashed ? '7 5' : undefined}),
    h('circle', {cx: x + size * 0.75, cy: o.y + hh / 2, r: size * 0.26, fill: o.dot ? (o.color ?? th.inkSoft) : 'none', stroke: o.color ?? th.inkSoft, 'stroke-width': 2.5}),
    ctx.show(o.level ?? 'key') ? textBlock(f, {x: x + size * 1.3, y: o.y + size * 0.4, fill: th.ink, name: o.textName}) : null,
  );
  return {node, box: {x, y: o.y, w, h: hh}, fit: f, size: f.size};
}

/** Measure a note chip. */
export function noteChipSize(ctx, text, o) {
  const f = fitWords(ctx, text, {maxWidth: o.maxWidth - o.size * 1.9, size: o.size, minSize: o.size * 0.9, floorSize: o.size * 0.82, maxLines: o.maxLines ?? 6, weight: o.weight ?? 600});
  return {truncated: f.truncated, w: f.width + o.size * 1.9, h: f.height + o.size * 0.8};
}

/**
 * A fit is "bad" when it had to be ellipsised or a word was split across lines
 * (AUTHORING items 2 and 13): layouts use this to pick a size that needs neither.
 */
export function badFit(f) {
  if (!f) return false;
  if (f.truncated) return true;
  const words = String(f.full ?? '').split(/\s+/).filter(Boolean);
  const got = new Set(f.lines.flatMap(l => l.split(' ')));
  return words.some(w => !got.has(w));
}

/**
 * Actor chip with a sleeve swatch (so a chip names the arm it belongs to). The name is supplied content:
 * it wraps (up to 5 lines) and shrinks at most 4 %.
 */
export function actorChip(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size;
  const f = fitWords(ctx, text, {maxWidth: o.maxWidth - size * 2.6, size, minSize: size, floorSize: size, maxLines: o.maxLines ?? 5, weight: 700});
  const w = f.width + size * 2.7;
  const hh = f.height + size * 0.7;
  const x = o.anchor === 'end' ? o.x - w : o.anchor === 'middle' ? o.x - w / 2 : o.x;
  return {
    node: g({name: o.name},
      h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, 20)), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: x + size * 1.02, cy: o.y + hh / 2, r: size * 0.5, fill: o.swatch, stroke: th.ink, 'stroke-width': 2}),
      textBlock(f, {x: x + size * 1.85, y: o.y + size * 0.35, fill: th.ink})),
    box: {x, y: o.y, w, h: hh},
    truncated: badFit(f),
    size: f.size,
    fit: f,
  };
}

/* ------------------------------------------------------------------------ */
/* Ribbon text: laid out clear of every post position                      */
/* ------------------------------------------------------------------------ */

/**
 * Lay out the band's printed passage (ref + wording) in the free spans of the
 * ribbon between the books, never under a post position. Returns the chosen
 * blocks and the ribbon height they need.
 */
export function ribbonLayout(ctx, o) {
  const {x0, x1, postXs, K} = o;
  const keep = K * 1.1;
  const cuts = postXs.map(x => [x - keep, x + keep]).sort((a, b) => a[0] - b[0]);
  const spans = [];
  let cur = x0;
  for (const [a, b] of cuts) {
    if (a > cur) spans.push([cur, Math.min(a, x1)]);
    cur = Math.max(cur, b);
  }
  if (cur < x1) spans.push([cur, x1]);
  const usable = spans.filter(s => s[1] - s[0] > K * 4).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
  const refOf = w => fitWords(ctx, o.ref, {maxWidth: w, size: K, minSize: K, floorSize: K, maxLines: 4, weight: 800});
  const txtOf = w => (o.text ? fitWords(ctx, o.text, {maxWidth: w, size: K, minSize: K, floorSize: K, maxLines: 8, weight: 400, family: 'serif'}) : null);
  const pad = K * 0.45;
  const candidates = [];
  if (usable[0]) {
    const s = usable[0];
    const w = s[1] - s[0] - pad * 2;
    const rf = refOf(w), tf = txtOf(w);
    candidates.push({blocks: [{x: s[0] + pad, w, fits: [rf, tf].filter(Boolean)}], h: rf.height + (tf ? tf.height + K * 0.3 : 0)});
  }
  if (usable.length > 1) {
    // ref in the left span, wording in the right span (or the other way round)
    const [a, b] = usable.slice(0, 2).sort((p, q) => p[0] - q[0]);
    const wa = a[1] - a[0] - pad * 2, wb = b[1] - b[0] - pad * 2;
    const rf = refOf(wa), tf = txtOf(wb);
    candidates.push({blocks: [{x: a[0] + pad, w: wa, fits: [rf]}, ...(tf ? [{x: b[0] + pad, w: wb, fits: [tf]}] : [])], h: Math.max(rf.height, tf ? tf.height : 0)});
  }
  const best = candidates.sort((p, q) => p.h - q.h)[0];
  return {blocks: best ? best.blocks : [], h: best ? best.h : K, pad};
}


/* ------------------------------------------------------------------------ */
/* The band desk                                                            */
/* ------------------------------------------------------------------------ */

/** Mode parameters (design units). */
export const MODES = {
  wide: {bookW: 262, rackW: 0.25, noteW: 0.23, cwMax: 400, zoneMin: 118},
  square: {bookW: 190, rackW: 0.37, noteW: 0.33, cwMax: 330, zoneMin: 104, compact: true},
  tall: {bookW: 196, rackW: 0.52, noteW: 0.4, cwMax: 300, zoneMin: 200},
};

/**
 * The band desk. Builds the whole desk for a stage width W (the height
 * follows from the content) and returns its node, geometry and a pose()
 * that maps action values to node attributes and semantic facts.
 *
 * Rows (top → bottom): rack | reader A | reading note · free zone between the
 * two versions (holder, milestone tag, editorial callouts) · band (printed
 * ribbon + lane) · ruler · case cards (the deck lies in a tray at the left
 * end of this row) · notes row (tray lip, reader B at rest, key, state).
 * @param {any} ctx
 * @param {{prefix:string, mode:'wide'|'square'|'tall', W:number, K:number, p:any, d:any,
 *   rack?:boolean, note?:boolean, deck?:boolean, arms?:boolean, holder?:boolean,
 *   postDays?:number[], trayLabel?:string, actorLabels?:{a:string,b:string},
 *   keyText?:string|null, stateText?:string|null, zoneExtra?:number, slotCenters?:number[], deckCards?:number[]}} o
 */
export function bandDesk(ctx, o) {
  const th = ctx.theme;
  const t = ctx.t;
  const C = sideColors(ctx);
  const P = o.prefix;
  const M = MODES[o.mode];
  const W = o.W;
  const K = o.K;
  const d = o.d;
  const m = 16;
  const withArms = o.arms !== false;
  const withArmA = withArms && o.armA !== false;
  const bare = Boolean(o.bare);
  const withDeck = o.deck !== false;
  const withRack = o.rack !== false;
  const withNote = o.note !== false && d.readings.length > 0;
  const withHolder = o.holder !== false;
  const n = d.cases.length;
  const pat = sidePatterns(ctx, P);
  const looks = [actorLook(ctx, null, 0), actorLook(ctx, null, 1)];

  // ---------- band text geometry first (the post length sizes its holder)
  const bookW = o.bookW ?? M.bookW;
  const bandX0 = m + bookW; // visible band span between the books
  const bandX1 = W - m - bookW;
  const dayA0 = bandX0 + K * 1.3, dayA1 = bandX1 - K * 1.3;
  const along = day => dayA0 + ((day - d.from) / (d.to - d.from)) * (dayA1 - dayA0);
  const postDays = o.postDays || [d.milestone];
  const postXs = postDays.map(along);
  const rib = ribbonLayout(ctx, {x0: bandX0 + 10, x1: bandX1 - 10, postXs, ref: d.passage.ref, text: d.passage.text, K});
  const RH = bare ? K * (o.bareRibbon ?? 1.1) : rib.h + rib.pad * 2;
  const LH = K * (o.laneH ?? (M.compact ? 1.7 : 1.95));
  const KR = K * 0.95;
  const PL = RH + LH / 2 + 16;
  const tagMax = Math.min(o.tagMax ?? (o.mode === 'wide' ? K * 16 : K * 10.5), bandX1 - bandX0 - 40 - K * 1.3);
  const tagFits = postDays.map(v => fitWords(ctx, d.milestoneText(v), {maxWidth: Math.min(tagMax, (bandX1 - bandX0) * 0.8), size: K, minSize: K, floorSize: K, maxLines: 3, weight: 800}));
  const tagMs = tagFits.map(f => milestoneTag(ctx, {K, fit: f}));
  const tagW = Math.max(...tagMs.map(q => q.w)), tagH = Math.max(...tagMs.map(q => q.h));
  const holderW = PL + KR * 2 + 26, holderH = KR * 2 + 16;

  // ---------- top strip: rack | reader A (+ the post holder) | reading note
  // (tall: the note gets its own full-width row under the rack and reader A's column)
  const colGap = 18;
  const tall = o.mode === 'tall';
  const rackW = withRack ? Math.round(W * M.rackW) : 0;
  const noteW = withNote ? (tall ? W - 2 * m : Math.round(W * M.noteW)) : 0;
  const rack = withRack ? levelRack(ctx, {name: `${P}-rack`, prefix: P, x: m, y: m, w: rackW, K, levels: d.levels, versions: d.versions}) : null;
  // (opt-in rtNote: the reading note with line spacing proportional to the text size)
  const note = !withNote ? null : o.rtNote
    ? rtReadingNote(ctx, {w: noteW, head: t.readingProposed, by: `${t.byWord} ${d.readings[0].by}`, text: d.readings[0].text, size: K})
    : readingNote(ctx, {w: noteW, head: t.readingProposed, by: `${t.byWord} ${d.readings[0].by}`, text: d.readings[0].text, size: K, bySize: K, textSize: K});
  const colA = {x0: m + rackW + (withRack ? colGap : 0), x1: W - m - (tall ? 0 : noteW + (withNote ? colGap : 0))};
  const cwA = colA.x1 - colA.x0;
  let chipA = null;
  let restA = null;
  let holder = null;
  let colBottom = m;
  if (withArmA) {
    // wide column: holder at the left, the resting hand and its chip at the right; narrow: stacked
    const side = cwA >= holderW + 260;
    restA = side ? {x: colA.x1 - Math.min(150, cwA * 0.22), y: m + 40} : {x: (colA.x0 + colA.x1) / 2 - 8, y: m + 40};
    colBottom = restA.y + 40;
    if (ctx.show('key') && o.actorLabels) {
      const maxW = side ? cwA - holderW - 30 : Math.max(180, cwA);
      const probe = actorChip(ctx, o.actorLabels.a, {name: `${P}-chipA`, x: 0, y: 0, maxWidth: maxW, swatch: looks[0].outfit, size: K, maxLines: 5});
      // (opt-in restAInset: extra room between the resting hand and the reading note to its right)
      const inset = o.restAInset ?? 0;
      if (!side && probe.box.w + 96 + inset <= cwA) {
        // compact: the resting hand at the column's right end, its chip beside it on the same row
        restA = {x: colA.x1 - 44 - inset, y: m + 40};
        chipA = actorChip(ctx, o.actorLabels.a, {name: `${P}-chipA`, x: restA.x - 50, anchor: 'end', y: m + 40 - probe.box.h / 2, maxWidth: maxW, swatch: looks[0].outfit, size: K, maxLines: 5});
        colBottom = Math.max(restA.y + 40, chipA.box.y + chipA.box.h);
      } else {
        const cx = clamp(restA.x, colA.x1 - (side ? maxW : cwA) + probe.box.w / 2, colA.x1 - probe.box.w / 2);
        chipA = actorChip(ctx, o.actorLabels.a, {name: `${P}-chipA`, x: cx, anchor: 'middle', y: restA.y + 50, maxWidth: maxW, swatch: looks[0].outfit, size: K, maxLines: 5});
        colBottom = chipA.box.y + chipA.box.h;
      }
    }
    if (withHolder) {
      holder = side
        ? {x: colA.x0 + 10, y: m + 26, w: holderW, h: holderH}
        : {x: clamp((colA.x0 + colA.x1) / 2 - holderW / 2, colA.x0, Math.max(colA.x0, colA.x1 - holderW)), y: colBottom + 14, w: holderW, h: holderH};
      colBottom = Math.max(colBottom, holder.y + holder.h);
    }
  } else if (withHolder) {
    holder = {x: colA.x0 + 10, y: m + 10, w: holderW, h: holderH};
    colBottom = holder.y + holder.h;
  }
  const row1H = Math.max(rack ? rack.h : 0, tall ? 0 : (note ? note.h : 0), colBottom - m);
  const noteY = tall ? m + row1H + 16 : m;
  const topH = tall && note ? row1H + 16 + note.h : row1H;
  const hasTop = topH > 0;

  // ---------- band rows
  const zoneTop = hasTop ? m + topH + 22 : m;
  const calloutH = K * 1.18 * 2 + K + 10;
  // room for the editorial callouts beside the tag (or above it when the zone is narrow)
  let calloutNeed = o.calloutTexts === undefined ? calloutH + 26 : (o.calloutTexts.length ? calloutH + 26 : 0);
  const zoneW = bandX1 - bandX0 - 16;
  const tagCx = clamp(postXs[0], bandX0 + tagW / 2 + 8, bandX1 - tagW / 2 - 8);
  const freeSide = Math.max(tagCx - tagW / 2 - (bandX0 + 8), bandX1 - 8 - (tagCx + tagW / 2)) - 40;
  for (const txt of o.calloutTexts || []) {
    const side = Math.min(freeSide, K * 30);
    const cs = side >= K * 6.5 ? noteChipSize(ctx, txt, {size: K * 0.9, maxWidth: side}) : null;
    calloutNeed = cs && !cs.truncated ? Math.max(calloutNeed, cs.h + 40) : Math.max(calloutNeed, tagH + noteChipSize(ctx, txt, {size: K * 0.9, maxWidth: Math.min(zoneW - 40, K * 30)}).h + 84);
  }
  const zoneH = Math.max(o.zoneMin ?? M.zoneMin, tagH + 30, calloutNeed, (o.zoneMinH ?? 0)) + (o.zoneExtra ?? 0);
  const ribbonTop = zoneTop + zoneH;
  const laneTop = ribbonTop + RH;
  const laneC = laneTop + LH / 2;
  const bandC = ribbonTop + (RH + LH) / 2;
  const RT = K * (o.rulerH ?? (M.compact ? 2.45 : 2.75));
  const rulerTop = laneTop + LH;
  const geo = rulerGeo({x: m, y: rulerTop, w: W - 2 * m, h: RT, a0: dayA0, a1: dayA1, from: d.from, to: d.to, unit: d.unit, K});
  const rulerBottom = rulerTop + RT;

  // ---------- books (they cover the band ends)
  const bookY = zoneTop;
  const bookH = laneTop + LH + 6 - bookY;
  const books = d.versions.map((v, i) => versionBook(ctx, {bare, name: `${P}-book${i}`, titleName: `${P}-bookT${i}`, x: i === 0 ? m : W - m - bookW, y: bookY, w: bookW, h: bookH, title: v.label, index: i, K, plateMaxH: bookH - 58, strapFromBottom: (RH + LH) / 2 + 6}));
  const bookBoxes = books.map((b, i) => ({x: i === 0 ? m : W - m - bookW, y: bookY, w: bookW, h: bookH}));

  // ---------- post & tag
  const poleTopY = ribbonTop - 16;
  const tagX = x => clamp(x, bandX0 + tagW / 2 + 8, bandX1 - tagW / 2 - 8);
  const tagBox = x => ({x: tagX(x) - tagW / 2, y: poleTopY - tagH - 2, w: tagW, h: tagH});
  const parkKnob = holder ? {x: holder.x + holder.w - KR - 12, y: holder.y + holder.h / 2} : {x: bandX1 - KR - 20, y: zoneTop + zoneH / 2};

  // ---------- case cards: one row under the ruler; the deck lies at its left end
  const gap = K * 0.62;
  const cw = Math.min(o.cwMax ?? M.cwMax, (W - 2 * m - (n - 1) * gap) / Math.max(1, n));
  const meas = d.cases.map(c => measureCase(ctx, c, {w: cw, K, t, dayText: d.dayText(c.day)}));
  const ch = Math.max(...meas.map(q => q.h));
  const slotTop = rulerBottom + K * (o.slotGap ?? (M.compact ? 1.2 : 1.5));
  const pinXs = d.cases.map(c => along(c.day));
  // cards before the post are relaxed left of it and cards after it to the right (when both groups fit),
  // so the row itself reads "before | after"; otherwise one relaxation over the whole row
  const mX0 = postXs[0];
  let sidesKept = false;
  let slotCx = o.slotCenters;
  if (!slotCx) {
    const idx = d.cases.map((c, i) => i);
    const onI = idx.filter(i => d.cases[i].side === 'on');
    const bI = idx.filter(i => d.cases[i].side === 'before'), aI = idx.filter(i => d.cases[i].side === 'after');
    (bI.length <= aI.length ? bI : aI).push(...onI);
    const need = k => k * cw + Math.max(0, k - 1) * gap;
    const lo = m, hi = W - m;
    if (need(bI.length) <= mX0 - gap / 2 - lo + 0.5 && need(aI.length) <= hi - (mX0 + gap / 2) + 0.5) {
      slotCx = new Array(n);
      const put = (list, a, b) => {
        const xs = relax1d(list.map(i => ({c: pinXs[i], s: cw})), gap, a, b);
        list.forEach((i, k) => { slotCx[i] = xs[k]; });
      };
      put(bI, lo, mX0 - gap / 2);
      put(aI, mX0 + gap / 2, hi);
      sidesKept = true;
    } else slotCx = relax1d(pinXs.map(x => ({c: x, s: cw})), gap, lo, hi);
  }
  const slots = slotCx.map(cx => ({x: cx - cw / 2, y: slotTop, w: cw, h: ch}));
  const slotBottom = slotTop + ch;
  // deal order: the rightmost slot first, so a card sliding right only passes over empty slots
  const deckCards = o.deckCards || d.cases.map((c, i) => i);
  const rank = new Array(n).fill(-1);
  deckCards.slice().sort((a, b) => slotCx[b] - slotCx[a] || a - b).forEach((ci, k) => { rank[ci] = k; });
  const deckPos = i => {
    const k = Math.max(0, rank[i]);
    return {x: m + 2 + k * 3, y: slotTop - k * 4, rot: k === 0 ? 0 : (k % 2 ? 1.4 : -1.2)};
  };
  let tray = null;
  let trayFit = null;
  if (withDeck && o.tray !== false) {
    trayFit = o.trayLabel ? fitWords(ctx, o.trayLabel, {maxWidth: cw + 26 - 28, size: K, minSize: K, floorSize: K, maxLines: 5, weight: 700}) : null;
    const lip = trayFit ? Math.max(K * 1.6, trayFit.height + 16) : K * 1.2;
    tray = {x: 6, y: slotTop - 16 - (deckCards.length - 1) * 4, w: cw + 26, lip};
    tray.h = slotBottom + lip + 6 - tray.y;
  }

  // smallest content text so far: captions (key, state, callouts) never exceed it
  const contentSizes = [...(bare ? [] : books.map(b => b.fit.size)), ...(rack ? rack.fits.map(f => f.size) : []), ...meas.map(q => q.labelFit.size), ...rib.blocks.flatMap(b => b.fits.map(f => f.size)), ...tagFits.map(f => f.size), ...(trayFit ? [trayFit.size] : [])];
  const minContent = Math.min(...contentSizes);
  // (opt-in capRatio: captions as large as the content text allows — never above the smallest content)
  const capSize = Math.min(K * (o.capRatio ?? 0.92), minContent - 0.25);
  // ---------- notes row: [tray lip] [reader B at rest] [B chip]; the key and the state chip are packed
  // into the free space of the row (around the lip, B's hand, arm and chip), lowest bottom first
  const notesTop = slotBottom + K * 0.7;
  const x0N = tray ? tray.x + tray.w + 18 : m;
  // reader B rests under the tray (bottom-left, next to the deck it deals from); its chip lies beside the hand
  const lipBottom = tray ? tray.y + tray.h : slotBottom;
  const restB = withArms ? (o.restB ? o.restB({slotBottom, lipBottom, m, cw}) : {x: m + 52, y: lipBottom + 46}) : null;
  let chipB = null;
  const obst = [];
  if (tray) obst.push({x: tray.x, y: tray.y, w: tray.w, h: tray.h});
  if (withArms) {
    obst.push({x: restB.x - 46, y: restB.y - 44, w: 110, h: 1e4});
    if (ctx.show('key') && o.actorLabels) {
      chipB = actorChip(ctx, o.actorLabels.b, {name: `${P}-chipB`, x: restB.x + 56, y: lipBottom + 8, maxWidth: Math.min(420, W * 0.4), swatch: looks[1].outfit, size: K, maxLines: 5});
      obst.push(chipB.box);
    }
  }
  const noteItems = [];
  const pack = (text, opt) => {
    let best = null;
    for (const f of [1, 0.8, 0.64, 0.5]) {
      const mw = Math.max(K * 8, Math.min(W - 2 * m, opt.maxWidth * f));
      const sz = noteChipSize(ctx, text, {...opt, maxWidth: mw});
      if (sz.truncated) continue;
      for (let yy = notesTop; yy < notesTop + 600 && !(best && yy + sz.h >= best.bottom); yy += 10) {
        let found = null;
        for (let xx = m; xx + sz.w <= W - m + 0.5; xx += 16) {
          const b = {x: xx, y: yy, w: sz.w, h: sz.h};
          if (!obst.some(q => overlaps(b, q, 10))) { found = b; break; }
        }
        if (found) {
          if (!best || found.y + found.h < best.bottom - 0.5) best = {...found, mw, bottom: found.y + found.h};
          break;
        }
      }
    }
    if (!best) best = {x: m, y: Math.max(...obst.map(q => Math.min(q.y + q.h, notesTop + 600))) + 10, mw: Math.min(W - 2 * m, opt.maxWidth)};
    const it = noteChip(ctx, text, {...opt, x: best.x, y: best.y, maxWidth: best.mw});
    noteItems.push(it);
    obst.push(it.box);
  };
  if (o.keyText) pack(o.keyText, {name: `${P}-key`, size: capSize, maxWidth: K * 21, color: th.inkSoft, dashed: true, opacity: 0});
  if (o.stateText) pack(o.stateText, {name: `${P}-state`, size: capSize, maxWidth: K * 18, color: C.after, dot: true, weight: 800, opacity: 0});
  const bottom = Math.max(...noteItems.map(it => it.box.y + it.box.h), chipB ? chipB.box.y + chipB.box.h : 0, tray ? tray.y + tray.h : 0, withArms ? (o.bottomPad !== undefined ? slotBottom + o.bottomPad : lipBottom + 50) : slotBottom);
  const H = bottom + m;
  // the resting hand lies at the desk's lower edge (partly beyond the window, clipped like the arm)
  if (restB && !o.restB) restB.y = Math.max(restB.y, H - 30);

  // ---------- arms (shoulders outside the window, following the hand)
  const armW = clamp(K * 2.1, 44, 58);
  const reachA = laneC + 160;
  const reachB = H + 160 - (slotBottom - 30);
  const lenA = Math.max(300, reachA * 0.56), lenB = Math.max(280, reachB * 0.6);
  const armA = withArmA ? topArm(ctx, {name: `${P}-armA`, skin: looks[0].skin, sleeve: looks[0].outfit, handed: 'left', upper: lenA, lower: lenA * 0.94, width: armW, handScale: 1.25}) : null;
  const armB = withArms ? topArm(ctx, {name: `${P}-armB`, skin: looks[1].skin, sleeve: looks[1].outfit, handed: 'right', upper: lenB, lower: lenB * 0.94, width: armW, handScale: 1.25}) : null;
  const shoulderA = q => ({x: clamp(q.x + 6 + (o.shoulderADx ?? 0), -60, W + 60), y: -160});
  const shoulderB = q => ({x: clamp(q.x + 16, -60, W + 60), y: H + 160});

  // ---------- nodes
  const win = deskWindow(ctx, {prefix: `${P}-win`, x: 0, y: 0, w: W, h: H, radius: 26, seedKey: 'rt-desk'});
  const ribbonClip = `${P}-bclip`;
  const bandLeft = m + bookW * 0.45;
  const bandW = W - m - bookW * 0.45 - bandLeft;
  const rollW = K * 1.25;
  const rollStart = bandX0 + rollW / 2 + 2;
  const rollEnd = bandX1 + rollW * 0.5 + 18; // tucked under version 2
  const ribbonText = [];
  rib.blocks.forEach((b, bi) => {
    let yy = ribbonTop + rib.pad;
    b.fits.forEach((f, fi) => {
      const isRef = f.family !== 'serif';
      ribbonText.push(ctx.show('key') && !bare
        ? textBlock(f, {x: b.x, y: yy, fill: isRef ? th.ink : th.inkSoft, italic: !isRef, name: `${P}-rib${bi}-${fi}`})
        : h('rect', {x: b.x, y: yy + f.size * 0.2, width: Math.min(b.w, f.width) * 0.9, height: f.size * 0.45, rx: 4, fill: isRef ? th.ink : th.paperLine, opacity: isRef ? 0.5 : 1}));
      yy += f.height + K * 0.3;
    });
  });
  const band = g({name: `${P}-band`},
    pat.defs,
    h('defs', null, h('clipPath', {id: ctx.id(ribbonClip)}, h('rect', {name: `${P}-bclipr`, x: bandLeft, y: ribbonTop - 4, width: 10, height: RH + LH + 20}))),
    g({'clip-path': ctx.ref(ribbonClip)},
      h('rect', {x: bandLeft + 5, y: ribbonTop + 7, width: bandW, height: RH + LH, fill: th.shadow}),
      h('rect', {x: bandLeft, y: ribbonTop, width: bandW, height: RH, fill: RIBBON, stroke: th.ink, 'stroke-width': 2}),
      h('line', {x1: bandLeft, x2: bandLeft + bandW, y1: ribbonTop + 5, y2: ribbonTop + 5, stroke: th.accent, 'stroke-width': 2, opacity: 0.55}),
      ribbonText,
      h('rect', {x: bandLeft, y: laneTop, width: bandW, height: LH, fill: LANE, stroke: th.ink, 'stroke-width': 2}),
      h('line', {x1: bandLeft, x2: bandLeft + bandW, y1: laneC, y2: laneC, stroke: shade(LANE, -0.2), 'stroke-width': 2, 'stroke-dasharray': '10 8'}),
      h('path', {name: `${P}-zb`, d: 'M0 0', fill: pat.hatch, stroke: C.before, 'stroke-width': 2.2, opacity: 0}),
      h('path', {name: `${P}-za`, d: 'M0 0', fill: pat.dots, stroke: C.after, 'stroke-width': 2.2, opacity: 0}),
    ),
    g({name: `${P}-roll`},
      h('rect', {x: -rollW / 2 + 5, y: ribbonTop, width: rollW, height: RH + LH + 16, rx: rollW / 2, fill: th.shadow}),
      h('rect', {x: -rollW / 2, y: ribbonTop - 8, width: rollW, height: RH + LH + 16, rx: rollW / 2, fill: RIBBON, stroke: th.ink, 'stroke-width': 2.2}),
      h('rect', {x: -rollW / 2 + 4, y: ribbonTop - 2, width: rollW * 0.28, height: RH + LH + 4, rx: 3, fill: '#ffffff', opacity: 0.7}),
      h('rect', {x: rollW * 0.08, y: ribbonTop - 2, width: rollW * 0.3, height: RH + LH + 4, rx: 3, fill: shade(RIBBON, -0.12)}),
      h('rect', {x: -rollW / 2 + 1, y: laneTop, width: rollW - 2, height: LH, fill: LANE, opacity: 0.8}),
    ),
  );
  const mTick = h('path', {name: `${P}-mtick`, d: 'M0 0', stroke: th.ink, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0});
  const ruler = rulerArt(ctx, {name: `${P}-ruler`, geo, ...(o.nameRulerNumbers ? {numName: `${P}-rn`} : {})});
  const pinY = geo.pinY;
  const threads = d.cases.map((c, i) => h('line', {name: `${P}-th${i}`, x1: r(pinXs[i]), y1: r(pinY), x2: r(slotCx[i]), y2: r(slotTop + 9), stroke: th.inkSoft, 'stroke-width': 2.6, opacity: 0}));
  const pins = d.cases.map((c, i) => g({name: `${P}-pinW${i}`, transform: T(pinXs[i], pinY), opacity: 0}, pinArt(ctx, `${P}-pin${i}`, K * 0.45)));
  const cards = d.cases.map((c, i) => caseCard(ctx, {P: `${P}-c${i}`, w: cw, h: ch, K, m: meas[i], icon: c.icon, hatch: pat.hatch, dayName: `${P}-c${i}-day`, labelName: `${P}-c${i}-lab`, dayW: o.dayW, blankName: (o.blankDay || []).includes(i) ? `${P}-c${i}-blank` : null}));
  // draw order: the first card dealt lies on top of the deck
  const drawOrder = d.cases.map((c, i) => i).sort((a, b) => rank[b] - rank[a]);
  const cardNodes = drawOrder.map(i => g({name: `${P}-c${i}`}, cards[i].parts));
  const tags = postDays.map((v, k) => milestoneTag(ctx, {name: k === 0 ? `${P}-tag` : `${P}-tag${k}`, textName: k === 0 ? `${P}-tagT` : `${P}-tagT${k}`, K, fit: tagFits[k]}));
  const post = postArt(ctx, {name: `${P}-post`, R: KR, L: PL});
  const tagLine = h('line', {name: `${P}-tagcord`, stroke: th.ink, 'stroke-width': 2, opacity: 0});
  const trayNode = tray ? trayArt(ctx, {name: `${P}-tray`, textName: `${P}-trayT`, x: tray.x, y: tray.y, w: tray.w, h: tray.h, lipH: tray.lip, fit: trayFit}) : null;

  const armLayer = withArms ? g({'clip-path': win.clip}, armB.arm, armB.palm, armB.thumb, armA ? [armA.arm, armA.palm, armA.thumb] : null) : null;
  const node = g({name: P},
    win.surface,
    rack && rack.node,
    note && g({transform: T(W - m - noteW, noteY)}, note.node),
    holder && holderArt(ctx, {name: `${P}-holder`, x: holder.x, y: holder.y, w: holder.w, h: holder.h}),
    ruler,
    band,
    threads,
    pins,
    mTick,
    books.map(b => b.node),
    trayNode,
    cardNodes,
    tags.map(q => q.node),
    tagLine,
    post,
    noteItems.map(it => it.node),
    armLayer,
    // reader chips lie above the arms: a reaching arm never covers its own name
    chipB && chipB.node,
    chipA && chipA.node,
    win.frame,
  );

  // ---------- geometry helpers for poses
  const cardGripOf = q => ({x: q.x + cw / 2, y: q.y + ch - K * 0.55});
  const slotGrip = i => cardGripOf(slots[i]);
  const deckGrip = i => cardGripOf(deckPos(i));
  const handBox = q => ({x: q.x - 40, y: q.y - 40, w: 80, h: 80});
  const plantKnob = x => ({x, y: laneC});
  const postGripLocal = {x: 0, y: -PL * 0.52};
  const postPoint = (knob, deg, local) => {
    const a = (deg * Math.PI) / 180;
    return {x: knob.x + local.x * Math.cos(a) - local.y * Math.sin(a), y: knob.y + local.x * Math.sin(a) + local.y * Math.cos(a)};
  };

  /**
   * Pose from action values.
   * @param {{band?:number, a?:{phase:string,p:number,from?:string}, postState?:'parked'|'carried'|'planted'|'hidden', carry?:number, plant?:number,
   *   postX?:number, tagXs?:number[], tagOpacity?:number[], zones?:number,
   *   cards:Array<{state:'deck'|'moving'|'slot', slide?:number, pin?:number, strip?:number, side?:string, dayX?:number}>,
   *   bHand?:{kind:'rest'|'to'|'card', from?:any, to?:any, e?:number, card?:number}}} v
   */
  function pose(v) {
    const nodes = {};
    // ---- band unrolled up to the roll
    const bp = clamp(v.band ?? 1);
    const rollX = lerp(rollStart, rollEnd, ease.inOutSine(bp));
    nodes[`${P}-bclipr`] = {width: r(Math.max(2, rollX - bandLeft))};
    nodes[`${P}-roll`] = {transform: T(rollX, 0)};
    const rollGrip = {x: rollX, y: bandC};

    // ---- post
    const mX = v.postX ?? postXs[0];
    const state = v.postState || 'planted';
    let knob, deg = 0, lift = 0;
    if (state === 'parked') { knob = parkKnob; deg = -90; }
    else if (state === 'planted' || state === 'hidden') knob = plantKnob(mX);
    else {
      const e = ease.inOutSine(clamp(v.carry));
      const a = parkKnob, b = {x: mX, y: laneC - K * 0.9};
      const q = cubic(a, {x: lerp(a.x, b.x, 0.3), y: a.y - K * 0.8}, {x: lerp(a.x, b.x, 0.8), y: b.y - K * 0.8}, b, e);
      const pl = ease.inOutSine(clamp(v.plant ?? 0));
      knob = {x: q.x, y: lerp(q.y, laneC, pl)};
      deg = lerp(-90, 0, ease.inOutCubic(clamp(e * 1.35)));
      lift = 1 - pl;
    }
    nodes[`${P}-post`] = {transform: T(knob.x, knob.y, deg, 1 + 0.07 * lift), opacity: state === 'hidden' ? 0 : 1};
    nodes[`${P}-post-shadow`] = {transform: T(4 + 10 * lift, 6 + 12 * lift)};
    const postGrip = postPoint(knob, deg, postGripLocal);
    const planted = state === 'planted';
    tags.forEach((q, k) => {
      const tx = tagX(v.tagXs ? v.tagXs[k] : (k === 0 ? mX : postXs[k]));
      nodes[k === 0 ? `${P}-tag` : `${P}-tag${k}`] = {transform: T(tx, poleTopY), opacity: v.tagOpacity ? r(v.tagOpacity[k], 3) : 1};
    });
    const tX0 = tagX(v.tagXs ? v.tagXs[0] : mX);
    // (o.stableDom: every attribute is written on every frame, so the DOM never depends on the seek order)
    nodes[`${P}-tagcord`] = planted && Math.abs(tX0 - mX) > 2 ? {x1: r(mX), y1: r(poleTopY), x2: r(tX0), y2: r(poleTopY - 2), opacity: 1} : o.stableDom ? {x1: 0, y1: 0, x2: 0, y2: 0, opacity: 0} : {opacity: 0};
    nodes[`${P}-mtick`] = {d: `M${r(mX)} ${r(geo.y + 3)}V${r(geo.y + K * 0.5)}`, opacity: planted ? 1 : 0};
    const z = clamp(v.zones ?? 0);
    const zL = lerp(mX - KR - 4, bandX0 - 4, ease.outCubic(z));
    const zR = lerp(mX + KR + 4, bandX1 + 4, ease.outCubic(z));
    const zi = 5;
    nodes[`${P}-zb`] = z > 0 ? {d: `M${r(zL)} ${r(laneTop + zi)}H${r(mX - KR - 4)}V${r(laneTop + LH - zi)}H${r(zL)}Z`, opacity: 1} : o.stableDom ? {d: 'M0 0', opacity: 0} : {opacity: 0};
    nodes[`${P}-za`] = z > 0 ? {d: `M${r(mX + KR + 4)} ${r(laneTop + zi)}H${r(zR)}V${r(laneTop + LH - zi)}H${r(mX + KR + 4)}Z`, opacity: 1} : o.stableDom ? {d: 'M0 0', opacity: 0} : {opacity: 0};

    // ---- cards
    const cardPos = [];
    const topDeck = Math.min(...v.cards.map((cv, i) => (cv.state === 'deck' ? rank[i] : 99)));
    v.cards.forEach((cv, i) => {
      let q;
      let kk = 1;
      if (cv.state === 'slot') q = {x: slots[i].x, y: slots[i].y, rot: 0};
      else if (cv.state === 'deck') q = deckPos(i);
      else {
        const a = deckPos(i);
        const s1 = ease.inOutSine(clamp(cv.slide));
        q = {x: lerp(a.x, slots[i].x, s1), y: lerp(a.y, slots[i].y, s1), rot: lerp(a.rot, 0, s1)};
        kk = 1 + 0.035 * Math.sin(Math.PI * clamp(cv.slide));
      }
      cardPos.push(q);
      nodes[`${P}-c${i}`] = {transform: `${T(q.x + cw / 2, q.y + ch / 2, q.rot, kk)} ${T(-cw / 2, -ch / 2)}`};
      nodes[`${P}-c${i}-shadow`] = {transform: T(5 + 120 * (kk - 1), 8 + 160 * (kk - 1))};
      // a card still covered in the deck keeps its text hidden (only the top card is readable)
      const covered = cv.state === 'deck' && rank[i] > topDeck;
      if (ctx.show('key')) nodes[`${P}-c${i}-lab`] = {opacity: covered ? 0 : 1};
      nodes[`${P}-c${i}-day`] = {opacity: covered ? 0 : 1};
      const pinP = clamp(cv.pin ?? 0);
      const px = cv.dayX ?? pinXs[i];
      nodes[`${P}-pinW${i}`] = {opacity: r(clamp(pinP * 2), 3), transform: T(px, pinY - 16 * (1 - pinP))};
      const side = cv.side ?? d.cases[i].side;
      const sp = clamp(cv.strip ?? 0);
      nodes[`${P}-th${i}`] = {opacity: r(clamp(pinP * 2), 3), x1: r(px), y1: r(pinY - 16 * (1 - pinP)), x2: r(slotCx[i]), y2: r(slotTop + 9), stroke: sp > 0.5 ? (side === 'before' ? C.before : side === 'after' ? C.after : C.on) : th.inkSoft};
      nodes[`${P}-pin${i}-b`] = {opacity: side === 'before' ? r(sp, 3) : 0};
      nodes[`${P}-pin${i}-a`] = {opacity: side === 'after' ? r(sp, 3) : 0};
      nodes[`${P}-pin${i}-o`] = {opacity: side === 'on' ? r(sp, 3) : 0};
      nodes[`${P}-c${i}-sb`] = {opacity: side === 'before' ? r(sp, 3) : 0};
      nodes[`${P}-c${i}-sa`] = {opacity: side === 'after' ? r(sp, 3) : 0};
      nodes[`${P}-c${i}-so`] = {opacity: side === 'on' ? r(sp, 3) : 0};
      nodes[`${P}-c${i}-s0`] = {opacity: r(1 - sp, 3)};
    });

    // ---- arms
    let handA = null, handB = null, reachedA = true, reachedB = true, aHolds = null, bHolds = null;
    if (armA) {
      const a = v.a || {phase: 'rest', p: 0};
      const e = ease.inOutSine(clamp(a.p));
      const rollStartGrip = {x: rollStart, y: bandC};
      const plantedGrip = postPoint(plantKnob(mX), 0, postGripLocal);
      let target;
      if (a.phase === 'reach') target = cubic(restA, {x: restA.x, y: restA.y + K * 3}, {x: rollStartGrip.x, y: rollStartGrip.y - K * 4}, rollStartGrip, e);
      else if (a.phase === 'pull') { target = rollGrip; aHolds = 'roll'; }
      else if (a.phase === 'toPost') {
        const pg = postPoint(parkKnob, -90, postGripLocal);
        target = cubic(rollGrip, {x: rollGrip.x, y: rollGrip.y - K * 3}, {x: pg.x, y: pg.y - K * 2}, pg, e);
      } else if (a.phase === 'carry') { target = postGrip; aHolds = 'post'; }
      else if (a.phase === 'hold') target = plantedGrip;
      else if (a.phase === 'back') {
        const from = a.from === 'roll' ? rollGrip : plantedGrip;
        target = cubic(from, {x: from.x, y: from.y - K * 3}, {x: restA.x, y: restA.y + K * 3}, restA, e);
      } else target = restA;
      const sA = armA.pose(shoulderA(target), target, 1);
      Object.assign(nodes, sA.nodes);
      handA = sA.hand;
      reachedA = sA.reached;
    }
    if (armB) {
      const bh = v.bHand || {kind: 'rest'};
      let target;
      if (bh.kind === 'card') { target = cardGripOf(cardPos[bh.card]); bHolds = `card${bh.card}`; }
      else if (bh.kind === 'to') {
        const e = ease.inOutSine(clamp(bh.e));
        target = cubic(bh.from, {x: bh.from.x, y: bh.from.y + K * 1.4}, {x: bh.to.x, y: bh.to.y + K * 1.4}, bh.to, e);
      } else target = restB;
      const sB = armB.pose(shoulderB(target), target, -1);
      Object.assign(nodes, sB.nodes);
      handB = sB.hand;
      reachedB = sB.reached;
    }
    const P2 = q => q && {x: r(q.x), y: r(q.y)};
    return {
      nodes,
      semantic: {
        handA: P2(handA), handB: P2(handB),
        roll: P2(rollGrip), rollGrip: P2(rollGrip),
        post: P2(knob), postGrip: P2(postGrip), postDeg: r(deg),
        bandProgress: r(bp, 3),
        aHolds, bHolds,
        cards: cardPos.map(P2),
        cardGrips: cardPos.map(q => P2(cardGripOf(q))),
        reach: {A: reachedA, B: reachedB},
        allReached: reachedA && reachedB,
      },
    };
  }

  // every fitted content text: none may be ellipsised or broken inside a word
  const noteFits = withNote ? [
    fitWords(ctx, `${t.byWord} ${d.readings[0].by}`, {maxWidth: noteW - 32, size: K, minSize: K * 0.95, floorSize: 17, maxLines: 3, weight: 600}),
    fitWords(ctx, d.readings[0].text, {maxWidth: noteW - 32, size: K, minSize: K * 0.97, floorSize: 17, maxLines: 6, weight: 400, family: 'serif'}),
  ] : [];
  const allFits = [
    ...(bare ? [] : books.map(b => b.fit)), ...(rack ? rack.fits : []), ...meas.flatMap(q => [q.labelFit, q.dayFit, ...Object.values(q.stripFits)]),
    ...(bare ? [] : rib.blocks.flatMap(b => b.fits)), ...tagFits, trayFit, ...noteItems.map(it => it.fit), ...noteFits,
  ];
  const brokenList = [...allFits.filter(badFit).map(f => f.full), ...[chipA, chipB].filter(c => c && c.truncated).map(() => 'chip')];
  const broken = brokenList.length;
  return {
    node, pose, W, H, K, sidesKept,
    cardDayBox: i => ({x: slots[i].x + cards[i].dayBox.x, y: slots[i].y + cards[i].dayBox.y, w: cards[i].dayBox.w, h: cards[i].dayBox.h}),
    cardStripBox: i => ({x: slots[i].x + cards[i].stripBox.x, y: slots[i].y + cards[i].stripBox.y, w: cards[i].stripBox.w, h: cards[i].stripBox.h}),
    broken, brokenList,
    geo, along, pinXs, slots, slotCx, cw, ch, slotTop, slotBottom, rank, deckPos,
    bandX0, bandX1, ribbonTop, laneTop, laneC, bandC, RH, LH, rulerTop, rulerBottom,
    zone: {x: bandX0 + 8, y: zoneTop + 6, w: bandX1 - bandX0 - 16, h: ribbonTop - zoneTop - 12},
    zoneTop, zoneH, poleTopY, PL, KR, tagW, tagH, tagBox, tagX,
    bookBoxes, holder, tray, restA, restB, handBox, deckGrip, slotGrip, cardGripOf,
    rack: rack && {x: m, y: m, w: rack.w, h: rack.h},
    note: note && {x: W - m - noteW, y: noteY, w: noteW, h: note.h},
    chipA: chipA && chipA.box, chipB: chipB && chipB.box,
    notes: noteItems.map(it => it.box),
    notesTop,
    ribbonBlocks: rib.blocks.map(b => ({x: b.x, y: ribbonTop + rib.pad, w: b.w, h: rib.h})),
    postXs,
    textSizes: {K, strip: K * 0.94, note: capSize, minContent},
    capSize,
  };
}

/**
 * Text size search (bounded: at most 6 builds). The desk's text is sized in stage units, but its
 * on-screen size depends on the stage height the text itself produces. Width-limited stages hit the
 * target at once; a height-limited stage is stepped towards the fixed point, backing off when larger
 * text only makes the stage taller. Prefers builds with no ellipsised or split word, then the largest
 * on-screen size (a long-labels preset may settle lower than the target, never below ~16 px by design).
 * @param {any} ctx
 * @param {(K:number)=>any} build returns an object with W, H (stage units) and `broken`
 * @param {number} W0 nominal stage width
 * @param {number} targetPx
 */
export function sizeStage(ctx, build, W0, targetPx) {
  const base = designPx(ctx) * Math.min(1, ctx.design.w / W0);
  const K0 = targetPx / base;
  const q = K => Math.round(clamp(K, K0 * 0.55, K0 * 1.6) * 4) / 4;
  const seen = new Map();
  const at = K => {
    const k = q(K);
    if (!seen.has(k)) {
      const desk = build(k);
      const fit = stageFit(ctx, desk.W, desk.H);
      seen.set(k, {desk, fit, px: k * fit.pxu, K: k});
    }
    return seen.get(k);
  };
  const good = c => !c.desk.broken && c.px >= targetPx - 0.1;
  let c = at(K0);
  for (let it = 0; it < 3 && !good(c); it++) {
    const next = at(c.K * (targetPx / c.px));
    if (next.K === c.K || next.px <= c.px + 0.02) break;
    c = next;
  }
  if (!good(c)) {
    // back off: slightly smaller text (fewer wrapped lines, no split words)
    for (const f of [0.92, 0.84]) {
      const b = at(c.K * f);
      if (!b.desk.broken) { if (b.px > c.px || c.desk.broken) c = b; break; }
    }
  }
  // local refinement around the best unbroken candidate when the target was not reached
  if (![...seen.values()].some(good)) {
    const bestOk = [...seen.values()].filter(x => !x.desk.broken).sort((a, b) => b.px - a.px)[0];
    if (bestOk) for (const f of [1.05, 0.95, 1.1]) at(bestOk.K * f);
  }
  const all = [...seen.values()];
  return all.find(good) || all.filter(x => !x.desk.broken).sort((a, b) => b.px - a.px)[0] || all.sort((a, b) => a.desk.broken - b.desk.broken || b.px - a.px)[0];
}

/**
 * Try a few stage widths (a height-limited stage gets shallower when wider) and keep the first that
 * reaches the target with nothing broken, else the largest on-screen text.
 */
export function sizeStageW(ctx, buildW, widths, targetPx) {
  let best = null;
  const better = c => !best || (Boolean(best.desk.broken) - Boolean(c.desk.broken) || c.px - best.px) > 0;
  let bestW = widths[0];
  for (const W of widths) {
    const c = sizeStage(ctx, K => buildW(W, K), W, targetPx);
    if (!c.desk.broken && c.px >= targetPx - 0.1) return c;
    if (better(c)) { best = c; bestW = W; }
  }
  // 2-D refinement around the best (width, size) pair when the target was not reached
  if (widths.length > 1 && best) {
    const K0 = best.K, W0 = bestW;
    for (const fw of [1, 0.95, 1.05, 1.1]) {
      for (const fk of [0.95, 1.03, 1.06, 1.1, 1.15]) {
        const W = W0 * fw, K = Math.round(K0 * fk * 4) / 4;
        const desk = buildW(W, K);
        const fit = stageFit(ctx, desk.W, desk.H);
        const c = {desk, fit, px: K * fit.pxu, K};
        if (better(c)) best = c;
      }
    }
  }
  return best;
}

/**
 * Standalone band (printed ribbon + lane with side zones) for diagrams and lanes. Local coordinates are
 * absolute (x, y = top-left). The printed passage keeps clear of every post position.
 * @returns {{node:any, h:number, RH:number, LH:number, laneTop:number, laneC:number, along:(day:number)=>number, fits:any[], zones:(mX:number, z:number, KR:number)=>Record<string,any>}}
 */
export function bandPiece(ctx, o) {
  const th = ctx.theme;
  const C = sideColors(ctx);
  const {x, y, w, K, d, P} = o;
  // (the ruler under the band prints its unit word at the left end: the day axis starts after it)
  const unitW = d.unit ? ctx.measure(d.unit, K * 0.95, 800, 'sans') + K * 1.6 : 0;
  const ax = o.dayAxis || {x0: x, x1: x + w};
  const a0 = ax.x0 + Math.max(K * 1.3, unitW + 12), a1 = ax.x1 - K * 1.3;
  const along = day => a0 + ((day - d.from) / (d.to - d.from)) * (a1 - a0);
  const postXs = (o.postDays || [d.milestone]).map(along);
  const rib = ribbonLayout(ctx, {x0: x + 10, x1: x + w - 10, postXs, ref: d.passage.ref, text: d.passage.text, K});
  const RH = rib.h + rib.pad * 2 + K * 0.12 * Math.max(0, Math.max(...rib.blocks.map(b => b.fits.length)) - 1);
  const LH = K * 1.7;
  const laneTop = y + RH;
  const pat = o.pat || sidePatterns(ctx, P);
  const text = [];
  rib.blocks.forEach((b, bi) => {
    let yy = y + rib.pad;
    b.fits.forEach((f, fi) => {
      const isRef = f.family !== 'serif';
      text.push(ctx.show('key')
        ? textBlock(f, {x: b.x, y: yy, fill: isRef ? th.ink : th.inkSoft, italic: !isRef, name: `${P}-rib${bi}-${fi}`})
        : h('rect', {x: b.x, y: yy + f.size * 0.2, width: Math.min(b.w, f.width) * 0.9, height: f.size * 0.45, rx: 4, fill: isRef ? th.ink : th.paperLine, opacity: isRef ? 0.5 : 1}));
      yy += f.height + K * 0.42;
    });
  });
  const node = g({name: P},
    o.pat ? null : pat.defs,
    h('rect', {x: x + 6, y: y + 8, width: w, height: RH + LH, rx: 4, fill: th.shadow}),
    h('rect', {x, y, width: w, height: RH, fill: RIBBON, stroke: th.ink, 'stroke-width': 2}),
    h('line', {x1: x, x2: x + w, y1: y + 5, y2: y + 5, stroke: th.accent, 'stroke-width': 2, opacity: 0.55}),
    text,
    h('rect', {x, y: laneTop, width: w, height: LH, fill: LANE, stroke: th.ink, 'stroke-width': 2}),
    h('line', {x1: x, x2: x + w, y1: laneTop + LH / 2, y2: laneTop + LH / 2, stroke: shade(LANE, -0.2), 'stroke-width': 2, 'stroke-dasharray': '10 8'}),
    h('path', {name: `${P}-zb`, d: 'M0 0', fill: pat.hatch, stroke: C.before, 'stroke-width': 2.2, opacity: 0}),
    h('path', {name: `${P}-za`, d: 'M0 0', fill: pat.dots, stroke: C.after, 'stroke-width': 2.2, opacity: 0}),
  );
  const zones = (mX, z, KR) => {
    const zi = 5;
    const zL = lerp(mX - KR - 4, x + 4, ease.outCubic(clamp(z)));
    const zR = lerp(mX + KR + 4, x + w - 4, ease.outCubic(clamp(z)));
    return {
      [`${P}-zb`]: z > 0 ? {d: `M${r(zL)} ${r(laneTop + zi)}H${r(mX - KR - 4)}V${r(laneTop + LH - zi)}H${r(zL)}Z`, opacity: 1} : {d: 'M0 0', opacity: 0},
      [`${P}-za`]: z > 0 ? {d: `M${r(mX + KR + 4)} ${r(laneTop + zi)}H${r(zR)}V${r(laneTop + LH - zi)}H${r(mX + KR + 4)}Z`, opacity: 1} : {d: 'M0 0', opacity: 0},
    };
  };
  return {node, h: RH + LH, RH, LH, laneTop, laneC: laneTop + LH / 2, along, postXs, fits: rib.blocks.flatMap(b => b.fits), zones, a0, a1};
}

/** Cards relaxed around their pin x, before-cards left of the post and after-cards right of it when they fit. */
export function sideSlots(d, pinXs, mX, cw, gap, lo, hi, lane = gap) {
  const n = d.cases.length;
  const idx = d.cases.map((c, i) => i);
  const onI = idx.filter(i => d.cases[i].side === 'on');
  const bI = idx.filter(i => d.cases[i].side === 'before'), aI = idx.filter(i => d.cases[i].side === 'after');
  (bI.length <= aI.length ? bI : aI).push(...onI);
  const need = k => k * cw + Math.max(0, k - 1) * gap;
  if (need(bI.length) <= mX - lane / 2 - lo + 0.5 && need(aI.length) <= hi - (mX + lane / 2) + 0.5) {
    const xs = new Array(n);
    const put = (list, a, b) => {
      const r2 = relax1d(list.map(i => ({c: pinXs[i], s: cw})), gap, a, b);
      list.forEach((i, k) => { xs[i] = r2[k]; });
    };
    put(bI, lo, mX - lane / 2);
    put(aI, mX + lane / 2, hi);
    return {xs, kept: true};
  }
  return {xs: relax1d(pinXs.map(x2 => ({c: x2, s: cw})), gap, lo, hi), kept: false};
}

/**
 * Attributed reading note (sticky note) with line spacing proportional to the text size (the shared
 * readingNote uses a fixed 8-unit gap, which lets large text lines touch). Local origin = top-left.
 */
export function rtReadingNote(ctx, o) {
  const th = ctx.theme;
  const {w, size: K} = o;
  const pad = K * 0.7;
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const gap = K * 0.5;
  const headFit = fitWords(ctx, o.head, {maxWidth: w - pad * 2, size: K, minSize: K, floorSize: K, maxLines: 2, weight: 800});
  const byFit = fitWords(ctx, o.by, {maxWidth: w - pad * 2, size: K, minSize: K, floorSize: K, maxLines: 3, weight: 600});
  const txtFit = o.text ? fitWords(ctx, o.text, {maxWidth: w - pad * 2, size: K, minSize: K, floorSize: K, maxLines: 6, weight: 400, family: 'serif'}) : null;
  let y = pad;
  const body = [];
  if (showKey) body.push(textBlock(headFit, {x: pad, y, fill: shade('#e0a458', -0.55)}));
  else body.push(h('rect', {x: pad, y: y + 2, width: w * 0.5, height: K * 0.45, rx: 5, fill: shade('#e0a458', -0.45)}));
  y += headFit.height + gap;
  if (showKey) body.push(textBlock(byFit, {x: pad, y, fill: th.ink}));
  else body.push(h('rect', {x: pad, y: y + 2, width: w * 0.62, height: K * 0.4, rx: 4, fill: th.ink, opacity: 0.5}));
  // (the serif body's taller ascent needs a little more air above it — also at thumbnail scale)
  y += byFit.height + gap * (o.bodyGapF ?? 1.5);
  if (txtFit) {
    if (showAll) body.push(textBlock(txtFit, {x: pad, y, fill: th.inkSoft, italic: true}));
    else for (let i = 0; i < txtFit.lines.length; i++) body.push(h('rect', {x: pad, y: y + i * K * 1.18 + K * 0.3, width: (w - pad * 2) * (i === txtFit.lines.length - 1 ? 0.6 : 0.9), height: K * 0.3, rx: 3, fill: '#c9a45f'}));
    y += txtFit.height + gap * 0.5;
  }
  const hh = y + pad - gap * 0.5;
  return {
    node: g(null,
      h('path', {d: roundRectPath(6, 9, w, hh, 6), fill: th.shadow}),
      h('path', {d: `M0 0H${w}V${hh - 26}L${w - 26} ${hh}H0Z`, fill: '#f8e3a3', stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${w} ${hh - 26}H${w - 22}Q${w - 26} ${hh - 26} ${w - 26} ${hh - 22}V${hh}Z`, fill: '#e8c877', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
      h('rect', {x: w / 2 - 34, y: -10, width: 68, height: 20, rx: 3, fill: '#ffffff', opacity: 0.75, stroke: th.inkSoft, 'stroke-width': 1}),
      body),
    w, h: hh, fits: [headFit, byFit, txtFit].filter(Boolean),
  };
}
