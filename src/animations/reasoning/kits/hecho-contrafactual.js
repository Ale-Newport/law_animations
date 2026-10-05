/**
 * Kit for the "Hecho contrafactual" motif (LAW-0113..0116): field set,
 * strings, geometry and original vector parts. Each entry owns its own
 * timeline, composition and semantics; this file only draws and measures.
 *
 * Physical metaphor — a tabletop DIORAMA replayed like a film take
 *  - HECHO (fact)      a miniature open-front diorama: a garden on the left, a
 *                      house front on the right (window + sill, door, porch
 *                      bench, wall parcel box). A figurine on a round stand
 *                      carries a parcel along the floor and leaves it on a
 *                      SPOT. Every event of the scene is supplied by the
 *                      author; the scene only replays them.
 *  - The single CHANGED CIRCUMSTANCE is WHERE the parcel is left: a pennant
 *                      flag pin marks the spot. Base run → flag on spot A;
 *                      the hypothetical replay → the flag is moved to spot B.
 *                      A dashed ghost keeps the base result traceable.
 *  - REPLAY            two film reels on the plinth apron turn forward (play),
 *                      backwards (rewind) and forward again; two take lamps
 *                      (A blue, B orange) show which take is running. None of
 *                      this is text, so the replay reads with labels hidden.
 *  - REGLA (rule)      a pinned notice with the author's illustrative text.
 *  - CONECTOR          a plain relation line (dots, never an arrow) from the
 *                      changed circumstance to the rule condition the author
 *                      says it concerns. It never states causation.
 *  - LUPA              a hand magnifier (mechanism / inspect).
 * Legal content: fictional, jurisdiction unspecified, illustrative text only.
 * The replay never infers what the change would cause: the outcome of the
 * hypothetical run is "not supplied" and no conclusion is drawn.
 * @module animations/reasoning/kits/hecho-contrafactual
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r, lerp, clamp, ease} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, oneOf, list, obj} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {personRig} from '../../../primitives/person.js';
import {shade} from '../../../primitives/paper.js';

/* ------------------------------------------------------------------------ */
/* Strings                                                                  */
/* ------------------------------------------------------------------------ */

export const HC_STRINGS = {
  en: {
    factKind: 'Facts · as supplied',
    ruleKind: 'Rule · illustrative text',
    illustrativeText: 'illustrative text',
    circumstance: 'Changed circumstance',
    baseT: 'Base: {x}',
    whatIfT: 'What if: {x} (hypothetical)',
    hypothetical: 'hypothetical',
    base: 'Base scenario',
    asSupplied: 'as supplied',
    noConclusion: 'no conclusion drawn',
    key: 'Same scene replayed · one circumstance changed · as supplied · no conclusion drawn',
    outcome: 'Outcome of the hypothetical run: not supplied',
    keyOutcome: 'As supplied · outcome of the hypothetical run: not supplied · no conclusion drawn',
    notReplayed: 'Hypothetical run not played (as supplied)',
    issue: 'Issue',
    assumed: 'Assumed',
    concerns: 'concerns condition {n} (as supplied)',
    condition: 'Condition',
    lupa: 'Magnifier',
    replay: 'replay',
    take: 'Take',
    changed: 'Changed',
    before: 'Before',
    after: 'After',
    context: 'Context',
    sameFacts: 'Same facts',
    sameInAB: 'Same in A and B · as supplied',
  },
  es: {
    factKind: 'Hechos · según lo aportado',
    ruleKind: 'Regla · texto ilustrativo',
    illustrativeText: 'texto ilustrativo',
    circumstance: 'Circunstancia cambiada',
    baseT: 'Base: {x}',
    whatIfT: '¿Y si {x}? (hipotético)',
    hypothetical: 'hipotético',
    base: 'Escenario base',
    asSupplied: 'según lo aportado',
    noConclusion: 'sin conclusión',
    key: 'Misma escena repetida · una sola circunstancia cambiada · según lo aportado · sin conclusión',
    outcome: 'Resultado de la repetición hipotética: no aportado',
    keyOutcome: 'Según lo aportado · resultado de la repetición hipotética: no aportado · sin conclusión',
    notReplayed: 'Repetición hipotética no ejecutada (según lo aportado)',
    issue: 'Cuestión',
    assumed: 'Se asume',
    concerns: 'se relaciona con la condición {n} (según lo aportado)',
    condition: 'Condición',
    lupa: 'Lupa',
    replay: 'repetición',
    take: 'Toma',
    changed: 'Cambiado',
    before: 'Antes',
    after: 'Después',
    context: 'Contexto',
    sameFacts: 'Mismos hechos',
    sameInAB: 'Igual en A y B · según lo aportado',
  },
};

/** Fill a {x}/{n} template. */
export const fill = (tpl, vars) => String(tpl).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));

/* ------------------------------------------------------------------------ */
/* Fields                                                                   */
/* ------------------------------------------------------------------------ */

export const SPOT_IDS = ['bench', 'sill', 'box'];

export const hcFields = {
  facts: obj('The scene as supplied: a title and the ordered events that are replayed identically in both runs (fictional)', {
    title: str('Title of the scene', 70),
    events: list('Events of the scene in order (2–4); identical in the base run and in the hypothetical replay', str('Event', 80), 2, 4),
  }, ['title', 'events']),
  rules: obj('Rule notice: illustrative text supplied by the author, not a statement of any law', {
    title: str('Title printed on the notice', 70),
    conditions: list('Conditions printed on the notice (1–3)', str('Condition text', 80), 1, 3),
  }, ['title', 'conditions']),
  circumstance: obj('The ONE circumstance the replay changes, supplied by the author: where the parcel is left', {
    label: str('What the circumstance is', 60),
    base: oneOf('Spot in the base scenario', SPOT_IDS),
    baseText: str('Description of the base spot', 60),
    alt: oneOf('Spot in the hypothetical replay (what if …)', SPOT_IDS),
    altText: str('Description of the hypothetical spot', 60),
    condition: int('Zero-based rule condition the author says this circumstance concerns (drawn as a plain relation, never as causation)', 0, 2),
  }, ['label', 'base', 'baseText', 'alt', 'altText']),
  issues: list('Open questions supplied by the author (shown, never answered)', str('Question', 90), 0, 2),
  assumptions: list('Working assumptions supplied by the author (not verified)', str('Assumption', 70), 0, 2),
};

