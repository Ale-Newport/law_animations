/**
 * LAW-0239 — Adaptación de accesibilidad · contrast
 *
 * Storyboard (two complete, identical plans of the ground floor of the same generic building, side by side on wide and
 * square frames and one above the other on tall ones):
 *  0.00–0.17  base: both plans are the same — the pavement, the entrance with its landing and steps, the corridor
 *             with the tactile strip, the wall sign by the room door, the hearing room; the same participants wait
 *             on the pavement (the same places, the same arrival numbers).
 *  0.17–0.40  the one change, drawn at the same moment in both: a solid ring outlines each entrance with the
 *             scenario's marker (A ● "design with support", B ◆ "barrier detected", as supplied); in A a ramp with
 *             handrails appears beside the steps; in B the steps stay as they are — the supplied observation is only
 *             that ring and its caption. Then the scenario labels appear.
 *  0.40–0.77  the same arrival in parallel, with the same timing and pace: the participant with a long cane climbs
 *             the steps and follows the strip in both; the participant in a wheelchair rolls up the ramp in A and, in
 *             B, goes along the pavement to the level side entrance (the supplied route); everyone reaches the same
 *             places. Only the wheelchair user's way in differs.
 *  0.77–1.00  a guide in the highlight accent links the two entrances and names the changed fact; the shared facts,
 *             the neutral note and the key. "Barrier detected" is only a supplied observation in this configured
 *             example: no standard, measurement, obligation, compliance, violation or outcome is stated, neither
 *             scene is preferred, and nothing is drawn in red or crossed out.
 * @module animations/courts/LAW-0239
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  aaFields, AA_EN, AA_STRINGS, resolveAA, fitAA, AA_MIN_COMPACT, aaGeometry, routeFor, moverAt, minSeparation, yieldSchedule, SEP_MIN, SEP_PLAN, startPoint, aaProps, aaPlanArt, aaPerson, aaGlyph,
  placeChip, buildingElevation, planFrame, pxPerUnit, R2, overlaps, glue, fitWords, textAt, FONT,
  localizeAA, AA_ES,
} from './kits/adaptacion-accesibilidad.js';

const ID = 'LAW-0239';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {change: [0.19, 0.34], headers: [0.34, 0.39], move: [0.4, 0.76], guide: [0.77, 0.83], notes: [0.8, 0.86]};

const STRINGS = {
  en: {...AA_STRINGS.en, shared: 'Same in A and B', who: 'Participants'},
  es: {...AA_STRINGS.es, shared: 'Igual en A y B', who: 'Participantes'},
};

const scenario = letter => obj(`Scenario ${letter}`, {
  label: str('Scenario label (as supplied)', 60),
  caption: str('One-line description of the scenario (as supplied)', 90),
  entrance: oneOf('The main entrance in this scenario, as supplied: "ramp" = a ramp with handrails beside the steps; "steps-only" = the steps without a ramp. This is a supplied observation of the configured example, not an assessment', ['ramp', 'steps-only']),
  wheelchairEntrance: oneOf('The entrance the participant in a wheelchair uses in this scenario, as supplied (with "steps-only" the level side entrance is used)', ['main', 'side']),
}, ['label', 'entrance']);

const sceneSchema = {
  ...aaFields,
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {
    guide: str('Label on the guide linking the changed detail', 70),
    neutral: str('Neutral note (no winner, no outcome; must say that no conclusion is drawn)', 120),
  }),
};

const defaultParams = {
  ...AA_EN,
  scenarioA: {label: 'Design with support', caption: 'A ramp with handrails beside the steps (as supplied)', entrance: 'ramp', wheelchairEntrance: 'main'},
  scenarioB: {label: 'Barrier detected', caption: 'Steps without a ramp at the main entrance (as supplied)', entrance: 'steps-only', wheelchairEntrance: 'side'},
  changedFact: 'Changed fact: whether the main entrance has a ramp (as supplied)',
  sharedFacts: ['Same building, corridor and room', 'Same participants and places'],
  comparisonLabels: {guide: 'Only the main entrance differs', neutral: 'Both are shown as supplied · no winner, no outcome, no conclusion drawn'},
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
  "scenarioA": {
    "label": "Diseño con apoyo",
    "caption": "Rampa con pasamanos junto a los escalones (según lo aportado)",
    "entrance": "ramp",
    "wheelchairEntrance": "main"
  },
  "scenarioB": {
    "label": "Barrera detectada",
    "caption": "Escalones sin rampa en la entrada principal (según lo aportado)",
    "entrance": "steps-only",
    "wheelchairEntrance": "side"
  },
  "changedFact": "Hecho cambiado: si la entrada principal tiene rampa (según lo aportado)",
  "sharedFacts": [
    "Mismo edificio, pasillo y sala",
    "Mismos participantes y lugares"
  ],
  "comparisonLabels": {
    "guide": "Solo cambia la entrada principal",
    "neutral": "Ambos según lo aportado · sin ganador, sin resultado, sin conclusión"
  }
}};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arr = shape === 'portrait' ? 'column' : 'row';
    const colsList = shape === 'landscape' ? ['row'] : shape === 'square' ? ['band', 'row'] : ['grid'];
    const log = [];
    let best = null;
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const cols of colsList) {
        const L = compose(ctx, p, v / px, px, arr, cols);
        log.push(`${v}/${arr}/${cols}:k${L.k ? L.k.toFixed(2) : '-'}:${L.problems.join('+')}`);
        if (!L.scenes) continue;
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.personPx > pick.personPx + 0.5)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    if (!best || !best.scenes) best = compose(ctx, p, 16.6 / px, px, arr, colsList[0], true);
    best.log = log.slice(-24);
    return best;
  },
  build(ctx, L) {
    return g(null,
      L.scenes.map(S => g({name: `${S.key}-scene`},
        g({name: `${S.key}-plan`, transform: S.pf.transform}, S.art.node, S.people.map(pp => pp.node)),
        S.ringNode,
        S.badges.map(b => b.node))),
      L.headers.map(hd => hd.node),
      L.strip.node,
      L.guide && L.guide.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const ch = seg(u, ...W.change);
    const looks = {};
    const moveU = seg(u, ...W.move);
    L.scenes.forEach(S => {
      // the change: the ring draws, the marker shows; A's ramp (when supplied) grows in beside the steps
      const ringP = ease.inOutSine(clamp(ch / 0.7));
      nodes[`${S.key}-ring`] = {opacity: ringP > 0 ? 1 : 0};
      nodes[`${S.key}-ring-line`] = {'stroke-dashoffset': r(S.ringLen * (1 - ringP), 2)};
      nodes[`${S.key}-ring-mark`] = {opacity: r(clamp((ch - 0.55) / 0.3), 3)};
      const rampP = S.hasRamp ? ease.inOutCubic(clamp((ch - 0.3) / 0.7)) : 0;
      if (S.hasRamp) nodes[`${S.key}-ramp`] = {opacity: r(rampP, 3), transform: `translate(${r(S.rampPivot.x * (1 - rampP), 2)} 0) scale(${r(Math.max(0.001, rampP), 4)} 1)`};
      // the participants
      const pos = [], states = [];
      L.seats.forEach((s, i) => {
        const w = S.windows[i];
        // (with a yielding schedule, a participant may stand still for a moment to let the one ahead pass)
        const sq = S.schedule ? S.schedule.at(i, u) : null;
        const q = sq ? sq.q : clamp((u - w[0]) / (w[1] - w[0]));
        const st = moverAt(S.routes[i], q);
        if (sq) st.walk *= sq.speed;
        pos.push(st);
        states.push(q <= 0 ? 'waiting' : q >= 1 ? 'arrived' : 'moving');
        Object.assign(nodes, S.people[i].pose({...st, seated: q >= 1 && s.mode !== 'wheelchair' ? 1 : 0}));
      });
      const near = (c, R) => Math.max(0, ...pos.map((q, i) => (states[i] === 'moving' ? clamp((R - Math.hypot(q.x - c.x, q.y - c.y)) / 70) : 0)));
      const G = L.G;
      const mainK = near({x: G.ex, y: G.Hi + G.t / 2}, 190), sideK = near({x: G.side.x, y: G.Hi + G.t / 2}, 190), roomK = near({x: G.roomDoor.x, y: G.RH + G.t / 2}, 200);
      Object.assign(nodes, S.art.doors.main.frame(mainK), S.art.doors.side.frame(sideK), S.art.doors.room.frame(roomK));
      // arrival badges: at rest until each one sets off; at the hold once each one has arrived
      S.badges.forEach(b => {
        const w = S.windows[b.i];
        const v = b.hold ? seg(u, w[1], w[1] + 0.02) : 1 - seg(u, w[0], w[0] + 0.015);
        nodes[b.name] = {opacity: r(v, 3)};
      });
      looks[S.key] = {
        ring: r(ringP, 3), mark: r(clamp((ch - 0.55) / 0.3), 3), ramp: r(rampP, 3),
        people: pos.map(q => R2({x: q.x, y: q.y})), states, doors: [r(mainK, 3), r(sideK, 3), r(roomK, 3)],
        badges: S.badges.map(b => nodes[b.name].opacity),
      };
      looks[S.key].via = S.routes.map(rt => rt.via);
    });
    const hdr = seg(u, ...W.headers);
    L.headers.forEach((hd, i) => { nodes[`hdr${i}-label`] = {opacity: r(hdr, 3)}; });
    const guideP = seg(u, ...W.guide);
    if (L.guide) {
      nodes.guide = {opacity: guideP > 0 ? 1 : 0};
      L.guide.leads.forEach((ld, i) => { nodes[`guide-l${i}`] = {'stroke-dashoffset': r(ld.len * (1 - ease.inOutSine(guideP)), 2)}; });
      nodes['guide-card'] = {opacity: r(seg(u, W.guide[0] + 0.02, W.guide[1]), 3)};
    }
    if (L.hasNotes) nodes.notes = {opacity: r(seg(u, ...W.notes), 3)};
    const A = looks.A, B = looks.B;
    // (before the change beat A and B are the same, labels on or off)
    const lookOf = X => JSON.stringify({ring: X.ring, mark: X.mark, ramp: X.ramp, people: X.people, states: X.states, doors: X.doors, badges: X.badges});
    return {
      nodes,
      semantic: {
        beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
        lookA: lookOf(A),
        lookB: lookOf(B),
        viaA: A.via, viaB: B.via,
        statesA: A.states, statesB: B.states,
        rampA: A.ramp, rampB: B.ramp,
        ringA: A.ring, ringB: B.ring,
        startsA: L.scenes[0].windows.map(w => r(w[0], 4)), startsB: L.scenes[1].windows.map(w => r(w[0], 4)),
        endsA: L.scenes[0].windows.map(w => r(w[1], 4)), endsB: L.scenes[1].windows.map(w => r(w[1], 4)),
        header: r(hdr, 3),
        guide: r(guideP, 3),
        moving: r(moveU, 3),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        sceneShare: r(L.sceneShare, 3),
        separation: r(L.sep ?? 0, 1),
        k: r(L.k, 3),
        arrangement: `${L.arr}/${L.cols}`,
        log: L.log,
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, arr, cols, force = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const {seats, order} = resolveAA(ctx, p);
  const frameW = ctx.view.width / ((px * Math.min(ctx.view.width, ctx.view.height)) / 1080);
  const row = arr === 'row';
  const scen = [p.scenarioA, p.scenarioB];
  // ---- headers (badge + label + caption), the same height for A and B
  const gap = row ? 56 : 30;
  const panelW = row ? (D.w - gap) / 2 : D.w - 40;
  const badgeR = F * 0.9;
  const hdrFits = scen.map(sc => ({
    lab: showKey ? fitWords(glue(sc.label), {maxWidth: panelW - badgeR * 2 - 24, size: F * 1.1, minSize: F, maxLines: 2, weight: 700}) : null,
    capt: showAll && sc.caption ? fitWords(glue(sc.caption), {maxWidth: panelW - badgeR * 2 - 24, size: F, minSize: F, maxLines: 2, weight: 500}) : null,
  }));
  hdrFits.forEach(f => { if ((f.lab && f.lab.truncated) || (f.capt && f.capt.truncated)) problems.push('header-trunc'); });
  const headerH = Math.max(badgeR * 2 + 10, ...hdrFits.map(f => (f.lab ? f.lab.height + F * 0.25 : 0) + (f.capt ? f.capt.height : 0))) + F * 0.4;
  // ---- the shared strip under the scenes (cells in `cols` columns)
  const strip = stripPlan(ctx, p, F, D, cols, showKey, showAll, seats, order, row ? 0 : 40);
  const bandH = strip.band;
  if (strip.problem && !force) return {problems: [strip.problem], k: 0};
  if (strip.problem) problems.push(strip.problem);
  const stripH = strip.height;
  // ---- scene boxes
  const lane = showKey ? F * 0.7 : 10;
  const guideLane = showKey ? F * 1.1 : 0;
  let boxes;
  if (row) {
    const top = bandH + headerH + lane;
    const hAvail = D.h - top - stripH - guideLane - 14;
    boxes = [0, 1].map(i => ({x: i * (panelW + gap), y: top, w: panelW, h: hAvail}));
  } else {
    const hAvail = (D.h - stripH - guideLane - 14 - 2 * (headerH + lane) - gap) / 2;
    boxes = [0, 1].map(i => ({x: 40, y: headerH + lane + i * (hAvail + gap + headerH + lane), w: panelW, h: hAvail}));
  }
  if (boxes[0].h < 200) return {problems: ['no-room'], k: 0};
  // (when a wheelchair user takes the level side entrance while participants on foot still wait on the pavement right
  // of the steps — they arrive later — each waiting spot must stay clear of the side-entrance column: the plan widens,
  // and scales down, rather than crowding them)
  const wcRank = Math.min(...seats.filter(s => s.mode === 'wheelchair').map(s => s.rank));
  const waitingOnFoot = seats.filter(s => s.mode !== 'wheelchair' && s.rank > wcRank);
  const anySide = Number.isFinite(wcRank) && scen.some(sc => sc.entrance === 'steps-only' || sc.wheelchairEntrance === 'side');
  let minP = AA_MIN_COMPACT;
  const footHigh = waitingOnFoot.length > 0 && anySide;
  if (footHigh) {
    for (let Wm = AA_MIN_COMPACT.W; Wm <= 1400; Wm += 20) {
      const Gt = aaGeometry(Wm, AA_MIN_COMPACT.H, {compact: true});
      minP = {...AA_MIN_COMPACT, W: Wm};
      if (waitingOnFoot.every(s => Gt.side.x - startPoint(Gt, s, 'steps', {footHigh: true}).x >= SEP_MIN)) break;
    }
  }
  // (people floors: 60 px; the square contrast keeps >= 55 px in baseline, >= 45 px in the stress preset)
  const stress = seats.length > 2;
  const floor = ctx.view.shape === 'square' ? (stress ? 45.5 : 55.5) : 60.5;
  // (a short scene box: a slightly shallower plan — a shorter room and corridor, the same people — before the people
  // would drop under their floor)
  let fit = fitAA(boxes[0], minP);
  if (100 * fit.k * px < floor) { const f2 = fitAA(boxes[0], {...minP, H: 600}); if (f2.k > fit.k) fit = f2; }
  const {W: PW, H: PH, k} = fit;
  const personPx = 100 * k * px;
  if (personPx < floor) problems.push('small');
  const G = aaGeometry(PW, PH, {compact: true});
  const sceneShare = ((PW + 36) * k) / frameW;
  if (row ? sceneShare < 0.402 : sceneShare < 0.8) problems.push('narrow-scene');
  // ---- the two scenes
  const keys = ['A', 'B'];
  // one pace for both scenes: every participant starts at the same time in A and B (in the supplied order), the
  // longest way in either scene ends by u 0.76
  const viaOf = (sc, s) => (s.mode !== 'wheelchair' ? 'steps' : sc.entrance === 'steps-only' || sc.wheelchairEntrance === 'side' ? 'side' : 'ramp');
  const routesBy = scen.map(sc => seats.map(s => routeFor(G, s, viaOf(sc, s), {startVia: s.mode === 'wheelchair' ? 'ramp' : null, footHigh})));
  // (the spacing between starts is the same in A and B; it grows until, in both scenes, nobody walks through anybody)
  let windowsBy = null, sepBest = -1, pick = null;
  for (const gap of [0.05, 0.065, 0.08, 0.095, 0.11, 0.125, 0.14]) {
    const starts = seats.map(s => W.move[0] + s.rank * gap);
    if (Math.max(...starts) > W.move[1] - 0.12) break;
    const need = Math.max(...routesBy.flatMap(rs => rs.map((rt, i) => rt.poly.total / Math.max(0.05, W.move[1] - starts[i]))));
    const win = routesBy.map(rs => rs.map((rt, i) => [starts[i], starts[i] + rt.poly.total / need]));
    const sep = Math.min(...routesBy.map((rs, si) => minSeparation(rs, win[si], 900)));
    if (sep > sepBest) { sepBest = sep; windowsBy = win; pick = {starts, need}; }
    if (sep >= SEP_PLAN) break;
  }
  // (still too close: the later one waits where they are for the one ahead to pass — same starts and the same pace
  // in A and B; the pace rises a little when a wait would push an arrival past the end of the move beat)
  const byRank = seats.map((s, i) => i).sort((a, b) => seats[a].rank - seats[b].rank);
  let schedules = null;
  if (sepBest < SEP_PLAN) {
    let need = pick.need;
    for (let it = 0; it < 12; it++) {
      const win = routesBy.map(rs => rs.map((rt, i) => [pick.starts[i], pick.starts[i] + rt.poly.total / need]));
      // (who yields to whom: every priority order is tried per scene — at most 3! — and the clearest one is kept)
      const perms = a => (a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(r0 => [x, ...r0])));
      const sch = routesBy.map((rs, si) => perms(byRank).map(o => yieldSchedule(rs, win[si], o)).reduce((a, b) => (b.minSep > a.minSep + 1e-6 || (Math.abs(b.minSep - a.minSep) <= 1e-6 && Math.max(...b.ends) < Math.max(...a.ends)) ? b : a)));
      windowsBy = win; schedules = sch;
      sepBest = Math.min(...sch.map(q => q.minSep));
      if (Math.max(...sch.flatMap(q => q.ends)) <= W.move[1] + 1e-6) break;
      need *= 1.08;
    }
  }
  if (sepBest < SEP_MIN) problems.push('crowd');
  const scenes = keys.map((K, si) => {
    const pf = planFrame(G.extents, boxes[si], k);
    const sc = scen[si];
    const hasRamp = sc.entrance === 'ramp';
    const art = aaPlanArt(ctx, G, {prefix: `${K}rm`, ramp: hasRamp, rampName: `${K}-ramp`, wheelchairPlaces: seats.filter(s => s.mode === 'wheelchair').map(s => s.place)});
    const people = seats.map((s, i) => aaPerson(ctx, {name: `${K}-p${i}`, look: s.look, mode: s.mode}));
    // the change ring around the entrance (landing, steps and the ramp's place), with the scenario's marker
    const ent = {x: G.ramp.x - 12, y: G.Hi + G.t - 6, w: G.steps.x + G.steps.w + 22 - (G.ramp.x - 12), h: G.steps.y + G.steps.h + 14 - (G.Hi + G.t - 6)};
    const rr = pf.mapBox(ent);
    const ringLen = 2 * (rr.w + rr.h);
    const col = si === 0 ? th.accent2 : th.accent4;
    const mk = {x: rr.x + rr.w, y: rr.y};
    const ms = Math.max(12, F * 0.62);
    const marker = si === 0
      ? h('circle', {cx: r(mk.x), cy: r(mk.y), r: r(ms), fill: col, stroke: th.paper, 'stroke-width': 3})
      : h('path', {d: `M${r(mk.x)} ${r(mk.y - ms * 1.2)}L${r(mk.x + ms * 1.2)} ${r(mk.y)}L${r(mk.x)} ${r(mk.y + ms * 1.2)}L${r(mk.x - ms * 1.2)} ${r(mk.y)}Z`, fill: col, stroke: th.paper, 'stroke-width': 3});
    const ringNode = g({name: `${K}-ring`, opacity: 0},
      h('path', {name: `${K}-ring-line`, d: `M${r(rr.x + rr.w)} ${r(rr.y)}H${r(rr.x)}V${r(rr.y + rr.h)}H${r(rr.x + rr.w)}Z`, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(ringLen)} ${r(ringLen + 10)}`, 'stroke-dashoffset': r(ringLen)}),
      g({name: `${K}-ring-mark`, opacity: 0}, marker));
    return {key: K, pf, art, people, hasRamp, rampPivot: {x: G.ramp.x + G.ramp.w}, routes: routesBy[si], windows: windowsBy[si], schedule: schedules ? schedules[si] : null, ringNode, ringLen, ringBox: rr, box: boxes[si], badges: []};
  });
  // ---- arrival badges (numbers): the same places in both scenes (computed in A's frame, shifted to B)
  const A = scenes[0];
  const toD = A.pf.toD;
  const rad = 56 * k;
  const props = aaProps(G).map(b => ({...A.pf.mapBox(b), kind: b.kind}));
  // (a number may sit just outside the plan, inside its scene box)
  const bounds = {x: Math.min(A.pf.rect.x, A.box.x) + 4, y: Math.min(A.pf.rect.y, A.box.y) + 4, w: Math.max(A.pf.rect.x + A.pf.rect.w, A.box.x + A.box.w) - Math.min(A.pf.rect.x, A.box.x) - 8, h: Math.max(A.pf.rect.y + A.pf.rect.h, A.box.y + A.box.h) - Math.min(A.pf.rect.y, A.box.y) - 8};
  const badgeDefs = [];
  if (showKey && seats.length > 1) {
    const d = F * 1.7;
    for (const hold of [false, true]) {
      const pts = seats.map((s, i) => toD(A.routes[i].poly.at(hold ? 1 : 0)));
      const taken = [A.ringBox];
      seats.forEach((s, i) => {
        // (a number never rests on furniture, a head or a long cane — the cane reaches ahead of its user at rest, and sweeps
        // side to side as they set off while the number fades; it rests beside the chair at the hold)
        const chairs = ['left', 'mid', 'right'].filter(pl => !seats.some(q => q.mode === 'wheelchair' && q.place === pl)).map(pl => A.pf.mapBox({x: G.places[pl].x - 32, y: G.places[pl].y - 28, w: 64, h: 64}));
        const canes = seats.map((q, j) => (q.mode === 'cane' ? (hold ? {x: pts[j].x + 18 * k, y: pts[j].y - 74 * k, w: 52 * k, h: 72 * k} : {x: pts[j].x + 0 * k, y: pts[j].y - 140 * k, w: 70 * k, h: 102 * k}) : null)).filter(Boolean);
        const res = placeChip({w: d, h: d, anchor: {...pts[i], rad: rad * 1.05}, bounds, hard: [...props, ...chairs, ...canes, ...pts.filter((q, j) => j !== i).map(q => ({x: q.x - rad, y: q.y - rad, w: rad * 2, h: rad * 2})), ...taken], gaps: [2, 8, 16, 26, 40, 60], prefer: hold ? -90 : -45, leadHard: []}); // (a badge sits beside its participant: no leader line)
        if (!res) { problems.push(`badge${hold ? 'H' : ''}${i}`); return; }
        taken.push(res.box);
        badgeDefs.push({i, hold, box: res.box, n: s.rank + 1});
      });
    }
  }
  scenes.forEach(S => {
    const dx = S.box.x - A.box.x, dy = S.box.y - A.box.y;
    S.badges = badgeDefs.map(bd => {
      const c = {x: bd.box.x + bd.box.w / 2 + dx, y: bd.box.y + bd.box.h / 2 + dy};
      const name = `${S.key}-b${bd.hold ? 'h' : 'r'}${bd.i}`;
      return {i: bd.i, hold: bd.hold, name, node: g({name, opacity: 0, 'data-owner': `${S.key}-p${bd.i}`},
        h('circle', {name: `${name}-body`, cx: r(c.x), cy: r(c.y), r: r(bd.box.w / 2), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
        h('text', {name: `${name}-text`, x: r(c.x), y: r(c.y + F * 0.36), 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: th.ink}, String(bd.n)))};
    });
  });
  // ---- headers
  const headers = scenes.map((S, si) => {
    const f = hdrFits[si];
    const hx = S.box.x, hy = S.box.y - lane - headerH + F * 0.2;
    const col = si === 0 ? th.accent2 : th.accent4;
    const bx = hx + badgeR, by = hy + badgeR + 2;
    const mark = si === 0
      ? h('circle', {cx: r(bx), cy: r(by), r: r(badgeR), fill: col, stroke: th.ink, 'stroke-width': 2.5})
      : h('path', {d: `M${r(bx)} ${r(by - badgeR * 1.15)}L${r(bx + badgeR * 1.15)} ${r(by)}L${r(bx)} ${r(by + badgeR * 1.15)}L${r(bx - badgeR * 1.15)} ${r(by)}Z`, fill: col, stroke: th.ink, 'stroke-width': 2.5});
    const tx = hx + badgeR * 2 + 16;
    const parts = [];
    if (f.lab) parts.push(textAt(f.lab, tx, hy, th.fg, {weight: 700}));
    if (f.capt) parts.push(textAt(f.capt, tx, hy + (f.lab ? f.lab.height + F * 0.25 : 0), th.fgSoft));
    return {node: g({name: `hdr${si}`}, mark, g({name: `hdr${si}-label`, opacity: 0}, parts))};
  });
  // ---- the strip and the guide
  const stripTop = D.h - stripH;
  const st = strip.render(stripTop, scenes);
  let guide = null;
  if (showKey && st.chip) guide = guideFor(ctx, {scenes, chip: st.chip, row, laneY: stripTop - guideLane * 0.55});
  return {F, px, k, G, seats, order, scenes, headers, strip: st, guide, problems, personPx, sceneShare, arr, cols, hasNotes: showKey, sep: sepBest};
}

/**
 * The shared texts. Cells: 'facts' (a small building, the names, the shared facts), 'legend' (the participants —
 * glyph, arrival number, label — and the supports, in a two-column grid), 'guide' (the guide chip: its label and the
 * changed fact), 'notes' (the neutral note and the key). mode 'row' (wide): the four cells side by side under the
 * scenes; 'band' (square): the notes in a thin band above the scenes, the other three under them; 'grid' (tall): two
 * columns × two rows under the scenes.
 */
