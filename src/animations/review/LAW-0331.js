/**
 * LAW-0331 — Solicitud de autorización · contrast
 *
 * Storyboard (two complete copies of the same generic room seen from above —
 * the same abstract stations of the same size on one row, each with its letter
 * (keyed to the panel) and its neutral two-slot tray, the last stop's being the
 * prior-examination tray (a plain tab); the same configured path on the floor
 * with its numbered steps; the same placeholder petition in the first tray; the
 * same participant; the same empty status sign and wall calendar — side by side
 * on wide frames, one above the other on tall ones; the shared facts are drawn
 * once, in one panel):
 *  0.00–0.17  base: both rooms identical; both signs empty; nobody moves.
 *  0.17–0.40  the ONE supplied difference is introduced in both rooms at the
 *             same moment: in A "authorization requested, as supplied" — the
 *             sign shows ● and the petition gets its ● pin —, in B "decision
 *             supplied, as supplied" — the sign shows ◆ and the decision's
 *             placeholder sheet (content never shown) is laid, with its ◆ pin, in
 *             the prior-examination tray's other slot. Each header names its
 *             state; equal weight.
 *  0.40–0.77  the action runs in both rooms over the same window: the
 *             participant takes the petition and carries it along every step to
 *             the prior-examination tray — in B it is laid beside the supplied
 *             decision's sheet.
 *  0.77–1.00  a guide links sign A with sign B through the free channel above the
 *             rooms; changed fact, neutral note and key.
 * In each room's free floor (the same place in both, clear of the route and of the
 * participant's whole journey) an enlarged inset of the prior-examination tray's
 * decision slot, framed in neutral grey with the tray's plain tab, a thin frame of
 * the same grey round its source slot: A's stays empty; B's receives the decision
 * sheet with the room's own timing (0.24–0.30) — the changed fact, large (review-03).
 * The state pins are not magnified (neither state outweighs the other). No state is preferred;
 *             no criterion, threshold, time limit, rank or outcome is drawn.
 * @module animations/review/LAW-0331
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, lerp, r} from '../../core/time.js';
import {polyline} from '../../core/geometry.js';
import {fitDesign} from '../../core/layout.js';
import {str, list, obj} from '../../schemas/fields.js';
import {pxPerUnit, layoutRows, R2, textAt, centreShiftY} from '../hearings/kits/apertura-audiencia.js';
import {stateGlyph} from '../hearings/kits/hearings-art.js';
import {saFields, courierField, SA_EN, SA_ES, COURIER_EN, COURIER_ES, localisedSa, resolveSa, saRoom, saAction, composeSa, saRowNode, measureRowSa, fitSa, decArt, personBox, examTab, LINE} from './kits/solicitud-autorizacion.js';
import {roundRectPath} from '../../core/geometry.js';

const ID = 'LAW-0331';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {stateIn: [0.24, 0.3], sign: [0.22, 0.3], tags: [0.2, 0.26], fact: [0.22, 0.28], pin: [0.28, 0.32], reach: [0.4, 0.43], lift: [0.43, 0.455], carry: [0.455, 0.7], put: [0.7, 0.72], release: [0.72, 0.745], back: [0.735, 0.765], guide: [0.78, 0.85], guideRow: [0.8, 0.84]};
const DOCK = {landscape: 1.15, square: 0.9, portrait: 1.35};
const SIGNW = {landscape: 118, square: 96, portrait: 118};

/** The inset frame and its source frame: a neutral mid grey (never green or red; not the route's ink). */
const INSET_INK = '#7c8792';
/** The decision sheet's least height in the inset, px at 1080p (review-03: >= 85 px baseline, >= 70 px stress). */
const INSET_MIN = {base: 88, stress: 71, any: 71};