export const DEFAULT_CONTENT = {
  facts: {
    title: 'Delivery at No. 9 (fictional)',
    events: ['A courier arrives at 18:10', 'Carries parcel 7 to the house', 'Leaves it and steps back'],
  },
  rules: {
    title: 'House notice 2 (fictional text)',
    conditions: ['A parcel is left for a resident', 'at a place agreed with the resident', 'before 19:00'],
  },
  circumstance: {label: 'Where the parcel is left', base: 'bench', baseText: 'on the porch bench', alt: 'sill', altText: 'on the window sill', condition: 1},
  issues: ['Was the window sill ever agreed as a place?'],
  assumptions: ['Everything else happens as in the base run'],
};

/* ------------------------------------------------------------------------ */
/* Diorama geometry (native units; entries place it with T(x, y, 0, ds))    */
/* ------------------------------------------------------------------------ */

export const STAGE = {w: 1000, h: 600, floorY: 478, startX: 112, backTop: 20, backBottom: 450, frontY: 500};
export const K = 0.5; // figurine scale
export const PW = 36; // parcel
export const PH = 30;
export const SPOTS = {
  bench: {cx: 875, y: 372},
  sill: {cx: 535, y: 300},
  box: {cx: 905, y: 306},
};
export const FLAG_H = 62;

export const parcelAt = spot => ({x: SPOTS[spot].cx, y: SPOTS[spot].y - PH / 2});
export const standX = spot => SPOTS[spot].cx - 34;
export const flagBase = spot => ({x: SPOTS[spot].cx + PW / 2 + 14, y: SPOTS[spot].y});
export const flagTop = spot => ({x: flagBase(spot).x, y: flagBase(spot).y - FLAG_H});
/** Region (native) that contains a spot, its parcel and its flag. */
export const spotBox = (spot, pad = 14) => {
  const s = SPOTS[spot];
  return {x: s.cx - PW / 2 - pad, y: s.y - FLAG_H - pad, w: PW + 32 + 2 * pad, h: FLAG_H + 2 * pad};
};

/* colours */
export function hcColors(ctx) {
  const th = ctx.theme;
  return {
    a: th.accent2, // base (A)
    b: th.accent, // hypothetical (B)
    aSoft: th.accent2Soft,
    bSoft: th.accentSoft,
    flag: th.accent3,
    rule: '#5d7a6a',
    fact: '#e8eef3',
    ink: th.ink,
  };
}

/* ------------------------------------------------------------------------ */
/* Run timing: one take of the scene as a function of run time τ.           */
/* The walking curve is shared by every take (same speed, same start), so a */
/* take to a nearer spot is identical to a take to a farther spot until its */
/* own stop — only the changed circumstance alters geometry and sequence.   */
/* ------------------------------------------------------------------------ */

const TW = 0.58; // walk window of the longest take
const TP = 0.2; // place
const TR = 0.08; // release
const TB = 0.14; // step back
const STEP = 64; // hop length
const BACK = 118; // step-back distance

const einv = y => Math.acos(clamp(1 - 2 * y, -1, 1)) / Math.PI; // inverse of ease.inOutSine

/**
 * Take plan for a spot, given the farthest stand of the takes being compared.
 * @param {string} spot
 * @param {number} dMax walking distance of the longest take
 */
export function takePlan(spot, dMax) {
  const D = standX(spot) - STAGE.startX;
  const w = D >= dMax - 0.5 ? 0 : Math.min(0.25 * D, dMax - D);
  const tStop = w === 0 ? TW : TW * einv((D + w) / dMax);
  return {spot, D, w, dMax, tStop, tPlaced: tStop + TP, tReleased: tStop + TP + TR, tEnd: tStop + TP + TR + TB};
}

/** Distance of the shared walking curve at τ, softly stopped at D. */
function walked(plan, tau) {
  const d = plan.dMax * ease.inOutSine(clamp(tau / TW));
  if (plan.w === 0) return Math.min(d, plan.D);
  const knee = plan.D - plan.w;
  if (d <= knee) return d;
  const t = clamp((d - knee) / (2 * plan.w));
  return knee + plan.w * (1 - (1 - t) * (1 - t));
}

/** Rest hand targets of the figurine (world = native stage units). */
export const restHands = (x, y) => ({near: {x: x + 22 * K, y: y - 156 * K}, far: {x: x - 10 * K, y: y - 159 * K}});
const carryAt = (x, y) => ({x: x + 34, y: y - 108});
const grips = c => ({near: {x: c.x - PW / 2 + 2, y: c.y + 3}, far: {x: c.x + PW / 2 - 2, y: c.y + 3}});

/**
 * Walking state at distance d from the start (used by a rewind that glides
 * back at an even pace): same hop, carry pose and grips as the take.
 */
export function walkStateAt(plan, d) {
  const figX = STAGE.startX + d;
  const lift = Math.abs(Math.sin((Math.PI * d) / STEP)) * 7 * clamp((plan.D - d) / 36) * clamp(d / 12);
  const parcel = carryAt(figX, STAGE.floorY - lift);
  return {figX, lift, parcel, holder: 'figure', ...grips(parcel), phase: 'walk'};
}

/**
 * Rewind of a take: k ∈ [0,1]. The first 40 % reverses the step back, release
 * and placement (take time runs backwards); the rest glides the figurine back
 * along the floor at an even pace.
 */
export function rewindState(plan, k) {
  if (k < 0.4) return takeState(plan, lerp(plan.tEnd, plan.tStop, ease.inOutSine(k / 0.4)));
  const q = ease.inOutSine((k - 0.4) / 0.6);
  return walkStateAt(plan, plan.D * (1 - q));
}

