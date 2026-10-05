/**
 * Motif kit for "Analogía de casos" (LAW-0085..0088).
 *
 * Visual metaphor: each case is a sheet of TRACING PAPER on which a small
 * scene is printed — one original pictogram per supplied feature standing on
 * a ground line, with its label. Both sheets share one slot geometry, so when
 * sheet B is laid over sheet A (registration holes on the same pegs, corner
 * crosshairs on top of each other):
 *   - a SHARED feature (identical text in A and B) is printed at the same
 *     spot on both sheets → the two drawings coincide (shown in the merged
 *     ink with an "=" registration tick);
 *   - a DIFFERING feature is printed in a pair of adjacent slots — A's variant
 *     in the left slot, B's in the right one — so the two variants stay
 *     visible side by side with a "≠" badge between them;
 *   - a feature absent from one case is printed on one sheet only.
 * The case names are printed in different halves of the header band, so no
 * text of one sheet ever lands on different text of the other.
 * The RULE card (text supplied by the author) carries one socket per feature
 * it names (`relevant`), used for "relevant similarity / difference, as
 * supplied" — the kit never decides that a rule applies or what follows.
 *
 * The kit owns geometry and drawing only; every entry owns its timeline,
 * layout and semantics.
 * @module animations/reasoning/kits/analogia-de-casos
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, oneOf, list, obj, bool} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';

export const SANS = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ */
/* fields                                                              */
/* ------------------------------------------------------------------ */

/** Original pictograms available for features. */
export const PICTOS = ['ladder', 'bicycle', 'note', 'calendar', 'key', 'house', 'rain', 'sun', 'parcel', 'clock', 'coins', 'person', 'lock', 'car', 'tree', 'phone'];

const caseObj = which => obj(`Case ${which} (fictional)`, {
  name: str(`Name printed on sheet ${which} (fictional)`, 48),
  note: str(`Short descriptor printed under the name of case ${which}`, 48),
}, ['name']);

/** A feature compared between the two cases. */
export const featureSchema = obj('A feature compared between case A and case B', {
  icon: oneOf('Pictogram drawn for this feature', PICTOS),
  iconB: {type: ['string', 'null'], enum: PICTOS, description: 'Optional different pictogram for case B’s variant (null = same pictogram)'},
  a: str('Value in case A as supplied (empty = absent from case A)', 64),
  b: str('Value in case B as supplied (empty = absent from case B)', 64),
  relevant: bool('Named by the supplied rule: its similarity or difference is marked as relevant, as supplied (no legal effect is inferred)'),
}, ['icon', 'a', 'b']);

/**
 * Category fields of the reasoning motifs as used by this motif: facts
 * (features of the two cases), rules, issues and assumptions, plus the two
 * compared cases.
 */
export const analogyFields = {
  cases: obj('The two compared cases (fictional)', {a: caseObj('A'), b: caseObj('B')}, ['a', 'b']),
  facts: list('Features compared between the cases. Identical text in A and B = shared feature (the drawings coincide when the sheets are overlaid); different text = both variants stay visible side by side; empty = absent from that case', featureSchema, 2, 5),
  rules: list('Rule supplied by the author (illustrative text, never a statement of law); features marked `relevant` are the ones it names', obj('Rule', {
    name: str('Short rule name printed on the card', 40),
    text: str('Rule text as supplied', 150),
  }, ['text']), 1, 1),
  issues: list('Question under analysis, as supplied (never answered by the animation)', str('Issue', 110), 0, 1),
  assumptions: list('Assumptions stated by the author (shown as a footnote)', str('Assumption', 90), 0, 2),
};

export const ANALOGY_STRINGS = {
  en: {
    asSupplied: 'as supplied',
    relevantSimilarity: 'Relevant similarity',
    relevantDifference: 'Relevant difference',
    relevancePending: 'Relevance pending',
    coincides: 'Coincides',
    differs: 'Differs',
    names: 'Names',
    issue: 'Issue',
    assumption: 'Assumption',
    ruleCard: 'Rule',
    overlay: 'Case B laid over case A',
    absent: 'not in this case',
    layerA: 'Case A sheet',
    layerB: 'Case B sheet',
    layerRule: 'Rule card',
    magnifier: 'Magnifier',
    pendingWord: 'pending',
    noArrow: 'no arrowhead',
    newCase: 'New case',
    earlierCase: 'Earlier case',
    onlyThisChanges: 'Only this feature changes',
    onlyOne: 'In one case only',
    sameInBoth: 'Same in both scenes',
    datumChanged: 'Datum changed',
    inNewCase: 'In case B',
    overlayContext: 'Case B’s sheet registered on case A’s',
  },
  es: {
    asSupplied: 'según lo aportado',
    relevantSimilarity: 'Semejanza relevante',
    relevantDifference: 'Diferencia relevante',
    relevancePending: 'Relevancia pendiente',
    coincides: 'Coincide',
    differs: 'Difiere',
    names: 'Nombra',
    issue: 'Cuestión',
    assumption: 'Premisa',
    ruleCard: 'Regla',
    overlay: 'Caso B sobre el caso A',
    absent: 'no está en este caso',
    layerA: 'Hoja del caso A',
    layerB: 'Hoja del caso B',
    layerRule: 'Tarjeta de la regla',
    magnifier: 'Lupa',
    pendingWord: 'pendiente',
    noArrow: 'sin punta de flecha',
    newCase: 'Caso nuevo',
    earlierCase: 'Caso anterior',
    onlyThisChanges: 'Solo cambia este rasgo',
    onlyOne: 'Solo en un caso',
    sameInBoth: 'Igual en ambas escenas',
    datumChanged: 'Dato cambiado',
    inNewCase: 'En el caso B',
    overlayContext: 'Hoja del caso B registrada sobre la del caso A',
  },
};

/* ------------------------------------------------------------------ */
/* resolution                                                          */
/* ------------------------------------------------------------------ */

const norm = s => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();

/** Kind of a feature computed from the supplied texts (never inferred otherwise). */
export function featureKind(a, b) {
  const A = norm(a), B = norm(b);
  if (!A && !B) return 'none';
  if (!B) return 'only-a';
  if (!A) return 'only-b';
  return A === B ? 'shared' : 'differs';
}

/**
 * Resolve the supplied features.
 * @param {Array<{icon:string, iconB?:string|null, a:string, b:string, relevant?:boolean}>} facts
 * @param {{pairs?: number[]}} [o] feature indices that always get a pair of slots (their state may change in the entry)
 */
export function resolveAnalogy(facts, o = {}) {
  const forced = new Set(o.pairs || []);
  const features = facts.map((f, i) => {
    const a = String(f.a || '').trim(), b = String(f.b || '').trim();
    return {i, icon: f.icon, iconB: f.iconB || f.icon, a, b, kind: featureKind(a, b), relevant: Boolean(f.relevant), pair: forced.has(i)};
  });
  const units = [];
  features.forEach(F => {
    if (F.kind === 'none' && !F.pair) return;
    if (F.pair || F.kind === 'differs') units.push({f: F.i, w: 2});
    else units.push({f: F.i, w: 1});
  });
  const relSim = features.find(F => F.relevant && F.kind === 'shared');
  const relDiff = features.find(F => F.relevant && (F.kind === 'differs' || F.kind === 'only-a' || F.kind === 'only-b'));
  return {features, units, relSim: relSim ? relSim.i : null, relDiff: relDiff ? relDiff.i : null};
}

/**
 * Where each case prints a feature, for a given state of that feature.
 * Returns {a: cellKey|null, b: cellKey|null} where cellKey is 'L', 'R' or 'S'.
 */
export function printSpots(kind, isPair) {
  if (!isPair) return {a: kind === 'shared' || kind === 'only-a' ? 'S' : null, b: kind === 'shared' || kind === 'only-b' ? 'S' : null};
  if (kind === 'shared') return {a: 'L', b: 'L'};
  if (kind === 'differs') return {a: 'L', b: 'R'};
  if (kind === 'only-a') return {a: 'L', b: null};
  if (kind === 'only-b') return {a: null, b: 'R'};
  return {a: null, b: null};
}

/* ------------------------------------------------------------------ */
/* colours                                                             */
/* ------------------------------------------------------------------ */

/** Mix two #rrggbb colours. */
export function mixHex(a, b, t = 0.5) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = s => [(s >> 16) & 255, (s >> 8) & 255, s & 255];
  const A = ch(pa), B = ch(pb);
  const m = A.map((v, k) => Math.round(v + (B[k] - v) * t));
  return `#${((1 << 24) | (m[0] << 16) | (m[1] << 8) | m[2]).toString(16).slice(1)}`;
}

/** Ink per sheet: A = accent2, B = accent, merged = the two inks overprinted. */
export function inks(th) {
  return {
    a: {ink: th.accent2, soft: th.accent2Soft},
    b: {ink: th.accent, soft: th.accentSoft},
    m: {ink: shade(mixHex(th.accent, th.accent2), -0.45), soft: mixHex(th.accentSoft, th.accent2Soft)},
    n: {ink: th.ink, soft: th.paperShade},
  };
}

/* ------------------------------------------------------------------ */
/* pictograms (original vector drawings, authored in a 100×100 box)   */
/* ------------------------------------------------------------------ */

/**
 * Pictogram centred on (0,0), `s` design units wide.
 * @param {string} kind
 * @param {{s:number, ink:string, soft:string}} o
 */
export function pictogram(kind, o) {
  const k = o.s / 100;
  return g({transform: `scale(${r(k, 4)})`}, iconParts(kind, o.ink, o.soft));
}

