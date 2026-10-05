/**
 * Custody desk for the "Custodia del original" motif (LAW-0037..0040).
 *
 * Top-down records desk inside a clipped window. The custodian (A) sits at
 * the bottom edge, the reader (B) at the right edge (top edge on tall
 * stages). Original props (all original vector geometry):
 *
 *  - `custodySheet`  a front-facing sheet in three kinds: `original` (warm
 *     paper, blue wet-ink signature, red ribbon rosette), `copy` (cool grey
 *     paper with a toner edge, grey reproduced signature, a rectangular
 *     copy mark, optional redaction bars and a layer of reader's pen notes
 *     drawn stroke by stroke) and `plain` (for the contrast, where the only
 *     difference is the status mark stamped during the scene). The identity
 *     mark (rosette or copy mark) always sits at the same spot: bottom-right
 *     of the signature zone.
 *  - `archiveBox`   an open archival box seen from above: rim, four inner
 *     walls in slight perspective, hand holes, floor; a hinged lid (hinge on
 *     the custodian's left) that closes by folding over the hinge (scaleX
 *     from −0.4 to 1, underside shown while negative), a label card and a
 *     seal spot on the lid; a `rimOver` ring that is switched on while the
 *     original sinks, so the sheet is seen INSIDE the walls.
 *  - `workFolder`   the reader's open manila working file.
 *
 * `custodyDesk` composes them with four IK arms (A1 lid hand, A2 document /
 * stamp hand, B1 receiving hand, B2 pen hand). `pose(s)` turns action values
 * (each in [0,1]) into node props and semantics; every entry owns its own
 * timeline, layout and semantics.
 *
 * Attachment rules (asserted by the tests through semantics):
 *  - a sheet that is pushed, carried or pulled is placed from the solved hand
 *    (grip point == solved hand); once released it glides/sinks on its own
 *    and never jumps;
 *  - the lid's free edge is placed under A1's solved hand while closing;
 *  - the stamp follows A2's solved hand; its mark appears on contact;
 *  - the pen follows B2's solved hand; its tip IS the end of the ink stroke
 *    while writing;
 *  - every IK target is within arm reach (`allReached`).
 * @module animations/documents/kits/custodia-del-original
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, ease, r, seg} from '../../../core/time.js';
import {mix, rad, dist, polyline, catmullRom, roundRectPath} from '../../../core/geometry.js';
import {signatureStroke, pen, stampTool, shade} from '../../../primitives/paper.js';
import {deskWindow, topArm} from '../../../primitives/desk.js';
import {chip, textBlock} from '../../../primitives/annotate.js';
import {actorLook} from '../../../primitives/people-style.js';
import {str, int, list, obj, party, documentsFields} from '../../../schemas/fields.js';

/* ------------------------------------------------------------------------ */
/* Fields and strings                                                        */
/* ------------------------------------------------------------------------ */

/** Category document fields, re-described for this motif. */
export const custodyDocFields = {
  ...documentsFields,
  signers: list('Custodian (first, keeps the original) and reader (second, receives the working copy); fictional by default', party, 2, 2),
  redactions: list('Zero-based clause indices redacted on the circulating copy only (the kept original stays complete)', int('Clause index', 0, 4), 0, 5),
};

/** Labels printed on the motif's props. */
export const custodyObjectLabels = obj('Labels printed on props', {
  box: str('Label card on the archive box lid (e.g. "Box 07 · Originals"); wraps to two lines', 64),
  seal: str('Text of the custody seal stamped on the closed lid', 24),
  copyMark: str('Status mark printed on the working copy (e.g. "COPY")', 40),
  folder: str('Label on the reader’s working file', 40),
});

export const CUSTODY_STRINGS = {
  en: {sealed: 'Sealed', closed: 'Lid closed', open: 'Lid open', inBox: 'Original in the box', circulating: 'Copy in circulation', annotated: 'Annotated', unchanged: 'Unchanged', original: 'Original', copy: 'Working copy', boxLabel: 'Box label', copyMark: 'Copy mark', seal: 'Seal', custody: 'Custody', circulation: 'Circulation'},
  es: {sealed: 'Precintada', closed: 'Tapa cerrada', open: 'Tapa abierta', inBox: 'Original en la caja', circulating: 'Copia en circulación', annotated: 'Anotada', unchanged: 'Sin cambios', original: 'Original', copy: 'Copia de trabajo', boxLabel: 'Etiqueta de la caja', copyMark: 'Marca de copia', seal: 'Precinto', custody: 'Custodia', circulation: 'Circulación'},
};

/* ------------------------------------------------------------------------ */
/* Palette of the props (props keep their own fills on every background)     */
/* ------------------------------------------------------------------------ */

export const INK_BLUE = '#1d3f8f';
export const COPY_PAPER = '#e9edf1';
export const COPY_LINE = '#b3bcc5';
export const COPY_INK = '#6a737c';
export const ROSETTE = '#b3322b';
export const NOTE_INK = '#1f6b47';
export const BOX = {
  rim: '#c3ccd5', outer: '#a9b5c0', wallFar: '#7e8c99', wallLeft: '#8e9ba7', wallRight: '#a6b1bb', wallNear: '#b5bfc8',
  floor: '#94a1ad', hole: '#46515c', lid: '#c9d2da', lidRim: '#aeb9c3', lidInner: '#8d9aa6', card: '#fbfaf6',
};
export const FOLDER = '#dcbc7d';
/** Neutral stamp body shared by both contrast scenes (no scenario colour). */
export const STAMP_BODY = '#6e7a86';

/* ------------------------------------------------------------------------ */
/* Small drawing helpers                                                     */
/* ------------------------------------------------------------------------ */

const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

function sheetPath(w, hh, fold) {
  return `M0 4Q0 0 4 0H${r(w - fold)}L${r(w)} ${r(fold)}V${r(hh - 4)}Q${r(w)} ${r(hh)} ${r(w - 4)} ${r(hh)}H4Q0 ${r(hh)} 0 ${r(hh - 4)}Z`;
}

/**
 * Rectangular ink mark (status / seal impression). Local origin = centre.
 * Text wraps to two lines; the box grows to fit. With text hidden, two bars.
 * @returns {{node:any, w:number, h:number}}
 */
export function inkMark(ctx, {name, text, w, color, rotate = -8, showText = true, opacity = 0, size}) {
  const base = size ?? w * 0.17;
  const maxW = w * 0.8;
  // shrink first so the widest single word fits (never split a word across lines)
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const widest = Math.max(1, ...words.map(wd => ctx.measure(wd, base, 800, 'sans') + wd.length * 1.2));
  const s0 = Math.max(Math.min(base, base * maxW / widest), 8);
  const f = ctx.fit(text, {maxWidth: maxW, size: s0, minSize: Math.max(8, Math.min(s0, base * 0.52)), maxLines: 4, weight: 800});
  const hh = Math.max(w * 0.34, f.height + s0 * 0.9);
  // named outer group (opacity / motion) around a rotated inner group
  const node = g({name, opacity}, g({transform: T(0, 0, rotate)},
    h('rect', {x: -w / 2, y: -hh / 2, width: w, height: hh, rx: 6, fill: '#ffffff', 'fill-opacity': 0.25, stroke: color, 'stroke-width': Math.max(2.5, w * 0.025)}),
    h('rect', {x: -w / 2 + 5, y: -hh / 2 + 5, width: w - 10, height: hh - 10, rx: 4, fill: 'none', stroke: color, 'stroke-width': 1.4}),
    showText
      ? textBlock(f, {x: 0, y: -f.height / 2, anchor: 'middle', fill: color, letterSpacing: 1})
      // labels hidden: one ink bar per line, as long as the line it replaces,
      // so a changed mark still changes shape
      : f.lines.map((ln, i) => {
        const bw = Math.min(w * 0.76, Math.max(w * 0.18, ctx.measure(ln, f.size, 800, 'sans')));
        const y = -f.height / 2 + i * f.lineHeight + f.size * 0.5;
        return h('line', {x1: r(-bw / 2), x2: r(bw / 2), y1: r(y), y2: r(y), stroke: color, 'stroke-width': r(Math.max(3, f.size * 0.55)), 'stroke-linecap': 'round'});
      }),
  ));
  return {node, w, h: hh, fit: f};
}

