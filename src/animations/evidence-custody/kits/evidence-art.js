/**
 * Category art kit for "Recogida y custodia de pruebas" (evidence-custody). First motif: evidence-custody-01
 * (LAW-0361..0364). Every later motif of the category can reuse this look:
 *
 *  - BENCH: a top-down evidence bench — a steel-grey table holding a dark green cutting mat with a light grid and
 *    ruler ticks (the category's signature surface; not a desk, not wood).
 *  - GLOVED ARMS: `topArm` from primitives/desk.js dressed with light-blue nitrile gloves and white lab-coat sleeves.
 *  - OBJECTS: generic fictional items drawn top-down (a brass key, a mug, a small wooden box), each with a fixed
 *    attachment point (key bow, mug handle, box eyelet) for a tag's chain.
 *  - TAG: a manila luggage tag with a reinforced hole; its record rows are a short field stub plus a value line that
 *    is either written (ink scribble) or left blank. A text variant prints field / value for enlarged views.
 *  - CHAIN: a metal ball chain (beads over a thin core) from the tag's hole to the object's attachment point.
 *  - BAG: a translucent evidence bag with a slide strip at its mouth and a printed write-on panel; drawn as a back
 *    layer and a front film so contents sit between them.
 *  - LEGEND: a fitted legend panel with category icons (object, bag, tag, chain, glove, custodian, clock, record rows,
 *    note rings), plus glue-aware text fitting (numbers and closing punctuation stay with their word).
 *
 * Neutral by design: no colour or glyph on these props signals validity, admissibility or any legal state. The tag's
 * written / blank rows describe what was supplied, nothing more.
 * @module animations/evidence-custody/kits/evidence-art
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf} from '../../../schemas/fields.js';
import {FONTS, measure} from '../../../core/text.js';
import {shade} from '../../../primitives/paper.js';
import {topArm} from '../../../primitives/desk.js';

/* ------------------------------------------------------------------ */
/* Category fields (brief: items, custodians, timestamps, records)     */
/* ------------------------------------------------------------------ */

export const OBJECT_KINDS = ['key', 'cup', 'box'];

export const ecFields = {
  items: list('The item handled in the scene (fictional). kind picks the drawn object', obj('Item', {
    id: str('Item reference printed in the legend (fictional)', 24),
    label: str('Short description of the item (fictional)', 70),
    kind: oneOf('Drawn object: key, cup or box', OBJECT_KINDS),
  }, ['id', 'label', 'kind']), 1, 1),
  custodians: list('People who handle the item (fictional; descriptive roles only). The first one wears the gloves shown', obj('Custodian', {
    name: str('Name (fictional)', 40),
    role: str('Descriptive role (not a legal finding)', 50),
  }, ['name', 'role']), 1, 2),
  timestamps: list('Times noted by the author (illustrative; no time limit is implied)', obj('Timestamp', {
    label: str('What the time refers to', 50),
    time: str('Time as supplied (illustrative)', 30),
  }, ['label', 'time']), 1, 3),
  records: list('Rows written on the tag, top to bottom. An empty value leaves that row blank (as supplied)', obj('Record row', {
    field: str('Field name printed on the tag', 30),
    value: str('Value written in the row (empty = left blank)', 50),
  }, ['field', 'value']), 2, 5),
};

export const EC_EN = {
  items: [{id: 'Item E-01 (fictional)', label: 'Brass key found on a shelf (fictional)', kind: 'key'}],
  custodians: [{name: 'R. Okoye (fictional)', role: 'Person tagging the item'}],
  timestamps: [{label: 'Tag attached', time: '10:05 (illustrative)'}, {label: 'Item bagged', time: '10:07 (illustrative)'}],
  records: [
    {field: 'Item no.', value: 'E-01'},
    {field: 'Description', value: 'Brass key'},
    {field: 'Collected by', value: 'R. Okoye'},
    {field: 'Time', value: '10:05'},
  ],
};

export const EC_ES = {
  items: [{id: 'Indicio E-01 (ficticio)', label: 'Llave de latón hallada en un estante (ficticia)', kind: 'key'}],
  custodians: [{name: 'R. Okoye (ficticia)', role: 'Persona que etiqueta el objeto'}],
  timestamps: [{label: 'Etiqueta unida', time: '10:05 (ilustrativo)'}, {label: 'Objeto embolsado', time: '10:07 (ilustrativo)'}],
  records: [
    {field: 'N.º de indicio', value: 'E-01'},
    {field: 'Descripción', value: 'Llave de latón'},
    {field: 'Recogido por', value: 'R. Okoye'},
    {field: 'Hora', value: '10:05'},
  ],
};

