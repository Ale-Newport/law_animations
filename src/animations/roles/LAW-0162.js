/**
 * LAW-0162 — Entrevista a cliente · mechanism
 *
 * Storyboard (top-down plan of the interview table, not a row of boxes):
 *  0.00–0.18  separate: the table and the two seated people (bust badges at
 *             the table's ends) are in place; the three components of the
 *             exchange slide out of the people onto the table — the account
 *             (speech card) and the clarified detail (note) out of the
 *             client, the question list (clipboard) out of the interviewer.
 *  0.18–0.43  relate: only the explicit relationships are drawn, one by one,
 *             anchored to the element edges and styled by kind
 *             (communication = dashed arrow, sequence = arrow, relation =
 *             plain line with end dots, never an arrow; causal only when
 *             supplied). Labels sit beside their connectors.
 *  0.43–0.75  trace: a marker follows `traversalOrder` along the connectors;
 *             each element it reaches is ringed, and the focus element
 *             (default: the clarified detail) enlarges while it passes.
 *  0.75–1.00  gather: everything stays visible — origin (people), the
 *             components, the connectors with their kinds, a legend of the
 *             kinds used and the "as supplied · no conclusion drawn" key.
 * Nothing is assessed: no advice, merit, credibility or outcome.
 * @module animations/roles/LAW-0162
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {mechanismFields, obj, str} from '../../schemas/fields.js';
import {textBlock, LINK_STYLES} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {changedMarker} from '../../primitives/markers.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {interviewFields, INTERVIEW_DEFAULTS, KIT_STRINGS, fitWords, wchip, overlaps, keyChip, freeSpot, gridCands} from './kits/entrevista-a-cliente.js';

const ID = 'LAW-0162';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const IDS = ['client', 'interviewer', 'account', 'questions', 'detail'];
// a relation label sits within REL_NEAR (px at 1080p) of its own connector; every other connector is at
// least REL_MARGIN further away, so a label can never be read as labelling a different line
const REL_NEAR = 40;
const REL_MARGIN = 16;
// the detail card's folded corner (bottom right); text keeps clear of it
const FOLD = 22;
const W = {slide: [0.03, 0.16], text: [0.1, 0.17], relate: [0.18, 0.41], trace: [0.45, 0.72], legend: [0.76, 0.82], key: [0.78, 0.84]};

const STRINGS = {
  en: {...KIT_STRINGS.en, question: 'Question'},
  es: {...KIT_STRINGS.es, question: 'Pregunta'},
};

const sceneSchema = {
  actors: interviewFields.actors,
  roles: interviewFields.roles,
  props: obj('Content shown on the components (supplied text)', {
    account: str('The client’s account (on the speech card)', 120),
    question: str('The question shown on the question list', 90),
    clarification: str('The clarified detail (on the note), as supplied', 90),
  }),
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 50, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  actors: INTERVIEW_DEFAULTS.actors,
  roles: INTERVIEW_DEFAULTS.roles,
  props: {
    account: 'The parcel arrived damaged; I emailed the seller the same week.',
    question: 'When did you email the seller?',
    clarification: 'The email was sent on day 3',
  },
  elements: [
    {id: 'client', label: 'Client'},
    {id: 'interviewer', label: 'Interviewer'},
    {id: 'account', label: 'Account'},
    {id: 'questions', label: 'Question list'},
    {id: 'detail', label: 'Clarified detail'},
  ],
  relationships: [
    {from: 'interviewer', to: 'questions', kind: 'relation', label: 'works from'},
    {from: 'questions', to: 'client', kind: 'communication', label: 'asked of'},
    {from: 'client', to: 'account', kind: 'communication', label: 'tells'},
    {from: 'client', to: 'detail', kind: 'communication', label: 'clarifies'},
  ],
  focusElement: 'detail',
  relationLabels: {relation: 'plain relation (no direction)', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['interviewer', 'questions', 'client', 'account', 'client', 'detail'],
};

/**
 * Plan per shape (fractions of the design space). Badges: centre + radius
 * (fraction of min(w,h)); cards: left/top/width (height from their text).
 */
