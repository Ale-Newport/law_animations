/**
 * Motif kit for "Atención en registro" (LAW-0189..0192).
 *
 * Geometry, props, a walking person rig, the registry-window stage and its
 * pose solver. Each entry owns its own timeline, layout of editorial text
 * and semantics; the mechanism (LAW-0190) only uses the fields, strings and
 * the prop drawings.
 *
 * The stage (front view of a registry window, "stage units", floor y = 0):
 *   wall · window opening with the clerk seated behind the ledge, facing the
 *   viewer (mediation-props frontMediator) · ledge with a slip printer (left),
 *   and a checklist card on a stand (right of the clerk) · counter panel
 *   under the ledge · the person filing stands in front of the wall at the
 *   left end of the ledge (side view, personRig + stepping legs), facing the
 *   clerk.
 * Props always follow SOLVED hand positions:
 *  - the bundle (a stack of sheets with coloured index tabs) is placed from
 *    the holder's solved hand: the filer holds its LEFT grip, the clerk its
 *    RIGHT grip; at the hand-off both hands are on the same bundle;
 *  - the reference slip rises out of the printer (clipped by the printer
 *    body), is taken by the clerk's left hand at its right grip and handed to
 *    the filer's near hand at its left grip;
 *  - the pen is drawn from the clerk's solved right hand (frontMediator).
 * Checklist glyphs are neutral: a filled ink dot = received (a process
 * step, never a tick) and a dashed empty ring = pending as supplied (never a
 * red cross). Nothing here decides validity, admissibility, deadlines or any
 * consequence of a pending item.
 * @module animations/roles/kits/atencion-en-registro
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, r} from '../../../core/time.js';
import {mix, roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf, party, RELATION_KINDS} from '../../../schemas/fields.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {changedMarker} from '../../../primitives/markers.js';
import {frontMediator} from './mediation-props.js';
import {fitWords as fitWordsBase, wchip as wchipBase, noteCallout as noteCalloutBase, overlaps} from './mediation-labels.js';

export {overlaps};

/**
 * Keep a number with its word: "Annex 1", "Day 3", "REF 0427" never break between the word and the
 * number, and a leading list number ("1  Filing form") stays with the next word. The glue is a
 * no-break space, which fitWords keeps together and renders as a space.
 * @param {string} text
 */
export function keepNumbers(text) {
  return String(text ?? '')
    .replace(/(\S)[ \t]+(\d[\d.,:/-]*)(?=[\s)·,;.]|$)/gu, '$1\u00a0$2')
    .replace(/^(\d[\d.]*)[ \t]+(?=\S)/u, '$1\u00a0');
}

/** fitWords with numbers kept on their word (see keepNumbers). */
export function fitWords(text, o) {
  return fitWordsBase(keepNumbers(text), o);
}

/** wchip with numbers kept on their word. */
export function wchip(ctx, text, o) {
  return wchipBase(ctx, keepNumbers(text), o);
}

/** noteCallout with numbers kept on their word. */
export function noteCallout(ctx, o) {
  return noteCalloutBase(ctx, {...o, text: keepNumbers(o.text)});
}

const INK = '#1f2328';

/* ======================================================================== */
/* Fields                                                                   */
/* ======================================================================== */

/** Person ids (actors[0], actors[1]). */
export const REG_IDS = ['filer', 'clerk'];

export const regRelationship = obj('A supplied relationship between the two people (drawn as supplied between their name chips; not a legal finding)', {
  from: oneOf('Source person', REG_IDS),
  to: oneOf('Target person', REG_IDS),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the relationship line (as supplied)', 60),
}, ['from', 'to', 'kind']);

export const itemField = obj('A checklist item, exactly as supplied', {
  label: str('Item name printed on the checklist', 60),
  status: oneOf('Status as supplied: received (a sheet for it is in the bundle) or pending (marked pending on the checklist). Nothing is inferred from it', ['received', 'pending']),
}, ['label', 'status']);

/** Category fields (roles) specialised for this motif. */
export const regFields = {
  actors: list('The person filing and the registry clerk, in this order (fictional people)', party, 2, 2),
  roles: obj('Descriptive role captions (never a legal finding)', {
    filer: str('Role caption for the person handing in the documents', 40),
    clerk: str('Role caption for the person at the registry window', 40),
  }),
  relationships: list('Explicit relationships between the two people; drawn between their name chips with the supplied label', regRelationship, 1, 2),
};

/** Intake content (supplied, fictional). */
export const regProps = obj('Intake content: supplied text, shown exactly as supplied (nothing is assessed)', {
  items: list('Checklist items in order, each with its supplied status (2–4)', itemField, 2, 4),
  reference: str('Entry reference printed on the slip (fictional)', 32),
  speech: obj('Speech bubble text (as supplied)', {
    filer: str('What the person filing says when handing in the documents', 80),
    clerk: str('What the clerk says when handing back the slip', 80),
  }),
});

export const REG_DEFAULTS = {
  actors: [
    {name: 'Noor Haddad', role: 'Person filing'},
    {name: 'Tomás Rivera', role: 'Registry clerk'},
  ],
  roles: {filer: 'Person filing', clerk: 'Registry clerk'},
  relationships: [{from: 'filer', to: 'clerk', kind: 'communication', label: 'hands documents to'}],
};

export const REG_PROPS = {
  items: [
    {label: 'Filing form', status: 'received'},
    {label: 'Cover letter', status: 'received'},
    {label: 'Annex 1 · site plan', status: 'received'},
  ],
  reference: 'REF-0427 (fictional)',
  speech: {filer: 'I would like to file these documents.', clerk: 'Here is your entry reference.'},
};

export const REG_DEFAULTS_ES = {
  actors: [
    {name: 'Noor Haddad', role: 'Persona que presenta'},
    {name: 'Tomás Rivera', role: 'Personal del registro'},
  ],
  roles: {filer: 'Persona que presenta', clerk: 'Personal del registro'},
  relationships: [{from: 'filer', to: 'clerk', kind: 'communication', label: 'entrega documentos a'}],
};

export const REG_PROPS_ES = {
  items: [
    {label: 'Formulario de presentación', status: 'received'},
    {label: 'Carta de presentación', status: 'received'},
    {label: 'Anexo 1 · plano', status: 'received'},
  ],
  reference: 'REF-0427 (ficticia)',
  speech: {filer: 'Vengo a presentar estos documentos.', clerk: 'Aquí tiene su referencia de entrada.'},
};

/** Built-in strings shared by the four entries. */
export const KIT_STRINGS = {
  en: {
    key: 'As supplied · no conclusion drawn',
    received: 'Received',
    pendingAs: 'Pending (as supplied)',
    stateIssued: 'Entry reference issued',
    stateChecked: 'Documents checked against the checklist',
    stateHanded: 'Documents handed over',
    checklist: 'Checklist',
    slip: 'Entry reference',
  },
  es: {
    key: 'Según lo aportado · sin conclusión',
    received: 'Recibido',
    pendingAs: 'Pendiente (según lo aportado)',
    stateIssued: 'Referencia de entrada emitida',
    stateChecked: 'Documentos cotejados con la lista',
    stateHanded: 'Documentos entregados',
    checklist: 'Lista de comprobación',
    slip: 'Referencia de entrada',
  },
};

/** Role caption of a person, falling back to the party's own role. */
export function roleOf(p, id) {
  const i = id === 'filer' ? 0 : 1;
  return (p.roles && p.roles[id]) || (p.actors[i] && p.actors[i].role) || '';
}

/** Chip caption "Name · role". */
export function captionOf(p, id, override) {
  const i = id === 'filer' ? 0 : 1;
  const role = override || roleOf(p, id);
  return role ? `${p.actors[i].name} · ${role}` : p.actors[i].name;
}

/** Colour of an item's index tab (sheet tab = checklist swatch). */
export function itemColor(ctx, i) {
  const th = ctx.theme;
  return [th.accent2, th.accent3, th.accent4, '#7a5c8e'][i % 4];
}

/** Received items (their sheets are in the bundle), in checklist order. */
export function receivedIndices(items) {
  return items.map((it, i) => (it.status === 'received' ? i : -1)).filter(i => i >= 0);
}

/** Piecewise point track (segments {a,b,to,ease} or {a,b,at(u)}). */
export function runTrack(u, start, segs) {
  let p = start;
  for (const s of segs) {
    if (u < s.a) return p;
    if (s.at) {
      if (u <= s.b) return s.at(u);
      p = s.at(s.b);
      continue;
    }
    const e = (s.ease || ease.inOutCubic)(clamp((u - s.a) / (s.b - s.a)));
    if (u <= s.b) return mix(p, s.to, e);
    p = s.to;
  }
  return p;
}

/* ======================================================================== */
/* Stage constants (stage units, floor y = 0)                                */
/* ======================================================================== */

export const RG = {
  ledgeY: -255,            // front edge of the ledge's top face
  ledgeTop: 12,            // visible depth of the top face (drawn above ledgeY)
  ledgeFront: 16,          // front thickness of the ledge below ledgeY
  winTop: -486,            // top of the window opening (raised further for a tall checklist card)
  winX0: 150,              // left jamb of the window opening
  filerX: 95,              // the filer's floor point at the counter (side view)
  clerk: {x: 470, sy: -305, k: 0.9},
  printerX0: 166,
  printerH: 60,
  cardGap: 96,             // card left edge = clerk.x + cardGap
  cardBase: -262,          // bottom of the checklist card (on its stand)
  bundle: {w: 118, h: 160},
  grip: 18,                // grips sit this far below the bundle centre
  fan: {x: -22, y: -20},   // stair offset per fanned sheet
  handoff: {x: 279, y: -352},     // bundle centre at the hand-off
  display: {x: 318, y: -404},     // bundle centre while the clerk fans it
  lie: {x: 408},                  // bundle centre x when laid on the ledge
  lieScale: 0.14,
  carry: {x: 70, y: -262},        // filer-local near-hand target while carrying
  read: {x: 74, y: -298},         // filer-local near-hand target holding the slip up (grip at its lower-left)
  restL: {x: 430, y: -262},       // clerk's left hand at rest on the ledge
  restNib: {x: 500, y: -251},     // clerk's pen nib at rest on the ledge
};

