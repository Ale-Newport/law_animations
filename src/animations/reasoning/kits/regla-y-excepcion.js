/**
 * Motif kit for "Regla y excepción" (LAW-0093..0096).
 *
 * Visual metaphor (original vector art, top-down model railway on a board):
 *  - the GENERAL RULE is the main track: a fact travels along it by default;
 *  - the EXCEPTION is a separate siding that leaves the main track at a
 *    switch (the CONNECTOR: a pivoting blade thrown by a lever through a rod)
 *    and is closed by a swing gate;
 *  - the CONDITION is a diamond socket on the gate post; the FACT card carries
 *    (or not) the matching diamond marker, as SUPPLIED by the author;
 *  - the MAGNIFIER examines the card's marker corner.
 * The scene never decides whether a rule or exception applies: the route the
 * fact takes, and the marker it carries, come from the supplied state
 * ('branch-as-supplied' | 'main-as-supplied' | 'held-disputed' | 'held-pending').
 *
 * This file holds fields, strings, geometry and art only; each entry owns its
 * own layout, timeline and semantics.
 * @module animations/reasoning/kits/regla-y-excepcion
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp} from '../../../core/time.js';
import {cubic, polyline, roundRectPath} from '../../../core/geometry.js';
import {str, list, obj} from '../../../schemas/fields.js';
import {textBlock, LINK_STYLES} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';

const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ fields */

/** Supplied route states (descriptive; never computed by the scene). */
export const ROUTE_STATES = ['branch-as-supplied', 'main-as-supplied', 'held-disputed', 'held-pending'];

/** Category field set for reasoning, specialised for this motif (built from the shared builders). */
export const reglaFields = {
  facts: list('Facts printed on the fact card (fictional); the first one is the headline', str('Fact', 90), 1, 3),
  rules: obj('Rule structure supplied by the author (illustrative, jurisdiction unspecified; never a statement of real law)', {
    general: str('General rule printed on the main-route plaque', 110),
    exception: str('Exception printed on the branch plaque', 110),
    condition: str('Condition that opens the branch, printed beside the gate socket', 90),
  }, ['general', 'exception', 'condition']),
  issues: list('Question examined, shown as the scene heading (supplied, not answered by the scene)', str('Issue', 100), 0, 2),
  assumptions: list('Assumptions shown as a footnote in the final hold', str('Assumption', 90), 0, 2),
};

export const REGLA_DEFAULTS = {
  facts: ['Parcel 7 needs a signature', 'Arrives Monday, 9:40'],
  rules: {
    general: 'Parcels are left at the front desk',
    exception: 'Signed-for parcels go to the post room',
    condition: 'The parcel needs a signature',
  },
  issues: ['Does the exception’s condition appear in the facts?'],
  assumptions: ['Fictional house rules, as supplied'],
};

export const REGLA_DEFAULTS_ES = {
  facts: ['El paquete 7 requiere firma', 'Llega el lunes a las 9:40'],
  rules: {
    general: 'Los paquetes se dejan en recepción',
    exception: 'Los paquetes con firma van a la sala de correo',
    condition: 'El paquete requiere firma',
  },
  issues: ['¿Aparece en los hechos la condición de la excepción?'],
  assumptions: ['Normas internas ficticias, tal como se aportan'],
};

/** Built-in strings (user content is never translated). */
export const REGLA_STRINGS = {
  en: {
    rule: 'General rule',
    exception: 'Exception',
    condition: 'Condition',
    fact: 'Fact',
    issue: 'Issue',
    assumed: 'Assumed',
    mainRoute: 'Main route',
    branchRoute: 'Exception branch',
    stateBranch: 'Exception branch · as supplied',
    stateMain: 'Main route · as supplied',
    stateDisputed: 'Held at the junction · disputed',
    statePending: 'Held at the junction · pending',
    branchOpen: 'Branch open · as supplied',
    branchClosed: 'Branch closed · as supplied',
    marker: 'Condition marker',
    sameRules: 'Same in A and B',
    route: 'Route',
  },
  es: {
    rule: 'Regla general',
    exception: 'Excepción',
    condition: 'Condición',
    fact: 'Hecho',
    issue: 'Cuestión',
    assumed: 'Se asume',
    mainRoute: 'Recorrido principal',
    branchRoute: 'Rama de excepción',
    stateBranch: 'Rama de excepción · según lo aportado',
    stateMain: 'Recorrido principal · según lo aportado',
    stateDisputed: 'Detenido en el cruce · discutido',
    statePending: 'Detenido en el cruce · pendiente',
    branchOpen: 'Rama abierta · según lo aportado',
    branchClosed: 'Rama cerrada · según lo aportado',
    marker: 'Marca de condición',
    sameRules: 'Igual en A y B',
    route: 'Recorrido',
  },
};

/** Marker carried by the fact card for a supplied state. */
export function markerOf(state) {
  return state === 'branch-as-supplied' ? 'present' : state === 'main-as-supplied' ? 'absent' : state === 'held-disputed' ? 'disputed' : 'pending';
}

/** Route the fact follows for a supplied state. */
export function routeOf(state) {
  return state === 'branch-as-supplied' ? 'branch' : state === 'main-as-supplied' ? 'main' : 'held';
}

/** Status text for a supplied state. */
export function stateText(t, state) {
  return state === 'branch-as-supplied' ? t.stateBranch : state === 'main-as-supplied' ? t.stateMain : state === 'held-disputed' ? t.stateDisputed : t.statePending;
}

/** Colours of the motif (rule = blue, exception/condition = amber). */
export function palette(ctx) {
  const th = ctx.theme;
  return {
    rule: th.accent2,
    ruleSoft: th.accent2Soft,
    exc: th.accent3,
    excSoft: th.accent3Soft,
    excInk: shade(th.accent3, -0.45),
    board: '#e4dac4',
    boardEdge: '#b9a98a',
    ballast: '#cfc4ad',
    ballastEdge: '#b3a78f',
    sleeper: '#8b6b4f',
    rail: '#59626b',
    railHi: '#b8c0c8',
    wagon: '#6f5a48',
  };
}

/* --------------------------------------------------------------- geometry */

const AX = {
  // main track along +x, the branch offsets upward
  h: {d: {x: 1, y: 0}, n: {x: 0, y: -1}},
  // main track along +y, the branch offsets to the right
  v: {d: {x: 0, y: 1}, n: {x: 1, y: 0}},
};

/**
 * Junction geometry in world units.
 * @param {{axis:'h'|'v', a:{x:number,y:number}, sDist:number, len:number, off:number, curve:number, gauge:number,
 *   endGap:number, gateAfter?:number, bladeLen?:number}} o
 *   a = start of the main track; sDist = switch distance from a; len = main track length;
 *   off = lateral offset of the siding; curve = length (along the main axis) of the diverging curve.
 */
export function junctionGeom(o) {
  const {d, n} = AX[o.axis];
  const A = o.a;
  const P = (s, k = 0) => ({x: A.x + d.x * s + n.x * k, y: A.y + d.y * s + n.y * k});
  const S = P(o.sDist);
  const E = P(o.len);
  const Q = P(o.sDist + o.curve, o.off);
  const EB = P(o.len, o.off);
  const c1 = P(o.sDist + o.curve * 0.42, o.off * 0.14);
  const c2 = P(o.sDist + o.curve * 0.52, o.off);
  const curvePts = [];
  for (let i = 0; i <= 40; i++) curvePts.push(cubic(S, c1, c2, Q, i / 40));
  const branchPts = [...curvePts, EB];
  const routeMain = polyline([A, S, E]);
  const routeBranch = polyline([A, ...curvePts, EB]);
  const branchOnly = polyline(branchPts);
  const bladeLen = o.bladeLen ?? Math.min(170, o.curve * 0.42);
  const mainAngle = Math.atan2(d.y, d.x) / DEG;
  const bp = branchOnly.at(bladeLen / branchOnly.total);
  const branchAngle = Math.atan2(bp.y - S.y, bp.x - S.x) / DEG;
  const gateAfter = o.gateAfter ?? 60;
  const G = P(o.sDist + o.curve + gateAfter, o.off);
  // the gate post stands beside the siding: 'inner' = on the main-track side, 'outer' = away from it
  const side = o.postSide === 'outer' ? 1 : -1;
  const post = P(o.sDist + o.curve + gateAfter, o.off + side * o.gauge * 1.35);
  const away = {x: n.x * side, y: n.y * side};
  const closedAngle = Math.atan2(-away.y, -away.x) / DEG;
  const upstream = Math.atan2(-d.y, -d.x) / DEG;
  let delta = upstream - closedAngle;
  while (delta > 180) delta -= 360;
  while (delta <= -180) delta += 360;
  return {
    axis: o.axis, d, n, P, A, S, E, Q, EB, G, post,
    gauge: o.gauge, curve: o.curve, off: o.off, sDist: o.sDist, len: o.len,
    mainPts: [A, E], branchPts, routeMain, routeBranch, branchOnly,
    mainEndDist: o.len - o.endGap,
    branchEndDist: routeBranch.total - o.endGap,
    blade: {pivot: S, len: bladeLen, mainAngle, branchAngle},
    gate: {post, away, len: o.gauge * 2.55, closedAngle, openAngle: closedAngle + delta},
  };
}

