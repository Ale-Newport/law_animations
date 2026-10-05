/**
 * "Límites de revisión" kit (LAW-0333..0336, review-04): geometry, art and text helpers shared by the four entries.
 *
 * The motif's objects (all original vector art):
 *  - RESOLUCIÓN: a placeholder decision sheet whose numbered sections (apartados) are editable, supplied tags; the
 *    sheet's other lines are simulated filler bars only.
 *  - MARCO / FILTRO: an expandable review frame (four slate rails with grip knobs) holding a neutral, lightly tinted
 *    filter glass. The frame only shows the scope SUPPLIED by the author (`routes.from` .. `routes.to`): it encloses
 *    those sections and nothing else. No doctrine about what a review may or may not cover is drawn or implied.
 *  - FLECHAS: two arrow tags, one per supplied question (● question A / ◆ question B — equal size, ink and weight),
 *    each pointing at the section it refers to (as supplied). Whether its tip lies inside or outside the frame is
 *    pure geometry of the supplied data, captioned "as supplied"; nothing is admitted, rejected, decided or found.
 *  - CALENDARIO: a small desk calendar, a fixture only (blank grid, no date marked, no time limit implied).
 *
 * The kit owns geometry, art and text fitting only. Each entry owns its own composition, timeline and semantics.
 * Text is wrapped word-glue-aware (numbers and closing punctuation stay with their word; nothing breaks mid-word).
 * @module animations/review/kits/limites-de-revision
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf} from '../../../schemas/fields.js';
import {FONTS, measure} from '../../../core/text.js';
import {shade} from '../../../primitives/paper.js';

/* ------------------------------------------------------------------ */
/* Fields, defaults, localisation                                      */
/* ------------------------------------------------------------------ */

