/**
 * LAW-0227 — Presentación de una prueba en sala · contrast
 *
 * Storyboard (two complete, identical plans of the same generic hearing room,
 * side by side on wide frames and one above the other on tall ones; the shared
 * screen hangs face-on on each room's front wall):
 *  0.00–0.17  base: both rooms are the same — the bench with the presiding
 *             seat, the tables with the seated participants, the lectern with
 *             its document camera, the idle screen, the fictional sheet on the
 *             presenter's table.
 *  0.17–0.40  the one change, drawn at the same moment in both: a solid ring
 *             outlines each room's shared screen with the scenario's marker
 *             (A ● "shown on the shared screen", B ◆ "not shown on the shared
 *             screen", as supplied); in the "shown" scenario the screen switches
 *             to a blank lit panel, in the other it stays in stand-by. Then the
 *             scenario labels appear.
 *  0.40–0.77  the same action in parallel, with the same timing: the presenter
 *             stands, carries the sheet to the lectern and lays it on the camera
 *             plate. Only where it is shown differs: in the "shown" scenario the
 *             lamp lights and an enlarged copy of the same sheet grows onto the
 *             screen and the others look at the screen; in the other the sheet
 *             stays on the lectern, whole and in full colour, the camera stays
 *             off and the others look at the lectern.
 *  0.77–1.00  a guide in the highlight accent links the two screens and names
 *             the changed fact; the shared facts, the neutral note and the key.
 * "Not shown" only means not shown on the shared screen in this configured
 * example: nothing says the document is admitted, excluded, weighed, objected
 * to or ruled on, and neither scenario is preferred.
 * @module animations/courts/LAW-0227
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {buildingElevation} from './kits/courts-art.js';
import {
  ppFields, PP_EN, PP_STRINGS, resolvePP, fitPP, ppGeometry, ppFurniture, presenterRoute, ppRoomArt, screenArt, lecternArt, sheetArt,
  beamArt, beamPath, copyAt, holdPose, headTurn, lookAngle, planPerson, textAt, planFrame, thin, carryAt, fromLocal, SCREEN,
  placeSeatLabels, seatLabelNode, bodyBox, gchip, glue, fitWords, pxPerUnit, overlaps, R2, PERSON_RAD,
} from './kits/presentacion-de-prueba.js';

const ID = 'LAW-0227';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  change: [0.19, 0.34], headers: [0.34, 0.39], pick: [0.41, 0.46], walk: [0.46, 0.58], place: [0.58, 0.63], lamp: [0.63, 0.645],
  grow: [0.645, 0.73], title: [0.73, 0.755], look: [0.64, 0.74], guide: [0.77, 0.83], notes: [0.8, 0.86],
};
const MIN_ROOM = {W: 860, H: 620};

const STRINGS = {
  en: {...PP_STRINGS.en, shared: 'Same in A and B'},
  es: {...PP_STRINGS.es, shared: 'Igual en A y B'},
};

const scenario = letter => obj(`Scenario ${letter}`, {
  label: str('Scenario label (as supplied)', 60),
  caption: str('One-line description of the scenario (as supplied)', 90),
  display: oneOf('Whether the document is shown on the shared screen in this scenario, as supplied. "not-shown" only means it is not shown on the screen in this configured example; it carries no legal meaning', ['shown', 'not-shown']),
}, ['label', 'display']);

const sceneSchema = {
  ...ppFields,
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
  ...PP_EN,
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'right2', label: 'Participant B'},
  ],
  routes: [{seat: 1}, {seat: 0}, {seat: 2}],
  scenarioA: {label: 'Document shown', caption: 'On the shared screen (as supplied)', display: 'shown'},
  scenarioB: {label: 'Document not shown', caption: 'Not on the shared screen (as supplied)', display: 'not-shown'},
  changedFact: 'Changed fact: whether the document is shown on the shared screen (as supplied)',
  sharedFacts: ['Same room, people and lectern', 'Same sheet, carried the same way'],
  comparisonLabels: {guide: 'Only the screen differs', neutral: 'Both are shown as supplied · no winner, no outcome, no conclusion drawn'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const log = [];
    let best = null;
    // (a wide room, or a narrow one with its tables one behind the other and a smaller screen)
    const variants = shape === 'square' ? ['narrowSide', 'narrow', 'wide'] : ['wide', 'narrow'];
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const vr of variants) {
        const L = compose(ctx, p, v / px, px, shape === 'portrait' ? 'column' : 'row', vr);
        log.push(`${v}/${vr}:k${L.k.toFixed(2)}:h${Math.round(L.dims.headerH)}/s${Math.round(L.dims.stripH)}/b${Math.round(L.dims.boxH)}:${L.problems.join('+')}`);
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.personPx > pick.personPx + 0.5)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    best.log = log;
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.scenes.map(S => g({name: `${S.key}-scene`},
        g({name: `${S.key}-plan`, transform: S.pf.transform},
          S.room.node,
          lecternArt(ctx, L.G, {name: `${S.key}-lectern`}),
          screenArt(ctx, L.G, {name: `${S.key}-screen`}),
          g({name: `${S.key}-doc`}, sheetArt(ctx, {name: `${S.key}-doc-sheet`})),
          S.people.map(pp => pp.node),
          beamArt(ctx, {name: `${S.key}-beam`}),
          g({name: `${S.key}-copy`, opacity: 0}, sheetArt(ctx, {name: `${S.key}-copy-sheet`, stroke: 1.2}))),
        S.titleNode && g({name: `${S.key}-title`, opacity: 0}, S.titleNode),
        S.ringNode,
        S.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `${S.key}-lab${i}`, size: L.F, owner: `${S.key}-p${i}`, seat: `${S.key}-rm-chair-${L.seats[i].slot}`})),
        S.standLabel && seatLabelNode(ctx, S.standLabel, {name: `${S.key}-labS`, size: L.F, owner: `${S.key}-p${L.pi}`, seat: `${S.key}-lectern`}),
      )),
      L.headers.map(hd => hd.node),
      L.strip.node,
      L.guide && L.guide.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const G = L.G;
    const change = ease.inOutSine(seg(u, ...W.change));
    const qPick = seg(u, ...W.pick), qWalk = seg(u, ...W.walk), qPlace = seg(u, ...W.place);
    const looks = {};
    for (const S of L.scenes) {
      const K = S.key;
      const shown = S.display === 'shown';
      // the change: a solid ring outlines the screen (both); the "shown" screen switches to a blank lit panel
      nodes[`${K}-ring`] = {opacity: r(change, 3)};
      nodes[`${K}-ring-line`] = {'stroke-dashoffset': r(S.ringLen * (1 - change), 2)};
      const ready = shown ? change : 0;
      // the presenter's carry (the same in both)
      let c = null;
      if (L.pi >= 0) {
        c = carryAt(G, L.seats[L.pi].slot, L.route, qPick, qWalk, qPlace);
        Object.assign(nodes, holdPose(S.people[L.pi], `${K}-p${L.pi}`, c.pres, c.local, c.hold));
        nodes[`${K}-p${L.pi}-head`] = {transform: 'rotate(0 0 -1)'};
        nodes[`${K}-doc`] = {transform: T(c.doc.x, c.doc.y, c.doc.deg || 0)};
      } else nodes[`${K}-doc`] = {transform: T(L.docRest.x, L.docRest.y, L.docRest.deg)};
      // only in the "shown" scenario: the lamp, the enlarged copy, the beam, the title
      const lamp = shown ? seg(u, ...W.lamp) : 0;
      nodes[`${K}-lectern-lamp`] = {opacity: r(lamp, 3)};
      const grow = shown ? seg(u, ...W.grow) : 0;
      const cp = copyAt(G, grow);
      nodes[`${K}-copy`] = {transform: T(cp.x, cp.y, 0, cp.scale), opacity: grow > 0 ? 1 : 0};
      nodes[`${K}-beam`] = {d: beamPath({...G.lectern.plateC, scale: 1}, cp), opacity: r(grow > 0 ? Math.min(1, grow / 0.08) * (grow >= 0.999 ? 0.75 : 1) : 0, 3)};
      nodes[`${K}-screen-lit`] = {opacity: r(ready, 3)};
      nodes[`${K}-screen-idle`] = {opacity: r(1 - clamp(ready * 1.6), 3)};
      const titleOp = shown ? seg(u, ...W.title) : 0;
      if (S.titleNode) nodes[`${K}-title`] = {opacity: r(titleOp, 3)};
      // the others look where the document is: the screen when it is shown, the lectern otherwise
      const target = shown ? G.screen.c : G.lectern.plateC;
      const turn = ease.inOutSine(seg(u, ...W.look));
      const heads = [];
      L.seats.forEach((s, i) => {
        if (i === L.pi) { heads.push(0); return; }
        const Sl = G.slots[s.slot];
        Object.assign(nodes, S.people[i].pose({x: Sl.x, y: Sl.y, deg: Sl.deg, phase: 0, walk: 0, seated: 1}));
        const a = lookAngle(Sl, target) * turn;
        Object.assign(nodes, headTurn(`${K}-p${i}`, a));
        heads.push(r(Math.max(-70, Math.min(70, a)), 1));
      });
      // labels
      S.labels.forEach((sl, i) => {
        if (!sl) return;
        const v = i === L.pi ? 1 - seg(u, W.pick[0], W.pick[0] + 0.02) : 1;
        nodes[`${K}-lab${i}`] = {opacity: r(v, 3)};
        nodes[`${K}-lab${i}-text`] = {opacity: r(v, 3)};
      });
      if (S.standLabel) {
        nodes[`${K}-labS`] = {opacity: r(seg(u, W.place[1], W.place[1] + 0.02), 3)};
        nodes[`${K}-labS-text`] = {opacity: r(seg(u, W.place[1] + 0.01, W.place[1] + 0.03), 3)};
      }
      Object.assign(nodes, S.room.door.frame(0));
      looks[K] = {
        // (plan coordinates, so the two scenes compare directly)
        people: L.seats.map((s, i) => R2(i === L.pi && c ? c.pres : G.slots[s.slot])),
        heads,
        doc: c ? c.holder : 'table',
        docAt: R2(c ? c.doc : L.docRest),
        ring: r(change, 3),
        screen: r(ready, 3),
        copy: r(grow, 3),
        lamp: r(lamp, 3),
        header: 0,
      };
    }
    const hdr = seg(u, ...W.headers);
    L.headers.forEach((hd, i) => { nodes[`hdr${i}-label`] = {opacity: r(hdr, 3)}; looks[L.scenes[i].key].header = r(hdr, 3); });
    const guideP = seg(u, ...W.guide);
    if (L.guide) {
      nodes.guide = {opacity: r(guideP > 0 ? 1 : 0, 3)};
      L.guide.leads.forEach((ld, i) => { nodes[`guide-l${i}`] = {'stroke-dashoffset': r(ld.len * (1 - ease.inOutSine(guideP)), 2)}; });
      nodes['guide-card'] = {opacity: r(seg(u, W.guide[0] + 0.02, W.guide[1]), 3)};
    }
    Object.assign(nodes, L.strip.frame(u));
    const A = looks[L.scenes[0].key], B = looks[L.scenes[1].key];
    return {
      nodes,
      semantic: {
        beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
        scenes: 2,
        lookA: A,
        lookB: B,
        displayA: L.scenes[0].display,
        displayB: L.scenes[1].display,
        change: r(change, 3),
        guide: r(guideP, 3),
        presenterA: A.people[L.pi] || null,
        presenterB: B.people[L.pi] || null,
        docA: R2(L.scenes[0].pf.toD(L.pi >= 0 ? carryAt(G, L.seats[L.pi].slot, L.route, qPick, qWalk, qPlace).doc : L.docRest)),
        copyA: r(A.copy, 3),
        copyB: r(B.copy, 3),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: L.arrangement,
        sceneShare: r(L.sceneShare, 3),
        log: L.log,
      },
    };
  },
};

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, arrangement, variant = 'wide') {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const {seats, presenter} = resolvePP(ctx, p);
  const pi = presenter ? seats.indexOf(presenter) : -1;
  const frameW = ctx.view.width / ((px * Math.min(ctx.view.width, ctx.view.height)) / 1080);
  // ---- headers (badge + label + caption), the same height for A and B
  const scen = [p.scenarioA, p.scenarioB];
  const row = arrangement === 'row';
  const gap = row ? 70 : 34;
  const panelW = row ? (D.w - gap) / 2 : D.w - 40;
  const badgeR = F * 0.9;
  const hdrFits = scen.map(sc => ({
    lab: showKey ? fitWords(glue(sc.label), {maxWidth: panelW - badgeR * 2 - 24, size: F * 1.1, minSize: F, maxLines: 2, weight: 700}) : null,
    capt: showAll && sc.caption ? fitWords(glue(sc.caption), {maxWidth: panelW - badgeR * 2 - 24, size: F, minSize: F, maxLines: 2, weight: 500}) : null,
  }));
  hdrFits.forEach(f => { if ((f.lab && f.lab.truncated) || (f.capt && f.capt.truncated)) problems.push('header-trunc'); });
  const tight = ctx.view.shape === 'square';
  const headerH = Math.max(badgeR * 2 + 10, ...hdrFits.map(f => (f.lab ? f.lab.height + F * 0.25 : 0) + (f.capt ? f.capt.height : 0))) + F * (tight ? 0.25 : 0.5);
  // ---- shared strip (under the scenes): building + names, shared facts, the guide chip, the neutral note + key
  const stripMode = arrangement === 'column' ? 'grid' : ctx.view.shape === 'square' ? 'row3' : 'row4';
  const strip = stripPlan(ctx, p, F, D, stripMode, showKey, showAll);
  if (strip.problem) problems.push(strip.problem);
  const stripH = strip.height;
  // ---- scene boxes
  const lane = showKey ? (tight ? 12 : F * 0.9) : 10;
  let boxes;
  if (row) {
    const top = strip.band + headerH + lane;
    const hAvail = D.h - top - stripH - (tight ? 10 : 18);
    boxes = [0, 1].map(i => ({x: i * (panelW + gap), y: top, w: panelW, h: hAvail}));
  } else {
    const hAvail = (D.h - stripH - 18 - 2 * (headerH + lane) - gap) / 2;
    boxes = [0, 1].map(i => ({x: 40, y: headerH + lane + i * (hAvail + gap + headerH + lane), w: panelW, h: hAvail}));
  }
  const narrow = variant !== 'wide';
  const screenW = narrow ? 320 : SCREEN.w;
  const fit = fitPP(boxes[0], variant === 'narrowSide' ? {W: 640, H: 600} : narrow ? {W: 640, H: 680} : MIN_ROOM);
  const {W: RW, H: RH, k} = fit;
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  // the title on the screen of the "shown" scenario
  // (a wide room shows the title inside the screen's title band; a narrow one in a card just under the screen)
  const titleBelow = narrow;
  const titleFit = showKey ? fitWords(glue(p.labels.document), {maxWidth: titleBelow ? Math.max(200 / px, screenW * k) : (screenW - 2 * SCREEN.bezel - 24) * k, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  if (titleFit && titleFit.truncated) problems.push('title');
  const G = ppGeometry(RW, RH, {titleBand: titleFit && !titleBelow ? Math.max(44, (titleFit.height + F * 0.6) / k + 8) : 14, screenW});
  if (G.pageH < (narrow ? 70 : 100)) problems.push('page');
  const route = pi >= 0 ? presenterRoute(G, seats[pi].slot) : null;
  const docRest = {x: G.slots.left1.x + 18, y: G.tables[0].cy - 4, deg: -8};
  // each scene's share of the FRAME width (side by side >= 0.40; stacked >= 0.80)
  const sceneShare = ((RW + 36) * k) / frameW;
  if (row ? sceneShare < 0.402 : sceneShare < 0.8) problems.push('narrow-scene');
  // ---- the two scenes
  const keys = ['A', 'B'];
  const scenes = keys.map((K, si) => {
    const pf = planFrame(G.extents, boxes[si], k);
    const toD = pf.toD;
    const room = ppRoomArt(ctx, G, {prefix: `${K}-rm`, chairs: seats.map(s => s.slot)});
    const people = seats.map((s, i) => planPerson(ctx, {name: `${K}-p${i}`, look: s.look}));
    // the change ring around the screen, with the scenario's marker (● / ◆, same size and stroke)
    const sb = pf.mapBox(G.screen);
    const pad = 9;
    const rr = {x: sb.x - pad, y: sb.y - pad, w: sb.w + 2 * pad, h: sb.h + 2 * pad};
    const ringLen = 2 * (rr.w + rr.h);
    const col = si === 0 ? th.accent2 : th.accent4;
    const mk = {x: rr.x + rr.w, y: rr.y};
    const ms = Math.max(13, 15 * k * 1.4);
    const marker = si === 0
      ? h('circle', {cx: r(mk.x), cy: r(mk.y), r: r(ms), fill: col, stroke: th.paper, 'stroke-width': 3})
      : h('path', {d: `M${r(mk.x)} ${r(mk.y - ms * 1.2)}L${r(mk.x + ms * 1.2)} ${r(mk.y)}L${r(mk.x)} ${r(mk.y + ms * 1.2)}L${r(mk.x - ms * 1.2)} ${r(mk.y)}Z`, fill: col, stroke: th.paper, 'stroke-width': 3});
    const ringNode = g({name: `${K}-ring`, opacity: 0},
      h('path', {name: `${K}-ring-line`, d: `M${r(rr.x + rr.w)} ${r(rr.y)}H${r(rr.x)}V${r(rr.y + rr.h)}H${r(rr.x + rr.w)}Z`, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(ringLen)} ${r(ringLen + 10)}`, 'stroke-dashoffset': r(ringLen)}),
      marker);
    let titleNode = null, titleBox = null;
    if (titleFit) {
      if (titleBelow) {
        const cw = titleFit.width + F * 1.2, chh = titleFit.height + F * 0.7;
        // (left-aligned under the screen, clear of the lectern beside it)
        titleBox = {x: rr.x, y: rr.y + rr.h + 8, w: cw, h: chh};
        titleNode = g(null,
          h('path', {d: roundRectPath(titleBox.x, titleBox.y, cw, chh, 8), fill: '#eef2f5', stroke: '#262c33', 'stroke-width': 2}),
          textAt(titleFit, titleBox.x + cw / 2, titleBox.y + F * 0.35, '#1f2328', {anchor: 'middle', weight: 700}));
      } else {
        const tb = pf.mapBox(G.titleBox);
        titleNode = textAt(titleFit, tb.x + tb.w / 2, tb.y + (tb.h - titleFit.height) / 2, '#1f2328', {anchor: 'middle', weight: 700});
      }
    }
    return {key: K, display: scen[si].display, pf, room, people, ringNode, ringLen, ringBox: rr, markerAt: mk, titleNode, titleBox, labels: seats.map(() => null), standLabel: null, box: boxes[si]};
  });
  // ---- labels: identical placement in both scenes (computed once in scene A's frame, shifted to B)
  const A = scenes[0];
  const toD = A.pf.toD;
  const rad = PERSON_RAD * k;
  const furnAll = ppFurniture(G);
  const occupied = new Set(seats.map(s => s.slot));
  const furn = furnAll.filter(f => f.kind !== 'chair' || !occupied.has(f.slot)).map(A.pf.mapBox);
  const hard = furnAll.filter(f => ['desk', 'table', 'lectern', 'screen', 'plant'].includes(f.kind)).map(A.pf.mapBox);
  const never = furnAll.filter(f => f.kind === 'screen' || f.kind === 'lectern').map(A.pf.mapBox);
  const everyone = seats.map(s => bodyBox(toD(G.slots[s.slot]), G.slots[s.slot].deg, rad));
  const standBody = bodyBox(toD(G.lectern.stand), 0, rad);
  const shownBox = A.pf.mapBox({x: G.shown.x - G.pageW / 2, y: G.shown.y - G.pageH / 2, w: G.pageW, h: G.pageH});
  const beamLines = [0, 0.5, 1].map(f => [toD(G.lectern.plateC), {x: shownBox.x + shownBox.w * f, y: shownBox.y + shownBox.h}]);
  const walkLine = route ? thin(route.pts).map(toD) : [];
  const roomBox = A.pf.mapBox({x: 6, y: 6, w: G.W - 12, h: G.H - 12});
  // (only the chairs someone uses are drawn: the owner check compares with those)
  const seatPoints = seats.map(s => toD(G.slots[s.slot]));
  const extra = [A.ringBox, ...(A.titleBox ? [A.titleBox] : [])];
  const common = {size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 40 / px, pathPad: rad * 0.45, seatPoints, hard, hardAlways: never};
  const labels = seats.map(() => null);
  let standLabel = null;
  if (showKey) {
    const idx = seats.map((s, i) => i).filter(i => i !== pi);
    const avoid = [walkLine, ...beamLines];
    const res = placeSeatLabels(ctx, {...common, items: idx.map(i => ({key: `s${i}`, text: seats[i].label, at: toD(G.slots[seats[i].slot]), rad, avoidPaths: avoid})), people: [...everyone, standBody], furniture: furn, bounds: roomBox, extra});
    res.labels.forEach((lb, j) => { labels[idx[j]] = lb; extra.push(lb.box); });
    problems.push(...res.fails.map(f => `lab-${f}`));
    if (pi >= 0) {
      const r1 = placeSeatLabels(ctx, {...common, items: [{key: 'pres', text: seats[pi].label, at: toD(G.slots[seats[pi].slot]), rad}], people: everyone, furniture: furn, bounds: roomBox, extra});
      labels[pi] = r1.labels[0];
      if (r1.fails.length) problems.push('lab-pres');
      const r3 = placeSeatLabels(ctx, {...common, items: [{key: 'stand', text: seats[pi].label, at: toD(G.lectern.stand), rad, avoidPaths: beamLines}], people: [...everyone.filter((q, i) => i !== pi), standBody], furniture: furn, bounds: roomBox, extra});
      standLabel = r3.labels[0];
      if (r3.fails.length) problems.push('lab-stand');
    }
  }
  const shift = (lb, dx, dy) => (lb ? {...lb, box: {...lb.box, x: lb.box.x + dx, y: lb.box.y + dy}, from: {x: lb.from.x + dx, y: lb.from.y + dy}, to: {x: lb.to.x + dx, y: lb.to.y + dy}} : null);
  scenes.forEach(S => {
    const dx = S.box.x - A.box.x, dy = S.box.y - A.box.y;
    S.labels = labels.map(lb => shift(lb, dx, dy));
    S.standLabel = shift(standLabel, dx, dy);
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
  // ---- strip nodes and the guide
  const stripTop = D.h - stripH;
  const st = strip.render(stripTop, scenes);
  let guide = null;
  if (showKey && st.chip) guide = guideFor(ctx, {scenes, chip: st.chip, arrangement, D, lane, F});
  return {
    F, px, k, G, seats, pi, route, docRest, scenes, headers, strip: st, guide, problems, personPx, arrangement, sceneShare, dims: {headerH, stripH, boxH: boxes[0].h},
  };
}

/**
 * The shared texts. 'row4' (wide frames): one strip under the scenes with four columns (building + names, shared
 * facts, the guide chip, the neutral note + key). 'row3' (square): the neutral note and key in a thin band above
 * the scenes, three columns under them. 'grid' (tall): a 2 × 2 grid under the scenes.
 */
