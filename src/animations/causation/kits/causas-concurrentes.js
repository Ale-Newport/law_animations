/**
 * Motif kit for "Causas concurrentes" (LAW-0689..0692): two supplied routes
 * that each reach the same supplied loss, shown side by side and never added
 * together.
 *
 * Physical model (original vector art; the event die faces, the vase on its
 * display plinth, the link seals and the striped barricades are the category
 * pilot's art, imported read-only from ./causal-chain.js):
 *
 *  - Each route is a MARBLE RUN: a back panel with sloped planks, one plank
 *    per supplied event in the supplied order (a die face on the plank gives
 *    its position, the plank colour gives its route). The planks zig-zag
 *    down the panel; at each turn the marble drops through a gap against a
 *    wall onto the next plank — that drop is the LINK between two events and
 *    a link seal pops on the plank's lip as the marble passes it.
 *  - A striped release gate (a barrier) holds each marble at the top of its
 *    first plank. When it swings open the marble rolls down under gravity
 *    (a deterministic kinematic simulation computed once per layout: rolling
 *    with (5/7)·g·sin α, ballistic drops, wall stops, landings).
 *  - Both runs end on the SAME vase, which stands on a plinth between the two
 *    racks: route A's last plank reaches its left shoulder, route B's last
 *    plank its right shoulder. Each marble comes to rest against the vase on
 *    its own side and leaves its own crack. The two runs never join, never
 *    feed one container and nothing is summed: two separate contact points.
 *  - Unresolved mode (a supplied disputed link held): a pause pin stands on
 *    that plank's lip; the marble rests against it and a dashed ghost path and
 *    ghost marble show where it would go. The kit never decides the link.
 *  - Alternatives put forward are striped barricades standing on the floor in
 *    front of their route, tied to their link by a dotted tether; they never
 *    touch the marble's path.
 *
 * The kit owns geometry, art and the pose solver only. Each entry owns its own
 * timeline, layout, labels and semantics.
 * Legal content: every route is "as supplied"; no apportionment, share,
 * weight, fault, liability, causation test or outcome is stated or inferred.
 * @module animations/causation/kits/causas-concurrentes
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {str, int, oneOf, list, obj} from '../../../schemas/fields.js';
import {dieFace, lossArt, plinthArt, barrierArt} from './causal-chain.js';
import {chipG, fitG, balancedG, calloutG} from './prueba-contrafactual.js';

export {chipG, fitG, balancedG, calloutG};

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const ROUTES = ['a', 'b'];
const eventList = which => list(`Events of route ${which} in the supplied order; its marble passes them in this order (2–5)`, obj('Event', {
  label: str('Event label (fictional, descriptive)', 70),
  time: str('Optional relative time label, e.g. "T+2 min" (shown as supplied)', 20),
}, ['label']), 2, 5);

export const ccFields = {
  events: obj('The events of each route, in the supplied order', {a: eventList('A'), b: eventList('B')}, ['a', 'b']),
  causalLinks: list('Per-link data. Link i of a route joins its event i to event i+1; the link after its last event joins it to the loss. Links not listed are proposed sequence links.', obj('Link', {
    route: oneOf('Route of the link', ROUTES),
    from: int('Index (0-based) of the event where the link starts', 0, 4),
    kind: oneOf('sequence (default) or causal; a causal link is only labelled so when supplied here', ['sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); the animation never resolves it', ['proposed', 'disputed']),
    label: str('Optional caption for this link', 50),
  }, ['route', 'from']), 0, 6),
  alternatives: list('Alternative or intervening events put forward by someone; drawn as a barricade in front of a route, tied to one of its links, never decided', obj('Alternative', {
    label: str('Alternative event label', 70),
    route: oneOf('Route it is put forward against', ROUTES),
    link: int('Index of the link it is put forward against', 0, 4),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label', 'route', 'link']), 0, 2),
  losses: list('The loss as described. Both routes reach the first entry (the vase); a second entry is an extra description of the same loss', obj('Loss', {
    label: str('Description of the loss (label hypothetical amounts as hypothetical)', 80),
  }, ['label']), 1, 2),
  routeLabels: obj('Names of the two supplied routes (the comparison Causa A / causa B)', {
    a: str('Name of route A', 40),
    b: str('Name of route B', 40),
  }, ['a', 'b']),
};

export const CC_STRINGS = {
  en: {
    route: 'Route',
    lossAs: 'Loss (as described)',
    alternative: 'Alternative put forward',
    link: 'Link',
    kindSequence: 'sequence',
    kindCausal: 'causal (as supplied)',
    disputedLink: 'disputed link',
    proposed: 'proposed',
    unresolved: 'unresolved',
    toLoss: 'loss',
    key: 'As supplied · routes not added up · no conclusion drawn',
    reaches: 'reaches the loss (as supplied)',
    heldAt: 'held at a disputed link (unresolved)',
    notRun: 'not run in this scene',
    released: 'released',
    closed: 'gate closed',
    event: 'Event',
    status: 'status',
  },
  es: {
    route: 'Ruta',
    lossAs: 'Pérdida (según se describe)',
    alternative: 'Alternativa planteada',
    link: 'Eslabón',
    kindSequence: 'secuencia',
    kindCausal: 'causal (según lo aportado)',
    disputedLink: 'eslabón discutido',
    proposed: 'propuesto',
    unresolved: 'sin resolver',
    toLoss: 'pérdida',
    key: 'Según lo aportado · rutas sin sumar · sin conclusión',
    reaches: 'llega a la pérdida (según lo aportado)',
    heldAt: 'detenida en un eslabón discutido (sin resolver)',
    notRun: 'no se ejecuta en esta escena',
    released: 'liberada',
    closed: 'compuerta cerrada',
    event: 'Evento',
    status: 'estado',
  },
};

/**
 * Normalize the two routes: one link record per event (n events → n links,
 * the last one ending at the loss). Out-of-range indices are ignored.
 * @param {any} p params
 */
export function resolveRoutes(p) {
  const routes = {};
  for (const k of ROUTES) {
    const events = p.events[k];
    const n = events.length;
    const links = Array.from({length: n}, (_, i) => ({route: k, from: i, kind: 'sequence', status: 'proposed', label: ''}));
    for (const l of p.causalLinks || []) {
      if (l.route === k && l.from < n) Object.assign(links[l.from], {kind: l.kind || 'sequence', status: l.status || 'proposed', label: l.label || ''});
    }
    const disputed = links.findIndex(l => l.status === 'disputed');
    routes[k] = {key: k, events, n, links, disputed: disputed === -1 ? null : disputed, name: p.routeLabels ? p.routeLabels[k] : k.toUpperCase()};
  }
  const alternatives = (p.alternatives || []).filter(a => a.link < routes[a.route].n).map(a => ({...a, status: a.status || 'alleged'}));
  return {routes, alternatives, losses: p.losses};
}

/** Text of link i of a route for a legend: "Link A2 → A3" / "Link A3 → loss". */
export function linkName(t, route, i) {
  const L = route.key.toUpperCase();
  return `${t.link} ${L}${i + 1} → ${i + 1 < route.n ? `${L}${i + 2}` : t.toLoss}`;
}

/* ------------------------------------------------------------------------ */
/* Colours: two lanes of EQUAL saturation and lightness (different hue)      */
/* ------------------------------------------------------------------------ */

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const rr = ((n >> 16) & 255) / 255, gg = ((n >> 8) & 255) / 255, bb = (n & 255) / 255;
  const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb);
  const l = (mx + mn) / 2;
  let hh = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    hh = mx === rr ? (gg - bb) / d + (gg < bb ? 6 : 0) : mx === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
    hh *= 60;
  }
  return [hh, s, l];
}

