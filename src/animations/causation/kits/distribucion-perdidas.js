/**
 * Motif kit for "Distribución ilustrativa de pérdidas" (LAW-0717..0720).
 *
 * A fictional TOTAL (a hypothetical loss, drawn as one long bar resting on a
 * shelf) is divided into SEGMENTS whose lengths follow ONLY the values supplied
 * for each fictional EVENT. Two supplied allocations exist side by side: A
 * ("Proposed allocation", ●) and B ("Alternative allocation", ◆). Neither is
 * preferred, tested, computed or decided; no percentage, share rule, fault or
 * outcome is ever stated. Values are hypothetical and labelled so.
 *
 * Original vector art (front view):
 *  - RAIL + BARRIERS: a top rail with identical metal blades (the barriers);
 *    a blade drops through the bar at each boundary between two segments.
 *  - BAR (the loss): a long bar with a lighter top face, on a wooden shelf.
 *  - CONNECTORS: slim metal guide rails from the shelf down to each tray.
 *  - EVENTS: a row of trays on pedestals, one per event, each with its own
 *    neutral tint and a number disc; a segment comes to rest in its tray.
 *  - ● / ◆ glyphs of identical weight mark allocations A / B.
 *
 * The kit owns geometry, art, text measurement and the shared layout search;
 * each entry owns its timeline, composition and semantics. Text helpers are
 * imported read-only from the earlier causation kits (glue-aware fitting).
 * @module animations/causation/kits/distribucion-perdidas
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, oneOf, list, obj, int, num} from '../../../schemas/fields.js';
import {fitG, chipG, balancedG} from './prueba-contrafactual.js';
import {unwidow, gp, localizeScene, flowRows} from './alcance-dano.js';

export {fitG, chipG, balancedG, unwidow, gp, localizeScene, flowRows};
export {clamp, ease, lerp, r, seg};

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const dpFields = {
  losses: list('The total being divided: the first entry describes the hypothetical total (a placeholder, never a real figure); an optional second entry is a noted detail.', obj('Total', {
    label: str('Description of the hypothetical total', 64),
  }, ['label']), 1, 2),
  events: list('The fictional events the total is divided among, in the supplied order, each with the hypothetical value supplied under allocation A and under allocation B. Segment lengths follow these values only; nothing is computed, weighed or decided.', obj('Event', {
    label: str('Event name (fictional, descriptive)', 56),
    valueA: num('Hypothetical value supplied for this event under allocation A', 1, 999),
    valueB: num('Hypothetical value supplied for this event under allocation B', 1, 999),
  }, ['label', 'valueA', 'valueB']), 2, 4),
  causalLinks: list('Per-connector data. Connector i joins the total to event i. Connectors not listed are a plain relation as supplied.', obj('Link', {
    from: int('Index (0-based) of the event the connector reaches', 0, 3),
    kind: oneOf('relation (default), sequence or causal; a causal link is only named when supplied here', ['relation', 'sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); never resolved', ['proposed', 'disputed']),
    label: str('Optional caption for this connector', 48),
  }, ['from']), 0, 4),
  alternatives: list('Other accounts put forward by someone; drawn with a barrier icon, never decided', obj('Alternative', {
    label: str('Account put forward', 64),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label']), 0, 2),
  unit: str('Word printed after every value, e.g. "hypothetical" (values are never real figures)', 24),
  allocationLabels: obj('Names of the two supplied allocations (equal weight, neither preferred)', {
    a: str('Allocation A (●)', 48),
    b: str('Allocation B (◆)', 48),
  }),
};

export const DP_STRINGS = {
  en: {
    total: 'the whole bar', alsoNoted: 'Also noted', other: 'Put forward', alleged: 'alleged', proposed: 'proposed', disputed: 'disputed',
    link: 'Connector', kindCausal: 'causal (as supplied)', kindSequence: 'sequence (as supplied)', toEvent: 'to event',
    asSupplied: 'as supplied', lengths: 'Segment lengths follow the supplied values only',
    neither: 'Neither allocation is preferred',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    total: 'toda la barra', alsoNoted: 'También consta', other: 'Planteado', alleged: 'alegado', proposed: 'propuesto', disputed: 'discutido',
    link: 'Conector', kindCausal: 'causal (según lo aportado)', kindSequence: 'secuencia (según lo aportado)', toEvent: 'al evento',
    asSupplied: 'según lo aportado', lengths: 'Los segmentos siguen solo los valores aportados',
    neither: 'Ninguna asignación se prefiere',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** Shared English defaults of the fictional content. */