function iconParts(kind, ink, soft) {
  const S = {stroke: ink, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
  const F = {fill: soft, ...S};
  const N = {fill: 'none', ...S};
  const W = '#ffffff';
  const bar = (x1, y1, x2, y2, w = 11) => [
    h('line', {x1, y1, x2, y2, stroke: ink, 'stroke-width': w, 'stroke-linecap': 'round'}),
    h('line', {x1, y1, x2, y2, stroke: soft, 'stroke-width': w * 0.42, 'stroke-linecap': 'round'}),
  ];
  switch (kind) {
    case 'ladder': {
      const rungs = [0.16, 0.38, 0.6, 0.82].map(t => {
        const y = 46 - 92 * t;
        return bar(-26 + 14 * t, y, 14 + 14 * t, y, 8);
      });
      return [rungs, bar(-26, 46, -12, -46), bar(14, 46, 28, -46)];
    }
    case 'bicycle':
      return [
        h('circle', {cx: -27, cy: 20, r: 21, ...F}), h('circle', {cx: -27, cy: 20, r: 12, fill: W, stroke: ink, 'stroke-width': 2.5}),
        h('circle', {cx: 27, cy: 20, r: 21, ...F}), h('circle', {cx: 27, cy: 20, r: 12, fill: W, stroke: ink, 'stroke-width': 2.5}),
        h('path', {d: 'M-27 20L-4 20L13 -8L-14 -8Z', ...N}),
        h('path', {d: 'M-4 20L-17 -20M13 -8L27 20M13 -8L10 -23', ...N}),
        h('path', {d: 'M-26 -21H-9M3 -25Q10 -27 17 -22', ...N, 'stroke-width': 6}),
        h('circle', {cx: -4, cy: 20, r: 5, fill: ink}),
      ];
    case 'note':
      return [
        h('path', {d: 'M-30 -44H16L30 -30V44H-30Z', ...F}),
        h('path', {d: 'M16 -44V-30H30', ...N, 'stroke-width': 4}),
        h('path', {d: 'M-20 -24H18M-20 -10H18M-20 4H18M-20 18H4', ...N, 'stroke-width': 4}),
        h('path', {d: 'M-20 33q6 -9 12 0t12 0t12 0', ...N, 'stroke-width': 3.5}),
      ];
    case 'calendar':
      return [
        h('rect', {x: -38, y: -32, width: 76, height: 76, rx: 8, ...F}),
        h('path', {d: 'M-38 -24Q-38 -32 -30 -32H30Q38 -32 38 -24V-14H-38Z', fill: ink, stroke: ink, 'stroke-width': 5, 'stroke-linejoin': 'round'}),
        h('rect', {x: -24, y: -42, width: 7, height: 17, rx: 3, fill: W, stroke: ink, 'stroke-width': 3}),
        h('rect', {x: 17, y: -42, width: 7, height: 17, rx: 3, fill: W, stroke: ink, 'stroke-width': 3}),
        [-4, 12, 28].flatMap(y => [-22, -4, 14].map(x => h('rect', {x, y, width: 8, height: 8, rx: 1.5, fill: ink, opacity: 0.55}))),
        h('circle', {cx: 18, cy: 16, r: 10, fill: 'none', stroke: ink, 'stroke-width': 4}),
      ];
    case 'key':
      return [
        h('path', {d: 'M-6 -6H42V6H36V17H29V6H22V13H15V6H-6Z', ...F}),
        h('circle', {cx: -24, cy: 0, r: 19, ...F}),
        h('circle', {cx: -24, cy: 0, r: 6, fill: W, stroke: ink, 'stroke-width': 3}),
      ];
    case 'house':
      return [
        h('rect', {x: 18, y: -38, width: 10, height: 22, fill: soft, stroke: ink, 'stroke-width': 4}),
        h('rect', {x: -34, y: -8, width: 68, height: 54, ...F}),
        h('path', {d: 'M-46 -4L0 -44L46 -4Z', fill: ink, stroke: ink, 'stroke-width': 5, 'stroke-linejoin': 'round'}),
        h('rect', {x: -10, y: 16, width: 18, height: 30, rx: 2, fill: W, stroke: ink, 'stroke-width': 3.5}),
        h('rect', {x: 14, y: 4, width: 14, height: 13, fill: W, stroke: ink, 'stroke-width': 3}),
        h('rect', {x: -28, y: 4, width: 12, height: 13, fill: W, stroke: ink, 'stroke-width': 3}),
      ];
    case 'rain':
      return [
        h('path', {d: 'M-30 6C-46 6 -44 -16 -28 -15C-27 -31 -5 -35 3 -23C11 -35 36 -31 34 -13C47 -11 45 6 32 6Z', ...F}),
        h('path', {d: 'M-22 18L-28 32M-5 18L-11 32M12 18L6 32M29 18L23 30', ...N}),
      ];
    case 'sun': {
      const rays = [];
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        rays.push(h('line', {x1: r(Math.cos(a) * 27), y1: r(Math.sin(a) * 27), x2: r(Math.cos(a) * 40), y2: r(Math.sin(a) * 40), ...N}));
      }
      return [rays, h('circle', {cx: 0, cy: 0, r: 19, ...F})];
    }
    case 'parcel':
      return [
        h('path', {d: 'M-34 -8L-18 -24H34L18 -8Z', ...F}),
        h('path', {d: 'M18 -8L34 -24V24L18 40Z', fill: shade(soft, -0.12), ...S}),
        h('path', {d: 'M-34 -8H18V40H-34Z', ...F}),
        h('path', {d: 'M-10 -8V40M-10 -8L6 -24', ...N, 'stroke-width': 4}),
        h('rect', {x: -30, y: 18, width: 14, height: 10, fill: W, stroke: ink, 'stroke-width': 2.5}),
      ];
    case 'clock': {
      const ticks = [];
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        ticks.push(h('line', {x1: r(Math.cos(a) * 31), y1: r(Math.sin(a) * 31), x2: r(Math.cos(a) * 36), y2: r(Math.sin(a) * 36), stroke: ink, 'stroke-width': i % 3 ? 2.5 : 4.5, 'stroke-linecap': 'round'}));
      }
      return [
        h('circle', {cx: 0, cy: 0, r: 42, ...F}),
        h('circle', {cx: 0, cy: 0, r: 36, fill: W, stroke: 'none'}),
        ticks,
        h('path', {d: 'M0 2V-24M0 2H19', ...N, 'stroke-width': 5.5}),
        h('circle', {cx: 0, cy: 2, r: 4.5, fill: ink}),
      ];
    }
    case 'coins': {
      const coin = y => [
        h('path', {d: `M-32 ${y}A32 10 0 0 0 32 ${y}V${y + 9}A32 10 0 0 1 -32 ${y + 9}Z`, fill: shade(soft, -0.1), ...S}),
        h('ellipse', {cx: 0, cy: y, rx: 32, ry: 10, ...F}),
      ];
      return [coin(26), coin(12), coin(-2), coin(-16), h('ellipse', {cx: 0, cy: -16, rx: 14, ry: 4, fill: 'none', stroke: ink, 'stroke-width': 2.5})];
    }
    case 'person':
      return [
        h('path', {d: 'M-34 44C-34 14 -18 4 0 4C18 4 34 14 34 44Z', ...F}),
        h('circle', {cx: 0, cy: -20, r: 18, ...F}),
      ];
    case 'lock':
      return [
        h('path', {d: 'M-17 -8V-22A17 17 0 0 1 17 -22V-8', fill: 'none', stroke: ink, 'stroke-width': 8, 'stroke-linecap': 'round'}),
        h('rect', {x: -30, y: -10, width: 60, height: 50, rx: 7, ...F}),
        h('circle', {cx: 0, cy: 10, r: 6, fill: ink}),
        h('rect', {x: -2.5, y: 12, width: 5, height: 15, rx: 2, fill: ink}),
      ];
    case 'car':
      return [
        h('path', {d: 'M-46 20V4Q-46 -4 -36 -6L-22 -8L-10 -26H18L32 -8L40 -6Q46 -4 46 4V20Z', ...F}),
        h('path', {d: 'M-6 -22H4V-10H-15Z', fill: W, stroke: ink, 'stroke-width': 3}),
        h('path', {d: 'M8 -22H16L25 -10H8Z', fill: W, stroke: ink, 'stroke-width': 3}),
        h('circle', {cx: -25, cy: 22, r: 11, fill: ink}), h('circle', {cx: -25, cy: 22, r: 4, fill: W}),
        h('circle', {cx: 25, cy: 22, r: 11, fill: ink}), h('circle', {cx: 25, cy: 22, r: 4, fill: W}),
      ];
    case 'tree':
      return [
        h('rect', {x: -6, y: 6, width: 12, height: 40, rx: 2, fill: shade(soft, -0.15), ...S}),
        h('path', {d: 'M-30 10C-46 0 -36 -26 -19 -24C-17 -46 17 -46 19 -24C36 -26 46 0 30 10C18 18 -18 18 -30 10Z', ...F}),
      ];
    case 'phone':
      return [
        h('rect', {x: -22, y: -44, width: 44, height: 88, rx: 9, ...F}),
        h('rect', {x: -16, y: -34, width: 32, height: 58, rx: 3, fill: W, stroke: ink, 'stroke-width': 3}),
        h('circle', {cx: 0, cy: 34, r: 4.5, fill: ink}),
      ];
    default:
      return [h('circle', {cx: 0, cy: 0, r: 30, ...F})];
  }
}

/* ------------------------------------------------------------------ */
/* sheet geometry                                                      */
/* ------------------------------------------------------------------ */

/**
 * Pack width-1/width-2 units into rows of C columns (a pair never straddles a
 * row; a later single unit may move up to fill a gap).
 */
function packUnits(units, C) {
  const rest = units.slice();
  const rows = [];
  let row = [];
  let used = 0;
  let guard = 0;
  while (rest.length && guard++ < 200) {
    const u = rest[0];
    if (u.w > C) return null;
    if (used + u.w <= C) {
      row.push({...u, col: used});
      used += u.w;
      rest.shift();
    } else {
      const k = rest.findIndex(x => x.w <= C - used);
      if (k > 0) {
        const x = rest.splice(k, 1)[0];
        row.push({...x, col: used});
        used += x.w;
      } else {
        rows.push({units: row, used});
        row = [];
        used = 0;
      }
    }
    if (used === C) {
      rows.push({units: row, used});
      row = [];
      used = 0;
    }
  }
  if (row.length) rows.push({units: row, used});
  return rows;
}