/**
 * Untouched English defaults follow `locale: 'es'` (whole field, or per property of an object field).
 * @param {any} ctx
 * @param {Record<string, any>} en
 * @param {Record<string, any>} es
 */
export function localised(ctx, en, es) {
  const p = ctx.params;
  if (p.locale !== 'es') return {...p};
  const out = {...p};
  for (const k of Object.keys(es)) {
    if (!(k in en) || !(k in p)) continue;
    if (JSON.stringify(p[k]) === JSON.stringify(en[k])) out[k] = JSON.parse(JSON.stringify(es[k]));
    else if (p[k] && en[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) {
      const o = {...p[k]};
      for (const kk of Object.keys(es[k] || {})) if (JSON.stringify(p[k][kk]) === JSON.stringify(en[k][kk])) o[kk] = es[k][kk];
      out[k] = o;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Text: glue-aware wrap and bounded fit                               */
/* ------------------------------------------------------------------ */

const GLUE_NEXT = /^(\d[\w.,;:)\]]*|[)\].,;:!?»”]+|[–—-]\d+[\w)]*|·)$/u;
const GLUE_PREV = /^(§|nº|n\.º|no\.|«|“|\(|N\.º)$/iu;

function units(text) {
  const toks = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const out = [];
  for (const t of toks) {
    if (out.length && (GLUE_NEXT.test(t) || GLUE_PREV.test(out[out.length - 1].split(' ').pop()))) out[out.length - 1] += ` ${t}`;
    else out.push(t);
  }
  return out;
}

/** Greedy wrap over glued units; never breaks inside a word (`over` = a unit is wider than the box). */
export function wrapG(text, maxWidth, size, weight = 400, family = 'sans') {
  const us = units(text);
  const lines = [];
  let cur = '';
  let over = false;
  for (const u of us) {
    if (measure(u, size, weight, family) > maxWidth + 0.5) over = true;
    const cand = cur ? `${cur} ${u}` : u;
    if (!cur || measure(cand, size, weight, family) <= maxWidth) cur = cand;
    else { lines.push(cur); cur = u; }
  }
  if (cur) lines.push(cur);
  if (lines.length > 1) {
    const last = lines[lines.length - 1];
    if (last.length <= 3) {
      const prev = lines[lines.length - 2].split(' ');
      if (prev.length > 1) {
        const moved = prev.pop();
        const cand = `${moved} ${last}`;
        if (measure(cand, size, weight, family) <= maxWidth) { lines[lines.length - 2] = prev.join(' '); lines[lines.length - 1] = cand; }
      }
    }
  }
  return {lines: lines.length ? lines : [''], over};
}

/**
 * Bounded fit (never below minSize). `ok` is false when the text does not fit; the caller recomposes.
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:string, leading?:number}} o
 */
export function fitG(text, o) {
  const full = String(text ?? '');
  const maxLines = o.maxLines ?? 2;
  const weight = o.weight ?? 500;
  const family = o.family ?? 'sans';
  const leading = o.leading ?? 1.2;
  const minSize = o.minSize ?? o.size;
  const maxWidth = Math.max(10, o.maxWidth);
  let size = o.size;
  let w = wrapG(full, maxWidth, size, weight, family);
  while ((w.lines.length > maxLines || w.over) && size > minSize + 1e-9) {
    size = Math.max(minSize, size - 0.5);
    w = wrapG(full, maxWidth, size, weight, family);
  }
  let lines = w.lines;
  let truncated = false;
  const ok = !(lines.length > maxLines || w.over);
  if (lines.length > maxLines) {
    truncated = true;
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last.length > 1 && measure(`${last}…`, size, weight, family) > maxWidth) last = last.slice(0, -1).trimEnd();
    lines[maxLines - 1] = `${last}…`;
  }
  const width = Math.max(0, ...lines.map(l => measure(l, size, weight, family)));
  const lineHeight = size * leading;
  return {lines, size, lineHeight, width, height: lineHeight * (lines.length - 1) + size, truncated, full, weight, family, ok};
}