export const DP_DEFAULTS = {
  losses: [{label: 'Total loss (hypothetical)'}],
  events: [
    {label: 'Event 1 (fictional): a pipe leaks', valueA: 40, valueB: 30},
    {label: 'Event 2 (fictional): a shelf gives way', valueA: 35, valueB: 45},
    {label: 'Event 3 (fictional): a door is left open', valueA: 25, valueB: 25},
  ],
  causalLinks: [],
  alternatives: [],
  unit: 'hypothetical',
  allocationLabels: {a: 'Proposed allocation', b: 'Alternative allocation'},
};

/** Shared Spanish versions of the default fictional content. */
export const DP_ES_DEFAULTS = {
  losses: [{label: 'Pérdida total (hipotética)'}],
  events: [
    {label: 'Evento 1 (ficticio): gotea una tubería', valueA: 40, valueB: 30},
    {label: 'Evento 2 (ficticio): cede un estante', valueA: 35, valueB: 45},
    {label: 'Evento 3 (ficticio): queda abierta una puerta', valueA: 25, valueB: 25},
  ],
  unit: 'hipotético',
  allocationLabels: {a: 'Asignación propuesta', b: 'Asignación alternativa'},
};

/* ------------------------------------------------------------------------ */
/* Data                                                                     */
/* ------------------------------------------------------------------------ */

/** A value as supplied (no rounding beyond what was given). */
export const fmtV = v => String(Math.round(v * 100) / 100);
/** "40 (hypothetical)". */
export const valueText = (p, v) => `${fmtV(v)}${' '}(${String(p.unit || '').replace(/ /g, ' ')})`;

/**
 * Normalize the motif data. Each allocation's segment lengths are its supplied values drawn end to end along the same
 * bar (fractions of the bar: f[i] = v[i] / Σv — a drawing scale only, never shown or named).
 */
