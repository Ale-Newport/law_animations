/**
 * LAW-0338 — Revisión de documentos · mechanism
 *
 * Storyboard (an exploded FRONT ELEVATION of a fictional two-compartment file box — not the plan view of the story:
 * compartment A holds the original file — a bundle with the placeholder decision sheet in front, lane colour blue —,
 * compartment B the proposed additional pieces — sheets with amber strips —; a neutral divider plate stands in the slot
 * between them; above hang the index card of the pieces and a blank file calendar; the five elements are drawn at a
 * size that keeps them the subject, every label lives in the legend, keyed by the same glyphs):
 *  0.00–0.18  separate: the box stands assembled (the bundles and the plate down in their slots); the plate lifts out of
 *             its slot and the two bundles rise out of their compartments, apart, on either side of it — the parts of
 *             "el expediente original y nuevas piezas se mantienen separados" laid out in space.
 *  0.18–0.43  only the supplied relationships are drawn, one after another, from edge to edge of their elements: a
 *             plain relation is a line with round ends (no arrowhead); communication, sequence and causal styles appear
 *             only when the author supplies those kinds. The legend names each kind with its caption.
 *  0.43–0.75  a tracer marker follows the supplied traversal order along the drawn relationships (a straight hop where
 *             none links two consecutive elements); the focus element grows while the tracer is on it and stays larger.
 *  0.75–1.00  the mechanism is gathered in view: every relationship, origin (A), transformation (the divider keeping
 *             the bundles apart) and state stay visible — the supplied states ● on bundle A and ◆ on bundle B (equal
 *             weight) — with the key "as supplied · no conclusion drawn". No admissibility rule, assessment, causation
 *             by default, time limit or outcome.
 * @module animations/review/LAW-0338
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, polyline} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {mechanismFields} from '../../schemas/fields.js';
import {connector, tracer} from '../../primitives/annotate.js';
import {pxPerUnit, R2, centreShiftY, mapper} from '../hearings/kits/apertura-audiencia.js';
import {searchSa, statusDisc, linkColor} from './kits/solicitud-autorizacion.js';
import {rdFields, RD_EN, RD_ES, localisedRd, resolveRd, rdRowNode, wallCalendar, bundleArt, plateArt, fileBoxArt, indexCardArt, KINDS} from './kits/revision-de-documentos.js';

const ID = 'LAW-0338';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {plate: [0.03, 0.11], bundles: [0.06, 0.17], links: [0.19, 0.42], trace: [0.45, 0.73], focusBack: [0.75, 0.8], pins: [0.76, 0.8], states: [0.77, 0.82]};
const IDS = ['original', 'additional', 'divider', 'index', 'calendar'];
const FOCUS_K = 1.16;

const OWN_EN = {
  elements: [{id: 'index', label: 'Index of the pieces (no assessment)'}, {id: 'calendar', label: 'File calendar (no date marked)'}],
  relationships: [
    {from: 'original', to: 'divider', kind: 'relation'},
    {from: 'additional', to: 'divider', kind: 'relation'},
    {from: 'index', to: 'original', kind: 'relation'},
    {from: 'index', to: 'additional', kind: 'relation'},
    {from: 'index', to: 'calendar', kind: 'relation'},
  ],
  focusElement: 'divider',
  relationLabels: {relation: 'Relation (as supplied; no arrow)', communication: 'Communication (as supplied)', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (only as supplied)'},
  traversalOrder: ['additional', 'divider', 'original', 'index'],
  outcomes: {a: 'Original file unchanged in compartment A (as supplied)', b: 'New pieces kept in compartment B (as supplied)'},
  labels: {...RD_EN.labels, tracer: 'Tracer: follows the supplied order', focus: 'The focus element grows while the tracer is on it'},
};
const OWN_ES = {
  elements: [{id: 'index', label: 'Índice de las piezas (sin valoración)'}, {id: 'calendar', label: 'Calendario del expediente (sin fechas marcadas)'}],
  relationships: OWN_EN.relationships,
  focusElement: 'divider',
  relationLabels: {relation: 'Relación (según lo aportado; sin flecha)', communication: 'Comunicación (según lo aportado)', sequence: 'Secuencia según la configuración (ilustrativa)', causal: 'Vínculo causal (solo si se aporta)'},
  traversalOrder: OWN_EN.traversalOrder,
  outcomes: {a: 'Expediente original sin cambios en el compartimento A (según lo aportado)', b: 'Piezas nuevas en el compartimento B (según lo aportado)'},
  labels: {...RD_ES.labels, tracer: 'Marcador: sigue el orden aportado', focus: 'El elemento destacado crece mientras el marcador está en él'},
};
const EN = {...RD_EN, ...OWN_EN};
const ES = {...RD_ES, ...OWN_ES};

const mf = mechanismFields(IDS);
const sceneSchema = {
  ...rdFields,
  ...mf,
  elements: list('Labels of the index card and the calendar (ids fixed by the scene); the two bundles and the divider take their captions from `routes` unless an entry here overrides them', obj('Element', {
    id: oneOf('Element id', IDS),
    label: str('Visible label (in the legend, keyed by the element\'s glyph)', 90),
  }, ['id', 'label']), 0, IDS.length),
  relationLabels: obj('Caption of each relation kind in the legend', {
    relation: str('Caption for plain relations (no arrowhead)', 70),
    communication: str('Caption for communications', 70),
    sequence: str('Caption for sequence links (keep "as configured")', 70),
    causal: str('Caption for causal links (only when supplied)', 70),
  }, ['relation', 'communication', 'sequence', 'causal']),
  outcomes: obj('Captions of the two supplied states shown at the hold (● on bundle A, ◆ on bundle B — equal weight)', {
    a: str('Caption of ● (bundle A, as supplied)', 90),
    b: str('Caption of ◆ (bundle B, as supplied)', 90),
  }, ['a', 'b']),
  labels: obj('Editable captions', {
    heading: str('Heading of the panel (keep "as supplied")', 90),
    pieces: str('Caption introducing the list of new pieces', 70),
    key: str('Neutral key (must say that no conclusion is drawn)', 90),
    tracer: str('Caption of the tracer', 70),
    focus: str('Caption of the focus element', 90),
  }, ['heading', 'pieces', 'key', 'tracer', 'focus']),
};

const defaultParams = {...EN};
/** The localised defaults (tests resolve what a locale-'es' render shows). */
export const LOCALES = {en: EN, es: ES};

