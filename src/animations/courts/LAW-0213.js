/**
 * LAW-0213 — Sala física y remota · story
 *
 * Storyboard (a generic building and the plan of one of its hearing rooms,
 * seen from above; the building front stands beside the plan as the anchor):
 *  0.00–0.15  rest: the generic building (its room window highlighted, its
 *             name under it) and the plan of the room — walls, main door, a
 *             platform with the bench (the judicial table) and its small link
 *             hubs, two tables with chairs, the corridor. Around the room edge
 *             stand the remote WINDOWS: plain screens (dark bezel, camera dot,
 *             no platform UI) showing each remote participant standing at a
 *             desk in their own place, drawn whole, opaque and at the same size
 *             as the people in the room. The participants who will appear in
 *             the room wait in the corridor. Door caption and room name shown.
 *  0.15–0.42  the action starts, in the supplied arrival order: a person for a
 *             room seat walks through the door (it swings open), along the
 *             aisle to their chair and sits; for a window, a SOLID link line is
 *             drawn from the bench hub to the window's edge, its camera dot
 *             lights as the line lands, then the participant in the window sits
 *             at their desk. Each participant's editable label arrives beside
 *             them once they are seated (chip body first, then its text).
 *  0.42–0.73  the remaining arrivals follow the same way; labels stay with
 *             their people; links stay drawn and attached to their windows.
 *  0.73–1.00  hold: the supplied final state (everyone in place, or the last
 *             participant not yet in place), the keyed notes and the key
 *             "as supplied · no conclusion drawn". Where each participant
 *             appears is only shown as supplied: nothing says that appearing
 *             in a window is allowed, required, valid, equivalent or lesser.
 * @module animations/courts/LAW-0213
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {planPerson, buildingElevation} from './kits/courts-art.js';
import {
  sfrFields, SFR_EN, SFR_STRINGS, resolveSfr, sfrGeometry, fitSfr, planFrame, scheduleArrivals, linkAt, walkerAt, doorOpen,
  roomArt, windowArt, linkLine, camLit, remotePose, furnitureBoxes, placeSeatLabels, placeFree, seatLabelNode, remainingPath,
  bodyBox, gchip, glue, fitWords, pxPerUnit, sfrGlyph, R2, PERSON_RAD, WALL, arrangementsFor, outerPad,
} from './kits/sala-fisica-remota.js';

const ID = 'LAW-0213';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const ARRIVE = [0.16, 0.72];
const W_NOTES = [0.75, 0.81];
const TARGETS = ['everyone', 'mainDoor', 'bench', 'firstWindow', 'firstRoomSeat', 'room'];

const STRINGS = {
  en: {...SFR_STRINGS.en},
  es: {...SFR_STRINGS.es},
};

const sceneSchema = {
  ...sfrFields,
  actorLabels: obj('Legend captions of the two ways a participant appears (as supplied; the same glyph size for both)', {
    inRoom: str('Caption for a participant who appears in the room', 60),
    remote: str('Caption for a participant who appears in a window', 60),
  }),
  objectLabels: obj('Legend captions of the plan objects', {
    bench: str('Caption for the bench (the judicial table) and its link hubs', 60),
    link: str('Caption for the solid link line drawn from the bench to a window', 60),
  }),
  actionProgress: num('How far the arrivals are allowed to progress (1 = everyone in place; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a solid neutral ring drawn on its target in the plan ("everyone" rings every participant alike, in the room and in windows)', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['all-in-place', 'last-waiting']),
};

const defaultParams = {
  ...SFR_EN,
  actorLabels: {inRoom: 'Appears in the room (as supplied)', remote: 'Appears in a window (as supplied)'},
  objectLabels: {bench: 'Bench with link hubs', link: 'Link from the bench'},
  actionProgress: 1,
  annotations: [{target: 'everyone', text: 'Each participant’s place is as supplied'}],
  finalState: 'all-in-place',
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const {routes} = resolveSfr(ctx, p);
    const winSlots = routes.filter(rt => rt.kind === 'window').map(rt => rt.slot);
    const F0 = 22.5 / px, Fmin = 16.6 / px;
    let best = null;
    const log = [];
    const regions = [];
    if (shape !== 'portrait') for (const cf of shape === 'square' ? [0.28, 0.32, 0.36, 0.4, 0.44] : [0.22, 0.25, 0.28, 0.32, 0.36]) regions.push({flow: 'column', f: cf});
    if (shape !== 'landscape') for (const bf of [0.2, 0.24, 0.28, 0.33]) regions.push({flow: 'band', f: bf});
    // (square) the building may stand in the plan's free corner beside the corridor, so the text column can be narrower
    if (shape === 'square') for (const cf of [0.26, 0.3, 0.34]) regions.push({flow: 'column', f: cf, inPlan: true});
    // labels hidden: no text column at all, the building stands in the plan
    if (!ctx.show('key')) regions.push({flow: 'column', f: 0, inPlan: true});
    const arrs = winSlots.length > 1 ? arrangementsFor(winSlots.length) : ['column'];
    // text sizes: coarse steps first, then the step above the first size that works (fewer full compositions)
    const sizes = [];
    for (let v = 22.5; v >= 16.6 - 1e-6; v -= 0.9) sizes.push(Math.round(v * 10) / 10);
    sizes.push(16.6);
    let full = 0;
    const tryAt = (v, tries = 6) => {
      const F = v / px;
      const quick = [];
      for (const rg of regions) {
        const pan = panelProbe(ctx, p, F, rg);
        if (!pan.ok) continue;
        const planBox = planBoxOf(ctx, rg, pan);
        for (const rot of [0, -90]) for (const arr of arrs) for (const depth of rot ? [0, 80, 160, 240] : [0]) { const f = fitSfr(planBox, winSlots, rot, arr, depth); quick.push({rg, rot, arr, depth, k: f.k, area: f.W * f.H * f.k * f.k}); }
      }
      quick.sort((a, b) => b.k - a.k);
      // variety: at most two panel shares per arrangement × turn × depth
      const seen = {};
      const varied = quick.filter(q => { const key = `${q.arr}/${q.rot}/${q.depth}`; seen[key] = (seen[key] || 0) + 1; return seen[key] <= 2; });
      // among the compositions with people >= 62 px, the largest room floor (most room for the labels) first
      const good0 = varied.filter(q => q.k * 100 * px >= 62);
      const kTop = Math.max(0, ...good0.map(q => q.k));
      const good = [...good0.filter(q => q.k >= kTop * 0.92).sort((a, b) => b.area - a.area), ...good0.filter(q => q.k < kTop * 0.92).sort((a, b) => b.area - a.area)];
      let win = null;
      for (const q of (good.length ? good : varied).slice(0, tries)) {
        if (full >= 22) break;
        const L = compose(ctx, p, F, px, q.rg, q.rot, q.arr, routes, winSlots, false, q.depth);
        if (!L) continue;
        full++;
        log.push(`${v.toFixed(1)}/${q.rg.flow}${q.rg.f}${q.rg.inPlan ? 'in' : ''}/${q.arr}${q.rot ? '/rot' + q.depth : ''}:k${L.k.toFixed(2)}:${L.fails.join('+')}`);
        if (!best || L.fails.length < best.fails.length || (L.fails.length === best.fails.length && L.personPx >= 62 && best.personPx < 62)) best = L;
        if (!L.fails.length && L.personPx >= 62) { win = L; break; }
      }
      return win;
    };
    let found = null;
    for (let i = 0; i < sizes.length && !found; i += 2) {
      found = tryAt(sizes[i]);
      // (create() budget) the one-step-larger refinement tries only its two best candidates
      if (found && i > 0) found = tryAt(sizes[i - 1], 2) || found;
      if (!found && i + 2 >= sizes.length && i + 1 < sizes.length) found = tryAt(sizes[sizes.length - 1]);
    }
    if (found) best = found;
    if (!best) best = compose(ctx, p, Fmin, px, regions[0], 0, arrs[0], routes, winSlots, true);
    best.log = log.slice(-40);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.building.node,
      g({name: 'plan', transform: L.pf.transform},
        L.room.node,
        L.tiles.map(t => t.node),
        L.links.map(l => (l ? l.node : null)),
        L.people.map(pp => pp.node)),
      g({name: 'notes', opacity: 0}, L.rings),
      L.roomChip && L.roomChip.node,
      L.doorChip && seatLabelNode(ctx, L.doorChip, {name: 'door-cap0', size: L.F, color: th.inkSoft}),
      L.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, dashed: false, owner: `p${i}`, seat: L.items[i].kind === 'room' ? `rm-chair-${L.items[i].route.slot}` : `win-${L.items[i].route.slot}`})),
      L.panelNodes,
      L.stateNode && g({name: 'state-tag', opacity: 0}, L.stateNode),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const capU = lerp(ARRIVE[0], ARRIVE[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const positions = [];
    const sem = {people: [], states: [], labels: [], linked: [], kinds: []};
    L.items.forEach((it, i) => {
      const waiting = i === L.finalWaiting;
      const q = waiting ? 0 : seg(ua, it.start, it.end);
      let st;
      if (it.kind === 'room') {
        st = walkerAt(it.walker, q, {reduced: ctx.reduced});
        Object.assign(nodes, L.people[i].pose({x: st.x, y: st.y, deg: st.deg, phase: st.phase, walk: st.walk, seated: st.seated}));
        positions.push(st);
        nodes[`rm-ring-${it.route.slot}`] = {opacity: r(1 - st.seated, 3)};
        sem.linked.push(null);
      } else {
        const ls = linkAt(q);
        const pose = remotePose(L.G, it.route.slot, ls.seated);
        Object.assign(nodes, L.people[i].pose(pose));
        Object.assign(nodes, L.links[i].frame(ls.draw));
        nodes[`win-${it.route.slot}-cam`] = camLit(ctx, ls.landed);
        st = {x: pose.x, y: pose.y, state: ls.state};
        sem.linked.push(ls.landed);
      }
      // the label: body first, then its text, once the participant is seated
      const holdShow = waiting && p.actionProgress >= 1 ? seg(u, W_NOTES[0], W_NOTES[0] + 0.03) : 0;
      const bodyP = waiting ? holdShow : seg(ua, it.end - 0.012, it.end + 0.018);
      const textP = waiting ? holdShow : seg(ua, it.end + 0.012, it.end + 0.04);
      if (L.labels[i]) {
        nodes[`lab${i}`] = {opacity: r(bodyP, 3)};
        nodes[`lab${i}-text`] = {opacity: r(textP, 3)};
      }
      const dp = L.pf.toD(st);
      sem.people.push(R2(dp));
      sem[`p${i}`] = R2(dp);
      sem[`seat${i}`] = R2(L.pf.toD(it.kind === 'room' ? L.G.slots[it.route.slot] : L.G.win[it.route.slot].seat));
      sem.states.push(st.state);
      sem.kinds.push(it.kind);
      sem.labels.push(r(L.labels[i] ? textP : (q >= 1 ? 1 : 0), 3));
      const G = L.G;
      sem.inRoom = sem.inRoom || [];
      sem.atDoor = sem.atDoor || [];
      sem.inRoom.push(it.kind === 'room' && st.x > 0 && st.x < G.W && st.y > 0 && st.y < G.H);
      sem.atDoor.push(it.kind === 'room' && Math.hypot(st.x - G.doors.main.gate.x, st.y - G.doors.main.gate.y) < 90);
    });
    if (L.doorChip) { nodes['door-cap0'] = {opacity: 1}; nodes['door-cap0-text'] = {opacity: 1}; }
    Object.assign(nodes, L.room.doors.main.frame(doorOpen(L.G, 'main', positions)));
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W_NOTES) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    if (L.stateNode) nodes['state-tag'] = {opacity: r(done ? seg(u, W_NOTES[0] + 0.01, W_NOTES[1] + 0.01) : 0, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        seated: sem.states.filter(s => s === 'seated').length,
        allReached: true,
        order: L.items.map(it => it.route.slot).join('>'),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        labelsPlaced: L.fails.length === 0,
        labelFails: L.fails,
        textPx: r(L.F * L.px, 1),
        startOutside: L.items.every(it => it.kind === 'window' || !(it.walker.spot.x > 0 && it.walker.spot.x < L.G.W && it.walker.spot.y > 0 && it.walker.spot.y < L.G.H)),
        arrangement: `${L.flow}/${L.arr}${L.rot ? '/turned' : ''}`,
        k: r(L.k, 3),
        personPx: r(L.personPx, 1),
        log: L.log,
      },
    };
  },
};

/** One composition: panel region rg, plan turned by rot, text size F. */
/** Panel measurement only (for the cheap pass). */
function panelProbe(ctx, p, F, rg) {
  const showAll = ctx.show('all');
  const legendItems = showAll ? [{kind: 'room', text: p.actorLabels.inRoom}, {kind: 'window', text: p.actorLabels.remote}, {kind: 'link', text: p.objectLabels.link}, {kind: 'bench', text: p.objectLabels.bench}] : [];
  const finalText = p.finalState === 'last-waiting' ? ctx.t.lastWaiting : ctx.t.allPlaced;
  return panelFor(ctx, {flow: rg.flow, f: rg.f, inPlan: rg.inPlan, F, legendItems, notes: showAll ? p.annotations : [], finalText, showKey: ctx.show('key'), p});
}

