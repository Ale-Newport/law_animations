/**
 * Motif kit — «Distinción de casos» (LAW-0089..0092).
 *
 * Physical vocabulary shared by the four entries (geometry + solvers only;
 * every entry owns its own timeline, layout and semantics):
 *  - a cork board (pin board) in a wooden frame; it clips everything inside,
 *    so an arm can enter from the frame edge;
 *  - two case cards pinned edge to edge: situation A and situation B. Each
 *    fact is a round TOKEN with a pictogram (reads without labels) sitting at
 *    the inner edge of its card, so the two tokens of a row face each other
 *    across the seam. A fact missing from one card leaves an empty socket;
 *  - small chain-link connectors that snap across the seam when both tokens
 *    of a row coincide, and a broken link where they do not;
 *  - a rule card (illustrative text as supplied) with a ruler band, and a
 *    bulldog clip hanging from it on a string — the support that ends up
 *    holding the extracted fact;
 *  - a hand-held magnifier whose glass shows a REAL enlarged copy of the
 *    board (same coordinates, scaled about the lens centre) while it is held
 *    close to the board; lifted, the copy defocuses and only a carried token
 *    stays in the glass.
 * Legal content: facts, rules, issues and assumptions are author-supplied
 * illustrative text (fictional, jurisdiction unspecified). Nothing here
 * states that a rule applies or decides an outcome; states are descriptive
 * (present / absent / as supplied / pending / disputed).
 * @module animations/reasoning/kits/distincion-de-casos
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {r, clamp, lerp} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, oneOf, list, obj} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {topArm} from '../../../primitives/desk.js';

const INK = '#1f2328';

/* ------------------------------------------------------------------------ */
/* Fields and built-in strings                                               */
/* ------------------------------------------------------------------------ */

/** Pictograms available for fact tokens (neutral everyday objects). */
export const ICONS = ['letter', 'speech', 'document', 'box', 'coin', 'key', 'house', 'car', 'clock', 'calendar', 'phone', 'tree', 'person', 'tool'];

export const factItem = obj('A fictional fact and where it appears', {
  text: str('Fact text (fictional, illustrative). Wraps to three lines, then shrinks within a bound, then ellipsis with the full text kept accessible', 90),
  icon: oneOf('Pictogram printed on the fact token (the action reads without labels)', ICONS),
  in: oneOf('Where the fact appears: in both situations, only in A, or only in B. The first fact that is not in both is the distinguishing fact', ['both', 'a', 'b']),
}, ['text', 'icon', 'in']);

/** Category fields of the reasoning motifs as used by this motif. */
export const reasoningFields = {
  facts: list('Facts of the two situations, one row each (fictional). Shared facts are marked "both"; the first fact present in only one situation is the distinguishing fact', factItem, 2, 5),
  rules: list('Rule text supplied by the author (illustrative; the animation never states that it applies or not)', str('Rule text', 120), 1, 2),
  issues: list('Open questions, shown as pending notes (never answered by the animation)', str('Issue', 90), 0, 1),
  assumptions: list('Working assumptions supplied by the author, shown as a footnote (not verified)', str('Assumption', 90), 0, 1),
};

export const DC_STRINGS = {
  en: {
    ruleHead: 'Rule · as supplied',
    distinguishing: 'Distinguishing fact · as supplied',
    disputedDiff: 'Difference disputed · as supplied',
    noDiff: 'No distinguishing fact supplied',
    absentIn: 'Absent in',
    presentIn: 'Present in',
    issue: 'Issue · pending',
    assumption: 'Assumption',
    notRecorded: 'Not recorded',
    presentBoth: 'Present in both · as supplied',
  },
  es: {
    ruleHead: 'Regla · según lo aportado',
    distinguishing: 'Hecho diferenciador · según lo aportado',
    disputedDiff: 'Diferencia discutida · según lo aportado',
    noDiff: 'No se aporta hecho diferenciador',
    absentIn: 'Ausente en',
    presentIn: 'Presente en',
    issue: 'Cuestión · pendiente',
    assumption: 'Supuesto',
    notRecorded: 'No consta',
    presentBoth: 'Presente en ambos · según lo aportado',
  },
};

/**
 * Resolve the supplied facts into rows. The first fact that is not in both
 * situations is the distinguishing fact (`diff`, `side` = where it is present).
 * @param {Array<{text:string, icon:string, in:'both'|'a'|'b'}>} facts
 */
export function resolveFacts(facts) {
  const rows = facts.map((f, i) => ({i, text: f.text, icon: f.icon, inA: f.in !== 'b', inB: f.in !== 'a'}));
  const diff = facts.findIndex(f => f.in !== 'both');
  return {rows, n: rows.length, diff, side: diff < 0 ? null : facts[diff].in};
}

/* ------------------------------------------------------------------------ */
/* Colours                                                                   */
/* ------------------------------------------------------------------------ */

/** Motif colours derived from the palette (A and B keep distinct rims). */
export function dcColors(ctx) {
  const th = ctx.theme;
  return {
    a: th.accent2, b: th.accent4,
    aSoft: th.accent2Soft, bSoft: th.accent4Soft,
    cork: '#c99b63', corkDark: '#a97a45', corkLight: '#dcb584',
    frame: '#8e6441', frameTop: '#a8794f',
    metal: '#8f9aa4', metalDark: '#4f5a64', metalLight: '#d7dde2',
    pinA: '#c8553d', pinB: '#2f6690', pinC: '#e0a458',
    handle: '#3b3f46', handleLight: '#6b717b',
    glass: '#eaf3f8',
    rule: '#fbf6e9', ruleBand: '#e8d7a6', ruleTick: '#8a6d2e',
    note: '#fbe7a1', noteShade: '#e9cf78',
    accent: th.accent,
  };
}

/* ------------------------------------------------------------------------ */
/* Pictograms (drawn around 0,0 inside a box of side s)                      */
/* ------------------------------------------------------------------------ */

/**
 * @param {string} kind one of ICONS
 * @param {number} s box side
 * @param {string} fill light fill colour
 */
export function factIcon(kind, s, fill) {
  const k = v => r(v * s);
  const sw = r(Math.max(1.6, s * 0.065));
  const st = {stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
  const line = (d, extra = {}) => h('path', {d, fill: 'none', ...st, ...extra});
  const shape = (d, f = fill) => h('path', {d, fill: f, ...st});
  switch (kind) {
    case 'letter':
      return g(null,
        shape(`M${k(-0.42)} ${k(-0.28)}H${k(0.42)}V${k(0.28)}H${k(-0.42)}Z`),
        line(`M${k(-0.42)} ${k(-0.27)}L0 ${k(0.05)}L${k(0.42)} ${k(-0.27)}`),
        line(`M${k(-0.42)} ${k(0.27)}L${k(-0.12)} ${k(-0.02)}M${k(0.42)} ${k(0.27)}L${k(0.12)} ${k(-0.02)}`, {opacity: 0.6}));
    case 'speech':
      return g(null,
        shape(`M${k(-0.34)} ${k(-0.32)}H${k(0.34)}Q${k(0.44)} ${k(-0.32)} ${k(0.44)} ${k(-0.22)}V${k(0.08)}Q${k(0.44)} ${k(0.18)} ${k(0.34)} ${k(0.18)}H${k(-0.06)}L${k(-0.26)} ${k(0.38)}V${k(0.18)}H${k(-0.34)}Q${k(-0.44)} ${k(0.18)} ${k(-0.44)} ${k(0.08)}V${k(-0.22)}Q${k(-0.44)} ${k(-0.32)} ${k(-0.34)} ${k(-0.32)}Z`),
        h('circle', {cx: k(-0.2), cy: k(-0.07), r: k(0.055), fill: INK}),
        h('circle', {cx: 0, cy: k(-0.07), r: k(0.055), fill: INK}),
        h('circle', {cx: k(0.2), cy: k(-0.07), r: k(0.055), fill: INK}));
    case 'document':
      return g(null,
        shape(`M${k(-0.3)} ${k(-0.4)}H${k(0.13)}L${k(0.3)} ${k(-0.23)}V${k(0.4)}H${k(-0.3)}Z`, '#ffffff'),
        line(`M${k(0.13)} ${k(-0.4)}V${k(-0.23)}H${k(0.3)}`),
        line(`M${k(-0.17)} ${k(-0.08)}H${k(0.17)}M${k(-0.17)} ${k(0.07)}H${k(0.17)}M${k(-0.17)} ${k(0.22)}H${k(0.06)}`, {opacity: 0.7}));
    case 'box':
      return g(null,
        shape(`M${k(-0.38)} ${k(-0.14)}H${k(0.38)}V${k(0.34)}H${k(-0.38)}Z`),
        shape(`M${k(-0.42)} ${k(-0.32)}H${k(0.42)}V${k(-0.14)}H${k(-0.42)}Z`, shade(fill, -0.12)),
        shape(`M${k(-0.07)} ${k(-0.32)}H${k(0.07)}V${k(0.02)}H${k(-0.07)}Z`, '#ffffff'));
    case 'coin':
      return g(null,
        h('circle', {cx: k(-0.12), cy: k(0.08), r: k(0.27), fill: fill, ...st}),
        h('circle', {cx: k(-0.12), cy: k(0.08), r: k(0.17), fill: 'none', ...st, opacity: 0.6}),
        h('circle', {cx: k(0.14), cy: k(-0.1), r: k(0.27), fill: shade(fill, 0.25), ...st}),
        h('circle', {cx: k(0.14), cy: k(-0.1), r: k(0.17), fill: 'none', ...st, opacity: 0.6}));
    case 'key':
      return g(null,
        h('circle', {cx: k(-0.2), cy: 0, r: k(0.19), fill: fill, ...st}),
        h('circle', {cx: k(-0.2), cy: 0, r: k(0.065), fill: '#ffffff', ...st}),
        line(`M${k(-0.01)} 0H${k(0.4)}M${k(0.26)} 0V${k(0.14)}M${k(0.37)} 0V${k(0.11)}`, {'stroke-width': r(sw * 1.5)}));
    case 'house':
      return g(null,
        shape(`M${k(-0.36)} ${k(-0.02)}L0 ${k(-0.36)}L${k(0.36)} ${k(-0.02)}V${k(0.36)}H${k(-0.36)}Z`),
        shape(`M${k(-0.08)} ${k(0.36)}V${k(0.1)}H${k(0.08)}V${k(0.36)}`, '#ffffff'));
    case 'car':
      return g(null,
        shape(`M${k(-0.42)} ${k(0.14)}V${k(-0.01)}L${k(-0.27)} ${k(-0.06)}L${k(-0.15)} ${k(-0.24)}H${k(0.15)}L${k(0.27)} ${k(-0.06)}L${k(0.42)} ${k(-0.01)}V${k(0.14)}Z`),
        shape(`M${k(-0.11)} ${k(-0.19)}H${k(0.11)}L${k(0.19)} ${k(-0.07)}H${k(-0.19)}Z`, '#ffffff'),
        h('circle', {cx: k(-0.22), cy: k(0.15), r: k(0.1), fill: INK}),
        h('circle', {cx: k(0.22), cy: k(0.15), r: k(0.1), fill: INK}));
    case 'clock':
      return g(null,
        h('circle', {r: k(0.38), fill: '#ffffff', ...st}),
        line(`M0 0V${k(-0.24)}M0 0L${k(0.16)} ${k(0.09)}`, {'stroke-width': r(sw * 1.3)}),
        h('circle', {r: k(0.05), fill: INK}));
    case 'calendar':
      return g(null,
        shape(`M${k(-0.36)} ${k(-0.26)}H${k(0.36)}V${k(0.36)}H${k(-0.36)}Z`, '#ffffff'),
        shape(`M${k(-0.36)} ${k(-0.26)}H${k(0.36)}V${k(-0.08)}H${k(-0.36)}Z`, fill),
        line(`M${k(-0.18)} ${k(-0.36)}V${k(-0.18)}M${k(0.18)} ${k(-0.36)}V${k(-0.18)}`, {'stroke-width': r(sw * 1.3)}),
        [[-0.2, 0.06], [0, 0.06], [0.2, 0.06], [-0.2, 0.22], [0, 0.22]].map(([x, y]) => h('rect', {x: k(x - 0.05), y: k(y - 0.04), width: k(0.1), height: k(0.08), fill: INK, opacity: 0.75})));
    case 'phone':
      return g(null,
        shape(`M${k(-0.2)} ${k(-0.33)}Q${k(-0.2)} ${k(-0.4)} ${k(-0.13)} ${k(-0.4)}H${k(0.13)}Q${k(0.2)} ${k(-0.4)} ${k(0.2)} ${k(-0.33)}V${k(0.33)}Q${k(0.2)} ${k(0.4)} ${k(0.13)} ${k(0.4)}H${k(-0.13)}Q${k(-0.2)} ${k(0.4)} ${k(-0.2)} ${k(0.33)}Z`),
        h('rect', {x: k(-0.13), y: k(-0.3), width: k(0.26), height: k(0.48), fill: '#ffffff', stroke: INK, 'stroke-width': r(sw * 0.7)}),
        h('circle', {cy: k(0.29), r: k(0.045), fill: INK}));
    case 'tree':
      return g(null,
        shape(`M${k(-0.06)} ${k(0.06)}H${k(0.06)}V${k(0.4)}H${k(-0.06)}Z`, '#8e6441'),
        h('circle', {cx: 0, cy: k(-0.1), r: k(0.29), fill: fill, ...st}),
        h('circle', {cx: k(-0.16), cy: k(0.04), r: k(0.15), fill: fill, ...st}),
        h('circle', {cx: k(0.17), cy: k(0.03), r: k(0.15), fill: fill, ...st}));
    case 'person':
      return g(null,
        shape(`M${k(-0.3)} ${k(0.38)}Q${k(-0.3)} ${k(0.02)} 0 ${k(0.02)}Q${k(0.3)} ${k(0.02)} ${k(0.3)} ${k(0.38)}Z`),
        h('circle', {cx: 0, cy: k(-0.19), r: k(0.16), fill: '#ffffff', ...st}));
    case 'tool':
    default:
      return g(null,
        line(`M${k(-0.3)} ${k(0.32)}L${k(0.1)} ${k(-0.08)}`, {'stroke-width': r(sw * 2.6), stroke: '#8e6441'}),
        line(`M${k(-0.3)} ${k(0.32)}L${k(0.1)} ${k(-0.08)}`, {'stroke-width': r(sw * 0.6), opacity: 0.4}),
        shape(`M${k(-0.04)} ${k(-0.26)}L${k(0.12)} ${k(-0.42)}L${k(0.42)} ${k(-0.12)}L${k(0.26)} ${k(0.04)}Z`, '#9aa4ad'));
  }
}

/* ------------------------------------------------------------------------ */
/* Board, pins, tokens, sockets, links                                       */
/* ------------------------------------------------------------------------ */

/**
 * Cork board with a wooden frame. `clip` clips arms/props to the cork.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, frame?:number, seedKey?:string}} o
 */
export function corkBoard(ctx, o) {
  const C = dcColors(ctx);
  const F = o.frame ?? 20;
  const inner = {x: o.x + F, y: o.y + F, w: o.w - 2 * F, h: o.h - 2 * F};
  const key = o.seedKey || o.prefix;
  const specks = [];
  const n = Math.round((inner.w * inner.h) / 5200);
  for (let i = 0; i < n; i++) {
    const x = inner.x + ctx.rng(`${key}-sx`, i) * inner.w;
    const y = inner.y + ctx.rng(`${key}-sy`, i) * inner.h;
    const rr = 1.4 + ctx.rng(`${key}-sr`, i) * 2.6;
    specks.push(h('circle', {cx: r(x), cy: r(y), r: r(rr), fill: ctx.rng(`${key}-sc`, i) > 0.5 ? C.corkDark : C.corkLight, opacity: 0.55}));
  }
  const clipId = `${o.prefix}-clip`;
  const surface = g({name: `${o.prefix}-surface`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {x: r(inner.x), y: r(inner.y), width: r(inner.w), height: r(inner.h)}))),
    h('path', {d: roundRectPath(o.x + 6, o.y + 10, o.w, o.h, 16), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 16), fill: C.frame, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(o.x + 4, o.y + 4, o.w - 8, o.h - 8, 13), fill: 'none', stroke: C.frameTop, 'stroke-width': 3, opacity: 0.8}),
    h('rect', {x: r(inner.x), y: r(inner.y), width: r(inner.w), height: r(inner.h), fill: C.cork, stroke: INK, 'stroke-width': 2}),
    g({'clip-path': ctx.ref(clipId)}, specks),
  );
  return {surface, clip: ctx.ref(clipId), inner, outer: {x: o.x, y: o.y, w: o.w, h: o.h}, frameW: F};
}

