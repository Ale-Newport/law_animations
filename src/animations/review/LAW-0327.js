/**
 * LAW-0327 — Ruta de recurso · contrast
 *
 * Storyboard (two complete copies of the same generic room seen from above —
 * the same abstract bodies drawn as stations of the same size on one row, each
 * with its letter (keyed to the panel) and intake tray; the same configured route
 * on the floor with its numbered steps; the same placeholder sheet in the first
 * tray; the same participant; the same empty status sign and wall calendar —
 * side by side on wide frames, one above the other on tall ones; the shared
 * facts are drawn once, in one panel):
 *  0.00–0.17  base: both rooms identical; the route drawn as a plain grey line,
 *             both signs empty; nobody moves.
 *  0.17–0.40  the ONE supplied difference is introduced in both rooms at the
 *             same moment: in A the route state "available, as supplied" — the
 *             sign shows ● and the route is drawn solid —, in B "not checked, as
 *             supplied" — the sign shows ◆ and the route is drawn dashed (a
 *             pending state, never crossed out). Each header names its state.
 *  0.40–0.77  the action runs in both rooms over the same window: in A the
 *             participant takes the sheet and carries it along every step to the
 *             last tray; in B the sheet stays in the first tray while its dashed
 *             outline (pending) traces the same configured route to the last
 *             tray. The sheets get their pins.
 *  0.77–1.00  a guide links sign A with sign B through the free channel above the
 *             rooms; changed fact, neutral note and key. No state is preferred;
 *             no rank, appeal rule, time limit or outcome is drawn.
 * @module animations/review/LAW-0327
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, r} from '../../core/time.js';
import {polyline} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, list, obj} from '../../schemas/fields.js';
import {pxPerUnit, layoutRows, R2, textAt, centreShiftY} from '../hearings/kits/apertura-audiencia.js';
import {stateGlyph} from '../hearings/kits/hearings-art.js';
import {rrFields, courierField, RR_EN, RR_ES, COURIER_EN, COURIER_ES, localisedRr, resolveRr, rrRoom, rrAction, composeRr, rrRowNode, measureRowRr, fitRr} from './kits/ruta-recurso.js';

const ID = 'LAW-0327';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {baseOut: [0.2, 0.25], stateIn: [0.25, 0.3], sign: [0.22, 0.3], tags: [0.2, 0.26], fact: [0.22, 0.28], reach: [0.4, 0.43], lift: [0.43, 0.455], carry: [0.455, 0.7], put: [0.7, 0.72], release: [0.72, 0.745], back: [0.735, 0.765], pin: [0.76, 0.8], guide: [0.78, 0.85], guideRow: [0.8, 0.84]};
const DOCK = {landscape: 1.15, square: 0.9, portrait: 1.35};
const SIGNW = {landscape: 118, square: 96, portrait: 118};

const OWN_EN = {
  courier: COURIER_EN,
  scenarioA: {label: 'Scenario A'},
  scenarioB: {label: 'Scenario B'},
  changedFact: 'Only the supplied route state differs: available, or not checked (pending)',
  sharedFacts: [],
  objectLabels: {ghost: 'Dashed outline: the configured route, pending (as supplied)', calendar: 'Wall calendar (no date marked)'},
  comparisonLabels: {guide: 'The one supplied difference', neutral: 'Neither state weighs more; nothing is evaluated'},
};
const OWN_ES = {
  courier: COURIER_ES,
  scenarioA: {label: 'Supuesto A'},
  scenarioB: {label: 'Supuesto B'},
  changedFact: 'Solo cambia el estado aportado de la ruta: disponible, o no comprobada (pendiente)',
  sharedFacts: [],
  objectLabels: {ghost: 'Contorno discontinuo: la ruta configurada, pendiente (según lo aportado)', calendar: 'Calendario de pared (sin fechas marcadas)'},
  comparisonLabels: {guide: 'La única diferencia aportada', neutral: 'Ningún estado pesa más; no se evalúa nada'},
};
const EN = {...RR_EN, ...OWN_EN};
const ES = {...RR_ES, ...OWN_ES};

const sceneSchema = {
  ...rrFields,
  courier: courierField,
  scenarioA: obj('Scenario A: the route state "available" (●, `outcomes.a`) is introduced; its header reads "<label> · <outcomes.a>", with an optional caption', {label: str('Name of scenario A (as supplied)', 50), caption: str('Optional one-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B: the route state "not checked" (◆, `outcomes.b`: a pending state) is introduced; its header reads "<label> · <outcomes.b>", with an optional caption', {label: str('Name of scenario B (as supplied)', 50), caption: str('Optional one-line description of B', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 130),
  sharedFacts: list('Facts that stay identical in both rooms (drawn once)', str('Shared fact', 90), 0, 3),
  objectLabels: obj('Captions of the room objects in the legend', {
    ghost: str('Caption for the dashed outline (the configured route, pending)', 90),
    calendar: str('Caption for the wall calendar (a fixture only)', 70),
  }, ['ghost', 'calendar']),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide linking the two signs', 70), neutral: str('Neutral note (nothing follows from the difference)', 120)}),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedRr(ctx, EN, ES);
    const R = resolveRr(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    // ---- shared panel rows (drawn once); each room's header names its state; the rooms carry only letters and numbers
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.labels.route, name: 'route-name'});
      rows.push({kind: 'legend', glyphKind: 'doc', text: P.decisions.title, name: 'lg-doc'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.courier.label, name: 'lg-person'});
      R.bodies.forEach(b => rows.push({kind: 'legend', glyphKind: 'station', letter: b.letter, text: b.label, name: `lg-body${b.index}`}));
      rows.push({kind: 'legend', glyphKind: 'step', text: P.labels.sequence, name: 'lg-step'});
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'ghost', text: P.objectLabels.ghost, name: 'lg-ghost'});
      rows.push({kind: 'legend', glyphKind: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
      P.sharedFacts.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'same', text: tx, name: `shared${i}`}));
    }
    if (showKey) rows.push({kind: 'text', bold: true, text: P.changedFact, name: 'changed-fact'});
    if (showAll) rows.push({kind: 'legend', glyphKind: 'guide', text: P.comparisonLabels.guide, name: 'guide-row'});
    if (showAll) rows.push({kind: 'text', text: P.comparisonLabels.neutral, name: 'neutral'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const gap = 30;
    const fd = fitDesign(ctx.view, D.w, D.h);
    const frameHD = ctx.view.height / fd.scale;
    const frameWD = ctx.view.width / fd.scale;
    // ---- headers (A / B): lane disc with the state's glyph + "<label> · <state>" (and caption), at a room's width
    const headerFor = (F, w) => {
      if (!showKey) return {h: 0, fits: null};
      const disc = F * 0.8;
      const fits = ['a', 'b'].map(s => { const sc = P[s === 'a' ? 'scenarioA' : 'scenarioB']; return fitRr(`${sc.label} · ${P.outcomes[s]}${sc.caption ? ` · ${sc.caption}` : ''}`, {maxWidth: Math.max(80, w - disc * 2 - F * 0.9), size: F, minSize: F, maxLines: 4, weight: 500}); });
      const hh = Math.max(disc * 2, ...fits.map(f => f.height)) + F * 0.3;
      return {h: hh, fits, disc};
    };
    // (four bodies at 1:1: a slightly smaller sheet and sign, so two rooms of four stations keep the people floors)
    const four = R.n >= 4 && shape === 'square';
    const docK = four ? 0.8 : DOCK[shape];
    // ---- one candidate: rooms area (for the pair), arrangement, size, room scale
    const compose = (area, arr, F, scale, final = false) => {
      const chan = 30, side = arr === 'row' ? 0 : 44;
      const rgap = arr === 'row' && shape === 'square' ? 6 : gap;
      const roomsW = arr === 'row' ? (area.w - rgap) / 2 : area.w - side;
      const hd = headerFor(F, roomsW);
      const roomH = arr === 'row' ? area.h - hd.h - chan : (area.h - 2 * (hd.h + chan) - gap) / 2;
      const box = {x: area.x, y: area.y + hd.h + chan, w: roomsW, h: roomH};
      const C = composeRr(ctx, P, R, box, F, {scale, text: false, letters: showKey, numbers: showKey, courier: true, sign: true, signW: four ? 84 : SIGNW[shape], docK, gap: shape === 'square' ? (four ? 42 : 50) : 64, align: {x: 0.5, y: arr === 'row' ? 0 : 0.5}, ...(final ? {deepen: 2.2, spread: 1.8} : {})});
      const problems = [...C.problems];
      // each room stays a real subject: >= 0.21 of the frame's height
      if (C.planRect.h / frameHD < (shape === 'landscape' ? 0.225 : 0.205)) problems.push('subject-short');
      // (item 18: side by side, each room keeps >= 0.40 of the frame's width)
      if (arr === 'row' && shape === 'landscape' && C.planRect.w / frameWD < 0.4) problems.push('room-narrow');
      const shift = arr === 'row' ? {x: roomsW + rgap, y: 0} : {x: 0, y: roomH + hd.h + chan + gap};
      return {C, problems, hd, box, shift, roomsW, roomH, chan, side, arr, area, scale};
    };
    const arrangements = [];
    if (shape === 'landscape') {
      for (const cf of [0.22, 0.26, 0.3]) arrangements.push({arr: 'row', panel: 'column', cf});
      for (const cols of [3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
    } else if (shape === 'portrait') {
      for (const cols of [2, 3]) arrangements.push({arr: 'col', panel: 'band', cols});
    } else {
      for (const cols of [2, 3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
      for (const cf of [0.3, 0.36, 0.42]) arrangements.push({arr: 'col', panel: 'column', cf});
    }
    let best = null;
    const log = [];
    // standing people floors (review = hearings, FIGURE): >= 60 px; 1:1 >= 55 px (composed to 57 for margin); the
    // stress floor of 45 px only when no composition reaches 55 at 1:1 — or, off 1:1, for long-labels-stress (STRESS
    // PEOPLE FLOOR OFF 1:1)
    const floors = shape === 'square' ? [[57, 19.5], [55.3, 19.5], [55.3, 0], [45, 0]] : [[61, 19.5], [61, 0], [45, 0]];
    const lay = (ms, box, F, cols) => { const L = layoutRows(ms, box, F, cols, 28); if (ms.some(m => m.lone)) L.ok = false; return L; };
    for (const [minPerson, minText] of floors) {
      if (best && !best.problems.length) break;
      best = null;
      for (const force of [false, true]) {
        if (best) break;
        for (const Fpx of (force ? [16.4] : [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4])) {
          const F = Fpx / px;
          let good = false;
          for (const A of arrangements) {
            let L0 = null, area = {x: 0, y: 0, w: D.w, h: D.h};
            const extra = [];
            if (rows.length) {
              if (A.panel === 'column') {
                const pw = D.w * A.cf;
                const ms = rows.map(rw => measureRowRr(rw, F, pw));
                const probe = lay(ms, {x: 0, y: 0, w: pw, h: 1e6}, F, 1);
                if (!probe.ok || probe.usedH > D.h) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: D.w - pw, y: Math.max(0, (D.h - probe.usedH) / 2), w: pw, h: probe.usedH};
                L0 = layoutRows(ms, panelBox, F, 1, 28);
                area = {x: 0, y: 0, w: D.w - pw - gap, h: D.h};
              } else {
                const colW = (D.w - 28 * (A.cols - 1)) / A.cols;
                const ms = rows.map(rw => measureRowRr(rw, F, colW));
                const probe = lay(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, A.cols);
                if (!probe.ok || probe.usedH > D.h * (shape === 'square' ? 0.53 : 0.45)) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
                L0 = layoutRows(ms, panelBox, F, A.cols, 28);
                area = {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap};
              }
            }
            for (const scale of [1, 1.15, 1.3]) {
              const cc = compose(area, A.arr, F, scale);
              const personPx = 100 * cc.C.k * px;
              cc.problems.push(...extra);
              if (personPx < minPerson) cc.problems.push('people-small');
              if (Fpx < minText) cc.problems.push('text-below-baseline');
              const score = -1000 * cc.problems.length + (Fpx >= 19.5 ? 500 : 0) + (personPx >= 55 ? 450 : 0) + Math.min(personPx, 110) + 3 * Fpx;
              log.push(`${Fpx} ${A.arr}/${A.panel}${A.cf || A.cols} s${scale} ${personPx.toFixed(2)} ${cc.problems.join('+')}`);
              const cand = {...cc, F, lay: L0, score, personPx, A};
              if (!best || score > best.score) best = cand;
              if (!cc.problems.length && personPx >= 70 && Fpx >= 19.5) good = true;
              if (!cc.problems.length) break;
            }
          }
          if (good) break;
        }
      }
    }
    // (the chosen composition only: spare height deepens both routes, spare width spreads both rows of stations)
    const fin = compose(best.area, best.arr, best.F, best.scale, true);
    const {F} = best;
    const {C, hd, shift, arr} = fin;
    const G = C.G;
    const problems = [...best.problems, ...fin.problems.filter(q => q !== 'people-small' && !best.problems.includes(q))];
    const roomA = rrRoom(ctx, G, {prefix: 'ra', R, Ft: G.Ft, numbers: showKey});
    const roomB = rrRoom(ctx, G, {prefix: 'rb', R, Ft: G.Ft, numbers: showKey});
    // headers: above each room, left-aligned with it
    const plan = C.planRect;
    const headers = hd.fits ? ['A', 'B'].map((letter, j) => {
      const sx = j ? shift.x : 0, sy = j ? shift.y : 0;
      return {letter, x: plan.x + sx, y: plan.y - fin.chan - hd.h + sy, fit: hd.fits[j], disc: hd.disc};
    }) : [];
    // the guide: from the top edge of sign A up into the channel above room A, along it, and down onto the top edge of
    // sign B; stacked, it runs down the right margin between the two rooms
    const sA = C.toD({x: G.sign.x + G.sign.w / 2, y: G.sign.y});
    const gy = plan.y - fin.chan / 2;
    let pts;
    if (arr === 'row') pts = [{x: sA.x, y: sA.y}, {x: sA.x, y: gy}, {x: sA.x + shift.x, y: gy}, {x: sA.x + shift.x, y: sA.y}];
    else {
      const cx = plan.x + plan.w + fin.side / 2;
      pts = [{x: sA.x, y: sA.y}, {x: sA.x, y: gy}, {x: cx, y: gy}, {x: cx, y: gy + shift.y}, {x: sA.x, y: gy + shift.y}, {x: sA.x, y: sA.y + shift.y}];
    }
    const guide = polyline(pts);
    // (the whole composition — headers, both rooms, the panel — centred in the design height)
    const pb = best.lay ? (() => { const rs = best.lay.rows; const y0 = Math.min(...rs.map(m => m.y)), y1 = Math.max(...rs.map(m => m.y + m.h)); return {x: 0, y: y0, w: D.w, h: y1 - y0}; })() : null;
    const top = headers.length ? Math.min(...headers.map(hd0 => hd0.y)) : plan.y;
    const dyC = centreShiftY(D, [{x: plan.x, y: top, w: plan.w, h: plan.y + plan.h - top}, {x: plan.x + shift.x, y: plan.y + shift.y, w: plan.w, h: plan.h}, pb]);
    return {dyC, P, R, F, px, C, G, lay: best.lay, headers, roomA, roomB, shift, arr, guide, pts, log, problems, personPx: 100 * C.k * px, showKey};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rrRowNode(ctx, m, {name: m.name, look: L.R.courier.look})) : [];
    const lanes = [th.accent2, th.accent4];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'roomA', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.roomA.node),
      g({name: 'roomB', transform: `${T(C.ox + L.shift.x, C.oy + L.shift.y)} scale(${r(C.k, 5)})`}, L.roomB.node),
      L.headers.map((hd, j) => g({name: `hdr${hd.letter}`},
        // (the lane disc carries the state's glyph — ● for A, ◆ for B — the same size and ink)
        h('circle', {cx: r(hd.x + hd.disc), cy: r(hd.y + hd.disc), r: r(hd.disc), fill: lanes[j]}),
        g({name: `hdr${hd.letter}-state`, opacity: 0},
          stateGlyph(ctx, {name: `hdr${hd.letter}-cue`, kind: j ? 'diamond' : 'dot', cx: hd.x + hd.disc, cy: hd.y + hd.disc, s: hd.disc * 0.42, fill: '#ffffff'}),
          textAt(hd.fit, hd.x + hd.disc * 2 + L.F * 0.6, hd.y + Math.max(0, hd.disc - hd.fit.height / 2), th.fg)))),
      h('path', {name: 'guide', 'data-draw': 1, d: L.guide.d(1), fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.total)} ${r(L.guide.total + 10)}`, 'stroke-dashoffset': r(L.guide.total), opacity: 0}),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {G, C} = L;
    const nodes = {};
    const e = ease.inOutCubic;
    const tags = seg(u, ...W.tags);
    // introduce: the route's base line leaves and the room's state comes in — solid (A), dashed (B) —, the sign shows it
    const baseOp = 1 - seg(u, ...W.baseOut);
    const stIn = seg(u, ...W.stateIn);
    const sign = e(seg(u, ...W.sign));
    const pinK = seg(u, ...W.pin);
    const aA = rrAction(G, W, u, {mode: 'carry'});
    const aB = rrAction(G, W, u, {mode: 'ghost'});
    const fa = L.roomA.frame({doc: aA.doc, person: aA.person, reach: aA.reach, covers: aA.covers, route: {base: baseOp, solid: stIn}, sign: {a: sign}, pin: {a: pinK}});
    const fb = L.roomB.frame({doc: aB.doc, ghost: aB.ghost, person: aB.person, reach: aB.reach, covers: aB.covers, route: {base: baseOp, dashed: stIn}, sign: {b: sign}, pin: {b: pinK}});
    Object.assign(nodes, fa.nodes, fb.nodes);
    L.headers.forEach(hd => { nodes[`hdr${hd.letter}-state`] = {opacity: r(tags, 3)}; });
    const guideP = seg(u, ...W.guide);
    nodes.guide = {opacity: guideP > 0 ? 1 : 0, 'stroke-dashoffset': r(L.guide.total * (1 - guideP))};
    if (L.lay) for (const m of L.lay.rows) {
      if (m.name === 'changed-fact') nodes[m.name] = {opacity: r(seg(u, ...W.fact), 3)};
      if (m.name === 'guide-row') nodes[m.name] = {opacity: r(seg(u, ...W.guideRow), 3)};
    }
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    const near = q => G.stations.findIndex(s => Math.hypot(s.doc.x - q.x, s.doc.y - q.y) < 0.5);
    // (what each room shows: the participant, the sheet, the outline, the route's style and the sign)
    const look = (a, solid, dashed, signOp) => JSON.stringify({p: R2(C.toD(a.person)), d: R2(C.toD(a.doc)), g: a.ghost && a.ghost.op > 0 ? R2(C.toD(a.ghost)) : null, base: r(baseOp, 3), solid: r(solid, 3), dashed: r(dashed, 3), sign: r(signOp, 3), reach: r(a.k, 3)});
    return {
      nodes,
      semantic: {
        beat,
        lookA: look(aA, stIn, 0, sign),
        lookB: look(aB, 0, stIn, sign),
        tags: r(tags, 3),
        stateA: r(stIn, 3),
        stateB: r(stIn, 3),
        signA: r(sign, 3),
        signB: r(sign, 3),
        phaseA: aA.phase,
        phaseB: aB.phase,
        docA: near(aA.doc),
        docB: near(aB.doc),
        ghostB: aB.ghost && aB.ghost.op > 0 ? near(aB.ghost) : null,
        stepKA: aA.stepK.map(q => r(q, 3)),
        stepKB: aB.stepK.map(q => r(q, 3)),
        first: L.R.steps[0],
        last: L.R.steps[L.R.steps.length - 1],
        steps: L.R.steps,
        reachA: r(aA.k, 3),
        reachB: r(aB.k, 3),
        handA: fa.hand ? R2(C.toD(fa.hand)) : null,
        handB: fb.hand ? R2({x: C.toD(fb.hand).x + L.shift.x, y: C.toD(fb.hand).y + L.shift.y}) : null,
        sheetA: R2(C.toD(aA.doc)),
        sheetB: R2({x: C.toD(aB.doc).x + L.shift.x, y: C.toD(aB.doc).y + L.shift.y}),
        outlineB: aB.ghost ? R2({x: C.toD(aB.ghost).x + L.shift.x, y: C.toD(aB.ghost).y + L.shift.y}) : null,
        personA: R2(C.toD(aA.person)),
        personB: R2({x: C.toD(aB.person).x + L.shift.x, y: C.toD(aB.person).y + L.shift.y}),
        pin: r(pinK, 3),
        guide: r(guideP, 3),
        allReached: fa.reached && fb.reached,
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        pxu: r(L.px, 4),
        arrangement: L.arr,
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
    slug: 'review-02-contrast',
    title: 'Configured route — the same route supplied as available or as not checked (pending), in two identical rooms',
    titleEs: 'Ruta de recurso — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Ruta de recurso',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical generic rooms: the same abstract bodies drawn as stations of the same size on one row, the same configured route with its numbered steps, the same placeholder sheet in the first tray and the same participant. At the same moment the one supplied difference is introduced: in A the route state "available, as supplied" (● on the sign, the route drawn solid), in B "not checked, as supplied" (◆ on the sign, the route drawn dashed — a pending state). The action then runs over the same window: in A the participant carries the sheet along every step to the last tray; in B the sheet stays in the first tray while its dashed outline traces the same route. A guide links the two signs. Illustrative; neither state is preferred; no rank, admissibility, time limit, ground or outcome is drawn; jurisdiction unspecified.',
    tags: ['review', 'configured route', 'contrast', 'two rooms', 'route available as supplied', 'route not checked', 'pending state', 'abstract bodies', 'equal size', 'as supplied', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/ruta-recurso.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
