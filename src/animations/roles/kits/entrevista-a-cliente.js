/**
 * Kit for the "Entrevista a cliente" motif (LAW-0161..0164).
 *
 * Staging (story, contrast, inspect): a medium shot of a meeting table seen
 * from the side. The client (A) sits at the left end facing right, the
 * interviewer (B) at the right end facing left (personRig, seated). The
 * table's front panel crops the legs. B holds an upright question board
 * (clipboard) with the FAR hand at its right edge, in front of B's face, and
 * a pen in the NEAR hand. The board is drawn behind B's rig, so B's hands
 * are in front of it (grip) and the pen tip marks its right column.
 *
 * Layers (back → front): tabletop · board · pen · client · interviewer ·
 * table front panel. Entries add bubbles, chips, keys and callouts on top.
 *
 * The kit owns geometry and the pose solver; entries own timing, layout of
 * editorial text and semantics. Attachment rules asserted through semantics:
 *  - the board is placed from its pose and B's far hand is solved onto the
 *    board's grip point (`gripB` = `boardGrip`);
 *  - the pen is placed from B's SOLVED near hand (nib = hand − grip vector);
 *    while marking, the nib target is the mark's path point (`tickTarget`);
 *  - `allReached`: every IK target is within arm reach.
 *
 * Also: fields/defaults shared by the entries, the question board (rows,
 * tick marks, optional note slot and day strip with pen marks), the talk
 * bubble (account + clarified addendum), the question bubble and small
 * label-placement helpers. The mechanism (LAW-0162) draws its own top-view
 * plan and only uses the fields, strings and helpers.
 * @module animations/roles/kits/entrevista-a-cliente
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, oneOf, party, RELATION_KINDS} from '../../../schemas/fields.js';
import {personRig} from '../../../primitives/person.js';
import {actorLook} from '../../../primitives/people-style.js';
import {pen as penProp, shade} from '../../../primitives/paper.js';
import {textBlock} from '../../../primitives/annotate.js';
import {changedMarker} from '../../../primitives/markers.js';
import {fitWords, wchip, overlaps} from './mediation-labels.js';

export {fitWords, wchip, overlaps};

const INK = '#1f2328';

/* ------------------------------------------------------------------ fields */

/** Person ids used by relationships. */
export const INTERVIEW_ACTORS = ['client', 'interviewer'];

const relationship = obj('A relationship between the two people', {
  from: oneOf('Source person', INTERVIEW_ACTORS),
  to: oneOf('Target person', INTERVIEW_ACTORS),
  kind: oneOf('relation | communication | sequence | causal. A sequence link between the two people sets who opens the exchange (its "from"): the client’s account or the interviewer’s first question. Other kinds are descriptive only', RELATION_KINDS),
}, ['from', 'to', 'kind']);

/** Category fields (roles) specialised for this motif. */
export const interviewFields = {
  actors: list('The client and the interviewer, in this order (fictional people)', party, 2, 2),
  roles: obj('Descriptive role captions (never a legal finding)', {
    client: str('Role caption for the person giving the account', 40),
    interviewer: str('Role caption for the person asking the questions', 40),
  }),
  relationships: list('Explicit relationships between the two people. A sequence link sets who opens the exchange', relationship, 1, 4),
};

/** Interview content used by the story (supplied text, shown as supplied). */
export const interviewProps = obj('Interview content: supplied text, shown exactly as supplied (nothing is assessed)', {
  listTitle: str('Heading printed on the question list', 50),
  questions: list('Questions printed on the list, in order', str('Question', 90), 2, 4),
  account: str('The client’s account as supplied (shown in the speech bubble)', 170),
  clarification: str('The detail the client clarifies, as supplied (added to the account)', 90),
  clarifies: int('0-based index of the question whose answer clarifies the detail', 0, 3),
});

export const INTERVIEW_DEFAULTS = {
  actors: [
    {name: 'Rosa Delgado', role: 'Client'},
    {name: 'Kenji Arai', role: 'Interviewer'},
  ],
  roles: {client: 'Client', interviewer: 'Interviewer'},
  relationships: [
    {from: 'client', to: 'interviewer', kind: 'communication'},
    {from: 'interviewer', to: 'client', kind: 'communication'},
    {from: 'client', to: 'interviewer', kind: 'sequence'},
  ],
};

export const INTERVIEW_PROPS = {
  listTitle: 'Questions',
  questions: ['When did the parcel arrive?', 'When did you email the seller?', 'Did the seller reply?'],
  account: 'The parcel arrived damaged and I emailed the seller the same week.',
  clarification: 'The email was sent on day 3',
  clarifies: 1,
};

/** Built-in strings shared by the four entries. */
export const KIT_STRINGS = {
  en: {
    key: 'As supplied · no conclusion drawn',
    accountGiven: 'Account given',
    questionsAsked: 'Questions asked',
    detailClarified: 'Detail clarified',
    day: 'Day',
  },
  es: {
    key: 'Según lo aportado · sin conclusión',
    accountGiven: 'Relato expuesto',
    questionsAsked: 'Preguntas formuladas',
    detailClarified: 'Dato aclarado',
    day: 'Día',
  },
};

/**
 * Who opens the exchange: the `from` of the first sequence link between the
 * two people. Defaults to the client (account first).
 * @param {Array<{from:string,to:string,kind:string}>} relationships
 * @returns {'client'|'interviewer'}
 */