/**
 * The board's wooden frame drawn again ON TOP of props that cross the board
 * edge (a free magnifier's handle passes under the frame instead of being cut
 * at the cork), plus a clip reference for the outer edge.
 * @param {any} ctx
 * @param {ReturnType<typeof corkBoard>} board
 * @param {string} prefix
 */
export function boardFrame(ctx, board, prefix) {
  const C = dcColors(ctx);
  const o = board.outer, I = board.inner;
  const clipId = `${prefix}-oclip`;
  const ring = roundRectPath(o.x, o.y, o.w, o.h, 16) + `M${r(I.x)} ${r(I.y)}v${r(I.h)}h${r(I.w)}v${r(-I.h)}Z`;
  const node = g({name: `${prefix}-frame`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 16)}))),
    h('path', {d: ring, 'fill-rule': 'evenodd', fill: C.frame, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(o.x + 4, o.y + 4, o.w - 8, o.h - 8, 13), fill: 'none', stroke: C.frameTop, 'stroke-width': 3, opacity: 0.8}),
    h('rect', {x: r(I.x), y: r(I.y), width: r(I.w), height: r(I.h), fill: 'none', stroke: INK, 'stroke-width': 2}));
  return {node, clip: ctx.ref(clipId)};
}

/** Cork background copy for the magnified view (no frame, same speckles). */
export function corkCopy(ctx, board, key) {
  const C = dcColors(ctx);
  const inner = board.inner;
  const specks = [];
  const n = Math.round((inner.w * inner.h) / 5200);
  for (let i = 0; i < n; i++) {
    const x = inner.x + ctx.rng(`${key}-sx`, i) * inner.w;
    const y = inner.y + ctx.rng(`${key}-sy`, i) * inner.h;
    const rr = 1.4 + ctx.rng(`${key}-sr`, i) * 2.6;
    specks.push(h('circle', {cx: r(x), cy: r(y), r: r(rr), fill: ctx.rng(`${key}-sc`, i) > 0.5 ? C.corkDark : C.corkLight, opacity: 0.55}));
  }
  return g(null, h('rect', {x: r(inner.x - 400), y: r(inner.y - 400), width: r(inner.w + 800), height: r(inner.h + 800), fill: C.cork}), specks);
}

/** Push pin seen from above (head + highlight), centred on (x, y). */
export function pushPin(x, y, color, s = 11) {
  return g({transform: T(x, y)},
    h('circle', {cx: 2.5, cy: 3.5, r: s, fill: 'rgba(31,35,40,0.25)'}),
    h('circle', {r: s, fill: color, stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: -s * 0.3, cy: -s * 0.32, r: s * 0.32, fill: '#ffffff', opacity: 0.55}));
}

/**
 * Round fact token (badge) with a pictogram. Local origin = centre.
 * @param {any} ctx
 * @param {{name?:string, R:number, icon:string, rim:string, opacity?:number, shadow?:boolean}} o
 */
export function factToken(ctx, o) {
  const R = o.R;
  return g({name: o.name, opacity: o.opacity},
    o.shadow === false ? null : h('circle', {cx: R * 0.08, cy: R * 0.12, r: R, fill: 'rgba(31,35,40,0.22)'}),
    h('circle', {r: R, fill: o.rim, stroke: INK, 'stroke-width': 2.5}),
    h('circle', {r: r(R * 0.79), fill: '#fffdf8', stroke: shade(o.rim, -0.3), 'stroke-width': 1.6}),
    g(null, factIcon(o.icon, R * 1.08, shade(o.rim, 0.62))),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.5)}A${r(R * 0.86)} ${r(R * 0.86)} 0 0 1 ${r(R * 0.2)} ${r(-R * 0.84)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.09), 'stroke-linecap': 'round', opacity: 0.55}),
  );
}

/** Empty socket where a fact is absent: a recessed dashed ring. */
export function slotRing(ctx, {name, R, hiName}) {
  const th = ctx.theme;
  return g({name},
    h('circle', {r: r(R * 0.94), fill: 'rgba(31,35,40,0.07)', stroke: th.inkFaint, 'stroke-width': 2.5, 'stroke-dasharray': '7 7'}),
    hiName ? h('circle', {name: hiName, r: r(R * 1.02), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '10 8', opacity: 0}) : null,
  );
}

/** Ghost of an extracted token: dashed ring in the rim colour + faint pictogram. */
export function ghostRing(ctx, {name, R, icon, rim}) {
  return g({name, opacity: 0},
    h('circle', {r: r(R * 0.96), fill: 'rgba(255,253,248,0.35)', stroke: rim, 'stroke-width': 3, 'stroke-dasharray': '8 6'}),
    g({opacity: 0.28}, factIcon(icon, R * 1.0, shade(rim, 0.62))),
  );
}

/**
 * Chain-link connector drawn across the seam (horizontal, centred at 0,0).
 * `broken` draws two separated half links with a crack between them.
 * @param {any} ctx
 * @param {{name:string, s:number, broken?:boolean, color?:string, vertical?:boolean}} o
 */
