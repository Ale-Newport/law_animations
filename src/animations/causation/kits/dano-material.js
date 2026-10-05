/**
 * Motif kit for "Daño material" (LAW-0697..0700): a fictional generic object
 * changes to an altered state next to a neutral incident record.
 *
 * Original vector art (side view):
 *  - The OBJECT is a ceramic vase or a painted cabinet panel standing on a
 *    wooden display table. Its alteration is purely visual and comes in two
 *    marks: vase = a crack that draws down from the left lip (mark 1) and a
 *    chip that breaks off the lip and drops onto the table (mark 2); panel = a
 *    dent pressed into the top edge (mark 1) and scratches drawn across the
 *    face (mark 2). The chip is the SAME piece of the lip: a copy of the body
 *    clipped to the chip polygon covers a dark notch until it leaves.
 *  - The INCIDENT RECORD is a clipboard sheet on an easel: a header, one row per
 *    supplied entry (a die face gives its place in the supplied order), and two
 *    rows of equal weight for "Object before" (● marker, intact thumbnail) and
 *    "Object after" (◆ marker, altered thumbnail). A small plotter (rail,
 *    carriage, telescopic rod, pen) is mounted on its top edge and writes rows.
 *  - A wall post with a shelf holding a paint tin (story only): the shelf board
 *    tilts about its bracket, the tin slides off and drops onto the lip.
 *  - Nothing is valued, no fault, liability, compensation or causation
 *    conclusion is drawn; every entry is "as supplied". Dashes are only used
 *    for a disputed entry / link.
 *
 * The kit owns geometry, art and text measurement only. Each entry owns its
 * own timeline, layout and semantics.
 * @module animations/causation/kits/dano-material
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {str, int, oneOf, list, obj} from '../../../schemas/fields.js';
import {fitG, chipG, balancedG} from './prueba-contrafactual.js';
import {dieFace, barrierArt} from './causal-chain.js';

export {fitG, chipG, balancedG};
export {clamp, ease, lerp, r, seg};

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const KINDS = ['vase', 'panel'];

export const dmFields = {
  events: list('Incident record entries in the supplied order (fictional, descriptive)', obj('Entry', {
    label: str('Entry text (fictional, descriptive; no valuation or finding)', 64),
    time: str('Optional fictional relative label, e.g. "Day 3" (shown as supplied; never a time limit)', 20),
  }, ['label']), 2, 5),
  causalLinks: list('Per-link data. Link i joins entry i to the next entry; the link after the last entry joins it to the altered object. Links not listed are shown only as a sequence as supplied.', obj('Link', {
    from: int('Index (0-based) of the entry where the link starts', 0, 4),
    kind: oneOf('sequence (default) or causal; a causal arrow is only drawn when supplied here', ['sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); never resolved', ['proposed', 'disputed']),
    label: str('Optional caption for this link', 48),
  }, ['from']), 0, 5),
  alternatives: list('Other explanations put forward by someone; drawn with a barrier icon, never decided', obj('Alternative', {
    label: str('Alternative put forward', 64),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label']), 0, 2),
  losses: list('Altered state as described. The first entry describes the object after; an optional second entry adds a noted detail.', obj('Loss', {
    label: str('Description of the altered state (no valuation; label any hypothetical amount as hypothetical)', 72),
  }, ['label']), 1, 2),
  object: obj('The fictional generic object', {
    kind: oneOf('Object drawn: a ceramic vase (crack, chipped lip) or a painted cabinet panel (dent, scratches)', KINDS),
    before: str('Description of the object before (as supplied)', 60),
  }, ['kind']),
};

export const DM_STRINGS = {
  en: {
    record: 'Incident record (as supplied)',
    before: 'Object before',
    after: 'Object after',
    alsoNoted: 'Also noted',
    other: 'Put forward',
    alleged: 'alleged',
    proposed: 'proposed',
    disputed: 'disputed',
    link: 'Link',
    kindCausal: 'causal (as supplied)',
    toObject: 'object after',
    key: 'As supplied · no conclusion drawn',
    recorded: 'Altered state recorded (as supplied)',
    entryDisputed: 'Entry about the altered state disputed (as supplied) · undecided',
    pending: 'Record entry not yet written',
  },
  es: {
    record: 'Registro del incidente (según lo aportado)',
    before: 'Objeto antes',
    after: 'Objeto después',
    alsoNoted: 'También consta',
    other: 'Planteado',
    alleged: 'alegado',
    proposed: 'propuesto',
    disputed: 'discutido',
    link: 'Enlace',
    kindCausal: 'causal (según lo aportado)',
    toObject: 'objeto después',
    key: 'Según lo aportado · sin conclusión',
    recorded: 'Estado alterado registrado (según lo aportado)',
    entryDisputed: 'Entrada sobre el estado alterado discutida (según lo aportado) · sin decidir',
    pending: 'Entrada del registro aún sin escribir',
  },
};

/**
 * Normalize the motif data: one link per entry (the last one ends at the
 * altered object); out-of-range link indices are ignored.
 * @param {any} p params
 */
