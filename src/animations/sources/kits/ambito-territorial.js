/**
 * "Ámbito territorial" kit (LAW-0141..0144): a table seen from above with a
 * board of neutral hexagonal tiles grouped into abstract zones, the books of
 * the editable hierarchy, the article slip, numbered fact tokens and a
 * magnifier.
 *
 * Spatial logic (original vector art, no real place, map, flag or border):
 *  - the ZONE BOARD is a framed tray of hexagonal tiles; each fictional zone
 *    is a group of tiles in one neutral tint (sand / sage / slate, each with
 *    its own tile mark so the zones read in mono too) with a name plaque on
 *    the frame band next to it. Boundaries run along tile edges;
 *  - the EDITABLE HIERARCHY is a wooden organiser whose compartments carry
 *    the user-supplied level plates; each book lies in the compartment the
 *    author supplied (display only: no rule, rank or outcome);
 *  - the BOOK (Text 1, closed, cover label with title and note) holds the
 *    ARTICLE SLIP, which sticks out of its top edge. The slip names the zone
 *    where the author places the text; laid on that zone, a translucent
 *    amber sheet spreads from under it over exactly that zone's tiles (the
 *    place of the text, as supplied);
 *  - FACTS are numbered pawns in a dish; each is set on a tile of the zone
 *    supplied for it and its tag slides out from under it. A solid amber ring
 *    marks a fact placed in the same zone as the text, a dashed grey ring one
 *    placed in another zone (a comparison of supplied placements only);
 *  - the LUPA (magnifier) enlarges a token and the boundary next to it.
 * Zone matching is a verbatim (case-insensitive) comparison of supplied
 * strings. Nothing states that a text applies in a territory or that a fact
 * falls under a text; every state is "as supplied" and no conclusion is drawn.
 *
 * The kit owns fields, defaults, strings, geometry, art, a board stage and its
 * pose solver; each entry owns its own timeline, composition and semantics.
 * @module animations/sources/kits/ambito-territorial
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, lerp, r} from '../../../core/time.js';
import {roundRectPath, catmullRom, polyline} from '../../../core/geometry.js';
import {textBlock, callout} from '../../../primitives/annotate.js';
import {shade} from '../../../primitives/paper.js';
import {topArm, deskWindow} from '../../../primitives/desk.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, list, obj, int} from '../../../schemas/fields.js';
import {fitWords, brokeWord, lupaArt, lupaPoint, exitDistance, unit, pickSpot} from './ambito-material.js';

export {fitWords, brokeWord, lupaPoint, pickSpot};

/* ------------------------------------------------------------------ */
/* Fields                                                              */
/* ------------------------------------------------------------------ */

/** Category + motif fields shared by the four entries. */
export const territorialFields = {
  sources: list('Fictional source texts drawn as closed books in the hierarchy organiser: [0] holds the article slip (the anchor); [1] (optional) is a second text', obj('Source text (fictional placeholder)', {
    title: str('Title printed on the cover label, e.g. "Text 1 (fictional)"', 60),
    note: str('Short descriptive line printed under the title (e.g. "simulated wording")', 40),
  }, ['title']), 1, 2),
  hierarchy: obj('Editable hierarchy: user-supplied level labels on the compartments of the organiser holding the books. Display only: the order states no rule, priority or outcome', {
    levels: list('Compartment labels, first level first (user-supplied)', str('Level label', 40), 1, 2),
    placement: list('Compartment index (0 = first level) of each source, in source order (user-supplied)', int('Level index', 0, 1), 1, 2),
  }, ['levels', 'placement']),
  passages: list('The article slip kept in Text 1: reference, heading and the zone where the author places the text (compared verbatim, case-insensitive, with the zone names)', obj('Passage (simulated)', {
    ref: str('Reference printed on the slip, e.g. "Text 1 · Art. 4 (fictional)"', 50),
    heading: str('Heading of the article (simulated wording)', 60),
    zone: str('Zone where the text is placed, as supplied (it is laid on the board only when it matches a zone name)', 50),
  }, ['ref', 'heading', 'zone']), 1, 1),
  interpretations: list('Reading attributed to a fictional source, pinned as a note; never applied and never endorsed', obj('Attributed reading', {
    by: str('Fictional source of the reading', 40),
    text: str('The reading as proposed (descriptive)', 90),
  }, ['by', 'text']), 0, 1),
  zones: list('Neutral abstract zones of the board (fictional names; no real place, map or border)', obj('Zone (fictional)', {
    name: str('Zone name printed on its plaque', 50),
  }, ['name']), 2, 3),
  facts: list('Facts drawn as numbered tokens, each placed in the zone supplied for it (compared verbatim, case-insensitive, with the zone names)', obj('Fact (fictional)', {
    label: str('Fact label printed on the token tag', 40),
    zone: str('Zone where the fact is placed, as supplied', 50),
  }, ['label', 'zone']), 1, 3),
};

/** Built-in strings of this kit. */
export const KIT_STRINGS = {
  en: {
    reader: 'Reader', board: 'Zone board', tray: 'Facts (fictional)', key: 'Key',
    keyText: 'Where the text is placed', keyShared: 'Fact in the same zone as the text', keyOther: 'Fact in another zone',
    keyNote: 'As supplied · no conclusion drawn', placedOn: 'Placed on', offBoard: 'No zone on the board matches',
    reading: 'Reading proposed', attributed: 'attributed · not applied',
    shared: 'Same zone as the text', other: 'Another zone than the text', asSupplied: 'as supplied',
  },
  es: {
    reader: 'Lectora', board: 'Tablero de zonas', tray: 'Hechos (ficticios)', key: 'Clave',
    keyText: 'Dónde se sitúa el texto', keyShared: 'Hecho en la misma zona que el texto', keyOther: 'Hecho en otra zona',
    keyNote: 'Según lo aportado · sin conclusión', placedOn: 'Situado en', offBoard: 'Ninguna zona del tablero coincide',
    reading: 'Lectura propuesta', attributed: 'atribuida · no aplicada',
    shared: 'Misma zona que el texto', other: 'Otra zona que el texto', asSupplied: 'según lo aportado',
  },
};

/** Kit strings for a locale. */
export const kitStrings = locale => ({...KIT_STRINGS.en, ...(KIT_STRINGS[locale] || {})});

/** Fictional, illustrative default content (English). */
export const CONTENT_EN = {
  sources: [{title: 'Text 1 (fictional)', note: 'Simulated wording'}, {title: 'Text 2 (fictional)', note: 'Simulated wording'}],
  hierarchy: {levels: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)'], placement: [0, 1]},
  passages: [{ref: 'Text 1 · Art. 4 (fictional)', heading: 'Territorial scope (simulated)', zone: 'Zone Alder (fictional)'}],
  interpretations: [],
  zones: [{name: 'Zone Alder (fictional)'}, {name: 'Zone Birch (fictional)'}],
  facts: [
    {label: 'Delivery of a parcel', zone: 'Zone Alder (fictional)'},
    {label: 'Meeting of two parties', zone: 'Zone Birch (fictional)'},
    {label: 'Sale of a bicycle', zone: 'Zone Alder (fictional)'},
  ],
};

/** Spanish default content (fictional, same structure). */
export const CONTENT_ES = {
  sources: [{title: 'Texto 1 (ficticio)', note: 'Redacción simulada'}, {title: 'Texto 2 (ficticio)', note: 'Redacción simulada'}],
  hierarchy: {levels: ['Nivel 1 (aportado)', 'Nivel 2 (aportado)'], placement: [0, 1]},
  passages: [{ref: 'Texto 1 · Art. 4 (ficticio)', heading: 'Ámbito territorial (simulado)', zone: 'Zona Aliso (ficticia)'}],
  interpretations: [],
  zones: [{name: 'Zona Aliso (ficticia)'}, {name: 'Zona Abedul (ficticia)'}],
  facts: [
    {label: 'Entrega de un paquete', zone: 'Zona Aliso (ficticia)'},
    {label: 'Reunión de dos partes', zone: 'Zona Abedul (ficticia)'},
    {label: 'Venta de una bicicleta', zone: 'Zona Aliso (ficticia)'},
  ],
};

/** Long-label stress content (fictional; every string at least as long as the baseline, near the field maxima). */
export const CONTENT_LONG = {
  sources: [{title: 'Consolidated Illustrative Text Number One (fictional)', note: 'Simulated wording for teaching use'}, {title: 'Supplementary Illustrative Text Two (fictional)', note: 'Simulated wording for teaching'}],
  hierarchy: {levels: ['First level as supplied by the author', 'Second level as supplied by the author'], placement: [0, 1]},
  passages: [{ref: 'Consolidated Text 1 · Article 4 (fictional)', heading: 'Territorial scope of the text (simulated wording)', zone: 'Alder coastal district zone (fictional)'}],
  interpretations: [],
  zones: [{name: 'Alder coastal district zone (fictional)'}, {name: 'Birch inland district zone (fictional)'}, {name: 'Cedar river valley zone (fictional)'}],
  facts: [
    {label: 'Delivery of a parcel to a workshop', zone: 'Alder coastal district zone (fictional)'},
    {label: 'Meeting of two parties at a market', zone: 'Birch inland district zone (fictional)'},
    {label: 'Sale of a second-hand bicycle', zone: 'Cedar river valley zone (fictional)'},
  ],
};

/* ------------------------------------------------------------------ */
/* Resolution of the supplied placements                               */
/* ------------------------------------------------------------------ */

const norm = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Resolve where the text and every fact are placed, as supplied.
 * `overrides[i]` replaces the zone supplied for fact i (inspect / contrast).
 * rel: 'shared' (same zone as the text), 'different' (another zone) or
 * 'off' (no zone of the board matches the supplied string).
 * @param {any} p params
 * @param {Record<number,string>} [overrides]
 */
