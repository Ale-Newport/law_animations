/**
 * Motif kit for "Agravación de daño" (LAW-0705..0708): a fictional generic
 * object (Object A, a surface panel) is shown in a SUPPLIED initial state and a
 * SUPPLIED later state; the variation between them is only shown as supplied,
 * on a neutral illustrative scale — never measured, valued, attributed or
 * decided.
 *
 * Original vector art (front view):
 *  - The PANEL: a framed surface sample on a two-legged stand. Its face carries
 *    a faint grid of COLS columns (the illustrative scale: "level n" = n
 *    columns, a placeholder magnitude, not a real figure). A neutral taupe MARK
 *    covers the face from its left edge to the supplied level, with a soft wavy
 *    edge that never passes the level line.
 *  - Two FLAGS of identical weight stand in the slotted top rail: ● marks the
 *    prior condition (initial level) and ◆ the later change (later level); each
 *    flag drops a solid edge line down the face. The ● head stands lower than
 *    the ◆ head so the two never cover each other.
 *  - The VARIATION strip (between the two levels) is shown with soft accent
 *    stripes and a solid bracket between the flag heads — never red, never a
 *    hatch or a cross.
 *  - Nothing depicts a person, an injury, a cause or an author of the change;
 *    no state is a harm caused by someone. Every figure is a placeholder level
 *    "as supplied". Dashes only mark a disputed link.
 *
 * Copied, not imported, from kits/perdida-economica.js (the record sheet, chips,
 * flowRows, localizeScene); read-only imports of the low-level text helpers and
 * connector art (kits/prueba-contrafactual.js, kits/dano-material.js,
 * kits/causal-chain.js), as the earlier causation kits do. The kit owns
 * geometry, art and text measurement; each entry owns its timeline, layout and
 * semantics.
 * @module animations/causation/kits/agravacion-dano
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {str, int, oneOf, list, obj} from '../../../schemas/fields.js';
import {fitG, chipG, balancedG} from './prueba-contrafactual.js';
import {barrierArt as barrierArt0} from './causal-chain.js';
import {linkArt as linkArt0, tracerArt, boxExit, boxesMeet} from './dano-material.js';

export {fitG, chipG, balancedG, tracerArt, boxExit, boxesMeet};
export {clamp, ease, lerp, r, seg};

// nothing in this motif uses the theme's red accent: shared connector / barrier art goes through a neutral context
const neutral = (ctx, accent) => { const c = Object.create(ctx); c.theme = {...ctx.theme, accent, accentSoft: ctx.theme.paperShade}; return c; };
/** Connector (kits/dano-material.js linkArt) in neutral ink for supplied causal links. */
export const linkArt = (ctx, o) => linkArt0(neutral(ctx, ctx.theme.ink), o);
const barrierArt = (ctx, o) => barrierArt0(neutral(ctx, ctx.theme.metalDark), o);

