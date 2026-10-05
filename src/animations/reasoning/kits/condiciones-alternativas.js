/**
 * Kit for the "Condiciones alternativas" motif (LAW-0101..0104): field set,
 * strings, geometry and original vector parts. Each entry owns its own
 * timeline, composition and semantics; this file only measures and draws.
 *
 * Physical metaphor — a PNEUMATIC-TUBE system with two independent inlets
 * that end in one receiving tray (the same point of analysis):
 *  - RULE (regla)        an enamel plaque in a wooden frame printing the rule
 *                        caption as supplied (illustrative text).
 *  - ROUTES              one brass inlet per alternative condition (Route A,
 *                        Route B), each with a brass condition plate (the
 *                        condition as supplied) and its own glass tube.
 *  - FACT (hecho)        a paper fact card per route (the fact as supplied and
 *                        its SUPPLIED status) and the capsule that carries it:
 *                        supplied → the capsule is sent and arrives;
 *                        pending  → no capsule is sent on that route;
 *                        disputed → the capsule is stopped at the route's
 *                        check gate ('?'), not resolved here.
 *  - CONNECTOR (conector) a brass SHUTTLE VALVE — the physical "either" part:
 *                        pressure from either inlet pushes its ball against
 *                        the other inlet's seat and opens the one outlet, so
 *                        each route alone can reach the tray.
 *  - LUPA                a magnifier at the receiving tray (the point of
 *                        analysis) whose glass shows a real enlarged copy.
 * Reaching the tray only means the route delivered its capsule to the point
 * of analysis. Nothing here decides whether a condition is met in law, whether
 * the rule applies or what the outcome is. Texts are fictional, jurisdiction
 * unspecified; every state is shown as supplied.
 * @module animations/reasoning/kits/condiciones-alternativas
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, lerp, r} from '../../../core/time.js';
import {roundRectPath, polyline} from '../../../core/geometry.js';
import {str, oneOf, list, obj} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';

export const ROUTES = ['A', 'B'];
export const STATUSES = ['supplied', 'pending', 'disputed'];
const DEG = Math.PI / 180;
const INK = '#1f2328';

/* ------------------------------------------------------------------ */
/* Strings (built-in labels; user content is never translated)         */
/* ------------------------------------------------------------------ */
export const AC_STRINGS = {
  en: {
    ruleKind: 'Rule · illustrative text',
    route: 'Route',
    conditionKind: 'Route {k} · condition as supplied',
    factKind: 'Fact {k}',
    supplied: 'Supplied',
    pending: 'Pending',
    disputed: 'Disputed',
    statusSupplied: 'Supplied · sent',
    statusPending: 'Pending · not sent',
    statusDisputed: 'Disputed · stopped at gate',
    junction: 'Junction · either route',
    point: 'Point of analysis',
    reachedBoth: 'Point of analysis reached by Route A and by Route B (as supplied)',
    reachedOne: 'Point of analysis reached by Route {k} (as supplied)',
    reachedNone: 'No supplied route has reached the point of analysis',
    heldAt: 'Route {k} stopped at its gate · disputed, not resolved here',
    awaiting: 'Nothing sent yet (as supplied)',
    issue: 'Issue',
    assumed: 'Assumed',
    noConclusion: 'As supplied · no conclusion drawn',
    notSent: 'not sent',
  },
  es: {
    ruleKind: 'Regla · texto ilustrativo',
    route: 'Ruta',
    conditionKind: 'Ruta {k} · condición según lo aportado',
    factKind: 'Hecho {k}',
    supplied: 'Aportado',
    pending: 'Pendiente',
    disputed: 'Discutido',
    statusSupplied: 'Aportado · enviado',
    statusPending: 'Pendiente · sin enviar',
    statusDisputed: 'Discutido · detenido en la compuerta',
    junction: 'Unión · cualquiera de las rutas',
    point: 'Punto de análisis',
    reachedBoth: 'Punto de análisis alcanzado por la ruta A y por la ruta B (según lo aportado)',
    reachedOne: 'Punto de análisis alcanzado por la ruta {k} (según lo aportado)',
    reachedNone: 'Ninguna ruta aportada ha llegado al punto de análisis',
    heldAt: 'Ruta {k} detenida en su compuerta · discutido, no se resuelve aquí',
    awaiting: 'Aún no se ha enviado nada (según lo aportado)',
    issue: 'Cuestión',
    assumed: 'Supuesto',
    noConclusion: 'Según lo aportado · sin conclusión',
    notSent: 'sin enviar',
  },
};

/** Fill a "{k}" placeholder. */
export const fill = (s, k) => String(s).replace('{k}', String(k));

/* ------------------------------------------------------------------ */
/* Category field set (reasoning): facts, rules, issues, assumptions   */
/* ------------------------------------------------------------------ */
export const factField = obj('Fact carried by the route at the same position (fictional, as supplied)', {
  label: str('Fact as supplied (fictional; printed on the route’s fact card)', 110),
  status: oneOf('Status SUPPLIED by the author: supplied (its capsule is sent and reaches the tray) | pending (nothing is sent on this route) | disputed (the capsule is stopped at the route’s gate; not resolved here)', STATUSES),
}, ['label', 'status']);

export const acFields = {
  rules: obj('The rule as supplied: its caption and its two ALTERNATIVE conditions (Route A, Route B). Illustrative text, never a statement of any law', {
    name: str('Rule caption printed on the plaque (fictional)', 120),
    conditions: list('Alternative conditions, one per route (A then B); each labels an inlet', str('Condition', 90), 2, 2),
  }, ['name', 'conditions']),
  facts: list('Facts in route order (A then B), each with its supplied status', factField, 2, 2),
  issues: list('Question framed by the author, shown as a note (never answered by the animation)', str('Issue', 110), 0, 1),
  assumptions: list('Working assumptions supplied by the author, shown in the footnote (not verified)', str('Assumption', 110), 0, 2),
};

/** Fictional default content shared by the four entries. */
export const AC_DEFAULTS = {
  rules: {
    name: 'Rule G-2 (fictional club rule): a guest-pass request may come by either of two routes',
    conditions: ['The guest is invited in writing by a member', 'The guest shows a partner-club card'],
  },
  facts: [
    {label: 'Invitation note signed by member J. Park on Day 3', status: 'supplied'},
    {label: 'Partner-club card no. 0417 shown at the door', status: 'supplied'},
  ],
  issues: ['Is card no. 0417 still current? (not examined here)'],
  assumptions: ['Each route is read on its own; facts are taken as supplied'],
};

/**
 * Resolve the two routes. `override` replaces statuses by route key.
 * @param {{rules:{name:string,conditions:string[]}, facts:Array<{label:string,status:string}>}} p
 * @param {Record<string,string>} [override]
 */
export function resolveRoutes(p, override = {}) {
  const routes = ROUTES.map((key, i) => {
    const f = p.facts[i] || {label: '', status: 'pending'};
    const status = override[key] ?? f.status;
    return {key, i, condition: p.rules.conditions[i] ?? '', fact: f.label, status};
  });
  return {
    routes,
    sent: routes.filter(q => q.status !== 'pending').map(q => q.key),
    reached: routes.filter(q => q.status === 'supplied').map(q => q.key),
    held: routes.filter(q => q.status === 'disputed').map(q => q.key),
    pending: routes.filter(q => q.status === 'pending').map(q => q.key),
  };
}

/** Descriptive state line for the final hold (no legal conclusion). */
export function stateLine(t, res) {
  if (res.reached.length === 2) return t.reachedBoth;
  if (res.reached.length === 1) return fill(t.reachedOne, res.reached[0]);
  if (res.held.length) return fill(t.heldAt, res.held.join(' · '));
  return t.reachedNone;
}

export function statusTokens(t, status) {
  return statusText(t, status).split(' · ');
}

export function statusText(t, status) {
  return status === 'supplied' ? t.statusSupplied : status === 'pending' ? t.statusPending : t.statusDisputed;
}