/** A fitted text block (`y` = top of the block). */
export function textAt(fit, o) {
  return h('text', {
    name: o.name,
    x: r(o.x), y: r(o.y + fit.size * 0.8),
    'font-family': FONTS[fit.family] || FONTS.sans,
    'font-size': r(fit.size, 2),
    'font-weight': fit.weight,
    'font-style': o.italic ? 'italic' : undefined,
    'text-anchor': o.anchor || 'start',
    fill: o.fill,
    opacity: o.opacity,
  },
  fit.truncated ? h('title', null, fit.full) : null,
  fit.lines.map((line, i) => h('tspan', {x: r(o.x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, line)));
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

export const INK = '#1f2328';
export const STEEL = '#a9b3b6';
export const MAT = '#3f6b5a';
export const MAT_LINE = '#7fa596';
export const GLOVE = '#8fb7dc';
export const GLOVE_CUFF = '#6f9cc6';
export const COAT = '#eef1f3';
export const MANILA = '#ecd6a1';
export const MANILA_DARK = '#c9ad6e';
export const WRITE_INK = '#2a3f7a';
export const METAL = '#9ea5ab';
export const METAL_DARK = '#5d656c';
export const BAG_EDGE = '#6c7c88';
export const BAG_STRIP = '#3d6f99';
/** Neutral note inks (amber and slate-blue; never green or red). */
export const noteColors = th => [th.accent3, th.accent2];

/* ------------------------------------------------------------------ */
/* Bench                                                               */
/* ------------------------------------------------------------------ */

/**
 * Top-down evidence bench: steel table + green cutting mat with grid and ruler ticks. Returns {surface, frame, clip}
 * like `deskWindow` (scenes clip arms/props with `clip`).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, radius?:number, grid?:number}} o
 */
export function benchNode(ctx, o) {
  const {prefix, x, y, w, h: hh} = o;
  const rad = o.radius ?? 24;
  const th = ctx.theme;
  const clipId = `${prefix}-clip`;
  const inset = Math.max(14, Math.min(w, hh) * 0.035);
  const mx = x + inset, my = y + inset, mw = w - inset * 2, mh = hh - inset * 2;
  const step = o.grid ?? clamp(Math.min(mw, mh) / 9, 40, 80);
  const lines = [];
  for (let gx = mx + step; gx < mx + mw - 4; gx += step) lines.push(`M${r(gx)} ${r(my)}V${r(my + mh)}`);
  for (let gy = my + step; gy < my + mh - 4; gy += step) lines.push(`M${r(mx)} ${r(gy)}H${r(mx + mw)}`);
  const ticks = [];
  for (let gx = mx + step / 4; gx < mx + mw - 4; gx += step / 4) ticks.push(`M${r(gx)} ${r(my)}v${r(Math.round((gx - mx) / (step / 4)) % 4 === 0 ? 14 : 7)}`);
  const surface = g({name: `${prefix}-surface`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(x, y, w, hh, rad)}))),
    h('path', {d: roundRectPath(x, y, w, hh, rad), fill: STEEL}),
    h('path', {d: roundRectPath(x + 4, y + 4, w - 8, hh - 8, rad - 3), fill: 'none', stroke: shade(STEEL, 0.25), 'stroke-width': 3}),
    h('path', {d: roundRectPath(mx, my, mw, mh, 14), fill: MAT}),
    h('path', {d: lines.join(''), stroke: MAT_LINE, 'stroke-width': 1.4, opacity: 0.55, fill: 'none'}),
    h('path', {d: ticks.join(''), stroke: MAT_LINE, 'stroke-width': 1.6, opacity: 0.85, fill: 'none'}),
    h('path', {d: roundRectPath(mx, my, mw, mh, 14), fill: 'none', stroke: shade(MAT, -0.3), 'stroke-width': 2}),
  );
  const frame = h('path', {d: roundRectPath(x, y, w, hh, rad), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke * 1.2});
  return {surface, frame, clip: ctx.ref(clipId), mat: {x: mx, y: my, w: mw, h: mh}};
}

/** Gloved top-down arm (light-blue nitrile glove, white coat sleeve). */
export function gloveArm(ctx, o) {
  return topArm(ctx, {name: o.name, skin: GLOVE, sleeve: COAT, cuff: GLOVE_CUFF, handed: o.handed, upper: o.upper, lower: o.lower, width: o.width, handScale: o.handScale ?? 1.3});
}

/* ------------------------------------------------------------------ */
/* Objects                                                             */
/* ------------------------------------------------------------------ */

/**
 * Size model of an object of size S (local origin = centre). `anchor` is where a chain attaches.
 * @param {string} kind
 * @param {number} S
 */
