/**
 * Kit for the "Razonamiento circular" motif (LAW-0105..0108): field set,
 * strings, geometry and original vector parts. Each entry owns its own
 * timeline, composition and semantics; this file only measures and draws.
 *
 * Physical metaphor — LEANING CARDS ON A TABLE (side view against a wall)
 *  - CLAIM (afirmación) a stiff card standing on its edge with a blue header,
 *                       a speech-bubble glyph, the claim text as supplied and
 *                       a small portrait medallion of the fictional speaker it
 *                       is attributed to.
 *  - FACT / PREMISE     a card of the same kind with an ochre header and a
 *    (hecho)            page glyph. A card cannot stand upright by itself: it
 *                       LEANS on whatever supports it.
 *  - Cycle of claims    the claim and its premise lean on EACH OTHER: an
 *                       A-frame whose two tops touch. Nothing else holds them.
 *  - Independent        the premise leans on an OUTSIDE SUPPORT — an archive
 *    support            box standing on the table (its label is supplied) —
 *                       and the claim leans on the premise.
 *  - CONNECTOR          support lines drawn as ribbon arrows ABOVE the cards
 *    (conector)         (premise → claim). In the cycle the second arrow runs
 *                       from the claim back to its own premise, so the two
 *                       arcs close into a loop; in independent support the
 *                       chain ends on the box.
 *  - RULE (regla)       a slate plaque on the wall printing the rule text as
 *                       supplied (illustrative; the scene never applies it).
 *  - LUPA               a hand magnifier whose glass shows a real enlarged
 *                       copy of what lies under it.
 * The kit never labels an argument as fallacious, valid or invalid and never
 * shows a collapse, a winner or an outcome: both structures stand; only the
 * supplied structure of support is drawn. Texts are fictional, jurisdiction
 * unspecified, illustrative-unverified.
 * @module animations/reasoning/kits/razonamiento-circular
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, clamp} from '../../../core/time.js';
import {roundRectPath, catmullRom, polyline} from '../../../core/geometry.js';
import {fitDesign} from '../../../core/layout.js';
import {str, list, obj, party} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {actorLook} from '../../../primitives/people-style.js';
import {hairShape} from '../../../primitives/badges.js';

export const INK = '#1f2328';
const DEG = Math.PI / 180;

/* ------------------------------------------------------------------ */
/* Strings (built-in labels; user content is never translated)         */
/* ------------------------------------------------------------------ */
export const RC_STRINGS = {
  en: {
    claimKind: 'Claim',
    premiseKind: 'Premise',
    externalKind: 'External premise',
    supportKind: 'Outside support',
    ruleHead: 'Rule · as supplied',
    saidBy: 'said by',
    asSupplied: 'as supplied',
    noConclusion: 'As supplied · no conclusion drawn',
    loopKey: 'Support returns to its own premise',
    chainKey: 'Premise rests on an outside support',
    issue: 'Issue',
    assumed: 'Assumed',
    restsOn: 'Rests on',
    theClaim: 'the claim itself',
    analyst: 'Analyst',
    lupa: 'Magnifier',
    connector: 'Support line',
  },
  es: {
    claimKind: 'Afirmación',
    premiseKind: 'Premisa',
    externalKind: 'Premisa externa',
    supportKind: 'Apoyo externo',
    ruleHead: 'Regla · según lo aportado',
    saidBy: 'dicho por',
    asSupplied: 'según lo aportado',
    noConclusion: 'Según lo aportado · sin conclusión',
    loopKey: 'El apoyo vuelve a su propia premisa',
    chainKey: 'La premisa se apoya en un soporte externo',
    issue: 'Cuestión',
    assumed: 'Se asume',
    restsOn: 'Se apoya en',
    theClaim: 'la propia afirmación',
    analyst: 'Analista',
    lupa: 'Lupa',
    connector: 'Línea de apoyo',
  },
};

/* ------------------------------------------------------------------ */
/* Category fields (reasoning) as used by this motif                    */
/* ------------------------------------------------------------------ */

/** Fictional speaker the claim is attributed to (never assessed). */
export const speakerField = party;

export const claimField = str('Claim as supplied, attributed to the fictional speaker (illustrative text; the scene never assesses it)', 120);
export const rulesField = list('Rule text supplied by the author (illustrative, never a statement of law), printed on the wall plaque; the scene never applies it', str('Rule text', 120), 0, 1);
export const issuesField = list('Open question supplied by the author, pinned as a note (never answered by the animation)', str('Issue', 100), 0, 1);
export const assumptionsField = list('Working assumptions supplied by the author, printed in the footnote (not verified)', str('Assumption', 90), 0, 2);
export const supportLabelField = str('Outside support printed on the archive box label (a fictional record, as supplied)', 70);

/** Fictional default content (English). */
export const RC_DEFAULTS = {
  speaker: {name: 'Ines Vale', role: 'Club treasurer (fictional)'},
  claim: 'The club ledger is accurate',
  premise: 'The ledger itself states that its entries are accurate',
  external: 'Bank statement B-7 shows the same year-end total',
  supportLabel: 'Bank statement B-7 · outside record',
  rules: ['Club rule 9 (fictional text): the yearly report is based on the ledger'],
  issues: ['What does the claim rest on, apart from itself?'],
  assumptions: ['Statement B-7 is taken as supplied; nothing is verified here'],
};

/** Fictional default content (Spanish). */
export const RC_DEFAULTS_ES = {
  speaker: {name: 'Inés Vale', role: 'Tesorera del club (ficticia)'},
  claim: 'El libro de cuentas del club es exacto',
  premise: 'El propio libro afirma que sus asientos son exactos',
  external: 'El extracto bancario B-7 muestra el mismo total anual',
  supportLabel: 'Extracto bancario B-7 · registro externo',
  rules: ['Norma 9 del club (texto ficticio): el informe anual se basa en el libro'],
  issues: ['¿En qué se apoya la afirmación, aparte de sí misma?'],
  assumptions: ['El extracto B-7 se toma según lo aportado; aquí no se verifica nada'],
};

/* ------------------------------------------------------------------ */
/* Colours                                                              */
/* ------------------------------------------------------------------ */

/** Motif colours. Loop and chain lines use neutral hues (no red/green verdict colours). */
export function rcColors(ctx) {
  const th = ctx.theme;
  const mono = th.accent === '#3a3a3a';
  return {
    claim: th.accent2,
    premise: mono ? '#6e6e6e' : shade(th.accent3, -0.28),
    external: th.cloth[7] || th.accent4,
    loop: mono ? '#3c3c3c' : (th.cloth[3] || th.accent),
    chain: mono ? '#5c5c5c' : (th.cloth[5] || th.accent2),
    wall: '#ede6d8',
    wallDeep: '#e2d9c7',
    wallLine: '#d6cbb6',
    floor: '#d7ccb6',
    card: '#fffdf8',
    cardEdge: '#d9cfbd',
    box: '#c9a06a',
    boxDark: '#a57e4d',
    boxLid: '#d5ae78',
    slate: '#2f3b40',
    rule: mono ? '#4a4a4a' : '#3f4f57',
    slateFrame: '#8a6a45',
    brass: '#e8cf8f',
    note: '#fff4bf',
    ink: INK,
  };
}

/* ------------------------------------------------------------------ */
/* Scale helpers                                                         */
/* ------------------------------------------------------------------ */

/**
 * Rendered pixels per design unit in a 1080p frame (the harness measures text
 * in output pixels; 1080 = the short side of every standard ratio).
 */
export function px1080(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}

/** Axis-aligned box helpers. */
export const boxOf = (x, y, w, hh) => ({x, y, w, h: hh});
export function union(list) {
  const bs = list.filter(Boolean);
  if (!bs.length) return null;
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}
export function hit(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}
export const inflate = (b, p) => ({x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p});

/* ------------------------------------------------------------------ */
/* Board poses (side view)                                               */
/* ------------------------------------------------------------------ */

