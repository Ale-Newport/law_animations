/**
 * Motif kit for "Intervención de perito" (LAW-0173..0176): a specialist
 * examines an object with a magnifier and connects it, by a tag string, to an
 * illustrated report page whose figure mirrors the object.
 *
 * Contents (geometry, art and pose solving only; every entry owns its own
 * timeline, layout of editorial labels and semantics):
 *  - fields + fictional defaults shared by the four entries (EN / ES);
 *  - original vector art: the examined object (a gear wheel or a sealed sample
 *    jar) in a solid and a technical-drawing mode, a hand magnifier, a manila
 *    tag, a push pin, a workbench and a report board on an easel;
 *  - reportPage(): the report page layout (title · figure column · "data
 *    examined" rows · "opinion, scope as stated" block with a dashed scope
 *    fence and a bubble tail) with bounded text fitting: the size shrinks
 *    (never below a floor) before anything would be cut; hidden labels become
 *    simulated bars of the same lengths;
 *  - labStage(): a side-view workbench stage with a standing personRig. The
 *    near hand picks up the magnifier, holds its lens over the object, parks it
 *    back on the bench, lifts the tag tied to the object and pins it on the
 *    report board. The magnifier and the tag are placed from the SOLVED hand
 *    (grip = hand), hand caps are drawn over the gripped props.
 *
 * Legal content: fictional people and objects; jurisdiction unspecified;
 * illustrative-unverified. The scene only links the object to the report and
 * keeps "data examined (as supplied)" apart from "opinion, scope as stated".
 * It never marks an opinion as correct, decisive or accepted and never shows a
 * cause, fault, verdict or outcome. Glyphs are neutral (ruler, bubble, fence).
 * @module animations/roles/kits/intervencion-de-perito
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf, party} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {fitWords, wchip, overlaps} from './mediation-labels.js';

export {fitWords, wchip, overlaps};

const INK = '#1f2328';
const METAL = '#aab4bd';
const MANILA = '#ecd6a6';

/* ------------------------------------------------------------------ fields */

export const OBJECT_KINDS = ['gear', 'jar'];
export const ZONES = ['outer', 'inner', 'whole'];

/** Built-in strings (user content is never translated). */
export const PERITO_STRINGS = {
  en: {
    key: 'As supplied · no conclusion drawn',
    noOpinion: 'No opinion supplied',
    hypothetical: 'hypothetical',
  },
  es: {
    key: 'Según lo aportado · sin conclusión',
    noOpinion: 'Sin opinión aportada',
    hypothetical: 'hipotético',
  },
};

const report = obj('Report page sections (all supplied text; illustrative)', {
  title: str('Report title printed at the top of the page', 70),
  figure: str('Caption of the figure that mirrors the object', 60),
  dataHeading: str('Heading of the data section (e.g. "Data examined (as supplied)")', 50),
  measurements: list('Measurements or observations examined, as supplied. Label numbers as hypothetical', str('Measurement', 70), 1, 3),
  opinionHeading: str('Heading of the opinion section (e.g. "Opinion, scope as stated")', 50),
  opinion: str('Opinion text as supplied. Shown only as stated; never as correct, decisive or accepted', 120),
  scope: str('Scope of the opinion as stated by the specialist', 90),
});

/** Fields shared by the four entries (the roles category set for this motif). */
export const peritoFields = {
  actors: list('The specialist (one fictional person; appearance defaults to the seed)', party, 1, 1),
  roles: obj('Descriptive role caption (never a legal finding)', {specialist: str('Role caption for the specialist', 40)}),
  props: obj('The examined object, its tag and the illustrated report (supplied text)', {
    objectKind: oneOf('Examined object drawn on the bench and mirrored in the report figure', OBJECT_KINDS),
    object: str('Name of the examined object (fictional)', 60),
    tag: str('Text written on the tag tied to the object', 24),
    report,
  }),
};

/** Fictional, illustrative defaults (English). */
export const PERITO_DEFAULTS = {
  actors: [{name: 'Noor Haddad', role: 'Specialist'}],
  roles: {specialist: 'Specialist'},
  props: {
    objectKind: 'gear',
    object: 'Gear wheel, item 7 (fictional)',
    tag: 'Item 7',
    report: {
      title: 'Specialist report on item 7',
      figure: 'Fig. 1 · item 7 as drawn',
      dataHeading: 'Data examined (as supplied)',
      measurements: ['Outer diameter: 42 mm (hypothetical)', 'Teeth counted: 14 (hypothetical)'],
      opinionHeading: 'Opinion, scope as stated',
      opinion: 'The marks on the teeth look alike in shape',
      scope: 'Scope: teeth of item 7, surface only',
    },
  },
};

/** Spanish counterparts (fictional). */
export const PERITO_DEFAULTS_ES = {
  actors: [{name: 'Noor Haddad', role: 'Perita'}],
  roles: {specialist: 'Perita'},
  props: {
    objectKind: 'gear',
    object: 'Rueda dentada, pieza 7 (ficticia)',
    tag: 'Pieza 7',
    report: {
      title: 'Informe pericial sobre la pieza 7',
      figure: 'Fig. 1 · la pieza 7 dibujada',
      dataHeading: 'Dato examinado (según lo aportado)',
      measurements: ['Diámetro exterior: 42 mm (hipotético)', 'Dientes contados: 14 (hipotético)'],
      opinionHeading: 'Opinión, con el alcance indicado',
      opinion: 'Las marcas de los dientes se ven parecidas en su forma',
      scope: 'Alcance: dientes de la pieza 7, solo la superficie',
    },
  },
};

/** Specialist caption: "Name · role" (role caption falls back to the party role). */
export function specialistCaption(p, override) {
  const a = p.actors[0];
  const role = override || (p.roles && p.roles.specialist) || a.role || '';
  return role ? `${a.name} · ${role}` : a.name;
}

/* ----------------------------------------------------------- text helpers */

/** fitWords with the usual defaults. */
export const fitW = (text, o) => fitWords(text, {weight: 400, family: 'sans', ...o});

/**
 * Fitted text, or simulated bars of the same line widths when labels are
 * hidden (bars are only used when the author hid the labels).
 */
export function textOrBars(ctx, fit, o) {
  if (o.show !== false) return textBlock(fit, o);
  const lines = fit.lines.map((line, i) => {
    const w = ctx.measure(line, fit.size, fit.weight, fit.family);
    const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
    const y = o.y + i * fit.lineHeight + fit.size * 0.22;
    return h('rect', {x: r(x), y: r(y), width: r(Math.max(8, w * 0.96)), height: r(fit.size * 0.52), rx: r(fit.size * 0.2), fill: o.barFill || '#c9c2b4'});
  });
  return g({name: o.name, opacity: o.opacity}, lines);
}

/* ------------------------------------------------------------- object art */

/**
 * Examined object. Local origin = centre of the object; `R` = half height.
 * mode 'solid' = shaded artwork on the bench; 'line' = technical drawing in the
 * report figure (paper fill, ink outline, centre lines).
 * Returns the tie point of the tag string, the measured dimension line and the
 * zone outlines (for the scope overlays).
 * @param {any} ctx
 * @param {{kind:'gear'|'jar', R:number, mode?:'solid'|'line', name?:string}} o
 */
export function objectArt(ctx, o) {
  return o.kind === 'jar' ? jarArt(ctx, o) : gearArt(ctx, o);
}

