/**
 * LAW-0310 — Pausa de audiencia · mechanism
 *
 * Storyboard (an exploded plan of the generic hearing room: the pieces that
 * take part when the session time stops while the actors keep their
 * positions are separated, the relationships supplied between them are drawn,
 * and a tracer runs through them):
 *  0.00–0.18  separate: the wall clock and the exhibit cabinet rise out of their
 *             places to a band above the room; the session panel (its session
 *             clock running), the operator at the lectern and the participants
 *             stay.
 *  0.18–0.43  only the explicit relationships are drawn, one after the other,
 *             edge to edge, each with its kind's caption (a plain relation has
 *             end dots and no arrowhead; a causal link only when supplied).
 *  0.43–0.75  a tracer runs along the relationships in the supplied traversal
 *             order; the element it reaches enlarges. Once it reaches the panel,
 *             the session clock slows down and stops at the supplied time with
 *             its pause badge (● session active is its plate); the wall clock,
 *             lifted, keeps running.
 *  0.75–1.00  gather: the recess card comes out at the operator's side to its
 *             place, a connector draws from the clock to it (◆ recess, as
 *             supplied) and floor rings mark the kept positions; the same neutral
 *             frame round both places; key "as supplied · no conclusion drawn".
 *             No rule on recesses, duration, time limit or consequence.
 * @module animations/hearings/LAW-0310
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  localised, pxPerUnit, measureRow, layoutRows, R2, fitG, textAt, overlaps, placeLabels, centreShiftY, FONT,
} from './kits/apertura-audiencia.js';
import {fitM, measureRowM} from './kits/interrogatorio-directo.js';
import {pzFields, PZ_EN, PZ_ES, resolvePz, pzRows, pzRowNode, pzRoom, pzTiming, pzStageAt, composePz, personBox} from './kits/pausa-audiencia.js';
import {PERSON} from '../courts/kits/courts-art.js';

const ID = 'LAW-0310';
// (the clocks that keep running — the wall clock, a session that stays active — come to rest at CLOCK_END: the last
// frames are a still hold)
const CLOCK_END = 0.94;
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.4], trace: [0.4, 0.75], gather: [0.75, 1]};
// (the trace is short so that the session clock, which stops once the tracer has reached the panel, has time to stop,
// the recess card to come out and be connected and the positions to be marked)
const W = {lift: [0.02, 0.13], labels: [0.12, 0.17], relate: [0.18, 0.39], trace: [0.41, 0.63], docEnd: 0.86, frames: [0.87, 0.92]};
const IDS = ['room', 'operator', 'board', 'clock', 'exhibit', 'participants'];
const LIFTED = ['clock', 'exhibit'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const OWN_EN = {
  elements: [
    {id: 'room', label: 'The room (fictional)'},
    {id: 'operator', label: 'Participant A at the lectern'},
    {id: 'board', label: 'Session panel: clock and recess card'},
    {id: 'clock', label: 'Wall clock (support, keeps running)'},
    {id: 'exhibit', label: 'Exhibit cabinet (as supplied)'},
    {id: 'participants', label: 'Participants at the shared table'},
  ],
  relationships: [
    {from: 'exhibit', to: 'board', kind: 'relation'},
    {from: 'board', to: 'participants', kind: 'communication'},
  ],
  focusElement: 'board',
  relationLabels: {relation: 'Linked as configured (as supplied)', communication: 'Shown to them (as supplied)', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['exhibit', 'board', 'participants'],
};
const OWN_ES = {
  elements: [
    {id: 'room', label: 'La sala (ficticia)'},
    {id: 'operator', label: 'Participante en el atril'},
    {id: 'board', label: 'Panel de sesión: reloj y tarjeta'},
    {id: 'clock', label: 'Reloj de pared (soporte)'},
    {id: 'exhibit', label: 'Armario de pruebas (aportado)'},
    {id: 'participants', label: 'Participantes en la mesa común'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'board',
  relationLabels: {relation: 'Vinculado según lo configurado (aportado)', communication: 'Se les muestra (aportado)', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal (aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...PZ_EN, ...OWN_EN};
const ES = {...PZ_ES, ...OWN_ES};

const sceneSchema = {
  ...pzFields,
  elements: list('Labels of the pieces of the mechanism; ids are fixed by the scene, labels are editable', obj('Element', {
    id: oneOf('Element id', IDS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, 7),
  relationships: list('Explicit relationships between pieces; the kind controls the line (a plain relation has no arrowhead; causal only when supplied)', obj('Relationship', {
    from: oneOf('Source element', IDS),
    to: oneOf('Target element', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', KINDS),
  }, ['from', 'to', 'kind']), 1, 6),
  focusElement: oneOf('Element enlarged most when the tracer reaches it', IDS),
  relationLabels: obj('Caption of each relation kind', {
    relation: str('Caption for plain relations', 50),
    communication: str('Caption for communications', 50),
    sequence: str('Caption for sequence links (keep "as configured")', 60),
    causal: str('Caption for supplied causal links', 50),
  }),
  traversalOrder: list('Order in which the tracer visits the elements (consecutive elements should be related)', oneOf('Element id', IDS), 2, 8),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolvePz(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const label = id => ((P.elements.find(e => e.id === id) || {}).label ?? null);
    const present = new Set(P.elements.map(e => e.id).filter(id => (id !== 'exhibit' || R.exhibits.length) && (id !== 'participants' || R.listeners.length)));
    const rels = P.relationships.filter(q => q.from !== q.to && present.has(q.from) && present.has(q.to));
    // ---- panel rows
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
      // (the plate and the recess caption are drawn on the panel only: never twice)
      rows.push(...pzRows(R, P));
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
    }
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});

    const memo = {};
    // (a supplied link between the operator and the panel needs floor between them for its caption: the operator
    // stands further from the panel — `qGap`, template units)
    const qGap = rels.some(q => [q.from, q.to].includes('operator') && [q.from, q.to].includes('board')) ? 120 : 0;
    const compose = (area, F, scale, bandF, leftSide = false) => {
      const problems = [];
      const bandH = area.h * bandF;
      const box = {x: area.x, y: area.y + bandH, w: area.w, h: area.h - bandH};
      // (the lectern stands a little in from the left wall: its link to the table keeps free floor beside it for its caption)
      // (scale > 1: extra floor under the table for the labels and captions; the composed room is memoised)
      const mk = `${r(box.x)},${r(box.y)},${r(box.w)},${r(box.h)},${r(F, 3)},${scale}`;
      const C = memo[mk] || (memo[mk] = composePz(ctx, P, R, box, F, {scale: 1, extraH: (scale - 1) * 700, chips: false, text: showKey, align: {x: 0.5, y: 0}, lifted: true, qGap}));
      problems.push(...C.problems);
      const G = C.G, k = C.k;
      const toD = C.toD, bD = C.bD;
      const bandTopT = (area.y - C.oy) / k;
      const labelRowT = showKey ? (F * 1.18 * 2 + F * 0.8 + 10) / k : 10 / k;
      const liftY = b => bandTopT + labelRowT - b.y;
      // (the cabinet's box includes its exhibits' numbers, beside it on the left)
      const nb = G.Ft ? G.Ft * 1.9 : 0;
      const homes = {
        clock: {x: G.clock.cx - G.clock.R, y: G.clock.cy - G.clock.R, w: 2 * G.clock.R, h: 2 * G.clock.R},
        cab: G.cab ? {x: G.cab.x - nb, y: G.cab.y, w: G.cab.w + nb, h: G.cab.h} : null,
      };
      // lifted pieces along the band in a fixed order, each in a slot at least as wide as its label so the label stands
      // over its own piece
      const order = (leftSide ? [['cab', G.cab], ['clock', homes.clock]] : [['clock', homes.clock], ['cab', G.cab]]).filter(([, b]) => b);
      const labW = key => {
        if (!showKey) return 0;
        const text = label(key === 'cab' ? 'exhibit' : key);
        if (!text) return 0;
        const ft = fitM(text, {maxWidth: 300 * 0.55 - F * 1.1, size: F, minSize: F, maxLines: 4, weight: 600});
        return (ft.width + F * 1.1) / k + 30 / k;
      };
      const excess = order.map(([key, b]) => Math.max(0, labW(key) - b.w));
      const avail = G.W - order.reduce((acc, [, b]) => acc + b.w, 0) - 24 * (order.length + 1);
      const sumEx = excess.reduce((acc, w) => acc + w, 0);
      const fShare = sumEx > 0 ? clamp(avail / sumEx) : 0;
      const slots = order.map(([, b], i) => b.w + excess[i] * fShare);
      const gapT = Math.max(24, (G.W - slots.reduce((acc, w) => acc + w, 0)) / (order.length + 1));
      let cur = gapT;
      const lifts = {};
      order.forEach(([key, b], i) => { lifts[key] = {x: cur + (slots[i] - b.w) / 2 - b.x, y: liftY(b)}; cur += slots[i] + gapT; });
      const liftedBox = key => { const b = homes[key]; const l = lifts[key]; return b && l ? bD({x: b.x + l.x, y: b.y + l.y, w: b.w, h: b.h}) : null; };
      const partBox = R.listeners.length ? (() => { const bs = R.listeners.map(i => personBox(G.seats[i])); bs.push({x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2}); const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h)); return bD({x: x0, y: y0, w: x1 - x0, h: y1 - y0}); })() : null;
      const ph = PERSON.half - 6;
      const qx0 = Math.min(G.qHome.x - ph, G.lectern.cx - G.lectern.s / 2), qx1 = Math.max(G.qHome.x + ph, G.lectern.cx + G.lectern.s / 2);
      const qBox = {x: qx0, y: G.qHome.y - ph, w: qx1 - qx0, h: G.lectern.cy + G.lectern.s * 0.35 - (G.qHome.y - ph)};
      const boxes = {
        room: C.planRect,
        operator: bD(qBox),
        board: bD(G.board),
        clock: liftedBox('clock'),
        exhibit: G.cab ? liftedBox('cab') : null,
        participants: partBox,
      };
      // (nothing travels across the room in this motif: no corridor is reserved)
      const docWay = [];
      const lifted = LIFTED.filter(key => boxes[key] && present.has(key));
      for (const key of lifted) {
        const b = boxes[key];
        if (b.y < area.y - 1 || b.y + b.h > C.planRect.y - 8 || b.x < area.x - 1 || b.x + b.w > area.x + area.w + 1) problems.push(`band-${key}`);
      }
      for (let i = 0; i < lifted.length; i++) for (let j = i + 1; j < lifted.length; j++) if (overlaps(boxes[lifted[i]], boxes[lifted[j]], 16)) problems.push(`band-overlap-${lifted[i]}-${lifted[j]}`);
      // ---- connectors: straight segments from edge to edge; several links from one piece spread along its edge;
      // a link into the room lands on the room's top wall where no other link lands; inside the room a link lands on
      // the near edge of the table (the presentation table) or of the participants' group
      const outs = {};
      rels.forEach(rel => { (outs[rel.from] = outs[rel.from] || []).push(rel); });
      const ins = {};
      rels.forEach(rel => { (ins[rel.to] = ins[rel.to] || []).push(rel); });
      const spread = n => (n === 1 ? [0.5] : n === 2 ? [0.3, 0.7] : n === 3 ? [0.2, 0.5, 0.8] : Array.from({length: n}, (_, i) => (i + 1) / (n + 1)));
      const ends = [];
      const conns = rels.map((rel, ci) => {
        const A = boxes[rel.from], B = boxes[rel.to];
        if (!A || !B) return null;
        const fx = spread(outs[rel.from].length)[outs[rel.from].indexOf(rel)];
        const fin = spread(ins[rel.to].length)[ins[rel.to].indexOf(rel)];
        const contains = (o, q) => q.x >= o.x - 1 && q.y >= o.y - 1 && q.x + q.w <= o.x + o.w + 1 && q.y + q.h <= o.y + o.h + 1;
        let a, bpt;
        if (A.y + A.h <= B.y + 2 || contains(B, A)) {
          a = {x: A.x + A.w * fx, y: A.y + A.h};
          if (rel.to === 'room') {
            const cands = [0.12, 0.88, 0.3, 0.7, 0.5].map(f => ({x: B.x + B.w * f, y: B.y}));
            bpt = cands.sort((p1, p2) => Math.min(...ends.map(e => Math.abs(e.x - p2.x)), 1e9) - Math.min(...ends.map(e => Math.abs(e.x - p1.x)), 1e9))[0];
          } else if (rel.to === 'board') {
            // the board's top edge, at the spread fraction of its incoming links (vertical where possible)
            bpt = {x: clamp(a.x, B.x + B.w * 0.08, B.x + B.w * 0.92), y: B.y};
            if (ins.board.length > 1) bpt.x = clamp(lerp(B.x + B.w * 0.1, B.x + B.w * 0.9, fin), B.x + 14, B.x + B.w - 14);
          } else {
            bpt = {x: clamp(a.x, B.x + B.w * 0.18, B.x + B.w * 0.82), y: B.y};
            // (from the rail straight down: the place along the target's edge farthest from everybody else)
            if (rel.from === 'board') {
              const own = new Set([rel.to].flatMap(id => (id === 'operator' ? [R.presenter] : id === 'participants' ? R.listeners : [])));
              let bestX = bpt.x, bestD = -1;
              for (let q = 0; q <= 8; q++) {
                const x = clamp(B.x + B.w * (0.18 + 0.08 * q), A.x + 14, A.x + A.w - 14);
                const d = Math.min(1e9, ...C.people.filter((_, pi) => !own.has(pi)).map(pp => segDist({x, y: A.y + A.h}, {x, y: B.y}, {x: pp.x, y: pp.y, w: 0, h: 0}) - pp.rad));
                if (d > bestD) { bestD = d; bestX = x; }
              }
              bpt = {x: bestX, y: B.y};
              a = {x: bestX, y: A.y + A.h};
            }
          }
        } else if (B.y + B.h <= A.y + 2) {
          a = {x: A.x + A.w * fx, y: A.y};
          bpt = {x: clamp(a.x, B.x + 14, B.x + B.w - 14), y: B.y + B.h};
        } else {
          const y = (Math.max(A.y, B.y) + Math.min(A.y + A.h, B.y + B.h)) / 2;
          a = A.x + A.w <= B.x ? {x: A.x + A.w, y} : {x: A.x, y};
          bpt = A.x + A.w <= B.x ? {x: B.x, y} : {x: B.x + B.w, y};
        }
        ends.push(bpt, a);
        return {rel, pts: [a, bpt], poly: polyline([a, bpt]), i: ci};
      }).filter(Boolean);
      for (let i = 0; i < conns.length; i++) for (let j = i + 1; j < conns.length; j++) {
        const [p1, p2] = conns[i].pts, [q1, q2] = conns[j].pts;
        if (segDist(p1, p2, {x: q1.x, y: q1.y, w: 0, h: 0}) < 18 && segDist(p1, p2, {x: q2.x, y: q2.y, w: 0, h: 0}) < 18) problems.push(`links-parallel-${i}-${j}`);
      }
      // a line never crosses a person, a card or a chip
      const peopleD = C.people;
      // (the board's pieces are one element: no separate cards)
      const cardBoxes = [];
      for (const c of conns) {
        // (a link may touch the people of its own two elements: the operator, the seated participants)
        const own = new Set([c.rel.from, c.rel.to].flatMap(id => (id === 'operator' ? [R.presenter] : id === 'participants' ? R.listeners : [])));
        if (peopleD.some((q, pi) => !own.has(pi) && segDist(c.pts[0], c.pts[1], {x: q.x, y: q.y, w: 0, h: 0}) < q.rad + 2)) problems.push(`link-over-person-${c.i}`);
        if (cardBoxes.some(b => segHits(c.pts[0], c.pts[1], b, 2))) problems.push(`link-over-card-${c.i}`);
      }
      // ---- labels: element labels beside their piece, relation labels beside their line (never on it)
      const Fs = F;
      const chipOf = (text, maxW, weight = 600) => {
        const padX = Fs * 0.55, padY = Fs * 0.34;
        const vs = [maxW * 1.25, maxW, maxW * 0.75, maxW * 0.55, maxW * 0.44].map(mw => {
          const fit = fitM(text, {maxWidth: mw - padX * 2, size: Fs, minSize: Fs, maxLines: 4, weight});
          return {fit, w: fit.width + padX * 2, h: fit.height + padY * 2, padX, padY};
        }).filter(m => !m.fit.truncated);
        return vs.length ? vs : null;
      };
      const people = C.people;
      const roomObs = C.equip;
      const corridors = docWay;
      const obstacles = [...lifted.map(key => boxes[key]), ...cardBoxes, ...corridors];
      const chipsBoxes = [];
      const labels = [];
      const placed = [...chipsBoxes];
      const lineHits = (b, pad = 6) => conns.some(c => segHits(c.pts[0], c.pts[1], b, pad));
      // (the relation captions are placed first: they must stand beside their own line; element labels have more room)
      const relLabels = [];
      if (showAll) {
        for (const c of conns) {
          const text = P.relationLabels[c.rel.kind] || c.rel.kind;
          const vs = chipOf(text, 280, 600);
          if (!vs) { problems.push(`rel-${c.i}`); continue; }
          const [a, b] = c.pts;
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const tx = (b.x - a.x) / len, ty = (b.y - a.y) / len;
          const nx = -ty, ny = tx;
          let best = null;
          for (const v of vs) { if (best) break; for (const f of [0.5, 0.38, 0.62, 0.26, 0.74, 0.16, 0.84, 0.08, 0.92]) for (const side of [1, -1]) for (const off of [10, 20, 32, 48, 64]) for (const sl of [0, -0.3, 0.3]) {
            const mx = lerp(a.x, b.x, f), my = lerp(a.y, b.y, f);
            const ext = Math.abs(nx) * v.w / 2 + Math.abs(ny) * v.h / 2;
            const cx = mx + nx * side * (off + ext) + tx * sl * (Math.abs(tx) * v.w + Math.abs(ty) * v.h) * 0.5;
            const cy = my + ny * side * (off + ext) + ty * sl * (Math.abs(tx) * v.w + Math.abs(ty) * v.h) * 0.5;
            const bx = {x: cx - v.w / 2, y: cy - v.h / 2, w: v.w, h: v.h};
            if (bx.x < area.x || bx.y < area.y || bx.x + bx.w > area.x + area.w || bx.y + bx.h > area.y + area.h) continue;
            if (obstacles.some(q => overlaps(bx, q, 6)) || placed.some(q => overlaps(bx, q, 8))) continue;
            if (people.some(q => distBox(bx, q) < q.rad + 4) || (C.ellipse && ellipseHit(bx, C.ellipse))) continue;
            if (lineHits(bx, 4)) continue;
            const inRoom = overlaps(bx, C.planRect, 0);
            if (inRoom && !(bx.x >= C.bounds.x && bx.y >= C.bounds.y && bx.x + bx.w <= C.bounds.x + C.bounds.w && bx.y + bx.h <= C.bounds.y + C.bounds.h)) continue;
            if (inRoom && roomObs.some(q => overlaps(bx, q, 6))) continue;
            const dOwn = segDist(a, b, bx);
            if (dOwn > 66 / px) continue;
            const dOther = Math.min(1e9, ...conns.filter(q => q !== c).map(q => segDist(q.pts[0], q.pts[1], bx)));
            if (dOther - dOwn < 20 / px) continue;
            const cost = Math.abs(f - 0.5) * 20 + off * 0.4 + Math.abs(sl) * 8;
            if (!best || cost < best.cost) best = {box: bx, v, cost};
          } }
          if (!best) { problems.push(`rel-${c.i}`); continue; }
          placed.push(best.box);
          relLabels.push({i: c.i, kind: c.rel.kind, box: best.box, m: best.v});
        }
      }
      if (showKey) {
        const elItems = [];
        // (the room's own label is placed last: it may stand anywhere along a wall)
        for (const id of [...IDS.filter(q => q !== 'room'), 'room']) {
          if (!present.has(id) || !boxes[id]) continue;
          const vs = chipOf(label(id), 300, 700);
          if (!vs) { problems.push(`label-${id}`); continue; }
          const b = boxes[id];
          const inRoom = id === 'room' || id === 'participants' || id === 'board' || id === 'operator';
          elItems.push({key: `el-${id}`, id, variants: vs.map(v => ({...v, m: v})), anchor: id === 'room' ? {x: b.x + b.w * 0.5, y: b.y + b.h} : {x: b.x + b.w / 2, y: id === 'board' ? b.y + b.h : b.y + b.h / 2}, inRoom, room: id === 'room'});
        }
        const placeEls = order => {
          const out = [], boxesP = [], fails = [];
          for (const it of order) {
            const b = boxes[it.id];
            let best = null;
            for (const v of it.variants) {
              const cands = [];
              if (it.inRoom) {
                const inner = C.bounds;
                for (let y = inner.y + 4; y <= inner.y + inner.h - v.h - 4; y += 20) for (let x = inner.x + 4; x <= inner.x + inner.w - v.w - 4; x += 20) {
                  // (only near its own element — or, for the room, along a wall: fewer candidates, same choice)
                  if (it.room ? Math.min(x - inner.x, inner.x + inner.w - x - v.w, y - inner.y, inner.y + inner.h - y - v.h) > 44 : gapBox({x, y, w: v.w, h: v.h}, b) > 150) continue;
                  const pen = it.room
                    ? Math.min(x - inner.x, inner.x + inner.w - x - v.w, y - inner.y, inner.y + inner.h - y - v.h) * 0.6
                    : Math.hypot(Math.max(b.x - (x + v.w), 0, x - (b.x + b.w)), Math.max(b.y - (y + v.h), 0, y - (b.y + b.h))) * 0.8;
                  cands.push({x, y, w: v.w, h: v.h, v, pen});
                }
                // the board along the top wall may also carry its label just above that wall
                if (it.id === 'board') for (let x = b.x; x <= b.x + b.w - v.w; x += 20) cands.push({x, y: C.planRect.y - 8 - v.h, w: v.w, h: v.h, v, pen: 2, band: true});
              } else {
                for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) for (const sl of [0, -0.3, 0.3]) {
                  const x = dx ? (dx > 0 ? b.x + b.w + 10 : b.x - 10 - v.w) : b.x + b.w / 2 - v.w / 2 + sl * v.w;
                  const y = dy ? (dy > 0 ? b.y + b.h + 8 : b.y - 8 - v.h) : b.y + b.h / 2 - v.h / 2 + sl * v.h;
                  cands.push({x, y, w: v.w, h: v.h, v, pen: dy > 0 ? 60 : dx ? 12 : 0});
                }
                for (const y of [b.y - 8 - v.h, b.y + b.h + 8]) for (const x of [b.x, b.x + b.w - v.w, area.x, area.x + area.w - v.w]) cands.push({x, y, w: v.w, h: v.h, v, pen: (y > b.y ? 60 : 0) + 4});
              }
              for (const cb of cands) {
                const bx = {x: cb.x, y: cb.y, w: cb.w, h: cb.h};
                if (bx.x < area.x || bx.y < area.y || bx.x + bx.w > area.x + area.w || bx.y + bx.h > area.y + area.h) continue;
                const inR = it.inRoom && !cb.band;
                if (!inR && overlaps(bx, C.planRect, 4)) continue;
                if (inR && !(bx.x >= C.bounds.x && bx.y >= C.bounds.y && bx.x + bx.w <= C.bounds.x + C.bounds.w && bx.y + bx.h <= C.bounds.y + C.bounds.h)) continue;
                if (obstacles.some(q => overlaps(bx, q, 6))) continue;
                if (inR && roomObs.some(q => overlaps(bx, q, 6))) continue;
                if (boxesP.some(q => overlaps(bx, q, 10)) || placed.some(q => overlaps(bx, q, 10))) continue;
                if (people.some(q => distBox(bx, q) < q.rad + 4)) continue;
                if (it.inRoom && C.ellipse && ellipseHit(bx, C.ellipse)) continue;
                if (lineHits(bx, 12)) continue;
                if (!it.inRoom) {
                  const cx = bx.x + bx.w / 2, dOwn = Math.abs(cx - (b.x + b.w / 2)), gOwn = gapBox(bx, b);
                  if (lifted.some(k2 => k2 !== it.id && (gapBox(bx, boxes[k2]) < gOwn + 6 / px || Math.abs(cx - (boxes[k2].x + boxes[k2].w / 2)) < dOwn + 24 / px))) continue;
                  // (nearer its own piece than any piece in the room, by >= 14 px)
                  if (['operator', 'board', 'participants'].some(k2 => boxes[k2] && gapBox(bx, boxes[k2]) < gOwn + 14 / px)) continue;
                } else if (it.id !== 'room') {
                  // in the room: nearer its own element than any other element (edge to edge, >= 20 px)
                  const others = ['operator', 'board', 'participants', ...lifted].filter(k2 => k2 !== it.id && boxes[k2]);
                  if (others.some(k2 => gapBox(bx, boxes[k2]) < gapBox(bx, b) + 20 / px)) continue;
                }
                const cost = (cb.pen || 0) + Math.hypot(bx.x + bx.w / 2 - it.anchor.x, bx.y + bx.h / 2 - it.anchor.y) * 0.05;
                if (!best || cost < best.cost) best = {box: bx, v: cb.v, cost};
              }
              if (best) break;
            }
            if (!best) { fails.push(`label-${it.id}`); continue; }
            boxesP.push(best.box);
            out.push({key: it.key, id: it.id, box: best.box, m: best.v.m || best.v});
          }
          return {out, boxesP, fails};
        };
        const byBand = [...elItems].sort((p1, p2) => (p1.inRoom - p2.inRoom) || (boxes[p1.id].x - boxes[p2.id].x));
        let res = placeEls(elItems);
        if (res.fails.length) { const r2 = placeEls(byBand); if (r2.fails.length < res.fails.length) res = r2; }
        labels.push(...res.out);
        placed.push(...res.boxesP);
        problems.push(...res.fails);
      }
      // number badges beside each participant (keyed to the panel), placed before the relation labels
      const badgeR = F * 0.78;
      let badges = [];
      if (showKey) {
        const posOf = i => G.seats[i];
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: toD(posOf(sp.index)), rad: C.rad, rim: C.rad * 0.8, prefer: sp.index === R.presenter ? 0 : G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: C.people, boxes: [...C.equip, ...Object.values(homes).filter(Boolean).map(b => bD({x: b.x - 6, y: b.y - 6, w: b.w + 12, h: b.h + 12})), ...placed, ...cardBoxes, ...corridors, ...conns.flatMap(c => Array.from({length: 13}, (_, q) => ({x: lerp(c.pts[0].x, c.pts[1].x, q / 12) - 3, y: lerp(c.pts[0].y, c.pts[1].y, q / 12) - 3, w: 6, h: 6})))], ellipse: C.ellipse || {c: {x: -1e5, y: -1e5}, a: 1, b: 1}, anchors: R.speakers.map(sp => toD(posOf(sp.index)))});
        badges = res.labels;
        for (const f of res.fails) problems.push(`badge-${f}`);
        badges.forEach(b => placed.push(b.box));
        for (const c of conns) if (badges.some(b => segHits(c.pts[0], c.pts[1], b.box, 4))) problems.push(`link-over-badge-${c.i}`);
      }
      return {C, problems, boxes, lifts, homes, conns, labels, relLabels, badges, badgeR, bandH, area, box};
    };
    // ---- search: panel (column or band), band share, room scale, side; per combination the largest text size
    const sizes = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4];
    const arrangements = [];
    if (!rows.length) arrangements.push(() => ({lay: null, area: {x: 0, y: 0, w: D.w, h: D.h}}));
    else {
      if (shape !== 'portrait') for (const cf of shape === 'square' ? [0.28, 0.32, 0.36, 0.4] : [0.24, 0.28, 0.32]) arrangements.push(F => {
        const pw = D.w * cf;
        const ms = rows.map(rw => measureRowM(rw, F, pw));
        const probe = layoutRows(ms, {x: 0, y: 0, w: pw, h: 1e6}, F, 1, 28);
        if (!probe.ok || probe.usedH > D.h) return null;
        const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
        return {lay: layoutRows(ms, panelBox, F, 1, 28), area: {x: 0, y: 0, w: D.w - pw - 30, h: D.h}};
      });
      if (shape !== 'landscape') for (const cols of [2, 3]) arrangements.push(F => {
        const colW = (D.w - 28 * (cols - 1)) / cols;
        const ms = rows.map(rw => measureRowM(rw, F, colW));
        const probe = layoutRows(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, cols, 28);
        if (!probe.ok || probe.usedH > D.h * 0.4) return null;
        const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
        return {lay: layoutRows(ms, panelBox, F, cols, 28), area: {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - 30}};
      });
    }
    let best = null;
    const log = [];
    // (compositions are memoised: the second floor pass only re-checks the people floor)
    const cmemo = new Map();
    const evalAt = (arr, i, bandF, scale, left) => {
      const Fpx = sizes[i], F = Fpx / px;
      const key = `${arrangements.indexOf(arr)}|${i}|${bandF}|${scale}|${left}`;
      let hit = cmemo.get(key);
      if (hit === undefined) {
        const A = arr(F);
        hit = A ? {A, c: compose(A.area, F, scale, bandF, left)} : null;
        cmemo.set(key, hit);
      }
      if (!hit) return null;
      const A = hit.A;
      const c = {...hit.c, problems: [...hit.c.problems]};
      const personPx = 100 * c.C.k * px;
      // standing floors: >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin)
      if (personPx < floorPx) c.problems.push('people-small');
      const score = -1000 * c.problems.length + (Fpx >= 19.5 ? 500 : 0) + Math.min(personPx, 110) + 3 * Fpx;
      log.push(`${Fpx} b${bandF} s${scale}${left ? 'L' : ''} ${personPx.toFixed(0)} ${c.problems.join('+')}`);
      const cand = {...c, F, lay: A.lay, score, personPx};
      if (!best || score > best.score) best = cand;
      return cand;
    };
    // standing floors: >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — only when nothing composes at 1:1
    // does the stress floor of 45 px apply
    let floorPx = shape === 'square' ? 56 : 61;
    for (const fl of shape === 'square' ? [56, 45] : [61]) {
      if (best && !best.problems.length) break;
      floorPx = fl;
      best = null;
      // (validity is not monotonic in the size here — larger captions may find other places — so the search anchors at
      // the baseline floor 19.8 px. In passes: every combination at 19.8 px first; then, above it, only the ones that
      // compose there; below it only when none does. A layout under 19.5 px scores >= 500 lower than any that composes at
      // 19.8 px, so the lower search is needed only then; far fewer compositions, and every combination is weighed at
      // 19.8 px before the early stop at 22.5 px.)
      const ok = c => c && !c.problems.length;
      const iB = sizes.indexOf(19.8);
      const combos = [];
      for (const arr of arrangements) for (const bandF of [0.24, 0.3, 0.36, 0.42]) for (const [scale, left] of [[1, false], [1, true], [1.2, false], [1.2, true], [1.4, false]]) combos.push([arr, bandF, scale, left]);
      const at19 = iB >= 0 ? combos.filter(([arr, bandF, scale, left]) => ok(evalAt(arr, iB, bandF, scale, left))) : [];
      if (at19.length) {
        for (const [arr, bandF, scale, left] of at19) {
          let lo = -1, hi = iB;
          if (ok(evalAt(arr, 0, bandF, scale, left))) hi = 0;
          else while (hi - lo > 1) {
            const mid = Math.max(0, (lo + hi) >> 1);
            const c = evalAt(arr, mid, bandF, scale, left);
            if (ok(c)) hi = mid; else lo = mid;
          }
          if (best && !best.problems.length && Math.abs(best.F * px - sizes[0]) < 0.05 && best.personPx >= 64) break;
        }
      } else {
        for (const [arr, bandF, scale, left] of combos) {
          if (!ok(evalAt(arr, sizes.length - 1, bandF, scale, left))) continue;
          let lo = iB >= 0 ? iB : 0, hi = sizes.length - 1;
          while (hi - lo > 1) {
            const mid = Math.max(0, (lo + hi) >> 1);
            const c = evalAt(arr, mid, bandF, scale, left);
            if (ok(c)) hi = mid; else lo = mid;
          }
        }
      }
    }
    if (!best) {
      // never throw from layout: the smallest text in the whole area, with its problems flagged
      const c = compose({x: 0, y: 0, w: D.w, h: D.h}, sizes[sizes.length - 1] / px, 1, 0.3, false);
      best = {...c, F: sizes[sizes.length - 1] / px, lay: null, score: -1e9, personPx: 100 * c.C.k * px};
      best.problems.push('panel-overflow');
    }
    const {C, F} = best;
    const G = C.G;
    const room = pzRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, tagFit: G.tagFit, capFit: G.capFit, lift: true});
    const liftPaths = {};
    const pathOf = pts => { const pl = polyline(pts); return {at: q => pl.at(clamp(q))}; };
    if (best.lifts.clock) { const l = best.lifts.clock; liftPaths.clock = pathOf([{x: 0, y: 0}, {x: 0, y: l.y}, {x: l.x, y: l.y}]); }
    if (best.lifts.cab && G.cab) {
      const l = best.lifts.cab;
      // the cabinet's path: along its own level, up a free column, then along the band — the first column along which
      // the moving cabinet never meets a person
      const cb = G.cab, cx0 = cb.x + cb.w / 2;
      // (the people and their number badges; the moving box includes the exhibits' numbers beside the cabinet)
      const ppl = [...R.speakers.map(sp => personBox(G.seats[sp.index])), ...(best.badges || []).map(b => ({x: (b.box.x - C.ox) / C.k, y: (b.box.y - C.oy) / C.k, w: b.box.w / C.k, h: b.box.h / C.k}))];
      const nbT = G.Ft ? G.Ft * 1.9 : 0;
      const hits = (x0, y0, x1, y1) => { for (let q = 0; q <= 24; q++) { const bx = {x: cb.x - nbT + lerp(x0, x1, q / 24) - 6, y: cb.y + lerp(y0, y1, q / 24) - 6, w: cb.w + nbT + 12, h: cb.h + 12}; if (ppl.some(pb => overlaps(pb, bx, 0))) return true; } return false; };
      const cols = [cx0];
      for (let x = cb.w / 2 + 14; x <= G.W - cb.w / 2 - 14; x += 24) cols.push(x);
      // (first, if needed, up or down to a free level; then left to the column; then up)
      let gapX = cols[0] - cx0, lvl = 0;
      const levels = [0]; for (let d = 6; d <= 240; d += 6) levels.push(-d, d);
      search: for (const dy of levels) for (const cx of cols) {
        const dx = cx - cx0;
        if (!hits(0, 0, 0, dy) && !hits(0, dy, dx, dy) && !hits(dx, dy, dx, l.y)) { gapX = dx; lvl = dy; break search; }
      }
      liftPaths.cab = pathOf([{x: 0, y: 0}, {x: 0, y: lvl}, {x: gapX, y: lvl}, {x: gapX, y: l.y}, {x: l.x, y: l.y}]);
    }
    // the tracer's route along the connectors, in the traversal order (a leg without a connector is flagged)
    const legs = [];
    const trav = (P.traversalOrder || []).filter(id => present.has(id));
    const problems = [...best.problems];
    for (let i = 1; i < trav.length; i++) {
      const a = trav[i - 1], b = trav[i];
      const c = best.conns.find(q => (q.rel.from === a && q.rel.to === b) || (q.rel.from === b && q.rel.to === a));
      if (!c) { problems.push(`traversal-${a}-${b}`); continue; }
      const pts = c.rel.from === a ? c.pts : [...c.pts].reverse();
      legs.push({a, b, pts, poly: polyline(pts), conn: c.i});
    }
    // the session clock slows down once the tracer has reached the panel (or at the trace's middle when it is not visited)
    const nLg = legs.length;
    const legSpan = (W.trace[1] - W.trace[0]) / Math.max(1, nLg);
    let visitB = null;
    legs.forEach((leg, j) => { if (visitB === null && leg.b === 'board') visitB = W.trace[0] + j * legSpan + legSpan * 0.8; if (visitB === null && j === 0 && leg.a === 'board') visitB = W.trace[0]; });
    const t0 = (visitB ?? W.trace[0] + 0.1) + 0.03;
    // (no hands in the exploded view: nobody signals; the clock stops on its own, the card comes out at the operator's side)
    const TM = pzTiming(t0 - 0.1 * (W.docEnd - t0) / 0.9, W.docEnd);
    const dyC = centreShiftY(ctx.design, [C.planRect, ...Object.values(best.boxes).filter(Boolean), ...best.labels.map(q => q.box), ...best.relLabels.map(q => q.box), ...(best.badges || []).map(q => q.box), ...(best.lay ? best.lay.rows.map(m => ({x: m.x, y: m.y, w: m.w, h: m.h})) : [])]);
    return {P, R, F, px, C, G, room, rows, lay: best.lay, ...best, problems, legs, trav, personPx: best.personPx, showKey, showAll, log, dyC, TM, liftPaths};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => pzRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    // the same neutral frame (stroke, colour, opacity) round both places on the panel — the session clock with its plate,
    // the recess card with its caption — each round its own place
    const G0 = L.G;
    const places = [G0.places.document, G0.places.detail];
    const frame = (name, q) => h('path', {name, opacity: 0, d: roundRectPath(q.x - 6, q.y - 6, q.w + 12, q.h + 12, 10), fill: 'none', stroke: th.accent3, 'stroke-width': r(5.5 / C.k, 2)});
    const col = kind => (kind === 'relation' ? th.inkSoft : kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.accent4 : th.ink);
    const homeOutline = (key, b) => (b ? h('rect', {name: `home-${key}`, x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 8, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, opacity: 0}) : null);
    const chip = (name, lb, stroke) => g({name, opacity: 0},
      h('path', {name: `${name}-body`, d: roundRectPath(lb.box.x, lb.box.y, lb.box.w, lb.box.h, Math.min(lb.box.h / 2, L.F * 0.7)), fill: th.card, stroke, 'stroke-width': 2.2}),
      textAt(lb.m.fit, lb.box.x + lb.m.padX, lb.box.y + lb.m.padY, th.ink));
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`},
        g({name: 'homes'}, homeOutline('clock', L.homes.clock), L.G.cab ? homeOutline('cab', L.homes.cab) : null),
        L.room.node, frame('fr-clock', places[0]), frame('fr-card', places[1])),
      L.conns.map(c => {
        const poly = c.poly;
        const end = c.pts[c.pts.length - 1], start = c.pts[0];
        const cc = col(c.rel.kind);
        const ends = c.rel.kind === 'relation' ? [h('circle', {cx: r(start.x), cy: r(start.y), r: 6, fill: cc}), h('circle', {cx: r(end.x), cy: r(end.y), r: 6, fill: cc})]
          : c.rel.kind === 'communication' ? [h('circle', {cx: r(start.x), cy: r(start.y), r: 6, fill: cc}), h('circle', {cx: r(end.x), cy: r(end.y), r: 7, fill: th.card, stroke: cc, 'stroke-width': 3})]
            : c.rel.kind === 'sequence' ? [h('rect', {x: r(start.x - 6), y: r(start.y - 6), width: 12, height: 12, fill: cc}), h('rect', {x: r(end.x - 6), y: r(end.y - 6), width: 12, height: 12, fill: cc})]
              : [h('circle', {cx: r(start.x), cy: r(start.y), r: 6, fill: cc}), causalHead(c.pts, cc)];
        return g({name: `conn${c.i}`, opacity: 0, 'data-from': c.rel.from, 'data-to': c.rel.to, 'data-kind': c.rel.kind},
          h('path', {name: `conn${c.i}-line`, 'data-draw': 1, d: poly.d(1), fill: 'none', stroke: cc, 'stroke-width': c.rel.kind === 'causal' ? 5 : 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(poly.total)} ${r(poly.total + 10)}`, 'stroke-dashoffset': r(poly.total)}),
          g({name: `conn${c.i}-ends`, opacity: 0}, ends));
      }),
      L.badges.map(b => g({name: b.key},
        h('circle', {cx: r(b.box.x + b.box.w / 2), cy: r(b.box.y + b.box.h / 2), r: r(L.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
        h('text', {x: r(b.box.x + b.box.w / 2), y: r(b.box.y + b.box.h / 2 + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(+b.key.slice(1) + 1)))),
      L.labels.map(lb => chip(lb.key, lb, th.ink)),
      L.relLabels.map(lb => chip(`rel${lb.i}`, lb, col(lb.kind))),
      h('circle', {name: 'tracer', r: 11, fill: th.accent3, stroke: '#ffffff', 'stroke-width': 3, opacity: 0}),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C} = L;
    const nodes = {};
    const liftP = ease.inOutCubic(seg(u, ...W.lift));
    const lift = {};
    // each lifted piece travels along its own path, clear of the people: the clock straight up the left wall, then
    // along the band; the cabinet along its level, up a free column clear of everybody,
    // then along the band
    for (const key of ['clock', 'cab']) {
      const pth = L.liftPaths[key];
      lift[key] = pth ? pth.at(liftP) : {x: 0, y: 0};
    }
    for (const key of ['clock', 'cab']) if (L.homes[key]) nodes[`home-${key}`] = {opacity: r(0.45 * liftP, 3)};
    const labP = seg(u, ...W.labels);
    L.labels.forEach(lb => { nodes[lb.key] = {opacity: r(labP, 3)}; });
    const nC = L.conns.length;
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, nC);
    L.conns.forEach((c, j) => {
      const p = seg(u, W.relate[0] + j * span, W.relate[0] + (j + 0.8) * span);
      nodes[`conn${c.i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`conn${c.i}-line`] = {'stroke-dashoffset': r(c.poly.total * (1 - ease.inOutSine(p)))};
      nodes[`conn${c.i}-ends`] = {opacity: r(seg(p, 0.85, 1), 3)};
      if (L.relLabels.find(q => q.i === c.i)) nodes[`rel${c.i}`] = {opacity: r(seg(u, W.relate[0] + (j + 0.6) * span, W.relate[0] + (j + 0.95) * span), 3)};
    });
    // tracer along the legs (shown only while travelling a leg)
    const nL = L.legs.length;
    const legSpan = (W.trace[1] - W.trace[0]) / Math.max(1, nL);
    let tracer = null, at = null;
    const visitU = {};
    L.legs.forEach((leg, j) => {
      const a0 = W.trace[0] + j * legSpan, a1 = a0 + legSpan * 0.8;
      visitU[leg.b] = visitU[leg.b] ?? a1;
      if (j === 0) visitU[leg.a] = visitU[leg.a] ?? a0;
      if (u >= a0 && u < a1) {
        const q = seg(u, a0, a1);
        const p = leg.poly.at(ease.inOutSine(q));
        tracer = {x: p.x, y: p.y};
      } else if (u >= a1 && u <= a0 + legSpan) at = leg.b;
    });
    nodes.tracer = tracer ? {cx: r(tracer.x), cy: r(tracer.y), opacity: 1} : {cx: 0, cy: 0, opacity: 0};
    const endU = W.trace[1];
    const vis = id => visitU[id] ?? endU;
    const pulseAt = (id, amt) => { const v = vis(id); return amt * Math.sin(Math.PI * seg(u, v - 0.02, v + 0.05)); };
    const grow = id => 1 + pulseAt(id, id === L.P.focusElement ? 0.12 : 0.06);
    const liftRec = {};
    for (const [key, id] of [['clock', 'clock'], ['cab', 'exhibit']]) {
      const b = L.homes[key];
      if (!b) continue;
      const s = grow(id);
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      liftRec[key] = {transform: `translate(${r(lift[key].x)} ${r(lift[key].y)}) ${scaleAbout(cx, cy, r(s, 4))}`};
    }
    // the pieces that stay in the room breathe in place when reached (the board with its places, the lectern)
    // (the panel grows about the middle of its lower edge: the links leaving that edge never pass under its plates)
    const bc = {x: G.board.x + G.board.w / 2, y: G.board.y + G.board.h};
    liftRec.board = {transform: scaleAbout(bc.x, bc.y, r(grow('board'), 4))};
    liftRec.lectern = {transform: scaleAbout(G.lectern.cx, G.lectern.cy, r(grow('operator'), 4))};
    // the session clock runs from the start; once the tracer has reached the panel it slows down and stops with its pause
    // badge, the recess card comes out at the operator's side, the connector is drawn, then the positions are marked; the
    // lifted wall clock keeps running throughout
    const st = pzStageAt(G, R, L.TM, u, {noHands: true});
    const fr = L.room.frame({clockDeg: 48 * Math.min(u, CLOCK_END), run: st.run, tag: 1, pause: st.pause, zoom: st.zoom, link: st.link, cap: st.cap, pins: st.pins, reach: null, lift: liftRec});
    Object.assign(nodes, fr.nodes);
    // gather: the same neutral frame round both places
    const frOp = st.link >= 1 ? seg(u, ...W.frames) : 0;
    nodes['fr-clock'] = {opacity: r(frOp, 3)};
    nodes['fr-card'] = {opacity: r(frOp, 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        lifted: r(liftP, 3),
        drawn: L.conns.map((c, j) => r(seg(u, W.relate[0] + j * span, W.relate[0] + (j + 0.8) * span), 3)),
        kinds: L.conns.map(c => c.rel.kind),
        tracer: tracer ? R2(tracer) : null,
        at,
        focus: L.P.focusElement,
        focusScale: r(grow(L.P.focusElement), 3),
        clockState: st.clockState,
        run: r(st.run, 4),
        minuteDeg: r(fr.minDeg, 2),
        pause: r(st.pause, 3),
        card: r(st.zoom, 3),
        link: r(st.link, 3),
        cardState: st.cardState,
        caption: r(st.cap, 3),
        pins: r(st.pins, 3),
        stopFrom: r(L.TM.stop[0], 4),
        frames: r(frOp, 3),
        ops: R.items.map(it => it.op),
        roles: {operator: R.presenter, listeners: R.listeners},
        activeI: R.docI,
        recessI: R.detI,
        order: R.order.join('>'),
        operatorIndex: R.presenter,
        trav: L.trav.join('>'),
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        allReached: fr.reached,
      },
    };
  },
};

/** Arrowhead at the end of a supplied causal link (the only kind with a head). */
function causalHead(pts, color) {
  const b = pts[pts.length - 1], a = pts[pts.length - 2];
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const L = 18, w = 9;
  const p1 = {x: b.x - Math.cos(ang) * L - Math.sin(ang) * w, y: b.y - Math.sin(ang) * L + Math.cos(ang) * w};
  const p2 = {x: b.x - Math.cos(ang) * L + Math.sin(ang) * w, y: b.y - Math.sin(ang) * L - Math.cos(ang) * w};
  return h('path', {d: `M${r(b.x)} ${r(b.y)}L${r(p1.x)} ${r(p1.y)}L${r(p2.x)} ${r(p2.y)}Z`, fill: color});
}