/** Category fields shared by the four entries (brief: decisions, grounds, routes, outcomes). */
export const lrFields = {
  decisions: obj('The decision under review (fictional; placeholder text only)', {
    title: str('Name of the decision printed on the sheet (fictional, as supplied)', 70),
    sections: list('The decision\'s numbered sections (apartados), top to bottom (editable placeholder tags, as supplied)', str('Section tag (placeholder)', 56), 3, 6),
  }, ['title', 'sections']),
  grounds: list('The two questions supplied by the author (● A, ◆ B — equal weight). Each arrow points at the section it refers to (as supplied); nothing is decided about it', obj('Question', {
    side: oneOf('a (question A, ●) or b (question B, ◆)', ['a', 'b']),
    text: str('Text of the question (as supplied)', 80),
    section: int('Index in `decisions.sections` the arrow points at', 0, 5),
  }, ['side', 'text', 'section']), 2, 2),
  routes: obj('The review frame: the first and last section it encloses (indices in `decisions.sections`, as supplied). The frame shows the supplied scope only', {
    from: int('First enclosed section (index)', 0, 5),
    to: int('Last enclosed section (index)', 0, 5),
  }, ['from', 'to']),
  outcomes: obj('Captions of where an arrow\'s tip lies (descriptive geometry only, as supplied)', {
    inside: str('Caption for an arrow whose section lies inside the frame', 70),
    outside: str('Caption for an arrow whose section lies outside the frame', 70),
  }, ['inside', 'outside']),
  labels: obj('Editable captions', {
    frame: str('Caption of the review frame (keep "as supplied")', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['frame', 'key']),
};

export const LR_EN = {
  decisions: {title: 'Decision under review (fictional)', sections: ['Section 1 (supplied text)', 'Section 2 (supplied text)', 'Section 3 (supplied text)', 'Section 4 (supplied text)', 'Section 5 (supplied text)']},
  grounds: [
    {side: 'a', text: 'Question A (fictional, as supplied)', section: 1},
    {side: 'b', text: 'Question B (fictional, as supplied)', section: 3},
  ],
  routes: {from: 1, to: 2},
  outcomes: {inside: 'Its section lies inside the frame (as supplied)', outside: 'Its section lies outside the frame (as supplied)'},
  labels: {frame: 'Review frame: the sections it encloses are supplied', key: 'As supplied · no conclusion drawn'},
};

export const LR_ES = {
  decisions: {title: 'Resolución revisada (ficticia)', sections: ['Apartado 1 (texto aportado)', 'Apartado 2 (texto aportado)', 'Apartado 3 (texto aportado)', 'Apartado 4 (texto aportado)', 'Apartado 5 (texto aportado)']},
  grounds: [
    {side: 'a', text: 'Cuestión A (ficticia, según lo aportado)', section: 1},
    {side: 'b', text: 'Cuestión B (ficticia, según lo aportado)', section: 3},
  ],
  routes: {from: 1, to: 2},
  outcomes: {inside: 'Su apartado queda dentro del marco (según lo aportado)', outside: 'Su apartado queda fuera del marco (según lo aportado)'},
  labels: {frame: 'Marco de revisión: los apartados que abarca son aportados', key: 'Según lo aportado · sin conclusión'},
};

/**
 * Untouched English defaults follow `locale: 'es'` (whole field, or per property of an object field).
 * @param {any} ctx
 * @param {Record<string, any>} en
 * @param {Record<string, any>} es
 */
export function localisedLr(ctx, en, es) {
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

/**
 * Normalised scope and questions: the range is clamped to the sections and ordered; each question's section is
 * clamped; `inside` is plain containment of the supplied index in the supplied range.
 * @param {any} P localised params
 */
export function resolveLr(P) {
  const n = P.decisions.sections.length;
  const cl = i => Math.max(0, Math.min(n - 1, i | 0));
  const a = cl(P.routes.from), b = cl(P.routes.to);
  const from = Math.min(a, b), to = Math.max(a, b);
  const qs = ['a', 'b'].map((side, i) => {
    const q = P.grounds.find(x => x.side === side) || P.grounds[i];
    const section = cl(q.section);
    return {side, text: q.text, section, inside: section >= from && section <= to};
  });
  return {n, from, to, qs};
}

/* ------------------------------------------------------------------ */
/* Text: glue-aware wrap and bounded fit                               */
/* ------------------------------------------------------------------ */

const GLUE_NEXT = /^(\d[\w.,;:)\]]*|[)\].,;:!?»”]+|[–—-]\d+[\w)]*)$/u;
const GLUE_PREV = /^(§|nº|n\.º|no\.|«|“|\()$/iu;

/** Tokens merged into unbreakable units (numbers and closing punctuation stay with their word). */
function units(text) {
  const toks = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const out = [];
  for (const t of toks) {
    if (out.length && (GLUE_NEXT.test(t) || GLUE_PREV.test(out[out.length - 1].split(' ').pop()))) out[out.length - 1] += ` ${t}`;
    else out.push(t);
  }
  return out;
}

/**
 * Greedy wrap over glued units; never breaks inside a word. `over` is set when a unit is wider than the box.
 * @returns {{lines:string[], over:boolean}}
 */
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
  // avoid a one-word widow of <= 3 characters on the last line by pulling a word down
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
 * Bounded fit: wrap, then step the size down (never below minSize). `ok` is false when the text still does not fit
 * (the caller must recompose); in that case the last line is ellipsised and `truncated` is set.
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:'sans'|'serif'|'mono', leading?:number}} o
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
/** Frame rails: one slate for every rail (no colour carries a verdict). */
export const RAIL = '#3b4a5a';
export const RAIL_HI = '#6d7f91';
/** Arrows: the same card and ink for A and B (the ● / ◆ glyphs tell them apart). */
export const ARROW_FILL = '#f4efe4';
/** Neutral note inks (amber and slate-blue; never green or red). */
export const noteColors = th => [th.accent3, th.accent2];
/** Filter glass tint (neutral blue-grey). */
export const glassColor = th => th.accent2;

/* ------------------------------------------------------------------ */
/* Glyphs (equal-weight ● / ◆, and legend icons)                       */
/* ------------------------------------------------------------------ */