const PLAN = {
  landscape: {table: [0.19, 0.05, 0.62, 0.78], client: [0.1, 0.45], interviewer: [0.9, 0.45], R: 0.13,
    account: [0.24, 0.03, 0.24], detail: [0.24, 0.6, 0.24], questions: [0.51, 0.3, 0.23], size: 26, legendY: 0.93},
  // 1:1: diagonal plan — client bottom-left (name below), interviewer top-right (name above);
  // every connector leaves its person away from the name chip
  square: {table: [0.1, 0.1, 0.8, 0.68], client: [0.13, 0.65], interviewer: [0.86, 0.19], R: 0.09,
    account: [0.03, 0.12, 0.31], detail: [0.5, 0.6, 0.3], questions: [0.46, 0.3, 0.26], size: 22, legendY: 0.95},
  // 9:16: client top-left, account top-right, detail right-middle, question list lower-left,
  // interviewer bottom-right (no connector crosses another; room for every label)
  portrait: {table: [0.06, 0.2, 0.88, 0.6], client: [0.2, 0.15], interviewer: [0.78, 0.84], R: 0.1,
    account: [0.5, 0.03, 0.47], detail: [0.44, 0.3, 0.52], questions: [0.05, 0.6, 0.46], size: 28, legendY: 0.94},
};

const labelOf = (p, id) => (p.elements.find(e => e.id === id) || {}).label || '';

