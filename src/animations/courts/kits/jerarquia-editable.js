/**
 * Motif kit — «Jerarquía judicial editable» (courts-02, LAW-0205..0208).
 * Geometry, art assembly and text fitting shared by the four entries; each
 * entry owns its own timeline, layout choices and semantics.
 *
 * LEGAL: the hierarchy is ENTIRELY SUPPLIED. Level names, their order, the
 * number of levels, which body sits on which level and every link are
 * parameters with generic fictional defaults. Nothing here names or depicts
 * a real court system, court, appeal route or competence, and nothing claims
 * that a hierarchy exists anywhere. Buildings are the generic courts-art
 * elevation (no emblem, flag or columns). A link is drawn as a plain relation
 * (no arrow) unless the author supplies `sequence`.
 *
 * Visual idea ("podium ruler"): every generic building stands on its own
 * stone podium; the podium face carries the plan of one of its rooms (the
 * highlighted window) with the people seated in it, and the body's editable
 * label. A level ruler on the left draws the supplied levels as dashed lines;
 * a podium rises until the building stands on the line of its supplied
 * level. Links run above the roofs in lanes.
 *
 * Exports:
 *   hierFields(o)                      schema fields (courts, routes, seats, labels, people)
 *   HIER_EN / HIER_ES / HIER_LONG      default / Spanish / near-maximum content
 *   HIER_STRINGS                       built-in strings
 *   resolveHier(p)                     normalized levels, bodies, links
 *   glue / fitG / labelCard / textAt   glue-aware fitting (never splits a word, keeps number+word)
 *   pxPerUnit(ctx)                     design units → px at 1080p
 *   podiumGeometry(ctx, o)             pure layout of one podium scene in a box
 *   podiumScene(ctx, geo, o)           nodes + frame(levelsNow) for one scene
 *   linkLanes / linkPath               link routing above the roofs
 *   applyStatic(node, rec)             bake a static pose record into a vnode tree
 * @module animations/courts/kits/jerarquia-editable
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp} from '../../../core/time.js';
import {fitText, measure, FONTS} from '../../../core/text.js';
import {fitDesign} from '../../../core/layout.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, bool} from '../../../schemas/fields.js';
import {actorLook} from '../../../primitives/people-style.js';
import {changedMarker} from '../../../primitives/markers.js';
import {shade} from '../../../primitives/paper.js';
import {buildingElevation, planPerson, planChair, planTable, floorArea, wallRing, planColors} from './courts-art.js';

/* ------------------------------------------------------------------ */
/* Fields and content                                                  */
/* ------------------------------------------------------------------ */

export const LINK_KINDS = ['relation', 'sequence'];

const appearance = obj('Optional appearance overrides; defaults derive from the seed (never tied to a level or role)', {
  skin: int('Skin tone index 0–5', 0, 5),
  hair: oneOf('Hair style', ['short', 'long', 'bun', 'curly', 'buzz', 'scarf']),
  hairColor: int('Hair colour index 0–6', 0, 6),
  outfit: int('Outfit colour index 0–7', 0, 7),
  glasses: bool('Wears glasses'),
});

/**
 * Category fields shared by the four entries (brief: courts, routes, seats, labels).
 * @param {{maxBodies?:number, maxLevels?:number}} [o]
 */
export function hierFields({maxBodies = 5, maxLevels = 4, labelMax = 60, levelMax = 50, maxSeats = 2, keyMax = 90} = {}) {
  return {
    courts: obj('The supplied hierarchy, entirely editable and fictional: level names in their supplied order (the first is drawn lowest) and the generic bodies placed on them. It is not a statement about any real court system', {
      levels: list('Levels in the supplied order; the first is drawn lowest, the last highest', obj('Level', {
        name: str('Level name (as configured)', levelMax),
      }, ['name']), 2, maxLevels),
      bodies: list('Generic fictional bodies drawn as buildings, left to right in this order', obj('Body', {
        label: str('Editable label of the body (fictional)', labelMax),
        level: int('1-based index of its supplied level (a level beyond the list is clamped to the last one)', 1, maxLevels),
      }, ['label', 'level']), 2, maxBodies),
    }, ['levels', 'bodies']),
    routes: list('Links between bodies as configured (indices into courts.bodies). kind "relation" is a plain line without arrow; "sequence" gets an arrow and is used only when the author supplies it. A link to an unknown body is ignored', obj('Link', {
      from: int('Index of the first body', 0, maxBodies - 1),
      to: int('Index of the second body', 0, maxBodies - 1),
      kind: oneOf('relation (default, no arrow) | sequence (arrow, only when supplied)', LINK_KINDS),
    }, ['from', 'to', 'kind']), 0, 5),
    seats: int('People seated in the room plan on each podium (fictional)', 0, maxSeats),
    labels: obj('Editable built-in captions', {
      note: str('Visible note saying the hierarchy is as configured and illustrative', 70),
      key: str('Neutral key (must say that no conclusion is drawn)', keyMax),
    }),
    people: list('Optional appearance of the seated people, body by body', obj('Person', {appearance}), 0, 10),
  };
}

export const HIER_EN = {
  courts: {
    levels: [
      {name: 'Level 1 (as configured)'},
      {name: 'Level 2 (as configured)'},
      {name: 'Review level (as configured)'},
    ],
    bodies: [
      {label: 'Level 1 body A (fictional)', level: 1},
      {label: 'Level 2 body (fictional)', level: 2},
      {label: 'Review body (as configured)', level: 3},
      {label: 'Level 1 body B (fictional)', level: 1},
    ],
  },
  routes: [
    {from: 0, to: 1, kind: 'relation'},
    {from: 3, to: 1, kind: 'relation'},
    {from: 1, to: 2, kind: 'relation'},
  ],
  seats: 2,
  labels: {note: 'Hierarchy as configured (illustrative)', key: 'Levels and links as supplied · no conclusion drawn'},
  people: [],
};

