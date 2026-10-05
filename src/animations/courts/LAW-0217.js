/**
 * LAW-0217 — Acceso a sala · story
 *
 * Storyboard (a generic building and the plan of one of its rooms, seen from
 * above; the building front stands beside the plan as the anchor). The room
 * has TWO separate supplied access routes that both start at the entrance
 * hall (bottom-left): a corridor along the bottom wall with its door (●
 * "Public access") and a corridor along the left wall with its door (◆
 * "Restricted access as configured"). Both corridors, doors, badges and route
 * lines have the same size and weight; only the glyph and lane colour differ.
 *  0.00–0.15  rest: the building (its room window highlighted, its name under
 *             it), the plan with both corridors and doors, the tables and
 *             benches with empty seats; the participants wait whole and opaque
 *             in the corridor of their supplied route, each facing its door.
 *             The legend names the two routes with their glyphs.
 *  0.15–0.42  the first participants set off: a solid route line draws from
 *             each person's spot along their corridor, through their door (the
 *             leaf swings open as they pass, the arc is solid), along their
 *             lane of the middle aisle to their seat; they walk (feet and arms
 *             alternate), turn and sit. As each person lands, their editable
 *             label arrives beside the seat with a short leader (chip body
 *             first, then its text).
 *  0.42–0.73  the remaining participants follow on their own routes; labels
 *             stay attached to their seats; nobody appears except through a
 *             door; the route lines stay drawn at full strength.
 *  0.73–1.00  hold: the supplied final state (everyone seated, or the last
 *             person still waiting in the corridor), the keyed notes and the
 *             key "as supplied · no conclusion drawn". The scene shows only
 *             which route each supplied participant used and which seat they
 *             reached; it never states who may attend, any rule or outcome.
 * @module animations/courts/LAW-0217
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {buildingElevation} from './kits/courts-art.js';
import {walkerAt, placeSeatLabels, remainingPath, bodyBox, seatLabelNode, pxPerUnit, R2} from './kits/distribucion-de-sala.js';
import {
  accessFields, ACCESS_EN, ACCESS_STRINGS, resolveAccess, accessGeometry, fitAccess, planAccessWalkers, doorOpen, accessArt, accessTrail,
  accessPerson, accessObstacles, furnitureBoxes, accessColor, measureStack, drawStack, inRoom, atDoor, passesNear, simplify, PERSON_RAD,
} from './kits/acceso-a-sala.js';

const ID = 'LAW-0217';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const WALK = [0.16, 0.72];
const W_NOTES = [0.75, 0.81];
const TARGETS = ['publicDoor', 'restrictedDoor', 'room', 'firstSeat', 'lastSeat'];

const STRINGS = {
  en: {...ACCESS_STRINGS.en},
  es: {...ACCESS_STRINGS.es},
};

const sceneSchema = {
  ...accessFields,
  actorLabels: obj('Caption of the person glyph in the plan legend', {
    participant: str('Caption for the people drawn from above', 50),
  }),
  objectLabels: obj('Captions of the plan glyphs in the legend', {
    route: str('Caption for the solid route lines', 60),
    door: str('Caption for a door', 50),
  }),
  actionProgress: num('How far the entrance is allowed to progress (1 = everyone reaches a seat; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring drawn on its target in the plan', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['all-seated', 'last-waiting']),
};

const defaultParams = {
  ...ACCESS_EN,
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {route: 'Route taken (as supplied)', door: 'Door'},
  actionProgress: 1,
  annotations: [{target: 'restrictedDoor', text: 'Two people use this route (as supplied)'}],
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
    const {routes} = resolveAccess(ctx, p);
    const walkerCount = routes.length;
    const finalWaiting = p.finalState === 'last-waiting' && walkerCount > 0 ? walkerCount - 1 : -1;
    const finalText = p.finalState === 'last-waiting' ? ctx.t.lastWaiting : ctx.t.allSeated;
    const notes = showAll ? p.annotations : [];
    const noteColors = [th.accent3, th.cloth[3]];
    // panel items: the building's and the room's names (the room is the highlighted window), the legend (the two
    // routes are key content; the glyph captions only with all labels), the keyed notes, the state tag and the key
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const legendItems = [
      ...(showKey ? [{type: 'legend', kind: 'public', text: p.labels.publicAccess, weight: 600, name: 'legend-public'}, {type: 'legend', kind: 'restricted', text: p.labels.restrictedAccess, weight: 600, name: 'legend-restricted'}] : []),
      ...(showAll ? [{type: 'legend', kind: 'person', text: p.actorLabels.participant, name: 'legend-person'}, {type: 'legend', kind: 'route', text: p.objectLabels.route, name: 'legend-route'}, {type: 'legend', kind: 'door', text: p.objectLabels.door, name: 'legend-door'}] : []),
    ];
    const noteItems = notes.map((n, i) => ({type: 'note', text: n.text, color: noteColors[i % 2], name: `note${i}`}));
    const tailItems = showKey ? [{type: 'chip', text: finalText, stroke: th.inkSoft, weight: 700, name: 'state-tag'}, {type: 'key', text: p.labels.key, name: 'key'}] : [];
    const shape = ctx.view.shape;
    const GAP = 26 / px;

    /** Candidate compositions at text size F: {box (plan), parts: [{m, x, y}], bld} */
    const arrangements = F => {
      const out = [];
      const minB = Math.min(150 / px, D.h * 0.2);
      if (shape !== 'portrait') {
        for (const cf of [0.24, 0.28, 0.32, 0.36]) {
          const pw = Math.max(260 / px, D.w * cf);
          // (a) everything in one column beside the plan, under the building
          const m = measureStack(ctx, [...nameItems, ...legendItems, ...noteItems, ...tailItems], pw, F);
          const bh = Math.min(D.h - m.height - m.gap, pw * 0.95, D.h * 0.5);
          if (!m.truncated && bh >= minB) {
            const rest = D.h - bh - m.gap - m.height;
            out.push({kind: 'column', F, box: {x: 0, y: 0, w: D.w - pw - GAP, h: D.h}, bld: {x: D.w - pw + (pw - Math.min(pw, bh / 0.9)) / 2, y: 0, w: Math.min(pw, bh / 0.9), h: bh},
              parts: [{m, x: D.w - pw, y: bh + m.gap + rest * 0.35}]});
          }
          // (b) names and legend in the column; notes | state + key in a band under the plan
          if (noteItems.length + tailItems.length) {
            const mc = measureStack(ctx, [...nameItems, ...legendItems], pw, F);
            const bh2 = Math.min(D.h - mc.height - mc.gap, pw * 0.95, D.h * 0.5);
            const bw = D.w - pw - GAP;
            const hw = (bw - GAP) / 2;
            // the band holds the notes, the state tag and the key in two columns (the lowest split in reading order)
            const seq = [...noteItems, ...tailItems];
            let band = null;
            for (let cut = 1; cut < seq.length; cut++) {
              const ml = measureStack(ctx, seq.slice(0, cut), hw, F), mr = measureStack(ctx, seq.slice(cut), hw, F);
              if (ml.truncated || mr.truncated) continue;
              const bH = Math.max(ml.height, mr.height);
              if (!band || bH < band.h) band = {h: bH, parts: [{m: ml, x: 0}, {m: mr, x: hw + GAP}]};
            }
            if (seq.length === 1) { const m1 = measureStack(ctx, seq, bw, F); if (!m1.truncated) band = {h: m1.height, parts: [{m: m1, x: 0}]}; }
            if (band && !mc.truncated && bh2 >= minB) {
              const bandH = band.h;
              const rest = D.h - bh2 - mc.gap - mc.height;
              out.push({kind: 'split', F, box: {x: 0, y: 0, w: bw, h: D.h - bandH - GAP}, bld: {x: D.w - pw + (pw - Math.min(pw, bh2 / 0.9)) / 2, y: 0, w: Math.min(pw, bh2 / 0.9), h: bh2},
                parts: [{m: mc, x: D.w - pw, y: bh2 + mc.gap + rest * 0.35}, ...band.parts.map(q => ({...q, y: D.h - bandH}))]});
            }
          }
        }
      }
      if (shape !== 'landscape') {
        // (c) a band: the building with its names on the left, the texts on the right (top in portrait, bottom in square)
        for (const bf of [0.3, 0.36, 0.42]) {
          const bw = D.w * bf;
          const tw = D.w - bw - GAP;
          const mn = measureStack(ctx, nameItems, bw, F);
          const mt = measureStack(ctx, [...legendItems, ...noteItems, ...tailItems], tw, F);
          if (mn.truncated || mt.truncated) continue;
          const bh = Math.min(bw * 0.9, Math.max(minB, mt.height - (mn.height ? mn.height + mn.gap : 0)));
          const bandH = Math.max(bh + (mn.height ? mn.gap + mn.height : 0), mt.height);
          const top = shape === 'portrait';
          const y0 = top ? 0 : D.h - bandH;
          if (bandH > D.h * 0.45) continue;
          out.push({kind: 'band', F, box: {x: 0, y: top ? bandH + GAP : 0, w: D.w, h: D.h - bandH - GAP}, bld: {x: 0, y: y0, w: bw, h: bh},
            parts: [...(mn.height ? [{m: mn, x: 0, y: y0 + bh + mn.gap}] : []), {m: mt, x: bw + GAP, y: y0 + (bandH - mt.height) / 2}]});
        }
      }
      return out;
    };

    const Fmin = 16.6 / px;
    const attempt = (F, force, loose = false) => {
      let tries = force ? [] : arrangements(F);
      if (force) {
        // labels hidden: the building beside (or above) the plan, no texts
        if (shape === 'portrait') {
          const bh = D.h * 0.2;
          tries = [{kind: 'band', F, box: {x: 0, y: bh + GAP, w: D.w, h: D.h - bh - GAP}, bld: {x: D.w * 0.29, y: 0, w: D.w * 0.42, h: bh}, parts: []}];
        } else {
          const pw = D.w * 0.22;
          tries = [{kind: 'column', F, box: {x: 0, y: 0, w: D.w - pw - GAP, h: D.h}, bld: {x: D.w - pw, y: 0, w: pw, h: Math.min(D.h * 0.5, pw * 0.95)}, parts: []}];
        }
      }
      if (!tries.length) return null;
      for (const t of tries) t.fr = fitAccess(t.box);
      tries.sort((a, b) => b.fr.k - a.fr.k);
      // a composition whose people would fall under 60 px is not worth placing labels in (unless nothing else exists)
      if (!force && tries[0].fr.k * PERSON_RAD * 2 * 1.05 * px < 61) return {F, pick: tries[0], k: tries[0].fr.k, labelFails: ['people-size', 'people-size'], trailsToo: true};
      tries = tries.filter(t => t.fr.k * PERSON_RAD * 2 * 1.05 * px >= 61);
      let best = null;
      // first try chips clear of every drawn route line; then clear of the routes still to be walked only
      // (the three largest plans only, and the looser pass only when the strict one nearly succeeded)
      for (const trailsToo of loose ? [true, false] : [true]) {
        if (!trailsToo && best && best.labelFails.length > 2) break;
        // (a chip that can only sit on a corner plant makes that decorative plant give way instead)
        for (const plantsHard of [true, false]) {
          for (const pick of tries.slice(0, 1)) {
            const res = compose(pick, F, trailsToo, plantsHard);
            if (!best || res.labelFails.length < best.labelFails.length) best = res;
            if (!res.labelFails.length) return res;
          }
        }
      }
      return best;
    };
    // the note rings (only when the notes are shown) are obstacles for the seat labels
    const ringBoxes = (G, walkers, toD, k) => notes.map(n => {
      const tq = ringTarget(n.target, G, walkers, toD, k, 0, 0, G.W, G.H);
      return tq.box ? null : {x: tq.x - tq.rr - 4, y: tq.y - tq.rr - 4, w: 2 * tq.rr + 8, h: 2 * tq.rr + 8};
    }).filter(Boolean);
    const compose = (pick, F, trailsToo, plantsHard = true) => {
      const {W, H, k} = pick.fr;
      const G = accessGeometry(W, H);
      const E = G.extents;
      const ox = pick.box.x + (pick.box.w - E.w * k) / 2 - E.x * k;
      const oy = pick.box.y + (pick.box.h - E.h * k) / 2 - E.y * k;
      const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
      const walkers = planAccessWalkers(G, routes, {a: WALK[0], b: WALK[1]});
      const takenSlots = walkers.filter((w, i) => i !== finalWaiting).map(w => w.slot);
      const rad = PERSON_RAD * k;
      const roomBox = {x: ox + 4 * k, y: oy + 4 * k, w: (G.W - 8) * k, h: (G.H - 8) * k};
      const furn = furnitureBoxes(G).filter(f => f.kind !== 'chair' || !takenSlots.includes(f.slot)).map(f => ({x: ox + f.x * k, y: oy + f.y * k, w: f.w * k, h: f.h * k}));
      let seatLabels = [];
      let labelFails = [];
      if (showKey) {
        const res = placeSeatLabels(ctx, {
          items: walkers.map((w, i) => ({key: `seat${i}`, text: w.route.label, at: toD(i === finalWaiting ? w.spot : w.seat), rad, avoidPaths: [
            ...walkers.slice(i + 1).map(v => simplify(remainingPath(v, w.end - 0.012), 1.5).map(toD)),
            ...(trailsToo ? walkers.slice(0, i).map(v => simplify(v.pts.slice(0, -1), 1.5).map(toD)) : []),
            // its own route line too, up to where it disappears under its own person
            ...(i === finalWaiting ? [] : [simplify(w.pts.filter(q => Math.hypot(q.x - w.seat.x, q.y - w.seat.y) > PERSON_RAD * 1.05), 1.5).map(toD)]),
          ].filter(q => q.length > 1)})),
          people: walkers.map((w, i) => (i === finalWaiting ? {...toD(w.spot), rad} : bodyBox(toD(w.seat), w.seat.deg, rad))),
          furniture: furn, bounds: finalWaiting >= 0 ? {x: ox + G.extents.x * k + 20 * k, y: oy + 4 * k, w: (G.extents.w - 40) * k, h: (G.extents.h - 30) * k} : roomBox,
          size: F, minSize: F, maxWidth: Math.min(330 / px, Math.max(230 / px, G.tableW * k * 1.1)), maxLines: 3, maxGap: 38 / px, pathPad: rad * 0.55,
          // never over a note ring, a plant or a route badge
          extra: [...ringBoxes(G, walkers, toD, k), ...(plantsHard ? G.plants : []).map(q => ({x: ox + (q.x - 25) * k, y: oy + (q.y - 25) * k, w: 50 * k, h: 50 * k})),
            ...Object.values(G.badges).map(q => ({x: ox + (q.x - 27) * k, y: oy + (q.y - 27) * k, w: 54 * k, h: 54 * k}))],
          ...accessObstacles(G, toD, new Set(takenSlots)),
        });
        seatLabels = res.labels;
        labelFails = res.fails;
      }
      return {F, pick, W, H, k, G, ox, oy, toD, walkers, rad, seatLabels, labelFails, trailsToo, plantsHard};
    };
    let A = null;
    const LOG = [];
    if (showKey) {
      // the largest text size that places every label; a size up to 1.6 px smaller wins when it buys a plan >= 10 %
      // larger (never below the 19.5 px baseline floor unless the larger size itself was below it)
      // chips keep off every route line, drawn or still to be walked, at every size first; only when no size places
      // every label that way may a chip rest over a line already drawn (never over one still to be walked)
      let found = null;
      for (const loose of [false]) {
      if (found) break;
      let stepF = 0.8 / px;
      for (let F = 22.5 / px; F >= Fmin - 1e-6; F -= stepF) {
        const at = attempt(F, false, loose);
        // far from fitting: step down faster (keeps create() fast on crowded stress layouts)
        stepF = at && at.labelFails.length >= 2 && !found ? 1.6 / px : 0.8 / px;
        if (F - stepF < Fmin - 1e-6 && F > Fmin + 1e-6 && !found) stepF = F - Fmin;
        if (found && at === found && F - 0.8 / px < Fmin - 1e-6) break;
        LOG.push(at ? `${(F * px).toFixed(1)}:${at.pick.kind}:${at.labelFails.join('+')}:k${at.k.toFixed(2)}${at.trailsToo ? '' : ':loose'}` : `${(F * px).toFixed(1)}:null`);
        if (!at) continue;
        if (!A || at.labelFails.length < A.labelFails.length) A = at;
        if (!at.labelFails.length) {
          if (!found) { found = at; A = at; continue; }
          if (at.k >= found.k * 1.1 && at.k > A.k * 1.02 && at.trailsToo >= found.trailsToo) A = at;
        }
        if (found && F <= found.F - 1.59 / px) break;
        if (found && F * px < 19.5 + 0.8 && found.F * px >= 19.5) break;
      }
      }
    }
    if (!A) A = attempt(Fmin, true);
    const {F, pick, W, H, k, G, ox, oy, toD, walkers, rad, seatLabels, labelFails} = A;
    // decorative plants never sit under a chip: one a chip would cover is not drawn
    const chipT = seatLabels.map(sl => ({x: (sl.box.x - ox) / k, y: (sl.box.y - oy) / k, w: sl.box.w / k, h: sl.box.h / k}));
    const plantSize = b => Math.abs(b.w - 50) < 1 && Math.abs(b.h - 50) < 1;
    const art = accessArt(ctx, G, {prefix: 'rm', keep: b => !plantSize(b) || !chipT.some(c => c.x < b.x + b.w && b.x < c.x + c.w && c.y < b.y + b.h && b.y < c.y + c.h)});
    const people = walkers.map((w, i) => accessPerson(ctx, `p${i}`, w.route.look));
    const trails = walkers.map((w, i) => accessTrail(ctx, {name: `trail${i}`, pts: w.pts, color: accessColor(ctx, w.access)}));

    // ---- annotation rings on their targets (keyed to the notes in the panel)
    const targetOf = tg => ringTarget(tg, G, walkers, toD, k, ox, oy, W, H);
    const panel = pick.parts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden: it => it.name === 'state-tag' || /^note/.test(it.name)}));
    const building = buildingElevation(ctx, {name: 'bld', x: pick.bld.x, y: pick.bld.y, w: pick.bld.w, h: pick.bld.h, floors: 3, bays: 5, highlight: {floor: 0, bay: 1}});
    const rings = notes.map((n, i) => {
      const tgt = targetOf(n.target);
      const col = noteColors[i % 2];
      if (tgt.box) return h('rect', {x: r(tgt.box.x - 6), y: r(tgt.box.y - 6), width: r(tgt.box.w + 12), height: r(tgt.box.h + 12), rx: 14, fill: 'none', stroke: col, 'stroke-width': 5});
      return h('circle', {cx: r(tgt.x), cy: r(tgt.y), r: r(tgt.rr), fill: 'none', stroke: col, 'stroke-width': 5});
    });
    return {
      F, px, W, H, k, G, ox, oy, walkers, people, trails, art, seatLabels, labelFails, panel, rings, building,
      finalWaiting, log: LOG, arrangement: pick.kind, trailsToo: A.trailsToo, rad, toD, noteCount: notes.length, hasState: showKey,
    };
  },
  build(ctx, L) {
    return g(null,
      L.building.node,
      g({name: 'plan', transform: T(L.ox, L.oy, 0, L.k)},
        L.art.node,
        L.trails.map(t => t.node),
        L.people.map(pp => pp.node)),
      g({name: 'notes', opacity: 0}, L.rings),
      L.seatLabels.map((sl, i) => seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: i === L.finalWaiting ? `p${i}` : `rm-chair-${L.walkers[i].slot}`})),
      L.panel.map(q => q.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const capU = lerp(WALK[0], WALK[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const positions = [];
    const semantic = {people: [], states: [], labels: [], access: [], inRoom: [], atDoor: []};
    const G = L.G;
    L.walkers.forEach((w, i) => {
      const waiting = i === L.finalWaiting;
      const q = waiting ? 0 : seg(ua, w.start, w.end);
      const st = walkerAt(w, q, {reduced: ctx.reduced});
      Object.assign(nodes, L.people[i].pose({x: st.x, y: st.y, deg: st.deg, phase: st.phase, walk: st.walk, seated: st.seated}));
      positions.push(st);
      // the route line draws just ahead of the walk and stays at full strength
      const draw = waiting ? 0 : seg(ua, w.start - 0.035, w.start + (w.end - w.start) * 0.45);
      Object.assign(nodes, L.trails[i].frame(draw, 1));
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
      semantic.access.push(w.access);
      semantic.labels.push(r(L.seatLabels[i] ? textP : (landed ? 1 : 0), 3));
      semantic.inRoom.push(inRoom(G, st));
      semantic.atDoor.push(atDoor(G, st));
    });
    Object.assign(nodes, L.art.doors.public.frame(doorOpen(G, 'public', positions.map((q, i) => ({...q, access: L.walkers[i].access})))));
    Object.assign(nodes, L.art.doors.restricted.frame(doorOpen(G, 'restricted', positions)));
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W_NOTES) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    if (L.hasState) nodes['state-tag'] = {opacity: r(done ? seg(u, W_NOTES[0] + 0.01, W_NOTES[1] + 0.01) : 0, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    // which door each person passed (template: the route runs through that door's gate)
    const doorUsed = L.walkers.map(w => w.access);
    return {
      nodes,
      semantic: {
        ...semantic,
        beat,
        seated: semantic.states.filter(s => s === 'seated').length,
        walking: semantic.states.filter(s => s === 'walking' || s === 'sitting').length,
        allReached: true,
        order: L.walkers.map(w => `${w.slot}:${w.access}`).join('>'),
        doorUsed,
        routesThroughOwnDoor: L.walkers.every(w => passesNear(w.pts, G.doors[w.access].gate, 2) && !passesNear(w.pts, G.doors[w.access === 'public' ? 'restricted' : 'public'].gate, 60)),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        labelsPlaced: L.labelFails.length === 0,
        chipsOffAllRoutes: L.trailsToo !== false,
        labelFails: L.labelFails,
        textPx: r(L.F * L.px, 1),
        startOutside: L.walkers.every(w => !inRoom(G, w.spot)),
        labelGapsPx: L.seatLabels.map(sl => r(sl.gap * L.px, 1)),
        arrangement: L.arrangement,
        k: r(L.k, 3),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
        log: L.log,
      },
    };
  },
};

/** Ring target of a note (design units). */
function ringTarget(tg, G, walkers, toD, k, ox, oy, W, H) {
  if (tg === 'publicDoor') return {...toD(G.doors.public.gate), rr: 70 * k};
  if (tg === 'restrictedDoor') return {...toD(G.doors.restricted.gate), rr: 70 * k};
  if (tg === 'room') return {box: {x: ox, y: oy, w: W * k, h: H * k}};
  const w = tg === 'firstSeat' ? walkers[0] : walkers[walkers.length - 1];
  return w ? {...toD(w.seat), rr: 60 * k} : {...toD({x: G.W / 2, y: G.H / 2}), rr: 60 * k};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-05-story',
    title: 'Room access — participants enter by separate supplied routes and take their seats',
    titleEs: 'Acceso a sala — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Acceso a sala',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic building stands beside the floor plan of one of its rooms, which has two separate supplied access routes from the same entrance hall: a public-access corridor and door (●) and a restricted-access corridor and door as configured (◆), drawn with equal weight. Participants wait in the corridor of their supplied route, walk along a solid route line through their door (the leaf swings open) to their supplied seat, turn and sit; each editable label arrives beside the seat as its occupant lands. Routes, seats and labels are as supplied; no rule, attendance right or outcome is shown.',
    tags: ['floor plan', 'room access', 'public access', 'restricted access as configured', 'separate routes', 'corridors', 'doors', 'seating', 'top-down people', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/acceso-a-sala.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