/** True when a fitted text block had to wrap inside a word (no hyphen is drawn). */
export function brokeWord(f) {
  if (!f || f.truncated) return false;
  return f.lines.join(' ').replace(/\s+/g, ' ').trim() !== String(f.full ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Slot geometry shared by BOTH sheets (local coordinates, origin = sheet
 * top-left). Chooses the column count that gives the largest pictograms with
 * untruncated labels.
 * @param {any} ctx
 * @param {{w:number, h:number, units:Array<{f:number,w:number}>, texts:string[], names:{a:string,b:string,na?:string,nb?:string}, size:number, minSize?:number, maxLines?:number, cols?:number[], showLabels:boolean, showNames:boolean, nameSize?:number}} o
 */
export function sheetGeometry(ctx, o) {
  const w = o.w, hh = o.h;
  const pad = Math.max(16, w * 0.035);
  const holeY = 20;
  const nameSize = o.nameSize ?? Math.max(20, Math.min(30, w * 0.042));
  // compact: no name band (the entry labels the sheet elsewhere), only the
  // registration holes above the slots
  const headerTop = o.compact ? 30 : 38;
  // header: two halves (A left, B right); each name wraps to 2 lines
  // (opt-in stackNames: A's name row above B's, each the full width — still
  // different places on the sheet, so the overlaid names never overprint)
  const half = o.stackNames ? w - 2 * pad - nameSize * 1.9 : w / 2 - pad - nameSize * 1.9;
  let header = o.compact ? 6 : nameSize * 2.1;
  // (opt-in: nameMin / nameLines / noteSize / noteMin / noteLines let an
  // entry keep long names and notes whole at a readable size)
  const fitName = (text, sz) => ctx.fit(text, {maxWidth: half, size: sz, minSize: o.nameMin ?? Math.max(15, sz * 0.72), maxLines: o.nameLines ?? 2, weight: 700});
  const fitNote = text => ctx.fit(text, {maxWidth: half, size: o.noteSize ?? nameSize * 0.72, minSize: o.noteMin ?? 14, maxLines: o.noteLines ?? 1, weight: 500});
  let names = null;
  if (o.showNames) {
    const na = fitName(o.names.a, nameSize), nb = fitName(o.names.b, nameSize);
    const ta = o.names.na ? fitNote(o.names.na) : null, tb = o.names.nb ? fitNote(o.names.nb) : null;
    const hA = na.height + (ta ? ta.height + 6 : 0), hB = nb.height + (tb ? tb.height + 6 : 0);
    header = o.stackNames ? Math.max(nameSize * 1.7, hA) + 10 + Math.max(nameSize * 1.7, hB) + 14 : Math.max(nameSize * 1.9, hA, hB) + 14;
    names = {a: na, b: nb, na: ta, nb: tb, rowB: o.stackNames ? Math.max(nameSize * 1.7, hA) + 10 : 0};
  }
  const bodyTop = headerTop + header + 8;
  const bodyBottom = hh - 30; // crosshairs sit in the bottom corners
  const innerW = w - 2 * pad;
  const innerH = bodyBottom - bodyTop;
  const baseLines = o.maxLines ?? 3;
  const candidates = o.cols ?? [1, 2, 3, 4, 5, 6];
  const minPs = o.minPicto ?? Math.max(56, Math.min(w, hh) * 0.15);
  let best = null;
  for (const C of candidates) {
    const rows = packUnits(o.units, C);
    if (!rows) continue;
    const nr = rows.length;
    const cw = innerW / C;
    const rh = innerH / nr;
    // never start below the caller's minimum size
    const floor = o.minSize ?? 0;
    for (const [sz, maxLines] of [[o.size, baseLines], [o.size * 0.9, baseLines], [o.size * 0.82, baseLines], [o.size * 0.8, baseLines + 1]].map(([s0, l]) => [Math.max(s0, floor), l])) {
      const minS = Math.max(o.minSize ?? 15, sz * 0.8);
      let lines = 1, trunc = false, fitted = sz;
      if (o.showLabels) {
        for (const t of o.texts) {
          if (!t) continue;
          const f = ctx.fit(t, {maxWidth: cw - 16, size: sz, minSize: minS, maxLines, weight: 600});
          lines = Math.max(lines, f.lines.length);
          // opt-in: a label that could only wrap inside a word counts as truncated
          trunc = trunc || f.truncated || Boolean(o.wordSafe && brokeWord(f));
          fitted = Math.min(fitted, f.size);
        }
      }
      const labelH = o.showLabels ? lines * fitted * 1.18 + 6 : 0;
      const pa = rh - labelH - 28;
      const ps = Math.min(cw * 0.7, pa, o.maxPicto ?? 170);
      if (ps < 30) continue;
      const empty = nr * C - o.units.reduce((s, u) => s + u.w, 0);
      const waste = Math.max(0, rh - (ps + 28 + labelH)) / rh;
      const score = ps + (ps < minPs ? -150 - (minPs - ps) * 3 : 0) + (trunc ? -400 : 0) + fitted * 2.5 - empty * 5 - waste * 45 + (sz === o.size ? 8 : 0);
      if (!best || score > best.score) best = {score, C, rows, cw, rh, labelH, ps, size: fitted, lines, minS, trunc, maxLines};
    }
  }
  if (!best) {
    // degenerate fallback: one row, tiny pictograms
    const C = Math.max(1, o.units.reduce((s, u) => s + u.w, 0));
    best = {C, rows: packUnits(o.units, C) || [], cw: innerW / C, rh: innerH, labelH: 0, ps: 34, size: o.size * 0.8, lines: 1, minS: 12, trunc: true, fallback: true};
  }
  // optional: move listed features to one end of their row (threads enter
  // the sheet from that side, so a listed feature is reached without passing
  // over any other print); `first` is in priority order (first = outermost)
  if (o.rowEnd && o.rowEnd.first && o.rowEnd.first.length) {
    const pri = f => o.rowEnd.first.indexOf(f);
    best = {...best, rows: best.rows.map(row => {
      const others = row.units.filter(u => pri(u.f) < 0);
      const ends = row.units.filter(u => pri(u.f) >= 0);
      const ordered = o.rowEnd.side === 'left'
        ? [...ends.sort((a, b) => pri(a.f) - pri(b.f)), ...others]
        : [...others, ...ends.sort((a, b) => pri(b.f) - pri(a.f))];
      let col = 0;
      return {...row, units: ordered.map(u => { const v = {...u, col}; col += u.w; return v; })};
    })};
  }
  const cells = [];
  const rowsOut = [];
  const unitCells = {};
  best.rows.forEach((row, ri) => {
    const y0 = bodyTop + ri * best.rh;
    const off = ((best.C - row.used) * best.cw) / 2;
    // centre the picture + label block in the row
    const block = best.ps + 20 + best.labelH;
    const groundY = y0 + Math.max(8, (best.rh - block) / 2) + best.ps + 8;
    rowsOut.push({y: y0, h: best.rh, groundY, x0: pad + 6, x1: w - pad - 6});
    for (const u of row.units) {
      const mk = (col, key) => {
        const x = pad + off + col * best.cw;
        const cell = {f: u.f, key, x, y: y0, w: best.cw, h: best.rh, groundY,
          pc: {x: x + best.cw / 2, y: groundY - best.ps / 2 - 4}, ps: best.ps,
          label: {x: x + best.cw / 2, y: groundY + 12, w: best.cw - 16}};
        cells.push(cell);
        return cell;
      };
      const k = row.units.indexOf(u);
      const pos = {row: ri, first: k === 0, last: k === row.units.length - 1};
      if (u.w === 2) unitCells[u.f] = {L: mk(u.col, 'L'), R: mk(u.col + 1, 'R'), pair: true, ...pos};
      else unitCells[u.f] = {S: mk(u.col, 'S'), pair: false, ...pos};
    }
  });
  const fitLabel = text => ctx.fit(text, {maxWidth: best.cw - 16, size: best.size, minSize: best.minS, maxLines: best.maxLines ?? baseLines, weight: 600});
  return {
    w, h: hh, pad, headerTop, header, bodyTop, nameSize, names, half, stackNames: Boolean(o.stackNames && names),
    holes: [{x: w * 0.3, y: holeY, r: 8.5}, {x: w * 0.7, y: holeY, r: 8.5}],
    cross: [{x: 24, y: hh - 22}, {x: w - 24, y: hh - 22}],
    cells, rows: rowsOut, unitCells, cols: best.C, ps: best.ps, labelSize: best.size, fitLabel, fallback: Boolean(best.fallback), truncated: Boolean(best.trunc), compact: Boolean(o.compact),
  };
}

/** Cell of a feature for a spot key ('L' | 'R' | 'S'). */
export function cellOf(geo, f, key) {
  const u = geo.unitCells[f];
  if (!u) return null;
  return u[key] || u.S || u.L;
}

/** Position of the "≠"/"=" badge for a feature in a given state (sheet-local). */
export function badgeSpot(geo, f, kind) {
  const u = geo.unitCells[f];
  if (!u) return null;
  if (u.pair) {
    if (kind === 'differs') return {x: u.L.x + u.L.w, y: u.L.pc.y};
    const c = kind === 'only-b' ? u.R : u.L;
    return {x: c.pc.x + c.ps * 0.5 + 6, y: c.pc.y - c.ps * 0.42};
  }
  const c = u.S;
  return {x: c.pc.x + c.ps * 0.5 + 6, y: c.pc.y - c.ps * 0.42};
}

/** Rectangle around the drawings of a feature in a given state (sheet-local). */
export function featureRing(geo, f, kind) {
  const u = geo.unitCells[f];
  if (!u) return null;
  const pad = 12;
  const box = c => ({x: c.pc.x - c.ps / 2 - pad, y: c.pc.y - c.ps / 2 - pad, w: c.ps + 2 * pad, h: c.ps + 2 * pad});
  if (u.pair && kind === 'differs') {
    const a = box(u.L), b = box(u.R);
    return {x: a.x, y: a.y, w: b.x + b.w - a.x, h: a.h};
  }
  if (u.pair) return box(kind === 'only-b' ? u.R : u.L);
  return box(u.S);
}

/* ------------------------------------------------------------------ */
/* drawing: sheet, print, badges                                       */
/* ------------------------------------------------------------------ */

const circleSub = c => `M${r(c.x - c.r)} ${r(c.y)}a${r(c.r)} ${r(c.r)} 0 1 0 ${r(2 * c.r)} 0a${r(c.r)} ${r(c.r)} 0 1 0 ${r(-2 * c.r)} 0Z`;

/**
 * Tracing-paper sheet (static parts): paper with punched registration holes,
 * drafting grid, crosshairs, ground lines and the case's half of the header.
 * Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, geo:any, which:'a'|'b', ink:string, paperOpacity?:number, noText?:boolean, bare?:boolean, noLetter?:boolean}} o
 */
export function sheetBase(ctx, o) {
  const th = ctx.theme;
  const G = o.geo;
  const P = o.prefix;
  const {w, h: hh} = G;
  const paperD = roundRectPath(0, 0, w, hh, 12) + G.holes.map(circleSub).join('');
  const grid = [];
  for (let x = 40; x < w - 10; x += 40) grid.push(`M${r(x)} 40V${r(hh - 8)}`);
  for (let y = 48; y < hh - 8; y += 40) grid.push(`M10 ${r(y)}H${r(w - 10)}`);
  const ground = G.rows.map(row => g(null,
    h('rect', {x: r(row.x0), y: r(row.groundY), width: r(row.x1 - row.x0), height: 10, rx: 5, fill: o.ink, opacity: 0.1}),
    h('line', {x1: r(row.x0), x2: r(row.x1), y1: r(row.groundY), y2: r(row.groundY), stroke: o.ink, 'stroke-width': 2.5, opacity: 0.55}),
  ));
  const cross = G.cross.map(c => g(null,
    h('circle', {cx: c.x, cy: c.y, r: 9, fill: 'none', stroke: o.ink, 'stroke-width': 2.2}),
    h('path', {d: `M${c.x - 16} ${c.y}H${c.x + 16}M${c.x} ${c.y - 16}V${c.y + 16}`, stroke: o.ink, 'stroke-width': 2.2}),
  ));
  // header half: A prints on the left half, B on the right half
  const left = o.which === 'a';
  const hx = left || G.stackNames ? G.pad : w / 2 + 8;
  const badgeR = G.nameSize * 0.78;
  const nameY = G.headerTop + (G.stackNames && G.names && !left ? G.names.rowB : 0);
  const by = nameY + badgeR + 2;
  const header = [
    h('line', {x1: r(G.pad), x2: r(w - G.pad), y1: r(G.headerTop + G.header), y2: r(G.headerTop + G.header), stroke: o.ink, 'stroke-width': 2, 'stroke-dasharray': '6 7', opacity: 0.45}),
    o.bare && o.noLetter && G.compact ? null : h('circle', {cx: r(hx + badgeR), cy: r(by), r: r(badgeR), fill: o.ink, stroke: th.ink, 'stroke-width': 2}),
  ];
  if (ctx.show('key') && !o.noText && !o.noLetter) header.push(h('text', {name: `${P}-letter`, x: r(hx + badgeR), y: r(by + badgeR * 0.42), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(badgeR * 1.15), 'font-weight': 800, fill: '#ffffff'}, left ? 'A' : 'B'));
  const nameX = hx + badgeR * 2 + 10;
  const nameNodes = [];
  if (G.names && !o.noText) {
    const nf = left ? G.names.a : G.names.b;
    const tf = left ? G.names.na : G.names.nb;
    nameNodes.push(textBlock(nf, {x: nameX, y: nameY, fill: th.ink, name: `${P}-name`}));
    if (tf) nameNodes.push(textBlock(tf, {x: nameX, y: nameY + nf.height + 6, fill: th.inkSoft, name: `${P}-note`}));
  } else if (!o.bare) {
    header.push(h('rect', {x: r(nameX), y: r(by - 7), width: r(G.half * 0.7), height: 14, rx: 7, fill: o.ink, opacity: 0.35}));
  }
  const node = g({name: P},
    h('path', {name: `${P}-shadow`, d: roundRectPath(7, 10, w, hh, 12), fill: th.shadow}),
    h('path', {d: paperD, 'fill-rule': 'evenodd', fill: '#f8f6ef', 'fill-opacity': o.paperOpacity ?? 0.9, stroke: shade('#c9c2b4', -0.1), 'stroke-width': 2}),
    h('path', {d: grid.join(''), stroke: '#8fb4d3', 'stroke-width': 1, opacity: 0.28, fill: 'none'}),
    G.holes.map(c => h('circle', {cx: r(c.x), cy: r(c.y), r: r(c.r + 3), fill: 'none', stroke: '#b9b2a4', 'stroke-width': 2})),
    ground,
    cross,
    header,
    g({name: `${P}-names`}, nameNodes),
  );
  return {node, nameX, nameY, badge: {x: hx + badgeR, y: by, r: badgeR}};
}

/**
 * One printed feature: pictogram standing on the ground line + label below.
 * Names: `${name}` (group), `${name}-pic`, `${name}-lab` (text, if any).
 * @param {any} ctx
 * @param {any} geo
 * @param {{name:string, cell:any, icon:string, text:string, ink:string, soft:string, showText?:boolean, dashed?:boolean, opacity?:number}} o
 */
export function printNode(ctx, geo, o) {
  const c = o.cell;
  const th = ctx.theme;
  const shadow = h('ellipse', {cx: r(c.pc.x), cy: r(c.groundY + 1), rx: r(c.ps * 0.42), ry: 6, fill: o.ink, opacity: 0.18});
  const pic = g({name: `${o.name}-pic`, transform: T(c.pc.x, c.pc.y)}, pictogram(o.icon, {s: c.ps, ink: o.ink, soft: o.soft}));
  let lab = null;
  let fit = null;
  if (o.text && o.showText !== false && ctx.show('key')) {
    fit = geo.fitLabel(o.text);
    lab = textBlock(fit, {x: c.label.x, y: c.label.y, anchor: 'middle', fill: th.ink, name: `${o.name}-lab`});
  }
  const labBox = fit ? {x: c.label.x - fit.width / 2, y: c.label.y, w: fit.width, h: fit.height} : null;
  return {node: g({name: o.name, opacity: o.opacity}, shadow, pic, lab), labBox, fit};
}

/**
 * "=" (coincides) or "≠" (differs) badge drawn as paths — no text, so it
 * survives textVisibility 'none'. Local origin = centre.
 */
export function relBadge(ctx, {name, kind, x, y, rad = 17, color, opacity}) {
  const th = ctx.theme;
  const k = rad / 17;
  const bars = `M${r(-8 * k)} ${r(-4 * k)}H${r(8 * k)}M${r(-8 * k)} ${r(4 * k)}H${r(8 * k)}`;
  // 'one': the feature is printed on one sheet only — an empty dashed slot
  const glyph = kind === 'one'
    ? h('circle', {r: r(7.5 * k), fill: 'none', stroke: color, 'stroke-width': r(2.6 * k), 'stroke-dasharray': `${r(3.2 * k)} ${r(2.6 * k)}`})
    : h('path', {d: kind === 'ne' ? `${bars}M${r(5 * k)} ${r(-11 * k)}L${r(-5 * k)} ${r(11 * k)}` : bars, stroke: color, 'stroke-width': r(3.4 * k), 'stroke-linecap': 'round', fill: 'none'});
  return g({name, transform: T(x, y), opacity},
    h('circle', {r: r(rad), fill: th.card, stroke: color, 'stroke-width': r(3 * k)}),
    glyph,
  );
}

/** Glyph kind of a resolved feature kind. */
export const glyphOf = kind => (kind === 'shared' ? 'eq' : kind === 'differs' ? 'ne' : 'one');

/* ------------------------------------------------------------------ */
/* rule card                                                           */
/* ------------------------------------------------------------------ */

/**
 * Index card with a binder clip: rule name, supplied rule text and one socket
 * per feature the rule names (mini pictogram). With `captioned`, the sockets
 * listed there reserve a caption slot beside them (the entry fills it in the
 * final hold). Local origin = top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, name:string, text:string, sockets:Array<{icon:string, f:number}>, captioned?:number[], captionTexts?:string[], size?:number, textMin?:number, maxLines?:number, socketR?:number, socketsFirst?:boolean, socketsAlign?:'left'|'right'}} o
 */
export function ruleCard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const w = o.w;
  const size = o.size ?? 24;
  const pad = 24;
  const sR = o.socketR ?? 28;
  const textW = w - pad * 2;
  const showText = ctx.show('all');
  const capSize = Math.max(16, size * 0.92);
  const parts = [];
  let y = 26;
  let titleFit = null, textFit = null;
  const writeText = () => {
    if (showText) {
      titleFit = ctx.fit(o.name, {maxWidth: textW, size: Math.max(size * 0.95, o.textMin ?? 0), minSize: o.textMin ?? 15, maxLines: 2, weight: 700});
      parts.push(textBlock(titleFit, {x: pad, y, fill: th.ink, name: `${P}-title`}));
      y += titleFit.height + 12;
      textFit = ctx.fit(o.text, {maxWidth: textW, size, minSize: o.textMin ?? Math.max(15, size * 0.75), maxLines: o.maxLines ?? 4, weight: 500, family: 'serif'});
      parts.push(textBlock(textFit, {x: pad, y, fill: th.ink, italic: true, name: `${P}-text`}));
      y += textFit.height + 14;
    } else {
      parts.push(h('rect', {x: pad, y: y + 2, width: textW * 0.45, height: 16, rx: 8, fill: th.ink, opacity: 0.75}));
      for (let i = 0; i < 2; i++) parts.push(h('rect', {x: pad, y: y + 36 + i * 24, width: textW * (i === 1 ? 0.55 : 0.92), height: 10, rx: 5, fill: th.paperLine}));
      y += 36 + 2 * 24 + 8;
    }
  };
  if (!o.socketsFirst) writeText();
  // sockets: one row; captioned sockets reserve a caption slot to their right,
  // otherwise (too narrow) the sockets stack in rows with the caption beside each
  const cap = new Set(o.captioned || []);
  const n = o.sockets.length;
  const k = o.sockets.filter(s => cap.has(s.f)).length;
  const avail = textW - n * (2 * sR + 14);
  const capW = k ? avail / k : 0;
  // one row when every supplied caption fits on one line beside its socket
  const capFits = (o.captionTexts || []).every(tx => !tx || ctx.fit(tx, {maxWidth: capW - 16, size: capSize, minSize: capSize, maxLines: 2, weight: 700}).truncated === false);
  const rowMode = !k || (capW >= 170 && (!ctx.show('key') || capFits));
  let sockets = [];
  const captionSlots = [];
  if (rowMode) {
    // caption slots as wide as their text (plus air), so the row can be right-aligned
    const texts = o.captionTexts || [];
    let ci = 0;
    const slotW = o.sockets.map(s => {
      if (!cap.has(s.f)) return 0;
      const tx = texts[ci++] || '';
      return Math.min(capW, (ctx.show('key') ? ctx.measure(tx, capSize, 700, 'sans') : 0) + 34);
    });
    const cy = y + sR + 2;
    if (o.socketsAlign === 'right') {
      // right-aligned, each caption to the LEFT of its socket
      let x = w - pad;
      for (let i = o.sockets.length - 1; i >= 0; i--) {
        const s = o.sockets[i];
        sockets[i] = {...s, x: x - sR, y: cy, r: sR};
        x -= 2 * sR + 12;
        if (cap.has(s.f)) {
          captionSlots[i] = {x: x - slotW[i] + 14, w: slotW[i] - 16};
          x -= slotW[i] + 6;
        } else x -= 8;
      }
    } else {
      let x = pad;
      o.sockets.forEach((s, i) => {
        sockets.push({...s, x: x + sR, y: cy, r: sR});
        x += 2 * sR + 14;
        if (cap.has(s.f)) {
          captionSlots[i] = {x, w: slotW[i] - 16};
          x += slotW[i];
        }
      });
    }
    y = cy + sR + 18;
  } else {
    o.sockets.forEach((s, i) => {
      const cy = y + sR + 2;
      sockets.push({...s, x: pad + sR, y: cy, r: sR});
      if (cap.has(s.f)) captionSlots[i] = {x: pad + 2 * sR + 14, w: textW - 2 * sR - 14};
      y = cy + sR + 10;
    });
    y += 8;
  }
  if (o.socketsFirst) {
    y += 4;
    writeText();
  }
  const hh = y;
  // card body: paper, ruled lines, margin
  const lines = [];
  for (let ly = 60; ly < hh - 8; ly += 30) lines.push(`M12 ${ly}H${w - 12}`);
  const body = [
    h('path', {d: roundRectPath(6, 9, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: '#fffaf0', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: lines.join(''), stroke: '#a9c6de', 'stroke-width': 1.4, opacity: 0.6}),
    h('line', {x1: 14, x2: 14, y1: 6, y2: hh - 6, stroke: '#d98b7a', 'stroke-width': 1.6, opacity: 0.8}),
  ];
  const sockNodes = sockets.map((s, i) => g({name: `${P}-sock${i}`},
    h('circle', {cx: r(s.x), cy: r(s.y), r: r(s.r), fill: th.paperShade, stroke: th.ink, 'stroke-width': 2.5}),
    g({transform: T(s.x, s.y)}, pictogram(s.icon, {s: s.r * 1.3, ink: th.ink, soft: '#ffffff'})),
  ));
  // binder clip
  const cx = w / 2;
  const clip = g(null,
    h('path', {d: `M${r(cx - 38)} -8H${r(cx + 38)}L${r(cx + 32)} 20H${r(cx - 32)}Z`, fill: '#2b2f35', stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(cx - 22)} -6L${r(cx - 30)} -34H${r(cx + 30)}L${r(cx + 22)} -6`, fill: 'none', stroke: '#aeb6bd', 'stroke-width': 4, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(cx - 34), y: 10, width: 68, height: 4, fill: '#ffffff', opacity: 0.25}),
  );
  const node = g({name: P}, body, parts, sockNodes, clip);
  return {node, w, h: hh, sockets, captionSlots, capSize, titleFit, textFit};
}

/* ------------------------------------------------------------------ */
/* magnifier                                                           */
/* ------------------------------------------------------------------ */

/**
 * Top-down magnifying glass whose lens shows a REAL enlarged copy of the
 * scene beneath it. `content` must be drawn in world (scene) coordinates; the
 * copy is scaled about the lens centre each frame. Node names:
 * `${prefix}` (whole), `${prefix}-clipc` (clip circle), `${prefix}-zoom`
 * (content transform), `${prefix}-body` (ring + handle), `${prefix}-shadow`.
 * @param {any} ctx
 * @param {{prefix:string, R:number, handle:number, content:any, zoom:number, ring?:string}} o
 */
export function magnifier(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const R = o.R;
  const L = o.handle;
  const clipId = `${P}-clip`;
  const ring = o.ring ?? '#30353b';
  const node = g({name: P},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('circle', {name: `${P}-clipc`, cx: 0, cy: 0, r: r(R - 6)}))),
    g({name: `${P}-shadow`, opacity: 0.9},
      h('circle', {name: `${P}-shadow-c`, cx: 0, cy: 0, r: r(R + 6), fill: th.shadow}),
    ),
    g({'clip-path': ctx.ref(clipId)}, g({name: `${P}-zoom`}, o.content)),
    g({name: `${P}-body`},
      h('circle', {r: r(R - 6), fill: '#dcefff', opacity: 0.16}),
      h('path', {d: `M${r(-R * 0.62)} ${r(-R * 0.18)}A${r(R * 0.66)} ${r(R * 0.66)} 0 0 1 ${r(-R * 0.1)} ${r(-R * 0.64)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': r(R * 0.09), 'stroke-linecap': 'round', opacity: 0.75}),
      h('circle', {r: r(R), fill: 'none', stroke: ring, 'stroke-width': r(R * 0.15)}),
      h('circle', {r: r(R + R * 0.075), fill: 'none', stroke: th.ink, 'stroke-width': 2}),
      h('circle', {r: r(R - R * 0.075), fill: 'none', stroke: '#6b737b', 'stroke-width': 1.5}),
      // handle along +x
      h('rect', {x: r(R + 2), y: r(-R * 0.13), width: r(L * 0.2), height: r(R * 0.26), rx: 4, fill: '#9aa4ad', stroke: th.ink, 'stroke-width': 2}),
      h('rect', {x: r(R + L * 0.2), y: r(-R * 0.17), width: r(L * 0.8), height: r(R * 0.34), rx: r(R * 0.17), fill: '#7a4e2d', stroke: th.ink, 'stroke-width': 2.4}),
      h('rect', {x: r(R + L * 0.26), y: r(-R * 0.1), width: r(L * 0.66), height: r(R * 0.06), rx: 2, fill: '#ffffff', opacity: 0.22}),
    ),
  );
  /**
   * @param {{x:number,y:number}} c lens centre
   * @param {number} angleDeg handle direction
   * @param {number} [lift=0] 0..1 (shadow offset while carried)
   */
  const frame = (c, angleDeg, lift = 0) => {
    const k = o.zoom;
    return {
      [`${P}-clipc`]: {cx: r(c.x), cy: r(c.y)},
      [`${P}-zoom`]: {transform: `translate(${r(c.x)} ${r(c.y)}) scale(${r(k, 4)}) translate(${r(-c.x)} ${r(-c.y)})`},
      [`${P}-body`]: {transform: T(c.x, c.y, angleDeg)},
      [`${P}-shadow`]: {transform: T(c.x + 8 + lift * 16, c.y + 12 + lift * 22)},
    };
  };
  /** World position of the handle grip for a lens pose. */
  const gripAt = (c, angleDeg) => {
    const a = (angleDeg * Math.PI) / 180;
    const d = R + L * 0.8;
    return {x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d};
  };
  return {node, frame, gripAt, R, L};
}

/* ------------------------------------------------------------------ */
/* light table                                                         */
/* ------------------------------------------------------------------ */

/**
 * Top-down light table: metal frame, glowing panel, power switch and cable.
 * Pegs are returned separately (drawn above the sheets they register).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, pegs:Array<{x:number,y:number}>, cable?:'left'|'right'|'bottom'|'none', trayH?:number}} o
 */
export function lightTable(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w, h: hh} = o;
  const inset = 22;
  const trayH = o.trayH ?? 0;
  const gid = `${P}-glow`;
  const cableEnd = o.cable === 'left' ? {x: x - 400, y: y + hh * 0.75} : o.cable === 'bottom' ? {x: x + w * 0.2, y: y + hh + 400} : {x: x + w + 400, y: y + hh * 0.8};
  const cableStart = o.cable === 'left' ? {x, y: y + hh * 0.7} : o.cable === 'bottom' ? {x: x + w * 0.25, y: y + hh} : {x: x + w, y: y + hh * 0.75};
  const node = g({name: P},
    h('defs', null, h('radialGradient', {id: ctx.id(gid), cx: '50%', cy: '45%', r: '70%'},
      h('stop', {offset: '0%', 'stop-color': '#fffff8'}),
      h('stop', {offset: '70%', 'stop-color': '#fbf7e6'}),
      h('stop', {offset: '100%', 'stop-color': '#efe6c8'}))),
    o.cable !== 'none' ? h('path', {d: `M${r(cableStart.x)} ${r(cableStart.y)}C${r(cableStart.x + (cableEnd.x - cableStart.x) * 0.3)} ${r(cableStart.y + 60)} ${r(cableStart.x + (cableEnd.x - cableStart.x) * 0.6)} ${r(cableEnd.y - 40)} ${r(cableEnd.x)} ${r(cableEnd.y)}`, fill: 'none', stroke: '#2b2f35', 'stroke-width': 9, 'stroke-linecap': 'round'}) : null,
    h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 18), fill: '#c3cad1', stroke: th.ink, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(x + 8, y + 8, w - 16, hh - 16, 12), fill: 'none', stroke: '#ffffff', 'stroke-width': 2, opacity: 0.6}),
    h('path', {d: roundRectPath(x + inset, y + inset, w - 2 * inset, hh - 2 * inset - trayH, 8), fill: ctx.ref(gid), stroke: '#8d969e', 'stroke-width': 2}),
    trayH > 0 ? g(null,
      h('path', {d: roundRectPath(x + inset, y + hh - trayH - inset * 0.4, w - 2 * inset, trayH - inset * 0.3, 14), fill: '#a9b2ba', stroke: '#7d868e', 'stroke-width': 2}),
      h('path', {d: roundRectPath(x + inset + 6, y + hh - trayH - inset * 0.4 + 5, w - 2 * inset - 12, 10, 5), fill: '#000000', opacity: 0.12}),
      h('rect', {x: r(x + w - inset - 150), y: r(y + hh - trayH / 2 - inset * 0.2 - 7), width: 120, height: 14, rx: 7, fill: '#e0a458', stroke: th.ink, 'stroke-width': 1.6}),
      h('path', {d: `M${r(x + w - inset - 30)} ${r(y + hh - trayH / 2 - inset * 0.2 - 7)}l14 7l-14 7Z`, fill: '#3a3f45'}),
    ) : null,
    h('circle', {cx: r(x + w - 14), cy: r(y + 14), r: 6, fill: '#58b368', stroke: th.ink, 'stroke-width': 1.6}),
  );
  const pegs = g({name: `${P}-pegs`}, o.pegs.map(p => g(null,
    h('circle', {cx: r(p.x + 2), cy: r(p.y + 3), r: 7.5, fill: th.shadow}),
    h('circle', {cx: r(p.x), cy: r(p.y), r: 6.5, fill: '#aab3bb', stroke: th.ink, 'stroke-width': 1.8}),
    h('circle', {cx: r(p.x - 2), cy: r(p.y - 2), r: 2, fill: '#ffffff', opacity: 0.8}),
  )));
  return {node, pegs, panel: {x: x + inset, y: y + inset, w: w - 2 * inset, h: hh - 2 * inset - trayH}};
}

