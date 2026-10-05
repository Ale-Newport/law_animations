/**
 * Motif kit — "Reunión de equipo jurídico" (roles-10, LAW-0197..0200).
 *
 * A fictional legal team stands behind a meeting table, facing the viewer.
 * A cork case-file board (tablero de expediente) hangs on the wall behind
 * them; one task card is pinned above each person's head. Each card has a
 * tag-sized, dashed assignee slot in its lower corner. Every person holds
 * their own magnetic name tag (face disc + name) in front of the chest; to
 * link a task, they raise the tag on the outer side of their head (never
 * across a face), lift it above the hair and press it into the card's slot.
 * The slot outline then turns solid in the owner's colour ("the link lands").
 * A card whose slot stays dashed and empty is a task without an assignee.
 * Nothing on screen says anything about deadlines, duties or consequences.
 *
 * The kit owns: shared fields/defaults/strings, the original vector art
 * (front-facing standing person, name tag, task card, cork board, table,
 * case-file folder, speech bubble), the stage geometry solver, the link
 * choreography (clock → solved hand targets and tag transforms) and the
 * geometric predicates used by tests (tag / card / bubble clear of heads).
 * Entries own their timelines, layouts of editorial labels and semantics.
 *
 * Attachment rules:
 *  - a carried tag is placed from the SOLVED hand: tag = hand ∘ R(θ) ∘ −grip;
 *  - a tag lying in a slot sits exactly at the slot centre;
 *  - every IK target is inside the arm's reach (`allReached`).
 * @module animations/roles/kits/reunion-de-equipo
 */
import {h, g} from '../../../core/svg.js';
import {T, rotateAbout} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath, catmullRom, polyline} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {hairShape, personBadge} from '../../../primitives/badges.js';
import {actorLook} from '../../../primitives/people-style.js';
import {textBlock} from '../../../primitives/annotate.js';
import {str, list, obj, oneOf, party} from '../../../schemas/fields.js';
import {fitWords as fitWordsBase, wchip as wchipBase, noteCallout as noteCalloutBase, overlaps} from './mediation-labels.js';

export {overlaps};

const INK = '#1f2328';

/* ======================================================================== */
/* Text helpers                                                             */
/* ======================================================================== */

/**
 * Keep a number with the word before it ("file 24-017", "Task 3") and a
 * leading list number with the next word, using a no-break space that
 * fitWords keeps together (AUTHORING: orphan-fragment).
 * @param {string} text
 */
export function keepNumbers(text) {
  return String(text ?? '')
    .replace(/(\S)[ \t]+(\d[\d.,:/-]*)(?=[\s)·,;.]|$)/gu, '$1\u00a0$2')
    .replace(/^(\d[\d.]*)[ \t]+(?=\S)/u, '$1\u00a0');
}
/** fitWords (whole words, balanced lines) with numbers kept on their word. */
export const fitW = (text, o) => fitWordsBase(keepNumbers(text), o);
/** wchip with numbers kept on their word. */
export const wchip = (ctx, text, o) => wchipBase(ctx, keepNumbers(text), o);
/** noteCallout with numbers kept on their word. */
export const noteCallout = (ctx, o) => noteCalloutBase(ctx, {...o, text: keepNumbers(o.text)});

/** True when a fit broke a source word across lines or left a 1–2 character line. */
export function badWrap(fit) {
  if (fit.truncated) return true;
  const words = new Set(String(fit.full).replace(/\s+/g, ' ').trim().split(' '));
  for (let i = 0; i + 1 < fit.lines.length; i++) {
    const a = fit.lines[i].trim().split(' ').pop() || '';
    const b = fit.lines[i + 1].trim().split(' ')[0] || '';
    if (!a || !b || /[-‐/]$/.test(a)) continue;
    for (const w of words) if (w.includes(a + b)) return true;
  }
  return fit.lines.slice(1).some(l => l.trim().length <= 2);
}

/**
 * Largest size in [size, minSize] at which the text wraps whole words into
 * at most maxLines lines without truncation; the last attempt otherwise.
 */
export function fitClean(text, o) {
  const step = Math.max(0.5, o.size * 0.04);
  let last = null;
  for (let s = o.size; s >= (o.minSize ?? o.size) - 1e-6; s -= step) {
    last = fitW(text, {...o, size: s, minSize: s});
    if (!badWrap(last)) return {...last, bad: false};
  }
  return {...last, bad: true};
}

/** Neutral key chip ("as supplied · no conclusion drawn"). */
export function keyChip(ctx, text, o) {
  return wchip(ctx, text, {weight: 600, fill: ctx.theme.card, stroke: ctx.theme.inkSoft, color: ctx.theme.ink, ...o});
}

/** Mouth flap that honours reduced motion. */
export function flap(timeMs, reduced, phase = 0) {
  return reduced ? 0.5 : 0.22 + 0.55 * Math.abs(Math.sin(timeMs * 0.0145 + phase));
}

/* ======================================================================== */
/* Fields, defaults and strings                                             */
/* ======================================================================== */

export const TEAM_IDS = ['a', 'b', 'c'];
export const TASK_IDS = ['t1', 't2', 't3'];

/** A supplied link: a person puts their name tag on a task card (drawn as supplied; no duty is implied). */
export const linkItem = obj('A link between a person and a task card, as supplied (the person puts their name tag in the card’s assignee slot; no duty or consequence is implied)', {
  from: oneOf('Person id (a, b, c = left, middle, right at the table)', TEAM_IDS),
  to: oneOf('Task id (t1, t2, t3 = the order of props.tasks)', TASK_IDS),
  kind: oneOf('Kind of relation (drawn as a plain link; never causal)', ['relation']),
}, ['from', 'to']);

export const rolesField = obj('Generic, fictional job captions shown with the names (never a legal duty)', {
  a: str('Caption for person a', 50), b: str('Caption for person b', 50), c: str('Caption for person c', 50),
});

export const TEAM_DEFAULTS = {
  actors: [
    {name: 'Ana Duarte', role: 'Team member'},
    {name: 'Sam Okafor', role: 'Case assistant'},
    {name: 'Lena Park', role: 'Researcher'},
  ],
  roles: {a: 'Team member', b: 'Case assistant', c: 'Researcher'},
  relationships: [
    {from: 'a', to: 't1', kind: 'relation'},
    {from: 'b', to: 't2', kind: 'relation'},
    {from: 'c', to: 't3', kind: 'relation'},
  ],
};

export const TEAM_DEFAULTS_ES = {
  actors: [
    {name: 'Ana Duarte', role: 'Miembro del equipo'},
    {name: 'Sam Okafor', role: 'Asistente del caso'},
    {name: 'Lena Park', role: 'Investigadora'},
  ],
  roles: {a: 'Miembro del equipo', b: 'Asistente del caso', c: 'Investigadora'},
};

export const TASKS_EN = ['Review exhibit list (fictional)', 'Draft chronology (fictional)', 'Collect contact details (fictional)'];
export const TASKS_ES = ['Revisar lista de pruebas (ficticio)', 'Redactar cronología (ficticio)', 'Reunir datos de contacto (ficticio)'];

export const KIT_STRINGS = {
  en: {key: 'As supplied · no conclusion drawn', linked: 'linked', open: 'open slot'},
  es: {key: 'Según lo aportado · sin conclusión', linked: 'enlazada', open: 'hueco libre'},
};

/** Role caption for a person id (roles override the actor's own role). */
export function roleOf(p, id) {
  const i = TEAM_IDS.indexOf(id);
  return (p.roles && p.roles[id]) || (p.actors[i] && p.actors[i].role) || '';
}

/** "Name · Role" (or an explicit caption override). */
export function captionOf(p, id, override) {
  const i = TEAM_IDS.indexOf(id);
  const name = p.actors[i] ? p.actors[i].name : '';
  if (override) return override;
  const role = roleOf(p, id);
  return role ? `${name} · ${role}` : name;
}

/** Resolve seeded looks for the supplied actors (appearance overrides win). */
export function looksOf(ctx, actors) {
  return actors.map((a, i) => actorLook(ctx, a, i));
}

/**
 * Resolve the supplied links into lanes. Each person stands under one lane;
 * the task a person links is pinned in their lane. Unlinked tasks fill the
 * lanes of people without a link (in list order). Duplicate or conflicting
 * links are ignored after the first.
 * @param {string[]} ids   people present, left → right
 * @param {string[]} taskIds  task ids present
 * @param {Array<{from:string,to:string}>} links
 * @returns {{laneTask: Record<string,string>, order: string[], linked: Record<string,boolean>}}
 */
export function resolveLanes(ids, taskIds, links) {
  const laneTask = {};
  const usedT = new Set();
  const order = [];
  for (const l of links || []) {
    if (!ids.includes(l.from) || !taskIds.includes(l.to)) continue;
    if (laneTask[l.from] || usedT.has(l.to)) continue;
    laneTask[l.from] = l.to;
    usedT.add(l.to);
    order.push(l.from);
  }
  const free = taskIds.filter(t => !usedT.has(t));
  for (const id of ids) if (!laneTask[id]) laneTask[id] = free.shift();
  const linked = Object.fromEntries(ids.map(id => [id, order.includes(id)]));
  return {laneTask, order, linked};
}

/* ======================================================================== */
/* Art: standing front-facing person                                        */
/* ======================================================================== */