/**
 * Free pose of a board whose local origin is its bottom-left corner (the
 * board spans x∈[0,w], y∈[−h,0]): local anchor (ax,ay) placed at world
 * (wx,wy), rotated by `angle` degrees (SVG sense: + = clockwise).
 */
export function freePose(w, hh, ax, ay, wx, wy, angle) {
  const a = angle * DEG, c = Math.cos(a), s = Math.sin(a);
  const toWorld = p => ({x: wx + (p.x - ax) * c - (p.y - ay) * s, y: wy + (p.x - ax) * s + (p.y - ay) * c});
  const transform = `${T(wx, wy, angle)} translate(${r(-ax)} ${r(-ay)})`;
  const corners = {bl: toWorld({x: 0, y: 0}), br: toWorld({x: w, y: 0}), tl: toWorld({x: 0, y: -hh}), tr: toWorld({x: w, y: -hh})};
  return {angle, transform, toWorld, corners, w, h: hh};
}

/**
 * Board standing on a table at height `y` whose upright bottom-left corner is
 * at `footX`, leaning by `angle` degrees: + leans right (pivot on the
 * bottom-right corner), − leans left (pivot on the bottom-left corner).
 * Continuous through 0 (upright, both corners on the table).
 */
export function leanPose(w, hh, footX, y, angle) {
  return angle >= 0 ? freePose(w, hh, w, 0, footX + w, y, angle) : freePose(w, hh, 0, 0, footX, y, angle);
}

/** Point on segment a→b at height `yy` (linear), clamped to the segment. */
export function onEdgeAtY(a, b, yy) {
  const t = clamp((yy - a.y) / ((b.y - a.y) || 1e-9));
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, t};
}

/**
 * A-frame (cycle): premise on the left leaning right, claim on the right
 * leaning left; their top corners touch. Both boards have height hh.
 * @returns {{p:any, c:any, apex:{x:number,y:number}, footP:number, footC:number}}
 */
export function aFrame(wP, wC, hh, leftX, y, theta) {
  const footP = leftX;
  const pivotP = footP + wP;
  const pivotC = pivotP + 2 * hh * Math.sin(theta * DEG);
  const p = leanPose(wP, hh, footP, y, theta);
  const c = leanPose(wC, hh, pivotC, y, -theta);
  return {p, c, apex: p.corners.tr, footP, footC: pivotC};
}

/**
 * Chain (independent support): outside box on the left, premise leaning left
 * onto the box's top-right corner, claim leaning left onto the premise's right
 * edge. `boxRight` = x of the box's right face.
 */
export function chain(wP, hP, wC, hC, boxRight, boxH, y, theta) {
  const tn = Math.tan(theta * DEG);
  const footP = boxRight + boxH * tn; // P's left edge meets the box top corner
  const p = leanPose(wP, hP, footP, y, -theta);
  const q = onEdgeAtY(p.corners.br, p.corners.tr, y - hC * Math.cos(theta * DEG));
  const footC = q.x + hC * Math.sin(theta * DEG);
  const c = leanPose(wC, hC, footC, y, -theta);
  return {p, c, footP, footC, contact: q};
}

/**
 * Angle (deg, negative = leaning left) at which a board pivoting on its
 * bottom-left corner at footX touches segment a→b with its top-left corner.
 */
export function leanLeftOnto(hh, footX, y, a, b) {
  const f = ang => {
    const t = {x: footX - hh * Math.sin(ang * DEG), y: y - hh * Math.cos(ang * DEG)};
    const q = onEdgeAtY(a, b, t.y);
    return t.x - q.x; // > 0: corner right of the edge (not yet touching)
  };
  let lo = 0, hi = 60;
  if (f(lo) <= 0) return 0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  return -hi;
}

/** Angle (deg, positive = leaning right) at which a board pivoting on its bottom-right corner (x = pivotX) touches a vertical face at x = faceX at height faceH. */
export function leanRightOntoFace(pivotX, faceX, faceH) {
  return Math.atan2(faceX - pivotX, faceH) / DEG;
}

/* ------------------------------------------------------------------ */
/* Text measurement for cards                                           */
/* ------------------------------------------------------------------ */

/**
 * Words that still do not fit whole at `size` are split after their hyphens
 * ("Oyelaran-Castellanos" → "Oyelaran-" / "Castellanos"), so wrapping never
 * cuts inside a word. Such a word cannot share a line with its own halves.
 */
export function breakable(ctx, text, maxWidth, size, weight = 400, family = 'sans') {
  return String(text ?? '').replace(/\S+/g, wd => (wd.includes('-') && ctx.measure(wd, size, weight, family) > maxWidth ? wd.replace(/-(?=\S)/g, '- ') : wd));
}

/**
 * Syllable-style hyphenation for short generic labels (kind labels such as
 * "AFIRMACIÓN"): a word wider than `maxWidth` is split before a consonant that
 * starts a syllable (V|CV), with a visible hyphen, never at an arbitrary
 * letter. Words that fit are returned unchanged.
 */
export function hyphenateLabel(ctx, text, maxWidth, size, weight = 800, family = 'sans', spacing = 0) {
  const V = /[AEIOUÁÉÍÓÚÜaeiouáéíóúü]/;
  const wide = wd => ctx.measure(wd, size, weight, family) + wd.length * spacing > maxWidth;
  const split = wd => {
    if (!wide(wd)) return [wd];
    let cut = -1;
    for (let i = 2; i <= wd.length - 2; i++) {
      // break before a consonant followed by a vowel, after a vowel or a consonant cluster end
      if (!V.test(wd[i]) && V.test(wd[i + 1] || '') && V.test(wd[i - 1]) && !wide(`${wd.slice(0, i)}-`)) cut = i;
    }
    if (cut < 0) return [wd];
    return [`${wd.slice(0, cut)}-`, ...split(wd.slice(cut))];
  };
  return String(text ?? '').split(/\s+/).filter(Boolean).flatMap(split).join(' ');
}

/**
 * Size at which the longest word of `text` fits `maxWidth` whole (wrapping
 * then only breaks between words); never below `floor`.
 */
export function wordSafeSize(ctx, text, maxWidth, size, weight = 400, family = 'sans', floor = size * 0.8) {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const longest = Math.max(0, ...words.map(wd => ctx.measure(wd, size, weight, family)));
  if (longest <= maxWidth) return size;
  return Math.max(floor, size * (maxWidth / longest) * 0.98);
}

/**
 * Measure a card: kind label, body text and (claim) the attribution line.
 * Body and attribution never shrink below their size and wrap up to 10
 * lines, so supplied text is not ellipsised; the card grows instead.
 * @param {any} ctx
 * @param {{w:number, s:number, ks:number, as?:number, kind:string, body:string, attribution?:string|null, show:boolean}} o
 */