/** Cart pose on a route at a given arc-length distance. */
export function cartAt(route, dist) {
  const p = route.at(clamp(dist / route.total));
  return {x: p.x, y: p.y, angle: p.a / DEG};
}

/* -------------------------------------------------------------------- art */

function offsetPts(pts, off) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    return {x: p.x - (dy / L) * off, y: p.y + (dx / L) * off};
  });
}

const pathOf = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${r(p.x)} ${r(p.y)}`).join('');

/**
 * Ballast, sleepers and rails along a polyline (one path per layer).
 * @param {any} ctx
 * @param {{pts:Array<{x:number,y:number}>, gauge:number, every?:number, skipFrom?:number, layer:'bed'|'rails'}} o
 */
export function trackArt(ctx, o) {
  const pal = palette(ctx);
  const poly = polyline(o.pts);
  const gw = o.gauge;
  if (o.layer === 'bed') {
    const d = pathOf(o.pts);
    const every = o.every ?? gw * 0.62;
    let sl = '';
    for (let s = every * 0.5; s < poly.total; s += every) {
      const p = poly.at(s / poly.total);
      const ca = Math.cos(p.a), sa = Math.sin(p.a);
      const hl = gw * 0.98, hw = gw * 0.13;
      const c = [[-hw, -hl], [hw, -hl], [hw, hl], [-hw, hl]].map(([x, y]) => ({x: p.x + x * ca - y * sa, y: p.y + x * sa + y * ca}));
      sl += `M${r(c[0].x)} ${r(c[0].y)}L${r(c[1].x)} ${r(c[1].y)}L${r(c[2].x)} ${r(c[2].y)}L${r(c[3].x)} ${r(c[3].y)}Z`;
    }
    return g(null,
      h('path', {d, fill: 'none', stroke: pal.ballastEdge, 'stroke-width': r(gw * 2.75), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d, fill: 'none', stroke: pal.ballast, 'stroke-width': r(gw * 2.5), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      h('path', {d: sl, fill: pal.sleeper, stroke: shade(pal.sleeper, -0.3), 'stroke-width': 1.2}),
    );
  }
  const a = pathOf(offsetPts(o.pts, gw / 2));
  const b = pathOf(offsetPts(o.pts, -gw / 2));
  return g(null,
    h('path', {d: a + b, fill: 'none', stroke: '#2f353b', 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d: a + b, fill: 'none', stroke: pal.rail, 'stroke-width': 5.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    h('path', {d: a + b, fill: 'none', stroke: pal.railHi, 'stroke-width': 1.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
  );
}

/** Buffer stop at a track end, facing upstream (angle = track direction). */
export function bufferStop(ctx, {x, y, angle, gauge, color}) {
  const c = color ?? '#9c4f4f';
  const w = gauge * 2.1;
  return g({transform: T(x, y, angle)},
    h('rect', {x: -4, y: -w / 2, width: 30, height: w, rx: 6, fill: c, stroke: '#1f2328', 'stroke-width': 2.5}),
    h('rect', {x: -14, y: -w * 0.36 - 7, width: 14, height: 14, rx: 3, fill: '#d8d2c4', stroke: '#1f2328', 'stroke-width': 2}),
    h('rect', {x: -14, y: w * 0.36 - 7, width: 14, height: 14, rx: 3, fill: '#d8d2c4', stroke: '#1f2328', 'stroke-width': 2}),
  );
}

/**
 * The condition marker: a diamond. Modes:
 *  present  – filled amber diamond with a white core (the card carries it, as supplied)
 *  socket   – dashed empty diamond (the gate's receptacle)
 *  absent   – an empty dotted spot (no marker supplied)
 *  disputed – half-filled diamond with a dashed outline
 *  pending  – diamond covered by a grey tab with an hourglass
 * Centred on (0,0); `s` is the half diagonal.
 */
export function emblem(ctx, {name, s, mode, opacity, color}) {
  const th = ctx.theme;
  const col = color ?? th.accent3;
  const D = `M0 ${r(-s)}L${r(s)} 0L0 ${r(s)}L${r(-s)} 0Z`;
  const parts = [];
  if (mode === 'present') {
    parts.push(h('path', {d: D, fill: col, stroke: th.ink, 'stroke-width': Math.max(2, s * 0.1), 'stroke-linejoin': 'round'}));
    parts.push(h('circle', {r: r(s * 0.3), fill: '#fff', stroke: th.ink, 'stroke-width': Math.max(1.5, s * 0.06)}));
  } else if (mode === 'socket') {
    parts.push(h('path', {d: D, fill: th.paper, stroke: th.inkSoft, 'stroke-width': Math.max(2, s * 0.09), 'stroke-dasharray': `${r(s * 0.28)} ${r(s * 0.2)}`, 'stroke-linejoin': 'round'}));
    parts.push(h('circle', {r: r(s * 0.3), fill: 'none', stroke: th.inkFaint, 'stroke-width': Math.max(1.5, s * 0.06)}));
  } else if (mode === 'absent') {
    parts.push(h('circle', {r: r(s * 0.72), fill: 'none', stroke: th.inkFaint, 'stroke-width': Math.max(1.6, s * 0.08), 'stroke-dasharray': `${r(s * 0.1)} ${r(s * 0.22)}`, 'stroke-linecap': 'round'}));
  } else if (mode === 'disputed') {
    parts.push(h('path', {d: D, fill: th.paper}));
    parts.push(h('path', {d: `M0 ${r(-s)}L${r(-s)} 0L0 ${r(s)}Z`, fill: col}));
    parts.push(h('path', {d: D, fill: 'none', stroke: th.ink, 'stroke-width': Math.max(2, s * 0.09), 'stroke-dasharray': `${r(s * 0.3)} ${r(s * 0.18)}`, 'stroke-linejoin': 'round'}));
    parts.push(h('line', {x1: 0, y1: r(-s), x2: 0, y2: r(s), stroke: th.ink, 'stroke-width': Math.max(1.5, s * 0.07)}));
  } else if (mode === 'pending') {
    parts.push(h('path', {d: D, fill: 'none', stroke: th.inkFaint, 'stroke-width': Math.max(1.5, s * 0.07)}));
    parts.push(h('rect', {x: r(-s * 0.95), y: r(-s * 0.72), width: r(s * 1.9), height: r(s * 1.44), rx: r(s * 0.2), fill: '#c9ccd1', stroke: th.inkSoft, 'stroke-width': Math.max(1.5, s * 0.07)}));
    parts.push(h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.45)}H${r(s * 0.3)}L${r(-s * 0.3)} ${r(s * 0.45)}H${r(s * 0.3)}Z`, fill: 'none', stroke: th.ink, 'stroke-width': Math.max(1.5, s * 0.08), 'stroke-linejoin': 'round'}));
  }
  return g({name, opacity}, parts);
}