export function resolvePlacement(p, overrides = {}) {
  const zones = p.zones.map((z, j) => ({j, name: z.name, key: norm(z.name)}));
  const zoneOf = s => {
    const k = norm(s);
    return k ? zones.findIndex(z => z.key === k) : -1;
  };
  const passage = p.passages[0];
  const textZone = zoneOf(passage.zone);
  const relOf = z => (z < 0 ? 'off' : z === textZone ? 'shared' : 'different');
  const facts = p.facts.map((f, i) => {
    const zt = overrides[i] !== undefined ? overrides[i] : f.zone;
    const z = zoneOf(zt);
    return {i, num: i + 1, label: f.label, zoneText: zt, zone: z, rel: relOf(z)};
  });
  return {zones, passage, textZone, facts, zoneOf, relOf};
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

/** Neutral zone tints (never a verdict colour); each zone also has its own tile mark. */
export const ZONE_FILL = ['#eadfc4', '#d3e0cc', '#d3dbe8'];
export const ZONE_EDGE = ['#b39f74', '#88a07f', '#8494ae'];
/** Neutral grey of the "another zone" ring. */
export const NEUTRAL = '#737b86';
/** Colour of the text's translucent sheet (a highlighter tone). */
export const sheetColor = ctx => ctx.theme.accent3;
/** Darker tone of the sheet used for its outline and for the "same zone" ring. */
export const sheetDark = ctx => shade(ctx.theme.accent3, -0.42);
export const PAWN = ['#2f6690', '#7a5c8e', '#4f7c7a'];

/* ------------------------------------------------------------------ */
/* Hexagonal zone board: geometry                                      */
/* ------------------------------------------------------------------ */

const SQ3 = Math.sqrt(3);

/**
 * Zone of a normalized point for a partition (2 or 3 zones, split along x
 * or y). `a` is the first split (zone 0's share), `b` splits the rest between
 * zones 1 and 2; each split has a small jog so the boundary is not straight.
 */
function partition(axis, n, u, v, a = 0.5, b = 0.5, strips = false) {
  // strips (opt-in, three zones): three side-by-side strips across the long axis, split at a and b
  if (strips && n === 3) {
    const w = axis === 'x' ? u : v, t = axis === 'x' ? v : u;
    if (w < (t < 0.5 ? a - 0.03 : a + 0.03)) return 0;
    return w < (t < 0.5 ? b + 0.03 : b - 0.03) ? 1 : 2;
  }
  if (axis === 'x') {
    if (n === 2) return u < (v < 0.45 ? a - 0.05 : a + 0.05) ? 0 : 1;
    if (u < (v < 0.5 ? a - 0.03 : a + 0.03)) return 0;
    return v < (u < a + (1 - a) * 0.6 ? b - 0.04 : b + 0.04) ? 1 : 2;
  }
  if (n === 2) return v < (u < 0.5 ? a - 0.05 : a + 0.05) ? 0 : 1;
  if (v < (u < 0.5 ? a - 0.03 : a + 0.03)) return 0;
  return u < (v < a + (1 - a) * 0.6 ? b - 0.04 : b + 0.04) ? 1 : 2;
}

/** Frame band that carries each zone's plaque. */
function plaqueBands(axis, n) {
  if (axis === 'x') return n === 2 ? ['top', 'top'] : ['top', 'top', 'bottom'];
  return n === 2 ? ['top', 'bottom'] : ['top', 'bottom', 'bottom'];
}

/** Six vertices of a pointy-top hexagon. */
export function hexVerts(cx, cy, R) {
  return Array.from({length: 6}, (_, k) => {
    const a = ((-90 + 60 * k) * Math.PI) / 180;
    return {x: cx + R * Math.cos(a), y: cy + R * Math.sin(a)};
  });
}
const hexD = (cx, cy, R) => hexVerts(cx, cy, R).map((q, k) => `${k ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('') + 'Z';

/**
 * Tile geometry of a board rect. Inner area = rect minus the frame (side
 * frames `side`, plaque bands `bandTop` / `bandBottom`).
 * @param {{x:number,y:number,w:number,h:number,R:number,n:number,axis:'x'|'y',side?:number,bandTop:number,bandBottom:number}} o
 */
export function boardGeometry(o) {
  const side = o.side ?? 18;
  const inner = {x: o.x + side, y: o.y + o.bandTop, w: o.w - 2 * side, h: o.h - o.bandTop - o.bandBottom};
  const R = o.R;
  const cw = SQ3 * R, rh = 1.5 * R;
  const tiles = [];
  const rows = Math.ceil(inner.h / rh) + 2, cols = Math.ceil(inner.w / cw) + 2;
  // centre the tile lattice on the inner area
  const x0 = inner.x + (inner.w - (Math.floor(inner.w / cw)) * cw) / 2;
  const y0 = inner.y + (inner.h - Math.floor(inner.h / rh) * rh) / 2;
  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = x0 + col * cw + (row & 1 ? cw / 2 : 0);
      const cy = y0 + row * rh;
      if (cx < inner.x - cw * 0.55 || cx > inner.x + inner.w + cw * 0.55 || cy < inner.y - R * 1.05 || cy > inner.y + inner.h + R * 1.05) continue;
      const u = clamp((cx - inner.x) / inner.w), v = clamp((cy - inner.y) / inner.h);
      tiles.push({i: tiles.length, row, col, cx, cy, z: partition(o.axis, o.n, u, v, o.split ? o.split[0] : 0.5, o.split ? o.split[1] : 0.5, Boolean(o.strips))});
    }
  }
  // shared edges (vertex keys) → boundary edges between zones
  const key = q => `${Math.round(q.x * 4)},${Math.round(q.y * 4)}`;
  const edges = new Map();
  for (const t of tiles) {
    const vs = hexVerts(t.cx, t.cy, R);
    for (let k = 0; k < 6; k++) {
      const a = vs[k], b = vs[(k + 1) % 6];
      const ek = [key(a), key(b)].sort().join('|');
      if (!edges.has(ek)) edges.set(ek, {a, b, tiles: []});
      edges.get(ek).tiles.push(t);
    }
  }
  const boundary = [];
  for (const e of edges.values()) {
    if (e.tiles.length === 2 && e.tiles[0].z !== e.tiles[1].z) boundary.push({a: e.a, b: e.b, zs: [e.tiles[0].z, e.tiles[1].z]});
  }
  const inside = t => t.cx >= inner.x && t.cx <= inner.x + inner.w && t.cy >= inner.y && t.cy <= inner.y + inner.h;
  const zones = Array.from({length: o.n}, (_, j) => {
    const ts = tiles.filter(t => t.z === j);
    const vis = ts.filter(inside);
    const cx = vis.reduce((s, t) => s + t.cx, 0) / Math.max(1, vis.length);
    const cy = vis.reduce((s, t) => s + t.cy, 0) / Math.max(1, vis.length);
    return {j, tiles: ts, centroid: {x: cx, y: cy}};
  });
  // (strips: every zone meets the top edge, so all plaques sit in the top band)
  // (stripsAlt: the middle plaque moves to the bottom band when three plaques do not fit side by side)
  const bands = o.strips && o.n === 3 ? (o.stripsAlt ? ['top', 'bottom', 'top'] : ['top', 'top', 'top']) : plaqueBands(o.axis, o.n);
  // plaque x-range: the zone's tiles in the row next to its band
  const plaqueRange = zones.map((zn, j) => {
    const band = bands[j];
    const edgeTiles = zn.tiles.filter(t => (band === 'top' ? t.cy < inner.y + R * 0.9 : t.cy > inner.y + inner.h - R * 0.9) && t.cx > inner.x - cw * 0.3 && t.cx < inner.x + inner.w + cw * 0.3);
    const list0 = edgeTiles.length ? edgeTiles : zn.tiles;
    const x0r = Math.max(inner.x, Math.min(...list0.map(t => t.cx - cw / 2)));
    const x1r = Math.min(inner.x + inner.w, Math.max(...list0.map(t => t.cx + cw / 2)));
    return {band, x0: x0r, x1: x1r};
  });
  // strips: the middle zone's plaque is alone on the bottom band and may use its whole width
  if (o.strips && o.stripsAlt && o.n === 3) { plaqueRange[1].x0 = inner.x; plaqueRange[1].x1 = inner.x + inner.w; }
  // two zones on the same band never share plaque room (a jagged edge row can interleave their tiles)
  for (const band of ['top', 'bottom']) {
    const on = plaqueRange.filter(q => q.band === band).sort((a, b) => (a.x0 + a.x1) - (b.x0 + b.x1));
    for (let k = 1; k < on.length; k++) {
      const a = on[k - 1], b = on[k];
      if (a.x1 > b.x0 - 8) {
        const mid = (a.x1 + b.x0) / 2;
        a.x1 = mid - 4;
        b.x0 = mid + 4;
      }
    }
  }
  /** Zone index at a point (nearest tile centre), through a raster lookup built once. */
  const nearest = (x, y) => {
    let best = null, bd = Infinity;
    for (const t of tiles) {
      const d = (t.cx - x) ** 2 + (t.cy - y) ** 2;
      if (d < bd) { bd = d; best = t; }
    }
    return best ? best.z : -1;
  };
  const CELL = 6;
  const gx0 = inner.x - R, gy0 = inner.y - R;
  const gw = Math.ceil((inner.w + 2 * R) / CELL), gh = Math.ceil((inner.h + 2 * R) / CELL);
  const grid = new Int8Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) grid[j * gw + i] = nearest(gx0 + (i + 0.5) * CELL, gy0 + (j + 0.5) * CELL);
  const zoneAt = (x, y) => {
    const i = Math.floor((x - gx0) / CELL), j = Math.floor((y - gy0) / CELL);
    if (i < 0 || j < 0 || i >= gw || j >= gh) return nearest(x, y);
    return grid[j * gw + i];
  };
  /** Fraction of an n×n sample grid of a box lying in zone z. */
  const coverage = (b, z, n = 5) => {
    let k = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (zoneAt(b.x + (b.w * (i + 0.5)) / n, b.y + (b.h * (j + 0.5)) / n) === z) k++;
    return k / (n * n);
  };
  /** Distance from a point to the nearest boundary edge. */
  const boundaryDist = q => {
    let best = Infinity;
    for (const e of boundary) best = Math.min(best, segDist(q, e.a, e.b));
    return best;
  };
  return {...o, side, inner, R, cw, rh, tiles, boundary, zones, bands, plaqueRange, zoneAt, coverage, boundaryDist};
}

function segDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L2 = dx * dx + dy * dy || 1;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / L2);
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}

/** Path data of all tiles of zone z (one path, one subpath per tile). */
export function zoneTilesPath(B, z, inset = 0) {
  return B.tiles.filter(t => t.z === z).map(t => hexD(t.cx, t.cy, B.R - inset)).join('');
}

/** Path data of the boundary edges (optionally only those touching zone z). */
export function boundaryPath(B, z = null) {
  return B.boundary.filter(e => z === null || e.zs.includes(z)).map(e => `M${r(e.a.x)} ${r(e.a.y)}L${r(e.b.x)} ${r(e.b.y)}`).join('');
}

/* ------------------------------------------------------------------ */
/* Board art                                                           */
/* ------------------------------------------------------------------ */

/** Small mark drawn on every tile of a zone (none / dot / ring) so zones read without colour. */
export function tileMarks(B, z) {
  const k = B.R * 0.16;
  if (z === 0) return '';
  return B.tiles.filter(t => t.z === z).map(t => (z === 1
    ? `M${r(t.cx - k)} ${r(t.cy)}a${r(k)} ${r(k)} 0 1 0 ${r(2 * k)} 0a${r(k)} ${r(k)} 0 1 0 ${r(-2 * k)} 0Z`
    // third zone: a small hollow diamond (neutral; never a × that could read as "excluded")
    : `M${r(t.cx)} ${r(t.cy - k * 1.2)}L${r(t.cx + k * 1.2)} ${r(t.cy)}L${r(t.cx)} ${r(t.cy + k * 1.2)}L${r(t.cx - k * 1.2)} ${r(t.cy)}Z`)).join('');
}

/** Plaque text layout for a zone (fits two lines, shrinking to 16 before a third line). */
export function plaqueFit(ctx, name, width, fs = 1) {
  // two lines at >= 19.5 px, then three, and only then smaller (never below 16 px)
  const o = {maxWidth: width - 58, size: 22 * fs, minSize: Math.min(19.5, 22 * fs), maxLines: 2, weight: 700};
  const ok = f => !f.truncated && !brokeWord(f);
  for (const v of [{}, {maxLines: 3}, {minSize: 16, maxLines: 3}, {minSize: 16, maxLines: 4}]) {
    const f = fitWords(ctx, name, {...o, ...v});
    if (ok(f) || v.maxLines === 4) return f;
  }
  return fitWords(ctx, name, o);
}

/** Required band height for the plaques of a board (given the plaque widths). */
export function bandHeightFor(ctx, names, widths, fs = 1) {
  if (!ctx.show('key')) return 58;
  const hs = names.map((nm, j) => plaqueFit(ctx, nm, widths[j], fs).height);
  return Math.max(58, ...hs.map(v => v + 26));
}

/**
 * Build the board geometry with plaque bands sized for the zone names.
 * @param {any} ctx
 * @param {{x:number,y:number,w:number,h:number,R:number,axis?:'x'|'y'}} rect
 * @param {string[]} names zone names
 * @param {number} [fs]
 */
export function makeBoard(ctx, rect, names, fs = 1, demand = null) {
  const n = names.length;
  const axis = rect.axis || (rect.w >= rect.h * 0.95 ? 'x' : 'y');
  // zones share the board in proportion to what is placed in them (bounded), so no zone is crowded
  let split = [0.5, 0.5];
  if (demand) {
    const base = (rect.w * rect.h) / (n * 5);
    const d = names.map((_, j) => base + (demand[j] || 0));
    const sum = d.reduce((x, y) => x + y, 0);
    const [lo, hi] = rect.splitRange || [0.38, 0.62];
    split = n === 2 ? [clamp(d[0] / sum, lo, hi), 0.5] : [clamp(d[0] / sum, lo - 0.06, hi - 0.02), clamp(d[1] / (d[1] + d[2]), 0.32, 0.68)];
    if (rect.strips && n === 3) {
      // strips: every zone keeps at least a quarter of the long axis
      const f = d.map(q => q / sum);
      const a0 = clamp(f[0], 0.24, 0.52);
      split = [a0, clamp(a0 + f[1] * (1 - a0) / Math.max(1e-6, f[1] + f[2]), a0 + 0.24, 0.76)];
    }
  }
  // rect.bands = [top, bottom]: fixed thin bands (a board drawn without plaques)
  if (rect.bands) return boardGeometry({...rect, n, axis, bandTop: rect.bands[0], bandBottom: rect.bands[1], split});
  let bt = 70, bb = 70;
  let B = null;
  // strips: all plaques on the top band unless one of them would not fit its strip whole
  let stripsAlt = false;
  if (rect.strips && n === 3 && ctx.show('key')) {
    const B0 = boardGeometry({...rect, n, axis, bandTop: bt, bandBottom: bb, split});
    stripsAlt = B0.plaqueRange.some((pr, j) => { const f = plaqueFit(ctx, names[j], Math.max(90, pr.x1 - pr.x0 - 16), fs); return f.truncated || brokeWord(f); });
  }
  for (let it = 0; it < 3; it++) {
    B = boardGeometry({...rect, n, axis, bandTop: bt, bandBottom: bb, split, stripsAlt});
    const widths = B.plaqueRange.map(pr => pr.x1 - pr.x0 - 16);
    const need = bandHeightFor(ctx, names, widths, fs);
    const hasBottom = B.bands.includes('bottom');
    const nt = need, nb = hasBottom ? need : 22;
    if (nt === bt && nb === bb) break;
    bt = nt;
    bb = nb;
  }
  return B;
}

/**
 * Board art. Nodes: `${P}-frame`, tiles, `${P}-ov` (the text's translucent
 * sheet, clipped by a growing circle `${P}-ovc`), the boundary and plaques.
 * With `staticSheet` the sheet is drawn fully spread (used for copies).
 * @param {any} ctx
 * @param {any} B board geometry
 * @param {{prefix:string, names:string[], textZone:number, spreadFrom?:{x:number,y:number}, staticSheet?:boolean, noText?:boolean, fs?:number, plaques?:boolean}} o
 */
export function boardArt(ctx, B, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const showText = !o.noText && ctx.show('key');
  const {x, y, w, h: hh, inner} = B;
  const clipId = `${P}-inner`;
  const parts = [];
  // frame (wood) + inner well
  parts.push(h('path', {d: roundRectPath(x + 6, y + 9, w, hh, 18), fill: th.shadow}));
  const frameC = shade(th.wood, -0.2);
  parts.push(h('path', {d: roundRectPath(x, y, w, hh, 18), fill: frameC, stroke: th.ink, 'stroke-width': 2.6}));
  parts.push(h('path', {d: roundRectPath(x + 5, y + 5, w - 10, hh - 10, 14), fill: 'none', stroke: shade(frameC, 0.2), 'stroke-width': 3, opacity: 0.8}));
  parts.push(h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('path', {d: roundRectPath(inner.x, inner.y, inner.w, inner.h, 8)}))));
  const tiles = [];
  for (let z = 0; z < B.n; z++) {
    tiles.push(h('path', {d: zoneTilesPath(B, z), fill: ZONE_FILL[z % 3], stroke: ZONE_EDGE[z % 3], 'stroke-width': 1.6, 'stroke-linejoin': 'round'}));
    const mk = tileMarks(B, z);
    if (mk) tiles.push(h('path', {d: mk, fill: z === 1 ? ZONE_EDGE[1] : 'none', stroke: ZONE_EDGE[z % 3], 'stroke-width': 2, opacity: 0.8}));
  }
  // the text's sheet: tiles of its zone, translucent amber + hatch, outline in the darker tone
  let sheet = null;
  if (o.textZone >= 0) {
    const hatchId = `${P}-hatch`;
    const spreadId = `${P}-spread`;
    const sc = sheetColor(ctx);
    const far = Math.max(...B.zones[o.textZone].tiles.map(t => Math.hypot(t.cx - (o.spreadFrom ? o.spreadFrom.x : t.cx), t.cy - (o.spreadFrom ? o.spreadFrom.y : t.cy)))) + B.R * 1.2;
    sheet = g({name: `${P}-ov`, opacity: o.staticSheet ? 1 : 0},
      h('defs', null,
        h('pattern', {id: ctx.id(hatchId), patternUnits: 'userSpaceOnUse', width: 16, height: 16, patternTransform: 'rotate(35)'},
          h('rect', {x: 0, y: 0, width: 6, height: 16, fill: sheetDark(ctx), opacity: 0.55})),
        o.staticSheet ? null : h('clipPath', {id: ctx.id(spreadId)}, h('circle', {name: `${P}-ovc`, cx: r(o.spreadFrom.x), cy: r(o.spreadFrom.y), r: 0}))),
      g({'clip-path': o.staticSheet ? null : ctx.ref(spreadId)},
        g({opacity: 0.5}, h('path', {d: zoneTilesPath(B, o.textZone), fill: sc, stroke: sc, 'stroke-width': 1.2})),
        h('path', {d: zoneTilesPath(B, o.textZone), fill: ctx.ref(hatchId), opacity: 0.45}),
        h('path', {d: boundaryPath(B, o.textZone), fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.85})));
    sheet.far = far;
  }
  const well = g({'clip-path': ctx.ref(clipId)},
    h('rect', {x: inner.x, y: inner.y, width: inner.w, height: inner.h, fill: ZONE_FILL[0]}),
    tiles,
    sheet,
    h('path', {d: boundaryPath(B), fill: 'none', stroke: th.ink, 'stroke-width': 4, 'stroke-linecap': 'round'}));
  parts.push(well);
  parts.push(h('path', {d: roundRectPath(inner.x, inner.y, inner.w, inner.h, 8), fill: 'none', stroke: th.ink, 'stroke-width': 2.2}));
  // plaques
  const plaques = [];
  if (o.plaques !== false) {
    B.plaqueRange.forEach((pr, j) => {
      const pw = Math.max(90, pr.x1 - pr.x0 - 16);
      const band = pr.band;
      const bandY0 = band === 'top' ? y : inner.y + inner.h;
      const bandH = band === 'top' ? B.bandTop : B.bandBottom;
      let fit = null;
      let ph = 40;
      if (showText) {
        fit = plaqueFit(ctx, o.names[j], pw, o.fs ?? 1);
        ph = fit.height + 16;
      }
      const cx = (pr.x0 + pr.x1) / 2;
      const w2 = showText ? Math.min(pw, fit.width + 70) : Math.min(pw, 170);
      const px = cx - w2 / 2, py = bandY0 + (bandH - ph) / 2;
      const notchY = band === 'top' ? py + ph : py;
      const nd = band === 'top' ? 1 : -1;
      const sw = {x: px + 10, y: py + ph / 2 - 13, s: 26};
      const node = g({name: `${P}-plaque${j}`},
        h('path', {d: `M${r(cx - 11)} ${r(notchY - nd * 2)}L${r(cx)} ${r(notchY + nd * 12)}L${r(cx + 11)} ${r(notchY - nd * 2)}Z`, fill: '#f6efdf', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
        h('path', {d: roundRectPath(px, py, w2, ph, 8), fill: '#f6efdf', stroke: th.ink, 'stroke-width': 2}),
        h('path', {d: roundRectPath(sw.x, sw.y, sw.s, sw.s, 5), fill: ZONE_FILL[j % 3], stroke: ZONE_EDGE[j % 3], 'stroke-width': 2}),
        j === 1 ? h('circle', {cx: sw.x + sw.s / 2, cy: sw.y + sw.s / 2, r: 4, fill: ZONE_EDGE[1]}) : null,
        j === 2 ? h('path', {d: `M${sw.x + sw.s / 2} ${sw.y + sw.s / 2 - 6}l6 6l-6 6l-6 -6Z`, fill: 'none', stroke: ZONE_EDGE[2], 'stroke-width': 2}) : null,
        fit ? textBlock(fit, {x: px + 46 + (w2 - 56) / 2, y: py + (ph - fit.height) / 2, anchor: 'middle', fill: th.ink})
          : h('rect', {x: px + 48, y: py + ph / 2 - 5, width: w2 - 64, height: 10, rx: 5, fill: th.paperLine}));
      plaques.push({j, box: {x: px, y: py, w: w2, h: ph}, node, fit});
    });
  }
  return {
    node: g({name: P}, parts, plaques.map(q => q.node)),
    plaques,
    sheetFar: sheet ? sheet.far : 0,
    hasSheet: Boolean(sheet),
  };
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

const COVER = ['#2f4a6b', '#6b3f4f'];

/**
 * Closed book seen from above, cover label with title and note. Local =
 * stage coordinates (x, y = top-left of the cover).
 */
export function bookCover(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o;
  const c = o.color || COVER[0];
  const showText = ctx.show('key');
  const fs = o.fs ?? 1;
  const parts = [
    h('path', {d: roundRectPath(x + 7, y + 10, w, hh, 8), fill: th.shadow}),
    // page block (visible on the right and bottom edges)
    h('path', {d: roundRectPath(x + 4, y + 5, w, hh, 6), fill: '#f3ead6', stroke: th.ink, 'stroke-width': 1.8}),
    h('path', {d: `M${x + w - 1} ${y + 14}V${y + hh - 4}M${x + w + 2} ${y + 16}V${y + hh - 2}M${x + 14} ${y + hh + 2}H${x + w - 4}`, stroke: '#d9ccb0', 'stroke-width': 1.4}),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: c, stroke: th.ink, 'stroke-width': 2.4}),
  ];
  const sx = o.spine === 'right' ? x + w - 22 : x;
  parts.push(
    h('rect', {x: sx, y, width: 22, height: hh, rx: 7, fill: shade(c, -0.28)}),
    h('path', {d: `M${o.spine === 'right' ? sx : x + 22} ${y + 1}V${y + hh - 1}`, stroke: th.ink, 'stroke-width': 1.4}),
    h('path', {d: `M${sx + 7} ${y + 18}H${sx + 16}M${sx + 7} ${y + hh - 18}H${sx + 16}`, stroke: '#e6c77a', 'stroke-width': 3, 'stroke-linecap': 'round'}));
  const lx = o.spine === 'right' ? x + 14 : x + 36, lw = w - 50;
  let label = {x: lx, y: y + 16, w: lw, h: hh - 32};
  let minSize = null;
  if (showText) {
    const {tf, nf} = bookFits(ctx, o.source, w, fs, hh - 18);
    const lh = tf.height + (nf ? nf.height + 10 : 0) + 24;
    label = {x: lx, y: y + Math.max(8, (hh - lh) / 2), w: lw, h: lh};
    parts.push(h('path', {d: roundRectPath(label.x, label.y, label.w, label.h, 6), fill: '#f6efdf', stroke: shade(c, -0.35), 'stroke-width': 2}));
    parts.push(textBlock(tf, {x: lx + lw / 2, y: label.y + 12, anchor: 'middle', fill: th.ink}));
    if (nf) parts.push(textBlock(nf, {x: lx + lw / 2, y: label.y + 12 + tf.height + 10, anchor: 'middle', fill: th.inkSoft, italic: true}));
    minSize = Math.min(tf.size, nf ? nf.size : 99);
  } else {
    label = {x: lx, y: y + hh * 0.3, w: lw, h: 56};
    parts.push(h('path', {d: roundRectPath(label.x, label.y, label.w, label.h, 6), fill: '#f6efdf', stroke: shade(c, -0.35), 'stroke-width': 2}));
    parts.push(h('rect', {x: lx + 18, y: label.y + 14, width: lw - 36, height: 11, rx: 5, fill: th.inkSoft, opacity: 0.6}));
    parts.push(h('rect', {x: lx + 30, y: label.y + 33, width: lw - 60, height: 8, rx: 4, fill: th.paperLine}));
  }
  return {node: g({name: o.prefix}, parts), box: {x, y, w: w + 8, h: hh + 10}, label, minSize};
}

/** Title and note fits of a book label; the size steps down (to 16) until the label fits `maxH`. */
function bookFits(ctx, source, w, fs = 1, maxH = Infinity) {
  const lw = w - 50;
  let out = null;
  for (let k = 0; k <= 8; k++) {
    const sz = Math.max(16, 22 * fs - k);
    const tf = fitWords(ctx, source.title, {maxWidth: lw - 24, size: sz, minSize: 16, maxLines: 4, weight: 700, family: 'serif'});
    const nf = source.note ? fitWords(ctx, source.note, {maxWidth: lw - 24, size: Math.min(sz, 20.5 * fs), minSize: 16, maxLines: 2, weight: 500}) : null;
    out = {tf, nf};
    if (tf.height + (nf ? nf.height + 10 : 0) + 24 <= maxH || sz <= 16) break;
  }
  return out;
}

/** Smallest cover height that holds the label (at 16 px). */
export function bookLabelMin(ctx, source, w) {
  if (!ctx.show('key')) return 100;
  const {tf, nf} = bookFits(ctx, source, w, 1, 0);
  return tf.height + (nf ? nf.height + 10 : 0) + 24 + 18;
}

/** Height a book cover needs for its label (at the largest size). */
export function bookNeed(ctx, source, w, fs = 1) {
  if (!ctx.show('key')) return 120;
  const {tf, nf} = bookFits(ctx, source, w, fs);
  return tf.height + (nf ? nf.height + 10 : 0) + 24 + 32;
}

/**
 * The editable hierarchy: a wooden organiser with one compartment per
 * supplied level; each compartment has a brass plate on its lower rim.
 * `comps` are the compartments' inner boxes (stage coordinates).
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, levels:string[], arrangement:'column'|'row', plateFs?:number}} o
 */
export function hierarchyOrganiser(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o;
  const n = o.levels.length;
  const showText = ctx.show('key');
  const gap = 12, pad = 12;
  const parts = [
    h('path', {d: roundRectPath(x + 6, y + 9, w, hh, 14), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 14), fill: th.woodDark, stroke: th.ink, 'stroke-width': 2.4}),
  ];
  const comps = [];
  const plates = [];
  let minSize = null;
  for (let i = 0; i < n; i++) {
    const cb = o.arrangement === 'row'
      ? {x: x + pad + i * ((w - 2 * pad - gap * (n - 1)) / n + gap), y: y + pad, w: (w - 2 * pad - gap * (n - 1)) / n, h: hh - 2 * pad}
      : {x: x + pad, y: y + pad + i * ((hh - 2 * pad - gap * (n - 1)) / n + gap), w: w - 2 * pad, h: (hh - 2 * pad - gap * (n - 1)) / n};
    parts.push(h('path', {d: roundRectPath(cb.x, cb.y, cb.w, cb.h, 9), fill: '#e7dcc4', stroke: th.ink, 'stroke-width': 1.8}));
    parts.push(h('path', {d: roundRectPath(cb.x + 4, cb.y + 4, cb.w - 8, 10, 5), fill: '#000', opacity: 0.06}));
    // brass plate on the lower rim
    let pf = null;
    let ph = 34, pw = 150;
    if (showText) {
      pf = fitWords(ctx, o.levels[i], {maxWidth: cb.w - 70, size: 21 * (o.plateFs ?? 1), minSize: 16, maxLines: 2, weight: 700});
      ph = pf.height + 14;
      pw = pf.width + 46;
      minSize = Math.min(minSize ?? 99, pf.size);
    }
    const px = cb.x + cb.w / 2 - pw / 2, py = cb.y + cb.h - ph - 8;
    parts.push(g({name: `${o.prefix}-plate${i}`},
      h('path', {d: roundRectPath(px, py, pw, ph, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}),
      h('circle', {cx: px + 10, cy: py + ph / 2, r: 3.2, fill: '#6c4f1a'}),
      h('circle', {cx: px + pw - 10, cy: py + ph / 2, r: 3.2, fill: '#6c4f1a'}),
      pf ? textBlock(pf, {x: px + pw / 2, y: py + (ph - pf.height) / 2, anchor: 'middle', fill: '#3d2c0c'})
        : Array.from({length: i + 1}, (_, k) => h('circle', {cx: px + pw / 2 + (k - i / 2) * 16, cy: py + ph / 2, r: 4.5, fill: '#6c4f1a'}))));
    plates.push({x: px, y: py, w: pw, h: ph});
    comps.push({...cb, free: {x: cb.x, y: cb.y, w: cb.w, h: py - cb.y - 6}});
  }
  return {node: g({name: o.prefix}, parts), comps, plates, box: {x, y, w, h: hh}, minSize};
}

/** Plate height of a level label (for layout before drawing). */
export function plateNeed(ctx, label, compW, fs = 1) {
  if (!ctx.show('key')) return 34;
  return fitWords(ctx, label, {maxWidth: compW - 70, size: 21 * fs, minSize: 16, maxLines: 2, weight: 700}).height + 14;
}

/**
 * Article slip: header strip (reference), heading, and the zone where the
 * text is placed (as supplied). Local origin = top-left; the grip is on the
 * header strip (top centre). `protrude` = the part sticking out of the book.
 * @param {any} ctx
 * @param {{prefix:string, passage:any, zoneIdx:number, W:number, fs?:number, noText?:boolean}} o
 */
export function articleSlip(ctx, o) {
  const th = ctx.theme;
  const t = kitStrings(ctx.params.locale);
  const W = o.W;
  const fs = o.fs ?? 1;
  const pad = 16;
  const showText = !o.noText && ctx.show('key');
  const head = shade(sheetColor(ctx), 0.62);
  const refFit = showText ? fitWords(ctx, o.passage.ref, {maxWidth: W - pad * 2, size: 22 * fs, minSize: 16, maxLines: 2, weight: 700}) : null;
  const headingFit = showText ? fitWords(ctx, o.passage.heading, {maxWidth: W - pad * 2, size: 22 * fs, minSize: 16, maxLines: 3, weight: 500, family: 'serif'}) : null;
  const zoneFit = showText ? fitWords(ctx, `${t.placedOn}: ${o.passage.zone}`, {maxWidth: W - pad * 2 - 34, size: 22 * fs, minSize: 16, maxLines: 3, weight: 600}) : null;
  const headH = refFit ? refFit.height + 22 : 40;
  let yy = headH + 12;
  const headingY = yy;
  yy += (headingFit ? headingFit.height : 30) + 12;
  const ruleY = yy;
  yy += 10;
  const zoneY = yy;
  const zoneH = zoneFit ? zoneFit.height : 26;
  yy += zoneH + 16;
  const H = yy;
  const parts = [
    h('path', {d: roundRectPath(5, 8, W, H, 8), fill: th.shadow}),
    h('path', {d: `M0 8Q0 0 8 0H${W - 8}Q${W} 0 ${W} 8V${H - 22}L${W - 22} ${H}H8Q0 ${H} 0 ${H - 8}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${W} ${H - 22}H${W - 22}V${H}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
    h('path', {d: `M1.1 ${headH}V8Q1.1 1.1 8 1.1H${W - 8}Q${W - 1.1} 1.1 ${W - 1.1} 8V${headH}Z`, fill: head}),
    h('path', {d: `M0 ${headH}H${W}`, stroke: th.ink, 'stroke-width': 1.4}),
  ];
  if (refFit) parts.push(textBlock(refFit, {x: pad, y: (headH - refFit.height) / 2, fill: th.ink}));
  else parts.push(h('rect', {x: pad, y: headH / 2 - 6, width: W * 0.5, height: 12, rx: 6, fill: shade(head, -0.3)}));
  const body = [];
  if (headingFit) body.push(textBlock(headingFit, {x: pad, y: headingY, fill: th.inkSoft, italic: true}));
  else {
    parts.push(h('rect', {x: pad, y: headingY + 4, width: W * 0.7, height: 9, rx: 4.5, fill: th.paperLine}));
    parts.push(h('rect', {x: pad, y: headingY + 18, width: W * 0.45, height: 9, rx: 4.5, fill: th.paperLine}));
  }
  parts.push(h('path', {d: `M${pad} ${r(ruleY)}H${W - pad}`, stroke: th.paperLine, 'stroke-width': 2}));
  const zi = o.zoneIdx;
  const swY = zoneY + zoneH / 2 - 11;
  parts.push(h('path', {d: roundRectPath(pad, swY, 22, 22, 5), fill: zi >= 0 ? ZONE_FILL[zi % 3] : '#ffffff', stroke: zi >= 0 ? ZONE_EDGE[zi % 3] : NEUTRAL, 'stroke-width': 2, 'stroke-dasharray': zi >= 0 ? null : '4 3'}));
  if (zoneFit) body.push(textBlock(zoneFit, {x: pad + 34, y: zoneY, fill: th.ink}));
  else parts.push(h('rect', {x: pad + 34, y: swY + 6, width: W * 0.5, height: 10, rx: 5, fill: th.paperLine}));
  if (body.length) parts.push(g({name: `${o.prefix}-body`}, body));
  const minSize = showText ? Math.min(refFit.size, headingFit.size, zoneFit.size) : null;
  return {node: g({name: o.prefix}, parts), W, H, headH, grip: {x: W / 2, y: Math.min(30, headH * 0.55)}, protrude: headH + 8, minSize, hasBody: body.length > 0};
}

