/**
 * "Confirmación ilustrativa" kit (LAW-0341..0344, review-06): geometry, art and text helpers shared by the four entries.
 *
 * The motif's objects (all original vector art):
 *  - RESOLUCIONES: two decision cards of the SAME size and weight — card A, the original decision, and card B, the
 *    confirmatory decision as supplied. Each card carries its supplied role caption, a fictional title, a reference tag,
 *    a line of reasons (as supplied) and a result field holding the supplied result. Only lane colours (A blue accent2,
 *    B amber accent3 — never red or green) and the letter badge tell them apart.
 *  - FLECHAS: one arrow mark on the facing edge of each card, on the row the alignment is configured for (`routes.align`:
 *    the result rows by default). The two marks point at each other; when the cards are aligned their tips meet. They
 *    are alignment marks only — not a route, an appeal or a causal link.
 *  - FILTROS: a neutral, lightly tinted filter strip (alignment guide) that is laid across the aligned rows of both
 *    cards. It lets the supplied rows be read side by side; it selects, admits or decides nothing.
 *  - CALENDARIO: a small desk calendar, a fixture only (blank grid, no date marked, no time limit implied).
 *
 * Legal care (brief): no doctrine on what a confirmation means. The supplied results are printed as supplied and are
 * NEVER changed, compared, scored or judged by any entry: aligning the cards moves the cards, never their content.
 * Fictional content, jurisdiction unspecified, `illustrative-unverified`.
 *
 * The kit owns fields, defaults, localisation, glue-aware text fitting, the card model and art, the arrow marks, the
 * filter strip, the calendar, legend icons and the legend panel. Each entry owns its own composition, timeline and
 * semantics.
 * @module animations/review/kits/confirmacion-ilustrativa
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, obj, oneOf} from '../../../schemas/fields.js';
import {FONTS, measure} from '../../../core/text.js';
import {shade} from '../../../primitives/paper.js';
import {changedMarker} from '../../../primitives/markers.js';

/* ------------------------------------------------------------------ */
/* Fields, defaults, localisation                                      */
/* ------------------------------------------------------------------ */

const cardFields = which => obj(`Card ${which} (fictional; placeholder content)`, {
  role: str(`Role caption printed on card ${which} (as supplied)`, 60),
  title: str(`Fictional title printed on card ${which}`, 70),
  ref: str(`Reference tag printed on card ${which} (fictional)`, 44),
}, ['role', 'title', 'ref']);

/** Category fields shared by the four entries (brief: decisions, grounds, routes, outcomes). */
export const ciFields = {
  decisions: obj('The two decision cards (fictional; placeholder content). A is the original decision, B the confirmatory decision as supplied; both are drawn at the same size and weight', {
    a: cardFields('A'),
    b: cardFields('B'),
  }, ['a', 'b']),
  grounds: obj('The line of reasons printed on each card, as supplied (placeholder; never assessed)', {
    a: str('Reasons line printed on card A (as supplied)', 90),
    b: str('Reasons line printed on card B (as supplied)', 90),
  }, ['a', 'b']),
  routes: obj('Alignment as configured: the row of the cards on which the arrow marks and the filter strip sit, and the caption of that guide', {
    align: oneOf('Row on which the two cards are aligned: the result rows or the header rows (as configured)', ['result', 'header']),
    label: str('Caption of the alignment guide (keep "as configured")', 90),
  }, ['align', 'label']),
  outcomes: obj('The result printed on each card, as supplied. The animation never changes, compares or judges it', {
    a: str('Result printed on card A (as supplied)', 90),
    b: str('Result printed on card B (as supplied)', 90),
  }, ['a', 'b']),
  labels: obj('Editable captions', {
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
  }, ['key']),
};

export const CI_EN = {
  decisions: {
    a: {role: 'Original decision', title: 'Decision 1 (fictional)', ref: 'Ref. A-01 (fictional)'},
    b: {role: 'Confirmatory decision (as supplied)', title: 'Decision 2 (fictional)', ref: 'Ref. B-01 (fictional)'},
  },
  grounds: {a: 'Reasons: placeholder text (as supplied)', b: 'Reasons: placeholder text (as supplied)'},
  routes: {align: 'result', label: 'Alignment guide over the result rows (as configured)'},
  outcomes: {a: 'Result as given (placeholder text)', b: 'Result as given (placeholder text)'},
  labels: {key: 'As supplied · no conclusion drawn'},
};

export const CI_ES = {
  decisions: {
    a: {role: 'Decisión original', title: 'Resolución 1 (ficticia)', ref: 'Ref. A-01 (ficticia)'},
    b: {role: 'Decisión confirmatoria suministrada', title: 'Resolución 2 (ficticia)', ref: 'Ref. B-01 (ficticia)'},
  },
  grounds: {a: 'Motivos: texto provisional (según lo aportado)', b: 'Motivos: texto provisional (según lo aportado)'},
  routes: {align: 'result', label: 'Guía de alineación sobre las filas del resultado (según lo configurado)'},
  outcomes: {a: 'Resultado dado (texto provisional)', b: 'Resultado dado (texto provisional)'},
  labels: {key: 'Según lo aportado · sin conclusión'},
};

/**
 * Untouched English defaults follow `locale: 'es'` (whole field, or per property of an object field — one level of
 * nesting, so `decisions.a.role` left at its English default is localised on its own).
 * @param {any} ctx
 * @param {Record<string, any>} en
 * @param {Record<string, any>} es
 */