/** Small route glyph for plaque bands: straight (main) or forking (branch). */
export function routeGlyph(kind, s, color) {
  const w = Math.max(2.5, s * 0.14);
  if (kind === 'main') {
    return g(null,
      h('path', {d: `M${r(-s)} ${r(s * 0.28)}H${r(s)}M${r(-s)} ${r(-s * 0.28)}H${r(s)}`, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round'}),
      h('path', {d: `M${r(-s * 0.6)} ${r(-s * 0.45)}V${r(s * 0.45)}M0 ${r(-s * 0.45)}V${r(s * 0.45)}M${r(s * 0.6)} ${r(-s * 0.45)}V${r(s * 0.45)}`, stroke: color, 'stroke-width': w * 0.7, 'stroke-linecap': 'round'}));
  }
  return g(null,
    h('path', {d: `M${r(-s)} ${r(s * 0.5)}H${r(s)}`, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-s * 0.55)} ${r(s * 0.5)}C${r(-s * 0.05)} ${r(s * 0.5)} ${r(0.05 * s)} ${r(-s * 0.5)} ${r(s * 0.55)} ${r(-s * 0.5)}H${r(s)}`, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round'}),
  );
}

/**
 * Enamel-style sign plaque with a coloured heading band (icon + heading) and
 * a fitted body text. Origin = top-left. With labels hidden the band and icon
 * remain and the body shows placeholder lines.
 * @param {any} ctx
 * @param {{name?:string, x:number, y:number, w:number, heading:string, text:string, color:string, soft:string, headInk:string,
 *   icon:'main'|'branch'|'socket'|null, size:number, headSize?:number, maxLines?:number, minSize?:number, showHead?:boolean, showBody?:boolean, bodyLines?:number}} o
 */
export function plaque(ctx, o) {
  const th = ctx.theme;
  const size = o.size;
  const headSize = o.headSize ?? size * 0.82;
  const pad = Math.round(size * 0.55);
  const iconS = headSize * 0.62;
  const showHead = o.showHead ?? ctx.show('key');
  const showBody = o.showBody ?? ctx.show('key');
  // heading: one line when it fits, else two lines in a taller band (never cut to an ellipsis)
  const hfit = showHead ? ctx.fit(o.heading.toUpperCase(), {maxWidth: o.w - pad * 2 - iconS * 2.6, size: headSize, minSize: headSize * 0.74, maxLines: 2, weight: 800}) : null;
  const bandH = Math.round(Math.max(headSize * 1.75, hfit ? hfit.height + headSize * 0.8 : 0));
  const inner = o.w - pad * 2;
  // bodyH: reserve an empty body area of that height (a datum holder is drawn over it)
  const custom = o.bodyH !== undefined;
  const body = showBody && !custom ? ctx.fit(o.text, {maxWidth: inner, size, minSize: o.minSize ?? size * 0.78, maxLines: o.maxLines ?? 3, weight: 600}) : null;
  const bodyH = custom ? o.bodyH : body ? body.height : size * 1.9;
  const hh = bandH + pad * 0.9 + bodyH + pad;
  const {x, y, w} = o;
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 8, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 12), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: `M${r(x + 12)} ${r(y)}H${r(x + w - 12)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + 12)}V${r(y + bandH)}H${r(x)}V${r(y + 12)}Q${r(x)} ${r(y)} ${r(x + 12)} ${r(y)}Z`, fill: o.color, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
  ];
  const ix = x + pad + iconS;
  const iy = y + bandH / 2;
  if (o.icon === 'socket') parts.push(g({transform: T(ix, iy)}, emblem(ctx, {s: iconS * 0.95, mode: 'socket'})));
  else if (o.icon) parts.push(g({transform: T(ix, iy)}, routeGlyph(o.icon, iconS, o.headInk)));
  if (showHead) {
    const hf = hfit;
    parts.push(textBlock(hf, {x: ix + iconS * 1.6, y: iy - hf.height * 0.5 - hf.size * 0.02, fill: o.headInk, letterSpacing: 0.6}));
  }
  if (custom) {
    // nothing: the caller draws into bodyBox
  } else if (body) {
    parts.push(textBlock(body, {x: x + pad, y: y + bandH + pad * 0.9, fill: th.ink, name: o.name ? `${o.name}-text` : undefined}));
  } else {
    const by = y + bandH + pad * 0.9;
    parts.push(h('rect', {x: x + pad, y: by + 4, width: inner * 0.92, height: size * 0.42, rx: size * 0.21, fill: th.paperLine}));
    parts.push(h('rect', {x: x + pad, y: by + size * 1.1, width: inner * 0.6, height: size * 0.42, rx: size * 0.21, fill: th.paperLine}));
  }
  // screws
  for (const [sx, sy] of [[x + 9, y + hh - 9], [x + w - 9, y + hh - 9]]) parts.push(h('circle', {cx: r(sx), cy: r(sy), r: 3.2, fill: th.inkFaint}));
  return {node: g({name: o.name}, parts), box: {x, y, w, h: hh}, bandH, fit: body, bodyBox: {x: x + pad, y: y + bandH + pad * 0.9, w: inner, h: bodyH}};
}

/** Height a plaque will take (for layout before drawing). */
export function plaqueHeight(ctx, o) {
  return plaque(ctx, {...o, x: 0, y: 0}).box.h;
}

/**
 * Fact card (upright, centred on its origin). A coloured header band carries
 * the heading; the diamond marker sits in a stamped slot at the top-right
 * corner; the body lists the supplied facts (first one bold).
 * @param {any} ctx
 * @param {{prefix:string, w:number, facts:string[], heading:string, marker:string|null, size:number, maxLines?:number,
 *   minH?:number, feature?:{text:string, name:string}|null}} o
 * @returns {{node:any, w:number, h:number, emblem:{x:number,y:number,s:number}, body:any, featureY:number}}
 */
export function factCard(ctx, o) {
  const th = ctx.theme;
  const pal = palette(ctx);
  const P = o.prefix;
  const w = o.w;
  const size = o.size;
  const pad = Math.round(size * 0.55);
  const es = size * 0.95; // emblem half diagonal
  const slot = es * 2.5;
  const show = ctx.show('key');
  // heading: one line when it fits, else two lines in a taller band (never cut to an ellipsis)
  const hs = o.headSize ?? size * 0.78;
  const hfit = show ? ctx.fit(o.heading.toUpperCase(), {maxWidth: w - pad * 2 - slot * 0.8, size: hs, minSize: hs * 0.8, maxLines: 2, weight: 800}) : null;
  const bandH = Math.round(Math.max(size * 1.55, hfit ? hfit.height + pad * 0.9 : 0));
  const lines = [];
  let y = bandH + pad * 0.8;
  const inner = w - pad * 2;
  const blocks = [];
  (o.facts || []).slice(0, 3).forEach((text, i) => {
    const fsz = i === 0 ? size : size * 0.82;
    const f = show ? ctx.fit(text, {maxWidth: inner, size: fsz, minSize: fsz * 0.76, maxLines: i === 0 ? (o.maxLines ?? 3) : 3, weight: i === 0 ? 700 : 500}) : null;
    const bh = f ? f.height : fsz * 0.5;
    blocks.push({f, y, i, fsz});
    y += bh + pad * 0.55;
  });
  // optional reserved "feature" row (contrast / inspect): same height whether or not it is filled
  let featureY = y;
  let featFit = null;
  if (o.feature) {
    const fsz = size * 0.86;
    const fl = o.feature.maxLines ?? 2;
    const reserve = ctx.fit(o.feature.reserveFor || o.feature.text || '', {maxWidth: inner - size * 1.2, size: fsz, minSize: fsz * 0.76, maxLines: fl, weight: 700});
    featFit = show && o.feature.text ? ctx.fit(o.feature.text, {maxWidth: inner - size * 1.2, size: fsz, minSize: fsz * 0.76, maxLines: fl, weight: 700}) : null;
    y += Math.max(reserve.height, fsz, o.feature.minH ?? 0) + pad * 0.7;
  }
  const bottom = o.markerCorner === 'bottom';
  // a bottom-corner slot intrudes into the last row: without a feature row the card grows
  // a little so no text sits under the slot; with a feature row its width is reduced instead
  const intrude = es * 1.4;
  const extraBottom = bottom && !o.feature ? Math.max(0, intrude - pad * 0.5) + 4 : 0;
  const hh = Math.max(o.minH ?? 0, y + pad * 0.5 + extraBottom);
  const x0 = -w / 2, y0 = -hh / 2;
  const left = o.markerSide === 'left';
  // the marker slot straddles a card corner (top by default), so a lens over it leaves the text readable
  const ex = left ? x0 + es * 0.55 : x0 + w - es * 0.55, ey = bottom ? y0 + hh - es * 0.15 : y0 + es * 0.15;
  lines.push(h('path', {d: roundRectPath(x0 + 5, y0 + 8, w, hh, 10), fill: th.shadow}));
  lines.push(h('path', {d: roundRectPath(x0, y0, w, hh, 10), fill: th.paper, stroke: th.ink, 'stroke-width': 2.5}));
  lines.push(h('path', {d: `M${r(x0 + 10)} ${r(y0)}H${r(x0 + w - 10)}Q${r(x0 + w)} ${r(y0)} ${r(x0 + w)} ${r(y0 + 10)}V${r(y0 + bandH)}H${r(x0)}V${r(y0 + 10)}Q${r(x0)} ${r(y0)} ${r(x0 + 10)} ${r(y0)}Z`, fill: pal.ruleSoft, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}));
  // heading
  if (show) {
    const hf = hfit;
    lines.push(textBlock(hf, {x: left ? x0 + w - pad : x0 + pad, y: y0 + bandH / 2 - hf.height * 0.5, fill: shade(pal.rule, -0.3), letterSpacing: 0.8, anchor: left ? 'end' : 'start'}));
  } else {
    lines.push(h('rect', {x: left ? x0 + w - pad - w * 0.22 : x0 + pad, y: y0 + bandH / 2 - 5, width: w * 0.22, height: 10, rx: 5, fill: shade(pal.rule, 0.2), opacity: 0.6}));
  }
  // body
  for (const b of blocks) {
    if (b.f) lines.push(textBlock(b.f, {x: x0 + pad, y: y0 + b.y, fill: b.i === 0 ? th.ink : th.inkSoft}));
    else lines.push(h('rect', {x: x0 + pad, y: y0 + b.y, width: inner * (b.i === 0 ? 0.86 : 0.6), height: b.fsz * 0.42, rx: b.fsz * 0.2, fill: th.paperLine}));
  }
  if (o.feature) {
    const fy = y0 + featureY;
    const fsz = size * 0.86;
    lines.push(h('path', {d: `M${r(x0 + pad)} ${r(fy - pad * 0.3)}H${r(x0 + w - pad)}`, stroke: th.paperLine, 'stroke-width': 1.5}));
    if (o.feature.placeholder !== false) {
      lines.push(h('path', {name: o.feature.name ? `${o.feature.name}-ph` : undefined, d: `M${r(x0 + pad + fsz * 1.2)} ${r(fy + fsz * 0.75)}H${r(x0 + w - pad)}`, stroke: th.inkFaint, 'stroke-width': 2, 'stroke-dasharray': '5 6'}));
    }
    // small diamond bullet (the row carries the condition's feature, when supplied)
    lines.push(g({name: o.feature.name ? `${o.feature.name}-dot` : undefined, opacity: o.feature.dotOpacity ?? 1, transform: T(x0 + pad + fsz * 0.45, fy + fsz * 0.5)}, emblem(ctx, {s: fsz * 0.38, mode: 'present'})));
    if (featFit) lines.push(textBlock(featFit, {x: x0 + pad + fsz * 1.2, y: fy, fill: pal.excInk, name: o.feature.name ? `${o.feature.name}-text` : undefined, opacity: o.feature.textOpacity}));
  }
  // marker slot (stamped frame) at the top-right corner
  lines.push(h('path', {d: roundRectPath(ex - slot / 2 + 3, ey - slot / 2 + 5, slot, slot, 9), fill: th.shadow}));
  lines.push(h('path', {d: roundRectPath(ex - slot / 2, ey - slot / 2, slot, slot, 9), fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}));
  lines.push(h('path', {d: roundRectPath(ex - slot / 2 + 5, ey - slot / 2 + 5, slot - 10, slot - 10, 6), fill: 'none', stroke: th.inkFaint, 'stroke-width': 1.5, 'stroke-dasharray': '4 4'}));
  const marker = o.marker ? g({transform: T(ex, ey)}, emblem(ctx, {name: `${P}-mk`, s: es, mode: o.marker})) : null;
  const node = g({name: P}, lines, marker);
  // extent including the protruding marker slot (relative to the centre)
  const ext = {x: Math.min(x0, ex - slot / 2), y: Math.min(y0, ey - slot / 2)};
  ext.w = Math.max(x0 + w, ex + slot / 2) - ext.x;
  ext.h = Math.max(y0 + hh, ey + slot / 2) - ext.y;
  // the reserved feature row as a box (card-local), clear of a bottom-corner slot
  let featureBox = null;
  if (o.feature) {
    const fsz = size * 0.86;
    const rowH = Math.max(fsz, y - featureY - pad * 0.7);
    const cut = bottom ? slot * 0.62 : 0;
    featureBox = {x: x0 + pad + (bottom && left ? cut : 0), y: y0 + featureY - pad * 0.18, w: inner - cut, h: rowH + pad * 0.36};
  }
  return {node, w, h: hh, emblem: {x: ex, y: ey, s: es}, slot, featureY: y0 + featureY, featureBox, x0, y0, pad, bandH, ext};
}

/**
 * Label holder with a sliding datum tape (inspect treatment). The holder is a
 * recessed rail on the card or plaque; the tape carries the BEFORE insert and,
 * right after it, the AFTER insert. Sliding the tape one window to the left
 * swaps the visible datum without a cross-fade; a strike line marks the old
 * value first, so the change stays traceable. Origin = world (x,y given).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, before:string, after:string, size:number, fitBefore?:any, fitAfter?:any}} o
 */
export function datumTape(ctx, o) {
  const th = ctx.theme;
  const pal = palette(ctx);
  const P = o.prefix;
  const inset = 4;
  const wx = o.x + inset, wy = o.y + inset, ww = o.w - inset * 2, wh = o.h - inset * 2;
  const gap = 10;
  const step = ww + gap;
  const show = ctx.show('key');
  const padX = Math.max(8, o.size * 0.45);
  const fitOf = text => ctx.fit(text, {maxWidth: ww - padX * 2, size: o.size, minSize: o.size * 0.74, maxLines: 4, weight: 700});
  const fb = show ? (o.fitBefore || fitOf(o.before)) : null;
  const fa = show ? (o.fitAfter || fitOf(o.after)) : null;
  const clipId = `${P}-clip`;
  const insert = (dx, f, fill, name, bar) => {
    const parts = [h('path', {d: roundRectPath(wx + dx + 1, wy + 1, ww - 2, wh - 2, 6), fill, stroke: th.inkFaint, 'stroke-width': 1.5})];
    if (f) {
      // centred, so a half-slid tape still shows part of each value
      parts.push(textBlock(f, {x: wx + dx + ww / 2, y: wy + (wh - f.height) / 2, fill: th.ink, name: `${name}-text`, anchor: 'middle'}));
    } else {
      // labels hidden: two distinct bar patterns so the swap still reads
      const by = wy + wh / 2 - o.size * 0.21;
      if (bar === 'a') parts.push(h('rect', {x: wx + dx + padX, y: by, width: (ww - padX * 2) * 0.82, height: o.size * 0.42, rx: o.size * 0.21, fill: th.inkFaint}));
      else {
        parts.push(h('rect', {x: wx + dx + padX, y: by, width: (ww - padX * 2) * 0.4, height: o.size * 0.42, rx: o.size * 0.21, fill: shade(pal.rule, 0.15)}));
        parts.push(h('rect', {x: wx + dx + padX + (ww - padX * 2) * 0.46, y: by, width: (ww - padX * 2) * 0.22, height: o.size * 0.42, rx: o.size * 0.21, fill: shade(pal.rule, 0.15)}));
      }
    }
    return g({name}, parts);
  };
  // strike: one segment through the middle of each line of the old value
  let strikeD = '';
  let strikeLen = 0;
  if (fb) {
    const ty = wy + (wh - fb.height) / 2;
    fb.lines.forEach((ln, i) => {
      const lw = Math.min(ww - padX * 2, ctx.measure ? ctx.measure(ln, fb.size, fb.weight, fb.family) : fb.width);
      const yy = ty + i * fb.lineHeight + fb.size * 0.52;
      const x1 = wx + ww / 2 - lw / 2 - 3, x2 = wx + ww / 2 + lw / 2 + 3;
      strikeD += `M${r(x1)} ${r(yy)}H${r(x2)}`;
      strikeLen += x2 - x1;
    });
  } else {
    const yy = wy + wh / 2;
    strikeD = `M${r(wx + padX - 3)} ${r(yy)}H${r(wx + padX + (ww - padX * 2) * 0.82 + 3)}`;
    strikeLen = (ww - padX * 2) * 0.82 + 6;
  }
  const strike = h('path', {name: `${P}-strike`, d: strikeD, fill: 'none', stroke: th.accent, 'stroke-width': Math.max(3, o.size * 0.13), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(strikeLen + 2)} ${r(strikeLen + 20)}`, 'stroke-dashoffset': r(strikeLen + 2)});
  const node = g({name: P},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {x: r(wx), y: r(wy), width: r(ww), height: r(wh), rx: 6}))),
    // recessed rail
    h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 8), fill: '#8f969d', stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(wx, wy, ww, wh, 6), fill: '#5c636a'}),
    g({'clip-path': ctx.ref(clipId)},
      g({name: `${P}-tape`},
        insert(0, fb, th.paper, `${P}-a`, 'a'),
        strike,
        insert(step, fa, '#eef1f4', `${P}-b`, 'b'),
      ),
    ),
    // rail lips (drawn above the tape so it visibly runs inside the holder)
    h('path', {d: `M${r(o.x + 6)} ${r(o.y + 2.5)}H${r(o.x + o.w - 6)}M${r(o.x + 6)} ${r(o.y + o.h - 2.5)}H${r(o.x + o.w - 6)}`, stroke: '#b9c0c6', 'stroke-width': 3, 'stroke-linecap': 'round'}),
    [o.x + 7, o.x + o.w - 7].map(cx => h('circle', {cx: r(cx), cy: r(o.y + o.h / 2), r: 3.2, fill: '#d6dadd', stroke: th.ink, 'stroke-width': 1.2})),
  );
  /**
   * @param {number} slide 0 = before visible … 1 = after visible
   * @param {number} strikeP 0..1 strike line drawn over the old value
   */
  const pose = (slide, strikeP) => ({
    [`${P}-tape`]: {transform: `translate(${r(-step * slide)} 0)`},
    [`${P}-strike`]: {'stroke-dashoffset': r((strikeLen + 2) * (1 - strikeP))},
  });
  return {node, pose, box: {x: o.x, y: o.y, w: o.w, h: o.h}, step, fitBefore: fb, fitAfter: fa, strikeLines: fb ? fb.lines.length : 1};
}