/** Size of the slip (for layout before drawing). */
export function slipSize(ctx, passage, W, fs = 1) {
  const a = articleSlip(ctx, {prefix: 'probe', passage, zoneIdx: 0, W, fs});
  return {W: a.W, H: a.H, protrude: a.protrude};
}

export const TOKEN_R = 25;

/** Fitted label of a fact tag. */
export function tagFit(ctx, label, o = {}) {
  return fitWords(ctx, label, {maxWidth: o.maxWidth ?? 200, size: (o.size ?? 22), minSize: o.minSize ?? 16, maxLines: o.maxLines ?? 3, weight: 600});
}

/** Tag size for a fitted label (and optional zone lines under it). */
export const tagDims = (fit, subs = null) => {
  const lw = fit ? fit.width : 70, lh = fit ? fit.height : 24;
  if (!subs) return {tw: lw + 50, th: lh + 22};
  const sw = Math.max(...subs.map(q => (q ? q.width + 24 : 90))), sh = Math.max(...subs.map(q => (q ? q.height : 22)));
  return {tw: Math.max(lw, sw) + 50, th: lh + 8 + sh + 22};
};

/**
 * Fact token: a numbered pawn seen from above with a paper tag that slides
 * out from under it (clip), plus the two relation rings. Local origin = pawn
 * centre; the tag lies to the right. Nodes: `${P}` (pose), `${P}-slide`
 * (tag slide), `${P}-ringS` / `${P}-ringD` (opacity).
 * @param {any} ctx
 * @param {{prefix:string, fact:any, color:string, fit:any, noText?:boolean, rings?:boolean, open?:number, sub?:{fit:any, zone:number}|null}} o
 */