export function firstSpeaker(relationships) {
  const seq = (relationships || []).find(q => q.kind === 'sequence' && q.from !== q.to);
  return seq && seq.from === 'interviewer' ? 'interviewer' : 'client';
}

/** Role caption of a person, falling back to the party's own role. */
export function roleOf(p, id) {
  const i = id === 'client' ? 0 : 1;
  return (p.roles && p.roles[id]) || (p.actors[i] && p.actors[i].role) || '';
}

/** Chip caption "Name · role". */
export function captionOf(p, id, override) {
  const i = id === 'client' ? 0 : 1;
  const role = override || roleOf(p, id);
  return role ? `${p.actors[i].name} · ${role}` : p.actors[i].name;
}

/* ------------------------------------------------------------ question board */

/**
 * Measure a question board (clipboard) of width w (design units). Rows are
 * laid out from the fitted question text even when labels are hidden, so the
 * geometry never changes with text visibility.
 * @param {any} ctx
 * @param {{w:number, title:string, questions:string[], size:number, minSize:number, maxLines:number,
 *   strip?:{days:number, cell?:number}|null, slotH?:number, rows?:boolean}} o
 */
export function measureBoard(ctx, o) {
  const pad = Math.max(10, o.size * 0.62);
  const box = o.size * 1.1;
  const gap = pad * 0.55;
  const titleFit = fitWords(o.title || '—', {maxWidth: o.w - pad * 2, size: o.size * 1.08, minSize: o.minSize, maxLines: o.titleLines ?? 2, weight: 800});
  let y = pad * 1.15;
  const title = {y, fit: titleFit};
  y += titleFit.height + pad * 0.55;
  const ruleY = y;
  y += pad * 0.55;
  const textW = o.w - pad * 2 - box - gap;
  const rows = [];
  let truncated = titleFit.truncated;
  const qs = o.rows === false ? [] : o.questions;
  qs.forEach((q, i) => {
    const fit = fitWords(q, {maxWidth: textW, size: o.size, minSize: o.minSize, maxLines: o.maxLines, weight: 600});
    truncated = truncated || fit.truncated;
    const hh = Math.max(fit.height, box) + pad * 0.7;
    rows.push({i, y0: y, h: hh, cy: y + hh / 2, fit, textX: pad, textW, box: {x: o.w - pad - box, y: y + hh / 2 - box / 2, s: box}});
    y += hh;
  });
  let strip = null;
  let slot = null;
  const addStrip = () => {
    if (!o.strip) return;
    y += pad * 0.45;
    const n = o.strip.days;
    // optional narrower strip, right-aligned (towards the interviewer's pen hand)
    const sw = Math.min(o.w - pad * 2, o.strip.w ?? Infinity);
    const cw = sw / n;
    const ch = o.strip.cell ?? Math.min(cw * 1.05, o.size * 1.5);
    strip = {x: o.w - pad - sw, y, w: sw, h: ch, cw, n};
    y += ch + pad * 0.25;
  };
  const addSlot = () => {
    if (!o.slotH) return;
    y += pad * 0.35;
    slot = {x: pad, y, w: o.w - pad * 2, h: o.slotH};
    y += o.slotH;
  };
  // o.slotFirst: a note line (slot) above the strip
  if (o.slotFirst) { addSlot(); addStrip(); } else { addStrip(); addSlot(); }
  const hh = y + pad * 0.9;
  return {w: o.w, h: hh, pad, box, title, ruleY, rows, strip, slot, size: o.size, truncated, minSize: Math.min(...rows.map(q => q.fit.size), titleFit.size)};
}

/** Closed pen loop around strip cells [from..to] (1-based), board-local. */
export function stripLoop(S, span) {
  const a = clamp(Math.min(span.from, span.to), 1, S.n);
  const b = clamp(Math.max(span.from, span.to), 1, S.n);
  const x0 = S.x + (a - 1) * S.cw, x1 = S.x + b * S.cw;
  const cy = S.y + S.h / 2;
  const ry = S.h * 0.66;
  const rx = (x1 - x0) / 2 + S.cw * 0.14;
  const cx = (x0 + x1) / 2;
  const pts = [];
  // a hand-drawn loop: starts top-left, goes round once and overshoots a little
  const n = 56;
  const start = -2.35;
  for (let i = 0; i <= n; i++) {
    const t = start + (i / n) * (Math.PI * 2 + 0.5);
    // rounded-rectangle-ish loop (superellipse) so long spans stay close to the cells
    const c = Math.cos(t), s = Math.sin(t);
    const e = 0.55;
    const px = Math.sign(c) * Math.pow(Math.abs(c), e);
    const py = Math.sign(s) * Math.pow(Math.abs(s), e);
    const wob = 1 + 0.03 * Math.sin(i * 0.9);
    pts.push({x: cx + px * rx * wob, y: cy + py * ry * wob});
  }
  return polyline(pts);
}

/**
 * Question board (clipboard) node from a measured layout M. Local origin =
 * top-left of the paper. Named nodes: `${P}-hl${i}` (row highlight),
 * `${P}-tick${i}` (tick stroke), `${P}-mk-${key}` (strip marks).
 * @param {any} ctx
 * @param {string} P prefix
 * @param {ReturnType<typeof measureBoard>} M
 * @param {{showText:boolean, questions:string[], title:string, marks?:Record<string,{from:number,to:number}>, markColor?:string, dayLabels?:boolean}} o
 */
