/**
 * LAW-0221 — Organización de turnos · story
 *
 * Storyboard (a generic building stands beside the plan of one of its hearing
 * rooms, seen from above: one long table, the participants seated along its
 * two long sides, each with a turn lamp on the table in front of them and a
 * party badge ● or ◆ on the chair back; the badges differ only by glyph).
 *  0.00–0.15  rest: everyone seated; each participant's editable label sits
 *             beside their chair; the lamps carry the sequence numbers as
 *             configured (illustrative). The first person in the sequence
 *             holds the turn signal (a small token) under their hand and their
 *             lamp is lit ("active turn"); every other lamp is unlit ("pending
 *             turn": waiting only).
 *  0.15–0.42  the signal passes: the holder pushes the token across the table
 *             towards the next person in the sequence and lets go at the end of
 *             their reach; the token glides on; the receiver reaches out,
 *             catches it (hand to token at a shared point when they are close)
 *             and draws it to their place. The holder's lamp goes out once the
 *             token has left their hand; the receiver's lamp lights only after
 *             the token has arrived (cause before effect).
 *  0.42–0.73  the remaining passes follow the supplied sequence the same way;
 *             the token never jumps: it is always under a hand or gliding on
 *             the table between two hands.
 *  0.73–1.00  hold: the supplied final state (the last person in the sequence
 *             holds the signal with the lamp lit, or the signal is set down in
 *             the tray at the table centre and every lamp is unlit), the keyed
 *             notes and the key "as supplied · no conclusion drawn". Nothing
 *             states a required order, which side speaks first, time allowed
 *             per turn or any consequence of a turn.
 * @module animations/courts/LAW-0221
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {buildingElevation} from './kits/courts-art.js';
import {
  turnFields, TURN_EN, TURN_STRINGS, resolveTurns, turnGeometry, planHops, turnAt, seatedPose, turnPerson, turnArt, lampFrame, tokenNode,
  seatChips, seatChipNode, fitPlan, measureStack, drawStack, seatPose, lampAt, restAt, pxPerUnit, R2, T, GEO, PERSON_RAD,
} from './kits/organizacion-de-turnos.js';

const ID = 'LAW-0221';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const PASS = [0.16, 0.72];
const W_NOTES = [0.75, 0.81];
const TARGETS = ['signal', 'table', 'firstLamp', 'lastLamp'];

const STRINGS = {en: {...TURN_STRINGS.en}, es: {...TURN_STRINGS.es}};

const sceneSchema = {
  ...turnFields,
  actorLabels: obj('Caption of the person glyph in the legend', {
    participant: str('Caption for the people drawn from above', 50),
  }),
  objectLabels: obj('Captions of the plan objects in the legend', {
    signal: str('Caption of the turn signal token', 50),
  }),
  actionProgress: num('How far the passing of the signal is allowed to progress (1 = the whole supplied sequence; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a ring drawn on its target in the plan', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred): the last person in the sequence holds the signal, or the signal is back in the tray and every turn is pending', ['turn-active', 'all-pending']),
};

const defaultParams = {
  ...TURN_EN,
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {signal: 'Turn signal, passed by hand'},
  actionProgress: 1,
  annotations: [{target: 'signal', text: 'The signal ends with the last person in the sequence (as supplied)'}],
  finalState: 'turn-active',
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
    const {seats, seq} = resolveTurns(ctx, p);
    const toTray = p.finalState === 'all-pending';
    const lastName = seats[seq[seq.length - 1]].label;
    const finalText = toTray ? ctx.t.holdPending : ctx.t.holdActive.replace('{name}', lastName);
    const notes = showAll ? p.annotations : [];
    const noteColors = [th.accent2, th.cloth[3]];
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const legendItems = [
      ...(showKey ? [
        {type: 'legend', kind: 'active', text: p.labels.active, weight: 600, name: 'legend-active', group: 'state'},
        {type: 'legend', kind: 'pending', text: p.labels.pending, weight: 600, name: 'legend-pending', group: 'state'},
        {type: 'legend', kind: 'sequence', text: p.labels.sequence, name: 'legend-sequence'},
      ] : []),
      ...(showAll ? [
        {type: 'legend', kind: 'signal', text: p.objectLabels.signal, name: 'legend-signal'},
        {type: 'legend', kind: 'circle', text: p.labels.circle, name: 'legend-circle', group: 'party'},
        {type: 'legend', kind: 'diamond', text: p.labels.diamond, name: 'legend-diamond', group: 'party'},
        {type: 'legend', kind: 'person', text: p.actorLabels.participant, name: 'legend-person'},
      ] : []),
    ];
    const noteItems = notes.map((n, i) => ({type: 'note', text: n.text, color: noteColors[i % 2], name: `note${i}`}));
    const tailItems = showKey ? [{type: 'chip', text: finalText, stroke: th.inkSoft, weight: 700, name: 'state-tag'}, {type: 'key', text: p.labels.key, name: 'key'}] : [];
    const shape = ctx.view.shape;
    const GAP = 26 / px;
    const cols = Math.max(2, ...seats.map(s => Number(s.slot.slice(-1))));

    /** Two contiguous columns of width w with the lowest taller column (reading order kept). */
    const twoCols = (items, w, F) => {
      let best = null;
      for (let c = 0; c <= items.length; c++) {
        if (c > 0 && c < items.length && items[c - 1].group && items[c - 1].group === items[c].group) continue;
        const m1 = measureStack(ctx, items.slice(0, c), w, F), m2 = measureStack(ctx, items.slice(c), w, F);
        if (m1.truncated || m2.truncated) continue;
        const hh = Math.max(m1.height, m2.height);
        if (!best || hh < best.h) best = {h: hh, cols: [m1, m2]};
      }
      return best;
    };
    /** Candidate compositions at text size F: {box (plan), parts: [{m, x, y}], bld} */
    const arrangements = F => {
      const out = [];
      const minB = Math.min(150 / px, D.h * 0.2);
      const all = [...nameItems, ...legendItems, ...noteItems, ...tailItems];
      const tail = [...noteItems, ...tailItems];
      if (shape !== 'portrait') {
        for (const cf of shape === 'square' ? [0.34, 0.4, 0.46] : [0.22, 0.26, 0.3]) {
          const pw = Math.max(250 / px, D.w * cf);
          const bwOf = bh => Math.min(pw, bh / 0.9);
          // (a) everything in one column beside the plan, under the building
          const m = measureStack(ctx, all, pw, F);
          const bh = Math.min(D.h - m.height - m.gap, pw * 0.95, D.h * 0.42);
          if (!m.truncated && bh >= minB) {
            for (const axis of shape === 'square' ? ['h', 'v'] : ['h']) {
              out.push({kind: 'column', box: {x: 0, y: 0, w: D.w - pw - GAP, h: D.h}, bld: {x: D.w - pw + (pw - bwOf(bh)) / 2, y: 0, w: bwOf(bh), h: bh},
                parts: [{m, x: D.w - pw, y: bh + m.gap + (D.h - bh - m.gap - m.height) * 0.35}], axis});
            }
          }
          // (b) names and legend in the column; notes, state and key in two columns under the plan
          if (tail.length) {
            const mc = measureStack(ctx, [...nameItems, ...legendItems], pw, F);
            const bh2 = Math.min(D.h - mc.height - mc.gap, pw * 0.95, D.h * 0.42);
            const bw = D.w - pw - GAP;
            const tc = twoCols(tail, (bw - GAP) / 2, F);
            if (!mc.truncated && bh2 >= minB && tc) {
              out.push({kind: 'split', box: {x: 0, y: 0, w: bw, h: D.h - tc.h - GAP}, bld: {x: D.w - pw + (pw - bwOf(bh2)) / 2, y: 0, w: bwOf(bh2), h: bh2},
                parts: [{m: mc, x: D.w - pw, y: bh2 + mc.gap + (D.h - bh2 - mc.gap - mc.height) * 0.35}, {m: tc.cols[0], x: 0, y: D.h - tc.h}, {m: tc.cols[1], x: (bw + GAP) / 2, y: D.h - tc.h}], axis: 'h'});
            }
          }
        }
        // (c) a wide panel: the building above two text columns
        if (shape === 'landscape') {
          for (const cf of [0.36, 0.42]) {
            const pw = D.w * cf;
            const tc = twoCols(all, (pw - GAP) / 2, F);
            if (!tc) continue;
            const bh = Math.min(D.h - tc.h - GAP, pw * 0.5, D.h * 0.4);
            if (bh < minB) continue;
            const bw = Math.min(pw, bh / 0.9);
            out.push({kind: 'wide', box: {x: 0, y: 0, w: D.w - pw - GAP, h: D.h}, bld: {x: D.w - pw + (pw - bw) / 2, y: 0, w: bw, h: bh},
              parts: [{m: tc.cols[0], x: D.w - pw, y: bh + GAP}, {m: tc.cols[1], x: D.w - pw + (pw + GAP) / 2, y: bh + GAP}], axis: 'h'});
          }
        }
      }
      if (shape !== 'landscape') {
        // a band: the building with its names on the left, the texts in one or two columns on the right (top in
        // portrait, bottom in square)
        for (const bf of [0.28, 0.34]) {
          const bw = D.w * bf;
          const tw = D.w - bw - GAP;
          const mn = measureStack(ctx, nameItems, bw, F);
          if (mn.truncated) continue;
          const rest = [...legendItems, ...noteItems, ...tailItems];
          const one = measureStack(ctx, rest, tw, F);
          const two = twoCols(rest, (tw - GAP) / 2, F);
          for (const opt of [one.truncated ? null : {h: one.height, cols: [one]}, two]) {
            if (!opt) continue;
            const bh = Math.min(bw * 0.9, Math.max(minB, opt.h - (mn.height ? mn.height + mn.gap : 0)));
            const bandH = Math.max(bh + (mn.height ? mn.gap + mn.height : 0), opt.h);
            const top = shape === 'portrait';
            const y0 = top ? 0 : D.h - bandH;
            if (bandH > D.h * 0.5) continue;
            const cw = opt.cols.length === 1 ? tw : (tw - GAP) / 2;
            for (const axis of ['h', 'v']) {
              out.push({kind: `band${opt.cols.length}`, axis, box: {x: 0, y: top ? bandH + GAP : 0, w: D.w, h: D.h - bandH - GAP}, bld: {x: 0, y: y0, w: bw, h: bh},
                parts: [...(mn.height ? [{m: mn, x: 0, y: y0 + bh + mn.gap}] : []), ...opt.cols.map((m, j) => ({m, x: bw + GAP + j * (cw + GAP), y: y0 + (bandH - m.height) / 2}))]});
            }
          }
        }
      }
      return out;
    };

    /** Plan inside a box at text size F: geometry, scale and chips (null when a chip does not fit). */
    const plan = (box, axis, F) => fitPlan(ctx, seats, box, axis, F, {showKey, cols});

    const Fmin = 16.6 / px;
    let A = null;
    const LOG = [];
    for (let F = 22.5 / px; F >= Fmin - 1e-6; F -= 0.8 / px) {
      const Fe = showKey ? F : Fmin;
      for (const pick of arrangements(Fe)) {
        const pl = plan(pick.box, pick.axis, Fe);
        LOG.push(pl ? `${(Fe * px).toFixed(1)}:${pick.kind}${pick.axis}:k${pl.k.toFixed(2)}` : `${(Fe * px).toFixed(1)}:${pick.kind}${pick.axis}:null`);
        if (!pl) continue;
        const cand = {F: Fe, pick, ...pl};
        const score = c => c.k * (shape === 'portrait' && c.pick.axis === 'v' ? 1.25 : 1);
        if (!A || score(cand) > score(A) * 1.03) A = cand;
      }
      // the largest text size whose best plan keeps people >= 61 px (1080p)
      if (A && A.k * PERSON_RAD * 2 * px >= 61.5) break;
      if (!showKey) break;
    }
    const problems = [];
    if (!A) {
      problems.push('layout');
      const pick = {kind: 'column', axis: 'h', box: {x: 0, y: 0, w: D.w * 0.74, h: D.h}, bld: {x: D.w * 0.78, y: 0, w: D.w * 0.2, h: D.h * 0.3}, parts: []};
      A = {F: Fmin, pick, ...plan(pick.box, 'h', Fmin)};
    }
    const {F, pick, G, k, ox, oy, toD, chips} = A;
    const nums = new Map();
    seq.forEach((si, j) => { if (!nums.has(si)) nums.set(si, j + 1); });
    const lampR = clamp(F * 0.95 / k, 22, 36);
    const art = turnArt(ctx, G, {prefix: 'rm', seats, nums: showKey ? nums : null, lampR, numSize: F / k, tray: toTray});
    const people = seats.map((s, i) => turnPerson(ctx, `p${i}`, s.look));
    const hops = planHops(G, seats, seq, {a: PASS[0], b: PASS[1], toTray});
    const panel = pick.parts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden: it => it.name === 'state-tag' || /^note/.test(it.name)}));
    const building = buildingElevation(ctx, {name: 'bld', x: pick.bld.x, y: pick.bld.y, w: pick.bld.w, h: pick.bld.h, floors: 3, bays: 5, highlight: {floor: 1, bay: 3}});
    // note rings on their targets (template units, drawn in the plan)
    const lastSeat = seats[seq[seq.length - 1]], firstSeat = seats[seq[0]];
    const ringOf = tg => {
      if (tg === 'table') return {box: G.table};
      if (tg === 'signal') return {...(toTray ? {x: G.tray.x, y: G.tray.y} : restAt(G, lastSeat.slot)), rr: 46};
      const s = tg === 'firstLamp' ? firstSeat : lastSeat;
      return {...lampAt(G, s.slot), rr: lampR + 20};
    };
    const rings = notes.map((n, i) => {
      const q = ringOf(n.target);
      const col = noteColors[i % 2];
      if (q.box) return h('rect', {x: r(q.box.x - 12), y: r(q.box.y - 12), width: r(q.box.w + 24), height: r(q.box.h + 24), rx: 18, fill: 'none', stroke: col, 'stroke-width': 5});
      return h('circle', {cx: r(q.x), cy: r(q.y), r: r(q.rr), fill: 'none', stroke: col, 'stroke-width': 5});
    });
    return {F, px, G, k, ox, oy, toD, seats, seq, hops, art, people, chips: chips || [], panel, building, rings, toTray, arrangement: `${pick.kind}-${pick.axis}`, log: LOG, problems, noteCount: notes.length, hasState: panel.some(q => q.name === 'state-tag'), lampR, nums: showKey, numOf: nums};
  },
  build(ctx, L) {
    return g(null,
      L.building.node,
      g({name: 'plan', transform: T(L.ox, L.oy, 0, L.k)},
        L.art.room,
        L.art.lamps,
        L.art.chairs,
        g({name: 'token'}, tokenNode(ctx, {name: 'token-body', s: 42})),
        L.people.map(pp => pp.node),
        L.art.badges,
        g({name: 'notes', opacity: 0}, L.rings)),
      L.chips.map((c, i) => seatChipNode(ctx, c, {name: `lab${i}`, owner: `p${i}`})),
      L.panel.map(q => q.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const capU = lerp(PASS[0], PASS[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const st = turnAt(L.G, L.seats, L.seq, L.hops, ua);
    L.seats.forEach((s, i) => {
      Object.assign(nodes, seatedPose(L.people[i], seatPose(L.G, s.slot), st.hands[i]));
      Object.assign(nodes, lampFrame(`rm-lamp${i}`, st.lamps[i], L.nums && L.numOf.has(i)));
      if (L.chips[i]) nodes[`lab${i}`] = {opacity: 1};
    });
    nodes.token = {transform: T(st.token.x, st.token.y)};
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W_NOTES) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    if (L.hasState) nodes['state-tag'] = {opacity: r(done ? seg(u, W_NOTES[0] + 0.01, W_NOTES[1] + 0.01) : 0, 3)};
    for (let i = 0; i < L.noteCount && L.hasState; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const tokenD = L.toD(st.token);
    const semantic = {
      beat,
      token: R2(tokenD),
      holder: st.holder === null ? null : L.seats[st.holder].label,
      holderIndex: st.holder,
      lamps: st.lamps.map(v => r(v, 3)),
      lit: st.lamps.filter(v => v > 0.99).length,
      phase: st.phase,
      hop: st.hopIdx,
      hopsTotal: L.hops.length,
      allReached: st.reached,
      // cause before effect: a lamp is lit only for the person holding the token, or fading for the one whose hand
      // it has just left
      causeFirst: st.lamps.every((v, i) => v < 0.01 || i === st.holder || (st.hopIdx >= 0 && L.hops[st.hopIdx].from === i && v < 1 + 1e-9 && st.holder === null)),
      holdersSoFar: [L.seats[L.seq[0]].label, ...L.hops.filter(hp => ua >= hp.b && hp.to !== 'tray').map(hp => L.seats[hp.to].label)],
      tokenInTray: L.toTray && st.hopIdx === L.hops.length - 1 && ua >= L.hops[L.hops.length - 1].b,
      sequence: L.seq.map(i => L.seats[i].label),
      finalState: p.finalState,
      actionCapped: p.actionProgress < 1 && u > capU,
      textPx: r(L.F * L.px, 1),
      personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
      k: r(L.k, 3),
      arrangement: L.arrangement,
      chips: L.chips.length,
      problems: L.problems,
      log: L.log,
    };
    L.seats.forEach((s, i) => {
      semantic[`p${i}`] = R2(L.toD(seatPose(L.G, s.slot)));
      semantic[`seat${i}`] = R2(L.toD({x: L.G.seats[s.slot].x, y: L.G.seats[s.slot].y}));
    });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-06-story',
    title: 'Turn organisation — a turn signal passes by hand between participants at a hearing table',
    titleEs: 'Organización de turnos — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Organización de turnos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic building stands beside the plan of one of its hearing rooms. Participants sit along the two long sides of one table, each with a turn lamp in front of them and a party badge (● or ◆, equal weight) on the chair back. A small turn-signal token passes by hand along the supplied sequence: the holder pushes it across the table, the next person reaches out, catches it and draws it in; their lamp lights after it arrives (active turn) while the others stay unlit (pending turn: waiting only). The sequence is as configured (illustrative); no speaking order, time per turn or consequence is stated.',
    tags: ['hearing room', 'turns', 'turn signal', 'active turn', 'pending turn', 'sequence as configured', 'floor plan', 'top-down people', 'hand-off', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/organizacion-de-turnos.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