function gearArt(ctx, o) {
  const R = o.R;
  const line = o.mode === 'line';
  const N = 14;
  const root = R * 0.84;
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const p = (Math.PI * 2) / N;
    for (const [rad, da] of [[root, -0.3], [R, -0.17], [R, 0.17], [root, 0.3]]) pts.push([Math.cos(a + da * p) * rad, Math.sin(a + da * p) * rad]);
  }
  const body = `M${pts.map(([x, y]) => `${r(x)} ${r(y)}`).join('L')}Z`;
  const holes = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    holes.push({x: Math.cos(a) * R * 0.53, y: Math.sin(a) * R * 0.53, r: R * 0.13});
  }
  const sw = line ? Math.max(2, R * 0.03) : Math.max(2.2, R * 0.035);
  const fill = line ? '#fffdf8' : METAL;
  const dark = line ? 'none' : shade(METAL, -0.32);
  const parts = [
    line ? null : h('ellipse', {cx: R * 0.06, cy: R * 1.02, rx: R * 0.9, ry: R * 0.1, fill: 'rgba(31,35,40,0.14)'}),
    h('path', {d: body, fill, stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
    h('circle', {r: R * 0.74, fill: line ? 'none' : shade(METAL, -0.08), stroke: line ? INK : shade(METAL, -0.3), 'stroke-width': line ? sw * 0.7 : 2, 'stroke-dasharray': line ? `${r(R * 0.05)} ${r(R * 0.04)}` : null}),
    holes.map(q => h('circle', {cx: r(q.x), cy: r(q.y), r: r(q.r), fill: line ? 'none' : dark, stroke: INK, 'stroke-width': sw * 0.8})),
    h('circle', {r: R * 0.27, fill: line ? 'none' : shade(METAL, 0.18), stroke: INK, 'stroke-width': sw}),
    h('path', {d: `M${r(-R * 0.1)} ${r(-R * 0.1)}A${r(R * 0.12)} ${r(R * 0.12)} 0 1 0 ${r(R * 0.1)} ${r(-R * 0.1)}V${r(-R * 0.15)}H${r(-R * 0.1)}Z`, fill: line ? 'none' : '#3b434b', stroke: INK, 'stroke-width': sw * 0.8, 'stroke-linejoin': 'round'}),
    line
      ? h('path', {d: `M${r(-R * 1.12)} 0H${r(R * 1.12)}M0 ${r(-R * 1.12)}V${r(R * 1.12)}`, stroke: INK, 'stroke-width': Math.max(1.2, sw * 0.45), 'stroke-dasharray': `${r(R * 0.16)} ${r(R * 0.05)} ${r(R * 0.03)} ${r(R * 0.05)}`, opacity: 0.7})
      : h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.42)}A${r(R * 0.76)} ${r(R * 0.76)} 0 0 1 ${r(R * 0.1)} ${r(-R * 0.74)}`, fill: 'none', stroke: '#fff', 'stroke-width': R * 0.07, 'stroke-linecap': 'round', opacity: 0.45}),
  ];
  const annulus = (a, b) => `M${r(-a)} 0A${r(a)} ${r(a)} 0 1 0 ${r(a)} 0A${r(a)} ${r(a)} 0 1 0 ${r(-a)} 0ZM${r(-b)} 0A${r(b)} ${r(b)} 0 1 1 ${r(b)} 0A${r(b)} ${r(b)} 0 1 1 ${r(-b)} 0Z`;
  const disc = a => `M${r(-a)} 0A${r(a)} ${r(a)} 0 1 0 ${r(a)} 0A${r(a)} ${r(a)} 0 1 0 ${r(-a)} 0Z`;
  return {
    node: g({name: o.name}, parts),
    R,
    tie: {x: 0, y: 0},
    dim: {a: {x: -R, y: 0}, b: {x: R, y: 0}, tick: {x: 0, y: R * 0.16}},
    zones: {outer: annulus(R * 1.08, R * 0.76), inner: disc(R * 0.36), whole: disc(R * 1.1)},
    box: {x: -R, y: -R, w: 2 * R, h: 2 * R},
  };
}

function jarArt(ctx, o) {
  const R = o.R;
  const line = o.mode === 'line';
  const w = R * 1.3;
  const sw = line ? Math.max(2, R * 0.03) : Math.max(2.2, R * 0.035);
  const glass = line ? '#fffdf8' : '#dfe9ee';
  const top = -R * 0.62, bot = R;
  const lidTop = -R, lidH = R * 0.3;
  const bodyD = `M${r(-w / 2 + R * 0.12)} ${r(top)}H${r(w / 2 - R * 0.12)}Q${r(w / 2)} ${r(top)} ${r(w / 2)} ${r(top + R * 0.18)}V${r(bot - R * 0.12)}Q${r(w / 2)} ${r(bot)} ${r(w / 2 - R * 0.14)} ${r(bot)}H${r(-w / 2 + R * 0.14)}Q${r(-w / 2)} ${r(bot)} ${r(-w / 2)} ${r(bot - R * 0.12)}V${r(top + R * 0.18)}Q${r(-w / 2)} ${r(top)} ${r(-w / 2 + R * 0.12)} ${r(top)}Z`;
  const swatchY = R * 0.05;
  const weave = [];
  for (let i = 0; i < 5; i++) {
    const yy = swatchY + R * 0.1 + i * R * 0.12;
    weave.push(h('path', {d: `M${r(-w * 0.3)} ${r(yy)}q${r(w * 0.15)} ${r(-R * 0.05)} ${r(w * 0.3)} 0t${r(w * 0.3)} 0`, fill: 'none', stroke: line ? INK : shade('#7a5c8e', -0.25), 'stroke-width': line ? sw * 0.45 : 2, opacity: line ? 0.6 : 0.8}));
  }
  const parts = [
    line ? null : h('ellipse', {cx: R * 0.05, cy: bot + R * 0.02, rx: w * 0.62, ry: R * 0.09, fill: 'rgba(31,35,40,0.14)'}),
    h('path', {d: bodyD, fill: glass, stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round', opacity: line ? 1 : 0.96}),
    // swatch of fabric resting inside
    h('path', {d: `M${r(-w * 0.36)} ${r(swatchY + R * 0.7)}L${r(-w * 0.33)} ${r(swatchY)}Q${r(0)} ${r(swatchY - R * 0.12)} ${r(w * 0.34)} ${r(swatchY + R * 0.04)}L${r(w * 0.37)} ${r(swatchY + R * 0.72)}Z`, fill: line ? 'none' : '#9b7bb0', stroke: INK, 'stroke-width': sw * 0.8, 'stroke-linejoin': 'round'}),
    weave,
    // neck + lid
    h('rect', {x: r(-w * 0.4), y: r(lidTop + lidH), width: r(w * 0.8), height: r(top - lidTop - lidH + 2), fill: line ? 'none' : shade(glass, -0.06), stroke: INK, 'stroke-width': sw * 0.8}),
    h('path', {d: roundRectPath(-w * 0.46, lidTop, w * 0.92, lidH, R * 0.06), fill: line ? '#fffdf8' : METAL, stroke: INK, 'stroke-width': sw}),
    [0.2, 0.4, 0.6, 0.8].map(t => h('line', {x1: r(-w * 0.46 + w * 0.92 * t), x2: r(-w * 0.46 + w * 0.92 * t), y1: r(lidTop + lidH * 0.2), y2: r(lidTop + lidH * 0.8), stroke: line ? INK : shade(METAL, -0.3), 'stroke-width': Math.max(1.2, sw * 0.5)})),
    // paper seal strip over the lid
    h('path', {d: `M${r(-w * 0.12)} ${r(lidTop - R * 0.04)}h${r(w * 0.24)}v${r(lidH + R * 0.34)}h${r(-w * 0.24)}Z`, fill: line ? 'none' : '#fbf6e8', stroke: INK, 'stroke-width': sw * 0.7}),
    line ? h('path', {d: `M0 ${r(-R * 1.1)}V${r(R * 1.1)}`, stroke: INK, 'stroke-width': Math.max(1.2, sw * 0.45), 'stroke-dasharray': `${r(R * 0.16)} ${r(R * 0.05)} ${r(R * 0.03)} ${r(R * 0.05)}`, opacity: 0.7})
      : h('path', {d: `M${r(-w * 0.34)} ${r(top + R * 0.2)}V${r(bot - R * 0.25)}`, stroke: '#fff', 'stroke-width': R * 0.07, 'stroke-linecap': 'round', opacity: 0.6}),
  ];
  const rect = (x, y, ww, hh) => roundRectPath(x, y, ww, hh, Math.min(ww, hh) * 0.12);
  return {
    node: g({name: o.name}, parts),
    R,
    tie: {x: -w * 0.4, y: lidTop + lidH + (top - lidTop - lidH) / 2},
    dim: {a: {x: w / 2 + R * 0.2, y: lidTop}, b: {x: w / 2 + R * 0.2, y: bot}, tick: {x: R * 0.14, y: 0}},
    zones: {outer: rect(-w * 0.56, lidTop - R * 0.12, w * 1.12, top - lidTop + R * 0.2), inner: rect(-w * 0.44, swatchY - R * 0.2, w * 0.88, R * 0.98), whole: rect(-w * 0.62, -R * 1.12, w * 1.24, R * 2.24)},
    box: {x: -w / 2, y: -R, w, h: 2 * R},
  };
}

/** Dimension line (with end ticks) drawn over an object; `name` gets a pathLength draw-on. */
export function dimensionLine(ctx, art, {name, color, width = 4}) {
  const {a, b, tick} = art.dim;
  const d = `M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}M${r(a.x - tick.x)} ${r(a.y - tick.y)}L${r(a.x + tick.x)} ${r(a.y + tick.y)}M${r(b.x - tick.x)} ${r(b.y - tick.y)}L${r(b.x + tick.x)} ${r(b.y + tick.y)}`;
  return g(null,
    h('path', {d, stroke: '#fff', 'stroke-width': width + 4, 'stroke-linecap': 'round', fill: 'none', opacity: 0.8, name: `${name}-halo`, pathLength: 100, 'stroke-dasharray': '100 101', 'stroke-dashoffset': 100}),
    h('path', {d, stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', fill: 'none', name, pathLength: 100, 'stroke-dasharray': '100 101', 'stroke-dashoffset': 100}));
}
export const drawOn = (name, p) => ({[name]: {'stroke-dashoffset': r(100 * (1 - clamp(p)), 2)}, [`${name}-halo`]: {'stroke-dashoffset': r(100 * (1 - clamp(p)), 2)}});

/** Scope-zone overlay (dashed outline + soft fill) in object-local units. */
export function zoneOverlay(ctx, art, zone, {name, color, opacity = 0}) {
  return g({name, opacity},
    h('path', {d: art.zones[zone], fill: color, 'fill-opacity': 0.22, 'fill-rule': 'evenodd', stroke: color, 'stroke-width': Math.max(2.5, art.R * 0.045), 'stroke-dasharray': `${r(art.R * 0.12)} ${r(art.R * 0.08)}`}));
}

/* ------------------------------------------------------------ small props */

/**
 * Hand magnifier. Local origin = grip (where the hand holds the handle);
 * the lens centre lies at (L + R, 0) along +x.
 */
export function magnifierArt(ctx, {name, R, L}) {
  const hw = R * 0.3;
  return g({name},
    h('path', {d: roundRectPath(-hw * 0.8, -hw / 2, L + hw * 0.4, hw, hw / 2), fill: '#6d4c35', stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(L * 0.15)} ${r(-hw * 0.22)}H${r(L * 0.7)}`, stroke: '#9a7356', 'stroke-width': hw * 0.22, 'stroke-linecap': 'round'}),
    h('rect', {x: r(L - hw * 0.1), y: r(-hw * 0.62), width: r(hw * 0.9), height: r(hw * 1.24), rx: 3, fill: '#c7ced4', stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: r(L + R), cy: 0, r: r(R), fill: '#d8ecf5', 'fill-opacity': 0.28, stroke: INK, 'stroke-width': r(R * 0.26)}),
    h('circle', {cx: r(L + R), cy: 0, r: r(R), fill: 'none', stroke: '#c7ced4', 'stroke-width': r(R * 0.17)}),
    h('path', {d: `M${r(L + R * 0.45)} ${r(-R * 0.45)}A${r(R * 0.7)} ${r(R * 0.7)} 0 0 1 ${r(L + R * 1.2)} ${r(-R * 0.66)}`, fill: 'none', stroke: '#fff', 'stroke-width': r(R * 0.12), 'stroke-linecap': 'round', opacity: 0.8}),
  );
}

/**
 * Vertical manila tag. Local origin = eyelet (top centre); the body hangs
 * along +y. Text is centred on the body (bars when labels are hidden).
 */