export function objectModel(kind, S) {
  if (kind === 'cup') return {kind, S, w: S * 0.86, h: S * 0.62, anchor: {x: S * 0.37, y: 0}};
  if (kind === 'box') return {kind, S, w: S * 0.84, h: S * 0.6, anchor: {x: S * 0.42, y: -S * 0.2}};
  return {kind: 'key', S, w: S * 1.0, h: S * 0.4, anchor: {x: -S * 0.33, y: 0}};
}

/** Object art (local origin = centre). */
export function objectArt(ctx, M, o = {}) {
  const S = M.S;
  const sw = Math.max(2, S * 0.018);
  if (M.kind === 'cup') {
    const body = '#e7e1d3', band = '#5a7fa8';
    return g({name: o.name},
      h('path', {d: `M${r(S * 0.2)} ${r(-S * 0.09)}C${r(S * 0.46)} ${r(-S * 0.14)} ${r(S * 0.46)} ${r(S * 0.14)} ${r(S * 0.2)} ${r(S * 0.09)}`, fill: 'none', stroke: INK, 'stroke-width': r(S * 0.075), 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(S * 0.2)} ${r(-S * 0.09)}C${r(S * 0.46)} ${r(-S * 0.14)} ${r(S * 0.46)} ${r(S * 0.14)} ${r(S * 0.2)} ${r(S * 0.09)}`, fill: 'none', stroke: body, 'stroke-width': r(S * 0.045), 'stroke-linecap': 'round'}),
      h('circle', {cx: r(-S * 0.06), cy: 0, r: r(S * 0.3), fill: body, stroke: INK, 'stroke-width': sw}),
      h('circle', {cx: r(-S * 0.06), cy: 0, r: r(S * 0.27), fill: 'none', stroke: band, 'stroke-width': r(S * 0.035)}),
      h('circle', {cx: r(-S * 0.06), cy: 0, r: r(S * 0.215), fill: shade(body, -0.14), stroke: shade(body, -0.3), 'stroke-width': 1.5}),
      h('path', {d: `M${r(-S * 0.2)} ${r(-S * 0.1)}a${r(S * 0.16)} ${r(S * 0.16)} 0 0 1 ${r(S * 0.12)} ${r(-S * 0.07)}`, fill: 'none', stroke: '#fff', 'stroke-width': r(S * 0.03), 'stroke-linecap': 'round', opacity: 0.8}),
    );
  }
  if (M.kind === 'box') {
    const wood = '#b07d4f';
    const x0 = -S * 0.4, y0 = -S * 0.28, bw = S * 0.8, bh = S * 0.56;
    return g({name: o.name},
      h('path', {d: roundRectPath(x0, y0, bw, bh, S * 0.04), fill: wood, stroke: INK, 'stroke-width': sw}),
      h('path', {d: roundRectPath(x0 + S * 0.05, y0 + S * 0.05, bw - S * 0.1, bh - S * 0.1, S * 0.03), fill: shade(wood, 0.12), stroke: shade(wood, -0.3), 'stroke-width': 1.5}),
      h('path', {d: `M${r(x0 + S * 0.09)} ${r(-S * 0.08)}H${r(x0 + bw - S * 0.12)}M${r(x0 + S * 0.09)} ${r(S * 0.06)}H${r(x0 + bw - S * 0.16)}`, stroke: shade(wood, -0.18), 'stroke-width': 2, fill: 'none'}),
      h('rect', {x: r(-S * 0.05), y: r(y0 + bh - S * 0.07), width: r(S * 0.1), height: r(S * 0.09), rx: 2, fill: '#c9a54a', stroke: INK, 'stroke-width': 1.5}),
      h('circle', {cx: r(M.anchor.x), cy: r(M.anchor.y), r: r(S * 0.05), fill: METAL, stroke: INK, 'stroke-width': 1.6}),
      h('circle', {cx: r(M.anchor.x), cy: r(M.anchor.y), r: r(S * 0.022), fill: shade(wood, -0.4)}),
    );
  }
  const brass = '#d4a640';
  const bx = -S * 0.33, R = S * 0.17;
  return g({name: o.name},
    h('path', {d: `M${r(-S * 0.18)} ${r(-S * 0.045)}H${r(S * 0.46)}V${r(S * 0.045)}H${r(S * 0.4)}v${r(S * 0.09)}h${r(-S * 0.06)}v${r(-S * 0.05)}h${r(-S * 0.05)}v${r(S * 0.07)}h${r(-S * 0.06)}v${r(-S * 0.07)}H${r(-S * 0.18)}Z`, fill: brass, stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-S * 0.1)} 0H${r(S * 0.4)}`, stroke: shade(brass, -0.25), 'stroke-width': 1.6}),
    h('circle', {cx: r(bx), cy: 0, r: r(R), fill: brass, stroke: INK, 'stroke-width': sw}),
    h('circle', {cx: r(bx), cy: 0, r: r(R * 0.72), fill: 'none', stroke: shade(brass, -0.2), 'stroke-width': 1.6}),
    h('circle', {cx: r(bx), cy: 0, r: r(R * 0.36), fill: MAT, stroke: INK, 'stroke-width': 1.6}),
  );
}

