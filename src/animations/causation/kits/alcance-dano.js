/**
 * Motif kit for "Alcance del daño" (LAW-0709..0712): a fictional EVENT (Event A,
 * a generic object event) stands at the centre of a round ground plate; the
 * SUPPLIED consequences (generic fictional objects, "Consequence 1 (supplied)",
 * …) stand around it. Two RINGS are only a SUPPLIED GROUPING of those
 * consequences: the inner ring holds the ones supplied as "Immediate
 * consequence (as supplied)", the outer ring the ones supplied as "Subsequent
 * consequence (as supplied) — to be examined". The grouping is shown, never
 * tested, valued or decided.
 *
 * Original vector art (oblique top view):
 *  - The PLATE: an elliptical ground plate (ry = K · rx) with a visible rim.
 *  - The EVENT: a round pad with a tipped crate on it, at the plate's centre.
 *  - The ITEMS: generic fictional objects (crate, jar, drum, book stack, vase,
 *    pot — by index), all the same size and weight; no person, no injury.
 *  - The RINGS: two solid rope rings on the plate, IDENTICAL stroke, colour and
 *    weight (neutral blue accent2 over an ink outline): ● marks the inner ring,
 *    ◆ the outer ring, each on a post of identical height and weight standing
 *    on its ring's right-hand rim. Neither ring is dashed, faded, red, struck or
 *    hatched: the outer ring is only "to be examined", in words, never by look.
 *
 * Copied, not imported, from kits/agravacion-dano.js (chips, flowRows, the record
 * sheet, unwidow, gp, localizeScene, sideMark, linkIcon); read-only imports of
 * the low-level text helpers and connector art (kits/prueba-contrafactual.js,
 * kits/dano-material.js, kits/causal-chain.js), as the earlier causation kits do.
 * The kit owns geometry, art and text measurement; each entry owns its timeline,
 * layout and semantics.
 * @module animations/causation/kits/alcance-dano
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {str, oneOf, list, obj, int} from '../../../schemas/fields.js';
import {fitG, chipG, balancedG} from './prueba-contrafactual.js';
import {barrierArt as barrierArt0} from './causal-chain.js';
import {linkArt as linkArt0, tracerArt, boxExit, boxesMeet} from './dano-material.js';

export {fitG, chipG, balancedG, tracerArt, boxExit, boxesMeet};
export {clamp, ease, lerp, r, seg};

// nothing in this motif uses the theme's red accent: shared connector / barrier art goes through a neutral context
const neutral = (ctx, accent) => { const c = Object.create(ctx); c.theme = {...ctx.theme, accent, accentSoft: ctx.theme.paperShade}; return c; };
/** Connector (kits/dano-material.js linkArt) in neutral ink for supplied links. */
export const linkArt = (ctx, o) => linkArt0(neutral(ctx, ctx.theme.ink), o);
const barrierArt = (ctx, o) => barrierArt0(neutral(ctx, ctx.theme.metalDark), o);

/* ------------------------------------------------------------------------ */
/* Schema fields shared by the four treatments                              */
/* ------------------------------------------------------------------------ */

export const adFields = {
  origin: obj('The fictional event at the centre (a generic object event; no person is ever drawn)', {
    name: str('Name of the event, e.g. "Event A (fictional)"', 48),
  }, ['name']),
  events: list('The supplied consequences, in the supplied order (fictional, generic objects or events; no person is injured). Each is placed in the ring it is SUPPLIED for: inner (immediate consequence as supplied) or outer (subsequent consequence as supplied, to be examined). The grouping is shown, never decided.', obj('Consequence', {
    label: str('Consequence text (fictional, descriptive)', 64),
    time: str('Optional fictional relative label, e.g. "Day 2" (shown as supplied; never a time limit)', 20),
    ring: oneOf('Supplied grouping: inner (immediate, as supplied) or outer (subsequent, as supplied, to be examined)', ['inner', 'outer']),
  }, ['label', 'ring']), 2, 6),
  causalLinks: list('Per-link data. Link i joins the event to consequence i. Links not listed are a sequence as supplied.', obj('Link', {
    from: int('Index (0-based) of the consequence the link reaches', 0, 5),
    kind: oneOf('sequence (default) or causal; a causal link is only named when supplied here', ['sequence', 'causal']),
    status: oneOf('proposed (put forward) or disputed (contested); never resolved', ['proposed', 'disputed']),
    label: str('Optional caption for this link', 48),
  }, ['from']), 0, 6),
  alternatives: list('Other accounts put forward by someone; drawn with a barrier icon, never decided', obj('Alternative', {
    label: str('Account put forward', 64),
    status: oneOf('Descriptive status', ['alleged', 'proposed']),
  }, ['label']), 0, 2),
  losses: list('The grouping as supplied: the first entry is how the supplied grouping is described (a placeholder, no amount or valuation); an optional second entry is a noted detail.', obj('Grouping', {
    label: str('Description of the supplied grouping (no valuation)', 72),
  }, ['label']), 1, 2),
};