export function resolveDP(p) {
  const n = p.events.length;
  const vA = p.events.map(e => e.valueA), vB = p.events.map(e => e.valueB);
  const frac = vs => { const s = vs.reduce((a, b) => a + b, 0) || 1; return vs.map(v => v / s); };
  const fA = frac(vA), fB = frac(vB);
  const links = Array.from({length: n}, (_, i) => ({from: i, kind: 'relation', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) if (l.from < n) Object.assign(links[l.from], {kind: l.kind || 'relation', status: l.status || 'proposed', label: l.label || ''});
  const alternatives = (p.alternatives || []).map(a => ({...a, status: a.status || 'alleged'}));
  return {n, vA, vB, fA, fB, links, alternatives, events: p.events};
}

/** Cumulative boundaries of fractions: [0, f0, f0+f1, …, 1]. */
export const cum = f => f.reduce((a, x) => { a.push(a[a.length - 1] + x); return a; }, [0]);

/** Connector notes for connectors that carry supplied data. */
export function linkNotes(ctx, M) {
  const t = ctx.t;
  const out = [];
  M.links.forEach(l => {
    const bits = [l.kind === 'causal' ? t.kindCausal : l.kind === 'sequence' ? t.kindSequence : null, l.status === 'disputed' ? t.disputed : null, l.label || null].filter(Boolean);
    if (!bits.length) return;
    out.push({key: `lk${l.from}`, icon: 'link', disputed: l.status === 'disputed', text: `${t.link} ${t.toEvent} ${l.from + 1}: ${bits.join(' · ')}`});
  });
  return out;
}

/** Band text of an alternative account. */
export const altText = (ctx, a) => `${ctx.t.other}: ${a.label} (${a.status === 'alleged' ? ctx.t.alleged : ctx.t.proposed})`;

/** "● A · Proposed allocation: 40 · 35 · 25 (hypothetical)". */
export function allocText(ctx, p, M, side) {
  const vs = side === 'a' ? M.vA : M.vB;
  return `${side === 'a' ? 'A' : 'B'} · ${p.allocationLabels[side]}: ${vs.map(fmtV).join(' · ')} (${p.unit})`;
}

/* ------------------------------------------------------------------------ */
/* Colours and art                                                          */
/* ------------------------------------------------------------------------ */

const BAR = '#d9b98c', BAR_TOP = '#ecd7b4', BAR_EDGE = '#b8936a';
/** Neutral tint of event i (never red / green as a verdict). */
export const eventTint = (th, i) => [th.accent2Soft, th.accent3Soft, th.accent4Soft, '#e4dcef'][i % 4];
export const eventInk = (th, i) => [th.accent2, '#b07d2e', th.accent4, '#6e5a8a'][i % 4];

/** Solid ● (A) / ◆ (B) glyph of identical weight. */
export function sideMark(ctx, {cx, cy, s, side}) {
  const th = ctx.theme;
  if (side === 'b') return h('path', {d: `M${r(cx)} ${r(cy - s / 2)}L${r(cx + s / 2)} ${r(cy)}L${r(cx)} ${r(cy + s / 2)}L${r(cx - s / 2)} ${r(cy)}Z`, fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
  return h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.42), fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
}

/** A bar piece (segment) of width w and thickness t, local origin = its centre. */
export function pieceArt(ctx, {w, t, name, tint}) {
  const th = ctx.theme;
  const ww = Math.max(3, w);
  const top = Math.min(t * 0.28, ww * 0.4);
  return g({name},
    h('path', {d: roundRectPath(-ww / 2, -t / 2, ww, t, Math.min(5, ww / 4)), fill: tint || BAR, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: `M${r(-ww / 2 + 2)} ${r(-t / 2 + top)}H${r(ww / 2 - 2)}`, stroke: BAR_EDGE, 'stroke-width': 2}),
    h('path', {d: roundRectPath(-ww / 2 + 2, -t / 2 + 2, ww - 4, Math.max(1, top - 2), 3), fill: BAR_TOP, stroke: 'none'}),
  );
}

/** A barrier blade, local origin = its bottom edge centre; height bh, width bw. */
export function bladeArt(ctx, {name, bw, bh}) {
  const th = ctx.theme;
  return g({name},
    h('path', {d: `M0 ${r(-bh)}V${r(-bh - bw * 0.9)}`, stroke: th.ink, 'stroke-width': r(Math.max(3, bw * 0.28)), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-bw / 2)} ${r(-bh)}H${r(bw / 2)}V${r(-bw * 0.4)}L0 0L${r(-bw / 2)} ${r(-bw * 0.4)}Z`, fill: th.metal, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-bw * 0.16)} ${r(-bh + bw * 0.4)}V${r(-bw * 0.7)}`, stroke: th.paper, 'stroke-width': r(Math.max(2, bw * 0.14)), 'stroke-linecap': 'round', opacity: 0.7}),
  );
}

/** Top rail from x0 to x1 at y (thickness t) with two hangers. */
export function railArt(ctx, {name, x0, x1, y, t}) {
  const th = ctx.theme;
  return g({name},
    h('path', {d: `M${r(x0 + t)} ${r(y)}V${r(y - t * 1.6)}M${r(x1 - t)} ${r(y)}V${r(y - t * 1.6)}`, stroke: th.ink, 'stroke-width': r(Math.max(3, t * 0.4))}),
    h('path', {d: roundRectPath(x0, y, x1 - x0, t, t / 2), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
  );
}

/** Shelf (wood) from x0 to x1, top at y, thickness t, with two posts down to floorY. */
export function shelfArt(ctx, {name, x0, x1, y, t, floorY, posts = true}) {
  const th = ctx.theme;
  const pw = Math.max(8, t * 0.8);
  return g({name},
    posts ? h('path', {d: roundRectPath(x0 + t * 0.4, y, pw, floorY - y, 2), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}) : null,
    posts ? h('path', {d: roundRectPath(x1 - t * 0.4 - pw, y, pw, floorY - y, 2), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}) : null,
    h('path', {d: roundRectPath(x0, y, x1 - x0, t, 3), fill: th.wood, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: `M${r(x0 + 3)} ${r(y + t * 0.35)}H${r(x1 - 3)}`, stroke: th.woodTop, 'stroke-width': r(Math.max(2, t * 0.25))}),
  );
}

/** Guide rail (connector) from a to b: an ink edge under a metal core, with end caps. */
export function guideArt(ctx, {name, a, b, w, dashed = false}) {
  const th = ctx.theme;
  const d = `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`;
  return g({name},
    h('path', {d, stroke: th.ink, 'stroke-width': r(w + 4), 'stroke-linecap': 'round'}),
    h('path', {d, stroke: dashed ? th.paper : th.metal, 'stroke-width': r(w), 'stroke-linecap': 'round', 'stroke-dasharray': dashed ? `${r(w * 1.6)} ${r(w * 1.4)}` : null}),
    h('circle', {cx: r(a.x), cy: r(a.y), r: r(w * 0.9), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: r(b.x), cy: r(b.y), r: r(w * 0.9), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
  );
}

/**
 * A tray on a pedestal for event i: local origin = the tray's top-rim centre. tw = width, td = inner depth, ph =
 * pedestal height. Two parts so a piece can sit between them: back (`trayBack`) and front (`trayFront`).
 */
export function trayBack(ctx, {tw, td, ph, i}) {
  const th = ctx.theme;
  const pw = tw * 0.62;
  return g(null,
    h('path', {d: roundRectPath(-pw / 2, td, pw, ph, 4), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(-tw / 2, -td * 0.25, tw, td * 1.25, 5), fill: eventTint(th, i), stroke: th.ink, 'stroke-width': 2.5, opacity: 0.6}),
  );
}
export function trayFront(ctx, {tw, td, ph, i, numText}) {
  const th = ctx.theme;
  // (the number keeps >= 17 px: the disc grows to hold it)
  const fs = Math.max(17, Math.min(ph * 0.34, tw * 0.2) * 1.1);
  const R = fs / 1.1;
  return g(null,
    h('path', {d: `M${r(-tw / 2)} ${r(td * 0.3)}H${r(tw / 2)}V${r(td)}Q${r(tw / 2)} ${r(td + 4)} ${r(tw / 2 - 4)} ${r(td + 4)}H${r(-tw / 2 + 4)}Q${r(-tw / 2)} ${r(td + 4)} ${r(-tw / 2)} ${r(td)}Z`, fill: eventTint(th, i), stroke: th.ink, 'stroke-width': 2.5}),
    h('circle', {cx: 0, cy: r(td + 4 + ph * 0.5), r: r(R), fill: eventInk(th, i), stroke: th.ink, 'stroke-width': 2}),
    numText ? h('text', {x: 0, y: r(td + 4 + ph * 0.5 + R * 0.38), 'text-anchor': 'middle', 'font-size': r(fs), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, numText) : null,
  );
}

/** Floor slab. */
export function floorArt(ctx, {name, x0, x1, floorY, t = 14}) {
  const th = ctx.theme;
  return g({name}, h('rect', {x: r(x0), y: r(floorY), width: r(x1 - x0), height: t, rx: 4, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}));
}

/* ------------------------------------------------------------------------ */
/* Icons for chips                                                          */
/* ------------------------------------------------------------------------ */

/** Icon kinds: bar, tray (it.i), alloc (it.side), alt, link, note, status. */
export function dpIcon(ctx, it, x, cy, s) {
  const th = ctx.theme;
  switch (it.icon) {
    case 'bar': return g({transform: T(x + s / 2, cy)}, pieceArt(ctx, {w: s * 0.95, t: s * 0.36}));
    case 'tray': return g({transform: T(x + s / 2, cy - s * 0.18)},
      h('path', {d: roundRectPath(-s * 0.45, -s * 0.12, s * 0.9, s * 0.32, 4), fill: eventTint(th, it.i), stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: 0, cy: r(s * 0.42), r: r(s * 0.17), fill: eventInk(th, it.i), stroke: th.ink, 'stroke-width': 1.5}));
    case 'alloc': return g(null,
      g({transform: T(x + s / 2, cy + s * 0.2)}, pieceArt(ctx, {w: s * 0.95, t: s * 0.3})),
      h('path', {d: `M${r(x + s * (it.side === 'b' ? 0.36 : 0.56))} ${r(cy + s * 0.02)}V${r(cy + s * 0.38)}`, stroke: th.ink, 'stroke-width': 2.5}),
      sideMark(ctx, {cx: x + s * 0.5, cy: cy - s * 0.24, s: s * 0.4, side: it.side}));
    case 'alt': return g(null,
      h('path', {d: `M${r(x + s * 0.2)} ${r(cy + s * 0.4)}L${r(x + s * 0.3)} ${r(cy - s * 0.05)}M${r(x + s * 0.8)} ${r(cy + s * 0.4)}L${r(x + s * 0.7)} ${r(cy - s * 0.05)}`, stroke: th.ink, 'stroke-width': 3, 'stroke-linecap': 'round'}),
      h('path', {d: roundRectPath(x + s * 0.06, cy - s * 0.32, s * 0.88, s * 0.3, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(x + s * 0.2)} ${r(cy - s * 0.02)}L${r(x + s * 0.34)} ${r(cy - s * 0.32)}M${r(x + s * 0.48)} ${r(cy - s * 0.02)}L${r(x + s * 0.62)} ${r(cy - s * 0.32)}M${r(x + s * 0.76)} ${r(cy - s * 0.02)}L${r(x + s * 0.9)} ${r(cy - s * 0.32)}`, stroke: th.metalDark, 'stroke-width': 3}));
    case 'link': {
      const R = s * 0.4, col = it.disputed ? th.inkSoft : th.accent4, c = x + s / 2;
      return g(null,
        h('circle', {cx: r(c), cy: r(cy), r: r(R), fill: th.card, stroke: col, 'stroke-width': 3, 'stroke-dasharray': it.disputed ? '5 4' : null}),
        h('path', {d: `M${r(c - R * 0.55)} ${r(cy + R * 0.3)}L${r(c + R * 0.55)} ${r(cy - R * 0.3)}`, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round'}));
    }
    case 'note': return g(null,
      h('path', {d: roundRectPath(x + s * 0.16, cy - s * 0.42, s * 0.68, s * 0.84, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(x + s * 0.28)} ${r(cy - s * 0.18)}H${r(x + s * 0.72)}M${r(x + s * 0.28)} ${r(cy)}H${r(x + s * 0.72)}M${r(x + s * 0.28)} ${r(cy + s * 0.18)}H${r(x + s * 0.6)}`, stroke: th.paperLine, 'stroke-width': 3}));
    case 'status': return g(null, [0, 1, 2].map(k => h('path', {d: roundRectPath(x + s * (0.05 + k * 0.32), cy - s * (0.1 + k * 0.1), s * 0.26, s * (0.4 + k * 0.1), 3), fill: eventTint(th, k), stroke: th.ink, 'stroke-width': 1.8})));
    default: return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Chips and flow                                                           */
/* ------------------------------------------------------------------------ */

/** Keep a number with its word and "·" with the word before it (glue-aware fitting). */
export const glueN = text => gp(String(text ?? '').replace(/([\p{L}:]+) (\d+)/gu, '$1 $2').replace(/ · /g, ' · '));

/**
 * Measure an icon chip (icon at the left, fitted text in a rounded box). Measurements are memoized in `memo`.
 * @returns {{w:number,h:number,bad:boolean,lines:number, build:(x:number,y:number,name:string,style?:any)=>{node:any, box:any}}}
 */
export function iconChip(ctx, it, o, memo) {
  const key = `${it.key}|${o.size}|${Math.round(o.maxW)}|${o.maxLines ?? 3}`;
  if (memo && memo.has(key)) return memo.get(key);
  const th = ctx.theme;
  const size = o.size;
  const iconS = it.icon ? size * 1.5 : 0;
  const iw = it.icon ? iconS + 10 : 0;
  const mw = Math.max(size * 4, o.maxW - iw);
  const maxLines = it.maxLines ?? o.maxLines ?? 3;
  const seen = new Map();
  const measureT = t0 => {
    let q = seen.get(t0);
    if (!q) { const w0 = balancedG(ctx, t0, {maxWidth: mw, size, maxLines}); q = {bw: w0, probe: chipG(ctx, t0, {x: 0, y: 0, maxWidth: w0, size, maxLines})}; seen.set(t0, q); }
    return q;
  };
  const text = unwidow(glueN(it.text), t0 => measureT(t0).probe.fit);
  const {bw, probe} = measureT(text);
  const hh = Math.max(probe.box.h, iconS);
  const w = iw + probe.box.w;
  const res = {
    it, w, h: hh, bad: probe.fit.truncated || probe.fit.broken || w > o.maxW + 0.5, lines: probe.fit.lines.length,
    build(x, y, name, style = {}) {
      const c = chipG(ctx, text, {x: x + iw, y: y + (hh - probe.box.h) / 2, maxWidth: bw, size, maxLines, fill: style.fill ?? th.card, stroke: style.stroke ?? th.inkSoft});
      const icon = it.icon ? dpIcon(ctx, it, x, y + hh / 2, iconS) : null;
      return {node: g({name, opacity: style.opacity ?? 0}, icon, c.node), box: {x, y, w, h: hh}};
    },
  };
  if (memo) memo.set(key, res);
  return res;
}

/** Flow chips in a panel of width w; returns {placed, h, bad}. */
export function panelFlow(ctx, items, size, w, memo, {gap = 14, rowGap = 9, center = false, maxLines = 3} = {}) {
  const sz = items.map(it => iconChip(ctx, it, {size, maxW: w, maxLines: it.maxLines ?? maxLines}, memo));
  const fl = flowRows(sz, {x: 0, y: 0, w, gap, rowGap, center});
  return {placed: fl.placed, h: sz.length ? fl.bottom : 0, bad: sz.some(q => q.bad)};
}

/** Largest scale S in [lo, hi] with fits(S) true (fits monotone decreasing in S); lo when none. */
export function maxScale(fits, lo, hi) {
  if (fits(hi)) return hi;
  if (!fits(lo)) return 0;
  for (let i = 0; i < 26; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
  return lo;
}

/**
 * Value chip (the supplied value of one event, e.g. "40 (hypothetical)") centred at x, top y, max width mw.
 * Returns {node, box, bad}. Glued, at most 2 lines.
 */
export function valueChip(ctx, text, {x, y, size, mw, name, stroke}) {
  const th = ctx.theme;
  const o = {x, y, anchor: 'middle', maxWidth: mw, size, minSize: size, maxLines: 2, fill: th.card, stroke: stroke ?? th.ink, name, weight: 700};
  const c = chipG(ctx, text, o);
  return {...c, bad: c.fit.truncated || c.fit.broken};
}

/** Measure a value chip without building (width / height). */
export function valueChipSize(ctx, text, size, mw) {
  const c = chipG(ctx, text, {x: 0, y: 0, maxWidth: mw, size, minSize: size, maxLines: 2, weight: 700});
  return {w: c.box.w, h: c.box.h, bad: c.fit.truncated || c.fit.broken};
}

/* ------------------------------------------------------------------------ */
/* The distribution stage (story / contrast / inspect)                       */
/* ------------------------------------------------------------------------ */

/** Proportions (× S, the bar length). */
export const ST = {t: 0.15, rail: 0.028, bladeH: 0.22, bladeW: 0.045, gapTop: 0.03, shelf: 0.035, drop: 0.22, td: 0.55, ped: 0.13, floor: 14, spread: 0.06, trayGap: 0.05, side: 0.08};

/**
 * Stage geometry for bar length S, n events, the per-event largest fraction (over the allocations this stage can show)
 * `fmax`, the value-chip widths (px; a chip may be wider than its tray: the slots are spaced for both) and the value-chip
 * row height (px, under the floor; 0 = none). `drop` (× S) is the height of the guide-rail zone (>= ST.drop).
 * Origin = stage top-left. Trays fixed; `restX(f)` / `spreadX(f)` give segment centres for a fraction list.
 */
export function stageGeom(S, n, fmax, {chipWs = [], chipH = 0, chipGap = 10, drop, compact = false, stagger = false} = {}) {
  const t = ST.t * S;
  const dropMin = compact ? 0.12 : ST.drop;
  const bladeH = (compact ? 0.17 : ST.bladeH) * S;
  const railY = ST.rail * S * 1.6;
  const bladeTopRest = railY + ST.rail * S;
  const barTop = bladeTopRest + bladeH + ST.gapTop * S;
  const barMid = barTop + t / 2;
  const shelfY = barTop + t;
  const trayTop = shelfY + ST.shelf * S + Math.max(dropMin, drop ?? dropMin) * S;
  const td = ST.td * t;
  const pedH = ST.ped * S;
  const floorY = trayTop + td + 4 + pedH;
  const tws = fmax.map(f => f * S + 0.07 * S);
  const gap = ST.trayGap * S;
  // (staggered value chips alternate between two rows, so a slot only needs about half its chip's width)
  const slot = tws.map((tw, i) => Math.max(tw, ((chipWs[i] ?? 0) + 6) * (stagger ? 0.56 : 1)));
  const rowW = slot.reduce((a, b) => a + b, 0) + gap * (n - 1);
  const spreadW = S + (n - 1) * ST.spread * S;
  const shelfW = spreadW + 2 * ST.side * S;
  // value chips may overhang their slot (staggered rows): the stage box holds them
  const rel = [];
  let x = 0;
  slot.forEach(sw => { rel.push(x + sw / 2); x += sw + gap; });
  const lo = Math.min(0, ...rel.map((c, i) => c - (chipWs[i] ?? 0) / 2 - 2));
  const hi = Math.max(rowW, ...rel.map((c, i) => c + (chipWs[i] ?? 0) / 2 + 2));
  const rowSpan = hi - lo;
  const W = Math.max(rowSpan, shelfW) + 8;
  const cx = W / 2;
  const bx0 = cx - S / 2;
  const rowX0 = cx - rowSpan / 2 - lo;
  const trayX = rel.map(c => rowX0 + c);
  const H = floorY + ST.floor + (chipH ? chipGap + chipH * (stagger ? 2 : 1) + (stagger ? 6 : 0) : 0);
  const restX = f => { const c = cum(f); return f.map((q, i) => bx0 + (c[i] + q / 2) * S); };
  const spreadX = f => restX(f).map((x0, i) => x0 + (i - (n - 1) / 2) * ST.spread * S);
  // blade j sits on boundary j (between segment j and j+1): at rest on the cut, after the spread in the gap's centre
  const cutX = f => cum(f).slice(1, -1).map(c => bx0 + c * S);
  const gapX = f => { const c = cum(f); return c.slice(1, -1).map((cc, j) => bx0 + cc * S + (j + 0.5 - (n - 1) / 2) * ST.spread * S); };
  return {
    S, n, t, W, H, cx, bx0, railY, bladeTopRest, barTop, barMid, shelfY, trayTop, td, pedH, floorY, tws, slot, trayX, gap,
    shelfX0: cx - shelfW / 2, shelfX1: cx + shelfW / 2, rowW, rowX0,
    bladeW: ST.bladeW * S, bladeH,
    bladeRestY: bladeTopRest + bladeH, dropMin, stagger,
    chipRowY: i => floorY + ST.floor + chipGap + (stagger && i % 2 ? chipH + 6 : 0), bladeCutY: barTop + t + 2,
    chipY: floorY + ST.floor + chipGap,
    restX, spreadX, cutX, gapX,
    landY: trayTop + td - t / 2,
  };
}

/** Extra guide-rail height (× S) that makes a stage of scale S exactly fill height bh (capped). */
export const DROP_CAP = 0.55;
export function fillDrop(G, bh, cap = DROP_CAP) {
  return clamp(G.dropMin + (bh - G.H) / G.S, G.dropMin, cap);
}

/** Where segment i is at "drop progress" q (0 = spread on the shelf, 1 = in its tray). */
export function dropPos(G, sx, i, q) {
  const a = {x: sx, y: G.barMid}, b = {x: G.trayX[i], y: G.landY};
  const e = ease.inOutCubic(q);
  // a short lift off the shelf front, then down the guide rail
  return {x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) - Math.sin(Math.PI * Math.min(1, q * 1.6)) * G.t * 0.25 * (1 - q)};
}

/**
 * Build the static stage art (rail, shelf with posts, guides, trays back/front, floor) for geometry G at origin
 * (ox, oy) — names prefixed with P. Pieces and blades are built by the entry (they animate). Returns
 * {back, front, guides} groups to interleave with the pieces.
 */
export function stageArt(ctx, G, {P, ox = 0, oy = 0, f, links, numbers = true}) {
  const th = ctx.theme;
  const sx = G.spreadX(f);
  const gw = Math.max(5, G.S * 0.014);
  const guides = g({name: `${P}guides`}, G.trayX.map((tx, i) => guideArt(ctx, {name: `${P}guide${i}`, a: {x: ox + sx[i], y: oy + G.shelfY + ST.shelf * G.S + 4}, b: {x: ox + tx, y: oy + G.trayTop - 6}, w: gw, dashed: links && links[i] && links[i].status === 'disputed'})));
  const back = g({name: `${P}back`},
    floorArt(ctx, {name: `${P}floor`, x0: ox + Math.min(G.shelfX0, G.rowX0) - 6, x1: ox + Math.max(G.shelfX1, G.rowX0 + G.rowW) + 6, floorY: oy + G.floorY}),
    shelfArt(ctx, {name: `${P}shelf`, x0: ox + G.shelfX0, x1: ox + G.shelfX1, y: oy + G.shelfY, t: ST.shelf * G.S, floorY: oy + G.floorY}),
    railArt(ctx, {name: `${P}rail`, x0: ox + G.shelfX0 + G.S * 0.02, x1: ox + G.shelfX1 - G.S * 0.02, y: oy + G.railY, t: ST.rail * G.S}),
    g({name: `${P}trays`}, G.trayX.map((tx, i) => g({transform: T(ox + tx, oy + G.trayTop)}, trayBack(ctx, {tw: G.tws[i], td: G.td, ph: G.pedH, i})))),
  );
  const front = g({name: `${P}front`}, G.trayX.map((tx, i) => g({name: `${P}tray${i}`, transform: T(ox + tx, oy + G.trayTop)}, trayFront(ctx, {tw: G.tws[i], td: G.td, ph: G.pedH, i, numText: numbers && ctx.show('key') ? String(i + 1) : null}))));
  return {back, front, guides};
}

/* ------------------------------------------------------------------------ */
/* Shared layout search: one stage + one chip panel                          */
/* ------------------------------------------------------------------------ */

/**
 * Choose the text size, arrangement and stage scale S that make the stage largest while every chip fits.
 * o.items: panel chip items; o.stage(size) → {dims(S) → {w, h}, ok?: boolean} (stage size in px for scale S at that
 * text size); o.modes: subset of ['side', 'below', 'above']; o.sizes [max, min]; o.sMax upper bound of S.
 * Returns {size, mode, S, pw, panel, stage} or null. Memoized chip measurements in o.memo.
 */
export function arrangeScene(ctx, o) {
  const D = ctx.design;
  const M = 10, GAP = o.gap ?? 26;
  const full = D.w - 2 * M, fullH = D.h - 2 * M;
  const cands = [];
  for (let size = o.sizes[0]; size >= o.sizes[1] - 1e-9; size -= 1) {
    const sts = [].concat(o.stage(size) || []).filter(q => !q.bad);
    let best = null;
    for (const st of sts) for (const mode of o.modes) {
      const pws = mode === 'side' ? (o.sideWs ?? [0.3, 0.36, 0.42, 0.5]).map(f => Math.round(full * f)) : [full];
      for (const pw of pws) {
        const panel = o.items.length ? panelFlow(ctx, o.items, size, pw, o.memo, {center: mode !== 'side', maxLines: mode === 'side' ? 4 : 3}) : {placed: [], h: 0, bad: false};
        if (panel.bad) continue;
        let bw, bh;
        if (mode === 'side') { if (panel.h > fullH) continue; bw = full - pw - GAP; bh = fullH; } else { bw = full; bh = fullH - (panel.h ? panel.h + GAP : 0); }
        if (bw < 100 || bh < 100) continue;
        const S = maxScale(s => { const d = st.dims(s); return d.w <= bw && d.h <= bh; }, 40, o.sMax ?? 2000);
        if (!S) continue;
        // (score: the stage's scale, with a bonus for using the box's height once the rail zone grows — st.dimsMax)
        const hMax = st.dimsMax ? Math.min(bh, st.dimsMax(S).h) : st.dims(S).h;
        const used = mode === 'side' ? Math.max(hMax, panel.h) / fullH : (hMax + (panel.h ? panel.h + GAP : 0)) / fullH;
        const score = S * (0.7 + 0.3 * Math.min(1, used));
        if (!best || score > best.score + 1e-6) best = {size, mode, S, pw, panel, bw, bh, st, score};
      }
    }
    if (best) cands.push(best);
  }
  if (!cands.length) return null;
  // text at >= 20 (the 19.5 px baseline floor) whenever any arrangement allows it; then the largest text whose stage
  // stays >= keep of the largest stage found
  const c20 = cands.filter(c => c.size >= 20 - 1e-9);
  const pool = c20.length && Math.max(...c20.map(c => c.score)) >= (o.keep20 ?? 0.7) * Math.max(...cands.map(c => c.score)) ? c20 : cands;
  const Sbest = Math.max(...pool.map(c => c.score));
  const keep = o.keep ?? 0.88;
  const ok = pool.filter(c => c.score >= keep * Sbest - 1e-6);
  return ok.sort((a, b) => b.size - a.size)[0];
}

/** Place the measured panel chips at (x, y) (flowRows result offset), returning [{key, when, node, box}]. */
export function placePanel(ctx, panel, x, y, styleOf = () => ({})) {
  return panel.placed.map(pl => {
    const it = pl.it.it;
    const b = pl.it.build(x + pl.x, y + pl.y, `band-${it.key}`, styleOf(it));
    return {key: it.key, when: it.when, node: b.node, box: b.box};
  });
}