/* ------------------------------------------------------------------ */
/* Tag                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Tag geometry (local origin = hole centre; the tag extends along +x).
 * @param {{w:number, h:number, rows:number}} o  w = tag length, h = tag height
 */
export function tagModel(o) {
  const {w, h: hh, rows: n} = o;
  const x0 = -hh * 0.3, x1 = x0 + w;
  const rx0 = x0 + hh * 0.62, rx1 = x1 - hh * 0.1;
  const ry0 = -hh / 2 + hh * 0.13, ry1 = hh / 2 - hh * 0.11;
  const pitch = (ry1 - ry0) / Math.max(1, n);
  const rows = Array.from({length: n}, (_, i) => ({y: ry0 + pitch * (i + 0.72), top: ry0 + pitch * i, h: pitch}));
  return {w, h: hh, x0, x1, rx0, rx1, rows, pitch, holeR: hh * 0.085, stub: (rx1 - rx0) * 0.3};
}

function tagOutline(T0) {
  const c = T0.h * 0.28, hh = T0.h;
  return `M${r(T0.x0 + c)} ${r(-hh / 2)}H${r(T0.x1 - 6)}Q${r(T0.x1)} ${r(-hh / 2)} ${r(T0.x1)} ${r(-hh / 2 + 6)}V${r(hh / 2 - 6)}Q${r(T0.x1)} ${r(hh / 2)} ${r(T0.x1 - 6)} ${r(hh / 2)}H${r(T0.x0 + c)}L${r(T0.x0)} ${r(hh / 2 - c)}V${r(-hh / 2 + c)}Z`;
}

/** Handwriting-like scribble across [x0, x1] at baseline y (deterministic per seed key). */
export function scribble(ctx, key, x0, x1, y, amp) {
  const n = Math.max(3, Math.round((x1 - x0) / (amp * 1.6)));
  let d = `M${r(x0)} ${r(y)}`;
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((i + 0.5) / n) * (x1 - x0);
    const xb = x0 + ((i + 1) / n) * (x1 - x0);
    const up = amp * (0.6 + ctx.rng(`${key}-a`, i) * 0.6);
    d += `Q${r(xa)} ${r(y - up)} ${r(xb)} ${r(y - (ctx.rng(`${key}-b`, i) - 0.3) * amp * 0.5)}`;
  }
  return d;
}

/**
 * Tag art. Rows: [{filled, len?}] — each row is a field stub + value line; a filled row carries an ink scribble whose
 * drawing can be animated through `${prefix}-w${i}` (stroke-dashoffset, see `tagWriteProps`).
 * With `texts` ([{field, value}] fitted by the caller as {fieldFit, valueFit}), the row prints text instead.
 * @param {any} ctx
 * @param {ReturnType<typeof tagModel>} T0
 * @param {{prefix:string, rows:Array<{filled:boolean, len?:number}>, texts?:Array<{fieldFit:any, valueFit:any}>|null, name?:string, seedKey?:string, writable?:boolean}} o
 */
