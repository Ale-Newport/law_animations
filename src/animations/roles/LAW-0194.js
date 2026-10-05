/**
 * LAW-0194 — Consulta de expediente por auxiliar · mechanism
 *
 * Storyboard (an exploded plan of the consultation, not a row of boxes):
 *  0.00–0.18  separate: the requester and the assistant (bust badges), the reading desk and the
 *             case-file cabinet (numbered compartments, brass slot plates) are in place; the
 *             requested piece slides out of its compartment to its exploded position (its slot
 *             stays as a dashed outline) and the request bubble grows out of the requester.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one, anchored to the
 *             element edges and styled by kind (communication = dashed arrow, sequence = arrow,
 *             relation = plain line with end dots, never an arrow; causal only when supplied).
 *             Each label sits beside its own connector.
 *  0.43–0.75  trace: a marker follows `traversalOrder` along the connectors; the element it
 *             reaches is ringed and the focus element (default: the piece, whose tab number is
 *             the information that ties it to its slot) enlarges while the marker passes.
 *  0.75–1.00  gather: origin (requester, slot), transformation (the connectors with their kinds)
 *             and state stay visible: the piece is shown back in its numbered slot (as supplied),
 *             a legend of the kinds used and the "as supplied · no conclusion drawn" key.
 * Nothing is assessed: no consequence of where a piece is filed, no procedure, no outcome.
 * @module animations/roles/LAW-0194
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {mechanismFields, str, obj} from '../../schemas/fields.js';
import {LINK_STYLES} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {
  fileFields, FILE_DEFAULTS, FILE_STRINGS, glueNums, resolvePieces, pieceColor, pips, measurePieces,
  keyLayout, fitWords, wchip, overlaps, textBlockAt,
} from './kits/consulta-de-expediente.js';

const ID = 'LAW-0194';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const IDS = ['requester', 'request', 'assistant', 'piece', 'slot', 'desk'];
const W = {slide: [0.03, 0.16], text: [0.1, 0.17], relate: [0.18, 0.41], trace: [0.45, 0.72], state: [0.74, 0.79], legend: [0.76, 0.82]};
// a relation label sits within REL_NEAR (px at 1080p) of its own connector; every other connector is at least
// REL_MARGIN further away
const REL_NEAR = 40;
const REL_MARGIN = 10;
const INK = '#1f2328';
const FONT = 'Inter, "Helvetica Neue", Arial, sans-serif';

const STRINGS = {
  en: {...FILE_STRINGS.en, backIn: 'back in slot', stateCap: 'State (as supplied)'},
  es: {...FILE_STRINGS.es, backIn: 'de vuelta en la casilla', stateCap: 'Estado (según lo aportado)'},
};

const sceneSchema = {
  actors: fileFields.actors,
  roles: fileFields.roles,
  props: fileFields.props,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 50, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  actors: FILE_DEFAULTS.actors,
  roles: FILE_DEFAULTS.roles,
  props: FILE_DEFAULTS.props,
  elements: [
    {id: 'requester', label: 'Requester'},
    {id: 'request', label: 'Request'},
    {id: 'assistant', label: 'Assistant'},
    {id: 'piece', label: 'Requested piece'},
    {id: 'slot', label: 'Numbered slot'},
    {id: 'desk', label: 'Reading desk'},
  ],
  relationships: [
    {from: 'requester', to: 'request', kind: 'communication', label: 'asks'},
    {from: 'request', to: 'assistant', kind: 'communication', label: 'addressed to'},
    {from: 'assistant', to: 'piece', kind: 'sequence', label: 'finds it by its tab'},
    {from: 'piece', to: 'desk', kind: 'sequence', label: 'read on'},
    {from: 'desk', to: 'slot', kind: 'sequence', label: 'put back in'},
    {from: 'piece', to: 'slot', kind: 'relation', label: 'same number'},
  ],
  focusElement: 'piece',
  relationLabels: {relation: 'plain relation (no direction)', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['requester', 'request', 'assistant', 'piece', 'desk', 'slot'],
};

/**
 * Plan per shape (fractions of the design space). People: centre; R: badge radius (fraction of min(w,h));
 * request/piece/desk: [left, top, width]; cab: [left, top, width, maxBottom]; legend: top of the legend band.
 * The loop  slot → piece → desk → slot  sits around the piece; the request chain comes in from the people.
 */
const PLAN = {
  landscape: {requester: [0.07, 0.56], assistant: [0.5, 0.16], R: 0.12, request: [0.015, 0.03, 0.27], piece: [0.2, 0.42, 0.21],
    desk: [0.36, 0.76, 0.3], cab: [0.7, 0.2, 0.29, 0.88], legend: 0.9},
  square: [
    // found by a plan search at 20 px (default, es and the alternative preset all fit)
    {requester: [0.09, 0.62], assistant: [0.52, 0.2], R: 0.085, request: [0.02, 0.02, 0.4], piece: [0.2, 0.36, 0.24],
      desk: [0.26, 0.74, 0.34], cab: [0.64, 0.2, 0.35, 0.88], legend: 0.9},
    {requester: [0.1, 0.665], assistant: [0.55, 0.13], R: 0.095, request: [0.02, 0.02, 0.4], piece: [0.19, 0.35, 0.28],
      desk: [0.3, 0.76, 0.36], cab: [0.64, 0.3, 0.35, 0.88], legend: 0.9},
    {requester: [0.1, 0.62], assistant: [0.5, 0.25], R: 0.095, request: [0.02, 0.02, 0.36], piece: [0.14, 0.33, 0.28],
      desk: [0.26, 0.74, 0.36], cab: [0.655, 0.03, 0.34, 0.88], legend: 0.9},
    {requester: [0.09, 0.6], assistant: [0.52, 0.2], R: 0.09, request: [0.02, 0.02, 0.38], piece: [0.2, 0.4, 0.26],
      desk: [0.24, 0.75, 0.34], cab: [0.64, 0.12, 0.35, 0.88], legend: 0.9},
    // text-heavy: the assistant in the top-right corner above the cabinet, a wide request bubble across the top
    {requester: [0.09, 0.62], assistant: [0.85, 0.13], R: 0.085, request: [0.02, 0.02, 0.53], piece: [0.22, 0.34, 0.3],
      desk: [0.34, 0.76, 0.28], cab: [0.63, 0.3, 0.36, 0.88], legend: 0.9},
    // text-heavy: a wide, low cabinet on the right half (one-line titles), the requester top-centre
    {requester: [0.66, 0.1], assistant: [0.08, 0.3], R: 0.065, request: [0.02, 0.02, 0.46], piece: [0.14, 0.46, 0.24],
      desk: [0.28, 0.72, 0.22], cab: [0.5, 0.26, 0.49, 0.88], legend: 0.9, bars: 1.2},
  ],
  portrait: {requester: [0.16, 0.105], assistant: [0.8, 0.27], R: 0.13, request: [0.34, 0.015, 0.63], piece: [0.04, 0.41, 0.46],
    desk: [0.05, 0.765, 0.5], cab: [0.54, 0.45, 0.44, 0.86], legend: 0.9},
};