export function questionBoard(ctx, P, M, o) {
  const th = ctx.theme;
  const {w, h: hh, pad} = M;
  const board = '#8a6848';
  const m = pad * 0.55;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(-m + 6, -m * 1.8 + 9, w + m * 2, hh + m * 2.8, 12), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(-m, -m * 1.8, w + m * 2, hh + m * 2.8, 12), fill: board, stroke: INK, 'stroke-width': 2.6}));
  parts.push(h('path', {d: roundRectPath(0, 0, w, hh, 4), fill: th.paper, stroke: INK, 'stroke-width': 2}));
  // metal clip
  const cw = Math.min(w * 0.36, 120);
  parts.push(h('path', {d: roundRectPath(w / 2 - cw / 2, -m * 1.5, cw, m * 2.6, 6), fill: '#b9c1c8', stroke: INK, 'stroke-width': 2}));
  parts.push(h('path', {d: roundRectPath(w / 2 - cw * 0.25, -m * 0.9, cw * 0.5, m * 0.8, 3), fill: '#8b959e'}));
  // title
  const tf = M.title.fit;
  if (o.showText) parts.push(textBlock(tf, {x: pad, y: M.title.y, fill: th.ink, name: `${P}-title`}));
  else parts.push(h('rect', {x: pad, y: M.title.y + tf.size * 0.15, width: r(Math.min(tf.width, w * 0.5)), height: r(tf.size * 0.7), rx: 4, fill: th.ink, opacity: 0.85}));
  parts.push(h('line', {x1: pad, x2: w - pad, y1: M.ruleY, y2: M.ruleY, stroke: th.paperLine, 'stroke-width': 2}));
  // rows
  const hl = [], rowParts = [], ticks = [];
  const tickPaths = [];
  M.rows.forEach((row, i) => {
    hl.push(h('path', {name: `${P}-hl${i}`, d: roundRectPath(pad * 0.35, row.y0 + 2, w - pad * 0.7, row.h - 4, 6), fill: th.accent3Soft, stroke: th.accent3, 'stroke-width': 1.5, opacity: 0}));
    if (o.showText) {
      rowParts.push(textBlock(row.fit, {x: row.textX, y: row.cy - row.fit.height / 2, fill: th.ink, name: `${P}-q${i}`}));
    } else {
      // simulated lines of the question (same geometry as the text)
      row.fit.lines.forEach((ln, j) => {
        const lw = j === row.fit.lines.length - 1 ? row.textW * (0.35 + 0.4 * ctx.rng(`${P}-bar`, i * 5 + j)) : row.textW * (0.8 + 0.2 * ctx.rng(`${P}-bar`, i * 5 + j));
        rowParts.push(h('rect', {x: row.textX, y: r(row.cy - row.fit.height / 2 + j * row.fit.lineHeight + row.fit.size * 0.18), width: r(lw), height: r(row.fit.size * 0.62), rx: r(row.fit.size * 0.3), fill: th.paperLine}));
      });
    }
    const b = row.box;
    rowParts.push(h('rect', {x: r(b.x), y: r(b.y), width: r(b.s), height: r(b.s), rx: 4, fill: '#fff', stroke: INK, 'stroke-width': 2}));
    const tk = [{x: b.x + b.s * 0.18, y: b.y + b.s * 0.52}, {x: b.x + b.s * 0.42, y: b.y + b.s * 0.8}, {x: b.x + b.s * 0.98, y: b.y - b.s * 0.1}];
    const poly = polyline(tk);
    tickPaths.push(poly);
    ticks.push(h('path', {name: `${P}-tick${i}`, d: `M${r(tk[0].x)} ${r(tk[0].y)}L${r(tk[1].x)} ${r(tk[1].y)}L${r(tk[2].x)} ${r(tk[2].y)}`, fill: 'none', stroke: '#1d3f8f', 'stroke-width': r(Math.max(3, b.s * 0.14)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(poly.total)} ${r(poly.total + 10)}`, 'stroke-dashoffset': r(poly.total), opacity: 0}));
  });
  // day strip + pen marks
  const stripParts = [];
  const markPolys = {};
  if (M.strip) {
    const S = M.strip;
    for (let i = 0; i < S.n; i++) {
      stripParts.push(h('rect', {x: r(S.x + i * S.cw + 1.5), y: r(S.y), width: r(S.cw - 3), height: r(S.h), rx: 4, fill: i % 2 ? th.paperShade : '#fff', stroke: th.inkSoft, 'stroke-width': 1.6}));
      const ds = Math.min(S.h * 0.56, S.cw * 0.5);
      if (o.dayLabels && o.showText && ds >= 15) {
        const f = ctx.fit(String(i + 1), {maxWidth: S.cw, size: ds, minSize: ds, maxLines: 1, weight: 700});
        stripParts.push(textBlock(f, {x: S.x + (i + 0.5) * S.cw, y: S.y + S.h / 2 - f.size * 0.5, anchor: 'middle', fill: th.inkSoft}));
      } else {
        stripParts.push(h('circle', {cx: r(S.x + (i + 0.5) * S.cw), cy: r(S.y + S.h / 2), r: r(Math.max(2, Math.min(S.cw, S.h) * 0.09)), fill: th.inkFaint}));
      }
    }
    for (const [key, span] of Object.entries(o.marks || {})) {
      const poly = stripLoop(S, span);
      markPolys[key] = poly;
      stripParts.push(h('path', {name: `${P}-mk-${key}`, d: poly.d(1), fill: 'none', stroke: o.markColor || '#1d3f8f', 'stroke-width': r(Math.max(3, S.h * 0.11)), 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(poly.total)} ${r(poly.total + 10)}`, 'stroke-dashoffset': r(poly.total), opacity: 0}));
    }
  }
  const node = g({name: P}, parts, hl, rowParts, ticks, stripParts);
  return {
    node, M, tickPaths, markPolys,
    /** grip point for a hand holding the board's right edge (board-local) */
    grip: {x: w + m * 0.4, y: hh * (o.gripFrac ?? 0.42)},
    /**
     * @param {{ticks?:number[], hl?:number[], marks?:Record<string,{p:number, opacity?:number}>}} s
     */
    frame(s) {
      const out = {};
      M.rows.forEach((row, i) => {
        const tp = clamp((s.ticks && s.ticks[i]) || 0);
        // an unstarted stroke is hidden (a round cap would otherwise paint a dot at its start)
        out[`${P}-tick${i}`] = {'stroke-dashoffset': r(tickPaths[i].total * (1 - tp)), opacity: tp > 0 ? 1 : 0};
        out[`${P}-hl${i}`] = {opacity: r(clamp((s.hl && s.hl[i]) || 0), 3)};
      });
      for (const [key, poly] of Object.entries(markPolys)) {
        const mk = (s.marks && s.marks[key]) || {p: 0};
        out[`${P}-mk-${key}`] = {'stroke-dashoffset': r(poly.total * (1 - clamp(mk.p))), opacity: mk.p > 0 ? r(mk.opacity ?? 1, 3) : 0};
      }
      return out;
    },
  };
}