export function tagArt(ctx, T0, o) {
  const P = o.prefix;
  const hh = T0.h;
  const sw = Math.max(1.6, hh * 0.022);
  const parts = [
    h('path', {d: tagOutline(T0), fill: MANILA, stroke: INK, 'stroke-width': r(sw * 1.2, 2), 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(T0.x0 + hh * 0.5)} ${r(-hh / 2 + 3)}V${r(hh / 2 - 3)}`, stroke: MANILA_DARK, 'stroke-width': 1.4, opacity: 0.8}),
    h('circle', {cx: 0, cy: 0, r: r(T0.holeR * 1.9), fill: shade(MANILA, -0.1), stroke: MANILA_DARK, 'stroke-width': 1.6}),
    h('circle', {cx: 0, cy: 0, r: r(T0.holeR), fill: MAT, stroke: INK, 'stroke-width': 1.4}),
  ];
  const key = o.seedKey || P;
  o.rows.forEach((row, i) => {
    const R = T0.rows[i];
    if (o.texts) {
      const t = o.texts[i];
      parts.push(h('line', {x1: r(T0.rx0 + T0.stub + 4), x2: r(T0.rx1), y1: r(R.y + 2), y2: r(R.y + 2), stroke: MANILA_DARK, 'stroke-width': 1.2}));
      parts.push(textAt(t.fieldFit, {x: T0.rx0, y: R.y - t.fieldFit.size * 0.86, fill: '#5b4a2a'}));
      if (row.filled) parts.push(g({name: `${P}-w${i}`}, textAt(t.valueFit, {x: T0.rx0 + T0.stub + 8, y: R.y - t.valueFit.size * 0.86, fill: WRITE_INK})));
      else parts.push(g({name: `${P}-w${i}`}));
      return;
    }
    parts.push(h('path', {d: `M${r(T0.rx0)} ${r(R.y)}h${r(T0.stub * 0.82)}`, stroke: '#7a6640', 'stroke-width': r(Math.max(2, R.h * 0.16), 2), 'stroke-linecap': 'round'}));
    parts.push(h('line', {x1: r(T0.rx0 + T0.stub + 4), x2: r(T0.rx1), y1: r(R.y + 2), y2: r(R.y + 2), stroke: MANILA_DARK, 'stroke-width': 1.4}));
    if (row.filled || o.writable) {
      const len = clamp(row.len ?? 0.8, 0.3, 1);
      const xs = T0.rx0 + T0.stub + 8;
      const d = scribble(ctx, `${key}-${i}`, xs, xs + (T0.rx1 - xs - 4) * len, R.y, Math.min(R.h * 0.4, hh * 0.09));
      parts.push(h('path', {name: `${P}-w${i}`, d, fill: 'none', stroke: WRITE_INK, 'stroke-width': r(Math.max(1.8, hh * 0.02), 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 100, 'stroke-dasharray': '100 102', 'stroke-dashoffset': row.filled ? 0 : 100}));
    }
  });
  return g({name: o.name}, parts);
}

/** Frame props: draw progress (0..1) of each writable row's scribble. */
export function tagWriteProps(prefix, progress) {
  const out = {};
  progress.forEach((p, i) => { if (p !== null && p !== undefined) out[`${prefix}-w${i}`] = {'stroke-dashoffset': r(100 * (1 - clamp(p)), 2)}; });
  return out;
}

/* ------------------------------------------------------------------ */
/* Chain                                                               */
/* ------------------------------------------------------------------ */

/** Ball chain node (core + beads); animate `d` of `${name}-core` / `${name}-beads` with `chainD`. */
export function chainNode(name, o = {}) {
  const bw = o.bead ?? 7;
  return g({name},
    h('path', {name: `${name}-core`, fill: 'none', stroke: METAL_DARK, 'stroke-width': r(bw * 0.3, 2), 'stroke-linecap': 'round'}),
    h('path', {name: `${name}-beads`, fill: 'none', stroke: METAL, 'stroke-width': bw, 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(bw * 1.35, 2)}`}),
  );
}

/** Quadratic chain path from a to b sagging by `sag` (perpendicular, toward +y in screen space). */
export function chainD(a, b, sag) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const d = `M${r(a.x)} ${r(a.y)}Q${r(mx)} ${r(my + sag)} ${r(b.x)} ${r(b.y)}`;
  return d;
}

/** Frame props for a chain between a and b. */
export function chainProps(name, a, b, sag) {
  const d = chainD(a, b, sag);
  return {[`${name}-core`]: {d}, [`${name}-beads`]: {d}};
}

/* ------------------------------------------------------------------ */
/* Bag                                                                 */
/* ------------------------------------------------------------------ */

/** Bag geometry (local origin = top-left). The mouth is the top edge; the write-on panel sits at the bottom. */
export function bagModel(w, hh) {
  const strip = Math.max(10, hh * 0.06);
  const panel = {x: w * 0.1, y: hh * 0.72, w: w * 0.8, h: hh * 0.2};
  return {w, h: hh, strip, panel, inner: {x: w * 0.08, y: strip * 2.6, w: w * 0.84, h: panel.y - strip * 2.6 - hh * 0.03}};
}

