/**
 * Kit for the "Condiciones acumulativas" motif (LAW-0097..0100): field set,
 * strings, geometry and original vector parts. Each entry owns its own
 * timeline, composition and semantics; this file only measures and draws.
 *
 * Physical metaphor — a GEAR BOARD that only turns as a whole
 *  - RULE (regla)       a slate board with a brass header (the rule caption
 *                       as supplied) and one brass plate per listed
 *                       condition. Each condition has a pocket with an axle
 *                       peg on the gear line. The board owns the drive gear
 *                       (with a crank) at one end and the output gear (with a
 *                       quarter dial) at the other.
 *  - FACT (hecho)       a paper piece: a wide panel printing the supplied
 *                       fact and a tab carrying a coloured gear (pips on the
 *                       hub = which condition it belongs to). Seated in its
 *                       pocket, its gear meshes with both neighbours.
 *  - CONNECTOR          the gear line itself: drive → every piece → output.
 *    (conector)         Turning the crank moves the dial only when every
 *                       pocket holds a seated piece; with a pocket empty
 *                       (pending) or a piece not seated (disputed) the motion
 *                       stops at the gap. Which state applies is SUPPLIED by
 *                       the author (piece status), never inferred.
 *  - LUPA               a hand magnifier (glass + handle) whose lens shows a
 *                       real enlarged copy of what lies under it.
 * Panels alternate sides of the gear line, so each fact gets twice the gear
 * spacing for its text. Layout axis: `row` (gear line horizontal, panels
 * above/below) or `column` (gear line vertical, panels left/right).
 * Nothing here decides whether a rule applies, whether a condition is met in
 * law or what the outcome is. Texts are fictional, jurisdiction unspecified.
 * @module animations/reasoning/kits/condiciones-acumulativas
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, oneOf, list, obj} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';

export const STATUSES = ['supplied', 'pending', 'disputed'];
const DEG = Math.PI / 180;
const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* Strings (built-in labels; user content is never translated)         */
/* ------------------------------------------------------------------ */
export const CA_STRINGS = {
  en: {
    ruleKind: 'Rule · as supplied',
    condition: 'Condition',
    fact: 'Fact',
    piece: 'Piece',
    supplied: 'Supplied',
    pending: 'Pending',
    disputed: 'Disputed',
    allSupplied: 'All pieces supplied (as supplied)',
    piecePending: 'Piece {k} pending · incomplete as supplied',
    piecesPending: 'Pieces {k} pending · incomplete as supplied',
    pieceDisputed: 'Piece {k} disputed · not resolved here',
    notSeated: 'not seated',
    noFact: 'No fact supplied',
    issue: 'Issue',
    assumption: 'Assumption',
    connector: 'Connector (gear line)',
    output: 'Joint dial',
    stopsHere: 'motion stops here',
    turns: 'turns as a whole',
    connections: 'Connections (as supplied)',
    pendingPiece: 'Pending · no piece yet',
    disputedPiece: 'Disputed · not seated',
    sameBoth: 'Same in A and B',
    status: 'Status',
    factOn: 'Fact on piece {k}',
    statusOf: 'Piece {k} status',
    context: 'Context',
    noConclusion: 'States as supplied · no conclusion is drawn',
    legendTitle: 'Conditions and facts (as supplied)',
  },
  es: {
    ruleKind: 'Regla · según lo aportado',
    condition: 'Condición',
    fact: 'Hecho',
    piece: 'Pieza',
    supplied: 'Aportada',
    pending: 'Pendiente',
    disputed: 'Discutida',
    allSupplied: 'Todas las piezas aportadas (según lo aportado)',
    piecePending: 'Pieza {k} pendiente · incompleto según lo aportado',
    piecesPending: 'Piezas {k} pendientes · incompleto según lo aportado',
    pieceDisputed: 'Pieza {k} discutida · no se resuelve aquí',
    notSeated: 'sin encajar',
    noFact: 'Sin hecho aportado',
    issue: 'Cuestión',
    assumption: 'Supuesto',
    connector: 'Conector (tren de engranajes)',
    output: 'Esfera conjunta',
    stopsHere: 'el movimiento se detiene aquí',
    turns: 'gira como un todo',
    connections: 'Conexiones (según lo aportado)',
    pendingPiece: 'Pendiente · aún sin pieza',
    disputedPiece: 'Discutida · sin encajar',
    sameBoth: 'Igual en A y B',
    status: 'Estado',
    factOn: 'Hecho de la pieza {k}',
    statusOf: 'Estado de la pieza {k}',
    context: 'Contexto',
    noConclusion: 'Estados según lo aportado · no se extrae ninguna conclusión',
    legendTitle: 'Condiciones y hechos (según lo aportado)',
  },
};

/** Fill a "{k}" placeholder. */
export const fill = (s, k) => String(s).replace('{k}', String(k));

/* ------------------------------------------------------------------ */
/* Category field set (reasoning): facts, rules, issues, assumptions   */
/* ------------------------------------------------------------------ */
export const factPiece = obj('Fact piece for the condition at the same position (fictional, as supplied)', {
  label: str('Fact as supplied (fictional; printed on the piece)', 110),
  status: oneOf('Status SUPPLIED by the author: supplied (piece seated) | pending (no piece yet; the pocket stays empty) | disputed (piece brought but not seated; not resolved here)', STATUSES),
}, ['label', 'status']);

export const caFields = {
  rules: obj('The rule as supplied: its caption and its cumulative conditions, in order (illustrative text, never a statement of any law)', {
    name: str('Rule caption printed on the brass header (fictional)', 120),
    conditions: list('Cumulative conditions listed by the rule; each gets a pocket on the gear line', str('Condition', 90), 2, 5),
  }, ['name', 'conditions']),
  facts: list('Fact pieces in the same order as the conditions; a condition without a piece is treated as pending', factPiece, 0, 5),
  issues: list('Question framed by the author, shown on a note (never answered by the animation)', str('Issue', 110), 0, 1),
  assumptions: list('Working assumptions supplied by the author, shown on the same note (not verified)', str('Assumption', 110), 0, 2),
};

/** Fictional default content shared by the four entries. */
export const CA_DEFAULTS = {
  rules: {
    name: 'Rule R-1 (fictional club rule): booking the hall',
    conditions: ['Booking form signed', 'Deposit paid (hypothetical amount)', 'Requested date free in the calendar'],
  },
  facts: [
    {label: 'Form signed by member M. Okafor on Day 2', status: 'supplied'},
    {label: 'Receipt D-12 for the deposit (hypothetical)', status: 'supplied'},
    {label: 'Club calendar shows Day 9 as free', status: 'supplied'},
  ],
  issues: ['Which pieces of Rule R-1 have been supplied?'],
  assumptions: ['Facts are taken as supplied; none is verified here'],
};

/**
 * Resolve the slots: one per condition; the fact at the same index (or a
 * pending placeholder). `override` replaces statuses by slot index.
 * @param {{rules:{name:string,conditions:string[]}, facts:Array<{label:string,status:string}>}} p
 * @param {Record<number,string>} [override]
 */
export function resolveSlots(p, override = {}) {
  const conds = p.rules.conditions;
  const slots = conds.map((c, i) => {
    const f = p.facts[i];
    const status = override[i] ?? (f ? f.status : 'pending');
    return {i, condition: c, fact: f ? f.label : '', hasFact: Boolean(f && f.label), status};
  });
  const firstBreak = slots.findIndex(s => s.status !== 'supplied');
  return {
    n: slots.length,
    slots,
    breakAt: firstBreak,           // -1 = every piece seated
    complete: firstBreak === -1,
    pending: slots.filter(s => s.status === 'pending').map(s => s.i),
    disputed: slots.filter(s => s.status === 'disputed').map(s => s.i),
  };
}

/** Human-readable state line for the final hold (descriptive only). */
export function stateLine(t, res) {
  if (res.complete) return t.allSupplied;
  if (res.pending.length > 1) return fill(t.piecesPending, res.pending.map(i => i + 1).join(', '));
  if (res.pending.length === 1) return fill(t.piecePending, res.pending[0] + 1);
  return fill(t.pieceDisputed, res.disputed[0] + 1);
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */
export function caColors(ctx) {
  const th = ctx.theme;
  return {
    slots: [th.accent2, th.accent4, th.accent3, th.cloth[3], th.accent],
    board: '#50667a',
    boardDark: '#34465a',
    boardLine: '#6f8497',
    pocket: '#42576b',
    brass: '#dcbb6e',
    brassDark: '#a17f36',
    metal: '#b6c0c8',
    metalDark: '#6c7985',
    peg: '#dfe5ea',
    knob: '#8e5a3c',
    paper: th.paper,
    ink: th.ink,
    dialFace: '#eef1f3',
  };
}
export const slotColor = (ctx, i) => caColors(ctx).slots[i % 5];

/* ------------------------------------------------------------------ */
/* Gear geometry                                                       */
/* ------------------------------------------------------------------ */
/**
 * Spur-gear parameters for pitch radius R (all gears of a board share R).
 * @param {number} R
 */
export function gearSpec(R) {
  const T0 = Math.max(12, Math.min(28, Math.round(R / 5.4)));
  const m = (2 * R) / T0;
  return {R, T: T0, ra: R + m * 0.95, rr: R - m * 1.15, p: 360 / T0};
}

/** Closed outline of a spur gear centred at the origin (tooth centred at 0°). */
export function gearPath(G) {
  const {T: n, ra, rr} = G;
  const p = (2 * Math.PI) / n;
  const P = (rad, a) => `${r(rad * Math.cos(a))} ${r(rad * Math.sin(a))}`;
  let d = '';
  for (let k = 0; k < n; k++) {
    const c = k * p;
    const a0 = c - 0.28 * p, a1 = c - 0.14 * p, a2 = c + 0.14 * p, a3 = c + 0.28 * p, a4 = c + p - 0.28 * p;
    d += (k === 0 ? `M${P(rr, a0)}` : '') + `L${P(ra, a1)}A${r(ra)} ${r(ra)} 0 0 1 ${P(ra, a2)}L${P(rr, a3)}A${r(rr)} ${r(rr)} 0 0 1 ${P(rr, a4)}`;
  }
  return `${d}Z`;
}

const circlePath = (cx, cy, rad) => `M${r(cx - rad)} ${r(cy)}a${r(rad)} ${r(rad)} 0 1 0 ${r(2 * rad)} 0a${r(rad)} ${r(rad)} 0 1 0 ${r(-2 * rad)} 0Z`;

/**
 * Mesh phases along a chain of gear centres (same size gears): gear j gets
 * the rotation offset that places a tooth gap where gear i has a tooth, for
 * any direction between their centres; rotation signs alternate.
 * @param {Array<{x:number,y:number}>} centers
 * @param {{p:number}} G
 */
export function meshPhases(centers, G) {
  const out = [{phase: 0, sign: 1}];
  const mod = (a, m) => ((a % m) + m) % m;
  for (let i = 1; i < centers.length; i++) {
    const a = Math.atan2(centers[i].y - centers[i - 1].y, centers[i].x - centers[i - 1].x) / DEG;
    const prev = out[i - 1];
    out.push({phase: mod(2 * a + 180 - prev.phase + G.p / 2, G.p), sign: -prev.sign});
  }
  return out;
}

/** Die-face pip offsets (unit square) for 1..5. */
const PIPS = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
};
/** Pips group (no text: identifies a condition with labels hidden). */
export function pips(k, spread, dot, color) {
  return g(null, (PIPS[k] || PIPS[1]).map(([a, b]) => h('circle', {cx: r(a * spread), cy: r(b * spread), r: r(dot), fill: color})));
}

