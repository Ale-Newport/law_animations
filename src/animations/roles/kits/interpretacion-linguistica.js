/**
 * Kit for the "Interpretación lingüística" motif (LAW-0181..0184).
 *
 * Staging (story, contrast, inspect): a meeting table seen from the side and
 * slightly from above. Speaker A sits at the left end facing right and
 * speaker B at the right end facing left (personRig, seated). The
 * interpreter sits behind the table between them, facing the viewer
 * (frontMediator from the mediation kit, read-only): she turns her head
 * towards whoever she listens to or speaks for. A notepad (the document)
 * lies on the table in front of her; she holds its left edge and writes
 * shorthand marks with a pen held in her right hand.
 *
 * Layers (back → front): interpreter body (cropped at the panel) · tabletop
 * · notepad and its marks · interpreter arms + pen · speaker A · speaker B ·
 * table front panel (and legs in full-body staging). Entries add bubbles,
 * the ribbon that links them, chips, keys and callouts on top.
 *
 * Speech: every bubble keeps its own speaker's tail. The source speaker's
 * bubble has its tail in front of that speaker's mouth; the interpreter's
 * rendering has its tail beside HER mouth. A ribbon links the two bubbles:
 * the interpreter connects them, she never becomes a party and never
 * replaces a speaker. Language tabs (glyph + supplied label) sit on each
 * bubble's top edge; the glyph stays when labels are hidden.
 *
 * The kit owns geometry, art and the pose solver; entries own timing,
 * editorial text layout and semantics. Attachment rules asserted through
 * semantics by the entry tests:
 *  - the pen is placed from the interpreter's SOLVED right hand (the nib
 *    target is the note stroke's path point while she writes);
 *  - `allReached`: every IK target is within arm reach.
 *
 * Legal content: fictional people, generic or supplied language labels,
 * jurisdiction unspecified, illustrative-unverified. Nothing here states or
 * implies that a rendering is accurate, faithful, certified, sufficient or
 * valid, and direct and interpreted communication are never ranked.
 * @module animations/roles/kits/interpretacion-linguistica
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {cubicPolyline, mix, polyline, roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf, party, RELATION_KINDS} from '../../../schemas/fields.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {changedMarker} from '../../../primitives/markers.js';
import {frontMediator} from './mediation-props.js';
import {fitWords, wchip, overlaps, noteCallout} from './mediation-labels.js';
import {freeSpot, gridCands, segHits, keyChip, flap} from './entrevista-a-cliente.js';
import {runTrack} from './mediation-table.js';

export {fitWords, wchip, overlaps, noteCallout, freeSpot, gridCands, segHits, keyChip, flap, runTrack};

const INK = '#1f2328';

/* ------------------------------------------------------------------ fields */

/** Person ids used by relationships (speaker A, speaker B, interpreter). */
export const INTERP_ACTORS = ['a', 'b', 'interpreter'];

const relationship = obj('A relationship between two of the three people', {
  from: oneOf('Source person', INTERP_ACTORS),
  to: oneOf('Target person', INTERP_ACTORS),
  kind: oneOf('relation | communication | sequence | causal. A sequence link between the two speakers sets who speaks first (its "from"); the interpreter then renders towards the other speaker. Other kinds are descriptive only', RELATION_KINDS),
}, ['from', 'to', 'kind']);

/** Category fields (roles) specialised for this motif. */
export const interpFields = {
  actors: list('Speaker A, speaker B and the interpreter, in this order (fictional people)', party, 3, 3),
  roles: obj('Descriptive role captions (never a legal finding)', {
    a: str('Role caption for speaker A', 40),
    b: str('Role caption for speaker B', 40),
    interpreter: str('Role caption for the interpreter', 40),
  }),
  relationships: list('Explicit relationships between the people. A sequence link between the two speakers sets who speaks first', relationship, 1, 5),
};

/** Language labels (as supplied; generic by default). */
export const languagesField = obj('Language labels, exactly as supplied (generic by default; nothing is assumed about any real language)', {
  a: str('Language label of speaker A', 40),
  b: str('Language label of speaker B', 40),
});

export const INTERP_DEFAULTS = {
  actors: [
    {name: 'Lucía Ferrer', role: 'Speaker A'},
    {name: 'Daniel Mensah', role: 'Speaker B'},
    {name: 'Aiko Tanaka', role: 'Interpreter'},
  ],
  roles: {a: 'Speaker A', b: 'Speaker B', interpreter: 'Interpreter'},
  relationships: [
    {from: 'a', to: 'interpreter', kind: 'communication'},
    {from: 'interpreter', to: 'b', kind: 'communication'},
    {from: 'a', to: 'b', kind: 'sequence'},
  ],
  languages: {a: 'Language 1', b: 'Language 2'},
};

/** Built-in strings shared by the four entries. */
export const KIT_STRINGS = {
  en: {
    key: 'As supplied · no conclusion\u00a0drawn',
    wordsGiven: 'Words given and noted',
    renderingGiven: 'Rendering given (as\u00a0supplied)',
    sameSpeaker: 'Same speaker',
  },
  es: {
    key: 'Según lo aportado · sin\u00a0conclusión',
    wordsGiven: 'Palabras dichas y anotadas',
    renderingGiven: 'Interpretación dada (según lo\u00a0aportado)',
    sameSpeaker: 'Mismo hablante',
  },
};

/**
 * Who speaks first: the `from` of the first sequence link between the two
 * speakers. Defaults to speaker A.
 * @param {Array<{from:string,to:string,kind:string}>} relationships
 * @returns {'a'|'b'}
 */
export function firstSpeaker(relationships) {
  const seq = (relationships || []).find(q => q.kind === 'sequence' && q.from !== q.to && q.from !== 'interpreter' && q.to !== 'interpreter');
  return seq && seq.from === 'b' ? 'b' : 'a';
}

const IDX = {a: 0, b: 1, interpreter: 2};

/** Role caption of a person, falling back to the party's own role. */
export function roleOf(p, id) {
  return (p.roles && p.roles[id]) || (p.actors[IDX[id]] && p.actors[IDX[id]].role) || '';
}

/** Chip caption "Name · role". */
export function captionOf(p, id, override) {
  const role = override || roleOf(p, id);
  const name = p.actors[IDX[id]].name;
  return role ? `${name} · ${role}` : name;
}

/** Width of the widest unbreakable token of a (glued) label: the least width that keeps "Language 2" on one line. */
export function tokenWidth(ctx, text, size, weight = 700) {
  const toks = String(glueTail(text) ?? '').split(' ');
  return Math.max(0, ...toks.map(t => ctx.measure(t.replace(/\u00a0/g, ' '), size, weight, 'sans')));
}

/** Keep a short last token (a number, a letter) on the line of the word before it: "Language\u00a02". */
export const glueTail = t => String(t ?? '').replace(/ (\S{1,3})$/, '\u00a0$1');

/* --------------------------------------------------------------- languages */

