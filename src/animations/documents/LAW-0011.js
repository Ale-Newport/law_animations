/**
 * LAW-0011 — Apertura de expediente · contrast
 *
 * Storyboard (two complete desks, identical except ONE fact):
 *  0.00–0.17  Base: two IDENTICAL closed case files (same number, label, index,
 *             clerk and the same separator tabs, the changed document's tab
 *             included). Side by side on wide frames, stacked on tall ones.
 *  0.17–0.40  Change: the changed document's tab is ringed in both files. In A
 *             it stays; in B that document slides out of the folder by its tab
 *             and fades, and only then a dashed outline of its tab appears —
 *             it is listed but no longer in the file.
 *  0.40–0.77  Parallel action: in both desks the clerk lifts the cover, draws
 *             the index out and the documents fan into layers; B's cascade keeps
 *             a dashed empty slot, and when ticking the index the pen in B
 *             passes over that entry without ticking it. Everything else runs
 *             identically.
 *  0.77–1.00  Guide: rings join the changed slot in A and B with a relation
 *             line that runs through the guide label, placed in the gutter
 *             between the desks (side by side) or in the band between them
 *             (stacked); a neutral note states that no consequence is shown.
 * No stamp is used in either desk so no registration outcome is implied.
 * @module animations/documents/LAW-0011
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r, ease} from '../../core/time.js';
import {contrastFields, int} from '../../schemas/fields.js';
import {chip, connector, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {caseFileDesk, caseFileFields, CASE_STRINGS} from './kits/apertura-de-expediente.js';

const ID = 'LAW-0011';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  // leave: B's changed document slides out (0–65 %), fades (35–65 %), then its
  // dashed tab outline appears (65–100 %) — never before the change beat
  ring: [0.18, 0.23], leave: [0.21, 0.35], ringOut: [0.37, 0.42], changeChip: [0.2, 0.27],
  reachCover: [0.37, 0.43], lift: [0.43, 0.5], fall: [0.5, 0.55], toPen: [0.52, 0.6],
  reachIndex: [0.47, 0.54], spread: [0.54, 0.64], releaseR: [0.64, 0.7],
  ticks: [0.64, 0.765], penDown: [0.765, 0.8], withdrawL: [0.8, 0.84],
  guide: [0.8, 0.9], note: [0.88, 0.95],
};

const sceneSchema = {
  ...caseFileFields,
  ...contrastFields(),
  changedIndex: int('Zero-based index of the listed document that is absent in scenario B', 0, 4),
};

const defaultParams = {
  documentId: 'EXP-0417',
  documentTitle: 'Registration request',
  clauses: ['Application form', 'Identity document copy', 'Supporting letter', 'Fee receipt (hypothetical)'],
  signers: [{name: 'Dana Ruiz', role: 'Clerk'}, {name: 'Sam Okafor', role: 'Applicant'}],
  redactions: [],
  changedIndex: 2,
  scenarioA: {label: 'Complete file', caption: 'Every listed document is in the folder'},
  scenarioB: {label: 'Document absent', caption: 'Document 3 is listed but not in the folder'},
  changedFact: 'Only document 3 differs: listed in both, absent from B',
  sharedFacts: ['Same file number', 'Same index', 'Same opening steps'],
  comparisonLabels: {guide: 'Changed fact: document 3', neutral: 'Two situations shown side by side — no consequence is stated'},
};

/** Stage axis, desk crop and arrangement per available shape. */
const ARRANGE = {
  landscape: {axis: 'horizontal', arrangement: 'row'},
  square: {axis: 'vertical', arrangement: 'row'},
  portrait: {axis: 'horizontal', arrangement: 'column'},
};
const WINDOW = {
  horizontal: {x: 70, y: 20, w: 1250, h: 880},
  vertical: {x: 0, y: 228, w: 900, h: 1172},
};
/** Right-hand rest when no stamp is on the desk. */
const REST_R = {horizontal: {x: 1262, y: 856}, vertical: {x: 818, y: 1326}};
/**
 * Exit of B's changed document during the change beat (stage units): it is
 * pulled out by its separator tab, i.e. toward the side the tabs stick out of
 * (right on horizontal desks, bottom on vertical ones), staying in the window.
 */
const EXIT = {horizontal: {x: 280, y: 0}, vertical: {x: 0, y: 280}};
/** Guide-label variants tried in the gutter (largest first). */
const GUIDE_VARIANTS = [
  {size: 36, minSize: 32, maxLines: 2, maxWidth: 720},
  {size: 34, minSize: 30, maxLines: 3, maxWidth: 480},
  {size: 32, minSize: 26, maxLines: 4, maxWidth: 300},
];