/**
 * Gear art. Outer group `name` (placement), inner group `${name}-rot`
 * (rotation). Colour gear with a light hub carrying pips, or a metal
 * board gear; optional crank (drive) and pointer mount.
 * @param {any} ctx
 * @param {{name:string, G:any, fill:string, k?:number, crank?:boolean, crankAngle?:number, dashed?:boolean, hub?:string}} o
 */
export function gearArt(ctx, o) {
  const G = o.G;
  const R = G.R;
  const C = caColors(ctx);
  const holes = [];
  const nh = R > 70 ? 5 : 4;
  for (let i = 0; i < nh; i++) {
    const a = (i / nh) * 2 * Math.PI + 0.3;
    holes.push(circlePath(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, R * 0.16));
  }
  const body = gearPath(G) + holes.join('');
  const hubR = R * 0.34;
  const outline = o.dashed ? {'stroke-dasharray': '7 6'} : {};
  const parts = [
    h('path', {d: body, 'fill-rule': 'evenodd', fill: o.fill, stroke: C.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round', ...outline}),
    h('circle', {r: r(R * 0.8), fill: 'none', stroke: shade(o.fill, -0.2), 'stroke-width': 2, opacity: 0.7}),
    h('circle', {r: r(hubR), fill: o.hub ?? shade(o.fill, 0.72), stroke: C.ink, 'stroke-width': 2.2}),
  ];
  if (o.k) parts.push(pips(o.k, hubR * 0.46, Math.max(3, hubR * 0.15), shade(o.fill, -0.35)));
  else parts.push(h('circle', {r: r(hubR * 0.3), fill: C.metalDark, stroke: C.ink, 'stroke-width': 1.5}));
  if (o.crank) {
    const kr = R * 0.66;
    parts.push(g({transform: `rotate(${r(o.crankAngle ?? 0)})`},
      h('path', {d: `M0 ${r(-R * 0.1)}L${r(kr)} ${r(-R * 0.07)}L${r(kr)} ${r(R * 0.07)}L0 ${r(R * 0.1)}Z`, fill: C.metalDark, stroke: C.ink, 'stroke-width': 2}),
      h('circle', {cx: r(kr), cy: 0, r: r(Math.max(9, R * 0.15)), fill: C.knob, stroke: C.ink, 'stroke-width': 2.4}),
      h('circle', {cx: r(kr - R * 0.04), cy: r(-R * 0.04), r: r(Math.max(3, R * 0.05)), fill: '#ffffff', opacity: 0.35}),
    ));
  }
  return {node: g({name: o.name}, g({name: `${o.name}-rot`}, parts)), knobR: R * 0.66};
}

/* ------------------------------------------------------------------ */
/* Board planner                                                       */
/* ------------------------------------------------------------------ */
/**
 * Plan a gear board inside `box` (absolute design units). The largest pitch
 * radius that fits is chosen; texts are measured with ctx.fit.
 * @param {any} ctx
 * @param {object} o
 * @param {number} o.n                      number of conditions (2..5)
 * @param {'row'|'column'} o.axis
 * @param {{x:number,y:number,w:number,h:number}} o.box
 * @param {'start'|'top'|'none'} [o.header]  rule header before the drive (row: left block) or on top
 * @param {string} [o.ruleName]
 * @param {string[]} o.conds
 * @param {string[]} o.facts                ('' = no fact text)
 * @param {{fact?:number, cond?:number, header?:number}} [o.sizes]
 * @param {number} [o.explode=0]            extra room on both sides of the panels (exploded pieces)
 * @param {number} [o.maxR=170]
 * @param {boolean} [o.text=true]           measure/print texts (false = pips only)
 * @param {number} [o.maxD=440]             column axis: max panel depth
 * @param {number} [o.condLines=3]          max lines on a condition plate
 * @param {number} [o.factLines=4]          row axis: max lines on a fact panel
 * @param {number} [o.floorK=0.55]          gears may drop to floorK·maxR before any text shrinks
 * @param {boolean} [o.strictPanel=false] column axis: reject sizes whose fact text is taller than its panel
 * @param {boolean} [o.bare=false]          text-free board (text: false): panel and plate depths
 *                                          scale with the gears instead of a fixed text depth
 */
export function planBoard(ctx, o) {
  const n = o.n;
  const row = o.axis === 'row';
  const S = o.sizes || {};
  let fs = S.fact ?? 24, cs = S.cond ?? 22, hs = S.header ?? 28;
  const box = o.box;
  const explode = o.explode ?? 0;
  const headerMode = o.header ?? 'start';
  const textOn = o.text !== false;
  const showKey = ctx.show('key') && textOn;
  const pad = 16;
  const gp = 8;

  const measure = R => {
    const G = gearSpec(R);
    const gap = Math.max(10, 0.1 * R);
    const vIn = G.ra + 8;
    const px = Math.max(12, fs * 0.55), py = Math.max(9, fs * 0.42);
    const stripe = 8;
    let badge = Math.max(26, cs * 1.35);
    const HW = 2 * R - gap / 2; // half length of a holder along the gear line
    let D, ph, condFits, factFits;
    let panelShort = false;
    const condFit = (c, mw, ml) => (showKey && c ? ctx.fit(c, {maxWidth: mw, size: cs, minSize: cs * 0.8, maxLines: ml, weight: 600}) : null);
    const factFit = (f, mw, ml) => (showKey && f ? ctx.fit(f, {maxWidth: mw, size: fs, minSize: fs * 0.8, maxLines: ml, weight: 500}) : null);
    if (row && o.bare && !showKey) {
      // compact text-free holders: a paper strip and a pip plate proportional to the gears
      condFits = o.conds.map(() => null);
      factFits = o.facts.map(() => null);
      badge = clamp(R * 0.42, 14, 44);
      ph = badge + 10;
      D = Math.max(12, R * 0.62);
    } else if (row) {
      condFits = o.conds.map(c => condFit(c, 2 * HW - 2 * px - badge - 10, o.condLines ?? 3));
      ph = Math.max(badge, ...condFits.map(f => (f ? f.height : 0))) + 2 * py;
      factFits = o.facts.map(f => factFit(f, 2 * HW - 2 * px, o.factLines ?? 4));
      D = Math.max(fs * 2.2, ...factFits.map(f => (f ? f.height : 0))) + 2 * py + stripe;
    } else {
      D = clamp((box.w - 2 * explode - 2 * vIn - 2 * pad) / 2, 150, o.maxD ?? 440);
      condFits = o.conds.map(c => condFit(c, D - 2 * px - badge - 10, o.condLines ?? 3));
      ph = Math.max(badge, ...condFits.map(f => (f ? f.height : 0))) + 2 * py;
      const PL = 2 * HW - ph - gp;
      const ml = clamp(Math.floor((PL - 2 * py - stripe) / (fs * 1.18)), 2, 7);
      factFits = o.facts.map(f => factFit(f, D - 2 * px - stripe, ml));
      // strictPanel: every fact must also fit the panel's height (no text spilling off a card)
      if (o.strictPanel) panelShort = factFits.some(f => f && f.height > PL - 2 * py + 2);
    }
    const vOuter = row ? vIn + D + gp + ph : vIn + D;
    let uMin = -G.ra - pad, uMax = 2 * R * (n + 1) + G.ra + pad;
    let vMin = -vOuter - pad - explode, vMax = vOuter + pad + explode;
    // header
    let header = null;
    if (headerMode !== 'none' && o.ruleName) {
      if (row && headerMode === 'start') {
        const hw = clamp(box.w * 0.17, 190, 300);
        const f = showKey ? ctx.fit(o.ruleName, {maxWidth: hw - 2 * px, size: hs, minSize: hs * 0.72, maxLines: 7, weight: 700}) : null;
        const tag = showKey ? ctx.fit(ctx.t.ruleKind, {maxWidth: hw - 2 * px, size: Math.max(18, hs * 0.66), minSize: 15, maxLines: 2, weight: 600}) : null;
        header = {mode: 'start', w: hw, fit: f, tag, need: (f ? f.height : 0) + (tag ? tag.height + 12 + tag.size * 0.35 : 0) + 2 * py + 20};
        uMin -= hw + pad;
      } else {
        // plaque width = the board itself (never the explode room beside it)
        const bw = row ? uMax - uMin : vMax - vMin - 2 * explode;
        const f = showKey ? ctx.fit(o.ruleName, {maxWidth: bw - 2 * px, size: hs, minSize: hs * 0.72, maxLines: 3, weight: 700}) : null;
        const tag = showKey ? ctx.fit(ctx.t.ruleKind, {maxWidth: bw - 2 * px, size: Math.max(18, hs * 0.66), minSize: 15, maxLines: 1, weight: 600}) : null;
        const hh = Math.max(56, (f ? f.height : 0) + (tag ? tag.height + 12 + tag.size * 0.35 : 0) + 2 * py);
        header = {mode: 'top', h: hh, fit: f, tag};
        if (row) vMin -= hh + pad;
        else uMin -= hh + pad;
      }
    }
    const w = row ? uMax - uMin : vMax - vMin;
    const hgt = row ? vMax - vMin : uMax - uMin;
    const headerOk = !header || header.mode !== 'start' || header.need <= vMax - vMin - 2 * pad - 2 * explode;
    const trunc = [...condFits, ...factFits, header && header.fit].some(f => f && f.truncated);
    const geomOk = w <= box.w + 0.5 && hgt <= box.h + 0.5 && headerOk && !panelShort;
    return {R, G, gap, vIn, px, py, stripe, badge, HW, D, ph, condFits, factFits, vOuter, uMin, uMax, vMin, vMax, header, w, h: hgt, trunc, geomOk, ok: geomOk && (!trunc || allowTrunc)};
  };

  // Largest R that fits. The height is not monotone in R (narrow panels wrap
  // to more lines), so scan downwards. Text shrinks (bounded) before the gears
  // drop below ~55% of maxR; the last resort is the least overflow.
  const lo = o.minR ?? 34, hi = o.maxR ?? 170;
  const base = {fs, cs, hs};
  let best = null, fallback = null;
  let allowTrunc = false;
  for (const k of [1, 0.93, 0.86, 0.8]) {
    fs = base.fs * k; cs = base.cs * k; hs = base.hs * k;
    const floor = k < 0.8 ? lo : Math.max(lo, hi * (o.floorK ?? 0.55));
    for (let j = 0; j <= 48 && !best; j++) {
      const R0 = hi - ((hi - floor) * j) / 48;
      const m = measure(R0);
      if (m.ok) best = {...m, fontK: k};
      else {
        const over = Math.max(m.w / box.w, m.h / box.h);
        if (!fallback || over < fallback.over) fallback = {over, m: {...m, fontK: k}};
      }
    }
    if (best) break;
  }
  if (!best) {
    for (let j = 0; j <= 48 && !best; j++) {
      const R0 = hi * 0.55 - ((hi * 0.55 - lo) * j) / 48;
      const m = measure(R0);
      if (m.ok) best = {...m, fontK: 0.8};
      else {
        // smaller gears may overflow less: the last resort is the least overflow over every R tried
        const over = Math.max(m.w / box.w, m.h / box.h);
        if (!m.trunc && (!fallback || over < fallback.over - 1e-6)) fallback = {over, m: {...m, fontK: 0.8}};
      }
    }
  }
  if (!best) {
    // last resort: accept an ellipsis (full text kept in <title>), largest gears first
    allowTrunc = true;
    fs = base.fs * 0.8; cs = base.cs * 0.8; hs = base.hs * 0.8;
    for (let j = 0; j <= 64 && !best; j++) {
      const m = measure(hi - ((hi - lo) * j) / 64);
      if (m.ok) best = {...m, fontK: 0.8};
    }
  }
  if (!best) best = fallback.m;
  fs = base.fs * best.fontK; cs = base.cs * best.fontK; hs = base.hs * best.fontK;
  const M = best;
  const R = M.R;
  // centre in the box
  const cxBox = box.x + box.w / 2, cyBox = box.y + box.h / 2;
  const uMid = (M.uMin + M.uMax) / 2, vMid = (M.vMin + M.vMax) / 2;
  const ox = row ? cxBox - uMid : cxBox - vMid;
  const oy = row ? cyBox - vMid : cyBox - uMid;
  const map = (u, v) => (row ? {x: ox + u, y: oy + v} : {x: ox + v, y: oy + u});
  const rectUV = (u0, u1, v0, v1) => {
    const a = map(Math.min(u0, u1), Math.min(v0, v1));
    const du = Math.abs(u1 - u0), dv = Math.abs(v1 - v0);
    return row ? {x: a.x, y: a.y, w: du, h: dv} : {x: a.x, y: a.y, w: dv, h: du};
  };
  const vec = (du, dv) => (row ? {x: du, y: dv} : {x: dv, y: du});
  const localRect = (u0, u1, v0, v1) => {
    const du = Math.abs(u1 - u0), dv = Math.abs(v1 - v0);
    const u = Math.min(u0, u1), v = Math.min(v0, v1);
    return row ? {x: u, y: v, w: du, h: dv} : {x: v, y: u, w: dv, h: du};
  };

  const cells = [];
  for (let k = 0; k <= n + 1; k++) {
    const u = 2 * R * k;
    cells.push({kind: k === 0 ? 'drive' : k === n + 1 ? 'output' : 'slot', i: k - 1, u, c: map(u, 0)});
  }
  const phases = meshPhases(cells.map(c => c.c), M.G);
  const HW = M.HW;
  const slots = [];
  for (let i = 0; i < n; i++) {
    const s = i % 2 === 0 ? -1 : 1;
    const uc = 2 * R * (i + 1);
    let panelU0 = -HW, panelU1 = HW;
    let plate;
    if (row) plate = rectUV(uc - HW, uc + HW, s * (M.vIn + M.D + gp), s * (M.vIn + M.D + gp + M.ph));
    else {
      plate = rectUV(uc - HW, uc - HW + M.ph, s * M.vIn, s * (M.vIn + M.D));
      panelU0 = -HW + M.ph + gp;
    }
    const tabHalf = R - M.gap / 2;
    const tabV0 = -s * R * 0.96, tabV1 = s * (M.vIn + 2);
    const panelLocal = localRect(panelU0, panelU1, s * M.vIn, s * (M.vIn + M.D));
    const tabLocal = localRect(-tabHalf, tabHalf, tabV0, tabV1);
    const seat = map(uc, 0);
    const dir = vec(0, s);             // outward (entry) direction
    slots.push({
      i, s, u: uc, c: seat, dir,
      plate,
      holder: rectUV(uc - HW, uc + HW, s * M.vIn, s * (row ? M.vIn + M.D + gp + M.ph : M.vIn + M.D)),
      panelLocal, tabLocal,
      panelAbs: {x: seat.x + panelLocal.x, y: seat.y + panelLocal.y, w: panelLocal.w, h: panelLocal.h},
      tabAbs: {x: seat.x + tabLocal.x, y: seat.y + tabLocal.y, w: tabLocal.w, h: tabLocal.h},
      condFit: M.condFits[i], factFit: M.factFits[i],
      phase: phases[i + 1].phase, sign: phases[i + 1].sign,
      // piece extent from the gear centre along the outward direction
      outer: M.vIn + M.D, inner: R * 0.96,
    });
  }
  // output dial on the side opposite the last slot's panel
  const sR = -slots[n - 1].s;
  const out = cells[n + 1];
  const dialR = Math.min(R * 1.62, R + (row ? M.D + gp + M.ph : M.D) - 6);
  const normal = row ? (sR > 0 ? 90 : -90) : (sR > 0 ? 0 : 180);
  const drive = cells[0];
  // tester approaches the drive from side +1 (slot 1's panel starts beyond the drive)
  const driveFree = vec(0, 1);
  const board = rectUV(-M.G.ra - pad, 2 * R * (n + 1) + M.G.ra + pad, -M.vOuter - pad, M.vOuter + pad);
  let header = null;
  if (M.header) {
    if (M.header.mode === 'start') {
      const half = Math.min(M.vOuter + pad, Math.max(90, M.header.need / 2 + 24));
      header = {...M.header, rect: rectUV(-M.G.ra - pad - M.header.w - pad, -M.G.ra - pad - pad * 0.5, -half, half)};
    }
    else if (row) header = {...M.header, rect: rectUV(-M.G.ra - pad, 2 * R * (n + 1) + M.G.ra + pad, -M.vOuter - pad - M.header.h - pad * 0.5, -M.vOuter - pad)};
    else header = {...M.header, rect: rectUV(-M.G.ra - pad - M.header.h - pad * 0.5, -M.G.ra - pad, -M.vOuter - pad, M.vOuter + pad)};
  }
  const extents = rectUV(M.uMin, M.uMax, M.vMin, M.vMax);
  return {
    axis: o.axis, row, n, R, G: M.G, gap: M.gap, vIn: M.vIn, D: M.D, ph: M.ph, gp, px: M.px, py: M.py, stripe: M.stripe, badge: M.badge,
    fs, cs, hs, cells, slots, phases,
    drive: {c: drive.c, knobR: R * 0.66, phase: phases[0].phase, free: driveFree},
    output: {c: out.c, phase: phases[n + 1].phase, sign: phases[n + 1].sign, side: sR, dialR, normal},
    board, header, extents, map, rectUV, vec, explode,
    fitOk: Boolean(M.ok),
    truncated: Boolean(M.trunc),
  };
}

/* ------------------------------------------------------------------ */
/* Board art                                                           */
/* ------------------------------------------------------------------ */
const screws = (b, rad = 4, inset = 9, color = '#8a6a2a') => [
  [b.x + inset, b.y + inset], [b.x + b.w - inset, b.y + inset], [b.x + inset, b.y + b.h - inset], [b.x + b.w - inset, b.y + b.h - inset],
].map(([x, y]) => h('circle', {cx: r(x), cy: r(y), r: rad, fill: color, opacity: 0.8}));

/** Outline path of a piece (panel ∪ tab) around its gear centre. */
export function pieceShapes(slot) {
  return [slot.panelLocal, slot.tabLocal];
}

/**
 * The rule board: base plate, header, pockets with pegs, condition plates,
 * drive gear (crank) and output gear with its quarter dial.
 * @param {any} ctx
 * @param {ReturnType<typeof planBoard>} P
 * @param {{prefix:string, text?:boolean, crankAngle?:number, turnDir?:1|-1}} o
 */
export function boardArt(ctx, P, o) {
  const C = caColors(ctx);
  const th = ctx.theme;
  const N = o.prefix;
  const b = P.board;
  const textOn = o.text !== false && ctx.show('key');
  const parts = [];
  parts.push(h('path', {d: roundRectPath(b.x + 8, b.y + 12, b.w, b.h, 22), fill: th.shadow}));
  if (P.header) {
    const hr = P.header.rect;
    parts.push(h('path', {d: roundRectPath(hr.x + 6, hr.y + 10, hr.w, hr.h, 18), fill: th.shadow}));
  }
  parts.push(h('path', {d: roundRectPath(b.x, b.y, b.w, b.h, 22), fill: C.board, stroke: C.boardDark, 'stroke-width': 5}));
  parts.push(h('path', {d: roundRectPath(b.x + 10, b.y + 10, b.w - 20, b.h - 20, 14), fill: 'none', stroke: C.boardLine, 'stroke-width': 1.5, opacity: 0.8}));
  // gear-line groove
  const a = P.cells[0].c, z = P.cells[P.cells.length - 1].c;
  parts.push(h('line', {x1: r(a.x), y1: r(a.y), x2: r(z.x), y2: r(z.y), stroke: C.boardDark, 'stroke-width': P.R * 0.5, 'stroke-linecap': 'round', opacity: 0.45}));
  // pockets (tab ∪ panel seat) and pegs
  for (const s of P.slots) {
    const pk = [s.panelAbs, s.tabAbs];
    parts.push(g({name: `${N}-pocket${s.i}`},
      pk.map(q => h('path', {d: roundRectPath(q.x - 3, q.y - 3, q.w + 6, q.h + 6, 12), fill: C.boardDark})),
      pk.map(q => h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 10), fill: C.pocket})),
      h('circle', {cx: r(s.c.x), cy: r(s.c.y), r: r(P.R * 0.2), fill: C.boardDark}),
      h('circle', {cx: r(s.c.x), cy: r(s.c.y), r: r(P.R * 0.12), fill: C.peg, stroke: C.ink, 'stroke-width': 2}),
    ));
  }
  // condition plates
  for (const s of P.slots) {
    const q = s.plate;
    const col = slotColor(ctx, s.i);
    const bx = q.x + P.px * 0.7 + P.badge / 2;
    const by = q.y + q.h / 2;
    const pl = [
      h('path', {d: roundRectPath(q.x + 3, q.y + 5, q.w, q.h, 10), fill: 'rgba(0,0,0,0.22)'}),
      h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 10), fill: C.brass, stroke: C.brassDark, 'stroke-width': 2.5}),
      h('path', {d: roundRectPath(q.x + 5, q.y + 5, q.w - 10, q.h - 10, 7), fill: 'none', stroke: shade(C.brass, 0.35), 'stroke-width': 1.5}),
      screws(q, 3.2, 8),
      h('circle', {cx: r(bx), cy: r(by), r: r(P.badge / 2), fill: col, stroke: C.ink, 'stroke-width': 2}),
      g({transform: T(bx, by)}, pips(s.i + 1, P.badge * 0.2, Math.max(2.4, P.badge * 0.075), '#ffffff')),
    ];
    if (textOn && s.condFit) {
      const tx = bx + P.badge / 2 + 10;
      const tw = q.x + q.w - P.px - tx;
      pl.push(textBlock(s.condFit, {x: tx + tw / 2, y: by - s.condFit.height / 2, anchor: 'middle', fill: C.ink, name: `${N}-cond${s.i}`}));
    }
    parts.push(g({name: `${N}-plate${s.i}`}, pl));
  }
  // header
  if (P.header) {
    const hr = P.header.rect;
    const hp = [
      h('path', {d: roundRectPath(hr.x, hr.y, hr.w, hr.h, 16), fill: C.brass, stroke: C.brassDark, 'stroke-width': 3}),
      h('path', {d: roundRectPath(hr.x + 7, hr.y + 7, hr.w - 14, hr.h - 14, 11), fill: 'none', stroke: shade(C.brass, 0.35), 'stroke-width': 1.5}),
      screws(hr, 4, 12),
    ];
    if (textOn && P.header.fit) {
      const f = P.header.fit, tg = P.header.tag;
      const tgGap = tg ? 12 + tg.size * 0.35 : 0;
      const total = f.height + (tg ? tg.height + tgGap : 0);
      const cx = hr.x + hr.w / 2;
      let y = hr.y + (hr.h - total) / 2;
      if (tg) {
        hp.push(textBlock(tg, {x: cx, y, anchor: 'middle', fill: shade(C.brassDark, -0.35), name: `${N}-rulekind`, letterSpacing: 0.6}));
        y += tg.height + tgGap;
      }
      hp.push(textBlock(f, {x: cx, y, anchor: 'middle', fill: C.ink, name: `${N}-rule`}));
    }
    parts.push(g({name: `${N}-header`}, hp));
  }
  // output dial
  const O = P.output;
  const dial = dialArt(ctx, P, `${N}-dial`, o.turnDir ?? 1);
  parts.push(dial.node);
  // board gears (drive with crank, output)
  const drive = gearArt(ctx, {name: `${N}-drive`, G: P.G, fill: C.metal, crank: true, crankAngle: o.crankAngle ?? 0, hub: '#e7ecef'});
  const output = gearArt(ctx, {name: `${N}-out`, G: P.G, fill: C.metal, hub: '#e7ecef'});
  const pegCap = c => h('circle', {cx: r(c.x), cy: r(c.y), r: r(P.R * 0.2), fill: C.boardDark});
  const node = g({name: N}, parts, pegCap(P.drive.c), pegCap(O.c),
    g({transform: T(P.drive.c.x, P.drive.c.y)}, drive.node),
    g({transform: T(O.c.x, O.c.y)}, output.node),
    dial.pointer,
  );
  return {node, dial};
}