export function resolveDM(p) {
  const n = p.events.length;
  const links = Array.from({length: n}, (_, i) => ({from: i, kind: 'sequence', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) {
    if (l.from < n) Object.assign(links[l.from], {kind: l.kind || 'sequence', status: l.status || 'proposed', label: l.label || ''});
  }
  const alternatives = (p.alternatives || []).map(a => ({...a, status: a.status || 'alleged'}));
  return {n, events: p.events, links, alternatives, losses: p.losses, kind: p.object.kind};
}

/** A short supplied time label ("Day 3") kept on one line (glue-aware fitting keeps it whole). */
export const nb = s => (String(s).length <= 16 ? String(s).replace(/ /g, '\u00a0') : String(s));

/** Text of each record row / band item. */
export function eventText(e) {
  return `${e.time ? `${nb(e.time)} · ` : ''}${e.label}`;
}

/** Link notes for links that carry supplied data (kind causal, disputed, label). */
export function linkNotes(ctx, M) {
  const t = ctx.t;
  const out = [];
  M.links.forEach(l => {
    const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputed : null, l.label || null].filter(Boolean);
    if (!bits.length) return;
    const to = l.from + 1 < M.n ? String(l.from + 2) : t.toObject;
    out.push({key: `lk${l.from}`, kind: 'link', disputed: l.status === 'disputed', text: `${t.link} ${l.from + 1} → ${to}: ${bits.join(' · ')}`});
  });
  return out;
}

/* ------------------------------------------------------------------------ */
/* Object art                                                               */
/* ------------------------------------------------------------------------ */

/** Width / height of each object kind. */
export const OBJ_W = {vase: 0.62, panel: 0.74};

/** The chip lies on the table rotated by CHIP_REST_ROT, its origin CHIP_REST_DY × H above the table top. */
export const CHIP_REST_ROT = -150;
export const CHIP_REST_DY = 0.035;
const VASE_CHIP = [[-0.37, 1.01], [-0.08, 1.01], [-0.12, 0.955], [-0.19, 0.935], [-0.21, 0.895], [-0.3, 0.88], [-0.37, 0.9]];
const VASE_CRACK = [[-0.2, 0.9], [-0.28, 0.82], [-0.24, 0.74], [-0.38, 0.62], [-0.32, 0.52], [-0.44, 0.4]];
const VASE_BRANCH = [[-0.24, 0.74], [-0.12, 0.68], [-0.14, 0.6]];

/**
 * Geometry of an object of height H (local origin = bottom centre, y up is
 * negative): width, strike point (where the tin meets it), damage spot, and the
 * resting point of the vase chip on the table (dx relative to the centre).
 */
export function objectGeom(kind, H) {
  const W = OBJ_W[kind] * H;
  if (kind === 'vase') {
    return {W, H, strike: {x: -0.2 * W, y: -H}, spot: {x: -0.27 * W, y: -0.78 * H}, chipRest: {x: -0.75 * W, y: 0}, chipFrom: {x: -0.22 * W, y: -0.95 * H}};
  }
  return {W, H, strike: {x: -0.2 * W, y: -H}, spot: {x: -0.14 * W, y: -0.82 * H}, chipRest: null, chipFrom: null};
}

const ptsPath = (pts, W, H, close) => pts.map(([fx, fy], i) => `${i ? 'L' : 'M'}${r(fx * W)} ${r(-fy * H)}`).join('') + (close ? 'Z' : '');
const polyLen = (pts, W, H) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot((pts[i][0] - pts[i - 1][0]) * W, (pts[i][1] - pts[i - 1][1]) * H); return s; };

/**
 * Object art (vase or panel). Local origin = bottom centre.
 * With `name`, the marks are named nodes driven by frame(); without it the
 * art is static at `level` (0 intact, 1 first mark, 2 both marks) — used for
 * thumbnails.
 * @param {any} ctx
 * @param {{name?:string, kind:'vase'|'panel', H:number, level?:number, chipOffset?:boolean}} o
 * @returns {{node:any, frame:(s:{a:number,b:number,tilt?:number,chip?:{x:number,y:number,rot:number}})=>Record<string,any>, geom:any}}
 */