/* ------------------------------------------------------------------ */
/* Colours and scale                                                   */
/* ------------------------------------------------------------------ */
export function acColors(ctx) {
  const th = ctx.theme;
  return {
    A: th.accent2,
    B: th.accent3,
    route: key => (key === 'A' ? th.accent2 : th.accent3),
    brass: '#d9b765',
    brassDark: '#9c7b33',
    brassLight: '#f0dca0',
    glass: '#e2eef2',
    glassEdge: '#9fb6bf',
    metal: '#c7d0d7',
    metalDark: '#6d7a85',
    wall: th.dark ? '#3a3e44' : '#efe9dc',
    wallLine: th.dark ? '#4a4f56' : '#e2dac9',
    floor: th.dark ? '#2e3136' : '#d9cfbd',
    felt: '#4f6f5f',
    wood: th.wood,
    woodDark: th.woodDark,
    enamel: '#fbf7ee',
    paper: th.paper,
    ink: th.ink,
  };
}

/** Design units per output pixel at the 1080p reference frame. */
export function unitsPerPx(ctx) {
  const v = ctx.view, c = v.content, D = ctx.design;
  return 1 / (Math.min(c.w / D.w, c.h / D.h) * (1080 / Math.min(v.width, v.height)));
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/**
 * Dense polyline through waypoints with rounded corners (fillets of radius
 * `rad`, clamped to half of each adjacent segment). Pure; deterministic.
 * @param {Array<{x:number,y:number}>} pts
 * @param {number} rad
 */
export function filletPoints(pts, rad = 60, step = 8) {
  if (pts.length < 3) return densify(pts, step);
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const la = Math.hypot(b.x - a.x, b.y - a.y), lc = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, la / 2, lc / 2);
    const p0 = {x: b.x + ((a.x - b.x) / la) * rr, y: b.y + ((a.y - b.y) / la) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / lc) * rr, y: b.y + ((c.y - b.y) / lc) * rr};
    out.push(p0);
    const n = 10;
    for (let k = 1; k < n; k++) {
      const t = k / n, u = 1 - t;
      out.push({x: u * u * p0.x + 2 * u * t * b.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * b.y + t * t * p2.y});
    }
    out.push(p2);
  }
  out.push(pts[pts.length - 1]);
  return densify(out, step);
}

function densify(pts, step) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 1; k <= n; k++) out.push({x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n});
  }
  return out;
}

/** Arc-length position (0..total) of the polyline point nearest to q. */
export function arcAt(poly, q) {
  let best = Infinity, at = 0, acc = 0;
  for (let i = 1; i < poly.pts.length; i++) {
    const a = poly.pts[i - 1], b = poly.pts[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const d = Math.hypot(b.x - q.x, b.y - q.y);
    acc += L;
    if (d < best) { best = d; at = acc; }
  }
  return at;
}

/** Rotate a local point by deg and translate. */
export function place(o, q) {
  const a = (o.rot || 0) * DEG;
  const s = o.s ?? 1;
  return {x: o.x + (q.x * Math.cos(a) - q.y * Math.sin(a)) * s, y: o.y + (q.x * Math.sin(a) + q.y * Math.cos(a)) * s};
}

export const boxOf = (x, y, w, hh) => ({x, y, w, h: hh});
export const hitBox = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
export const unionBox = list => {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
};

/* ------------------------------------------------------------------ */
/* Text helpers                                                        */
/* ------------------------------------------------------------------ */

/** Fit text at a fixed size (no shrink, no ellipsis for the field lengths used here). */
export function fitFixed(ctx, text, width, size, o = {}) {
  return ctx.fit(text, {maxWidth: width, size, minSize: size, maxLines: o.maxLines ?? 14, weight: o.weight ?? 500, family: o.family ?? 'sans', leading: o.leading});
}

/**
 * fitFixed() without a lone last word: when the last line would hold a single word, the text is refitted at
 * slightly narrower widths (same number of lines) so at least two words share the last line. Opt-in.
 */
export function fitBalanced(ctx, text, width, size, o = {}) {
  const base = fitFixed(ctx, text, width, size, o);
  const lone = f => f.lines.length > 1 && !/\s/.test(String(f.lines[f.lines.length - 1]).trim());
  if (!lone(base)) return base;
  for (let k = 0.97; k >= 0.6; k -= 0.03) {
    const f = fitFixed(ctx, text, width * k, size, o);
    if (f.lines.length > base.lines.length || f.truncated) break;
    if (!lone(f)) return {...f, width: f.width};
  }
  return base;
}

/**
 * Fit a list of tokens (e.g. ['Fact A', 'Supplied', 'sent']) joined by ' · ',
 * breaking lines only BETWEEN tokens (so no token and no single word is
 * orphaned); a token wider than the line falls back to word wrapping.
 * Same result shape as fitFixed().
 */
export function fitTokens(ctx, tokens, width, size, o = {}) {
  const weight = o.weight ?? 700, family = o.family ?? 'sans', sep = o.sep ?? ' · ';
  const lines = [];
  let cur = '';
  for (const tk of tokens.filter(Boolean)) {
    const cand = cur ? `${cur}${sep}${tk}` : tk;
    if (!cur || ctx.measure(cand, size, weight, family) <= width) { cur = cand; continue; }
    lines.push(cur);
    cur = tk;
  }
  if (cur) lines.push(cur);
  const out = [];
  for (const ln of lines) {
    if (ctx.measure(ln, size, weight, family) <= width) out.push(ln);
    else out.push(...fitFixed(ctx, ln, width, size, {weight, family}).lines);
  }
  const lineHeight = size * 1.18;
  return {lines: out, size, lineHeight, width: Math.max(...out.map(l => ctx.measure(l, size, weight, family))), height: lineHeight * (out.length - 1) + size, truncated: false, full: tokens.join(sep), weight, family};
}

/** Width of the longest single word (so boxes never force a mid-word break). */
export function longestWord(ctx, text, size, weight = 500, family = 'sans') {
  return Math.max(0, ...String(text).split(/\s+/).filter(Boolean).map(w => ctx.measure(w, size, weight, family)));
}

/** Placeholder bars standing in for text when labels are hidden (x, y = top). */
export function barLines(x, y, w, n, size, color, anchor = 'start') {
  const out = [];
  for (let k = 0; k < n; k++) {
    const lw = n > 1 && k === n - 1 ? w * 0.6 : w;
    const bx = anchor === 'middle' ? x - lw / 2 : x;
    out.push(h('rect', {x: r(bx), y: r(y + k * size * 1.18 + size * 0.22), width: r(lw), height: r(size * 0.44), rx: r(size * 0.22), fill: color}));
  }
  return out;
}

/**
 * Measured "panel": optional small-caps header + body text + optional status
 * pill, inside a padded rectangle of width w. Returns the height and a draw
 * function so layouts can measure before placing. With labels hidden the same
 * geometry is drawn with neutral bars.
 * @param {any} ctx
 * @param {{w:number, head?:string, headSize:number, body:string, size:number, family?:'sans'|'serif', weight?:number, pill?:{text:string, status:string, color:string}|null, pillSize?:number, show:boolean, pad?:number}} o
 */
export function panel(ctx, o) {
  const pad = o.pad ?? o.size * 0.62;
  const inner = o.w - 2 * pad;
  const head = o.head ? fitFixed(ctx, o.head, inner, o.headSize, {weight: 700, maxLines: 3}) : null;
  // opt-in: balance keeps a lone word off the body's last line
  const body = (o.balance ? fitBalanced : fitFixed)(ctx, o.body || ' ', inner, o.size, {weight: o.weight ?? 600, family: o.family ?? 'sans', maxLines: 14});
  const ps = o.pillSize ?? o.headSize;
  // opt-in: pill.tokens wraps between tokens only (no orphaned word)
  const pill = o.pill ? (o.pill.tokens ? fitTokens(ctx, o.pill.tokens, inner - ps * 2.2, ps) : fitFixed(ctx, o.pill.text, inner - ps * 2.2, ps, {weight: 700, maxLines: 5})) : null;
  const headH = head ? head.height + o.headSize * 0.45 : 0;
  const pillH = pill ? pill.height + ps * 0.7 + ps * 0.55 : 0;
  const hh = pad + headH + body.height + pillH + pad * 0.9;
  return {
    h: hh, w: o.w, head, body, pill, pad,
    /**
     * @param {number} x
     * @param {number} y
     * @param {{fill:string, stroke:string, headColor:string, color:string, radius?:number, name?:string, deco?:any, accent?:string}} st
     */
    draw(x, y, st) {
      const parts = [];
      parts.push(h('path', {d: roundRectPath(x + 5, y + 7, o.w, hh, st.radius ?? 10), fill: 'rgba(31,35,40,0.13)'}));
      parts.push(h('path', {d: roundRectPath(x, y, o.w, hh, st.radius ?? 10), fill: st.fill, stroke: st.stroke, 'stroke-width': 2.4}));
      if (st.accent) parts.push(h('path', {d: roundRectPath(x, y, 12, hh, Math.min(6, st.radius ?? 10)), fill: st.accent}));
      if (st.deco) parts.push(st.deco);
      let cy = y + pad;
      const tx = x + pad + (st.accent ? 4 : 0);
      if (head) {
        parts.push(o.show ? textBlock(head, {x: tx, y: cy, fill: st.headColor, letterSpacing: 0.3}) : g(null, barLines(tx, cy, Math.min(inner * 0.5, head.width), head.lines.length, o.headSize, shade(st.fill, -0.18))));
        cy += headH;
      }
      parts.push(o.show ? textBlock(body, {x: tx, y: cy, fill: st.color, name: st.name ? `${st.name}-body` : undefined}) : g(null, barLines(tx, cy, Math.min(inner, body.width), body.lines.length, o.size, shade(st.fill, -0.24))));
      cy += body.height;
      if (pill) {
        cy += ps * 0.55;
        const pw = pill.width + ps * 2.2, ph = pill.height + ps * 0.7;
        parts.push(statusPill(ctx, {x: tx, y: cy, w: pw, h: ph, status: o.pill.status, color: o.pill.color, size: ps, fit: pill, show: o.show, name: st.name ? `${st.name}-pill` : undefined}));
      }
      return g({name: st.name}, parts);
    },
  };
}

/** Status pill: neutral glyph (filled dot = supplied, hollow dashed ring = pending, half disc = disputed) + text. */
export function statusPill(ctx, o) {
  const s = o.size;
  const cx = o.x + s * 0.85, cy = o.y + o.h / 2;
  const col = o.color;
  const glyph = o.status === 'supplied'
    ? h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.3), fill: col})
    : o.status === 'pending'
      ? h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.28), fill: 'none', stroke: col, 'stroke-width': 2.4, 'stroke-dasharray': '3 3'})
      : g(null, h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.3), fill: 'none', stroke: col, 'stroke-width': 2.4}), h('path', {d: `M${r(cx)} ${r(cy - s * 0.3)}A${r(s * 0.3)} ${r(s * 0.3)} 0 0 1 ${r(cx)} ${r(cy + s * 0.3)}Z`, fill: col}));
  return g({name: o.name},
    h('rect', {x: r(o.x), y: r(o.y), width: r(o.w), height: r(o.h), rx: r(Math.min(o.h / 2, s * 0.9)), fill: '#ffffff', stroke: col, 'stroke-width': 2, 'stroke-dasharray': o.status === 'pending' ? '6 4' : undefined}),
    glyph,
    o.show ? textBlock(o.fit, {x: o.x + s * 1.55, y: o.y + s * 0.35, fill: INK}) : g(null, barLines(o.x + s * 1.55, o.y + s * 0.35, Math.min(o.fit.width, s * 5), o.fit.lines.length, s, '#c9c2b4')),
  );
}

