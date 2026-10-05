/**
 * Motif kit for "Representación de una parte" (LAW-0177..0180).
 *
 * Geometry, props, a walking person rig and the shared choreography of the
 * motif; each entry owns its own timeline, layout, labels and semantics.
 *
 * The scene (side view, "stage units", floor at y = 0, figures at scale 1):
 *   client (Party A) · small round table with the form on a stand ·
 *   representative · … · service counter with a tray · clerk seated behind it.
 *  - The client wears a retractable badge reel on the chest. The LINK is its
 *    ribbon: the client pulls the clip out, passes it to the representative
 *    at a shared point above the table, and the representative clips it to
 *    the lanyard badge. The ribbon then stays taut between them wherever the
 *    representative goes (it is only drawn when a link is supplied).
 *  - "represented" plan: the client hands the form to the representative at
 *    the table; the representative turns, walks to the counter and hands the
 *    form over. "own" plan: the client picks the form up and walks to the
 *    counter themself; nobody is linked.
 *  - Props always follow SOLVED hand positions; hand-offs happen with both
 *    hands on the same sheet (giver on one edge, receiver on the other).
 * Nothing here decides whether a representation is valid, sufficient or
 * binding: the link and the performer are supplied data, drawn as supplied.
 * @module animations/roles/kits/representacion-de-una-parte
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {roundRectPath} from '../../../core/geometry.js';
import {r, clamp, lerp, ease} from '../../../core/time.js';
import {str, list, obj, oneOf, party, RELATION_KINDS} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {textBlock} from '../../../primitives/annotate.js';
import {fitWords, wchip} from './mediation-labels.js';

const INK = '#1f2328';

/* ======================================================================== */
/* Fields                                                                   */
/* ======================================================================== */

/** Actor ids (actors[0], actors[1], actors[2]). */
export const REP_IDS = ['client', 'representative', 'clerk'];
const IDX = {client: 0, representative: 1, clerk: 2};

/** One supplied relationship between two actors (with an optional label). */
export const relationshipItem = obj('A supplied relationship between two actors (drawn as supplied; not a legal finding)', {
  from: oneOf('Source actor', REP_IDS),
  to: oneOf('Target actor', REP_IDS),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn with the relationship (as supplied)', 70),
}, ['from', 'to', 'kind']);

export const actorsField = list('The client (Party A), the representative and the counter clerk, in this order (fictional people)', party, 3, 3);
export const rolesField = obj('Descriptive role captions shown with the names (never a legal finding)', {
  client: str('Role caption for the client', 40),
  representative: str('Role caption for the person who may act for the client', 40),
  clerk: str('Role caption for the person at the counter', 40),
});
export const docPropsFields = {
  document: str('Title printed on the form that is handed over at the counter', 60),
  documentId: str('Reference printed on the form', 24),
  counterSign: str('Text on the sign above the counter', 36),
};

/** Fictional default cast and props shared by the four entries. */
export const REP_DEFAULTS = {
  actors: [
    {name: 'Alex Moreno', role: 'Party A'},
    {name: 'Rosa Delgado', role: 'Representative'},
    {name: 'Kim Osei', role: 'Counter clerk'},
  ],
  roles: {client: 'Client · Party A', representative: 'Representative', clerk: 'Counter clerk'},
  link: {from: 'representative', to: 'client', kind: 'relation', label: 'acts on behalf of Party A (as supplied)'},
  docProps: {document: 'Address change form', documentId: 'Form RF-208', counterSign: 'Counter 2 · Filings'},
};
export const REP_DEFAULTS_ES = {
  actors: [
    {name: 'Alex Moreno', role: 'Parte A'},
    {name: 'Rosa Delgado', role: 'Representante'},
    {name: 'Kim Osei', role: 'Personal de ventanilla'},
  ],
  roles: {client: 'Cliente · Parte A', representative: 'Representante', clerk: 'Ventanilla'},
  link: {from: 'representative', to: 'client', kind: 'relation', label: 'actúa en nombre de la Parte A (según lo aportado)'},
  docProps: {document: 'Solicitud de cambio de domicilio', documentId: 'Impreso RF-208', counterSign: 'Ventanilla 2 · Registro'},
};

/** Built-in strings shared by the entries (each entry may add its own). */
export const REP_STRINGS = {
  en: {
    key: 'As supplied · no conclusion drawn',
    ownAction: 'Own action',
    representedAction: 'Represented action',
    received: 'Received at the counter',
    presented: 'Presented at the counter',
    performs: 'performs the act',
  },
  es: {
    key: 'Según lo aportado · sin conclusión',
    ownAction: 'Actuación propia',
    representedAction: 'Actuación representada',
    received: 'Recibido en ventanilla',
    presented: 'Presentado en ventanilla',
    performs: 'realiza el acto',
  },
};

/** The supplied link between representative and client (either direction), or null. */
export function linkOf(relationships) {
  return (relationships || []).find(q => (q.from === 'representative' && q.to === 'client') || (q.from === 'client' && q.to === 'representative')) || null;
}

/** Role caption of an actor id (roles win over the party's own role). */
export function roleOf(p, id) {
  return (p.roles && p.roles[id]) || (p.actors[IDX[id]] && p.actors[IDX[id]].role) || '';
}
/** "Name · role" caption of an actor id. */
export function captionOf(p, id) {
  const a = p.actors[IDX[id]];
  const role = roleOf(p, id);
  return role ? `${a.name} · ${role}` : a.name;
}
/** Seeded looks (appearance overrides win); index spreads adjacent actors. */
export function looksOf(ctx, p) {
  return {client: actorLook(ctx, p.actors[0], 0), representative: actorLook(ctx, p.actors[1], 1), clerk: actorLook(ctx, p.actors[2], 2)};
}

/* ======================================================================== */
/* Stage geometry (stage units; floor y = 0)                                */
/* ======================================================================== */

export const ST = {
  W: 1090, top: -620,
  clientX: 110, repX0: 400,
  table: {x: 255, top: -170, w: 150},
  counter: {x0: 745, x1: 950, top: -210},
  standX: 640, clerkX: 1000, clerkHip: -178,
  sheet: {w: 190, h: 236},
  trayX: 845,
  carry: {x: 96, y: -334},       // rig-local carry pose (sheet held up in front)
  clipPass: {x: 255, y: -350},   // shared point where the ribbon clip changes hands
  badgeL: {x: -10, y: -226},     // rig-local badge ring on the belt (representative): on the side facing the viewer
  reelL: {x: 23, y: -276},       // rig-local badge reel (client)
  handRestFar: {x: -10, y: -159},
};
ST.stand = {x: ST.table.x, y: ST.table.top - 3};                             // sheet centre lying flat on the table
export const FLAT_Y = 0.1;                                                  // vertical squash of the sheet lying flat
ST.pass = {x: ST.table.x, y: -300};                                         // sheet centre at the table hand-off
ST.tray = {x: ST.trayX, y: ST.counter.top - 8 - ST.sheet.h / 2 + 2};         // sheet centre standing in the tray
ST.hatch = ST.tray;                                                         // hand-over centre = tray (the clerk lets it rest)