export const AD_STRINGS = {
  en: {
    record: 'Record of Event A (as supplied)',
    inner: 'Immediate consequence (as supplied)',
    outer: 'Subsequent consequence (as supplied) — to be examined',
    innerRing: 'inner ring', outerRing: 'outer ring',
    inRing: 'in the inner ring', outRing: 'in the outer ring',
    alsoNoted: 'Also noted',
    other: 'Put forward', alleged: 'alleged', proposed: 'proposed', disputed: 'disputed',
    link: 'Link', kindCausal: 'causal (as supplied)', event: 'event',
    rings: 'Rings: a supplied grouping only (placeholder)',
    key: 'As supplied · no conclusion drawn',
  },
  es: {
    record: 'Registro del evento A (según lo aportado)',
    inner: 'Consecuencia inmediata (según lo aportado)',
    outer: 'Consecuencia ulterior (según lo aportado) — por examinar',
    innerRing: 'anillo interior', outerRing: 'anillo exterior',
    inRing: 'en el anillo interior', outRing: 'en el anillo exterior',
    alsoNoted: 'También consta',
    other: 'Planteado', alleged: 'alegado', proposed: 'propuesto', disputed: 'discutido',
    link: 'Enlace', kindCausal: 'causal (según lo aportado)', event: 'evento',
    rings: 'Anillos: solo una agrupación aportada (marcador)',
    key: 'Según lo aportado · sin conclusión',
  },
};

/** Keep short parentheticals ("(as supplied)") on one line: their inner spaces become U+00A0 (glue-aware fitting). */
export const gp = text => String(text ?? '').replace(/\(([^()]{1,34})\)/g, (m, q) => `(${q.replace(/ /g, ' ')})`);

/** Keep a number with its word ("Consequence 3", "Consecuencia 3"), "·" with the word before it and "— to be examined" whole. */
export const glueN = text => gp(String(text ?? '').replace(/([\p{L}:]+) (\d+)/gu, '$1\u00a0$2').replace(/ · /g, '\u00a0· ').replace(/ — (\p{L}+) (\p{L}+)( \p{L}+)?/gu, (m, a, b, c) => ` —\u00a0${a}\u00a0${b}${c ? `\u00a0${c.trim()}` : ''}`));

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
    const bad = lines.findIndex(l => !/[  ]/.test(l));
    if (bad < 0) return t;
    const parts = t.split(/([  ]+)/);
    const nWords = l => l.split(/[  ]+/).filter(Boolean).length;
    const k = lines.slice(0, bad).reduce((q, l) => q + nWords(l), 0);
    // glue the lone word to the previous line's last word, or — when that makes a group too wide to fit (broken) —
    // to the next line's first word
    const tryAt = idx => { if (idx < 1 || idx >= parts.length) return null; const q = parts.slice(); q[idx] = '\u00a0'; return q.join(''); };
    const cands = (bad > 0 ? [2 * k - 1, 2 * k + 2 * nWords(lines[bad]) - 1] : [2 * k + 1]).map(tryAt).filter(Boolean);
    if (!cands.length) return t;
    t = cands.find(c => !fitOf(c).broken) ?? cands[0];
  }
  return t;
}

/** Short supplied time label kept whole. */
export const nb = s => (String(s).length <= 16 ? String(s).replace(/ /g, ' ') : String(s));

/** Record / band text of a consequence. */
export function entryText(e) {
  return `${e.time ? `${nb(e.time)} · ` : ''}${e.label}`;
}

/** Normalize the motif data. */
export function resolveAD(p) {
  const n = p.events.length;
  const links = Array.from({length: n}, (_, i) => ({from: i, kind: 'sequence', status: 'proposed', label: ''}));
  for (const l of p.causalLinks || []) if (l.from < n) Object.assign(links[l.from], {kind: l.kind || 'sequence', status: l.status || 'proposed', label: l.label || ''});
  const alternatives = (p.alternatives || []).map(a => ({...a, status: a.status || 'alleged'}));
  const entries = p.events.map((e, i) => ({...e, i, ring: e.ring === 'outer' ? 'outer' : 'inner'}));
  const nIn = entries.filter(e => e.ring === 'inner').length;
  return {n, entries, links, alternatives, losses: p.losses, nIn, nOut: n - nIn};
}

/** Link notes for links that carry supplied data ("Link event → 2: …"). */
export function linkNotes(ctx, M) {
  const t = ctx.t;
  const out = [];
  M.links.forEach(l => {
    const bits = [l.kind === 'causal' ? t.kindCausal : null, l.status === 'disputed' ? t.disputed : null, l.label || null].filter(Boolean);
    if (!bits.length) return;
    out.push({key: `lk${l.from}`, icon: 'link', disputed: l.status === 'disputed', text: `${t.link} ${t.event} → ${l.from + 1}: ${bits.join(' · ')}`});
  });
  return out;
}

