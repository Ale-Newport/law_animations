/**
 * LAW-0208 — Jerarquía judicial editable · inspect
 *
 * Storyboard (the context is the state produced by the story: generic
 * buildings standing on their podiums at their supplied levels, the level
 * ruler with its editable names, the supplied links over the roofs; at the
 * foot of ONE podium — the inspected body — a tag carries the supplied datum,
 * e.g. "Placed at: Level 1 (as configured)"):
 *  0.00–0.20  build: the podiums rise to their supplied levels and the links
 *             draw; the tag is already readable at the foot of its podium.
 *  0.20–0.45  isolate: a frame settles on the tag; the texts of the scene fade
 *             (they would fall below 16 px), the whole scene shrinks into a
 *             corner of its area (people stay >= 45 px) and a lens opens in the
 *             freed space — never over the scene — with a REAL enlarged copy of
 *             the same coordinates (the foot of the podiums and the tag), tied
 *             to the frame by two guides. The tag is wholly inside the lens.
 *  0.45–0.75  substitute ONE datum: every line of the old value is struck; the
 *             old value leaves the tag and docks under it as a grey "was: …"
 *             chip; the new supplied value appears in the tag and stays still.
 *             Only the dependent geometry follows: for a level substitution the
 *             inspected podium moves to the supplied level and its links re-route
 *             (seen in the shrunk scene beside the lens); for a wording
 *             substitution nothing moves.
 *  0.75–1.00  return: the lens closes, the scene grows back to fill its area
 *             with the new state, its texts return, the struck old value stays
 *             docked and a neutral changed-datum marker (Δ) sits beside the tag;
 *             a panel note repeats the marker. Seeking back restores the old
 *             datum exactly. No validity, review, outcome or rank is inferred.
 * @module animations/courts/LAW-0208
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {planColors} from './kits/courts-art.js';
import {
  hierFields, HIER_STRINGS, resolveHier, podiumGeometry, podiumScene, pxPerUnit, lookFor, fitG, fitOk, cardH, labelCard, textAt, measureInfo, drawInfo,
  overlaps, R2,
} from './kits/jerarquia-editable.js';

const ID = 'LAW-0208';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  rise: [0.03, 0.15], links: [0.15, 0.19], frame: [0.2, 0.24], shrink: [0.21, 0.26], open: [0.245, 0.315],
  strike: [0.46, 0.5], dock: [0.51, 0.55], newIn: [0.555, 0.585], move: [0.59, 0.66],
  close: [0.715, 0.76], grow: [0.74, 0.8], textIn: [0.83, 0.855], marker: [0.855, 0.89],
};

const STRINGS = {
  en: {...HIER_STRINGS.en, markerNote: 'Changed datum (as supplied)'},
  es: {...HIER_STRINGS.es, markerNote: 'Dato cambiado (según lo aportado)'},
};

const sceneSchema = {
  ...hierFields({maxBodies: 3, maxLevels: 3, labelMax: 40, levelMax: 36, maxSeats: 2}),
  focusBody: int('Which body (index in courts.bodies) carries the inspected tag', 0, 2),
  focusTarget: oneOf('level: the supplied level of the body is substituted (its podium moves to afterLevel); wording: only the wording of the tag changes', ['level', 'wording']),
  beforeValue: str('Value shown on the tag before the substitution', 44),
  afterValue: str('Value shown on the tag after the substitution (the alternative datum)', 44),
  afterLevel: int('For focusTarget "level": the supplied level (1-based) after the substitution', 1, 3),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Maximum magnification of the lens relative to the context', 1.5, 4),
    placement: oneOf('Where the freed space for the lens is taken', ['auto', 'right', 'bottom']),
  }),
  contextLabels: obj('Labels of the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
  }),
};

const defaultParams = {
  courts: {
    levels: [{name: 'Origin level (as configured)'}, {name: 'Level 2 (as configured)'}, {name: 'Configured review level'}],
    bodies: [
      {label: 'Body X (fictional)', level: 1},
      {label: 'Level 2 body (fictional)', level: 2},
      {label: 'Review body (as configured)', level: 3},
    ],
  },
  routes: [{from: 0, to: 1, kind: 'relation'}, {from: 1, to: 2, kind: 'relation'}],
  seats: 2,
  labels: {note: 'Hierarchy as configured (illustrative)', key: 'Levels and placements as supplied · no conclusion drawn'},
  people: [],
  focusBody: 0,
  focusTarget: 'level',
  beforeValue: 'Placed at: origin level',
  afterValue: 'Placed at: configured review level',
  afterLevel: 3,
  detailGeometry: {zoom: 3, placement: 'auto'},
  contextLabels: {context: 'The supplied hierarchy, one tag inspected', marker: 'One supplied datum changed'},
};

/** Fractional level during the build: all rise to their supplied level. */
function buildLevel(u, level, reduced) {
  const t = seg(u, ...W.rise);
  return level * (reduced ? ease.inOutQuad(t) : ease.inOutCubic(t));
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const R = resolveHier(p);
    const fi = Math.min(p.focusBody, R.M - 1);
    const moves = p.focusTarget === 'level' && Math.min(R.N, p.afterLevel) !== R.bodies[fi].level;
    const afterLevel = p.focusTarget === 'level' ? Math.min(R.N, p.afterLevel) : R.bodies[fi].level;
    const levelsMax = i => (i === fi ? Math.max(R.bodies[fi].level, afterLevel) : R.bodies[i].level);
    const wasText = `${ctx.t.was}: ${p.beforeValue}`;
    const items = [];
    if (showAll) items.push({type: 'text', text: p.contextLabels.context, weight: 600});
    if (showAll) items.push({type: 'marker', text: p.contextLabels.marker});
    if (showKey) items.push({type: 'key', text: p.labels.key});
    const shape = ctx.view.shape;
    let best = null;
    const log = [];
    for (let F = 21.5 / px; F >= 16.6 / px - 1e-6; F -= (F * px > 20.2 ? 0.8 : 0.4) / px) {
      const opts = [];
      if (shape === 'landscape') for (const cf of [0.18, 0.22]) opts.push({kind: 'column', cf});
      else opts.push({kind: 'strip'});
      opts.push({kind: 'gutter'});
      for (const op of opts) {
        const L = compose(ctx, {p, R, F, px, fi, moves, afterLevel, levelsMax, wasText, items: items.map(it => (it.type === 'marker' ? {...it, type: 'legend', kind: 'changed', marker: true} : it)), op, showAll, showKey});
        log.push(`${(F * px).toFixed(1)}/${op.kind}${op.cf || ''}:${L ? L.problems.join('+') || 'ok' : 'null'}`);
        if (!L) continue;
        if (!best || (L.problems.length < best.problems.length) || (L.problems.length === best.problems.length && L.score > best.score + 1e-6 && L.F >= best.F - 1e-9)) best = L;
      }
      if (best && !best.problems.length && best.F * px >= 19.5 - 1e-6) break;
      if (best && !best.problems.length && F * px < 19.5) break;
    }
    if (!best) {
      best = compose(ctx, {p, R, F: 16.6 / px, px, fi, moves, afterLevel, levelsMax, wasText, items: [], op: {kind: 'strip'}, showAll: false, showKey: false, force: true});
    }
    best.log = log;
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const world = g({name: 'world'},
      L.sc.node,
      L.worldText,
      L.tag.node('cx', L.marker),
      L.panelInWorld ? L.panel : null,
      h('rect', {name: 'src-frame', x: r(L.crop.x), y: r(L.crop.y), width: r(L.crop.w), height: r(L.crop.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', opacity: 0}),
    );
    const d = L.dest;
    return g(null,
      world,
      L.panelInWorld ? null : L.panel,
      L.guides.map((gd, i) => h('line', {name: `guide${i}`, x1: 0, y1: 0, x2: 0, y2: 0, stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0})),
      // the lens: an opaque window with a real enlarged copy of the same world coordinates
      g({name: 'lz', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lz-clip')}, h('rect', {x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18}))),
        h('rect', {x: r(d.x + 6), y: r(d.y + 10), width: r(d.w), height: r(d.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lz-bg', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: th.paper}),
        g({'clip-path': ctx.ref('lz-clip')},
          g({name: 'lz-content', transform: `${T(d.x - L.crop.x * L.zoom, d.y - L.crop.y * L.zoom)} scale(${r(L.zoom, 4)})`},
            L.lzScene.node,
            L.tag.node('lz'))),
        h('rect', {name: 'lz-border', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const {R, fi, geo} = L;
    const nodes = {};
    // build: every podium rises to its supplied level; later the inspected one moves to the supplied level
    const mv = L.moves ? ease.inOutCubic(seg(u, ...W.move)) : 0;
    const lv = R.bodies.map((b, i) => {
      const base = buildLevel(u, b.level, ctx.reduced);
      return i === fi && L.moves ? base + (L.afterLevel - b.level) * mv : base;
    });
    const linkP = R.links.map((l, i) => seg(u, W.links[0] + (i * (W.links[1] - W.links[0])) / Math.max(1, R.links.length), W.links[0] + ((i + 1) * (W.links[1] - W.links[0])) / Math.max(1, R.links.length)));
    const sh0 = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    // texts on the context show only while >= 16 px and while the context is not slid out on the left
    const inFrame = sh0 <= 1e-6 || L.leftCut <= L.sceneBox.x + 1e-6;
    const textOp0 = L.F * L.px * lerp(1, L.sT, sh0) >= 16 - 1e-6 && inFrame ? 1 : 0;
    const f = L.sc.frame(lv, {ruler: 1, links: linkP, textOp: textOp0, scaffold: 1});
    Object.assign(nodes, f.nodes);
    // the scene shrinks into its corner while the lens is open, and grows back
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, L.sT, sh);
    const off = {x: lerp(0, L.offT.x, sh), y: lerp(0, L.offT.y, sh)};
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    nodes.world = {transform: `${T(off.x, off.y)} scale(${r(sc, 4)})`};
    // texts of the scene stay while >= 16 px and fade only below that
    const textOp = textOp0;
    nodes['world-text'] = {opacity: r(textOp, 3)};
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1], W.close[1] + 0.03));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    // the tag in the scene: shown whenever it is >= 16 px (hidden only while the lens, which holds its enlarged
    // copy, is open)
    // the tag stays at screen size (never below 16 px) while the scene is small; it is hidden only while the lens,
    // which holds its enlarged copy, is open
    const tagOp = 1 - open;
    const ss = Math.max(sc, 16.5 / (L.F * L.px));
    const strike = seg(u, ...W.strike), dock = seg(u, ...W.dock), newIn = seg(u, ...W.newIn);
    Object.assign(nodes, L.tag.frame('cx', {strike, dock, newIn, op: tagOp}));
    const tc = {x: L.tagBox.x + L.tagBox.w / 2, y: L.tagBox.y + L.tagBox.h};
    nodes['cx-tag'].transform = scaleAbout(tc.x, tc.y, r(ss / sc, 4));
    // the tag (and the marker) ride on the inspected podium
    const dyF = f.roofs[fi].top - geo.restTop;
    nodes['cx-ride'] = {transform: T(0, dyF)};
    nodes['lz-ride'] = {transform: T(0, dyF)};
    const ls = 0.6 + 0.4 * open;
    // the lens copy's text shows only once it is >= 16 px (the window grows from 60 %)
    const lensTextOk = L.F * L.px * L.zoom * ls >= 16 - 1e-6 ? 1 : 0;
    Object.assign(nodes, L.tag.frame('lz', {strike, dock, newIn, op: lensTextOk}));
    nodes['lz-tag'].transform = scaleAbout(tc.x, tc.y, 1);
    // the lens copy: the same podium scene; only the inspected column (with the level bands and lines) is shown
    const fz = L.lzScene.frame(lv, {ruler: 1, links: R.links.map(() => 0), textOp: lensTextOk, scaffold: 1});
    Object.assign(nodes, fz.nodes);
    R.bodies.forEach((b, i) => {
      if (i === fi) return;
      nodes[`lz-u${i}`] = {...nodes[`lz-u${i}`], opacity: 0};
      nodes[`lz-pod${i}`] = {...nodes[`lz-pod${i}`], opacity: 0};
    });
    nodes[`lz-u${fi}`] = {...nodes[`lz-u${fi}`], opacity: 1};
    nodes[`lz-pod${fi}`] = {...nodes[`lz-pod${fi}`], opacity: 1};
    const d = L.dest;
    const lc = {x: d.x + d.w / 2, y: d.y + d.h / 2};
    nodes.lz = {opacity: r(open, 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    // guides: from the (shrinking) frame to the lens corners
    const c0 = wt(L.guideFrom[0]), c1 = wt(L.guideFrom[1]);
    const gTo = L.guideTo.map(q => ({x: lc.x + (q.x - lc.x) * ls, y: lc.y + (q.y - lc.y) * ls}));
    [c0, c1].forEach((q, i) => { nodes[`guide${i}`] = {x1: r(q.x), y1: r(q.y), x2: r(gTo[i].x), y2: r(gTo[i].y), opacity: r(Math.min(fr, open > 0.05 ? 1 : 0), 3)}; });
    const markerP = seg(u, ...W.marker);
    if (L.marker) nodes['cx-marker'] = {opacity: r(markerP, 3)};
    const pOp = L.panelInWorld ? textOp : 1;
    const pOp2 = L.lensOverPanel ? 1 - open : 1;
    L.panelNames.forEach(n => { nodes[n.name] = {opacity: r((n.type === 'marker' ? markerP : 1) * pOp * pOp2, 3)}; });
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    // people (seated in the room plans) in root design units
    const people = L.sc.people.map(q => {
      const dy = f.roofs[q.body].top - geo.restTop;
      return wt({x: q.x, y: q.y + dy});
    });
    const pr = 50 * geo.ps * sc;
    const lensRect = {x: lc.x - d.w * ls / 2, y: lc.y - d.h * ls / 2, w: d.w * ls, h: d.h * ls};
    const shrunkScene = {x: off.x + L.shrinkBox.x * sc, y: off.y + L.shrinkBox.y * sc, w: L.shrinkBox.w * sc, h: L.shrinkBox.h * sc};
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(open, 3),
        contextScale: r(sc, 3),
        textOnScene: r(textOp, 3),
        tagInScene: r(tagOp, 3),
        datum,
        strike: r(strike, 3),
        oldDocked: r(dock, 3),
        newShown: r(newIn, 3),
        focusTarget: p.focusTarget,
        moves: L.moves,
        levelsNow: lv.map(v => r(v, 3)),
        focusLevel: r(lv[fi], 3),
        beforeLevel: R.bodies[fi].level,
        afterLevel: L.afterLevel,
        zoom: r(L.zoom / L.sT, 2),
        lensScale: r(L.zoom, 3),
        lensCopyAt: {x: r(L.crop.x), y: r(L.crop.y)},
        tagAt: {x: r(L.tagBox.x), y: r(L.tagBox.y + dyF)},
        // lens size as a share of the frame's short side (its long and short dimensions)
        contextShare: r(((L.sceneBox.x + L.sceneBox.w) * sc + off.x - Math.max(0, off.x + L.leftCut * sc)) / ctx.design.w, 3),
        spanShare: open > 0.5 ? r((d.x + d.w * (1 + ls) / 2 - Math.max(0, off.x + L.leftCut * sc)) / ctx.design.w, 3) : null,
        lensLong: r(Math.max(L.dest.w, L.dest.h) * L.px / 1080, 3),
        lensShort: r(Math.min(L.dest.w, L.dest.h) * L.px / 1080, 3),
        stackInCrop: L.stackInCrop,
        lensClearOfPeople: open === 0 || people.every(q => !overlaps(lensRect, {x: q.x - pr, y: q.y - pr, w: 2 * pr, h: 2 * pr}, 0)),
        lensClearOfScene: open === 0 || !overlaps(lensRect, shrunkScene, 0),
        lensClearOfSource: !overlaps(L.dest, L.cropShrunk, 0),
        markerShown: r(markerP, 3),
        markerClearOfHeads: L.markerClear,
        others: lv.map((v, i) => (i === fi ? null : r(v, 3))),
        roofs: f.roofs.map(R2),
        focusRoof: R2(wt({x: f.roofs[fi].x, y: f.roofs[fi].y})),
        linkPaths: f.paths.map(q => q.d),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPxShrunk: r(geo.ps * 100 * L.px * L.sT, 1),
        placement: L.placement,
        log: L.log,
      },
    };
  },
};

/** One composition at text size F. */
function compose(ctx, o) {
  const {p, R, F, px, fi, op, showAll, showKey} = o;
  const th = ctx.theme;
  const D = ctx.design;
  const problems = [];
  const gap = 30 / px;
  // ---- panel (column on wide frames, strip under the scene otherwise)
  let panelM = [];
  let sceneBox, panelAt;
  if (op.kind === 'gutter') {
    sceneBox = {x: 0, y: 0, w: D.w, h: D.h};
  } else if (op.kind === 'column') {
    const cw = D.w * op.cf;
    const m = o.items.length ? measureInfo(o.items, cw, F) : {items: [], height: 0, gap: 0, w: cw};
    if (!m) return null;
    panelM = [m];
    sceneBox = {x: 0, y: 0, w: D.w - cw - gap, h: D.h};
    panelAt = [{x: D.w - cw, y: Math.max(0, (D.h - m.height) * 0.5)}];
  } else {
    const cw = (D.w - gap) / 2;
    const halves = [o.items.filter(it => it.type !== 'key'), o.items.filter(it => it.type === 'key')];
    const ms = halves.map(hs => (hs.length ? measureInfo(hs, cw, F) : {items: [], height: 0, gap: 0, w: cw}));
    if (ms.some(m => !m)) return null;
    const sh = Math.max(...ms.map(m => m.height));
    panelM = ms;
    sceneBox = {x: 0, y: 0, w: D.w, h: D.h - (sh ? sh + 20 / px : 0)};
    panelAt = [{x: 0, y: D.h - sh}, {x: cw + gap, y: D.h - sh}];
  }
  const tagTexts = [p.beforeValue, p.afterValue];
  const geo = podiumGeometry(ctx, {box: sceneBox, R, F, px, showKey: showKey && !o.force, title: showKey && !o.force ? p.labels.note : null, levelsMax: o.levelsMax,
    plate: {groups: [tagTexts, [o.wasText]], extra: o.extra ? F * 2.2 : 0}, personPx: showKey && !o.force ? 68 : 84, minRatio: 0.45,
    gutterItems: op.kind === 'gutter' ? o.items : null, gutterFracs: op.kind === 'gutter' ? [0.24, 0.28, 0.32] : undefined});
  if (!geo) return null;
  if (op.kind === 'gutter') {
    if (geo.gInfo) { panelM = [geo.gInfo]; panelAt = [{x: geo.box.x, y: geo.gInfoY}]; }
    else if (o.items.length) return null;
  }
  const sc = podiumScene(ctx, geo, {prefix: 'h-', R, F, showKey: showKey && !o.force, bands: true, looks: (i, j) => lookFor(ctx, p, i, j)});
  // the lens holds a real copy of the same scene (same coordinates); only the inspected column is shown in it
  const lzScene = podiumScene(ctx, geo, {prefix: 'lz-', R, F, showKey: showKey && !o.force, bands: true, plates: false, rule: false, looks: (i, j) => lookFor(ctx, p, i, j)});
  // ---- the tag stack rides on the inspected podium face, under its label
  const col = geo.cols[fi];
  const tag = tagStack(ctx, {geo, col, F, p, wasText: o.wasText, show: showKey && !o.force});
  // ---- world texts (fade while the scene is small)
  const worldText = [];
  if (geo.titleFit) worldText.push(textAt(geo.titleFit, geo.box.x, geo.titleY, th.fg));
  // ---- shrink target and freed region
  const personPx = geo.ps * 100 * px;
  // the context yields as little as the lens needs: the largest scale (texts kept >= 16 px when possible, people
  // >= 45 px always) whose freed space still holds a >= 1.55x lens; it keeps >= ~47 % of the width
  const sPeople = 45.5 / personPx;
  let sT = sPeople;
  // the crop is a tall column: the freed space is taken on the right in every ratio unless supplied otherwise
  const placement = p.detailGeometry.placement === 'auto' ? 'right' : p.detailGeometry.placement;
  const cands = placement ? [placement] : ['right', 'bottom'];
  const stack = tag.box;
  const m = F * 0.9;
  // crop: the inspected column from its highest building roof (before or after) down to the lowest tag position,
  // so the podium's move to the supplied level happens inside the lens; neighbouring columns are not copied
  const lvB = R.bodies[fi].level, lvA = o.afterLevel;
  const dyOf = lv => geo.lineY(lv) - geo.restTop;
  const topY = Math.min(geo.lineY(lvB), geo.lineY(lvA)) - 3 - geo.bh - F * 0.9;
  const botY = Math.max(stack.y + stack.h + dyOf(lvB), stack.y + stack.h + dyOf(lvA)) + F * 2.4 + m;
  const cx0 = col.x - geo.colGap / 2 + 1, cx1 = col.x + col.w + geo.colGap / 2 - 1;
  // down to the podium base: the whole column is copied and the lower guide runs along the ground, under every label
  const crop = {x: cx0, y: topY, w: cx1 - cx0, h: geo.G + 4 - topY};
  void botY;
  let bestL = null;
  const x0 = sceneBox.x;
  const sceneW = sceneBox.w;
  const sTop = Math.min(0.92, Math.max(sPeople, 16.2 / (F * px)));
  for (let st = sTop; st >= sPeople - 1e-9 && !(bestL && bestL.ok); st -= 0.02) {
    // the scene shrinks toward its left edge (vertically centred); the lens takes the space on its right, up to the
    // design edge (a panel column there steps aside while the lens is open)
    // when the gutter's texts would fall below 16 px they fade: the gutter is then slid out on the left so no empty
    // band remains (only hidden text leaves the frame) and the columns start at the scene's left edge
    const textOK = F * px * st >= 16 - 1e-6;
    const leftCut = textOK ? x0 : Math.max(x0, geo.colsX - 20);
    const anchorY = sceneBox.y + sceneBox.h / 2;
    const offT = {x: x0 - leftCut * st, y: anchorY * (1 - st)};
    const shr = q => ({x: offT.x + q.x * st, y: offT.y + q.y * st});
    const ctxRight = offT.x + (x0 + sceneW) * st;
    const region = {x: ctxRight + gap, y: 0, w: D.w - (ctxRight + gap), h: op.kind === 'strip' ? sceneBox.h : D.h};
    if (region.w < 60) continue;
    const zMax = p.detailGeometry.zoom * st;
    const z = Math.min(zMax, (region.w - 12) / crop.w, (region.h - 12) / crop.h);
    const dest = {w: crop.w * z, h: crop.h * z, x: region.x + (region.w - crop.w * z) / 2, y: region.y + (region.h - crop.h * z) / 2};
    const cs = {...shr({x: crop.x, y: crop.y}), w: crop.w * st, h: crop.h * st};
    const zoomRel = z / st;
    const ctxShare = (ctxRight - x0) / D.w;
    const L = {pl: 'right', offT, dest, z, zoomRel, cs, sT: st, ctxShare, leftCut, ok: zoomRel >= 1.55 && ctxShare >= 0.47};
    if (!bestL || (L.ok && !bestL.ok) || (!bestL.ok && L.zoomRel > bestL.zoomRel)) bestL = L;
  }
  if (!bestL) return null;
  sT = bestL.sT;
  if (bestL.zoomRel < 1.5 - 1e-9) problems.push('zoom');
  if (bestL.ctxShare < 0.45) problems.push('context-narrow');
  // guides: from the source frame corners facing the lens to the matching lens corners
  const {dest} = bestL;
  const guideFrom = bestL.pl === 'right'
    ? [{x: crop.x + crop.w, y: crop.y}, {x: crop.x + crop.w, y: crop.y + crop.h}]
    : [{x: crop.x, y: crop.y + crop.h}, {x: crop.x + crop.w, y: crop.y + crop.h}];
  const guideTo = bestL.pl === 'right'
    ? [{x: dest.x, y: dest.y}, {x: dest.x, y: dest.y + dest.h}]
    : [{x: dest.x, y: dest.y}, {x: dest.x + dest.w, y: dest.y}];
  // Δ marker beside the tag (riding with it) when the face has room, else under the docked "was" chip
  const mR = F * 0.9;
  const padTopMin = geo.restTop + geo.faceTop + geo.pad.h;
  const roomR = col.x + col.w - (tag.tagBox.x + tag.tagBox.w), roomL = tag.tagBox.x - col.x;
  let markerAt;
  if (roomR >= 2 * mR + 10 || roomL >= 2 * mR + 10) {
    const right = roomR >= 2 * mR + 10;
    markerAt = {x: right ? tag.tagBox.x + tag.tagBox.w + mR + 5 : tag.tagBox.x - mR - 5, y: tag.tagBox.y + tag.tagBox.h / 2};
  } else {
    markerAt = {x: col.cx, y: tag.box.y + tag.box.h + mR + 6};
  }
  const marker = changedMarker(ctx, {name: 'cx-marker', x: markerAt.x, y: markerAt.y, radius: mR, opacity: 0});
  const markerClear = markerAt.y - mR > padTopMin && markerAt.y + mR <= geo.restTop + geo.H0 - 2;
  if (!markerClear && !o.extra) return compose(ctx, {...o, extra: true});
  if (!markerClear && showKey) problems.push('marker');
  // panel nodes
  const panel = [];
  const panelNames = [];
  panelM.forEach((mm, i) => {
    if (!mm.items.length) return;
    const dd = drawInfo(ctx, mm, panelAt[i].x, panelAt[i].y, F, `pn${i}-`);
    dd.nodes.forEach((n, j) => {
      panelNames.push({name: n.name, type: mm.items[j].marker ? 'marker' : n.type});
      panel.push(n.node);
    });
  });
  const cropShrunk = bestL.cs;
  const inCrop = (b, dy) => b.x >= crop.x && b.y + dy >= crop.y && b.x + b.w <= crop.x + crop.w && b.y + b.h + dy <= crop.y + crop.h;
  const stackInCrop = inCrop(stack, dyOf(lvB)) && inCrop(stack, dyOf(lvA));
  const score = geo.k + bestL.zoomRel * 0.05;
  return {
    F, px, R, fi, geo, sc, worldText: g({name: 'world-text'}, worldText), tag, crop, cropShrunk, dest, zoom: bestL.z, sT, offT: bestL.offT,
    guideFrom, guideTo, guides: [0, 1], lzScene, marker, dyOf, markerClear, panel: g({name: 'panel'}, panel), panelNames, problems, score, moves: o.moves, afterLevel: o.afterLevel,
    panelInWorld: op.kind === 'gutter', lensOverPanel: op.kind === 'column', ctxShare: bestL.ctxShare, leftCut: bestL.leftCut, sceneBox, shrinkBox: false ? {x: geo.colsX - 12 / px, y: sceneBox.y, w: sceneBox.x + sceneBox.w - geo.colsX + 12 / px, h: sceneBox.h} : sceneBox, placement: bestL.pl, stackInCrop, tagBox: tag.box,
  };
}

/**
 * The inspected tag at the foot of its podium: a card with the before value and
 * the after value (never visible together: the old one is struck and leaves, the
 * new one arrives), strike lines on every line of the old value, and a grey
 * docked "was: …" chip under it. Drawn twice (scene 'cx' and lens 'lz') with the
 * same coordinates.
 */
function tagStack(ctx, {geo, col, F, p, wasText, show}) {
  const th = ctx.theme;
  const [fb, fa] = geo.plateGroups.length ? geo.plateGroups[0] : [null, null];
  const [fw] = geo.plateGroups.length ? geo.plateGroups[1] : [null];
  const padX = F * 0.42, padY = F * 0.34;
  const tagW = fb ? Math.min(col.w - 12, Math.max(fb.width, fa.width) + padX * 2) : col.w * 0.6;
  const tagH = fb ? Math.max(cardH(fb, F), cardH(fa, F)) : 30;
  const wasH = fw ? cardH(fw, F) : 0;
  const wasW = fw ? fw.width + padX * 2 : 0;
  // under the body label on the podium face (it rides with the podium)
  const y0 = geo.restTop + geo.faceTop + geo.pad.h + 8 + (geo.LH ? geo.LH + 10 : 4);
  const x0 = col.cx - tagW / 2;
  const box = {x: Math.min(x0, col.cx - wasW / 2), y: y0, w: Math.max(tagW, wasW), h: tagH + 8 + wasH};
  const strikesOf = (fit, x, y, name) => fit.lines.map((ln, i) => {
    const lw = ctx.measure(ln, fit.size, fit.weight, fit.family);
    const yy = y + fit.size * 0.8 + i * fit.lineHeight - fit.size * 0.3;
    return h('line', {name: `${name}${i}`, x1: r(col.cx - lw / 2 - 3), y1: r(yy), x2: r(col.cx - lw / 2 - 3), y2: r(yy), stroke: th.accent, 'stroke-width': 3, 'stroke-linecap': 'round', 'data-w': r(lw + 6)});
  });
  const node = (pre, extra = null) => g({name: `${pre}-ride`}, g({name: `${pre}-tag`},
    // labels hidden: no blank chip — the moving podium itself carries the change
    show ? h('path', {name: `${pre}-tag-body`, d: roundRectPath(x0, y0, tagW, tagH, Math.min(tagH / 2, F * 0.55)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}) : null,
    show && fb ? g({name: `${pre}-old`}, textAt(fb, col.cx, y0 + (tagH - fb.height) / 2, th.ink, {anchor: 'middle'}), g({name: `${pre}-strikes`}, strikesOf(fb, col.cx, y0 + (tagH - fb.height) / 2, `${pre}-st`))) : null,
    show && fa ? g({name: `${pre}-new`, opacity: 0}, textAt(fa, col.cx, y0 + (tagH - fa.height) / 2, th.ink, {anchor: 'middle'})) : null,
    show && fw ? g({name: `${pre}-was`, opacity: 0},
      h('path', {d: roundRectPath(col.cx - wasW / 2, y0 + tagH + 8, wasW, wasH, Math.min(wasH / 2, F * 0.55)), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.5, 'stroke-dasharray': '5 4'}),
      textAt(fw, col.cx, y0 + tagH + 8 + (wasH - fw.height) / 2, th.inkSoft, {anchor: 'middle'}),
      fw.lines.map((ln, i) => {
        const lw = ctx.measure(ln, fw.size, fw.weight, fw.family);
        const yy = y0 + tagH + 8 + (wasH - fw.height) / 2 + fw.size * 0.8 + i * fw.lineHeight - fw.size * 0.3;
        return h('line', {x1: r(col.cx - lw / 2 - 2), y1: r(yy), x2: r(col.cx + lw / 2 + 2), y2: r(yy), stroke: th.inkSoft, 'stroke-width': 2});
      })) : null,
  ), extra);
  const frame = (pre, s) => {
    const out = {[`${pre}-tag`]: {opacity: r(s.op, 3)}};
    if (!show || !fb) return out;
    // strike every line of the old value, then the old value leaves the tag while the docked copy arrives
    fb.lines.forEach((ln, i) => {
      const lw = ctx.measure(ln, fb.size, fb.weight, fb.family) + 6;
      const x1 = col.cx - lw / 2;
      out[`${pre}-st${i}`] = {x1: r(x1), x2: r(x1 + lw * s.strike)};
    });
    out[`${pre}-old`] = {opacity: r(1 - s.dock, 3), transform: T(0, -F * 0.6 * s.dock)};
    out[`${pre}-was`] = {opacity: r(s.dock, 3)};
    out[`${pre}-new`] = {opacity: r(s.newIn, 3)};
    return out;
  };
  return {node, frame, box, tagBox: {x: x0, y: y0, w: tagW, h: tagH}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-02-inspect',
    title: 'Editable hierarchy — inspecting one body’s supplied level and substituting it',
    titleEs: 'Jerarquía judicial editable — Inspección y cambio de un dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Jerarquía judicial editable',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Generic fictional buildings stand on podiums at their supplied levels. The scene shrinks into a corner while a lens enlarges a real copy of the tag at the foot of one podium; its supplied value is struck, docked as "was: …" and replaced by the alternative value, and only the dependent geometry follows (that podium moves to the supplied level and its links re-route). The scene grows back with a neutral Δ marker. No real court system, review or outcome is depicted.',
    tags: ['hierarchy', 'inspect', 'lens', 'substitution', 'origin level', 'configured review level', 'generic buildings', 'podium', 'as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/jerarquia-editable.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
