/**
 * Motif kit for "Consulta de expediente por auxiliar" (roles-09, LAW-0193..0196).
 *
 * An assistant consults a case file kept in a roll-top STEP CABINET standing on
 * the desk beside them. The cabinet holds numbered compartments (slots) in
 * steps: slot 1 is the lowest, front step; each higher step sits further back.
 * Every compartment holds one numbered piece (a folder); only its top strip is
 * visible above the wall of the step in front: the supplied title on the left
 * and an index TAB with the piece number on the right, next to the assistant.
 * The slot numbers are on brass plates on the cabinet's right post, level with
 * each strip. With labels hidden, tabs and plates show the number as dots.
 *
 * The kit draws only physical actions and supplied states: a piece is found by
 * its tab, lifted out of its compartment, handed from one hand to the other,
 * laid on the desk, opened, read, closed and put back. A piece can be supplied
 * as sitting in another compartment (in front of that compartment's own piece);
 * the kit never states or implies any consequence of where a piece sits (no
 * validity, loss, sanction, blame or outcome), and draws no verdict glyph
 * (no tick, no red cross, no warning triangle). An empty compartment is shown
 * neutrally: a dark gap with a dashed outline.
 *
 * Contents (geometry, props, pose solver and a choreography; each entry owns its
 * timeline windows, layout choices and semantics):
 *  - fields / defaults / strings shared by the entries; glueNums();
 *  - pieceColor, pips (number as dots), measurePieces (text-driven sizes);
 *  - pieceCard: a folder whose leaf and cover fold about the spine (bottom
 *    edge) so it can stand, tip back to lie on the desk and open its cover
 *    towards the viewer (projected heights, never mirrored text);
 *  - fileGeometry + fileStage: desk (front view, slightly from above), the
 *    step cabinet on the desk left of the assistant (optional roll-top cover),
 *    the assistant behind the desk (front-facing, IK arms, mitt/open hands),
 *    an optional visitor standing right of the desk with a speech bubble;
 *  - consultScript: rest → hand along the tabs → pinch → lift out → carry →
 *    hand-off to the other hand → lay on the desk → open → read → close →
 *    lift → hand-off back → carry → slide into the numbered slot → rest.
 *
 * Attachment rules (asserted by the entry tests through semantics):
 *  - a held piece is placed from the SOLVED hand (tab grip for the left hand,
 *    right-edge grip for the right hand); while both hands hold it, from the
 *    left hand; the opened cover follows the solved right hand on its tab;
 *  - the roll-top handle follows the solved left hand while it is pushed up;
 *  - every IK target is within reach (`allReached`).
 * @module animations/roles/kits/consulta-de-expediente
 */
import {h, g} from '../../../core/svg.js';
import {T, scaleAbout} from '../../../core/transform.js';
import {clamp, ease, lerp, r, seg} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, int, list, obj, party} from '../../../schemas/fields.js';
import {textBlock} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';
import {personRig} from '../../../primitives/person.js';
import {shade} from '../../../primitives/paper.js';
import {hairShape} from '../../../primitives/badges.js';
import {rotateAbout} from '../../../core/transform.js';
import {fitWords, wchip, overlaps} from './mediation-labels.js';

export {fitWords, wchip, overlaps};

const INK = '#1f2328';
const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/* ------------------------------------------------------------------ fields */

/** Keep a word and the number after it on one line ("Piece 3", "slot 5"). */
export const glueNums = t => String(t ?? '').replace(/(\S) (\d+)/g, '$1 $2').replace(/(\d+) (\S{1,2})(?=\s|$)/g, '$1 $2');

export const pieceField = obj('A numbered piece of the case file (fictional, supplied)', {
  number: int('Number on the piece’s index tab; the piece’s own slot carries the same number', 1, 9),
  title: str('Title printed on the piece (supplied text)', 60),
}, ['number', 'title']);

/** Category fields (roles) specialised for this motif. */
export const fileFields = {
  actors: list('The assistant who consults the case file and (optional second) the person who asked for the piece — fictional people', party, 1, 2),
  roles: obj('Descriptive role captions (not a legal finding)', {
    assistant: str('Role caption for the person who consults the file', 40),
    requester: str('Role caption for the person who asked for the piece', 40),
  }),
  props: obj('Case-file content, shown exactly as supplied', {
    pieces: list('Numbered pieces in slot order: slot k (from the front) holds the k-th piece', pieceField, 3, 5),
    target: int('Number of the piece that is looked up, taken out, consulted and put back', 1, 9),
    request: str('What the requester asks for (speech bubble)', 80),
    fileLabel: str('Label on the case-file cabinet (fictional identifier)', 50),
  }),
};

export const FILE_DEFAULTS = {
  actors: [
    {name: 'Lucía Ferrer', role: 'Court assistant'},
    {name: 'Omar Haddad', role: 'Requester'},
  ],
  roles: {assistant: 'Assistant', requester: 'Requester'},
  props: {
    pieces: [
      {number: 1, title: 'Initial filing'},
      {number: 2, title: 'Reply'},
      {number: 3, title: 'Inventory'},
      {number: 4, title: 'Hearing minutes'},
      {number: 5, title: 'Correspondence'},
    ],
    target: 3,
    request: 'Could I consult piece 3?',
    fileLabel: 'Case file 24/117 (fictional)',
  },
};

export const FILE_DEFAULTS_ES = {
  actors: [
    {name: 'Lucía Ferrer', role: 'Auxiliar'},
    {name: 'Omar Haddad', role: 'Solicitante'},
  ],
  roles: {assistant: 'Auxiliar', requester: 'Solicitante'},
  props: {
    pieces: [
      {number: 1, title: 'Escrito inicial'},
      {number: 2, title: 'Contestación'},
      {number: 3, title: 'Inventario'},
      {number: 4, title: 'Acta de vista'},
      {number: 5, title: 'Correspondencia'},
    ],
    target: 3,
    request: '¿Puedo consultar la pieza 3?',
    fileLabel: 'Expediente 24/117 (ficticio)',
  },
};

/** Built-in strings shared by the entries (merged into each entry's strings). */
export const FILE_STRINGS = {
  en: {
    keyNote: 'as supplied · no conclusion drawn', keyTab: 'tab = piece number', keyPlate: 'plate = slot number',
    piece: 'Piece', slot: 'slot', inSlot: 'in slot', foundAt: 'found at slot', qOpen: '“', qClose: '”',
  },
  es: {
    keyNote: 'según lo aportado · sin conclusión', keyTab: 'pestaña = número de pieza', keyPlate: 'placa = número de casilla',
    piece: 'Pieza', slot: 'casilla', inSlot: 'en la casilla', foundAt: 'hallada en la casilla', qOpen: '«', qClose: '»',
  },
};

/** Role caption of an actor id, falling back to the actor's own role. */
export function roleOf(p, id) {
  const idx = id === 'assistant' ? 0 : 1;
  return (p.roles && p.roles[id]) || (p.actors[idx] && p.actors[idx].role) || '';
}

/** "Name · role" caption. */
export function captionOf(p, id, override) {
  const idx = id === 'assistant' ? 0 : 1;
  const a = p.actors[idx];
  if (!a) return '';
  const role = override || roleOf(p, id);
  return role ? `${a.name} · ${role}` : a.name;
}

/**
 * Resolve the supplied pieces: unique numbers (a repeated number falls back to
 * its slot position), the index of the target piece (by number; default the
 * middle piece).
 */
export function resolvePieces(props) {
  const seen = new Set();
  const pieces = props.pieces.map((q, i) => {
    let n = q.number;
    if (seen.has(n)) n = i + 1;
    seen.add(n);
    return {number: n, title: q.title};
  });
  let ti = pieces.findIndex(q => q.number === props.target);
  if (ti < 0) ti = Math.floor((pieces.length - 1) / 2);
  return {pieces, target: ti};
}

/* ------------------------------------------------------------------ glyphs */

const PIECE_TINTS = ['#e3c16f', '#a9c4a0', '#9fb9d8', '#d6ab9c', '#b9aad6', '#e2b98a', '#a8cfc9', '#d3c08f', '#c7b3a1'];

/** Cover and tab colours of the piece at slot position i (identity only; never a state). */
export function pieceColor(ctx, i) {
  const base = PIECE_TINTS[i % PIECE_TINTS.length];
  return {cover: shade(base, 0.55), leaf: shade(base, 0.4), tab: base, tabInk: shade(base, -0.55), edge: shade(base, -0.2)};
}

/**
 * A number drawn as dots (1..9) centred on (cx, cy) inside a box of height hh.
 * Used on tabs and plates when labels are hidden, so the numbers still read.
 */
export function pips(n, {cx, cy, hh, fill, name}) {
  const k = clamp(Math.round(n), 1, 9);
  const cols = k <= 3 ? k : k <= 6 ? 3 : 3;
  const rows = Math.ceil(k / cols);
  const d = Math.min(hh * 0.8 / Math.max(rows, 2), hh * 0.34);
  const rr = d * 0.34;
  const out = [];
  for (let i = 0; i < k; i++) {
    const row = Math.floor(i / cols), col = i % cols;
    const inRow = Math.min(cols, k - row * cols);
    out.push(h('circle', {cx: r(cx + (col - (inRow - 1) / 2) * d), cy: r(cy + (row - (rows - 1) / 2) * d), r: r(rr), fill}));
  }
  return g({name}, out);
}

/* ------------------------------------------------------------------ pieces */

/**
 * Text-driven piece metrics at font size F (design units): card width W,
 * strip (visible top band in the cabinet), tab, hidden depth, lift.
 * @param {any} ctx
 * @param {{pieces:Array<{number:number,title:string}>, F:number, W:number, showText:boolean, maxLines?:number}} o
 */
export function measurePieces(ctx, o) {
  const F = o.F;
  const pad = 0.45 * F;
  const tabW = Math.max(ctx.measure('9', F, 800, 'sans') + 1.1 * F, 1.75 * F);
  const tabH = 1.32 * F;
  const tabP = 0.34 * F;
  const titleW = o.W - 3 * pad - tabW;
  const fits = o.pieces.map(q => fitWords(glueNums(q.title), {maxWidth: titleW, size: F, minSize: F, maxLines: o.maxLines ?? 3, weight: 650}));
  const widest = Math.max(0, ...o.pieces.flatMap(q => glueNums(q.title).split(/\s+/)).map(w => ctx.measure(w.replace(/ /g, ' '), F, 650, 'sans')));
  const ok = o.showText ? fits.every(f => !f.truncated) && widest <= titleW - 0.5 : true;
  const lines = Math.max(1, ...fits.map(f => f.lines.length));
  const textH = o.showText ? F * 1.18 * (lines - 1) + F : F;
  const stripH = Math.max(textH, tabH - tabP) + 1.25 * pad;
  const lip = tabP + 0.3 * F;
  const stepH = stripH + lip;
  const hiddenH = Math.max(0.7 * stepH, 1.35 * F);
  const H = stripH + hiddenH;
  const lift = hiddenH + 0.4 * F;
  const tab = {x: o.W - pad - tabW, y: -tabP, w: tabW, h: tabH};
  return {
    F, W: o.W, pad, tabW, tabH, tabP, titleW, fits, lines, ok, stripH, lip, stepH, hiddenH, H, lift, tab,
    // hand grips in card-local coordinates (y = 0 at the card's top edge)
    gripTab: {x: tab.x + tab.w * 0.86, y: tab.y + tab.h * 0.42},
    gripEdge: {x: o.W + 1, y: H * 0.64},
  };
}