/**
 * State of one take at run time τ (τ may exceed tEnd: the take then holds).
 * @returns {{figX:number, lift:number, parcel:{x:number,y:number}, holder:'figure'|'spot', near:{x:number,y:number}, far:{x:number,y:number}, phase:string}}
 */
export function takeState(plan, tau) {
  const y0 = STAGE.floorY;
  const sx = standX(plan.spot);
  let figX, lift = 0, phase;
  if (tau < plan.tStop) {
    const d = walked(plan, tau);
    figX = STAGE.startX + d;
    lift = Math.abs(Math.sin((Math.PI * d) / STEP)) * 7 * clamp((plan.D - d) / 36) * clamp(d / 12);
    phase = 'walk';
  } else if (tau < plan.tReleased) {
    figX = sx;
    phase = tau < plan.tPlaced ? 'place' : 'release';
  } else {
    const t = ease.inOutCubic(clamp((tau - plan.tReleased) / TB));
    figX = sx - BACK * t;
    lift = Math.abs(Math.sin(Math.PI * 2 * t)) * 5;
    phase = tau >= plan.tEnd ? 'done' : 'back';
  }
  const fy = y0 - lift;
  const place = parcelAt(plan.spot);
  let parcel, holder, near, far;
  if (tau < plan.tStop) {
    parcel = carryAt(figX, fy);
    holder = 'figure';
  } else if (tau < plan.tPlaced) {
    const t = ease.inOutCubic(clamp((tau - plan.tStop) / TP));
    const c0 = carryAt(sx, y0);
    parcel = {x: lerp(c0.x, place.x, t), y: lerp(c0.y, place.y, t) - Math.sin(Math.PI * t) * 10};
    holder = 'figure';
  } else {
    parcel = {...place};
    holder = 'spot';
  }
  if (holder === 'figure') ({near, far} = grips(parcel));
  else {
    const gp = grips(place);
    const rest = restHands(figX, fy);
    const t = ease.inOutSine(clamp((tau - plan.tPlaced) / TR));
    near = {x: lerp(gp.near.x, rest.near.x, t), y: lerp(gp.near.y, rest.near.y, t)};
    far = {x: lerp(gp.far.x, rest.far.x, t), y: lerp(gp.far.y, rest.far.y, t)};
  }
  return {figX, lift, parcel, holder, near, far, phase};
}

/* ------------------------------------------------------------------------ */
/* Vector art                                                               */
/* ------------------------------------------------------------------------ */

const INK = '#1f2328';
const SW = 2.4;

/**
 * Static diorama layers in native units.
 * @param {any} ctx
 * @param {{prefix:string, seedKey?:string}} o
 * @returns {{back:any, boxFront:any, apron:any, reels:{left:{x:number,y:number}, right:{x:number,y:number}}}}
 */
