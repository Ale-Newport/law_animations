/**
 * LAW-0286 — Exposición inicial · mechanism
 *
 * Storyboard (an exploded plan of the generic hearing room: the pieces that
 * take part in laying out the facts and questions are lifted out of their
 * places, the relationships supplied between them are drawn, and a tracer runs
 * through them):
 *  0.00–0.18  separate: the wall clock and the exhibit cabinet rise out of
 *             their places to a band above the room; a faint outline keeps each
 *             one's home place. The lectern (with its stack of folded slips),
 *             the presentation table along the top wall and the participants
 *             stay in the room. Each piece gets its supplied label.
 *  0.18–0.43  only the explicit relationships are drawn, one after the other,
 *             edge to edge, each with its kind's caption: a plain relation has
 *             end dots and no arrowhead; communication and sequence are solid
 *             with their own end marks ("sequence as configured, illustrative");
 *             a causal link appears only when supplied.
 *  0.43–0.75  a tracer runs along the relationships in the supplied traversal
 *             order; the element it reaches enlarges (the focus element most).
 *             As it passes, the element's own state changes: when it reaches the
 *             table the slips travel from the lectern to their places and unfold
 *             into the cards (in the configured sequence), each fact with its
 *             supplied ● / ◆ state; when the exhibit is reached (or at the end)
 *             each support is linked to the exhibit it refers to.
 *  0.75–1.00  gather: origin (the home outlines and the lectern), the drawn
 *             relationships and the resulting state (every card open, each
 *             support linked to its exhibit) stay in view with the key "as
 *             supplied · no conclusion drawn". Nothing is assessed.
 * @module animations/hearings/LAW-0286
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
import {
  expoFields, EXPO_EN, EXPO_ES, resolveExpo, composeExpo, expoRoom, expoRowNode, expoObstacles, personBox, CUE_ROW, SLIP,
  fitM, measureRowM,
} from './kits/exposicion-inicial.js';

const ID = 'LAW-0286';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {lift: [0.02, 0.13], labels: [0.12, 0.17], relate: [0.18, 0.42], trace: [0.44, 0.74]};
const IDS = ['room', 'lectern', 'ledge', 'clock', 'exhibit', 'participants'];
const LIFTED = ['clock', 'exhibit'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];

const OWN_EN = {
  elements: [
    {id: 'room', label: 'The room (fictional)'},
    {id: 'lectern', label: 'Lectern with the folded slips'},
    {id: 'ledge', label: 'Presentation table: facts and questions'},
    {id: 'clock', label: 'Wall clock (support)'},
    {id: 'exhibit', label: 'Exhibit cabinet'},
    {id: 'participants', label: 'Participants at the shared table'},
  ],
  relationships: [
    {from: 'lectern', to: 'ledge', kind: 'sequence'},
    {from: 'ledge', to: 'participants', kind: 'communication'},
    {from: 'exhibit', to: 'ledge', kind: 'relation'},
  ],
  focusElement: 'ledge',
  relationLabels: {relation: 'Linked (as supplied)', communication: 'Shown to', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['lectern', 'ledge', 'participants'],
};
const OWN_ES = {
  elements: [
    {id: 'room', label: 'La sala (ficticia)'},
    {id: 'lectern', label: 'Atril con las hojas plegadas'},
    {id: 'ledge', label: 'Mesa de exposición: hechos y preguntas'},
    {id: 'clock', label: 'Reloj de pared (soporte)'},
    {id: 'exhibit', label: 'Armario de pruebas'},
    {id: 'participants', label: 'Participantes en la mesa común'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'ledge',
  relationLabels: {relation: 'Vinculado (según lo aportado)', communication: 'Se muestra a', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal (según lo aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...EXPO_EN, ...OWN_EN};
const ES = {...EXPO_ES, ...OWN_ES};

const sceneSchema = {
  ...expoFields,
  elements: list('Labels of the pieces of the mechanism; ids are fixed by the scene, labels are editable', obj('Element', {
    id: oneOf('Element id', IDS),
    label: str('Visible label', 50),
  }, ['id', 'label']), 2, 6),
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
    const R = resolveExpo(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const label = id => ((P.elements.find(e => e.id === id) || {}).label ?? null);
    const present = new Set(P.elements.map(e => e.id).filter(id => id !== 'exhibit' || R.exhibits.length));
    const rels = P.relationships.filter(q => q.from !== q.to && present.has(q.from) && present.has(q.to));
    // ---- panel rows
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
      if (R.items.some(it => it.state === 'claim')) rows.push({kind: 'legend', glyphKind: CUE_ROW.claim, text: P.states.claim, name: 'lg-claim'});
      if (R.items.some(it => it.state === 'support')) rows.push({kind: 'legend', glyphKind: CUE_ROW.support, text: P.states.support, name: 'lg-support'});
      if (R.items.some(it => it.kind === 'question')) rows.push({kind: 'legend', glyphKind: 'question', text: P.labels.question, name: 'lg-question'});
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
    }
    if (showKey) rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});

    const memo = {};
    const compose = (area, F, scale, bandF, leftSide = false) => {
      const problems = [];
      const bandH = area.h * bandF;
      const box = {x: area.x, y: area.y + bandH, w: area.w, h: area.h - bandH};
      // (the lectern stands a little in from the left wall: its link to the table keeps free floor beside it for its caption)
      // (scale > 1: extra floor under the table for the labels and captions; the composed room is memoised)
      const mk = `${r(box.x)},${r(box.y)},${r(box.w)},${r(box.h)},${r(F, 3)},${scale}`;
      const C = memo[mk] || (memo[mk] = composeExpo(ctx, P, R, box, F, {scale: 1, extraH: (scale - 1) * 700, chips: false, cardText: showKey, align: {x: 0.5, y: 0}, walkway: false, tethers: false, homeShift: 0, clockAt: 'right',
        // (the presenter and the lectern stand further from the table: the link between them gets free floor for its caption)
        homeDrop: showAll ? 110 : 0}));
      problems.push(...C.problems);
      const G = C.G, k = C.k;
      const toD = C.toD, bD = C.bD;
      const bandTopT = (area.y - C.oy) / k;
      const labelRowT = showKey ? (F * 1.18 * 2 + F * 0.8 + 10) / k : 10 / k;
      const liftY = b => bandTopT + labelRowT - b.y;
      const lecBox = {x: G.lectern.cx - G.lectern.s / 2 - 4, y: G.lectern.cy - G.lectern.s * 0.35 - 22, w: G.lectern.s + 8, h: G.lectern.s * 0.7 + 26};
      const homes = {
        lectern: lecBox,
        clock: {x: G.clock.cx - G.clock.R, y: G.clock.cy - G.clock.R, w: 2 * G.clock.R, h: 2 * G.clock.R},
        cab: G.cab,
      };
      // lifted pieces along the band in a fixed order (lectern, clock, cabinet), each in a slot at least as wide as its
      // label so the label stands over its own piece
      // (the lectern stays in the room, beside the walkway: it is where the slips come from)
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
      const partBox = (() => { const bs = R.listeners.map(i => personBox(G.seats[i])); bs.push({x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2}); const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h)); return bD({x: x0, y: y0, w: x1 - x0, h: y1 - y0}); })();
      const boxes = {
        room: C.planRect,
        lectern: bD(lecBox),
        clock: liftedBox('clock'),
        exhibit: G.cab ? liftedBox('cab') : null,
        ledge: bD(G.ledge),
        participants: partBox,
      };
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
          } else if (rel.to === 'ledge') {
            // the ledge's back edge, at the spread fraction of its incoming links (vertical where possible)
            bpt = {x: clamp(a.x, B.x + B.w * 0.08, B.x + B.w * 0.92), y: B.y};
            if (ins.ledge.length > 1) bpt.x = clamp(lerp(B.x + B.w * 0.1, B.x + B.w * 0.9, fin), B.x + 14, B.x + B.w - 14);
          } else {
            bpt = {x: clamp(a.x, B.x + B.w * 0.18, B.x + B.w * 0.82), y: B.y};
          }
          if (rel.from === 'ledge') a = {x: clamp(bpt.x, A.x + A.w * 0.55, A.x + A.w - 14), y: A.y + A.h};
        } else if (B.y + B.h <= A.y + 2) {
          a = {x: A.x + A.w * fx, y: A.y};
          bpt = {x: clamp(a.x, B.x + 14, B.x + B.w - 14), y: B.y + B.h};
        } else {
          const y = (Math.max(A.y, B.y) + Math.min(A.y + A.h, B.y + B.h)) / 2;
          a = A.x + A.w <= B.x ? {x: A.x + A.w, y} : {x: A.x, y};
          bpt = A.x + A.w <= B.x ? {x: B.x, y} : {x: B.x + B.w, y};
        }
        // the lectern and the table: from the lectern's far side, clear of the presenter standing behind it
        const pair = [rel.from, rel.to].sort().join('+');
        if (pair === 'lectern+ledge') {
          const L0 = boxes.lectern, Lg = boxes.ledge;
          const pL = {x: L0.x + L0.w, y: L0.y + L0.h * 0.6}, pG = {x: Math.min(Lg.x + Lg.w * 0.5, L0.x + L0.w + 150 * k), y: Lg.y + Lg.h};
          [a, bpt] = rel.from === 'lectern' ? [pL, pG] : [pG, pL];
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
      const cardBoxes = R.items.map(it => bD(G.slots[it.i]));
      for (const c of conns) {
        if (peopleD.some(q => segDist(c.pts[0], c.pts[1], {x: q.x, y: q.y, w: 0, h: 0}) < q.rad + 2)) problems.push(`link-over-person-${c.i}`);
        if (cardBoxes.some(b => segHits(c.pts[0], c.pts[1], b, 2))) problems.push(`link-over-card-${c.i}`);
      }
      // ---- labels: element labels beside their piece, relation labels beside their line (never on it)
      const Fs = F;
      const chipOf = (text, maxW, weight = 600) => {
        const padX = Fs * 0.55, padY = Fs * 0.34;
        const vs = [maxW, maxW * 0.75, maxW * 0.55, maxW * 0.44].map(mw => {
          const fit = fitM(text, {maxWidth: mw - padX * 2, size: Fs, minSize: Fs, maxLines: 4, weight});
          return {fit, w: fit.width + padX * 2, h: fit.height + padY * 2, padX, padY};
        }).filter(m => !m.fit.truncated);
        return vs.length ? vs : null;
      };
      const people = C.people;
      const roomObs = C.equip;
      const obstacles = [...lifted.map(key => boxes[key]), ...cardBoxes];
      const chipsBoxes = [];
      const labels = [];
      const placed = [...chipsBoxes];
      const lineHits = (b, pad = 6) => conns.some(c => segHits(c.pts[0], c.pts[1], b, pad));
      if (showKey) {
        const elItems = [];
        // (the room's own label is placed last: it may stand anywhere along a wall)
        for (const id of [...IDS.filter(q => q !== 'room'), 'room']) {
          if (!present.has(id) || !boxes[id]) continue;
          const vs = chipOf(label(id), 300, 700);
          if (!vs) { problems.push(`label-${id}`); continue; }
          const b = boxes[id];
          const inRoom = id === 'room' || id === 'participants' || id === 'ledge' || id === 'lectern';
          elItems.push({key: `el-${id}`, id, variants: vs.map(v => ({...v, m: v})), anchor: id === 'room' ? {x: b.x + b.w * 0.5, y: b.y + b.h} : {x: b.x + b.w / 2, y: id === 'ledge' ? b.y + b.h : b.y + b.h / 2}, inRoom, room: id === 'room'});
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
                // the table along the top wall may also carry its label just above that wall
                if (it.id === 'ledge') for (let x = b.x; x <= b.x + b.w - v.w; x += 20) cands.push({x, y: C.planRect.y - 8 - v.h, w: v.w, h: v.h, v, pen: 2, band: true});
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
                if (it.inRoom && ellipseHit(bx, C.ellipse)) continue;
                if (lineHits(bx, 12)) continue;
                if (!it.inRoom) {
                  const cx = bx.x + bx.w / 2, dOwn = Math.abs(cx - (b.x + b.w / 2)), gOwn = gapBox(bx, b);
                  if (lifted.some(k2 => k2 !== it.id && (gapBox(bx, boxes[k2]) < gOwn + 6 / px || Math.abs(cx - (boxes[k2].x + boxes[k2].w / 2)) < dOwn + 24 / px))) continue;
                } else if (it.id !== 'room') {
                  // in the room: nearer its own element than any other element (edge to edge, >= 20 px)
                  const others = ['lectern', 'ledge', 'participants', ...lifted].filter(k2 => k2 !== it.id && boxes[k2]);
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
        const posOf = i => (i === R.presenter ? G.home : G.seats[i]);
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: toD(posOf(sp.index)), rad: C.rad, rim: C.rad * 0.8, prefer: sp.index === R.presenter ? 200 : G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: C.people, boxes: [...C.equip, ...placed, ...cardBoxes, ...conns.flatMap(c => Array.from({length: 13}, (_, q) => ({x: lerp(c.pts[0].x, c.pts[1].x, q / 12) - 3, y: lerp(c.pts[0].y, c.pts[1].y, q / 12) - 3, w: 6, h: 6})))], ellipse: C.ellipse, anchors: R.speakers.map(sp => toD(posOf(sp.index)))});
        badges = res.labels;
        for (const f of res.fails) problems.push(`badge-${f}`);
        badges.forEach(b => placed.push(b.box));
        for (const c of conns) if (badges.some(b => segHits(c.pts[0], c.pts[1], b.box, 4))) problems.push(`link-over-badge-${c.i}`);
      }
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
            if (people.some(q => distBox(bx, q) < q.rad + 4) || ellipseHit(bx, C.ellipse)) continue;
            if (lineHits(bx, 4)) continue;
            const inRoom = overlaps(bx, C.planRect, 0);
            if (inRoom && !(bx.x >= C.bounds.x && bx.y >= C.bounds.y && bx.x + bx.w <= C.bounds.x + C.bounds.w && bx.y + bx.h <= C.bounds.y + C.bounds.h)) continue;
            if (inRoom && roomObs.some(q => overlaps(bx, q, 6))) continue;
            const dOwn = segDist(a, b, bx);
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
      return {C, problems, boxes, lifts, homes, conns, labels, relLabels, badges, badgeR, bandH, area, box};
    };
    // ---- search: panel (column or band), band share, room scale, side; per combination the largest text size
    const sizes = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4];
    const arrangements = [];
    if (!rows.length) arrangements.push(() => ({lay: null, area: {x: 0, y: 0, w: D.w, h: D.h}}));
    else {
      if (shape !== 'portrait') for (const cf of [0.24, 0.28, 0.32]) arrangements.push(F => {
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
    const evalAt = (arr, i, bandF, scale, left) => {
      const Fpx = sizes[i], F = Fpx / px;
      const A = arr(F);
      if (!A) return null;
      const c = compose(A.area, F, scale, bandF, left);
      const personPx = 100 * c.C.k * px;
      if (personPx < 61) c.problems.push('people-small');
      const score = -1000 * c.problems.length + (Fpx >= 19.5 ? 500 : 0) + Math.min(personPx, 110) + 3 * Fpx;
      log.push(`${Fpx} b${bandF} s${scale}${left ? 'L' : ''} ${personPx.toFixed(0)} ${c.problems.join('+')}`);
      const cand = {...c, F, lay: A.lay, score, personPx};
      if (!best || score > best.score) best = cand;
      return cand;
    };
    outer: for (const arr of arrangements) for (const bandF of [0.24, 0.3, 0.36, 0.42]) for (const [scale, left] of [[1, false], [1, true], [1.2, false], [1.2, true], [1.4, false]]) {
      const last = evalAt(arr, sizes.length - 1, bandF, scale, left);
      if (!last || last.problems.length) continue;
      let lo = 0, hi = sizes.length - 1;
      const first = evalAt(arr, 0, bandF, scale, left);
      if (first && !first.problems.length) hi = 0;
      else while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        const c = evalAt(arr, mid, bandF, scale, left);
        if (c && !c.problems.length) hi = mid; else lo = mid;
      }
      if (best && !best.problems.length && Math.abs(best.F * px - sizes[0]) < 0.05 && best.personPx >= 64) break outer;
    }
    if (!best) {
      // never throw from layout: the smallest text in the whole area, with its problems flagged
      const c = compose({x: 0, y: 0, w: D.w, h: D.h}, sizes[sizes.length - 1] / px, 1, 0.3, false);
      best = {...c, F: sizes[sizes.length - 1] / px, lay: null, score: -1e9, personPx: 100 * c.C.k * px};
      best.problems.push('panel-overflow');
    }
    const {C, F} = best;
    const G = C.G;
    // (the exhibit cabinet is lifted out: the supplied exhibit–table relation is drawn as a connector, not per card)
    const room = expoRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, lift: true, noTether: R.items.map(it => it.i)});
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
    const dyC = centreShiftY(ctx.design, [C.planRect, ...Object.values(best.boxes), ...best.labels.map(q => q.box), ...best.relLabels.map(q => q.box), ...(best.badges || []).map(q => q.box), ...(best.lay ? best.lay.rows.map(m => ({x: m.x, y: m.y, w: m.w, h: m.h})) : [])]);
    return {P, R, F, px, C, G, room, rows, lay: best.lay, ...best, problems, legs, trav, personPx: best.personPx, showKey, showAll, log, dyC};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => expoRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const col = kind => (kind === 'relation' ? th.inkSoft : kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.accent4 : th.ink);
    const homeOutline = (key, b) => (b ? h('rect', {name: `home-${key}`, x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 8, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, opacity: 0}) : null);
    const chip = (name, lb, stroke) => g({name, opacity: 0},
      h('path', {name: `${name}-body`, d: roundRectPath(lb.box.x, lb.box.y, lb.box.w, lb.box.h, Math.min(lb.box.h / 2, L.F * 0.7)), fill: th.card, stroke, 'stroke-width': 2.2}),
      textAt(lb.m.fit, lb.box.x + lb.m.padX, lb.box.y + lb.m.padY, th.ink));
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`},
        g({name: 'homes'}, homeOutline('clock', L.homes.clock), L.G.cab ? homeOutline('cab', L.homes.cab) : null),
        L.room.node),
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
    for (const key of ['lectern', 'clock', 'cab']) {
      const l = L.lifts[key];
      lift[key] = l ? {x: l.x * liftP, y: l.y * liftP} : {x: 0, y: 0};
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
    for (const [key, id] of [['lectern', 'lectern'], ['clock', 'clock'], ['cab', 'exhibit']]) {
      const b = L.homes[key];
      if (!b) continue;
      const s = grow(id);
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      liftRec[key] = {transform: `translate(${r(lift[key].x)} ${r(lift[key].y)}) ${scaleAbout(cx, cy, r(s, 4))}`};
    }
    // the table (focus by default) breathes in place when reached
    const sl = grow('ledge');
    const lc = {x: G.ledge.x + G.ledge.w / 2, y: G.ledge.y + G.ledge.h / 2};
    liftRec.ledge = {transform: scaleAbout(lc.x, lc.y, r(sl, 4))};
    liftRec.cards = liftRec.ledge;
    // states: when the table is reached the slips travel from the lifted lectern to their places and unfold (in the
    // configured sequence); each support is linked to its exhibit when the exhibit is reached (or at the end)
    // (the slips start once the table has stopped breathing, so they land exactly on their places)
    const t0 = vis('ledge') + 0.05;
    const m = R.items.length;
    const step = Math.min(0.05, Math.max(0.018, (0.86 - t0 - 0.08) / Math.max(1, m)));
    const stack = {x: G.stack.x + lift.lectern.x, y: G.stack.y + lift.lectern.y};
    const slips = [], cards = [], tethers = [], states = [];
    const tetherAt = Math.max(vis('exhibit'), t0 + step * m + 0.05);
    R.items.forEach(it => {
      const s0 = t0 + R.rank[it.i] * step;
      const q = ease.inOutCubic(seg(u, s0, s0 + 0.035));
      const open = ease.inOutCubic(seg(u, s0 + 0.035, s0 + 0.06));
      const text = seg(u, s0 + 0.06, s0 + 0.075);
      const slot = G.slots[it.i];
      const to = {x: slot.cx, y: slot.bottom - SLIP.h / 2};
      slips[it.i] = open > 0 ? null : {x: lerp(stack.x + R.rank[it.i] * 2, to.x, q), y: lerp(stack.y - R.rank[it.i] * 2, to.y, q), deg: lerp(180, 360, q), opacity: 1};
      cards[it.i] = {open, text, shown: open > 0 ? 1 : 0};
      tethers[it.i] = seg(u, tetherAt + R.rank[it.i] * 0.01, tetherAt + R.rank[it.i] * 0.01 + 0.05);
      states[it.i] = q <= 0 ? 'stack' : open <= 0 ? 'moving' : open < 1 ? 'unfolding' : 'open';
    });
    const presenter = {pose: {x: G.home.x, y: G.home.y, deg: 180, walk: 0, phase: 0, seated: 0}, reach: null, reachL: null};
    const fr = L.room.frame({clockDeg: 36 * clamp(u / 0.8), presenter, cards, slips, tethers, lift: liftRec});
    Object.assign(nodes, fr.nodes);
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
        itemState: R.items.map(it => states[it.i]),
        open: R.items.map(it => r(cards[it.i].open, 3)),
        textShown: R.items.map(it => r(cards[it.i].text, 3)),
        tether: R.items.map(it => (it.exhibit !== null ? r(tethers[it.i], 3) : null)),
        order: R.order.join('>'),
        presenterIndex: R.presenter,
        trav: L.trav.join('>'),
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        allReached: true,
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
    slug: 'hearings-02-mechanism',
    title: 'Opening statement — the pieces of laying out facts and questions and their supplied relationships',
    titleEs: 'Exposición inicial — Mecanismo o relación explicada',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Exposición inicial',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded plan of the generic hearing room: the lectern with its folded slips, the wall clock and the exhibit cabinet rise out of their places; the presentation table and the participants stay in the room. Only the supplied relationships are drawn, edge to edge, with their kind (plain relation without arrowhead, communication, sequence as configured). A tracer follows the supplied traversal; when it reaches the table the slips travel to their places and unfold into the cards (● claim made / ◆ support supplied, or a question), and each support is linked to its exhibit. Fictional and illustrative; nothing is assessed.',
    tags: ['hearing', 'opening statement', 'mechanism', 'exploded plan', 'relationships', 'tracer', 'lectern', 'presentation table', 'facts', 'questions', 'claim made', 'support supplied', 'exhibit', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/exposicion-inicial.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