export function pawnToken(ctx, o) {
  const th = ctx.theme;
  const R = TOKEN_R;
  const P = o.prefix;
  const showText = !o.noText && ctx.show('key');
  const fit = showText ? o.fit : null;
  // optional zone line under the label, with a before / after alternative (inspect)
  const subs = o.subs || null;
  const subFits = subs && showText ? subs.map(q => q.fit) : null;
  // dimFits: the fits that size the tag (identical tags for scenes that differ only in the chip text)
  const dimFits = o.dimFits || (subs ? subs.map(q => q.fit) : null);
  // noLabel: the tag carries only the zone line (the fact label is printed elsewhere)
  const dims = o.noLabel && subs
    ? {tw: Math.max(...dimFits.map(q => (q ? q.width + 24 : 90))) + 50, th: Math.max(...dimFits.map(q => (q ? q.height : 22))) + 22}
    : tagDims(o.fit, dimFits);
  const {tw, th: tH} = dims;
  const tx0 = R + 12;
  const clipId = `${P}-tclip`;
  const side = o.side === 'left' ? -1 : 1;
  // text placed so it reads left to right on either side (x = start of the text in the tag's frame)
  const put = (f, x, y, name, extra = {}) => (side > 0
    ? textBlock(f, {x, y, fill: th.ink, name, ...extra})
    : g({transform: 'scale(-1 1)', name}, textBlock(f, {x: -(x + f.width), y, fill: th.ink, ...extra})));
  const tagParts = [
    h('path', {d: `M${R - 4} 0C${R + 6} -6 ${tx0 + 4} -4 ${tx0 + 12} 0`, stroke: th.inkSoft, 'stroke-width': 2, fill: 'none'}),
    h('path', {d: roundRectPath(tx0 + 3, -tH / 2 + 5, tw, tH, 7), fill: th.shadow}),
    h('path', {d: `M${tx0} ${-tH / 2 + 10}L${tx0 + 10} ${-tH / 2}H${tx0 + tw - 7}Q${tx0 + tw} ${-tH / 2} ${tx0 + tw} ${-tH / 2 + 7}V${tH / 2 - 7}Q${tx0 + tw} ${tH / 2} ${tx0 + tw - 7} ${tH / 2}H${tx0 + 10}L${tx0} ${tH / 2 - 10}Z`, fill: '#fffdf6', stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('circle', {cx: tx0 + 13, cy: 0, r: 4.2, fill: th.paperShade, stroke: th.ink, 'stroke-width': 1.4}),
    h('rect', {x: tx0 + 24, y: -tH / 2 + 8, width: 5, height: tH - 16, rx: 2.5, fill: o.color, opacity: 0.8}),
  ];
  const labelH = o.noLabel ? -8 : o.fit ? o.fit.height : 30;
  const subH = subs ? Math.max(...dimFits.map(q => (q ? q.height : 22))) : 0;
  const y0 = -(labelH + (subs ? 8 + subH : 0)) / 2;
  if (o.noLabel) { /* zone line only */ } else if (fit) tagParts.push(put(fit, tx0 + 38, y0, `${P}-label`));
  else {
    const bars = Math.max(1, Math.min(3, Math.round((labelH + 4) / 22)));
    for (let b = 0; b < bars; b++) tagParts.push(h('rect', {x: tx0 + 38, y: y0 + 6 + b * 18, width: (tw - 52) * (b === bars - 1 ? 0.6 : 0.92), height: 9, rx: 4.5, fill: th.paperLine}));
  }
  if (subs) {
    const sy = y0 + labelH + 8;
    if (!o.noLabel) tagParts.push(h('path', {d: `M${tx0 + 36} ${r(sy - 4)}H${tx0 + tw - 10}`, stroke: th.paperLine, 'stroke-width': 1.6}));
    subs.forEach((q, i) => {
      const f = subFits ? subFits[i] : null;
      if (q.empty) {
        // an empty zone slot (no zone supplied yet)
        tagParts.push(g({name: `${P}-sub${i}`, opacity: i === 0 ? 1 : 0},
          h('path', {d: roundRectPath(tx0 + 38, sy + 1, tw - 50, subH - 2, 6), fill: th.paperShade, stroke: NEUTRAL, 'stroke-width': 2, 'stroke-dasharray': '6 5'})));
        return;
      }
      const sw = h('path', {d: roundRectPath(tx0 + 38, sy + subH / 2 - 9, 18, 18, 4), fill: q.zone >= 0 ? ZONE_FILL[q.zone % 3] : '#ffffff', stroke: q.zone >= 0 ? ZONE_EDGE[q.zone % 3] : NEUTRAL, 'stroke-width': 2, 'stroke-dasharray': q.zone >= 0 ? null : '4 3'});
      const txt = f ? put(f, tx0 + 62, sy + (subH - f.height) / 2, null) : h('rect', {x: tx0 + 62, y: sy + subH / 2 - 4, width: Math.max(20, tw - 80), height: 8, rx: 4, fill: th.paperLine});
      const strike = i === 0 && f ? h('path', {name: `${P}-strike`, d: `M${tx0 + 58} ${r(sy + subH / 2)}H${r(tx0 + 66 + f.width)}`, stroke: NEUTRAL, 'stroke-width': 2.4, opacity: 0}) : null;
      tagParts.push(g({name: `${P}-sub${i}`, opacity: i === 0 ? 1 : 0}, sw, txt, strike));
    });
    if (o.subFrame) tagParts.push(h('path', {name: `${P}-subframe`, d: roundRectPath(tx0 + 32, sy - 4, tw - 38, subH + 8, 8), fill: 'none', stroke: o.subFrame, 'stroke-width': 3.5, opacity: 0}));
  }
  const open = o.open ?? 0;
  const slideD = tw + 18;
  const pawn = [
    h('ellipse', {cx: 4, cy: 7, rx: R + 2, ry: R, fill: th.shadow}),
    h('circle', {r: R, fill: shade(o.color, -0.18), stroke: th.ink, 'stroke-width': 2.4}),
    h('circle', {r: R * 0.72, fill: o.color, stroke: shade(o.color, -0.4), 'stroke-width': 1.6}),
    h('path', {d: `M${r(-R * 0.5)} ${r(-R * 0.12)}A${r(R * 0.52)} ${r(R * 0.52)} 0 0 1 ${r(-R * 0.05)} ${r(-R * 0.52)}`, fill: 'none', stroke: '#ffffff', 'stroke-width': 3.2, 'stroke-linecap': 'round', opacity: 0.55}),
    showText ? h('text', {x: 0, y: 7, 'text-anchor': 'middle', 'font-size': 20, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", fill: '#ffffff'}, String(o.fact.num)) : null,
  ];
  const rings = o.rings === false ? [] : [
    h('circle', {name: `${P}-ringS`, r: R + 9, fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 5.5, opacity: 0}),
    h('circle', {name: `${P}-ringD`, r: R + 9, fill: 'none', stroke: NEUTRAL, 'stroke-width': 4, 'stroke-dasharray': '7 6', opacity: 0}),
  ];
  const vert = o.side === 'top' || o.side === 'bottom';
  let node, tagBox, subBox = subs ? {x: tx0 + 32, y: y0 + labelH + 4, w: tw - 38, h: subH + 8} : null, axis = 'x';
  if (vert) {
    // a tag above / below the pawn: the same tag, moved, with a short vertical cord; it slides out vertically
    const top = o.side === 'top';
    const ty = top ? -R - 12 - tH : R + 12;
    // shiftX moves the tag sideways under / over its pawn (the cord stays on the pawn)
    const sh = clamp(o.shiftX || 0, -(tw / 2 - 16), tw / 2 - 16);
    const dx = -tw / 2 - tx0 + sh, dy = ty + tH / 2;
    tagParts[0] = h('path', {d: `M${-dx} ${top ? r(-R + 4 - dy) : r(R - 4 - dy)}V${top ? r(-R - 12 - dy) : r(R + 12 - dy)}`, stroke: th.inkSoft, 'stroke-width': 2, fill: 'none'});
    const slideDv = tH + 18;
    node = g({name: P},
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', top ? {x: -tw / 2 - 10 + sh, y: ty - 10, width: tw + 20, height: tH + 10 + 12 - 2} : {x: -tw / 2 - 10 + sh, y: R - 2, width: tw + 20, height: tH + 26}))),
      g({'clip-path': ctx.ref(clipId)}, g({name: `${P}-slide`, transform: `translate(0 ${r((top ? 1 : -1) * (1 - open) * slideDv)})`}, g({transform: `translate(${r(dx)} ${r(dy)})`}, tagParts))),
      rings,
      pawn);
    tagBox = {x: -tw / 2 + sh, y: ty, w: tw, h: tH};
    if (subBox) subBox = {...subBox, x: subBox.x + dx, y: subBox.y + dy};
    axis = top ? 'y+' : 'y-';
    return {node, R, tw, tH, tx0, slideD: slideDv, side: o.side, axis, subBox, tagBox};
  }
  node = g({name: P},
    g({transform: side < 0 ? 'scale(-1 1)' : null},
      h('defs', null, h('clipPath', {id: ctx.id(clipId)}, h('rect', {x: R - 2, y: -tH / 2 - 6, width: tw + tx0 - R + 14, height: tH + 16}))),
      g({'clip-path': ctx.ref(clipId)}, g({name: `${P}-slide`, transform: `translate(${r(-(1 - open) * slideD)} 0)`}, tagParts))),
    rings,
    pawn);
  tagBox = side < 0 ? {x: -tx0 - tw, y: -tH / 2, w: tw, h: tH} : {x: tx0, y: -tH / 2, w: tw, h: tH};
  if (subBox && side < 0) subBox = {...subBox, x: -subBox.x - subBox.w};
  return {node, R, tw, tH, tx0, slideD, side, axis, subBox, box: {x: -R - 10, y: -Math.max(R + 10, tH / 2), w: tx0 + tw + R + 10, h: Math.max(2 * R + 20, tH)}, tagBox};
}

/** Tag slide frame value for an opening progress. */
export const tagSlide = (tok, p) => (tok.axis === 'y+' || tok.axis === 'y-'
  ? {transform: `translate(0 ${r((tok.axis === 'y+' ? 1 : -1) * (1 - clamp(p)) * tok.slideD)})`}
  : {transform: `translate(${r(-(1 - clamp(p)) * tok.slideD)} 0)`});

/** Tag box of a pawn at (cx, cy) for a side. */
export function tagBoxAt(side, cx, cy, tw, tH) {
  const R = TOKEN_R;
  if (side === 'left') return {x: cx - R - 12 - tw, y: cy - tH / 2, w: tw, h: tH};
  if (side === 'top') return {x: cx - tw / 2, y: cy - R - 12 - tH, w: tw, h: tH};
  if (side === 'bottom') return {x: cx - tw / 2, y: cy + R + 12, w: tw, h: tH};
  return {x: cx + R + 12, y: cy - tH / 2, w: tw, h: tH};
}

/**
 * Dish of fact tokens with a label plate. Nests along the dish; local =
 * stage coordinates.
 */
export function factDish(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o;
  const showText = ctx.show('key');
  const parts = [
    h('path', {d: roundRectPath(x + 5, y + 8, w, hh, hh * 0.3), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh * 0.3, 40)), fill: th.wood, stroke: th.ink, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(x + 9, y + 9, w - 18, hh - 18, Math.min(hh * 0.3, 40) - 6), fill: '#5f6f63', stroke: shade(th.wood, -0.3), 'stroke-width': 1.6}),
  ];
  const nests = o.nests.map(q => {
    parts.push(h('circle', {cx: q.x, cy: q.y, r: TOKEN_R + 6, fill: '#51605a', stroke: '#48554f', 'stroke-width': 1.5}));
    return q;
  });
  let labelBox = null;
  if (o.label && showText) {
    const f = fitWords(ctx, o.label, {maxWidth: o.labelMax ?? w - 40, size: o.labelSize ?? 20, minSize: Math.min(15, o.labelSize ?? 20), maxLines: 1, weight: 700});
    const pw = f.width + 30, ph = f.height + 12;
    const px = o.labelAt ? o.labelAt.x - pw / 2 : x + w / 2 - pw / 2;
    const py = o.labelAt ? o.labelAt.y : y - ph + 6;
    parts.push(h('path', {d: roundRectPath(px, py, pw, ph, 6), fill: '#e8cf86', stroke: '#6c4f1a', 'stroke-width': 2}));
    parts.push(textBlock(f, {x: px + pw / 2, y: py + 6, anchor: 'middle', fill: '#3d2c0c'}));
    labelBox = {x: px, y: py, w: pw, h: ph};
  }
  return {node: g({name: o.prefix}, parts), nests, labelBox, box: {x, y, w, h: hh}};
}

/**
 * Key card: what the sheet and the two rings mean, and the neutrality line.
 * Text is capped at `size` (never larger than the supplied content).
 */
export function keyCard(ctx, o) {
  if (o.strip) return keyStrip(ctx, o);
  const th = ctx.theme;
  const t = kitStrings(ctx.params.locale);
  const {x, y, w} = o;
  const size = o.size ?? 20;
  const showText = ctx.show('key');
  const pad = 14, gx = 44;
  const rows = [
    {kind: 'sheet', text: t.keyText},
    {kind: 'shared', text: t.keyShared},
    {kind: 'other', text: t.keyOther},
  ];
  const fits = rows.map(rw => (showText ? fitWords(ctx, rw.text, {maxWidth: w - pad * 2 - gx, size, minSize: Math.min(size, 15), maxLines: 2, weight: 600}) : null));
  const noteFit = showText ? fitWords(ctx, t.keyNote, {maxWidth: w - pad * 2, size, minSize: Math.min(size, 15), maxLines: 2, weight: 600}) : null;
  const parts = [];
  let yy = y + pad;
  const glyphs = [];
  rows.forEach((rw, i) => {
    const rh = Math.max(34, fits[i] ? fits[i].height : 0);
    const gc = {x: x + pad + 17, y: yy + rh / 2};
    if (rw.kind === 'sheet') {
      glyphs.push(h('path', {d: hexD(gc.x, gc.y, 15), fill: sheetColor(ctx), 'fill-opacity': 0.55, stroke: sheetDark(ctx), 'stroke-width': 3}));
    } else {
      glyphs.push(h('circle', {cx: gc.x, cy: gc.y, r: 9, fill: PAWN[0], stroke: th.ink, 'stroke-width': 1.6}));
      glyphs.push(rw.kind === 'shared'
        ? h('circle', {cx: gc.x, cy: gc.y, r: 15, fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 4})
        : h('circle', {cx: gc.x, cy: gc.y, r: 15, fill: 'none', stroke: NEUTRAL, 'stroke-width': 3, 'stroke-dasharray': '5 4'}));
    }
    if (fits[i]) parts.push(textBlock(fits[i], {x: x + pad + gx, y: yy + (rh - fits[i].height) / 2, fill: th.ink}));
    yy += rh + 8;
  });
  yy += 2;
  const ruleY = yy;
  yy += 10;
  if (noteFit) {
    parts.push(textBlock(noteFit, {x: x + pad, y: yy, fill: th.ink, italic: true}));
    yy += noteFit.height;
  } else yy += 4;
  const H = yy + pad - y;
  const node = g({name: o.prefix},
    h('path', {d: roundRectPath(x + 4, y + 7, w, H, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, H, 10), fill: '#fffdf6', stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${x + pad} ${r(ruleY)}H${x + w - pad}`, stroke: th.paperLine, 'stroke-width': 2}),
    glyphs, parts);
  return {node, box: {x, y, w, h: H}};
}

/** Height of the key card for a width (for layout). */
export function keyHeight(ctx, w, size, strip = false) {
  return keyCard(ctx, {prefix: 'probe', x: 0, y: 0, w, size, strip}).box.h;
}

/** Key as a two-column strip: the three glyph rows on the left, the neutrality line on the right. */
function keyStrip(ctx, o) {
  const th = ctx.theme;
  const t = kitStrings(ctx.params.locale);
  const {x, y, w} = o;
  const size = o.size ?? 18;
  const showText = ctx.show('key');
  const pad = 10, gx = 36;
  const leftW = Math.round(w * 0.6);
  const rows = [{kind: 'sheet', text: t.keyText}, {kind: 'shared', text: t.keyShared}, {kind: 'other', text: t.keyOther}];
  const fits = rows.map(rw => (showText ? fitWords(ctx, rw.text, {maxWidth: leftW - pad - gx - 8, size, minSize: Math.min(size, 14), maxLines: 2, weight: 600}) : null));
  const noteFit = showText ? fitWords(ctx, t.keyNote, {maxWidth: w - leftW - pad * 2 - 8, size, minSize: Math.min(size, 14), maxLines: 3, weight: 600}) : null;
  const parts = [];
  const glyphs = [];
  let yy = y + pad;
  rows.forEach((rw, i) => {
    const rh = Math.max(24, fits[i] ? fits[i].height : 0);
    const gc = {x: x + pad + 13, y: yy + rh / 2};
    if (rw.kind === 'sheet') glyphs.push(h('path', {d: hexD(gc.x, gc.y, 11), fill: sheetColor(ctx), 'fill-opacity': 0.55, stroke: sheetDark(ctx), 'stroke-width': 2.6}));
    else {
      glyphs.push(h('circle', {cx: gc.x, cy: gc.y, r: 6, fill: PAWN[0], stroke: th.ink, 'stroke-width': 1.4}));
      glyphs.push(rw.kind === 'shared'
        ? h('circle', {cx: gc.x, cy: gc.y, r: 11, fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 3.4})
        : h('circle', {cx: gc.x, cy: gc.y, r: 11, fill: 'none', stroke: NEUTRAL, 'stroke-width': 2.6, 'stroke-dasharray': '4 3'}));
    }
    if (fits[i]) parts.push(textBlock(fits[i], {x: x + pad + gx, y: yy + (rh - fits[i].height) / 2, fill: th.ink}));
    yy += rh + 3;
  });
  const hL = yy - 3 + pad - y;
  const hR = (noteFit ? noteFit.height : 20) + pad * 2;
  const H = Math.max(hL, hR);
  if (noteFit) parts.push(textBlock(noteFit, {x: x + leftW + pad, y: y + (H - noteFit.height) / 2, fill: th.ink, italic: true}));
  const node = g({name: o.prefix},
    h('path', {d: roundRectPath(x + 4, y + 6, w, H, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, H, 10), fill: '#fffdf6', stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${x + leftW} ${y + 10}V${y + H - 10}`, stroke: th.paperLine, 'stroke-width': 2}),
    glyphs, parts);
  return {node, box: {x, y, w, h: H}};
}

/* ------------------------------------------------------------------ */
/* Placement on the board                                              */
/* ------------------------------------------------------------------ */

const boxHit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const inBox = (b, c, pad = 0) => b.x >= c.x + pad && b.y >= c.y + pad && b.x + b.w <= c.x + c.w - pad && b.y + b.h <= c.y + c.h - pad;

/** A pawn (radius TOKEN_R plus its ring and a margin) lies wholly inside zone z: no border touches it. */
export function pawnInterior(B, q, z, pad = 12) {
  const rr = TOKEN_R + pad;
  if (B.zoneAt(q.x, q.y) !== z) return false;
  for (let k = 0; k < 24; k++) {
    const a = (k * Math.PI) / 12;
    if (B.zoneAt(q.x + rr * Math.cos(a), q.y + rr * Math.sin(a)) !== z) return false;
  }
  return true;
}

/** A box (grown by a margin) lies wholly inside zone z. */
export function boxInterior(B, b, z, pad = 10) {
  const x0 = b.x - pad, y0 = b.y - pad, x1 = b.x + b.w + pad, y1 = b.y + b.h + pad;
  const nx = Math.max(2, Math.ceil((x1 - x0) / 8)), ny = Math.max(2, Math.ceil((y1 - y0) / 8));
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) if (B.zoneAt(x0 + ((x1 - x0) * i) / nx, y0 + ((y1 - y0) * j) / ny) !== z) return false;
  return true;
}

/**
 * Choose where the slip lies (inside the text's zone, near its plaque) and a
 * tile for every placed fact (inside its zone, tag clear of everything).
 * @param {any} B board geometry
 * @param {{W:number,H:number}|null} slip
 * @param {any} res resolved placement
 * @param {Array<{tw:number,th:number}>} tags tag sizes per fact
 * @param {{reserve?:any[]}} [o] extra boxes to keep free
 */
export function placeOnBoard(B, slip, res, tags, o = {}) {
  const inner = B.inner;
  // o.interior (opt-in): a pawn (with its ring) and the slip lie wholly inside their zone, clear of every border
  const pawnIn = (cx, cy, z) => !o.interior || pawnInterior(B, {x: cx, y: cy}, z);
  const slipIn = (box, z) => !o.interior || boxInterior(B, box, z);
  const reserve = [...(o.reserve || [])];
  const R = TOKEN_R;
  // slip candidates (best first): inside the text's zone, near its plaque
  let slipCands = [null];
  if (o.fixedSlip !== undefined) slipCands = [o.fixedSlip];
  else if (slip && res.textZone >= 0) {
    const z = res.textZone;
    const pr = B.plaqueRange[z];
    const bandEdge = pr.band === 'top' ? inner.y : inner.y + inner.h;
    const list0 = [];
    for (const t of B.zones[z].tiles) {
      // (interior: finer offsets, so the slip can hug a corner of its zone and leave room for the pawns)
      const offs = o.interior ? [[0, 0], [B.cw / 2, 0], [0, B.rh / 2], [B.cw / 4, 0], [-B.cw / 4, 0], [0, B.rh / 4], [0, -B.rh / 4], [B.cw / 4, B.rh / 4], [-B.cw / 4, -B.rh / 4], [B.cw / 4, -B.rh / 4], [-B.cw / 4, B.rh / 4]] : [[0, 0], [B.cw / 2, 0], [0, B.rh / 2]];
      for (const [dx, dy] of offs) {
        const cx = t.cx + dx, cy = t.cy + dy;
        const box = {x: cx - slip.W / 2, y: cy - slip.H / 2, w: slip.W, h: slip.H};
        if (!inBox(box, inner, 10)) continue;
        // areas the slip must leave free (e.g. a tag hanging over the board while its pawn waits)
        if ((o.slipAvoid || []).some(q => boxHit(box, q, 4))) continue;
        if (!slipIn(box, z)) continue;
        const cov = B.coverage(box, z, 6);
        if (cov < 0.8) continue;
        // near its plaque, hugging a side of the zone (so the zone keeps one open area)
        const zx0 = Math.min(...B.zones[z].tiles.map(q => q.cx)), zx1 = Math.max(...B.zones[z].tiles.map(q => q.cx));
        const hug = Math.min(Math.abs(box.x - Math.max(inner.x, zx0 - B.cw / 2)), Math.abs(Math.min(inner.x + inner.w, zx1 + B.cw / 2) - box.x - box.w));
        const score = cov * 1000 - Math.abs(cy - bandEdge) * 0.45 - Math.abs(cx - (pr.x0 + pr.x1) / 2) * 0.12 - hug * 0.3;
        list0.push({x: box.x, y: box.y, cx, cy, cov, score});
      }
    }
    list0.sort((a, b) => b.score - a.score);
    // distinct spots (at least 40 apart), the best few
    const pick = [];
    for (const c of list0) {
      if (pick.every(q => Math.hypot(q.cx - c.cx, q.cy - c.cy) > 40)) pick.push(c);
      if (pick.length >= (o.interior ? 12 : 6)) break;
    }
    if (pick.length) slipCands = pick;
  }
  let facts = res.facts.filter(f => f.zone >= 0).map(f => f.i);
  const NR = o.near && o.near.z >= 0 && facts.includes(o.near.i) ? o.near : null;
  // the focus fact (inspect) is placed first, together with the tile it will move to
  if (NR) facts = [NR.i, ...facts.filter(i => i !== NR.i)];
  // candidate positions per fact (independent of the other placements), strict and relaxed
  const baseCands = {};
  for (const i of facts) {
    const z = res.facts[i].zone;
    const {tw, th: tH} = tags[i];
    const out = [];
    for (const t of B.zones[z].tiles) {
      if (B.zoneAt(t.cx, t.cy) !== z) continue;
      for (const side of o.sides || ['right', 'left']) {
        const pawnBox = {x: t.cx - R - 11, y: t.cy - R - 11, w: 2 * R + 22, h: 2 * R + 22};
        const tagBox = tagBoxAt(side, t.cx, t.cy, tw, tH);
        // a tag may overhang the board onto the desk when the scene allows it (o.tagBounds)
        if (!inBox(pawnBox, inner, 2) || !inBox(tagBox, o.tagBounds || inner, 6)) continue;
        if (!pawnIn(t.cx, t.cy, z)) continue;
        const pawnCov = B.coverage(pawnBox, z, 4);
        const tagCov = B.coverage(tagBox, z, 5);
        const bd = Math.min(B.boundaryDist({x: t.cx, y: t.cy}), 200);
        const cen = B.zones[z].centroid;
        const strictOk = pawnCov >= 0.99 && tagCov >= 0.8 && bd >= R + 14;
        // the focus fact (inspect) prefers a tile near the zone it will be moved to
        let near = 0;
        if (o.near && o.near.i === i && o.near.z >= 0 && o.near.z !== z) {
          let dmin = Infinity;
          for (const q of B.zones[o.near.z].tiles) dmin = Math.min(dmin, Math.hypot(q.cx - t.cx, q.cy - t.cy));
          near = -dmin * 0.9;
        }
        const base = pawnCov * 200 + tagCov * 120 + bd * (o.near && o.near.i === i ? 0 : 0.08) + near - Math.hypot(t.cx - cen.x, t.cy - cen.y) * 0.05 - (side === 'left' ? 12 : 0);
        out.push({x: t.cx, y: t.cy, pawnBox, tagBox, side, base, strictOk});
      }
    }
    baseCands[i] = out;
  }
  let afterCands = [];
  if (NR) {
    const {tw, th: tH} = tags[NR.i];
    for (const t of B.zones[NR.z].tiles) {
      if (B.zoneAt(t.cx, t.cy) !== NR.z) continue;
      for (const side of ['right', 'left']) {
        const pawnBox = {x: t.cx - R - 11, y: t.cy - R - 11, w: 2 * R + 22, h: 2 * R + 22};
        const tagBox = side === 'right' ? {x: t.cx + R + 12, y: t.cy - tH / 2, w: tw, h: tH} : {x: t.cx - R - 12 - tw, y: t.cy - tH / 2, w: tw, h: tH};
        if (!inBox(pawnBox, inner, 2) || !inBox(tagBox, inner, 6)) continue;
        if (!pawnIn(t.cx, t.cy, NR.z)) continue;
        const pc = B.coverage(pawnBox, NR.z, 4), tc = B.coverage(tagBox, NR.z, 5), bd = B.boundaryDist({x: t.cx, y: t.cy});
        afterCands.push({x: t.cx, y: t.cy, pawnBox, tagBox, side, strictOk: pc >= 0.99 && tc >= 0.7 && bd >= R + 14, tc});
      }
    }
  }
  let strict = true;
  const candsFor = (i, taken, placedPts) => {
    const out = [];
    for (const c of baseCands[i]) {
      if (strict && !c.strictOk) continue;
      if (taken.some(q => boxHit(c.pawnBox, q, 6) || boxHit(c.tagBox, q, 6))) continue;
      const spread = placedPts.length ? Math.min(360, ...placedPts.map(q => Math.hypot(q.x - c.x, q.y - c.y))) : 200;
      if (NR && i === NR.i) {
        // its partner tile in the new zone: the nearest free one (the tag keeps its side when it can)
        let best = null, bs = Infinity;
        for (const a of afterCands) {
          if (strict && !a.strictOk) continue;
          if (taken.some(q => boxHit(a.pawnBox, q, 6) || boxHit(a.tagBox, q, 6))) continue;
          const d = Math.hypot(a.x - c.x, a.y - c.y) + (a.side === c.side ? 0 : 40) - a.tc * 30;
          if (d < bs) { bs = d; best = a; }
        }
        // no free partner tile: still placeable (the stage then looks for the nearest free tile)
        out.push(best ? {...c, after: best, score: c.base * 0.3 - bs * 1.2} : {...c, after: null, score: c.base * 0.3 - 5000});
        continue;
      }
      out.push({...c, score: c.base + spread * 0.12});
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  };
  const K = 7;
  let best = null, found = false;
  const dfs = (k, taken, pts, acc, skipped) => {
    if (found) return;
    if (k === facts.length) {
      const n = facts.length - skipped;
      if (!best || n > best.n) best = {slots: acc.slice(), n};
      if (!skipped) found = true;
      return;
    }
    const i = facts[k];
    for (const c of candsFor(i, taken, pts).slice(0, K)) {
      acc[i] = c;
      dfs(k + 1, [...taken, c.pawnBox, c.tagBox, ...(c.after ? [c.after.pawnBox, c.after.tagBox] : [])], [...pts, {x: c.x, y: c.y}], acc, skipped);
      if (found) return;
      acc[i] = null;
    }
    // no room for this fact on this branch: go on without it
    if (!best || facts.length - skipped - 1 > best.n) dfs(k + 1, taken, pts, acc, skipped + 1);
    acc[i] = null;
  };
  let chosen = null;
  for (const pass of [true, false]) {
    strict = pass;
    for (const sc of slipCands) {
      best = null;
      found = false;
      const taken = [...reserve];
      if (sc) taken.push({x: sc.x - 8, y: sc.y - 8, w: slip.W + 16, h: slip.H + 16});
      dfs(0, taken, [], res.facts.map(() => null), 0);
      if (best && (!chosen || best.n > chosen.best.n)) chosen = {sc, best};
      if (found) break;
    }
    if (found) break;
  }
  const slots = res.facts.map((_, i) => {
    const c = chosen && chosen.best.slots[i];
    return c ? {x: c.x, y: c.y, tagBox: c.tagBox, pawnBox: c.pawnBox, side: c.side} : null;
  });
  const fa = NR && chosen && chosen.best.slots[NR.i] ? chosen.best.slots[NR.i].after : null;
  return {slipSpot: chosen ? chosen.sc : null, slots, afterSlot: fa ? {x: fa.x, y: fa.y, pawnBox: fa.pawnBox, tagBox: fa.tagBox, side: fa.side} : null};
}

/** Area each zone has to host (slip in the text's zone, one footprint per fact). */
export function zoneDemand(res, slip, tags) {
  const d = res.zones.map(() => 0);
  if (slip && res.textZone >= 0) d[res.textZone] += (slip.W + 40) * (slip.H + 40);
  res.facts.forEach((f, i) => {
    if (f.zone >= 0) d[f.zone] += (2 * TOKEN_R + 40 + tags[i].tw) * Math.max(2 * TOKEN_R + 40, tags[i].th + 30);
  });
  return d;
}

/* ------------------------------------------------------------------ */
/* Arms                                                                */
/* ------------------------------------------------------------------ */

export const ARM_W = 54;
const ARM_EXT = 0.94;

/**
 * An arm entering from outside the stage window: its length covers every
 * target, and the shoulder is placed along the anchor direction so each
 * target is reached (the shoulder is always outside the window).
 */
export function makeArm(ctx, {name, anchor, targets, W, H, look, side = 'right', width = ARM_W}) {
  const lenFor = q => (exitDistance(q, unit(q, anchor), W, H) + width * 1.6) / ARM_EXT;
  const len = Math.max(420, ...targets.map(lenFor));
  const HAND = 24 * 1.3 * (width / 46);
  const rig = topArm(ctx, {name, skin: look.skin, sleeve: look.outfit, handed: side === 'left' ? 'left' : 'right', upper: (len - HAND) * 0.52, lower: (len - HAND) * 0.48, width, handScale: 1.3});
  const bend = side === 'left' ? 1 : -1;
  const out = q => {
    const d = unit(q, anchor);
    const dd = exitDistance(q, d, W, H) + width * 4.5;
    return {x: q.x + d.x * dd, y: q.y + d.y * dd};
  };
  const solve = target => {
    const d = unit(target, anchor);
    const shoulder = {x: target.x + d.x * len * ARM_EXT, y: target.y + d.y * len * ARM_EXT};
    return rig.pose(shoulder, target, bend);
  };
  return {rig, anchor, len, out, solve, node: g(null, rig.palm, rig.thumb, rig.arm)};
}

/** Grip point of a pawn for an arm: just off the pawn toward the arm (fingers over the pawn). */
export const pawnGrip = (q, anchor, off = 30) => {
  const d = unit(q, anchor);
  return {x: q.x + d.x * off, y: q.y + d.y * off};
};

/** Arc between two points (lifted midpoint). */
export function arcPath(a, b, lift) {
  const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - lift};
  return polyline(catmullRom([a, m, b], 18));
}

export const mixP = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t});
export const R2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);