export function dioramaArt(ctx, o) {
  const th = ctx.theme;
  const key = o.seedKey || 'hc-stage';
  const P = o.prefix;
  const wood = th.wood, woodTop = th.woodTop;
  const sky = '#dde9ef';
  const floor = '#d7d2bf';
  const facade = '#efe2cb';
  const rim = shade(wood, -0.25);
  const back = [];
  // outer box: top rim + side walls
  back.push(h('path', {d: 'M0 0H1000L960 20H40Z', fill: shade(woodTop, -0.08), stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}));
  back.push(h('path', {d: 'M0 0L40 20V450L0 500Z', fill: shade(woodTop, -0.18), stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}));
  back.push(h('path', {d: 'M1000 0L960 20V450L1000 500Z', fill: shade(woodTop, -0.22), stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}));
  // painted sky backdrop with two soft clouds
  back.push(h('rect', {x: 40, y: 20, width: 920, height: 430, fill: sky}));
  back.push(h('rect', {x: 40, y: 330, width: 920, height: 120, fill: '#e6eee9'}));
  for (const [cx, cy, s] of [[150, 90, 1], [330, 70, 0.8]]) {
    back.push(h('path', {d: `M${cx - 60 * s} ${cy}q${10 * s} ${-26 * s} ${36 * s} ${-18 * s}q${14 * s} ${-24 * s} ${44 * s} ${-12 * s}q${30 * s} ${-6 * s} ${40 * s} ${20 * s}q${14 * s} ${6 * s} ${4 * s} ${10 * s}Z`, fill: '#ffffff', opacity: 0.8}));
  }
  // floor (top face, paving lines)
  back.push(h('path', {d: 'M40 450H960L1000 500H0Z', fill: floor, stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}));
  for (let i = 1; i < 12; i++) {
    const xb = 40 + i * (920 / 12), xf = i * (1000 / 12);
    back.push(h('line', {x1: r(xb), y1: 450, x2: r(xf), y2: 500, stroke: shade(floor, -0.1), 'stroke-width': 1.6}));
  }
  back.push(h('line', {x1: 20, y1: 475, x2: 980, y2: 475, stroke: shade(floor, -0.1), 'stroke-width': 1.6}));
  // garden: hedge bumps and a lamp post
  const hedge = [];
  for (let i = 0; i < 7; i++) {
    const cx = 70 + i * 50 + (ctx.rng(`${key}-hedge`, i) - 0.5) * 10;
    const rr = 34 + ctx.rng(`${key}-hedgeR`, i) * 12;
    hedge.push(h('circle', {cx: r(cx), cy: r(420 - rr * 0.35), r: r(rr), fill: '#7ea46d', stroke: INK, 'stroke-width': SW}));
  }
  back.push(g(null, hedge, h('rect', {x: 40, y: 418, width: 380, height: 32, fill: '#7ea46d'}), h('line', {x1: 40, y1: 450, x2: 420, y2: 450, stroke: INK, 'stroke-width': SW})));
  for (let i = 0; i < 9; i++) {
    const lx = 60 + i * 40 + ctx.rng(`${key}-leaf`, i) * 14, ly = 395 + ctx.rng(`${key}-leafY`, i) * 30;
    back.push(h('path', {d: `M${r(lx)} ${r(ly)}q6 -8 12 0`, fill: 'none', stroke: shade('#7ea46d', -0.3), 'stroke-width': 2, 'stroke-linecap': 'round'}));
  }
  back.push(g(null,
    h('rect', {x: 318, y: 250, width: 12, height: 200, fill: '#56616b', stroke: INK, 'stroke-width': 2}),
    h('path', {d: 'M306 250L342 250L334 222H314Z', fill: '#56616b', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: 312, y: 226, width: 24, height: 20, rx: 3, fill: '#fbe7a8', stroke: INK, 'stroke-width': 2}),
    h('rect', {x: 310, y: 444, width: 28, height: 8, rx: 2, fill: '#56616b', stroke: INK, 'stroke-width': 2}),
  ));
  // house front: wall with siding, eave, window + sill, door + step, bench, parcel box
  back.push(h('rect', {x: 420, y: 170, width: 540, height: 280, fill: facade, stroke: INK, 'stroke-width': SW}));
  for (let yy = 196; yy < 450; yy += 26) back.push(h('line', {x1: 422, y1: yy, x2: 958, y2: yy, stroke: shade(facade, -0.07), 'stroke-width': 2}));
  back.push(h('path', {d: 'M404 150H960V184H420Z', fill: '#8a5a44', stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}));
  back.push(h('line', {x1: 410, y1: 162, x2: 958, y2: 162, stroke: shade('#8a5a44', -0.25), 'stroke-width': 2}));
  // window (x 470..600, y 210..300) and sill (surface y 300)
  back.push(g(null,
    h('rect', {x: 470, y: 208, width: 130, height: 92, fill: '#ffffff', stroke: INK, 'stroke-width': SW}),
    h('rect', {x: 480, y: 218, width: 50, height: 34, fill: '#bcd7e3'}),
    h('rect', {x: 540, y: 218, width: 50, height: 34, fill: '#bcd7e3'}),
    h('rect', {x: 480, y: 258, width: 50, height: 34, fill: '#bcd7e3'}),
    h('rect', {x: 540, y: 258, width: 50, height: 34, fill: '#bcd7e3'}),
    h('path', {d: 'M486 246L506 222M548 286L572 262', stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.8}),
    h('path', {d: 'M456 300H614V312H456Z', fill: '#d9cbb3', stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M462 312H608L600 318H470Z', fill: shade('#d9cbb3', -0.2), stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
  ));
  // door (x 680..770, y 246..450)
  back.push(g(null,
    h('rect', {x: 672, y: 238, width: 106, height: 212, fill: '#ffffff', stroke: INK, 'stroke-width': SW}),
    h('rect', {x: 682, y: 248, width: 86, height: 202, fill: '#5f7f8f', stroke: INK, 'stroke-width': SW}),
    h('rect', {x: 694, y: 262, width: 62, height: 70, rx: 4, fill: 'none', stroke: shade('#5f7f8f', -0.3), 'stroke-width': 2}),
    h('rect', {x: 694, y: 346, width: 62, height: 90, rx: 4, fill: 'none', stroke: shade('#5f7f8f', -0.3), 'stroke-width': 2}),
    h('circle', {cx: 756, cy: 350, r: 5, fill: th.accent3, stroke: INK, 'stroke-width': 1.6}),
    h('path', {d: 'M664 440H786V452H664Z', fill: '#c9c2b4', stroke: INK, 'stroke-width': 2}),
  ));
  // wall parcel box (x 862..950, y 244..310): back plate here, front lip in boxFront
  back.push(g(null,
    h('rect', {x: 860, y: 238, width: 92, height: 74, rx: 5, fill: '#7d8b93', stroke: INK, 'stroke-width': SW}),
    h('rect', {x: 868, y: 246, width: 76, height: 58, rx: 3, fill: shade('#7d8b93', -0.3)}),
    h('rect', {x: 864, y: 306, width: 84, height: 6, fill: '#6b7880'}),
  ));
  // porch bench (x 800..950): backrest, seat (surface y 372), legs
  const bw = '#b07a4f';
  back.push(g(null,
    h('rect', {x: 806, y: 326, width: 138, height: 12, rx: 3, fill: shade(bw, 0.08), stroke: INK, 'stroke-width': 2}),
    h('rect', {x: 806, y: 344, width: 138, height: 12, rx: 3, fill: shade(bw, 0.08), stroke: INK, 'stroke-width': 2}),
    h('path', {d: 'M816 356V372M934 356V372', stroke: INK, 'stroke-width': 5}),
    h('rect', {x: 798, y: 372, width: 154, height: 12, rx: 3, fill: bw, stroke: INK, 'stroke-width': SW}),
    h('path', {d: 'M810 384V452M940 384V452', stroke: shade(bw, -0.3), 'stroke-width': 9, 'stroke-linecap': 'round'}),
  ));
  const boxFront = g({name: `${P}-boxfront`},
    h('path', {d: 'M860 282H952V312H860Z', fill: '#8e9ca4', stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}),
    h('rect', {x: 890, y: 290, width: 32, height: 8, rx: 3, fill: shade('#8e9ca4', -0.25)}),
  );
  // plinth front with reels, film tape, play/rewind icons and two take lamps
  const RL = {x: 420, y: 550}, RR = {x: 580, y: 550};
  const reel = (c, name) => g({name, transform: T(c.x, c.y)},
    h('circle', {r: 34, fill: '#39424a', stroke: INK, 'stroke-width': SW}),
    ...[0, 1, 2, 3, 4].map(i => {
      const a = (i * 72 * Math.PI) / 180;
      return h('circle', {cx: r(Math.cos(a) * 20), cy: r(Math.sin(a) * 20), r: 7.5, fill: '#cfd6dc'});
    }),
    h('circle', {r: 7, fill: '#cfd6dc', stroke: INK, 'stroke-width': 1.6}),
  );
  const apron = g(null,
    h('path', {d: 'M0 500H1000V600H0Z', fill: wood, stroke: INK, 'stroke-width': SW, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M0 500H1000V510H0Z', fill: shade(wood, 0.12)}),
    h('rect', {x: 330, y: 512, width: 340, height: 78, rx: 12, fill: rim, stroke: INK, 'stroke-width': 2}),
    h('path', {d: `M${RL.x} ${RL.y + 34}H${RR.x}M${RL.x} ${RL.y - 34}H${RR.x}`, stroke: '#2b3137', 'stroke-width': 6}),
    reel(RL, `${P}-reelL`), reel(RR, `${P}-reelR`),
    h('path', {name: `${P}-play`, d: 'M490 536L516 550L490 564Z', fill: '#f4f1ea', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0}),
    h('path', {name: `${P}-rew`, d: 'M512 536L488 550L512 564ZM534 536L510 550L534 564Z', fill: '#f4f1ea', stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round', opacity: 0}),
    h('circle', {cx: 300, cy: 551, r: 11, fill: '#8a8f94', stroke: INK, 'stroke-width': 2}),
    h('circle', {name: `${P}-lampA`, cx: 300, cy: 551, r: 11, fill: th.accent2, stroke: INK, 'stroke-width': 2, opacity: 0}),
    h('circle', {cx: 700, cy: 551, r: 11, fill: '#8a8f94', stroke: INK, 'stroke-width': 2}),
    h('circle', {name: `${P}-lampB`, cx: 700, cy: 551, r: 11, fill: th.accent, stroke: INK, 'stroke-width': 2, opacity: 0}),
  );
  return {back: g({name: `${P}-back`}, back), boxFront, apron, reels: {left: RL, right: RR}};
}

/** Parcel (cardboard box with tape). Local origin = centre. */
export function parcelArt(ctx, name) {
  const c = '#c8955c';
  return g({name},
    h('rect', {x: -PW / 2, y: -PH / 2, width: PW, height: PH, rx: 3, fill: c, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: -PW / 2, y: -PH / 2, width: PW, height: 7, fill: shade(c, 0.15), stroke: INK, 'stroke-width': 1.6}),
    h('rect', {x: -4, y: -PH / 2, width: 8, height: PH, fill: '#e6c690', opacity: 0.9}),
    h('rect', {x: 5, y: 1, width: 10, height: 7, rx: 1, fill: '#ffffff', stroke: INK, 'stroke-width': 1}),
  );
}

/** Dashed ghost outline of the parcel (traced base result). Local origin = centre. */
export function ghostArt(ctx, name, color) {
  const w = PW + 12, hh = PH + 12;
  const len = 2 * (w + hh);
  const node = g({name, opacity: 0},
    h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 6, fill: color, 'fill-opacity': 0.2}),
    h('rect', {name: `${name}-line`, x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 6, fill: 'none', stroke: color, 'stroke-width': 3.6, 'stroke-dasharray': '8 5'}),
  );
  return {node, len};
}

/** Pennant flag pin (the circumstance marker). Local origin = pin foot. */
export function flagArt(ctx, name, color) {
  const th = ctx.theme;
  return g({name},
    h('ellipse', {cx: 0, cy: -2, rx: 10, ry: 4, fill: '#56616b', stroke: INK, 'stroke-width': 1.6}),
    h('line', {x1: 0, y1: -2, x2: 0, y2: -FLAG_H, stroke: '#56616b', 'stroke-width': 4, 'stroke-linecap': 'round'}),
    h('path', {d: `M2 ${-FLAG_H + 2}L34 ${-FLAG_H + 13}L2 ${-FLAG_H + 24}Z`, fill: color || th.accent3, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('circle', {cx: 0, cy: -FLAG_H, r: 5, fill: '#e9edf0', stroke: INK, 'stroke-width': 1.6}),
  );
}

/**
 * Figurine: personRig on a round game-piece stand with a floor shadow.
 * @param {any} ctx
 * @param {{name:string, look:any}} o
 */
export function figurine(ctx, o) {
  const rig = personRig(ctx, {name: o.name, look: o.look});
  const N = o.name;
  const node = g(null,
    h('ellipse', {name: `${N}-shadow`, cx: 0, cy: 0, rx: 36, ry: 7, fill: '#1f2328', opacity: 0.18}),
    h('ellipse', {name: `${N}-disc`, cx: 0, cy: 0, rx: 30, ry: 7, fill: '#56616b', stroke: INK, 'stroke-width': 2}),
    rig.node,
  );
  /**
   * @param {{x:number, lift:number, near:{x:number,y:number}, far:{x:number,y:number}}} s  native stage units
   */
  function pose(s) {
    const y = STAGE.floorY - s.lift;
    const fr = rig.frame({x: s.x, y, scale: K, near: s.near, far: s.far});
    const nodes = fr.nodes;
    nodes[`${N}-disc`] = {transform: T(s.x + 3, y + 2)};
    nodes[`${N}-shadow`] = {transform: T(s.x + 3, STAGE.floorY + 3), opacity: r(0.18 * (1 - s.lift / 14), 3)};
    return {nodes, reached: fr.reached, hands: fr.hands, head: fr.head};
  }
  return {node, pose};
}

/**
 * Onion-skin copy of the figurine at one pose (a static, faded trace of the
 * base take). Names are dropped, so it registers no handles.
 * @param {any} ctx
 * @param {{name:string, look:any, state:{figX:number, lift:number, near:any, far:any}}} o
 */
export function ghostFigure(ctx, o) {
  const f = figurine(ctx, {name: `${o.name}-src`, look: o.look});
  const ps = f.pose({x: o.state.figX, lift: 0, near: o.state.near, far: o.state.far});
  return {node: g({name: o.name, opacity: 0}, bake(f.node, ps.nodes)), reached: ps.reached};
}

/** Rotation (deg) of the reels for a cumulative playback amount. */
export const reelAngle = turns => r(turns * 360, 2);

/* ------------------------------------------------------------------------ */
/* Text panels                                                              */
/* ------------------------------------------------------------------------ */

/** Letter badge (A/B) — the letter only when key labels show. */
export function letterBadge(ctx, o) {
  return g({name: o.name, transform: T(o.x, o.y), opacity: o.opacity},
    h('circle', {r: o.r, fill: o.color, stroke: INK, 'stroke-width': 2.2}),
    ctx.show('key') ? h('text', {x: 0, y: r(o.r * 0.38), 'text-anchor': 'middle', 'font-size': r(o.r * 1.12), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#ffffff'}, o.letter) : null,
  );
}

/** Word-safe size: shrink a text so its longest word fits the width. */
export function wordSafe(ctx, text, w, size, weight = 500) {
  const longest = Math.max(1, ...String(text).split(/\s+/).map(wd => ctx.measure(wd, size, weight, 'sans')));
  return longest > w ? size * (w / longest) * 0.98 : size;
}

/**
 * Rule notice (pinned card). Returns node, box and the anchor of each condition row.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, size:number, title:string, conditions:string[], kind:string, highlight?:number|null}} o
 */
export function ruleNotice(ctx, o) {
  const th = ctx.theme;
  const col = hcColors(ctx).rule;
  const s = o.size;
  const pad = s * 0.7;
  const inner = o.w - pad * 2;
  const parts = [];
  let y = o.y + pad * 0.9;
  const kf = ctx.fit((o.kind || ' ').toUpperCase(), {maxWidth: inner, size: o.cap ?? s * 0.62, minSize: o.cap ?? s * 0.62, maxLines: 2, weight: 800});
  const tf = ctx.fit(o.title, {maxWidth: inner, size: s * 1.02, minSize: s, maxLines: 4, weight: 700});
  const kindY = y;
  if (o.kind) y += kf.height + s * 0.35;
  const titleY = y;
  y += tf.height + s * 0.4;
  const headH = y - o.y;
  y += s * 0.5;
  const rows = [];
  const numW = s * 1.35;
  o.conditions.forEach((c, i) => {
    const sz = wordSafe(ctx, c, inner - numW, s);
    const f = ctx.fit(c, {maxWidth: inner - numW, size: sz, minSize: sz, maxLines: 6, weight: 500});
    rows.push({i, f, y, h: f.height});
    y += f.height + s * 0.62;
  });
  const hh = y - o.y + pad * 0.2;
  parts.push(h('path', {d: roundRectPath(o.x + 5, o.y + 7, o.w, hh, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(o.x, o.y, o.w, hh, 10), fill: '#eef3ee', stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('path', {d: `M${o.x + 10} ${o.y}H${o.x + o.w - 10}Q${o.x + o.w} ${o.y} ${o.x + o.w} ${o.y + 10}V${r(o.y + headH)}H${o.x}V${o.y + 10}Q${o.x} ${o.y} ${o.x + 10} ${o.y}Z`, fill: '#d3e0d6', stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('circle', {cx: r(o.x + o.w / 2), cy: r(o.y + 2), r: 8, fill: th.accent, stroke: INK, 'stroke-width': 2}));
  if (ctx.show('all') && o.kind) parts.push(textBlock(kf, {x: o.x + pad, y: kindY, fill: shade(col, -0.35)}));
  parts.push(ctx.show('key') ? textBlock(tf, {x: o.x + pad, y: titleY, fill: INK}) : bars(tf, o.x + pad, titleY, INK, 0.75));
  const anchors = [];
  rows.forEach(rw => {
    const hl = o.highlight === rw.i;
    const ry = rw.y - s * 0.25;
    const rh = rw.h + s * 0.5;
    parts.push(h('rect', {name: `${o.name}-hl${rw.i}`, x: r(o.x + 6), y: r(ry), width: r(o.w - 12), height: r(rh), rx: 6, fill: '#ffffff', stroke: col, 'stroke-width': 2.2, opacity: 0}));
    if (ctx.show('key')) {
      parts.push(textBlock(ctx.fit(String(rw.i + 1), {maxWidth: numW, size: s * 0.9, maxLines: 1, weight: 800}), {x: o.x + pad, y: rw.y, fill: shade(col, -0.2)}));
      parts.push(textBlock(rw.f, {x: o.x + pad + numW, y: rw.y, fill: INK, name: `${o.name}-cond${rw.i}`}));
    } else {
      parts.push(h('circle', {cx: r(o.x + pad + s * 0.3), cy: r(rw.y + s * 0.45), r: r(s * 0.22), fill: shade(col, -0.2)}));
      parts.push(bars(rw.f, o.x + pad + numW, rw.y, th.paperLine, 1));
    }
    anchors.push({i: rw.i, left: {x: o.x, y: ry + rh / 2}, right: {x: o.x + o.w, y: ry + rh / 2}, top: {x: o.x + o.w / 2, y: ry}, bottom: {x: o.x + o.w / 2, y: ry + rh}, box: {x: o.x + 6, y: ry, w: o.w - 12, h: rh}, hl});
  });
  return {node: g({name: o.name}, parts), box: {x: o.x, y: o.y, w: o.w, h: hh}, anchors};
}

/**
 * Script card (the facts as supplied + the changed circumstance with A/B rows).
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, size:number, kind:string, title:string, events:string[], label:string, aText:string, bText:string, colors:any, circHeading:string}} o
 */
export function scriptCard(ctx, o) {
  const th = ctx.theme;
  const s = o.size;
  const pad = s * 0.7;
  const inner = o.w - pad * 2;
  const parts = [];
  let y = o.y + pad * 0.9;
  const kf = ctx.fit(o.kind.toUpperCase(), {maxWidth: inner, size: o.cap ?? s * 0.62, minSize: o.cap ?? s * 0.62, maxLines: 2, weight: 800});
  const tf = ctx.fit(o.title, {maxWidth: inner, size: s * 1.02, minSize: s, maxLines: 4, weight: 700});
  const kindY = y;
  y += kf.height + s * 0.35;
  const titleY = y;
  y += tf.height + s * 0.5;
  // wide cards lay the body out in two columns: events | circumstance rows
  const two = !!o.twoCol;
  const evX = o.x + pad, evW = two ? inner * 0.47 : inner;
  const cX = two ? o.x + pad + inner * 0.53 : o.x + pad, cW = two ? inner * 0.47 : inner;
  const bodyY = y;
  const evs = [];
  const bulletW = s * 1.1;
  o.events.forEach((ev, i) => {
    const sz = wordSafe(ctx, ev, evW - bulletW, s);
    const f = ctx.fit(ev, {maxWidth: evW - bulletW, size: sz, minSize: sz, maxLines: 6, weight: 500});
    evs.push({i, f, y});
    y += f.height + s * 0.42;
  });
  const evEnd = y;
  if (two) y = bodyY; else y += s * 0.2;
  const divY = y;
  if (!two) y += s * 0.45;
  const lf = ctx.fit(`${o.circHeading}: ${o.label}`, {maxWidth: cW, size: s * 0.96, minSize: s * 0.96, maxLines: 4, weight: 700});
  const labelY = y;
  y += lf.height + s * 0.45;
  const badgeR = s * 0.82;
  const rowW = cW - badgeR * 2 - s * 0.5;
  const mkRow = (text, letter) => {
    const sz = wordSafe(ctx, text, rowW, s);
    const f = ctx.fit(text, {maxWidth: rowW, size: sz, minSize: sz, maxLines: 5, weight: 600});
    const rowY = y;
    y += Math.max(f.height, badgeR * 2) + s * 0.45;
    return {f, y: rowY, letter};
  };
  const ra = mkRow(o.aText, 'A');
  const rb = mkRow(o.bText, 'B');
  let rel = null;
  if (o.relText) {
    const dotW = s * 1.3;
    const f = ctx.fit(o.relText, {maxWidth: cW - dotW, size: s * 0.96, minSize: s * 0.96, maxLines: 4, weight: 600});
    rel = {f, y, dotW};
    y += f.height + s * 0.5;
  }
  if (two) y = Math.max(y, evEnd);
  const hh = y - o.y + pad * 0.1;
  parts.push(h('path', {d: roundRectPath(o.x + 5, o.y + 7, o.w, hh, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(o.x, o.y, o.w, hh, 10), fill: '#fffdf8', stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('path', {d: `M${o.x + 10} ${o.y}H${o.x + o.w - 10}Q${o.x + o.w} ${o.y} ${o.x + o.w} ${o.y + 10}V${r(titleY + tf.height + s * 0.2)}H${o.x}V${o.y + 10}Q${o.x} ${o.y} ${o.x + 10} ${o.y}Z`, fill: '#e3ebf1', stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('circle', {cx: r(o.x + o.w / 2), cy: r(o.y + 2), r: 8, fill: th.accent2, stroke: INK, 'stroke-width': 2}));
  if (ctx.show('all')) parts.push(textBlock(kf, {x: o.x + pad, y: kindY, fill: '#3d5566'}));
  const K = ctx.show('key');
  parts.push(K ? textBlock(tf, {x: o.x + pad, y: titleY, fill: INK}) : bars(tf, o.x + pad, titleY, INK, 0.75));
  evs.forEach(ev => {
    parts.push(h('circle', {cx: r(evX + s * 0.3), cy: r(ev.y + ev.f.size * 0.5), r: r(s * 0.16), fill: '#3d5566'}));
    parts.push(K ? textBlock(ev.f, {x: evX + bulletW, y: ev.y, fill: INK, name: `${o.name}-ev${ev.i}`}) : bars(ev.f, evX + bulletW, ev.y, th.paperLine, 1));
  });
  if (two) parts.push(h('line', {x1: r(o.x + pad + inner * 0.5), y1: r(bodyY), x2: r(o.x + pad + inner * 0.5), y2: r(y - s * 0.3), stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '6 5'}));
  else parts.push(h('line', {x1: r(o.x + pad), y1: r(divY), x2: r(o.x + o.w - pad), y2: r(divY), stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '6 5'}));
  parts.push(K ? textBlock(lf, {x: cX, y: labelY, fill: INK, name: `${o.name}-circ`}) : bars(lf, cX, labelY, INK, 0.7));
  const rowNodes = {};
  for (const rw of [ra, rb]) {
    const col = rw.letter === 'A' ? o.colors.a : o.colors.b;
    const cy = rw.y + Math.max(rw.f.height, badgeR * 2) / 2;
    const bx = cX + badgeR;
    const nodeName = `${o.name}-row${rw.letter}`;
    rowNodes[rw.letter] = {name: nodeName, badge: {x: bx, y: cy}, box: {x: o.x + 4, y: rw.y - s * 0.2, w: o.w - 8, h: Math.max(rw.f.height, badgeR * 2) + s * 0.4}};
    parts.push(g({name: nodeName},
      letterBadge(ctx, {name: `${nodeName}-badge`, x: bx, y: cy, r: badgeR, color: col, letter: rw.letter}),
      K ? textBlock(rw.f, {x: bx + badgeR + s * 0.5, y: cy - rw.f.height / 2, fill: INK}) : bars(rw.f, bx + badgeR + s * 0.5, cy - rw.f.height / 2, col, 0.6),
    ));
  }
  let relLine = null;
  if (rel) {
    const cy = rel.y + rel.f.size * 0.55;
    const x0 = cX;
    parts.push(g({name: `${o.name}-rel`, opacity: 0},
      h('line', {x1: r(x0 + s * 0.15), y1: r(cy), x2: r(x0 + s * 0.85), y2: r(cy), stroke: o.relColor, 'stroke-width': 3}),
      h('circle', {cx: r(x0 + s * 0.15), cy: r(cy), r: r(s * 0.17), fill: o.relColor}),
      h('circle', {cx: r(x0 + s * 0.85), cy: r(cy), r: r(s * 0.17), fill: o.relColor}),
      textBlock(rel.f, {x: x0 + rel.dotW, y: rel.y, fill: shade(o.relColor, -0.3)}),
    ));
    relLine = {left: {x: o.x, y: cy}, right: {x: o.x + o.w, y: cy}, box: {x: o.x + 4, y: rel.y - s * 0.2, w: o.w - 8, h: rel.f.height + s * 0.4}};
  }
  const circBox = {x: o.x + 4, y: labelY - s * 0.2, w: o.w - 8, h: y - labelY};
  return {node: g({name: o.name}, parts), box: {x: o.x, y: o.y, w: o.w, h: hh}, rows: rowNodes, circBox, relLine};
}

/**
 * List card (e.g. the facts shared by both scenes): kind caption, title, items.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, size:number, cap?:number, kind:string, title?:string, items:string[], fill?:string, head?:string, pin?:string}} o
 */
export function listCard(ctx, o) {
  const th = ctx.theme;
  const s = o.size;
  const pad = s * 0.7;
  const inner = o.w - pad * 2;
  const parts = [];
  const K = ctx.show('key');
  let y = o.y + pad * 0.9;
  const kf = ctx.fit(o.kind.toUpperCase(), {maxWidth: inner, size: o.cap ?? s * 0.62, minSize: o.cap ?? s * 0.62, maxLines: 2, weight: 800});
  const kindY = y;
  y += kf.height + s * 0.35;
  let tf = null, titleY = y;
  if (o.title) {
    tf = ctx.fit(o.title, {maxWidth: inner, size: s * 1.02, minSize: s * 0.9, maxLines: 3, weight: 700});
    y += tf.height + s * 0.5;
  }
  const headEnd = y - s * 0.15;
  const bulletW = s * 1.1;
  const rows = [];
  o.items.forEach((it, i) => {
    const sz = wordSafe(ctx, it, inner - bulletW, s);
    const f = ctx.fit(it, {maxWidth: inner - bulletW, size: sz, minSize: sz, maxLines: 6, weight: 500});
    rows.push({i, f, y});
    y += f.height + s * 0.42;
  });
  const hh = y - o.y + pad * 0.3;
  parts.push(h('path', {d: roundRectPath(o.x + 5, o.y + 7, o.w, hh, 10), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(o.x, o.y, o.w, hh, 10), fill: o.fill ?? '#fffdf8', stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('path', {d: `M${o.x + 10} ${o.y}H${o.x + o.w - 10}Q${o.x + o.w} ${o.y} ${o.x + o.w} ${o.y + 10}V${r(headEnd)}H${o.x}V${o.y + 10}Q${o.x} ${o.y} ${o.x + 10} ${o.y}Z`, fill: o.head ?? '#e3ebf1', stroke: INK, 'stroke-width': 2.4}));
  parts.push(h('circle', {cx: r(o.x + o.w / 2), cy: r(o.y + 2), r: 8, fill: o.pin ?? th.accent2, stroke: INK, 'stroke-width': 2}));
  if (ctx.show('all')) parts.push(textBlock(kf, {x: o.x + pad, y: kindY, fill: '#3d5566'}));
  if (tf) parts.push(K ? textBlock(tf, {x: o.x + pad, y: titleY, fill: INK}) : bars(tf, o.x + pad, titleY, INK, 0.75));
  rows.forEach(rw => {
    parts.push(h('circle', {cx: r(o.x + pad + s * 0.3), cy: r(rw.y + rw.f.size * 0.5), r: r(s * 0.16), fill: '#3d5566'}));
    parts.push(K ? textBlock(rw.f, {x: o.x + pad + bulletW, y: rw.y, fill: INK, name: `${o.name}-it${rw.i}`}) : bars(rw.f, o.x + pad + bulletW, rw.y, th.paperLine, 1));
  });
  return {node: g({name: o.name}, parts), box: {x: o.x, y: o.y, w: o.w, h: hh}};
}

/** Text-free stand-in for a fitted block (labels hidden): one rounded bar per line. */
export function bars(fit, x, y, color, opacity = 1) {
  return g({opacity}, fit.lines.map((ln, i) => h('rect', {x: r(x), y: r(y + i * fit.lineHeight + fit.size * 0.22), width: r(Math.max(fit.size, fit.width * (fit.lines.length > 1 && i === fit.lines.length - 1 ? 0.6 : 0.95))), height: r(fit.size * 0.5), rx: r(fit.size * 0.25), fill: color})));
}

/**
 * Note chip with a small heading glyph colour bar (issue / assumption / key).
 * Wraps up to maxLines and never shrinks below minSize.
 */
export function noteChip(ctx, text, o) {
  const th = ctx.theme;
  const s = o.size;
  const padX = s * 0.6, padY = s * 0.38;
  const bar = s * 0.32;
  const f = ctx.fit(text, {maxWidth: o.maxWidth - padX * 2 - bar, size: s, minSize: o.minSize ?? s * 0.88, maxLines: o.maxLines ?? 3, weight: o.weight ?? 600});
  const w = f.width + padX * 2 + bar;
  const hh = f.height + padY * 2;
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const node = g({name: o.name, opacity: o.opacity ?? 0},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(12, hh / 2)), fill: o.fill ?? th.card, stroke: o.color ?? INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(x + 5, o.y + 5, bar - 2, hh - 10, 3), fill: o.color ?? INK}),
    textBlock(f, {x: x + bar + padX, y: o.y + padY, fill: o.textColor ?? INK}),
  );
  return {node, box: {x, y: o.y, w, h: hh}, fit: f};
}

/* ------------------------------------------------------------------------ */
/* Utilities                                                                */
/* ------------------------------------------------------------------------ */

/**
 * Bake a static copy of a virtual node tree: frame attributes of named nodes
 * are merged in and names are dropped (so the copy registers no handles).
 * @param {any} node
 * @param {Record<string, Record<string, any>>} attrs
 */
export function bake(node, attrs = {}) {
  if (!node || typeof node !== 'object') return node;
  const a = {...node.attrs};
  if (a.name) {
    const extra = attrs[a.name];
    if (extra) {
      for (const [k, v] of Object.entries(extra)) {
        if (k === 'text' || k === 'display') continue;
        a[k] = v;
      }
    }
    delete a.name;
  }
  return {tag: node.tag, attrs: a, children: node.children.map(c => bake(c, attrs))};
}

/** Axis-aligned intersection test. */
export function boxHit(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Map a native stage point to world units for a diorama placed at (ox, oy) with scale ds. */
export const toWorld = (P, ds, ox, oy) => ({x: ox + P.x * ds, y: oy + P.y * ds});