/* ------------------------------------------------------------------ */
/* thread (wire): relation from a rule socket to a feature             */
/* ------------------------------------------------------------------ */

/**
 * A thread from a socket to a feature: a smooth curve to the sheet's edge at
 * the height of the target row's ground line (where no text is printed),
 * then straight along that ground line to the ring around the feature. It is
 * a plain relation (end dots, no arrowhead); `dashed` marks a pending one.
 * @param {any} ctx
 * @param {{name:string, from:{x:number,y:number}, fromDir:{x:number,y:number}, entry:{x:number,y:number}, to:{x:number,y:number}, color:string, dashed?:boolean, width?:number}} o
 */
export function wire(ctx, o) {
  const th = ctx.theme;
  const {from, entry, to} = o;
  const span = Math.max(60, Math.hypot(entry.x - from.x, entry.y - from.y));
  const c1 = {x: from.x + o.fromDir.x * span * 0.45, y: from.y + o.fromDir.y * span * 0.45};
  const inDir = {x: Math.sign(entry.x - to.x) || 1, y: 0};
  const c2 = {x: entry.x + inDir.x * span * 0.45, y: entry.y};
  const pts = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48, u = 1 - t;
    pts.push({x: u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * entry.x, y: u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * entry.y});
  }
  pts.push({x: to.x, y: to.y});
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const d = `M${r(from.x)} ${r(from.y)}C${r(c1.x)} ${r(c1.y)} ${r(c2.x)} ${r(c2.y)} ${r(entry.x)} ${r(entry.y)}L${r(to.x)} ${r(to.y)}`;
  const w = o.width ?? 3.2;
  const clipId = `${o.name}-m`;
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-case`, d, fill: 'none', stroke: th.paper, 'stroke-width': w + 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.8, 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    o.dashed
      ? g(null,
        h('defs', null, h('mask', {id: ctx.id(clipId), maskUnits: 'userSpaceOnUse', x: r(Math.min(from.x, entry.x, to.x) - 40), y: r(Math.min(from.y, entry.y, to.y) - 40), width: r(Math.abs(Math.max(from.x, entry.x, to.x) - Math.min(from.x, entry.x, to.x)) + 80), height: r(Math.abs(Math.max(from.y, entry.y, to.y) - Math.min(from.y, entry.y, to.y)) + 80)},
          h('path', {name: `${o.name}-mk`, d, fill: 'none', stroke: '#fff', 'stroke-width': w * 4, 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}))),
        h('path', {d, fill: 'none', stroke: o.color, 'stroke-width': w, 'stroke-dasharray': '9 8', mask: ctx.ref(clipId)}))
      : h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${o.name}-dA`, cx: r(from.x), cy: r(from.y), r: 5.5, fill: o.color, opacity: 0}),
    h('circle', {name: `${o.name}-dB`, cx: r(to.x), cy: r(to.y), r: 5.5, fill: o.color, opacity: 0}),
  );
  const frame = (p, opacity = 1) => {
    const off = r(total * (1 - p));
    const out = {[o.name]: {opacity: p > 0 ? opacity : 0}, [`${o.name}-case`]: {'stroke-dashoffset': off}};
    out[o.dashed ? `${o.name}-mk` : `${o.name}-line`] = {'stroke-dashoffset': off};
    out[`${o.name}-dA`] = {opacity: p > 0 ? 1 : 0};
    out[`${o.name}-dB`] = {opacity: p >= 0.985 ? 1 : 0};
    return out;
  };
  return {node, frame, total, from, entry, to, pts};
}