const labelOf = (p, id) => (p.elements.find(e => e.id === id) || {}).label || '';
function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}
const inBox = (q, b, pad = 0) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
const boxToPts = (b, pts) => Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));

function tryLayout(ctx, Spx, variant = 0, asShown = false) {
  const p = ctx.params;
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const F = Spx / px;
  const shape = ctx.view.shape;
  const Pn = Array.isArray(PLAN[shape]) ? PLAN[shape][variant] : PLAN[shape];
  // asShown: measure as if every label were drawn (the size and plan are chosen that way, so hiding labels
  // never changes the layout)
  const showAll = asShown || ctx.show('all'), showKey = asShown || ctx.show('key');
  const problems = [];
  const X = f => f * D.w, Y = f => f * D.h;
  const R = Pn.R * Math.min(D.w, D.h);
  const {pieces, target} = resolvePieces(p.props);
  const tp = pieces[target];
  const bottomY = Y(Pn.legend) - 0.6 * F;

  // --- people (bust badges)
  const actorOf = id => (id === 'assistant' ? p.actors[0] : p.actors[1]) || {name: '', role: ''};
  const looks = {assistant: actorLook(ctx, p.actors[0], 0), requester: actorLook(ctx, actorOf('requester'), 1)};
  const people = ['requester', 'assistant'].map(id => {
    const c = {x: X(Pn[id][0]), y: Y(Pn[id][1])};
    const b = personBadge(ctx, {name: `pb-${id}`, x: c.x, y: c.y, radius: R, look: looks[id]});
    return {id, c, b, circle: b.circle, box: {x: c.x - R, y: c.y - R, w: 2 * R, h: 2 * R}};
  });

  // --- request bubble (the supplied request, quoted)
  const [rqx, rqy, rqw] = Pn.request;
  const reqFit = fitWords(glueNums(`${ctx.t.qOpen}${p.props.request}${ctx.t.qClose}`), {maxWidth: X(rqw) - 1.4 * F, size: F, minSize: F, maxLines: 4, weight: 600});
  if (reqFit.truncated) problems.push('request-truncated');
  // the element label is printed as the bubble's heading (bold), the quote under it
  const reqHead = fitWords(labelOf(p, 'request'), {maxWidth: X(rqw) - 1.4 * F, size: F, minSize: F, maxLines: 3, weight: 800});
  if (reqHead.truncated) problems.push('request-label-truncated');
  const request = {id: 'request', x: X(rqx), y: Y(rqy), w: X(rqw), h: reqHead.height + 0.3 * F + reqFit.height + 1.2 * F, fit: reqFit, head: showKey ? reqHead : null, headH: reqHead.height + 0.3 * F};

  // --- the exploded piece (folder card: title strip + numbered tab, simulated lines below)
  const [pcx, pcy, pcw] = Pn.piece;
  const Mp = measurePieces(ctx, {pieces: [tp], F, W: X(pcw), showText: true, maxLines: 3});
  if (!Mp.ok) problems.push('piece-title');
  // the element label is printed on the folder's cover, under the title strip
  const pcHead = fitWords(labelOf(p, 'piece'), {maxWidth: X(pcw) - 2 * Mp.pad, size: F, minSize: F, maxLines: 3, weight: 800});
  if (pcHead.truncated) problems.push('piece-label-truncated');
  const piece = {id: 'piece', x: X(pcx), y: Y(pcy), w: X(pcw), h: Mp.stripH + pcHead.height + 0.8 * F + (Pn.bars ?? 2.4) * F, M: Mp, fit: Mp.fits[0], head: showKey ? pcHead : null, headH: pcHead.height};

  // --- cabinet (numbered compartments, slot 1 at the bottom) and the target slot
  const [cbx, cby, cbw, cbb] = Pn.cab;
  const plateW = Math.max(ctx.measure('9', F, 800, 'sans') + 1.1 * F, 1.8 * F);
  const post = plateW + 0.9 * F;
  const side = 0.5 * F;
  const innerW = X(cbw) - post - side * 2;
  const Mc = measurePieces(ctx, {pieces, F, W: innerW - 0.3 * F, showText: true, maxLines: 3});
  if (!Mc.ok) problems.push('cabinet-titles');
  const labFit = fitWords(glueNums(p.props.fileLabel), {maxWidth: X(cbw) - 1.6 * F, size: F, minSize: F, maxLines: 2, weight: 700});
  if (labFit.truncated) problems.push('file-label');
  const rowH = Mc.stripH + Mc.tabP + 0.45 * F;
  const n = pieces.length;
  const headH = labFit.height + 1.1 * F;
  const cab = {x: X(cbx), y: Y(cby), w: X(cbw), headH, rowH, post, side, innerW, plateW};
  cab.h = headH + n * rowH + 0.6 * F + 0.9 * F;
  if (cab.y + cab.h > Math.min(Y(cbb), bottomY)) problems.push('cabinet-tall');
  // row c (slot index, 0 = slot 1) from the bottom
  cab.rowTop = c => cab.y + headH + (n - 1 - c) * rowH + 0.3 * F;
  const slotBox = {x: cab.x + side, y: cab.rowTop(target), w: cab.w - 2 * side, h: rowH};
  const slot = {id: 'slot', ...slotBox};

  // --- desk
  const [dkx, dky, dkw] = Pn.desk;
  const desk = {id: 'desk', x: X(dkx), y: Y(dky), w: X(dkw), h: Math.max(3.4 * F, Y(0.1))};

  const cards = [request, piece, desk];
  const blocks = [...cards, {id: 'cab', x: cab.x, y: cab.y, w: cab.w, h: cab.h}, ...people.map(q => ({id: q.id, ...q.box}))];
  for (const b of blocks) if (b.x < 8 || b.y < 8 || b.x + b.w > D.w - 8 || b.y + b.h > bottomY) problems.push(`${b.id}-outside`);
  for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) if (overlaps(blocks[i], blocks[j], 1.2 * F)) problems.push(`overlap-${blocks[i].id}-${blocks[j].id}`);

  // --- relation graph (connectors anchored to real edges; labels placed below)
  const elements = {
    requester: {circle: people[0].circle}, assistant: {circle: people[1].circle},
    request: {box: {x: request.x, y: request.y, w: request.w, h: request.h}},
    piece: {box: {x: piece.x, y: piece.y - Mp.tabP, w: piece.w, h: piece.h + Mp.tabP}},
    // the slot is entered from its open (left) end: connectors land on that mouth, never across other rows
    slot: {circle: {x: cab.x - 0.55 * F, y: slotBox.y + slotBox.h / 2, r: Math.max(2, Math.min(0.42 * F, slotBox.h / 2 - 16))}},
    desk: {box: {x: desk.x, y: desk.y, w: desk.w, h: desk.h}},
  };
  const known = new Set(IDS);
  const rels = p.relationships.filter(q => known.has(q.from) && known.has(q.to) && q.from !== q.to);
  const graph = relationGraph(ctx, {name: 'rgp', elements, relationships: rels, relationLabels: p.relationLabels, separateLabels: true, bend: () => 0.08, obstacles: []});
  const pathPts = graph.conns.map(x => { const pts = []; for (let t = 0; t <= 1.0001; t += 1 / 24) pts.push(x.c.at(t)); return pts; });
  const fine = graph.conns.map(x => { const pts = []; for (let t = 0; t <= 1.0001; t += 1 / 96) pts.push(x.c.at(t)); return pts; });
  const inner = fine.map(pts => pts.slice(4, -4)).flat();
  // connectors never cross the cabinet's other rows or the piece card's text (they end on edges)
  for (const [i, pts] of pathPts.entries()) {
    const rel = graph.conns[i].rel;
    const cabNoSlot = {x: cab.x, y: cab.y, w: cab.w, h: cab.h};
    if (!(rel.from === 'slot' || rel.to === 'slot') && pts.slice(1, -1).some(q => inBox(q, cabNoSlot, 2))) problems.push('conn-through-cabinet');
    if ((rel.from === 'slot' || rel.to === 'slot') && pts.slice(1, -1).some(q => inBox(q, cabNoSlot, -2))) problems.push('conn-through-rows');
    for (const b of cards) if (rel.from !== b.id && rel.to !== b.id && pts.some(q => inBox(q, b, 4))) problems.push(`conn-through-${b.id}:${rel.from}>${rel.to}`);
    for (const q0 of people) if (rel.from !== q0.id && rel.to !== q0.id && pts.some(q => Math.hypot(q.x - q0.c.x, q.y - q0.c.y) < R + 6)) problems.push(`conn-through-${q0.id}`);
  }

  // --- element labels (people: "name · role"; objects: their element label) in free space next to them
  const hardBase = [...blocks.filter(b => b.id !== 'cab'), {x: cab.x, y: cab.y, w: cab.w, h: cab.h}];
  const chips = [];
  const nameTexts = [];
  const placeChip = (id, text, near, sides, maxW, opts = {}) => {
    const c0 = wchip(ctx, text, {x: 0, y: 0, maxWidth: maxW, size: F, minSize: F, maxLines: 5, weight: opts.weight});
    if (c0.fit.truncated) problems.push(`${id}-label-truncated`);
    const w = c0.box.w, hh = c0.box.h, gap = 0.45 * F;
    const cands = [];
    for (const s of sides) {
      for (const k of [0.5, 0, 1, 0.25, 0.75]) {
        if (s === 'below') cands.push({x: near.x + (near.w - w) * k, y: near.y + near.h + gap});
        if (s === 'above') cands.push({x: near.x + (near.w - w) * k, y: near.y - gap - hh});
        if (s === 'left') cands.push({x: near.x - gap - w, y: near.y + (near.h - hh) * k});
        if (s === 'right') cands.push({x: near.x + near.w + gap, y: near.y + (near.h - hh) * k});
      }
    }
    const ok = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= D.w - 8 && b.y + b.h <= bottomY
      && !hardBase.some(o => overlaps(b, o, 0.3 * F)) && !chips.some(o => overlaps(b, o.box, 0.4 * F))
      && !inner.some(q => inBox(q, b, 6));
    const spot = cands.find(c => ok({x: c.x, y: c.y, w, h: hh}));
    if (!spot) problems.push(`${id}-label-place`);
    const at = spot || cands[0];
    const c = wchip(ctx, text, {x: at.x, y: at.y, maxWidth: maxW, size: F, minSize: F, maxLines: 5, weight: opts.weight, fill: opts.fill ?? '#f7f1e3', name: `lab-${id}`});
    chips.push({id, box: c.box, node: c.node, fit: c.fit});
    return c;
  };
  if (showKey) {
    for (const q of people) {
      const a = actorOf(q.id);
      const role = (p.roles && p.roles[q.id]) || a.role || '';
      const el = labelOf(p, q.id);
      const text = [a.name, role, el && el !== role ? `(${el})` : ''].filter(Boolean).join(' · ');
      nameTexts.push(text);
      placeChip(q.id, text, q.box, shape === 'portrait' ? ['below', 'left', 'right', 'above'] : ['below', 'above', 'right', 'left'], shape === 'portrait' ? D.w * 0.42 : Math.min(D.w * 0.26, 16 * F));
    }
    // the slot's label beside the cabinet (the plate column is on the right; below the cabinet is free)
    placeChip('slot', labelOf(p, 'slot'), {x: cab.x, y: cab.y, w: cab.w, h: cab.h}, ['below', 'left', 'above'], Math.max(cab.w, 10 * F), {weight: 700});
    for (const id of ['desk']) {
      const b = id === 'piece' ? elements.piece.box : cards.find(c => c.id === id);
      placeChip(id, labelOf(p, id), b, ['below', 'above', 'left', 'right'], Math.max(b.w, 10 * F), {weight: 700});
    }
  }

  // --- relation labels: near their own connector (≤ REL_NEAR px), every other connector ≥ REL_MARGIN further
  const relLabels = [];
  const hard = [...hardBase, ...chips.map(c => c.box)];
  const lb = {x: 8, y: 8, w: D.w - 16, h: bottomY - 8};
  const near = REL_NEAR / px, margin = REL_MARGIN / px;
  if (showAll) {
    graph.conns.forEach((x, i) => {
      const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
      const col = kindColor(ctx, x.rel.kind);
      const own0 = fine[i];
      const xs = own0.map(q => q.x), ys = own0.map(q => q.y);
      const mid = x.c.at(0.5);
      let best = null;
      const step = Math.max(4, F * 0.3);
      // widest first; a narrower (taller) chip when the free space beside the line is narrow
      for (const mw of [Math.min(14 * F, D.w * 0.4), 10 * F, 7 * F]) {
        if (best) break;
        const probeC = wchip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: F, minSize: F, maxLines: 4, weight: 600});
        if (probeC.fit.truncated) continue;
        const w = probeC.box.w, hh = probeC.box.h;
        for (let by = Math.min(...ys) - hh - near; by <= Math.max(...ys) + near; by += step) {
          for (let bx = Math.min(...xs) - w - near; bx <= Math.max(...xs) + near; bx += step) {
            const b = {x: bx, y: by, w, h: hh};
            if (b.x < lb.x || b.y < lb.y || b.x + w > lb.x + lb.w || b.y + hh > lb.y + lb.h) continue;
            if (hard.some(o => overlaps(b, o, 0.3 * F)) || relLabels.some(o => overlaps(b, o.box, 0.6 * F))) continue;
            const own = boxToPts(b, own0);
            if (own > near || own < 4) continue;
            if (fine.some((pts, j) => j !== i && boxToPts(b, pts) < own + margin)) continue;
            const sc = own + boxToPts(b, [mid]) * 0.4;
            if (!best || sc < best.sc) best = {sc, b, d: own, mw};
          }
        }
      }
      if (!best) { problems.push(`relation-label-place:${x.rel.from}>${x.rel.to}`); return; }
      let qb = own0[0], qd = Infinity;
      for (const q of own0) { const dd = boxToPts(best.b, [q]); if (dd < qd) { qd = dd; qb = q; } }
      const c = wchip(ctx, text, {x: best.b.x, y: best.b.y, maxWidth: best.mw, size: F, minSize: F, maxLines: 4, weight: 600, stroke: col, fill: ctx.theme.card});
      const from = {x: clamp(qb.x, c.box.x, c.box.x + c.box.w), y: clamp(qb.y, c.box.y, c.box.y + c.box.h)};
      // short leader from the chip to the nearest point of its own line (crosses nothing: the gap is empty)
      const leader = best.d * px > 14 ? h('line', {x1: r(qb.x), y1: r(qb.y), x2: r(from.x), y2: r(from.y), stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null;
      const oth = fine.filter((_, j) => j !== i).map(pts => boxToPts(c.box, pts));
      relLabels.push({i, box: c.box, node: g({name: `rl${i}`, opacity: 0}, leader, c.node), dist: r(best.d * px, 1), others: oth.length ? r(Math.min(...oth) * px, 1) : null, fit: c.fit});
    });
  }
  const labelsOffConnectors = relLabels.every(l => pathPts.every(pts => pts.every(q => !inBox(q, l.box, 2))));
  const connectorsClearOfChips = fine.every(pts => pts.slice(4, -4).every(q => chips.every(c => !inBox(q, c.box, 4))));
  const connLens = graph.conns.map(x => x.c.total * px);
  let crossings = 0;
  const segX = (a, b, c, d) => {
    const o = (p1, p2, p3) => Math.sign((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  for (let i = 0; i < pathPts.length; i++) for (let j = i + 1; j < pathPts.length; j++) {
    const A = pathPts[i].slice(1, -1), B = pathPts[j].slice(1, -1);
    let hit = false;
    for (let a = 1; a < A.length && !hit; a++) for (let b = 1; b < B.length && !hit; b++) hit = segX(A[a - 1], A[a], B[b - 1], B[b]);
    if (hit) crossings++;
  }
  if (!labelsOffConnectors) problems.push('label-on-connector');
  if (!connectorsClearOfChips) problems.push('connector-under-chip');
  if (connLens.length && Math.min(...connLens) < 70) problems.push('connector-short');
  if (crossings) problems.push('crossing');
  const order = p.traversalOrder.filter(id => known.has(id));
  const route = graph.route(order);

  // --- state tag (the piece back in its numbered slot, as supplied) under/beside the cabinet
  let stateChip = null;
  const stateText = `${ctx.t.stateCap}: ${ctx.t.piece} ${tp.number} ${ctx.t.backIn} ${tp.number}`;
  if (showAll) {
    const c0 = wchip(ctx, glueNums(stateText), {x: 0, y: 0, maxWidth: Math.max(cab.w, 12 * F), size: F, minSize: F, maxLines: 3, stroke: ctx.theme.accent2, weight: 600});
    const w = c0.box.w, hh = c0.box.h;
    const slotChip = chips.find(c => c.id === 'slot');
    const cands = [];
    const base = slotChip ? slotChip.box : {x: cab.x, y: cab.y, w: cab.w, h: cab.h};
    for (const k of [0.5, 0, 1]) cands.push({x: base.x + (base.w - w) * k, y: base.y + base.h + 0.4 * F});
    for (const k of [0.5, 0, 1]) cands.push({x: cab.x - 0.6 * F - w, y: cab.y + cab.h - hh - (cab.h - hh) * k * 0.3});
    for (const k of [1, 0.5, 0]) cands.push({x: cab.x + (cab.w - w) * k, y: cab.y - 0.4 * F - hh});
    const ok = b => b.x >= 8 && b.x + b.w <= D.w - 8 && b.y >= 8 && b.y + b.h <= bottomY && !hard.some(o => overlaps(b, o, 0.3 * F)) && !relLabels.some(o => overlaps(b, o.box, 0.3 * F)) && !inner.some(q => inBox(q, b, 6));
    const at = cands.find(c => ok({x: c.x, y: c.y, w, h: hh}));
    if (!at) problems.push('state-place');
    const A = at || cands[0];
    stateChip = wchip(ctx, glueNums(stateText), {x: A.x, y: A.y, maxWidth: Math.max(cab.w, 12 * F), size: F, minSize: F, maxLines: 3, stroke: ctx.theme.accent2, weight: 600, name: 'state-chip'});
    if (stateChip.fit.truncated) problems.push('state-truncated');
  }

  // --- legend of the kinds used + key (flowing rows at the bottom)
  const kinds = [...new Set(rels.map(q => q.kind))];
  const legendItems = [];
  if (showAll) {
    for (const kd of kinds) {
      const txt = p.relationLabels[kd] || kd;
      const c = wchip(ctx, txt, {x: 0, y: 0, maxWidth: D.w * 0.45, size: F, minSize: F, maxLines: 2, weight: 600, stroke: kindColor(ctx, kd)});
      if (c.fit.truncated) problems.push('legend-truncated');
      legendItems.push({kd, st: LINK_STYLES[kd], txt, w: c.box.w + 2.6 * F, h: c.box.h});
    }
  }
  const key = showKey ? keyLayout(ctx, {w: D.w - 16, size: F}) : null;
  if (key && !key.ok) problems.push('key');
  const rows = [[]];
  let rw = 0;
  const all = [...legendItems, ...(key ? [{key: true, w: key.w, h: key.h}] : [])];
  for (const it of all) {
    if (rw > 0 && rw + it.w + F > D.w - 16) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push(it);
    rw += it.w + F;
  }
  const rowHs = rows.map(rr => Math.max(0, ...rr.map(it => it.h)));
  const legendH = rowHs.reduce((a, b) => a + b, 0) + 0.4 * F * Math.max(0, rows.length - 1);
  const legendTop = D.h - 8 - legendH;
  const contentBottom = Math.max(...blocks.map(b => b.y + b.h), ...chips.map(c => c.box.y + c.box.h), ...relLabels.map(l => l.box.y + l.box.h), stateChip ? stateChip.box.y + stateChip.box.h : 0);
  if (all.length && legendTop < contentBottom + 0.4 * F) problems.push('legend-collision');
  const legendNodes = [];
  let ly = legendTop;
  rows.forEach((row, ri) => {
    const tw = row.reduce((a, it) => a + it.w, 0) + F * (row.length - 1);
    let lx = (D.w - tw) / 2;
    for (const it of row) {
      const iy = ly + (rowHs[ri] - it.h) / 2;
      if (it.key) legendNodes.push(key.build(lx, iy, 'key'));
      else {
        const col = kindColor(ctx, it.kd);
        const ymid = iy + it.h / 2;
        const c = wchip(ctx, it.txt, {x: lx + 2.6 * F, y: iy, maxWidth: D.w * 0.45, size: F, minSize: F, maxLines: 2, weight: 600, stroke: col});
        legendNodes.push(g(null,
          h('line', {x1: r(lx), x2: r(lx + 2.0 * F), y1: r(ymid), y2: r(ymid), stroke: col, 'stroke-width': it.st.width, 'stroke-dasharray': it.st.dash || undefined, 'stroke-linecap': 'round'}),
          it.st.arrow ? h('path', {d: `M${r(lx + 2.2 * F)} ${r(ymid)}l-12 -7v14z`, fill: col}) : h('circle', {cx: r(lx + 2.1 * F), cy: r(ymid), r: 4.5, fill: col}),
          it.st.endDots ? h('circle', {cx: r(lx), cy: r(ymid), r: 4.5, fill: col}) : null,
          c.node));
      }
      lx += it.w + F;
    }
    ly += rowHs[ri] + 0.4 * F;
  });
  return {
    ok: problems.length === 0, problems, variant, F, Spx, px, R, people, request, piece, desk, cab, slot, slotBox, Mc, Mp, labFit, pieces, target,
    graph, route, order, chips, nameTexts, relLabels, stateChip, legendNodes, rels, elements,
    labelsOffConnectors, connectorsClearOfChips, crossings, minConn: connLens.length ? r(Math.min(...connLens), 1) : 0, connLens: connLens.map(v => r(v)),
  };
}

/* ------------------------------------------------------------------ drawing */

/** Case-file cabinet front: head with the file label, numbered compartments (slot 1 at the bottom), plate post. */
function cabinetNode(ctx, L, showText) {
  const th = ctx.theme;
  const {cab, Mc, F, pieces, target, labFit} = L;
  const wood = '#8a5a34', woodD = shade(wood, -0.25), woodL = shade(wood, 0.18);
  const parts = [
    h('path', {d: roundRectPath(cab.x + 8, cab.y + 12, cab.w, cab.h, 10), fill: th.shadow}),
    h('path', {d: roundRectPath(cab.x, cab.y, cab.w, cab.h, 10), fill: wood, stroke: INK, 'stroke-width': 3}),
    h('path', {d: roundRectPath(cab.x + cab.side, cab.y + cab.headH, cab.innerW, cab.h - cab.headH - 0.9 * F, 4), fill: '#3a2618', stroke: INK, 'stroke-width': 2}),
    // file label plate on the head
    h('path', {d: roundRectPath(cab.x + 0.5 * F, cab.y + 0.35 * F, cab.w - F, labFit.height + 0.5 * F, 6), fill: '#f4ecd8', stroke: INK, 'stroke-width': 2}),
    showText ? textBlockAt(labFit, cab.x + 0.8 * F, cab.y + 0.6 * F, INK, 'cab-label') : null,
    // plate post (right)
    h('path', {d: roundRectPath(cab.x + cab.side + cab.innerW, cab.y + cab.headH, cab.post, cab.h - cab.headH - 0.9 * F, 3), fill: woodL, stroke: INK, 'stroke-width': 2}),
    // plinth
    h('path', {d: roundRectPath(cab.x - 0.3 * F, cab.y + cab.h - 0.9 * F, cab.w + 0.6 * F, 0.9 * F, 4), fill: woodD, stroke: INK, 'stroke-width': 2.5}),
  ];
  const rowsN = [];
  pieces.forEach((q, c) => {
    const top = cab.rowTop(c);
    const col = pieceColor(ctx, c);
    // compartment shelf line
    rowsN.push(h('line', {x1: r(cab.x + cab.side), x2: r(cab.x + cab.side + cab.innerW), y1: r(top + cab.rowH - 0.3 * F), y2: r(top + cab.rowH - 0.3 * F), stroke: woodD, 'stroke-width': 3}));
    // brass plate with the slot number
    const pw = cab.plateW, ph = 1.3 * F;
    const pxx = cab.x + cab.side + cab.innerW + (cab.post - pw) / 2, pyy = top + Mc.tabP + (Mc.stripH - ph) / 2;
    rowsN.push(h('path', {d: roundRectPath(pxx, pyy, pw, ph, 4), fill: '#d8b45a', stroke: INK, 'stroke-width': 1.8}));
    rowsN.push(h('circle', {cx: r(pxx + 0.22 * F), cy: r(pyy + ph / 2), r: r(0.08 * F), fill: '#6b5220'}));
    rowsN.push(h('circle', {cx: r(pxx + pw - 0.22 * F), cy: r(pyy + ph / 2), r: r(0.08 * F), fill: '#6b5220'}));
    rowsN.push(showText
      ? h('text', {x: r(pxx + pw / 2), y: r(pyy + ph / 2 + F * 0.36), 'text-anchor': 'middle', 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 800, fill: '#3b2a08'}, String(c + 1))
      : pips(c + 1, {cx: pxx + pw / 2, cy: pyy + ph / 2, hh: ph, fill: '#3b2a08'}));
    // the piece strip standing in the compartment (the target's is a named group: it leaves and comes back)
    const sx = cab.x + cab.side + 0.15 * F, sy = top + Mc.tabP;
    const strip = stripNode(ctx, {x: sx, y: sy, w: Mc.W, M: Mc, piece: q, fit: Mc.fits[c], col, showText});
    if (c === target) {
      // the empty slot: dashed outline (visible while the piece is out)
      rowsN.push(h('path', {name: 'slot-empty', d: roundRectPath(sx, sy - Mc.tabP, Mc.W, Mc.stripH + Mc.tabP, 5), fill: 'none', stroke: '#e9dcc0', 'stroke-width': 2.5, 'stroke-dasharray': '8 6', opacity: 0}));
      rowsN.push(g({name: 'slot-piece'}, strip));
    } else rowsN.push(strip);
  });
  return g({name: 'cabinet'}, parts, rowsN);
}

/** Visible top strip of a piece: cover band with the title (left) and the numbered tab (right). */
function stripNode(ctx, o) {
  const {x, y, w, M, piece, fit, col, showText} = o;
  const F = M.F;
  // the index tab sits on the strip's right end and stands a little above it; its number is wholly on the tab
  const th = Math.min(M.stripH - 0.2 * F, 1.3 * F);
  const tab = {x: x + M.tab.x, y: y - M.tabP, w: M.tab.w, h: th + M.tabP};
  return g(null,
    h('path', {d: roundRectPath(x, y, w, M.stripH, 5), fill: col.cover, stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(tab.x, tab.y, tab.w, tab.h, Math.min(8, tab.h * 0.28)), fill: col.tab, stroke: INK, 'stroke-width': 2}),
    g(o.txtName ? {name: o.txtName} : null,
      showText
        ? h('text', {x: r(tab.x + tab.w / 2), y: r(tab.y + tab.h / 2 + F * 0.36), 'text-anchor': 'middle', 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 800, fill: col.tabInk}, String(piece.number))
        : pips(piece.number, {cx: tab.x + tab.w / 2, cy: tab.y + tab.h / 2, hh: tab.h, fill: col.tabInk}),
      showText && fit ? textBlockAt(fit, x + M.pad, y + (M.stripH - fit.height) / 2, INK) : null),
  );
}

/** The exploded piece: a folder card with its strip (title + tab) and simulated lines on the cover. */
function pieceNode(ctx, L, showText) {
  const th = ctx.theme;
  const {piece, Mp, F, target} = L;
  const col = pieceColor(ctx, target);
  const {x, y, w, h: hh} = piece;
  const bars = [];
  const bar = Math.max(4, F * 0.22);
  const headY = y + Mp.stripH + 0.5 * F;
  const barsY = headY + piece.headH + 0.6 * F;
  for (let i = 0, by = barsY; by + bar < y + hh - 0.6 * F && i < 5; i++, by += bar * 2.6) {
    bars.push(h('rect', {x: r(x + Mp.pad), y: r(by), width: r((w - Mp.pad * 2) * (i % 3 === 2 ? 0.5 : 0.82)), height: r(bar), rx: r(bar / 2), fill: shade(col.cover, -0.14)}));
  }
  return g({name: 'piece-card'},
    h('path', {d: roundRectPath(x + 7, y + 10, w, hh, 8), fill: th.shadow}),
    h('path', {d: roundRectPath(x + 5, y + 5, w, hh, 8), fill: col.leaf, stroke: INK, 'stroke-width': 2}),
    h('path', {d: roundRectPath(x, y, w, hh, 8), fill: col.cover, stroke: INK, 'stroke-width': 2.6}),
    bars,
    piece.head ? g({name: 'piece-label-g'}, textBlockAt(piece.head, x + Mp.pad, headY, INK, 'piece-label')) : null,
    stripNode(ctx, {x, y, w, M: Mp, piece: L.pieces[target], fit: Mp.fits[0], col, showText, txtName: 'piece-txt'}),
  );
}

/** Request bubble with its tail towards the requester. */
function requestNode(ctx, L, showText) {
  const th = ctx.theme;
  const {request: q, F} = L;
  const rq = L.people[0].c;
  // the tail leaves the edge that faces the requester (side edges when they stand beside the bubble)
  const side = rq.x > q.x + q.w ? 1 : rq.x < q.x ? -1 : 0;
  let base, a1, a2, seam;
  if (side && Math.abs(rq.y - (q.y + q.h / 2)) < Math.abs(rq.x - (q.x + q.w / 2)) * 0.9) {
    const ex = side > 0 ? q.x + q.w : q.x;
    const cy = clamp(rq.y, q.y + 0.9 * F, q.y + q.h - 0.9 * F);
    base = {x: ex, y: cy}; a1 = {x: ex, y: cy - 0.6 * F}; a2 = {x: ex, y: cy + 0.6 * F}; seam = 'v';
  } else {
    const cx = clamp(rq.x, q.x + 1.2 * F, q.x + q.w - 1.2 * F);
    const by = rq.y > q.y + q.h / 2 ? q.y + q.h : q.y;
    base = {x: cx, y: by}; a1 = {x: cx - 0.7 * F, y: by}; a2 = {x: cx + 0.7 * F, y: by}; seam = 'h';
  }
  const dd = Math.hypot(rq.x - base.x, rq.y - base.y) || 1;
  const tl = Math.min(1.6 * F, dd * 0.4);
  const tip = {x: base.x + (rq.x - base.x) / dd * tl, y: base.y + (rq.y - base.y) / dd * tl};
  const tail = `M${r(a1.x)} ${r(a1.y)}L${r(tip.x)} ${r(tip.y)}L${r(a2.x)} ${r(a2.y)}Z`;
  const cx = base.x, by = base.y;
  return g({name: 'request-card'},
    h('path', {d: roundRectPath(q.x + 6, q.y + 8, q.w, q.h, 18), fill: th.shadow}),
    h('path', {d: tail, fill: th.card, stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(q.x, q.y, q.w, q.h, 18), fill: th.card, stroke: INK, 'stroke-width': 2.6}),
    seam === 'h' ? h('line', {x1: r(cx - 0.55 * F), x2: r(cx + 0.55 * F), y1: r(by), y2: r(by), stroke: th.card, 'stroke-width': 5})
      : h('line', {x1: r(cx), x2: r(cx), y1: r(by - 0.45 * F), y2: r(by + 0.45 * F), stroke: th.card, 'stroke-width': 5}),
    g({name: 'request-text', opacity: 0},
      q.head ? textBlockAt(q.head, q.x + 0.7 * F, q.y + 0.6 * F, th.accent2 || INK, 'request-label') : null,
      showText ? textBlockAt(q.fit, q.x + 0.7 * F, q.y + 0.6 * F + q.headH, INK)
        : [0, 1].map(i => h('rect', {x: r(q.x + 0.7 * F), y: r(q.y + 0.7 * F + i * 0.9 * F), width: r((q.w - 1.4 * F) * (i ? 0.5 : 0.85)), height: r(0.4 * F), rx: r(0.2 * F), fill: th.paperLine}))),
  );
}

/** Reading desk (top, apron, legs). */
function deskNode(ctx, L) {
  const th = ctx.theme;
  const {desk: d, F} = L;
  const top = 0.9 * F, apron = 0.8 * F;
  const wood = th.woodTop || '#c8955e';
  return g({name: 'desk'},
    h('ellipse', {cx: r(d.x + d.w / 2 + 6), cy: r(d.y + d.h), rx: r(d.w * 0.52), ry: r(0.45 * F), fill: th.shadow}),
    h('path', {d: `M${r(d.x + 0.6 * F)} ${r(d.y)}H${r(d.x + d.w - 0.6 * F)}L${r(d.x + d.w)} ${r(d.y + top)}H${r(d.x)}Z`, fill: shade(wood, 0.1), stroke: INK, 'stroke-width': 2.6, 'stroke-linejoin': 'round'}),
    h('path', {d: roundRectPath(d.x, d.y + top, d.w, apron, 3), fill: shade(wood, -0.12), stroke: INK, 'stroke-width': 2.4}),
    h('path', {d: roundRectPath(d.x + 0.5 * F, d.y + top + apron, 0.7 * F, d.h - top - apron, 2), fill: shade(wood, -0.2), stroke: INK, 'stroke-width': 2.2}),
    h('path', {d: roundRectPath(d.x + d.w - 1.2 * F, d.y + top + apron, 0.7 * F, d.h - top - apron, 2), fill: shade(wood, -0.2), stroke: INK, 'stroke-width': 2.2}),
  );
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const tries = [];
    let L = null, first = null;
    for (let S = 24; S >= 16.05 - 1e-9; S = S - 0.5 < 16.05 && S > 16.05 ? 16.05 : S - 0.5) {
      const nv = Array.isArray(PLAN[ctx.view.shape]) ? PLAN[ctx.view.shape].length : 1;
      for (let v = 0; v < nv; v++) {
        L = tryLayout(ctx, S, v, true);
        if (!first) first = L;
        if (L.ok) break;
        tries.push(`${S}/${v}:${L.problems.join('+')}`);
      }
      if (L.ok) break;
    }
    // the final layout at the chosen size and plan, with the labels actually shown
    if (!(ctx.show('all') && ctx.show('key'))) { const ok = L.ok, pr = L.problems; L = tryLayout(ctx, L.Spx, L.variant); L.ok = ok; L.problems = pr; }
    L.tries = tries.slice(-3);
    // arc fraction of the route's last edge point (the marker stops on the last element's edge)
    const pts = L.route.poly.pts;
    let acc = 0;
    for (let i = 1; i < pts.length - 1; i++) acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    L.tEnd = pts.length > 2 && L.route.poly.total > 0 ? acc / L.route.poly.total : 1;
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const showText = ctx.show('all');
    const byId = {requester: L.people[0], assistant: L.people[1], request: L.request, piece: L.piece, slot: L.slot, desk: L.desk};
    return g(null,
      deskNode(ctx, L),
      cabinetNode(ctx, L, showText),
      L.graph.node,
      L.people.map(q => q.b.node),
      requestNode(ctx, L, showText),
      pieceNode(ctx, L, showText),
      g({name: 'rings'}, L.route.visits.map((v, i) => {
        const e = byId[v.id];
        const node = e.circle
          ? h('circle', {cx: r(e.circle.x), cy: r(e.circle.y), r: r(e.circle.r + 10), fill: 'none', stroke: th.accent, 'stroke-width': 4})
          : h('path', {d: roundRectPath(e.x - 8, e.y - 8 - (v.id === 'piece' ? L.Mp.tabP : 0), e.w + 16, e.h + 16 + (v.id === 'piece' ? L.Mp.tabP : 0), 14), fill: 'none', stroke: th.accent, 'stroke-width': 4});
        return g({name: `ring${i}`, opacity: 0}, node);
      })),
      L.relLabels.map(l => l.node),
      g({name: 'chips', opacity: 0}, L.chips.filter(c => c.id !== 'requester' && c.id !== 'assistant').map(c => c.node)),
      L.chips.filter(c => c.id === 'requester' || c.id === 'assistant').map(c => c.node),
      L.stateChip ? g({name: 'state', opacity: 0}, L.stateChip.node) : null,
      L.graph.tracerNode('tracer'),
      g({name: 'legend', opacity: 0}, L.legendNodes),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const byId = {requester: L.people[0], assistant: L.people[1], request: L.request, piece: L.piece, slot: L.slot, desk: L.desk};
    // 1) separate: the piece slides out of its compartment to its exploded place; the bubble grows out of the requester
    const sl = ease.inOutCubic(seg(u, ...W.slide));
    const pc = L.piece, sb = L.slotBox;
    const k0 = L.Mc.W / pc.w;
    const from = {x: sb.x + 0.15 * L.F, y: sb.y + L.Mc.tabP};
    const kk = lerp(k0, 1, sl);
    const tx = lerp(from.x, pc.x, sl), ty = lerp(from.y, pc.y, sl);
    nodes['piece-card'] = {transform: `${T(tx - pc.x * kk, ty - pc.y * kk)} scale(${r(kk, 4)})`, opacity: sl > 0 ? 1 : 0};
    // the strip in the slot: gone as soon as the card leaves; it is back (state) during the gather
    const st = seg(u, ...W.state);
    nodes['slot-piece'] = {opacity: r(sl > 0 ? st : 1, 3)};
    nodes['slot-empty'] = {opacity: r(sl > 0 ? 1 - st : 0, 3)};
    const rq = L.people[0].c, qc = {x: L.request.x + L.request.w / 2, y: L.request.y + L.request.h / 2};
    const bs = lerp(0.2, 1, sl);
    nodes['request-card'] = {transform: `${T((rq.x - qc.x) * (1 - sl), (rq.y - qc.y) * (1 - sl))} ${scaleAbout(qc.x, qc.y, bs)}`, opacity: r(clamp(sl * 3), 3)};
    // texts on a card that is still growing appear only once they are drawn at ≥ 16 px (1080p)
    const big = sc => (sc >= 0.999 ? 1 : L.Spx * sc < 16.05 ? 0 : clamp((L.Spx * sc - 16.05) / Math.max(0.05, (L.Spx - 16.05) * 0.4)));
    nodes['piece-txt'] = {opacity: r(big(kk), 3)};
    if (L.piece.head) nodes['piece-label-g'] = {opacity: r(big(kk), 3)};
    nodes['request-text'] = {opacity: r(seg(u, ...W.text) * big(bs), 3)};
    nodes.chips = {opacity: r(seg(u, ...W.text), 3)};
    // 2) relate: connectors drawn one by one; each label appears as its line completes
    const n = L.graph.conns.length;
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, n);
    const drawn = L.graph.conns.map((x, i) => seg(u, W.relate[0] + i * span, W.relate[0] + (i + 0.85) * span));
    const gf = L.graph.frame(i => drawn[i]);
    for (const key of Object.keys(gf)) if (!/-lg\d+$/.test(key)) nodes[key] = gf[key];
    for (const l of L.relLabels) nodes[`rl${l.i}`] = {opacity: r(clamp((drawn[l.i] - 0.55) / 0.45), 3)};
    // 3) trace: the marker follows the traversal order; the element reached is ringed; the focus element enlarges
    const tpv = ease.inOutSine(seg(u, ...W.trace)) * L.tEnd;
    const pt = L.route.poly.at(tpv);
    const visible = u >= W.trace[0] - 0.02;
    const endFade = 1 - seg(u, W.trace[1], W.trace[1] + 0.04);
    nodes.tracer = {transform: T(pt.x, pt.y), opacity: visible ? r(endFade, 3) : 0};
    const visitOrder = [];
    const ringsVisible = [];
    L.route.visits.forEach((v, i) => {
      const reached = visible && tpv >= Math.min(v.t, L.tEnd) - 1e-6;
      if (reached) visitOrder.push(v.id);
      const next = L.route.visits[i + 1];
      const current = reached && (!next || tpv < Math.min(next.t, L.tEnd) - 1e-6);
      nodes[`ring${i}`] = {opacity: current ? r(endFade, 3) : 0};
      if (current && endFade > 0) ringsVisible.push(v.id);
    });
    let focusScale = 1;
    const fv = L.route.visits.find(v => v.id === p.focusElement);
    const fe = byId[p.focusElement];
    if (fv && fe) {
      const xv = Math.acos(1 - 2 * clamp(Math.min(fv.t, L.tEnd) / L.tEnd)) / Math.PI;
      const uv = W.trace[0] + xv * (W.trace[1] - W.trace[0]);
      const up = ease.inOutSine(seg(u, uv - 0.05, uv)) * (1 - ease.inOutSine(seg(u, uv + 0.07, uv + 0.13)));
      focusScale = 1 + 0.16 * up;
      const cx = fe.circle ? fe.circle.x : fe.x + fe.w / 2, cy = fe.circle ? fe.circle.y : fe.y + fe.h / 2;
      L.route.visits.forEach((v, i) => {
        if (v.id === p.focusElement) nodes[`ring${i}`] = {...nodes[`ring${i}`], transform: focusScale !== 1 ? scaleAbout(cx, cy, focusScale) : ''};
      });
      const S = focusScale !== 1 ? scaleAbout(cx, cy, focusScale) : '';
      if (fe.circle) nodes[`pb-${p.focusElement}-body`] = {transform: focusScale !== 1 ? scaleAbout(0, 0, focusScale) : ''};
      else if (p.focusElement === 'piece') nodes['piece-card'] = {...nodes['piece-card'], transform: `${S} ${nodes['piece-card'].transform}`.trim()};
      else if (p.focusElement === 'request') nodes['request-card'] = {...nodes['request-card'], transform: `${S} ${nodes['request-card'].transform}`.trim()};
      else if (p.focusElement === 'desk') nodes.desk = {transform: S};
      else if (p.focusElement === 'slot') nodes['slot-piece'] = {...nodes['slot-piece'], transform: S};
    }
    // 4) gather: state and legend
    if (L.stateChip) nodes.state = {opacity: r(st, 3)};
    nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const gaps = [];
    for (const x of L.graph.conns) {
      for (const [id, q] of [[x.rel.from, x.c.from], [x.rel.to, x.c.to]]) {
        const e = L.elements[id];
        const d = e.circle
          ? Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r)
          : Math.min(Math.abs(q.x - e.box.x), Math.abs(q.x - (e.box.x + e.box.w)), Math.abs(q.y - e.box.y), Math.abs(q.y - (e.box.y + e.box.h)));
        gaps.push(r(d, 1));
      }
    }
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sl, 3),
        pieceOut: sl > 0,
        pieceShownInSlot: r(sl > 0 ? st : 1, 3),
        stateShown: r(st, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracer: {x: r(pt.x), y: r(pt.y)},
        tracerVisible: visible,
        visitOrder,
        focusScale: r(focusScale, 3),
        connectorGaps: gaps,
        arrows: L.graph.conns.map(x => ({kind: x.rel.kind, arrow: Boolean(LINK_STYLES[x.rel.kind].arrow)})),
        // every connector that involves the slot ends level with the supplied slot's own row (at its open end)
        slotEndsInRow: L.graph.conns.filter(x => x.rel.from === 'slot' || x.rel.to === 'slot').map(x => {
          const q = x.rel.to === 'slot' ? x.c.to : x.c.from;
          return q.y >= L.slotBox.y && q.y <= L.slotBox.y + L.slotBox.h && q.x <= L.cab.x + 1;
        }),
        relLabelCount: L.relLabels.length, relLabelMaxDist: L.relLabels.length ? Math.max(...L.relLabels.map(l => l.dist)) : 0,
        relLabelsUnambiguous: L.relLabels.every(l => l.dist <= REL_NEAR && (l.others === null || l.others >= l.dist + REL_MARGIN)),
        labelsOffConnectors: L.labelsOffConnectors, connectorsClearOfChips: L.connectorsClearOfChips, crossings: L.crossings, minConn: L.minConn, connLens: L.connLens,
        nameTexts: L.nameTexts, ringsVisible, tracerShown: visible && endFade > 0,
        legendShown: r(seg(u, ...W.legend), 3),
        labelsFit: L.ok, layoutProblems: L.problems, layoutTries: L.tries, textPx: r(L.Spx, 1),
      },
    };
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-09-mechanism',
    title: 'Case-file consultation — the request, the numbered tab and the slot, taken apart',
    titleEs: 'Consulta de expediente por auxiliar — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta de expediente por auxiliar',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded plan of a fictional case-file consultation: the requester and the assistant as badges, the request bubble, the requested piece pulled out of its numbered compartment, the reading desk and the slot. Only the supplied relationships are drawn, styled by kind (a plain relation — tab number = plate number — never gets an arrow); a marker follows the traversal order and the focus element enlarges as it passes; the piece is shown back in its numbered slot as supplied. Legend of kinds and a neutral key; no consequence of misfiling is drawn.',
    tags: ['case file', 'court assistant', 'mechanism', 'numbered tab', 'numbered slot', 'request', 'relations', 'sequence', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-de-expediente.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