/**
 * Quarter dial on the output's free side: an open ring at the start end, a
 * filled ring at the end; the pointer is mounted on the output shaft.
 */
export function dialArt(ctx, P, name, turnDir = 1) {
  const C = caColors(ctx);
  const O = P.output;
  const c = O.c;
  const sign = O.sign * turnDir;
  // sweep 90° centred on the free normal; the pointer turns with the output (half speed)
  const a0 = O.normal - 45 * sign;
  const a1 = O.normal + 45 * sign;
  const R0 = P.R * 1.2, R1 = O.dialR;
  const pt = (rad, a) => ({x: c.x + rad * Math.cos(a * DEG), y: c.y + rad * Math.sin(a * DEG)});
  const lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  const A = pt(R1, lo), B = pt(R1, hi), Cc = pt(R0, hi), Dd = pt(R0, lo);
  const face = `M${r(A.x)} ${r(A.y)}A${r(R1)} ${r(R1)} 0 0 1 ${r(B.x)} ${r(B.y)}L${r(Cc.x)} ${r(Cc.y)}A${r(R0)} ${r(R0)} 0 0 0 ${r(Dd.x)} ${r(Dd.y)}Z`;
  const ticks = [];
  for (let k = 0; k <= 6; k++) {
    const a = lo + (hi - lo) * (k / 6);
    const p1 = pt(R1 - 4, a), p2 = pt(R1 - (k % 3 === 0 ? 20 : 12), a);
    ticks.push(h('line', {x1: r(p1.x), y1: r(p1.y), x2: r(p2.x), y2: r(p2.y), stroke: C.metalDark, 'stroke-width': 2.2, 'stroke-linecap': 'round'}));
  }
  const iconR = Math.max(9, P.R * 0.13);
  const ps = pt(R1 + iconR + 8, a0), pe = pt(R1 + iconR + 8, a1);
  const node = g({name},
    h('path', {d: face, fill: C.dialFace, stroke: C.ink, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
    ticks,
    h('circle', {cx: r(ps.x), cy: r(ps.y), r: r(iconR), fill: C.dialFace, stroke: C.metalDark, 'stroke-width': 3.5}),
    g({name: `${name}-end`},
      h('circle', {cx: r(pe.x), cy: r(pe.y), r: r(iconR + 3), fill: C.metalDark, stroke: C.ink, 'stroke-width': 2}),
      h('circle', {name: `${name}-lamp`, cx: r(pe.x), cy: r(pe.y), r: r(iconR - 1), fill: C.metalDark})),
  );
  const len = R1 - 8;
  const pointer = g({name: `${name}-ptr`, transform: T(c.x, c.y, a0)},
    h('path', {d: `M${r(-P.R * 0.28)} -5L${r(len - 16)} -4L${r(len)} 0L${r(len - 16)} 4L${r(-P.R * 0.28)} 5Z`, fill: '#2b3137', stroke: '#11151a', 'stroke-width': 1.5, 'stroke-linejoin': 'round'}),
    h('circle', {r: r(Math.max(7, P.R * 0.1)), fill: '#2b3137', stroke: '#e7ecef', 'stroke-width': 2}),
  );
  const frame = (k, lampOn) => ({
    [`${name}-ptr`]: {transform: T(c.x, c.y, a0 + (a1 - a0) * clamp(k))},
    [`${name}-lamp`]: {fill: lampOn ? ctx.theme.accent2 : C.metalDark},
  });
  return {node, pointer, frame, a0, a1, tip: k => pt(len, a0 + (a1 - a0) * k), start: ps, end: pe, iconR};
}

/**
 * Tight bounds of the joint dial (quarter face, its two end icons) and the
 * output gear, for label placement.
 * @param {ReturnType<typeof planBoard>} P
 * @param {ReturnType<typeof dialArt>} dial
 * @param {number} [pad=8]
 */
export function dialBounds(P, dial, pad = 8) {
  const c = P.output.c;
  const R1 = P.output.dialR;
  const pts = [];
  for (let k = 0; k <= 12; k++) {
    const a = (dial.a0 + (dial.a1 - dial.a0) * (k / 12)) * DEG;
    pts.push({x: c.x + R1 * Math.cos(a), y: c.y + R1 * Math.sin(a)});
  }
  const ir = dial.iconR + 3;
  for (const q of [dial.start, dial.end]) pts.push({x: q.x - ir, y: q.y - ir}, {x: q.x + ir, y: q.y + ir});
  const ra = P.G.ra;
  pts.push({x: c.x - ra, y: c.y - ra}, {x: c.x + ra, y: c.y + ra});
  const x0 = Math.min(...pts.map(q => q.x)) - pad, y0 = Math.min(...pts.map(q => q.y)) - pad;
  const x1 = Math.max(...pts.map(q => q.x)) + pad, y1 = Math.max(...pts.map(q => q.y)) + pad;
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */
/**
 * A fact piece around its gear centre (local origin): panel + tab + gear.
 * Nodes: `${name}` (placement), `${name}-body`, gear `${name}-g`/`-g-rot`.
 * @param {any} ctx
 * @param {ReturnType<typeof planBoard>} P
 * @param {number} i slot index
 * @param {{name:string, text?:boolean, dashed?:boolean, factText?:string}} o
 */
export function pieceArt(ctx, P, i, o) {
  const C = caColors(ctx);
  const th = ctx.theme;
  const s = P.slots[i];
  const col = slotColor(ctx, i);
  const shapes = [s.panelLocal, s.tabLocal];
  const sw = 2.6;
  const dash = o.dashed ? {'stroke-dasharray': '9 7'} : {};
  const outline = shapes.map(q => h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 10), fill: C.ink, stroke: C.ink, 'stroke-width': sw * 2, 'stroke-linejoin': 'round', ...dash}));
  const fillShapes = shapes.map(q => h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 10), fill: C.paper}));
  // coloured stripe along the panel's outer edge (the trailing edge while carried)
  const pl = s.panelLocal;
  const st = P.stripe;
  let stripe;
  if (P.row) stripe = s.s < 0 ? {x: pl.x + 6, y: pl.y + 5, w: pl.w - 12, h: st} : {x: pl.x + 6, y: pl.y + pl.h - 5 - st, w: pl.w - 12, h: st};
  else stripe = s.s < 0 ? {x: pl.x + 5, y: pl.y + 6, w: st, h: pl.h - 12} : {x: pl.x + pl.w - 5 - st, y: pl.y + 6, w: st, h: pl.h - 12};
  const lines = [];
  // faint ruled lines on the panel (paper texture)
  const nL = 3;
  for (let k = 1; k <= nL; k++) {
    if (P.row) {
      const y = pl.y + (pl.h * k) / (nL + 1);
      lines.push(h('line', {x1: r(pl.x + 14), x2: r(pl.x + pl.w - 14), y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 1, opacity: 0.35}));
    } else {
      const y = pl.y + (pl.h * k) / (nL + 1);
      lines.push(h('line', {x1: r(pl.x + 14), x2: r(pl.x + pl.w - 14), y1: r(y), y2: r(y), stroke: th.paperLine, 'stroke-width': 1, opacity: 0.35}));
    }
  }
  let text = null;
  const f = s.factFit;
  if (o.text !== false && ctx.show('key') && f) {
    const inner = {...pl};
    if (P.row) { inner.h -= st; if (s.s < 0) inner.y += st; } else { inner.w -= st; if (s.s < 0) inner.x += st; }
    text = textBlock(f, {x: inner.x + inner.w / 2, y: inner.y + (inner.h - f.height) / 2, anchor: 'middle', fill: C.ink, name: `${o.name}-fact`});
  }
  const gear = gearArt(ctx, {name: `${o.name}-g`, G: P.G, fill: col, k: i + 1, dashed: o.dashed});
  const shadow = g({name: `${o.name}-sh`, opacity: 0.8}, shapes.map(q => h('path', {d: roundRectPath(q.x + 6, q.y + 9, q.w, q.h, 10), fill: th.shadow})));
  const node = g({name: o.name},
    shadow,
    g({name: `${o.name}-body`}, outline, fillShapes,
      h('path', {d: roundRectPath(stripe.x, stripe.y, stripe.w, stripe.h, 3), fill: col}),
      lines, text),
    gear.node,
  );
  return {node, slot: s, gearRot: `${o.name}-g-rot`};
}