/** Minimum holder height for two supplied values at a text size (4 lines max). */
export function datumTapeHeight(ctx, {w, before, after, size}) {
  if (!ctx.show('key')) return size * 1.6 + 8;
  const padX = Math.max(8, size * 0.45);
  const hOf = t => ctx.fit(t, {maxWidth: w - 8 - padX * 2, size, minSize: size * 0.74, maxLines: 4, weight: 700}).height;
  return Math.max(hOf(before), hOf(after), size) + size * 0.7 + 8;
}

/**
 * Rectangular reading magnifier drawn over a detail window: dark rim, glare
 * and a handle at one corner. Posed to the window rectangle every frame.
 * @param {any} ctx
 * @param {{prefix:string, handle:number, corner?:'br'|'bl'|'tr'|'tl'}} o
 */
export function readingLens(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const hl = o.handle;
  const hw = Math.max(18, hl * 0.2);
  const node = g({name: P, opacity: 0},
    h('rect', {name: `${P}-rim`, rx: 22, fill: 'none', stroke: '#2b2f33', 'stroke-width': 13}),
    h('rect', {name: `${P}-rimHi`, rx: 22, fill: 'none', stroke: '#6d7780', 'stroke-width': 4}),
    h('line', {name: `${P}-glare`, stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.55}),
    g({name: `${P}-handle`},
      h('path', {d: `M0 ${r(-hw * 0.45)}H${r(hl * 0.22)}V${r(hw * 0.45)}H0Z`, fill: '#9aa4ad', stroke: th.ink, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(hl * 0.2, -hw / 2, hl * 0.8, hw, hw / 2), fill: '#7a4a31', stroke: th.ink, 'stroke-width': 2.4}),
      h('path', {d: `M${r(hl * 0.32)} ${r(-hw * 0.16)}H${r(hl * 0.9)}`, stroke: shade('#7a4a31', 0.3), 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
    ),
  );
  const corner = o.corner || 'br';
  /**
   * @param {{x:number,y:number,w:number,h:number}} R  window rectangle
   * @param {number} vis opacity 0..1
   */
  const frame = (R, vis) => {
    let hx, hy, ang;
    if (corner === 'l' || corner === 'r') {
      // handle on the middle of a side, pointing straight out
      hx = corner === 'l' ? R.x + 5 : R.x + R.w - 5;
      hy = R.y + R.h / 2;
      ang = corner === 'l' ? 180 : 0;
    } else {
      const cx = corner.includes('r') ? R.x + R.w : R.x;
      const cy = corner.includes('b') ? R.y + R.h : R.y;
      ang = corner === 'br' ? 35 : corner === 'bl' ? 145 : corner === 'tr' ? -35 : -145;
      const inset = 8;
      hx = cx + (corner.includes('r') ? -inset : inset);
      hy = cy + (corner.includes('b') ? -inset : inset);
    }
    const rect = {x: r(R.x), y: r(R.y), width: r(Math.max(1, R.w)), height: r(Math.max(1, R.h))};
    return {
      [P]: {opacity: r(vis, 3)},
      [`${P}-rim`]: rect,
      [`${P}-rimHi`]: rect,
      [`${P}-glare`]: {x1: r(R.x + R.w * 0.06), y1: r(R.y + R.h * 0.34), x2: r(R.x + R.w * 0.16), y2: r(R.y + R.h * 0.1)},
      [`${P}-handle`]: {transform: T(hx, hy, ang)},
    };
  };
  return {node, frame};
}

/**
 * Flat wagon oriented along +x, centred on its origin (the card rides on it).
 */
export function wagon(ctx, {name, along, across}) {
  const th = ctx.theme;
  const pal = palette(ctx);
  const planks = [];
  for (let i = 1; i < 6; i++) {
    const x = -along / 2 + (along * i) / 6;
    planks.push(`M${r(x)} ${r(-across / 2 + 6)}V${r(across / 2 - 6)}`);
  }
  const bx = along / 2 + 7;
  return g({name},
    h('rect', {x: -along / 2 + 4, y: -across / 2 + 8, width: along, height: across, rx: 12, fill: th.shadow}),
    h('rect', {x: -along / 2, y: -across / 2, width: along, height: across, rx: 12, fill: pal.wagon, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: planks.join(''), stroke: shade(pal.wagon, -0.25), 'stroke-width': 2}),
    [-1, 1].flatMap(sx => [-1, 1].map(sy => h('circle', {cx: r(sx * bx), cy: r(sy * across * 0.27), r: 7, fill: '#c9c2b4', stroke: th.ink, 'stroke-width': 2}))),
  );
}

/**
 * Hand-held magnifier. The body (rim + handle) is posed in world space; the
 * glass shows a REAL magnified copy of world content (clipped circle whose
 * zoom transform keeps the point under the lens centre fixed).
 * @param {any} ctx
 * @param {{prefix:string, R:number, handle:number, content:any}} o
 */
export function magnifier(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const R = o.R;
  const rim = Math.max(8, R * 0.14);
  const clipId = `${P}-clip`;
  const view = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${P}-clipc`, r: r(R - rim / 2)}))),
    g({name: `${P}-view`, 'clip-path': ctx.ref(clipId), opacity: 0}, g({name: `${P}-zoom`}, o.content)),
  );
  const hw = R * 0.3;
  const body = g({name: P},
    h('circle', {r: R, fill: '#dff0f7', opacity: 0.18}),
    h('path', {d: `M${r(R - 2)} ${r(-hw * 0.55)}H${r(R + o.handle * 0.2)}V${r(hw * 0.55)}H${r(R - 2)}Z`, fill: '#9aa4ad', stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(R + o.handle * 0.18, -hw / 2, o.handle * 0.82, hw, hw / 2), fill: '#7a4a31', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: `M${r(R + o.handle * 0.3)} ${r(-hw * 0.18)}H${r(R + o.handle * 0.9)}`, stroke: shade('#7a4a31', 0.3), 'stroke-width': 2.5, 'stroke-linecap': 'round'}),
    h('circle', {r: R, fill: 'none', stroke: '#2b2f33', 'stroke-width': rim}),
    h('circle', {r: R, fill: 'none', stroke: '#6d7780', 'stroke-width': rim * 0.35}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.2)}A${r(R * 0.66)} ${r(R * 0.66)} 0 0 1 ${r(-R * 0.18)} ${r(-R * 0.62)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': Math.max(3, R * 0.07), 'stroke-linecap': 'round', opacity: 0.8}),
  );
  const grip = R + o.handle * 0.62;
  /**
   * @param {{x:number,y:number}} C lens centre (world)
   * @param {number} angleDeg handle direction
   * @param {number} zoom magnification of the glass view
   * @param {number} viewOn 0..1 visibility of the magnified copy
   */
  // `focus` (default: the lens centre) is the world point shown at the centre of the glass: a
  // lens held slightly off a detail (so it does not cover nearby text) still shows that detail
  const frame = (C, angleDeg, zoom, viewOn = 1, focus = C) => ({
    [P]: {transform: T(C.x, C.y, angleDeg)},
    [`${P}-clipc`]: {cx: r(C.x), cy: r(C.y)},
    [`${P}-view`]: {opacity: r(viewOn, 3)},
    [`${P}-zoom`]: {transform: `translate(${r(C.x)} ${r(C.y)}) scale(${r(zoom, 4)}) translate(${r(-focus.x)} ${r(-focus.y)})`},
  });
  const centreFromGrip = (hand, angleDeg) => ({x: hand.x - Math.cos(angleDeg * DEG) * grip, y: hand.y - Math.sin(angleDeg * DEG) * grip});
  return {view, body, frame, grip, centreFromGrip, R};
}

/**
 * Stand magnifier (lupa on a swing arm) used by the contrast and inspect
 * scenes: a base beside the track, an arm that swings the lens over the
 * checkpoint. Local origin = base centre; the lens hangs at distance `reach`.
 */
export function standMagnifier(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const R = o.R;
  const rim = Math.max(7, R * 0.14);
  const clipId = `${P}-clip`;
  const view = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${P}-clipc`, r: r(R - rim / 2)}))),
    g({name: `${P}-view`, 'clip-path': ctx.ref(clipId), opacity: 0}, g({name: `${P}-zoom`}, o.content)),
  );
  const base = g({transform: T(o.base.x, o.base.y)},
    h('circle', {r: R * 0.62, fill: th.shadow, cx: 4, cy: 6}),
    h('circle', {r: R * 0.62, fill: '#4a525a', stroke: th.ink, 'stroke-width': 2.5}),
    h('circle', {r: R * 0.28, fill: '#8c959f', stroke: th.ink, 'stroke-width': 2}),
  );
  const arm = h('line', {name: `${P}-arm`, stroke: '#4a525a', 'stroke-width': Math.max(10, R * 0.26), 'stroke-linecap': 'round'});
  const armHi = h('line', {name: `${P}-armhi`, stroke: '#8c959f', 'stroke-width': Math.max(3, R * 0.08), 'stroke-linecap': 'round'});
  const lensRim = g({name: P},
    h('circle', {r: R, fill: '#dff0f7', opacity: 0.18}),
    h('circle', {r: R, fill: 'none', stroke: '#2b2f33', 'stroke-width': rim}),
    h('circle', {r: R, fill: 'none', stroke: '#6d7780', 'stroke-width': rim * 0.35}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.2)}A${r(R * 0.66)} ${r(R * 0.66)} 0 0 1 ${r(-R * 0.18)} ${r(-R * 0.62)}`, fill: 'none', stroke: '#fff', 'stroke-width': Math.max(3, R * 0.07), 'stroke-linecap': 'round', opacity: 0.8}),
  );
  const frame = (C, zoom, viewOn) => ({
    [P]: {transform: T(C.x, C.y)},
    [`${P}-arm`]: {x1: r(o.base.x), y1: r(o.base.y), x2: r(C.x), y2: r(C.y)},
    [`${P}-armhi`]: {x1: r(o.base.x), y1: r(o.base.y), x2: r(C.x), y2: r(C.y)},
    [`${P}-clipc`]: {cx: r(C.x), cy: r(C.y)},
    [`${P}-view`]: {opacity: r(viewOn, 3)},
    [`${P}-zoom`]: {transform: `translate(${r(C.x)} ${r(C.y)}) scale(${r(zoom, 4)}) translate(${r(-C.x)} ${r(-C.y)})`},
  });
  return {base, arm: g(null, arm, armHi), view, lens: lensRim, frame};
}

/**
 * The connector of the junction: switch blade (pivoting at the fork), lever
 * frame with a sliding knob, the throw rod between them, the swing gate on
 * the branch with its condition socket, and the lit-route overlays.
 * @param {any} ctx
 * @param {{prefix:string, geom:ReturnType<typeof junctionGeom>, lever?:{x:number,y:number,dir:{x:number,y:number},slot:number}|null, socketS?:number}} o
 */
export function junctionParts(ctx, o) {
  const th = ctx.theme;
  const pal = palette(ctx);
  const P = o.prefix;
  const G = o.geom;
  const gw = G.gauge;
  // ground: both beds first, then rails
  const bed = g(null,
    trackArt(ctx, {pts: G.branchPts, gauge: gw, layer: 'bed'}),
    trackArt(ctx, {pts: G.mainPts, gauge: gw, layer: 'bed'}),
  );
  const rails = g(null,
    trackArt(ctx, {pts: G.branchPts, gauge: gw, layer: 'rails'}),
    trackArt(ctx, {pts: G.mainPts, gauge: gw, layer: 'rails'}),
  );
  const endAngle = Math.atan2(G.d.y, G.d.x) / DEG;
  const buffers = o.buffers === false ? null : g(null,
    bufferStop(ctx, {x: G.E.x - G.d.x * 20, y: G.E.y - G.d.y * 20, angle: endAngle, gauge: gw, color: shade(pal.rule, -0.1)}),
    bufferStop(ctx, {x: G.EB.x - G.d.x * 20, y: G.EB.y - G.d.y * 20, angle: endAngle, gauge: gw, color: shade(pal.exc, -0.15)}),
  );
  // lit routes (drawn progressively when a route is set)
  const mainLight = polyline([G.S, G.E]);
  const branchLight = G.branchOnly;
  const lightNode = (name, poly, color) => h('path', {name, d: poly.d(1), fill: 'none', stroke: color, 'stroke-width': r(gw * 1.55), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.4, 'stroke-dasharray': `${r(poly.total)} ${r(poly.total + 20)}`, 'stroke-dashoffset': r(poly.total)});
  const lights = g(null,
    lightNode(`${P}-litM`, mainLight, pal.rule),
    lightNode(`${P}-litB`, branchLight, pal.exc),
  );
  // blade
  const bl = G.blade.len;
  const blade = g({name: `${P}-blade`},
    h('path', {d: `M0 -8L${r(bl)} -4Q${r(bl + 7)} 0 ${r(bl)} 4L0 8Z`, fill: '#3b434b', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M6 -3H${r(bl - 6)}`, stroke: '#9aa4ad', 'stroke-width': 2, 'stroke-linecap': 'round'}),
  );
  const pivot = h('circle', {cx: r(G.S.x), cy: r(G.S.y), r: 11, fill: '#c9c2b4', stroke: th.ink, 'stroke-width': 2.5});
  // lever frame
  let leverNode = null, rodNode = null;
  const L = o.lever;
  if (L) {
    const a = Math.atan2(L.dir.y, L.dir.x) / DEG;
    const bw = 58, bh = L.slot + 70;
    leverNode = g(null,
      g({transform: T(L.x, L.y, a - 90)},
        h('rect', {x: -bw / 2 + 4, y: -bh / 2 + 6, width: bw, height: bh, rx: 12, fill: th.shadow}),
        h('rect', {x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: 12, fill: '#5b646d', stroke: th.ink, 'stroke-width': 2.5}),
        h('rect', {x: -7, y: -L.slot / 2, width: 14, height: L.slot, rx: 7, fill: '#2b3036'}),
      ),
      h('line', {name: `${P}-leverStick`, stroke: '#2b3036', 'stroke-width': 9, 'stroke-linecap': 'round'}),
      g({name: `${P}-knob`},
        h('circle', {r: 17, fill: pal.exc, stroke: th.ink, 'stroke-width': 2.5}),
        h('circle', {r: 7, cx: -4, cy: -4, fill: '#fff', opacity: 0.55})),
    );
    rodNode = g(null,
      h('line', {name: `${P}-rod`, stroke: '#2b3036', 'stroke-width': 7, 'stroke-linecap': 'round'}),
      h('line', {name: `${P}-rodHi`, stroke: '#9aa4ad', 'stroke-width': 2, 'stroke-linecap': 'round'}),
    );
  }
  // gate: post + striped boom (rotating) and the condition socket on the post
  const gl = G.gate.len;
  const gate = o.gate === false ? null : g(null,
    g({name: `${P}-boom`},
      h('rect', {x: 0, y: -7.5, width: gl, height: 15, rx: 7.5, fill: '#fff', stroke: th.ink, 'stroke-width': 2.2}),
      h('path', {d: `M14 0H${r(gl - 8)}`, stroke: th.accent, 'stroke-width': 11, 'stroke-dasharray': '14 14'}),
    ),
    h('circle', {cx: r(G.post.x), cy: r(G.post.y), r: 14, fill: '#4a525a', stroke: th.ink, 'stroke-width': 2.5}),
  );
  const sockR = o.socketS ?? gw * 0.5;
  const socketAt = {x: G.post.x + G.gate.away.x * (sockR * 1.35 + 20), y: G.post.y + G.gate.away.y * (sockR * 1.35 + 20)};
  const leverAt = p => (L ? {x: L.x + L.dir.x * L.slot * (p - 0.5), y: L.y + L.dir.y * L.slot * (p - 0.5)} : null);
  const bladeAngle = p => G.blade.mainAngle + (G.blade.branchAngle - G.blade.mainAngle) * p;
  const bladeTip = p => ({x: G.S.x + Math.cos(bladeAngle(p) * DEG) * bl, y: G.S.y + Math.sin(bladeAngle(p) * DEG) * bl});
  /**
   * @param {{blade:number, gate:number, lever?:number, litMain:number, litBranch:number}} s
   */
  function pose(s) {
    const nodes = {};
    nodes[`${P}-blade`] = {transform: T(G.S.x, G.S.y, bladeAngle(s.blade))};
    if (gate) nodes[`${P}-boom`] = {transform: T(G.post.x, G.post.y, G.gate.closedAngle + (G.gate.openAngle - G.gate.closedAngle) * s.gate)};
    nodes[`${P}-litM`] = {'stroke-dashoffset': r(mainLight.total * (1 - s.litMain))};
    nodes[`${P}-litB`] = {'stroke-dashoffset': r(branchLight.total * (1 - s.litBranch))};
    if (L) {
      const k = leverAt(s.lever ?? 0);
      const base = {x: L.x - L.dir.x * L.slot * 0.5, y: L.y - L.dir.y * L.slot * 0.5};
      nodes[`${P}-knob`] = {transform: T(k.x, k.y)};
      nodes[`${P}-leverStick`] = {x1: r(L.x), y1: r(L.y), x2: r(k.x), y2: r(k.y)};
      // rod: from the lever frame's track-side end to a lug on the blade
      const lug = {x: G.S.x + Math.cos(bladeAngle(s.blade) * DEG) * bl * 0.62, y: G.S.y + Math.sin(bladeAngle(s.blade) * DEG) * bl * 0.62};
      const shift = (s.lever ?? 0) * 10;
      const from = {x: base.x - L.dir.x * (18 - shift), y: base.y - L.dir.y * (18 - shift)};
      nodes[`${P}-rod`] = {x1: r(from.x), y1: r(from.y), x2: r(lug.x), y2: r(lug.y)};
      nodes[`${P}-rodHi`] = {x1: r(from.x), y1: r(from.y), x2: r(lug.x), y2: r(lug.y)};
    }
    return nodes;
  }
  return {bed, rails, buffers, lights, blade, pivot, lever: leverNode, rod: rodNode, gate, pose, leverAt, bladeTip, bladeAngle, postAt: G.post, socketAt};
}