const area = (a, b) => {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const hh = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && hh > 0 ? w * hh : 0;
};
const grow = (b, p) => ({x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p});

/**
 * Place the guide label as close as possible to the gutter centre `gx`
 * without touching any hard obstacle (header text, folder tabs, the laid-out
 * cascades, the rings); soft obstacles (the blank opened covers) are allowed
 * but penalised. Pure and deterministic.
 */
function placeGuide(ctx, text, o) {
  let best = null;
  GUIDE_VARIANTS.forEach((v, vi) => {
    const {w, h: hh} = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', ...v}).box;
    for (let y = o.yMin; y + hh <= o.yMax; y += 6) {
      for (let k = 0; k <= 100; k++) {
        const dx = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 6;
        const box = {x: o.gx + dx - w / 2, y, w, h: hh};
        if (box.x < o.bounds.x || box.x + w > o.bounds.x + o.bounds.w) continue;
        if (o.hard.some(b => area(box, b) > 0)) continue;
        const soft = o.soft.reduce((a, b) => a + area(box, b), 0);
        const score = Math.abs(dx) + soft * 0.004 + vi * 60 + (y - o.yMin) * 0.2;
        if (!best || score < best.score) best = {score, v, x: o.gx + dx, y, w, h: hh};
        break;
      }
    }
  });
  return best || {v: GUIDE_VARIANTS[0], x: o.gx, y: o.yMin};
}

/**
 * Cubic control points so a relation line from `from` to `to` passes through
 * G at its apex (horizontal tangent there): the line runs through the label.
 */
function throughPoint(from, to, G) {
  const d = (8 * (G.x - (from.x + to.x) / 2)) / 3;
  const yc = (8 * G.y - from.y - to.y) / 6;
  return {c1: {x: from.x + Math.max(0, d), y: yc}, c2: {x: to.x - Math.max(0, -d), y: yc}};
}