function hslToHex(hh, s, l) {
  const f = k => {
    const kk = (k + hh / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(kk - 3, 9 - kk, 1));
  };
  return '#' + [f(0), f(8), f(4)].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
}

/** Lane colours: route A = the palette's accent2; route B = the same saturation and lightness, hue + 84°. */
export function routeColors(ctx) {
  const th = ctx.theme;
  const [hh, s, l] = hexToHsl(th.accent2);
  const b = hslToHex((hh + 84) % 360, s, l);
  const soft = c => { const [h2, s2] = hexToHsl(c); return hslToHex(h2, Math.min(0.45, s2), 0.9); };
  return {a: th.accent2, b, aSoft: soft(th.accent2), bSoft: soft(b), of: k => (k === 'a' ? th.accent2 : b), softOf: k => (k === 'a' ? soft(th.accent2) : soft(b))};
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

/** Marble: route-coloured glass ball with a highlight. Local origin = centre. */
export function marbleArt(ctx, {name, R, color, opacity, route}) {
  const th = ctx.theme;
  return g({name, opacity},
    h('circle', {r: r(R), fill: color, stroke: th.ink, 'stroke-width': 2.2}),
    h('path', {d: `M${r(-R * 0.62)} ${r(R * 0.1)}A${r(R * 0.62)} ${r(R * 0.62)} 0 0 0 ${r(R * 0.1)} ${r(R * 0.62)}`, fill: 'none', stroke: shade(color, -0.35), 'stroke-width': r(Math.max(2, R * 0.16)), 'stroke-linecap': 'round'}),
    // second, palette-independent route cue: a solid (A) or dashed (B) inner ring of equal weight
    route ? routeMark(ctx, {x: R * 0.2, y: R * 0.22, s: R * 0.78, route}) : null,
    h('circle', {cx: r(-R * 0.34), cy: r(-R * 0.36), r: r(R * 0.24), fill: '#ffffff', opacity: 0.75}),
  );
}

/**
 * Palette-independent route cue, symmetric and non-ranking: a solid white
 * marker with the same ink outline and weight for both routes — a disc (●)
 * for route A, a diamond (◆) for route B. Dashes are reserved for "disputed".
 * Local origin = marker centre; s = marker height.
 */
export function routeMark(ctx, {x = 0, y = 0, s, route, fill = '#ffffff'}) {
  const th = ctx.theme;
  const w = r(Math.max(1.2, s * 0.12));
  if (route === 'b') {
    const q = s * 0.56;
    return h('path', {d: `M${r(x)} ${r(y - q)}L${r(x + q)} ${r(y)}L${r(x)} ${r(y + q)}L${r(x - q)} ${r(y)}Z`, fill, stroke: th.ink, 'stroke-width': w, 'stroke-linejoin': 'round'});
  }
  return h('circle', {cx: r(x), cy: r(y), r: r(s * 0.42), fill, stroke: th.ink, 'stroke-width': w});
}

/** Die face with the route cue: a solid (A) or dashed (B) white inset frame. Local origin = top-left. */
export function routeDie(ctx, {s, k, route, fill}) {
  return g(null,
    dieFace(ctx, {s, k, fill, pip: '#ffffff'}),
    // route marker badge on the die's top-right corner (● A / ◆ B)
    h('circle', {cx: r(s), cy: 0, r: r(s * 0.26), fill, stroke: ctx.theme.ink, 'stroke-width': 1.5}),
    routeMark(ctx, {x: s, y: 0, s: s * 0.3, route}));
}

/** Small legend / header icons. */
export function marbleIcon(ctx, {x, y, s, color}) {
  return g({transform: T(x + s / 2, y + s / 2)}, marbleArt(ctx, {R: s * 0.42, color}));
}

/** Route badge (disc + letter; the letter is text and follows textVisibility). */
export function routeBadge(ctx, {name, x, y, R, color, letter, fill, plain}) {
  const th = ctx.theme;
  const fs = Math.max(R * 1.05, 17); // the letter is text: never under the 16 px floor
  const key = ctx.show('key');
  const RR = key ? Math.max(R, fs * 0.8) : R;
  const route = letter === 'B' ? 'b' : 'a';
  // pill: letter (labels shown) + the route marker (● A / ◆ B); marker alone when labels are hidden
  const mS = RR * 0.95;
  const w = plain ? RR * 2 : key ? RR * 2 + mS + 4 : RR * 2;
  return g({name},
    h('rect', {name: name ? `${name}-disc` : undefined, x: r(x - RR), y: r(y - RR), width: r(w), height: r(2 * RR), rx: r(RR), fill: fill ?? color, stroke: th.ink, 'stroke-width': 2.5}),
    key ? h('text', {x: r(x), y: r(y + fs * 0.35), 'text-anchor': 'middle', 'font-size': r(fs), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, letter) : null,
    plain ? null : routeMark(ctx, {x: key ? x + RR + mS * 0.5 - 1 : x, y, s: mS, route}),
  );
}

/** Width of a routeBadge pill of radius R (its left edge is x − R). */
export function badgeWidth(ctx, R) {
  const fs = Math.max(R * 1.05, 17);
  const RR = ctx.show('key') ? Math.max(R, fs * 0.8) : R;
  return ctx.show('key') ? RR * 2 + RR * 0.95 + 4 : RR * 2;
}

/**
 * Link seal (the pilot's joint marker, redrawn without text so it never falls
 * under the 16 px floor): linked rings for a proposed link, a dashed ring with
 * a split bar for a disputed one. Local origin = centre; starts hidden.
 */
export function sealArt(ctx, {name, disputed, radius = 15, opacity = 0}) {
  const th = ctx.theme;
  const R = radius;
  const col = disputed ? th.accent : th.accent4;
  return g({name, opacity},
    h('circle', {r: r(R + 6), fill: col, opacity: 0.18}),
    h('circle', {r: r(R), fill: th.card, stroke: col, 'stroke-width': 3.2, 'stroke-dasharray': disputed ? '5 4' : null}),
    disputed
      ? h('path', {d: `M${r(-R * 0.5)} 0H${r(-R * 0.12)}M${r(R * 0.12)} 0H${r(R * 0.5)}`, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round'})
      : g(null,
        h('ellipse', {cx: r(-R * 0.22), cy: 0, rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4}),
        h('ellipse', {cx: r(R * 0.22), cy: 0, rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4})),
  );
}

/* ------------------------------------------------------------------------ */
/* Marble-run stage                                                         */
/* ------------------------------------------------------------------------ */

const DEG = Math.PI / 180;
const G = 3000; // design units / s² (only relative timing matters: runs are normalized)
const TAN_MAX = Math.tan(24 * DEG);
const TAN_MIN = Math.tan(2.5 * DEG);
export const VASE_W = 0.58; // vase width / height (pilot proportions)
export const PLINTH_H = 0.36; // plinth height / vase height
export const SHOULDER = 0.62; // marble contact height on the vase (× vase height above the plinth)
export const FLOOR_T = 34; // floor slab thickness below the floor line

/**
 * Metrics shared by layouts: marble radius, plank thickness, the least drop
 * between planks and the height one route needs for n planks of a given span.
 * @param {number} V vase height
 */
export function runMetrics(V) {
  const R = Math.max(10, V * 0.075);
  const bt = Math.max(9, R * 0.62);
  const dropMin = 2 * R + bt + 10;
  const head = 3.6 * R;
  return {R, bt, dropMin, head, vw: V * VASE_W};
}

/** Drawn vase height for rack metric V and a requested enlargement k (the plinth keeps ≥ 12 units). */
export function vaseHeight(V, k = 1, sh = SHOULDER, contactK = PLINTH_H + SHOULDER, minPlinth = 12) {
  return Math.min(V * k, (V * contactK - minPlinth) / sh);
}

/** Least rack height (top of the rack → floor line) for n planks spanning `span` (horizontal) with vase height V. */
export function rackNeed(n, span, V, contactK = PLINTH_H + SHOULDER) {
  const m = runMetrics(V);
  const contactAbove = V * contactK; // marble centre above the floor at the vase
  return contactAbove + m.R + m.head + n * span * TAN_MIN + (n - 1) * m.dropMin;
}

/**
 * Build the two-route marble-run stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {{x:number,y:number,w:number,h:number}} o.box  stage box (top of the racks → bottom of the floor slab)
 * @param {number} o.V  vase height
 * @param {ReturnType<typeof resolveRoutes>} o.C  resolved routes
 * @param {number} [o.outer=0]  room kept free outside each rack (presenters)
 * @param {{a:number|null,b:number|null}} [o.held]  link index where a route is held (unresolved mode)
 * @param {boolean} [o.levers]  draw a release lever on each rack's outer post
 * @param {number} [o.leverY]  y of the lever pivots
 * @param {boolean} [o.barriers=true] draw the alternatives as barricades
 */
export function concurrentStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const col = routeColors(ctx);
  const {x: bx, y: by, w: bw, h: bh} = o.box;
  const V = o.V;
  const M = runMetrics(V);
  const {R, bt, dropMin, head} = M;
  const F = by + bh - FLOOR_T; // floor line
  const cx = bx + bw / 2;
  // vaseK > 1 draws a larger vase on a lower plinth: the contact height (and so every plank) stays the same
  // (o.shoulder < SHOULDER lets the marbles meet a larger vase lower on its body)
  const sh = o.shoulder ?? SHOULDER;
  const contactK = o.contactK ?? PLINTH_H + SHOULDER; // marble contact height above the floor (× V)
  const Vv = vaseHeight(V, o.vaseK ?? 1, sh, contactK, o.minPlinth ?? 12);
  const vw = Vv * VASE_W;
  const yC = F - V * contactK; // marble centre at the vase
  const plinthTop = yC + Vv * sh;
  const plinthW = vw + 44;
  const vs = vw * 0.47; // vase half-width at the contact height
  const wt = 10; // wall thickness
  const dz = 2 * R + 14; // drop zone (gap before a wall)
  const gapIn = 2.4 * R;
  const outer = o.outer ?? 0;
  const held = o.held || {a: null, b: null};
  let rackTop = by;

  const racks = {};
  for (const k of ROUTES) {
    const s = k === 'a' ? 1 : -1;
    const route = o.C.routes[k];
    const n = route.n;
    const xOut = s > 0 ? bx + outer : bx + bw - outer;
    const xIn = cx - s * (vw / 2 + gapIn);
    const W = Math.abs(xIn - xOut);
    const X = u => xOut + s * u;
    const xc = cx - s * (vs + R); // marble centre at the vase
    const uc = Math.abs(xc - xOut);
    // plank spans in u (from the outer face), direction d = +1 toward the vase
    const boards = [];
    for (let i = 0; i < n; i++) {
      const inward = (n - 1 - i) % 2 === 0;
      const last = i === n - 1;
      let uH, uL;
      if (inward) { uH = wt + 2; uL = last ? uc + R * 0.35 : W - wt - dz; } else { uH = W - wt - 2; uL = wt + dz; }
      boards.push({i, d: inward ? 1 : -1, uH, uL, span: Math.abs(uL - uH), last});
    }
    // vertical solve: fill the room between the head of the rack and the vase contact
    const yLowLast = yC + R * 1.01;
    const avail = yLowLast - (rackTop + head);
    const sumSpan = boards.reduce((a, b) => a + b.span, 0);
    let tan = (avail - (n - 1) * dropMin) / sumSpan;
    let drop = dropMin;
    const fits = tan >= TAN_MIN - 1e-9;
    tan = clamp(tan, TAN_MIN, TAN_MAX);
    if (n > 1) drop = Math.min(dropMin * 4.5, Math.max(dropMin, (avail - sumSpan * tan) / (n - 1)));
    const cos = 1 / Math.sqrt(1 + tan * tan), sin = tan * cos;
    // bottom-up so the last plank always ends at the vase
    for (let i = n - 1; i >= 0; i--) {
      const b = boards[i];
      b.yL = i === n - 1 ? yLowLast : boards[i + 1].yH - drop;
      b.yH = b.yL - b.span * tan;
    }
    const surf = (b, u) => b.yH + Math.abs(u - b.uH) * tan;
    const topSurface = boards[0].yH;
    // inner wall bottom: clear of the last plank and of the marble riding on it
    const lastB = boards[n - 1];
    const innerBottom = surf(lastB, W - wt) - 2 * R - 8;

    // ---- gate + rest position on plank 0
    const b0 = boards[0];
    const uRest = b0.uH + b0.d * (R + 3);
    const uGate = uRest + b0.d * (R + R * 0.3 + 4);
    const gateLen = 2.5 * R;
    const gatePivot = {x: X(uGate), y: surf(b0, uGate) - gateLen - 2};
    const pinFor = held[k];

    // ---- simulation (u, y) → samples
    const sim = simulateRun({boards, tan, cos, sin, R, W, wt, uc, uRest, surf, stopAt: null});
    const heldSim = pinFor != null && pinFor < n - 1 ? simulateRun({boards, tan, cos, sin, R, W, wt, uc, uRest, surf, stopAt: pinFor}) : null;
    racks[k] = {k, s, n, route, xOut, xIn, W, X, xc, uc, boards, tan, cos, sin, drop, fits, surf, topSurface, innerBottom, uRest, uGate, gatePivot, gateLen, sim, heldSim, held: heldSim ? pinFor : null};
  }

  // fitTop: the panels start just above the highest first plank (no empty panel above the run)
  if (o.fitTop) rackTop = Math.max(by, Math.min(...ROUTES.map(k => racks[k].topSurface)) - head);
  // gate stems and levers hang from the (final) top rail
  // ---- nodes
  const floorL = bx - 10, floorR = bx + bw + 10;
  const floor = g({name: `${P}-floor`},
    h('path', {d: `M${r(floorL)} ${r(F - 26)}H${r(floorR)}L${r(floorR + 8)} ${r(F + 10)}H${r(floorL - 8)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(floorL - 8)} ${r(F + 10)}H${r(floorR + 8)}V${r(F + FLOOR_T - 2)}H${r(floorL - 8)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    [0.35, 0.68].map(f => h('path', {d: `M${r(floorL + 4)} ${r(F - 26 + 36 * f)}H${r(floorR - 4)}`, stroke: shade(th.woodTop, -0.12), 'stroke-width': 1.5})),
  );

  const panelFill = th.dark ? '#3a3f46' : '#ece6da';
  const rackBack = [];
  const rackFront = [];
  const boardNodes = [];
  const gateNodes = [];
  const leverNodes = [];
  const pinNodes = [];
  const ghostNodes = [];
  const jointNodes = [];
  const joints = {};
  for (const k of ROUTES) {
    const K = racks[k];
    const {s, X, W, boards, n} = K;
    const c = col.of(k);
    const x0 = Math.min(K.xOut, K.xIn), x1 = Math.max(K.xOut, K.xIn);
    const pTop = rackTop;
    // back panel (pegboard) standing on two feet
    const dots = [];
    const step = Math.max(26, R * 2);
    for (let yy = pTop + step * 0.8; yy < F - 34; yy += step) {
      for (let xx = x0 + step * 0.7; xx < x1 - step * 0.4; xx += step) dots.push(`M${r(xx)} ${r(yy)}h0.01`);
    }
    rackBack.push(g({name: `${P}-rack${k}`},
      h('path', {d: roundRectPath(x0, pTop, x1 - x0, F - 30 - pTop, 12), fill: panelFill, stroke: th.ink, 'stroke-width': th.stroke}),
      h('path', {d: dots.join(''), stroke: th.dark ? '#50565e' : '#cfc6b6', 'stroke-width': Math.max(4, R * 0.28), 'stroke-linecap': 'round'}),
      // top rail in the lane colour (identical weight for both lanes)
      h('path', {d: roundRectPath(x0 - 6, pTop - 8, x1 - x0 + 12, 16, 6), fill: c, stroke: th.ink, 'stroke-width': 2}),
      [0.2, 0.5, 0.8].map(f => routeMark(ctx, {x: x0 + (x1 - x0) * f, y: pTop, s: 12, route: k})),
      // feet
      [x0 + 18, x1 - 18].map(fx => h('path', {d: roundRectPath(fx - 14, F - 34, 28, 10, 3), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5})),
    ));
    // walls (outer full height, inner down to above the last plank)
    const wallX = u0 => Math.min(X(u0), X(u0 + wt));
    rackFront.push(g({name: `${P}-walls${k}`},
      h('path', {d: roundRectPath(wallX(0), pTop + 6, wt, F - 36 - pTop, 3), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: roundRectPath(wallX(W - wt), pTop + 6, wt, Math.max(10, K.innerBottom - pTop - 6), 3), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    ));
    // planks (lane colour, die face at the high end, lip rail)
    boards.forEach((b, i) => {
      const xa = X(b.uH), xb = X(b.uL);
      const ya = b.yH, yb = b.yL;
      const dx = xb - xa, dy = yb - ya;
      const Lb = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx) / DEG;
      const ds = Math.min(bt * 2.6, Lb * 0.18, 44);
      const bracket = (f) => {
        const px = xa + dx * f, py = ya + dy * f;
        return h('path', {d: `M${r(px)} ${r(py + bt)}L${r(px - s * 0)} ${r(py + bt + R * 0.9)}`, stroke: th.metalDark, 'stroke-width': 4, 'stroke-linecap': 'round'});
      };
      boardNodes.push(g({name: `${P}-board${k}${i}`},
        bracket(0.22), bracket(0.78),
        g({transform: `translate(${r(xa)} ${r(ya)}) rotate(${r(ang, 3)})`},
          h('path', {d: roundRectPath(0, 0, Lb, bt, Math.min(5, bt / 2)), fill: c, stroke: th.ink, 'stroke-width': 2.2}),
          h('path', {d: `M${r(5)} ${r(bt * 0.3)}H${r(Lb - 5)}`, stroke: '#ffffff', 'stroke-width': 2, opacity: 0.35}),
          routeMark(ctx, {x: Lb * 0.55, y: bt / 2, s: Math.max(8, bt * 0.8), route: k}),
        ),
        // die face (order in the route) hanging from the plank's high end
        g({transform: T(xa + (s * b.d > 0 ? 6 : -ds - 6), ya + bt + 4)}, routeDie(ctx, {s: ds, k: i + 1, fill: c, route: k})),
      ));
    });
    // gate (striped arm hanging from a bracket; opens by swinging downhill and up)
    const b0 = boards[0];
    const gw = Math.max(8, R * 0.55);
    const gl = K.gateLen;
    const gp = K.gatePivot;
    const stripes = [];
    for (let yy = 0; yy < gl; yy += gw * 1.1) stripes.push(h('path', {d: `M${r(-gw / 2)} ${r(yy)}h${r(gw)}v${r(Math.min(gw * 0.55, gl - yy))}h${r(-gw)}Z`, fill: th.accent}));
    const clipId = `${P}-gclip${k}`;
    gateNodes.push(g(null,
      h('path', {d: `M${r(gp.x)} ${r(gp.y)}V${r(rackTop + 4)}`, stroke: th.metalDark, 'stroke-width': 4}),
      h('circle', {cx: r(gp.x), cy: r(gp.y), r: r(gw * 0.55), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
      g({name: `${P}-gate${k}`, transform: T(gp.x, gp.y)},
        h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(-gw / 2, 0, gw, gl, gw * 0.3)}))),
        h('path', {d: roundRectPath(-gw / 2, 0, gw, gl, gw * 0.3), fill: '#ffffff'}),
        g({'clip-path': ctx.ref(clipId)}, stripes),
        h('path', {d: roundRectPath(-gw / 2, 0, gw, gl, gw * 0.3), fill: 'none', stroke: th.ink, 'stroke-width': 2}),
      ),
    ));
    K.gateSwing = b0.d * s; // rotate toward downhill (+1 = clockwise when downhill is +x)
    if (o.locks) {
      // neutral padlock clipped to the gate bar: "this route is not run in this scene"
      const L0 = Math.max(12, R * 0.85);
      const lx = gp.x, ly = gp.y + gl * 0.55;
      K.lockAt = {x: lx, y: ly, r: L0};
      gateNodes.push(g({name: `${P}-lock${k}`, opacity: 0, transform: T(lx, ly)},
        h('path', {d: `M${r(-L0 * 0.45)} 0V${r(-L0 * 0.55)}A${r(L0 * 0.45)} ${r(L0 * 0.45)} 0 0 1 ${r(L0 * 0.45)} ${r(-L0 * 0.55)}V0`, fill: 'none', stroke: th.ink, 'stroke-width': r(Math.max(3.5, L0 * 0.28))}),
        h('path', {d: `M${r(-L0 * 0.45)} 0V${r(-L0 * 0.55)}A${r(L0 * 0.45)} ${r(L0 * 0.45)} 0 0 1 ${r(L0 * 0.45)} ${r(-L0 * 0.55)}V0`, fill: 'none', stroke: th.metal, 'stroke-width': r(Math.max(1.5, L0 * 0.12))}),
        h('path', {d: roundRectPath(-L0 * 0.75, -L0 * 0.1, L0 * 1.5, L0 * 1.2, L0 * 0.25), fill: th.inkSoft, stroke: th.ink, 'stroke-width': 2}),
        h('circle', {cx: 0, cy: r(L0 * 0.45), r: r(L0 * 0.16), fill: th.ink}),
      ));
    }
    // release lever on the outer post (story): cable up the post and along the top to the gate
    if (o.levers) {
      const px = X(wt / 2), py = o.leverY;
      const armL = Math.max(46, R * 3.2);
      const cable = `M${r(px)} ${r(py)}V${r(rackTop + 14)}H${r(gp.x)}V${r(gp.y - 2)}`;
      K.lever = {pivot: {x: px, y: py}, armL, dir: -s};
      rackFront.push(h('path', {d: cable, fill: 'none', stroke: th.metalDark, 'stroke-width': 2.5, 'stroke-dasharray': '1 0'}));
      rackFront.push(h('circle', {cx: r(px), cy: r(rackTop + 14), r: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}));
      rackFront.push(h('circle', {cx: r(gp.x), cy: r(rackTop + 14), r: 6, fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}));
      leverNodes.push(g({name: `${P}-lever${k}`, transform: T(px, py)},
        h('path', {d: `M0 0H${r(-s * armL)}`, stroke: th.ink, 'stroke-width': 9, 'stroke-linecap': 'round'}),
        h('path', {d: `M0 0H${r(-s * armL)}`, stroke: th.metalDark, 'stroke-width': 5.5, 'stroke-linecap': 'round'}),
        h('circle', {cx: r(-s * armL), cy: 0, r: 11, fill: th.accent, stroke: th.ink, 'stroke-width': 2}),
        h('circle', {cx: 0, cy: 0, r: 7, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
      ));
    }
    // pause pin + ghost path (unresolved mode)
    if (K.held != null) {
      const b = boards[K.held];
      const pu = b.uL;
      const pinW = Math.max(6, R * 0.4);
      pinNodes.push(g({name: `${P}-pin${k}`},
        h('path', {d: roundRectPath(X(pu) - pinW / 2, b.yL - 1.7 * R, pinW, 1.7 * R + 2, pinW / 2), fill: th.inkSoft, stroke: th.ink, 'stroke-width': 1.5}),
        h('circle', {cx: r(X(pu)), cy: r(b.yL - 1.7 * R), r: r(pinW * 0.8), fill: th.card, stroke: th.ink, 'stroke-width': 1.5})));
      const tStop = K.heldSim.T;
      const pts = [];
      const S = K.sim;
      for (let j = 0; j < S.t.length; j += 6) if (S.t[j] >= tStop) pts.push({x: X(S.u[j]), y: S.y[j]});
      pts.push({x: X(S.u[S.t.length - 1]), y: S.y[S.t.length - 1]});
      ghostNodes.push(g({name: `${P}-ghost${k}`, opacity: 0},
        h('path', {d: pts.map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: c, 'stroke-width': 3, 'stroke-dasharray': '3 9', 'stroke-linecap': 'round', opacity: 0.85}),
        h('circle', {cx: r(K.xc), cy: r(yC), r: r(R), fill: 'none', stroke: c, 'stroke-width': 2.6, 'stroke-dasharray': '6 5'})));
    }
    // link seals on each plank's lip (the last one where the marble meets the vase)
    joints[k] = boards.map((b, i) => ({x: X(b.uL), y: b.yL + bt * 0.5}));
    boards.forEach((b, i) => jointNodes.push(sealArt(ctx, {name: `${P}-joint${k}${i}`, disputed: K.route.links[i].status === 'disputed', radius: Math.max(11, R * 0.72)})));
    // inspect: the substituted link gets a second seal with the other status (swapped in by pose)
    if (o.swapLink && o.swapLink.k === k) {
      const i = o.swapLink.i;
      jointNodes.push(sealArt(ctx, {name: `${P}-jointalt${k}${i}`, disputed: o.swapLink.toDisputed, radius: Math.max(11, R * 0.72)}));
    }
  }

  // ---- vase, plinth, cracks, shards
  const plinth = plinthArt(ctx, {x: cx - plinthW / 2, top: plinthTop, w: plinthW, floorY: F + 6});
  const vase = lossArt(ctx, {name: `${P}-vase`, w: vw, h: Vv, kind: 'vase'});
  const vaseNode = g({name: `${P}-vaseg`, transform: T(cx + vw / 2, plinthTop)}, vase.node);
  const cracks = {};
  const crackNodes = [];
  const shardNodes = [];
  for (const k of ROUTES) {
    const s = k === 'a' ? 1 : -1;
    const x0 = cx - s * vs, y0 = yC;
    const rel = [[0, 0], [0.13, 0.05], [0.09, 0.14], [0.22, 0.22], [0.17, 0.33], [0.27, 0.42]];
    const pts = rel.map(([fx, fy]) => ({x: x0 + s * fx * vw, y: y0 + fy * Vv}));
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
    cracks[k] = {len, from: {x: x0, y: y0}, pts};
    crackNodes.push(g(null,
      h('path', {name: `${P}-crackw${k}`, d, fill: 'none', stroke: '#fff7e6', 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len), opacity: 0.7}),
      h('path', {name: `${P}-crack${k}`, d, fill: 'none', stroke: th.ink, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)})));
    const shapes = [[[0, 0], [16, -6], [8, 10]], [[0, 0], [12, 4], [2, 12]]];
    shapes.forEach((sh, j) => shardNodes.push(h('path', {name: `${P}-shard${k}${j}`, d: `M${sh.map(q => `${r(q[0] * s * V / 260)} ${r(q[1] * V / 260)}`).join('L')}Z`, fill: th.accent3, stroke: th.ink, 'stroke-width': 1.5, 'stroke-linejoin': 'round', opacity: 0})));
  }

  // ---- marbles
  const marbleNodes = ROUTES.map(k => marbleArt(ctx, {name: `${P}-marble${k}`, R, color: col.of(k), route: k}));

  // ---- alternatives: barricades on the floor in front of their route, tethered to the link
  const bars = (o.barriers === false ? [] : o.C.alternatives).map((a, j) => {
    const K = racks[a.route];
    const jp = joints[a.route][a.link];
    const bwid = Math.min(V * 0.62, K.W * 0.4);
    const bhh = Math.min(V * 0.55, (yC + R + bt) - F - 20 < 0 ? F - (yC + R + bt) - 24 : V * 0.5);
    const x0 = Math.min(K.xOut, K.xIn), x1 = Math.max(K.xOut, K.xIn);
    const lo = x0 + (K.s > 0 ? 0.42 : 0.12) * (x1 - x0) + bwid / 2, hi = x1 - (K.s > 0 ? 0.12 : 0.42) * (x1 - x0) - bwid / 2;
    const bxc = clamp(jp.x, Math.min(lo, hi), Math.max(lo, hi)) + (j && o.C.alternatives[0].route === a.route ? K.s * bwid * 1.1 : 0);
    const top = {x: bxc, y: F - 22 - bhh + 4};
    const node = g({name: `${P}-alt${j}`},
      h('path', {d: `M${r(top.x)} ${r(top.y)}L${r(jp.x)} ${r(jp.y + Math.max(11, R * 0.72))}`, stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '2 7', 'stroke-linecap': 'round'}),
      g({transform: T(bxc, F - 22)}, barrierArt(ctx, {name: `${P}-alt${j}-a`, w: bwid, h: bhh})));
    return {a, node, top, box: {x: bxc - bwid / 2, y: top.y - 4, w: bwid, h: F - 22 - top.y + 4}, joint: jp};
  });

  const back = g({name: `${P}-back`}, floor, rackBack, bars.map(b => b.node));
  const main = g({name: `${P}-main`},
    g({name: `${P}-plinth`}, plinth), vaseNode, crackNodes, shardNodes,
    rackFront, boardNodes, ghostNodes, pinNodes, gateNodes, marbleNodes, jointNodes, leverNodes);
  const node = g({name: P}, back, main);

  /**
   * Pose the stage.
   * @param {{a:number,b:number}} tau  run time of each route (0 = release, 1 = the unheld marble reaches the vase)
   * @param {{gate?:{a:number,b:number}, lever?:{a:number,b:number}, released?:{a:boolean,b:boolean}}} [st]
   */
  function pose(tau, st = {}) {
    const nodes = {};
    const sem = {marbles: {}, state: {}, joints: {}, cracked: {}, contact: {}, board: {}, gateOpen: {}, ghost: {}};
    let anyHit = 0;
    for (const k of ROUTES) {
      const K = racks[k];
      const rel = st.released ? st.released[k] !== false : true;
      const tk = rel ? tau[k] : 0;
      const Sfull = K.sim;
      const S = K.heldSim ?? Sfull;
      const t = clamp(tk, 0, 10) * Sfull.T;
      const q = sampleAt(S, t);
      const x = K.X(q.u), y = q.y;
      nodes[`${P}-marble${k}`] = {transform: `translate(${r(x)} ${r(y)}) rotate(${r(q.rot, 1)})`};
      sem.marbles[k] = {x: r(x), y: r(y)};
      sem.raw = sem.raw || {};
      sem.raw[k] = {x: x - cx, y: y - F}; // stage-relative, unrounded (for scene comparisons)
      sem.board[k] = q.k;
      const reached = rel && !K.heldSim && t >= Sfull.T - 1e-9;
      const isHeld = rel && K.heldSim && t >= K.heldSim.T - 1e-9;
      sem.state[k] = !rel || tk <= 0 ? 'rest' : reached ? 'at-loss' : isHeld ? 'held' : 'rolling';
      // gate
      const gOpen = clamp(st.gate ? st.gate[k] : (rel && tk > 0 ? 1 : 0));
      sem.gateOpen[k] = r(gOpen, 3);
      nodes[`${P}-gate${k}`] = {transform: `translate(${r(K.gatePivot.x)} ${r(K.gatePivot.y)}) rotate(${r(-K.gateSwing * 78 * ease.inOutCubic(gOpen), 2)})`};
      if (K.lockAt) {
        const lk = clamp(st.lock ? st.lock[k] : 0);
        nodes[`${P}-lock${k}`] = {opacity: r(clamp(lk * 2), 3), transform: T(K.lockAt.x, K.lockAt.y - (1 - ease.outCubic(lk)) * K.lockAt.r * 2.2)};
        sem.lock = sem.lock || {};
        sem.lock[k] = r(lk, 3);
      }
      if (K.lever) {
        const lp = clamp(st.lever ? st.lever[k] : 0);
        nodes[`${P}-lever${k}`] = {transform: `translate(${r(K.lever.pivot.x)} ${r(K.lever.pivot.y)}) rotate(${r(K.s * 32 * lp, 2)})`};
      }
      // joints: pop as the marble leaves each lip (the last one when it meets the vase)
      sem.joints[k] = [];
      K.boards.forEach((b, i) => {
        const tl = i === K.n - 1 ? Sfull.T : Sfull.leave[i];
        const stopHere = K.heldSim ? i >= K.held : false;
        const on = rel && Number.isFinite(tl) && t >= tl - 1e-9 && !stopHere;
        const pop = on ? clamp((t - tl) / (0.05 * Sfull.T)) : 0;
        const jp = joints[k][i];
        let kk = on ? (ctx.reduced ? 1 : 0.6 + 0.4 * ease.outBack(pop)) : 0.6;
        let op = on ? clamp(pop * 3) : 0;
        if (o.swapLink && o.swapLink.k === k && o.swapLink.i === i) {
          // old seal shrinks out first, then the new one grows in (never both at full size)
          const sw = clamp(st.swap ?? 0);
          const out = clamp(sw * 2), inn = clamp(sw * 2 - 1);
          nodes[`${P}-jointalt${k}${i}`] = {transform: T(jp.x, jp.y, 0, 0.3 + 0.7 * ease.outCubic(inn)), opacity: on ? r(inn, 3) : 0};
          kk *= 1 - 0.7 * ease.inCubic(out);
          op *= 1 - out;
          sem.swap = r(sw, 3);
        }
        nodes[`${P}-joint${k}${i}`] = {transform: T(jp.x, jp.y, 0, kk), opacity: r(op, 3)};
        sem.joints[k].push(on);
      });
      // crack + shards from this route's contact point only
      const hitT = reached || (rel && !K.heldSim && tk >= 1) ? 1 : 0;
      const cp = hitT ? clamp((t - Sfull.T) / (0.1 * Sfull.T)) : 0;
      if (hitT) anyHit++;
      const cr = cracks[k];
      nodes[`${P}-crack${k}`] = {'stroke-dashoffset': r(cr.len * (1 - ease.outCubic(cp)))};
      nodes[`${P}-crackw${k}`] = {'stroke-dashoffset': r(cr.len * (1 - ease.outCubic(cp)))};
      sem.cracked[k] = r(cp, 3);
      for (let j = 0; j < 2; j++) {
        const sp = hitT ? clamp((t - Sfull.T) / (0.14 * Sfull.T)) : 0;
        const from = {x: cr.from.x + K.s * (j ? 6 : 14), y: cr.from.y + (j ? 10 : 2)};
        const to = {x: cx - K.s * (plinthW / 2 - 12 - j * 16), y: plinthTop - 4};
        const xx = lerp(from.x, to.x, ease.outCubic(sp));
        const yy = lerp(from.y, to.y, ease.inQuad(sp));
        nodes[`${P}-shard${k}${j}`] = {transform: T(xx, yy, K.s * sp * (70 + j * 50)), opacity: sp > 0 ? 1 : 0};
      }
      sem.contact[k] = r(Math.abs(x - (cx - K.s * vs)) - R, 1);
      if (K.heldSim) {
        const gp = isHeld ? clamp((t - K.heldSim.T) / (0.08 * Sfull.T)) : 0;
        nodes[`${P}-ghost${k}`] = {opacity: r(gp, 3)};
        sem.ghost[k] = r(gp, 3);
      }
    }
    sem.lossState = anyHit ? 'cracked' : 'intact';
    return {nodes, semantic: sem};
  }

  /** Obstacle polygons/boxes for label placement (static scene parts). */
  const boxes = [];
  for (const k of ROUTES) {
    const K = racks[k];
    K.boards.forEach(b => {
      const xa = K.X(b.uH), xb = K.X(b.uL);
      boxes.push({x: Math.min(xa, xb) - 4, y: Math.min(b.yH, b.yL) - 2 * R - 4, w: Math.abs(xb - xa) + 8, h: Math.abs(b.yL - b.yH) + 2 * R + bt + R + 8});
    });
  }
  const vaseBox = {x: cx - vw / 2 - 4, y: plinthTop - Vv - 6, w: vw + 8, h: Vv + 6};
  const plinthBox = {x: cx - plinthW / 2 - 4, y: plinthTop, w: plinthW + 8, h: F - plinthTop};
  const rackBox = k => {
    const K = racks[k];
    return {x: Math.min(K.xOut, K.xIn), y: rackTop - 8, w: Math.abs(K.xIn - K.xOut), h: F - rackTop};
  };

  return {
    node, back, main, pose, racks, joints, cracks, bars,
    R, bt, V, Vv, vw, cx, F, yC, plinthTop, plinthW, rackTop,
    vaseBox, plinthBox, rackBox, planks: boxes,
    fits: ROUTES.every(k => racks[k].fits),
    /** gate pivot and ring box of route k (the released / locked detail) */
    gateOf: k => ({x: racks[k].gatePivot.x, y: racks[k].gatePivot.y + racks[k].gateLen * 0.5, marble: {x: racks[k].X(racks[k].uRest), y: racks[k].surf(racks[k].boards[0], racks[k].uRest) - R}}),
    /** marble centre at the vase (contact) for route k */
    contactPoint: k => ({x: racks[k].xc, y: yC}),
    /** vase surface point touched by route k */
    touchPoint: k => cracks[k].from,
    /** lever knob world position for press p (story) */
    leverKnob: (k, p) => {
      const L = racks[k].lever;
      if (!L) return null;
      const a = racks[k].s * 32 * p * DEG;
      const vx = -racks[k].s * L.armL;
      return {x: L.pivot.x + vx * Math.cos(a), y: L.pivot.y + vx * Math.sin(a)};
    },
    /** normalized run time at which route k's marble leaves plank i (i = n-1: reaches the vase) */
    leaveTau: (k, i) => (i === racks[k].n - 1 ? 1 : racks[k].sim.leave[i] / racks[k].sim.T),
    heldTau: k => (racks[k].heldSim ? racks[k].heldSim.T / racks[k].sim.T : null),
  };
}

/**
 * Deterministic marble run over the planks of one rack, in (u, y) coordinates
 * (u = horizontal distance from the rack's outer face). Rolling:
 * a = (5/7)·g·sin α along the plank; drops: ballistic with the turn wall as
 * a stop; landing keeps half of the along-plank speed. Returns samples.
 */
function simulateRun(o) {
  const {boards, tan, cos, sin, R, W, wt, uc, uRest, surf, stopAt} = o;
  const dt = 1 / 1000;
  const out = {t: [], u: [], y: [], rot: [], k: [], leave: new Array(boards.length).fill(Infinity), T: 0};
  const a = (5 / 7) * G * sin;
  let k = 0;
  let mode = 'roll';
  const b0 = boards[0];
  let s = Math.abs(uRest - b0.uH) / cos; // distance along plank 0
  let v = 0;
  let pu = 0, py = 0, vu = 0, vy = 0;
  let rot = 0, spin = 0;
  let t = 0;
  const centre = (b, ss) => {
    const u = b.uH + b.d * ss * cos;
    const ys = b.yH + ss * sin;
    return {u: u + b.d * sin * R, y: ys - cos * R};
  };
  const push = (u, y) => { out.t.push(t); out.u.push(u); out.y.push(y); out.rot.push(rot / DEG); out.k.push(mode === 'roll' ? k : -1); };
  let c0 = centre(b0, s);
  push(c0.u, c0.y);
  for (let step = 0; step < 200000; step++) {
    t += dt;
    if (mode === 'roll') {
      const b = boards[k];
      v += a * dt;
      s += v * dt;
      const Lk = b.span / cos;
      const last = k === boards.length - 1;
      // stop points: the vase (last plank) or a pause pin (held link)
      const sStop = last ? (Math.abs(uc - b.uH) - sin * R) / cos : (stopAt === k ? Lk - (R + Math.max(6, R * 0.4) / 2 + 1 + sin * R) / cos : null);
      if (sStop !== null && s >= sStop) {
        s = sStop;
        const c = centre(b, s);
        rot += 0;
        push(c.u, c.y);
        out.T = t;
        if (!last) out.leave[k] = Infinity;
        return out;
      }
      if (s >= Lk) {
        out.leave[k] = t;
        const c = centre(b, Lk);
        pu = c.u; py = c.y;
        vu = b.d * v * cos; vy = v * sin;
        spin = (b.d * v) / R;
        mode = 'fall';
        push(pu, py);
        continue;
      }
      rot += (b.d * v * dt) / R;
      const c = centre(b, s);
      push(c.u, c.y);
    } else {
      const b = boards[k];
      const nb = boards[k + 1];
      vy += G * dt;
      pu += vu * dt;
      py += vy * dt;
      rot += spin * dt;
      // the turn wall
      if (b.d > 0 && pu > W - wt - R) { pu = W - wt - R; vu = -Math.abs(vu) * 0.15; }
      if (b.d < 0 && pu < wt + R) { pu = wt + R; vu = Math.abs(vu) * 0.15; }
      // landing on the next plank
      const ys = surf(nb, pu) - R / cos;
      if (py >= ys) {
        py = ys;
        k += 1;
        mode = 'roll';
        const along = vu * nb.d * cos + vy * sin;
        s = Math.max(0, Math.abs(pu - nb.uH) / cos - 0.0);
        v = Math.max(0, along) * 0.45 + 30;
        const c = centre(nb, s);
        push(c.u, c.y);
        continue;
      }
      push(pu, py);
    }
  }
  out.T = t;
  return out;
}

function sampleAt(S, t) {
  const n = S.t.length;
  if (t <= 0) return {u: S.u[0], y: S.y[0], rot: S.rot[0], k: S.k[0]};
  if (t >= S.t[n - 1]) return {u: S.u[n - 1], y: S.y[n - 1], rot: S.rot[n - 1], k: S.k[n - 1]};
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S.t[m] <= t) lo = m; else hi = m; }
  const f = (t - S.t[lo]) / (S.t[hi] - S.t[lo] || 1);
  return {u: lerp(S.u[lo], S.u[hi], f), y: lerp(S.y[lo], S.y[hi], f), rot: lerp(S.rot[lo], S.rot[hi], f), k: S.k[lo]};
}

/* ------------------------------------------------------------------------ */
/* Legend columns                                                           */
/* ------------------------------------------------------------------------ */

/** Neutral Δ disc (same look as primitives/markers changedMarker). */
function deltaIcon(ctx, R) {
  const th = ctx.theme;
  const s2 = R * 0.44;
  return g(null,
    h('circle', {r: r(R), fill: th.accent2, stroke: th.paper, 'stroke-width': r(Math.max(3, R * 0.22))}),
    h('path', {d: `M0 ${r(-s2)}l${r(s2)} ${r(s2 * 1.75)}h${r(-2 * s2)}z`, fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(3, R * 0.2)), 'stroke-linejoin': 'round'}));
}

/** Tiny bust icon for a presenter row (appearance from actorLook). */
export function bustIcon(ctx, {x, y, s, look}) {
  const th = ctx.theme;
  return g({transform: T(x + s / 2, y + s / 2)},
    h('path', {d: `M${r(-s * 0.42)} ${r(s * 0.5)}Q${r(-s * 0.42)} ${r(s * 0.06)} 0 ${r(s * 0.06)}Q${r(s * 0.42)} ${r(s * 0.06)} ${r(s * 0.42)} ${r(s * 0.5)}Z`, fill: look.outfit, stroke: th.ink, 'stroke-width': 2}),
    h('circle', {cx: 0, cy: r(-s * 0.16), r: r(s * 0.24), fill: look.skin, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(-s * 0.25)} ${r(-s * 0.2)}Q${r(-s * 0.22)} ${r(-s * 0.46)} 0 ${r(-s * 0.44)}Q${r(s * 0.24)} ${r(-s * 0.46)} ${r(s * 0.25)} ${r(-s * 0.2)}Q${r(s * 0.1)} ${r(-s * 0.3)} ${r(-s * 0.25)} ${r(-s * 0.2)}Z`, fill: look.hairColor, stroke: th.ink, 'stroke-width': 1.5}),
  );
}

/**
 * Legend columns: rows of icon + glue-fitted chip. Items carry a kind:
 * event (die in the lane colour) · loss (vase) · alt (barricade) · link (seal)
 * · head (route badge) · who (presenter bust) · note (no icon). Both lanes use
 * the same size, stroke and weight. Rows start hidden (opacity 0).
 * @param {any} ctx
 * @param {{cols:Array<{x:number, y:number, w:number, items:any[]}>, size:number, maxLines?:number, gap?:number, icons?:boolean, prefix?:string, padY?:number}} o
 * @returns {{rows:any[], bottom:number, minPx:number}}
 */
export function legendColumns(ctx, o) {
  const th = ctx.theme;
  const col = routeColors(ctx);
  const pre = o.prefix ?? 'lg';
  const gap = o.gap ?? 10;
  const size = o.size;
  const icons = o.icons !== false;
  const iconS = size * 1.35;
  const padY = o.padY ?? size * 0.34;
  const rows = [];
  let bottom = -Infinity;
  let minPx = Infinity;
  let truncated = false;
  const strokeOf = it => (it.stroke ? it.stroke : it.kind === 'loss' ? th.accent3 : it.kind === 'alt' ? th.accent : it.kind === 'link' || it.kind === 'who' || it.kind === 'note' || it.kind === 'delta' ? th.inkSoft : col.of(it.route));
  const fillOf = it => (it.fill ? it.fill : it.kind === 'loss' ? th.accent3Soft : it.kind === 'alt' ? th.accentSoft : th.card);
  for (const c of o.cols) {
    let y = c.y;
    for (const it of c.items) {
      const iw = icons && it.kind !== 'note' ? (it.kind === 'head' ? badgeWidth(ctx, iconS * 0.45) + 10 : iconS + 12) : 0;
      const probe = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: c.w - iw, size, minSize: size, maxLines: it.maxLines ?? o.maxLines ?? 3, align: 'start', padY});
      const rh = Math.max(probe.box.h, iw ? iconS : 0);
      const cy = y + rh / 2;
      const ch = chipG(ctx, it.text, {x: c.x + iw, y: cy - probe.box.h / 2, maxWidth: c.w - iw, size, minSize: size, maxLines: it.maxLines ?? o.maxLines ?? 3, align: 'start', padY, fill: fillOf(it), stroke: strokeOf(it)});
      minPx = Math.min(minPx, ch.fit.size);
      if (ch.fit.truncated || ch.fit.broken) truncated = true;
      let icon = null;
      const x = c.x;
      if (iw) {
        if (it.kind === 'event') icon = g({transform: T(x, cy - iconS / 2)}, routeDie(ctx, {s: iconS, k: it.i + 1, fill: col.of(it.route), route: it.route}));
        else if (it.kind === 'loss') icon = g({transform: T(x + iconS * 0.81, cy + iconS / 2)}, lossArt(ctx, {name: `${pre}-${it.key}-vase`, w: iconS * 0.62, h: iconS, kind: 'vase'}).node);
        else if (it.kind === 'alt') icon = g({transform: T(x + iconS / 2, cy + iconS / 2)}, barrierArt(ctx, {name: `${pre}-${it.key}-bar`, w: iconS * 0.95, h: iconS * 0.9}));
        else if (it.kind === 'link') icon = g({transform: T(x + iconS / 2, cy)}, sealArt(ctx, {name: `${pre}-${it.key}-j`, disputed: Boolean(it.dim), radius: iconS * 0.36, opacity: 1}));
        else if (it.kind === 'head') icon = routeBadge(ctx, {x: x + Math.max(iconS * 0.45, Math.max(iconS * 0.47, 17) * 0.8) + 1, y: cy, R: iconS * 0.45, color: col.of(it.route), letter: it.route.toUpperCase()});
        else if (it.kind === 'who') icon = bustIcon(ctx, {x, y: cy - iconS / 2, s: iconS, look: it.look});
        else if (it.kind === 'delta') icon = g({transform: T(x + iconS / 2, cy)}, deltaIcon(ctx, iconS * 0.45));
        else if (it.kind === 'marble') icon = marbleIcon(ctx, {x, y: cy - iconS / 2, s: iconS, color: col.of(it.route)});
      }
      const node = g({name: `${pre}-${it.key}`, opacity: 0}, icon, ch.node);
      rows.push({key: it.key, kind: it.kind, name: `${pre}-${it.key}`, route: it.route, show: [], node,
        box: {x, y, w: ch.box.x + ch.box.w - x, h: rh}, chip: ch.box, icon: iw ? {x, y: cy - iconS / 2, w: iconS, h: iconS} : null});
      y += rh + gap;
    }
    bottom = Math.max(bottom, y - gap);
  }
  return {rows, bottom: Number.isFinite(bottom) ? bottom : o.cols[0]?.y ?? 0, minPx, truncated};
}

/**
 * Per-route legend items: presenter caption (optional), events, then the
 * route's alternatives and its non-default links.
 */
export function routeItems(ctx, C, k, o = {}) {
  const t = ctx.t;
  const route = C.routes[k];
  const L = k.toUpperCase();
  const out = [];
  if (o.head) out.push({key: `head${k}`, kind: 'head', route: k, text: o.head});
  if (o.who) out.push({key: `who${k}`, kind: 'who', route: k, text: o.who, look: o.look});
  route.events.forEach((e, i) => out.push({key: `ev${k}${i}`, kind: 'event', route: k, i, text: `${L}${i + 1}. ${e.label}${e.time ? ` · ${e.time}` : ''}`}));
  C.alternatives.forEach((a, j) => {
    if (a.route === k) out.push({key: `alt${j}`, kind: 'alt', route: k, text: `${t.alternative}: ${a.label} (${a.status === 'alleged' ? t.alleged : t.proposed}) · ${linkName(t, route, a.link)}`});
  });
  route.links.forEach((l, i) => {
    const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputedLink : null, l.label || null].filter(Boolean);
    if (bits.length) out.push({key: `lk${k}${i}`, kind: 'link', route: k, dim: l.status === 'disputed', text: `${linkName(t, route, i)}: ${bits.join(' · ')}`});
  });
  return out;
}

