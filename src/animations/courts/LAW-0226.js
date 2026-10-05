/**
 * LAW-0226 — Presentación de una prueba en sala · mechanism
 *
 * Storyboard (an exploded plan of the presentation, not a row of boxes: the
 * generic building front, the plan of the hearing room with the seated
 * participants, and three parts lifted out of it — the shared screen from the
 * front wall, the lectern with its document camera (the presenter standing at
 * it) from the aisle, and the fictional sheet from the presenter's table):
 *  0.00–0.18  separate: everything starts assembled in the room (the screen on
 *             its wall, the lectern in the aisle, the sheet on the table at its
 *             real size, the building behind the room) and slides apart; the
 *             sheet grows as it lifts out, so its lines can be read as a sheet.
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one,
 *             anchored to the parts' edges and styled by kind (plain relation =
 *             solid line with end dots, never an arrow; sequence = arrow with
 *             the caption "sequence as configured (illustrative)"; causal only
 *             when supplied), each with its own label.
 *  0.43–0.75  trace: a tracer follows the supplied order along the drawn
 *             relationships while the focus part enlarges; when it reaches the
 *             screen through a supplied camera–screen relationship the screen
 *             lights and an enlarged copy of the same sheet appears on it
 *             (nothing lights without that relationship).
 *  0.75–1.00  gather: origin (the sheet on its own), transformation (the
 *             drawn chain) and state (the screen showing the copy, or idle) stay
 *             visible with a legend of the connection kinds and the key
 *             "as supplied · no conclusion drawn". No admissibility, weight,
 *             objection, ruling or outcome is shown.
 * @module animations/courts/LAW-0226
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {LINK_STYLES, connector, tracer} from '../../primitives/annotate.js';
import {buildingElevation} from './kits/courts-art.js';
import {
  ppFields, PP_EN, resolvePP, ppGeometry, ppRoomArt, screenArt, lecternArt, sheetArt, holdPose, planPerson, textAt, DOC, SCREEN, WALL_T,
  placeSeatLabels, seatLabelNode, sideCaption, bodyBox, gchip, glue, fitWords, pxPerUnit, overlaps, R2, PERSON_RAD,
} from './kits/presentacion-de-prueba.js';

const ID = 'LAW-0226';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {slide: [0.02, 0.15], relate: [0.2, 0.39], trace: [0.45, 0.72], legend: [0.75, 0.81]};
const EL = ['building', 'room', 'document', 'camera', 'screen'];
const DOC_S = 2.3;
const LINK = '#34495e';
const kindColor = (ctx, kind) => (kind === 'communication' ? ctx.theme.accent2 : kind === 'sequence' ? ctx.theme.fg : kind === 'causal' ? ctx.theme.accent : LINK);

const STRINGS = {
  en: {kinds: 'Connections', seqNote: 'sequence as configured (illustrative)'},
  es: {kinds: 'Conexiones', seqNote: 'secuencia según lo configurado (ilustrativa)'},
};

const relationship = obj('A supplied relationship between two parts', {
  from: oneOf('Source part', EL),
  to: oneOf('Target part', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the connector (as supplied; empty = the caption of its kind)', 50),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  ...ppFields,
  elements: list('Part captions; ids are fixed by the scene (building, room, document, camera, screen), captions are editable', obj('Part', {
    id: oneOf('Part id', EL),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 5, 5),
  relationships: list('Explicit relationships between parts; kind controls the line style (causal only when supplied). A camera–screen relationship lets the screen show the enlarged copy when the tracer reaches it', relationship, 1, 6),
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
  ...PP_EN,
  elements: [
    {id: 'building', label: 'Building'},
    {id: 'room', label: 'Hearing room'},
    {id: 'document', label: 'Document 3 (fictional)'},
    {id: 'camera', label: 'Lectern with document camera'},
    {id: 'screen', label: 'Shared screen'},
  ],
  relationships: [
    {from: 'building', to: 'room', kind: 'relation', label: 'contains'},
    {from: 'document', to: 'camera', kind: 'relation', label: 'on the plate'},
    {from: 'camera', to: 'screen', kind: 'relation', label: 'shows an enlarged copy'},
    {from: 'screen', to: 'room', kind: 'relation', label: 'faces the room'},
  ],
  focusElement: 'document',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['document', 'camera', 'screen', 'room'],
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    let best = null;
    const log = [];
    const shape = ctx.view.shape;
    // (create() budget) per text size: the candidates' geometry first (cheap), then full compositions from the
    // largest people down; the first clean one wins
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      const cands = [];
      for (const legF of shape === 'landscape' ? [0.14, 0.18, 0.22] : shape === 'square' ? [0.56, 0.66] : [0.52, 0.6]) for (const arr of shape === 'landscape' ? ['stack', 'col', 'colM'] : shape === 'square' ? ['col', 'colM', 'row', 'rowM'] : ['row', 'rowM', 'col', 'colM']) {
        const C = compose(ctx, p, v / px, px, legF, arr, true);
        if (C.problems.length) { log.push(`${v}/${legF}/${arr}:cheap:${C.problems.join('+')}`); continue; }
        cands.push({legF, arr, k: C.k});
      }
      cands.sort((a, b) => b.k - a.k);
      let pick = null;
      for (const c of cands.slice(0, 4)) {
        const L = compose(ctx, p, v / px, px, c.legF, c.arr);
        log.push(`${v}/${c.legF}/${c.arr}:k${L.k.toFixed(2)}:${L.problems.join('+')}`);
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length) { pick = L; break; }
      }
      if (pick) { best = pick; break; }
    }
    if (!best) best = compose(ctx, p, 16.6 / px, px, shape === 'landscape' ? 0.18 : 0.6, shape === 'landscape' ? 'col' : 'row');
    best.log = log.slice(-40);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const part = (id, inner) => g({name: `el-${id}`}, inner);
    return g(null,
      part('building', [L.building.node]),
      part('room', [g({transform: L.tf.room}, L.room.node, L.roomPeople.map(pp => pp.node))]),
      part('screen', [g({transform: L.tf.screen},
        screenArt(ctx, L.G, {name: 'screen'}),
        g({name: 'shot', opacity: 0, transform: T(L.G.shown.x, L.G.shown.y, 0, L.G.shown.scale)}, sheetArt(ctx, {name: 'shot-sheet', stroke: 1.2}))),
      L.titleNode && g({name: 'shot-title', opacity: 0}, L.titleNode)]),
      part('camera', [g({transform: L.tf.camera}, lecternArt(ctx, L.G, {name: 'lectern'}), L.presenter ? L.presenter.node : null)]),
      part('document', [g({name: 'docwrap', transform: T(0, 0)}, g({transform: T(0, 0, 0, L.k * DOC_S)}, sheetArt(ctx, {name: 'doc-sheet'})))]),
      L.conns.map(c => c.c.node),
      // (the tracer runs along the lines, under the relation chips and labels, so it never covers their text)
      g({name: 'tracer-wrap', transform: T(0, 0)}, tracer(ctx, 'tracer', th.accent2)),
      L.conns.map((c, i) => c.chip && g({name: `rel-l${i}`, opacity: 0}, c.chip.node)),
      EL.map(id => L.caps[id] && g({name: `cap-w-${id}`, opacity: 0}, L.caps[id].node)),
      L.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: `rm-chair-${L.seats[i].slot}`})),
      L.presLabel && seatLabelNode(ctx, L.presLabel, {name: 'labP', size: L.F, owner: `p${L.pi}`, seat: 'lectern'}),
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
    for (const id of EL) {
      const off = L.sepOff[id];
      const visit = L.visits.find(v => v.id === id && id === ctx.params.focusElement);
      const near = visit && tp > 0 && tp < 1 ? Math.min(1, Math.max(0, 1.6 - Math.abs(tp - visit.t) / 0.14)) : 0;
      const sc = 1 + 0.14 * ease.inOutSine(near);
      focusScale[id] = sc;
      const c = L.centers[id];
      if (id === 'document') continue;
      nodes[`el-${id}`] = {transform: `${T(off.x * (1 - slide), off.y * (1 - slide))} ${scaleAbout(c.x, c.y, r(sc, 4))}`};
    }
    // the sheet: from the presenter's table (real size) to its own place (enlarged), then its focus scale
    {
      const a = L.docFrom, b = L.docTo;
      const s0 = 1 / DOC_S, s = lerp(s0, 1, slide) * focusScale.document;
      nodes.docwrap = {transform: T(lerp(a.x, b.x, slide), lerp(a.y, b.y, slide), lerp(a.deg, 0, slide), s)};
      nodes['el-document'] = {transform: 'translate(0 0)'};
    }
    for (const id of EL) if (L.caps[id]) nodes[`cap-w-${id}`] = {opacity: r(seg(u, W.slide[1], W.slide[1] + 0.03), 3)};
    L.conns.forEach((c, i) => {
      Object.assign(nodes, c.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
      if (c.chip) nodes[`rel-l${i}`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45), 3)};
    });
    // the screen shows the enlarged copy only when the tracer reaches it through a supplied camera–screen relationship
    // (the screen lights as the tracer arrives over the camera–screen relationship; the title follows once lit)
    const uAt = tv => W.trace[0] + (Math.acos(1 - 2 * clamp(tv)) / Math.PI) * (W.trace[1] - W.trace[0]);
    const on = L.screenVisit >= 0 ? ease.inOutSine(clamp((tp - (L.screenVisit - 0.07)) / 0.07)) : 0;
    const shows = on;
    nodes['screen-lit'] = {opacity: r(on, 3)};
    nodes['screen-idle'] = {opacity: r(1 - clamp(on * 1.6), 3)};
    nodes.shot = {opacity: r(on, 3), transform: T(L.G.shown.x, L.G.shown.y, 0, L.G.shown.scale * lerp(0.5, 1, on))};
    const titleOp = L.screenVisit >= 0 ? seg(u, uAt(L.screenVisit) + 0.005, uAt(L.screenVisit) + 0.035) : 0;
    if (L.titleNode) nodes['shot-title'] = {opacity: r(titleOp, 3)};
    nodes['lectern-lamp'] = {opacity: r(L.screenVisit >= 0 ? ease.inOutSine(clamp((tp - (L.cameraVisit - 0.04)) / 0.04)) : 0, 3)};
    // people (all seated in the room; the presenter stands at the lectern, hands resting on it)
    L.seats.forEach((s, i) => {
      if (i === L.pi) return;
      const S = L.G.slots[s.slot];
      Object.assign(nodes, L.roomPeople[i].pose({x: S.x, y: S.y, deg: S.deg, phase: 0, walk: 0, seated: 1}));
    });
    if (L.presenter) Object.assign(nodes, holdPose(L.presenter, `p${L.pi}`, {...L.G.lectern.stand, phase: 0, walk: 0, seated: 0}, {x: 0, y: -52}, 0.6));
    const lab = seg(u, W.slide[1], W.slide[1] + 0.03);
    L.labels.forEach((sl, i) => { if (sl) { nodes[`lab${i}`] = {opacity: r(lab, 3)}; nodes[`lab${i}-text`] = {opacity: r(lab, 3)}; } });
    if (L.presLabel) { nodes.labP = {opacity: r(lab, 3)}; nodes['labP-text'] = {opacity: r(lab, 3)}; }
    const tracerOn = u >= W.trace[0] - 0.005 && u <= W.trace[1] + 0.03;
    nodes['tracer-wrap'] = {transform: T(tq.x, tq.y)};
    nodes.tracer = {opacity: r(tracerOn ? 1 - seg(u, W.trace[1] + 0.005, W.trace[1] + 0.03) : 0, 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    Object.assign(nodes, L.room.door.frame(0));
    const visited = L.visits.filter(v => tp >= v.t - 1e-9 && u >= W.trace[0]).map(v => v.id);
    const docC = {x: lerp(L.docFrom.x, L.docTo.x, slide), y: lerp(L.docFrom.y, L.docTo.y, slide)};
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
        doc: R2(docC),
        docScale: r(lerp(1 / DOC_S, 1, slide) * focusScale.document, 3),
        screenShows: r(on, 3),
        screenLinked: L.screenVisit >= 0,
        shows: r(shows, 3),
        connectorGaps: L.gaps,
        arrows: L.conns.map(c => ({kind: c.rel.kind, arrow: LINK_STYLES[c.rel.kind].arrow})),
        seqCaptions: L.seqCaptions,
        labelsClear: L.labelsClear,
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        log: L.log,
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, legF, arr = 'col', cheap = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const cap = id => (p.elements.find(e => e.id === id) || {label: id}).label;
  const {seats, presenter} = resolvePP(ctx, p);
  const pi = presenter ? seats.indexOf(presenter) : -1;
  // ---- legend + key
  const rels = p.relationships.filter(q => q.from !== q.to);
  const kinds = [...new Set(rels.map(q => q.kind))];
  const seqCaptions = rels.some(q => q.kind === 'sequence');
  const legW = !showAll && !showKey ? 0 : shape === 'landscape' ? D.w * legF : D.w * legF;
  const legItems = [];
  if (showAll) {
    legItems.push({type: 'head', fit: fitWords(ctx.t.kinds, {maxWidth: legW, size: F, minSize: F, maxLines: 1, weight: 700})});
    for (const kd of kinds) legItems.push({type: 'kind', kind: kd, fit: fitWords(glue(p.relationLabels[kd]), {maxWidth: legW - 70, size: F, minSize: F, maxLines: 3, weight: 500})});
    if (seqCaptions) legItems.push({type: 'seq', fit: fitWords(glue(ctx.t.seqNote), {maxWidth: legW, size: F, minSize: F, maxLines: 3, weight: 500})});
  }
  if (showKey) legItems.push({type: 'names', fit: fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: legW, size: F, minSize: F, maxLines: 6, weight: 600})});
  if (showKey) legItems.push({type: 'key', fit: fitWords(glue(p.labels.key), {maxWidth: legW, size: F, minSize: F, maxLines: 6, weight: 500})});
  if (legItems.some(it => it.fit.truncated)) problems.push('legend-trunc');
  const legH = legItems.reduce((a, it) => a + it.fit.height + F * 0.55, 0);
  // ---- the room geometry (template units) and the parts' local boxes
  const RW = 640, RH = 620;
  let G = ppGeometry(RW, RH, {titleBand: 60, compact: true});
  const t = WALL_T;
  const roomB = {x: -t, y: -t, w: RW + 2 * t, h: RH + 2 * t};
  const scrB = {x: G.screen.x, y: G.screen.y, w: G.screen.w, h: G.screen.h};
  const Lc = G.lectern;
  const camB = {x: Lc.cx - Lc.w / 2 - 6, y: Lc.cy - Lc.h / 2 - 6, w: Lc.w + 12, h: Lc.stand.y + 56 - (Lc.cy - Lc.h / 2 - 6)};
  const docW = DOC.w * DOC_S, docH = DOC.h * DOC_S;
  // the three lifted-out parts form one cluster (template units): the screen, the lectern beside it, the sheet
  // under the lectern — each pair joined by a relationship has a gap long enough for its connector
  // the relation chips decide the gaps (design units): a horizontal connector needs the chip's width between its
  // parts, a vertical one its height (so each label sits on its own connector, clear of the parts)
  const chipOf = rel => gchip(ctx, rel.kind === 'sequence' ? `${rel.label || p.relationLabels[rel.kind]} · ${ctx.t.seqNote}` : (rel.label || p.relationLabels[rel.kind] || rel.kind), {x: 0, y: 0, anchor: 'middle', maxWidth: 170 / px, size: F, minSize: F, maxLines: 4, weight: 600}).box;
  const relBetween = (a, b) => rels.find(q => (q.from === a && q.to === b) || (q.from === b && q.to === a));
  const need = (a, b, horiz) => { const rq = relBetween(a, b); if (!rq || !showAll) return 90; const bx = chipOf(rq); return Math.max(90, (horiz ? bx.w : bx.h) + 36); };
  // (arr 'row': the screen, then the lectern with the sheet under it; 'col': the screen above the lectern and the
  // sheet side by side) — cluster offsets in design units at scale k
  const base = arr.replace(/M$/, ''), mirror = arr.endsWith('M');
  const camCapH = showKey ? gchip(ctx, cap('camera'), {x: 0, y: 0, anchor: 'start', maxWidth: 250 / px, size: F, minSize: F, maxLines: 4, weight: 700}).box.h + 16 : 0;
  const clusterAt = kk => {
    const c = clusterBase(kk);
    if (!mirror) return c;
    // mirrored: the same cluster flipped left–right (x of each part's left edge; the sheet's x is its centre)
    return {...c, screen: {x: c.w - c.screen.x - scrB.w * kk, y: c.screen.y}, camera: {x: c.w - c.camera.x - camB.w * kk, y: c.camera.y}, document: {x: c.w - c.document.x, y: c.document.y}};
  };
  const clusterBase = kk => {
    if (base === 'stack') {
      const g1 = need('screen', 'camera', false), g2 = need('camera', 'document', false);
      const w = Math.max(scrB.w, camB.w, docW) * kk;
      return {w, h: (scrB.h + camB.h + docH) * kk + g1 + g2, screen: {x: (w - scrB.w * kk) / 2, y: 0}, camera: {x: (w - camB.w * kk) / 2, y: scrB.h * kk + g1}, document: {x: w / 2, y: (scrB.h + camB.h) * kk + g1 + g2 + (docH * kk) / 2}};
    }
    if (base === 'row') {
      const g1 = need('screen', 'camera', true), g2 = need('camera', 'document', false);
      const rightW = Math.max(camB.w, docW) * kk;
      return {w: scrB.w * kk + g1 + rightW, h: Math.max(scrB.h * kk, camB.h * kk + g2 + docH * kk),
        screen: {x: 0, y: 0}, camera: {x: scrB.w * kk + g1 + (rightW - camB.w * kk) / 2, y: 0}, document: {x: scrB.w * kk + g1 + rightW / 2, y: camB.h * kk + g2 + (docH * kk) / 2}};
    }
    // (the gap above the lectern also holds the lectern's caption)
    const g1 = need('screen', 'camera', false) + camCapH, g2 = need('camera', 'document', true);
    const lowW = camB.w * kk + g2 + docW * kk, lowH = Math.max(camB.h, docH) * kk;
    const w = Math.max(scrB.w * kk, lowW), lx = (w - lowW) / 2;
    return {w, h: scrB.h * kk + g1 + lowH, screen: {x: (w - scrB.w * kk) / 2, y: 0}, camera: {x: lx, y: scrB.h * kk + g1}, document: {x: lx + camB.w * kk + g2 + (docW * kk) / 2, y: scrB.h * kk + g1 + lowH / 2}};
  };
  // solve k: the cluster's size is linear in k (parts × k + fixed gaps)
  const c0 = clusterAt(0), c1 = clusterAt(1);
  const clW = kk => c0.w + (c1.w - c0.w) * kk, clH = kk => c0.h + (c1.h - c0.h) * kk;
  // ---- arrangement per shape (design units)
  const bW = shape === 'landscape' ? Math.min(D.w * 0.1, 180) : shape === 'square' ? 112 : Math.min(D.w * 0.26, 230);
  const bH = bW * 1.1;
  let k, bldBox, legBox, roomAt, clAt;
  const capPad = showKey ? F * 2.6 : 12;
  if (shape === 'landscape') {
    const gapL = need('building', 'room', true), gapH = need('screen', 'room', true);
    const availW = D.w - bW - gapL - gapH - (legW ? legW + 36 : 0) - c0.w;
    k = Math.min(showKey ? 1.1 : 1.3, availW / (roomB.w + c1.w - c0.w), (D.h - 2 * capPad) / roomB.h, (D.h - 2 * capPad - c0.h) / (c1.h - c0.h));
    const x0 = bW + gapL;
    roomAt = {x: x0, y: (D.h - roomB.h * k) / 2};
    clAt = {x: x0 + roomB.w * k + gapH, y: (D.h - clH(k)) / 2};
    bldBox = {x: 0, y: roomAt.y + (roomB.h * k - bH) / 2, w: bW, h: bH};
    legBox = {x: D.w - legW, y: Math.max(0, (D.h - legH) / 2), w: legW, h: legH};
  } else {
    const bandH = Math.max(bH + F * 3.4, legH) + 26;
    if (shape === 'square') {
      const gapH = need('screen', 'room', true);
      k = Math.min(1.1, (D.w - gapH - c0.w) / (roomB.w + c1.w - c0.w), (D.h - bandH - capPad) / roomB.h, (D.h - bandH - capPad - c0.h) / (c1.h - c0.h));
      const blockW = roomB.w * k + clW(k) + gapH;
      const x0 = (D.w - blockW) / 2;
      roomAt = {x: x0, y: bandH + (D.h - bandH - roomB.h * k) / 2};
      clAt = {x: x0 + roomB.w * k + gapH, y: bandH + (D.h - bandH - clH(k)) / 2};
    } else {
      const gapV = need('screen', 'room', false);
      k = Math.min(1.1, (D.w - 20) / roomB.w, (D.w - 20 - c0.w) / (c1.w - c0.w), (D.h - bandH - gapV - capPad - c0.h) / (roomB.h + c1.h - c0.h));
      const blockH = roomB.h * k + clH(k) + gapV;
      const y0 = bandH + (D.h - bandH - blockH) / 2;
      roomAt = {x: (D.w - roomB.w * k) / 2, y: y0};
      clAt = {x: (D.w - clW(k)) / 2, y: y0 + roomB.h * k + gapV};
    }
    bldBox = {x: 0, y: 0, w: bW, h: bH};
    legBox = {x: D.w - legW, y: 0, w: legW, h: legH};
    if (legH > bandH + 1) problems.push('legend');
  }
  const cl = clusterAt(k);
  // the screen's title band fits the supplied document title at this scale (only the page inside the screen moves)
  const titleFit = showKey ? fitWords(glue(cap('document')), {maxWidth: (G.titleBox.w - 8) * k, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  if (titleFit) G = ppGeometry(RW, RH, {titleBand: Math.max(44, (titleFit.height + F * 0.6) / k + 8), compact: true});
  if (G.pageH < 90) problems.push('page');
  const pos = {
    room: {x: roomAt.x - roomB.x * k, y: roomAt.y - roomB.y * k},
    screen: {x: clAt.x + cl.screen.x - scrB.x * k, y: clAt.y + cl.screen.y - scrB.y * k},
    camera: {x: clAt.x + cl.camera.x - camB.x * k, y: clAt.y + cl.camera.y - camB.y * k},
    document: {x: clAt.x + cl.document.x, y: clAt.y + cl.document.y},
  };
  const boxOf = (id) => {
    if (id === 'document') return {x: pos.document.x - (docW * k) / 2, y: pos.document.y - (docH * k) / 2, w: docW * k, h: docH * k};
    const b = id === 'room' ? roomB : id === 'screen' ? scrB : camB;
    const o = pos[id];
    return {x: o.x + b.x * k, y: o.y + b.y * k, w: b.w * k, h: b.h * k};
  };
  const boxes = {building: bldBox, room: boxOf('room'), document: boxOf('document'), camera: boxOf('camera'), screen: boxOf('screen')};
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  for (const id of EL) { const b = boxes[id]; if (b.x < -1 || b.y < -1 || b.x + b.w > D.w + 1 || b.y + b.h > D.h + 1) problems.push(`out-${id}`); }
  for (let i = 0; i < EL.length; i++) for (let j = i + 1; j < EL.length; j++) if (overlaps(boxes[EL[i]], boxes[EL[j]], 6)) problems.push(`overlap-${EL[i]}-${EL[j]}`);
  if (legW && EL.some(id => overlaps(legBox, boxes[id], 6))) problems.push('legend-overlap');
  const centers = Object.fromEntries(EL.map(id => [id, {x: boxes[id].x + boxes[id].w / 2, y: boxes[id].y + boxes[id].h / 2}]));
  // assembled start: the screen on its wall, the lectern in its aisle, the sheet on the presenter's table, the
  // building behind the room
  const inRoom = q => ({x: pos.room.x + q.x * k, y: pos.room.y + q.y * k});
  // (the screen starts hung on the room's front wall — just above it, centred — the lectern in its aisle)
  // (the screen starts hung on a wall of the room, just outside it — never over the room's people)
  const sw = scrB.w * k, sh = scrB.h * k, rb = {x: pos.room.x + roomB.x * k, y: pos.room.y + roomB.y * k, w: roomB.w * k, h: roomB.h * k};
  const homes = [
    {x: rb.x + (rb.w - sw) / 2, y: rb.y - sh - 4},
    {x: rb.x + (rb.w - sw) / 2, y: rb.y + rb.h + 4},
    {x: rb.x + rb.w + 4, y: rb.y + (rb.h - sh) / 2},
    {x: rb.x - sw - 4, y: rb.y + (rb.h - sh) / 2},
  ];
  // (of the walls with room outside them, the one nearest the screen's place: it slides away without crossing the room)
  const inFrame = homes.filter(q => q.x >= 0 && q.y >= 0 && q.x + sw <= D.w && q.y + sh <= D.h);
  const dest = boxes.screen;
  const scrHome = inFrame.sort((a, b) => Math.hypot(a.x - dest.x, a.y - dest.y) - Math.hypot(b.x - dest.x, b.y - dest.y))[0] || {x: Math.max(0, Math.min(D.w - sw, homes[0].x)), y: Math.max(0, homes[0].y)};
  const camHome = inRoom({x: camB.x, y: camB.y});
  const sepOff = {
    screen: {x: scrHome.x - boxes.screen.x, y: scrHome.y - boxes.screen.y},
    camera: {x: camHome.x - boxes.camera.x, y: camHome.y - boxes.camera.y},
    building: {x: centers.room.x - centers.building.x, y: centers.room.y - centers.building.y},
    room: {x: 0, y: 0},
    document: {x: 0, y: 0},
  };
  const tableSeat = presenter ? G.slots[presenter.slot] : G.slots.left1;
  const docFrom = {...inRoom({x: tableSeat.x + 18, y: G.tables[tableSeat.table].cy - 4}), deg: -8};
  const docTo = {x: pos.document.x, y: pos.document.y, deg: 0};
  // ---- art
  const room = ppRoomArt(ctx, G, {prefix: 'rm', chairs: seats.map(s => s.slot).filter(s => s !== 'front' || true)});
  const roomPeople = seats.map((s, i) => (i === pi ? null : planPerson(ctx, {name: `p${i}`, look: s.look})));
  const presPerson = pi >= 0 ? planPerson(ctx, {name: `p${pi}`, look: seats[pi].look}) : null;
  const building = buildingElevation(ctx, {name: 'bld', x: bldBox.x, y: bldBox.y, w: bldBox.w, h: bldBox.h, highlight: {floor: 1, bay: 3}});
  const tf = {room: T(pos.room.x, pos.room.y, 0, k), screen: T(pos.screen.x - scrB.x * k + scrB.x * k, pos.screen.y, 0, k), camera: T(pos.camera.x, pos.camera.y, 0, k)};
  tf.screen = T(pos.screen.x, pos.screen.y, 0, k);
  // the supplied document title on the screen (design units), inside the screen's title band
  let titleNode = null;
  if (titleFit) {
    if (titleFit.truncated) problems.push('title');
    const tb = {x: pos.screen.x + G.titleBox.x * k, y: pos.screen.y + G.titleBox.y * k, w: G.titleBox.w * k, h: G.titleBox.h * k};
    titleNode = textAt(titleFit, tb.x + tb.w / 2, tb.y + (tb.h - titleFit.height) / 2, '#1f2328', {anchor: 'middle', weight: 700});
  }
  // ---- connectors (supplied relationships only), anchored to the part edges
  const conns = rels.map((rel, i) => {
    const A = boxes[rel.from], B = boxes[rel.to];
    const from = edgeAnchor(A, centers[rel.to], 8);
    const to = edgeAnchor(B, centers[rel.from], 8);
    const cn = connector(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind, bend: 0.06, color: kindColor(ctx, rel.kind)});
    return {rel, c: cn, from, to};
  });
  // a connector must not run across a part other than its own two ends
  conns.forEach((cn, i) => {
    const others = EL.filter(id => id !== cn.rel.from && id !== cn.rel.to).map(id => boxes[id]);
    for (let j = 1; j < 24; j++) { const q = cn.c.at(j / 24); if (others.some(b => q.x > b.x + 2 && q.x < b.x + b.w - 2 && q.y > b.y + 2 && q.y < b.y + b.h - 2)) { problems.push(`cross-${i}`); break; } }
  });
  if (cheap) return {k, problems};
  // ---- people labels: seated participants inside the room; the presenter beside the lectern part
  const rad = PERSON_RAD * k;
  const everyone = seats.map((s, i) => (i === pi ? bodyBox({x: pos.camera.x + Lc.stand.x * k, y: pos.camera.y + Lc.stand.y * k}, 0, rad) : bodyBox(inRoom(G.slots[s.slot]), G.slots[s.slot].deg, rad)));
  const connPts = conns.map(cn => Array.from({length: 13}, (_, j) => cn.c.at(j / 12)));
  const extra = [...(legW ? [legBox] : []), bldBox, boxes.screen, boxes.document];
  const tables = G.tables.map(tb => ({x: inRoom({x: tb.cx - tb.w / 2, y: 0}).x, y: inRoom({x: 0, y: tb.cy - tb.h / 2}).y, w: tb.w * k, h: tb.h * k}));
  const desk = {x: inRoom({x: G.desk.cx - G.desk.w / 2, y: 0}).x, y: inRoom({x: 0, y: G.desk.cy - G.desk.h / 2}).y, w: G.desk.w * k, h: G.desk.h * k};
  const common = {size: F, minSize: F, maxWidth: 300 / px, maxLines: 3, maxGap: 36 / px, pathPad: rad * 0.35, hard: [...tables, desk], hardAlways: []};
  const labels = seats.map(() => null);
  let presLabel = null;
  if (showKey) {
    const idx = seats.map((s, i) => i).filter(i => i !== pi);
    const rb = boxes.room;
    const res = placeSeatLabels(ctx, {...common, items: idx.map(i => ({key: `s${i}`, text: seats[i].label, at: inRoom(G.slots[seats[i].slot]), rad, avoidPaths: connPts})),
      people: everyone, furniture: [...tables, desk], bounds: {x: rb.x + t * k, y: rb.y + t * k, w: rb.w - 2 * t * k, h: rb.h - 2 * t * k}, extra,
      seatPoints: idx.map(i => inRoom(G.slots[seats[i].slot]))});
    res.labels.forEach((lb, j) => { labels[idx[j]] = lb; extra.push(lb.box); });
    problems.push(...res.fails.map(f => `lab-${f}`));
  }
  const personBoxes = labels.filter(Boolean).map(lb => lb.box);
  const hardBoxes = [...EL.map(id => boxes[id]), ...(legW ? [legBox] : [])];
  const rays = conns.map(cn => [cn.from, cn.to]);
  const caps = {};
  const capBoxes = [];
  // ---- relation labels: beside the connector's middle, clear of parts, captions and other labels; a sequence
  // relationship carries the "sequence as configured (illustrative)" caption in its label
  const relBoxes = [];
  let labelsClear = true;
  conns.forEach((cn, i) => {
    if (!showAll) return;
    const base = cn.rel.label || p.relationLabels[cn.rel.kind] || cn.rel.kind;
    const text = cn.rel.kind === 'sequence' ? `${base} · ${ctx.t.seqNote}` : base;
    let probe = null, got = null;
    for (const [mw, ml] of [[170, 4], [230, 3], [300, 2], [140, 5]]) {
      probe = gchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw / px, size: F, minSize: F, maxLines: ml, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), weight: 600});
      if (probe.fit.truncated) continue;
      const dx = cn.to.x - cn.from.x, dy = cn.to.y - cn.from.y, Ld = Math.hypot(dx, dy) || 1;
      const nx = -dy / Ld, ny = dx / Ld;
      for (const d0 of [0, 26, 44, 62, 80, 100, 124, 150]) {
        for (const sg of d0 ? [1, -1] : [1]) {
          for (const tt of [0.5, 0.35, 0.65, 0.2, 0.8]) {
            const m0 = cn.c.at(tt);
            const cx = m0.x + nx * d0 * sg, cy = m0.y + ny * d0 * sg;
            const b = {x: cx - probe.box.w / 2, y: cy - probe.box.h / 2, w: probe.box.w, h: probe.box.h};
            if (b.x < 0 || b.y < 0 || b.x + b.w > D.w || b.y + b.h > D.h) continue;
            if ([...hardBoxes, ...capBoxes, ...relBoxes, ...personBoxes].some(q => overlaps(b, q, 6))) continue;
            if (conns.some((o, j) => j !== i && [0.1, 0.25, 0.5, 0.75, 0.9].some(t2 => { const q = o.c.at(t2); return q.x > b.x - 8 && q.x < b.x + b.w + 8 && q.y > b.y - 8 && q.y < b.y + b.h + 8; }))) continue;
            const dTo = cn2 => Math.min(...Array.from({length: 25}, (_, z) => cn2.c.at(z / 24)).map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
            const own = dTo(cn);
            if (own * px > 36 || conns.some((o, j) => j !== i && dTo(o) < own + 10 / px)) continue;
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
  // the presenter's label before the captions (it must stay beside the presenter; captions have more room), clear of every relation label
  if (showKey && pi >= 0) {
    const extra2 = [...extra, ...relBoxes];
      const cb = boxes.camera;
      const at = {x: pos.camera.x + Lc.stand.x * k, y: pos.camera.y + Lc.stand.y * k};
      const res2 = placeSeatLabels(ctx, {...common, maxGap: 38 / px, maxLines: 4, items: [{key: 'pres', text: seats[pi].label, at, rad, avoidPaths: connPts}], people: everyone, furniture: [],
        bounds: {x: 0, y: 0, w: D.w, h: D.h},
        extra: [...extra2, boxes.room, boxes.camera].filter(Boolean).map(b => (b === boxes.camera ? {x: b.x, y: b.y, w: b.w, h: b.h * 0.55} : b)), seatPoints: [at]});
      presLabel = res2.labels[0];
      problems.push(...res2.fails.map(f => `lab-${f}`));
    }
  // ---- part captions
  const sideOrder = id => (id === 'building' ? ['below', 'right', 'above'] : id === 'screen' ? ['above', 'below', 'left', 'right'] : id === 'document' ? ['below', 'left', 'right', 'above'] : id === 'camera' ? (arr.startsWith('col') ? ['above', 'right', 'left', 'below'] : ['right', 'left', 'below', 'above']) : ['below', 'above', 'left', 'right']);
  for (const id of EL) {
    if (!showKey) { caps[id] = null; continue; }
    let pl = null, mwUsed = 0;
    for (const mw of [Math.min(360 / px, D.w * 0.4), 250 / px, 190 / px, 150 / px]) {
      const probe = gchip(ctx, cap(id), {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: F, minSize: F, maxLines: 4, fill: th.card, stroke: th.fgSoft, weight: 700});
      if (probe.fit.truncated) continue;
      for (const gp of [10, 26, 44, 70]) {
        const cand = sideCaption({part: boxes[id], w: probe.box.w, h: probe.box.h, order: sideOrder(id), gap: gp, frame: D, hard: [...hardBoxes.filter(b => b !== boxes[id]), ...capBoxes, ...personBoxes, ...relBoxes, ...(presLabel ? [presLabel.box] : [])], rays});
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
    visitsIdx.push({id, idx: pts.length - 1, via: cn ? [prev, id].sort().join('-') : null});
  });
  const route = {poly: polyline(pts)};
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const visits = visitsIdx.map(v => ({id: v.id, t: cum[v.idx] / total, via: v.via}));
  // the screen shows the copy when the tracer reaches it over a supplied camera–screen relationship
  const scrVisit = visits.find(v => v.id === 'screen' && v.via === 'camera-screen');
  const camVisit = visits.find(v => v.id === 'camera');
  const screenVisit = scrVisit ? scrVisit.t : -1;
  const cameraVisit = camVisit ? Math.min(camVisit.t, screenVisit) : screenVisit;
  const edgeGap = (b, q) => Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h));
  const gaps = conns.map(cn => r(Math.max(edgeGap(boxes[cn.rel.from], cn.from), edgeGap(boxes[cn.rel.to], cn.to)), 1));
  // ---- legend node
  let legend = null;
  if (legItems.length) {
    const parts = [];
    let y = legBox.y;
    for (const it of legItems) {
      if (it.type === 'kind') {
        const st = LINK_STYLES[it.kind];
        const col = kindColor(ctx, it.kind);
        parts.push(h('path', {d: `M${r(legBox.x)} ${r(y + F * 0.6)}h46`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}));
        if (st.endDots) parts.push(h('circle', {cx: r(legBox.x), cy: r(y + F * 0.6), r: st.width * 1.6, fill: col}), h('circle', {cx: r(legBox.x + 46), cy: r(y + F * 0.6), r: st.width * 1.6, fill: col}));
        if (st.arrow) parts.push(h('path', {d: `M${r(legBox.x + 52)} ${r(y + F * 0.6)}l-12 -7v14z`, fill: col}));
        parts.push(textAt(it.fit, legBox.x + 64, y, th.fg));
      } else parts.push(textAt(it.fit, legBox.x, y, it.type === 'key' ? th.fgSoft : th.fg, {italic: it.type === 'key' || it.type === 'seq', weight: it.type === 'head' ? 700 : undefined}));
      y += it.fit.height + F * 0.55;
    }
    legend = {node: g({name: 'legend', opacity: 0}, parts)};
  }
  return {
    F, px, k, G, pos, boxes, centers, sepOff, building, room, roomPeople: roomPeople.map((pp, i) => pp || {node: null}), presenter: presPerson, seats, pi,
    labels, presLabel, caps, conns, route, visits, gaps, legend, labelsClear, problems, personPx, tf, titleNode, docFrom, docTo, screenVisit, cameraVisit, seqCaptions,
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-07-mechanism',
    title: 'Presenting a document in the room — the parts of the presentation, exploded and traced',
    titleEs: 'Presentación de una prueba en sala — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Presentación de una prueba en sala',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded plan: the generic building, the hearing room with its seated participants and three parts lifted out of it — the shared screen from the front wall, the lectern with its document camera (the presenter at it) and the fictional sheet, which grows as it lifts out of the presenter’s table. Only the supplied relationships are drawn, styled by kind and labelled; a tracer follows the supplied order while the focus part enlarges, and when it reaches the screen through a supplied camera–screen relationship the screen lights with an enlarged copy of the same sheet. No admissibility, weight, ruling or outcome is shown.',
    tags: ['mechanism', 'exploded plan', 'document', 'document camera', 'shared screen', 'relationships', 'tracer', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/presentacion-de-prueba.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