/** Red ribbon rosette marking the original. Local origin = centre. */
export function rosette(ctx, {name, radius, opacity}) {
  const R = radius;
  const n = 14;
  let d = '';
  for (let i = 0; i <= n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? R * 0.86 : R;
    d += `${i ? 'L' : 'M'}${r(Math.cos(a) * rr)} ${r(Math.sin(a) * rr)}`;
  }
  const dark = shade(ROSETTE, -0.3);
  return g({name, opacity},
    h('path', {d: `M${r(-R * 0.35)} ${r(R * 0.5)}L${r(-R * 0.62)} ${r(R * 1.55)}L${r(-R * 0.3)} ${r(R * 1.32)}L${r(-R * 0.08)} ${r(R * 1.62)}L${r(R * 0.05)} ${r(R * 0.55)}Z`, fill: ROSETTE, stroke: dark, 'stroke-width': 1.5, 'stroke-linejoin': 'round'}),
    h('path', {d: `M${r(R * 0.3)} ${r(R * 0.5)}L${r(R * 0.66)} ${r(R * 1.5)}L${r(R * 0.34)} ${r(R * 1.3)}L${r(R * 0.1)} ${r(R * 1.58)}L${r(-R * 0.02)} ${r(R * 0.55)}Z`, fill: shade(ROSETTE, -0.12), stroke: dark, 'stroke-width': 1.5, 'stroke-linejoin': 'round'}),
    h('path', {d: d + 'Z', fill: ROSETTE, stroke: dark, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('circle', {r: R * 0.58, fill: shade(ROSETTE, 0.12), stroke: dark, 'stroke-width': 1.5}),
    h('circle', {r: R * 0.36, fill: 'none', stroke: '#f3d6cf', 'stroke-width': 1.6, opacity: 0.8}),
  );
}

/* ------------------------------------------------------------------------ */
/* Sheet                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * A sheet seen from above. Local origin = CENTRE (so it can rotate/scale in
 * place); `local()` converts top-left sheet coordinates to centre ones.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, kind:'original'|'copy'|'plain', docId?:string, title?:string, clauses?:string[], signer?:string, redactions?:number[], showText?:boolean,
 *   marks?:Array<{key:string, text:string, color:string, opacity?:number}>, rosette?:boolean, rosetteOpacity?:number, notes?:boolean, shadeNode?:boolean}} o
 */
export function custodySheet(ctx, o) {
  const th = ctx.theme;
  const {w, h: hh, prefix: P} = o;
  const kind = o.kind || 'plain';
  const copy = kind === 'copy';
  const showText = o.showText !== false;
  const paper = copy ? COPY_PAPER : th.paper;
  const line = copy ? COPY_LINE : th.paperLine;
  const inkSoft = copy ? '#59616a' : th.inkSoft;
  const pad = w * 0.09;
  const fold = w * 0.12;
  const inner = w - pad * 2;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(5, 8, w, hh, 6), fill: th.shadow}));
  parts.push(h('path', {d: sheetPath(w, hh, fold), fill: paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  if (copy) {
    // toner edge of a photocopy
    parts.push(h('path', {d: `M5 ${r(hh * 0.12)}V${r(hh - 6)}H${r(w * 0.6)}M${r(w - 5)} ${r(fold + 10)}V${r(hh * 0.7)}`, fill: 'none', stroke: '#c3cad1', 'stroke-width': 4, 'stroke-linecap': 'round'}));
  }
  parts.push(h('path', {d: `M${r(w - fold)} 0V${r(fold * 0.85)}Q${r(w - fold)} ${r(fold)} ${r(w - fold * 0.85)} ${r(fold)}H${r(w)}Z`, fill: copy ? '#d6dce2' : th.paperShade, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));

  // id row
  const idSize = Math.max(12, w * 0.05);
  let y = pad * 0.85;
  if (showText && o.docId) {
    const f = ctx.fit(o.docId, {maxWidth: inner - fold * 0.8, size: idSize, minSize: 9, maxLines: 1, weight: 600, family: 'mono'});
    parts.push(textBlock(f, {x: pad, y, fill: inkSoft}));
  } else parts.push(h('rect', {x: pad, y: y + 2, width: inner * 0.3, height: idSize * 0.55, rx: 3, fill: line}));
  y += idSize * 2.1;
  // title
  const titleSize = Math.max(15, w * 0.074);
  if (showText && o.title) {
    const f = ctx.fit(o.title, {maxWidth: inner, size: titleSize, minSize: Math.max(11, titleSize * 0.7), maxLines: 2, weight: 700, family: 'serif'});
    parts.push(textBlock(f, {x: pad, y, fill: copy ? '#2b3036' : th.ink}));
    y += f.height + titleSize * 0.45;
  } else {
    parts.push(h('rect', {x: pad, y, width: inner * 0.7, height: titleSize * 0.7, rx: 4, fill: copy ? '#3a4047' : th.ink, opacity: 0.75}));
    y += titleSize * 1.2;
  }
  parts.push(h('line', {x1: pad, x2: w - pad, y1: y, y2: y, stroke: line, 'stroke-width': 2}));
  y += titleSize * 0.45;

  // clauses
  const sigZone = hh * 0.27;
  const area = hh - sigZone - y - pad * 0.2;
  const clauses = (o.clauses && o.clauses.length ? o.clauses : ['', '', '']).slice(0, 5);
  const each = area / clauses.length;
  const barH = Math.max(4, w * 0.02);
  const headSize = Math.max(11, w * 0.047);
  const clauseBoxes = [];
  const redact = new Set((o.redactions || []).filter(i => i < clauses.length));
  clauses.forEach((text, i) => {
    const cy = y + i * each;
    let used = headSize * 1.4;
    let headW = inner * 0.5;
    if (text && showText) {
      const f = ctx.fit(`${i + 1}. ${text}`, {maxWidth: inner, size: headSize, minSize: 9, maxLines: 1, weight: 600});
      parts.push(textBlock(f, {x: pad, y: cy, fill: copy ? '#2b3036' : th.ink}));
      headW = f.width;
    } else {
      parts.push(h('rect', {x: pad, y: cy + headSize * 0.2, width: inner * 0.42, height: headSize * 0.62, rx: 3, fill: copy ? '#59616a' : th.inkSoft, opacity: 0.8}));
    }
    const bars = Math.max(1, Math.min(3, Math.floor((each - used - barH) / (barH * 2.2))));
    for (let b = 0; b < bars; b++) {
      const lw = inner * (b === bars - 1 ? 0.45 + ctx.rng(`custody-l-${o.seedKey || 'doc'}`, i * 7 + b) * 0.3 : 0.82 + ctx.rng(`custody-l-${o.seedKey || 'doc'}`, i * 7 + b) * 0.18);
      parts.push(h('rect', {x: pad, y: cy + used + b * barH * 2.2, width: r(lw), height: barH, rx: barH / 2, fill: line}));
    }
    if (copy && redact.has(i)) {
      parts.push(h('rect', {x: pad - 3, y: cy - 2, width: inner + 6, height: Math.min(each - 4, used + bars * barH * 2.2 + 2), rx: 3, fill: '#15181c'}));
    }
    clauseBoxes.push({x: pad, y: cy, w: inner, h: each, headH: used, headW, barsY: cy + used, redacted: copy && redact.has(i)});
  });

  // signature block (left half); identity zone (right half)
  const sigY = hh - pad * 1.3;
  const sigX2 = pad + inner * 0.52;
  parts.push(h('line', {x1: pad, x2: sigX2, y1: sigY, y2: sigY, stroke: copy ? '#5b636c' : th.ink, 'stroke-width': 2}));
  parts.push(h('path', {d: `M${r(pad)} ${r(sigY - 22)}l9 9m0 -9l-9 9`, stroke: inkSoft, 'stroke-width': 1.8, fill: 'none', 'stroke-linecap': 'round'}));
  const sigBox = {x: pad + 12, y: sigY - hh * 0.12, w: inner * 0.5 - 12, h: hh * 0.14};
  const sigPoly = signatureStroke(o.signer || 'A', ctx.rng, sigBox);
  parts.push(h('path', {d: sigPoly.d(1), fill: 'none', stroke: copy ? COPY_INK : INK_BLUE, 'stroke-width': copy ? 2.4 : 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: copy ? 0.9 : 1}));

  // identity spot: bottom-right of the signature zone, or (bodyMark) across
  // the middle of the page, as a large status stamp overprinting the clauses.
  // The body mark is nearly as wide as the sheet (its rotated box still fits
  // inside it) so the mark word is a key label, not small print.
  const idSpot = o.bodyMark ? {x: w * 0.5, y: hh * 0.52} : {x: pad + inner * 0.78, y: sigY - hh * 0.07};
  const markW = o.bodyMark ? w * 0.9 : inner * 0.5;
  const marks = {};
  const markNodes = (o.marks || []).map(m => {
    const im = inkMark(ctx, {name: `${P}-${m.key}`, text: m.text, w: markW, color: m.color, rotate: o.bodyMark ? -12 : -8, showText, opacity: m.opacity ?? 1, size: o.bodyMark ? w * 0.2 : undefined});
    marks[m.key] = im;
    return g({transform: T(idSpot.x, idSpot.y)}, im.node);
  });
  const ros = o.rosette ? g({transform: T(idSpot.x, idSpot.y - hh * 0.01)}, rosette(ctx, {name: `${P}-rosette`, radius: w * 0.07, opacity: o.rosetteOpacity ?? 1})) : null;

  // reader's notes (drawn stroke by stroke) — copy only
  let notes = null;
  if (o.notes) notes = notePlan(ctx, P, {w, pad, headSize, clauseBoxes, sigY, inner});

  const shadeNode = o.shadeNode ? h('path', {name: `${P}-depth`, d: sheetPath(w, hh, fold), fill: '#1f2a36', opacity: 0}) : null;
  const node = g({transform: T(-w / 2, -hh / 2)}, parts, markNodes, ros, notes && notes.node, shadeNode);
  return {
    node, w, h: hh, pad, inner, idSpot, markW, marks, sigBox, clauseBoxes, notes, headSize,
    /** top-left sheet coords → centre-origin coords */
    local: q => ({x: q.x - w / 2, y: q.y - hh / 2}),
  };
}

/**
 * Reader's pen notes on the copy: a margin tick, a wavy underline and a
 * loop around a clause number. Returns stroke nodes and a pen schedule whose
 * tip coincides with the end of the growing ink while it touches the paper.
 */
function notePlan(ctx, P, L) {
  const cb = L.clauseBoxes;
  const n = cb.length;
  const k1 = Math.min(1, n - 1);
  const k2 = Math.min(2, n - 1);
  const hs = L.headSize;
  const strokes = [];
  // 1) tick in the right margin beside the first clause
  const ty = cb[0].y + hs * 0.55;
  const tx = L.w - L.pad * 0.95;
  strokes.push(catmullRom([{x: tx, y: ty}, {x: tx + 6, y: ty + 8}, {x: tx + 16, y: ty - 10}], 6));
  // 2) wavy underline under the heading of clause k1 (right part first → toward B)
  const uy = cb[k1].y + hs * 1.16;
  const ux1 = L.pad + Math.min(L.inner * 0.95, cb[k1].headW + 6);
  const ux0 = L.pad + 2;
  const wave = [];
  const steps = 9;
  for (let i = 0; i <= steps; i++) wave.push({x: ux1 + (ux0 - ux1) * (i / steps), y: uy + (i % 2 ? 3 : -2)});
  strokes.push(catmullRom(wave, 5));
  // 3) loop around the number of clause k2
  const cx = L.pad + hs * 0.42, cyy = cb[k2].y + hs * 0.52;
  const rx = hs * 0.95, ry = hs * 0.78;
  const loop = [];
  for (let i = 0; i <= 26; i++) {
    const a = -0.3 + (i / 26) * Math.PI * 2.15;
    loop.push({x: cx + Math.cos(a) * rx * (1 + 0.04 * Math.sin(i)), y: cyy + Math.sin(a) * ry});
  }
  strokes.push(loop);
  const polys = strokes.map(pts => polyline(pts));
  // 5-unit ink (≈ 3–5 px at 1080p) so the transformation of the copy reads on a phone
  const nodes = polys.map((p, i) => h('path', {name: `${P}-note${i}`, d: p.d(1), fill: 'none', stroke: NOTE_INK, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(p.total)} ${r(p.total + 20)}`, 'stroke-dashoffset': r(p.total), opacity: 0}));
  // schedule: strokes at full weight, hops (pen lifted) at 0.5 weight
  const pieces = [];
  polys.forEach((p, i) => {
    if (i > 0) {
      const a = polys[i - 1].at(1), b = p.at(0);
      pieces.push({kind: 'hop', a, b, len: dist(a, b) * 0.5});
    }
    pieces.push({kind: 'ink', i, poly: p, len: p.total});
  });
  const total = pieces.reduce((s, q) => s + q.len, 0);
  /** Pen tip in sheet top-left coords at schedule progress p. */
  function tipAt(p) {
    let at = clamp(p) * total;
    const drawn = polys.map(() => 0);
    let tip = polys[0].at(0), down = false;
    for (const q of pieces) {
      if (at <= q.len || q === pieces[pieces.length - 1]) {
        const k = q.len ? clamp(at / q.len) : 1;
        if (q.kind === 'ink') {
          drawn[q.i] = k;
          tip = q.poly.at(k);
          down = p > 0 && p < 1;
        } else {
          tip = mix(q.a, q.b, ease.inOutSine(k));
          down = false;
        }
        break;
      }
      at -= q.len;
      if (q.kind === 'ink') drawn[q.i] = 1;
    }
    return {x: tip.x, y: tip.y, down, drawn};
  }
  function frame(p) {
    const {drawn} = tipAt(p);
    const out = {};
    polys.forEach((poly, i) => { out[`${P}-note${i}`] = {'stroke-dashoffset': r(poly.total * (1 - drawn[i])), opacity: drawn[i] > 0 ? 1 : 0}; });
    return out;
  }
  return {node: g(null, nodes), tipAt, frame, start: polys[0].at(0), end: polys[polys.length - 1].at(1), count: polys.length};
}

/* ------------------------------------------------------------------------ */
/* Archive box (top-down) with hinged lid                                    */
/* ------------------------------------------------------------------------ */

/**
 * Open archival box seen from above. Local origin = centre of the box.
 * @param {any} ctx
 * @param {{prefix:string, w:number, h:number, label?:string, labels?:string[], seal?:string, showText?:boolean, sealColor?:string}} o
 *   `labels` (optional) creates alternative label nodes `${prefix}-label{i}`.
 */
export function archiveBox(ctx, o) {
  const th = ctx.theme;
  const {prefix: P, w: BW, h: BH} = o;
  const showText = o.showText !== false;
  const t = Math.max(10, BW * 0.045);
  const f = BW * 0.14;
  const X0 = -BW / 2, Y0 = -BH / 2;
  const oX = X0 + t, oY = Y0 + t, oW = BW - 2 * t, oH = BH - 2 * t;
  const fX = X0 + f, fY = Y0 + f, fW = BW - 2 * f, fH = BH - 2 * f;
  const poly = pts => `M${pts.map(q => `${r(q[0])} ${r(q[1])}`).join('L')}Z`;
  const wallStroke = shade(BOX.outer, -0.3);
  const body = g({name: `${P}-body`},
    h('path', {d: roundRectPath(X0 + 10, Y0 + 14, BW, BH, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(X0, Y0, BW, BH, 6), fill: BOX.rim, stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: oX, y: oY, width: oW, height: oH, fill: BOX.floor}),
    h('path', {d: poly([[oX, oY], [oX + oW, oY], [fX + fW, fY], [fX, fY]]), fill: BOX.wallFar}),
    h('path', {d: poly([[oX, oY], [fX, fY], [fX, fY + fH], [oX, oY + oH]]), fill: BOX.wallLeft}),
    h('path', {d: poly([[oX + oW, oY], [oX + oW, oY + oH], [fX + fW, fY + fH], [fX + fW, fY]]), fill: BOX.wallRight}),
    h('path', {d: poly([[oX, oY + oH], [fX, fY + fH], [fX + fW, fY + fH], [oX + oW, oY + oH]]), fill: BOX.wallNear}),
    h('path', {d: `M${r(oX)} ${r(oY)}L${r(fX)} ${r(fY)}M${r(oX + oW)} ${r(oY)}L${r(fX + fW)} ${r(fY)}M${r(oX)} ${r(oY + oH)}L${r(fX)} ${r(fY + fH)}M${r(oX + oW)} ${r(oY + oH)}L${r(fX + fW)} ${r(fY + fH)}`, stroke: wallStroke, 'stroke-width': 1.6}),
    // floor shading along the far and left walls
    h('path', {d: poly([[fX, fY], [fX + fW, fY], [fX + fW, fY + 18], [fX + 18, fY + 18], [fX + 18, fY + fH], [fX, fY + fH]]), fill: '#2a333c', opacity: 0.12}),
    h('rect', {x: fX, y: fY, width: fW, height: fH, fill: 'none', stroke: wallStroke, 'stroke-width': 1.4}),
    // hand holes in the side walls
    h('ellipse', {cx: (oX + fX) / 2, cy: 0, rx: Math.max(4, (f - t) * 0.22), ry: BH * 0.075, fill: BOX.hole}),
    h('ellipse', {cx: (oX + oW + fX + fW) / 2, cy: 0, rx: Math.max(4, (f - t) * 0.22), ry: BH * 0.075, fill: BOX.hole}),
    h('rect', {x: oX, y: oY, width: oW, height: oH, fill: 'none', stroke: th.ink, 'stroke-width': 1.8}),
  );
  // rim drawn over a sheet that is inside the walls
  const rimD = `${roundRectPath(X0, Y0, BW, BH, 6)}M${r(oX)} ${r(oY)}V${r(oY + oH)}H${r(oX + oW)}V${r(oY)}Z`;
  const rimOver = g({name: `${P}-rimover`, opacity: 0},
    h('path', {d: rimD, fill: BOX.rim, 'fill-rule': 'evenodd', stroke: th.ink, 'stroke-width': th.stroke}),
    h('rect', {x: oX, y: oY, width: oW, height: oH, fill: 'none', stroke: th.ink, 'stroke-width': 1.8}));

  // lid (slightly larger than the box), hinge on the left edge
  const LW = BW + 10, LH = BH + 10;
  const hx = -LW / 2;
  const cardW = LW * 0.7, cardH = LH * 0.25;
  const cardY = -LH / 2 + LH * 0.13;
  const labelNodes = [];
  const labelTexts = o.labels && o.labels.length ? o.labels : [o.label || ''];
  labelTexts.forEach((txt, i) => {
    if (!txt) return;
    const lf = ctx.fit(txt, {maxWidth: cardW - 24, size: Math.max(16, LW * 0.075), minSize: 13, maxLines: 3, weight: 700});
    const y0 = cardY + (cardH - lf.height) / 2;
    // labels hidden: grey bars as long as the lines they replace
    const body = showText ? textBlock(lf, {x: 0, y: y0, anchor: 'middle', fill: th.ink})
      : lf.lines.map((ln, k) => {
        const bw = Math.min(cardW - 30, ctx.measure(ln, lf.size, 700, 'sans'));
        const y = y0 + k * lf.lineHeight + lf.size * 0.5;
        return h('line', {x1: r(-bw / 2), x2: r(bw / 2), y1: r(y), y2: r(y), stroke: th.inkSoft, 'stroke-width': r(lf.size * 0.5), 'stroke-linecap': 'round'});
      });
    labelNodes.push(g({name: `${P}-label${i}`, opacity: i === 0 ? 1 : 0}, body));
  });
  const sealSpot = {x: 0, y: LH * 0.18};
  const sealW = LW * 0.5;
  const seal = o.seal !== undefined ? inkMark(ctx, {name: `${P}-seal`, text: o.seal, w: sealW, color: o.sealColor || th.accent, rotate: -6, showText, opacity: 0}) : null;
  const lidRect = roundRectPath(-LW / 2, -LH / 2, LW, LH, 8);
  const lidOut = g({name: `${P}-lidout`},
    h('path', {d: lidRect, fill: BOX.lid, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(-LW / 2 + 12, -LH / 2 + 12, LW - 24, LH - 24, 5), fill: 'none', stroke: BOX.lidRim, 'stroke-width': 3}),
    h('path', {d: roundRectPath(-cardW / 2, cardY, cardW, cardH, 6), fill: BOX.card, stroke: th.ink, 'stroke-width': 2}),
    labelNodes,
    // hinge tape along the left edge
    h('rect', {x: -LW / 2 - 2, y: -LH / 2 + 18, width: 12, height: LH - 36, rx: 3, fill: shade(BOX.lid, -0.18), stroke: th.ink, 'stroke-width': 1.5}),
    seal ? g({transform: T(sealSpot.x, sealSpot.y)}, seal.node) : null,
  );
  const lidIn = g({name: `${P}-lidin`, opacity: 0},
    h('path', {d: lidRect, fill: BOX.lidInner, stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(-LW / 2 + 12, -LH / 2 + 12, LW - 24, LH - 24, 5), fill: shade(BOX.lidInner, -0.1), stroke: shade(BOX.lidInner, -0.3), 'stroke-width': 2}),
    // the half nearest the hinge is in the box's shadow; crease along the hinge
    h('rect', {x: -LW / 2 + 2, y: -LH / 2 + 2, width: LW * 0.42, height: LH - 4, fill: '#1f2a36', opacity: 0.16}),
    h('line', {x1: -LW / 2 + 6, x2: -LW / 2 + 6, y1: -LH / 2 + 10, y2: LH / 2 - 10, stroke: shade(BOX.lidInner, -0.4), 'stroke-width': 3}),
  );
  const lidShadow = h('path', {name: `${P}-lidshadow`, d: lidRect, fill: th.shadow});
  const lid = g({name: `${P}-lid`}, lidShadow, lidIn, lidOut);

  /** Lid props for fold value sx ∈ [−0.4, 1] (1 = closed). */
  function lidFrame(sx) {
    const s = Math.abs(sx) < 0.004 ? (sx < 0 ? -0.004 : 0.004) : sx;
    const tf = `translate(${r(hx)} 0) scale(${r(s, 4)} 1) translate(${r(-hx)} 0)`;
    return {
      [`${P}-lidout`]: {transform: tf, opacity: s > 0 ? 1 : 0},
      [`${P}-lidin`]: {transform: tf, opacity: s < 0 ? 1 : 0},
      [`${P}-lidshadow`]: {transform: `translate(${r(8 + 10 * (1 - Math.abs(s)))} 10) ${tf}`, opacity: r(0.5 + 0.5 * Math.abs(s), 3)},
    };
  }
  return {
    body, rimOver, lid, lidFrame, w: BW, h: BH, LW, LH, hx, sealSpot, seal, cardY, cardW, cardH,
    opening: {x: oX, y: oY, w: oW, h: oH},
    floor: {x: fX, y: fY, w: fW, h: fH},
    /**
     * Grip point on the lid (local) for fold sx: a fraction `f` of the lid
     * width from the hinge (1 = the free edge), on the lid's mid line.
     */
    edge: (sx, f = 1) => ({x: hx + LW * sx * f, y: 0}),
  };
}

/* ------------------------------------------------------------------------ */
/* Reader's working folder (open, top-down)                                  */
/* ------------------------------------------------------------------------ */

/**
 * Local origin = centre of the back cover. The label sits in the tab on the
 * top edge (the side the reader works from), where an incoming sheet never
 * passes over it. `tabSide` puts the tab at the right (default) or left end of
 * that edge — the end away from the reader's reaching arm.
 */
export function workFolder(ctx, {w: fw, h: fh, label, showText = true, tabSide = 'right', labelLines = 2}) {
  const th = ctx.theme;
  const x0 = -fw / 2, y0 = -fh / 2;
  const tabW = fw * 0.62;
  const left = tabSide === 'left';
  let lab = null;
  let tabH = 34;
  if (showText && label) {
    const f = ctx.fit(label, {maxWidth: tabW - 34, size: 22, minSize: 14, maxLines: labelLines, weight: 700});
    tabH = Math.max(34, f.height + 16);
    lab = textBlock(f, {x: left ? x0 + tabW / 2 + 6 : x0 + fw - tabW / 2 - 6, y: y0 - tabH + (tabH - f.height) / 2 + 2, anchor: 'middle', fill: th.ink});
  }
  const ty = y0 - tabH;
  const tx = x0 + fw - tabW;
  const tr = x0 + tabW;
  const bottom = `V${r(y0 + fh - 10)}Q${r(x0 + fw)} ${r(y0 + fh)} ${r(x0 + fw - 10)} ${r(y0 + fh)}H${r(x0 + 10)}Q${r(x0)} ${r(y0 + fh)} ${r(x0)} ${r(y0 + fh - 10)}Z`;
  const outline = left
    ? `M${r(x0)} ${r(ty + 10)}Q${r(x0)} ${r(ty)} ${r(x0 + 10)} ${r(ty)}H${r(tr)}L${r(tr + 20)} ${r(y0)}H${r(x0 + fw - 10)}Q${r(x0 + fw)} ${r(y0)} ${r(x0 + fw)} ${r(y0 + 10)}${bottom}`
    : `M${r(x0)} ${r(y0 + 10)}Q${r(x0)} ${r(y0)} ${r(x0 + 10)} ${r(y0)}H${r(tx - 20)}L${r(tx)} ${r(ty)}H${r(x0 + fw - 10)}Q${r(x0 + fw)} ${r(ty)} ${r(x0 + fw)} ${r(ty + 10)}${bottom}`;
  const node = g(null,
    h('path', {d: roundRectPath(x0 + 10, y0 + 14, fw, fh, 10), fill: th.shadow}),
    h('path', {d: outline, fill: FOLDER, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    h('path', {d: left ? `M${r(x0 + 8)} ${r(y0)}H${r(tr - 8)}` : `M${r(tx + 8)} ${r(y0)}H${r(x0 + fw - 8)}`, stroke: shade(FOLDER, -0.2), 'stroke-width': 2}),
    h('rect', {x: x0 + fw * 0.08, y: y0 + fh * 0.07, width: fw * 0.84, height: fh * 0.84, rx: 4, fill: '#f3eee3', stroke: shade(FOLDER, -0.35), 'stroke-width': 1.5, transform: 'rotate(1.5)'}),
    h('path', {d: `M${r(x0 + 14)} ${r(y0 + fh - 9)}H${r(x0 + fw - 14)}`, stroke: shade(FOLDER, -0.2), 'stroke-width': 3}),
    lab,
  );
  return {node, tabH, tab: {x: left ? x0 : tx, y: ty, w: tabW, h: tabH}};
}

/* ------------------------------------------------------------------------ */
/* Scenario header (contrast)                                                */
/* ------------------------------------------------------------------------ */

/**
 * Scenario header: coloured letter badge, label and caption. Like the shared
 * paired header, but the caption is placed below the label's real text box
 * (descenders included), so long labels never touch the caption.
 */
export function pairHeader(ctx, o) {
  const th = ctx.theme;
  const size = Math.min(54, o.h * 0.4);
  const badgeR = size * 0.78;
  const cy = o.y + o.h * 0.42;
  const tx = o.x + badgeR * 2 + 18;
  const maxW = o.w - badgeR * 2 - 24;
  const parts = [
    h('circle', {cx: o.x + badgeR, cy, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: o.x + badgeR, y: cy + size * 0.36, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, 'font-family': FONT, fill: '#fff'}, o.letter) : null,
  ];
  if (ctx.show('key')) {
    const f = ctx.fit(o.label, {maxWidth: maxW, size, minSize: size * 0.62, maxLines: 1, weight: 700});
    const ly = cy - f.size * 0.62;
    parts.push(textBlock(f, {x: tx, y: ly, fill: th.fg}));
    if (o.caption && ctx.show('all')) {
      const f2 = ctx.fit(o.caption, {maxWidth: maxW, size: size * 0.56, minSize: 16, maxLines: 1, weight: 500});
      parts.push(textBlock(f2, {x: tx, y: ly + f.size * 1.26 + 6, fill: th.fgSoft}));
    }
  }
  return g({name: o.name}, parts);
}

/**
 * Orthogonal guide through way-points with rounded corners (plain relation:
 * end dots, no arrowhead) and a draw-on frame. Used where a curve would cross
 * headers or chips.
 * @returns {{node:any, frame:(p:number)=>Record<string,any>, at:(t:number)=>{x:number,y:number}, total:number}}
 */
export function elbowGuide(ctx, {name, pts, color, radius = 26, width = 3}) {
  const c = color ?? ctx.theme.fg;
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  const dense = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], n = pts[i + 1];
    const la = dist(a, b), ln = dist(b, n);
    const k = Math.min(radius, la / 2, ln / 2);
    const p1 = mix(b, a, k / la), p2 = mix(b, n, k / ln);
    d += `L${r(p1.x)} ${r(p1.y)}Q${r(b.x)} ${r(b.y)} ${r(p2.x)} ${r(p2.y)}`;
    dense.push(p1);
    for (let j = 1; j <= 6; j++) {
      const t = j / 6;
      dense.push({x: (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * b.x + t * t * p2.x, y: (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * b.y + t * t * p2.y});
    }
  }
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  dense.push(last);
  const poly = polyline(dense);
  const total = poly.total;
  const node = g({name},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: c, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: pts[0].x, cy: pts[0].y, r: width * 1.6, fill: c, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: last.x, cy: last.y, r: width * 1.6, fill: c, opacity: 0}),
  );
  const frame = (p, opacity = 1) => ({
    [name]: {opacity},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - p))},
    [`${name}-dotA`]: {opacity: p > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: p >= 0.985 ? 1 : 0},
  });
  return {node, frame, at: t => poly.at(t), total};
}

/* ------------------------------------------------------------------------ */
/* Desk stage                                                                */
/* ------------------------------------------------------------------------ */

/** Canonical stage sizes (design units) by axis. */
export const STAGE = {horizontal: {w: 1600, h: 900}, square: {w: 1200, h: 1100}, vertical: {w: 900, h: 1400}};

/**
 * Geometry per axis (absolute stage units). `bSide` = where the reader sits.
 * Shoulders are outside the window so the arms enter from the frame edge.
 */
const GEO = {
  horizontal: {
    dw: 272, dh: 352, bSide: 'right', folderTab: 'left',
    // lid folded back to −0.24 and gripped at 88 % of its width: A1's hand
    // stays > 100 units inside the window (no clipping by the frame)
    box: {x: 360, y: 482, w: 330, h: 400}, lidOpen: -0.24, lidGrip: 0.88,
    orig: {x: 680, y: 566, rot: -1}, copy: {x: 962, y: 548, rot: 2},
    pushTo: {x: 1045, y: 532}, catchAt: {x: 1128, y: 506},
    folder: {x: 1362, y: 486, w: 330, h: 404}, onFolder: {x: 1358, y: 480, rot: -1.5},
    penRest: {x: 1416, y: 762}, penAngle: 36, stampRest: {x: 866, y: 806},
    A1: {x: 290, y: 1080, bend: 1, handed: 'left'}, A2: {x: 640, y: 1094, bend: -1, handed: 'right'},
    B1: {x: 1780, y: 330, bend: -1, handed: 'right'}, B2: {x: 1790, y: 790, bend: 1, handed: 'left'},
    restA1: {x: 210, y: 820}, restA2: {x: 780, y: 836}, restB1: {x: 1560, y: 300}, restB2: {x: 1570, y: 700},
    arm: {upper: 330, lower: 310, width: 50, handScale: 1.3},
    chipA: {x: 944, anchor: 'start', maxW: 462}, chipB: {x: 1574, anchor: 'end', maxW: 640},
  },
  square: {
    dw: 236, dh: 306, bSide: 'top', folderTab: 'right',
    box: {x: 330, y: 764, w: 290, h: 350}, lidOpen: -0.24, lidGrip: 0.88,
    orig: {x: 600, y: 800, rot: -1}, copy: {x: 846, y: 786, rot: 2},
    pushTo: {x: 840, y: 672}, catchAt: {x: 832, y: 560},
    folder: {x: 818, y: 316, w: 294, h: 356}, onFolder: {x: 814, y: 318, rot: -1.5},
    penRest: {x: 1060, y: 540}, penAngle: -58, stampRest: {x: 790, y: 1012},
    A1: {x: 250, y: 1300, bend: 1, handed: 'left'}, A2: {x: 600, y: 1310, bend: -1, handed: 'right'},
    B1: {x: 700, y: -150, bend: -1, handed: 'right'}, B2: {x: 1100, y: -140, bend: 1, handed: 'left'},
    restA1: {x: 130, y: 990}, restA2: {x: 720, y: 1020}, restB1: {x: 600, y: 112}, restB2: {x: 1110, y: 250},
    arm: {upper: 330, lower: 310, width: 50, handScale: 1.3},
    chipA: {x: 420, anchor: 'middle', maxW: 480}, chipB: {x: 26, anchor: 'start', maxW: 480},
  },
  vertical: {
    dw: 222, dh: 288, bSide: 'top', folderTab: 'right',
    // the original and its copy overlap a little (a stack) so the box can sit
    // far enough from the left edge for the lid hand
    box: {x: 300, y: 1040, w: 270, h: 330}, lidOpen: -0.24, lidGrip: 0.88,
    orig: {x: 560, y: 1092, rot: -1}, copy: {x: 752, y: 1072, rot: 2},
    pushTo: {x: 722, y: 902}, catchAt: {x: 560, y: 584},
    folder: {x: 452, y: 356, w: 300, h: 364}, onFolder: {x: 448, y: 360, rot: -1.5},
    penRest: {x: 760, y: 546}, penAngle: -58, stampRest: {x: 800, y: 1318},
    A1: {x: 270, y: 1590, bend: 1, handed: 'left'}, A2: {x: 620, y: 1610, bend: -1, handed: 'right'},
    B1: {x: 330, y: -110, bend: -1, handed: 'right'}, B2: {x: 720, y: -150, bend: 1, handed: 'left'},
    // A2 rests ~100 units inside the right edge (never clipped by the desk window)
    restA1: {x: 112, y: 1262}, restA2: {x: 800, y: 1222}, restB1: {x: 110, y: 196}, restB2: {x: 820, y: 130},
    arm: {upper: 330, lower: 310, width: 50, handScale: 1.3},
    chipA: {x: 450, anchor: 'middle', maxW: 560}, chipB: {x: 450, anchor: 'middle', maxW: 600},
  },
};

/** Sheet-local (centre origin) → world for a pose {x,y,rot,scale}. */
export function atPose(pose, q) {
  const a = rad(pose.rot || 0);
  const k = pose.scale ?? 1;
  return {x: pose.x + (q.x * Math.cos(a) - q.y * Math.sin(a)) * k, y: pose.y + (q.x * Math.sin(a) + q.y * Math.cos(a)) * k};
}

const P2 = q => ({x: r(q.x), y: r(q.y)});

/**
 * @param {any} ctx
 * @param {object} o
 * @param {string} o.prefix
 * @param {'horizontal'|'square'|'vertical'} o.axis
 * @param {'both'|'original'|'copy'} [o.mode='both']  both = original + copy stack (story/inspect);
 *        original / copy = a single plain sheet that receives its status mark on stage (contrast)
 * @param {{docId:string,title:string,clauses:string[],redactions:number[]}} o.doc
 * @param {Array<{name:string, role?:string, appearance?:object}>} o.parties
 * @param {{box:string, seal:string, copyMark:string, folder:string}} o.labels
 * @param {string[]} [o.copyMarks]  alternative copy-mark texts (inspect); node `${prefix}-copy-mark{i}`
 * @param {string[]} [o.boxLabels]  alternative box-label texts (inspect); node `${prefix}-box-label{i}`
 * @param {string} [o.stageMark]   mark stamped on the single sheet (contrast)
 * @param {string} [o.stageMarkColor]
 * @param {boolean} [o.chips=true]
 * @param {number} [o.chipSize]  actor chip font size (stage units)
 * @param {{x?:number, y?:number, anchor?:string, maxW?:number}} [o.chipB]  override of B's chip placement
 * @param {number} [o.folderLabelLines=2]  lines allowed for the file's tab label
 */
export function custodyDesk(ctx, o) {
  const th = ctx.theme;
  const P = o.prefix;
  const axis = o.axis;
  const G = GEO[axis];
  const {w: W, h: H} = STAGE[axis];
  const mode = o.mode || 'both';
  const showText = ctx.show('all');
  const {dw, dh} = G;
  const labels = o.labels;

  // --- props
  const copyMarks = o.copyMarks && o.copyMarks.length ? o.copyMarks : [labels.copyMark];
  const markColor = th.accent2;
  const origSheet = mode !== 'copy' ? custodySheet(ctx, {
    prefix: `${P}-orig`, w: dw, h: dh, kind: mode === 'both' ? 'original' : 'plain', docId: o.doc.docId, title: o.doc.title, clauses: o.doc.clauses,
    signer: o.parties[0].name, showText, rosette: mode === 'both', shadeNode: true, seedKey: 'custody-doc', bodyMark: mode !== 'both',
    marks: mode === 'original' ? [{key: 'mark', text: o.stageMark || '', color: o.stageMarkColor || th.accent, opacity: 0}] : [],
  }) : null;
  const copySheet = mode !== 'original' ? custodySheet(ctx, {
    prefix: `${P}-copy`, w: dw, h: dh, kind: mode === 'both' ? 'copy' : 'plain', docId: o.doc.docId, title: o.doc.title, clauses: o.doc.clauses,
    signer: o.parties[0].name, showText, redactions: mode === 'both' ? o.doc.redactions : [], notes: true, seedKey: 'custody-doc', bodyMark: mode !== 'both',
    marks: mode === 'both'
      ? copyMarks.map((t, i) => ({key: `mark${i}`, text: t, color: markColor, opacity: i === 0 ? 1 : 0}))
      : [{key: 'mark', text: o.stageMark || '', color: o.stageMarkColor || markColor, opacity: 0}],
  }) : null;
  const box = archiveBox(ctx, {prefix: `${P}-box`, w: G.box.w, h: G.box.h, labels: o.boxLabels && o.boxLabels.length ? o.boxLabels : [labels.box], seal: labels.seal, showText});
  const folderArt = workFolder(ctx, {w: G.folder.w, h: G.folder.h, label: labels.folder, showText, tabSide: G.folderTab, labelLines: o.folderLabelLines ?? 2});
  const folderNode = g({transform: T(G.folder.x, G.folder.y)}, folderArt.node);
  const penAngle = G.penAngle;
  const penProp = pen(ctx, {name: `${P}-pen`, length: 200, body: th.accent4});
  const penDir = {x: Math.cos(rad(penAngle)), y: Math.sin(rad(penAngle))};
  // contrast scenes share ONE neutral stamp body; the scenario colour exists
  // only in the ink impression, which appears on contact
  const stampColor = mode === 'both' ? th.accent : (o.stampBody || STAMP_BODY);
  const stampNode = stampTool(ctx, {name: `${P}-stamp`, size: (axis === 'square' ? 88 : 96) * (mode === 'both' ? 1 : 1.3), color: stampColor});

  // --- arms
  const lookA = actorLook(ctx, o.parties[0], 0);
  const lookB = actorLook(ctx, o.parties[1], 1);
  const mk = (key, look) => topArm(ctx, {name: `${P}-arm${key}`, skin: look.skin, sleeve: look.outfit, handed: G[key].handed, ...G.arm});
  const arms = {A1: mk('A1', lookA), A2: mk('A2', lookA), B1: mk('B1', lookB), B2: mk('B2', lookB)};
  const armNodes = key => [arms[key].arm, arms[key].palm, arms[key].thumb];

  const desk = deskWindow(ctx, {prefix: `${P}-desk`, x: 0, y: 0, w: W, h: H, radius: 30, seedKey: `${o.seedKey || 'custody'}-desk`});

  // --- actor chips (inside the window, away from the action paths)
  const chipSize = axis === 'horizontal' ? 30 : 32;
  const cap = p => (p.role ? `${p.name} · ${p.role}` : p.name);
  let chipA = null, chipB = null;
  if (o.chips !== false && ctx.show('key')) {
    // two lines (shrinking to 75 %) rather than an ellipsis for long
    // names/roles, three when two would still cut the text; A's chip is
    // bottom-aligned, B's top-aligned
    const size = o.chipSize ?? chipSize;
    const make = (c, text, y) => {
      const opts = (lines, sz, min) => ({x: c.x, y, anchor: c.anchor, maxWidth: c.maxW, size: sz, minSize: min, maxLines: lines, name: c.name});
      const two = chip(ctx, text, opts(2, size, size * 0.85));
      return two.fit.truncated ? chip(ctx, text, opts(3, size * 0.9, size * 0.75)) : two;
    };
    const cA = {...G.chipA, name: `${P}-chipA`};
    const probe = make(cA, cap(o.parties[0]), 0);
    chipA = make(cA, cap(o.parties[0]), H - 24 - probe.box.h);
    // `o.chipB` may move B's chip (e.g. beside the file on small paired panels)
    chipB = make({...G.chipB, ...(o.chipB || {}), name: `${P}-chipB`}, cap(o.parties[1]), (o.chipB && o.chipB.y) ?? 24);
  }

  const docNode = (sheet, name) => sheet ? g({name}, sheet.node) : null;
  const node = g({name: P},
    desk.surface,
    g({'clip-path': desk.clip},
      g({transform: T(G.box.x, G.box.y)}, box.body),
      folderNode,
      docNode(origSheet, `${P}-origg`),
      docNode(copySheet, `${P}-copyg`),
      g({transform: T(G.box.x, G.box.y)}, box.rimOver, box.lid),
      penProp.node,
      stampNode,
      armNodes('A1'), armNodes('A2'), armNodes('B1'), armNodes('B2'),
    ),
    desk.frame,
    chipA && chipA.node,
    chipB && chipB.node,
  );

  // --- key poses
  // single-sheet (contrast) scenes start with the sheet where the original lies
  const stackOrig = {x: G.orig.x, y: G.orig.y, rot: mode === 'both' ? G.orig.rot : 0, scale: 1};
  const stackCopy = mode === 'both'
    ? {x: G.copy.x, y: G.copy.y, rot: G.copy.rot, scale: 1}
    : {x: G.orig.x, y: G.orig.y, rot: 0, scale: 1};
  const pushEnd = {x: G.pushTo.x, y: G.pushTo.y, rot: 2, scale: 1};
  const catchPose = {x: G.catchAt.x, y: G.catchAt.y, rot: 0, scale: 1};
  const onFolder = {x: G.onFolder.x, y: G.onFolder.y, rot: G.onFolder.rot, scale: 1};
  const overBox = {x: G.box.x, y: G.box.y - 4, rot: 0, scale: 1};
  const inBox = {x: G.box.x + 2, y: G.box.y + 2, rot: 0.8, scale: 0.84};
  const right = G.bSide === 'right';
  // grips (sheet centre-origin coords)
  const gripA2 = {x: -dw * 0.14, y: dh * 0.33};
  const gripB1 = right ? {x: dw / 2 - 24, y: -dh * 0.14} : {x: dw * 0.12, y: -dh / 2 + 24};
  const markSpot = sh => sh.local(sh.idSpot);
  // A1 grips the lid a little in from its free edge, so the hand stays well
  // inside the window while the lid is folded back
  const lidEdge = sx => {
    const e = box.edge(sx, G.lidGrip);
    return {x: G.box.x + e.x, y: G.box.y + e.y};
  };
  const sealWorld = {x: G.box.x + box.sealSpot.x, y: G.box.y + box.sealSpot.y};
  const stampRest = {x: G.stampRest.x, y: G.stampRest.y};
  const penRestTip = {x: G.penRest.x, y: G.penRest.y};
  const penGrip = t => ({x: t.x + penDir.x * penProp.grip, y: t.y + penDir.y * penProp.grip});
  const arc = (a, b, t, lift) => {
    const m = mix(a, b, t);
    const k = Math.sin(Math.PI * t) * lift;
    return {x: m.x, y: m.y - k};
  };
  const mixPose = (a, b, t) => ({x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, rot: a.rot + (b.rot - a.rot) * t, scale: (a.scale ?? 1) + ((b.scale ?? 1) - (a.scale ?? 1)) * t});

  /**
   * Stamp press path: go from rest to spot (0–0.35), press (0.35–0.47),
   * lift (0.47–0.58), return (0.58–1).
   */
  const stampPath = (st, spot) => {
    const go = seg(st, 0, 0.35), down = seg(st, 0.35, 0.47), up = seg(st, 0.47, 0.58), back = seg(st, 0.58, 1);
    const target = back > 0 ? mix(spot, stampRest, ease.inOutSine(back)) : mix(stampRest, spot, ease.inOutSine(go));
    const press = down > 0 && up < 1 ? ease.outQuad(down) * (1 - ease.inQuad(up)) : 0;
    return {target, press, applied: st >= 0.47, carried: st > 0 && st < 1 ? 1 - press : 0};
  };

  /**
   * Pose the stage. Action values (each in [0,1]); absent keys count as 0.
   * Story/inspect ('both'): toCopy, push, glide, reach, pull, releaseB1,
   *   toOrig, carry, sink, withdraw, toLid, close, leaveLid, stampFetch, stamp, stampLeave, toPen, write, putPen.
   * Contrast ('original'|'copy'): stampFetch, stamp, stampLeave (→ sheet grip), then carry/sink/withdraw
   *   (original) or push/glide/reach/pull/releaseB1/toPen/write/putPen (copy); toLid/close/leaveLid optional.
   */
  function pose(s0) {
    const s = new Proxy(s0, {get: (tgt, k) => (typeof tgt[k] === 'number' ? clamp(tgt[k]) : 0)});
    const nodes = {};
    const reduced = ctx.reduced;

    // ----- copy route (the circulating sheet)
    let copyPose = null, copyHolder = null;
    if (copySheet) {
      if (s.pull > 0) copyPose = mixPose(catchPose, onFolder, ease.inOutCubic(s.pull));
      else if (s.glide > 0) copyPose = mixPose(pushEnd, catchPose, ease.outCubic(s.glide));
      else copyPose = mixPose(stackCopy, pushEnd, ease.inOutQuad(s.push));
      if (reduced) copyPose.rot = s.pull >= 1 ? onFolder.rot : copyPose.rot;
      copyHolder = s.pull >= 1 ? 'B' : s.pull > 0 ? 'B-pulling' : s.glide > 0 ? 'gliding' : s.push > 0 ? 'A-pushing' : 'desk';
      nodes[`${P}-copyg`] = {transform: T(copyPose.x, copyPose.y, copyPose.rot)};
    }

    // ----- original route (the kept sheet): carried over the box, then sinks inside the walls
    let origPose = null, origHolder = null;
    if (origSheet) {
      const cr = ease.inOutCubic(s.carry);
      if (s.sink > 0) {
        origPose = mixPose(overBox, inBox, ease.inOutCubic(s.sink));
      } else {
        const p = arc(stackOrig, overBox, cr, reduced ? 0 : 40);
        const lift = reduced ? 0 : 0.06 * Math.sin(Math.PI * cr);
        origPose = {x: p.x, y: p.y, rot: stackOrig.rot + (overBox.rot - stackOrig.rot) * cr, scale: 1 + lift};
      }
      origHolder = s.sink >= 1 ? 'box' : s.sink > 0 ? 'sinking' : s.carry > 0 ? 'A-carrying' : 'desk';
      // fully covered by the closed lid: not drawn (identical pixels, no hidden text)
      const covered = s.sink >= 1 && s.close >= 1;
      nodes[`${P}-origg`] = {transform: T(origPose.x, origPose.y, origPose.rot, origPose.scale), opacity: covered ? 0 : 1};
      nodes[`${P}-orig-depth`] = {opacity: r(0.2 * ease.inOutCubic(s.sink), 3)};
    }
    nodes[`${P}-box-rimover`] = {opacity: s.sink > 0 ? 1 : 0};

    // ----- lid
    const lidSx = G.lidOpen + (1 - G.lidOpen) * ease.inOutCubic(s.close);
    Object.assign(nodes, box.lidFrame(lidSx));
    const edgeNow = lidEdge(lidSx);

    // ----- the stamp (A2) — on the lid (story) or on the single sheet (contrast)
    const sheet = mode === 'original' ? origSheet : mode === 'copy' ? copySheet : null;
    const sheetPose = mode === 'original' ? origPose : copyPose;
    const stampSpot = sheet ? atPose(sheetPose, markSpot(sheet)) : sealWorld;
    const sp = stampPath(s.stamp, stampSpot);

    // ----- A2 hand: chain depends on mode
    const restA2 = G.restA2;
    const handA2 = (() => {
      const stampHand = () => {
        if (s.stampLeave > 0) return mix(stampRest, mode === 'both' ? restA2 : atPose(sheetPose, gripA2), ease.inOutCubic(s.stampLeave));
        if (s.stamp > 0) return sp.target;
        return mix(restA2, stampRest, ease.inOutCubic(s.stampFetch));
      };
      if (mode === 'both') {
        if (s.stampFetch > 0 || s.stamp > 0 || s.stampLeave > 0) return stampHand();
        if (s.withdraw > 0) return mix(atPose(overBox, gripA2), restA2, ease.inOutSine(s.withdraw));
        if (s.carry > 0 || s.sink > 0) return atPose(s.sink > 0 ? overBox : origPose, gripA2);
        if (s.toOrig > 0) return mix(atPose(pushEnd, gripA2), atPose(stackOrig, gripA2), ease.inOutCubic(s.toOrig));
        if (s.push > 0 || s.glide > 0 || s.pull > 0) {
          if (s.glide > 0 || s.pull > 0) return atPose(pushEnd, gripA2);
          return atPose(copyPose, gripA2);
        }
        return mix(restA2, atPose(stackCopy, gripA2), ease.inOutCubic(s.toCopy));
      }
      // contrast: stamp the single sheet first, then route it
      if (s.withdraw > 0) {
        const from = mode === 'original' ? atPose(overBox, gripA2) : atPose(pushEnd, gripA2);
        return mix(from, restA2, ease.inOutCubic(s.withdraw));
      }
      if (mode === 'original' && (s.carry > 0 || s.sink > 0)) return atPose(s.sink > 0 ? overBox : origPose, gripA2);
      if (mode === 'copy' && (s.push > 0 || s.glide > 0 || s.pull > 0)) return atPose(s.glide > 0 || s.pull > 0 ? pushEnd : copyPose, gripA2);
      return stampHand();
    })();
    const solvedA2 = arms.A2.pose(G.A2, handA2, G.A2.bend);
    Object.assign(nodes, solvedA2.nodes);
    const stampHeld = s.stampFetch >= 1 && s.stampLeave === 0;
    const stampPos = stampHeld ? solvedA2.hand : stampRest;
    const carried = stampHeld ? sp.carried : 0;
    nodes[`${P}-stamp`] = {transform: T(stampPos.x, stampPos.y, 0, (1 + 0.07 * carried) * (1 - 0.08 * sp.press))};
    nodes[`${P}-stamp-shadow`] = {opacity: r(1 - sp.press * 0.85, 3)};
    if (mode === 'both') nodes[`${P}-box-seal`] = {opacity: sp.applied ? 0.92 : 0};
    else if (sheet) nodes[`${sheet === origSheet ? `${P}-orig` : `${P}-copy`}-mark`] = {opacity: sp.applied ? 0.95 : 0};

    // ----- A1: lid hand
    const restA1 = G.restA1;
    let handA1;
    if (s.leaveLid > 0) handA1 = mix(lidEdge(1), restA1, ease.inOutCubic(s.leaveLid));
    else if (s.close > 0) handA1 = edgeNow;
    else handA1 = mix(restA1, edgeNow, ease.inOutCubic(s.toLid));
    const solvedA1 = arms.A1.pose(G.A1, handA1, G.A1.bend);
    Object.assign(nodes, solvedA1.nodes);

    // ----- B1: receiving hand
    const restB1 = G.restB1;
    let handB1;
    if (!copySheet) handB1 = restB1;
    else if (s.releaseB1 > 0) handB1 = mix(atPose(onFolder, gripB1), restB1, ease.inOutCubic(s.releaseB1));
    else if (s.pull > 0) handB1 = atPose(copyPose, gripB1);
    else handB1 = mix(restB1, atPose(catchPose, gripB1), ease.inOutCubic(s.reach));
    const solvedB1 = arms.B1.pose(G.B1, handB1, G.B1.bend);
    Object.assign(nodes, solvedB1.nodes);

    // ----- B2: pen hand; the tip draws the reader's notes on the copy on the folder
    let tip = null, touching = false, notesP = 0, penHeld = false;
    let handB2;
    const notes = copySheet ? copySheet.notes : null;
    const noteWorld = q => atPose(onFolder, copySheet.local(q));
    const restB2 = G.restB2;
    if (!notes) handB2 = restB2;
    else if (s.putPen > 0) {
      // lay the pen down beside the copy, then withdraw
      const end = noteWorld(notes.end);
      const drop = penRestTip;
      const lay = seg(s.putPen, 0, 0.6), back = seg(s.putPen, 0.6, 1);
      if (back > 0) handB2 = mix(penGrip(drop), restB2, ease.inOutCubic(back));
      else { tip = arc(end, drop, ease.inOutCubic(lay), 20); penHeld = true; }
    } else if (s.write > 0) {
      const tp = notes.tipAt(s.write);
      tip = noteWorld(tp);
      touching = tp.down;
      notesP = s.write;
      penHeld = true;
    } else if (s.toPen > 0) {
      const a = seg(s.toPen, 0, 0.45), b = seg(s.toPen, 0.45, 1);
      if (b > 0) { tip = arc(penRestTip, noteWorld(notes.start), ease.inOutCubic(b), 30); penHeld = true; }
      else handB2 = mix(restB2, penGrip(penRestTip), ease.inOutCubic(a));
    } else handB2 = restB2;
    if (tip) handB2 = penGrip({x: tip.x - (touching ? 0 : 5), y: tip.y - (touching ? 0 : 12)});
    const solvedB2 = arms.B2.pose(G.B2, handB2, G.B2.bend);
    Object.assign(nodes, solvedB2.nodes);
    const penTip = penHeld && tip
      ? {x: solvedB2.hand.x - penDir.x * penProp.grip, y: solvedB2.hand.y - penDir.y * penProp.grip}
      : {x: penRestTip.x, y: penRestTip.y};
    nodes[`${P}-pen`] = {transform: T(penTip.x, penTip.y, penAngle)};
    if (notes) {
      const np = s.putPen > 0 ? 1 : notesP;
      Object.assign(nodes, notes.frame(np));
      notesP = np;
    }

    const reach = {A1: solvedA1.reached, A2: solvedA2.reached, B1: solvedB1.reached, B2: solvedB2.reached};
    return {
      nodes,
      semantic: {
        originalCenter: origPose ? P2(origPose) : null,
        originalHolder: origHolder,
        originalScale: origPose ? r(origPose.scale, 3) : null,
        copyCenter: copyPose ? P2(copyPose) : null,
        copyHolder,
        handA1: P2(solvedA1.hand),
        handA2: P2(solvedA2.hand),
        handB1: P2(solvedB1.hand),
        handB2: P2(solvedB2.hand),
        gripOrigA2: origPose ? P2(atPose(origPose, gripA2)) : null,
        gripCopyA2: copyPose ? P2(atPose(copyPose, gripA2)) : null,
        gripCopyB1: copyPose ? P2(atPose(copyPose, gripB1)) : null,
        lidEdge: P2(edgeNow),
        lidFold: r(lidSx, 3),
        lidClosed: lidSx >= 0.999,
        stampTool: P2(stampPos),
        stampSpot: P2(stampSpot),
        stampApplied: sp.applied,
        penTip: P2(penTip),
        penTouching: touching,
        notesProgress: r(notesP, 3),
        noteTip: notes && touching ? P2(noteWorld(notes.tipAt(s.write))) : null,
        reach,
        allReached: reach.A1 && reach.A2 && reach.B1 && reach.B2,
      },
    };
  }

  const boxWorld = q => ({x: G.box.x + q.x, y: G.box.y + q.y});
  return {
    node, pose, W, H, axis, G, dw, dh, box, origSheet, copySheet,
    poses: {stackOrig, stackCopy, pushEnd, catchPose, onFolder, overBox, inBox},
    /** world point of a sheet-local (top-left) point on the copy resting on the folder */
    copyPoint: q => atPose(onFolder, copySheet.local(q)),
    /** world point of a sheet-local point on the single sheet at the stack */
    sheetPoint: (which, where, q) => {
      const sh = which === 'orig' ? origSheet : copySheet;
      const ps = {stack: which === 'orig' ? stackOrig : stackCopy, box: inBox, folder: onFolder}[where];
      return atPose(ps, sh.local(q));
    },
    boxWorld,
    lidCard: () => ({x: G.box.x - box.cardW / 2, y: G.box.y + box.cardY, w: box.cardW, h: box.cardH}),
    sealWorld,
    /** folder outline including its tab */
    folderBox: {x: G.folder.x - G.folder.w / 2, y: G.folder.y - G.folder.h / 2 - folderArt.tabH, w: G.folder.w, h: G.folder.h + folderArt.tabH},
    boxBox: {x: G.box.x - box.LW / 2, y: G.box.y - box.LH / 2, w: box.LW, h: box.LH},
    penRest: penRestTip,
  };
}
