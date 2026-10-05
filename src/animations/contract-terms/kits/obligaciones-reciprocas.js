/**
 * Kit for the "Obligaciones recíprocas" motif (contract-terms-03, LAW-0489..0492).
 * Art, text fitting and pure geometry only: every entry owns its timeline, layout choices and semantics. The text
 * fitting, rig metrics and Spanish-defaults wrapper are copied from the contract-terms-02 kit
 * (contract-terms/kits/termino-definido.js, read-only; copied, never imported).
 *
 * Objects (original vector art, the category's editorial-flat language):
 *  - the CONTRACT BOARD (the contract): a standing board with its head band ("CT-903 · Contract (fictional)") and two
 *    layer sheets behind it (its layers). It holds TWO COLUMNS of equal size: Party A's column (● solid disc, the
 *    supplied heading "Obligation of A") and Party B's column (◆ solid diamond, "Obligation of B"), each a light panel
 *    with its party's colour as the heading band and a TRAY (a wood ledge) at its foot. The gutter between them is
 *    where the links run.
 *  - PERFORMANCE CARDS (the clauses): cards printed with the supplied, fictional, generic performances ("Performance
 *    A1 (supplied text)"), all of the same size. A card carries its party's glyph and colour stripe at its outer end
 *    and its link port at its inner end. Cards rest in their party's tray (stacked) or seated in their column.
 *  - LINKS: a solid, neutral ink cord with no arrowhead from an A card's port (●) to a B card's port (◆), drawn from
 *    both ends at once and joined in the middle: "linked as supplied" only — never an exchange that is due, a
 *    condition, a dependency or an order of performance. ● and ◆ have the same area and stroke.
 *  - two standing PEOPLE, one on each side of the board, each placing their own cards (the same motion, mirrored, at
 *    the same time).
 * Legal content (high risk): no rule about reciprocal obligations — no withholding of performance, no order of
 * performance, no conditionality, no breach, no remedy, no termination — and no jurisdiction. Obligation A and
 * obligation B have equal weight, size and timing; neither side is primary. The key reads "As supplied · no conclusion
 * drawn".
 * @module animations/contract-terms/kits/obligaciones-reciprocas
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath, mix} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj, int, party} from '../../../schemas/fields.js';
import {measure, fitText} from '../../../core/text.js';

/* ======================================================================== */
/* Shared helpers (copied from contract-terms/kits/termino-definido.js — read-only, never imported) */
/* ======================================================================== */

const GLUE = '⁠';

/** Keep a number with the word before it ("Day 10") and a short tail word with its line. */
export function keepNumbers(text) {
  return String(text ?? '')
    .replace(/(\S)[ \t]+(\d[\d.,:/-]*)(?=[\s)·,;.]|$)/gu, '$1 $2')
    .replace(/^(\d[\d.]*)[ \t]+(?=\S)/u, '$1 ');
}

/** fitW results memoised on every input (pure; callers only read them). */
const FITW = new Map();
/**
 * Fit text into maxWidth × maxLines at the largest size in [size, minSize] that wraps whole words only (glued pairs
 * never split) and leaves no 1–2 character line. Returns a fitText-shaped result plus `bad` when it could not be done.
 * @param {string} text
 * @param {{maxWidth:number, size:number, minSize?:number, maxLines?:number, weight?:number, family?:'sans'|'serif'|'mono', leading?:number, balance?:boolean}} o
 */
export function fitW(text, o) {
  const key = `${text}\u0001${o.maxWidth}|${o.size}|${o.minSize}|${o.maxLines}|${o.weight}|${o.family}|${o.leading}|${o.balance}`;
  const hit = FITW.get(key);
  if (hit) return hit;
  const res = fitWRaw(text, o);
  if (FITW.size > 50000) FITW.clear();
  FITW.set(key, res);
  return res;
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
  const tokens = [];
  for (const w of keepNumbers(full).replace(/ /g, GLUE).replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)) {
    if (/^[·•–—|:]$/.test(w) && tokens.length) tokens[tokens.length - 1] += `${GLUE}${w}`;
    else tokens.push(w);
  }
  const wrapAt = (w, sz) => {
    const lines = [];
    let cur = '';
    for (const t of tokens) {
      const cand = cur ? `${cur} ${t}` : t;
      if (!cur || m(cand, sz) <= w) cur = cand;
      else { lines.push(cur); cur = t; }
    }
    if (cur) lines.push(cur);
    return lines;
  };
  const step = Math.max(0.5, o.size * 0.035);
  let best = null;
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
  if (!best) {
    const f = fitText(full, {maxWidth, size: minSize, minSize, maxLines, weight, family, leading});
    return {...f, bad: true};
  }
  const width = Math.max(...best.lines.map(l => measure(l, best.size, weight, family)));
  const lineHeight = best.size * leading;
  return {lines: best.lines, size: best.size, lineHeight, width, height: lineHeight * (best.lines.length - 1) + best.size, truncated: false, full, weight, family, bad: false};
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
export const insideBox = (a, b, pad = 0) => a.x >= b.x + pad - 0.01 && a.y >= b.y + pad - 0.01 && a.x + a.w <= b.x + b.w - pad + 0.01 && a.y + a.h <= b.y + b.h - pad + 0.01;
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

/**
 * Glue the tokens that must never part with no-break spaces (fitW keeps a no-break space as one token): a lone capital
 * letter with the word before it ("Party B", "of A"), a short id with the word before it ("Performance A1"), a number
 * with its unit ("10:20 h").
 */