/**
 * Plan non-crossing lane routes from rule sockets to feature rings: each
 * thread leaves its socket vertically, turns along a horizontal just outside
 * the card, runs down a vertical lane in the light-table frame beside the
 * sheet and then along the target row's ground line (where no text is
 * printed) to the ring's edge. Threads are sorted by target row (higher rows
 * first): that order gives the sockets (left → right), the lanes (inner →
 * outer) and the turn heights (lowest first), so no two threads cross.
 * @param {{targets:Array<{key:string, gy:number, ringX:number}>, laneX0:number, laneStep?:number, laneDir:1|-1, turnY0:number, turnStep?:number, turnDir:1|-1}} o
 *   laneDir: +1 = lanes step away from the sheet to the right; turnDir: +1 = turns step downwards
 * @returns {Array<{key:string, order:number, lane:number, turnY:number}>}
 */
export function planLanes(o) {
  const sorted = o.targets.map((tg, i) => ({...tg, i})).sort((a, b) => a.gy - b.gy || a.i - b.i);
  const n = sorted.length;
  const ls = o.laneStep ?? 10;
  const ts = o.turnStep ?? 11;
  return sorted.map((tg, order) => ({key: tg.key, order, lane: o.laneX0 + o.laneDir * order * ls, turnY: o.turnY0 + o.turnDir * (n - 1 - order) * ts}));
}

