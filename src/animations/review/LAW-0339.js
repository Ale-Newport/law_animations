/**
 * LAW-0339 — Revisión de documentos · contrast
 *
 * Storyboard (two complete, identical filing rooms seen from above — side by side in wide frames, one above the other
 * in tall ones: in each, folder A (the original file, blue) and folder B (the separate folder, amber) lie open on
 * either side of a neutral divider, ONE plain piece waits in the intake tray and a participant stands under the divider;
 * same scale, same timing, same objects):
 *  0.00–0.17  the base situation, duplicated: both rooms identical, the piece plain (no strip) in both.
 *  0.17–0.40  the changed fact, localised: the piece in room A gains the blue strip of the original material ("Material
 *             original"), the piece in room B the amber strip of the proposed additional material ("material
 *             adicional propuesto") — the only difference.
 *  0.40–0.77  the same action runs in parallel: each participant takes its piece from the tray and files it — in room A
 *             the piece is carried past the divider and laid on top of the original file in folder A; in room B it is
 *             laid in folder B and never crosses the divider. Only the route and the folder differ.
 *  0.77–1.00  a comparison guide joins the changed detail: an outline round each piece where it now lies, linked
 *             through the gap between the rooms; the neutral note says no rule is drawn and no side is preferred. No
 *             winner, score, admissibility rule or outcome.
 * @module animations/review/LAW-0339
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {contrastFields} from '../../schemas/fields.js';
import {pxPerUnit, R2, centreShiftY, fitG, textAt, FONT} from '../hearings/kits/apertura-audiencia.js';
import {searchSa} from './kits/solicitud-autorizacion.js';
import {rdFields, courierField, RD_EN, RD_ES, localisedRd, resolveRd, rdRoom, composeRd, makePlan, evalPlan, planRecord, rdRowNode, laneColors} from './kits/revision-de-documentos.js';

const ID = 'LAW-0339';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {stripe: [0.2, 0.3], plan: [0.41, 0.755], guide: [0.775, 0.83], note: [0.8, 0.86]};
const CHANGE_AT = 0.17;
const SIDES = ['a', 'b'];

const OWN_EN = {
  pieces: ['P1 (fictional)'],
  courier: {label: 'Participant (fictional)'},
  scenarioA: {label: 'Material original', caption: 'The piece is marked as original material (as supplied)'},
  scenarioB: {label: 'Proposed additional material', caption: 'The piece is marked as proposed additional material (as supplied)'},
  changedFact: 'Only the mark on the piece differs',
  sharedFacts: ['Same room, folders, divider and gesture'],
  outcomes: {a: 'A: laid with the original file (as configured)', b: 'B: laid in folder B (as configured)'},
  comparisonLabels: {guide: 'Where the piece ends up', neutral: 'No rule drawn, no side preferred'},
};
const OWN_ES = {
  pieces: ['P1 (ficticia)'],
  courier: {label: 'Participante (ficticio)'},
  scenarioA: {label: 'Material original', caption: 'Pieza marcada como material original (según lo aportado)'},
  scenarioB: {label: 'Material adicional propuesto', caption: 'Pieza marcada como material adicional (según lo aportado)'},
  changedFact: 'Solo cambia la marca de la pieza',
  sharedFacts: ['Misma sala, carpetas, separador y gesto'],
  outcomes: {a: 'A: queda con el expediente original (según lo configurado)', b: 'B: queda en la carpeta B (según lo configurado)'},
  comparisonLabels: {guide: 'Dónde queda la pieza', neutral: 'Sin regla y sin preferencia por ninguno'},
};
const EN = {...RD_EN, ...OWN_EN};
const ES = {...RD_ES, ...OWN_ES};

const cf = contrastFields();
const sceneSchema = {
  ...rdFields,
  ...cf,
  pieces: list('The one piece handled in both rooms (fictional placeholder sheet)', str('Label of the piece (fictional)', 48), 1, 1),
  courier: courierField,
  scenarioA: obj('Scenario A: the piece is marked as original material', {label: str('Short label for scenario A', 50), caption: str('One-line description', 100)}, ['label']),
  scenarioB: obj('Scenario B: the piece is marked as proposed additional material', {label: str('Short label for scenario B', 50), caption: str('One-line description', 100)}, ['label']),
  outcomes: obj('Captions of where the piece ends in each room (equal weight; as configured, nothing inferred)', {
    a: str('Caption of room A\'s end state', 100),
    b: str('Caption of room B\'s end state', 100),
  }, ['a', 'b']),
};

const defaultParams = {...EN};
/** The localised defaults (tests resolve what a locale-'es' render shows). */
export const LOCALES = {en: EN, es: ES};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 860], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedRd(ctx, EN, ES);
    const R = resolveRd(ctx, P);
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    // (the scenario captions are drawn in each room's header, under its label; the panel holds the rest)
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.labels.heading, name: 'heading'});
      rows.push({kind: 'legend', glyphKind: 'guide', text: P.changedFact, name: 'lg-changed'});
      if ((P.sharedFacts || []).length) rows.push({kind: 'legend', glyphKind: 'same', text: P.sharedFacts.join(' · '), name: 'lg-same'});
      rows.push({kind: 'legend', glyphKind: 'folderA', text: P.routes.original, name: 'lg-a'});
      rows.push({kind: 'legend', glyphKind: 'decision', text: P.decisions.title, name: 'lg-dec'});
      rows.push({kind: 'legend', glyphKind: 'folderB', text: P.routes.additional, name: 'lg-b'});
      rows.push({kind: 'legend', glyphKind: 'divider', text: P.routes.divider, name: 'lg-divider'});
      rows.push({kind: 'legend', glyphKind: 'tray', text: `${P.labels.pieces}: ${R.pieces.map(q => q.label).join(' · ')}`, name: 'lg-pieces'});
      rows.push({kind: 'legend', glyphKind: 'grounds', text: P.grounds, name: 'lg-grounds'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.courier.label, name: 'lg-person'});
      rows.push({kind: 'text', text: P.outcomes.a, name: 'out-a'});
      rows.push({kind: 'text', text: P.outcomes.b, name: 'out-b'});
    }
    if (showAll) rows.push({kind: 'legend', glyphKind: 'guide', text: P.comparisonLabels.guide, name: 'lg-guide'});
    if (showKey) rows.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'note'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const pairAt = (box, F, arrangement) => {
      const gap = 44;
      const laneW = arrangement === 'row' ? (box.w - gap) / 2 : box.w;
      const bR0 = F * 0.8;
      const fits = [P.scenarioA, P.scenarioB].map(sc => showKey ? {
        label: fitG(sc.label, {maxWidth: Math.max(80, laneW - bR0 * 2 - 16), size: F, minSize: F, maxLines: 2, weight: 700}),
        cap: sc.caption && showAll ? fitG(sc.caption, {maxWidth: Math.max(80, laneW - bR0 * 2 - 16), size: F, minSize: F, maxLines: 3, weight: 500}) : null,
      } : null);
      const hdrH = showKey ? Math.max(...fits.map(f => f.label.height + (f.cap ? f.cap.height + F * 0.3 : 0))) + F * 0.6 : F * 1.5;
      const lanes = [];
      const arr = arrangement === 'row' ? 'stack' : 'row';
      for (let i = 0; i < 2; i++) {
        const sb = arrangement === 'row'
          ? {x: box.x + i * ((box.w - gap) / 2 + gap), y: box.y, w: (box.w - gap) / 2, h: box.h}
          : {x: box.x, y: box.y + i * ((box.h - gap) / 2 + gap), w: box.w, h: (box.h - gap) / 2};
        const rb = {x: sb.x, y: sb.y + hdrH, w: sb.w, h: sb.h - hdrH};
        lanes.push({sb, rb, C: composeRd(ctx, R, rb, {arr, docK: arr === 'row' ? 1.42 : 1.6, person: true, n: 1, sign: false, calendar: false, covers: false, crop: 1.3, maxK: 150 / (100 * px), align: {x: 0.5, y: 0}})});
      }
      const k = Math.min(lanes[0].C.k, lanes[1].C.k);
      const pr = lanes.map(l => l.C.planRect);
      const planRect = {x: Math.min(...pr.map(q => q.x)), y: lanes[0].sb.y, w: Math.max(...pr.map(q => q.x + q.w)) - Math.min(...pr.map(q => q.x)), h: Math.max(...pr.map(q => q.y + q.h)) - lanes[0].sb.y};
      const problems = [...lanes[0].C.problems];
      if (fits.some(f => f && (f.label.truncated || (f.cap && f.cap.truncated)))) problems.push('header-text');
      return {k, lanes, arrangement, hdrH, gap, planRect, problems, fits};
    };
    // (side by side in wide frames, stacked in tall ones — the brief; a square takes whichever gives larger rooms)
    const compose = (box, F) => {
      const a = pairAt(box, F, 'row'), b = pairAt(box, F, 'column');
      if (ctx.view.shape === 'landscape') return a;
      if (ctx.view.shape === 'portrait') return b;
      return a.k >= b.k ? a : b;
    };
    const search = (sizes, minPx = ctx.view.shape === 'square' ? 55.5 : 60.5) => searchSa(ctx, rows, {
      sizes, minF: 16.4, minPersonPx: minPx,
      colFracs: [0.25, 0.3, 0.35, 0.42], bandCols: [1, 2, 3], sidePanels: [[0.36, 2], [0.42, 2]], bandMax: ctx.view.shape === 'square' ? 0.68 : 0.45,
      scales: [1], targetPx: 1e9, scoreOf: C => C.k * 300,
      compose: (box, F) => compose(box, F),
    });
    let best = search([22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4]);
    if (best.problems.length) {
      // (long-labels-stress: the standing stress people floor, 45 px)
      const b = search([22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], 45.5);
      if (b.problems.length < best.problems.length) best = b;
    }
    const C = compose(best.roomBox, best.F);
    const rooms = C.lanes.map((l, i) => rdRoom(ctx, l.C.G, {prefix: i ? 'rb' : 'ra', R, person: true, slotO: true, slotsN: 1, trayStripes: true, heldKinds: [SIDES[i]]}));
    const plans = C.lanes.map((l, i) => {
      const G = l.C.G;
      const dest = i === 0 ? G.slotO() : G.slotN(0);
      return makePlan(G, G.rest, [
        {type: 'walk', to: G.poseFor(G.trayAt(0))},
        {type: 'reach', dur: 0.02, mode: 'sheet'},
        {type: 'lift', dur: 0.012, piece: 0, from: {kind: 'tray', i: 0}},
        {type: 'walk', to: G.poseFor(dest)},
        {type: 'put', dur: 0.012, to: i === 0 ? {kind: 'slotO', i: 0} : {kind: 'slotN', i: 0}},
        {type: 'release', dur: 0.02},
        {type: 'walk', to: {...G.rest}},
      ], W.plan, {kind: SIDES[i]});
    });
    const F = best.F;
    const lc = laneColors(ctx);
    const headers = C.lanes.map((l, i) => {
      const sb = l.sb;
      const bR = F * 0.8;
      const ft = C.fits[i];
      const cxB = l.C.planRect.x + bR;
      const cy = sb.y + bR + F * 0.1;
      const tx = cxB + bR + 12;
      return g({name: `hdr-${SIDES[i]}`},
        h('circle', {cx: r(cxB), cy: r(cy), r: r(bR), fill: lc[SIDES[i]], stroke: '#1f2328', 'stroke-width': 2.4}),
        showKey ? h('text', {x: r(cxB), y: r(cy + bR * 0.42), 'text-anchor': 'middle', 'font-size': r(bR * 1.15, 2), 'font-weight': 800, 'font-family': FONT, fill: '#ffffff'}, i ? 'B' : 'A') : null,
        ft ? textAt(ft.label, tx, sb.y + F * 0.1, ctx.theme.fg) : null,
        ft && ft.cap ? textAt(ft.cap, tx, sb.y + F * 0.1 + ft.label.height + F * 0.3, ctx.theme.fgSoft) : null);
    });
    // the comparison guide (design units): an outline round each piece where it ends, linked through the gap
    const destBox = i => {
      const l = C.lanes[i];
      const G = l.C.G;
      const q = i === 0 ? G.slotO() : G.slotN(0);
      const p0 = l.C.toD({x: q.x - G.DW / 2 - 12, y: q.y - G.DH / 2 - 12});
      return {x: p0.x, y: p0.y, w: (G.DW + 24) * l.C.k, h: (G.DH + 24) * l.C.k};
    };
    const bA = destBox(0), bB = destBox(1);
    let path;
    if (C.arrangement === 'row') {
      const gx = (C.lanes[0].C.planRect.x + C.lanes[0].C.planRect.w + C.lanes[1].C.planRect.x) / 2;
      const yA = bA.y + bA.h / 2, yB = bB.y + bB.h / 2;
      const xA = C.lanes[0].C.planRect.x + C.lanes[0].C.planRect.w, xB = C.lanes[1].C.planRect.x;
      path = `M${r(xA)} ${r(yA)}H${r(gx)}V${r(yB)}H${r(xB)}`;
    } else {
      // (stacked: along the outside of the rooms' right walls, clear of B's header text; through the gap when there is
      // no margin there)
      const right = Math.max(...C.lanes.map(l => l.C.planRect.x + l.C.planRect.w));
      const laneR = C.lanes[0].sb.x + C.lanes[0].sb.w;
      if (laneR - right >= 14) {
        const gx = right + Math.min(22, (laneR - right) / 2);
        // (above each counter, over its back edge: the line never crosses a folder, the tray or the divider)
        const topOf = i => { const l = C.lanes[i]; return l.C.toD({x: 0, y: l.C.G.counter.y - 12}).y; };
        const xA = bA.x + bA.w / 2, xB = bB.x + bB.w / 2;
        path = `M${r(xA)} ${r(bA.y)}V${r(topOf(0))}H${r(gx)}V${r(topOf(1))}H${r(xB)}V${r(bB.y)}`;
      } else {
        const yA = C.lanes[0].C.planRect.y + C.lanes[0].C.planRect.h;
        const gy = (yA + C.lanes[1].sb.y) / 2;
        const xA = bA.x + bA.w / 2, xB = bB.x + bB.w / 2;
        path = `M${r(xA)} ${r(yA)}V${r(gy)}H${r(xB)}`;
      }
    }
    const guideCol = ctx.theme.accent3;
    const guide = g({name: 'guide', opacity: 0},
      [bA, bB].map((b, i) => h('path', {name: `guide-box-${SIDES[i]}`, d: roundRectPath(b.x, b.y, b.w, b.h, 10), fill: 'none', stroke: guideCol, 'stroke-width': 5})),
      h('path', {name: 'guide-link', d: path, fill: 'none', stroke: guideCol, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}));
    const dyC = centreShiftY(ctx.design, [C.planRect, best.panelBox]);
    return {P, R, F, px, C, rooms, plans, headers, guide, lay: best.lay, problems: [...best.problems], dyC, cols: best.cols, guideBoxes: [bA, bB]};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rdRowNode(ctx, m, {name: m.name, look: L.R.courier.look})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      C.lanes.map((l, i) => g({name: `lane-${SIDES[i]}`},
        L.headers[i],
        g({name: `plan-${SIDES[i]}`, transform: `${T(l.C.ox, l.C.oy)} scale(${r(l.C.k, 5)})`}, L.rooms[i].node))),
      L.guide,
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {C, plans, rooms} = L;
    const nodes = {};
    const stripe = seg(u, ...W.stripe);
    const look = [];
    const sem = {};
    C.lanes.forEach((l, i) => {
      const G = l.C.G;
      const ps = evalPlan(G, plans[i], u);
      const rec = planRecord(G, ps, {slotsN: 1});
      const side = SIDES[i];
      const rf = rooms[i].frame({...rec, coverA: -1, coverB: -1, trayStripe: [{[side]: stripe}]});
      Object.assign(nodes, rf.nodes);
      const l0 = ps.loc[0];
      const pieceT = l0.kind === 'hand' ? ps.held : l0.kind === 'slotO' ? G.slotO() : l0.kind === 'slotN' ? G.slotN(0) : G.trayAt(0);
      // what is visible in the room (template units, the same geometry in both rooms): used to prove A = B before the change
      look.push({stripe: r(stripe, 3), loc: l0.kind, piece: R2(pieceT), person: R2(ps.pose), k: r(ps.k, 3), phase: ps.phase});
      sem[side] = {loc: l0.kind, piece: R2(l.C.toD(pieceT)), person: R2(l.C.toD(ps.pose)), hand: rf.hand ? R2(l.C.toD(rf.hand)) : null, grip: ps.targets && ps.targets[0] ? R2(l.C.toD(ps.targets[0])) : null, reaching: r(ps.k, 3), lift: r(ps.lift, 3), carried: ps.carried, reached: rf.reached, dividerX: r(l.C.toD({x: G.divider.x + G.divider.w / 2, y: 0}).x), personPx: r(100 * l.C.k * L.px, 1)};
    });
    const gk = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gk, 3)};
    if (L.lay) for (const mm of L.lay.rows) {
      if (mm.name === 'note' || mm.name === 'lg-guide') nodes[mm.name] = {opacity: r(seg(u, ...W.note), 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.action[1] ? 'action' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        lookA: look[0], lookB: look[1],
        a: sem.a, b: sem.b,
        pieceA: sem.a.piece, pieceB: sem.b.piece, personA: sem.a.person, personB: sem.b.person, handA: sem.a.hand, handB: sem.b.hand,
        stripe: r(stripe, 3),
        guide: r(gk, 3),
        arrangement: C.arrangement,
        allReached: sem.a.reached && sem.b.reached,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        pxu: r(L.px, 4),
        personPx: sem.a.personPx,
        cols: L.cols,
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
    slug: 'review-05-contrast',
    title: 'Document review — two identical filing rooms: a piece marked as original material is laid with the original file, a piece marked as proposed additional material in the separate folder (as configured)',
    titleEs: 'Revisión de documentos — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Revisión de documentos',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical filing rooms seen from above, side by side (or stacked in tall frames). In each, a participant files one plain piece from the intake tray. The only change is the mark the piece receives: in A the blue mark of the original material — the piece is carried past the divider and laid on the original file in folder A; in B the amber mark of the proposed additional material — it is laid in the separate folder B. A guide outlines where each piece ends. Equal weight, no winner, no admissibility rule or outcome; illustrative, jurisdiction unspecified.',
    tags: ['review', 'document review', 'contrast', 'original material', 'additional material', 'kept separate', 'divider', 'paired rooms', 'as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/revision-de-documentos.js', 'src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