/* ------------------------------------------------------------------ */
/* Board stage (story; context of the inspect)                         */
/* ------------------------------------------------------------------ */

/** Design size of the board stage per shape (≈ the caption-safe box at 1080p, so design px ≈ output px). */
export const STAGE = {landscape: {w: 1690, h: 738}, portrait: {w: 950, h: 1359}, square: {w: 950, h: 738}};

/**
 * Regions per shape (stage units). hier = organiser, board = zone board,
 * dish = fact dish, lupa = magnifier rest (lens centre, rot), key = key card,
 * arms: L (slip) and R (tokens + magnifier) anchors far outside the window.
 */
export const STAGE_GEO = {
  landscape: {
    hier: {x: 14, y: 14, w: 392, h: 710, arrangement: 'column'},
    board: {x: 420, y: 10, w: 886, h: 718, R: 42},
    dish: {x: 1340, y: 62, w: 316, h: 90, labelAbove: true},
    lupa: {x: 1420, y: 240, rot: -90},
    key: {x: 1320, w: 356, bottom: 726},
    chip: {x: 1498, aboveKey: true, anchor: 'middle'},
    slipW: 300, keySize: 20,
    arms: {L: {anchor: {x: 330, y: 2600}, side: 'left'}, R: {anchor: {x: 1560, y: 2600}, side: 'right'}},
  },
  portrait: {
    hier: {x: 14, y: 14, w: 922, h: 322, arrangement: 'row'},
    board: {x: 14, y: 346, w: 922, h: 736, R: 42},
    dish: {x: 24, y: 1126, w: 290, h: 78, labelAbove: true},
    lupa: {x: 100, y: 1280, rot: -90},
    key: {x: 574, w: 362, bottom: 1345},
    chip: {x: 332, y: 1136, anchor: 'start'},
    slipW: 300, keySize: 20,
    arms: {L: {anchor: {x: 340, y: -2600}, side: 'right'}, R: {anchor: {x: 520, y: 4200}, side: 'right'}},
  },
  square: {
    hier: {x: 604, y: 14, w: 332, h: 488, arrangement: 'column'},
    board: {x: 14, y: 10, w: 580, h: 632, R: 32, axis: 'y', splitRange: [0.3, 0.72]},
    dish: {x: 640, y: 540, w: 250, h: 64, labelAbove: true},
    lupa: {x: 896, y: 690, rot: 90, R: 40, L: 92},
    key: {x: 14, w: 580, bottom: 728, strip: true},
    chip: {x: 606, y: 620, anchor: 'start', maxWidth: 246},
    slipW: 300, slipFs: 0.91, keySize: 18, slipExit: 'left',
    arms: {L: {anchor: {x: 3400, y: 240}, side: 'right'}, R: {anchor: {x: 780, y: 3400}, side: 'right'}},
  },
};