export function linkMark(ctx, o) {
  const C = dcColors(ctx);
  const s = o.s;
  const col = o.color ?? C.metal;
  const link = (cx, w, hh) => h('path', {d: roundRectPath(cx - w / 2, -hh / 2, w, hh, hh / 2), fill: 'none', stroke: INK, 'stroke-width': r(s * 0.2 + 2.4)});
  const linkIn = (cx, w, hh) => h('path', {d: roundRectPath(cx - w / 2, -hh / 2, w, hh, hh / 2), fill: 'none', stroke: col, 'stroke-width': r(s * 0.2)});
  const w = s * 1.25, hh = s * 0.72;
  const parts = o.broken
    ? [
      h('circle', {r: r(s * 0.92), fill: '#ffffff', stroke: o.color ?? C.accent, 'stroke-width': 3}),
      link(-s * 0.42, w * 0.62, hh * 0.9), linkIn(-s * 0.42, w * 0.62, hh * 0.9),
      link(s * 0.42, w * 0.62, hh * 0.9), linkIn(s * 0.42, w * 0.62, hh * 0.9),
      h('path', {d: `M${r(-s * 0.08)} ${r(-s * 0.55)}L${r(s * 0.08)} ${r(-s * 0.12)}L${r(-s * 0.06)} ${r(s * 0.1)}L${r(s * 0.08)} ${r(s * 0.55)}`, fill: 'none', stroke: o.color ?? C.accent, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
    ]
    : [
      link(-s * 0.36, w, hh), link(s * 0.36, w, hh),
      linkIn(-s * 0.36, w, hh), linkIn(s * 0.36, w, hh),
      // the second link passes over the first on one side (interlocked)
      h('path', {d: `M${r(-s * 0.36 + w / 2 - 1)} ${r(-hh / 2 + s * 0.12)}v${r(hh * 0.45)}`, stroke: col, 'stroke-width': r(s * 0.2), 'stroke-linecap': 'round'}),
    ];
  return g({name: o.name, opacity: 0}, g({transform: o.vertical ? 'rotate(90)' : undefined}, parts));
}

/* ------------------------------------------------------------------------ */
/* Case cards (two sheets edge to edge, tokens facing across the seam)       */
/* ------------------------------------------------------------------------ */

/**
 * Geometry of the two case cards inside a region. Rows are laid out
 * top→bottom; each token sits at the inner edge of its card.
 * @param {any} ctx
 * @param {{x:number, y:number, w:number, h:number, facts:ReturnType<typeof resolveFacts>, labels:{a:string,b:string},
 *          textSize:number, labelSize:number, maxRowH?:number, R?:number, gap?:number, absentText?:{side:'a'|'b', row:number, text:string}|null,
 *          tallRow?:{row:number, extra:number}|null}} o  tallRow: one row gets `extra` height (e.g. to hold a tag and a note)
 */
export function pairGeometry(ctx, o) {
  const gap = o.gap ?? 16;
  const cardW = (o.w - gap) / 2;
  const seam = o.x + o.w / 2;
  const showKey = ctx.show('key');
  const padX = Math.max(16, cardW * 0.05);
  // header: letter badge + label (up to two lines)
  const badge = o.labelSize * 0.78;
  const labelMax = cardW - padX * 2 - badge * 2 - 24;
  const fitLabel = text => ctx.fit(text, {maxWidth: labelMax, size: o.labelSize, minSize: o.labelSize * 0.8, maxLines: 2, weight: 700});
  const labA = fitLabel(o.labels.a), labB = fitLabel(o.labels.b);
  const headH = Math.max(badge * 2 + 22, (showKey ? Math.max(labA.height, labB.height) : o.labelSize) + 30);
  const n = o.facts.n;
  const tall = o.tallRow && o.tallRow.row >= 0 && o.tallRow.row < n ? o.tallRow : null;
  const extra = tall ? tall.extra : 0;
  const rowH = Math.min(o.maxRowH ?? 999, (o.h - headH - 14 - extra) / n);
  const hOf = i => rowH + (tall && tall.row === i ? extra : 0);
  const cardH = headH + rowH * n + extra + 14;
  const top = o.y + (o.h - cardH) / 2;
  const R = o.R ?? clamp(rowH * 0.34, 24, 46);
  const sx = gap / 2 + R + 8;
  const textGap = 22;
  const zoneW = cardW - padX - (sx - gap / 2 + R + textGap);
  let yAcc = top + headH;
  const rows = o.facts.rows.map((f, i) => {
    const rh = hOf(i);
    const cy = yAcc + rh / 2;
    yAcc += rh;
    const mk = (side, present) => {
      const txt = present ? f.text : (o.absentText && o.absentText.side === side && o.absentText.row === i ? o.absentText.text : null);
      const fit = txt ? ctx.fit(txt, {maxWidth: zoneW, size: o.textSize, minSize: o.textSize * 0.8, maxLines: 3, weight: 500}) : null;
      const zx = side === 'a' ? o.x + padX : seam + sx + R + textGap;
      return {x: side === 'a' ? seam - sx : seam + sx, y: cy, present, fit, text: txt, zone: {x: zx, y: cy - rh / 2 + 6, w: zoneW, h: rh - 12}};
    };
    return {i, cy, h: rh, icon: f.icon, a: mk('a', f.inA), b: mk('b', f.inB), both: f.inA && f.inB};
  });
  const cardA = {x: o.x, y: top, w: cardW, h: cardH};
  const cardB = {x: seam + gap / 2, y: top, w: cardW, h: cardH};
  // header text boxes (badge + label), for collision checks
  const bxA = cardA.x + padX + badge + 10, bxB = cardB.x + cardW - padX - badge - 10;
  const by = top + headH / 2;
  const headText = {
    a: {x: bxA - badge - 4, y: by - Math.max(badge, labA.height / 2) - 4, w: badge * 2 + 18 + labA.width, h: Math.max(badge * 2, labA.height) + 8},
    b: {x: bxB + badge + 4 - (badge * 2 + 18 + labB.width), y: by - Math.max(badge, labB.height / 2) - 4, w: badge * 2 + 18 + labB.width, h: Math.max(badge * 2, labB.height) + 8},
  };
  return {cardA, cardB, headText, badgeX: {a: bxA, b: bxB}, seam, gap, R, sx, rows, rowH, headH, badge, padX, zoneW, labA, labB, labels: o.labels, textSize: o.textSize, labelSize: o.labelSize, box: {x: o.x, y: top, w: o.w, h: cardH}};
}

/**
 * Draw the two cards (paper, header, fact texts or bars, row rules, pins).
 * @param {any} ctx
 * @param {ReturnType<typeof pairGeometry>} geo
 * @param {{prefix:string, bars?:boolean, rowName?:boolean}} o  bars: text shown as bars (magnified copy / labels hidden)
 */
export function pairPaper(ctx, geo, o) {
  const th = ctx.theme;
  const C = dcColors(ctx);
  const bars = o.bars || !ctx.show('key');
  const out = [];
  for (const side of ['a', 'b']) {
    const card = side === 'a' ? geo.cardA : geo.cardB;
    const col = side === 'a' ? C.a : C.b;
    const soft = side === 'a' ? C.aSoft : C.bSoft;
    const lab = side === 'a' ? geo.labA : geo.labB;
    const parts = [];
    parts.push(h('path', {d: roundRectPath(card.x + 5, card.y + 8, card.w, card.h, 8), fill: 'rgba(31,35,40,0.22)'}));
    parts.push(h('path', {d: roundRectPath(card.x, card.y, card.w, card.h, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.5}));
    parts.push(h('path', {d: `M${r(card.x + 1.5)} ${r(card.y + geo.headH)}V${r(card.y + 9)}Q${r(card.x + 1.5)} ${r(card.y + 1.5)} ${r(card.x + 9)} ${r(card.y + 1.5)}H${r(card.x + card.w - 9)}Q${r(card.x + card.w - 1.5)} ${r(card.y + 1.5)} ${r(card.x + card.w - 1.5)} ${r(card.y + 9)}V${r(card.y + geo.headH)}Z`, fill: soft}));
    parts.push(h('line', {x1: r(card.x), x2: r(card.x + card.w), y1: r(card.y + geo.headH), y2: r(card.y + geo.headH), stroke: col, 'stroke-width': 3}));
    // letter badge (the letter is a key label; the coloured badge stays when labels are hidden)
    const bx = geo.badgeX[side];
    const by = card.y + geo.headH / 2;
    parts.push(h('circle', {cx: r(bx), cy: r(by), r: r(geo.badge), fill: col, stroke: INK, 'stroke-width': 2.2}));
    if (!bars) {
      parts.push(h('text', {x: r(bx), y: r(by + geo.labelSize * 0.36), 'text-anchor': 'middle', 'font-size': r(geo.labelSize), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: '#ffffff'}, side === 'a' ? 'A' : 'B'));
      const lx = side === 'a' ? bx + geo.badge + 14 : bx - geo.badge - 14;
      parts.push(textBlock(lab, {x: r(lx), y: r(by - lab.height / 2), anchor: side === 'a' ? 'start' : 'end', fill: INK, name: `${o.prefix}-lab-${side}`}));
    } else {
      const bw = Math.min(geo.zoneW * 0.8, 180);
      const lx = side === 'a' ? bx + geo.badge + 14 : bx - geo.badge - 14 - bw;
      parts.push(h('rect', {x: r(lx), y: r(by - 6), width: r(bw), height: 12, rx: 6, fill: shade(col, 0.2), opacity: 0.7}));
    }
    // rows: rules between rows, fact texts (or bars) on the outer side of the token
    geo.rows.forEach((row, i) => {
      if (i > 0) parts.push(h('line', {x1: r(card.x + 12), x2: r(card.x + card.w - 12), y1: r(row.cy - (row.h ?? geo.rowH) / 2), y2: r(row.cy - (row.h ?? geo.rowH) / 2), stroke: th.paperLine, 'stroke-width': 1.5}));
      const cell = row[side];
      if (cell.skipText) {
        // the entry drawn by the scene itself (e.g. a datum that is substituted)
      } else if (cell.fit && !bars) {
        const f = cell.fit;
        parts.push(textBlock(f, {x: r(cell.zone.x), y: r(row.cy - f.height / 2), fill: cell.present ? INK : th.inkSoft, italic: !cell.present, name: `${o.prefix}-txt-${side}${i}`}));
      } else if (cell.fit || cell.present) {
        // bars follow the measured lines of the text (so a magnified copy lines up with the real text)
        const f = cell.fit || ctx.fit(row.icon, {maxWidth: cell.zone.w, size: geo.textSize, maxLines: 1});
        const lines = cell.fit ? f.lines : ['xxxxxxxxxxxxxxxx', 'xxxxxxxxxx'];
        const lh = f.lineHeight;
        const blockH = lh * (lines.length - 1) + f.size;
        lines.forEach((ln, j) => {
          const lw = cell.fit ? Math.min(cell.zone.w, ctx.measure(ln, f.size, 500, 'sans')) : cell.zone.w * (j ? 0.5 : 0.85);
          parts.push(h('rect', {x: r(cell.zone.x), y: r(row.cy - blockH / 2 + j * lh + f.size * 0.2), width: r(lw), height: r(f.size * 0.55), rx: r(f.size * 0.27), fill: cell.present ? '#b9b2a4' : '#d6d0c4'}));
        });
      } else {
        // absent fact: a faint dash line where the text would be
        const lw = Math.min(cell.zone.w * 0.55, 150);
        const dx = side === 'a' ? cell.zone.x + cell.zone.w - lw : cell.zone.x;
        parts.push(h('line', {name: `${o.prefix}-dash-${side}${i}`, x1: r(dx), x2: r(dx + lw), y1: r(row.cy), y2: r(row.cy), stroke: th.inkFaint, 'stroke-width': 2.5, 'stroke-dasharray': '10 8', 'stroke-linecap': 'round'}));
      }
    });
    // pins at the two top corners (clear of the badge and the label)
    parts.push(pushPin(card.x + 11, card.y + 11, side === 'a' ? C.pinA : C.pinC, 8));
    parts.push(pushPin(card.x + card.w - 11, card.y + 11, side === 'a' ? C.pinC : C.pinA, 8));
    out.push(g({name: `${o.prefix}-card-${side}`}, parts));
  }
  return g(null, out);
}

/**
 * Token layer (tokens, empty sockets, ghost, links, broken link). Built once
 * for the board and once for each magnified copy (different prefix).
 * @param {any} ctx
 * @param {ReturnType<typeof pairGeometry>} geo
 * @param {string} prefix
 * @param {{diff:number, side:'a'|'b'|null, extraToken?:{side:'a'|'b', row:number, icon:string}}} o
 */
export function pairTokens(ctx, geo, prefix, o) {
  const C = dcColors(ctx);
  const parts = [];
  geo.rows.forEach((row, i) => {
    for (const side of ['a', 'b']) {
      const cell = row[side];
      const rim = side === 'a' ? C.a : C.b;
      if (cell.present) parts.push(g({transform: T(cell.x, cell.y)}, factToken(ctx, {name: `${prefix}-t${side}${i}`, R: geo.R, icon: row.icon, rim})));
      else {
        parts.push(g({transform: T(cell.x, cell.y)}, slotRing(ctx, {name: `${prefix}-s${side}${i}`, R: geo.R, hiName: `${prefix}-h${side}${i}`})));
        // an alternative token that can fill the socket (inspect substitution)
        if (o.extraToken && o.extraToken.side === side && o.extraToken.row === i) {
          parts.push(g({transform: T(cell.x, cell.y)}, factToken(ctx, {name: `${prefix}-x${side}${i}`, R: geo.R, icon: o.extraToken.icon, rim, opacity: 0})));
        }
      }
    }
  });
  if (o.diff >= 0) {
    const row = geo.rows[o.diff];
    const cell = row[o.side];
    parts.push(g({transform: T(cell.x, cell.y)}, ghostRing(ctx, {name: `${prefix}-ghost`, R: geo.R, icon: row.icon, rim: o.side === 'a' ? C.a : C.b})));
  }
  // links across the seam (drawn over the token rims); horizontal strips carry
  // their own link point per column and a vertical seam crossing
  geo.rows.forEach((row, i) => {
    const s = Math.max(18, geo.R * 0.6);
    const lp = row.link || {x: geo.seam, y: row.cy};
    const vertical = Boolean(geo.vertical);
    if (row.both) parts.push(g({transform: T(lp.x, lp.y)}, g({name: `${prefix}-lkw${i}`}, linkMark(ctx, {name: `${prefix}-lk${i}`, s, vertical}))));
    else parts.push(g({transform: T(lp.x, lp.y)}, g({name: `${prefix}-bkw${i}`}, linkMark(ctx, {name: `${prefix}-bk${i}`, s, broken: true, vertical}))));
  });
  return g({name: `${prefix}-tokens`}, parts);
}

/**
 * Frame record for a token layer.
 * @param {ReturnType<typeof pairGeometry>} geo
 * @param {string} prefix
 * @param {{links:number[], broken:number, absentHi:number, taken:boolean, ghost:number, extra?:number, extraKey?:string, hideDiff?:boolean}} st
 *   links: snap progress per row (0..1); taken: the distinguishing token has left its card
 */
export function pairFrame(geo, prefix, st, o) {
  const nodes = {};
  geo.rows.forEach((row, i) => {
    const p = st.links[i] ?? 0;
    if (row.both) {
      const sc = p <= 0 ? 0.01 : p >= 1 ? 1 : 0.4 + 0.6 * Math.sin((Math.PI / 2) * p) + 0.12 * Math.sin(Math.PI * p);
      nodes[`${prefix}-lk${i}`] = {opacity: r(clamp(p * 2.5), 3)};
      nodes[`${prefix}-lkw${i}`] = {transform: p > 0 && p < 1 ? `scale(${r(sc, 3)})` : ''};
    } else {
      nodes[`${prefix}-bk${i}`] = {opacity: r(clamp(p * 2.5), 3)};
      nodes[`${prefix}-bkw${i}`] = {transform: p > 0 && p < 1 ? `scale(${r(0.5 + 0.5 * p, 3)})` : ''};
    }
    for (const side of ['a', 'b']) {
      const cell = row[side];
      if (!cell.present) nodes[`${prefix}-h${side}${i}`] = {opacity: r(o.diff === i ? st.absentHi : 0, 3)};
    }
  });
  if (o.diff >= 0) {
    nodes[`${prefix}-t${o.side}${o.diff}`] = {opacity: st.taken ? 0 : 1};
    nodes[`${prefix}-ghost`] = {opacity: r(st.taken ? st.ghost : 0, 3)};
  }
  if (st.extraKey) nodes[`${prefix}-${st.extraKey}`] = {opacity: r(st.extra ?? 0, 3)};
  return nodes;
}

/* ------------------------------------------------------------------------ */
/* Rule card, string and bulldog clip                                        */
/* ------------------------------------------------------------------------ */

/**
 * Rule card: ruler band, heading and the supplied rule text (or bars).
 * Local coordinates = board coordinates; returns box and eyelet point.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, rules:string[], head:string, size:number, bars?:boolean, maxLines?:number, headLines?:number, headScale?:number}} o
 */
export function ruleCard(ctx, o) {
  const th = ctx.theme;
  const C = dcColors(ctx);
  const bars = o.bars || !ctx.show('key');
  const pad = Math.max(18, o.w * 0.06);
  const band = Math.max(26, o.size * 1.05);
  const inner = o.w - pad * 2;
  const headSize = Math.max(18, o.size * (o.headScale ?? 0.78));
  const head = ctx.fit(o.head, {maxWidth: inner, size: headSize, minSize: headSize * 0.85, maxLines: o.headLines ?? 1, weight: 700});
  const fits = o.rules.map(t => ctx.fit(t, {maxWidth: inner, size: o.size, minSize: o.size * 0.8, maxLines: o.maxLines ?? 4, weight: 500, family: 'serif'}));
  let y = band + 14;
  const blocks = [];
  if (!bars) {
    blocks.push({kind: 'head', y});
    y += head.height + 14;
  } else y += headSize + 10;
  fits.forEach((f, i) => {
    if (i > 0) { blocks.push({kind: 'sep', y: y + 4}); y += 14; }
    blocks.push({kind: 'rule', y, f, i});
    y += bars ? Math.max(f.lines.length, 2) * f.lineHeight : f.height;
    y += 8;
  });
  const hh = y + pad * 0.6;
  const x0 = o.x, y0 = o.y;
  const parts = [
    h('path', {d: roundRectPath(x0 + 5, y0 + 8, o.w, hh, 8), fill: 'rgba(31,35,40,0.22)'}),
    h('path', {d: roundRectPath(x0, y0, o.w, hh, 8), fill: C.rule, stroke: INK, 'stroke-width': 2.5}),
    h('path', {d: `M${r(x0 + 1.5)} ${r(y0 + band)}V${r(y0 + 9)}Q${r(x0 + 1.5)} ${r(y0 + 1.5)} ${r(x0 + 9)} ${r(y0 + 1.5)}H${r(x0 + o.w - 9)}Q${r(x0 + o.w - 1.5)} ${r(y0 + 1.5)} ${r(x0 + o.w - 1.5)} ${r(y0 + 9)}V${r(y0 + band)}Z`, fill: C.ruleBand}),
    h('line', {x1: r(x0), x2: r(x0 + o.w), y1: r(y0 + band), y2: r(y0 + band), stroke: INK, 'stroke-width': 2}),
  ];
  // ruler ticks along the band (the card is a "rule": a measuring edge)
  const ticks = Math.floor((o.w - 24) / 14);
  let td = '';
  for (let i = 1; i < ticks; i++) {
    const tx = x0 + 12 + i * 14;
    const long = i % 5 === 0;
    td += `M${r(tx)} ${r(y0 + band)}v${long ? -band * 0.55 : -band * 0.3}`;
  }
  parts.push(h('path', {d: td, stroke: C.ruleTick, 'stroke-width': 1.8}));
  for (const b of blocks) {
    if (b.kind === 'head') parts.push(textBlock(head, {x: x0 + pad, y: y0 + b.y, fill: th.inkSoft, letterSpacing: 0.4, name: `${o.prefix}-head`}));
    if (b.kind === 'sep') parts.push(h('line', {x1: r(x0 + pad), x2: r(x0 + o.w - pad), y1: r(y0 + b.y), y2: r(y0 + b.y), stroke: th.paperLine, 'stroke-width': 1.5, 'stroke-dasharray': '6 6'}));
    if (b.kind === 'rule') {
      if (!bars) parts.push(textBlock(b.f, {x: x0 + pad, y: y0 + b.y, fill: INK, name: `${o.prefix}-rule${b.i}`}));
      else b.f.lines.concat(b.f.lines.length < 2 ? ['x'] : []).forEach((ln, j) => {
        const lw = b.f.lines[j] ? Math.min(inner, ctx.measure(b.f.lines[j], b.f.size, 500, 'serif')) : inner * 0.4;
        parts.push(h('rect', {x: r(x0 + pad), y: r(y0 + b.y + j * b.f.lineHeight + b.f.size * 0.25), width: r(lw), height: r(b.f.size * 0.5), rx: r(b.f.size * 0.25), fill: '#c9bf9f'}));
      });
    }
  }
  if (bars) parts.push(h('rect', {x: r(x0 + pad), y: r(y0 + band + 14 + headSize * 0.2), width: r(Math.min(inner * 0.5, 170)), height: r(headSize * 0.5), rx: 4, fill: '#b8ad8c'}));
  parts.push(pushPin(x0 + o.w / 2, y0 + band / 2, C.pinB, 10));
  const eyelet = {x: x0 + o.w / 2, y: y0 + hh - 2};
  if (o.eyelet !== false) parts.push(h('circle', {cx: r(eyelet.x), cy: r(eyelet.y - 6), r: 6.5, fill: C.metalLight, stroke: INK, 'stroke-width': 2}));
  return {node: g({name: `${o.prefix}-card`}, parts), box: {x: x0, y: y0, w: o.w, h: hh}, eyelet: {x: eyelet.x, y: eyelet.y - 6}, head, fits};
}

/**
 * Bulldog clip hanging on a string. Local origin = the centre of the token it
 * grips (its jaws close on the token's upper rim). `top` = string attachment.
 * Nodes: `${name}-body` (translate while opening), `${name}-token` (held token).
 * @param {any} ctx
 * @param {{name:string, R:number, icon?:string|null, rim?:string, tokenName?:string}} o
 */
export function bulldogClip(ctx, o) {
  const C = dcColors(ctx);
  const R = o.R;
  const jawY = -R * 0.62;
  const topY = -R * 1.5;
  const wTop = R * 1.0, wBot = R * 1.36;
  const body = g({name: `${o.name}-body`},
    // wire handles (a loop on top where the string is tied)
    h('path', {d: `M${r(-wTop * 0.36)} ${r(topY + 2)}C${r(-wTop * 0.5)} ${r(topY - R * 0.62)} ${r(wTop * 0.5)} ${r(topY - R * 0.62)} ${r(wTop * 0.36)} ${r(topY + 2)}`, fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-wTop * 0.36)} ${r(topY + 2)}C${r(-wTop * 0.5)} ${r(topY - R * 0.62)} ${r(wTop * 0.5)} ${r(topY - R * 0.62)} ${r(wTop * 0.36)} ${r(topY + 2)}`, fill: 'none', stroke: C.metalLight, 'stroke-width': 3.2, 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-wTop / 2)} ${r(topY)}H${r(wTop / 2)}L${r(wBot / 2)} ${r(jawY)}H${r(-wBot / 2)}Z`, fill: C.metalDark, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-wTop / 2 + 6)} ${r(topY + 6)}H${r(wTop / 2 - 6)}`, stroke: C.metal, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('rect', {x: r(-wBot / 2 - 2), y: r(jawY - 5), width: r(wBot + 4), height: 9, rx: 3, fill: C.metal, stroke: INK, 'stroke-width': 2}),
  );
  const loopTop = {x: 0, y: topY - R * 0.46};
  return {body, loopTop, jawY, R};
}

/**
 * String (connector) from the rule card's eyelet to the clip's loop, with a
 * gentle sag. Returns path data for given end points.
 */
export function stringPath(a, b, sag = 10) {
  const mx = (a.x + b.x) / 2 + sag, my = (a.y + b.y) / 2;
  return `M${r(a.x)} ${r(a.y)}Q${r(mx)} ${r(my)} ${r(b.x)} ${r(b.y)}`;
}

/* ------------------------------------------------------------------------ */
/* Callout with an elbow leader (routed through free gutters)                */
/* ------------------------------------------------------------------------ */

/**
 * Editorial callout whose leader follows a polyline (e.g. out to a gutter,
 * along it, then in to the target), so it never crosses the objects between
 * a stacked chip and its target. Same frame() contract as calloutChip().
 * @param {any} ctx
 * @param {{name:string, text:string, x:number, y:number, maxWidth:number, maxLines?:number, size?:number, route:(box:any)=>Array<{x:number,y:number}>, color?:string}} o
 */
export function elbowCallout(ctx, o) {
  const th = ctx.theme;
  const color = o.color ?? th.ink;
  const size = o.size ?? 24;
  const padX = size * 0.6, padY = size * 0.38;
  const fit = ctx.fit(o.text, {maxWidth: o.maxWidth - padX * 2, size, minSize: size * 0.8, maxLines: o.maxLines ?? 3, weight: 600});
  const w = fit.width + padX * 2, hh = fit.height + padY * 2;
  const box = {x: o.x, y: o.y, w, h: hh};
  const pts = o.route(box);
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
  const end = pts[pts.length - 1];
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-lead`, d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 4)}`, 'stroke-dashoffset': r(len)}),
    h('circle', {name: `${o.name}-dot`, cx: r(end.x), cy: r(end.y), r: 7, fill: color, stroke: th.card, 'stroke-width': 2.5, opacity: 0}),
    g({name: `${o.name}-chip`},
      h('path', {d: roundRectPath(box.x, box.y, w, hh, Math.min(hh / 2, size * 0.7)), fill: th.card, stroke: color, 'stroke-width': 2}),
      textBlock(fit, {x: box.x + w / 2, y: box.y + padY, anchor: 'middle', fill: th.ink})),
  );
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-lead`]: {'stroke-dashoffset': r(len * (1 - Math.min(1, p * 1.6)))},
    [`${o.name}-dot`]: {opacity: p >= 0.6 ? 1 : 0},
    [`${o.name}-chip`]: {opacity: Math.min(1, Math.max(0, (p - 0.45) / 0.55))},
  });
  return {node, frame, box, pts};
}