export function measureCard(ctx, o) {
  const s = o.s;
  const pad = Math.max(14, s * 0.52);
  const icon = o.ks * 1.25;
  const hb = Math.max(o.ks * 1.9, icon + 12);
  // kind label: the glyph is dropped (and then the size reduced a little) when its longest word would not fit whole
  const KIND = o.kind.toUpperCase();
  const longest = sz => Math.max(...KIND.split(/\s+/).map(wd => ctx.measure(wd, sz, 800, 'sans') + wd.length * 0.6));
  let showIcon = true, kss = o.ks;
  if (longest(kss) > o.w - pad * 2 - icon - 10) {
    showIcon = false;
    if (longest(kss) > o.w - pad * 2) kss = Math.max(o.ksMin ?? o.ks * 0.85, kss * (o.w - pad * 2) / longest(kss) * 0.98);
  }
  const kindAvail = o.w - pad * 2 - (showIcon ? icon + 10 : 0);
  // (opt-in `noHyphen`: the kind label is never hyphenated; the caller sizes the card for its longest word)
  const KINDT = !o.noHyphen && longest(kss) > kindAvail - KIND.length * 0.6 + 0.5 ? hyphenateLabel(ctx, KIND, kindAvail - KIND.length * 0.6, kss, 800, 'sans') : KIND;
  const kindFit = o.show ? ctx.fit(KINDT, {maxWidth: kindAvail - KIND.length * 0.6, size: kss, minSize: kss, maxLines: 4, weight: 800}) : null;
  const hb2 = kindFit ? Math.max(hb, kindFit.height + 16) : hb;
  const showBody = o.show && !o.bodyHidden;
  const bs = showBody ? wordSafeSize(ctx, o.body, o.w - pad * 2, s, 600, 'serif', o.floor) : s;
  const bodyFit = showBody ? ctx.fit(breakable(ctx, o.body, o.w - pad * 2, bs, 600, 'serif'), {maxWidth: o.w - pad * 2, size: bs, minSize: bs, maxLines: 12, weight: 600, family: 'serif', leading: 1.16}) : null;
  const as0 = o.as ?? s * 0.7;
  const med = o.attribution !== undefined && o.attribution !== null ? as0 * 2.1 : 0;
  // the medallion sits beside the attribution, or above it when a word would not fit whole beside it
  let medTop = false, asz = as0;
  if (o.show && o.attribution) {
    if (wordSafeSize(ctx, o.attribution, o.w - pad * 2 - med - 10, as0, 500, 'sans', 0) < as0) {
      medTop = true;
      asz = wordSafeSize(ctx, o.attribution, o.w - pad * 2, as0, 500, 'sans', o.floor);
    }
  }
  const attrFit = o.show && o.attribution ? ctx.fit(breakable(ctx, o.attribution, o.w - pad * 2 - (medTop ? 0 : med + 10), asz, 500, 'sans'), {maxWidth: o.w - pad * 2 - (medTop ? 0 : med + 10), size: asz, minSize: asz, maxLines: 10, weight: 500, leading: 1.14}) : null;
  const bodyH = bodyFit ? bodyFit.height : s * 2.4;
  const attrH = med ? (medTop ? med + 6 + (attrFit ? attrFit.height : 0) : Math.max(med, attrFit ? attrFit.height : 0)) : 0;
  const hgt = hb2 + pad * 0.9 + bodyH + (med ? pad * 0.8 + attrH : 0) + pad;
  // left end of the kind label when it is right-aligned (the band left of it stays free)
  const labelLeftR = o.w - pad - (showIcon ? icon + 10 : 0) - (kindFit ? kindFit.width + KIND.length * 0.6 : 0);
  return {w: o.w, h: hgt, hb: hb2, pad, icon, showIcon, medTop, bodyHidden: !!o.bodyHidden, kindFit, bodyFit, attrFit, med, s, ks: o.ks, kind: o.kind, labelLeftR};
}

/* ------------------------------------------------------------------ */
/* Art                                                                   */
/* ------------------------------------------------------------------ */

/** Header glyphs drawn in white on the coloured band (centre at 0,0, size u). */
export function kindGlyph(kind, u, color = '#ffffff') {
  const k = u / 2;
  if (kind === 'claim') {
    // speech bubble
    return g(null,
      h('path', {d: `M${r(-k)} ${r(-k * 0.7)}Q${r(-k)} ${r(-k)} ${r(-k * 0.7)} ${r(-k)}H${r(k * 0.7)}Q${r(k)} ${r(-k)} ${r(k)} ${r(-k * 0.7)}V${r(k * 0.25)}Q${r(k)} ${r(k * 0.55)} ${r(k * 0.7)} ${r(k * 0.55)}H${r(-k * 0.1)}L${r(-k * 0.55)} ${r(k)}V${r(k * 0.55)}H${r(-k * 0.7)}Q${r(-k)} ${r(k * 0.55)} ${r(-k)} ${r(k * 0.25)}Z`, fill: color}),
      h('path', {d: `M${r(-k * 0.55)} ${r(-k * 0.45)}H${r(k * 0.55)}M${r(-k * 0.55)} ${r(-k * 0.05)}H${r(k * 0.25)}`, stroke: 'rgba(0,0,0,0.35)', 'stroke-width': Math.max(1.5, u * 0.08), 'stroke-linecap': 'round'}));
  }
  if (kind === 'rule') {
    // a small scroll: sheet between two rolls
    return g(null,
      h('rect', {x: r(-k * 0.62), y: r(-k * 0.78), width: r(k * 1.24), height: r(k * 1.56), fill: color}),
      h('rect', {x: r(-k * 0.9), y: r(-k * 1.0), width: r(k * 1.8), height: r(k * 0.36), rx: r(k * 0.18), fill: color, stroke: 'rgba(0,0,0,0.4)', 'stroke-width': Math.max(1.5, u * 0.07)}),
      h('rect', {x: r(-k * 0.9), y: r(k * 0.64), width: r(k * 1.8), height: r(k * 0.36), rx: r(k * 0.18), fill: color, stroke: 'rgba(0,0,0,0.4)', 'stroke-width': Math.max(1.5, u * 0.07)}),
      h('path', {d: `M${r(-k * 0.38)} ${r(-k * 0.3)}H${r(k * 0.38)}M${r(-k * 0.38)} ${r(k * 0.05)}H${r(k * 0.38)}M${r(-k * 0.38)} ${r(k * 0.38)}H${r(k * 0.1)}`, stroke: 'rgba(0,0,0,0.35)', 'stroke-width': Math.max(1.5, u * 0.07), 'stroke-linecap': 'round'}));
  }
  // page with folded corner (premise); external adds a round seal
  const page = g(null,
    h('path', {d: `M${r(-k * 0.72)} ${r(-k)}H${r(k * 0.3)}L${r(k * 0.72)} ${r(-k * 0.58)}V${r(k)}H${r(-k * 0.72)}Z`, fill: color}),
    h('path', {d: `M${r(k * 0.3)} ${r(-k)}V${r(-k * 0.58)}H${r(k * 0.72)}`, fill: 'none', stroke: 'rgba(0,0,0,0.35)', 'stroke-width': Math.max(1.5, u * 0.07)}),
    h('path', {d: `M${r(-k * 0.45)} ${r(-k * 0.25)}H${r(k * 0.45)}M${r(-k * 0.45)} ${r(k * 0.1)}H${r(k * 0.45)}M${r(-k * 0.45)} ${r(k * 0.45)}H${r(k * 0.1)}`, stroke: 'rgba(0,0,0,0.35)', 'stroke-width': Math.max(1.5, u * 0.07), 'stroke-linecap': 'round'}));
  if (kind !== 'external') return page;
  return g(null, page,
    h('circle', {cx: r(k * 0.55), cy: r(k * 0.6), r: r(k * 0.42), fill: color, stroke: 'rgba(0,0,0,0.45)', 'stroke-width': Math.max(1.5, u * 0.07)}),
    h('path', {d: `M${r(k * 0.38)} ${r(k * 0.98)}l${r(-k * 0.12)} ${r(k * 0.3)}M${r(k * 0.72)} ${r(k * 0.98)}l${r(k * 0.12)} ${r(k * 0.3)}`, stroke: color, 'stroke-width': Math.max(2, u * 0.1), 'stroke-linecap': 'round'}));
}

