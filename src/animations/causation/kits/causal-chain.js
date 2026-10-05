/**
 * Motif kit for "Cadena causal" (LAW-0681..0684): shared schema fields,
 * original vector props and a toppling chain stage.
 *
 *  - Event tiles are upright panels (a die face on each shows its position in
 *    the supplied order without text). Each tile rotates about its
 *    bottom-right corner and only starts when the previous tile touches it
 *    (see ./topple.js). The last tile strikes the loss object (a vase on a
 *    display plinth), which tips over and cracks.
 *  - Link joints mark each contact point; a disputed link is drawn with a
 *    dashed ring (and a "?" when labels are on). The kit never decides a link.
 *  - Unresolved mode (`stopAtLink`): the chain reaches that link and holds;
 *    every downstream body stays upright as a dimmed solid (the held tile
 *    leans on something real) and also gets a dashed outline of the pose it
 *    would take if the chain went on (plus a dashed sweep over the first) —
 *    both possibilities shown, neither decided.
 *  - Barriers are alternative / intervening events put forward by someone;
 *    a tall barricade stands on the floor behind the tiles with its board
 *    raised above the tile tops just upstream of the link, clear of every
 *    tile's path, so it never looks as if it blocks, props or releases the
 *    chain (and it never floats).
 *  - Wrap mode (tall boxes): the chain continues from an upper landing to a
 *    lower floor — the landing's last tile tips over the edge and strikes the
 *    first lower tile, and the lower row falls back toward the plinth.
 *
 * The kit owns geometry and a pose solver only. Each entry owns its own
 * timeline, layout, labels and semantics.
 * @module animations/causation/kits/causal-chain
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath, mix} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {str, int, oneOf, list, obj} from '../../../schemas/fields.js';
import {toppleChain, bodyCorners, bodyPoint, rectPoly, poseTransform, localAt0, DEG} from './topple.js';

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const chainFields = {
  events: list('Events in the supplied order; the chain always follows this order (3–6)', obj('Event', {
    label: str('Event label (fictional, descriptive)', 90),
    time: str('Optional relative time label, e.g. "T+2 min" (shown as supplied)', 24),
  }, ['label']), 3, 6),
  causalLinks: list('Per-link data. Link i joins event i to the next event; the link after the last event joins it to the loss. Links not listed are proposed sequence links.', obj('Link', {
    from: int('Index (0-based) of the event where the link starts', 0, 5),
    kind: oneOf('sequence (default) or causal; a causal arrow is only drawn when supplied here', ['sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); the animation never resolves it', ['proposed', 'disputed']),
    label: str('Optional caption for this link', 60),
  }, ['from']), 0, 6),
  alternatives: list('Alternative or intervening events put forward by someone; drawn as a barrier beside a link, never decided', obj('Alternative', {
    label: str('Alternative event label', 80),
    link: int('Index of the link it is put forward against', 0, 5),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label', 'link']), 0, 2),
  losses: list('Loss as described. The first entry is the object that is struck; an optional second entry is a smaller object beside it.', obj('Loss', {
    label: str('Description of the loss (label hypothetical amounts as hypothetical)', 90),
  }, ['label']), 1, 2),
};

export const CHAIN_STRINGS = {
  en: {
    proposedChain: 'Proposed chain (as supplied)',
    proposed: 'proposed',
    disputedLink: 'disputed link',
    unresolved: 'unresolved',
    alternative: 'Alternative put forward',
    lossAs: 'Loss (as described)',
    supplied: 'supplied order',
    time: 'time',
    link: 'Link',
    kindSequence: 'sequence',
    kindCausal: 'causal (as supplied)',
    status: 'Status',
    kind: 'Kind',
  },
  es: {
    proposedChain: 'Cadena propuesta (según lo aportado)',
    proposed: 'propuesto',
    disputedLink: 'eslabón discutido',
    unresolved: 'sin resolver',
    alternative: 'Alternativa planteada',
    lossAs: 'Pérdida (según se describe)',
    supplied: 'orden aportado',
    time: 'tiempo',
    link: 'Eslabón',
    kindSequence: 'secuencia',
    kindCausal: 'causal (según lo aportado)',
    status: 'Estado',
    kind: 'Tipo',
  },
};

/**
 * Normalize chain data: one record per link (n events → n links, the last
 * one ending at the loss). Out-of-range link indices are ignored.
 * @param {any} p params
 */
export function resolveChain(p) {
  const n = p.events.length;
  const links = Array.from({length: n}, (_, i) => ({from: i, kind: 'sequence', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) {
    if (l.from < n) Object.assign(links[l.from], {kind: l.kind || links[l.from].kind, status: l.status || links[l.from].status, label: l.label || ''});
  }
  const alternatives = (p.alternatives || []).filter(a => a.link < n).map(a => ({...a, status: a.status || 'alleged'}));
  const disputed = links.findIndex(l => l.status === 'disputed');
  return {n, events: p.events, links, alternatives, losses: p.losses, disputed: disputed === -1 ? null : disputed};
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

const PIPS = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.24], [0.73, 0.24], [0.27, 0.5], [0.73, 0.5], [0.27, 0.76], [0.73, 0.76]],
};

/** Die face (order marker without text). Local origin = top-left. */
export function dieFace(ctx, {s, k, fill, pip}) {
  const th = ctx.theme;
  return g(null,
    h('path', {d: roundRectPath(0, 0, s, s, s * 0.2), fill: fill ?? th.paper, stroke: th.ink, 'stroke-width': 2}),
    (PIPS[Math.max(1, Math.min(6, k))]).map(([px, py]) => h('circle', {cx: r(px * s), cy: r(py * s), r: r(s * 0.1), fill: pip ?? th.ink})),
  );
}

