/**
 * LAW-0225 — Presentación de una prueba en sala · story
 *
 * Storyboard (a generic building beside the plan of one of its hearing rooms,
 * seen from above; the shared screen hangs face-on on the front wall):
 *  0.00–0.15  rest: the building (its room window highlighted, its name under
 *             it) and the plan — the bench on its platform with the presiding
 *             seat, two tables with the participants seated, the lectern with
 *             a document camera at the head of the centre aisle and the shared
 *             screen on the front wall, idle (dark, a stand-by glyph). A
 *             fictional sheet (lines and blocks only) lies on the presenter's
 *             table, its supplied title beside it. Every label is shown.
 *  0.15–0.42  the action starts: the presenter (the first table seat in the
 *             supplied order) stands, picks the sheet up with both hands and
 *             carries it along the back aisle and up the centre aisle to the
 *             lectern, then lays it on the camera plate; the camera lamp lights.
 *  0.42–0.73  the transformation: an enlarged copy of the SAME sheet rises from
 *             the plate inside a solid, translucent beam and grows to the
 *             screen, which lights as the copy lands; the supplied title
 *             appears on the screen once it is large enough to read. The other
 *             participants look towards the screen in the supplied order.
 *             (finalState "taken-down": the copy then shrinks back to the
 *             plate, the screen goes idle and the lamp goes off.)
 *  0.73–1.00  hold: the supplied final state, the keyed notes and the key
 *             "as supplied · no conclusion drawn". Nothing says the document
 *             is admitted, excluded, weighed, objected to or ruled on.
 * @module animations/courts/LAW-0225
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {buildingElevation} from './kits/courts-art.js';
import {
  ppFields, PP_EN, PP_STRINGS, resolvePP, fitPP, ppGeometry, ppFurniture, presenterRoute, docOnTable, ppRoomArt, screenArt, lecternArt,
  sheetArt, beamArt, beamPath, copyAt, holdPose, headTurn, lookAngle, planPerson, ppGlyph, textAt, planFrame, thin, SCREEN, DOC,
  placeSeatLabels, seatLabelNode, placeFree, bodyBox, gchip, glue, fitWords, pxPerUnit, R2, PERSON_RAD,
} from './kits/presentacion-de-prueba.js';

const ID = 'LAW-0225';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  pick: [0.15, 0.2], walk: [0.2, 0.34], place: [0.34, 0.4], lamp: [0.4, 0.42], grow: [0.42, 0.6], lit: [0.52, 0.6], title: [0.6, 0.63],
  look: [0.46, 0.64], down: [0.64, 0.74], notes: [0.76, 0.82],
};
const TARGETS = ['screen', 'lectern', 'document', 'presenter', 'everyone'];

const STRINGS = {
  en: {...PP_STRINGS.en, onScreen: 'The document is on the shared screen (as supplied)', takenDown: 'The document was shown, then taken off the screen (as supplied)'},
  es: {...PP_STRINGS.es, onScreen: 'El documento está en la pantalla común (según lo aportado)', takenDown: 'El documento se mostró y después se retiró de la pantalla (según lo aportado)'},
};

const sceneSchema = {
  ...ppFields,
  actorLabels: obj('Legend captions of the two roles in this scene (as supplied; the same person size for both)', {
    presenter: str('Caption for the participant who carries the document to the lectern', 70),
    others: str('Caption for the participants who look towards the shared screen', 70),
  }),
  objectLabels: obj('Legend captions of the objects', {
    screen: str('Caption for the shared screen', 60),
    beam: str('Caption for the enlarged copy rising from the document camera', 70),
  }),
  actionProgress: num('How far the action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a solid neutral ring drawn on its target', obj('Note', {
    target: oneOf('What the note refers to ("everyone" rings every participant alike)', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['on-screen', 'taken-down']),
};

const defaultParams = {
  ...PP_EN,
  actorLabels: {presenter: 'Carries the document to the lectern (as supplied)', others: 'Looks towards the shared screen (as supplied)'},
  objectLabels: {screen: 'Shared screen', beam: 'Enlarged copy of the same sheet'},
  actionProgress: 1,
  annotations: [{target: 'screen', text: 'The same sheet, enlarged on the shared screen'}],
  finalState: 'on-screen',
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const regions = [];
    if (!ctx.show('key')) regions.push(shape === 'portrait' ? {flow: 'band', f: 0.14} : {flow: 'column', f: shape === 'square' ? 0.2 : 0.14});
    if (shape === 'landscape') for (const f of [0.24, 0.28, 0.32]) regions.push({flow: 'column', f});
    if (shape === 'square') { for (const f of [0.26, 0.3, 0.34, 0.38]) regions.push({flow: 'column', f}); for (const f of [0.26, 0.32]) regions.push({flow: 'band', f}); }
    if (shape === 'portrait') for (const f of [0.2, 0.24, 0.28, 0.32]) regions.push({flow: 'band', f});
    const log = [];
    let best = null;
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const rg of regions) {
        const L = compose(ctx, p, v / px, px, rg);
        log.push(`${v}/${rg.flow}${rg.f}:k${L.k ? L.k.toFixed(2) : '-'}:${L.problems.join('+')}`);
        if (!L.node && !L.people) continue;
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
    const th = ctx.theme;
    return g(null,
      L.building.node,
      g({name: 'plan', transform: L.pf.transform},
        L.room.node,
        lecternArt(ctx, L.G, {name: 'lectern'}),
        screenArt(ctx, L.G, {name: 'screen'}),
        g({name: 'doc'}, sheetArt(ctx, {name: 'doc-sheet'})),
        L.people.map(pp => pp.node),
        beamArt(ctx, {name: 'beam'}),
        g({name: 'copy', opacity: 0}, sheetArt(ctx, {name: 'copy-sheet', stroke: 1.2}))),
      L.titleNode && g({name: 'scr-title', opacity: 0}, L.titleNode),
      g({name: 'notes', opacity: 0}, L.rings),
      L.chips.map(c => c.node),
      L.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: `rm-chair-${L.seats[i].slot}`})),
      L.standLabel && seatLabelNode(ctx, L.standLabel, {name: 'labS', size: L.F, owner: `p${L.pi}`, seat: 'lectern'}),
      L.docLabel && seatLabelNode(ctx, L.docLabel, {name: 'labD', size: L.F, owner: 'doc', seat: 'doc'}),
      L.docLabelHold && seatLabelNode(ctx, L.docLabelHold, {name: 'labDH', size: L.F, owner: 'doc', seat: 'doc'}),
      L.panelNodes,
      L.stateNode && g({name: 'state-tag', opacity: 0}, L.stateNode),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G;
    const nodes = {};
    const capU = lerp(BEATS.action[0], W.down[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const down = p.finalState === 'taken-down';
    const pi = L.pi;
    // ---- presenter: stand + pick up, walk, lay the sheet on the plate
    let pres = null, docW, docHolder, hold = 0, local = null;
    const table = L.docRest;
    if (pi >= 0) {
      const S = G.slots[L.seats[pi].slot];
      const qPick = seg(ua, ...W.pick), qWalk = seg(ua, ...W.walk), qPlace = seg(ua, ...W.place);
      const stand = G.lectern.stand;
      if (qWalk <= 0) {
        // at the chair: hands to the sheet on the table, then stand with it
        pres = {x: S.x, y: S.y, deg: 0, phase: 0, walk: 0, seated: 1 - ease.inOutCubic(clamp((qPick - 0.45) / 0.55))};
        const reach = ease.inOutSine(clamp(qPick / 0.45));
        const loc = toLocal(pres, table);
        const carry = {x: 0, y: -60};
        const lift = ease.inOutCubic(clamp((qPick - 0.45) / 0.55));
        local = {x: lerp(loc.x, carry.x, lift), y: lerp(loc.y, carry.y, lift)};
        hold = reach;
        docHolder = qPick >= 0.45 ? 'hands' : 'table';
      } else if (qPlace <= 0) {
        const w = walkState(L.route, qWalk);
        pres = {...w, seated: 0};
        local = {x: 0, y: -60};
        hold = 1;
        docHolder = 'hands';
      } else {
        pres = {x: stand.x, y: stand.y, deg: 0, phase: 0, walk: 0, seated: 0};
        const plateLoc = toLocal(pres, G.lectern.plateC);
        const lay = ease.inOutCubic(clamp(qPlace / 0.7));
        local = {x: lerp(0, plateLoc.x, lay), y: lerp(-60, plateLoc.y, lay)};
        hold = 1 - ease.inOutSine(clamp((qPlace - 0.7) / 0.3));
        docHolder = qPlace >= 0.7 ? 'plate' : 'hands';
      }
      Object.assign(nodes, holdPose(L.people[pi], `p${pi}`, pres, local, hold));
      nodes[`p${pi}-head`] = {transform: 'rotate(0 0 -1)'};
      if (docHolder === 'table') docW = {x: table.x, y: table.y, deg: table.deg};
      else if (docHolder === 'plate') docW = {x: G.lectern.plateC.x, y: G.lectern.plateC.y, deg: 0};
      else docW = {...fromLocal(pres, local), deg: pres.deg};
    } else {
      docW = {x: table.x, y: table.y, deg: table.deg};
      docHolder = 'table';
    }
    nodes.doc = {transform: T(docW.x, docW.y, docW.deg || 0)};
    // ---- the camera, the enlarged copy, the beam, the screen
    const lampOn = seg(ua, ...W.lamp) * (down ? 1 - seg(ua, W.down[1] - 0.02, W.down[1]) : 1);
    nodes['lectern-lamp'] = {opacity: r(lampOn, 3)};
    const grow = seg(ua, ...W.grow);
    const back = down ? seg(ua, W.down[0] + 0.02, W.down[1]) : 0;
    const q = grow * (1 - back);
    const c = copyAt(G, q);
    const copyVis = grow > 0 && back < 1 ? 1 : 0;
    nodes.copy = {transform: T(c.x, c.y, 0, c.scale), opacity: copyVis};
    const beamOp = copyVis ? Math.min(1, grow / 0.08) * (q >= 0.999 ? 0.75 : 1) * (1 - back) : 0;
    nodes.beam = {d: beamPath({...G.lectern.plateC, scale: 1}, c), opacity: r(beamOp, 3)};
    const lit = seg(ua, ...W.lit) * (1 - (down ? seg(ua, W.down[1] - 0.04, W.down[1]) : 0));
    nodes['screen-lit'] = {opacity: r(lit, 3)};
    nodes['screen-idle'] = {opacity: r(1 - clamp(lit * 1.6), 3)};
    // the title on the screen: only once the copy is full size (text never renders under the floor)
    const titleOp = seg(ua, ...W.title) * (down ? 1 - seg(ua, W.down[0], W.down[0] + 0.02) : 1);
    if (L.titleNode) nodes['scr-title'] = {opacity: r(titleOp, 3)};
    // ---- the others look towards the screen, in the supplied order
    const nLook = Math.max(1, L.lookers.length);
    const step = (W.look[1] - W.look[0] - 0.06) / Math.max(1, nLook - 1);
    const heads = [];
    L.seats.forEach((s, i) => {
      if (i === pi) { heads.push(0); return; }
      const S = G.slots[s.slot];
      Object.assign(nodes, L.people[i].pose({x: S.x, y: S.y, deg: S.deg, phase: 0, walk: 0, seated: 1}));
      let turn = 0;
      if (s.looks) {
        const t0 = W.look[0] + s.lookRank * (nLook > 1 ? step : 0);
        turn = ease.inOutSine(seg(ua, t0, t0 + 0.06)) * (down ? 1 - ease.inOutSine(seg(ua, W.down[1] - 0.04, W.down[1] + 0.02)) : 1);
      }
      const a = lookAngle(S, G.screen.c) * turn;
      Object.assign(nodes, headTurn(`p${i}`, a));
      heads.push(r(Math.max(-70, Math.min(70, a)), 1));
    });
    // ---- labels
    L.labels.forEach((sl, i) => {
      if (!sl) return;
      const v = i === pi ? 1 - seg(ua, W.pick[0], W.pick[0] + 0.02) : 1;
      nodes[`lab${i}`] = {opacity: r(v, 3)};
      nodes[`lab${i}-text`] = {opacity: r(v, 3)};
    });
    if (L.standLabel) {
      const body = seg(ua, W.place[1], W.place[1] + 0.02), text = seg(ua, W.place[1] + 0.01, W.place[1] + 0.03);
      nodes.labS = {opacity: r(body, 3)};
      nodes['labS-text'] = {opacity: r(text, 3)};
    }
    if (L.docLabel) {
      const v = 1 - seg(ua, W.pick[0] + 0.02, W.pick[0] + 0.04);
      nodes.labD = {opacity: r(v, 3)};
      nodes['labD-text'] = {opacity: r(v, 3)};
    }
    if (L.docLabelHold) {
      const v = seg(ua, W.down[1], W.down[1] + 0.03);
      nodes.labDH = {opacity: r(v, 3)};
      nodes['labDH-text'] = {opacity: r(v, 3)};
    }
    L.chips.forEach(ch => { nodes[ch.name] = {opacity: 1}; });
    Object.assign(nodes, L.room.door.frame(0));
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.notes) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    if (L.stateNode) nodes['state-tag'] = {opacity: r(done ? seg(u, W.notes[0] + 0.01, W.notes[1] + 0.01) : 0, 3)};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const presD = pres ? L.pf.toD(pres) : null;
    const docD = L.pf.toD(docW);
    // the rendered hands (midpoint of both hand discs), in design units
    let handsD = null;
    if (pres && hold > 0) {
      const hl = nodes[`p${pi}-armL-h`], hr = nodes[`p${pi}-armR-h`];
      handsD = L.pf.toD(fromLocal(pres, {x: (hl.cx + hr.cx) / 2, y: (hl.cy + hr.cy) / 2}));
    }
    const pts = {};
    L.seats.forEach((s, i) => { pts[`p${i}`] = R2(L.pf.toD(i === pi && pres ? pres : G.slots[s.slot])); pts[`seat${i}`] = R2(L.pf.toD(G.slots[s.slot])); });
    return {
      nodes,
      semantic: {
        ...pts,
        beat,
        presenter: pi >= 0 ? L.seats[pi].slot : null,
        presenterAt: R2(presD),
        doc: R2(docD),
        docHolder,
        hands: R2(handsD),
        standAt: R2(L.pf.toD(G.lectern.stand)),
        plateAt: R2(L.pf.toD(G.lectern.plateC)),
        screenAt: R2(L.pf.toD(G.shown)),
        holdAmount: r(hold, 3),
        lamp: r(lampOn, 3),
        copy: r(q, 3),
        copyAt: R2(L.pf.toD(c)),
        copyScale: r(c.scale * L.k * L.px, 2),
        screen: lit >= 0.99 ? 'lit' : lit <= 0.01 ? 'idle' : 'changing',
        titleShown: r(titleOp, 3),
        heads,
        lookOrder: L.lookers.map(s => s.slot),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        labelsPlaced: L.problems.length === 0,
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: `${L.flow}/${L.f}`,
        log: L.log,
      },
    };
  },
};

const toLocal = (s, q) => {
  const a = (-(s.deg || 0) * Math.PI) / 180;
  const dx = q.x - s.x, dy = q.y - s.y;
  return {x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a)};
};
const fromLocal = (s, q) => {
  const a = ((s.deg || 0) * Math.PI) / 180;
  return {x: s.x + q.x * Math.cos(a) - q.y * Math.sin(a), y: s.y + q.x * Math.sin(a) + q.y * Math.cos(a)};
};

/** Walk along the presenter's route: turn in place at both ends, heading along the path, a steady cadence. */
function walkState(route, q) {
  const poly = route.poly;
  const turnIn = 0.1, turnOut = 0.1;
  const qw = clamp((q - turnIn) / (1 - turnIn - turnOut));
  const s = ease.inOutSine(qw);
  const p = poly.at(s);
  const head = (poly.at(Math.min(0.999, Math.max(0.001, s))).a * 180) / Math.PI + 90;
  const first = (poly.at(0.001).a * 180) / Math.PI + 90, last = (poly.at(0.999).a * 180) / Math.PI + 90;
  let deg = head;
  if (q < turnIn) deg = lerpDeg(0, first, ease.inOutSine(q / turnIn));
  else if (q > 1 - turnOut) deg = lerpDeg(last, 0, ease.inOutSine((q - (1 - turnOut)) / turnOut));
  const moving = qw > 0 && qw < 1;
  return {x: p.x, y: p.y, deg, phase: ((s * poly.total) / 36) * Math.PI, walk: moving ? Math.min(1, qw / 0.06, (1 - qw) / 0.06) : 0};
}
const lerpDeg = (a, b, t) => { const d = ((((b - a) % 360) + 540) % 360) - 180; return a + d * t; };