/* ------------------------------------------------------------------------ */
/* Sticky note (issue)                                                       */
/* ------------------------------------------------------------------------ */

/**
 * Pinned sticky note with a heading and body text. Local = board coords.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, head:string, text:string, size:number, rot?:number, lines?:number, headScale?:number}} o
 */
export function stickyNote(ctx, o) {
  const th = ctx.theme;
  const C = dcColors(ctx);
  const pad = 16;
  const hs = o.headScale ?? 0.8;
  const hf = ctx.fit(o.head, {maxWidth: o.w - pad * 2, size: o.size * hs, minSize: o.size * hs * 0.88, maxLines: 1, weight: 700});
  const bf = ctx.fit(o.text, {maxWidth: o.w - pad * 2, size: o.size, minSize: o.size * 0.82, maxLines: o.lines ?? 4, weight: 500});
  const hh = pad + hf.height + 10 + bf.height + pad + 4;
  const x = o.x, y = o.y;
  const node = g({name: o.name, opacity: 0},
    g({transform: o.rot ? `rotate(${o.rot} ${r(x + o.w / 2)} ${r(y)})` : undefined},
      h('path', {d: roundRectPath(x + 5, y + 8, o.w, hh, 4), fill: 'rgba(31,35,40,0.2)'}),
      h('path', {d: `M${r(x)} ${r(y)}H${r(x + o.w)}V${r(y + hh - 18)}L${r(x + o.w - 18)} ${r(y + hh)}H${r(x)}Z`, fill: C.note, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(x + o.w)} ${r(y + hh - 18)}L${r(x + o.w - 18)} ${r(y + hh)}V${r(y + hh - 18)}Z`, fill: C.noteShade, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
      textBlock(hf, {x: x + pad, y: y + pad + 4, fill: th.inkSoft, letterSpacing: 0.3}),
      textBlock(bf, {x: x + pad, y: y + pad + 4 + hf.height + 10, fill: INK}),
      pushPin(x + o.w / 2, y + 6, C.pinA, 9)),
  );
  return {node, box: {x: x - 4, y: y - 6, w: o.w + 10, h: hh + 14}};
}

/* ------------------------------------------------------------------------ */
/* Hand-held magnifier (top-down arm + lens with a real magnified copy)      */
/* ------------------------------------------------------------------------ */

/**
 * Point where the arm enters the board: the shoulder sits on the ray from
 * the hand in direction `psi`, just outside the window (or further, so the
 * arm keeps a natural bend). Continuous in the hand position.
 */
export function entryShoulder(hand, psi, win, reach, margin = 34) {
  const dx = Math.cos(psi), dy = Math.sin(psi);
  let t = Infinity;
  if (dx > 1e-6) t = Math.min(t, (win.x + win.w - hand.x) / dx);
  if (dx < -1e-6) t = Math.min(t, (win.x - hand.x) / dx);
  if (dy > 1e-6) t = Math.min(t, (win.y + win.h - hand.y) / dy);
  if (dy < -1e-6) t = Math.min(t, (win.y - hand.y) / dy);
  const d = Math.max(t + margin, reach * 0.86);
  return {x: hand.x + dx * d, y: hand.y + dy * d, d, cross: {x: hand.x + dx * Math.max(0, t), y: hand.y + dy * Math.max(0, t)}};
}

/**
 * Smooth entry direction for an arm that comes from the lower right: leaning
 * toward the right edge when that edge is nearer, toward the bottom edge
 * otherwise (degrees → radians). Continuous in the point.
 * @param {{x:number,y:number}} pt
 * @param {{x:number,y:number,w:number,h:number}} win
 * @param {{right?:number, bottom?:number, soft?:number}} [o]
 */
export function entryAngle(pt, win, o = {}) {
  const dR = win.x + win.w - pt.x, dB = win.y + win.h - pt.y;
  const k = 1 / (1 + Math.exp(-(dR - dB) / (o.soft ?? 140)));
  return ((o.right ?? 18) + ((o.bottom ?? 78) - (o.right ?? 18)) * k) * Math.PI / 180;
}

/**
 * Hand-held magnifier on a top-down arm. The glass shows `content` (a copy
 * of the board drawn in board coordinates) scaled about the lens centre.
 * Layers are returned separately so the scene can order them:
 *   shadow (on the board) → arm → palm → handle → thumb → lens.
 * @param {any} ctx
 * @param {{name:string, look:{skin:string, outfit:string}, R:number, zoom:number, grip?:number, armWidth?:number, upper?:number, lower?:number, content:any, held?:{icon:string, rim:string, R:number}|null}} o
 */
export function lensRig(ctx, o) {
  const C = dcColors(ctx);
  const N = o.name;
  const R = o.R;
  const grip = o.grip ?? R + 150;
  const armW = o.armWidth ?? 50;
  const arm = topArm(ctx, {name: `${N}-arm`, skin: o.look.skin, sleeve: o.look.outfit, handed: 'right', width: armW, upper: o.upper ?? 300, lower: o.lower ?? 270});
  const ferruleL = R * 0.22;
  const hw = Math.max(13, R * 0.13);
  // handle along +x from the rim to just behind the fist (local origin = lens centre)
  const hx0 = R + ferruleL, hx1 = grip + armW * 0.9;
  const handle = g({name: `${N}-handle`},
    h('rect', {x: r(R - 4), y: r(-hw * 0.85), width: r(ferruleL + 8), height: r(hw * 1.7), rx: 3, fill: C.metal, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(hx0, -hw, hx1 - hx0, hw * 2, hw), fill: C.handle, stroke: INK, 'stroke-width': 2.4}),
    h('line', {x1: r(hx0 + 10), x2: r(hx1 - 14), y1: r(-hw * 0.45), y2: r(-hw * 0.45), stroke: C.handleLight, 'stroke-width': 3, 'stroke-linecap': 'round'}),
  );
  const shadow = g({name: `${N}-shadow`, opacity: 0},
    h('circle', {r: R, fill: 'rgba(31,35,40,0.2)'}),
    h('rect', {x: r(R), y: r(-hw), width: r(hx1 - R), height: r(hw * 2), rx: r(hw), fill: 'rgba(31,35,40,0.16)'}),
  );
  const clipId = `${N}-glassclip`;
  const heldR = o.held ? o.held.R : R * 0.3;
  const lens = g({name: `${N}-lens`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${N}-clipc`, r: r(R - 5)}))),
    h('circle', {name: `${N}-under`, r: r(R - 2), fill: C.glass}),
    g({'clip-path': ctx.ref(clipId)},
      g({name: `${N}-zoom`}, g({name: `${N}-zc`}, o.content)),
      h('circle', {name: `${N}-tint`, r: r(R), fill: C.glass, opacity: 0.2}),
      o.held ? g({name: `${N}-held`, opacity: 0}, factToken(ctx, {R: heldR, icon: o.held.icon, rim: o.held.rim})) : null,
    ),
    g({name: `${N}-rim`},
      h('circle', {r: r(R), fill: 'none', stroke: INK, 'stroke-width': r(R * 0.13 + 4)}),
      h('circle', {r: r(R), fill: 'none', stroke: C.metalDark, 'stroke-width': r(R * 0.13)}),
      h('circle', {r: r(R - R * 0.03), fill: 'none', stroke: C.metalLight, 'stroke-width': 2, opacity: 0.8}),
      h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.42)}A${r(R * 0.78)} ${r(R * 0.78)} 0 0 1 ${r(-R * 0.1)} ${r(-R * 0.76)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.07), 'stroke-linecap': 'round', opacity: 0.75}),
      h('path', {d: `M${r(R * 0.5)} ${r(R * 0.48)}A${r(R * 0.72)} ${r(R * 0.72)} 0 0 1 ${r(R * 0.2)} ${r(R * 0.66)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.04), 'stroke-linecap': 'round', opacity: 0.55}),
    ),
  );
  const reach = arm.reach;

  /**
   * Pose so the lens centre sits on `target` with the handle along the forearm.
   * @param {{x:number,y:number}} target
   * @param {{psi:number, win:{x:number,y:number,w:number,h:number}, lift:number, focus:number, held?:number, bend?:1|-1}} s
   */
  function pose(target, s) {
    // two loop-free passes: (1) a provisional hand along psi gives the forearm angle a0;
    // (2) the hand is placed so the handle (at a0) puts the lens exactly on target, and the
    // arm is solved for that hand. The handle keeps angle a0; the palm follows the forearm.
    const bend = s.bend ?? -1;
    const h0 = {x: target.x + Math.cos(s.psi) * grip, y: target.y + Math.sin(s.psi) * grip};
    const s0 = entryShoulder(h0, s.psi, s.win, reach);
    const a = arm.pose(s0, h0, bend).angle;
    const h1 = {x: target.x - Math.cos(a) * grip, y: target.y - Math.sin(a) * grip};
    const shoulder = entryShoulder(h1, s.psi, s.win, reach);
    const res = arm.pose(shoulder, h1, bend);
    const hand = res.hand;
    const L = {x: hand.x + Math.cos(a) * grip, y: hand.y + Math.sin(a) * grip};
    const wrist = Math.abs(((res.angle - a + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) * 180 / Math.PI;
    const deg = (a * 180) / Math.PI + 180;
    const off = 6 + 26 * s.lift;
    const nodes = {
      ...res.nodes,
      [`${N}-handle`]: {transform: T(L.x, L.y, deg)},
      [`${N}-shadow`]: {transform: T(L.x + off, L.y + off * 1.25, deg), opacity: r(0.35 + 0.5 * s.lift, 3)},
      [`${N}-lens`]: {transform: T(L.x, L.y)},
      [`${N}-zc`]: {transform: `${T(-L.x, -L.y)}`},
      [`${N}-zoom`]: {transform: `scale(${r(o.zoom, 4)})`, opacity: r(clamp(s.focus), 3)},
      [`${N}-tint`]: {opacity: r(0.14 + 0.5 * (1 - clamp(s.focus)), 3)},
    };
    if (o.held) nodes[`${N}-held`] = {opacity: s.held ? 1 : 0, transform: `scale(${r(o.zoom, 4)})`};
    return {nodes, hand, lens: L, angle: a, shoulder, wrist, reached: res.reached && shoulder.d <= reach - 1, cross: shoulder.cross};
  }
  return {arm: arm.arm, palm: arm.palm, thumb: arm.thumb, handle, shadow, lens, pose, reach, grip, R};
}

/* ------------------------------------------------------------------------ */
/* Stand-alone magnifier (no hand) and a two-cell comparison view            */
/* ------------------------------------------------------------------------ */

/**
 * Magnifier drawn on its own (mechanism / inspect): rim, glass, a handle at
 * `handleDeg`, and `content` drawn in lens-local coordinates (origin = lens
 * centre) clipped to the glass. Named: `${name}` (group), `${name}-view`
 * (content group), `${name}-tint`.
 * @param {any} ctx
 * @param {{name:string, R:number, handleDeg?:number, content?:any, handleLen?:number}} o
 */
export function magnifierArt(ctx, o) {
  const C = dcColors(ctx);
  const R = o.R;
  const clipId = `${o.name}-gclip`;
  const hl = o.handleLen ?? R * 1.25;
  const hw = Math.max(12, R * 0.12);
  return g({name: o.name},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {r: r(R - 5)}))),
    g({transform: `rotate(${o.handleDeg ?? 45})`},
      h('rect', {x: r(R + 6), y: r(-hw + 8), width: r(hl + R * 0.22), height: r(hw * 2), rx: r(hw), fill: 'rgba(31,35,40,0.15)'}),
      h('rect', {x: r(R - 4), y: r(-hw * 0.85), width: r(R * 0.22 + 8), height: r(hw * 1.7), rx: 3, fill: C.metal, stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(R + R * 0.22, -hw, hl, hw * 2, hw), fill: C.handle, stroke: INK, 'stroke-width': 2.4}),
      h('line', {x1: r(R + R * 0.22 + 10), x2: r(R + R * 0.22 + hl - 14), y1: r(-hw * 0.45), y2: r(-hw * 0.45), stroke: C.handleLight, 'stroke-width': 3, 'stroke-linecap': 'round'})),
    h('circle', {cx: 6, cy: 10, r: r(R + 4), fill: 'rgba(31,35,40,0.14)'}),
    h('circle', {r: r(R - 2), fill: C.glass}),
    g({'clip-path': ctx.ref(clipId)}, g({name: `${o.name}-view`}, o.content || null), h('circle', {name: `${o.name}-tint`, r: r(R), fill: C.glass, opacity: 0.18})),
    h('circle', {r: r(R), fill: 'none', stroke: INK, 'stroke-width': r(R * 0.12 + 4)}),
    h('circle', {r: r(R), fill: 'none', stroke: C.metalDark, 'stroke-width': r(R * 0.12)}),
    h('circle', {r: r(R * 0.97), fill: 'none', stroke: C.metalLight, 'stroke-width': 2, opacity: 0.8}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.42)}A${r(R * 0.78)} ${r(R * 0.78)} 0 0 1 ${r(-R * 0.1)} ${r(-R * 0.76)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.07), 'stroke-linecap': 'round', opacity: 0.75}),
  );
}

/**
 * Magnified comparison of one row: the present token, the broken link and
 * the empty socket side by side (lens-local coordinates, centred at 0,0).
 * `order` gives which side is drawn on the left. Named nodes use `prefix`.
 * @param {any} ctx
 * @param {{prefix:string, R:number, icon:string|null, present:'a'|'b'|null, left:'a'|'b'}} o
 */
export function rowComparison(ctx, o) {
  const C = dcColors(ctx);
  const R = o.R;
  const dx = R * 1.18;
  const cell = (side, x) => {
    const rim = side === 'a' ? C.a : C.b;
    if (o.present === side || o.present === null) return g({transform: T(x, 0)}, factToken(ctx, {name: `${o.prefix}-${side}`, R, icon: o.icon || 'document', rim}));
    return g({transform: T(x, 0)}, slotRing(ctx, {name: `${o.prefix}-${side}`, R, hiName: `${o.prefix}-${side}-hi`}));
  };
  const right = o.left === 'a' ? 'b' : 'a';
  return g({name: o.prefix},
    h('rect', {x: r(-R * 3.2), y: r(-R * 3.2), width: r(R * 6.4), height: r(R * 6.4), fill: '#fffdf8'}),
    h('line', {x1: r(-R * 3.2), x2: r(R * 3.2), y1: r(-R * 1.45), y2: r(-R * 1.45), stroke: '#c9c2b4', 'stroke-width': 2}),
    h('line', {x1: r(-R * 3.2), x2: r(R * 3.2), y1: r(R * 1.45), y2: r(R * 1.45), stroke: '#c9c2b4', 'stroke-width': 2}),
    cell(o.left, -dx), cell(right, dx),
    g({transform: T(0, 0)}, g({name: `${o.prefix}-lkw`}, linkMark(ctx, {name: `${o.prefix}-lk`, s: R * 0.5, broken: o.present !== null}))),
  );
}

/* ------------------------------------------------------------------------ */
/* Horizontal case strips (contrast): earlier case above, new case below     */
/* ------------------------------------------------------------------------ */

/**
 * Two case strips stacked across a horizontal seam, one COLUMN per fact.
 * Tokens sit at the inner edges, so the two tokens of a column face each
 * other across the seam. Each strip's case label rides in its outer band, on
 * the side away from `avoidX` (the column a comparison guide has to cross).
 * Row records share the shape of pairGeometry() rows (plus `link` points and
 * vertical links), so pairTokens() and pairFrame() work unchanged.
 * @param {any} ctx
 * @param {{x:number, y:number, w:number, h:number, facts:ReturnType<typeof resolveFacts>, labels:{a:string,b:string},
 *          labelSize:number, R?:number, gap?:number, avoidX?:number|null, avoidHalf?:number, maxR?:number,
 *          avoid?:{a?:Array<{x:number,half:number}>, b?:Array<{x:number,half:number}>}}} o
 */
export function stripGeometry(ctx, o) {
  const n = o.facts.n;
  const colW = o.w / n;
  const gap = o.gap ?? 14;
  const pad = 26;
  const showKey = ctx.show('key');
  // label span per strip: the widest free run of its band once the avoided columns are cut out
  // (o.avoid = {a: [{x, half}], b: [...]}; the legacy avoidX/avoidHalf applies to both bands)
  const legacy = o.avoidX != null ? [{x: o.avoidX, half: Math.max(26, o.avoidHalf ?? 0)}] : [];
  const spanFor = side => {
    const cuts = [...legacy, ...((o.avoid && o.avoid[side]) || [])].map(c => [c.x - Math.max(26, c.half), c.x + Math.max(26, c.half)]).sort((p, q) => p[0] - q[0]);
    const runs = [];
    let x = o.x + pad;
    for (const [c0, c1] of cuts) {
      if (c0 > x) runs.push({x0: x, x1: c0});
      x = Math.max(x, c1);
    }
    if (o.x + o.w - pad > x) runs.push({x0: x, x1: o.x + o.w - pad});
    const best = runs.sort((p, q) => (q.x1 - q.x0) - (p.x1 - p.x0))[0] || {x0: o.x + pad, x1: o.x + o.w - pad};
    // a run touching the right end is right-aligned, otherwise left-aligned
    return {...best, anchor: best.x0 > o.x + pad + 1 && best.x1 >= o.x + o.w - pad - 1 ? 'end' : 'start'};
  };
  const spans = {a: spanFor('a'), b: spanFor('b')};
  const badgeR = Math.max(10, o.labelSize * 0.42);
  const textMax = side => Math.max(60, spans[side].x1 - spans[side].x0 - badgeR * 2 - 12);
  // one line (shrinking within a bound) when possible, two lines otherwise
  const fitLab = (t, side) => {
    const one = ctx.fit(t, {maxWidth: textMax(side), size: o.labelSize, minSize: o.labelSize * 0.82, maxLines: 1, weight: 700});
    return one.truncated ? ctx.fit(t, {maxWidth: textMax(side), size: o.labelSize, minSize: o.labelSize * 0.8, maxLines: 2, weight: 700}) : one;
  };
  const labA = fitLab(o.labels.a, 'a'), labB = fitLab(o.labels.b, 'b');
  const bandH = Math.max(34, o.labelSize * 1.5, (showKey ? Math.max(labA.height, labB.height) : 0) + 12);
  const R = o.R ?? clamp(Math.min(colW * 0.38, (o.h - 2 * bandH - gap - 48) / 4.2, o.maxR ?? 46), 18, o.maxR ?? 46);
  const zoneH = 2 * R + 24;
  const cardH = bandH + zoneH;
  const totalH = 2 * cardH + gap;
  const top = o.y + (o.h - totalH) / 2;
  const seamY = top + cardH + gap / 2;
  const off = gap / 2 + R + 10;
  const rows = o.facts.rows.map((f, i) => {
    const cx = o.x + colW * (i + 0.5);
    return {i, cx, cy: seamY, icon: f.icon, both: f.inA && f.inB, link: {x: cx, y: seamY},
      a: {x: cx, y: seamY - off, present: f.inA}, b: {x: cx, y: seamY + off, present: f.inB}};
  });
  const cardA = {x: o.x, y: top, w: o.w, h: cardH};
  const cardB = {x: o.x, y: seamY + gap / 2, w: o.w, h: cardH};
  const bandY = {a: top, b: cardB.y + zoneH};
  const place = side => {
    const sp = spans[side];
    const badgeX = sp.anchor === 'start' ? sp.x0 + badgeR : sp.x1 - badgeR;
    const textX = sp.anchor === 'start' ? badgeX + badgeR + 12 : badgeX - badgeR - 12;
    return {badgeX, textX, anchor: sp.anchor, textMax: textMax(side)};
  };
  const lp = {a: place('a'), b: place('b')};
  const labBox = side => {
    const f = side === 'a' ? labA : labB;
    const cy = bandY[side] + bandH / 2;
    const w = badgeR * 2 + 12 + (showKey ? f.width : Math.min(lp[side].textMax, 150));
    return {x: lp[side].anchor === 'start' ? spans[side].x0 - 2 : spans[side].x1 - w - 2, y: cy - Math.max(badgeR, f.height / 2) - 3, w: w + 4, h: Math.max(badgeR * 2, f.height) + 6};
  };
  return {vertical: true, rows, R, colW, seamY, gap, off, cardA, cardB, bandH, zoneH, bandY, badgeR, lp, labA, labB,
    labBox: {a: labBox('a'), b: labBox('b')}, labelSize: o.labelSize, box: {x: o.x, y: top, w: o.w, h: totalH}};
}

/**
 * Draw the two strips (paper, outer label band, column rules, pins).
 * @param {any} ctx
 * @param {ReturnType<typeof stripGeometry>} geo
 * @param {{prefix:string, bars?:boolean}} o
 */
export function stripPaper(ctx, geo, o) {
  const th = ctx.theme;
  const C = dcColors(ctx);
  const bars = o.bars || !ctx.show('key');
  const out = [];
  for (const side of ['a', 'b']) {
    const card = side === 'a' ? geo.cardA : geo.cardB;
    const col = side === 'a' ? C.a : C.b;
    const soft = side === 'a' ? C.aSoft : C.bSoft;
    const by = geo.bandY[side];
    const lab = side === 'a' ? geo.labA : geo.labB;
    const parts = [];
    parts.push(h('path', {d: roundRectPath(card.x + 5, card.y + 8, card.w, card.h, 8), fill: 'rgba(31,35,40,0.22)'}));
    parts.push(h('path', {d: roundRectPath(card.x, card.y, card.w, card.h, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.5}));
    // outer band (top of the earlier strip, bottom of the new strip)
    parts.push(h('path', {d: side === 'a'
      ? `M${r(card.x + 1.5)} ${r(by + geo.bandH)}V${r(by + 9)}Q${r(card.x + 1.5)} ${r(by + 1.5)} ${r(card.x + 9)} ${r(by + 1.5)}H${r(card.x + card.w - 9)}Q${r(card.x + card.w - 1.5)} ${r(by + 1.5)} ${r(card.x + card.w - 1.5)} ${r(by + 9)}V${r(by + geo.bandH)}Z`
      : `M${r(card.x + 1.5)} ${r(by)}V${r(by + geo.bandH - 9)}Q${r(card.x + 1.5)} ${r(by + geo.bandH - 1.5)} ${r(card.x + 9)} ${r(by + geo.bandH - 1.5)}H${r(card.x + card.w - 9)}Q${r(card.x + card.w - 1.5)} ${r(by + geo.bandH - 1.5)} ${r(card.x + card.w - 1.5)} ${r(by + geo.bandH - 9)}V${r(by)}Z`, fill: soft}));
    const ly = side === 'a' ? by + geo.bandH : by;
    parts.push(h('line', {x1: r(card.x), x2: r(card.x + card.w), y1: r(ly), y2: r(ly), stroke: col, 'stroke-width': 3}));
    // column rules across the token zone
    const zy0 = side === 'a' ? by + geo.bandH + 8 : card.y + 8;
    const zy1 = side === 'a' ? card.y + card.h - 8 : by - 8;
    geo.rows.forEach((row, i) => {
      if (i > 0) parts.push(h('line', {x1: r(row.cx - geo.colW / 2), x2: r(row.cx - geo.colW / 2), y1: r(zy0), y2: r(zy1), stroke: th.paperLine, 'stroke-width': 1.5, 'stroke-dasharray': '5 6'}));
    });
    // label: coloured badge (stays when labels are hidden) + case label
    const cy = by + geo.bandH / 2;
    const lp = geo.lp[side];
    parts.push(h('circle', {cx: r(lp.badgeX), cy: r(cy), r: r(geo.badgeR), fill: col, stroke: INK, 'stroke-width': 2}));
    parts.push(h('circle', {cx: r(lp.badgeX), cy: r(cy), r: r(geo.badgeR * 0.38), fill: '#ffffff', opacity: 0.85}));
    if (!bars) parts.push(textBlock(lab, {x: r(lp.textX), y: r(cy - lab.height / 2), anchor: lp.anchor, fill: INK, name: `${o.prefix}-lab-${side}`}));
    else {
      const bw = Math.min(lp.textMax, 150);
      parts.push(h('rect', {x: r(lp.anchor === 'start' ? lp.textX : lp.textX - bw), y: r(cy - 6), width: r(bw), height: 12, rx: 6, fill: shade(col, 0.2), opacity: 0.7}));
    }
    // pins at the outer corners
    const py = side === 'a' ? card.y + 11 : card.y + card.h - 11;
    parts.push(pushPin(card.x + 11, py, side === 'a' ? C.pinA : C.pinC, 7));
    parts.push(pushPin(card.x + card.w - 11, py, side === 'a' ? C.pinC : C.pinA, 7));
    out.push(g({name: `${o.prefix}-strip-${side}`}, parts));
  }
  return g(null, out);
}

/**
 * Paper flap pinned over one cell (hides what the cell holds until the change
 * beat). Local origin = the cell centre. Frame: peel(p) folds it up about its
 * top edge and fades it.
 * @param {any} ctx
 * @param {{name:string, R:number}} o
 */
export function coverFlap(ctx, o) {
  const C = dcColors(ctx);
  const s = o.R * 2.35;
  const f = s * 0.24;
  const node = g({name: o.name},
    g({name: `${o.name}-peel`},
      h('path', {d: roundRectPath(-s / 2 + 4, -s / 2 + 7, s, s, 4), fill: 'rgba(31,35,40,0.2)'}),
      h('path', {d: `M${r(-s / 2)} ${r(-s / 2)}H${r(s / 2)}V${r(s / 2 - f)}L${r(s / 2 - f)} ${r(s / 2)}H${r(-s / 2)}Z`, fill: C.note, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(s / 2)} ${r(s / 2 - f)}L${r(s / 2 - f)} ${r(s / 2)}V${r(s / 2 - f)}Z`, fill: C.noteShade, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
      // pencil scribbles: a covered entry (no text)
      h('path', {d: `M${r(-s * 0.3)} ${r(-s * 0.08)}q${r(s * 0.15)} ${r(-s * 0.07)} ${r(s * 0.3)} 0t${r(s * 0.3)} 0M${r(-s * 0.3)} ${r(s * 0.12)}q${r(s * 0.12)} ${r(-s * 0.06)} ${r(s * 0.24)} 0t${r(s * 0.2)} 0`, fill: 'none', stroke: '#a38a44', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
    ),
    pushPin(0, -s / 2 + 9, C.pinA, 7),
  );
  const frame = p => {
    const k = clamp(p);
    return {
      [o.name]: {opacity: r(1 - clamp((k - 0.7) / 0.3), 3), transform: k > 0.7 ? T(0, -s * 0.35 * (k - 0.7) / 0.3) : ''},
      [`${o.name}-peel`]: {transform: k > 0 ? `translate(0 ${r(-s / 2)}) scale(1 ${r(1 - 0.9 * Math.min(1, k / 0.7), 4)}) translate(0 ${r(s / 2)})` : ''},
    };
  };
  return {node, frame, size: s};
}

/**
 * Free magnifier (no hand; used where the lens is an instrument in a diagram
 * or a paired scene). The glass shows a REAL enlarged copy of `content`
 * (drawn in the same coordinates as the scene) scaled about the lens centre;
 * a carried token rides in the glass; the shadow grows with lift.
 * Nodes: `${name}` (lens), `${name}-shadow`, `${name}-zoom`, `${name}-zc`,
 * `${name}-tint`, `${name}-held`.
 * @param {any} ctx
 * @param {{name:string, R:number, zoom:number, content:any, handleDeg?:number, handleLen?:number, held?:{icon:string, rim:string, R:number}|null}} o
 */
export function freeLens(ctx, o) {
  const C = dcColors(ctx);
  const N = o.name;
  const R = o.R;
  const hl = o.handleLen ?? R * 1.2;
  const hw = Math.max(10, R * 0.13);
  const deg = o.handleDeg ?? 45;
  const clipId = `${N}-gclip`;
  const ferr = R * 0.22;
  const handle = g({name: `${N}-hdl`, transform: `rotate(${r(deg)})`},
    h('rect', {x: r(R - 4), y: r(-hw * 0.85), width: r(ferr + 8), height: r(hw * 1.7), rx: 3, fill: C.metal, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(R + ferr, -hw, hl, hw * 2, hw), fill: C.handle, stroke: INK, 'stroke-width': 2.4}),
    h('line', {x1: r(R + ferr + 10), x2: r(R + ferr + hl - 12), y1: r(-hw * 0.45), y2: r(-hw * 0.45), stroke: C.handleLight, 'stroke-width': 3, 'stroke-linecap': 'round'}));
  const shadow = g({name: `${N}-shadow`, opacity: 0},
    h('circle', {r: r(R), fill: 'rgba(31,35,40,0.2)'}),
    g({name: `${N}-hdls`, transform: `rotate(${r(deg)})`}, h('rect', {x: r(R), y: r(-hw), width: r(hl + ferr), height: r(hw * 2), rx: r(hw), fill: 'rgba(31,35,40,0.16)'})));
  const node = g({name: N},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {r: r(R - 5)}))),
    handle,
    h('circle', {r: r(R - 2), fill: C.glass}),
    g({'clip-path': ctx.ref(clipId)},
      g({name: `${N}-zoom`}, g({name: `${N}-zc`}, o.content)),
      h('circle', {name: `${N}-tint`, r: r(R), fill: C.glass, opacity: 0.2}),
      o.held ? g({name: `${N}-held`, opacity: 0}, g({transform: `scale(${r(o.zoom, 4)})`}, factToken(ctx, {R: o.held.R, icon: o.held.icon, rim: o.held.rim}))) : null),
    h('circle', {r: r(R), fill: 'none', stroke: INK, 'stroke-width': r(R * 0.12 + 4)}),
    h('circle', {r: r(R), fill: 'none', stroke: C.metalDark, 'stroke-width': r(R * 0.12)}),
    h('circle', {r: r(R * 0.97), fill: 'none', stroke: C.metalLight, 'stroke-width': 2, opacity: 0.8}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.42)}A${r(R * 0.78)} ${r(R * 0.78)} 0 0 1 ${r(-R * 0.1)} ${r(-R * 0.76)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.07), 'stroke-linecap': 'round', opacity: 0.75}),
  );
  /**
   * @param {{x:number,y:number}} L lens centre
   * @param {{lift:number, focus:number, held?:number, scale?:number, deg?:number}} s  deg: handle direction (the holder turns it)
   */
  function pose(L, s) {
    const off = 5 + 22 * s.lift;
    const sc = s.scale ?? 1;
    const hd = s.deg ?? deg;
    const nodes = {
      [`${N}-hdl`]: {transform: `rotate(${r(hd)})`},
      [`${N}-hdls`]: {transform: `rotate(${r(hd)})`},
      [N]: {transform: T(L.x, L.y, 0, sc)},
      [`${N}-shadow`]: {transform: T(L.x + off, L.y + off * 1.25, 0, sc), opacity: r(0.35 + 0.5 * s.lift, 3)},
      [`${N}-zc`]: {transform: T(-L.x, -L.y)},
      [`${N}-zoom`]: {transform: `scale(${r(o.zoom, 4)})`, opacity: r(clamp(s.focus), 3)},
      [`${N}-tint`]: {opacity: r(0.14 + 0.5 * (1 - clamp(s.focus)), 3)},
    };
    if (o.held) nodes[`${N}-held`] = {opacity: s.held ? 1 : 0};
    return nodes;
  }
  return {node, shadow, pose, R, zoom: o.zoom};
}

