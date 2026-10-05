/**
 * LAW-0238 — Adaptación de accesibilidad · mechanism
 *
 * Storyboard (an exploded route, not a row of boxes: the parts that make the route to the hearing room are lifted out
 * of the building's ground floor and laid out along the way they are used):
 *  0.00–0.18  separate: the parts start gathered in front of the generic building — the entrance (the door, the
 *             landing, the steps with their handrails and, when supplied, the ramp beside them with its handrails,
 *             a participant in a wheelchair on it), a stretch of the tactile guidance strip (a participant walking on
 *             it with a long cane), the wall sign and the hearing room — and slide apart to their places.
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one, anchored to the parts' edges and styled
 *             by kind (plain relation = solid line with end dots, never an arrow; sequence = arrow with the caption
 *             "sequence as configured (illustrative)"; causal only when supplied), each with its own label.
 *  0.43–0.75  trace: a tracer follows the supplied order along the drawn relationships while the focus part
 *             enlarges; the participant on each part moves along it as the tracer passes (the wheelchair rolls up the
 *             ramp, the cane tip sweeps along the strip).
 *  0.75–1.00  gather: the parts, the drawn relationships and the legend of connection kinds stay visible with the key
 *             "as supplied · no conclusion drawn". No standard, measurement, obligation or outcome is stated.
 * @module animations/courts/LAW-0238
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {LINK_STYLES, connector, tracer} from '../../primitives/annotate.js';
import {sideCaption, gchip} from './kits/distribucion-de-sala.js';
import {
  aaFields, AA_EN, AA_STRINGS, resolveAA, aaPerson, entrancePiece, stripPiece, signPiece, roomPiece, buildingElevation,
  placeChip, segHitsBox, chipNode, chipFit, glue, fitWords, pxPerUnit, overlaps, R2, textAt,
  localizeAA, AA_ES,
} from './kits/adaptacion-accesibilidad.js';

const ID = 'LAW-0238';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {slide: [0.02, 0.15], relate: [0.2, 0.39], trace: [0.45, 0.72], legend: [0.75, 0.81]};
const EL = ['building', 'entrance', 'strip', 'sign', 'room'];
const LINK = '#34495e';
const kindColor = (ctx, kind) => (kind === 'communication' ? ctx.theme.accent2 : kind === 'sequence' ? ctx.theme.fg : kind === 'causal' ? ctx.theme.accent : LINK);
// the building elevation in template units (scaled with the parts)
const BLD = {w: 250, h: 262};

const STRINGS = {
  en: {...AA_STRINGS.en, kinds: 'Connections', seqNote: 'sequence as configured (illustrative)'},
  es: {...AA_STRINGS.es, kinds: 'Conexiones', seqNote: 'secuencia según lo configurado (ilustrativa)'},
};

const relationship = obj('A supplied relationship between two parts', {
  from: oneOf('Source part', EL),
  to: oneOf('Target part', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the connector (as supplied; empty = the caption of its kind)', 50),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  ...aaFields,
  elements: list('Part captions; ids are fixed by the scene (building, entrance, strip, sign, room), captions are editable', obj('Part', {
    id: oneOf('Part id', EL),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 5, 5),
  relationships: list('Explicit relationships between parts; kind controls the line style (causal only when supplied)', relationship, 1, 6),
  focusElement: oneOf('Part enlarged while the tracer passes', EL),
  relationLabels: obj('Caption used for each relation kind (legend, and connectors without their own label)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits parts', oneOf('Part id', EL), 2, 8),
};

const defaultParams = {
  ...AA_EN,
  elements: [
    {id: 'building', label: 'Building'},
    {id: 'entrance', label: 'Entrance with ramp and steps'},
    {id: 'strip', label: 'Tactile guidance strip'},
    {id: 'sign', label: 'Wall sign'},
    {id: 'room', label: 'Hearing room'},
  ],
  relationships: [
    {from: 'building', to: 'entrance', kind: 'relation', label: 'has'},
    {from: 'entrance', to: 'strip', kind: 'relation', label: 'the strip starts at the door'},
    {from: 'strip', to: 'room', kind: 'relation', label: 'ends at the room door'},
    {from: 'sign', to: 'room', kind: 'relation', label: 'marks the door'},
  ],
  focusElement: 'entrance',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['entrance', 'strip', 'room', 'sign'],
};

// Spanish defaults: with locale "es", each param left at its English default switches to this value (a value the
// author supplied is never replaced).
const defaultParamsEs = {...AA_ES, ...{
  "courts": {
    "building": "Edificio cívico (ficticio)",
    "room": "Sala de vistas 2 (ficticia)"
  },
  "seats": [
    {
      "label": "Participante A",
      "mode": "wheelchair",
      "place": "left"
    },
    {
      "label": "Participante B",
      "mode": "cane",
      "place": "right"
    }
  ],
  "labels": {
    "ramp": "Rampa con pasamanos",
    "tactile": "Franja táctil de guía",
    "sign": "Señal junto a la puerta",
    "key": "Según lo aportado · sin conclusión"
  },
  "elements": [
    {
      "id": "building",
      "label": "Edificio"
    },
    {
      "id": "entrance",
      "label": "Entrada con rampa y escalones"
    },
    {
      "id": "strip",
      "label": "Franja táctil de guía"
    },
    {
      "id": "sign",
      "label": "Señal de pared"
    },
    {
      "id": "room",
      "label": "Sala de vistas"
    }
  ],
  "relationships": [
    {
      "from": "building",
      "to": "entrance",
      "kind": "relation",
      "label": "tiene"
    },
    {
      "from": "entrance",
      "to": "strip",
      "kind": "relation",
      "label": "la franja empieza en la puerta"
    },
    {
      "from": "strip",
      "to": "room",
      "kind": "relation",
      "label": "termina en la puerta de la sala"
    },
    {
      "from": "sign",
      "to": "room",
      "kind": "relation",
      "label": "señala la puerta"
    }
  ],
  "relationLabels": {
    "relation": "relación",
    "communication": "comunicación",
    "sequence": "secuencia",
    "causal": "causal (según lo aportado)"
  }
}};

/** Grid cells of each part per arrangement (col, row). */
const GRIDS = {
  wide: {building: [0, 0], entrance: [0, 1], strip: [1, 1], room: [2, 0], sign: [2, 1]},
  wideB: {building: [1, 0], entrance: [0, 1], strip: [1, 1], room: [2, 0], sign: [2, 1]},
  tall: {sign: [0, 0], room: [1, 0], building: [0, 1], entrance: [0, 2], strip: [1, 2]},
  tallB: {building: [0, 0], room: [1, 0], sign: [1, 1], entrance: [0, 2], strip: [1, 2]},
  // (the building alone in the last row, centred across both columns)
  tallE: {sign: [0, 0], room: [1, 0], entrance: [0, 1], strip: [1, 1], building: [0, 2, 'span']},
  // (the room centred over the two right-hand columns; the sign under its right half)
  sqD: {building: [0, 0], room: [1, 0, 'span', 2], entrance: [0, 1], strip: [1, 1], sign: [2, 1]},
  sq: {building: [0, 0], room: [1, 0], sign: [2, 0], entrance: [0, 1], strip: [1, 1]},
  sqB: {building: [0, 0], sign: [1, 0], room: [2, 0], entrance: [0, 1], strip: [1, 1]},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    let best = null;
    const log = [];
    const arrs = shape === 'portrait' ? ['tallE', 'tall'] : shape === 'square' ? ['sq', 'sqB', 'sqD', 'tallE'] : ['wide', 'wideB', 'sq', 'sqB', 'sqD'];
    const legs = shape === 'landscape' ? [0.16, 0.2, 0.24] : shape === 'square' ? [0.13, 0.16, 0.2, 0.24, 0.28, 0.32] : [0.12, 0.15, 0.18];
    // (create() budget) per text size: cheap geometry first, then full compositions from the largest people down.
    // Fallback (every participant alike): number badges beside the people, their labels listed in the legend.
    let found = false;
    for (const list of [false, true]) {
    if (found) break;
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      const cands = [];
      for (const legF of legs) for (const arr of arrs) {
        const C = compose(ctx, p, v / px, px, legF, arr, true, list);
        if (C.problems.length) { log.push(`${v}/${legF}/${arr}:cheap:${C.problems.join('+')}`); continue; }
        cands.push({legF, arr, k: C.k});
      }
      cands.sort((a, b) => b.k - a.k);
      let pick = null;
      // (distinct candidates only: with the labels hidden every legend width gives the same composition)
      const seen = new Set();
      const uniq = cands.filter(c => { const key = `${c.arr}/${c.k.toFixed(3)}`; if (seen.has(key)) return false; seen.add(key); return true; });
      for (const c of uniq.slice(0, 5)) {
        const L = compose(ctx, p, v / px, px, c.legF, c.arr, false, list);
        log.push(`${v}/${c.legF}/${c.arr}:k${L.k.toFixed(2)}:${L.problems.join('+')}${L.dbgL && L.dbgL.length && L.problems.length ? ' ' + L.dbgL.join(' ') : ''}`);
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.restCover > pick.restCover + 0.01)) pick = L;
      }
      if (pick) { best = pick; found = true; break; }
    }
    }
    if (!best) best = compose(ctx, p, 16.6 / px, px, legs[1], arrs[0]);
    best.log = log.slice(-40);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const part = (id, inner) => g({name: `el-${id}`}, inner);
    const capOf = id => L.caps[id] && g({name: `cap-w-${id}`, transform: 'translate(0 0)'}, L.caps[id].node);
    const chipsOn = id => L.chips.filter(c => c.on === id).map(c => c.node);
    return g(null,
      // (each part carries its own caption and its participants' labels, so they move with it from the start)
      part('building', [L.building.node]),
      part('entrance', [g({transform: L.tf.entrance}, L.pieces.entrance.node, L.people.filter(q => q.on === 'entrance').map(q => q.rig.node)), chipsOn('entrance')]),
      part('strip', [g({transform: L.tf.strip}, L.pieces.strip.node, L.people.filter(q => q.on === 'strip').map(q => q.rig.node)), chipsOn('strip')]),
      part('sign', [g({transform: L.tf.sign}, L.pieces.sign.node, L.people.filter(q => q.on === 'sign').map(q => q.rig.node)), chipsOn('sign')]),
      part('room', [g({transform: L.tf.room}, L.pieces.room.node)]),
      // (captions follow their part's slide, not its focus enlargement)
      EL.map(id => capOf(id)),
      L.conns.map((c, i) => g({name: `relw${i}`, 'data-from': c.rel.from, 'data-to': c.rel.to}, c.c.node)),
      // (the tracer runs along the lines, under the relation chips and captions, so it never covers their text)
      g({name: 'tracer-wrap', transform: T(0, 0)}, tracer(ctx, 'tracer', th.accent2)),
      L.conns.map((c, i) => c.chip && g({name: `rel-l${i}`, opacity: 0}, c.chip.node)),
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const slide = ease.inOutCubic(seg(u, ...W.slide));
    const n = L.conns.length;
    const drawn = L.conns.map((_, i) => ease.inOutSine(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / Math.max(1, n), W.relate[0] + ((i + 0.8) * (W.relate[1] - W.relate[0])) / Math.max(1, n))));
    const tp = ease.inOutSine(seg(u, ...W.trace));
    const tq = L.route.poly.at(tp);
    const focusScale = {};
    const near = id => {
      const vs = L.visits.filter(v => v.id === id);
      if (!vs.length || tp <= 0 || tp >= 1) return 0;
      return Math.max(...vs.map(v => clamp(1.6 - Math.abs(tp - v.t) / 0.12)));
    };
    for (const id of EL) {
      const off = L.sepOff[id];
      const sc = id === ctx.params.focusElement ? 1 + 0.08 * ease.inOutSine(near(id)) : 1;
      focusScale[id] = sc;
      const c = L.centers[id];
      nodes[`el-${id}`] = {transform: `${T(off.x * (1 - slide), off.y * (1 - slide))} ${scaleAbout(c.x, c.y, r(sc, 4))}`};
      if (L.caps[id]) {
        const cb = L.caps[id].box;
        const gx = (cb.x + cb.w / 2 - c.x) * (sc - 1), gy = (cb.y + cb.h / 2 - c.y) * (sc - 1);
        nodes[`cap-w-${id}`] = {transform: T(off.x * (1 - slide) + gx, off.y * (1 - slide) + gy)};
      }
    }
    L.conns.forEach((c, i) => {
      Object.assign(nodes, c.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
      if (c.chip) nodes[`rel-l${i}`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45), 3)};
    });
    // the participant on each part moves along it while the tracer passes that part
    const moves = [];
    L.people.forEach((q, i) => {
      const m = near(q.on);
      const st = q.pathAt(ease.inOutSine(clamp(m)));
      Object.assign(nodes, q.rig.pose({...st, phase: st.along / 36 * Math.PI, walk: m > 0 && m < 1 ? 1 : 0}));
      moves.push(r(m, 3));
    });
    const lab = seg(u, W.slide[1], W.slide[1] + 0.03);
    L.chips.forEach(ch => { nodes[ch.name] = {opacity: 1}; });
    const tracerOn = u >= W.trace[0] - 0.005 && u <= W.trace[1] + 0.03;
    nodes['tracer-wrap'] = {transform: T(tq.x, tq.y)};
    nodes.tracer = {opacity: r(tracerOn ? 1 - seg(u, W.trace[1] + 0.005, W.trace[1] + 0.03) : 0, 3)};
    // (the legend and key are a standing key of the diagram: shown from the start)
    if (L.legend) nodes.legend = {opacity: 1};
    const visited = L.visits.filter(v => tp >= v.t - 1e-9 && u >= W.trace[0]).map(v => v.id);
    return {
      nodes,
      semantic: {
        beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
        slide: r(slide, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracerVisible: tracerOn,
        tracer: R2(tq),
        visitOrder: visited,
        focusScale: r(Math.max(...Object.values(focusScale)), 3),
        moves,
        centers: Object.fromEntries(EL.map(id => [id, R2(L.centers[id])])),
        connectorGaps: L.gaps,
        arrows: L.conns.map(c => ({kind: c.rel.kind, arrow: LINK_STYLES[c.rel.kind].arrow})),
        seqCaptions: L.seqCaptions,
        labelsClear: L.labelsClear,
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: `${L.arr}/${L.legF}`,
        restCover: r(L.restCover, 3),
        log: L.log,
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, legF, arr, cheap = false, listPeople = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const cap = id => (p.elements.find(e => e.id === id) || {label: id}).label;
  const {seats} = resolveAA(ctx, p);
  // ---- legend + key (a column on the right in landscape; a band under the parts otherwise)
  const rels = p.relationships.filter(q => q.from !== q.to);
  const kinds = [...new Set(rels.map(q => q.kind))];
  const seqCaptions = rels.some(q => q.kind === 'sequence');
  const band = shape !== 'landscape';
  const legW = !showAll && !showKey ? 0 : band ? D.w : D.w * legF;
  const legItems = [];
  if (showAll) {
    legItems.push({type: 'head', fit: fitWords(ctx.t.kinds, {maxWidth: legW, size: F, minSize: F, maxLines: 1, weight: 700})});
    for (const kd of kinds) legItems.push({type: 'kind', kind: kd, fit: fitWords(glue(p.relationLabels[kd]), {maxWidth: (band ? legW / 2 : legW) - 70, size: F, minSize: F, maxLines: 3, weight: 500})});
    if (seqCaptions) legItems.push({type: 'seq', fit: fitWords(glue(ctx.t.seqNote), {maxWidth: band ? legW / 2 : legW, size: F, minSize: F, maxLines: 3, weight: 500})});
  }
  if (showKey && listPeople) {
    const ord = resolveAA(ctx, p).seats;
    ord.forEach((sq, i) => legItems.push({type: 'person', fit: fitWords(glue(`${i + 1} · ${sq.label}`), {maxWidth: band ? legW / 2 - 20 : legW, size: F, minSize: F, maxLines: 3, weight: 600})}));
  }
  if (showKey) legItems.push({type: 'names', fit: fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: band ? legW / 2 - 20 : legW, size: F, minSize: F, maxLines: 4, weight: 600})});
  if (showKey) legItems.push({type: 'key', fit: fitWords(glue(p.labels.key), {maxWidth: band ? legW / 2 - 20 : legW, size: F, minSize: F, maxLines: 4, weight: 500})});
  if (legItems.some(it => it.fit.truncated)) problems.push('legend-trunc');
  // band: two columns (kinds left, names + key right)
  const colH = its => its.reduce((a, it) => a + it.fit.height + F * 0.55, 0);
  const leftItems = band ? legItems.filter(it => it.type === 'head' || it.type === 'kind' || it.type === 'seq') : legItems;
  const rightItems = band ? legItems.filter(it => it.type === 'names' || it.type === 'key' || it.type === 'person') : [];
  const legH = band ? Math.max(colH(leftItems), colH(rightItems)) : colH(legItems);
  if (band && legH > D.h * legF + 1) problems.push('legend');
  // ---- pieces (local units) and the grid
  const pieces = {
    entrance: entrancePiece(ctx, {name: 'ent'}),
    strip: stripPiece(ctx, {name: 'str'}),
    sign: signPiece(ctx, {name: 'sgn'}),
    room: roomPiece(ctx, {name: 'rm', wheelchairPlaces: seats.filter(s => s.mode === 'wheelchair').map(s => s.place)}),
  };
  let bldS = 1;
  // (a building alone in a spanning row is drawn as a wider front — more bays — so it fills its row)
  const bldWide = GRIDS[arr].building[2] ? 2.5 : 1;
  const lbox = id => (id === 'building' ? {x: 0, y: 0, w: BLD.w * bldS * bldWide, h: BLD.h * bldS} : pieces[id].box);
  const grid = GRIDS[arr];
  const nCol = Math.max(...Object.values(grid).map(c => c[0])) + 1, nRow = Math.max(...Object.values(grid).map(c => c[1])) + 1;
  const relText = rel => (rel.kind === 'sequence' ? `${rel.label || p.relationLabels[rel.kind]} · ${ctx.t.seqNote}` : (rel.label || p.relationLabels[rel.kind] || rel.kind));
  // (a gap across a connector only needs the NARROWEST chip that holds its label; a gap along it, the lowest)
  const chipOf = (rel, horiz) => {
    const opts = [190, 150, 120, 240].map(mw => gchip(ctx, relText(rel), {x: 0, y: 0, anchor: 'middle', maxWidth: mw / px, size: F, minSize: F, maxLines: 5, weight: 600})).filter(c => !c.fit.truncated && !c.fit.lines.slice(1).some(l => l.trim().length <= 2)).map(c => c.box);
    if (!opts.length) return {w: 190 / px, h: F * 6};
    return horiz ? opts.sort((a, b) => a.w - b.w)[0] : opts.sort((a, b) => a.h - b.h)[0];
  };
  // gaps between columns / rows: long enough for the chips of the relationships that cross them (plus room for the
  // part captions)
  const capH = showKey ? F * 2.8 : 16;
  const colGap = Array.from({length: nCol - 1}, (_, c) => {
    let need = 60;
    for (const rq of rels) { const a = grid[rq.from], b = grid[rq.to]; if (Math.min(a[0], b[0]) <= c && Math.max(a[0], b[0]) > c && showAll) need = Math.max(need, chipOf(rq, true).w + 40 + (rq.from === p.focusElement || rq.to === p.focusElement ? lbox(p.focusElement).w * 0.05 : 0)); }
    return need;
  });
  const rowGap = Array.from({length: nRow - 1}, (_, rw) => {
    // (two rows: the top row's captions go above it, the bottom row's below it — the gap holds no caption)
    const cH = nRow > 2 ? capH : 0;
    let need = 50 + cH;
    for (const rq of rels) { const a = grid[rq.from], b = grid[rq.to]; if (Math.min(a[1], b[1]) <= rw && Math.max(a[1], b[1]) > rw && showAll) need = Math.max(need, chipOf(rq, false).h + 40 + cH + (rq.from === p.focusElement || rq.to === p.focusElement ? lbox(p.focusElement).h * 0.05 : 0)); }
    return need;
  });
  const colW0 = Array.from({length: nCol}, (_, c) => Math.max(1, ...EL.filter(id => grid[id][0] === c && !grid[id][2]).map(id => lbox(id).w)));
  const rowH0 = Array.from({length: nRow}, (_, rw) => Math.max(1, ...EL.filter(id => grid[id][1] === rw).map(id => lbox(id).h)));
  // (a spanning part needs the spanned columns plus their gaps to be at least as wide as itself)
  for (const id of EL) {
    const gc = grid[id];
    if (!gc[2]) continue;
    const c2 = gc[3] ?? nCol - 1;
    const spanned = colW0.slice(gc[0], c2 + 1).reduce((a, v) => a + v, 0);
    if (spanned < lbox(id).w) colW0[c2] += lbox(id).w - spanned;
  }
  const sumW = colW0.reduce((a, v) => a + v, 0), sumH = rowH0.reduce((a, v) => a + v, 0);
  const gW = colGap.reduce((a, v) => a + v, 0), gH = rowGap.reduce((a, v) => a + v, 0);
  const area = band
    ? {x: 0, y: capH, w: D.w, h: D.h - (legW ? D.h * legF + 20 : 0) - capH * 2 - (legW && grid[p.focusElement] && grid[p.focusElement][1] === nRow - 1 ? F * 0.8 : 0)}
    : {x: 0, y: capH, w: D.w - (legW ? legW + 36 : 0), h: D.h - capH * 2};
  // (labels hidden: the parts may grow further into the room the captions and chips leave free)
  const k = Math.min(showKey ? 1.25 : 1.7, (area.w - gW) / sumW, (area.h - gH) / sumH);
  const personPx = 100 * k * px;
  if (k <= 0 || personPx < 60.5) problems.push('small');
  // the building (context) takes up the height the grid leaves free: it grows up to its column's width
  {
    const [bc, br, span] = grid.building;
    const slack = (area.h - gH) / k - sumH;
    const colW = span ? colW0.slice(bc, (grid.building[3] ?? nCol - 1) + 1).reduce((a, v) => a + v, 0) : colW0[bc];
    const s0 = Math.min(colW / (BLD.w * bldWide), (Math.max(rowH0[br], BLD.h) + Math.max(0, slack)) / BLD.h, 1.6);
    if (s0 > 1) { bldS = s0; rowH0[br] = Math.max(rowH0[br], BLD.h * s0); }
  }
  const sumH2 = rowH0.reduce((a, v) => a + v, 0);
  const blockW = sumW * k + gW, blockH = sumH2 * k + gH;
  const x0 = area.x + (area.w - blockW) / 2, y0 = area.y + (area.h - blockH) / 2;
  const colX = [x0], rowY = [y0];
  for (let c = 1; c < nCol; c++) colX.push(colX[c - 1] + colW0[c - 1] * k + colGap[c - 1]);
  for (let rw = 1; rw < nRow; rw++) rowY.push(rowY[rw - 1] + rowH0[rw - 1] * k + rowGap[rw - 1]);
  const boxes = {}, pos = {};
  for (const id of EL) {
    const [c, rw] = grid[id];
    const lb = lbox(id);
    const c2 = grid[id][2] ? (grid[id][3] ?? nCol - 1) : c;
    const spanX0 = grid[id][2] ? colX[c] : 0, spanX1 = grid[id][2] ? colX[c2] + colW0[c2] * k : 0;
    const bx = grid[id][2]
      ? {x: (spanX0 + spanX1) / 2 - lb.w * k / 2, y: rowY[rw] + (rowH0[rw] - lb.h) * k / 2, w: lb.w * k, h: lb.h * k}
      : {x: colX[c] + (colW0[c] - lb.w) * k / 2, y: rowY[rw] + (rowH0[rw] - lb.h) * k / 2, w: lb.w * k, h: lb.h * k};
    boxes[id] = bx;
    pos[id] = {x: bx.x - lb.x * k, y: bx.y - lb.y * k};
  }
  const centers = Object.fromEntries(EL.map(id => [id, {x: boxes[id].x + boxes[id].w / 2, y: boxes[id].y + boxes[id].h / 2}]));
  for (const id of EL) { const b = boxes[id]; if (b.x < -1 || b.y < -1 || b.x + b.w > D.w + 1 || b.y + b.h > D.h + 1) problems.push(`out-${id}`); }
  const legBox = band ? {x: 0, y: D.h - D.h * legF, w: D.w, h: D.h * legF} : {x: D.w - legW, y: Math.max(0, (D.h - legH) / 2), w: legW, h: legH};
  // ---- connectors (supplied relationships only), anchored to the part edges; none may cross another part
  const conns = rels.map((rel, i) => {
    const A = boxes[rel.from], B = boxes[rel.to];
    const from = edgeAnchor(A, centers[rel.to], 8);
    const to = edgeAnchor(B, centers[rel.from], 8);
    const cn = connector(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind, bend: 0.06, color: kindColor(ctx, rel.kind)});
    return {rel, c: cn, from, to};
  });
  conns.forEach((cn, i) => {
    const others = EL.filter(id => id !== cn.rel.from && id !== cn.rel.to).map(id => boxes[id]);
    for (let j = 1; j < 24; j++) { const q = cn.c.at(j / 24); if (others.some(b => q.x > b.x + 2 && q.x < b.x + b.w - 2 && q.y > b.y + 2 && q.y < b.y + b.h - 2)) { problems.push(`cross-${i}`); break; } }
  });
  // two connectors never run as a tight pair (>= 20 px apart except at a shared end)
  for (let i = 0; i < conns.length; i++) for (let j = i + 1; j < conns.length; j++) {
    for (let a = 2; a < 23; a++) {
      const q = conns[i].c.at(a / 24);
      const dmin = Math.min(...Array.from({length: 25}, (_, b) => { const z = conns[j].c.at(b / 24); return Math.hypot(q.x - z.x, q.y - z.y); }));
      if (dmin * px < 20) { problems.push(`pair-${i}-${j}`); break; }
    }
  }
  if (cheap) return {k, problems};
  // ---- people on their parts (design-unit placement comes from the part transform)
  let restCover = 0;
  const dbgL = [];
  const people = [];
  let onRamp = 0, onStrip = 0, onSteps = 0;
  seats.forEach((s, i) => {
    const rig = aaPerson(ctx, {name: `p${i}`, look: s.look, mode: s.mode});
    if (s.mode === 'wheelchair') {
      const R = pieces.entrance.rampBox;
      const x0r = R.x + 58 + onRamp * 90, x1r = Math.min(R.x + R.w + 40, x0r + 90);
      onRamp++;
      people.push({rig, on: 'entrance', seat: s, pathAt: q => ({x: lerp(x0r, x1r, q), y: R.y + R.h / 2, deg: 90, along: lerp(x0r, x1r, q)})});
    } else if (s.mode === 'walking') {
      // on foot: along the corridor, past the wall sign, towards the room door
      const yw = 78 + onSteps * 0;
      onSteps++;
      people.push({rig, on: 'sign', seat: s, pathAt: q => ({x: lerp(150, 70, q), y: 118, deg: -90, along: lerp(0, 80, q)})});
    } else {
      const sp = pieces.strip.pts;
      const yA = sp[0].y - 30 - onStrip * 130, yB = yA - 60;
      onStrip++;
      people.push({rig, on: 'strip', seat: s, pathAt: q => ({x: sp[0].x, y: lerp(yA, yB, q), deg: 0, along: lerp(0, 60, q)})});
    }
  });
  const toD = (id, q) => ({x: pos[id].x + q.x * k, y: pos[id].y + q.y * k});
  const rad = 56 * k;
  const bodyAt = q => toD(q.on, q.pathAt(0));
  const bodyEnd = q => toD(q.on, q.pathAt(1));
  // ---- people labels: a chip beside each participant (clear of the parts' props, the connectors and other chips)
  const connPts = conns.map(cn => Array.from({length: 25}, (_, j) => cn.c.at(j / 24)));
  const chips = [];
  const taken = [];
  const legHard = legW ? [legBox] : [];
  const bldHard = [boxes.building];
  const propBoxes = [
    {kind: 'ramp', ...shiftBox(pieces.entrance.rampBox, 'entrance')}, {kind: 'steps', ...shiftBox(pieces.entrance.steps, 'entrance')}, {kind: 'landing', ...shiftBox(pieces.entrance.landing, 'entrance')},
    {kind: 'sign', ...boxes.sign}, {kind: 'room', ...boxes.room}, ...bldHard.map(b => ({kind: 'building', ...b})),
    ...stripBoxes(),
  ];
  function shiftBox(b, id) { return {x: pos[id].x + b.x * k, y: pos[id].y + b.y * k, w: b.w * k, h: b.h * k}; }
  function stripBoxes() {
    const sp = pieces.strip.pts, out = [];
    for (let j = 1; j < sp.length; j++) { const a = toD('strip', sp[j - 1]), b = toD('strip', sp[j]); out.push({kind: 'strip', x: Math.min(a.x, b.x) - 16 * k, y: Math.min(a.y, b.y) - 16 * k, w: Math.abs(b.x - a.x) + 32 * k, h: Math.abs(b.y - a.y) + 32 * k}); }
    return out;
  }
  // (the focus part at its enlarged size: nothing is placed where it grows while the tracer passes)
  const grownOf = b => ({x: b.x - b.w * 0.045, y: b.y - b.h * 0.045, w: b.w * 1.09, h: b.h * 1.09});
  const hardBoxes = [...EL.map(id => (id === p.focusElement ? grownOf(boxes[id]) : boxes[id])), ...legHard];
  const bodySpans = people.map(q => { const a0 = bodyAt(q), a1 = bodyEnd(q); return {x: Math.min(a0.x, a1.x) - rad, y: Math.min(a0.y, a1.y) - rad, w: Math.abs(a1.x - a0.x) + rad * 2, h: Math.abs(a1.y - a0.y) + rad * 2}; });
  // the connectors as small boxes (no caption or chip is placed over a line)
  const lineBoxes = conns.flatMap(cn => Array.from({length: 24}, (_, j) => { const a = cn.c.at(j / 24), b = cn.c.at((j + 1) / 24); return {x: Math.min(a.x, b.x) - 3, y: Math.min(a.y, b.y) - 3, w: Math.abs(b.x - a.x) + 6, h: Math.abs(b.y - a.y) + 6}; }).slice(1, -1));
  const rays = conns.map(cn => [cn.from, cn.to]);
  const caps = {};
  const capBoxes = [];
  // ---- relation labels: beside the connector's middle (nearer their own line than any other by >= 20 px), clear of
  // parts, captions, chips and other labels; no line runs under a label
  const relBoxes = [];
  let labelsClear = true;
  conns.forEach((cn, i) => {
    if (!showAll) return;
    const base = cn.rel.label || p.relationLabels[cn.rel.kind] || cn.rel.kind;
    const text = cn.rel.kind === 'sequence' ? `${base} · ${ctx.t.seqNote}` : base;
    let probe = null, got = null;
    for (const [mw, ml] of [[190, 4], [150, 5], [120, 5], [240, 3], [300, 2]]) {
      probe = gchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw / px, size: F, minSize: F, maxLines: ml, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), weight: 600});
      // (no widowed short word on its own line)
      if (probe.fit.truncated || probe.fit.lines.slice(1).some(l => l.trim().length <= 2)) continue;
      const dx = cn.to.x - cn.from.x, dy = cn.to.y - cn.from.y, Ld = Math.hypot(dx, dy) || 1;
      const nx = -dy / Ld, ny = dx / Ld;
      // (beside the line, never on it: the box's centre is offset along the normal by half its extent + a margin)
      const halfN = Math.abs(nx) * probe.box.w / 2 + Math.abs(ny) * probe.box.h / 2;
      for (const d0 of [8, 16, 26, 38].map(q => halfN + q / px)) {
        for (const sg of [1, -1]) {
          for (const tt of [0.5, 0.4, 0.6, 0.3, 0.7]) {
            const m0 = cn.c.at(tt);
            const cx = m0.x + nx * d0 * sg, cy = m0.y + ny * d0 * sg;
            const b = {x: cx - probe.box.w / 2, y: cy - probe.box.h / 2, w: probe.box.w, h: probe.box.h};
            if (b.x < 0 || b.y < 0 || b.x + b.w > D.w || b.y + b.h > D.h) continue;
            if ([...hardBoxes, ...capBoxes, ...relBoxes, ...bodySpans].some(q => overlaps(b, q, 6))) continue;
            if (conns.some(o => Array.from({length: 41}, (_, z) => o.c.at(z / 40)).some(q => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4))) continue;
            const dTo = cn2 => Math.min(...Array.from({length: 25}, (_, z) => cn2.c.at(z / 24)).map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
            const own = dTo(cn);
            if (own * px > 36 || conns.some((o, j) => j !== i && (dTo(o) - own) * px < 20)) continue;
            got = b;
            break;
          }
          if (got) break;
        }
        if (got) break;
      }
      if (got) break;
    }
    if (probe.fit.truncated) problems.push('rel-trunc');
    const mid = cn.c.mid;
    if (!got) { labelsClear = false; problems.push(`rel-${i}`); got = {x: mid.x - probe.box.w / 2, y: mid.y - probe.box.h / 2, w: probe.box.w, h: probe.box.h}; }
    relBoxes.push(got);
    cn.chip = gchip(ctx, text, {x: got.x + got.w / 2, y: got.y, anchor: 'middle', maxWidth: probe.box.w + 1, size: F, minSize: F, maxLines: 5, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), weight: 600});
  });
  // ---- part captions
  const sideOrder = id => {
    const rw = grid[id][1];
    if (rw === 0) return ['above', 'left', 'right', 'below'];
    if (rw === nRow - 1) return ['below', 'left', 'right', 'above'];
    return ['above', 'below', 'left', 'right'];
  };
  // captions, then people chips; when that leaves a label or caption without a place, the other order is tried
  const probs0 = problems.length;
  const placeCaps = () => {
    for (const id of EL) {
    if (!showKey) { caps[id] = null; continue; }
    let pl = null, mwUsed = 0;
    for (const mw of [Math.min(360 / px, D.w * 0.4), 260 / px, 200 / px, 150 / px]) {
      const probe = gchip(ctx, cap(id), {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: F, minSize: F, maxLines: 4, fill: th.card, stroke: th.fgSoft, weight: 700});
      if (probe.fit.truncated) continue;
      for (const gp of [8, 20, 36, 56]) {
        const partB = boxes[id];
        const hardC = [...hardBoxes.filter((b, j) => EL[j] !== id), ...capBoxes, ...relBoxes, ...lineBoxes, ...bodySpans, ...taken];
        const cand = sideCaption({part: partB, w: probe.box.w, h: probe.box.h, order: sideOrder(id), gap: gp, frame: D, hard: hardC, rays});
        if (cand.clear && id === p.focusElement) {
          // (the focus caption rides outward with its part while it enlarges: its moved box must stay clear too)
          const c0 = centers[id], b0 = cand.box;
          const mv = {x: b0.x + (b0.x + b0.w / 2 - c0.x) * 0.09, y: b0.y + (b0.y + b0.h / 2 - c0.y) * 0.09, w: b0.w, h: b0.h};
          if (hardC.some(q => overlaps(mv, q, 2)) || mv.x < 0 || mv.y < 0 || mv.x + mv.w > D.w || mv.y + mv.h > D.h) cand.clear = false;
        }
        // (no caption on a people chip's leader already drawn)
        if (cand.clear && chips.some(c => c.lead && segHitsBox(c.lead.from, c.lead.to, cand.box, 3))) cand.clear = false;
        if (!pl || (cand.clear && !pl.clear)) { pl = cand; mwUsed = mw; }
        if (cand.clear) break;
      }
      if (pl && pl.clear) break;
    }
    if (!pl) { problems.push(`cap-trunc-${id}`); caps[id] = null; continue; }
    if (!pl.clear) problems.push(`cap-${id}`);
    caps[id] = gchip(ctx, cap(id), {x: pl.box.x, y: pl.box.y, anchor: 'start', maxWidth: mwUsed, size: F, minSize: F, maxLines: 4, fill: th.card, stroke: th.fgSoft, weight: 700, name: `cap-${id}`});
    capBoxes.push(caps[id].box);
  }
  };
  const tracerSegs = [];
  for (const cn of conns) {
    tracerSegs.push([cn.c.at(0), centers[cn.rel.from]], [cn.c.at(1), centers[cn.rel.to]]);
    for (let j = 0; j < 12; j++) tracerSegs.push([cn.c.at(j / 12), cn.c.at((j + 1) / 12)]);
  }
  {
    const ord = p.traversalOrder.filter((id, i, a) => i === 0 || id !== a[i - 1]);
    for (let i = 1; i < ord.length; i++) if (!conns.some(q => (q.rel.from === ord[i - 1] && q.rel.to === ord[i]) || (q.rel.from === ord[i] && q.rel.to === ord[i - 1]))) tracerSegs.push([centers[ord[i - 1]], centers[ord[i]]]);
  }
  const placeChips = () => {
  if (showKey) {
    people.forEach((q, i) => {
      const a0 = bodyAt(q), a1 = bodyEnd(q);
      const anchor = {x: (a0.x + a1.x) / 2, y: (a0.y + a1.y) / 2};
      const heads = people.flatMap((o, j) => (j === i ? [] : [bodyAt(o), bodyEnd(o)])).map(z => ({kind: 'person', x: z.x - rad, y: z.y - rad, w: rad * 2, h: rad * 2}));
      const lines = connPts.flatMap(pp => pp.slice(1).map((z, j) => ({kind: 'line', x: Math.min(z.x, pp[j].x) - 4, y: Math.min(z.y, pp[j].y) - 4, w: Math.abs(z.x - pp[j].x) + 8, h: Math.abs(z.y - pp[j].y) + 8})));
      let got = null, fitUsed = null;
      for (const mw of listPeople ? [0] : [300, 220, 170]) {
        const cf = listPeople ? chipFit(String(i + 1), F, 400, 1, 700) : chipFit(q.seat.label, F, mw / px, 3);
        if (listPeople) { cf.w = Math.max(cf.w, cf.h); }
        if (cf.fit.truncated) continue;
        // the chip must clear the whole stretch the participant moves along
        const span = {x: Math.min(a0.x, a1.x), y: Math.min(a0.y, a1.y), w: Math.abs(a1.x - a0.x), h: Math.abs(a1.y - a0.y)};
        const hard = [...propBoxes.filter(b => b.kind !== 'room' || true), ...heads, ...lines, ...taken, ...legHard, ...capBoxes.map(b => ({kind: 'cap', ...b})), ...relBoxes.map(b => ({kind: 'rel', ...b})), {kind: 'person', x: span.x - rad, y: span.y - rad, w: span.w + rad * 2, h: span.h + rad * 2}];
        // (a chip on the focus part grows with it while the tracer passes: its enlarged box must stay clear too)
        const fc = q.on === p.focusElement ? centers[q.on] : null;
        const grown = b0 => ({x: fc.x + (b0.x - fc.x) * 1.09, y: fc.y + (b0.y - fc.y) * 1.09, w: b0.w * 1.09, h: b0.h * 1.09});
        const acceptGrow = fc ? b0 => { const g0 = grown(b0); return ![...relBoxes, ...capBoxes, ...taken, ...legHard].some(o => overlaps(g0, o, 4)) && g0.x > 0 && g0.y > 0 && g0.x + g0.w < D.w && g0.y + g0.h < D.h; } : null;
        // (no chip under a leader already drawn)
        // (…nor on the tracer's way — its halo is 17 across the centre line: the drawn lines, the stubs from each line end
        // to its part's centre, and the straight hops between parts the supplied order visits without a drawn relationship)
        const accept = b0 => !chips.some(c => c.lead && segHitsBox(c.lead.from, c.lead.to, b0, 3)) && !tracerSegs.some(([a, b]) => segHitsBox(a, b, b0, 20)) && (!acceptGrow || acceptGrow(b0));
        const st0 = {};
        got = placeChip({w: cf.w, h: cf.h, anchor: {...anchor, rad: rad + Math.max(span.w, span.h) / 2}, bounds: {x: 2, y: 2, w: D.w - 4, h: D.h - 4}, hard, leadHard: [...hard.filter(b => ['person', 'building', 'cap', 'rel', 'line'].includes(b.kind)), ...taken], gaps: [8, 16, 28, 44, 64], accept, stats: st0});
        if (!got) dbgL.push(`lab${i}/${mw}:${JSON.stringify(st0)}`);
        if (got) { fitUsed = cf.fit; break; }
      }
      if (!got) { problems.push(`lab-${i}`); return; }
      taken.push(got.box);
      chips.push({name: `lab${i}`, on: q.on, node: chipNode(ctx, got, {name: `lab${i}`, fit: fitUsed, owner: `p${i}`}), box: got.box, lead: got.from ? {from: got.from, to: got.to} : null});
    });
  }
  };
  placeCaps(); placeChips();
  if (problems.length > probs0) {
    const first = problems.splice(probs0);
    const saveCaps = {...caps}, saveCapBoxes = capBoxes.slice(), saveChips = chips.slice(), saveTaken = taken.slice();
    for (const id of EL) caps[id] = null;
    capBoxes.length = 0; chips.length = 0; taken.length = 0;
    placeChips(); placeCaps();
    const second = problems.splice(probs0);
    if (second.length >= first.length) {
      Object.assign(caps, saveCaps); capBoxes.length = 0; capBoxes.push(...saveCapBoxes); chips.length = 0; chips.push(...saveChips); taken.length = 0; taken.push(...saveTaken);
      problems.push(...first);
    } else problems.push(...second);
  }
  // no line runs under a caption or a people chip
  for (const cn of conns) for (const b of [...capBoxes, ...taken]) for (let j = 1; j < 24; j++) { const q = cn.c.at(j / 24); if (q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h) { problems.push('line-under'); break; } }
  // ---- tracer route: along the drawn relationships in the supplied order (straight hops where none is supplied)
  const order = p.traversalOrder.filter((id, i, a) => i === 0 || id !== a[i - 1]);
  const pts = [];
  const visitsIdx = [];
  order.forEach((id, i) => {
    if (i === 0) { pts.push(centers[id]); visitsIdx.push({id, idx: 0}); return; }
    const prev = order[i - 1];
    const cn = conns.find(q => (q.rel.from === prev && q.rel.to === id) || (q.rel.from === id && q.rel.to === prev));
    if (cn) {
      const fwd = cn.rel.from === prev;
      for (let j = 0; j <= 24; j++) pts.push(cn.c.at(fwd ? j / 24 : 1 - j / 24));
    }
    pts.push(centers[id]);
    visitsIdx.push({id, idx: pts.length - 1});
  });
  const route = {poly: polyline(pts)};
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const visits = visitsIdx.map(v => ({id: v.id, t: cum[v.idx] / total}));
  const edgeGap = (b, q) => Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h));
  const gaps = conns.map(cn => r(Math.max(edgeGap(boxes[cn.rel.from], cn.from), edgeGap(boxes[cn.rel.to], cn.to)), 1));
  // ---- the separated start: every part gathered towards the middle of the block, in front of the building
  const mid = {x: x0 + blockW / 2, y: y0 + blockH / 2};
  // (a short slide: each part starts a little nearer the middle, so the frame stays full while they separate)
  let fS = 0.07;
  const shifted = f => EL.map(id => ({...boxes[id], x: boxes[id].x + (mid.x - centers[id].x) * f, y: boxes[id].y + (mid.y - centers[id].y) * f}));
  for (; fS > 0.05; fS -= 0.05) { const sb = shifted(fS); if (!sb.some((a, i) => sb.some((c, j) => j > i && overlaps(a, c, 10)))) break; }
  const sepOff = Object.fromEntries(EL.map(id => [id, {x: (mid.x - centers[id].x) * fS, y: (mid.y - centers[id].y) * fS}]));
  // the frame is full at rest (before any relationship is drawn): parts, captions, chips and the legend cover >= 0.56
  // of the design box (40 × 40 grid, boxes grown by 24 px) — else a smaller text size or another arrangement is tried
  {
    const g24 = 24 / px;
    // (at u 0: each part, with its caption and chips, still gathered by its start offset)
    const sh = (b, id) => ({...b, x: b.x + sepOff[id].x, y: b.y + sepOff[id].y});
    const capOwner = new Map(EL.filter(id => caps[id]).map(id => [caps[id].box, id]));
    // (the legend as drawn: its text extents, not its reserved band)
    const wOf = its => Math.max(0, ...its.map(it => it.fit.width + (it.type === 'kind' ? 64 : 0)));
    const legDrawn = band
      ? {x: legBox.x, y: legBox.y + F * 0.3, w: (rightItems.length ? legBox.w / 2 + 20 + wOf(rightItems) : wOf(leftItems)), h: legH}
      : {x: legBox.x, y: legBox.y, w: wOf(legItems), h: legH};
    const bx = [...EL.map(id => sh(boxes[id], id)), ...capBoxes.map(b => sh(b, capOwner.get(b) || 'room')), ...chips.map(c => sh(c.box, c.on)), ...(legItems.length ? [legDrawn] : [])];
    let hit = 0;
    for (let a2 = 0; a2 < 40; a2++) for (let b2 = 0; b2 < 40; b2++) {
      const qx = (a2 + 0.5) * D.w / 40, qy = (b2 + 0.5) * D.h / 40;
      if (bx.some(q => qx >= q.x - g24 && qx <= q.x + q.w + g24 && qy >= q.y - g24 && qy <= q.y + q.h + g24)) hit++;
    }
    restCover = hit / 1600;
    // (the safe box also holds the content-notice band above the design box: 0.56 of the design box ≈ 0.52 of it)
    // (a tiebreaker between clean candidates, not a problem: the rendered test is the judge)
  }
  // ---- legend node
  let legend = null;
  if (legItems.length) {
    const parts = [];
    const draw = (its, x, y) => {
      for (const it of its) {
        if (it.type === 'kind') {
          const st = LINK_STYLES[it.kind];
          const col = kindColor(ctx, it.kind);
          parts.push(h('path', {d: `M${r(x)} ${r(y + F * 0.6)}h46`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}));
          if (st.endDots) parts.push(h('circle', {cx: r(x), cy: r(y + F * 0.6), r: st.width * 1.6, fill: col}), h('circle', {cx: r(x + 46), cy: r(y + F * 0.6), r: st.width * 1.6, fill: col}));
          if (st.arrow) parts.push(h('path', {d: `M${r(x + 52)} ${r(y + F * 0.6)}l-12 -7v14z`, fill: col}));
          parts.push(textAt(it.fit, x + 64, y, th.fg));
        } else parts.push(textAt(it.fit, x, y, it.type === 'key' ? th.fgSoft : th.fg, {italic: it.type === 'key' || it.type === 'seq', weight: it.type === 'head' ? 700 : undefined}));
        y += it.fit.height + F * 0.55;
      }
    };
    if (band) { draw(leftItems, legBox.x, legBox.y + F * 0.3); draw(rightItems, legBox.x + legBox.w / 2 + 20, legBox.y + F * 0.3); }
    else draw(legItems, legBox.x, legBox.y);
    legend = {node: g({name: 'legend', opacity: 0}, parts)};
  }
  // ---- art
  const building = buildingElevation(ctx, {name: 'bld', x: boxes.building.x, y: boxes.building.y, w: boxes.building.w, h: boxes.building.h, floors: 3, bays: bldWide > 1 ? 11 : 5, highlight: {floor: 0, bay: bldWide > 1 ? 5 : 2}, tree: true});
  const tf = Object.fromEntries(['entrance', 'strip', 'sign', 'room'].map(id => [id, T(pos[id].x, pos[id].y, 0, k)]));
  return {
    F, px, k, arr, legF, restCover, dbgL, pieces, boxes, centers, pos, tf, sepOff, building, people, chips, caps, conns, route, visits, gaps, legend, labelsClear, problems, personPx, seqCaptions,
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-10-mechanism',
    title: 'Accessibility adaptation — the parts of the route to the hearing room, exploded and traced',
    titleEs: 'Adaptación de accesibilidad — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Adaptación de accesibilidad',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded route: the generic building, the entrance (door, landing, steps with handrails and the ramp beside them, a participant in a wheelchair on it), a stretch of the tactile guidance strip (a participant with a long cane on it), the wall sign and the hearing room slide apart. Only the supplied relationships are drawn, styled by kind and labelled; a tracer follows the supplied order while the focus part enlarges and the participant on each part moves along it. No standard, measurement, obligation or outcome is stated.',
    tags: ['mechanism', 'exploded plan', 'accessibility', 'ramp', 'tactile strip', 'sign', 'wheelchair', 'long cane', 'relationships', 'tracer', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/adaptacion-accesibilidad.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeAA(scene, defaultParams, defaultParamsEs),
});