/**
 * Folder card. Pose {x, y, s, c}: (x, y) = the spine (bottom-left corner) in
 * world units; s = projected height of the leaf (1 standing, ~0.45 lying),
 * c = projected height of the cover (< 0: opened towards the viewer).
 * Named: `${name}` (spine transform), `${name}-leaf`, `${name}-cov`,
 * `${name}-out` (outside face), `${name}-in` (inside face), `${name}-txt`.
 * @param {any} ctx
 * @param {{name:string, M:any, index:number, piece:{number:number,title:string}, fit:any, showText:boolean}} o
 */
export function pieceCard(ctx, o) {
  const th = ctx.theme;
  const N = o.name;
  const M = o.M;
  const {W, H, F, pad, tab} = M;
  const col = pieceColor(ctx, o.index);
  const rows = [];
  // inside page (on the leaf): simulated text lines and a small table
  const inner = [];
  const bar = Math.max(4, F * 0.2);
  let y = pad * 1.2;
  for (let i = 0; y < H - pad * 1.6 && i < 7; i++) {
    const lw = (W - pad * 4) * (i % 3 === 2 ? 0.5 : 0.78 + ctx.rng(`${N}-l`, i) * 0.2);
    inner.push(h('rect', {x: r(pad * 2), y: r(y), width: r(lw), height: r(bar), rx: r(bar / 2), fill: th.paperLine}));
    y += bar * 2.7;
  }
  const leaf = g({name: `${N}-leaf`},
    h('path', {d: roundRectPath(0, 0, W, H, 6), fill: col.leaf, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(pad, pad * 0.6, W - pad * 2, H - pad * 1.1, 4), fill: th.paper, stroke: th.paperLine, 'stroke-width': 1.5}),
    inner,
  );
  // outside face of the cover: strip with the title (left) and the index tab (right)
  const tabNode = g(null,
    h('path', {d: roundRectPath(tab.x, tab.y, tab.w, tab.h, Math.min(8, tab.h * 0.28)), fill: col.tab, stroke: INK, 'stroke-width': 2.2}),
  );
  const tabMark = o.showText
    ? h('text', {x: r(tab.x + tab.w / 2), y: r(tab.y + tab.h / 2 + F * 0.36), 'text-anchor': 'middle', 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 800, fill: col.tabInk}, String(o.piece.number))
    : pips(o.piece.number, {cx: tab.x + tab.w / 2, cy: tab.y + tab.h / 2, hh: tab.h, fill: col.tabInk});
  const title = o.showText && o.fit ? textBlock(o.fit, {x: pad, y: (M.stripH - o.fit.height) / 2, fill: INK}) : null;
  if (!o.showText) {
    // labels hidden: the title strip keeps its place as a plain printed band
  }
  // decorative bars under the strip (simulated text on the cover, never under the title)
  const covBars = [];
  for (let i = 0; i < 2; i++) {
    const by = M.stripH + pad * 0.5 + i * bar * 2.6;
    if (by + bar > H - pad * 0.5) break;
    covBars.push(h('rect', {x: r(pad), y: r(by), width: r((W - pad * 2) * (i ? 0.46 : 0.7)), height: r(bar), rx: r(bar / 2), fill: shade(col.cover, -0.12)}));
  }
  const out = g({name: `${N}-out`},
    h('path', {d: roundRectPath(0, 0, W, H, 6), fill: col.cover, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M${r(pad * 0.5)} ${r(M.stripH)}H${r(W - pad * 0.5)}`, stroke: shade(col.cover, -0.14), 'stroke-width': 2}),
    covBars,
    tabNode,
    g({name: `${N}-txt`}, title, tabMark),
  );
  const inside = g({name: `${N}-in`, opacity: 0},
    h('path', {d: roundRectPath(0, 0, W, H, 6), fill: shade(col.cover, -0.05), stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(tab.x, tab.y, tab.w, tab.h, Math.min(8, tab.h * 0.28)), fill: shade(col.tab, -0.08), stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(pad * 1.5, H * 0.35, W - pad * 3, H * 0.4, 5), fill: 'none', stroke: shade(col.cover, -0.16), 'stroke-width': 1.8, 'stroke-dasharray': '6 6'}),
  );
  // an opaque card: labels of a piece standing behind it are hidden from view
  const node = g({name: N, 'data-occludes': 1},
    leaf,
    g({name: `${N}-cov`}, out, inside),
  );
  rows.push(null);
  /**
   * @param {{x:number, y:number, s:number, c:number}} p
   * @param {number} [opacity]
   */
  function frame(p, opacity = 1) {
    const s = p.s, c = p.c, sx = p.sx ?? 1;
    const tf = k => `scale(1 ${r(k, 4)}) translate(0 ${r(-H)})`;
    // a piece turned about its tab end (edge-on to the viewer) hides its title
    const txt = clamp((Math.abs(c) - 0.7) / 0.2) * clamp((sx - 0.9) / 0.1);
    return {
      [N]: {transform: sx === 1 ? T(p.x, p.y) : `${T(p.x, p.y)} scale(${r(sx, 4)} 1)`, opacity: r(opacity, 3)},
      [`${N}-leaf`]: {transform: tf(Math.max(0.02, s))},
      [`${N}-cov`]: {transform: tf(Math.abs(c) < 0.02 ? 0.02 * Math.sign(c || 1) : c)},
      [`${N}-out`]: {opacity: c >= 0 ? 1 : 0},
      [`${N}-in`]: {opacity: c < 0 ? 1 : 0},
      [`${N}-txt`]: {opacity: r(c >= 0 ? txt : 0, 3)},
    };
  }
  /** world point of a card-local point for pose p (cover points use c, leaf points s) */
  const at = (p, q, onCover = true) => ({x: p.x + (p.sx ?? 1) * q.x, y: p.y - (onCover ? p.c : p.s) * (H - q.y)});
  return {node, frame, at, W, H, col};
}

/** Squash (projected height factor) at which a piece hinged about its top edge covers only its own strip band. */
export const SIDE_TURN = 0.14;
/** Edge-on factor of a turned piece: at most SIDE_TURN, and never wider than 1.6 F on screen (a folder seen edge-on is thin). */
export const sideTurn = M => Math.min(SIDE_TURN, 1.6 * M.F / M.W);
export const sideSquash = M => Math.min(1, Math.max(0.05, (M.stripH - 0.12 * M.F) / M.H));

/** Spine pose of a standing piece whose top-left corner is at (x, y). */
export const standing = (M, x, y) => ({x, y: y + M.H, s: 1, c: 1});

/** Projected height of a leaf or cover lying back (θ = 0) … standing (63°) … lying forward (180°). */
export const FORE = 0.55;
export const projH = theta => FORE * Math.cos(theta) + Math.sqrt(1 - FORE * FORE) * Math.sin(theta);
/** Angle at which the projected height is 1 (fully facing the viewer). */
export const THETA_UP = Math.atan2(Math.sqrt(1 - FORE * FORE), FORE);


/* ------------------------------------------------------------ front clerk */

// Proportions shared with the seated front figure of the mediation motif (mediation-props.js),
// redrawn here as a STANDING figure without a chair so the body can stretch up, dip and sidestep
// behind the counter (the counter hides everything below the waist).
const CUP = 100, CLO = 98, CHAND = 17;
const CSH = {l: {x: -60, y: 14}, r: {x: 60, y: 14}};
const CHEAD = {x: 0, y: -92, r: 44};
export const CLERK_REACH = CUP + CLO + CHAND * 0.6;

/**
 * Front-facing standing clerk behind a counter. Local origin = centre of the shoulder line.
 * `body` is drawn before the counter top, `arms` after it. frame() takes WORLD hand targets
 * and returns the solved hands (props are placed from them).
 */
export function frontClerk(ctx, o) {
  const N = o.name;
  const L = o.look;
  const skinShade = shade(L.skin, -0.12);
  const jacket = L.outfit;
  const hair = hairShape(L.hair, CHEAD.r, CHEAD.y, L.hairColor);
  const torso = g(null,
    h('path', {d: 'M-86 44C-88 10 -72 -6 -44 -10L-16 -14H16L44 -10C72 -6 88 10 86 44L82 330H-82Z', fill: jacket, stroke: INK, 'stroke-width': 2.8, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-17 -14L0 34L17 -14Z', fill: '#f4f1ea', stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-17 -14L-34 -6L-8 70L0 34Z', fill: shade(jacket, -0.14), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M17 -14L34 -6L8 70L0 34Z', fill: shade(jacket, -0.14), stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('path', {d: 'M-52 26q10 40 6 110M52 26q-10 40 -6 110', fill: 'none', stroke: shade(jacket, -0.25), 'stroke-width': 2}),
    // lanyard with a blank badge (no text, no role glyph)
    h('path', {d: 'M-10 -10L-6 96M10 -10L6 96', fill: 'none', stroke: shade(jacket, 0.35), 'stroke-width': 3}),
    h('path', {d: roundRectPath(-17, 94, 34, 42, 5), fill: '#f4f1ea', stroke: INK, 'stroke-width': 2}),
    h('rect', {x: -10, y: 104, width: 20, height: 4, rx: 2, fill: shade(jacket, -0.1)}),
  );
  const neck = h('rect', {x: -14, y: -50, width: 28, height: 42, rx: 7, fill: skinShade, stroke: INK, 'stroke-width': 2.2});
  const eyeY = CHEAD.y - 2;
  const hairBack = g({name: `${N}-hairback`}, hair.back);
  const head = g({name: `${N}-head`},
    h('ellipse', {cx: -43, cy: CHEAD.y + 4, rx: 8, ry: 11, fill: skinShade, stroke: INK, 'stroke-width': 2.2}),
    h('ellipse', {cx: 43, cy: CHEAD.y + 4, rx: 8, ry: 11, fill: skinShade, stroke: INK, 'stroke-width': 2.2}),
    h('circle', {cx: CHEAD.x, cy: CHEAD.y, r: CHEAD.r, fill: L.skin, stroke: INK, 'stroke-width': 2.8}),
    g({name: `${N}-eyes`},
      h('ellipse', {cx: -15, cy: eyeY, rx: 4.2, ry: 5.4, fill: INK}),
      h('ellipse', {cx: 15, cy: eyeY, rx: 4.2, ry: 5.4, fill: INK})),
    h('path', {d: `M-23 ${eyeY - 13}q8 -5 15 -1M8 ${eyeY - 14}q8 -4 15 1`, fill: 'none', stroke: shade(L.hairColor, -0.1), 'stroke-width': 3, 'stroke-linecap': 'round'}),
    h('path', {d: `M1 ${CHEAD.y + 2}q5 10 -3 12`, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    h('path', {d: `M-11 ${CHEAD.y + 22}q11 6 22 0`, fill: 'none', stroke: INK, 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
    L.glasses ? g(null,
      h('circle', {cx: -15, cy: eyeY, r: 11, fill: 'none', stroke: INK, 'stroke-width': 2.2}),
      h('circle', {cx: 15, cy: eyeY, r: 11, fill: 'none', stroke: INK, 'stroke-width': 2.2}),
      h('path', {d: `M-4 ${eyeY}h8`, stroke: INK, 'stroke-width': 2.2})) : null,
    hair.front,
  );
  const body = g({name: `${N}-body`}, hairBack, torso, neck, head);
  const arm = side => g({name: `${N}-${side}`},
    h('line', {name: `${N}-${side}-uo`, stroke: INK, 'stroke-width': 31, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${side}-lo`, stroke: INK, 'stroke-width': 28, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${side}-u`, stroke: jacket, 'stroke-width': 25.5, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${side}-l`, stroke: jacket, 'stroke-width': 22.5, 'stroke-linecap': 'round'}),
    h('line', {name: `${N}-${side}-cuff`, stroke: '#f4f1ea', 'stroke-width': 19, 'stroke-linecap': 'butt'}),
    g({name: `${N}-${side}-hand`},
      g({name: `${N}-${side}-mitt`},
        h('path', {d: 'M-6 -15C11 -19 27 -14 30 -2C31 11 16 18 0 15C-8 14 -11 -11 -6 -15Z', fill: L.skin, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
        h('path', {d: side === 'l' ? 'M8 13C16 24 27 23 27 16' : 'M8 -13C16 -24 27 -23 27 -16', fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
        h('path', {d: 'M19 -8q4 3 4 7M19 3q4 3 3 7', fill: 'none', stroke: shade(L.skin, -0.3), 'stroke-width': 1.8, 'stroke-linecap': 'round'})),
      g({name: `${N}-${side}-palm`, opacity: 0}, clerkPalm(L.skin, side === 'l' ? 1 : -1))),
  );
  const arms = g({name: `${N}-arms`}, arm('l'), arm('r'));
  function frame(s) {
    const k = s.scale;
    const nodes = {};
    const tr = T(s.x, s.y, 0, k);
    nodes[`${N}-body`] = {transform: tr};
    nodes[`${N}-arms`] = {transform: tr};
    nodes[`${N}-head`] = {transform: s.tilt ? rotateAbout(0, -48, s.tilt) : ''};
    nodes[`${N}-hairback`] = {transform: s.tilt ? rotateAbout(0, -48, s.tilt) : ''};
    nodes[`${N}-eyes`] = {transform: T((s.look ?? 0) * 6, (s.down ?? 0) * 3)};
    const toLocal = p => ({x: (p.x - s.x) / k, y: (p.y - s.y) / k});
    const toWorld = p => ({x: s.x + p.x * k, y: s.y + p.y * k});
    const hands = {}, elbows = {};
    let reached = true;
    for (const side of ['l', 'r']) {
      const sh = CSH[side];
      const target = toLocal(side === 'l' ? s.left : s.right);
      const sol = clerkArm(sh, target, side === 'l' ? -1 : 1);
      if (!sol.reached) reached = false;
      const a = sol.forearmAngle;
      const wrist = {x: sol.hand.x - Math.cos(a) * CHAND * 0.6, y: sol.hand.y - Math.sin(a) * CHAND * 0.6};
      const cuffA = {x: wrist.x - Math.cos(a) * 16, y: wrist.y - Math.sin(a) * 16};
      const cuffB = {x: wrist.x - Math.cos(a) * 5, y: wrist.y - Math.sin(a) * 5};
      const line = (p, q) => ({x1: r(p.x), y1: r(p.y), x2: r(q.x), y2: r(q.y)});
      nodes[`${N}-${side}-uo`] = line(sh, sol.elbow);
      nodes[`${N}-${side}-u`] = line(sh, sol.elbow);
      nodes[`${N}-${side}-lo`] = line(sol.elbow, wrist);
      nodes[`${N}-${side}-l`] = line(sol.elbow, wrist);
      nodes[`${N}-${side}-cuff`] = line(cuffA, cuffB);
      nodes[`${N}-${side}-hand`] = {transform: T(wrist.x, wrist.y, (a * 180) / Math.PI)};
      const open = (s.open && s.open[side]) || 0;
      nodes[`${N}-${side}-mitt`] = {opacity: open >= 0.5 ? 0 : 1};
      nodes[`${N}-${side}-palm`] = {opacity: open >= 0.5 ? 1 : 0};
      hands[side] = toWorld(sol.hand);
      elbows[side] = toWorld(sol.elbow);
    }
    return {nodes, hands, elbows, reached, head: toWorld(CHEAD), shoulders: {l: toWorld(CSH.l), r: toWorld(CSH.r)}};
  }
  return {body, arms, frame, reach: CLERK_REACH, shoulders: CSH, head: CHEAD};
}

const smooth01 = t => t * t * (3 - 2 * t);

/** Front-view two-bone arm solved in pseudo-3D (elbow never flips); same scheme as the mediation front figure. */
function clerkArm(sh, target, out) {
  const lower = CLO + CHAND * 0.6;
  const reach = CUP + lower;
  const dx = target.x - sh.x, dy = target.y - sh.y;
  const d2 = Math.hypot(dx, dy);
  const dist = Math.min(d2, reach - 0.01);
  const hand = d2 > 1e-6 ? {x: sh.x + (dx / d2) * dist, y: sh.y + (dy / d2) * dist} : {x: sh.x, y: sh.y};
  const Dc = 0.86 * reach;
  const hz = dist < Dc ? Math.sqrt(Dc * Dc - dist * dist) : 0;
  const D = Math.max(dist, Dc);
  const ax = [(hand.x - sh.x) / D, (hand.y - sh.y) / D, hz / D];
  const a = (CUP * CUP - lower * lower + D * D) / (2 * D);
  const rho = Math.sqrt(Math.max(0, CUP * CUP - a * a));
  const w = smooth01(clamp((150 - target.y) / 120));
  const pole = [out * (1 - 0.65 * w), 0.3 + 0.7 * w, -0.15 - 0.15 * w];
  const pd = pole[0] * ax[0] + pole[1] * ax[1] + pole[2] * ax[2];
  const pp = [pole[0] - pd * ax[0], pole[1] - pd * ax[1], pole[2] - pd * ax[2]];
  const pl = Math.hypot(pp[0], pp[1], pp[2]) || 1;
  const elbow = {x: sh.x + ax[0] * a + (pp[0] / pl) * rho, y: sh.y + ax[1] * a + (pp[1] / pl) * rho};
  return {elbow, hand, reached: d2 <= reach - 0.01 + 0.02, forearmAngle: Math.atan2(hand.y - elbow.y, hand.x - elbow.x)};
}

/** Open palm in hand-local coords (+x along the forearm); `side` flips the thumb. */
function clerkPalm(skin, side) {
  const t = side;
  return g(null,
    h('path', {d: 'M-4 -14C6 -17 16 -16 20 -12L40 -13C45 -13 45 -7 40 -7L24 -6L44 -4C49 -4 49 2 44 2L24 3L41 7C46 8 45 14 40 13L22 11C18 16 6 17 -2 15C-9 12 -10 -10 -4 -14Z', fill: skin, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round'}),
    h('path', {d: `M6 ${-15 * t}C10 ${-27 * t} 22 ${-31 * t} 26 ${-25 * t}C28 ${-21 * t} 20 ${-17 * t} 16 ${-13 * t}`, fill: skin, stroke: INK, 'stroke-width': 2.3, 'stroke-linejoin': 'round'}),
  );
}

/**
 * Body shift of the standing clerk for given hand targets (world): stretches up (up to 46 z) for
 * targets above the shoulders and steps sideways towards the cabinet (up to `maxStep`, so the face
 * never goes behind it). Continuous in the targets.
 */
export function bodyShift(G, left, right) {
  const z = G.z;
  const ty = Math.min(left.y, right.y);
  const rise = clamp((G.shY + 20 * z - ty) * 0.65, 0, (G.maxRise ?? 60) * z);
  // leans down over the counter for low targets
  const dip = clamp((Math.max(left.y, right.y) - (G.shY + 200 * z)) * 0.6, 0, 42 * z);
  const step = clamp((left.x - (G.cx - 150 * z)) * 0.5, -G.maxStep, 0);
  return {dx: step, dy: dip - rise};
}

/* ------------------------------------------------------------------ stage */


/**
 * Pure stage geometry (design units) for assistant scale z, piece metrics M
 * and n compartments. The assistant's shoulder centre is at (cx, shY).
 * @param {{z:number, M:any, n:number, cx:number, shY:number, fileLabelH:number, visitor?:null|'side'|'fore', visitorK?:number, cover?:boolean, lieDx?:number}} o
 */
export function fileGeometry(o) {
  const {z, M, n, cx, shY} = o;
  const F = M.F;
  const G = {z, M, n, cx, shY, F};
  G.med = {x: cx, y: shY};
  // standing at a counter: its far edge a little above the waist
  G.yFar = shY + 150 * z;
  G.yNear = shY + (150 + (o.deskDepth ?? 105)) * z;
  G.face = {x: cx - 54 * z, y: shY - 146 * z, w: 108 * z, h: 112 * z};
  G.maxRise = o.maxRise ?? 60;
  G.headTop = shY - 146 * z - G.maxRise * z;
  G.shoulderL = {x: cx - 60 * z, y: shY + 14 * z};
  G.shoulderR = {x: cx + 60 * z, y: shY + 14 * z};
  G.reach = CLERK_REACH * z * 0.996;
  // ---- cabinet (right edge clear of the left shoulder and upper arm)
  const postL = 0.5 * F;
  const plateW = 1.9 * F;
  const postR = plateW + 0.55 * F;
  const gap = 0.2 * F;
  const innerW = M.W + 2 * gap;
  const CW = postL + innerW + postR;
  const housingH = o.fileLabelH ? Math.max(1.55 * F, o.fileLabelH + 0.7 * F) : 1.15 * F;
  // room above the top row (the side path never lifts a piece over the wall; a larger clearance can be asked for)
  const clearTop = o.clearTop ?? (M.lift + M.tabP + 0.3 * F);
  const rowsH = n * M.stepH - M.lip;
  const lowerH = M.hiddenH + 0.35 * F;
  const plinth = 0.5 * F;
  const CH = housingH + clearTop + rowsH + lowerH + plinth;
  // (default gap: the piece turned edge-on beside the cabinet stays clear of the face)
  const cabR = cx - 84 * z - (o.cabGap ?? Math.max(o.minGapZ ?? 0, 0.35 * F + sideTurn(M) * M.W - 28 * z));
  const cabL = cabR - CW;
  // cabinet base on the desk top: rows centred a little below the shoulders, within the desk depth
  const tabMid = (M.stripH / 2) + (n - 1) * M.stepH / 2;
  // the piece is read lying on the desk right of the cabinet when the right hand can reach it there;
  // otherwise it lies centred in front of the chest, in front of the cabinet, which then stands at the back
  const lieY = G.yFar + 10 * z + FORE * (M.H + M.tabP);
  const lieSide = cabR + 0.6 * F;
  const sideOK = Math.hypot(lieSide + M.W + 1 - (cx + 60 * z), lieY - (shY + 14 * z)) < G.reach * 0.9
    && Math.hypot(lieSide + M.gripTab.x - (cx + 60 * z), lieY + FORE * (M.H - M.gripTab.y) - (shY + 14 * z)) < G.reach * 0.95;
  const want = shY + 30 * z + plinth + lowerH + tabMid + M.lift * 0.25;
  const yBase = sideOK ? clamp(want, G.yFar + 14 * z, G.yNear - 10 * z) : G.yFar + 4 * z;
  G.lieSide = sideOK;
  const top = yBase - CH;
  G.maxStep = Math.max(0, 30 * z - 6);
  G.cab = {
    x: cabL, y: top, w: CW, h: CH, r: cabR, base: yBase, postL, postR, plateW, gap, innerL: cabL + postL, innerR: cabR - postR,
    housing: {x: cabL, y: top, w: CW, h: housingH}, clearTop, plinth, lowerH,
    interiorTop: top + housingH, cardX: cabL + postL + gap,
  };
  G.rows = [];
  for (let c = 0; c < n; c++) {
    const stripTop = yBase - plinth - lowerH - M.stripH - c * M.stepH;
    G.rows.push({c, stripTop, wallTop: stripTop + M.stripH, floor: stripTop + M.H,
      plate: {x: cabR - postR / 2 - plateW / 2, y: stripTop + M.stripH / 2 - 0.68 * F, w: plateW, h: 1.36 * F}});
  }
  G.coverBox = {x: G.cab.innerL, y: G.cab.interiorTop, w: innerW, h: G.rows[0].wallTop - G.cab.interiorTop};
  G.coverHandle = {x: G.cab.innerR - 1.3 * F, y: G.rows[0].wallTop - 0.42 * F};
  G.coverOpenDy = G.coverBox.h - 0.55 * F;
  // ---- reading spot: the piece lies on the far part of the desk, right of the cabinet
  G.lie = {x: G.lieSide ? lieSide : cx - M.W * 0.5 - 20 * z, y: lieY};
  // hand-off: the piece stands in front of the chest, its tab end at the body's centre line, below the lowest
  // strip of the cabinet (so the held piece never sits over the other pieces' labels) and clear of the face
  G.handoffX = cx + 20 * z - M.W;
  G.handoffTop = Math.max(G.face.y + G.face.h + 8 * z, shY + 40 * z, yBase - plinth - lowerH + M.tabP + 4);
  // side path: the piece passes the plate post just right of the cabinet
  // (turned edge-on about its tab end, its left edge just right of the cabinet)
  G.sideTabX = cabR + 0.25 * F + sideTurn(M) * M.gripTab.x;
  // hands at rest on the desk
  // (near the far edge, so they stay within reach while the body stretches up)
  G.restL = {x: cx - 52 * z, y: G.yFar + 8 * z};
  G.restR = {x: cx + 56 * z, y: G.yFar + 10 * z};
  // ---- desk: 'closeup' crops the front panel (no legs); 'full' shows legs and the floor
  G.deskMode = o.desk || 'closeup';
  G.tableL = cabL - 0.8 * F;
  G.edge = 16 * z;
  G.panelTop = G.yNear + G.edge;
  // ---- visitor (standing, facing the assistant)
  G.visitor = null;
  if (o.visitor === 'back') {
    // stands further back, right behind the assistant's right shoulder (smaller; the desk hides the legs)
    const k = o.visitorK ?? 0.98 * z;
    const hipY = G.yFar - 34 * z;
    const x = o.visitorX ?? cx + 178 * z;
    const fy = hipY + 186 * k;
    G.visitor = {x, y: fy, k, hipY, back: true, head: {x: x - 5 * k, y: fy - 366 * k, r: 42 * k}, mouth: {x: x - 34 * k, y: fy - 346 * k}};
  } else if (o.visitor === 'behind') {
    // stands behind the desk's right part; the desk hides everything below the hips
    const k = o.visitorK ?? 1.08 * z;
    const hipY = G.yFar - 6 * z;
    const x = Math.max(cx + 104 * z + 70 * k, G.lie.x + M.W * 0.55 + 40 * k, o.visitorX ?? -Infinity);
    const fy = hipY + 186 * k;
    G.visitor = {x, y: fy, k, hipY, head: {x: x - 5 * k, y: fy - 366 * k, r: 42 * k}, mouth: {x: x - 34 * k, y: fy - 346 * k}};
  } else if (o.visitor === 'front') {
    // stands on the floor in front of the desk's right end (nearer the viewer, so larger), facing the assistant
    const k = o.visitorK ?? 1.45 * z;
    G.visitor = {x: o.visitorX ?? cx + 175 * z, k, fore: true, front: true};
  } else if (o.visitor === 'fore') {
    // stands in the foreground below the desk (nearer the viewer, so larger), looking up at the assistant
    const k = o.visitorK ?? 1.3 * z;
    const x = o.visitorX ?? cx + 40 * z;
    G.visitor = {x, k, fore: true};
    G.tableR0 = x + 60 * k;
  }
  G.tableR = Math.max(cx + 150 * z, G.lie.x + M.W + 1.2 * F, G.visitor && (o.visitor === 'behind' || o.visitor === 'back') ? G.visitor.x + Math.max(70 * G.visitor.k, (o.visitorChipHalf ?? 0) + 40 * z) : -Infinity);
  if (G.deskMode === 'full') {
    G.floor = G.yNear + 168 * z;
    G.panelBottom = G.floor - 28 * z;
  } else {
    G.panelBottom = G.panelTop + (o.panelH ?? 70 * z);
    G.floor = G.panelBottom;
  }
  if (G.visitor && G.visitor.front) {
    const V = G.visitor, k = V.k;
    V.y = G.floor + (o.visitorDy ?? 46 * z);
    V.head = {x: V.x - 5 * k, y: V.y - 366 * k, r: 42 * k};
    V.mouth = {x: V.x - 34 * k, y: V.y - 346 * k};
    // the floor under the desk and the requester (part of the composition's extent)
    G.floorBox = {x: Math.min(G.tableL, V.x - 80 * k) - 30 * z, y: G.floor - 30 * z};
    G.floorBox.w = Math.max(G.tableR, V.x + 80 * k) + 30 * z - G.floorBox.x;
    G.floorBox.h = V.y + 26 * k - G.floorBox.y;
  } else if (G.visitor && G.visitor.fore) {
    const V = G.visitor, k = V.k;
    const headTop = G.panelBottom + (o.visitorGap ?? 14) + 6 * k;
    V.y = headTop + 408 * k;
    V.head = {x: V.x - 5 * k, y: V.y - 366 * k, r: 42 * k};
    V.mouth = {x: V.x - 34 * k, y: V.y - 346 * k};
  }
  // ---- extents
  const xs = [cabL, G.tableL, G.tableR, cx + 104 * z];
  const ys = [top, G.headTop, G.floor];
  if (G.floorBox) xs.push(G.floorBox.x, G.floorBox.x + G.floorBox.w);
  if (G.visitor) {
    xs.push(G.visitor.x - 70 * G.visitor.k, G.visitor.x + 60 * G.visitor.k);
    ys.push(G.visitor.head.y - 50 * G.visitor.k, o.visitor === 'fore' || o.visitor === 'front' ? G.visitor.y + 12 * G.visitor.k : G.floor);
  }
  G.bbox = {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
  // ---- reach audit (all script targets)
  const lTargets = o.cover ? [G.restL, G.coverHandle, {x: G.coverHandle.x, y: G.coverHandle.y - G.coverOpenDy}] : [G.restL];
  const sq0 = sideSquash(M);
  for (const row of G.rows) {
    const tg = {x: G.cab.cardX + M.gripTab.x, y: row.stripTop + M.gripTab.y};
    lTargets.push(tg, {x: G.sideTabX, y: row.stripTop + sq0 * M.gripTab.y});
  }
  lTargets.push({x: G.sideTabX, y: G.handoffTop + M.gripTab.y});
  lTargets.push({x: G.handoffX + M.gripTab.x, y: G.handoffTop + M.gripTab.y});
  const rTargets = [G.restR, {x: G.handoffX + M.gripEdge.x, y: G.handoffTop + M.gripEdge.y}];
  for (let t = 0; t <= 1.0001; t += 0.125) {
    const th = t * Math.PI;
    const c = projH(th);
    rTargets.push({x: G.lie.x + M.gripTab.x, y: G.lie.y - c * (M.H - M.gripTab.y)});
  }
  for (let t = 0; t <= 1.0001; t += 0.125) {
    const s = projH(t * THETA_UP);
    rTargets.push({x: lerp(G.lie.x, G.handoffX, t) + M.gripEdge.x, y: lerp(G.lie.y, G.handoffTop + M.H, t) - s * (M.H - M.gripEdge.y)});
  }
  const reachGap = (side, p) => {
    const other = side === 'l' ? G.restR : G.restL;
    const sh = bodyShift(G, side === 'l' ? p : G.restL, side === 'r' ? p : G.restR);
    const s0 = side === 'l' ? G.shoulderL : G.shoulderR, s1 = side === 'l' ? G.shoulderR : G.shoulderL;
    return Math.max(Math.hypot(p.x - s0.x - sh.dx, p.y - s0.y - sh.dy), Math.hypot(other.x - s1.x - sh.dx, other.y - s1.y - sh.dy)) - G.reach;
  };
  G.reachMiss = Math.max(0, ...lTargets.map(p => reachGap("l", p)), ...rTargets.map(p => reachGap("r", p)));
  G.reachDbg = {l: lTargets.map(p => Math.round(reachGap("l", p))), r: rTargets.map(p => Math.round(reachGap("r", p)))};
  return G;
}

/**
 * Roll-top step cabinet + desk + assistant (+ optional visitor and bubble).
 * @param {any} ctx
 * @param {{prefix:string, G:any, M:any, pieces:Array<{number:number,title:string}>, actors:Array<any>,
 *   fileLabel:string, fileLabelFit?:any, occupancy:Array<[number, number]>, movers:number[], cover?:boolean,
 *   bubble?:{text:string, fit:any, box:{x:number,y:number,w:number,h:number}}|null}} o
 *   occupancy: [piece index, compartment] pairs a piece may be drawn in (in-cabinet copies, back → front order
 *   inside a compartment follows this list); movers: pieces that also get a free (front) copy.
 */
export function fileStage(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const {G, M} = o;
  const z = G.z, F = G.F;
  const showText = ctx.show('all');
  const showKey = ctx.show('key');
  const n = G.n;
  const looks = [actorLook(ctx, o.actors[0], 0), o.actors[1] ? actorLook(ctx, o.actors[1], 1) : null];
  const assistant = frontClerk(ctx, {name: `${P}-A`, look: looks[0]});

  // ---- desk (front view slightly from above)
  const yFar = G.yFar, yNear = G.yNear, tl = G.tableL, tr = G.tableR;
  const inset = 30 * z;
  const topPath = `M${r(tl + inset)} ${r(yFar)}H${r(tr - inset)}L${r(tr)} ${r(yNear)}H${r(tl)}Z`;
  const grain = [];
  for (let i = 0; i < 5; i++) {
    const gy = yFar + ((i + 0.6) / 5.4) * (yNear - yFar);
    const wob = (4 + ctx.rng(`${P}-grain`, i) * 6) * z;
    grain.push(h('path', {d: `M${r(tl)} ${r(gy)}C${r(tl + (tr - tl) * 0.35)} ${r(gy - wob)} ${r(tl + (tr - tl) * 0.65)} ${r(gy + wob)} ${r(tr)} ${r(gy - wob * 0.3)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.6}));
  }
  const clipTop = `${P}-topclip`;
  const tabletop = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(clipTop)}, h('path', {d: topPath}))),
    h('path', {d: topPath, fill: th.woodTop, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    g({'clip-path': ctx.ref(clipTop)}, grain));
  const legW = 28 * z;
  const tableFront = g(null,
    h('path', {d: roundRectPath(tl, yNear, tr - tl, G.edge, 3 * z), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('rect', {x: r(tl + legW * 0.6), y: r(G.panelTop), width: r(tr - tl - legW * 1.2), height: r(G.panelBottom - G.panelTop), fill: th.wood, stroke: INK, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(tl + legW * 1.4, G.panelTop + 12 * z, tr - tl - legW * 2.8, G.panelBottom - G.panelTop - 24 * z, 8 * z), fill: shade(th.wood, -0.06), stroke: shade(th.wood, -0.22), 'stroke-width': 2}),
    h('rect', {x: r(tl), y: r(G.panelTop - 1), width: r(legW), height: r(G.floor - G.panelTop + 1), rx: r(4 * z), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}),
    h('rect', {x: r(tr - legW), y: r(G.panelTop - 1), width: r(legW), height: r(G.floor - G.panelTop + 1), rx: r(4 * z), fill: th.woodDark, stroke: INK, 'stroke-width': th.stroke}),
  );
  let floorShadow = G.deskMode === 'full' ? h('ellipse', {cx: r((tl + tr) / 2), cy: r(G.floor + 2 * z), rx: r((tr - tl) * 0.54), ry: r(14 * z), fill: th.shadow}) : null;
  if (G.visitor && G.visitor.front) {
    // a floor that carries both the desk and the requester standing in front of it
    const V = G.visitor;
    const fx0 = G.floorBox.x, fx1 = G.floorBox.x + G.floorBox.w;
    const fy0 = G.floorBox.y, fy1 = G.floorBox.y + G.floorBox.h;
    floorShadow = g(null,
      h('path', {d: roundRectPath(fx0, fy0, fx1 - fx0, fy1 - fy0, 18 * z), fill: shade(th.paperShade || '#ece3d2', -0.03), stroke: shade(th.paperShade || '#ece3d2', -0.12), 'stroke-width': 2}),
      floorShadow,
      h('ellipse', {cx: r(V.x - 4 * V.k), cy: r(V.y + 4 * V.k), rx: r(62 * V.k), ry: r(11 * V.k), fill: th.shadow}));
  }

  // ---- cabinet
  const C = G.cab;
  const wood = '#a87b52', woodD = shade(wood, -0.22), woodL = shade(wood, 0.12);
  const interior = shade(wood, -0.55);
  const cabParts = [];
  cabParts.push(h('path', {d: roundRectPath(C.x + 8, C.y + 10, C.w, C.h, 8), fill: th.shadow}));
  // back panel (dark interior)
  cabParts.push(h('rect', {x: r(C.innerL), y: r(C.interiorTop), width: r(C.innerR - C.innerL), height: r(C.base - C.plinth - C.interiorTop), fill: interior, stroke: INK, 'stroke-width': 2}));
  // compartments, back → front: empty outline, the pieces it may hold, then its front wall
  const pieceNodes = new Map(); // key `${i}@${c}` → card
  const cards = [];
  const cardFor = (i, key) => pieceCard(ctx, {name: `${P}-p${i}-${key}`, M, index: i, piece: o.pieces[i], fit: o.titles === false ? null : M.fits[i], showText});
  for (let c = n - 1; c >= 0; c--) {
    const row = G.rows[c];
    const ex = C.cardX, ew = M.W;
    cabParts.push(h('path', {name: `${P}-empty${c}`, d: roundRectPath(ex + 4, row.stripTop + 4, ew - 8, M.stripH - 5, 6), fill: shade(interior, 0.12), stroke: '#efe4cc', 'stroke-width': 2.6, 'stroke-dasharray': '10 7'}));
    for (const [i, cc] of o.occupancy) {
      if (cc !== c) continue;
      const card = cardFor(i, `c${c}`);
      pieceNodes.set(`${i}@${c}`, card);
      cabParts.push(card.node);
    }
    // front wall of compartment c: from its top down to the compartment floor
    const wy = row.wallTop, wb = c === 0 ? C.base - C.plinth : row.floor + 1;
    cabParts.push(h('rect', {x: r(C.innerL), y: r(wy), width: r(C.innerR - C.innerL), height: r(wb - wy), fill: c % 2 ? wood : shade(wood, 0.04), stroke: INK, 'stroke-width': 2.2}));
    cabParts.push(h('path', {d: `M${r(C.innerL + 2)} ${r(wy + 2.5)}H${r(C.innerR - 2)}`, stroke: woodL, 'stroke-width': 3}));
  }
  // posts, plates, plinth, housing
  cabParts.push(h('rect', {x: r(C.x), y: r(C.interiorTop - 2), width: r(C.postL), height: r(C.base - C.interiorTop + 2), fill: woodD, stroke: INK, 'stroke-width': 2.4}));
  cabParts.push(h('rect', {x: r(C.r - C.postR), y: r(C.interiorTop - 2), width: r(C.postR), height: r(C.base - C.interiorTop + 2), fill: woodD, stroke: INK, 'stroke-width': 2.4}));
  const plates = G.rows.map((row, c) => {
    const pl = row.plate;
    const num = o.pieces[c] ? o.pieces[c].number : c + 1;
    return g({name: `${P}-plate${c}`},
      h('path', {d: roundRectPath(pl.x, pl.y, pl.w, pl.h, 5), fill: '#d8b45a', stroke: INK, 'stroke-width': 2}),
      h('circle', {cx: r(pl.x + 0.22 * F), cy: r(pl.y + pl.h / 2), r: r(0.09 * F), fill: shade('#d8b45a', -0.4)}),
      h('circle', {cx: r(pl.x + pl.w - 0.22 * F), cy: r(pl.y + pl.h / 2), r: r(0.09 * F), fill: shade('#d8b45a', -0.4)}),
      showText
        ? h('text', {x: r(pl.x + pl.w / 2), y: r(pl.y + pl.h / 2 + F * 0.36), 'text-anchor': 'middle', 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 800, fill: '#3b2a10'}, String(num))
        : pips(num, {cx: pl.x + pl.w / 2, cy: pl.y + pl.h / 2, hh: pl.h * 0.9, fill: '#3b2a10'}));
  });
  cabParts.push(...plates);
  cabParts.push(h('rect', {x: r(C.x - 4), y: r(C.base - C.plinth), width: r(C.w + 8), height: r(C.plinth), rx: 3, fill: woodD, stroke: INK, 'stroke-width': 2.4}));
  // roll-top cover (contrast): slats clipped to the interior, handle at its lower right
  let coverNode = null;
  if (o.cover) {
    const B = G.coverBox;
    const slats = [];
    const sh = 0.62 * F;
    for (let y = 0; y < B.h + 1; y += sh) slats.push(h('rect', {x: r(B.x), y: r(B.y + y), width: r(B.w), height: r(Math.min(sh, B.h - y + 1)), fill: y % (2 * sh) < sh ? '#b58a5f' : '#a67c53', stroke: shade(wood, -0.35), 'stroke-width': 1.4}));
    const clip = `${P}-coverclip`;
    coverNode = g(null,
      h('defs', null, h('clipPath', {id: ctx.id(clip)}, h('rect', {x: r(B.x), y: r(B.y), width: r(B.w), height: r(B.h + 2)}))),
      g({'clip-path': ctx.ref(clip)}, g({name: `${P}-cover`, 'data-occludes': 1},
        slats,
        h('path', {d: `M${r(B.x)} ${r(B.y + B.h)}H${r(B.x + B.w)}`, stroke: INK, 'stroke-width': 2.4}),
        h('path', {d: roundRectPath(G.coverHandle.x - 0.75 * F, G.coverHandle.y - 0.16 * F, 1.5 * F, 0.32 * F, 0.16 * F), fill: '#d8b45a', stroke: INK, 'stroke-width': 2}))),
    );
  }
  // housing with the file label and the rolled slats
  const Hs = C.housing;
  const housing = g(null,
    h('path', {d: roundRectPath(Hs.x - 6, Hs.y, Hs.w + 12, Hs.h, 10), fill: wood, stroke: INK, 'stroke-width': 2.6}),
    h('path', {d: `M${r(Hs.x + 4)} ${r(Hs.y + Hs.h - 5)}H${r(Hs.x + Hs.w - 4)}`, stroke: woodD, 'stroke-width': 4}),
    h('path', {d: roundRectPath(Hs.x + Hs.w * 0.08, Hs.y + 0.3 * F, Hs.w * 0.84, Hs.h - 0.62 * F, 6), fill: '#f4ecd8', stroke: INK, 'stroke-width': 2}),
    o.blankPlate ? null : showKey && o.fileLabelFit
      ? textBlock(o.fileLabelFit, {x: Hs.x + Hs.w / 2, y: Hs.y + 0.3 * F + (Hs.h - 0.62 * F - o.fileLabelFit.height) / 2, anchor: 'middle', fill: INK, name: `${P}-filelabel`})
      : h('rect', {x: r(Hs.x + Hs.w * 0.25), y: r(Hs.y + Hs.h / 2 - 0.12 * F), width: r(Hs.w * 0.5), height: r(0.24 * F), rx: r(0.12 * F), fill: th.paperLine}),
  );
  const cabinet = g({name: `${P}-cabinet`}, cabParts, coverNode, housing);

  // ---- free (front) copies of the moving pieces (drawn above cabinet and desk, below the arms)
  const free = new Map();
  for (const i of o.movers) {
    const card = cardFor(i, 'f');
    free.set(i, card);
    cards.push(card);
  }

  // ---- visitor + bubble
  let visitor = null;
  let bubble = null;
  let visitorNode = null;
  if (G.visitor && looks[1]) {
    visitor = personRig(ctx, {name: `${P}-V`, look: looks[1], pose: 'standing'});
    if (G.visitor.fore) visitorNode = visitor.node;
    else {
      const vc = `${P}-vclip`;
      const bx = G.visitor.x - 200 * G.visitor.k;
      visitorNode = g(null,
        h('defs', null, h('clipPath', {id: ctx.id(vc)}, h('rect', {x: r(bx), y: r(G.visitor.head.y - 400 * G.visitor.k), width: r(400 * G.visitor.k), height: r(G.yNear - (G.visitor.head.y - 400 * G.visitor.k))}))),
        g({'clip-path': ctx.ref(vc)}, visitor.node));
    }
    if (o.bubble) bubble = requestBubble(ctx, {name: `${P}-bub`, ...o.bubble, tail: G.visitor.mouth, showText});
  }

  const behind = G.visitor && o.visitor !== undefined ? false : false;
  const vBehind = visitor && G.visitor && !G.visitor.fore;
  const bodyClip = `${P}-aclip`;
  const bodyNode = g(null,
    h('defs', null, h('clipPath', {id: ctx.id(bodyClip)}, h('rect', {x: r(G.cx - 400 * z), y: r(G.shY - 400 * z), width: r(800 * z), height: r(G.panelBottom - (G.shY - 400 * z))}))),
    g({'clip-path': ctx.ref(bodyClip)}, assistant.body));
  const node = g({name: P},
    floorShadow,
    vBehind ? visitorNode : null,
    bodyNode,
    tabletop,
    cabinet,
    tableFront,
    g({name: `${P}-free`}, [...free.values()].map(c => c.node)),
    assistant.arms,
    visitor && !vBehind ? visitorNode : null,
    bubble ? bubble.node : null,
  );

  const seat = (i, c, rise = 0) => standing(M, C.cardX, G.rows[c].stripTop - rise);
  const tabAt = pose => ({x: pose.x + M.gripTab.x, y: pose.y - pose.c * (M.H - M.gripTab.y)});
  const edgeAt = pose => ({x: pose.x + M.gripEdge.x, y: pose.y - pose.s * (M.H - M.gripEdge.y)});

  /**
   * Pose the stage.
   * @param {object} s
   * @param {{left:any, right:any, openL?:number, openR?:number, look?:number, tilt?:number}} s.hands  hand targets (world)
   * @param {Array<{where:'slot'|'free', c?:number, rise?:number, pose?:any, holder?:'l'|'r'|null, grip?:'tab'|'edge'}>} s.pieces  per piece index (only pieces in `occupancy`)
   * @param {number} [s.cover]  roll-top opening 0..1 (handle follows the solved left hand while `coverHeld`)
   * @param {boolean} [s.coverHeld]
   * @param {{mouth:number, tilt:number}} [s.visitor]
   * @param {{open:number, words:number}} [s.bubble]
   */
  function pose(s) {
    const nodes = {};
    const sh = s.body || bodyShift(G, s.hands.left, s.hands.right);
    const mf = assistant.frame({x: G.med.x + sh.dx, y: G.med.y + sh.dy, scale: z, left: s.hands.left, right: s.hands.right, look: s.hands.look ?? 0, down: s.hands.down ?? 0, tilt: s.hands.tilt ?? 0, open: {l: s.hands.openL ?? 0, r: s.hands.openR ?? 0}});
    mf.shift = sh;
    mf.face = {x: G.face.x + sh.dx, y: G.face.y + sh.dy, w: G.face.w, h: G.face.h};
    Object.assign(nodes, mf.nodes);
    const piecePose = new Map();
    // hide every copy first, then show the one in use
    for (const card of pieceNodes.values()) Object.assign(nodes, card.frame({x: 0, y: 0, s: 1, c: 1}, 0));
    for (const card of free.values()) Object.assign(nodes, card.frame({x: 0, y: 0, s: 1, c: 1}, 0));
    // pieces not driven by the script sit in the first compartment listed for them
    const drive = {};
    for (const [i, c] of o.occupancy) if (!(i in drive)) drive[i] = {where: 'slot', c, rise: 0, holder: null};
    Object.assign(drive, s.pieces);
    for (const [iStr, st] of Object.entries(drive)) {
      const i = Number(iStr);
      let p;
      if (st.holder === 'l' && st.grip !== 'edge') {
        const hd = mf.hands.l;
        const c0 = st.pose ? st.pose.c : 1, s0 = st.pose ? st.pose.s : 1, sx0 = st.pose && st.pose.sx !== undefined ? st.pose.sx : 1;
        p = {x: hd.x - sx0 * M.gripTab.x, y: hd.y + c0 * (M.H - M.gripTab.y), s: s0, c: c0};
        if (sx0 !== 1) p.sx = sx0;
      } else if (st.holder === 'r') {
        const hd = mf.hands.r;
        const s0 = st.pose ? st.pose.s : 1, c0 = st.pose ? st.pose.c : 1;
        if (st.grip === 'tab') p = {x: hd.x - M.gripTab.x, y: hd.y + c0 * (M.H - M.gripTab.y), s: s0, c: c0};
        else p = {x: hd.x - M.gripEdge.x, y: hd.y + s0 * (M.H - M.gripEdge.y), s: s0, c: c0};
      } else if (st.where === 'slot') p = st.pose || seat(i, st.c, st.rise || 0);
      else p = st.pose;
      piecePose.set(i, p);
      if (st.where === 'slot') {
        const card = pieceNodes.get(`${i}@${st.c}`);
        if (card) Object.assign(nodes, card.frame(p, 1));
      } else {
        // the cover (opened by the right hand on its tab) follows the solved right hand
        if (st.coverHeld) {
          const hd = mf.hands.r;
          const c = (p.y - hd.y) / (M.H - M.gripTab.y);
          p = {...p, c};
          piecePose.set(i, p);
        }
        Object.assign(nodes, free.get(i).frame(p, 1));
      }
    }
    // roll-top
    let handle = null;
    if (o.cover) {
      let dy = clamp(s.cover ?? 0) * G.coverOpenDy;
      if (s.coverHeld) dy = clamp(G.coverHandle.y - mf.hands.l.y, 0, G.coverOpenDy);
      nodes[`${P}-cover`] = {transform: T(0, -dy)};
      handle = {x: G.coverHandle.x, y: G.coverHandle.y - dy};
    }
    // visitor and bubble
    let vf = null;
    if (visitor) {
      const V = G.visitor;
      vf = visitor.frame({x: V.x, y: V.y, facing: -1, scale: V.k, mouth: s.visitor ? s.visitor.mouth : 0, headTilt: s.visitor ? s.visitor.tilt : 0, lean: 0});
      Object.assign(nodes, vf.nodes);
    }
    if (bubble) Object.assign(nodes, bubble.frame(s.bubble ? s.bubble.open : 0, s.bubble ? s.bubble.words : 0, ctx.reduced));
    return {nodes, mf, vf, piecePose, handle, reached: mf.reached && (!vf || vf.reached)};
  }

  return {node, pose, G, M, looks, assistant, visitor, bubble, seat, tabAt, edgeAt, pieceNodes, free};
}

/**
 * Speech bubble (tail at the speaker's mouth). The body opens first (from the
 * tail), then its supplied text fades in: no text is ever drawn on the growing
 * body. With labels hidden it holds abstract speech lines drawn on.
 * Named `${name}` (open), `${name}-txt`, `${name}-w${i}`.
 */
export function requestBubble(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o.box;
  const rr = Math.min(28, hh * 0.3);
  const tip = o.tail;
  const bw = Math.min(40, w * 0.14);
  let d;
  if (tip.y > y + hh) {
    const bx = clamp(tip.x, x + rr + bw, x + w - rr - bw);
    d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(bx + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(bx - bw / 2)} ${r(y + hh)}H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  } else if (tip.x > x + w) {
    const by = clamp(tip.y, y + rr + bw, y + hh - rr - bw);
    d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(by - bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(x + w)} ${r(by + bw / 2)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  } else {
    const by = clamp(tip.y, y + rr + bw, y + hh - rr - bw);
    d = `M${r(x + rr)} ${r(y)}H${r(x + w - rr)}Q${r(x + w)} ${r(y)} ${r(x + w)} ${r(y + rr)}V${r(y + hh - rr)}Q${r(x + w)} ${r(y + hh)} ${r(x + w - rr)} ${r(y + hh)}`
      + `H${r(x + rr)}Q${r(x)} ${r(y + hh)} ${r(x)} ${r(y + hh - rr)}V${r(by + bw / 2)}L${r(tip.x)} ${r(tip.y)}L${r(x)} ${r(by - bw / 2)}V${r(y + rr)}Q${r(x)} ${r(y)} ${r(x + rr)} ${r(y)}Z`;
  }
  const parts = [h('path', {d, fill: th.shadow, transform: T(5, 7)}), h('path', {d, fill: th.card, stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round'}),
    // the body without its tail (for layout audits)
    h('rect', {name: `${o.name}-body`, x: r(x), y: r(y), width: r(w), height: r(hh), fill: 'none', stroke: 'none'})];
  let txt = null;
  const lines = [];
  if (o.showText && o.fit) txt = textBlock(o.fit, {x: x + w / 2, y: y + (hh - o.fit.height) / 2, anchor: 'middle', fill: INK, name: `${o.name}-txt`, opacity: 0});
  else {
    const k = 2;
    for (let i = 0; i < k; i++) {
      const len = (w * 0.7) * (i === k - 1 ? 0.6 : 1);
      lines.push({x1: x + (w - w * 0.7) / 2, y: y + hh * (i + 1) / (k + 1), len});
    }
  }
  const lw = Math.max(7, Math.min(12, hh * 0.08));
  const lineNodes = lines.map((l, i) => h('line', {name: `${o.name}-w${i}`, x1: r(l.x1), x2: r(l.x1 + l.len), y1: r(l.y), y2: r(l.y), stroke: th.inkSoft, 'stroke-width': r(lw), 'stroke-linecap': 'round', 'stroke-dasharray': `${r(l.len)} ${r(l.len + 30)}`, 'stroke-dashoffset': r(l.len)}));
  const node = g({name: o.name, opacity: 0}, parts, lineNodes, txt);
  return {
    node, box: o.box, tip,
    frame(open, words, reduced) {
      const out = {};
      const k = open <= 0 ? 0.3 : 0.3 + 0.7 * (reduced ? ease.outCubic(open) : ease.outBack(open));
      out[o.name] = {opacity: r(clamp(open * 3), 3), transform: scaleAbout(tip.x, tip.y, k)};
      // text only once the body is fully open
      const tw = open >= 1 ? words : 0;
      lines.forEach((l, i) => { out[`${o.name}-w${i}`] = {'stroke-dashoffset': r(l.len * (1 - clamp(tw * lines.length - i)))}; });
      if (txt) out[`${o.name}-txt`] = {opacity: r(clamp(tw * 3), 3)};
      return out;
    },
  };
}

/* ------------------------------------------------------------ choreography */

const E = t => ease.inOutSine(clamp(t));
const mixP = (a, b, t) => ({x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t)});
/** hand path that dips (arc) between two points */
const arcP = (a, b, t, lift) => {
  const k = E(t);
  const p = mixP(a, b, k);
  return {x: p.x, y: p.y - Math.sin(Math.PI * k) * lift};
};

/**
 * Consultation choreography over supplied windows (normalized u). Pure: u → pose input.
 * @param {ReturnType<typeof fileStage>} st
 * @param {{target:number, from:number, home:number, touch:number[], final:'returned'|'open-on-desk', W:Record<string,[number,number]>, cover?:boolean}} o
 *   target: piece index; from: compartment where it is found; home: its own compartment;
 *   touch: compartments the hand runs along (in order; the last is `from`).
 * Windows: toTabs, run, pinch, lift, carry, toEdge, swap (left lets go), lay, toCover, open, read, toCover2, close, toEdge2,
 *   lift2, toTab2, swap2 (right lets go), carryBack, insert, release; with cover: toHandle, roll, fromHandle.
 */
export function consultScript(st, o) {
  const {G, M} = st;
  const z = G.z;
  const W = o.W;
  const n = G.n;
  const home = o.home, from = o.from;
  const tgt = o.target;
  // touch points: the tab of each touched compartment's front piece (or where a tab would be)
  const touchPt = c => ({x: G.cab.cardX + M.tab.x + M.tab.w * 0.5, y: G.rows[c].stripTop + M.tab.y - 0.08 * G.F});
  const tabGrip = (c, rise = 0) => ({x: G.cab.cardX + M.gripTab.x, y: G.rows[c].stripTop - rise + M.gripTab.y});
  const handoff = standing(M, G.handoffX, G.handoffTop);
  const lie = {x: G.lie.x, y: G.lie.y, s: FORE, c: FORE};
  const lieTab = c => ({x: G.lie.x + M.gripTab.x, y: G.lie.y - c * (M.H - M.gripTab.y)});
  const lieEdge = {x: G.lie.x + M.gripEdge.x, y: G.lie.y - FORE * (M.H - M.gripEdge.y)};
  const hoEdge = {x: handoff.x + M.gripEdge.x, y: handoff.y - (M.H - M.gripEdge.y)};
  const hoTab = {x: handoff.x + M.gripTab.x, y: handoff.y - (M.H - M.gripTab.y)};
  const restL = G.restL, restR = G.restR;
  const openFinal = o.final === 'open-on-desk';
  const P = (u, k) => seg(u, W[k][0], W[k][1]);
  const inW = (u, k) => u >= W[k][0] && u < W[k][1];
  const after = (u, k) => u >= W[k][1];
  // path of the standing piece between the lifted seat and the hand-off (down first, then across)
  // straight down in front of its column first, then across to the hand-off below the lowest strip
  const seatTop = (c, rise) => ({x: G.cab.cardX, y: G.rows[c].stripTop - rise});
  // side path between a compartment's mouth and the hand-off, never over another compartment: the piece swings
  // out about its top edge until it only covers its own strip band (squashed to SQ0), turns about its tab end
  // (edge-on, SX0) while the tab passes the plate post, drops beside the cabinet standing up again, then turns
  // back to face the viewer on its way across to the hand-off below the lowest strip
  const H = M.H;
  const SQ0 = sideSquash(M), SX0 = sideTurn(M);
  const tabS = G.sideTabX;
  const sidePose = (c, t) => {
    const top0 = G.rows[c].stripTop;
    const tab0 = G.cab.cardX + M.gripTab.x, tabH = handoff.x + M.gripTab.x;
    // one eased motion over the whole path, at roughly constant speed along it
    const dA = Math.abs(tabS - tab0) + (1 - SX0) * M.W * 0.5;
    const dB = Math.abs((G.handoffTop + H) - (top0 + SQ0 * H));
    const dC = Math.abs(tabS - tabH) + (1 - SX0) * M.W * 0.5;
    const tot = dA + dB + dC || 1;
    const d = E(t) * tot;
    let tx, top, sq, sx;
    if (d <= dA) { const k = dA ? d / dA : 1; tx = lerp(tab0, tabS, k); sx = lerp(1, SX0, k); top = top0; sq = SQ0; }
    else if (d <= dA + dB) { const k = dB ? (d - dA) / dB : 1; tx = tabS; sx = SX0; top = lerp(top0, G.handoffTop, k); sq = lerp(SQ0, 1, k); }
    else { const k = dC ? (d - dA - dB) / dC : 1; tx = lerp(tabS, tabH, k); sx = lerp(SX0, 1, k); top = G.handoffTop; sq = 1; }
    const pp = {x: tx - sx * M.gripTab.x, y: top + sq * H, s: sq, c: sq};
    if (sx !== 1) pp.sx = sx;
    return pp;
  };
  const tabOf = p => ({x: p.x + (p.sx ?? 1) * M.gripTab.x, y: p.y - p.c * (H - M.gripTab.y)});
  // leaf/cover lying pose between hand-off (standing) and the desk
  const tipPose = t => {
    const k = E(t);
    const th = lerp(THETA_UP, 0, k);
    const s = projH(th);
    return {x: lerp(handoff.x, G.lie.x, k), y: lerp(handoff.y, G.lie.y, k), s, c: s};
  };
  const openPose = t => ({...lie, c: projH(lerp(0, Math.PI, E(t)))});
  const coverRest = openFinal ? 1 : 0;

  return (u, timeMs, reduced) => {
    let left = restL, right = restR, openL = 0, openR = 0, look = 0, tilt = 0;
    let piece = {where: 'slot', c: from, rise: 0, holder: null};
    let cover = o.cover ? 0 : null;
    let coverHeld = false;
    let phase = 'rest';
    // ---- roll-top (contrast only)
    if (o.cover) {
      const hd = G.coverHandle;
      const up = {x: hd.x, y: hd.y - G.coverOpenDy};
      if (inW(u, 'toHandle')) { left = arcP(restL, hd, P(u, 'toHandle'), 8 * z); openL = 0; phase = 'to-handle'; look = -0.8; }
      else if (inW(u, 'roll')) { left = mixP(hd, up, E(P(u, 'roll'))); coverHeld = true; phase = 'roll'; look = -0.8; }
      else if (W.fromHandle && inW(u, 'fromHandle')) { left = arcP(up, restL, P(u, 'fromHandle'), 6 * z); phase = 'from-handle'; }
      if (u >= W.roll[1]) cover = 1;
      else if (u >= W.roll[0]) cover = E(P(u, 'roll'));
    }
    const startL = o.cover && !W.fromHandle ? {x: G.coverHandle.x, y: G.coverHandle.y - G.coverOpenDy} : restL;
    // ---- left hand: along the tabs
    const pts = o.touch.map(touchPt);
    if (inW(u, 'toTabs')) { left = arcP(startL, pts[0], P(u, 'toTabs'), 10 * z); openL = 1; phase = 'to-tabs'; look = -0.8; }
    else if (inW(u, 'run')) {
      const t = P(u, 'run') * (pts.length - 1);
      const i = Math.min(pts.length - 2, Math.floor(t));
      const k = pts.length > 1 ? t - i : 1;
      // travel for 70% of each hop, rest on the tab for 30%
      left = pts.length > 1 ? arcP(pts[i], pts[i + 1], clamp(k / 0.7), 6 * z) : pts[0];
      openL = 1; phase = 'run'; look = -0.9; tilt = -3;
    } else if (inW(u, 'pinch')) {
      left = mixP(pts[pts.length - 1], tabGrip(from), E(P(u, 'pinch')));
      openL = 1 - P(u, 'pinch'); phase = 'pinch'; look = -0.9; tilt = -3;
    } else if (inW(u, 'lift')) {
      // swings out about its top edge (the tab stays in the hand) until only its own strip band is covered
      const sq = lerp(1, SQ0, E(P(u, 'lift')));
      const top = G.rows[from].stripTop;
      const pp = {x: G.cab.cardX, y: top + sq * H, s: sq, c: sq};
      piece = {where: 'slot', c: from, rise: 0, holder: 'l', pose: pp};
      left = tabOf(pp); phase = 'lift'; look = -0.8;
    } else if (u >= W.lift[1] && u < W.swap[1]) {
      // carry to the hand-off along the side path, then hold until the right hand has taken it
      const sp = inW(u, 'carry') ? sidePose(from, P(u, 'carry')) : {...handoff};
      piece = {where: 'free', pose: sp, holder: 'l'};
      left = tabOf(sp);
      phase = inW(u, 'carry') ? 'carry' : 'handoff'; look = -0.2;
    }
    // ---- right hand: take the piece, lay it down, open, read, close, lift, give back
    if (u >= W.toEdge[0] && u < W.toEdge[1]) { right = arcP(restR, hoEdge, P(u, 'toEdge'), 8 * z); }
    if (u >= W.toEdge[1] && u < W.swap[1]) {
      right = hoEdge;
      if (u >= W.swap[0]) phase = 'handoff';
    }
    if (u >= W.swap[1] && u < W.lay[1]) {
      // left lets go; right lays the piece on the desk
      const tp = tipPose(P(u, 'lay'));
      piece = {where: 'free', pose: tp, holder: 'r', grip: 'edge'};
      right = {x: tp.x + M.gripEdge.x, y: tp.y - tp.s * (M.H - M.gripEdge.y)};
      left = mixP(hoTab, restL, E(seg(u, W.swap[1], W.lay[1])));
      phase = 'lay'; look = 0.1; tilt = -3;
    }
    if (u >= W.lay[1]) {
      piece = {where: 'free', pose: {...lie}, holder: null};
      phase = 'on-desk';
      if (o.open === false && u < W.lift2[0]) {
        piece = {where: 'free', pose: {...lie}, holder: 'r', grip: 'edge'};
        right = lieEdge;
        if (inW(u, 'read')) {
          const t = P(u, 'read');
          const sweep = reduced ? 0.2 : Math.sin(t * Math.PI * 4) * 0.45;
          look = 0.1 + sweep * Math.sin(Math.PI * t); tilt = -8 * Math.sin(Math.PI * t);
          phase = 'read';
        }
      }
    }
    if (inW(u, 'toCover')) { right = arcP(lieEdge, lieTab(FORE), P(u, 'toCover'), 6 * z); phase = 'to-cover'; look = 0.1; tilt = -4; }
    if (inW(u, 'open')) {
      const pp = openPose(P(u, 'open'));
      piece = {where: 'free', pose: pp, holder: null, coverHeld: true};
      right = lieTab(pp.c); phase = 'open'; look = 0.1; tilt = -5;
    }
    const opened = o.open !== false && u >= W.open[1] && (openFinal || u < W.close[0]);
    if (opened) {
      piece = {where: 'free', pose: {...lie, c: -FORE}, holder: null};
      const rt = W.read;
      if (u < rt[0]) { right = mixP(lieTab(-FORE), restR, E(seg(u, W.open[1], rt[0]))); phase = 'open'; tilt = -5; }
      else if (u < rt[1] || openFinal) {
        right = openFinal && u >= rt[1] ? restR : restR;
        const t = seg(u, rt[0], rt[1]);
        // reading: head bowed towards the page, eyes run along the lines
        const sweep = reduced ? 0.2 : Math.sin(t * Math.PI * 5) * 0.45;
        const inRead = u < rt[1];
        look = inRead ? 0.1 + sweep : 0; tilt = inRead ? -8 * Math.sin(Math.PI * clamp(t * 1.2)) - 2 : 0;
        phase = inRead ? 'read' : 'open-on-desk';
      } else if (u < W.toCover2[1]) {
        right = arcP(restR, lieTab(-FORE), P(u, 'toCover2'), 6 * z);
        phase = 'to-cover'; tilt = -3;
      }
    }
    if (!openFinal) {
      if (inW(u, 'close')) {
        const pp = openPose(1 - P(u, 'close'));
        piece = {where: 'free', pose: pp, holder: null, coverHeld: true};
        right = lieTab(pp.c); phase = 'close'; tilt = -4;
      }
      if (inW(u, 'toEdge2')) { piece = {where: 'free', pose: {...lie}, holder: null}; right = arcP(lieTab(FORE), lieEdge, P(u, 'toEdge2'), 5 * z); phase = 'to-edge'; }
      if (inW(u, 'lift2')) {
        const tp = tipPose(1 - P(u, 'lift2'));
        piece = {where: 'free', pose: tp, holder: 'r', grip: 'edge'};
        right = {x: tp.x + M.gripEdge.x, y: tp.y - tp.s * (M.H - M.gripEdge.y)};
        phase = 'lift';
      }
      if (u >= W.toTab2[0] && u < W.swap2[1]) {
        left = u < W.toTab2[1] ? arcP(restL, hoTab, P(u, 'toTab2'), 8 * z) : hoTab;
        if (u >= W.lift2[1]) {
          piece = {where: 'free', pose: {...handoff}, holder: 'r', grip: 'edge'};
          right = hoEdge;
          phase = 'handoff';
        }
      }
      if (u >= W.swap2[1] && u < W.insert[1]) {
        right = mixP(hoEdge, restR, E(seg(u, W.swap2[1], W.carryBack[1])));
        if (u < W.carryBack[1]) {
          // the side path in reverse: across below the strips, up right of the cabinet, in sideways at its own band
          const sp = sidePose(home, 1 - P(u, 'carryBack'));
          piece = {where: 'free', pose: sp, holder: 'l'};
          left = tabOf(sp);
          phase = 'carry-back'; look = -0.7;
        } else {
          // swings back upright about its top edge into its compartment (lower part behind the pieces in front)
          const sq = lerp(SQ0, 1, E(P(u, 'insert')));
          const pp = {x: G.cab.cardX, y: G.rows[home].stripTop + sq * H, s: sq, c: sq};
          piece = {where: 'slot', c: home, rise: 0, holder: 'l', pose: pp};
          left = tabOf(pp); phase = 'insert'; look = -0.8;
        }
      }
      if (u >= W.insert[1]) {
        piece = {where: 'slot', c: home, rise: 0, holder: null};
        if (u < W.release[1]) { left = arcP(tabGrip(home), restL, P(u, 'release'), 10 * z); openL = P(u, 'release') < 0.5 ? P(u, 'release') * 2 : 2 - P(u, 'release') * 2; phase = 'release'; }
        else phase = 'returned';
      }
    }
    return {hands: {left, right, openL, openR, look, tilt}, piece, cover, coverHeld, phase, coverRest};
  };
}

/* ------------------------------------------------------------------ labels */

/**
 * Key: tab and plate glyphs with their meaning and the neutral note
 * "as supplied · no conclusion drawn". Measured first, built at (x, y).
 */
export function keyLayout(ctx, o) {
  const th = ctx.theme;
  const s = o.size;
  const gw = 1.5 * s;
  const tx = gw + s * 0.4;
  const gapX = s * 0.9, gapY = s * 0.35;
  const f1 = fitWords(glueNums(ctx.t.keyTab), {maxWidth: Math.max(40, o.w - tx), size: s, minSize: s, maxLines: 3, weight: 600});
  const f2 = fitWords(glueNums(ctx.t.keyPlate), {maxWidth: Math.max(40, o.w - tx), size: s, minSize: s, maxLines: 3, weight: 600});
  const note = fitWords(ctx.t.keyNote, {maxWidth: Math.max(40, o.w - s * 0.8), size: s, minSize: s, maxLines: 5, weight: 600});
  // items flow left → right and wrap into rows within the width
  const items = [
    {kind: 'tab', f: f1, w: tx + f1.width, h: Math.max(f1.height, s * 1.1)},
    {kind: 'plate', f: f2, w: tx + f2.width, h: Math.max(f2.height, s * 1.1)},
    {kind: 'note', f: note, w: note.width + s * 0.8, h: note.height + s * 0.4},
  ];
  const rows = [];
  let cur = null;
  for (const it of items) {
    if (!cur || cur.w + gapX + it.w > o.w + 0.5) { cur = {items: [], w: -gapX, h: 0}; rows.push(cur); }
    it.dx = cur.w + gapX;
    cur.items.push(it);
    cur.w += gapX + it.w;
    cur.h = Math.max(cur.h, it.h);
  }
  const hgt = rows.reduce((acc, rw) => acc + rw.h, 0) + gapY * (rows.length - 1);
  return {
    h: hgt,
    w: Math.max(...rows.map(rw => rw.w)),
    rows: rows.length,
    ok: !note.truncated && !f1.truncated && !f2.truncated && Math.max(...items.map(it => it.w)) <= o.w + 0.5,
    build(x, y0, name = 'key') {
      const parts = [];
      let y = y0;
      for (const rw of rows) {
        for (const it of rw.items) {
          const ix = x + it.dx, iy = y + (rw.h - it.h) / 2;
          if (it.kind === 'note') {
            parts.push(h('rect', {x: r(ix), y: r(iy), width: r(it.w), height: r(it.h), rx: r(s * 0.35), fill: '#f7f1e3', stroke: th.ink, 'stroke-width': 2}));
            parts.push(textBlockAt(it.f, ix + s * 0.4, iy + s * 0.2, th.ink));
          } else {
            const cy = iy + it.h / 2;
            parts.push(h('path', {d: roundRectPath(ix, cy - 0.5 * s, gw, s, 4), fill: it.kind === 'tab' ? '#e3c16f' : '#d8b45a', stroke: INK, 'stroke-width': 1.8}));
            if (it.kind === 'plate') {
              parts.push(h('circle', {cx: r(ix + 0.25 * s), cy: r(cy), r: r(0.08 * s), fill: '#6b5220'}));
              parts.push(h('circle', {cx: r(ix + gw - 0.25 * s), cy: r(cy), r: r(0.08 * s), fill: '#6b5220'}));
            }
            parts.push(textBlockAt(it.f, ix + tx, iy + (it.h - it.f.height) / 2, INK));
          }
        }
        y += rw.h + gapY;
      }
      return g({name}, parts);
    },
  };
}

export function textBlockAt(f, x, y, fill, name) {
  const baseline = y + f.size * 0.8;
  return h('text', {name, x: r(x), y: r(baseline), 'font-family': FONT, 'font-size': r(f.size, 2), 'font-weight': f.weight, fill},
    f.lines.map((line, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(f.lineHeight, 2)}, line)));
}

/** Segment p–q hits box b (sampled). */
export function segHitsBox(p, q, b, pad = 0) {
  for (let k = 0; k <= 24; k++) {
    const x = p.x + (q.x - p.x) * k / 24, y = p.y + (q.y - p.y) * k / 24;
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
  }
  return false;
}

/** Bounding box of a piece at pose p (tab included). */
export function pieceBox(M, p) {
  const top = p.y - Math.max(p.s, p.c) * M.H - Math.max(0, p.c) * M.tabP;
  const bottom = p.y + Math.max(0, -p.c) * (M.H + M.tabP);
  return {x: p.x, y: top, w: M.W * (p.sx ?? 1), h: bottom - top};
}

/**
 * Compartments (other than `own`) whose visible strip band (title, tab and plate) the piece in pose p covers.
 * In its own compartment (where === 'slot') only the part above its compartment's front wall is visible.
 */
export function foreignSlotHits(G, M, p, where, own) {
  const b = pieceBox(M, p);
  if (where === 'slot') { const bot = Math.min(b.y + b.h, G.rows[own].wallTop); b.h = Math.max(0, bot - b.y); }
  const hits = [];
  G.rows.forEach((row, c) => {
    if (c === own) return;
    const band = {x: G.cab.innerL, y: row.stripTop + M.tab.y, w: G.cab.r - G.cab.innerL, h: M.stripH - M.tab.y};
    if (b.h > 0 && b.x < band.x + band.w - 1 && b.x + b.w > band.x + 1 && b.y < band.y + band.h - 1 && b.y + b.h > band.y + 1) hits.push(c);
  });
  return hits;
}

/**
 * Piece state (for fileStage.pose) moving between two compartments without passing over any other compartment:
 * it swings about its top edge until it covers only its own strip band, turns edge-on about its tab end past the
 * plate post, travels up or down beside the cabinet, turns back to face the viewer in the band of its new
 * compartment and swings upright into it. rFrom / rTo: how far it stands raised in each compartment (a piece that,
 * as supplied, stands behind the compartment's own piece shows its strip above it).
 */
export function slotTransfer(G, M, from, rFrom, to, rTo, t) {
  const H = M.H, SQ0 = sideSquash(M), SX0 = sideTurn(M), tabS = G.sideTabX, tab0 = G.cab.cardX + M.gripTab.x;
  const top0 = G.rows[from].stripTop - rFrom, top1 = G.rows[to].stripTop - rTo;
  const pose = (tx, top, sq, sx) => { const p = {x: tx - sx * M.gripTab.x, y: top + sq * H, s: sq, c: sq}; if (sx !== 1) p.sx = sx; return p; };
  if (t <= 0) return {where: 'slot', c: from, rise: rFrom};
  if (t >= 1) return {where: 'slot', c: to, rise: rTo};
  const dS = 0.6 * H * (1 - SQ0), dT = Math.abs(tabS - tab0) + (1 - SX0) * M.W * 0.5, dV = Math.abs(top1 - top0);
  const segs = [dS, dT, dV, dT, dS];
  const tot = segs.reduce((a, b) => a + b, 0) || 1;
  let d = E(t) * tot, i = 0;
  while (i < 4 && d > segs[i]) { d -= segs[i]; i++; }
  const k = segs[i] ? clamp(d / segs[i]) : 1;
  if (i === 0) return {where: 'slot', c: from, pose: pose(tab0, top0, lerp(1, SQ0, k), 1)};
  if (i === 1) return {where: 'free', pose: pose(lerp(tab0, tabS, k), top0, SQ0, lerp(1, SX0, k))};
  if (i === 2) return {where: 'free', pose: pose(tabS, lerp(top0, top1, k), SQ0, SX0)};
  if (i === 3) return {where: 'free', pose: pose(lerp(tabS, tab0, k), top1, SQ0, lerp(SX0, 1, k))};
  return {where: 'slot', c: to, pose: pose(tab0, top1, lerp(SQ0, 1, k), 1)};
}