function tryLayout(ctx, S) {
  const p = ctx.params;
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const Pn = PLAN[shape];
  const showAll = ctx.show('all'), showKey = ctx.show('key');
  const problems = [];
  const minS = Math.max(17, S * 0.86);
  const X = f => f * D.w, Y = f => f * D.h;
  const R = Pn.R * Math.min(D.w, D.h);

  // --- people (bust badges seated at the table ends) with name chips
  const looks = [0, 1].map(i => actorLook(ctx, p.actors[i], i));
  const person = (id, i) => {
    const c = {x: X(Pn[id][0]), y: Y(Pn[id][1])};
    const b = personBadge(ctx, {name: `pb-${id}`, x: c.x, y: c.y, radius: R, look: looks[i]});
    return {id, c, b, circle: b.circle};
  };
  const people = [person('client', 0), person('interviewer', 1)];

  // --- cards (measured from their text; drawn in local coords, origin top-left)
  const card = (id) => {
    const [fx, fy, fw] = Pn[id];
    const w = X(fw);
    const pad = S * 0.6;
    const head = fitWords(labelOf(p, id), {maxWidth: w - pad * 2 - (id === 'detail' ? S * 1.4 : 0), size: S, minSize: minS, maxLines: 2, weight: 800});
    const txt = id === 'account' ? p.props.account : id === 'questions' ? `${ctx.t.question}: ${p.props.question}` : p.props.clarification;
    const body = fitWords(txt, {maxWidth: w - pad * 2, size: S, minSize: minS, maxLines: 5, weight: 500});
    if (head.truncated || body.truncated) problems.push(`${id}-truncated`);
    const extra = id === 'questions' ? S * 1.6 : 0; // simulated rows of the list
    // the sticky note's folded corner takes the bottom-right FOLD × FOLD: its bottom margin clears it
    // (only needed when the last body line reaches into the corner's column)
    const lastW = body.lines.length ? ctx.measure(body.lines[body.lines.length - 1] || '', body.size, body.weight, body.family) : 0;
    const bottom = id === 'detail' && pad + lastW > w - FOLD - 6 ? Math.max(pad, FOLD + 6) : pad;
    const hh = pad + bottom + head.height + S * 0.35 + body.height + extra;
    return {id, x: X(fx), y: Y(fy), w, h: hh, pad, head, body, extra};
  };
  const cards = ['account', 'questions', 'detail'].map(card);
  const byId = {};
  for (const q of people) byId[q.id] = q;
  for (const c of cards) byId[c.id] = c;
  // keep cards apart and inside the design space
  for (const c of cards) if (c.y + c.h > Y(Pn.legendY) - 20 || c.x + c.w > D.w - 8) problems.push(`${c.id}-outside`);
  for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) if (overlaps(cards[i], cards[j], 24)) problems.push('cards-overlap');
  for (const c of cards) for (const q of people) if (overlaps(c, {x: q.c.x - R, y: q.c.y - R, w: R * 2, h: R * 2}, 20)) problems.push('card-person');

  // --- relation graph (connectors anchored to edges, labels clear of elements)
  const elements = {};
  for (const q of people) elements[q.id] = {circle: q.circle};
  for (const c of cards) elements[c.id] = {box: {x: c.x, y: c.y, w: c.w, h: c.h}};
  const known = new Set(IDS);
  const rels = p.relationships.filter(q => known.has(q.from) && known.has(q.to) && q.from !== q.to);
  const gopts = {
    elements, relationships: rels, relationLabels: p.relationLabels,
    chipSize: Math.max(17, Math.min(S * 0.9, 24)), chipMax: shape === 'portrait' ? 380 : 260,
    bounds: {x: 8, y: 8, w: D.w - 16, h: Y(Pn.legendY) - 16}, separateLabels: true, bend: () => 0.08,
  };
  // probe pass: the connectors' paths (labels are placed beside, never on, any connector)
  const probe = relationGraph(ctx, {...gopts, name: 'rgp', obstacles: []});
  const samples = [];
  const pathPts = probe.conns.map(x => {
    const pts = [];
    for (let t = 0; t <= 1.0001; t += 1 / 24) pts.push(x.c.at(t));
    return pts;
  });
  for (const pts of pathPts) for (const q of pts) samples.push({x: q.x - 7, y: q.y - 7, w: 14, h: 14});

  // --- name chips around each badge, where no connector runs (below / above / beside)
  const nameChips = [];
  const nameTexts = [];
  if (showKey) {
    const busy = [...cards.map(c => ({x: c.x, y: c.y, w: c.w, h: c.h})), ...people.map(q => ({x: q.c.x - R, y: q.c.y - R, w: R * 2, h: R * 2}))];
    const inner = pathPts.map(pts => pts.slice(2, -2)).flat();
    for (const [i, q] of people.entries()) {
      // the role text comes from \`roles\` (fallback: the party's own role); the component
      // label of the element is added only when it says something different
      const role = p.roles[q.id] || p.actors[i].role || '';
      const el = labelOf(p, q.id);
      const text = [p.actors[i].name, role, el && el !== role ? `(${el})` : ''].filter(Boolean).join(' · ');
      nameTexts.push(text);
      const maxW = shape === 'portrait' ? D.w * 0.4 : Math.min(D.w * (shape === 'square' ? 0.25 : 0.2), 340);
      const nl = shape === 'landscape' ? 3 : 5;
      const c0 = wchip(ctx, text, {x: 0, y: 0, maxWidth: maxW, size: S, minSize: minS, maxLines: nl});
      if (c0.fit.truncated) problems.push('name-truncated');
      const w = c0.box.w, hh = c0.box.h;
      const cands = [];
      for (const dx of [0, -0.2, 0.2, -0.35, 0.35, -0.5, 0.5]) {
        cands.push({x: q.c.x - w / 2 + dx * w, y: q.c.y + R + 12});
        cands.push({x: q.c.x - w / 2 + dx * w, y: q.c.y - R - 12 - hh});
      }
      const side = [];
      for (const dy of [0, -0.5, 0.5]) side.push({x: q.c.x - R - 14 - w, y: q.c.y - hh / 2 + dy * R}, {x: q.c.x + R + 14, y: q.c.y - hh / 2 + dy * R});
      if (shape === 'portrait') {
        // above first, then beside, then below
        const above = cands.filter((c, j) => j % 2 === 1), below = cands.filter((c, j) => j % 2 === 0);
        cands.length = 0;
        cands.push(...above, ...side, ...below);
      } else cands.push(...side);
      const ok = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= D.w - 8 && b.y + b.h <= Y(Pn.legendY) - 24
        && !busy.some(o => overlaps(b, o, 8)) && !nameChips.some(o => overlaps(b, o.box, 8)) && !inner.some(pt => pt.x > b.x - 6 && pt.x < b.x + b.w + 6 && pt.y > b.y - 6 && pt.y < b.y + b.h + 6);
      const spot = cands.find(c => ok({x: c.x, y: c.y, w, h: hh}));
      if (!spot) problems.push(`name-placement-${q.id}`);
      const at = spot || cands[0];
      nameChips.push(wchip(ctx, text, {x: at.x, y: at.y, maxWidth: maxW, size: S, minSize: minS, maxLines: nl, name: `name-${q.id}`}));
    }
  }
  const graph = probe;
  const inBox = (q, b, pad = 0) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
  // --- relation labels, placed here (not by the framework): anywhere along their connector,
  // on either side, clear of elements, name chips, other labels and EVERY connector; a short
  // leader joins a label set off its line
  const relLabels = [];
  const fine = probe.conns.map(x => { const pts = []; for (let t = 0; t <= 1.0001; t += 1 / 96) pts.push(x.c.at(t)); return pts; });
  const boxToPath = (b, pts) => Math.min(...pts.map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
  const rsize = Math.max(17, Math.min(S * 0.9, 24));
  const hard = [...cards.map(c => ({x: c.x, y: c.y, w: c.w, h: c.h})), ...people.map(q => ({x: q.c.x - R, y: q.c.y - R, w: R * 2, h: R * 2})), ...nameChips.map(c => c.box)];
  const lb = {x: 8, y: 8, w: D.w - 16, h: Y(Pn.legendY) - 30};
  if (showAll) {
    graph.conns.forEach((x, i) => {
      const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
      const col = kindColor(ctx, x.rel.kind);
      const probeC = wchip(ctx, text, {x: 0, y: 0, maxWidth: gopts.chipMax, size: rsize, minSize: rsize, maxLines: 2, weight: 600});
      if (probeC.fit.truncated) problems.push('relation-label-truncated');
      const w = probeC.box.w, hh = probeC.box.h;
      let best = null;
      // unambiguous: the label's nearest connector is its own (≤ REL_NEAR from it) and every other
      // connector is at least REL_MARGIN further away. Grid search around the connector, both sides.
      const own0 = fine[i];
      const xs = own0.map(q => q.x), ys = own0.map(q => q.y);
      const gx0 = Math.min(...xs) - w - REL_NEAR, gx1 = Math.max(...xs) + REL_NEAR;
      const gy0 = Math.min(...ys) - hh - REL_NEAR, gy1 = Math.max(...ys) + REL_NEAR;
      const mid = x.c.at(0.5);
      for (let by = gy0; by <= gy1; by += 6) {
        for (let bx = gx0; bx <= gx1; bx += 6) {
          const b = {x: bx, y: by, w, h: hh};
          if (b.x < lb.x || b.y < lb.y || b.x + w > lb.x + lb.w || b.y + hh > lb.y + lb.h) continue;
          if (hard.some(o => overlaps(b, o, 6)) || relLabels.some(o => overlaps(b, o.box, 14))) continue;
          const own = boxToPath(b, own0);
          if (own > REL_NEAR || own < 6) continue;
          if (fine.some((pts, j) => j !== i && boxToPath(b, pts) < own + REL_MARGIN)) continue;
          // beside the middle of its own line rather than near an end (where lines from one badge converge)
          const sc = own + boxToPath(b, [mid]) * 0.4;
          if (!best || sc < best.sc) best = {sc, b, d: own};
        }
      }
      if (best) {
        // the connector point nearest the label (for the leader)
        let qb = own0[0], qd = Infinity;
        for (const q of own0) { const dd = boxToPath(best.b, [q]); if (dd < qd) { qd = dd; qb = q; } }
        best.q = qb;
      }
      if (!best) { problems.push(`relation-label-place:${x.rel.from}>${x.rel.to}`); return; }
      const c = wchip(ctx, text, {x: best.b.x, y: best.b.y, maxWidth: gopts.chipMax, size: rsize, minSize: rsize, maxLines: 2, weight: 600, stroke: col, fill: ctx.theme.card});
      const from = {x: clamp(best.q.x, c.box.x, c.box.x + c.box.w), y: clamp(best.q.y, c.box.y, c.box.y + c.box.h)};
      const leader = best.d > 20 ? h('line', {x1: r(best.q.x), y1: r(best.q.y), x2: r(from.x), y2: r(from.y), stroke: col, 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null;
      // distance to the nearest OTHER connector (null when this is the only one)
      const oth = fine.filter((_, j) => j !== i).map(pts => boxToPath(c.box, pts));
      const others = oth.length ? Math.min(...oth) : null;
      relLabels.push({i, box: c.box, node: g({name: `rl${i}`, opacity: 0}, leader, c.node), dist: r(best.d), others: others === null ? null : r(others, 1)});
    });
  }
  // labels never sit on a connector; connectors never run under a name chip
  const labelsOffConnectors = relLabels.every(l => pathPts.every(pts => pts.every(q => !inBox(q, l.box, 2))));
  const connectorsClearOfChips = pathPts.every(pts => pts.slice(2, -2).every(q => nameChips.every(c => !inBox(q, c.box, 4))));
  const connLens = probe.conns.map(x => x.c.total);
  // connectors must not cross each other (only shared ends may touch)
  let crossings = 0;
  const segX = (a, b, c, d) => {
    const o = (p1, p2, p3) => Math.sign((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  for (let i = 0; i < pathPts.length; i++) for (let j = i + 1; j < pathPts.length; j++) {
    const A = pathPts[i].slice(1, -1), B = pathPts[j].slice(1, -1);
    let hit = false;
    for (let a = 1; a < A.length && !hit; a++) for (let b = 1; b < B.length && !hit; b++) hit = segX(A[a - 1], A[a], B[b - 1], B[b]);
    if (hit) crossings++;
  }
  if (!labelsOffConnectors) problems.push('label-on-connector');
  if (!connectorsClearOfChips) problems.push('connector-under-chip');
  if (Math.min(...connLens) < 70) problems.push('connector-short');
  if (crossings) problems.push('crossing');
  // the graph's fallback shrinks a label that found no clear spot: never accept one below 17 px
  const order = p.traversalOrder.filter(id => known.has(id));
  const route = graph.route(order);

  // --- legend of the kinds used + the neutral key
  const kinds = [...new Set(rels.map(q => q.kind))];
  const legendItems = [];
  // legend and key: never below 17 px, never above the smallest content text
  const lsize = Math.max(17, Math.min(S * 0.9, 24));
  if (showAll) {
    for (const kd of kinds) {
      const st = LINK_STYLES[kd];
      const txt = p.relationLabels[kd] || ctx.t[kd] || kd;
      const c = wchip(ctx, txt, {x: 0, y: 0, maxWidth: D.w * 0.4, size: lsize, minSize: lsize, maxLines: 2, weight: 600, stroke: kindColor(ctx, kd)});
      legendItems.push({kd, st, c, txt, w: c.box.w + 64});
    }
  }
  let key = null;
  if (showKey) key = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: D.w - 20, size: lsize, minSize: lsize, maxLines: 2});
  // flow legend + key in rows centred at the bottom
  const rows = [[]];
  let rw = 0;
  const all = [...legendItems, ...(key ? [{key: true, c: key, w: key.box.w}] : [])];
  for (const it of all) {
    if (rw > 0 && rw + it.w + 18 > D.w - 20) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push(it);
    rw += it.w + 18;
  }
  const rowH = Math.max(...all.map(it => it.c.box.h), 1);
  const legendH = rows.length * (rowH + 10);
  let ly = Math.min(Y(Pn.legendY) - rowH / 2, D.h - 8 - legendH);
  const legendTop = ly;
  const legendNodes = [];
  let keyBox = null;
  for (const row of rows) {
    const tw = row.reduce((a, it) => a + it.w, 0) + 18 * (row.length - 1);
    let lx = (D.w - tw) / 2;
    for (const it of row) {
      if (it.key) {
        const c = keyChip(ctx, ctx.t.key, {x: lx, y: ly, maxWidth: D.w - 20, size: lsize, minSize: lsize, maxLines: 2, name: 'key'});
        legendNodes.push(c.node);
        keyBox = c.box;
      } else {
        const ymid = ly + it.c.box.h / 2;
        const col = kindColor(ctx, it.kd);
        const c = wchip(ctx, it.txt, {x: lx + 64, y: ly, maxWidth: D.w * 0.4, size: lsize, minSize: lsize, maxLines: 2, weight: 600, stroke: col});
        legendNodes.push(g(null,
          h('line', {x1: r(lx), x2: r(lx + 52), y1: r(ymid), y2: r(ymid), stroke: col, 'stroke-width': it.st.width, 'stroke-dasharray': it.st.dash || undefined, 'stroke-linecap': 'round'}),
          it.st.arrow ? h('path', {d: `M${r(lx + 56)} ${r(ymid)}l-12 -7v14z`, fill: col}) : h('circle', {cx: r(lx + 54), cy: r(ymid), r: 4.5, fill: col}),
          it.st.endDots ? h('circle', {cx: r(lx), cy: r(ymid), r: 4.5, fill: col}) : null,
          c.node));
      }
      lx += it.w + 18;
    }
    ly += rowH + 10;
  }
  if (legendTop < Math.max(...cards.map(c => c.y + c.h), ...people.map(q => q.c.y + R), ...nameChips.map(c => c.box.y + c.box.h), ...relLabels.map(l => l.box.y + l.box.h)) + 8) problems.push('legend-collision');
  const contentMin = Math.min(...cards.flatMap(c => [c.head.size, c.body.size]), ...nameChips.map(c => c.fit.size));
  if (lsize > contentMin + 0.5) problems.push('caption-bigger');
  const dc = cards.find(c => c.id === 'detail');
  // the body's last line either ends left of the folded corner or sits above it
  const dcLast = dc && dc.body.lines.length ? ctx.measure(dc.body.lines[dc.body.lines.length - 1] || '', dc.body.size, dc.body.weight, dc.body.family) : 0;
  const detailTextClear = !dc || dc.pad + dcLast <= dc.w - FOLD - 6 || dc.y + dc.pad + dc.head.height + S * 0.35 + dc.body.height <= dc.y + dc.h - FOLD - 2;
  return {ok: problems.length === 0, problems, S, detailTextClear, people, cards, byId, graph, route, order, nameChips, legendNodes, keyBox, looks, R, contentMin, rels, nameTexts, relLabels, labelsOffConnectors, connectorsClearOfChips, crossings, minConn: r(Math.min(...connLens), 1)};
}

/** Card drawing (world coordinates) with a named group for slide / focus transforms. */
function cardNode(ctx, c, showText, look) {
  const th = ctx.theme;
  const {x, y, w, h: hh, pad, head, body} = c;
  const parts = [];
  if (c.id === 'account') {
    // speech card, tail towards the client (left)
    const tail = `M${r(x + 18)} ${r(y + hh - 26)}L${r(x - 26)} ${r(y + hh + 6)}L${r(x + 44)} ${r(y + hh - 2)}Z`;
    parts.push(h('path', {d: roundRectPath(x + 6, y + 8, w, hh, 22), fill: th.shadow}));
    parts.push(h('path', {d: tail, fill: th.card, stroke: '#3b4450', 'stroke-width': 3, 'stroke-linejoin': 'round'}));
    parts.push(h('path', {d: roundRectPath(x, y, w, hh, 22), fill: th.card, stroke: '#3b4450', 'stroke-width': 3}));
    parts.push(h('path', {d: `M${r(x + 12)} ${r(y + hh - 22)}L${r(x + 40)} ${r(y + hh - 4)}`, stroke: th.card, 'stroke-width': 6}));
  } else if (c.id === 'questions') {
    const m = pad * 0.5;
    parts.push(h('path', {d: roundRectPath(x - m + 6, y - m * 1.6 + 8, w + m * 2, hh + m * 2.6, 12), fill: th.shadow}));
    parts.push(h('path', {d: roundRectPath(x - m, y - m * 1.6, w + m * 2, hh + m * 2.6, 12), fill: '#8a6848', stroke: '#1f2328', 'stroke-width': 2.6}));
    parts.push(h('path', {d: roundRectPath(x, y, w, hh, 4), fill: th.paper, stroke: '#1f2328', 'stroke-width': 2}));
    parts.push(h('path', {d: roundRectPath(x + w * 0.35, y - m * 1.3, w * 0.3, m * 2.2, 5), fill: '#b9c1c8', stroke: '#1f2328', 'stroke-width': 2}));
  } else {
    // sticky note with a folded corner and the changed-datum marker
    parts.push(h('path', {d: roundRectPath(x + 6, y + 8, w, hh, 6), fill: th.shadow}));
    parts.push(h('path', {d: `M${r(x)} ${r(y)}H${r(x + w)}V${r(y + hh - FOLD)}L${r(x + w - FOLD)} ${r(y + hh)}H${r(x)}Z`, fill: th.accent3Soft, stroke: '#1f2328', 'stroke-width': 2.4, 'stroke-linejoin': 'round'}));
    parts.push(h('path', {d: `M${r(x + w)} ${r(y + hh - FOLD)}H${r(x + w - FOLD)}V${r(y + hh)}Z`, fill: shade(th.accent3Soft, -0.12), stroke: '#1f2328', 'stroke-width': 2, 'stroke-linejoin': 'round'}));
  }
  const tx = x + pad + (c.id === 'detail' ? head.size * 1.4 : 0);
  const ty = y + pad;
  const content = [];
  if (showText) {
    content.push(textBlock(head, {x: tx, y: ty, fill: c.id === 'detail' ? th.accent2 : th.ink}));
    content.push(textBlock(body, {x: x + pad, y: ty + head.height + body.size * 0.35, fill: th.ink}));
  } else {
    content.push(h('rect', {x: r(tx), y: r(ty + head.size * 0.15), width: r(Math.min(head.width, w * 0.5)), height: r(head.size * 0.65), rx: 4, fill: th.ink, opacity: 0.8}));
    body.lines.forEach((ln, j) => content.push(h('rect', {x: r(x + pad), y: r(ty + head.height + body.size * 0.35 + j * body.lineHeight + body.size * 0.2), width: r((w - pad * 2) * (j === body.lines.length - 1 ? 0.6 : 0.95)), height: r(body.size * 0.6), rx: r(body.size * 0.3), fill: th.paperLine})));
  }
  if (c.id === 'questions') {
    const by = ty + head.height + body.size * 0.35 + body.height + body.size * 0.5;
    for (let j = 0; j < 2; j++) content.push(h('rect', {x: r(x + pad), y: r(by + j * body.size * 0.75), width: r((w - pad * 2) * (0.8 - j * 0.25)), height: r(body.size * 0.35), rx: 3, fill: th.paperLine}));
  }
  if (c.id === 'detail') content.push(changedMarker(ctx, {x: x + pad + head.size * 0.55, y: ty + head.size * 0.55, radius: head.size * 0.55}));
  return g({name: `card-${c.id}`}, parts, g({name: `cardtxt-${c.id}`, opacity: 0}, content));
}

const scene = {
  // design spaces match the default caption-safe box below the content notice (1 unit ≈ 1 px at 1080p)
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1360]},
  layout(ctx) {
    const Pn = PLAN[ctx.view.shape];
    const tries = [];
    let L = null;
    for (let S = Pn.size; S >= 17; S -= 1) {
      L = tryLayout(ctx, S);
      if (L.ok) break;
      tries.push(`${S}:${L.problems.join('+')}`);
    }
    L.tries = tries;
    // arc fraction of the route's last edge point (the point before the last element's centre)
    const pts = L.route.poly.pts;
    let acc = 0;
    for (let i = 1; i < pts.length - 1; i++) acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    L.tEnd = pts.length > 2 && L.route.poly.total > 0 ? acc / L.route.poly.total : 1;
    const D = ctx.design;
    const [tx, ty, tw, tt] = Pn.table;
    L.table = {x: tx * D.w, y: ty * D.h, w: tw * D.w, h: tt * D.h};
    return L;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const T0 = L.table;
    const grain = [];
    for (let i = 0; i < 6; i++) {
      const gy = T0.y + ((i + 0.7) / 6.4) * T0.h;
      const wob = 6 + ctx.rng('mech-grain', i) * 10;
      grain.push(h('path', {d: `M${r(T0.x + 30)} ${r(gy)}C${r(T0.x + T0.w * 0.35)} ${r(gy - wob)} ${r(T0.x + T0.w * 0.65)} ${r(gy + wob)} ${r(T0.x + T0.w - 30)} ${r(gy - wob * 0.3)}`, fill: 'none', stroke: shade(th.woodTop, -0.1), 'stroke-width': 2, opacity: 0.5}));
    }
    const table = g({name: 'table'},
      h('path', {d: roundRectPath(T0.x + 10, T0.y + 14, T0.w, T0.h, 48), fill: th.shadow}),
      h('path', {d: roundRectPath(T0.x, T0.y, T0.w, T0.h, 48), fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke}),
      grain,
      h('path', {d: roundRectPath(T0.x + 14, T0.y + 14, T0.w - 28, T0.h - 28, 38), fill: 'none', stroke: shade(th.woodTop, 0.12), 'stroke-width': 3}),
    );
    const showText = ctx.show('all');
    return g(null,
      table,
      L.graph.node,
      L.people.map(q => q.b.node),
      L.cards.map(c => cardNode(ctx, c, showText)),
      g({name: 'rings'}, L.route.visits.map((v, i) => {
        const e = L.byId[v.id];
        const node = e.circle
          ? h('circle', {cx: r(e.circle.x), cy: r(e.circle.y), r: r(e.circle.r + 10), fill: 'none', stroke: th.accent, 'stroke-width': 4})
          : h('path', {d: roundRectPath(e.x - 10, e.y - 10, e.w + 20, e.h + 20, 18), fill: 'none', stroke: th.accent, 'stroke-width': 4});
        return g({name: `ring${i}`, opacity: 0}, node);
      })),
      L.relLabels.map(l => l.node),
      L.nameChips.map(c => c.node),
      L.graph.tracerNode('tracer'),
      g({name: 'legend', opacity: 0}, L.legendNodes),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    // 1) separate: cards slide out of their person onto the table
    const sl = ease.inOutCubic(seg(u, ...W.slide));
    const from = {account: 'client', detail: 'client', questions: 'interviewer'};
    for (const c of L.cards) {
      const src = L.byId[from[c.id]].c;
      const dx = (src.x - (c.x + c.w / 2)) * (1 - sl), dy = (src.y - (c.y + c.h / 2)) * (1 - sl);
      const sc = lerp(0.3, 1, sl);
      nodes[`card-${c.id}`] = {transform: `${T(dx, dy)} ${scaleAbout(c.x + c.w / 2, c.y + c.h / 2, sc)}`, opacity: r(clamp(sl * 3), 3)};
      nodes[`cardtxt-${c.id}`] = {opacity: r(seg(u, ...W.text), 3)};
    }
    // 2) relate: connectors drawn one by one
    const n = L.graph.conns.length;
    const span = (W.relate[1] - W.relate[0]) / Math.max(1, n);
    const drawn = L.graph.conns.map((x, i) => seg(u, W.relate[0] + i * span, W.relate[0] + (i + 0.85) * span));
    // connectors from the framework (its own labels are not drawn); labels appear as their line completes
    const gf = L.graph.frame(i => drawn[i]);
    for (const key of Object.keys(gf)) if (!/-lg\d+$/.test(key)) nodes[key] = gf[key];
    for (const l of L.relLabels) nodes[`rl${l.i}`] = {opacity: r(clamp((drawn[l.i] - 0.55) / 0.45), 3)};
    // 3) trace: the marker follows the traversal order; reached elements are ringed; focus enlarges
    // the marker stops on the last element's edge (the end of the last connector), never on its content
    const tp = ease.inOutSine(seg(u, ...W.trace)) * L.tEnd;
    const pt = L.route.poly.at(tp);
    const visible = u >= W.trace[0] - 0.02;
    // after the trace the marker and its rings fade: both people end with equal weight
    const endFade = 1 - seg(u, W.trace[1], W.trace[1] + 0.04);
    nodes.tracer = {transform: T(pt.x, pt.y), opacity: visible ? r(endFade, 3) : 0};
    const visitOrder = [];
    const ringsVisible = [];
    L.route.visits.forEach((v, i) => {
      const reached = visible && tp >= Math.min(v.t, L.tEnd) - 1e-6;
      if (reached) visitOrder.push(v.id);
      // only the current element keeps its ring (the previous one fades)
      const next = L.route.visits[i + 1];
      const current = reached && (!next || tp < Math.min(next.t, L.tEnd) - 1e-6);
      nodes[`ring${i}`] = {opacity: current ? r(endFade, 3) : 0};
      if (current && endFade > 0) ringsVisible.push(v.id);
    });
    let focusScale = 1;
    const fv = L.route.visits.find(v => v.id === p.focusElement);
    const fe = L.byId[p.focusElement];
    if (fv && fe) {
      // map the visit's arc fraction back to u: tp = inOutSine(x) ⇒ x = acos(1 − 2t)/π
      const xv = Math.acos(1 - 2 * clamp(Math.min(fv.t, L.tEnd) / L.tEnd)) / Math.PI;
      const uv = W.trace[0] + xv * (W.trace[1] - W.trace[0]);
      const up = ease.inOutSine(seg(u, uv - 0.05, uv)) * (1 - ease.inOutSine(seg(u, uv + 0.07, uv + 0.13)));
      focusScale = 1 + 0.16 * up;
      const cx = fe.circle ? fe.circle.x : fe.x + fe.w / 2, cy = fe.circle ? fe.circle.y : fe.y + fe.h / 2;
      const key = fe.circle ? `pb-${p.focusElement}-body` : `card-${p.focusElement}`;
      // the focus element's rings grow with it
      L.route.visits.forEach((v, i) => {
        if (v.id === p.focusElement) nodes[`ring${i}`] = {...nodes[`ring${i}`], transform: focusScale !== 1 ? scaleAbout(cx, cy, focusScale) : ''};
      });
      if (fe.circle) nodes[key] = {transform: focusScale !== 1 ? scaleAbout(0, 0, focusScale) : ''};
      else if (focusScale !== 1) nodes[key] = {...nodes[key], transform: `${nodes[key].transform} ${scaleAbout(cx, cy, focusScale)}`};
    }
    // 4) gather: legend + key
    nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    // connector ends: distance from each connector end to its element edge (anchored)
    const gaps = [];
    for (const x of L.graph.conns) {
      for (const [id, q] of [[x.rel.from, x.c.from], [x.rel.to, x.c.to]]) {
        const e = L.byId[id];
        const d = e.circle
          ? Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r)
          : Math.min(Math.abs(q.x - e.x), Math.abs(q.x - (e.x + e.w)), Math.abs(q.y - e.y), Math.abs(q.y - (e.y + e.h)));
        gaps.push(r(d, 1));
      }
    }
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        separated: r(sl, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracer: {x: r(pt.x), y: r(pt.y)},
        tracerVisible: visible,
        visitOrder,
        focusScale: r(focusScale, 3),
        connectorGaps: gaps,
        arrows: L.graph.conns.map(x => ({kind: x.rel.kind, arrow: Boolean(LINK_STYLES[x.rel.kind].arrow)})),
        labelsClear: L.relLabels.every(l => !L.cards.some(c => overlaps(l.box, c, 0))),
        relLabelCount: L.relLabels.length, relLabelMaxDist: L.relLabels.length ? Math.max(...L.relLabels.map(l => l.dist)) : 0,
        // every label's own connector is the nearest one, by at least REL_MARGIN
        relLabelsUnambiguous: L.relLabels.every(l => l.dist <= REL_NEAR && (l.others === null || l.others >= l.dist + REL_MARGIN)),
        // the detail card's text never reaches its folded corner
        detailTextClearOfFold: L.detailTextClear,
        labelsOffConnectors: L.labelsOffConnectors, connectorsClearOfChips: L.connectorsClearOfChips, crossings: L.crossings, minConn: L.minConn,
        nameTexts: L.nameTexts, ringsVisible, tracerShown: visible && endFade > 0,
        legendShown: r(seg(u, ...W.legend), 3),
        labelsFit: L.ok, layoutProblems: L.problems, layoutTries: L.tries, textSize: L.S,
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
    slug: 'roles-01-mechanism',
    title: 'Client interview — who gives what to whom, on the table plan',
    titleEs: 'Entrevista a cliente — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Entrevista a cliente',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Top-down plan of the interview table: the client and the interviewer as seated badges; the account, the question list and the clarified detail slide out of them onto the table. Only the supplied relationships are drawn, styled by kind (a plain relation never gets an arrow); a marker follows the traversal order and the focus element enlarges as it passes. Legend of kinds and a neutral key.',
    tags: ['client interview', 'mechanism', 'table plan', 'account', 'question list', 'clarified detail', 'relations', 'communication', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/entrevista-a-cliente.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
