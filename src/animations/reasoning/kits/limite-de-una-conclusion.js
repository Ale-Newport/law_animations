/**
 * Kit for the "Límite de una conclusión" motif (LAW-0117..0120): field set,
 * strings, geometry and original vector parts. Each entry owns its own
 * timeline, composition and semantics; this file only measures and draws.
 *
 * Physical metaphor — a BOUNDARY CORD laid on a survey map
 *  - RULE (regla)      a brass-framed PLAQUE carrying the proposition exactly
 *                      as the author supplied it, with a brass tie ring on
 *                      one edge. The cord is tied to that ring.
 *  - FACT (hecho)      SITUATION CARDS: paper index cards pinned to a survey
 *                      map sheet, numbered, printing the supplied situation.
 *                      Every card looks the same until the cord is laid —
 *                      the card itself never says whether it is covered.
 *  - CONNECTOR         the red BOUNDARY CORD. It runs from the tie ring to
 *    (conector)        the map and is laid as a closed loop around the cards
 *                      the author supplied as covered (a rounded hull, i.e.
 *                      the cord pulled taut around them). Cards inside get a
 *                      small cord-coloured pennant ("covered · as supplied");
 *                      cards left outside get a dashed ring ("not examined").
 *                      Outside never means excluded or decided: the cord
 *                      only marks how far the supplied proposition reaches.
 *  - LUPA              a hand magnifier whose glass shows a real enlarged,
 *                      text-free copy of what lies under it (the cord between
 *                      a covered and a not-examined card).
 * Glyphs are neutral on purpose: a pennant and a dashed ring, never a tick or
 * a cross. Nothing here says the proposition is true, applies in law or
 * decides any situation. Texts are fictional, jurisdiction unspecified.
 * @module animations/reasoning/kits/limite-de-una-conclusion
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, oneOf, list, obj} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';

export const SCOPES = ['included', 'not-examined'];
export const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Strings (built-in labels; user content is never translated)         */
/* ------------------------------------------------------------------ */
export const LIM_STRINGS = {
  en: {
    propKind: 'Proposition · as supplied',
    situation: 'Situation',
    covered: 'Covered · as supplied',
    notExamined: 'Not examined',
    outline: 'Outline',
    magnifier: 'Magnifier',
    issue: 'Issue',
    assumed: 'Assumed',
    keyInside: 'Inside the outline: covered as supplied',
    keyOutside: 'Outside: not examined (nothing decided)',
    noConclusion: 'as supplied · no conclusion drawn',
    closed: 'Outline closed',
    open: 'Outline left open',
  },
  es: {
    propKind: 'Proposición · según lo aportado',
    situation: 'Supuesto',
    covered: 'Cubierto · según lo aportado',
    notExamined: 'No examinado',
    outline: 'Contorno',
    magnifier: 'Lupa',
    issue: 'Cuestión',
    assumed: 'Se asume',
    keyInside: 'Dentro del contorno: cubierto según lo aportado',
    keyOutside: 'Fuera: no examinado (nada decidido)',
    noConclusion: 'según lo aportado · sin conclusión',
    closed: 'Contorno cerrado',
    open: 'Contorno dejado abierto',
  },
};

/* ------------------------------------------------------------------ */
/* Category field set (reasoning): facts, rules, issues, assumptions   */
/* ------------------------------------------------------------------ */
export const situationField = obj('A situation card (fictional, as supplied)', {
  text: str('Situation printed on the card (fictional)', 90),
  scope: oneOf('Scope SUPPLIED by the author: included (the cord is laid around it — covered as supplied) or not-examined (left outside the cord). Outside never means excluded or decided; nothing is inferred', SCOPES),
}, ['text', 'scope']);

export const limFields = {
  facts: list('Situations laid on the map, in order (numbered 1…n). Fictional, as supplied', situationField, 2, 6),
  rules: obj('The proposition whose reach is outlined. Illustrative text supplied by the author; never a statement of any law', {
    title: str('Source line printed on the plaque (fictional)', 90),
    proposition: str('The proposition exactly as supplied', 160),
  }, ['title', 'proposition']),
  issues: list('Open questions supplied by the author (shown on the note, never answered)', str('Issue', 110), 0, 2),
  assumptions: list('Working assumptions supplied by the author (shown on the note, not verified)', str('Assumption', 110), 0, 2),
};

/** Fictional default content (English). */
export const LIM_DEFAULTS = {
  rules: {
    title: 'Note 7 of the residents’ club (fictional)',
    proposition: 'Members are told of a meeting when its notice is pinned on the hall board',
  },
  facts: [
    {text: 'Notice pinned on the hall board a week ahead', scope: 'included'},
    {text: 'Notice pinned on the board of the annex hall', scope: 'included'},
    {text: 'Notice sent only by text message', scope: 'not-examined'},
    {text: 'Member abroad for the whole month', scope: 'not-examined'},
  ],
  issues: ['Does Note 7 say anything about notices sent by message?'],
  assumptions: ['Only the situations listed in Note 7 were examined'],
};

/** Fictional default content (Spanish), for the baseline-es presets. */
export const LIM_DEFAULTS_ES = {
  rules: {
    title: 'Nota 7 del club de vecinos (ficticia)',
    proposition: 'Los socios quedan avisados de una reunión cuando su aviso se clava en el tablón de la sala',
  },
  facts: [
    {text: 'Aviso clavado en el tablón de la sala una semana antes', scope: 'included'},
    {text: 'Aviso clavado en el tablón de la sala anexa', scope: 'included'},
    {text: 'Aviso enviado solo por mensaje de texto', scope: 'not-examined'},
    {text: 'Socio en el extranjero todo el mes', scope: 'not-examined'},
  ],
  issues: ['¿Dice algo la Nota 7 sobre avisos enviados por mensaje?'],
  assumptions: ['Solo se examinaron los supuestos que enumera la Nota 7'],
};

/** A fitted text broke a word across lines (defect: "devolució / n") — treated like a truncation. */
export function brokeWord(f) {
  if (!f || f.truncated) return false;
  return f.lines.join(' ').replace(/\s+/g, ' ').trim() !== String(f.full ?? '').replace(/\s+/g, ' ').trim();
}
/** Fitted text is complete: not ellipsised and no word broken. */
export const fitOk = f => !f || (!f.truncated && !brokeWord(f));

