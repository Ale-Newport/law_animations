/**
 * Category art kit for "Análisis y presentación de pruebas" (evidence-analysis). First motif: evidence-analysis-01
 * (LAW-0401..0404). Every later motif of the category can reuse this look:
 *
 *  - ANALYSIS BOARD: a front-view linen pinboard in a wooden frame (optionally standing on an easel with a ledge),
 *    the category's signature surface — the place where evidence and propositions are laid out.
 *  - CLAIM CARD: a white index card with a slate header band (id printed, plus index pips that keep cards apart when
 *    labels are hidden), simulated text lines and brass eyelets on its lower edge (one per link: link ports).
 *  - EVIDENCE CARDS: four generic, fictional evidence kinds drawn as cards — witness statement (portrait + lines),
 *    document (folded corner, header, stamp ring), photograph (instant print) and object (item in a clear sleeve).
 *    Each card hangs from a pushpin, carries eyelets on its upper edge and a manila exhibit tag printed with its id.
 *  - THREAD: a link thread between two eyelets. Solid = a link supplied as direct support; dashed = a link supplied as
 *    a disputed inference (dashes mean "disputed / pending" across the library). Same colour and weight for both.
 *  - MAGNIFIER (lupa), PUSHPIN, legend icons and a fitted legend panel; text fitting is the glue-aware `fitG` of the
 *    evidence-custody kit (numbers and closing punctuation stay with their word).
 *
 * Neutral by design: no colour, glyph or stroke weight on these props signals weight, credibility, proof or any legal
 * state. A link only says what the author supplied.
 * @module animations/evidence-analysis/kits/analysis-art
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {clamp, r} from '../../../core/time.js';
import {roundRectPath} from '../../../core/geometry.js';
import {str, list, obj, oneOf, int} from '../../../schemas/fields.js';
import {shade} from '../../../primitives/paper.js';
import {fitG, textAt, wrapG, localised, overlaps, R2, pathAt} from '../../evidence-custody/kits/evidence-art.js';

export {fitG, textAt, wrapG, localised, overlaps, R2, pathAt};

/* ------------------------------------------------------------------ */
/* Category fields (brief: claims, evidence, links, uncertainties)     */
/* ------------------------------------------------------------------ */

export const EVIDENCE_KINDS = ['witness', 'document', 'photo', 'object'];
export const LINK_KINDS = ['direct', 'disputed'];

export const eaFields = {
  claims: list('Propositions (claims) the evidence is said to support, as supplied (fictional; allegations stay allegations)', obj('Claim', {
    id: str('Short id printed on the claim card (e.g. P1)', 8),
    text: str('The proposition as supplied (fictional)', 90),
  }, ['id', 'text']), 1, 3),
  evidence: list('Labelled pieces of evidence (fictional). kind picks the drawn card', obj('Evidence', {
    id: str('Exhibit id printed on the tag (e.g. E1)', 8),
    label: str('Short description (fictional)', 70),
    kind: oneOf('Drawn card: witness statement, document, photograph or object', EVIDENCE_KINDS),
  }, ['id', 'label', 'kind']), 1, 3),
  links: list('Links supplied by the author: which evidence is said to support which claim, and how the link is marked (direct = solid thread, disputed = dashed thread). No weighing is implied', obj('Link', {
    evidence: int('Index in `evidence` (0-based)', 0, 2),
    claim: int('Index in `claims` (0-based)', 0, 2),
    kind: oneOf('direct — supplied as direct support; disputed — supplied as an inference whose link is disputed (neutral marker)', LINK_KINDS),
  }, ['evidence', 'claim', 'kind']), 1, 4),
  uncertainties: list('Open points noted by the author (shown as notes; nothing is resolved)', str('Open point as supplied', 100), 0, 2),
};

export const EA_EN = {
  claims: [
    {id: 'P1', text: 'The parcel reached the flat on Monday (as alleged, fictional)'},
    {id: 'P2', text: 'Party B signed for the parcel (as alleged, fictional)'},
  ],
  evidence: [
    {id: 'E1', label: 'Statement of W. Abara, neighbour (fictional)', kind: 'witness'},
    {id: 'E2', label: 'Delivery slip D-14 with initials (fictional)', kind: 'document'},
  ],
  links: [
    {evidence: 0, claim: 0, kind: 'direct'},
    {evidence: 1, claim: 0, kind: 'direct'},
    {evidence: 1, claim: 1, kind: 'disputed'},
  ],
  uncertainties: ['Whether the initials on the slip are B\'s is disputed (as supplied)'],
};