/** Dashed outline of a missing piece in its pocket (pending marker). */
export function ghostArt(ctx, P, i, name) {
  const s = P.slots[i];
  const col = slotColor(ctx, i);
  const q1 = s.panelAbs, q2 = s.tabAbs;
  const G = P.G;
  return g({name, opacity: 0},
    [q1, q2].map(q => h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 10), fill: 'rgba(255,255,255,0.08)', stroke: '#f4f1ea', 'stroke-width': 3, 'stroke-dasharray': '10 8'})),
    h('circle', {cx: r(s.c.x), cy: r(s.c.y), r: r(G.ra), fill: 'none', stroke: col, 'stroke-width': 3.5, 'stroke-dasharray': '8 8'}),
  );
}

/**
 * Pose of the gear line for a drive rotation `theta` (degrees): every gear
 * from the drive up to (not including) the first unseated slot turns; the
 * rest stay still. Returns node records for board and piece gears.
 * @param {ReturnType<typeof planBoard>} P
 * @param {number} theta
 * @param {number} breakAt  first slot index whose piece is not seated (-1 = none)
 * @param {{drive:string, out:string, pieceRot:(i:number)=>string}} names
 */
export function trainPose(P, theta, breakAt, names) {
  const nodes = {};
  nodes[`${names.drive}-rot`] = {transform: `rotate(${r(P.phases[0].phase + theta)})`};
  for (const s of P.slots) {
    const turns = breakAt < 0 || s.i < breakAt;
    const nm = names.pieceRot(s.i);
    if (nm) nodes[nm] = {transform: `rotate(${r(s.phase + (turns ? s.sign * theta : 0))})`};
  }
  const outTurns = breakAt < 0;
  nodes[`${names.out}-rot`] = {transform: `rotate(${r(P.output.phase + (outTurns ? P.output.sign * theta : 0))})`};
  return {nodes, outTurns};
}