const LUPA_R = 60, LUPA_L = 110;
const LUPA_ZOOM = 1.45;

/**
 * The board stage: desk, organiser with the books, the zone board, the fact
 * dish, the magnifier, the key and (optionally) the two arms.
 * @param {any} ctx
 * @param {{prefix:string, shape:'landscape'|'portrait'|'square', params:any, res:any, arms?:boolean,
 *   examine?:number|null, alt?:{index:number, zone:number, rel:string}|null, lupa?:boolean}} o
 */
export function boardStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const shape = o.shape;
  // o.geo: per-scene overrides of the stage geometry (one level deep)
  const G = o.geo ? Object.fromEntries(Object.entries({...STAGE_GEO[shape], ...o.geo}).map(([k, v]) => [k, o.geo[k] && STAGE_GEO[shape][k] && typeof v === 'object' ? {...STAGE_GEO[shape][k], ...o.geo[k]} : v])) : STAGE_GEO[shape];
  const {w: W, h: H} = STAGE[shape];
  const p = o.params;
  const t = kitStrings(p.locale);
  const res = o.res;
  const showKey = ctx.show('key');

  /* --- desk ------------------------------------------------------------ */
  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, mat: false, seedKey: 'at-desk'});

  /* --- organiser + books ---------------------------------------------- */
  const levels = p.hierarchy.levels.slice(0, 2);
  const nL = levels.length;
  const org = hierarchyOrganiser(ctx, {prefix: `${P}-org`, ...G.hier, levels, arrangement: G.hier.arrangement, plateFs: G.hier.plateFs});
  const placeOf = i => clamp(Math.round(p.hierarchy.placement[i] ?? Math.min(i, nL - 1)), 0, nL - 1);
  const nS = Math.min(2, p.sources.length);
  const byComp = org.comps.map(() => []);
  for (let i = 0; i < nS; i++) byComp[placeOf(i)].push(i);
  // the slip (full size; it is only partly visible while in the book)
  const bookBoxes = [];
  const books = [];
  let slip = null, slipRest = null, slipPulled = null;
  const sw = G.slipW;
  const sfs = G.slipFs ?? 1;
  const ss = slipSize(ctx, res.passage, sw, sfs);
  org.comps.forEach((cb, ci) => {
    const list0 = byComp[ci];
    if (!list0.length) return;
    const fr = cb.free;
    const gap = 14;
    const bw = list0.length === 1 ? Math.min(fr.w - 28, 360) : (fr.w - 28 - gap) / 2;
    list0.forEach((si, k) => {
      const bx = fr.x + (fr.w - (list0.length === 1 ? bw : bw * 2 + gap)) / 2 + k * (bw + gap);
      let top = fr.y + 10;
      let bh;
      if (si === 0) {
        // tucked in the book the slip is scaled down (k); it is full size on the board
        // the label always keeps room: the slip is tucked deeper when the compartment is short
        const labelMin = bookLabelMin(ctx, p.sources[0], bw);
        const k = Math.max(0.3, Math.min(1, (bw - 44) / sw, (fr.h - 26) / ss.H, (fr.h - labelMin - 22) / ss.protrude));
        top = fr.y + ss.protrude * k + 6;
        bh = Math.max(bookNeed(ctx, p.sources[0], bw), (ss.H - ss.protrude) * k + 14, Math.min(bw * 0.62, fr.h - 30 - ss.protrude * k));
        bh = Math.min(bh, fr.y + fr.h - top - 4);
        slip = articleSlip(ctx, {prefix: `${P}-slip`, passage: res.passage, zoneIdx: res.textZone, W: sw, fs: sfs});
        // noTuck: the slip already lies on the board (inspect), so the book keeps its full height for its label
        if (o.noTuck) {
          top = fr.y + 10;
          bh = Math.min(Math.max(bookNeed(ctx, p.sources[0], bw), Math.min(bw * 0.62, fr.h - 30)), fr.y + fr.h - top - 4);
        }
        const exitL = G.slipExit === 'left';
        slipRest = {x: bx + (bw - sw * k) / 2 + (exitL ? -8 : 8), y: top - ss.protrude * k, rot: 0, k};
        // the slip slides out through the fore-edge (between the pages), toward the board
        slipPulled = {x: exitL ? bx - 12 - sw * k : bx + bw + 12, y: Math.max(8, slipRest.y - 24), rot: 0, k};
      } else {
        bh = Math.min(Math.max(bookNeed(ctx, p.sources[si], bw), Math.min(bw * 0.62, fr.h - 30)), fr.y + fr.h - top - 4);
      }
      const b = bookCover(ctx, {prefix: `${P}-book${si}`, x: bx, y: top, w: bw, h: bh, source: p.sources[si], color: COVER[si % 2], spine: si === 0 && G.slipExit === 'left' ? 'right' : 'left'});
      books[si] = b;
      bookBoxes.push(b.box);
    });
  });

  /* --- board, placements ---------------------------------------------- */
  const names = res.zones.map(z => z.name);
  const tagW = shape === 'square' ? 150 : 210;
  // bounded fallback: when not every matched fact finds room, the slip on the board and the tags
  // step down (text never below 16 px) and the placement is searched again
  const wanted = res.facts.filter(f => f.zone >= 0).length;
  const F = o.focus || null;
  // a key strip under the board: the board ends above the tallest strip the key can need
  const boardRect0 = G.key.strip ? {...G.board, h: Math.min(G.board.h, G.key.bottom - keyHeight(ctx, G.key.w, o.keySize ?? G.keySize, true) - 10 - G.board.y)} : G.board;
  // o.strips (opt-in): three zones as side-by-side strips
  const boardRect = o.strips && res.zones.length === 3 ? {...boardRect0, strips: true} : boardRect0;
  let fits, subFits = null, dimsOf, B, placed, sc = 1;
  // o.fullSize (opt-in): the text keeps its size (the focus's new slot is then found by the search below)
  for (const k of o.fullSize ? [1] : [1, 0.9, 0.8]) {
    sc = k;
    fits = res.facts.map(f => (showKey ? tagFit(ctx, f.label, {maxWidth: tagW * (0.5 + k / 2), size: Math.max(16, 22 * k)}) : null));
    subFits = F ? [F.beforeText, F.afterText].map(tx => (showKey ? tagFit(ctx, tx, {maxWidth: tagW * (0.5 + k / 2) - 24, size: Math.max(16, 22 * k)}) : null)) : null;
    dimsOf = i => (F && i === F.index ? tagDims(fits[i], subFits) : fits[i] ? tagDims(fits[i]) : {tw: 150, th: 50});
    const sd = slip ? {W: slip.W * k, H: slip.H * k} : null;
    const demand = zoneDemand(res, sd, res.facts.map((_, i) => dimsOf(i)));
    if (F && F.after >= 0) {
      const d0 = dimsOf(F.index);
      demand[F.after] += (2 * TOKEN_R + 40 + d0.tw) * Math.max(2 * TOKEN_R + 40, d0.th + 30);
    }
    B = makeBoard(ctx, boardRect, names, 1, demand);
    placed = placeOnBoard(B, sd, res, res.facts.map((_, i) => dimsOf(i)), {...(F ? {near: {i: F.index, z: F.after}} : {}), ...(o.interior ? {interior: true} : {})});
    const okAfter = !F || !(F.after >= 0) || Boolean(placed.afterSlot);
    if ((placed.slots.filter(Boolean).length >= wanted && okAfter) || (slip && slip.minSize && slip.minSize * (k - 0.1) < 16)) break;
  }
  if (slip && slip.minSize) slip.minSize *= sc;
  const slipSpot = placed.slipSpot;
  const slipBoard = slipSpot ? {x: slipSpot.x, y: slipSpot.y, rot: -1.5, k: sc} : null;
  const spreadFrom = slipSpot ? {x: slipSpot.cx, y: slipSpot.cy} : {x: B.inner.x, y: B.inner.y};
  const board = boardArt(ctx, B, {prefix: `${P}-board`, names, textZone: slipSpot ? res.textZone : -1, spreadFrom, staticSheet: o.staticSheet});
  // every supplied text drawn so far (captions are never larger than the smallest of them)
  const contentSizes = () => [...board.plaques.filter(q => q.fit).map(q => q.fit.size), ...(slip && slip.minSize ? [slip.minSize] : []), ...books.filter(b => b && b.minSize).map(b => b.minSize), ...(org.minSize ? [org.minSize] : [])];

  /* --- dish + tokens --------------------------------------------------- */
  const nF = res.facts.length;
  const D = G.dish;
  const nests = res.facts.map((_, k) => ({x: D.x + 44 + k * ((D.w - 88) / Math.max(1, nF - 1 || 1)) * (nF > 1 ? 1 : 0) + (nF === 1 ? (D.w - 88) / 2 : 0), y: D.y + D.h / 2}));
  const dishLabelText = (p.objectLabels && p.objectLabels.dish) || t.tray;
  const capSize = Math.min(20, ...fits.filter(Boolean).map(f => f.size), ...contentSizes());
  // noDish: a table whose facts all lie on the board from the start (inspect) has no fact dish
  const dish = o.noDish ? {node: null, nests, labelBox: null, box: {x: D.x, y: D.y, w: 0, h: 0}}
    : factDish(ctx, {prefix: `${P}-dish`, x: D.x, y: D.y, w: D.w, h: D.h, nests, label: dishLabelText, labelMax: D.w + 40, labelSize: capSize});
  const slots = placed.slots;
  const tokens = res.facts.map((f, i) => pawnToken(ctx, {prefix: `${P}-tok${i}`, fact: f, color: PAWN[i % 3], fit: fits[i], side: slots[i] ? slots[i].side : 'right',
    subs: F && i === F.index ? [{fit: subFits[0], zone: f.zone}, {fit: subFits[1], zone: F.after}] : null}));
  /* --- focus (inspect): the slot the pawn takes after the substitution, near its first slot, same tag side */
  let afterSlot = placed.afterSlot || null;
  if (!afterSlot && F && slots[F.index] && F.after >= 0) {
    const i0 = F.index, q0 = slots[i0];
    const {tw, th: tH} = dimsOf(i0);
    const taken = [];
    if (slipSpot) taken.push({x: slipSpot.x - 8, y: slipSpot.y - 8, w: slip.W * sc + 16, h: slip.H * sc + 16});
    slots.forEach((q, i) => { if (q && i !== i0) taken.push(q.pawnBox, q.tagBox); });
    let best = null, bs = -Infinity;
    const inner = B.inner;
    for (const pass of [true, false]) {
      for (const t of B.zones[F.after].tiles) {
        // (interior: the tag may also hang above or below its pawn)
        for (const side of o.interior ? ['right', 'left', 'bottom', 'top'] : ['right', 'left']) {
          const pawnBox = {x: t.cx - TOKEN_R - 11, y: t.cy - TOKEN_R - 11, w: 2 * TOKEN_R + 22, h: 2 * TOKEN_R + 22};
          const tagBox = tagBoxAt(side, t.cx, t.cy, tw, tH);
          if (!inBox(pawnBox, inner, 2) || !inBox(tagBox, inner, 6)) continue;
          if (taken.some(q => boxHit(pawnBox, q, 6) || boxHit(tagBox, q, 6))) continue;
          if (B.zoneAt(t.cx, t.cy) !== F.after) continue;
          if (o.interior && !pawnInterior(B, {x: t.cx, y: t.cy}, F.after)) continue;
          const pc = B.coverage(pawnBox, F.after, 4), tc = B.coverage(tagBox, F.after, 5);
          const bd = B.boundaryDist({x: t.cx, y: t.cy});
          // (interior: the pawn is already clear of every border; strict and relaxed tags compete in one pass)
          if (pass && !o.interior && (pc < 0.99 || tc < 0.7 || bd < TOKEN_R + 14)) continue;
          if (!pass && o.interior) continue;
          // nearest to the first place; the tag keeps its side when it can
          // (interior: a tag that changes orientation would widen the detail window: kept only as a last resort)
          const score = -Math.hypot(t.cx - q0.x, t.cy - q0.y) + tc * 60 - (side === q0.side ? 0 : o.interior && (side === 'top' || side === 'bottom') ? 400 : 40);
          if (score > bs) { bs = score; best = {x: t.cx, y: t.cy, pawnBox, tagBox, side}; }
        }
      }
      if (best) break;
    }
    afterSlot = best;
  }
  // the focus pawn after the move: an identical pawn whose tag opens on the side of its new place
  // (the two are swapped while the tag is folded in, so nothing jumps)
  const tokenB = F && slots[F.index] ? pawnToken(ctx, {prefix: `${P}-tok${F.index}b`, fact: res.facts[F.index], color: PAWN[F.index % 3], fit: fits[F.index], side: afterSlot ? afterSlot.side : slots[F.index].side,
    subs: [{fit: subFits[0], zone: res.facts[F.index].zone}, {fit: subFits[1], zone: F.after}]}) : null;
  const finalOf = i => (slots[i] ? {x: slots[i].x, y: slots[i].y} : nests[i]);

  /* --- magnifier -------------------------------------------------------- */
  const useLupa = o.lupa !== false;
  const LR = G.lupa.R ?? LUPA_R, LL = G.lupa.L ?? LUPA_L;
  const lupa = lupaArt(ctx, {prefix: `${P}-lupa`, R: LR, L: LL});
  const lupaRest = {x: G.lupa.x, y: G.lupa.y, rot: G.lupa.rot};
  const exIdx = o.examine ?? null;
  const armRSpec = G.arms.R;
  let lupaExam = null;
  if (exIdx !== null && slots[exIdx]) {
    const q = slots[exIdx];
    const d = unit(q, armRSpec.anchor);
    // the lens frames the pawn and, when it is near, the boundary beside it
    let bp = null, bd = Infinity;
    for (const e of B.boundary) {
      const m = {x: (e.a.x + e.b.x) / 2, y: (e.a.y + e.b.y) / 2};
      const dd = Math.hypot(m.x - q.x, m.y - q.y);
      if (dd < bd) { bd = dd; bp = m; }
    }
    const off = bp && bd < 160 ? Math.min(24, bd * 0.4) : 0;
    const dir = bp ? unit(q, bp) : {x: 0, y: 0};
    lupaExam = {x: q.x + dir.x * off, y: q.y + dir.y * off, rot: (Math.atan2(-d.x, d.y) * 180) / Math.PI};
  }
  // magnified copy of the board around the examined token (text-free, final placements)
  let magNode = null;
  if (lupaExam && useLupa) {
    const copy = boardArt(ctx, B, {prefix: `${P}-mgb`, names, textZone: slipSpot ? res.textZone : -1, staticSheet: true, noText: true, plaques: false});
    const toks = res.facts.map((f, i) => (slots[i] ? g({transform: T(slots[i].x, slots[i].y)}, pawnToken(ctx, {prefix: `${P}-mgt${i}`, fact: f, color: PAWN[i % 3], fit: fits[i], noText: true, rings: false, open: 1, side: slots[i].side}).node,
      f.rel === 'shared' ? h('circle', {r: TOKEN_R + 9, fill: 'none', stroke: sheetDark(ctx), 'stroke-width': 5.5})
        : h('circle', {r: TOKEN_R + 9, fill: 'none', stroke: NEUTRAL, 'stroke-width': 4, 'stroke-dasharray': '7 6'})) : null));
    magNode = g({name: `${P}-mag`, opacity: 0},
      h('defs', null, h('clipPath', {id: ctx.id(`${P}-magclip`)}, h('circle', {name: `${P}-magc`, r: LR - 6}))),
      g({'clip-path': ctx.ref(`${P}-magclip`)},
        h('circle', {name: `${P}-magbg`, r: LR, fill: '#e8f2f7'}),
        g({name: `${P}-magzoom`}, copy.node, toks)));
  }

  /* --- key, reader chip (captions never larger than the smallest supplied text) */
  const contentMin = Math.min(...fits.filter(Boolean).map(f => f.size), ...contentSizes());
  const keySize = Math.min(o.keySize ?? G.keySize, Number.isFinite(contentMin) ? contentMin : 99);
  const kh = keyHeight(ctx, G.key.w, keySize, G.key.strip);
  const key = keyCard(ctx, {prefix: `${P}-key`, x: G.key.x, y: G.key.bottom - kh, w: G.key.w, size: keySize, strip: G.key.strip});

  /* --- arms --------------------------------------------------------------- */
  const look = actorLook(ctx, {appearance: {skin: 2, outfit: 0}}, 0);
  const slipGripAt = pose => {
    if (!slip) return null;
    const k = pose.k ?? 1, a = ((pose.rot || 0) * Math.PI) / 180;
    const gx = slip.grip.x * k, gy = slip.grip.y * k;
    return {x: pose.x + gx * Math.cos(a) - gy * Math.sin(a), y: pose.y + gx * Math.sin(a) + gy * Math.cos(a)};
  };
  const lupaGripAt = pose => lupaPoint(pose, lupa.grip);
  let armL = null, armR = null;
  if (o.arms !== false) {
    if (slip && slipBoard) {
      armL = makeArm(ctx, {name: `${P}-armL`, anchor: G.arms.L.anchor, side: G.arms.L.side, W, H, look,
        targets: [slipGripAt(slipRest), slipGripAt(slipPulled), slipGripAt(slipBoard)]});
    }
    const tR = [...nests.map(q => pawnGrip(q, armRSpec.anchor)), ...slots.filter(Boolean).map(q => pawnGrip(q, armRSpec.anchor))];
    if (useLupa && lupaExam) tR.push(lupaGripAt(lupaRest), lupaGripAt(lupaExam));
    armR = makeArm(ctx, {name: `${P}-armR`, anchor: armRSpec.anchor, side: armRSpec.side, W, H, look: actorLook(ctx, {appearance: {skin: 2, outfit: 0}}, 0), targets: tR});
  }
  let chipNode = null;
  if (o.arms !== false && showKey && G.chip) {
    const text = (p.actorLabels && p.actorLabels.a) || t.reader;
    const cy = G.chip.aboveKey ? key.box.y - 58 : G.chip.y;
    chipNode = chipBox(ctx, text, {x: G.chip.x, y: cy, anchor: G.chip.anchor, size: keySize, maxWidth: G.chip.maxWidth ?? 300, name: `${P}-chip`, icon: {skin: look.skin, sleeve: look.outfit}});
  }

  /* --- node tree ------------------------------------------------------------ */
  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      org.node,
      board.node,
      dish.node,
      key.node,
      // the slip lies above every book except its own (it is tucked into Text 1)
      books.filter((b, i) => b && i > 0).map(b => b.node),
      slip ? slip.node : null,
      books[0] ? books[0].node : null,
      tokens.map(tk => tk.node),
      tokenB ? tokenB.node : null,
      useLupa ? lupa.back : null, magNode, useLupa ? lupa.front : null,
      armL ? armL.node : null,
      armR ? armR.node : null,
    ),
    desk.frame,
    chipNode ? chipNode.node : null,
  );

  /**
   * Pose. `L` / `R` are the arms' step lists [{kind, k?, p}] in time order
   * (p = local progress, 0 before the step starts). Kinds — L: go, pull,
   * carry, lay, out. R: go (to nest k), carry (token k), set (token k),
   * toLupa, lupaTo, exam, lupaBack, out.
   * @param {{L?:any[], R?:any[], spread?:number, tags?:number[], rings?:number[], preplaced?:boolean}} v
   */
  function pose(v) {
    const nodes = {};
    let reachedAll = true;
    /* slip */
    let slipPose = slip ? {...slipRest} : null;
    let slipHolder = 'book';
    let handL = null;
    if (v.preplaced && slip && slipBoard) {
      slipPose = {...slipBoard};
      slipHolder = 'board';
    }
    const outL = armL ? armL.out(slipGripAt(slipRest)) : null;
    let slipBodyOn = v.preplaced ? 1 : 0;
    if (v.L) {
      const pl = v.L.find(q => q.kind === 'pull'), ca = v.L.find(q => q.kind === 'carry');
      if (pl && pl.p >= 1) slipBodyOn = ca ? clamp(ca.p / 0.3) : 1;
    }
    if (armL && v.L) {
      let cur = outL;
      let target = outL;
      for (const st of v.L) {
        if (st.p <= 0) break;
        const e = ease.inOutSine(clamp(st.p));
        if (st.kind === 'go') {
          target = mixP(cur, slipGripAt(slipRest), e);
          cur = slipGripAt(slipRest);
        } else if (st.kind === 'pull') {
          const ep = ease.inOutQuad(clamp(st.p));
          slipPose = {...slipRest, x: lerp(slipRest.x, slipPulled.x, ep), y: lerp(slipRest.y, slipPulled.y, ep)};
          slipHolder = 'hand';
          target = slipGripAt(slipPose);
          cur = target;
        } else if (st.kind === 'carry') {
          const path = arcPath(slipPulled, slipBoard, 60);
          const q = path.at(e);
          slipPose = {x: q.x, y: q.y, rot: lerp(0, slipBoard.rot, e) + Math.sin(e * Math.PI) * 4, k: lerp(slipRest.k, 1, e)};
          slipHolder = 'hand';
          target = slipGripAt(slipPose);
          cur = target;
        } else if (st.kind === 'lay') {
          slipPose = {...slipBoard};
          slipHolder = st.p >= 1 ? 'board' : 'hand';
          target = slipGripAt(slipPose);
          cur = target;
        } else if (st.kind === 'out') {
          slipPose = {...slipBoard};
          slipHolder = 'board';
          target = mixP(cur, armL.out(cur), e);
        }
      }
      const sol = armL.solve(target);
      Object.assign(nodes, sol.nodes);
      if (!sol.reached) reachedAll = false;
      handL = sol.hand;
      // the slip rides the solved hand while held
      if (slipHolder === 'hand') {
        const gq = slipGripAt(slipPose);
        slipPose = {...slipPose, x: slipPose.x + handL.x - gq.x, y: slipPose.y + handL.y - gq.y};
      }
    } else if (armL) {
      const sol = armL.solve(outL);
      Object.assign(nodes, sol.nodes);
      handL = sol.hand;
    }
    if (slip) {
      nodes[`${P}-slip`] = {transform: T(slipPose.x, slipPose.y, slipPose.rot, slipPose.k ?? 1)};
      // the body text of the slip is only printed once the slip is out of the book (never under the cover)
      if (slip.hasBody) nodes[`${P}-slip-body`] = {opacity: r(slipHolder === 'book' ? 0 : slipBodyOn, 3)};
    }
    /* spread of the text's sheet */
    const spread = clamp(v.spread ?? 0);
    if (board.hasSheet && !o.staticSheet) {
      nodes[`${P}-board-ov`] = {opacity: spread > 0 ? 1 : 0};
      nodes[`${P}-board-ovc`] = {r: r(board.sheetFar * ease.inOutSine(spread))};
    }

    /* tokens + lupa (arm R) */
    const tokPose = res.facts.map((_, i) => (v.preplaced && slots[i] ? {...slots[i], s: 1} : {...nests[i], s: 1}));
    const tokHolder = res.facts.map((_, i) => (v.preplaced && slots[i] ? 'board' : 'dish'));
    let lPose = {...lupaRest};
    let lupaHolder = 'rest';
    let handR = null;
    let heldR = null;
    const outR = armR ? armR.out(pawnGrip(nests[0], armRSpec.anchor)) : null;
    if (armR) {
      let cur = outR;
      let target = outR;
      let heldTok = -1, heldLupa = false;
      for (const st of v.R || []) {
        if (st.p <= 0) break;
        const e = ease.inOutSine(clamp(st.p));
        heldTok = -1;
        heldLupa = false;
        if (st.kind === 'go') {
          const to = pawnGrip(nests[st.k], armRSpec.anchor);
          target = arcPath(cur, to, 40).at(e);
          cur = to;
        } else if (st.kind === 'carry') {
          const k = st.k;
          const q = arcPath(nests[k], slots[k], 70).at(e);
          tokPose[k] = {x: q.x, y: q.y, s: 1 + 0.1 * Math.sin(Math.min(1, e * 1.6) * Math.PI / 2)};
          tokHolder[k] = 'hand';
          heldTok = k;
          target = pawnGrip(tokPose[k], armRSpec.anchor);
          cur = target;
        } else if (st.kind === 'set') {
          const k = st.k;
          tokPose[k] = {x: slots[k].x, y: slots[k].y, s: lerp(1.1, 1, e)};
          tokHolder[k] = st.p >= 1 ? 'board' : 'hand';
          if (st.p < 1) heldTok = k;
          target = pawnGrip(slots[k], armRSpec.anchor);
          cur = target;
        } else if (st.kind === 'toLupa') {
          const to = lupaGripAt(lupaRest);
          target = arcPath(cur, to, 40).at(e);
          cur = to;
        } else if (st.kind === 'lupaTo') {
          const path = arcPath(lupaRest, lupaExam, 50);
          const q = path.at(e);
          lPose = {x: q.x, y: q.y, rot: lerp(lupaRest.rot, lupaExam.rot, e)};
          lupaHolder = 'hand';
          heldLupa = true;
          target = lupaGripAt(lPose);
          cur = target;
        } else if (st.kind === 'exam') {
          const wob = ctx.reduced ? 0 : Math.sin(st.p * Math.PI * 2) * 5;
          lPose = {x: lupaExam.x + wob, y: lupaExam.y - Math.sin(st.p * Math.PI) * 3, rot: lupaExam.rot};
          lupaHolder = 'hand';
          heldLupa = true;
          target = lupaGripAt(lPose);
          cur = target;
        } else if (st.kind === 'lupaBack') {
          const path = arcPath(lupaExam, lupaRest, 50);
          const q = path.at(e);
          lPose = {x: q.x, y: q.y, rot: lerp(lupaExam.rot, lupaRest.rot, e)};
          lupaHolder = st.p >= 1 ? 'rest' : 'hand';
          heldLupa = st.p < 1;
          target = lupaGripAt(lPose);
          cur = target;
        } else if (st.kind === 'out') {
          target = mixP(cur, armR.out(cur), e);
        }
      }
      const sol = armR.solve(target);
      Object.assign(nodes, sol.nodes);
      if (!sol.reached) reachedAll = false;
      handR = sol.hand;
      if (heldTok >= 0) {
        const gq = pawnGrip(tokPose[heldTok], armRSpec.anchor);
        tokPose[heldTok] = {...tokPose[heldTok], x: tokPose[heldTok].x + handR.x - gq.x, y: tokPose[heldTok].y + handR.y - gq.y};
        heldR = pawnGrip(tokPose[heldTok], armRSpec.anchor);
      }
      if (heldLupa) {
        const gq = lupaGripAt(lPose);
        lPose = {...lPose, x: lPose.x + handR.x - gq.x, y: lPose.y + handR.y - gq.y};
        heldR = lupaGripAt(lPose);
      }
    }
    const tags = res.facts.map((_, i) => clamp((v.tags && v.tags[i]) || 0));
    const rings = res.facts.map((_, i) => clamp((v.rings && v.rings[i]) || 0));
    let focusSem = null;
    if (F && slots[F.index]) {
      // the substituted datum: the zone line swaps, the tag folds in, the pawn crosses to its new slot, the tag opens again
      const fv = v.focus || {};
      const i0 = F.index, q0 = slots[i0];
      const to = afterSlot || nests[i0];
      const mv = ease.inOutSine(clamp(fv.move || 0));
      const q = arcPath(q0, to, 36).at(mv);
      tokPose[i0] = {x: q.x, y: q.y, s: 1 + 0.08 * Math.sin(mv * Math.PI)};
      if (clamp(fv.move || 0) >= 1) tokHolder[i0] = afterSlot ? 'board' : 'dish';
      tags[i0] = fv.tag ?? tags[i0];
      const sw = clamp(fv.sub || 0);
      for (const nm of [`${P}-tok${i0}`, `${P}-tok${i0}b`]) {
        nodes[`${nm}-sub0`] = {opacity: r(1 - clamp(sw * 2), 3), transform: `translate(0 ${r(-8 * clamp(sw * 2))})`};
        nodes[`${nm}-sub1`] = {opacity: r(clamp(sw * 2 - 1), 3), transform: `translate(0 ${r(8 * (1 - clamp(sw * 2 - 1)))})`};
        if (subFits && subFits[0]) nodes[`${nm}-strike`] = {opacity: r(clamp(fv.strike || 0), 3)};
      }
      focusSem = {datum: sw <= 0 ? 'before' : sw >= 1 ? 'after' : 'changing', pos: R2(tokPose[i0]), at: clamp(fv.move || 0) <= 0 ? 'before' : clamp(fv.move || 0) >= 1 ? 'after' : 'moving', relShown: clamp(fv.rel || 0) >= 1 ? F.rel : clamp(fv.rel || 0) <= 0 ? res.facts[i0].rel : 'changing'};
    }
    res.facts.forEach((f, i) => {
      const q = tokPose[i];
      nodes[`${P}-tok${i}`] = {transform: T(q.x, q.y, 0, q.s)};
      nodes[`${P}-tok${i}-slide`] = tagSlide(tokens[i], tags[i]);
      let sOp = f.rel === 'shared' ? rings[i] : 0, dOp = f.rel !== 'shared' ? rings[i] : 0;
      if (F && i === F.index) {
        const e = clamp((v.focus && v.focus.rel) || 0);
        const a = F.rel === 'shared' ? rings[i] : 0, b = F.rel !== 'shared' ? rings[i] : 0;
        sOp = lerp(sOp, a, e);
        dOp = lerp(dOp, b, e);
      }
      nodes[`${P}-tok${i}-ringS`] = {opacity: r(sOp, 3)};
      nodes[`${P}-tok${i}-ringD`] = {opacity: r(dOp, 3)};
      if (tokenB && i === F.index) {
        const moved = clamp((v.focus && v.focus.move) || 0) > 0;
        nodes[`${P}-tok${i}`].opacity = moved ? 0 : 1;
        nodes[`${P}-tok${i}b`] = {transform: T(q.x, q.y, 0, q.s), opacity: moved ? 1 : 0};
        nodes[`${P}-tok${i}b-slide`] = tagSlide(tokenB, moved ? tags[i] : 0);
        nodes[`${P}-tok${i}b-ringS`] = {opacity: r(sOp, 3)};
        nodes[`${P}-tok${i}b-ringD`] = {opacity: r(dOp, 3)};
      }
    });
    if (useLupa) {
      const lt = T(lPose.x, lPose.y, lPose.rot);
      nodes[`${P}-lupa-back`] = {transform: lt};
      nodes[`${P}-lupa-front`] = {transform: lt};
    }
    if (magNode) {
      const q = lupaExam;
      const dist = Math.hypot(lPose.x - q.x, lPose.y - q.y);
      const vis = clamp(1 - (dist - 8) / 60);
      nodes[`${P}-mag`] = {opacity: r(vis, 3)};
      nodes[`${P}-magc`] = {cx: r(lPose.x), cy: r(lPose.y)};
      nodes[`${P}-magbg`] = {cx: r(lPose.x), cy: r(lPose.y)};
      nodes[`${P}-magzoom`] = {transform: `translate(${r(lPose.x)} ${r(lPose.y)}) scale(${LUPA_ZOOM}) translate(${r(-lPose.x)} ${r(-lPose.y)})`};
    }
    return {
      nodes,
      semantic: {
        slip: slipPose ? R2(slipPose) : null, slipHolder, slipGrip: slipPose ? R2(slipGripAt(slipPose)) : null,
        handL: R2(handL), handR: R2(handR), heldL: slipHolder === 'hand' ? R2(slipGripAt(slipPose)) : null, heldR: R2(heldR),
        tokens: tokPose.map(R2), holders: tokHolder, lupa: R2(lPose), lupaHolder,
        spread: r(spread, 3), tags: tags.map(x => r(x, 3)), rings: rings.map(x => r(x, 3)), focus: focusSem,
        allReached: reachedAll,
        ...Object.fromEntries(tokPose.map((q, i) => [`t${i}`, R2(q)])),
      },
    };
  }

  return {
    slipDims: slip ? {W: slip.W * sc, H: slip.H * sc} : null, boardScale: sc, afterSlot, subFits,
    node, pose, W, H, G, B, board, org, books, bookBoxes, slip, slipRest, slipBoard, slipSpot, dish, nests, tokens, slots, fits,
    lupa, lupaRest, lupaExam, examined: lupaExam ? exIdx : null, key, keySizeUsed: keySize, chipBox: chipNode ? chipNode.box : null, armL, armR, strings: t,
    tokenBoxes: res.facts.map((_, i) => {
      const q = finalOf(i);
      const tk = tokens[i];
      return {pawn: {x: q.x - TOKEN_R - 10, y: q.y - TOKEN_R - 10, w: 2 * TOKEN_R + 20, h: 2 * TOKEN_R + 20}, tag: {x: q.x + tk.tagBox.x, y: q.y + tk.tagBox.y, w: tk.tagBox.w, h: tk.tagBox.h}, side: tk.side};
    }),
    /** Lens box and handle box of the magnifier at a pose (tighter than one bounding box). */
    lupaBoxes: pose0 => {
      const q = pose0 || lupaRest;
      const a = lupaPoint(q, {x: 0, y: LR + 4}), b = lupaPoint(q, {x: 0, y: LR + 12 + LL});
      return [{x: q.x - LR - 6, y: q.y - LR - 6, w: 2 * LR + 12, h: 2 * LR + 12},
        {x: Math.min(a.x, b.x) - 14, y: Math.min(a.y, b.y) - 14, w: Math.abs(a.x - b.x) + 28, h: Math.abs(a.y - b.y) + 28}];
    },
    lupaBox: pose0 => {
      const q = pose0 || lupaRest;
      const end = lupaPoint(q, {x: 0, y: LR + 12 + LL});
      const x0 = Math.min(q.x - LR - 6, end.x - 14), x1 = Math.max(q.x + LR + 6, end.x + 14);
      const y0 = Math.min(q.y - LR - 6, end.y - 14), y1 = Math.max(q.y + LR + 6, end.y + 14);
      return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
    },
  };
}