/* ------------------------------------------------------------------- stage */

/** Person-local geometry (units × k). */
export const STAGE = {
  tableFar: -80, tableNear: -30, boardBase: -50, boardGap: 100,
  restNearA: {x: 80, y: -42}, restFarA: {x: 64, y: -58},
  gestureA: {x: 132, y: -96},
  restPenB: {x: 50, y: -40},
};

/**
 * Interview table stage.
 * @param {any} ctx
 * @param {{prefix:string, k:number, A:{x:number,y:number}, X:number, crop:number, actors:any[], board:any, boardText:boolean,
 *   boardOpts?:object, penLen?:number, looks?:any[]}} o
 *   A: the client's seat point (design units); X: interviewer's seat offset in person-local units;
 *   board: a measureBoard() layout (design units); crop: person-local y of the panel bottom;
 *   boardGap: distance (person units) from the interviewer's seat to the board's right edge;
 *   boardExtra: extra board-local content drawn on the board (moves with it).
 */
export function interviewStage(ctx, o) {
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
  const looks = o.looks || [0, 1].map(i => actorLook(ctx, o.actors[i], i));
  const rigA = personRig(ctx, {name: `${P}-A`, look: looks[0], pose: 'seated'});
  const rigB = personRig(ctx, {name: `${P}-B`, look: looks[1], pose: 'seated'});

  // --- table (side view, cropped by the front panel)
  const x0 = Lx(-26), x1 = Lx(X + 26);
  const yFar = Ly(STAGE.tableFar), yNear = Ly(STAGE.tableNear);
  const inset = 16 * k;
  const edge = 9 * k;
  const yBottom = Ly(o.crop);
  const topPath = `M${r(x0 + inset)} ${r(yFar)}H${r(x1 - inset)}L${r(x1)} ${r(yNear)}H${r(x0)}Z`;
  const grain = [];
  for (let i = 0; i < 3; i++) {
    const gy = yFar + ((i + 0.7) / 3.6) * (yNear - yFar);
    const wob = (3 + ctx.rng(`${P}-grain`, i) * 5) * k;
    grain.push(h('path', {d: `M${r(x0 + inset * 1.5)} ${r(gy)}C${r(lerp(x0, x1, 0.35))} ${r(gy - wob)} ${r(lerp(x0, x1, 0.65))} ${r(gy + wob)} ${r(x1 - inset * 1.5)} ${r(gy - wob * 0.3)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.55}));
  }
  const tabletop = g({name: `${P}-top`},
    h('path', {d: topPath, fill: th.woodTop, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    grain,
    h('path', {d: `M${r(x0 + inset)} ${r(yFar + 4 * k)}H${r(x1 - inset)}`, stroke: '#fff', 'stroke-width': 3, opacity: 0.3}),
  );
  const panelTop = yNear + edge;
  // full-body staging (o.floor): the panel ends above the floor and the table
  // stands on two legs; otherwise the panel crops the scene at yBottom
  const panelBottom = o.floor ? Ly(o.panelLocal ?? 58) : yBottom;
  const legW = 20 * k;
  const tableFront = g({name: `${P}-front`},
    o.floor ? h('ellipse', {cx: r((x0 + x1) / 2), cy: r(yBottom - 2 * k), rx: r((x1 - x0) * 0.62), ry: r(9 * k), fill: th.shadow}) : null,
    o.floor ? h('rect', {x: r(x0 + 10 * k), y: r(panelBottom - 4), width: r(legW), height: r(yBottom - panelBottom), rx: r(4 * k), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}) : null,
    o.floor ? h('rect', {x: r(x1 - 10 * k - legW), y: r(panelBottom - 4), width: r(legW), height: r(yBottom - panelBottom), rx: r(4 * k), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}) : null,
    h('path', {d: roundRectPath(x0, yNear, x1 - x0, edge, 3 * k), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x0 + 6 * k)} ${r(panelTop)}H${r(x1 - 6 * k)}V${r(panelBottom)}H${r(x0 + 6 * k)}Z`, fill: th.wood, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(x0 + 22 * k, panelTop + 14 * k, x1 - x0 - 44 * k, Math.max(4, panelBottom - panelTop - (o.floor ? 28 : 14) * k + (o.floor ? 0 : 20)), 8 * k), fill: shade(th.wood, -0.06), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
  );

  // --- board, held upright in front of the interviewer (bottom-right pivot)
  const bd = questionBoard(ctx, `${P}-bd`, o.board, {showText: o.boardText, questions: o.boardOpts?.questions || [], title: o.boardOpts?.title || '', marks: o.boardOpts?.marks, dayLabels: o.boardOpts?.dayLabels, gripFrac: o.boardOpts?.gripFrac});
  const pivot0 = L({x: X - (o.boardGap ?? STAGE.boardGap), y: STAGE.boardBase});
  const bw = o.board.w, bh = o.board.h;
  const boardNode = g({name: `${P}-board`}, g({transform: T(-bw, -bh)}, bd.node, o.boardExtra || null));
  const boardAt = bp => {
    const px = pivot0.x + (bp.dx || 0) * k, py = pivot0.y + (bp.dy || 0) * k;
    const a = ((bp.rot || 0) * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    return {
      transform: T(px, py, bp.rot || 0),
      toWorld: q => {
        const lx = q.x - bw, ly = q.y - bh;
        return {x: px + lx * c - ly * s, y: py + lx * s + ly * c};
      },
      toLocal: q => {
        const dx = q.x - px, dy = q.y - py;
        return {x: dx * c + dy * s + bw, y: -dx * s + dy * c + bh};
      },
    };
  };
  /** board-local rectangle (at rest pose) in design units */
  const boardBox = {x: pivot0.x - bw, y: pivot0.y - bh, w: bw, h: bh};

  // --- pen in the interviewer's near hand
  const penLen = o.penLen ?? 46 * k;
  const pen = penProp(ctx, {name: `${P}-pen`, length: penLen, body: th.accent2});
  const PEN_ANG = -52;
  const pd = {x: Math.cos((PEN_ANG * Math.PI) / 180), y: Math.sin((PEN_ANG * Math.PI) / 180)};
  const gripVec = {x: pd.x * pen.grip, y: pd.y * pen.grip};
  const penNode = g({name: `${P}-penpos`}, pen.node);

  // the rigs (chairs, legs) are cropped at the bottom of the table's front panel
  const clip = `${P}-crop`;
  const node = g({name: P},
    h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('rect', {x: r(Lx(-400)), y: r(Ly(-600)), width: r((X + 800) * k), height: r(yBottom - Ly(-600))}))),
    tabletop, boardNode, penNode,
    g({'clip-path': ctx.ref(clip)}, rigA.node, rigB.node),
    tableFront);

  /** world rest targets */
  const rest = {
    nearA: L(STAGE.restNearA), farA: L(STAGE.restFarA), gestureA: L(o.gesture || STAGE.gestureA),
    penB: L({x: X - STAGE.restPenB.x, y: STAGE.restPenB.y}),
  };
  /** nib position when the near hand rests */
  rest.nibB = {x: rest.penB.x - gripVec.x, y: rest.penB.y - gripVec.y};

  /**
   * @param {object} s
   * @param {{near?:any, far?:any, lean?:number, mouth?:number, tilt?:number}} s.a  world targets
   * @param {{nib?:{x:number,y:number}, lean?:number, mouth?:number, tilt?:number}} s.b
   * @param {{dx?:number, dy?:number, rot?:number}} s.board  board pose (person-local units, degrees)
   * @param {object} s.boardState  questionBoard frame input
   */
  /** is a world point inside the board's paper (+pad) at pose bp? */
  const inRect = (q, bp, pad) => {
    const inv = bp.toLocal(q);
    return inv.x > -pad && inv.x < bw + pad && inv.y > -pad && inv.y < bh + pad;
  };
  function pose(s) {
    const nodes = {};
    const bp = boardAt(s.board || {});
    nodes[`${P}-board`] = {transform: bp.transform};
    Object.assign(nodes, bd.frame(s.boardState || {}));
    const boardGrip = bp.toWorld(bd.grip);
    const pa = rigA.frame({x: hipA.x, y: hipA.y, facing: 1, scale: k, lean: s.a.lean || 0, mouth: s.a.mouth || 0, headTilt: s.a.tilt || 0, near: s.a.near || rest.nearA, far: s.a.far || rest.farA});
    const nib = s.b.nib || rest.nibB;
    const pb = rigB.frame({x: hipB.x, y: hipB.y, facing: -1, scale: k, lean: s.b.lean || 0, mouth: s.b.mouth || 0, headTilt: s.b.tilt || 0, near: {x: nib.x + gripVec.x, y: nib.y + gripVec.y}, far: boardGrip});
    Object.assign(nodes, pa.nodes, pb.nodes);
    // pen from the SOLVED hand
    const hand = pb.hands.near;
    const penNib = {x: hand.x - gripVec.x, y: hand.y - gripVec.y};
    nodes[`${P}-penpos`] = {transform: T(penNib.x, penNib.y, PEN_ANG)};
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    // clearance (person units) between the interviewer's near forearm+hand and her face
    const fa = forearmClear(nodes, `${P}-B`, hipB, -1, k, pb.head);
    return {
      nodes,
      pa, pb, bp,
      semantic: {
        handA: P2(pa.hands.near),
        farA: P2(pa.hands.far),
        handB: P2(hand),
        gripB: P2(pb.hands.far),
        boardGrip: P2(boardGrip),
        pen: P2(penNib),
        allReached: pa.reached && pb.reached,
        reach: {a: pa.reached, b: pb.reached},
        // distance (person units) from the interviewer's pen hand to her face centre:
        // the hand works in front of the board, never over her own face
        handFaceB: r(Math.hypot(hand.x - pb.head.x, hand.y - pb.head.y) / k, 1),
        // the client's near hand stays off the board's paper (it never covers a question)
        handAOffBoard: !inRect(pa.hands.near, bp, 14 * k),
        forearmFaceB: r(fa, 1),
        // distance (person units) from the interviewer's board-holding hand to her face centre
        gripFaceB: r(Math.hypot(pb.hands.far.x - pb.head.x, pb.hands.far.y - pb.head.y) / k, 1),
      },
    };
  }

  // local anchors for bubbles / chips (seated rig: head centre (5,-176) r 36, mouth (35,-156))
  const headA = L({x: 5, y: -176}), headB = L({x: X - 5, y: -176});
  const mouthA = L({x: 38, y: -154}), mouthB = L({x: X - 38, y: -154});
  // speech-tail tips: just in front of the mouth, clear of the face (head r 36 at (5,-176))
  const tipA = L({x: 66, y: -134}), tipB = L({x: X - 66, y: -134});
  return {
    node, pose, bd, boardAt, boardBox, pivot0, looks, rest, gripVec,
    hipA, hipB, headA, headB, mouthA, mouthB, tipA, tipB, headR: 40 * k, headTopY: Ly(-226),
    /** is a speech-tail tip clear of a face (≥ 60 units from the head centre, level with the lips)? */
    tipClear: (tip, who) => {
      const hc = who === 'a' ? headA : headB;
      return Math.hypot(tip.x - hc.x, tip.y - hc.y) / k >= 60 && tip.y > hc.y + 20 * k;
    },
    table: {x0, x1, yFar, yNear, panelTop, panelBottom, yBottom},
    /** world box of each person (seated, cropped at the panel bottom) */
    /** world box of each person above the table (the panel hides the rest) */
    personBox: id => (id === 'a'
      ? {x: Lx(-66), y: Ly(-228), w: 66 * k + 150 * k, h: yNear - Ly(-228)}
      : {x: Lx(X - 150), y: Ly(-228), w: 216 * k, h: yNear - Ly(-228)}),
    /** chairs beside the panel (art below the tabletop outside the panel) */
    chairBoxes: () => [{x: Lx(-70), y: yNear, w: x0 - Lx(-70), h: yBottom - yNear}, {x: x1, y: yNear, w: Lx(X + 70) - x1, h: yBottom - yNear}],
    Lx, Ly, L, k,
  };
}

/**
 * Distance (person units) from a rig's face centre to its near forearm segment
 * (elbow → hand), from the solved arm lines in the frame record.
 */
function forearmClear(nodes, N, hip, facing, k, headW) {
  const u = nodes[`${N}-near-u`], l = nodes[`${N}-near-l`];
  if (!u || !l) return Infinity;
  const W = (x, y) => ({x: hip.x + x * facing * k, y: hip.y + y * k});
  const a = W(u.x2, u.y2), b = W(l.x2, l.y2);
  // extend to the hand tip (mitten ~ 20 units past the wrist)
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const c = {x: b.x + ((b.x - a.x) / len) * 20 * k, y: b.y + ((b.y - a.y) / len) * 20 * k};
  const dx = c.x - a.x, dy = c.y - a.y;
  const t = clamp(((headW.x - a.x) * dx + (headW.y - a.y) * dy) / (dx * dx + dy * dy || 1));
  return Math.hypot(a.x + dx * t - headW.x, a.y + dy * t - headW.y) / k;
}

/* ------------------------------------------------------------------ bubbles */

/** Vertical gap between the addendum label and its text (× pad). */
export const LABEL_GAP = 0.5;
/** Height of the addendum body (marker, label, text). */
export function extraBodyH(ex, pad) {
  const labH = ex.label ? ex.label.height + pad * LABEL_GAP : 0;
  return Math.max(ex.markerR * 2, labH + ex.text.height);
}

/**
 * Speech bubble whose tail (on the bottom edge) points at a mouth. It holds a
 * main text (the account) and an optional addendum (changed-datum marker,
 * label and the clarified detail) revealed by growing the bubble upward.
 * Layout is measured by the caller (fits), so text is never cut.
 * @param {any} ctx
 * @param {{name:string, x:number, w:number, bottom:number, tip:{x:number,y:number}, pad:number, main:any, extra?:{label:any, text:any, markerR:number}|null,
 *   showText:boolean, stroke?:string, gap?:number}} o
 */
export function talkBubble(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const {x, w, bottom, pad} = o;
  const gap = o.gap ?? pad * 0.7;
  const mainH = o.main.height;
  const h0 = pad * 2 + mainH;
  let extraH = 0;
  let extraNode = null;
  const ex = o.extra;
  if (ex) {
    extraH = gap + extraBodyH(ex, pad);
    const ey = pad + mainH + gap;
    const mx = pad + ex.markerR;
    const tx = pad + ex.markerR * 2 + pad * 0.5;
    const parts = [
      h('line', {x1: r(x + pad), x2: r(x + w - pad), y1: r(ey - gap * 0.5), y2: r(ey - gap * 0.5), stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '6 6'}),
      changedMarker(ctx, {name: `${N}-mark`, x: x + mx, y: ey + ex.markerR, radius: ex.markerR}),
    ];
    if (o.showText) {
      if (ex.label) parts.push(textBlock(ex.label, {x: x + tx, y: ey, fill: th.accent2, name: `${N}-xlabel`}));
      parts.push(textBlock(ex.text, {x: x + tx, y: ey + (ex.label ? ex.label.height + pad * LABEL_GAP : 0), fill: th.ink, name: `${N}-xtext`}));
    } else {
      ex.text.lines.forEach((ln, j) => {
        parts.push(h('rect', {x: r(x + tx), y: r(ey + j * ex.text.lineHeight + ex.text.size * 0.2), width: r((w - tx - pad) * (j === ex.text.lines.length - 1 ? 0.55 : 0.9)), height: r(ex.text.size * 0.6), rx: r(ex.text.size * 0.3), fill: th.inkSoft, opacity: 0.8}));
      });
    }
    extraNode = g({name: `${N}-extra`, opacity: 0}, parts);
  }
  const h1 = h0 + extraH;
  const rr = Math.min(30, h0 * 0.3);
  const bw = Math.min(48, w * 0.14);
  const tip = o.tip;
  const bx = clamp(o.tailBaseX ?? tip.x, x + rr + bw / 2 + 4, x + w - rr - bw / 2 - 4);
  const pathAt = top => `M${r(x + rr)} ${r(top)}H${r(x + w - rr)}Q${r(x + w)} ${r(top)} ${r(x + w)} ${r(top + rr)}V${r(bottom - rr)}Q${r(x + w)} ${r(bottom)} ${r(x + w - rr)} ${r(bottom)}`
    + `H${r(bx + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(bx - bw / 2)} ${r(bottom)}H${r(x + rr)}Q${r(x)} ${r(bottom)} ${r(x)} ${r(bottom - rr)}V${r(top + rr)}Q${r(x)} ${r(top)} ${r(x + rr)} ${r(top)}Z`;
  const stroke = o.stroke ?? INK;
  // main content in bubble-local y (top = 0); the group is translated to the current top
  let mainNode;
  const mf = o.main;
  const lines = [];
  if (o.showText) {
    mainNode = g({name: `${N}-main`}, textBlock(mf, {x: x + pad, y: pad, fill: th.ink, name: `${N}-txt`, opacity: 0}));
  } else {
    mf.lines.forEach((ln, j) => {
      const len = (w - pad * 2) * (j === mf.lines.length - 1 ? 0.5 + 0.2 * ctx.rng(`${N}-l`, j) : 0.85 + 0.15 * ctx.rng(`${N}-l`, j));
      lines.push({y: pad + j * mf.lineHeight + mf.size * 0.5, len});
    });
    const lw = Math.max(8, mf.size * 0.55);
    mainNode = g({name: `${N}-main`}, lines.map((l, j) => h('line', {name: `${N}-w${j}`, x1: r(x + pad), x2: r(x + pad + l.len), y1: r(l.y), y2: r(l.y), stroke: th.inkSoft, 'stroke-width': r(lw), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(l.len)} ${r(l.len + 30)}`, 'stroke-dashoffset': r(l.len), opacity: 0.8})));
  }
  const node = g({name: N, opacity: 0},
    h('path', {name: `${N}-shadow`, d: pathAt(bottom - h0), fill: th.shadow, transform: T(6, 8)}),
    h('path', {name: `${N}-bg`, d: pathAt(bottom - h0), fill: th.card, stroke, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    g({name: `${N}-mainpos`, transform: T(0, bottom - h0)}, mainNode),
    extraNode ? g({name: `${N}-extrapos`, transform: T(0, bottom - h0)}, extraNode) : null,
  );
  return {
    node, h0, h1, tip,
    /** final (grown) box */
    box: {x, y: bottom - h1, w, h: h1},
    box0: {x, y: bottom - h0, w, h: h0},
    /**
     * @param {number} open 0..1   grows from the tail tip
     * @param {number} words 0..1  main text / speech lines appear
     * @param {number} grow 0..1   bubble grows upward to hold the addendum
     * @param {number} extra 0..1  addendum opacity
     * @param {boolean} reduced
     */
    frame(open, words, grow, extra, reduced) {
      const out = {};
      const kk = open <= 0 ? 0.3 : 0.3 + 0.7 * (reduced ? ease.outCubic(open) : ease.outBack(open));
      out[N] = {opacity: r(clamp(open * 3), 3), transform: open >= 1 ? '' : scaleAbout(tip.x, tip.y, kk)};
      const top = bottom - lerp(h0, h1, ease.inOutCubic(clamp(grow)));
      out[`${N}-bg`] = {d: pathAt(top)};
      out[`${N}-shadow`] = {d: pathAt(top)};
      out[`${N}-mainpos`] = {transform: T(0, top)};
      if (o.showText) out[`${N}-txt`] = {opacity: r(clamp(words * 3), 3)};
      else lines.forEach((l, j) => { out[`${N}-w${j}`] = {'stroke-dashoffset': r(l.len * (1 - clamp(words * lines.length - j)))}; });
      if (extraNode) {
        out[`${N}-extrapos`] = {transform: T(0, top)};
        out[`${N}-extra`] = {opacity: r(clamp(extra), 3)};
      }
      return out;
    },
  };
}

/**
 * Small question bubble with a drawn question-mark glyph (a shape, not text:
 * it stays visible with labels hidden). Local: centre c, radius R, tail to tip.
 * @param {any} ctx
 * @param {{name:string, c:{x:number,y:number}, R:number, tip:{x:number,y:number}, stroke?:string}} o
 */
export function askBubble(ctx, o) {
  const th = ctx.theme;
  const {c, R, tip} = o;
  const w = R * 2.3, hh = R * 1.9;
  const x = c.x - w / 2, y = c.y - hh / 2;
  const rr = hh * 0.42;
  const ang = Math.atan2(tip.y - c.y, tip.x - c.x);
  const bw = R * 0.55;
  // tail base on the bubble outline nearest the tip (bottom edge)
  const bx = clamp(o.baseX ?? c.x + Math.cos(ang) * w * 0.3, x + rr, x + w - rr);
  const d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
    + `H${r(bx + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(bx - bw / 2)} ${r(y + hh)}H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  const s = R * 0.62;
  const q = `M${r(c.x - s * 0.55)} ${r(c.y - s * 0.45)}C${r(c.x - s * 0.55)} ${r(c.y - s * 1.05)} ${r(c.x + s * 0.6)} ${r(c.y - s * 1.1)} ${r(c.x + s * 0.58)} ${r(c.y - s * 0.45)}C${r(c.x + s * 0.56)} ${r(c.y - s * 0.05)} ${r(c.x)} ${r(c.y + s * 0.02)} ${r(c.x)} ${r(c.y + s * 0.38)}`;
  const node = g({name: o.name, opacity: 0},
    h('path', {d, fill: th.shadow, transform: T(5, 7)}),
    h('path', {d, fill: th.card, stroke: o.stroke ?? INK, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    h('path', {d: q, fill: 'none', stroke: th.accent2, 'stroke-width': r(R * 0.2), 'stroke-linecap': 'round'}),
    h('circle', {cx: r(c.x), cy: r(c.y + s * 0.78), r: r(R * 0.12), fill: th.accent2}),
  );
  return {
    node, box: {x, y, w, h: hh},
    frame(open, reduced) {
      const kk = open <= 0 ? 0.3 : 0.3 + 0.7 * (reduced ? ease.outCubic(open) : ease.outBack(open));
      return {[o.name]: {opacity: r(clamp(open * 3), 3), transform: open >= 1 ? '' : scaleAbout(tip.x, tip.y, kk)}};
    },
  };
}

/* ------------------------------------------------------------------ helpers */

/** Does segment p→q cross box b? (sampled) */
export function segHits(p, q, b) {
  const n = 16;
  for (let i = 1; i < n; i++) {
    const x = p.x + ((q.x - p.x) * i) / n, y = p.y + ((q.y - p.y) * i) / n;
    if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) return true;
  }
  return false;
}

/** Best candidate position (x,y) for a w×h box inside bounds and clear of obstacles (lowest score wins; first clear one without a score). */
export function freeSpot(cands, w, hh, obstacles, bounds, pad = 10, score) {
  let best = null, bestS = Infinity;
  for (const c of cands) {
    const b = {x: c.x, y: c.y, w, h: hh};
    if (b.x < bounds.x || b.y < bounds.y || b.x + w > bounds.x + bounds.w || b.y + hh > bounds.y + bounds.h) continue;
    if (obstacles.some(o => overlaps(b, o, pad))) continue;
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

/** Neutral key chip ("as supplied · no conclusion drawn"). */
export function keyChip(ctx, text, o) {
  return wchip(ctx, text, {weight: 600, fill: ctx.theme.card, stroke: ctx.theme.inkSoft, color: ctx.theme.ink, ...o});
}

/** Mouth flap (0..~0.8) that honours reduced motion. */
export function flap(timeMs, reduced, phase = 0) {
  return reduced ? 0.55 : 0.25 + 0.55 * Math.abs(Math.sin(timeMs * 0.0145 + phase));
}