export function objectArt(ctx, o) {
  const th = ctx.theme;
  const {kind, H} = o;
  const G = objectGeom(kind, H);
  const W = G.W;
  const nm = s => (o.name ? `${o.name}-${s}` : undefined);
  const lv = o.level ?? 0;
  const X = f => r(f * W), Y = f => r(-f * H);
  const id = s => ctx.id(`${o.name || `ic${Math.round(H)}${kind}${lv}${o.tag || ''}`}-${s}`);
  const ref = s => `url(#${id(s)})`;
  if (kind === 'vase') {
    const col = th.accent3;
    const inner = shade(col, -0.55);
    const body = `M${X(-0.24)} 0H${X(0.24)}C${X(0.62)} ${Y(0.15)} ${X(0.64)} ${Y(0.6)} ${X(0.26)} ${Y(0.8)}C${X(0.2)} ${Y(0.86)} ${X(0.26)} ${Y(0.92)} ${X(0.36)} ${Y(0.95)}V${Y(1)}H${X(-0.36)}V${Y(0.95)}C${X(-0.26)} ${Y(0.92)} ${X(-0.2)} ${Y(0.86)} ${X(-0.26)} ${Y(0.8)}C${X(-0.64)} ${Y(0.6)} ${X(-0.62)} ${Y(0.15)} ${X(-0.24)} 0Z`;
    const deco = g(null,
      h('path', {d: `M${X(-0.56)} ${Y(0.46)}C${X(-0.2)} ${Y(0.42)} ${X(0.2)} ${Y(0.42)} ${X(0.56)} ${Y(0.46)}`, fill: 'none', stroke: th.accent2, 'stroke-width': r(Math.max(3, H * 0.05)), opacity: 0.9}),
      [-0.3, -0.1, 0.1, 0.3].map(f => h('circle', {cx: X(f), cy: Y(0.6), r: r(W * 0.045), fill: th.accent, opacity: 0.85})),
      h('path', {d: `M${X(-0.3)} ${Y(0.62)}Q${X(-0.4)} ${Y(0.4)} ${X(-0.26)} ${Y(0.2)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(Math.max(2, H * 0.025)), opacity: 0.35, 'stroke-linecap': 'round'}),
    );
    const rim = h('ellipse', {cx: 0, cy: Y(1), rx: X(0.35), ry: r(Math.max(2, H * 0.025)), fill: inner, stroke: th.ink, 'stroke-width': 1.5});
    const sw = Math.max(1.5, Math.min(th.stroke, H * 0.012));
    const chipD = ptsPath(VASE_CHIP, W, H, true);
    const breakD = ptsPath(VASE_CHIP.slice(1), W, H, false);
    const crackD = ptsPath(VASE_CRACK, W, H, false);
    const branchD = ptsPath(VASE_BRANCH, W, H, false);
    const cl = polyLen(VASE_CRACK, W, H), bl = polyLen(VASE_BRANCH, W, H);
    const crackW = Math.max(1.6, H * 0.016);
    const a0 = lv >= 1 ? 1 : 0, b0 = lv >= 2 ? 1 : 0;
    const node = g({name: nm('body')},
      h('defs', null, h('clipPath', {id: id('chip')}, h('path', {d: chipD}))),
      h('path', {d: body, fill: col, stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      deco,
      rim,
      // the notch (dark inside of the lip) shows once the chip has left
      g({name: nm('notch'), opacity: b0},
        g({'clip-path': ref('chip')}, h('path', {d: body, fill: inner})),
        h('path', {d: breakD, fill: 'none', stroke: th.ink, 'stroke-width': sw * 0.8, 'stroke-linejoin': 'round'})),
      // crack (draws on)
      g({name: nm('crackg'), opacity: a0},
        h('path', {name: nm('crack'), d: crackD, fill: 'none', stroke: th.ink, 'stroke-width': r(crackW), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(cl)} ${r(cl + 20)}`, 'stroke-dashoffset': r(cl * (1 - a0))}),
        h('path', {name: nm('branch'), d: branchD, fill: 'none', stroke: th.ink, 'stroke-width': r(crackW * 0.75), 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': `${r(bl)} ${r(bl + 20)}`, 'stroke-dashoffset': r(bl * (1 - a0))})),
    );
    // the chip: the same piece of the lip (body clipped to the chip polygon); it covers the notch until it leaves
    const chip = g({name: nm('chip'), opacity: b0 && !o.chipOffset ? 0 : 1, transform: b0 && o.chipOffset ? T(G.chipRest.x, G.chipRest.y - H * CHIP_REST_DY, CHIP_REST_ROT) : T(G.chipFrom.x, G.chipFrom.y)},
      g({transform: T(-G.chipFrom.x, -G.chipFrom.y)},
        g({'clip-path': ref('chip')}, h('path', {d: body, fill: col, stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}), deco, rim),
        h('path', {name: nm('chipedge'), d: breakD, fill: 'none', stroke: th.ink, 'stroke-width': sw * 0.8, 'stroke-linejoin': 'round', opacity: b0})),
    );
    const frame = s => {
      const out = {};
      if (!o.name) return out;
      out[nm('crackg')] = {opacity: s.a > 0 ? 1 : 0};
      out[nm('crack')] = {'stroke-dashoffset': r(cl * (1 - clamp(s.a)))};
      out[nm('branch')] = {'stroke-dashoffset': r(bl * (1 - clamp(seg(s.a, 0.45, 1))))};
      out[nm('notch')] = {opacity: s.b > 0 ? 1 : 0};
      out[nm('chipedge')] = {opacity: s.b > 0 ? 1 : 0};
      return out;
    };
    // chip rest: separate node placed by the entry (it leaves the object's frame)
    return {node, chip, frame, geom: G};
  }
  // ---- painted cabinet panel
  const col = th.accent4;
  const face = shade(col, 0.18);
  const sw = Math.max(1.5, Math.min(th.stroke, H * 0.012));
  const dentMax = 0.07;
  const bodyD = d => `M${X(-0.5)} ${Y(1)}L${X(-0.38)} ${Y(1)}Q${X(-0.22)} ${Y(1 - dentMax * 2 * d)} ${X(-0.06)} ${Y(1)}L${X(0.5)} ${Y(1)}V${Y(0.06)}H${X(-0.5)}Z`;
  const scr = [[[-0.18, 0.86], [0.18, 0.62]], [[-0.1, 0.9], [0.3, 0.66]], [[-0.26, 0.8], [0.02, 0.6]]];
  const scrLen = scr.map(([p, q]) => Math.hypot((q[0] - p[0]) * W, (q[1] - p[1]) * H));
  const a0 = lv >= 1 ? 1 : 0, b0 = lv >= 2 ? 1 : 0;
  const node = g({name: nm('body')},
    // feet
    h('rect', {x: X(-0.42), y: Y(0.07), width: r(W * 0.16), height: r(H * 0.07), rx: 2, fill: shade(col, -0.35), stroke: th.ink, 'stroke-width': sw * 0.8}),
    h('rect', {x: X(0.26), y: Y(0.07), width: r(W * 0.16), height: r(H * 0.07), rx: 2, fill: shade(col, -0.35), stroke: th.ink, 'stroke-width': sw * 0.8}),
    h('path', {name: nm('outline'), d: bodyD(a0), fill: col, stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(-0.36 * W, -0.86 * H, 0.72 * W, 0.66 * H, W * 0.04), fill: face, stroke: shade(col, -0.3), 'stroke-width': sw * 0.8}),
    h('path', {d: `M${X(-0.3)} ${Y(0.8)}H${X(0.3)}`, stroke: '#ffffff', 'stroke-width': r(Math.max(2, H * 0.02)), opacity: 0.35, 'stroke-linecap': 'round'}),
    h('circle', {cx: X(0.3), cy: Y(0.5), r: r(Math.max(3, W * 0.04)), fill: th.metal, stroke: th.ink, 'stroke-width': sw * 0.7}),
    // dent shading (grows with the dent)
    g({name: nm('dent'), opacity: a0},
      h('ellipse', {cx: X(-0.22), cy: Y(0.95), rx: r(W * 0.15), ry: r(H * 0.05), fill: shade(col, -0.4), opacity: 0.6}),
      h('path', {d: `M${X(-0.34)} ${Y(0.935)}Q${X(-0.22)} ${Y(0.89)} ${X(-0.1)} ${Y(0.935)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(Math.max(1.5, H * 0.012)), opacity: 0.55})),
    g({name: nm('scratchg'), opacity: b0},
      scr.map(([p, q], i) => h('path', {name: nm(`scr${i}`), d: `M${X(p[0])} ${Y(p[1])}L${X(q[0])} ${Y(q[1])}`, stroke: th.ink, 'stroke-width': r(Math.max(1.5, H * 0.011)), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(scrLen[i])} ${r(scrLen[i] + 20)}`, 'stroke-dashoffset': r(scrLen[i] * (1 - b0))}))),
  );
  const frame = s => {
    const out = {};
    if (!o.name) return out;
    out[nm('outline')] = {d: bodyD(clamp(s.a))};
    out[nm('dent')] = {opacity: r(clamp(s.a * 1.5), 3)};
    out[nm('scratchg')] = {opacity: s.b > 0 ? 1 : 0};
    scr.forEach((_, i) => { out[nm(`scr${i}`)] = {'stroke-dashoffset': r(scrLen[i] * (1 - clamp(s.b * 1.6 - i * 0.3)))}; });
    return out;
  };
  return {node, chip: null, frame, geom: G};
}

/** Static thumbnail of the object at a level (0 intact · 1 · 2). Local origin = bottom centre. */
export function objectIcon(ctx, {kind, level, H, tag}) {
  const a = objectArt(ctx, {kind, H, level, chipOffset: true, tag});
  return g(null, a.node, a.chip);
}

/* ------------------------------------------------------------------------ */
/* Stage props                                                              */
/* ------------------------------------------------------------------------ */

/** Wooden display table. (x0..x1) = top slab extent; topY = slab top; stands on floorY. */
export function tableArt(ctx, {name, x0, x1, topY, floorY}) {
  const th = ctx.theme;
  const w = x1 - x0;
  const slab = Math.max(10, (floorY - topY) * 0.14);
  const legW = Math.max(10, w * 0.06);
  return g({name},
    h('path', {d: roundRectPath(x0 + w * 0.08, topY + slab, w * 0.84, slab * 0.9, 3), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x0 + w * 0.1, topY + slab, legW, floorY - topY - slab, 3), fill: th.wood, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x1 - w * 0.1 - legW, topY + slab, legW, floorY - topY - slab, 3), fill: th.wood, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x0, topY, w, slab, 4), fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke}),
  );
}