export const LANG_GLYPHS = ['disc', 'diamond', 'square', 'hex'];

/** Neutral identity colour of language slot i (never red/green state colours). */
export function langColor(ctx, i) {
  const th = ctx.theme;
  return [th.accent2, th.cloth[3], th.cloth[7], th.accent3][i % 4];
}

/**
 * A language glyph: a plain geometric shape (no tick, cross or warning sign).
 * @param {string} kind
 */
export function langGlyph(kind, cx, cy, R, fill, name) {
  const s = R;
  let d;
  if (kind === 'diamond') d = `M${r(cx)} ${r(cy - s * 1.18)}L${r(cx + s * 1.18)} ${r(cy)}L${r(cx)} ${r(cy + s * 1.18)}L${r(cx - s * 1.18)} ${r(cy)}Z`;
  else if (kind === 'square') d = roundRectPath(r(cx - s * 0.9), r(cy - s * 0.9), r(s * 1.8), r(s * 1.8), r(s * 0.25));
  else if (kind === 'hex') {
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = (Math.PI / 3) * i; pts.push(`${r(cx + Math.cos(a) * s * 1.08)} ${r(cy + Math.sin(a) * s * 1.08)}`); }
    d = `M${pts.join('L')}Z`;
  }
  if (!d) return h('circle', {name, cx: r(cx), cy: r(cy), r: r(s), fill, stroke: INK, 'stroke-width': 2});
  return h('path', {name, d, fill, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'});
}

/* ------------------------------------------------------------------ bubble */

/**
 * Measure a speech bubble of width w: language tab (glyph + label) on the top
 * edge and the supplied text. Geometry never depends on label visibility.
 * @param {any} ctx
 * @param {{w:number, text:string, tab:string, S:number, minS:number, maxLines?:number, tabS?:number}} o
 */
export function measureBubble(ctx, o) {
  const pad = o.S * 0.62;
  const text = fitWords(o.text || '—', {maxWidth: o.w - pad * 2, size: o.S, minSize: o.minS, maxLines: o.maxLines ?? 5, weight: 600});
  const tabS = o.tabS ?? Math.max(o.minS, o.S * 0.86);
  const glyphR = tabS * 0.36;
  const tabPadX = tabS * 0.5;
  let tabMax = Math.max(o.w * (o.tabFrac ?? 0.62), Math.min(o.w - pad * 1.2, 150));
  // (opt-in) never narrower than the widest glued token, so "Language 2" is never split
  if (o.keepTokens) tabMax = Math.max(tabMax, tokenWidth(ctx, o.tab, tabS) + tabPadX * 2 + glyphR * 2 + tabS * 0.4 + 2);
  const tabText = fitWords(glueTail(o.tab) || '—', {maxWidth: tabMax - tabPadX * 2 - glyphR * 2 - tabS * 0.4, size: tabS, minSize: Math.min(tabS, o.minS), maxLines: o.tabLines ?? 3, weight: 700});
  const tabH = tabText.height + tabS * 0.6;
  const tabW = tabText.width + tabPadX * 2 + glyphR * 2 + tabS * 0.4;
  const top = tabH * 0.5 + pad * 0.55;
  const hh = top + text.height + pad;
  return {w: o.w, h: hh, pad, text, tabText, tabS, tabH, tabW, glyphR, tabPadX, top, truncated: text.truncated || tabText.truncated, S: o.S};
}

/**
 * Speech bubble (body + tail + language tab + text). Local coordinates are
 * design units. `y` is the top of the BODY; the tab rises tabH/2 above it.
 * The tail leaves the bottom edge and ends at `tip` (just beside a mouth).
 * With labels shown, the text appears together with the bubble; with labels
 * hidden, speech lines of the same geometry are drawn instead.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, M:ReturnType<typeof measureBubble>, tip:{x:number,y:number}, tailX?:number,
 *   lang:{color:string, glyph:string}, showText:boolean, tabSide?:'left'|'right', stroke?:string, zw?:boolean}} o
 */
export function speakBubble(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const M = o.M;
  const {x, y} = o;
  const w = M.w, hh = M.h;
  const rr = Math.min(28, hh * 0.3);
  const bw = Math.min(46, w * 0.16);
  const tip = o.tip;
  const bx = clamp(o.tailX ?? tip.x, x + rr + bw / 2 + 4, x + w - rr - bw / 2 - 4);
  // the tail leaves the bottom edge, or the top edge when the speaker is above the bubble
  const up = tip.y < y;
  const yb = up ? y : y + hh;
  const sgn = up ? -1 : 1;
  const stroke = o.stroke ?? '#3b4450';
  const body = roundRectPath(r(x), r(y), r(w), r(hh), rr);
  const tail = `M${r(bx - bw / 2)} ${r(yb - 2 * sgn)}L${r(tip.x)} ${r(tip.y)}L${r(bx + bw / 2)} ${r(yb - 2 * sgn)}Z`;
  const bl = {x: bx - bw / 2, y: yb}, br = {x: bx + bw / 2, y: yb};
  const pl = mix(bl, tip, 0.34), prr = mix(br, tip, 0.34);
  // seam patch: fill only, inset from the tail's sides, hides the body stroke across the tail base
  const inset = 3.2;
  const patch = `M${r(bl.x + inset)} ${r(yb - 4 * sgn)}L${r(br.x - inset)} ${r(yb - 4 * sgn)}L${r(prr.x - inset * 0.6)} ${r(prr.y)}L${r(pl.x + inset * 0.6)} ${r(pl.y)}Z`;
  const zw = s => (o.zw ? `​${s}` : s);
  const zf = f => (o.zw ? {...f, lines: f.lines.map(l => zw(l))} : f);
  // language tab
  const tabLeft = o.tabSide === 'right' ? x + w - M.pad * 0.6 - M.tabW : x + M.pad * 0.6;
  const tabW = o.showText ? M.tabW : M.glyphR * 2 + M.tabPadX * 2;
  const tx = o.tabSide === 'right' ? x + w - M.pad * 0.6 - tabW : tabLeft;
  const ty = y - M.tabH * 0.5;
  const tabParts = [
    h('path', {d: roundRectPath(r(tx), r(ty), r(tabW), r(M.tabH), Math.min(M.tabH / 2, 14)), fill: th.card, stroke: o.lang.color, 'stroke-width': 3}),
    langGlyph(o.lang.glyph, tx + M.tabPadX + M.glyphR, ty + M.tabH / 2, M.glyphR, o.lang.color, `${N}-glyph`),
  ];
  if (o.showText) tabParts.push(textBlock(zf(M.tabText), {x: tx + M.tabPadX + M.glyphR * 2 + M.tabS * 0.4, y: ty + (M.tabH - M.tabText.height) / 2, fill: th.ink, name: `${N}-tabtxt`}));
  // content
  let content;
  if (o.showText) content = textBlock(zf(M.text), {x: x + M.pad, y: y + M.top, fill: th.ink, name: `${N}-txt`});
  else {
    const lw = Math.max(8, M.S * 0.5);
    content = g(null, M.text.lines.map((ln, j) => {
      const len = (w - M.pad * 2) * (j === M.text.lines.length - 1 ? 0.45 + 0.25 * ctx.rng(`${N}-l`, j) : 0.82 + 0.16 * ctx.rng(`${N}-l`, j));
      const ly = y + M.top + j * M.text.lineHeight + M.text.size * 0.45;
      return h('line', {x1: r(x + M.pad), x2: r(x + M.pad + len), y1: r(ly), y2: r(ly), stroke: th.inkSoft, 'stroke-width': r(lw), 'stroke-linecap': 'round', opacity: 0.75});
    }));
  }
  const node = g({name: N, opacity: 0},
    h('path', {d: body, fill: th.shadow, transform: T(6, 8)}),
    h('path', {d: tail, fill: th.shadow, transform: T(6, 8)}),
    h('path', {name: `${N}-tail`, d: tail, fill: th.card, stroke, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    h('path', {name: `${N}-body`, d: body, fill: th.card, stroke, 'stroke-width': 3, 'data-body': 1}),
    h('path', {d: patch, fill: th.card}),
    o.noTab ? null : g({name: `${N}-tab`}, tabParts),
    content,
  );
  const box = {x, y: ty, w, h: y + hh - ty};
  return {
    node, tip, box, body: {x, y, w, h: hh},
    tab: {x: tx, y: ty, w: tabW, h: M.tabH},
    textBox: {x: x + M.pad, y: y + M.top, w: M.text.width, h: M.text.height},
    tailBase: {x: bx, y: yb},
    /**
     * @param {number} open 0..1 grows from the tail tip; text shown with it
     * @param {boolean} reduced
     */
    frame(open, reduced) {
      // no overshoot: the bubble never grows past its final outline (it sits close to faces)
      const kk = open <= 0 ? 0.3 : 0.3 + 0.7 * ease.outCubic(open);
      // grows out of the tail's base (never sweeps over the speaker's face on its way)
      return {[N]: {opacity: r(clamp(open * 2.5), 3), transform: open >= 1 ? '' : scaleAbout(bx, yb, kk)}};
    },
  };
}

/* ------------------------------------------------------------------ ribbon */

/**
 * The ribbon that links the source bubble to the rendering bubble: a banded
 * cubic drawn on progressively, a dot at its start and an arrowhead at its end
 * (a sequence: first the words, then their rendering).
 * @param {any} ctx
 * @param {{name:string, from:{x:number,y:number}, to:{x:number,y:number}, c1:{x:number,y:number}, c2:{x:number,y:number}, color:string, width?:number}} o
 */
export function ribbon(ctx, o) {
  const th = ctx.theme;
  const wdt = o.width ?? 8;
  const head = wdt * 2.6;
  const full = cubicPolyline(o.from, o.c1, o.c2, o.to, 80);
  // stop the band short of the edge so the arrowhead's tip lands on it
  const endT = 1 - head * 0.8 / Math.max(1, full.total);
  const pts = full.pts.filter((_, i) => i / 80 <= endT);
  const poly = polyline(pts);
  const d = poly.d(1);
  const total = poly.total;
  const end = full.at(1);
  const ang = Math.atan2(end.y - poly.at(1).y, end.x - poly.at(1).x);
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-out`, d, fill: 'none', stroke: INK, 'stroke-width': wdt + 5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    h('path', {name: `${o.name}-in`, 'data-conn': o.conn ?? o.name, d, fill: 'none', stroke: o.color, 'stroke-width': wdt, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 20)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {cx: r(o.from.x), cy: r(o.from.y), r: r(wdt * 0.95), fill: o.color, stroke: INK, 'stroke-width': 2.5}),
    h('path', {name: `${o.name}-head`, d: `M0 0L${r(-head)} ${r(-head * 0.62)}L${r(-head * 0.72)} 0L${r(-head)} ${r(head * 0.62)}Z`, fill: o.color, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round', transform: T(end.x, end.y, (ang * 180) / Math.PI), opacity: 0}),
  );
  return {
    node, poly: full, total, from: o.from, to: o.to,
    frame(p) {
      const off = r(total * (1 - clamp(p)));
      return {
        [o.name]: {opacity: p > 0 ? 1 : 0},
        [`${o.name}-out`]: {'stroke-dashoffset': off},
        [`${o.name}-in`]: {'stroke-dashoffset': off},
        [`${o.name}-head`]: {opacity: p >= 0.985 ? 1 : 0},
      };
    },
  };
}

/* ------------------------------------------------------------------- stage */

/** Person-local geometry (units × k, origin = speaker A's seat point). */
export const ISTAGE = {
  tableFar: -114, tableNear: -30,
  // interpreter: shoulder line and scale relative to k (head ≈ the speakers' size)
  yS: -178, zI: 0.8,
  restNearA: {x: 84, y: -46}, restFarA: {x: 66, y: -66},
  gestureA: {x: 128, y: -100},
  pad: {w: 214, far: -108, near: -38, inset: 12},
};

/**
 * Interpretation table stage.
 * @param {any} ctx
 * @param {{prefix:string, k:number, A:{x:number,y:number}, X:number, crop:number, actors:any[], floor?:boolean, panelLocal?:number,
 *   looks?:any[], withInterpreter?:boolean, padLabel?:any, padW?:number, strokes?:number, gesture?:{x:number,y:number}}} o
 *   A: speaker A's seat point (design units); X: speaker B's seat offset (person-local units);
 *   crop: person-local y of the panel bottom; padLabel: a fitWords result drawn on the pad's header (or null).
 */
export function interpStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const k = o.k;
  const A = o.A;
  const X = o.X;
  const Lx = lx => A.x + lx * k;
  const Ly = ly => A.y + ly * k;
  const L = q => ({x: Lx(q.x), y: Ly(q.y)});
  const hipA = {x: A.x, y: A.y};
  const hipB = {x: Lx(X), y: A.y};
  const looks = o.looks || [0, 1, 2].map(i => actorLook(ctx, o.actors[i], i));
  const rigA = personRig(ctx, {name: `${P}-A`, look: looks[0], pose: 'seated'});
  const rigB = personRig(ctx, {name: `${P}-B`, look: looks[1], pose: 'seated'});
  const withI = o.withInterpreter !== false;
  const rigI = frontMediator(ctx, {name: `${P}-I`, look: looks[2], penSide: 'r'});
  // (opt-in: o.yS / o.zI place the interpreter lower / smaller; defaults keep the original staging)
  const sI = (o.zI ?? ISTAGE.zI) * k;
  const shI = L({x: X / 2, y: o.yS ?? ISTAGE.yS});

  // --- table
  const x0 = Lx(-26), x1 = Lx(X + 26);
  // (opt-in o.table = {far, near}: a shallower tabletop; the pad and the resting hands follow it)
  const tFar = o.table ? o.table.far : ISTAGE.tableFar, tNear = o.table ? o.table.near : ISTAGE.tableNear;
  const yFar = Ly(tFar), yNear = Ly(tNear);
  const inset = 22 * k;
  const edge = 9 * k;
  const yBottom = Ly(o.crop);
  const grain = [];
  for (let i = 0; i < 4; i++) {
    const gy = yFar + ((i + 0.7) / 4.6) * (yNear - yFar);
    const wob = (3 + ctx.rng(`${P}-grain`, i) * 5) * k;
    grain.push(h('path', {d: `M${r(x0 + inset * 1.3)} ${r(gy)}C${r(lerp(x0, x1, 0.35))} ${r(gy - wob)} ${r(lerp(x0, x1, 0.65))} ${r(gy + wob)} ${r(x1 - inset * 1.3)} ${r(gy - wob * 0.3)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.5}));
  }
  const tabletop = g({name: `${P}-top`},
    h('path', {d: `M${r(x0 + inset)} ${r(yFar)}H${r(x1 - inset)}L${r(x1)} ${r(yNear)}H${r(x0)}Z`, fill: th.woodTop, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    grain,
    h('path', {d: `M${r(x0 + inset)} ${r(yFar + 4 * k)}H${r(x1 - inset)}`, stroke: '#fff', 'stroke-width': 3, opacity: 0.3}),
  );
  const panelTop = yNear + edge;
  const panelBottom = o.floor ? Ly(o.panelLocal ?? 58) : yBottom;
  const legW = 20 * k;
  const tableFront = g({name: `${P}-front`},
    o.floor ? h('ellipse', {cx: r((x0 + x1) / 2), cy: r(yBottom - 2 * k), rx: r((x1 - x0) * 0.62), ry: r(9 * k), fill: th.shadow}) : null,
    o.floor ? h('rect', {x: r(x0 + 10 * k), y: r(panelBottom - 4), width: r(legW), height: r(yBottom - panelBottom), rx: r(4 * k), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}) : null,
    o.floor ? h('rect', {x: r(x1 - 10 * k - legW), y: r(panelBottom - 4), width: r(legW), height: r(yBottom - panelBottom), rx: r(4 * k), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}) : null,
    h('path', {d: roundRectPath(x0, yNear, x1 - x0, edge, 3 * k), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x0 + 6 * k)} ${r(panelTop)}H${r(x1 - 6 * k)}V${r(panelBottom)}H${r(x0 + 6 * k)}Z`, fill: th.wood, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(x0 + 22 * k, panelTop + 12 * k, x1 - x0 - 44 * k, Math.max(4, panelBottom - panelTop - 24 * k), 8 * k), fill: shade(th.wood, -0.06), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
  );

  // --- notepad (the document), lying on the table in front of the interpreter
  const PD = o.table ? {...ISTAGE.pad, far: tFar + 6, near: tNear - 6} : ISTAGE.pad;
  const padW = (o.padW ?? PD.w);
  const pcx = X / 2;
  const pTL = L({x: pcx - padW / 2 + PD.inset, y: PD.far}), pTR = L({x: pcx + padW / 2 - PD.inset, y: PD.far});
  const pBR = L({x: pcx + padW / 2, y: PD.near}), pBL = L({x: pcx - padW / 2, y: PD.near});
  const padPath = `M${r(pTL.x)} ${r(pTL.y)}L${r(pTR.x)} ${r(pTR.y)}L${r(pBR.x)} ${r(pBR.y)}L${r(pBL.x)} ${r(pBL.y)}Z`;
  const lab = o.padLabel || null;
  // the heading band runs along the NEAR edge of the pad: the writing hand works above the nib, so it
  // never covers the heading
  const headerH = o.padLabelH ? o.padLabelH.height + 10 : 16 * k;
  const fAt = yy => (yy - pTL.y) / (pBL.y - pTL.y);
  const xlAt = yy => lerp(pTL.x, pBL.x, fAt(yy)), xrAt = yy => lerp(pTR.x, pBR.x, fAt(yy));
  const hy = pBL.y - headerH;
  const padParts = [
    h('path', {d: padPath, fill: th.shadow, transform: T(5, 6)}),
    // cardboard back peeking out
    h('path', {d: `M${r(pTL.x - 4)} ${r(pTL.y - 3)}L${r(pTR.x + 4)} ${r(pTR.y - 3)}L${r(pBR.x + 5)} ${r(pBR.y + 3)}L${r(pBL.x - 5)} ${r(pBL.y + 3)}Z`, fill: '#8a6f55', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: padPath, fill: th.paper, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(xlAt(hy))} ${r(hy)}L${r(xrAt(hy))} ${r(hy)}L${r(pBR.x)} ${r(pBR.y)}L${r(pBL.x)} ${r(pBL.y)}Z`, fill: th.accent2Soft, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
  ];
  // ruled lines (flattened) and a spiral binding along the far edge
  const topY = pTL.y + 7 * k;
  const ruleN = 3;
  for (let i = 0; i < ruleN; i++) {
    const yy = lerp(topY, hy, (i + 1) / (ruleN + 1));
    padParts.push(h('line', {x1: r(xlAt(yy) + 8), x2: r(xrAt(yy) - 8), y1: r(yy), y2: r(yy), stroke: th.paperLine, 'stroke-width': 1.4}));
  }
  const rings = Math.max(4, Math.round((pTR.x - pTL.x) / (22 * k)));
  for (let i = 0; i < rings; i++) {
    const cx = lerp(pTL.x + 10, pTR.x - 10, (i + 0.5) / rings);
    padParts.push(h('ellipse', {cx: r(cx), cy: r(pTL.y), rx: r(3.2 * k), ry: r(5 * k), fill: 'none', stroke: '#6b7580', 'stroke-width': 2}));
  }
  if (lab) padParts.push(textBlock(lab, {x: (xlAt(hy) + xrAt(hy)) / 2, y: hy + 5, anchor: 'middle', fill: th.ink, name: `${P}-padlabel`}));
  // shorthand marks written by the interpreter (abstract strokes; never text, ticks or crosses)
  const markArea = {x0: lerp(xlAt(topY), xrAt(topY), 0.34), x1: xrAt(topY) - 12 * k, y0: topY + 3 * k, y1: hy - 5 * k};
  const nStrokes = o.strokes ?? 3;
  const strokes = [];
  const rowH = (markArea.y1 - markArea.y0) / 2;
  for (let i = 0; i < nStrokes; i++) {
    const row = i < 2 ? 0 : 1;
    const col = i < 2 ? i : i - 2;
    const cw = (markArea.x1 - markArea.x0) / 2;
    const bx0 = markArea.x0 + col * cw + (row ? cw * 0.3 : 0);
    const by = markArea.y0 + row * rowH + rowH * 0.5;
    const pts = [];
    const n = 22;
    const kind = i % 3;
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      const xx = bx0 + t * cw * 0.82;
      let yy;
      if (kind === 0) yy = by + Math.sin(t * Math.PI * 3) * rowH * 0.28;
      else if (kind === 1) {
        // a small loop in the middle of a flat line
        const lt = clamp((t - 0.3) / 0.4);
        const a = lt * Math.PI * 2;
        yy = by - Math.sin(a) * rowH * 0.3;
        pts.push({x: xx - (lt > 0 && lt < 1 ? Math.sin(a) * cw * 0.08 : 0), y: yy});
        continue;
      } else yy = by + (t < 0.5 ? -1 : 1) * rowH * 0.22 * Math.sin(t * Math.PI * 2);
      pts.push({x: xx, y: yy});
    }
    strokes.push(polyline(pts));
  }
  const strokeNodes = strokes.map((poly, i) => h('path', {name: `${P}-note${i}`, d: poly.d(1), fill: 'none', stroke: '#1d3f8f', 'stroke-width': r(Math.max(2.4, 2.6 * k)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(poly.total)} ${r(poly.total + 10)}`, 'stroke-dashoffset': r(poly.total), opacity: 0}));
  const padNode = g({name: `${P}-pad`}, padParts, strokeNodes);
  const padBox = {x: pBL.x - 5, y: pTL.y - 6, w: pBR.x - pBL.x + 10, h: pBL.y - pTL.y + 12};

  // --- crops: speakers at the floor / panel bottom, the interpreter's body at the panel bottom
  const clipS = `${P}-crop`, clipI = `${P}-cropI`;
  const node = g({name: P},
    h('defs', null,
      h('clipPath', {id: ctx.id(clipS)}, h('rect', {x: r(Lx(-400)), y: r(Ly(-700)), width: r((X + 800) * k), height: r(yBottom - Ly(-700))})),
      h('clipPath', {id: ctx.id(clipI)}, h('rect', {x: r(Lx(-400)), y: r(Ly(-900)), width: r((X + 800) * k), height: r(panelBottom - Ly(-900))}))),
    withI ? g({'clip-path': ctx.ref(clipI)}, g({name: `${P}-Ibody`}, rigI.body)) : null,
    tabletop, padNode,
    withI ? g({name: `${P}-Iarms`}, rigI.arms) : null,
    g({'clip-path': ctx.ref(clipS)}, rigA.node, rigB.node),
    tableFront);

  // --- rest targets (world); on a shallower table the speakers' hands rest on it
  const restNear = o.table ? {x: ISTAGE.restNearA.x, y: tNear - 10} : ISTAGE.restNearA;
  const restFar = o.table ? {x: ISTAGE.restFarA.x, y: Math.max(tFar + 8, tNear - 26)} : ISTAGE.restFarA;
  const nearB = q => ({x: X - q.x, y: q.y});
  const rest = {
    nearA: L(restNear), farA: L(restFar), gestureA: L(o.gesture || ISTAGE.gestureA),
    nearB: L(nearB(restNear)), farB: L(nearB(restFar)), gestureB: L(nearB(o.gesture || ISTAGE.gestureA)),
    // interpreter: left hand holds the pad's left edge, the pen rests on its lower right
    leftI: {x: xlAt(topY + 12 * k) + 12 * k, y: topY + 12 * k},
    nibI: {x: xrAt(hy - 6 * k) - 30 * k, y: hy - 6 * k},
  };
  const penOff = rigI.penOffset(sI);

  /**
   * @param {object} s
   * @param {{near?:any, far?:any, lean?:number, mouth?:number, tilt?:number}} s.a  world targets
   * @param {{near?:any, far?:any, lean?:number, mouth?:number, tilt?:number}} s.b
   * @param {{tilt?:number, look?:number, mouth?:number, nib?:{x:number,y:number}|null, left?:{x:number,y:number}, open?:number, enter?:number}} [s.i]
   * @param {number[]} [s.notes]  drawing progress of each shorthand stroke
   */
  function pose(s) {
    const nodes = {};
    const pa = rigA.frame({x: hipA.x, y: hipA.y, facing: 1, scale: k, lean: s.a.lean || 0, mouth: s.a.mouth || 0, headTilt: s.a.tilt || 0, near: s.a.near || rest.nearA, far: s.a.far || rest.farA});
    const pb = rigB.frame({x: hipB.x, y: hipB.y, facing: -1, scale: k, lean: s.b.lean || 0, mouth: s.b.mouth || 0, headTilt: s.b.tilt || 0, near: s.b.near || rest.nearB, far: s.b.far || rest.farB});
    Object.assign(nodes, pa.nodes, pb.nodes);
    const si = s.i || {};
    let pi = null, pen = null;
    let reached = pa.reached && pb.reached;
    const enter = withI ? clamp(si.enter ?? 1) : 0;
    if (withI) {
      // entering (contrast): the interpreter comes forward from the back of the room to her seat, or
      // (opt-in enterMode 'seat') she is there whole and opaque from her first frame and settles into the seat
      const e = ease.inOutSine(enter);
      const seatMode = o.enterMode === 'seat';
      const sc = seatMode ? sI : sI * lerp(0.74, 1, e);
      const at = seatMode ? {x: shI.x, y: shI.y - (1 - e) * 14 * k} : {x: shI.x, y: shI.y - (1 - e) * 64 * k};
      const toW = q => ({x: at.x + q.x * sc, y: at.y + q.y * sc});
      const down = ease.inOutSine(clamp((enter - 0.72) / 0.28));
      const nib = si.nib || rest.nibI;
      const seatR = {x: nib.x + penOff.x, y: nib.y + penOff.y};
      const right = enter >= 1 ? seatR : mix(toW({x: 58, y: 86}), seatR, down);
      const left = enter >= 1 ? (si.left || rest.leftI) : mix(toW({x: -58, y: 90}), si.left || rest.leftI, down);
      pi = rigI.frame({x: at.x, y: at.y, scale: sc, left, right, look: si.look || 0, tilt: si.tilt || 0, mouth: si.mouth || 0, penTip: enter >= 1 ? nib : null, open: {l: si.open || 0}});
      Object.assign(nodes, pi.nodes);
      const vis = seatMode ? (enter > 0 ? 1 : 0) : r(clamp(enter / 0.3), 3);
      nodes[`${P}-Ibody`] = {opacity: vis};
      nodes[`${P}-Iarms`] = {opacity: vis};
      pen = pi.pen;
      reached = reached && pi.reached;
    }
    strokes.forEach((poly, i) => {
      const p = clamp((s.notes && s.notes[i]) || 0);
      nodes[`${P}-note${i}`] = {'stroke-dashoffset': r(poly.total * (1 - p)), opacity: p > 0 ? 1 : 0};
    });
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    return {
      nodes, pa, pb, pi,
      semantic: {
        handA: P2(pa.hands.near), farA: P2(pa.hands.far),
        handB: P2(pb.hands.near), farB: P2(pb.hands.far),
        handIL: withI ? P2(pi.hands.l) : null, handIR: withI ? P2(pi.hands.r) : null,
        pen: withI ? P2(pen) : null,
        allReached: reached,
        entered: r(enter, 3),
      },
    };
  }

  // anchors (seated side rig: head centre (5,-176) r 36, mouth (35,-156))
  const headA = L({x: 5, y: -176}), headB = L({x: X - 5, y: -176});
  const mouthA = L({x: 38, y: -154}), mouthB = L({x: X - 38, y: -154});
  // speech-tail tips just in front of the mouth, clear of the face
  const tipA = L({x: 66, y: -134}), tipB = L({x: X - 66, y: -134});
  // interpreter (front view, local units × sI from the shoulder centre): head (0,-92) r 44, mouth (0,-70)
  const headI = {x: shI.x, y: shI.y - 92 * sI};
  const mouthI = {x: shI.x, y: shI.y - 70 * sI};
  const tipI = side => ({x: shI.x + side * 60 * sI, y: shI.y - 58 * sI});
  const headR = 36 * k, headRI = 44 * sI;
  /** world boxes of faces + hair (bubbles, cards and labels must never cover them) */
  const faceBox = id => {
    // (wide enough for any hair style, with the head tilted towards either speaker)
    if (id === 'i') return {x: headI.x - 64 * sI, y: headI.y - 64 * sI, w: 128 * sI, h: 112 * sI};
    const hc = id === 'a' ? headA : headB;
    // curly / bun hair rises ~58 units above the head centre; heads tilt a little
    return {x: hc.x - 52 * k, y: hc.y - 62 * k, w: 104 * k, h: 102 * k};
  };
  return {
    node, pose, looks, rest, strokes, padBox, markArea,
    hipA, hipB, shI, sI, headA, headB, headI, mouthA, mouthB, mouthI, tipA, tipB, tipI, headR, headRI,
    faceBox, withI,
    /** is a speech-tail tip clear of a side-view face (≥ 60 units from the head centre, level with the lips)? */
    tipClear: (tip, who) => {
      if (who === 'i') {
        const d = Math.hypot(tip.x - headI.x, tip.y - headI.y) / sI;
        return d >= 52 && tip.y >= mouthI.y - 12 * sI;
      }
      const hc = who === 'a' ? headA : headB;
      return Math.hypot(tip.x - hc.x, tip.y - hc.y) / k >= 60 && tip.y > hc.y + 20 * k;
    },
    /** does a straight tail from (x,y) to tip cross a head circle (+margin)? */
    tailHitsHead: (from, tip, who, margin = 6) => {
      const hc = who === 'i' ? headI : who === 'a' ? headA : headB;
      const R = (who === 'i' ? 50 * sI : 40 * k) + margin;
      for (let i = 0; i <= 30; i++) {
        const q = mix(from, tip, i / 30);
        if (Math.hypot(q.x - hc.x, q.y - hc.y) < R) return true;
      }
      return false;
    },
    table: {x0, x1, yFar, yNear, panelTop, panelBottom, yBottom},
    /** world box of each seated speaker above the table */
    personBox: id => (id === 'a'
      ? {x: Lx(-66), y: Ly(-230), w: 216 * k, h: yNear - Ly(-230)}
      : {x: Lx(X - 150), y: Ly(-230), w: 216 * k, h: yNear - Ly(-230)}),
    /** interpreter above the table (head, shoulders, arms) */
    interpBox: () => ({x: shI.x - 110 * sI, y: headI.y - 60 * sI, w: 220 * sI, h: yFar - (headI.y - 60 * sI)}),
    chairBoxes: () => [{x: Lx(-70), y: yNear, w: x0 - Lx(-70), h: yBottom - yNear}, {x: x1, y: yNear, w: Lx(X + 70) - x1, h: yBottom - yNear}],
    Lx, Ly, L, k, X,
  };
}

/** Distance from point q to the segment a→b. */
export function segDist(q, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((q.x - a.x) * dx + (q.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(a.x + dx * t - q.x, a.y + dy * t - q.y);
}

/** Point-to-box distance (0 inside). */
export function boxDist(q, b) {
  return Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h));
}

/**
 * Side-by-side exchange above a stage (first speaker = A on the left): A's bubble above A and left of
 * the interpreter's face; the rendering right of her face and above B; the ribbon arcs over her head
 * from A's bubble to the rendering. Pure geometry + nodes; entries decide what is shown and when.
 * @param {any} ctx
 * @param {{st:any, S:number, minS:number, region:{x:number,y:number,w:number,h:number}, utterance:string, rendering:string,
 *   langS:string, langD:string, showText:boolean, bubMax:number, prefix?:string, maxLines?:number, gapFace?:number, zw?:boolean}} o
 */
export function placeExchange(ctx, o) {
  const st = o.st;
  const P = o.prefix ?? '';
  const G = o.region;
  const problems = [];
  const fa = st.faceBox('a'), fbB = st.faceBox('b'), fi = st.faceBox('i');
  const gapFace = o.gapFace ?? 16;
  const tipS = st.tipA, tipI = st.tipI(1);
  const sRight = fi.x - gapFace;
  const Sw = Math.min(o.bubMax, sRight - G.x - 6);
  const Sx = sRight - Sw;
  const Rx = fi.x + fi.w + gapFace;
  const Rw = Math.min(o.bubMax, G.x + G.w - 6 - Rx);
  if (Sw < 140 || Rw < 140) problems.push('bubble-narrow');
  // with labels hidden the bubbles hold at most a few speech lines (no text to fit)
  const cut = t => (o.showText ? t : String(t).slice(0, 64));
  const MS = measureBubble(ctx, {w: Math.max(60, Sw), text: cut(o.utterance), tab: o.showText ? o.langS : '', S: o.S, minS: o.minS, maxLines: o.maxLines ?? 5, tabS: o.tabS});
  const MR = measureBubble(ctx, {w: Math.max(60, Rw), text: cut(o.rendering), tab: o.showText ? o.langD : '', S: o.S, minS: o.minS, maxLines: o.maxLines ?? 5, tabS: o.tabS});
  if (MS.truncated || MR.truncated) problems.push(`bubble-truncated(${MS.text.truncated ? 'S' : ''}${MS.tabText.truncated ? 's' : ''}${MR.text.truncated ? 'R' : ''}${MR.tabText.truncated ? 'r' : ''}${Math.round(Sw)}/${Math.round(Rw)})`);
  const Sb = Math.min(fa.y - 10, tipS.y - 34);
  const Rb = Math.min(fbB.y - 10, tipI.y - 34);
  const Sy = Sb - MS.h, Ry = Rb - MR.h;
  const lS = {color: langColor(ctx, 0), glyph: LANG_GLYPHS[0]};
  const lD = {color: langColor(ctx, 1), glyph: LANG_GLYPHS[1]};
  const bubS = speakBubble(ctx, {name: `${P}bubS`, x: Sx, y: Sy, M: MS, tip: tipS, tailX: tipS.x + 10 * st.k, lang: lS, showText: o.showText, tabSide: 'left', zw: o.zw});
  const bubR = speakBubble(ctx, {name: `${P}bubR`, x: Rx, y: Ry, M: MR, tip: tipI, tailX: Rx + Math.min(70, Rw * 0.2), lang: lD, showText: o.showText, tabSide: 'right', zw: o.zw, noTab: o.noTabR});
  // the ribbon leaves the first bubble's top edge right of its language tab
  // (a long tab fills the top edge: then the ribbon leaves from the bubble's right edge, going straight up)
  const topStart = Math.max(Sx + Sw - 46, bubS.tab.x + bubS.tab.w + 22) <= Sx + Sw - 14;
  const rf = topStart ? {x: Math.max(Sx + Sw - 46, bubS.tab.x + bubS.tab.w + 22), y: Sy} : {x: Sx + Sw, y: Sy + Math.min(MS.h * 0.3, 22)};
  const rt = {x: Math.min(Rx + 46, Rx + Rw - MR.tabW - MR.pad * 0.6 - 30), y: Ry - 1};
  const lift = Math.max(70, (Math.max(rf.y, rt.y) - fi.y + 24) / 0.75);
  const ribSpec = {from: rf, to: rt, c1: {x: rf.x + (topStart ? 34 : 6), y: Math.min(rf.y, Sy) - lift}, c2: {x: rt.x - 34, y: rt.y - lift}};
  const rib = ribbon(ctx, {name: `${P}rib`, ...ribSpec, color: lS.color, conn: `${P}rib`});
  const faces = [fa, fbB, fi];
  for (const bb of [bubS.box, bubR.box]) if (faces.some(f => overlaps(bb, f, 2))) problems.push('bubble-face');
  if (!st.tipClear(tipS, 'a') || st.tailHitsHead(bubS.tailBase, tipS, 'a', 0)) problems.push('tail-S');
  if (!st.tipClear(tipI, 'i') || st.tailHitsHead(bubR.tailBase, tipI, 'i', 2)) problems.push('tail-R');
  const pts = rib.poly.pts;
  if (faces.some(f => pts.some(q => q.x > f.x && q.x < f.x + f.w && q.y > f.y && q.y < f.y + f.h))) problems.push('ribbon-face');
  const inBox = (q, b, m = 4) => q.x > b.x - m && q.x < b.x + b.w + m && q.y > b.y - m && q.y < b.y + b.h + m;
  if (pts.some(q => [bubS.textBox, bubR.textBox, bubS.tab, bubR.tab].some(b => inBox(q, b)))) problems.push('ribbon-text');
  const ribBB = (() => {
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    return {x: Math.min(...xs) - 8, y: Math.min(...ys) - 8, w: Math.max(...xs) - Math.min(...xs) + 16, h: Math.max(...ys) - Math.min(...ys) + 16};
  })();
  return {MS, MR, bubS, bubR, rib, ribSpec, ribBB, lS, lD, tipS, tipI, faces, problems,
    top: Math.min(bubS.box.y, bubR.box.y, ribBB.y, fi.y), sBox: {x: Sx, y: Sy, w: Sw, h: MS.h}, rBox: {x: Rx, y: Ry, w: Rw, h: MR.h}};
}

/**
 * A language tab whose value is substituted: the old row (glyph + label) is struck through in grey and
 * stays readable; the tab grows upward and a new row (the supplied new label, a different glyph and
 * colour — the dependent state) appears above it. Local coordinates = the context's (a lens copy is
 * built with the same geometry and zero-width marks on its texts).
 * @param {any} ctx
 * @param {{name:string, tab:{x:number,y:number,w:number,h:number}, M:any, oldText:string, newText:string, oldLang:{color:string,glyph:string},
 *   newLang:{color:string,glyph:string}, showText:boolean, zw?:boolean, marker?:{r:number}|null, maxW:number}} o
 */
export function langTabSwap(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const M = o.M;
  const size = M.tabS;
  const zw = s => (o.zw ? `\u200B${s}` : s);
  const fitT = t => fitWords(glueTail(t) || '—', {maxWidth: o.maxW, size, minSize: size, maxLines: 3, weight: 700});
  const fOld = fitT(o.oldText), fNew = fitT(o.newText);
  const zf = f => (o.zw ? {...f, lines: f.lines.map(zw)} : f);
  const gR = M.glyphR, px = M.tabPadX;
  const rowW = f => (o.showText ? f.width + px * 2 + gR * 2 + size * 0.4 : gR * 2 + px * 2);
  const rowH = f => Math.max(M.tabH, f.height + size * 0.6);
  const h0 = rowH(fOld), h1 = rowH(fNew);
  const T0 = o.tab;
  // the tab keeps its right edge (it sits at the bubble's top-right)
  const right = T0.x + T0.w;
  const w0 = rowW(fOld), w1 = Math.max(w0, rowW(fNew));
  const yOld = T0.y + T0.h - h0; // old row sits where the tab was
  const yNew = yOld - h1;
  const box0 = {x: right - w0, y: yOld, w: w0, h: h0};
  const box1 = {x: right - w1, y: yNew, w: w1, h: h0 + h1};
  const rad = Math.min(h0 / 2, 14);
  const row = (f, y, hh, lang, name, color) => g({name},
    langGlyph(lang.glyph, right - w1 + px + gR, y + hh / 2, gR, lang.color, `${name}-glyph`),
    o.showText ? textBlock(zf(f), {x: right - w1 + px + gR * 2 + size * 0.4, y: y + (hh - f.height) / 2, fill: color, name: `${name}-txt`}) : null);
  // before the change the old row sits at the right edge like the original tab; it slides to the new
  // left edge (w1) with the outline as the tab widens
  const strikeW = o.showText ? fOld.width + 10 : gR * 2 + 10;
  const sx = right - w1 + px + (o.showText ? gR * 2 + size * 0.4 - 5 : -5);
  const sy = yOld + h0 / 2 + (o.showText ? 1 : 0);
  const newRow = row(fNew, yNew, h1, o.newLang, `${N}-new`, th.ink);
  let strikes = [{y: sy, w: strikeW}], extraStrikes = [];
  if (o.strikeEach && o.showText && fOld.lines.length > 1) {
    const top0 = yOld + (h0 - fOld.height) / 2;
    strikes = fOld.lines.map((ln, i) => ({y: top0 + i * fOld.lineHeight + size / 2 + 1, w: ctx.measure(String(ln).replace(/\u00a0/g, ' '), size, 700, 'sans') + 10}));
    extraStrikes = strikes.slice(1);
  }
  const sy0 = strikes[0].y, sw0 = strikes[0].w;
  const mk = o.marker ? {x: right + o.marker.r + 8, y: yNew + h1 / 2, r: o.marker.r} : null;
  const node = g({name: N},
    h('path', {name: `${N}-bg`, d: roundRectPath(box0.x, box0.y, box0.w, box0.h, rad), fill: th.card, stroke: o.oldLang.color, 'stroke-width': 3}),
    h('path', {name: `${N}-bg2`, d: roundRectPath(box1.x, box1.y, box1.w, box1.h, rad), fill: 'none', stroke: o.newLang.color, 'stroke-width': 3, opacity: 0}),
    g({name: `${N}-newg`, opacity: 0}, newRow),
    g({name: `${N}-oldpos`}, row(fOld, yOld, h0, o.oldLang, `${N}-old`, th.ink),
    h('line', {name: `${N}-strike`, x1: r(sx), x2: r(sx + sw0), y1: r(sy0), y2: r(sy0), stroke: th.inkSoft, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(sw0)} ${r(sw0 + 10)}`, 'stroke-dashoffset': r(sw0), opacity: 0}),
    // (opt-in o.strikeEach: a wrapped old value gets one strike through the middle of EACH of its lines)
    ...extraStrikes.map((q, i) => h('line', {name: `${N}-strike${i + 1}`, x1: r(sx), x2: r(sx + q.w), y1: r(q.y), y2: r(q.y), stroke: th.inkSoft, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(q.w)} ${r(q.w + 10)}`, 'stroke-dashoffset': r(q.w), opacity: 0}))),
    mk ? changedMarker(ctx, {name: `${N}-mk`, x: mk.x, y: mk.y, radius: mk.r, opacity: 0}) : null,
  );
  return {
    node, box0, box1, mk, fOld, fNew, yNew, h1, strikes, strikeX: sx,
    /** full extent after the change (tab + marker) */
    extent: {x: box1.x, y: box1.y, w: box1.w + (mk ? mk.r * 2 + 10 : 0), h: box1.h},
    /** @param {{strike:number, old:number, grow:number, reveal:number, marker?:number}} s */
    frame(s) {
      const gw = clamp(s.grow);
      const top = lerp(box0.y, box1.y, gw), wd = lerp(w0, w1, gw);
      const hh = box0.y + box0.h - top;
      return {
        [`${N}-bg`]: {d: roundRectPath(r(right - wd), r(top), r(wd), r(hh), rad), stroke: gw > 0.5 ? th.inkSoft : o.oldLang.color},
        [`${N}-bg2`]: {opacity: r(clamp(s.reveal), 3)},
        [`${N}-newg`]: {opacity: r(clamp(s.reveal), 3)},
        // the old row (and its strike) keeps to the tab's left edge while the tab widens
        [`${N}-oldpos`]: {transform: T(r(w1 - wd), 0)},
        [`${N}-old`]: {opacity: r(s.old, 3)},
        [`${N}-strike`]: {'stroke-dashoffset': r(sw0 * (1 - clamp(s.strike))), opacity: s.strike > 0 ? 1 : 0},
        ...Object.fromEntries(extraStrikes.map((q, i) => [`${N}-strike${i + 1}`, {'stroke-dashoffset': r(q.w * (1 - clamp(s.strike))), opacity: s.strike > 0 ? 1 : 0}])),
        ...(mk ? {[`${N}-mk`]: {opacity: r(clamp(s.marker || 0), 3)}} : {}),
      };
    },
  };
}

/**
 * Name chips "Name · role" for the three people, all at ONE font size (equal weight). Modes, in order of
 * preference: on the table's front panel; the speakers' chips beside their chairs (interpreter's on the
 * panel); a row under the table. They never move or change during the clip.
 */
export function nameChips(ctx, p, st, S, minSize, D, k) {
  const T0 = st.table;
  const ids = ['a', 'interpreter', 'b'];
  const cap = id => captionOf(p, id, p.actorLabels[id]);
  const lens = ids.map(id => Math.sqrt(cap(id).length));
  const sum = lens.reduce((q, v) => q + v, 0);
  const chairL = T0.x0 - 44 * k, chairR = T0.x1 + 44 * k;
  const modes = {
    panel: {y: T0.panelTop + 10 * k, bottom: T0.panelBottom - 3, spec: avail => [
      {x: T0.x0 + 14 * k, anchor: 'start', w: clamp(avail * lens[0] / sum, avail * 0.24, avail * 0.46)},
      {mid: true, anchor: 'middle', w: clamp(avail * lens[1] / sum, avail * 0.24, avail * 0.46)},
      {x: T0.x1 - 14 * k, anchor: 'end', w: clamp(avail * lens[2] / sum, avail * 0.24, avail * 0.46)},
    ], avail: T0.x1 - T0.x0 - 28 * k - 24},
    sides: {y: T0.panelTop, bottom: T0.yBottom - 3, spec: () => [
      {x: chairL - 12, anchor: 'end', w: chairL - 12 - 8},
      {x: (T0.x0 + T0.x1) / 2, anchor: 'middle', w: T0.x1 - T0.x0 - 40 * k},
      {x: chairR + 12, anchor: 'start', w: D.w - 8 - chairR - 12},
    ]},
    below: {y: T0.yBottom + 12, bottom: D.h - 4, spec: () => {
      const avail = D.w - 16 - 24;
      return [
        {x: 8, anchor: 'start', w: avail * lens[0] / sum},
        {mid: true, anchor: 'middle', w: avail * lens[1] / sum},
        {x: D.w - 8, anchor: 'end', w: avail * lens[2] / sum},
      ];
    }},
  };
  for (const mode of ['panel', 'sides', 'below']) {
    const M = modes[mode];
    const spec = M.spec(M.avail);
    if (spec.some(q => q.w < 120)) continue;
    const make = (size, n) => {
      const a0 = wchip(ctx, cap('a'), {x: spec[0].x, y: M.y, anchor: spec[0].anchor, maxWidth: spec[0].w, size, minSize: size, maxLines: n, name: 'chip-a'});
      const b0 = wchip(ctx, cap('b'), {x: spec[2].x, y: M.y, anchor: spec[2].anchor, maxWidth: spec[2].w, size, minSize: size, maxLines: n, name: 'chip-b'});
      const midX = spec[1].mid ? (a0.box.x + a0.box.w + b0.box.x) / 2 : spec[1].x;
      const i0 = wchip(ctx, cap('interpreter'), {x: midX, y: M.y, anchor: 'middle', maxWidth: spec[1].w, size, minSize: size, maxLines: n, name: 'chip-interpreter'});
      return [a0, i0, b0];
    };
    for (let size = S; size >= minSize - 1e-6; size -= Math.max(0.5, S * 0.04)) {
      let set = null;
      for (const n of [1, 2, 3, 4]) {
        set = make(size, n);
        if (!set.some(c => c.fit.truncated)) break;
      }
      if (set.some(c => c.fit.truncated)) continue;
      if (overlaps(set[0].box, set[1].box, 6) || overlaps(set[1].box, set[2].box, 6)) continue;
      if (Math.max(...set.map(c => c.box.y + c.box.h)) > M.bottom) continue;
      if (set.some(c => c.box.x < 6 || c.box.x + c.box.w > D.w - 6)) continue;
      return {set, mode};
    }
  }
  return null;
}