const scene = {
  sizes: {landscape: [2570, 1170], square: [1870, 1470], portrait: [1250, 2330]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const {axis, arrangement} = ARRANGE[ctx.view.shape];
    const win = WINDOW[axis];
    const header = 150;
    const geo = pairedGeometry(ctx, {stage: {w: win.w, h: win.h}, arrangement, header, gap: arrangement === 'row' ? 70 : 128});
    const bw = geo.w;
    const docs = p.clauses.map((title, i) => ({title, redacted: p.redactions.includes(i)}));
    const k = Math.min(p.changedIndex, docs.length - 1);
    const applicant = p.signers[1].role ? `${p.signers[1].role}: ${p.signers[1].name}` : p.signers[1].name;
    const file = {number: p.documentId, title: p.documentTitle, applicantLine: applicant, docs};
    // B starts with the SAME file as A (the changed document and its tab are in
    // the folder); the change beat takes that document out (swapLayer: the
    // stage draws it both as a sheet and as a dashed slot, frame() poses the
    // exit), after which only the dashed slot / tab outline remain and the pen
    // skips its entry
    const stages = ['a', 'b'].map((key, i) => caseFileDesk(ctx, {
      prefix: `s${key}`, axis, file, absent: i === 1 ? k : -1, clerk: p.signers[0], clerkCaption: null,
      withStamp: false, window: win, restR: REST_R[axis],
      ...(i === 1 ? {swapLayer: k} : {}),
    }));
    const colors = [th.inkSoft, th.accent2];
    // stacked panels: the header text stops short of the right margin, where
    // the closing guide runs down between the two desks
    const headers = geo.panels.map((pn, i) => caseHeader(ctx, {
      name: `head-${i}`, letter: i ? 'B' : 'A', label: (i ? p.scenarioB : p.scenarioA).label, caption: (i ? p.scenarioB : p.scenarioA).caption,
      x: pn.x, y: pn.headerY + 8, w: pn.w - (arrangement === 'row' ? 0 : 80), h: header - 16, color: colors[i],
    }));
    // stage → block coordinates for panel i
    const toBlock = (i, q) => ({x: geo.panels[i].x + q.x - win.x, y: geo.panels[i].y + q.y - win.y});
    const st0 = stages[0];
    // rings around the changed tab (closed files) and the changed strip (laid out)
    const tabLocal = st0.tabCenter(k);
    const tabR = st0.tabRadius;
    const tabPts = stages.map((st, i) => toBlock(i, st.layerWorld(k, tabLocal, 0)));
    const stripLocal = {x: st0.dw * 0.5, y: st0.stripH * 0.5};
    const stripPts = stages.map((st, i) => toBlock(i, st.layerWorld(k, stripLocal, 1)));
    const ringW = st0.dw * 0.62, ringH = Math.max(st0.stripH * 0.62, 34);
    const row = arrangement === 'row';
    // (inner edge of the frame: clear of the index sheet and the resting right hand)
    const rightX = geo.panels[0].x + win.w - 18;
    // guideFade: drawing-progress window in which the guide label fades in
    let guide, guideChip = null, guideFade = [0.5, 1], guideSpansGutter = null;
    if (row) {
      // Side by side: the label sits in the gutter between the two desks (or
      // just above them), never inside one scene, and the relation line from
      // A's ring to B's ring runs through it.
      const blk = (i, rc) => ({x: geo.panels[i].x + rc.x - win.x, y: geo.panels[i].y + rc.y - win.y, w: rc.w, h: rc.h});
      const gx = (geo.panels[0].x + geo.panels[0].w + geo.panels[1].x) / 2;
      const hard = [
        ...headers.flatMap(hd => hd.boxes.map(b => grow(b, 10))),
        ...stages.flatMap((st, i) => [grow(blk(i, st.tabRect), 10), grow(blk(i, st.cascadeBox), 10)]),
        ...stripPts.map(c => grow({x: c.x - ringW, y: c.y - ringH, w: ringW * 2, h: ringH * 2}, 8)),
      ];
      const soft = stages.flatMap((st, i) => [blk(i, st.coverOpenRect), blk(i, st.folderRect)]);
      const pos = placeGuide(ctx, p.comparisonLabels.guide, {gx, yMin: geo.panels[0].y - 40, yMax: Math.min(stripPts[0].y, stripPts[1].y) - ringH, bounds: {x: 0, w: bw}, hard, soft});
      const probe = chip(ctx, p.comparisonLabels.guide, {x: pos.x, y: pos.y, anchor: 'middle', ...pos.v});
      const G = {x: probe.box.cx, y: probe.box.cy};
      // the label straddles the gutter (inter-desk space), not one scene
      guideSpansGutter = probe.box.x < geo.panels[1].x && probe.box.x + probe.box.w > geo.panels[0].x + geo.panels[0].w;
      const from = {x: stripPts[0].x + ringW, y: stripPts[0].y}, to = {x: stripPts[1].x - ringW, y: stripPts[1].y};
      guide = connector(ctx, {name: 'guide', from, to, kind: 'relation', color: th.accent, ...throughPoint(from, to, G)});
      // arc-length fraction where the drawn line first enters the label box:
      // the label is opaque by then, so the line is never seen through it
      const bx = probe.box;
      for (let i = 0; i <= 200; i++) {
        const q = guide.at(i / 200);
        if (q.x >= bx.x && q.x <= bx.x + bx.w && q.y >= bx.y && q.y <= bx.y + bx.h) {
          guideFade = [Math.max(0, i / 200 - 0.22), Math.max(0.05, i / 200 - 0.02)];
          break;
        }
      }
      if (ctx.show('key')) guideChip = chip(ctx, p.comparisonLabels.guide, {x: pos.x, y: pos.y, anchor: 'middle', ...pos.v, fill: th.card, stroke: th.accent, name: 'guide-chip'});
    } else {
      // stacked: the guide runs down the right margin so it never crosses A's
      // index sheet; control points overshoot so the curve's outermost point
      // sits on rightX. The label sits in the band between the two desks.
      guide = connector(ctx, {name: 'guide', from: {x: stripPts[0].x + ringW, y: stripPts[0].y}, to: {x: stripPts[1].x + ringW, y: stripPts[1].y}, kind: 'relation', color: th.accent,
        c1: {x: (rightX - 0.25 * (stripPts[0].x + ringW)) / 0.75, y: stripPts[0].y + 40}, c2: {x: (rightX - 0.25 * (stripPts[1].x + ringW)) / 0.75, y: stripPts[1].y - 40}});
      if (ctx.show('key')) guideChip = chip(ctx, p.comparisonLabels.guide, {x: rightX - 22, y: geo.panels[0].y + win.h + 12, anchor: 'end', maxWidth: bw * 0.7, size: 36, minSize: 24, maxLines: 2, fill: th.card, stroke: th.accent, name: 'guide-chip'});
    }
    const footY = geo.h + 22;
    // the changed fact keeps its meaning: one line when it fits at a readable
    // size, otherwise up to three lines (the footer grows to hold it)
    let changeChip = null;
    if (ctx.show('key')) {
      const cc = {x: bw / 2, y: footY, anchor: 'middle', maxWidth: bw * 0.92, size: 44, fill: th.accentSoft, stroke: th.accent, name: 'change-chip'};
      changeChip = chip(ctx, p.changedFact, {...cc, minSize: 38, maxLines: 1});
      if (changeChip.fit.truncated) changeChip = chip(ctx, p.changedFact, {...cc, minSize: 32, maxLines: 3});
    }
    const shared = p.sharedFacts.length && ctx.show('all') ? neutralNote(ctx, `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}`, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'shared-note'}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.95, size: 40, name: 'neutral-note'}) : null;
    const footer = Math.max(140, 22 + Math.max(0, ...[changeChip, shared, neutral].filter(Boolean).map(c => c.box.h)) + 10);
    const bh = geo.h + footer;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;
    return {geo, stages, headers, tabPts, tabR, stripPts, ringW, ringH, guide, guideFade, guideSpansGutter, guideChip, changeChip, shared, neutral, s, ox, oy, arrangement, k, win, exit: EXIT[axis]};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ring = (name, c, rx, ry, dashed) => h('ellipse', {name, cx: r(c.x), cy: r(c.y), rx: r(rx), ry: r(ry), fill: 'none', stroke: th.accent, 'stroke-width': 6, 'stroke-dasharray': dashed ? '14 10' : null, opacity: 0});
    const tabR = L.tabR;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers.map(hd => hd.node),
      L.geo.panels.map((pn, i) => g({transform: T(pn.x - L.win.x, pn.y - L.win.y)}, L.stages[i].node)),
      L.tabPts.map((c, i) => ring(`tabring-${i}`, c, tabR, tabR, i === 1)),
      L.stripPts.map((c, i) => ring(`ring-${i}`, c, L.ringW, L.ringH, i === 1)),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const w = key => seg(u, ...W[key]);
    const v = {
      reachCover: w('reachCover'), lift: w('lift'), fall: w('fall'), toPen: w('toPen'),
      reachIndex: w('reachIndex'), spread: w('spread'), releaseR: w('releaseR'),
      ticks: w('ticks'), penDown: w('penDown'), withdrawL: w('withdrawL'),
    };
    const a = L.stages[0].pose(v);
    const b = L.stages[1].pose(v);
    const nodes = {...a.nodes, ...b.nodes};
    // change beat, B only: the changed document is drawn out of the folder by
    // its tab (identical to A until then), fades at the end of its trip, and
    // only then its dashed slot / tab outline appears — no double exposure
    const leave = w('leave');
    const lp = L.stages[1].layerPose(L.k, v.spread);
    const m = ease.inOutCubic(seg(leave, 0, 0.65));
    const sheetOpacity = r(1 - seg(leave, 0.35, 0.65), 3);
    const ghost = r(seg(leave, 0.65, 1), 3);
    const sheetB = {x: r(lp.x + L.exit.x * m), y: r(lp.y + L.exit.y * m)};
    nodes[`sb-layer-${L.k}`] = {transform: T(sheetB.x, sheetB.y, lp.rot), opacity: sheetOpacity};
    nodes['sb-ghost'] = {transform: T(lp.x, lp.y, lp.rot), opacity: ghost};
    // change beat: ring the changed tab in both files
    const tr = clamp(w('ring') * (1 - w('ringOut')));
    nodes['tabring-0'] = {opacity: r(tr, 3)};
    nodes['tabring-1'] = {opacity: r(tr, 3)};
    // guide beat
    const gp = w('guide');
    Object.assign(nodes, L.guide.frame(gp, gp > 0 ? 1 : 0));
    nodes['ring-0'] = {opacity: r(clamp(gp * 3), 3)};
    nodes['ring-1'] = {opacity: r(clamp(gp * 3), 3)};
    // the label fades in just before the drawn line reaches it
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(seg(gp, ...L.guideFade), 3)};
    // footer: changed fact during the change beat, shared facts during the action, then the neutral note
    // the three footer notes share one spot: each leaves before the next
    // arrives, so their text is never double-exposed
    const cp = w('changeChip');
    const noteP = w('note');
    const sharedOut = seg(u, W.note[0] - 0.03, W.note[0] - 0.005);
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.44) / 0.04)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.48) / 0.04) * (1 - sharedOut), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = sm => ({cover: sm.coverAngle, spread: sm.spread, ticks: sm.ticks, holder: sm.holder, index: sm.indexCenter, penHeld: sm.penHeld, stamp: sm.stampApplied});
    return {
      nodes,
      semantic: {
        beat,
        a: pick(a.semantic),
        b: pick(b.semantic),
        changedIndex: L.k,
        ghostB: ghost,
        presentB: r(1 - leave, 3),
        exitB: r(m, 3),
        sheetB: {...sheetB, opacity: sheetOpacity},
        sameBase: nodes[`sa-layer-${L.k}`].transform === nodes[`sb-layer-${L.k}`].transform && sheetOpacity === 1 && ghost === 0,
        handLA: a.semantic.handL, handRA: a.semantic.handR, handLB: b.semantic.handL, handRB: b.semantic.handR,
        indexA: a.semantic.indexCenter, indexB: b.semantic.indexCenter,
        penA: a.semantic.penTip, penB: b.semantic.penTip,
        coverGripA: a.semantic.coverGrip, indexGripA: a.semantic.indexGrip,
        reach: {a: a.semantic.allReached, b: b.semantic.allReached},
        allReached: a.semantic.allReached && b.semantic.allReached,
        guideProgress: r(gp, 3),
        guideSpansGutter: L.guideSpansGutter,
        arrangement: L.arrangement,
      },
    };
  },
};