/** Situations with their number and supplied scope (optionally overridden per index). */
export function resolveSituations(facts, override = {}) {
  return facts.map((f, i) => ({i, n: i + 1, text: f.text, scope: override[i] ?? f.scope}));
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */
export function limColors(ctx) {
  const th = ctx.theme;
  return {
    cord: th.accent,
    cordDark: shade(th.accent, -0.38),
    cordHi: shade(th.accent, 0.5),
    map: '#f2eddf',
    mapShade: '#e6dfcb',
    mapLine: '#dcd3bd',
    mapEdge: '#b3a78b',
    tape: 'rgba(233, 222, 180, 0.9)',
    brass: '#cda653',
    brassDark: '#8b6b28',
    brassHi: '#efd9a0',
    plaque: '#fbf7ea',
    card: th.paper,
    cardHead: '#ebe5d5',
    cardLine: th.paperLine,
    pin: '#5d7285',
    ring: th.inkSoft,
    ink: th.ink,
    inkSoft: th.inkSoft,
    note: '#fff6c9',
    spool: '#b98a5e',
    spoolDark: '#7e5a36',
  };
}

/** Design units per output pixel at the 1080p reference (depends on the frame's aspect and safe box). */
export function unitsPer1080px(ctx) {
  const v = ctx.view, c = v.content, D = ctx.design;
  return 1 / (Math.min(c.w / D.w, c.h / D.h) * (1080 / Math.min(v.width, v.height)));
}

/* ------------------------------------------------------------------ */
/* Geometry: hull of the covered cards, polylines                      */
/* ------------------------------------------------------------------ */
/** Convex hull (monotone chain); positive shoelace area (clockwise on screen). */
export function convexHull(pts) {
  const P = pts.map(p => ({x: p.x, y: p.y})).sort((a, b) => a.x - b.x || a.y - b.y);
  if (P.length < 3) {
    const u = [];
    for (const p of P) if (!u.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 1e-6)) u.push(p);
    return u;
  }
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of P) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * The cord pulled taut around a set of points at distance m: the Minkowski
 * sum of their convex hull with a disc (straight runs + round corners).
 * Returned as a closed polyline (first point not repeated), clockwise on screen.
 * @param {{x:number,y:number}[]} pts
 * @param {number} m
 * @param {number} [stepDeg=9]
 */
export function roundedHull(pts, m, stepDeg = 9) {
  const H = convexHull(pts);
  const out = [];
  if (!H.length) return out;
  if (H.length === 1) {
    for (let a = -90; a < 270; a += stepDeg) out.push({x: H[0].x + m * Math.cos(a * Math.PI / 180), y: H[0].y + m * Math.sin(a * Math.PI / 180)});
    return out;
  }
  const k = H.length;
  const normal = i => {
    const a = H[i], b = H[(i + 1) % k];
    return Math.atan2(-(b.x - a.x), b.y - a.y); // angle of (dy, -dx)
  };
  for (let i = 0; i < k; i++) {
    let a0 = normal((i - 1 + k) % k);
    let a1 = normal(i);
    while (a1 < a0 - 1e-9) a1 += Math.PI * 2;
    const n = Math.max(1, Math.ceil(((a1 - a0) * 180 / Math.PI) / stepDeg));
    for (let s = 0; s <= n; s++) {
      const a = a0 + ((a1 - a0) * s) / n;
      out.push({x: H[i].x + m * Math.cos(a), y: H[i].y + m * Math.sin(a)});
    }
    // straight run to the next corner, densified so every stretch has points (knot, lens, tags)
    const b = H[(i + 1) % k];
    const e0 = {x: H[i].x + m * Math.cos(a1), y: H[i].y + m * Math.sin(a1)};
    const e1 = {x: b.x + m * Math.cos(a1), y: b.y + m * Math.sin(a1)};
    const L = Math.hypot(e1.x - e0.x, e1.y - e0.y);
    const nn = Math.floor(L / 14);
    for (let s = 1; s < nn; s++) out.push({x: e0.x + ((e1.x - e0.x) * s) / nn, y: e0.y + ((e1.y - e0.y) * s) / nn});
  }
  return out;
}

/** Rotate a closed loop so that it starts at the point nearest to `anchor`; returns an OPEN list ending back at the start. */
export function loopFrom(loop, anchor) {
  if (!loop.length) return [];
  let best = 0, bd = Infinity;
  loop.forEach((p, i) => {
    const d = Math.hypot(p.x - anchor.x, p.y - anchor.y);
    if (d < bd) { bd = d; best = i; }
  });
  const out = loop.slice(best).concat(loop.slice(0, best));
  out.push({...out[0]});
  return out;
}

/** Arc-length track over a polyline: point at a length, partial path data. */
export function track(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 0;
  const at = len => {
    if (pts.length === 1 || total === 0) return {x: pts[0].x, y: pts[0].y, a: 0, i: 0};
    const L = clamp(len, 0, total);
    let lo = 0, hi = cum.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= L) lo = mid; else hi = mid;
    }
    const sl = cum[hi] - cum[lo] || 1;
    const k = (L - cum[lo]) / sl;
    const a = pts[lo], b = pts[hi];
    return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, a: Math.atan2(b.y - a.y, b.x - a.x), i: lo};
  };
  /** path data of the first `len` units (at least a dot) */
  const d = len => {
    const L = clamp(len, 0, total);
    const e = at(L);
    const parts = [`M${r(pts[0].x)} ${r(pts[0].y)}`];
    for (let i = 1; i <= e.i && i < pts.length; i++) parts.push(`L${r(pts[i].x)} ${r(pts[i].y)}`);
    parts.push(`L${r(e.x + (L <= 0 ? 0.01 : 0))} ${r(e.y)}`);
    return parts.join('');
  };
  return {pts, cum, total, at, d};
}

/** Corners of a (possibly rotated) box {x,y,w,h,rot} with outward padding. */
export function boxCorners(b, pad = {}) {
  const t = pad.top ?? pad.all ?? 0, bo = pad.bottom ?? pad.all ?? 0, s = pad.side ?? pad.all ?? 0;
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const a = ((b.rot || 0) * Math.PI) / 180;
  const loc = [[-b.w / 2 - s, -b.h / 2 - t], [b.w / 2 + s, -b.h / 2 - t], [b.w / 2 + s, b.h / 2 + bo], [-b.w / 2 - s, b.h / 2 + bo]];
  return loc.map(([x, y]) => ({x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a)}));
}