export function tagArt(ctx, {name, text, S, show, maxW, minW}) {
  const fit = fitW(text, {maxWidth: maxW, size: S, minSize: S, maxLines: 5, weight: 700});
  const w = Math.max(minW ?? S * 3.2, fit.width + S * 1.2);
  const top = S * 0.35;
  const bodyTop = top + S * 1.3;
  const hh = bodyTop + fit.height + S * 0.8;
  const cut = S * 0.9;
  const d = `M${r(-w / 2 + cut)} ${r(top)}H${r(w / 2 - cut)}L${r(w / 2)} ${r(top + cut)}V${r(hh)}H${r(-w / 2)}V${r(top + cut)}Z`;
  return {
    node: g({name},
      h('path', {d, fill: MANILA, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      h('circle', {cx: 0, cy: r(top + S * 0.55), r: r(S * 0.42), fill: '#f7ecd2', stroke: shade(MANILA, -0.35), 'stroke-width': 2}),
      h('circle', {cx: 0, cy: r(top + S * 0.55), r: r(S * 0.17), fill: INK}),
      textOrBars(ctx, fit, {x: 0, y: bodyTop, anchor: 'middle', fill: INK, show, barFill: shade(MANILA, -0.3)}),
    ),
    w, h: hh, eye: {x: 0, y: top + S * 0.55}, fit,
  };
}

/** Mitten hand cap drawn over a gripped prop (same shape as person.js). */
export function handCap(ctx, {name, look}) {
  return g({name, opacity: 0},
    h('path', {d: 'M-4 -11C8 -14 20 -10 22 -1C23 8 12 13 0 11C-6 10 -8 -8 -4 -11Z', fill: look.skin, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M6 -9C12 -18 20 -18 20 -12', fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
}

/** World transform for a hand cap from a solved hand (facing +1 rigs). */
export function capTransform(hand, k) {
  const wr = {x: hand.x - Math.cos(hand.angle) * 15 * 0.6 * k, y: hand.y - Math.sin(hand.angle) * 15 * 0.6 * k};
  return T(wr.x, wr.y, (hand.angle * 180) / Math.PI, k);
}

/** Push pin seen from the front. Local origin = pin point. */
export function pushPin(ctx, {name, s}) {
  return g({name, opacity: 0},
    h('ellipse', {cx: r(s * 0.2), cy: r(s * 0.25), rx: r(s * 0.75), ry: r(s * 0.45), fill: 'rgba(31,35,40,0.2)'}),
    h('circle', {r: r(s * 0.62), fill: '#5f6b75', stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: r(-s * 0.2), cy: r(-s * 0.2), r: r(s * 0.2), fill: '#fff', opacity: 0.55}));
}

/** Sagging string between two points (quadratic). */
export function stringD(a, b, sag) {
  const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag};
  return `M${r(a.x)} ${r(a.y)}Q${r(m.x)} ${r(m.y)} ${r(b.x)} ${r(b.y)}`;
}

/** Ruler glyph (data) — neutral. Local origin = top-left, size s. */
export function rulerGlyph(s, color) {
  const ticks = [];
  for (let i = 1; i < 5; i++) ticks.push(`M${r(s * 0.2 * i)} ${r(s * 0.3)}v${r(i % 2 ? s * 0.16 : s * 0.26)}`);
  return g(null,
    h('path', {d: roundRectPath(0, s * 0.3, s, s * 0.42, s * 0.06), fill: '#f5e7c4', stroke: color, 'stroke-width': Math.max(1.8, s * 0.07)}),
    h('path', {d: ticks.join(''), stroke: color, 'stroke-width': Math.max(1.5, s * 0.06)}));
}

/** Speech-bubble glyph (opinion) with a small bracket (scope) — neutral. */
export function bubbleGlyph(s, color) {
  return g(null,
    h('path', {d: `M${r(s * 0.1)} ${r(s * 0.15)}H${r(s * 0.9)}Q${r(s)} ${r(s * 0.15)} ${r(s)} ${r(s * 0.26)}V${r(s * 0.6)}Q${r(s)} ${r(s * 0.7)} ${r(s * 0.9)} ${r(s * 0.7)}H${r(s * 0.38)}L${r(s * 0.18)} ${r(s * 0.9)}V${r(s * 0.7)}H${r(s * 0.1)}Q0 ${r(s * 0.7)} 0 ${r(s * 0.6)}V${r(s * 0.26)}Q0 ${r(s * 0.15)} ${r(s * 0.1)} ${r(s * 0.15)}Z`, fill: '#fff', stroke: color, 'stroke-width': Math.max(1.8, s * 0.07), 'stroke-dasharray': `${r(s * 0.12)} ${r(s * 0.08)}`}),
    h('path', {d: `M${r(s * 0.34)} ${r(s * 0.28)}h${r(-s * 0.08)}v${r(s * 0.3)}h${r(s * 0.08)}M${r(s * 0.66)} ${r(s * 0.28)}h${r(s * 0.08)}v${r(s * 0.3)}h${r(-s * 0.08)}`, fill: 'none', stroke: color, 'stroke-width': Math.max(1.5, s * 0.06)}));
}

/* ------------------------------------------------------------ report page */

/**
 * Lay out the report page (pure; measures text). Tries the requested size,
 * then shrinks (never below `Smin`) until everything fits `maxH` uncut.
 * @param {any} ctx
 * @param {{prefix:string, w:number, S:number, Smin:number, maxH:number, minH?:number, figW:number, figSide:'left'|'right',
 *   report:any, keyText?:string|null, show:boolean, kind:'gear'|'jar', sections?:{data?:boolean, opinion?:boolean, figure?:boolean},
 *   opinionText?:string|null, headingScale?:number, titleLines?:number}} o
 */
export function reportLayout(ctx, o) {
  const top = o.Smax ?? o.S;
  const step = Math.max(0.5, o.S * 0.03);
  let last = null;
  for (let S = top; S >= o.Smin - 1e-6; S -= step) {
    const L = pageAt(ctx, o, S);
    last = L;
    if (!L.truncated && L.contentH <= o.maxH) return L;
  }
  return {...last, overflow: true};
}

function pageAt(ctx, o, S) {
  const w = o.w;
  const rep = o.report;
  const sec = {data: true, opinion: true, figure: true, title: true, ...(o.sections || {})};
  // compact spacing (contrast pages): tighter paddings and gaps, same text size
  const cm = o.compact ? 0.62 : 1;
  const pad = S * 0.9 * (o.compact ? 0.75 : 1);
  const reserve = (o.headReserve ?? 0) * S;
  let truncated = false;
  const F = (text, opt) => {
    const f = fitW(text, {minSize: opt.size, ...opt});
    if (f.truncated) truncated = true;
    return f;
  };
  const title = sec.title ? F(rep.title, {maxWidth: w - pad * 2, size: S * 1.18, maxLines: o.titleLines ?? 3, weight: 800}) : null;
  let y = title ? pad : pad * (o.compact ? 1.45 : 1.3);
  const titleY = y;
  if (title) y += title.height + S * 0.42;
  const ruleY = y;
  if (title) y += S * 0.62;
  const gut = S * 0.85;
  const figW = sec.figure ? Math.min(o.figW * (S / o.S), w * 0.36) : 0;
  const figX = o.figSide === 'left' ? pad : w - pad - figW;
  const colX = sec.figure && o.figSide === 'left' ? pad + figW + gut : pad;
  const colW = w - pad * 2 - (sec.figure ? figW + gut : 0);
  const glyph = S * (o.compact ? 1.05 : 1.2);
  const out = {S, pad, w, title, titleY, ruleY, colX, colW, figX, figW, glyph, sec, reserve};
  // figure first (its place is anchored), then the text flows around it:
  // full width where the figure is not, in the column beside it where it is
  let fig = null;
  if (sec.figure) {
    const cap = F(rep.figure, {maxWidth: figW, size: S, maxLines: 4, weight: 600});
    const art = Math.min(figW * 0.94, 520);
    let fy = y;
    if (typeof o.figAnchor === 'number') fy = Math.max(y, o.figAnchor - art / 2);
    else if (o.figAnchor === 'bottom') fy = Math.max(y, o.maxH - pad - cap.height - S * 0.4 - art);
    out.figCap = cap;
    out.figBox = {x: figX, y: fy, w: figW, h: art};
    out.figArt = {cx: figX + figW / 2, cy: fy + art / 2, R: art * 0.4};
    out.figCapY = fy + art + S * 0.4;
    out.figBottom = out.figCapY + cap.height;
    fig = {y0: fy - S * 0.35, y1: out.figBottom + S * 0.35};
  }
  const place = (yy, make) => {
    if (!fig) return make(pad, w - pad * 2);
    const full = make(pad, w - pad * 2);
    if (yy + full.h <= fig.y0 || yy >= fig.y1) return full;
    return make(colX, colW);
  };
  let cy = y;
  // an in-page note (inspect: the changed-datum card) reserved right under its section
  function reserveNote() {
    const nb = place(cy, (x, ww) => ({x, w: ww, h: o.noteSize(ww, S)}));
    out.noteBox = {x: nb.x, y: cy, w: nb.w, h: nb.h};
    cy += nb.h + S * 0.45;
  }
  if (sec.data) {
    const head = place(cy, (x, ww) => {
      const f = F(rep.dataHeading, {maxWidth: ww - glyph - S * 0.35 - reserve, size: S * 1.02, maxLines: 2, weight: 700});
      return {x, w: ww, f, h: Math.max(glyph * 0.9, f.height)};
    });
    out.dataHead = head.f;
    out.dataHeadX = head.x;
    out.dataHeadW = head.w;
    out.dataHeadY = cy + Math.max(0, (glyph * 0.9 - head.f.height) / 2);
    const y0 = cy;
    cy += head.h + S * 0.45 * cm;
    out.rows = rep.measurements.map((m, i) => {
      const rw = place(cy, (x, ww) => {
        const f = F(m, {maxWidth: ww - S * 1.25, size: S, maxLines: 4, weight: 500});
        // an alternative value for this row (inspect) reserves its own height
        const alt = o.rowAlt && o.rowAlt.i === i ? F(o.rowAlt.text, {maxWidth: ww - S * 1.25, size: S, maxLines: 4, weight: 500}) : null;
        return {x, w: ww, f, alt, h: Math.max(f.height, alt ? alt.height : 0)};
      });
      const row = {fit: rw.f, alt: rw.alt, y: cy, x: rw.x + S * 1.25, bx: rw.x, bw: rw.w, h: rw.h};
      cy += rw.h + S * 0.42 * cm;
      return row;
    });
    out.dataBox = {x: Math.min(head.x, ...out.rows.map(q => q.bx)) - S * 0.3, y: y0 - S * 0.3, w: Math.max(head.w, ...out.rows.map(q => q.bw)) + S * 0.6, h: cy - y0 + S * 0.1};
    cy += S * 0.55 * cm;
    if (o.noteSize && o.noteAfter === 'data') reserveNote();
  }
  if (sec.opinion) {
    const ip = S * 0.6 * (o.compact ? 0.75 : 1);
    const opText = o.opinionText !== undefined && o.opinionText !== null ? o.opinionText : rep.opinion;
    const blk = place(cy, (x, ww) => {
      const innerW = ww - ip * 2;
      const head = F(rep.opinionHeading, {maxWidth: innerW - glyph - S * 0.35 - reserve, size: S * 1.02, maxLines: 2, weight: 700});
      const op = F(opText, {maxWidth: innerW, size: S, maxLines: 7, weight: 500});
      const sc = F(rep.scope, {maxWidth: innerW - S * 0.9, size: S, maxLines: 5, weight: 500});
      // an alternative scope value (inspect) reserves its own height in the same place
      const scAlt = o.scopeAlt ? F(o.scopeAlt, {maxWidth: innerW - S * 0.9, size: S, maxLines: 5, weight: 500}) : null;
      const scH = Math.max(sc.height, scAlt ? scAlt.height : 0);
      const hh = ip + Math.max(glyph * 0.9, head.height) + S * 0.4 * cm + op.height + S * 0.45 * cm + scH + ip;
      return {x, w: ww, head, op, sc, scAlt, scH, h: hh};
    });
    const oy = cy;
    let yy = oy + ip;
    out.opHead = blk.head;
    out.opHeadY = yy + Math.max(0, (glyph * 0.9 - blk.head.height) / 2);
    yy += Math.max(glyph * 0.9, blk.head.height) + S * 0.4 * cm;
    out.op = blk.op;
    out.opY = yy;
    yy += blk.op.height + S * 0.45 * cm;
    out.sc = blk.sc;
    out.scAlt = blk.scAlt;
    out.scY = yy;
    out.scX = blk.x + ip + S * 0.9;
    out.scW = blk.w - ip * 2 - S * 0.9;
    yy += blk.scH + ip;
    out.opBox = {x: blk.x, y: oy, w: blk.w, h: yy - oy};
    out.opX = blk.x + ip;
    cy = yy + S * 0.5 * cm;
  }
  if (o.noteSize && o.noteAfter !== 'data') reserveNote();
  if (o.keyText) {
    const kb = place(cy, (x, ww) => {
      const f = F(o.keyText, {maxWidth: ww, size: S, maxLines: 2, weight: 600});
      return {x, w: ww, f, h: f.height};
    });
    out.key = kb.f;
    out.keyX = kb.x;
    out.keyY = cy;
    cy += kb.f.height + S * 0.2;
  }
  out.textBottom = cy;
  out.contentH = Math.max(cy, out.figBottom || 0) + pad;
  out.truncated = truncated;
  return out;
}

/**
 * Build the report page (drawn at page-local coordinates; wrap it in a
 * translate). Named nodes (prefix P):
 *  P-title · P-fig (figure group) · P-figwipe (clip rect, width) · P-figdim
 *  (dimension line draw-on) · P-figcap · P-dh · P-row{i} · P-oph · P-op ·
 *  P-sc · P-fence (mask path draw-on) · P-fenceg · P-key · P-ph-row{i} /
 *  P-ph-op (placeholders) · P-zone-{zone} (figure scope overlays).
 * @param {any} ctx
 * @param {ReturnType<typeof reportLayout>} L
 * @param {{prefix:string, h:number, show:boolean, kind:'gear'|'jar', zones?:string[], tail?:'left'|'right'|null, dimColor?:string}} o
 */
export function reportPage(ctx, L, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const S = L.S;
  const show = o.show;
  const bar = th.paperLine;
  const nodes = [];
  // paper with a folded corner and a faint shadow
  const W = L.w, H = o.h;
  const fold = S * 1.4;
  nodes.push(h('path', {d: `M8 10H${r(W + 8)}V${r(H + 10)}H8Z`, fill: 'rgba(31,35,40,0.14)'}));
  nodes.push(h('path', {d: `M0 0H${r(W - fold)}L${r(W)} ${r(fold)}V${r(H)}H0Z`, fill: th.paper, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}));
  // slot frames (contrast): drawn on the paper, UNDER every text line and under the folded corner
  if (o.slotFrames && L.sec.data) {
    const b = L.dataBox;
    const x1 = Math.min(b.x + b.w, W - S * 0.35);
    nodes.push(h('path', {name: `${P}-dfill`, d: roundRectPath(b.x, b.y, x1 - b.x, b.h, S * 0.45), fill: th.accent2Soft, opacity: 0}));
    nodes.push(h('path', {name: `${P}-dframe`, d: roundRectPath(b.x, b.y, x1 - b.x, b.h, S * 0.45), fill: 'none', stroke: th.accent2, 'stroke-width': Math.max(3, S * 0.13), pathLength: 100, 'stroke-dasharray': '100 101', 'stroke-dashoffset': 100}));
  }
  nodes.push(h('path', {d: `M${r(W - fold)} 0V${r(fold)}H${r(W)}`, fill: th.paperShade, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  if (L.title) {
    nodes.push(textOrBars(ctx, L.title, {x: L.pad, y: L.titleY, fill: INK, show, name: `${P}-title`, barFill: shade(bar, -0.15)}));
    nodes.push(h('line', {x1: r(L.pad), x2: r(W - L.pad), y1: r(L.ruleY), y2: r(L.ruleY), stroke: INK, 'stroke-width': 2}));
  } else {
    // a plain header band keeps the page recognisable as a report sheet
    nodes.push(h('path', {d: `M${r(L.pad)} ${r(L.pad * 0.55)}H${r(W * 0.55)}`, stroke: shade(bar, -0.2), 'stroke-width': Math.max(4, S * 0.3), 'stroke-linecap': 'round'}));
  }
  // figure
  if (L.sec.figure) {
    const fb = L.figBox;
    const art = objectArt(ctx, {kind: o.kind, R: L.figArt.R, mode: 'line'});
    const clipId = `${P}-figclip`;
    nodes.push(h('path', {d: roundRectPath(fb.x, fb.y, fb.w, fb.h, 8), fill: '#fbf8f0', stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '8 6'}));
    nodes.push(h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {name: `${P}-figwipe`, x: r(fb.x - 4), y: r(fb.y - 4), width: 0, height: r(fb.h + 8)}))));
    const zoneNodes = (o.zones || []).map(z => zoneOverlay(ctx, art, z, {name: `${P}-zone-${z}`, color: th.accent2}));
    nodes.push(g({name: `${P}-fig`, 'clip-path': ctx.ref(clipId)},
      g({transform: T(L.figArt.cx, L.figArt.cy)}, art.node, zoneNodes, dimensionLine(ctx, art, {name: `${P}-figdim`, color: o.dimColor || th.accent2, width: Math.max(3, S * 0.14)}))));
    nodes.push(textOrBars(ctx, L.figCap, {x: fb.x + fb.w / 2, y: L.figCapY, anchor: 'middle', fill: INK, show, name: `${P}-figcap`, barFill: bar}));
    L.figArtInfo = art;
  }
  // data section
  if (L.sec.data) {
    const gx = L.dataHeadX, gy = L.dataHeadY + L.dataHead.height / 2 - L.glyph * 0.52;
    nodes.push(g({transform: T(gx, gy)}, rulerGlyph(L.glyph, INK)));
    nodes.push(textOrBars(ctx, L.dataHead, {x: gx + L.glyph + S * 0.35, y: L.dataHeadY, fill: INK, show, name: `${P}-dh`, barFill: shade(bar, -0.1)}));
    L.rows.forEach((row, i) => {
      nodes.push(g({name: `${P}-ph-row${i}`},
        h('path', {d: `M${r(row.x)} ${r(row.y + S * 0.62)}H${r(row.x + row.bw * 0.5)}`, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '4 7', 'stroke-linecap': 'round'})));
      nodes.push(g({name: `${P}-row${i}`, opacity: 0},
        h('path', {d: roundRectPath(row.bx + S * 0.05, row.y + S * 0.12, S * 0.72, S * 0.72, S * 0.12), fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 2}),
        h('circle', {cx: r(row.bx + S * 0.41), cy: r(row.y + S * 0.48), r: r(S * 0.13), fill: th.accent2}),
        textOrBars(ctx, row.fit, {x: row.x, y: row.y, fill: INK, show, barFill: bar})));
    });
  }
  // opinion section: dashed scope fence (a bubble whose tail points to the figure side)
  if (L.sec.opinion) {
    const b = L.opBox;
    const tail = o.tail === undefined ? (L.figSide === 'right' ? 'right' : 'left') : o.tail;
    const rr = S * 0.5;
    const ty = b.y + Math.min(b.h * 0.4, S * 2.2);
    let d = roundRectPath(b.x, b.y, b.w, b.h, rr);
    if (tail === 'left') d = `M${r(b.x + rr)} ${r(b.y)}H${r(b.x + b.w - rr)}Q${r(b.x + b.w)} ${r(b.y)} ${r(b.x + b.w)} ${r(b.y + rr)}V${r(b.y + b.h - rr)}Q${r(b.x + b.w)} ${r(b.y + b.h)} ${r(b.x + b.w - rr)} ${r(b.y + b.h)}H${r(b.x + rr)}Q${r(b.x)} ${r(b.y + b.h)} ${r(b.x)} ${r(b.y + b.h - rr)}V${r(ty + S * 0.5)}L${r(b.x - S * 0.7)} ${r(ty + S * 0.1)}L${r(b.x)} ${r(ty - S * 0.3)}V${r(b.y + rr)}Q${r(b.x)} ${r(b.y)} ${r(b.x + rr)} ${r(b.y)}Z`;
    if (tail === 'right') d = `M${r(b.x + rr)} ${r(b.y)}H${r(b.x + b.w - rr)}Q${r(b.x + b.w)} ${r(b.y)} ${r(b.x + b.w)} ${r(b.y + rr)}V${r(ty - S * 0.3)}L${r(b.x + b.w + S * 0.7)} ${r(ty + S * 0.1)}L${r(b.x + b.w)} ${r(ty + S * 0.5)}V${r(b.y + b.h - rr)}Q${r(b.x + b.w)} ${r(b.y + b.h)} ${r(b.x + b.w - rr)} ${r(b.y + b.h)}H${r(b.x + rr)}Q${r(b.x)} ${r(b.y + b.h)} ${r(b.x)} ${r(b.y + b.h - rr)}V${r(b.y + rr)}Q${r(b.x)} ${r(b.y)} ${r(b.x + rr)} ${r(b.y)}Z`;
    const maskId = `${P}-fencemask`;
    nodes.push(h('defs', null, h('mask', {id: ctx.id(maskId), maskUnits: 'userSpaceOnUse', x: r(b.x - S * 2), y: r(b.y - S * 2), width: r(b.w + S * 4), height: r(b.h + S * 4)},
      h('path', {name: `${P}-fence`, d, fill: 'none', stroke: '#fff', 'stroke-width': 14, pathLength: 100, 'stroke-dasharray': '100 101', 'stroke-dashoffset': 100}))));
    nodes.push(g({name: `${P}-fenceg`},
      h('path', {name: `${P}-fencefill`, d, fill: th.accent3Soft, opacity: 0}),
      h('path', {d, fill: 'none', stroke: shade(th.accent3, -0.35), 'stroke-width': Math.max(3, S * 0.13), 'stroke-dasharray': `${r(S * 0.55)} ${r(S * 0.32)}`, 'stroke-linecap': 'round', mask: ctx.ref(maskId)})));
    const gx = L.opX, gy = L.opHeadY + L.opHead.height / 2 - L.glyph * 0.52;
    nodes.push(g({transform: T(gx, gy)}, bubbleGlyph(L.glyph, INK)));
    nodes.push(textOrBars(ctx, L.opHead, {x: gx + L.glyph + S * 0.35, y: L.opHeadY, fill: INK, show, name: `${P}-oph`, barFill: shade(bar, -0.1)}));
    nodes.push(g({name: `${P}-ph-op`},
      [0, 1].map(i => h('path', {d: `M${r(L.opX)} ${r(L.opY + S * 0.62 + i * S * 1.2)}H${r(L.opX + (b.w - S * 1.2) * (i ? 0.4 : 0.7))}`, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '4 7', 'stroke-linecap': 'round'}))));
    nodes.push(textOrBars(ctx, L.op, {x: L.opX, y: L.opY, fill: INK, show, name: `${P}-op`, opacity: 0, barFill: bar}));
    // scope line with a bracket glyph
    nodes.push(g({name: `${P}-sc`, opacity: 0},
      h('path', {d: `M${r(L.opX + S * 0.5)} ${r(L.scY + S * 0.05)}h${r(-S * 0.3)}v${r(L.sc.height - S * 0.1)}h${r(S * 0.3)}`, fill: 'none', stroke: shade(th.accent3, -0.35), 'stroke-width': Math.max(2.5, S * 0.1)}),
      textOrBars(ctx, L.sc, {x: L.scX, y: L.scY, fill: INK, show, italic: true, barFill: bar})));
  }
  if (L.key) {
    nodes.push(g({name: `${P}-key`, opacity: 0},
      textOrBars(ctx, L.key, {x: L.keyX, y: L.keyY, fill: th.inkSoft, show: show || ctx.show('key'), barFill: bar})));
  }
  return g({name: P}, nodes);
}

/**
 * Frame props for the page.
 * @param {string} P
 * @param {any} L  layout
 * @param {{fig?:number, rows?:number[], fence?:number, op?:number, sc?:number, key?:number, zones?:Record<string,number>}} s
 */
export function pageFrame(P, L, s) {
  const out = {};
  if (L.sec.figure) {
    const fb = L.figBox;
    const f = clamp(s.fig ?? 0);
    out[`${P}-figwipe`] = {width: r((fb.w + 8) * f)};
    Object.assign(out, drawOn(`${P}-figdim`, seg(f, 0.75, 1)));
    out[`${P}-fig`] = {opacity: f > 0 ? 1 : 0};
    for (const [z, v] of Object.entries(s.zones || {})) out[`${P}-zone-${z}`] = {opacity: r(clamp(v), 3)};
  }
  if (L.sec.data) {
    L.rows.forEach((row, i) => {
      const v = clamp((s.rows || [])[i] ?? 0);
      // the placeholder leaves first, then the text arrives: text never lies over the dashes
      out[`${P}-row${i}`] = {opacity: r(clamp((v - 0.4) / 0.6), 3)};
      out[`${P}-ph-row${i}`] = {opacity: r(1 - clamp(v / 0.4), 3)};
    });
  }
  if (s.dframe !== undefined && L.sec.data) {
    out[`${P}-dframe`] = {'stroke-dashoffset': r(100 * (1 - clamp(s.dframe)), 2)};
    out[`${P}-dfill`] = {opacity: r(0.55 * clamp(s.dframe), 3)};
  }
  if (L.sec.opinion) {
    out[`${P}-fence`] = {'stroke-dashoffset': r(100 * (1 - clamp(s.fence ?? 0)), 2)};
    out[`${P}-fencefill`] = {opacity: r(0.55 * clamp(s.fence ?? 0), 3)};
    out[`${P}-op`] = {opacity: r(clamp((clamp(s.op ?? 0) - 0.4) / 0.6), 3)};
    out[`${P}-sc`] = {opacity: r(clamp(s.sc ?? 0), 3)};
    out[`${P}-ph-op`] = {opacity: r(1 - clamp(clamp(s.op ?? 0) / 0.4), 3)};
  }
  if (L.key) out[`${P}-key`] = {opacity: r(clamp(s.key ?? 0), 3)};
  return out;
}

/* -------------------------------------------------------------- lab stage */

/**
 * Stage configurations (design units). k = rig scale; every body-relative
 * value below is in rig units (× k). `lane` = where the tag is pinned on the
 * report board: on the board's left strip (wide/square) or on a strip under
 * the page (tall).
 */
export const LAB = {
  landscape: {k: 1.72, benchL: 250, S: 25, Smax: 34, Smin: 20, figW: 260, lane: 'left', figSide: 'left', pinDX: 186, pinDY: 336},
  square: {k: 1.56, benchL: 190, S: 30, Smax: 38, Smin: 24.2, figW: 190, lane: 'left', figSide: 'left', pinDX: 186, pinDY: 336},
  portrait: {k: 1.42, benchL: 185, S: 22, Smax: 34, Smin: 16.8, figW: 230, lane: 'bottom', figSide: 'right', pinDX: 132, pinDY: 420},
};

/** Body-relative placements (rig units; x from the person, y up from the floor = negative). */
export const BODY = {
  benchTop: -200, depth: 26, benchR: 150,
  gear: {x: 106, y: -272, R: 50},
  jar: {x: 106, y: -266, R: 56},
  standH: 20,
  magRest: {x: -86, y: -212}, // grip of the lying magnifier (lens lies to the left)
  // resting hands: flat on the bench top on either side of the body (never across the torso)
  // at rest: the near arm hangs by the side (hand behind the bench front), the far hand lies on the bench
  restNear: {x: 50, y: -160}, restFar: {x: -60, y: -205},
  mag: {R: 26, L: 44},
  tagRest: {x: 92, y: -198}, // eyelet of the tag hanging over the bench's front edge
};

/**
 * Action clock windows (c in [0,1]) used by labStage.pose.
 */
export const ACT = {
  reachMag: [0, 0.1], lift: [0.1, 0.23], sweep: [0.23, 0.43], dim: [0.27, 0.41], park: [0.43, 0.58],
  reachTag: [0.58, 0.65], carry: [0.65, 0.86], pin: [0.86, 0.9], release: [0.9, 1],
};

/**
 * Compute the stage geometry for a box (W × H design units).
 * @param {any} ctx
 * @param {{W:number, H:number, cfg:any, x0?:number, top?:number, pageMaxW?:number, pagePad?:number, S?:number, Smin?:number, figW?:number,
 *   report:any, tagText:string, keyText?:string|null, show:boolean, kind:'gear'|'jar', sections?:any, opinionText?:string|null, titleLines?:number}} o
 */
export function labGeometry(ctx, o) {
  const cfg = o.cfg;
  const k = cfg.k * (o.scale ?? 1);
  const S = o.S ?? cfg.S;
  const Smin = o.Smin ?? cfg.Smin;
  const figW = o.figW ?? cfg.figW;
  const x0 = o.x0 ?? 0, top = o.top ?? 0;
  const W = o.W, H = o.H;
  const m = o.margin ?? 18;
  const floorY = top + H - m;
  const tagMaxW = o.tagMaxW ?? S * 5.4;
  const tag = tagArt(ctx, {name: 'probe', text: o.tagText, S, show: o.show, maxW: tagMaxW, minW: o.tagMaxW ? S * 2.6 : undefined});
  const laneW = tag.w + S * 1.2;
  const G = {k, floorY, S, laneW, tag, tagMaxW, cfg, W, H, x0, top};
  const Smax = o.Smax ?? cfg.Smax ?? S;
  const pageOpts = {prefix: 'probe', S, Smax, Smin, figW, headReserve: o.headReserve, figSide: cfg.figSide, report: o.report, keyText: o.keyText, show: o.show, kind: o.kind, sections: o.sections, opinionText: o.opinionText, titleLines: o.titleLines, scopeAlt: o.scopeAlt, rowAlt: o.rowAlt, compact: o.compact, noteSize: o.noteSize, noteAfter: o.noteAfter};
  if (cfg.lane === 'left') {
    const px = x0 + m + cfg.benchL * k;
    const pin = {x: px + cfg.pinDX * k, y: floorY - cfg.pinDY * k};
    const boardX = pin.x - laneW / 2;
    const pageX = boardX + laneW;
    const pageW = Math.min(x0 + W - m - pageX - 10, o.pageMaxW ?? 1e9);
    // page centred in the height when it can be, but its top stays above the pin
    const topMin = top + m + 6;
    // the figure sits beside the pinned tag when that keeps the text large;
    // otherwise at the top of the page (text then flows full width below it)
    const lay = pt => {
      const opts = [pin.y - pt + tag.h * 0.45, 'top'].map(a => reportLayout(ctx, {...pageOpts, w: pageW, maxH: floorY - (o.floorGap ?? 40) - pt, figAnchor: a}));
      const [a, b] = opts;
      const PLx = (b.S > a.S + 0.01 || (Math.abs(b.S - a.S) < 0.01 && b.contentH < a.contentH - 60 && a.contentH > (floorY - 40 - pt) * 0.8)) && !b.overflow ? b : a;
      return {PLx, hx: Math.max(PLx.contentH, pin.y + tag.h + S * 1.2 - pt)};
    };
    let pageTop = topMin;
    let {PLx: PL, hx: pageH} = lay(pageTop);
    const centred = clamp(topMin + (floorY - Math.min(30, o.floorGap ?? 30) - topMin - pageH) / 2, topMin, pin.y - S * 2.4);
    if (o.pinAtSlots && PL.dataBox && PL.opBox) {
      // contrast: place the page so that its data and opinion slots straddle shoulder height, so
      // the tag can be pinned beside either slot (see pinFor)
      const mid = (PL.dataBox.y + PL.dataBox.h / 2 + PL.opBox.y + PL.opBox.h / 2) / 2;
      pageTop = clamp(floorY - 296 * k - mid, topMin, floorY - (o.floorGap ?? 30) - PL.contentH);
      ({PLx: PL, hx: pageH} = lay(pageTop));
      pageH = PL.contentH;
    } else if (centred > pageTop + 1) {
      pageTop = centred;
      ({PLx: PL, hx: pageH} = lay(pageTop));
    }
    // with slot pins the board also spans the arm's reach band, so a pinned tag always hangs on it
    const by0 = o.pinAtSlots ? Math.min(pageTop, floorY - 356 * k - S * 0.6) : pageTop;
    // (never below the panel: a tall tag is then pinned a little higher in the reach band)
    const by1 = o.pinAtSlots ? Math.min(Math.max(pageTop + pageH, floorY - 236 * k + tag.h + S * 0.4), Math.max(pageTop + pageH, top + H - 12)) : pageTop + pageH;
    Object.assign(G, {px, pin, board: {x: boardX, y: by0 - 12, w: laneW + pageW + 12, h: by1 - by0 + 24}, page: {x: pageX, y: pageTop, w: pageW, h: pageH}, PL});
    // pin beside a slot of the page, kept inside the arm's reach band (shoulder height ± ~74 units)
    G.pinFor = slot => {
      const b = slot === 'data' ? PL.dataBox : PL.opBox;
      const want = pageTop + b.y + b.h / 2 - tag.h * 0.35;
      return {x: pin.x, y: clamp(want, floorY - 352 * k, Math.min(floorY - 238 * k, by1 - tag.h - S * 0.4))};
    };
  } else {
    // tall: board across the top; tag lane under the page, below the figure column
    const pageX = x0 + m + 8;
    const pageW = W - 2 * m - 16;
    const pageTop = top + m + 6;
    const pinYWanted = floorY - cfg.pinDY * k;
    const maxH = pinYWanted - pageTop - S * 1.1;
    const PL = reportLayout(ctx, {...pageOpts, w: pageW, maxH, figAnchor: 'bottom'});
    const pageH = Math.max(PL.contentH, maxH);
    const figCx = pageX + (PL.figX + PL.figW / 2);
    const pin = {x: figCx, y: pageTop + pageH + S * 0.55};
    const px = pin.x - cfg.pinDX * k;
    Object.assign(G, {px, pin, board: {x: pageX - 12, y: pageTop - 12, w: pageW + 24, h: pageH + S * 1.1 + 24}, page: {x: pageX, y: pageTop, w: pageW, h: pageH}, PL});
  }
  // body-relative → world
  const Wd = (x, y) => ({x: G.px + x * k, y: floorY + y * k});
  G.W2 = Wd;
  G.benchTopY = floorY + BODY.benchTop * k;
  G.benchX0 = x0 + m;
  G.benchX1 = G.px + BODY.benchR * k;
  const ob = BODY[o.kind === 'jar' ? 'jar' : 'gear'];
  G.obj = {...Wd(o.objX ?? ob.x, ob.y), R: ob.R * k};
  G.standTop = G.obj.y + ob.R * k;
  G.magRest = Wd(BODY.magRest.x, BODY.magRest.y);
  G.tagRest = Wd(BODY.tagRest.x, BODY.tagRest.y);
  G.mag = {R: BODY.mag.R * k, L: BODY.mag.L * k};
  return G;
}

/**
 * Side-view workbench stage: report board on an easel, workbench, examined
 * object on a stand, magnifier, tag with string, standing specialist.
 * @param {any} ctx
 * @param {{prefix:string, G:any, look:any, kind:'gear'|'jar', show:boolean, pageZones?:string[], objZones?:string[], tail?:any}} o
 */
export function labStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = o.G;
  const k = G.k;
  const S = G.S;
  const rig = personRig(ctx, {name: `${P}-rig`, look: o.look, pose: 'standing'});

  // --- board + easel + page
  const B = G.board;
  const legs = [];
  const legTop = B.y + B.h - 10;
  if (G.floorY - legTop > 30) {
    for (const [x1, x2] of [[B.x + B.w * 0.18, B.x + B.w * 0.12], [B.x + B.w * 0.82, B.x + B.w * 0.88]]) {
      legs.push(h('path', {d: `M${r(x1)} ${r(legTop)}L${r(x2)} ${r(G.floorY)}`, stroke: INK, 'stroke-width': 17, 'stroke-linecap': 'round'}));
      legs.push(h('path', {d: `M${r(x1)} ${r(legTop)}L${r(x2)} ${r(G.floorY)}`, stroke: th.woodDark, 'stroke-width': 12, 'stroke-linecap': 'round'}));
    }
  }
  const board = g({name: `${P}-board`},
    legs,
    h('path', {d: roundRectPath(B.x, B.y, B.w, B.h, 10), fill: th.woodDark, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(B.x + 7, B.y + 7, B.w - 14, B.h - 14, 6), fill: '#c9b48f', stroke: shade('#c9b48f', -0.25), 'stroke-width': 2}),
  );
  const page = reportPage(ctx, G.PL, {prefix: `${P}-pg`, h: G.page.h, show: o.show, kind: o.kind, zones: o.pageZones, tail: o.tail, slotFrames: o.slotFrames});
  const pageNode = g({transform: T(G.page.x, G.page.y)}, page);

  // --- bench: top strip (behind the person), front (in front)
  const bx0 = G.benchX0, bx1 = G.benchX1, ty = G.benchTopY, dp = BODY.depth * k;
  const strip = (x0, x1) => `M${r(x0 + dp * 0.4)} ${r(ty - dp)}H${r(x1 - dp * 0.4)}L${r(x1)} ${r(ty)}H${r(x0)}Z`;
  const benchTop = h('path', {d: strip(bx0, bx1), fill: th.woodTop, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'});
  // the bench top is redrawn over the lower torso (the person stands behind the bench): the same
  // strip shape and outline, clipped to the torso's width, so no seam or raised block shows
  const patchClip = `${P}-patchclip`;
  const patch = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(patchClip)}, h('rect', {x: r(G.px - 44 * k), y: r(ty - dp - 4), width: r(88 * k), height: r(dp + 8)}))),
    g({'clip-path': ctx.ref(patchClip)}, h('path', {d: strip(bx0, bx1), fill: th.woodTop, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'})));
  const edge = 14 * k;
  const benchFront = g(null,
    h('path', {d: roundRectPath(bx0, ty, bx1 - bx0, edge, 4), fill: th.woodDark, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(bx0 + 10 * k), y: r(ty + edge), width: r(bx1 - bx0 - 20 * k), height: r(G.floorY - ty - edge - 26 * k), fill: th.wood, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(bx0 + 22 * k, ty + edge + 12 * k, bx1 - bx0 - 44 * k, G.floorY - ty - edge - 62 * k, 6), fill: shade(th.wood, -0.05), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
    h('rect', {x: r(bx0), y: r(ty + edge - 2), width: r(14 * k), height: r(G.floorY - ty - edge + 2), rx: 3, fill: th.woodDark, stroke: INK, 'stroke-width': 2.4}),
    h('rect', {x: r(bx1 - 14 * k), y: r(ty + edge - 2), width: r(14 * k), height: r(G.floorY - ty - edge + 2), rx: 3, fill: th.woodDark, stroke: INK, 'stroke-width': 2.4}),
  );
  const shadowFloor = h('ellipse', {cx: r((bx0 + bx1) / 2), cy: r(G.floorY + 3), rx: r((bx1 - bx0) * 0.56), ry: r(9 * k), fill: th.shadow});

  // --- object on its stand (+ scope overlays, dimension line, lens copy)
  const kind = o.kind;
  const art = objectArt(ctx, {kind, R: G.obj.R, mode: 'solid', name: `${P}-obj`});
  const standW = (kind === 'jar' ? 1.2 : 1.1) * G.obj.R, standH = BODY.standH * k;
  const stand = kind === 'jar'
    ? h('path', {d: roundRectPath(G.obj.x - standW * 0.62, G.standTop - 4, standW * 1.24, standH * 0.7 + 4, 4), fill: shade(th.wood, -0.25), stroke: INK, 'stroke-width': 2.2})
    : h('path', {d: `M${r(G.obj.x - standW / 2)} ${r(G.benchTopY - 2)}L${r(G.obj.x - standW * 0.36)} ${r(G.standTop - standH * 0.3)}H${r(G.obj.x - standW * 0.12)}L${r(G.obj.x)} ${r(G.standTop + standH * 0.3)}L${r(G.obj.x + standW * 0.12)} ${r(G.standTop - standH * 0.3)}H${r(G.obj.x + standW * 0.36)}L${r(G.obj.x + standW / 2)} ${r(G.benchTopY - 2)}Z`, fill: '#5d6770', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'});
  const objZones = (o.objZones || []).map(z => zoneOverlay(ctx, art, z, {name: `${P}-ozone-${z}`, color: th.accent2}));
  const objNode = g({transform: T(G.obj.x, G.obj.y)}, art.node, objZones, dimensionLine(ctx, art, {name: `${P}-odim`, color: th.accent2, width: Math.max(3.5, 2.6 * k)}));
  const lensClip = `${P}-lensclip`;
  const lensCopyArt = objectArt(ctx, {kind, R: G.obj.R, mode: 'solid'});
  const lensCopy = g({name: `${P}-lensg`, opacity: 0},
    h('defs', null, h('clipPath', {id: ctx.id(lensClip)}, h('circle', {name: `${P}-lensc`, r: r(G.mag.R * 0.92)}))),
    g({'clip-path': ctx.ref(lensClip)},
      h('circle', {name: `${P}-lensbg`, r: r(G.mag.R), fill: '#e6edf1'}),
      g({name: `${P}-lensz`}, g({transform: T(G.obj.x, G.obj.y)}, lensCopyArt.node, dimensionLine(ctx, lensCopyArt, {name: `${P}-ldim`, color: th.accent2, width: Math.max(3.5, 2.6 * k)})))));

  // --- magnifier, tag, string, pin, caps
  const mag = magnifierArt(ctx, {name: `${P}-mag`, R: G.mag.R, L: G.mag.L});
  const tag = tagArt(ctx, {name: `${P}-tag`, text: o.tagText, S: G.tag.fit.size, show: o.show, maxW: G.tagMaxW, minW: G.tag.w});
  const string = h('path', {name: `${P}-str`, fill: 'none', stroke: '#8a5a33', 'stroke-width': Math.max(2.5, 1.9 * k), 'stroke-linecap': 'round'});
  const knot = h('circle', {name: `${P}-knot`, r: r(Math.max(3.5, 3 * k)), fill: '#8a5a33', stroke: INK, 'stroke-width': 1.5});
  const pin = pushPin(ctx, {name: `${P}-pin`, s: Math.max(10, 8 * k)});
  const capM = handCap(ctx, {name: `${P}-capM`, look: o.look});
  const capT = handCap(ctx, {name: `${P}-capT`, look: o.look});
  const leader = h('path', {name: `${P}-lead`, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-dasharray': '6 6', opacity: 0});

  const node = g({name: P},
    shadowFloor,
    board, pageNode,
    benchTop,
    stand,
    objNode,
    rig.node,
    patch,
    benchFront,
    lensCopy,
    mag,
    string,
    knot,
    g({name: `${P}-tagw`}, tag.node),
    pin,
    leader,
    capM, capT,
  );

  // --- pose solving
  const objTie = {x: G.obj.x + art.tie.x, y: G.obj.y + art.tie.y};
  const pinPt = G.pin;
  const pageGlobal = q => ({x: G.page.x + q.x, y: G.page.y + q.y});
  // printed leader from the pinned tag to the figure frame
  const PL = G.PL;
  let leadD = '';
  if (PL.sec.figure) {
    const fb = PL.figBox;
    if (G.cfg.lane === 'left') {
      const ly = clamp(pinPt.y + tag.h * 0.55, G.page.y + fb.y + 16, G.page.y + fb.y + fb.h - 16);
      const a = {x: pinPt.x + tag.w / 2 + 4, y: ly};
      const bpt = pageGlobal({x: fb.x, y: ly - G.page.y});
      leadD = `M${r(a.x)} ${r(a.y)}L${r(bpt.x)} ${r(bpt.y)}`;
    } else {
      const a = {x: pinPt.x, y: pinPt.y - S * 0.6};
      const bpt = {x: pinPt.x, y: G.page.y + PL.figBottom + S * 0.2};
      leadD = bpt.y < a.y - 4 ? `M${r(a.x)} ${r(a.y)}L${r(bpt.x)} ${r(bpt.y)}` : '';
    }
  }
  const RN = G.W2(BODY.restNear.x, BODY.restNear.y), RF = G.W2(BODY.restFar.x, BODY.restFar.y);
  const restHand = RN;
  const lensAt = ph => ({x: G.obj.x + Math.cos(ph) * G.obj.R * 0.42, y: G.obj.y + Math.sin(ph) * G.obj.R * 0.42});
  const HOLD_ANG = (-48 * Math.PI) / 180;
  const LA = G.mag.L + G.mag.R;
  const gripFor = (lc, ang) => ({x: lc.x - Math.cos(ang) * LA, y: lc.y - Math.sin(ang) * LA});
  const sweepPh = t => lerp(Math.PI * 1.1, Math.PI * 1.9, t);
  const lensStart = lensAt(sweepPh(0));
  const gripHold0 = gripFor(lensStart, HOLD_ANG);
  const carryVia = {x: lerp(G.tagRest.x, pinPt.x, 0.3), y: lerp(G.tagRest.y, pinPt.y, 0.55) - 18 * k};

  /**
   * @param {{c:number, lean?:number, pageState?:any, objZones?:Record<string,number>, dim?:number, leader?:number}} s
   */
  function pose(s) {
    const c = clamp(s.c);
    const e = ease.inOutCubic;
    // near-hand target and prop states
    let target = null;
    let magHeld = false, tagHeld = false;
    let magAng = Math.PI, magFlat = 0.42, lensOn = 0;
    let magGrip = G.magRest;
    let lean = 0, headTilt = 0;
    const pReach = e(seg(c, ...ACT.reachMag));
    const pLift = e(seg(c, ...ACT.lift));
    const pSweep = ease.inOutSine(seg(c, ...ACT.sweep));
    const pPark = e(seg(c, ...ACT.park));
    const pReachT = e(seg(c, ...ACT.reachTag));
    const pCarry = seg(c, ...ACT.carry);
    const pPin = seg(c, ...ACT.pin);
    const pRel = e(seg(c, ...ACT.release));
    if (c < ACT.reachMag[1]) {
      target = mix(restHand, G.magRest, pReach);
    } else if (c < ACT.park[1]) {
      magHeld = true;
      if (c < ACT.lift[1]) {
        magAng = lerp(Math.PI, Math.PI * 2 + HOLD_ANG, pLift);
        magFlat = lerp(0.42, 1, Math.min(1, pLift * 1.6));
        const lc = mix({x: G.magRest.x + Math.cos(Math.PI) * LA, y: G.magRest.y}, lensStart, pLift);
        magGrip = gripFor(lc, magAng);
        lensOn = seg(pLift, 0.7, 1);
      } else if (c < ACT.sweep[1]) {
        magAng = HOLD_ANG;
        magFlat = 1;
        magGrip = gripFor(lensAt(sweepPh(pSweep)), magAng);
        lensOn = 1;
      } else {
        magAng = lerp(Math.PI * 2 + HOLD_ANG, Math.PI, pPark);
        magFlat = lerp(1, 0.42, seg(pPark, 0.4, 1));
        const lc0 = lensAt(sweepPh(1));
        const lc = mix(lc0, {x: G.magRest.x + Math.cos(Math.PI) * LA, y: G.magRest.y}, pPark);
        magGrip = gripFor(lc, magAng);
        lensOn = 1 - seg(pPark, 0, 0.3);
      }
      target = magGrip;
      headTilt = 10 * seg(c, ACT.lift[0], ACT.lift[1]) * (1 - seg(c, ACT.park[0], ACT.park[1]));
    } else if (c < ACT.reachTag[1]) {
      target = mix(G.magRest, G.tagRest, pReachT);
    } else if (c < ACT.pin[1]) {
      tagHeld = true;
      const t = e(pCarry);
      // lift up and over, then to the pin; then a small push at the pin
      const a = mix(G.tagRest, carryVia, Math.min(1, t * 1.6));
      const b = mix(carryVia, pinPt, clamp((t - 0.25) / 0.75));
      const w = clamp((t - 0.25) / 0.5);
      const pos = t <= 0.25 ? a : mix(a, b, ease.inOutSine(w));
      const push = Math.sin(Math.PI * pPin) * 4 * k;
      target = {x: pos.x + (G.cfg.lane === 'left' ? push : 0), y: pos.y + (G.cfg.lane === 'left' ? 0 : push)};
      lean = (G.cfg.lean ?? 14) * ease.inOutSine(clamp(pCarry * 1.3));
      headTilt = -6 * clamp(pCarry * 2);
    } else {
      target = mix(pinPt, restHand, pRel);
      lean = (G.cfg.lean ?? 14) * (1 - pRel);
      headTilt = -6 * (1 - pRel);
    }
    if (s.lean !== undefined) lean = s.lean;
    const posed = rig.frame({x: G.px, y: G.floorY, facing: 1, scale: k, lean, headTilt, near: target, far: RF});
    const hand = posed.hands.near;
    const nodes = {...posed.nodes};
    // magnifier from the SOLVED hand while held
    if (magHeld) magGrip = {x: hand.x, y: hand.y};
    nodes[`${P}-mag`] = {transform: `${T(magGrip.x, magGrip.y, (magAng * 180) / Math.PI)} scale(1 ${r(magFlat, 3)})`};
    const lc = {x: magGrip.x + Math.cos(magAng) * LA, y: magGrip.y + Math.sin(magAng) * LA};
    const zoom = 1.75;
    nodes[`${P}-lensg`] = {opacity: r(lensOn, 3), transform: T(lc.x, lc.y)};
    nodes[`${P}-lensz`] = {transform: `scale(${zoom}) ${T(-lc.x, -lc.y)}`};
    nodes[`${P}-capM`] = {opacity: magHeld ? 1 : 0, transform: capTransform(hand, k)};
    // tag: resting (hanging over the bench edge), carried (eyelet = SOLVED hand), pinned
    let eye;
    let tagRot = 0;
    const pinned = c >= ACT.pin[0] + (ACT.pin[1] - ACT.pin[0]) * 0.5;
    if (tagHeld) {
      eye = {x: hand.x, y: hand.y};
      tagRot = -10 * Math.sin(Math.PI * clamp(pCarry));
    } else if (c >= ACT.pin[1]) {
      eye = pinPt;
    } else {
      eye = G.tagRest;
    }
    nodes[`${P}-tagw`] = {transform: T(eye.x - tag.eye.x, eye.y - tag.eye.y, tagRot)};
    nodes[`${P}-capT`] = {opacity: tagHeld ? 1 : 0, transform: capTransform(hand, k)};
    nodes[`${P}-pin`] = {opacity: pinned ? 1 : 0, transform: T(pinPt.x, pinPt.y)};
    // string from the object's tie point to the eyelet
    const dist = Math.hypot(eye.x - objTie.x, eye.y - objTie.y);
    const sag = c >= ACT.pin[1] ? 10 * k : tagHeld ? lerp(26, 10, clamp(pCarry)) * k : 18 * k;
    nodes[`${P}-str`] = {d: stringD(objTie, eye, sag)};
    nodes[`${P}-knot`] = {transform: T(objTie.x, objTie.y)};
    // dimension line on the object (drawn while the lens sweeps), mirrored in the lens copy
    const dimP = s.dim !== undefined ? s.dim : seg(c, ...ACT.dim);
    Object.assign(nodes, drawOn(`${P}-odim`, dimP), drawOn(`${P}-ldim`, dimP));
    for (const [z, v] of Object.entries(s.objZones || {})) nodes[`${P}-ozone-${z}`] = {opacity: r(clamp(v), 3)};
    nodes[`${P}-lead`] = {d: leadD || 'M0 0', opacity: r(clamp(s.leader ?? 0), 3)};
    if (s.pageState) Object.assign(nodes, pageFrame(`${P}-pg`, G.PL, s.pageState));
    const tagHolder = tagHeld ? 'hand' : c >= ACT.pin[1] ? 'pinned' : 'bench';
    const magHolder = magHeld ? 'hand' : 'bench';
    return {
      nodes,
      semantic: {
        hand: {x: r(hand.x), y: r(hand.y)},
        handFar: {x: r(posed.hands.far.x), y: r(posed.hands.far.y)},
        handsOnBench: Math.abs(posed.hands.far.y - RF.y) < 1.5 && (c <= 0 || c >= 1 ? Math.abs(hand.y - RN.y) < 1.5 : true),
        magGrip: {x: r(magGrip.x), y: r(magGrip.y)},
        lens: {x: r(lc.x), y: r(lc.y)},
        tagEye: {x: r(eye.x), y: r(eye.y)},
        pinPt: {x: r(pinPt.x), y: r(pinPt.y)},
        tie: {x: r(objTie.x), y: r(objTie.y)},
        reached: posed.reached,
        magHolder, tagHolder, lensOn: r(lensOn, 3), pinned,
        stringLen: r(dist),
        head: posed.head,
      },
    };
  }

  return {node, pose, art, tag, rig, G, objTie, leadD};
}

/* ------------------------------------------------------------ label utils */

/** Union of boxes. */
export function unionBox(list) {
  const xs = list.filter(Boolean);
  if (!xs.length) return null;
  const x0 = Math.min(...xs.map(b => b.x)), y0 = Math.min(...xs.map(b => b.y));
  const x1 = Math.max(...xs.map(b => b.x + b.w)), y1 = Math.max(...xs.map(b => b.y + b.h));
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

/**
 * Callout chip with a leader to a target (frame: p in 0..1). Chip text uses
 * fitWords (no mid-word breaks), up to `maxLines`, without shrinking below
 * `minSize`.
 */
export function leaderChip(ctx, o) {
  const c = wchip(ctx, o.text, {x: o.x, y: o.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 3, fill: o.fill ?? ctx.theme.card, stroke: o.stroke ?? INK, color: o.color ?? INK, weight: o.weight ?? 600, name: `${o.name}-chip`});
  const b = c.box;
  let lead = null;
  if (o.target) {
    const t = o.target;
    const from = {x: clamp(t.x, b.x + 10, b.x + b.w - 10), y: t.y > b.y + b.h ? b.y + b.h : t.y < b.y ? b.y : b.y + b.h / 2};
    if (from.y === b.y + b.h / 2) from.x = t.x > b.x + b.w / 2 ? b.x + b.w : b.x;
    lead = g(null,
      h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(t.x)} ${r(t.y)}`, stroke: o.stroke ?? INK, 'stroke-width': 2.4, fill: 'none'}),
      h('circle', {cx: r(t.x), cy: r(t.y), r: 6, fill: o.stroke ?? INK, stroke: '#fff', 'stroke-width': 2}));
  }
  return {node: g({name: o.name, opacity: o.opacity ?? 0}, lead, c.node), box: b, fit: c.fit};
}

/**
 * Place a leader chip in free space near its target: tries a grid of
 * positions inside each region and keeps the one nearest to the target whose
 * box clears every occupied box and whose leader crosses no `avoid` box.
 * Returns null when nothing fits uncut.
 * @param {any} ctx
 * @param {{name:string, text:string, target:{x:number,y:number}, size:number, maxWidth:number, maxLines?:number,
 *   regions:Array<{x:number,y:number,w:number,h:number}>, occupied:Array<any>, avoid?:Array<any>, fill?:string}} o
 */
export function placeNote(ctx, o) {
  let best = null;
  for (const reg of o.regions) {
    if (reg.w < 120 || reg.h < 30) continue;
    const probe = leaderChip(ctx, {name: 'probe', text: o.text, x: 0, y: 0, maxWidth: Math.min(o.maxWidth, reg.w), size: o.size, maxLines: o.maxLines ?? 4});
    if (probe.fit.truncated) continue;
    const bw = probe.box.w, bh = probe.box.h;
    if (bw > reg.w + 0.5 || bh > reg.h + 0.5) continue;
    const nx = Math.max(1, Math.ceil((reg.w - bw) / 30)), ny = Math.max(1, Math.ceil((reg.h - bh) / 22));
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= ny; j++) {
        const box = {x: reg.x + ((reg.w - bw) * i) / nx, y: reg.y + ((reg.h - bh) * j) / ny, w: bw, h: bh};
        if (o.occupied.some(q => overlaps(box, q, 6))) continue;
        for (const t of o.targets || [o.target]) {
          const ex = clamp(t.x, box.x, box.x + box.w), ey = clamp(t.y, box.y, box.y + box.h);
          const d = o.score === 'center' ? Math.hypot(t.x - (box.x + box.w / 2), t.y - (box.y + box.h / 2)) : Math.hypot(t.x - ex, t.y - ey);
          // a box that contains the target itself (e.g. the object's bounds) does not block its leader
          const inside = q => t.x >= q.x && t.x <= q.x + q.w && t.y >= q.y && t.y <= q.y + q.h;
          if ((o.avoid || []).some(q => !inside(q) && segHitsBox({x: ex, y: ey}, t, q))) continue;
          const dd = d + (reg.bias || 0);
          if (!best || dd < best.d) best = {d: dd, box, reg, t};
        }
      }
    }
  }
  if (!best) return null;
  const noLead = typeof o.noLeader === 'function' ? o.noLeader(best.box, best.reg) : o.noLeader;
  const t = noLead ? null : o.leaderTo ? o.leaderTo(best.box) : best.t;
  const c = leaderChip(ctx, {name: o.name, text: o.text, x: best.box.x, y: best.box.y, maxWidth: Math.min(o.maxWidth, best.reg.w), size: o.size, maxLines: o.maxLines ?? 4, target: t, fill: o.fill ?? '#fff', opacity: o.opacity});
  return {...c, d: best.d, target: best.t, reg: best.reg};
}

/** Does segment a→b pass through box q (shrunk slightly)? */
export function segHitsBox(a, b, q) {
  const x0 = q.x + 2, y0 = q.y + 2, x1 = q.x + q.w - 2, y1 = q.y + q.h - 2;
  if (x1 <= x0 || y1 <= y0) return false;
  for (let i = 1; i < 24; i++) {
    const t = i / 24;
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    if (x > x0 && x < x1 && y > y0 && y < y1) return true;
  }
  return false;
}

/**
 * A point on the pinned string's visible span: between where it leaves the
 * object's outline and where it passes behind the pinned tag.
 */
export function stringLabelPoint(stage) {
  const a = stage.objTie, b = stage.G.pin;
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const t0 = Math.min(0.8, (stage.G.obj.R * 1.08) / len);
  const tg = {x: b.x - stage.tag.w / 2 - 4, y: b.y - 4, w: stage.tag.w + 8, h: stage.tag.h + 8};
  let t1 = 1;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    if (x > tg.x && x < tg.x + tg.w && y > tg.y && y < tg.y + tg.h) { t1 = t; break; }
  }
  const t = (t0 + Math.max(t0, t1)) / 2;
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, t};
}

/* --------------------------------------------------- shared lab labelling */

/** Manila tag glyph marking a report section linked to the object. Local origin = top-left. */
export function miniTag(s) {
  return g(null,
    h('path', {d: `M${r(s * 0.25)} 0H${r(s * 0.75)}L${r(s)} ${r(s * 0.25)}V${r(s * 1.2)}H0V${r(s * 0.25)}Z`, fill: MANILA, stroke: INK, 'stroke-width': 2}),
    h('circle', {cx: r(s * 0.5), cy: r(s * 0.3), r: r(s * 0.12), fill: INK}));
}

/**
 * Tag glyphs on the report sections that the supplied relationships link to
 * the object (object → figure | data | opinion). Named `${prefix}-mark-${to}`.
 */
export function linkMarks(ctx, G, relationships, prefix = 'mark') {
  const PL = G.PL;
  const S = PL.S;
  const links = [...new Set((relationships || []).filter(x => x.from === 'object').map(x => x.to))]
    .filter(to => (to === 'figure' && PL.sec.figure) || (to === 'data' && PL.sec.data) || (to === 'opinion' && PL.sec.opinion));
  const s = S * 0.9;
  const marks = links.map(to => {
    const at = to === 'figure' ? {x: PL.figBox.x + PL.figBox.w - s * 1.3, y: PL.figBox.y + s * 0.3}
      : to === 'data' ? {x: PL.dataHeadX + PL.dataHeadW - s * 1.05, y: PL.dataHeadY - s * 0.05}
        : {x: PL.opBox.x + PL.opBox.w - s * 1.6, y: PL.opBox.y + s * 0.5};
    return {to, name: `${prefix}-${to}`, node: g({name: `${prefix}-${to}`, opacity: 0, transform: T(G.page.x + at.x, G.page.y + at.y)}, miniTag(s))};
  });
  return {links, marks};
}

/** Occupied boxes and free regions of a lab stage (design units). */
export function labRegions(G, stage, shape) {
  const k = G.k;
  const headTop = G.floorY - 410 * k;
  const person = {x: G.px - 50 * k, y: headTop, w: 100 * k, h: G.benchTopY - headTop};
  const objBox = {x: G.obj.x - G.obj.R * 1.15, y: G.obj.y - G.obj.R * 1.15, w: G.obj.R * 2.3, h: G.benchTopY - G.obj.y + G.obj.R * 1.15};
  const tagRest = {x: G.tagRest.x - stage.tag.w / 2, y: G.tagRest.y, w: stage.tag.w, h: stage.tag.h};
  const magBox = {x: G.magRest.x - (G.mag.L + G.mag.R * 2) - 6, y: G.magRest.y - G.mag.R * 0.6, w: G.mag.L + G.mag.R * 2 + 12, h: G.mag.R * 1.2};
  const reachBand = {x: G.px, y: G.pin.y - 40 * k, w: G.pin.x - G.px, h: G.obj.y - G.pin.y + 40 * k};
  const B = G.board;
  const dp = BODY.depth * k;
  const panel = {x: G.benchX0 + 20 * k, y: G.benchTopY + 24 * k, w: G.benchX1 - G.benchX0 - 40 * k, h: G.floorY - 30 * k - (G.benchTopY + 24 * k)};
  const x0 = G.x0 + 14, y0 = G.top + 14;
  const free = shape === 'portrait'
    ? [{x: x0, y: B.y + B.h + 14, w: G.px - 58 * k - x0, h: G.benchTopY - dp - 12 - (B.y + B.h + 14)},
      {x: x0, y: B.y + B.h + 14, w: G.pin.x - stage.tag.w / 2 - 10 - x0, h: headTop - 14 - (B.y + B.h + 14)}]
    : [{x: G.px + 52 * k, y: y0, w: B.x - 12 - (G.px + 52 * k), h: G.pin.y - 30 * k - y0},
      {x: B.x, y: B.y + B.h + 14, w: B.w, h: G.floorY - 12 - (B.y + B.h + 14)},
      {x: x0, y: y0, w: G.px - 58 * k - x0, h: G.benchTopY - dp - 12 - y0},
      {x: x0, y: y0, w: B.x - 12 - x0, h: headTop - 12 - y0}];
  const PL = G.PL;
  const capBox = PL.sec.figure ? {x: G.page.x + PL.figX, y: G.page.y + PL.figCapY - 4, w: PL.figW, h: PL.figCap.height + 8} : {x: -1e4, y: -1e4, w: 0, h: 0};
  const textBox = {x: G.page.x + PL.pad, y: G.page.y + PL.ruleY, w: PL.w - PL.pad * 2, h: PL.textBottom - PL.ruleY};
  const pageBox = {x: G.page.x, y: G.page.y, w: G.page.w, h: G.page.h};
  const inPanel = b => b.y >= panel.y - 1 && b.y + b.h <= panel.y + panel.h + 1 && b.x >= panel.x - 1 && b.x + b.w <= panel.x + panel.w + 1;
  const lensRest = {x: G.magRest.x - (G.mag.L + G.mag.R), y: G.magRest.y};
  const torso = {x: G.px - 10 * k, y: G.benchTopY - 60 * k};
  const occupied = [person, objBox, tagRest, magBox, B, reachBand];
  const blocks = pageTextBlocks(G);
  const tagPinned = {x: G.pin.x - stage.tag.w / 2 - 4, y: G.pin.y - 8, w: stage.tag.w + 8, h: stage.tag.h + 12};
  return {tagPinned, blocks, headTop, person, objBox, tagRest, magBox, reachBand, panel, free, capBox, textBox, pageBox, inPanel, lensRest, torso, occupied};
}

/**
 * Standard label specs for a lab stage: the tool (under the lying magnifier),
 * the object name (leader to the stand) and the specialist caption (on the
 * bench panel under the person, else with a leader to the person).
 */
export function labChipSpecs(G, R, {tool, object, specialist}) {
  const k = G.k;
  const specs = [];
  if (tool) specs.push({name: 'chip-tool', text: tool, targets: [{x: R.lensRest.x, y: R.lensRest.y + G.mag.R * 0.3}], avoidExtra: [R.person], atRest: true});
  if (object) specs.push({name: 'chip-obj', text: object, targets: [{x: G.obj.x + G.obj.R * 0.42, y: G.benchTopY + 4}, {x: G.obj.x - G.obj.R * 0.95, y: G.obj.y}], avoidExtra: [R.person], atRest: true});
  if (specialist) {
    // always attached to the person by a short leader (to the torso above the bench, or the head)
    specs.push({name: 'chip-sp', text: specialist, targets: [R.torso, {x: G.px - 24 * k, y: R.headTop + 70 * k}], atRest: true, avoidExtra: [R.objBox, ...R.blocks]});
  }
  return specs;
}

/**
 * Place a set of labels: `chips` (visible from the rest pose; they avoid the
 * resting tag) prefer the bench panel; `notes` (hold only) prefer the free
 * regions. Searches chip orders and bounded caption sizes (never below Smin)
 * until every label fits uncut; returns the best attempt otherwise.
 */
export function placeLabelSet(ctx, {R, chips: chipSpecs, notes: noteSpecs, size, Smin, maxWidth, extraOccupied = []}) {
  const occupied = [...R.occupied, ...extraOccupied];
  const pass = (sz, chipOrder, noteOrder) => {
    const out = [];
    const boxes = () => out.map(c => c.box);
    const put = (spec, regions) => {
      const atRest = spec.atRest;
      const placed = placeNote(ctx, {size: sz, maxWidth, maxLines: 4, opacity: atRest ? 1 : 0, ...spec, regions,
        occupied: [...(atRest ? occupied : occupied.filter(b => b !== R.tagRest)), ...boxes()],
        avoid: [...(atRest ? [R.tagRest] : []), ...boxes(), ...(spec.avoidExtra || [])]});
      if (placed) out.push({...placed, spec});
      return Boolean(placed);
    };
    const chipsFit = chipOrder.every(spec => put(spec, spec.regions || [R.panel, ...R.free]));
    const notesFit = chipsFit && noteOrder.every(spec => put(spec, spec.regions || [...R.free, R.panel]));
    return {placed: out, chipsFit, notesFit, size: sz};
  };
  const perms = list => (list.length <= 1 ? [list] : list.flatMap((x, i) => perms([...list.slice(0, i), ...list.slice(i + 1)]).map(rest => [x, ...rest])));
  // variants: chips free to use any region, or kept on the bench panel (frees the side regions for notes)
  const variants = [chipSpecs, chipSpecs.map(c => ({...c, regions: [R.panel]}))];
  const noteOrders = noteSpecs.length > 1 ? [noteSpecs, noteSpecs.slice().reverse()] : [noteSpecs];
  let best = null;
  for (const f of [1, 0.92, 0.85, 0.78]) {
    const sz = Math.max(Smin, size * f);
    for (const vs of variants) {
      for (const co of perms(vs)) {
        for (const no of noteOrders) {
          const a = pass(sz, co, no);
          if (!best || (a.chipsFit && a.notesFit)) best = a;
          if (a.chipsFit && a.notesFit) return a;
        }
      }
    }
    if (sz <= Smin) break;
  }
  return best;
}

/**
 * Best free box of size w × h near one of `targets` (same rules as placeNote).
 * @returns {{box:any, t:any}|null}
 */
export function findSpot(w, h, {regions, occupied, targets, avoid = [], score = 'edge'}) {
  let best = null;
  for (const reg of regions) {
    if (w > reg.w + 0.5 || h > reg.h + 0.5) continue;
    const nx = Math.max(1, Math.ceil((reg.w - w) / 30)), ny = Math.max(1, Math.ceil((reg.h - h) / 22));
    for (let i = 0; i <= nx; i++) {
      for (let j = 0; j <= ny; j++) {
        const box = {x: reg.x + ((reg.w - w) * i) / nx, y: reg.y + ((reg.h - h) * j) / ny, w, h};
        if (occupied.some(q => overlaps(box, q, 6))) continue;
        for (const t of targets) {
          const ex = clamp(t.x, box.x, box.x + box.w), ey = clamp(t.y, box.y, box.y + box.h);
          const d = score === 'center' ? Math.hypot(t.x - (box.x + w / 2), t.y - (box.y + h / 2)) : Math.hypot(t.x - ex, t.y - ey);
          const inside = q => t.x >= q.x && t.x <= q.x + q.w && t.y >= q.y && t.y <= q.y + q.h;
          if (avoid.some(q => !inside(q) && segHitsBox({x: ex, y: ey}, t, q))) continue;
          if (!best || d < best.d) best = {d, box, t};
        }
      }
    }
  }
  return best;
}

/** Straight strike-through lines over a fitted text block (page-local). */
export function strikeLines(ctx, fit, {x, y, anchor = 'start', color, name, opacity}) {
  return g({name, opacity}, fit.lines.map((line, i) => {
    const w = ctx.measure(line, fit.size, fit.weight, fit.family);
    const x0 = anchor === 'middle' ? x - w / 2 : x;
    const yy = y + i * fit.lineHeight + fit.size * 0.52;
    return h('line', {x1: r(x0 - 2), x2: r(x0 + w + 2), y1: r(yy), y2: r(yy), stroke: color, 'stroke-width': Math.max(2, fit.size * 0.09), 'stroke-linecap': 'round'});
  }));
}

/**
 * World boxes of every text block on a lab page (title, headings, rows, opinion,
 * scope, key, figure caption) — obstacles for leaders and labels. Unlike the
 * coarse text box, a target on the page never exempts a block.
 */
export function pageTextBlocks(G) {
  const PL = G.PL;
  const tb = (x, y, f) => (f ? {x: G.page.x + x - 4, y: G.page.y + y - 4, w: f.width + 8, h: f.height + 8} : null);
  const pick = (a, b) => (b && b.width > a.width ? b : a);
  return [
    PL.title && tb(PL.pad, PL.titleY, PL.title),
    PL.sec.data && tb(PL.dataHeadX + PL.glyph, PL.dataHeadY, PL.dataHead),
    ...(PL.sec.data ? PL.rows.map(q => tb(q.x, q.y, pick(q.fit, q.alt))) : []),
    PL.sec.opinion && tb(PL.opX + PL.glyph, PL.opHeadY, PL.opHead),
    PL.sec.opinion && tb(PL.opX, PL.opY, PL.op),
    PL.sec.opinion && tb(PL.scX, PL.scY, pick(PL.sc, PL.scAlt)),
    PL.key && tb(PL.keyX, PL.keyY, PL.key),
    PL.sec.figure && PL.figCap && {x: G.page.x + PL.figX - 4, y: G.page.y + PL.figCapY - 4, w: PL.figW + 8, h: PL.figCap.height + 8},
  ].filter(Boolean);
}