function stripPlan(ctx, p, F, D, mode, showKey, showAll, seats, order, x0) {
  const th = ctx.theme;
  const colGap = F * 1.1;
  const nCol = mode === 'row' ? 4 : mode === 'band' ? 3 : 2;
  const colW = (D.w - x0 - (nCol - 1) * colGap) / nCol;
  const glyph = F * 2.0;
  const fitT = (t, w, lines = 4, weight = 500) => fitWords(glue(t), {maxWidth: w, size: F, minSize: F, maxLines: lines, weight});
  const bldW = F * 2.6, bldH = F * 2.8;
  const cells = {};
  if (showKey || (showAll && p.sharedFacts.length)) {
    cells.facts = {
      names: showKey ? fitT(`${p.courts.building} · ${p.courts.room}`, colW - bldW - 10, 6, 600) : null,
      head: showAll && p.sharedFacts.length ? fitT(ctx.t.shared, colW, 1, 700) : null,
      items: showAll ? p.sharedFacts.map(f => fitT(f, colW - F * 1.1, 3)) : [],
      // (the arrival order is configured: its caption sits under the facts)
      seq: showKey && seats.length > 1 ? fitT(ctx.t.seq, colW, 3) : null,
    };
  }
  // the legend: participants then supports, in two columns when the cell is wide enough
  // (two columns when every entry fits them whole, else one)
  let legCols = 2, legW = 0, legItems = [];
  for (const lc of colW > F * 14 ? [2, 1] : [1]) {
    legCols = lc;
    legW = (colW - (lc - 1) * F * 0.8) / lc;
    legItems = [];
    if (showKey) order.forEach(s => legItems.push({kind: s.mode, look: s.look, who: true, fit: fitT(seats.length > 1 ? `${s.rank + 1} · ${s.label}` : s.label, legW - glyph - 10, 4, 600)}));
    if (showAll) for (const [kd, t] of [['ramp', p.labels.ramp], ['tactile', p.labels.tactile], ['sign', p.labels.sign]]) legItems.push({kind: kd, fit: fitT(t, legW - glyph - 10, 4)});
    if (!legItems.some(it => it.fit.truncated)) break;
  }
  if (legItems.length) cells.legend = {items: legItems};
  if (showKey) cells.guide = {lab: fitT(p.comparisonLabels.guide, colW - F * 1.4, 3, 700), fact: fitT(p.changedFact, colW - F * 1.4, 5)};
  const noteW = mode === 'band' ? D.w - x0 : colW;
  if (showKey) cells.notes = {neutral: fitT(p.comparisonLabels.neutral, noteW, mode === 'band' ? 2 : 5), key: fitT(p.labels.key, noteW, mode === 'band' ? 2 : 4)};
  let problem = null;
  const all = [];
  for (const c of Object.values(cells)) all.push(c.names, c.head, c.seq, c.lab, c.fact, c.neutral, c.key, ...(c.items || []).map(it => it.fit || it));
  for (const f of all) if (f && f.truncated) problem = `strip-trunc(${(f.full || '').slice(0, 30)})`;
  const hLeg = c => {
    let hh = 0;
    for (let i = 0; i < c.items.length; i += legCols) hh += Math.max(...c.items.slice(i, i + legCols).map(it => Math.max(glyph, it.fit.height))) + F * 0.3;
    return hh;
  };
  const hOf = (kind, c) => {
    if (kind === 'facts') return (c.names ? Math.max(bldH, c.names.height) + F * 0.4 : 0) + (c.head ? c.head.height + F * 0.25 : 0) + c.items.reduce((a, f) => a + f.height + F * 0.42, 0) + (c.seq ? c.seq.height + F * 0.2 : 0);
    if (kind === 'legend') return hLeg(c) + (c.seq ? c.seq.height + F * 0.2 : 0);
    if (kind === 'guide') return c.lab.height + c.fact.height + F * 1.4 + (c.seq ? c.seq.height + F * 0.2 : 0);
    return c.neutral.height + F * 0.4 + c.key.height + F * 0.5 + (c.seq && mode !== 'band' ? c.seq.height + F * 0.45 : 0);
  };
  // placement: row: facts, legend | guide | notes → guide in a middle column; band: facts, guide, legend (+ notes band)
  const slotsBy = {
    row: [['facts', 0, 0], ['guide', 1, 0], ['legend', 2, 0], ['notes', 3, 0]],
    band: [['facts', 0, 0], ['guide', 1, 0], ['legend', 2, 0]],
    grid: [['guide', 0, 0], ['facts', 1, 0], ['legend', 0, 1], ['notes', 1, 1]],
  }[mode];
  // (the sequence caption goes where it costs no height: under the facts, else under the legend, else with the notes;
  // when none has room it still goes under the facts)
  if (cells.facts && cells.facts.seq) {
    const seqFit = cells.facts.seq;
    cells.facts.seq = null;
    const rowOf = k => (slotsBy.find(([kk]) => kk === k) || [])[2];
    const rowMax = rw => Math.max(0, ...slotsBy.filter(([k, , r0]) => cells[k] && r0 === rw).map(([k]) => hOf(k, cells[k])));
    // (where it adds the least height to the strip: under the facts, the legend, the notes or the guide card — or, on a
    // band, on the key's line when both fit there)
    const one = cells.notes && mode === 'band' ? fitT(ctx.t.seq, noteW, 1) : null;
    const keyOne = cells.notes && cells.notes.key.lines.length === 1;
    const opts = [];
    const extra = (k, fitH, gap) => Math.max(0, hOf(k, cells[k]) + fitH + gap - rowMax(rowOf(k)));
    if (one && !one.truncated && keyOne && cells.notes.key.width + F * 1.5 + one.width <= noteW) opts.push({cost: 0, put: () => { cells.notes.seq = one; }});
    if (cells.facts) opts.push({cost: extra('facts', seqFit.height, F * 0.2), put: () => { cells.facts.seq = seqFit; }});
    if (cells.legend) { const f = fitT(ctx.t.seq, legW * legCols, 3); opts.push({cost: extra('legend', f.height, F * 0.2), put: () => { cells.legend.seq = f; }}); }
    if (cells.notes && mode !== 'band') { const f = fitT(ctx.t.seq, noteW, 3); opts.push({cost: extra('notes', f.height, F * 0.45), put: () => { cells.notes.seq = f; }}); }
    if (cells.guide) opts.push({cost: extra('guide', seqFit.height, F * 0.2), put: () => { cells.guide.seq = seqFit; }});
    opts.reduce((a, b) => (b.cost < a.cost - 0.5 ? b : a)).put();
  }
  const used = slotsBy.filter(([k]) => cells[k]);
  const rowsN = Math.max(1, ...used.map(([, , rw]) => rw + 1));
  const rowH = Array.from({length: rowsN}, (_, rw) => Math.max(0, ...used.filter(([, , r0]) => r0 === rw).map(([k]) => hOf(k, cells[k]))));
  const height = used.length ? rowH.reduce((a, v) => a + v, 0) + (rowsN - 1) * F * 0.6 + 6 : 0;
  const band = mode === 'band' && cells.notes ? hOf('notes', cells.notes) + 8 : 0;
  return {
    height, band, problem,
    render(top, scenes) {
      const parts = [];
      let chip = null;
      const rowY = rw => top + rowH.slice(0, rw).reduce((a, v) => a + v + F * 0.6, 0);
      for (const [kind, col, rw] of used) {
        const c = cells[kind];
        const x = x0 + col * (colW + colGap), y = rowY(rw);
        if (kind === 'facts') {
          let yy = y;
          if (c.names) {
            const bld = buildingElevation(ctx, {name: 'bld', x, y: yy, w: bldW, h: bldH, floors: 3, bays: 3, highlight: {floor: 0, bay: 1}, tree: false});
            parts.push(bld.node, g({name: 'names'}, textAt(c.names, x + bldW + 10, yy + Math.max(0, (bldH - c.names.height) / 2), th.fg, {weight: 600})));
            yy += Math.max(bldH, c.names.height) + F * 0.4;
          }
          if (c.head) { parts.push(g({name: 'shared-head'}, textAt(c.head, x, yy, th.fg, {weight: 700}))); yy += c.head.height + F * 0.25; }
          c.items.forEach((f, i) => {
            parts.push(g({name: `fact${i}`}, h('circle', {cx: r(x + F * 0.3), cy: r(yy + F * 0.55), r: r(F * 0.18), fill: th.fgSoft}), textAt(f, x + F * 0.9, yy, th.fg)));
            yy += f.height + F * 0.42;
          });
          if (c.seq) parts.push(g({name: 'seq-caption'}, textAt(c.seq, x, yy + F * 0.2, th.fgSoft, {italic: true})));
        } else if (kind === 'legend') {
          let yy = y;
          for (let i = 0; i < c.items.length; i += legCols) {
            const rowItems = c.items.slice(i, i + legCols);
            const hh = Math.max(...rowItems.map(it => Math.max(glyph, it.fit.height)));
            rowItems.forEach((it, j) => {
              const xx = x + j * (legW + F * 0.8);
              const gl = aaGlyph(ctx, it.kind, glyph, it.look);
              parts.push(g({name: it.who ? `who${i + j}` : `legend-${it.kind}`}, g({transform: T(xx + glyph / 2, yy + hh / 2)}, gl), textAt(it.fit, xx + glyph + 10, yy + (hh - it.fit.height) / 2, th.fg, {weight: it.who ? 600 : 500})));
            });
            yy += hh + F * 0.3;
          }
          if (c.seq) parts.push(g({name: 'seq-caption'}, textAt(c.seq, x, yy + F * 0.2, th.fgSoft, {italic: true})));
        } else if (kind === 'guide') {
          const w = Math.max(c.lab.width, c.fact.width) + F * 1.4, hh = c.lab.height + c.fact.height + F * 1.1;
          chip = {x: x + (colW - w) / 2, y, w, h: hh};
          if (c.seq) parts.push(g({name: 'seq-caption'}, textAt(c.seq, x, y + c.lab.height + c.fact.height + F * 1.4 + F * 0.2, th.fgSoft, {italic: true})));
          parts.push(g({name: 'guide-card', opacity: 0},
            h('path', {d: roundRectPath(chip.x, chip.y, chip.w, chip.h, 10), fill: th.card, stroke: th.accent3, 'stroke-width': 3}),
            textAt(c.lab, chip.x + chip.w / 2, chip.y + F * 0.4, th.ink, {anchor: 'middle', weight: 700}),
            textAt(c.fact, chip.x + chip.w / 2, chip.y + F * 0.4 + c.lab.height + F * 0.3, th.inkSoft, {anchor: 'middle'})));
        } else {
          let yy = y;
          const notes = [textAt(c.neutral, x, yy, th.fg)];
          yy += c.neutral.height + F * 0.4;
          notes.push(h('path', {d: `M${r(x)} ${r(yy)}H${r(x + Math.min(colW, c.key.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(c.key, x, yy + F * 0.4, th.fgSoft, {italic: true}));
          parts.push(g({name: 'notes', opacity: 0}, notes));
          if (c.seq) parts.push(g({name: 'seq-caption'}, textAt(c.seq, x, yy + F * 0.4 + c.key.height + F * 0.45, th.fgSoft, {italic: true})));
        }
      }
      if (mode === 'band' && cells.notes) {
        const c = cells.notes;
        const notes = [textAt(c.neutral, x0, 0, th.fg)];
        const yy = c.neutral.height + F * 0.4;
        notes.push(h('path', {d: `M${r(x0)} ${r(yy)}H${r(x0 + Math.min(noteW, c.key.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(c.key, x0, yy + F * 0.4, th.fgSoft, {italic: true}));
        parts.push(g({name: 'notes', opacity: 0}, notes));
        if (c.seq) parts.push(g({name: 'seq-caption'}, textAt(c.seq, x0 + c.key.width + F * 1.5, yy + F * 0.4, th.fgSoft, {italic: true})));
      }
      void scenes;
      return {node: g({name: 'strip'}, parts), chip};
    },
  };
}

/** The comparison guide: one leader from the chip to each entrance ring, along its own channel (no retracing). */
function guideFor(ctx, {scenes, chip, row, laneY}) {
  const th = ctx.theme;
  const leads = [];
  const parts = [];
  scenes.forEach((S, i) => {
    const rb = S.ringBox;
    let pts;
    if (row) {
      // up from the chip's top to the lane under the scenes, across to the ring, up onto the ring's bottom edge
      const sx = chip.x + chip.w * (i === 0 ? 0.3 : 0.7);
      const tx = rb.x + rb.w * 0.5;
      pts = [{x: sx, y: chip.y}, {x: sx, y: laneY}, {x: tx, y: laneY}, {x: tx, y: rb.y + rb.h}];
    } else if (i === 1) {
      // B (the lower scene): straight up from the chip onto its ring's bottom edge
      const tx = Math.max(rb.x + 12, Math.min(rb.x + rb.w - 12, chip.x + chip.w * 0.5));
      pts = [{x: chip.x + chip.w * 0.5, y: chip.y}, {x: chip.x + chip.w * 0.5, y: laneY}, {x: tx, y: laneY}, {x: tx, y: rb.y + rb.h}];
    } else {
      // A (the upper scene): along the left margin, into its ring's left edge
      const mx = Math.max(8, S.box.x - 22);
      const ty = rb.y + rb.h * 0.5;
      pts = [{x: chip.x, y: chip.y + chip.h * 0.5}, {x: mx, y: chip.y + chip.h * 0.5}, {x: mx, y: ty}, {x: rb.x, y: ty}];
    }
    pts = pts.filter((q, j) => j === 0 || Math.hypot(q.x - pts[j - 1].x, q.y - pts[j - 1].y) > 0.5);
    const d = pts.map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
    let len = 0;
    for (let j = 1; j < pts.length; j++) len += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y);
    leads.push({pts, len});
    parts.push(h('path', {name: `guide-l${i}`, d, fill: 'none', stroke: th.accent3, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}));
  });
  return {node: g({name: 'guide', opacity: 0}, parts), leads};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-10-contrast',
    title: 'Accessibility adaptation — the same arrival with a ramp at the entrance or with a barrier observed there',
    titleEs: 'Adaptación de accesibilidad — Contraste entre dos situaciones',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Adaptación de accesibilidad',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical plans of the ground floor of the same generic building. The only changed fact, as supplied, is the main entrance: a solid ring with the scenario’s marker (● / ◆) outlines each entrance; in A a ramp with handrails appears beside the steps, in B the steps stay as they are (the supplied observation “barrier detected”). The same participants arrive at the same time and pace: the one with a long cane takes the steps and the tactile strip in both; the one in a wheelchair rolls up the ramp in A and uses the level side entrance in B. A guide links the two entrances; no standard, violation, winner or outcome is shown.',
    tags: ['contrast', 'floor plan', 'accessibility', 'ramp', 'steps', 'side entrance', 'tactile strip', 'wheelchair', 'long cane', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/adaptacion-accesibilidad.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/courts/kits/presentacion-de-prueba.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene: localizeAA(scene, defaultParams, defaultParamsEs),
});