/** Band text of an alternative. */
export const altText = (ctx, a) => `${ctx.t.other}: ${a.label} (${a.status === 'alleged' ? ctx.t.alleged : ctx.t.proposed})`;

/** "Grouping as supplied — inner ring: 2 · outer ring: 1". */
export function groupingText(ctx, p, M, nIn = M.nIn, nOut = M.nOut) {
  return `${p.losses[0].label} — ${ctx.t.innerRing}: ${nIn} · ${ctx.t.outerRing}: ${nOut}`;
}

/* ------------------------------------------------------------------------ */
/* Field geometry                                                           */
/* ------------------------------------------------------------------------ */

/**
 * Proportions (× PH, the scale unit): plate x-radius RG, outer ring R2, inner ring R1, the radius where inner items
 * stand (RIN) and outer items stand (ROUT), the ellipse ratio K (ry = K · rx), plate thickness, item height, post
 * height and head size.
 */
export const FIELD = {K: 0.68, RG: 1.04, R2: 0.95, R1: 0.52, RIN: 0.34, ROUT: 0.74, plate: 0.07, item: 0.3, post: 0.62, head: 0.16, ev: 0.17, side: 0.03};
/** Angles (deg; 90 = front) where inner / outer items stand, in order of use. */
export const INNER_A = [180, 35, 140, 325, 220, 95];
export const OUTER_A = [180, 140, 220, 100, 260, 40, 320];

/** Field width / height (× PH). */
export const fieldW = () => 2 * FIELD.RG + 2 * FIELD.side;
export const fieldH = (K = FIELD.K) => FIELD.plate + FIELD.RG * K + fieldTop(K);
/** Height of the field's top above the plate centre (× PH): the posts with their heads, or back items. */
export const fieldTop = (K = FIELD.K) => Math.max(FIELD.post + FIELD.head + 0.02, FIELD.ROUT * K + FIELD.item + 0.02, FIELD.RG * K);

/**
 * Field geometry for scale PH, left edge at `left`, plate standing on floorY.
 * at(rr, deg) = a point on the plate at radius rr (x units) and angle deg; ring1 / ring2 radii R1 / R2; post bases at
 * the rings' right rim (postX1 / postX2, cy); headY = both post heads' centre height; bracketY above them.
 */
export function fieldGeom(left, floorY, PH, K = FIELD.K) {
  const F = {...FIELD, K};
  const RG = F.RG * PH, R1 = F.R1 * PH, R2 = F.R2 * PH;
  const cx = left + (F.side + F.RG) * PH;
  const cy = floorY - (F.plate + F.RG * F.K) * PH;
  const headS = F.head * PH;
  const headY = cy - F.post * PH - headS * 0.5;
  const at = (rr, deg) => ({x: cx + rr * Math.cos((deg * Math.PI) / 180), y: cy + rr * F.K * Math.sin((deg * Math.PI) / 180)});
  return {
    PH, cx, cy, K: F.K, RG, R1, R2, rIn: F.RIN * PH, rOut: F.ROUT * PH, itemS: F.item * PH, plateT: F.plate * PH, headS, headY,
    bracketY: headY - headS * 0.5 - 0.1 * PH,
    postX1: cx + R1, postX2: cx + R2, floorY, at,
    x0: left, x1: cx + RG + F.side * PH, top: cy - fieldTop(K) * PH,
    plateBox: {x: cx - RG, y: cy - RG * F.K, w: 2 * RG, h: 2 * RG * F.K + F.plate * PH},
  };
}

/** Item angles: inner / outer items take the next free angle of their list; `fixed` = {index: angle} reserves angles. */
export function itemPlaces(G, M, fixed = {}) {
  // (other items keep >= 45° from a reserved angle, so nothing stands in the reserved item's path)
  const used = Object.values(fixed);
  const far = a => used.every(b => { const d = Math.abs((((a - b) % 360) + 540) % 360 - 180); return d >= 45; });
  const ia = INNER_A.filter(far), oa = OUTER_A.filter(far);
  let ki = 0, ko = 0;
  return M.entries.map(e => {
    const inner = e.ring === 'inner';
    const deg = fixed[e.i] !== undefined ? fixed[e.i] : inner ? ia[ki++ % ia.length] : oa[ko++ % oa.length];
    const rr = inner ? G.rIn : G.rOut;
    return {i: e.i, ring: e.ring, deg, ...G.at(rr, deg)};
  });
}

/* ------------------------------------------------------------------------ */
/* Art                                                                      */
/* ------------------------------------------------------------------------ */

const PLATE = '#e7dfcf';
const PLATE_SIDE = '#c9bea8';
const PAD = '#b9b2a6';