/* ------------------------------------------------------------------ */
/* Small props and badges                                              */
/* ------------------------------------------------------------------ */
/** Round status badge ("?" disc drawn as a glyph path, not text). */
export function doubtBadge(ctx, {name, x, y, rad, color}) {
  const c = color ?? ctx.theme.accent3;
  const q = rad * 0.5;
  return g({name, opacity: 0, transform: T(x, y)},
    h('circle', {r: r(rad), fill: '#fff', stroke: c, 'stroke-width': 4}),
    h('path', {d: `M${r(-q * 0.7)} ${r(-q * 0.55)}C${r(-q * 0.7)} ${r(-q * 1.35)} ${r(q * 0.8)} ${r(-q * 1.35)} ${r(q * 0.8)} ${r(-q * 0.5)}C${r(q * 0.8)} ${r(-q * 0.05)} 0 ${r(q * 0.05)} 0 ${r(q * 0.55)}`, fill: 'none', stroke: c, 'stroke-width': Math.max(3, rad * 0.16), 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: r(q * 1.05), r: r(Math.max(2.5, rad * 0.1)), fill: c}),
  );
}

/** Hand magnifier prop (glass ring + handle), origin at the lens centre. */
export function magnifierArt(ctx, {name, rad, handleAngle = 45, glass = true}) {
  const C = caColors(ctx);
  const hl = rad * 1.25;
  return g({name},
    g({transform: `rotate(${r(handleAngle)})`},
      h('path', {d: roundRectPath(rad + 2, -rad * 0.13, rad * 0.32, rad * 0.26, 4), fill: C.metalDark, stroke: C.ink, 'stroke-width': 2.2}),
      h('path', {d: roundRectPath(rad + rad * 0.3, -rad * 0.17, hl, rad * 0.34, rad * 0.17), fill: '#3c2a20', stroke: C.ink, 'stroke-width': 2.4}),
      h('path', {d: roundRectPath(rad + rad * 0.42, -rad * 0.1, hl * 0.8, rad * 0.07, rad * 0.035), fill: '#ffffff', opacity: 0.18})),
    glass ? h('circle', {r: r(rad), fill: 'rgba(210,232,245,0.18)'}) : null,
    h('circle', {r: r(rad), fill: 'none', stroke: '#2b3137', 'stroke-width': Math.max(7, rad * 0.09)}),
    h('circle', {r: r(rad - Math.max(7, rad * 0.09) / 2 - 1), fill: 'none', stroke: '#9aa6b1', 'stroke-width': 2}),
    glass ? h('path', {d: `M${r(-rad * 0.55)} ${r(-rad * 0.25)}A${r(rad * 0.6)} ${r(rad * 0.6)} 0 0 1 ${r(-rad * 0.2)} ${r(-rad * 0.6)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': Math.max(3, rad * 0.05), 'stroke-linecap': 'round', opacity: 0.55}) : null,
  );
}

/**
 * Shared legend (pictogram boards): one row per condition — pip badge, the
 * condition (bold) and the fact supplied for it — in one or two columns, side
 * by side or stacked; nothing is cut (the texts wrap). Row `mark` (the changed
 * condition) gets a dashed outline named `legend-mark` (opacity 0).
 * @returns {{h:number, w:number, size:number, place:(y:number)=>void, rowsFits:()=>any[], node:(mark?:number)=>any}}
 */
export function legendBlock(ctx, res, o) {
  const th = ctx.theme;
  const size = o.size;
  const badge = size * 1.5;
  const colGap = 24;
  const colW = (o.w - (o.cols - 1) * colGap) / o.cols;
  const tw = colW - badge - 36;
  const stack = Boolean(o.stack);
  const sg = Math.max(8, size * 0.4); // gap between a condition and its fact (stacked)
  const cw = stack ? tw : tw * 0.42, fw = stack ? tw : tw * 0.58 - 14;
  const title = o.title ? ctx.fit(ctx.t.legendTitle, {maxWidth: o.w, size, minSize: size, maxLines: 2, weight: 700}) : null;
  const titleH = title ? title.height + 10 : 0;
  const rows = res.slots.map(s => ({
    i: s.i,
    cf: ctx.fit(s.condition, {maxWidth: cw, size, minSize: size, maxLines: 8, weight: 700}),
    ff: ctx.fit(s.fact || ctx.t.noFact, {maxWidth: fw, size, minSize: size, maxLines: 8, weight: 500}),
  }));
  rows.forEach(rw => { rw.h = Math.max(badge, stack ? rw.cf.height + sg + rw.ff.height : Math.max(rw.cf.height, rw.ff.height)) + 14; });
  const per = Math.ceil(rows.length / o.cols);
  const colH = c => rows.slice(c * per, (c + 1) * per).reduce((a, rw) => a + rw.h + 6, 0) - 6;
  const hh = titleH + Math.max(...Array.from({length: o.cols}, (_, c) => colH(c))) + 8;
  let top = 0;
  return {
    h: hh, w: o.w, size,
    place(yy) { top = yy; },
    rowsFits() { return [title, ...rows.flatMap(rw => [rw.cf, rw.ff])].filter(Boolean); },
    node(mark) {
      const parts = [];
      if (title) parts.push(textBlock(title, {x: o.x, y: top, fill: th.fg}));
      let markNode = null;
      rows.forEach((rw, j) => {
        const c = Math.floor(j / per);
        const x = o.x + c * (colW + colGap);
        let yy = top + titleH;
        for (const prev of rows.slice(c * per, j)) yy += prev.h + 6;
        const col = slotColor(ctx, rw.i);
        parts.push(h('path', {d: roundRectPath(x, yy, colW, rw.h, 10), fill: th.card, stroke: col, 'stroke-width': 2}));
        if (rw.i === mark) markNode = h('path', {name: 'legend-mark', d: roundRectPath(x - 5, yy - 5, colW + 10, rw.h + 10, 13), fill: 'none', stroke: th.accent3, 'stroke-width': 4, 'stroke-dasharray': '10 7', opacity: 0});
        const cx = x + 10 + badge / 2, cy = yy + rw.h / 2;
        parts.push(h('circle', {cx: r(cx), cy: r(cy), r: r(badge / 2), fill: col, stroke: th.ink, 'stroke-width': 2}));
        parts.push(g({transform: T(cx, cy)}, pips(rw.i + 1, badge * 0.2, Math.max(2.4, badge * 0.075), '#ffffff')));
        const tx = x + badge + 24;
        if (stack) {
          const y0 = cy - (rw.cf.height + sg + rw.ff.height) / 2;
          parts.push(textBlock(rw.cf, {x: tx, y: y0, fill: th.ink}));
          parts.push(textBlock(rw.ff, {x: tx, y: y0 + rw.cf.height + sg, fill: th.inkSoft}));
        } else {
          parts.push(textBlock(rw.cf, {x: tx, y: cy - rw.cf.height / 2, fill: th.ink}));
          parts.push(textBlock(rw.ff, {x: tx + tw * 0.42 + 14, y: cy - rw.ff.height / 2, fill: th.inkSoft}));
        }
      });
      return g({name: o.name ?? 'legend'}, parts, markNode);
    },
  };
}

/**
 * A pinned paper note with the issue / assumptions (never answered).
 * @returns {{node:any, box:{x:number,y:number,w:number,h:number}}|null}
 */
export function noteCard(ctx, {name, x, y, maxWidth, issues, assumptions, size = 22, anchor = 'start', maxLines = 3}) {
  if (!ctx.show('all')) return null;
  const t = ctx.t;
  const lines = [...issues.map(s => `${t.issue}: ${s}`), ...assumptions.map(s => `${t.assumption}: ${s}`)];
  if (!lines.length) return null;
  const pad = 14;
  const fits = lines.map((s, k) => ctx.fit(s, {maxWidth: maxWidth - 2 * pad, size, minSize: size * 0.8, maxLines, weight: k < issues.length ? 600 : 500}));
  const w = Math.max(...fits.map(f => f.width)) + 2 * pad;
  const hh = fits.reduce((a, f) => a + f.height, 0) + (fits.length - 1) * 8 + 2 * pad + 6;
  const x0 = anchor === 'end' ? x - w : anchor === 'middle' ? x - w / 2 : x;
  let yy = y + pad + 6;
  const texts = fits.map((f, k) => {
    const node = textBlock(f, {x: x0 + pad, y: yy, fill: ctx.theme.ink, italic: k >= issues.length});
    yy += f.height + 8;
    return node;
  });
  const node = g({name, opacity: 0},
    h('path', {d: roundRectPath(x0 + 5, y + 8, w, hh, 6), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(x0, y, w, hh, 6), fill: '#fff6c9', stroke: ctx.theme.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(x0)} ${r(y + 6)}H${r(x0 + w)}`, stroke: '#e8d98a', 'stroke-width': 10, opacity: 0.8}),
    h('circle', {cx: r(x0 + w / 2), cy: r(y + 6), r: 7, fill: ctx.theme.accent, stroke: ctx.theme.ink, 'stroke-width': 2}),
    texts,
  );
  return {node, box: {x: x0, y, w, h: hh}};
}