function planBoxOf(ctx, rg, pan) {
  const D = ctx.design;
  const PB = pan.box;
  if (rg.flow === 'column') return {x: 0, y: 0, w: D.w - (PB.w ? PB.w + 28 : 0), h: D.h};
  return {x: 0, y: PB.h + 22, w: D.w, h: D.h - PB.h - 22};
}

function compose(ctx, p, F, px, rg, rot, arr, routes, winSlots, force, depth = 0) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const finalWaiting = p.finalState === 'last-waiting' && routes.length > 0 ? routes.length - 1 : -1;
  // ---- panel content
  const legendItems = showAll ? [
    {kind: 'room', text: p.actorLabels.inRoom},
    {kind: 'window', text: p.actorLabels.remote},
    {kind: 'link', text: p.objectLabels.link},
    {kind: 'bench', text: p.objectLabels.bench},
  ] : [];
  const notes = showAll ? p.annotations : [];
  const finalText = p.finalState === 'last-waiting' ? ctx.t.lastWaiting : ctx.t.allPlaced;
  const pan = panelFor(ctx, {flow: rg.flow, f: rg.f, inPlan: rg.inPlan, F, legendItems, notes, finalText, showKey, p});
  if (!pan.ok && !force) return null;
  const planBox = planBoxOf(ctx, rg, pan);
  // ---- plan
  const {W, H, k} = fitSfr(planBox, winSlots, rot, arr, depth);
  const G = sfrGeometry(W, H, winSlots, arr, outerPad(rot));
  const pf = planFrame(G.extents, planBox, k, rot);
  const toD = pf.toD;
  const personPx = 100 * k * px;
  const rad = PERSON_RAD * k;
  const items = scheduleArrivals(G, routes, {a: ARRIVE[0], b: ARRIVE[1]});
  const roomRings = items.filter(it => it.kind === 'room').map(it => it.route.slot);
  const room = roomArt(ctx, G, {prefix: 'rm', rings: roomRings});
  const tiles = ['win1', 'win2', 'win3', 'win4'].filter(s => winSlots.includes(s)).map(s => ({slot: s, node: windowArt(ctx, G, s, {name: `win-${s}`})}));
  const links = items.map((it, i) => (it.kind === 'window' ? linkLine(ctx, {name: `link${i}`, pts: it.link.pts}) : null));
  const people = items.map((it, i) => planPerson(ctx, {name: `p${i}`, look: it.route.look}));
  // ---- label placement (design units)
  const fails = [];
  const occupied = new Set(items.filter((it, i) => it.kind === 'room' && i !== finalWaiting).map(it => it.route.slot));
  const personAt = (it, i) => {
    if (it.kind === 'room') return i === finalWaiting ? {...toD(it.walker.spot), rad} : bodyBox(toD(G.slots[it.route.slot]), G.slots[it.route.slot].deg + rot, rad);
    return bodyBox(toD(G.win[it.route.slot].seat), G.win[it.route.slot].seat.deg + rot, rad);
  };
  const everyone = items.map(personAt);
  const furnAll = furnitureBoxes(G);
  const furn = furnAll.filter(f => f.kind !== 'chair' || !occupied.has(f.slot)).map(pf.mapBox);
  const hard = furnAll.filter(f => f.kind === 'desk' || f.kind === 'table' || f.kind === 'plant').map(pf.mapBox);
  const hardAlways = furnAll.filter(f => f.kind === 'chair' && !occupied.has(f.slot)).map(pf.mapBox);
  const screens = tiles.map(t => pf.mapBox(G.win[t.slot].inner));
  const linkPaths = items.filter(it => it.kind === 'window').map(it => thin(it.link.pts).map(toD));
  const seatPoints = [...Object.values(G.slots).map(toD), ...tiles.map(t => toD(G.win[t.slot].seat))];
  const roomBox = pf.mapBox({x: 4, y: 4, w: W - 8, h: H - 8});
  const extra = [];
  // (inPlan) the building and its name in the free corner beside the corridor, below the lowest window
  let bldIn = null;
  if (rg.inPlan) {
    const E = G.extents;
    const rows = {left: 0, right: 0};
    for (const w of Object.values(G.win)) rows[w.side] = Math.max(rows[w.side], w.row + 1);
    const lowest = n => (n ? G.win[Object.keys(G.win).find(s2 => G.win[s2].row === n - 1)].box.y + G.win[Object.keys(G.win).find(s2 => G.win[s2].row === n - 1)].box.h + 74 : E.y);
    const regs = [];
    if (G.used.left) regs.push({x: E.x, y: lowest(rows.left), w: -WALL - E.x - 8, h: E.y + E.h - lowest(rows.left)});
    if (G.used.right) regs.push({x: G.W + WALL + 8, y: lowest(rows.right), w: E.x + E.w - G.W - WALL - 8, h: E.y + E.h - lowest(rows.right)});
    const cands = regs.map(pf.mapBox).filter(b => b.w > 60 && b.h > 60).sort((a, b) => b.w * b.h - a.w * a.h);
    const reg = cands[0];
    if (!reg) return null;
    const nameChip = showKey ? gchip(ctx, p.courts.building, {x: 0, y: 0, anchor: 'middle', maxWidth: reg.w, size: F, minSize: F, maxLines: 3, fill: th.card}) : null;
    const nh = nameChip ? nameChip.box.h + 10 : 0;
    const bh = Math.min(reg.h - nh, reg.w / 0.92);
    if (bh < 110 || (nameChip && nameChip.fit.truncated)) return null;
    const bw = bh * 0.92;
    const bx = reg.x + (reg.w - bw) / 2, by = reg.y + (reg.h - bh - nh) / 2;
    bldIn = {box: {x: bx, y: by, w: bw, h: bh}, name: nameChip ? gchip(ctx, p.courts.building, {x: reg.x + reg.w / 2, y: by + bh + 10, anchor: 'middle', maxWidth: reg.w, size: F, minSize: F, maxLines: 3, fill: th.card, name: 'bld-name'}) : null};
    extra.push(bldIn.box);
    if (bldIn.name) extra.push(bldIn.name.box);
  }
  const labels = items.map(() => null);
  const common = {size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 36 / px, pathPad: rad * 0.5, seatPoints};
  if (showKey) {
    // room seats (inside the room)
    const roomIdx = items.map((it, i) => i).filter(i => items[i].kind === 'room' && i !== finalWaiting);
    if (roomIdx.length) {
      const res = placeSeatLabels(ctx, {
        ...common,
        items: roomIdx.map(i => ({key: `seat${i}`, text: items[i].route.label, at: toD(G.slots[items[i].route.slot]), rad,
          avoidPaths: [...items.slice(i + 1).filter(v => v.kind === 'room').map(v => thin(remainingPath(v.walker, items[i].end - 0.012)).map(toD)).filter(q => q.length), ...linkPaths]})),
        people: everyone, furniture: [...furn, ...screens], bounds: roomBox, extra, hard, hardAlways,
      });
      res.labels.forEach((lb, j) => { labels[roomIdx[j]] = lb; extra.push(lb.box); });
      fails.push(...res.fails);
    }
    // windows: beside their own screen, outside the room (per side)
    for (const side of ['left', 'right']) {
      const idx = items.map((it, i) => i).filter(i => items[i].kind === 'window' && G.win[items[i].route.slot].side === side);
      if (!idx.length) continue;
      const E = G.extents;
      // (the chip may reach over the channel and the wall, never into the room)
      const colT = side === 'left' ? {x: E.x, y: E.y, w: -E.x - 2, h: E.h} : {x: G.W + 2, y: E.y, w: E.x + E.w - G.W - 2, h: E.h};
      const res = placeSeatLabels(ctx, {
        ...common,
        items: idx.map(i => ({key: `seat${i}`, text: items[i].route.label, at: toD(G.win[items[i].route.slot].seat), rad, avoidPaths: linkPaths})),
        people: everyone, furniture: [...furn, ...screens.map(s => ({...s}))], bounds: pf.mapBox(colT), extra, hard, hardAlways,
      });
      res.labels.forEach((lb, j) => { labels[idx[j]] = lb; extra.push(lb.box); });
      fails.push(...res.fails);
    }
    if (finalWaiting >= 0) {
      // the participant not yet in place: their label beside them (corridor or window), dashed, at the hold
      const it = items[finalWaiting];
      const at = it.kind === 'room' ? toD(it.walker.spot) : toD(G.win[it.route.slot].seat);
      const bounds = it.kind === 'room' ? pf.mapBox({x: 4, y: G.H + WALL + 4, w: G.W - 8, h: G.cw - 8}) : pf.rect;
      const res = placeSeatLabels(ctx, {...common, maxGap: 60 / px, items: [{key: 'waiting', text: it.route.label, at, rad, avoidPaths: linkPaths}], people: everyone, furniture: [...furn, ...screens], bounds, extra, hard, hardAlways: []});
      labels[finalWaiting] = res.labels[0];
      extra.push(res.labels[0].box);
      fails.push(...res.fails);
    }
  }
  let doorChip = null;
  if (showAll) {
    const at = toD({x: (G.mainDoor.a + G.mainDoor.b) / 2, y: G.H + WALL / 2});
    const corr = pf.mapBox({x: 4, y: G.H + WALL + 4, w: G.W - 8, h: G.cw - 8});
    const waitingPeople = items.filter(it => it.kind === 'room').map(it => ({...toD(it.walker.spot), rad}));
    let got = null;
    for (const bounds of [corr, roomBox]) {
      const res = placeSeatLabels(ctx, {items: [{key: 'mainDoor', text: p.labels.mainDoor, at, rad: 10, avoidPaths: items.filter(it => it.kind === 'room').map(it => thin(it.walker.pts).map(toD))}],
        people: [...everyone, ...waitingPeople], furniture: furn, bounds, size: F, minSize: F, maxWidth: Math.min(300 / px, bounds.w), maxLines: 3, maxGap: 220, pathPad: rad * 0.72, strictPaths: true, extra});
      if (!res.fails.length) { got = res.labels[0]; break; }
      if (!got) got = res.labels[0];
      if (bounds === roomBox) fails.push('door');
    }
    doorChip = got;
    extra.push(got.box);
  }
  let roomChip = null;
  if (showKey) {
    const ropts = {maxWidth: Math.max(240 / px, Math.min(380 / px, roomBox.w * 0.4)), size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent2};
    const probe = gchip(ctx, p.courts.room, {x: 0, y: 0, ...ropts});
    const spot = placeFree({w: probe.box.w, h: probe.box.h, bounds: roomBox, people: [...everyone, ...items.filter(it => it.kind === 'room').map(it => ({...toD(it.walker.spot), rad}))],
      extra, paths: [...items.filter(it => it.kind === 'room').map(it => thin(it.walker.pts).map(toD)), ...linkPaths], pathPad: rad * 0.6, furniture: furn, prefer: 'bottom-left'});
    if (!spot) fails.push('room');
    const at = spot || {x: roomBox.x, y: roomBox.y};
    roomChip = gchip(ctx, p.courts.room, {x: at.x, y: at.y, ...ropts, name: 'room-name'});
    extra.push(roomChip.box);
  }
  // ---- annotation rings (keyed to the notes)
  const targetOf = tg => {
    if (tg === 'mainDoor') return {...toD(G.doors.main.gate), rr: 70 * k};
    if (tg === 'bench') return {...toD({x: G.desk.cx, y: G.desk.cy}), rr: (G.desk.w / 2 + 16) * k};
    if (tg === 'room') return {box: pf.mapBox({x: 0, y: 0, w: G.W, h: G.H})};
    const it = tg === 'firstWindow' ? items.find(q => q.kind === 'window') : items.find(q => q.kind === 'room');
    if (!it) return {...toD({x: G.W / 2, y: G.H / 2}), rr: 60 * k};
    if (it.kind === 'window') return {box: pf.mapBox(G.win[it.route.slot].box)};
    return {...toD(G.slots[it.route.slot]), rr: 62 * k};
  };
  // note rings are solid and neutral (dashes would read as pending or disputed); 'everyone' rings each participant
  // alike, in the room and in a window, with one ring size so no participant is singled out
  const noteColors = [th.fgSoft, th.fgSoft];
  const ringOf = (tg, col) => (tg.box
    ? h('rect', {x: r(tg.box.x - 8), y: r(tg.box.y - 8), width: r(tg.box.w + 16), height: r(tg.box.h + 16), rx: 16, fill: 'none', stroke: col, 'stroke-width': 4})
    : h('circle', {cx: r(tg.x), cy: r(tg.y), r: r(tg.rr), fill: 'none', stroke: col, 'stroke-width': 4}));
  const rings = notes.map((n, i) => {
    const col = noteColors[i % 2];
    if (n.target === 'everyone') return g({name: `note-ring${i}`}, items.map(it => ringOf({...toD(it.kind === 'window' ? G.win[it.route.slot].seat : G.slots[it.route.slot]), rr: 62 * k}, col)));
    return g({name: `note-ring${i}`}, ringOf(targetOf(n.target), col));
  });
  // ---- panel nodes and the building
  const placed = placePanel(ctx, pan, F, p, noteColors);
  const bb = bldIn ? bldIn.box : placed.bldBox;
  if (bldIn && bldIn.name) placed.nodes.push(bldIn.name.node);
  const building = buildingElevation(ctx, {name: 'bld', x: bb.x, y: bb.y, w: bb.w, h: bb.h, floors: 3, bays: 5, highlight: {floor: 1, bay: 3}, tree: !bldIn});
  return {
    F, px, k, rot, arr, flow: rg.flow, personPx, G, pf, items, room, tiles, links, people, labels, fails, doorChip, roomChip, rings, noteCount: notes.length,
    panelNodes: placed.nodes, stateNode: placed.stateNode, building, finalWaiting, rad,
  };
}

