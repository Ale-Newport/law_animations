/**
 * LAW-0218 — Acceso a sala · mechanism
 *
 * Storyboard (the plan of the generic room is decomposed into its parts —
 * an exploded plan, not a row of boxes — with the generic building beside it):
 *  0.00–0.18  separate: the joined plan opens along its walls: the entrance
 *             hall, the ◆ restricted corridor (as configured) and the ● public
 *             corridor slide away from the room, leaving a gap on every joint;
 *             each door stays on the room wall and a threshold strip spans its
 *             gap, so every passage stays physically continuous. Each part gets
 *             its editable caption. The people waiting in the corridors ride
 *             with their corridor; the other supplied participants are already
 *             seated (their labels shown).
 *  0.18–0.43  relate: ONLY the supplied relationships are drawn, one by one,
 *             anchored to the edges of their two parts, styled by kind (a plain
 *             relation = solid line with end dots, never an arrow; a sequence or
 *             causal link only when supplied, with its caption); each carries
 *             its own label beside it.
 *  0.43–0.75  trace: a tracer marker follows the supplied traversal order along
 *             the relations; the element in focus enlarges while the tracer is
 *             on it; meanwhile the first participant of each route walks from
 *             the corridor across its threshold, through its door, to its seat
 *             and sits — each label arrives as they land.
 *  0.75–1.00  gather: origin (the start pads), transformation (the solid route
 *             lines) and state (the seated people, their labels) stay visible,
 *             with a legend of the connector kinds and the key "as supplied · no
 *             conclusion drawn". No rule on who may attend, no outcome.
 * @module animations/courts/LAW-0218
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {connector, LINK_STYLES} from '../../primitives/annotate.js';
import {polyline} from '../../core/geometry.js';
import {buildingElevation} from './kits/courts-art.js';
import {walkerAt, placeSeatLabels, bodyBox, seatLabelNode, pxPerUnit, R2} from './kits/distribucion-de-sala.js';
import {
  accessFields, ACCESS_EN, ACCESS_STRINGS, resolveAccess, accessGeometry, fitAccess, planAccessWalkers, walkWindows, doorOpen, accessArt, accessTrail,
  accessPerson, accessObstacles, furnitureBoxes, accessColor, measureStack, drawStack, fitG, simplify, partOf, EXPLODE, extra, PERSON_RAD, WALL, CORR,
} from './kits/acceso-a-sala.js';

const ID = 'LAW-0218';

const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
const boxDistP = (b, p) => Math.hypot(Math.max(b.x - p.x, 0, p.x - (b.x + b.w)), Math.max(b.y - p.y, 0, p.y - (b.y + b.h)));
const SPIRAL = new Map();
/** Offsets within radius R on a grid of `step`, nearest first (cached). */
function spiral(R, step) {
  const key = `${Math.round(R)}:${Math.round(step * 100)}`;
  if (!SPIRAL.has(key)) {
    const out = [];
    for (let dy = -R; dy <= R + 1e-9; dy += step) for (let dx = -R; dx <= R + 1e-9; dx += step) if (Math.hypot(dx, dy) <= R) out.push([dx, dy]);
    out.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    SPIRAL.set(key, out);
  }
  return SPIRAL.get(key);
}
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {sep: [0.03, 0.15], cap: [0.1, 0.17], relate: [0.2, 0.42], trace: [0.45, 0.73], walk: [0.46, 0.72], legend: [0.76, 0.81]};
const EL = ['building', 'lobby', 'publicRoute', 'restrictedRoute', 'room'];
const GAPS = [210, 180, 150]; // gap of the exploded plan (template units): the widest that keeps people >= 60 px
const MECH = {cw: 124, t: 16};

const STRINGS = {en: {...ACCESS_STRINGS.en, kinds: 'Connections'}, es: {...ACCESS_STRINGS.es, kinds: 'Conexiones'}};

