/**
 * Motif kit for "Matriz de autoridades" (LAW-0073..0076).
 *
 * An authority matrix pinned on a cork board in a library bay:
 *  - ROWS are propositions, each on a ruled index card (ficha) on the left;
 *  - COLUMNS are the supplied sources, each a sheet (documento) pinned across
 *    the top, colour-coded like its volume on the library shelf (biblioteca);
 *  - the corner holds the search printout (buscador) whose result list names
 *    the sources with the same colours;
 *  - a CITATION supplied by the author links a proposition to a source: a
 *    coloured pin whose thread is tied to the card's grommet is pressed into
 *    the cell (row × column), the column lights down from its sheet to the
 *    pin and a pinpoint flag (e.g. "p. 2") unfurls on the pin;
 *  - a proposition with no supplied citation gets an empty dashed socket in
 *    the "pending source" column (optionally covered by a sticky note).
 *
 * The kit owns fields, defaults, strings, geometry, original vector art and a
 * pose solver (per-link states → node props). Every entry owns its own
 * timeline, composition and semantics. The matrix never evaluates whether a
 * source supports a proposition: it only draws the links the author supplies.
 * @module animations/research/kits/matriz-de-autoridades
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, lerp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {FONTS} from '../../../core/text.js';
import {str, int, list, obj} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {topArm} from '../../../primitives/desk.js';

/* ------------------------------------------------------------------------ */
/* Fields, defaults and strings                                              */
/* ------------------------------------------------------------------------ */

export const MAX_ROWS = 4;
export const MAX_SOURCES = 3;

/** Category fields (research: query, sources, citations, dates) + the rows of this motif. */
export const matrixFields = {
  query: str('Search printed on the results printout pinned in the corner of the matrix (fictional)', 60),
  propositions: list('Propositions (matrix rows), top to bottom; each is printed on its own index card (fictional, descriptive)', obj('Proposition', {
    text: str('Proposition printed on the card', 90),
  }, ['text']), 2, MAX_ROWS),
  sources: list('Supplied sources (matrix columns), left to right; each is a sheet pinned across the top and a volume on the shelf (fictional)', obj('Source', {
    id: str('Short identifier printed on the sheet band and on its volume', 6),
    title: str('Title printed on the sheet', 50),
  }, ['id', 'title']), 2, MAX_SOURCES),
  dates: list('Date printed on each source sheet, same order as the sources (relative or fictional)', str('Date label', 20), 0, MAX_SOURCES),
  citations: list('Links supplied by the author: which source is cited for which proposition, with a pinpoint (fictional). Out-of-range or repeated pairs are ignored. A proposition without a citation is shown with a pending-source mark; nothing is inferred about whether a source supports it', obj('Citation', {
    proposition: int('Row (0 = first proposition)', 0, MAX_ROWS - 1),
    source: int('Column (0 = first source)', 0, MAX_SOURCES - 1),
    pinpoint: str('Pinpoint printed on the pin flag, e.g. "p. 2" or "¶ 4"', 12),
  }, ['proposition', 'source']), 0, 6),
};

/** Fictional, illustrative defaults (English). */
export const MATRIX_DEFAULTS = {
  query: 'notice delivery Day 3',
  propositions: [
    {text: 'Party A sent written notice on Day 3.'},
    {text: 'The goods reached the dock on Day 7.'},
    {text: 'Party B asked for a replacement unit.'},
  ],
  sources: [
    {id: 'S1', title: 'Letter from Party A'},
    {id: 'S2', title: 'Warehouse delivery log'},
    {id: 'S3', title: 'Meeting minutes'},
  ],
  dates: ['Day 3', 'Day 7', 'Day 9'],
  citations: [
    {proposition: 0, source: 0, pinpoint: 'p. 1'},
    {proposition: 1, source: 1, pinpoint: 'entry 14'},
    {proposition: 1, source: 2, pinpoint: '¶ 3'},
  ],
};

/** Spanish counterparts for presets (fictional, illustrative). */
export const MATRIX_DEFAULTS_ES = {
  query: 'aviso entrega día 3',
  propositions: [
    {text: 'La parte A envió un aviso escrito el día 3.'},
    {text: 'La mercancía llegó al muelle el día 7.'},
    {text: 'La parte B pidió una unidad de repuesto.'},
  ],
  sources: [
    {id: 'F1', title: 'Carta de la parte A'},
    {id: 'F2', title: 'Registro de entregas del almacén'},
    {id: 'F3', title: 'Acta de reunión'},
  ],
  dates: ['Día 3', 'Día 7', 'Día 9'],
  citations: [
    {proposition: 0, source: 0, pinpoint: 'p. 1'},
    {proposition: 1, source: 1, pinpoint: 'asiento 14'},
    {proposition: 1, source: 2, pinpoint: '¶ 3'},
  ],
};

/** Built-in strings (user content is never translated). */
export const MATRIX_STRINGS = {
  en: {
    search: 'Search',
    results: 'Results',
    library: 'Library',
    pendingSource: 'Pending source',
    sourcePending: 'Source pending',
    linked: 'Rows linked to the supplied sources',
    pendingCalled: 'No source supplied yet for this row',
    researcher: 'Researcher',
    row: 'Row',
    column: 'Column',
    cell: 'Cell',
    supported: 'Proposition with a supplied source',
    changedDatum: 'Datum changed',
    asSupplied: 'as supplied by the author',
  },
  es: {
    search: 'Buscar',
    results: 'Resultados',
    library: 'Biblioteca',
    pendingSource: 'Fuente pendiente',
    sourcePending: 'Fuente pendiente',
    linked: 'Filas conectadas con las fuentes aportadas',
    pendingCalled: 'Aún no se ha aportado fuente para esta fila',
    researcher: 'Investigadora',
    row: 'Fila',
    column: 'Columna',
    cell: 'Celda',
    supported: 'Proposición con fuente aportada',
    changedDatum: 'Dato cambiado',
    asSupplied: 'según lo aportado',
  },
};

/* ------------------------------------------------------------------------ */
/* Content resolution                                                        */
/* ------------------------------------------------------------------------ */

/**
 * Normalise the supplied matrix: valid links (sorted by row, then column),
 * lanes per row (parallel threads), pending rows (no citation).
 * @param {{propositions:{text:string}[], sources:{id:string,title:string}[], dates?:string[], citations:{proposition:number, source:number, pinpoint?:string}[]}} p
 * @param {{dropSources?: number[], pendingColumn?: 'auto'|'always'|'never', citations?: any[]}} [o]
 *   dropSources: sources treated as not supplied (their links are removed);
 *   pendingColumn: whether the extra "pending source" column is added.
 */
