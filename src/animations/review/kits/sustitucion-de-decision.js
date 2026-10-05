/**
 * "Sustitución de decisión" kit (LAW-0345..0348, review-07): geometry, art and text helpers shared by the four entries.
 *
 * The motif's objects (all original vector art, seen from above on a registry table):
 *  - RESOLUCIONES: two placeholder decision CARDS of the SAME size, stroke and ink — card A (●, the initial result) and
 *    card B (◆, the later result supplied). They differ only by their glyph and their lane stripe (A slate-blue accent2,
 *    B amber accent3 — never red or green). Their text is ONLY supplied placeholder text; neither is marked as right,
 *    wrong, valid or better. Each carries ORDER PIPS (one dot = supplied first, two dots = supplied later): a sequence
 *    mark, not a ranking.
 *  - The RAIL on the table: an intake tray (where the later card waits), the POSITION held by a slate holder frame with
 *    grips (the brief's "filtros": a neutral frame, never an admission filter) and, abutting it, the HISTORY POCKET with
 *    index tabs, where an earlier card is kept fully visible (the history stays visible).
 *  - FLECHAS: chevrons engraved in the rail between the intake and the position — they only show the direction in which
 *    a card slides along the rail (no institutional route, no appeal, no causation).
 *  - CALENDARIO: a wall calendar, a fixture only (blank grid, no date marked, no time limit implied).
 *
 * Substitution is shown as a supplied fact: the later card is slid into the position and pushes the earlier card into
 * the history pocket (the pocket abuts the position, so the push is physically exact: the later card travels the gap
 * plus one card width, the earlier card exactly one card width). Nothing is evaluated.
 *
 * The kit owns fields, defaults, localisation, text fitting (glue-aware: numbers and closing punctuation stay with their
 * word; nothing breaks mid-word), the card / rail / calendar art and legend icons. Each entry owns its composition,
 * timeline and semantics. The glue-aware wrap is copied from ./limites-de-revision.js and adapted (never imported, so
 * that kit stays unchanged).
 * @module animations/review/kits/sustitucion-de-decision
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, obj} from '../../../schemas/fields.js';
import {FONTS, measure} from '../../../core/text.js';
import {shade} from '../../../primitives/paper.js';
import {changedMarker} from '../../../primitives/markers.js';

/* ------------------------------------------------------------------ */
/* Fields, defaults, localisation                                      */
/* ------------------------------------------------------------------ */