export function glueText(text) {
  return String(text ?? '')
    .replace(/(\d)[ \t]+(h|hrs?|min|am|pm|AM|PM|%)(?=$|[\s),.;:·])/gu, '$1 $2')
    .replace(/(\S)[ \t]+(\(?[A-Z]\)?(?:['’]s)?)(?=$|[,.;:)·]|[ \t]+[^\p{Ll}\s])/gu, '$1 $2')
    .replace(/(\S)[ \t]+([A-Z]['’]s)(?=$|[\s,.;:)·])/gu, '$1 $2')
    // (a name word with its letter or number, whatever follows: "Party B joined", "link 1")
    .replace(/(^|[\s(])(Party|Parte|party|parte|Column|Columna|column|columna|Link|Enlace|link|enlace|of|de)[ \t]+([A-Z]|\d+)(?=$|[\s,.;:)·'’])/gu, '$1$2\u00a0$3');
}

/** A short closing parenthetical — "(supplied text)", "(as supplied)", "(texto aportado)" — kept on one line (copied
 * from LAW-0488: review ct02 "(as / supplied)"). */
export function glueParen(text) {
  return String(text ?? '').replace(/\(([^()]{1,26})\)/gu, (m0, inner) => (inner.trim().split(/\s+/).length <= 3 ? `(${inner.replace(/[ \t]+/g, ' ')})` : m0));
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
export function fitG(text, o) {
  const s = glueParen(glueText(text));
  const f = fitW(s, o);
  if (f.bad || !oneWordLine(f.lines)) return f;
  for (let k = 0.96; k >= 0.5; k -= 0.04) {
    const f2 = fitW(s, {...o, maxWidth: o.maxWidth * k});
    if (f2.bad) break;
    if (!oneWordLine(f2.lines)) return f2;
  }
  const lastTwo = s.replace(/[ \t]+(\S+)$/u, ' $1');
  const f3 = fitW(lastTwo, o);
  if (!f3.bad && !oneWordLine(f3.lines)) return f3;
  return o.strict ? {...f, bad: true} : f;
}

/** chipW with a glued fit (fitG). */
export function chipG(ctx, text, o) {
  const size = o.size, padX = o.padX ?? size * 0.6;
  return chipW(ctx, text, {...o, fit: o.fit || fitG(text, {maxWidth: o.maxWidth - padX * 2, size, minSize: o.minSize ?? size, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600})});
}

export const INK = '#1f2328';

/* ======================================================================== */
/* Fields, defaults and strings                                             */
/* ======================================================================== */

const linkItem = obj('One link as supplied: the position of a performance in column A and of one in column B (1 = top). A link means only "linked as supplied" — never an exchange that is due, a condition or an order of performance', {
  a: int('Position of the performance in column A (1–3)', 1, 3),
  b: int('Position of the performance in column B (1–3)', 1, 3),
}, ['a', 'b']);

/** Motif fields shared by the four treatments. */
export const motifFields = {
  parties: list('Party A (column ●) and Party B (column ◆); fictional by default, equal weight', party, 2, 2),
  contract: obj('The contract board', {
    reference: str('Reference printed on the contract (fictional)', 32),
    title: str('Heading of the contract, as supplied (generic, e.g. "Contract (fictional)")', 80),
  }, ['reference', 'title']),
  columns: obj('The two column headings, as supplied (equal weight)', {
    a: str('Heading of Party A\'s column (e.g. "Obligation of A")', 50),
    b: str('Heading of Party B\'s column (e.g. "Obligation of B")', 50),
  }, ['a', 'b']),
  performancesA: list('Performances listed in Party A\'s column, as supplied (generic, fictional placeholders, e.g. "Performance A1 (supplied text)"; never real contract text)', str('Performance, as supplied', 70), 1, 3),
  performancesB: list('Performances listed in Party B\'s column, as supplied (generic, fictional placeholders, e.g. "Performance B1 (supplied text)")', str('Performance, as supplied', 70), 1, 3),
  links: list('Links between the two columns, as supplied (each joins one performance of A and one of B; "linked as supplied" only). Positions beyond a column\'s list are ignored', linkItem, 0, 3),
};

export const DEFAULT_CONTENT = {
  parties: [{name: 'Inés Robles', role: 'Party A'}, {name: 'Mateo Aranda', role: 'Party B'}],
  contract: {reference: 'CT-903', title: 'Contract (fictional)'},
  columns: {a: 'Obligation of A', b: 'Obligation of B'},
  performancesA: ['Performance A1 (supplied text)', 'Performance A2 (supplied text)'],
  performancesB: ['Performance B1 (supplied text)', 'Performance B2 (supplied text)'],
  links: [{a: 1, b: 1}, {a: 2, b: 2}],
};

/** The Spanish counterpart of DEFAULT_CONTENT (the baseline-es content). */
export const DEFAULT_CONTENT_ES = {
  parties: [{name: 'Inés Robles', role: 'Parte A'}, {name: 'Mateo Aranda', role: 'Parte B'}],
  contract: {reference: 'CT-903', title: 'Contrato (ficticio)'},
  columns: {a: 'Obligación de A', b: 'Obligación de B'},
  performancesA: ['Prestación A1 (texto aportado)', 'Prestación A2 (texto aportado)'],
  performancesB: ['Prestación B1 (texto aportado)', 'Prestación B2 (texto aportado)'],
  links: [{a: 1, b: 1}, {a: 2, b: 2}],
};

export const KIT_STRINGS = {
  en: {
    linked: 'Performances linked as supplied',
    listed: 'Listed side by side · no link supplied',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    linked: 'Prestaciones enlazadas según lo aportado',
    listed: 'Una junto a otra · sin enlace aportado',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** The two supplied configurations of the hold: the links drawn as supplied, or the columns listed side by side with
 * no link drawn. Neutral and of equal weight; nothing is inferred from either. */
export const FINAL_STATES = ['linked', 'listed'];

/** The supplied links that join existing performances (positions beyond a list are ignored; duplicates once). */
export function validLinks(p, links = p.links) {
  const seen = new Set();
  return (links || []).filter(l => l.a >= 1 && l.b >= 1 && l.a <= p.performancesA.length && l.b <= p.performancesB.length && !seen.has(`${l.a}-${l.b}`) && seen.add(`${l.a}-${l.b}`));
}

/** Party colours: two solid, equally strong hues (never dashed, never faded to tell them apart). */
export function partyColor(ctx, side) {
  return side === 'a' ? ctx.theme.accent2 : ctx.theme.accent3;
}

/** Solid glyph: ● for Party A, ◆ for Party B (same area, same stroke). */
export function glyph(ctx, side, x, y, R, o = {}) {
  const fill = o.fill ?? partyColor(ctx, side);
  const sw = Math.max(2, R * 0.16);
  if (side === 'a') return h('circle', {name: o.name, cx: r(x), cy: r(y), r: r(R), fill, stroke: INK, 'stroke-width': r(sw, 2)});
  // (a diamond of the same area as the disc: half-diagonal R·√(π/2))
  const d = R * 1.2533;
  return h('path', {name: o.name, d: `M${r(x)} ${r(y - d)}L${r(x + d)} ${r(y)}L${r(x)} ${r(y + d)}L${r(x - d)} ${r(y)}Z`, fill, stroke: INK, 'stroke-width': r(sw, 2), 'stroke-linejoin': 'round'});
}

/* ======================================================================== */
/* Measuring the board                                                      */
/* ======================================================================== */

export const LH = 1.18;
/** px at 1080p of the body text, largest first (stress may go down to the 16 px floor). */
export const PX_BASE = [32, 30, 28, 26, 24, 22, 21, 20, 19.6];
export const PX_STRESS = [30, 28, 26, 24, 22, 21, 20, 19.6, 18.5, 17.5, 16.6, 16.1];

/**
 * Card metrics for body size F and card width cw: the text zone and the fitted texts (every card of both columns the
 * same size — the larger need). Returns null when a text does not fit in 3 lines.
 */
export function measureCards(texts, F, cw, show, tight = false, gzK = 1.12) {
  const gz = F * gzK, pz = F * 0.72, padX = F * 0.3, padY = F * (tight ? 0.42 : 0.62);
  const tw = cw - gz - pz - padX;
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
  return {fits, ch, gz, pz, padX, padY, tw, lines};
}

/* ======================================================================== */
/* Art                                                                      */
/* ======================================================================== */

/**
 * Performance card (local origin = its centre): a white card with its party's colour stripe and glyph at the OUTER end
 * and its link port at the INNER end (A: outer = left; B: outer = right). The print sits in `${name}-txt` (labels
 * shown) or `${name}-bars` (labels hidden: two neutral print bars).
 */
export function perfCard(ctx, {name, side, cw, ch, C, fit, F, ring = false}) {
  const th = ctx.theme;
  const x0 = -cw / 2, y0 = -ch / 2;
  const outerLeft = side === 'a';
  const col = partyColor(ctx, side);
  const sw = Math.max(5, F * 0.24);
  const gx = outerLeft ? x0 + C.gz * 0.5 : x0 + cw - C.gz * 0.5;
  const tx = outerLeft ? x0 + C.gz : x0 + C.pz;
  const kids = [
    h('path', {d: roundRectPath(x0 + 3, y0 + 5, cw, ch, 8), fill: th.shadow}),
    h('path', {name: `${name}-sheet`, d: roundRectPath(x0, y0, cw, ch, 8), fill: th.card, stroke: INK, 'stroke-width': 2.4}),
    // the party's stripe at the outer end
    h('path', {d: outerLeft ? `M${r(x0 + sw / 2 + 3)} ${r(y0 + 7)}V${r(y0 + ch - 7)}` : `M${r(x0 + cw - sw / 2 - 3)} ${r(y0 + 7)}V${r(y0 + ch - 7)}`, stroke: col, 'stroke-width': r(sw, 2), 'stroke-linecap': 'round'}),
    glyph(ctx, side, gx + (outerLeft ? sw * 0.35 : -sw * 0.35), 0, F * 0.36),
  ];
  if (fit) kids.push(g({name: `${name}-txt`}, textBlock(fit, {x: r(tx), y: r(-fit.height / 2), fill: INK})));
  else {
    const bw = cw - C.gz - C.pz - C.padX;
    kids.push(g({name: `${name}-bars`},
      h('rect', {x: r(tx), y: r(-F * 0.42), width: r(bw * 0.88), height: r(F * 0.3), rx: 3, fill: INK, opacity: 0.7}),
      h('rect', {x: r(tx), y: r(F * 0.16), width: r(bw * 0.56), height: r(F * 0.3), rx: 3, fill: th.inkFaint, opacity: 0.7})));
  }
  // (a contrast scene's highlight: a solid ring round the card — the one outline that points to the changed fact)
  if (ring) kids.push(h('path', {name: `${name}-ring`, d: roundRectPath(x0 - 9, y0 - 9, cw + 18, ch + 18, 13), fill: 'none', stroke: th.accent, 'stroke-width': r(Math.max(4, F * 0.18), 2), opacity: 0}));
  return g({name, 'data-occludes': 1}, kids);
}

/** Port of a card (card-centre coordinates): the middle of its inner edge. */
export const portOf = (side, cw) => ({x: side === 'a' ? cw / 2 : -cw / 2, y: 0});

/**
 * A link's path between two ports (world): a cubic with horizontal tangents through the gutter, split at its middle
 * into the two halves that draw on from either end (each starts at its port). Returns {da, db, la, lb, mid}.
 */
export function linkGeom(pa, pb) {
  const dx = Math.max(20, (pb.x - pa.x) * 0.5);
  const c1 = {x: pa.x + dx, y: pa.y}, c2 = {x: pb.x - dx, y: pb.y};
  // de Casteljau at 0.5
  const m01 = mix(pa, c1, 0.5), m12 = mix(c1, c2, 0.5), m23 = mix(c2, pb, 0.5);
  const m012 = mix(m01, m12, 0.5), m123 = mix(m12, m23, 0.5);
  const mid = mix(m012, m123, 0.5);
  const P = q => `${r(q.x, 2)} ${r(q.y, 2)}`;
  const da = `M${P(pa)}C${P(m01)} ${P(m012)} ${P(mid)}`;
  const db = `M${P(pb)}C${P(m23)} ${P(m123)} ${P(mid)}`;
  const lenOf = (p0, p1, p2, p3) => {
    let L = 0, prev = p0;
    for (let i = 1; i <= 24; i++) {
      const t = i / 24, u = 1 - t;
      const q = {x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y};
      L += Math.hypot(q.x - prev.x, q.y - prev.y);
      prev = q;
    }
    return L;
  };
  return {da, db, la: lenOf(pa, m01, m012, mid), lb: lenOf(pb, m23, m123, mid), mid};
}

/* ======================================================================== */
/* Layout                                                                   */
/* ======================================================================== */

/**
 * Solve one board scene in `o.box` (design units) at body size F and figure scale k. Party A stands at the left of the
 * board facing it, Party B at the right; each column's tray is low enough and its rows high enough for its party's
 * near hand (the solved reach of the rig). Returns the geometry or null when it does not fit.
 * o: {box, F, k, nRows, texts:{a:[], b:[]}, show, showKey, contract (head text), columns {a,b}, names [2] | null,
 *     plates {a,b} | null, notesH: [below, top] heights of the notes to place, trays: bool, gripIn,
 *     glyphZone (width of the card's outer glyph zone in body sizes; default 1.12),
 *     bandInset (under: rig units kept clear on each side of the notes band between the people; default 52)}
 */
export function boardGeom(ctx, o) {
  const {box, F, k} = o;
  const show = o.show;
  const FL = F;
  const under = o.mode === 'under';
  const gapP = Math.max(8, F * 0.3);
  const layerUp = Math.max(10, F * 0.45);
  let xA, xB, bx0, bx1;
  if (under) { bx0 = box.x + 2; bx1 = box.x + box.w - 2 - layerUp * 2; }
  else {
    xA = box.x + 50 * k + 1; xB = box.x + box.w - 50 * k - 1;
    bx0 = xA + 48 * k + gapP; bx1 = xB - 48 * k - gapP;
  }
  const BW = bx1 - bx0;
  if (BW < F * (o.cardText === false ? 11 : 16)) return null;
  const tight = o.tight ?? false;
  const m = Math.max(12, F * (tight ? 0.36 : 0.5));
  const gw = Math.max(F * (tight ? 2.4 : 3.4), BW * (o.gutter ?? 0.2));
  const colW = (BW - 2 * m - gw) / 2;
  const ci = Math.max(6, F * (tight ? 0.2 : 0.38));
  const cw = colW - 2 * ci;
  const C = measureCards([...o.texts.a, ...o.texts.b, ...(o.texts.x || [])], F, cw, show && o.cardText !== false, tight, o.glyphZone ?? 1.12);
  if (!C) return null;
  // (cards are real objects, never tokens: at least o.minCh tall)
  const ch = Math.max(C.ch, o.minCh ?? 0);
  // column headings (glyph + supplied heading)
  let colFit = show ? ['a', 'b'].map(s => fitG(o.columns[s], {maxWidth: colW - 2 * ci - F * 1.6, size: FL, maxLines: tight ? 3 : 2, weight: 700})) : [null, null];
  // (print-bar boards whose headings are drawn once in the panel: glyph-only headings when the column is narrow)
  if (o.cardText === false && colFit.some(f => f && f.bad)) colFit = [null, null];
  if (colFit.some(f => f && f.bad)) return null;
  const colHH = colFit[0] ? Math.max(...colFit.map(f => f.height)) + F * (tight ? 0.5 : 0.7) : F * 1.5;
  // the contract's head (reference · title)
  const headFit = show && o.headText !== false ? fitG(o.contract, {maxWidth: BW - 2 * m - F, size: F, maxLines: 3, weight: 700}) : null;
  if (headFit && headFit.bad) return null;
  const hbH = headFit ? headFit.height + F * (tight ? 0.5 : 0.7) : o.headText === false ? F * 0.55 : F * 1.4;
  // names under the feet
  const nmW = Math.min(box.w * 0.46, 24 * FL);
  const names = (o.names || [null, null]).map(c => (c ? {fit: fitG(c, {maxWidth: nmW - FL * 1.2, size: FL, maxLines: 3, weight: 600}), maxW: nmW} : null));
  if (names.some(n => n && n.fit.bad)) return null;
  const nameH = Math.max(0, ...names.map(n => (n ? n.fit.height + FL * 0.72 : 0)));
  const floor = box.y + box.h - (nameH ? nameH + F * 0.35 : 4);
  const gripIn = o.gripIn ?? F * 0.55;
  const inward = s => (s === 'a' ? 1 : -1);
  const colXs = [bx0 + m, bx1 - m - colW];
  const cardX = s => (s === 'a' ? colXs[0] : colXs[1]) + colW / 2;
  if (under) {
    // the people stand under their own column's outer half, facing the middle; the near shoulder under the grip
    const gx = cardX('a') - (cw / 2 - gripIn);
    xA = Math.max(box.x + 50 * k + 1, gx - 16 * k);
    xB = box.x + box.w - (xA - box.x) - layerUp * 2;
    if (xB - xA < 2 * 100 * k) return null;
  }
  const figA = {x: xA, floor, f: 1, k}, figB = {x: xB, floor, f: -1, k};
  const sA = shoulderAt(figA);
  const push = under ? 0 : Math.min(m + ci - 2, F * 0.6);
  const R = RIG.reach * k * 0.95;
  // (from under the board the plates hang under the ledge at the column's inner end: a thin ledge the raised hand reaches)
  if (o.plates && ['a', 'b'].some(s => o.plates[s] && fitG(o.plates[s], {maxWidth: colW - 4 - F * (under ? 0 : 1), size: FL, maxLines: 1, weight: 700}).bad)) return null;
  const lipH = o.plates && !under ? FL * 1.3 : Math.max(10, F * 0.42);
  const tagH = o.plates && under ? FL * 1.3 + 4 : 0;
  const so = Math.max(5, F * 0.22);
  const nStack = o.trays ? Math.max(o.texts.a.length, o.texts.b.length, 1) : 1;
  const gS = Math.max(8, F * 0.4);
  const gT = Math.max(10, F * 0.5);
  const nRows = o.nRows;
  const topNotes = o.notesH ? o.notesH[1] : 0;
  const top = box.y + layerUp + 2 + (topNotes ? topNotes + F * 0.4 : 0);
  let trayCY, rowTopLimit, reachTop = -Infinity;
  if (under) {
    // the tray (the board's foot) just above the heads, within the raised hand's reach
    const headTop = floor - 414 * k;
    trayCY = headTop - Math.max(8, F * 0.3) - m * 0.45 - lipH - ch / 2;
    void tagH;
    rowTopLimit = top + hbH + m * 0.9 + colHH + gS + ch / 2;
  } else {
    const dx = Math.max(0, bx0 + m + ci + gripIn - sA.x);
    if (dx >= R) return null;
    const dyMax = Math.sqrt(R * R - dx * dx);
    trayCY = sA.y + dyMax + ch * 0.32;
    rowTopLimit = sA.y - dyMax * 0.97 + ch / 2 - ch * 0.32;
    // (never spread the rows above what the board's top allows)
    const roomTop = top + hbH + m * 0.9 + colHH + gS + ch / 2;
    reachTop = rowTopLimit;
    rowTopLimit = Math.max(rowTopLimit, roomTop);
  }
  const rowY = [];
  // (o.noTrayZone: no card ever rests in the tray — the lowest row sits just above the ledge)
  const lowRow = o.noTrayZone ? trayCY : trayCY - ch / 2 - (nStack - 1) * so - gT - ch / 2;
  // (rows spread over the band they may use, up to a gap of 0.6 card heights: the columns stand tall, never as
  // near-empty panels)
  const gS2 = nRows > 1 ? clamp((lowRow - rowTopLimit) / (nRows - 1) - ch, gS, Math.max(gS, ch * (o.rowGap ?? 0.6))) : gS;
  for (let i = 0; i < nRows; i++) rowY.push(lowRow - (nRows - 1 - i) * (ch + gS2));
  if (!under && rowY[0] < reachTop - ch / 2 - 1) return null;
  const colTop = rowY[0] - ch / 2 - gS - colHH;
  const yT = colTop - m * 0.5 - hbH - m * 0.4;
  const ledgeTop = trayCY + ch / 2;
  const yB = ledgeTop + lipH + m * 0.45;
  // (from under the board the plates hang at the columns' inner ends: never over a head)
  if (under && o.plates) {
    for (const [i, s] of [[0, 'a'], [1, 'b']]) {
      if (!o.plates[s]) continue;
      const tw = fitG(o.plates[s], {maxWidth: colW - 4, size: FL, maxLines: 1, weight: 700}).width + F * 0.8;
      const lx = colXs[i] + 2, lw = colW - 4;
      const tb = {x: s === 'a' ? lx + lw - tw - 4 : lx + 4, y: trayCY + ch / 2 + lipH + m * 0.45, w: tw, h: tagH};
      if ([headBox(figA), headBox(figB)].some(hb => overlaps(hb, tb, 4))) return null;
    }
  }
  if (yT < top) return null;
  // the band under the board for the notes (between its legs; between the two people when they stand under it)
  const legX = Math.max(14, BW * 0.06) + F * 0.6;
  const bandBelow = under
    ? {x: xA + (o.bandInset ?? 52) * k + F * 0.4, y: yB + tagH + F * 0.4, w: xB - xA - (o.bandInset ?? 52) * 2 * k - F * 0.8, h: floor - yB - tagH - F * 0.6}
    : {x: bx0 + legX, y: yB + F * 0.4, w: BW - 2 * legX, h: floor - yB - F * 0.6};
  if (o.reserveBelow && bandBelow.w < o.reserveBelow(F).w) return null;
  if (o.notesH && o.notesH[0] && (bandBelow.h < o.notesH[0] || bandBelow.w < F * 8)) return null;
  const board = {x: bx0, y: yT, w: BW, h: yB - yT};
  const cols = ['a', 'b'].map((s, i) => {
    const x = colXs[i];
    return {side: s, x, y: colTop, w: colW, h: yB - m * 0.45 - colTop, cx: x + colW / 2, head: {x, y: colTop, w: colW, h: colHH}, fit: colFit[i]};
  });
  const gutter = {x: bx0 + m + colW, y: colTop, w: gw, h: yB - m * 0.45 - colTop};
  // card centres: seated rows and tray stack (the deeper a card in the stack, the further it peeks up and inward)
  const trayAt = (s, depth) => ({x: cardX(s) + inward(s) * depth * so, y: trayCY - depth * so});
  const rowAt = (s, i) => ({x: cardX(s), y: rowY[i]});
  // the grip: the card's outer end (beside the board), or its lower outer corner (from under the board)
  // (beside the board the hand takes the outer end at the point nearest its shoulder: a high card by its lower part)
  const gripOf = (s, c) => ({x: c.x - inward(s) * (cw / 2 - gripIn), y: under ? c.y + ch / 2 - F * 0.35 : c.y + clamp(sA.y - c.y, -ch * 0.32, ch * 0.32)});
  const ok = [];
  // (from under the board the hand pushes the card up by pushD, then the card slides on along its column)
  let pushD = 0;
  if (o.noReach) pushD = 1;
  else if (under) {
    for (const q of [0.9, 0.7, 0.5, 0.35, 0.2]) {
      const d = q * ch;
      if ([figA, figB].every((fig, i) => { const s = i ? 'b' : 'a'; return [...Array(nStack).keys()].every(j => canReach(fig, 'near', gripOf(s, trayAt(s, j))) && canReach(fig, 'near', gripOf(s, {x: trayAt(s, j).x, y: trayAt(s, j).y - d}))); })) { pushD = d; break; }
    }
    if (!pushD) return null;
  } else {
    for (const s of ['a', 'b']) {
      const fig = s === 'a' ? figA : figB;
      for (let d = 0; d < nStack; d++) ok.push(canReach(fig, 'near', gripOf(s, {x: trayAt(s, d).x - inward(s) * push, y: trayAt(s, d).y})), canReach(fig, 'near', gripOf(s, trayAt(s, d))));
      for (let i = 0; i < nRows; i++) ok.push(canReach(fig, 'near', gripOf(s, rowAt(s, i))), canReach(fig, 'near', gripOf(s, {x: rowAt(s, i).x - inward(s) * push, y: rowAt(s, i).y})));
    }
    if (ok.some(v => !v)) return null;
  }
  return {
    F, FL, k, m, gw, colW, ci, cw, ch, C, so, push, pushD, under, tagH, gripIn, lipH, layerUp, hbH, headFit, colHH,
    figA, figB, board, cols, gutter, rowY, trayCY, ledgeTop, yB, yT, floor, names, nameH, bandBelow,
    trayAt, rowAt, gripOf, inward, cardX, nStack,
    ledge: ['a', 'b'].map((s, i) => ({x: cols[i].x + 2, y: ledgeTop, w: colW - 4, h: lipH})),
  };
}

/** Free placement of the notes (final tag, key, annotations) in a band: rows of centred chips. */
export function placeNotes(ctx, items, band, F, cols = 1) {
  const maxW = Math.min(cols > 1 ? (band.w - F * 0.8 * (cols - 1)) / cols : band.w, 30 * F);
  const chips = items.map(it => ({it, c: chipG(ctx, it.text, {x: 0, y: 0, maxWidth: maxW, size: F, maxLines: 3, weight: it.weight ?? 600})}));
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
 * Lay out one board scene (two people, the contract board with its two columns, trays, cards, links, names and notes).
 * Searches the body size (largest first) and the figure scale (largest that fits) so that the people's heads stay at or
 * above o.headMin px and, while a layout allows, at or above o.headTarget px.
 * o: {box, upx, prefix, px:[...], headMin, headTarget, kMax, texts {a,b,x?}, nRows, contract, columns, names, plates,
 *     notes:[{name, kind, text, target?}], notesWhere:'auto'|'below'|'top', trays}
 */
export function layoutBoard(ctx, o) {
  const P = o.prefix ?? '';
  const show = ctx.show('all');
  const box = o.box;
  const notes = o.notes || [];
  const pxs = o.px ?? PX_BASE;
  const kStep = 0.02;
  let best = null;
  const tries = [];
  for (const px of pxs) {
    const F = px / o.upx;
    const kHi = Math.min(o.kMax ?? 2.2, (box.h - (o.names ? F * 2.6 : 6)) / 418);
    // (the rendered head — face and hair — is at least about 83 rig units tall, whatever the hairstyle)
    const kLo = (o.headMin ?? 45) / (82 * o.upx);
    // (o.kOnly: the figure scale is given — a twin scene laid out exactly like its pair)
    for (let k = o.kOnly ?? kHi; k >= (o.kOnly ?? kLo) - 1e-9; k = o.kOnly ? -1 : k - kStep < kLo && k > kLo + 1e-6 ? kLo : k - kStep) {
      const bw = o.mode === 'under' ? box.w * 0.5 : box.w - 2 * (98 * k + Math.max(8, F * 0.3));
      const nh = Math.max(notesHeight(ctx, notes, Math.max(F * 8, bw * 0.84), F), o.reserveBelow ? o.reserveBelow(F).h : 0);
      const wheres = o.reserveBelow ? ['below'] : o.notesWhere === 'top' ? ['top'] : o.notesWhere === 'below' ? ['below'] : ['below', 'top'];
      let G = null, where = null;
      for (const wh of wheres) {
        G = boardGeom(ctx, {...o, F, k, show, notesH: notes.length || o.reserveBelow ? (wh === 'below' ? [nh, 0] : [0, nh]) : null});
        if (G) { where = wh; break; }
      }
      if (!G) continue;
      const headPx = 90 * k * o.upx;
      const cand = {G, where, px, F, k, headPx};
      tries.push(cand);
      if (!best) best = cand;
      break;
    }
    if (best && best.headPx >= (o.headTarget ?? 0)) break;
  }
  // (no size reaches the head target: the largest heads among the fitting sizes)
  if (best && best.headPx < (o.headTarget ?? 0)) best = tries.reduce((a, b) => (b.headPx > a.headPx + 0.5 ? b : a), best);
  if (!best) return {ok: false, why: ['no-layout-fits'], P};
  const {G, where, F} = best;
  // notes placement
  let notesPl = null;
  if (notes.length) {
    const band = where === 'below' ? G.bandBelow : {x: box.x + F * 0.4, y: box.y, w: box.w - F * 0.8, h: G.yT - G.layerUp - box.y - F * 0.4};
    notesPl = placeNotes(ctx, notes, band, F);
    if (where === 'top' && notesPl) {
      // (the top band's notes sit just above the board)
      const dy = band.y + band.h - notesPl.h - band.y;
      notesPl.placed.forEach(q => { q.y += Math.max(0, dy); });
    }
  }
  return {ok: true, why: [], P, show, cardText: show && o.cardText !== false, ...best, G, F, FL: F, notesWhere: where, notesPl, upx: o.upx, box};
}

/* ======================================================================== */
/* Building                                                                 */
/* ======================================================================== */

/**
 * Board art: layers behind, frame, head band, two column panels with heading bands, trays (ledges), legs.
 * o.platesOut (array): the tray plates are pushed there instead of into the board (the caller draws them later, over
 * a prop that passes behind them).
 */
export function boardArt(ctx, L, o = {}) {
  const th = ctx.theme;
  const G = L.G, P = L.P, F = L.F;
  const B = G.board;
  const show = L.show;
  const kids = [];
  const up = G.layerUp;
  // legs (behind the board): near the board's outer ends, with feet on the floor
  const lx = Math.max(14, B.w * 0.06);
  for (const x of [B.x + lx, B.x + B.w - lx]) {
    kids.push(h('path', {d: `M${r(x)} ${r(B.y + B.h - 4)}V${r(G.floor - 6)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(9, F * 0.42), 2), 'stroke-linecap': 'round'}));
    kids.push(h('path', {d: `M${r(x - F * 1.1)} ${r(G.floor - 4)}H${r(x + F * 1.1)}`, stroke: th.woodDark, 'stroke-width': r(Math.max(8, F * 0.36), 2), 'stroke-linecap': 'round'}));
  }
  // the layers: two sheets behind the board, offset up and to the right
  kids.push(h('path', {d: roundRectPath(B.x + up * 2, B.y - up * 2 + up * 0.0, B.w - up * 2, B.h * 0.5, 10), fill: shade(th.card, -0.1), stroke: INK, 'stroke-width': 2}));
  kids.push(h('path', {d: roundRectPath(B.x + up, B.y - up, B.w - up, B.h * 0.6, 10), fill: shade(th.card, -0.05), stroke: INK, 'stroke-width': 2}));
  kids.push(h('path', {d: roundRectPath(B.x + 4, B.y + 6, B.w, B.h, 12), fill: th.shadow}));
  kids.push(h('path', {name: `${P}board-sheet`, d: roundRectPath(B.x, B.y, B.w, B.h, 12), fill: th.paper, stroke: INK, 'stroke-width': 2.8}));
  // head band
  const hb = {x: B.x + G.m * 0.5, y: B.y + G.m * 0.4, w: B.w - G.m, h: G.hbH};
  kids.push(h('path', {d: roundRectPath(hb.x, hb.y, hb.w, hb.h, 8), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.8}));
  if (G.headFit) kids.push(g({name: `${P}board-head`}, textBlock(G.headFit, {x: r(B.x + B.w / 2), y: r(hb.y + (hb.h - G.headFit.height) / 2), anchor: 'middle', fill: INK})));
  else if (G.hbH > F) kids.push(h('rect', {x: r(B.x + B.w / 2 - B.w * 0.18), y: r(hb.y + hb.h / 2 - F * 0.17), width: r(B.w * 0.36), height: r(F * 0.34), rx: 3, fill: INK, opacity: 0.6}));
  // the two columns
  G.cols.forEach((c, i) => {
    const s = c.side;
    const col = partyColor(ctx, s);
    const soft = s === 'a' ? th.accent2Soft : th.accent3Soft;
    kids.push(h('path', {name: `${P}col-${s}`, d: roundRectPath(c.x, c.y, c.w, c.h, 9), fill: shade(soft, 0.45), stroke: th.inkSoft, 'stroke-width': 2}));
    // heading band in the party's colour
    kids.push(h('path', {d: `M${r(c.x + 8)} ${r(c.y + 3)}H${r(c.x + c.w - 8)}`, stroke: col, 'stroke-width': r(Math.max(6, F * 0.28), 2), 'stroke-linecap': 'round'}));
    const R = F * 0.38;
    if (c.fit) {
      const tw = c.fit.width + R * 2 + F * 0.45;
      const gx = c.cx - tw / 2 + R;
      kids.push(glyph(ctx, s, gx, c.y + (c.head.h) / 2 + 2, R));
      kids.push(g({name: `${P}col-${s}-head`}, textBlock(c.fit, {x: r(gx + R + F * 0.45), y: r(c.y + (c.head.h - c.fit.height) / 2 + 2), fill: INK})));
    } else kids.push(glyph(ctx, s, c.cx, c.y + c.head.h / 2 + 2, F * 0.5));
    // tray ledge (wood) with its plate
    const lg = G.ledge[i];
    kids.push(h('path', {name: `${P}tray-${s}`, d: roundRectPath(lg.x, lg.y, lg.w, lg.h, 4), fill: th.woodTop, stroke: th.woodDark, 'stroke-width': 2}));
    if (show && L.plates && L.plates[s]) {
      const pf = fitG(L.plates[s], {maxWidth: lg.w - F, size: L.FL, maxLines: 1, weight: 700});
      if (G.under) {
        // a tag hanging under the ledge, at the column's inner end
        const tw = pf.width + F * 0.8, tx = s === 'a' ? lg.x + lg.w - tw - 4 : lg.x + 4, ty = G.yB + 2;
        (o.platesOut ?? kids).push(g({name: `${P}plate-${s}`}, h('path', {d: `M${r(tx + tw / 2)} ${r(lg.y + lg.h)}V${r(ty)}`, stroke: th.woodDark, 'stroke-width': 2}), h('path', {d: roundRectPath(tx, ty, tw, G.tagH - 4, 5), fill: th.woodTop, stroke: th.woodDark, 'stroke-width': 2}), textBlock(pf, {x: r(tx + tw / 2), y: r(ty + (G.tagH - 4 - pf.height) / 2), anchor: 'middle', fill: INK})));
      } else (o.platesOut ?? kids).push(g({name: `${P}plate-${s}`}, textBlock(pf, {x: r(lg.x + lg.w / 2), y: r(lg.y + (lg.h - pf.height) / 2), anchor: 'middle', fill: INK})));
    }
  });
  return g({name: `${P}board`}, kids);
}

/** People (rigs) of a board scene. */
export function makeRigs(ctx, L, parties) {
  return [0, 1].map(i => personRig(ctx, {name: `${L.P}${i ? 'B' : 'A'}`, look: actorLook(ctx, parties[i], i)}));
}

/** Names chips under the feet. */
export function nameNodes(ctx, L, captions) {
  const G = L.G;
  return G.names.map((n, i) => {
    if (!n) return null;
    const fig = i ? G.figB : G.figA;
    const w = n.fit.width + L.FL * 1.2;
    let cx = fig.x;
    cx = clamp(cx, L.box.x + w / 2, L.box.x + L.box.w - w / 2);
    return chipG(ctx, captions[i], {x: cx, y: G.floor + L.F * 0.3, anchor: 'middle', maxWidth: n.maxW, size: L.FL, maxLines: 2, weight: 600, fit: n.fit, name: `${L.P}name${i}`}).node;
  });
}

/** Link nodes for the supplied links (geometry from the seated rows): two halves, two port markers and a knot. */
export function linkNodes(ctx, L, links, o = {}) {
  const G = L.G, P = L.P;
  const sw = r(Math.max(5, 4 / L.upx), 2);
  return links.map((lk, j) => {
    const pa = portWorld(G, 'a', G.rowAt('a', lk.a - 1)), pb = portWorld(G, 'b', G.rowAt('b', lk.b - 1));
    const geo = linkGeom(pa, pb);
    const Rm = Math.max(7, L.F * 0.34);
    return g({name: `${P}link${j}`, opacity: o.opacity ?? 0},
      h('path', {name: `${P}link${j}-a`, d: geo.da, fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(geo.la + 2)} ${r(geo.la + 2)}`, 'stroke-dashoffset': r(geo.la + 2)}),
      h('path', {name: `${P}link${j}-b`, d: geo.db, fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(geo.lb + 2)} ${r(geo.lb + 2)}`, 'stroke-dashoffset': r(geo.lb + 2)}),
      g({name: `${P}link${j}-pa`, transform: T(pa.x, pa.y), opacity: 0}, glyph(ctx, 'a', 0, 0, Rm)),
      g({name: `${P}link${j}-pb`, transform: T(pb.x, pb.y), opacity: 0}, glyph(ctx, 'b', 0, 0, Rm)),
      h('circle', {name: `${P}link${j}-knot`, cx: r(geo.mid.x), cy: r(geo.mid.y), r: r(Number(sw) * 1.1, 2), fill: INK, opacity: 0}));
  });
}

/** World port of a side's card centred at c. */
export const portWorld = (G, s, c) => ({x: c.x + portOf(s, G.cw).x, y: c.y});

/** Card nodes of the scene: one per supplied performance (A then B), plus an optional extra card. */
export function cardNodes(ctx, L, texts, o = {}) {
  const G = L.G, P = L.P;
  const out = [];
  for (const s of ['a', 'b']) {
    const list0 = texts[s];
    // (lower index on top: drawn last)
    for (let i = list0.length - 1; i >= 0; i--) {
      out.push(g({name: `${P}card-${s}${i}`, transform: T(0, 0)}, perfCard(ctx, {name: `${P}card-${s}${i}-in`, side: s, cw: G.cw, ch: G.ch, C: G.C, fit: L.cardText ? fitG(list0[i], {maxWidth: G.C.tw, size: L.F, maxLines: 3, weight: 600}) : null, F: L.F})));
    }
  }
  return out;
}

/* ======================================================================== */
/* Posing                                                                   */
/* ======================================================================== */

/**
 * The placement passes: in pass i, Party A's hand takes A's i-th card from its tray and seats it in row i while Party
 * B's hand does the same with B's i-th card — the same motion, mirrored, at the same time. Returns per card {t0, t1}
 * windows and the phases: reach, lift, seat, back (fractions of the pass).
 */
export const PASS = {reach: [0, 0.24], lift: [0.24, 0.66], seat: [0.66, 0.8], back: [0.8, 1]};

/**
 * Pose one card at action time a, given its pass window [t0, t1] (null: it never moves — it rests where `rest` says).
 * from: {x,y} tray position; to: {x,y} row position. Returns {pos, where: 'tray'|'moving'|'row', grip, lifted}.
 */
export function cardAt(G, s, win, from, to, a) {
  if (!win) return {pos: from, where: 'tray', moving: false};
  const d = win[1] - win[0];
  const ph = q => [win[0] + PASS[q][0] * d, win[0] + PASS[q][1] * d];
  const lift = ph('lift'), seatW = ph('seat');
  const out = -G.inward(s) * G.push;
  if (a < lift[0]) return {pos: from, where: 'tray', moving: false};
  if (a < lift[1]) {
    const q = ease.inOutSine(seg(a, ...lift));
    // (the card is first drawn outward a little, out of its stack, then rises along the column to its row)
    const ox = out * ease.inOutSine(seg(a, lift[0], lift[0] + (lift[1] - lift[0]) * 0.25));
    return {pos: {x: lerp(from.x, to.x, q) + ox, y: lerp(from.y, to.y, q)}, where: 'moving', moving: true};
  }
  if (a < seatW[1]) {
    const q = ease.inOutSine(seg(a, ...seatW));
    return {pos: {x: to.x + out * (1 - q), y: to.y}, where: q >= 1 ? 'row' : 'moving', moving: q < 1};
  }
  return {pos: to, where: 'row', moving: false};
}

/** The near hand's grabs for a list of passes (grip follows the card's outer end while held). */
export function grabsFor(G, s, passes) {
  return passes.map(ps => {
    const d = ps.win[1] - ps.win[0];
    const t = q => ps.win[0] + q * d;
    // (from under the board the hand lets go once it has pushed the card up by pushD; it slides on by itself)
    let rel = t(PASS.seat[1]);
    if (G.under) {
      const q = clamp(G.pushD / Math.max(1, ps.from.y - ps.to.y));
      rel = t(PASS.lift[0]) + (Math.acos(1 - 2 * q) / Math.PI) * (t(PASS.lift[1]) - t(PASS.lift[0]));
    }
    const back = G.under ? rel + (t(PASS.back[1]) - t(PASS.back[0])) : t(PASS.back[1]);
    return {t0: t(PASS.reach[0]), t1: t(PASS.reach[1]), t2: rel, t3: back, grip: tt => G.gripOf(s, cardAt(G, s, ps.win, ps.from, ps.to, Math.min(Math.max(tt, t(PASS.reach[1])), rel)).pos)};
  });
}

/** Hand position at time a from a list of grabs (chained; a later grab wins where windows overlap). */
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

/**
 * Text visibility of a card in a tray stack: it shows only once every card above it (lower index, same tray) has risen
 * clear of it (pure: from the cards' positions).
 */
export function stackTextOpacity(G, pos, above) {
  let op = 1;
  for (const q of above) {
    const d = Math.max(Math.abs(q.x - pos.x) - G.cw * 0.9, Math.abs(q.y - pos.y) - G.ch);
    op *= clamp((d + G.ch * 0.02) / (G.ch * 0.25));
  }
  return op;
}

/**
 * Pose the links at progress lp (0..1 per link; all links share it): the port markers appear, the two halves draw on
 * from both ends at once and the knot closes in the middle. Writes into nodes.
 */
export function poseLinks(nodes, L, links, lp) {
  const G = L.G, P = L.P;
  links.forEach((lk, j) => {
    const pa = portWorld(G, 'a', G.rowAt('a', lk.a - 1)), pb = portWorld(G, 'b', G.rowAt('b', lk.b - 1));
    const geo = linkGeom(pa, pb);
    const mk = seg(lp, 0, 0.15), dr = ease.inOutSine(seg(lp, 0.15, 0.9)), kn = seg(lp, 0.88, 1);
    nodes[`${P}link${j}`] = {opacity: lp > 0 ? 1 : 0};
    nodes[`${P}link${j}-a`] = {'stroke-dashoffset': r((geo.la + 2) * (1 - dr), 1)};
    nodes[`${P}link${j}-b`] = {'stroke-dashoffset': r((geo.lb + 2) * (1 - dr), 1)};
    nodes[`${P}link${j}-pa`] = {opacity: r(mk, 3)};
    nodes[`${P}link${j}-pb`] = {opacity: r(mk, 3)};
    nodes[`${P}link${j}-knot`] = {opacity: r(kn, 3)};
  });
}

/* ======================================================================== */
/* Spanish defaults                                                         */
/* ======================================================================== */

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
  return {
    ...scene,
    layout: (ctx, ...a) => scene.layout(view(ctx), ...a),
    build: (ctx, ...a) => scene.build(view(ctx), ...a),
    frame: (ctx, ...a) => scene.frame(view(ctx), ...a),
  };
}