/* ======================================================================== */
/* Walking person rig                                                        */
/* ======================================================================== */

const THIGH = 92, SHIN = 90;

/**
 * Standing person that can walk and turn round: personRig's head, torso and
 * IK arms (reused as-is) with stepping two-bone legs, plus an optional
 * accessory drawn on the chest (lanyard badge or badge reel).
 * frame({x, y, sx, k, walk, near, far, nearL, farL, lean, headTilt, mouth})
 *  - sx: signed facing scale (−1 … 1; |sx| < 1 while turning round)
 *  - walk: distance walked (drives the gait; 0 = standing)
 *  - near/far: WORLD hand targets; nearL/farL: rig-LOCAL targets (used while
 *    turning, where world→local would divide by a small sx).
 * @param {any} ctx
 * @param {{name:string, look:any, accessory?:'badge'|'reel'|null, accent?:string, extra?:any}} o
 *   extra: an optional rig-local node drawn on the torso after the accessory (in front of the body,
 *   behind the near arm), e.g. a larger card hanging from the badge ring.
 */
export function walkerRig(ctx, o) {
  const N = o.name;
  const base = personRig(ctx, {name: N, look: o.look});
  const [farArm, , upper, nearArm] = base.node.children;
  const trousers = shade(o.look.outfit, -0.45);
  const leg = key => g({name: `${N}-leg${key}`},
    h('line', {name: `${N}-leg${key}-to`, stroke: INK, 'stroke-width': 33, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-leg${key}-so`, stroke: INK, 'stroke-width': 31, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-leg${key}-t`, stroke: key === 'F' ? shade(trousers, -0.12) : trousers, 'stroke-width': 28, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-leg${key}-s`, stroke: key === 'F' ? shade(trousers, -0.12) : trousers, 'stroke-width': 26, 'stroke-linecap': 'round'}),
    h('ellipse', {name: `${N}-shoe${key}`, cx: 0, cy: 0, rx: 22, ry: 9.5, fill: key === 'F' ? INK : shade(INK, 0.15)}),
  );
  const acc = o.accessory === 'badge' ? badgeNode(ctx, o.accent) : o.accessory === 'reel' ? reelNode(ctx, o.accent) : null;
  const upperNode = acc || o.extra ? g(upper.attrs, ...upper.children, acc, o.extra ?? null) : upper;
  const node = g({name: N}, farArm, leg('F'), leg('N'), upperNode, nearArm);

  function frame(s) {
    const sx = s.sx ?? 1;
    const k = s.k ?? 1;
    const walk = s.walk ?? 0;
    // gait: one full cycle every `stride` units (default 118); feet swing forward while lifted
    const stride = s.stride ?? 118;
    const phase = (walk / stride) * Math.PI * 2;
    const amp = 26 * Math.min(1.45, stride / 118);
    const moving = s.moving ?? 0; // 0..1 blend so steps start and stop cleanly
    const bob = -Math.abs(Math.sin(phase)) * 5 * moving;
    const y = s.y + bob * k;
    const toWorld = q => ({x: s.x + q.x * sx * k, y: y + q.y * k});
    const w = key => (s[`${key}L`] ? toWorld(s[`${key}L`]) : s[key]);
    // far arm swings gently against the near leg while walking
    const farL = s.farL ?? (s.far ? null : (moving ? {x: ST.handRestFar.x - Math.sin(phase) * 22 * moving, y: ST.handRestFar.y} : null));
    const solved = base.frame({x: s.x, y, facing: sx, scale: k, lean: s.lean ?? 0, headTilt: s.headTilt ?? 0, mouth: s.mouth ?? 0,
      near: w('near'), far: farL ? toWorld(farL) : s.far ?? null});
    const nodes = solved.nodes;
    const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
    const legs = {};
    for (const [key, hipX, footX, off] of [['F', -6, -8, Math.PI], ['N', 6, 12, 0]]) {
      const ph = phase + off;
      const swing = Math.sin(ph) * amp * moving;
      const lift = Math.max(0, Math.cos(ph)) ** 1.5 * 24 * moving;
      const hip = {x: hipX, y: -190};
      const foot = {x: footX + swing, y: -16 - lift};
      const dx = foot.x - hip.x, dy = foot.y - hip.y;
      const d = Math.min(Math.hypot(dx, dy), THIGH + SHIN - 0.01);
      const a = Math.atan2(dy, dx);
      const A = Math.acos(clamp((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d), -1, 1));
      const knee = {x: hip.x + THIGH * Math.cos(a - A), y: hip.y + THIGH * Math.sin(a - A)};
      const ankle = {x: hip.x + d * Math.cos(a), y: hip.y + d * Math.sin(a)};
      nodes[`${N}-leg${key}-to`] = line(hip, knee);
      nodes[`${N}-leg${key}-t`] = line(hip, knee);
      nodes[`${N}-leg${key}-so`] = line(knee, ankle);
      nodes[`${N}-leg${key}-s`] = line(knee, ankle);
      const toe = lift > 1 ? -8 * (lift / 24) : 0;
      nodes[`${N}-shoe${key}`] = {transform: T(ankle.x + 7, ankle.y + 8, toe)};
      legs[key] = ankle;
    }
    const acc2 = o.accessory === 'badge' ? ST.badgeL : ST.reelL;
    const leanPt = q => {
      const lean = ((s.lean ?? 0) * Math.PI) / 180;
      const c = {x: 0, y: -186};
      const dx = q.x - c.x, dy = q.y - c.y;
      return {x: c.x + dx * Math.cos(lean) - dy * Math.sin(lean), y: c.y + dx * Math.sin(lean) + dy * Math.cos(lean)};
    };
    return {...solved, nodes, accessory: toWorld(leanPt(acc2)), y};
  }
  return {node, frame, anchors: base.anchors};
}

/** Lanyard + badge card (rig-local, drawn on the torso). */
function badgeNode(ctx, accent) {
  const c = accent || ctx.theme.accent2;
  const {x, y} = ST.badgeL;
  // a leather tab on the belt with a metal ring (where the ribbon clip fastens) and a small ID card below it
  return g(null,
    h('path', {d: `M${x - 7} ${y - 14}h14v16h-14Z`, fill: shade(c, -0.25), stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: x - 13, y: y + 8, width: 26, height: 32, rx: 4, fill: '#fffdf8', stroke: INK, 'stroke-width': 2}),
    h('rect', {x: x - 9, y: y + 13, width: 18, height: 6, rx: 2, fill: c}),
    h('rect', {x: x - 9, y: y + 23, width: 14, height: 3, rx: 1.5, fill: '#b7b0a3'}),
    h('rect', {x: x - 9, y: y + 30, width: 10, height: 3, rx: 1.5, fill: '#b7b0a3'}),
    h('circle', {cx: x, cy: y, r: 6, fill: 'none', stroke: '#8d949b', 'stroke-width': 3}),
  );
}

/** Retractable badge reel pinned on the chest (rig-local). */
function reelNode(ctx, accent) {
  const c = accent || ctx.theme.accent2;
  const {x, y} = ST.reelL;
  return g(null,
    h('circle', {cx: x, cy: y, r: 14, fill: c, stroke: INK, 'stroke-width': 2.4}),
    h('circle', {cx: x, cy: y, r: 7, fill: shade(c, 0.35), stroke: INK, 'stroke-width': 1.6}),
    h('circle', {cx: x, cy: y, r: 2.2, fill: INK}),
  );
}

/* ======================================================================== */
/* Props                                                                     */
/* ======================================================================== */

/**
 * The form. Local origin = sheet centre. Title / reference text is fitted in
 * stage units (`size`), wrapping between words (fitWords); labels hidden →
 * simulated lines only.
 */
export function formSheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = ST.sheet;
  const x = -w / 2, y = -hh / 2;
  const pad = 10;
  const parts = [
    h('path', {d: `M${x + 5} ${y + 7}h${w}v${hh}h${-w}Z`, fill: th.shadow}),
    h('path', {d: `M${x} ${y}H${x + w - 22}L${x + w} ${y + 22}V${y + hh}H${x}Z`, fill: th.paper, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${x + w - 22} ${y}V${y + 22}H${x + w}`, fill: th.paperShade, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('rect', {x: x + pad, y: y + pad, width: w - pad * 2 - 20, height: 9, rx: 3, fill: o.accent || th.accent}),
  ];
  let fitT = null, fitI = null;
  let textH = 0;
  if (o.showText) {
    const maxW = w - pad * 2;
    // largest size that fits above the simulated lines; if even the minimum does not, the
    // title may use the lines area too (the lines are only filler)
    let fits = false;
    for (const avail of [hh - 66, hh - 44]) {
      for (let size = o.size; size >= o.minSize - 1e-6; size -= 0.5) {
        const idSize = size; // the reference is supplied text: same size as the title (never a smaller floor)
        fitI = fitWords(o.id, {maxWidth: maxW, size: idSize, minSize: idSize, maxLines: 3, weight: 600});
        fitT = fitWords(o.title ?? '', {maxWidth: maxW, size, minSize: size, maxLines: 8, weight: 700});
        textH = fitI.height + 8 + fitT.height;
        if (!fitT.truncated && !fitI.truncated && textH <= avail) { fits = true; break; }
      }
      if (fits) break;
    }
    // printed text is hidden while the sheet lies flat (squashed it would be illegible)
    parts.push(g({name: `${o.name}-txt`}, textBlock(fitI, {x: x + pad, y: y + 26, fill: th.inkSoft}),
      o.title !== null ? textBlock(fitT, {x: x + pad, y: y + 26 + fitI.height + 8, fill: INK}) : null));
    fitT.overflow = !fits;
  }
  // blankTop: room kept free of filler lines at the top of the sheet (an entry prints a title there)
  const top = y + 30 + (o.showText ? textH + 12 : Math.max(12, o.blankTop ?? 0));
  for (let ly = top; ly < y + hh - 30; ly += 15) {
    parts.push(h('rect', {x: x + pad, y: ly, width: (w - pad * 2) * (0.62 + 0.36 * ctx.rng(`form-line-${o.seed || 'f'}`, Math.round(ly))), height: 5, rx: 2.5, fill: th.paperLine}));
  }
  // signature box at the foot of the form
  parts.push(h('path', {d: `M${x + pad} ${y + hh - 14}h${w * 0.5}`, stroke: INK, 'stroke-width': 1.6}));
  parts.push(h('path', {d: `M${x + pad + 6} ${y + hh - 18}c8 -12 14 -12 16 -2s8 6 14 -6s10 2 16 0`, fill: 'none', stroke: th.accent2, 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
  // title slot (sheet-local): where the title block starts; entries may overlay a title there
  const slot = {x: x + pad, y: y + 26 + (fitI ? fitI.height + 8 : 0), w: w - pad * 2, h: hh - 70 - (fitI ? fitI.height : 0)};
  return {node: g({name: o.name}, parts), fitTitle: fitT, fitId: fitI, slot, textName: o.showText ? `${o.name}-txt` : null};
}

/** Service counter (side view) with a document tray on the top. */
function counterNodes(ctx, P) {
  const th = ctx.theme;
  const C = ST.counter;
  const wood = th.dark ? '#7a5b40' : th.wood;
  const top = th.dark ? '#8e6a4b' : th.woodTop;
  const body = g({name: `${P}-counter`},
    h('rect', {x: C.x0 + 6, y: C.top + 18, width: C.x1 - C.x0 - 12, height: -C.top - 18, fill: wood, stroke: INK, 'stroke-width': 2.6}),
    h('rect', {x: C.x0 + 20, y: C.top + 40, width: C.x1 - C.x0 - 40, height: -C.top - 90, rx: 6, fill: shade(wood, 0.08), stroke: shade(wood, -0.3), 'stroke-width': 2}),
    h('rect', {x: C.x0 + 6, y: -22, width: C.x1 - C.x0 - 12, height: 22, fill: shade(wood, -0.3), stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: C.x0 - 8, y: C.top, width: C.x1 - C.x0 + 16, height: 20, rx: 5, fill: top, stroke: INK, 'stroke-width': 2.6}),
  );
  const tx = ST.trayX, tw = ST.sheet.w + 26;
  const trayBack = h('path', {d: roundRectPath(tx - tw / 2, C.top - 22, tw, 22, 5), fill: shade(th.metal, 0.2), stroke: INK, 'stroke-width': 2});
  const lip = () => h('path', {d: `M${tx - tw / 2 - 4} ${C.top - 14}H${tx + tw / 2 + 4}L${tx + tw / 2} ${C.top}H${tx - tw / 2}Z`, fill: th.metal, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'});
  // the lip is drawn under a form that passes by, and over the form once it stands in the tray
  const trayUnder = g({name: `${P}-tray`}, lip());
  const trayFront = g({name: `${P}-tray-over`, opacity: 0}, lip());
  return {body, trayBack, trayUnder, trayFront};
}

/** Small round table (side view) with a letter stand for the form. */
function tableNode(ctx, P) {
  const th = ctx.theme;
  const T0 = ST.table;
  const top = th.dark ? '#8e6a4b' : th.woodTop;
  return g({name: `${P}-table`},
    h('ellipse', {cx: T0.x, cy: -4, rx: 52, ry: 9, fill: th.shadow}),
    h('path', {d: `M${T0.x - 44} -4Q${T0.x} -22 ${T0.x + 44} -4Z`, fill: shade(th.metalDark, -0.1), stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: T0.x - 7, y: T0.top + 10, width: 14, height: -T0.top - 18, fill: th.metalDark, stroke: INK, 'stroke-width': 2.2}),
    h('rect', {x: T0.x - T0.w / 2, y: T0.top, width: T0.w, height: 14, rx: 6, fill: top, stroke: INK, 'stroke-width': 2.4}),
  );
}

/** Hanging sign above the counter; its text is fitted in stage units. */
function signNode(ctx, P, text, size, show, topY = ST.top) {
  const th = ctx.theme;
  const cx = (ST.counter.x0 + ST.clerkX) / 2 + 20;
  const maxW = 340;
  const fit = show && text ? fitWords(text, {maxWidth: maxW, size, minSize: size * 0.8, maxLines: 3, weight: 700}) : null;
  const w = fit ? fit.width + size * 1.4 : 220;
  const hh = fit ? fit.height + size * 0.9 : 54;
  // the sign hangs from the ceiling but always ends above the top of a form standing in the tray
  const formTop = ST.counter.top - 8 - ST.sheet.h + 2;
  const y = Math.max(topY + 10, Math.min(topY + 80, formTop - 10 - hh));
  return {
    node: g({name: `${P}-sign`},
      h('path', {d: `M${cx - w / 2 + 20} ${topY}V${y}M${cx + w / 2 - 20} ${topY}V${y}`, stroke: th.metalDark, 'stroke-width': 3}),
      h('path', {d: roundRectPath(cx - w / 2, y, w, hh, 10), fill: th.accent2, stroke: INK, 'stroke-width': 2.6}),
      fit ? g({name: `${P}-sign-txt`}, textBlock(fit, {x: cx, y: y + size * 0.45, anchor: 'middle', fill: '#fff'})) : h('rect', {x: cx - 70, y: y + hh / 2 - 5, width: 140, height: 10, rx: 5, fill: '#fff', opacity: 0.85})),
    box: {x: cx - w / 2, y, w, h: hh}, fit,
  };
}

/** Thumb drawn over a held sheet edge. */
function thumb(name, skin) {
  return g({name, opacity: 0},
    h('path', {d: 'M-8 -6C-3 -13 9 -12 12 -4C13 3 4 7 -4 5C-9 4 -11 -2 -8 -6Z', fill: skin, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
}

/** Ribbon between two points: outline + band + highlight, and a clip at the end. */
function ribbonNodes(ctx, P, color) {
  const band = key => g({name: `${P}-rib${key}`, opacity: 0},
    h('path', {name: `${P}-rib${key}-o`, fill: 'none', stroke: INK, 'stroke-width': 11, 'stroke-linecap': 'round'}),
    h('path', {name: `${P}-rib${key}-b`, fill: 'none', stroke: color, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('path', {name: `${P}-rib${key}-h`, fill: 'none', stroke: shade(color, 0.45), 'stroke-width': 1.6, 'stroke-dasharray': '10 8'}),
  );
  const clip = g({name: `${P}-clip`},
    h('rect', {x: -5, y: -7, width: 16, height: 14, rx: 3, fill: '#c9ced3', stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: 'M11 -4h6v8h-6', fill: 'none', stroke: INK, 'stroke-width': 1.8}));
  return {back: band('B'), front: band('F'), clip};
}

/* ======================================================================== */
/* Stage                                                                     */
/* ======================================================================== */

/** Identity "far" mapping (flat side view). */
export const FLAT = {fx: 0, fy: 0, k: 1};
/** Map a counter-side stage point through the far (depth) mapping. */
export const farPt = (far, q) => ({x: far.fx + q.x * far.k, y: far.fy + q.y * far.k});

/**
 * Builds the whole scene in stage units.
 * `far` places the counter side (counter, tray, clerk, sign, its wall) further
 * back: stage point q → (fx + q.x·k, fy + q.y·k). FLAT = a plain side view;
 * a depth layout (9:16) raises and shrinks it so the performer walks up into
 * the room, scaling down as they go.
 * @param {any} ctx
 * @param {{prefix:string, looks:any, plan:'represented'|'own', linked:boolean, doc:{title:string,id:string},
 *   docSize:number, docMin:number, sign:string, signSize:number, showText:boolean, ribbonColor?:string,
 *   far?:{fx:number,fy:number,k:number}, width?:number}} o
 */
export function repStage(ctx, o) {
  const P = o.prefix;
  const th = ctx.theme;
  const far = o.far || FLAT;
  const depth = far.k !== 1 || far.fy !== 0; // (a pure x shift stays a flat side view)
  const W = o.width ?? ST.W;
  const rib = o.ribbonColor || th.accent3;
  const client = walkerRig(ctx, {name: `${P}-cl`, look: o.looks.client, accessory: 'reel', accent: rib});
  const rep = walkerRig(ctx, {name: `${P}-rp`, look: o.looks.representative, accessory: 'badge', accent: th.accent2, extra: o.repExtra});
  const clerk = personRig(ctx, {name: `${P}-ck`, look: o.looks.clerk, pose: 'seated'});
  const topY = o.top ?? ST.top;
  // the counter side's own top (its coordinates are mapped by `far`); a cropped depth stage lowers it
  const farTop = (o.far && o.far !== FLAT && o.top !== undefined) ? Math.max(ST.top, (o.top - (o.far.fy)) / o.far.k) : topY;
  const sheet = formSheet(ctx, {name: `${P}-sheet-body`, title: o.doc.title === null ? null : o.doc.title, id: o.doc.id, size: o.docSize, minSize: o.docMin, idMin: o.idMin, showText: o.docText ?? o.showText, seed: 'form', blankTop: o.docBlank});
  const counter = counterNodes(ctx, P);
  const sign = signNode(ctx, P, o.sign, o.signSize / far.k, o.signText ?? o.showText, farTop);
  const ribbon = ribbonNodes(ctx, P, rib);
  const thumbs = {client: thumb(`${P}-thC`, o.looks.client.skin), rep: thumb(`${P}-thR`, o.looks.representative.skin), clerk: thumb(`${P}-thK`, o.looks.clerk.skin)};

  const floorFill = th.dark ? '#3a3f46' : '#e4d9c4';
  const wallA = th.dark ? '#2e3136' : '#efe7d9';
  const wallB = th.dark ? '#2b3138' : '#e3ebf0';
  const windowArt = (x, y, w, hh) => [
    h('path', {d: roundRectPath(x, y, w, hh, 10), fill: th.dark ? '#3b4450' : '#f8fbfc', stroke: th.dark ? '#59636f' : '#c9d3da', 'stroke-width': 6}),
    [0, 1, 2, 3, 4].map(i => h('rect', {x: x + 8, y: y + 8 + i * (hh - 16) / 5, width: w - 16, height: (hh - 16) / 5 - 16 > 6 ? 12 : 8, rx: 3, fill: th.dark ? '#4a5563' : '#dde6ec'})),
  ];
  let backNear, backFar;
  if (!depth) {
    backNear = g({name: `${P}-backdrop`},
      h('path', {d: roundRectPath(0, topY + 40, far.fx + ST.counter.x0 - 90, -topY - 40, 24), fill: wallA}),
      windowArt(ST.clientX + 110, topY + 60, 230, 150),
      far.fx > 120 ? h('path', {d: roundRectPath(ST.repX0 + 130, topY + 120, 110, 150, 8), fill: th.dark ? '#3a3530' : '#e6dccb', stroke: th.dark ? '#57504a' : '#d2c4ad', 'stroke-width': 5}) : null,
      h('rect', {x: 0, y: -18, width: W, height: 8, fill: shade(floorFill, -0.08)}),
      h('path', {d: roundRectPath(0, -10, W, 22, 8), fill: floorFill}),
      h('ellipse', {cx: ST.clientX + 6, cy: -2, rx: 52, ry: 9, fill: th.shadow}));
    backFar = g(null,
      h('path', {d: roundRectPath(ST.counter.x0 - 70, topY + 40, ST.W - ST.counter.x0 + 70, -topY - 40, 24), fill: wallB}),
      h('ellipse', {cx: ST.clerkX - 20, cy: -2, rx: 60, ry: 9, fill: th.shadow}));
  } else {
    // depth: a floor plane runs from the front edge up to the back wall; the counter stands at the back
    const backY = far.fy;
    const wallTop = far.fy + farTop * far.k;
    backNear = g({name: `${P}-backdrop`},
      h('path', {d: roundRectPath(0, wallTop, W, backY - wallTop + 4, 24), fill: wallA}),
      h('path', {d: `M0 ${backY}H${W}V12H0Z`, fill: shade(floorFill, 0.06)}),
      [0.25, 0.5, 0.75].map(t => h('path', {d: `M${r(W * t)} ${backY}L${r(W * (t - 0.5) * 1.8 + W / 2)} 12`, stroke: shade(floorFill, -0.08), 'stroke-width': 2})),
      h('rect', {x: 0, y: backY - 6, width: W, height: 8, fill: shade(floorFill, -0.12)}),
      windowArt(24, wallTop + 40, Math.min(230, far.fx + ST.counter.x0 * far.k - 150), 150 * far.k + 30),
      h('path', {d: roundRectPath(0, -10, W, 22, 8), fill: floorFill}),
      h('ellipse', {cx: ST.clientX + 6, cy: -2, rx: 52, ry: 9, fill: th.shadow}));
    backFar = g(null,
      h('path', {d: roundRectPath(ST.counter.x0 - 70, farTop + 40, ST.W - ST.counter.x0 + 70, -farTop - 40 - 6, 24), fill: wallB}),
      h('ellipse', {cx: ST.clerkX - 20, cy: -2, rx: 60, ry: 9, fill: th.shadow}));
  }
  const stool = g(null,
    h('path', {d: `M${ST.clerkX - 30} ${ST.clerkHip + 12}L${ST.clerkX - 44} 0M${ST.clerkX + 44} ${ST.clerkHip + 12}L${ST.clerkX + 56} 0`, stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('path', {d: `M${ST.clerkX - 40} -58H${ST.clerkX + 54}`, stroke: th.metalDark, 'stroke-width': 7, 'stroke-linecap': 'round'}));
  const farT = far === FLAT ? null : `${T(far.fx, far.fy)}${far.k !== 1 ? ` scale(${r(far.k, 4)})` : ''}`;
  const farBack = g({transform: farT}, backFar, sign.node, stool, clerk.node, counter.body, counter.trayBack, counter.trayUnder);
  const farFront = g({transform: farT}, counter.trayFront, thumbs.clerk);
  const sheetG = g({name: `${P}-sheet`}, sheet.node);
  const own = o.plan === 'own';
  const node = g({name: P},
    backNear, farBack, tableNode(ctx, P),
    own ? [ribbon.back, rep.node, client.node] : [client.node, ribbon.back, rep.node],
    ribbon.front, sheetG, farFront, ribbon.clip,
    thumbs.client, thumbs.rep,
  );

  /** Ribbon path from a to b with a small sag (retractable reel keeps it taut). */
  const ribbonPath = (a, b) => {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const sag = Math.min(34, 4 + d * 0.05);
    const c = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag};
    return {d: `M${r(a.x)} ${r(a.y)}Q${r(c.x)} ${r(c.y)} ${r(b.x)} ${r(b.y)}`, mid: {x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4}, len: d};
  };

  /**
   * Pose the stage.
   * v = {client:{x, y, k, walk, moving, near|nearL, head, mouth}, rep:{x, y, k, sx, walk, moving, near|nearL, head, mouth},
   *      clerk:{near (counter-side coords), head, mouth}, doc:'stand'|'client'|'rep'|'tray', clip:'reel'|'client'|'rep'|'badge',
   *      retract?: 0..1 (the reel winds the ribbon in: the clip slides back to the reel)}
   */
  function pose(v) {
    const nodes = {};
    const kC = v.client.k ?? 1, kR = v.rep.k ?? 1;
    const sC = client.frame({x: v.client.x, y: v.client.y ?? 0, k: kC, sx: 1, walk: v.client.walk, stride: v.client.stride, moving: v.client.moving, near: v.client.near, nearL: v.client.nearL, headTilt: v.client.head, mouth: v.client.mouth, lean: v.client.lean});
    const sR = rep.frame({x: v.rep.x, y: v.rep.y ?? 0, k: kR, sx: v.rep.sx, walk: v.rep.walk, stride: v.rep.stride, moving: v.rep.moving, near: v.rep.near, nearL: v.rep.nearL, headTilt: v.rep.head, mouth: v.rep.mouth, lean: v.rep.lean});
    const sK = clerk.frame({x: ST.clerkX, y: ST.clerkHip, facing: -1, near: v.clerk.near, headTilt: v.clerk.head, mouth: v.clerk.mouth});
    Object.assign(nodes, sC.nodes, sR.nodes, sK.nodes);
    const hC = sC.hands.near, hR = sR.hands.near;
    const hKf = sK.hands.near;          // counter-side coordinates
    const hK = farPt(far, hKf);        // world
    const sw = ST.sheet.w;
    let center, sxS = 1, syS = 1;
    const sx = v.rep.sx;
    switch (v.doc) {
      case 'client': center = {x: hC.x + kC * sw / 2, y: hC.y}; sxS = kC; syS = kC * (v.docUnfold ?? 1); break;
      case 'rep': center = {x: hR.x + sx * kR * sw / 2, y: hR.y}; sxS = Math.abs(sx) * kR; syS = kR; break;
      case 'tray': center = farPt(far, ST.tray); sxS = syS = far.k; break;
      default: center = {...ST.stand}; syS = FLAT_Y;
    }
    const scaled = sxS !== 1 || syS !== 1;
    nodes[`${P}-sheet`] = {transform: `${T(center.x, center.y)}${scaled ? ` scale(${r(sxS, 4)} ${r(syS, 4)})` : ''}`};
    nodes[`${P}-tray-over`] = {opacity: v.doc === 'tray' ? 1 : 0};
    if (sheet.textName) nodes[sheet.textName] = {opacity: syS / Math.max(sxS, 1e-3) > 0.55 || v.doc === 'tray' ? 1 : 0};
    const edgeL = {x: center.x - sw * sxS / 2, y: center.y};
    const edgeR = {x: center.x + sw * sxS / 2, y: center.y};
    const thumbAt = (key, hand, on, f, k) => { nodes[`${P}-th${key}`] = {opacity: on ? 1 : 0, transform: `${T(hand.x + f * 4 * k, hand.y - 3 * k)} scale(${r(f * k, 4)} ${r(k, 4)})`}; };
    thumbAt('C', hC, v.doc === 'client', 1, kC);
    thumbAt('R', hR, v.doc === 'rep', Math.sign(sx) || 1, kR);
    thumbAt('K', hKf, false, -1, 1);

    // ribbon: from the reel to the clip; the clip sits in a hand, on the badge or on the reel
    const reel = sC.accessory;
    const badge = sR.accessory;
    let clipPt = v.clip === 'client' ? hC : v.clip === 'rep' ? hR : v.clip === 'badge' ? badge : reel;
    const ret = clamp(v.retract ?? 0);
    if (ret > 0 && v.clip === 'badge') {
      const e = ease.inOutCubic(ret);
      clipPt = {x: lerp(badge.x, reel.x, e), y: lerp(badge.y, reel.y, e)};
    }
    const path = ribbonPath(reel, clipPt);
    const out = path.len > 6 && o.linked;
    // the ribbon is drawn in front of both people: the ring on the representative's belt is on the
    // side facing the viewer, so the clip stays visible whichever way she faces
    for (const key of ['F', 'B']) {
      const on = out && key === 'F';
      nodes[`${P}-rib${key}`] = {opacity: on ? 1 : 0};
      for (const part of ['o', 'b', 'h']) nodes[`${P}-rib${key}-${part}`] = {d: path.d};
    }
    const clipVisible = v.clip === 'reel' || ret >= 1 || o.linked;
    const ang = Math.atan2(clipPt.y - path.mid.y, clipPt.x - path.mid.x) * 180 / Math.PI;
    const kClip = v.clip === 'rep' || v.clip === 'badge' ? kR : kC;
    nodes[`${P}-clip`] = {opacity: clipVisible ? 1 : 0, transform: `${T(clipPt.x, clipPt.y, path.len > 6 ? ang : 0)}${kClip !== 1 ? ` scale(${r(kClip, 4)})` : ''}`};

    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      mouth: {client: sC.mouth, rep: sR.mouth, clerk: farPt(far, sK.mouth)},
      heads: {client: sC.head, rep: sR.head, clerk: farPt(far, sK.head)},
      tops: {client: sC.top, rep: sR.top, clerk: farPt(far, sK.top)},
      ribbonMid: path.mid,
      ribbonLen: path.len,
      semantic: {
        handC: P2(hC), handR: P2(hR), handK: P2(hK), sheetUnfold: r(v.doc === 'stand' ? FLAT_Y : v.doc === 'client' ? (v.docUnfold ?? 1) : 1, 3),
        edgeL: P2(edgeL), edgeR: P2(edgeR), sheet: P2(center), sheetScale: r(sxS, 3),
        reel: P2(reel), badge: P2(badge), clip: P2(clipPt),
        docAt: v.doc, clipAt: ret >= 1 ? 'reel' : v.clip,
        linked: Boolean(o.linked) && v.clip === 'badge' && ret < 1,
        clientX: r(v.client.x), repX: r(v.rep.x), repFacing: r(sx, 3),
        allReached: sC.reached && sR.reached && sK.reached,
      },
    };
  }

  return {node, pose, sign, sheet, far, rigs: {client, rep, clerk}};
}

/* ======================================================================== */
/* Shared choreography (action clock c ∈ [0, 1])                             */
/* ======================================================================== */

/** The link beat (only when a link is supplied): clip reel → shared point → badge. */
const LINK_W = {clipTake: [0.03, 0.11], clipPass: [0.11, 0.2], repReach: [0.14, 0.2], clipOn: [0.2, 0.29], clientBack: [0.2, 0.27]};
const TAIL_W = {present: [0.77, 0.83], clerkReach: [0.79, 0.85], release: [0.86, 0.93], clerkBack: [0.9, 1]};

/**
 * Clock windows for a plan. `represented`: the form changes hands at the
 * table, the representative turns and walks. `own`: the client picks the form
 * up and walks (after the link beat when a link is supplied).
 * @param {'represented'|'own'} plan
 * @param {boolean} linked
 */
export function planWindows(plan, linked) {
  if (plan === 'represented') {
    return {...LINK_W, look: [0, 0.05], pick: [0.27, 0.34], lift: [0.34, 0.4], repToDoc: [0.33, 0.4], take: [0.41, 0.46], clientRest: [0.42, 0.48],
      turn: [0.46, 0.54], walk: [0.54, 0.77], ...TAIL_W};
  }
  return linked
    ? {...LINK_W, look: [0, 0.05], pick: [0.29, 0.36], lift: [0.36, 0.43], walk: [0.43, 0.77], ...TAIL_W}
    : {look: [0, 0.05], pick: [0.12, 0.24], lift: [0.24, 0.32], walk: [0.32, 0.77], ...TAIL_W};
}

const mixP = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
/** piecewise path through points with eased local progress */
const pathAt = (pts, t) => {
  const n = pts.length - 1;
  const x = clamp(t) * n;
  const i = Math.min(n - 1, Math.floor(x));
  return mixP(pts[i], pts[i + 1], ease.inOutSine(x - i));
};

/**
 * Stage inputs for a plan at clock c.
 * @param {'represented'|'own'} plan
 * @param {number} c action clock 0..1
 * @param {{linked?:boolean, stop?:'received'|'presented', reduced?:boolean}} [opt]
 *   stop 'presented': the form is held out at the counter; the clerk does not take it.
 */
export function choreo(plan, c, opt = {}) {
  const linked = Boolean(opt.linked);
  const W = planWindows(plan, linked);
  const s = key => (W[key] ? clamp((c - W[key][0]) / (W[key][1] - W[key][0])) : 0);
  const e = key => ease.inOutCubic(s(key));
  const presented = opt.stop === 'presented';
  const C = ST;
  const sw = C.sheet.w;
  const far = opt.far || FLAT;
  const F = q => farPt(far, q);
  const standP = F({x: C.standX, y: 0});
  /** rig-local point of the performer once at the counter (facing +1, far scale) */
  const atStand = q => ({x: standP.x + q.x * far.k, y: standP.y + q.y * far.k});
  const reelW = {x: C.clientX + C.reelL.x, y: C.reelL.y};
  const repBadge = {x: C.repX0 - C.badgeL.x, y: C.badgeL.y};
  const clientRest = {x: C.clientX + 22, y: -156};
  const repRest = {x: C.repX0 - 22, y: -156};
  const stdEdgeL = {x: C.stand.x - sw / 2, y: C.stand.y};
  const passL = {x: C.pass.x - sw / 2, y: C.pass.y};
  const passR = {x: C.pass.x + sw / 2, y: C.pass.y};
  const hatchL = F({x: C.hatch.x - sw / 2, y: C.hatch.y});
  const hatchR = {x: C.hatch.x + sw / 2, y: C.hatch.y}; // counter-side coordinates (the clerk lives there)
  const standRest = atStand({x: 22, y: -156});
  const v = {
    client: {x: C.clientX, y: 0, k: 1, walk: 0, moving: 0, near: null, nearL: null, head: 0, mouth: 0},
    rep: {x: C.repX0, y: 0, k: 1, sx: -1, walk: 0, moving: 0, near: null, nearL: null, head: 0, mouth: 0},
    clerk: {near: null, head: 0, mouth: 0},
    doc: 'stand', clip: 'reel', docUnfold: 1,
  };

  // ---- link beat: the client pulls the clip from the reel, passes it over the table; the representative clips it on
  let clientNear = null, repNear = null;
  if (linked) {
    if (c < W.clipPass[0]) clientNear = s('clipTake') > 0 ? pathAt([clientRest, {x: reelW.x + 30, y: -236}, reelW], e('clipTake')) : null;
    else if (c < W.clientBack[0]) clientNear = mixP(reelW, C.clipPass, e('clipPass'));
    else clientNear = mixP(C.clipPass, clientRest, e('clientBack'));
    if (c < W.clipOn[0]) repNear = s('repReach') > 0 ? mixP(repRest, C.clipPass, e('repReach')) : null;
    else repNear = pathAt([C.clipPass, {x: 350, y: -320}, {x: repBadge.x - 6, y: repBadge.y - 20}, repBadge], s('clipOn'));
    v.clip = c < W.clipTake[1] ? 'reel' : c < W.clipPass[1] ? 'client' : c < W.clipOn[1] ? 'rep' : 'badge';
    v.rep.head = 5 * Math.sin(Math.PI * clamp((c - W.repReach[0]) / (W.clipOn[1] - W.repReach[0])));
  }
  const restOrLink = (near, rest) => near || rest;

  // ---- the walk of the performer
  const walkT = s('walk');
  const walkE = ease.inOutSine(walkT);
  const x0 = plan === 'own' ? C.clientX : C.repX0;
  const pathLen = Math.hypot(standP.x - x0, standP.y);
  const walkLen = pathLen / ((1 + far.k) / 2);
  const px = lerp(x0, standP.x, walkE);
  const py = lerp(0, standP.y, walkE);
  const pk = lerp(1, far.k, walkE);
  const stride = clamp(walkLen / 2.3, 118, 170);
  const moving = walkT > 0 && walkT < 1 ? Math.min(1, Math.sin(Math.PI * walkT) * 3) : 0;
  const released = !presented && c >= W.release[0]; // the form is let go into the tray at this instant
  const presentNear = carryW => (released ? mixP(hatchL, standRest, e('release')) : mixP(carryW, hatchL, e('present')));

  if (plan === 'represented') {
    // client: picks the form from the stand, lifts it to the pass point, lets go once the representative holds it
    if (c >= W.pick[0]) {
      if (c < W.lift[0]) clientNear = mixP(linked ? clientRest : clientRest, stdEdgeL, e('pick'));
      else if (c < W.clientRest[0]) clientNear = mixP(stdEdgeL, passL, e('lift'));
      else clientNear = mixP(passL, clientRest, e('clientRest'));
    }
    v.client.near = clientNear;
    v.client.head = 6 * Math.sin(Math.PI * s('pick'));
    // representative: from the badge (or rest) to the right edge of the form, takes it, turns, walks, presents
    const repFrom = linked ? repBadge : repRest;
    if (c >= W.repToDoc[0] && c < W.take[0]) repNear = mixP(repFrom, passR, e('repToDoc'));
    const CARRY_NEAR = {x: 50, y: C.carry.y};  // facing the client: the form is held close, clear of her face
    const carryLeft = {x: C.repX0 - CARRY_NEAR.x, y: CARRY_NEAR.y};
    if (c >= W.take[0]) repNear = mixP(passR, carryLeft, e('take'));
    v.doc = c < W.pick[1] ? 'stand' : c < W.take[0] ? 'client' : 'rep';
    v.docUnfold = lerp(FLAT_Y, 1, e('lift'));
    let sx = -Math.cos(Math.PI * ease.inOutSine(s('turn')));
    if (Math.abs(sx) < 0.03) sx = s('turn') < 0.5 ? -0.03 : 0.03;
    v.rep.sx = c < W.turn[0] ? -1 : sx;
    v.rep.x = px;
    v.rep.y = py;
    v.rep.k = pk;
    v.rep.walk = walkE * walkLen;
    v.rep.stride = stride;
    v.rep.moving = moving;
    if (c < W.turn[0]) v.rep.near = restOrLink(repNear, null);
    else if (c < W.present[0]) v.rep.nearL = mixP(CARRY_NEAR, C.carry, e('turn'));
    else v.rep.near = presentNear(atStand(C.carry));
    if (c >= W.repToDoc[0]) v.rep.head = c < W.turn[0] ? 4 : lerp(0, -3, s('present'));
  } else {
    // own action: the client picks the form up and walks to the counter themself
    v.client.x = px;
    v.client.y = py;
    v.client.k = pk;
    v.client.walk = walkE * walkLen;
    v.client.stride = stride;
    v.client.moving = moving;
    const carryW = {x: C.clientX + C.carry.x, y: C.carry.y};
    if (c < W.pick[0]) v.client.near = clientNear;
    else if (c < W.lift[0]) v.client.near = mixP(clientRest, stdEdgeL, e('pick'));
    else if (c < W.walk[0]) v.client.near = mixP(stdEdgeL, carryW, e('lift'));
    else if (c < W.present[0]) v.client.nearL = C.carry;
    else v.client.near = presentNear(atStand(C.carry));
    v.client.head = 6 * Math.sin(Math.PI * s('pick')) - 3 * s('present');
    v.doc = c < W.pick[1] ? 'stand' : 'client';
    v.docUnfold = lerp(FLAT_Y, 1, e('lift'));
    v.rep.near = repNear;
    if (!linked || c >= W.clipOn[1]) v.rep.head = lerp(0, -4, s('walk'));
  }
  // counter: the clerk looks at the form, puts a hand on its right edge; it is let go into the tray
  const clerkRest = {x: C.clerkX - 70, y: C.clerkHip - 30};
  const reach = presented ? 0 : e('clerkReach');
  const back = presented ? 0 : e('clerkBack');
  v.clerk.near = back > 0 ? mixP(hatchR, clerkRest, back) : mixP(clerkRest, hatchR, reach);
  v.clerk.head = lerp(-6, 6, s('present'));
  if (released) v.doc = 'tray';
  const talk = clamp((c - W.present[0]) / (W.release[1] - W.present[0]));
  const perf = plan === 'own' ? v.client : v.rep;
  perf.mouth = talk > 0 && talk < 1 ? (opt.reduced ? 0.4 : 0.3 + 0.4 * Math.sin(talk * Math.PI * 7) ** 2) : 0;
  return v;
}

/* ======================================================================== */
/* Labels                                                                    */
/* ======================================================================== */

/**
 * Speech bubble (fitted with fitWords, never truncated within maxLines) with
 * a tail to `tip`. Labels hidden → abstract lines. Returns node + box.
 */
export function bubble(ctx, o) {
  const th = ctx.theme;
  const show = ctx.show('all') && o.text;
  const padX = o.size * 0.7, padY = o.size * 0.5;
  const fit = show ? fitWords(o.text, {maxWidth: o.maxWidth - padX * 2, size: o.size, minSize: o.minSize ?? o.size * 0.8, maxLines: o.maxLines ?? 3, weight: 600}) : null;
  const tw = fit ? fit.width : Math.min(o.maxWidth - padX * 2, o.size * 7);
  const th2 = fit ? fit.height : o.size * 1.6;
  const bw = tw + padX * 2, bh = th2 + padY * 2;
  const x = o.anchor === 'end' ? o.x - bw : o.anchor === 'middle' ? o.x - bw / 2 : o.x;
  const y = o.bottom - bh;
  const cx = clamp(o.tip.x, x + Math.min(bh * 0.6, bw / 2), x + bw - Math.min(bh * 0.6, bw / 2));
  const baseY = y + bh;
  const tail = `M${r(cx - 14)} ${r(baseY)}L${r(o.tip.x)} ${r(o.tip.y)}L${r(cx + 14)} ${r(baseY)}`;
  const node = g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(x + 5, y + 7, bw, bh, Math.min(bh * 0.45, 30)), fill: th.shadow}),
    h('path', {d: tail, fill: th.card, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(x, y, bw, bh, Math.min(bh * 0.45, 30)), fill: th.card, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(cx - 12)} ${r(baseY)}H${r(cx + 12)}`, stroke: th.card, 'stroke-width': 4.5}),
    fit
      ? textBlock(fit, {x: x + bw / 2, y: y + padY, anchor: 'middle', fill: INK})
      : g(null,
        h('rect', {x: x + padX, y: y + padY + 2, width: tw, height: o.size * 0.42, rx: 3, fill: th.paperLine}),
        h('rect', {x: x + padX, y: y + padY + o.size * 0.95, width: tw * 0.62, height: o.size * 0.42, rx: 3, fill: th.paperLine})),
  );
  return {node, box: {x, y, w: bw, h: bh}, fit};
}

/** The neutral "as supplied · no conclusion drawn" key (a dot, never a tick). */
export function keyChip(ctx, text, o) {
  const th = ctx.theme;
  const c = wchip(ctx, `◦ ${text}`, {x: o.x, y: o.y, anchor: o.anchor ?? 'start', maxWidth: o.maxWidth, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 2, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: o.name});
  return c;
}

/** Tag chip showing who performs the act (own / represented), in the lane colour. */
export function actionTag(ctx, text, o) {
  return wchip(ctx, `● ${text}`, {x: o.x, y: o.y, anchor: o.anchor ?? 'middle', maxWidth: o.maxWidth, size: o.size, minSize: o.minSize ?? o.size * 0.85, maxLines: o.maxLines ?? 2, fill: ctx.theme.card, stroke: o.color, color: o.color, weight: 700, name: o.name});
}

/**
 * True when a fitted text wraps only between words (or after a hyphen/slash
 * inside a word): no line break in the middle of a word.
 */
export function wordSafe(fit) {
  if (!fit) return true;
  const squash = t => String(t).replace(/([-‐/])\s+/g, '$1').replace(/\s+/g, ' ').trim();
  return squash(fit.lines.join(' ')) === squash(fit.full);
}

/** Box overlap helper. */
export function hit(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
}

/**
 * Numbered editorial note for crowded holds: the note sits in a reserved band
 * with a number disc; a matching disc marks the target (no leader line that
 * could cross other labels). Same frame protocol as noteCallout.
 * @param {any} ctx
 * @param {{name:string, text:string, n:number, x:number, y:number, maxWidth:number, size:number, minSize?:number, maxLines?:number, target:{x:number,y:number}}} o
 */
export function numberedNote(ctx, o) {
  const th = ctx.theme;
  const R = o.size * 0.62;
  const num = (cx, cy, name) => g({name},
    h('circle', {cx: r(cx), cy: r(cy), r: r(R), fill: th.ink, stroke: th.card, 'stroke-width': 2.5}),
    h('text', {x: r(cx), y: r(cy + o.size * 0.3), 'text-anchor': 'middle', 'font-size': r(o.size * 0.8, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, String(o.n)));
  const c = wchip(ctx, o.text, {x: o.x + R * 2 + 8, y: o.y, anchor: 'start', maxWidth: o.maxWidth - R * 2 - 8, size: o.size, minSize: o.minSize ?? o.size, maxLines: o.maxLines ?? 3, fill: th.card, stroke: th.ink, color: th.ink, name: `${o.name}-chip`});
  const b = c.box;
  const node = g({name: o.name, opacity: 0}, num(o.x + R, b.y + b.h / 2, `${o.name}-n1`), c.node, num(o.target.x, o.target.y, `${o.name}-dot`));
  const frame = p => ({
    [o.name]: {opacity: p > 0 ? 1 : 0},
    [`${o.name}-dot`]: {opacity: r(clamp(p / 0.5), 3)},
    [`${o.name}-n1`]: {opacity: r(clamp((p - 0.3) / 0.5), 3)},
    [`${o.name}-chip`]: {opacity: r(clamp((p - 0.45) / 0.55), 3)},
  });
  return {node, frame, box: {x: o.x, y: b.y, w: b.x + b.w - o.x, h: b.h}, fit: c.fit, targetBox: {x: o.target.x - R, y: o.target.y - R, w: R * 2, h: R * 2}};
}
