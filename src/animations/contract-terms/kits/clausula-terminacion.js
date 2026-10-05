/**
 * Kit for the "Cláusula de terminación" motif (contract-terms-05, LAW-0497..0500).
 * Art, text fitting and pure geometry only: every entry owns its timeline, layout choices and semantics. The stage
 * geometry, text fitting, rig metrics, notes placement and Spanish-defaults wrapper are copied from the contract-terms-04
 * kit (contract-terms/kits/condicion-activacion.js, read-only; copied, never imported) and re-dressed for this motif.
 *
 * Objects (original vector art, the category's editorial-flat language):
 *  - the CONTRACT BOARD (the contract): a standing board with its head band ("CT-523 · Contract (fictional)") and two
 *    layer sheets behind it (its layers). It holds two panels: the CIRCUMSTANCES panel (left: "Circumstances and
 *    communications" — an empty slot, a dock outline, and below it a tray where the circumstance card rests) and the
 *    CLAUSE panel (right: "Termination clause" — its supplied sections, "Section 1 (supplied text)" …, seated in rows).
 *    Right of the sections runs a TRACK in which the connector BRACKET slides.
 *  - the CIRCUMSTANCE CARD: a card printed with the supplied, generic label ("Communication 1 (supplied)") and its
 *    supplied CASE row: ● "Case provided for (as supplied)" or ◆ "Case not described (as supplied)". The two cases are
 *    drawn alike — same glyph area, same colour, same stroke, same type; neither looks deficient.
 *  - SECTION CARDS: plain cards with the supplied placeholders, all of the same size.
 *  - the connector BRACKET: a neutral ink "]" brace with a wooden knob on its spine. Open, it stands in the track, clear
 *    of the cards; closed, its arms clasp the supplied section(s) (rows from…to).
 *  - the CONNECTOR CORD (cordGeom/cordNode): a plain ink line with a plug at each end, drawn on from the clasped
 *    bracket's spine to a socket on the seated circumstance card: the supplied connection, nothing more.
 *  - two standing PEOPLE, one on each side of the board (Party A by the circumstances panel, Party B by the track).
 * Legal content (very high risk: termination): no termination doctrine — no ground, right or power to terminate, no
 * notice period, no time limit, no effect, no validity or sufficiency judgement, no jurisdiction. The connection is
 * only what is supplied; "case not described" is neutral (no conclusion of any kind is drawn from it). The key reads
 * "As supplied · no conclusion drawn".
 * @module animations/contract-terms/kits/clausula-terminacion
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, r, seg} from '../../../core/time.js';
import {roundRectPath, mix} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj, int, party} from '../../../schemas/fields.js';
import {measure, fitText} from '../../../core/text.js';

/* ======================================================================== */
/* Shared helpers (copied from contract-terms/kits/apartados-reciprocas.js — read-only, never imported) */
/* ======================================================================== */

const GLUE = '⁠';

/** Keep a number with the word before it ("Day 10") and a short tail word with its line. */
export function keepNumbers(text) {
  return String(text ?? '')
    .replace(/(\S)[ \t]+(\d[\d.,:/-]*)(?=[\s)·,;.]|$)/gu, '$1\u00a0$2')
    .replace(/^(\d[\d.]*)[ \t]+(?=\S)/u, '$1\u00a0');
}

/** fitW results memoised on every input (pure; callers only read them). */
const FITW = new Map();
/**
 * Last-resort word breaking (off by default). localizeScene turns it on only for a second layout pass after the normal
 * pass found no layout at all (`no-layout-fits`) — e.g. an unbroken 40–55 character token — and keeps it on for that
 * scene's build and frames. Every scene the normal pass can lay out is unchanged.
 */
let BREAK = false;
/** Whether last-resort word breaking is on (diagnostics / tests). */
export const breakingWords = () => BREAK;
/**
 * Fit text into maxWidth × maxLines at the largest size in [size, minSize] that wraps whole words only (glued pairs
 * never split) and leaves no 1–2 character line. Returns a fitText-shaped result plus `bad` when it could not be done.
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:'sans'|'serif'|'mono', leading?:number, balance?:boolean}} o
 */
export function fitW(text, o) {
  const key = `${text}\u0001${o.maxWidth}|${o.size}|${o.minSize}|${o.maxLines}|${o.weight}|${o.family}|${o.leading}|${o.balance}|${BREAK}|${o.lean}`;
  const hit = FITW.get(key);
  if (hit) return hit;
  const res = fitWRaw(text, o);
  if (FITW.size > 50000) FITW.clear();
  FITW.set(key, res);
  return res;
}

/** fitW's unbreakable tokens (glued pairs and lone separators kept with their word). */
function tokensOf(full) {
  const tokens = [];
  for (const w of keepNumbers(full).replace(/\u00a0/g, GLUE).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)) {
    if (/^[·•–—|:]$/.test(w) && tokens.length) tokens[tokens.length - 1] += `${GLUE}${w}`;
    else tokens.push(w);
  }
  return tokens;
}

/**
 * Width of the widest unbreakable token fitG would wrap (glued as fitG glues it) at size sz: when it exceeds a maxWidth,
 * fitG at that size and width is bad whatever else (word breaking off).
 */
export function widestToken(text, sz, weight = 400, family = 'sans') {
  const tk = tokensOf(glueParen(glueText(text)));
  return tk.length ? Math.max(...tk.map(t => measure(t.replace(/⁠/g, ' '), sz, weight, family))) : 0;
}

