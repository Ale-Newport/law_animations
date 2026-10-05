/**
 * LAW-0231 — Deliberación separada · contrast
 *
 * Storyboard (two complete, identical floor plans of the same generic
 * building — side by side on wide frames, one above the other on tall and
 * square ones — each with its public space (●, benches, the same generic
 * participants with letter badges) joined through a partition door to the
 * abstract zone (◆). Each scene has a header: its lane badge A / B, its ● / ◆
 * cue, its label and caption. What both share is drawn ONCE in a strip below:
 * the names, the participants, the captions, the shared facts, the changed
 * fact, the guide label, the neutral note and the key):
 *  0.00–0.17  both scenes identical at rest (the door open, the spaces
 *             joined); only the lane badges tell them apart.
 *  0.17–0.40  the contrasted circumstance is introduced, at the same moment
 *             and with equal weight in both: A is labelled "Audiencia" and a
 *             solid ring settles on its public space (●); B is labelled
 *             "deliberación" and the same ring settles on its zone (◆).
 *  0.40–0.77  the action runs in parallel, adapted only to that circumstance
 *             (as configured): in B the partition door closes, then the
 *             public space travels along its track away from the zone and a
 *             separation opens; in A the door stays open and the spaces stay
 *             joined. Nothing else differs: same building, people, benches.
 *  0.77–1.00  a comparative guide joins the one detail that differs — the
 *             partition joined in A, the separation in B — with its label; a
 *             neutral note says two configurations are shown, with no winner,
 *             no score and no outcome.
 * No rule about attendance, secrecy, votes or decisions is shown or inferred.
 * @module animations/courts/LAW-0231
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {
  delibFields, DELIB_EN, DELIB_STRINGS, delibGeometry, delibArt, seatedPose, planScene, legendItem, keyItem, captionItem,
  layoutPanel, overlaps, unionBox, pxPerUnit, R2, LETTERS, searchLayout, textAt, fitG, zoneGlyph,
} from './kits/deliberacion-separada.js';

const ID = 'LAW-0231';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], introduce: [0.17, 0.4], action: [0.4, 0.77], guide: [0.77, 1]};
const W = {label: [0.17, 0.24], ring: [0.22, 0.3], door: [0.4, 0.47], rails: [0.45, 0.52], move: [0.48, 0.72], guide: [0.77, 0.83], note: [0.8, 0.86]};
const CONFIGS = ['joined', 'apart'];

const STRINGS = {en: {...DELIB_STRINGS.en}, es: {...DELIB_STRINGS.es}};

const sceneSchema = {
  ...delibFields,
  scenarioA: obj('Scenario A (the ● public space configured as audiencia)', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90), config: oneOf('What the configuration draws: joined = the spaces stay joined through the open door; apart = the door closes and the public space moves apart', CONFIGS)}, ['label']),
  scenarioB: obj('Scenario B (the ◆ zone configured as deliberación)', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90), config: oneOf('What the configuration draws (see scenario A)', CONFIGS)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide linking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

// (concise defaults: every shared fact is drawn once, and two complete scenes share the frame)
const defaultParams = {
  courts: {building: 'Building (fictional)', hearing: 'Hearing room (fictional)', deliberation: 'Deliberation zone (fictional)'},
  routes: {track: 'Track (as configured)', partition: 'Partition with a door'},
  seats: {bench: 'Benches', participants: [{name: 'Participant A'}, {name: 'Participant B'}, {name: 'Participant C'}]},
  labels: {gap: 'Separation (illustrative)', sequence: DELIB_EN.labels.sequence, key: DELIB_EN.labels.key},
  scenarioA: {label: 'Audiencia', caption: 'Spaces stay joined (as configured)', config: 'joined'},
  scenarioB: {label: 'Deliberación', caption: 'Public space moves apart (as configured)', config: 'apart'},
  changedFact: 'Only the configuration differs, as supplied',
  sharedFacts: ['Same building and people'],
  comparisonLabels: {guide: 'The one difference', neutral: 'No winner, no score, no outcome'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const geo of [{rh: 560, m: 50, tb: 20}, {rh: 440, m: 40, tb: 20}, {rh: 330, m: 32, tb: 20}, {rh: 270, m: 24, tb: 16}]) for (const cols of [4, 3]) arrs.push({mode: 'row', cols, ...geo});
    } else if (shape === 'square') {
      for (const geo of [{rh: 214, m: 12, tb: 12}, {rh: 228, m: 14, tb: 14}, {rh: 240, m: 16, tb: 14}, {rh: 270, m: 20, tb: 14}]) {
        for (const hw of [0.16, 0.2, 0.26]) for (const cols of [3, 4]) arrs.push({mode: 'side', hw, cols, ...geo, packed: true});
        for (const cw of [0.22, 0.26, 0.3]) arrs.push({mode: 'rcol', cw, cols: 1, ...geo, packed: true});
      }
    } else {
      // (deeper rooms fill the height the portrait frame leaves between the two width-limited plans)
      for (const geo of [{rh: 680, m: 40, tb: 20}, {rh: 560, m: 40, tb: 20}, {rh: 440, m: 32, tb: 20}, {rh: 330, m: 32, tb: 20}, {rh: 270, m: 24, tb: 16}]) for (const cols of [2, 3]) arrs.push({mode: 'column', cols, ...geo});
    }
    for (const A of arrs) A.key = `${A.mode}/${A.cols}/${A.hw || A.cw || ''}/${A.rh}`;
    // (larger plans win among the compositions that fit)
    return searchLayout((v, A) => compose(ctx, p, v / px, px, A), arrs, L => L.k + 1.5 * (L.planShare || 0));
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.scenes.map(S => g({name: `${S.P}scene`},
        g({name: `${S.P}map`, transform: S.M.transform}, S.art.node, S.people.map(pp => pp.node)),
        g({name: `${S.P}ring`, opacity: 0}, h('rect', {x: r(S.ringBox.x - 8), y: r(S.ringBox.y - 8), width: r(S.ringBox.w + 16), height: r(S.ringBox.h + 16), rx: 14, fill: 'none', stroke: th.accent3, 'stroke-width': 5})),
        g({name: `${S.P}detail`, opacity: 0}, h('rect', {x: r(S.detail.x - 6), y: r(S.detail.y - 6), width: r(S.detail.w + 12), height: r(S.detail.h + 12), rx: 10, fill: 'none', stroke: th.accent2, 'stroke-width': 4.5})),
        S.badgeNodes,
        S.header)),
      g({name: 'guide', opacity: 0}, h('path', {d: L.guidePath, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'})),
      L.panelNode,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const looks = [];
    for (const S of L.scenes) {
      const apart = S.config === 'apart';
      const open = apart ? 1 - ease.inOutCubic(seg(u, ...W.door)) : 1;
      const move = apart ? S.G.gap * ease.inOutCubic(seg(u, ...W.move)) : 0;
      const railP = apart ? seg(u, ...W.rails) : 0;
      Object.assign(nodes, S.art.frame(move, open, railP, railP > 0 ? 1 : 0));
      S.people.forEach((pp, i) => Object.assign(nodes, seatedPose(pp, S.G.seatPts[i], move)));
      const dv = S.moveVec(move);
      S.badgeAt.forEach((b, i) => { nodes[`${S.P}badge${i}`] = {transform: T(r(b.x + dv.x, 2), r(b.y + dv.y, 2))}; });
      const ring = seg(u, ...W.ring);
      nodes[`${S.P}ring`] = {opacity: r(ring, 3)};
      nodes[`${S.P}detail`] = {opacity: r(seg(u, ...W.guide), 3)};
      if (S.hasLabel) nodes[`${S.P}label`] = {opacity: r(seg(u, ...W.label), 3)};
      looks.push({door: r(open, 3), move: r(move, 2), rails: r(railP, 3), ring: ring > 0 ? S.ringTarget : null, labelShown: r(seg(u, ...W.label), 3)});
    }
    nodes.guide = {opacity: r(seg(u, ...W.guide), 3)};
    if (L.hasNote) nodes['neutral-note'] = {opacity: r(seg(u, ...W.note), 3)};
    if (L.hasGuideLabel) nodes['guide-label'] = {opacity: r(seg(u, ...W.guide), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.introduce[1] ? 'introduce' : u < BEATS.action[1] ? 'action' : 'guide';
    const [A, B] = L.scenes;
    return {
      nodes,
      semantic: {
        beat,
        lookA: looks[0],
        lookB: looks[1],
        configA: A.config, configB: B.config,
        separatedA: looks[0].move >= A.G.gap - 0.5,
        separatedB: looks[1].move >= B.G.gap - 0.5,
        doorA: looks[0].door, doorB: looks[1].door,
        doorClosedBeforeMoveB: !(looks[1].move > 0 && looks[1].door > 0.001),
        guide: r(seg(u, ...W.guide), 3),
        noteShown: r(seg(u, ...W.note), 3),
        sameScale: Math.abs(A.M.k - B.M.k) < 1e-9,
        scaleA: r(A.M.k, 4), scaleB: r(B.M.k, 4),
        pubA: R2(A.M.toD({x: A.G.rw / 2 - looks[0].move, y: A.G.rh / 2})),
        pubB: R2(B.M.toD({x: B.G.rw / 2 - looks[1].move, y: B.G.rh / 2})),
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        mode: L.mode,
        arrangement: L.arrangement,
        problems: L.problems,
        log: L.log,
      },
    };
  },
};

/** A scenario header: lane badge (letter), the ● / ◆ cue, label (bold) and caption; hw = available width. */
function header(ctx, P, sc, letter, cue, lane, F, w, stacked) {
  const th = ctx.theme;
  const R = F * 1.05;
  const show = ctx.show('key');
  const gsz = F * 1.2;
  const tx = stacked ? 0 : 2 * R + F * 0.6 + gsz + F * 0.4;
  const tw = w - tx - 4;
  const f1 = show ? fitG(sc.label, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 800}) : null;
  const f2 = show && sc.caption ? fitG(sc.caption, {maxWidth: tw, size: F, minSize: F, maxLines: stacked ? 5 : 3, weight: 500}) : null;
  const topH = 2 * R;
  const textH = (f1 ? f1.height : 0) + (f2 ? F * 0.4 + f2.height : 0);
  const hh = stacked ? topH + (textH ? F * 0.4 + textH : 0) : Math.max(topH, textH);
  return {
    h: hh, w, truncated: Boolean((f1 && f1.truncated) || (f2 && f2.truncated)),
    node(x, y) {
      const ty = stacked ? y + topH + F * 0.4 : y + (hh - textH) / 2;
      return g({name: `${P}header`},
        h('circle', {cx: r(x + R), cy: r(y + R), r: r(R), fill: lane, stroke: th.ink, 'stroke-width': 2.5}),
        show ? h('text', {x: r(x + R), y: r(y + R + F * 0.36), 'text-anchor': 'middle', 'font-size': r(F * 1.05, 2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, letter) : null,
        g({transform: T(x + 2 * R + F * 0.6 + gsz / 2, y + R)}, zoneGlyph(ctx, cue, gsz, {name: `${P}cue`})),
        f1 ? g({name: `${P}label`, opacity: 0},
          textAt(f1, x + tx, ty, th.ink, {name: `${P}label-text`}),
          f2 ? textAt(f2, x + tx, ty + f1.height + F * 0.4, th.fg) : null) : null);
    },
  };
}

/** One composition at text size F (design units) for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const n = p.seats.participants.length;
  const G = delibGeometry({n, rh: A.rh, margin: A.m, tb: A.tb});
  // ---- the shared strip (drawn once)
  const items = panelItems(ctx, p, F, showAll, showKey, A.packed);
  let bandH = 0, panel = null, colW = 0;
  if (items.length && A.mode === 'rcol') {
    // fallback (standing rule): a right-hand text column beside the stacked scenes
    colW = D.w * A.cw;
    panel = layoutPanel(items, {x: D.w - colW, y: 0, w: colW, h: D.h}, F, 'column');
    if (panel.problem) problems.push(panel.problem);
  } else if (items.length) {
    panel = layoutPanel(items, {x: 0, y: 0, w: D.w, h: D.h}, F, 'band', A.cols);
    if (panel.problem && panel.problem !== 'panel-height') problems.push(panel.problem);
    bandH = panel.height;
  }
  const top = {x: 0, y: 0, w: D.w - (colW ? colW + 24 : 0), h: D.h - bandH - (bandH ? 24 : 0)};
  if (top.h < 200) problems.push('band-height');
  // ---- two regions of equal size, with the headers
  const lanes = [th.accent2, th.accent4];
  const cfgA = (p.scenarioA && p.scenarioA.config) || 'joined', cfgB = (p.scenarioB && p.scenarioB.config) || 'apart';
  const scs = [{sc: p.scenarioA, cue: 'pub', config: cfgA}, {sc: p.scenarioB, cue: 'zone', config: cfgB}];
  // the guide runs in its own channels, >= CLR clear of every wall it passes (items 5 / 16): above the plans in a row,
  // through the gap between stacked plans (side), or around the right margin and between B's header and plan (column)
  const CLR = 24;
  const gapS = A.mode === 'side' ? 2 * CLR + 4 : A.mode === 'row' ? 30 : CLR + 12;
  const guideStrip = A.mode === 'row' ? CLR + 10 : 0, chan = A.mode === 'column' || A.mode === 'rcol' ? CLR + 10 : 0;
  let regions, headers;
  if (A.mode === 'row') {
    const w = (top.w - gapS) / 2;
    headers = scs.map((s, i) => header(ctx, i ? 'b-' : 'a-', s.sc, LETTERS[i], s.cue, lanes[i], F, w, false));
    const hH = Math.max(...headers.map(q => q.h));
    regions = [0, 1].map(i => ({x: i * (w + gapS), y: hH + 10 + guideStrip, w, h: top.h - hH - 10 - guideStrip, hx: i * (w + gapS), hy: 0}));
  } else if (A.mode === 'column' || A.mode === 'rcol') {
    const hh0 = (top.h - gapS) / 2;
    headers = scs.map((s, i) => header(ctx, i ? 'b-' : 'a-', s.sc, LETTERS[i], s.cue, lanes[i], F, top.w - 40, false));
    const hH = Math.max(...headers.map(q => q.h));
    regions = [0, 1].map(i => ({x: 0, y: i * (hh0 + gapS) + hH + 10 + chan, w: top.w - 40, h: hh0 - hH - 10 - chan, hx: 0, hy: i * (hh0 + gapS)}));
  } else {
    const hw = D.w * A.hw;
    const hh0 = (top.h - gapS) / 2;
    headers = scs.map((s, i) => header(ctx, i ? 'b-' : 'a-', s.sc, LETTERS[i], s.cue, lanes[i], F, hw, true));
    regions = [0, 1].map(i => ({x: hw + 16, y: i * (hh0 + gapS), w: top.w - hw - 16 - 30, h: hh0, hx: 0, hy: i * (hh0 + gapS)}));
    if (headers.some(q => q.h > hh0)) problems.push('header-height');
  }
  if (headers.some(q => q.truncated)) problems.push('header-trunc');
  // ---- both plans at the same scale
  const place = rg => scs.map((s, i) => {
    const P = i ? 'b-' : 'a-';
    const S = planScene(ctx, p, F, px, {G, region: rg[i], rot: false, bname: 'panel', moveEnd: s.config === 'apart' ? G.gap : 0, P, chips: false, align: {x: 0.5, y: A.mode === 'row' && showKey ? 0 : 0.5}});
    return {...S, P, G, config: s.config, cue: s.cue, region: rg[i]};
  });
  let scenes = place(regions);
  if (A.mode === 'column' || A.mode === 'rcol') {
    // stacked with the headers above: the two plans sit tight (header, channel, plan) and the pair is centred
    // vertically in the space above the strip, so no empty band opens between or below them
    const hB = scenes[0].bOuter.h, hH = regions[0].y - regions[0].hy - chan - 10;
    const unit = hH + 10 + chan + hB;
    const y0 = Math.max(0, (top.h - (2 * unit + gapS)) / 2);
    regions = [0, 1].map(i => ({...regions[i], hy: y0 + i * (unit + gapS), y: y0 + i * (unit + gapS) + hH + 10 + chan, h: hB + 0.5}));
    scenes = place(regions);
  }
  const k = Math.min(...scenes.map(S => S.k));
  // (identical regions give identical scales; guard anyway)
  if (Math.abs(scenes[0].k - scenes[1].k) > 1e-9) problems.push('scale');
  const personPx = scenes[0].personPx;
  if (personPx < 60.5) problems.push('small');
  for (const S of scenes) problems.push(...S.problems);
  // ---- per scene: art, ring target, detail box, header node
  scenes.forEach((S, i) => {
    S.art = delibArt(ctx, G, {prefix: i ? 'b' : 'a', closure: 'door', rails: true});
    S.ringTarget = S.cue === 'pub' ? 'public-space' : 'zone';
    S.ringBox = S.cue === 'pub' ? S.M.box(G.pubOuter(0)) : S.M.box(G.zoneOuter());
    // the detail that differs: the partition doorway and (when apart) the separation
    const endMove = S.config === 'apart' ? G.gap : 0;
    S.detail = S.M.box({x: G.rw + G.t - endMove - (endMove ? 0 : 20), y: G.door.y0 - 24, w: endMove + G.t + (endMove ? 0 : 40), h: G.door.y1 - G.door.y0 + 48});
    const hd = headers[i];
    S.header = hd.node(regions[i].hx, regions[i].hy);
    S.headerBox = {x: regions[i].hx, y: regions[i].hy, w: hd.w, h: hd.h};
    S.hasLabel = showKey;
  });
  // ---- the comparison guide: from A's detail to B's detail, routed outside the plans
  const [SA, SB] = scenes;
  let guidePath;
  const dA = SA.detail, dB = SB.detail;
  if (A.mode === 'row') {
    const yS = Math.min(SA.bOuter.y, SB.bOuter.y) - CLR;
    guidePath = `M${r(dA.x + dA.w / 2)} ${r(dA.y - 6)}V${r(yS)}H${r(dB.x + dB.w / 2)}V${r(dB.y - 6)}`;
    if (scenes.some(S => S.headerBox.y + S.headerBox.h > yS - 6)) problems.push('guide-header');
  } else if (A.mode === 'side') {
    // stacked, headers at the side: down A's partition line, one jog midway through the gap, down into B's
    const ym = (SA.bOuter.y + SA.bOuter.h + SB.bOuter.y) / 2;
    if (SB.bOuter.y - (SA.bOuter.y + SA.bOuter.h) < 2 * CLR) problems.push('guide-channel');
    const cA = dA.x + dA.w / 2, cB = dB.x + dB.w / 2;
    guidePath = `M${r(cA)} ${r(dA.y + dA.h + 6)}V${r(ym)}${Math.abs(cA - cB) > 0.5 ? `H${r(cB)}` : ''}V${r(dB.y - 6)}`;
  } else {
    // stacked, B's header between the plans: down A's partition line, out below A, down the right margin, in
    // between B's header and B's plan, and down to B's detail — never across a zone, a ring or a header
    const xS = Math.max(SA.bOuter.x + SA.bOuter.w, SB.bOuter.x + SB.bOuter.w) + CLR;
    const yA = SA.bOuter.y + SA.bOuter.h + CLR, yB = SB.bOuter.y - CLR;
    const cA = dA.x + dA.w / 2, cB = dB.x + dB.w / 2;
    guidePath = `M${r(cA)} ${r(dA.y + dA.h + 6)}V${r(yA)}H${r(xS)}V${r(yB)}H${r(cB)}V${r(dB.y - 6)}`;
    const hB = scenes[1].headerBox;
    if (hB.y < yA + 8 || hB.y + hB.h > yB - 8) problems.push('guide-header');
    if (xS > top.w - 4) problems.push('guide-frame');
  }
  // ---- place the strip
  if (panel && colW) panel.place({x: D.w - colW, y: 0, w: colW, h: D.h});
  else if (panel) {
    const B = {x: 0, y: D.h - bandH, w: D.w, h: bandH};
    panel.place(B);
    if (D.h - bandH < 0) problems.push('panel-height');
  }
  // ---- audit
  const texts = [...scenes.map(S => S.headerBox), ...(panel ? panel.boxes : [])];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (overlaps(texts[i], texts[j], 2)) { problems.push('overlap'); i = texts.length; break; }
  for (const S of scenes) {
    if (panel && panel.boxes.some(b => overlaps(b, S.bOuter, 2))) problems.push('panel-on-plan');
    if (scenes.some(T2 => overlaps(T2.headerBox, S.bOuter, 2))) problems.push('header-on-plan');
    if (S.bOuter.x < -0.5 || S.bOuter.y < -0.5 || S.bOuter.x + S.bOuter.w > D.w + 0.5 || S.bOuter.y + S.bOuter.h > D.h + 0.5) problems.push('plan-frame');
  }
  if (overlaps(SA.bOuter, SB.bOuter, 4)) problems.push('plans-touch');
  if (showKey) {
    const ext = unionBox([SA.bOuter, SB.bOuter, ...texts]);
    if (Math.min(ext.w / D.w, ext.h / D.h) < 0.78) problems.push('fill');
  }
  return {
    planShare: scenes.reduce((a, S2) => a + S2.bOuter.w * S2.bOuter.h, 0) / (D.w * D.h), mode: A.mode, F, px, k, scenes, guidePath, personPx,
    panelNode: panel ? panel.node : null, hasNote: Boolean(panel && showAll), hasGuideLabel: Boolean(panel && showAll),
    problems, arrangement: `${A.key}`,
  };
}

/** The shared strip: every fact both scenes share, drawn once. */
function panelItems(ctx, p, F, showAll, showKey, packed) {
  const th = ctx.theme;
  const items = [];
  if (showKey) {
    items.push(legendItem(ctx, {kind: 'pub', text: p.courts.hearing, F, name: 'legend-pub', weight: 700}));
    items.push(legendItem(ctx, {kind: 'zone', text: p.courts.deliberation, F, name: 'legend-zone', weight: 700}));
    items.push(legendItem(ctx, {kind: 'building', text: p.courts.building, F, name: 'legend-building', weight: 600}));
    // (packed: the participants share one row, in badge order A, B, C…)
    if (packed) items.push(legendItem(ctx, {kind: 'letter', text: p.seats.participants.map(q => q.name).join(' · '), F, name: 'legend-people', maxLines: 6, glyphOpts: {letter: LETTERS[0]}}));
    else p.seats.participants.forEach((q, i) => items.push(legendItem(ctx, {kind: 'letter', text: q.name, F, name: `legend-p${i}`, glyphOpts: {letter: LETTERS[i]}})));
  }
  if (showAll) {
    items.push(legendItem(ctx, {kind: 'bench', text: p.seats.bench, F, name: 'legend-bench'}));
    items.push(legendItem(ctx, {kind: 'partition', text: p.routes.partition, F, name: 'legend-partition'}));
    items.push(legendItem(ctx, {kind: 'track', text: p.routes.track, F, name: 'legend-track'}));
    items.push(legendItem(ctx, {kind: 'gap', text: p.labels.gap, F, name: 'legend-gap'}));
    items.push(legendItem(ctx, {kind: 'sequence', text: p.labels.sequence, F, name: 'legend-sequence'}));
    p.sharedFacts.forEach((f, i) => items.push(legendItem(ctx, {kind: 'same', text: f, F, name: `shared${i}`})));
    items.push(captionItem(ctx, p.changedFact, F, 'changed-fact'));
    // the guide's label (keyed by the same accent line) and the neutral note appear with the guide
    items.push({type: 'legend', make: w => {
      const gs = F * 2.1;
      const f = fitG(p.comparisonLabels.guide, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines: 3, weight: 600});
      const hh = Math.max(gs * 0.6, f.height + F * 0.25);
      return {h: hh, truncated: f.truncated, node: (x, y) => g({name: 'guide-label', opacity: 0},
        h('path', {d: `M${r(x + 2)} ${r(y + hh / 2)}H${r(x + gs - 4)}`, stroke: th.accent2, 'stroke-width': 4, 'stroke-linecap': 'round'}),
        h('path', {d: roundRectPath(x + gs * 0.25, y + hh / 2 - F * 0.45, gs * 0.5, F * 0.9, 4), fill: 'none', stroke: th.accent2, 'stroke-width': 3}),
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
    slug: 'courts-08-contrast',
    title: 'Separate deliberation — audiencia and deliberación compared as two configurations',
    titleEs: 'Deliberación separada — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Deliberación separada',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical floor plans of the same generic building. A is labelled "Audiencia" (●, the public space) and B "Deliberación" (◆, the abstract zone), with equal weight. The action then runs in parallel, adapted only to that configuration: in B the partition door closes and the public space moves apart from the zone; in A the spaces stay joined. A comparative guide joins the one detail that differs; a neutral note: no winner, no score, no outcome. No rule about attendance, secrecy, votes or decisions is shown.',
    tags: ['floor plan', 'contrast', 'paired scenes', 'hearing room', 'deliberation zone', 'partition', 'separation', 'participants', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/deliberacion-separada.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