function stripPlan(ctx, p, F, D, mode, showKey, showAll) {
  const th = ctx.theme;
  const cols = mode === 'row4' ? 4 : mode === 'row3' ? 3 : 2;
  // (grid: indented, so the guide's leaders run up a clear lane at the left edge)
  const x0 = mode === 'grid' ? 40 : 0;
  const colW = (D.w - x0 - (cols - 1) * 26) / cols;
  const bldW = F * 4, bldH = F * 4.2;
  const names = showKey ? fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: colW - bldW - 12, size: F, minSize: F, maxLines: 5, weight: 600}) : null;
  const facts = showAll ? p.sharedFacts.map(f => fitWords(glue(f), {maxWidth: colW - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 500})) : [];
  const head = showAll && facts.length ? fitWords(ctx.t.shared, {maxWidth: colW, size: F, minSize: F, maxLines: 1, weight: 700}) : null;
  const guideFit = showKey ? fitWords(glue(p.comparisonLabels.guide), {maxWidth: colW - F * 1.4, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  const changedFit = showKey ? fitWords(glue(p.changedFact), {maxWidth: colW - F * 1.4, size: F, minSize: F, maxLines: 5, weight: 500}) : null;
  const noteW = mode === 'row3' ? D.w : colW;
  const neutral = showKey ? fitWords(glue(p.comparisonLabels.neutral), {maxWidth: noteW, size: F, minSize: F, maxLines: mode === 'row3' ? 2 : 5, weight: 500}) : null;
  const key = showKey ? fitWords(glue(p.labels.key), {maxWidth: noteW, size: F, minSize: F, maxLines: mode === 'row3' ? 2 : 4, weight: 500}) : null;
  let problem = null;
  for (const f of [names, head, guideFit, changedFit, neutral, key, ...facts]) if (f && f.truncated) problem = 'strip-trunc';
  const hBld = Math.max(bldH, names ? names.height : 0);
  const hFacts = (head ? head.height + F * 0.3 : 0) + facts.reduce((a, f) => a + f.height + F * 0.25, 0);
  const hChip = guideFit ? guideFit.height + changedFit.height + F * 1.4 : 0;
  const hNote = (neutral ? neutral.height + F * 0.4 : 0) + (key ? key.height + F * 0.5 : 0);
  const band = mode === 'row3' ? hNote + 8 : 0;
  const height = mode === 'row4' ? Math.max(hBld, hFacts, hChip, hNote) + 6 : mode === 'row3' ? Math.max(hBld, hFacts, hChip) + 6 : Math.max(hBld, hFacts) + Math.max(hChip, hNote) + 26 + 6;
  return {
    height, band, problem,
    render(top, scenes) {
      const parts = [];
      const colX = i => x0 + (mode === 'grid' ? (i % 2) * (colW + 26) : i * (colW + 26));
      const rowY = i => (mode === 'grid' ? top + (i >= 2 ? Math.max(hBld, hFacts) + 26 : 0) : top);
      // building + names
      const bld = buildingElevation(ctx, {name: 'bld', x: colX(0), y: rowY(0), w: bldW, h: bldH, floors: 3, bays: 4, highlight: {floor: 1, bay: 2}, tree: false});
      parts.push(bld.node);
      if (names) parts.push(textAt(names, colX(0) + bldW + 12, rowY(0) + Math.max(0, (bldH - names.height) / 2), th.fg, {weight: 600}));
      // shared facts
      let y = rowY(1);
      if (head) { parts.push(g({name: 'shared-head'}, textAt(head, colX(1), y, th.fg, {weight: 700}))); y += head.height + F * 0.3; }
      facts.forEach((f, i) => {
        parts.push(g({name: `fact${i}`}, h('circle', {cx: r(colX(1) + F * 0.35), cy: r(y + F * 0.55), r: r(F * 0.2), fill: th.fgSoft}), textAt(f, colX(1) + F * 1.0, y, th.fg)));
        y += f.height + F * 0.25;
      });
      // the guide chip, placed where the guide's leaders can reach both scenes
      let chip = null;
      if (guideFit) {
        const w = Math.max(guideFit.width, changedFit.width) + F * 1.4, hh = guideFit.height + changedFit.height + F * 1.1;
        let x;
        if (mode !== 'grid') {
          const mid = (scenes[0].box.x + scenes[0].box.w + scenes[1].box.x) / 2;
          x = Math.max(colX(2), Math.min(mid - w / 2, colX(2) + colW - w));
        } else x = colX(0);
        chip = {x, y: rowY(2), w, h: hh};
        parts.push(g({name: 'guide-card', opacity: 0},
          h('path', {d: roundRectPath(chip.x, chip.y, chip.w, chip.h, 10), fill: th.card, stroke: th.accent3, 'stroke-width': 3}),
          textAt(guideFit, chip.x + chip.w / 2, chip.y + F * 0.4, th.ink, {anchor: 'middle', weight: 700}),
          textAt(changedFit, chip.x + chip.w / 2, chip.y + F * 0.4 + guideFit.height + F * 0.3, th.inkSoft, {anchor: 'middle'})));
      }
      // neutral note + key (in the strip, or in the band above the scenes)
      const nx = mode === 'row3' ? 0 : mode === 'grid' ? colX(1) : colX(3);
      y = mode === 'row3' ? 0 : rowY(3);
      const notes = [];
      if (neutral) { notes.push(textAt(neutral, nx, y, th.fg)); y += neutral.height + F * 0.4; }
      if (key) notes.push(h('path', {d: `M${r(nx)} ${r(y)}H${r(nx + Math.min(noteW, key.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(key, nx, y + F * 0.4, th.fgSoft, {italic: true}));
      parts.push(g({name: 'notes', opacity: 0}, notes));
      return {
        node: g({name: 'strip'}, parts),
        chip,
        frame: u => ({notes: {opacity: r(seg(u, ...W.notes), 3)}}),
      };
    },
  };
}

/** The comparison guide: one leader from the chip to each screen's ring, routed outside the rooms. */
function guideFor(ctx, {scenes, chip, arrangement, D, lane}) {
  const th = ctx.theme;
  const leads = [];
  const parts = [];
  scenes.forEach((S, i) => {
    const rb = S.ringBox;
    let pts;
    if (arrangement === 'row') {
      // up through the gap between the scenes, along the lane above the rooms, down onto the ring's top edge
      const gx = (scenes[0].box.x + scenes[0].box.w + scenes[1].box.x) / 2;
      const ly = Math.min(scenes[0].pf.rect.y, scenes[1].pf.rect.y) - lane * 0.55;
      const tx = rb.x + rb.w * (i === 0 ? 0.62 : 0.38);
      pts = [{x: chip.x + chip.w / 2 + (i === 0 ? -8 : 8), y: chip.y}, {x: gx + (i === 0 ? -6 : 6), y: chip.y - 14}, {x: gx + (i === 0 ? -6 : 6), y: ly}, {x: tx, y: ly}, {x: tx, y: rb.y}];
      pts = [pts[0], {x: pts[0].x, y: pts[1].y}, pts[1], pts[2], pts[3], pts[4]];
    } else {
      // along the left margin, into the ring's left edge
      const mx = Math.max(8, S.pf.rect.x - 22);
      const ty = rb.y + rb.h * 0.5;
      pts = [{x: chip.x, y: chip.y + chip.h * (i === 0 ? 0.35 : 0.65)}, {x: mx + (i === 0 ? 0 : 8), y: chip.y + chip.h * (i === 0 ? 0.35 : 0.65)}, {x: mx + (i === 0 ? 0 : 8), y: ty}, {x: rb.x, y: ty}];
    }
    const d = pts.map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
    let len = 0;
    for (let j = 1; j < pts.length; j++) len += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y);
    leads.push({pts, len});
    parts.push(h('path', {name: `guide-l${i}`, d, fill: 'none', stroke: th.accent3, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(len)} ${r(len + 10)}`, 'stroke-dashoffset': r(len)}));
  });
  void D;
  return {node: g({name: 'guide', opacity: 0}, parts), leads};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-07-contrast',
    title: 'Presenting a document in the room — the same presentation with the document shown or not shown on the shared screen',
    titleEs: 'Presentación de una prueba en sala — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Presentación de una prueba en sala',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical plans of the same generic hearing room. The only changed fact, as supplied, is whether the document is shown on the shared screen: a solid ring with the scenario’s marker (● / ◆) outlines each screen, and in the “shown” scenario it switches to a lit panel. The presenter carries the same fictional sheet to the lectern in both, at the same time; in one the camera enlarges a copy onto the screen, in the other the sheet stays on the lectern, whole and in full colour. A guide links the two screens; no winner, admissibility, weight or outcome is shown.',
    tags: ['contrast', 'floor plan', 'hearing room', 'document', 'shared screen', 'document camera', 'shown', 'not shown', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/presentacion-de-prueba.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