/** Tiny speaker bust in a round medallion (centre 0,0, radius R). */
export function medallion(ctx, look, R, clipId) {
  const headR = R * 0.34;
  const hy = -R * 0.1;
  const hair = hairShape(look.hair, headR, hy, look.hairColor);
  return g(null,
    h('defs', null, h('clipPath', {id: clipId}, h('circle', {r: r(R - 1.5)}))),
    h('circle', {r: r(R), fill: '#e8e1d2'}),
    g({'clip-path': `url(#${clipId})`},
      hair.back,
      h('path', {d: `M${r(-R * 0.78)} ${r(R)}C${r(-R * 0.74)} ${r(R * 0.38)} ${r(-R * 0.4)} ${r(R * 0.28)} 0 ${r(R * 0.28)}C${r(R * 0.4)} ${r(R * 0.28)} ${r(R * 0.74)} ${r(R * 0.38)} ${r(R * 0.78)} ${r(R)}Z`, fill: look.outfit, stroke: INK, 'stroke-width': 1.6}),
      h('circle', {cx: 0, cy: r(hy), r: r(headR), fill: look.skin, stroke: INK, 'stroke-width': 1.6}),
      hair.front,
      h('circle', {cx: r(-headR * 0.36), cy: r(hy + headR * 0.08), r: r(Math.max(1.2, headR * 0.1)), fill: INK}),
      h('circle', {cx: r(headR * 0.36), cy: r(hy + headR * 0.08), r: r(Math.max(1.2, headR * 0.1)), fill: INK})),
    h('circle', {r: r(R), fill: 'none', stroke: INK, 'stroke-width': 2}));
}

/**
 * Standing card. Local origin = bottom-left corner; spans x∈[0,w], y∈[−h,0].
 * @param {any} ctx
 * @param {{name?:string, m:any, kind:'claim'|'premise'|'external', color:string, look?:any, textless?:boolean, idKey:string, named?:boolean, textName?:string}} o
 */