export function localisedCi(ctx, en, es) {
  const p = ctx.params;
  if (p.locale !== 'es') return {...p};
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const out = {...p};
  for (const k of Object.keys(es)) {
    if (!(k in en) || !(k in p)) continue;
    if (same(p[k], en[k])) out[k] = JSON.parse(JSON.stringify(es[k]));
    else if (isObj(p[k]) && isObj(en[k])) {
      const o = {...p[k]};
      for (const kk of Object.keys(es[k] || {})) {
        if (same(p[k][kk], en[k][kk])) o[kk] = JSON.parse(JSON.stringify(es[k][kk]));
        else if (isObj(p[k][kk]) && isObj(en[k][kk])) {
          const o2 = {...p[k][kk]};
          for (const k3 of Object.keys(es[k][kk] || {})) if (same(p[k][kk][k3], en[k][kk][k3])) o2[k3] = es[k][kk][k3];
          o[kk] = o2;
        }
      }
      out[k] = o;
    }
  }
  return out;
}

export const SIDES = ['a', 'b'];

/* ------------------------------------------------------------------ */
/* Text: glue-aware wrap and bounded fit                               */
/* ------------------------------------------------------------------ */

const GLUE_NEXT = /^(\d[\w.,;:)\]-]*|[)\].,;:!?»”]+|[–—-]\d+[\w)]*|[A-Z]-?\d+[\w)]*)$/u;
const GLUE_PREV = /^(§|nº|n\.º|no\.|«|“|\(|ref\.|núm\.)$/iu;

/** Tokens merged into unbreakable units (numbers, codes and closing punctuation stay with their word). */
function units(text) {
  const toks = String(text ?? '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const out = [];
  for (const t of toks) {
    const prev = out.length ? out[out.length - 1].split(' ').pop() : '';
    if (out.length && (GLUE_NEXT.test(t) || GLUE_PREV.test(prev) || prev === '·')) out[out.length - 1] += ` ${t}`;
    else out.push(t);
  }
  // a lone separator never starts a line: it travels with the word before it
  for (let i = out.length - 1; i > 0; i--) if (/^[·–—]$/.test(out[i].split(' ')[0])) { out[i - 1] += ` ${out[i]}`; out.splice(i, 1); }
  return out;
}

/**
 * Greedy wrap over glued units; never breaks inside a word. `over` is set when a unit is wider than the box.
 * Avoids a one-word last line when the previous line can give a word.
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
  if (lines.length > 1) {
    const last = lines[lines.length - 1];
    if (!/\s/.test(last) || last.length <= 6) {
      const prev = lines[lines.length - 2].split(' ');
      if (prev.length > 2) {
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
export const SLATE = '#3b4a5a';
export const ARROW_FILL = '#f4efe4';
export const RESULT_FILL = '#f2f4f6';
/** Lane colour of a card (A blue accent2, B amber accent3 — never red or green). */
export const laneColor = (th, side) => (side === 'a' ? th.accent2 : th.accent3);
/** Neutral note inks (amber and slate-blue; never green or red). */
export const noteColors = th => [th.accent3, th.accent2];
/** Filter tint (neutral blue-grey). */
export const glassColor = th => th.accent2;

/* ------------------------------------------------------------------ */
/* Glyphs                                                              */
/* ------------------------------------------------------------------ */

/** ● (A) or ◆ (B) of equal area and equal ink. Local origin = centre. */
export function markGlyph(side, R, o = {}) {
  const fill = o.fill ?? INK;
  const stroke = o.stroke ?? '#fff';
  const sw = o.sw ?? Math.max(1.2, R * 0.16);
  if (side === 'a') return h('circle', {cx: 0, cy: 0, r: r(R), fill, stroke, 'stroke-width': r(sw, 2)});
  const d = R * Math.sqrt(Math.PI / 2);
  return h('path', {d: `M0 ${r(-d)}L${r(d)} 0L0 ${r(d)}L${r(-d)} 0Z`, fill, stroke, 'stroke-width': r(sw, 2), 'stroke-linejoin': 'round'});
}

/* ------------------------------------------------------------------ */
/* Card model (both cards share every row height: same size, same rows) */
/* ------------------------------------------------------------------ */

/**
 * Card model for a width w and text size F (design units). Both cards get the same rows at the same local y, so the
 * result rows (and the header rows) of two cards with equal top edges lie on one line.
 * @param {any} P localised params
 * @param {{w:number, F:number, showText:boolean, bars?:number, foot?:number, minF?:number, refAlt?:Record<string,string>|null}} o
 *   refAlt: an alternative reference text per side (inspect: the after-value) — the ref chip is sized for both.
 */
export function cardModel(P, o) {
  const {w, F} = o;
  const minF = o.minF ?? F;
  const pad = Math.max(14, F * 0.8);
  const inner = w - pad * 2;
  const badgeR = F * 1.0;
  const st = o.showText;
  // 'tall' (default): one column; 'wide': header, title and reference in a left column, reasons and result in a right
  // column (short cards for square frames)
  const wide = o.layout === 'wide';
  // secondary lines (title, reasons) may be set smaller than the key lines (role, reference, result); never below the
  // caller's floor
  const secK = o.secK ?? 1;
  const gc = F * 1.0;
  const wl = wide ? (inner - gc) * (o.wideK ?? 0.6) : inner;
  const wr = wide ? inner - gc - wl : inner;
  const xr = wide ? pad + wl + gc : pad;
  const fits = {};
  let ok = true;
  for (const s of SIDES) {
    const D = P.decisions[s];
    const f = {};
    if (st) {
      f.role = fitG(D.role, {maxWidth: inner - badgeR * 2 - F * 0.5, size: F * 1.04, minSize: minF, maxLines: 3, weight: 700});
      f.title = fitG(D.title, {maxWidth: wl, size: F * secK, minSize: minF * secK, maxLines: wide ? 3 : 2, weight: 600, family: 'serif'});
      f.ref = fitG(D.ref, {maxWidth: wl - F * 1.4, size: F, minSize: minF, maxLines: wide ? 3 : 2, weight: 600});
      if (o.refAlt && o.refAlt[s]) f.refAlt = fitG(o.refAlt[s], {maxWidth: wl - F * 1.4, size: F, minSize: minF, maxLines: wide ? 3 : 2, weight: 600});
      f.grounds = fitG(P.grounds[s], {maxWidth: wide ? wl : wr, size: F * secK, minSize: minF * secK, maxLines: wide ? 4 : 3, weight: 500});
      f.result = fitG(P.outcomes[s], {maxWidth: wr + (wide ? 0 : pad * 0.6) - F * 1.7, size: F, minSize: minF, maxLines: wide ? 4 : 3, weight: 700});
      for (const v of Object.values(f)) if (!v.ok) ok = false;
    }
    fits[s] = f;
  }
  const hOf = (key, dflt) => (st ? Math.max(...SIDES.map(s => (fits[s][key] ? fits[s][key].height : 0)), key === 'ref' && o.refAlt ? Math.max(...SIDES.map(s => (fits[s].refAlt ? fits[s].refAlt.height : 0))) : 0) : dflt);
  const headerH = Math.max(badgeR * 2, hOf('role', F * 1.6));
  const titleH = hOf('title', F * 0.9);
  const refTH = hOf('ref', F);
  const refH = refTH + F * 0.62;
  const groundsH = hOf('grounds', F * 1.3);
  const resultTH = hOf('result', F * 1.5);
  const bars = wide ? 0 : o.bars ?? 2;
  const barH = Math.max(7, F * 0.3);
  const foot = o.foot ?? F * 2.0;
  let y = pad * 0.9 + F * 0.25;
  const header = {x: pad, w: inner, y, h: headerH};
  y += headerH + F * 0.45;
  const sep = y;
  y += F * 0.45;
  const y0 = y;
  const title = {x: pad, w: wl, y, h: titleH};
  y += titleH + F * (wide ? 0.3 : 0.45);
  const ref = {x: pad, w: wl, y, h: refH};
  y += refH + F * (wide ? 0.3 : 0.5);
  const barsY = y;
  if (bars) y += bars * barH * 1.9 + F * 0.15;
  const grounds = {x: pad, w: wl, y, h: groundsH};
  y += groundsH + F * (wide ? 0.3 : 0.8);
  const leftEnd = y;
  if (wide) y = y0;
  const result = {x: wide ? xr : pad * 0.7, w: wide ? wr : w - pad * 1.4, y, h: resultTH + F * 0.9};
  y += result.h;
  if (wide) y = Math.max(y + F * 0.3, leftEnd);
  const footY = y;
  y += foot;
  const hh = y;
  // the chip of each reference tag (as wide as its longest value)
  const refW = {};
  for (const s of SIDES) {
    const wv = st ? Math.max(fits[s].ref.width, fits[s].refAlt ? fits[s].refAlt.width : 0) : wl * 0.6;
    refW[s] = Math.min(wl, wv + F * 1.4);
  }
  const rows = {header: header.y + header.h / 2, result: result.y + result.h / 2};
  return {w, h: hh, F, pad, inner, badgeR, fits, header, sep, title, ref, refW, barsY, bars, barH, grounds, result, footY, foot, rows, showText: st, ok, wide};
}

/** The register row (card-local y of the arrow marks / the strip's centre) and its half height for a configured align. */
export function registerRow(M, align) {
  if (align === 'header') return {y: M.header.y + M.header.h / 2, half: M.header.h / 2 + M.F * 0.22};
  return {y: M.result.y + M.result.h / 2, half: M.result.h / 2 + M.F * 0.22};
}

/** Box of a card's reference chip (card-local). */
export function refBox(M, side) {
  return {x: M.ref.x, y: M.ref.y, w: M.refW[side], h: M.ref.h};
}

/** Box of a card's result field (card-local). */
export function resultBox(M) {
  return {x: M.result.x, y: M.result.y, w: M.result.w, h: M.result.h};
}

/**
 * Decision card node (local origin = top-left). Named nodes: `${P}` (group), `${P}-ref-t` (reference text),
 * `${P}-ref-alt` (alternative reference text, when the model carries one), `${P}-ref-body`, `${P}-res` (result field
 * group). The result text is a single static node: no entry ever animates it.
 * @param {any} ctx
 * @param {ReturnType<typeof cardModel>} M
 * @param {'a'|'b'} side
 * @param {{prefix:string, seedKey?:string, refText?:boolean, shadow?:boolean}} o
 */
export function cardNode(ctx, M, side, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const F = M.F;
  const f = M.fits[side];
  const lane = laneColor(th, side);
  const seedKey = o.seedKey ?? `ci-card-${side}`;
  const parts = [];
  if (o.shadow !== false) parts.push(h('path', {d: roundRectPath(6, 9, M.w, M.h, 10), fill: th.shadow}));
  parts.push(h('path', {name: `${P}-body`, d: roundRectPath(0, 0, M.w, M.h, 10), fill: th.paper, stroke: INK, 'stroke-width': 2.5}));
  // lane band along the top edge
  parts.push(h('path', {d: `M0 ${r(Math.min(10, M.pad * 0.6) + 2)}V10Q0 0 10 0H${r(M.w - 10)}Q${r(M.w)} 0 ${r(M.w)} 10V${r(Math.min(10, M.pad * 0.6) + 2)}Z`, fill: lane, stroke: INK, 'stroke-width': 2}));
  // header: lane badge with its letter (or, labels hidden, the ●/◆ glyph) and the role caption
  const bx = M.pad + M.badgeR, by = M.header.y + M.header.h / 2;
  parts.push(h('circle', {cx: r(bx), cy: r(by), r: r(M.badgeR), fill: lane, stroke: INK, 'stroke-width': 2.2}));
  if (M.showText) parts.push(h('text', {x: r(bx), y: r(by + F * 0.36), 'text-anchor': 'middle', 'font-family': FONTS.sans, 'font-size': r(F, 2), 'font-weight': 800, fill: '#fff'}, side.toUpperCase()));
  else parts.push(g({transform: T(bx, by)}, markGlyph(side, M.badgeR * 0.42, {fill: '#fff', stroke: lane})));
  const tx = M.pad + M.badgeR * 2 + F * 0.5;
  if (M.showText) parts.push(textAt(f.role, {x: tx, y: M.header.y + (M.header.h - f.role.height) / 2, fill: INK, name: `${P}-role`}));
  else parts.push(h('rect', {x: r(tx), y: r(by - F * 0.3), width: r((M.header.x + M.header.w - tx) * (side === 'a' ? 0.7 : 0.86)), height: r(F * 0.6), rx: r(F * 0.3), fill: INK, opacity: 0.72}));
  parts.push(h('line', {x1: r(M.header.x), x2: r(M.header.x + M.header.w), y1: r(M.sep), y2: r(M.sep), stroke: th.paperLine, 'stroke-width': 2}));
  if (M.wide) parts.push(h('line', {x1: r(M.result.x - F * 0.5), x2: r(M.result.x - F * 0.5), y1: r(M.sep + F * 0.3), y2: r(M.footY - F * 0.2), stroke: th.paperLine, 'stroke-width': 2}));
  // title
  if (M.showText) parts.push(textAt(f.title, {x: M.title.x, y: M.title.y, fill: INK, name: `${P}-title`}));
  else parts.push(h('rect', {x: r(M.title.x), y: r(M.title.y + F * 0.15), width: r(M.title.w * 0.62), height: r(F * 0.55), rx: r(F * 0.27), fill: INK, opacity: 0.6}));
  // reference chip
  const rb = refBox(M, side);
  parts.push(g({name: `${P}-ref`},
    h('path', {name: `${P}-ref-body`, d: roundRectPath(rb.x, rb.y, rb.w, rb.h, Math.min(rb.h / 2, F * 0.6)), fill: th.paperShade, stroke: SLATE, 'stroke-width': 2}),
    M.showText && o.refText !== false ? textAt(f.ref, {x: rb.x + F * 0.7, y: rb.y + F * 0.31, fill: INK, name: `${P}-ref-t`}) : null,
    M.showText && f.refAlt && o.refText !== false ? textAt(f.refAlt, {x: rb.x + F * 0.7, y: rb.y + F * 0.31, fill: INK, name: `${P}-ref-alt`, opacity: 0}) : null,
    M.showText ? null : g({name: `${P}-ref-bars`}, h('rect', {x: r(rb.x + F * 0.6), y: r(rb.y + rb.h / 2 - F * 0.2), width: r(rb.w - F * 1.2), height: r(F * 0.4), rx: r(F * 0.2), fill: SLATE, opacity: 0.55}))));
  // filler bars (simulated text only)
  for (let b = 0; b < M.bars; b++) {
    const bw = M.grounds.w * (b === M.bars - 1 ? 0.55 + 0.25 * ctx.rng(`${seedKey}-b`, b) : 0.86 + 0.12 * ctx.rng(`${seedKey}-b`, b));
    parts.push(h('rect', {x: r(M.grounds.x), y: r(M.barsY + b * M.barH * 1.9), width: r(bw), height: r(M.barH), rx: r(M.barH / 2), fill: th.paperLine}));
  }
  // reasons line (as supplied)
  if (M.showText) parts.push(textAt(f.grounds, {x: M.grounds.x, y: M.grounds.y, fill: '#3d4650', name: `${P}-grounds`, italic: true}));
  else for (let b = 0; b < 2; b++) parts.push(h('rect', {x: r(M.grounds.x), y: r(M.grounds.y + F * 0.1 + b * F * 0.62), width: r(M.grounds.w * (b ? 0.48 : 0.8)), height: r(F * 0.34), rx: r(F * 0.17), fill: '#8c959f', opacity: 0.6}));
  // result field: the supplied result, printed once, never animated
  const res = resultBox(M);
  if (o.slot) {
    // (exploded view: the result field has been taken out — its place is a plain recess of the same size)
    parts.push(h('path', {name: `${P}-slot`, d: roundRectPath(res.x, res.y, res.w, res.h, 8), fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 2}));
    parts.push(h('rect', {x: r(M.pad), y: r(M.footY + M.foot * 0.45), width: r(M.inner * 0.34), height: r(M.barH), rx: r(M.barH / 2), fill: th.paperLine}));
    return g({name: P}, parts);
  }
  parts.push(g({name: `${P}-res`},
    h('path', {d: roundRectPath(res.x, res.y, res.w, res.h, 8), fill: RESULT_FILL, stroke: SLATE, 'stroke-width': 2.4}),
    h('rect', {x: r(res.x + 6), y: r(res.y + 6), width: r(F * 0.34), height: r(res.h - 12), rx: r(F * 0.17), fill: SLATE}),
    M.showText ? textAt(f.result, {x: res.x + F * 0.95, y: res.y + (res.h - f.result.height) / 2, fill: INK, name: `${P}-res-t`})
      : g(null, [0, 1].map(b => h('rect', {x: r(res.x + F * 0.95), y: r(res.y + res.h / 2 - F * 0.5 + b * F * 0.62), width: r((res.w - F * 1.6) * (b ? 0.5 : 0.82)), height: r(F * 0.38), rx: r(F * 0.19), fill: INK, opacity: 0.65})))));
  // footer: a neutral strip of filler (where a hand may hold the card)
  parts.push(h('rect', {x: r(M.pad), y: r(M.footY + M.foot * 0.45), width: r(M.inner * 0.34), height: r(M.barH), rx: r(M.barH / 2), fill: th.paperLine}));
  return g({name: P}, parts);
}

/**
 * A result field on its own (exploded view), local origin = its top-left, size resultBox(M). Its arrow mark (optional)
 * sits on the facing edge (A: right, B: left) on the field's middle line. The result text is static.
 */
export function resultNode(ctx, M, side, o) {
  const th = ctx.theme;
  const F = M.F;
  const f = M.fits[side];
  const res = resultBox(M);
  const P = o.prefix;
  const w = res.w, hh = res.h;
  return g({name: P},
    h('path', {d: roundRectPath(5, 7, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: RESULT_FILL, stroke: SLATE, 'stroke-width': 2.4}),
    h('rect', {x: 6, y: 6, width: r(F * 0.34), height: r(hh - 12), rx: r(F * 0.17), fill: laneColor(th, side), stroke: SLATE, 'stroke-width': 1.2}),
    M.showText ? textAt(f.result, {x: F * 0.95, y: (hh - f.result.height) / 2, fill: INK, name: `${P}-t`})
      : g(null, [0, 1].map(b => h('rect', {x: r(F * 0.95), y: r(hh / 2 - F * 0.5 + b * F * 0.62), width: r((w - F * 1.6) * (b ? 0.5 : 0.82)), height: r(F * 0.38), rx: r(F * 0.19), fill: INK, opacity: 0.65}))),
    o.arrow ? g({transform: T(side === 'a' ? w + o.arrow.len : -o.arrow.len, hh / 2)}, arrowMark(ctx, {side, len: o.arrow.len, hgt: o.arrow.hgt, dir: side === 'a' ? 1 : -1})) : null);
}

/* ------------------------------------------------------------------ */
/* Arrow marks (flechas)                                               */
/* ------------------------------------------------------------------ */

/**
 * Arrow mark; local origin = the TIP; dir 1 points right (body to the left of the tip), -1 points left.
 * @param {any} ctx
 * @param {{prefix?:string, side:'a'|'b', len:number, hgt:number, dir:1|-1}} o
 */
export function arrowMark(ctx, o) {
  const {len, hgt} = o;
  const head = Math.min(len * 0.55, hgt * 0.9);
  const sh = hgt * 0.56;
  const d = `M${r(-len)} ${r(-sh / 2)}H${r(-head)}V${r(-hgt / 2)}L0 0L${r(-head)} ${r(hgt / 2)}V${r(sh / 2)}H${r(-len)}Z`;
  return g({name: o.prefix, transform: o.dir === -1 ? 'scale(-1 1)' : undefined},
    h('path', {d, fill: ARROW_FILL, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    g({transform: T(-len + Math.max(sh * 0.7, (len - head) * 0.5), 0)}, markGlyph(o.side, Math.min(sh * 0.3, (len - head) * 0.35), {stroke: ARROW_FILL, sw: 1.2})));
}

/* ------------------------------------------------------------------ */
/* Filter strip (alignment guide)                                      */
/* ------------------------------------------------------------------ */

/**
 * Neutral filter strip, local origin = top-left; grip tabs at both ends (tab width `tab`). Named `${prefix}` and
 * `${prefix}-glass`.
 */
export function filterStrip(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, tab} = o;
  const gc = glassColor(th);
  const knurl = x0 => {
    const d = [];
    for (let i = 1; i <= 3; i++) d.push(`M${r(x0 + (tab * i) / 4)} ${r(hh * 0.28)}V${r(hh * 0.72)}`);
    return h('path', {d: d.join(''), stroke: shade(SLATE, 0.45), 'stroke-width': 2, 'stroke-linecap': 'round'});
  };
  return g({name: o.prefix},
    h('rect', {name: o.prefix ? `${o.prefix}-glass` : undefined, x: r(tab - 2), y: 0, width: r(w - 2 * tab + 4), height: r(hh), rx: 6, fill: gc, 'fill-opacity': 0.17, stroke: shade(gc, -0.25), 'stroke-width': 2.4}),
    h('path', {d: `M${r(tab + hh * 0.5)} ${r(hh * 0.86)}L${r(tab + hh * 0.95)} ${r(hh * 0.14)}M${r(tab + hh * 1.05)} ${r(hh * 0.86)}L${r(tab + hh * 1.5)} ${r(hh * 0.14)}`, stroke: '#ffffff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.75}),
    h('rect', {x: 0, y: r(-hh * 0.06), width: r(tab), height: r(hh * 1.12), rx: r(Math.min(8, tab * 0.3)), fill: SLATE, stroke: INK, 'stroke-width': 2}),
    h('rect', {x: r(w - tab), y: r(-hh * 0.06), width: r(tab), height: r(hh * 1.12), rx: r(Math.min(8, tab * 0.3)), fill: SLATE, stroke: INK, 'stroke-width': 2}),
    knurl(0), knurl(w - tab));
}

/* ------------------------------------------------------------------ */
/* Calendar (fixture only)                                             */
/* ------------------------------------------------------------------ */

export function calendarArt(ctx, w, hh, rings = true) {
  const th = ctx.theme;
  const top = hh * 0.26;
  const c = Math.min(8, w * 0.08);
  const parts = [
    h('path', {d: roundRectPath(0, 0, w, hh, c), fill: '#fff', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M0 ${r(top)}V${r(c)}Q0 0 ${r(c)} 0H${r(w - c)}Q${r(w)} 0 ${r(w)} ${r(c)}V${r(top)}Z`, fill: '#8e99a4', stroke: INK, 'stroke-width': 2}),
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
    calendarArt(ctx, o.w, o.h, true));
}

/* ------------------------------------------------------------------ */
/* Legend icons and panel                                              */
/* ------------------------------------------------------------------ */

/** Legend icon (size s, local origin = icon centre). */
export function legendIcon(ctx, kind, s, o = {}) {
  const th = ctx.theme;
  const k = s / 2;
  if (kind === 'filter') {
    return g(null,
      h('rect', {x: r(-k), y: r(-k * 0.5), width: r(s), height: r(k), rx: 3, fill: glassColor(th), 'fill-opacity': 0.25, stroke: shade(glassColor(th), -0.25), 'stroke-width': 2}),
      h('rect', {x: r(-k - 2), y: r(-k * 0.56), width: r(k * 0.34), height: r(k * 1.12), rx: 2, fill: SLATE}),
      h('rect', {x: r(k - k * 0.34 + 2), y: r(-k * 0.56), width: r(k * 0.34), height: r(k * 1.12), rx: 2, fill: SLATE}));
  }
  if (kind === 'arrows') {
    return g(null,
      g({transform: T(-1.5, 0)}, arrowMark(ctx, {side: 'a', len: k * 0.95, hgt: k * 0.9, dir: 1})),
      g({transform: T(1.5, 0)}, arrowMark(ctx, {side: 'b', len: k * 0.95, hgt: k * 0.9, dir: -1})));
  }
  if (kind === 'result') {
    return g(null,
      h('rect', {x: r(-k), y: r(-k * 0.55), width: r(s), height: r(k * 1.1), rx: 3, fill: RESULT_FILL, stroke: SLATE, 'stroke-width': 2}),
      h('rect', {x: r(-k + 3), y: r(-k * 0.4), width: r(k * 0.2), height: r(k * 0.8), rx: 1, fill: SLATE}),
      h('rect', {x: r(-k * 0.55), y: r(-k * 0.12), width: r(k * 1.3), height: r(k * 0.24), rx: 1, fill: INK, opacity: 0.6}));
  }
  if (kind === 'calendar') return g({transform: T(-k, -k * 0.9)}, calendarArt(ctx, s, s * 0.9, false));
  if (kind === 'cardA' || kind === 'cardB') {
    const side = kind === 'cardA' ? 'a' : 'b';
    return g(null,
      h('rect', {x: r(-k * 0.75), y: r(-k), width: r(k * 1.5), height: r(s), rx: 3, fill: th.paper, stroke: INK, 'stroke-width': 2}),
      h('rect', {x: r(-k * 0.75), y: r(-k), width: r(k * 1.5), height: r(k * 0.3), rx: 2, fill: laneColor(th, side), stroke: INK, 'stroke-width': 1.5}),
      h('rect', {x: r(-k * 0.55), y: r(k * 0.35), width: r(k * 1.1), height: r(k * 0.35), rx: 1, fill: RESULT_FILL, stroke: SLATE, 'stroke-width': 1.4}));
  }
  if (kind === 'hand') {
    return h('path', {d: `M${r(-k * 0.55)} ${r(k * 0.9)}L${r(-k * 0.55)} ${r(-k * 0.1)}Q${r(-k * 0.55)} ${r(-k * 0.6)} ${r(-k * 0.2)} ${r(-k * 0.6)}L${r(-k * 0.2)} ${r(-k * 0.95)}Q0 ${r(-k * 1.1)} ${r(k * 0.2)} ${r(-k * 0.95)}L${r(k * 0.2)} ${r(-k * 0.55)}Q${r(k * 0.55)} ${r(-k * 0.65)} ${r(k * 0.6)} ${r(-k * 0.2)}L${r(k * 0.6)} ${r(k * 0.9)}Z`, fill: o.skin ?? '#e0ac85', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'});
  }
  if (kind === 'ring') return h('circle', {cx: 0, cy: 0, r: r(k * 0.7), fill: 'none', stroke: o.color ?? th.accent3, 'stroke-width': 4});
  if (kind === 'delta') return changedMarker(ctx, {radius: k * 0.72});
  if (kind === 'laneA' || kind === 'laneB') {
    const side = kind === 'laneA' ? 'a' : 'b';
    return g(null, h('circle', {r: r(k * 0.72), fill: laneColor(th, side), stroke: INK, 'stroke-width': 2}), markGlyph(side, k * 0.3, {fill: '#fff', stroke: laneColor(th, side)}));
  }
  if (kind === 'same') return h('path', {d: `M${r(-k * 0.6)} ${r(-k * 0.22)}H${r(k * 0.6)}M${r(-k * 0.6)} ${r(k * 0.22)}H${r(k * 0.6)}`, stroke: th.dark ? th.fg : INK, 'stroke-width': 3.5, 'stroke-linecap': 'round'});
  if (kind === 'guide') return h('path', {d: `M${r(-k * 0.85)} ${r(k * 0.4)}V${r(-k * 0.4)}H${r(k * 0.85)}V${r(k * 0.4)}`, fill: 'none', stroke: th.accent3, 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'});
  if (kind.startsWith('kind-')) {
    const kd = kind.slice(5);
    const col = linkColor(th, kd);
    const x0 = -k * 0.85, x1 = k * 0.85;
    const ends = kd === 'relation' ? [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('circle', {cx: r(x1), cy: 0, r: 3.6, fill: col})]
      : kd === 'communication' ? [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('circle', {cx: r(x1), cy: 0, r: 4.6, fill: th.card, stroke: col, 'stroke-width': 2.2})]
        : kd === 'sequence' ? [h('rect', {x: r(x0 - 3.5), y: -3.5, width: 7, height: 7, fill: col}), h('path', {d: `M${r(x1 + 2)} 0L${r(x1 - 9)} -6L${r(x1 - 9)} 6Z`, fill: col})]
          : [h('circle', {cx: r(x0), cy: 0, r: 3.6, fill: col}), h('path', {d: `M${r(x1 + 3)} 0L${r(x1 - 11)} -7L${r(x1 - 11)} 7Z`, fill: col})];
    return g(null, h('path', {d: `M${r(x0)} 0H${r(x1)}`, stroke: col, 'stroke-width': kd === 'causal' ? 5 : 3.4, 'stroke-linecap': 'round'}), ends);
  }
  return null;
}

/** Line colour of a relation kind (mechanism). Neutral slate for a plain relation. */
export function linkColor(th, kind) {
  return kind === 'relation' ? SLATE : kind === 'communication' ? th.accent2 : kind === 'sequence' ? '#5d6d7e' : INK;
}

/**
 * Lay out legend rows in a column. Row kinds: heading (bold, icon), item (icon + text), state (outlined tag),
 * key (italic, the neutral key).
 * @param {Array<{kind:string, icon?:string, color?:string, text:string, name:string}>} rows
 * @param {{w:number, F:number, minF?:number, maxLines?:number}} o
 */
export function panelLayout(rows, o) {
  if ((o.cols ?? 1) > 1) return panelLayout2(rows, o);
  const {w, F} = o;
  const iconW = F * 1.85;
  const gap = F * (o.tight ? 0.4 : 0.55);
  let y = 0;
  let ok = true;
  const out = rows.map(row => {
    const tw = row.kind === 'state' || row.kind === 'key' ? w - F * 1.4 : w - iconW - F * 0.3;
    const fit = fitG(row.text, {maxWidth: tw, size: F, minSize: o.minF ?? F, maxLines: o.maxLines ?? 4, weight: row.kind === 'heading' ? 700 : row.kind === 'key' ? 600 : 500});
    if (!fit.ok) ok = false;
    const pad = row.kind === 'state' ? F * 0.45 : 0;
    const hh = Math.max(row.kind === 'item' || row.kind === 'heading' ? F * 1.25 : 0, fit.height + pad * 2);
    const item = {...row, fit, y, h: hh, pad, iconW, tw};
    y += hh + gap + (row.kind === 'heading' ? F * 0.15 : 0);
    return item;
  });
  return {rows: out, h: Math.max(0, y - gap), w, F, ok};
}

/**
 * Multi-column legend (a band under the scene): rows keep their order and are split where the columns balance; the
 * state tag and the key always share the last column.
 */
function panelLayout2(rows, o) {
  const {w, F} = o;
  const cols = o.cols;
  const colGap = F * 1.6;
  const cw = (w - colGap * (cols - 1)) / cols;
  const tail = rows.filter(rw => rw.kind === 'state' || rw.kind === 'key');
  const body = rows.filter(rw => !tail.includes(rw));
  // heights of consecutive runs, memoised (each row's height does not depend on its neighbours)
  const one = panelLayout(rows, {...o, w: cw, cols: 1});
  const hRow = new Map(one.rows.map((rw, i) => [rows[i], rw.h + F * (o.tight ? 0.4 : 0.55) + (rw.kind === 'heading' ? F * 0.15 : 0)]));
  const gapE = F * (o.tight ? 0.4 : 0.55);
  const hOf = list => (list.length ? list.reduce((a, rw) => a + hRow.get(rw), 0) - gapE - (list[list.length - 1].kind === 'heading' ? F * 0.15 : 0) : 0);
  // choose split points (body rows into cols groups, the tail appended to the last) minimising the tallest column
  let best = null;
  const n = body.length;
  const tryCuts = cuts => {
    const groups = [];
    let prev = 0;
    for (const c of [...cuts, n]) { groups.push(body.slice(prev, c)); prev = c; }
    groups[groups.length - 1] = [...groups[groups.length - 1], ...tail];
    const hh = Math.max(...groups.map(hOf));
    if (!best || hh < best.hh - 0.5) best = {hh, groups};
  };
  if (cols === 2) for (let i = 0; i <= n; i++) tryCuts([i]);
  else for (let i = 0; i <= n; i++) for (let j = i; j <= n; j++) tryCuts([i, j]);
  const out = [];
  let ok = true;
  best.groups.forEach((grp, k) => {
    if (!grp.length) return;
    const Lk = panelLayout(grp, {...o, w: cw, cols: 1});
    if (!Lk.ok) ok = false;
    out.push(...Lk.rows.map(rw => ({...rw, x: k * (cw + colGap)})));
  });
  return {rows: out, h: best.hh, w, colW: cw, F, ok, cols};
}

/** Panel node (local origin = top-left). Every row is a named group (`row.name`). */
export function panelNode(ctx, PL, o = {}) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    const cw = PL.colW ?? PL.w;
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, Math.min(cw, row.fit.width + F * 1.2), row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(Math.min(cw, row.fit.width + F * 0.5)), y1: r(row.y - F * 0.3), y2: r(row.y - F * 0.3), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.7}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.75, row.y + Math.min(row.fit.height, F * 1.2) / 2 + (row.fit.lines.length > 1 ? 0 : F * 0.05))}, legendIcon(ctx, row.icon, F * 1.2, {color: row.color, skin: o.skin})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y + (row.h - row.fit.height) / 2, fill: th.fg}));
    }
    return g({name: row.name, transform: row.x ? T(row.x, 0) : undefined}, parts);
  });
}

/* ------------------------------------------------------------------ */
/* Misc                                                                */
/* ------------------------------------------------------------------ */

/** Rounded ring rectangle used to key editorial notes to their targets. */
export function ringRect(b, color, sw = 4) {
  return h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: color, 'stroke-width': r(sw, 2)});
}

/** Axis-aligned box overlap test. */
export function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Box inside another box. */
export const inside = (a, b, pad = 0) => a.x >= b.x + pad && a.y >= b.y + pad && a.x + a.w <= b.x + b.w - pad && a.y + a.h <= b.y + b.h - pad;

/** Round a point for semantics. */
export const R2 = p => (p ? {x: r(p.x), y: r(p.y)} : null);

/** Rotate a local point of a card (origin top-left, size w×h) placed at {x,y} with rotation deg about its centre. */
export function cardPoint(pose, M, q) {
  const cx = M.w / 2, cy = M.h / 2;
  const a = ((pose.deg || 0) * Math.PI) / 180;
  const s = pose.s ?? 1;
  const dx = (q.x - cx) * s, dy = (q.y - cy) * s;
  return {x: pose.x + cx + dx * Math.cos(a) - dy * Math.sin(a), y: pose.y + cy + dx * Math.sin(a) + dy * Math.cos(a)};
}

/** Transform string for a card pose (top-left x,y; rotation and scale about the card centre). */
export function cardTransform(pose, M) {
  const cx = M.w / 2, cy = M.h / 2;
  const s = pose.s ?? 1;
  return `${T(pose.x + cx, pose.y + cy, pose.deg || 0, s)} translate(${r(-cx)} ${r(-cy)})`;
}

/** Axis-aligned bounds of a posed card. */
export function cardBounds(pose, M) {
  const pts = [{x: 0, y: 0}, {x: M.w, y: 0}, {x: M.w, y: M.h}, {x: 0, y: M.h}].map(q => cardPoint(pose, M, q));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
}

/* ------------------------------------------------------------------ */
/* Desk plan: two cards side by side, the strip parked above them      */
/* ------------------------------------------------------------------ */

/**
 * Plan of the desk block (block-local units; the entry offsets it into its desk): card A at its place, card B's
 * aligned place right of A (the two arrow marks meet in the gap between them), card B's resting place (offset and
 * turned: to the right — mode 'h' — or below its aligned place — mode 'v'; mode 'none': B already aligned), the
 * filter strip parked above the cards and its laid place across the register row, the calendar in a free corner.
 * @param {ReturnType<typeof cardModel>} M
 * @param {{F:number, mode:'h'|'hs'|'v'|'none', align:'result'|'header', cal?:boolean, restK?:number}} o
 */
export function planDesk(M, o) {
  const F = o.F;
  const cw = M.w, ch = M.h;
  const tab = Math.max(F * 1.5, 24);
  const lm = tab + F * 0.5 + Math.max(F * 1.4, 26);
  const gap = Math.max(F * (o.tight ? 2.6 : 3.2), 50);
  const reg = registerRow(M, o.align);
  const sh = reg.half * 2;
  const stripW = 2 * cw + gap + 2 * (tab + F * 0.5);
  const yA = o.noStripRow ? Math.max(F * 0.4, 8) : sh + Math.max(F * (o.tight ? 0.7 : 1.1), 16);
  const A = {x: lm, y: yA, deg: 0};
  const Bt = {x: lm + cw + gap, y: yA, deg: 0};
  const k = o.restK ?? 1;
  let Bs = {...Bt};
  if (o.mode === 'h') Bs = {x: Bt.x + Math.max(cw * 0.26, F * 4.5) * k, y: yA + ch * 0.32 * k, deg: 7 * k};
  else if (o.mode === 'hs') Bs = {x: Bt.x + Math.max(cw * 0.24, F * 4) * k, y: yA + ch * 0.04 * k, deg: 6 * k};
  else if (o.mode === 'v') Bs = {x: Bt.x + F * 0.9 * k, y: yA + ch * 0.4 * k, deg: -6 * k};
  const strip = {w: stripW, h: sh, tab, x: lm - tab - F * 0.5, yRest: 0, yLaid: yA + reg.y - reg.half};
  const bs = cardBounds(Bs, M);
  const calW = F * (o.calK ?? 3.8), calH = calW * 0.84;
  const rm = F * 0.8, bm = F * 0.8;
  const right0 = Math.max(strip.x + stripW, Bt.x + cw, bs.x + bs.w);
  const bottom0 = Math.max(yA + ch, bs.y + bs.h);
  let cal = null;
  if (o.cal !== false) {
    const gapC = Math.max(F * 1.2, 20);
    const cands = [
      {x: lm, y: yA + ch + gapC, w: calW, h: calH},
      {x: strip.x + stripW + gapC * 0.8, y: Math.max(0, (sh - calH) / 2), w: calW, h: calH},
      {x: Math.max(0, lm - calW - gapC * 0.6), y: yA + ch + gapC, w: calW, h: calH},
    ];
    const free = c => !(c.x < bs.x + bs.w + 6 && c.x + c.w + 6 > bs.x && c.y < bs.y + bs.h + 6 && c.y + c.h + 6 > bs.y);
    const cost = c => Math.max(0, c.x + c.w - right0) + Math.max(0, c.y + c.h - bottom0) * 1.5;
    cal = cands.filter(free).sort((a, b) => cost(a) - cost(b))[0] || cands[1];
  }
  const right = Math.max(strip.x + stripW, Bt.x + cw, bs.x + bs.w, cal ? cal.x + cal.w : 0);
  const bottom = Math.max(yA + ch, bs.y + bs.h, cal ? cal.y + cal.h : 0);
  // arrow marks: A's on its right edge, B's on its left edge, at the register row; tips meet in the gap's middle
  const arrow = {len: gap / 2 - 2, hgt: Math.min(reg.half * 1.3, F * 1.6), y: reg.y};
  return {F, cw, ch, tab, lm, gap, reg, A, Bt, Bs, strip, cal, arrow, needW: right + rm, needH: bottom + bm};
}

/** Tip of a card's arrow mark (world), for a card pose: A's on the right edge, B's on the left edge. */
export function arrowTip(pose, M, plan, side) {
  return cardPoint(pose, M, {x: side === 'a' ? M.w + plan.arrow.len : -plan.arrow.len, y: plan.arrow.y});
}

export {clamp};