/** Solid ● (inner ring) / ◆ (outer ring) glyph of identical weight. Centre (cx, cy), size s. */
export function sideMark(ctx, {cx, cy, s, side}) {
  const th = ctx.theme;
  if (side === 'after') return h('path', {d: `M${r(cx)} ${r(cy - s / 2)}L${r(cx + s / 2)} ${r(cy)}L${r(cx)} ${r(cy + s / 2)}L${r(cx - s / 2)} ${r(cy)}Z`, fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
  return h('circle', {cx: r(cx), cy: r(cy), r: r(s * 0.42), fill: th.accent2, stroke: th.ink, 'stroke-width': 2});
}

/**
 * A generic fictional object, local origin = bottom centre, height s (width ~0.85 s). Kinds by index: crate, jar, drum,
 * book stack, vase, pot. Neutral fills; nothing broken, burning or red.
 */
export function itemArt(ctx, {i, s}) {
  const th = ctx.theme;
  const w = s * 0.82;
  const sw = Math.max(1.6, s * 0.03);
  const k = ((i % 6) + 6) % 6;
  switch (k) {
    case 0: return g(null, // crate
      h('path', {d: roundRectPath(-w / 2, -s * 0.86, w, s * 0.86, s * 0.05), fill: th.wood, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.86)}L${r(-w * 0.3)} ${r(-s)}H${r(w * 0.7)}L${r(w / 2)} ${r(-s * 0.86)}Z`, fill: th.woodTop || shade(th.wood, 0.15), stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.43)}H${r(w / 2)}M${r(-w * 0.15)} ${r(-s * 0.86)}V0`, stroke: th.woodDark, 'stroke-width': sw}));
    case 1: return g(null, // jar
      h('path', {d: `M${r(-w * 0.32)} ${r(-s * 0.78)}Q${r(-w * 0.55)} ${r(-s * 0.6)} ${r(-w * 0.46)} ${r(-s * 0.08)}Q${r(-w * 0.44)} 0 ${r(-w * 0.3)} 0H${r(w * 0.3)}Q${r(w * 0.44)} 0 ${r(w * 0.46)} ${r(-s * 0.08)}Q${r(w * 0.55)} ${r(-s * 0.6)} ${r(w * 0.32)} ${r(-s * 0.78)}Z`, fill: th.accent3Soft, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-w * 0.34, -s, w * 0.68, s * 0.22, s * 0.04), fill: th.metal, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: roundRectPath(-w * 0.3, -s * 0.52, w * 0.6, s * 0.2, 2), fill: th.paper, stroke: th.inkSoft, 'stroke-width': Math.max(1.2, sw * 0.7)}));
    case 2: return g(null, // drum
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.9)}V${r(-s * 0.08)}A${r(w / 2)} ${r(s * 0.08)} 0 0 0 ${r(w / 2)} ${r(-s * 0.08)}V${r(-s * 0.9)}Z`, fill: th.accent4Soft, stroke: th.ink, 'stroke-width': sw}),
      h('ellipse', {cx: 0, cy: r(-s * 0.9), rx: r(w / 2), ry: r(s * 0.09), fill: shade(th.accent4Soft, 0.2), stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: `M${r(-w / 2)} ${r(-s * 0.36)}A${r(w / 2)} ${r(s * 0.08)} 0 0 0 ${r(w / 2)} ${r(-s * 0.36)}M${r(-w / 2)} ${r(-s * 0.62)}A${r(w / 2)} ${r(s * 0.08)} 0 0 0 ${r(w / 2)} ${r(-s * 0.62)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': sw}));
    case 3: return g(null, // book stack
      [0, 1, 2].map(j => h('path', {d: roundRectPath(-w / 2 + (j === 1 ? w * 0.06 : 0), -s * (0.32 * (j + 1)), w * (j === 1 ? 0.88 : 1), s * 0.3, s * 0.03), fill: [th.accent2Soft, th.accent3Soft, th.paperShade][j], stroke: th.ink, 'stroke-width': sw})),
      h('path', {d: `M${r(w * 0.34)} ${r(-s * 0.3)}V${r(-s * 0.04)}M${r(w * 0.3)} ${r(-s * 0.94)}V${r(-s * 0.68)}`, stroke: th.inkSoft, 'stroke-width': sw}));
    case 4: return g(null, // vase
      h('path', {d: `M${r(-w * 0.18)} ${r(-s)}H${r(w * 0.18)}Q${r(w * 0.12)} ${r(-s * 0.8)} ${r(w * 0.42)} ${r(-s * 0.5)}Q${r(w * 0.56)} ${r(-s * 0.2)} ${r(w * 0.24)} 0H${r(-w * 0.24)}Q${r(-w * 0.56)} ${r(-s * 0.2)} ${r(-w * 0.42)} ${r(-s * 0.5)}Q${r(-w * 0.12)} ${r(-s * 0.8)} ${r(-w * 0.18)} ${r(-s)}Z`, fill: th.accent2Soft, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: `M${r(-w * 0.36)} ${r(-s * 0.42)}Q0 ${r(-s * 0.34)} ${r(w * 0.36)} ${r(-s * 0.42)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': sw}));
    default: return g(null, // pot with a plant
      h('path', {d: `M${r(-w * 0.1)} ${r(-s * 0.5)}Q${r(-w * 0.45)} ${r(-s * 0.85)} ${r(-w * 0.2)} ${r(-s)}Q${r(-w * 0.05)} ${r(-s * 0.8)} 0 ${r(-s * 0.5)}Q${r(w * 0.1)} ${r(-s * 0.9)} ${r(w * 0.32)} ${r(-s * 0.95)}Q${r(w * 0.36)} ${r(-s * 0.7)} ${r(w * 0.1)} ${r(-s * 0.5)}Z`, fill: th.accent4Soft, stroke: th.accent4, 'stroke-width': sw}),
      h('path', {d: `M${r(-w * 0.42)} ${r(-s * 0.52)}H${r(w * 0.42)}L${r(w * 0.3)} 0H${r(-w * 0.3)}Z`, fill: th.wood, stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-w * 0.46)} ${r(-s * 0.6)}H${r(w * 0.46)}V${r(-s * 0.5)}H${r(-w * 0.46)}Z`, fill: th.woodDark, stroke: th.ink, 'stroke-width': sw}));
  }
}

