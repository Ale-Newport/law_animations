/**
 * LAW-0237 — Adaptación de accesibilidad · story
 *
 * Storyboard (a generic building beside the floor plan of its ground floor, seen from above):
 *  0.00–0.15  rest: the participants wait on the pavement in front of the building — one in a wheelchair, one with a
 *             long cane (and, in the stress preset, one on foot) — each with their supplied label and arrival number.
 *             The supports are all in view: the ramp with handrails beside the entrance steps, the tactile guidance
 *             strip from the door to the hearing room, the wall sign beside the room door.
 *  0.15–0.42  the action starts: in the supplied order, the wheelchair user rolls up the ramp to the landing (hands on
 *             the push rims), the person with the cane climbs the steps beside the handrail and follows the tactile
 *             strip with the cane tip sweeping over it; the entrance doors slide open as each one arrives.
 *  0.42–0.73  they go along the corridor, past the wall sign; the room door swings open; each one reaches their
 *             place at the table (the wheelchair place has no chair) and faces the bench.
 *  0.73–1.00  hold: the supplied final state ("everyone at their place" or "at the room door"), the order caption
 *             "sequence as configured (illustrative)", the keyed notes and the key "as supplied · no conclusion drawn".
 *             No standard, measurement, obligation, compliance or outcome is stated or implied.
 * @module animations/courts/LAW-0237
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {
  aaGrid,
  aaFields, AA_EN, AA_STRINGS, resolveAA, fitAA, aaGeometry, routeFor, moverAt, aaProps, aaPlanArt, aaPerson,
  placeChip, segHitsBox, chipNode, chipFit, FONT, aaPanelMeasure, aaPanelNodes, buildingElevation, planFrame, pxPerUnit, R2, overlaps, minSeparation, SEP_MIN, SEP_PLAN,
  localizeAA, AA_ES,
} from './kits/adaptacion-accesibilidad.js';

const ID = 'LAW-0237';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {move: [0.15, 0.72], notes: [0.76, 0.82]};
const TARGETS = ['ramp', 'tactile', 'sign', 'everyone'];

const STRINGS = {
  en: {...AA_STRINGS.en, inRoom: 'Everyone at their place in the room (as supplied)', atDoor: 'Everyone at the room door (as supplied)'},
  es: {...AA_STRINGS.es, inRoom: 'Cada participante en su lugar de la sala (según lo aportado)', atDoor: 'Todos ante la puerta de la sala (según lo aportado)'},
};

const sceneSchema = {
  ...aaFields,
  actorLabels: obj('Legend captions of how the participants move (as supplied; the same person size for all)', {
    wheelchair: str('Caption for a participant moving with a wheelchair', 70),
    cane: str('Caption for a participant walking with a long cane', 70),
    walking: str('Caption for a participant walking', 70),
  }),
  objectLabels: obj('Legend caption of the entrance steps', {
    steps: str('Caption of the entrance steps', 60),
  }),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a solid neutral ring drawn on its target', obj('Note', {
    target: oneOf('What the note refers to ("everyone" rings every participant alike)', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['in-room', 'at-door']),
};

const defaultParams = {
  ...AA_EN,
  actorLabels: {wheelchair: 'Moves with a wheelchair (as supplied)', cane: 'Walks with a long cane (as supplied)', walking: 'Walks (as supplied)'},
  objectLabels: {steps: 'Entrance steps'},
  actionProgress: 1,
  annotations: [{target: 'tactile', text: 'The strip runs from the entrance to the room door'}],
  finalState: 'in-room',
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
  "actorLabels": {
    "wheelchair": "Se desplaza en silla de ruedas (según lo aportado)",
    "cane": "Camina con bastón largo (según lo aportado)",
    "walking": "Camina (según lo aportado)"
  },
  "objectLabels": {
    "steps": "Escalones de la entrada"
  },
  "annotations": [
    {
      "target": "tactile",
      "text": "La franja va de la entrada a la puerta de la sala"
    }
  ]
}};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const regions = [];
    if (!ctx.show('key')) regions.push(shape === 'portrait' ? {flow: 'band', f: 0.13} : {flow: 'column', f: shape === 'square' ? 0.18 : 0.13});
    if (shape === 'landscape') for (const split of [false, true]) for (const f of [0.24, 0.28, 0.32, 0.36]) regions.push({flow: 'column', f, split});
    if (shape === 'square') { for (const split of [false, true]) for (const f of [0.28, 0.32, 0.36, 0.4]) regions.push({flow: 'column', f, split}); for (const f of [0.28, 0.34]) regions.push({flow: 'band', f, cols: 2}); }
    if (shape === 'portrait') for (const f of [0.24, 0.28, 0.32, 0.36, 0.4]) regions.push({flow: 'band', f, cols: 2});
    const log = [];
    let best = null;
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const rg of regions) {
        const L = compose(ctx, p, v / px, px, rg);
        log.push(`${v}/${rg.flow}${rg.f}${rg.split ? 's' : ''}:k${L.k ? L.k.toFixed(2) : '-'}:${L.problems.join('+')}${L.dbg && L.dbg.length ? ' ' + L.dbg.join(' ') : ''}`);
        if (!L.people) continue;
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.personPx > pick.personPx + 0.5)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    if (!best || !best.people) best = compose(ctx, p, 16.6 / px, px, regions[regions.length - 1], true);
    best.log = log.slice(-24);
    return best;
  },
  build(ctx, L) {
    return g(null,
      L.building.node,
      g({name: 'plan', transform: L.pf.transform},
        L.art.node,
        L.people.map(pp => pp.node)),
      g({name: 'notes', opacity: 0}, L.rings),
      L.chips.map(c => c.node),
      L.panel.nodes,
      L.gridNodes,
      L.badges.map(b => b.node),
      L.panel.stateNode && g({name: 'state-tag', opacity: 0}, L.panel.stateNode),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G;
    const nodes = {};
    const capU = lerp(W.move[0], W.move[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const pos = [];
    const states = [];
    L.seats.forEach((s, i) => {
      const T0 = L.windows[i];
      const q = clamp((ua - T0[0]) / (T0[1] - T0[0]));
      const st = moverAt(L.routes[i], q);
      pos.push(st);
      states.push(q <= 0 ? 'waiting' : q >= 1 ? 'arrived' : 'moving');
      // (waiting at the room door, a cane user holds the cane close: its tip stays in the corridor, off the wall)
      const hold = p.finalState === 'at-door' ? seg(ua, T0[1], T0[1] + 0.03) : 0;
      Object.assign(nodes, L.people[i].pose({...st, hold, seated: q >= 1 && p.finalState === 'in-room' && s.mode !== 'wheelchair' ? 1 : 0}));
    });
    // doors: open while someone is near (a pure function of the positions)
    // (only participants on the move open a door; a door closes behind the last one)
    const near = (c, R) => Math.max(0, ...pos.map((q, i) => (states[i] === 'moving' ? clamp((R - Math.hypot(q.x - c.x, q.y - c.y)) / 70) : 0)));
    const mainK = near({x: G.ex, y: G.Hi + G.t / 2}, 190);
    const roomK = near({x: G.roomDoor.x, y: G.RH + G.t / 2}, 200);
    Object.assign(nodes, L.art.doors.main.frame(mainK), L.art.doors.side.frame(0), L.art.doors.room.frame(roomK));
    // labels: at rest (until the participant sets off) and at the hold (once they have arrived)
    L.seats.forEach((s, i) => {
      const T0 = L.windows[i];
      if (L.restChips[i]) {
        const v = 1 - seg(ua, T0[0], T0[0] + 0.015);
        nodes[`lab${i}`] = {opacity: r(v, 3)};
      }
      if (L.holdChips[i]) {
        const v = seg(ua, T0[1], T0[1] + 0.02);
        nodes[`labH${i}`] = {opacity: r(v, 3)};
      }
    });
    if (L.roomChip) nodes['room-name'] = {opacity: 1};
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.notes) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    if (L.panel.stateNode) nodes['state-tag'] = {opacity: r(done ? seg(u, W.notes[0] + 0.01, W.notes[1] + 0.01) : 0, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const pts = {};
    L.seats.forEach((s, i) => {
      pts[`p${i}`] = R2(L.pf.toD(pos[i]));
      pts[`goal${i}`] = R2(L.pf.toD(L.routes[i].poly.at(1)));
      pts[`start${i}`] = R2(L.pf.toD(L.routes[i].poly.at(0)));
    });
    const onRamp = L.seats.map((s, i) => {
      const q = pos[i];
      return q.x >= G.ramp.x && q.x <= G.ramp.x + G.ramp.w && q.y >= G.ramp.y && q.y <= G.ramp.y + G.ramp.h;
    });
    return {
      nodes,
      semantic: {
        ...pts,
        beat,
        states,
        via: L.routes.map(rt => rt.via),
        modes: L.seats.map(s => s.mode),
        order: L.order.map(s => s.index),
        startTimes: L.windows.map(w => r(w[0], 4)),
        onRamp,
        doorMain: r(mainK, 3),
        doorRoom: r(roomK, 3),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        notesShown: r(noteP, 3),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: `${L.flow}/${L.f}${L.split ? '/split' : ''}`,
        log: L.log,
        dbg: L.dbg,
        holdBadges: !!L.holdBadges,
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, rg, force = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const {seats, order} = resolveAA(ctx, p);
  // ---- panel: each participant (glyph, arrival number and label, how they move), the supports, notes, the order
  // caption, the state and the key. `split`: the supports go to a grid strip under the plan instead.
  const items = [];
  const supports = showAll ? [
    {type: 'legend', kind: 'ramp', text: p.labels.ramp}, {type: 'legend', kind: 'tactile', text: p.labels.tactile},
    {type: 'legend', kind: 'sign', text: p.labels.sign}, {type: 'legend', kind: 'steps', text: p.objectLabels.steps},
  ] : [];
  if (showKey) {
    for (const s of order) {
      const i = seats.indexOf(s);
      const n = seats.length > 1 ? `${s.rank + 1} · ${s.label}` : s.label;
      items.push({type: 'legend', kind: s.mode, key: `person${i}`, text: n, sub: showAll ? p.actorLabels[s.mode] : null, look: s.look});
    }
  }
  if (!rg.split) items.push(...supports);
  if (showAll) p.annotations.forEach((n, i) => items.push({type: 'note', i, text: n.text}));
  if (showKey) {
    if (seats.length > 1) items.push({type: 'caption', key: 'seq', text: ctx.t.seq});
    items.push({type: 'state', text: p.finalState === 'at-door' ? ctx.t.atDoor : ctx.t.inRoom});
    items.push({type: 'key', text: p.labels.key});
  }
  const pbox = rg.flow === 'column' ? {x: D.w * (1 - rg.f), y: 0, w: D.w * rg.f, h: D.h} : {x: 0, y: D.h * (1 - rg.f), w: D.w, h: D.h * rg.f};
  const pan = aaPanelMeasure(ctx, {flow: rg.flow, box: pbox, F, items, nameText: showKey ? p.courts.building : null, legendCols: rg.cols || 1});
  if (!pan.ok && !force) return {problems: [`panel(${Math.round(pan.textH)}/${Math.round(pbox.h)} b${Math.round(pan.bld.h)})`], k: 0};
  let planBox = rg.flow === 'column' ? {x: 0, y: 0, w: D.w - pbox.w - 28, h: D.h} : {x: 0, y: 0, w: D.w, h: D.h - pbox.h - 24};
  let grid = null;
  if (rg.split && supports.length) {
    // (four columns when they fit, else two; the lower grid wins)
    const g4 = planBox.w > 36 * F ? aaGrid(ctx, {box: {x: planBox.x, y: 0, w: planBox.w, h: D.h * 0.22}, F, items: supports, cols: 4, look: seats[0].look}) : null;
    const g2 = aaGrid(ctx, {box: {x: planBox.x, y: 0, w: planBox.w, h: D.h * 0.22}, F, items: supports, cols: 2, look: seats[0].look});
    grid = [g4, g2].filter(q => q && q.ok).sort((a, b) => a.h - b.h)[0] || g2;
    if (!grid.ok && !force) return {problems: ['grid'], k: 0};
    planBox = {...planBox, h: planBox.h - grid.h - F * 1.15};
  }
  // ---- plan
  const {W: PW, H: PH, k} = fitAA(planBox);
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  const G = aaGeometry(PW, PH);
  const pf = planFrame(G.extents, planBox, k);
  const toD = pf.toD;
  // the plan is the subject: >= 0.55 of the FRAME width beside a column, or full width over a band
  const frameW = ctx.view.width / ((px * Math.min(ctx.view.width, ctx.view.height)) / 1080);
  if (rg.flow === 'column' && pf.rect.w < 0.552 * frameW) problems.push('narrow-plan');
  const people = seats.map((s, i) => aaPerson(ctx, {name: `p${i}`, look: s.look, mode: s.mode}));
  const routes = seats.map(s => routeFor(G, s, s.mode === 'wheelchair' ? 'ramp' : 'steps', {stop: p.finalState === 'at-door' ? 'door' : 'place'}));
  // ---- timing: one pace for everyone; each starts after the previous one (supplied order) and reaches the room door
  // after them; everyone has arrived by u 0.72
  const windows = timeWindows(order, seats, routes, G);
  // ---- chips (people labels at rest and at the hold, the room name)
  const props = aaProps(G).map(b => ({...pf.mapBox(b), kind: b.kind}));
  const rad = 56 * k;
  const bounds = {x: pf.rect.x + 4, y: pf.rect.y + 4, w: pf.rect.w - 8, h: pf.rect.h - 8};
  const restPts = routes.map(rt => toD(rt.poly.at(0)));
  const holdPts = routes.map(rt => toD(rt.poly.at(1)));
  const headBox = q => ({x: q.x - rad, y: q.y - rad, w: rad * 2, h: rad * 2});
  // the corridors the participants walk along (design units): a label drawn before someone passes never sits on it
  const pathBoxes = routes.map(rt => {
    const out = [];
    const n = 40;
    const pr = rad * 0.85;
    for (let j = 0; j < n; j++) {
      const a = toD(rt.poly.at(j / n)), b = toD(rt.poly.at((j + 1) / n));
      out.push({x: Math.min(a.x, b.x) - pr, y: Math.min(a.y, b.y) - pr, w: Math.abs(b.x - a.x) + pr * 2, h: Math.abs(b.y - a.y) + pr * 2, kind: 'path'});
    }
    return out;
  });
  const chips = [];
  const restChips = seats.map(() => null), holdChips = seats.map(() => null);
  let roomChip = null;
  const dbg = [];
  if (showKey) {
    const taken = [], takenLeads = [];
    const place = (key, text, anchor, bodies, extraHard = []) => {
      const stats = {};
      // (a narrower, taller chip is tried when the wide one finds no clear place)
      for (const mw of [330, 240, 180]) {
        const cf = chipFit(text, F, mw / px, 3);
        if (cf.fit.truncated) continue;
        const r0 = tryPlace(cf, anchor, bodies, extraHard, stats);
        if (r0) { taken.push(r0.box); takenLeads.push({from: r0.from, to: r0.to}); return {...r0, fit: cf.fit}; }
      }
      problems.push(`lab-${key}`);
      dbg.push(`${key}:${JSON.stringify(stats)}`);
      return null;
    };
    const tryPlace = (cf, anchor, bodies, extraHard, stats) => {
      const hard = [...props, ...bodies.map(q => ({...headBox(q), kind: 'person'})), ...taken.map(q => ({...q, kind: 'chip'})), ...extraHard.map(q => ({...q, kind: q.kind || 'swing'}))];
      // (a leader may pass over low furniture, never over a person, a chip, a wall, the sign or the room door's swing
      // — the doorway where the strip's note ring sits)
      const leadHard = hard.filter(q => ['person', 'chip', 'wall', 'sign', 'swing', 'ring'].includes(q.kind));
      // (no chip under a leader already drawn)
      const accept = b => !takenLeads.some(ld => segHitsBox(ld.from, ld.to, b, 3));
      const res = placeChip({w: cf.w, h: cf.h, anchor: {...anchor, rad}, bounds, hard, leadHard, stats, accept});
      return res;
    };
    // at rest: an arrival-number badge beside each participant (their full label is in the panel beside the same glyph)
    if (seats.length > 1) {
      seats.forEach((s, i) => {
        const d = F * 1.7;
        const bst = {};
        const res = placeChip({w: d, h: d, anchor: {...restPts[i], rad: rad * 1.05}, bounds, hard: [...props, ...restPts.filter((q, j) => j !== i).map(q => ({...headBox(q), kind: 'person'})), ...taken], gaps: [2, 8, 16, 26, 40, 60], prefer: -45, stats: bst, leadHard: []}); // (a badge: no leader line)
        if (!res) dbg.push(`badge${i}:${JSON.stringify(bst)}`);
        if (!res) { problems.push(`badge${i}`); return; }
        taken.push(res.box);
        restChips[i] = res;
      });
    }
    taken.length = 0;
    const swing = pf.mapBox({x: G.roomDoor.x - G.roomDoor.w / 2 - 6, y: G.RH - G.roomDoor.w - 6, w: G.roomDoor.w + 12, h: G.roomDoor.w + 12});
    // the room name on the room floor (a scan from the top-left), clear of props, people, chips and the door swing
    let rf = chipFit(p.courts.room, F, 360 / px, 2);
    // (inside the room first; else in the waiting area beside it, still inside the building)
    const areas = [pf.mapBox({x: G.platform.x, y: 6, w: G.platform.w, h: G.platform.h + 12}), pf.mapBox({x: G.room.x + 12, y: 12, w: G.room.w - 24, h: G.RH - 24}), pf.mapBox({x: 12, y: 12, w: G.rx0 - G.t - 24, h: G.RH - 24})];
    let rbox = null;
    for (const roomBox of areas) {
      for (const mw of [360, 260, 200]) {
        rf = chipFit(p.courts.room, F, mw / px, 3);
        if (rf.fit.truncated || rf.w > roomBox.w) continue;
        const step = Math.max(8, F * 0.6);
        for (let yy = roomBox.y; yy + rf.h <= roomBox.y + roomBox.h && !rbox; yy += step) {
          for (let xx = roomBox.x; xx + rf.w <= roomBox.x + roomBox.w; xx += step) {
            const b = {x: xx, y: yy, w: rf.w, h: rf.h};
            if ([...props, swing, ...holdPts.map(headBox), ...taken, ...pathBoxes.flat()].some(q => overlaps(b, q, 4))) continue;
            rbox = b; break;
          }
        }
        if (rbox) break;
      }
      if (rbox) break;
    }
    if (!rbox) problems.push('room');
    else { roomChip = {box: rbox, fit: rf.fit}; taken.push(rbox); }
    // (the hold notes' rings around the ramp, the sign or the strip ends: no chip or leader over them)
    const ringAreas = (showAll ? p.annotations : []).flatMap(n => {
      const bx0 = n.target === 'ramp' ? [G.ramp] : n.target === 'sign' ? [G.sign] : n.target === 'tactile' ? [G.strip[0], G.strip[G.strip.length - 1]].map(q => ({x: q.x - 22, y: q.y - 22, w: 44, h: 44})) : [];
      return bx0.map(b => { const d = pf.mapBox(b); return {x: d.x - 12, y: d.y - 12, w: d.w + 24, h: d.h + 24, kind: 'ring'}; });
    });
    // hold chips: try the participants in both directions (right to left first), keep the order that places more
    const base = taken.slice();
    const tryOrder = idxs => {
      taken.length = 0; taken.push(...base); takenLeads.length = 0;
      const out = seats.map(() => null);
      const failsBefore = problems.length;
      for (const i of idxs) {
        const s = seats[i];
        const txt = seats.length > 1 ? `${s.rank + 1} · ${s.label}` : s.label;
        out[i] = place(`h${i}`, txt, holdPts[i], holdPts, [swing, ...ringAreas, ...pathBoxes.filter((pb, j) => j !== i && L_later(i, j)).flat()]);
      }
      const fails = problems.length - failsBefore;
      problems.length = failsBefore;
      return {out, fails, cost: out.reduce((a, c) => a + (c ? c.gap : 999), 0)};
    };
    // (a participant arriving later walks past an earlier one's label: the earlier label keeps off the later path)
    const L_later = (i, j) => windows[j][1] > windows[i][1];
    const byX = seats.map((s, i) => i).sort((a, b) => holdPts[b].x - holdPts[a].x);
    const A1 = tryOrder(byX), A2 = tryOrder(byX.slice().reverse());
    const pick = A1.fails < A2.fails || (A1.fails === A2.fails && A1.cost <= A2.cost) ? A1 : A2;
    const again = tryOrder(pick === A1 ? byX : byX.slice().reverse());
    // (a label hangs close to its participant: a leader longer than ~110 px at 1080p means the badges read better)
    const leadPx = c => (c && c.from ? Math.hypot(c.from.x - c.to.x, c.from.y - c.to.y) * px : 0);
    const shortLeads = again.out.every(c => leadPx(c) <= 110);
    if ((again.out.every(Boolean) && shortLeads) || seats.length < 2) again.out.forEach((c, i) => { holdChips[i] = c; if (!c) problems.push(`lab-h${i}`); });
    else {
      // fallback (every participant alike): arrival-number badges beside the people, as at rest; the full labels are
      // in the panel beside the same numbers and glyphs
      taken.length = 0; taken.push(...base);
      seats.forEach((s, i) => {
        const d = F * 1.7;
        const res = placeChip({w: d, h: d, anchor: {...holdPts[i], rad: rad * 1.05}, bounds, hard: [...props, ...holdPts.filter((q, j) => j !== i).map(q => ({...headBox(q), kind: 'person'})), ...taken, ...pathBoxes.filter((pb, j) => j !== i && L_later(i, j)).flat()], gaps: [2, 8, 16, 26, 40, 60], prefer: 45, leadHard: []}); // (a badge: no leader line)
        if (!res) { problems.push(`badgeH${i}`); return; }
        taken.push(res.box);
        holdChips[i] = {...res, badge: true};
      });
    }

  }
  const badges = [];
  const badgeNode = (nm, B, s, i) => {
    const c = {x: B.box.x + B.box.w / 2, y: B.box.y + B.box.h / 2};
    return {name: nm, node: g({name: nm, opacity: 0, 'data-owner': `p${i}`, 'data-badge': 1},
      h('circle', {name: `${nm}-body`, cx: r(c.x), cy: r(c.y), r: r(B.box.w / 2), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
      h('text', {name: `${nm}-text`, x: r(c.x), y: r(c.y + F * 0.36), 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: th.ink}, String(s.rank + 1)))};
  };
  seats.forEach((s, i) => {
    if (restChips[i]) badges.push(badgeNode(`lab${i}`, restChips[i], s, i));
    const H = holdChips[i];
    if (H && H.badge) badges.push(badgeNode(`labH${i}`, H, s, i));
    else if (H) chips.push({name: `labH${i}`, node: chipNode(ctx, H, {name: `labH${i}`, fit: H.fit, owner: `p${i}`})});
  });
  if (roomChip) chips.push({name: 'room-name', node: chipNode(ctx, {box: roomChip.box}, {name: 'room-name', fit: roomChip.fit, owner: 'room'})});
  // ---- note rings (hold)
  const noteColor = th.fgSoft;
  const ringBox = b => (b.circle
    ? h('circle', {cx: r(b.x), cy: r(b.y), r: r(b.r), fill: 'none', stroke: noteColor, 'stroke-width': 4})
    : h('rect', {x: r(b.x - 8), y: r(b.y - 8), width: r(b.w + 16), height: r(b.h + 16), rx: 14, fill: 'none', stroke: noteColor, 'stroke-width': 4}));
  const targetOf = tg => {
    if (tg === 'ramp') return [pf.mapBox(G.ramp)];
    if (tg === 'sign') return [pf.mapBox(G.sign)];
    if (tg === 'tactile') return [G.strip[0], G.strip[G.strip.length - 1]].map(q => pf.mapBox({x: q.x - 22, y: q.y - 22, w: 44, h: 44}));
    return holdPts.map(q => ({circle: true, x: q.x, y: q.y, r: 62 * k}));
  };
  const notes = showAll ? p.annotations : [];
  const rings = notes.map((n, i) => g({name: `note-ring${i}`}, targetOf(n.target).map(ringBox)));
  // ---- panel nodes, the building, the plan art
  const panel = aaPanelNodes(ctx, pan, {noteColor, look: seats[0].look});
  const bb = panel.bldBox;
  const building = buildingElevation(ctx, {name: 'bld', x: bb.x, y: bb.y, w: bb.w, h: bb.h, floors: 3, bays: 5, highlight: {floor: 0, bay: 2}, tree: true});
  const art = aaPlanArt(ctx, G, {prefix: 'rm', wheelchairPlaces: seats.filter(s => s.mode === 'wheelchair').map(s => s.place)});
  return {
    F, px, k, f: rg.f, flow: rg.flow, split: !!rg.split, personPx, G, pf, seats, order, people, routes, windows, art, chips, restChips, holdChips, roomChip,
    rings, noteCount: notes.length, panel, building, problems, planBox, dbg, holdBadges: holdChips.some(c => c && c.badge), gridNodes: grid ? grid.nodes(D.h - grid.h - F * 0.35) : [], badges,
  };
}

/**
 * Time windows [start, end] per participant (index order), one common pace: each starts >= 0.06 after the previous
 * one in the supplied order and passes the room door >= 0.05 after them; everyone has arrived by u 0.72.
 */