/** Category fields shared by the four entries (brief: decisions, grounds, routes, outcomes). */
export const sdFields = {
  decisions: obj('The two placeholder decision cards (fictional; their content is supplied placeholder text only)', {
    position: str('Name of the position on the board that the cards occupy (fictional)', 70),
    initial: str('Card A (●): the initial result, as supplied (placeholder text)', 90),
    later: str('Card B (◆): the later result supplied, as supplied (placeholder text)', 90),
  }, ['position', 'initial', 'later']),
  grounds: str('Note supplied with the later card (shown as supplied; never assessed)', 90),
  routes: obj('Captions of the places on the rail', {
    intake: str('Caption of the intake tray where the later card waits', 70),
    history: str('Caption of the history pocket where an earlier card is kept, fully visible', 70),
  }, ['intake', 'history']),
  outcomes: obj('Descriptive states shown at the hold (as supplied; no conclusion is drawn)', {
    position: str('State of the card now in the position (as supplied)', 90),
    history: str('State of the card kept in the history (as supplied)', 90),
  }, ['position', 'history']),
  labels: obj('Editable captions', {
    order: str('Note on the order pips (one dot = supplied first, two dots = supplied later)', 90),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['order', 'key']),
};

export const SD_EN = {
  decisions: {
    position: 'Position on the board (fictional)',
    initial: 'Initial result (as supplied; placeholder text)',
    later: 'Later result supplied (as supplied; placeholder text)',
  },
  grounds: 'Note with the later card: supplied by the user (fictional)',
  routes: {intake: 'Intake tray: the later card waits here', history: 'History pocket: an earlier card stays visible'},
  outcomes: {position: 'Now in the position: card B (as supplied)', history: 'Kept in the history: card A (as supplied)'},
  labels: {order: 'Order pips: one dot supplied first, two dots supplied later', key: 'As supplied · no conclusion drawn'},
};

export const SD_ES = {
  decisions: {
    position: 'Posición en el tablero (ficticia)',
    initial: 'Resultado inicial (según lo aportado; texto provisional)',
    later: 'Resultado posterior suministrado (según lo aportado; texto provisional)',
  },
  grounds: 'Nota con la tarjeta posterior: aportada por el usuario (ficticia)',
  routes: {intake: 'Bandeja de entrada: aquí espera la tarjeta posterior', history: 'Bolsillo de historial: una tarjeta anterior sigue visible'},
  outcomes: {position: 'Ya en la posición: tarjeta B (según lo aportado)', history: 'Conservada en el historial: tarjeta A (según lo aportado)'},
  labels: {order: 'Puntos de orden: un punto aportada primero, dos puntos aportada después', key: 'Según lo aportado · sin conclusión'},
};

/**
 * Untouched English defaults follow `locale: 'es'` (whole field, or per property of an object field).
 * @param {any} ctx
 * @param {Record<string, any>} en
 * @param {Record<string, any>} es
 */
export function localisedSd(ctx, en, es) {
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

const GLUE_NEXT = /^(\d[\w.,;:)\]]*|[)\].,;:!?»”·]+|[–—-]\d+[\w)]*)$/u;
const GLUE_PREV = /^(§|nº|n\.º|no\.|«|“|\(|card|tarjeta|Card|Tarjeta|of|de|del|the|a|en|el|la|to)$/u;

/** Tokens merged into unbreakable units (numbers, single letters after "card" and closing punctuation stay with their word). */
function units(text) {
  const toks = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const out = [];
  for (const t of toks) {
    const prev = out.length ? out[out.length - 1].split(' ').pop() : '';
    if (out.length && (GLUE_NEXT.test(t) || GLUE_PREV.test(prev) || /^[A-ZÁÉÍÓÚÑ]\)?[.,;:]?$/.test(t))) out[out.length - 1] += ` ${t}`;
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
  // avoid a one-word widow on the last line by pulling a word down when it fits
  if (lines.length > 1) {
    const last = lines[lines.length - 1];
    if (!last.includes(' ') || last.length <= 6) {
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
  const anchor = o.anchor || 'start';
  return h('text', {
    name: o.name,
    x: r(o.x), y: r(o.y + fit.size * 0.8),
    'font-family': FONTS[fit.family] || FONTS.sans,
    'font-size': r(fit.size, 2),
    'font-weight': fit.weight,
    'font-style': o.italic ? 'italic' : undefined,
    'text-anchor': anchor,
    fill: o.fill,
    opacity: o.opacity,
  },
  fit.truncated ? h('title', null, fit.full) : null,
  fit.lines.map((line, i) => h('tspan', {x: r(o.x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, line)));
}

/* ------------------------------------------------------------------ */
/* Colours and glyphs                                                  */
/* ------------------------------------------------------------------ */

export const INK = '#1f2328';
/** Holder frame rails: one slate for every rail (no colour carries a verdict). */
export const RAIL = '#3b4a5a';
export const RAIL_HI = '#6d7f91';
/** Card paper: the same for both cards. */
export const CARD = '#fffdf8';
/** Lane colours: A slate-blue, B amber (never red or green). */
export const laneColor = (ctx, side) => (side === 'a' ? ctx.theme.accent2 : ctx.theme.accent3);

/** ● or ◆ of equal area and equal ink. Local origin = centre. */
export function markGlyph(side, R, o = {}) {
  const fill = o.fill ?? INK;
  const stroke = o.stroke ?? '#fff';
  const sw = o.sw ?? Math.max(1.5, R * 0.18);
  if (side === 'a') return h('circle', {name: o.name, cx: 0, cy: 0, r: r(R), fill, stroke, 'stroke-width': r(sw, 2)});
  const d = R * Math.sqrt(Math.PI / 2); // same area as the disc
  return h('path', {name: o.name, d: `M0 ${r(-d)}L${r(d)} 0L0 ${r(d)}L${r(-d)} 0Z`, fill, stroke, 'stroke-width': r(sw, 2), 'stroke-linejoin': 'round'});
}

/** Order pips: n dots in a small pill (a sequence mark, not a ranking). Local origin = pill centre. */
export function orderPips(n, R) {
  const k = Math.max(1, n);
  const gap = R * 0.95;
  const w = (k - 1) * gap * 2 + R * 2.6;
  const parts = [h('rect', {x: r(-w / 2), y: r(-R * 1.25), width: r(w), height: r(R * 2.5), rx: r(R * 1.25), fill: '#fff', stroke: INK, 'stroke-width': 1.8})];
  for (let i = 0; i < k; i++) parts.push(h('circle', {cx: r(-(k - 1) * gap + i * gap * 2), cy: 0, r: r(R * 0.62), fill: INK}));
  return parts;
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/**
 * Card model shared by both cards (they always have the SAME size): text fits of A and B at one size.
 * @param {any} ctx
 * @param {{w:number, F:number, minF?:number, maxLines?:number, a:string, b:string, showText:boolean, bars?:number}} o
 */
export function cardModel(ctx, o) {
  const {w, F} = o;
  const pad = Math.max(10, F * (w < F * 9 ? 0.5 : 0.7));
  const stripe = Math.max(7, F * (w < F * 9 ? 0.32 : 0.42));
  const inner = w - pad * 2 - stripe;
  const head = F * 1.4;
  const fit = s => (o.showText ? fitG(s, {maxWidth: inner, size: F, minSize: o.minF ?? F, maxLines: o.maxLines ?? 3, weight: 600}) : null);
  let fa = fit(o.a), fb = fit(o.b);
  // both cards at one size (the smaller of the two)
  if (fa && fb && Math.abs(fa.size - fb.size) > 1e-6) {
    const s = Math.min(fa.size, fb.size);
    fa = fitG(o.a, {maxWidth: inner, size: s, minSize: s, maxLines: o.maxLines ?? 3, weight: 600});
    fb = fitG(o.b, {maxWidth: inner, size: s, minSize: s, maxLines: o.maxLines ?? 3, weight: 600});
  }
  const textH = fa && fb ? Math.max(fa.height, fb.height) : F * 1.9;
  const bars = o.bars ?? 2;
  const barH = Math.max(6, F * 0.3);
  const natural = pad + head + F * 0.35 + textH + (bars ? F * 0.5 + bars * barH + (bars - 1) * barH * 0.9 : 0) + pad;
  const hh = o.fixH ?? Math.max(o.minH ?? 0, natural);
  // a taller card gets more simulated filler lines (never text), up to eight, keeping a blank foot
  let barsN = bars;
  if (!o.fixH && hh > natural + barH * 4) barsN = Math.min(8, bars + Math.floor((hh - natural - barH * 3) / (barH * 1.9)));
  return {w, h: hh, pad, stripe, inner, head, fits: {a: fa, b: fb}, textH, bars: barsN, barH, F, ok: (!fa || fa.ok) && (!fb || fb.ok)};
}

/**
 * Card node (local origin = top-left). Named parts: `${P}` (group), `${P}-body`, `${P}-text`, `${P}-glyph`,
 * `${P}-pips`, `${P}-shadow` (lift shadow).
 * @param {any} ctx
 * @param {ReturnType<typeof cardModel>} M
 * @param {{prefix:string, side:'a'|'b', order:number, text?:boolean, ghost?:boolean, seedKey?:string}} o
 */
export function cardNode(ctx, M, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const lane = laneColor(ctx, o.side);
  const parts = [];
  parts.push(h('path', {name: `${P}-shadow`, d: roundRectPath(5, 7, M.w, M.h, 10), fill: th.shadow}));
  parts.push(h('path', {name: `${P}-body`, d: roundRectPath(0, 0, M.w, M.h, 10), fill: CARD, stroke: INK, 'stroke-width': 2.5}));
  parts.push(h('path', {d: `M10 0H${r(M.stripe + 4)}V${r(M.h)}H10Q0 ${r(M.h)} 0 ${r(M.h - 10)}V10Q0 0 10 0Z`, fill: lane, stroke: INK, 'stroke-width': 2}));
  const x0 = M.stripe + M.pad;
  const gR = M.F * 0.5;
  parts.push(g({transform: T(x0 + gR, M.pad + M.head / 2), name: `${P}-glyph`}, markGlyph(o.side, gR, {stroke: CARD, sw: 1.5, name: `${P}-glyph-g`})));
  parts.push(g({name: `${P}-pips`, transform: T(M.w - M.pad - (o.order - 1) * gR * 0.95 - gR * 1.3, M.pad + M.head / 2)}, orderPips(o.order, gR * 0.62)));
  // a short rule under the head
  parts.push(h('line', {x1: r(x0), x2: r(M.w - M.pad), y1: r(M.pad + M.head + M.F * 0.12), y2: r(M.pad + M.head + M.F * 0.12), stroke: th.paperLine, 'stroke-width': 2}));
  const ty = M.pad + M.head + M.F * 0.35;
  const fit = M.fits[o.side];
  if (fit && o.text !== false) parts.push(textAt(fit, {x: x0, y: ty, fill: INK, name: `${P}-text`}));
  else parts.push(h('rect', {x: r(x0), y: r(ty + M.F * 0.15), width: r(M.inner * 0.72), height: r(Math.max(9, M.F * 0.5)), rx: 4, fill: INK, opacity: 0.7}));
  let by = ty + M.textH + M.F * 0.5;
  for (let b = 0; b < M.bars; b++) {
    const bw = M.inner * (b === M.bars - 1 ? 0.55 + 0.2 * ctx.rng(`${o.seedKey ?? 'sd'}-${o.side}`, b) : 0.88 + 0.08 * ctx.rng(`${o.seedKey ?? 'sd'}-${o.side}`, b));
    parts.push(h('rect', {x: r(x0), y: r(by), width: r(bw), height: r(M.barH), rx: r(M.barH / 2), fill: th.paperLine}));
    by += M.barH * 1.9;
  }
  return g({name: P}, parts);
}

/** Dashed outline of a card (a pending "ghost"; dashes mean pending across the library). Local origin = top-left. */
export function ghostNode(ctx, M, o) {
  const k = o.inflate ?? 0;
  return g({name: o.prefix, opacity: 0, 'data-pending': 1},
    h('path', {d: roundRectPath(-k, -k, M.w + 2 * k, M.h + 2 * k, 10 + k), fill: 'none', stroke: laneColor(ctx, o.side), 'stroke-width': 4, 'stroke-dasharray': '14 10'}));
}

/* ------------------------------------------------------------------ */
/* Rail: intake tray, position holder (frame), history pocket          */
/* ------------------------------------------------------------------ */

/**
 * Rail geometry in rail-local coordinates (origin = rail's top-left), horizontal (axis 'x') or vertical (axis 'y').
 * Along the rail: the intake tray, a gap (with chevrons), then ONE channel holding the position (its first half,
 * enclosed by the holder frame) and the history pocket (its second half). The position card and the history card abut,
 * so a card pushed out of the position lands exactly in the pocket.
 * @param {{cw:number, ch:number, gap:number, inset?:number, margin?:number, axis?:'x'|'y'}} o
 */
export function railGeometry(o) {
  const ins = o.inset ?? 12;
  const m = o.margin ?? 14;
  const axis = o.axis ?? 'x';
  const X = axis === 'x';
  const along = X ? o.cw : o.ch;
  const across = X ? o.ch : o.cw;
  const box = (a0, len) => (X ? {x: a0, y: m, w: len, h: across + ins * 2} : {x: m, y: a0, w: across + ins * 2, h: len});
  const intake = box(m, along + ins * 2);
  const c0 = m + along + ins * 2 + o.gap;
  const channel = box(c0, along * 2 + ins * 2);
  const position = box(c0, along + ins);
  const history0 = box(c0 + along + ins, along + ins);
  // the pocket is a distinct, deeper receptacle: it reaches into the rail's margin across the rail
  const ext = Math.max(0, m - 3);
  const history = X ? {...history0, y: history0.y - ext, h: history0.h + 2 * ext, w: history0.w + ext} : {...history0, x: history0.x - ext, w: history0.w + 2 * ext, h: history0.h + ext};
  const card = a0 => (X ? {x: a0, y: m + ins, w: o.cw, h: o.ch} : {x: m + ins, y: a0, w: o.cw, h: o.ch});
  const cards = {intake: card(m + ins), position: card(c0 + ins), history: card(c0 + ins + along)};
  const len = c0 + along * 2 + ins * 2 + m + ext;
  return {axis, ins, m, gap: o.gap, cw: o.cw, ch: o.ch, W: X ? len : across + ins * 2 + m * 2, H: X ? across + ins * 2 + m * 2 : len,
    ext, intake, channel, position, history, cards, travelB: along + ins * 2 + o.gap, travelA: along};
}

/**
 * Front lip of the history pocket (drawn OVER the cards, local origin = rail top-left): a translucent sleeve edge across
 * the pocket's near side, so a card kept there reads as held in a receptacle. It covers only the card's blank foot.
 */
export function pocketLip(ctx, G, o) {
  const Hs = G.history;
  const X = G.axis === 'x';
  const lh = Math.max(14, (X ? G.ch : G.cw) * 0.12);
  const d = X ? roundRectPath(Hs.x, Hs.y + Hs.h - lh - 2, Hs.w, lh + 2, 6) : roundRectPath(Hs.x + Hs.w - lh - 2, Hs.y, lh + 2, Hs.h, 6);
  return g({name: o.prefix},
    h('path', {d, fill: '#9fb4c4', 'fill-opacity': 0.85, stroke: INK, 'stroke-width': 2}),
    X ? h('line', {x1: r(Hs.x + 8), x2: r(Hs.x + Hs.w - 8), y1: r(Hs.y + Hs.h - lh + 4), y2: r(Hs.y + Hs.h - lh + 4), stroke: '#fff', 'stroke-width': 2, opacity: 0.7}) : null);
}

/**
 * Rail node (local origin = rail top-left). Named parts: `${P}` group, `${P}-plate`, `${P}-intake`, `${P}-chev`
 * (chevrons), `${P}-pocket`, `${P}-holder`, `${P}-pocket-glow` (a neutral rim, shown when the pocket holds a card).
 * @param {any} ctx
 * @param {ReturnType<typeof railGeometry>} G
 * @param {{prefix:string}} o
 */
export function railNode(ctx, G, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const X = G.axis === 'x';
  const parts = [];
  parts.push(h('path', {name: `${P}-plate`, d: roundRectPath(0, 0, G.W, G.H, 14), fill: '#e9e2d3', stroke: shade('#e9e2d3', -0.35), 'stroke-width': 2.5}));
  // intake tray: a shallow tray with a rim and a finger lip
  const I = G.intake;
  parts.push(g({name: `${P}-intake`},
    h('path', {d: roundRectPath(I.x, I.y, I.w, I.h, 10), fill: '#d9d0bd', stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(I.x + 6, I.y + 6, I.w - 12, I.h - 12, 7), fill: '#e7dfcd', stroke: shade('#d9d0bd', -0.3), 'stroke-width': 1.5}),
    X ? h('rect', {x: r(I.x - 4), y: r(I.y + I.h * 0.3), width: 9, height: r(I.h * 0.4), rx: 4, fill: shade('#d9d0bd', -0.25), stroke: INK, 'stroke-width': 1.5})
      : h('rect', {x: r(I.x + I.w * 0.3), y: r(I.y - 4), width: r(I.w * 0.4), height: 9, rx: 4, fill: shade('#d9d0bd', -0.25), stroke: INK, 'stroke-width': 1.5})));
  // chevrons engraved in the gap (the direction of the slide only)
  const chev = [];
  const C = G.channel;
  if (X) {
    const x0 = I.x + I.w, x1 = C.x;
    const cx = (x0 + x1) / 2, s = Math.min(11, (x1 - x0) * 0.24);
    for (let i = 0; i < 3; i++) { const yy = I.y + I.h * (0.25 + i * 0.25); chev.push(`M${r(cx - s * 0.5)} ${r(yy - s)}L${r(cx + s * 0.5)} ${r(yy)}L${r(cx - s * 0.5)} ${r(yy + s)}`); }
  } else {
    const y0 = I.y + I.h, y1 = C.y;
    const cy = (y0 + y1) / 2, s = Math.min(11, (y1 - y0) * 0.24);
    for (let i = 0; i < 3; i++) { const xx = I.x + I.w * (0.25 + i * 0.25); chev.push(`M${r(xx - s)} ${r(cy - s * 0.5)}L${r(xx)} ${r(cy + s * 0.5)}L${r(xx + s)} ${r(cy - s * 0.5)}`); }
  }
  parts.push(h('path', {name: `${P}-chev`, d: chev.join(''), fill: 'none', stroke: shade('#e9e2d3', -0.45), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
  // channel floor
  parts.push(h('path', {d: roundRectPath(C.x, C.y, C.w, C.h, 10), fill: '#efe9dc', stroke: INK, 'stroke-width': 2}));
  // history pocket (second half): recessed, with three index tabs on its outer edge
  const Hs = G.history;
  const tabs = [];
  for (let i = 0; i < 3; i++) {
    const fill = i === 0 ? th.accent2Soft : i === 1 ? th.accent3Soft : '#e4e7ea';
    if (X) { const tw = Hs.w * 0.16, tx = Hs.x + Hs.w * (0.22 + i * 0.24); tabs.push(h('path', {d: roundRectPath(tx, Hs.y - 10, tw, 16, 4), fill, stroke: INK, 'stroke-width': 1.5})); }
    else { const tw = Hs.h * 0.16, ty = Hs.y + Hs.h * (0.22 + i * 0.24); tabs.push(h('path', {d: roundRectPath(Hs.x + Hs.w - 6, ty, 16, tw, 4), fill, stroke: INK, 'stroke-width': 1.5})); }
  }
  const rc = 9;
  parts.push(g({name: `${P}-pocket`},
    tabs,
    h('path', {d: X ? `M${r(Hs.x)} ${r(Hs.y)}H${r(Hs.x + Hs.w - rc)}Q${r(Hs.x + Hs.w)} ${r(Hs.y)} ${r(Hs.x + Hs.w)} ${r(Hs.y + rc)}V${r(Hs.y + Hs.h - rc)}Q${r(Hs.x + Hs.w)} ${r(Hs.y + Hs.h)} ${r(Hs.x + Hs.w - rc)} ${r(Hs.y + Hs.h)}H${r(Hs.x)}Z`
      : `M${r(Hs.x)} ${r(Hs.y)}V${r(Hs.y + Hs.h - rc)}Q${r(Hs.x)} ${r(Hs.y + Hs.h)} ${r(Hs.x + rc)} ${r(Hs.y + Hs.h)}H${r(Hs.x + Hs.w - rc)}Q${r(Hs.x + Hs.w)} ${r(Hs.y + Hs.h)} ${r(Hs.x + Hs.w)} ${r(Hs.y + Hs.h - rc)}V${r(Hs.y)}Z`,
    fill: '#c9d6df', stroke: INK, 'stroke-width': 3}),
    X ? h('line', {x1: r(Hs.x + 6), x2: r(Hs.x + Hs.w - 8), y1: r(Hs.y + 6), y2: r(Hs.y + 6), stroke: '#fff', 'stroke-width': 2.5, opacity: 0.8})
      : h('line', {x1: r(Hs.x + 6), x2: r(Hs.x + 6), y1: r(Hs.y + 6), y2: r(Hs.y + Hs.h - 8), stroke: '#fff', 'stroke-width': 2.5, opacity: 0.8})));
  parts.push(h('path', {name: `${P}-pocket-glow`, d: roundRectPath(Hs.x - 3, Hs.y - 3, Hs.w + 6, Hs.h + 6, 12), fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}));
  // position holder (first half): a U of slate rails open towards the pocket, with grip knobs
  const Ps = G.position;
  const t = Math.min(9, G.ins * 0.75);
  const holder = X
    ? `M${r(Ps.x + Ps.w)} ${r(Ps.y)}H${r(Ps.x + rc)}Q${r(Ps.x)} ${r(Ps.y)} ${r(Ps.x)} ${r(Ps.y + rc)}V${r(Ps.y + Ps.h - rc)}Q${r(Ps.x)} ${r(Ps.y + Ps.h)} ${r(Ps.x + rc)} ${r(Ps.y + Ps.h)}H${r(Ps.x + Ps.w)}V${r(Ps.y + Ps.h - t)}H${r(Ps.x + t)}V${r(Ps.y + t)}H${r(Ps.x + Ps.w)}Z`
    : `M${r(Ps.x)} ${r(Ps.y + Ps.h)}V${r(Ps.y + rc)}Q${r(Ps.x)} ${r(Ps.y)} ${r(Ps.x + rc)} ${r(Ps.y)}H${r(Ps.x + Ps.w - rc)}Q${r(Ps.x + Ps.w)} ${r(Ps.y)} ${r(Ps.x + Ps.w)} ${r(Ps.y + rc)}V${r(Ps.y + Ps.h)}H${r(Ps.x + Ps.w - t)}V${r(Ps.y + t)}H${r(Ps.x + t)}V${r(Ps.y + Ps.h)}Z`;
  parts.push(g({name: `${P}-holder`},
    h('path', {d: holder, fill: RAIL, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    X ? [h('rect', {x: r(Ps.x + Ps.w * 0.36), y: r(Ps.y - 8), width: r(Ps.w * 0.24), height: 12, rx: 5, fill: shade(RAIL, 0.15), stroke: INK, 'stroke-width': 1.8}),
      h('rect', {x: r(Ps.x + Ps.w * 0.36), y: r(Ps.y + Ps.h - 4), width: r(Ps.w * 0.24), height: 12, rx: 5, fill: shade(RAIL, 0.15), stroke: INK, 'stroke-width': 1.8})]
      : [h('rect', {x: r(Ps.x - 8), y: r(Ps.y + Ps.h * 0.36), width: 12, height: r(Ps.h * 0.24), rx: 5, fill: shade(RAIL, 0.15), stroke: INK, 'stroke-width': 1.8}),
        h('rect', {x: r(Ps.x + Ps.w - 4), y: r(Ps.y + Ps.h * 0.36), width: 12, height: r(Ps.h * 0.24), rx: 5, fill: shade(RAIL, 0.15), stroke: INK, 'stroke-width': 1.8})]));
  // seam between the position and the pocket
  parts.push(X ? h('line', {x1: r(Hs.x), x2: r(Hs.x), y1: r(Hs.y + 2), y2: r(Hs.y + Hs.h - 2), stroke: shade('#efe9dc', -0.4), 'stroke-width': 2})
    : h('line', {x1: r(Hs.x + 2), x2: r(Hs.x + Hs.w - 2), y1: r(Hs.y), y2: r(Hs.y), stroke: shade('#efe9dc', -0.4), 'stroke-width': 2}));
  return g({name: P}, parts);
}

/* ------------------------------------------------------------------ */
/* Calendar (fixture only) and legend icons                            */
/* ------------------------------------------------------------------ */

function calendarArt(ctx, w, hh, rings = true) {
  const th = ctx.theme;
  const top = hh * 0.26;
  const rc = Math.min(8, w * 0.08);
  const parts = [
    h('path', {d: roundRectPath(0, 0, w, hh, rc), fill: '#fff', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M0 ${r(top)}V${r(rc)}Q0 0 ${r(rc)} 0H${r(w - rc)}Q${r(w)} 0 ${r(w)} ${r(rc)}V${r(top)}Z`, fill: th.accent2, stroke: INK, 'stroke-width': 2}),
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

/** Wall calendar (local origin = top-left). Blank grid: no date is marked. */
export function calendarNode(ctx, o) {
  return g({name: o.prefix},
    h('path', {d: roundRectPath(4, 6, o.w, o.h, 8), fill: ctx.theme.shadow}),
    calendarArt(ctx, o.w, o.h, true),
  );
}

/** Legend icon (size s, local origin = icon centre). kinds: a, b, holder, pocket, intake, calendar, person, thread, delta. */
export function legendIcon(ctx, kind, s, o = {}) {
  const th = ctx.theme;
  const k = s / 2;
  if (kind === 'a' || kind === 'b') {
    return g(null,
      h('path', {d: roundRectPath(-k * 0.8, -k, k * 1.6, s, 4), fill: CARD, stroke: INK, 'stroke-width': 2}),
      h('rect', {x: r(-k * 0.8), y: r(-k), width: r(k * 0.32), height: r(s), rx: 3, fill: laneColor(ctx, kind), stroke: INK, 'stroke-width': 1.5}),
      g({transform: T(k * 0.15, -k * 0.35)}, markGlyph(kind, k * 0.3, {stroke: CARD, sw: 1})));
  }
  if (kind === 'holder') {
    return g(null,
      h('path', {d: `${roundRectPath(-k, -k * 0.75, s, k * 1.5, 4)}${roundRectPath(-k + 5, -k * 0.75 + 5, s - 10, k * 1.5 - 10, 2)}`, fill: RAIL, 'fill-rule': 'evenodd', stroke: INK, 'stroke-width': 1.5}));
  }
  if (kind === 'pocket') {
    return g(null,
      h('rect', {x: r(-k * 0.6), y: r(-k * 0.95), width: r(k * 0.5), height: 7, rx: 2, fill: th.accent2Soft, stroke: INK, 'stroke-width': 1.2}),
      h('path', {d: roundRectPath(-k, -k * 0.7, s, k * 1.5, 4), fill: '#dfe4e8', stroke: INK, 'stroke-width': 2}));
  }
  if (kind === 'intake') return h('path', {d: roundRectPath(-k, -k * 0.7, s, k * 1.4, 4), fill: '#d9d0bd', stroke: INK, 'stroke-width': 2});
  if (kind === 'calendar') return g({transform: T(-k * 0.9, -k * 0.8)}, calendarArt(ctx, s * 0.9, s * 0.8, false));
  if (kind === 'pips') return g(null, orderPips(2, k * 0.42));
  if (kind === 'delta') return changedMarker(ctx, {radius: k * 0.8});
  if (kind === 'thread') {
    return g(null,
      h('line', {x1: r(-k), y1: 0, x2: r(k), y2: 0, stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(-k), cy: 0, r: 4.5, fill: th.accent2}), h('circle', {cx: r(k), cy: 0, r: 4.5, fill: th.accent2}));
  }
  if (kind === 'person') {
    return g(null,
      h('path', {d: `M${r(-k)} ${r(k * 0.45)}C${r(-k)} ${r(-k * 0.2)} ${r(-k * 0.6)} ${r(-k * 0.35)} 0 ${r(-k * 0.35)}C${r(k * 0.6)} ${r(-k * 0.35)} ${r(k)} ${r(-k * 0.2)} ${r(k)} ${r(k * 0.45)}Z`, fill: o.color ?? th.accent2, stroke: INK, 'stroke-width': 1.8}),
      h('circle', {cx: 0, cy: r(-k * 0.05), r: r(k * 0.42), fill: '#e0ac85', stroke: INK, 'stroke-width': 1.8}));
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Panels (legend rows) and small helpers                              */
/* ------------------------------------------------------------------ */

/**
 * Lay out legend rows in a column. Row kinds: heading (bold), item (icon + text), key (italic, the neutral key), note.
 * @param {any} ctx
 * @param {Array<{kind:string, icon?:string, text:string, name:string}>} rows
 * @param {{w:number, F:number, minF?:number, maxLines?:number, gap?:number}} o
 */
export function panelLayout(ctx, rows, o) {
  const {w, F} = o;
  const iconW = F * 1.8;
  const gap = o.gap ?? F * 0.5;
  let y = 0;
  let ok = true;
  const out = rows.map(row => {
    const tw = row.kind === 'key' || row.kind === 'heading' || row.kind === 'note' ? w : w - iconW;
    const fit = fitG(row.text, {maxWidth: tw, size: F, minSize: o.minF ?? F, maxLines: o.maxLines ?? 3, weight: row.kind === 'heading' ? 700 : row.kind === 'key' ? 600 : 500});
    if (!fit.ok) ok = false;
    const item = {...row, fit, y, h: fit.height, iconW, tw};
    y += fit.height + gap + (row.kind === 'key' ? 0 : 0);
    return item;
  });
  return {rows: out, h: Math.max(0, y - gap), w, F, ok, width: Math.max(0, ...out.map(q => q.fit.width + (q.kind === 'item' ? q.iconW : 0)))};
}

/** Panel node (local origin = top-left). Every row is a named group (`row.name`). */
export function panelNode(ctx, PL, o = {}) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(Math.min(PL.w, Math.max(row.fit.width + F * 0.5, F * 6))), y1: r(row.y - F * 0.3), y2: r(row.y - F * 0.3), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
      parts.push(textAt(row.fit, {x: 0, y: row.y, fill: th.fg, italic: true}));
    } else if (row.kind === 'heading' || row.kind === 'note') {
      parts.push(textAt(row.fit, {x: 0, y: row.y, fill: th.fg}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.75, row.y + Math.min(row.fit.height, F * 1.2) / 2)}, legendIcon(ctx, row.icon, F * 1.2, {color: o.personColor})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name, opacity: row.opacity}, parts);
  });
}

/** Axis-aligned box overlap test. */
export function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Round a point for semantics. */
export const R2 = p => ({x: r(p.x), y: r(p.y)});

/** Smoothstep-like clamp helper. */
export const k01 = v => clamp(v);

/* ------------------------------------------------------------------ */
/* Stand-alone places (mechanism view) and occupant tokens             */
/* ------------------------------------------------------------------ */

/**
 * One place of the rail drawn on its own (local origin = top-left): 'intake' (tray), 'position' (holder frame, a full
 * frame here) or 'history' (pocket with index tabs). Named `${prefix}` with `${prefix}-body`.
 * @param {any} ctx
 * @param {{prefix:string, kind:'intake'|'position'|'history', w:number, h:number}} o
 */
export function placeNode(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  const P = o.prefix;
  const parts = [h('path', {d: roundRectPath(5, 8, w, hh, 12), fill: th.shadow})];
  if (o.kind === 'intake') {
    parts.push(h('path', {name: `${P}-body`, d: roundRectPath(0, 0, w, hh, 12), fill: '#d9d0bd', stroke: INK, 'stroke-width': 2.5}));
    parts.push(h('path', {d: roundRectPath(7, 7, w - 14, hh - 14, 8), fill: '#e7dfcd', stroke: shade('#d9d0bd', -0.3), 'stroke-width': 1.5}));
    parts.push(h('rect', {x: -4, y: r(hh * 0.3), width: 9, height: r(hh * 0.4), rx: 4, fill: shade('#d9d0bd', -0.25), stroke: INK, 'stroke-width': 1.5}));
  } else if (o.kind === 'history') {
    for (let i = 0; i < 3; i++) parts.push(h('path', {d: roundRectPath(w * (0.2 + i * 0.25), -11, w * 0.16, 17, 4), fill: i === 0 ? th.accent2Soft : i === 1 ? th.accent3Soft : '#e4e7ea', stroke: INK, 'stroke-width': 1.5}));
    parts.push(h('path', {name: `${P}-body`, d: roundRectPath(0, 0, w, hh, 12), fill: '#dfe4e8', stroke: INK, 'stroke-width': 2.5}));
    parts.push(h('path', {d: roundRectPath(7, 7, w - 14, hh - 14, 8), fill: '#ecf0f2', stroke: shade('#dfe4e8', -0.3), 'stroke-width': 1.5}));
  } else {
    const t = 11;
    parts.push(h('path', {name: `${P}-body`, d: roundRectPath(0, 0, w, hh, 12), fill: '#efe9dc', stroke: INK, 'stroke-width': 2}));
    parts.push(h('path', {d: `${roundRectPath(0, 0, w, hh, 12)}${roundRectPath(t, t, w - 2 * t, hh - 2 * t, 6)}`, fill: RAIL, 'fill-rule': 'evenodd', stroke: INK, 'stroke-width': 2}));
    parts.push(h('rect', {x: r(w * 0.38), y: -8, width: r(w * 0.24), height: 12, rx: 5, fill: shade(RAIL, 0.15), stroke: INK, 'stroke-width': 1.8}));
    parts.push(h('rect', {x: r(w * 0.38), y: r(hh - 4), width: r(w * 0.24), height: 12, rx: 5, fill: shade(RAIL, 0.15), stroke: INK, 'stroke-width': 1.8}));
  }
  return g({name: P}, parts);
}

/** Occupant token: a small card face with the lane stripe and the ● / ◆ glyph (local origin = centre). */
export function tokenNode(ctx, o) {
  const s = o.size;
  return g({name: o.name},
    h('path', {d: roundRectPath(-s * 0.62 + 3, -s * 0.5 + 4, s * 1.24, s, 6), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(-s * 0.62, -s * 0.5, s * 1.24, s, 6), fill: CARD, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: `M${r(-s * 0.62 + 6)} ${r(-s * 0.5)}H${r(-s * 0.36)}V${r(s * 0.5)}H${r(-s * 0.62 + 6)}Q${r(-s * 0.62)} ${r(s * 0.5)} ${r(-s * 0.62)} ${r(s * 0.5 - 6)}V${r(-s * 0.5 + 6)}Q${r(-s * 0.62)} ${r(-s * 0.5)} ${r(-s * 0.62 + 6)} ${r(-s * 0.5)}Z`, fill: laneColor(ctx, o.side), stroke: INK, 'stroke-width': 1.5}),
    g({transform: T(s * 0.12, 0)}, markGlyph(o.side, s * 0.24, {stroke: CARD, sw: 1.2, name: o.glyphName})));
}

/** Arrowhead path pointing along +x with its tip at the origin. */
export function headPath(len) {
  return `M0 0L${r(-len)} ${r(-len * 0.55)}L${r(-len * 0.72)} 0L${r(-len)} ${r(len * 0.55)}Z`;
}