/* ------------------------------------------------------------------ */
/* Tubes and capsules                                                  */
/* ------------------------------------------------------------------ */

/**
 * Glass tube along a dense polyline. `back` goes under the capsules, `front`
 * (glass sheen + brass couplings in the route colour) above them.
 */
export function tubeArt(ctx, name, pts, o) {
  const c = acColors(ctx);
  const poly = polyline(pts);
  const d = poly.d(1);
  const tw = o.width;
  const couplings = [];
  const every = o.every ?? 170;
  const n = Math.max(1, Math.floor(poly.total / every));
  for (let k = 1; k <= n; k++) {
    const at = poly.at(clamp((k - 0.5) / n, 0.04, 0.96));
    if (o.skip && o.skip(at)) continue;
    couplings.push(g({transform: T(at.x, at.y, (at.a * 180) / Math.PI)},
      h('rect', {x: -7, y: r(-tw / 2 - 5), width: 14, height: r(tw + 10), rx: 3, fill: o.color, stroke: INK, 'stroke-width': 2})));
  }
  const back = g({name: `${name}-back`},
    h('path', {d, fill: 'none', stroke: INK, 'stroke-width': r(tw + 5), 'stroke-linecap': 'butt', 'stroke-linejoin': 'round'}),
    h('path', {d, fill: 'none', stroke: c.glass, 'stroke-width': r(tw), 'stroke-linecap': 'butt', 'stroke-linejoin': 'round'}),
    h('path', {d, fill: 'none', stroke: shade(c.glass, -0.08), 'stroke-width': r(tw * 0.35), 'stroke-linecap': 'butt', 'stroke-linejoin': 'round', opacity: 0.8}),
  );
  const front = g({name: `${name}-front`},
    h('path', {d, fill: 'none', stroke: '#cfe3ea', 'stroke-width': r(tw), 'stroke-linejoin': 'round', opacity: 0.28}),
    h('path', {d, fill: 'none', stroke: '#ffffff', 'stroke-width': r(Math.max(2.5, tw * 0.16)), 'stroke-linejoin': 'round', opacity: 0.55, transform: `translate(0 ${r(-tw * 0.22)})`}),
    couplings,
  );
  return {back, front, poly, d};
}

/**
 * Capsule (carrier of a fact): metal cylinder with the route's band(s)
 * (A: one band, B: two bands — readable without colour or text).
 * Local origin at the centre, long axis along +x.
 */
export function capsuleArt(ctx, name, o) {
  const c = acColors(ctx);
  const L = o.len, R = o.rad;
  const bands = o.key === 'B' ? [-L * 0.2, -L * 0.04] : [-L * 0.12];
  return g({name, opacity: o.opacity},
    h('rect', {x: r(-L / 2), y: r(-R), width: r(L), height: r(2 * R), rx: r(R), fill: c.metal, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: r(-L / 2 + R * 0.5), y: r(-R * 0.62), width: r(L - R), height: r(R * 0.36), rx: r(R * 0.18), fill: '#ffffff', opacity: 0.55}),
    bands.map(bx => h('rect', {x: r(bx), y: r(-R), width: r(L * 0.1), height: r(2 * R), fill: o.color, stroke: INK, 'stroke-width': 1.6})),
    h('path', {d: `M${r(L / 2 - R * 0.9)} ${r(-R)}V${r(R)}`, stroke: c.metalDark, 'stroke-width': 2}),
    h('path', {d: `M${r(-L / 2 + R * 0.9)} ${r(-R)}V${r(R)}`, stroke: c.metalDark, 'stroke-width': 2}),
  );
}

/**
 * Brass inlet bell at the start of a tube. Local frame: the tube leaves along
 * +x from the origin; the bell opens towards −x. `mouth` is the bell opening
 * (where a capsule is handed in). The lid is hinged at the opening's top.
 */