/** Every 4th point of a path (and its last): enough to keep labels off it, far cheaper to test. */
// path simplification for the label search (Douglas–Peucker, 5 plan units): the walk's rounded corners keep their
// shape while the label placer tests far fewer segments (create() budget)
function thin(pts, tol = 5) {
  if (pts.length < 3) return pts.slice();
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const A = pts[a], B = pts[b];
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
    let m = -1, md = tol;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i].x - A.x) * dy - (pts[i].y - A.y) * dx) / L; if (d > md) { md = d; m = i; } }
    if (m > 0) { keep[m] = true; stack.push([a, m], [m, b]); }
  }
  return pts.filter((q, i) => keep[i]);
}

/** Measure the info panel (building + name, legend rows, notes, state tag, key) for a flow and share. */
function panelFor(ctx, o) {
  const th = ctx.theme;
  const D = ctx.design;
  const {flow, f, F, legendItems, notes, finalText, showKey, p, inPlan} = o;
  const box = flow === 'column' ? {x: D.w * (1 - f), y: 0, w: D.w * f, h: D.h} : {x: 0, y: 0, w: D.w, h: D.h * f};
  const gap = F * 0.7;
  const textW = flow === 'column' ? box.w : box.w * 0.64;
  const glyph = F * 2.2;
  const items = [];
  for (const it of legendItems) items.push({type: 'legend', kind: it.kind, fit: fitWords(glue(it.text), {maxWidth: textW - glyph - 14, size: F, minSize: F, maxLines: 3, weight: 500}), glyph});
  notes.forEach((n, i) => items.push({type: 'note', i, fit: fitWords(glue(n.text), {maxWidth: textW - F * 1.9 - 12, size: F, minSize: F, maxLines: 4, weight: 500})}));
  if (showKey) items.push({type: 'state', chip: gchip(ctx, finalText, {x: 0, y: 0, anchor: 'start', maxWidth: textW, size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent4, color: th.ink, weight: 700})});
  if (showKey) items.push({type: 'key', fit: fitWords(glue(p.labels.key), {maxWidth: textW - 12, size: F, minSize: F, maxLines: 4, weight: 500})});
  const nameW = flow === 'column' ? box.w : box.w - textW - 20;
  const nameChip = showKey && !inPlan ? gchip(ctx, p.courts.building, {x: 0, y: 0, anchor: 'middle', maxWidth: nameW, size: F, minSize: F, maxLines: 3, fill: th.card}) : null;
  const hOf = it => (it.type === 'state' ? it.chip.box.h : it.type === 'legend' ? Math.max(it.glyph, it.fit.height) : it.fit.height + (it.type === 'key' ? F * 0.6 : 0));
  const truncated = items.some(it => (it.chip ? it.chip.fit.truncated : it.fit.truncated)) || (nameChip && nameChip.fit.truncated);
  const textH = items.reduce((a, it) => a + hOf(it) + gap, 0);
  const nameH = nameChip ? nameChip.box.h + gap : 0;
  let bld, ok;
  if (inPlan) {
    bld = {w: 0, h: 0};
    ok = !truncated && textH - gap <= box.h + 0.5;
  } else if (flow === 'column') {
    const bh = Math.min(box.h - textH - nameH, box.w * 0.95, box.h * 0.46);
    bld = {w: Math.min(box.w, bh / 0.9), h: bh};
    ok = !truncated && bh >= Math.min(130, box.h * 0.18);
  } else {
    const bw = Math.min(nameW, box.h * 1.1);
    const bh = Math.min(bw * 0.95, box.h - nameH);
    bld = {w: bw, h: bh};
    ok = !truncated && textH - gap <= box.h + 0.5 && bh >= box.h * 0.45;
  }
  return {flow, box, items, nameChip, nameW, bld, ok, gap, textW, hOf, textH};
}

