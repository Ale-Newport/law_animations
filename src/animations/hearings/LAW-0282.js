/**
 * LAW-0282 — Apertura de audiencia · mechanism
 *
 * Storyboard (an exploded plan of the generic hearing room: the pieces that
 * take part in the opening are lifted out of their places, the relationships
 * supplied between them are drawn, and a tracer runs through them):
 *  0.00–0.18  separate: the control unit (display + switch) and the wall
 *             clock rise out of the equipment wall, the exhibit cabinet out of
 *             its wall and the tray of name cards out of the table, each to a
 *             band above the room; a faint outline keeps each one's home place.
 *             Each piece gets its supplied label; participants carry a number
 *             badge (the configured sequence) keyed to the panel.
 *  0.18–0.43  only the explicit relationships are drawn, one after the other,
 *             each from edge to edge with its kind's label: a plain relation
 *             has no arrowhead; communication and sequence are drawn solid with
 *             their own end marks and captions ("sequence as configured,
 *             illustrative"); a causal link appears only when supplied.
 *  0.43–0.75  a tracer runs along the relationships in the supplied traversal
 *             order; the element it reaches enlarges (the focus element most).
 *             As it passes, the element's own state changes: the switch goes to
 *             ● and the display to the supplied started state, the room's
 *             lamps come on, and the cards travel from the tray to the
 *             participants in the configured sequence.
 *  0.75–1.00  gather: the whole mechanism is held in view — its origin (the
 *             faint home outline of every lifted piece), the drawn relationships
 *             and the resulting state (● on the display, lamps on, every card at
 *             its participant) — with the key "as supplied · no conclusion
 *             drawn". No hierarchy, no rule, no outcome; pending is only a
 *             waiting state.
 * @module animations/hearings/LAW-0282
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  aperturaFields, APERTURA_EN, APERTURA_ES, localised, resolveApertura, pxPerUnit, composeRoom, hearingRoom, cardAt,
  measureRow, layoutRows, rowNode, R2, fitG, textAt, placeLabels, overlaps, FONT, seatBox,
  centreShiftY,
} from './kits/apertura-audiencia.js';
import {toWorld} from './kits/hearings-art.js';

const ID = 'LAW-0282';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {lift: [0.02, 0.13], labels: [0.12, 0.17], relate: [0.18, 0.42], trace: [0.44, 0.74]};
const IDS = ['room', 'unit', 'clock', 'tray', 'participants', 'exhibit'];
const KINDS = ['relation', 'communication', 'sequence', 'causal'];


const OWN_EN = {
  elements: [
    {id: 'room', label: 'The room and its lamps'},
    {id: 'unit', label: 'Control unit: display and switch'},
    {id: 'clock', label: 'Wall clock (support)'},
    {id: 'tray', label: 'Tray of name cards'},
    {id: 'participants', label: 'Participants at the shared table'},
    {id: 'exhibit', label: 'Exhibit cabinet'},
  ],
  relationships: [
    {from: 'unit', to: 'room', kind: 'relation'},
    {from: 'unit', to: 'participants', kind: 'communication'},
    {from: 'tray', to: 'participants', kind: 'sequence'},
  ],
  focusElement: 'unit',
  relationLabels: {relation: 'Linked (as configured)', communication: 'Shows the state to', sequence: 'Sequence as configured (illustrative)', causal: 'Causal link (as supplied)'},
  traversalOrder: ['room', 'unit', 'participants', 'tray'],
};
const OWN_ES = {
  elements: [
    {id: 'room', label: 'La sala y sus luces'},
    {id: 'unit', label: 'Unidad de control: pantalla e interruptor'},
    {id: 'clock', label: 'Reloj de pared (soporte)'},
    {id: 'tray', label: 'Bandeja de tarjetas'},
    {id: 'participants', label: 'Participantes en la mesa común'},
    {id: 'exhibit', label: 'Armario de pruebas'},
  ],
  relationships: OWN_EN.relationships,
  focusElement: 'unit',
  relationLabels: {relation: 'Vinculado (según la configuración)', communication: 'Muestra el estado a', sequence: 'Secuencia según lo configurado (ilustrativa)', causal: 'Vínculo causal (según lo aportado)'},
  traversalOrder: OWN_EN.traversalOrder,
};
const EN = {...APERTURA_EN, ...OWN_EN};
const ES = {...APERTURA_ES, ...OWN_ES};

const sceneSchema = {
  ...aperturaFields,
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
    const R = resolveApertura(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const label = id => ((P.elements.find(e => e.id === id) || {}).label ?? null);
    const present = new Set(P.elements.map(e => e.id));
    const rels = P.relationships.filter(q => q.from !== q.to && present.has(q.from) && present.has(q.to));
    // ---- panel rows
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
      R.order.forEach((i, j) => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(j + 1), text: R.speakers[i].label, name: `lg-p${i}`}));
    }
    if (showAll) {
      R.speakers.forEach(sp => sp.statements.forEach((tx, q) => rows.push({kind: 'legend', glyphKind: 'statement', seqNumber: String(R.rank[sp.index] + 1), numberFill: '#1f2328', text: tx, name: `lg-st${sp.index}-${q}`})));
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', text: tx, name: `lg-ex${i}`}));
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
    }
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});

    const compose = (area, F, scale, bandF, trayLeft = false) => {
      const problems = [];
      // the band above the room holds the lifted pieces (and their labels); the room takes the rest
      const bandH = area.h * bandF;
      const box = {x: area.x, y: area.y + bandH, w: area.w, h: area.h - bandH};
      const C = composeRoom(ctx, P, R, box, F, {chips: false, exhibitChips: false, scale, minScale: 0.85, compact: true, align: {x: 0.5, y: 0}});
      problems.push(...C.problems);
      const G = C.G, k = C.k;
      const toD = C.toD, bD = C.bD;
      // lifted positions (template offsets): everything rises to the same band line above the top wall
      const bandTopT = (area.y - C.oy) / k; // band top in template y
      // the pieces sit in the upper part of the band; its lower part stays free for the relation labels
      // under a label row (element labels sit above their piece), pieces top-aligned; the band's lower part stays free
      // for the relationships and their captions
      const labelRowT = showKey ? (F * 1.18 * 2 + F * 0.8 + 10) / k : 10 / k;
      const liftY = b => bandTopT + labelRowT - b.y;
      const homes = {
        unit: G.unit,
        clock: {x: G.clock.cx - G.clock.R, y: G.clock.cy - G.clock.R, w: 2 * G.clock.R, h: 2 * G.clock.R},
        cab: G.cab,
        tray: {x: G.C.x - 48, y: G.C.y - 31, w: 96, h: 62},
      };
      // lifted pieces spread along the band in their wall order (cabinet, clock, unit, tray) with equal gaps, so each
      // relationship between them has length and room for its label
      // the tray (it leaves the middle of the table) takes the side of the band with fewer links, so its link to the
      // participants has free floor beside it for its caption
      const linked = key => rels.some(q => q.from === key || q.to === key);
      const leftBusy = (G.cab && linked('exhibit') ? 1 : 0) + (linked('clock') ? 1 : 0);
      const order = (leftBusy === 0 && trayLeft
        ? [['tray', homes.tray], ['cab', G.cab], ['clock', homes.clock], ['unit', homes.unit]]
        : [['cab', G.cab], ['clock', homes.clock], ['unit', homes.unit], ['tray', homes.tray]]).filter(([, b]) => b);
      // each piece gets a slot at least as wide as its label (labels shown), so its label can stand over it without
      // reaching over a neighbour; the pieces are centred in their slots, the slots spread with equal gaps
      const labW = key => {
        if (!showKey) return 0;
        const text = label(key === 'cab' ? 'exhibit' : key);
        if (!text) return 0;
        // the label's narrower (wrapped) variant
        const ft = fitG(text, {maxWidth: 300 * 0.55 - F * 1.1, size: F, minSize: F, maxLines: 4, weight: 600});
        return (ft.width + F * 1.1) / k + 30 / k;
      };
      // when the band cannot give every label its full slot, each piece gets the same share of what it lacks
      const excess = order.map(([key, b]) => Math.max(0, labW(key) - b.w));
      const avail = G.W - order.reduce((acc, [, b]) => acc + b.w, 0) - 24 * (order.length + 1);
      const sumEx = excess.reduce((acc, w) => acc + w, 0);
      const fShare = sumEx > 0 ? clamp(avail / sumEx) : 0;
      const slots = order.map(([, b], i) => b.w + excess[i] * fShare);
      const sumW = slots.reduce((acc, w) => acc + w, 0);
      const gapT = Math.max(24, (G.W - sumW) / (order.length + 1));
      let cur = gapT;
      const lifts = {};
      order.forEach(([key, b], i) => {
        const sw = slots[i];
        lifts[key] = {x: cur + (sw - b.w) / 2 - b.x, y: liftY(b)};
        cur += sw + gapT;
      });
      if (!G.cab) lifts.cab = null;
      const liftedBox = key => { const b = homes[key]; const l = lifts[key]; return b && l ? bD({x: b.x + l.x, y: b.y + l.y, w: b.w, h: b.h}) : null; };
      const boxes = {
        room: C.planRect,
        unit: liftedBox('unit'),
        clock: liftedBox('clock'),
        exhibit: G.cab ? liftedBox('cab') : null,
        tray: liftedBox('tray'),
        participants: (() => { const bs = G.seats.map(seatBox); bs.push({x: G.C.x - G.A, y: G.C.y - G.B, w: G.A * 2, h: G.B * 2}); const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h)); return bD({x: x0, y: y0, w: x1 - x0, h: y1 - y0}); })(),
      };
      // lifted pieces must stay inside the band and clear of each other
      const lifted = ['unit', 'clock', 'exhibit', 'tray'].filter(key => boxes[key] && present.has(key));
      for (const key of lifted) {
        const b = boxes[key];
        if (b.y < area.y - 1 || b.y + b.h > C.planRect.y - 8) problems.push(`band-${key}`);
        if (b.x < area.x - 1 || b.x + b.w > area.x + area.w + 1) problems.push(`band-${key}`);
      }
      for (let i = 0; i < lifted.length; i++) for (let j = i + 1; j < lifted.length; j++) if (overlaps(boxes[lifted[i]], boxes[lifted[j]], 16)) problems.push(`band-overlap-${lifted[i]}-${lifted[j]}`);
      // ---- connectors: straight segments from edge to edge. A piece with several links spreads its exits along its
      // edge; a link to the room lands on the room's top wall where no other link lands (the participants sit inside
      // the room: a link to them crosses the free floor under the wall)
      const keyOf = id => (id === 'exhibit' ? 'exhibit' : id);
      const outs = {};
      rels.forEach(rel => { (outs[rel.from] = outs[rel.from] || []).push(rel); });
      const spread = n => (n === 1 ? [0.5] : n === 2 ? [0.3, 0.7] : n === 3 ? [0.2, 0.5, 0.8] : Array.from({length: n}, (_, i) => (i + 1) / (n + 1)));
      const ends = [];
      const conns = rels.map((rel, ci) => {
        const A = boxes[keyOf(rel.from)], B = boxes[keyOf(rel.to)];
        if (!A || !B) return null;
        const mine = outs[rel.from];
        const fx = spread(mine.length)[mine.indexOf(rel)];
        const contains = (o, q) => q.x >= o.x - 1 && q.y >= o.y - 1 && q.x + q.w <= o.x + o.w + 1 && q.y + q.h <= o.y + o.h + 1;
        let a, bpt;
        if (A.y + A.h <= B.y + 2 || contains(B, A)) {
          // B lies below A (or A is inside B's area): leave from A's bottom edge
          a = {x: A.x + A.w * fx, y: A.y + A.h};
          if (rel.to === 'room') {
            const cands = [0.12, 0.88, 0.3, 0.7, 0.5].map(f => ({x: B.x + B.w * f, y: B.y}));
            bpt = cands.sort((p1, p2) => Math.min(...ends.map(e => Math.abs(e.x - p2.x)), 1e9) - Math.min(...ends.map(e => Math.abs(e.x - p1.x)), 1e9))[0];
          } else {
            // participants: the nearest point of their group's top edge, pulled in from its corners
            bpt = {x: clamp(a.x, B.x + B.w * 0.18, B.x + B.w * 0.82), y: B.y};
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
        const pts = [a, bpt];
        return {rel, pts, poly: polyline(pts), i: ci};
      }).filter(Boolean);
      // two links must not run as a tight parallel pair or cross each other's end
      for (let i = 0; i < conns.length; i++) for (let j = i + 1; j < conns.length; j++) {
        const [p1, p2] = conns[i].pts, [q1, q2] = conns[j].pts;
        if (segDist(p1, p2, {x: q1.x, y: q1.y, w: 0, h: 0}) < 18 && segDist(p1, p2, {x: q2.x, y: q2.y, w: 0, h: 0}) < 18) problems.push(`links-parallel-${i}-${j}`);
      }
      // ---- labels: element labels beside their piece, relation labels beside their line (never on it)
      const Fs = F;
      const chipOf = (text, maxW, weight = 600) => {
        const padX = Fs * 0.55, padY = Fs * 0.34;
        const vs = [maxW, maxW * 0.75, maxW * 0.55, maxW * 0.44].map(mw => {
          const fit = fitG(text, {maxWidth: mw - padX * 2, size: Fs, minSize: Fs, maxLines: 4, weight});
          return {fit, w: fit.width + padX * 2, h: fit.height + padY * 2, padX, padY};
        }).filter(m => !m.fit.truncated);
        return vs.length ? vs : null;
      };
      const people = G.seats.map(s => ({...toD(s), rad: C.rad + 4}));
      const obstacles = [...Object.entries(boxes).filter(([key, b]) => b && key !== 'room' && key !== 'participants').map(([, b]) => b)];
      const labels = [];
      const placed = [];
      const lineHits = (b, pad = 6) => conns.some(c => c.pts.some((q, j) => j && segHits(c.pts[j - 1], q, b, pad)));
      if (showKey) {
        // element labels
        const elItems = [];
        for (const id of IDS) {
          if (!present.has(id) || !boxes[id === 'exhibit' ? 'exhibit' : id]) continue;
          const vs = chipOf(label(id), 300, 700);
          if (!vs) { problems.push(`label-${id}`); continue; }
          const b = boxes[id];
          if (id === 'room') elItems.push({key: `el-${id}`, id, variants: vs.map(v => ({...v, m: v})), anchor: {x: b.x + b.w * 0.5, y: b.y + b.h}, bounds: {x: area.x, y: area.y, w: area.w, h: area.h}, room: true});
          else if (id === 'participants') elItems.push({key: `el-${id}`, id, variants: vs.map(v => ({...v, m: v})), anchor: {x: b.x + b.w / 2, y: b.y + b.h / 2}, inRoom: true});
          else elItems.push({key: `el-${id}`, id, variants: vs.map(v => ({...v, m: v})), anchor: {x: b.x + b.w / 2, y: b.y + b.h / 2}});
        }
        // element labels are placed in two orders (the fixed element order; the lifted pieces left to right along the
        // band, then the floor); the order with fewer failures is kept
        const placeEls = order => {
          const out = [], boxesP = [], fails = [];
          for (const it of order) {
            const b = boxes[it.id];
            let best = null;
            // widest variant first; a narrower one is only tried when the wider one has no clear place
            for (const v of it.variants) {
              const cands = [];
              if (it.room || it.inRoom) {
                // on the free floor inside the room: the room's label near a wall, the participants' next to their group
                const inner = C.bounds;
                for (let y = inner.y + 4; y <= inner.y + inner.h - v.h - 4; y += 24) for (let x = inner.x + 4; x <= inner.x + inner.w - v.w - 4; x += 24) {
                  const pen = it.room
                    ? Math.min(x - inner.x, inner.x + inner.w - x - v.w, y - inner.y, inner.y + inner.h - y - v.h) * 0.6
                    : Math.hypot(Math.max(b.x - (x + v.w), 0, x - (b.x + b.w)), Math.max(b.y - (y + v.h), 0, y - (b.y + b.h))) * 0.8;
                  cands.push({x, y, w: v.w, h: v.h, v, pen});
                }
              } else {
                for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) {
                  for (const sl of [0, -0.3, 0.3]) {
                    const x = dx ? (dx > 0 ? b.x + b.w + 10 : b.x - 10 - v.w) : b.x + b.w / 2 - v.w / 2 + sl * v.w;
                    const y = dy ? (dy > 0 ? b.y + b.h + 8 : b.y - 8 - v.h) : b.y + b.h / 2 - v.h / 2 + sl * v.h;
                    // above the piece first: the band under the pieces is kept for the relationships and their labels
                    cands.push({x, y, w: v.w, h: v.h, v, pen: dy > 0 ? 60 : dx ? 12 : 0});
                  }
                }
                // above or below, flush with the piece's left or right edge or with the band's edge (the far side from
                // a close neighbour)
                for (const y of [b.y - 8 - v.h, b.y + b.h + 8]) for (const x of [b.x, b.x + b.w - v.w, area.x, area.x + area.w - v.w]) cands.push({x, y, w: v.w, h: v.h, v, pen: (y > b.y ? 60 : 0) + 4});
              }
              for (const cb of cands) {
                const bx = {x: cb.x, y: cb.y, w: cb.w, h: cb.h};
                if (bx.x < area.x || bx.y < area.y || bx.x + bx.w > area.x + area.w || bx.y + bx.h > area.y + area.h) continue;
                if (!it.room && !it.inRoom && overlaps(bx, C.planRect, 4)) continue;
                if (obstacles.some(q => overlaps(bx, q, 6))) continue;
                if (boxesP.some(q => overlaps(bx, q, 10))) continue;
                if (people.some(q => distBox(bx, q) < q.rad + 4)) continue;
                if ((it.room || it.inRoom) && ellipseHit(bx, C.ellipse)) continue;
                if (lineHits(bx, 12)) continue;
                // a lifted piece's label is clearly its own: its centre is nearer its own piece's centre than any other
                // lifted piece's (horizontally) by >= 24 px, and no other piece is nearer edge to edge (6 px slack)
                if (!it.room && !it.inRoom) {
                  const cx = bx.x + bx.w / 2, dOwn = Math.abs(cx - (b.x + b.w / 2)), gOwn = gapBox(bx, b);
                  if (lifted.some(k => k !== it.id && (gapBox(bx, boxes[k]) < gOwn + 6 / px || Math.abs(cx - (boxes[k].x + boxes[k].w / 2)) < dOwn + 24 / px))) continue;
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
        const byBand = [...elItems].sort((p1, p2) => ((p1.room || p1.inRoom) - (p2.room || p2.inRoom)) || (boxes[p1.id].x - boxes[p2.id].x));
        let res = placeEls(elItems);
        if (res.fails.length) { const r2 = placeEls(byBand); if (r2.fails.length < res.fails.length) res = r2; }
        labels.push(...res.out);
        placed.push(...res.boxesP);
        problems.push(...res.fails);
      }
      // number badges beside each participant (placed before the relation labels)
      const badgeR = F * 0.78;
      let badges = [];
      if (showKey) {
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: badgeR * 2, h: badgeR * 2, at: toD(G.seats[sp.index]), rad: C.rad, rim: C.rad * 0.8, prefer: G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: C.people, boxes: [...C.equip.slice(0, -1), ...placed], ellipse: C.ellipse, anchors: G.seats.map(q => toD(q))});
        badges = res.labels;
        for (const f of res.fails) problems.push(`badge-${f}`);
        badges.forEach(b => placed.push(b.box));
      }
      // relation labels: beside the middle of their longest segment, clear of pieces, labels, people, badges, other lines
      const relLabels = [];
      if (showAll) {
        for (const c of conns) {
          const text = P.relationLabels[c.rel.kind] || c.rel.kind;
          const vs = chipOf(text, 280, 600);
          if (!vs) { problems.push(`rel-${c.i}`); continue; }
          let seg0 = 1, len0 = 0;
          for (let j = 1; j < c.pts.length; j++) { const L0 = Math.hypot(c.pts[j].x - c.pts[j - 1].x, c.pts[j].y - c.pts[j - 1].y); if (L0 > len0) { len0 = L0; seg0 = j; } }
          const a = c.pts[seg0 - 1], b = c.pts[seg0];
          const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
          const tx = (b.x - a.x) / len, ty = (b.y - a.y) / len;
          const nx = -ty, ny = tx;
          let best = null;
          for (const v of vs) { if (best) break; for (const f of [0.5, 0.38, 0.62, 0.26, 0.74, 0.16, 0.84, 0.08, 0.92]) for (const side of [1, -1]) for (const off of [10, 20, 32, 48, 64, 84]) for (const sl of [0, -0.3, 0.3]) {
            const mx = lerp(a.x, b.x, f), my = lerp(a.y, b.y, f);
            // box beside the line: its nearest edge `off` away along the normal, slid a little along the line
            const ext = Math.abs(nx) * v.w / 2 + Math.abs(ny) * v.h / 2;
            const cx = mx + nx * side * (off + ext) + tx * sl * (Math.abs(tx) * v.w + Math.abs(ty) * v.h) * 0.5;
            const cy = my + ny * side * (off + ext) + ty * sl * (Math.abs(tx) * v.w + Math.abs(ty) * v.h) * 0.5;
            const bx = {x: cx - v.w / 2, y: cy - v.h / 2, w: v.w, h: v.h};
            if (bx.x < area.x || bx.y < area.y || bx.x + bx.w > area.x + area.w || bx.y + bx.h > area.y + area.h) continue;
            if (obstacles.some(q => overlaps(bx, q, 6)) || placed.some(q => overlaps(bx, q, 8))) continue;
            if (people.some(q => distBox(bx, q) < q.rad + 4) || ellipseHit(bx, C.ellipse)) continue;
            if (lineHits(bx, 4)) continue;
            // nearer its own line than any other line by >= 20 px (1080p)
            const dOwn = segDist(a, b, bx);
            const dOther = Math.min(1e9, ...conns.filter(q => q !== c).flatMap(q => q.pts.slice(1).map((p2, j) => segDist(q.pts[j], p2, bx))));
            if (dOther - dOwn < 20 / px) continue;
            // off the room's walls (a label outside the room never lies over its wall)
            const inRoom = overlaps(bx, C.planRect, 0);
            if (inRoom && !(bx.x >= C.bounds.x && bx.y >= C.bounds.y && bx.x + bx.w <= C.bounds.x + C.bounds.w && bx.y + bx.h <= C.bounds.y + C.bounds.h)) continue;
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
    // ---- search: panel (column or band), band share, room scale, tray side; per combination the largest text size
    // that composes without problems is found by bisection over the size list; the best scoring candidate wins
    const sizes = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4];
    const arrangements = [];
    if (!rows.length) arrangements.push(() => ({lay: null, area: {x: 0, y: 0, w: D.w, h: D.h}}));
    else {
      if (shape !== 'portrait') for (const cf of [0.24, 0.28, 0.32, 0.36]) arrangements.push(F => {
        const pw = D.w * cf;
        const ms = rows.map(rw => measureRow(rw, F, pw));
        const probe = layoutRows(ms, {x: 0, y: 0, w: pw, h: 1e6}, F, 1, 28);
        if (!probe.ok || probe.usedH > D.h) return null;
        const panelBox = {x: D.w - pw, y: (D.h - probe.usedH) / 2, w: pw, h: probe.usedH};
        return {lay: layoutRows(ms, panelBox, F, 1, 28), area: {x: 0, y: 0, w: D.w - pw - 30, h: D.h}};
      });
      if (shape !== 'landscape') for (const cols of [2, 3]) arrangements.push(F => {
        const colW = (D.w - 28 * (cols - 1)) / cols;
        const ms = rows.map(rw => measureRow(rw, F, colW));
        const probe = layoutRows(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, cols, 28);
        if (!probe.ok || probe.usedH > D.h * 0.45) return null;
        const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
        return {lay: layoutRows(ms, panelBox, F, cols, 28), area: {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - 30}};
      });
    }
    let best = null;
    const log = [];
    const evalAt = (arr, i, bandF, scale, trayLeft) => {
      const Fpx = sizes[i], F = Fpx / px;
      const A = arr(F);
      if (!A) return null;
      const c = compose(A.area, F, scale, bandF, trayLeft);
      const personPx = 100 * c.C.k * px;
      if (personPx < 60) c.problems.push('people-small');
      const score = -1000 * c.problems.length + (Fpx >= 19.5 ? 500 : 0) + Math.min(personPx, 110) + 3 * Fpx;
      log.push(`${Fpx} b${bandF} s${scale}${trayLeft ? 'L' : ''} ${personPx.toFixed(0)} ${c.problems.join('+')}`);
      const cand = {...c, F, lay: A.lay, score, personPx};
      if (!best || score > best.score) best = cand;
      return cand;
    };
    outer: for (const arr of arrangements) for (const bandF of [0.26, 0.32, 0.38, 0.44]) for (const [scale, trayLeft] of [[1, false], [1, true], [1.2, false], [1.2, true]]) {
      const last = evalAt(arr, sizes.length - 1, bandF, scale, trayLeft);
      if (!last || last.problems.length) continue;
      let lo = 0, hi = sizes.length - 1;
      const first = evalAt(arr, 0, bandF, scale, trayLeft);
      if (first && !first.problems.length) hi = 0;
      else while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        const c = evalAt(arr, mid, bandF, scale, trayLeft);
        if (c && !c.problems.length) hi = mid; else lo = mid;
      }
      if (best && !best.problems.length && Math.abs(best.F * px - sizes[0]) < 0.05 && best.personPx >= 64) break outer;
    }
    const {C, F} = best;
    const G = C.G;
    const dispText = showKey ? {started: C.dt.started, pending: C.dt.pending} : null;
    const room = hearingRoom(ctx, G, {prefix: 'rm', R, dispText, glyphS: C.dt.gS, lift: true});
    // the tracer's route: along the connectors, in the traversal order (a leg without a connector is flagged)
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
    // the whole composition is centred vertically in the safe box (no empty band under a portrait diagram)
    const dyC = centreShiftY(ctx.design, [C.planRect, ...Object.values(best.boxes), ...best.labels.map(q => q.box), ...best.relLabels.map(q => q.box), ...(best.badges || []).map(q => q.box), ...(best.lay ? best.lay.rows.map(m => ({x: m.x, y: m.y, w: m.w, h: m.h})) : [])]);
    return {P, R, F, px, C, G, room, rows, lay: best.lay, ...best, problems, legs, trav, personPx: best.personPx, showKey, showAll, log, dyC};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const col = kind => (kind === 'relation' ? th.inkSoft : kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.accent4 : th.ink);
    const homeOutline = (key, b) => (b ? h('rect', {name: `home-${key}`, x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 8, fill: 'none', stroke: th.inkSoft, 'stroke-width': 2, opacity: 0}) : null);
    const chip = (name, lb, stroke, weight) => g({name, opacity: 0},
      h('path', {name: `${name}-body`, d: roundRectPath(lb.box.x, lb.box.y, lb.box.w, lb.box.h, Math.min(lb.box.h / 2, L.F * 0.7)), fill: th.card, stroke, 'stroke-width': 2.2}),
      textAt(lb.m.fit, lb.box.x + lb.m.padX, lb.box.y + lb.m.padY, th.ink));
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`},
        // faint outlines keep each lifted piece's home place (solid: not pending)
        g({name: 'homes'}, homeOutline('unit', L.homes.unit), homeOutline('clock', L.homes.clock), L.G.cab ? homeOutline('cab', L.homes.cab) : null, homeOutline('tray', L.homes.tray)),
        L.room.node),
      // connectors (drawn on), with kind-specific solid ends; no arrowhead unless a causal link is supplied
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
      L.badges.map((b, i) => g({name: `b${i}`},
        h('circle', {cx: r(b.box.x + b.box.w / 2), cy: r(b.box.y + b.box.h / 2), r: r(L.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
        h('text', {x: r(b.box.x + b.box.w / 2), y: r(b.box.y + b.box.h / 2 + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(L.R.rank[i] + 1)))),
      L.labels.map(lb => chip(lb.key, lb, th.ink, 700)),
      L.relLabels.map(lb => chip(`rel${lb.i}`, lb, col(lb.kind), 600)),
      h('circle', {name: 'tracer', r: 11, fill: th.accent3, stroke: '#ffffff', 'stroke-width': 3, opacity: 0}),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C} = L;
    const nodes = {};
    const liftP = ease.inOutCubic(seg(u, ...W.lift));
    const lift = {};
    for (const key of ['unit', 'clock', 'cab', 'tray']) {
      const l = L.lifts[key];
      lift[key] = l ? {x: l.x * liftP, y: l.y * liftP} : {x: 0, y: 0};
    }
    for (const key of ['unit', 'clock', 'cab', 'tray']) if (L.homes[key] && (key !== 'cab' || L.G.cab)) nodes[`home-${key}`] = {opacity: r(0.45 * liftP, 3)};
    // labels
    const labP = seg(u, ...W.labels);
    L.labels.forEach(lb => { nodes[lb.key] = {opacity: r(labP, 3)}; });
    // connectors, drawn one after the other
    const nC = L.conns.length;
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, nC);
    L.conns.forEach((c, j) => {
      const p = seg(u, W.relate[0] + j * span, W.relate[0] + (j + 0.8) * span);
      nodes[`conn${c.i}`] = {opacity: p > 0 ? 1 : 0};
      nodes[`conn${c.i}-line`] = {'stroke-dashoffset': r(c.poly.total * (1 - ease.inOutSine(p)))};
      nodes[`conn${c.i}-ends`] = {opacity: r(seg(p, 0.85, 1), 3)};
      const rl = L.relLabels.find(q => q.i === c.i);
      if (rl) nodes[`rel${c.i}`] = {opacity: r(seg(u, W.relate[0] + (j + 0.6) * span, W.relate[0] + (j + 0.95) * span), 3)};
    });
    // tracer along the legs
    const nL = L.legs.length;
    const legSpan = (W.trace[1] - W.trace[0]) / Math.max(1, nL);
    let tracer = null, at = null;
    const visitU = {};
    L.legs.forEach((leg, j) => {
      const a0 = W.trace[0] + j * legSpan, a1 = a0 + legSpan * 0.8;
      visitU[leg.b] = visitU[leg.b] ?? a1;
      if (j === 0) visitU[leg.a] = visitU[leg.a] ?? a0;
      // the tracer is shown only while it travels a leg (it never jumps from one element edge to another)
      if (u >= a0 && u < a1) {
        const q = seg(u, a0, a1);
        const p = leg.poly.at(ease.inOutSine(q));
        tracer = {x: p.x, y: p.y};
        at = q <= 0 ? leg.a : null;
      } else if (u >= a1 && u <= a0 + legSpan) at = leg.b;
    });
    nodes.tracer = tracer ? {cx: r(tracer.x), cy: r(tracer.y), opacity: 1} : {cx: 0, cy: 0, opacity: 0};
    // the element the tracer reaches enlarges (the focus element most); state changes follow the visits
    const endU = W.trace[1];
    const vis = id => visitU[id] ?? endU;
    const pulseAt = (id, amt) => { const v = vis(id); return amt * Math.sin(Math.PI * seg(u, v - 0.02, v + 0.05)); };
    const grow = id => 1 + pulseAt(id, id === L.P.focusElement ? 0.14 : 0.06);
    const scaled = (key, id) => {
      const b = L.homes[key];
      if (!b) return lift[key];
      const s = grow(id);
      const cx = b.x + b.w / 2 + lift[key].x, cy = b.y + b.h / 2 + lift[key].y;
      return {x: lift[key].x, y: lift[key].y, s, cx, cy};
    };
    const liftRec = {};
    for (const [key, id] of [['unit', 'unit'], ['clock', 'clock'], ['cab', 'exhibit'], ['tray', 'tray']]) liftRec[key] = scaled(key, id);
    const swP = ease.inOutCubic(seg(u, vis('unit'), vis('unit') + 0.04));
    const textP = seg(u, vis('unit') + 0.03, vis('unit') + 0.06);
    const lampsP = seg(u, vis('room'), vis('room') + 0.05);
    // cards: from the lifted tray to each participant, in the configured sequence, when the participants are reached
    const cardStart = Math.min(vis('participants'), vis('tray')) - 0.02;
    const n = R.n;
    const cstep = Math.min(0.05, Math.max(0.02, (endU + 0.02 - cardStart - 0.06) / Math.max(1, n)));
    const trayPos = {x: G.C.x + lift.tray.x, y: G.C.y + lift.tray.y};
    const cards = [];
    const cardStates = [];
    for (let i = 0; i < n; i++) {
      const s0 = cardStart + R.rank[i] * cstep;
      const q = ease.inOutCubic(seg(u, s0, s0 + 0.06));
      const rest = G.cards[i].rest;
      cards.push({x: lerp(trayPos.x + (i - (n - 1) / 2) * 5, rest.x, q), y: lerp(trayPos.y - (i - (n - 1) / 2) * 4, rest.y, q), deg: lerp(0, G.cards[i].deg, q), stand: seg(q, 0.8, 1), opacity: 1});
      cardStates.push(q >= 1 ? 'placed' : q > 0 ? 'moving' : 'in-tray');
    }
    const people = G.seats.map(() => ({seated: 1, reach: null}));
    const fr = L.room.frame({lights: lampsP, switchK: swP, started: textP, text: {started: textP, pending: 1 - seg(u, vis('unit') + 0.01, vis('unit') + 0.03)}, clockDeg: 36 * clamp(u / 0.8), cards, people, lift: liftRec});
    Object.assign(nodes, fr.nodes);
    // lifted groups carry their enlargement (scale about their centre)
    for (const key of ['unit', 'clock', 'cab', 'tray']) {
      const q = liftRec[key];
      if (!nodes[`rm-lift-${key}`] || q.s === undefined) continue;
      nodes[`rm-lift-${key}`] = {transform: `translate(${r(q.x)} ${r(q.y)}) ${scaleAbout(q.cx - q.x, q.cy - q.y, r(q.s, 4))}`};
    }
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        lifted: r(liftP, 3),
        drawn: L.conns.map((c, j) => r(seg(u, W.relate[0] + j * (W.relate[1] - W.relate[0]) / Math.max(1, nC), W.relate[0] + (j + 0.8) * (W.relate[1] - W.relate[0]) / Math.max(1, nC)), 3)),
        kinds: L.conns.map(c => c.rel.kind),
        tracer: tracer ? R2(tracer) : null,
        at,
        focus: L.P.focusElement,
        focusScale: r(grow(L.P.focusElement), 3),
        switchK: r(swP, 3),
        started: r(textP, 3),
        lights: r(lampsP, 3),
        cardState: cardStates,
        order: R.order.join('>'),
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
  // quick reject: the segment's box does not reach the box
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
    slug: 'hearings-01-mechanism',
    title: 'Opening of a hearing — the pieces of the opening and their supplied relationships',
    titleEs: 'Apertura de audiencia — Mecanismo o relación explicada',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Apertura de audiencia',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded plan of the generic hearing room: the control unit, the wall clock, the exhibit cabinet and the tray of name cards rise out of their places; only the supplied relationships are drawn, edge to edge, with their kind (plain relation without arrowhead, communication, sequence as configured). A tracer follows the supplied traversal order; the reached piece enlarges and its state changes (switch to ●, lamps on, cards handed over). Fictional and illustrative.',
    tags: ['hearing', 'opening', 'mechanism', 'exploded plan', 'relationships', 'tracer', 'control unit', 'switch', 'lamps', 'name cards', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