/* ======================================================================== */
/* Walking person rig (side view)                                           */
/* ======================================================================== */

const THIGH = 92, SHIN = 90;

/**
 * Standing person that walks: personRig's head, torso and IK arms (reused as
 * they are) with stepping two-bone legs.
 * frame({x, y, k, walk, moving, near, far, lean, headTilt, mouth})
 *  - walk: distance walked (drives the gait); moving: 0..1 blend so steps
 *    start and stop cleanly; near/far: WORLD hand targets (null = rest; the
 *    far arm swings gently while walking).
 * @param {any} ctx
 * @param {{name:string, look:any}} o
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
  const node = g({name: N}, farArm, leg('F'), leg('N'), upper, nearArm);

  function frame(s) {
    const k = s.k ?? 1;
    const walk = s.walk ?? 0;
    const stride = 118;
    const phase = (walk / stride) * Math.PI * 2;
    const moving = clamp(s.moving ?? 0);
    const bob = -Math.abs(Math.sin(phase)) * 5 * moving;
    const y = s.y + bob * k;
    const toWorld = q => ({x: s.x + q.x * k, y: y + q.y * k});
    const farT = s.far ?? (moving ? toWorld({x: -10 - Math.sin(phase) * 22 * moving, y: -159}) : null);
    const solved = base.frame({x: s.x, y, facing: 1, scale: k, lean: s.lean ?? 0, headTilt: s.headTilt ?? 0, mouth: s.mouth ?? 0, near: s.near ?? null, far: farT});
    const nodes = solved.nodes;
    const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
    const feet = {};
    for (const [key, hipX, footX, off] of [['F', -6, -8, Math.PI], ['N', 6, 12, 0]]) {
      const ph = phase + off;
      const swing = Math.sin(ph) * 26 * moving;
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
      feet[key] = toWorld(ankle);
    }
    return {...solved, nodes, feet, y};
  }
  return {node, frame, anchors: base.anchors};
}

/* ======================================================================== */
/* Props                                                                    */
/* ======================================================================== */

/**
 * Bundle: a stack of sheets, each with a coloured index tab (its checklist
 * row's colour) and simulated lines. Local origin = centre of the front
 * sheet; sheets are named `${name}-s${i}` (i = 0 front … n−1 back).
 * @param {any} ctx
 * @param {{name:string, colors:string[], w:number, h:number}} o
 */