/** Axis-aligned overlap test with padding. */
export function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Bounding box of a card placed at centre c. */
export function cardBox(card, c) {
  if (card.ext) return {x: c.x + card.ext.x, y: c.y + card.ext.y, w: card.ext.w, h: card.ext.h};
  return {x: c.x - card.w / 2, y: c.y - card.h / 2, w: card.w, h: card.h};
}

/** Sweep box of a card moving along a route between two distances (sampled). */
export function sweepBoxes(route, from, to, card, step = 40) {
  const out = [];
  const n = Math.max(1, Math.ceil(Math.abs(to - from) / step));
  for (let i = 0; i <= n; i++) {
    const p = cartAt(route, from + ((to - from) * i) / n);
    out.push(cardBox(card, p));
  }
  return out;
}

/* ------------------------------------------------------ exploded pieces */

/** Axis helpers shared by the pieces. */
export const AXES = AX;

/**
 * Swing gate on a post: striped boom rotating about the post. Local frame is
 * world-aligned; `closedAngle` spans the track, `openAngle` lies beside it.
 */
export function gateArt(ctx, {prefix, post, len}) {
  const th = ctx.theme;
  const node = g(null,
    g({name: `${prefix}-boom`},
      h('rect', {x: 0, y: -7.5, width: r(len), height: 15, rx: 7.5, fill: '#fff', stroke: th.ink, 'stroke-width': 2.2}),
      h('path', {d: `M14 0H${r(len - 8)}`, stroke: th.accent, 'stroke-width': 11, 'stroke-dasharray': '14 14'}),
    ),
    h('circle', {cx: r(post.x), cy: r(post.y), r: 14, fill: '#4a525a', stroke: th.ink, 'stroke-width': 2.5}),
  );
  return {node, pose: angle => ({[`${prefix}-boom`]: {transform: T(post.x, post.y, angle)}})};
}

