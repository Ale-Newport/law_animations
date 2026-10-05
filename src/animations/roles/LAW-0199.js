/**
 * LAW-0199 — Reunión de equipo jurídico · contrast
 *
 * Storyboard (two complete, identical meeting scenes; side by side on wide
 * boxes, stacked on tall ones). Each scene: two fictional team members behind
 * a table under a cork case-file board with two task cards, one above each
 * person; each person holds their own round name magnet; the case-file
 * folder lies on the table.
 *  0.00–0.17  base: both scenes identical — every slot empty and dashed, both
 *             magnets held; only neutral A / B badges are shown.
 *  0.17–0.40  change (one localized fact): the scenario labels fade in. In A
 *             the owner of the changed task raises their magnet beside their
 *             head and presses it into that card's slot (ring turns solid,
 *             name appears): "Task assigned". In B the same person keeps the
 *             magnet in hand and the card keeps its empty, dashed slot:
 *             "task without an assignee". Nothing else differs.
 *  0.40–0.77  parallel: the shared link(s) are made in both scenes at exactly
 *             the same time (same hand path, same landing).
 *  0.77–1.00  guide: identical highlight rings around the changed slot in both
 *             scenes, a guide chip with the same ring glyph, the changed fact,
 *             the shared facts (drawn once), a neutral note and the key. No
 *             winner, score, deadline, blame or consequence is shown.
 * @module animations/roles/LAW-0199
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {fitDesign} from '../../core/layout.js';
import {clamp, r, seg} from '../../core/time.js';
import {str, list, obj, oneOf, party} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {
  KIT_STRINGS, rolesField, looksOf, layoutStage, buildStage, stageNodes, poseStage, captionOf,
  fitClean, keyChip, wchip, overlaps, overHeads, slotCentre, TEAM_IDS,
} from './kits/reunion-de-equipo.js';

const ID = 'LAW-0199';
const DURATION = 7500;
const CHANGE = 0.17;
const IDS = ['a', 'b'];
const TASKS = ['t1', 't2'];
const W_CHANGE = [0.19, 0.39];
const W_SHARED = [0.42, 0.67];

const STRINGS = {
  en: {...KIT_STRINGS.en, same: 'Same in both', changed: 'Changed fact'},
  es: {...KIT_STRINGS.es, same: 'Igual en ambas', changed: 'Hecho cambiado'},
};

const linkA = obj('A supplied link in scenario A (person → task card)', {
  from: oneOf('Person id (a = left, b = right)', IDS),
  to: oneOf('Task id (t1, t2 = order of props.tasks)', TASKS),
  kind: oneOf('Plain link (never causal)', ['relation']),
}, ['from', 'to']);

const sceneSchema = {
  actors: list('The two fictional team members in each scene, left to right (a, b)', party, 2, 2),
  roles: obj('Generic, fictional job captions (never a legal duty)', {a: str('Caption for a', 50), b: str('Caption for b', 50)}),
  relationships: list('Links made in scenario A (person puts their name magnet on a task card). Scenario B makes the same links except the one to props.changedTask', linkA, 1, 2),
  props: obj('Supplied content shared by both scenes', {
    tasks: list('Labels of the two task cards (fictional, neutral)', str('Task label', 90), 2, 2),
    changedTask: oneOf('The task whose assignee differs: linked in A, left without an assignee in B', TASKS),
    openSlot: str('Text shown in an empty assignee slot', 40),
  }, ['tasks', 'changedTask', 'openSlot']),
  scenarioA: obj('Scenario A', {label: str('Short label for scenario A', 50), caption: str('One-line description', 90)}, ['label']),
  scenarioB: obj('Scenario B', {label: str('Short label for scenario B', 50), caption: str('One-line description', 90)}, ['label']),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {guide: str('Label on the guide marking the changed detail', 70), neutral: str('Neutral note (no winner, no outcome)', 120)}),
};

const defaultParams = {
  actors: [{name: 'Ana Duarte', role: 'Team member'}, {name: 'Sam Okafor', role: 'Case assistant'}],
  roles: {a: 'Team member', b: 'Case assistant'},
  relationships: [{from: 'a', to: 't1', kind: 'relation'}, {from: 'b', to: 't2', kind: 'relation'}],
  props: {
    tasks: ['Review exhibit list (fictional)', 'Draft chronology (fictional)'],
    changedTask: 't2',
    openSlot: 'No assignee',
  },
  scenarioA: {label: 'Task assigned', caption: 'The chronology card carries a name magnet'},
  scenarioB: {label: 'Task without an assignee', caption: 'The chronology card keeps an empty slot'},
  changedFact: 'Whether the chronology card has an assignee (as supplied)',
  sharedFacts: ['Same two people', 'Same two task cards', 'Same case-file board'],
  comparisonLabels: {guide: 'Only this card’s assignee slot differs', neutral: 'Two situations side by side · no outcome is stated'},
};

function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

/** Resolve A's links: lane i = person i's task; which person owns the changed task. */
function resolve(p) {
  const laneTask = {};
  const used = new Set();
  const order = [];
  for (const l of p.relationships) {
    if (laneTask[l.from] || used.has(l.to)) continue;
    laneTask[l.from] = l.to; used.add(l.to); order.push(l.from);
  }
  const free = TASKS.filter(t => !used.has(t));
  for (const id of IDS) if (!laneTask[id]) laneTask[id] = free.shift();
  const linkedA = Object.fromEntries(IDS.map(id => [id, order.includes(id)]));
  const changedOwner = IDS.find(id => laneTask[id] === p.props.changedTask);
  const linkedB = {...linkedA, [changedOwner]: false};
  return {laneTask, order, linkedA, linkedB, changedOwner};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1150, 950], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const W = ctx.design.w, H = ctx.design.h;
    const upx = unitPx(ctx);
    const arrangement = ctx.view.shape === 'portrait' ? 'column' : 'row';
    const looks = looksOf(ctx, p.actors);
    const R = resolve(p);
    const people = IDS.map((id, i) => ({id, look: looks[i], name: p.actors[i].name, caption: captionOf({...p, actors: p.actors}, id)}));
    const lanesOf = linked => IDS.map((id, i) => ({label: p.props.tasks[TASKS.indexOf(R.laneTask[id])], owner: linked[id] ? i : null, task: R.laneTask[id]}));
    // lanes for measuring: both scenes are laid out with A's lanes (so their geometry is identical)
    const lanesA = lanesOf(R.linkedA);
    const showAll = ctx.show('all'), showKey = ctx.show('key');
    let best = null;
    const dbgC = [];
    for (const px of [{F: 22, min: 19.6}, {F: 20, min: 16}, {F: 17.5, min: 16}]) {
      const F = px.F / upx, minF = px.min / upx;
      // --- bottom strip: changed fact, shared facts, guide, neutral note, key (wrapped rows, full width)
      const stripW = W - 20;
      const items = [];
      if (showAll) {
        items.push({name: 'guide', text: p.comparisonLabels.guide, glyph: true});
        items.push({name: 'changed', text: `${ctx.t.changed}: ${p.changedFact}`});
        if (p.sharedFacts.length) items.push({name: 'shared', text: `${ctx.t.same}: ${p.sharedFacts.join(' · ')}`});
        items.push({name: 'neutral', text: `${p.comparisonLabels.neutral} · ${ctx.t.key}`});
      } else if (showKey) items.push({name: 'key', text: ctx.t.key, key: true});
      const chipOf = (it, x, y, name, mw) => (it.key
        ? keyChip(ctx, it.text, {x, y, maxWidth: Math.min(mw, 620), size: F * 0.92, minSize: minF * 0.95, maxLines: 2, name})
        : wchip(ctx, it.text, {x: x + (it.glyph ? F * 1.4 : 0), y, maxWidth: mw - (it.glyph ? F * 1.4 : 0), size: F * 0.92, minSize: Math.min(F * 0.92, Math.max(minF, 19.8 / upx)), maxLines: 3, fill: th.card, stroke: it.glyph ? th.accent3 : th.inkSoft, name}));
      let bad = false;
      // pack the strip at several chip widths; keep the lowest packing
      let rows = null, stripMW = 0, packBad = true;
      for (const mw of [stripW, stripW * 0.8, stripW * 0.72, stripW * 0.64, stripW * 0.56, stripW * 0.5, stripW * 0.45, stripW * 0.4, stripW * 0.34]) {
        let pb = false;
        const measured = items.map(it => { const c = chipOf(it, 0, 0, undefined, mw); pb = pb || c.fit.truncated; return {...it, w: c.box.w + (it.glyph ? F * 1.4 : 0), h: c.box.h}; });
        const rw0 = [];
        let cur = null;
        for (const it of measured) {
          if (!cur || cur.w + 16 + it.w > stripW) { cur = {items: [], w: 0, h: 0}; rw0.push(cur); }
          cur.items.push(it); cur.w += (cur.items.length > 1 ? 16 : 0) + it.w; cur.h = Math.max(cur.h, it.h);
        }
        const hh = rw0.reduce((q, rw) => q + rw.h, 0);
        if (!rows || (!pb && packBad) || (pb === packBad && hh < rows.reduce((q, rw) => q + rw.h, 0) - 0.5)) { rows = rw0; stripMW = mw; packBad = pb; }
      }
      bad = bad || packBad;
      const stripH = rows.reduce((a, rw) => a + rw.h, 0) + Math.max(0, rows.length - 1) * 10 + (rows.length ? 14 : 0);
      // --- scene headers (badge + label + caption)
      const headerOf = (sc, wmax) => {
        const lab = showKey ? fitClean(sc.label, {maxWidth: wmax - F * 2.6, size: F * 1.08, minSize: minF, maxLines: 2, weight: 700}) : null;
        const cap = showAll && sc.caption ? fitClean(sc.caption, {maxWidth: wmax - F * 2.6, size: F * 0.92, minSize: minF, maxLines: 2, weight: 500}) : null;
        bad = bad || Boolean(lab && lab.bad) || Boolean(cap && cap.bad);
        const inline = lab && cap && lab.lines.length === 1 && cap.lines.length === 1 && lab.width + cap.width + F * 1.2 <= wmax - F * 2.6;
        return {lab, cap, inline, h: Math.max(F * 2.2, inline ? Math.max(lab.height, cap.height) + F * 0.4 : (lab ? lab.height : 0) + (cap ? cap.height + F * 0.3 : 0) + F * 0.4)};
      };
      const gap = arrangement === 'row' ? 34 : 36;
      const colW = arrangement === 'row' ? (W - gap) / 2 : W;
      const hA = headerOf(p.scenarioA, colW), hB = headerOf(p.scenarioB, colW);
      const headH = Math.max(hA.h, hB.h);
      const avail = H - stripH;
      const boxes = arrangement === 'row'
        ? [0, 1].map(i => ({x: i * (colW + gap), y: headH, w: colW, h: avail - headH}))
        : [0, 1].map(i => ({x: 0, y: i * ((avail - gap) / 2 + gap) + headH, w: W, h: (avail - gap) / 2 - headH}));
      const stages = boxes.map((box, si) => layoutStage(ctx, {
        prefix: si ? 'sb' : 'sa', box, unitPx: upx, people, lanes: lanesA, openText: p.props.openSlot,
        title: null, doc: null, px, extras: [], kMax: 1.7, sMax: 520, cardMax: 440, table: {far: 104, near: 146}, cardLines: 6,
      }));
      // both scenes share one scale: use the smaller k and redo the other if needed
      const kMin = Math.min(stages[0].k, stages[1].k);
      const st2 = stages.map((L0, si) => (L0.k > kMin + 1e-9 ? layoutStage(ctx, {...L0.o, kMax: kMin}) : L0));
      const fits = st2.every(L0 => L0.fits) && !bad;
      dbgC.push([px.F, st2.map(L0 => [L0.fits, r(L0.k, 2), L0.cardM.bad, r(L0.over)]), bad, r(stripH)]);
      const cand = {px, F, minF, rows, stripH, chipOf, stripMW, hA, hB, headH, boxes, stages: st2, fits, colW, gap};
      const over = st2.reduce((q, L0) => q + L0.over, 0) + (bad ? 1e4 : 0);
      cand.overSum = over;
      if (!best || (cand.fits && !best.fits) || (!cand.fits && !best.fits && over < best.overSum)) best = cand;
      if (cand.fits) break;
    }
    const {F, minF, rows, stripH, hA, hB, headH, boxes, stages, colW} = best;
    const built = stages.map(L0 => buildStage(ctx, L0));
    // strip placement (centred rows at the bottom)
    const stripNodes = [];
    const stripBoxes = {};
    let y = H - stripH + 14;
    for (const rw of rows) {
      let x = (W - rw.w) / 2;
      for (const it of rw.items) {
        const node = best.chipOf(it, x, y + (rw.h - it.h) / 2, `${it.name}-chip`, best.stripMW);
        const glyph = it.glyph ? h('circle', {cx: r(x + F * 0.55), cy: r(y + rw.h / 2), r: r(F * 0.45), fill: 'none', stroke: th.accent3, 'stroke-width': 5}) : null;
        stripNodes.push(g({name: it.name, opacity: 0}, glyph, node.node));
        stripBoxes[it.name] = {x, y, w: it.w, h: it.h};
        x += it.w + 16;
      }
      y += rw.h + 10;
    }
    // headers
    const headers = [p.scenarioA, p.scenarioB].map((sc, si) => {
      const hd = si ? hB : hA;
      const box = boxes[si];
      const Lsi = stages[si];
      const x0 = arrangement === 'row' ? Lsi.board.x : Lsi.board.x;
      const y0 = box.y - headH;
      const color = si ? '#7a5c8e' : th.accent2;
      const R0 = F * 0.8;
      const cy = y0 + Math.max(R0 + 4, (hd.lab ? hd.lab.height / 2 + F * 0.2 : R0));
      return g({name: `head${si}`},
        h('circle', {cx: r(x0 + R0), cy: r(cy), r: r(R0), fill: color, stroke: th.ink, 'stroke-width': 2.5}),
        ctx.show('key') ? h('text', {x: r(x0 + R0), y: r(cy + R0 * 0.42), 'text-anchor': 'middle', 'font-size': r(R0 * 1.15), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, si ? 'B' : 'A') : null,
        g({name: `head${si}-text`, opacity: 0},
          hd.lab ? textBlock(hd.lab, {x: r(x0 + R0 * 2 + F * 0.5), y: r(y0 + F * 0.2), fill: th.fg}) : null,
          hd.cap ? textBlock(hd.cap, hd.inline
            ? {x: r(x0 + R0 * 2 + F * 0.5 + hd.lab.width + F * 1.2), y: r(y0 + F * 0.2 + (hd.lab.size - hd.cap.size) * 0.8), fill: th.fgSoft}
            : {x: r(x0 + R0 * 2 + F * 0.5), y: r(y0 + F * 0.2 + (hd.lab ? hd.lab.height + F * 0.3 : 0)), fill: th.fgSoft}) : null),
      );
    });
    // highlight rings around the changed slot in both scenes
    const ci = IDS.indexOf(R.changedOwner);
    const rings = stages.map((L0, si) => {
      const c = slotCentre(L0.G, ci, L0.cardM);
      return h('circle', {name: `ring${si}`, cx: r(c.x), cy: r(c.y), r: r(L0.cardM.ring + 12), fill: 'none', stroke: th.accent3, 'stroke-width': 6, 'stroke-dasharray': '14 8', opacity: 0});
    });
    const sceneShare = arrangement === 'row' ? Math.min(...stages.map(L0 => L0.board.w)) / W : Math.min(...stages.map(L0 => L0.board.w)) / W;
    const dbg = {stripH: r(stripH), headH: r(headH), boxH: r(boxes[0].h), stageH: r(stages[0].H), W: r(stages[0].W), boxW: r(boxes[0].w), k: r(stages[0].k, 2), rows: rows.length, dbgC};
    return {stages, built, headers, rings, stripNodes, stripBoxes, R, arrangement, ci, upx, F, labelsFit: best.fits, sceneShare, colW, dbg};
  },
  build(ctx, L) {
    return g(null,
      L.built.map((S, si) => g({name: `scene${si}`}, stageNodes(S))),
      L.rings,
      L.headers,
      L.stripNodes,
    );
  },
  frame(ctx, L, u, timeMs) {
    const ci = L.ci;
    const sharedIdx = IDS.map((_, i) => i).filter(i => i !== ci && L.R.linkedA[IDS[i]]);
    const qOf = (w, uu) => (uu <= w[0] ? null : uu >= w[1] ? 'done' : (uu - w[0]) / (w[1] - w[0]));
    const nodes = {};
    const sems = [];
    L.stages.forEach((L0, si) => {
      const st = IDS.map(() => ({q: null, done: false, look: 0, tilt: 0}));
      // the changed link: only in A
      const cq = si === 0 && L.R.linkedA[IDS[ci]] ? qOf(W_CHANGE, u) : null;
      if (cq === 'done') st[ci].done = true; else if (cq !== null) st[ci].q = cq;
      // shared links: both scenes, identical timing
      for (const i of sharedIdx) { const q = qOf(W_SHARED, u); if (q === 'done') st[i].done = true; else if (q !== null) st[i].q = q; }
      // watching: the other person looks at whoever acts; in B the changed owner looks at the empty card during the change beat
      const G = L0.G;
      const actor = st.findIndex(s => s.q !== null);
      st.forEach((s, i) => {
        if (actor >= 0 && i !== actor) { const lk = clamp((G.xs[actor] - G.xs[i]) / (G.S * 0.9), -1, 1); s.look = r(lk, 3); s.tilt = r(lk * 7, 2); }
      });
      const posed = poseStage(L0, L.built[si], st);
      Object.assign(nodes, posed.nodes);
      sems.push({st, sem: posed.sem, G});
    });
    const labelIn = seg(u, CHANGE, CHANGE + 0.05);
    nodes['head0-text'] = {opacity: r(labelIn, 3)};
    nodes['head1-text'] = {opacity: r(labelIn, 3)};
    const ringIn = seg(u, 0.77, 0.81);
    nodes.ring0 = {opacity: r(ringIn, 3)};
    nodes.ring1 = {opacity: r(ringIn, 3)};
    const stripIn = seg(u, 0.79, 0.86);
    for (const n of Object.keys(L.stripBoxes)) nodes[n] = {opacity: r(stripIn, 3)};
    const look = si => {
      const s = sems[si].sem;
      return {at: s.at, landed: s.landed.map(v => r(v, 2)), lift: s.lift.map(v => r(v, 2)), mags: s.mags.map(m => ({x: r(m.x - L.stages[si].board.x, 1), y: r(m.y - L.stages[si].board.y, 1)})), ring: ringIn, header: labelIn > 0 ? 1 : 0};
    };
    const [sa, sb] = sems.map(x => x.sem);
    const filled = s => L.stages[0].o.lanes.map((_, i) => (s.at[i] === 'card' ? 1 : 0));
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        scenes: 2,
        arrangement: L.arrangement,
        lookA: look(0),
        lookB: look(1),
        filledA: filled(sa),
        filledB: filled(sb),
        changedTask: ctx.params.props.changedTask,
        changedOwner: IDS[L.ci],
        sameShared: sa.landed.filter((_, i) => i !== L.ci).join() === sb.landed.filter((_, i) => i !== L.ci).join(),
        handAA: P2(sa.hands[0]), handAB: P2(sa.hands[1]), handBA: P2(sb.hands[0]), handBB: P2(sb.hands[1]),
        gripAA: P2(sa.grips[0]), gripAB: P2(sa.grips[1]), gripBA: P2(sb.grips[0]), gripBB: P2(sb.grips[1]),
        magAA: P2(sa.mags[0]), magAB: P2(sa.mags[1]), magBA: P2(sb.mags[0]), magBB: P2(sb.mags[1]),
        allReached: sa.allReached && sb.allReached,
        overHeads: sems.some(x => overHeads(x.G, x.sem.mags, x.G.xs.map((_, i) => x.G.card(i)))),
        ringShown: r(ringIn, 3),
        guideShown: r(stripIn, 3),
        headerShown: r(labelIn, 3),
        sceneShare: r(L.sceneShare, 3),
        headPx: r(88 * L.stages[0].G.k * L.upx, 1),
        sameScale: Math.abs(L.stages[0].G.k - L.stages[1].G.k) < 1e-9,
        labelsFit: L.labelsFit,
        dbg: L.dbg,
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
    slug: 'roles-10-contrast',
    title: 'Legal team meeting — a task with an assignee vs a task without one',
    titleEs: 'Reunión de equipo jurídico — Comparación de dos supuestos',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Reunión de equipo jurídico',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical meeting scenes under a cork case-file board. In A one person presses their name magnet into the slot of the changed task card; in B the same person keeps the magnet and the card keeps an empty, dashed slot. The shared link is made in both at the same time. Matching rings mark the one changed slot; nothing is concluded.',
    tags: ['team meeting', 'task board', 'assignment', 'unassigned task', 'name magnet', 'comparison', 'two scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/reunion-de-equipo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