/* ------------------------------------------------------------------ */
/* Composition                                                         */
/* ------------------------------------------------------------------ */

function compose(ctx, p, F, px, rg, force = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const {seats, presenter, lookers} = resolvePP(ctx, p);
  const pi = presenter ? seats.indexOf(presenter) : -1;
  // ---- panel
  const legendItems = showAll ? [
    {kind: 'presenter', text: p.actorLabels.presenter},
    {kind: 'person', text: p.actorLabels.others},
    {kind: 'screen', text: p.objectLabels.screen},
    {kind: 'beam', text: p.objectLabels.beam},
  ] : [];
  const notes = showAll ? p.annotations : [];
  const finalText = p.finalState === 'taken-down' ? ctx.t.takenDown : ctx.t.onScreen;
  const pan = panelFor(ctx, {flow: rg.flow, f: rg.f, F, legendItems, notes, finalText, showKey, p});
  if (!pan.ok && !force) return {problems: ['panel'], k: 0};
  const planBox = rg.flow === 'column' ? {x: 0, y: 0, w: D.w - pan.box.w - 28, h: D.h} : {x: 0, y: pan.box.h + 24, w: D.w, h: D.h - pan.box.h - 24};
  // ---- plan
  const {W: RW, H: RH, k} = fitPP(planBox);
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  // the plan is the subject: its room covers >= 0.55 of the FRAME width (the frame is wider than the design box)
  const frameW = ctx.view.width / ((px * Math.min(ctx.view.width, ctx.view.height)) / 1080);
  if ((RW + 2 * 18) * k < 0.552 * frameW) problems.push('narrow-plan');
  const titleW = (SCREEN.w - 2 * SCREEN.bezel - 24) * k;
  const titleFit = showKey ? fitWords(glue(p.labels.document), {maxWidth: titleW, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  if (titleFit && titleFit.truncated) problems.push('title');
  const titleBand = titleFit ? Math.max(44, (titleFit.height + F * 0.6) / k + 8) : 44;
  const G = ppGeometry(RW, RH, {titleBand});
  if (G.pageH < 110) problems.push('page');
  const pf = planFrame(G.extents, planBox, k);
  const toD = pf.toD;
  const rad = PERSON_RAD * k;
  const people = seats.map((s, i) => planPerson(ctx, {name: `p${i}`, look: s.look}));
  const route = pi >= 0 ? presenterRoute(G, seats[pi].slot) : null;
  const docRest = pi >= 0 ? docOnTable(G, seats[pi].slot) : docOnTable(G, 'left1');
  // ---- obstacles (design units)
  const furnAll = ppFurniture(G);
  const occupied = new Set(seats.map(s => s.slot));
  const furn = furnAll.filter(f => f.kind !== 'chair' || !occupied.has(f.slot)).map(pf.mapBox);
  const hard = furnAll.filter(f => ['desk', 'table', 'lectern', 'screen', 'plant'].includes(f.kind)).map(pf.mapBox);
  const everyone = seats.map(s => bodyBox(toD(G.slots[s.slot]), G.slots[s.slot].deg, rad));
  const standBody = bodyBox(toD(G.lectern.stand), 0, rad);
  const shownBox = pf.mapBox({x: G.shown.x - G.pageW / 2, y: G.shown.y - G.pageH / 2, w: G.pageW, h: G.pageH});
  const beamLines = [0, 0.5, 1].map(f => [toD(G.lectern.plateC), {x: shownBox.x + shownBox.w * f, y: shownBox.y + shownBox.h}]);
  const walkLine = route ? thin(route.pts).map(toD) : [];
  const roomBox = pf.mapBox({x: 6, y: 6, w: G.W - 12, h: G.H - 12});
  const seatPoints = Object.values(G.slots).map(toD);
  const extra = [];
  // the screen and the lectern are never covered by a label (at every fallback level)
  const never = furnAll.filter(f => f.kind === 'screen' || f.kind === 'lectern').map(pf.mapBox);
  const common = {size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 40 / px, pathPad: rad * 0.45, seatPoints, hard, hardAlways: never};
  const labels = seats.map(() => null);
  let standLabel = null, docLabel = null, docLabelHold = null;
  const chips = [];
  if (showKey) {
    // persistent labels: every seated participant (clear of the presenter's walk, the lectern spot and the beam)
    const idx = seats.map((s, i) => i).filter(i => i !== pi);
    const avoid = [walkLine, ...beamLines];
    const res = placeSeatLabels(ctx, {...common, items: idx.map(i => ({key: `s${i}`, text: seats[i].label, at: toD(G.slots[seats[i].slot]), rad, avoidPaths: avoid})),
      people: [...everyone, standBody], furniture: furn, bounds: roomBox, extra});
    res.labels.forEach((lb, j) => { labels[idx[j]] = lb; extra.push(lb.box); });
    problems.push(...res.fails.map(f => `lab-${f}`));
    // captions of the screen and the lectern
    for (const [key, text, anchor, target] of [['screen', p.labels.screen, toD({x: G.screen.x + G.screen.w * 0.25, y: G.screen.y + G.screen.h}), {x: 0, y: 0}], ['camera', p.labels.camera, toD({x: G.lectern.cx + G.lectern.w / 2, y: G.lectern.cy}), null]]) {
      const r0 = placeSeatLabels(ctx, {...common, maxGap: 70 / px, items: [{key, text, at: anchor, rad: 6, avoidPaths: [...avoid]}], people: [...everyone, standBody], furniture: furn, bounds: roomBox, extra});
      if (r0.fails.length) problems.push(`cap-${key}`);
      chips.push({name: `cap-${key}`, L: r0.labels[0]});
      extra.push(r0.labels[0].box);
      void target;
    }
    // rest only: the presenter at their chair and the sheet's title beside it
    if (pi >= 0) {
      const r1 = placeSeatLabels(ctx, {...common, items: [{key: 'presenter', text: seats[pi].label, at: toD(G.slots[seats[pi].slot]), rad}], people: everyone, furniture: furn, bounds: roomBox, extra});
      labels[pi] = r1.labels[0];
      if (r1.fails.length) problems.push('lab-presenter');
      const r2 = placeSeatLabels(ctx, {...common, maxGap: 60 / px, items: [{key: 'doc', text: p.labels.document, at: toD(docRest), rad: 26 * k}], people: everyone, furniture: furn, bounds: roomBox, extra: [...extra, r1.labels[0].box]});
      docLabel = r2.labels[0];
      if (r2.fails.length) problems.push('lab-doc');
      // hold only: the presenter at the lectern
      const r3 = placeSeatLabels(ctx, {...common, items: [{key: 'stand', text: seats[pi].label, at: toD(G.lectern.stand), rad, avoidPaths: beamLines}], people: [...everyone.filter((q, i) => i !== pi), standBody], furniture: furn, bounds: roomBox, extra});
      standLabel = r3.labels[0];
      if (r3.fails.length) problems.push('lab-stand');
      extra.push(standLabel.box);
      if (p.finalState === 'taken-down') {
        // the sheet back on the plate at the hold: its title beside the lectern (the screen is idle again)
        const r4 = placeSeatLabels(ctx, {...common, maxGap: 70 / px, items: [{key: 'docP', text: p.labels.document, at: toD(G.lectern.plateC), rad: 30 * k, avoidPaths: beamLines}], people: [...everyone.filter((q, i) => i !== pi), standBody], furniture: furn, bounds: roomBox, extra});
        docLabelHold = r4.labels[0];
        if (r4.fails.length) problems.push('lab-docP');
        extra.push(docLabelHold.box);
      }
    }
  }
  // the room name
  let roomChip = null;
  if (showKey) {
    const ropts = {maxWidth: Math.max(240 / px, Math.min(400 / px, roomBox.w * 0.4)), size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent2};
    const probe = gchip(ctx, p.courts.room, {x: 0, y: 0, ...ropts});
    const spot = placeFree({w: probe.box.w, h: probe.box.h, bounds: roomBox, people: [...everyone, standBody], extra: [...extra, ...(docLabel ? [docLabel.box] : []), ...(labels[pi] ? [labels[pi].box] : [])], paths: [walkLine, ...beamLines], pathPad: rad * 0.5, furniture: [...furn, ...hard], prefer: 'bottom-left'});
    if (spot && never.some(b => spot.x < b.x + b.w && b.x < spot.x + probe.box.w && spot.y < b.y + b.h && b.y < spot.y + probe.box.h)) problems.push('room-over');
    if (!spot) problems.push('room');
    const at = spot || {x: roomBox.x, y: roomBox.y};
    roomChip = gchip(ctx, p.courts.room, {x: at.x, y: at.y, ...ropts, name: 'room-name'});
  }
  // the title shown on the screen (design units, inside the screen's title band)
  let titleNode = null;
  if (titleFit) {
    const tb = pf.mapBox(G.titleBox);
    titleNode = textAt(titleFit, tb.x + tb.w / 2, tb.y + (tb.h - titleFit.height) / 2, '#1f2328', {anchor: 'middle', weight: 700});
  }
  // ---- note rings
  const noteColor = th.fgSoft;
  const ringOf = tg => (tg.box
    ? h('rect', {x: r(tg.box.x - 8), y: r(tg.box.y - 8), width: r(tg.box.w + 16), height: r(tg.box.h + 16), rx: 16, fill: 'none', stroke: noteColor, 'stroke-width': 4})
    : h('circle', {cx: r(tg.x), cy: r(tg.y), r: r(tg.rr), fill: 'none', stroke: noteColor, 'stroke-width': 4}));
  const targetOf = tg => {
    if (tg === 'screen') return [{box: pf.mapBox(G.screen)}];
    if (tg === 'lectern') return [{box: pf.mapBox({x: G.lectern.cx - G.lectern.w / 2, y: G.lectern.cy - G.lectern.h / 2, w: G.lectern.w, h: G.lectern.h})}];
    if (tg === 'document') return [p.finalState === 'taken-down' ? {...toD(G.lectern.plateC), rr: 50 * k} : {box: shownBox}];
    if (tg === 'presenter') return [{...toD(G.lectern.stand), rr: 62 * k}];
    return seats.map((s, i) => ({...toD(i === pi ? G.lectern.stand : G.slots[s.slot]), rr: 62 * k}));
  };
  const rings = notes.map((n, i) => g({name: `note-ring${i}`}, targetOf(n.target).map(ringOf)));
  // ---- panel nodes and the building
  const placed = placePanel(ctx, pan, F, p, noteColor);
  const bb = placed.bldBox;
  const building = buildingElevation(ctx, {name: 'bld', x: bb.x, y: bb.y, w: bb.w, h: bb.h, floors: 3, bays: 5, highlight: {floor: 1, bay: 3}, tree: true});
  const room = ppRoomArt(ctx, G, {prefix: 'rm'});
  const chipNodes = chips.map(c => ({name: c.name, node: seatLabelNode(ctx, c.L, {name: c.name, size: F, color: th.inkSoft})}));
  if (roomChip) chipNodes.push({name: 'room-name', node: roomChip.node});
  return {
    F, px, k, f: rg.f, flow: rg.flow, personPx, G, pf, seats, pi, lookers, people, route, docRest, room, labels, standLabel, docLabel, docLabelHold,
    chips: chipNodes, titleNode, rings, noteCount: notes.length, panelNodes: placed.nodes, stateNode: placed.stateNode, building, problems, node: true,
  };
}

/* ------------------------------------------------------------------ */
/* Info panel                                                          */
/* ------------------------------------------------------------------ */

function panelFor(ctx, o) {
  const th = ctx.theme;
  const D = ctx.design;
  const {flow, f, F, legendItems, notes, finalText, showKey, p} = o;
  const box = flow === 'column' ? {x: D.w * (1 - f), y: 0, w: D.w * f, h: D.h} : {x: 0, y: 0, w: D.w, h: D.h * f};
  const gap = F * 0.7;
  const textW = flow === 'column' ? box.w : box.w * 0.64;
  const glyph = F * 2.3;
  const items = [];
  for (const it of legendItems) items.push({type: 'legend', kind: it.kind, fit: fitWords(glue(it.text), {maxWidth: textW - glyph - 14, size: F, minSize: F, maxLines: 3, weight: 500}), glyph});
  notes.forEach((n, i) => items.push({type: 'note', i, fit: fitWords(glue(n.text), {maxWidth: textW - F * 1.9 - 12, size: F, minSize: F, maxLines: 4, weight: 500})}));
  if (showKey) items.push({type: 'state', chip: gchip(ctx, finalText, {x: 0, y: 0, anchor: 'start', maxWidth: textW, size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent4, color: th.ink, weight: 700})});
  if (showKey) items.push({type: 'key', fit: fitWords(glue(p.labels.key), {maxWidth: textW - 12, size: F, minSize: F, maxLines: 4, weight: 500})});
  const nameW = flow === 'column' ? box.w : box.w - textW - 20;
  const nameChip = showKey ? gchip(ctx, p.courts.building, {x: 0, y: 0, anchor: 'middle', maxWidth: nameW, size: F, minSize: F, maxLines: 3, fill: th.card}) : null;
  const hOf = it => (it.type === 'state' ? it.chip.box.h : it.type === 'legend' ? Math.max(it.glyph, it.fit.height) : it.fit.height + (it.type === 'key' ? F * 0.6 : 0));
  const truncated = items.some(it => (it.chip ? it.chip.fit.truncated : it.fit.truncated)) || (nameChip && nameChip.fit.truncated);
  const textH = items.reduce((a, it) => a + hOf(it) + gap, 0);
  const nameH = nameChip ? nameChip.box.h + gap : 0;
  let bld, ok;
  if (flow === 'column') {
    const bh = Math.min(box.h - textH - nameH, box.w * 0.95, box.h * 0.46);
    bld = {w: Math.min(box.w, bh / 0.9), h: bh};
    ok = !truncated && bh >= Math.min(120, box.h * 0.17);
  } else {
    const bw = Math.min(nameW, box.h * 1.1);
    const bh = Math.min(bw * 0.95, box.h - nameH);
    bld = {w: bw, h: bh};
    ok = !truncated && textH - gap <= box.h + 0.5 && bh >= box.h * 0.45;
  }
  return {flow, box, items, nameChip, nameW, bld, ok, gap, textW, hOf, textH};
}

function placePanel(ctx, pan, F, p, noteColor) {
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
    y += Math.max(0, (B.y + B.h - y - pan.textH) * 0.35);
    for (const it of pan.items) {
      const node = panelItem(ctx, it, B.x, y, pan, F, noteColor);
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
      const node = panelItem(ctx, it, tx, y, pan, F, noteColor);
      if (it.type === 'state') stateNode = node; else nodes.push(node);
      y += pan.hOf(it) + pan.gap;
    }
  }
  return {bldBox, nodes, stateNode};
}

function panelItem(ctx, it, x, y, pan, F, noteColor) {
  const th = ctx.theme;
  if (it.type === 'legend') {
    const look = {skin: '#c68863', hair: 'short', hairColor: '#4a3122', outfit: th.cloth[3], glasses: false};
    const gl = ppGlyph(ctx, it.kind, it.glyph, look);
    const hh = Math.max(it.glyph, it.fit.height);
    return g({name: `legend-${it.kind}`},
      g({transform: T(x + it.glyph / 2, y + hh / 2)}, gl),
      textAt(it.fit, x + it.glyph + 14, y + (hh - it.fit.height) / 2, th.fg));
  }
  if (it.type === 'note') {
    const rr = F * 0.62;
    return g({name: `note${it.i}`},
      h('circle', {cx: r(x + rr + 2), cy: r(y + F * 0.55), r: r(rr), fill: 'none', stroke: noteColor, 'stroke-width': 4}),
      textAt(it.fit, x + F * 1.9 + 12, y, th.fg));
  }
  if (it.type === 'state') {
    return gchip(ctx, it.chip.fit.full, {x, y, anchor: 'start', maxWidth: pan.textW, size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent4, color: th.ink, weight: 700}).node;
  }
  return g({name: 'key'},
    h('path', {d: `M${r(x)} ${r(y)}H${r(x + Math.min(pan.textW, it.fit.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
    textAt(it.fit, x, y + F * 0.45, th.fgSoft, {italic: true}));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-07-story',
    title: 'Presenting a document in the room — a sheet carried to the lectern and enlarged on the shared screen',
    titleEs: 'Presentación de una prueba en sala — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Presentación de una prueba en sala',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A generic building stands beside the plan of a hearing room. A participant stands, picks a fictional sheet up from their table with both hands, carries it along the aisles to the lectern and lays it on the document camera’s plate; an enlarged copy of the same sheet rises inside a translucent beam and grows onto the shared screen on the front wall, which lights up, while the others look towards it in the supplied order. The final state is as supplied; nothing says the document is admitted, excluded, weighed or ruled on.',
    tags: ['floor plan', 'hearing room', 'document', 'shared screen', 'document camera', 'lectern', 'enlarge', 'carry', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/presentacion-de-prueba.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
