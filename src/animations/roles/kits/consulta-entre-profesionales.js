/**
 * Motif kit — "Consulta entre profesionales" (roles-02, LAW-0165..0168).
 *
 * Two fictional professionals compare notes on ONE shared document. The
 * document stands upright on a wooden reading stand in the middle of a table
 * (side view, slightly from above); professional A sits at the left end facing
 * right, professional B at the right end facing left (personRig, seated). Each
 * has a small pad of margin flags (sticky page flags in their own colour) on
 * the table. A flag is picked from the pad by the NEAR hand, carried to the
 * document and pressed onto the margin at a passage row: A on the left
 * margin, B on the right margin.
 *
 * Comparison marks (neutral glyphs only, all "as supplied"):
 *  - same point noted: both professionals flagged the same passage; their
 *    flags sit level on the two margins and a highlighter band grows from
 *    each flag toward the middle until the halves meet (flags aligned);
 *  - open question: a single flag at a passage the other professional did
 *    not flag; it carries an open-ring glyph and a dashed empty flag outline
 *    marks the other margin at that row (nothing supplied to match).
 * No tick, cross, score or winner; nobody is shown to be right.
 *
 * Layers (back → front): floor shadow · tabletop · stand shadow · document
 * paper · band halves · document text · empty slot · stand ledge · pads ·
 * flags · person A · person B (near arms reach over the document) · table
 * front and legs. Bubbles and labels are drawn by the entries.
 *
 * Attachment rules (asserted by the entry tests through semantics):
 *  - while a hand carries a flag, the flag's grip point IS the SOLVED hand
 *    position returned by the rig (flag = hand), from pick-up to press;
 *  - before pick-up a flag lies on its owner's pad, after the press it stays
 *    exactly on its margin target; it never changes holder or teleports;
 *  - every IK target is within reach (`allReached`).
 *
 * The kit owns geometry, the pose solver and the placement script; entries
 * own timing windows, labels, layout and semantics.
 * @module animations/roles/kits/consulta-entre-profesionales
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {mix, roundRectPath} from '../../../core/geometry.js';
import {textBlock} from '../../../primitives/annotate.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {shade} from '../../../primitives/paper.js';
import {str, int, list, obj, oneOf, party, RELATION_KINDS} from '../../../schemas/fields.js';
import {fitWords, wchip, noteCallout, overlaps} from './mediation-labels.js';

export {fitWords, wchip, overlaps};

const INK = '#1f2328';

/* ------------------------------------------------------------------ fields */

/** Actor ids. */
export const CONSULT_ACTORS = ['a', 'b'];

const passage = obj('A passage of the shared document', {
  ref: str('Short reference printed in the margin chip (e.g. "Cl. 2")', 16),
  text: str('Passage heading printed on the document', 72),
}, ['ref', 'text']);

/** A relationship between the two professionals (story / contrast / inspect). */
export const actorRelationship = obj('A relationship between the two professionals', {
  from: oneOf('Source professional', CONSULT_ACTORS),
  to: oneOf('Target professional', CONSULT_ACTORS),
  kind: oneOf('relation | communication | sequence | causal. A sequence link sets who lays the first flag (its "from"); other kinds are descriptive.', RELATION_KINDS),
}, ['from', 'to', 'kind']);

/** Category fields (roles) specialised for this motif. */
export const consultFields = {
  actors: list('Professional A (left end of the table) and professional B (right end), in this order (fictional people)', party, 2, 2),
  roles: obj('Descriptive role captions (never a finding about who is right)', {
    a: str('Role caption for professional A', 48),
    b: str('Role caption for professional B', 48),
  }),
  relationships: list('Explicit relationships between the two professionals. A sequence link sets who lays the first flag', actorRelationship, 1, 4),
  props: obj('The ONE shared document and the professionals’ supplied notes', {
    document: obj('The shared document both professionals annotate', {
      reference: str('Reference printed at the top of the document (fictional)', 24),
      title: str('Title printed on the document', 90),
      passages: list('Passages printed on the document (3–4); flags point at them by index', passage, 3, 4),
    }, ['reference', 'title', 'passages']),
    same: obj('A passage BOTH professionals flagged; their notes coincide on this point (as supplied, no conclusion)', {
      passage: int('Zero-based index of the passage both flagged', 0, 3),
      noteA: str('Professional A’s note on it (supplied text)', 84),
      noteB: str('Professional B’s note on it (supplied text)', 84),
    }, ['passage', 'noteA', 'noteB']),
    open: obj('A question ONE professional flagged that stays open (as supplied, no conclusion)', {
      passage: int('Zero-based index of the passage (a different one from the shared point)', 0, 3),
      by: oneOf('Who flagged the open question', CONSULT_ACTORS),
      note: str('The open question (supplied text)', 84),
    }, ['passage', 'by', 'note']),
  }, ['document', 'same', 'open']),
};

/** Default category values (fictional, illustrative). */
export const CONSULT_DEFAULTS = {
  actors: [
    {name: 'Leila Haddad', role: 'Lawyer'},
    {name: 'Marco Bellini', role: 'Colleague'},
  ],
  roles: {a: 'Lawyer who asks', b: 'Colleague consulted'},
  relationships: [
    {from: 'a', to: 'b', kind: 'communication'},
    {from: 'a', to: 'b', kind: 'sequence'},
  ],
  props: {
    document: {
      reference: 'DRAFT 07',
      title: 'Supply agreement (fictional draft)',
      passages: [
        {ref: 'Cl. 1', text: 'Parties and purpose'},
        {ref: 'Cl. 2', text: 'Delivery window after each order'},
        {ref: 'Cl. 3', text: 'Storage if collection is late'},
        {ref: 'Cl. 4', text: 'Notices between the parties'},
      ],
    },
    same: {passage: 1, noteA: 'Window counts from the order date', noteB: 'Same reading: from the order date'},
    open: {passage: 2, by: 'b', note: 'Who pays for storage? Left open'},
  },
};

/** Spanish counterparts for presets. */
export const CONSULT_DEFAULTS_ES = {
  actors: [
    {name: 'Leila Haddad', role: 'Abogada'},
    {name: 'Marco Bellini', role: 'Colega'},
  ],
  roles: {a: 'Abogada que consulta', b: 'Colega consultado'},
  relationships: CONSULT_DEFAULTS.relationships,
  props: {
    document: {
      reference: 'BORRADOR 07',
      title: 'Contrato de suministro (borrador ficticio)',
      passages: [
        {ref: 'Cl. 1', text: 'Partes y objeto'},
        {ref: 'Cl. 2', text: 'Plazo de entrega tras cada pedido'},
        {ref: 'Cl. 3', text: 'Almacenaje si la recogida se retrasa'},
        {ref: 'Cl. 4', text: 'Notificaciones entre las partes'},
      ],
    },
    same: {passage: 1, noteA: 'El plazo cuenta desde el pedido', noteB: 'Misma lectura: desde el pedido'},
    open: {passage: 2, by: 'b', note: '¿Quién paga el almacenaje? Queda abierta'},
  },
};

/** Built-in strings shared by the four entries. */
export const KIT_STRINGS = {
  en: {asSupplied: 'as supplied', noConclusion: 'As supplied · no conclusion drawn', samePoint: 'Same point noted', openQuestion: 'Open question'},
  es: {asSupplied: 'según lo aportado', noConclusion: 'Según lo aportado · sin conclusión', samePoint: 'Mismo punto anotado', openQuestion: 'Cuestión abierta'},
};

