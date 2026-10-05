/**
 * LAW-0255 — Comunicación a la contraparte · contrast
 *
 * Storyboard (two complete, identical office scenes — side by side in wide and square frames, one above the other in
 * tall ones — each with Party A, her out-tray and the case file, the supplied route with its stops, the calendar of the
 * legs and Party B with her in-tray; the scenes share scale, timing and every common element; the stops' names, the
 * legs' dates and the trays' labels are the same in both and are printed once, in the shared strip):
 *  0.00–0.17  base: the two scenes are identical (only the lane badges A / B differ).
 *  0.17–0.40  the headers name the scenarios; then the one localised change appears on the same supplied leg: in A a
 *             solid outline with a ● cue (documented, as supplied), in B a dashed outline — the disputed marker — with
 *             a ◆ cue (questioned in this configured example). Nothing else differs.
 *  0.40–0.77  the action runs in parallel in both scenes: Party A lifts the file into the carrier, it travels through
 *             the stops (each leg's calendar cell opens) and Party B sets it in her tray — the same route, the same
 *             moments.
 *  0.77–1.00  a comparison guide joins the two outlined legs through the channel between the scenes; a neutral note.
 *             No winner, score, validity, deadline or effect is shown.
 * @module animations/civil-claim/LAW-0255
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, list, obj} from '../../schemas/fields.js';
import {
  CC_DEFAULTS, CC_STRINGS, partiesField, documentsField, stagesField, datesField, objectLabelProps,
  looksOf, legLabels, routeStage, cueChip, packRows, hit, unionBox, SIZES, pxPerUnit, fitG,
  localizeDefaults, CC_COMMON_ES,
} from './kits/comunicacion-contraparte.js';

const ID = 'LAW-0255';
const DURATION = 7500;
const W = {header: [0.17, 0.23], change: [0.24, 0.32], act: [0.4, 0.77], guide: [0.78, 0.83], note: [0.81, 0.86]};

const sceneSchema = {
  parties: partiesField,
  documents: documentsField,
  stages: stagesField,
  dates: datesField,
  objectLabels: obj('Labels printed in the shared strip (trays, calendar, route caption) and the two state chips', objectLabelProps),
  scenarioA: obj('Scenario A', {label: str('Label of scenario A', 60), caption: str('Caption of scenario A', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Label of scenario B', 60), caption: str('Caption of scenario B', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B (as supplied)', 100),
  sharedFacts: list('Facts common to both scenes (as supplied)', str('Shared fact', 90), 0, 3),
  comparisonLabels: obj('Labels of the comparison', {guide: str('Label of the guide joining the changed detail', 60), neutral: str('Neutral note under the comparison', 90)}),
  questionedLeg: int('Zero-based leg that carries the changed detail in both scenes', 0, 3),
};

const defaultParams = {
  parties: CC_DEFAULTS.parties,
  documents: CC_DEFAULTS.documents,
  stages: CC_DEFAULTS.stages,
  dates: CC_DEFAULTS.dates,
  objectLabels: CC_DEFAULTS.labels,
  scenarioA: {label: 'Communication documented', caption: 'As supplied'},
  scenarioB: {label: 'Communication questioned', caption: 'In this example only'},
  changedFact: 'Changed: documented or questioned (as supplied)',
  sharedFacts: ['Everything else is the same in A and B'],
  comparisonLabels: {guide: 'The one detail that differs', neutral: 'No winner, score or conclusion'},
  questionedLeg: 2,
};

/** Spanish defaults: with locale es, every field still at its English default is shown in Spanish. */
const DEFAULTS_ES = {...CC_COMMON_ES,
  scenarioA: {label: 'Comunicación documentada', caption: 'Según lo aportado'},
  scenarioB: {label: 'Comunicación cuestionada', caption: 'Solo en este ejemplo'},
  changedFact: 'Cambia: documentada o cuestionada (según lo aportado)',
  sharedFacts: ['Todo lo demás es igual en A y B'],
  comparisonLabels: {guide: 'El único detalle que cambia', neutral: 'Sin vencedor, puntuación ni conclusión'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    ctx.params = localizeDefaults(ctx.params, defaultParams, DEFAULTS_ES);
    let pick = null, best = null;
    const log = [];
    // (people first with heads >= 55 px (square) / 52 px; then heads >= 45 px; only when no layout holds those — heavy
    // supplied text — the standing floor itself: full FIGURE height >= 60 px (headMin 0, figMin 60; coordinator
    // 2026-10-04: full-body floors are measured on the rendered figure height))
    for (const headMin of ctx.view.shape === 'square' ? [55, 45, 0] : [52, 45, 0]) {
      for (const T0 of SIZES.filter(v => v >= 19.8 - 1e-6 || [18.9, 17.1, 16.6].includes(v))) {
        for (const cols of [9, 2]) for (const mode of ctx.view.shape === 'portrait' ? ['column'] : ['row']) for (const ps of [1, 1.15, 1.3, 1.45]) {
          const L = compose(ctx, T0, {cols, mode, ps, headMin});
          log.push(`${T0}/${L.arrangement}:h${Math.round(L.headPx)}:${L.problems.join("+")}`);
          L.log = log;
          const sc = L.problems.length * 100 - L.s * 10 - T0;
          if (!best || sc < best.sc) best = {L, sc};
          if (!L.problems.length && (!pick || (T0 >= 19.8 - 1e-6 && L.headPx > pick.headPx + 0.5) || (pick.T < 19.8 - 1e-6 && T0 > pick.T))) pick = L;
        }
        if (pick && T0 < 19.8 + 1e-6) break;
      }
      if (pick) break;
    }
    // (side by side, the scenes may leave the frame's height half empty — labels hidden, or a square frame: the same
    // composition is then tried with the track raised on risers, which makes the scenes taller at the same scale; the
    // tallest clean one that keeps the people's size is kept)
    if (pick && pick.fillH < 0.62) {
      for (const rise of [420, 320, 220, 140]) {
        const L = compose(ctx, pick.T, {...pick.A, rise});
        log.push(`${pick.T}/${L.arrangement}:h${Math.round(L.headPx)}:${L.problems.join('+')}`);
        if (!L.problems.length && L.headPx >= pick.headPx - 0.5 && L.fillH > pick.fillH + 0.02) { L.log = log; pick = L; break; }
      }
    }
    return pick || best.L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.lanes.map(ln => g({name: `${ln.P}-lane`},
        g({name: `${ln.P}-view`, transform: `${T(ln.ox, ln.oy)} scale(${r(L.s, 5)})`}, ln.st.node),
        ln.header)),
      L.stripNode,
      g({name: 'guide', opacity: 0},
        h('path', {name: 'guide-path', d: L.guide.d, fill: 'none', stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(L.guide.len + 2)} ${r(L.guide.len + 2)}`, 'data-draw': 1}),
        L.guide.rings.map((q, i) => h('circle', {name: `guide-ring${i}`, cx: r(q.x), cy: r(q.y), r: r(q.r), fill: 'none', stroke: th.accent2, 'stroke-width': 3})),
        L.guide.label),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const c = clamp((u - W.act[0]) / (W.act[1] - W.act[0]), 0, 1);
    const change = seg(u, ...W.change);
    const looks = [];
    for (const ln of L.lanes) {
      const F = ln.st.frame(c, {marker: change, cue: change});
      Object.assign(nodes, F.nodes);
      nodes[`${ln.P}-head-text`] = {opacity: r(seg(u, ...W.header), 3)};
      looks.push({holder: F.s.holder, docAt: F.s.docAt, legsDone: F.s.legsDone, clerk: F.s.handA, file: F.s.file});
      ln.look = F.s;
    }
    const gp = ease.inOutSine(seg(u, ...W.guide));
    nodes.guide = {opacity: r(gp > 0 ? 1 : 0, 3)};
    nodes['guide-path'] = {'stroke-dashoffset': r((L.guide.len + 2) * (1 - gp))};
    L.guide.rings.forEach((_, i) => { nodes[`guide-ring${i}`] = {opacity: r(gp >= 1 ? 1 : 0, 3)}; });
    if (L.hasNote && L.hasGuideLabel) nodes['guide-label'] = {opacity: r(seg(u, W.guide[1] - 0.01, W.guide[1] + 0.02), 3)};
    if (L.hasNote) nodes['strip-note'] = {opacity: r(seg(u, ...W.note), 3)};
    const A = L.lanes[0].look, B = L.lanes[1].look;
    const beat = u < 0.17 ? 'base' : u < 0.4 ? 'introduce' : u < 0.77 ? 'action' : 'guide';
    return {
      nodes,
      semantic: {
        beat,
        clock: r(c, 4),
        a: {holder: A.holder, docAt: A.docAt, legsDone: A.legsDone, plan: 'documented'},
        b: {holder: B.holder, docAt: B.docAt, legsDone: B.legsDone, plan: 'questioned'},
        // (everything drawn in a scene except the supplied state; the state is 'none' until the change beat)
        lookA: {holder: A.holder, docAt: A.docAt, legsDone: A.legsDone, file: {x: r(A.file.x, 2), y: r(A.file.y, 2)}, hand: {x: r(A.handA.x, 2), y: r(A.handA.y, 2)}, state: change > 0 ? 'documented' : 'none'},
        lookB: {holder: B.holder, docAt: B.docAt, legsDone: B.legsDone, file: {x: r(B.file.x, 2), y: r(B.file.y, 2)}, hand: {x: r(B.handA.x, 2), y: r(B.handA.y, 2)}, state: change > 0 ? 'questioned' : 'none'},
        same: A.holder === B.holder && A.docAt === B.docAt && A.legsDone === B.legsDone && Math.abs(A.file.y - B.file.y) < 1e-6 && Math.abs(A.file.x - B.file.x) < 1e-6,
        changeShown: r(change, 3),
        guide: r(gp, 3),
        headerShown: r(seg(u, ...W.header), 3),
        allReached: A.allReached && B.allReached,
        problems: L.problems,
        textPx: r(L.T, 1),
        headPx: r(L.headPx, 1),
        figPx: r(L.headPx * 4.4, 1),
        sceneH: r(L.sceneH, 3),
        shares: L.shares,
        arrangement: L.arrangement,
        log: L.log,
      },
    };
  },
};

/** One composition at text size T0 (px at 1080p). */
function compose(ctx, T0, A) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const px = pxPerUnit(ctx);
  const F = T0 / px;
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const looks = looksOf(ctx, p);
  const problems = [];
  const gap = F * 0.8;
  const bounds = {x: 6, y: 6, w: D.w - 12, h: D.h - 12};
  // ---- the shared strip: key, changed fact, shared facts, the texts printed once for both scenes, the neutral note
  const stripW = bounds.w;
  // (the strip's chips are tried at two widths — two or three to a row — and the lower packing is kept)
  const mkItems = chipW => {
  const items = [];
  if (showKey) items.push({...cueChip(ctx, {name: 'key', text: `◦ ${ctx.t.key}`, size: F, maxWidth: chipW, maxLines: 2, stroke: th.inkSoft, weight: 600}), key: 'key'});
  if (showAll) {
    items.push({...cueChip(ctx, {name: 'strip-changed', text: p.changedFact, size: F, maxWidth: chipW, maxLines: 4, stroke: th.accent2}), key: 'changed'});
    (p.sharedFacts || []).forEach((f, i) => items.push({...cueChip(ctx, {name: `strip-shared${i}`, text: f, size: F, maxWidth: chipW, maxLines: 4, stroke: th.ink, weight: 600}), key: `shared${i}`}));
    // (the texts common to both scenes, printed once: the route with its stops, the legs' dates, trays, file and parties)
    items.push({...cueChip(ctx, {name: 'strip-stops', text: `${p.objectLabels.route}: ${p.stages.join(' · ')}`, size: F, maxWidth: chipW, maxLines: 5, stroke: th.ink, weight: 600}), key: 'stops'});
    items.push({...cueChip(ctx, {name: 'strip-dates', text: `${p.objectLabels.calendar}: ${legLabels(p).join(' · ')}`, size: F, maxWidth: chipW, maxLines: 5, stroke: th.ink, weight: 600}), key: 'dates'});
    items.push({...cueChip(ctx, {name: 'strip-trays', text: `${p.objectLabels.outTray} / ${p.objectLabels.inTray} · ${p.documents.caseFile.ref} · ${p.documents.caseFile.title}`, size: F, maxWidth: chipW, maxLines: 5, stroke: th.ink, weight: 600}), key: 'trays'});
    items.push({...cueChip(ctx, {name: 'strip-parties', text: `${p.parties[0].name} · ${p.parties[0].role} / ${p.parties[1].name} · ${p.parties[1].role}`, size: F, maxWidth: chipW, maxLines: 4, stroke: th.ink, weight: 600}), key: 'parties'});
    if (p.comparisonLabels.guide) items.push({...cueChip(ctx, {name: 'guide-label', text: `◯ ${p.comparisonLabels.guide}`, size: F, maxWidth: chipW, maxLines: 3, stroke: th.accent2, opacity: 0}), key: 'guide'});
    items.push({...cueChip(ctx, {name: 'strip-note', text: p.comparisonLabels.neutral, size: F, maxWidth: chipW, maxLines: 3, stroke: th.inkSoft, weight: 600, opacity: 0}), key: 'note'});
  }
  return items;
  };
  let items = null, packed = null;
  for (const fw of [0.48, 0.32, 0.96]) {
    const its = mkItems(Math.min(stripW * fw, F * 22));
    if (its.some(it => it.fit.truncated)) continue;
    const pk = packRows(its, stripW, gap * 0.7);
    if (!packed || pk.height < packed.height - 0.5) { items = its; packed = pk; }
  }
  if (!items) { items = mkItems(Math.min(stripW * 0.96, F * 22)); packed = packRows(items, stripW, gap * 0.7); for (const it of items) if (it.fit.truncated) problems.push(`trunc-${it.key}`); }
  const stripH = items.length ? packed.height : 0;
  // ---- headers (lane badge, cue and label; caption beneath)
  const mkHeader = (P, sc, kind, colW) => {
    const lane = P === 'a' ? 'A' : 'B';
    const text = showAll ? `${lane} · ${sc.label}${sc.caption ? ` — ${sc.caption}` : ''}` : showKey ? `${lane} · ${sc.label}` : '';
    return cueChip(ctx, {name: `${P}-head-text`, text, size: F, maxWidth: Math.min(colW, F * 26), maxLines: 5, cue: kind, stroke: th.ink});
  };
  // ---- lanes: side by side (row) or stacked (column); the scenes share one scale s
  const gut = F * 1.6;
  const avail = {x: bounds.x, y: bounds.y, w: bounds.w, h: bounds.h - stripH - (stripH ? gap : 0)};
  const lanesBox = A.mode === 'row'
    ? [{x: avail.x, y: avail.y, w: (avail.w - gut) / 2, h: avail.h}, {x: avail.x + (avail.w + gut) / 2, y: avail.y, w: (avail.w - gut) / 2, h: avail.h}]
    // (stacked: a channel F·1.4 wide is kept free on the right of both lanes for the comparison guide)
    : [{x: avail.x, y: avail.y, w: avail.w - F * 1.4, h: (avail.h - gut) / 2}, {x: avail.x, y: avail.y + (avail.h + gut) / 2, w: avail.w - F * 1.4, h: (avail.h - gut) / 2}];
  const hdrs = [mkHeader('a', p.scenarioA, 'documented', lanesBox[0].w), mkHeader('b', p.scenarioB, 'questioned', lanesBox[1].w)];
  for (const hd of hdrs) if (hd.fit.truncated) problems.push('head-trunc');
  const chan = F * 1.4; // the guide's channel between the headers and the stages
  const hdrH = Math.max(hdrs[0].h, hdrs[1].h) + gap * 0.6;
  // (the props carry filler lines only — their texts are printed once in the strip — so they keep a fixed size)
  const stage = (P, plan, s) => routeStage(ctx, {P, p, looks, ts: 20, showText: false, W: Math.max(200, lanesBox[0].w / s - 180 * (A.ps || 1)), RY: 0, calCols: A.cols, plan, qLeg: p.questionedLeg, caption: null, fileText: false, flat: !A.rise, rise: A.rise, markLeg: true, ps: A.ps, badgeR: 40, markW: 6, noPlates: true, calMin: 2.2, floorExt: 48});
  let pick = null;
  const ok = sc => { const st = stage('a', 'documented', sc); return st.ext.w * sc <= lanesBox[0].w + 0.5 && st.ext.h * sc <= lanesBox[0].h - hdrH - chan + 0.5 && !st.problems.length; };
  for (const sc of [1.4, 1.3, 1.2, 1.1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.16, 0.12]) {
    // (a scale whose people already fall under this tier's head floor is not tried)
    if (A.headMin && 101 * (A.ps || 1) * sc * pxPerUnit(ctx) < A.headMin) break;
    if (ok(sc)) { pick = sc; break; }
  }
  if (pick) for (let sc = pick + (pick < 0.3 ? 0.04 : 0.08); sc > pick + 1e-6; sc -= 0.02) if (ok(sc)) { pick = sc; break; }
  const s = pick || 0.12;
  if (!pick) problems.push('lane-fit');
  const stA = stage('a', 'documented', s), stB = stage('b', 'questioned', s);
  if (stA.problems.length) problems.push(...stA.problems.map(q => `a-${q}`));
  const lanes = [];
  [stA, stB].forEach((st, i) => {
    const lb = lanesBox[i];
    const P = i ? 'b' : 'a';
    const hd = hdrs[i];
    const ext = st.ext;
    // (the stage sits at the lane's bottom; its header right above it, both centred in the lane)
    const ox = lb.x + (lb.w - ext.w * s) / 2 - ext.x * s;
    const stageTop = lb.y + hdrH + chan + Math.max(0, (lb.h - hdrH - chan - ext.h * s) / 2);
    const oy = stageTop - ext.y * s;
    const hx = lb.x + (lb.w - hd.w) / 2, hy = stageTop - hdrH - chan;
    lanes.push({P, st, ox, oy, lb, header: g({name: `${P}-header`}, hd.node(hx, hy)), headerBox: {x: hx, y: hy, w: hd.w, h: hd.h}, stageBox: {x: ox + ext.x * s, y: oy + ext.y * s, w: ext.w * s, h: ext.h * s}});
  });
  // people: the rendered head box's smaller side is ~101 stage units
  const headPx = 101 * (A.ps || 1) * s * px;
  const square = ctx.view.shape === 'square';
  const headMin = A.headMin ?? (square ? 55 : 52);
  if (headPx < headMin + 0.4) problems.push('small-people');
  // (the rendered full figure — seated person with chair — is ~4.4 head boxes tall)
  const figPx = headPx * 4.4;
  if (figPx < 60.5) problems.push('small-figure');
  // standing subject floor (causation-05 decision): each scene >= 0.20 of the frame height
  const FHd = (ctx.view.height / Math.min(ctx.view.width, ctx.view.height)) * 1080 / px;
  const sceneH = Math.min(...lanes.map(ln => ln.stageBox.h)) / FHd;
  if (sceneH < 0.2) problems.push('thin-scene');
  // shares of the frame (design units ≈ frame width fraction via the content box)
  const FW = (ctx.view.width / Math.min(ctx.view.width, ctx.view.height)) * 1080 / px;
  const shares = lanes.map(ln => r(ln.stageBox.w / FW, 3));
  const need = A.mode === 'row' ? 0.4 : 0.71;
  if (shares.some(v => v < need)) problems.push('share');
  // ---- the strip's nodes (under the lanes)
  const stripBoxes = [];
  let stripNode = null;
  if (items.length) {
    const nodesP = [];
    let y = bounds.y + bounds.h - stripH;
    for (const row of packed.rows) {
      let x = bounds.x + (stripW - row.w) / 2;
      for (const it of row.items) {
        const b = {x, y: y + (row.h - it.h) / 2, w: it.w, h: it.h};
        stripBoxes.push(b);
        nodesP.push(g({name: `strip-${it.key}-wrap`}, it.node(b.x, b.y)));
        x += it.w + gap;
      }
      y += row.h + gap * 0.7;
    }
    stripNode = g({name: 'strip'}, nodesP);
  }
  // ---- the comparison guide: from A's outlined leg up to a channel above the stages (below the headers is taken by the
  // headers, so the channel runs just above each stage's wall top) and across the gutter to B's outlined leg
  const mk = ln => {
    const b = ln.st.geo.qBox;
    const c = {x: ln.ox + (b.x + b.w / 2) * s, y: ln.oy + b.y * s};
    const cue = {x: ln.ox + ln.st.geo.badgeAt.x * s, y: ln.oy + ln.st.geo.badgeAt.y * s, r: ln.st.geo.badgeR * s + 6};
    return {c, cue};
  };
  const ma = mk(lanes[0]), mb = mk(lanes[1]);
  let d, len, pts;
  if (A.mode === 'row') {
    // channel: above the two stages (under their headers) — up from A's cue, across, down to B's cue
    const cy = Math.min(lanes[0].stageBox.y, lanes[1].stageBox.y) - chan / 2;
    pts = [{x: ma.cue.x, y: ma.cue.y - ma.cue.r}, {x: ma.cue.x, y: cy}, {x: mb.cue.x, y: cy}, {x: mb.cue.x, y: mb.cue.y - mb.cue.r}];
  } else {
    // stacked: up from A's cue into the channel above stage A (under its header), right into the free channel beside
    // both lanes, down to the channel above stage B, left to B's cue and down onto it — through no person, prop or text
    const cyA = lanes[0].stageBox.y - chan / 2, cyB = lanes[1].stageBox.y - chan / 2;
    const xr = lanes[0].lb.x + lanes[0].lb.w + chan / 2;
    pts = [{x: ma.cue.x, y: ma.cue.y - ma.cue.r}, {x: ma.cue.x, y: cyA}, {x: xr, y: cyA}, {x: xr, y: cyB}, {x: mb.cue.x, y: cyB}, {x: mb.cue.x, y: mb.cue.y - mb.cue.r}];
  }
  d = `M${pts.map(q => `${r(q.x)} ${r(q.y)}`).join('L')}`;
  len = pts.slice(1).reduce((acc, q, i) => acc + Math.hypot(q.x - pts[i].x, q.y - pts[i].y), 0);
  const hasLabel = false;
  const label = null;
  const texts = [...lanes.map(ln => ln.headerBox), ...stripBoxes];
  // audit: headers / strip / label keep apart, and clear of the stages
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (hit(texts[i], texts[j], 2)) { problems.push('overlap'); i = texts.length; break; }
  if (stripBoxes.some(b => lanes.some(ln => hit(b, ln.stageBox, 2)))) problems.push('strip-on-stage');
  return {
    T: T0, F, s, lanes, stripNode, headPx, shares, problems, hasNote: showAll, hasGuideLabel: Boolean(p.comparisonLabels.guide),
    guide: {d, len, rings: [ma.cue, mb.cue], hasLabel, label, pts},
    sceneH, A, fillH: (Math.max(...lanes.map(ln => ln.stageBox.y + ln.stageBox.h), ...stripBoxes.map(b => b.y + b.h)) - Math.min(...lanes.map(ln => ln.headerBox.y))) / bounds.h,
    arrangement: `${A.mode}/c${A.cols}/ps${A.ps}${A.rise ? `/rise${A.rise}` : ''}/s${r(s, 3)}`,
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'civil-claim-04-contrast',
    title: 'Communication to the other party — documented or questioned: the same route, one supplied detail changed',
    titleEs: 'Comunicación a la contraparte — Comparación de dos supuestos',
    category: 'civil-claim',
    categoryName: 'Inicio de reclamaciones civiles',
    motif: 'Comunicación a la contraparte',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical office scenes run the same supplied route at the same moments: Party A lifts the case file into the carrier, it travels through the stops (each leg’s date opens) and Party B sets it in her tray. Only one supplied detail differs, on the same leg: in A a solid outline with ● (documented, as supplied), in B a dashed outline — the disputed marker — with ◆ (questioned in this configured example). A guide joins the two outlined legs. No winner, score, validity or effect.',
    tags: ['contrast', 'route', 'case file', 'calendar', 'trays', 'parties', 'documented', 'questioned', 'disputed marker', 'sequence as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/civil-claim/kits/civil-claim-art.js', 'src/animations/civil-claim/kits/comunicacion-contraparte.js', 'src/primitives/person.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CC_STRINGS,
  scene,
});