/** Bag back layer (shadow + inner film). */
export function bagBack(ctx, B, o) {
  return g({name: o.name},
    h('path', {d: roundRectPath(8, 12, B.w, B.h, 16), fill: '#000', opacity: 0.16}),
    h('path', {d: roundRectPath(0, 0, B.w, B.h, 16), fill: '#dfe7ec', opacity: 0.85, stroke: BAG_EDGE, 'stroke-width': 2.5}),
  );
}

/** Bag front layer (sheen film, slide strip, printed write-on panel with filler lines). */
export function bagFront(ctx, B, o) {
  const P = B.panel;
  const lines = [0.32, 0.56, 0.8].map(k => `M${r(P.x + P.w * 0.06)} ${r(P.y + P.h * k)}H${r(P.x + P.w * 0.94)}`).join('');
  return g({name: o.name},
    h('path', {d: roundRectPath(0, 0, B.w, B.h, 16), fill: '#ffffff', opacity: 0.18}),
    h('path', {d: `M${r(B.w * 0.12)} ${r(B.h * 0.12)}L${r(B.w * 0.22)} ${r(B.h * 0.6)}`, stroke: '#fff', 'stroke-width': r(Math.max(6, B.w * 0.03)), 'stroke-linecap': 'round', opacity: 0.45}),
    h('rect', {x: 6, y: r(B.strip * 0.9), width: r(B.w - 12), height: r(B.strip), rx: r(B.strip / 2), fill: BAG_STRIP, stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(P.x, P.y, P.w, P.h, 8), fill: '#fbfaf6', stroke: BAG_EDGE, 'stroke-width': 1.8}),
    h('path', {d: lines, stroke: '#b9c2c8', 'stroke-width': 2, fill: 'none'}),
    h('path', {d: roundRectPath(0, 0, B.w, B.h, 16), fill: 'none', stroke: BAG_EDGE, 'stroke-width': 2.5}),
  );
}

/* ------------------------------------------------------------------ */
/* Legend icons and panel                                              */
/* ------------------------------------------------------------------ */

/**
 * Small legend icon centred at the origin, size s.
 * kinds: object-key|object-cup|object-box, bag, tag, chain, glove, custodian, clock, row-filled, row-blank, ring, state
 */