/* ------------------------------------------------------------------ */
/* Mechanism / contrast / inspect helpers                              */
/* ------------------------------------------------------------------ */
/** Element ids a mechanism can reference (fixed by the scene). */
export const MECH_IDS = ['rule', 'connector', 'dial', 'cond1', 'cond2', 'cond3', 'cond4', 'cond5', 'fact1', 'fact2', 'fact3', 'fact4', 'fact5'];
export const RELATION_KINDS = ['relation', 'communication', 'sequence', 'causal'];

/**
 * Mechanism field set for this motif (the generic builder allows only 8
 * relationships; a five-condition board needs up to 12).
 */
export const caMechFields = {
  elements: list('Captions of the structural components (ids fixed by the scene; conditions and facts take their text from rules/facts)', obj('Component caption', {
    id: oneOf('Component id', ['rule', 'connector', 'dial']),
    label: str('Visible caption', 90),
  }, ['id', 'label']), 0, 3),
  relationships: list('Explicit relationships between components, drawn in this order; kind controls the line style (causal only when the author supplies it). Ids beyond the number of conditions are ignored', obj('Relationship', {
    from: oneOf('Source component id', MECH_IDS),
    to: oneOf('Target component id', MECH_IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when supplied)', RELATION_KINDS),
  }, ['from', 'to', 'kind']), 1, 12),
  focusElement: oneOf('Component enlarged while the tracer passes it', MECH_IDS),
  relationLabels: obj('Caption used in the legend for each relation kind', {
    relation: str('Caption for plain relations', 90),
    communication: str('Caption for communications', 90),
    sequence: str('Caption for sequence links', 90),
    causal: str('Caption for supplied causal links', 90),
  }),
  traversalOrder: list('Order in which the tracer visits components (ids beyond the number of conditions are skipped)', oneOf('Component id', MECH_IDS), 2, 13),
};

/**
 * Measure a rule header plaque of width `w` (same look as the board header),
 * for scenes that place the header themselves. Assign the result (with a
 * `rect`) to `P.header` before calling boardArt().
 * @returns {{fit:any, tag:any, h:number}}
 */
export function headerBlock(ctx, text, w, hs = 28, o = {}) {
  const px = 16, py = 12;
  const showKey = ctx.show('key');
  // o.minSize: floor for the rule text (no shrinking below it); o.tagSize: size of the
  // "Rule · as supplied" tag (default: two thirds of the rule text)
  const fit = showKey && text ? ctx.fit(text, {maxWidth: w - 2 * px, size: hs, minSize: o.minSize ?? hs * 0.72, maxLines: o.maxLines ?? 3, weight: 700}) : null;
  const ts = o.tagSize ?? Math.max(18, hs * 0.66);
  const tag = showKey ? ctx.fit(ctx.t.ruleKind, {maxWidth: w - 2 * px, size: ts, minSize: o.tagSize ?? 15, maxLines: o.tagSize ? 2 : 1, weight: 600}) : null;
  const hh = Math.max(56, (fit ? fit.height : 0) + (tag ? tag.height + 12 + tag.size * 0.35 : 0) + 2 * py);
  return {mode: 'top', fit, tag, h: hh};
}

/**
 * Drafting sheet (mechanism background): pale paper, fine grid, crop marks.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, h:number, step?:number}} o
 */