/**
 * A straight track piece from (0,0) along the axis: bed, rails, optional
 * buffer at its far end, optional gate near its start and a lit-route overlay.
 * @param {any} ctx
 * @param {{prefix:string, axis:'h'|'v', len:number, gauge:number, buffer?:string|null, gate?:{at:number, side:1|-1}|null, light:string}} o
 */
export function trackPiece(ctx, o) {
  const {d, n} = AX[o.axis];
  const gw = o.gauge;
  const pts = [{x: 0, y: 0}, {x: d.x * o.len, y: d.y * o.len}];
  const angle = Math.atan2(d.y, d.x) / DEG;
  const lit = polyline(pts);
  const parts = [
    trackArt(ctx, {pts, gauge: gw, layer: 'bed'}),
    h('path', {name: `${o.prefix}-lit`, d: lit.d(1), fill: 'none', stroke: o.light, 'stroke-width': r(gw * 1.55), 'stroke-linecap': 'round', opacity: 0.42, 'stroke-dasharray': `${r(lit.total)} ${r(lit.total + 20)}`, 'stroke-dashoffset': r(lit.total)}),
    trackArt(ctx, {pts, gauge: gw, layer: 'rails'}),
  ];
  if (o.buffer) parts.push(bufferStop(ctx, {x: d.x * (o.len - 20), y: d.y * (o.len - 20), angle, gauge: gw, color: o.buffer}));
  let gate = null;
  let gateAngles = null;
  if (o.gate) {
    const side = o.gate.side;
    const post = {x: d.x * o.gate.at + n.x * side * gw * 1.35, y: d.y * o.gate.at + n.y * side * gw * 1.35};
    const away = {x: n.x * side, y: n.y * side};
    const closed = Math.atan2(-away.y, -away.x) / DEG;
    let delta = Math.atan2(-d.y, -d.x) / DEG - closed;
    while (delta > 180) delta -= 360;
    while (delta <= -180) delta += 360;
    gate = gateArt(ctx, {prefix: `${o.prefix}-gate`, post, len: gw * 2.55});
    gateAngles = {closed, open: closed + delta, post, away};
    parts.push(gate.node);
  }
  const across = gw * 1.4;
  const box = o.axis === 'h' ? {x: -8, y: -across, w: o.len + 16, h: across * 2} : {x: -across, y: -8, w: across * 2, h: o.len + 16};
  const pose = s => {
    const out = {[`${o.prefix}-lit`]: {'stroke-dashoffset': r(lit.total * (1 - (s.lit ?? 0)))}};
    if (gate) Object.assign(out, gate.pose(gateAngles.closed + (gateAngles.open - gateAngles.closed) * (s.gate ?? 0)));
    return out;
  };
  return {node: g(null, parts), box, pose, gateAngles, end: pts[1]};
}