/** Floor slab from x0 to x1 at floorY. */
export function floorArt(ctx, {name, x0, x1, floorY, t = 16}) {
  const th = ctx.theme;
  return g({name},
    h('rect', {x: r(x0), y: r(floorY), width: r(x1 - x0), height: t, rx: 4, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}),
  );
}

/** Paint tin. Local origin = centre; size s = height. */
export function tinArt(ctx, {name, s}) {
  const th = ctx.theme;
  const w = s * 0.88, hh = s;
  const lab = th.accent;
  return g({name},
    h('path', {d: `M${r(-w * 0.3)} ${r(-hh / 2)}Q0 ${r(-hh * 0.95)} ${r(w * 0.3)} ${r(-hh / 2)}`, fill: 'none', stroke: th.metalDark, 'stroke-width': 3}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2.5}),
    h('rect', {x: r(-w / 2 + 2), y: r(-hh * 0.22), width: r(w - 4), height: r(hh * 0.44), fill: lab}),
    h('path', {d: `M${r(-w / 2)} ${r(-hh * 0.36)}H${r(w / 2)}M${r(-w / 2)} ${r(hh * 0.36)}H${r(w / 2)}`, stroke: th.metalDark, 'stroke-width': 2}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 5), fill: 'none', stroke: th.ink, 'stroke-width': 2.5}),
  );
}

/**
 * Wall post with a hinged shelf board. The board pivots at (px, py) (its left
 * end) and rotates clockwise by `tilt` degrees (named node `${name}-board`).
 */