const relationship = obj('A supplied relationship between two parts', {
  from: oneOf('Source part', EL),
  to: oneOf('Target part', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the connector (as supplied; empty = the caption of its kind)', 50),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  ...accessFields,
  elements: list('Captions of the parts; ids are fixed by the scene, captions are editable', obj('Part', {
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
  traversalOrder: list('Order in which the tracer visits the parts', oneOf('Part id', EL), 2, 8),
};

const defaultParams = {
  ...ACCESS_EN,
  elements: [
    {id: 'building', label: 'Generic building'},
    {id: 'lobby', label: 'Entrance hall'},
    {id: 'publicRoute', label: 'Public corridor and door'},
    {id: 'restrictedRoute', label: 'Restricted corridor and door'},
    {id: 'room', label: 'Room and its seats'},
  ],
  relationships: [
    {from: 'lobby', to: 'publicRoute', kind: 'relation', label: 'Opens onto (as configured)'},
    {from: 'lobby', to: 'restrictedRoute', kind: 'relation', label: 'Opens onto (as configured)'},
    {from: 'publicRoute', to: 'room', kind: 'relation', label: 'Door (as configured)'},
    {from: 'restrictedRoute', to: 'room', kind: 'relation', label: 'Door (as configured)'},
    {from: 'building', to: 'room', kind: 'relation', label: 'Contains (as configured)'},
  ],
  focusElement: 'lobby',
  relationLabels: {relation: 'Relation (as configured)', communication: 'Communication', sequence: 'Sequence as configured', causal: 'Causal link (supplied)'},
  traversalOrder: ['lobby', 'publicRoute', 'room', 'restrictedRoute', 'lobby'],
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const {routes} = resolveAccess(ctx, p);
    const shape = ctx.view.shape;
    const GAP = 26 / px;
    const Fmin = 16.6 / px;
    const cap = id => (p.elements.find(e => e.id === id) || {label: id}).label;
    // the tracked participants: the first supplied route of each access walks; everyone else is seated from the start
    const tracked = ['public', 'restricted'].map(a => routes.findIndex(q => q.access === a)).filter(i => i >= 0);
    const rels = p.relationships.filter(q => q.from !== q.to);
    const kindsUsed = [...new Set(rels.map(q => q.kind))];
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const legendItems = [
      ...(showKey ? [{type: 'legend', kind: 'public', text: p.labels.publicAccess, weight: 600, name: 'legend-public'}, {type: 'legend', kind: 'restricted', text: p.labels.restrictedAccess, weight: 600, name: 'legend-restricted'}] : []),
    ];
    const kindItems = showAll ? kindsUsed.map(kd => ({type: 'text', text: `${kd === 'relation' ? '●—●' : '—▸'}  ${p.relationLabels[kd]}`, name: `kind-${kd}`})) : [];
    const keyItems = showKey ? [{type: 'key', text: p.labels.key, name: 'key'}] : [];
    // the building's part caption heads its name chips (the building is drawn in the panel); the label of the
    // building's first relation sits right under the building, beside the start of its connector (the room window)
    const bRel = rels.findIndex(q => q.from === 'building' || q.to === 'building');
    const bRelItem = showKey && bRel >= 0 ? [{type: 'chip', text: rels[bRel].label || p.relationLabels[rels[bRel].kind], stroke: th.fg, weight: 600, name: `rel${bRel}-lab`}] : [];
    const bldCapOnly = showKey ? [{type: 'chip', text: cap('building'), stroke: th.inkSoft, weight: 700, name: 'el-building'}] : [];
    const bldCap = [...bRelItem, ...bldCapOnly];

    const compose = (F, kind, cf, GAPT = GAPS[0]) => {
      // ---- panel (building + names + legend + key): column beside the plan, or a band above it in portrait
      let panelParts = [], bld, box;
      if (kind === 'column') {
        const pw = Math.max(250 / px, D.w * cf);
        const m = measureStack(ctx, [...bldCap, ...nameItems, ...legendItems, ...kindItems, ...keyItems], pw, F);
        if (m.truncated) return null;
        const bh = Math.min(D.h - m.height - m.gap, pw * 0.95, D.h * 0.45);
        if (bh < Math.min(140 / px, D.h * 0.2)) return null;
        // with a building link the building stands at the column's right, so its link crosses a readable gap
        const bw0 = Math.min(pw * (bRel >= 0 ? 0.72 : 1), bh / 0.9);
        bld = {x: bRel >= 0 ? D.w - bw0 : D.w - pw + (pw - bw0) / 2, y: 0, w: bw0, h: bh};
        // the stack starts right under the building: its first chip is the building link's label
        panelParts = [{m, x: D.w - pw, y: bh + m.gap * 0.6}];
        box = {x: 0, y: 0, w: D.w - pw - GAP, h: D.h};
      } else {
        const bw = D.w * cf;
        const tw = D.w - bw - GAP;
        // under the building only the building link's label (left of the link, which drops from the building's
        // right-hand corner to the room); the building caption and names head the text column
        const mn = measureStack(ctx, bRelItem, bw * 0.78, F);
        const mt = measureStack(ctx, [...bldCapOnly, ...nameItems, ...legendItems, ...kindItems, ...keyItems], tw, F);
        if (mn.truncated || mt.truncated) return null;
        const bh = Math.min(bw * 0.8, Math.max(140 / px, mt.height - mn.height - mn.gap));
        const bandH = Math.max(bh + (mn.height ? mn.gap + mn.height : 0), mt.height);
        if (bandH > D.h * 0.36) return null;
        bld = {x: 0, y: 0, w: bw, h: bh};
        // the link's label sits just left of the link (which drops from 86 % of the building's width)
        const cw0 = bRelItem.length ? Math.min(bw * 0.78, fitG(bRelItem[0].text, {maxWidth: bw * 0.78 - F * 1.2, size: F, minSize: F, maxLines: 5, weight: 600}).width + F * 1.2) : 0;
        const lx = bw * 0.86 - 12 / px - cw0 / 2 - (bw * 0.78) / 2;
        panelParts = [...(mn.height ? [{m: mn, x: lx, y: bh + mn.gap * 0.6}] : []), {m: mt, x: bw + GAP, y: (bandH - mt.height) / 2}];
        box = {x: 0, y: bandH + GAP, w: D.w, h: D.h - bandH - GAP};
      }
      const pbox = box;
      const ex = extra(MECH) + GAPT;
      const fr = fitAccess(pbox, {...MECH, min: {W: 760, H: 680}});
      // fitAccess ignores the gap: refit with it
      const k = Math.min(pbox.w / (fr.W + ex), pbox.h / (fr.H + ex));
      const RW = Math.max(760, Math.round(pbox.w / k - ex)), RH = Math.max(680, Math.round(pbox.h / k - ex));
      const G = accessGeometry(RW, RH, MECH);
      const E = G.extents;
      const EX = {x: E.x - GAPT, y: E.y, w: E.w + GAPT, h: E.h + GAPT};
      const ox = pbox.x + (pbox.w - EX.w * k) / 2 - EX.x * k;
      const oy = pbox.y + (pbox.h - EX.h * k) / 2 - EX.y * k;
      const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
      const off = (part, e = 1) => ({x: EXPLODE[part].x * GAPT * e, y: EXPLODE[part].y * GAPT * e});
      const map = q => { const o = off(partOf(G, q)); return {x: q.x + o.x, y: q.y + o.y}; };
      const all = planAccessWalkers(G, routes, {a: W.walk[0], b: W.walk[1], map});
      const win = walkWindows(tracked.map(i => all[i].poly.total), W.walk[0], W.walk[1]);
      tracked.forEach((i, j) => { all[i].start = win[j][0]; all[i].end = win[j][1]; });
      all.forEach((w, i) => { w.tracked = tracked.includes(i); w.tpl = {spot: G.spots[w.access] ? all[i].spot : null}; });
      // template (un-exploded) spots for the separate beat
      const used = {restricted: 0, public: 0};
      routes.forEach((rt, i) => { const l = G.spots[rt.access]; all[i].spot0 = l[Math.min(used[rt.access]++, l.length - 1)]; });
      // ---- part boxes (template, exploded)
      const partBox = {
        room: {x: -G.t, y: -G.t, w: G.W + 2 * G.t, h: G.H + 2 * G.t},
        rc: {x: -2 * G.t - G.cw - GAPT, y: -G.t, w: G.cw + G.t, h: G.H + G.t},
        pc: {x: 0, y: G.H + G.t + GAPT, w: G.W + G.t, h: G.cw + G.t},
        lobby: {x: -2 * G.t - G.cw - GAPT, y: G.H + GAPT, w: G.cw + 2 * G.t, h: G.cw + 2 * G.t},
      };
      const elPart = {lobby: 'lobby', publicRoute: 'pc', restrictedRoute: 'rc', room: 'room'};
      const bldD = bld;
      const elBoxD = id => (id === 'building' ? bldD : (() => { const b = partBox[elPart[id]]; const a = toD(b); return {x: a.x, y: a.y, w: b.w * k, h: b.h * k}; })());
      // ---- connectors (design units): adjacent parts meet across their gap beside the passage; others edge to edge
      const doorPubX = G.W / 2 + G.half + 70, doorResY = G.yR + G.half + 70;
      const anchorsFor = (a, b) => {
        const key = [a, b].sort().join('|');
        const L = G.lobby;
        const pairs = {
          // beside the hall's inner corner, so both labels can use the free square between the four parts
          'lobby|publicRoute': [{x: -GAPT, y: L.y + GAPT + L.h * 0.14}, {x: 0, y: L.y + GAPT + L.h * 0.14}],
          'lobby|restrictedRoute': [{x: L.x - GAPT + L.w * 0.18, y: G.H + GAPT}, {x: L.x - GAPT + L.w * 0.18, y: G.H}],
          'publicRoute|room': [{x: doorPubX, y: G.H + G.t + GAPT}, {x: doorPubX, y: G.H + G.t}],
          'restrictedRoute|room': [{x: -G.t - GAPT, y: doorResY}, {x: -G.t, y: doorResY}],
        };
        if (pairs[key]) {
          const [p0, p1] = pairs[key].map(toD);
          const first = key.split('|')[0];
          return a === first ? [p0, p1] : [p1, p0];
        }
        // otherwise: facing edges of the two boxes
        const A = elBoxD(a), B = elBoxD(b);
        const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
        const edge = (bx, c, t) => {
          const dx = t.x - c.x, dy = t.y - c.y;
          const sx = dx ? (bx.w / 2) / Math.abs(dx) : Infinity, sy = dy ? (bx.h / 2) / Math.abs(dy) : Infinity;
          const s0 = Math.min(sx, sy);
          return {x: c.x + dx * s0, y: c.y + dy * s0};
        };
        return [edge(A, ca, cb), edge(B, cb, ca)];
      };
      const conns = rels.map((rel, i) => {
        let [from, to] = anchorsFor(rel.from, rel.to);
        // the building link runs to the room's right wall at the height of the building window
        if ([rel.from, rel.to].includes('building') && [rel.from, rel.to].includes('room')) {
          const roomD = elBoxD('room');
          let bl, rm;
          // from the building's highlighted window (the room seen from outside) to the room's wall
          // from the building's ground floor (beside its label) to the room's wall
          if (kind === 'column') {
            bl = {x: bldD.x, y: bldD.y + bldD.h * 0.96};
            rm = {x: roomD.x + roomD.w, y: clamp(bl.y, roomD.y + 40, roomD.y + roomD.h - 40)};
          } else {
            bl = {x: bldD.x + bldD.w * 0.86, y: bldD.y + bldD.h};
            rm = {x: clamp(bl.x, roomD.x + 40, roomD.x + roomD.w - 40), y: roomD.y};
          }
          [from, to] = rel.from === 'building' ? [bl, rm] : [rm, bl];
        }
        const c = connector(ctx, {name: `rel${i}`, from, to, kind: rel.kind, bend: 0, color: th.fg});
        // the boxes each end must sit on (the building's end sits on its room window)
        const endBox = id => (id === 'building' ? bldD : elBoxD(id));
        return {rel, from, to, c, text: rel.label || p.relationLabels[rel.kind], boxes: [endBox(rel.from), endBox(rel.to)]};
      });
      // ---- obstacles: people (final), routes, parts' interiors are free floor
      const rad = PERSON_RAD * k;
      const seatedD = all.map(w => toD(w.seat));
      const people = all.map((w, i) => bodyBox(seatedD[i], w.seat.deg, rad));
      const waitD = all.filter(w => w.tracked).map(w => toD(w.spot));
      const trailOf = all.map(w => (w.tracked ? simplify(w.pts, 1.5).map(toD) : null));
      const trailsD = trailOf.filter(Boolean);
      // seat labels (tracked arrive on landing; others shown from the start): clear of people and route lines
      const taken = new Set(all.map(w => w.slot));
      // the exploded plan draws only the supplied seats' chairs (tables and benches stay)
      const roomBox = {x: ox + 4 * k, y: oy + 4 * k, w: (G.W - 8) * k, h: (G.H - 8) * k};
      const furn = furnitureBoxes(G, taken).filter(f => f.kind !== 'chair' || !taken.has(f.slot)).map(f => ({x: ox + f.x * k, y: oy + f.y * k, w: f.w * k, h: f.h * k}));
      let labels = [], fails = [];
      if (showKey) {
        const res = placeSeatLabels(ctx, {
          items: all.map((w, i) => ({key: `seat${i}`, text: w.route.label, at: seatedD[i], rad, avoidPaths: trailOf.filter((q, j) => q && j !== i)})),
          people: [...people, ...all.filter(w => w.tracked).map(w => ({...toD(w.spot), rad}))],
          furniture: furn, bounds: roomBox, size: F, minSize: F, maxWidth: Math.min(330 / px, Math.max(220 / px, G.tableW * k * 1.1)), maxLines: 3, maxGap: 50 / px, pathPad: rad * 0.55, extra: [],
          ...accessObstacles(G, toD, taken, taken),
        });
        labels = res.labels;
        fails = res.fails;
      }
      // ---- captions of the parts and of the relations (never over a person, a route, another text or a connector end)
      const hard = [...people.map(q => ({x: q.x - rad, y: q.y - rad, w: 2 * rad, h: 2 * rad})), ...waitD.map(q => ({x: q.x - rad, y: q.y - rad, w: 2 * rad, h: 2 * rad})), ...labels.map(l => l.box)];
      const pathBoxes = trailsD.flatMap(pts => pts.slice(1).map((q, j) => { const a = pts[j]; return {x: Math.min(a.x, q.x) - 6, y: Math.min(a.y, q.y) - 6, w: Math.abs(q.x - a.x) + 12, h: Math.abs(q.y - a.y) + 12}; }));
      // focus enlargement: >= 1.2x about a pivot that keeps the part inside the frame; its caption scales with it
      const fBox = elBoxD(p.focusElement);
      let focusZ = 1.22, pivot = null;
      for (; focusZ >= 1.05; focusZ -= 0.01) {
        const axis = (a0, a1, lim, c) => {
          const lo = (focusZ * a1 - lim + 2) / (focusZ - 1), hi = (focusZ * a0 - 2) / (focusZ - 1);
          return lo <= hi ? clamp(c, lo, hi) : null;
        };
        const px0 = axis(fBox.x, fBox.x + fBox.w, D.w, fBox.x + fBox.w / 2), py0 = axis(fBox.y, fBox.y + fBox.h, D.h, fBox.y + fBox.h / 2);
        if (px0 !== null && py0 !== null) { pivot = {x: px0, y: py0}; break; }
      }
      if (!pivot) { focusZ = 1; pivot = {x: fBox.x + fBox.w / 2, y: fBox.y + fBox.h / 2}; }
      const zoomed = b => ({x: pivot.x + (b.x - pivot.x) * focusZ, y: pivot.y + (b.y - pivot.y) * focusZ, w: b.w * focusZ, h: b.h * focusZ});
      const caps = [];
      const capFails = [];
      let capsClear = true;
      if (showKey) {
        // the tracer rests on each visited element's centre: no caption there
        const tracerBoxes = p.traversalOrder.map(id => { const b = elBoxD(id); const c = {x: b.x + b.w / 2, y: b.y + b.h / 2}; return {x: c.x - 26 / px, y: c.y - 26 / px, w: 52 / px, h: 52 / px}; });
        const segBoxes = conns.map(cn => ({x: Math.min(cn.from.x, cn.to.x) - 7, y: Math.min(cn.from.y, cn.to.y) - 7, w: Math.abs(cn.to.x - cn.from.x) + 14, h: Math.abs(cn.to.y - cn.from.y) + 14}));
        const panelBoxes = panelParts.map(pt => ({x: pt.x, y: pt.y, w: pt.m.w, h: pt.m.height}));
        const frameB = {x: 0, y: 0, w: D.w, h: D.h};
        // the nearest free spot for a chip (w × hh) around a target point, within maxR
        const place = (id, text, target, maxR, stroke, weight, maxW, accept = null) => {
          const probe = measureStack(ctx, [{type: 'chip', text, stroke, weight}], maxW, F);
          if (probe.truncated) return false;
          const cw0 = Math.min(maxW, fitG(text, {maxWidth: maxW - F * 1.2, size: F, minSize: F, maxLines: 5, weight}).width + F * 1.2);
          const hh = probe.height - F * 0.28;
          const isFocusCap = id === `el-${p.focusElement}`;
          const obst = [...hard, ...caps.flatMap(c => (c.zbox ? [c.box, c.zbox] : [c.box])), ...pathBoxes, ...segBoxes, ...panelBoxes, bldD, ...tracerBoxes];
          let got = null;
          for (const [dx, dy] of spiral(maxR, 7 / px)) {
            const box = {x: target.x + dx - cw0 / 2, y: target.y + dy - hh / 2, w: cw0, h: hh};
            if (box.x < frameB.x + 2 || box.y < frameB.y + 2 || box.x + cw0 > frameB.w - 2 || box.y + hh > frameB.h - 2) continue;
            if (obst.some(o => overlap(box, o, 5 / px))) continue;
            if (accept && !accept(box)) continue;
            if (isFocusCap) {
              // the enlarged caption stays in the frame and clear of everything as well
              const zb = zoomed(box);
              if (zb.x < 2 || zb.y < 2 || zb.x + zb.w > D.w - 2 || zb.y + zb.h > D.h - 2 || obst.some(o => overlap(zb, o, 5 / px))) continue;
            }
            got = box;
            break;
          }
          if (!got) { capsClear = false; capFails.push(id); got = {x: clamp(target.x - cw0 / 2, 2, D.w - cw0 - 2), y: clamp(target.y - hh / 2, 2, D.h - hh - 2), w: cw0, h: hh}; }
          caps.push({id, text, box: got, stroke, weight, maxW, zbox: isFocusCap ? zoomed(got) : null});
          return true;
        };
        // part captions: on the part's own floor (room: its front-left corner; corridors: their far ends; hall: its centre)
        const anchorOf = id => {
          const b = elBoxD(id);
          // (the room's caption keeps clear of the building link: top-left when the building stands on the right)
          if (id === 'room') return {x: b.x + b.w * (kind === 'column' ? 0.2 : 0.8), y: b.y + b.h * 0.1};
          if (id === 'restrictedRoute') return {x: b.x + b.w / 2, y: b.y + b.h * 0.12};
          if (id === 'publicRoute') return {x: b.x + b.w * 0.82, y: b.y + b.h / 2};
          return {x: b.x + b.w / 2, y: b.y + b.h / 2};
        };
        for (const id of EL.filter(q => q !== 'building')) if (!place(`el-${id}`, cap(id), anchorOf(id), 130 / px, th.inkSoft, 700, Math.min(260 / px, D.w * 0.22))) return null;
        // relation labels: beside their connector, never on it
        conns.forEach((cn, i) => {
          if (i === bRel) return;
          const mid = {x: (cn.from.x + cn.to.x) / 2, y: (cn.from.y + cn.to.y) / 2};
          // owned: within 40 px of its own connector and clearly nearer it than any other connector (two relations with
          // the same wording therefore never share a spot)
          const dTo = (box, c2) => Math.min(...Array.from({length: 21}, (_, j) => boxDistP(box, {x: lerp(c2.from.x, c2.to.x, j / 20), y: lerp(c2.from.y, c2.to.y, j / 20)})));
          const accept = box => {
            const own = dTo(box, cn);
            if (own > 36 / px || !conns.every((c2, j) => j === i || dTo(box, c2) > own + 16 / px)) return false;
            // relation labels keep apart from each other (no stacked chips)
            return caps.filter(c => /^rel\d+-lab$/.test(c.id)).every(c => !overlap(box, c.box, 22 / px));
          };
          place(`rel${i}-lab`, cn.text, mid, 230 / px, th.fg, 600, Math.min(260 / px, D.w * 0.22), accept);
          const c = caps[caps.length - 1];
          // beside its own connector: within 30 px of the line
          const dSeg = Math.min(...Array.from({length: 11}, (_, j) => boxDistP(c.box, {x: lerp(cn.from.x, cn.to.x, j / 10), y: lerp(cn.from.y, cn.to.y, j / 10)})));
          if (c && dSeg > 40 / px) { capsClear = false; capFails.push(`${c.id}:far`); }
        });
      }
      return {F, kind, cf, box, pbox, bld, panelParts, k, G, ox, oy, toD, off, map, all, tracked, conns, labels, fails, caps, capsClear, capFails, partBox, elBoxD, rad, gapT: GAPT, focusZ, pivot};
    };

    const kinds = shape === 'portrait' ? [['band', 0.36], ['band', 0.42]] : [['column', 0.22], ['column', 0.26], ['column', 0.3]];
    let best = null;
    const log = [];
    const good = L => !L.fails.length && L.capsClear && L.k * PERSON_RAD * 2 * 1.05 * px >= 61.5;
    for (let F = 22.5 / px; F >= Fmin - 1e-6; F -= 0.8 / px) {
      for (const [kind, cf, gp] of kinds.flatMap(q => GAPS.map(gp0 => [...q, gp0]))) {
        const L = compose(showKey ? F : Fmin, kind, cf, gp);
        if (L && L.k * PERSON_RAD * 2 * 1.05 * px < 64 && gp !== GAPS[GAPS.length - 1] && !good(L)) continue;
        log.push(L ? `${(F * px).toFixed(1)}:${kind}${cf}/g${gp}:k${L.k.toFixed(2)}:${L.fails.join('+')}${L.capsClear ? '' : ':caps=' + L.capFails.join('+')}` : `${(F * px).toFixed(1)}:${kind}${cf}:null`);
        if (!L) continue;
        if (!best || (good(L) && !good(best)) || (good(L) === good(best) && (L.gapT > best.gapT || (L.gapT === best.gapT && L.k > best.k + 1e-6)) && L.F >= best.F - 1e-6)) best = L;
      }
      if ((best && good(best)) || !showKey) break;
    }
    if (!best) best = compose(Fmin, kinds[0][0], kinds[0][1], GAPS[GAPS.length - 1]);
    const L = best;
    const {F, G, k, ox, oy, toD, all} = L;
    const art = accessArt(ctx, G, {prefix: 'rm', chairs: new Set(all.map(w => w.slot))});
    const people = all.map((w, i) => accessPerson(ctx, `p${i}`, w.route.look));
    const trails = all.map((w, i) => (w.tracked ? accessTrail(ctx, {name: `trail${i}`, pts: w.pts, color: accessColor(ctx, w.access)}) : null));
    // thresholds: floor strips that span each gap at a passage (drawn in exploded template units, grown with the gap)
    const c0 = art.colors;
    const GAPT = L.gapT;
    const thresholds = [
      {name: 'thr-r', x: -G.t - GAPT, y: G.doors.restricted.a, w: GAPT, h: G.doors.restricted.b - G.doors.restricted.a, dir: 'x'},
      {name: 'thr-p', x: G.doors.public.a, y: G.H + G.t, w: G.doors.public.b - G.doors.public.a, h: GAPT, dir: 'y'},
      {name: 'thr-lr', x: G.openings.restricted.x - 56 - GAPT, y: G.H, w: 112, h: GAPT, dir: 'y', lobby: true},
      {name: 'thr-lp', x: -G.t - GAPT, y: G.openings.public.y - 56 + GAPT, w: GAPT, h: 112, dir: 'x', lobby: true},
    ];
    const thrNodes = thresholds.map(q => h('rect', {name: q.name, x: r(q.x), y: r(q.y), width: r(q.w), height: r(q.h), fill: c0.corridor, stroke: c0.corridorLine, 'stroke-width': 2}));
    const building = buildingElevation(ctx, {name: 'bld', ...L.bld, floors: 3, bays: 5, highlight: {floor: 0, bay: 1}});
    const panel = L.panelParts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden: it => /^kind-/.test(it.name) || it.name === 'el-building' || /^rel\d+-lab$/.test(it.name)}));
    // the tracer route through the supplied traversal order (element centres, via a relation's ends when one joins them)
    const centre = id => { const b = L.elBoxD(id); return {x: b.x + b.w / 2, y: b.y + b.h / 2}; };
    const tpts = [];
    const visits = [];
    p.traversalOrder.forEach((id, j) => {
      if (j > 0) {
        const prev = p.traversalOrder[j - 1];
        const cn = L.conns.find(c => (c.rel.from === prev && c.rel.to === id) || (c.rel.from === id && c.rel.to === prev));
        if (cn) { const [a, b] = cn.rel.from === prev ? [cn.from, cn.to] : [cn.to, cn.from]; tpts.push(a, b); }
      }
      visits.push({id, at: tpts.length});
      tpts.push(centre(id));
    });
    const tpoly = polyline(tpts.length > 1 ? tpts : [tpts[0], {x: tpts[0].x + 1, y: tpts[0].y}]);
    // arc-length position of each visit
    let acc = 0;
    const lens = [0];
    for (let j = 1; j < tpts.length; j++) { acc += Math.hypot(tpts[j].x - tpts[j - 1].x, tpts[j].y - tpts[j - 1].y); lens.push(acc); }
    visits.forEach(v => { v.s = acc ? lens[v.at] / acc : 0; });
    const {focusZ, pivot} = L;
    const problems = [];
    if (L.fails.length) problems.push('labels');
    if (!L.capsClear) problems.push('captions');
    if (focusZ < 1.2 - 1e-9) problems.push('focus-zoom');
    return {
      F, px, G, k, ox, oy, toD, all, art, people, trails, thrNodes, thresholds, building, panel, conns: L.conns, caps: L.caps, labels: L.labels, tracked: L.tracked,
      tpoly, visits, off: L.off, problems, kind: L.kind, log, partBox: L.partBox, elBoxD: L.elBoxD, gapT: L.gapT, focusZ, pivot,
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    const part = n => g({name: `part-${n}`}, g({name: `lift-${n}`}));
    void part;
    return g(null,
      g({name: 'bld-wrap'}, L.building.node),
      g({name: 'plan', transform: T(L.ox, L.oy, 0, L.k)},
        L.thrNodes,
        L.art.node,
        L.trails.filter(Boolean).map(t => t.node),
        L.people.map(pp => pp.node)),
      L.conns.map(cn => g({name: `rel${L.conns.indexOf(cn)}-wrap`}, cn.c.node)),
      // each caption is drawn with the width it was measured with, centred on its placed box
      L.caps.map(c => g({name: c.id, opacity: 0}, drawStack(ctx, measureStack(ctx, [{type: 'chip', text: c.text, stroke: c.stroke, weight: c.weight}], c.maxW, L.F), c.box.x + c.box.w / 2 - c.maxW / 2, c.box.y).map(q => q.node))),
      L.labels.map((sl, i) => seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: `rm-chair-${L.all[i].slot}`})),
      L.panel.map(q => q.node),
      g({name: 'tracer', opacity: 0, transform: 'translate(0 0)'},
        h('circle', {r: 24, fill: th.ink, opacity: 0.16}),
        h('circle', {r: 12, fill: th.ink, stroke: th.paper, 'stroke-width': 4})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const G = L.G;
    const e = ease.inOutCubic(seg(u, ...W.sep));
    // parts slide apart; the thresholds grow with the gap
    for (const [pn, gname] of [['rc', 'rm-g-rc'], ['pc', 'rm-g-pc'], ['lobby', 'rm-g-lobby'], ['room', 'rm-g-room']]) {
      const o = L.off(pn, e);
      nodes[gname] = {transform: T(o.x, o.y)};
    }
    L.thresholds.forEach(q => {
      // each strip is anchored on the side that stays (room or corridor) and spans the current gap
      const GAPT = L.gapT;
      const gp = GAPT * e;
      if (q.name === 'thr-r') nodes[q.name] = {x: r(-G.t - gp), width: r(gp), y: r(q.y), height: r(q.h)};
      else if (q.name === 'thr-p') nodes[q.name] = {y: r(G.H + G.t), height: r(gp), x: r(q.x), width: r(q.w)};
      else if (q.name === 'thr-lr') nodes[q.name] = {x: r(q.x + GAPT - gp), y: r(G.H), width: r(q.w), height: r(gp)};
      else nodes[q.name] = {x: r(-G.t - gp), y: r(q.y - GAPT + gp), width: r(gp), height: r(q.h)};
    });
    // focus enlargement while the tracer is on the focus part
    const ts = ease.inOutSine(seg(u, ...W.trace));
    const tq = L.tpoly.at(ts);
    const focusVisit = L.visits.filter(v => v.id === p.focusElement);
    const near = focusVisit.length ? Math.max(...focusVisit.map(v => clamp(1 - Math.abs(ts - v.s) / 0.09))) : 0;
    const zoom = 1 + (L.focusZ - 1) * ease.inOutSine(near) * (u >= W.trace[0] && u <= W.trace[1] ? 1 : 0);
    const fc = L.pivot;
    const partName = {lobby: 'lobby', publicRoute: 'pc', restrictedRoute: 'rc', room: 'room'}[p.focusElement];
    if (partName) {
      const o = L.off(partName, e);
      // scale about the part's centre, in template units of the plan
      const cT = {x: (fc.x - L.ox) / L.k - o.x, y: (fc.y - L.oy) / L.k - o.y};
      nodes[`rm-g-${partName}`] = {transform: `${T(o.x, o.y)} ${scaleAbout(cT.x, cT.y, r(zoom, 4))}`};
    }
    nodes['bld-wrap'] = {transform: p.focusElement === 'building' ? scaleAbout(fc.x, fc.y, r(zoom, 4)) : 'translate(0 0)'};
    // people: waiting ones ride with their corridor; the tracked walk in the trace beat; the others are seated
    const positions = [];
    const semantic = {states: [], labels: [], people: []};
    L.all.forEach((w, i) => {
      let st;
      if (w.tracked) {
        const q = seg(u, w.start, w.end);
        if (q <= 0) {
          const pn = partOf(G, w.spot0);
          const o = L.off(pn, e);
          st = {x: w.spot0.x + o.x, y: w.spot0.y + o.y, deg: w.spot0.deg, phase: 0, walk: 0, seated: 0, state: 'waiting'};
        } else st = walkerAt(w, q, {reduced: ctx.reduced});
        // people keep their place and size while a part is enlarged (the enlargement shows the part itself)
        const draw = seg(u, w.start - 0.03, w.start + (w.end - w.start) * 0.45);
        Object.assign(nodes, L.trails[i].frame(draw, 1));
      } else {
        st = {x: w.seat.x, y: w.seat.y, deg: w.seat.deg, phase: 0, walk: 0, seated: 1, state: 'seated'};
      }
      Object.assign(nodes, L.people[i].pose({x: st.x, y: st.y, deg: st.deg, phase: st.phase, walk: st.walk, seated: st.seated, scale: st.scale ?? 1}));
      positions.push(st);
      const bodyP = w.tracked ? seg(u, w.end - 0.012, w.end + 0.018) : 1;
      const textP = w.tracked ? seg(u, w.end + 0.012, w.end + 0.04) : 1;
      if (L.labels[i]) {
        nodes[`lab${i}`] = {opacity: r(bodyP, 3)};
        nodes[`lab${i}-text`] = {opacity: r(textP, 3)};
      }
      const dp = L.toD(st);
      semantic[`p${i}`] = R2(dp);
      semantic[`seat${i}`] = R2(L.toD(w.seat));
      semantic.states.push(st.state);
      semantic.labels.push(r(L.labels[i] ? textP : w.tracked ? (seg(u, w.start, w.end) >= 1 ? 1 : 0) : 1, 3));
      semantic.people.push(R2(dp));
    });
    Object.assign(nodes, L.art.doors.public.frame(doorOpen(G, 'public', positions.map(q => ({...q, x: q.x, y: q.y - L.off('pc', 1).y * 0})))));
    Object.assign(nodes, L.art.doors.restricted.frame(doorOpen(G, 'restricted', positions)));
    // part captions with the separation, relation connectors one by one
    const capP = seg(u, ...W.cap);
    // the focus part's caption follows its enlargement (same scale about the same pivot)
    const capT = id => (id === `el-${p.focusElement}` ? scaleAbout(fc.x, fc.y, r(zoom, 4)) : 'translate(0 0)');
    L.caps.forEach(c => { if (/^el-/.test(c.id)) nodes[c.id] = {opacity: r(capP, 3), transform: capT(c.id)}; });
    if (L.panel.some(q => q.name === 'el-building')) nodes['el-building'] = {opacity: r(capP, 3), transform: p.focusElement === 'building' ? scaleAbout(fc.x, fc.y, r(zoom, 4)) : 'translate(0 0)'};
    const n = Math.max(1, L.conns.length);
    const span = (W.relate[1] - W.relate[0]) / n;
    const drawn = [];
    L.conns.forEach((cn, i) => {
      const a = W.relate[0] + i * span;
      const dp = seg(u, a, a + span * 0.7);
      Object.assign(nodes, cn.c.frame(dp, 1));
      const lab = L.caps.find(c => c.id === `rel${i}-lab`) || L.panel.find(q => q.name === `rel${i}-lab`);
      const lp = seg(u, a + span * 0.55, a + span * 0.95);
      if (lab) nodes[lab.id || lab.name] = {opacity: r(lp, 3)};
      drawn.push(r(dp, 3));
    });
    // tracer
    const tOn = u >= W.trace[0] && u <= W.trace[1] + 0.02 ? 1 : 0;
    nodes.tracer = {transform: `translate(${r(tq.x)} ${r(tq.y)})`, opacity: tOn};
    const visited = L.visits.filter(v => ts >= v.s - 1e-9 && tOn).map(v => v.id);
    const legendP = seg(u, ...W.legend);
    L.panel.forEach(q => { if (/^kind-/.test(q.name)) nodes[q.name] = {opacity: r(legendP, 3)}; });
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        ...semantic,
        beat,
        explode: r(e, 3),
        connectorsDrawn: drawn,
        connectorKinds: L.conns.map(c => c.rel.kind),
        arrows: L.conns.filter(c => LINK_STYLES[c.rel.kind].arrow).length,
        tracer: R2(tq),
        tracerOn: tOn,
        visited,
        zoom: r(zoom, 3),
        focus: p.focusElement,
        tracked: L.tracked,
        seated: semantic.states.filter(s0 => s0 === 'seated').length,
        legendShown: r(legendP, 3),
        allReached: true,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
        arrangement: L.kind,
        connectorEnds: L.conns.map(c => [R2(c.from), R2(c.to)]),
        // distance of each connector end to the edge of its own part (design units): 0 = on the edge
        connectorGaps: L.conns.map(c => r(Math.max(...[[c.from, c.boxes[0]], [c.to, c.boxes[1]]].map(([q, b]) => {
          const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
          const outside = Math.hypot(dx, dy);
          const inside = Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h));
          return outside > 0 ? outside : inside;
        })), 1)),
        log: L.log,
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
    slug: 'courts-05-mechanism',
    title: 'Room access — the parts of the two supplied routes and how they connect',
    titleEs: 'Acceso a sala — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Acceso a sala',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The plan of a generic room opens into its parts — entrance hall, public corridor and door (●), restricted corridor and door as configured (◆), room with its seats — with a threshold spanning each gap and the generic building beside it. Only the supplied relationships are drawn, anchored to the parts and styled by kind (plain relations never get an arrow). A tracer follows the supplied order while the part in focus enlarges and the first participant of each route walks across its threshold to a seat. No rule, attendance right or outcome is shown.',
    tags: ['mechanism', 'exploded plan', 'room access', 'public access', 'restricted access as configured', 'corridors', 'doors', 'relations', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/acceso-a-sala.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
