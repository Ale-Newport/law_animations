/**
 * LAW-0351 — Devolución para nuevo examen · contrast
 *
 * Storyboard (two complete route boards of the same size — side by side on wide frames, one above the other on tall
 * ones — each with the same supplied points (in-trays under their plates), the same review desk mat, the same lane
 * with chevron arrows, the same filter doors (only the configured point's stand open) and the same calendar; only
 * ONE fact differs: how the folder reaches the configured point):
 *  0.00–0.17  base: both boards identical and empty — no folder on either desk yet.
 *  0.17–0.40  the changed fact, localised: in A ("initial examination") the folder slides in from the left edge onto
 *             the lane's entry, with no notes; in B ("renewed examination") the folder slides in from the right edge
 *             onto the review mat with a slip of review notes clipped to it.
 *  0.40–0.77  in parallel and with the same timing, the folder runs along the lane to the open doors of the same
 *             configured point and into its tray — A from the entry, B back from the review desk.
 *  0.77–1.00  the guide: a highlight outline round each folder at its tray joined by one leader with its label
 *             ("only this differs"); under each board its supplied caption; the neutral note and key. No winner, no
 *             score, no result of either examination — the renewed examination is not shown.
 * @module animations/review/LAW-0351
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, list, obj} from '../../schemas/fields.js';
import {polyline} from '../../core/geometry.js';
import {deskWindow} from '../../primitives/desk.js';
import {chip} from '../../primitives/annotate.js';
import {
  dnFields, DN_EN, DN_ES, localisedDn, resolveDn, boardModel, laneArt, folderArt, slipArt, trayArt, matArt, plateArt,
  doorArt, doorT, calendarNode, chevron, panelLayout, panelNode, fitG, textAt, INK, R2,
} from './kits/devolucion-nuevo-examen.js';

const ID = 'LAW-0351';
const DURATION = 7500;
const CHANGE_AT = 0.17;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {enter: [0.19, 0.38], run: [0.42, 0.72], guide: [0.77, 0.83], states: [0.78, 0.83], notes: [0.8, 0.85]};
const SIZES = [23, 22, 21, 20.5, 20, 19.5, 19, 18, 17, 16.5, 16];

const OWN_EN = {
  scenarioA: {label: 'Initial examination', caption: 'The folder reaches the point for the first time, without notes (as supplied)'},
  scenarioB: {label: 'Renewed examination', caption: 'The folder comes back to the same point with review notes (as supplied)'},
  changedFact: 'Only how the folder reaches the configured point differs',
  sharedFacts: ['Same points, doors and review desk', 'Same folder and decision'],
  comparisonLabels: {guide: 'only this differs', neutral: 'Two supplied situations side by side: no winner, no result of either examination'},
};
const OWN_ES = {
  scenarioA: {label: 'Examen inicial', caption: 'La carpeta llega al punto por primera vez, sin notas (según lo aportado)'},
  scenarioB: {label: 'Examen renovado', caption: 'La carpeta vuelve al mismo punto con notas de revisión (según lo aportado)'},
  changedFact: 'Solo cambia cómo llega la carpeta al punto configurado',
  sharedFacts: ['Mismos puntos, puertas y mesa de revisión', 'Misma carpeta y resolución'],
  comparisonLabels: {guide: 'solo esto cambia', neutral: 'Dos situaciones aportadas lado a lado: sin ganador ni resultado de ningún examen'},
};
const EN = {...DN_EN, ...OWN_EN};
const ES = {...DN_ES, ...OWN_ES};

const sceneSchema = {
  ...dnFields,
  scenarioA: obj('Scenario A (the folder reaches the configured point for the first time, without notes)', {label: str('Short label for scenario A', 50), caption: str('Caption under scene A, shown in the guide beat', 100)}, ['label', 'caption']),
  scenarioB: obj('Scenario B (the folder comes back from the review desk with the supplied notes)', {label: str('Short label for scenario B', 50), caption: str('Caption under scene B, shown in the guide beat', 100)}, ['label', 'caption']),
  changedFact: str('The single fact that differs between A and B (here: how the folder reaches the configured point)', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide joining the changed detail', 50), neutral: str('Neutral note (no winner, no outcome)', 120)}, ['guide', 'neutral']),
};

const defaultParams = {...EN};

const LANE_COLOR = th => [th.accent2, th.cloth[3]];

function compose(ctx, P, R, F, v) {
  const {w: DW, h: DH} = ctx.design;
  const showKey = ctx.show('key');
  const showAll = ctx.show('all');
  const arr = v.arr;
  const problems = [];
  const gapS = arr === 'row' ? F * 1.6 : F * 1.0;
  const SWv = v.side ? DW * v.side + F * 1.4 : 0;
  const stageW = arr === 'row' ? (DW - SWv - gapS) / 2 : DW - SWv;
  // headers
  const badgeR = F * 0.95;
  const hx = arr === 'column' ? F * 1.6 : 0;
  const headW = stageW - hx - badgeR * 2 - F * 0.8;
  const heads = ['a', 'b'].map(k => {
    const sc = k === 'a' ? P.scenarioA : P.scenarioB;
    const lab = showKey ? fitG(sc.label, {maxWidth: headW, size: F * 1.1, minSize: F, maxLines: 2, weight: 700}) : null;
    if (lab && !lab.ok) problems.push('header-text');
    return {lab, h: Math.max(badgeR * 2, lab ? lab.height : 0) + F * 0.45};
  });
  const headH = Math.max(heads[0].h, heads[1].h);
  // state lines under each scene (the scenario captions)
  const capW = stageW - hx - F * 0.4;
  const caps = ['a', 'b'].map(k => (showKey ? fitG((k === 'a' ? P.scenarioA : P.scenarioB).caption, {maxWidth: capW, size: F, minSize: F, maxLines: 3, weight: 600}) : null));
  caps.forEach(c => { if (c && !c.ok) problems.push('caption-text'); });
  const capH = showKey ? Math.max(...caps.map(c => c.height)) + F * 0.5 : 0;
  // guide band
  const guideChip = showAll ? chip(ctx, P.comparisonLabels.guide, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.min(DW * 0.5, 420), size: F, minSize: F, maxLines: 2, weight: 600}) : null;
  if (guideChip && guideChip.fit.truncated) problems.push('guide-text');
  const bandH = Math.max(F * 2, guideChip ? guideChip.box.h + F * 0.7 : 0);
  // shared strip
  const rowsL = [], rowsR = [];
  if (showKey) rowsL.push({kind: 'heading', icon: 'lane', text: P.labels.route, name: 'sh-route'});
  // the other supplied points share one compact row
  const others = P.routes.stations.filter((s, i) => i !== R.target);
  if (showKey && others.length) rowsL.push({kind: 'item', icon: 'tray', text: others.join(' · '), name: 'sh-st'});
  if (showKey) rowsL.push({kind: 'item', icon: 'folder', text: P.decisions.title, name: 'sh-folder'});
  if (showKey) rowsL.push({kind: 'item', icon: 'pin', text: P.labels.point, name: 'sh-point'});
  if (showKey) R.notes.forEach((t, i) => rowsL.push({kind: 'item', icon: 'note', index: i, text: t, name: `sh-note${i}`}));
  if (showAll) P.sharedFacts.forEach((f, i) => rowsR.push({kind: 'item', icon: 'tray', text: f, name: `sh-fact${i}`}));
  if (showKey) rowsR.push({kind: 'item', icon: 'ring', color: ctx.theme.accent3, text: P.changedFact, name: 'sh-changed'});
  if (showKey) rowsR.push({kind: 'item', icon: 'blank', text: P.outcomes.renewed, name: 'sh-renewed'});
  if (showAll) rowsR.push({kind: 'state', text: P.comparisonLabels.neutral, name: 'sh-neutral'});
  if (showKey) rowsR.push({kind: 'key', text: P.labels.key, name: 'key'});
  let strip = null;
  const all = [...rowsL, ...rowsR];
  let SW = 0; // width taken by a side-column strip (the boards use the rest)
  if (all.length && v.side) {
    const cw = DW * v.side;
    const PLc = panelLayout(ctx, all, {w: cw, F});
    if (!PLc.ok) problems.push('strip-text');
    if (PLc.h > DH) problems.push('strip-tall');
    SW = cw + F * 1.4;
    strip = {cols: [{PL: PLc, x: 0}], h: PLc.h, side: true, x: DW - cw, y: Math.max(0, (DH - PLc.h) / 2)};
  } else if (all.length) {
    // the shared strip in `sc` columns (rows keep their order; the closing rows end the last column)
    const sc = v.sc ?? 2;
    const cg = F * 1.6;
    const cw = (DW - cg * (sc - 1)) / sc;
    const per = Math.ceil(all.length / sc);
    const cols = [];
    for (let c = 0; c < sc; c++) {
      const part = all.slice(c * per, (c + 1) * per);
      if (!part.length) continue;
      const PLc = panelLayout(ctx, part, {w: cw, F, maxLines: sc >= 3 ? 4 : 3});
      if (!PLc.ok) problems.push('strip-text');
      cols.push({PL: PLc, x: c * (cw + cg)});
    }
    strip = {cols, h: Math.max(...cols.map(c => c.PL.h)), x: 0};
  }
  const stripH = strip && !strip.side ? strip.h + F * 0.8 : 0;
  // stage height: what remains
  let stageH;
  if (arr === 'row') stageH = DH - headH - bandH - capH - stripH;
  else stageH = (DH - headH * 2 - bandH - capH * 2 - stripH - F * 0.6) / 2;
  stageH = Math.min(stageH, v.maxStage ?? 1e9);
  if (stageH < F * 9) problems.push('stage-small');
  const inset = Math.max(10, F * 0.6);
  const box = {x: inset, y: inset, w: stageW - inset * 2, h: stageH - inset * 2};
  // each board shows the configured point (its tray under its plate) and the review desk; an entry zone on the left
  // is where A's folder comes in (the other supplied points are listed in the shared strip)
  const ez = box.w * v.ez;
  const bbox = {x: box.x + ez, y: box.y, w: box.w - ez, h: box.h};
  const B = boardModel(ctx, {orient: 'row', box: bbox, F, names: [P.routes.stations[R.target]], origin: P.routes.origin, showText: showKey, target: 0, slipN: R.notes.length, handRoom: F * 0.6, maxFw: 340, reviewW: v.rw ?? 1.1, plateLines: v.pl ?? 3, plateExtL: ez * 0.75});
  // (B's notes slip arrives clipped to the folder, so the review mat needs no room for it: the slip is sized on the folder)
  B.slipS = B.fw * 0.36;
  // (the calendar stands in the entry zone, left of the tray — the review mat's right side stays free)
  problems.push(...B.problems.filter(q => q !== 'calendar-small' && q !== 'slip-small'));
  {
    const S0 = B.slots[0];
    const cw = Math.min(B.fw * 0.42, S0.tray.x - box.x - F * 0.9);
    B.cal = {w: cw, h: cw * 0.82, x: box.x + F * 0.4, y: S0.tray.y + S0.tray.h * 0.2};
    if (cw < F * 2.2) problems.push('calendar-small');
  }
  // vertical stack
  let stages, bandY, capY, total;
  if (arr === 'row') {
    total = headH + stageH + bandH + capH + stripH;
    stages = [0, 1].map(i => ({x: i * (stageW + gapS), y: headH, w: stageW, h: stageH, headY: 0}));
    bandY = headH + stageH;
    capY = [bandY + bandH, bandY + bandH];
  } else {
    total = headH * 2 + stageH * 2 + bandH + capH * 2 + stripH + F * 0.6;
    const yB = headH + stageH + capH + bandH;
    stages = [{x: 0, y: headH, w: stageW, h: stageH, headY: 0}, {x: 0, y: yB + headH, w: stageW, h: stageH, headY: yB}];
    capY = [headH + stageH + F * 0.2, yB + headH + stageH + F * 0.2];
    bandY = headH + stageH + capH;
  }
  if (total > DH + 0.5) problems.push('too-tall');
  const dy = Math.max(0, (DH - total) / 2);
  stages.forEach(s => { s.y += dy; s.headY += dy; });
  bandY += dy; capY = capY.map(y => y + dy);
  if (strip && !strip.side) strip.y = dy + total - strip.h;
  const stripY = strip ? strip.y : 0;
  // stage-local paths: A enters from the left edge onto the lane's entry; B from the right edge onto the review mat
  const L = B.lane;
  const S = B.slots[0];
  const Rv = B.slots[B.n];
  const entry = {x: Math.max(box.x + B.fw * 0.5 + F * 0.2, S.rest.x - B.fw * 1.15), y: L.a.y};
  const offL = {x: -B.fw * 0.75, y: L.a.y};
  const offR = {x: stageW + B.fw * 0.9, y: Rv.rest.y};
  const enterA = polyline([offL, entry]);
  const enterB = polyline([offR, Rv.rest]);
  const runA = polyline([entry, {x: S.rest.x, y: L.a.y}, S.rest]);
  const runB = polyline([Rv.rest, {x: Rv.rest.x, y: L.a.y}, {x: S.rest.x, y: L.a.y}, S.rest]);
  if (S.rest.x - entry.x < B.fw * 0.7) problems.push('entry-close');
  const slipOff = {x: B.fw * 0.3, y: -B.fh * 0.2};
  return {F, arr, stageW, stageH, stages, heads, headH, hx, badgeR, caps, capY, capH, bandY, bandH, guideChip, strip, stripY, box, B, enterA, enterB, runA, runB, entry, slipOff, inset, ok: !problems.length, problems};
}

const scene = {
  // (design spaces fill the caption-safe box: 0.88 × 0.74 of the frame)
  sizes: {landscape: [1690, 790], square: [950, 790], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedDn(ctx, EN, ES);
    const R = resolveDn(P);
    const shape = ctx.view.shape;
    const rowV = [0.14, 0.18, 0.24, 0.3].flatMap(ez => [3, 4].flatMap(pl => [1.1, 0.9, 0.75].map(rw => ({arr: 'row', ez, pl, rw}))));
    const colV = [0.14, 0.24, 0.3].flatMap(ez => [3, 4].map(pl => ({arr: 'column', ez, pl})));
    const vs = shape === 'landscape' ? [...[3, 4].flatMap(sc => rowV.map(x => ({...x, sc}))), ...[0.2, 0.24].flatMap(side => rowV.map(x => ({...x, side})))]
      : shape === 'portrait' ? [3, 2].flatMap(sc => colV.map(x => ({...x, sc})))
        : [...[3, 2].flatMap(sc => colV.map(x => ({...x, sc}))), ...[0.3, 0.36].flatMap(side => colV.map(x => ({...x, side}))), ...rowV.map(x => ({...x, sc: 2}))];
    let C = null, best = null;
    // the boards are the subject: among the sizes that compose, keep the composition with the largest folder (weighted
    // mildly by the text size); text starts at 20.5 so the strip stays compact
    const score = c => c.B.fw * Math.sqrt(c.F);
    let tried = 0;
    for (const F of SIZES.filter(f => f <= 20.5)) {
      let found = null;
      for (const v of vs) {
        const c = compose(ctx, P, R, F, v);
        if (c.ok) { if (!found || score(c) > score(found)) found = c; }
        else if (!best || c.problems.length < best.problems.length) best = c;
      }
      if (found && (!C || score(found) > score(C))) C = found;
      if (C && (++tried >= 3 || F <= 19.5)) break; // (supplied text stays >= 19.5 px whenever a composition allows it)
    }
    return {P, R, C: C || best};
  },
  build(ctx, L) {
    const {C, R, P} = L;
    const th = ctx.theme;
    const showKey = ctx.show('key');
    const lanes = LANE_COLOR(th);
    const B = C.B;
    const stageNodes = C.stages.map((S, i) => {
      const k = i ? 'B' : 'A';
      const desk = deskWindow(ctx, {prefix: `desk${k}`, x: 0, y: 0, w: S.w, h: S.h, radius: 22, seedKey: 'dn-contrast-desk'});
      const hd = C.heads[i];
      const header = g({name: `head${k}`, transform: T(S.x + C.hx, S.headY)},
        h('circle', {cx: r(C.badgeR), cy: r(C.badgeR + 2), r: r(C.badgeR), fill: lanes[i], stroke: INK, 'stroke-width': 2.5}),
        showKey ? h('text', {x: r(C.badgeR), y: r(C.badgeR + 2 + C.F * 0.36), 'text-anchor': 'middle', 'font-size': r(C.F), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, k) : null,
        hd.lab ? textAt(hd.lab, {x: C.badgeR * 2 + C.F * 0.6, y: 2 + Math.max(0, C.badgeR - hd.lab.size * 0.62), fill: th.fg}) : null,
      );
      const slots = B.slots.map(s => g(null,
        g({transform: T(s.plate.x, s.plate.y)}, plateArt(ctx, {w: s.plate.w, h: s.plate.h, F: C.F, fit: s.plate.fit, pin: s.station})),
        g({transform: T(s.tray.x, s.tray.y)}, s.station ? trayArt(ctx, {w: s.tray.w, h: s.tray.h, mouth: 'bottom'}) : matArt(ctx, {w: s.tray.w, h: s.tray.h})),
      ));
      const doors = B.doors.map(d => d.halves.map(hv => g({transform: doorT(hv, 1)}, doorArt(ctx, {len: hv.len, t: B.doorT}))));
      const slip = k === 'B' ? g({name: 'slipB'}, slipArt(ctx, {n: R.notes.length, s: B.slipS}).node) : null;
      const cap = C.caps[i];
      return g(null, header,
        g({name: `stage${k}`, transform: T(S.x, S.y)},
          desk.surface,
          g({'clip-path': desk.clip},
            laneArtEntry(ctx, B, 0),
            runChevrons(B, k === 'A' ? C.entry.x : B.slots[B.n].rest.x, B.slots[0].rest.x, `chev${k}`),
            slots,
            g({transform: T(B.cal.x, B.cal.y)}, calendarNode(ctx, {prefix: `cal${k}`, w: B.cal.w, h: B.cal.h})),
            doors,
            g({name: `folder${k}`, opacity: 0}, folderArt(ctx, {w: B.fw, h: B.fh})),
            slip,
          ),
          desk.frame,
        ),
        cap ? g({name: `cap${k}`, opacity: 0, transform: T(S.x + C.hx + C.F * 0.2, C.capY[i])},
          textAt(cap, {x: 0, y: 0, fill: th.fg})) : null,
      );
    });
    // guide: an outline round each folder at its tray, one leader joining them, its chip in the band
    const gc = th.accent3;
    const S = B.slots[0];
    const pad = C.F * 0.45;
    const ob = C.stages.map(st => ({x: st.x + S.rest.x - B.fw / 2 - pad, y: st.y + S.rest.y - B.fh / 2 - pad * 1.6, w: B.fw + pad * 2 + B.slipS * 0.3, h: B.fh + pad * 2.6}));
    const parts = ob.map(b => h('rect', {x: r(b.x), y: r(b.y), width: r(b.w), height: r(b.h), rx: 12, fill: 'none', stroke: gc, 'stroke-width': 5}));
    const bandMid = C.bandY + C.bandH / 2;
    let chipNode = null;
    if (C.arr === 'row') {
      const lx = ob.map(b => b.x + C.F * 0.8);
      ob.forEach((b, i) => parts.push(h('path', {d: `M${r(lx[i])} ${r(b.y + b.h)}V${r(bandMid)}`, fill: 'none', stroke: gc, 'stroke-width': 4})));
      parts.push(h('path', {d: `M${r(lx[0])} ${r(bandMid)}H${r(lx[1])}`, fill: 'none', stroke: gc, 'stroke-width': 4}));
      if (C.guideChip) chipNode = chip(ctx, P.comparisonLabels.guide, {x: (C.stages[0].x + C.stages[0].w + C.stages[1].x) / 2, y: bandMid - C.guideChip.box.h / 2, anchor: 'middle', maxWidth: Math.min(ctx.design.w * 0.5, 420), size: C.F, minSize: C.F, maxLines: 2, weight: 600, stroke: gc}).node;
    } else {
      const mx = C.F * 0.7;
      const ly = b => b.y + b.h - C.F * 0.4;
      parts.push(h('path', {d: `M${r(ob[0].x)} ${r(ly(ob[0]))}H${r(mx)}V${r(ly(ob[1]))}H${r(ob[1].x)}`, fill: 'none', stroke: gc, 'stroke-width': 4, 'stroke-linejoin': 'round'}));
      if (C.guideChip) chipNode = chip(ctx, P.comparisonLabels.guide, {x: mx + C.F * 0.9, y: bandMid - C.guideChip.box.h / 2, anchor: 'start', maxWidth: Math.min(ctx.design.w * 0.5, 420), size: C.F, minSize: C.F, maxLines: 2, weight: 600, stroke: gc}).node;
    }
    return g({name: 'scene'},
      stageNodes,
      g({name: 'guide', opacity: 0}, parts, chipNode),
      C.strip ? g({name: 'strip', transform: T(C.strip.x, C.stripY)}, C.strip.cols.map(col => g({transform: T(col.x, 0)}, panelNode(ctx, col.PL)))) : null,
    );
  },
  frame(ctx, L, u) {
    const {C} = L;
    const B = C.B;
    const nodes = {};
    const kIn = ease.inOutCubic(seg(u, ...W.enter));
    const kRun = ease.inOutCubic(seg(u, ...W.run));
    const shown = u >= W.enter[0];
    const posA = kRun > 0 ? C.runA.at(kRun) : C.enterA.at(kIn);
    const posB = kRun > 0 ? C.runB.at(kRun) : C.enterB.at(kIn);
    nodes.folderA = {transform: T(posA.x, posA.y), opacity: shown ? 1 : 0};
    nodes.folderB = {transform: T(posB.x, posB.y), opacity: shown ? 1 : 0};
    const sl = {x: posB.x + C.slipOff.x, y: posB.y + C.slipOff.y};
    nodes.slipB = {transform: T(sl.x, sl.y), opacity: shown ? 1 : 0};
    const chk = r(seg(u, W.enter[0], W.enter[0] + 0.06), 3);
    nodes.chevA = {opacity: chk};
    nodes.chevB = {opacity: chk};
    const gk = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gk, 3)};
    const st = seg(u, ...W.states);
    if (C.caps[0]) { nodes.capA = {opacity: r(st, 3)}; nodes.capB = {opacity: r(st, 3)}; }
    if (C.strip) for (const col of C.strip.cols) for (const rw of col.PL.rows) if (rw.name === 'sh-neutral') nodes[rw.name] = {opacity: r(seg(u, ...W.notes), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const S = B.slots[0];
    const look = (p, notes, dir) => (shown ? {shown: true, folder: R2(p), notes, route: dir} : {shown: false});
    const world = (i, p) => ({x: r(C.stages[i].x + p.x), y: r(C.stages[i].y + p.y)});
    const at = p => Math.hypot(p.x - S.rest.x, p.y - S.rest.y) < 1;
    return {
      nodes,
      semantic: {
        beat,
        lookA: look(posA, false, 'from-entry'), lookB: look(posB, true, 'from-review'),
        folderA: world(0, posA), folderB: world(1, posB), slipB: world(1, sl),
        inTargetA: shown && at(posA), inTargetB: shown && at(posB),
        target: L.R.target, guide: r(gk, 3), states: r(st, 3), run: r(kRun, 3),
        stages: C.stages.map(s => ({x: r(s.x), y: r(s.y), w: r(s.w), h: r(s.h)})), arrangement: C.arr,
        problems: C.problems, textPx: r(C.F, 1), folderW: r(B.fw, 1), legend: C.strip ? (C.strip.side ? 'side' : 'band') : 'none',
      },
    };
  },
};

/** Lane of the contrast boards: the kit's lane (no chevrons), extended to the desk's left edge (the entry used in A). */
function laneArtEntry(ctx, B, target) {
  const ext = {...B, lane: {...B.lane, a: {x: -40, y: B.lane.a.y}}};
  return laneArt(ctx, ext, {branchArrow: target, chev: false});
}