export function shelfArt(ctx, {name, postX, postTop, floorY, px, py, len, th: tk}) {
  const th = ctx.theme;
  const pw = Math.max(12, len * 0.1);
  return {
    back: g({name: `${name}-post`},
      h('path', {d: roundRectPath(postX - pw, postTop, pw, floorY - postTop, 3), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: r(postX - pw - 8), y: r(floorY - 10), width: r(pw + 16), height: 10, rx: 3, fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
      // bracket plate + hinge
      h('path', {d: roundRectPath(postX - 4, py - tk * 1.2, 10, tk * 3.2, 3), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    ),
    board: g({name: `${name}-board`, transform: T(px, py, 0)},
      h('path', {d: roundRectPath(0, -tk / 2, len, tk, 3), fill: th.woodTop, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: 0, cy: 0, r: r(tk * 0.45), fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}),
    ),
  };
}

/* ------------------------------------------------------------------------ */
/* Icons                                                                    */
/* ------------------------------------------------------------------------ */

/** Solid ● (before) / ◆ (after) marker. Centre (cx, cy), size s. */
export function sideMark(ctx, {cx, cy, s, side}) {
  const th = ctx.theme;
  const col = side === 'after' ? th.accent2 : th.accent2;
  if (side === 'after') return h('path', {d: `M${r(cx)} ${r(cy - s / 2)}L${r(cx + s / 2)} ${r(cy)}L${r(cx)} ${r(cy + s / 2)}L${r(cx - s / 2)} ${r(cy)}Z`, fill: col, stroke: th.ink, 'stroke-width': 2});
  return h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.42), fill: col, stroke: th.ink, 'stroke-width': 2});
}

/** Two linked rings (a link note); dashed ring + "?" when disputed. */
export function linkIcon(ctx, {cx, cy, s, disputed}) {
  const th = ctx.theme;
  const R = s * 0.42;
  const col = disputed ? th.accent : th.accent4;
  return g(null,
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: th.card, stroke: col, 'stroke-width': 3, 'stroke-dasharray': disputed ? '5 4' : null}),
    disputed
      ? h('path', {d: `M${r(cx - R * 0.3)} ${r(cy - R * 0.3)}Q${r(cx - R * 0.3)} ${r(cy - R * 0.62)} ${r(cx)} ${r(cy - R * 0.62)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.62)} ${r(cx + R * 0.32)} ${r(cy - R * 0.3)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.05)} ${r(cx)} ${r(cy + R * 0.05)}V${r(cy + R * 0.22)}M${r(cx)} ${r(cy + R * 0.45)}V${r(cy + R * 0.5)}`, fill: 'none', stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round'})
      : g(null,
        h('ellipse', {cx: r(cx - R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4}),
        h('ellipse', {cx: r(cx + R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4})),
  );
}

/** Pen icon (the plotter's pen), centre (cx, cy), size s. */
export function penIcon(ctx, {cx, cy, s}) {
  const th = ctx.theme;
  return g({transform: T(cx, cy, -40)},
    h('path', {d: roundRectPath(-s * 0.1, -s * 0.45, s * 0.2, s * 0.7, s * 0.06), fill: th.accent2, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(-s * 0.1)} ${r(s * 0.25)}L0 ${r(s * 0.46)}L${r(s * 0.1)} ${r(s * 0.25)}Z`, fill: '#c9ced4', stroke: th.ink, 'stroke-width': 1.6}),
  );
}

/** Icon for a band item. Kinds: event (die), before/after (mark + thumbnail), alt (barrier), link, tin, pen, key (none), note (object/record). */
export function itemIcon(ctx, it, x, cy, s, kind) {
  const th = ctx.theme;
  switch (it.icon) {
    case 'event': return g({transform: T(x + s * 0.1, cy - s * 0.4)}, dieFace(ctx, {s: s * 0.8, k: it.i + 1}));
    case 'before': case 'after': return g(null,
      sideMark(ctx, {cx: x + s * 0.2, cy, s: s * 0.36, side: it.icon}),
      g({transform: T(x + s * 0.7, cy + s * 0.46)}, objectIcon(ctx, {kind, level: it.icon === 'after' ? it.level : 0, H: s * 0.9, tag: `${it.key}`})));
    case 'alt': return g({transform: T(x + s / 2, cy + s * 0.45)}, barrierArt(ctx, {name: `alt-${it.key}-${Math.round(s)}`, w: s * 0.95, h: s * 0.9}));
    case 'link': return linkIcon(ctx, {cx: x + s / 2, cy, s, disputed: it.disputed});
    case 'tin': return g({transform: T(x + s / 2, cy)}, tinArt(ctx, {s: s * 0.75}));
    case 'pen': return penIcon(ctx, {cx: x + s / 2, cy, s: s * 0.9});
    case 'object': return g({transform: T(x + s / 2, cy + s * 0.45)}, objectIcon(ctx, {kind, level: it.level ?? 2, H: s * 0.9, tag: `${it.key}`}));
    case 'record': return g(null,
      h('path', {d: roundRectPath(x + s * 0.18, cy - s * 0.42, s * 0.64, s * 0.84, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy - s * 0.18)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy + s * 0.18)}H${r(x + s * 0.6)}`, stroke: th.paperLine, 'stroke-width': 3}),
      h('rect', {x: r(x + s * 0.38), y: r(cy - s * 0.5), width: r(s * 0.24), height: r(s * 0.12), rx: 2, fill: th.metalDark}));
    default: return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Chips                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * Measure an icon chip (icon at the left, fitted text in a rounded box).
 * @returns {{w:number,h:number,bad:boolean, build:(x:number,y:number,name:string,style?:any)=>{node:any, box:any}}}
 */
export function iconChip(ctx, it, o) {
  const th = ctx.theme;
  const size = o.size;
  const iconS = it.icon ? size * 1.5 : 0;
  const iw = it.icon ? iconS + 10 : 0;
  const mw = Math.max(size * 4, o.maxW - iw);
  const maxLines = it.maxLines ?? o.maxLines ?? 3;
  const bw = balancedG(ctx, it.text, {maxWidth: mw, size, maxLines});
  const probe = chipG(ctx, it.text, {x: 0, y: 0, maxWidth: bw, size, maxLines});
  const hh = Math.max(probe.box.h, iconS);
  const w = iw + probe.box.w;
  return {
    w, h: hh, bad: probe.fit.truncated || probe.fit.broken, lines: probe.fit.lines.length,
    build(x, y, name, style = {}) {
      const c = chipG(ctx, it.text, {x: x + iw, y: y + (hh - probe.box.h) / 2, maxWidth: bw, size, maxLines, fill: style.fill ?? th.card, stroke: style.stroke ?? th.inkSoft, dash: style.dash, textName: style.textName});
      const icon = it.icon ? itemIcon(ctx, it, x, y + hh / 2, iconS, o.kind) : null;
      return {node: g({name, opacity: style.opacity ?? 0}, icon, c.node), box: {x, y, w, h: hh}, chip: c.box};
    },
  };
}

/** Flow measured items into rows (left → right, wrapping). */
export function flowRows(items, o) {
  const gap = o.gap ?? 16, rowGap = o.rowGap ?? 10;
  let x = o.x, y = o.y, rowH = 0;
  const placed = [];
  for (const it of items) {
    if (x > o.x && x + it.w > o.x + o.w + 0.5) { x = o.x; y += rowH + rowGap; rowH = 0; }
    placed.push({it, x, y});
    x += it.w + gap;
    rowH = Math.max(rowH, it.h);
  }
  // centre each row inside the width when asked
  if (o.center) {
    const rows = new Map();
    for (const pl of placed) { if (!rows.has(pl.y)) rows.set(pl.y, []); rows.get(pl.y).push(pl); }
    for (const rw of rows.values()) {
      const right = Math.max(...rw.map(pl => pl.x + pl.it.w));
      const dx = (o.x + o.w - right) / 2;
      rw.forEach(pl => { pl.x += dx; });
    }
  }
  return {placed, bottom: placed.length ? y + rowH : o.y};
}

/* ------------------------------------------------------------------------ */
/* Incident record (clipboard) + plotter                                    */
/* ------------------------------------------------------------------------ */

/**
 * Measure / build the incident record. Rows: {key, icon, text, i?, level?}.
 * Text rows use fitG (glue-aware, never breaks a word); with labels hidden each
 * row shows simulated writing bars instead (a prop, not supplied text).
 * @param {any} ctx
 * @param {{prefix:string, w:number, size:number, header:string, rows:any[], kind:string, maxLines?:number, text:boolean}} o
 */
export function recordMeasure(ctx, o) {
  const size = o.size;
  const pad = Math.max(14, size * 0.7);
  const iconS = size * 1.9;
  const textW = o.w - 2 * pad - iconS - 12;
  // header: null → a sheet without a heading (e.g. a clipboard that only holds one row)
  const noHead = o.header === null;
  const headFit = o.text && !noHead ? fitG(ctx, o.header, {maxWidth: o.w - 2 * pad, size, minSize: size, maxLines: 2, weight: 700}) : null;
  const headH = noHead ? size * 0.3 : o.text ? headFit.height + size * 0.6 : size * 1.4;
  const rows = o.rows.map(rw => {
    if (!o.text) return {...rw, fit: null, h: Math.max(iconS, size * 1.5) + size * 0.5};
    const fit = fitG(ctx, rw.text, {maxWidth: textW, size, minSize: size, maxLines: rw.maxLines ?? o.maxLines ?? 3, weight: rw.weight ?? 600});
    return {...rw, fit, h: Math.max(iconS, fit.height) + size * 0.5};
  });
  const bad = (headFit && (headFit.truncated || headFit.broken)) || rows.some(rw => rw.fit && (rw.fit.truncated || rw.fit.broken));
  const clipH = Math.max(18, size * 0.9);
  const h0 = clipH * 0.5 + pad * 0.6 + headH + rows.reduce((s, rw) => s + rw.h, 0) + pad * 0.6;
  return {size, pad, iconS, textW, headFit, headH, rows, bad, h: h0, w: o.w, clipH, noHead};
}

/**
 * Build the record from a measurement at (x, y) (y = top of the clipboard).
 * Named nodes: `${prefix}` (whole), `${prefix}-row-${key}` (each row group),
 * `${prefix}-txt-${key}` (row text), `${prefix}-wipe-${key}-${line}` (clip rects
 * for rows marked `wipe`). Returns row boxes and each row's line geometry.
 */
export function recordBuild(ctx, m, o) {
  const th = ctx.theme;
  const {x, y} = o;
  const P = o.prefix;
  const {pad, iconS, size} = m;
  const w = m.w;
  const out = [];
  const nodes = [];
  let cy = y + m.clipH * 0.5 + pad * 0.6;
  if (m.headFit) nodes.push(textBlock(m.headFit, {x: x + pad, y: cy, fill: th.ink, name: `${P}-head`}));
  else if (!m.noHead) nodes.push(h('rect', {x: r(x + pad), y: r(cy + size * 0.2), width: r(w * 0.45), height: r(size * 0.5), rx: 3, fill: th.inkSoft, opacity: 0.55}));
  cy += m.headH;
  if (!m.noHead) nodes.push(h('path', {d: `M${r(x + pad)} ${r(cy - size * 0.3)}H${r(x + w - pad)}`, stroke: th.ink, 'stroke-width': 2}));
  const rowNodes = [];
  m.rows.forEach((rw, i) => {
    const top = cy;
    const icy = top + rw.h / 2 - size * 0.1;
    const tx = x + pad + iconS + 12;
    const icon = itemIcon(ctx, rw, x + pad, icy, iconS, o.kind);
    let textNode = null;
    let lines = [];
    const clipDefs = [];
    if (rw.fit) {
      const ty = top + (rw.h - size * 0.5 - rw.fit.height) / 2 + size * 0.05;
      lines = rw.fit.lines.map((ln, li) => ({x: tx, y: ty + li * rw.fit.lineHeight, w: ctx.measure(ln.replace(/\u00a0/g, ' '), rw.fit.size, rw.fit.weight, rw.fit.family), h: rw.fit.size}));
      const tb = textBlock(rw.fit, {x: tx, y: ty, fill: th.ink, name: `${P}-txt-${rw.key}`});
      if (rw.wipe) {
        clipDefs.push(h('clipPath', {id: ctx.id(`${P}-clip-${rw.key}`)}, lines.map((ln, li) => h('rect', {name: `${P}-wipe-${rw.key}-${li}`, x: r(ln.x - 4), y: r(ln.y - size * 0.25), width: 0, height: r(rw.fit.lineHeight + 2)}))));
        textNode = g({'clip-path': `url(#${ctx.id(`${P}-clip-${rw.key}`)})`}, tb);
      } else textNode = tb;
    } else {
      // simulated writing bars (labels hidden)
      const bw = m.textW;
      lines = [0, 1].map(li => ({x: tx, y: top + rw.h * 0.28 + li * size * 0.75, w: bw * (li ? 0.55 : 0.85), h: size * 0.4}));
      const bars = lines.map((ln, li) => h('path', {name: rw.wipe ? `${P}-bar-${rw.key}-${li}` : undefined, d: `M${r(ln.x)} ${r(ln.y + size * 0.2)}H${r(ln.x + ln.w)}`, stroke: th.inkSoft, 'stroke-width': r(size * 0.28), 'stroke-linecap': 'round', opacity: 0.6, 'stroke-dasharray': rw.wipe ? `${r(ln.w)} ${r(ln.w + 40)}` : null, 'stroke-dashoffset': rw.wipe ? r(ln.w) : null}));
      textNode = g(null, bars);
    }
    const rowG = g({name: `${P}-row-${rw.key}`, opacity: rw.startHidden ? 0 : undefined}, clipDefs.length ? h('defs', null, clipDefs) : null, g({name: `${P}-icon-${rw.key}`, opacity: rw.iconHidden ? 0 : undefined}, icon), textNode);
    rowNodes.push(rowG);
    const box = {x: x + pad * 0.5, y: top, w: w - pad, h: rw.h};
    out.push({key: rw.key, box, lines, iconBox: {x: x + pad, y: icy - iconS / 2, w: iconS, h: iconS}, textBox: rw.fit ? {x: tx, y: lines[0].y, w: Math.max(...lines.map(l => l.w)), h: rw.fit.height} : {x: tx, y: top, w: m.textW, h: rw.h}});
    cy += rw.h;
    if (i < m.rows.length - 1) rowNodes.push(h('path', {d: `M${r(x + pad)} ${r(cy - size * 0.25)}H${r(x + w - pad)}`, stroke: th.paperLine, 'stroke-width': 1.5}));
  });
  const H0 = m.h;
  const board = g(null,
    h('path', {d: roundRectPath(x - 10, y - 4, w + 20, H0 + 14, 10), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(x, y + m.clipH * 0.3, w, H0 - m.clipH * 0.3, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x + w / 2 - w * 0.14, y - m.clipH * 0.35, w * 0.28, m.clipH, 5), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
  );
  return {node: g({name: P}, board, nodes, rowNodes), rows: out, box: {x: x - 10, y: y - m.clipH * 0.35, w: w + 20, h: H0 + 14 + m.clipH * 0.35}, paper: {x, y: y + m.clipH * 0.3, w, h: H0 - m.clipH * 0.3}};
}

/**
 * Frame of a row written by the plotter: progress 0..1 along the pen's path —
 * each line left to right, then a pen-up return to the start of the next line
 * (the return counts as half its length, so the pen never jumps). Returns the
 * node record and the pen tip position.
 */
export function writeRow(ctx, P, row, prog, text) {
  const out = {};
  const L = row.lines;
  const yOf = ln => ln.y + ln.h * (text ? 0.95 : 0.7);
  const segs = [];
  L.forEach((ln, li) => {
    segs.push({kind: 'line', li, len: ln.w, a: {x: ln.x, y: yOf(ln)}, b: {x: ln.x + ln.w, y: yOf(ln)}});
    if (li < L.length - 1) {
      const nx = L[li + 1];
      segs.push({kind: 'ret', len: 0.5 * Math.hypot(ln.x + ln.w - nx.x, yOf(ln) - yOf(nx)), a: {x: ln.x + ln.w, y: yOf(ln)}, b: {x: nx.x, y: yOf(nx)}});
    }
  });
  const total = segs.reduce((s0, q) => s0 + q.len, 0) || 1;
  let rem = clamp(prog) * total;
  let tip = {...segs[0].a};
  const done = L.map(() => 0);
  for (const q of segs) {
    const d = clamp(rem, 0, q.len);
    if (rem > 0) {
      const f = q.len ? d / q.len : 1;
      tip = {x: lerp(q.a.x, q.b.x, f), y: lerp(q.a.y, q.b.y, f) - (q.kind === 'ret' ? Math.sin(f * Math.PI) * L[0].h * 0.4 : 0)};
      if (q.kind === 'line') done[q.li] = d;
    }
    rem -= q.len;
  }
  L.forEach((ln, li) => {
    const d = done[li];
    if (text) out[`${P}-wipe-${row.key}-${li}`] = {width: r(d > 0 ? d + (d >= ln.w - 0.01 ? 10 : 2) : 0)};
    else out[`${P}-bar-${row.key}-${li}`] = {'stroke-dashoffset': r(ln.w - d)};
  });
  return {nodes: out, tip};
}

/**
 * Plotter mounted UNDER the record's bottom edge: a rail from x0 to x1 at
 * railY, a carriage, a telescopic rod rising from it and a pen pointing up
 * whose nib is at (x, y). Because the rod rises from below, it only ever
 * crosses the row being written (the last row), never another row's text.
 * @returns {{node:any, frame:(tip:{x:number,y:number})=>Record<string,any>, parkX:number, parkTip:{x:number,y:number}, penL:number, box:any}}
 */
export function plotterArt(ctx, {prefix, x0, x1, railY, s}) {
  const th = ctx.theme;
  const P = prefix;
  const cw = s * 1.5, ch = s * 0.8;
  const penL = s * 1.9;
  const parkX = x1 - cw * 0.6;
  const parkTip = {x: parkX, y: railY - ch / 2 - penL - s * 0.2};
  const node = g({name: P},
    h('path', {d: roundRectPath(x0, railY - s * 0.14, x1 - x0, s * 0.28, 4), fill: th.metalDark, stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: r(x0 - 6), y: r(railY - s * 0.3), width: 10, height: r(s * 0.6), rx: 2, fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}),
    h('rect', {x: r(x1 - 4), y: r(railY - s * 0.3), width: 10, height: r(s * 0.6), rx: 2, fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}),
    h('line', {name: `${P}-rod`, x1: r(parkX), y1: r(railY), x2: r(parkX), y2: r(parkTip.y + penL * 0.8), stroke: th.metal, 'stroke-width': r(Math.max(4, s * 0.16)), 'stroke-linecap': 'round'}),
    g({name: `${P}-car`, transform: T(parkX, railY)},
      h('path', {d: roundRectPath(-cw / 2, -ch / 2, cw, ch, 5), fill: th.accent2, stroke: th.ink, 'stroke-width': 2}),
      h('circle', {cx: r(-cw * 0.25), cy: 0, r: r(ch * 0.18), fill: th.card, stroke: th.ink, 'stroke-width': 1.5}),
      h('circle', {cx: r(cw * 0.25), cy: 0, r: r(ch * 0.18), fill: th.card, stroke: th.ink, 'stroke-width': 1.5})),
    g({name: `${P}-pen`, transform: T(parkTip.x, parkTip.y)},
      h('path', {d: roundRectPath(-s * 0.13, penL * 0.2, s * 0.26, penL * 0.8, s * 0.08), fill: th.accent2, stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: r(-s * 0.13), y: r(penL * 0.45), width: r(s * 0.26), height: r(s * 0.12), fill: th.accent3, stroke: th.ink, 'stroke-width': 1.2}),
      h('path', {d: `M${r(-s * 0.13)} ${r(penL * 0.2)}L0 0L${r(s * 0.13)} ${r(penL * 0.2)}Z`, fill: '#c9ced4', stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'})),
  );
  const frame = tip => ({
    [`${P}-car`]: {transform: T(tip.x, railY)},
    [`${P}-rod`]: {x1: r(tip.x), x2: r(tip.x), y2: r(tip.y + penL * 0.8)},
    [`${P}-pen`]: {transform: T(tip.x, tip.y)},
  });
  return {node, frame, parkX, parkTip, penL, box: {x: x0 - 6, y: parkTip.y, w: x1 - x0 + 16, h: railY + s * 0.4 - parkTip.y}};
}

/* ------------------------------------------------------------------------ */
/* Connectors (mechanism)                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Connector styles. All are SOLID lines (dashes mean disputed / pending in the
 * library and are only used when a link is supplied as disputed): a plain
 * relation has no head (end dots), a communication an open chevron head, a
 * sequence a filled head, and a supplied causal link a heavier filled head in
 * the accent colour.
 */
export const DM_LINKS = {
  relation: {width: 3, head: null, dots: true},
  communication: {width: 3.5, head: 'open', dots: false},
  sequence: {width: 3.5, head: 'filled', dots: false},
  causal: {width: 5, head: 'filled', dots: false},
};

export function linkColor(ctx, kind) {
  const th = ctx.theme;
  return kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.fg : kind === 'causal' ? th.accent : th.fgSoft;
}

/**
 * Quadratic connector from `from` to `to` bowed by `bend` (× length, to the
 * left of the direction of travel). Drawing progress and head via frame(p).
 * @returns {{node:any, frame:(p:number)=>Record<string,any>, at:(t:number)=>{x:number,y:number,a:number}, total:number}}
 */
export function linkArt(ctx, {name, from, to, kind, bend = 0, disputed = false}) {
  const st = DM_LINKS[kind] || DM_LINKS.relation;
  const col = linkColor(ctx, kind);
  const dx = to.x - from.x, dy = to.y - from.y;
  const len0 = Math.hypot(dx, dy) || 1;
  const c = {x: (from.x + to.x) / 2 - (dy / len0) * bend * len0, y: (from.y + to.y) / 2 + (dx / len0) * bend * len0};
  const at = t => {
    const u = 1 - t;
    const x = u * u * from.x + 2 * u * t * c.x + t * t * to.x;
    const y = u * u * from.y + 2 * u * t * c.y + t * t * to.y;
    const tx = 2 * u * (c.x - from.x) + 2 * t * (to.x - c.x), ty = 2 * u * (c.y - from.y) + 2 * t * (to.y - c.y);
    return {x, y, a: Math.atan2(ty, tx)};
  };
  let total = 0;
  let prev = at(0);
  const lut = [0];
  for (let i = 1; i <= 40; i++) { const q = at(i / 40); total += Math.hypot(q.x - prev.x, q.y - prev.y); lut.push(total); prev = q; }
  const atLen = f => {
    const target = f * total;
    let i = 1;
    while (i < 40 && lut[i] < target) i++;
    const a0 = lut[i - 1], a1 = lut[i];
    return at((i - 1 + (a1 > a0 ? (target - a0) / (a1 - a0) : 0)) / 40);
  };
  const d = `M${r(from.x)} ${r(from.y)}Q${r(c.x)} ${r(c.y)} ${r(to.x)} ${r(to.y)}`;
  const hl = st.width * 4.4;
  const end = at(1);
  const head = st.head === 'filled'
    ? h('path', {name: `${name}-head`, d: `M0 0L${r(-hl)} ${r(-hl * 0.55)}L${r(-hl * 0.7)} 0L${r(-hl)} ${r(hl * 0.55)}Z`, fill: col, transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0})
    : st.head === 'open'
      ? h('path', {name: `${name}-head`, d: `M${r(-hl)} ${r(-hl * 0.6)}L0 0L${r(-hl)} ${r(hl * 0.6)}`, fill: 'none', stroke: col, 'stroke-width': st.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0})
      : null;
  const node = g({name},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: col, 'stroke-width': st.width, 'stroke-linecap': 'round', 'stroke-dasharray': disputed ? '9 8' : `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': disputed ? 0 : r(total), opacity: disputed ? 0 : 1}),
    head,
    st.dots ? h('circle', {name: `${name}-dA`, cx: r(from.x), cy: r(from.y), r: r(st.width * 1.7), fill: col, opacity: 0}) : null,
    st.dots ? h('circle', {name: `${name}-dB`, cx: r(to.x), cy: r(to.y), r: r(st.width * 1.7), fill: col, opacity: 0}) : null,
  );
  const frame = p => {
    const out = {};
    if (disputed) out[`${name}-line`] = {opacity: r(clamp(p), 3)};
    else out[`${name}-line`] = {'stroke-dashoffset': r(total * (1 - clamp(p)))};
    if (st.head) out[`${name}-head`] = {opacity: p >= 0.985 ? 1 : 0};
    if (st.dots) { out[`${name}-dA`] = {opacity: p > 0 ? 1 : 0}; out[`${name}-dB`] = {opacity: p >= 0.985 ? 1 : 0}; }
    return out;
  };
  return {node, frame, at: atLen, total, mid: atLen(0.5), from, to};
}

/** Tracer marker (accent2 ring + dot). */
export function tracerArt(ctx, name) {
  const th = ctx.theme;
  return g({name, opacity: 0},
    h('circle', {r: 18, fill: th.accent2, opacity: 0.25}),
    h('circle', {r: 9, fill: th.accent2, stroke: th.paper, 'stroke-width': 3}));
}

/** Point where the segment from the centre of box b toward p leaves b (inflated by pad). */
export function boxExit(b, p, pad = 6) {
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
  const dx = p.x - cx, dy = p.y - cy;
  if (!dx && !dy) return {x: cx, y: cy};
  const s = Math.min((b.w / 2 + pad) / Math.abs(dx || 1e-9), (b.h / 2 + pad) / Math.abs(dy || 1e-9));
  return {x: cx + dx * s, y: cy + dy * s};
}

/** Axis-aligned overlap of two boxes (with padding). */
export const boxesMeet = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