export function bundleProp(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh} = o;
  // an optional neutral cover sheet in front (index 0): the squared bundle then looks the same whatever it holds
  const colors = o.cover ? ['cover', ...o.colors] : o.colors;
  const n = colors.length;
  const x = -w / 2, y = -hh / 2;
  const sheets = [];
  for (let i = n - 1; i >= 0; i--) {
    const isCover = colors[i] === 'cover';
    const c = isCover ? th.paperShade : colors[i];
    const bars = [];
    for (let j = 0; j < 6; j++) {
      const ly = y + 44 + j * 17;
      if (ly > y + hh - 22) break;
      bars.push(h('rect', {x: r(x + 12), y: r(ly), width: r((w - 24) * (j === 5 ? 0.5 : 0.7 + 0.28 * ctx.rng(`${o.name}-bar-${i}`, j))), height: 5, rx: 2.5, fill: th.paperLine, 'data-bar': 1}));
    }
    sheets.push(g({name: `${o.name}-s${i}`},
      // one shadow under the squared stack (the back sheet); a fanned sheet shows its own
      h('path', {name: i === n - 1 ? null : `${o.name}-sh${i}`, d: roundRectPath(x + 4, y + 6, w, hh, 4), fill: th.shadow, opacity: i === n - 1 ? 1 : 0}),
      // index tab sticking out of the top-left corner
      h('path', {d: `M${r(x + 8)} ${r(y + 2)}V${r(y - 13)}Q${r(x + 8)} ${r(y - 17)} ${r(x + 12)} ${r(y - 17)}H${r(x + 34)}Q${r(x + 38)} ${r(y - 17)} ${r(x + 38)} ${r(y - 13)}V${r(y + 2)}Z`, fill: c, stroke: INK, 'stroke-width': 2}),
      h('path', {d: roundRectPath(x, y, w, hh, 4), fill: th.paper, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
      isCover ? h('rect', {x: r(x + 10), y: r(y + 12), width: r(w - 20), height: 16, rx: 3, fill: th.paperShade, stroke: th.paperLine, 'stroke-width': 1.5}) : h('rect', {x: r(x + 10), y: r(y + 12), width: r(w - 20), height: 16, rx: 3, fill: c}),
      isCover ? null : bars,
      h('path', {d: `M${r(x + 14)} ${r(y + hh - 14)}c8 -10 14 -10 16 -2s8 5 14 -5s10 2 16 0`, fill: 'none', stroke: th.accent2, 'stroke-width': 2, 'stroke-linecap': 'round'}),
    ));
  }
  return {node: g({name: o.name}, sheets), n, cover: Boolean(o.cover)};
}

/** A small thumb drawn over a held edge (the hand behind the prop grips it). */
export function thumbNode(name, skin) {
  return g({name, opacity: 0},
    h('path', {d: 'M-9 -7C-3 -15 10 -14 13 -5C14 3 4 8 -5 6C-10 4 -12 -2 -9 -7Z', fill: skin, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
}

/**
 * True when a wrapped fit breaks a word of its source text across lines
 * ("(fictional" / ")"), which fitWords only does as a last resort.
 * @param {{lines:string[], full:string}} fit
 */
export function splitsWord(fit) {
  const words = new Set(String(fit.full).replace(/\s+/g, ' ').trim().split(' '));
  for (let i = 0; i + 1 < fit.lines.length; i++) {
    const a = fit.lines[i].trim().split(' ').pop() || '';
    const b = fit.lines[i + 1].trim().split(' ')[0] || '';
    if (!a || !b || /[-‐/]$/.test(a)) continue;
    // broken when the two pieces are adjacent parts of one source word
    for (const w of words) if (w.includes(a + b)) return true;
  }
  return false;
}

/** A wrap to avoid: a broken word or a continuation line of 1–2 characters ("de", ")"). */
export function badWrap(fit) {
  return splitsWord(fit) || fit.lines.slice(1).some(l => l.trim().length <= 2)
    // a number torn from the word before it ("Annex / 12", "REF / 0427")
    || fit.lines.slice(1).some((l, i) => /^\d/.test(l.trim()) && /\p{L}$/u.test(fit.lines[i].trim()));
}

/**
 * Measure the entry-reference slip (stage units). The slip's header (a
 * supplied object label) and the reference are wrapped between words.
 */
export function measureSlip(ctx, {su, header, ref, w, minSize}) {
  const pad = su * 0.55;
  const inner = w - pad * 2;
  const mh = header ? fitWords(header, {maxWidth: inner, size: su, minSize: minSize ?? su, maxLines: 4, weight: 700}) : null;
  const mr = fitWords(ref || '', {maxWidth: inner, size: su, minSize: minSize ?? su, maxLines: 3, weight: 700, family: 'mono'});
  const top = 14; // perforated tear edge
  const yH = top + pad * 0.6;
  const yR = mh ? yH + mh.height + pad * 0.55 : top + pad * 0.7;
  const hh = yR + mr.height + pad * 0.7 + 22; // barcode strip
  return {w, h: hh, pad, header: mh, ref: mr, yH, yR, truncated: (mh && (mh.truncated || badWrap(mh))) || mr.truncated || badWrap(mr), size: mh ? Math.min(mh.size, mr.size) : mr.size};
}

/** Entry-reference slip. Local origin = top-left corner. Grips on the side edges at 45 % height. */
export function slipProp(ctx, name, M, {showText}) {
  const th = ctx.theme;
  const {w, h: hh, pad} = M;
  const parts = [h('path', {d: roundRectPath(4, 6, w, hh, 3), fill: th.shadow})];
  // perforated (zig-zag) tear edge along the top
  let zig = 'M0 6';
  for (let x = 6, up = true; x <= w + 0.01; x += 6, up = !up) zig += `L${r(Math.min(x, w))} ${up ? 0 : 6}`;
  parts.push(h('path', {d: `${zig}V${r(hh)}H0Z`, fill: '#fffef9', stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
  if (M.header) parts.push(h('rect', {x: r(pad * 0.5), y: r(M.yH - pad * 0.3), width: r(w - pad), height: r(M.header.height + pad * 0.6), rx: 3, fill: th.accent2Soft}));
  if (showText) {
    if (M.header) parts.push(textBlock(M.header, {x: pad, y: M.yH, fill: th.accent2, name: `${name}-hd`}));
    parts.push(textBlock(M.ref, {x: pad, y: M.yR, fill: INK, name: `${name}-ref`}));
  } else {
    for (const [f, y0, c] of [[M.header, M.yH, th.accent2], [M.ref, M.yR, INK]].filter(q => q[0])) {
      f.lines.forEach((ln, j) => parts.push(h('rect', {x: r(pad), y: r(y0 + j * f.lineHeight + f.size * 0.2), width: r(Math.min(w - pad * 2, ctx.measure(ln || 'xxxx', f.size, f.weight, f.family))), height: r(f.size * 0.6), rx: r(f.size * 0.3), fill: c, opacity: 0.75, 'data-bar': 1})));
    }
  }
  // barcode strip (decorative)
  const by = hh - 20;
  for (let i = 0, x = pad; x < w - pad - 2; i++) {
    const bw = 1.5 + Math.floor(ctx.rng(`${name}-bc`, i) * 3) * 1.4;
    parts.push(h('rect', {x: r(x), y: r(by), width: r(bw), height: 12, fill: INK}));
    x += bw + 2 + Math.floor(ctx.rng(`${name}-bg`, i) * 2) * 1.5;
  }
  return g({name}, parts);
}

/** Slip printer. Local origin = bottom-left (on the ledge). Key on the right. */
export function printerProp(ctx, P, {w, h: hh}) {
  const th = ctx.theme;
  const body = '#5b636b';
  const node = g({name: P},
    h('ellipse', {cx: r(w / 2), cy: 2, rx: r(w * 0.52), ry: 6, fill: th.shadow}),
    h('path', {d: roundRectPath(0, -hh, w, hh, 10), fill: body, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(6, -hh + 6, w - 12, hh * 0.34, 6), fill: shade(body, 0.18)}),
    // paper slot on the top (the slip rises out of it)
    h('rect', {x: 8, y: r(-hh - 3), width: r(w - 58), height: 7, rx: 3.5, fill: INK}),
    h('rect', {x: 14, y: r(-hh * 0.42), width: r(w * 0.36), height: 8, rx: 4, fill: shade(body, -0.35)}),
    h('circle', {cx: r(w - 44), cy: r(-hh * 0.35), r: 5, fill: '#9fd3a8', stroke: INK, 'stroke-width': 1.6}),
    g({name: `${P}-key`},
      h('rect', {x: r(w - 34), y: r(-hh - 9), width: 24, height: 12, rx: 5, fill: th.accent3, stroke: INK, 'stroke-width': 2}),
    ),
  );
  return {node, slot: {x0: 8, x1: w - 50, y: -hh}, key: {x: w - 22, y: -hh - 6}};
}

/**
 * Measure the checklist card (stage units).
 * With `status` (inspect), the inspected row shows its supplied value under its label; the new value is
 * NOT reserved in advance: at the swap the row grows upward by `st.grow` (the card top and every line above
 * the row's bottom shift up) and the new value, the Δ marker and its label appear in the opened space.
 * @param {any} ctx
 * @param {{items:{label:string,status:string}[], title:string, su:number, w:number, legend?:{received:string,pending:string}|null,
 *   numbersOnly?:boolean, status?:{index:number, before:string, after:string, label?:string, markR?:number}|null, minSize?:number}} o
 */
export function measureCard(ctx, o) {
  const su = o.su;
  const min = o.minSize ?? su;
  const pad = su * 0.7;
  const slotR = su * 0.6;
  const sw = 6;                       // colour swatch width
  const slotX = pad + sw + 6 + slotR; // slot centre x
  const textX = slotX + slotR + su * 0.5;
  const textW = o.w - textX - pad;
  let truncated = false;
  const title = o.title ? fitWords(o.title, {maxWidth: o.w - pad * 2 - 20, size: su, minSize: min, maxLines: 2, weight: 800}) : null;
  if (title && (title.truncated || badWrap(title))) truncated = true;
  let y = 18 + pad * 0.6; // below the clip
  const titleY = y;
  if (title) y += title.height + pad * 0.5;
  const ruleY = y;
  y += pad * 0.45;
  const rows = o.items.map((it, i) => {
    const fit = o.numbersOnly ? fitWords(String(i + 1), {maxWidth: textW, size: su, minSize: su, maxLines: 1, weight: 800})
      : fitWords(it.label, {maxWidth: textW, size: su, minSize: min, maxLines: 3, weight: 600});
    if (fit.truncated || badWrap(fit)) truncated = true;
    let hh = Math.max(fit.height, slotR * 2);
    let st = null;
    if (o.status && o.status.index === i) {
      const markR = Math.max(su * 0.72, o.status.markR || 0);
      const old = fitWords(o.status.before, {maxWidth: textW - 6, size: su, minSize: min, maxLines: 3, weight: 600});
      const neu = fitWords(o.status.after, {maxWidth: textW - markR * 2 - 12, size: su, minSize: min, maxLines: 3, weight: 700});
      // the changed-datum label is written on the card directly under the new value
      const lab = o.status.label ? fitWords(o.status.label, {maxWidth: textW, size: su, minSize: min, maxLines: 2, weight: 600}) : null;
      if (old.truncated || neu.truncated || badWrap(old) || badWrap(neu) || (lab && (lab.truncated || badWrap(lab)))) truncated = true;
      const g1 = su * 0.28;
      const yOld = y + fit.height + g1;
      const yb = yOld + old.height;             // bottom of the row before the swap
      const newH = Math.max(neu.height, markR * 2);
      const grow = g1 * 1.4 + newH + (lab ? g1 * 1.3 + lab.height : 0);
      // after the swap the block above yb has moved up by `grow`: the new value sits in [yb − grow, yb]
      const yNew = yb - grow + g1 * 1.4;
      const yLab = yNew + newH + g1 * 1.3;
      st = {old, neu, lab, yOld, yb, yNew, yLab, markR, grow};
      hh = Math.max(hh, yb - y);
    }
    const row = {fit, y, h: hh, slot: {x: slotX, y: y + Math.max(slotR, fit.lineHeight * 0.45 + su * 0.1)}, st};
    y += hh + su * 0.55;
    return row;
  });
  y -= su * 0.55;
  let legend = null;
  if (o.legend) {
    y += pad * 0.6;
    const a = fitWords(o.legend.received, {maxWidth: (o.w - pad * 2) - slotR * 2 - 10, size: su, minSize: min, maxLines: 2, weight: 500});
    const b = fitWords(o.legend.pending, {maxWidth: (o.w - pad * 2) - slotR * 2 - 10, size: su, minSize: min, maxLines: 2, weight: 500});
    if (a.truncated || b.truncated) truncated = true;
    const gx = pad + slotR;
    const one = gx + slotR + 8 + a.width + su * 1.1 + slotR * 2 + 8 + b.width <= o.w - pad && a.lines.length === 1 && b.lines.length === 1;
    legend = one
      ? {one, a, b, y, ya: y, yb: y, xa: gx, xb: gx + slotR + 8 + a.width + su * 1.1 + slotR, h: Math.max(a.height, slotR * 2)}
      : {one, a, b, y, ya: y, yb: y + a.height + su * 0.3, xa: gx, xb: gx, h: a.height + su * 0.3 + b.height};
    y += legend.h;
  }
  const hh = y + pad;
  const focus = rows.findIndex(rw => rw.st);
  return {w: o.w, h: hh, pad, slotR, slotX, textX, textW, sw, title, titleY, ruleY, rows, legend, truncated, su, focus,
    grow: focus >= 0 ? rows[focus].st.grow : 0,
    minText: Math.min(...rows.map(rw => rw.fit.size), ...(title ? [title.size] : []))};
}

/** Filled "received" dot (neutral ink, not a tick). */
function dotGlyph(name, cx, cy, R, opacity = 0) {
  return g({name, opacity},
    h('circle', {cx: r(cx), cy: r(cy), r: r(R * 0.72), fill: INK}),
    h('circle', {cx: r(cx - R * 0.22), cy: r(cy - R * 0.22), r: r(R * 0.18), fill: '#fff', opacity: 0.45}));
}

/** Dashed empty "pending" ring (neutral, never a cross). */
function ringGlyph(name, cx, cy, R, color, opacity = 0) {
  return h('circle', {name, cx: r(cx), cy: r(cy), r: r(R * 0.78), fill: 'none', stroke: color, 'stroke-width': r(Math.max(2.6, R * 0.2)), 'stroke-dasharray': `${r(R * 0.42)} ${r(R * 0.3)}`, opacity});
}

/**
 * Checklist card on a small stand. Local origin = top-left of the (ungrown) card; the stand is at its
 * bottom. Named nodes per row i: `${P}-dot${i}` (received), `${P}-ring${i}` (pending), `${P}-hl${i}`
 * (row highlight while it is checked). With an inspected row, `${P}-up` holds everything above that row's
 * bottom (it shifts up as the row grows) and `${P}-new` / `${P}-mk` / `${P}-mklab` sit in the opened space.
 * With labels hidden the rows keep their geometry; the item text becomes simulated lines.
 */
export function checklistCard(ctx, P, M, o) {
  const th = ctx.theme;
  const {w, h: hh, pad, slotR} = M;
  const fi = M.focus;
  const stand = [
    h('path', {d: `M${r(w * 0.3)} ${r(hh - 20)}L${r(w * 0.22)} ${r(hh + 8)}M${r(w * 0.7)} ${r(hh - 20)}L${r(w * 0.78)} ${r(hh + 8)}`, stroke: th.metalDark, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('path', {d: roundRectPath(w * 0.14, hh + 2, w * 0.72, 9, 4), fill: th.metalDark, stroke: INK, 'stroke-width': 2}),
  ];
  const paperD = gr => roundRectPath(0, -M.grow * gr, w, hh + M.grow * gr, 8);
  const paper = [
    h('path', {name: fi >= 0 ? `${P}-pshadow` : null, d: roundRectPath(5, 7, w, hh, 8), fill: th.shadow}),
    h('path', {name: fi >= 0 ? `${P}-paper` : null, d: paperD(0), fill: th.paper, stroke: INK, 'stroke-width': 2.6}),
  ];
  const show = o.showText;
  const strikes = [];
  let markAt = null;
  // an optional mark (e.g. a zero-width space) prefixed to every line of a copy drawn in a lens
  const mk = f => (o.mark ? {...f, lines: f.lines.map(l => `${o.mark}${l}`)} : f);
  const bars = (f, x, y, color, maxW) => f.lines.map((ln, j) => h('rect', {x: r(x), y: r(y + j * f.lineHeight + f.size * 0.22), width: r(Math.min(maxW, ctx.measure(ln || 'xxxx', f.size, f.weight, f.family))), height: r(f.size * 0.58), rx: r(f.size * 0.29), fill: color, 'data-bar': 1}));
  const up = [];    // shifts up when the inspected row grows
  const stay = [];  // rows below the inspected row
  const opened = []; // the new value block (appears in the opened space)
  // clip at the top of the card
  up.push(h('path', {d: roundRectPath(w / 2 - 34, -8, 68, 20, 6), fill: th.metal, stroke: INK, 'stroke-width': 2.2}));
  up.push(h('rect', {x: r(w / 2 - 18), y: -2, width: 36, height: 6, rx: 3, fill: th.metalDark}));
  if (M.title) {
    if (show) up.push(textBlock(mk(M.title), {x: pad, y: M.titleY, fill: INK, name: `${P}-title`}));
    else up.push(...bars(M.title, pad, M.titleY, th.inkSoft, w - pad * 2));
    up.push(h('line', {x1: r(pad), x2: r(w - pad), y1: r(M.ruleY), y2: r(M.ruleY), stroke: th.paperLine, 'stroke-width': 2}));
  }
  M.rows.forEach((row, i) => {
    const dst = fi >= 0 && i > fi ? stay : up;
    const c = (o.colors && o.colors[i]) || th.accent2;
    dst.push(h('rect', {name: `${P}-hl${i}`, x: r(pad * 0.5), y: r(row.y - M.su * 0.22), width: r(w - pad), height: r(row.h + M.su * 0.44), rx: 6, fill: th.accent3Soft, opacity: 0}));
    dst.push(h('rect', {x: r(pad), y: r(row.slot.y - slotR * 0.9), width: M.sw, height: r(slotR * 1.8), rx: 2, fill: c}));
    // the unchecked slot: a faint dotted outline
    dst.push(h('circle', {cx: r(row.slot.x), cy: r(row.slot.y), r: r(slotR * 0.78), fill: '#fff', stroke: th.inkFaint, 'stroke-width': 1.6, 'stroke-dasharray': '2 3'}));
    dst.push(dotGlyph(`${P}-dot${i}`, row.slot.x, row.slot.y, slotR));
    dst.push(ringGlyph(`${P}-ring${i}`, row.slot.x, row.slot.y, slotR, th.inkSoft));
    if (show) dst.push(textBlock(mk(row.fit), {x: M.textX, y: row.y, fill: INK, name: `${P}-t${i}`}));
    else dst.push(...bars(row.fit, M.textX, row.y, th.inkSoft, M.textW));
    if (row.st) {
      const st = row.st;
      if (show) up.push(g({name: `${P}-old`}, textBlock(mk(st.old), {x: M.textX, y: st.yOld, fill: th.inkSoft})));
      else up.push(g({name: `${P}-old`}, bars(st.old, M.textX, st.yOld, th.inkSoft, M.textW)));
      st.old.lines.forEach((ln, j) => {
        const lw = ctx.measure(ln || 'xxxx', st.old.size, st.old.weight, st.old.family) + 8;
        const y = st.yOld + j * st.old.lineHeight + st.old.size * 0.55;
        strikes.push({name: `${P}-strike${j}`, len: lw});
        up.push(h('line', {name: `${P}-strike${j}`, x1: r(M.textX - 4), x2: r(M.textX - 4 + lw), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': r(Math.max(2.5, st.old.size * 0.12)), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(lw)} ${r(lw + 10)}`, 'stroke-dashoffset': r(lw), opacity: 0}));
      });
      if (show) opened.push(g({name: `${P}-new`, opacity: 0}, textBlock(mk(st.neu), {x: M.textX, y: st.yNew, fill: th.accent2})));
      else opened.push(g({name: `${P}-new`, opacity: 0}, bars(st.neu, M.textX, st.yNew, th.accent2, M.textW)));
      if (o.marker) {
        const lastLine = st.neu.lines[st.neu.lines.length - 1] || '';
        const lw = ctx.measure(lastLine, st.neu.size, st.neu.weight, st.neu.family);
        const mx = Math.min(M.textX + lw + st.markR + 10, M.w - M.pad * 0.5 - st.markR);
        const my = st.yNew + (st.neu.lines.length - 1) * st.neu.lineHeight + st.neu.size * 0.52;
        markAt = {x: mx, y: my, r: st.markR};
        opened.push(changedMarker(ctx, {name: `${P}-mk`, x: mx, y: my, radius: st.markR, opacity: 0}));
        if (st.lab && show) opened.push(g({name: `${P}-mklab`, opacity: 0}, textBlock(mk(st.lab), {x: M.textX, y: st.yLab, fill: th.accent2})));
      }
    }
  });
  if (M.legend && show) {
    const L = M.legend;
    const gy = y0 => y0 + L.a.size * 0.55;
    stay.push(g({name: `${P}-legend`},
      dotGlyph(null, L.xa, gy(L.ya), slotR, 1),
      textBlock(L.a, {x: L.xa + slotR + 8, y: L.ya, fill: th.inkSoft}),
      ringGlyph(null, L.xb, gy(L.yb), slotR, th.inkSoft, 1),
      textBlock(L.b, {x: L.xb + slotR + 8, y: L.yb, fill: th.inkSoft}),
    ));
  }
  return {
    node: g({name: P}, stand, paper, fi >= 0 ? g({name: `${P}-up`}, up) : up, stay, opened),
    /** card-local position of row i's slot after a growth `gr` (0..1) of the inspected row */
    slotAt: (i, gr = 0) => ({x: M.rows[i].slot.x, y: M.rows[i].slot.y - (fi >= 0 && i <= fi ? M.grow * gr : 0)}),
    frame(s) {
      const out = {};
      M.rows.forEach((row, i) => {
        const d = clamp((s.dots && s.dots[i]) || 0);
        const q = clamp((s.rings && s.rings[i]) || 0);
        out[`${P}-dot${i}`] = {opacity: r(clamp(d * 2), 3), transform: d >= 1 || d <= 0 ? '' : scaleAbout(row.slot.x, row.slot.y, 0.4 + 0.6 * ease.outCubic(d))};
        out[`${P}-ring${i}`] = {opacity: r(clamp(q * 2), 3), transform: q >= 1 || q <= 0 ? '' : scaleAbout(row.slot.x, row.slot.y, 0.4 + 0.6 * ease.outCubic(q))};
        out[`${P}-hl${i}`] = {opacity: r(clamp((s.hl && s.hl[i]) || 0) * 0.9, 3)};
      });
      if (fi >= 0) {
        const stt = s.status || {strike: 0, old: 1, reveal: 0, grow: 0};
        const gr = clamp(stt.grow || 0);
        out[`${P}-up`] = {transform: gr > 0 ? T(0, -M.grow * gr) : ''};
        out[`${P}-paper`] = {d: paperD(gr)};
        out[`${P}-pshadow`] = {d: roundRectPath(5, 7 - M.grow * gr, w, hh + M.grow * gr, 8)};
        const n = strikes.length;
        strikes.forEach((q, j) => {
          const pp = clamp(stt.strike * n - j);
          out[q.name] = {'stroke-dashoffset': r(q.len * (1 - pp)), opacity: pp > 0 ? 1 : 0};
        });
        out[`${P}-old`] = {opacity: r(stt.old, 3)};
        out[`${P}-new`] = {opacity: r(clamp(stt.reveal), 3)};
        if (markAt) out[`${P}-mk`] = {opacity: r(clamp(stt.marker || 0), 3)};
        if (markAt && M.rows[fi].st.lab && show) out[`${P}-mklab`] = {opacity: r(clamp(stt.markLabel || 0), 3)};
      }
      return out;
    },
    get markAt() { return markAt; },
  };
}

/** Pictogram of a document tray (the registry sign above the window). */
function signArt(ctx, cx, cy) {
  const th = ctx.theme;
  return g({transform: scaleAbout(cx, cy, 0.78)},
    h('path', {d: roundRectPath(cx - 46, cy - 30, 92, 60, 10), fill: th.accent2, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${cx - 16} ${cy - 20}h24l8 8v26h-32Z`, fill: '#fff', stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: `M${cx - 30} ${cy + 6}h14l4 8h24l4 -8h14v16h-60Z`, fill: shade(th.accent2, 0.5), stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
  );
}

/* ======================================================================== */
/* Stage                                                                    */
/* ======================================================================== */

/**
 * Stage geometry for a card of size (cardW, cardH), a slip of size (slipW, slipH) and a walk of `walk`
 * units. `depth` (portrait framing) stands the person filing in the foreground: at the window they are
 * drawn at scale `fk` on a nearer floor line `fy` (below the counter's floor), and they walk in from even
 * nearer (`fy0`, `fk0`), receding towards the window. Side framing: fk = 1, fy = 0.
 */
export function stageGeometry({cardW, cardH, slipW, slipH, walk = 0, noWall = false, displayDy = 0, fan = RG.fan, depth = null, clerkK = RG.clerk.k, noSign = false, clerkLift = 0, cardGap = RG.cardGap}) {
  const printer = {x0: RG.printerX0, w: slipW + 50, h: RG.printerH};
  // clerkLift: a taller seat (static) for a tall checklist, so every row is within the pen hand's reach
  const clerk = {...RG.clerk, sy: RG.clerk.sy - clerkLift, k: clerkK, x: Math.max(RG.clerk.x, printer.x0 + printer.w + 86)};
  const card = {x0: clerk.x + cardGap, y0: RG.cardBase - cardH, w: cardW, h: cardH};
  const winX1 = card.x0 + cardW + 32;
  const fk = depth ? depth.fk : 1, fy = depth ? depth.fy : 0;
  const filerX = depth ? depth.x : RG.filerX;
  const start = depth ? {x: filerX - walk, y: depth.fy0, k: depth.fk0} : {x: filerX - walk, y: 0, k: 1};
  const back = depth ? 60 : 72;
  const xL = Math.min(start.x - back * start.k, filerX - back * fk, RG.winX0 - 40);
  const xR = winX1 + 46;
  const slotX = printer.x0 + 8 + (printer.w - 58) / 2;
  const slip = {w: slipW, h: slipH, x: slotX - slipW / 2, y0: RG.ledgeY - 4 - printer.h};
  const d = clerk.x - RG.clerk.x;
  // the window opening sits just above the clerk's head; a tall checklist card raises it
  const clerkTop = clerk.sy - 136 * clerkK;
  const winTop = Math.min(RG.winTop, card.y0 - 30, clerkTop - 44);
  const floorBottom = depth ? Math.max(fy, start.y) + 40 : 0;
  return {
    printer, clerk, card, winX0: RG.winX0, winX1, winTop, ledgeY: RG.ledgeY, xL, xR, top: winTop - (noSign ? 16 : 60), noSign, filerX, start, startX: start.x, walk, noWall,
    fk, fy, depth: Boolean(depth), floorBottom, slipDx: depth?.sx ?? 0,
    // the slip read in the foreground is drawn at readK (≤ fk) so it never hides the clerk behind
    readK: depth ? Math.min(fk, depth.rk ?? fk) : fk,
    slip,
    // depth: the shared hand-off points move a little into the window so the foreground filer's hand
    // meets them in front of the counter, clear of the filer's own face
    handoff: {x: RG.handoff.x + d * 0.5 + (depth?.hx ?? 0), y: RG.handoff.y},
    // the bundle held up for the check stays inside the window opening (its fanned sheets included)
    display: {x: RG.display.x + d * 0.8, y: Math.max(RG.display.y + displayDy, winTop + 16 + RG.bundle.h / 2 + 3 * Math.abs(fan.y))}, fan,
    lie: {x: RG.lie.x + d},
    restL: {x: RG.restL.x + d, y: RG.restL.y},
    restNib: {x: RG.restNib.x + d, y: RG.restNib.y},
  };
}

/**
 * Builds the whole registry scene in stage units.
 * @param {any} ctx
 * @param {{prefix:string, G:any, looks:any[], items:any[], card:{M:any, showText:boolean, x0?:number}, slipM:any, showText:boolean,
 *   crop?:number|null, colors:string[], place:{ox:number, oy:number, k:number}}} o
 */
export function registryStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = o.G;
  const {ox, oy, k} = o.place;
  const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
  const ly = G.ledgeY;
  const wall = th.dark ? '#d9d2c4' : '#ece6da';
  const interior = th.dark ? '#b8c4cc' : '#d6dee3';
  const woodTop = th.woodTop, wood = th.wood;
  const crop = o.crop ?? null;

  // ---- background: wall, window opening, sign
  const bg = [];
  if (!G.noWall) {
    bg.push(h('path', {d: roundRectPath(G.xL, G.top, G.xR - G.xL, -G.top, 14), fill: wall}));
    bg.push(h('rect', {x: r(G.xL), y: -24, width: r(G.xR - G.xL), height: 24, fill: shade(wall, -0.12)}));
    // depth framing: the floor in front of the counter, where the person filing stands and walks in
    if (G.depth) {
      const fl = th.dark ? '#cfc6b6' : '#e2d9c8';
      bg.push(h('path', {d: `M${r(G.xL)} 0H${r(G.xR)}V${r(G.floorBottom - 14)}Q${r(G.xR)} ${r(G.floorBottom)} ${r(G.xR - 14)} ${r(G.floorBottom)}H${r(G.xL + 14)}Q${r(G.xL)} ${r(G.floorBottom)} ${r(G.xL)} ${r(G.floorBottom - 14)}Z`, fill: fl}));
      for (let i = 1; i < 4; i++) bg.push(h('line', {x1: r(G.xL), x2: r(G.xR), y1: r(G.floorBottom * (i / 4) ** 1.4), y2: r(G.floorBottom * (i / 4) ** 1.4), stroke: shade(fl, -0.08), 'stroke-width': 2}));
    }
  }
  bg.push(h('rect', {x: G.winX0, y: G.winTop, width: G.winX1 - G.winX0, height: ly - G.winTop, fill: interior}));
  bg.push(h('rect', {x: G.winX0, y: G.winTop, width: G.winX1 - G.winX0, height: 26, fill: shade(interior, -0.1)}));
  for (let x = G.winX0 + 70; x < G.winX1 - 20; x += 120) bg.push(h('line', {x1: x, x2: x, y1: G.winTop + 26, y2: ly, stroke: shade(interior, -0.06), 'stroke-width': 3}));
  // window casing
  bg.push(h('path', {d: `M${G.winX0 - 14} ${ly}V${G.winTop - 14}H${G.winX1 + 14}V${ly}M${G.winX0} ${ly}V${G.winTop}H${G.winX1}V${ly}`, fill: 'none', stroke: INK, 'stroke-width': 2.6}));
  bg.push(h('path', {d: `M${G.winX0 - 14} ${ly}V${G.winTop - 14}H${G.winX1 + 14}V${ly}H${G.winX1}V${G.winTop}H${G.winX0}V${ly}Z`, fill: shade(wall, -0.2), 'fill-rule': 'evenodd', opacity: 0.55}));
  if (!G.noWall && !o.noSign && !G.noSign) bg.push(signArt(ctx, (G.winX0 + G.winX1) / 2, G.winTop - 44 + 0));

  // ---- counter panel under the ledge
  const cx0 = G.winX0 - 6, cx1 = G.winX1 + 6;
  const bottom = crop ?? 0;
  const counter = g({name: `${P}-counter`},
    h('rect', {x: cx0, y: ly, width: cx1 - cx0, height: bottom - ly, fill: wood, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(cx0 + 20, ly + 34, cx1 - cx0 - 40, Math.max(10, bottom - ly - (crop === null ? 70 : 40)), 8), fill: shade(wood, -0.06), stroke: shade(wood, -0.24), 'stroke-width': 2}),
    crop === null ? h('rect', {x: cx0, y: -22, width: cx1 - cx0, height: 22, fill: shade(wood, -0.3), stroke: INK, 'stroke-width': 2.2}) : null,
  );
  const ledge = g({name: `${P}-ledge`},
    h('path', {d: `M${cx0 - 20} ${ly}L${cx0 - 8} ${ly - RG.ledgeTop}H${cx1 + 8}L${cx1 + 20} ${ly}Z`, fill: shade(woodTop, 0.12), stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    h('rect', {x: cx0 - 20, y: ly, width: cx1 - cx0 + 40, height: RG.ledgeFront, rx: 3, fill: woodTop, stroke: INK, 'stroke-width': 2.4}),
  );

  // ---- clerk (front, seated behind the ledge) and the filer (side view, walking)
  const clerk = frontMediator(ctx, {name: `${P}-C`, look: o.looks[1], penSide: 'r'});
  const filer = walkerRig(ctx, {name: `${P}-F`, look: o.looks[0]});

  // ---- props
  const printer = printerProp(ctx, `${P}-pr`, {w: G.printer.w, h: G.printer.h});
  const printerNode = g({transform: T(G.printer.x0, ly - 4)}, printer.node);
  const card = checklistCard(ctx, `${P}-card`, o.card.M, {showText: o.card.showText, colors: o.colors, marker: o.card.marker});
  const cardX0 = o.card.x0 ?? G.card.x0;
  const cardNode = g({transform: T(cardX0, RG.cardBase - o.card.M.h)}, card.node);
  const recv = receivedIndices(o.items);
  const bundle = bundleProp(ctx, {name: `${P}-bd`, colors: recv.map(i => o.colors[i]), w: RG.bundle.w, h: RG.bundle.h, cover: o.cover});
  const slipNode = slipProp(ctx, `${P}-slip`, o.slipM, {showText: o.showText});
  // the slip is hidden while inside the printer body (even-odd hole in a large clip rect)
  const pb = {x: G.printer.x0 + 2, y: ly - 4 - G.printer.h - 1, w: G.printer.w - 4, h: G.printer.h + 30};
  const clipId = `${P}-slipclip`;
  // the hole is only cut while the slip is in the printer; once torn off the slip is never clipped
  const clipD = hole => `M${G.xL - 2000} ${G.top - 2000}H${G.xR + 2000}V${4000}H${G.xL - 2000}Z` + (hole ? ` M${r(pb.x)} ${r(pb.y)}V${r(pb.y + pb.h)}H${r(pb.x + pb.w)}V${r(pb.y)}Z` : '');
  const slipClip = h('defs', null, h('clipPath', {id: ctx.id(clipId)},
    h('path', {name: `${P}-slipclip-p`, d: clipD(true), 'clip-rule': 'evenodd'})));
  const skinC = o.looks[1].skin;
  const thumbB = thumbNode(`${P}-thB`, skinC);
  const thumbS = thumbNode(`${P}-thS`, skinC);

  // the seated clerk is only ever seen above the floor line behind the counter (a larger clerk's chair
  // would otherwise show below the counter panel)
  const clerkClipId = `${P}-clerkclip`;
  const clerkClip = h('defs', null, h('clipPath', {id: ctx.id(clerkClipId)},
    h('rect', {x: r(G.xL - 400), y: r(G.top - 400), width: r(G.xR - G.xL + 800), height: r((crop ?? 0) - G.top + 400)})));
  const node = g({name: P},
    bg,
    clerkClip,
    g({'clip-path': ctx.ref(clerkClipId)}, clerk.body),
    counter,
    ledge,
    cardNode,
    printerNode,
    clerk.arms,
    g({name: `${P}-bdpos`}, bundle.node),
    thumbB,
    slipClip,
    g({'clip-path': ctx.ref(clipId)}, g({name: `${P}-slippos`}, slipNode)),
    thumbS,
    filer.node,
  );

  const B = RG.bundle;
  /** bundle centre from a grip point */
  // grips follow the squash of a bundle being laid down (sy = 1 upright … lieScale lying) and its scale sc
  // (a bundle held in the foreground is drawn larger; it shrinks to 1 as it passes to the window)
  const fromGrip = (q, side, sy = 1, sc = 1) => ({x: q.x + (side === 'L' ? B.w / 2 : -B.w / 2) * sc, y: q.y - ((B.h / 2) * (1 - sy) + RG.grip * sy) * sc});
  const gripOf = (c, side, sy = 1, sc = 1) => ({x: c.x + (side === 'L' ? -B.w / 2 : B.w / 2) * sc, y: c.y + ((B.h / 2) * (1 - sy) + RG.grip * sy) * sc});
  const S = o.slipM;
  // slip grips sit on the side edges at the barcode strip, below the printed text
  const slipGrip = (tl, side, sc = 1) => ({x: tl.x + (side === 'L' ? 0 : S.w * sc), y: tl.y + (S.h - 14) * sc});
  const slipFromGrip = (q, side, sc = 1) => ({x: q.x - (side === 'L' ? 0 : S.w * sc), y: q.y - (S.h - 14) * sc});
  const slipRest = rise => ({x: G.slip.x, y: G.slip.y0 - S.h * rise});
  const cardTopY = RG.cardBase - o.card.M.h;
  const cardSlot = (i, gr = 0) => {
    const q = card.slotAt(i, gr);
    return {x: cardX0 + q.x, y: cardTopY + q.y};
  };

  /**
   * Pose the scene.
   * @param {{filer:{x:number, walk?:number, moving?:number, near?:any, lean?:number, mouth?:number, tilt?:number},
   *   clerk:{left?:any, nib?:any, mouth?:number, tilt?:number, look?:number},
   *   bundle:{holder:'filer'|'clerk'|'ledge', fan?:number[], lie?:number, center?:any, thumb?:number},
   *   slip:{holder:'printer'|'clerk'|'filer', rise?:number, thumb?:number},
   *   card?:any, press?:number}} s
   */
  function pose(s) {
    const nodes = {};
    const pf = filer.frame({x: s.filer.x, y: s.filer.y ?? G.fy, k: s.filer.k ?? G.fk, walk: s.filer.walk ?? 0, moving: s.filer.moving ?? 0, near: s.filer.near ?? null, lean: s.filer.lean ?? 0, mouth: s.filer.mouth ?? 0, headTilt: s.filer.tilt ?? 0});
    Object.assign(nodes, pf.nodes);
    const C = G.clerk;
    // the clerk may lean towards the card (a small shift of the whole seated figure)
    const shift = s.clerk.shift || {x: 0, y: 0};
    const pc = clerk.frame({x: C.x + shift.x, y: C.sy + shift.y, scale: C.k, left: s.clerk.left ?? G.restL, right: {x: 0, y: 0}, penTip: s.clerk.nib ?? G.restNib, look: s.clerk.look ?? 0, tilt: s.clerk.tilt ?? 0, mouth: s.clerk.mouth ?? 0});
    Object.assign(nodes, pc.nodes);
    // bundle: placed from the holder's SOLVED hand
    const bs = s.bundle;
    let bc;
    const lie = clamp(bs.lie ?? 0);
    const sy = 1 - (1 - RG.lieScale) * lie;
    const sB = bs.scale ?? 1;
    if (bs.holder === 'filer') bc = fromGrip(pf.hands.near, 'L', sy, sB);
    else if (bs.holder === 'clerk') bc = fromGrip(pc.hands.l, 'R', sy, sB);
    else bc = bs.center;
    // lying: squashed about the bottom edge of the front sheet
    nodes[`${P}-bdpos`] = {transform: `${T(bc.x, bc.y + (B.h / 2) * (1 - sy) * sB)}${sB !== 1 || sy !== 1 ? ` scale(${r(sB, 4)} ${r(sB * sy, 4)})` : ''}`};
    // fan: item sheet j steps out j (+1 behind a cover sheet) stair offsets
    const fan = bs.fan || [];
    const c0 = bundle.cover ? 1 : 0;
    for (let m = 0; m < bundle.n; m++) {
      const j = m - c0;
      const f = j >= 0 ? clamp(fan[j] || 0) * m : 0;
      nodes[`${P}-bd-s${m}`] = {transform: f ? T(G.fan.x * f, G.fan.y * f) : ''};
      if (m < bundle.n - 1) nodes[`${P}-bd-sh${m}`] = {opacity: r(clamp((fan[m + 1 - c0] || 0) * 4), 3)};
    }
    const gB = bs.holder === 'clerk' ? gripOf(bc, 'R', sy, sB) : null;
    nodes[`${P}-thB`] = {opacity: bs.holder === 'clerk' && lie < 0.5 ? r(clamp(bs.thumb ?? 1), 3) : 0, transform: gB ? T(gB.x - 4, gB.y - 6, -20) : ''};
    // slip
    const ss = s.slip;
    const sS = ss.scale ?? 1;
    let tl;
    if (ss.holder === 'clerk') tl = slipFromGrip(pc.hands.l, 'R', sS);
    else if (ss.holder === 'filer') tl = slipFromGrip(pf.hands.near, 'L', sS);
    else tl = slipRest(clamp(ss.rise ?? 0));
    nodes[`${P}-slippos`] = {transform: `${T(tl.x, tl.y)}${sS !== 1 ? ` scale(${r(sS, 4)})` : ''}`, opacity: ss.holder === 'printer' && !(ss.rise > 0) ? 0 : 1};
    nodes[`${P}-slipclip-p`] = {d: clipD(ss.holder === 'printer')};
    const gS = ss.holder === 'clerk' ? slipGrip(tl, 'R', sS) : null;
    nodes[`${P}-thS`] = {opacity: ss.holder === 'clerk' ? r(clamp(ss.thumb ?? 1), 3) : 0, transform: gS ? T(gS.x - 4, gS.y - 6, -20) : ''};
    Object.assign(nodes, card.frame(s.card || {}));
    nodes[`${P}-pr-key`] = {transform: s.press ? T(0, r(5 * clamp(s.press))) : ''};

    const D = q => {
      const d = toD(q);
      return {x: r(d.x), y: r(d.y)};
    };
    return {
      nodes, pf, pc, bc, tl, lie,
      semantic: {
        filerHand: D(pf.hands.near),
        clerkL: D(pc.hands.l),
        clerkR: D(pc.hands.r),
        pen: D(pc.pen),
        bundleL: D(gripOf(bc, 'L', sy, sB)),
        bundleR: D(gripOf(bc, 'R', sy, sB)),
        bundleC: D(bc),
        slipL: D(slipGrip(tl, 'L', sS)),
        slipR: D(slipGrip(tl, 'R', sS)),
        slipC: D({x: tl.x + (S.w / 2) * sS, y: tl.y + (S.h / 2) * sS}),
        filerHead: D(pf.head),
        clerkHead: D(pc.head),
        filerFeet: D(pf.feet.N),
        allReached: pf.reached && pc.reached,
      },
    };
  }

  const clerkHead = {x: G.clerk.x, y: G.clerk.sy - 92 * G.clerk.k};
  const clerkHeadR = 44 * G.clerk.k;
  return {
    node, pose, G, toD, k, bundleN: bundle.n, bundleCover: bundle.cover, recv, cardX0, cardTopY, card,
    gripOf, fromGrip, slipGrip, slipFromGrip, slipRest, cardSlot,
    cardBox: {x: cardX0, y: RG.cardBase - o.card.M.h, w: o.card.M.w, h: o.card.M.h},
    printerBox: {x: G.printer.x0, y: ly - 4 - G.printer.h, w: G.printer.w, h: G.printer.h},
    penOffset: clerk.penOffset(G.clerk.k),
    clerkHead, clerkHeadR,
    /** the clerk's mouth (front view) and a speech-tail tip beside it, clear of the face */
    clerkMouth: {x: G.clerk.x, y: clerkHead.y + 22 * G.clerk.k},
    filerHeadAt: (x, y = G.fy, fk = G.fk) => ({x: x + 5 * fk, y: y - 366 * fk}),
    filerMouthAt: (x, y = G.fy, fk = G.fk) => ({x: x + 35 * fk, y: y - 346 * fk}),
    filerHeadR: 36 * G.fk,
    /** reach (stage units) of the clerk's arm */
    clerkReach: 208 * G.clerk.k,
    looks: o.looks,
  };
}

/**
 * Clerk's lean towards the checklist while checking (stage units): a small sideways lean of the seated
 * figure; it never rises out of the chair (reach is solved by the card's size and place instead).
 */
export const CLERK_LEAN = {x: 16, y: 0};

/** Stage-unit shoulder positions (for reach planning); `shift` = the clerk's lean. */
export function shoulders(G, shift = {x: 0, y: 0}) {
  return {
    clerkL: {x: G.clerk.x + shift.x - 60 * G.clerk.k, y: G.clerk.sy + shift.y + 14 * G.clerk.k},
    clerkR: {x: G.clerk.x + shift.x + 60 * G.clerk.k, y: G.clerk.sy + shift.y + 14 * G.clerk.k},
    filerAt: (x, y = G.fy, fk = G.fk) => ({x: x + 12 * fk, y: y - 302 * fk}),
  };
}

/**
 * Glyph legend plate (design units): the filled dot = received, the dashed
 * empty ring = pending as supplied. Glyphs are shapes; the words are
 * built-in captions. Returns {node, box, size}.
 */
export function legendPlate(ctx, {name, x, y, S, received, pending, maxW, anchor = 'start'}) {
  const th = ctx.theme;
  const R = S * 0.62;
  const a = fitWords(received, {maxWidth: maxW - R * 2 - 30, size: S, minSize: S, maxLines: 2, weight: 600});
  const b = fitWords(pending, {maxWidth: maxW - R * 2 - 30, size: S, minSize: S, maxLines: 2, weight: 600});
  const padX = S * 0.6, padY = S * 0.42, gap = S * 1.1;
  const one = padX * 2 + (R * 2 + 8 + a.width) + gap + (R * 2 + 8 + b.width) <= maxW && a.lines.length === 1 && b.lines.length === 1;
  const w = one ? padX * 2 + (R * 2 + 8 + a.width) + gap + (R * 2 + 8 + b.width) : padX * 2 + R * 2 + 8 + Math.max(a.width, b.width);
  const hh = one ? padY * 2 + Math.max(a.height, R * 2) : padY * 2 + a.height + S * 0.35 + b.height;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const ax = x0 + padX + R, ay = y + padY;
  const bx = one ? ax + R + 8 + a.width + gap + R : ax;
  const by = one ? ay : ay + a.height + S * 0.35;
  const gy = yy => yy + a.size * 0.55;
  const node = g({name},
    h('path', {d: roundRectPath(x0, y, w, hh, Math.min(hh / 2, S * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2}),
    dotGlyph(null, ax, gy(ay), R, 1),
    textBlock(a, {x: ax + R + 8, y: ay, fill: th.ink}),
    ringGlyph(null, bx, gy(by), R, th.inkSoft, 1),
    textBlock(b, {x: bx + R + 8, y: by, fill: th.ink}),
  );
  return {node, box: {x: x0, y, w, h: hh}, size: Math.min(a.size, b.size), truncated: a.truncated || b.truncated || badWrap(a) || badWrap(b)};
}

/** Neutral key chip ("as supplied · no conclusion drawn"). */
export function keyChip(ctx, text, o) {
  return wchip(ctx, text, {weight: 600, fill: ctx.theme.card, stroke: ctx.theme.inkSoft, color: ctx.theme.ink, ...o});
}

/** Mouth flap (0..~0.8) that honours reduced motion. */
export function flap(timeMs, reduced, phase = 0) {
  return reduced ? 0.55 : 0.25 + 0.55 * Math.abs(Math.sin(timeMs * 0.0145 + phase));
}

/** Resolve the two looks (seeded; appearance overrides win). */
export function looksOf(ctx, p) {
  return [actorLook(ctx, p.actors[0], 0), actorLook(ctx, p.actors[1], 1)];
}

/** Does segment p→q cross box b? (sampled) */
export function segHits(p, q, b) {
  const n = 24;
  for (let i = 1; i < n; i++) {
    const x = p.x + ((q.x - p.x) * i) / n, y = p.y + ((q.y - p.y) * i) / n;
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
  }
  return false;
}

/** Best candidate position for a w×h box inside bounds and clear of obstacles (lowest score wins). */
export function freeSpot(cands, w, hh, obstacles, bounds, pad = 10, score) {
  let best = null, bestS = Infinity;
  for (const c of cands) {
    const b = {x: c.x, y: c.y, w, h: hh};
    if (b.x < bounds.x || b.y < bounds.y || b.x + w > bounds.x + bounds.w || b.y + hh > bounds.y + bounds.h) continue;
    if (obstacles.some(q => overlaps(b, q, pad))) continue;
    const sc = score ? score(b) : 0;
    if (sc < bestS) { best = c; bestS = sc; }
    if (!score) break;
  }
  return best;
}

/** Candidate grid over a box. */
export function gridCands(bounds, step = 12) {
  const out = [];
  for (let y = bounds.y; y < bounds.y + bounds.h; y += step) for (let x = bounds.x; x < bounds.x + bounds.w; x += step) out.push({x, y});
  return out;
}

/** Leader start on a chip box nearest a target (same rule as noteCallout). */
export function leaderFrom(b, tg) {
  const from = {x: clamp(tg.x, b.x + 12, b.x + b.w - 12), y: tg.y > b.y + b.h ? b.y + b.h : tg.y < b.y ? b.y : b.y + b.h / 2};
  if (from.y === b.y + b.h / 2) from.x = tg.x > b.x + b.w / 2 ? b.x + b.w : b.x;
  return from;
}


/* ======================================================================== */
/* Shared intake choreography (contrast / inspect)                           */
/* ======================================================================== */

/** World targets used by the intake tracks (stage units). Grip helpers take the held prop's scale. */
export function intakeTargets(st, G, SM) {
  const B = RG.bundle;
  const F = (lx, ly) => ({x: G.filerX + lx * G.fk, y: G.fy + ly * G.fk});
  const lieC = {x: G.lie.x, y: G.ledgeY - 4 - B.h / 2};
  const slipTop = st.slipRest(1);
  // (depth: the slip is handed over a little further into the window, clear of the foreground filer's face)
  const slipC = {x: G.handoff.x - 34 + (G.slipDx || 0), y: -368};
  const slipHandTL = sc => ({x: slipC.x - (SM.w / 2) * sc, y: slipC.y - (SM.h / 2) * sc});
  const tearTL = {x: slipTop.x - 4, y: slipTop.y - 8};
  // in depth framing the filer reads the slip at chest height (a large foreground slip held higher
  // would cover the clerk behind)
  let readL = G.depth ? F(RG.read.x, RG.read.y + 50) : F(RG.read.x, RG.read.y);
  // depth: the slip's top edge stays below the clerk's chin
  if (G.depth) readL = {x: readL.x, y: Math.max(readL.y, st.clerkHead.y + st.clerkHeadR + 16 + (SM.h - 14) * G.readK)};
  return {
    F,
    carryL: F(RG.carry.x, RG.carry.y),
    restN: F(22, -158),
    handoffGripL: sc => st.gripOf(G.handoff, 'L', 1, sc),
    handoffGripR: sc => st.gripOf(G.handoff, 'R', 1, sc),
    displayGripR: st.gripOf(G.display, 'R'),
    lieC, lieGripR: st.gripOf(lieC, 'R', RG.lieScale),
    keyPt: {x: G.printer.x0 + G.printer.w - 22, y: G.ledgeY - 4 - G.printer.h - 6},
    slipTop, slipGripR0: st.slipGrip(slipTop, 'R'),
    slipHandTL, slipHandL: sc => st.slipGrip(slipHandTL(sc), 'L', sc), slipHandR: sc => st.slipGrip(slipHandTL(sc), 'R', sc),
    tearTL, tearR: st.slipGrip(tearTL, 'R'),
    readL, readTL: st.slipFromGrip(readL, 'L', G.readK),
  };
}

/** True when every hand target of the intake is within reach (the clerk possibly leaning by `lean`). */
export function intakeReach(G, TR, lean) {
  const sh = shoulders(G), shL = shoulders(G, lean);
  const reachC = 208 * G.clerk.k * 0.97, reachF = 165 * G.fk * 0.97;
  const fs = sh.filerAt(G.filerX);
  const okF = [TR.handoffGripL(G.fk), TR.handoffGripL(1), TR.slipHandL(1), TR.readL, TR.carryL].every(q => Math.hypot(q.x - fs.x, q.y - fs.y) <= reachF);
  const okC = [TR.handoffGripR(G.fk), TR.handoffGripR(1), TR.displayGripR, TR.lieGripR, TR.keyPt, TR.slipGripR0, TR.tearR, TR.slipHandR(1), G.restL]
    .every(q => Math.hypot(q.x - sh.clerkL.x, q.y - sh.clerkL.y) <= reachC)
    && Math.hypot(TR.displayGripR.x - shL.clerkL.x, TR.displayGripR.y - shL.clerkL.y) <= reachC;
  return okF && okC;
}

/** Smallest sideways clerk lean with which every card slot (or `only` rows) is reachable by the pen (or null). */
export function leanFor(G, M, cardX0, only = null, grow = 0) {
  const reachC = 208 * G.clerk.k * 0.97;
  const penOff = {x: 0.53 * 33.12 * G.clerk.k, y: -0.848 * 33.12 * G.clerk.k};
  const cardTop = RG.cardBase - M.h;
  for (const lx of [0, 8, 16]) {
    const cand = {x: lx, y: 0};
    const s2 = shoulders(G, cand);
    const ok = M.rows.map((row, i) => [row, i]).filter(([, i]) => only === null || only.includes(i)).every(([row, i]) => {
      const sy = cardTop + row.slot.y - (M.focus >= 0 && i <= M.focus ? M.grow * grow : 0);
      return Math.hypot(cardX0 + row.slot.x + penOff.x - s2.clerkR.x, sy + penOff.y - s2.clerkR.y) <= reachC;
    });
    if (ok) return cand;
  }
  return null;
}

/**
 * Pose input of the intake at action time `a`. Windows W: raise, reachC, hold, take, fDrop, penTo, check,
 * penBack, lay, toKey, press, rise, toSlip, tear, carry, fReach, both, fRead, cBack (+ walk, move, stop with
 * o.walk). Rows are checked in order inside W.check; a row supplied as pending gets a dashed ring and no
 * sheet steps out for it. o.stop = 'hand' (nothing checked) | 'check' (no slip printed) | null.
 * The bundle is drawn at the filer's scale while carried and shrinks to the window's scale while both
 * hands are on it (W.hold); the slip is handed over at the window's scale and grows to the filer's while
 * it is brought in to be read (W.fRead).
 * @returns {{input:any, sem:any}}
 */
export function intakeFrame(st, TR, W, a, items, lean, o = {}) {
  const G = st.G;
  const x = w => seg01(a, w[0], w[1]);
  const stop = o.stop || null;
  // the filer's position, floor and scale (walking in, or already at the window)
  const posAt = uu => {
    if (!o.walk) return {x: G.filerX, y: G.fy, k: G.fk, q: 1};
    const q = ease.inOutSine(seg01(uu, W.walk[0], W.walk[1]));
    return {x: G.start.x + (G.filerX - G.start.x) * q, y: G.start.y + (G.fy - G.start.y) * q, k: G.start.k + (G.fk - G.start.k) * q, q};
  };
  const fp = posAt(a);
  const carryAt = uu => { const pp = posAt(uu); return {x: pp.x + RG.carry.x * pp.k, y: pp.y + RG.carry.y * pp.k}; };
  const moving = o.walk ? seg01(a, W.move[0], W.move[1]) * (1 - seg01(a, W.stop[0], W.stop[1])) : 0;
  const walkDist = o.walk ? Math.hypot(fp.x - G.start.x, (fp.y - G.start.y) * 1.6) / Math.max(0.5, fp.k) : 0;
  const hq = uu => ease.inOutSine(seg01(uu, W.hold[0], W.hold[1]));
  const fTrack = [
    {a: W.raise[0], b: W.raise[1], at: uu => {
      const q = ease.inOutSine(seg01(uu, W.raise[0], W.raise[1]));
      const c0 = carryAt(uu), t0 = TR.handoffGripL(G.fk);
      return {x: c0.x + (t0.x - c0.x) * q, y: c0.y + (t0.y - c0.y) * q};
    }},
    {a: W.hold[0], b: W.hold[1], at: uu => TR.handoffGripL(G.fk + (1 - G.fk) * hq(uu))},
    {a: W.fDrop[0], b: W.fDrop[1], to: TR.restN, ease: ease.inOutSine},
  ];
  if (!stop) {
    fTrack.push({a: W.fReach[0], b: W.fReach[1], to: TR.slipHandL(1), ease: ease.inOutSine});
    fTrack.push({a: W.both[0], b: W.both[1], to: TR.slipHandL(1)});
    fTrack.push({a: W.fRead[0], b: W.fRead[1], to: TR.readL, ease: ease.outCubic});
  }
  const fNear = a < W.raise[0] ? carryAt(a) : runTrack(a, carryAt(a), fTrack);
  const cTrack = [
    {a: W.reachC[0], b: W.reachC[1], to: TR.handoffGripR(G.fk), ease: ease.inOutSine},
    {a: W.hold[0], b: W.hold[1], at: uu => TR.handoffGripR(G.fk + (1 - G.fk) * hq(uu))},
    {a: W.take[0], b: W.take[1], to: TR.displayGripR, ease: ease.inOutSine},
  ];
  if (stop !== 'hand') cTrack.push({a: W.lay[0], b: W.lay[1], to: TR.lieGripR, ease: ease.inOutSine});
  if (!stop) {
    cTrack.push({a: W.toKey[0], b: W.toKey[1], to: {x: TR.keyPt.x + 6, y: TR.keyPt.y - 10}, ease: ease.inOutSine});
    cTrack.push({a: W.press[0], b: W.press[1], at: uu => ({x: TR.keyPt.x + 6, y: TR.keyPt.y - 10 + 12 * Math.sin(Math.PI * seg01(uu, W.press[0], W.press[1]))})});
    cTrack.push({a: W.toSlip[0], b: W.toSlip[1], to: TR.slipGripR0, ease: ease.inOutSine});
    cTrack.push({a: W.tear[0], b: W.tear[1], to: TR.tearR, ease: ease.outCubic});
    cTrack.push({a: W.carry[0], b: W.carry[1], to: TR.slipHandR(1), ease: ease.inOutSine});
    cTrack.push({a: W.both[0], b: W.both[1], to: TR.slipHandR(1)});
    cTrack.push({a: W.cBack[0], b: W.cBack[1], to: G.restL, ease: ease.inOutSine});
  } else if (stop === 'check') {
    cTrack.push({a: W.lay[1], b: W.lay[1] + 0.04, to: G.restL, ease: ease.inOutSine});
  }
  const cLeft = runTrack(a, G.restL, cTrack);
  const n = items.length;
  const d = (W.check[1] - W.check[0]) / n;
  const fan = new Array(st.recv.length).fill(0);
  const dots = new Array(n).fill(0), rings = new Array(n).fill(0), hl = new Array(n).fill(0);
  const penSegs = [];
  const hover = i => { const q = st.cardSlot(i); return {x: q.x - 4, y: q.y + 18}; };
  let tapping = null;
  if (stop !== 'hand') {
    items.forEach((it, i) => {
      const at = f => W.check[0] + d * (i + f);
      const j = st.recv.indexOf(i);
      // either the whole bundle fans open as it is taken (o.fanAll window) or each sheet steps out on its row
      if (it.status === 'received' && j >= 0) fan[j] = ease.inOutSine(o.fanAll ? seg01(a, o.fanAll[0], o.fanAll[1]) : seg01(a, at(0), at(0.4)));
      const tap = ease.outCubic(seg01(a, at(0.55), at(0.8)));
      if (it.status === 'received') dots[i] = tap; else rings[i] = tap;
      hl[i] = seg01(a, at(0), at(0.12)) * (1 - seg01(a, at(0.88), at(1)));
      const slot = st.cardSlot(i);
      penSegs.push({a: i === 0 ? W.penTo[0] : at(0.2), b: at(0.5), to: hover(i), ease: ease.inOutSine});
      penSegs.push({a: at(0.5), b: at(0.6), to: slot, ease: ease.inOutSine});
      penSegs.push({a: at(0.6), b: at(0.8), to: slot});
      penSegs.push({a: at(0.8), b: at(0.92), to: hover(i), ease: ease.inOutSine});
      if (a >= at(0.6) && a <= at(0.8)) tapping = slot;
    });
    penSegs.push({a: W.penBack[0], b: W.penBack[1], to: G.restNib, ease: ease.inOutSine});
  }
  const square = stop === 'hand' ? 0 : 1 - ease.inOutSine(x([W.lay[0], W.lay[0] + 0.02]));
  for (let j = 0; j < fan.length; j++) fan[j] *= square;
  const nib = runTrack(a, G.restNib, penSegs);
  const lie = stop === 'hand' ? 0 : ease.inOutSine(x(W.lay));
  const inHold = a >= W.hold[0] && a < W.hold[1];
  const sB = a < W.hold[0] ? fp.k : G.fk + (1 - G.fk) * hq(a);
  let bundle;
  if (a < W.hold[1]) bundle = {holder: 'filer', scale: sB};
  else if (stop === 'hand' || a < W.lay[1]) bundle = {holder: 'clerk', fan, lie};
  else bundle = {holder: 'ledge', center: TR.lieC, lie: 1, fan};
  let slip;
  if (stop || a < W.tear[0]) slip = {holder: 'printer', rise: stop ? 0 : ease.inOutSine(x(W.rise))};
  else if (a < W.both[1]) slip = {holder: 'clerk', scale: 1};
  // once the filer holds it alone the slip comes towards them: it grows to the filer's scale
  // (it grows only once it has come down, away from the clerk's face)
  else slip = {holder: 'filer', scale: 1 + (G.readK - 1) * ease.inOutSine(x([W.fRead[0] + (W.fRead[1] - W.fRead[0]) * 0.35, W.fRead[1]]))};
  const inSlipBoth = !stop && a >= W.both[0] && a < W.both[1];
  const checking = stop !== 'hand' && a >= W.check[0] && a < W.check[1];
  const leanC = stop === 'hand' ? 0 : ease.inOutSine(seg01(a, W.check[0] - 0.025, W.check[0] + 0.01)) * (1 - ease.inOutSine(seg01(a, W.penBack[0] - 0.005, W.penBack[1])));
  const look = checking ? (tapping ? 1 : -0.6) : a < W.take[1] && a > W.reachC[0] ? -1 : 0;
  return {
    input: {
      filer: {x: fp.x, y: fp.y, k: fp.k, walk: walkDist, moving, near: fNear, tilt: !stop && a > W.fRead[0] ? 6 * ease.inOutSine(x(W.fRead)) : 0, mouth: o.filerMouth ?? 0, lean: o.filerLean ?? 0},
      clerk: {left: cLeft, nib, look, tilt: 3 * leanC, shift: {x: lean.x * leanC, y: 0}, mouth: o.clerkMouth ?? 0},
      bundle, slip, card: {dots, rings, hl}, press: stop ? 0 : Math.sin(Math.PI * x(W.press)),
    },
    sem: {inHold, inSlipBoth, tapping, fan, dots, rings, bundleHolder: bundle.holder, slipHolder: slip.holder, slipRise: slip.holder === 'printer' ? slip.rise : 1,
      filer: fp, moving, walking: moving > 0.05, bundleScale: bundle.scale ?? 1, slipScale: slip.scale ?? 1},
  };
}

const seg01 = (u, a, b) => (b <= a ? (u >= b ? 1 : 0) : clamp((u - a) / (b - a)));