export function resolveMatrix(p, o = {}) {
  const nR = p.propositions.length;
  const nS = p.sources.length;
  const drop = new Set(o.dropSources || []);
  const seen = new Set();
  const links = [];
  for (const c of o.citations || p.citations || []) {
    if (!(c.proposition < nR) || !(c.source < nS)) continue;
    const key = `${c.proposition}:${c.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (drop.has(c.source)) continue;
    links.push({row: c.proposition, col: c.source, pinpoint: c.pinpoint || ''});
  }
  links.sort((a, b) => a.row - b.row || a.col - b.col);
  const lanes = new Array(nR).fill(0);
  links.forEach(l => { l.lane = lanes[l.row]++; });
  links.forEach((l, k) => { l.lanes = lanes[l.row]; l.k = k; });
  const pendingRows = [];
  for (let i = 0; i < nR; i++) if (!lanes[i]) pendingRows.push(i);
  const dates = p.dates || [];
  const mode = o.pendingColumn || 'auto';
  const hasPendingCol = mode === 'always' || (mode === 'auto' && pendingRows.length > 0);
  return {
    nR, nS,
    rows: p.propositions.map((q, i) => ({i, text: q.text})),
    sources: p.sources.map((s, j) => ({j, id: s.id, title: s.title, date: dates[j] || ''})),
    links,
    pendingRows,
    lanesPerRow: lanes,
    hasPendingCol,
    nC: nS + (hasPendingCol ? 1 : 0),
  };
}

/* ------------------------------------------------------------------------ */
/* Palette                                                                   */
/* ------------------------------------------------------------------------ */

export const MAT = {
  wall: '#ebe5d8',
  wallDark: '#e0d8c6',
  wallLine: '#d6ccb8',
  floor: '#b58a60',
  floorDark: '#9b7250',
  cork: '#d4b388',
  corkDark: '#b18c5c',
  corkLight: '#e5cfa9',
  frame: '#8e6441',
  frameLight: '#b3855a',
  caseWood: '#7a5436',
  caseBack: '#4f3726',
  shelf: '#a3764d',
  brass: '#c9a45c',
  note: '#f5d96b',
  card: '#fffdf6',
  rule: '#bcd1e2',
  redRule: '#df8b7f',
};

/** Colour of source column j (blue, green, purple in the default palette). */
export function sourceColor(ctx, j) {
  const th = ctx.theme;
  const cols = [th.accent2, th.accent4, th.cloth[3]];
  return cols[j % cols.length];
}

const SANS = FONTS.sans;

/* ------------------------------------------------------------------------ */
/* Small props                                                               */
/* ------------------------------------------------------------------------ */

/** Pushpin head seen from the front (local origin = centre). */
export function pinHead(ctx, color, R) {
  const th = ctx.theme;
  return [
    h('circle', {r: r(R), fill: color, stroke: th.ink, 'stroke-width': 2.2}),
    h('circle', {r: r(R * 0.56), fill: shade(color, 0.22), stroke: shade(color, -0.35), 'stroke-width': 1.2}),
    h('circle', {cx: r(-R * 0.34), cy: r(-R * 0.4), r: r(R * 0.2), fill: '#ffffff', opacity: 0.75}),
  ];
}

/** Static decorative pin (drawn in place). */
export function staticPin(ctx, x, y, color, R = 10) {
  return g({transform: T(x, y)},
    h('ellipse', {cx: 3, cy: 5, rx: R, ry: R * 0.8, fill: 'rgba(31,35,40,0.22)'}),
    pinHead(ctx, color, R));
}

/** Magnifier glyph (local origin = lens centre). */
export function magnifier(ctx, s, color) {
  return g(null,
    h('circle', {r: r(s * 0.36), fill: 'none', stroke: color, 'stroke-width': r(Math.max(2.2, s * 0.1))}),
    h('path', {d: `M${r(s * 0.26)} ${r(s * 0.26)}L${r(s * 0.56)} ${r(s * 0.56)}`, stroke: color, 'stroke-width': r(Math.max(3, s * 0.16)), 'stroke-linecap': 'round'}));
}

/* ------------------------------------------------------------------------ */
/* Room (wall + floor) and library (biblioteca)                              */
/* ------------------------------------------------------------------------ */

/**
 * Library bay: a papered wall with a wainscot line and a wooden floor strip,
 * inside a rounded window that also clips the researcher's arm.
 * @param {any} ctx
 * @param {{prefix:string, box:{x:number,y:number,w:number,h:number}, floorY:number, radius?:number}} o
 */
export function roomWindow(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o.box;
  const rad = o.radius ?? 26;
  const clipId = `${o.prefix}-clip`;
  const stripes = [];
  const step = 46;
  for (let sx = x + step / 2; sx < x + w; sx += step) stripes.push(`M${r(sx)} ${r(y)}V${r(o.floorY)}`);
  const boards = [];
  const fh = y + hh - o.floorY;
  for (let i = 1; i < 3; i++) boards.push(`M${r(x)} ${r(o.floorY + (fh * i) / 3)}H${r(x + w)}`);
  const surface = g({name: `${o.prefix}-room`},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(x, y, w, hh, rad)}))),
    g({'clip-path': ctx.ref(clipId)},
      h('rect', {x: r(x), y: r(y), width: r(w), height: r(hh), fill: MAT.wall}),
      h('path', {d: stripes.join(''), stroke: MAT.wallDark, 'stroke-width': 10, opacity: 0.55}),
      h('rect', {x: r(x), y: r(o.floorY), width: r(w), height: r(fh), fill: MAT.floor}),
      h('path', {d: boards.join(''), stroke: MAT.floorDark, 'stroke-width': 2, opacity: 0.8}),
      h('rect', {x: r(x), y: r(o.floorY - 12), width: r(w), height: 14, fill: shade(MAT.floor, -0.12), stroke: th.ink, 'stroke-width': 1.6}),
    ),
  );
  const frame = h('path', {d: roundRectPath(x, y, w, hh, rad), fill: 'none', stroke: th.ink, 'stroke-width': 3});
  return {surface, frame, clip: ctx.ref(clipId), box: o.box};
}

const BOOK_COLORS = ['#6d8a96', '#a3765a', '#7f8f6a', '#b0a27c', '#8c6f8e', '#c9b89a', '#5f6f7d', '#9c5f4f', '#a8a08c', '#6f7f63'];

/**
 * Bookcase with seeded books; the supplied sources stand as coloured volumes
 * with their identifier plate. Local coordinates = stage coordinates.
 * @param {any} ctx
 * `spines: true` (a narrow bookcase): the supplied sources stand as upright
 * volumes whose id reads up the spine (rotated), so a short id stays whole and
 * legible on a slim volume; `plaqueLines` / `plaqueW` let the plaque take more
 * lines or overhang a narrow case.
 * @param {{prefix:string, x:number, y:number, w:number, h:number, shelves:number, sources:{id:string}[], ts:number, seedKey:string, label?:string, plinth?:boolean, volScale?:number, spines?:boolean, plaqueLines?:number, plaqueW?:number}} o
 */
export function bookcase(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o;
  const side = Math.max(12, Math.min(22, w * 0.045));
  // brass plaque on the top rail: up to two balanced lines, never below 17 units
  const plaqueFit = o.label && ctx.show('all')
    ? fitWords(ctx, o.label, {maxWidth: o.plaqueW ?? Math.min(w - 10, 420), size: 22 * Math.min(1.2, o.ts), minSize: 17, maxLines: o.plaqueLines ?? 2, weight: 700})
    : null;
  const plaqueH = plaqueFit ? plaqueFit.height + 10 : 0;
  let top = o.label ? Math.max(34 * Math.min(1.2, o.ts), Math.min(40, hh * 0.08)) : Math.max(20, Math.min(34, hh * 0.08));
  if (plaqueFit) top = Math.max(top, (plaqueH + 8) / 0.8);
  const base = o.plinth === false ? side : Math.max(16, Math.min(30, hh * 0.05));
  const board = Math.max(9, Math.min(14, hh * 0.022));
  const innerX = x + side, innerW = w - side * 2;
  const innerY = y + top, innerH = hh - top - base;
  const clear = (innerH - board * (o.shelves - 1)) / o.shelves;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(x + 8, y + 10, w, hh, 8), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(x, y, w, hh, 8), fill: MAT.caseWood, stroke: th.ink, 'stroke-width': 2.6}));
  parts.push(h('rect', {x: r(innerX), y: r(innerY), width: r(innerW), height: r(innerH), fill: MAT.caseBack}));
  const volumes = [];
  const srcByShelf = Array.from({length: o.shelves}, () => []);
  o.sources.forEach((s, j) => srcByShelf[j % o.shelves].push(j));
  // the supplied sources stand out as wider colour-coded volumes whose id plate stays legible
  const vs = o.volScale ?? 1;
  const volW = o.spines
    ? Math.max(36, Math.min(46 * vs * Math.min(1.2, o.ts), innerW * 0.5))
    : Math.max(40, Math.min(64 * vs * Math.min(1.2, o.ts), innerW * 0.3));
  for (let s = 0; s < o.shelves; s++) {
    const sy = innerY + s * (clear + board);
    const floor = sy + clear;
    const want = srcByShelf[s];
    const books = [];
    let bx = innerX + 6;
    let i = 0;
    const slots = want.map((j, q) => innerX + innerW * ((q + 0.35) / Math.max(1, want.length)) * 0.92 + ctx.rng(`${o.seedKey}-slot`, s * 5 + q) * innerW * 0.06);
    let nextSlot = 0;
    while (bx < innerX + innerW - 12) {
      if (nextSlot < want.length && bx + volW >= slots[nextSlot]) {
        books.push({x: bx, w: volW, h: clear * 0.9, src: want[nextSlot]});
        bx += volW + 3;
        nextSlot++;
        continue;
      }
      const bw = 15 + ctx.rng(`${o.seedKey}-bw`, s * 40 + i) * 17;
      if (bx + bw > innerX + innerW - 6) break;
      const bh = clear * (0.58 + ctx.rng(`${o.seedKey}-bh`, s * 40 + i) * 0.3);
      books.push({x: bx, w: bw, h: bh, color: BOOK_COLORS[Math.floor(ctx.rng(`${o.seedKey}-bc`, s * 40 + i) * BOOK_COLORS.length)], lean: ctx.rng(`${o.seedKey}-bl`, s * 40 + i) > 0.9});
      bx += bw + 2;
      i++;
    }
    while (nextSlot < want.length) {
      const j = want[nextSlot++];
      while (books.length && !Number.isInteger(books[books.length - 1].src) && books[books.length - 1].x + books[books.length - 1].w + volW + 3 > innerX + innerW - 4) books.pop();
      const at = books.length ? books[books.length - 1].x + books[books.length - 1].w + 3 : innerX + 6;
      books.push({x: Math.min(at, innerX + innerW - volW - 4), w: volW, h: clear * 0.9, src: j});
    }
    for (const b of books) {
      const by = floor - b.h;
      if (Number.isInteger(b.src)) {
        const color = sourceColor(ctx, b.src);
        parts.push(h('rect', {x: r(b.x), y: r(by), width: r(b.w), height: r(b.h), rx: 3, fill: color, stroke: th.ink, 'stroke-width': 2}));
        parts.push(h('rect', {x: r(b.x + 3), y: r(by + 8), width: r(b.w - 6), height: 5, fill: shade(color, 0.35)}));
        parts.push(h('rect', {x: r(b.x + 3), y: r(floor - 16), width: r(b.w - 6), height: 5, fill: shade(color, 0.35)}));
        if (o.spines) {
          // upright spine label: a tall plate between the head and tail bands, the id reading upwards
          const pw = b.w - 10, py0 = by + 18, ph = Math.max(20, b.h - 40);
          const cx = b.x + b.w / 2, cy = py0 + ph / 2;
          parts.push(h('rect', {x: r(b.x + 5), y: r(py0), width: r(pw), height: r(ph), rx: 3, fill: '#fbf6ea', stroke: shade(color, -0.3), 'stroke-width': 1.4}));
          if (ctx.show('key')) {
            const f = ctx.fit(o.sources[b.src].id, {maxWidth: ph - 10, size: Math.min(24 * Math.min(1.2, o.ts), pw * 0.8), minSize: 12, maxLines: 1, weight: 800});
            parts.push(g({transform: `rotate(-90 ${r(cx)} ${r(cy)})`},
              textBlock(f, {x: cx, y: cy - f.size / 2 - 1, anchor: 'middle', fill: shade(color, -0.45)})));
          } else {
            parts.push(h('rect', {x: r(cx - pw * 0.12), y: r(py0 + 8), width: r(pw * 0.24), height: r(ph - 16), rx: 2, fill: shade(color, -0.2)}));
          }
          volumes[b.src] = {x: b.x, y: by, w: b.w, h: b.h, cx, cy: by + b.h / 2, color};
          continue;
        }
        const plateH = Math.min(b.h * 0.44, Math.max(24, 30 * vs * Math.min(1.2, o.ts)));
        const plateY = by + Math.max(b.h * 0.24, (b.h - plateH) * 0.42);
        parts.push(h('rect', {x: r(b.x + 4), y: r(plateY), width: r(b.w - 8), height: r(plateH), rx: 3, fill: '#fbf6ea', stroke: shade(color, -0.3), 'stroke-width': 1.4}));
        if (ctx.show('key')) {
          const f = ctx.fit(o.sources[b.src].id, {maxWidth: b.w - 12, size: Math.min(24 * vs * Math.min(1.2, o.ts), plateH * 0.74), minSize: 12, maxLines: 1, weight: 800});
          parts.push(textBlock(f, {x: b.x + b.w / 2, y: plateY + (plateH - f.size) / 2 - 1, anchor: 'middle', fill: shade(color, -0.45)}));
        } else {
          parts.push(h('rect', {x: r(b.x + 9), y: r(plateY + plateH * 0.4), width: r(b.w - 18), height: r(plateH * 0.2), rx: 2, fill: shade(color, -0.2)}));
        }
        volumes[b.src] = {x: b.x, y: by, w: b.w, h: b.h, cx: b.x + b.w / 2, cy: by + b.h / 2, color};
      } else {
        const tilt = b.lean ? ` rotate(-7 ${r(b.x + b.w)} ${r(floor)})` : '';
        parts.push(h('g', {transform: tilt.trim() || undefined},
          h('rect', {x: r(b.x), y: r(by), width: r(b.w), height: r(b.h), rx: 2, fill: b.color, stroke: th.ink, 'stroke-width': 1.6}),
          h('path', {d: `M${r(b.x + 2)} ${r(by + b.h * 0.18)}H${r(b.x + b.w - 2)}M${r(b.x + 2)} ${r(by + b.h * 0.82)}H${r(b.x + b.w - 2)}`, stroke: shade(b.color, 0.3), 'stroke-width': 2})));
      }
    }
    if (s < o.shelves - 1) {
      parts.push(h('rect', {x: r(innerX - 2), y: r(floor), width: r(innerW + 4), height: r(board), fill: MAT.shelf, stroke: th.ink, 'stroke-width': 1.8}));
    }
  }
  parts.push(h('rect', {x: r(x - 6), y: r(y - 4), width: r(w + 12), height: r(top * 0.8), rx: 4, fill: MAT.frameLight, stroke: th.ink, 'stroke-width': 2.4}));
  parts.push(h('rect', {x: r(x - 2), y: r(y + hh - base), width: r(w + 4), height: r(base), rx: 3, fill: MAT.frame, stroke: th.ink, 'stroke-width': 2.2}));
  let plate = null;
  if (plaqueFit) {
    const f = plaqueFit;
    const pw = f.width + 22;
    const ph = plaqueH;
    const px = x + w / 2 - pw / 2;
    const py = y - 4 + (top * 0.8 - ph) / 2;
    plate = g(null,
      h('rect', {x: r(px), y: r(py), width: r(pw), height: r(ph), rx: 4, fill: MAT.brass, stroke: th.ink, 'stroke-width': 1.6}),
      textBlock(f, {x: x + w / 2, y: py + (ph - f.height) / 2, anchor: 'middle', fill: '#3b2a16'}));
  }
  return {node: g({name: o.prefix}, parts, plate), volumes, box: {x, y, w, h: hh}};
}

/* ------------------------------------------------------------------------ */
/* Board, sheet, cards, source sheets, search printout                       */
/* ------------------------------------------------------------------------ */

/**
 * Cork board with a wooden frame and a ledge (local = stage coordinates).
 * @returns {{node:any, inner:{x:number,y:number,w:number,h:number}, ledge:{x:number,y:number,w:number,h:number}|null}}
 */
export function corkBoard(ctx, {prefix, x, y, w, h: hh, frame = 18, ledge = true, seedKey}) {
  const th = ctx.theme;
  const inner = {x: x + frame, y: y + frame, w: w - frame * 2, h: hh - frame * 2};
  const dots = [];
  const n = Math.round((inner.w * inner.h) / 5200);
  for (let i = 0; i < n; i++) {
    const px = inner.x + ctx.rng(`${seedKey}-cx`, i) * inner.w;
    const py = inner.y + ctx.rng(`${seedKey}-cy`, i) * inner.h;
    const light = ctx.rng(`${seedKey}-cl`, i) > 0.55;
    dots.push(h('circle', {cx: r(px), cy: r(py), r: r(1.2 + ctx.rng(`${seedKey}-cr`, i) * 1.6), fill: light ? MAT.corkLight : MAT.corkDark, opacity: 0.7}));
  }
  const L = ledge ? {x: x - 12, y: y + hh - 4, w: w + 24, h: 26} : null;
  const node = g({name: prefix},
    h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 14), fill: MAT.frame, stroke: th.ink, 'stroke-width': 2.6}),
    h('path', {d: roundRectPath(x + 5, y + 5, w - 10, hh - 10, 11), fill: 'none', stroke: MAT.frameLight, 'stroke-width': 3}),
    h('rect', {x: r(inner.x), y: r(inner.y), width: r(inner.w), height: r(inner.h), rx: 4, fill: MAT.cork, stroke: shade(MAT.frame, -0.3), 'stroke-width': 2}),
    dots,
    L ? g(null,
      h('rect', {x: r(L.x), y: r(L.y), width: r(L.w), height: r(L.h), rx: 5, fill: MAT.frame, stroke: th.ink, 'stroke-width': 2.4}),
      h('rect', {x: r(L.x + 2), y: r(L.y + 2), width: r(L.w - 4), height: r(L.h * 0.36), rx: 3, fill: MAT.frameLight})) : null,
  );
  return {node, inner, ledge: L};
}

/**
 * Fit the matrix into a board interior. Chooses the width of the card column
 * (and the header height) that keeps card and title text largest without
 * truncation. Pure; all text is measured here.
 * @param {any} ctx
 * @param {ReturnType<typeof resolveMatrix>} M
 * @param {{x:number,y:number,w:number,h:number}} box   board interior (matrix area)
 * @param {{ts?:number, gapX?:number, gapY?:number, headFracs?:number[], minHeadH?:number, cardSize?:number, titleSize?:number, titleMaxLines?:number, R?:number}} [o]
 */
export function matrixGeometry(ctx, M, box, o = {}) {
  const ts = o.ts ?? 1;
  const t = ctx.t;
  const R = o.R ?? 14 * ts;
  const gapX = o.gapX ?? Math.max(52 * ts, R * 3.4);
  const gapY = o.gapY ?? 18 * ts;
  const pad = 8 * ts;
  const cardSize = o.cardSize ?? 25 * ts;
  const baseTitleSize = o.titleSize ?? 22 * ts;
  const bandH = 34 * ts;
  const dateSize = 19 * ts;
  const fracs = o.headFracs ?? [0.22, 0.25, 0.28, 0.31, 0.34, 0.38, 0.42, 0.46, 0.5, 0.55];
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const laneGap = R * 2.35;
  const maxLanes = Math.max(1, ...M.lanesPerRow);
  let best = null;
  let fallback = null;
  const titleScales = o.titleScales ?? [1, 0.86];
  for (const tsc of titleScales) for (const f of fracs) {
    const titleSize = baseTitleSize * tsc;
    const headW = box.w * f;
    const colW = (box.w - headW - gapX) / M.nC;
    const colShort = Math.max(0, 92 * ts - colW);
    const sheetW = colW - pad * 2;
    const titleFits = M.sources.map(s => fitWhole(ctx, s.title, {maxWidth: sheetW - 18 * ts, size: titleSize, minSize: Math.max(14, titleSize * 0.8), maxLines: o.titleMaxLines ?? 3, weight: 700, floor: 12}));
    // (a long date may take a second line where the layout allows it, instead of being cut)
    const dateMaxLines = o.dateMaxLines ?? 1;
    const dateFits = M.sources.map(s => (s.date ? (dateMaxLines > 1
      ? fitWords(ctx, s.date, {maxWidth: sheetW - 18 * ts, size: dateSize, minSize: Math.min(dateSize, 15), maxLines: dateMaxLines, weight: 500})
      : ctx.fit(s.date, {maxWidth: sheetW - 18 * ts, size: dateSize, minSize: 13, maxLines: 1, weight: 500})) : null));
    const titleH = showKey ? Math.max(...titleFits.map(q => q.height)) : titleSize * 2.2;
    const dateH = showAll && dateFits.some(Boolean) ? Math.max(dateSize * 1.45, ...dateFits.map(q => (q ? q.height + dateSize * 0.25 : 0))) : 0;
    const headH = Math.max(o.minHeadH ?? 130 * ts, bandH + 10 * ts + titleH + 8 * ts + dateH + 16 * ts);
    const rowMin = Math.max(64, laneGap * (maxLanes - 1) + R * 2.6);
    let rowH = (box.h - headH - gapY) / M.nR;
    const rowShort = Math.max(0, rowMin - rowH);
    rowH = Math.max(rowH, 40);
    const cardH = rowH - 12 * ts;
    const textW = headW - 58 * ts - R * 1.4;
    const cardFits = M.rows.map(q => fitCard(ctx, q.text, {maxWidth: textW, size: cardSize, minSize: Math.max(15, cardSize * 0.7), height: cardH - 14 * ts}));
    const pendFit = ctx.fit(t.pendingSource, {maxWidth: sheetW - 22 * ts, size: titleSize, minSize: 13, maxLines: 2, weight: 700});
    const keyFits = showKey ? [...cardFits, ...titleFits] : [];
    // propositions (rows) matter most: a truncated card costs more than a truncated title
    const trunc = showKey ? cardFits.filter(q => q.truncated).length + titleFits.filter(q => q.truncated).length * 0.35 : 0;
    const broken = keyFits.filter(brokeWord).length;
    const minCard = Math.min(...cardFits.map(q => q.size)) / cardSize;
    const minTitle = Math.min(...titleFits.map(q => q.size)) / titleSize;
    const maxCardLines = Math.max(...cardFits.map(q => q.lines.length));
    // when truncation cannot be avoided, show as much of every proposition as possible
    const shown = showKey ? cardFits.reduce((acc, q) => acc + shownShare(q), 0) / cardFits.length : 1;
    const score = -trunc * 10 - broken * 6 + shown * 12 + minCard * 1.2 + minTitle * tsc + Math.min(1, colW / (190 * ts)) * 0.6 - Math.abs(f - 0.3) * 0.4 - maxCardLines * 0.06;
    const cand = {score, headW, colW, headH, rowH, titleFits, dateFits, cardFits, pendFit, sheetW, titleSize};
    if (colShort || rowShort) {
      // relaxed candidate (used only when no candidate satisfies the minimum sizes)
      const bad = colShort + rowShort;
      if (!fallback || bad < fallback.bad) fallback = {...cand, bad};
      continue;
    }
    if (!best || score > best.score) best = cand;
  }
  if (!best) best = fallback;
  const {headW, colW, headH, rowH, titleSize} = best;
  const sheet = {x: box.x + headW + gapX, y: box.y + headH + gapY, w: colW * M.nC, h: rowH * M.nR};
  const rows = M.rows.map((q, i) => {
    const y0 = sheet.y + i * rowH;
    const cy = y0 + rowH / 2;
    const card = {x: box.x, y: y0 + 6 * ts, w: headW, h: rowH - 12 * ts};
    const n = M.lanesPerRow[i];
    const laneY = k => cy + (k - (n - 1) / 2) * laneGap;
    return {i, y0, y1: y0 + rowH, cy, card, laneY, fit: best.cardFits[i]};
  });
  const cols = Array.from({length: M.nC}, (_, j) => {
    const x0 = sheet.x + j * colW;
    const pending = j >= M.nS;
    return {j, x0, x1: x0 + colW, cx: x0 + colW / 2, pending, head: {x: x0 + pad, y: box.y, w: colW - pad * 2, h: headH}, titleFit: pending ? null : best.titleFits[j], dateFit: pending ? null : best.dateFits[j]};
  });
  const corner = {x: box.x, y: box.y, w: headW + gapX - 16 * ts, h: headH};
  const links = M.links.map(l => {
    const row = rows[l.row];
    const y = row.laneY(l.lane);
    const anchor = {x: row.card.x + row.card.w, y};
    return {
      ...l,
      anchor,
      park: {...anchor},
      cell: {x: cols[l.col].cx, y},
      colTop: {x: cols[l.col].cx, y: sheet.y},
    };
  });
  const pendingCol = M.hasPendingCol ? cols[M.nC - 1] : null;
  const pending = M.pendingRows.map(i => ({row: i, cell: {x: pendingCol ? pendingCol.cx : sheet.x + sheet.w - colW / 2, y: rows[i].cy}}));
  /** cell centre of (row, column) — any column, used by entries that move a pin */
  const cellAt = (i, j, lane = 0, lanes = 1) => ({x: cols[j].cx, y: rows[i].cy + (lane - (lanes - 1) / 2) * laneGap});
  return {box, ts, R, sheet, rows, cols, corner, links, pending, colW, rowH, headW, headH, gapX, gapY, pad, laneGap, pendFit: best.pendFit, cardSize, titleSize, bandH, dateSize, cellAt};
}

/**
 * Banded matrix geometry: every row is a band whose proposition card is a
 * strip across the full width of the matrix, with the row's lane(s) of cells
 * beneath it; the source sheets head full-width columns. Used where the card
 * column of the classic layout would leave the columns too narrow for legible
 * titles (tall, narrow panels) or the rows too short for legible cards. The
 * pins wait on a tab hanging from the card strip in the anchor gutter at the
 * left and run along their lane to the pin position of their column (left
 * part of the cell, so the pinpoint flag opens beside the pin, inside the
 * lane). Returns the same structure as matrixGeometry (plus `banded: true`).
 * @param {any} ctx
 * @param {ReturnType<typeof resolveMatrix>} M
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {{ts?:number, R?:number, gutter?:number, gapY?:number, cardSize?:number, cardMin?:number, titleSize?:number, titleMin?:number, titleMaxLines?:number, titleCompact?:boolean, minHeadH?:number, dateSize?:number, laneMin?:number, noteLane?:number, pinOff?:number, corner?:{w:number, gap?:number}}} [o]
 */
export function bandedGeometry(ctx, M, box, o = {}) {
  const ts = o.ts ?? 1;
  const t = ctx.t;
  const R = o.R ?? 12 * ts;
  // o.corner: the search printout keeps the header row's left corner (its width); the anchor gutter under it
  const cornerW = o.corner ? o.corner.w : 0;
  const gutter = o.corner ? cornerW + (o.corner.gap ?? 14 * ts) : o.gutter ?? Math.max(60 * ts, R * 4);
  const gapY = o.gapY ?? 14 * ts;
  const pad = 8 * ts;
  const cardSize = o.cardSize ?? 25 * ts;
  const cardMin = o.cardMin ?? cardSize * 0.8;
  const titleSize = o.titleSize ?? 22 * ts;
  const titleMin = o.titleMin ?? titleSize * 0.86;
  const bandH = 34 * ts;
  const dateSize = o.dateSize ?? 19 * ts;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const laneGap = R * 2.35;
  const colW = (box.w - gutter) / M.nC;
  const sheetW = colW - pad * 2;
  const tw = sheetW - 17 * ts;
  // titles: whole words, three lines if they fit at a readable size, else up to titleMaxLines;
  // dates: one line (slightly smaller if need be) before a second line
  const titleFit = (text, ml, size = titleSize) => fitWhole(ctx, text, {maxWidth: tw, size, minSize: titleMin, maxLines: ml, weight: 700, floor: titleMin * 0.88});
  // (titleCompact: the fewest lines at a size ≥ titleMin, so the header stays low where space is tight)
  const whole = f => !f.truncated && !brokeWord(f);
  const dateFits = M.sources.map(s => {
    if (!s.date) return null;
    const f1 = ctx.fit(s.date, {maxWidth: tw, size: dateSize, minSize: dateSize * 0.84, maxLines: 1, weight: 500});
    return f1.truncated ? fitWords(ctx, s.date, {maxWidth: tw, size: dateSize, minSize: Math.min(dateSize, 15), maxLines: 2, weight: 500}) : f1;
  });
  const dateH = showAll && dateFits.some(Boolean) ? Math.max(...dateFits.map(q => (q ? q.height : 0))) + 8 * ts : 0;
  // (titleCompact with a header height already set by o.minHeadH: all titles take one common size — the
  // largest, up to titleSize, at which every title's whole words fit the height that header leaves)
  const titleRoom = o.titleCompact && o.minHeadH && showKey ? o.minHeadH - (bandH + 10 * ts + 8 * ts + dateH + 18 * ts) : 0;
  let roomFits = null;
  for (let size = titleSize; titleRoom > 0 && !roomFits && size >= titleMin * 1.06 - 1e-6; size -= 0.5) {
    const fs = M.sources.map(s => {
      for (let ml = 1; ml <= (o.titleMaxLines ?? 3); ml++) {
        const f = titleFit(s.title, ml, size);
        if (whole(f) && f.size >= size - 0.01 && f.height <= titleRoom) return f;
      }
      return null;
    });
    if (fs.every(Boolean)) roomFits = fs;
  }
  const titleFits = roomFits || M.sources.map(s => {
    if (o.titleCompact) {
      for (let ml = 1; ml <= (o.titleMaxLines ?? 3); ml++) {
        const f = titleFit(s.title, ml, titleMin * 1.06);
        if (whole(f) && f.size >= titleMin - 0.01) return f;
      }
    }
    const f3 = titleFit(s.title, Math.min(3, o.titleMaxLines ?? 3));
    return whole(f3) ? f3 : titleFit(s.title, o.titleMaxLines ?? 3);
  });
  const titleH = showKey ? Math.max(...titleFits.map(q => q.height)) : titleSize * 2.2;
  const headH = Math.max(o.minHeadH ?? 0, bandH + 10 * ts + titleH + 8 * ts + dateH + 18 * ts);
  const pendFit = ctx.fit(t.pendingSource, {maxWidth: sheetW - 22 * ts, size: titleSize, minSize: 13, maxLines: 2, weight: 700});
  const avail = box.h - headH - gapY;
  // each row's lane is as tall as its content needs (parallel lanes, a sticky note in the pending
  // column); spare height is shared out in proportion
  const needs = M.rows.map((q, i) => {
    const n = Math.max(1, M.lanesPerRow[i]);
    let need = laneGap * (n - 1) + R * 2 + 16 * ts;
    if (o.noteLane && M.pendingRows.includes(i)) need = Math.max(need, o.noteLane);
    return Math.max(o.laneMin ?? 0, need);
  });
  const needSum = needs.reduce((a, b) => a + b, 0);
  // card strip: text across the width (badge at the left, the strip's own pin at the right)
  const textW = box.w - 46 * ts - 6 - 24 * ts;
  const stripMax = Math.max(cardMin * 1.2 + 12 * ts, (avail - needSum) / M.nR - 9 * ts);
  const cardFits = M.rows.map(q => fitCard(ctx, q.text, {maxWidth: textW, size: cardSize, minSize: cardMin, height: stripMax - 12 * ts}));
  const stripH = Math.min(stripMax, Math.max(...cardFits.map(f => f.height)) + 14 * ts);
  const spare = avail - M.nR * (stripH + 9 * ts) - needSum;
  const laneHs = needs.map(nd => Math.max(R * 2 + 4 * ts, nd + (spare * nd) / needSum));
  const rowH = avail / M.nR;
  const sheet = {x: box.x + gutter, y: box.y + headH + gapY, w: colW * M.nC, h: avail};
  let yy = sheet.y;
  const rows = M.rows.map((q, i) => {
    const y0 = yy;
    const h1 = stripH + 9 * ts + laneHs[i];
    yy += h1;
    const card = {x: box.x, y: y0 + 3 * ts, w: box.w, h: stripH};
    const laneTop = card.y + stripH + 3 * ts, laneBot = y0 + h1 - 3 * ts;
    const cy = (laneTop + laneBot) / 2;
    const n = M.lanesPerRow[i];
    const laneY = k => cy + (k - (n - 1) / 2) * laneGap;
    return {i, y0, y1: y0 + h1, cy, card, laneY, laneTop, laneH: laneBot - laneTop, fit: cardFits[i]};
  });
  const pinOff = o.pinOff ?? Math.min(colW * 0.5, Math.max(R * 2.3 + 8 * ts, colW * 0.22));
  const cols = Array.from({length: M.nC}, (_, j) => {
    const x0 = sheet.x + j * colW;
    const pending = j >= M.nS;
    return {j, x0, x1: x0 + colW, cx: x0 + colW / 2, px: pending ? x0 + colW / 2 : x0 + pinOff, pending,
      head: {x: x0 + pad, y: box.y, w: colW - pad * 2, h: headH}, titleFit: pending ? null : titleFits[j], dateFit: pending ? null : dateFits[j]};
  });
  // the grommet tab hangs at the gutter's right end (short threads), or in its middle without a corner
  const anchorX = o.corner ? sheet.x - Math.max(R * 1.6, 26 * ts) : box.x + gutter * 0.5;
  const links = M.links.map(l => {
    const row = rows[l.row];
    const y = row.laneY(l.lane);
    const anchor = {x: anchorX, y};
    return {...l, anchor, park: {...anchor}, cell: {x: cols[l.col].px, y}, colTop: {x: cols[l.col].px, y: sheet.y}};
  });
  const pendingCol = M.hasPendingCol ? cols[M.nC - 1] : null;
  const pending = M.pendingRows.map(i => ({row: i, cell: {x: pendingCol ? pendingCol.cx : sheet.x + sheet.w - colW / 2, y: rows[i].cy}}));
  const cellAt = (i, j, lane = 0, lanes = 1) => ({x: cols[j].px, y: rows[i].cy + (lane - (lanes - 1) / 2) * laneGap});
  const corner = o.corner ? {x: box.x, y: box.y, w: cornerW, h: headH} : null;
  // (laneShort: how much the lanes fall short of what their content needs; titleMinSize: smallest title size)
  const laneShort = needs.reduce((acc, nd, i) => acc + Math.max(0, nd - laneHs[i]), 0);
  const titleMinSize = Math.min(...titleFits.map(f => f.size));
  return {banded: true, box, ts, R, sheet, rows, cols, corner, links, pending, colW, rowH, headW: gutter, headH, gapX: 0, gapY, pad, laneGap, pendFit, cardSize, titleSize, bandH, dateSize, cellAt, anchorX, stripH, pinOff, laneShort, titleMinSize};
}

/** True when a fitted text had to break a word across lines. */
export function brokeWord(fit) {
  const norm = String(fit.full).replace(/\s+/g, ' ').trim();
  const joined = fit.lines.join(' ').replace(/…$/, '');
  // a split word shows up as "Wareho use": the joined lines are no longer a prefix of the text
  return fit.truncated ? !norm.startsWith(joined) : joined !== norm;
}

/**
 * Re-wrap a multi-line fit at the SAME size into the narrowest width that
 * keeps its line count, so lines are balanced and no word is left orphaned
 * ("Letter from Party / A" → "Letter from / Party A"). Truncated, broken or
 * single-line fits are returned unchanged.
 * @param {any} ctx
 * @param {any} fit  result of ctx.fit
 * @param {{maxWidth:number, weight?:number, family?:string}} o
 */
export function balance(ctx, fit, o) {
  if (!fit || fit.truncated || fit.lines.length < 2 || brokeWord(fit)) return fit;
  const n = fit.lines.length;
  const opts = {weight: fit.weight, family: fit.family, size: fit.size, minSize: fit.size, maxLines: n};
  let lo = fit.width / n, hi = fit.width;
  let best = fit;
  for (let i = 0; i < 14 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2;
    const f = ctx.fit(fit.full, {...opts, maxWidth: mid});
    if (!f.truncated && f.lines.length === n && !brokeWord(f)) { best = f; hi = mid; } else lo = mid;
  }
  return best;
}

/**
 * Width to pass to chip() so that its text wraps balanced (no orphan). The
 * chip keeps its size; when the text would shrink or truncate, the given
 * maxWidth is returned unchanged.
 * @param {any} ctx
 * @param {string} text
 * @param {{maxWidth:number, size:number, maxLines?:number, weight?:number, padX?:number}} o
 */
export function balancedChipWidth(ctx, text, o) {
  const padX = o.padX ?? o.size * 0.6;
  const f = ctx.fit(text, {maxWidth: o.maxWidth - padX * 2, size: o.size, minSize: o.size * 0.75, maxLines: o.maxLines ?? 2, weight: o.weight ?? 600});
  if (f.truncated || f.size < o.size - 1e-6 || f.lines.length < 2) return o.maxWidth;
  const b = balance(ctx, f, {maxWidth: o.maxWidth - padX * 2});
  return Math.min(o.maxWidth, b.width + padX * 2 + 1);
}

/**
 * ctx.fit that prefers shrinking (down to minSize) over breaking a word
 * across lines; falls back to the plain fit when even minSize breaks it.
 * Multi-line results are balanced.
 */
export function fitWords(ctx, text, o) {
  let f = ctx.fit(text, o);
  if (!brokeWord(f)) return balance(ctx, f, o);
  const min = o.minSize ?? o.size * 0.72;
  for (let s = o.size - Math.max(0.5, o.size * 0.04); s >= min - 1e-6; s -= Math.max(0.5, o.size * 0.04)) {
    const c = ctx.fit(text, {...o, size: s, minSize: Math.min(s, min)});
    if (!brokeWord(c) && !c.truncated) return balance(ctx, c, o);
  }
  return f;
}

/**
 * Fit that never splits a word: prefers fitWords; when a single word is
 * wider than the box even at minSize, the size drops just enough (never
 * below `floor`) for the longest word to fit whole.
 */
export function fitWhole(ctx, text, o) {
  const f = fitWords(ctx, text, o);
  if (!brokeWord(f)) return f;
  const words = String(text).split(/\s+/).filter(Boolean);
  const weight = o.weight ?? 400;
  const size0 = o.minSize ?? o.size * 0.72;
  const widest = Math.max(...words.map(w => ctx.measure(w, size0, weight, o.family ?? 'sans')));
  const size = Math.max(o.floor ?? 11, Math.min(size0, (size0 * o.maxWidth) / Math.max(1, widest)) - 0.25);
  return balance(ctx, ctx.fit(text, {...o, size, minSize: size}), o);
}

/**
 * Fit card text into a box of given height: the largest size (down to
 * minSize) whose line budget holds the whole text without breaking words.
 */
export function fitCard(ctx, text, o) {
  let last = null;
  const step = Math.max(0.5, o.size * 0.04);
  for (let s = o.size; s >= o.minSize - 1e-6; s -= step) {
    const maxLines = Math.max(1, Math.min(6, Math.floor((o.height - s) / (s * 1.18)) + 1));
    const f = ctx.fit(text, {maxWidth: o.maxWidth, size: s, minSize: s, maxLines, weight: 600});
    last = f;
    if (!f.truncated && !brokeWord(f)) return balance(ctx, f, o);
  }
  const s = o.minSize;
  const maxLines = Math.max(1, Math.min(6, Math.floor((o.height - s) / (s * 1.18)) + 1));
  const f = ctx.fit(text, {maxWidth: o.maxWidth, size: s, minSize: s, maxLines, weight: 600}) || last;
  if (!brokeWord(f)) return f;
  // never split a word: shrink just enough for the widest word (bounded), else keep the split fit
  const whole = fitWhole(ctx, text, {maxWidth: o.maxWidth, size: s, minSize: s, maxLines, weight: 600, floor: Math.max(12, s * 0.8)});
  return brokeWord(whole) ? f : whole;
}

/** Share of a text actually shown by a fit (1 when nothing is truncated). */
export function shownShare(fit) {
  if (!fit.truncated) return 1;
  const shown = fit.lines.join(' ').replace(/…$/, '').length;
  return Math.min(1, shown / Math.max(1, String(fit.full).length));
}

/**
 * Ruled index card (ficha). Local = stage coordinates. The grommets (one per
 * lane) sit on the card's right edge; with `tabX` (banded matrix) they sit on a
 * paper tab hanging from the card's bottom edge at that x, one per lane.
 */
export function indexCard(ctx, {name, box, n, fit, ts, laneYs = [], R = 14, tabX = null}) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = box;
  const lines = [];
  const lh = Math.max(18, fit.lineHeight);
  for (let ly = y + 28 * ts + lh; ly < y + hh - 8; ly += lh) lines.push(`M${r(x + 8)} ${r(ly)}H${r(x + w - 8)}`);
  const bR = 14 * ts;
  const textX = x + 46 * ts + 6;
  const textY = y + (hh - fit.height) / 2;
  const bx = x + 12 * ts + bR, by = Math.min(y + 12 * ts + bR, textY + fit.size * 0.5);
  const gx = tabX ?? x + w;
  const grommets = laneYs.map(gy => g(null,
    h('circle', {cx: r(gx), cy: r(gy), r: r(R * 0.55), fill: MAT.brass, stroke: th.ink, 'stroke-width': 1.8}),
    h('circle', {cx: r(gx), cy: r(gy), r: r(R * 0.22), fill: shade(MAT.brass, -0.5)})));
  let tab = null;
  if (tabX !== null && laneYs.length) {
    const tw = R * 2.2, tb = Math.max(...laneYs) + R * 1.05;
    tab = g(null,
      h('path', {d: `M${r(tabX - tw / 2 + 5)} ${r(y + hh - 10)}V${r(tb - 6)}Q${r(tabX - tw / 2 + 5)} ${r(tb + 1)} ${r(tabX - tw / 2 + 12)} ${r(tb + 1)}H${r(tabX + tw / 2 - 2)}Q${r(tabX + tw / 2 + 5)} ${r(tb + 1)} ${r(tabX + tw / 2 + 5)} ${r(tb - 6)}V${r(y + hh - 10)}Z`, fill: th.shadow}),
      h('path', {d: `M${r(tabX - tw / 2)} ${r(y + hh - 10)}V${r(tb - 7)}Q${r(tabX - tw / 2)} ${r(tb)} ${r(tabX - tw / 2 + 7)} ${r(tb)}H${r(tabX + tw / 2 - 7)}Q${r(tabX + tw / 2)} ${r(tb)} ${r(tabX + tw / 2)} ${r(tb - 7)}V${r(y + hh - 10)}`, fill: MAT.card, stroke: th.ink, 'stroke-width': 2.2}));
  }
  const roomy = textY - y > 30 * ts;
  return g({name},
    h('path', {d: roundRectPath(x + 5, y + 7, w, hh, 6), fill: th.shadow}),
    tab,
    h('path', {d: roundRectPath(x, y, w, hh, 6), fill: MAT.card, stroke: th.ink, 'stroke-width': 2.2}),
    roomy ? h('path', {d: lines.join(''), stroke: MAT.rule, 'stroke-width': 1.5, fill: 'none'}) : null,
    roomy ? h('path', {d: `M${r(x + 8)} ${r(y + 28 * ts)}H${r(x + w - 8)}`, stroke: MAT.redRule, 'stroke-width': 2}) : null,
    h('circle', {cx: r(bx), cy: r(by), r: r(bR), fill: th.ink}),
    ctx.show('key') ? h('text', {x: r(bx), y: r(by + bR * 0.42), 'text-anchor': 'middle', 'font-size': r(bR * 1.18), 'font-weight': 800, 'font-family': SANS, fill: '#ffffff'}, String(n)) : pips(bx, by, bR, n),
    ctx.show('key') ? textBlock(fit, {x: textX, y: textY, fill: th.ink}) : g(null, fit.lines.map((_, i) => h('rect', {x: r(textX), y: r(textY + i * fit.lineHeight + fit.size * 0.2), width: r(Math.max(20, (w - 68 * ts) * (0.95 - i * 0.18))), height: r(fit.size * 0.5), rx: 3, fill: th.paperLine}))),
    textY - y > 16 * ts ? staticPin(ctx, x + w / 2, y + 5 * ts, '#9aa4ad', 7 * ts) : staticPin(ctx, x + w - 12 * ts, y + 6 * ts, '#9aa4ad', 5 * ts),
    grommets,
  );
}

/** Row number as white pips on the badge (text-free). */
function pips(cx, cy, R, n) {
  const out = [];
  const k = Math.min(4, n);
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2 - Math.PI / 2;
    const rr = k === 1 ? 0 : R * 0.45;
    out.push(h('circle', {cx: r(cx + Math.cos(a) * rr), cy: r(cy + Math.sin(a) * rr), r: r(R * 0.2), fill: '#ffffff'}));
  }
  return out;
}

/** Source sheet (documento) for column j. Local = stage coordinates. */
export function sourceSheet(ctx, {name, box, color, id, titleFit, dateFit, ts, bandH, opacity}) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = box;
  const fold = Math.min(22 * ts, w * 0.16);
  const body = `M${r(x + 4)} ${r(y)}H${r(x + w - 4)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + 4)}V${r(y + hh - fold)}L${r(x + w - fold)} ${r(y + hh)}H${r(x + 4)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - 4)}V${r(y + 4)}Q${r(x)} ${r(y)} ${r(x + 4)} ${r(y)}Z`;
  const parts = [
    h('path', {d: roundRectPath(x + 5, y + 8, w, hh, 5), fill: th.shadow}),
    h('path', {d: body, fill: th.paper, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(x + 1.2)} ${r(y + 5)}Q${r(x + 1.2)} ${r(y + 1.2)} ${r(x + 5)} ${r(y + 1.2)}H${r(x + w - 5)}Q${r(x + w - 1.2)} ${r(y + 1.2)} ${r(x + w - 1.2)} ${r(y + 5)}V${r(y + bandH)}H${r(x + 1.2)}Z`, fill: color}),
    h('path', {d: `M${r(x + w - fold)} ${r(y + hh)}V${r(y + hh - fold + 4)}Q${r(x + w - fold)} ${r(y + hh - fold)} ${r(x + w - fold + 4)} ${r(y + hh - fold)}H${r(x + w)}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
  let ty = y + bandH + 10 * ts;
  const pinR = 9 * ts;
  let pinX = x + w / 2;
  if (ctx.show('key')) {
    // the id sits left of the sheet's pin; the pin moves right of a long id (never over it)
    const idF = ctx.fit(id, {maxWidth: w - 20 * ts - pinR * 2 - 10, size: 21 * ts, minSize: 12, maxLines: 1, weight: 800});
    pinX = Math.min(x + w - pinR - 6, Math.max(pinX, x + 10 * ts + idF.width + 0.6 * id.length + pinR + 8));
    parts.push(textBlock(idF, {x: x + 10 * ts, y: y + (bandH - idF.size) / 2, fill: '#ffffff', letterSpacing: 0.6}));
    parts.push(textBlock(titleFit, {x: x + 10 * ts, y: ty, fill: th.ink}));
    ty += titleFit.height + 8 * ts;
  } else {
    parts.push(h('rect', {x: r(x + 10 * ts), y: r(y + bandH * 0.4), width: r(Math.min(40 * ts, w * 0.3)), height: r(bandH * 0.22), rx: 2, fill: '#ffffff', opacity: 0.85}));
    for (let i = 0; i < 2; i++) parts.push(h('rect', {x: r(x + 10 * ts), y: r(ty + i * 24 * ts), width: r((w - 20 * ts) * (0.9 - i * 0.3)), height: r(11 * ts), rx: 3, fill: th.ink, opacity: 0.75}));
    ty += 54 * ts;
  }
  if (dateFit && ctx.show('all')) {
    parts.push(textBlock(dateFit, {x: x + 10 * ts, y: ty, fill: th.inkSoft}));
    ty += dateFit.height + 8 * ts;
  }
  const barH = 6 * ts;
  for (let i = 0; ty + barH < y + hh - 10 * ts && i < 3; i++) {
    parts.push(h('rect', {x: r(x + 10 * ts), y: r(ty), width: r((w - 20 * ts) * (i === 2 ? 0.5 : 0.86 - i * 0.1)), height: r(barH), rx: 3, fill: th.paperLine}));
    ty += barH * 2.2;
  }
  parts.push(staticPin(ctx, pinX, y + 4 * ts, color, pinR));
  return g({name, opacity}, parts);
}

/** Dashed placeholder where a source sheet is not supplied. */
export function pendingSlot(ctx, {name, box, fit, ts, text = true, opacity}) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = box;
  const hatch = [];
  const step = 16 * ts;
  const clipId = `${name}-hclip`;
  for (let k = -hh; k < w; k += step) hatch.push(`M${r(x + k)} ${r(y + hh)}L${r(x + k + hh)} ${r(y)}`);
  const withText = text && ctx.show('key') && fit;
  return g({name, opacity},
    h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(x, y, w, hh, 8)}))),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: 'rgba(255,253,246,0.6)'}),
    g({'clip-path': ctx.ref(clipId)}, h('path', {d: hatch.join(''), stroke: th.paperLine, 'stroke-width': 2, opacity: 0.7})),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: 'none', stroke: th.inkSoft, 'stroke-width': 2.6, 'stroke-dasharray': '10 8'}),
    g({transform: T(x + w / 2, y + hh * (withText ? 0.3 : 0.5))},
      h('path', {d: `M${r(-17 * ts)} ${r(-22 * ts)}H${r(7 * ts)}L${r(17 * ts)} ${r(-12 * ts)}V${r(22 * ts)}H${r(-17 * ts)}Z`, fill: 'rgba(255,255,255,0.7)', stroke: th.inkSoft, 'stroke-width': 2.4, 'stroke-dasharray': '6 5', 'stroke-linejoin': 'round'})),
    withText ? g({name: `${name}-txt`}, textBlock(fit, {x: x + w / 2, y: y + hh * 0.52, anchor: 'middle', fill: th.inkSoft})) : null,
  );
}

/** Query field of the search printout: fitted query and field geometry (shared by searchSlip and entries that crop it). */
export function searchField(ctx, {box, query, ts, nSources = 0}) {
  const {x, y, w, h: hh} = box;
  const padIn = 11 * ts;
  const field0 = Math.min(44 * ts, hh * 0.3);
  const qW = w - padIn * 2 - field0 * 1.1;
  // a long query wraps to a second line (the field grows) instead of shrinking out of legibility
  // (a tall, narrow printout — e.g. standing in a side column — lets the query wrap to up to four
  // slightly smaller lines, so its words are not shrunk to fit a narrow line)
  const qLines = hh > 210 && w < 300 ? 4 : hh > 130 && w < 260 ? 3 : hh > 150 ? 2 : 1;
  const qSize = Math.min(21 * ts, field0 * 0.5) * (qLines > 2 ? 0.84 : 1);
  const qFit = ctx.show('all') ? fitWords(ctx, query, {maxWidth: qW, size: qSize, minSize: Math.min(qLines > 2 ? 13.5 : 16, qSize), maxLines: qLines, weight: 600}) : null;
  const fieldH = qFit && qFit.lines.length > 1 ? Math.min(hh * (qLines > 2 ? 0.52 : 0.46), qFit.height + 14 * ts) : field0;
  const rowsTop = y + padIn + fieldH + 10 * ts;
  const rowH = Math.min(32 * ts, (y + hh - 14 - rowsTop) / Math.max(1, nSources));
  // vertical extent of each result row (its id and bar), top to bottom
  const rowBands = Array.from({length: nSources}, (_, j) => {
    const ry = rowsTop + j * rowH + rowH / 2;
    const size = Math.min(20 * ts, rowH * 0.68);
    return {y0: ry - size * 0.62, y1: ry + size * 0.5};
  });
  return {padIn, field0, qW, qx: x + padIn + field0 * 0.95, qFit, fieldH, bottom: y + padIn + fieldH, rowsTop, rowH, rowBands};
}

/** Search printout (buscador) with the query and a result list keyed to the sources. */
export function searchSlip(ctx, {name, box, query, sources, ts, results}) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = box;
  const {padIn, field0, qx, qW, qFit, fieldH, rowsTop, rowH} = searchField(ctx, {box, query, ts, nSources: sources.length});
  const perf = [];
  for (let px = x + 10; px < x + w - 6; px += 14) perf.push(h('circle', {cx: r(px), cy: r(y + hh - 7), r: 2.2, fill: MAT.cork}));
  const parts = [
    h('path', {d: roundRectPath(x + 5, y + 8, w, hh, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 6), fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}),
    perf,
    h('path', {d: roundRectPath(x + padIn, y + padIn, w - padIn * 2, fieldH, Math.min(fieldH / 2, field0 / 2)), fill: '#ffffff', stroke: th.ink, 'stroke-width': 2}),
    g({transform: T(x + padIn + field0 * 0.5, y + padIn + fieldH / 2 - field0 * 0.04)}, magnifier(ctx, field0 * 0.62, th.ink)),
    staticPin(ctx, x + w / 2, y + 3 * ts, '#9aa4ad', 7 * ts),
  ];
  if (qFit) {
    parts.push(textBlock(qFit, {x: qx, y: y + padIn + (fieldH - qFit.height) / 2, fill: th.ink}));
  } else {
    parts.push(h('rect', {x: r(qx), y: r(y + padIn + fieldH * 0.4), width: r(qW * 0.7), height: r(fieldH * 0.22), rx: 3, fill: th.paperLine}));
  }
  const rowNodes = [];
  sources.forEach((s, j) => {
    const ry = rowsTop + j * rowH + rowH / 2;
    const col = sourceColor(ctx, j);
    const row = [h('circle', {cx: r(x + padIn + 9 * ts), cy: r(ry), r: r(Math.min(8 * ts, rowH * 0.3)), fill: col, stroke: th.ink, 'stroke-width': 1.5})];
    let bx = x + padIn + 24 * ts;
    if (ctx.show('all')) {
      // ids never taller than ~60% of the row pitch, so neighbouring results never touch
      const f = ctx.fit(s.id, {maxWidth: 80 * ts, size: Math.min(20 * ts, rowH * 0.68), minSize: Math.min(12, rowH * 0.68), maxLines: 1, weight: 800});
      row.push(textBlock(f, {x: bx, y: ry - f.size * 0.55, fill: shade(col, -0.35)}));
      bx += f.width + 10 * ts;
    }
    row.push(h('rect', {x: r(bx), y: r(ry - 3 * ts), width: r(Math.max(10, (x + w - padIn - bx) * (0.9 - j * 0.12))), height: r(6 * ts), rx: 3, fill: th.paperLine}));
    rowNodes.push(results ? g({name: `${name}-r${j}`}, row) : row);
  });
  parts.push(rowNodes);
  return g({name}, parts);
}

/** Matrix sheet (the grid paper pinned over the cork). */
export function matrixSheet(ctx, {name, G, M, pendingTint = true}) {
  const th = ctx.theme;
  const S = G.sheet;
  const parts = [
    h('path', {d: roundRectPath(S.x + 6, S.y + 9, S.w, S.h, 6), fill: th.shadow}),
    h('path', {d: roundRectPath(S.x, S.y, S.w, S.h, 6), fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}),
  ];
  const clipId = `${name}-clip`;
  const bands = G.cols.map(c => {
    if (c.pending) {
      if (!pendingTint) return null;
      const hatch = [];
      for (let k = -S.h; k < G.colW; k += 18 * G.ts) hatch.push(`M${r(c.x0 + k)} ${r(S.y + S.h)}L${r(c.x0 + k + S.h)} ${r(S.y)}`);
      return g(null, h('rect', {x: r(c.x0), y: r(S.y), width: r(G.colW), height: r(S.h), fill: th.paperShade, opacity: 0.55}),
        h('path', {d: hatch.join(''), stroke: th.paperLine, 'stroke-width': 1.6, opacity: 0.6}));
    }
    return h('rect', {x: r(c.x0), y: r(S.y), width: r(G.colW), height: r(S.h), fill: shade(sourceColor(ctx, c.j), 0.86)});
  });
  parts.push(h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(S.x, S.y, S.w, S.h, 6)}))));
  parts.push(g({'clip-path': ctx.ref(clipId)}, bands));
  const grid = [];
  for (let j = 1; j < G.cols.length; j++) grid.push(`M${r(S.x + j * G.colW)} ${r(S.y)}V${r(S.y + S.h)}`);
  for (let i = 1; i < G.rows.length; i++) grid.push(`M${r(S.x)} ${r(G.rows[i].y0)}H${r(S.x + S.w)}`);
  parts.push(h('path', {d: grid.join(''), stroke: th.paperLine, 'stroke-width': 2, fill: 'none'}));
  const guides = [];
  G.rows.forEach(row => { guides.push(`M${r(S.x + 8)} ${r(row.cy)}H${r(S.x + S.w - 8)}`); });
  parts.push(h('path', {d: guides.join(''), stroke: th.paperLine, 'stroke-width': 1.4, 'stroke-dasharray': '3 9', fill: 'none', opacity: 0.8}));
  for (const [px, py] of [[S.x + 12, S.y + 12], [S.x + S.w - 12, S.y + 12], [S.x + 12, S.y + S.h - 12], [S.x + S.w - 12, S.y + S.h - 12]]) parts.push(staticPin(ctx, px, py, '#9aa4ad', 6 * G.ts));
  return g({name}, parts);
}

/* ------------------------------------------------------------------------ */
/* Dynamic parts: pins, threads, column links, flags, sockets, notes         */
/* ------------------------------------------------------------------------ */

/**
 * Text fit for a sticky note of size w×h: as many lines as the note's writing
 * area (below the adhesive strip) holds, whole words first. Per line count the
 * largest size whose whole words fit is found; the fewest lines win unless they
 * cost more than ~12 % of the size. Only when no size down to minSize holds the
 * text whole is it cut (the result then has `truncated`).
 */
export function noteTextFit(ctx, {w, h: hh, text, ts, size, minSize, maxLines}) {
  const room = hh * 0.8 - 4 * ts;
  const s0 = size ?? 20 * ts, s1 = Math.min(s0, minSize ?? 13);
  const o = {maxWidth: w - 16 * ts, weight: 700};
  const step = Math.max(0.5, s0 * 0.04);
  const per = [];
  for (let ml = 1; ml <= (maxLines ?? 2); ml++) {
    for (let s = s0; s >= s1 - 1e-6; s -= step) {
      const c = ctx.fit(text, {...o, size: s, minSize: s, maxLines: ml});
      if (!c.truncated && !brokeWord(c) && c.height <= room + 2) { per.push(c); break; }
    }
  }
  if (per.length) {
    const top = Math.max(...per.map(c => c.size));
    return balance(ctx, per.find(c => c.size >= top * 0.88 - 1e-6), o);
  }
  let f = null;
  for (let ml = maxLines ?? 2; ml >= 1; ml--) {
    const c = fitWords(ctx, text, {...o, size: s0, minSize: s1, maxLines: ml});
    if (!f) f = c;
    if (c.height <= room + 2 && !c.truncated) { f = c; break; }
    if (c.height <= room + 2 && f.height > room + 2) f = c;
  }
  return f;
}

/** Sticky note (local origin = centre). */
export function stickyNoteArt(ctx, {w, h: hh, text, ts, shadow = true, size, minSize, maxLines}) {
  const th = ctx.theme;
  const parts = [];
  if (shadow) parts.push(h('path', {d: roundRectPath(-w / 2 + 5, -hh / 2 + 8, w, hh, 4), fill: th.shadow}));
  parts.push(h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 4), fill: MAT.note, stroke: shade(MAT.note, -0.45), 'stroke-width': 2}));
  parts.push(h('rect', {x: r(-w / 2 + 1), y: r(-hh / 2 + 1), width: r(w - 2), height: r(hh * 0.2), fill: shade(MAT.note, -0.08)}));
  if (text && ctx.show('key')) {
    const f = noteTextFit(ctx, {w, h: hh, text, ts, size, minSize, maxLines});
    parts.push(textBlock(f, {x: 0, y: -hh / 2 + hh * 0.2 + (hh * 0.8 - f.height) / 2, anchor: 'middle', fill: '#5b4a12'}));
  } else {
    parts.push(h('path', {d: `M${r(-w * 0.3)} ${r(hh * 0.05)}H${r(w * 0.3)}M${r(-w * 0.3)} ${r(hh * 0.24)}H${r(w * 0.15)}`, stroke: '#9c8526', 'stroke-width': r(5 * ts), 'stroke-linecap': 'round'}));
  }
  return parts;
}

/** Empty dashed socket (local origin = centre). */
export function socketArt(ctx, R) {
  const th = ctx.theme;
  return [
    h('circle', {r: r(R * 1.3), fill: 'rgba(255,255,255,0.65)', stroke: th.inkSoft, 'stroke-width': 2.6, 'stroke-dasharray': '6 5'}),
    h('circle', {r: r(R * 0.28), fill: th.inkSoft}),
  ];
}

/** Size of a sticky note that fits a matrix cell. */
export function noteSizeFor(G, wFrac = 0.84) {
  const ts = G.ts;
  if (G.banded) {
    const lane = Math.min(...G.pending.map(q => G.rows[q.row].laneH), G.rowH);
    return {w: Math.min(G.colW * wFrac, 170 * ts), h: Math.min(lane - 4 * ts, 104 * ts)};
  }
  return {w: Math.min(G.colW * wFrac, 170 * ts), h: Math.min(G.rowH * 0.78, 104 * ts)};
}

/**
 * Build the dynamic layer of a matrix: one thread + pin (+ held copy) +
 * column link + pinpoint flag per link, one socket (+ optional note) per
 * pending row.
 * @param {any} ctx
 * @param {{prefix:string, G:any, M:any, notes?:boolean, noteText?:string, flags?:boolean, heldLayer?:boolean, flagClear?:(l:any, k:number) => number}} o
 */
export function matrixLinks(ctx, o) {
  const th = ctx.theme;
  const {G, prefix: P} = o;
  const ts = G.ts;
  const R = G.R;
  const threads = [], pins = [], held = [], colLinks = [], flags = [], sockets = [], notes = [], heldNotes = [];
  const flagInfo = [];
  const flagFit = (text, l, lead = 0) => {
    // a flag may reach over the neighbouring (empty) cell; lanes keep flags of one row apart
    // (banded: the flag opens beside its pin and stops at the sheet's right edge)
    let maxW = Math.max(56, Math.min(G.colW * 1.45, 260 * ts));
    if (G.banded && l) maxW = Math.max(56, Math.min(maxW, G.sheet.x + G.sheet.w - 8 * ts - (l.cell.x + lead)));
    return ctx.fit(text, {maxWidth: maxW - 14 * ts, size: 23 * ts, minSize: 15, maxLines: 1, weight: 700});
  };
  G.links.forEach((l, k) => {
    const color = sourceColor(ctx, l.col);
    threads.push(h('line', {name: `${P}-th${k}`, stroke: shade(color, -0.12), 'stroke-width': r(4 * ts), 'stroke-linecap': 'round', opacity: 0}));
    colLinks.push(h('line', {name: `${P}-cl${k}`, x1: r(l.colTop.x), y1: r(l.colTop.y), x2: r(l.colTop.x), y2: r(l.colTop.y), stroke: color, 'stroke-width': r(4 * ts), 'stroke-linecap': 'round', opacity: 0}));
    pins.push(g({name: `${P}-pin${k}`, transform: T(l.park.x, l.park.y)},
      h('ellipse', {name: `${P}-pin${k}-sh`, rx: r(R * 1.02), ry: r(R * 0.82), fill: 'rgba(31,35,40,0.26)', transform: T(4 * ts, 6 * ts)}),
      g({name: `${P}-pin${k}-hd`}, pinHead(ctx, color, R))));
    if (o.heldLayer !== false) held.push(g({name: `${P}-hp${k}`, opacity: 0}, pinHead(ctx, color, R)));
    let flag = null;
    if (o.flags !== false && l.pinpoint && G.banded) {
      // banded matrix: the flag opens BESIDE the pin, inside its lane (never up into the card strip);
      // `flagClear` is then the horizontal distance kept from the pin (e.g. outside a ring)
      const lead = Math.max(R + 7 * ts, o.flagClear ? o.flagClear(l, k) || 0 : 0);
      const f = flagFit(l.pinpoint, l, lead);
      const fw = f.width + 14 * ts;
      const fh = f.size + 10 * ts;
      const fx = lead, fy = -fh / 2;
      flag = g({name: `${P}-fl${k}`, opacity: 0},
        h('path', {d: `M${r(R * 0.8)} 0H${r(fx + 2)}`, stroke: th.ink, 'stroke-width': 2}),
        g({name: `${P}-flb${k}`},
          h('path', {d: roundRectPath(fx, fy, fw, fh, 4), fill: '#ffffff', stroke: color, 'stroke-width': 2.2}),
          ctx.show('all')
            ? textBlock(f, {x: fx + fw / 2, y: fy + (fh - f.size) / 2, anchor: 'middle', fill: shade(color, -0.4)})
            : h('rect', {x: r(fx + 6), y: r(fy + fh * 0.4), width: r(fw - 12), height: r(fh * 0.2), rx: 2, fill: shade(color, 0.3)})));
      flagInfo[k] = {w: fw, h: fh, fit: f, local: {x: fx, y: fy, w: fw, h: fh, ox: fx, oy: 0}};
    } else if (o.flags !== false && l.pinpoint) {
      const f = flagFit(l.pinpoint, l);
      const fw = f.width + 14 * ts;
      const fh = f.size + 10 * ts;
      flagInfo[k] = {w: fw, h: fh, fit: f};
      // flag is drawn in pin-local coordinates: it rides on the pin; it opens to the left when it
      // would run past the right edge of the matrix sheet. `flagClear` keeps the flag's nearest
      // corner at least that far from the pin (e.g. outside a ring drawn around the cell)
      // (the flag rises straight up, so it keeps its usual side offset from the column lines)
      const clear = o.flagClear ? o.flagClear(l, k) || 0 : 0;
      const dx = R * 0.55, dy = Math.max(R * 0.55 + 6 * ts, clear);
      const flip = l.cell.x + dx + fw > G.sheet.x + G.sheet.w - 4;
      const fx = flip ? -dx - fw : dx, fy = -dy - fh;
      flag = g({name: `${P}-fl${k}`, opacity: 0},
        h('path', {d: `M${r(flip ? -R * 0.3 : R * 0.3)} ${r(-R * 0.3)}L${r(flip ? fx + fw - 4 : fx + 4)} ${r(fy + fh)}`, stroke: th.ink, 'stroke-width': 2}),
        g({name: `${P}-flb${k}`},
          h('path', {d: roundRectPath(fx, fy, fw, fh, 4), fill: '#ffffff', stroke: color, 'stroke-width': 2.2}),
          ctx.show('all')
            ? textBlock(f, {x: fx + fw / 2, y: fy + (fh - f.size) / 2, anchor: 'middle', fill: shade(color, -0.4)})
            : h('rect', {x: r(fx + 6), y: r(fy + fh * 0.4), width: r(fw - 12), height: r(fh * 0.2), rx: 2, fill: shade(color, 0.3)})));
      flagInfo[k].local = {x: fx, y: fy, w: fw, h: fh, ox: fx, oy: fy + fh};
    }
    flags.push(flag);
  });
  // (noteWFrac: a note with a long text may use more of its cell's width; noteText* size its words)
  const ns = noteSizeFor(G, o.noteWFrac);
  const nto = o.noteTextOpts || {};
  G.pending.forEach((p, q) => {
    sockets.push(g({name: `${P}-so${q}`, opacity: 0, transform: T(p.cell.x, p.cell.y)}, socketArt(ctx, R)));
    if (o.notes) {
      notes.push(g({name: `${P}-nt${q}`, opacity: 0}, stickyNoteArt(ctx, {w: ns.w, h: ns.h, text: o.noteText, ts, ...nto})));
      heldNotes.push(g({name: `${P}-hn${q}`, opacity: 0}, stickyNoteArt(ctx, {w: ns.w, h: ns.h, text: o.noteText, ts, shadow: false, ...nto})));
    }
  });

  /**
   * @param {{links: Array<{pos:{x:number,y:number}, lift?:number, held?:boolean, col?:number, flag?:number, from?:{x:number,y:number}, visible?:number, colTop?:{x:number,y:number}}>,
   *          sockets?: number[], notes?: Array<{pos:{x:number,y:number}, lift?:number, held?:boolean, visible?:number}>}} S
   */
  function pose(S) {
    const nodes = {};
    G.links.forEach((l, k) => {
      const st = S.links[k];
      const lift = st.lift ?? 0;
      const vis = st.visible ?? 1;
      const from = st.from || l.anchor;
      const len = Math.hypot(st.pos.x - from.x, st.pos.y - from.y);
      nodes[`${P}-th${k}`] = {x1: r(from.x), y1: r(from.y), x2: r(st.pos.x), y2: r(st.pos.y), opacity: len > 0.5 && vis > 0 ? r(vis, 3) : 0};
      nodes[`${P}-pin${k}`] = {transform: T(st.pos.x, st.pos.y), opacity: r(vis, 3)};
      nodes[`${P}-pin${k}-hd`] = {transform: lift ? `scale(${r(1 + 0.3 * lift, 4)})` : '', opacity: st.held ? 0 : 1};
      nodes[`${P}-pin${k}-sh`] = {transform: T(4 * ts + 14 * ts * lift, 6 * ts + 18 * ts * lift, 0, 1 + 0.25 * lift), opacity: r(1 - 0.35 * lift, 3)};
      if (o.heldLayer !== false) nodes[`${P}-hp${k}`] = {transform: T(st.pos.x, st.pos.y, 0, 1 + 0.3 * lift), opacity: st.held ? 1 : 0};
      const top = st.colTop || l.colTop;
      const cp = clamp(st.col ?? 0);
      const endY = st.pos.y - R * 1.05;
      nodes[`${P}-cl${k}`] = {x1: r(top.x), y1: r(top.y), x2: r(top.x), y2: r(lerp(top.y, Math.max(top.y, endY), cp)), opacity: cp > 0 ? 0.92 : 0};
      if (flags[k]) {
        const fp = clamp(st.flag ?? 0);
        const fi = flagInfo[k].local;
        nodes[`${P}-fl${k}`] = {opacity: fp > 0 ? r(Math.min(1, fp * 1.5), 3) : 0, transform: `${T(st.pos.x, st.pos.y)}${fp < 1 ? ` translate(${r(fi.ox)} ${r(fi.oy)}) scale(${r(0.35 + 0.65 * fp, 4)}) translate(${r(-fi.ox)} ${r(-fi.oy)})` : ''}`};
      }
    });
    G.pending.forEach((p, q) => {
      nodes[`${P}-so${q}`] = {opacity: r(clamp(S.sockets ? S.sockets[q] ?? 0 : 0), 3)};
      if (o.notes) {
        const n = (S.notes && S.notes[q]) || {pos: p.cell, visible: 0};
        const lift = n.lift ?? 0;
        nodes[`${P}-nt${q}`] = {transform: T(n.pos.x, n.pos.y, n.rot ?? 0, 1 + 0.08 * lift), opacity: n.held ? 0 : r(n.visible ?? 1, 3)};
        nodes[`${P}-hn${q}`] = {transform: T(n.pos.x, n.pos.y, n.rot ?? 0, 1 + 0.08 * lift), opacity: n.held ? 1 : 0};
      }
    });
    return nodes;
  }
  return {
    threads: g({name: `${P}-threads`}, threads),
    colLinks: g({name: `${P}-cols`}, colLinks),
    pins: g({name: `${P}-pins`}, pins),
    flags: g({name: `${P}-flags`}, flags),
    sockets: g({name: `${P}-sockets`}, sockets),
    notes: g({name: `${P}-notes`}, notes),
    held: g({name: `${P}-held`}, held, heldNotes),
    pose,
    R,
    flagInfo,
    noteSize: ns,
    // (the fit of the note text, so entries can report whether it shows whole)
    noteFit: o.notes && o.noteText && ctx.show('key') ? noteTextFit(ctx, {w: ns.w, h: ns.h, text: o.noteText, ts, ...nto}) : null,
    flagFit,
  };
}

/** Pad of sticky notes lying on a ledge (local origin = centre of the top note). */
export function notePad(ctx, {x, y, w, h: hh}) {
  const th = ctx.theme;
  return g({transform: T(x, y)},
    h('path', {d: roundRectPath(-w / 2 + 6, -hh / 2 + 9, w, hh, 4), fill: th.shadow}),
    h('path', {d: roundRectPath(-w / 2 + 5, -hh / 2 + 6, w, hh, 4), fill: shade(MAT.note, -0.12), stroke: shade(MAT.note, -0.45), 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(-w / 2 + 2.5, -hh / 2 + 3, w, hh, 4), fill: shade(MAT.note, -0.05), stroke: shade(MAT.note, -0.45), 'stroke-width': 1.6}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 4), fill: MAT.note, stroke: shade(MAT.note, -0.45), 'stroke-width': 2}),
    h('rect', {x: r(-w / 2 + 1), y: r(-hh / 2 + 1), width: r(w - 2), height: r(hh * 0.2), fill: shade(MAT.note, -0.08)}),
  );
}

/**
 * Static matrix (sheet, cards, source sheets, pending slot, search printout)
 * as separately transformable groups, so a mechanism can explode them.
 * @param {any} ctx
 * @param {{prefix:string, G:any, M:any, query:string, dropSources?:number[], dropVisible?:boolean, results?:boolean, pendingTint?:boolean}} o
 */
export function matrixStatic(ctx, o) {
  const {G, M, prefix: P} = o;
  const ts = G.ts;
  const drop = new Set(o.dropSources || []);
  const lanesOf = i => G.links.filter(l => l.row === i).map(l => l.anchor.y);
  const cards = G.rows.map(row => indexCard(ctx, {name: `${P}-card${row.i}`, box: row.card, n: row.i + 1, fit: row.fit, ts, laneYs: lanesOf(row.i), R: G.R, tabX: G.banded ? G.anchorX : null}));
  const heads = G.cols.map(c => {
    if (c.pending) return pendingSlot(ctx, {name: `${P}-head${c.j}`, box: c.head, fit: G.pendFit, ts});
    const color = sourceColor(ctx, c.j);
    const sheet = sourceSheet(ctx, {name: `${P}-head${c.j}`, box: c.head, color, id: M.sources[c.j].id, titleFit: c.titleFit, dateFit: c.dateFit, ts, bandH: G.bandH});
    if (!drop.has(c.j)) return sheet;
    // a source that is not (yet) supplied: an empty slot marked with the awaited id, plus the
    // sheet itself in its own group (entries fade/slide it in when the source is supplied)
    const slotFit = o.slotText === 'id'
      ? ctx.fit(M.sources[c.j].id, {maxWidth: c.head.w - 20 * ts, size: G.titleSize * 1.1, minSize: 13, maxLines: 1, weight: 800})
      : G.pendFit;
    return g({name: `${P}-headwrap${c.j}`},
      pendingSlot(ctx, {name: `${P}-slot${c.j}`, box: c.head, fit: slotFit, ts}),
      g({name: `${P}-drop${c.j}`, opacity: o.dropVisible ? 1 : 0}, sheet));
  });
  return {
    sheet: matrixSheet(ctx, {name: `${P}-sheet`, G, M, pendingTint: o.pendingTint}),
    cards: g({name: `${P}-cards`}, cards),
    heads: g({name: `${P}-heads`}, heads),
    // (a banded matrix has no corner: its entry pins the search printout elsewhere)
    corner: G.corner ? searchSlip(ctx, {name: `${P}-corner`, box: G.corner, query: o.query, sources: M.sources, ts, results: o.results}) : null,
  };
}

/* ------------------------------------------------------------------------ */
/* Researcher's arm (first-person, enters from the bottom of the room)       */
/* ------------------------------------------------------------------------ */

/**
 * First-person arm sized so that every target is inside its reach. The
 * shoulder is below the room window (off stage); the window clips the arm.
 * @param {any} ctx
 * @param {{name:string, look:{skin:string, outfit:string}, reach:number, handed?:'left'|'right'}} o
 */
export function researcherArm(ctx, o) {
  const width = clamp(o.reach / 11, 46, 74);
  const HS = 1.25;
  const hand = 24 * HS * (width / 46);
  const len = o.reach - hand;
  return topArm(ctx, {name: o.name, skin: o.look.skin, sleeve: o.look.outfit, cuff: '#f4f1ea', handed: o.handed ?? 'left', upper: len * 0.52, lower: len * 0.48, width, handScale: HS});
}

/* ------------------------------------------------------------------------ */
/* Geometry helpers                                                          */
/* ------------------------------------------------------------------------ */

/** Union bounds of boxes. */
export function unionBox(boxes) {
  const bs = boxes.filter(Boolean);
  const x = Math.min(...bs.map(b => b.x)), y = Math.min(...bs.map(b => b.y));
  return {x, y, w: Math.max(...bs.map(b => b.x + b.w)) - x, h: Math.max(...bs.map(b => b.y + b.h)) - y};
}

/** Axis-aligned overlap test with padding. */
export function boxesOverlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/**
 * Pack chips into horizontal rows between x0 and x1: each item goes to the
 * first row where a free slot exists near its preferred centre; otherwise a
 * new row is opened. Returns rows of {x, w, h, it}.
 * @param {Array<{w:number,h:number,prefX:number}>} items
 * @param {{x0:number, x1:number, gap:number}} o
 */
export function packBand(items, o) {
  const rows = [];
  for (const it of items) {
    const w = Math.min(it.w, o.x1 - o.x0);
    let done = false;
    for (const row of rows) {
      const x = freeSlot(row, w, it.prefX, o);
      if (x !== null) { row.push({x, w, h: it.h, it}); done = true; break; }
    }
    if (!done) rows.push([{x: clamp(it.prefX - w / 2, o.x0, o.x1 - w), w, h: it.h, it}]);
  }
  return rows;
}

function freeSlot(row, w, prefX, o) {
  const cands = [clamp(prefX - w / 2, o.x0, o.x1 - w)];
  for (const q of row) cands.push(q.x + q.w + o.gap, q.x - o.gap - w);
  const ok = x => x >= o.x0 - 0.01 && x + w <= o.x1 + 0.01 && row.every(q => x + w + o.gap <= q.x + 0.01 || x >= q.x + q.w + o.gap - 0.01);
  const good = cands.filter(ok).sort((a, b) => Math.abs(a + w / 2 - prefX) - Math.abs(b + w / 2 - prefX));
  return good.length ? good[0] : null;
}

/**
 * Place a box of size {w,h} next to `box` in the first free slot among the
 * given sides (below, above, right, left, and corner variants), clear of
 * every obstacle (padded) and inside bounds. Returns {x, y, side} or null.
 * @param {{x:number,y:number,w:number,h:number}} box
 * @param {{w:number,h:number}} size
 * @param {{obstacles:Array<any>, bounds:{x:number,y:number,w:number,h:number}, order?:string[], gap?:number, pad?:number, shifts?:number[]}} o
 */
export function placeBeside(box, size, o) {
  const gap = o.gap ?? 12;
  const pad = o.pad ?? 6;
  const B = o.bounds;
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const at = {
    below: s => ({x: cx - size.w / 2 + s, y: box.y + box.h + gap}),
    above: s => ({x: cx - size.w / 2 + s, y: box.y - gap - size.h}),
    right: s => ({x: box.x + box.w + gap, y: cy - size.h / 2 + s}),
    left: s => ({x: box.x - gap - size.w, y: cy - size.h / 2 + s}),
    belowLeft: s => ({x: box.x + s, y: box.y + box.h + gap}),
    belowRight: s => ({x: box.x + box.w - size.w - s, y: box.y + box.h + gap}),
    aboveLeft: s => ({x: box.x + s, y: box.y - gap - size.h}),
    aboveRight: s => ({x: box.x + box.w - size.w - s, y: box.y - gap - size.h}),
    // above / below, starting just right (east) or ending just left (west) of the box's centre line
    aboveEast: s => ({x: cx + gap + 12 + Math.abs(s), y: box.y - gap - size.h}),
    belowEast: s => ({x: cx + gap + 12 + Math.abs(s), y: box.y + box.h + gap}),
    aboveWest: s => ({x: cx - gap - 12 - size.w - Math.abs(s), y: box.y - gap - size.h}),
  };
  const shifts = o.shifts ?? [0, 30, -30, 70, -70, 120, -120];
  for (const side of o.order ?? ['below', 'above', 'right', 'left']) {
    for (const sh of shifts) {
      const q = at[side](sh);
      const cand = {x: q.x, y: q.y, w: size.w, h: size.h};
      const inside = !B || (cand.x >= B.x && cand.y >= B.y && cand.x + cand.w <= B.x + B.w && cand.y + cand.h <= B.y + B.h);
      if (!inside) continue;
      if ((o.obstacles || []).some(ob => ob && boxesOverlap(cand, ob, pad))) continue;
      return {x: cand.x, y: cand.y, side};
    }
  }
  return null;
}

/** Thin boxes along a polyline (for label obstacles), every `step` units. */
export function lineBoxes(pts, thick = 10, step = 24) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k <= n; k++) {
      const x = a.x + ((b.x - a.x) * k) / n, y = a.y + ((b.y - a.y) * k) / n;
      out.push({x: x - thick / 2, y: y - thick / 2, w: thick, h: thick});
    }
  }
  return out;
}

/** Linear point interpolation. */
export const mixPt = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});

/** Point on a quadratic arc from a to b lifted by `lift` (perpendicular, towards the viewer's up). */
export function arcPt(a, b, t, lift) {
  const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - lift};
  const u = 1 - t;
  return {x: u * u * a.x + 2 * u * t * m.x + t * t * b.x, y: u * u * a.y + 2 * u * t * m.y + t * t * b.y};
}