/**
 * A bulldog clip hanging on a string from an eyelet (the connector that ends
 * up holding the extracted fact), optionally carrying a hidden fact token.
 * Nodes: `${p}-str`, `${p}-strd` (dashed overlay for a disputed state),
 * `${p}-swing`, `${p}-clip-body`, `${p}-ctok`, `${p}-ctokg`.
 * @param {any} ctx
 * @param {{prefix:string, eyelet:{x:number,y:number}, c:{x:number,y:number}, R:number, icon?:string|null, rim?:string}} o
 */
export function hangingClip(ctx, o) {
  const cl = bulldogClip(ctx, {name: `${o.prefix}-clip`, R: o.R});
  const top = {x: o.c.x, y: o.c.y + cl.loopTop.y};
  const tok = o.icon ? factToken(ctx, {name: `${o.prefix}-ctok`, R: o.R, icon: o.icon, rim: o.rim, opacity: 0}) : null;
  const node = g({name: `${o.prefix}-clipg`},
    h('line', {name: `${o.prefix}-str`, x1: r(o.eyelet.x), y1: r(o.eyelet.y), x2: r(top.x), y2: r(top.y), stroke: '#5b4a3a', 'stroke-width': 3.2, 'stroke-linecap': 'round'}),
    h('line', {name: `${o.prefix}-strd`, x1: r(o.eyelet.x), y1: r(o.eyelet.y), x2: r(top.x), y2: r(top.y), stroke: ctx.theme.accent, 'stroke-width': 4, 'stroke-dasharray': '9 8', 'stroke-linecap': 'round', opacity: 0}),
    g({name: `${o.prefix}-swing`},
      g({transform: T(o.c.x, o.c.y)}, tok ? g({name: `${o.prefix}-ctokg`}, tok) : null, cl.body)));
  /** @param {{open:number, tokenOn?:boolean, swing?:number, grow?:number, disputed?:number}} s */
  const frame = s => {
    const out = {
      [`${o.prefix}-clip-body`]: {transform: T(0, -o.R * 0.26 * clamp(s.open))},
      [`${o.prefix}-swing`]: {transform: s.swing ? `rotate(${r(s.swing)} ${r(o.eyelet.x)} ${r(o.eyelet.y)})` : ''},
      [`${o.prefix}-str`]: {opacity: r(1 - (s.disputed ?? 0), 3)},
      [`${o.prefix}-strd`]: {opacity: r(s.disputed ?? 0, 3)},
    };
    if (tok) {
      out[`${o.prefix}-ctok`] = {opacity: s.tokenOn ? 1 : 0};
      out[`${o.prefix}-ctokg`] = {transform: s.grow ? `scale(${r(1 + 0.18 * s.grow, 4)})` : ''};
    }
    return out;
  };
  return {node, frame, top, loopTop: cl.loopTop};
}