/** Tile colour for event i (same family, gently varied so neighbours read apart). */
export function tileColor(ctx, i) {
  return shade(ctx.theme.accent2, [0.08, -0.06, 0.16, -0.12, 0.02, 0.22][i % 6]);
}

/**
 * Event tile. Local origin = pivot (bottom-right); body x∈[-w,0], y∈[-h,0].
 */
export function tileArt(ctx, {w, h: hh, index, color}) {
  const th = ctx.theme;
  const s = w - 14;
  return g(null,
    h('path', {d: roundRectPath(-w, -hh, w, hh, w * 0.14), fill: color, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(-w + 5, -hh + 6, w * 0.26, hh - 12, w * 0.1), fill: '#ffffff', opacity: 0.2}),
    h('path', {d: `M${r(-w + 2)} ${r(-hh * 0.1)}H-2`, stroke: shade(color, -0.35), 'stroke-width': 2}),
    h('rect', {x: r(-w + 2), y: r(-hh * 0.1 + 1), width: r(w - 4), height: r(hh * 0.1 - 3), rx: 3, fill: shade(color, -0.2)}),
    h('path', {d: `M${r(-w * 0.72)} ${r(-hh * 0.38)}H${r(-w * 0.28)}M${r(-w * 0.72)} ${r(-hh * 0.3)}H${r(-w * 0.4)}`, stroke: shade(color, 0.45), 'stroke-width': 4, 'stroke-linecap': 'round'}),
    g({transform: T(-w + 7, -hh + 8)}, dieFace(ctx, {s, k: index + 1})),
  );
}

/** Urn silhouette (straight-sided ceramic vase with a rim band), local origin = pivot. */
function vasePath(w, hh) {
  const c = -w / 2;
  const X = f => r(c + f * w);
  const Y = f => r(-f * hh);
  return `M${X(-0.36)} 0H${X(0.36)}C${X(0.44)} ${Y(0.3)} ${X(0.49)} ${Y(0.6)} ${X(0.46)} ${Y(0.84)}H${X(0.5)}V${Y(1)}H${X(-0.5)}V${Y(0.84)}H${X(-0.46)}`
    + `C${X(-0.49)} ${Y(0.6)} ${X(-0.44)} ${Y(0.3)} ${X(-0.36)} 0Z`;
}

/** Jug silhouette (second, smaller loss object). */
function jugPath(w, hh) {
  const c = -w / 2;
  const X = f => r(c + f * w);
  const Y = f => r(-f * hh);
  return `M${X(-0.36)} 0H${X(0.36)}C${X(0.52)} ${Y(0.3)} ${X(0.5)} ${Y(0.62)} ${X(0.3)} ${Y(0.82)}L${X(0.5)} ${Y(1)}H${X(-0.5)}L${X(-0.3)} ${Y(0.82)}C${X(-0.5)} ${Y(0.62)} ${X(-0.52)} ${Y(0.3)} ${X(-0.36)} 0Z`;
}

/**
 * Loss object (vase or jug) with a crack that draws on. Local origin = pivot.
 * @returns {{node:any, crackLen:number, crackTip:{x:number,y:number}}}
 */