const UP = 108;
const LO = 106;
const HAND = 17;
export const SHOULDER = {l: {x: -60, y: 14}, r: {x: 60, y: 14}};
export const HEAD = {x: 0, y: -92, r: 44};
/**
 * Local head zone as two circles: face + ears, and the tallest hair styles
 * (bun, curly, scarf reach y ≈ −157). Used for "clear of the head" checks.
 */
export const HEAD_ZONE = [{x: 0, y: -92, r: 52}, {x: 0, y: -120, r: 38}];
export const REACH = UP + LO + HAND * 0.6;
const smooth = t => t * t * (3 - 2 * t);

/**
 * Standing person seen from the front, behind a table (the table covers the
 * lower torso). Local origin = centre of the shoulder line. Original vector
 * design adapted from the category's seated front figure (no chair).
 * @param {any} ctx
 * @param {{name:string, look:{skin:string,hair:string,hairColor:string,outfit:string,glasses?:boolean}}} o
 */
export function frontPerson(ctx, o) {
  const N = o.name;
  const L = o.look;
  const skinShade = shade(L.skin, -0.12);
  const jacket = L.outfit;
  const hair = hairShape(L.hair, HEAD.r, HEAD.y, L.hairColor);
  // opt-in full figure (o.legs): the jacket ends at the hips and trousers + shoes reach the floor (y = FLOOR)
  const legs = o.legs ? legsArt(L) : null;
  const torso = g(null,
    h('path', {d: o.legs ? 'M-86 44C-88 10 -72 -6 -44 -10L-16 -14H16L44 -10C72 -6 88 10 86 44L80 214Q0 226 -80 214Z' : 'M-86 44C-88 10 -72 -6 -44 -10L-16 -14H16L44 -10C72 -6 88 10 86 44L82 330H-82Z', fill: jacket, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-17 -14L0 34L17 -14Z', fill: '#f4f1ea', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-17 -14L-34 -6L-8 70L0 34Z', fill: shade(jacket, -0.14), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M17 -14L34 -6L8 70L0 34Z', fill: shade(jacket, -0.14), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-52 26q10 40 6 110M52 26q-10 40 -6 110', fill: 'none', stroke: shade(jacket, -0.25), 'stroke-width': 2}),
    h('circle', {cx: 0, cy: 96, r: 3.4, fill: shade(jacket, -0.35)}),
    h('circle', {cx: 0, cy: 128, r: 3.4, fill: shade(jacket, -0.35)}),
  );
  const neck = h('rect', {x: -14, y: -50, width: 28, height: 42, rx: 7, fill: skinShade, stroke: INK, 'stroke-width': 2.2});
  const eyeY = HEAD.y - 2;
  const hairBack = g({name: `${N}-hairback`}, hair.back);
  const head = g({name: `${N}-head`},
    h('ellipse', {cx: -43, cy: HEAD.y + 4, rx: 8, ry: 11, fill: skinShade, stroke: INK, 'stroke-width': 2.2}),
    h('ellipse', {cx: 43, cy: HEAD.y + 4, rx: 8, ry: 11, fill: skinShade, stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: HEAD.x, cy: HEAD.y, r: HEAD.r, fill: L.skin, stroke: INK, 'stroke-width': 2.8}),
    g({name: `${N}-eyes`},
      h('ellipse', {cx: -15, cy: eyeY, rx: 4.2, ry: 5.4, fill: INK}),
      h('ellipse', {cx: 15, cy: eyeY, rx: 4.2, ry: 5.4, fill: INK})),
    h('path', {d: `M-23 ${eyeY - 13}q8 -5 15 -1M8 ${eyeY - 14}q8 -4 15 1`, fill: 'none', stroke: shade(L.hairColor, -0.1), 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('path', {d: `M1 ${HEAD.y + 2}q5 10 -3 12`, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    h('path', {name: `${N}-mouth`, d: frontMouth(0), fill: '#7a2f2a', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    L.glasses ? g(null,
      h('circle', {cx: -15, cy: eyeY, r: 11, fill: 'none', stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: 15, cy: eyeY, r: 11, fill: 'none', stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: `M-4 ${eyeY}h8`, stroke: INK, 'stroke-width': 2.2})) : null,
    hair.front,
  );
  const body = g({name: `${N}-body`}, hairBack, legs, torso, neck, head);

  const arm = s => g({name: `${N}-${s}`},
    h('line', {name: `${N}-${s}-uo`, stroke: INK, 'stroke-width': 31, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-lo`, stroke: INK, 'stroke-width': 28, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-u`, stroke: jacket, 'stroke-width': 25.5, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-l`, stroke: jacket, 'stroke-width': 22.5, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${s}-cuff`, stroke: '#f4f1ea', 'stroke-width': 19, 'stroke-linecap': 'butt'}),
    g({name: `${N}-${s}-hand`},
      h('path', {d: 'M-6 -15C11 -19 27 -14 30 -2C31 11 16 18 0 15C-8 14 -11 -11 -6 -15Z', fill: L.skin, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      h('path', {d: s === 'l' ? 'M8 13C16 24 27 23 27 16' : 'M8 -13C16 -24 27 -23 27 -16', fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
      h('path', {d: 'M19 -8q4 3 4 7M19 3q4 3 3 7', fill: 'none', stroke: shade(L.skin, -0.3), 'stroke-width': 1.8, 'stroke-linecap': 'round'})),
  );
  const arms = g({name: `${N}-arms`}, arm('l'), arm('r'));

  /**
   * @param {{x:number, y:number, k:number, left:{x:number,y:number}, right:{x:number,y:number}, look?:number, tilt?:number, mouth?:number}} s
   *   left/right: WORLD hand targets (palm centre).
   */
  function frame(s) {
    const k = s.k;
    const nodes = {};
    const tr = T(s.x, s.y, 0, k);
    nodes[`${N}-body`] = {transform: tr};
    nodes[`${N}-arms`] = {transform: tr};
    nodes[`${N}-head`] = {transform: s.tilt ? rotateAbout(0, -48, s.tilt) : ''};
    nodes[`${N}-hairback`] = {transform: s.tilt ? rotateAbout(0, -48, s.tilt) : ''};
    nodes[`${N}-eyes`] = {transform: T(r((s.look ?? 0) * 6, 2), 0)};
    nodes[`${N}-mouth`] = {d: frontMouth(s.mouth ?? 0)};
    const toLocal = p => ({x: (p.x - s.x) / k, y: (p.y - s.y) / k});
    const toWorld = p => ({x: s.x + p.x * k, y: s.y + p.y * k});
    const hands = {};
    const elbows = {};
    let reached = true;
    for (const side of ['l', 'r']) {
      const sh = SHOULDER[side];
      const target = toLocal(side === 'l' ? s.left : s.right);
      const sol = frontArm(sh, target, side === 'l' ? -1 : 1);
      if (!sol.reached) reached = false;
      const a = sol.forearmAngle;
      const wrist = {x: sol.hand.x - Math.cos(a) * HAND * 0.6, y: sol.hand.y - Math.sin(a) * HAND * 0.6};
      const cuffA = {x: wrist.x - Math.cos(a) * 16, y: wrist.y - Math.sin(a) * 16};
      const cuffB = {x: wrist.x - Math.cos(a) * 5, y: wrist.y - Math.sin(a) * 5};
      const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
      nodes[`${N}-${side}-uo`] = line(sh, sol.elbow);
      nodes[`${N}-${side}-u`] = line(sh, sol.elbow);
      nodes[`${N}-${side}-lo`] = line(sol.elbow, wrist);
      nodes[`${N}-${side}-l`] = line(sol.elbow, wrist);
      nodes[`${N}-${side}-cuff`] = line(cuffA, cuffB);
      nodes[`${N}-${side}-hand`] = {transform: T(wrist.x, wrist.y, (a * 180) / Math.PI)};
      hands[side] = {...toWorld(sol.hand), angle: a, wrist: toWorld(wrist)};
      elbows[side] = toWorld(sol.elbow);
    }
    return {nodes, hands, elbows, reached, head: toWorld(HEAD), headR: HEAD.r * k};
  }
  return {body, arms, frame};
}

/**
 * Front-view two-bone arm solved in pseudo-3D (same solver as the category's
 * seated front figure): the elbow never flips; raised hands bring the elbow
 * under the hand, hands on the table keep the elbows out.
 */
function frontArm(sh, target, out) {
  const lower = LO + HAND * 0.6;
  const reach = UP + lower;
  const dx = target.x - sh.x, dy = target.y - sh.y;
  const d2 = Math.hypot(dx, dy);
  const dist = Math.min(d2, reach - 0.01);
  const hand = d2 > 1e-6 ? {x: sh.x + (dx / d2) * dist, y: sh.y + (dy / d2) * dist} : {x: sh.x, y: sh.y};
  const Dc = 0.86 * reach;
  const hz = dist < Dc ? Math.sqrt(Dc * Dc - dist * dist) : 0;
  const D = Math.max(dist, Dc);
  const ax = [(hand.x - sh.x) / D, (hand.y - sh.y) / D, hz / D];
  const a = (UP * UP - lower * lower + D * D) / (2 * D);
  const rho = Math.sqrt(Math.max(0, UP * UP - a * a));
  const w = smooth(clamp((150 - target.y) / 120));
  const pole = [out * (1 - 0.65 * w), 0.3 + 0.7 * w, -0.15 - 0.15 * w];
  const pd = pole[0] * ax[0] + pole[1] * ax[1] + pole[2] * ax[2];
  const pp = [pole[0] - pd * ax[0], pole[1] - pd * ax[1], pole[2] - pd * ax[2]];
  const pl = Math.hypot(pp[0], pp[1], pp[2]) || 1;
  const elbow = {x: sh.x + ax[0] * a + (pp[0] / pl) * rho, y: sh.y + ax[1] * a + (pp[1] / pl) * rho};
  return {elbow, hand, reached: d2 <= reach - 0.01 + 0.02, forearmAngle: Math.atan2(hand.y - elbow.y, hand.x - elbow.x)};
}

/** Floor line (person-local y) of the opt-in full figure. */
export const FLOOR = 500;

/** Trousers and shoes of a standing front figure (hips at y ≈ 206, floor at FLOOR). */
function legsArt(L) {
  const trousers = shade(L.outfit, -0.5);
  const leg = s => g(null,
    h('path', {d: `M${s * 6} 200L${s * 70} 200L${s * 60} ${FLOOR - 26}L${s * 16} ${FLOOR - 26}Z`, fill: trousers, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${s * 30} 240L${s * 36} ${FLOOR - 40}`, stroke: shade(trousers, -0.25), 'stroke-width': 2}),
    h('path', {d: `M${s * 10} ${FLOOR - 28}H${s * 64}Q${s * 86} ${FLOOR - 26} ${s * 88} ${FLOOR - 4}H${s * 8}Q${s * 4} ${FLOOR - 16} ${s * 10} ${FLOOR - 28}Z`, fill: INK}));
  return g(null, h('ellipse', {cx: 0, cy: FLOOR, rx: 110, ry: 12, fill: 'rgba(31,35,40,0.12)'}), leg(-1), leg(1));
}

function frontMouth(open) {
  const o = clamp(open);
  const y = HEAD.y + 22;
  if (o < 0.04) return `M-12 ${y}q12 7 24 0q-12 3 -24 0Z`;
  return `M-12 ${r(y - 1)}q12 ${r(-2 * o)} 24 0q-12 ${r(5 + 12 * o)} -24 0Z`;
}

/**
 * Thumb drawn over a held magnet (the palm stays behind it), in the same
 * hand-local frame as frontPerson's hands (+x along the forearm). The frame
 * sets `transform` = T(wrist, angle°, k).
 */
export function thumbCap(ctx, {name, look}) {
  return g({name, opacity: 0},
    h('path', {d: 'M2 -9C9 -17 22 -16 26 -8C29 -1 22 5 13 5C6 5 -1 -3 2 -9Z', fill: look.skin, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M14 -6q5 1 7 5', fill: 'none', stroke: shade(look.skin, -0.3), 'stroke-width': 1.8, 'stroke-linecap': 'round'}));
}

/* ======================================================================== */
/* Art: name tag, task card, board, table, folder, bubble                   */
/* ======================================================================== */

/** Pale tint of an outfit colour for tag bodies. */
export function tint(hex, t = 0.74) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Portrait magnet (the person's own "name tag" on the board): a round badge
 * with the person's bust in their outfit colour. Local origin = centre.
 * @param {any} ctx
 * @param {{name:string, look:any, R:number}} o
 */
export function magnetArt(ctx, o) {
  const th = ctx.theme;
  const col = o.look.outfit;
  const face = personBadge(ctx, {name: `${o.name}-face`, x: 0, y: 0, radius: o.R, look: o.look, ring: shade(col, -0.35)});
  return g({name: o.name},
    h('circle', {cx: 3, cy: 5, r: r(o.R + 2), fill: th.shadow}),
    h('circle', {r: r(o.R + 5), fill: tint(col, 0.55), stroke: INK, 'stroke-width': 2.6}),
    face.node,
    h('path', {d: `M${r(-o.R * 0.62)} ${r(-o.R * 0.66)}A${r(o.R * 0.92)} ${r(o.R * 0.92)} 0 0 1 ${r(o.R * 0.3)} ${r(-o.R * 0.9)}`, fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: 0.5, 'stroke-linecap': 'round'}),
  );
}

/**
 * Measure the task cards of a scene: one width, one height (equal-role items).
 * Layout (card-local): top band + pin · task label (full width) · bottom row
 * with the round assignee slot in the corner on the lift side and, beside it,
 * the owner's name once linked (or the open-slot text while empty).
 * @param {any} ctx
 * @param {string[]} labels task labels
 * @param {{w:number, F:number, minF:number, R:number, rowTexts:string[], openText:string, show:boolean, maxLines?:number}} o
 */
export function measureCards(ctx, labels, o) {
  const {w, F, minF, R, show} = o;
  const pad = Math.max(12, F * 0.55);
  const band = F * 0.62;
  const ring = R + 7;
  // the slot sits slotOff beside the card's centre (the head below), within arm's reach
  const slotOff = o.slotOff ?? Math.max(0, w / 2 - pad - ring);
  const besideW = w / 2 + slotOff - ring - pad * 1.8;
  const measure = (s, rowW) => {
    const fits0 = labels.map(t => fitClean(t, {maxWidth: w - pad * 2, size: s, minSize: s, maxLines: o.maxLines ?? 4, weight: 700}));
    const rows0 = (o.rowTexts || []).map(t => (t ? fitClean(t, {maxWidth: rowW, size: s, minSize: s, maxLines: 3, weight: 600}) : null));
    const open0 = o.openText ? fitClean(o.openText, {maxWidth: rowW, size: s, minSize: s, maxLines: 3, weight: 500}) : null;
    return {fits: fits0, rows: rows0, open: open0, bad: [...fits0, ...rows0, open0].some(f => f && f.bad)};
  };
  // the owner name / open text sits beside the ring; when it cannot fit there it
  // gets its own full-width line(s) above the ring ('stacked')
  let m = null, size = F, stacked = false;
  if (o.keepSize) {
    // opt-in: keep the text size and stack the name row before shrinking any text
    outer: for (let s = F; s >= minF - 1e-6; s -= Math.max(0.5, F * 0.04)) {
      for (const st of [false, true]) {
        size = s; stacked = st;
        m = measure(s, st ? w - pad * 2 : besideW);
        if (!m.bad) break outer;
      }
    }
  } else {
    for (const st of [false, true]) {
      for (let s = F; s >= minF - 1e-6; s -= Math.max(0.5, F * 0.04)) {
        size = s;
        m = measure(s, st ? w - pad * 2 : besideW);
        if (!m.bad) break;
      }
      stacked = st;
      if (!m.bad) break;
    }
  }
  const {fits, rows, open, bad} = m;
  const rowW = stacked ? w - pad * 2 : besideW;
  const lines = show ? Math.max(1, ...fits.map(f => f.lines.length)) : 2;
  const textH = lines * size * 1.18;
  const rowTextH = show ? Math.max(0, ...[...rows, open].filter(Boolean).map(f => f.height)) : 0;
  const rowH = stacked ? rowTextH + pad * 0.6 + ring * 2 : Math.max(ring * 2, rowTextH + pad);
  const bm = o.bottom ?? pad * 0.7;   // margin under the ring (kept small so the slot stays within reach)
  const hh = band + pad * 0.9 + textH + pad * 0.7 + rowH + bm;
  return {w, h: hh, fits, rows, open, size, bad, pad, band, textH, rowH, ring, R, rowW, slotOff, stacked, rowTextH, bm};
}

/** Slot circle centre (card-local) for a card with the slot on `side`. */
export function slotCentreLocal(M, side) {
  // the ring sits at the bottom of the row (lowest, within reach); the row text is centred in the row
  return {x: M.w / 2 + side * M.slotOff, y: M.h - M.bm - M.ring};
}

/**
 * Task card pinned on the board. Local origin = top-left corner.
 * Named nodes: `${name}-dash` (empty dashed ring), `${name}-solid` (ring in
 * the owner's colour once linked), `${name}-open` (open-slot text),
 * `${name}-owner` (owner name, shown after the link lands).
 * @param {any} ctx
 * @param {{name:string, M:any, fit:any, row:any, side:1|-1, show:boolean, owner?:string}} o
 */
export function taskCard(ctx, o) {
  const th = ctx.theme;
  const M = o.M;
  const {w, h: hh, pad, band} = M;
  const sc = slotCentreLocal(M, o.side);
  // the name / open text sits beside the ring, towards the card's centre
  const tx = M.stacked ? w / 2 : o.side > 0 ? pad + M.rowW / 2 : w - pad - M.rowW / 2;
  const rowMid = M.stacked ? hh - M.bm - M.rowH + M.rowTextH / 2 : hh - M.bm - M.rowH / 2;
  const bars = [];
  if (!o.show) {
    // labels hidden: simulated lines stand for the task wording (no text)
    for (let i = 0; i < 2; i++) bars.push(h('rect', {x: r(pad), y: r(band + pad * 0.9 + i * M.size * 1.18 + M.size * 0.25), width: r((w - pad * 2) * (i ? 0.62 : 0.9)), height: r(M.size * 0.42), rx: r(M.size * 0.2), fill: th.paperLine}));
  }
  return g({name: o.name},
    h('path', {d: roundRectPath(5, 7, w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: th.paper, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: `M0 ${r(band)}V10Q0 0 10 0H${r(w - 10)}Q${r(w)} 0 ${r(w)} 10V${r(band)}Z`, fill: th.accent3Soft, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    o.show && o.fit ? textBlock(o.fit, {x: r(w / 2), y: r(band + pad * 0.9 + (M.textH - o.fit.lines.length * o.fit.size * 1.18) / 2), anchor: 'middle', fill: INK, name: `${o.name}-text`}) : null,
    bars,
    h('path', {d: `M${r(pad)} ${r(hh - M.bm - M.rowH - pad * 0.35)}H${r(w - pad)}`, stroke: th.paperLine, 'stroke-width': 2, 'data-bar': 1}),
    h('circle', {name: `${o.name}-dash`, cx: r(sc.x), cy: r(sc.y), r: r(M.ring), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 2.8, 'stroke-dasharray': '9 7'}),
    o.show && M.open ? textBlock(M.open, {x: r(tx), y: r(rowMid - M.open.height / 2), anchor: 'middle', fill: th.inkSoft, name: `${o.name}-open`}) : null,
    o.show && o.row ? textBlock(o.row, {x: r(tx), y: r(rowMid - o.row.height / 2), anchor: 'middle', fill: INK, name: `${o.name}-owner`, opacity: 0}) : null,
    h('circle', {name: `${o.name}-solid`, cx: r(sc.x), cy: r(sc.y), r: r(M.ring + 2), fill: 'none', stroke: o.owner || th.ink, 'stroke-width': 5, opacity: 0}),
    pin(ctx, w / 2, band * 0.5 + 2),
  );
}

/** Push pin seen from the front. */
export function pin(ctx, x, y, s = 9) {
  return g(null,
    h('ellipse', {cx: r(x + s * 0.3), cy: r(y + s * 0.4), rx: r(s * 0.9), ry: r(s * 0.5), fill: 'rgba(31,35,40,0.22)'}),
    h('circle', {cx: r(x), cy: r(y), r: r(s), fill: '#5f6b75', stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: r(x - s * 0.3), cy: r(y - s * 0.3), r: r(s * 0.3), fill: '#fff', opacity: 0.55}));
}

/**
 * Cork case-file board. Returns the node and its inner box.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, h:number, frame?:number}} o
 */
export function corkBoard(ctx, o) {
  const th = ctx.theme;
  const f = o.frame ?? 16;
  const cork = '#cfa77a';
  const dots = [];
  const n = Math.round((o.w * o.h) / 5200);
  for (let i = 0; i < n; i++) {
    const x = o.x + f + ctx.rng(`${o.name}-dx`, i) * (o.w - 2 * f);
    const y = o.y + f + ctx.rng(`${o.name}-dy`, i) * (o.h - 2 * f);
    dots.push(h('circle', {cx: r(x), cy: r(y), r: r(1.6 + ctx.rng(`${o.name}-dr`, i) * 2.2), fill: shade(cork, -0.22 + ctx.rng(`${o.name}-dc`, i) * 0.12), opacity: 0.8}));
  }
  const clip = `${o.name}-clip`;
  return {
    node: g({name: o.name},
      h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('rect', {x: r(o.x + f), y: r(o.y + f), width: r(o.w - 2 * f), height: r(o.h - 2 * f)}))),
      h('path', {d: roundRectPath(o.x + 6, o.y + 9, o.w, o.h, 14), fill: th.shadow}),
      h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 14), fill: th.wood, stroke: INK, 'stroke-width': 3}),
      h('rect', {x: r(o.x + f), y: r(o.y + f), width: r(o.w - 2 * f), height: r(o.h - 2 * f), fill: cork, stroke: shade(th.wood, -0.35), 'stroke-width': 2}),
      g({'clip-path': ctx.ref(clip)}, dots),
      h('path', {d: `M${r(o.x + 10)} ${r(o.y + 7)}H${r(o.x + o.w - 10)}`, stroke: '#fff', 'stroke-width': 3, opacity: 0.3, 'stroke-linecap': 'round'}),
    ),
    inner: {x: o.x + f, y: o.y + f, w: o.w - 2 * f, h: o.h - 2 * f},
  };
}

/** Title plate pinned on the board (the board's supplied title). */
export function titlePlate(ctx, {name, x, y, maxW, text, F, minF, show, anchor = 'start'}) {
  const th = ctx.theme;
  if (!show) {
    const w = Math.min(maxW, F * 9);
    const x0 = anchor === 'middle' ? x - w / 2 : x;
    return {node: g({name}, h('path', {d: roundRectPath(x0, y, w, F * 1.9, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.4}), pin(ctx, x0 + 16, y + F * 0.95, 7), pin(ctx, x0 + w - 16, y + F * 0.95, 7)), box: {x: x0, y, w, h: F * 1.9}, fit: null};
  }
  const padX = F * 1.3;
  const fit = fitClean(text, {maxWidth: maxW - padX * 2, size: F, minSize: minF, maxLines: 2, weight: 700});
  const w = fit.width + padX * 2;
  const hh = fit.height + F * 0.9;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return {
    node: g({name},
      h('path', {d: roundRectPath(x0 + 3, y + 5, w, hh, 8), fill: th.shadow}),
      h('path', {d: roundRectPath(x0, y, w, hh, 8), fill: th.paper, stroke: INK, 'stroke-width': 2.4}),
      textBlock(fit, {x: r(x0 + w / 2), y: r(y + F * 0.45), anchor: 'middle', fill: INK, name: `${name}-text`}),
      pin(ctx, x0 + padX * 0.45, y + hh / 2, 7), pin(ctx, x0 + w - padX * 0.45, y + hh / 2, 7)),
    box: {x: x0, y, w, h: hh},
    fit,
  };
}

/** A case-file sheet pinned on the board (folded corner, supplied label). Local = board coordinates. */
export function pinnedSheet(ctx, {name, box, fit, F}) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = box;
  const fold = Math.min(22, hh * 0.3);
  const lines = fit ? null : [0, 1].map(i => h('rect', {x: r(x + w * 0.14), y: r(y + hh * (0.36 + i * 0.26)), width: r(w * (i ? 0.46 : 0.72)), height: r(Math.min(8, hh * 0.1)), rx: 3, fill: th.paperLine, 'data-bar': 1}));
  return g({name},
    h('path', {d: `M${r(x + 4)} ${r(y + 6)}h${r(w)}v${r(hh)}h${r(-w)}Z`, fill: th.shadow}),
    h('path', {d: `M${r(x)} ${r(y)}H${r(x + w - fold)}L${r(x + w)} ${r(y + fold)}V${r(y + hh)}H${r(x)}Z`, fill: '#f3e6c4', stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x + w - fold)} ${r(y)}V${r(y + fold)}H${r(x + w)}`, fill: shade('#f3e6c4', -0.12), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    fit ? textBlock(fit, {x: r(x + w / 2 - fold * 0.2), y: r(y + (hh - fit.height) / 2), anchor: 'middle', fill: INK, name: `${name}-text`}) : lines,
    pin(ctx, x + w / 2, y + 2, 7));
}

/**
 * Front view of the meeting table: top band (trapezoid), front edge, panel, legs.
 * @param {any} ctx
 * @param {{name:string, x0:number, x1:number, yFar:number, yNear:number, yPanel:number, inset:number}} o
 */
export function meetingTable(ctx, o) {
  const th = ctx.theme;
  const {x0, x1, yFar, yNear, yPanel, inset} = o;
  const edge = Math.max(10, (yNear - yFar) * 0.16);
  const topPath = `M${r(x0 + inset)} ${r(yFar)}H${r(x1 - inset)}L${r(x1)} ${r(yNear)}H${r(x0)}Z`;
  const clip = `${o.name}-clip`;
  const grain = [];
  for (let i = 0; i < 4; i++) {
    const gy = yFar + ((i + 0.6) / 4.4) * (yNear - yFar);
    const wob = 3 + ctx.rng(`${o.name}-g`, i) * 5;
    grain.push(h('path', {d: `M${r(x0)} ${r(gy)}C${r(lerp(x0, x1, 0.3))} ${r(gy - wob)} ${r(lerp(x0, x1, 0.7))} ${r(gy + wob)} ${r(x1)} ${r(gy - wob * 0.3)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.6}));
  }
  const legW = Math.max(20, (x1 - x0) * 0.02);
  const top = g({name: `${o.name}-top`},
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('path', {d: topPath}))),
    h('path', {d: topPath, fill: th.woodTop, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    g({'clip-path': ctx.ref(clip)}, grain),
  );
  const front = g({name: `${o.name}-front`},
    h('path', {d: roundRectPath(x0, yNear, x1 - x0, edge, 3), fill: th.woodDark, stroke: INK, 'stroke-width': 2.8}),
    // opt-in open table (o.open): an apron under the edge, no modesty panel, so standing legs show below
    o.open ? h('rect', {x: r(x0 + legW * 0.6), y: r(yNear + edge), width: r(x1 - x0 - legW * 1.2), height: r(edge * 1.4), fill: th.wood, stroke: INK, 'stroke-width': 2.4})
      : h('rect', {x: r(x0 + legW * 0.6), y: r(yNear + edge), width: r(x1 - x0 - legW * 1.2), height: r(yPanel - yNear - edge), fill: th.wood, stroke: INK, 'stroke-width': 2.6}),
    o.open ? null : h('path', {d: roundRectPath(x0 + legW * 1.4, yNear + edge + 12, x1 - x0 - legW * 2.8, Math.max(8, yPanel - yNear - edge - 24), 8), fill: shade(th.wood, -0.06), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
    h('rect', {x: r(x0), y: r(yNear + edge - 1), width: r(legW), height: r(yPanel - yNear - edge + 12), rx: 4, fill: th.woodDark, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: r(x1 - legW), y: r(yNear + edge - 1), width: r(legW), height: r(yPanel - yNear - edge + 12), rx: 4, fill: th.woodDark, stroke: INK, 'stroke-width': 2.6}),
  );
  return {top, front, panel: {x: x0 + legW * 1.4, y: yNear + edge + 12, w: x1 - x0 - legW * 2.8, h: Math.max(8, yPanel - yNear - edge - 24)}};
}

/**
 * Case-file folder lying on the table (flattened perspective) with an
 * upright paper label carrying the supplied document label.
 * Local origin = centre of the folder's near edge.
 */
export function caseFolder(ctx, {name, w, depth, fit: labelFit, F}) {
  const th = ctx.theme;
  const manila = '#e3c27d';
  const hw = w / 2, far = hw * 0.86;
  const back = `M${r(-far)} ${r(-depth)}H${r(far)}L${r(hw)} 0H${r(-hw)}Z`;
  const sheet = `M${r(-far * 0.92)} ${r(-depth * 0.96)}H${r(far * 0.8)}L${r(hw * 0.86)} ${r(-depth * 0.1)}H${r(-hw * 0.9)}Z`;
  const tab = `M${r(-far * 0.7)} ${r(-depth)}L${r(-far * 0.64)} ${r(-depth - 12)}H${r(-far * 0.2)}L${r(-far * 0.14)} ${r(-depth)}Z`;
  const fit = labelFit || null;
  let lb = null;
  if (fit) {
    const lw = fit.width + F * 1.1, lh = fit.height + F * 0.7;
    lb = {x: -lw / 2, y: -Math.max(lh + 3, depth * 0.45 + lh / 2), w: lw, h: lh};
    if (lb.y + lh > -3) lb.y = -lh - 3;
  }
  const lines = [];
  for (let i = 0; i < 3; i++) {
    const yy = -depth * (0.78 - i * 0.2);
    lines.push(h('path', {d: `M${r(-far * 0.7 + i * 4)} ${r(yy)}H${r(far * (0.45 - i * 0.12))}`, stroke: th.paperLine, 'stroke-width': 3, 'stroke-linecap': 'round', 'data-bar': 1}));
  }
  return {
    node: g({name},
      h('ellipse', {cx: 0, cy: r(-depth * 0.35), rx: r(hw * 1.04), ry: r(depth * 0.7), fill: th.shadow}),
      h('path', {d: tab, fill: shade(manila, -0.08), stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
      h('path', {d: back, fill: manila, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      h('path', {d: sheet, fill: th.paper, stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
      lb ? null : lines,
      lb ? g(null,
        h('path', {d: roundRectPath(lb.x, lb.y, lb.w, lb.h, 6), fill: th.card, stroke: INK, 'stroke-width': 2}),
        textBlock(fit, {x: 0, y: r(lb.y + (lb.h - fit.height) / 2), anchor: 'middle', fill: INK, name: `${name}-text`})) : null,
    ),
    box: lb ? {x: Math.min(-hw, lb.x), y: Math.min(-depth - 12, lb.y), w: Math.max(w, lb.w), h: Math.max(depth + 12, -lb.y)} : {x: -hw, y: -depth - 12, w, h: depth + 12},
    labelBox: lb,
    fit,
  };
}

/**
 * Speech bubble with a tail to `tip`. Text wraps between words. `frame(open)`
 * scales the bubble from its tail root. Local coordinates = stage.
 */
export function speechBubble(ctx, {name, box, tip, fit, stroke, show}) {
  const th = ctx.theme;
  const b = box;
  // the tail leaves from the box edge that faces the tip (never across the box), away from the corners
  const edge = tip.y > b.y + b.h ? 'bottom' : tip.y < b.y ? 'top' : tip.x < b.x ? 'left' : 'right';
  const horiz = edge === 'bottom' || edge === 'top';
  const m = 34;
  const root = horiz
    ? {x: clamp(tip.x, b.x + m, b.x + b.w - m), y: edge === 'bottom' ? b.y + b.h : b.y}
    : {x: edge === 'left' ? b.x : b.x + b.w, y: clamp(tip.y, b.y + Math.min(m, b.h / 2), b.y + b.h - Math.min(m, b.h / 2))};
  const half = horiz ? 17 : Math.max(6, Math.min(15, b.h / 2 - 22));
  const baseA = horiz ? {x: root.x - half, y: root.y} : {x: root.x, y: root.y - half};
  const baseB = horiz ? {x: root.x + half, y: root.y} : {x: root.x, y: root.y + half};
  const tail = `M${r(baseA.x)} ${r(baseA.y)}Q${r((root.x + tip.x) / 2)} ${r((root.y + tip.y) / 2 + (horiz ? -6 : 0))} ${r(tip.x)} ${r(tip.y)}L${r(baseB.x)} ${r(baseB.y)}Z`;
  const cover = horiz ? `M${r(baseA.x + 3)} ${r(root.y)}H${r(baseB.x - 3)}` : `M${r(root.x)} ${r(baseA.y + 3)}V${r(baseB.y - 3)}`;
  const node = g({name, opacity: 0},
    g({name: `${name}-s`},
      h('path', {d: roundRectPath(b.x + 4, b.y + 6, b.w, b.h, 22), fill: th.shadow}),
      h('path', {d: tail, fill: th.card, stroke: stroke || INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
      h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 22), fill: th.card, stroke: stroke || INK, 'stroke-width': 2.6}),
      h('path', {d: cover, stroke: th.card, 'stroke-width': 5}),
      show && fit ? textBlock(fit, {x: r(b.x + b.w / 2), y: r(b.y + (b.h - fit.height) / 2), anchor: 'middle', fill: INK, name: `${name}-text`}) : null,
      !show ? g(null, [0, 1].map(i => h('rect', {x: r(b.x + b.w * 0.14), y: r(b.y + b.h * (0.34 + i * 0.22)), width: r(b.w * (i ? 0.46 : 0.72)), height: r(Math.min(12, b.h * 0.1)), rx: 5, fill: th.paperLine}))) : null,
    ));
  const frame = open => {
    const o = clamp(open);
    const s = 0.55 + 0.45 * ease.outCubic(o);
    return {[name]: {opacity: o > 0.01 ? Math.min(1, o * 2.5) : 0}, [`${name}-s`]: {transform: o >= 1 ? '' : `translate(${r(tip.x)} ${r(tip.y)}) scale(${r(s, 4)}) translate(${r(-tip.x)} ${r(-tip.y)})`}};
  };
  return {node, frame, box: b, tip, root};
}

/* ======================================================================== */
/* Link choreography (person-local units; side s = +1 lifts on the right)   */
/* ======================================================================== */

/** Magnet radius in person-local units (smaller than the head). */
export const MAG_R = 30;
/** Minimum clearance (person-local) between a carried magnet and a head zone. */
export const MAG_CLEAR = 4;

/**
 * Magnet-centre keyframes (person-local, before mirroring by side). The hand
 * holds the magnet at its outer-lower rim (gripOf). The path keeps the
 * magnet outside every head zone, below the neighbour's card and inside the
 * own card's column once it rises above the card's bottom edge.
 */
export const LIFT = {
  hold: {x: 70, y: 70},          // held in front of the chest
  c1: {x: 102, y: -14},          // outward, below the chin line
  c2: {x: 104, y: -95},          // up the outer side of the head
  c3: {x: 88, y: -146},          // entering the own card's column above the ear
  restFree: {x: 66, y: 142},     // a free hand resting on the table (hand point)
  back1: {x: 128, y: -84},       // release path of the empty hand
  back2: {x: 124, y: 52},
};

/** Slot centre offset beside the head centre (person-local): within reach, clear of the ear. */
export const SLOT_OFF = 72;

/** Grip on the magnet (magnet-local): its outer-lower rim, at 45°. */
export const gripOf = (R, side) => ({x: side * R * 0.66, y: R * 0.66});

/** Table top band (person-local y of its far and near edges) and its overhang beyond the elbows. */
export const TABLE = {far: 112, near: 178, overhang: 18};

/** Smallest spacing between people (stage units) for scale k. */
export const minSpacing = k => 220 * k + 24;

/**
 * Stage geometry for n people in a row at scale k (pure numbers, stage units).
 * Person i's shoulder line centre is at (xs[i], yS).
 * @param {{n:number, k:number, S:number, x0:number, yS:number, cardM:any, headerH:number, gapHeader:number}} o
 */
export function stageGeometry(o) {
  const {n, k, S, x0, yS} = o;
  const xs = Array.from({length: n}, (_, i) => x0 + i * S);
  const sides = xs.map((_, i) => (n > 1 && i === n - 1 ? -1 : 1));
  const cardBottom = yS - 168 * k;
  const cardTop = cardBottom - o.cardM.h;
  const headerY = cardTop - o.gapHeader - o.headerH;
  const tableFar = yS + (o.table ? o.table.far : TABLE.far) * k;
  const tableNear = yS + (o.table ? o.table.near : TABLE.near) * k;
  const R = MAG_R * k;
  const zones = i => HEAD_ZONE.map(z => ({x: xs[i] + z.x * k, y: yS + z.y * k, r: z.r * k}));
  // card i is centred over person i
  const card = i => ({x: xs[i] - o.cardM.w / 2, y: cardTop, w: o.cardM.w, h: o.cardM.h});
  return {n, k, S, xs, yS, sides, cardBottom, cardTop, headerY, tableFar, tableNear, zones, card, R};
}

/** Unmirrored person-local → world. */
const lp0 = (G, i, q) => ({x: G.xs[i] + q.x * G.k, y: G.yS + q.y * G.k});
/** Distance from point p to segment ab. */
function ptSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(a.x + dx * t - p.x, a.y + dy * t - p.y);
}

/** Person-local → world for person i (mirrored by the lift side). */
export function lp(G, i, q) {
  const s = G.sides[i];
  return {x: G.xs[i] + s * q.x * G.k, y: G.yS + q.y * G.k};
}

/** Centre of person i's card slot (world). */
export function slotCentre(G, i, cardM) {
  const c = G.card(i);
  const sc = slotCentreLocal(cardM, G.sides[i]);
  return {x: c.x + sc.x, y: c.y + sc.y};
}

/**
 * One person's link motion at local progress q ∈ [0,1] (null = not acting).
 * Phases: 0–0.62 lift (chest → outer side of the head → above the hair →
 * slot) · 0.62–0.72 press (lands at 0.67) · 0.72–1 release, hand back to
 * the table. `done` = the link was made earlier.
 * Returns the lift-hand target, the magnet centre and its state.
 */
export function liftPose(G, i, cardM, q, done) {
  const s = G.sides[i];
  const grip = gripOf(G.R, s);
  const slotC = slotCentre(G, i, cardM);
  const slotGrip = {x: slotC.x + grip.x, y: slotC.y + grip.y};
  const holdMag = lp(G, i, G.hold || LIFT.hold);
  const hold = {x: holdMag.x + grip.x, y: holdMag.y + grip.y};
  const rest = G.restPt ? G.restPt[i][s > 0 ? 'r' : 'l'] : lp(G, i, LIFT.restFree);
  if (q === null) {
    if (done) return {hand: rest, mag: slotC, held: false, at: 'card', landed: 1, lift: 1};
    return {hand: hold, mag: holdMag, held: true, at: 'hand', landed: 0, lift: 0};
  }
  const qq = clamp(q);
  if (qq < 0.62) {
    const t = ease.inOutSine(clamp(qq / 0.62));
    const LF = G.lift ? {...LIFT, ...G.lift} : LIFT;   // opt-in lift waypoints
    const mag = pathOf([holdMag, lp(G, i, LF.c1), lp(G, i, LF.c2), lp(G, i, LF.c3), slotC]).at(t);
    return {hand: {x: mag.x + grip.x, y: mag.y + grip.y}, mag: {x: mag.x, y: mag.y}, held: true, at: 'hand', landed: 0, lift: t};
  }
  if (qq < 0.72) {
    // press into the slot: a small push and back; the link lands at 0.67
    const p = Math.sin(Math.PI * clamp((qq - 0.62) / 0.1));
    const push = 3 * p * G.k;
    return {hand: {x: slotGrip.x, y: slotGrip.y - push}, mag: {x: slotC.x, y: slotC.y - push}, held: true, at: qq < 0.67 ? 'hand' : 'card', landed: clamp((qq - 0.64) / 0.06), lift: 1};
  }
  const t = ease.inOutSine(clamp((qq - 0.72) / 0.28));
  const hand = pathOf([slotGrip, lp(G, i, G.back1 || LIFT.back1), lp(G, i, G.back2 || LIFT.back2), rest]).at(t);
  return {hand: {x: hand.x, y: hand.y}, mag: slotC, held: false, at: 'card', landed: 1, lift: 1};
}

const pathCache = new Map();
/** Smooth arc-length path through points (cached per point list). */
export function pathOf(pts) {
  const key = pts.map(p => `${r(p.x)},${r(p.y)}`).join(';');
  let p = pathCache.get(key);
  if (!p) {
    p = polyline(catmullRom(pts, 18));
    if (pathCache.size > 400) pathCache.clear();
    pathCache.set(key, p);
  }
  return p;
}

/** Does an axis-aligned box intersect a circle? */
export function boxHitsCircle(b, c, rad) {
  const x = clamp(c.x, b.x, b.x + b.w), y = clamp(c.y, b.y, b.y + b.h);
  return Math.hypot(x - c.x, y - c.y) < rad;
}

/**
 * Is any magnet / card / bubble over any head zone of the stage?
 * Magnets are circles of radius G.R (+ rim); `clear` adds a safety margin.
 * @param {any} G stageGeometry
 * @param {Array<{x:number,y:number}>} mags magnet centres
 * @param {Array<{x:number,y:number,w:number,h:number}>} boxes cards, bubbles …
 */
export function overHeads(G, mags, boxes = [], clear = 0) {
  for (let i = 0; i < G.n; i++) {
    for (const z of G.zones(i)) {
      for (const m of mags) if (m && Math.hypot(m.x - z.x, m.y - z.y) < z.r + G.R + clear) return true;
      for (const b of boxes) if (b && boxHitsCircle(b, z, z.r + clear)) return true;
    }
  }
  return false;
}

/** Smallest distance (stage units) between any magnet rim and any head zone (for tests). */
export function magnetHeadGap(G, mags) {
  let best = Infinity;
  for (let i = 0; i < G.n; i++) for (const z of G.zones(i)) for (const m of mags) if (m) best = Math.min(best, Math.hypot(m.x - z.x, m.y - z.y) - z.r - G.R);
  return best;
}

/* ======================================================================== */
/* Stage layout and pose (story, contrast scenes, inspect context)          */
/* ======================================================================== */

/**
 * Lay out a team stage inside `box` (design units), choosing the largest
 * person scale k (≤ kMax) for which the board (title row + cards), people,
 * table and name chips fit. Text sizes are fixed in pixels at 1080p through
 * `unitPx` (px at 1080p per design unit).
 *
 * The board's header row holds the title plate and optional extra chips
 * (editorial notes, the neutral key); it wraps to more rows when needed, so
 * notes always sit on the board right above the cards their leaders reach.
 * @param {any} ctx
 * @param {{prefix:string, box:{x:number,y:number,w:number,h:number}, unitPx:number,
 *   people:Array<{id:string, look:any, name:string, caption:string}>,
 *   lanes:Array<{label:string, owner:number|null}>,   // lane i sits above person i; owner = index of the person who links it, or null
 *   openText:string, title?:string|null, doc?:string|null,
 *   extras?:Array<{name:string, text:string, kind:'note'|'key'}>,
 *   px:{F:number, min:number}, kMax?:number, sMax?:number, cardMax?:number, chips?:boolean, folder?:boolean,
 *   reserveBelow?:number}} o
 */
export function layoutStage(ctx, o) {
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const n = o.people.length;
  const F = o.px.F / o.unitPx;
  const minF = o.px.min / o.unitPx;
  const B = o.box;
  let best = null;
  for (let k = o.kMax ?? 1.7; k >= 0.5; k -= 0.02) {
    const L = tryStage(k);
    if (L.fits) return L;
    if (!best || L.over < best.over) best = L;
  }
  return best;

  function tryStage(k) {
    const R = MAG_R * k;
    const ring = R + 7;
    const pad = Math.max(12, F * 0.55);
    const minS = o.spacingK ? o.spacingK * k + 24 : minSpacing(k);   // opt-in wider spacing (no touching arms/magnets)
    const halfW = 100 * k;                        // shoulders + resting elbows
    const TB = {...TABLE, ...(o.table || {})};
    const endHalf = halfW + TABLE.overhang * k;   // table end beyond the outer elbows
    const bpad = 16 + 9;                          // board frame + inner margin
    const cwMin = 2 * (SLOT_OFF * k + ring + pad); // the slot sits SLOT_OFF·k beside the head centre
    const cwOf = S0 => Math.max(cwMin, Math.min(o.cardMax ?? 1e9, n > 1 ? S0 - 24 : 2 * halfW + 120));
    const rowOf = S0 => (n - 1) * S0 + 2 * Math.max(endHalf, cwOf(S0) / 2 + bpad);
    // widest spacing (≤ sMax) whose row — cards and table ends included — fits the width
    let S = minS;
    if (n > 1) {
      const hi = Math.min(Math.max(minS, o.sMax ?? 1e9), Math.max(minS, (B.w - 2 * endHalf) / (n - 1)));
      for (let S0 = hi; S0 >= minS - 1e-6; S0 -= 4) { S = S0; if (rowOf(S0) <= B.w) break; }
      S = Math.max(minS, S);
    }
    const CW = cwOf(S);
    const rowTexts = o.lanes.map(l => (l.owner !== null && l.owner !== undefined ? o.people[l.owner].name : null));
    const cardM = measureCards(ctx, o.lanes.map(l => l.label), {w: CW, F, minF, R, rowTexts, openText: o.openText, show: showAll, slotOff: SLOT_OFF * k, maxLines: o.cardLines ?? 4, bottom: 8 * k + 2});
    const boardW = rowOf(S) - 2 * Math.max(0, endHalf - (CW / 2 + bpad)) ;
    const innerW = Math.max(CW, boardW - 2 * bpad);
    // header row(s): title plate + extras, packed left → right
    const items = [];
    let bad = false;
    if (o.title) {
      if (showAll) {
        const fit = fitClean(o.title, {maxWidth: Math.min(innerW, Math.max(innerW * 0.62, 520)) - F * 2.6, size: F, minSize: minF, maxLines: 2, weight: 700});
        bad = bad || fit.bad;
        items.push({name: 'title', kind: 'title', w: fit.width + F * 2.6, h: fit.height + F * 0.9, fit});
      } else items.push({name: 'title', kind: 'title', w: Math.min(innerW, F * 9), h: F * 1.9, fit: null});
    }
    // opt-in (o.docOnBoard): the case-file label is a sheet pinned in the header row, out of every hand's reach
    if (o.docOnBoard && o.doc) {
      if (showAll) {
        const fit = fitClean(o.doc, {maxWidth: Math.min(innerW, Math.max(innerW * 0.5, 360)) - F * 2.2, size: F, minSize: minF, maxLines: 3, weight: 700});
        bad = bad || fit.bad;
        items.push({name: 'doc', kind: 'doc', w: fit.width + F * 2.2, h: fit.height + F * 1.3, fit});
      } else items.push({name: 'doc', kind: 'doc', w: F * 6, h: F * 2.4, fit: null});
    }
    for (const ex of o.extras || []) {
      const size = ex.kind === 'key' ? F * 0.9 : F;
      const maxW = Math.min(innerW, ex.kind === 'key' ? 560 : Math.max(300, innerW * 0.46));
      const probe = ex.kind === 'key'
        ? keyChip(ctx, ex.text, {x: 0, y: 0, maxWidth: maxW, size, minSize: Math.max(minF * 0.9, 16 / o.unitPx), maxLines: 2})
        : wchip(ctx, ex.text, {x: 0, y: 0, maxWidth: maxW, size, minSize: minF, maxLines: 3, fill: ctx.theme.card});
      bad = bad || probe.fit.truncated;
      items.push({name: ex.name, kind: ex.kind, text: ex.text, w: probe.box.w, h: probe.box.h, size: probe.fit.size, maxW, lane: ex.lane, align: ex.align});
    }
    // opt-in lane items (ex.lane): each on its own row right above the cards, aligned over that lane's card
    const laneItems = items.filter(it => it.lane !== undefined);
    for (const it of laneItems) items.splice(items.indexOf(it), 1);
    const gapX = 18, gapY = 12;
    const rows = [];
    let cur = null;
    for (const it of items) {
      if (!cur || cur.w + gapX + it.w > innerW) { cur = {items: [], w: 0, h: 0}; rows.push(cur); }
      cur.items.push(it);
      cur.w += (cur.items.length > 1 ? gapX : 0) + it.w;
      cur.h = Math.max(cur.h, it.h);
    }
    if (items.some(it => it.w > innerW + 0.5)) bad = true;
    for (const it of laneItems) rows.push({items: [it], w: it.w, h: it.h, lane: true});
    const headerH = rows.reduce((a, rw) => a + rw.h, 0) + Math.max(0, rows.length - 1) * gapY;
    const gapHeader = headerH ? 12 : 0;
    // name chips on the table panel
    const chipW = (n > 1 ? S : 2 * halfW + 120) - 20;
    const chipFits = o.chips !== false && showKey ? o.people.map(pp => fitClean(pp.caption, {maxWidth: chipW - F * 1.2, size: F, minSize: minF, maxLines: 5, weight: 600})) : [];
    const chipH = chipFits.length ? Math.max(...chipFits.map(f => f.height)) + F * 0.76 : 0;
    // vertical stack relative to the shoulder line (yS = 0)
    const cardBottom = -168 * k;
    const cardTop = cardBottom - cardM.h;
    const boardTop = cardTop - gapHeader - headerH - bpad;
    const tableNear = TB.near * k;
    const edge = Math.max(10, (TB.near - TB.far) * k * 0.16);
    // o.legs (opt-in): full standing figures under an open table; name chips stand on the floor below the feet
    const panelBottom = o.legs ? FLOOR * k : tableNear + edge + Math.max(36 * k, chipH + 22);
    const top = boardTop;
    const bottom = (o.legs ? panelBottom + 16 + chipH : panelBottom) + 14 + (o.reserveBelow ?? 0);
    const H = bottom - top;
    const W = rowOf(S);
    const over = Math.max(0, H - B.h) + Math.max(0, W - B.w);
    // case-file folder label (measured here so the hands can rest clear of it)
    // the folder label must stand on the table band: at most two lines, as wide as needed (up to 1.7 spacings)
    const docFit = o.folder !== false && o.doc && showAll && !o.docOnBoard ? fitClean(o.doc, {maxWidth: Math.min(1.7 * (n > 1 ? S : 300), 640) - F * 1.1, size: F, minSize: minF, maxLines: 2, weight: 700}) : null;
    const fits = over <= 0.5 && !cardM.bad && !bad && !chipFits.some(f => f.bad) && !(docFit && docFit.bad);
    // place: centre inside the box
    const yS = B.y + (B.h - H) / 2 - top;
    const x0 = B.x + B.w / 2 - ((n - 1) * S) / 2;
    const G = stageGeometry({n, k, S, x0, yS, cardM, headerH, gapHeader, table: TB});
    const tHalf = Math.max(endHalf, CW / 2 + bpad);
    // folder in front of the middle of the row; hands rest on the table clear of its label
    const band = (TB.near - TB.far) * k;
    const folderAt = {x: n === 3 ? G.xs[1] : (G.xs[0] + G.xs[n - 1]) / 2, y: yS + tableNear - band * 0.12};
    const labelHalf = docFit ? (docFit.width + F * 1.1) / 2 + 14 : (o.folder !== false ? 50 * k : 0);
    const lhD = docFit ? docFit.height + F * 0.7 : 0;
    const labelTop = docFit ? folderAt.y - Math.max(lhD + 3, band * 0.7 * 0.45 + lhD / 2) : Infinity;
    if (o.hold) G.hold = o.hold;   // opt-in chest-hold point of the magnet (person-local)
    if (o.lift) G.lift = o.lift;   // opt-in lift waypoints (person-local magnet centres)
    if (o.release) { G.back1 = o.release[0]; G.back2 = o.release[1]; }   // opt-in release path of the empty hand
    G.restPt = G.xs.map(x => {
      const ry = yS + Math.min(LIFT.restFree.y, (TB.far + TB.near) / 2 + 8) * k;
      const rx = (o.restX ?? LIFT.restFree.x) * k;   // opt-in closer resting hands (o.restX)
      const pt = {l: {x: x - rx, y: ry}, r: {x: x + rx, y: ry}};
      const hr = 18 * k;
      if (o.folder !== false) {
        // a hand over the label moves to the label edge on its own person's side
        for (const key of ['l', 'r']) {
          if (Math.abs(pt[key].x - folderAt.x) >= labelHalf + hr) continue;
          const toward = Math.abs(x - folderAt.x) < 1 ? (key === 'l' ? -1 : 1) : Math.sign(x - folderAt.x);
          pt[key].x = folderAt.x + toward * (labelHalf + hr);
          // out of comfortable reach: the hand rests against the lower chest instead, above the table
          // out of comfortable reach: the hand rests against the lower chest instead, above the label
          if (Math.abs(pt[key].x - x) > 140 * k) pt[key] = {x: x + (key === 'l' ? -40 : 40) * k, y: Math.min(yS + (o.chestRestY ?? 100) * k, labelTop - 22 * k)};
        }
      }
      return pt;
    });
    const table = {x0: G.xs[0] - tHalf, x1: G.xs[n - 1] + tHalf, yFar: yS + TB.far * k, yNear: yS + tableNear, yPanel: yS + panelBottom, inset: 22 * k, open: Boolean(o.legs)};
    const board = {x: G.xs[0] - CW / 2 - bpad, y: yS + boardTop, w: (n - 1) * S + CW + 2 * bpad, h: 0};
    board.h = yS + 60 * k - board.y;
    // header boxes (absolute), rows left-aligned inside the board
    const header = {};
    let hy = yS + boardTop + bpad;
    for (const rw of rows) {
      let hx = board.x + bpad;
      if (rw.lane) {
        const it = rw.items[0];
        const c = G.card(it.lane), sd = G.sides[it.lane];
        const outerX = sd > 0 ? c.x + c.w - it.w : c.x, innerX = sd > 0 ? c.x : c.x + c.w - it.w;
        const ax = it.align === 'right' ? c.x + c.w - it.w : it.align === 'left' ? c.x : it.align === 'outer' ? outerX : innerX;
        hx = clamp(ax, board.x + bpad, board.x + board.w - bpad - it.w);
      }
      for (const it of rw.items) {
        header[it.name] = {...it, box: {x: hx, y: hy + (rw.h - it.h) / 2, w: it.w, h: it.h}};
        hx += it.w + gapX;
      }
      hy += rw.h + gapY;
    }
    return {fits, over, k, S, F, minF, R, CW, cardM, headerH, gapHeader, header, chipFits, chipH, G, docFit, folderAt, box: B, yS, top: yS + top, bottom: yS + bottom, W, H, board, table, o};
  }
}

/**
 * Build the stage nodes and its pose function from a layout.
 * @param {any} ctx
 * @param {any} L layoutStage result
 */
export function buildStage(ctx, L) {
  const o = L.o;
  const P = o.prefix;
  const th = ctx.theme;
  const G = L.G;
  const n = G.n;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const people = o.people.map((pp, i) => frontPerson(ctx, {name: `${P}-p${i}`, look: pp.look, legs: Boolean(o.legs)}));
  const mags = o.people.map((pp, i) => magnetArt(ctx, {name: `${P}-m${i}`, look: pp.look, R: G.R}));
  const thumbs = o.people.map((pp, i) => thumbCap(ctx, {name: `${P}-th${i}`, look: pp.look}));
  const board = corkBoard(ctx, {name: `${P}-board`, ...L.board});
  const hb = L.header.title;
  const title = hb ? titlePlate(ctx, {name: `${P}-title`, x: hb.box.x, y: hb.box.y, maxW: hb.box.w + 2, text: o.title, F: hb.fit ? hb.fit.size : L.F, minF: hb.fit ? hb.fit.size : L.minF, show: showAll}) : null;
  const hd = L.header.doc;
  const docSheet = hd ? pinnedSheet(ctx, {name: `${P}-doc`, box: hd.box, fit: hd.fit, F: hd.fit ? hd.fit.size : L.F}) : null;
  const cards = o.lanes.map((lane, i) => {
    const c = G.card(i);
    const owner = lane.owner !== null && lane.owner !== undefined ? o.people[lane.owner] : null;
    const node = taskCard(ctx, {name: `${P}-card${i}`, M: L.cardM, fit: L.cardM.fits[i], row: L.cardM.rows[i], side: G.sides[i], show: showAll, owner: owner ? shade(owner.look.outfit, -0.2) : null});
    return {node: g({transform: T(c.x, c.y)}, node), box: c};
  });
  const table = meetingTable(ctx, {name: `${P}-table`, ...L.table});
  // case-file folder on the table in front of the middle of the row
  let folder = null;
  if (o.folder !== false) {
    const midX = L.folderAt.x, fy = L.folderAt.y;
    const depth = (L.table.yNear - L.table.yFar) * 0.7;
    const fw = Math.max(Math.min(170 * G.k, n > 1 ? G.S * 0.9 : 260), L.docFit ? L.docFit.width + L.F * 1.1 + 30 : 0);
    const f = caseFolder(ctx, {name: `${P}-folder`, w: fw, depth, fit: L.docFit, F: L.docFit ? L.docFit.size : L.F});
    folder = {...f, node: g({transform: T(midX, fy)}, f.node), at: {x: midX, y: fy}, box: {x: midX + f.box.x, y: fy + f.box.y, w: f.box.w, h: f.box.h}};
  }
  // name chips centred under each person on the table panel
  const chips = L.chipFits.map((fit, i) => {
    const c = wchip(ctx, fit.full, {x: G.xs[i], y: o.legs ? L.table.yPanel + 16 : L.table.yNear + Math.max(10, (L.table.yNear - L.table.yFar) * 0.16) + 11, anchor: 'middle', maxWidth: (n > 1 ? G.S : 2 * 100 * G.k + 120) - 20, size: fit.size, minSize: fit.size, maxLines: 5, fill: '#f7f1e3', name: `${P}-chip${i}`});
    return c;
  });
  // bodies are hidden below the table's near edge (people stand behind the table)
  const clipId = `${P}-bodyclip`;
  const bodyClip = h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {x: r(L.table.x0 - 400), y: r(L.board.y - 400), width: r(L.table.x1 - L.table.x0 + 800), height: r(L.table.yNear - L.board.y + 402)})));
  return {people, mags, thumbs, board, title, cards, table, folder, chips, textShown: showAll, bodyClip, bodyClipRef: ctx.ref(clipId), legs: Boolean(o.legs), docSheet, folderFront: Boolean(o.folderFront)};
}

/** Layer order of a built stage (back → front); `extra` groups are inserted where noted. */
export function stageNodes(S, extra = {}) {
  return [
    S.board.node,
    S.title && S.title.node,
    S.docSheet,
    S.cards.map(c => c.node),
    extra.behindPeople,
    S.legs ? null : S.bodyClip,
    S.legs ? g(null, S.people.map(p => p.body)) : g({'clip-path': S.bodyClipRef}, S.people.map(p => p.body)),
    S.table.top,
    !S.folderFront && S.folder && S.folder.node,
    S.people.map(p => p.arms),
    // opt-in: the folder lies at the table's near edge, nearer the viewer than the resting hands
    S.folderFront && S.folder && S.folder.node,
    S.mags,
    S.thumbs,
    S.table.front,
    S.chips.map(c => c.node),
    extra.front,
  ];
}

/**
 * Pose a built stage.
 * @param {any} L layout
 * @param {any} S built stage
 * @param {Array<{q:number|null, done:boolean, look?:number, tilt?:number, mouth?:number}>} st per person
 * @param {Record<number, {openFade?:number}>} [cardState]
 */
export function poseStage(L, S, st) {
  const G = L.G;
  const P = L.o.prefix;
  const nodes = {};
  const sem = {mags: [], hands: [], grips: [], at: [], landed: [], lift: [], reached: [], freeHands: []};
  const arms = [];
  let allReached = true;
  st.forEach((s, i) => {
    const side = G.sides[i];
    const lift = side > 0 ? 'r' : 'l';
    const pose = liftPose(G, i, L.cardM, s.q, s.done);
    const free = G.restPt ? G.restPt[i][side > 0 ? 'l' : 'r'] : lp(G, i, {x: -LIFT.restFree.x, y: LIFT.restFree.y});
    const posed = S.people[i].frame({x: G.xs[i], y: G.yS, k: G.k, left: lift === 'l' ? pose.hand : free, right: lift === 'r' ? pose.hand : free, look: s.look ?? 0, tilt: s.tilt ?? 0, mouth: s.mouth ?? 0});
    Object.assign(nodes, posed.nodes);
    if (!posed.reached) allReached = false;
    const hand = posed.hands[lift];
    nodes[`${P}-m${i}`] = {transform: T(pose.mag.x, pose.mag.y)};
    nodes[`${P}-th${i}`] = {opacity: pose.held ? 1 : 0, transform: T(hand.wrist.x, hand.wrist.y, (hand.angle * 180) / Math.PI, G.k)};
    const grip = gripOf(G.R, side);
    sem.mags.push({x: r(pose.mag.x), y: r(pose.mag.y)});
    sem.hands.push({x: r(hand.x), y: r(hand.y)});
    sem.grips.push({x: r(pose.mag.x + grip.x), y: r(pose.mag.y + grip.y)});
    sem.at.push(pose.at);
    sem.landed.push(r(pose.landed, 3));
    sem.lift.push(r(pose.lift, 3));
    sem.freeHands.push({x: r(posed.hands[lift === 'r' ? 'l' : 'r'].x), y: r(posed.hands[lift === 'r' ? 'l' : 'r'].y)});
    // world arm polylines (shoulder → elbow → hand) for clash checks between neighbours
    arms.push(['l', 'r'].map(sd => [lp0(G, i, SHOULDER[sd]), posed.elbows[sd], posed.hands[sd]]));
  });
  // cards: the lane's slot rings / texts follow the landing of its owner's magnet
  L.o.lanes.forEach((lane, i) => {
    const N = `${P}-card${i}`;
    const owner = lane.owner;
    const landed = owner !== null && owner !== undefined ? sem.landed[owner] : 0;
    const lift = owner !== null && owner !== undefined ? sem.lift[owner] : 0;
    // the open text leaves before the magnet reaches the card; the owner's name arrives after the landing
    const openOp = 1 - clamp((lift - 0.62) / 0.16);
    nodes[`${N}-dash`] = {opacity: r(1 - landed, 3)};
    nodes[`${N}-solid`] = {opacity: r(landed, 3)};
    if (S.textShown && L.cardM.open) nodes[`${N}-open`] = {opacity: r(openOp, 3)};
    if (S.textShown && L.cardM.rows[i]) nodes[`${N}-owner`] = {opacity: r(clamp((landed - 0.4) / 0.6), 3)};
  });
  sem.allReached = allReached;
  // closest approach (stage units) between different people's arms, and between a magnet and another person's arm
  const segD = (a, b, c, d) => Math.min(ptSeg(a, c, d), ptSeg(b, c, d), ptSeg(c, a, b), ptSeg(d, a, b));
  let armGap = Infinity, magArmGap = Infinity;
  for (let i = 0; i < arms.length; i++) for (let j = 0; j < arms.length; j++) {
    if (i === j) continue;
    for (const A of arms[j]) for (let q = 0; q < 2; q++) {
      magArmGap = Math.min(magArmGap, ptSeg(sem.mags[i], A[q], A[q + 1]) - G.R - 14 * G.k);
      if (j > i) for (const B of arms[i]) for (let t = 0; t < 2; t++) armGap = Math.min(armGap, segD(A[q], A[q + 1], B[t], B[t + 1]) - 28 * G.k);
    }
  }
  sem.armGap = Number.isFinite(armGap) ? r(armGap, 1) : 999;
  sem.magArmGap = Number.isFinite(magArmGap) ? r(magArmGap, 1) : 999;
  return {nodes, sem};
}