/**
 * Scenario header for the paired boards: letter badge, label and caption with
 * enough vertical room that the label's descenders never meet the caption
 * (fits within o.h; sizes shrink within a bound for long labels). Returns
 * {node, truncated} so a caller can grow the band when meaning would be cut.
 * @param {any} ctx
 * @param {{name:string, letter:string, label:string, caption?:string, x:number, y:number, w:number, h:number, color:string}} o
 */
export function scenarioHead(ctx, o) {
  const th = ctx.theme;
  const hasCap = Boolean(o.caption) && ctx.show('all');
  // label + caption stack: 1.22·s + 0.2·s gap + 1.22·(0.6·s) ≈ 2.15·s must fit in h
  const size = Math.min(52, hasCap ? o.h / 2.2 : o.h / 1.35);
  const badgeR = Math.min(size * 0.78, o.h * 0.42);
  const cy = o.y + badgeR + 2;
  const parts = [h('circle', {cx: r(o.x + badgeR), cy: r(cy), r: r(badgeR), fill: o.color, stroke: th.ink, 'stroke-width': 2.5})];
  let truncated = false;
  let capFit = null;
  if (ctx.show('key')) {
    const lf = ctx.fit(o.letter, {maxWidth: badgeR * 1.6, size: badgeR * 1.15, maxLines: 1, weight: 800});
    parts.push(textBlock(lf, {x: o.x + badgeR, y: cy - lf.size * 0.5, anchor: 'middle', fill: '#fff'}));
    const tx = o.x + badgeR * 2 + 16;
    const mw = o.w - badgeR * 2 - 20;
    // label + caption are fitted together: the label may shrink (within a bound) so the
    // caption keeps its whole meaning on up to three lines; cut only as a last resort
    const fitLabel = k => ctx.fit(o.label, {maxWidth: mw, size: size * k, minSize: size * k * 0.92, maxLines: k >= 0.92 ? 1 : 2, weight: 700});
    const fitCap = (room, minC) => {
      let best = null;
      for (const cs of [size * 0.6, size * 0.55, size * 0.5, size * 0.45, minC]) {
        const c = Math.max(minC, cs);
        const lines = Math.max(1, Math.min(3, Math.floor(room / (c * 1.22))));
        const f2 = ctx.fit(o.caption, {maxWidth: mw, size: c, minSize: c, maxLines: lines, weight: 500});
        best = f2;
        if (!f2.truncated && f2.height <= room + 1) return f2;
      }
      return best;
    };
    let f = null;
    let f2 = null;
    const capRoom = hasCap ? 0.64 : 1;
    // first pass keeps the caption at a readable size (label shrinks first); second pass relaxes it
    let done = false;
    for (const minC of hasCap ? [Math.max(18, size * 0.5), 15] : [15]) {
      for (const k of [1, 0.92, 0.84, 0.76, 0.68, 0.6]) {
        f = fitLabel(k);
        if (f.truncated || f.height > o.h * capRoom + 2) continue;
        if (!hasCap) { done = true; break; }
        f2 = fitCap(o.h + 4 - f.height - f.size * 0.3, minC);
        if (!f2.truncated && f2.height <= o.h + 5 - f.height - f.size * 0.3) { done = true; break; }
      }
      if (done) break;
    }
    if (!f || f.truncated) f = fitLabel(0.6);
    if (hasCap && !f2) f2 = fitCap(o.h + 4 - f.height - f.size * 0.3, 15);
    truncated = Boolean(f.truncated || (f2 && (f2.truncated || f2.height > o.h + 5 - f.height - f.size * 0.3)));
    capFit = f2;
    const stackH = f.height + (f2 ? f.size * 0.3 + f2.size * 0.2 + f2.height : 0);
    const top = f.lines.length > 1 || (f2 && f2.lines.length > 1) ? o.y + Math.max(0, (o.h - stackH) * 0.25) : o.y + Math.max(0, badgeR + 2 - f.size * 0.6);
    parts.push(textBlock(f, {x: tx, y: top, fill: th.fg}));
    if (f2) parts.push(textBlock(f2, {x: tx, y: top + f.height + f.size * 0.3 + f2.size * 0.2, fill: th.fgSoft}));
  }
  const node = g({name: o.name}, parts);
  // callers that can grow the header band read `truncated` and the caption size
  return {node, truncated, capSize: capFit ? capFit.size : null};
}