/** ● or ◆ of equal area and equal ink. Local origin = centre. */
export function markGlyph(side, R, o = {}) {
  const fill = o.fill ?? INK;
  const stroke = o.stroke ?? '#fff';
  const sw = o.sw ?? Math.max(1.5, R * 0.18);
  if (side === 'a') return h('circle', {cx: 0, cy: 0, r: r(R), fill, stroke, 'stroke-width': r(sw, 2)});
  const d = R * Math.sqrt(Math.PI / 2); // same area as the disc
  return h('path', {d: `M0 ${r(-d)}L${r(d)} 0L0 ${r(d)}L${r(-d)} 0Z`, fill, stroke, 'stroke-width': r(sw, 2), 'stroke-linejoin': 'round'});
}

/** Legend icon (size s, local origin = icon centre). kinds: frame, filter, calendar, hand, a, b, inside, outside, sheet, ring. */
export function legendIcon(ctx, kind, s, o = {}) {
  const th = ctx.theme;
  const k = s / 2;
  if (kind === 'a' || kind === 'b') return g(null, arrowMini(kind, s));
  if (kind === 'frame') {
    return g(null,
      h('rect', {x: r(-k), y: r(-k * 0.72), width: r(s), height: r(k * 1.44), rx: 3, fill: glassColor(th), 'fill-opacity': 0.18, stroke: RAIL, 'stroke-width': r(Math.max(3, s * 0.13), 2)}),
    );
  }
  if (kind === 'filter') {
    return g(null,
      h('rect', {x: r(-k), y: r(-k * 0.72), width: r(s), height: r(k * 1.44), rx: 3, fill: glassColor(th), 'fill-opacity': 0.32, stroke: shade(glassColor(th), -0.2), 'stroke-width': 1.5}),
      h('path', {d: `M${r(-k * 0.6)} ${r(k * 0.45)}L${r(-k * 0.1)} ${r(-k * 0.45)}M${r(-k * 0.1)} ${r(k * 0.45)}L${r(k * 0.4)} ${r(-k * 0.45)}`, stroke: '#fff', 'stroke-width': 2, opacity: 0.8}),
    );
  }
  if (kind === 'calendar') return g({transform: T(-k, -k * 0.9)}, calendarArt(ctx, s, s * 0.9, false));
  if (kind === 'hand') {
    return g(null,
      h('path', {d: `M${r(-k * 0.55)} ${r(k * 0.9)}L${r(-k * 0.55)} ${r(-k * 0.1)}Q${r(-k * 0.55)} ${r(-k * 0.6)} ${r(-k * 0.2)} ${r(-k * 0.6)}L${r(-k * 0.2)} ${r(-k * 0.95)}Q${r(0)} ${r(-k * 1.1)} ${r(k * 0.2)} ${r(-k * 0.95)}L${r(k * 0.2)} ${r(-k * 0.55)}Q${r(k * 0.55)} ${r(-k * 0.65)} ${r(k * 0.6)} ${r(-k * 0.2)}L${r(k * 0.6)} ${r(k * 0.9)}Z`, fill: '#e0ac85', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    );
  }
  if (kind === 'inside' || kind === 'outside') {
    const R = s * 0.16;
    return g(null,
      h('rect', {x: r(-k * 0.9), y: r(-k * 0.7), width: r(k * 1.1), height: r(k * 1.4), rx: 2, fill: glassColor(th), 'fill-opacity': 0.2, stroke: RAIL, 'stroke-width': 3}),
      h('circle', {cx: r(kind === 'inside' ? -k * 0.35 : k * 0.62), cy: 0, r: r(R), fill: INK}),
    );
  }
  if (kind === 'pip') return g(null, indexPip(o.index ?? 0, s * 0.46));
  if (kind === 'ring') return h('circle', {cx: 0, cy: 0, r: r(k * 0.7), fill: 'none', stroke: o.color ?? th.accent3, 'stroke-width': 4});
  if (kind === 'sheet') return h('path', {d: roundRectPath(-k * 0.7, -k, k * 1.4, s, 3), fill: th.paper, stroke: INK, 'stroke-width': 2});
  return null;
}

function arrowMini(side, s) {
  const k = s / 2;
  return g(null,
    h('path', {d: `M${r(-k)} ${r(-k * 0.42)}H${r(k * 0.25)}V${r(-k * 0.75)}L${r(k)} 0L${r(k * 0.25)} ${r(k * 0.75)}V${r(k * 0.42)}H${r(-k)}Z`, fill: ARROW_FILL, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    g({transform: T(-k * 0.38, 0)}, markGlyph(side, s * 0.17, {stroke: ARROW_FILL, sw: 1})),
  );
}

/* ------------------------------------------------------------------ */
/* Decision sheet                                                      */
/* ------------------------------------------------------------------ */

/**
 * Sheet model: fitted title and section rows of one shared height.
 * @param {any} ctx
 * @param {{w:number, F:number, minF?:number, title:string, sections:string[], showText:boolean, bars?:number, titleLines?:number, rowLines?:number}} o
 */
export function sheetModel(ctx, o) {
  const {w, F} = o;
  const pad = Math.max(18, F * 0.95);
  const inner = w - pad * 2;
  const minF = o.minF ?? F;
  const ok = [];
  const title = o.showText ? fitG(o.title, {maxWidth: inner - F * 0.6, size: F * 1.08, minSize: minF, maxLines: o.titleLines ?? 2, weight: 700, family: 'serif'}) : null;
  if (title) ok.push(title.ok);
  const titleH = title ? title.height : F * 0.75;
  const railT = o.railT ?? Math.max(12, F * 0.62);
  const rowGap = railT + Math.max(o.compact ? 5 : 8, F * (o.compact ? 0.3 : 0.5));
  const head = pad * 0.85 + titleH + F * 0.55 + rowGap;
  const pipR = F * 0.62;
  const pips = o.pips !== false;
  const textW = pips ? inner - pipR * 2 - F * 0.5 : inner;
  const fits = o.sections.map(s => (o.showText ? fitG(s, {maxWidth: textW, size: F, minSize: minF, maxLines: o.rowLines ?? 2, weight: 600}) : null));
  fits.forEach(f => f && ok.push(f.ok));
  const textH = Math.max(F, ...fits.map(f => (f ? f.height : F * 0.62)));
  const bars = o.bars ?? 2;
  const barH = Math.max(7, F * 0.3);
  const rowPad = F * (o.compact ? 0.3 : 0.5);
  const rowH = rowPad * 2 + textH + (bars ? F * 0.42 + bars * barH + (bars - 1) * barH * 0.9 : 0);
  const rows = o.sections.map((s, i) => {
    const y = head + i * (rowH + rowGap);
    return {i, y, h: rowH, cy: y + rowH / 2, fit: fits[i]};
  });
  const hh = head + o.sections.length * rowH + (o.sections.length - 1) * rowGap + pad * 0.9;
  return {w, h: hh, pad, inner, title, titleH, head, rows, rowH, rowGap, railT, pips, textW, textH, pipR, bars, barH, rowPad, F, ok: ok.every(Boolean)};
}

/**
 * Sheet node (local origin = top-left of the sheet). `rowText(i)` may veto a row's text (lens copies omit supplied
 * text they would cut). Section pips carry the 1-based index as a mark (not text) via notches.
 * @param {any} ctx
 * @param {ReturnType<typeof sheetModel>} M
 * @param {{prefix:string, showText:boolean, rowText?:(i:number)=>boolean, titleText?:boolean, seedKey?:string}} o
 */
export function sheetNode(ctx, M, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const seedKey = o.seedKey ?? 'lr-sheet';
  const parts = [];
  parts.push(h('path', {d: roundRectPath(7, 10, M.w, M.h, 8), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(0, 0, M.w, M.h, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.5}));
  // header: title (or a title bar) and a seal-like neutral circle
  if (M.title && o.titleText !== false) parts.push(textAt(M.title, {x: M.pad, y: M.pad * 0.85, fill: INK, name: `${P}-title`}));
  else parts.push(h('rect', {x: M.pad, y: M.pad * 0.85 + M.titleH * 0.2, width: M.inner * 0.62, height: Math.max(10, M.F * 0.55), rx: 4, fill: INK, opacity: 0.75}));
  parts.push(h('line', {x1: M.pad, x2: M.w - M.pad, y1: M.head - M.rowGap / 2, y2: M.head - M.rowGap / 2, stroke: th.paperLine, 'stroke-width': 2}));
  M.rows.forEach((row, i) => parts.push(g({name: `${P}-r${i}`}, rowParts(ctx, M, i, {prefix: P, showText: o.showText, rowText: o.rowText, seedKey}))));
  return g({name: P}, parts);
}


/** Neutral index pip for section i (i+1 notches; a mark, not a verdict). Local origin = centre. */
export function indexPip(i, R) {
  const parts = [h('circle', {cx: 0, cy: 0, r: r(R), fill: '#fff', stroke: INK, 'stroke-width': 2})];
  const n = i + 1;
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / Math.max(n, 1);
    const rr = n === 1 ? 0 : R * 0.48;
    parts.push(h('circle', {cx: r(Math.cos(a) * rr), cy: r(Math.sin(a) * rr), r: r(Math.max(2.5, R * (n > 4 ? 0.15 : 0.19))), fill: INK}));
  }
  return parts;
}

/**
 * The parts of one section row (sheet-local coordinates): band, heading text (or a bar), filler bars and the
 * notched index pip. Used by the sheet and by copies (lens, exploded frame) drawn at the same coordinates.
 */
export function rowParts(ctx, M, i, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const seedKey = o.seedKey ?? 'lr-sheet';
  const row = M.rows[i];
  const rp = [];
  rp.push(h('rect', {x: M.pad * 0.55, y: row.y, width: M.w - M.pad * 1.1, height: row.h, rx: 6, fill: i % 2 ? th.paper : th.paperShade, opacity: i % 2 ? 1 : 0.55}));
  const showRow = row.fit && (!o.rowText || o.rowText(i));
  let ty = row.y + M.rowPad;
  if (showRow) rp.push(textAt(row.fit, {x: M.pad, y: ty, fill: INK, name: `${P}-r${i}-t`}));
  else rp.push(h('rect', {x: M.pad, y: ty + M.F * 0.18, width: Math.min(M.textW, M.textW * (0.55 + 0.3 * ctx.rng(`${seedKey}-h`, i))), height: Math.max(9, M.F * 0.55), rx: 4, fill: INK, opacity: 0.72}));
  ty += M.textH + M.F * 0.42;
  for (let b = 0; b < M.bars; b++) {
    const bw = M.textW * (b === M.bars - 1 ? 0.5 + 0.25 * ctx.rng(`${seedKey}-b`, i * 3 + b) : 0.86 + 0.1 * ctx.rng(`${seedKey}-b`, i * 3 + b));
    rp.push(h('rect', {x: M.pad, y: ty + b * M.barH * 1.9, width: r(bw), height: r(M.barH), rx: r(M.barH / 2), fill: th.paperLine}));
  }
  // section pip: a neutral disc with i+1 notches (an index mark, not a verdict)
  const px = M.w - M.pad - M.pipR, py = row.y + M.rowPad + M.pipR;
  if (M.pips !== false) rp.push(g({transform: T(px, py)}, indexPip(i, M.pipR)));
  return rp;
}

/* ------------------------------------------------------------------ */
/* Frame (marco + filter glass)                                        */
/* ------------------------------------------------------------------ */

/**
 * Frame extents (sheet-local) for an enclosed range.
 * @param {ReturnType<typeof sheetModel>} M
 */
export function frameExtent(M, from, to, o = {}) {
  const t = o.t ?? M.railT;
  const m = o.margin ?? Math.max(16, M.F * 0.9);
  // rails sit centred in the gaps between rows, never over a row's text
  const yTop = M.rows[from].y - (M.rowGap + t) / 2;
  const yBot = M.rows[to].y + M.rowH + (M.rowGap - t) / 2; // top of the bottom rail
  return {x: -m, w: M.w + 2 * m, yTop, yBot, t, m};
}

/**
 * Expandable frame node. Dynamic nodes: `${P}` (group transform), `${P}-top`, `${P}-bot` (rail transforms: y),
 * `${P}-l`, `${P}-r` (side rails: y/height), `${P}-glass` (y/height/opacity), `${P}-shadow`.
 * Local x origin = frame's left outer edge; y values are absolute in the parent (sheet) frame.
 * @param {any} ctx
 * @param {{prefix:string, w:number, t:number, knob?:number, yTop:number, yBot:number}} o
 */
export function frameNode(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {w, t} = o;
  const kn = o.knob ?? t * 1.5;
  const rail = (name, knobSide) => g({name, transform: T(0, name.endsWith('-top') ? o.yTop : o.yBot)},
    h('rect', {x: 0, y: 0, width: r(w), height: r(t), rx: r(t * 0.35), fill: RAIL, stroke: INK, 'stroke-width': 2}),
    h('line', {x1: r(t * 0.6), x2: r(w - t * 0.6), y1: r(t * 0.32), y2: r(t * 0.32), stroke: RAIL_HI, 'stroke-width': 2, 'stroke-linecap': 'round'}),
    knobSide ? h('rect', {x: r(knobSide === 'r' ? w - 2 : -kn + 2), y: r(-t * 0.18), width: r(kn), height: r(t * 1.36), rx: r(t * 0.5), fill: shade(RAIL, 0.15), stroke: INK, 'stroke-width': 2}) : null,
  );
  const hgt = o.yBot + t - o.yTop;
  return g({name: P},
    h('rect', {name: `${P}-shadow`, x: 8, y: r(o.yTop + 10), width: r(w), height: r(hgt), rx: 8, fill: 'none', stroke: th.shadow, 'stroke-width': r(t)}),
    h('rect', {name: `${P}-glass`, x: r(t), y: r(o.yTop + t), width: r(w - 2 * t), height: r(Math.max(0, hgt - 2 * t)), fill: glassColor(th), 'fill-opacity': 0.17, opacity: 0}),
    h('rect', {name: `${P}-l`, x: 0, y: r(o.yTop), width: r(t), height: r(hgt), rx: r(t * 0.35), fill: RAIL, stroke: INK, 'stroke-width': 2}),
    h('rect', {name: `${P}-r`, x: r(w - t), y: r(o.yTop), width: r(t), height: r(hgt), rx: r(t * 0.35), fill: RAIL, stroke: INK, 'stroke-width': 2}),
    rail(`${P}-top`, o.knobs === false ? null : 'r'),
    rail(`${P}-bot`, o.knobs === false ? null : 'l'),
  );
}

/**
 * Frame props for top/bottom rail positions (parent coords) plus glass opacity and lift (0 = laid).
 * @param {string} P
 * @param {{x:number, y:number, yTop:number, yBot:number, t:number, w:number, glass:number, lift?:number, rot?:number, cx?:number, cy?:number}} s
 */
export function frameProps(P, s) {
  const hgt = Math.max(2 * s.t, s.yBot + s.t - s.yTop);
  const lift = s.lift ?? 0;
  const sc = 1 + lift * 0.035;
  const cx = s.w / 2, cy = (s.yTop + s.yBot + s.t) / 2;
  const tr = `${T(s.x + cx, s.y + cy, s.rot ?? 0, sc)} translate(${r(-cx)} ${r(-cy)})`;
  return {
    [P]: {transform: tr},
    [`${P}-top`]: {transform: T(0, s.yTop)},
    [`${P}-bot`]: {transform: T(0, s.yBot)},
    [`${P}-l`]: {y: r(s.yTop), height: r(hgt)},
    [`${P}-r`]: {y: r(s.yTop), height: r(hgt)},
    [`${P}-glass`]: {y: r(s.yTop + s.t), height: r(Math.max(0, hgt - 2 * s.t)), opacity: r(clamp(s.glass), 3)},
    [`${P}-shadow`]: {x: r(4 + lift * 14), y: r(s.yTop + 5 + lift * 18), height: r(hgt), opacity: r(0.7 + lift * 0.3, 3)},
  };
}

/* ------------------------------------------------------------------ */
/* Arrow tags (flechas)                                                */
/* ------------------------------------------------------------------ */

/**
 * Arrow tag pointing right; local origin = the TIP. Node `${prefix}`.
 * @param {any} ctx
 * @param {{prefix:string, side:'a'|'b', len:number, hgt:number}} o
 */
export function arrowNode(ctx, o) {
  const {len, hgt} = o;
  const head = hgt * 0.95;
  const sh = hgt * 0.56;
  const d = `M${r(-len)} ${r(-sh / 2)}H${r(-head)}V${r(-hgt / 2)}L0 0L${r(-head)} ${r(hgt / 2)}V${r(sh / 2)}H${r(-len)}Z`;
  return g({name: o.prefix},
    h('path', {d, transform: 'translate(5 7)', fill: ctx.theme.shadow}),
    h('path', {d, fill: ARROW_FILL, stroke: INK, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    g({transform: T(-len + sh * 0.85, 0)}, markGlyph(o.side, sh * 0.34, {stroke: ARROW_FILL, sw: 1.5})),
  );
}

/* ------------------------------------------------------------------ */
/* Calendar (fixture only)                                             */
/* ------------------------------------------------------------------ */

function calendarArt(ctx, w, hh, rings = true) {
  const th = ctx.theme;
  const top = hh * 0.26;
  const parts = [
    h('path', {d: roundRectPath(0, 0, w, hh, Math.min(8, w * 0.08)), fill: '#fff', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M0 ${r(top)}V${r(Math.min(8, w * 0.08))}Q0 0 ${r(Math.min(8, w * 0.08))} 0H${r(w - Math.min(8, w * 0.08))}Q${r(w)} 0 ${r(w)} ${r(Math.min(8, w * 0.08))}V${r(top)}Z`, fill: th.accent2, stroke: INK, 'stroke-width': 2}),
  ];
  const cols = 5, rowsN = 3;
  const gx = w * 0.12, gy = top + hh * 0.1;
  const cw = (w - gx * 2) / cols, ch = (hh - gy - hh * 0.1) / rowsN;
  for (let i = 0; i < rowsN; i++) for (let j = 0; j < cols; j++) {
    parts.push(h('rect', {x: r(gx + j * cw + cw * 0.18), y: r(gy + i * ch + ch * 0.2), width: r(cw * 0.64), height: r(ch * 0.6), rx: 1.5, fill: th.paperShade}));
  }
  if (rings) for (const fx of [0.3, 0.7]) parts.push(h('rect', {x: r(w * fx - 3), y: r(-hh * 0.08), width: 6, height: r(hh * 0.18), rx: 3, fill: '#5f6b75', stroke: INK, 'stroke-width': 1.2}));
  return parts;
}

/** Desk calendar (local origin = top-left). Blank grid: no date is marked. */
export function calendarNode(ctx, o) {
  return g({name: o.prefix},
    h('path', {d: roundRectPath(5, 7, o.w, o.h, 8), fill: ctx.theme.shadow}),
    calendarArt(ctx, o.w, o.h, true),
  );
}

/* ------------------------------------------------------------------ */
/* Legend panel                                                        */
/* ------------------------------------------------------------------ */

/**
 * Lay out legend rows in a column. Row kinds: heading (bold), item (icon + text, optional `sub` line reserved for a
 * later fade-in), state (outlined tag), key (italic, the neutral key).
 * @param {any} ctx
 * @param {Array<{kind:string, icon?:string, color?:string, text:string, sub?:string, subIcon?:string, name:string}>} rows
 * @param {{w:number, F:number, minF?:number, maxLines?:number}} o
 */
export function panelLayout(ctx, rows, o) {
  const {w, F} = o;
  const iconW = F * 1.7;
  const gap = F * 0.55;
  let y = 0;
  let ok = true;
  const out = rows.map(row => {
    const tw = row.kind === 'state' || row.kind === 'key' ? w - F * 1.2 : w - iconW;
    const fit = fitG(row.text, {maxWidth: tw, size: F, minSize: o.minF ?? F, maxLines: o.maxLines ?? 3, weight: row.kind === 'heading' ? 700 : row.kind === 'key' ? 600 : 500});
    if (!fit.ok) ok = false;
    let sub = null;
    if (row.sub) {
      sub = fitG(row.sub, {maxWidth: tw - F * 1.3, size: F, minSize: o.minF ?? F, maxLines: o.maxLines ?? 3, weight: 600});
      if (!sub.ok) ok = false;
    }
    const pad = row.kind === 'state' ? F * 0.45 : 0;
    const hh = fit.height + pad * 2 + (sub ? F * 0.3 + sub.height : 0);
    const item = {...row, fit, sub, y, h: hh, pad, iconW, tw};
    y += hh + gap;
    return item;
  });
  return {rows: out, h: Math.max(0, y - gap), w, F, ok};
}

/** Panel node (local origin = top-left). Every row is a named group (`row.name`); a sub line is `${name}-sub`. */
export function panelNode(ctx, PL) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, PL.w, row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(PL.w), y1: r(row.y - F * 0.3), y2: r(row.y - F * 0.3), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.7, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, legendIcon(ctx, row.icon, F * 1.15, {color: row.color, index: row.index})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
      if (row.sub) {
        const sy = row.y + row.fit.height + F * 0.3;
        parts.push(g({name: `${row.name}-sub`, opacity: 0},
          g({transform: T(row.iconW + F * 0.55, sy + Math.min(row.sub.height, F * 1.2) / 2)}, legendIcon(ctx, row.subIcon || 'inside', F * 1.0)),
          textAt(row.sub, {x: row.iconW + F * 1.3, y: sy, fill: th.fg})));
      }
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

/**
 * Place the desk calendar in the arrow column (beside the sheet) where no arrow lies: beside the title, at the foot of
 * the column, or in a free gap between the arrows (shrinking a little if needed). Mutates and returns `cal` with `ok`.
 * @param {{x:number,y:number,w:number,h:number}} cal
 * @param {Array<{tip:{y:number}, hgt:number}>} arrows
 * @param {{top:number, bottom:number, head:number}} o  column extent (design y) and the sheet's header height
 */
export function placeCalendar(cal, arrows, o) {
  const clear = (y, hh) => arrows.every(a => a.tip.y - a.hgt / 2 > y + hh + 6 || a.tip.y + a.hgt / 2 < y - 6);
  const w0 = cal.w, h0 = cal.h;
  for (const k of [1, 0.85, 0.72]) {
    const hh = h0 * k;
    const ys = [o.top + Math.max(4, (o.head - hh) / 2), o.bottom - hh - 6];
    const sorted = arrows.map(a => [a.tip.y - a.hgt / 2, a.tip.y + a.hgt / 2]).sort((p, q) => p[0] - q[0]);
    for (let i = 0; i + 1 < sorted.length; i++) ys.push((sorted[i][1] + sorted[i + 1][0]) / 2 - hh / 2);
    for (const y of ys) {
      if (y < o.top || y + hh > o.bottom) continue;
      if (clear(y, hh)) {
        cal.x += (w0 - w0 * k) / 2;
        cal.w = w0 * k; cal.h = hh; cal.y = y; cal.ok = true;
        return cal;
      }
    }
  }
  cal.ok = false;
  return cal;
}