export function lossArt(ctx, {name, w, h: hh, kind = 'vase', color}) {
  const th = ctx.theme;
  const col = color ?? th.accent3;
  const c = -w / 2;
  const body = kind === 'jug' ? jugPath(w, hh) : vasePath(w, hh);
  const crackPts = kind === 'jug'
    ? [[0.12, 1], [0.02, 0.86], [0.16, 0.7], [0.0, 0.52], [0.1, 0.36]]
    : [[0.16, 1], [0.06, 0.88], [0.18, 0.74], [-0.02, 0.6], [0.12, 0.44], [-0.04, 0.28]];
  const pts = crackPts.map(([fx, fy]) => ({x: c + fx * w, y: -fy * hh}));
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const crackD = pts.map((p, i) => `${i ? 'L' : 'M'}${r(p.x)} ${r(p.y)}`).join('');
  const band = kind === 'jug'
    ? h('path', {d: `M${r(c - 0.47 * w)} ${r(-0.42 * hh)}H${r(c + 0.47 * w)}`, stroke: th.accent, 'stroke-width': 7, opacity: 0.85})
    : g(null,
      h('path', {d: `M${r(c - 0.47 * w)} ${r(-0.5 * hh)}H${r(c + 0.47 * w)}`, stroke: th.accent2, 'stroke-width': Math.max(6, hh * 0.07), opacity: 0.85}),
      h('path', {d: `M${r(c - 0.46 * w)} ${r(-0.84 * hh)}H${r(c + 0.46 * w)}`, stroke: shade(col, -0.3), 'stroke-width': 2.5}),
      [-0.3, -0.1, 0.1, 0.3].map(f => h('circle', {cx: r(c + f * w), cy: r(-0.66 * hh), r: r(w * 0.045), fill: th.accent, opacity: 0.85})),
      [-0.28, 0, 0.28].map(f => h('path', {d: `M${r(c + f * w - w * 0.06)} ${r(-0.3 * hh)}l${r(w * 0.06)} ${r(-hh * 0.07)}l${r(w * 0.06)} ${r(hh * 0.07)}`, fill: 'none', stroke: th.accent, 'stroke-width': 2.5, opacity: 0.8})));
  const node = g({name},
    h('path', {d: body, fill: col, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    band,
    h('path', {d: `M${r(c - 0.3 * w)} ${r(-0.62 * hh)}Q${r(c - 0.36 * w)} ${r(-0.4 * hh)} ${r(c - 0.22 * w)} ${r(-0.2 * hh)}`, stroke: '#ffffff', 'stroke-width': 5, fill: 'none', opacity: 0.35, 'stroke-linecap': 'round'}),
    h('ellipse', {cx: r(c), cy: r(-hh), rx: r(w * (kind === 'jug' ? 0.44 : 0.47)), ry: r(Math.max(3, hh * 0.035)), fill: shade(col, -0.35), stroke: th.ink, 'stroke-width': 1.5}),
    g({name: `${name}-crackg`, opacity: 0},
      h('path', {d: crackD, fill: 'none', stroke: '#fff7e6', 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.7}),
      h('path', {d: `M${r(pts[2].x)} ${r(pts[2].y)}l${r(w * 0.16)} ${r(hh * 0.05)}l${r(w * 0.06)} ${r(hh * 0.08)}`, fill: 'none', stroke: th.ink, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'})),
    h('path', {name: `${name}-crack`, d: crackD, fill: 'none', stroke: th.ink, 'stroke-width': 4.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}),
  );
  return {node, crackLen: len, crackTip: pts[0], outline: body};
}

/** Display plinth. (x, top) = top-left of the slab; stands on floorY. */
export function plinthArt(ctx, {x, top, w, floorY}) {
  const th = ctx.theme;
  const stone = '#d8d0c0';
  const hh = floorY - top;
  return g(null,
    h('path', {d: roundRectPath(x + 10, top + 16, w - 20, hh - 16, 3), fill: stone, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(x + 24, top + 32, w - 48, hh - 58, 4), fill: 'none', stroke: shade(stone, -0.22), 'stroke-width': 2}),
    h('rect', {x: x + 4, y: floorY - 14, width: w - 8, height: 14, rx: 3, fill: shade(stone, -0.1), stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x - 4, top, w + 8, 18, 4), fill: shade(stone, 0.12), stroke: th.ink, 'stroke-width': th.stroke}),
  );
}

/**
 * Striped barrier (alternative event). Local origin = bottom-centre (where the
 * feet stand). `boardH` gives a tall barricade: the striped board sits on long
 * A-frame legs that reach the ground (used on the stage, where it stands on
 * the floor behind the tiles); without it the board is a third of the height.
 */
export function barrierArt(ctx, {name, w, h: hh, boardH}) {
  const th = ctx.theme;
  const bw = w, bh = boardH ?? hh * 0.34;
  const tall = boardH !== undefined;
  const by = -hh + 4;
  const clip = `${name}-clip`;
  const stripes = [];
  const sw = bh * 0.9;
  for (let x = -bw / 2 - bh; x < bw / 2 + bh; x += sw * 2) {
    stripes.push(h('path', {d: `M${r(x)} ${r(by + bh)}L${r(x + bh * 0.8)} ${r(by)}H${r(x + bh * 0.8 + sw)}L${r(x + sw)} ${r(by + bh)}Z`, fill: th.accent}));
  }
  // legs: metal core over an ink edge so they read on light AND dark backgrounds
  const top = tall ? by + bh * 0.7 : by + bh * 0.5;
  const legD = sx => (tall
    ? `M${r(sx * bw * 0.3)} ${r(top)}L${r(sx * bw * 0.4)} 0M${r(sx * bw * 0.3)} ${r(top)}L${r(sx * bw * 0.2)} 0`
    : `M${r(sx * bw * 0.3)} ${r(top)}L${r(sx * bw * 0.42)} 0M${r(sx * bw * 0.3)} ${r(top)}L${r(sx * bw * 0.18)} 0`);
  const leg = (sx) => g(null,
    h('path', {d: legD(sx), stroke: th.ink, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('path', {d: legD(sx), stroke: th.metal, 'stroke-width': 3.5, 'stroke-linecap': 'round'}));
  // tall stand: rubber feet on the ground and a lower cross-rail
  const feet = tall ? [-0.4, -0.2, 0.2, 0.4].map(f => h('path', {d: roundRectPath(f * bw - 7, -5, 14, 6, 2), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5})) : null;
  const railY = tall ? top + (0 - top) * 0.55 : -hh * 0.28;
  return g(null,
    leg(-1), leg(1),
    feet,
    h('path', {d: `M${r(-bw * (tall ? 0.34 : 0.36))} ${r(railY)}H${r(bw * (tall ? 0.34 : 0.36))}`, stroke: th.ink, 'stroke-width': 6.5}),
    h('path', {d: `M${r(-bw * (tall ? 0.34 : 0.36))} ${r(railY)}H${r(bw * (tall ? 0.34 : 0.36))}`, stroke: th.metalDark, 'stroke-width': 4}),
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('path', {d: roundRectPath(-bw / 2, by, bw, bh, 5)}))),
    h('path', {d: roundRectPath(-bw / 2, by, bw, bh, 5), fill: '#ffffff'}),
    g({'clip-path': ctx.ref(clip)}, stripes),
    h('path', {d: roundRectPath(-bw / 2, by, bw, bh, 5), fill: 'none', stroke: th.ink, 'stroke-width': th.stroke}),
  );
}

/**
 * Link joint marker. Local origin = contact point.
 * @param {{name:string, disputed:boolean, kind?:string, radius?:number}} o
 */
export function jointArt(ctx, {name, disputed, radius = 15}) {
  const th = ctx.theme;
  const R = radius;
  const col = disputed ? th.accent : th.accent4;
  return g({name, opacity: 0},
    h('circle', {r: R + 7, fill: col, opacity: 0.18}),
    h('circle', {r: R, fill: th.card, stroke: col, 'stroke-width': 3.5, 'stroke-dasharray': disputed ? '5 4' : null}),
    disputed
      ? (ctx.show('key')
        ? h('text', {x: 0, y: r(R * 0.42), 'text-anchor': 'middle', 'font-size': r(R * 1.2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: col}, '?')
        : h('path', {d: `M${r(-R * 0.45)} 0H${r(-R * 0.12)}M${r(R * 0.12)} 0H${r(R * 0.45)}`, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round'}))
      : g(null,
        h('ellipse', {cx: r(-R * 0.22), cy: 0, rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.6}),
        h('ellipse', {cx: r(R * 0.22), cy: 0, rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.6})),
  );
}

/* ------------------------------------------------------------------------ */
/* Stage geometry                                                           */
/* ------------------------------------------------------------------------ */

const K = {tileW: 0.2, gap: 0.36, strike: 0.46, plinthH: 0.4, vaseW: 0.3, vaseH: 0.52, jugW: 0.3, jugH: 0.28, jugGap: 0.5};
/** Wrap mode: drop between the upper landing and the lower floor (× H). */
export const WRAP_DROP = 1.3;
const WRAP_HIT = 0.08; // the swinging tile's corner meets the lower tile this far below its top (× H)
/**
 * Wrap mode: gap before the tile that swings over the landing edge (× H). Wide
 * enough that the tile before it comes to rest lying flat ON the landing (its
 * head stops short of the edge) instead of cantilevering over empty space.
 */
export const LAND_GAP = 0.82;
const BOARD_UP = 1.14; // bottom of an alternative barrier's board above the floor (× H): clear of the tile tops

/** Width (design units) a chain of n tiles + loss plinth needs at tile height H. */
export function chainWidth(n, H, lossCount = 1, gapRatio = K.gap) {
  const m = metrics(n, H, lossCount, gapRatio);
  return m.width;
}

/** Tile height that makes the chain fit `width`, capped at maxH. */
export function fitChainH(n, width, maxH, lossCount = 1, gapRatio = K.gap) {
  const a = (chainWidth(n, 300, lossCount, gapRatio) - chainWidth(n, 200, lossCount, gapRatio)) / 100;
  const b = chainWidth(n, 200, lossCount, gapRatio) - 200 * a;
  return Math.min(maxH, (width - b) / a);
}

function metrics(n, H, lossCount, gapRatio = K.gap) {
  const w = Math.round(K.tileW * H);
  const gap = gapRatio * H;
  const spacing = w + gap;
  const chainW = (n - 1) * spacing + w;
  const vw = K.vaseW * H, vh = K.vaseH * H;
  const reach = lossCount > 1 ? Math.max(vh, K.jugGap * vh + (K.jugW + K.jugH) * H) : vh;
  const plinthW = 14 + vw + reach + 24;
  const width = chainW + K.strike * H - 14 + plinthW;
  return {w, gap, spacing, chainW, vw, vh, plinthW, width};
}

/**
 * Horizontal extents of a two-level (wrap) chain, relative to the landing edge
 * xe (the swinging tile's pivot). Row 1 (m tiles, falling right) ends at xe;
 * row 2 (n - m tiles, falling left) starts under the swing and ends at the
 * plinth on the left.
 * @returns {{row1:number, reach:number, row2Left:number, row2Right:number}}
 *   row1 = width of row 1 left of xe; reach = rightmost x - xe;
 *   row2Left = leftmost x of row 2 (plinth) - xe (negative)
 */
export function wrapExtents(n, m, H, lossCount = 1, gapRatio = K.gap, lowGap = gapRatio) {
  const mt = metrics(n, H, lossCount, gapRatio);
  const row1 = (m - 1) * mt.spacing + mt.w + (m >= 2 ? landExtra(H, mt) : 0);
  const cos = 1 - (WRAP_DROP + WRAP_HIT);
  const hitX = H * Math.sqrt(Math.max(0, 1 - cos * cos));
  const n2 = n - m;
  const lastPivot = hitX - mt.w - (n2 - 1) * (mt.w + lowGap * H);
  const plinthLeft = lastPivot - K.strike * H + 14 - mt.plinthW;
  return {row1, reach: Math.max(hitX, H * 1.0), row2Left: plinthLeft, row2Right: hitX};
}

/** Extra landing room before the swinging tile (see LAND_GAP). */
function landExtra(H, mt) {
  return Math.max(0, LAND_GAP * H - mt.gap);
}

/**
 * Build a chain stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {number} o.x0          left edge of the first tile
 * @param {number} o.floorY      y of the tile pivots (standing line) — the upper landing in wrap mode
 * @param {number} o.H           tile height
 * @param {number} o.n           event count
 * @param {number} [o.lossCount=1]
 * @param {Array<{status:string}>} o.links   resolved links (length n)
 * @param {Array<{link:number}>} [o.barriers]
 * @param {number} o.start       normalized time tile 0 starts to fall
 * @param {number} o.strike      target normalized time the loss is struck
 * @param {number|null} [o.stopAtLink] unresolved mode: hold at this link
 * @param {number} [o.floorLeft] left end of the drawn floor
 * @param {number} [o.floorRight] right end of the drawn floor
 * @param {{m:number, floorLeft?:number, floorRight?:number, lowGap?:number}} [o.wrap]
 *   two-level mode: the first m tiles stand on an upper landing that ends at
 *   the last of them; that tile tips over the landing edge and strikes the
 *   first tile of a lower row (WRAP_DROP·H below) that falls to the left,
 *   toward the plinth. floorLeft/floorRight bound the lower floor; lowGap is
 *   the gap between lower-row tiles (× H, default = the landing gap).
 */
export function chainStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const n = o.n;
  const H = o.H;
  const F = o.floorY;
  const lossCount = Math.min(2, o.lossCount ?? 1);
  const m = metrics(n, H, lossCount, o.gapRatio ?? K.gap);
  const {w, spacing, vw, vh, plinthW} = m;
  const wrap = o.wrap && o.wrap.m >= 1 && o.wrap.m < n ? o.wrap : null;
  const m1 = wrap ? wrap.m : n;
  const F2 = wrap ? F + WRAP_DROP * H : F;

  // ---- bodies: tiles, then the loss objects
  const tiles = [];
  const extra = wrap && m1 >= 2 ? landExtra(H, m) : 0;
  for (let i = 0; i < m1; i++) {
    const left = o.x0 + i * spacing + (i === m1 - 1 ? extra : 0);
    tiles.push({w, h: H, pivot: {x: left + w, y: F}, left, dir: 1, floor: F});
  }
  const xe = tiles[m1 - 1].pivot.x;
  const lowGap = wrap ? (wrap.lowGap ?? o.gapRatio ?? K.gap) : (o.gapRatio ?? K.gap);
  const spacing2 = w + lowGap * H;
  if (wrap) {
    const ex = wrapExtents(n, m1, H, lossCount, o.gapRatio ?? K.gap, lowGap);
    const p0 = xe + ex.row2Right - w;
    for (let j = 0; j < n - m1; j++) {
      const pv = p0 - j * spacing2;
      tiles.push({w, h: H, pivot: {x: pv, y: F2}, left: pv, dir: -1, floor: F2});
    }
  }
  const dirL = wrap ? -1 : 1; // direction of the last row (and the loss)
  const lastPivot = tiles[n - 1].pivot.x;
  const plinthTop = F2 - K.plinthH * H;
  let vase, plinthX;
  if (dirL > 0) {
    const vaseLeft = lastPivot + K.strike * H;
    plinthX = vaseLeft - 14;
    vase = {w: vw, h: vh, pivot: {x: vaseLeft + vw, y: plinthTop}, maxDeg: 90, dir: 1};
  } else {
    const vaseRight = lastPivot - K.strike * H;
    plinthX = vaseRight + 14 - plinthW;
    vase = {w: vw, h: vh, pivot: {x: vaseRight - vw, y: plinthTop}, maxDeg: 90, dir: -1};
  }
  const plinthPoly = rectPoly(plinthX - 4, plinthTop, plinthW + 8, F2 - plinthTop);
  const losses = [vase];
  if (lossCount > 1) {
    const jw = K.jugW * H, jh = K.jugH * H;
    const jPivot = dirL > 0 ? vase.pivot.x + K.jugGap * vh + jw : vase.pivot.x - K.jugGap * vh - jw;
    losses.push({w: jw, h: jh, pivot: {x: jPivot, y: plinthTop}, maxDeg: 90, dir: dirL});
  }
  const plinthRight = plinthX + plinthW;
  const right = wrap ? Math.max(plinthRight, tiles[m1].pivot.x + w) : plinthRight;

  // Timing: first a unit-duration pass, then scale tile durations so the loss
  // is struck at o.strike (bounded so short chains do not crawl).
  const bodyList = (dt, dl) => [
    ...tiles.map((t, i) => ({...t, dur: dt * (wrap && i === m1 - 1 ? 1.35 : 1), maxDeg: wrap && i === m1 - 1 ? 176 : undefined, statics: i === n - 1 ? [plinthPoly] : []})),
    ...losses.map(b => ({...b, dur: dl})),
  ];
  const build = (dt, dl, stop) => toppleChain({bodies: bodyList(dt, dl), start: o.start, stopAtLink: stop});
  const probe = build(1, 1, null);
  const rel = probe.starts[n] - o.start;
  const dt = clamp((o.strike - o.start) / (Number.isFinite(rel) && rel > 0 ? rel : 1), 0.06, o.maxTileDur ?? 0.24);
  const dl = o.lossDur ?? 0.1;
  const sim = build(dt, dl, o.stopAtLink ?? null);
  const full = o.stopAtLink == null ? sim : build(dt, dl, null);
  const settledFull = full.settled();
  const bodies = sim.bodies;
  const N = bodies.length;

  // Landing time of each loss object (first time its angle is within 0.5° of rest).
  const landAt = losses.map((_, j) => {
    const idx = n + j;
    const final = settledFull.angles[idx];
    if (!Number.isFinite(full.starts[idx])) return Infinity;
    let lo = full.starts[idx], hi = Math.min(1.5, full.starts[idx] + 1);
    for (let k = 0; k < 30; k++) {
      const mid = (lo + hi) / 2;
      if (full.at(mid).angles[idx] >= final - 0.5 * DEG) hi = mid; else lo = mid;
    }
    return hi;
  });

  // ---- nodes
  const slab = (x0, x1, y, lip = 8) => g(null,
    h('path', {d: `M${r(x0)} ${r(y - 30)}H${r(x1)}L${r(x1 + lip)} ${r(y + 12)}H${r(x0 - 8)}Z`, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x0 - 8)} ${r(y + 12)}H${r(x1 + lip)}V${r(y + 34)}H${r(x0 - 8)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    [0.3, 0.62].map(f => h('path', {d: `M${r(x0 + 4)} ${r(y - 30 + 42 * f)}H${r(x1 - 4)}`, stroke: shade(th.woodTop, -0.12), 'stroke-width': 1.5})),
  );
  let floor;
  const floorL = o.floorLeft ?? o.x0 - 60;
  // horizontal extent of the walkable top of each floor (barrier feet and shadows stay on it)
  let floorSpan, lowSpan;
  if (wrap) {
    // upper landing ends exactly at the swinging tile's pivot; a riser drops to the lower floor
    const lx1 = xe - 6;
    const riserTop = F + 34, riserBot = F2 - 24;
    const riserFill = th.dark ? shade(th.wood, -0.25) : shade(th.woodTop, 0.35);
    const lowL = wrap.floorLeft ?? floorL, lowR = wrap.floorRight ?? right + 60;
    floorSpan = [floorL, lx1];
    lowSpan = [lowL, lowR + 8];
    floor = g(null,
      h('path', {d: `M${r(floorL - 8)} ${r(riserTop)}H${r(xe + 2)}V${r(riserBot)}H${r(floorL - 8)}Z`, fill: riserFill, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      [0.25, 0.5, 0.75].map(f => h('path', {d: `M${r(floorL - 8 + (xe + 10 - floorL) * f)} ${r(riserTop + 10)}V${r(riserBot - 6)}`, stroke: shade(riserFill, -0.12), 'stroke-width': 2})),
      slab(floorL, lx1, F, 8),
      slab(lowL, lowR, F2),
    );
  } else {
    const floorR = o.floorRight ?? right + 110 * (H / 270);
    floorSpan = [floorL, floorR + 8];
    lowSpan = floorSpan;
    floor = slab(floorL, floorR, F);
  }
  const spanOf = y => (y === F ? floorSpan : lowSpan);

  // alternative barriers: a tall barricade standing on the floor BEHIND the tiles
  // (its feet on the back of the floor), the striped board raised above the tile
  // tops just upstream of the link — clear of every tile's path, so it never
  // looks as if it blocks, props or releases the chain, and it never floats.
  const barriers = (o.barriers || []).map((b, j) => {
    const i = b.link;
    const A = tiles[i];
    let mid, fy, up = BOARD_UP, side = A.dir;
    if (i < n - 1) {
      const B = tiles[i + 1];
      if (A.dir === B.dir) {
        mid = A.dir > 0 ? (A.pivot.x + B.left) / 2 : (A.pivot.x + B.pivot.x + w) / 2;
        fy = B.floor;
      } else {
        // the drop between the two levels: on the landing, before its edge
        mid = xe;
        fy = F;
        up = BOARD_UP + 0.1;
      }
    } else {
      mid = dirL > 0 ? (lastPivot + plinthX) / 2 : (lastPivot + plinthRight) / 2;
      fy = F2;
    }
    const bw = Math.max(spacing * 0.9, H * 0.42);
    const boardH = H * 0.13;
    const groundY = fy - 20; // the back half of the floor top, behind the tiles
    const boardBottom = fy - up * H;
    const boardTop = boardBottom - boardH;
    // set just upstream of the link, so the air above the link's joint stays clear;
    // then keep both feet on the floor it stands on
    let cx = mid - side * (bw / 2 + 6);
    const [s0, s1] = spanOf(fy);
    cx = clamp(cx, s0 + bw * 0.4 + 14, s1 - bw * 0.4 - 16);
    const hh = groundY - boardTop;
    const node = g({name: `${P}-bar${j}`},
      g({transform: T(cx, groundY)}, barrierArt(ctx, {name: `${P}-bar${j}-a`, w: bw, h: hh + 4, boardH})));
    const box = {x: cx - bw / 2, y: boardTop - 4, w: bw, h: boardH + 10};
    const stand = {x: cx - bw * 0.42, y: boardTop - 4, w: bw * 0.84, h: groundY - boardTop + 4};
    return {cx, y: boardTop, w: bw, h: boardH, groundY, link: i, box, stand, top: {x: cx, y: boardTop}, node};
  });

  const shadows = bodies.map((b, i) => h('ellipse', {name: `${P}-sh${i}`, cx: r(b.pivot.x - (b.dir ?? 1) * b.w / 2), cy: r(b.pivot.y + 1), rx: r(b.w / 2 + 6), ry: 6, fill: th.ink, opacity: 0.16}));
  const tileNodes = tiles.map((t, i) => g({name: `${P}-tile${i}`, transform: poseTransform(t, 0)}, tileArt(ctx, {w, h: H, index: i, color: tileColor(ctx, i)})));
  const lossArts = losses.map((b, j) => lossArt(ctx, {name: `${P}-loss${j}-art`, w: b.w, h: b.h, kind: j ? 'jug' : 'vase', color: j ? shade(th.accent4, 0.25) : th.accent3}));
  const lossNodes = losses.map((b, j) => g({name: `${P}-loss${j}`, transform: poseTransform(b, 0)}, lossArts[j].node));
  // shards that break off the lip on landing
  const shardShapes = [[[0, 0], [24, -9], [12, 15]], [[0, 0], [18, 6], [3, 18]], [[0, 0], [15, -12], [21, 9]]];
  const shards = losses.map((b, j) => shardShapes.slice(0, j ? 2 : 3).map((pts, k) => h('path', {name: `${P}-shard${j}-${k}`, d: `M${pts.map(p => `${r(p[0] * H / 270)} ${r(p[1] * H / 270)}`).join('L')}Z`, fill: j ? shade(th.accent4, 0.25) : th.accent3, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0})));
  const joints = o.links.map((l, i) => jointArt(ctx, {name: `${P}-joint${i}`, disputed: l.status === 'disputed', radius: Math.max(13, H * 0.066)}));

  // unresolved mode: every downstream body STAYS as a dimmed solid in its upright
  // place (so the held tile visibly leans on something real) and gets a dashed
  // outline of the pose it would take if the chain went on, plus a dashed sweep
  // over the first of them — both possibilities shown, neither decided.
  const ghostIdx = o.stopAtLink == null ? [] : bodies.map((_, i) => i).filter(i => i > o.stopAtLink);
  const ghosts = ghostIdx.map((i, gi) => {
    const b = bodies[i];
    const isLoss = i >= n;
    const outline = isLoss ? lossArts[i - n].outline : roundRectPath(-b.w, -b.h, b.w, b.h, b.w * 0.14);
    const col = th.fgSoft;
    const fin = settledFull.angles[i];
    let arc = null;
    if (gi === 0 && fin > 4 * DEG) {
      // a short sweep (≤ 70°) says "would tip this way"; the dashed outline shows where it would rest
      const sw = Math.min(fin, 70 * DEG);
      const tr0 = bodyPoint(b, 0, {x: isLoss ? -b.w / 2 : 0, y: -b.h * 1.06});
      const tr1 = bodyPoint(b, sw, {x: isLoss ? -b.w / 2 : 0, y: -b.h * 1.06});
      const R = Math.hypot(tr0.x - b.pivot.x, tr0.y - b.pivot.y);
      arc = h('path', {d: `M${r(tr0.x)} ${r(tr0.y)}A${r(R)} ${r(R)} 0 0 ${(b.dir ?? 1) > 0 ? 1 : 0} ${r(tr1.x)} ${r(tr1.y)}`, fill: 'none', stroke: col, 'stroke-width': 2.6, 'stroke-dasharray': '2 8', 'stroke-linecap': 'round'});
    }
    return g({name: `${P}-ghost${i}`, opacity: 0},
      arc,
      h('path', {d: outline, transform: poseTransform(b, fin / DEG), fill: 'none', stroke: col, 'stroke-width': 2.8, 'stroke-dasharray': '10 7', 'stroke-linejoin': 'round'}),
    );
  });

  const plinth = plinthArt(ctx, {x: plinthX, top: plinthTop, w: plinthW, floorY: F2 + 6});
  const back = g({name: `${P}-back`}, floor, barriers.map(b => b.node), shadows);
  const main = g({name: `${P}-main`}, g({name: `${P}-plinth`}, plinth), lossNodes, shards, tileNodes, ghosts, joints);
  const node = g({name: P}, back, main);

  // The last link's marker rides on the loss object at the point that was struck.
  const strikeLocal = (() => {
    const cu = full.starts[n];
    if (!Number.isFinite(cu)) return {x: -vw, y: -vh * 0.8};
    const a = full.at(cu).angles[n - 1];
    const q = bodyPoint(bodies[n - 1], a, {x: 0, y: -H});
    return localAt0(vase, q);
  })();

  const lossWorldTop = (j, ang) => bodyPoint(losses[j], ang, {x: -losses[j].w / 2, y: -losses[j].h});
  const jointAt = (i, A) => (i === n - 1 ? bodyPoint(bodies[n], A[n], strikeLocal) : bodyPoint(bodies[i], A[i], {x: 0, y: -bodies[i].h}));

  /**
   * Pose the stage at normalized time u.
   * @param {number} u
   * @param {{barrierIn?:number[], jointOn?:boolean[]}} [s]
   */
  function pose(u, s = {}) {
    const nodes = {};
    const st = sim.at(u);
    const A = st.angles;
    const stop = o.stopAtLink ?? null;
    const ghostP = stop == null ? 0 : ease.inOutSine(seg(u, sim.starts[stop + 1], sim.starts[stop + 1] + 0.05));
    for (let i = 0; i < N; i++) {
      const b = bodies[i];
      const deg = A[i] / DEG;
      const isLoss = i >= n;
      // unresolved: downstream bodies stay in place, dimmed (not removed)
      const faded = stop != null && i > stop ? 1 - 0.58 * ghostP : 1;
      nodes[isLoss ? `${P}-loss${i - n}` : `${P}-tile${i}`] = {transform: poseTransform(b, deg), opacity: r(faded, 3)};
      // floor shadow follows the body's horizontal extent, clipped to the floor it stands on
      const cs = bodyCorners(b, A[i]);
      const xs = cs.map(q => q.x);
      const [s0, s1] = spanOf(b.pivot.y);
      const x0 = Math.max(s0, Math.min(...xs)), x1 = Math.min(s1, Math.max(...xs));
      // a body hanging over the landing edge casts no floor shadow
      const over = wrap && !isLoss && i === m1 - 1 ? clamp(1 - (A[i] / DEG - 80) / 20) : 1;
      const on = x1 - x0 > 6 ? 1 : 0;
      nodes[`${P}-sh${i}`] = {cx: r((x0 + Math.max(x0, x1)) / 2), rx: r(Math.max(0, x1 - x0) / 2 + 4), opacity: r(0.16 * faded * over * on, 3)};
    }
    for (const i of ghostIdx) nodes[`${P}-ghost${i}`] = {opacity: r(ghostP, 3)};
    // joints: pop in at contact, then ride on the leaning tile's top corner
    const jointPts = [];
    for (let i = 0; i < n; i++) {
      const contactU = sim.starts[i + 1];
      const on = Number.isFinite(contactU) && u >= contactU && (stop == null || i <= stop) && (s.jointOn ? s.jointOn[i] !== false : true);
      const tr = jointAt(i, A);
      const pop = on ? seg(u, contactU, contactU + 0.03) : 0;
      const k = on ? (ctx.reduced ? 1 : 0.6 + 0.4 * ease.outBack(pop)) : 0.6;
      nodes[`${P}-joint${i}`] = {transform: T(tr.x, tr.y, 0, k), opacity: on ? r(clamp(pop * 3), 3) : 0};
      jointPts.push(on ? {x: r(tr.x), y: r(tr.y)} : null);
    }
    // cracks and shards on landing
    const cracked = [];
    losses.forEach((b, j) => {
      const idx = n + j;
      const land = landAt[j];
      const art = lossArts[j];
      const cp = Number.isFinite(land) && (stop == null || idx <= stop) ? seg(u, land, land + 0.04) : 0;
      nodes[`${P}-loss${j}-art-crack`] = {'stroke-dashoffset': r(art.crackLen * (1 - ease.outCubic(cp)))};
      nodes[`${P}-loss${j}-art-crackg`] = {opacity: r(clamp((cp - 0.5) * 2), 3)};
      cracked.push(r(cp, 3));
      const lip = bodyPoint(b, A[idx], {x: art.crackTip.x, y: art.crackTip.y});
      const count = j ? 2 : 3;
      const broken = stop == null || idx <= stop;
      for (let k = 0; k < count; k++) {
        const sp = broken ? seg(u, land, land + 0.05) : 0;
        // chips drop off the plinth edge onto the floor beside it (the side the loss fell toward)
        const off = (26 + k * 26 + j * 60) * (H / 270) * (dirL > 0 ? 1 : 0.58);
        const restX = dirL > 0 ? plinthRight + off : plinthX - off;
        const restY = F2 - 3 - (k % 2) * 4;
        const x = lerp(lip.x, restX, ease.outCubic(sp));
        const arcY = -Math.sin(Math.PI * Math.min(1, sp * 1.6)) * 30 * (H / 270) * (sp < 0.625 ? 1 : 0);
        const y = lerp(lip.y, restY, ease.inQuad(sp)) + arcY;
        nodes[`${P}-shard${j}-${k}`] = {transform: T(x, y, dirL * sp * (80 + k * 40)), opacity: sp > 0 ? 1 : 0};
      }
    });
    if (s.barrierIn) {
      // set up in place: it grows up from its feet (never floats, never sinks into the floor)
      barriers.forEach((b, j) => {
        const p = clamp(s.barrierIn[j] ?? 1);
        const k = ctx.reduced ? 1 : 0.82 + 0.18 * ease.outCubic(p);
        nodes[`${P}-bar${j}`] = {transform: k < 1 ? `translate(${r(b.cx)} ${r(b.groundY)}) scale(1 ${r(k, 4)}) translate(${r(-b.cx)} ${r(-b.groundY)})` : 'translate(0 0)', opacity: r(clamp(p * 2.5), 3)};
      });
    }
    const tops = bodies.map((b, i) => {
      const q = bodyPoint(b, A[i], {x: i >= n ? -b.w / 2 : 0, y: -b.h});
      return {x: r(q.x), y: r(q.y)};
    });
    const lossState = losses.map((b, j) => {
      const idx = n + j;
      if (stop != null && idx > stop) return u >= sim.starts[stop + 1] ? 'unresolved' : 'intact';
      if (A[idx] <= 0) return 'intact';
      return u >= landAt[j] ? 'down' : 'tipping';
    });
    return {
      nodes,
      semantic: {
        angles: A.map(a => r(a / DEG, 2)),
        tops,
        joints: jointPts,
        touching: st.touching,
        started: st.started,
        lossState,
        cracked,
        ghost: r(ghostP, 3),
      },
    };
  }

  /** World polygons of every body at time u (for label/callout collision tests). */
  const polygonsAt = u => {
    const A = sim.at(u).angles;
    return bodies.map((b, i) => bodyCorners(b, A[i]));
  };
  const uprightBox = i => ({x: tiles[i].dir > 0 ? tiles[i].left : tiles[i].pivot.x, y: tiles[i].floor - H, w, h: H});
  return {
    node, back, main, pose, sim, full, settledFull, landAt, bodies,
    tiles, losses, barriers, plinth: {x: plinthX, top: plinthTop, w: plinthW, floorY: F2},
    H, w, spacing, floorY: F, floorY2: F2, wrap: wrap ? {m: m1, xe} : null, right, left: o.x0, uprightBox,
    lossWorldTop, polygonsAt,
    /** contact point of link i in the fully settled chain */
    settledJoint: i => jointAt(i, settledFull.angles),
    /** loss object's centre in the settled pose */
    settledLossCenter: j => bodyPoint(losses[j], settledFull.angles[n + j], {x: -losses[j].w / 2, y: -losses[j].h / 2}),
  };
}

/**
 * Greedy label packing under a baseline: items (sorted by x) go into the
 * first row where they do not overlap the previous item of that row.
 * @param {Array<{x:number, w:number, h:number}>} items box width/height, desired centre x
 * @param {{y:number, gap?:number, rowGap?:number, minX:number, maxX:number, maxRows?:number}} o
 * @returns {Array<{x:number, y:number, row:number}>} top-left positions (same order as items)
 */
export function packRow(items, o) {
  const gap = o.gap ?? 12;
  const rowGap = o.rowGap ?? 12;
  const maxRows = o.maxRows ?? 3;
  const order = items.map((it, i) => i).sort((a, b) => items[a].x - items[b].x);
  const lastRight = [];
  const rowOf = new Array(items.length).fill(0);
  const xOf = new Array(items.length).fill(0);
  for (const i of order) {
    const it = items[i];
    const x = Math.max(o.minX, Math.min(o.maxX - it.w, it.x - it.w / 2));
    let row = 0;
    while (row < maxRows - 1 && lastRight[row] !== undefined && x < lastRight[row] + gap) row++;
    rowOf[i] = row;
    xOf[i] = x;
    lastRight[row] = Math.max(lastRight[row] ?? -Infinity, x + it.w);
  }
  const rowH = [];
  items.forEach((it, i) => { rowH[rowOf[i]] = Math.max(rowH[rowOf[i]] ?? 0, it.h); });
  const rowY = [];
  let y = o.y;
  for (let k = 0; k < rowH.length; k++) {
    rowY[k] = y;
    y += (rowH[k] ?? 0) + rowGap;
  }
  return items.map((it, i) => ({x: xOf[i], y: rowY[rowOf[i]], row: rowOf[i], bottom: y - rowGap}));
}