/**
 * Rounded polyline thread (plain relation: end dots, no arrowhead; `dashed`
 * marks a pending one) drawn on progressively. Same frame API as wire().
 * @param {any} ctx
 * @param {{name:string, pts:Array<{x:number,y:number}>, color:string, dashed?:boolean, width?:number, radius?:number}} o
 */
export function laneWire(ctx, o) {
  const th = ctx.theme;
  const pts = o.pts;
  const rad = o.radius ?? 16;
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  const samples = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(rad, l1 / 2, l2 / 2);
    const p1 = {x: b.x + ((a.x - b.x) / (l1 || 1)) * rr, y: b.y + ((a.y - b.y) / (l1 || 1)) * rr};
    const p2 = {x: b.x + ((c.x - b.x) / (l2 || 1)) * rr, y: b.y + ((c.y - b.y) / (l2 || 1)) * rr};
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    samples.push(p1, b, p2);
  }
  const z = pts[pts.length - 1];
  d += `L${r(z.x)} ${r(z.y)}`;
  samples.push(z);
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const w = o.width ?? 3.2;
  const maskId = `${o.name}-m`;
  const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
  const bb = {x: Math.min(...xs) - 30, y: Math.min(...ys) - 30, w: Math.max(...xs) - Math.min(...xs) + 60, h: Math.max(...ys) - Math.min(...ys) + 60};
  const dash = `${r(total + 20)} ${r(total + 30)}`;
  const node = g({name: o.name, opacity: 0},
    h('path', {name: `${o.name}-case`, d, fill: 'none', stroke: th.paper, 'stroke-width': w + 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.8, 'stroke-dasharray': dash, 'stroke-dashoffset': r(total + 20)}),
    o.dashed
      ? g(null,
        h('defs', null, h('mask', {id: ctx.id(maskId), maskUnits: 'userSpaceOnUse', x: r(bb.x), y: r(bb.y), width: r(bb.w), height: r(bb.h)},
          h('path', {name: `${o.name}-mk`, d, fill: 'none', stroke: '#fff', 'stroke-width': w * 4, 'stroke-dasharray': dash, 'stroke-dashoffset': r(total + 20)}))),
        h('path', {d, fill: 'none', stroke: o.color, 'stroke-width': w, 'stroke-dasharray': '9 8', mask: ctx.ref(maskId)}))
      : h('path', {name: `${o.name}-line`, d, fill: 'none', stroke: o.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dash, 'stroke-dashoffset': r(total + 20)}),
    h('circle', {name: `${o.name}-dA`, cx: r(pts[0].x), cy: r(pts[0].y), r: 5.5, fill: o.color, opacity: 0}),
    h('circle', {name: `${o.name}-dB`, cx: r(z.x), cy: r(z.y), r: 5.5, fill: o.color, opacity: 0}),
  );
  const frame = (p, opacity = 1) => {
    const off = r((total + 20) * (1 - p));
    const out = {[o.name]: {opacity: p > 0 ? opacity : 0}, [`${o.name}-case`]: {'stroke-dashoffset': off}};
    out[o.dashed ? `${o.name}-mk` : `${o.name}-line`] = {'stroke-dashoffset': off};
    out[`${o.name}-dA`] = {opacity: p > 0 ? 1 : 0};
    out[`${o.name}-dB`] = {opacity: p >= 0.985 ? 1 : 0};
    return out;
  };
  // point at fraction t of the (unrounded) route, for tracers
  const segL = [];
  for (let i = 1; i < pts.length; i++) segL.push(Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const at = t => {
    let dd = Math.max(0, Math.min(1, t)) * total;
    for (let i = 0; i < segL.length; i++) {
      if (dd <= segL[i] || i === segL.length - 1) {
        const k = segL[i] ? Math.min(1, dd / segL[i]) : 0;
        const a = pts[i], b = pts[i + 1];
        return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, a: Math.atan2(b.y - a.y, b.x - a.x)};
      }
      dd -= segL[i];
    }
    return {x: z.x, y: z.y, a: 0};
  };
  return {node, frame, total, from: pts[0], to: z, pts: samples, d, at, mid: at(0.5)};
}

/**
 * "Changed datum" marker: a round tab with two turning arrows (drawn paths,
 * no text) and a small stem; local origin = centre.
 */
export function changeMarker(ctx, {name, x, y, rad = 17, color, opacity}) {
  const th = ctx.theme;
  const k = rad / 17;
  const arc = (a0, a1) => {
    const R = 8.5 * k;
    const p0 = {x: Math.cos(a0) * R, y: Math.sin(a0) * R}, p1 = {x: Math.cos(a1) * R, y: Math.sin(a1) * R};
    const tip = {x: p1.x, y: p1.y};
    const tang = {x: -Math.sin(a1), y: Math.cos(a1)};
    const nrm = {x: Math.cos(a1), y: Math.sin(a1)};
    const hs = 4.2 * k;
    const head = `M${r(tip.x + tang.x * hs)} ${r(tip.y + tang.y * hs)}L${r(tip.x + nrm.x * hs * 0.8)} ${r(tip.y + nrm.y * hs * 0.8)}L${r(tip.x - nrm.x * hs * 0.8)} ${r(tip.y - nrm.y * hs * 0.8)}Z`;
    return [
      h('path', {d: `M${r(p0.x)} ${r(p0.y)}A${r(R)} ${r(R)} 0 0 1 ${r(p1.x)} ${r(p1.y)}`, fill: 'none', stroke: th.ink, 'stroke-width': r(2.8 * k), 'stroke-linecap': 'round'}),
      h('path', {d: head, fill: th.ink}),
    ];
  };
  return g({name, transform: T(x, y), opacity},
    h('circle', {cx: 2, cy: 3, r: r(rad), fill: th.shadow}),
    h('circle', {r: r(rad), fill: color, stroke: th.ink, 'stroke-width': r(2.6 * k)}),
    arc(-Math.PI * 0.95, -Math.PI * 0.15),
    arc(Math.PI * 0.05, Math.PI * 0.85),
  );
}

/**
 * Choose a shoulder position beyond one desk edge so every target is within
 * 0.94 of the arm's reach and none closer than 0.3 of it; prefers the
 * farthest target at ~0.86 reach.
 * @param {{edge:'bottom'|'right', D:{w:number,h:number}, targets:Array<{x:number,y:number}>, reach:number, prefer?:number}} o
 */
export function solveShoulder(o) {
  const {D, reach} = o;
  let best = null;
  const len = o.edge === 'bottom' ? D.w : D.h;
  for (let t = 0; t <= len; t += 10) {
    for (let d = 90; d <= 700; d += 10) {
      const s = o.edge === 'bottom' ? {x: t, y: D.h + d} : {x: D.w + d, y: t};
      const ds = o.targets.map(q => Math.hypot(q.x - s.x, q.y - s.y));
      const mx = Math.max(...ds), mn = Math.min(...ds);
      if (mx > reach * 0.94 || mn < reach * (o.minFrac ?? 0.42)) continue;
      const cost = Math.abs(mx / reach - 0.86) + (o.preferWeight ?? 0.00012) * Math.abs(t - (o.prefer ?? len / 2)) - d * 0.00005;
      if (!best || cost < best.cost) best = {cost, s};
    }
  }
  if (best) return {...best.s, ok: true};
  return o.edge === 'bottom' ? {x: D.w / 2, y: D.h + 120, ok: false} : {x: D.w + 120, y: D.h / 2, ok: false};
}

/* ------------------------------------------------------------------ */
/* small helpers                                                       */
/* ------------------------------------------------------------------ */

/** Rotate a local point by deg about the origin and translate. */
export function place(pose, local) {
  const a = ((pose.rot || 0) * Math.PI) / 180;
  const s = pose.s ?? 1;
  return {x: pose.x + (local.x * Math.cos(a) - local.y * Math.sin(a)) * s, y: pose.y + (local.x * Math.sin(a) + local.y * Math.cos(a)) * s};
}

/** Axis-aligned bounds of a w×h rectangle centred on a pose (x, y, rot, s). */
export function centeredBounds(pose, w, hh) {
  const pts = [[-w / 2, -hh / 2], [w / 2, -hh / 2], [w / 2, hh / 2], [-w / 2, hh / 2]].map(([x, y]) => place(pose, {x, y}));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
}

/** Axis-aligned bounds of a rotated/scaled local rectangle. */
export function poseBounds(pose, w, hh) {
  const pts = [[0, 0], [w, 0], [w, hh], [0, hh]].map(([x, y]) => place(pose, {x, y}));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
}

/** Distance between two axis-aligned boxes (0 when they touch/overlap). */
export function boxGap(a, b) {
  const dx = Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w));
  const dy = Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
  return Math.hypot(dx, dy);
}

/** Texts of every print a case may show (for uniform label fitting). */
export function allTexts(R, extra = []) {
  const out = [];
  R.features.forEach(F => { if (F.a) out.push(F.a); if (F.b) out.push(F.b); });
  return out.concat(extra.filter(Boolean));
}

/* ------------------------------------------------------------------ */
/* exploded registration stack (mechanism)                             */
/* ------------------------------------------------------------------ */

/**
 * Parallel (axonometric) projection of the stack: u runs along the feature
 * slots, v across the sheet (depth), z is the height of a layer above sheet
 * A. Returns P(u, v, z) → screen point.
 * @param {{eU:{x:number,y:number}, eV:{x:number,y:number}, eZ:{x:number,y:number}}} axes
 * @param {{x:number,y:number}} O  screen point of (0,0,0)
 */
export function axo(axes, O) {
  const {eU, eV, eZ} = axes;
  return (u, v, z = 0) => ({x: O.x + u * eU.x + v * eV.x + z * eZ.x, y: O.y + u * eU.y + v * eV.y + z * eZ.y});
}

const polyD = pts => `M${pts.map(p => `${r(p.x)} ${r(p.y)}`).join('L')}Z`;

/**
 * A tracing sheet seen in the exploded stack: translucent paper with a
 * drafting grid, a ruled ground band under the slots and punched holes where
 * the registration posts pass. Drawn in screen coordinates.
 * @param {any} ctx
 * @param {{name:string, P:(u:number,v:number,z?:number)=>{x:number,y:number}, su:number, sd:number, z:number, ink:string, opacity:number, holes:Array<{u:number,v:number}>, band?:{v0:number,v1:number}}} o
 */