/** Place the panel's nodes; returns the building box, nodes and the state-tag node. */
function placePanel(ctx, pan, F, p, noteColors) {
  const th = ctx.theme;
  const nodes = [];
  let stateNode = null;
  let bldBox;
  const B = pan.box;
  if (pan.flow === 'column') {
    let y = B.y;
    bldBox = {x: B.x + (B.w - pan.bld.w) / 2, y, w: pan.bld.w, h: pan.bld.h};
    if (pan.bld.h) y += pan.bld.h + pan.gap;
    if (pan.nameChip) {
      const c = gchip(ctx, p.courts.building, {x: B.x + B.w / 2, y, anchor: 'middle', maxWidth: B.w, size: F, minSize: F, maxLines: 3, fill: th.card, name: 'bld-name'});
      nodes.push(c.node);
      y += c.box.h + pan.gap;
    }
    const rest = pan.textH;
    y += Math.max(0, (B.y + B.h - y - rest) * 0.35);
    for (const it of pan.items) {
      const node = panelItem(ctx, it, B.x, y, pan, F, noteColors);
      if (it.type === 'state') stateNode = node; else nodes.push(node);
      y += pan.hOf(it) + pan.gap;
    }
  } else {
    bldBox = {x: B.x + (pan.nameW - pan.bld.w) / 2, y: B.y, w: pan.bld.w, h: pan.bld.h};
    if (pan.nameChip) {
      const c = gchip(ctx, p.courts.building, {x: B.x + pan.nameW / 2, y: B.y + pan.bld.h + pan.gap * 0.6, anchor: 'middle', maxWidth: pan.nameW, size: F, minSize: F, maxLines: 3, fill: th.card, name: 'bld-name'});
      nodes.push(c.node);
    }
    const tx = B.x + B.w - pan.textW;
    let y = B.y + Math.max(0, (B.h - pan.textH + pan.gap) / 2);
    for (const it of pan.items) {
      const node = panelItem(ctx, it, tx, y, pan, F, noteColors);
      if (it.type === 'state') stateNode = node; else nodes.push(node);
      y += pan.hOf(it) + pan.gap;
    }
  }
  return {bldBox, nodes, stateNode};
}