export function draftSheet(ctx, o) {
  const step = o.step ?? 40;
  const lines = [];
  for (let x = o.x + step; x < o.x + o.w - 4; x += step) {
    const major = Math.round((x - o.x) / step) % 4 === 0;
    lines.push(h('line', {x1: r(x), x2: r(x), y1: r(o.y + 6), y2: r(o.y + o.h - 6), stroke: major ? '#c3d3df' : '#dbe5ec', 'stroke-width': major ? 1.6 : 1}));
  }
  for (let y = o.y + step; y < o.y + o.h - 4; y += step) {
    const major = Math.round((y - o.y) / step) % 4 === 0;
    lines.push(h('line', {y1: r(y), y2: r(y), x1: r(o.x + 6), x2: r(o.x + o.w - 6), stroke: major ? '#c3d3df' : '#dbe5ec', 'stroke-width': major ? 1.6 : 1}));
  }
  const m = 18, L = 30;
  const marks = [[o.x + m, o.y + m, 1, 1], [o.x + o.w - m, o.y + m, -1, 1], [o.x + m, o.y + o.h - m, 1, -1], [o.x + o.w - m, o.y + o.h - m, -1, -1]]
    .map(([x, y, sx, sy]) => h('path', {d: `M${r(x)} ${r(y + sy * L)}V${r(y)}H${r(x + sx * L)}`, fill: 'none', stroke: '#7d93a4', 'stroke-width': 2.5}));
  return g({name: o.name},
    h('path', {d: roundRectPath(o.x + 6, o.y + 10, o.w, o.h, 18), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 18), fill: '#f4f7f9', stroke: '#9fb3c2', 'stroke-width': 2.5}),
    lines, marks,
  );
}

/**
 * A dash-dot assembly axis (exploded drawings).
 */
export function assemblyAxis(a, b, name, color = '#7d93a4') {
  return h('line', {name, x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: color, 'stroke-width': 2, 'stroke-dasharray': '16 6 3 6', opacity: 0});
}

/**
 * Outline of a missing piece (dashed, no fill) around a local origin, for a
 * pending piece shown at a given place.
 */
export function missingPieceArt(ctx, P, i, name) {
  const s = P.slots[i];
  const col = slotColor(ctx, i);
  return g({name, opacity: 0},
    [s.panelLocal, s.tabLocal].map(q => h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 10), fill: 'rgba(255,255,255,0.35)', stroke: ctx.theme.inkSoft, 'stroke-width': 3, 'stroke-dasharray': '10 8'})),
    h('circle', {r: r(P.G.ra), fill: 'none', stroke: col, 'stroke-width': 3.5, 'stroke-dasharray': '8 8'}),
    g({transform: T(0, 0)}, pips(i + 1, P.G.R * 0.34 * 0.46, Math.max(3, P.G.R * 0.34 * 0.15), col)),
  );
}

/**
 * Drive latch (contrast): a pawl whose tip rests between two teeth of the
 * drive gear, pivoting on a pin fixed to the board. Nodes: `${name}` (placed
 * at the pivot), `${name}-arm` (rotates to release).
 * @param {any} ctx
 * @param {ReturnType<typeof planBoard>} P
 * @param {{name:string, angle:number}} o  angle (deg) of the pivot seen from the drive centre
 */