/** Plain caption chip (white card), optionally with a small hand glyph (the reader). */
export function chipBox(ctx, text, o) {
  const th = ctx.theme;
  const size = o.size ?? 20;
  const ic = o.icon ? size * 1.5 : 0;
  // supplied label: a second line before any shrinking below 16 px
  const f = fitWords(ctx, text, {maxWidth: (o.maxWidth ?? 320) - ic, size, minSize: Math.min(size, 16), maxLines: o.maxLines ?? 2, weight: 600});
  const w = f.width + size * 1.3 + ic, hh = Math.max(f.height + size * 0.8, ic ? size * 1.7 : 0);
  const x = o.anchor === 'middle' ? o.x - w / 2 : o.anchor === 'end' ? o.x - w : o.x;
  const k = size / 20;
  const icon = o.icon ? g({transform: `${T(x + size * 0.5 + ic * 0.45, o.y + hh / 2 + 2 * k, -90)} scale(${r(k, 3)})`},
    h('rect', {x: -9, y: 2, width: 18, height: 14, rx: 3, fill: o.icon.sleeve, stroke: th.ink, 'stroke-width': 1.5}),
    h('rect', {x: -8, y: -1, width: 16, height: 5, rx: 2, fill: '#f4f1ea', stroke: th.ink, 'stroke-width': 1.2}),
    h('path', {d: 'M-8 -2C-9 -8 -8 -13 -6 -13C-4 -13 -4 -9 -4 -9L-4 -16C-4 -19 0 -19 0 -16L0 -17C0 -20 4 -20 4 -17L4 -15C4 -18 8 -18 8 -15L8 -2Z', fill: o.icon.skin, stroke: th.ink, 'stroke-width': 1.4, 'stroke-linejoin': 'round'})) : null;
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, 14)), fill: th.card, stroke: th.ink, 'stroke-width': 2}),
    icon,
    textBlock(f, {x: x + ic + (w - ic) / 2, y: o.y + (hh - f.height) / 2, anchor: 'middle', fill: th.ink}));
  return {node, box: {x, y: o.y, w, h: hh}, fit: f};
}