export function inletArt(ctx, name, o) {
  const c = acColors(ctx);
  const tw = o.tube;
  const r1 = tw / 2 + 4, r2 = tw / 2 + 15, Lb = tw * 1.35 + 10;
  const rot = o.rot || 0;
  const flip = o.flip ? -1 : 1; // lid hinge side (keeps the hinge on top in world space)
  const bell = `M0 ${r(-r1)}C${r(-Lb * 0.4)} ${r(-r1)} ${r(-Lb * 0.62)} ${r(-r2)} ${r(-Lb)} ${r(-r2)}L${r(-Lb)} ${r(r2)}C${r(-Lb * 0.62)} ${r(r2)} ${r(-Lb * 0.4)} ${r(r1)} 0 ${r(r1)}Z`;
  const hinge = {x: -Lb, y: -r2 * flip};
  const node = g({transform: T(o.x, o.y, rot)},
    h('rect', {x: r(-Lb * 0.78), y: r(-r2 - 7), width: r(Lb * 0.62), height: r(2 * r2 + 14), rx: 5, fill: c.metalDark, stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(-Lb * 0.47), cy: r(-r2 - 1), r: 3, fill: '#e8ecef'}),
    h('circle', {cx: r(-Lb * 0.47), cy: r(r2 + 1), r: 3, fill: '#e8ecef'}),
    h('path', {d: bell, fill: c.brass, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-Lb * 0.35)} ${r(-r1 - 2)}C${r(-Lb * 0.55)} ${r(-r1 - 4)} ${r(-Lb * 0.7)} ${r(-r2 + 3)} ${r(-Lb + 4)} ${r(-r2 + 4)}`, fill: 'none', stroke: c.brassLight, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('ellipse', {cx: r(-Lb), cy: 0, rx: r(tw * 0.2), ry: r(r2 - 3), fill: '#3b3326', stroke: INK, 'stroke-width': 2}),
    h('rect', {x: -4, y: r(-r1 - 3), width: 8, height: r(2 * r1 + 6), rx: 2, fill: o.color, stroke: INK, 'stroke-width': 1.8}),
    g({name: `${name}-lid`, transform: `rotate(0 ${r(hinge.x)} ${r(hinge.y)})`},
      h('rect', {x: r(-Lb - 7), y: r(-r2 - 1), width: 9, height: r(2 * r2 + 2), rx: 4, fill: shade(c.brass, -0.12), stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: r(-Lb - 7), cy: 0, r: 4, fill: c.brassDark, stroke: INK, 'stroke-width': 1.5})),
    h('circle', {cx: r(hinge.x), cy: r(hinge.y), r: 4.5, fill: c.metalDark, stroke: INK, 'stroke-width': 1.5}),
  );
  const mouth = place({x: o.x, y: o.y, rot}, {x: -Lb, y: 0});
  const hingeW = place({x: o.x, y: o.y, rot}, hinge);
  return {
    node,
    mouth,
    len: Lb,
    radius: r2,
    box: {x: Math.min(o.x, mouth.x) - r2 - 10, y: Math.min(o.y, mouth.y) - r2 - 24, w: Math.abs(o.x - mouth.x) + 2 * r2 + 20, h: Math.abs(o.y - mouth.y) + 2 * r2 + 34},
    /** @param {number} open 0 closed → 1 open */
    frame: open => ({[`${name}-lid`]: {transform: `rotate(${r(-100 * flip * clamp(open))} ${r(hinge.x)} ${r(hinge.y)})`}}),
    hinge: hingeW,
  };
}

/**
 * Shuttle valve — the junction (connector). Local frame: chamber along x,
 * inlet ports at x = ±(Lv + stub), outlet at (0, +out). `ball` in [-1, 1]:
 * −1 = against the A seat (A side closed), +1 = against the B seat.
 */
export function valveArt(ctx, name, o) {
  const c = acColors(ctx);
  const s = o.size; // chamber half-height
  const Lv = s * 2.3, stub = s * 0.9, out = s * 2.1;
  const rot = o.rot || 0;
  const fx = o.flipX ? -1 : 1;
  const P = q => place({x: o.x, y: o.y, rot}, {x: q.x * fx, y: q.y});
  const ballR = s * 0.62;
  const travel = Lv - s * 0.95;
  const body = `M${r(-Lv)} ${r(-s * 1.15)}H${r(Lv)}Q${r(Lv + s * 0.5)} ${r(-s * 1.15)} ${r(Lv + s * 0.5)} ${r(-s * 0.6)}V${r(s * 0.6)}Q${r(Lv + s * 0.5)} ${r(s * 1.15)} ${r(Lv)} ${r(s * 1.15)}H${r(s * 0.9)}V${r(s * 1.5)}H${r(-s * 0.9)}V${r(s * 1.15)}H${r(-Lv)}Q${r(-Lv - s * 0.5)} ${r(s * 1.15)} ${r(-Lv - s * 0.5)} ${r(s * 0.6)}V${r(-s * 0.6)}Q${r(-Lv - s * 0.5)} ${r(-s * 1.15)} ${r(-Lv)} ${r(-s * 1.15)}Z`;
  const node = g({name, transform: `${T(o.x, o.y, rot)}${fx < 0 ? ' scale(-1 1)' : ''}`},
    h('path', {d: body, fill: c.brass, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-Lv + 6)} ${r(-s * 0.95)}H${r(Lv - 6)}`, stroke: c.brassLight, 'stroke-width': 4, 'stroke-linecap': 'round'}),
    // flanges on both inlets and the outlet
    h('rect', {x: r(-Lv - s * 0.62), y: r(-s * 0.95), width: r(s * 0.3), height: r(s * 1.9), rx: 3, fill: o.colorA, stroke: INK, 'stroke-width': 2}),
    h('rect', {x: r(Lv + s * 0.32), y: r(-s * 0.95), width: r(s * 0.3), height: r(s * 1.9), rx: 3, fill: o.colorB, stroke: INK, 'stroke-width': 2}),
    h('rect', {x: r(-s * 1.05), y: r(s * 1.42), width: r(s * 2.1), height: r(s * 0.3), rx: 3, fill: c.brassDark, stroke: INK, 'stroke-width': 2}),
    // cut-away window with the two seats and the shuttle ball
    h('rect', {x: r(-Lv + s * 0.2), y: r(-s * 0.72), width: r(2 * Lv - s * 0.4), height: r(s * 1.44), rx: r(s * 0.5), fill: '#2e3a40', stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${r(-Lv + s * 0.45)} ${r(-s * 0.6)}v${r(s * 1.2)}M${r(Lv - s * 0.45)} ${r(-s * 0.6)}v${r(s * 1.2)}`, stroke: c.brassLight, 'stroke-width': 5, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-s * 0.55)} ${r(s * 0.72)}h${r(s * 1.1)}`, stroke: '#5d6d75', 'stroke-width': 4}),
    g({name: `${name}-ball`},
      h('circle', {cx: 0, cy: 0, r: r(ballR), fill: '#d8dde2', stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: r(-ballR * 0.3), cy: r(-ballR * 0.3), r: r(ballR * 0.3), fill: '#ffffff', opacity: 0.7})),
    h('rect', {x: r(-Lv + s * 0.2), y: r(-s * 0.72), width: r(2 * Lv - s * 0.4), height: r(s * 0.4), rx: r(s * 0.2), fill: '#ffffff', opacity: 0.16}),
    h('circle', {cx: r(-Lv * 0.78), cy: r(s * 0.95), r: 3.5, fill: c.brassDark}),
    h('circle', {cx: r(Lv * 0.78), cy: r(s * 0.95), r: 3.5, fill: c.brassDark}),
  );
  const ends = {
    A: P({x: -Lv - s * 0.62 - stub * 0.1, y: 0}),
    B: P({x: Lv + s * 0.62 + stub * 0.1, y: 0}),
    out: P({x: 0, y: s * 1.72}),
    center: P({x: 0, y: 0}),
    below: P({x: 0, y: s * 1.72 + out}),
  };
  const pts = [P({x: -Lv - s * 0.5, y: -s * 1.15}), P({x: Lv + s * 0.5, y: -s * 1.15}), P({x: Lv + s * 0.5, y: s * 1.15}), P({x: -Lv - s * 0.5, y: s * 1.15}), P({x: 0, y: s * 1.72})];
  const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
  const box = {x: Math.min(...xs) - 4, y: Math.min(...ys) - 4, w: Math.max(...xs) - Math.min(...xs) + 8, h: Math.max(...ys) - Math.min(...ys) + 8};
  return {
    node,
    ports: ends,
    box,
    Lv, s,
    /** ball position in [-1, 1] */
    frame: ball => ({[`${name}-ball`]: {transform: T(clamp(ball, -1, 1) * travel, 0)}}),
    ballAt: ball => P({x: clamp(ball, -1, 1) * travel, y: 0}),
  };
}