/**
 * Review-03 (the changed fact was a speck): an enlarged inset of the prior-examination tray's decision slot, drawn in
 * each room's free floor — the same place, the same crop and the same magnification in both rooms. The crop is the
 * tray's left slot (up to its divider), where only the supplied decision's sheet can lie: A's stays empty, B's receives
 * the sheet when it is laid in the room. The place is free of every station, the sign, the calendar, every route line
 * and step disc (with clearPx of clearance) and of the participant's and the petition's whole journey, so nothing ever
 * passes over it. Largest magnification first (up to maxM); among the places that fit, the one nearest its source.
 * Template units (the room's own). Returns null when no place fits even at minM.
 */
function placeInset(G, R, k, px, {clearPx = 16, minM = 1.6, maxM = 6} = {}) {
  const tr = G.stations[R.exam].tray;
  const sd = G.stations[R.exam].slotD;
  // (the decision slot and a margin of its tray round it — never as far as the divider or the petition's slot)
  const crop = {x: sd.x - G.DW / 2 - 5, y: sd.y - G.DH / 2 - 5, w: G.DW + 10, h: G.DH + 10};
  const u2px = k * px;
  const clr = clearPx / u2px;
  const pad = 5 / u2px;
  const cell = Math.max(4, 6 / u2px);
  const nx = Math.ceil(G.W / cell), ny = Math.ceil(G.H / cell);
  const blk = new Uint8Array(nx * ny);
  const markRect = (x0, y0, x1, y1) => {
    const i0 = Math.max(0, Math.floor(x0 / cell)), i1 = Math.min(nx - 1, Math.floor(x1 / cell));
    const j0 = Math.max(0, Math.floor(y0 / cell)), j1 = Math.min(ny - 1, Math.floor(y1 / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) blk[j * nx + i] = 1;
  };
  const markCircle = (cx, cy, rad) => {
    const i0 = Math.max(0, Math.floor((cx - rad) / cell)), i1 = Math.min(nx - 1, Math.floor((cx + rad) / cell));
    const j0 = Math.max(0, Math.floor((cy - rad) / cell)), j1 = Math.min(ny - 1, Math.floor((cy + rad) / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const dx = Math.max(i * cell - cx, 0, cx - (i + 1) * cell), dy = Math.max(j * cell - cy, 0, cy - (j + 1) * cell);
      if (dx * dx + dy * dy <= rad * rad) blk[j * nx + i] = 1;
    }
  };
  // (the walls' inner margin)
  markRect(0, 0, G.W, clr * 0.6); markRect(0, G.H - clr * 0.6, G.W, G.H); markRect(0, 0, clr * 0.6, G.H); markRect(G.W - clr * 0.6, 0, G.W, G.H);
  for (const st of G.stations) markRect(st.x - clr, st.y - clr, st.x + st.w + clr, st.y + st.h + clr);
  if (G.sign) markRect(G.sign.x - clr, G.sign.y - clr, G.sign.x + G.sign.w + clr, G.sign.y + G.sign.h + clr);
  markRect(G.clock.cx - G.clock.R - clr, G.clock.cy - G.clock.R * 1.1 - clr, G.clock.cx + G.clock.R + clr, G.clock.cy + G.clock.R * 1.1 + clr);
  for (const a of G.arcs) for (const q of a.pts) markCircle(q.x, q.y, LINE.width / 2 + clr);
  for (const d of G.discs) markCircle(d.x, d.y, G.DR + clr);
  // (the participant's and the petition's whole journey, start to hold)
  for (let i = 0; i <= 400; i++) {
    const ac = saAction(G, W, i / 400, {mode: 'carry'});
    const pb = personBox(ac.person);
    markRect(pb.x - clr * 0.5, pb.y - clr * 0.5, pb.x + pb.w + clr * 0.5, pb.y + pb.h + clr * 0.5);
    const s0 = (ac.doc.s ?? 1) * 1.04;
    markRect(ac.doc.x - G.DW * s0 / 2 - clr * 0.5, ac.doc.y - G.DH * s0 / 2 - clr * 0.5, ac.doc.x + G.DW * s0 / 2 + clr * 0.5, ac.doc.y + G.DH * s0 / 2 + clr * 0.5);
  }
  // (summed-area table of the blocked cells)
  const S = new Int32Array((nx + 1) * (ny + 1));
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) S[(j + 1) * (nx + 1) + i + 1] = blk[j * nx + i] + S[j * (nx + 1) + i + 1] + S[(j + 1) * (nx + 1) + i] - S[j * (nx + 1) + i];
  const sum = (i0, j0, i1, j1) => S[(j1 + 1) * (nx + 1) + i1 + 1] - S[j0 * (nx + 1) + i1 + 1] - S[(j1 + 1) * (nx + 1) + i0] + S[j0 * (nx + 1) + i0];
  const src = {x: crop.x + crop.w / 2, y: crop.y + crop.h / 2};
  const fitAt = M => {
    const w = crop.w * M + 2 * pad, hh = crop.h * M + 2 * pad;
    const ci = Math.ceil(w / cell) + 1, cj = Math.ceil(hh / cell) + 1;
    let best = null;
    for (let j = 0; j + cj <= ny; j++) for (let i = 0; i + ci <= nx; i++) {
      if (sum(i, j, i + ci - 1, j + cj - 1)) continue;
      const x = i * cell + (ci * cell - w) / 2, y = j * cell + (cj * cell - hh) / 2;
      const dd = Math.hypot(x + w / 2 - src.x, y + hh / 2 - src.y);
      if (!best || dd < best.dd) best = {x, y, w, h: hh, dd};
    }
    return best;
  };
  if (!fitAt(minM)) return null;
  let lo = minM, hi = maxM;
  if (fitAt(hi)) lo = hi;
  else for (let it = 0; it < 12; it++) { const mid = (lo + hi) / 2; if (fitAt(mid)) lo = mid; else hi = mid; }
  const M = lo;
  const at = fitAt(M);
  return {M, crop, pad, box: {x: at.x, y: at.y, w: at.w, h: at.h}, slotD: G.stations[R.exam].slotD, tray: tr};
}

const OWN_EN = {
  courier: COURIER_EN,
  scenarioA: {label: 'Scenario A'},
  scenarioB: {label: 'Scenario B'},
  changedFact: 'Only the supplied state differs: authorization requested, or a decision supplied (placeholder)',
  sharedFacts: [],
  objectLabels: {tray: 'Two-slot tray of each station (neutral)', calendar: 'Wall calendar (no date marked)'},
  comparisonLabels: {guide: 'The one supplied difference', neutral: 'Neither state weighs more; nothing is evaluated'},
};
const OWN_ES = {
  courier: COURIER_ES,
  scenarioA: {label: 'Supuesto A'},
  scenarioB: {label: 'Supuesto B'},
  changedFact: 'Solo cambia el estado aportado: autorización solicitada, o decisión suministrada (texto provisional)',
  sharedFacts: [],
  objectLabels: {tray: 'Bandeja de dos huecos de cada puesto (neutra)', calendar: 'Calendario de pared (sin fechas marcadas)'},
  comparisonLabels: {guide: 'La única diferencia aportada', neutral: 'Ningún estado pesa más; no se evalúa nada'},
};
const EN = {...SA_EN, ...OWN_EN};
const ES = {...SA_ES, ...OWN_ES};

const sceneSchema = {
  ...saFields,
  courier: courierField,
  scenarioA: obj('Scenario A: the state "authorization requested" (●, `outcomes.a`) is introduced; its header reads "<label> · <outcomes.a>", with an optional caption', {label: str('Name of scenario A (as supplied)', 50), caption: str('Optional one-line description of A', 90)}, ['label']),
  scenarioB: obj('Scenario B: the state "decision supplied" (◆, `outcomes.b`: the decision\'s placeholder sheet, content never shown) is introduced; its header reads "<label> · <outcomes.b>", with an optional caption', {label: str('Name of scenario B (as supplied)', 50), caption: str('Optional one-line description of B', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 130),
  sharedFacts: list('Facts that stay identical in both rooms (drawn once)', str('Shared fact', 90), 0, 3),
  objectLabels: obj('Captions of the room objects in the legend', {
    tray: str('Caption for the two-slot trays (neutral trays, never an admission gate)', 70),
    calendar: str('Caption for the wall calendar (a fixture only)', 70),
  }, ['tray', 'calendar']),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide linking the two signs', 70), neutral: str('Neutral note (nothing follows from the difference)', 120)}),
};

const defaultParams = {...EN};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedSa(ctx, EN, ES);
    const R = resolveSa(ctx, P);
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
      rows.push({kind: 'legend', glyphKind: 'dec', text: P.decisions.supplied, name: 'lg-dec'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.courier.label, name: 'lg-person'});
      R.bodies.forEach(b => rows.push({kind: 'legend', glyphKind: 'station', letter: b.letter, text: b.label, name: `lg-body${b.index}`}));
      rows.push({kind: 'legend', glyphKind: 'step', text: P.labels.sequence, name: 'lg-step'});
      rows.push({kind: 'legend', glyphKind: 'exam', text: P.labels.exam, name: 'lg-exam'});
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'tray', text: P.objectLabels.tray, name: 'lg-tray'});
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
      const fits = ['a', 'b'].map(s => { const sc = P[s === 'a' ? 'scenarioA' : 'scenarioB']; return fitSa(`${sc.label} · ${P.outcomes[s]}${sc.caption ? ` · ${sc.caption}` : ''}`, {maxWidth: Math.max(80, w - disc * 2 - F * 0.9), size: F, minSize: F, maxLines: 4, weight: 500}); });
      const hh = Math.max(disc * 2, ...fits.map(f => f.height)) + F * 0.3;
      return {h: hh, fits, disc};
    };
    // (four bodies at 1:1: a slightly smaller sheet and sign, so two rooms of four stations keep the people floors)
    const four = R.n >= 4 && shape === 'square';
    const docK = four ? 0.5 : DOCK[shape] * (R.n >= 4 ? 0.85 : R.n === 3 && shape === 'square' ? 0.74 : 1);
    // ---- one candidate: rooms area (for the pair), arrangement, size, room scale
    const compose = (area, arr, F, scale, final = false, extraH = 0, padL = 0) => {
      const chan = 30, side = arr === 'row' ? 0 : 44;
      const rgap = arr === 'row' && shape === 'square' ? 6 : gap;
      const roomsW = arr === 'row' ? (area.w - rgap) / 2 : area.w - side;
      const hd = headerFor(F, roomsW);
      const roomH = arr === 'row' ? area.h - hd.h - chan : (area.h - 2 * (hd.h + chan) - gap) / 2;
      const box = {x: area.x, y: area.y + hd.h + chan, w: roomsW, h: roomH};
      const C = composeSa(ctx, P, R, box, F, {scale, text: false, letters: showKey, numbers: showKey, courier: true, sign: true, untangle: {clearPx: shape === 'square' ? 17.5 : 18}, signW: four ? 84 : SIGNW[shape], docK, gap: shape === 'square' ? (four ? 42 : 50) : 64, align: {x: 0.5, y: arr === 'row' ? 0 : 0.5}, ...(extraH ? {extraH} : {}), ...(padL ? {padL} : {}), ...(final ? {deepen: R.n <= 2 ? 3.5 : 2.2, spread: 1.8} : {})});
      const problems = [...C.problems];
      // each room stays a real subject: >= 0.21 of the frame's height
      if (C.planRect.h / frameHD < (shape === 'landscape' ? 0.225 : 0.205)) problems.push('subject-short');
      // (item 18: side by side, each room keeps >= 0.40 of the frame's width)
      if (arr === 'row' && shape === 'landscape' && C.planRect.w / frameWD < 0.4) problems.push('room-narrow');
      const shift = arr === 'row' ? {x: roomsW + rgap, y: 0} : {x: 0, y: roomH + hd.h + chan + gap};
      return {C, problems, hd, box, shift, roomsW, roomH, chan, side, arr, area, scale};
    };
    // (fix-review-03, cold create: the passes for the people floors try the same candidates — each is composed once per
    // layout; a copy is handed out, its problems a fresh list the search may add to)
    const memo = new Map();
    const composeOnce = (area, arr, F, scale) => {
      const key = `${r(area.x, 2)}|${r(area.y, 2)}|${r(area.w, 2)}|${r(area.h, 2)}|${arr}|${r(F, 4)}|${scale}`;
      if (!memo.has(key)) memo.set(key, compose(area, arr, F, scale));
      const c = memo.get(key);
      return {...c, problems: [...c.problems]};
    };
    const arrangements = [];
    if (shape === 'landscape') {
      for (const cf of [0.22, 0.26, 0.3]) arrangements.push({arr: 'row', panel: 'column', cf});
      for (const cols of [3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
    } else if (shape === 'portrait') {
      for (const cols of [2, 3]) arrangements.push({arr: 'col', panel: 'band', cols});
    } else {
      for (const cols of [2, 3, 4]) arrangements.push({arr: 'row', panel: 'band', cols});
      // (side by side only: each room >= 0.40 of the frame width — coordinator, review-03)
    }
    let best = null;
    const log = [];
    // standing people floors (review = hearings, FIGURE): >= 60 px; 1:1 >= 55 px (composed to 57 for margin); the
    // stress floor of 45 px only when no composition reaches 55 at 1:1 — or, off 1:1, for long-labels-stress (STRESS
    // PEOPLE FLOOR OFF 1:1)
    const floors = shape === 'square' ? [[57.5, 19.5], [57.5, 0], [47, 0]] : [[62.5, 19.5], [62.5, 0], [47, 0]];
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
                const ms = rows.map(rw => measureRowSa(rw, F, pw));
                const probe = lay(ms, {x: 0, y: 0, w: pw, h: 1e6}, F, 1);
                if (!probe.ok || probe.usedH > D.h) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: D.w - pw, y: Math.max(0, (D.h - probe.usedH) / 2), w: pw, h: probe.usedH};
                L0 = layoutRows(ms, panelBox, F, 1, 28);
                area = {x: 0, y: 0, w: D.w - pw - gap, h: D.h};
              } else {
                const colW = (D.w - 28 * (A.cols - 1)) / A.cols;
                const ms = rows.map(rw => measureRowSa(rw, F, colW));
                const probe = lay(ms, {x: 0, y: 0, w: D.w, h: 1e6}, F, A.cols);
                if (!probe.ok || probe.usedH > D.h * (shape === 'square' ? 0.53 : 0.45)) { if (!force) continue; extra.push('panel-overflow'); }
                const panelBox = {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH};
                L0 = layoutRows(ms, panelBox, F, A.cols, 28);
                area = {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap};
              }
            }
            for (const scale of [1, 1.15, 1.3]) {
              const cc = composeOnce(area, A.arr, F, scale);
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
    // (review-03: the inset of the decision slot needs free floor away from the route and the participant's journey. When
    // the composed room has none large enough, floor is added on the left of the row, under the sign and calendar, or
    // else under the lane — the least that brings the inset to its size, as long as the people keep their floor: 1:1
    // 55 px, else 60 px; long-labels-stress (composed under the stress floor) 45 px)
    const stressed = best.personPx < 55;
    const floorPx = stressed ? 45.3 : shape === 'square' ? 55.3 : 60.3;
    const want = stressed ? INSET_MIN.stress : INSET_MIN.base;
    const sheetPx = (f, I) => (I ? I.M * f.C.G.DH * f.C.k * px : 0);
    const withInset = (area, Fx, scale) => {
      let fin = compose(area, best.arr, Fx, scale, true);
      let inset = placeInset(fin.C.G, R, fin.C.k, px, {clearPx: 16});
      if (sheetPx(fin, inset) >= want) return {fin, inset, sp: sheetPx(fin, inset)};
      let pick = null;
      for (const mode of ['left', 'below']) {
        const tryAdd = add => {
          const f2 = mode === 'left' ? compose(area, best.arr, Fx, scale, true, 0, add) : compose(area, best.arr, Fx, scale, true, add, 0);
          if (f2.problems.filter(q => q !== 'people-small').length || 100 * f2.C.k * px < floorPx) return null;
          const I2 = placeInset(f2.C.G, R, f2.C.k, px, {clearPx: 16});
          const c = {f2, I2, sp: sheetPx(f2, I2)};
          if (!pick || c.sp > pick.sp + 0.5) pick = c;
          return c;
        };
        // (coarse steps, then halving between the last step that keeps the people's floor and the first that does not)
        let lo = 0, hi = null;
        for (const add of [40, 80, 120, 170, 230, 300, 380]) {
          const c = tryAdd(add);
          if (!c) { hi = add; break; }
          lo = add;
          if (c.sp >= want) break;
        }
        if (hi !== null && !(pick && pick.sp >= want)) for (let it = 0; it < 3; it++) { const mid = (lo + hi) / 2; if (tryAdd(mid)) lo = mid; else hi = mid; }
        if (pick && pick.sp >= want) break;
      }
      if (pick && pick.sp > sheetPx(fin, inset)) { fin = pick.f2; inset = pick.I2; }
      return {fin, inset, sp: sheetPx(fin, inset)};
    };
    let res = withInset(best.area, best.F, best.scale);
    // (an inset under the least size even so: the panel's text one step smaller at a time — never under its floor —
    // leaves the rooms more height)
    if (res.sp < INSET_MIN.any && best.A && best.A.panel === 'band' && rows.length) {
      for (const Fpx of [21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4].filter(q => q < best.F * px - 0.05)) {
        const Fx = Fpx / px;
        const colW = (D.w - 28 * (best.A.cols - 1)) / best.A.cols;
        const ms = rows.map(rw => measureRowSa(rw, Fx, colW));
        const probe = lay(ms, {x: 0, y: 0, w: D.w, h: 1e6}, Fx, best.A.cols);
        if (!probe.ok || probe.usedH > D.h * (shape === 'square' ? 0.53 : 0.45)) continue;
        const area = {x: 0, y: 0, w: D.w, h: D.h - probe.usedH - gap};
        const r2 = withInset(area, Fx, best.scale);
        if (r2.sp > res.sp + 0.5) {
          res = r2;
          best = {...best, F: Fx, area, lay: layoutRows(ms, {x: 0, y: D.h - probe.usedH, w: D.w, h: probe.usedH}, Fx, best.A.cols, 28)};
        }
        if (r2.sp >= INSET_MIN.any) break;
      }
    }
    const {fin, inset} = res;
    const {F} = best;
    const {C, hd, shift, arr} = fin;
    const G = C.G;
    const problems = [...best.problems, ...fin.problems.filter(q => q !== 'people-small' && !best.problems.includes(q))];
    // (the inset of the decision slot: the same in both rooms)
    if (!inset) problems.push('inset-none');
    const roomA = saRoom(ctx, G, {prefix: 'ra', R, Ft: G.Ft, numbers: showKey, dec: true, ghost: false});
    const roomB = saRoom(ctx, G, {prefix: 'rb', R, Ft: G.Ft, numbers: showKey, dec: true, ghost: false});
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
    return {dyC, P, R, F, px, C, G, lay: best.lay, headers, roomA, roomB, shift, arr, guide, pts, log, problems, personPx: 100 * C.k * px, showKey, inset};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => saRowNode(ctx, m, {name: m.name, look: L.R.courier.look})) : [];
    // (lane colours: blue and violet — neither green nor red, which could read as approval or refusal)
    const lanes = [th.accent2, '#6f5a96'];
    // the inset of the prior-examination tray's decision slot, in each room's free floor: its frame, the enlarged copy of
    // the slot (clipped to the crop) and, round the source slot, a thin frame of the same grey
    const insetNode = pf => {
      const I = L.inset;
      if (!I) return null;
      const {M, crop, box: B, tray: tr, slotD} = I;
      const G = L.G;
      const cid = `${pf}-ins-clip`;
      const ox = B.x + I.pad - crop.x * M, oy = B.y + I.pad - crop.y * M;
      const upx = L.C.k * L.px;
      return g({name: `${pf}-ins`},
        h('defs', null, h('clipPath', {id: ctx.id(cid)}, h('rect', {x: r(B.x + I.pad), y: r(B.y + I.pad), width: r(crop.w * M), height: r(crop.h * M)}))),
        h('path', {d: roundRectPath(crop.x - 2, crop.y - 2, crop.w + 4, crop.h + 4, 5), fill: 'none', stroke: INSET_INK, 'stroke-width': r(3 / upx, 2), name: `${pf}-ins-src`}),
        h('path', {d: roundRectPath(B.x + 4, B.y + 6, B.w, B.h, 10), fill: th.shadow}),
        // (the inset carries the prior-examination tray's plain tab, as its source tray does)
        examTab({x: B.x + B.w * 0.1, y: B.y, w: B.w * 0.8, h: B.h}, undefined),
        h('path', {name: `${pf}-ins-frame`, d: roundRectPath(B.x, B.y, B.w, B.h, 10), fill: '#f7f8f9', stroke: INSET_INK, 'stroke-width': r(3.5 / upx, 2)}),
        g({'clip-path': ctx.ref(cid)},
          g({transform: `${T(ox, oy)} scale(${r(M, 4)})`},
            h('path', {d: roundRectPath(tr.x, tr.y, tr.w, tr.h, 6), fill: '#dfe4e9', stroke: '#5b6470', 'stroke-width': 2}),
            h('path', {d: `M${r(tr.x + 6)} ${r(tr.y + 7)}H${r(tr.x + tr.w - 6)}`, stroke: '#c3cad1', 'stroke-width': 3, 'stroke-linecap': 'round'}),
            h('path', {d: `M${r(tr.x + tr.w / 2)} ${r(tr.y + 12)}V${r(tr.y + tr.h - 8)}`, stroke: '#aab3bc', 'stroke-width': 2.4, 'stroke-linecap': 'round'}),
            // (the sheet only: the state pins — ● on A's petition, ◆ on B's decision — stay at room size in both rooms,
            // so neither state is magnified over the other)
            g({name: `${pf}-ins-dec`, opacity: 0, transform: T(slotD.x, slotD.y)},
              g({name: `${pf}-ins-dec-k`, transform: 'scale(1)'}, decArt(ctx, G.DW, G.DH))))));
    };
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'roomA', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.roomA.node, insetNode('ra')),
      g({name: 'roomB', transform: `${T(C.ox + L.shift.x, C.oy + L.shift.y)} scale(${r(C.k, 5)})`}, L.roomB.node, insetNode('rb')),
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
    // introduce (the same window in both rooms): the sign shows the state — ● in A, ◆ in B —; A's petition gets its ● pin,
    // B's decision placeholder sheet is laid (from a little above: larger, fading in as it settles) in the
    // prior-examination tray's other slot with its ◆ pin
    const stIn = ease.inOutCubic(seg(u, ...W.stateIn));
    const sign = e(seg(u, ...W.sign));
    const pinK = seg(u, ...W.pin);
    const aA = saAction(G, W, u, {mode: 'carry'});
    const aB = saAction(G, W, u, {mode: 'carry'});
    const fa = L.roomA.frame({doc: aA.doc, person: aA.person, reach: aA.reach, covers: aA.covers, route: {solid: 1}, sign: {a: sign}, pin: {a: pinK}, dec: {op: 0}});
    const fb = L.roomB.frame({doc: aB.doc, person: aB.person, reach: aB.reach, covers: aB.covers, route: {solid: 1}, sign: {b: sign}, dec: {op: stIn, s: lerp(1.12, 1, stIn), pin: {b: pinK}}});
    Object.assign(nodes, fa.nodes, fb.nodes);
    // (review-03 fix: while a sheet passes near a step disc the WHOLE disc fades with its number — never an empty white
    // circle; the room hides only the number, so its opacity is moved to the disc's group)
    for (const pf of ['ra', 'rb']) G.discs.forEach((_, j) => {
      const n = nodes[`${pf}-step${j}-n`];
      if (!n) return;
      nodes[`${pf}-step${j}`] = {opacity: n.opacity};
      nodes[`${pf}-step${j}-n`] = {opacity: 1};
    });
    // (the inset mirrors each room's decision slot: A's stays empty, B's receives the sheet with the room's own timing)
    if (L.inset) for (const [pf, op] of [['ra', 0], ['rb', stIn]]) {
      nodes[`${pf}-ins-dec`] = {opacity: r(op, 3)};
      nodes[`${pf}-ins-dec-k`] = {transform: `scale(${r(op ? lerp(1.12, 1, stIn) : 1, 4)})`};
    }
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
    const look = (a, dec, pin, signOp) => JSON.stringify({p: R2(C.toD(a.person)), d: R2(C.toD(a.doc)), dec: r(dec, 3), pin: r(pin, 3), sign: r(signOp, 3), reach: r(a.k, 3)});
    return {
      nodes,
      semantic: {
        beat,
        lookA: look(aA, 0, pinK, sign),
        lookB: look(aB, stIn, pinK, sign),
        tags: r(tags, 3),
        stateA: r(stIn, 3),
        stateB: r(stIn, 3),
        signA: r(sign, 3),
        signB: r(sign, 3),
        phaseA: aA.phase,
        phaseB: aB.phase,
        docA: near(aA.doc),
        docB: near(aB.doc),
        decB: r(stIn, 3),
        exam: L.R.exam,
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
        insetM: L.inset ? r(L.inset.M, 3) : 0,
        insetSheetPx: L.inset ? r(L.inset.M * G.DH * C.k * L.px, 1) : 0,
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
    slug: 'review-03-contrast',
    title: 'Authorization request — the same petition passing to the prior-examination tray, with the state supplied as "authorization requested" or as "decision supplied", in two identical rooms',
    titleEs: 'Solicitud de autorización — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Solicitud de autorización',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical generic rooms: the same abstract stations of the same size on one row with their neutral two-slot trays (the last stop\'s being the prior-examination tray), the same configured path with its numbered steps, the same placeholder petition in the first tray and the same participant. At the same moment the one supplied difference is introduced: in A "authorization requested, as supplied" (● on the sign, a ● pin on the petition), in B "decision supplied, as supplied" (◆ on the sign; the decision\'s placeholder sheet, content never shown, laid with its ◆ pin in the prior-examination tray\'s other slot). The action then runs over the same window in both: the participant carries the petition along every step to the prior-examination tray. A guide links the two signs. Illustrative; neither state is preferred; no criterion, threshold, time limit, rank or outcome is drawn; jurisdiction unspecified.',
    tags: ['review', 'authorization request', 'contrast', 'two rooms', 'authorization requested as supplied', 'decision supplied as supplied', 'placeholder decision', 'prior-examination tray', 'abstract stations', 'equal size', 'equal weight'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