/** Loss items (shared by both routes). */
export function lossItems(ctx, C) {
  return C.losses.map((l, j) => ({key: `loss${j}`, kind: 'loss', text: `${ctx.t.lossAs}: ${l.label}`}));
}

/**
 * Lay chips out in centred rows inside a band (wrapping to a new row when a
 * chip does not fit). Returns placed chips (x, y = top-left) and the bottom.
 * @param {Array<{w:number,h:number}>} list
 * @param {{x:number, y:number, w:number, gap?:number, rowGap?:number}} o
 */
export function flowRows(list, o) {
  const gap = o.gap ?? 18, rowGap = o.rowGap ?? 12;
  const out = [];
  let y = o.y;
  let i = 0;
  while (i < list.length) {
    const row = [list[i]];
    let w = list[i].w;
    i++;
    while (i < list.length && w + gap + list[i].w <= o.w) { w += gap + list[i].w; row.push(list[i]); i++; }
    const rh = Math.max(...row.map(c => c.h));
    let x = o.x + (o.w - w) / 2;
    for (const c of row) { out.push({...c, x, y: y + (rh - c.h) / 2}); x += c.w + gap; }
    y += rh + rowGap;
  }
  return {placed: out, bottom: list.length ? y - rowGap : o.y};
}

/** Row visibility for legendColumns() rows (their link seals start hidden in jointArt). */
export function legendFrame(rows, p) {
  const out = {};
  for (const rw of rows) {
    const v = typeof p === 'function' ? p(rw) : p;
    out[rw.name] = {opacity: r(clamp(v), 3)};
    for (const nm of rw.show) out[nm] = {opacity: 1};
  }
  return out;
}

export {DEG, seg};