/** Axis-aligned bounds of a rotated box (with optional padding). */
export function boxBounds(b, pad = {}) {
  const c = boxCorners(b, pad);
  const xs = c.map(p => p.x), ys = c.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

/** Distance from point p to an axis-aligned box (0 inside). */
export function distToBox(p, b) {
  const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w));
  const dy = Math.max(b.y - p.y, 0, p.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

/** Minimum distance from any polyline vertex to a box. */
export function polyDistToBox(pts, b) {
  let m = Infinity;
  for (const p of pts) m = Math.min(m, distToBox(p, b));
  return m;
}

/** Point in polygon (even-odd). */
export function inside(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

export const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

export function unionBox(list) {
  const bs = list.filter(Boolean);
  if (!bs.length) return null;
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}

/* ------------------------------------------------------------------ */
/* Situation card                                                      */
/* ------------------------------------------------------------------ */
/**
 * Measure a situation card of width w.
 * @param {any} ctx
 * @param {{text:string, n:number, w:number, s:number, kind?:string|null, tags?:boolean, maxLines?:number, tagSize?:number, kindSize?:number, compact?:boolean}} o
 */
export function cardGeom(ctx, o) {
  const s = o.s;
  const show = ctx.show('key');
  const pad = s * 0.55;
  const ks0 = o.kindSize ?? s * 0.74;
  const head = o.compact ? Math.max(s * 1.25, (o.kindSize ?? 0) * 1.3) : Math.max(s * (o.headK ?? 1.55), o.kind ? ks0 * 1.8 : ks0 * 1.45);
  const fit = show && !o.compact ? ctx.fit(o.text, {maxWidth: o.w - 2 * pad, size: s, minSize: s * 0.98, maxLines: o.maxLines ?? 4, weight: 500}) : null;
  const barsN = o.compact ? 2 : 2;
  const textH = fit ? fit.height : s * 1.2 * barsN - s * 0.25;
  const ks = o.kindSize ?? s * 0.74;
  // (o.kindRoom, opt-in: extra room between the header text and the pennant — e.g. for the letter-spacing the
  // header is drawn with, which the width estimate does not include)
  const kindFit = ctx.show('all') && o.kind && !o.compact ? ctx.fit(`${o.kind} ${o.n}`, {maxWidth: o.w - 2 * pad - head * 0.9 - head * 0.95 - (o.kindRoom ?? 0), size: ks, minSize: ks * 0.9, maxLines: 1, weight: 700}) : null;
  const ts = o.tagSize ?? s * 0.74;
  const tagsOn = o.tags !== false && show;
  // status tags live inside the card's width (two lines if the card is narrow)
  const tagMax = o.w - ts * 2.2;
  const tIn = tagsOn ? ctx.fit(ctx.t.covered, {maxWidth: tagMax, size: ts, minSize: ts * 0.94, maxLines: 2, weight: 700}) : null;
  const tOut = tagsOn ? ctx.fit(ctx.t.notExamined, {maxWidth: tagMax, size: ts, minSize: ts * 0.94, maxLines: 2, weight: 700}) : null;
  const tagH = tagsOn ? Math.max(tIn.height, tOut.height) + ts * 0.78 : 0;
  const hh = head + pad + textH + pad * 0.7 + tagH;
  const rise = 0;
  return {w: o.w, h: hh, minW: 0, rise, s, pad, head, ks, fit, textH, kindFit, tIn, tOut, tagH, ts, n: o.n, text: o.text, compact: !!o.compact, truncated: ![fit, kindFit, tIn, tOut].every(fitOk)};
}

/**
 * A numbered tile (a card that is all header: number disc, pushpin, pennant, ring) for maps whose situation
 * texts are listed once in a shared legend — never placeholder bars.
 */
export function tileGeom(o) {
  const ts = o.s;
  const head = ts * 2.1;
  // the pennant is scaled so it stays clear of the number disc (disc right edge ~1.98 ts; pennant width 0.8 head)
  const flagK = Math.max(0.35, Math.min(1, (o.w / ts - 2.75) / 1.68));
  return {w: o.w, h: head, minW: 0, rise: 0, s: ts, pad: ts * 0.55, head, ks: ts * 0.9, fit: null, textH: 0, kindFit: null, tIn: null, tOut: null, tagH: 0, ts, n: o.n, text: o.text, compact: true, tile: true, flagK, truncated: false};
}

/**
 * Card art in local coordinates (0,0 = top-left). Named parts (prefix p, index i):
 * `${p}-card${i}` (group; the scene positions it), `${p}-flag${i}` (pennant, covered),
 * `${p}-ring${i}` (dashed ring, not examined), `${p}-tagIn${i}` / `${p}-tagOut${i}` (tags),
 * `${p}-text${i}` (text group; the inspect entry swaps it).
 * @param {any} ctx
 * @param {ReturnType<typeof cardGeom>} cg
 * @param {{prefix:string, i:number, named?:boolean, textless?:boolean, transform?:string, text?:any}} o
 */
export function cardArt(ctx, cg, o) {
  const th = ctx.theme;
  const C = limColors(ctx);
  const named = o.named !== false;
  const nm = local => (named ? `${o.prefix}-${local}${o.i}` : undefined);
  const {w, h: hh, head, pad, s} = cg;
  const show = ctx.show('key') && !o.textless;
  const br = Math.max(head * 0.34, (cg.ks ?? 0) * 0.8);
  const bx = pad + br, by = head * 0.52;
  const textNode = o.text !== undefined ? o.text : cg.tile ? null : show && cg.fit
    ? textBlock(cg.fit, {x: pad, y: head + pad, fill: th.ink, name: nm('text')})
    : barLines(pad, head + pad, w - 2 * pad, 2, s, C.cardLine, nm('text'));
  const tag = (fit, name, fill, stroke, color, dashed) => {
    if (!fit || o.textless) return null;
    const tw = fit.width + cg.ts * 1.3 + cg.ts * 0.9;
    const x = (w - tw) / 2, y = hh - cg.tagH;
    return g({name, opacity: 0},
      h('path', {d: roundRectPath(x, y, tw, cg.tagH, Math.min(cg.tagH / 2, cg.ts * 0.9)), fill, stroke, 'stroke-width': 2.2, 'stroke-dasharray': dashed ? '6 4' : undefined}),
      dashed
        ? h('circle', {cx: r(x + cg.ts * 0.65 + cg.ts * 0.3), cy: r(y + cg.tagH / 2), r: r(cg.ts * 0.27), fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-dasharray': '2.5 2'})
        : h('path', {d: flagGlyph(x + cg.ts * 0.65 + cg.ts * 0.05, y + cg.tagH / 2, cg.ts * 0.62), fill: color}),
      textBlock(fit, {x: x + cg.ts * 0.65 + cg.ts * 0.9, y: y + (cg.tagH - fit.height) / 2, fill: color}));
  };
  return g({name: nm('card'), transform: o.transform},
    // dashed ring (not examined): drawn under the card
    h('path', {name: nm('ring'), d: roundRectPath(-11, -11, w + 22, hh - cg.tagH * 0.5 + 22, 14), fill: 'none', stroke: C.ring, 'stroke-width': 3, 'stroke-dasharray': '9 7', opacity: 0}),
    h('path', {d: roundRectPath(4, 7, w, hh - cg.tagH * 0.5, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh - cg.tagH * 0.5, 8), fill: C.card, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(1)} ${r(head)}V8Q1 1 8 1H${r(w - 8)}Q${r(w - 1)} 1 ${r(w - 1)} 8V${r(head)}Z`, fill: C.cardHead}),
    h('line', {x1: 1, y1: r(head), x2: r(w - 1), y2: r(head), stroke: C.cardLine, 'stroke-width': 1.5}),
    h('circle', {cx: r(bx), cy: r(by), r: r(br), fill: th.ink}),
    show ? h('text', {x: r(bx), y: r(by + Math.max(br * 1.2, cg.ks ?? 0) * 0.36), 'text-anchor': 'middle', 'font-size': r(Math.max(br * 1.2, cg.ks ?? 0)), 'font-weight': 800, 'font-family': SANS, fill: '#ffffff'}, String(cg.n)) : null,
    cg.kindFit && !o.textless ? textBlock(cg.kindFit, {x: bx + br + head * 0.3, y: by - cg.kindFit.height / 2, fill: th.inkSoft, letterSpacing: 0.6}) : null,
    // pushpin
    h('ellipse', {cx: r(w / 2 + 3), cy: r(-2), rx: 7, ry: 4, fill: th.shadow}),
    h('circle', {cx: r(w / 2), cy: r(-5), r: 7.5, fill: C.pin, stroke: th.ink, 'stroke-width': 1.8}),
    h('circle', {cx: r(w / 2 - 2.4), cy: r(-7.4), r: 2.2, fill: '#ffffff', opacity: 0.6}),
    textNode,
    // pennant (covered as supplied), planted in the top-right corner
    // (inside the header band, top-right: it never reaches the card above)
    g({name: nm('flag'), transform: cg.flagK ? `${T(w - pad * 0.7, head * 0.86)} scale(${r(cg.flagK, 3)})` : T(w - pad * 0.7, head * 0.86), opacity: 0},
      g({name: nm('flagS')},
        h('line', {x1: 0, y1: 0, x2: 0, y2: r(-head * 0.78), stroke: th.ink, 'stroke-width': 2.6, 'stroke-linecap': 'round'}),
        h('path', {d: `M0 ${r(-head * 0.78)}L${r(-head * 0.8)} ${r(-head * 0.56)}L0 ${r(-head * 0.34)}Z`, fill: C.cord, stroke: C.cordDark, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
        h('circle', {r: 3.5, fill: C.cordDark}))),
    tag(cg.tIn, nm('tagIn'), th.card, C.cord, shade(C.cord, -0.3), false),
    tag(cg.tOut, nm('tagOut'), th.card, C.ring, th.inkSoft, true),
  );
}

/** Small pennant glyph (path) with its staff at (x, y) centre. */
export function flagGlyph(x, y, s) {
  return `M${r(x - s * 0.3)} ${r(y + s * 0.55)}V${r(y - s * 0.55)}L${r(x + s * 0.5)} ${r(y - s * 0.28)}L${r(x - s * 0.2)} ${r(y)}V${r(y + s * 0.55)}Z`;
}

/** Placeholder bars standing in for text when labels are hidden (x, y = top of the block). */
export function barLines(x, y, w, n, s, color, name, opacity) {
  const out = [];
  for (let k = 0; k < n; k++) {
    const lw = n > 1 && k === n - 1 ? w * 0.58 : w;
    out.push(h('rect', {x: r(x), y: r(y + k * s * 1.2 + s * 0.2), width: r(lw), height: r(s * 0.46), rx: r(s * 0.23), fill: color}));
  }
  return g({name, opacity}, out);
}

/* ------------------------------------------------------------------ */
/* Proposition plaque (rule)                                           */
/* ------------------------------------------------------------------ */
/**
 * @param {any} ctx
 * @param {{w:number, s:number, kind:string, title:string, text:string, maxLines?:number, kindSize?:number, compact?:boolean}} o
 */
export function plaqueGeom(ctx, o) {
  const s = o.s;
  const fr = Math.max(10, s * 0.42);
  const pad = s * 0.62;
  const iw = o.w - 2 * fr - 2 * pad;
  const ks = o.kindSize ?? s * 0.72;
  const kind = ctx.show('all') && o.kind ? ctx.fit(o.kind, {maxWidth: iw, size: ks, minSize: ks * 0.9, maxLines: 2, weight: 700}) : null;
  const title = ctx.show('key') && !o.compact ? ctx.fit(o.title, {maxWidth: iw, size: s, minSize: s, maxLines: 3, weight: 700}) : null;
  const text = ctx.show('key') ? ctx.fit(o.text, {maxWidth: iw, size: s * 1.04, minSize: s, maxLines: o.maxLines ?? 5, weight: 500, family: 'serif'}) : null;
  const gap = s * 0.3;
  const titleH = title ? title.height : (o.compact ? 0 : s * 0.8);
  const textH = text ? text.height : s * 1.2 * 3;
  const hh = 2 * fr + 2 * pad + (kind ? kind.height + gap * 1.5 : 0) + (o.compact ? 0 : titleH + gap * 1.4) + textH;
  return {w: o.w, h: hh, fr, pad, iw, kind, title, text, gap, s, compact: !!o.compact, truncated: ![kind, title, text].every(fitOk)};
}

/**
 * Plaque art at (x, y). The tie ring sits on the `ring` side ('bottom' | 'right' | 'left' | 'top') at fraction `ringAt`.
 * @returns {{node:any, ring:{x:number,y:number}, box:{x:number,y:number,w:number,h:number}}}
 */
export function plaqueArt(ctx, pg, o) {
  const th = ctx.theme;
  const C = limColors(ctx);
  const {w, h: hh, fr, pad, s} = pg;
  const x = o.x, y = o.y;
  const side = o.ring ?? 'bottom';
  const at = o.ringAt ?? 0.5;
  const rr = Math.max(9, s * 0.36);
  const post = rr * 1.1;
  const ring = side === 'bottom' ? {x: x + w * at, y: y + hh + post + rr}
    : side === 'top' ? {x: x + w * at, y: y - post - rr}
      : side === 'right' ? {x: x + w + post + rr, y: y + hh * at}
        : {x: x - post - rr, y: y + hh * at};
  const base = side === 'bottom' ? {x: ring.x, y: y + hh - 2} : side === 'top' ? {x: ring.x, y: y + 2} : side === 'right' ? {x: x + w - 2, y: ring.y} : {x: x + 2, y: ring.y};
  const parts = [];
  let yy = y + fr + pad;
  const tx = x + fr + pad;
  if (pg.kind) {
    parts.push(textBlock(pg.kind, {x: tx, y: yy, fill: C.brassDark, letterSpacing: 0.6}));
    yy += pg.kind.height + pg.gap * 1.5;
  }
  if (!pg.compact) {
    if (pg.title) parts.push(textBlock(pg.title, {x: tx, y: yy, fill: th.ink}));
    else parts.push(barLines(tx, yy - s * 0.2, pg.iw * 0.6, 1, s * 0.9, shade(C.brass, 0.35)));
    yy += (pg.title ? pg.title.height : s * 0.8) + pg.gap * 1.4;
    parts.push(h('line', {x1: r(tx), y1: r(yy - pg.gap * 0.8), x2: r(tx + pg.iw), y2: r(yy - pg.gap * 0.8), stroke: shade(C.brass, 0.2), 'stroke-width': 2}));
  }
  if (pg.text) parts.push(textBlock(pg.text, {x: tx, y: yy, fill: th.ink, name: o.textName}));
  else parts.push(barLines(tx, yy, pg.iw, 3, s, shade(C.brass, 0.35), o.textName));
  const screw = (cx, cy) => g(null,
    h('circle', {cx: r(cx), cy: r(cy), r: r(fr * 0.32), fill: C.brassHi, stroke: C.brassDark, 'stroke-width': 1.5}),
    h('line', {x1: r(cx - fr * 0.2), y1: r(cy - fr * 0.2), x2: r(cx + fr * 0.2), y2: r(cy + fr * 0.2), stroke: C.brassDark, 'stroke-width': 1.5}));
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x + 5, y + 8, w, hh, 12), fill: th.shadow}),
    // tie post and ring
    side === 'none' ? null : g(null,
      h('line', {x1: r(base.x), y1: r(base.y), x2: r(ring.x), y2: r(ring.y), stroke: C.brassDark, 'stroke-width': rr * 0.9, 'stroke-linecap': 'round'}),
      h('circle', {cx: r(ring.x), cy: r(ring.y), r: r(rr), fill: 'none', stroke: C.brassDark, 'stroke-width': rr * 0.62}),
      h('circle', {cx: r(ring.x), cy: r(ring.y), r: r(rr), fill: 'none', stroke: C.brass, 'stroke-width': rr * 0.38})),
    h('path', {d: roundRectPath(x, y, w, hh, 12), fill: C.brass, stroke: C.brassDark, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(x + fr * 0.35, y + fr * 0.35, w - fr * 0.7, hh - fr * 0.7, 9), fill: 'none', stroke: C.brassHi, 'stroke-width': 1.6, opacity: 0.8}),
    h('path', {d: roundRectPath(x + fr, y + fr, w - 2 * fr, hh - 2 * fr, 6), fill: C.plaque, stroke: C.brassDark, 'stroke-width': 1.6}),
    screw(x + fr * 0.5, y + fr * 0.5), screw(x + w - fr * 0.5, y + fr * 0.5), screw(x + fr * 0.5, y + hh - fr * 0.5), screw(x + w - fr * 0.5, y + hh - fr * 0.5),
    parts,
  );
  return {node, ring, box: {x, y, w, h: hh}, ringR: rr};
}

/* ------------------------------------------------------------------ */
/* Survey map sheet                                                    */
/* ------------------------------------------------------------------ */
export function mapSheet(ctx, o) {
  const th = ctx.theme;
  const C = limColors(ctx);
  const {x, y, w, h: hh} = o;
  const step = o.step ?? 56;
  const lines = [];
  for (let gx = x + step; gx < x + w - 6; gx += step) lines.push(h('line', {x1: r(gx), y1: r(y + 6), x2: r(gx), y2: r(y + hh - 6), stroke: C.mapLine, 'stroke-width': 1.2}));
  for (let gy = y + step; gy < y + hh - 6; gy += step) lines.push(h('line', {x1: r(x + 6), y1: r(gy), x2: r(x + w - 6), y2: r(gy), stroke: C.mapLine, 'stroke-width': 1.2}));
  const tape = (cx, cy, a) => h('rect', {x: -34, y: -11, width: 68, height: 22, rx: 3, fill: C.tape, stroke: 'rgba(160,140,90,0.35)', 'stroke-width': 1, transform: T(cx, cy, a)});
  const cr = o.compass ?? Math.min(46, w * 0.05);
  const cx = o.compassAt ? o.compassAt.x : x + w - cr - 22, cy = o.compassAt ? o.compassAt.y : y + hh - cr - 22;
  const compass = o.compass === 0 ? null : g({transform: T(cx, cy)},
    h('circle', {r: r(cr), fill: 'none', stroke: C.mapEdge, 'stroke-width': 1.6, opacity: 0.8}),
    h('path', {d: `M0 ${r(-cr * 0.92)}L${r(cr * 0.17)} 0L0 ${r(cr * 0.92)}L${r(-cr * 0.17)} 0Z`, fill: C.mapShade, stroke: C.mapEdge, 'stroke-width': 1.4}),
    h('path', {d: `M0 ${r(-cr * 0.92)}L${r(cr * 0.17)} 0H${r(-cr * 0.17)}Z`, fill: C.mapEdge}),
    h('path', {d: `M${r(-cr * 0.92)} 0L0 ${r(cr * 0.14)}L${r(cr * 0.92)} 0L0 ${r(-cr * 0.14)}Z`, fill: 'none', stroke: C.mapEdge, 'stroke-width': 1.2}));
  return g({name: o.name},
    h('path', {d: roundRectPath(x + 6, y + 10, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 6), fill: C.map, stroke: C.mapEdge, 'stroke-width': 2}),
    lines,
    h('path', {d: roundRectPath(x + 12, y + 12, w - 24, hh - 24, 4), fill: 'none', stroke: C.mapEdge, 'stroke-width': 1.4, opacity: 0.7}),
    compass,
    o.tapes === false ? null : [tape(x + 16, y + 14, -38), tape(x + w - 16, y + 14, 38), tape(x + 16, y + hh - 14, 38), tape(x + w - 16, y + hh - 14, -38)],
  );
}

/* ------------------------------------------------------------------ */
/* Boundary cord, knot, spool                                          */
/* ------------------------------------------------------------------ */
/** Cord nodes (outline, body, twist highlight); `d` is set per frame with cordFrame. */
export function cordArt(ctx, name, width = 6, opacity) {
  const C = limColors(ctx);
  return g({name, opacity},
    h('path', {name: `${name}-o`, d: 'M0 0', fill: 'none', stroke: C.cordDark, 'stroke-width': width + 3.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {name: `${name}-c`, d: 'M0 0', fill: 'none', stroke: C.cord, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {name: `${name}-h`, d: 'M0 0', fill: 'none', stroke: C.cordHi, 'stroke-width': Math.max(1.4, width * 0.3), 'stroke-dasharray': `${r(width * 0.8)} ${r(width * 1.1)}`, 'stroke-linecap': 'round', opacity: 0.8}),
  );
}
export function cordFrame(name, d) {
  return {[`${name}-o`]: {d}, [`${name}-c`]: {d}, [`${name}-h`]: {d}};
}

/** Knot at the closing point of the loop (local origin). */
export function knotArt(ctx, name, s = 10) {
  const C = limColors(ctx);
  return g({name, opacity: 0},
    h('ellipse', {rx: r(s * 1.25), ry: r(s * 0.95), fill: C.cord, stroke: C.cordDark, 'stroke-width': 2.4}),
    h('path', {d: `M${r(-s * 0.8)} ${r(-s * 0.2)}Q0 ${r(-s * 0.9)} ${r(s * 0.8)} ${r(-s * 0.1)}M${r(-s * 0.7)} ${r(s * 0.4)}Q0 ${r(-s * 0.1)} ${r(s * 0.7)} ${r(s * 0.45)}`, fill: 'none', stroke: C.cordDark, 'stroke-width': 1.8, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(s * 1.1)} ${r(s * 0.3)}l${r(s * 0.9)} ${r(s * 1.1)}M${r(s * 0.6)} ${r(s * 0.7)}l${r(s * 0.2)} ${r(s * 1.3)}`, fill: 'none', stroke: C.cordDark, 'stroke-width': r(s * 0.55), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(s * 1.1)} ${r(s * 0.3)}l${r(s * 0.9)} ${r(s * 1.1)}M${r(s * 0.6)} ${r(s * 0.7)}l${r(s * 0.2)} ${r(s * 1.3)}`, fill: 'none', stroke: C.cord, 'stroke-width': r(s * 0.32), 'stroke-linecap': 'round'}),
  );
}

/** Wooden cord spool (local origin = centre); the cord leaves from its rim. */
export function spoolArt(ctx, name, s = 26) {
  const C = limColors(ctx);
  const wraps = [];
  for (let k = -3; k <= 3; k++) wraps.push(h('line', {x1: r(k * s * 0.16), y1: r(-s * 0.62), x2: r(k * s * 0.16 + s * 0.06), y2: r(s * 0.62), stroke: C.cordDark, 'stroke-width': 1.6, opacity: 0.8}));
  return g({name},
    h('ellipse', {cx: 4, cy: 6, rx: r(s * 0.75), ry: r(s * 0.8), fill: ctx.theme.shadow}),
    h('rect', {x: r(-s * 0.72), y: r(-s * 0.8), width: r(s * 0.3), height: r(s * 1.6), rx: 4, fill: C.spool, stroke: ctx.theme.ink, 'stroke-width': 2}),
    h('rect', {x: r(s * 0.42), y: r(-s * 0.8), width: r(s * 0.3), height: r(s * 1.6), rx: 4, fill: C.spool, stroke: ctx.theme.ink, 'stroke-width': 2}),
    h('rect', {x: r(-s * 0.46), y: r(-s * 0.64), width: r(s * 0.92), height: r(s * 1.28), rx: 3, fill: C.cord, stroke: C.cordDark, 'stroke-width': 1.8}),
    wraps,
  );
}

/** Line-marking reel (no hand): a small brass wheel frame that lays the cord as it rolls. */
export function reelArt(ctx, name, s = 20) {
  const C = limColors(ctx);
  return g({name},
    h('circle', {cx: 3, cy: 5, r: r(s * 1.05), fill: ctx.theme.shadow}),
    h('circle', {r: r(s), fill: C.brass, stroke: C.brassDark, 'stroke-width': 2.2}),
    h('circle', {r: r(s * 0.66), fill: C.cord, stroke: C.cordDark, 'stroke-width': 1.8}),
    g({name: `${name}-spokes`},
      h('path', {d: `M${r(-s * 0.66)} 0H${r(s * 0.66)}M0 ${r(-s * 0.66)}V${r(s * 0.66)}`, stroke: C.cordDark, 'stroke-width': 1.6})),
    h('circle', {r: r(s * 0.2), fill: C.brassHi, stroke: C.brassDark, 'stroke-width': 1.5}),
  );
}

/* ------------------------------------------------------------------ */
/* Note / key block                                                    */
/* ------------------------------------------------------------------ */
/**
 * The pinned note: supplied issues and assumptions ('all'), then the key
 * (pennant = inside / covered as supplied, dashed ring = outside / not
 * examined) and the state footer ('key'). Rows wrap, never ellipsised.
 * @param {any} ctx
 * @param {{w:number, s:number, issues:string[], assumptions:string[], state:string, key?:boolean, maxLines?:number}} o
 */
export function noteGeom(ctx, o) {
  const t = ctx.t;
  const s = o.s;
  const pad = s * 0.6;
  const icon = s * 1.3;
  const iw = o.w - 2 * pad;
  const rows = [];
  const ml = o.maxLines ?? 6;
  if (ctx.show('all')) {
    o.issues.forEach(q => rows.push({kind: 'issue', fit: ctx.fit(`${t.issue}: ${q}`, {maxWidth: iw, size: s, minSize: s * 0.92, maxLines: ml, weight: 600})}));
    o.assumptions.forEach(q => rows.push({kind: 'assumed', fit: ctx.fit(`${t.assumed}: ${q}`, {maxWidth: iw, size: s, minSize: s * 0.92, maxLines: ml, weight: 500})}));
  }
  if (ctx.show('key') && o.key !== false) {
    if (o.cordLabel) rows.push({kind: 'cord', fit: ctx.fit(o.cordLabel, {maxWidth: iw - icon, size: s, minSize: s * 0.92, maxLines: 5, weight: 700})});
    rows.push({kind: 'in', fit: ctx.fit(t.keyInside, {maxWidth: iw - icon, size: s, minSize: s * 0.92, maxLines: 5, weight: 600})});
    rows.push({kind: 'out', fit: ctx.fit(t.keyOutside, {maxWidth: iw - icon, size: s, minSize: s * 0.92, maxLines: 5, weight: 600})});
    rows.push({kind: 'state', fit: ctx.fit(`${o.state} · ${t.noConclusion}`, {maxWidth: iw, size: s, minSize: s * 0.92, maxLines: 5, weight: 700})});
  }
  const gap = s * 0.42;
  const hh = rows.length ? 2 * pad + rows.reduce((a, rw) => a + rw.fit.height, 0) + (rows.length - 1) * gap + (rows.some(rw => rw.kind === 'in' || rw.kind === 'cord') && rows.some(rw => rw.kind === 'issue' || rw.kind === 'assumed') ? gap * 1.2 : 0) : 0;
  const w = rows.length ? Math.min(o.w, Math.max(...rows.map(rw => rw.fit.width + (rw.kind === 'in' || rw.kind === 'out' || rw.kind === 'cord' ? icon : 0))) + 2 * pad) : 0;
  return {w, h: hh, rows, pad, gap, icon, s, truncated: !rows.every(rw => fitOk(rw.fit)), minSize: rows.length ? Math.min(...rows.map(rw => rw.fit.size)) : null};
}

/** Note art at (x, y); returns node and box. Row nodes are named `${name}-row${k}`. */
export function noteArt(ctx, ng, o) {
  if (!ng.rows.length) return {node: null, box: null};
  const th = ctx.theme;
  const C = limColors(ctx);
  const {w, h: hh, pad, gap, icon, s} = ng;
  const x = o.x, y = o.y;
  let yy = y + pad;
  let prevKind = null;
  const parts0 = [];
  const parts = ng.rows.map((rw, k) => {
    if (prevKind && (prevKind === 'issue' || prevKind === 'assumed') && (rw.kind === 'in' || rw.kind === 'cord')) {
      parts0.push(h('line', {x1: r(x + pad), y1: r(yy + gap * 0.1), x2: r(x + w - pad), y2: r(yy + gap * 0.1), stroke: 'rgba(120,100,40,0.35)', 'stroke-width': 1.5, 'stroke-dasharray': '5 5'}));
      yy += gap * 1.2;
    }
    prevKind = rw.kind;
    const ic = rw.kind === 'in' || rw.kind === 'out' || rw.kind === 'cord';
    const tx = x + pad + (ic ? icon : 0);
    const cy = yy + rw.fit.size * 0.55;
    const glyph = rw.kind === 'cord'
      ? g(null, h('path', {d: `M${r(x + pad)} ${r(cy + s * 0.2)}q${r(s * 0.25)} ${r(-s * 0.55)} ${r(s * 0.5)} ${r(-s * 0.1)}t${r(s * 0.5)} ${r(-s * 0.2)}`, fill: 'none', stroke: C.cordDark, 'stroke-width': 5.5, 'stroke-linecap': 'round'}),
        h('path', {d: `M${r(x + pad)} ${r(cy + s * 0.2)}q${r(s * 0.25)} ${r(-s * 0.55)} ${r(s * 0.5)} ${r(-s * 0.1)}t${r(s * 0.5)} ${r(-s * 0.2)}`, fill: 'none', stroke: C.cord, 'stroke-width': 3.2, 'stroke-linecap': 'round'}))
      : rw.kind === 'in'
      ? g(null, h('line', {x1: r(x + pad + s * 0.25), y1: r(cy + s * 0.55), x2: r(x + pad + s * 0.25), y2: r(cy - s * 0.6), stroke: th.ink, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
        h('path', {d: `M${r(x + pad + s * 0.25)} ${r(cy - s * 0.6)}L${r(x + pad + s * 0.95)} ${r(cy - s * 0.35)}L${r(x + pad + s * 0.25)} ${r(cy - s * 0.1)}Z`, fill: C.cord, stroke: C.cordDark, 'stroke-width': 1.4}))
      : rw.kind === 'out'
        ? h('path', {d: roundRectPath(x + pad, cy - s * 0.45, s * 0.9, s * 0.9, s * 0.2), fill: 'none', stroke: C.ring, 'stroke-width': 2.2, 'stroke-dasharray': '4 3'})
        : null;
    const color = rw.kind === 'state' ? shade(C.cord, -0.35) : rw.kind === 'assumed' ? th.inkSoft : th.ink;
    const node = g({name: o.name ? `${o.name}-row${k}` : undefined}, glyph, textBlock(rw.fit, {x: tx, y: yy, fill: color, italic: rw.kind === 'assumed'}));
    yy += rw.fit.height + gap;
    return node;
  });
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x + 5, y + 8, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 6), fill: C.note, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(x + 1)} ${r(y + 6)}H${r(x + w - 1)}`, stroke: '#e8d98a', 'stroke-width': 10, opacity: 0.8}),
    h('circle', {cx: r(x + w / 2), cy: r(y + 4), r: 7, fill: ctx.theme.accent2, stroke: th.ink, 'stroke-width': 1.8}),
    parts0, parts,
  );
  return {node, box: {x, y, w, h: hh}};
}

/* ------------------------------------------------------------------ */
/* Packing the cards of one zone                                       */
/* ------------------------------------------------------------------ */
/**
 * Pack cards into a zone as a small grid (1…n columns): the fewest columns
 * whose rows fit the zone's height with every text un-truncated. Returns
 * boxes with a gentle seeded jitter (offset + tilt) so they look hand-laid.
 * @param {any} ctx
 * @param {{x:number,y:number,w:number,h:number}} zone
 * @param {Array<{i:number,n:number,text:string}>} items
 * @param {{s:number, maxW:number, minW?:number, gx?:number, gy?:number, kind?:string, tagSize?:number, kindSize?:number, compact?:boolean, jitter?:number, seedKey:string, align?:'center'|'start'|'end', forceCols?:number}} o
 */
export function packZone(ctx, zone, items, o) {
  const n = items.length;
  if (!n) return {cards: [], fits: true, box: null};
  const gx = o.gx ?? o.s * 1.2;
  let gy = o.gy ?? o.s * 1.6;
  let best = null;
  for (let cols = o.forceCols ?? 1; cols <= (o.forceCols ?? n); cols++) {
    const cw = Math.min(o.maxW, (zone.w - (cols - 1) * gx) / cols);
    if (cw < (o.minW ?? o.s * 7) && cols > 1) break;
    const geos = items.map(it => (o.geo ? o.geo(it, cw) : cardGeom(ctx, {text: it.text, n: it.n, w: cw, s: o.s, kind: o.kind, tagSize: o.tagSize, kindSize: o.kindSize, compact: o.compact, maxLines: o.maxLines, tags: o.tags, headK: o.headK, kindRoom: o.kindRoom})));
    // a row must clear the pennant planted on the card below it
    gy = Math.max(o.gy ?? o.s * 1.6, Math.max(...geos.map(q => q.rise || 0)) + 12);
    const rows = Math.ceil(n / cols);
    const rowH = [];
    for (let k = 0; k < rows; k++) rowH.push(Math.max(...geos.slice(k * cols, (k + 1) * cols).map(q => q.h)));
    const total = rowH.reduce((a, b) => a + b, 0) + (rows - 1) * gy;
    const trunc = geos.some(q => q.truncated || q.w < q.minW);
    const cand = {cols, cw, geos, rows, rowH, total, trunc, fits: total <= zone.h + 0.5 && !trunc};
    if (cand.fits) { best = cand; break; }
    if (!best || (!best.fits && (cand.total - zone.h) < (best.total - zone.h))) best = cand;
  }
  const {cols, cw, geos, rowH, total} = best;
  const gridW = Math.min(cols, n) * cw + (Math.min(cols, n) - 1) * gx;
  const x0 = o.align === 'start' ? zone.x : o.align === 'end' ? zone.x + zone.w - gridW : zone.x + (zone.w - gridW) / 2;
  const spareY = Math.max(0, zone.h - total);
  const gyE = best.rows > 1 ? gy + Math.min(spareY / (best.rows - 1), o.s * 2.2) : gy;
  const totalE = rowH.reduce((a, b) => a + b, 0) + (best.rows - 1) * gyE;
  let y = zone.y + Math.max(0, (zone.h - totalE) / 2);
  const jit = o.jitter ?? 1;
  const cards = [];
  for (let k = 0; k < best.rows; k++) {
    const rowItems = items.slice(k * cols, (k + 1) * cols);
    const rowW = rowItems.length * cw + (rowItems.length - 1) * gx;
    const rx0 = x0 + (gridW - rowW) / 2;
    rowItems.forEach((it, j) => {
      const q = geos[k * cols + j];
      const jx = (ctx.rng(`${o.seedKey}-jx`, it.i) - 0.5) * gx * 0.35 * jit;
      const jy = (ctx.rng(`${o.seedKey}-jy`, it.i) - 0.5) * (rowH[k] - q.h + gy * 0.3) * jit;
      const rot = (ctx.rng(`${o.seedKey}-rot`, it.i) - 0.5) * 3.2 * jit;
      const cx = clamp(rx0 + j * (cw + gx) + jx, zone.x, zone.x + zone.w - cw);
      const cy = clamp(y + (rowH[k] - q.h) / 2 + jy, zone.y, zone.y + zone.h - q.h);
      cards.push({...it, geo: q, box: {x: cx, y: cy, w: cw, h: q.h, rot}});
    });
    y += rowH[k] + gyE;
  }
  return {cards, fits: best.fits, cols, cw, total, box: unionBox(cards.map(c => boxBounds(c.box)))};
}

/** Footprint of a placed card for the hull (card + pennant above + half tag below). */
export function cardFootprint(c) {
  const q = c.geo;
  return boxCorners({...c.box, h: c.box.h}, {top: q.head * 0.4, bottom: 2, side: 4});
}

/** Card transform (translate + tilt about the card centre). */
export function cardTransform(b) {
  return b.rot ? `${T(b.x, b.y)} rotate(${r(b.rot, 2)} ${r(b.w / 2)} ${r(b.h / 2)})` : T(b.x, b.y);
}

/** World point of a card-local point. */
export function cardPoint(b, lx, ly) {
  const a = ((b.rot || 0) * Math.PI) / 180;
  const cx = b.w / 2, cy = b.h / 2;
  const dx = lx - cx, dy = ly - cy;
  return {x: b.x + cx + dx * Math.cos(a) - dy * Math.sin(a), y: b.y + cy + dx * Math.sin(a) + dy * Math.cos(a)};
}

/**
 * The cord loop around the covered cards: rounded hull at margin m, opened
 * at the point nearest the tie ring. With nothing covered the cord makes a
 * small closed loop just off the ring (it outlines nothing).
 * @returns {{loop:{x:number,y:number}[], lead:{x:number,y:number}[], all:{x:number,y:number}[], start:{x:number,y:number}}}
 */
export function cordPath(covered, ring, m, o = {}) {
  let hull;
  if (covered.length) hull = roundedHull(covered.flatMap(c => cardFootprint(c)), m);
  else {
    const e = o.emptyAt || {x: ring.x, y: ring.y + m * 1.6};
    hull = roundedHull([e], m * 0.5);
  }
  const loop = loopFrom(hull, ring);
  const start = loop[0];
  const lead = [ring, start];
  return {loop, lead, all: [ring, ...loop], start, hull};
}

/** Parked-prop helper: does a circle (lens) intersect a box? */
export function circleHitsBox(c, rad, b) {
  return distToBox(c, b) < rad;
}

/** A small brass tie post (ring on a base plate) standing on the map; the cord is tied to it. */
export function tiePost(ctx, {name, x, y, rr = 10}) {
  const C = limColors(ctx);
  return g({name},
    h('ellipse', {cx: r(x + 3), cy: r(y + rr * 1.5), rx: r(rr * 1.7), ry: r(rr * 0.7), fill: ctx.theme.shadow}),
    h('rect', {x: r(x - rr * 1.5), y: r(y + rr * 0.6), width: r(rr * 3), height: r(rr * 1.1), rx: r(rr * 0.3), fill: C.brass, stroke: C.brassDark, 'stroke-width': 1.8}),
    h('line', {x1: r(x), y1: r(y + rr * 0.7), x2: r(x), y2: r(y + rr * 0.2), stroke: C.brassDark, 'stroke-width': r(rr * 0.8)}),
    h('circle', {cx: r(x), cy: r(y - rr * 0.5), r: r(rr), fill: 'none', stroke: C.brassDark, 'stroke-width': r(rr * 0.62)}),
    h('circle', {cx: r(x), cy: r(y - rr * 0.5), r: r(rr), fill: 'none', stroke: C.brass, 'stroke-width': r(rr * 0.38)}));
}

/** Survey stake planted beside a card: a staff with a solid (covered) or hollow dashed (not examined) pennant. */
export function stakeArt(ctx, {name, kind, s = 20}) {
  const C = limColors(ctx);
  const solid = kind === 'included';
  return g({name, opacity: 0},
    g({name: `${name}-s`},
      h('ellipse', {cx: 3, cy: 2, rx: r(s * 0.35), ry: r(s * 0.14), fill: ctx.theme.shadow}),
      h('line', {x1: 0, y1: 0, x2: 0, y2: r(-s * 2.3), stroke: C.spoolDark, 'stroke-width': r(Math.max(3, s * 0.16)), 'stroke-linecap': 'round'}),
      h('path', {d: `M0 ${r(-s * 2.3)}L${r(s * 1.3)} ${r(-s * 1.95)}L0 ${r(-s * 1.6)}Z`, fill: solid ? C.cord : ctx.theme.card, stroke: solid ? C.cordDark : C.ring, 'stroke-width': 2, 'stroke-dasharray': solid ? undefined : '4 3', 'stroke-linejoin': 'round'})));
}

/** Axis-aligned box of the pennant planted on a placed card (world coordinates). */
export function flagBox(c) {
  const q = c.geo;
  const pts = [
    cardPoint(c.box, q.w - q.pad * 0.7 - q.head * 0.85, q.head * 0.04),
    cardPoint(c.box, q.w - q.pad * 0.7 + 4, q.head * 0.04),
    cardPoint(c.box, q.w - q.pad * 0.7 - q.head * 0.85, q.head * 0.9),
    cardPoint(c.box, q.w - q.pad * 0.7 + 4, q.head * 0.9),
  ];
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
}

/** Do the pennants of covered cards stay clear of every other card (incl. its tag)? */
export function flagsClear(cards) {
  return cards.filter(c => c.scope === 'included' && !c.geo.compact).every(c => {
    const f = flagBox(c);
    return cards.every(o => o === c || !hit(f, boxBounds(o.box), 0));
  });
}