/** The event: a round pad with a tipped crate, local origin = the pad's centre on the plate; scale s (= PH). */
export function eventArt(ctx, {s}) {
  const th = ctx.theme;
  const pr = FIELD.ev * s;
  const sw = Math.max(2, s * 0.012);
  const bw = s * 0.26, bh = s * 0.2;
  return g(null,
    h('ellipse', {cx: 0, cy: 0, rx: r(pr), ry: r(pr * FIELD.K), fill: PAD, stroke: th.ink, 'stroke-width': sw}),
    h('ellipse', {cx: 0, cy: r(-pr * 0.12), rx: r(pr * 0.82), ry: r(pr * FIELD.K * 0.78), fill: shade(PAD, 0.12), stroke: 'none'}),
    g({transform: T(s * 0.02, -s * 0.02, -16)},
      h('path', {d: roundRectPath(-bw / 2, -bh, bw, bh, s * 0.015), fill: th.metal, stroke: th.ink, 'stroke-width': sw}),
      h('path', {d: `M${r(-bw / 2)} ${r(-bh)}L${r(-bw * 0.3)} ${r(-bh - s * 0.07)}H${r(bw * 0.7)}L${r(bw / 2)} ${r(-bh)}Z`, fill: shade(th.metal, 0.18), stroke: th.ink, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-bw * 0.1)} ${r(-bh)}V0`, stroke: th.metalDark, 'stroke-width': sw})),
  );
}

/** Elliptical ring path centred at (cx, cy), x-radius R (rx = R, ry = K · R). */
export const ringD = (R, K = FIELD.K, cx = 0, cy = 0) => (R < 0.5 ? `M${r(cx)} ${r(cy)}Z` : `M${r(cx - R)} ${r(cy)}A${r(R)} ${r(R * K)} 0 1 0 ${r(cx + R)} ${r(cy)}A${r(R)} ${r(R * K)} 0 1 0 ${r(cx - R)} ${r(cy)}Z`);

/**
 * A ring (identical for both): an ink outline under a neutral accent2 rope, centred at (0, 0) with x-radius R. Paths
 * `${name}-o` / `${name}-i` (when named): the entry animates their `d` (ringD) to grow the ring at a constant stroke.
 */
export function ringArt(ctx, {name, R, K = FIELD.K, w = 7}) {
  const th = ctx.theme;
  return g({name},
    h('path', {name: name ? `${name}-o` : undefined, d: ringD(R, K), fill: 'none', stroke: th.ink, 'stroke-width': r(w + 4)}),
    h('path', {name: name ? `${name}-i` : undefined, d: ringD(R, K), fill: 'none', stroke: th.accent2, 'stroke-width': r(w)}));
}

/** A post with a ● / ◆ head (identical stem, head size and weight), local origin = its foot on the ring. */
export function postArt(ctx, {name, G, side, stem: stemF = FIELD.post}) {
  const th = ctx.theme;
  const stem = stemF * G.PH;
  const s = G.headS;
  const lw = Math.max(3.5, G.PH * 0.022);
  return g({name},
    h('ellipse', {cx: 0, cy: 0, rx: r(G.PH * 0.04), ry: r(G.PH * 0.04 * FIELD.K), fill: th.metalDark, stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: `M0 0V${r(-stem)}`, stroke: th.ink, 'stroke-width': r(lw), 'stroke-linecap': 'round'}),
    g({name: `${name}-head`}, sideMark(ctx, {cx: 0, cy: -stem - s * 0.5, s, side})),
  );
}

/** The plate (rim + top), centred at G.cx / G.cy. `hole`: radius of a hole (the outer annulus piece). */
export function plateArt(ctx, {name, G, hole = 0}) {
  const th = ctx.theme;
  const {cx, cy, RG, K, plateT} = G;
  const top = hole
    ? h('path', {d: `M${r(cx - RG)} ${r(cy)}A${r(RG)} ${r(RG * K)} 0 1 0 ${r(cx + RG)} ${r(cy)}A${r(RG)} ${r(RG * K)} 0 1 0 ${r(cx - RG)} ${r(cy)}ZM${r(cx - hole)} ${r(cy)}A${r(hole)} ${r(hole * K)} 0 1 1 ${r(cx + hole)} ${r(cy)}A${r(hole)} ${r(hole * K)} 0 1 1 ${r(cx - hole)} ${r(cy)}Z`, fill: PLATE, 'fill-rule': 'evenodd', stroke: th.ink, 'stroke-width': 2.5})
    : h('ellipse', {cx: r(cx), cy: r(cy), rx: r(RG), ry: r(RG * K), fill: PLATE, stroke: th.ink, 'stroke-width': 2.5});
  return g({name},
    h('path', {d: `M${r(cx - RG)} ${r(cy)}V${r(cy + plateT)}A${r(RG)} ${r(RG * K)} 0 0 0 ${r(cx + RG)} ${r(cy + plateT)}V${r(cy)}Z`, fill: PLATE_SIDE, stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    top,
    hole ? h('path', {d: `M${r(cx - hole)} ${r(cy)}A${r(hole)} ${r(hole * K)} 0 0 1 ${r(cx + hole)} ${r(cy)}`, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2}) : null,
  );
}

/** Floor slab from x0 to x1 at floorY. */
export function floorArt(ctx, {name, x0, x1, floorY, t = 16}) {
  const th = ctx.theme;
  return g({name}, h('rect', {x: r(x0), y: r(floorY), width: r(x1 - x0), height: t, rx: 4, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}));
}

/* ------------------------------------------------------------------------ */
/* Mini fields and the boundary piece (mechanism)                           */
/* ------------------------------------------------------------------------ */

/** Ellipse ratio of the mini fields (a steeper view, so each piece stands taller). */
export const K_MINI = 1;
/** Width of a mini field relative to its height. */
export const MINI_W = fieldW() / fieldH(K_MINI);

/** Geometry of a mini field of height H (local origin = bottom centre). */
export function miniGeom(H) {
  const PH = H / fieldH(K_MINI);
  return fieldGeom(-(fieldW() * PH) / 2, 0, PH, K_MINI);
}

/**
 * A mini field (static), local origin = bottom centre, height H. side 'before' = the inner piece: the plate, the event,
 * the inner ring with its ● post and the items supplied for it. side 'after' = the outer piece: the plate with the
 * inner disc taken out, the outer ring with its ◆ post and the items supplied for it. Same size and weight.
 */
export function miniField(ctx, {name, H, M, side}) {
  const G = miniGeom(H);
  const inner = side !== 'after';
  const places = itemPlaces(G, M).filter(q => (q.ring === 'inner') === inner).sort((a, b) => a.y - b.y);
  const R = inner ? G.R1 : G.R2;
  return g({name},
    plateArt(ctx, {G, hole: inner ? 0 : G.R1 * 0.96}),
    g({transform: T(G.cx, G.cy)}, ringArt(ctx, {R, K: G.K, w: Math.max(5, H * 0.025)})),
    inner ? g({transform: T(G.cx, G.cy)}, eventArt(ctx, {s: G.PH})) : null,
    places.map(q => g({transform: T(q.x, q.y)}, itemArt(ctx, {i: q.i, s: G.itemS}))),
    g({name: name ? `${name}-post` : undefined, transform: T(inner ? G.postX1 : G.postX2, G.cy)}, postArt(ctx, {name: name ? `${name}-pst` : 'pst', G, side: inner ? 'before' : 'after'})),
  );
}

/** Where a link to the outer piece lands: the inner rim of its annulus, upper left (local, bottom-centre origin). */
export function miniSpot(H) {
  const G = miniGeom(H);
  return G.at(G.R1 * 0.96, 235);
}

/**
 * The boundary piece: a radial cross-section from the event outwards on a card 2R × 2R centred at (0, 0) — the event's
 * pad at the left, the inner band, the inner ring (● on a post), the outer band, the outer ring (◆ on a post); one
 * item stands in each band that has one. A placeholder of the supplied grouping, never a measure.
 */
export function boundaryPiece(ctx, {R, M}) {
  const th = ctx.theme;
  const x0 = -R * 0.86, x1 = R * 0.86;
  const by = R * 0.42, bh = R * 0.2;
  const xr1 = lerp(x0, x1, 0.42), xr2 = lerp(x0, x1, 0.94);
  const lw = Math.max(3.5, R * 0.03);
  const hs = R * 0.2;
  const post = (x, side) => g(null,
    h('rect', {x: r(x - R * 0.035), y: r(by - bh * 0.1), width: r(R * 0.07), height: r(bh * 1.2), rx: 3, fill: th.accent2, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(x)} ${r(by - bh * 0.1)}V${r(-R * 0.42)}`, stroke: th.ink, 'stroke-width': lw, 'stroke-linecap': 'round'}),
    sideMark(ctx, {cx: x, cy: -R * 0.42 - hs * 0.55, s: hs, side}));
  const firstIn = M.entries.find(e => e.ring === 'inner'), firstOut = M.entries.find(e => e.ring === 'outer');
  return g(null,
    h('path', {d: roundRectPath(-R, -R, 2 * R, 2 * R, R * 0.12), fill: th.card, stroke: th.accent2, 'stroke-width': 4}),
    h('path', {d: roundRectPath(x0, by, x1 - x0, bh, 4), fill: PLATE, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(x0)} ${r(by + bh * 0.3)}h${r(R * 0.22)}`, stroke: PAD, 'stroke-width': r(bh * 0.5)}),
    h('path', {d: `M${r(x0)} ${r(by)}V${r(by + bh)}`, stroke: th.ink, 'stroke-width': 2}),
    firstIn ? g({transform: T(lerp(x0, xr1, 0.55), by + bh * 0.55)}, itemArt(ctx, {i: firstIn.i, s: R * 0.46})) : null,
    firstOut ? g({transform: T(lerp(xr1, xr2, 0.5), by + bh * 0.55)}, itemArt(ctx, {i: firstOut.i, s: R * 0.46})) : null,
    post(xr1, 'before'),
    post(xr2, 'after'),
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

/** Small concentric-rings icon with the ● / ◆ glyph of the given side (or both). */
function ringsIcon(ctx, x, cy, s, side) {
  const th = ctx.theme;
  const cx = x + s * 0.5;
  return g(null,
    h('ellipse', {cx: r(cx), cy: r(cy + s * 0.12), rx: r(s * 0.46), ry: r(s * 0.46 * FIELD.K), fill: PLATE, stroke: th.ink, 'stroke-width': 1.5}),
    h('ellipse', {cx: r(cx), cy: r(cy + s * 0.12), rx: r(s * 0.38), ry: r(s * 0.38 * FIELD.K), fill: 'none', stroke: th.accent2, 'stroke-width': side === 'after' || side === 'both' ? 3 : 1.5, opacity: side === 'before' ? 0.5 : 1}),
    h('ellipse', {cx: r(cx), cy: r(cy + s * 0.12), rx: r(s * 0.2), ry: r(s * 0.2 * FIELD.K), fill: 'none', stroke: th.accent2, 'stroke-width': side === 'before' || side === 'both' ? 3 : 1.5, opacity: side === 'after' ? 0.5 : 1}),
    side === 'both'
      ? g(null, sideMark(ctx, {cx: x + s * 0.2, cy: cy - s * 0.3, s: s * 0.26, side: 'before'}), sideMark(ctx, {cx: x + s * 0.8, cy: cy - s * 0.3, s: s * 0.26, side: 'after'}))
      : sideMark(ctx, {cx: x + s * 0.5, cy: cy - s * 0.3, s: s * 0.3, side}),
  );
}

/** Icon for a chip / record row. Kinds: inner, outer, item, grouping, alt, link, record, event, rings. */
export function adIcon(ctx, it, x, cy, s) {
  const th = ctx.theme;
  switch (it.icon) {
    case 'inner': return ringsIcon(ctx, x, cy, s, 'before');
    case 'outer': return ringsIcon(ctx, x, cy, s, 'after');
    case 'grouping': case 'rings': return ringsIcon(ctx, x, cy, s, 'both');
    case 'item': return g(null,
      g({transform: T(x + s * 0.42, cy + s * 0.44)}, itemArt(ctx, {i: it.item ?? 0, s: s * 0.78})),
      it.ring ? sideMark(ctx, {cx: x + s * 0.86, cy: cy - s * 0.34, s: s * 0.28, side: it.ring === 'outer' ? 'after' : 'before'}) : null);
    case 'alt': return g({transform: T(x + s / 2, cy + s * 0.45)}, barrierArt(ctx, {name: `adalt-${it.key}-${Math.round(s)}`, w: s * 0.95, h: s * 0.9}));
    case 'link': return linkIcon(ctx, {cx: x + s / 2, cy, s, disputed: it.disputed});
    case 'record': return g(null,
      h('path', {d: roundRectPath(x + s * 0.18, cy - s * 0.42, s * 0.64, s * 0.84, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2}),
      h('path', {d: `M${r(x + s * 0.3)} ${r(cy - s * 0.18)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy)}H${r(x + s * 0.7)}M${r(x + s * 0.3)} ${r(cy + s * 0.18)}H${r(x + s * 0.6)}`, stroke: th.paperLine, 'stroke-width': 3}));
    case 'event': return g({transform: T(x + s * 0.5, cy + s * 0.25)}, eventArt(ctx, {s: s * 1.5}));
    default: return null;
  }
}

/* ------------------------------------------------------------------------ */
/* Chips, flowRows and the record sheet (copied from kits/agravacion-dano.js) */
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
  // (each text is balanced and fitted once: the unwidow pass and the final measure share the results — same output)
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
  return {
    w, h: hh, bad: probe.fit.truncated || probe.fit.broken, lines: probe.fit.lines.length,
    build(x, y, name, style = {}) {
      const c = chipG(ctx, text, {x: x + iw, y: y + (hh - probe.box.h) / 2, maxWidth: bw, size, maxLines, fill: style.fill ?? th.card, stroke: style.stroke ?? th.inkSoft, dash: style.dash, textName: style.textName});
      const icon = it.icon ? adIcon(ctx, it, x, y + hh / 2, iconS) : null;
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
 * Measure the record sheet. Rows: {key, icon, text, item?, ring?, highlight?}. Text rows use fitG (glue-aware, never
 * breaks a word); with labels hidden each row shows simulated writing bars (a prop, not supplied text).
 */
export function recordMeasure(ctx, o) {
  const size = o.size;
  const pad = Math.max(14, size * 0.7);
  const iconS = size * 1.9;
  const textW = o.w - 2 * pad - iconS - 12;
  const noHead = o.header === null;
  const ho = {maxWidth: o.w - 2 * pad, size, minSize: size, maxLines: 2, weight: 700};
  const headFit = o.text && !noHead ? fitG(ctx, unwidow(glueN(o.header), t0 => fitG(ctx, t0, ho)), ho) : null;
  const headH = noHead ? size * 0.3 : o.text ? headFit.height + size * 0.6 : size * 1.4;
  const rows = o.rows.map(rw => {
    if (!o.text) return {...rw, fit: null, h: Math.max(iconS, size * 1.5) + size * 0.5};
    const fo = {maxWidth: textW, size, minSize: size, maxLines: rw.maxLines ?? o.maxLines ?? 3, weight: rw.weight ?? 600};
    const fit = fitG(ctx, unwidow(glueN(rw.text), t0 => fitG(ctx, t0, fo)), fo);
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
    const icon = adIcon(ctx, rw, x + pad, icy, iconS);
    let textNode = null;
    let lines = [];
    if (rw.fit) {
      const ty = top + (rw.h - size * 0.5 - rw.fit.height) / 2 + size * 0.05;
      lines = rw.fit.lines.map((ln, li) => ({x: tx, y: ty + li * rw.fit.lineHeight, w: ctx.measure(ln.replace(/ /g, ' '), rw.fit.size, rw.fit.weight, rw.fit.family), h: rw.fit.size}));
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

/** Record row of a consequence: its item's icon with the ●/◆ glyph of its supplied ring. */
export const entryRow = (e, extra = {}) => ({key: `ev${e.i}`, icon: 'item', item: e.i, ring: e.ring, text: entryText(e), ...extra});

/* ------------------------------------------------------------------------ */
/* Spanish defaults                                                         */
/* ------------------------------------------------------------------------ */

/** Shared English defaults of the fictional content (event, consequences, grouping). */
export const AD_DEFAULTS = {
  origin: {name: 'Event A (fictional)'},
  events: [
    {label: 'Consequence 1 (supplied): a crate is knocked over', ring: 'inner'},
    {label: 'Consequence 2 (supplied): a jar is cracked', ring: 'inner'},
    {label: 'Consequence 3 (supplied): a stored drum is moved', time: 'Day 2', ring: 'outer'},
  ],
  causalLinks: [],
  alternatives: [],
  losses: [{label: 'Grouping as supplied'}],
};

/** Shared Spanish versions of the default fictional content. */
export const AD_ES_DEFAULTS = {
  origin: {name: 'Evento A (ficticio)'},
  events: [
    {label: 'Consecuencia 1 (aportada): se vuelca una caja', ring: 'inner'},
    {label: 'Consecuencia 2 (aportada): se agrieta un tarro', ring: 'inner'},
    {label: 'Consecuencia 3 (aportada): se desplaza un bidón almacenado', time: 'Día 2', ring: 'outer'},
  ],
  losses: [{label: 'Agrupación según lo aportado'}],
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