export function stackPlane(ctx, o) {
  const {P, su, sd, z} = o;
  const c = [P(0, 0, z), P(su, 0, z), P(su, sd, z), P(0, sd, z)];
  const grid = [];
  const step = 46;
  for (let u = step; u < su - 8; u += step) { const a = P(u, 6, z), b = P(u, sd - 6, z); grid.push(`M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`); }
  for (let v = step * 0.8; v < sd - 8; v += step * 0.8) { const a = P(6, v, z), b = P(su - 6, v, z); grid.push(`M${r(a.x)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`); }
  const holes = o.holes.map(hh => {
    const q = P(hh.u, hh.v, z);
    const a = P(hh.u + 9, hh.v, z), b = P(hh.u, hh.v + 12, z);
    return h('ellipse', {cx: r(q.x), cy: r(q.y), rx: r(Math.max(6, Math.hypot(a.x - q.x, a.y - q.y))), ry: r(Math.max(4, Math.hypot(b.x - q.x, b.y - q.y))), fill: '#6f7780', opacity: 0.55});
  });
  const band = o.band ? h('path', {d: polyD([P(14, o.band.v0, z), P(su - 14, o.band.v0, z), P(su - 14, o.band.v1, z), P(14, o.band.v1, z)]), fill: o.ink, opacity: 0.08}) : null;
  const edge = [P(0, sd, z), P(su, sd, z)];
  return g({name: o.name},
    h('path', {d: polyD(c.map(p => ({x: p.x + 6, y: p.y + 9}))), fill: ctx.theme.shadow, opacity: 0.7}),
    h('path', {d: polyD(c), fill: '#f8f6ef', 'fill-opacity': o.opacity, stroke: shade('#c9c2b4', -0.15), 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: grid.join(''), stroke: '#8fb4d3', 'stroke-width': 1, opacity: 0.35, fill: 'none'}),
    band,
    holes,
    // the sheet's thickness along its front edge
    h('path', {d: `M${r(edge[0].x)} ${r(edge[0].y)}L${r(edge[1].x)} ${r(edge[1].y)}`, stroke: o.ink, 'stroke-width': 3.2, opacity: 0.55}),
  );
}

/**
 * A fact pin standing out of a sheet: foot ellipse on the sheet, a short
 * post along the stack's height axis and a round token (pictogram in the
 * case's ink) facing the viewer. Pops up by scaling about its foot.
 * Names: `${name}` (group; transform animates the pop).
 * @param {any} ctx
 * @param {{name:string, base:{x:number,y:number}, eZ:{x:number,y:number}, post:number, tokR:number, icon:string, ink:string, soft:string, footRx?:number, footRy?:number}} o
 * @returns {{node:any, token:{x:number,y:number}, tip:{x:number,y:number}, base:{x:number,y:number}}}
 */