function timeWindows(order, seats, routes, G) {
  // (the spacing between departures grows until nobody walks through anybody: centre distance >= SEP_MIN)
  let best = null, bestSep = -1;
  for (const gap of [0.06, 0.08, 0.1, 0.12, 0.14, 0.16]) {
    const win = timeWindowsGap(order, seats, routes, G, gap);
    const sep = seats.length > 1 ? minSeparation(routes, win, 900) : Infinity;
    if (sep > bestSep) { bestSep = sep; best = win; }
    if (sep >= SEP_PLAN) break;
  }
  best.sep = bestSep;
  return best;
}

function timeWindowsGap(order, seats, routes, G, gap) {
  const doorDist = rt => {
    // arc length where the route crosses the room wall line (y = RH + t), approximately
    const n = 200;
    for (let i = 0; i <= n; i++) { const q = rt.poly.at(i / n); if (q.y < G.RH + G.t) return (i / n) * rt.poly.total; }
    return rt.poly.total;
  };
  const sOfQ = s => (Math.acos(1 - 2 * clamp(s)) / Math.PI);
  let v = Math.max(...routes.map(rt => rt.poly.total)) / 0.36;
  for (let it = 0; it < 40; it++) {
    const win = seats.map(() => null);
    let prevStart = -1, prevDoor = -1;
    for (const s of order) {
      const i = seats.indexOf(s);
      const rt = routes[i];
      const dur = rt.poly.total / v + 0.02;
      let start = prevStart < 0 ? W.move[0] : prevStart + gap;
      // passing the room door after the previous participant
      const qDoor = sOfQ(doorDist(rt) / rt.poly.total);
      const tDoor = st => st + dur * (0.05 + qDoor * 0.87);
      if (prevDoor >= 0 && tDoor(start) < prevDoor + 0.05) start += prevDoor + 0.05 - tDoor(start);
      win[i] = [start, start + dur];
      prevStart = start;
      prevDoor = tDoor(start);
    }
    if (Math.max(...win.map(w => w[1])) <= W.move[1] + 1e-6) return win;
    v *= 1.08;
  }
  return seats.map(() => [W.move[0], W.move[1]]);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-10-story',
    title: 'Accessibility adaptation — reaching the hearing room along the ramp, the tactile strip and the sign',
    titleEs: 'Adaptación de accesibilidad — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Adaptación de accesibilidad',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic building stands beside the floor plan of its ground floor. In the supplied order, a participant in a wheelchair rolls up the ramp with handrails beside the entrance steps, and a participant with a long cane climbs the steps and follows the tactile guidance strip, the cane tip sweeping over it; the doors open as they arrive, they pass the wall sign by the hearing-room door and reach their places at the table (the wheelchair place has no chair). The final state is as supplied; no standard, measurement, obligation, compliance or outcome is stated.',
    tags: ['floor plan', 'accessibility', 'ramp', 'handrail', 'tactile strip', 'sign', 'wheelchair', 'long cane', 'route', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/adaptacion-accesibilidad.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/courts/kits/presentacion-de-prueba.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeAA(scene, defaultParams, defaultParamsEs),
});