/* ------------------------------------------- live links (mechanism treatment) */

/**
 * Parametric interval [tIn, tOut] of the ray O + t·D (|D| = 1) through a shape
 * ({x,y,w,h} rectangle or {x,y,r} circle), or null when it misses.
 */
export function rayInterval(O, D, s) {
  if (s.r !== undefined) {
    const fx = O.x - s.x, fy = O.y - s.y;
    const b = fx * D.x + fy * D.y;
    const c = fx * fx + fy * fy - s.r * s.r;
    const disc = b * b - c;
    if (disc < 0) return null;
    const q = Math.sqrt(disc);
    return [-b - q, -b + q];
  }
  let t0 = -Infinity, t1 = Infinity;
  for (const [o, d, lo, hi] of [[O.x, D.x, s.x, s.x + s.w], [O.y, D.y, s.y, s.y + s.h]]) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return null;
      continue;
    }
    let a = (lo - o) / d, b = (hi - o) / d;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return null;
  }
  return [t0, t1];
}

const unit = (a, b) => {
  const L = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return {D: {x: (b.x - a.x) / L, y: (b.y - a.y) / L}, L};
};

/**
 * Point where a ray from `from` (inside a part) toward `to` leaves the chain of
 * the part's shapes it starts in — a link leaves the part from its real edge.
 */
export function exitPoint(shapes, from, to) {
  const {D} = unit(from, to);
  let t = 0;
  let changed = true;
  for (let k = 0; changed && k < 12; k++) {
    changed = false;
    for (const s of shapes) {
      const iv = rayInterval(from, D, s);
      if (iv && iv[0] <= t + 0.5 && iv[1] > t + 1e-6) { t = iv[1]; changed = true; }
    }
  }
  return {x: from.x + D.x * t, y: from.y + D.y * t};
}

/** Point where a ray from `from` toward `to` first enters one of the shapes (the landing edge). */
export function entryPoint(shapes, from, to) {
  const {D, L} = unit(from, to);
  let best = Infinity;
  for (const s of shapes) {
    const iv = rayInterval(from, D, s);
    if (iv && iv[1] >= 0) best = Math.min(best, Math.max(0, iv[0]));
  }
  if (!Number.isFinite(best)) best = L;
  return {x: from.x + D.x * best, y: from.y + D.y * best};
}

/** Distance from a point to the outline of a shape (0 = exactly on its edge). */
export function edgeDistance(p, s) {
  if (s.r !== undefined) return Math.abs(Math.hypot(p.x - s.x, p.y - s.y) - s.r);
  const inside = p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h;
  if (!inside) return Math.hypot(Math.max(s.x - p.x, 0, p.x - s.x - s.w), Math.max(s.y - p.y, 0, p.y - s.y - s.h));
  return Math.min(p.x - s.x, s.x + s.w - p.x, p.y - s.y, s.y + s.h - p.y);
}

/**
 * A relationship link whose ends are recomputed every frame, so it stays on the
 * parts' edges while they move apart, grow or gather. Visual kinds follow
 * primitives/annotate.js LINK_STYLES (a plain relation never has an arrowhead);
 * draw-on progress is an explicit dash pattern, so dashed kinds draw on too.
 * @param {any} ctx
 * @param {{name:string, kind:string, color:string}} o
 */
export function liveLink(ctx, o) {
  const st = LINK_STYLES[o.kind] || LINK_STYLES.relation;
  const N = o.name;
  const headLen = st.width * 4.6;
  const node = g({name: N, opacity: 0},
    h('path', {name: `${N}-line`, d: 'M0 0', fill: 'none', stroke: o.color, 'stroke-width': st.width, 'stroke-linecap': st.dash ? 'butt' : 'round'}),
    st.arrow ? h('path', {name: `${N}-head`, d: `M0 0L${r(-headLen)} ${r(-headLen * 0.55)}L${r(-headLen * 0.72)} 0L${r(-headLen)} ${r(headLen * 0.55)}Z`, fill: o.color, opacity: 0}) : null,
    st.endDots ? h('circle', {name: `${N}-dotA`, r: r(st.width * 1.7), fill: o.color, opacity: 0}) : null,
    st.endDots ? h('circle', {name: `${N}-dotB`, r: r(st.width * 1.7), fill: o.color, opacity: 0}) : null,
  );
  const dash = st.dash ? st.dash.split(/\s+/).map(Number) : null;
  /** Curve between two landing points with a gentle perpendicular bend. */
  const curve = (A, B, bend) => {
    const dx = B.x - A.x, dy = B.y - A.y;
    const c1 = {x: A.x + dx * 0.3 - dy * bend, y: A.y + dy * 0.3 + dx * bend};
    const c2 = {x: A.x + dx * 0.7 - dy * bend, y: A.y + dy * 0.7 + dx * bend};
    const pts = [];
    for (let i = 0; i <= 32; i++) pts.push(cubic(A, c1, c2, B, i / 32));
    const poly = polyline(pts);
    const end = Math.atan2(B.y - c2.y, B.x - c2.x) / DEG;
    return {A, B, c1, c2, poly, total: poly.total, at: t => poly.at(clamp(t)), endAngle: end};
  };
  /** Frame record for a curve drawn to progress p (0..1). */
  const frame = (cv, p) => {
    const Ld = cv.total * p;
    let arr;
    if (p >= 1) arr = dash ? dash.join(' ') : 'none';
    else if (!dash) arr = `${r(Ld)} ${r(cv.total + 20)}`;
    else {
      const out = [];
      let acc = 0;
      while (acc + dash[0] < Ld && out.length < 400) { out.push(dash[0], dash[1]); acc += dash[0] + dash[1]; }
      out.push(Math.max(0, Math.min(dash[0], Ld - acc)), cv.total + 20);
      arr = out.map(v => r(v)).join(' ');
    }
    const d = `M${r(cv.A.x)} ${r(cv.A.y)}C${r(cv.c1.x)} ${r(cv.c1.y)} ${r(cv.c2.x)} ${r(cv.c2.y)} ${r(cv.B.x)} ${r(cv.B.y)}`;
    const out = {[N]: {opacity: p > 0 ? 1 : 0}, [`${N}-line`]: {d, 'stroke-dasharray': arr}};
    if (st.arrow) out[`${N}-head`] = {transform: T(cv.B.x, cv.B.y, cv.endAngle), opacity: p >= 0.985 ? 1 : 0};
    if (st.endDots) {
      out[`${N}-dotA`] = {cx: r(cv.A.x), cy: r(cv.A.y), opacity: p > 0 ? 1 : 0};
      out[`${N}-dotB`] = {cx: r(cv.B.x), cy: r(cv.B.y), opacity: p >= 0.985 ? 1 : 0};
    }
    return out;
  };
  return {node, curve, frame, style: st};
}

/**
 * Tracer token: a round signal token (≈38 units) with a halo ring, clearly
 * visible at video size. Drawn under the relation labels.
 */
export function tracerToken(ctx, name) {
  const c = ctx.theme.accent;
  return g({name, opacity: 0},
    h('circle', {r: 32, fill: c, opacity: 0.16}),
    h('circle', {r: 32, fill: 'none', stroke: c, 'stroke-width': 2.5, opacity: 0.6}),
    h('circle', {r: 19, fill: c, stroke: '#ffffff', 'stroke-width': 4}),
    h('circle', {r: 19, fill: 'none', stroke: ctx.theme.ink, 'stroke-width': 1.5, opacity: 0.6}),
    h('circle', {r: 6.5, fill: '#ffffff'}),
  );
}