/** Chevrons along a run's lane segment, pointing in its direction of travel (the scene's own route). */
function runChevrons(B, from, to, name) {
  const w = B.lane.w;
  const dir = Math.sign(to - from);
  const parts = [];
  const step = w * 1.5;
  for (let x = from + dir * step * 0.8; dir * (to - x) > w * 0.6; x += dir * step) {
    if (B.slots.some(s => Math.abs(s.rest.x - x) < w * 0.75)) continue;
    parts.push(g({transform: T(x, B.lane.a.y, dir > 0 ? 0 : 180)}, chevron(w * 0.5)));
  }
  return g({name, opacity: 0}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'review-08-contrast',
    title: 'Return for a new examination — two identical route boards; only how the folder reaches the configured point differs (first entry vs back from review with notes)',
    titleEs: 'Devolución para nuevo examen — Comparación de dos supuestos',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Devolución para nuevo examen',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete route boards of equal size (side by side on wide frames, stacked on tall ones) with the same supplied points, review desk, lane, filter doors (only the configured point\'s open) and calendar. Only one fact differs: in A (initial examination) the folder enters from the left with no notes; in B (renewed examination) it slides onto the review desk with a slip of review notes and comes back. With the same timing both run into the same configured tray. A highlight guide joins the two folders ("only this differs"); a neutral note says there is no winner and no result of either examination. Jurisdiction unspecified.',
    tags: ['review', 'return for a new examination', 'contrast', 'paired scenes', 'initial examination', 'renewed examination', 'folder', 'review notes', 'route', 'filter doors', 'neutral'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/devolucion-nuevo-examen.js', 'src/animations/review/kits/limites-de-revision.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});