/**
 * Scenario header (letter badge + label + caption). Unlike a one-line strip,
 * a long label or caption wraps to a second line instead of being cut short.
 * @param {any} ctx
 * @param {{name:string, letter:string, label:string, caption?:string, x:number, y:number, w:number, h:number, color:string}} o
 */
function caseHeader(ctx, o) {
  const th = ctx.theme;
  const size = Math.min(54, o.h * 0.4);
  const badgeR = size * 0.78;
  const tx = o.x + badgeR * 2 + 18;
  const maxW = o.w - badgeR * 2 - 24;
  let f = null, cap = null;
  if (ctx.show('key')) {
    f = ctx.fit(o.label, {maxWidth: maxW, size, minSize: size * 0.7, maxLines: 1, weight: 700});
    if (f.truncated) f = ctx.fit(o.label, {maxWidth: maxW, size: size * 0.72, minSize: size * 0.5, maxLines: 2, weight: 700});
  }
  if (f && o.caption && ctx.show('all')) {
    const room = o.h - f.height - 12;
    cap = ctx.fit(o.caption, {maxWidth: maxW, size: Math.min(size * 0.62, room), minSize: 16, maxLines: 1, weight: 500});
    if (cap.truncated && room >= 40) cap = ctx.fit(o.caption, {maxWidth: maxW, size: Math.min(size * 0.5, room / 2.25), minSize: 15, maxLines: 2, weight: 500});
  }
  const blockH = f ? f.height + (cap ? cap.height + 12 : 0) : size;
  const y0 = o.y + Math.max(0, (o.h - blockH) / 2);
  const cy = f ? y0 + f.size * 0.55 : o.y + o.h * 0.42;
  const parts = [
    h('circle', {cx: o.x + badgeR, cy, r: badgeR, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    // with labels hidden the badge stays as a coloured marker (A = left/top, B = right/bottom)
    ctx.show('key') ? textBlock(ctx.fit(o.letter, {maxWidth: badgeR * 1.6, size, maxLines: 1, weight: 800}), {x: o.x + badgeR, y: cy - size * 0.44, anchor: 'middle', fill: '#fff'}) : null,
  ];
  // occupied boxes (badge + text), used to keep other labels clear of the header
  const boxes = [{x: o.x, y: cy - badgeR, w: badgeR * 2, h: badgeR * 2}];
  if (f) {
    parts.push(textBlock(f, {x: tx, y: y0, fill: th.fg}));
    boxes.push({x: tx, y: y0, w: f.width, h: f.height});
  }
  if (cap) {
    parts.push(textBlock(cap, {x: tx, y: y0 + f.height + 12, fill: th.fgSoft}));
    boxes.push({x: tx, y: y0 + f.height + 12, w: cap.width, h: cap.height});
  }
  return {node: g({name: o.name}, parts), boxes};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-03-contrast',
    title: 'Opening a case file — complete file vs absent document',
    titleEs: 'Apertura de expediente — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Apertura de expediente',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical desks open the same case file in parallel. Only one fact differs: in B one listed document is absent, so its tab is a dashed outline, its layer stays an empty slot and the pen passes over its index entry. A closing guide joins the changed slot without stating any consequence.',
    tags: ['case file', 'comparison', 'absent document', 'layers', 'index', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/apertura-de-expediente.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: CASE_STRINGS,
  scene,
});