/**
 * Resolved points: indices clamped to the passages; the open question always
 * sits on a different passage from the shared point.
 * @param {any} props
 */
export function resolvePoints(props) {
  const n = props.document.passages.length;
  const same = clamp(Math.round(props.same.passage), 0, n - 1);
  let open = clamp(Math.round(props.open.passage), 0, n - 1);
  if (open === same) open = same + 1 < n ? same + 1 : same - 1;
  return {n, same, open, by: props.open.by};
}

/** The `from` of the first sequence link between the two professionals goes first (default A). */
export function firstActor(relationships) {
  const seq = (relationships || []).find(x => x.kind === 'sequence' && x.from !== x.to);
  return seq && seq.from === 'b' ? ['b', 'a'] : ['a', 'b'];
}

/** Role caption of an actor. */
export function roleOf(p, id) {
  const i = id === 'a' ? 0 : 1;
  return (p.roles && p.roles[id]) || (p.actors[i] && p.actors[i].role) || '';
}

/** Passage index named by a supplied value (ref, then text, then first number = 1-based), else fallback. */
export function passageIndex(passages, value, fallback) {
  const v = String(value ?? '').trim().toLowerCase();
  if (v) {
    let i = passages.findIndex(q => q.ref.trim().toLowerCase() === v);
    if (i < 0) i = passages.findIndex(q => q.ref.trim().toLowerCase().includes(v) || v.includes(q.ref.trim().toLowerCase()));
    if (i < 0) i = passages.findIndex(q => q.text.toLowerCase().includes(v));
    if (i < 0) {
      const m = v.match(/\d+/);
      if (m) i = clamp(Number(m[0]) - 1, 0, passages.length - 1);
    }
    if (i >= 0) return i;
  }
  return fallback;
}

/* ----------------------------------------------------------------- scaling */

/**
 * Design units for a font size given in px at 1080p (the harness measures
 * text at 1080 px on the short side), so key text keeps its px size in every
 * ratio.
 */
export function pxUnit(ctx) {
  const v = ctx.view, c = v.content, D = ctx.design;
  const sc = Math.min(c.w / D.w, c.h / D.h);
  const k = 1080 / Math.min(v.width, v.height);
  return px => px / (sc * k);
}

/* ------------------------------------------------------------------- props */

/**
 * Sticky margin flag. Local origin = grip point (where the fingers pinch the
 * coloured tab); the flag points toward +x (the page). The coloured tab spans
 * x −34…+16, the translucent adhesive end +16…+46 (× s). The page edge sits
 * at +16 when the flag is placed.
 */