export const HIER_ES = {
  courts: {
    levels: [
      {name: 'Nivel 1 (configurado)'},
      {name: 'Nivel 2 (configurado)'},
      {name: 'Nivel de revisión (configurado)'},
    ],
    bodies: [
      {label: 'Órgano de nivel 1 A (ficticio)', level: 1},
      {label: 'Órgano de nivel 2 (ficticio)', level: 2},
      {label: 'Órgano de revisión (configurado)', level: 3},
      {label: 'Órgano de nivel 1 B (ficticio)', level: 1},
    ],
  },
  routes: HIER_EN.routes,
  seats: 2,
  labels: {note: 'Jerarquía según configuración (ilustrativa)', key: 'Niveles y vínculos según lo aportado · sin conclusión'},
  people: [],
};

/** Near-maximum lengths and counts (long-labels-stress). */
export const HIER_LONG = {
  courts: {
    levels: [
      {name: 'Level 1 of this fictional example (as configured)'},
      {name: 'Level 2 of this fictional example (as configured)'},
      {name: 'Level 3 of this fictional example (as configured)'},
      {name: 'Review level of this example (as configured only)'},
    ],
    bodies: [
      {label: 'First-level body of the northern district (fictional)', level: 1},
      {label: 'Second-level body for the whole example area (fictional)', level: 2},
      {label: 'Third-level body placed here only as configured (fictional)', level: 3},
      {label: 'Review body, placed on the top level as configured only', level: 4},
      {label: 'First-level body of the southern district (fictional)', level: 1},
    ],
  },
  routes: [
    {from: 0, to: 1, kind: 'relation'},
    {from: 4, to: 1, kind: 'relation'},
    {from: 1, to: 2, kind: 'relation'},
    {from: 2, to: 3, kind: 'relation'},
    {from: 0, to: 4, kind: 'relation'},
  ],
  seats: 2,
  labels: {note: 'Hierarchy exactly as configured by the author (illustrative)', key: 'Levels, bodies and links are shown only as supplied by the author · no conclusion drawn'},
  people: [],
};

export const HIER_STRINGS = {
  en: {sequence: 'sequence as configured (illustrative)', placed: 'All bodies placed (as supplied)', pending: 'Last body not yet placed (as supplied)', was: 'was', placedAt: 'Placed at'},
  es: {sequence: 'secuencia según configuración (ilustrativa)', placed: 'Todos los órganos colocados (según lo aportado)', pending: 'El último órgano aún sin colocar (según lo aportado)', was: 'antes', placedAt: 'Colocado en'},
};

/**
 * Normalize the supplied hierarchy: levels (≥ 2), bodies with a clamped
 * 1-based level, links between existing distinct bodies (duplicates dropped).
 * @param {any} p params
 */