/* ------------------------------------------------------------------------ */
/* Bar magnifier (inspect): a rectangular reading lens lifted off the board  */
/* ------------------------------------------------------------------------ */

/**
 * Rectangular reading magnifier that lifts off a source region of the board
 * and travels to a destination, showing a REAL enlarged copy of `content`
 * (drawn in the board's own coordinates, so the detail keeps its source
 * coordinates: the copy is scaled about the source rectangle). Dims the rest
 * of the scene around the source (even-odd hole), draws cone lines from the
 * source to the lens and a dashed source outline. Destination must keep the
 * source aspect (uniform zoom).
 * Nodes: `${name}-dim`, `${name}-src`, `${name}-coneA/B`, `${name}-cliprect`,
 * `${name}-win`, `${name}-content`, rim parts.
 * @param {any} ctx
 * @param {{name:string, source:{x:number,y:number,w:number,h:number}, dest:{x:number,y:number,w:number,h:number}, content:any, dim?:{x:number,y:number,w:number,h:number}}} o
 */
export function barLens(ctx, o) {
  const C = dcColors(ctx);
  const th = ctx.theme;
  const N = o.name;
  const S = o.source;
  const clipId = `${N}-clip`;
  const rad = 16;
  const hole = `M${r(S.x)} ${r(S.y)}v${r(S.h)}h${r(S.w)}v${r(-S.h)}Z`;
  const node = g({name: N},
    o.dim ? h('path', {name: `${N}-dim`, d: `M${r(o.dim.x)} ${r(o.dim.y)}h${r(o.dim.w)}v${r(o.dim.h)}h${r(-o.dim.w)}Z${hole}`, 'fill-rule': 'evenodd', fill: th.dark ? '#000000' : '#1f2328', opacity: 0}) : null,
    h('path', {name: `${N}-src`, d: roundRectPath(S.x - 4, S.y - 4, S.w + 8, S.h + 8, 12), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-dasharray': '12 8', opacity: 0}),
    h('line', {name: `${N}-coneA`, stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('line', {name: `${N}-coneB`, stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${N}-cliprect`, rx: rad}))),
    g({name: `${N}-win`, opacity: 0},
      h('rect', {name: `${N}-shadow`, rx: rad, fill: 'rgba(31,35,40,0.25)'}),
      h('rect', {name: `${N}-bg`, rx: rad, fill: C.glass}),
      g({'clip-path': ctx.ref(clipId)}, g({name: `${N}-content`}, o.content),
        h('path', {name: `${N}-glare`, fill: '#ffffff', opacity: 0.16})),
      h('rect', {name: `${N}-rimO`, rx: rad, fill: 'none', stroke: INK, 'stroke-width': 15}),
      h('rect', {name: `${N}-rim`, rx: rad, fill: 'none', stroke: C.metalDark, 'stroke-width': 10}),
      h('rect', {name: `${N}-rimL`, rx: rad, fill: 'none', stroke: C.metalLight, 'stroke-width': 2, opacity: 0.85}),
      // end grips: the bar magnifier's two metal caps
      h('rect', {name: `${N}-capL`, width: 14, rx: 5, fill: C.metal, stroke: INK, 'stroke-width': 2.2}),
      h('rect', {name: `${N}-capR`, width: 14, rx: 5, fill: C.metal, stroke: INK, 'stroke-width': 2.2}),
    ),
  );
  /**
   * @param {number} p  0 = collapsed on the source (zoom 1, exact copy), 1 = at the destination
   * @param {number} [dim]
   * @param {{x:number,y:number,w:number,h:number}} [src]  where the source region currently is in
   *   world coordinates (the board may be shown as a scaled miniature); the copy stays mapped from
   *   the board's own source rectangle
   * @param {{x:number,y:number,w:number,h:number}} [dimRect]  current area to dim (the board)
   */
  const frame = (p, dim = p, src = S, dimRect = o.dim) => {
    const D = o.dest;
    const R = {x: lerp(src.x, D.x, p), y: lerp(src.y, D.y, p), w: lerp(src.w, D.w, p), h: lerp(src.h, D.h, p)};
    const k = R.w / S.w;
    const visible = p > 0.001;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h)};
    const sc = {x: src.x + src.w / 2, y: src.y + src.h / 2}, rc = {x: R.x + R.w / 2, y: R.y + R.h / 2};
    const horiz = Math.abs(rc.x - sc.x) >= Math.abs(rc.y - sc.y);
    let a1, a2, b1, b2;
    if (horiz) {
      const sx = rc.x > sc.x ? src.x + src.w : src.x, rx = rc.x > sc.x ? R.x : R.x + R.w;
      a1 = {x: sx, y: src.y}; a2 = {x: rx, y: R.y}; b1 = {x: sx, y: src.y + src.h}; b2 = {x: rx, y: R.y + R.h};
    } else {
      const sy = rc.y > sc.y ? src.y + src.h : src.y, ry = rc.y > sc.y ? R.y : R.y + R.h;
      a1 = {x: src.x, y: sy}; a2 = {x: R.x, y: ry}; b1 = {x: src.x + src.w, y: sy}; b2 = {x: R.x + R.w, y: ry};
    }
    const lift = Math.sin(Math.PI * Math.min(1, p)) * 0.5 + p * 0.5;
    const out = {
      [`${N}-src`]: {opacity: visible ? 1 : 0, d: roundRectPath(src.x - 4, src.y - 4, src.w + 8, src.h + 8, 12)},
      [`${N}-coneA`]: {x1: r(a1.x), y1: r(a1.y), x2: r(a2.x), y2: r(a2.y), opacity: p > 0.08 ? 1 : 0},
      [`${N}-coneB`]: {x1: r(b1.x), y1: r(b1.y), x2: r(b2.x), y2: r(b2.y), opacity: p > 0.08 ? 1 : 0},
      [`${N}-cliprect`]: rect,
      [`${N}-win`]: {opacity: visible ? r(Math.min(1, p * 5), 3) : 0},
      [`${N}-shadow`]: {x: r(R.x + 6 + 10 * lift), y: r(R.y + 10 + 14 * lift), width: rect.width, height: rect.height},
      [`${N}-bg`]: rect,
      [`${N}-rimO`]: rect,
      [`${N}-rim`]: rect,
      [`${N}-rimL`]: {x: r(R.x + 4), y: r(R.y + 4), width: r(Math.max(1, R.w - 8)), height: r(Math.max(1, R.h - 8))},
      [`${N}-capL`]: {x: r(R.x - 11), y: r(R.y + R.h * 0.25), height: r(R.h * 0.5)},
      [`${N}-capR`]: {x: r(R.x + R.w - 3), y: r(R.y + R.h * 0.25), height: r(R.h * 0.5)},
      [`${N}-glare`]: {d: `M${r(R.x)} ${r(R.y + R.h * 0.3)}L${r(R.x + R.w * 0.22)} ${r(R.y)}H${r(R.x + R.w * 0.34)}L${r(R.x)} ${r(R.y + R.h * 0.62)}Z`},
      [`${N}-content`]: {transform: `${T(R.x - S.x * k, R.y - S.y * k)} scale(${r(k, 4)})`},
    };
    if (o.dim) {
      const dr = dimRect || o.dim;
      out[`${N}-dim`] = {opacity: r(0.45 * clamp(dim), 3), d: `M${r(dr.x)} ${r(dr.y)}h${r(dr.w)}v${r(dr.h)}h${r(-dr.w)}ZM${r(src.x)} ${r(src.y)}v${r(src.h)}h${r(src.w)}v${r(-src.h)}Z`};
    }
    return {nodes: out, rect: R, zoom: k};
  };
  return {node, frame};
}

/**
 * State tag (dot + bold text in a rounded pill) that wraps to a second line
 * and shrinks within a bound instead of truncating (the "as supplied"
 * qualifier must stay readable). Same look as causation/kits/place.js stateTag.
 * @param {any} ctx
 * @param {string} text
 * @param {{x:number, y:number, anchor?:'start'|'middle'|'end', size?:number, maxWidth?:number, name?:string, color?:string, opacity?:number, fill?:string}} o
 */
export function wrapTag(ctx, text, o) {
  const size = o.size ?? 22;
  const padX = size * 0.7;
  const inner = (o.maxWidth ?? 320) - padX * 2 - size * 0.9;
  let fit = ctx.fit(text, {maxWidth: inner, size, minSize: size * 0.86, maxLines: 1, weight: 700});
  if (fit.truncated) fit = ctx.fit(text, {maxWidth: inner, size, minSize: size * 0.8, maxLines: 2, weight: 700});
  const w = fit.width + padX * 2 + size * 0.9;
  const hh = Math.max(size * 1.75, fit.height + size * 0.75);
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const col = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.9)), fill: o.fill ?? ctx.theme.card, stroke: col, 'stroke-width': 2}),
    h('circle', {cx: r(x + padX + size * 0.2), cy: r(o.y + hh / 2), r: r(size * 0.26), fill: col}),
    textBlock(fit, {x: x + padX + size * 0.75, y: o.y + (hh - fit.height) / 2, fill: col}),
  );
  return {node, box: {x, y: o.y, w, h: hh, cx: x + w / 2, cy: o.y + hh / 2}, fit};
}