export const EA_ES = {
  claims: [
    {id: 'P1', text: 'El paquete llegó al piso el lunes (según se alega, ficticio)'},
    {id: 'P2', text: 'La parte B firmó la recepción (según se alega, ficticio)'},
  ],
  evidence: [
    {id: 'E1', label: 'Declaración de W. Abara, vecina (ficticia)', kind: 'witness'},
    {id: 'E2', label: 'Albarán D-14 con iniciales (ficticio)', kind: 'document'},
  ],
  links: [
    {evidence: 0, claim: 0, kind: 'direct'},
    {evidence: 1, claim: 0, kind: 'direct'},
    {evidence: 1, claim: 1, kind: 'disputed'},
  ],
  uncertainties: ['Se discute si las iniciales del albarán son de B (según lo aportado)'],
};

/**
 * Valid links only (indices inside the supplied arrays), duplicates dropped, in the supplied order.
 * @param {any} P
 */
export function resolveLinks(P) {
  const seen = new Set();
  const out = [];
  P.links.forEach((l, i) => {
    if (l.evidence >= P.evidence.length || l.claim >= P.claims.length) return;
    const k = `${l.evidence}-${l.claim}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({e: l.evidence, c: l.claim, kind: l.kind, i, n: out.length});
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* Colours                                                             */
/* ------------------------------------------------------------------ */

export const INK = '#1f2328';
export const LINEN = '#e6dece';
export const LINEN_LINE = '#d3c8b2';
export const FRAME = '#8a6440';
export const FRAME_DARK = '#5e4229';
export const CARD = '#fffdf7';
export const CARD_LINE = '#c9cfd6';
export const BAND = '#3d5a80';
export const MANILA = '#ecd6a1';
export const MANILA_DARK = '#c9ad6e';
export const BRASS = '#c9a54a';
export const THREAD = '#2d3e5e';
export const PIN = '#b8bfc6';
export const GLASS = '#cfe3ee';
/** Disputed thread dash (same colour and width as a direct thread; dashes = disputed across the library). */
export const DISPUTED_DASH = (w) => `${r(w * 1.3, 2)} ${r(w * 2.6, 2)}`;
/** Neutral note inks (amber and slate-blue; never green or red). */
export const noteColors = th => [th.accent3, th.accent2];

/* ------------------------------------------------------------------ */
/* Analysis board                                                      */
/* ------------------------------------------------------------------ */

/**
 * Front-view linen pinboard in a wooden frame. With `floorY` it stands on an easel (two legs and a ledge under the
 * board). Returns {back, frame, inner, ledge}. Local coordinates = design coordinates.
 * @param {any} ctx
 * @param {{prefix:string, x:number, y:number, w:number, h:number, floorY?:number|null, ledge?:boolean}} o
 */
export function boardNode(ctx, o) {
  const {prefix, x, y, w, h: hh} = o;
  const fw = clamp(Math.min(w, hh) * 0.035, 10, 22);
  const inner = {x: x + fw, y: y + fw, w: w - fw * 2, h: hh - fw * 2};
  const weave = [];
  const step = clamp(Math.min(inner.w, inner.h) / 22, 12, 26);
  for (let gx = inner.x + step; gx < inner.x + inner.w - 2; gx += step) weave.push(`M${r(gx)} ${r(inner.y)}V${r(inner.y + inner.h)}`);
  for (let gy = inner.y + step; gy < inner.y + inner.h - 2; gy += step) weave.push(`M${r(inner.x)} ${r(gy)}H${r(inner.x + inner.w)}`);
  const parts = [];
  let ledge = null;
  if (o.floorY != null) {
    const lw = Math.max(10, fw * 0.9);
    const lx1 = x + w * 0.16, lx2 = x + w * 0.84;
    for (const lx of [lx1, lx2]) {
      parts.push(h('path', {d: `M${r(lx - lw / 2)} ${r(y + hh * 0.5)}L${r(lx - lw / 2 - w * 0.03)} ${r(o.floorY)}h${r(lw)}L${r(lx + lw / 2)} ${r(y + hh * 0.5)}Z`, fill: FRAME, stroke: INK, 'stroke-width': 2.2, 'stroke-linejoin': 'round'}));
    }
    parts.push(h('ellipse', {cx: r(x + w / 2), cy: r(o.floorY), rx: r(w * 0.42), ry: 7, fill: '#000', opacity: 0.1}));
  }
  parts.push(h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 14), fill: '#000', opacity: 0.14}));
  parts.push(h('path', {d: roundRectPath(x, y, w, hh, 14), fill: FRAME, stroke: INK, 'stroke-width': 2.6}));
  parts.push(h('path', {d: roundRectPath(x + 4, y + 4, w - 8, hh - 8, 11), fill: 'none', stroke: shade(FRAME, 0.22), 'stroke-width': 2}));
  parts.push(h('rect', {x: r(inner.x), y: r(inner.y), width: r(inner.w), height: r(inner.h), rx: 4, fill: LINEN, stroke: FRAME_DARK, 'stroke-width': 2}));
  parts.push(h('path', {d: weave.join(''), stroke: LINEN_LINE, 'stroke-width': 1.2, opacity: 0.7, fill: 'none'}));
  if (o.ledge !== false && o.floorY != null) {
    const lh = Math.max(12, fw * 1.1);
    ledge = {x: x - fw * 0.6, y: y + hh, w: w + fw * 1.2, h: lh};
    parts.push(h('path', {d: roundRectPath(ledge.x, ledge.y, ledge.w, ledge.h, 4), fill: shade(FRAME, 0.1), stroke: INK, 'stroke-width': 2.2}));
  }
  return {back: g({name: `${prefix}-board`}, parts), inner, ledge, fw};
}

/* ------------------------------------------------------------------ */
/* Pins, eyelets, thread                                               */
/* ------------------------------------------------------------------ */

/** Pushpin seen from the front (local origin = pin point on the board). */
export function pushpin(R, color = PIN, name) {
  return g({name},
    h('ellipse', {cx: r(R * 0.35), cy: r(R * 0.45), rx: r(R * 0.95), ry: r(R * 0.55), fill: '#000', opacity: 0.18}),
    h('circle', {cx: 0, cy: 0, r: r(R), fill: color, stroke: INK, 'stroke-width': r(Math.max(1.6, R * 0.16), 2)}),
    h('circle', {cx: r(-R * 0.3), cy: r(-R * 0.32), r: r(R * 0.32), fill: '#fff', opacity: 0.55}),
  );
}

/** Brass eyelet (link port). */
export function eyelet(R, name) {
  return g({name},
    h('circle', {cx: 0, cy: 0, r: r(R), fill: BRASS, stroke: INK, 'stroke-width': 1.6}),
    h('circle', {cx: 0, cy: 0, r: r(R * 0.45), fill: shade(BRASS, -0.45)}),
  );
}

/** Thread node: one path; `kind` decides solid (direct) or dashed (disputed). Animate `d` (and opacity). */
export function threadNode(name, kind, w = 4.5, o = {}) {
  return h('path', {name, fill: 'none', stroke: o.color || THREAD, 'stroke-width': r(w, 2), 'stroke-linecap': 'round', 'stroke-dasharray': kind === 'disputed' ? DISPUTED_DASH(w) : undefined, opacity: o.opacity});
}

/** Quadratic thread from a to b sagging by `sag` (toward +y). */
export function threadD(a, b, sag = 0) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag;
  return `M${r(a.x)} ${r(a.y)}Q${r(mx)} ${r(my)} ${r(b.x)} ${r(b.y)}`;
}

/** Point on the quadratic thread at t. */
export function threadAt(a, b, sag, t) {
  const m = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + sag};
  const k = 1 - t;
  return {x: k * k * a.x + 2 * k * t * m.x + t * t * b.x, y: k * k * a.y + 2 * k * t * m.y + t * t * b.y};
}

/** Thread through a polyline of waypoints (each corner softened). */
export function threadPolyD(pts) {
  if (pts.length === 2) return threadD(pts[0], pts[1], 0);
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) d += `L${r(pts[i].x)} ${r(pts[i].y)}`;
  return d;
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

/**
 * Claim card (local origin = top-left, w × h). The id is printed in the header band when `idFit` is given; index pips
 * (index + 1 dots) keep the cards apart with labels hidden. `ports` = x offsets of eyelets on the lower edge.
 * @param {any} ctx
 * @param {{name?:string, w:number, h:number, index:number, idFit?:any, ports?:number[], lines?:number}} o
 */
export function claimCardArt(ctx, o) {
  const {w, h: hh} = o;
  const band = o.band ?? Math.max(26, hh * 0.3);
  const parts = [
    h('path', {d: roundRectPath(5, 7, w, hh, 8), fill: '#000', opacity: 0.16}),
    h('path', {d: roundRectPath(0, 0, w, hh, 8), fill: CARD, stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: `M0 ${r(band)}V8Q0 0 8 0H${r(w - 8)}Q${r(w)} 0 ${r(w)} 8V${r(band)}Z`, fill: BAND, stroke: INK, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
  ];
  const pipR = Math.max(4, band * 0.13);
  for (let i = 0; i <= o.index; i++) parts.push(h('circle', {cx: r(w - band * 0.45 - i * pipR * 2.8), cy: r(band / 2), r: r(pipR), fill: '#fff', opacity: 0.9}));
  if (o.textFit) {
    parts.push(textAt(o.textFit, {x: w * 0.07, y: band + Math.max(6, (hh - band) * 0.08), fill: INK}));
  } else {
    const n = o.lines ?? 3;
    const ly0 = band + (hh - band) * 0.24, lstep = (hh - band) * 0.55 / Math.max(1, n - 1);
    const bars = [];
    for (let i = 0; i < n; i++) bars.push(`M${r(w * 0.1)} ${r(ly0 + i * lstep)}H${r(w * (i === n - 1 ? 0.6 : 0.9))}`);
    parts.push(h('path', {d: bars.join(''), stroke: CARD_LINE, 'stroke-width': r(Math.max(3, hh * 0.05), 2), 'stroke-linecap': 'round', fill: 'none'}));
  }
  if (o.idFit) parts.push(textAt(o.idFit, {x: w * 0.07, y: band / 2 - o.idFit.size * 0.55, fill: '#fff'}));
  for (const px of o.ports || []) parts.push(g({transform: T(px, hh - Math.max(6, hh * 0.08))}, eyelet(Math.max(5, hh * 0.055))));
  return g({name: o.name}, parts);
}

/**
 * Evidence card art (local origin = top-left, w × h). `ports` = x offsets of eyelets on the upper edge.
 * @param {any} ctx
 * @param {{name?:string, kind:string, w:number, h:number, look?:any, ports?:number[], seedKey?:string}} o
 */
export function evidenceArt(ctx, o) {
  const {w, h: hh, kind} = o;
  const sw = 2.4;
  const parts = [h('path', {d: roundRectPath(5, 7, w, hh, 6), fill: '#000', opacity: 0.16})];
  const lines = (x0, x1, y0, y1, n, last = 0.65) => {
    const d = [];
    for (let i = 0; i < n; i++) {
      const yy = y0 + (n === 1 ? 0 : (i * (y1 - y0)) / (n - 1));
      d.push(`M${r(x0)} ${r(yy)}H${r(i === n - 1 ? x0 + (x1 - x0) * last : x1)}`);
    }
    return h('path', {d: d.join(''), stroke: CARD_LINE, 'stroke-width': r(Math.max(2.5, hh * 0.035), 2), 'stroke-linecap': 'round', fill: 'none'});
  };
  if (kind === 'witness') {
    const L = o.look || {skin: '#c68863', hair: 'short', hairColor: '#2b1d16', outfit: '#5d7a99'};
    const px = w * 0.08, py = hh * 0.12, pw = w * 0.4, ph = hh * 0.5;
    const cx = px + pw / 2, R = pw * 0.2;
    parts.push(
      h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: CARD, stroke: INK, 'stroke-width': sw}),
      h('rect', {x: r(px), y: r(py), width: r(pw), height: r(ph), rx: 3, fill: '#dbe4ea', stroke: INK, 'stroke-width': 1.8}),
      h('path', {d: `M${r(px + pw * 0.12)} ${r(py + ph)}C${r(px + pw * 0.14)} ${r(py + ph * 0.66)} ${r(cx - R * 1.3)} ${r(py + ph * 0.62)} ${r(cx)} ${r(py + ph * 0.62)}C${r(cx + R * 1.3)} ${r(py + ph * 0.62)} ${r(px + pw * 0.86)} ${r(py + ph * 0.66)} ${r(px + pw * 0.88)} ${r(py + ph)}Z`, fill: L.outfit, stroke: INK, 'stroke-width': 1.6}),
      h('circle', {cx: r(cx), cy: r(py + ph * 0.4), r: r(R), fill: L.skin, stroke: INK, 'stroke-width': 1.6}),
      h('path', {d: `M${r(cx - R)} ${r(py + ph * 0.38)}Q${r(cx - R)} ${r(py + ph * 0.4 - R * 1.25)} ${r(cx)} ${r(py + ph * 0.4 - R * 1.08)}Q${r(cx + R)} ${r(py + ph * 0.4 - R * 1.25)} ${r(cx + R)} ${r(py + ph * 0.38)}Q${r(cx)} ${r(py + ph * 0.4 - R * 0.55)} ${r(cx - R)} ${r(py + ph * 0.38)}Z`, fill: L.hairColor}),
      lines(w * 0.55, w * 0.9, hh * 0.2, hh * 0.56, 4),
      lines(w * 0.08, w * 0.9, hh * 0.74, hh * 0.84, 2, 0.5),
    );
  } else if (kind === 'document') {
    const c = Math.min(w, hh) * 0.2;
    parts.push(
      h('path', {d: `M0 6Q0 0 6 0H${r(w - c)}L${r(w)} ${r(c)}V${r(hh - 6)}Q${r(w)} ${r(hh)} ${r(w - 6)} ${r(hh)}H6Q0 ${r(hh)} 0 ${r(hh - 6)}Z`, fill: CARD, stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(w - c)} 0V${r(c * 0.85)}Q${r(w - c)} ${r(c)} ${r(w - c * 0.85)} ${r(c)}H${r(w)}`, fill: shade(CARD, -0.12), stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
      h('rect', {x: r(w * 0.1), y: r(hh * 0.1), width: r(w * 0.5), height: r(hh * 0.08), rx: 2, fill: '#8796a6'}),
      lines(w * 0.1, w * 0.9, hh * 0.32, hh * 0.62, 4),
      h('circle', {cx: r(w * 0.72), cy: r(hh * 0.8), r: r(Math.min(w, hh) * 0.11), fill: 'none', stroke: '#7d6aa0', 'stroke-width': 2.4}),
      h('path', {d: `M${r(w * 0.1)} ${r(hh * 0.84)}q${r(w * 0.06)} ${r(-hh * 0.08)} ${r(w * 0.12)} 0t${r(w * 0.12)} 0`, fill: 'none', stroke: '#2a3f7a', 'stroke-width': 2.2, 'stroke-linecap': 'round'}),
    );
  } else if (kind === 'photo') {
    const m = w * 0.08;
    parts.push(
      h('path', {d: roundRectPath(0, 0, w, hh, 4), fill: '#fbfbf8', stroke: INK, 'stroke-width': sw}),
      h('rect', {x: r(m), y: r(m), width: r(w - m * 2), height: r(hh * 0.68), fill: '#a9c7dc', stroke: INK, 'stroke-width': 1.6}),
      h('path', {d: `M${r(m)} ${r(m + hh * 0.68)}L${r(w * 0.35)} ${r(m + hh * 0.42)}L${r(w * 0.55)} ${r(m + hh * 0.56)}L${r(w * 0.72)} ${r(m + hh * 0.38)}L${r(w - m)} ${r(m + hh * 0.6)}V${r(m + hh * 0.68)}Z`, fill: '#6f8f6a', stroke: INK, 'stroke-width': 1.4, 'stroke-linejoin': 'round'}),
      h('circle', {cx: r(w * 0.72), cy: r(m + hh * 0.17), r: r(Math.min(w, hh) * 0.07), fill: '#f2d27a'}),
    );
  } else {
    parts.push(
      h('path', {d: roundRectPath(0, 0, w, hh, 6), fill: '#e8eef2', stroke: INK, 'stroke-width': sw}),
      h('rect', {x: r(w * 0.06), y: r(hh * 0.06), width: r(w * 0.88), height: r(hh * 0.08), rx: 3, fill: '#3d6f99'}),
      g({transform: T(w * 0.5, hh * 0.52, -24)},
        h('path', {d: `M${r(-w * 0.14)} ${r(-hh * 0.03)}H${r(w * 0.3)}V${r(hh * 0.03)}H${r(w * 0.26)}v${r(hh * 0.06)}h${r(-w * 0.05)}v${r(-hh * 0.06)}H${r(-w * 0.14)}Z`, fill: '#d4a640', stroke: INK, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
        h('circle', {cx: r(-w * 0.2), cy: 0, r: r(Math.min(w, hh) * 0.12), fill: '#d4a640', stroke: INK, 'stroke-width': 1.8}),
        h('circle', {cx: r(-w * 0.2), cy: 0, r: r(Math.min(w, hh) * 0.05), fill: '#e8eef2', stroke: INK, 'stroke-width': 1.4}),
      ),
      lines(w * 0.1, w * 0.7, hh * 0.84, hh * 0.84, 1, 1),
    );
  }
  for (const px of o.ports || []) parts.push(g({transform: T(px, Math.max(7, hh * 0.07))}, eyelet(Math.max(5, Math.min(w, hh) * 0.05))));
  return g({name: o.name}, parts);
}

/**
 * Manila exhibit tag (local origin = the string's knot on the card; the tag hangs down-right).
 * @param {any} ctx
 * @param {{name?:string, tw:number, th:number, idFit?:any}} o
 */
export function exhibitTag(ctx, o) {
  const {tw, th: hh} = o;
  const c = hh * 0.3;
  const x0 = tw * 0.18, y0 = hh * 0.45;
  return g({name: o.name},
    h('path', {d: `M0 0Q${r(x0 * 0.4)} ${r(y0 * 0.9)} ${r(x0 + hh * 0.16)} ${r(y0 + hh / 2)}`, fill: 'none', stroke: '#6b5a3a', 'stroke-width': 1.8}),
    h('path', {d: `M${r(x0 + c)} ${r(y0)}H${r(x0 + tw - 5)}Q${r(x0 + tw)} ${r(y0)} ${r(x0 + tw)} ${r(y0 + 5)}V${r(y0 + hh - 5)}Q${r(x0 + tw)} ${r(y0 + hh)} ${r(x0 + tw - 5)} ${r(y0 + hh)}H${r(x0 + c)}L${r(x0)} ${r(y0 + hh - c)}V${r(y0 + c)}Z`, fill: MANILA, stroke: INK, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    h('circle', {cx: r(x0 + hh * 0.16), cy: r(y0 + hh / 2), r: r(hh * 0.08), fill: shade(MANILA, -0.3)}),
    o.idFit ? textAt(o.idFit, {x: x0 + hh * 0.34, y: y0 + hh / 2 - o.idFit.size * 0.56, fill: INK}) : h('path', {d: `M${r(x0 + hh * 0.36)} ${r(y0 + hh / 2)}H${r(x0 + tw * 0.8)}`, stroke: MANILA_DARK, 'stroke-width': r(Math.max(3, hh * 0.12)), 'stroke-linecap': 'round'}),
  );
}

/** Exhibit tag box relative to its knot (for collision checks). */
export const tagBox = (tw, th) => ({x: 0, y: 0, w: tw * 1.18, h: th * 1.45});

/* ------------------------------------------------------------------ */
/* Magnifier                                                           */
/* ------------------------------------------------------------------ */

/** Magnifier (lupa); local origin = lens centre, handle toward +x+y. */
export function magnifierArt(R, name) {
  const hl = R * 1.25;
  const a = Math.PI / 4;
  const hx = Math.cos(a), hy = Math.sin(a);
  return g({name},
    h('line', {x1: r(hx * R * 1.05), y1: r(hy * R * 1.05), x2: r(hx * (R + hl)), y2: r(hy * (R + hl)), stroke: INK, 'stroke-width': r(R * 0.36), 'stroke-linecap': 'round'}),
    h('line', {x1: r(hx * R * 1.1), y1: r(hy * R * 1.1), x2: r(hx * (R + hl - 2)), y2: r(hy * (R + hl - 2)), stroke: '#6b4a2e', 'stroke-width': r(R * 0.26), 'stroke-linecap': 'round'}),
    h('circle', {cx: 0, cy: 0, r: r(R), fill: GLASS, 'fill-opacity': 0.45, stroke: INK, 'stroke-width': r(Math.max(2.5, R * 0.2), 2)}),
    h('circle', {cx: 0, cy: 0, r: r(R * 0.86), fill: 'none', stroke: '#9aa3ab', 'stroke-width': r(Math.max(1.5, R * 0.08), 2)}),
    h('path', {d: `M${r(-R * 0.55)} ${r(-R * 0.2)}A${r(R * 0.6)} ${r(R * 0.6)} 0 0 1 ${r(-R * 0.15)} ${r(-R * 0.58)}`, fill: 'none', stroke: '#fff', 'stroke-width': r(Math.max(2, R * 0.12), 2), 'stroke-linecap': 'round', opacity: 0.85}),
  );
}

/** Bounding box of the magnifier at (x, y) with lens radius R. */
export const magnifierBox = (x, y, R) => ({x: x - R - 3, y: y - R - 3, w: R * 2 + R * 1.6, h: R * 2 + R * 1.6});

/* ------------------------------------------------------------------ */
/* Legend icons and panel                                              */
/* ------------------------------------------------------------------ */

/**
 * Small legend icon centred at the origin, size s.
 * kinds: claim (o.index), ev-<kind>, line-direct, line-disputed, open (open point), person (o.look), board, lens, ring.
 */
export function legendIcon(ctx, kind, s, o = {}) {
  if (kind === 'claim') return g({transform: T(-s * 0.42, -s * 0.32)}, claimCardArt(ctx, {w: s * 0.84, h: s * 0.64, index: o.index ?? 0, lines: 2}));
  if (kind.startsWith('ev-')) {
    const k = kind.slice(3);
    const w = s * (k === 'photo' ? 0.66 : 0.7), hh = s * 0.82;
    return g({transform: T(-w / 2, -hh / 2)}, evidenceArt(ctx, {kind: k, w, h: hh, look: o.look}));
  }
  if (kind === 'line-direct' || kind === 'line-disputed') {
    const disp = kind === 'line-disputed';
    return g(null,
      h('path', {d: `M${r(-s * 0.46)} ${r(s * 0.12)}Q0 ${r(s * 0.28)} ${r(s * 0.46)} ${r(-s * 0.12)}`, fill: 'none', stroke: THREAD, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': disp ? DISPUTED_DASH(4) : undefined}),
      g({transform: T(-s * 0.46, s * 0.12)}, eyelet(5)),
      g({transform: T(s * 0.46, -s * 0.12)}, eyelet(5)),
    );
  }
  if (kind === 'open') {
    return g(null,
      h('path', {d: roundRectPath(-s * 0.4, -s * 0.34, s * 0.8, s * 0.6, 6), fill: MANILA, stroke: INK, 'stroke-width': 1.8}),
      h('path', {d: `M${r(-s * 0.4 + 10)} ${r(s * 0.26)}l-4 ${r(s * 0.16)}l${r(s * 0.16)} ${r(-s * 0.16)}`, fill: MANILA, stroke: INK, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}),
      h('path', {d: `M${r(-s * 0.26)} ${r(-s * 0.12)}H${r(s * 0.26)}M${r(-s * 0.26)} ${r(s * 0.04)}H${r(s * 0.1)}`, stroke: MANILA_DARK, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    );
  }
  if (kind === 'person') {
    const L = o.look || {skin: '#c9b8a6', outfit: '#6d7f91', hairColor: '#2b1d16'};
    return g(null,
      h('path', {d: `M${r(-s * 0.36)} ${r(s * 0.44)}Q${r(-s * 0.34)} ${r(s * 0.06)} 0 ${r(s * 0.06)}Q${r(s * 0.34)} ${r(s * 0.06)} ${r(s * 0.36)} ${r(s * 0.44)}Z`, fill: L.outfit, stroke: INK, 'stroke-width': 1.8}),
      h('circle', {cx: 0, cy: r(-s * 0.16), r: r(s * 0.19), fill: L.skin, stroke: INK, 'stroke-width': 1.8}),
      h('path', {d: `M${r(-s * 0.19)} ${r(-s * 0.18)}Q${r(-s * 0.19)} ${r(-s * 0.4)} 0 ${r(-s * 0.37)}Q${r(s * 0.19)} ${r(-s * 0.4)} ${r(s * 0.19)} ${r(-s * 0.18)}Q0 ${r(-s * 0.28)} ${r(-s * 0.19)} ${r(-s * 0.18)}Z`, fill: L.hairColor}),
    );
  }
  if (kind === 'board') {
    return g(null,
      h('rect', {x: r(-s * 0.44), y: r(-s * 0.32), width: r(s * 0.88), height: r(s * 0.64), rx: 3, fill: FRAME, stroke: INK, 'stroke-width': 1.8}),
      h('rect', {x: r(-s * 0.36), y: r(-s * 0.24), width: r(s * 0.72), height: r(s * 0.48), fill: LINEN}),
      h('rect', {x: r(-s * 0.28), y: r(-s * 0.18), width: r(s * 0.22), height: r(s * 0.14), fill: CARD, stroke: INK, 'stroke-width': 1}),
      h('rect', {x: r(s * 0.06), y: r(s * 0.02), width: r(s * 0.2), height: r(s * 0.16), fill: CARD, stroke: INK, 'stroke-width': 1}),
    );
  }
  if (kind === 'lens') return g({transform: T(-s * 0.12, -s * 0.12)}, magnifierArt(s * 0.26));
  if (kind === 'ring') return h('rect', {x: r(-s * 0.36), y: r(-s * 0.28), width: r(s * 0.72), height: r(s * 0.56), rx: 6, fill: 'none', stroke: o.color, 'stroke-width': 3.5});
  return h('circle', {r: r(s * 0.2), fill: INK});
}

/**
 * Legend panel layout. Rows: {kind:'heading'|'item'|'state'|'key', icon?, text, name, color?, index?, look?}.
 * @param {any} ctx
 * @param {any[]} rows
 * @param {{w:number, F:number, maxLines?:number}} o
 */
export function panelLayout(ctx, rows, o) {
  const {w, F} = o;
  const iconW = F * 2.1;
  const gap = F * 0.45;
  let y = 0;
  let ok = true;
  const out = rows.map(row => {
    const tw = row.kind === 'state' || row.kind === 'key' ? w - F * 1.2 : w - iconW;
    const fit = fitG(row.text, {maxWidth: tw, size: F, minSize: F, maxLines: o.maxLines ?? 3, weight: row.kind === 'heading' ? 700 : row.kind === 'key' ? 600 : 500});
    if (!fit.ok) ok = false;
    const pad = row.kind === 'state' ? F * 0.45 : 0;
    const hh = Math.max(fit.height, row.icon ? F * 1.25 : 0) + pad * 2;
    const item = {...row, fit, y, h: hh, pad, iconW, tw};
    y += hh + gap;
    return item;
  });
  return {rows: out, h: Math.max(0, y - gap), w, F, ok};
}

/** Legend panel node (local origin = top-left). Every row is a named group. */
export function panelNode(ctx, PL) {
  const th = ctx.theme;
  const F = PL.F;
  return PL.rows.map(row => {
    const parts = [];
    if (row.kind === 'state') {
      parts.push(h('path', {d: roundRectPath(0, row.y, PL.w, row.h, F * 0.6), fill: th.card, stroke: INK, 'stroke-width': 2}));
      parts.push(textAt(row.fit, {x: F * 0.6, y: row.y + row.pad, fill: INK}));
    } else if (row.kind === 'key') {
      parts.push(h('line', {x1: 0, x2: r(PL.w), y1: r(row.y - F * 0.25), y2: r(row.y - F * 0.25), stroke: th.fgSoft, 'stroke-width': 1.5, opacity: 0.6}));
      parts.push(textAt(row.fit, {x: F * 0.25, y: row.y, fill: th.fg, italic: true}));
    } else {
      if (row.icon) parts.push(g({transform: T(F * 0.9, row.y + Math.min(row.fit.height, F * 1.25) / 2)}, legendIcon(ctx, row.icon, F * 1.45, {color: row.color, index: row.index, look: row.look})));
      parts.push(textAt(row.fit, {x: row.iconW, y: row.y, fill: th.fg}));
    }
    return g({name: row.name}, parts);
  });
}

/**
 * Lay legend rows out in 1 or 2 columns of width colW (balanced split for 2).
 * @returns {{cols:any[], h:number, ok:boolean, colW:number}}
 */
export function legendColumns(ctx, rows, colW, F, cols = 1) {
  if (!rows.length) return {cols: [], h: 0, ok: true, colW};
  if (cols === 1) { const one = panelLayout(ctx, rows, {w: colW, F}); return {cols: [one], h: one.h, ok: one.ok, colW}; }
  let best = null;
  const all = panelLayout(ctx, rows, {w: colW, F});
  // candidate splits around the middle only (bounded work)
  const mid = all.rows.findIndex(rw => rw.y + rw.h > all.h / 2);
  for (let i = Math.max(1, mid - 2); i <= Math.min(rows.length - 1, mid + 2); i++) {
    const a = panelLayout(ctx, rows.slice(0, i), {w: colW, F}), b = panelLayout(ctx, rows.slice(i), {w: colW, F});
    if (!best || Math.max(a.h, b.h) < best.h) best = {h: Math.max(a.h, b.h), cols: [a, b], ok: a.ok && b.ok};
  }
  if (!best) return {cols: [all], h: all.h, ok: all.ok, colW};
  return {cols: best.cols, h: best.h, ok: best.ok, colW};
}

/** Rounded ring rectangle used to key editorial notes to their targets. */
export function ringRect(b, color, sw = 4, name) {
  return h('rect', {name, x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: color, 'stroke-width': r(sw, 2)});
}

/** Union of boxes. */
export function unionBox(boxes) {
  const xs = boxes.flatMap(b => [b.x, b.x + b.w]), ys = boxes.flatMap(b => [b.y, b.y + b.h]);
  return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
}