export function resolveHier(p) {
  const levels = p.courts.levels.map(l => ({name: l.name}));
  const N = levels.length;
  let clamped = false;
  const bodies = p.courts.bodies.map((b, i) => {
    const lv = Math.max(1, Math.min(N, b.level));
    if (lv !== b.level) clamped = true;
    return {i, label: b.label, level: lv};
  });
  const M = bodies.length;
  const seen = new Set();
  const links = [];
  for (const rt of p.routes || []) {
    if (rt.from >= M || rt.to >= M || rt.from === rt.to) continue;
    const key = `${Math.min(rt.from, rt.to)}-${Math.max(rt.from, rt.to)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({from: rt.from, to: rt.to, kind: rt.kind || 'relation'});
  }
  return {levels, N, bodies, M, links, clamped, seats: p.seats ?? 1};
}

/* ------------------------------------------------------------------ */
/* Text: glue-aware fitting                                            */
/* ------------------------------------------------------------------ */

/**
 * Split a text into unbreakable units: a number or a single closing letter
 * stays with the word before it ("Level 1", "body A"), a separator (· – —)
 * stays with the word before it, and a 1–2 letter word ("of", "de") travels
 * with the word after it. Core wrap() would collapse U+00A0, so the units are
 * kept as arrays and wrapped here.
 * @param {string} text
 * @returns {string[]}
 */
export function glue(text) {
  const words = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const units = [];
  let carry = null;
  for (const w of words) {
    const joinPrev = units.length && carry === null && (/^\d[\d.,:]*[)\]]?[.,;:]?$/.test(w) || /^\p{L}[)\].,;:]?$/u.test(w) || /^[·•–—|:]$/.test(w));
    if (joinPrev) { units[units.length - 1] += ` ${w}`; continue; }
    const cur = carry !== null ? `${carry} ${w}` : w;
    carry = null;
    if (/^[(¿¡]?\p{L}{1,2}$/u.test(w) && cur === w) { carry = cur; continue; }
    units.push(cur);
  }
  if (carry !== null) {
    if (units.length) units[units.length - 1] += ` ${carry}`;
    else units.push(carry);
  }
  return units;
}

/**
 * fitText-compatible fitting that wraps only between glue units, shrinks
 * within [minSize, size] before it would break a word, and balances lines.
 * `tooWide` is set when a single word does not fit at minSize (the caller
 * should then choose a wider box); the result then falls back to core fitText.
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:'sans'|'serif'|'mono', leading?:number}} o
 */
export function fitG(text, o) {
  const full = String(text ?? '');
  const weight = o.weight ?? 400;
  const family = o.family ?? 'sans';
  const leading = o.leading ?? 1.2;
  const maxLines = o.maxLines ?? 2;
  const minSize = Math.max(8, o.minSize ?? o.size * 0.75);
  const maxWidth = Math.max(10, o.maxWidth);
  const m = (t, sz) => measure(t, sz, weight, family);
  let units = glue(full);
  if (!units.length) return {...fitText(full, o), tooWide: false};
  const step = Math.max(0.25, o.size * 0.02);
  const widest = sz => Math.max(...units.map(t => m(t, sz)));
  let size = o.size;
  while (widest(size) > maxWidth && size > minSize) size = Math.max(minSize, size - step);
  if (widest(size) > maxWidth) {
    units = units.flatMap(t => (m(t, size) > maxWidth ? t.split(' ') : [t]));
    size = o.size;
    while (widest(size) > maxWidth && size > minSize) size = Math.max(minSize, size - step);
  }
  if (widest(size) > maxWidth) {
    const fb = fitText(full, {...o, size: minSize, minSize});
    return {...fb, tooWide: true};
  }
  const wrapAt = (w, sz) => {
    const lines = [];
    let cur = '';
    for (const t of units) {
      const cand = cur ? `${cur} ${t}` : t;
      if (!cur || m(cand, sz) <= w) cur = cand;
      else { lines.push(cur); cur = t; }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  let lines = wrapAt(maxWidth, size);
  while (lines.length > maxLines && size > minSize) {
    size = Math.max(minSize, size - step);
    lines = wrapAt(maxWidth, size);
  }
  let truncated = false;
  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && m(`${last}…`, size) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  } else if (lines.length > 1) {
    const n = lines.length;
    let lo = widest(size), hi = maxWidth;
    for (let i = 0; i < 14 && hi - lo > 0.5; i++) {
      const mid = (lo + hi) / 2;
      if (wrapAt(mid, size).length <= n) hi = mid;
      else lo = mid;
    }
    lines = wrapAt(hi, size);
  }
  const width = Math.max(...lines.map(l => m(l, size)));
  const lineHeight = size * leading;
  return {lines, size, lineHeight, width, height: lineHeight * (lines.length - 1) + size, truncated, full, weight, family, tooWide: false};
}

/** A fit is usable when it is neither truncated nor forced to break a word. */
export const fitOk = f => f && !f.truncated && !f.tooWide;

/**
 * Plain text block (tspans per line). `y` is the top of the block.
 * @param {ReturnType<typeof fitG>} fit
 */
export function textAt(fit, x, y, fill, o = {}) {
  const anchor = o.anchor || 'start';
  return h('text', {
    name: o.name,
    x: r(x), y: r(y + fit.size * 0.8),
    'font-family': FONTS[fit.family] || FONTS.sans,
    'font-size': r(fit.size, 2),
    'font-weight': fit.weight,
    'font-style': o.italic ? 'italic' : undefined,
    'text-anchor': anchor,
    fill,
    opacity: o.opacity,
  },
  fit.truncated ? h('title', null, fit.full) : null,
  fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

/**
 * Label card: rounded body (named `${name}-body`) and centred text (named
 * `${name}-text`) so a scene can bring the body in before the text.
 * @param {any} ctx
 * @param {string|ReturnType<typeof fitG>} text  text, or an existing fit
 * @param {{x:number, y:number, anchor?:'start'|'middle'|'end', maxWidth?:number, size?:number, minSize?:number, maxLines?:number, weight?:number, fill?:string, stroke?:string, color?:string, name?:string, strokeWidth?:number, dash?:string, minW?:number, align?:'middle'|'start'}} o
 */
export function labelCard(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size ?? 22;
  const padX = o.padX ?? size * 0.42;
  const padY = size * 0.34;
  const fit = typeof text === 'string'
    ? fitG(text, {maxWidth: (o.maxWidth ?? 300) - padX * 2, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 3, weight: o.weight ?? 600})
    : text;
  const w = Math.max(o.minW ?? 0, fit.width + padX * 2);
  const hh = fit.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const y = o.y;
  const name = o.name;
  const align = o.align ?? 'middle';
  const node = g({name},
    h('path', {name: name ? `${name}-body` : undefined, d: roundRectPath(x, y, w, hh, Math.min(hh / 2, size * 0.55)), fill: o.fill ?? th.card, stroke: o.stroke ?? th.ink, 'stroke-width': o.strokeWidth ?? 2, 'stroke-dasharray': o.dash}),
    textAt(fit, align === 'middle' ? x + w / 2 : x + padX, y + padY, o.color ?? th.ink, {anchor: align, name: name ? `${name}-text` : undefined}),
  );
  return {node, box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2}, fit};
}

/** Height of a label card for a fit. */
export const cardH = (fit, size) => fit.height + size * 0.68;

/** Design units → px at 1080p (for text and people floors). */
export function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return (f.scale * 1080) / Math.min(ctx.view.width, ctx.view.height);
}

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
export const R2 = q => ({x: r(q.x), y: r(q.y)});

/**
 * Bake a static record {name: attrs} into a vnode tree (for rigs posed once,
 * never animated: they then keep a fixed state in every frame).
 */
export function applyStatic(node, rec) {
  if (!node || typeof node !== 'object') return node;
  const nm = node.attrs && node.attrs.name;
  if (nm && rec[nm]) node.attrs = {...node.attrs, ...rec[nm]};
  for (const c of node.children || []) applyStatic(c, rec);
  return node;
}

/* ------------------------------------------------------------------ */
/* Building + room plan unit                                           */
/* ------------------------------------------------------------------ */

/** Generic building at scale 1 (design units). */
export const BW = 220;
export const BH = 176;

/** Room-plan pad size for a person scale and seat count. */
export function padSize(ps, seats) {
  const n = Math.max(1, seats);
  return {w: 22 + n * 88 * ps, h: 44 + 90 * ps, sp: 88 * ps};
}

/**
 * Plan of the highlighted room (the "sala"): a small sheet with walls, a desk
 * and `seats` people seated facing the desk. Local origin top-left.
 * @param {any} ctx
 * @param {{name:string, w:number, h:number, ps:number, seats:number, looks:any[]}} o
 */
export function roomPad(ctx, o) {
  const c = planColors(ctx);
  const th = ctx.theme;
  const {w, h: hh, ps} = o;
  const n = Math.max(0, o.seats);
  const inset = 5;
  const t = 5;
  const ix = inset + t, iy = inset + t, iw = w - 2 * (inset + t), ih = hh - 2 * (inset + t);
  const deskW = Math.min(iw - 12, Math.max(1, n) * 88 * ps + 6);
  const deskH = 18;
  const deskCy = iy + 4 + deskH / 2;
  const py = deskCy + deskH / 2 + 40 * ps;
  const sp = 88 * ps;
  const parts = [
    h('path', {d: roundRectPath(3, 5, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: c.sheet, stroke: shade(c.sheetGrid, -0.3), 'stroke-width': 2}),
    floorArea(ctx, {x: ix, y: iy, w: iw, h: ih, kind: 'tiles', cell: 24}),
    wallRing(ctx, {x: ix, y: iy, w: iw, h: ih, t, gaps: [{side: 'bottom', a: ix + iw * 0.7, b: ix + iw * 0.7 + Math.min(34, iw * 0.2), kind: 'open'}]}),
    // accent tab: this plan is the highlighted room of the building above
    h('path', {d: `M0 ${r(22)}V8Q0 0 8 0H${r(22)}Z`, fill: th.accent2}),
    planTable(ctx, {cx: w / 2, cy: deskCy, w: deskW, h: deskH, front: 'bottom', seedKey: `${o.name}-desk`}),
  ];
  const people = [];
  const rec = {};
  for (let j = 0; j < n; j++) {
    const x = w / 2 + (j - (n - 1) / 2) * sp;
    parts.push(planChair(ctx, {cx: x, cy: py + 10 * ps, deg: 0, s: 58 * ps}));
    const rig = planPerson(ctx, {name: `${o.name}-p${j}`, look: o.looks[j]});
    Object.assign(rec, rig.pose({x, y: py, deg: 0, scale: ps, seated: 1}));
    people.push({node: rig.node, x, y: py});
  }
  if (!n) parts.push(h('circle', {cx: r(w / 2), cy: r(py), r: r(30 * ps + 6), fill: 'none', stroke: c.frame, 'stroke-width': 2.2, 'stroke-dasharray': '6 6'}));
  const node = g({name: o.name}, parts, people.map(q => applyStatic(q.node, rec)));
  return {node, people: people.map(q => ({x: q.x, y: q.y, name: `${o.name}-p${people.indexOf(q)}`}))};
}

/* ------------------------------------------------------------------ */
/* Podium scene geometry                                               */
/* ------------------------------------------------------------------ */

const LANE_CLEAR = 28;
const LANE_GAP = 23;

/**
 * Lane index per link so that links over overlapping spans with the same
 * base never share a height. Columns are body indices (left to right).
 * @param {Array<{from:number,to:number}>} links
 * @param {(i:number)=>number} levelOf  final level of body i
 */
export function linkLanes(links, levelOf) {
  const spans = links.map((l, i) => {
    const a = Math.min(l.from, l.to), b = Math.max(l.from, l.to);
    let base = 0;
    for (let j = a; j <= b; j++) base = Math.max(base, levelOf(j));
    return {i, a, b, base};
  });
  const order = spans.slice().sort((p, q) => (p.b - p.a) - (q.b - q.a) || p.a - q.a);
  const lane = new Array(links.length).fill(0);
  const done = [];
  for (const s of order) {
    let l = 0;
    while (done.some(d => d.base === s.base && lane[d.i] === l && d.a <= s.b && s.a <= d.b)) l++;
    lane[s.i] = l;
    done.push(s);
  }
  return spans.map(s => ({...s, lane: lane[s.i]}));
}

/**
 * Pure layout of one podium scene inside `box` (design units).
 * @param {any} ctx
 * @param {{box:{x:number,y:number,w:number,h:number}, R:any, F:number, px:number, showKey:boolean, showAll?:boolean,
 *   levelOf?:(i:number)=>number, levelsMax?:(i:number)=>number, plate?:{texts:string[]}|null, title?:string|null, gutterFracs?:number[],
 *   bottomZone?:number, minRisePx?:number}} o
 */
export function podiumGeometry(ctx, o) {
  const {box, R, F, px} = o;
  const showKey = o.showKey;
  const M = R.M, N = R.N;
  const seats = R.seats;
  const levelMax = o.levelsMax || (i => R.bodies[i].level);
  const lanes = linkLanes(R.links, levelMax);
  const topBase = Math.max(...R.bodies.map((b, i) => levelMax(i)));
  const lanesTop = lanes.filter(l => l.base === topBase);
  const headroom = lanesTop.length ? LANE_CLEAR + Math.max(...lanesTop.map(l => l.lane)) * LANE_GAP + 10 : 14;
  const ps = Math.max((o.personPx ?? 61) / 100 / px, 0.5);
  const pad = padSize(ps, seats);
  const cands = [];
  const ext = o.externalRuler || null;
  const fracs = ext ? [0] : showKey ? (o.gutterFracs || [0.2, 0.24, 0.28, 0.32]) : [0];
  for (const gf of fracs) {
    const gw = ext ? 0 : showKey ? Math.max(gf * box.w, 150 / px) : 34 / px;
    // level plates (gutter)
    const plateFits = ext ? [] : showKey ? R.levels.map(l => fitG(l.name, {maxWidth: gw - 18 / px - F * 0.84, size: F, minSize: F, maxLines: 3, weight: 600})) : [];
    if (plateFits.some(f => !fitOk(f))) continue;
    const plateH = ext ? ext.plateH : plateFits.length ? Math.max(...plateFits.map(f => cardH(f, F))) : 0;
    const titleFit = showKey && o.title ? fitG(o.title, {maxWidth: gw - 10 / px, size: F, minSize: F, maxLines: 4, weight: 600}) : null;
    if (titleFit && !fitOk(titleFit)) continue;
    const colsX = box.x + (ext ? 0 : gw + (showKey ? 16 / px : 10 / px));
    const colsW = box.x + box.w - colsX;
    const pitch = colsW / M;
    const colGap = Math.max(12 / px, pitch * 0.05);
    const podW = pitch - colGap;
    if (pad.w > podW - 6) continue;
    const labelFits = showKey ? R.bodies.map((b, i) => fitG(o.badgeLabels ? String(i + 1) : b.label, {maxWidth: podW - 4 / px - F * 0.84, size: F, minSize: F, maxLines: 6, weight: o.badgeLabels ? 800 : 600})) : [];
    if (labelFits.some(f => !fitOk(f))) continue;
    const LH = labelFits.length ? Math.max(...labelFits.map(f => cardH(f, F))) : 0;
    // base plate groups (e.g. [[before, after], [was]]): each group takes the height of its tallest card
    const plateGroups = o.plate ? o.plate.groups.map(gr => gr.map(t => fitG(t, {maxWidth: podW - 12 / px - F * 0.84, size: F, minSize: F, maxLines: 4, weight: 700}))) : [];
    if (plateGroups.some(gr => gr.some(f => !fitOk(f)))) continue;
    const plateFitsB = plateGroups.flat();
    const plateBH = o.plate ? (plateGroups.length ? plateGroups.reduce((a, gr) => a + Math.max(...gr.map(f => cardH(f, F))) + 8 / px, 0) + 10 / px + (o.plate.extra || 0) : 40 / px) : 0;
    const faceTop = 10;
    const H0 = faceTop + pad.h + (showKey ? 8 + LH : 0) + 8 + plateBH;
    const G = box.y + box.h - (o.bottomZone || 0);
    const gInfo = o.gutterItems && o.gutterItems.length ? measureInfo(o.gutterItems, gw - 8 / px, F) : null;
    if (o.gutterItems && o.gutterItems.length && !gInfo) continue;
    let minRise = Math.max(plateH + 8 / px, (o.minRisePx ?? 46) / px, ext ? ext.minRise || 0 : 0);
    if (gInfo) minRise = Math.max(minRise, gInfo.height - H0 + plateH / 2 + 18 / px);
    const topY = box.y + headroom;
    const avail = G - H0 - topY;
    let bw = Math.min(podW - 8, BW * 1.35);
    let k = bw / BW;
    let bh = BH * k;
    let rise = (avail - bh) / N;
    // a step must read as a step: prefer rises of 3/4 of a building, accept down to 1/2
    if (rise < Math.max(minRise, bh * 0.75)) {
      let got = null;
      const minRatio = o.minRatio ?? 0.5;
      for (const ratio of [0.75, 0.65, 0.55, 0.5, 0.45, 0.4].filter(q => q >= minRatio - 1e-9)) {
        let bh2 = avail / (1 + N * ratio);
        let rise2 = bh2 * ratio;
        if (rise2 < minRise) { rise2 = minRise; bh2 = avail - N * minRise; }
        bh2 = Math.min(bh2, bh);
        if (bh2 / BH >= 0.62 || ratio <= minRatio + 1e-9) { got = {bh: bh2, rise: Math.max(rise2, (avail - bh2) / N)}; if (bh2 / BH >= 0.62) break; }
      }
      bh = got.bh; rise = got.rise; k = bh / BH; bw = BW * k;
    }
    if (k < (o.minK ?? 0.45) || rise < bh * ((o.minRatio ?? 0.5) - 0.05)) continue;
    // title above the top plate in the gutter
    const lineY = i => G - H0 - i * rise;
    let titleY = null;
    if (titleFit) {
      titleY = lineY(N) - plateH / 2 - 12 / px - titleFit.height;
      if (titleY < box.y) {
        // the title may sit higher only if the gutter has room
        continue;
      }
    }
    const cols = R.bodies.map((b, i) => {
      const x = colsX + i * pitch + colGap / 2;
      return {x, w: podW, cx: x + podW / 2};
    });
    cands.push({plateGroups, gInfo, gw, plateFits, plateH, titleFit, titleY, colsX, pitch, podW, colGap, labelFits, LH, plateFitsB, plateBH, H0, G, rise, k, bw, bh, ps, pad, cols, lanes, headroom, faceTop, box, lineY});
  }
  if (!cands.length) return null;
  cands.sort((a, b) => b.k - a.k || b.rise - a.rise);
  if (cands[0].gInfo) cands[0].gInfoY = cands[0].lineY(1) + cands[0].plateH / 2 + 18 / px;
  const c = cands[0];
  c.restTop = c.G - c.H0;
  c.showKey = showKey;
  c.topOf = lv => c.lineY(lv);
  return c;
}

/* ------------------------------------------------------------------ */
/* Podium scene art                                                    */
/* ------------------------------------------------------------------ */

/**
 * Nodes and frame of one podium scene.
 * frame(levelNow[], extra) sets each podium top to its (fractional) level
 * (0 = rest), the ruler draw-on and the link draw-on.
 * @param {any} ctx
 * @param {any} geo  podiumGeometry result
 * @param {{prefix:string, R:any, looks:(i:number,j:number)=>any, showKey:boolean, labels?:boolean, levelNames?:boolean, plate?:any}} o
 */
export function podiumScene(ctx, geo, o) {
  const th = ctx.theme;
  const c = planColors(ctx);
  const P = o.prefix;
  const {R} = o;
  const F = o.F;
  o = {...o, showKey: o.showKey && geo.showKey};
  const ruler = [];
  const gx1 = o.lineX0 ?? geo.colsX - 6;
  const xEnd = o.lineX1 ?? geo.box.x + geo.box.w;
  const lx0 = Math.min(gx1 - 10, xEnd), lx1 = Math.max(gx1 - 10, xEnd);
  // ruler: vertical rule, ticks and dashed level lines
  ruler.push(h('path', {name: `${P}rule`, d: `M${r(gx1)} ${r(geo.G)}V${r(geo.lineY(R.N) - 18)}`, stroke: c.frame, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0, display: o.rule === false ? 'none' : undefined}));
  const lines = [];
  for (let i = 1; i <= R.N; i++) {
    const y = geo.lineY(i);
    const ld = o.lineX1 !== undefined && o.lineX1 < gx1 ? `M${r(gx1)} ${r(y)}H${r(xEnd)}` : `M${r(lx0)} ${r(y)}H${r(lx1)}`;
    lines.push(h('path', {name: `${P}lv${i}`, d: ld, pathLength: 1, stroke: c.frame, 'stroke-width': 2.2, 'stroke-dasharray': '1 1.2', 'stroke-dashoffset': 1, fill: 'none', opacity: 0}));
    lines.push(h('path', {name: `${P}lvd${i}`, d: ld, stroke: c.frame, 'stroke-width': 2.2, 'stroke-dasharray': '9 8', fill: 'none', opacity: 0}));
  }
  // level bands: a faint tint per supplied level (the scaffold the podiums rise into)
  const bands = [];
  if (o.bands) {
    for (let i = 1; i <= R.N; i++) {
      const y1 = geo.lineY(i), y0 = i < R.N ? geo.lineY(i + 1) : geo.lineY(R.N) - Math.min(geo.rise, geo.bh);
      bands.push(h('rect', {x: r(Math.min(lx0, lx1)), y: r(y0), width: r(Math.abs(lx1 - lx0)), height: r(y1 - y0), fill: i % 2 ? c.floor : c.corridor, stroke: 'none'}));
    }
  }
  const plates = [];
  if (o.showKey && o.plates !== false) {
    R.levels.forEach((l, i) => {
      const f = geo.plateFits[i];
      const y = geo.lineY(i + 1) - cardH(f, F) / 2;
      const card = labelCard(ctx, f, {x: gx1 - 14, y, anchor: 'end', size: F, fill: th.card, stroke: c.frame, name: `${P}plate${i}`});
      plates.push(card.node);
    });
  }
  // podium columns, moving tops
  const cols = [];
  const tops = [];
  const people = [];
  R.bodies.forEach((b, i) => {
    const col = geo.cols[i];
    cols.push(h('rect', {name: `${P}pod${i}`, x: r(col.x), y: r(geo.restTop), width: r(col.w), height: r(geo.G - geo.restTop), fill: c.stone, stroke: '#1f2328', 'stroke-width': 2.4}));
    const cap = h('rect', {x: r(col.x - 6), y: r(geo.restTop - 3), width: r(col.w + 12), height: 12, rx: 3, fill: c.stoneDark, stroke: '#1f2328', 'stroke-width': 2.2});
    const bld = buildingElevation(ctx, {name: `${P}b${i}`, x: col.cx - geo.bw / 2, y: geo.restTop - 3 - geo.bh, w: geo.bw, h: geo.bh, floors: 3, bays: 4, tree: false, highlight: {floor: 1, bay: 0}});
    const padX = col.cx - geo.pad.w / 2;
    const padY = geo.restTop + geo.faceTop;
    const looks = Array.from({length: R.seats}, (_, j) => o.looks(i, j));
    const pad = roomPad(ctx, {name: `${P}room${i}`, w: geo.pad.w, h: geo.pad.h, ps: geo.ps, seats: R.seats, looks});
    pad.people.forEach(q => people.push({body: i, name: q.name, x: padX + q.x, y: padY + q.y}));
    let lab = null;
    if (o.showKey && geo.labelFits[i]) {
      const f = geo.labelFits[i];
      lab = labelCard(ctx, f, {x: col.cx, y: padY + geo.pad.h + 8, anchor: 'middle', size: F, fill: th.card, name: `${P}lab${i}`, minW: o.badgeLabels ? cardH(f, F) : 0});
    }
    tops.push({i, node: g({name: `${P}u${i}`}, cap, bld.node, g({transform: T(padX, padY)}, pad.node), lab && lab.node), bld, padBox: {x: padX, y: padY, w: geo.pad.w, h: geo.pad.h}, labBox: lab && lab.box});
  });
  const links = R.links.map((l, i) => linkArt(ctx, {name: `${P}lk${i}`, kind: l.kind, caption: o.showKey && ctx.show('all') && l.kind === 'sequence' ? (ctx.t.sequence || 'sequence as configured (illustrative)') : null, F}));
  const node = g({name: `${P}scene`},
    bands.length ? g({name: `${P}bands`, opacity: 0}, bands) : null,
    cols,
    g({name: `${P}ruler`}, ruler, lines),
    tops.map(t => t.node),
    links.map(l => l.node),
    plates.length ? g({name: `${P}plates`}, plates) : null,
  );

  /** Podium top y at fractional level lv (0 = rest, 1 = first line, …). */
  const topY = lv => (lv <= 0 ? geo.restTop : lv < 1 ? geo.restTop + (geo.lineY(1) - geo.restTop) * lv : geo.lineY(1) - (lv - 1) * geo.rise);

  /**
   * @param {number[]} lv  fractional level per body (0 = rest)
   * @param {{ruler?:number, plates?:number, links?:number[], dashed?:number}} s
   */
  function frame(lv, s = {}) {
    const nodes = {};
    const roofs = [];
    R.bodies.forEach((b, i) => {
      const Ty = topY(lv[i]);
      const dy = Ty - geo.restTop;
      nodes[`${P}pod${i}`] = {y: r(Ty), height: r(geo.G - Ty)};
      nodes[`${P}u${i}`] = {transform: T(0, dy)};
      roofs.push({x: geo.cols[i].cx, y: Ty - 3 - geo.bh, top: Ty});
    });
    const rp = s.ruler ?? 1;
    // scaffold mode: the supplied levels are visible from the start (bands, dashed lines, plates);
    // the "ruler" progress then strengthens them (the cause, before any podium moves)
    const sc0 = s.scaffold ?? 0;
    nodes[`${P}rule`] = {opacity: r(Math.max(sc0 ? 1 : 0, Math.min(1, rp * 3)), 3)};
    if (bands.length) nodes[`${P}bands`] = {opacity: r(0.7 + 0.3 * rp, 3)};
    for (let i = 1; i <= R.N; i++) {
      const pi = sc0 ? 1 : clamp(rp * R.N - (i - 1) * 0.6, 0, 1);
      nodes[`${P}lv${i}`] = {'stroke-dashoffset': r(1 - pi, 4), opacity: pi > 0 && pi < 1 ? 1 : 0};
      nodes[`${P}lvd${i}`] = {opacity: pi >= 1 ? r(sc0 ? 0.45 + 0.3 * rp : 0.75, 3) : 0};
    }
    const tOp = s.textOp ?? 1;
    if (o.showKey && o.plates !== false) R.levels.forEach((l, i) => { nodes[`${P}plate${i}`] = {opacity: r((sc0 ? 1 : clamp((s.plates ?? rp) * R.N - i * 0.6, 0, 1)) * tOp, 3)}; });
    if (o.showKey) tops.forEach(t => { if (t.labBox) nodes[`${P}lab${t.i}`] = {opacity: r(tOp, 3)}; });
    // links over the roofs
    const lp = s.links || R.links.map(() => 1);
    const paths = [];
    R.links.forEach((l, i) => {
      const path = linkPath(R.links, geo.lanes, i, roofs, geo);
      paths.push(path);
      Object.assign(nodes, links[i].frame(path, lp[i]));
    });
    return {nodes, roofs, paths};
  }
  return {node, frame, tops, people, topY, links};
}

/**
 * Orthogonal link above the roofs: up from the first roof, across at its
 * lane, down onto the second roof. Endpoints are spread along each roof when
 * several links share a body.
 */
export function linkPath(links, lanes, i, roofs, geo) {
  const l = links[i];
  const ln = lanes[i];
  const share = (body, idx) => {
    const mine = links.map((q, j) => ({q, j})).filter(z => z.q.from === body || z.q.to === body);
    if (mine.length < 2) return 0;
    // order by the other end's x (left ends first)
    mine.sort((a, b) => (a.q.from === body ? a.q.to : a.q.from) - (b.q.from === body ? b.q.to : b.q.from));
    const k = mine.findIndex(z => z.j === idx);
    const spread = Math.min(geo.bw * 0.8, 52 * (mine.length - 1));
    return -spread / 2 + (spread * k) / (mine.length - 1);
  };
  const A = roofs[l.from], B = roofs[l.to];
  const xa = A.x + share(l.from, i), xb = B.x + share(l.to, i);
  let base = Infinity;
  for (let j = ln.a; j <= ln.b; j++) base = Math.min(base, roofs[j].y);
  const lane = base - LANE_CLEAR - ln.lane * LANE_GAP;
  const ya = A.y - 2, yb = B.y - 2;
  const rad = Math.min(14, Math.abs(xb - xa) / 2, (ya - lane) / 1.5, (yb - lane) / 1.5);
  const dir = xb > xa ? 1 : -1;
  const d = `M${r(xa)} ${r(ya)}V${r(lane + rad)}Q${r(xa)} ${r(lane)} ${r(xa + dir * rad)} ${r(lane)}H${r(xb - dir * rad)}Q${r(xb)} ${r(lane)} ${r(xb)} ${r(lane + rad)}V${r(yb)}`;
  const len = (ya - lane) + Math.abs(xb - xa) + (yb - lane) - rad * 4 + Math.PI * rad;
  return {d, a: {x: xa, y: ya}, b: {x: xb, y: yb}, lane, len, pts: [{x: xa, y: ya}, {x: xa, y: lane}, {x: xb, y: lane}, {x: xb, y: yb}]};
}

/** Link node: plain relation (end dots, no arrow) or supplied sequence (arrow). */
export function linkArt(ctx, {name, kind, caption = null, F = 20}) {
  const th = ctx.theme;
  const color = kind === 'sequence' ? th.fg : shade(th.fgSoft, -0.1);
  // a supplied sequence always carries a visible caption, so an arrow never reads as a route of its own
  const cap = caption ? labelCard(ctx, fitG(caption, {maxWidth: F * 9, size: F, minSize: F, maxLines: 3, weight: 600}), {x: 0, y: 0, anchor: 'middle', size: F, fill: th.card, stroke: color, name: `${name}-cap`}) : null;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d: 'M0 0', fill: 'none', stroke: color, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1.2', 'stroke-dashoffset': 1}),
    kind === 'sequence'
      ? h('path', {name: `${name}-head`, d: 'M0 0L-16 -9L-12 0L-16 9Z', fill: color, opacity: 0})
      : g(null,
        h('circle', {name: `${name}-dotA`, r: 6.5, fill: color, stroke: th.paper, 'stroke-width': 2, opacity: 0}),
        h('circle', {name: `${name}-dotB`, r: 6.5, fill: color, stroke: th.paper, 'stroke-width': 2, opacity: 0})),
    cap ? g({name: `${name}-capg`, opacity: 0}, cap.node) : null,
  );
  const frame = (path, p) => {
    const out = {
      [name]: {opacity: p > 0 ? 1 : 0},
      [`${name}-line`]: {d: path.d, 'stroke-dashoffset': r(1 - clamp(p), 4)},
    };
    if (kind === 'sequence') out[`${name}-head`] = {transform: T(path.b.x, path.b.y, 90), opacity: p >= 0.99 ? 1 : 0};
    else {
      out[`${name}-dotA`] = {cx: r(path.a.x), cy: r(path.a.y), opacity: p > 0 ? 1 : 0};
      out[`${name}-dotB`] = {cx: r(path.b.x), cy: r(path.b.y), opacity: p >= 0.99 ? 1 : 0};
    }
    if (cap) out[`${name}-capg`] = {transform: T((path.a.x + path.b.x) / 2, path.lane - cap.box.h - 6), opacity: p >= 0.99 ? 1 : 0};
    return out;
  };
  return {node, frame};
}

/** Seeded looks for the people seated on podium i (overrides from params.people). */
export function lookFor(ctx, p, i, j) {
  const idx = i * 2 + j;
  return actorLook(ctx, (p.people || [])[idx], idx);
}

/** Legend glyphs (person, link, room plan, building) at local origin, size s; `name` keeps rig names unique. */
export function legendGlyph(ctx, kind, s, name) {
  const th = ctx.theme;
  const c = planColors(ctx);
  if (kind === 'person') {
    const rig = planPerson(ctx, {name, look: {skin: '#c68863', hair: 'short', hairColor: '#4a3122', outfit: th.cloth[2], glasses: false}});
    return g({transform: T(0, 0, 0, s / 105)}, applyStatic(rig.node, rig.pose({x: 0, y: 0, deg: 0, scale: 1, seated: 0})));
  }
  if (kind === 'link') {
    const col = shade(th.fgSoft, -0.1);
    return g({name},
      h('path', {d: `M${r(-s * 0.45)} ${r(s * 0.22)}V${r(-s * 0.2)}H${r(s * 0.45)}V${r(s * 0.22)}`, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linejoin': 'round'}),
      h('circle', {cx: r(-s * 0.45), cy: r(s * 0.22), r: 5.5, fill: col}),
      h('circle', {cx: r(s * 0.45), cy: r(s * 0.22), r: 5.5, fill: col}));
  }
  if (kind === 'changed') return changedMarker(ctx, {name, radius: s * 0.4});
  if (kind === 'room') {
    return g({name},
      h('rect', {x: r(-s * 0.46), y: r(-s * 0.36), width: r(s * 0.92), height: r(s * 0.72), rx: 4, fill: c.sheet, stroke: '#1f2328', 'stroke-width': 2}),
      h('rect', {x: r(-s * 0.32), y: r(-s * 0.22), width: r(s * 0.64), height: r(s * 0.44), fill: c.floor, stroke: c.wall, 'stroke-width': 4}),
      h('path', {d: `M${r(-s * 0.46)} ${r(-s * 0.14)}V${r(-s * 0.3)}Q${r(-s * 0.46)} ${r(-s * 0.36)} ${r(-s * 0.4)} ${r(-s * 0.36)}H${r(-s * 0.24)}Z`, fill: th.accent2}));
  }
  const b = buildingElevation(ctx, {name, x: -s * 0.46, y: -s * 0.42, w: s * 0.92, h: s * 0.84, floors: 2, bays: 3, tree: false});
  return b.node;
}

/* ------------------------------------------------------------------ */
/* Info blocks (legend rows, keyed notes, state tag, key)              */
/* ------------------------------------------------------------------ */

/**
 * Measure a vertical stack of info items for a column width `w` at size F.
 * Items: {type:'legend', kind, text} | {type:'note', i, text, color} |
 * {type:'state', text} | {type:'key', text} | {type:'text', text, weight?}.
 * Returns null when an item would be truncated or break a word.
 */
export function measureInfo(items, w, F) {
  const gap = F * 0.6;
  const glyph = F * 2;
  const out = [];
  for (const it of items) {
    let fit, hh;
    if (it.type === 'legend') {
      fit = fitG(it.text, {maxWidth: w - glyph - F * 0.6, size: F, minSize: F, maxLines: 4, weight: 500});
      hh = Math.max(glyph, fit.height);
    } else if (it.type === 'note') {
      fit = fitG(it.text, {maxWidth: w - F * 1.9, size: F, minSize: F, maxLines: 5, weight: 500});
      hh = fit.height;
    } else if (it.type === 'state') {
      fit = fitG(it.text, {maxWidth: w - F * 1.1 - 4, size: F, minSize: F, maxLines: 4, weight: 700});
      hh = cardH(fit, F);
    } else {
      fit = fitG(it.text, {maxWidth: w - 4, size: F, minSize: F, maxLines: 5, weight: it.type === 'key' ? 500 : (it.weight ?? 600)});
      hh = fit.height + (it.type === 'key' ? F * 0.5 : 0);
    }
    if (!fitOk(fit)) return null;
    out.push({...it, fit, h: hh});
  }
  const height = out.reduce((a, it) => a + it.h, 0) + gap * Math.max(0, out.length - 1) + (out.length ? F * 0.3 : 0);
  return {items: out, height, gap, glyph, w};
}

/**
 * Draw a measured info stack at (x, y). Each item is a named group
 * `${prefix}${type}${index}` so the scene can fade it.
 */
export function drawInfo(ctx, m, x, y, F, prefix) {
  const th = ctx.theme;
  const nodes = [];
  const boxes = [];
  let cy = y;
  m.items.forEach((it, i) => {
    const name = `${prefix}${it.type}${i}`;
    let node;
    if (it.type === 'legend') {
      const gl = legendGlyph(ctx, it.kind, m.glyph * 0.9, `${name}-gl`);
      node = g({name}, g({transform: T(x + m.glyph / 2, cy + it.h / 2)}, gl), textAt(it.fit, x + m.glyph + F * 0.6, cy + (it.h - it.fit.height) / 2, th.fg));
    } else if (it.type === 'note') {
      const rr = F * 0.6;
      node = g({name}, h('circle', {cx: r(x + rr + 2), cy: r(cy + F * 0.55), r: r(rr), fill: 'none', stroke: it.color, 'stroke-width': 4, 'stroke-dasharray': '7 5'}), textAt(it.fit, x + F * 1.9, cy, th.fg));
    } else if (it.type === 'state') {
      node = labelCard(ctx, it.fit, {x, y: cy, size: F, fill: th.card, stroke: th.accent4, name}).node;
    } else if (it.type === 'key') {
      node = g({name}, h('path', {d: `M${r(x)} ${r(cy)}H${r(x + Math.min(m.w, it.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(it.fit, x, cy + F * 0.5, th.fgSoft, {italic: true}));
    } else {
      node = g({name}, textAt(it.fit, x, cy, th.fg));
    }
    nodes.push({name, node, type: it.type});
    boxes.push({x, y: cy, w: m.w, h: it.h, name});
    cy += it.h + m.gap;
  });
  return {nodes, boxes, bottom: cy - m.gap};
}