/* ------------------------------------------------------------------ */
/* Notes (annotations, attributed reading)                             */
/* ------------------------------------------------------------------ */

/**
 * Place editorial callouts and the attributed reading in free space: the
 * spot whose leader is shortest and crosses no obstacle wins.
 * @param {any} ctx
 * @param {{annots:Array<{text:string,target:{x:number,y:number}}>, reading?:{by:string,text:string,target:any}|null, cands:any[], obstacles:any[], lead?:any[], size:number}} o
 */
export function placeNotes(ctx, o) {
  const t = kitStrings(ctx.params.locale);
  const placed = [];
  const notes = [];
  let reading = null;
  const lead = o.lead || o.obstacles;
  if (o.reading) {
    const build = (c, tg) => readingNote(ctx, {name: 'reading', by: o.reading.by, text: o.reading.text, heading: t.reading, tagline: t.attributed, at: c, target: tg, size: o.size});
    reading = pickNote(o.cands, build, [...o.obstacles, ...placed], [...lead, ...placed], o.reading.target, o.bounds, o.penFn ? box => o.penFn(box, o.reading.target) : null);
    placed.push(reading.box);
  }
  o.annots.forEach((a, i) => {
    const make = (c, tg) => callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: c.x, y: c.y}, anchor: c.anchor, target: {x: tg.x, y: tg.y}, maxWidth: c.maxWidth, size: o.size, maxLines: 3});
    const c = pickNote(o.cands, make, [...o.obstacles, ...placed], [...lead, ...placed], a.target, o.bounds, o.penFn ? box => o.penFn(box, a.target) : null);
    placed.push(c.box);
    notes.push(c);
  });
  return {notes, reading, boxes: placed};
}

/**
 * Sticky note with a reading attributed to its fictional source, and a
 * dashed leader to what it refers to. It is never applied.
 */
export function readingNote(ctx, o) {
  const th = ctx.theme;
  const size = o.size ?? 19;
  const maxW = Math.min(o.at.maxWidth, 380);
  // supplied text: more lines before anything goes below 16 px
  const f1 = fitWords(ctx, `${o.heading} · ${o.by}`, {maxWidth: maxW - 30, size, minSize: Math.min(size, 16), maxLines: 3, weight: 700});
  const f2 = fitWords(ctx, `“${o.text}”`, {maxWidth: maxW - 30, size, minSize: Math.min(size, 16), maxLines: 6, weight: 500});
  const f3 = fitWords(ctx, o.tagline, {maxWidth: maxW - 30, size: Math.max(16, size * 0.9), minSize: 16, maxLines: 3, weight: 600});
  const w = Math.max(f1.width, f2.width, f3.width) + 30;
  const hh = f1.height + f2.height + f3.height + 44;
  const x = o.at.anchor === 'middle' ? o.at.x - w / 2 : o.at.anchor === 'end' ? o.at.x - w : o.at.x;
  const box = {x, y: o.at.y, w, h: hh};
  const tgt = {x: o.target.x, y: o.target.y};
  const from = leadFrom(box, tgt);
  const yellow = '#fbe7a1';
  const node = g({name: o.name, opacity: 0},
    h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(tgt.x)} ${r(tgt.y)}`, stroke: th.fgSoft, 'stroke-width': 2.4, 'stroke-dasharray': '7 6', fill: 'none'}),
    h('circle', {cx: r(tgt.x), cy: r(tgt.y), r: 6, fill: th.fgSoft}),
    h('path', {d: roundRectPath(box.x + 5, box.y + 7, box.w, box.h, 6), fill: th.shadow}),
    h('path', {d: `M${r(box.x)} ${r(box.y)}H${r(box.x + box.w)}V${r(box.y + box.h - 18)}L${r(box.x + box.w - 18)} ${r(box.y + box.h)}H${r(box.x)}Z`, fill: yellow, stroke: th.ink, 'stroke-width': 2}),
    h('path', {d: `M${r(box.x + box.w)} ${r(box.y + box.h - 18)}H${r(box.x + box.w - 18)}V${r(box.y + box.h)}Z`, fill: shade(yellow, -0.12), stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
    textBlock(f1, {x: box.x + 15, y: box.y + 12, fill: th.ink}),
    textBlock(f2, {x: box.x + 15, y: box.y + 12 + f1.height + 10, fill: th.ink, italic: true}),
    textBlock(f3, {x: box.x + 15, y: box.y + 12 + f1.height + 10 + f2.height + 10, fill: th.inkSoft}));
  return {node, box, frame: q => ({[o.name]: {opacity: r(clamp((q - 0.3) / 0.4), 3)}})};
}

/**
 * Pick the candidate whose note is clear of every obstacle, inside `bounds`,
 * and whose leader crosses no obstacle; score = leader length + the
 * candidate's penalty (`pen`). Falls back to the fewest crossings.
 */
export function pickNote(cands, build, obstacles, lead, target, bounds, penFn = null) {
  let best = null, bs = Infinity, fb = null, fs = Infinity;
  const tgts = [target, ...(target.alts || [])];
  for (const c of cands) {
    for (const tg of tgts) {
      const b = build(c, tg);
      const box = b.box;
      if (bounds && !(box.x >= bounds.x && box.y >= bounds.y && box.x + box.w <= bounds.x + bounds.w && box.y + box.h <= bounds.y + bounds.h)) continue;
      if (obstacles.some(q => boxHit(box, q, 6))) continue;
      const from = leadFrom(box, tg);
      const len = Math.hypot(tg.x - from.x, tg.y - from.y);
      const cross = lead.filter(q => segCrosses(from, tg, q)).length;
      const score = len + (c.pen || 0) + (penFn ? penFn(box, c) : 0);
      if (!cross && score < bs) { bs = score; best = {...b, score, target: tg}; }
      if (cross * 1e5 + score < fs) { fs = cross * 1e5 + score; fb = {...b, score: cross * 1e5 + score, target: tg}; }
    }
  }
  return best || fb || {...build(cands[0], target), score: 1e9, target};
}

function leadFrom(b, t) {
  const from = {x: Math.max(b.x, Math.min(t.x, b.x + b.w)), y: t.y > b.y + b.h ? b.y + b.h : t.y < b.y ? b.y : b.y + b.h / 2};
  if (from.y === b.y + b.h / 2) from.x = t.x > b.x + b.w / 2 ? b.x + b.w : b.x;
  return from;
}

/** Segment a→b passes through box q (ignoring the last 24 units at the target). */
function segCrosses(a, b, q) {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(2, Math.ceil(L / 8));
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (L * (1 - t) < 24) break;
    const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
    if (x > q.x + 2 && x < q.x + q.w - 2 && y > q.y + 2 && y < q.y + q.h - 2) return true;
  }
  return false;
}

/** Candidate note spots on a grid over free regions (stage units); `pen` is added to the leader length. */
export function gridCands(regions, step = 22) {
  const out = [];
  for (const rg of regions) {
    const cols = rg.cols || 1;
    for (let c = 0; c < cols; c++) {
      for (let y = rg.y; y <= rg.y + rg.h; y += step) out.push({x: rg.x + ((c + 0.5) * rg.w) / cols, y, anchor: 'middle', maxWidth: rg.maxWidth ?? rg.w, pen: rg.pen || 0});
    }
  }
  return out;
}

/**
 * Text-free ("greeked") copy of a virtual tree: every text becomes soft bars
 * of the same size and place (used for a context miniature whose text would
 * be illegibly small). Named texts keep their names so frames still apply.
 */
export function greek(node, keep = null) {
  if (typeof node === 'string' || !node) return node;
  if (keep && keep(node)) return node;
  if (node.tag === 'text') {
    const a = node.attrs;
    const fs = Number(a['font-size']) || 16, x = Number(a.x) || 0, y = Number(a.y) || 0;
    const anchor = a['text-anchor'] || 'start';
    const spans = node.children.filter(c => typeof c !== 'string' && c.tag === 'tspan');
    let dy = 0;
    const lines = spans.length
      ? spans.map((sp, i) => { dy += i ? Number(sp.attrs.dy) || 0 : 0; return {text: sp.children.filter(c => typeof c === 'string').join(''), y: y + dy}; })
      : [{text: node.children.filter(c => typeof c === 'string').join(''), y}];
    const bars = lines.filter(l => l.text.trim()).map(l => {
      const w = Math.max(fs * 0.6, l.text.length * fs * 0.5);
      const bx = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
      return h('rect', {x: r(bx), y: r(l.y - fs * 0.62), width: r(w), height: r(fs * 0.5), rx: r(fs * 0.25), fill: a.fill || '#1f2328', opacity: 0.45});
    });
    return g({name: a.name, opacity: a.opacity, transform: a.transform}, bars);
  }
  const attrs = node.attrs && node.attrs.name ? node.attrs : node.attrs;
  return {...node, attrs, children: node.children.map(c => greek(c, keep))};
}
