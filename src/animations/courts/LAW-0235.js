/**
 * LAW-0235 — Archivo judicial · contrast
 *
 * Storyboard (two complete, identical floor plans of the same generic,
 * fictional archive room — side by side on wide frames, one above the other
 * on tall ones (on square frames stacked beside a text column) — each with
 * the mirrored ● and ◆ blocks of mobile shelving, the locator link, the
 * counter with its two trays, the request slip and the same generic clerk.
 * Each scene has a header: its lane badge A / B and, from the change beat,
 * its ● / ◆ cue, label and caption. What both share is drawn ONCE in a strip:
 * the names, the identifier, the captions, the shared facts, the changed
 * fact, the guide label, the neutral note and the key):
 *  0.00–0.17  both scenes identical at rest (the clerk's hands on the slip,
 *             every unit packed); only the lane badges tell them apart.
 *  0.17–0.40  the contrasted datum is introduced, at the same moment and with
 *             equal weight in both: the slip in A takes a ● stamp (supplied
 *             as active), the slip in B a ◆ stamp (supplied as archived); the
 *             headers show their labels; a pulse runs along each locator link
 *             to the block of that state and its lamp lights.
 *  0.40–0.77  the action runs in parallel, adapted only to that datum: in A
 *             the ● block rolls open and the clerk fetches the file from it;
 *             in B the ◆ block rolls open and the clerk fetches the file from
 *             it — mirrored routes of the same length and timing; each file is
 *             set in the tray of its state.
 *  0.77–1.00  a comparative guide joins the one detail that differs — the
 *             stamp on each slip — with its label; a neutral note says two
 *             configurations are shown, with no winner, score or outcome.
 * "Archived" is only another shelf block here: no retention period, access,
 * destruction or archiving rule, time span or consequence is shown.
 * @module animations/courts/LAW-0235
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {
  archFields, ARCH_EN, ARCH_STRINGS, archGeometry, archArt, filePose, clerkLook, legendItem, legendItem2, keyItem, captionItem,
  layoutPanel, overlaps, unionBox, pxPerUnit, R2, searchLayout, planPerson, clerkNodes, walkAt, carryPoint, fileProp,
  mapper, textAt, fitG, stateGlyph, STATES, FONT,
} from './kits/archivo-judicial.js';

const ID = 'LAW-0235';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  label: [0.17, 0.23], stamp: [0.18, 0.24], pulse: [0.24, 0.3], lamp: [0.295, 0.325], release: [0.33, 0.36],
  roll: [0.34, 0.45], out: [0.36, 0.54], reach: [0.54, 0.565], pull: [0.565, 0.59], back: [0.6, 0.72], letgo: [0.725, 0.75],
  guide: [0.78, 0.83], note: [0.81, 0.86],
};
const LETTERS = ['A', 'B'];

const STRINGS = {
  en: {...ARCH_STRINGS.en, identifierShared: 'Same request in both scenes'},
  es: {...ARCH_STRINGS.es, identifierShared: 'La misma solicitud en ambas escenas'},
};

const sceneSchema = {
  ...archFields,
  scenarioA: obj('Scenario A: the file supplied as active (●)', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B: the file supplied as archived (◆) — only another shelf block in this example', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

// (concise defaults: every shared fact is drawn once, and two complete scenes share the frame)
const defaultParams = {
  ...ARCH_EN,
  routes: {rails: 'Mobile shelving on floor rails', locator: 'Locator link (as configured)'},
  seats: {counter: 'Counter with two trays', clerk: {name: 'Clerk (generic)'}},
  scenarioA: {label: 'Active file', caption: 'Supplied as active: kept on the ● block'},
  scenarioB: {label: 'Archived file', caption: 'Supplied as archived: kept on the ◆ block'},
  changedFact: 'Only the supplied state of the file differs',
  sharedFacts: ['Same room, clerk and identifier'],
  comparisonLabels: {guide: 'The one difference: the state on the slip', neutral: 'Two configurations; no winner, no score, no outcome'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    const hidden = !ctx.show('key');
    if (shape === 'landscape') {
      for (const cols of [4, 3, 5]) arrs.push({mode: 'row', cols});
      if (hidden) arrs.push({mode: 'row', cols: 4, tall: true});
    } else if (shape === 'portrait') {
      for (const cols of [2, 3, 1]) arrs.push({mode: 'column', cols});
      if (hidden) arrs.push({mode: 'column', cols: 2, tall: true});
    } else {
      // square: the two compact plans side by side (each >= 0.40 of the frame width) with the shared strip below
      for (const cols of [3, 2]) arrs.push({mode: 'row', cols});
      if (hidden) arrs.push({mode: 'row', cols: 3, tall: true, rot: true});
    }
    for (const A of arrs) A.key = `${A.mode}/${A.cols || ''}${A.tall ? '/tall' : ''}${A.rot ? '/rot' : ''}`;
    return searchLayout((v, A) => compose(ctx, p, v / px, px, A), arrs, L => Math.min(L.k, 1.1) + 0.5 * L.fill);
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.scenes.map(S => g({name: `${S.P}scene`},
        g({name: `${S.P}view`, transform: S.M.transform},
          S.art.node,
          g({name: `${S.P}stamp`, opacity: 0, transform: T(S.G.slip.x + 12, S.G.slip.y - 2)}, h('circle', {r: 15, fill: '#fbfaf6', stroke: '#1f2328', 'stroke-width': 2}), stateGlyph(ctx, S.key, 22, {name: `${S.P}stamp-mark`})),
          S.fileNode,
          S.clerk.node),
        S.header)),
      g({name: 'guide', opacity: 0},
        h('path', {d: L.guidePath, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'}),
        L.scenes.map(S => h('circle', {cx: r(S.stampD.x), cy: r(S.stampD.y), r: r(S.stampD.r), fill: 'none', stroke: th.accent2, 'stroke-width': 4}))),
      L.panelNode,
    );
  },
  frame(ctx, L, u) {
    const reduced = ctx.reduced;
    const nodes = {};
    const looks = [];
    L.scenes.forEach((S, i) => {
      const G = S.G, b = S.fb, P = S.P;
      // the datum: the stamp on the slip and the header's label (same moment, same weight in both)
      const lab = seg(u, ...W.label);
      nodes[`${P}hd-text`] = {opacity: r(lab, 3)};
      nodes[`${P}stamp`] = {opacity: r(seg(u, ...W.stamp), 3), transform: T(G.slip.x + 12, G.slip.y - 2)};
      const pu = seg(u, ...W.pulse), lit = seg(u, ...W.lamp);
      const open = ease.inOutCubic(seg(u, ...W.roll));
      const qo = seg(u, ...W.out), qb = seg(u, ...W.back);
      const st = qb > 0 ? walkAt(G.legs[b].back, qb, reduced) : walkAt(G.legs[b].out, qo, reduced);
      const reach = ease.inOutSine(seg(u, ...W.reach)), release = ease.inOutSine(seg(u, ...W.release)), letgo = ease.inOutSine(seg(u, ...W.letgo));
      const carry = Math.max(1 - release, reach * (1 - letgo));
      Object.assign(nodes, clerkNodes(S.clerk, `${P}clerk`, st, carry));
      const pull = ease.inOutSine(seg(u, ...W.pull));
      const B = G.blocks[b];
      const cp = carryPoint(st);
      const placed = qb >= 1 && letgo > 0;
      const fileAt = pull <= 0 ? B.spine : placed ? {x: G.trays[b].x, y: G.trays[b].y} : pull < 1 ? {x: lerp(B.spine.x, cp.x, pull), y: lerp(B.spine.y, cp.y, pull)} : cp;
      if (pull <= 0) Object.assign(nodes, filePose(`${P}file`, B.spine, b ? 90 : 270, 0.25, 0));
      else Object.assign(nodes, filePose(`${P}file`, fileAt, placed ? 180 : pull < 1 ? (b ? 90 : 270) : st.deg, lerp(0.25, 1, pull), 1));
      Object.assign(nodes, S.art.frame({open: [b === 0 ? open : 0, b === 1 ? open : 0], lit: [b === 0 ? lit : 0, b === 1 ? lit : 0], pulse: {b, p: pu, op: pu > 0 && lit < 1 ? 1 : 0}, spine: pull > 0 ? 0 : seg(open, 0.35, 0.8)}));
      // what is visible in the scene, in a frame of its own (mirrored for B: the ● side is the file's side),
      // used to show both scenes are identical before the change beat
      const holder = pull <= 0 ? 'shelf' : placed ? 'tray' : 'clerk';
      const mirror = q => (b ? {x: G.RW - q.x, y: q.y} : q);
      looks.push({
        clerk: R2(mirror(st)), carry: r(carry, 3), holder, open: r(open, 3), lamp: r(lit, 3), pulse: r(pu, 3),
        stamp: r(seg(u, ...W.stamp), 3), label: r(lab, 3), file: R2(mirror(fileAt)),
        // the ● / ◆ cue (the datum) is part of the look once shown
        cue: seg(u, ...W.stamp) > 0 || lab > 0 ? S.key : null,
      });
      S.semantic = {clerk: R2(S.M.toD(st)), file: R2(S.M.toD(fileAt)), hands: R2(S.M.toD(cp)), holder, open: r(open, 3), lamp: r(lit, 3), block: STATES[b]};
    });
    const gd = seg(u, ...W.guide);
    nodes.guide = {opacity: r(gd, 3)};
    if (L.hasGuideLabel) nodes['guide-label'] = {opacity: r(gd, 3)};
    if (L.hasNote) nodes['neutral-note'] = {opacity: r(seg(u, ...W.note), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    const [SA, SB] = L.scenes;
    return {
      nodes,
      semantic: {
        beat,
        lookA: looks[0],
        lookB: looks[1],
        a: SA.semantic, b: SB.semantic,
        clerkA: SA.semantic.clerk, clerkB: SB.semantic.clerk, fileA: SA.semantic.file, fileB: SB.semantic.file, handsA: SA.semantic.hands, handsB: SB.semantic.hands,
        guide: r(gd, 3),
        mode: L.mode,
        sceneWidthShare: L.shareW,
        sceneK: r(L.k, 3),
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        arrangement: L.arrangement,
        problems: L.problems,
        log: L.log,
      },
    };
  },
};

/** A scene header: lane badge (letter), then — from the change beat — the ● / ◆ cue, the label and the caption. */
function header(ctx, P, sc, letter, cue, lane, F, maxW) {
  const th = ctx.theme;
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const R = F * 0.95;
  const gs = F * 1.15;
  const tx = 2 * R + F * 0.6 + gs + F * 0.4;
  const f1 = showKey ? fitG(sc.label, {maxWidth: maxW - tx, size: F, minSize: F, maxLines: 2, weight: 700}) : null;
  const f2 = showAll && sc.caption ? fitG(sc.caption, {maxWidth: maxW - tx, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
  const th2 = (f1 ? f1.height : 0) + (f2 ? F * 0.45 + f2.height : 0);
  const hh = Math.max(2 * R, th2);
  const w = f1 ? tx + Math.max(f1.width, f2 ? f2.width : 0) : 2 * R + F * 0.6 + gs;
  return {
    w, h: hh, truncated: Boolean((f1 && f1.truncated) || (f2 && f2.truncated)),
    node: (x, y) => g({name: `${P}header`},
      // the lane badge: the only thing that tells the scenes apart before the change beat
      g({transform: T(x + R, y + Math.min(hh / 2, R + 2))},
        h('circle', {r: r(R), fill: lane, stroke: '#1f2328', 'stroke-width': 2}),
        showKey ? h('text', {x: 0, y: r(R * 0.36), 'text-anchor': 'middle', 'font-family': FONT, 'font-size': r(F * 1.05, 2), 'font-weight': 800, fill: '#fff'}, letter) : null),
      g({name: `${P}hd-text`, opacity: 0},
        g({transform: T(x + 2 * R + F * 0.6 + gs / 2, y + Math.min(hh / 2, R + 2))}, stateGlyph(ctx, cue, gs, {name: `${P}hd-cue`})),
        f1 ? textAt(f1, x + tx, y + (hh - th2) / 2, th.ink, {name: `${P}hd-label`}) : null,
        f2 ? textAt(f2, x + tx, y + (hh - th2) / 2 + f1.height + F * 0.45, th.fg) : null)),
  };
}

/** One composition at text size F (design units) for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  // a compact room (two-unit blocks, shorter units and front zone) so that two complete plans share the frame with the
  // strip; with the labels hidden (no strip) the room keeps the story's depth, and on square frames the two plans turn
  // a quarter (long side up the page, a narrower corridor) to fill the height
  const G = archGeometry(A.tall ? {NU: 2, CW: A.rot ? 120 : 196} : {NU: 2, UL: 150, WY: 228, FY: 97, RH: 340});
  const FW = (ctx.view.width / Math.min(ctx.view.width, ctx.view.height)) * 1080 / px; // frame width in design units
  // ---- the shared strip (drawn once)
  const items = panelItems(ctx, p, F, showAll, showKey);
  const lanes = [th.accent2, th.accent4];
  const scs = [{sc: p.scenarioA, key: 'active', fb: 0}, {sc: p.scenarioB, key: 'archived', fb: 1}];
  let regions, headers, panel = null, bandH = 0;
  const gapS = A.rot ? 14 : 26;
  if (items.length) {
    panel = layoutPanel(items, {x: 0, y: 0, w: D.w, h: D.h}, F, 'band', A.cols);
    if (panel.problem && panel.problem !== 'panel-height') problems.push(panel.problem);
    bandH = panel.height;
  }
  const top = {x: 0, y: 0, w: D.w, h: D.h - bandH - (bandH ? 28 : 0)};
  if (A.mode === 'row') {
    // (turned plans also leave a margin on the right for the comparison guide)
    const w = (top.w - gapS - (A.rot ? 22 : 0)) / 2;
    headers = scs.map((s, i) => header(ctx, i ? 'b-' : 'a-', s.sc, LETTERS[i], s.key, lanes[i], F, w));
    const hH = Math.max(...headers.map(q => q.h));
    // (turned plans leave a channel under them for the comparison guide)
    regions = [0, 1].map(i => ({x: i * (w + gapS), y: hH + 12, w, h: top.h - hH - 12 - (A.rot ? 30 : 0), hx: i * (w + gapS), hy: 0}));
  } else {
    // (the headers stay clear of the guide's gutter on the right)
    headers = scs.map((s, i) => header(ctx, i ? 'b-' : 'a-', s.sc, LETTERS[i], s.key, lanes[i], F, top.w - 56));
    const hH = Math.max(...headers.map(q => q.h));
    const hh0 = (top.h - gapS) / 2;
    // (a gutter on the right carries the comparison guide from one scene to the other)
    regions = [0, 1].map(i => ({x: 0, y: i * (hh0 + gapS) + hH + 10, w: top.w - 34, h: hh0 - hH - 10, hx: 0, hy: i * (hh0 + gapS)}));
  }
  if (headers.some(q => q.truncated)) problems.push('header-trunc');
  // ---- both plans at the same scale (identical regions)
  const ew = A.rot ? G.E.h : G.E.w, eh = A.rot ? G.E.w : G.E.h;
  const k = Math.min(...regions.map(R0 => Math.min(R0.w / ew, R0.h / eh)));
  const scenes = scs.map((s, i) => {
    const P = i ? 'b-' : 'a-';
    const R0 = regions[i];
    const M = mapper(G.E, R0, Boolean(A.rot), k, {x: 0.5, y: A.mode === 'row' ? 0 : 0.5});
    const art = archArt(ctx, G, {prefix: i ? 'b' : 'a', fileBlock: s.fb});
    const clerk = planPerson(ctx, {name: `${P}clerk`, look: clerkLook(ctx, p)});
    const fileNode = fileProp(ctx, {name: `${P}file`});
    const planD = M.box(G.E);
    const sl = M.toD({x: G.slip.x + 12, y: G.slip.y - 2});
    return {P, G, M, art, clerk, fileNode, fb: s.fb, key: s.key, region: R0, planD, stampD: {x: sl.x, y: sl.y, r: 24 * M.k}};
  });
  const personPx = 100 * k * px;
  // people floor: 60 px in every ratio (stricter than the 1:1 contrast floor of 55 px baseline / 45 px stress)
  if (personPx < 60.5) problems.push('small');
  // ---- scene width shares of the FRAME (AUTHORING item 20): side by side >= 0.40, stacked >= 0.71, stacked beside a
  // text column >= 0.55
  // (measured on the drawn plan: walls, plaques and counter included, the plan's margins not)
  const drawn = {x: -G.t, y: -G.t / 2 - 26, w: G.RW + 2 * G.t, h: G.RH + G.counter.h / 2 + 6 + G.t / 2 + 26};
  const shareW = r(Math.min(...scenes.map(S => S.M.box(drawn).w)) / FW, 3);
  const need = A.mode === 'row' ? 0.4 : 0.71;
  if (shareW < need) problems.push('share');
  // ---- headers
  scenes.forEach((S, i) => {
    const hd = headers[i];
    let hx, hy;
    hx = regions[i].hx; hy = regions[i].hy;
    if (A.mode === 'row') hx = S.planD.x;
    S.header = hd.node(hx, hy);
    S.headerBox = {x: hx, y: hy, w: hd.w, h: hd.h};
  });
  // ---- the shared strip / column
  if (panel) {
    // (a small margin under the strip keeps the last line's descenders inside the caption-safe box)
    const B = {x: 0, y: D.h - bandH - 6, w: D.w, h: bandH};
    panel.place(B);
  }
  // ---- the comparison guide: from A's stamp to B's stamp, routed outside the plans
  const [SA, SB] = scenes;
  let guidePath;
  const sa = SA.stampD, sb = SB.stampD;
  if (A.mode === 'row' && A.rot) {
    // turned plans: the stamps sit at the right edge of each plan; the guide runs through the gap, under the plans and
    // up the right margin
    const gx = SA.planD.x + SA.planD.w + (SB.planD.x - SA.planD.x - SA.planD.w) / 2;
    const yS = Math.max(SA.planD.y + SA.planD.h, SB.planD.y + SB.planD.h) + 12;
    const xR = SB.planD.x + SB.planD.w + 12;
    guidePath = `M${r(sa.x + sa.r)} ${r(sa.y)}H${r(gx)}V${r(yS)}H${r(xR)}V${r(sb.y)}H${r(sb.x + sb.r)}`;
    if (xR > D.w - 2 || yS > D.h - 2) problems.push('guide-frame');
  } else if (A.mode === 'row') {
    const yS = Math.max(SA.planD.y + SA.planD.h, SB.planD.y + SB.planD.h) + 12;
    guidePath = `M${r(sa.x)} ${r(sa.y + sa.r)}V${r(yS)}H${r(sb.x)}V${r(sb.y + sb.r)}`;
    if (yS > D.h - bandH - 2) problems.push('guide-strip');
  } else {
    // stacked: from each stamp straight down out of its plan, then along the gutter on the right
    const xS = Math.max(SA.planD.x + SA.planD.w, SB.planD.x + SB.planD.w) + 12;
    const yA = SA.planD.y + SA.planD.h + 9, yB = SB.planD.y + SB.planD.h + 9;
    guidePath = `M${r(sa.x)} ${r(sa.y + sa.r)}V${r(yA)}H${r(xS)}V${r(yB)}H${r(sb.x)}V${r(sb.y + sb.r)}`;
    if (xS > D.w - 2) problems.push('guide-frame');
    if (headers[1] && overlaps(SB.headerBox, {x: sa.x - 2, y: yA - 2, w: xS - sa.x + 4, h: 4}, 2)) problems.push('guide-header');
  }
  // ---- audit
  const texts = [...scenes.map(S => S.headerBox), ...(panel ? panel.boxes : [])];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (overlaps(texts[i], texts[j], 2)) { problems.push('overlap'); i = texts.length; break; }
  for (const S of scenes) {
    if (panel && panel.boxes.some(b => overlaps(b, S.planD, 2))) problems.push('panel-on-plan');
    if (scenes.some(T2 => overlaps(T2.headerBox, S.planD, 2))) problems.push('header-on-plan');
    if (S.planD.x < -0.5 || S.planD.y < -0.5 || S.planD.x + S.planD.w > D.w + 0.5 || S.planD.y + S.planD.h > D.h + 0.5) problems.push('plan-frame');
  }
  if (overlaps(SA.planD, SB.planD, 4)) problems.push('plans-touch');
  const ext = unionBox([SA.planD, SB.planD, ...texts]);
  const fill = Math.min(ext.w / D.w, ext.h / D.h);
  if (showKey && fill < 0.78) problems.push('fill');
  return {
    F, px, k, scenes, guidePath, personPx, shareW, fill, mode: A.mode,
    panelNode: panel ? panel.node : null, hasNote: Boolean(panel && showAll), hasGuideLabel: Boolean(panel && showAll),
    problems, arrangement: `${A.key}`,
  };
}

/** The shared strip: every fact both scenes share, drawn once. */
function panelItems(ctx, p, F, showAll, showKey) {
  const th = ctx.theme;
  const items = [];
  if (showKey) {
    items.push(legendItem(ctx, {kind: 'active', text: p.courts.active, F, name: 'legend-active', weight: 700}));
    items.push(legendItem(ctx, {kind: 'archived', text: p.courts.archived, F, name: 'legend-archived', weight: 700}));
    items.push(legendItem2(ctx, {kind: 'slip', title: p.file.identifier, text: ctx.t.identifierShared, F, name: 'legend-identifier'}));
  }
  if (showAll) {
    items.push(legendItem2(ctx, {kind: 'room', title: p.courts.archive, text: p.courts.building, F, name: 'legend-room'}));
    items.push(legendItem(ctx, {kind: 'person', text: p.seats.clerk.name, F, name: 'legend-clerk', weight: 600, glyphOpts: {look: clerkLook(ctx, p)}}));
    items.push(legendItem(ctx, {kind: 'unit', text: p.routes.rails, F, name: 'legend-rails'}));
    items.push(legendItem(ctx, {kind: 'locator', text: p.routes.locator, F, name: 'legend-locator'}));
    items.push(legendItem(ctx, {kind: 'counter', text: p.seats.counter, F, name: 'legend-counter'}));
    items.push(legendItem(ctx, {kind: 'sequence', text: p.labels.sequence, F, name: 'legend-sequence'}));
    p.sharedFacts.forEach((f, i) => items.push(legendItem(ctx, {kind: 'same', text: f, F, name: `shared${i}`})));
    items.push(captionItem(ctx, p.changedFact, F, 'changed-fact'));
    // the guide's label (keyed by the same accent line and ring) and the neutral note appear with the guide
    items.push({type: 'legend', make: w => {
      const gs = F * 1.8;
      const f = fitG(p.comparisonLabels.guide, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines: 3, weight: 600});
      const hh = Math.max(gs * 0.7, f.height + F * 0.25);
      return {h: hh, truncated: f.truncated, node: (x, y) => g({name: 'guide-label', opacity: 0},
        h('path', {d: `M${r(x + 2)} ${r(y + hh / 2)}H${r(x + gs * 0.45)}`, stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round'}),
        h('circle', {cx: r(x + gs * 0.7), cy: r(y + hh / 2), r: r(gs * 0.24), fill: 'none', stroke: th.accent2, 'stroke-width': 3}),
        textAt(f, x + gs + 14, y + (hh - f.height) / 2, th.ink))};
    }});
    items.push({type: 'note', make: w => {
      const f = fitG(p.comparisonLabels.neutral, {maxWidth: w - F * 1.2, size: F, minSize: F, maxLines: 4, weight: 600});
      const hh = f.height + F * 0.76;
      return {h: hh, truncated: f.truncated, node: (x, y) => g({name: 'neutral-note', opacity: 0},
        h('path', {d: roundRectPath(x, y, f.width + F * 1.2, hh, Math.min(hh / 2, F * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.2}),
        textAt(f, x + F * 0.6, y + F * 0.38, th.ink))};
    }});
  }
  if (showKey) items.push(keyItem(ctx, p.labels.key, F));
  return items;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-09-contrast',
    title: 'Court archive — an active file and an archived file located by the same shelves',
    titleEs: 'Archivo judicial — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Archivo judicial',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical plans of a generic, fictional archive room with mirrored ● (active) and ◆ (archived) blocks of mobile shelving. Only the supplied state of the file differs: in A the slip is stamped ● and the ● block opens its aisle; in B the slip is stamped ◆ and the ◆ block opens — mirrored routes of the same length; each file ends in the tray of its state. A guide joins the two stamps; a neutral note: no winner, score or outcome. "Archived" is only another shelf block here.',
    tags: ['contrast', 'archive', 'mobile shelving', 'active', 'archived', 'identifier', 'floor plan', 'clerk', 'mirrored routes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/archivo-judicial.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