export function stackPin(ctx, o) {
  const th = ctx.theme;
  const {base, eZ} = o;
  const top = {x: base.x + eZ.x * o.post, y: base.y + eZ.y * o.post};
  const token = {x: base.x + eZ.x * (o.post + o.tokR), y: base.y + eZ.y * (o.post + o.tokR)};
  const tip = {x: base.x + eZ.x * (o.post + 2 * o.tokR), y: base.y + eZ.y * (o.post + 2 * o.tokR)};
  const node = g({name: o.name},
    h('ellipse', {cx: r(base.x), cy: r(base.y), rx: r(o.footRx ?? 16), ry: r(o.footRy ?? 7), fill: o.ink, opacity: 0.35}),
    h('line', {x1: r(base.x), y1: r(base.y), x2: r(top.x), y2: r(top.y), stroke: th.ink, 'stroke-width': 7, 'stroke-linecap': 'round'}),
    h('line', {x1: r(base.x), y1: r(base.y), x2: r(top.x), y2: r(top.y), stroke: shade(o.ink, 0.25), 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('circle', {cx: r(token.x + 4), cy: r(token.y + 6), r: r(o.tokR), fill: th.shadow}),
    h('circle', {cx: r(token.x), cy: r(token.y), r: r(o.tokR), fill: '#ffffff', stroke: o.ink, 'stroke-width': 4.5}),
    h('circle', {cx: r(token.x), cy: r(token.y), r: r(o.tokR - 7), fill: o.soft, opacity: 0.55}),
    g({transform: T(token.x, token.y)}, pictogram(o.icon, {s: o.tokR * 1.25, ink: o.ink, soft: '#ffffff'})),
  );
  return {node, token, tip, base, top};
}

/**
 * Rule plate: a card with the rule's name and the supplied rule text (or
 * neutral bars when labels are hidden). Local origin top-left.
 * @param {any} ctx
 * @param {{prefix:string, w:number, name:string, text:string, size:number, minSize?:number, maxLines?:number, minH?:number, indent?:number, top?:number}} o
 */
export function rulePlate(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const pad = 22;
  const ind = o.indent ?? 0;
  const textW = o.w - pad * 2 - 10 - ind;
  const parts = [];
  let y = o.top ?? 22;
  let titleFit = null, textFit = null;
  const tx = pad + 10 + ind;
  if (ctx.show('all')) {
    titleFit = ctx.fit(o.name, {maxWidth: textW, size: o.size * 0.95, minSize: 16, maxLines: 2, weight: 700});
    parts.push(textBlock(titleFit, {x: tx, y, fill: th.ink, name: `${P}-title`}));
    y += titleFit.height + 10;
    textFit = ctx.fit(o.text, {maxWidth: textW, size: o.size, minSize: o.minSize ?? Math.max(16, o.size * 0.76), maxLines: o.maxLines ?? 4, weight: 500, family: 'serif'});
    parts.push(textBlock(textFit, {x: tx, y, fill: th.ink, italic: true, name: `${P}-text`}));
    y += textFit.height + 18;
  } else {
    parts.push(h('rect', {x: tx, y: y + 2, width: r(textW * 0.45), height: 16, rx: 8, fill: th.ink, opacity: 0.75}));
    for (let i = 0; i < 2; i++) parts.push(h('rect', {x: tx, y: y + 34 + i * 24, width: r(textW * (i === 1 ? 0.55 : 0.92)), height: 10, rx: 5, fill: th.paperLine}));
    y += 34 + 2 * 24 + 8;
  }
  const hh = Math.max(o.minH ?? 0, y);
  const lines = [];
  for (let ly = 52; ly < hh - 8; ly += 30) lines.push(`M12 ${ly}H${r(o.w - 12)}`);
  const node = g({name: P},
    h('path', {d: roundRectPath(6, 9, o.w, hh, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(0, 0, o.w, hh, 10), fill: '#fffaf0', stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: lines.join(''), stroke: '#a9c6de', 'stroke-width': 1.4, opacity: 0.6}),
    h('line', {x1: 16, x2: 16, y1: 6, y2: r(hh - 6), stroke: '#d98b7a', 'stroke-width': 1.6, opacity: 0.8}),
    parts,
  );
  return {node, w: o.w, h: hh, titleFit, textFit};
}

/**
 * Round socket for a feature the rule names: a recessed disc with the
 * feature's mini pictogram (drawn in world coordinates).
 */
export function socketNode(ctx, {name, x, y, rad, icon, ring}) {
  const th = ctx.theme;
  return g({name},
    h('circle', {cx: r(x), cy: r(y), r: r(rad + 3), fill: '#fffaf0', stroke: ring ?? th.ink, 'stroke-width': 2.5}),
    h('circle', {cx: r(x), cy: r(y), r: r(rad - 3), fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.5}),
    g({transform: T(x, y)}, pictogram(icon, {s: rad * 1.3, ink: th.ink, soft: '#ffffff'})),
  );
}

/** Registration post (a metal rod) between two screen points. */
export function postRod(ctx, {name, a, b, w = 10}) {
  const th = ctx.theme;
  return g({name},
    h('line', {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: th.ink, 'stroke-width': w + 4, 'stroke-linecap': 'round'}),
    h('line', {x1: r(a.x), y1: r(a.y), x2: r(b.x), y2: r(b.y), stroke: '#aab3bb', 'stroke-width': w, 'stroke-linecap': 'round'}),
    h('line', {x1: r(a.x - w * 0.18), y1: r(a.y), x2: r(b.x - w * 0.18), y2: r(b.y), stroke: '#ffffff', 'stroke-width': w * 0.25, 'stroke-linecap': 'round', opacity: 0.6}),
  );
}

/* ------------------------------------------------------------------ */
/* registered overlay (two sheets sharing one slot geometry)           */
/* ------------------------------------------------------------------ */

/**
 * Where each case prints each feature: A's variant in the left/single cell;
 * B's shared print on the same cell, B's differing variant in the right cell
 * of its pair.
 */
export function printsOf(geo, R) {
  const a = [], b = [];
  R.features.forEach(F => {
    const u = geo.unitCells[F.i];
    if (!u) return;
    if (F.a) a.push({f: F.i, cell: u.pair ? u.L : u.S, icon: F.icon, text: F.a});
    if (F.b) b.push({f: F.i, cell: F.kind === 'shared' ? (u.pair ? u.L : u.S) : (u.pair ? u.R : u.S), icon: F.kind === 'shared' ? F.icon : F.iconB, text: F.b});
  });
  return {a, b};
}

/**
 * Nodes of a registered overlay (all names prefixed so several overlays can
 * live in one scene): sheet A with its prints, sheet B with its prints, and
 * the overlay layer drawn above B once it is registered — merged prints of
 * shared features (overprinted ink), A's own prints showing through B, A's
 * name/letter showing through, and "=", "≠" or single-case badges.
 * All coordinates are sheet-local (origin = sheet top-left).
 * @param {any} ctx
 * @param {{prefix:string, geo:any, R:any, I:any, skip?:number[], bare?:boolean, noLetter?:boolean}} o  skip = features drawn by the entry itself
 */
export function overlayNodes(ctx, o) {
  const th = ctx.theme;
  const {geo, R, I} = o;
  const P = o.prefix;
  const skip = new Set(o.skip || []);
  const pr = printsOf(geo, R);
  const sA = sheetBase(ctx, {prefix: `${P}A`, geo, which: 'a', ink: I.a.ink, paperOpacity: 0.9, bare: o.bare, noLetter: o.noLetter});
  const sB = sheetBase(ctx, {prefix: `${P}B`, geo, which: 'b', ink: I.b.ink, paperOpacity: 0.6, bare: o.bare, noLetter: o.noLetter});
  const aNodes = pr.a.filter(x => !skip.has(x.f)).map(x => ({f: x.f, ...printNode(ctx, geo, {name: `${P}pa${x.f}`, cell: x.cell, icon: x.icon, text: x.text, ink: I.a.ink, soft: I.a.soft})}));
  const bNodes = pr.b.filter(x => !skip.has(x.f)).map(x => ({f: x.f, ...printNode(ctx, geo, {name: `${P}pb${x.f}`, cell: x.cell, icon: x.icon, text: x.text, ink: I.b.ink, soft: I.b.soft})}));
  const merged = R.features.filter(F => F.kind === 'shared' && geo.unitCells[F.i] && !skip.has(F.i)).map(F => {
    const c = cellOf(geo, F.i, 'S');
    return {f: F.i, c, node: g({name: `${P}om${F.i}`, opacity: 0}, printNode(ctx, geo, {name: `${P}omp${F.i}`, cell: c, icon: F.icon, text: '', ink: I.m.ink, soft: I.m.soft, showText: false}).node)};
  });
  const through = pr.a.filter(x => R.features[x.f].kind !== 'shared' && !skip.has(x.f)).map(x => ({f: x.f, ...printNode(ctx, geo, {name: `${P}ot${x.f}`, cell: x.cell, icon: x.icon, text: x.text, ink: I.a.ink, soft: I.a.soft, opacity: 0})}));
  const badges = R.features.filter(F => F.kind !== 'none' && geo.unitCells[F.i] && !skip.has(F.i)).map(F => {
    const sp = badgeSpot(geo, F.i, F.kind);
    const eq = F.kind === 'shared';
    return {f: F.i, eq, sp, node: relBadge(ctx, {name: `${P}bd${F.i}`, kind: glyphOf(F.kind), x: sp.x, y: sp.y, rad: eq ? 15 : 18, color: eq ? I.m.ink : th.ink, opacity: 0})};
  });
  let throughName = null;
  if (geo.names) {
    const nn = [textBlock(geo.names.a, {x: sA.nameX, y: geo.headerTop, fill: th.ink})];
    if (geo.names.na) nn.push(textBlock(geo.names.na, {x: sA.nameX, y: geo.headerTop + geo.names.a.height + 6, fill: th.inkSoft}));
    throughName = g({name: `${P}otName`, opacity: 0}, nn);
  }
  const bd = sA.badge;
  const throughBadge = g({name: `${P}otBadge`, opacity: 0}, o.bare && o.noLetter && geo.compact ? null : h('circle', {cx: r(bd.x), cy: r(bd.y), r: r(bd.r), fill: I.a.ink, stroke: th.ink, 'stroke-width': 2}),
    ctx.show('key') && !o.noLetter ? h('text', {x: r(bd.x), y: r(bd.y + bd.r * 0.42), 'text-anchor': 'middle', 'font-family': SANS, 'font-size': r(bd.r * 1.15), 'font-weight': 800, fill: '#ffffff'}, 'A') : null);
  return {
    noLetter: Boolean(o.noLetter), pr, sA, sB, aNodes, bNodes, merged, through, badges,
    sheetA: g(null, sA.node, aNodes.map(n => n.node)),
    sheetB: g(null, sB.node, bNodes.map(n => n.node)),
    overlay: g(null, throughName, throughBadge, through.map(n => n.node), merged.map(m => m.node), badges.map(b => b.node)),
  };
}

/**
 * Frame helper: hide A's texts where sheet B covers them (no text over
 * text), then — once B is registered — reveal merged prints, show-through
 * and badges over window [a0, a1] of `q` (0..1 local progress).
 * @param {any} ctx
 * @param {any} ov  overlayNodes() result
 * @param {{P:string, aOrigin:{x:number,y:number}, bBox:{x:number,y:number,w:number,h:number}, landed:boolean, q:number, reduced:boolean}} o
 */
export function overlayFrame(ctx, ov, o) {
  const P = o.P;
  const geo = ov.sA && o.geo;
  const nodes = {};
  const gap = box => (box ? clamp01(boxGap(box, o.bBox) / 30) : 1);
  let hiddenA = 0;
  ov.aNodes.forEach(n => {
    if (!n.labBox) return;
    const wb = {x: o.aOrigin.x + n.labBox.x, y: o.aOrigin.y + n.labBox.y, w: n.labBox.w, h: n.labBox.h};
    const v = gap(wb);
    if (v < 1) hiddenA++;
    nodes[`${P}pa${n.f}-lab`] = {opacity: r(v, 3)};
  });
  if (o.geo.names) nodes[`${P}A-names`] = {opacity: r(gap({x: o.aOrigin.x + ov.sA.nameX, y: o.aOrigin.y + o.geo.headerTop, w: o.geo.half, h: o.geo.header}), 3)};
  if (ctx.show('key') && !ov.noLetter) {
    const bd = ov.sA.badge;
    nodes[`${P}A-letter`] = {opacity: r(gap({x: o.aOrigin.x + bd.x - bd.r, y: o.aOrigin.y + bd.y - bd.r, w: 2 * bd.r, h: 2 * bd.r}), 3)};
  }
  const q = o.landed ? o.q : 0;
  const nM = Math.max(1, ov.merged.length);
  const mergeState = [];
  ov.merged.forEach((m, k) => {
    const s0 = (k / nM) * 0.55;
    const v = clamp01((q - s0) / 0.35);
    const pop = o.reduced ? 1 : 1 + 0.1 * Math.sin(Math.PI * v);
    nodes[`${P}om${m.f}`] = {opacity: r(v, 3), transform: pop !== 1 ? `translate(${r(m.c.pc.x)} ${r(m.c.pc.y)}) scale(${r(pop, 4)}) translate(${r(-m.c.pc.x)} ${r(-m.c.pc.y)})` : ''};
    mergeState.push(v >= 1 ? 'merged' : v > 0 ? 'merging' : 'apart');
  });
  const thr = clamp01(q / 0.45);
  ov.through.forEach(n => { nodes[`${P}ot${n.f}`] = {opacity: r(thr, 3)}; });
  if (o.geo.names) nodes[`${P}otName`] = {opacity: r(thr, 3)};
  nodes[`${P}otBadge`] = {opacity: r(thr, 3)};
  let badgesShown = 0;
  ov.badges.forEach((b, k) => {
    const s0 = 0.15 + (k / Math.max(1, ov.badges.length)) * 0.5;
    const v = clamp01((q - s0) / 0.3);
    if (v >= 1) badgesShown++;
    nodes[`${P}bd${b.f}`] = {opacity: r(v, 3), transform: T(b.sp.x, b.sp.y, 0, o.reduced ? 1 : 0.6 + 0.4 * v)};
  });
  return {nodes, mergeState, badgesShown, throughShown: r(thr, 3), hiddenA, geo};
}

const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);

/* ------------------------------------------------------------------ */
/* wall tracing board (contrast)                                       */
/* ------------------------------------------------------------------ */

/**
 * Frontal wall-mounted tracing board: wooden frame, a lit panel in the lower
 * part (where the earlier case hangs on the peg bar), two metal guide rails
 * along which a slider batten carries the new case's sheet down. Pegs are
 * returned separately (drawn above the sheets).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, rail:number, litY:number, pegs:Array<{x:number,y:number}>, pegBar:{x0:number,x1:number,y:number}}} o
 */
export function tracingBoard(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {x, y, w, h: hh, rail} = o;
  const gid = `${P}-glow`;
  const inner = {x: x + 14, y: y + 14, w: w - 28, h: hh - 28};
  const node = g({name: P},
    h('defs', null, h('linearGradient', {id: ctx.id(gid), x1: '0', y1: '0', x2: '0', y2: '1'},
      h('stop', {offset: '0%', 'stop-color': '#fffdf2'}),
      h('stop', {offset: '100%', 'stop-color': '#f4ecd2'}))),
    h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 18), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 18), fill: '#9c6b43', stroke: th.ink, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(x + 6, y + 6, w - 12, hh - 12, 14), fill: 'none', stroke: '#c9975f', 'stroke-width': 2, opacity: 0.8}),
    // upper part: plain board; lower part: lit panel behind the pegged sheet
    h('path', {d: roundRectPath(inner.x, inner.y, inner.w, inner.h, 10), fill: '#e7dfcc', stroke: '#6f4b2d', 'stroke-width': 2}),
    h('path', {d: roundRectPath(inner.x + rail, o.litY, inner.w - 2 * rail, inner.y + inner.h - o.litY - 6, 8), fill: ctx.ref(gid), stroke: '#b9ad90', 'stroke-width': 1.5}),
    // guide rails
    [inner.x + 2, inner.x + inner.w - rail - 2].map(rx => g(null,
      h('rect', {x: r(rx), y: r(inner.y + 4), width: r(rail), height: r(inner.h - 8), rx: 4, fill: '#8f989f', stroke: th.ink, 'stroke-width': 1.8}),
      h('rect', {x: r(rx + rail * 0.38), y: r(inner.y + 10), width: r(rail * 0.24), height: r(inner.h - 20), rx: 2, fill: '#4f575e'}))),
    // peg bar
    h('rect', {x: r(o.pegBar.x0), y: r(o.pegBar.y - 7), width: r(o.pegBar.x1 - o.pegBar.x0), height: 14, rx: 7, fill: '#b8c0c7', stroke: th.ink, 'stroke-width': 1.8}),
  );
  const pegs = g({name: `${P}-pegs`}, o.pegs.map(p => g(null,
    h('circle', {cx: r(p.x + 2), cy: r(p.y + 3), r: 7.5, fill: th.shadow}),
    h('circle', {cx: r(p.x), cy: r(p.y), r: 6.5, fill: '#aab3bb', stroke: th.ink, 'stroke-width': 1.8}),
    h('circle', {cx: r(p.x - 2), cy: r(p.y - 2), r: 2, fill: '#ffffff', opacity: 0.8}))));
  return {node, pegs, inner};
}

/**
 * Slider batten that carries a sheet along the guide rails: a wooden bar
 * with two spring clips biting the sheet's top edge and small rollers in the
 * rails. Local origin = the sheet's top-left corner (so it rides with the
 * sheet's transform). `labelFit` is printed on the bar.
 */
export function slideBatten(ctx, {x0, x1, clips, barH = 30, labelFit, labelFill}) {
  const th = ctx.theme;
  const y = -barH - 6;
  return g(null,
    h('rect', {x: r(x0), y: r(y + 3), width: r(x1 - x0), height: r(barH), rx: 6, fill: th.shadow}),
    h('rect', {x: r(x0), y: r(y), width: r(x1 - x0), height: r(barH), rx: 6, fill: '#b98a5e', stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: r(x0 + 4), y: r(y + 4), width: r(x1 - x0 - 8), height: 5, rx: 2.5, fill: '#ffffff', opacity: 0.25}),
    [x0 + 4, x1 - 4].map(cx => h('circle', {cx: r(cx), cy: r(y + barH / 2), r: 8, fill: '#4f575e', stroke: th.ink, 'stroke-width': 1.5})),
    clips.map(cx => g(null,
      h('path', {d: `M${r(cx - 16)} ${r(y + barH - 4)}H${r(cx + 16)}L${r(cx + 12)} ${r(y + barH + 16)}H${r(cx - 12)}Z`, fill: '#2b2f35', stroke: th.ink, 'stroke-width': 1.6}),
      h('path', {d: `M${r(cx - 8)} ${r(y + barH + 2)}L${r(cx - 10)} ${r(y - 6)}H${r(cx + 10)}L${r(cx + 8)} ${r(y + barH + 2)}`, fill: 'none', stroke: '#aeb6bd', 'stroke-width': 3, 'stroke-linejoin': 'round'}))),
    labelFit ? g(null,
      h('path', {d: roundRectPath((x0 + x1) / 2 - labelFit.width / 2 - 12, y + 3, labelFit.width + 24, barH - 6, 5), fill: '#fbf5e4', stroke: '#6f4b2d', 'stroke-width': 1.4}),
      textBlock(labelFit, {x: (x0 + x1) / 2, y: y + (barH - labelFit.height) / 2 + 1, anchor: 'middle', fill: labelFill ?? th.ink})) : null,
  );
}