export function latchArt(ctx, P, o) {
  const C = caColors(ctx);
  const c = P.drive.c;
  const R = P.R;
  const a = o.angle * DEG;
  const dist = P.G.ra + R * 0.55;
  const pivot = {x: c.x + dist * Math.cos(a), y: c.y + dist * Math.sin(a)};
  // arm points from the pivot back toward the gear rim (tooth gap)
  const toward = Math.atan2(c.y - pivot.y, c.x - pivot.x) / DEG;
  const L = R * 0.62;
  const w = Math.max(9, R * 0.16);
  const node = g({name: o.name, transform: T(pivot.x, pivot.y)},
    g({name: `${o.name}-arm`, transform: `rotate(${r(toward)})`},
      h('path', {d: `M${r(-w * 0.6)} ${r(-w)}L${r(L * 0.8)} ${r(-w * 0.7)}L${r(L)} 0L${r(L * 0.8)} ${r(w * 0.7)}L${r(-w * 0.6)} ${r(w)}Z`, fill: C.brass, stroke: C.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    ),
    h('circle', {r: r(w * 0.75), fill: C.metalDark, stroke: C.ink, 'stroke-width': 2}),
    h('circle', {r: r(w * 0.28), fill: C.peg}),
  );
  return {node, pivot, toward, L};
}

/**
 * Mesh contacts between consecutive gears of the line: the point where two
 * neighbouring gears engage (midpoint of their centres).
 * @param {ReturnType<typeof planBoard>} P
 */
export function meshPoints(P) {
  const out = [];
  for (let k = 0; k < P.cells.length - 1; k++) {
    const a = P.cells[k].c, b = P.cells[k + 1].c;
    out.push({k, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, a: Math.atan2(b.y - a.y, b.x - a.x) / DEG});
  }
  return out;
}

/**
 * A mesh-contact marker: a small bright lozenge across the contact when the
 * two gears engage, a split dashed ring when they do not (no text).
 * Nodes: `${name}-on`, `${name}-off`.
 */
export function meshMark(ctx, {name, x, y, a, size}) {
  const s = size;
  return g({name, transform: T(x, y, a + 90)},
    g({name: `${name}-on`},
      h('path', {d: `M${r(-s)} 0L0 ${r(-s * 0.42)}L${r(s)} 0L0 ${r(s * 0.42)}Z`, fill: '#ffffff', stroke: ctx.theme.accent4, 'stroke-width': 3}),
      h('circle', {r: r(s * 0.2), fill: ctx.theme.accent4})),
    g({name: `${name}-off`, opacity: 0},
      h('path', {d: `M${r(-s)} ${r(-s * 0.2)}A${r(s)} ${r(s)} 0 0 1 ${r(s)} ${r(-s * 0.2)}M${r(-s)} ${r(s * 0.2)}A${r(s)} ${r(s)} 0 0 0 ${r(s)} ${r(s * 0.2)}`, fill: 'none', stroke: ctx.theme.accent, 'stroke-width': 3.5, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round'})),
  );
}

/* ------------------------------------------------------------------ */
/* Inspect helpers: reading glass, inspection mat, fact text placement */
/* ------------------------------------------------------------------ */
/**
 * Rectangular reading glass (hand magnifier with a straight handle): thick
 * dark rim, faint glass tint, a shine streak and a handle leaving one side
 * (or corner) of the rim. The whole prop is re-posed every frame from the
 * rectangle it frames, so it can follow a lens window exactly.
 * Nodes: `${name}` (rotation about the rim centre), `${name}-rim`,
 * `${name}-rimIn`, `${name}-glass`, `${name}-shine`, `${name}-handle`.
 * @param {any} ctx
 * @param {{name:string}} o
 */
export function readingGlass(ctx, o) {
  const N = o.name;
  const C = caColors(ctx);
  const node = g({name: N},
    g({name: `${N}-handle`},
      h('path', {name: `${N}-ferrule`, fill: C.metalDark, stroke: C.ink, 'stroke-width': 2.2}),
      h('path', {name: `${N}-grip`, fill: '#3c2a20', stroke: C.ink, 'stroke-width': 2.4}),
      h('path', {name: `${N}-gripHi`, fill: '#ffffff', opacity: 0.16})),
    h('rect', {name: `${N}-glass`, fill: 'rgba(206,229,243,0.16)'}),
    h('line', {name: `${N}-shine`, stroke: '#ffffff', 'stroke-linecap': 'round', opacity: 0.5}),
    h('rect', {name: `${N}-rim`, fill: 'none', stroke: '#2b3137'}),
    h('rect', {name: `${N}-rimIn`, fill: 'none', stroke: '#9aa6b1', 'stroke-width': 2}),
  );
  /**
   * @param {{x:number,y:number,w:number,h:number}} R  framed rectangle
   * @param {{rot?:number, side:'right'|'left'|'top'|'bottom'|'br'|'bl'|'tr'|'tl', opacity?:number, glass?:number}} f
   */
  const frame = (R, f) => {
    const m = Math.min(R.w, R.h);
    const rw = Math.max(8, m * 0.03);
    const rx = Math.max(10, m * 0.1);
    const a = handleAnchor(R, f.side, rx);
    const L = handleLength(R);
    const t = Math.max(14, m * 0.085);
    const fl = t * 0.9; // ferrule length
    const ferr = `M${r(rw * 0.3)} ${r(-t * 0.42)}H${r(fl)}V${r(t * 0.42)}H${r(rw * 0.3)}Z`;
    const grip = roundRectPath(fl - 2, -t / 2, L - fl + 2, t, t / 2);
    const hi = roundRectPath(fl + t * 0.3, -t * 0.3, (L - fl) * 0.78, t * 0.18, t * 0.09);
    const cx = R.x + R.w / 2, cy = R.y + R.h / 2;
    const rect = {x: r(R.x), y: r(R.y), width: r(R.w), height: r(R.h), rx: r(rx)};
    return {
      [N]: {transform: `rotate(${r(f.rot ?? 0, 3)} ${r(cx)} ${r(cy)})`, opacity: f.opacity ?? 1},
      [`${N}-handle`]: {transform: T(a.x, a.y, a.angle)},
      [`${N}-ferrule`]: {d: ferr},
      [`${N}-grip`]: {d: grip},
      [`${N}-gripHi`]: {d: hi},
      [`${N}-glass`]: {...rect, opacity: r(f.glass ?? 1, 3)},
      [`${N}-shine`]: {x1: r(R.x + R.w * 0.14), y1: r(R.y + R.h * 0.3), x2: r(R.x + R.w * 0.3), y2: r(R.y + R.h * 0.12), 'stroke-width': r(Math.max(3, m * 0.022))},
      [`${N}-rim`]: {...rect, 'stroke-width': r(rw)},
      [`${N}-rimIn`]: {x: r(R.x + rw / 2 + 2), y: r(R.y + rw / 2 + 2), width: r(Math.max(1, R.w - rw - 4)), height: r(Math.max(1, R.h - rw - 4)), rx: r(Math.max(4, rx - rw / 2 - 2))},
    };
  };
  return {node, frame};
}

/** Handle length of a reading glass framing R. */
export const handleLength = R => Math.max(60, Math.min(R.w, R.h) * 0.32);

/** Anchor point and direction (deg) of the handle on a rim side or corner. */
export function handleAnchor(R, side, rx = Math.max(10, Math.min(R.w, R.h) * 0.1)) {
  const k = rx * (1 - Math.SQRT1_2);
  switch (side) {
    case 'left': return {x: R.x, y: R.y + R.h / 2, angle: 180};
    case 'top': return {x: R.x + R.w / 2, y: R.y, angle: -90};
    case 'bottom': return {x: R.x + R.w / 2, y: R.y + R.h, angle: 90};
    case 'br': return {x: R.x + R.w - k, y: R.y + R.h - k, angle: 45};
    case 'bl': return {x: R.x + k, y: R.y + R.h - k, angle: 135};
    case 'tr': return {x: R.x + R.w - k, y: R.y + k, angle: -45};
    case 'tl': return {x: R.x + k, y: R.y + k, angle: -135};
    default: return {x: R.x + R.w, y: R.y + R.h / 2, angle: 0};
  }
}

/** Bounding box of a reading glass framing R (rim + handle), unrotated. */
export function glassBox(R, side) {
  const a = handleAnchor(R, side);
  const L = handleLength(R);
  const t = Math.max(14, Math.min(R.w, R.h) * 0.085);
  const ex = a.x + Math.cos(a.angle * DEG) * L, ey = a.y + Math.sin(a.angle * DEG) * L;
  const x0 = Math.min(R.x, ex - t / 2), y0 = Math.min(R.y, ey - t / 2);
  const x1 = Math.max(R.x + R.w, ex + t / 2), y1 = Math.max(R.y + R.h, ey + t / 2);
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}

/**
 * Inspection mat (inspect background): a pale grey-green cutting mat with a
 * fine grid, major lines every fifth cell and a ruler strip along its top.
 * @param {any} ctx
 * @param {{name:string, x:number, y:number, w:number, h:number, step?:number}} o
 */
export function inspectMat(ctx, o) {
  const step = o.step ?? 36;
  const lines = [];
  for (let x = o.x + step, k = 1; x < o.x + o.w - 4; x += step, k++) {
    lines.push(h('line', {x1: r(x), x2: r(x), y1: r(o.y + 8), y2: r(o.y + o.h - 8), stroke: k % 5 === 0 ? '#aebfb2' : '#c7d3c8', 'stroke-width': k % 5 === 0 ? 1.8 : 1}));
  }
  for (let y = o.y + step, k = 1; y < o.y + o.h - 4; y += step, k++) {
    lines.push(h('line', {y1: r(y), y2: r(y), x1: r(o.x + 8), x2: r(o.x + o.w - 8), stroke: k % 5 === 0 ? '#aebfb2' : '#c7d3c8', 'stroke-width': k % 5 === 0 ? 1.8 : 1}));
  }
  const ticks = [];
  for (let x = o.x + 24, k = 0; x < o.x + o.w - 20; x += step / 4, k++) {
    const len = k % 4 === 0 ? 12 : 6;
    ticks.push(h('line', {x1: r(x), x2: r(x), y1: r(o.y + 3), y2: r(o.y + 3 + len), stroke: '#7f9384', 'stroke-width': 1.5}));
  }
  return g({name: o.name},
    h('path', {d: roundRectPath(o.x + 5, o.y + 9, o.w, o.h, 20), fill: ctx.theme.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 20), fill: '#dfe7df', stroke: '#8fa595', 'stroke-width': 3}),
    lines, ticks,
  );
}

/**
 * Local position of the fact text on a piece (same rule as pieceArt), for
 * scenes that print or swap the fact text themselves.
 * @param {ReturnType<typeof planBoard>} P
 * @param {number} i
 * @param {{height:number}} fit
 */
export function factTextAt(P, i, fit) {
  const s = P.slots[i];
  const inner = {...s.panelLocal};
  if (P.row) { inner.h -= P.stripe; if (s.s < 0) inner.y += P.stripe; } else { inner.w -= P.stripe; if (s.s < 0) inner.x += P.stripe; }
  return {x: inner.x + inner.w / 2, y: inner.y + (inner.h - fit.height) / 2};
}

/**
 * State tag that may wrap to two lines (dot + bold text in a rounded pill),
 * for narrow free columns; same look as the one-line stateTag.
 * @param {any} ctx
 * @param {string} text
 * @param {{x:number, y:number, size:number, maxWidth:number, name?:string, color?:string, opacity?:number, fill?:string}} o
 */
export function stateTagWrap(ctx, text, o) {
  const size = o.size;
  const padX = size * 0.7, padY = size * 0.42;
  const dot = size * 0.9;
  const fit = ctx.fit(text, {maxWidth: o.maxWidth - 2 * padX - dot, size, minSize: size * 0.9, maxLines: 2, weight: 700});
  const w = fit.width + 2 * padX + dot;
  const hh = fit.height + 2 * padY;
  const col = o.color ?? ctx.theme.ink;
  const node = g({name: o.name, opacity: o.opacity},
    h('path', {d: roundRectPath(o.x, o.y, w, hh, Math.min(hh / 2, size * 0.9)), fill: o.fill ?? ctx.theme.card, stroke: col, 'stroke-width': 2}),
    h('circle', {cx: r(o.x + padX + size * 0.2), cy: r(o.y + padY + size * 0.55), r: r(size * 0.26), fill: col}),
    textBlock(fit, {x: o.x + padX + dot, y: o.y + padY, fill: col}),
  );
  return {node, box: {x: o.x, y: o.y, w, h: hh}, fit};
}

/** Axis-aligned overlap test with padding. */
export function hit(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/**
 * Free spot for a box of `size` inside `bounds`, clear of every obstacle
 * (with padding), closest to the preferred centre `pref`.
 * @returns {{x:number,y:number,w:number,h:number}|null}
 */
export function findSpot(size, pref, obstacles, bounds, o = {}) {
  const step = o.step ?? 14;
  const pad = o.pad ?? 10;
  const obs = obstacles.filter(Boolean);
  let best = null;
  for (let y = bounds.y; y + size.h <= bounds.y + bounds.h + 0.01; y += step) {
    for (let x = bounds.x; x + size.w <= bounds.x + bounds.w + 0.01; x += step) {
      const b = {x, y, w: size.w, h: size.h};
      if (obs.some(q => hit(b, q, pad))) continue;
      const d = Math.hypot(x + size.w / 2 - pref.x, y + size.h / 2 - pref.y);
      if (!best || d < best.d) best = {d, box: b};
    }
  }
  return best ? best.box : null;
}

/** Does the segment a→b cross box q (Liang–Barsky clip)? */
export function segHitsBox(a, b, q, pad = 0) {
  const x0 = q.x - pad, y0 = q.y - pad, x1 = q.x + q.w + pad, y1 = q.y + q.h + pad;
  let t0 = 0, t1 = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  const tests = [[-dx, a.x - x0], [dx, x1 - a.x], [-dy, a.y - y0], [dy, y1 - a.y]];
  for (const [p, qq] of tests) {
    if (p === 0) { if (qq < 0) return false; continue; }
    const t = qq / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 <= t1;
}

/**
 * Grid search for a callout chip of `size`: the chip avoids every `block`
 * box; its straight leader (from the chip edge toward `target`, ending
 * `gap` short of it) crosses no `text` box. Shortest leader wins; leaders
 * shorter than `minLen` are rejected (too stubby to read).
 * @returns {{x:number,y:number,box:{x:number,y:number,w:number,h:number},end:{x:number,y:number}}|null}
 *   x = chip centre, y = chip top (calloutChip's chipAt)
 */
export function calloutSpot(size, target, o) {
  const step = o.step ?? 12;
  const B = o.bounds;
  const minLen = o.minLen ?? 26;
  let best = null;
  for (let y = B.y; y + size.h <= B.y + B.h + 0.01; y += step) {
    for (let x = B.x; x + size.w <= B.x + B.w + 0.01; x += step) {
      const b = {x, y, w: size.w, h: size.h};
      if (o.block.some(q => q && hit(b, q, o.pad ?? 10))) continue;
      const c = {x: x + size.w / 2, y: y + size.h / 2};
      // leader start on the chip edge, as calloutChip draws it
      const from = {x: Math.max(b.x, Math.min(target.x, b.x + b.w)), y: target.y > b.y + b.h ? b.y + b.h : target.y < b.y ? b.y : b.y + b.h / 2};
      if (from.y === b.y + b.h / 2) from.x = target.x > c.x ? b.x + b.w : b.x;
      const len = Math.hypot(target.x - from.x, target.y - from.y);
      if (len < minLen) continue;
      const k = Math.max(0, (len - (o.gap ?? 0)) / len);
      const end = {x: from.x + (target.x - from.x) * k, y: from.y + (target.y - from.y) * k};
      // the last few units may touch the target's own body
      const kk = Math.max(0, (len - 14) / len);
      const near = {x: from.x + (target.x - from.x) * kk, y: from.y + (target.y - from.y) * kk};
      if (o.text.some(q => q && segHitsBox(from, near, q, 4))) continue;
      const cost = len + (o.prefer ? Math.hypot(c.x - o.prefer.x, c.y - o.prefer.y) * 0.15 : 0);
      if (!best || cost < best.cost) best = {cost, x: c.x, y, box: b, end};
    }
  }
  return best;
}

/** Union of boxes. */
export function unionBox(list) {
  const bs = list.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}

/** Linear map helper for eased sub-windows. */
export const within = (u, a, b) => clamp((u - a) / (b - a));
export {lerp};

/** Text of the SVG font stack (for raw text nodes). */
export const FONT = SANS;