/** Columns of the panel's illustrative scale (level n = n columns). */
export const COLS = 6;

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const agFields = {
  object: obj('The fictional generic object (a surface panel; no person is ever drawn)', {
    name: str('Name of the object, e.g. "Object A (fictional panel)"', 48),
  }, ['name']),
  events: list('Record entries in the supplied order (fictional, descriptive; no cause, author or finding). Each belongs to the prior condition or to the later change.', obj('Entry', {
    label: str('Entry text (fictional, descriptive)', 64),
    time: str('Optional fictional relative label, e.g. "Visit 2" (shown as supplied; never a time limit)', 20),
    stage: oneOf('Which supplied state the entry belongs to', ['initial', 'later']),
  }, ['label', 'stage']), 2, 5),
  causalLinks: list('Per-link data. Link i joins entry i to the next entry; the link after the last entry joins it to the variation. Links not listed are a sequence as supplied.', obj('Link', {
    from: int('Index (0-based) of the entry where the link starts', 0, 4),
    kind: oneOf('sequence (default) or causal; a causal arrow is only drawn when supplied here', ['sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); never resolved', ['proposed', 'disputed']),
    label: str('Optional caption for this link', 48),
  }, ['from']), 0, 5),
  alternatives: list('Other accounts put forward by someone; drawn with a barrier icon, never decided', obj('Alternative', {
    label: str('Account put forward', 64),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label']), 0, 2),
  losses: list('The variation as supplied: the first entry is how the variation between the two states is described (a placeholder description, no amount or valuation); an optional second entry is a noted detail.', obj('Variation', {
    label: str('Description of the supplied variation (no valuation)', 72),
  }, ['label']), 1, 2),
  levels: obj('Placeholder magnitudes on the illustrative scale (0–6 columns of the panel): the prior condition and the later change, both as supplied', {
    initial: int('Level of the prior condition (as supplied)', 0, COLS),
    later: int('Level of the later change (as supplied)', 0, COLS),
  }, ['initial', 'later']),
};

export const AG_STRINGS = {
  en: {
    record: 'Record of Object A (as supplied)',
    initial: 'Prior condition (as supplied)',
    later: 'Later change (as supplied)',
    level: 'level',
    illustrative: 'illustrative scale',
    alsoNoted: 'Also noted',
    other: 'Put forward', alleged: 'alleged', proposed: 'proposed', disputed: 'disputed',
    link: 'Link', kindCausal: 'causal (as supplied)', toVar: 'variation',
    scale: 'Scale: 1 column = 1 level (placeholder)',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    record: 'Registro del objeto A (según lo aportado)',
    initial: 'Condición previa (según lo aportado)',
    later: 'Cambio posterior (según lo aportado)',
    level: 'nivel',
    illustrative: 'escala ilustrativa',
    alsoNoted: 'También consta',
    other: 'Planteado', alleged: 'alegado', proposed: 'propuesto', disputed: 'discutido',
    link: 'Enlace', kindCausal: 'causal (según lo aportado)', toVar: 'variación',
    scale: 'Escala: 1 columna = 1 nivel (marcador)',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** "level 2" — the word and its number kept together (glue-aware fitting). */
export const levelText = (ctx, n) => `${ctx.t.level}\u00a0${n}`;

/** "Variation as supplied: level 2 → level 5 (illustrative scale)". */
export function variationText(ctx, p, a = p.levels.initial, b = p.levels.later) {
  return `${p.losses[0].label}: ${levelText(ctx, a)}\u00a0→\u00a0${levelText(ctx, b)} (${ctx.t.illustrative})`;
}

/** Keep short parentheticals ("(as supplied)") on one line: their inner spaces become U+00A0 (glue-aware fitting). */
export const gp = text => String(text ?? '').replace(/\(([^()]{1,34})\)/g, (m, q) => `(${q.replace(/ /g, '\u00a0')})`);

/**
 * No one-word lines: while a wrapped fit (fitOf(text) → {lines}) leaves a line holding a single word, that word is glued
 * (U+00A0) to its neighbour — the previous line's last word, or the next line's first — and the text is fitted again.
 * Returns the text to draw.
 */
export function unwidow(text, fitOf) {
  let t = String(text ?? '');
  for (let i = 0; i < 8; i++) {
    const f = fitOf(t);
    const lines = f.lines.map(l => l.replace(/…$/, '').trim());
    if (lines.length < 2) return t;
    const bad = lines.findIndex(l => !/[ \u00a0]/.test(l));
    if (bad < 0) return t;
    const parts = t.split(/([ \u00a0]+)/);
    const nWords = l => l.split(/[ \u00a0]+/).filter(Boolean).length;
    const k = lines.slice(0, bad).reduce((q, l) => q + nWords(l), 0);
    const sepIdx = bad > 0 ? 2 * k - 1 : 2 * k + 1;
    if (sepIdx < 1 || sepIdx >= parts.length) return t;
    parts[sepIdx] = '\u00a0';
    t = parts.join('');
  }
  return t;
}

/** Short supplied time label kept whole. */
export const nb = s => (String(s).length <= 16 ? String(s).replace(/ /g, '\u00a0') : String(s));

/** Record / band text of an entry. */
export function entryText(e) {
  return `${e.time ? `${nb(e.time)} · ` : ''}${e.label}`;
}

/** Normalize the motif data. */
export function resolveAG(p) {
  const n = p.events.length;
  const links = Array.from({length: n}, (_, i) => ({from: i, kind: 'sequence', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) if (l.from < n) Object.assign(links[l.from], {kind: l.kind || 'sequence', status: l.status || 'proposed', label: l.label || ''});
  const alternatives = (p.alternatives || []).map(a => ({...a, status: a.status || 'alleged'}));
  const L0 = clamp(Math.round(p.levels.initial), 0, COLS), L1 = clamp(Math.round(p.levels.later), 0, COLS);
  const entries = p.events.map((e, i) => ({...e, i, stage: e.stage === 'later' ? 'later' : 'initial'}));
  return {n, entries, links, alternatives, losses: p.losses, L0, L1};
}

/** Link notes for links that carry supplied data. */
export function linkNotes(ctx, M) {
  const t = ctx.t;
  const out = [];
  M.links.forEach(l => {
    const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputed : null, l.label || null].filter(Boolean);
    if (!bits.length) return;
    const to = l.from + 1 < M.n ? String(l.from + 2) : t.toVar;
    out.push({key: `lk${l.from}`, icon: 'link', disputed: l.status === 'disputed', text: `${t.link} ${l.from + 1} →\u00a0${to}: ${bits.join(' · ')}`});
  });
  return out;
}

/** Band text of an alternative. */
export const altText = (ctx, a) => `${ctx.t.other}: ${a.label} (${a.status === 'alleged' ? ctx.t.alleged : ctx.t.proposed})`;

/* ------------------------------------------------------------------------ */
/* Panel geometry and art                                                   */
/* ------------------------------------------------------------------------ */

/**
 * Rig proportions (× PH, the height of the panel's face). Heights above the
 * floor: frame bottom LEG, face from LEG + BORDER to LEG + BORDER + 1, the rail
 * on top of the frame, the ● head, the ◆ head (higher) and the bracket.
 */
export const RIG = {faceW: 1.5, border: 0.07, rail: 0.08, leg: 0.2, stemA: 0.14, stemB: 0.33, head: 0.17, brGap: 0.13, park: 0.36};
/** Rig width and height (× PH); the rail runs on past the frame's left edge as a siding where both flags wait. */
export const rigW = (fw = RIG.faceW, park = RIG.park) => park + fw + 2 * RIG.border + 0.14;
export const rigH = (low = false) => RIG.leg + 2 * RIG.border + 1 + RIG.rail + (low ? RIG.stemA : RIG.stemB) + RIG.head + RIG.brGap + 0.04;

/**
 * Rig geometry for a face height PH (face width faceW × PH), its left edge at `left`, standing on floorY.
 * x(level) = x of a level line; headA / headB = ● / ◆ head centre heights (y);
 * parkA / parkB = where the ● / ◆ flags wait on the rail's siding; bracketY =
 * the bracket's y; top = the rig's top (y). `low`: both flags on short stems (one flag per rig).
 */
export function rigGeom(left, floorY, PH, faceW = RIG.faceW, low = false, park = RIG.park) {
  const fw = faceW * PH, b = RIG.border * PH;
  const cx = left + (0.07 + park) * PH + b + fw / 2;
  const fy1 = floorY - (RIG.leg + RIG.border) * PH;
  const fy0 = fy1 - PH;
  const fx0 = cx - fw / 2, fx1 = cx + fw / 2;
  const cell = fw / COLS;
  const railTop = fy0 - b - RIG.rail * PH;
  const headA = railTop - RIG.stemA * PH - RIG.head * PH * 0.5;
  const headB = railTop - (low ? RIG.stemA : RIG.stemB) * PH - RIG.head * PH * 0.5;
  const bracketY = headB - RIG.head * PH * 0.5 - RIG.brGap * PH * 0.6;
  return {
    PH, cx, floorY, fx0, fx1, fy0, fy1, fw, b, cell, railTop, headA, headB, headS: RIG.head * PH, bracketY, low,
    x: lv => fx0 + clamp(lv, 0, COLS) * cell,
    x0: left, x1: fx1 + b + 0.07 * PH, top: floorY - rigH(low) * PH,
    parkA: fx0 - b - park * PH * 0.78, parkB: fx0 - b - park * PH * 0.3, railX0: fx0 - b - park * PH - 0.03 * PH,
    frame: {x: fx0 - b, y: fy0 - b, w: fw + 2 * b, h: PH + 2 * b},
  };
}

/** Wavy-edged mark from the face's left edge to level `lv` (the edge never passes the level line). */
export function markD(G, lv) {
  if (lv <= 0.002) return `M${r(G.fx0)} ${r(G.fy0)}Z`;
  const xe = G.x(lv);
  const amp = Math.min(G.cell * 0.22, (xe - G.fx0) * 0.5);
  const off = [0.15, 0.85, 0.35, 0.95, 0.25, 0.7, 0.1];
  const n = 6;
  let d = `M${r(G.fx0 - 2)} ${r(G.fy0 - 2)}H${r(xe - amp * off[0])}`;
  for (let k = 1; k <= n; k++) {
    const y = G.fy0 + (k / n) * (G.fy1 - G.fy0);
    const ym = G.fy0 + ((k - 0.5) / n) * (G.fy1 - G.fy0);
    d += `Q${r(xe - amp * (k % 2 ? 1.1 : 0.05))} ${r(ym)} ${r(xe - amp * off[k])} ${r(y)}`;
  }
  return `${d}V${r(G.fy1 + 2)}H${r(G.fx0 - 2)}Z`;
}

const FACE = '#ece5d6';
const MARK = '#8e9097';
const MARK_EDGE = '#55585f';

/**
 * The panel rig (stand, frame, face, grid, mark, rail). Named nodes with the
 * prefix P: `${P}mark` (path d: the mark), `${P}stripes` (the variation stripes,
 * x / width via `${P}varclip`), `${P}panel` (the whole rig).
 */
export function rigArt(ctx, {P, G, level, varFrom = 0, varTo = 0}) {
  const th = ctx.theme;
  const PH = G.PH;
  const legW = Math.max(6, PH * 0.06);
  const lx = [G.fx0 + G.fw * 0.18, G.fx1 - G.fw * 0.18];
  const grid = [];
  for (let k = 1; k < COLS; k++) grid.push(`M${r(G.x(k))} ${r(G.fy0)}V${r(G.fy1)}`);
  for (let k = 1; k < 4; k++) grid.push(`M${r(G.fx0)} ${r(G.fy0 + (k * PH) / 4)}H${r(G.fx1)}`);
  const ticks = [];
  for (let k = 0; k <= COLS; k++) ticks.push(`M${r(G.x(k))} ${r(G.railTop + 2)}v${r(RIG.rail * PH * 0.55)}`);
  const clip = ctx.id(`${P}face`);
  const vclip = ctx.id(`${P}vclip`);
  // soft diagonal stripes (45°), each segment cut to the face so no drawn geometry leaves it
  const stripes = [];
  for (let x = G.fx0 - PH; x < G.fx1; x += PH * 0.12) {
    const xa = Math.max(x, G.fx0), xb = Math.min(x + PH, G.fx1);
    if (xb - xa < 1) continue;
    stripes.push(`M${r(xa)} ${r(G.fy1 - (xa - x))}L${r(xb)} ${r(G.fy1 - (xb - x))}`);
  }
  const v0 = Math.min(varFrom, varTo), v1 = Math.max(varFrom, varTo);
  return g({name: `${P}panel`},
    // stand: two legs and a foot bar on the floor
    h('path', {d: `M${r(lx[0])} ${r(G.fy1)}L${r(lx[0] - PH * 0.06)} ${r(G.floorY)}M${r(lx[1])} ${r(G.fy1)}L${r(lx[1] + PH * 0.06)} ${r(G.floorY)}`, stroke: th.woodDark, 'stroke-width': r(legW), 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(lx[0] - PH * 0.16, G.floorY - PH * 0.05, lx[1] - lx[0] + PH * 0.32, PH * 0.05, 3), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    // frame + rail
    h('path', {d: roundRectPath(G.frame.x, G.frame.y, G.frame.w, G.frame.h, Math.max(4, PH * 0.03)), fill: th.wood, stroke: th.ink, 'stroke-width': 2.5}),
    // the rail's siding: a bracket arm holds it out past the frame's left edge
    h('path', {d: `M${r(G.frame.x)} ${r(G.fy0 + PH * 0.12)}L${r(G.railX0 + PH * 0.1)} ${r(G.railTop + RIG.rail * PH)}`, stroke: th.metalDark, 'stroke-width': r(Math.max(5, PH * 0.035)), 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(G.railX0, G.railTop, G.frame.x + G.frame.w + PH * 0.02 - G.railX0, RIG.rail * PH + 2, 3), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: roundRectPath(G.railX0 - 3, G.railTop - PH * 0.04, PH * 0.05, RIG.rail * PH + PH * 0.04 + 2, 2), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: ticks.join(''), stroke: th.metalDark, 'stroke-width': 2}),
    h('defs', null,
      h('clipPath', {id: clip}, h('rect', {x: r(G.fx0), y: r(G.fy0), width: r(G.fw), height: r(PH)})),
      h('clipPath', {id: vclip}, h('rect', {name: `${P}varclip`, x: r(G.x(v0)), y: r(G.fy0), width: r(G.x(v1) - G.x(v0)), height: r(PH)}))),
    h('rect', {x: r(G.fx0), y: r(G.fy0), width: r(G.fw), height: r(PH), fill: FACE, stroke: 'none'}),
    g({'clip-path': `url(#${clip})`},
      h('path', {name: `${P}mark`, d: markD(G, level), fill: MARK, stroke: MARK_EDGE, 'stroke-width': Math.max(2.5, PH * 0.018), 'stroke-linejoin': 'round', opacity: 0.82}),
      g({name: `${P}stripes`, opacity: 0, 'clip-path': `url(#${vclip})`}, h('path', {d: stripes.join(''), stroke: th.accent2, 'stroke-width': Math.max(3, PH * 0.02), opacity: 0.55}))),
    h('path', {d: grid.join(''), stroke: th.paperLine, 'stroke-width': 1.5, opacity: 0.8}),
    h('rect', {x: r(G.fx0), y: r(G.fy0), width: r(G.fw), height: r(PH), fill: 'none', stroke: th.ink, 'stroke-width': 2}),
  );
}

/** Solid ● (prior condition) / ◆ (later change) glyph of identical weight. Centre (cx, cy), size s. */
export function sideMark(ctx, {cx, cy, s, side}) {
  const th = ctx.theme;
  if (side === 'after') return h('path', {d: `M${r(cx)} ${r(cy - s / 2)}L${r(cx + s / 2)} ${r(cy)}L${r(cx)} ${r(cy + s / 2)}L${r(cx - s / 2)} ${r(cy)}Z`, fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
  return h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.42), fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
}

/**
 * A flag standing in the rail at x = 0 (local origin = the rail top): a stem, a
 * ● / ◆ head and a solid edge line down the face (named `${name}-edge`, drawn by
 * edgeD(G, f), f = 0..1). Both flags have identical stroke weights.
 */
export function flagArt(ctx, {name, G, side}) {
  const th = ctx.theme;
  const stem = (side === 'before' || G.low ? RIG.stemA : RIG.stemB) * G.PH;
  const s = G.headS;
  const edgeL = G.fy1 - G.railTop;
  return g({name},
    h('path', {name: `${name}-edge`, d: 'M0 0V0', stroke: th.ink, 'stroke-width': Math.max(3.5, G.PH * 0.022), 'stroke-linecap': 'round', opacity: 0}),
    h('path', {d: `M0 2V${r(-stem)}`, stroke: th.ink, 'stroke-width': Math.max(3.5, G.PH * 0.022), 'stroke-linecap': 'round'}),
    h('rect', {x: r(-G.PH * 0.035), y: -4, width: r(G.PH * 0.07), height: 8, rx: 2, fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    // (side 'plain': a neutral metal knob — the flag carries no ●/◆ meaning by itself)
    g({name: `${name}-head`}, side === 'plain' ? h('circle', {cx: 0, cy: r(-stem - s * 0.5), r: r(s * 0.36), fill: th.metal, stroke: th.ink, 'stroke-width': 2}) : sideMark(ctx, {cx: 0, cy: -stem - s * 0.5, s, side})),
  );
}

/** Path of a flag's edge line drawn to fraction f (0..1) of the face. */
export const edgeD = (G, f) => `M0 0V${r((G.fy1 - G.railTop) * clamp(f))}`;

/** Floor slab from x0 to x1 at floorY. */
export function floorArt(ctx, {name, x0, x1, floorY, t = 16}) {
  const th = ctx.theme;
  return g({name}, h('rect', {x: r(x0), y: r(floorY), width: r(x1 - x0), height: t, rx: 4, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}));
}

/** Mini panel (static), local origin = bottom centre, height s (icons and thumbnails). */
export function miniPanel(ctx, {s, level, side}) {
  const th = ctx.theme;
  const w = s * 1.25, hh = s * 0.82;
  const x0 = -w / 2, y0 = -hh;
  const cell = w / COLS;
  const xe = x0 + cell * clamp(level, 0, COLS);
  return g(null,
    h('rect', {x: r(x0), y: r(y0), width: r(w), height: r(hh), fill: FACE, stroke: th.ink, 'stroke-width': 1.6}),
    level > 0 ? h('rect', {x: r(x0 + 1), y: r(y0 + 1), width: r(xe - x0 - 1), height: r(hh - 2), fill: MARK, opacity: 0.85}) : null,
    side ? h('path', {d: `M${r(xe)} ${r(y0 - s * 0.08)}V${r(0)}`, stroke: th.ink, 'stroke-width': 2}) : null,
  );
}

/* ------------------------------------------------------------------------ */
/* Mini rig and the variation piece (mechanism / contrast / inspect)         */
/* ------------------------------------------------------------------------ */

/** Width of a mini rig relative to its height. */
export const MINI_W = 0.82;

/**
 * Geometry of a mini rig of height H (local origin = bottom centre, up negative): face box, level lines, the flag head
 * height, and the spot (the middle of the variation strip).
 */
export function miniRigGeom(H, M) {
  const fh = H * 0.6, fw = fh * 1.15;
  const fy1 = -H * 0.14, fy0 = fy1 - fh;
  const fx0 = -fw / 2, fx1 = fw / 2;
  const cell = fw / COLS;
  const b = H * 0.04;
  const railTop = fy0 - b - H * 0.045;
  const headS = H * 0.11;
  const x = lv => fx0 + clamp(lv, 0, COLS) * cell;
  // (the flag head's top reaches ~1.04 H above the base: the entries' element boxes include it)
  return {H, W: MINI_W * H, fw, fh, fx0, fx1, fy0, fy1, cell, b, railTop, headS, headY: railTop - H * 0.1 - headS / 2, x,
    PH: fh, floorY: 0, spot: {x: (x(M.L0) + x(M.L1)) / 2, y: (fy0 + fy1) / 2}};
}

/**
 * A mini rig (static): stand, frame, face with its grid, the mark at the supplied level of `side` (before → initial,
 * after → later), a rail with the side's flag (● / ◆, identical weight) and its solid edge line. The later rig also
 * shows soft stripes on the strip between the two levels. Local origin = bottom centre.
 */
export function miniRig(ctx, {name, H, M, side}) {
  const th = ctx.theme;
  const G = miniRigGeom(H, M);
  const lv = side === 'after' ? M.L1 : M.L0;
  const gm = {fx0: G.fx0, fy0: G.fy0, fy1: G.fy1, cell: G.cell, x: G.x};
  const clip = ctx.id(`${name || 'mr'}-${side}-${Math.round(H)}-face`);
  const grid = [];
  for (let k = 1; k < COLS; k++) grid.push(`M${r(G.x(k))} ${r(G.fy0)}V${r(G.fy1)}`);
  for (let k = 1; k < 4; k++) grid.push(`M${r(G.fx0)} ${r(G.fy0 + (k * G.fh) / 4)}H${r(G.fx1)}`);
  const v0 = G.x(Math.min(M.L0, M.L1)), v1 = G.x(Math.max(M.L0, M.L1));
  const stripes = [];
  if (side === 'after' && v1 - v0 > 1) {
    for (let x = v0 - G.fh; x < v1; x += G.fh * 0.12) {
      const xa = Math.max(x, v0), xb = Math.min(x + G.fh, v1);
      if (xb - xa < 1) continue;
      stripes.push(`M${r(xa)} ${r(G.fy1 - (xa - x))}L${r(xb)} ${r(G.fy1 - (xb - x))}`);
    }
  }
  const xl = G.x(lv);
  const lw = Math.max(3, H * 0.014);
  return g({name},
    h('path', {d: `M${r(-G.fw * 0.3)} ${r(G.fy1)}L${r(-G.fw * 0.34)} 0M${r(G.fw * 0.3)} ${r(G.fy1)}L${r(G.fw * 0.34)} 0`, stroke: th.woodDark, 'stroke-width': r(Math.max(5, H * 0.03)), 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(G.fx0 - G.b, G.fy0 - G.b, G.fw + 2 * G.b, G.fh + 2 * G.b, 4), fill: th.wood, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: roundRectPath(G.fx0 - G.b - 2, G.railTop, G.fw + 2 * G.b + 4, G.H * 0.045 + 2, 3), fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    h('defs', null, h('clipPath', {id: clip}, h('rect', {x: r(G.fx0), y: r(G.fy0), width: r(G.fw), height: r(G.fh)}))),
    h('rect', {x: r(G.fx0), y: r(G.fy0), width: r(G.fw), height: r(G.fh), fill: FACE}),
    g({'clip-path': `url(#${clip})`},
      h('path', {d: markD({...gm, fx0: G.fx0, x: G.x, fy0: G.fy0, fy1: G.fy1, cell: G.cell}, lv), fill: MARK, stroke: MARK_EDGE, 'stroke-width': Math.max(2.5, H * 0.012), opacity: 0.82}),
      stripes.length ? h('path', {d: stripes.join(''), stroke: th.accent2, 'stroke-width': Math.max(3, H * 0.014), opacity: 0.55}) : null),
    h('path', {d: grid.join(''), stroke: th.paperLine, 'stroke-width': 1.5, opacity: 0.8}),
    h('rect', {x: r(G.fx0), y: r(G.fy0), width: r(G.fw), height: r(G.fh), fill: 'none', stroke: th.ink, 'stroke-width': 2}),
    // the side's flag and its edge line (identical weight on both sides)
    g({name: name ? `${name}-flag` : undefined},
      h('path', {d: `M${r(xl)} ${r(G.headY + G.headS / 2)}V${r(G.fy1)}`, stroke: th.ink, 'stroke-width': lw, 'stroke-linecap': 'round'}),
      sideMark(ctx, {cx: xl, cy: G.headY, s: G.headS, side})),
  );
}

/**
 * The variation piece: the strip of the face between the two supplied levels, lifted out and drawn on a card of size
 * 2R × 2R centred at (0, 0) — face colour, the mark, soft stripes, a solid ● edge (initial level) and a solid ◆ edge
 * (later level), each with its glyph. A placeholder on the illustrative scale, never a measure.
 */
export function variationPiece(ctx, {R, M, H}) {
  const th = ctx.theme;
  const G = miniRigGeom(H, M);
  const n = Math.abs(M.L1 - M.L0);
  const sw0 = Math.max(G.cell * 0.5, n * G.cell), sh0 = G.fh;
  const Z = Math.min((2 * R * 0.62) / sw0, (2 * R * 0.66) / sh0);
  const sw = sw0 * Z, sh = sh0 * Z;
  const x0 = -sw / 2, y0 = -sh / 2 + R * 0.12;
  const st = [];
  for (let x = x0 - sh; x < x0 + sw; x += sh * 0.14) {
    const xa = Math.max(x, x0), xb = Math.min(x + sh, x0 + sw);
    if (xb - xa < 1) continue;
    st.push(`M${r(xa)} ${r(y0 + sh - (xa - x))}L${r(xb)} ${r(y0 + sh - (xb - x))}`);
  }
  const lw = Math.max(3.5, R * 0.03);
  const hs = R * 0.2;
  const gl = (x, side) => g(null,
    h('path', {d: `M${r(x)} ${r(y0 - hs * 0.5)}V${r(y0 + sh)}`, stroke: th.ink, 'stroke-width': lw, 'stroke-linecap': 'round'}),
    sideMark(ctx, {cx: x, cy: y0 - hs * 0.5 - hs * 0.55, s: hs, side}));
  const lo = M.L1 >= M.L0;
  return g(null,
    h('path', {d: roundRectPath(-R, -R, 2 * R, 2 * R, R * 0.12), fill: th.card, stroke: th.accent2, 'stroke-width': 4}),
    h('rect', {x: r(x0), y: r(y0), width: r(sw), height: r(sh), fill: n ? MARK : FACE, opacity: n ? 0.82 : 1}),
    h('path', {d: st.join(''), stroke: th.accent2, 'stroke-width': Math.max(3, R * 0.025), opacity: 0.55}),
    h('rect', {x: r(x0), y: r(y0), width: r(sw), height: r(sh), fill: 'none', stroke: th.ink, 'stroke-width': 2}),
    gl(lo ? x0 : x0 + sw, 'before'),
    gl(lo ? x0 + sw : x0, 'after'),
  );
}

/* ------------------------------------------------------------------------ */
/* Icons                                                                    */
/* ------------------------------------------------------------------------ */

/** Two linked rings (a link note); dashed ring + "?" when disputed — neutral colours. */
export function linkIcon(ctx, {cx, cy, s, disputed}) {
  const th = ctx.theme;
  const R = s * 0.42;
  const col = disputed ? th.inkSoft : th.accent4;
  return g(null,
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: th.card, stroke: col, 'stroke-width': 3, 'stroke-dasharray': disputed ? '5 4' : null}),
    disputed
      ? h('path', {d: `M${r(cx - R * 0.3)} ${r(cy - R * 0.3)}Q${r(cx - R * 0.3)} ${r(cy - R * 0.62)} ${r(cx)} ${r(cy - R * 0.62)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.62)} ${r(cx + R * 0.32)} ${r(cy - R * 0.3)}Q${r(cx + R * 0.32)} ${r(cy - R * 0.05)} ${r(cx)} ${r(cy + R * 0.05)}V${r(cy + R * 0.22)}M${r(cx)} ${r(cy + R * 0.45)}V${r(cy + R * 0.5)}`, fill: 'none', stroke: col, 'stroke-width': 2.6, 'stroke-linecap': 'round'})
      : g(null,
        h('ellipse', {cx: r(cx - R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4}),
        h('ellipse', {cx: r(cx + R * 0.22), cy: r(cy), rx: r(R * 0.42), ry: r(R * 0.26), fill: 'none', stroke: col, 'stroke-width': 2.4})),
  );
}

/** Icon for a chip / record row. Kinds: initial, later, variation, alt, link, record, panel, flag, scale. */
export function agIcon(ctx, it, x, cy, s) {
  const th = ctx.theme;
  switch (it.icon) {
    case 'initial': case 'later': return g(null,
      sideMark(ctx, {cx: x + s * 0.16, cy: cy - s * 0.22, s: s * 0.3, side: it.icon === 'initial' ? 'before' : 'after'}),
      g({transform: T(x + s * 0.6, cy + s * 0.4)}, miniPanel(ctx, {s: s * 0.62, level: it.level ?? (it.icon === 'initial' ? 2 : 5), side: it.icon})));
    case 'variation': return g(null,
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy - s * 0.4)}V${r(cy - s * 0.5)}H${r(x + s * 0.8)}V${r(cy - s * 0.4)}`, fill: 'none', stroke: th.accent2, 'stroke-width': 3.2, 'stroke-linejoin': 'round'}),
      sideMark(ctx, {cx: x + s * 0.3, cy: cy - s * 0.18, s: s * 0.26, side: 'before'}),
      sideMark(ctx, {cx: x + s * 0.8, cy: cy - s * 0.18, s: s * 0.26, side: 'after'}),
      h('path', {d: roundRectPath(x + s * 0.1, cy + s * 0.05, s * 0.85, s * 0.38, 2), fill: FACE, stroke: th.ink, 'stroke-width': 1.5}),
      h('path', {d: roundRectPath(x + s * 0.3, cy + s * 0.07, s * 0.5, s * 0.34, 1), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 1.5}));
    case 'alt': return g({transform: T(x + s / 2, cy + s * 0.45)}, barrierArt(ctx, {name: `agalt-${it.key}-${Math.round(s)}`, w: s * 0.95, h: s * 0.9}));
    case 'link': return linkIcon(ctx, {cx: x + s / 2, cy, s, disputed: it.disputed});
    case 'record': return g(null,
      h('path', {d: roundRectPath(x + s * 0.18, cy - s * 0.42, s * 0.64, s * 0.84, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy - s * 0.18)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy + s * 0.18)}H${r(x + s * 0.6)}`, stroke: th.paperLine, 'stroke-width': 3}));
    case 'panel': return g({transform: T(x + s / 2, cy + s * 0.4)}, miniPanel(ctx, {s: s * 0.7, level: 3}));
    case 'flag': return g(null,
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy + s * 0.45)}V${r(cy - s * 0.05)}M${r(x + s * 0.72)} ${r(cy + s * 0.45)}V${r(cy - s * 0.25)}`, stroke: th.ink, 'stroke-width': 2.5}),
      sideMark(ctx, {cx: x + s * 0.3, cy: cy - s * 0.17, s: s * 0.26, side: 'before'}),
      sideMark(ctx, {cx: x + s * 0.72, cy: cy - s * 0.38, s: s * 0.26, side: 'after'}));
    case 'scale': return g(null,
      h('path', {d: roundRectPath(x + s * 0.08, cy - s * 0.12, s * 0.84, s * 0.24, 3), fill: th.metal, stroke: th.ink, 'stroke-width': 1.5}),
      h('path', {d: [0, 1, 2, 3, 4].map(k => `M${r(x + s * (0.16 + k * 0.17))} ${r(cy - s * 0.12)}v${r(s * 0.12)}`).join(''), stroke: th.ink, 'stroke-width': 1.5}));
    default: return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Chips, flowRows and the record sheet (copied from kits/perdida-economica.js) */
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
  let bw = mw;
  const text = unwidow(gp(it.text), t0 => { bw = balancedG(ctx, t0, {maxWidth: mw, size, maxLines}); return chipG(ctx, t0, {x: 0, y: 0, maxWidth: bw, size, maxLines}).fit; });
  bw = balancedG(ctx, text, {maxWidth: mw, size, maxLines});
  const probe = chipG(ctx, text, {x: 0, y: 0, maxWidth: bw, size, maxLines});
  const hh = Math.max(probe.box.h, iconS);
  const w = iw + probe.box.w;
  return {
    w, h: hh, bad: probe.fit.truncated || probe.fit.broken, lines: probe.fit.lines.length,
    build(x, y, name, style = {}) {
      const c = chipG(ctx, text, {x: x + iw, y: y + (hh - probe.box.h) / 2, maxWidth: bw, size, maxLines, fill: style.fill ?? th.card, stroke: style.stroke ?? th.inkSoft, dash: style.dash, textName: style.textName});
      const icon = it.icon ? agIcon(ctx, it, x, y + hh / 2, iconS) : null;
      return {node: g({name, opacity: style.opacity ?? 0}, icon, c.node), box: {x, y, w, h: hh}, chip: c.box};
    },
  };
}

/** Flow measured items into rows (left → right, wrapping; optionally centred). */
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

/**
 * Measure the record sheet. Rows: {key, icon, text, level?, highlight?}. Text
 * rows use fitG (glue-aware, never breaks a word); with labels hidden each row
 * shows simulated writing bars (a prop, not supplied text).
 */
export function recordMeasure(ctx, o) {
  const size = o.size;
  const pad = Math.max(14, size * 0.7);
  const iconS = size * 1.9;
  const textW = o.w - 2 * pad - iconS - 12;
  const noHead = o.header === null;
  const ho = {maxWidth: o.w - 2 * pad, size, minSize: size, maxLines: 2, weight: 700};
  const headFit = o.text && !noHead ? fitG(ctx, unwidow(gp(o.header), t0 => fitG(ctx, t0, ho)), ho) : null;
  const headH = noHead ? size * 0.3 : o.text ? headFit.height + size * 0.6 : size * 1.4;
  const rows = o.rows.map(rw => {
    if (!o.text) return {...rw, fit: null, h: Math.max(iconS, size * 1.5) + size * 0.5};
    const fo = {maxWidth: textW, size, minSize: size, maxLines: rw.maxLines ?? o.maxLines ?? 3, weight: rw.weight ?? 600};
    const fit = fitG(ctx, unwidow(gp(rw.text), t0 => fitG(ctx, t0, fo)), fo);
    return {...rw, fit, h: Math.max(iconS, fit.height) + size * 0.5};
  });
  const bad = (headFit && (headFit.truncated || headFit.broken)) || rows.some(rw => rw.fit && (rw.fit.truncated || rw.fit.broken));
  const clipH = Math.max(18, size * 0.9);
  const h0 = clipH * 0.5 + pad * 0.6 + headH + rows.reduce((s, rw) => s + rw.h, 0) + pad * 0.6;
  return {size, pad, iconS, textW, headFit, headH, rows, bad, h: h0, w: o.w, clipH, noHead};
}

/**
 * Build the record from a measurement at (x, y) (y = top of the clipboard).
 * Named nodes: `${prefix}` (whole), `${prefix}-row-${key}`, `${prefix}-txt-${key}`,
 * `${prefix}-hl-${key}` (row highlight, for rows marked `highlight`).
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
    const icon = agIcon(ctx, rw, x + pad, icy, iconS);
    let textNode = null;
    let lines = [];
    if (rw.fit) {
      const ty = top + (rw.h - size * 0.5 - rw.fit.height) / 2 + size * 0.05;
      lines = rw.fit.lines.map((ln, li) => ({x: tx, y: ty + li * rw.fit.lineHeight, w: ctx.measure(ln.replace(/\u00a0/g, ' '), rw.fit.size, rw.fit.weight, rw.fit.family), h: rw.fit.size}));
      textNode = textBlock(rw.fit, {x: tx, y: ty, fill: th.ink, name: `${P}-txt-${rw.key}`});
    } else {
      const bw = m.textW;
      lines = [0, 1].map(li => ({x: tx, y: top + rw.h * 0.28 + li * size * 0.75, w: bw * (li ? 0.55 : 0.85), h: size * 0.4}));
      textNode = g(null, lines.map(ln => h('path', {d: `M${r(ln.x)} ${r(ln.y + size * 0.2)}H${r(ln.x + ln.w)}`, stroke: th.inkSoft, 'stroke-width': r(size * 0.28), 'stroke-linecap': 'round', opacity: 0.6})));
    }
    const hl = rw.highlight ? h('path', {name: `${P}-hl-${rw.key}`, d: roundRectPath(x + pad * 0.25, top + size * 0.05, w - pad * 0.5, rw.h - size * 0.4, 6), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2, opacity: 0}) : null;
    rowNodes.push(g({name: `${P}-row-${rw.key}`}, hl, g({name: `${P}-icon-${rw.key}`}, icon), textNode));
    const box = {x: x + pad * 0.5, y: top, w: w - pad, h: rw.h};
    out.push({key: rw.key, box, lines, iconBox: {x: x + pad, y: icy - iconS / 2, w: iconS, h: iconS}});
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

/* ------------------------------------------------------------------------ */
/* Spanish defaults                                                         */
/* ------------------------------------------------------------------------ */

/** Shared English defaults of the fictional content (object, entries, variation, levels). */
export const AG_DEFAULTS = {
  object: {name: 'Object A (fictional panel)'},
  events: [
    {label: 'Object A inspected: prior condition noted', time: 'Visit 1', stage: 'initial'},
    {label: 'Photo of the surface added to the file', time: 'Visit 1', stage: 'initial'},
    {label: 'Object A inspected again: later change noted', time: 'Visit 2', stage: 'later'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Variation as supplied'}],
  levels: {initial: 2, later: 5},
};

/** Shared Spanish versions of the default fictional content. */
export const AG_ES_DEFAULTS = {
  object: {name: 'Objeto A (panel ficticio)'},
  events: [
    {label: 'Objeto A revisado: consta la condición previa', time: 'Visita 1', stage: 'initial'},
    {label: 'Foto de la superficie añadida al expediente', time: 'Visita 1', stage: 'initial'},
    {label: 'Objeto A revisado de nuevo: consta el cambio posterior', time: 'Visita 2', stage: 'later'},
  ],
  losses: [{label: 'Variación según lo aportado'}],
};

/**
 * Wrap a scene so that, with locale "es", every top-level param still equal to the English default is replaced by its
 * Spanish default (the author's own values are never touched). The replacement is a view of the context: layout, build
 * and frame all see the same localised params.
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
    for (const [k, v] of Object.entries(es)) if (k in defaults && same(p[k], defaults[k])) { q[k] = v; changed = true; }
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

export {shade};