/** One text item of the info panel (legend row, keyed note, state tag, key). */
function panelItem(ctx, it, x, y, pan, F, noteColors) {
  const th = ctx.theme;
  if (it.type === 'legend') {
    const look = {skin: '#c68863', hair: 'short', hairColor: '#4a3122', outfit: th.cloth[3], glasses: false};
    const gl = sfrGlyph(ctx, it.kind, it.glyph, look);
    const hh = Math.max(it.glyph, it.fit.height);
    return g({name: `legend-${it.kind}`},
      g({transform: T(x + it.glyph / 2, y + hh / 2)}, gl),
      textAt(it.fit, x + it.glyph + 14, y + (hh - it.fit.height) / 2, th.fg));
  }
  if (it.type === 'note') {
    const col = noteColors[it.i % 2];
    const rr = F * 0.62;
    return g({name: `note${it.i}`},
      h('circle', {cx: r(x + rr + 2), cy: r(y + F * 0.55), r: r(rr), fill: 'none', stroke: col, 'stroke-width': 4}),
      textAt(it.fit, x + F * 1.9 + 12, y, th.fg));
  }
  if (it.type === 'state') {
    return gchip(ctx, it.chip.fit.full, {x, y, anchor: 'start', maxWidth: pan.textW, size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent4, color: th.ink, weight: 700}).node;
  }
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
    slug: 'courts-04-story',
    title: 'Physical and remote room — the bench links to remote windows while others walk in',
    titleEs: 'Sala física y remota — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Sala física y remota',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic building stands beside the plan of a hearing room. In the supplied order, participants who appear in the room walk from the corridor through the door and sit, and the bench draws a solid link line to each remote window around the room edge; the window’s camera dot lights and the participant shown in it sits at their desk. Everyone is drawn at the same size with the same label style; where each participant appears is as supplied and no conclusion is drawn.',
    tags: ['floor plan', 'hearing room', 'bench', 'remote window', 'screen', 'link', 'participants', 'walk and sit', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/sala-fisica-remota.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
