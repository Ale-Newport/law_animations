/**
 * LAW-0205 — Jerarquía judicial editable · story
 *
 * Storyboard (generic buildings in elevation, each on its own stone podium;
 * the podium face carries the plan of the building's highlighted room with
 * the people seated in it, and the body's editable label. A level ruler on
 * the left will carry the SUPPLIED levels):
 *  0.00–0.15  rest: every building stands at the same height in a flat row,
 *             in the supplied list order, with its label, room plan and
 *             seated people, under the still-empty scaffold of the supplied
 *             levels (faint bands, dashed lines, name plates). Legend, notes and
 *             key are readable. Nothing is ordered yet.
 *  0.15–0.26  the supplied hierarchy is applied first (cause before effect):
 *             the level bands and lines strengthen before any podium moves.
 *  0.26–0.66  the action: the podiums rise in steps. All podiums rise to the
 *             first line together; those whose supplied level is higher keep
 *             rising, step by step, until every building stands on the line
 *             of its supplied level. Room plan, people and label ride on
 *             their podium; nothing jumps or crosses another building.
 *  0.66–0.73  the supplied links draw over the roofs, one after another
 *             (plain relation: dots at both ends, no arrow; an arrow only
 *             for a link supplied as "sequence").
 *  0.73–1.00  hold: the supplied final state (all placed, or the last body
 *             still at rest with a dashed outline of its supplied level),
 *             the legend, the keyed notes, the note "hierarchy as configured
 *             (illustrative)" and the key "as supplied · no conclusion drawn".
 *             No review is shown to happen; no outcome, no ranking verdict.
 * @module animations/courts/LAW-0205
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {planColors} from './kits/courts-art.js';
import {
  hierFields, HIER_EN, HIER_STRINGS, resolveHier, podiumGeometry, podiumScene, pxPerUnit, measureInfo, drawInfo, lookFor, R2,
} from './kits/jerarquia-editable.js';

const ID = 'LAW-0205';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {ruler: [0.15, 0.26], rise: [0.27, 0.66], links: [0.665, 0.73], notes: [0.745, 0.8]};
const TARGETS = ['ruler', 'firstBody', 'lastBody', 'firstLink'];

const sceneSchema = {
  ...hierFields({maxBodies: 4, maxLevels: 4}),
  actorLabels: obj('Caption of the person glyph in the legend', {
    people: str('Caption for the people seated in the room plans', 50),
  }),
  objectLabels: obj('Captions of the legend glyphs', {
    building: str('Caption for a generic building', 60),
    room: str('Caption for the room plan on a podium', 60),
    link: str('Caption for a link line', 60),
  }),
  actionProgress: num('How far the ordering is allowed to progress (1 = every podium reaches its level; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a dashed ring drawn on its target', obj('Note', {
    target: oneOf('What the note refers to', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no conclusion is inferred)', ['all-placed', 'last-pending']),
};

const defaultParams = {
  ...HIER_EN,
  actorLabels: {people: 'People in the room (fictional)'},
  objectLabels: {building: 'Generic building (fictional)', room: 'Plan of one of its rooms', link: 'Link as configured'},
  actionProgress: 1,
  annotations: [{target: 'firstLink', text: 'Links are drawn only as supplied'}],
  finalState: 'all-placed',
};

/** Fractional level of a body at u: all rise to line 1, then higher ones continue step by step. */
function levelAt(u, level, N, reduced) {
  const [a, b] = W.rise;
  const span = (b - a) / N;
  let lv = 0;
  for (let s = 1; s <= level; s++) {
    const t = seg(u, a + (s - 1) * span, a + s * span - span * 0.12);
    lv += reduced ? ease.inOutQuad(t) : ease.inOutCubic(t);
  }
  return lv;
}

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const R = resolveHier(p);
    const M = R.M;
    const pending = p.finalState === 'last-pending' ? M - 1 : -1;
    const noteColors = [th.accent3, th.accent4];
    const finalText = pending >= 0 ? ctx.t.pending : ctx.t.placed;
    const items = [];
    if (showAll) {
      items.push({type: 'legend', kind: 'building', text: p.objectLabels.building});
      items.push({type: 'legend', kind: 'room', text: p.objectLabels.room});
      items.push({type: 'legend', kind: 'person', text: p.actorLabels.people});
      items.push({type: 'legend', kind: 'link', text: p.objectLabels.link});
      p.annotations.forEach((n, i) => items.push({type: 'note', i, text: n.text, color: noteColors[i % 2]}));
    }
    if (showKey) {
      items.push({type: 'state', text: finalText});
      items.push({type: 'key', text: p.labels.key});
    }
    const shape = ctx.view.shape;
    const tries = [];
    const F0 = 21.5 / px, Fmin = 16.6 / px;
    for (let F = F0; F >= Fmin - 1e-6 && !tries.some(t => t.geo.k >= 0.55); F -= 0.8 / px) {
      // info as a right column (wide boxes) or as a bottom strip in two columns (tall / square boxes)
      if (shape !== 'portrait') {
        for (const cf of [0.2, 0.24, 0.28]) {
          const cw = D.w * cf;
          const m = items.length ? measureInfo(items, cw, F) : {items: [], height: 0, gap: 0, w: cw};
          if (!m || m.height > D.h) continue;
          const box = {x: 0, y: 0, w: D.w - cw - 30 / px, h: D.h};
          const geo = podiumGeometry(ctx, {box, R, F, px, showKey, title: showKey ? p.labels.note : null});
          if (geo) tries.push({F, geo, info: {kind: 'column', cols: [m], x: D.w - cw, y: Math.max(0, (D.h - m.height) * 0.62), w: cw}});
        }
      }
      {
        // info in the gutter, under the level plates
        const geo = podiumGeometry(ctx, {box: {x: 0, y: 0, w: D.w, h: D.h}, R, F, px, showKey, title: showKey ? p.labels.note : null, gutterItems: items, gutterFracs: [0.24, 0.28, 0.32, 0.36]});
        if (geo && items.length) tries.push({F, geo, info: {kind: 'gutter', cols: [geo.gInfo], x: 0, y: geo.gInfoY, w: geo.gw}});
      }
      if (shape !== 'landscape') {
        // legend in the gutter under the plates; notes | state + key as a short bottom strip
        const legend = items.filter(it => it.type === 'legend');
        const halves2 = [items.filter(it => it.type === 'note'), items.filter(it => it.type === 'state' || it.type === 'key')];
        const cw2 = (D.w - 30 / px) / 2;
        const ms2 = halves2.map(hs => (hs.length ? measureInfo(hs, cw2, F) : {items: [], height: 0, gap: 0, w: cw2}));
        if (legend.length && ms2.every(Boolean)) {
          const sh = Math.max(...ms2.map(m => m.height));
          const strip = sh ? sh + 26 / px : 0;
          const geo = podiumGeometry(ctx, {box: {x: 0, y: 0, w: D.w, h: D.h - strip}, R, F, px, showKey, title: showKey ? p.labels.note : null, gutterItems: legend, gutterFracs: [0.22, 0.26, 0.3]});
          if (geo) tries.push({F, geo, info: {kind: 'mixed', cols: ms2, x: 0, y: D.h - sh, w: cw2, legend: geo.gInfo, legendY: geo.gInfoY}});
        }
      }
      if (shape !== 'landscape') {
        const halves = [items.filter(it => it.type === 'legend'), items.filter(it => it.type !== 'legend')];
        const cw = (D.w - 30 / px) / 2;
        const ms = halves.map(hs => (hs.length ? measureInfo(hs, cw, F) : {items: [], height: 0, gap: 0, w: cw}));
        if (ms.every(Boolean)) {
          const sh = Math.max(...ms.map(m => m.height));
          const strip = sh ? sh + 26 / px : 0;
          const box = {x: 0, y: 0, w: D.w, h: D.h - strip};
          const geo = podiumGeometry(ctx, {box, R, F, px, showKey, title: showKey ? p.labels.note : null});
          if (geo) tries.push({F, geo, info: {kind: 'strip', cols: ms, x: 0, y: D.h - sh, w: cw}});
        }
      }
    }
    if (!tries.length) {
      // last resort (labels hidden or impossible text): scene without info
      const geo = podiumGeometry(ctx, {box: {x: 0, y: 0, w: D.w, h: D.h}, R, F: Fmin, px, showKey: false});
      tries.push({F: Fmin, geo, info: {kind: 'none', cols: []}, fallback: true});
    }
    // the largest text size first (the loop stops at the first size with a readable scene), then the largest buildings
    tries.sort((a, b) => (b.geo.k >= 0.55) - (a.geo.k >= 0.55) || b.F - a.F || b.geo.k - a.geo.k);
    const pick = tries[0];
    const {F, geo} = pick;
    const sc = podiumScene(ctx, geo, {prefix: 'h-', R, F, showKey, bands: true, looks: (i, j) => lookFor(ctx, p, i, j)});

    // info block
    const info = [];
    const infoBoxes = [];
    if (pick.info.kind === 'column' || pick.info.kind === 'gutter') {
      const d = drawInfo(ctx, pick.info.cols[0], pick.info.x, pick.info.y, F, 'i-');
      info.push(...d.nodes); infoBoxes.push(...d.boxes);
    } else if (pick.info.kind === 'mixed') {
      const d0 = drawInfo(ctx, pick.info.legend, 0, pick.info.legendY, F, 'ig-');
      info.push(...d0.nodes); infoBoxes.push(...d0.boxes);
      let cx = 0;
      pick.info.cols.forEach((m, ci) => {
        if (!m.items.length) return;
        const d = drawInfo(ctx, m, cx, pick.info.y, F, `i${ci}-`);
        cx += pick.info.w + 30 / px;
        info.push(...d.nodes); infoBoxes.push(...d.boxes);
      });
    } else if (pick.info.kind === 'strip') {
      pick.info.cols.forEach((m, ci) => {
        if (!m.items.length) return;
        const d = drawInfo(ctx, m, ci * (pick.info.w + 30 / px), pick.info.y, F, `i${ci}-`);
        info.push(...d.nodes); infoBoxes.push(...d.boxes);
      });
    }
    // title note (gutter top)
    let title = null;
    if (geo.titleFit) {
      const tf = geo.titleFit;
      title = g({name: 'title'},
        h('path', {d: `M${r(geo.box.x)} ${r(geo.titleY + tf.height + 6 / px)}H${r(geo.box.x + Math.min(geo.gw - 10 / px, tf.width))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
        textBlock(tf, geo.box.x, geo.titleY, th.fg));
    }
    // annotation rings (keyed to the notes)
    const rings = [];
    const final = i => (i === pending ? 0 : R.bodies[i].level);
    const roofAt = i => ({x: geo.cols[i].cx, y: geo.topOf(final(i)) - geo.bh / 2});
    if (showAll) {
      p.annotations.forEach((n, i) => {
        const col = noteColors[i % 2];
        let shape2;
        if (n.target === 'ruler') {
          const x0 = geo.colsX - (showKey ? geo.gw : 40), y0 = geo.lineY(R.N) - geo.plateH / 2 - 8, y1 = geo.lineY(1) + geo.plateH / 2 + 8;
          shape2 = h('rect', {x: r(x0 - 6), y: r(y0), width: r(geo.colsX - x0 + 2), height: r(y1 - y0), rx: 14, fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '14 9'});
        } else if (n.target === 'firstLink' && R.links.length) {
          const l = R.links[0];
          const A = geo.cols[l.from], B = geo.cols[l.to];
          const yTop = Math.min(geo.topOf(final(l.from)), geo.topOf(final(l.to))) - geo.bh;
          const x0 = Math.min(A.cx, B.cx) - 26, x1 = Math.max(A.cx, B.cx) + 26;
          let base = Infinity;
          for (let j = Math.min(l.from, l.to); j <= Math.max(l.from, l.to); j++) base = Math.min(base, geo.topOf(final(j)) - geo.bh);
          const laneY = base - 34 - geo.lanes[0].lane * 26;
          shape2 = h('rect', {x: r(x0), y: r(laneY - 20), width: r(x1 - x0), height: r(Math.max(40, yTop - laneY + 34)), rx: 16, fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '14 9'});
        } else {
          const bi = n.target === 'lastBody' ? M - 1 : 0;
          const q = roofAt(bi);
          shape2 = h('ellipse', {cx: r(q.x), cy: r(q.y), rx: r(geo.bw / 2 + 16), ry: r(geo.bh / 2 + 16), fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '14 9'});
        }
        rings.push(g({name: `ring${i}`, opacity: 0}, shape2));
      });
    }
    // dashed outline of the pending body's supplied level
    let ghost = null;
    if (pending >= 0) {
      const c = planColors(ctx);
      const col = geo.cols[pending];
      const ty = geo.topOf(R.bodies[pending].level);
      ghost = g({name: 'ghost', opacity: 0},
        h('rect', {x: r(col.x), y: r(ty), width: r(col.w), height: r(geo.restTop - ty), fill: 'none', stroke: c.frame, 'stroke-width': 3, 'stroke-dasharray': '10 8'}));
    }
    return {F, px, R, geo, sc, info, infoBoxes, title, rings, ghost, pending, arrangement: pick.info.kind, fallback: !!pick.fallback};
  },
  build(ctx, L) {
    return g(null,
      L.sc.node,
      L.ghost,
      g({name: 'rings'}, L.rings),
      L.title,
      L.info.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const {R, geo} = L;
    const capU = lerp(W.rise[0], W.rise[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const lv = R.bodies.map((b, i) => (i === L.pending ? 0 : levelAt(ua, b.level, R.N, ctx.reduced)));
    const rulerP = seg(u, ...W.ruler);
    const nL = R.links.length;
    const done = p.actionProgress >= 1;
    const linkP = R.links.map((l, i) => (done ? seg(u, W.links[0] + (i * (W.links[1] - W.links[0])) / Math.max(1, nL), W.links[0] + ((i + 1) * (W.links[1] - W.links[0])) / Math.max(1, nL)) : 0));
    const f = L.sc.frame(lv, {ruler: rulerP, links: linkP, scaffold: 1});
    const nodes = f.nodes;
    const noteP = done ? seg(u, ...W.notes) : 0;
    L.info.forEach(n => {
      // legend rows, notes and key are shown from the start (they describe what is drawn); the supplied final state
      // arrives in the hold (its dashed rings too)
      nodes[n.name] = {opacity: n.type === 'state' ? r(noteP, 3) : 1};
    });
    if (L.title) nodes.title = {opacity: 1};
    L.rings.forEach((rg, i) => { nodes[`ring${i}`] = {opacity: r(noteP, 3)}; });
    if (L.ghost) nodes.ghost = {opacity: r(done ? seg(u, W.notes[0], W.notes[1]) : 0, 3)};
    const placed = lv.map((v, i) => Math.abs(v - (i === L.pending ? 0 : R.bodies[i].level)) < 1e-6 && (v > 0 || i === L.pending));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const semantic = {
      beat,
      levelsNow: lv.map(v => r(v, 3)),
      supplied: R.bodies.map(b => b.level),
      placed,
      ruler: r(rulerP, 3),
      linksDrawn: linkP.map(v => r(v, 3)),
      linkKinds: R.links.map(l => l.kind),
      finalState: p.finalState,
      pending: L.pending,
      actionCapped: p.actionProgress < 1 && u > capU,
      textPx: r(L.F * L.px, 1),
      k: r(geo.k, 3),
      personPx: r(geo.ps * 100 * L.px, 1),
      arrangement: L.arrangement,
      fallback: L.fallback,
      allReached: true,
      order: R.bodies.map(b => b.label.slice(0, 12)).join('|'),
      roofs: f.roofs.map(q => R2(q)),
      laneYs: f.paths.map(q => r(q.lane, 1)),
    };
    f.roofs.forEach((q, i) => { semantic[`roof${i}`] = R2(q); });
    // a label rides on its own podium: its podium top this frame
    semantic.podTops = f.roofs.map(q => r(q.top, 2));
    return {nodes, semantic};
  },
};

function textBlock(fit, x, y, fill) {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-02-story',
    title: 'Editable hierarchy — generic buildings rise onto the supplied levels',
    titleEs: 'Jerarquía judicial editable — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Jerarquía judicial editable',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Generic fictional buildings stand in a flat row on stone podiums, each carrying the plan of one of its rooms with seated people and its editable label. The supplied levels draw as a ruler; the podiums then rise step by step until every building stands on its supplied level, and the supplied links draw over the roofs. Levels, bodies and links are entirely as configured; no real court system is depicted and no outcome is shown.',
    tags: ['hierarchy', 'levels', 'generic buildings', 'podium', 'room plan', 'people', 'links', 'editable', 'as configured'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/jerarquia-editable.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: HIER_STRINGS,
  scene,
});