export function pageFlag(ctx, {name, color, s = 1, ring = false}) {
  const th = ctx.theme;
  const H = 13 * s;
  const tab = `M${r(16 * s)} ${r(-H)}H${r(-28 * s)}Q${r(-35 * s)} ${r(-H)} ${r(-35 * s)} ${r(-H + 6 * s)}V${r(H - 6 * s)}Q${r(-35 * s)} ${r(H)} ${r(-28 * s)} ${r(H)}H${r(16 * s)}Z`;
  return g({name},
    h('rect', {x: r(-33 * s), y: r(-H + 4 * s), width: r(80 * s), height: r(2 * H), rx: r(4 * s), fill: th.shadow}),
    h('rect', {x: r(14 * s), y: r(-H), width: r(32 * s), height: r(2 * H), rx: r(3 * s), fill: shade(color, 0.72), opacity: 0.8, stroke: shade(color, -0.1), 'stroke-width': 1.5}),
    h('path', {d: tab, fill: color, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(-30 * s)} ${r(-H + 4 * s)}H${r(10 * s)}`, stroke: '#fff', 'stroke-width': r(2.2 * s), opacity: 0.35, 'stroke-linecap': 'round'}),
    ring ? h('circle', {name: `${name}-ring`, cx: r(-11 * s), cy: 0, r: r(7.5 * s), fill: 'none', stroke: '#fff', 'stroke-width': r(3.2 * s), opacity: 0}) : null,
  );
}

/** Dashed empty flag outline (the other margin at an open question). Same local frame as pageFlag. */
export function emptySlot(ctx, {name, s = 1, color}) {
  const H = 13 * s;
  return g({name, opacity: 0},
    h('path', {d: roundRectPath(-35 * s, -H, 81 * s, 2 * H, 5 * s), fill: 'none', stroke: color ?? ctx.theme.inkSoft, 'stroke-width': r(2.6 * s), 'stroke-dasharray': `${r(7 * s)} ${r(6 * s)}`}),
  );
}

/** Small stack of flags lying on the table (flattened), centred on (0,0). */
function flagPad(ctx, {name, color, s}) {
  const f = 0.42;
  const parts = [];
  parts.push(h('ellipse', {cx: 2 * s, cy: 9 * s, rx: 44 * s, ry: 9 * s, fill: ctx.theme.shadow}));
  for (let i = 0; i < 4; i++) {
    const y = (4 - i) * 2.4 * s;
    parts.push(h('path', {d: roundRectPath(-36 * s, y - 13 * s * f, 80 * s, 26 * s * f, 3 * s), fill: i % 2 ? shade(color, -0.12) : color, stroke: INK, 'stroke-width': 1.6}));
  }
  return g({name}, parts);
}

/** Legend glyph: a highlighter band between two level flags. Centre (x,y), text size sz. */
export function glyphSame(ctx, {x, y, sz, colors}) {
  const w = sz * 4.2, hh = sz * 0.9;
  return g(null,
    h('rect', {x: r(x - w * 0.36), y: r(y - hh / 2), width: r(w * 0.72), height: r(hh), rx: r(hh * 0.2), fill: ctx.theme.highlight, stroke: shade(ctx.theme.highlight, -0.25), 'stroke-width': 1.2}),
    h('path', {d: roundRectPath(x - w * 0.5, y - hh / 2, w * 0.24, hh, hh * 0.22), fill: colors[0], stroke: INK, 'stroke-width': 1.8}),
    h('path', {d: roundRectPath(x + w * 0.26, y - hh / 2, w * 0.24, hh, hh * 0.22), fill: colors[1], stroke: INK, 'stroke-width': 1.8}),
  );
}

/** Legend glyph: one flag with an open ring and a dashed empty outline opposite. */
export function glyphOpen(ctx, {x, y, sz, color}) {
  const w = sz * 4.2, hh = sz * 0.9;
  return g(null,
    h('path', {d: roundRectPath(x - w * 0.5, y - hh / 2, w * 0.36, hh, hh * 0.22), fill: color, stroke: INK, 'stroke-width': 1.8}),
    h('circle', {cx: r(x - w * 0.32), cy: r(y), r: r(hh * 0.28), fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(2, hh * 0.13))}),
    h('path', {d: roundRectPath(x + w * 0.14, y - hh / 2, w * 0.36, hh, hh * 0.22), fill: 'none', stroke: ctx.theme.inkSoft, 'stroke-width': 2, 'stroke-dasharray': '5 4'}),
  );
}

/** Flag swatch used at the start of a bubble row (colour + optional open ring). */
function swatch(ctx, {x, y, s, color, ring}) {
  return g(null,
    h('path', {d: roundRectPath(x, y - 9 * s, 34 * s, 18 * s, 4 * s), fill: color, stroke: INK, 'stroke-width': 1.8}),
    h('rect', {x: r(x + 30 * s), y: r(y - 9 * s), width: r(14 * s), height: r(18 * s), rx: r(2 * s), fill: shade(color, 0.72), opacity: 0.8}),
    ring ? h('circle', {cx: r(x + 13 * s), cy: r(y), r: r(5.5 * s), fill: 'none', stroke: '#fff', 'stroke-width': r(2.4 * s)}) : null,
  );
}

/* ---------------------------------------------------------------- document */

/**
 * Fit the document text: header (reference + title) and passage rows inside
 * `rowsH`. mode 'full' prints each passage (ref chip + wrapped heading);
 * mode 'refs' prints only the ref chips with simulated filler bars (used when
 * the passages are printed once elsewhere, e.g. a shared plate).
 */
/* compact (opt-in, default false; used by the mechanism's standalone page): tighter row pitch and the
 * reference on the same line as the title when both fit — other entries are unaffected. */
export function docLayout(ctx, {w, s, size, minSize, reference, title, passages, rowsH, mode = 'full', titleLines = 2, minDocH = 0, spread = true, compact = false, refGap = 0.45, wholeWords = false}) {
  minSize = Math.min(minSize, size);
  const marg = 56 * s;
  const inner = w - marg * 2;
  let best = null;
  for (let sz = size; sz >= minSize - 1e-6; sz -= Math.max(0.5, size * 0.04)) {
    const refFits = passages.map(q => fitWords(q.ref, {maxWidth: inner * 0.4, size: sz, minSize: sz, maxLines: 1, weight: 700}));
    const chipW = Math.max(...refFits.map(f => f.width)) + sz * 0.9;
    // refs mode: one short line per row, a tighter pitch
    const chipH = mode === 'refs' || compact ? sz * 1.32 : sz * 1.5;
    const textW = inner - chipW - sz * 0.6;
    const rows = passages.map((q, i) => {
      const f = mode === 'full' ? fitWords(q.text, {maxWidth: textW, size: sz, minSize: sz, maxLines: 3, weight: 500}) : null;
      const hh = Math.max(chipH, f ? f.height + sz * 0.25 : chipH);
      return {ref: refFits[i], text: f, h: hh};
    });
    const gap0 = mode === 'refs' ? sz * 0.36 : compact ? sz * 0.42 : sz * 0.55;
    const need = rows.reduce((a, x) => a + x.h, 0) + gap0 * (rows.length - 1);
    // wholeWords (opt-in): a line break inside a word counts as not fitting (the size shrinks instead)
    const split = f => wholeWords && f && f.lines.join(' ').replace(/\s+/g, ' ') !== String(f.full).replace(/\s+/g, ' ').trim();
    const ok = need <= rowsH && rows.every(x => !x.ref.truncated && (!x.text || !x.text.truncated) && !split(x.text));
    best = {sz, rows, chipW, chipH, textW, need, gap0, ok};
    if (ok) break;
  }
  const sz = best.sz;
  const refLine = fitWords(reference, {maxWidth: inner, size: sz, minSize: sz, maxLines: 1, weight: 600, family: 'mono'});
  const titleFit = fitWords(title, {maxWidth: inner, size: sz * 1.12, minSize: sz, maxLines: titleLines, weight: 700, family: 'serif'});
  // refs mode: a minimal header (one filler bar line) — the title is printed elsewhere
  // compact: reference and a one-line title side by side when both fit the line
  const inlineRef = compact && mode !== 'refs' && titleFit.lines.length === 1 && refLine.width + sz * 0.9 + titleFit.width <= inner;
  const headerMin = mode === 'refs' ? marg * 0.5 + sz * 1.3 + 8 * s
    : inlineRef ? marg * 0.55 + Math.max(refLine.height, titleFit.height) + sz * 0.7 + 10 * s
      : marg * 0.55 + refLine.height + sz * refGap + titleFit.height + sz * 0.7 + 10 * s;
  const headerH = Math.max(headerMin, minDocH - rowsH);
  const filler = Math.max(0, Math.floor((headerH - headerMin) / (sz * 0.95)));
  // spread the rows over the available height (bounded extra gap)
  const extra = Math.max(0, rowsH - best.need);
  const gap = best.gap0 + (spread ? Math.min(extra / Math.max(1, best.rows.length), sz * 1.6) : 0);
  let y = 0;
  const rows = best.rows.map(x => {
    const out = {...x, dy: y, anchor: y + best.chipH / 2};
    y += x.h + gap;
    return out;
  });
  // refs mode: the header is drawn as filler bars (its text is printed elsewhere), only the rows must fit
  return {size: sz, fits: best.ok && (mode === 'refs' || (!refLine.truncated && !titleFit.truncated)), refLine, titleFit, headerH, headerMin, filler, rows, rowsUsed: y - gap, chipW: best.chipW, chipH: best.chipH, marg, inner, mode, s, inlineRef, refGap};
}

/** Text or filler bars in the same geometry (labels hidden). */
function textOrBars(ctx, fit, {x, y, anchor = 'start', fill, name, show, family, barColor}) {
  if (show) return textBlock(fit, {x, y, anchor, fill, name});
  return g({name}, fit.lines.map((line, i) => {
    const w = Math.max(fit.size, (fit.width * (line.length + 1)) / (Math.max(...fit.lines.map(l => l.length)) + 1));
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    return h('rect', {x: r(x0), y: r(y + i * fit.lineHeight + fit.size * 0.22), width: r(w), height: r(fit.size * 0.56), rx: r(fit.size * 0.28), fill: barColor ?? ctx.theme.paperLine, opacity: 0.9});
  }));
}

/* ------------------------------------------------------------------- stage */

/**
 * Rig-unit constants of the seated composition (× k). grip = hip → margin grip distance: far
 * enough that a carried flag's tab (35s behind the hand) stays ~29k clear of the face.
 */
// Low table (coffee-table height) between the professionals' knees: its near edge is 28k BELOW
// the hip, so the page on its stand reaches down to the hip line and the passage rows can sit
// below the chin. Each professional holds the flag pad in the far hand, in front of the body.
const RIG = {grip: 124, tableUp: -28, tableDepth: 30, docUp: -12, rowsTop: 226, floor: 150, headTop: 212, tableIn: 104, restNear: {x: 46, y: -14}, restFar: {x: 62, y: -44}, pad: {x: 62, y: -44}};

/** Horizontal span from a stage's outer edge (behind the chair) to the page edge, per side. */
export const sideSpan = (k, s) => (66 + RIG.grip) * k + 16 * s;

/**
 * Pure geometry of a stage: document column [x0,x1] centred on cx, hips at
 * hipY, rig scale k.
 * @param {{cx:number, docW:number, hipY:number, k:number}} o
 */
export function stageGeometry(o) {
  const {cx, docW, hipY, k} = o;
  const s = o.s ?? k / 1.45;
  const x0 = cx - docW / 2, x1 = cx + docW / 2;
  const hipA = {x: x0 - 16 * s - RIG.grip * k, y: hipY};
  const hipB = {x: x1 + 16 * s + RIG.grip * k, y: hipY};
  const tableNear = hipY - RIG.tableUp * k;
  const G = {
    k, s, cx, x0, x1, docW, hipY, hipA, hipB,
    tableNear, tableFar: tableNear - RIG.tableDepth * k,
    docBottom: hipY - RIG.docUp * k,
    rowsTop: hipY - RIG.rowsTop * k,
    floor: hipY + RIG.floor * k,
    headTop: hipY - RIG.headTop * k,
    tableL: hipA.x + RIG.tableIn * k, tableR: hipB.x - RIG.tableIn * k,
    left: hipA.x - 66 * k, right: hipB.x + 66 * k,
  };
  G.rowsBottom = G.docBottom - 12 * k;
  /** highest rows band still within reach of the flagging hands */
  // true reach at the press: shoulder (12, −112)k, arm 165k, grip 124k out → ≈ 237k above the hip
  G.rowsTopMax = hipY - 230 * k;
  /** chin line: a carried or pressed flag stays below it (never at the face) */
  G.chinY = hipY - 140 * k;
  G.head = id => {
    const hip = id === 'a' ? hipA : hipB, d = id === 'a' ? 1 : -1;
    return {x: hip.x + d * 5 * k, y: hipY - 176 * k};
  };
  G.side = id => (id === 'a' ? {hip: hipA, dir: 1, edge: x0} : {hip: hipB, dir: -1, edge: x1});
  const at = (id, q) => {
    const S = G.side(id);
    return {x: S.hip.x + S.dir * q.x * k, y: hipY + q.y * k};
  };
  G.restNear = id => at(id, RIG.restNear);
  G.restFar = id => at(id, RIG.restFar);
  G.pad = id => at(id, RIG.pad);
  /** margin grip point of a flag at row y */
  G.grip = (id, y) => ({x: id === 'a' ? x0 - 16 * s : x1 + 16 * s, y});
  return G;
}

/**
 * The seated consultation stage.
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {ReturnType<typeof stageGeometry>} o.G
 * @param {any[]} o.actors
 * @param {ReturnType<typeof docLayout>} o.doc     fitted document text
 * @param {{reference:string,title:string,passages:any[]}} o.document
 * @param {Array<{id:string, who:'a'|'b', row:number, ring?:boolean}>} o.flags
 * @param {number|null} o.bandRow     row of the "same point" band (null = none)
 * @param {{row:number, side:'a'|'b'}|null} o.slot   empty outline at an open question
 * @param {boolean} [o.showText]
 * @param {boolean} [o.showHeader]  print the document reference/title (false = filler bars; the
 *   text is then printed once elsewhere, e.g. a shared plate)
 * @param {boolean} [o.showRefs]    print the passage refs (default: showText)
 */
export function consultStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const G = o.G;
  const {k, s, x0, x1, cx} = G;
  const D = o.doc;
  const showText = o.showText ?? ctx.show('key');
  const looks = [0, 1].map(i => actorLook(ctx, o.actors[i], i));
  const color = id => looks[id === 'a' ? 0 : 1].outfit;

  // --- document geometry (world)
  const docTop = G.rowsTop - D.headerH;
  const docH = G.docBottom - docTop;
  const rowY = i => G.rowsTop + D.rows[i].anchor;
  const docBox = {x: x0, y: docTop, w: G.docW, h: docH};

  // --- people
  const rigA = personRig(ctx, {name: `${P}-A`, look: looks[0], pose: 'seated'});
  const rigB = personRig(ctx, {name: `${P}-B`, look: looks[1], pose: 'seated'});

  // --- table
  const inset = 30 * k;
  const topPath = `M${r(G.tableL + inset)} ${r(G.tableFar)}H${r(G.tableR - inset)}L${r(G.tableR)} ${r(G.tableNear)}H${r(G.tableL)}Z`;
  const edge = 14 * k;
  const legW = 24 * k;
  const panelTop = G.tableNear + edge;
  const tableTop = g({name: `${P}-top`},
    h('ellipse', {cx: r(cx), cy: r(G.floor + 4 * k), rx: r((G.hipB.x - G.hipA.x) * 0.62), ry: r(14 * k), fill: th.shadow}),
    h('path', {d: topPath, fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(G.tableL + inset + 8)} ${r(G.tableFar + 6 * k)}H${r(G.tableR - inset - 8)}`, stroke: '#fff', 'stroke-width': 3, opacity: 0.35}),
    [0, 1, 2].map(i => {
      const gy = G.tableFar + (i + 0.7) * (G.tableNear - G.tableFar) / 3.2;
      const wob = (3 + ctx.rng(`${P}-grain`, i) * 4) * k;
      return h('path', {d: `M${r(G.tableL + 40 * k)} ${r(gy)}C${r(cx - 120 * k)} ${r(gy - wob)} ${r(cx + 120 * k)} ${r(gy + wob)} ${r(G.tableR - 40 * k)} ${r(gy)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.55});
    }),
  );
  const tableFront = g({name: `${P}-front`},
    h('path', {d: roundRectPath(G.tableL, G.tableNear, G.tableR - G.tableL, edge, 3 * k), fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(G.tableL + legW * 0.6), y: r(panelTop), width: r(G.tableR - G.tableL - legW * 1.2), height: r(G.floor - 12 * k - panelTop), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(G.tableL + legW * 1.5, panelTop + 8 * k, G.tableR - G.tableL - legW * 3, G.floor - 12 * k - panelTop - 16 * k, 7 * k), fill: shade(th.wood, -0.06), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
    h('rect', {x: r(G.tableL), y: r(panelTop - 1), width: r(legW), height: r(G.floor - panelTop + 1), rx: 4 * k, fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: r(G.tableR - legW), y: r(panelTop - 1), width: r(legW), height: r(G.floor - panelTop + 1), rx: 4 * k, fill: th.woodDark, stroke: th.ink, 'stroke-width': th.stroke}),
  );
  const panel = {x: G.tableL + legW * 1.5, y: panelTop + 8 * k, w: G.tableR - G.tableL - legW * 3, h: G.floor - 12 * k - panelTop - 16 * k};

  // --- document on its reading stand
  const fold = 34 * s;
  const paperD = `M${r(x0)} ${r(docTop)}H${r(x1 - fold)}L${r(x1)} ${r(docTop + fold)}V${r(G.docBottom)}H${r(x0)}Z`;
  const standBack = g(null,
    h('path', {d: `M${r(cx - 60 * s)} ${r(docTop + docH * 0.35)}L${r(cx - 90 * s)} ${r(G.docBottom + 12 * k)}M${r(cx + 60 * s)} ${r(docTop + docH * 0.35)}L${r(cx + 90 * s)} ${r(G.docBottom + 12 * k)}`, stroke: th.woodDark, 'stroke-width': r(12 * s), 'stroke-linecap': 'round'}),
    h('ellipse', {cx: r(cx), cy: r(G.docBottom + 12 * k), rx: r(G.docW * 0.56), ry: r(8 * k), fill: th.shadow}),
  );
  const paper = g(null,
    h('path', {d: paperD, fill: th.shadow, transform: T(8 * s, 8 * s)}),
    h('path', {d: paperD, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x1 - fold)} ${r(docTop)}V${r(docTop + fold)}H${r(x1)}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  );
  const m = D.marg;
  const sz = D.size;
  const hdrY = docTop + m * 0.55;
  const header = g(null,
    textOrBars(ctx, D.refLine, {x: x0 + m, y: hdrY, fill: th.inkSoft, show: showText && o.showHeader !== false, name: `${P}-docref`}),
    D.mode === 'refs' ? null : textOrBars(ctx, D.titleFit, {x: x0 + m, y: hdrY + D.refLine.height + sz * D.refGap, fill: th.ink, show: showText && o.showHeader !== false, name: `${P}-doctitle`}),
    h('path', {d: `M${r(x0 + m)} ${r(G.rowsTop - sz * 0.55 - 6 * s)}H${r(x1 - m)}`, stroke: th.paperLine, 'stroke-width': 2.5}),
    // simulated paragraph text between the title and the passages (filler, not supplied text)
    Array.from({length: D.filler}, (_, i) => {
      const y = docTop + D.headerMin - sz * 0.4 + i * sz * 0.95;
      const wBar = (G.docW - m * 2) * (i === D.filler - 1 ? 0.45 : 0.82 + ctx.rng(`${P}-fill`, i) * 0.18);
      return h('rect', {x: r(x0 + m), y: r(y), width: r(wBar), height: r(sz * 0.34), rx: r(sz * 0.17), fill: th.paperLine, opacity: 0.75});
    }),
  );
  const rowNodes = D.rows.map((row, i) => {
    const y = G.rowsTop + row.dy;
    const chipX = x0 + m;
    const parts = [
      h('path', {d: roundRectPath(chipX, y, D.chipW, D.chipH, D.chipH * 0.3), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.8}),
      textOrBars(ctx, row.ref, {x: chipX + D.chipW / 2, y: y + (D.chipH - row.ref.size) / 2 - row.ref.size * 0.05, anchor: 'middle', fill: th.ink, show: o.showRefs ?? showText, name: `${P}-ref${i}`}),
    ];
    const tx = chipX + D.chipW + sz * 0.6;
    if (row.text) {
      parts.push(textOrBars(ctx, row.text, {x: tx, y: y + (D.chipH - sz) / 2, fill: th.ink, show: showText, name: `${P}-psg${i}`}));
    } else {
      // simulated clause text (refs mode): two filler bars
      const bw = x1 - m - tx;
      parts.push(h('rect', {x: r(tx), y: r(y + D.chipH * 0.2), width: r(bw * (0.8 + ctx.rng(`${P}-bar`, i) * 0.2)), height: r(D.chipH * 0.22), rx: r(D.chipH * 0.11), fill: th.paperLine}));
      parts.push(h('rect', {x: r(tx), y: r(y + D.chipH * 0.58), width: r(bw * (0.45 + ctx.rng(`${P}-bar2`, i) * 0.3)), height: r(D.chipH * 0.22), rx: r(D.chipH * 0.11), fill: th.paperLine}));
    }
    return g({name: `${P}-row${i}`}, parts);
  });

  // --- comparison marks: band halves (under the text) and the empty slot
  let band = null;
  const bandGeo = o.bandRow == null ? null : (() => {
    const row = D.rows[o.bandRow];
    const y = G.rowsTop + row.dy - sz * 0.18;
    return {y, h: row.h + sz * 0.3, l: x0 + 2, r2: x1 - 2, mid: cx};
  })();
  if (bandGeo) {
    const hl = th.highlight;
    band = g({name: `${P}-band`},
      h('rect', {name: `${P}-bandL`, x: r(bandGeo.l), y: r(bandGeo.y), width: 0, height: r(bandGeo.h), fill: hl, opacity: 0.85}),
      h('rect', {name: `${P}-bandR`, x: r(bandGeo.r2), y: r(bandGeo.y), width: 0, height: r(bandGeo.h), fill: hl, opacity: 0.85}),
    );
  }
  let slotNode = null;
  if (o.slot) {
    const y = rowY(o.slot.row);
    const q = G.grip(o.slot.side, y);
    slotNode = g({transform: `${T(q.x, q.y)} scale(${o.slot.side === 'a' ? 1 : -1} 1)`}, emptySlot(ctx, {name: `${P}-slot`, s}));
  }
  const ledge = g(null,
    h('path', {d: roundRectPath(x0 - 14 * s, G.docBottom - 8 * s, G.docW + 28 * s, 20 * s, 6 * s), fill: th.wood, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: `M${r(x0 - 8 * s)} ${r(G.docBottom - 3 * s)}H${r(x1 + 8 * s)}`, stroke: '#fff', 'stroke-width': 2, opacity: 0.3}),
  );

  // --- pads and flags
  const pads = CONSULT_ACTORS.map(id => {
    const q = G.pad(id);
    return g({transform: `${T(q.x, q.y)} scale(${id === 'a' ? 1 : -1} 1)`}, flagPad(ctx, {name: `${P}-pad${id}`, color: color(id), s}));
  });
  const flagDefs = o.flags.map(f => ({...f, color: color(f.who), node: pageFlag(ctx, {name: `${P}-f-${f.id}`, color: color(f.who), s, ring: f.ring})}));
  // stack order on each pad: the first flag used is on top
  const stackIndex = {};
  const counters = {a: 0, b: 0};
  for (const f of o.flags) stackIndex[f.id] = counters[f.who]++;

  const node = g({name: P},
    tableTop,
    standBack,
    g({name: `${P}-doc`}, paper, band, header, rowNodes),
    slotNode,
    ledge,
    pads,
    flagDefs.map(f => f.node).reverse(),
    rigA.node,
    rigB.node,
    tableFront,
  );

  /** resting spot of a flag on its owner's pad (flattened) */
  const padSpot = f => {
    const q = G.pad(f.who);
    return {x: q.x, y: q.y - 2 * s - stackIndex[f.id] * 3 * s};
  };

  /**
   * Pose the stage.
   * @param {object} st
   * @param {{near:any, far:any, lean:number, tilt:number, mouth:number}} st.a
   * @param {{near:any, far:any, lean:number, tilt:number, mouth:number}} st.b
   * @param {Record<string, {at:'pad'|'hand'|'placed', x?:number, y?:number, flat?:number}>} st.flags
   * @param {{band:number, ring:number, slot:number}} st.marks
   */
  function pose(st) {
    const nodes = {};
    const fa = rigA.frame({x: G.hipA.x, y: G.hipY, facing: 1, scale: k, lean: st.a.lean, headTilt: st.a.tilt, mouth: st.a.mouth, near: st.a.near, far: st.a.far});
    const fb = rigB.frame({x: G.hipB.x, y: G.hipY, facing: -1, scale: k, lean: st.b.lean, headTilt: st.b.tilt, mouth: st.b.mouth, near: st.b.near, far: st.b.far});
    Object.assign(nodes, fa.nodes, fb.nodes);
    const hands = {a: fa.hands.near, b: fb.hands.near};
    const flagPos = {};
    for (const f of flagDefs) {
      const fs = st.flags[f.id];
      let p, flat = 1, rot = 0;
      if (fs.at === 'hand') {
        p = hands[f.who];
        flat = fs.flat ?? 1;
        rot = fs.rot ?? 0;
      } else if (fs.at === 'placed') {
        p = {x: fs.x, y: fs.y};
      } else {
        p = padSpot(f);
        flat = 0.42;
      }
      flagPos[f.id] = {x: p.x, y: p.y};
      const dir = f.who === 'a' ? 1 : -1;
      nodes[`${P}-f-${f.id}`] = {transform: `${T(p.x, p.y, dir * rot)} scale(${dir} ${r(flat, 3)})`};
      if (f.ring) nodes[`${P}-f-${f.id}-ring`] = {opacity: r(st.marks.ring, 3)};
    }
    if (bandGeo) {
      const b = ease.inOutCubic(clamp(st.marks.band));
      const half = (bandGeo.mid - bandGeo.l) * b;
      nodes[`${P}-bandL`] = {width: r(half)};
      nodes[`${P}-bandR`] = {x: r(bandGeo.r2 - half), width: r(half)};
    }
    if (slotNode) nodes[`${P}-slot`] = {opacity: r(st.marks.slot, 3)};
    return {nodes, hands, far: {a: fa.hands.far, b: fb.hands.far}, flagPos, reached: fa.reached && fb.reached, reach: {a: fa.reached, b: fb.reached}, heads: {a: fa.head, b: fb.head}};
  }

  // text areas on the page (for label/leader obstacles): header block and each passage row
  const textBoxes = [
    {x: x0 + m, y: docTop + m * 0.4, w: Math.max(D.refLine.width, D.titleFit.width), h: D.refLine.height + sz * D.refGap + D.titleFit.height + sz * 0.3},
    ...D.rows.map(row => ({x: x0 + m, y: G.rowsTop + row.dy, w: D.chipW + sz * 0.6 + (row.text ? row.text.width : G.docW - 2 * m - D.chipW), h: row.h})),
  ];
  return {node, pose, G, looks, color, docBox, docTop, rowY, flagDefs, padSpot, panel, bandGeo, rigA, rigB, textBoxes};
}

/* ------------------------------------------------------------------ script */

/**
 * Placement script for one stage. Each placement moves ONE flag: the owner's
 * near hand reaches the pad, picks the flag up (it un-flattens in the hand),
 * carries it to an approach point just outside the margin, presses it onto
 * the margin at the row, and returns to rest. Windows are on an action clock c.
 * A hand never does two placements at once (placements of one owner must not
 * overlap). An optional `moves` list re-positions already placed flags the
 * same way (the hand peels the flag at its margin spot instead of the pad).
 * @param {ReturnType<typeof consultStage>} st
 * @param {Array<{flag:string, who:'a'|'b', row:number, w:[number,number], from?:number}>} placements
 * @param {{band?:[number,number], ring?:[number,number], slot?:[number,number]}} marks
 * @param {{placed?: Record<string, number>}} [opt]  flags already on the page at the start (id → row)
 */
export function placementScript(st, placements, marks = {}, opt = {}) {
  const G = st.G;
  const k = G.k, s = G.s;
  const byWho = {a: [], b: []};
  for (const pl of placements) byWho[pl.who].push(pl);
  const phases = pl => {
    const [a, b] = pl.w;
    const d = b - a;
    return {a, t1: a + 0.2 * d, t2: a + 0.3 * d, tc: a + 0.5 * d, t3: a + 0.72 * d, t4: a + 0.84 * d, b};
  };
  const target = pl => G.grip(pl.who, st.rowY(pl.row));
  const origin = pl => (pl.from == null ? st.padSpot(st.flagDefs.find(f => f.id === pl.flag)) : G.grip(pl.who, st.rowY(pl.from)));
  // The carry keeps the hand low and out in front of the body: lift off the
  // pad, travel forward to a point beside the page's lower corner, rise along
  // the page edge to the row, then press inward onto the margin.
  const dirOf = who => (who === 'a' ? 1 : -1);
  const approach = (pl, q) => ({x: q.x - dirOf(pl.who) * 20 * s, y: q.y + 4 * s});
  const lifted = (pl, o0) => (pl.from == null ? {x: o0.x + dirOf(pl.who) * 8 * k, y: o0.y - 22 * k} : {x: o0.x - dirOf(pl.who) * 22 * s, y: o0.y + 6 * s});
  const corner = (pl, q, o0) => ({x: q.x - dirOf(pl.who) * 20 * s, y: Math.max(q.y + 4 * s, Math.min(G.docBottom - 30 * k, (pl.from == null ? o0.y - 22 * k : o0.y + 6 * s)))});
  /** hand target of one owner at clock c */
  const handAt = (who, c) => {
    const rest = G.restNear(who);
    let p = rest;
    for (const pl of byWho[who]) {
      const ph = phases(pl);
      const o0 = origin(pl), q = target(pl);
      const segs = [[ph.a, ph.t1, p, o0], [ph.t1, ph.t2, o0, lifted(pl, o0)], [ph.t2, ph.tc, lifted(pl, o0), corner(pl, q, o0)], [ph.tc, ph.t3, corner(pl, q, o0), approach(pl, q)], [ph.t3, ph.t4, approach(pl, q), q], [ph.t4, ph.b, q, rest]];
      if (c < ph.a) return p;
      for (const [a, b, from, to] of segs) {
        if (c <= b) return mix(from, to, ease.inOutCubic(seg(c, a, b)));
      }
      p = rest;
    }
    return p;
  };

  return c => {
    const flags = {};
    const holder = {};
    for (const f of st.flagDefs) {
      const row0 = opt.placed && opt.placed[f.id];
      flags[f.id] = row0 == null ? {at: 'pad'} : {at: 'placed', x: G.grip(f.who, st.rowY(row0)).x, y: st.rowY(row0)};
      holder[f.id] = null;
    }
    const pose = {a: null, b: null};
    for (const who of CONSULT_ACTORS) {
      let lean = 2, tilt = 0, busy = 0;
      for (const pl of byWho[who]) {
        const ph = phases(pl);
        const q = target(pl);
        if (pl.from != null && c < ph.t1) flags[pl.flag] = {at: 'placed', x: G.grip(who, st.rowY(pl.from)).x, y: st.rowY(pl.from)};
        if (c > ph.t1 && c <= ph.t4) {
          flags[pl.flag] = {at: 'hand', flat: pl.from == null ? lerp(0.42, 1, ease.outCubic(seg(c, ph.t1, ph.t2))) : 1};
          holder[pl.flag] = who;
        } else if (c > ph.t4) {
          flags[pl.flag] = {at: 'placed', x: q.x, y: q.y};
        }
        // lean in and look up while carrying toward the page
        const w = seg(c, ph.t1, ph.t2) * (1 - seg(c, ph.t4, ph.b));
        busy = Math.max(busy, w);
        const up = clamp((G.hipY - 170 * k - q.y) / (80 * k), -1, 1);
        tilt = lerp(tilt, -5 * up, w);
      }
      lean = lerp(1, 2, busy);
      pose[who] = {near: handAt(who, c), far: G.restFar(who), lean, tilt, mouth: 0};
    }
    const mk = (w, c0) => (w ? seg(c0, w[0], w[1]) : 0);
    return {
      a: pose.a, b: pose.b, flags, holder,
      marks: {band: mk(marks.band, c), ring: mk(marks.ring, c), slot: mk(marks.slot, c)},
      phases: Object.fromEntries(placements.map(pl => [pl.flag, phases(pl)])),
    };
  };
}

/* ----------------------------------------------------------------- bubbles */

/**
 * Fit a note bubble: rows of [flag swatch + supplied note], largest size
 * (size → minSize) whose content fits maxW × maxH.
 */
export function fitBubble(ctx, rows, {maxW, maxH, size, minSize, maxLines = 4}) {
  minSize = Math.min(minSize, size);
  let best = null;
  for (let sz = size; sz >= minSize - 1e-6; sz -= Math.max(0.5, size * 0.04)) {
    const pad = sz * 0.75;
    const sw = sz * 2.1;
    const fits = rows.map(x => fitWords(x.text, {maxWidth: maxW - pad * 2 - sw, size: sz, minSize: sz, maxLines, weight: 600}));
    const gap = sz * 0.55;
    const w = Math.max(...fits.map(f => f.width)) + pad * 2 + sw;
    const hh = fits.reduce((a, f) => a + Math.max(f.height, sz * 1.2), 0) + gap * (rows.length - 1) + pad * 2;
    best = {size: sz, pad, sw, gap, fits, w, h: hh, ok: hh <= maxH && fits.every(f => !f.truncated)};
    if (best.ok) break;
  }
  return best;
}

/**
 * Note bubble ("bocadillo") with its tail on the speaker's head.
 * @param {any} ctx
 * @param {{name:string, box:{x:number,y:number,w:number,h:number}, tail:{x:number,y:number}, fit:ReturnType<typeof fitBubble>, rows:Array<{color:string, ring?:boolean}>, stroke?:string, show:boolean}} o
 */
export function noteBubble(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o.box;
  const F = o.fit;
  const rr = Math.min(26, hh * 0.3);
  const tip = o.tail;
  const below = tip.y > y + hh;
  const bw = Math.min(48, w * 0.2);
  const bx = clamp(tip.x, x + rr + bw / 2 + 4, x + w - rr - bw / 2 - 4);
  // body and tail are separate shapes (the body box is what may never cover a head or the page)
  const bodyD = roundRectPath(x, y, w, hh, rr);
  const tailFill = below ? `M${r(bx - bw / 2)} ${r(y + hh - 2)}L${r(tip.x)} ${r(tip.y)}L${r(bx + bw / 2)} ${r(y + hh - 2)}Z` : '';
  const tailStroke = below ? `M${r(bx - bw / 2)} ${r(y + hh)}L${r(tip.x)} ${r(tip.y)}L${r(bx + bw / 2)} ${r(y + hh)}` : '';
  const rowsNodes = [];
  let yy = y + F.pad;
  F.fits.forEach((f, i) => {
    const rowH = Math.max(f.height, F.size * 1.2);
    const s = F.size / 22;
    rowsNodes.push(g({name: `${o.name}-r${i}`, opacity: 0},
      swatch(ctx, {x: x + F.pad, y: yy + F.size * 0.55, s, color: o.rows[i].color, ring: o.rows[i].ring}),
      textOrBars(ctx, f, {x: x + F.pad + F.sw, y: yy + (rowH - f.height) / 2, fill: th.ink, show: o.show, barColor: th.paperLine})));
    yy += rowH + F.gap;
  });
  const node = g({name: o.name, opacity: 0},
    h('path', {d: bodyD, fill: th.shadow, transform: T(5, 7)}),
    below ? h('path', {d: tailStroke, fill: 'none', stroke: o.stroke ?? th.ink, 'stroke-width': 3, 'stroke-linejoin': 'round'}) : null,
    h('path', {name: `${o.name}-body`, d: bodyD, fill: th.card, stroke: o.stroke ?? th.ink, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    below ? h('path', {d: tailFill, fill: th.card}) : null,
    rowsNodes);
  const frame = (open, rowsP) => {
    const out = {[o.name]: {opacity: r(clamp(open * 1.4), 3), transform: open < 1 ? `translate(${r(tip.x)} ${r(tip.y)}) scale(${r(0.7 + 0.3 * ease.outCubic(clamp(open)), 3)}) translate(${r(-tip.x)} ${r(-tip.y)})` : ''}};
    F.fits.forEach((_, i) => { out[`${o.name}-r${i}`] = {opacity: r(clamp(rowsP[i] ?? 0), 3)}; });
    return out;
  };
  return {node, frame, box: o.box};
}

/* ------------------------------------------------------------------ labels */

/**
 * Legend card: glyph rows ("same point noted · as supplied", "open question ·
 * as supplied") and the neutral key. Fitted into maxW; size bounded.
 * @returns {{node:any, box:any, fits:any[], ok:boolean}}
 */
export function legendCard(ctx, {name, x, y, maxW, maxH = Infinity, size, minSize, rows, key, anchor = 'middle', colors}) {
  minSize = Math.min(minSize, size);
  const th = ctx.theme;
  let best = null;
  for (let sz = size; sz >= minSize - 1e-6; sz -= Math.max(0.5, size * 0.04)) {
    const pad = sz * 0.6;
    const gw = rows.length ? sz * 4.2 : 0;
    const fits = rows.map(x2 => fitWords(x2.text, {maxWidth: maxW - pad * 2 - gw - sz * 0.5, size: sz, minSize: sz, maxLines: 3, weight: 600}));
    const keyFit = key ? fitWords(key, {maxWidth: maxW - pad * 2, size: sz, minSize: sz, maxLines: 3, weight: 500}) : null;
    const gap = sz * 0.45;
    const w = Math.max(...fits.map(f => f.width + gw + sz * 0.5), keyFit ? keyFit.width : 0) + pad * 2;
    const hh = fits.reduce((a, f) => a + f.height + gap, 0) + (keyFit ? keyFit.height : -gap) + pad * 2;
    best = {sz, pad, gw, fits, keyFit, gap, w, h: hh, ok: hh <= maxH && fits.every(f => !f.truncated) && !(keyFit && keyFit.truncated)};
    if (best.ok) break;
  }
  const {sz, pad, gw, fits, keyFit, gap, w} = best;
  const hh = best.h;
  const bx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  const parts = [h('path', {d: roundRectPath(bx, y, w, hh, Math.min(16, sz * 0.6)), fill: th.card, stroke: th.ink, 'stroke-width': 2})];
  let yy = y + pad;
  fits.forEach((f, i) => {
    const gy = yy + Math.min(f.height, sz * 1.2) / 2;
    const glyph = rows[i].kind === 'same' ? glyphSame(ctx, {x: bx + pad + gw / 2, y: gy, sz, colors}) : glyphOpen(ctx, {x: bx + pad + gw / 2, y: gy, sz, color: rows[i].color});
    parts.push(g({name: `${name}-row${i}`}, glyph, textBlock(f, {x: bx + pad + gw + sz * 0.5, y: yy, fill: th.ink})));
    yy += f.height + gap;
  });
  if (keyFit) parts.push(g({name: `${name}-key`}, textBlock(keyFit, {x: bx + w / 2, y: yy, anchor: 'middle', fill: th.inkSoft})));
  return {node: g({name, opacity: 0}, parts), box: {x: bx, y, w, h: hh}, ok: best.ok, size: sz};
}

/**
 * Place an editorial callout in free space: candidate chip positions around
 * the target (nearest first) whose chip box stays inside `bounds`, clears every
 * `occupied` box and whose leader does not cross an `occupied` box.
 */
export function placeCallout(ctx, {name, text, target, occupied, bounds, size, minSize, maxW, maxLines = 3, step = 22, leaderCheck = true}) {
  minSize = Math.min(minSize, size);
  const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  const segHits = (b, p, q) => {
    for (let i = 1; i < 24; i++) {
      const t = i / 24;
      const x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
      if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
    }
    return false;
  };
  const contains = (o, q) => q.x >= o.x - 1 && q.x <= o.x + o.w + 1 && q.y >= o.y - 1 && q.y <= o.y + o.h + 1;
  // widest chip first, then narrower chips with more lines (never truncated)
  const widths = [maxW, maxW * 0.75, maxW * 0.58, maxW * 0.46].filter(w => w >= size * 8);
  let fallback = null;
  for (const mw of widths) {
    let chip0 = null;
    for (let sz = size; sz >= minSize - 1e-6; sz -= Math.max(0.5, size * 0.05)) {
      chip0 = wchip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: sz, minSize: sz, maxLines: maxLines + (mw < maxW ? 2 : 0)});
      if (!chip0.fit.truncated) break;
    }
    if (chip0.fit.truncated) continue;
    const sz = chip0.fit.size, lines = chip0.fit.lines.length;
    const cw = chip0.box.w, ch = chip0.box.h;
    const cands = [];
    for (let yy = bounds.y; yy + ch <= bounds.y + bounds.h; yy += step) {
      for (let xx = bounds.x; xx + cw <= bounds.x + bounds.w; xx += step) {
        const dd = Math.hypot(xx + cw / 2 - target.x, yy + ch / 2 - target.y);
        if (dd >= 40) cands.push({b: {x: xx, y: yy, w: cw, h: ch}, dd});
      }
    }
    cands.sort((a, b) => a.dd - b.dd);
    for (const {b} of cands) {
      if (!inside(b) || occupied.some(o => overlaps(b, o, 8))) continue;
      const from = {x: clamp(target.x, b.x + 12, b.x + b.w - 12), y: target.y > b.y + b.h ? b.y + b.h : target.y < b.y ? b.y : b.y + b.h / 2};
      if (from.y === b.y + b.h / 2) from.x = target.x > b.x + b.w / 2 ? b.x + b.w : b.x;
      if (leaderCheck && occupied.some(o => !contains(o, target) && segHits(o, from, target))) continue;
      const c = noteCallout(ctx, {name, text, chipAt: {x: b.x, y: b.y}, anchor: 'start', target, maxWidth: mw, size: sz, minSize: sz, maxLines: lines});
      return {...c, ok: true};
    }
    if (!fallback) fallback = {mw, sz, lines};
  }
  const f = fallback || {mw: maxW, sz: minSize, lines: maxLines};
  const c = noteCallout(ctx, {name, text, chipAt: {x: bounds.x, y: bounds.y}, anchor: 'start', target, maxWidth: f.mw, size: f.sz, minSize: f.sz, maxLines: f.lines});
  return {...c, ok: false};
}

/* ------------------------------------------------------------ page alone */

/**
 * The shared page on its own (no table, no people): paper, header, passage
 * rows, the "same point" band halves and optional empty outline. Used by the
 * mechanism, which places the page as one element of an exploded diagram.
 * Geometry comes from docLayout; rows start at `rowsTop` (absolute).
 * @param {any} ctx
 * @param {{prefix:string, D:ReturnType<typeof docLayout>, x0:number, top:number, w:number, s:number, bandRow?:number|null, showText?:boolean, minBottom?:number}} o
 *   minBottom: the paper extends down to it, with simulated paragraph bars (filler, not supplied text)
 */
export function pageSheet(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const D = o.D;
  const {x0, w, s} = o;
  const x1 = x0 + w;
  const top = o.top;
  const rowsTop = top + D.headerH;
  const bottom0 = rowsTop + D.rowsUsed + D.size * 1.2;
  const bottom = Math.max(bottom0, o.minBottom ?? 0);
  const showText = o.showText ?? ctx.show('key');
  const m = D.marg, sz = D.size;
  const fillerN = Math.max(0, Math.floor((bottom - bottom0 - sz * 0.6) / (sz * 0.95)));
  const filler = Array.from({length: fillerN}, (_, i) => h('rect', {x: r(x0 + m), y: r(bottom0 + sz * 0.2 + i * sz * 0.95), width: r((w - m * 2) * (i === fillerN - 1 ? 0.4 : 0.8 + ctx.rng(`${P}-pf`, i) * 0.2)), height: r(sz * 0.34), rx: r(sz * 0.17), fill: th.paperLine, opacity: 0.75}));
  const fold = 34 * s;
  const paperD = `M${r(x0)} ${r(top)}H${r(x1 - fold)}L${r(x1)} ${r(top + fold)}V${r(bottom)}H${r(x0)}Z`;
  const rowY = i => rowsTop + D.rows[i].anchor;
  let band = null, bandGeo = null;
  if (o.bandRow != null) {
    const row = D.rows[o.bandRow];
    bandGeo = {y: rowsTop + row.dy - sz * 0.18, h: row.h + sz * 0.3, l: x0 + 2, r2: x1 - 2, mid: x0 + w / 2};
    band = g({name: `${P}-band`},
      h('rect', {name: `${P}-bandL`, x: r(bandGeo.l), y: r(bandGeo.y), width: 0, height: r(bandGeo.h), fill: th.highlight, opacity: 0.85}),
      h('rect', {name: `${P}-bandR`, x: r(bandGeo.r2), y: r(bandGeo.y), width: 0, height: r(bandGeo.h), fill: th.highlight, opacity: 0.85}));
  }
  const hdrY = top + m * 0.55;
  const node = g({name: P},
    h('path', {d: paperD, fill: th.shadow, transform: T(8 * s, 8 * s)}),
    h('path', {d: paperD, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x1 - fold)} ${r(top)}V${r(top + fold)}H${r(x1)}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    band,
    textOrBars(ctx, D.refLine, {x: x0 + m, y: hdrY, fill: th.inkSoft, show: showText, name: `${P}-docref`}),
    textOrBars(ctx, D.titleFit, D.inlineRef ? {x: x0 + m + D.refLine.width + sz * 0.9, y: hdrY + (D.refLine.height - D.titleFit.height) / 2, fill: th.ink, show: showText, name: `${P}-doctitle`} : {x: x0 + m, y: hdrY + D.refLine.height + sz * 0.45, fill: th.ink, show: showText, name: `${P}-doctitle`}),
    h('path', {d: `M${r(x0 + m)} ${r(rowsTop - sz * 0.55 - 6 * s)}H${r(x1 - m)}`, stroke: th.paperLine, 'stroke-width': 2.5}),
    filler,
    D.rows.map((row, i) => {
      const y = rowsTop + row.dy;
      const chipX = x0 + m;
      return g({name: `${P}-row${i}`},
        h('path', {d: roundRectPath(chipX, y, D.chipW, D.chipH, D.chipH * 0.3), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.8}),
        textOrBars(ctx, row.ref, {x: chipX + D.chipW / 2, y: y + (D.chipH - row.ref.size) / 2 - row.ref.size * 0.05, anchor: 'middle', fill: th.ink, show: showText, name: `${P}-ref${i}`}),
        row.text ? textOrBars(ctx, row.text, {x: chipX + D.chipW + sz * 0.6, y: y + (D.chipH - sz) / 2, fill: th.ink, show: showText, name: `${P}-psg${i}`}) : null);
    }),
  );
  const textBoxes = [
    D.inlineRef ? {x: x0 + m, y: top + m * 0.4, w: D.refLine.width + sz * 0.9 + D.titleFit.width, h: Math.max(D.refLine.height, D.titleFit.height) + sz * 0.3} : {x: x0 + m, y: top + m * 0.4, w: Math.max(D.refLine.width, D.titleFit.width), h: D.refLine.height + sz * 0.45 + D.titleFit.height + sz * 0.3},
    ...D.rows.map(row => ({x: x0 + m, y: rowsTop + row.dy, w: D.chipW + sz * 0.6 + (row.text ? row.text.width : w - 2 * m - D.chipW), h: row.h})),
  ];
  const bandFrame = b => {
    if (!bandGeo) return {};
    const half = (bandGeo.mid - bandGeo.l) * ease.inOutCubic(clamp(b));
    return {[`${P}-bandL`]: {width: r(half)}, [`${P}-bandR`]: {x: r(bandGeo.r2 - half), width: r(half)}};
  };
  return {node, rowY, box: {x: x0, y: top, w, h: bottom - top}, textBoxes, bandFrame, x0, x1, top, bottom, size: D.size};
}