/** Template geometry (units) for a wide or a tall canvas: exploded and assembled boxes of the five elements. */
function mechGeometry(tall, ar) {
  const Wt = tall ? 720 : 1040, Ht = tall ? 1040 : 720;
  const E = {};
  if (!tall) {
    E.index = {x: 430, y: 34, w: 180, h: 150};
    E.calendar = {x: 880, y: 44, w: 84, h: 92};
    E.original = {x: 70, y: 262, w: 270, h: 210};
    E.additional = {x: 700, y: 262, w: 270, h: 210};
    E.divider = {x: 505, y: 248, w: 30, h: 238};
    E.box = {x: 50, y: 560, w: 940, h: 130};
  } else {
    E.index = {x: 250, y: 40, w: 220, h: 170};
    E.calendar = {x: 590, y: 52, w: 84, h: 92};
    E.original = {x: 34, y: 340, w: 262, h: 230};
    E.additional = {x: 424, y: 340, w: 262, h: 230};
    E.divider = {x: 345, y: 320, w: 30, h: 270};
    E.box = {x: 26, y: 800, w: 668, h: 150};
  }
  // (a box wider / taller than the canvas spreads the elements apart — the sizes stay — so the mechanism fills it)
  const ar0 = Wt / Ht;
  const sx = ar && ar > ar0 ? Math.min(1.6, ar / ar0) : 1;
  const sy = ar && ar < ar0 ? Math.min(1.45, ar0 / ar) : 1;
  if (sx > 1 || sy > 1) {
    const cx = Wt / 2, cy = Ht / 2;
    for (const id of Object.keys(E)) {
      const b = E[id];
      if (id === 'box') { E.box = {x: cx + (b.x - cx) * sx, y: cy + (b.y + b.h / 2 - cy) * sy - b.h / 2, w: b.w * sx, h: b.h}; continue; }
      E[id] = {...b, x: cx + (b.x + b.w / 2 - cx) * sx - b.w / 2, y: cy + (b.y + b.h / 2 - cy) * sy - b.h / 2};
    }
    for (const id of Object.keys(E)) E[id] = {...E[id], x: E[id].x + (Wt * sx - Wt) / 2, y: E[id].y + (Ht * sy - Ht) / 2};
  }
  const WtS = Wt * sx, HtS = Ht * sy;
  const slotX = E.box.x + E.box.w / 2;
  // assembled: the bundles and the plate sit down in the box, their lower part behind its front panel
  const down = b => E.box.y + E.box.h * 0.55 - (b.y + b.h);
  const asm = {original: down(E.original), additional: down(E.additional), divider: down(E.divider)};
  return {Wt: WtS, Ht: HtS, E, slotX, asm};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 820], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedRd(ctx, EN, ES);
    const R = resolveRd(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const labelOf = id => {
      const e = (P.elements || []).find(q => q.id === id);
      if (e) return e.label;
      return id === 'original' ? P.routes.original : id === 'additional' ? P.routes.additional : id === 'divider' ? P.routes.divider : id;
    };
    // relationships between known, distinct elements only (duplicates dropped)
    const rels = [];
    for (const q of P.relationships || []) {
      if (!IDS.includes(q.from) || !IDS.includes(q.to) || q.from === q.to) continue;
      if (rels.some(o => (o.from === q.from && o.to === q.to) || (o.from === q.to && o.to === q.from))) continue;
      rels.push(q);
    }
    const kinds = [...new Set(rels.map(q => q.kind))];
    const order = (P.traversalOrder || []).filter(q => IDS.includes(q)).filter((q, i, a) => i === 0 || a[i - 1] !== q);
    const glyphOf = {original: 'folderA', additional: 'folderB', divider: 'divider', index: 'index', calendar: 'calendar'};
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.labels.heading, name: 'heading'});
      // (compact: the decision sheet shares bundle A's row, the list of new pieces bundle B's)
      for (const id of IDS) {
        const text = id === 'original' ? `${labelOf(id)} — ${P.decisions.title}` : id === 'additional' ? `${labelOf(id)} — ${P.labels.pieces}: ${R.pieces.map(q => q.label).join(' · ')}` : labelOf(id);
        rows.push({kind: 'legend', glyphKind: glyphOf[id], text, name: `lg-${id}`});
      }
      rows.push({kind: 'legend', glyphKind: 'grounds', text: P.grounds, name: 'lg-grounds'});
      for (const k of kinds) rows.push({kind: 'legend', glyphKind: `kind-${k}`, text: P.relationLabels[k], name: `lg-kind-${k}`});
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'tracer', text: `${P.labels.tracer} · ${P.labels.focus}`, name: 'lg-tracer'});
    }
    if (showKey) {
      rows.push({kind: 'legend', glyphKind: 'started', text: P.outcomes.a, name: 'lg-sa'});
      rows.push({kind: 'legend', glyphKind: 'pending', text: P.outcomes.b, name: 'lg-sb'});
      rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    }
    const compose = (box, tall) => {
      const M = mechGeometry(tall, box.w / box.h);
      const k = Math.min(box.w / M.Wt, box.h / M.Ht);
      const ox = box.x + (box.w - M.Wt * k) / 2, oy = box.y + (box.h - M.Ht * k) * (box.y + box.h < ctx.design.h - 1 ? 1 : 0.5);
      return {M, k, ox, oy, problems: k < 0.3 ? ['room-tiny'] : [], planRect: {x: ox, y: oy, w: M.Wt * k, h: M.Ht * k}};
    };
    const search = (tall, sizes = [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4]) => searchSa(ctx, rows, {
      sizes, minF: 16.4, minPersonPx: 0,
      colFracs: [0.25, 0.3, 0.35, 0.39], bandCols: ctx.view.shape === 'square' ? [1, 2, 3] : [2, 3], sidePanels: [[0.38, 2], [0.44, 2], [0.5, 2]], bandMax: ctx.view.shape === 'square' ? 0.66 : 0.5,
      scales: [1], targetPx: 1e9, scoreOf: C => C.k * 400,
      compose: box => compose(box, tall),
    });
    let best = null, tall = false;
    for (const t of [false, true]) {
      const b = search(t);
      const sc = q => (q.problems.length ? -1000 : 0) + (q.F * px >= 19.5 - 1e-6 ? 500 : 0) + q.C.k * 400 + q.F * px * 3;
      if (!best || sc(b) > sc(best)) { best = b; tall = t; }
    }
    const share = b => b.C.planRect.w * b.C.planRect.h / (ctx.design.w * ctx.design.h);
    if (share(best) < 0.3) for (const t of [false, true]) {
      const b = search(t, [19.2, 18.5, 17.8, 17.1, 16.4]);
      if (!b.problems.length && share(b) > share(best) * 1.15) { best = b; tall = t; }
    }
    const C = compose(best.roomBox, tall);
    const {M, k} = C;
    const E = M.E;
    // connectors (template units), anchored to the elements' edges at their exploded places
    const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
    const conns = rels.map((q, i) => {
      const A = E[q.from], B = E[q.to];
      const from = edgeAnchor(A, center(B), 8);
      const to = edgeAnchor(B, center(A), q.kind === 'relation' ? 8 : 14);
      return {q, i, c: connector(ctx, {name: `ln${i}`, from, to, kind: q.kind, bend: (i % 2 ? -1 : 1) * 0.1, color: linkColor(ctx.theme, q.kind)})};
    });
    // tracer route along the supplied order (following a drawn relationship when one links two consecutive elements)
    const pts = [];
    const visits = [];
    order.forEach((id, j) => {
      if (j === 0) { pts.push(center(E[id])); visits.push({id, idx: 0}); return; }
      const prev = order[j - 1];
      const link = conns.find(x => (x.q.from === prev && x.q.to === id) || (x.q.from === id && x.q.to === prev));
      if (link) {
        const fwd = link.q.from === prev;
        for (let s = 0; s <= 30; s++) pts.push(link.c.at(fwd ? s / 30 : 1 - s / 30));
      } else {
        pts.push(edgeAnchor(E[prev], center(E[id]), 4));
        pts.push(edgeAnchor(E[id], center(E[prev]), 4));
      }
      pts.push(center(E[id]));
      visits.push({id, idx: pts.length - 1});
    });
    const route = pts.length > 1 ? polyline(pts) : null;
    let cum = 0;
    const cums = [0];
    for (let i = 1; i < pts.length; i++) { cum += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); cums.push(cum); }
    const visitT = visits.map(v => ({id: v.id, t: cum ? cums[v.idx] / cum : 0}));
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox]);
    return {P, R, F: best.F, px, C, M, k, conns, route, visitT, order, rels, kinds, lay: best.lay, tall, problems: [...best.problems], dyC, cols: best.cols, labelOf};
  },
  build(ctx, L) {
    const {C, M, R} = L;
    const E = M.E;
    const th = ctx.theme;
    const box = fileBoxArt(ctx, E.box, M.slotX);
    const pinR = 22;
    const el = (id, art) => g({name: `el-${id}`, transform: 'translate(0 0)'}, g({name: `el-${id}-k`, transform: 'scale(1)'}, art));
    const panel = L.lay ? L.lay.rows.map(m => rdRowNode(ctx, m, {name: m.name})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'mech', transform: `${T(C.ox, C.oy)} scale(${r(L.k, 5)})`},
        g({name: 'el-box-back'}, box.back),
        g({name: 'links'}, L.conns.map(x => x.c.node)),
        el('original', bundleArt(ctx, E.original, 'a', 3)),
        el('additional', bundleArt(ctx, E.additional, 'b', R.n)),
        el('divider', plateArt(E.divider)),
        g({name: 'el-box-front'}, box.front),
        el('index', indexCardArt(ctx, E.index, 3, R.n)),
        el('calendar', wallCalendar(ctx, {name: 'el-cal-art', cx: E.calendar.x + E.calendar.w / 2, cy: E.calendar.y + E.calendar.h / 2, R: E.calendar.h / 2.1})),
        g({name: 'pins'},
          statusDisc(ctx, {name: 'pin-a', kind: 'a', cx: E.original.x + E.original.w - pinR - 8, cy: E.original.y + pinR + 8, R: pinR, opacity: 0}),
          statusDisc(ctx, {name: 'pin-b', kind: 'b', cx: E.additional.x + E.additional.w - pinR - 8, cy: E.additional.y + pinR + 8, R: pinR, opacity: 0})),
        tracer(ctx, 'tracer', th.accent2)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {M, C, conns, route, visitT, P} = L;
    const E = M.E;
    const nodes = {};
    const e = ease.inOutCubic;
    // separate: the plate first, then the bundles rise out of their compartments
    const lift = {divider: e(seg(u, ...W.plate)), original: e(seg(u, ...W.bundles)), additional: e(seg(u, W.bundles[0] + 0.01, W.bundles[1]))};
    const tr = route ? route.at(e(seg(u, ...W.trace))) : null;
    const tq = seg(u, ...W.trace);
    // the focus element: from the tracer's visit on, larger; back to its size during the gather beat
    const fv = visitT.find(v => v.id === P.focusElement);
    const fIn = fv ? clamp((tq - fv.t + 0.08) / 0.08) : 0;
    const fK = 1 + (FOCUS_K - 1) * ease.inOutSine(fIn) * (1 - ease.inOutSine(seg(u, ...W.focusBack)));
    const pos = {};
    for (const id of ['original', 'additional', 'divider', 'index', 'calendar']) {
      const dy = id in M.asm ? M.asm[id] * (1 - lift[id]) : 0;
      const b = E[id];
      const kk = id === P.focusElement ? fK : 1;
      nodes[`el-${id}`] = {transform: T(0, dy)};
      nodes[`el-${id}-k`] = {transform: kk !== 1 ? scaleAbout(b.x + b.w / 2, b.y + b.h / 2, kk) : 'scale(1)'};
      pos[id] = {x: b.x + b.w / 2, y: b.y + b.h / 2 + dy};
    }
    // relationships, one after another
    const n = conns.length;
    const draw = conns.map((x, i) => seg(u, W.links[0] + ((W.links[1] - W.links[0]) * i) / Math.max(1, n), W.links[0] + ((W.links[1] - W.links[0]) * (i + 1)) / Math.max(1, n)));
    conns.forEach((x, i) => Object.assign(nodes, x.c.frame(draw[i], draw[i] > 0 ? 1 : 0)));
    const trOn = route && u >= W.trace[0] - 0.01 && u <= W.focusBack[1] ? Math.min(seg(u, W.trace[0] - 0.01, W.trace[0]), 1 - seg(u, W.focusBack[0], W.focusBack[1])) : 0;
    nodes.tracer = {transform: tr ? T(tr.x, tr.y) : T(0, 0), opacity: r(trOn, 3)};
    const pinK = seg(u, ...W.pins);
    nodes['pin-a'] = {opacity: r(pinK, 3)};
    nodes['pin-b'] = {opacity: r(pinK, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name === 'lg-sa' || mm.name === 'lg-sb') nodes[mm.name] = {opacity: r(seg(u, ...W.states), 3)};
    }
    const toD = mapper(C.ox, C.oy, L.k);
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const at = tr ? visitT.filter(v => v.t <= e(seg(u, ...W.trace)) + 1e-6).map(v => v.id) : [];
    return {
      nodes,
      semantic: {
        beat,
        lifted: Object.fromEntries(Object.entries(lift).map(([kk, v]) => [kk, r(v, 3)])),
        drawn: draw.map(v => r(v, 3)),
        rels: L.rels.map(q => `${q.from}-${q.kind}-${q.to}`),
        ends: conns.map(x => ({from: x.q.from, to: x.q.to, a: R2(toD(x.c.from)), b: R2(toD(x.c.to))})),
        boxes: Object.fromEntries(['original', 'additional', 'divider', 'index', 'calendar'].map(id => [id, (() => { const b = E[id]; const q = toD({x: b.x, y: b.y}); return {x: r(q.x), y: r(q.y), w: r(b.w * L.k), h: r(b.h * L.k)}; })()])),
        tracer: tr ? R2(toD(tr)) : null,
        tracerOn: r(trOn, 3),
        visited: at,
        order: L.order,
        focus: P.focusElement,
        focusK: r(fK, 3),
        divider: R2(toD(pos.divider)),
        original: R2(toD(pos.original)),
        additional: R2(toD(pos.additional)),
        pins: r(pinK, 3),
        arrows: L.rels.filter(q => q.kind !== 'relation').length,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        k: r(L.k, 3),
        tall: L.tall,
        cols: L.cols,
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
    slug: 'review-05-mechanism',
    title: 'Document review — an exploded file box: the original file and the new pieces lift apart on either side of a neutral divider; only the supplied relationships are traced (as supplied)',
    titleEs: 'Revisión de documentos — Mecanismo o relación explicada',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Revisión de documentos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'A fictional two-compartment file box seen face-on is exploded: the divider plate lifts out of its slot, the original file (with a placeholder decision sheet) and the proposed additional pieces rise out of their own compartments on either side of it; the index card and a blank calendar hang above. Only the supplied relationships are drawn edge to edge (plain relations without arrowheads); a tracer follows the supplied order while the focus element grows; the supplied states ● / ◆ appear on the two bundles with equal weight. Illustrative; no admissibility rule, assessment, causation by default, time limit or outcome; jurisdiction unspecified.',
    tags: ['review', 'document review', 'mechanism', 'exploded view', 'file box', 'compartments', 'divider', 'relationships', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/revision-de-documentos.js', 'src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