export function legendIcon(ctx, kind, s, o = {}) {
  if (kind.startsWith('object-')) {
    const M = objectModel(kind.slice(7), s * 1.05);
    return objectArt(ctx, M);
  }
  if (kind === 'bag') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.36, -s * 0.46, s * 0.72, s * 0.92, 4), fill: '#dfe7ec', stroke: BAG_EDGE, 'stroke-width': 2}),
      h('rect', {x: r(-s * 0.32), y: r(-s * 0.38), width: r(s * 0.64), height: r(s * 0.1), rx: 2, fill: BAG_STRIP}),
      h('rect', {x: r(-s * 0.26), y: r(s * 0.14), width: r(s * 0.52), height: r(s * 0.22), rx: 2, fill: '#fbfaf6', stroke: BAG_EDGE, 'stroke-width': 1.2}),
    );
  }
  if (kind === 'tag' || kind === 'row-filled' || kind === 'row-blank') {
    const T0 = tagModel({w: s * 1.0, h: s * 0.56, rows: kind === 'tag' ? 2 : 1});
    const rows = kind === 'tag' ? [{filled: true}, {filled: true}] : [{filled: kind === 'row-filled', len: 0.9}];
    return g({transform: T(-s * 0.36, 0)}, tagArt(ctx, T0, {prefix: `ico-${o.key || kind}`, rows, seedKey: 'legend'}));
  }
  if (kind === 'chain') {
    return g(null,
      h('path', {d: `M${r(-s * 0.45)} ${r(-s * 0.1)}Q0 ${r(s * 0.4)} ${r(s * 0.45)} ${r(-s * 0.1)}`, fill: 'none', stroke: METAL_DARK, 'stroke-width': 1.5}),
      h('path', {d: `M${r(-s * 0.45)} ${r(-s * 0.1)}Q0 ${r(s * 0.4)} ${r(s * 0.45)} ${r(-s * 0.1)}`, fill: 'none', stroke: METAL, 'stroke-width': r(s * 0.16), 'stroke-linecap': 'round', 'stroke-dasharray': `0.01 ${r(s * 0.21)}`}),
    );
  }
  if (kind === 'glove') {
    return g(null,
      h('path', {d: `M${r(-s * 0.2)} ${r(s * 0.45)}V${r(-s * 0.05)}L${r(-s * 0.32)} ${r(-s * 0.22)}Q${r(-s * 0.3)} ${r(-s * 0.32)} ${r(-s * 0.2)} ${r(-s * 0.26)}L${r(-s * 0.12)} ${r(-s * 0.16)}V${r(-s * 0.44)}H${r(s * 0.2)}V${r(s * 0.45)}Z`, fill: GLOVE, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
      h('rect', {x: r(-s * 0.24), y: r(s * 0.3), width: r(s * 0.48), height: r(s * 0.16), fill: GLOVE_CUFF, stroke: INK, 'stroke-width': 1.4}),
    );
  }
  if (kind === 'custodian') {
    return g(null,
      h('circle', {cx: 0, cy: r(-s * 0.16), r: r(s * 0.18), fill: '#c9b8a6', stroke: INK, 'stroke-width': 1.8}),
      h('path', {d: `M${r(-s * 0.34)} ${r(s * 0.42)}Q${r(-s * 0.32)} ${r(s * 0.06)} 0 ${r(s * 0.06)}Q${r(s * 0.32)} ${r(s * 0.06)} ${r(s * 0.34)} ${r(s * 0.42)}Z`, fill: COAT, stroke: INK, 'stroke-width': 1.8}),
    );
  }
  if (kind === 'clock') {
    return g(null,
      h('circle', {cx: 0, cy: 0, r: r(s * 0.38), fill: '#fbfaf6', stroke: INK, 'stroke-width': 2}),
      h('path', {d: `M0 ${r(-s * 0.24)}V0L${r(s * 0.16)} ${r(s * 0.1)}`, fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round'}),
    );
  }
  if (kind === 'ring') {
    return h('rect', {x: r(-s * 0.36), y: r(-s * 0.28), width: r(s * 0.72), height: r(s * 0.56), rx: 6, fill: 'none', stroke: o.color, 'stroke-width': 3.5});
  }
  return h('circle', {r: r(s * 0.2), fill: INK});
}

/**
 * Legend panel layout. Rows: {kind:'heading'|'item'|'state'|'key', icon?, text, name, color?, sub?}.
 * @param {any} ctx
 * @param {any[]} rows
 * @param {{w:number, F:number, maxLines?:number}} o
 */
export function panelLayout(ctx, rows, o) {
  const {w, F} = o;
  const iconW = F * 1.9;
  const gap = F * 0.5;
  let y = 0;
  let ok = true;
  const out = rows.map(row => {
    const tw = row.kind === 'state' || row.kind === 'key' ? w - F * 1.2 : w - iconW;
    const fit = fitG(row.text, {maxWidth: tw, size: F, minSize: F, maxLines: o.maxLines ?? 3, weight: row.kind === 'heading' ? 700 : row.kind === 'key' ? 600 : 500});
    if (!fit.ok) ok = false;
    const pad = row.kind === 'state' ? F * 0.45 : 0;
    const hh = Math.max(fit.height, row.icon ? F * 1.1 : 0) + pad * 2;
    const item = {...row, fit, y, h: hh, pad, iconW, tw};
    y += hh + gap;
    return item;
  });
  return {rows: out, h: Math.max(0, y - gap), w, F, ok};
}

/** Legend panel node (local origin = top-left). Every row is a named group. */
export function panelNode(ctx, PL) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, PL.w, row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(PL.w), y1: r(row.y - F * 0.28), y2: r(row.y - F * 0.28), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.8, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, legendIcon(ctx, row.icon, F * 1.3, {color: row.color, key: row.name})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}

/** Rounded ring rectangle used to key editorial notes to their targets. */
export function ringRect(b, color, sw = 4) {
  return h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: color, 'stroke-width': r(sw, 2)});
}

/** Axis-aligned box overlap test. */
export function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Round a point for semantics. */
export const R2 = p => ({x: r(p.x), y: r(p.y)});

/** Piecewise hand / prop path: keys [[u, {x,y}], ...]; eased (inOutCubic) between keys. */
export function pathAt(keys, u) {
  if (u <= keys[0][0]) return {...keys[0][1]};
  for (let i = 1; i < keys.length; i++) {
    const [u1, p1] = keys[i];
    if (u <= u1) {
      const [u0, p0] = keys[i - 1];
      const t = u1 > u0 ? (u - u0) / (u1 - u0) : 1;
      const k = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      return {x: p0.x + (p1.x - p0.x) * k, y: p0.y + (p1.y - p0.y) * k};
    }
  }
  return {...keys[keys.length - 1][1]};
}
