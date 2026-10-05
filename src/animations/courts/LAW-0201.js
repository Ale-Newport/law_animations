/**
 * LAW-0201 — Distribución de una sala · story
 *
 * Storyboard (a generic building and the plan of one of its rooms, seen from
 * above; the building front stands beside the plan as the anchor):
 *  0.00–0.15  rest: the generic building (its room window highlighted, its
 *             name under it) and the floor plan of the room inside it — walls,
 *             doors, platform, front desk, two tables, a back bench, empty
 *             chairs. The seats that will be taken carry dashed rings; the
 *             participants wait whole and opaque in the corridor, each facing
 *             the door they will use. Room name and door captions are shown.
 *  0.15–0.42  the plan places the first participants: a dotted route draws
 *             from each person's spot through a door to their seat, the door
 *             swings open as they pass, they walk along it (feet and arms
 *             alternate), turn and sit. As each person lands, their seat's
 *             editable label arrives beside the seat with a short leader
 *             (chip body first, then its text); the dashed ring goes.
 *  0.42–0.73  the remaining participants follow the same way; labels stay
 *             attached to their seats; nobody appears except through a door.
 *  0.73–1.00  hold: the supplied final state (everyone seated, or the last
 *             person still waiting at the door), the keyed notes and the key
 *             "as supplied · no conclusion drawn". No position is given a
 *             legal meaning, and no procedure or outcome is shown.
 * @module animations/courts/LAW-0201
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {planPerson, routeTrail, buildingElevation, planColors} from './kits/courts-art.js';
import {
  salaFields, SALA_EN, SALA_STRINGS, resolveSala, roomGeometry, fitRoom, planWalkers, walkerAt, doorOpen,
  roomArt, furnitureBoxes, placeSeatLabels, placeFree, seatObstacles, remainingPath, bodyBox, seatLabelNode, gchip, glue, fitWords, pxPerUnit, legendGlyph,
  overlaps, R2, PERSON_RAD,
} from './kits/distribucion-de-sala.js';

const ID = 'LAW-0201';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const WALK = [0.16, 0.72];
const W_NOTES = [0.75, 0.81];
const TARGETS = ['mainDoor', 'sideDoor', 'room', 'firstSeat', 'lastSeat'];

const STRINGS = {
  en: {...SALA_STRINGS.en, legend: 'Plan key'},
  es: {...SALA_STRINGS.es, legend: 'Clave del plano'},
};

const sceneSchema = {
  ...salaFields,
  actorLabels: obj('Caption of the person glyph in the plan legend', {
    participant: str('Caption for the people drawn from above', 50),
  }),
  objectLabels: obj('Captions of the plan glyphs in the legend', {
    route: str('Caption for the dotted route', 60),
    seat: str('Caption for a seat', 60),
  }),
  actionProgress: num('How far the placement is allowed to progress (1 = everyone reaches a seat; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring drawn on its target in the plan', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['all-seated', 'last-waiting']),
};

const defaultParams = {
  ...SALA_EN,
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {route: 'Route to the seat', seat: 'Seat'},
  actionProgress: 1,
  annotations: [{target: 'sideDoor', text: 'One person uses the side door (as supplied)'}],
  finalState: 'all-seated',
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
    const {seats, routes} = resolveSala(ctx, p);
    const walkerCount = routes.length;
    const finalWaiting = p.finalState === 'last-waiting' && walkerCount > 0 ? walkerCount - 1 : -1;

    // ---- info panel content (measured at a given text size)
    const legendItems = showAll ? [
      {kind: 'person', text: p.actorLabels.participant},
      {kind: 'route', text: p.objectLabels.route},
      {kind: 'seat', text: p.objectLabels.seat},
    ] : [];
    const finalText = p.finalState === 'last-waiting' ? ctx.t.lastWaiting : ctx.t.allSeated;
    const notes = showAll ? p.annotations : [];

    // Panel: the building (art) + name chip, legend rows, notes, state tag and key.
    // flow 'column' (beside the plan) or 'band' (building left, texts right).
    const panelFor = (flow, pw, ph, F) => {
      const items = [];
      const gap = F * 0.7;
      const textW = flow === 'column' ? pw : pw * 0.62;
      const glyph = F * 2.1;
      if (showKey) items.push({type: 'name', chip: gchip(ctx, p.courts.building, {x: 0, y: 0, anchor: 'middle', maxWidth: flow === 'column' ? pw : pw - textW - 16, size: F, minSize: F, maxLines: 3, fill: th.card})});
      for (const it of legendItems) items.push({type: 'legend', kind: it.kind, fit: fitWords(glue(it.text), {maxWidth: textW - glyph - 14, size: F, minSize: F, maxLines: 3, weight: 500}), glyph});
      notes.forEach((n, i) => items.push({type: 'note', i, fit: fitWords(glue(n.text), {maxWidth: textW - F * 1.9 - 12, size: F, minSize: F, maxLines: 4, weight: 500})}));
      if (showKey) items.push({type: 'state', chip: gchip(ctx, finalText, {x: 0, y: 0, anchor: 'start', maxWidth: textW, size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent4, color: th.ink, weight: 700})});
      if (showKey) items.push({type: 'key', fit: fitWords(glue(p.labels.key), {maxWidth: textW - 12, size: F, minSize: F, maxLines: 4, weight: 500})});
      const hOf = it => (it.type === 'name' || it.type === 'state' ? it.chip.box.h : it.type === 'legend' ? Math.max(it.glyph, it.fit.height) : it.fit.height + (it.type === 'key' ? F * 0.6 : 0));
      const truncated = items.some(it => (it.chip ? it.chip.fit.truncated : it.fit.truncated));
      const nameItem = items.find(it => it.type === 'name');
      const textItems = items.filter(it => it.type !== 'name');
      const textH = textItems.reduce((a, it) => a + hOf(it) + gap, 0);
      let bld;
      if (flow === 'column') {
        const nameH = nameItem ? hOf(nameItem) + gap : 0;
        const room = ph - textH - nameH;
        const bh = Math.min(room, pw * 0.95, ph * 0.5);
        bld = {w: Math.min(pw, bh / 0.9), h: bh};
        return {flow, items, textItems, nameItem, bld, need: textH + nameH + Math.max(bh, 0), ok: !truncated && bh >= Math.min(160, ph * 0.22), truncated, textW, gap, hOf};
      }
      const nameH = nameItem ? hOf(nameItem) + gap : 0;
      const bw = pw - textW - 16;
      const bh = Math.min(bw * 0.95, ph - nameH);
      bld = {w: bw, h: bh};
      const need = Math.max(bh + nameH, textH);
      return {flow, items, textItems, nameItem, bld, need, ok: !truncated && need <= ph + 0.5, truncated, textW, gap, hOf};
    };

    // candidate arrangements: plan + column (right) or plan + band (top in portrait, bottom in square)
    const shape = ctx.view.shape;
    const F0 = 22.5 / px, Fmin = 16.6 / px;
    const attempt = (F, force) => {
    const tries = [];
    if (!force) {
      if (shape !== 'portrait') {
        for (const cf of [0.24, 0.28, 0.32, 0.36]) {
          const pw = Math.max(260 / px, D.w * cf);
          const pan = panelFor('column', pw, D.h, F);
          if (!pan.ok || pan.need > D.h + 0.5) continue;
          const box = {x: 0, y: 0, w: D.w - pw - 28, h: D.h};
          const fr = fitRoom(box);
          tries.push({F, pan, box, fr, panelBox: {x: D.w - pw, y: 0, w: pw, h: D.h}});
        }
      }
      if (shape !== 'landscape') {
        for (const bf of [0.2, 0.24, 0.28, 0.33]) {
          const ph = D.h * bf;
          const pan = panelFor('band', D.w, ph, F);
          if (!pan.ok) continue;
          const bandH = pan.need;
          const top = shape === 'portrait';
          const box = {x: 0, y: top ? bandH + 24 : 0, w: D.w, h: D.h - bandH - 24};
          const fr = fitRoom(box);
          tries.push({F, pan, box, fr, panelBox: {x: 0, y: top ? 0 : D.h - bandH, w: D.w, h: bandH}});
        }
      }
    }
    if (force) {
      // labels hidden (or nothing fits): the building beside the plan, no texts
      const pw = D.w * (shape === 'portrait' ? 1 : 0.22);
      const pan = panelFor(shape === 'portrait' ? 'band' : 'column', pw, shape === 'portrait' ? D.h * 0.22 : D.h, Fmin);
      const box = shape === 'portrait' ? {x: 0, y: pan.need + 24, w: D.w, h: D.h - pan.need - 24} : {x: 0, y: 0, w: D.w - pw - 28, h: D.h};
      tries.push({F: Fmin, pan, box, fr: fitRoom(box), panelBox: shape === 'portrait' ? {x: 0, y: 0, w: D.w, h: pan.need} : {x: D.w - pw, y: 0, w: pw, h: D.h}});
    }
    if (!tries.length) return null;
    tries.sort((a, b) => b.fr.k - a.fr.k || b.F - a.F);
    const pick = tries[0];
    const {W, H, k} = pick.fr;
    const G = roomGeometry(W, H);
    const E = G.extents;
    // centre the plan in its box
    const ox = pick.box.x + (pick.box.w - E.w * k) / 2 - E.x * k;
    const oy = pick.box.y + (pick.box.h - E.h * k) / 2 - E.y * k;
    const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
    const planRect = {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k};

    // ---- walkers
    const walkers = planWalkers(G, routes, {a: WALK[0], b: WALK[1]});
    const takenSlots = walkers.filter((w, i) => i !== finalWaiting).map(w => w.slot);
    const room = roomArt(ctx, G, {prefix: 'rm', emptyRings: walkers.map(w => w.slot)});
    const people = walkers.map((w, i) => planPerson(ctx, {name: `p${i}`, look: w.route.look}));
    const trails = walkers.map((w, i) => routeTrail(ctx, {name: `trail${i}`, pts: w.pts, width: 6}));

    // ---- labels in design units
    const rad = PERSON_RAD * k;
    const roomBox = {x: ox + 4 * k, y: oy + 4 * k, w: (W - 8) * k, h: (H - 8) * k};
    const furn = furnitureBoxes(G).filter(f => f.kind !== 'chair' || !takenSlots.includes(f.slot)).map(f => ({x: ox + f.x * k, y: oy + f.y * k, w: f.w * k, h: f.h * k}));
    const extra = [];
    // door captions (visible from the start: clear of every route), then seat labels, then the room name
    let roomChip = null;
    const doorChips = [];
    let doorFails = [];
    const pathD = w => w.pts.map(toD);
    let seatLabels = [];
    let labelFails = [];
    if (showKey) {
      const res = placeSeatLabels(ctx, {
        items: walkers.map((w, i) => ({key: `seat${i}`, text: w.route.label, at: toD(w.seat), rad, avoidPaths: walkers.slice(i + 1).map(v => remainingPath(v, w.end - 0.012).map(toD)).filter(q => q.length)})),
        people: walkers.map((w, i) => (i === finalWaiting ? {...toD(w.spot), rad} : bodyBox(toD(w.seat), w.seat.deg, rad))),
        furniture: furn, bounds: roomBox, size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 36 / px, pathPad: rad * 0.55, extra,
        ...seatObstacles(G, toD, new Set(takenSlots)),
      });
      seatLabels = res.labels;
      labelFails = res.fails;
    }
    if (showAll) {
      const doorItems = [
        {key: 'mainDoor', text: p.labels.mainDoor, at: toD({x: (G.mainDoor.a + G.mainDoor.b) / 2, y: G.H + G.t / 2}), rad: 10},
        {key: 'sideDoor', text: p.labels.sideDoor, at: toD({x: G.W + G.t / 2, y: (G.sideDoor.a + G.sideDoor.b) / 2}), rad: 10},
      ];
      // each caption inside the room if it fits there, else in the corridor beside its door
      const corrR = {x: ox + (G.W + G.t + 4) * k, y: oy + 4 * k, w: (G.cw - 8) * k, h: (G.H + G.t + G.cw - 8) * k};
      const corrB = {x: ox + 4 * k, y: oy + (G.H + G.t + 4) * k, w: (G.W + G.t + G.cw - 8) * k, h: (G.cw - 8) * k};
      const everyone = walkers.flatMap((w, i) => [{...toD(w.spot), rad}, ...(i === finalWaiting ? [] : [{...toD(w.seat), rad}])]);
      const placedDoors = {labels: [], fails: []};
      for (const it of doorItems) {
        let got = null;
        for (const bounds of [it.key === 'sideDoor' ? corrR : corrB, roomBox]) {
          const res = placeSeatLabels(ctx, {items: [{...it, avoidPaths: walkers.map(pathD)}], people: everyone, furniture: furn, bounds, size: F, minSize: F, maxWidth: Math.min(300 / px, bounds.w), maxLines: 4, maxGap: 220, pathPad: rad * 0.72, strictPaths: true,
            extra: [...extra, ...seatLabels.map(sl => sl.box), ...placedDoors.labels.map(q => q.box)]});
          if (!res.fails.length) { got = res.labels[0]; break; }
          if (!got || (got.none && !res.labels[0].none)) got = res.labels[0];
          if (bounds === roomBox) placedDoors.fails.push(it.key);
        }
        placedDoors.labels.push(got);
      }
      placedDoors.labels.forEach((L, i) => { doorChips.push({key: doorItems[i].key, L}); extra.push(L.box); });
      doorFails = placedDoors.fails;
    }
    if (showKey) {
      const ropts = {maxWidth: Math.max(240 / px, Math.min(380 / px, W * k * 0.34)), size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent2};
      const probe = gchip(ctx, p.courts.room, {x: 0, y: 0, ...ropts});
      const spot = placeFree({w: probe.box.w, h: probe.box.h, bounds: roomBox, people: walkers.map((w, i) => ({...toD(i === finalWaiting ? w.spot : w.seat), rad})),
        extra: [...extra, ...seatLabels.map(sl => sl.box)], paths: walkers.map(pathD), pathPad: rad * 0.72, furniture: furn, prefer: 'top-left'});
      if (!spot) labelFails.push('room');
      const at = spot || {x: roomBox.x, y: roomBox.y};
      roomChip = gchip(ctx, p.courts.room, {x: at.x, y: at.y, ...ropts, name: 'room-name'});
    }

    // a door caption placed further than usual (still clear of people, routes and chips) is not a failure
    const doorFar = doorFails;
    return {F, pick, W, H, k, G, E, ox, oy, toD, planRect, walkers, takenSlots, room, people, trails, rad, roomBox, furn, extra, roomChip, doorChips, seatLabels, labelFails, pathD, doorFar};
    };
    let A = null;
    const LOG = [];
    for (let F = F0; F >= Fmin - 1e-6; F -= 0.8 / px) {
      const at = attempt(F, false);
      LOG.push(at ? `${(F * px).toFixed(1)}:${at.labelFails.join('+')}:k${at.k.toFixed(2)}` : `${(F * px).toFixed(1)}:null`);
      if (!at) continue;
      if (!A || at.labelFails.length < A.labelFails.length) A = at;
      if (!at.labelFails.length) break;
    }
    if (!A) A = attempt(Fmin, true);
    const {F, pick, W, H, k, G, ox, oy, toD, planRect, walkers, room, people, trails, rad, roomChip, doorChips, seatLabels, labelFails} = A;
    A.log = LOG;
    // ---- annotation rings on their targets (keyed to the notes in the panel)
    const targetOf = tg => {
      if (tg === 'mainDoor') return {...toD(G.doors.main.gate), rr: 66 * k};
      if (tg === 'sideDoor') return {...toD(G.doors.side.gate), rr: 66 * k};
      if (tg === 'room') return {...toD({x: G.W / 2, y: G.H / 2}), rr: 0, box: {x: ox, y: oy, w: W * k, h: H * k}};
      const w = tg === 'firstSeat' ? walkers[0] : walkers[walkers.length - 1];
      return w ? {...toD(w.seat), rr: 58 * k} : {...toD({x: G.W / 2, y: G.H / 2}), rr: 58 * k};
    };
    const noteColors = [th.accent3, th.accent4];

    // ---- panel placement
    const pan = pick.pan;
    const PB = pick.panelBox;
    const panelNodes = [];
    let stateNode = null;
    const boxes = [];
    let bldBox;
    let building;
    if (pan.flow === 'column') {
      const colX = PB.x;
      let y = 0;
      bldBox = {x: colX + (PB.w - pan.bld.w) / 2, y, w: pan.bld.w, h: pan.bld.h};
      y += pan.bld.h + pan.gap;
      if (pan.nameItem) {
        const c = gchip(ctx, p.courts.building, {x: colX + PB.w / 2, y, anchor: 'middle', maxWidth: PB.w, size: F, minSize: F, maxLines: 3, fill: th.card, name: 'bld-name'});
        panelNodes.push(c.node);
        boxes.push(c.box);
        y += c.box.h + pan.gap;
      }
      const rest = pan.textItems.reduce((a, it) => a + pan.hOf(it) + pan.gap, 0);
      y += Math.max(0, (D.h - y - rest) * 0.35);
      for (const it of pan.textItems) {
        const node = panelItem(ctx, it, colX, y, pan, F, p, noteColors);
        if (it.type === 'state') stateNode = node; else panelNodes.push(node);
        y += pan.hOf(it) + pan.gap;
      }
    } else {
      const band = PB;
      const bw = pan.bld.w;
      bldBox = {x: band.x, y: band.y, w: bw, h: pan.bld.h};
      let y0 = band.y + pan.bld.h + pan.gap * 0.6;
      if (pan.nameItem) {
        const c = gchip(ctx, p.courts.building, {x: band.x + bw / 2, y: y0, anchor: 'middle', maxWidth: bw, size: F, minSize: F, maxLines: 3, fill: th.card, name: 'bld-name'});
        panelNodes.push(c.node);
      }
      const tx = band.x + bw + 16 + (D.w - bw - 16 - pan.textW);
      let y = band.y + Math.max(0, (band.h - pan.textItems.reduce((a, it) => a + pan.hOf(it) + pan.gap, 0) + pan.gap) / 2);
      for (const it of pan.textItems) {
        const node = panelItem(ctx, it, tx, y, pan, F, p, noteColors);
        if (it.type === 'state') stateNode = node; else panelNodes.push(node);
        y += pan.hOf(it) + pan.gap;
      }
    }
    // the building: floors × bays, the room window highlighted (accent2, as the room-name chip)
    const floors = 3, bays = 5;
    building = buildingElevation(ctx, {name: 'bld', x: bldBox.x, y: bldBox.y, w: bldBox.w, h: bldBox.h, floors, bays, highlight: {floor: 1, bay: 3}});

    const rings = notes.map((n, i) => {
      const tgt = targetOf(n.target);
      const col = noteColors[i % 2];
      if (tgt.box) return h('rect', {x: r(tgt.box.x - 6), y: r(tgt.box.y - 6), width: r(tgt.box.w + 12), height: r(tgt.box.h + 12), rx: 14, fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '14 9'});
      return h('circle', {cx: r(tgt.x), cy: r(tgt.y), r: r(tgt.rr), fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '14 9'});
    });

    return {
      F, px, W, H, k, G, ox, oy, planRect, walkers, people, trails, room, seatLabels, labelFails, roomChip, doorChips, panelNodes, stateNode, rings, building, bldBox,
      finalWaiting, log: A.log, arrangement: pan.flow, rad, toD, noteCount: notes.length,
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.building.node,
      g({name: 'plan', transform: T(L.ox, L.oy, 0, L.k)},
        L.room.node,
        L.trails.map(t => t.node),
        L.people.map(pp => pp.node)),
      g({name: 'notes', opacity: 0}, L.rings),
      L.roomChip && L.roomChip.node,
      L.doorChips.map((d, i) => seatLabelNode(ctx, d.L, {name: `door-cap${i}`, size: L.F, color: th.inkSoft})),
      L.seatLabels.map((sl, i) => seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, dashed: i === L.finalWaiting, owner: i === L.finalWaiting ? `rm-ring-${L.walkers[i].slot}` : `p${i}`, seat: `rm-chair-${L.walkers[i].slot}`})),
      L.panelNodes,
      L.stateNode && g({name: 'state-tag', opacity: 0}, L.stateNode),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const capU = lerp(WALK[0], WALK[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const positions = [];
    const semantic = {people: [], states: [], labels: []};
    L.walkers.forEach((w, i) => {
      const waiting = i === L.finalWaiting;
      const q = waiting ? 0 : seg(ua, w.start, w.end);
      const st = walkerAt(w, q, {reduced: ctx.reduced});
      Object.assign(nodes, L.people[i].pose({x: st.x, y: st.y, deg: st.deg, phase: st.phase, walk: st.walk, seated: st.seated}));
      positions.push(st);
      // route trail: drawn just before the walk, faded after the landing
      const draw = waiting ? 0 : seg(ua, w.start - 0.035, w.start + (w.end - w.start) * 0.45);
      const fade = waiting ? 0 : 1 - 0.65 * seg(ua, w.end, w.end + 0.04);
      Object.assign(nodes, L.trails[i].frame(draw, draw > 0 ? fade : 0));
      // empty-seat ring fades as the person sits
      nodes[`rm-ring-${w.slot}`] = {opacity: r(1 - st.seated, 3)};
      // the seat label: body first, then its text
      const landed = q >= 1;
      const holdShow = waiting && p.actionProgress >= 1 ? seg(u, W_NOTES[0], W_NOTES[0] + 0.03) : 0;
      const bodyP = waiting ? holdShow : seg(ua, w.end - 0.012, w.end + 0.018);
      const textP = waiting ? holdShow : seg(ua, w.end + 0.012, w.end + 0.04);
      if (L.seatLabels[i]) {
        nodes[`lab${i}`] = {opacity: r(bodyP, 3)};
        nodes[`lab${i}-text`] = {opacity: r(textP, 3)};
      }
      const dp = L.toD(st);
      semantic.people.push(R2(dp));
      semantic[`p${i}`] = R2(dp);
      semantic[`seat${i}`] = R2(L.toD(w.seat));
      semantic.states.push(st.state);
      semantic.labels.push(r(L.seatLabels[i] ? textP : (landed ? 1 : 0), 3));
      if (landed) semantic[`anchor${i}`] = R2(dp);
      // template coordinates: inside the room interior? at a door gap?
      const G = L.G;
      semantic.inRoom = semantic.inRoom || [];
      semantic.atDoor = semantic.atDoor || [];
      semantic.inRoom.push(st.x > 0 && st.x < G.W && st.y > 0 && st.y < G.H);
      semantic.atDoor.push(Object.values(G.doors).some(d => Math.hypot(st.x - d.gate.x, st.y - d.gate.y) < 90));
    });
    L.doorChips.forEach((d, i) => { nodes[`door-cap${i}`] = {opacity: 1}; });
    // doors swing open as someone passes
    Object.assign(nodes, L.room.doors.main.frame(doorOpen(L.G, 'main', positions)));
    if (L.room.doors.side) Object.assign(nodes, L.room.doors.side.frame(doorOpen(L.G, 'side', positions)));
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W_NOTES) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    if (L.stateNode) nodes['state-tag'] = {opacity: r(done ? seg(u, W_NOTES[0] + 0.01, W_NOTES[1] + 0.01) : 0, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const seated = semantic.states.filter(s => s === 'seated').length;
    return {
      nodes,
      semantic: {
        ...semantic,
        beat,
        seated,
        walking: semantic.states.filter(s => s === 'walking' || s === 'sitting').length,
        allReached: true,
        order: L.walkers.map(w => w.slot).join('>'),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        labelsPlaced: L.labelFails.length === 0,
        labelFails: L.labelFails,
        textPx: r(L.F * L.px, 1),
        startOutside: L.walkers.every(w => !(w.spot.x > 0 && w.spot.x < L.G.W && w.spot.y > 0 && w.spot.y < L.G.H)),
        labelGapsPx: L.seatLabels.map(sl => r(sl.gap * L.px, 1)),
        arrangement: L.arrangement,
        k: r(L.k, 3),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
      },
    };
  },
};

/** One text item of the info panel (legend row, keyed note, state tag, key). */
function panelItem(ctx, it, x, y, pan, F, p, noteColors) {
  const th = ctx.theme;
  if (it.type === 'legend') {
    const look = {skin: '#c68863', hair: 'short', hairColor: '#4a3122', outfit: th.cloth[3], glasses: false};
    const gl = legendGlyph(ctx, it.kind, it.glyph, look);
    const ty = y + Math.max(0, (Math.max(it.glyph, it.fit.height) - it.fit.height) / 2);
    return g({name: `legend-${it.kind}`},
      g({transform: T(x + it.glyph / 2, y + Math.max(it.glyph, it.fit.height) / 2)}, gl),
      textAt(it.fit, x + it.glyph + 14, ty, th.fg));
  }
  if (it.type === 'note') {
    const col = noteColors[it.i % 2];
    const rr = F * 0.62;
    return g({name: `note${it.i}`},
      h('circle', {cx: r(x + rr + 2), cy: r(y + F * 0.55), r: r(rr), fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-dasharray': '7 5'}),
      textAt(it.fit, x + F * 1.9 + 12, y, th.fg));
  }
  if (it.type === 'state') {
    const c = gchip(ctx, it.chip.fit.full, {x, y, anchor: 'start', maxWidth: pan.textW, size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent4, color: th.ink, weight: 700});
    return c.node;
  }
  // key: plain text under a thin rule
  return g({name: 'key'},
    h('path', {d: `M${r(x)} ${r(y)}H${r(x + Math.min(pan.textW, it.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
    textAt(it.fit, x, y + F * 0.45, th.fgSoft, true));
}

function textAt(fit, x, y, fill, italic = false) {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': italic ? 'italic' : undefined, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-01-story',
    title: 'Room layout — a plan seats the participants and reveals their labels',
    titleEs: 'Distribución de una sala — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Distribución de una sala',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic building stands beside the floor plan of one of its rooms. Participants wait in the corridor, walk along dotted routes through a door to their seats, turn and sit; each seat’s editable label arrives beside it as its occupant lands. Positions and labels are as supplied; no position is given a legal meaning.',
    tags: ['floor plan', 'room', 'building', 'seating', 'participants', 'labels', 'route', 'top-down people', 'doors'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