function gapBox(a, b) {
  return Math.hypot(Math.max(a.x - (b.x + b.w), 0, b.x - (a.x + a.w)), Math.max(a.y - (b.y + b.h), 0, b.y - (a.y + a.h)));
}

function distBox(b, p) {
  return Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h)));
}

function ellipseHit(b, e) {
  for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) {
    const x = b.x + (b.w * i) / 6, y = b.y + (b.h * j) / 6;
    if (((x - e.c.x) / (e.a + 6)) ** 2 + ((y - e.c.y) / (e.b + 6)) ** 2 <= 1) return true;
  }
  return false;
}

/** Does segment p–q pass through box b (+pad)? */
function segHits(p, q, b, pad = 0) {
  if (Math.max(p.x, q.x) < b.x - pad || Math.min(p.x, q.x) > b.x + b.w + pad || Math.max(p.y, q.y) < b.y - pad || Math.min(p.y, q.y) > b.y + b.h + pad) return false;
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const x = p.x + (q.x - p.x) * t, y = p.y + (q.y - p.y) * t;
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
  }
  return false;
}

/** Distance from a box to a segment (sampled). */
function segDist(p, q, b) {
  let d = Infinity;
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    d = Math.min(d, distBox(b, {x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t}));
  }
  return d;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'hearings-08-mechanism',
    title: 'Hearing pause — the pieces of stopping the session time while everybody keeps their place, and their relationships',
    titleEs: 'Pausa de audiencia — Mecanismo o relación explicada',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Pausa de audiencia',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded plan of the generic hearing room: the wall clock and the exhibit cabinet rise out of their places; the session panel with its running session clock, the operator at the lectern and the participants stay. Only the supplied relationships are drawn, edge to edge, with their kind. A tracer follows the supplied traversal; once it reaches the panel the session clock slows down and stops at the supplied, fictional time with a pause badge while the lifted wall clock keeps running; the recess card comes out at the operator\'s side, a connector links it to the clock (◆ recess, as supplied) and floor rings mark the kept positions; both places get the same neutral frame. Illustrative; no rule on recesses, duration, time limit or consequence is shown.',
    tags: ['hearing', 'recess', 'pause', 'session clock', 'mechanism', 'exploded plan', 'relationships', 'tracer', 'session panel', 'positions kept', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/pausa-audiencia.js', 'src/animations/hearings/kits/interrogatorio-directo.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