function fitWRaw(text, o) {
  const full = String(text ?? '');
  const weight = o.weight ?? 400;
  const family = o.family ?? 'sans';
  const leading = o.leading ?? 1.18;
  const maxLines = o.maxLines ?? 2;
  const minSize = o.minSize ?? o.size;
  const maxWidth = Math.max(10, o.maxWidth);
  const shown = t => t.replace(/⁠/g, ' ');
  const m = (t, sz) => measure(shown(t), sz, weight, family);
  let tokens = tokensOf(full);
  // (pieces of a broken word always end their line: never "piece- piece" on one line)
  const cut = new Set();
  const wrapAt = (w, sz) => {
    const lines = [];
    let cur = '', prev = null;
    for (const t of tokens) {
      const cand = cur ? `${cur} ${t}` : t;
      if (!cur || (!cut.has(prev) && m(cand, sz) <= w)) cur = cand;
      else { lines.push(cur); cur = t; }
      prev = t;
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const step = Math.max(0.5, o.size * 0.035);
  let best = null;
  for (let pass = 0; pass < 2 && !best; pass++) {
  if (pass === 1) {
    // (last resort, only with BREAK on and only when the whole-word pass failed: every token too wide even at the minimum
    // size is broken — after its own hyphens first, else mid-word with a hyphen — into pieces that fit at that size)
    if (!BREAK || !tokens.length || Math.max(...tokens.map(t => m(t, minSize))) <= maxWidth) break;
    tokens = tokens.flatMap(t => {
      if (m(t, minSize) <= maxWidth) return [t];
      const ps = breakToken(t, maxWidth, q => m(q, minSize));
      ps.slice(0, -1).filter(q => q.endsWith('-')).forEach(q => cut.add(q));
      return ps;
    });
  }
  for (let s = o.size; s >= minSize - 1e-6; s -= step) {
    if (!tokens.length) break;
    if (Math.max(...tokens.map(t => m(t, s))) > maxWidth) continue;
    let lines = wrapAt(maxWidth, s);
    if (lines.length > maxLines) continue;
    if (lines.length > 1 && lines.slice(1).some(l => shown(l).trim().length <= 2)) continue;
    // balance: the narrowest width that keeps the same number of lines
    if (o.balance !== false && lines.length > 1) {
      let lo = maxWidth * 0.4, hi = maxWidth;
      for (let it = 0; it < 12; it++) {
        const mid = (lo + hi) / 2;
        const l2 = Math.max(...tokens.map(t => m(t, s))) <= mid ? wrapAt(mid, s) : null;
        if (l2 && l2.length === lines.length) hi = mid; else lo = mid;
      }
      const l3 = wrapAt(hi, s);
      if (l3.length === lines.length && !l3.slice(1).some(l => shown(l).trim().length <= 2)) lines = l3;
    }
    best = {lines: lines.map(shown), size: s};
    break;
  }
  }
  if (!best) {
    // (o.lean — a strict caller, which discards a text that does not fit —: no ellipsised fallback is computed)
    if (o.lean) return {lines: [], size: minSize, lineHeight: minSize * leading, width: 0, height: 0, truncated: true, full, weight, family, bad: true};
    const f = fitText(full, {maxWidth, size: minSize, minSize, maxLines, weight, family, leading});
    return {...f, bad: true};
  }
  const width = Math.max(...best.lines.map(l => measure(l, best.size, weight, family)));
  const lineHeight = best.size * leading;
  return {lines: best.lines, size: best.size, lineHeight, width, height: lineHeight * (best.lines.length - 1) + best.size, truncated: false, full, weight, family, bad: false};
}

/**
 * Break one token too wide for maxWidth (wd = its width function at the minimum size) into pieces that each fit: the
 * glued words (no-break spaces) part first, then a word parts after its own hyphens (parts grouped greedily), and a part
 * still too wide is cut mid-word with a hyphen (never leaving a piece of 1–2 letters). Greedy pieces never share a line.
 */
function breakToken(t, maxWidth, wd) {
  const out = [];
  for (const w of t.split(GLUE).filter(Boolean)) {
    if (wd(w) <= maxWidth) { out.push(w); continue; }
    let cur = '';
    for (const part of w.split(/(?<=-)/u)) {
      if (cur && wd(cur + part) <= maxWidth) { cur += part; continue; }
      if (cur) out.push(cur);
      cur = part;
      if (wd(cur) > maxWidth) {
        // (mid-word cut into the fewest pieces of about equal length that fit, each but the last with its hyphen; no piece
        // under 3 letters)
        const ch = [...cur];
        let pieces = null;
        for (let n = 2; n <= ch.length && !pieces; n++) {
          const len = Math.ceil(ch.length / n);
          const ps = [];
          for (let i = 0; i < ch.length; i += len) ps.push(ch.slice(i, i + len).join(''));
          if (ps.length > 1 && [...ps[ps.length - 1]].length < 3) { ps[ps.length - 2] += ps.pop(); }
          if (ps.every((q, i) => wd(i < ps.length - 1 ? `${q}-` : q) <= maxWidth)) pieces = ps;
        }
        if (!pieces) pieces = ch;
        pieces.slice(0, -1).forEach(q => out.push(`${q}-`));
        cur = pieces[pieces.length - 1];
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

/** A rounded chip with whole-word fitted text (never ellipsised). */
export function chipW(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = o.padX ?? size * 0.6;
  const padY = o.padY ?? size * 0.36;
  const fit = o.fit || fitW(text, {maxWidth: o.maxWidth - padX * 2, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600});
  const w = fit.width + padX * 2;
  const hh = fit.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const y = o.y;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, y, w, hh, o.radius ?? Math.min(hh / 2, size * 0.7)), fill: o.fill ?? th.card, stroke: o.stroke ?? th.ink, 'stroke-width': o.strokeWidth ?? 2}),
    textBlock(fit, {x: x + w / 2, y: y + padY, anchor: 'middle', fill: o.color ?? th.ink, name: o.textName}),
  );
  return {node, box: {x, y, w, h: hh, cx: x + w / 2, cy: y + hh / 2}, fit};
}

export const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export const unionBox = boxes => {
  const bs = boxes.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};

/* Rig metrics (primitives/person.js, local units, facing +x) — copied */
export const RIG = {
  near: {x: 12, y: -302},
  far: {x: -14, y: -305},
  hip: {x: 0, y: -186},
  reach: 165,
  /** head + hair box (local) */
  head: {x: -44, y: -414, w: 92, h: 90},
  front: 42, back: 40,
};

/** World point of a local rig point for a figure at (x, floor) facing f with scale k (no lean). */
export const rigPt = (fig, p) => ({x: fig.x + fig.f * p.x * fig.k, y: fig.floor + p.y * fig.k});

/** Head box (world) of a figure. */
export function headBox(fig) {
  const a = rigPt(fig, {x: RIG.head.x, y: RIG.head.y}), b = rigPt(fig, {x: RIG.head.x + RIG.head.w, y: RIG.head.y + RIG.head.h});
  return {x: Math.min(a.x, b.x), y: a.y, w: Math.abs(b.x - a.x), h: b.y - a.y};
}

/** Whole-figure box (world): head to feet, back to front. */
export function figureBox(fig) {
  const a = rigPt(fig, {x: -50, y: -414}), b = rigPt(fig, {x: 50, y: 0});
  return {x: Math.min(a.x, b.x), y: a.y, w: Math.abs(b.x - a.x), h: b.y - a.y};
}

/** Shoulder world position (no lean). */
export function shoulderAt(fig, which = 'near') {
  return rigPt(fig, RIG[which]);
}

/** Whether a world target is within the arm's reach (with a safety margin). */
export function canReach(fig, which, target, margin = 0.975) {
  const s = shoulderAt(fig, which);
  const d = Math.hypot(target.x - s.x, target.y - s.y);
  return d <= RIG.reach * fig.k * margin && d >= 12 * fig.k;
}

/** Head (face and hair) as a circle in rig units, for the arm-clearance check (copied from LAW-0489). */
const HEAD_C = {x: 5, y: -366}, HEAD_R = 47;
/** Whether a posed person's arms (upper arm and forearm, both sides) stay clear of the head (rig units, local). */
export function armClear(nodes, N) {
  const segDist = (l) => {
    const ax = l.x1, ay = l.y1, bx = l.x2, by = l.y2;
    const vx = bx - ax, vy = by - ay;
    const t = Math.max(0, Math.min(1, ((HEAD_C.x - ax) * vx + (HEAD_C.y - ay) * vy) / (vx * vx + vy * vy || 1)));
    return Math.hypot(ax + vx * t - HEAD_C.x, ay + vy * t - HEAD_C.y);
  };
  // (the arm's own half-width: about 9 rig units)
  return ['near', 'far'].every(key => [`${N}-${key}-u`, `${N}-${key}-l`].every(n => segDist(nodes[n]) >= HEAD_R + 9));
}

/**
 * Glue the tokens that must never part with no-break spaces (fitW keeps a no-break space as one token): a lone capital
 * letter with the word before it ("Party B"), a name word with its letter or number ("Circumstance 1", "Apartado 2").
 */
export function glueText(text) {
  return String(text ?? '')
    .replace(/\b(provided|not|no)[ \t]+(for|described|descrito)\b/gu, '$1\u00a0$2')
    .replace(/(\d)[ \t]+(h|hrs?|min|am|pm|AM|PM|%)(?=$|[\s),.;:·])/gu, '$1\u00a0$2')
    .replace(/(\S)[ \t]+(\(?[A-Z]\)?(?:['’]s)?)(?=$|[,.;:)·]|[ \t]+[^\p{Ll}\s])/gu, '$1\u00a0$2')
    .replace(/(\S)[ \t]+([A-Z]['’]s)(?=$|[\s,.;:)·])/gu, '$1\u00a0$2')
    .replace(/(^|[\s(])(Party|Parte|party|parte|Circumstance|Comunicación|circumstance|comunicación|Clause|Apartado|clause|apartado|Room|Sala|room|sala|of|de|in|en)[ \t]+([A-Z]|\d+)(?=$|[\s,.;:)·'’–-])/gu, '$1$2 $3');
}

/** A short closing parenthetical — "(supplied text)", "(as supplied)", "(texto aportado)" — kept on one line. */
export function glueParen(text) {
  return String(text ?? '').replace(/\(([^()]{1,26})\)/gu, (m0, inner) => (inner.trim().split(/\s+/).length <= 4 ? `(${inner.replace(/[ \t]+/g, '\u00a0')})` : m0));
}

const WORD = /^[\p{L}][\p{L}'’-]*[\p{L}][,;:.]?$/u;
/** True when a wrapped block has a line holding one bare word while the block holds three words or more. */
export function oneWordLine(lines) {
  if (!lines || lines.length < 2) return false;
  const words = lines.join(' ').split(/\s+/).map(w => w.replace(/^[(«"]+|[)»",;:.]+$/g, '')).filter(w => /^[\p{L}][\p{L}'’-]*[\p{L}]$/u.test(w));
  if (words.length < 3) return false;
  return lines.some(l => { const t = l.trim().split(/\s+/); return t.length === 1 && WORD.test(t[0]); });
}

/**
 * fitW on the glued text (glueText + glueParen); when the wrap leaves a one-word line, narrower widths (same line cap)
 * are tried for a wrap without one.
 */
const FITG = new Map();
export function fitG(text, o) {
  // (memoised on every input, the breaking switch included — pure; callers only read the result)
  const key = `${text}\u0001${o.maxWidth}|${o.size}|${o.minSize}|${o.maxLines}|${o.weight}|${o.family}|${o.leading}|${o.balance}|${o.strict}|${BREAK}`;
  const hit = FITG.get(key);
  if (hit) return hit;
  const res = fitGRaw(text, o);
  if (FITG.size > 50000) FITG.clear();
  FITG.set(key, res);
  return res;
}

function fitGRaw(text, o0) {
  const s = glueParen(glueText(text));
  // (strict: a text that does not fit is discarded by the caller — fitW skips its fallback)
  const o = o0.strict ? {...o0, lean: true} : o0;
  const f = fitW(s, o);
  if (f.bad || !oneWordLine(f.lines)) return f;
  for (let k = 0.96; k >= 0.5; k -= 0.04) {
    const f2 = fitW(s, {...o, maxWidth: o.maxWidth * k});
    if (f2.bad) break;
    if (!oneWordLine(f2.lines)) return f2;
  }
  const lastTwo = s.replace(/[ \t]+(\S+)$/u, '\u00a0$1');
  const f3 = fitW(lastTwo, o);
  if (!f3.bad && !oneWordLine(f3.lines)) return f3;
  return o.strict ? {...f, bad: true} : f;
}

/** chipW with a glued fit (fitG). */
export function chipG(ctx, text, o) {
  const size = o.size, padX = o.padX ?? size * 0.6;
  if (o.fit) return chipW(ctx, text, o);
  // (a chip's word too wide for any chip width is broken at once — the whole-word fit is tried first, and only a word
  // that no wrap can hold is broken — so a chip never sends a layout search through every size for nothing)
  const fo = {maxWidth: o.maxWidth - padX * 2, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600};
  let fit = fitG(text, fo);
  if (fit.bad && !BREAK && widestToken(text, fo.minSize, fo.weight) > fo.maxWidth) {
    BREAK = true;
    try { fit = fitG(text, {...fo, maxLines: fo.maxLines + 2}); } finally { BREAK = false; }
  }
  return chipW(ctx, text, {...o, fit});
}

export const INK = '#1f2328';
export const LH = 1.18;
/** px at 1080p of the body text, largest first (stress may go down to the 16 px floor). */
export const PX_BASE = [32, 30, 28, 26, 24, 22, 21, 20, 19.6];
export const PX_STRESS = [30, 28, 26, 24, 22, 21, 20, 19.6, 18.5, 17.5, 16.6, 16.1];

/** Free placement of the notes (final tag, key, annotations) in a band: rows of centred chips. */
export function placeNotes(ctx, items, band, F, cols = 1) {
  const maxW = Math.min(cols > 1 ? (band.w - F * 0.8 * (cols - 1)) / cols : band.w, 30 * F);
  // (last-resort pass: a broken long word may take one more line)
  const chips = items.map(it => ({it, c: chipG(ctx, it.text, {x: 0, y: 0, maxWidth: maxW, size: F, maxLines: BREAK ? 4 : 3, weight: it.weight ?? 600})}));
  if (chips.some(q => q.c.fit.bad)) return null;
  const rows = [];
  let cur = [], cw = 0;
  for (const q of chips) {
    if (cur.length && cw + F * 0.8 + q.c.box.w > band.w) { rows.push(cur); cur = []; cw = 0; }
    if (q.c.box.w > band.w + 0.5) return null;
    cw += (cur.length ? F * 0.8 : 0) + q.c.box.w;
    cur.push(q);
  }
  if (cur.length) rows.push(cur);
  let y = band.y;
  const placed = [];
  for (const row of rows) {
    const rw = row.reduce((s0, q) => s0 + q.c.box.w, 0) + F * 0.8 * (row.length - 1);
    let x = band.x + (band.w - rw) / 2;
    const rh = Math.max(...row.map(q => q.c.box.h));
    for (const q of row) { placed.push({...q, x, y: y + (rh - q.c.box.h) / 2}); x += q.c.box.w + F * 0.8; }
    y += rh + F * 0.4;
  }
  return {h: rows.length ? y - band.y - F * 0.4 : 0, placed};
}

/** Height a set of notes needs in a band of width w. */
export function notesHeight(ctx, items, w, F, cols = 1) {
  if (!items.length) return 0;
  const pl = placeNotes(ctx, items, {x: 0, y: 0, w, h: 1e6}, F, cols);
  return pl ? pl.h : Infinity;
}

/**
 * Wrap a scene so that, with locale 'es', every top-level parameter still equal to the English default is replaced
 * by its Spanish default (supplied values are never replaced). Other locales are untouched. (Copied.)
 */
export function localizeScene(scene, defaults, es) {
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const cache = new WeakMap();
  const view = ctx => {
    const p = ctx.params;
    if (!p || p.locale !== 'es') return ctx;
    let c = cache.get(ctx);
    if (c) return c;
    const q = {...p};
    let changed = false;
    for (const [key, v] of Object.entries(es)) if (key in defaults && same(p[key], defaults[key]) && !same(p[key], v)) { q[key] = v; changed = true; }
    c = changed ? {...ctx, params: q} : ctx;
    cache.set(ctx, c);
    return c;
  };
  // (the last-resort pass: only when the normal pass found no layout at all, a second pass with word breaking on; the
  // scene it lays out keeps breaking on for its build and frames)
  const withBreak = (on, fn) => {
    if (!on) return fn();
    const was = BREAK;
    BREAK = true;
    try { return fn(); } finally { BREAK = was; }
  };
  const noFit = L => !!L && L.ok === false && (L.why || []).includes('no-layout-fits');
  return {
    ...scene,
    layout: (ctx, ...a) => {
      const c = view(ctx);
      const L = scene.layout(c, ...a);
      if (!noFit(L)) return L;
      const L2 = withBreak(true, () => scene.layout(c, ...a));
      if (noFit(L2)) return L;
      L2.breakWords = true;
      return L2;
    },
    build: (ctx, L, ...a) => withBreak(L && L.breakWords, () => scene.build(view(ctx), L, ...a)),
    frame: (ctx, L, ...a) => withBreak(L && L.breakWords, () => scene.frame(view(ctx), L, ...a)),
  };
}

/* ======================================================================== */
/* Fields, defaults and strings                                             */
/* ======================================================================== */

/** The two supplied states of the circumstance, of equal weight. */
export const STATES = ['provided', 'undescribed'];

/** Motif fields shared by the four treatments. */
export const motifFields = {
  parties: list('Party A (by the circumstances panel) and Party B (by the connector track); fictional by default, equal weight', party, 2, 2),
  contract: obj('The contract board', {
    reference: str('Reference printed on the contract (fictional)', 32),
    title: str('Heading of the contract, as supplied (generic, e.g. "Contract (fictional)")', 80),
  }, ['reference', 'title']),
  panels: obj('Headings of the two panels, as supplied', {
    circumstance: str('Heading of the circumstances panel (e.g. "Circumstances and communications")', 50),
    section: str('Heading of the clause panel (e.g. "Termination clause")', 50),
  }, ['circumstance', 'section']),
  circumstance: obj('The supplied circumstance or communication (a generic, fictional placeholder; never a real notice)', {
    label: str('Label of the circumstance card (e.g. "Communication 1 (supplied)")', 60),
  }, ['label']),
  stateLabels: obj('Wording of the two supplied cases (equal weight; ● provided for, ◆ not described)', {
    provided: str('Case "provided for", as supplied (e.g. "Case provided for (as supplied)")', 60),
    undescribed: str('Case "not described", as supplied (e.g. "Case not described (as supplied)")', 60),
  }, ['provided', 'undescribed']),
  clauses: list('Sections of the termination clause, as supplied (generic, fictional placeholders, e.g. "Section 1 (supplied text)"; never real contract text)', str('Section, as supplied', 70), 1, 3),
  section: obj('The supplied section(s) the connector joins to the circumstance card: sections from…to (1 = top; clamped to the list)', {
    from: int('First connected section (1–3)', 1, 3),
    to: int('Last connected section (1–3)', 1, 3),
  }, ['from', 'to']),
};

export const DEFAULT_CONTENT = {
  parties: [{name: 'Lucía Ferrer', role: 'Party A'}, {name: 'Tomás Ibarra', role: 'Party B'}],
  contract: {reference: 'CT-523', title: 'Contract (fictional)'},
  panels: {circumstance: 'Circumstances and communications', section: 'Termination clause'},
  circumstance: {label: 'Communication 1 (supplied)'},
  stateLabels: {provided: 'Case provided for (as supplied)', undescribed: 'Case not described (as supplied)'},
  clauses: ['Section 1 (supplied text)', 'Section 2 (supplied text)', 'Section 3 (supplied text)'],
  section: {from: 2, to: 2},
};

/** The Spanish counterpart of DEFAULT_CONTENT (the baseline-es content). */
export const DEFAULT_CONTENT_ES = {
  parties: [{name: 'Lucía Ferrer', role: 'Parte A'}, {name: 'Tomás Ibarra', role: 'Parte B'}],
  contract: {reference: 'CT-523', title: 'Contrato (ficticio)'},
  panels: {circumstance: 'Circunstancias y comunicaciones', section: 'Cláusula de terminación'},
  circumstance: {label: 'Comunicación 1 (aportada)'},
  stateLabels: {provided: 'Supuesto previsto (según lo aportado)', undescribed: 'Supuesto no descrito (según lo aportado)'},
  clauses: ['Apartado 1 (texto aportado)', 'Apartado 2 (texto aportado)', 'Apartado 3 (texto aportado)'],
  section: {from: 2, to: 2},
};

export const KIT_STRINGS = {
  en: {
    marked: 'Section connected as supplied',
    unmarked: 'No connection supplied',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    marked: 'Apartado conectado según lo aportado',
    unmarked: 'Sin conexión aportada',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** The supplied section, clamped to the clauses list (from ≤ to). Zero-based rows. */
export function sectionRows(p) {
  const n = p.clauses.length;
  const a = clamp(Math.min(p.section.from, p.section.to), 1, n), b = clamp(Math.max(p.section.from, p.section.to), 1, n);
  return {i0: a - 1, i1: b - 1, from: a, to: b};
}

/** The state glyph: ● for provided, ◆ for undescribed — same area, same fill, same stroke (neither state is deficient). */
export function stateGlyph(ctx, state, x, y, R, o = {}) {
  const fill = o.fill ?? ctx.theme.accent2;
  const sw = Math.max(2, R * 0.16);
  if (state === 'provided') return h('circle', {name: o.name, cx: r(x), cy: r(y), r: r(R), fill, stroke: INK, 'stroke-width': r(sw, 2)});
  // (a diamond of the same area as the disc: half-diagonal R·√(π/2))
  const d = R * 1.2533;
  return h('path', {name: o.name, d: `M${r(x)} ${r(y - d)}L${r(x + d)} ${r(y)}L${r(x)} ${r(y + d)}L${r(x - d)} ${r(y)}Z`, fill, stroke: INK, 'stroke-width': r(sw, 2), 'stroke-linejoin': 'round'});
}

/* ======================================================================== */
/* Cards                                                                    */
/* ======================================================================== */

/**
 * Circumstance card metrics for body size F and card width cw: the label and BOTH state rows are fitted, and the card is sized
 * for the larger state (the card never changes size with the state). Returns null when a text does not fit.
 */
export function measureEvent(p, F, cw, show, tight = false, noTab = false) {
  const padX = F * (noTab ? 0.4 : 0.5), padY = F * (tight ? 0.42 : 0.58);
  const gz = F * (noTab ? 1.15 : 1.3);
  const tw = cw - 2 * padX;
  if (tw < F * (show ? 6 : 2.5)) return null;
  if (!show) return {label: null, st: {provided: null, undescribed: null}, stH: F, ch: padY * 2 + F * 1.2 + F * 0.5 + F, padX, padY, gz, tw, labH: F * 1.2, F};
  // (the label, centred, keeps a wider margin at the card's ends: the grip tab's hand stays clear of it)
  let label = fitG(p.circumstance.label, {maxWidth: tw - (noTab ? 0 : F * 0.6), size: F, maxLines: 4, weight: 700, strict: true});
  // (a card no hand carries — an inspected card —: its label as large as fits in one more line at most, up to 1.4×)
  if (noTab && !label.bad) for (const s0 of [1.4, 1.3, 1.2, 1.1]) {
    const l2 = fitG(p.circumstance.label, {maxWidth: tw, size: F * s0, maxLines: Math.min(3, label.lines.length + 1), weight: 700, strict: true});
    if (!l2.bad) { label = l2; break; }
  }
  const st = {
    provided: fitG(p.stateLabels.provided, {maxWidth: tw - gz, size: F, maxLines: 4, weight: 600, strict: true}),
    undescribed: fitG(p.stateLabels.undescribed, {maxWidth: tw - gz, size: F, maxLines: 4, weight: 600, strict: true}),
  };
  if (label.bad || st.provided.bad || st.undescribed.bad) return null;
  const stH = Math.max(st.provided.height, st.undescribed.height);
  return {label, st, stH, ch: padY + label.height + F * 0.6 + stH + padY, padX, padY, gz, tw, labH: label.height, F};
}

/** Clause card metrics: every card the same size (the larger need). Null when a text does not fit in 3 lines. */
export function measureObl(texts, F, cw, show, tight = false) {
  const padX = F * 0.45, padY = F * (tight ? 0.4 : 0.55), tab = F * 0.55;
  const tw = cw - 2 * padX - tab;
  if (tw < F * (show ? 4.5 : 2)) return null;
  const fits = [];
  let lines = 1;
  for (const t of texts) {
    if (!show) { fits.push(null); continue; }
    const f = fitG(t, {maxWidth: tw, size: F, maxLines: 3, weight: 600});
    if (f.bad) return null;
    lines = Math.max(lines, f.lines.length);
    fits.push(f);
  }
  const ch = show ? padY * 2 + F + (lines - 1) * F * LH : Math.max(F * 2.2, padY * 2 + F * 1.4);
  return {fits, ch, padX, padY, tab, tw, lines};
}

/**
 * Circumstance card (local origin = its centre). The label sits in `${name}-label`; each state row (glyph + text, or glyph +
 * print bar with labels hidden) in `${name}-st-provided` / `${name}-st-undescribed` (the entry shows the supplied one).
 * o.ring: a solid accent outline round the STATE row (a contrast scene's highlight), `${name}-ring`, opacity 0.
 */
export function eventCard(ctx, {name, cw, ch, M, F: F0, state, ring = false, tabW = 0, tabY = 0}) {
  const th = ctx.theme;
  // (the card's own print size: the body size, or larger on a card laid out taller than its print)
  const F = M.F ?? F0;
  const x0 = -cw / 2, y0 = -ch / 2;
  const tabH = Math.min(ch * 0.5, F * 1.3);
  const kids = [
    // (the grip tab at the card's outer end: the hand holds it, never the print)
    ...(tabW ? [h('path', {name: `${name}-tab`, d: roundRectPath(x0 - tabW, tabY - tabH / 2, tabW + 8, tabH, 5), fill: th.woodTop, stroke: th.woodDark, 'stroke-width': 2.2})] : []),
    h('path', {d: roundRectPath(x0 + 3, y0 + 5, cw, ch, 9), fill: th.shadow}),
    h('path', {name: `${name}-sheet`, d: roundRectPath(x0, y0, cw, ch, 9), fill: th.card, stroke: INK, 'stroke-width': 2.6}),
    // (a neutral ink band at the top edge: the circumstance card reads as one object, unlike the clause cards)
    h('path', {d: `M${r(x0 + 10)} ${r(y0 + 4)}H${r(x0 + cw - 10)}`, stroke: th.inkSoft, 'stroke-width': r(Math.max(5, F * 0.22), 2), 'stroke-linecap': 'round'}),
  ];
  // (a card taller than its print centres the print)
  const yL = y0 + M.padY + Math.max(0, (ch - M.ch) / 2);
  const yS = yL + M.labH + F * 0.6;
  kids.push(h('path', {d: `M${r(x0 + M.padX)} ${r(yS - F * 0.3)}H${r(x0 + cw - M.padX)}`, stroke: th.paperLine, 'stroke-width': 2}));
  if (M.label) kids.push(g({name: `${name}-label`}, textBlock(M.label, {x: r(0), y: r(yL), anchor: 'middle', fill: INK})));
  else kids.push(g({name: `${name}-label`}, h('rect', {x: r(-M.tw * 0.36), y: r(yL + F * 0.3), width: r(M.tw * 0.72), height: r(F * 0.34), rx: 3, fill: INK, opacity: 0.7})));
  const gx = x0 + M.padX + F * 0.45;
  for (const s of ['provided', 'undescribed']) {
    const f = M.st[s];
    const gy = yS + F * 0.5;
    const body = f ? textBlock(f, {x: r(x0 + M.padX + M.gz), y: r(yS), fill: INK})
      : h('rect', {x: r(x0 + M.padX + M.gz), y: r(gy - F * 0.15), width: r((M.tw - M.gz) * 0.8), height: r(F * 0.3), rx: 3, fill: th.inkFaint ?? INK, opacity: 0.8});
    kids.push(g({name: `${name}-st-${s}`, opacity: s === state ? 1 : 0}, stateGlyph(ctx, s, gx, gy, F * 0.36), body));
  }
  if (ring) {
    const rh = M.stH + F * 0.5;
    kids.push(h('path', {name: `${name}-ring`, d: roundRectPath(x0 + M.padX * 0.4, yS - F * 0.25, cw - M.padX * 0.8, rh, 10), fill: 'none', stroke: th.accent, 'stroke-width': r(Math.max(4, F * 0.18), 2), opacity: 0}));
  }
  return g({name, 'data-occludes': 1}, kids);
}

/** Clause card (local origin = its centre): a plain card with a neutral tab at its left edge and the print. */
export function oblCard(ctx, {name, cw, ch, M, F, fit}) {
  const th = ctx.theme;
  const x0 = -cw / 2, y0 = -ch / 2;
  const kids = [
    h('path', {d: roundRectPath(x0 + 3, y0 + 5, cw, ch, 8), fill: th.shadow}),
    h('path', {name: `${name}-sheet`, d: roundRectPath(x0, y0, cw, ch, 8), fill: th.card, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(x0 + M.tab * 0.45 + 2)} ${r(y0 + 8)}V${r(y0 + ch - 8)}`, stroke: th.inkSoft, 'stroke-width': r(Math.max(4, F * 0.18), 2), 'stroke-linecap': 'round'}),
  ];
  const tx = x0 + M.padX + M.tab;
  if (fit) kids.push(g({name: `${name}-txt`}, textBlock(fit, {x: r(tx), y: r(-fit.height / 2), fill: INK})));
  else {
    const bw = M.tw;
    kids.push(g({name: `${name}-bars`},
      h('rect', {x: r(tx), y: r(-F * 0.42), width: r(bw * 0.88), height: r(F * 0.3), rx: 3, fill: INK, opacity: 0.7}),
      h('rect', {x: r(tx), y: r(F * 0.16), width: r(bw * 0.56), height: r(F * 0.3), rx: 3, fill: th.inkFaint ?? INK, opacity: 0.7})));
  }
  return g({name, 'data-occludes': 1}, kids);
}

/**
 * The bracket (local origin = the top of its spine): a "]" brace of height bh whose arms point left by `arm`, and a
 * wooden knob on the spine's outer side at local height knobY. `${name}-brace` is the ink brace.
 */
export function bracketArt(ctx, {name, bh, B}) {
  const th = ctx.theme;
  return g({name},
    h('path', {name: `${name}-brace`, d: `M${r(-B.arm)} 0H0V${r(bh)}H${r(-B.arm)}`, fill: 'none', stroke: INK, 'stroke-width': r(B.sw, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(B.sw * 0.5 - 1)} ${r(clamp(B.knobY, B.sw, bh - B.sw))}H${r(B.knobDx)}V${r(B.knobY)}`, fill: 'none', stroke: th.woodDark, 'stroke-width': r(B.sw * 0.7, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('circle', {name: `${name}-knob`, cx: r(B.knobDx), cy: r(B.knobY), r: r(B.hr), fill: th.woodTop, stroke: th.woodDark, 'stroke-width': 2.4}));
}

/* ======================================================================== */
/* Layout: the board between the two people (Party A left, Party B right)   */
/* ======================================================================== */

/**
 * Solve one stage in `o.box` (design units) at body size F and figure scale k. Returns the geometry or null.
 * o: {box, F, k, upx, show, cardText, tight, p (content: contract, panels, circumstance, stateLabels, clauses, section),
 *     names [2] | null, plates {tray} | null, notesH [below, top], tray (the circumstance tray), noReach, minCh, minChE,
 *     reserveBelow (F => {w, h}), gutter, rowGap, eventShare}
 */
/** The two panel headings fitted (up to 3 lines, whole words; memoised by fitG). */
function panelHeadFits(p, F, We, Wt, ci, cut) {
  return [headFit(p.panels.circumstance, We - 2 * ci - cut, F), headFit(p.panels.section, Wt - 2 * ci, F)];
}

const BAREW = /^[\p{L}][\p{L}'’-]*[\p{L}][,;:.]?$/u;
/**
 * A panel heading: whole words, up to 3 lines, a short connector ("and", "y", "of", "de" …) kept with the next word;
 * accepted unless its last line is one bare word or two lines are (a single first-line word — "Circumstances / and
 * communications" — is fine for a heading).
 */
export function headFit(text, maxWidth, F) {
  // (a heading word too wide for its panel is broken at once — after its own hyphens, else mid-word — so a heading never
  // sends the layout search through every size for nothing)
  const was = BREAK;
  BREAK = true;
  try { return headFitRaw(text, maxWidth, F); } finally { BREAK = was; }
}
function headFitRaw(text, maxWidth, F) {
  const t = glueParen(glueText(text)).replace(/(^|\s)(and|or|of|y|o|e|de|del|la|el|the|a)[ \t]+(?=\S)/giu, '$1$2\u00a0');
  for (const k of [1, 0.92, 0.84, 0.76, 0.68]) {
    // (a word broken into pieces may take up to two more lines)
    const ml = widestToken(text, F, 700) > maxWidth * k ? 5 : 3;
    const f = fitW(t, {maxWidth: maxWidth * k, size: F, maxLines: ml, weight: 700, lean: true});
    if (f.bad) return {...f, bad: true};
    const bare = l => { const w = l.trim().split(/\s+/); return w.length === 1 && BAREW.test(w[0]); };
    if (f.lines.length < 2 || f.lines.some(l => /\p{L}-$/u.test(l.trim())) || (!bare(f.lines[f.lines.length - 1]) && f.lines.filter(bare).length < 2)) return f;
  }
  return {lines: [], bad: true, size: F, height: 0, width: 0};
}

export function stageGeom(ctx, o) {
  const {box, F, k, p} = o;
  const show = o.show, cardText = show && o.cardText !== false;
  // (o.oblText: the clause cards printed or not, decided apart from the circumstance card — default: as the circumstance card)
  const oblText = show && (o.oblText ?? o.cardText) !== false;
  const tight = !!o.tight;
  const gapP = Math.max(8, F * 0.3);
  const layerUp = Math.max(10, F * 0.45);
  const xA = box.x + 50 * k + 1, xB = box.x + box.w - 50 * k - 1;
  const bx0 = xA + 48 * k + gapP, bx1 = xB - 48 * k - gapP;
  const BW = bx1 - bx0;
  if (BW < F * 14) return null;
  const m = Math.max(12, F * (tight ? 0.36 : 0.5));
  const ci = Math.max(6, F * (tight ? 0.25 : 0.38));
  // the bracket and its track
  const sw = Math.max(6, F * 0.32);
  const arm = F * 0.8;
  const hr = Math.max(9, F * 0.5);
  const gapC = F * 0.4;
  // (o.compactTrack: a shorter travel — the open arms just clear of the cards — where the board is narrow)
  const travel = o.compactTrack ? arm + gapC + F * 0.45 : Math.max(F * 2.2, arm + gapC + F * 0.9);
  const knobDx = sw / 2 + hr + F * 0.15;
  const railW = gapC + travel + knobDx + hr + F * 0.35;
  const stack = !!o.stack;
  const gw = stack ? 0 : Math.max(F * (tight ? 1 : 1.4), BW * (o.gutter ?? 0.05));
  // (side by side: circumstance panel | gutter | section panel | track; stacked (tall frames): the section panel and its track
  // on top, the circumstance panel under them across the board's width)
  const inner = stack ? BW - 2 * m - railW : BW - 2 * m - gw - railW;
  const share = o.eventShare ?? 0.5;
  // (o.eventFullWidth, stacked: the circumstance panel across the board's width, under the section and its track)
  const We = stack ? (o.eventFullWidth ? BW - 2 * m : inner) : inner * share, Wt = stack ? inner : inner - We;
  // (the grip tab at the circumstance card's outer end — none on a card no hand carries, o.noTab)
  const tabW = o.noTab ? 0 : F * 1.0;
  const cwO = Wt - 2 * ci, cwE = Math.min(We - 2 * ci - tabW * (stack ? 1.4 : 0.6), o.cwEMax ?? Infinity);
  // (o.minCwE: the circumstance card a real object in both dimensions)
  if ((o.minCwE && cwE < o.minCwE) || (o.minCwO && cwO < o.minCwO)) return null;
  // (o.tokenProbe — layoutStage, at the widest board — : only whether every printed text's widest word can fit the
  // widest cards; the card widths shrink as the figures grow, so a word too wide here is too wide at every scale)
  if (o.tokenProbe) {
    if (BREAK) return {probe: true};
    const ew = cwE - 2 * F * (o.noTab ? 0.4 : 0.5), gz = F * (o.noTab ? 1.15 : 1.3);
    const ow = cwO - 2 * F * 0.45 - F * 0.55;
    const ok = (!cardText || (widestToken(p.circumstance.label, F, 700) <= Math.max(10, ew - (o.noTab ? 0 : F * 0.6))
      && ['provided', 'undescribed'].every(st => widestToken(p.stateLabels[st], F, 600) <= Math.max(10, ew - gz))))
      && (!oblText || p.clauses.every(t => widestToken(t, F, 600) <= Math.max(10, ow)));
    // (the panel headings at the widest panels: a heading that cannot wrap there fits at no scale — bail out at once)
    const hf = show && o.headings !== false ? panelHeadFits(p, F, We, Wt, ci, stack ? 2 * (arm + gapC + F * 0.3) : 0) : [];
    return ok && !hf.some(f => f && f.bad) ? {probe: true} : null;
  }
  let ME = measureEvent(p, F, cwE, cardText, tight, !!o.noTab);
  // (o.eventTextGrow: on a card laid out taller than its print — an inspected card — the print grows, up to 1.7×)
  if (ME && o.eventTextGrow && cardText) for (const s0 of [1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.15, 1.1, 1.05]) {
    const M2 = measureEvent(p, F * s0, cwE, cardText, tight, !!o.noTab);
    if (M2 && M2.ch <= (o.minChE ?? 0)) { ME = M2; break; }
  }
  const MO = measureObl(p.clauses, F, cwO, oblText, tight);
  if (!ME || !MO) return null;
  const chE = Math.max(ME.ch, o.minChE ?? 0), chO = Math.max(MO.ch, o.minCh ?? 0);
  const headFits = show && o.headings !== false ? panelHeadFits(p, F, We, Wt, ci, stack ? 2 * (arm + gapC + F * 0.3) : 0) : [null, null];
  if (headFits.some(f => f && f.bad)) return null;
  const colHH = headFits[0] ? Math.max(...headFits.map(f => f.height)) + F * (tight ? 0.5 : 0.7) : F * 1.2;
  const headFit = show && o.headText !== false ? fitG(`${p.contract.reference} · ${p.contract.title}`, {maxWidth: BW - 2 * m - F, size: F, maxLines: 3, weight: 700}) : null;
  if (headFit && headFit.bad) return null;
  const hbH = headFit ? headFit.height + F * (tight ? 0.5 : 0.7) : F * 1.1;
  // names under the feet
  const nmW = Math.min(box.w * 0.46, 24 * F);
  const names = (o.names || [null, null]).map(c => (c ? {fit: fitG(c, {maxWidth: nmW - F * 1.2, size: F, maxLines: 3, weight: 600}), maxW: nmW} : null));
  if (names.some(q => q && q.fit.bad)) return null;
  const nameH = Math.max(0, ...names.map(q => (q ? q.fit.height + F * 0.72 : 0)));
  const floor = box.y + box.h - (nameH ? nameH + F * 0.35 : 4);
  const figA = {x: xA, floor, f: 1, k}, figB = {x: xB, floor, f: -1, k};
  const sA = shoulderAt(figA), sB = shoulderAt(figB);
  const n = p.clauses.length;
  let gS = Math.max(F * 0.55, sw + F * 0.35) * (o.rowGap ?? 1);
  // (o.slotRoom: room above and below the seated circumstance card — e.g. for a tag — taken from wider row gaps)
  // (o.slotRoom: room under the seated circumstance card — e.g. for a tag —: the card sits at the rows' top, the rows block at
  // least as tall as the card and that room)
  const slotRoom = o.slotRoom ? o.slotRoom(F, We - F * 0.4) : 0;
  if (slotRoom && n > 1) gS = Math.max(gS, (chE + slotRoom - n * chO) / (n - 1));
  const Hr = n * chO + (n - 1) * gS;
  const tray = o.tray !== false;
  const gT = Math.max(F * 0.7, 12);
  const lipH = o.plates && o.plates.tray && show ? F * 1.3 : Math.max(10, F * 0.42);
  const topNotes = o.notesH ? o.notesH[1] : 0;
  const top = box.y + layerUp * 2 + 2 + (topNotes ? topNotes + F * 0.4 : 0);
  // relative layout (y = 0 at the board's top edge), then placed
  const R = {};
  R.colT = m * 0.4 + hbH + m * 0.5;
  if (stack) {
    R.colE0 = null;
    R.rows0 = R.colT + colHH + gS;
    R.panelTBot = R.rows0 + Hr + gS;
    R.colE = R.panelTBot + m * 0.8;
    R.slot = R.colE + colHH + gS + chE / 2;
    R.tray = tray ? R.slot + chE + gT : null;
    R.ledge = tray ? R.tray + chE / 2 : R.slot + chE / 2 + F * 0.3;
  } else {
    const slotRel = slotRoom ? chE / 2 : Hr / 2;
    // (o.cordRoom: a free channel under the section rows for the connector cord — see cordGeom)
    const areaTop = Math.min(0, slotRel - chE / 2), areaBot = Math.max(Hr + (o.cordRoom ? F * 0.95 : 0), slotRel + chE / 2 + slotRoom);
    R.rows0 = R.colT + colHH + gS - areaTop;
    R.colE = R.colT;
    R.slot = R.rows0 + slotRel;
    R.tray = tray ? R.rows0 + areaBot + gT + chE / 2 : null;
    R.ledge = tray ? R.tray + chE / 2 : R.rows0 + areaBot + F * 0.3;
  }
  R.yB = R.ledge + lipH + m * 0.45;
  // vertical placement: A's action (slot ↔ tray) at A's shoulder height — stacked, the middle between A's action and
  // B's section at the shoulders' height — then nudged into the box
  const midA = tray ? (R.slot + R.tray) / 2 : R.slot;
  const mid = stack ? (midA + R.rows0 + Hr / 2) / 2 : midA;
  let y0 = sA.y - mid;
  // (kept above the floor's margin, then below the box's top)
  if (y0 + R.yB > floor - F * 1.2) y0 = floor - F * 1.2 - R.yB;
  if (y0 - layerUp * 2 < top) y0 = top + layerUp * 2;
  const yT = y0;
  const ledgeTop = y0 + R.ledge;
  const yB = y0 + R.yB;
  if (yB > floor - F * 1.2) return null;
  const board = {x: bx0, y: yT, w: BW, h: yB - yT};
  const panelBot = yB - m * 0.45;
  const panelE = stack ? {x: bx0 + m, y: y0 + R.colE, w: We, h: panelBot - (y0 + R.colE)} : {x: bx0 + m, y: y0 + R.colT, w: We, h: panelBot - (y0 + R.colT)};
  const panelT = stack ? {x: bx0 + m, y: y0 + R.colT, w: Wt, h: R.panelTBot - R.colT} : {x: bx0 + m + We + gw, y: y0 + R.colT, w: Wt, h: panelBot - (y0 + R.colT)};
  const rail = {x: panelT.x + Wt, y: panelT.y, w: railW, h: (stack && o.eventFullWidth ? R.panelTBot - R.colT : panelBot - panelT.y)};
  const xE = stack && o.eventFullWidth ? panelE.x + ci + tabW * 1.4 + cwE / 2 : panelE.x + We / 2 + tabW * (stack ? 0.7 : 0.3), xO = panelT.x + Wt / 2;
  const rowY = [...Array(n).keys()].map(i => y0 + R.rows0 + chO / 2 + i * (chO + gS));
  const slot = {x: xE, y: y0 + R.slot};
  const trayE = tray ? {x: xE, y: y0 + R.tray} : null;
  // bracket geometry: spans the supplied section rows
  const tr = sectionRows(p);
  const e = Math.min(gS * 0.5, F * 0.45);
  const brTop = rowY[tr.i0] - chO / 2 - e, brH = rowY[tr.i1] + chO / 2 + e - brTop;
  const closedX = xO + cwO / 2 + gapC, openX = closedX + travel;
  // the knob on the spine: as near the shoulder's height as the spine allows (fixed on the bracket)
  // (on the spine, or on a stem above or below it within the track's column, as near the shoulder's height as allowed)
  const knobLo = o.knobInBrace ? hr + sw : Math.min(hr + sw, rail.y - brTop + hr + F * 0.35);
  const knobHi = o.knobInBrace ? Math.max(hr + sw, brH - hr - sw) : Math.max(brH - hr - sw, rail.y + rail.h - brTop - hr - F * 0.35);
  const knobY = clamp(sB.y - brTop, knobLo, knobHi);
  const B = {sw, arm, hr, knobDx, knobY, travel, gapC, top: brTop, h: brH, closedX, openX};
  const knobAt = x => ({x: x + knobDx, y: brTop + knobY});
  // the circumstance card's grip: its outer (left) end, at a fixed height on the card (nearest the shoulder)
  // (on the card's end at the height nearest the shoulder; the label keeps a margin clear of the hand)
  const gripDy = tray ? clamp(sA.y - (slot.y + trayE.y) / 2, -chE * 0.3, chE * 0.32) : chE * 0.2;
  const gripE = c => ({x: c.x - cwE / 2 - tabW * 0.6, y: c.y + gripDy});
  if (!o.noReach) {
    const ok = (o.reachEvent === false || [gripE(slot), ...(trayE ? [gripE(trayE)] : [])].every(q => canReach(figA, 'near', q)))
      && [knobAt(openX), knobAt(closedX)].every(q => canReach(figB, 'near', q));
    if (!ok) return null;
  }
  // the band under the board for the notes (between its legs)
  const legX = Math.max(14, BW * 0.06) + F * 0.6;
  const lg0 = F * (o.leadGap ?? 0.4);
  const bandBelow = {x: bx0 + legX, y: yB + lg0, w: BW - 2 * legX, h: floor - yB - lg0 - F * 0.2};
  if (o.reserveBelow && (bandBelow.w < o.reserveBelow(F).w || bandBelow.h < o.reserveBelow(F).h)) return null;
  if (o.notesH && o.notesH[0] && (bandBelow.h < o.notesH[0] || bandBelow.w < F * 8)) return null;
  // the heads clear of the board
  if ([headBox(figA), headBox(figB)].some(hb => overlaps(hb, board, -1))) return null;
  return {
    F, k, m, ci, BW, gw, layerUp, lipH, hbH, headFit, headFits, colHH, board, panelE, panelT, rail, We, Wt, cwE, chE, cwO, chO, ME, MO,
    rowY, slot, trayE, ledge: {x: panelE.x + 2, y: ledgeTop, w: We - 4, h: lipH}, ledgeTop, yT, yB, floor, figA, figB, names, nameH, bandBelow,
    B, knobAt, gripE, gripDy, tabW, tr, cardText, oblText, xE, xO, gS, stack,
  };
}

/**
 * Lay out one stage: searches the body size (largest first) and the figure scale (largest that fits) so that the
 * people's heads stay at or above o.headMin px and, while a layout allows, at or above o.headTarget px.
 * o: {box, upx, prefix, px, headMin, headTarget, kMax, kOnly, p, names, plates, notes [{name, kind, text, target?}],
 *     notesWhere 'auto'|'below'|'top', tray, noReach, cardText, tight, minCh, minChE, reserveBelow, gutter, rowGap,
 *     eventShare}
 */
export function layoutStage(ctx, o) {
  const P = o.prefix ?? '';
  const show = ctx.show('all');
  const box = o.box;
  const notes = o.notes || [];
  const pxs = o.px ?? PX_BASE;
  let best = null;
  const tries = [];
  for (const px of pxs) {
    const F = px / o.upx;
    // (the name plates do not depend on the figure scale: names that cannot fit at this size skip it at once — the same
    // result as trying every scale, without the search)
    if (o.names && o.names.some(c => c && fitG(c, {maxWidth: Math.min(box.w * 0.46, 24 * F) - F * 1.2, size: F, maxLines: 3, weight: 600}).bad)) continue;
    const kHi = Math.min(o.kMax ?? 2.2, (box.h - (o.names ? F * 2.6 : 6)) / 418);
    const kLo = (o.headMin ?? 45) / (82 * o.upx);
    // (a printed word too wide for the widest cards — the smallest scale tried — fits at no scale: skip this size at once)
    if (!stageGeom(ctx, {...o, F, k: o.kOnly ?? Math.min(kLo, kHi), show, notesH: null, tokenProbe: true})) continue;
    for (let k = o.kOnly ?? kHi; k >= (o.kOnly ?? kLo) - 1e-9; k = o.kOnly ? -1 : k - 0.02 < kLo && k > kLo + 1e-6 ? kLo : k - 0.02) {
      const bw = box.w - 2 * (98 * k + Math.max(8, F * 0.3));
      // (o.notesAlt: the notes of the other supplied configuration — the room is reserved for the larger, so that the
      // stage never depends on the configuration)
      const nh = Math.max(notesHeight(ctx, notes, Math.max(F * 8, bw * 0.84), F), o.notesAlt ? notesHeight(ctx, o.notesAlt, Math.max(F * 8, bw * 0.84), F) : 0, o.reserveBelow ? o.reserveBelow(F).h : 0);
      const wheres = o.reserveBelow ? ['below'] : o.notesWhere === 'top' ? ['top'] : o.notesWhere === 'below' ? ['below'] : ['below', 'top'];
      let G = null, where = null;
      for (const wh of wheres) {
        G = stageGeom(ctx, {...o, F, k, show, notesH: notes.length || o.reserveBelow ? (wh === 'below' ? [nh, 0] : [0, nh]) : null});
        if (G) { where = wh; break; }
      }
      if (!G) continue;
      const cand = {G, where, px, F, k, headPx: 90 * k * o.upx};
      tries.push(cand);
      if (!best) best = cand;
      break;
    }
    if (best && best.headPx >= (o.headTarget ?? 0)) break;
  }
  // (no size reaches the head target: the largest text among the fitting sizes whose heads come within 85 % of it, else
  // the largest text — the floors hold either way)
  if (best && best.headPx < (o.headTarget ?? 0)) best = tries.find(c => c.headPx >= 0.85 * o.headTarget) ?? best;
  if (!best) return {ok: false, why: ['no-layout-fits'], P};
  const {G, where, F} = best;
  let notesPl = null;
  if (notes.length) {
    const band = where === 'below' ? G.bandBelow : {x: box.x + F * 0.4, y: box.y, w: box.w - F * 0.8, h: G.yT - G.layerUp * 2 - box.y - F * (o.leadGap ?? 0.4)};
    notesPl = placeNotes(ctx, notes, band, F);
    if (where === 'top' && notesPl) {
      const dy = band.h - notesPl.h;
      notesPl.placed.forEach(q => { q.y += Math.max(0, dy); });
    }
  }
  return {ok: true, why: [], P, show, cardText: G.cardText, ...best, G, F, FL: F, notesWhere: where, notesPl, upx: o.upx, box};
}

/* ======================================================================== */
/* Building                                                                 */
/* ======================================================================== */

/**
 * Board art: layers behind, frame, head band, the two panels with their headings, the circumstance slot (a dock outline),
 * the circumstance tray (ledge, with its plate), the bracket's track, legs.
 */
export function stageArt(ctx, L) {
  const th = ctx.theme;
  const G = L.G, P = L.P, F = L.F;
  const B = G.board;
  const kids = [];
  const up = G.layerUp;
  const lx = Math.max(14, B.w * 0.06);
  for (const x of [B.x + lx, B.x + B.w - lx]) {
    kids.push(h('path', {d: `M${r(x)} ${r(B.y + B.h - 4)}V${r(G.floor - 6)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(9, F * 0.42), 2), 'stroke-linecap': 'round'}));
    kids.push(h('path', {d: `M${r(x - F * 1.1)} ${r(G.floor - 4)}H${r(x + F * 1.1)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(8, F * 0.36), 2), 'stroke-linecap': 'round'}));
  }
  kids.push(h('path', {d: roundRectPath(B.x + up * 2, B.y - up * 2, B.w - up * 2, B.h * 0.5, 10), fill: shade(th.card, -0.1), stroke: INK, 'stroke-width': 2}));
  kids.push(h('path', {d: roundRectPath(B.x + up, B.y - up, B.w - up, B.h * 0.6, 10), fill: shade(th.card, -0.05), stroke: INK, 'stroke-width': 2}));
  kids.push(h('path', {d: roundRectPath(B.x + 4, B.y + 6, B.w, B.h, 12), fill: th.shadow}));
  kids.push(h('path', {name: `${P}board-sheet`, d: roundRectPath(B.x, B.y, B.w, B.h, 12), fill: th.paper, stroke: INK, 'stroke-width': 2.8}));
  const hb = {x: B.x + G.m * 0.5, y: B.y + G.m * 0.4, w: B.w - G.m, h: G.hbH};
  kids.push(h('path', {d: roundRectPath(hb.x, hb.y, hb.w, hb.h, 8), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.8}));
  if (G.headFit) kids.push(g({name: `${P}board-head`}, textBlock(G.headFit, {x: r(B.x + B.w / 2), y: r(hb.y + (hb.h - G.headFit.height) / 2), anchor: 'middle', fill: INK})));
  else kids.push(h('rect', {x: r(B.x + B.w / 2 - B.w * 0.18), y: r(hb.y + hb.h / 2 - F * 0.17), width: r(B.w * 0.36), height: r(F * 0.34), rx: 3, fill: INK, opacity: 0.6}));
  // the panels (equal tone: neither is primary)
  [['circumstance', G.panelE, 0], ['section', G.panelT, 1]].forEach(([nm, c, i]) => {
    kids.push(h('path', {name: `${P}panel-${nm}`, d: roundRectPath(c.x, c.y, c.w, c.h, 9), fill: shade(th.accent2Soft, 0.55), stroke: th.inkSoft, 'stroke-width': 2}));
    kids.push(h('path', {d: `M${r(c.x + 8)} ${r(c.y + 3)}H${r(c.x + c.w - 8)}`, stroke: th.inkSoft, 'stroke-width': r(Math.max(6, F * 0.26), 2), 'stroke-linecap': 'round'}));
    const f = G.headFits[i];
    if (f) kids.push(g({name: `${P}panel-${nm}-head`}, textBlock(f, {x: r(c.x + c.w / 2), y: r(c.y + (G.colHH - f.height) / 2 + 2), anchor: 'middle', fill: INK})));
    else kids.push(h('rect', {x: r(c.x + c.w * 0.3), y: r(c.y + G.colHH / 2 - F * 0.12), width: r(c.w * 0.4), height: r(F * 0.3), rx: 3, fill: INK, opacity: 0.5}));
  });
  // the circumstance slot: a dock outline the card is seated in
  const sl = G.slot;
  kids.push(h('path', {name: `${P}slot`, d: roundRectPath(sl.x - G.cwE / 2 - 5, sl.y - G.chE / 2 - 5, G.cwE + 10, G.chE + 10, 12), fill: shade(th.paperShade, -0.03), stroke: th.inkSoft, 'stroke-width': 2.4}));
  // the track of the bracket (a groove from its closed to its open place)
  const Bk = G.B;
  const tx0 = Bk.closedX - Bk.sw, tx1 = Bk.openX + Bk.knobDx + Bk.hr + 4;
  const tyB = Math.max(Bk.top + Bk.h + Bk.sw * 1.2, Bk.top + Bk.knobY + Bk.hr + F * 0.25);
  const tyT = Math.min(Bk.top - Bk.sw * 1.2, Bk.top + Bk.knobY - Bk.hr - F * 0.25);
  kids.push(h('path', {name: `${P}track`, d: roundRectPath(tx0, tyT, tx1 - tx0, tyB - tyT, 10), fill: shade(th.paperShade, -0.05), stroke: th.inkSoft, 'stroke-width': 1.8}));
  for (const y of [Bk.top, Bk.top + Bk.h]) kids.push(h('path', {d: `M${r(tx0 + 6)} ${r(y)}H${r(tx1 - 6)}`, stroke: th.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round'}));
  // the circumstance tray (ledge) with its plate
  if (G.trayE) {
    const lg = G.ledge;
    kids.push(h('path', {name: `${P}tray`, d: roundRectPath(lg.x, lg.y, lg.w, lg.h, 4), fill: th.woodTop, stroke: th.woodDark, 'stroke-width': 2}));
    if (L.show && L.plates && L.plates.tray) {
      const pf = fitG(L.plates.tray, {maxWidth: lg.w - F, size: F, maxLines: 1, weight: 700});
      if (!pf.bad) kids.push(g({name: `${P}plate-tray`}, textBlock(pf, {x: r(lg.x + lg.w / 2), y: r(lg.y + (lg.h - pf.height) / 2), anchor: 'middle', fill: INK})));
    }
  }
  return g({name: `${P}board`}, kids);
}

/** People (rigs) of a stage. */
export function makeRigs(ctx, L, parties) {
  return [0, 1].map(i => personRig(ctx, {name: `${L.P}${i ? 'B' : 'A'}`, look: actorLook(ctx, parties[i], i)}));
}

/** Names chips under the feet. */
export function nameNodes(ctx, L, captions) {
  const G = L.G;
  return G.names.map((q, i) => {
    if (!q) return null;
    const fig = i ? G.figB : G.figA;
    const w = q.fit.width + L.F * 1.2;
    const cx = clamp(fig.x, L.box.x + w / 2, L.box.x + L.box.w - w / 2);
    return chipG(ctx, captions[i], {x: cx, y: G.floor + L.F * 0.3, anchor: 'middle', maxWidth: q.maxW, size: L.F, maxLines: 2, weight: 600, fit: q.fit, name: `${L.P}name${i}`}).node;
  });
}

/** Clause card nodes (seated rows; names `${P}obl${i}` with inner `${P}obl${i}-in`). */
export function oblNodes(ctx, L, texts) {
  const G = L.G, P = L.P;
  return texts.map((t, i) => g({name: `${P}obl${i}`, transform: T(r(G.xO, 2), r(G.rowY[i], 2))},
    oblCard(ctx, {name: `${P}obl${i}-in`, cw: G.cwO, ch: G.chO, M: G.MO, F: L.F, fit: (G.oblText ?? G.cardText) ? G.MO.fits[i] : null})));
}

/** The circumstance card node (`${P}ev`, inner `${P}ev-in`), placed by the entry's frame. */
export function eventNode(ctx, L, state, o = {}) {
  const G = L.G, P = L.P;
  const at = o.at ?? G.trayE ?? G.slot;
  return g({name: `${P}ev`, transform: T(r(at.x, 2), r(at.y, 2)), opacity: o.opacity}, eventCard(ctx, {name: `${P}ev-in`, cw: G.cwE, ch: G.chE, M: G.ME, F: L.F, state, ring: o.ring, tabW: G.tabW, tabY: G.gripDy}));
}

/** The bracket node (`${P}br`), placed by the entry's frame (transform = its spine's top). */
export function bracketNode(ctx, L, closed) {
  const G = L.G, P = L.P;
  return g({name: `${P}br`, transform: T(r(closed ? G.B.closedX : G.B.openX, 2), r(G.B.top, 2))}, bracketArt(ctx, {name: `${P}br-art`, bh: G.B.h, B: G.B}));
}

/* ======================================================================== */
/* Posing                                                                   */
/* ======================================================================== */

/** Phases of a hand-moved object's pass (fractions of its window): reach, move, seat, back. */
export const PASS = {reach: [0, 0.24], lift: [0.24, 0.66], seat: [0.66, 0.8], back: [0.8, 1]};

/**
 * Pose a hand-moved object at action time a given its window (null: it never moves). The object moves from `from` to
 * `to` over the lift phase and settles over the seat phase (a short final ease). Returns {pos, where, moving}.
 */
export function moveAt(win, from, to, a) {
  if (!win) return {pos: from, where: 'from', moving: false};
  const d = win[1] - win[0];
  const ph = q => [win[0] + PASS[q][0] * d, win[0] + PASS[q][1] * d];
  const lift = ph('lift'), seatW = ph('seat');
  if (a < lift[0]) return {pos: from, where: 'from', moving: false};
  if (a < seatW[1]) {
    // (one smooth travel over lift + seat: the object arrives slowly, never with a jolt)
    const q = ease.inOutSine(seg(a, lift[0], seatW[1]));
    return {pos: mix(from, to, q), where: q >= 1 ? 'to' : 'moving', moving: q > 0 && q < 1};
  }
  return {pos: to, where: 'to', moving: false};
}

/** The hand's grab of a hand-moved object: grip(pos) maps the object's position to the hand's hold. */
export function grabFor(win, from, to, grip) {
  const d = win[1] - win[0];
  const t = q => win[0] + q * d;
  const rel = t(PASS.seat[1]);
  return {t0: t(PASS.reach[0]), t1: t(PASS.reach[1]), t2: rel, t3: t(PASS.back[1]), grip: tt => grip(moveAt(win, from, to, Math.min(Math.max(tt, t(PASS.reach[1])), rel)).pos)};
}

/** Hand position at time a from a list of grabs (chained; a later grab wins where windows overlap). (Copied.) */
export function handOf(list0, restP, a) {
  const list = list0.slice().sort((x, y) => x.t0 - y.t0);
  const at = (t, n) => {
    let pt = null;
    for (let i = 0; i < n; i++) {
      const gb = list[i];
      if (t < gb.t0 || t > gb.t3) continue;
      const from = i ? (at(gb.t0, i) ?? restP) : restP;
      if (t < gb.t1) pt = mix(from, gb.grip(gb.t1), ease.inOutSine(seg(t, gb.t0, gb.t1)));
      else if (t < gb.t2) pt = gb.grip(t);
      else pt = mix(gb.grip(gb.t2), restP, ease.inOutSine(seg(t, gb.t2, gb.t3)));
    }
    return pt;
  };
  return at(a, list.length);
}

/** Whether the hand holds the object at time a (from the end of the reach to the end of the seat). */
export function holding(win, a) {
  const d = win[1] - win[0];
  return a >= win[0] + PASS.lift[0] * d && a <= win[0] + PASS.seat[1] * d;
}

/** Bracket metrics at body size F (the same proportions as the stage's bracket). */
export function bracketMetrics(F) {
  const sw = Math.max(6, F * 0.32), arm = F * 0.8, hr = Math.max(9, F * 0.5), gapC = F * 0.4;
  const travel = Math.max(F * 2.2, arm + gapC + F * 0.9);
  const knobDx = sw / 2 + hr + F * 0.15;
  return {sw, arm, hr, gapC, travel, knobDx};
}

/* ======================================================================== */
/* Connector cord                                                           */
/* ======================================================================== */

/**
 * The connector cord's route (design units) from the clasped bracket's spine foot to a socket on the circumstance card
 * seated at `card` (default the slot): orthogonal, through free board space only — side by side: down the spine to a
 * channel under the section rows, across under them, up the gutter and into the card's right edge; stacked: from the
 * spine foot down (and left) to the card's right edge, or down, right and down to its top edge near its right end.
 * Returns {d, a (socket), b (spine)}.
 */
export function cordGeom(G, card = G.slot) {
  const F = G.F;
  const bx = G.B.closedX, bBot = G.B.top + G.B.h;
  const cr = card.x + G.cwE / 2, ct = card.y - G.chE / 2;
  const n = G.rowY.length;
  if (!G.stack) {
    const rowsBot = G.rowY[n - 1] + G.chO / 2;
    const gx = G.panelE.x + G.We + G.gw / 2;
    const a = {x: cr, y: card.y};
    const yc = Math.max(rowsBot, bBot) + F * 0.42;
    if (yc <= G.panelT.y + G.panelT.h - F * 0.3) {
      const b = {x: bx, y: bBot};
      return {d: `M${r(b.x)} ${r(b.y)}V${r(yc)}H${r(gx)}V${r(a.y)}H${r(a.x)}`, a, b};
    }
    // (no free channel under the rows: from the spine's top, up into the gap between the panel heading and the first row,
    // across above the rows, down the gutter)
    const headBot = G.panelT.y + G.colHH, rowsTop = G.rowY[0] - G.chO / 2;
    const ya = (headBot + Math.min(rowsTop, G.B.top)) / 2;
    const b = {x: bx, y: G.B.top};
    return {d: `M${r(b.x)} ${r(b.y)}V${r(ya)}H${r(gx)}V${r(a.y)}H${r(a.x)}`, a, b};
  }
  // (stacked: the descent runs outside the circumstances panel — in the margin between its right edge and the board's —
  // so it never crosses the panel's heading; then left into the card's right edge)
  const pr = G.panelE.x + G.panelE.w, xv = Math.max(bx, pr + (G.board.x + G.board.w - pr) / 2);
  if (xv > cr + F * 0.25 && G.board.x + G.board.w - pr >= 6) {
    const a = {x: cr, y: card.y}, b = {x: bx, y: bBot};
    return {d: `M${r(b.x)} ${r(b.y)}H${r(xv)}V${r(a.y)}H${r(a.x)}`, a, b};
  }
  // (a card under the whole board width: the socket on its top edge near its right end — right of any tag centred over
  // the card —, reached from the spine foot by a short run in the gap under the clause panel)
  const ax = Math.max(bx, cr - F * 0.6);
  const ym = Math.min(Math.max(bBot + F * 0.35, G.panelT.y + G.panelT.h + G.m * 0.35), ct - F * 0.3);
  const a = {x: ax, y: ct}, b = {x: bx, y: bBot};
  return {d: `M${r(b.x)} ${r(b.y)}V${r(ym)}H${r(a.x)}V${r(a.y)}`, a, b};
}

/**
 * Cord nodes: `${P}cord` (the line, drawn on by 'stroke-dashoffset' 1 → 0 on pathLength 1), `${P}cord-a` (the socket
 * plug on the card) and `${P}cord-b` (the plug at the spine), all at opacity 0.
 */
export function cordNode(ctx, L, cg) {
  const th = ctx.theme, F = L.F, P = L.P;
  const sw = Math.max(4, F * 0.2);
  const plug = (nm, q) => g({name: nm, opacity: 0},
    h('circle', {cx: r(q.x), cy: r(q.y), r: r(sw * 1.5), fill: th.woodTop, stroke: INK, 'stroke-width': 2.4}),
    h('circle', {cx: r(q.x), cy: r(q.y), r: r(sw * 0.55), fill: INK}));
  return g({name: `${P}cord-g`},
    h('path', {name: `${P}cord-case`, d: cg.d, fill: 'none', stroke: th.paper, 'stroke-width': r(sw * 2.2, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1}),
    h('path', {name: `${P}cord`, d: cg.d, fill: 'none', stroke: INK, 'stroke-width': r(sw, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1}),
    plug(`${P}cord-b`, cg.b), plug(`${P}cord-a`, cg.a));
}

/** Frame values of the cord nodes for draw-on fraction q (0 hidden … 1 drawn and both plugs seated). */
export function cordFrame(P, q) {
  const off = r(1 - q, 4);
  return {
    [`${P}cord`]: {'stroke-dashoffset': off, opacity: q > 0 ? 1 : 0},
    [`${P}cord-case`]: {'stroke-dashoffset': off, opacity: q > 0 ? 0.9 : 0},
    [`${P}cord-b`]: {opacity: r(clamp(q * 6, 0, 1), 3)},
    [`${P}cord-a`]: {opacity: r(clamp((q - 0.85) * 6.67, 0, 1), 3)},
  };
}