export function cardArt(ctx, o) {
  const m = o.m;
  const C = rcColors(ctx);
  const w = m.w, H = m.h;
  const named = o.named !== false;
  const nm = s => (named && o.name ? `${o.name}-${s}` : undefined);
  const edge = Math.max(6, m.s * 0.24);
  const rad = Math.max(8, m.s * 0.34);
  const parts = [];
  // board thickness (seen at the right and bottom), then the face
  parts.push(h('path', {d: roundRectPath(edge, -H + edge * 0.6, w, H, rad), fill: C.cardEdge, stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('path', {d: roundRectPath(0, -H, w, H, rad), fill: C.card, stroke: INK, 'stroke-width': 2.6}));
  // header band
  const hb = m.hb;
  parts.push(h('path', {d: `M0 ${r(-H + hb)}V${r(-H + rad)}Q0 ${r(-H)} ${r(rad)} ${r(-H)}H${r(w - rad)}Q${r(w)} ${r(-H)} ${r(w)} ${r(-H + rad)}V${r(-H + hb)}Z`, fill: o.color, stroke: INK, 'stroke-width': 2.2}));
  parts.push(h('path', {d: `M${r(m.pad * 0.5)} ${r(-H + hb - 5)}H${r(w - m.pad * 0.5)}`, stroke: '#ffffff', 'stroke-width': 1.5, opacity: 0.35}));
  // kind glyph + label: left-aligned, or right-aligned (labelRight) to keep the band's left part free
  const gx = o.labelRight ? w - m.pad - m.icon / 2 : m.pad + m.icon / 2, gy = -H + hb / 2;
  const glyphOn = m.showIcon !== false || o.textless || !m.kindFit;
  if (glyphOn) parts.push(g({transform: T(gx, gy)}, kindGlyph(o.kind, m.icon)));
  if (!o.textless && m.kindFit) {
    const off = m.showIcon !== false ? m.icon / 2 + 10 : -m.icon / 2;
    const lx = o.labelRight ? gx - off : gx + off;
    parts.push(textBlock(m.kindFit, {x: lx, y: gy - m.kindFit.height / 2, fill: '#ffffff', letterSpacing: 0.6, name: nm('kind'), anchor: o.labelRight ? 'end' : 'start'}));
  }
  // faint ruled lines behind the body (paper card)
  const top = -H + hb + m.pad * 0.9;
  const bodyH = m.bodyFit ? m.bodyFit.height : m.s * 2.4;
  const lines = [];
  const lh = m.bodyFit ? m.bodyFit.lineHeight : m.s * 1.16;
  const nLines = m.bodyFit ? m.bodyFit.lines.length : 2;
  for (let i = 0; i < nLines; i++) {
    const yy = top + i * lh + m.s * 1.02;
    lines.push(h('path', {d: `M${r(m.pad * 0.6)} ${r(yy)}H${r(w - m.pad * 0.6)}`, stroke: '#e3dccd', 'stroke-width': 1.4}));
  }
  parts.push(g(null, lines));
  if (!o.textless && m.bodyFit) {
    parts.push(textBlock(m.bodyFit, {x: m.pad, y: top, fill: INK, name: nm('body')}));
  } else if (!m.bodyHidden || o.textless) {
    // labels hidden: simulated lines of print (decorative, not supplied text)
    const bars = [];
    for (let i = 0; i < nLines; i++) {
      const bw = (w - m.pad * 2) * (i === nLines - 1 ? 0.55 : 0.92);
      bars.push(h('rect', {x: r(m.pad), y: r(top + i * lh + m.s * 0.28), width: r(bw), height: r(m.s * 0.42), rx: r(m.s * 0.2), fill: '#cfc7b8'}));
    }
    parts.push(g(null, bars));
  }
  // attribution (claim only): speaker medallion + "said by" line
  if (m.med) {
    const ay = top + bodyH + m.pad * 0.8;
    const R = m.med / 2;
    parts.push(h('path', {d: `M${r(m.pad * 0.6)} ${r(ay - m.pad * 0.4)}H${r(w - m.pad * 0.6)}`, stroke: '#d5ccbb', 'stroke-width': 1.6, 'stroke-dasharray': '6 5'}));
    if (o.look) parts.push(g({transform: T(m.pad + R, ay + R)}, medallion(ctx, o.look, R, ctx.id(`${o.idKey}-med`))));
    if (!o.textless && m.attrFit) {
      const at = m.medTop ? {x: m.pad, y: ay + m.med + 6} : {x: m.pad + m.med + 10, y: ay + Math.max(0, (m.med - m.attrFit.height) / 2)};
      parts.push(textBlock(m.attrFit, {...at, fill: '#3f464e', name: nm('attr'), italic: true}));
    }
  }
  return g({name: named ? o.name : undefined}, parts);
}

/** Soft contact shadow on the table under a board (world coords). */
export function contactShadow(name, x0, x1, y, opacity = 0.18) {
  return h('ellipse', {name, cx: r((x0 + x1) / 2), cy: r(y + 3), rx: r(Math.max(10, (x1 - x0) / 2 + 10)), ry: 7, fill: '#000000', opacity});
}

/**
 * Archive box standing on the table (outside support). Local origin =
 * bottom-left; spans x∈[0,w], y∈[−h,0]. `labelFit` is the supplied label.
 */
export function measureBox(ctx, o) {
  const s = o.s;
  const pad = s * 0.5;
  const ls = o.show && !o.labelHidden ? wordSafeSize(ctx, o.label, o.w - pad * 2.8, s, 700, 'sans', o.floor) : s;
  const fit = o.show && !o.labelHidden ? ctx.fit(breakable(ctx, o.label, o.w - pad * 2.8, ls, 700, 'sans'), {maxWidth: o.w - pad * 2.8, size: ls, minSize: ls, maxLines: 12, weight: 700, leading: 1.14}) : null;
  const kss = o.show && o.kind ? wordSafeSize(ctx, o.kind.toUpperCase(), o.w - pad * 2.8 - o.kind.length * 0.6, o.ks, 800, 'sans', o.ksFloor ?? o.ks * 0.8) : o.ks;
  const kindFit = o.show && o.kind ? ctx.fit(o.noHyphen ? o.kind.toUpperCase() : hyphenateLabel(ctx, o.kind.toUpperCase(), o.w - pad * 2.8 - o.kind.length * 0.6, kss, 800, 'sans'), {maxWidth: o.w - pad * 2.8 - o.kind.length * 0.6, size: kss, minSize: kss, maxLines: 4, weight: 800}) : null;
  const lid = Math.max(s * 1.1, 26);
  const plateH = (fit ? fit.height : s * 1.6) + (kindFit ? kindFit.height + Math.max(pad * 0.5, o.ks * 0.55) : 0) + pad * 1.6;
  const hgt = Math.max(o.minH ?? 0, lid + pad * 1.4 + plateH + pad * 0.8 + s * 0.6);
  return {w: o.w, h: hgt, lid, pad, fit, kindFit, plateH, s};
}

export function boxArt(ctx, o) {
  const m = o.m;
  const C = rcColors(ctx);
  const w = m.w, H = m.h;
  const named = o.named !== false;
  const lid = m.lid;
  const plate = {x: m.pad * 0.8, y: -H + lid + m.pad * 1.4, w: w - m.pad * 1.6, h: m.plateH};
  const parts = [
    h('path', {d: roundRectPath(0, -H + lid * 0.5, w, H - lid * 0.5, 6), fill: C.box, stroke: INK, 'stroke-width': 2.6}),
    // corrugated edge lines and a tape strip
    h('path', {d: `M${r(w * 0.5)} ${r(-H + lid)}V0`, stroke: C.boxDark, 'stroke-width': 1.6, opacity: 0.6}),
    h('rect', {x: -5, y: r(-H), width: r(w + 10), height: r(lid), rx: 5, fill: C.boxLid, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(w * 0.5 - lid * 0.9, -H + lid * 0.3, lid * 1.8, lid * 0.4, lid * 0.2), fill: shade(C.boxDark, -0.35), stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(plate.x - 6, plate.y - 6, plate.w + 12, plate.h + 12, 6), fill: shade(C.box, -0.12), stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(plate.x, plate.y, plate.w, plate.h, 4), fill: '#fbf8f1', stroke: INK, 'stroke-width': 2}),
    // archive glyph (stack of files) on the lower front
    h('path', {d: `M${r(w * 0.5 - m.s * 0.8)} ${r(-m.s * 0.35)}h${r(m.s * 1.6)}M${r(w * 0.5 - m.s * 0.8)} ${r(-m.s * 0.7)}h${r(m.s * 1.6)}`, stroke: C.boxDark, 'stroke-width': 3, 'stroke-linecap': 'round'}),
  ];
  let y = plate.y + m.pad * 0.8;
  if (!o.textless && m.kindFit) {
    parts.push(textBlock(m.kindFit, {x: w / 2, y, anchor: 'middle', fill: '#6b4f2c', letterSpacing: 0.6, name: named && o.name ? `${o.name}-kind` : undefined}));
    y += m.kindFit.height + Math.max(m.pad * 0.5, m.kindFit.size * 0.55);
  }
  if (!o.textless && m.fit) parts.push(textBlock(m.fit, {x: w / 2, y, anchor: 'middle', fill: INK, name: named && o.name ? `${o.name}-label` : undefined}));
  else if (o.textless || !m.fit) {
    // simulated print below the kind label (or centred when there is none)
    const by = !o.textless && m.kindFit ? y + m.s * 0.15 : plate.y + plate.h * 0.3;
    parts.push(h('rect', {x: r(plate.x + plate.w * 0.12), y: r(by), width: r(plate.w * 0.76), height: r(m.s * 0.38), rx: 3, fill: '#cfc7b8'}));
    parts.push(h('rect', {x: r(plate.x + plate.w * 0.2), y: r(by + m.s * 0.7), width: r(plate.w * 0.6), height: r(m.s * 0.38), rx: 3, fill: '#cfc7b8'}));
  }
  return g({name: named ? o.name : undefined}, parts);
}

/**
 * Ribbon arrow along a smooth path through `pts` (world coords); draws on
 * with progress p; the arrowhead (tip exactly on the last point) appears
 * when the stroke reaches the end. Optional dashed ghost style.
 * @param {any} ctx
 * @param {{name:string, pts:{x:number,y:number}[], color:string, width?:number, named?:boolean, dashed?:boolean, halo?:string}} o
 */
export function ribbonArrow(ctx, o) {
  const W = o.width ?? 8;
  const head = W * 3.4;
  const dense = catmullRom(o.pts, 18);
  const full = polyline(dense);
  // trim the line under the arrowhead so the round cap never pokes past the tip
  const trimT = Math.max(0, 1 - (head * 0.62) / full.total);
  const keep = [];
  const n = 90;
  for (let i = 0; i <= n; i++) keep.push(full.at((i / n) * trimT));
  const line = polyline(keep);
  const d = line.d(2);
  const end = full.at(1);
  const endA = full.at(Math.max(0, 1 - 6 / full.total));
  const ang = Math.atan2(end.y - endA.y, end.x - endA.x) / DEG;
  const L = line.total;
  const named = o.named !== false;
  const nm = s => (named ? `${o.name}-${s}` : undefined);
  const node = g({name: named ? o.name : undefined, opacity: 0},
    h('path', {name: nm('halo'), d, fill: 'none', stroke: o.halo ?? '#fbf7ef', 'stroke-width': W + 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L)} ${r(L + 20)}`, 'stroke-dashoffset': r(L), opacity: 0.9}),
    h('path', {name: nm('line'), d, fill: 'none', stroke: o.color, 'stroke-width': W, 'stroke-linecap': o.dashed ? 'butt' : 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': o.dashed ? `${r(W * 1.8)} ${r(W * 1.3)}` : `${r(L)} ${r(L + 20)}`, 'stroke-dashoffset': o.dashed ? 0 : r(L)}),
    h('path', {name: nm('head'), d: `M0 0L${r(-head)} ${r(-head * 0.52)}L${r(-head * 0.72)} 0L${r(-head)} ${r(head * 0.52)}Z`, fill: o.color, stroke: o.halo ?? '#fbf7ef', 'stroke-width': 2, 'stroke-linejoin': 'round', transform: T(end.x, end.y, ang), opacity: 0}),
    h('circle', {name: nm('dot'), cx: r(o.pts[0].x), cy: r(o.pts[0].y), r: r(W * 0.95), fill: o.color, stroke: o.halo ?? '#fbf7ef', 'stroke-width': 2, opacity: 0}),
  );
  /** @param {number} p draw progress @param {number} [op] group opacity */
  const frame = (p, op = 1) => {
    const out = {};
    if (!named) return out;
    const q = clamp(p);
    out[o.name] = {opacity: q > 0 ? op : 0};
    out[`${o.name}-halo`] = {'stroke-dashoffset': r(L * (1 - q))};
    if (!o.dashed) out[`${o.name}-line`] = {'stroke-dashoffset': r(L * (1 - q))};
    if (o.travel) {
      // the arrowhead rides at the drawing tip (its tip lands exactly on the target at q = 1)
      const tip = full.at(q);
      const back = full.at(Math.max(0, q - 6 / full.total));
      const a = q >= 1 ? ang : Math.atan2(tip.y - back.y, tip.x - back.x) / DEG;
      out[`${o.name}-head`] = {opacity: q > 0.02 ? 1 : 0, transform: T(tip.x, tip.y, a)};
    } else out[`${o.name}-head`] = {opacity: q >= 0.985 ? 1 : 0};
    out[`${o.name}-dot`] = {opacity: q > 0 ? 1 : 0};
    return out;
  };
  /** frame values for an unnamed copy (used inside a magnifier): returns attrs by role */
  return {node, frame, at: t => full.at(t), total: full.total, start: o.pts[0], end: {x: end.x, y: end.y}, lineLen: L, d, head, width: W, angle: ang, bbox: bboxOf(dense)};
}

function bboxOf(pts) {
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

/**
 * Arc points from a to b bulging upward by `lift` (world units), with `n`
 * intermediate control points (for ribbonArrow).
 */
export function arcPts(a, b, lift, skew = 0) {
  const mx = (a.x + b.x) / 2 + skew, top = Math.min(a.y, b.y) - lift;
  return [a, {x: a.x + (mx - a.x) * 0.35, y: a.y + (top - a.y) * 0.8}, {x: mx, y: top}, {x: b.x + (mx - b.x) * 0.35, y: b.y + (top - b.y) * 0.8}, b];
}

/**
 * Hand magnifier. `view` (clipped glass holding an enlarged copy) and
 * `prop` (rim, glass, handle) are separate nodes so a palm can go below the
 * prop and a thumb above. Local handle direction = +x.
 * @param {any} ctx
 * @param {{name:string, R:number, handle:number, copy?:any, zoom?:number, fill?:string}} o
 */
export function lupaArt(ctx, o) {
  const N = o.name;
  const R = o.R;
  const Lh = o.handle;
  const view = g({name: `${N}-view`, opacity: 0},
    h('defs', null, h('clipPath', {id: ctx.id(`${N}-clip`)}, h('circle', {name: `${N}-clipc`, cx: 0, cy: 0, r: r(R - 5)}))),
    g({'clip-path': ctx.ref(`${N}-clip`)},
      h('circle', {name: `${N}-bg`, cx: 0, cy: 0, r: r(R), fill: o.fill || '#efe8da'}),
      g({name: `${N}-zoom`}, o.copy || null)));
  const hw = Math.max(20, R * 0.3);
  const prop = g({name: N},
    h('rect', {x: r(R + 16), y: r(-hw / 2), width: r(Lh - 16), height: r(hw), rx: r(hw / 2), fill: '#3d3a36', stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(R + 28), y: r(-hw * 0.3), width: r(Math.max(10, Lh - 44)), height: r(hw * 0.2), rx: r(hw * 0.1), fill: '#ffffff', opacity: 0.18}),
    h('rect', {x: r(R + 1), y: r(-hw * 0.4), width: 20, height: r(hw * 0.8), rx: 4, fill: '#9aa4ad', stroke: INK, 'stroke-width': 2}),
    h('circle', {r: r(R), fill: 'none', stroke: INK, 'stroke-width': Math.max(12, R * 0.2)}),
    h('circle', {r: r(R), fill: 'none', stroke: '#9aa4ad', 'stroke-width': Math.max(7, R * 0.13)}),
    h('circle', {r: r(R - 6), fill: '#d6ecf5', opacity: 0.2}),
    h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.28)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(-R * 0.22)} ${r(-R * 0.64)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.55}),
  );
  const zoom = o.zoom ?? 1.8;
  /**
   * @param {{x:number,y:number}} c lens centre
   * @param {number} angleDeg handle direction
   * @param {number} [viewOpacity]
   * @param {{x:number,y:number}} [src] point of the copy shown at the lens centre
   */
  const frame = (c, angleDeg, viewOpacity = 1, src = c) => {
    const a = angleDeg * DEG;
    return {
      nodes: {
        [N]: {transform: T(c.x, c.y, angleDeg)},
        [`${N}-view`]: {opacity: r(viewOpacity, 3)},
        [`${N}-clipc`]: {cx: r(c.x), cy: r(c.y)},
        [`${N}-bg`]: {cx: r(c.x), cy: r(c.y)},
        [`${N}-zoom`]: {transform: `translate(${r(c.x)} ${r(c.y)}) scale(${r(zoom, 3)}) translate(${r(-src.x)} ${r(-src.y)})`},
      },
      grip: {x: c.x + Math.cos(a) * (R + Lh * 0.62), y: c.y + Math.sin(a) * (R + Lh * 0.62)},
      end: {x: c.x + Math.cos(a) * (R + Lh), y: c.y + Math.sin(a) * (R + Lh)},
    };
  };
  return {view, prop, frame, R, zoom, handle: Lh};
}

/**
 * Side-view room: wall, planks (tables / shelves) and a floor band, inside a
 * rounded window that clips everything drawn in `clip` (arms enter from its
 * edges). Planks: {x0, x1, y (top surface), t (thickness), kind:'table'|'shelf'}.
 */
export function stageArt(ctx, o) {
  const C = rcColors(ctx);
  const th = ctx.theme;
  const {x, y, w, h: hh} = o.box;
  const rad = o.radius ?? 26;
  const clipId = `${o.prefix}-clip`;
  const parts = [];
  // wall with a faint panel pattern and a picture rail
  parts.push(h('rect', {x, y, width: w, height: hh, fill: C.wall}));
  const step = Math.max(90, w / 12);
  for (let xx = x + step * 0.5, i = 0; xx < x + w; xx += step, i++) {
    parts.push(h('path', {d: `M${r(xx)} ${r(y)}V${r(y + hh)}`, stroke: C.wallLine, 'stroke-width': 1.2, opacity: 0.45}));
  }
  if (o.railY) parts.push(h('rect', {x, y: r(o.railY), width: w, height: 8, fill: C.wallDeep, stroke: C.wallLine, 'stroke-width': 1}));
  // floor band
  if (o.floorY !== undefined && o.floorY < y + hh) parts.push(h('rect', {x, y: r(o.floorY), width: w, height: r(y + hh - o.floorY), fill: C.floor}));
  // planks
  for (const [i, pk] of (o.planks || []).entries()) {
    const t = pk.t ?? 40;
    const top = 12;
    if (pk.kind === 'table') {
      // legs down to the floor
      const legW = Math.max(26, t * 0.7);
      const floorY = o.floorY ?? y + hh;
      for (const lx of [pk.x0 + 30, pk.x1 - 30 - legW]) parts.push(h('rect', {x: r(lx), y: r(pk.y + t), width: r(legW), height: r(Math.max(0, floorY - pk.y - t + 6)), fill: th.woodDark, stroke: INK, 'stroke-width': 2.2}));
      parts.push(h('rect', {x: r(pk.x0 + 20), y: r(pk.y + t - 2), width: r(pk.x1 - pk.x0 - 40), height: r(t * 0.45), fill: shade(th.woodDark, -0.1), stroke: INK, 'stroke-width': 2}));
    } else {
      // shelf brackets
      for (const bx of [pk.x0 + (pk.x1 - pk.x0) * 0.12, pk.x1 - (pk.x1 - pk.x0) * 0.12]) {
        parts.push(h('path', {d: `M${r(bx - 8)} ${r(pk.y + t)}V${r(pk.y + t + t * 1.6)}L${r(bx + 8)} ${r(pk.y + t + 4)}Z`, fill: '#8f9aa3', stroke: INK, 'stroke-width': 2}));
      }
    }
    parts.push(h('rect', {x: r(pk.x0), y: r(pk.y + top - 1), width: r(pk.x1 - pk.x0), height: r(t - top + 1), rx: 4, fill: th.wood, stroke: INK, 'stroke-width': 2.6}));
    parts.push(h('path', {d: `M${r(pk.x0 + 6)} ${r(pk.y + top + (t - top) * 0.45)}C${r(pk.x0 + (pk.x1 - pk.x0) * 0.3)} ${r(pk.y + top + (t - top) * 0.3)} ${r(pk.x0 + (pk.x1 - pk.x0) * 0.6)} ${r(pk.y + top + (t - top) * 0.7)} ${r(pk.x1 - 6)} ${r(pk.y + top + (t - top) * 0.5)}`, fill: 'none', stroke: th.woodDark, 'stroke-width': 1.6, opacity: 0.6}));
    parts.push(h('path', {d: `M${r(pk.x0 - 4)} ${r(pk.y + top)}L${r(pk.x0 + 6)} ${r(pk.y)}H${r(pk.x1 - 6)}L${r(pk.x1 + 4)} ${r(pk.y + top)}Z`, fill: th.woodTop, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
    parts.push(h('path', {d: `M${r(pk.x0 + 30)} ${r(pk.y + top * 0.5)}H${r(pk.x1 - 60)}`, stroke: shade(th.woodTop, 0.25), 'stroke-width': 2, opacity: 0.8, name: `${o.prefix}-glint${i}`}));
  }
  const back = g({name: `${o.prefix}-back`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(x, y, w, hh, rad)}))),
    g({'clip-path': ctx.ref(clipId)}, parts));
  const frame = h('path', {d: roundRectPath(x, y, w, hh, rad), fill: 'none', stroke: INK, 'stroke-width': 3});
  return {back, frame, clip: ctx.ref(clipId)};
}

/** Wall plaque printing the rule as supplied. */
export function measurePlaque(ctx, o) {
  const pad = o.s * 0.55;
  const head = o.show ? ctx.fit(o.head, {maxWidth: o.w - pad * 2, size: o.ks, minSize: o.ks, maxLines: 2, weight: 800}) : null;
  const bsz = o.show ? wordSafeSize(ctx, o.text, o.w - pad * 2, o.s, 500, 'serif', o.floor) : o.s;
  const body = o.show ? ctx.fit(breakable(ctx, o.text, o.w - pad * 2, bsz, 500, 'serif'), {maxWidth: o.w - pad * 2, size: bsz, minSize: bsz, maxLines: 10, weight: 500, family: 'serif', leading: 1.15}) : null;
  const hgt = pad * 1.2 + (head ? head.height + Math.max(pad * 0.45, o.ks * 0.55) : o.s * 0.8) + (body ? body.height : o.s * 2.2) + pad * 1.1;
  return {w: o.w, h: hgt, pad, head, body, s: o.s};
}

export function plaqueArt(ctx, o) {
  const C = rcColors(ctx);
  const m = o.m;
  const {x, y} = o;
  const parts = [
    h('path', {d: `M${r(x + m.w * 0.3)} ${r(y)}L${r(x + m.w / 2)} ${r(y - 26)}L${r(x + m.w * 0.7)} ${r(y)}`, fill: 'none', stroke: '#6f6353', 'stroke-width': 2}),
    h('circle', {cx: r(x + m.w / 2), cy: r(y - 26), r: 5, fill: '#8f9aa3', stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(x - 7, y - 7, m.w + 14, m.h + 14, 10), fill: C.slateFrame, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(x, y, m.w, m.h, 6), fill: C.slate, stroke: INK, 'stroke-width': 1.6}),
  ];
  let yy = y + m.pad * 1.2;
  if (m.head) {
    parts.push(textBlock(m.head, {x: x + m.pad, y: yy, fill: C.brass, letterSpacing: 0.6, name: `${o.name}-head`}));
    yy += m.head.height + Math.max(m.pad * 0.45, m.head.size * 0.55);
  } else {
    parts.push(h('rect', {x: r(x + m.pad), y: r(yy), width: r(m.w * 0.4), height: r(m.s * 0.34), rx: 3, fill: C.brass, opacity: 0.8}));
    yy += m.s * 0.8;
  }
  if (m.body) parts.push(textBlock(m.body, {x: x + m.pad, y: yy, fill: '#f4f1ea', name: `${o.name}-text`}));
  else {
    for (let i = 0; i < 2; i++) parts.push(h('rect', {x: r(x + m.pad), y: r(yy + i * m.s * 1.1 + m.s * 0.3), width: r((m.w - m.pad * 2) * (i ? 0.6 : 0.9)), height: r(m.s * 0.34), rx: 3, fill: '#8d989e'}));
  }
  return {node: g({name: o.name}, parts), box: {x: x - 7, y: y - 30, w: m.w + 14, h: m.h + 37}};
}

/**
 * Status tag: a pill with a neutral dot and up to three lines of bold text
 * (a descriptive state, never a finding). No tick or cross glyphs.
 */
export function tagChip(ctx, text, o) {
  const s = o.size;
  const dotW = s * 0.9;
  const fit = ctx.fit(text, {maxWidth: o.maxWidth - s * 1.2 - dotW, size: s, minSize: s, maxLines: o.maxLines ?? 6, weight: 700});
  const w = fit.width + s * 1.2 + dotW;
  const hh = fit.height + s * 0.8;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const col = o.color ?? INK;
  const node = g({name: o.name, opacity: 0},
    h('rect', {x: r(x), y: r(o.y), width: r(w), height: r(hh), rx: r(Math.min(hh / 2, s * 0.9)), fill: '#ffffff', stroke: col, 'stroke-width': 2.4}),
    h('circle', {cx: r(x + s * 0.6 + dotW * 0.35), cy: r(o.y + s * 0.4 + fit.size * 0.55), r: r(s * 0.26), fill: col}),
    textBlock(fit, {x: x + s * 0.6 + dotW, y: o.y + s * 0.4, fill: col}));
  return {node, box: {x, y: o.y, w, h: hh}, fit};
}

/** Loop glyph (two nested arcs closing on themselves) for keys. Centre (x,y), size u. */
export function loopGlyph(x, y, u, color) {
  const k = u / 2;
  return g({transform: T(x, y)},
    h('path', {d: `M${r(-k * 0.8)} ${r(k * 0.5)}C${r(-k * 0.9)} ${r(-k * 0.9)} ${r(k * 0.9)} ${r(-k * 0.9)} ${r(k * 0.8)} ${r(k * 0.5)}`, fill: 'none', stroke: color, 'stroke-width': Math.max(3, u * 0.12), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(k * 0.8)} ${r(k * 0.5)}l${r(-k * 0.42)} ${r(-k * 0.08)}l${r(k * 0.3)} ${r(-k * 0.32)}Z`, fill: color, stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(k * 0.6)} ${r(k * 0.8)}C${r(k * 0.3)} ${r(k * 1.05)} ${r(-k * 0.3)} ${r(k * 1.05)} ${r(-k * 0.62)} ${r(k * 0.72)}`, fill: 'none', stroke: color, 'stroke-width': Math.max(3, u * 0.12), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(-k * 0.8)} ${r(k * 0.5)}l${r(k * 0.02)} ${r(k * 0.42)}l${r(k * 0.36)} ${r(-k * 0.1)}Z`, fill: color, stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
}

/** Chain glyph (small box with an arrow rising from it) for keys. */
export function chainGlyph(x, y, u, color, boxColor = '#c9a06a') {
  const k = u / 2;
  return g({transform: T(x, y)},
    h('rect', {x: r(-k * 0.95), y: r(k * 0.05), width: r(k * 0.9), height: r(k * 0.8), rx: 2, fill: boxColor, stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: `M${r(-k * 0.5)} ${r(-k * 0.05)}C${r(-k * 0.4)} ${r(-k * 0.8)} ${r(k * 0.3)} ${r(-k * 0.9)} ${r(k * 0.62)} ${r(-k * 0.35)}`, fill: 'none', stroke: color, 'stroke-width': Math.max(3, u * 0.12), 'stroke-linecap': 'round'}),
    h('path', {d: `M${r(k * 0.9)} ${r(k * 0.05)}l${r(-k * 0.46)} ${r(-k * 0.2)}l${r(k * 0.36)} ${r(-k * 0.32)}Z`, fill: color, stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
}

/**
 * Key (legend) rows: glyph + text, wrapping text inside maxW. Returns node,
 * box and fits. Items: {glyph:(x,y,u)=>node, text}.
 */
export function measureKey(ctx, items, maxW, size) {
  const u = size * 1.5;
  const rows = items.map(it => ({...it, fit: ctx.fit(it.text, {maxWidth: maxW - u - size * 0.6, size, minSize: size, maxLines: 6, weight: 600})}));
  const gap = size * 0.5;
  const hh = rows.reduce((a, rw) => a + Math.max(u, rw.fit.height) + gap, -gap);
  const w = Math.max(...rows.map(rw => u + size * 0.6 + rw.fit.width));
  return {rows, w, h: hh, u, size, gap};
}

export function keyArt(ctx, name, K, x, y, o = {}) {
  const parts = [];
  const pad = K.size * 0.6;
  if (o.panel !== false) parts.push(h('path', {d: roundRectPath(x - pad, y - pad, K.w + pad * 2, K.h + pad * 2, 10), fill: '#fbf8f1', stroke: '#8c959f', 'stroke-width': 1.8}));
  let yy = y;
  for (const rw of K.rows) {
    const rh = Math.max(K.u, rw.fit.height);
    parts.push(rw.glyph(x + K.u / 2, yy + rh / 2, K.u));
    parts.push(textBlock(rw.fit, {x: x + K.u + K.size * 0.6, y: yy + (rh - rw.fit.height) / 2, fill: rw.color ?? INK}));
    yy += rh + K.gap;
  }
  return {node: g({name, opacity: 0}, parts), box: {x: x - pad, y: y - pad, w: K.w + pad * 2, h: K.h + pad * 2}};
}

/** Pinned paper note (issue) with an optional leader to a target. */
export function noteArt(ctx, o) {
  const C = rcColors(ctx);
  const pad = o.size * 0.6;
  const fit = ctx.fit(o.text, {maxWidth: o.maxWidth - pad * 2, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 4, weight: 600, leading: 1.16});
  const w = fit.width + pad * 2, hh = fit.height + pad * 2;
  const x = o.x, y = o.y;
  const parts = [];
  if (o.target) {
    const from = {x: clamp(o.target.x, x + 12, x + w - 12), y: o.target.y > y + hh ? y + hh : o.target.y < y ? y : y + hh / 2};
    if (from.y === y + hh / 2) from.x = o.target.x > x + w / 2 ? x + w : x;
    parts.push(h('line', {x1: r(from.x), y1: r(from.y), x2: r(o.target.x), y2: r(o.target.y), stroke: INK, 'stroke-width': 2.4, 'stroke-dasharray': '7 6'}));
    parts.push(h('circle', {cx: r(o.target.x), cy: r(o.target.y), r: 6, fill: INK, stroke: '#ffffff', 'stroke-width': 2}));
  }
  parts.push(h('path', {d: `M${r(x)} ${r(y)}H${r(x + w)}V${r(y + hh - 12)}L${r(x + w - 12)} ${r(y + hh)}H${r(x)}Z`, fill: C.note, stroke: INK, 'stroke-width': 2}));
  parts.push(h('path', {d: `M${r(x + w)} ${r(y + hh - 12)}H${r(x + w - 12)}V${r(y + hh)}`, fill: shade(C.note, -0.12), stroke: INK, 'stroke-width': 1.6}));
  parts.push(h('circle', {cx: r(x + w / 2), cy: r(y + 4), r: 7, fill: '#9c4f4f', stroke: INK, 'stroke-width': 1.6}));
  parts.push(textBlock(fit, {x: x + pad, y: y + pad, fill: INK}));
  return {node: g({name: o.name, opacity: 0}, parts), box: {x, y: y - 4, w, h: hh + 4}, fit};
}

/** Size of a note without building it. */
export function noteSize(ctx, text, maxWidth, size, maxLines = 4) {
  const pad = size * 0.6;
  const fit = ctx.fit(text, {maxWidth: maxWidth - pad * 2, size, minSize: size, maxLines, weight: 600, leading: 1.16});
  return {w: fit.width + pad * 2, h: fit.height + pad * 2 + 4, truncated: fit.truncated};
}

/**
 * Footnote strip: assumptions (supplied) + the "as supplied · no conclusion
 * drawn" note, as a light panel. Returns node, box.
 */
export function footArt(ctx, o) {
  const pad = o.size * 0.55;
  const fit = ctx.fit(o.text, {maxWidth: o.maxWidth - pad * 2, size: o.size, minSize: o.size, maxLines: o.maxLines ?? 9, weight: 500});
  const w = fit.width + pad * 2, hh = fit.height + pad * 1.6;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.x;
  return {
    node: g({name: o.name, opacity: 0},
      h('path', {d: roundRectPath(x, o.y, w, hh, 8), fill: '#fbf8f1', stroke: '#8c959f', 'stroke-width': 1.8}),
      textBlock(fit, {x: x + pad, y: o.y + pad * 0.8, fill: INK})),
    box: {x, y: o.y, w, h: hh},
    fit,
  };
}

/** Speaker look (seeded, overrides win). */
export function speakerLook(ctx, speaker) {
  return actorLook(ctx, speaker, 1);
}

/** Attribution line printed on the claim card. */
export function attributionText(t, speaker) {
  const who = [speaker.name, speaker.role].filter(Boolean).join(' · ');
  return `${t.saidBy} ${who}`;
}

/* ------------------------------------------------------------------ */
/* Placement                                                             */
/* ------------------------------------------------------------------ */

/**
 * Find a free spot for a w×h box. Candidates spiral outward from each
 * preferred CENTRE in turn; the first box inside `bounds` that clears every
 * obstacle (inflated by `pad`) wins. Returns the top-left corner or null.
 */
export function findSpot(size, prefs, obstacles, bounds, o = {}) {
  const pad = o.pad ?? 10;
  const step = o.step ?? 12;
  const maxR = o.maxR ?? 700;
  const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  for (const p of prefs) {
    for (let rr = 0; rr <= maxR; rr += step) {
      const n = rr === 0 ? 1 : Math.max(8, Math.round((Math.PI * rr) / step));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (p.phase ?? 0);
        const b = {x: p.x + rr * Math.cos(a) - size.w / 2, y: p.y + rr * Math.sin(a) - size.h / 2, w: size.w, h: size.h};
        if (!inside(b)) continue;
        if (obstacles.some(q => q && hit(b, q, pad))) continue;
        if (o.leader && !leaderClear(b, o.leader.target, obstacles.filter(q => q && !(o.leader.allow || []).includes(q)))) continue;
        return {x: b.x, y: b.y};
      }
    }
  }
  return null;
}

/** Start of a note's leader on its box edge (mirrors noteArt). */
export function leaderStart(b, target) {
  const from = {x: clamp(target.x, b.x + 12, b.x + b.w - 12), y: target.y > b.y + b.h ? b.y + b.h : target.y < b.y ? b.y : b.y + b.h / 2};
  if (from.y === b.y + b.h / 2) from.x = target.x > b.x + b.w / 2 ? b.x + b.w : b.x;
  return from;
}

/** Does the leader from box b to target stay clear of the obstacles (ignoring its last 18 units)? */
export function leaderClear(b, target, obstacles) {
  const a = leaderStart(b, target);
  const L = Math.hypot(target.x - a.x, target.y - a.y);
  if (L < 14) return false;
  const n = Math.ceil(L / 6);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (L * (1 - t) < 18) break;
    const q = {x: a.x + (target.x - a.x) * t, y: a.y + (target.y - a.y) * t};
    if (obstacles.some(o => q.x > o.x && q.x < o.x + o.w && q.y > o.y && q.y < o.y + o.h)) return false;
  }
  return true;
}

/** Boxes covering a thick segment (for obstacle lists). */
export function segBoxes(a, b, width, step = 24) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(L / step));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const x = a.x + ((b.x - a.x) * i) / n, y = a.y + ((b.y - a.y) * i) / n;
    out.push({x: x - width / 2, y: y - width / 2, w: width, h: width});
  }
  return out;
}

/** Bounding box of a board pose. */
export function poseBox(pose) {
  const c = Object.values(pose.corners);
  const xs = c.map(p => p.x), ys = c.map(p => p.y);
  const x = Math.min(...xs), y = Math.min(...ys);
  return {x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y};
}

/** Point on a board's top edge at fraction f from the top-left corner. */
export function topAt(pose, f) {
  const a = pose.corners.tl, b = pose.corners.tr;
  return {x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f};
}

/** Point on a board's right (or left) edge at fraction f from the top. */
export function sideAt(pose, side, f) {
  const a = side === 'right' ? pose.corners.tr : pose.corners.tl;
  const b = side === 'right' ? pose.corners.br : pose.corners.bl;
  return {x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f};
}