/**
 * Check gate on a tube (where a disputed capsule is stopped): a collar with
 * a sliding stop pin. The '?' disc is text (hidden with labels); the dashed
 * ring around the gate keeps the state readable without text.
 */
export function gateArt(ctx, name, o) {
  const c = acColors(ctx);
  const tw = o.tube;
  const node = g({transform: T(o.x, o.y, o.angle)},
    h('rect', {x: -11, y: r(-tw / 2 - 9), width: 22, height: r(tw + 18), rx: 4, fill: c.metalDark, stroke: INK, 'stroke-width': 2.2}),
    g({name: `${name}-pin`, transform: 'translate(0 0)'},
      h('rect', {x: -4, y: r(-tw / 2 - 26), width: 8, height: 20, rx: 3, fill: '#8a949c', stroke: INK, 'stroke-width': 1.8})),
    h('circle', {cx: 0, cy: r(-tw / 2 - 9), r: 3, fill: '#ffffff'}),
  );
  const q = o.show;
  const discR = Math.max(tw * 0.62, o.discR ?? 16);
  const off = {x: o.x + o.nx * (tw / 2 + discR + 16), y: o.y + o.ny * (tw / 2 + discR + 16)};
  const doubt = g({name: `${name}-doubt`, opacity: 0},
    h('circle', {cx: r(o.x), cy: r(o.y), r: r(tw * 0.95), fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-dasharray': '5 5'}),
    h('circle', {cx: r(off.x), cy: r(off.y), r: r(discR), fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
    q ? h('text', {x: r(off.x), y: r(off.y + discR * 0.42), 'text-anchor': 'middle', 'font-size': r(discR * 1.25), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: INK}, '?')
      : h('path', {d: `M${r(off.x - discR * 0.45)} ${r(off.y)}h${r(discR * 0.9)}`, stroke: INK, 'stroke-width': 3, 'stroke-dasharray': '3 4'}),
  );
  return {
    node, doubt,
    disc: {x: off.x - discR, y: off.y - discR, w: 2 * discR, h: 2 * discR},
    frame: (closed, doubtO) => ({[`${name}-pin`]: {transform: T(0, r(clamp(closed) * 14))}, [`${name}-doubt`]: {opacity: r(clamp(doubtO), 3)}}),
  };
}

/* ------------------------------------------------------------------ */
/* Receiving tray (point of analysis) and magnifier                    */
/* ------------------------------------------------------------------ */

/**
 * Receiving tray in elevation: a felt-lined wooden tray on a stand, with a
 * brass "point of analysis" medallion (two engraved lines meeting at one
 * point) on its front. `slots` are the rest positions (capsule centres) of
 * the route A (left) and route B (right) capsules.
 */
export function trayArt(ctx, name, o) {
  const c = acColors(ctx);
  const {x, y, w} = o; // x = centre, y = rim top
  const hh = o.h;
  const legH = o.legs ?? 0;
  const med = Math.min(hh * 0.42, w * 0.12);
  const mx = x - w * 0.3;
  const front = `M${r(x - w / 2)} ${r(y)}H${r(x + w / 2)}L${r(x + w / 2 - hh * 0.35)} ${r(y + hh)}H${r(x - w / 2 + hh * 0.35)}Z`;
  const back = g({name: `${name}-back`},
    legH > 0 ? g(null,
      h('path', {d: `M${r(x - w * 0.3)} ${r(y + hh)}V${r(y + hh + legH)}M${r(x + w * 0.3)} ${r(y + hh)}V${r(y + hh + legH)}`, stroke: INK, 'stroke-width': 10, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(x - w * 0.3)} ${r(y + hh)}V${r(y + hh + legH)}M${r(x + w * 0.3)} ${r(y + hh)}V${r(y + hh + legH)}`, stroke: c.woodDark, 'stroke-width': 6, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(x - w * 0.3)} ${r(y + hh + legH * 0.6)}H${r(x + w * 0.3)}`, stroke: c.woodDark, 'stroke-width': 5})) : null,
    h('path', {d: `M${r(x - w / 2 + 10)} ${r(y)}L${r(x - w / 2 + 26)} ${r(y - hh * 0.3)}H${r(x + w / 2 - 26)}L${r(x + w / 2 - 10)} ${r(y)}Z`, fill: c.felt, stroke: INK, 'stroke-width': 2.4}),
  );
  const frontN = g({name: `${name}-front`},
    h('path', {d: front, fill: c.wood, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x - w / 2 + 8)} ${r(y + 6)}H${r(x + w / 2 - 8)}`, stroke: shade(c.wood, 0.2), 'stroke-width': 3}),
    g({name: `${name}-medal`},
      h('circle', {cx: r(mx), cy: r(y + hh * 0.52), r: r(med), fill: c.brass, stroke: INK, 'stroke-width': 2.4}),
      h('path', {d: `M${r(mx - med * 0.62)} ${r(y + hh * 0.52 - med * 0.5)}L${r(mx)} ${r(y + hh * 0.52 + med * 0.1)}L${r(mx + med * 0.62)} ${r(y + hh * 0.52 - med * 0.5)}M${r(mx)} ${r(y + hh * 0.52 + med * 0.1)}V${r(y + hh * 0.52 + med * 0.62)}`, fill: 'none', stroke: c.brassDark, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('circle', {cx: r(mx), cy: r(y + hh * 0.52 + med * 0.1), r: 3.6, fill: INK})),
    h('circle', {name: `${name}-glow`, cx: r(mx), cy: r(y + hh * 0.52), r: r(med + 7), fill: 'none', stroke: c.brassLight, 'stroke-width': 5, opacity: 0}),
  );
  const cr = o.capR;
  const slots = {A: {x: x - w * 0.2, y: y - cr * 0.55}, B: {x: x + w * 0.2, y: y - cr * 0.55}};
  return {
    back, front: frontN, slots,
    box: {x: x - w / 2, y: y - hh * 0.3, w, h: hh * 1.3 + legH},
    medal: {x: mx, y: y + hh * 0.52, r: med},
    frame: glow => ({[`${name}-glow`]: {opacity: r(clamp(glow), 3)}}),
  };
}

/**
 * Hand magnifier: ring + glass (+ optional real enlarged copy clipped to the
 * glass) + wooden handle. Local origin at the lens centre; the handle leaves
 * along +x. frame(c, angleDeg) places it.
 */
export function lupaArt(ctx, name, o) {
  const c = acColors(ctx);
  const R = o.R, Lh = o.handle;
  const clip = `${name}-clip`;
  const node = g({name, transform: T(o.at?.x ?? 0, o.at?.y ?? 0, o.angle ?? 0)},
    h('rect', {x: r(R * 0.92), y: r(-R * 0.16), width: r(Lh), height: r(R * 0.32), rx: r(R * 0.16), fill: c.woodDark, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(R * 0.92), y: r(-R * 0.2), width: r(R * 0.3), height: r(R * 0.4), rx: 3, fill: c.metalDark, stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: 0, r: r(R + 7), fill: '#3d4a52', stroke: INK, 'stroke-width': 2.6}),
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('circle', {cx: 0, cy: 0, r: r(R)}))),
    h('circle', {cx: 0, cy: 0, r: r(R), fill: o.fill ?? c.glass}),
    o.content ? g({'clip-path': ctx.ref(clip)}, o.content) : null,
    h('circle', {cx: 0, cy: 0, r: r(R), fill: '#bfe0ea', opacity: 0.18}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.3)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(-R * 0.22)} ${r(-R * 0.66)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(Math.max(3, R * 0.09)), 'stroke-linecap': 'round', opacity: 0.8}),
  );
  return {node, R, Lh, grip: (cc, ang) => ({x: cc.x + Math.cos(ang * DEG) * (R + Lh * 0.6), y: cc.y + Math.sin(ang * DEG) * (R + Lh * 0.6)})};
}

/**
 * Articulated desk magnifier clamped to a base point: two arm bars and a
 * lens head. frame(a1, a2) sets the two joint angles (degrees); the head
 * position follows by forward kinematics (continuous, no teleport).
 */
export function deskLupa(ctx, name, o) {
  const c = acColors(ctx);
  const {l1, l2, R} = o;
  const clip = `${name}-clip`;
  const node = g({name},
    h('rect', {x: r(o.base.x - 22), y: r(o.base.y - 6), width: 44, height: 16, rx: 4, fill: c.metalDark, stroke: INK, 'stroke-width': 2.2}),
    h('line', {name: `${name}-arm1o`, stroke: INK, 'stroke-width': 13, 'stroke-linecap': 'round'}),
    h('line', {name: `${name}-arm1`, stroke: c.metal, 'stroke-width': 8, 'stroke-linecap': 'round'}),
    h('line', {name: `${name}-arm2o`, stroke: INK, 'stroke-width': 11, 'stroke-linecap': 'round'}),
    h('line', {name: `${name}-arm2`, stroke: c.metal, 'stroke-width': 6.5, 'stroke-linecap': 'round'}),
    h('circle', {name: `${name}-j0`, r: 7, fill: c.metalDark, stroke: INK, 'stroke-width': 2}),
    h('circle', {name: `${name}-j1`, r: 7, fill: c.metalDark, stroke: INK, 'stroke-width': 2}),
    g({name: `${name}-head`},
      h('circle', {cx: 0, cy: 0, r: r(R + 8), fill: '#3d4a52', stroke: INK, 'stroke-width': 2.6}),
      h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('circle', {cx: 0, cy: 0, r: r(R)}))),
      h('circle', {cx: 0, cy: 0, r: r(R), fill: c.glass}),
      g({'clip-path': ctx.ref(clip)}, g({name: `${name}-copy`}, o.content || null)),
      h('circle', {cx: 0, cy: 0, r: r(R), fill: '#bfe0ea', opacity: 0.2}),
      h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.3)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(-R * 0.22)} ${r(-R * 0.66)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(Math.max(3, R * 0.09)), 'stroke-linecap': 'round', opacity: 0.8})),
  );
  /** @returns {{nodes:any, head:{x:number,y:number}, joint:{x:number,y:number}}} */
  const frame = (a1, a2) => {
    const j = {x: o.base.x + Math.cos(a1 * DEG) * l1, y: o.base.y + Math.sin(a1 * DEG) * l1};
    const hd = {x: j.x + Math.cos(a2 * DEG) * l2, y: j.y + Math.sin(a2 * DEG) * l2};
    const ln = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
    return {
      nodes: {
        [`${name}-arm1o`]: ln(o.base, j), [`${name}-arm1`]: ln(o.base, j),
        [`${name}-arm2o`]: ln(j, hd), [`${name}-arm2`]: ln(j, hd),
        [`${name}-j0`]: {cx: r(o.base.x), cy: r(o.base.y)},
        [`${name}-j1`]: {cx: r(j.x), cy: r(j.y)},
        [`${name}-head`]: {transform: T(hd.x, hd.y)},
      },
      head: hd,
      joint: j,
    };
  };
  return {node, frame, clipRef: ctx.ref(clip)};
}

/**
 * Solve the two joint angles that put the desk-lupa head on `target`, with
 * the elbow joint ABOVE the base-to-head line (the arm never dips into the
 * tray). With `near`, angles are unwrapped to lie within ±180° of it so a
 * linear blend between two solutions sweeps the short way.
 */
export function solveDeskLupa(base, target, l1, l2, near = null) {
  const dx = target.x - base.x, dy = target.y - base.y;
  const d = clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const baseA = Math.atan2(dy, dx);
  const A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const tip = {x: base.x + Math.cos(baseA) * d, y: base.y + Math.sin(baseA) * d};
  const opts = [baseA - A, baseA + A].map(a1 => {
    const j = {x: base.x + Math.cos(a1) * l1, y: base.y + Math.sin(a1) * l1};
    return {a1: a1 / DEG, a2: Math.atan2(tip.y - j.y, tip.x - j.x) / DEG, jy: j.y};
  });
  const best = opts[0].jy <= opts[1].jy ? opts[0] : opts[1];
  if (near) {
    const unwrap = (v, ref) => v + 360 * Math.round((ref - v) / 360);
    best.a1 = unwrap(best.a1, near.a1);
    best.a2 = unwrap(best.a2, near.a2);
  }
  return {a1: best.a1, a2: best.a2};
}

/* ------------------------------------------------------------------ */
/* Rule plaque                                                         */
/* ------------------------------------------------------------------ */

/**
 * Enamel rule plaque in a wooden frame, with two screws and a small
 * "two lines meeting at one point" pictogram. Measure first, draw later.
 */
export function rulePlaque(ctx, o) {
  const c = acColors(ctx);
  const frameW = Math.max(10, o.size * 0.45);
  const P = panel(ctx, {w: o.w - 2 * frameW, head: o.kind, headSize: o.headSize, body: o.text, size: o.size, family: 'serif', weight: 700, show: o.show, pad: o.size * 0.7});
  const hh = P.h + 2 * frameW;
  return {
    h: hh, w: o.w, fit: P.body,
    draw(x, y, name) {
      return g({name},
        h('path', {d: roundRectPath(x + 6, y + 8, o.w, hh, 14), fill: 'rgba(31,35,40,0.15)'}),
        h('path', {d: roundRectPath(x, y, o.w, hh, 14), fill: c.wood, stroke: INK, 'stroke-width': 2.8}),
        h('path', {d: roundRectPath(x + 4, y + 4, o.w - 8, hh - 8, 11), fill: 'none', stroke: shade(c.wood, 0.22), 'stroke-width': 2}),
        P.draw(x + frameW, y + frameW, {fill: c.enamel, stroke: shade(c.wood, -0.35), headColor: shade(c.woodDark, -0.2), color: INK, radius: 8, name: name ? `${name}-panel` : undefined}),
        h('circle', {cx: r(x + frameW / 2), cy: r(y + hh / 2), r: 3.4, fill: c.brassDark}),
        h('circle', {cx: r(x + o.w - frameW / 2), cy: r(y + hh / 2), r: 3.4, fill: c.brassDark}),
      );
    },
  };
}

/** Linear interpolation of points. */
export const mixPt = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});

/**
 * Bottom notes row: the author's issue (a yellow note) and the footnote
 * (assumptions + "as supplied · no conclusion drawn"), side by side when both
 * fit in two lines, else stacked. Measured with the texts whatever the label
 * visibility, so geometry does not depend on it (unless `collapse`).
 * @returns {{issueBox:any, footBox:any, top:number, footText:string, issueText:string|null}}
 */
export function notesLayout(ctx, o) {
  const p = ctx.params, t = ctx.t, D = ctx.design;
  const M = o.M, ks = o.ks;
  const footText = p.assumptions.length ? `${t.assumed}: ${p.assumptions.join(' · ')} — ${t.noConclusion}` : t.noConclusion;
  const issueText = p.issues.length ? `${t.issue}: ${p.issues[0]}` : null;
  const full = (o.w ?? D.w - 2 * M);
  const x0 = o.x ?? M;
  const probe = (text, w) => {
    const pad = ks * 0.6;
    const f = ctx.fit(text, {maxWidth: w - 2 * pad, size: ks, minSize: ks, maxLines: 8, weight: 500});
    return {w: f.width + 2 * pad, h: f.height + 2 * ks * 0.38};
  };
  let issueBox = null, footBox;
  if (issueText) {
    const half = (full - 16) / 2;
    const a = probe(issueText, half), b = probe(footText, half);
    const two = ks * 1.18 + ks + ks * 0.76 + 1;
    if (a.h <= two + 0.5 && b.h <= two + 0.5) {
      const hh = Math.max(a.h, b.h);
      issueBox = {x: x0, y: D.h - M - hh, w: a.w, h: hh, mw: half};
      footBox = {x: x0 + half + 16, y: D.h - M - hh, w: b.w, h: hh, mw: half};
    } else {
      const fb = probe(footText, full), ib = probe(issueText, full);
      footBox = {x: x0, y: D.h - M - fb.h, w: fb.w, h: fb.h, mw: full};
      issueBox = {x: x0, y: footBox.y - 10 - ib.h, w: ib.w, h: ib.h, mw: full};
    }
  } else {
    const fb = probe(footText, full);
    footBox = {x: x0, y: D.h - M - fb.h, w: fb.w, h: fb.h, mw: full};
  }
  const top = o.collapse ? D.h - M + 12 : issueBox ? Math.min(issueBox.y, footBox.y) : footBox.y;
  return {issueBox, footBox, top, footText, issueText};
}

/** Draw the notes row (issue at 'all', footnote at 'key'); both wrapped in named groups for fading. */
export function notesArt(ctx, N, o) {
  const th = ctx.theme;
  const chipOf = (text, b, fill, stroke, name) => {
    const pad = o.ks * 0.6;
    const f = ctx.fit(text, {maxWidth: b.mw - 2 * pad, size: o.ks, minSize: o.ks, maxLines: 8, weight: 500});
    const w = f.width + 2 * pad, hh = f.height + 2 * o.ks * 0.38;
    return g({name},
      h('path', {d: roundRectPath(b.x, b.y, w, hh, 8), fill, stroke, 'stroke-width': 2}),
      textBlock(f, {x: b.x + w / 2, y: b.y + o.ks * 0.38, anchor: 'middle', fill: th.ink}));
  };
  return g(null,
    N.issueBox && ctx.show('all') ? chipOf(N.issueText, N.issueBox, '#fff8dc', th.accent3, 'issue-g') : null,
    ctx.show('key') ? chipOf(N.footText, N.footBox, th.card, th.inkFaint, 'foot') : null,
  );
}

/** Deep clone of a vnode tree without node names and without any text (for magnified copies). */
export function cloneArt(node) {
  if (!node || typeof node !== 'object') return node;
  if (node.tag === 'text' || node.tag === 'title') return null;
  const attrs = {...node.attrs};
  delete attrs.name;
  if (attrs.id) delete attrs.id;
  if (attrs['clip-path']) delete attrs['clip-path'];
  return {tag: node.tag, attrs, children: node.children.map(cloneArt).filter(c => c !== null && c !== undefined)};
}

/** Cubic point / split helpers for connectors drawn on per frame. */
export function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x, y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y};
}
export function cubicHead(p0, p1, p2, p3, t) {
  const m = (a, b) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
  const a = m(p0, p1), b = m(p1, p2), c = m(p2, p3), d = m(a, b), e = m(b, c), f = m(d, e);
  return [p0, a, d, f];
}

/* ------------------------------------------------------------------ */
/* Compact system (contrast panels, inspect context)                   */
/* ------------------------------------------------------------------ */

/** Polyline with cumulative lengths; pointAt / angleAt helpers below. */
export function cumPoly(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return {pts, cum, total: cum[cum.length - 1]};
}
export function pointAtCum(poly, s) {
  const S = clamp(s, 0, poly.total);
  let lo = 0, hi = poly.cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (poly.cum[mid] <= S) lo = mid; else hi = mid;
  }
  const a = poly.pts[lo], b = poly.pts[hi];
  const L = poly.cum[hi] - poly.cum[lo] || 1;
  const k = (S - poly.cum[lo]) / L;
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k};
}
export function angleAtCum(poly, s, w = 14) {
  const p0 = pointAtCum(poly, s - w), p1 = pointAtCum(poly, s + w);
  return (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
}
export function arcNear(poly, q) {
  let best = Infinity, at = 0;
  poly.pts.forEach((pt, i) => { const d = Math.hypot(pt.x - q.x, pt.y - q.y); if (d < best) { best = d; at = poly.cum[i]; } });
  return at;
}

/**
 * A complete, compact pneumatic board inside a stage rectangle: wall panel,
 * inlet A (upper left) and inlet B (upper right) with bells opening upward,
 * their tubes and check gates, the shuttle valve (centre), the outlet and the
 * receiving tray with a desk magnifier. Node names are prefixed with `P` so
 * several boards (A/B panels, lens copies) can coexist. Geometry only; the
 * entry drives every moving part per frame.
 * @param {any} ctx
 * @param {string} P prefix
 * @param {{x:number,y:number,w:number,h:number, show:boolean, letterSize:number, wall?:boolean, lupa?:boolean}} o
 */
export function compactSystem(ctx, P, o) {
  const c = acColors(ctx);
  const {x, y, w, h: H} = o;
  const tw = clamp(Math.min(w * 0.045, H * 0.07), 14, 44);
  const cap = {len: tw * 2.1, rad: tw * 0.4};
  // the valve is the detail that tells A from B: sized from the stage, not from the tube
  const vs = clamp(Math.min(H * 0.1, w * 0.07), tw * 0.95, 72);
  const inletY = y + H * 0.26;
  const jx = x + w * 0.5, jy = y + H * 0.5;
  const valve = valveArt(ctx, `${P}valve`, {x: jx, y: jy, size: vs, colorA: c.A, colorB: c.B});
  const trayW = w * 0.46, trayH = tw * 1.45;
  const trayY = Math.max(y + H * 0.78, valve.ports.out.y + tw * 1.2 + cap.rad * 2 + 20);
  const tray = trayArt(ctx, `${P}tray`, {x: jx, y: trayY, w: trayW, h: trayH, legs: Math.max(0, y + H - 6 - trayY - trayH), capR: cap.rad});
  const nozzle = {x: jx, y: Math.min(trayY - cap.rad * 2 - 6, valve.ports.out.y + tw * 1.2)};
  const outTube = tubeArt(ctx, `${P}tubeOut`, filletPoints([valve.ports.out, nozzle], 6), {width: tw, color: c.brass, every: 9999});
  const routes = {};
  for (const key of ['A', 'B']) {
    const ix = key === 'A' ? x + w * 0.13 : x + w * 0.87;
    const inlet = inletArt(ctx, `${P}inlet${key}`, {x: ix, y: inletY, tube: tw, rot: 90, flip: true, color: c.route(key)});
    const port = valve.ports[key];
    const bellEnd = {x: ix, y: inletY};
    const run = filletPoints([bellEnd, {x: ix, y: jy}, port], Math.min(60, (jy - inletY) * 0.45, Math.abs(port.x - ix) * 0.6), 6);
    const tube = tubeArt(ctx, `${P}tube${key}`, run, {width: tw, color: c.route(key), every: (jy - inletY) * 0.6});
    const gateAt = {x: ix, y: inletY + (jy - inletY) * 0.5};
    const gate = gateArt(ctx, `${P}gate${key}`, {x: gateAt.x, y: gateAt.y, angle: 90, tube: tw, nx: key === 'A' ? 1 : -1, ny: 0, show: o.show, discR: Math.max(o.letterSize * 0.8, tw * 0.62)});
    const slot = tray.slots[key];
    const start = {x: inlet.mouth.x, y: o.startY ?? inlet.mouth.y - cap.len * 0.9};
    const path = cumPoly(filletPoints([start, inlet.mouth, ...run.slice(1), valve.ports.center, valve.ports.out, nozzle, {x: nozzle.x, y: slot.y}, slot], 16, 4));
    const sMouth = arcNear(path, inlet.mouth);
    const sGate = arcNear(path, gateAt) - cap.len / 2 - 6;
    const sPort = arcNear(path, port);
    // the route letter on a small brass tab beside the bell (inner side, level with the bell)
    const lx = key === 'A' ? ix + tw * 1.3 + o.letterSize * 0.9 : ix - tw * 1.3 - o.letterSize * 0.9;
    const ly = inletY - (tw * 1.35 + 10) * 0.55;
    const tab = g(null,
      h('rect', {x: r(lx - o.letterSize * 0.8), y: r(ly - o.letterSize * 0.8), width: r(o.letterSize * 1.6), height: r(o.letterSize * 1.6), rx: 6, fill: c.route(key), stroke: INK, 'stroke-width': 2}),
      o.show ? h('text', {x: r(lx), y: r(ly + o.letterSize * 0.36), 'text-anchor': 'middle', 'font-size': r(o.letterSize), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, key)
        : (key === 'A' ? h('circle', {cx: r(lx), cy: r(ly), r: r(o.letterSize * 0.25), fill: '#ffffff'}) : g(null, h('circle', {cx: r(lx - o.letterSize * 0.28), cy: r(ly), r: r(o.letterSize * 0.2), fill: '#ffffff'}), h('circle', {cx: r(lx + o.letterSize * 0.28), cy: r(ly), r: r(o.letterSize * 0.2), fill: '#ffffff'}))));
    routes[key] = {key, inlet, tube, gate, gateAt, slot, path, sMouth, sGate, sPort, start, run, tab, tabBox: {x: lx - o.letterSize * 0.8, y: ly - o.letterSize * 0.8, w: o.letterSize * 1.6, h: o.letterSize * 1.6}};
  }
  // neutral capsules (inspect): the route is carried by the supplied datum, not by the capsule's bands
  const capCol = key => (o.neutral ? '#8f99a3' : c.route(key));
  const capKey = key => (o.neutral ? 'A' : key);
  const capsules = {A: capsuleArt(ctx, `${P}capA`, {len: cap.len, rad: cap.rad, color: capCol('A'), key: capKey('A'), opacity: 0}), B: capsuleArt(ctx, `${P}capB`, {len: cap.len, rad: cap.rad, color: capCol('B'), key: capKey('B'), opacity: 0})};
  // route glow: a soft halo along a tube, lit for the route the supplied datum names
  const glows = ['A', 'B'].map(key => h('path', {name: `${P}halo${key}`, d: routes[key].tube.d, fill: 'none', stroke: c.route(key), 'stroke-width': r(tw * 2.1), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}));
  // desk magnifier on the tray's right end
  const lr = Math.max(tw * 1.7, 24);
  const base = {x: jx + trayW / 2 - 12, y: trayY - 2};
  const l1 = Math.max(trayW * 0.36, lr * 1.6), l2 = l1;
  // parked head: the first spot clear of the tubes, bells and letter tabs (right of the tray first)
  const clearOf = q => ['A', 'B'].every(key => routes[key].run.every(pt => Math.hypot(pt.x - q.x, pt.y - q.y) > lr + tw * 0.6 + 8)
    && Math.hypot(routes[key].inlet.mouth.x - q.x, routes[key].inlet.mouth.y - q.y) > lr + tw * 2)
    && Math.hypot(jx - q.x, jy - q.y) > lr + vs * 3 && q.x + lr + 6 < x + w && q.y - lr - 6 > y;
  const cands = [[0.95, -0.5], [0.8, -0.7], [1.05, -0.3], [0.6, -0.9], [1.1, -0.1]].map(([fx, fy]) => ({x: base.x + l1 * fx, y: base.y + l1 * fy}));
  const park = cands.find(clearOf) || cands[0];
  const over = {x: jx, y: trayY - cap.rad * 0.6};
  const parkA = solveDeskLupa(base, park, l1, l2);
  const overA = solveDeskLupa(base, over, l1, l2, parkA);
  // the magnifier's glass shows a real enlarged copy of the tray and of the capsules in it
  const copy = g(null, cloneArt(tray.back), cloneArt(tray.front),
    capsuleArt(ctx, `${P}lcapA`, {len: cap.len, rad: cap.rad, color: capCol('A'), key: capKey('A'), opacity: 0}),
    capsuleArt(ctx, `${P}lcapB`, {len: cap.len, rad: cap.rad, color: capCol('B'), key: capKey('B'), opacity: 0}));
  const desk = o.lupa === false ? null : deskLupa(ctx, `${P}lupa`, {base, l1, l2, R: lr, content: copy});
  const wall = o.wall === false ? null : g(null,
    h('path', {d: roundRectPath(x, y, w, H, 18), fill: c.wall, stroke: shade(c.wall, -0.18), 'stroke-width': 2}),
    Array.from({length: Math.max(2, Math.floor(H / 80))}, (_, i) => h('path', {d: `M${r(x + 10)} ${r(y + 50 + i * 80)}H${r(x + w - 10)}`, stroke: c.wallLine, 'stroke-width': 2})),
  );
  const nozzleNode = h('path', {d: `M${r(nozzle.x - tw * 0.62)} ${r(nozzle.y)}h${r(tw * 1.24)}l-4 10h${r(-tw * 1.24 + 8)}Z`, fill: c.brass, stroke: INK, 'stroke-width': 2});
  /** Back-to-front layers. */
  const layers = {
    wall,
    back: g(null, g({opacity: 0.35}, glows), tray.back, routes.A.tube.back, routes.B.tube.back, outTube.back),
    capsules: o.clip ? g(null, h('defs', null, h('clipPath', {id: ctx.id(`${P}clip`)}, h('path', {d: roundRectPath(x, y, w, H, 18)}))), g({'clip-path': ctx.ref(`${P}clip`)}, capsules.A, capsules.B)) : g(null, capsules.A, capsules.B),
    front: g(null, routes.A.tube.front, routes.B.tube.front, outTube.front, nozzleNode, tray.front, routes.A.gate.node, routes.B.gate.node, routes.A.inlet.node, routes.B.inlet.node, valve.node, routes.A.tab, routes.B.tab),
    lupa: desk ? desk.node : null,
    doubt: g(null, routes.A.gate.doubt, routes.B.gate.doubt),
  };
  /**
   * Per-frame nodes for one supplied state.
   * @param {{route:'A'|'B'|null, status:string, travel:number, lid:number, ball:number, glow:number, lupa:number, gate:number, doubt:number, capOpacity?:number}} st
   *   travel: 0 = capsule waiting above the bell, 1 = at its stop (tray slot, or the gate when disputed)
   */
  function frame(st) {
    const nodes = {};
    let capPt = null, capState = 'none';
    for (const key of ['A', 'B']) {
      const R = routes[key];
      const used = st.route === key;
      Object.assign(nodes, R.inlet.frame(used ? st.lid : 0));
      Object.assign(nodes, R.gate.frame(used && st.status === 'disputed' ? st.gate : 0, used && st.status === 'disputed' ? st.doubt : 0));
      if (used && st.status !== 'pending') {
        const stop = st.status === 'disputed' ? R.sGate : R.path.total;
        const sNow = stop * clamp(st.travel);
        const q = pointAtCum(R.path, sNow);
        let ang = angleAtCum(R.path, sNow);
        if (sNow > R.path.total - 50) ang = ang + ((((key === 'A' ? 180 : 0) - ang + 540) % 360) - 180) * clamp((sNow - (R.path.total - 50)) / 50);
        if (sNow <= R.sMouth) ang = 90;
        nodes[`${P}cap${key}`] = {transform: T(q.x, q.y, ang), opacity: st.capOpacity ?? 1};
        if (desk) nodes[`${P}lcap${key}`] = {transform: T(q.x, q.y, ang), opacity: st.capOpacity ?? 1};
        capPt = q;
        capState = st.travel <= 0 ? 'waiting' : st.travel >= 1 ? (st.status === 'disputed' ? 'stopped-at-gate' : 'in-tray') : 'in-tube';
      } else {
        nodes[`${P}cap${key}`] = {opacity: 0};
        if (desk) nodes[`${P}lcap${key}`] = {opacity: 0};
      }
    }
    Object.assign(nodes, valve.frame(st.ball), tray.frame(st.glow));
    if (st.halo) for (const key of ['A', 'B']) nodes[`${P}halo${key}`] = {opacity: r(clamp(st.halo[key] || 0), 3)};
    let head = null;
    if (desk) {
      const lf = desk.frame(lerp(parkA.a1, overA.a1, st.lupa), lerp(parkA.a2, overA.a2, st.lupa));
      Object.assign(nodes, lf.nodes);
      head = lf.head;
      nodes[`${P}lupa-copy`] = {transform: `scale(1.7) translate(${r(-lf.head.x)} ${r(-lf.head.y)})`};
    }
    return {nodes, capPt, capState, head};
  }
  const box = {x, y, w, h: H};
  return {layers, frame, routes, valve, tray, nozzle, tw, cap, box, lupaR: lr, overHead: over, parkHead: park};
}
