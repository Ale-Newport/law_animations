/**
 * LAW-0022 — Anexo incorporado · mechanism
 *
 * Storyboard (exploded join, then re-assembled — not a row of boxes):
 *  0.00–0.18  separate: the linked clause lifts out of the contract as an
 *             enlarged strip (leaving a dashed slot in the sheet); the annex
 *             rises out of its folder pocket with its index tab facing the
 *             strip's port; pen and seal badges appear where they act.
 *  0.18–0.43  relations are drawn one by one, anchored to real edges and
 *             styled by kind (plain relation = no arrowhead; causal only when
 *             the author supplies it). Labels sit BESIDE their lines.
 *  0.43–0.75  a large tracer follows `traversalOrder`; each connector lights
 *             as the tracer runs along it, between connectors it walks round
 *             the element's outline (never over its text) and it comes to rest
 *             beside the last element; it passes under every caption and
 *             label. The focus element enlarges as it passes and its caption
 *             steps out with it. The part that changes — the strip's reference slot
 *             (empty → written) and the port/eyelet pair (open → joined) —
 *             changes only when the tracer reaches the clause.
 *  0.75–1.00  gather: the exploded relations fold away, the strip returns into
 *             its slot in the contract, the annex docks with its tab at the
 *             clause (ink joins the port to the tab eyelet), pen and seal move
 *             beside what they acted on, and the relations not embodied by the
 *             assembly are redrawn and labelled by kind. Origin (folder),
 *             change (reference written) and state (linked to clause n) stay
 *             visible. No legal effect is stated.
 * @module animations/documents/LAW-0022
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor, circleAnchor} from '../../core/geometry.js';
import {documentsFields, mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag} from '../../primitives/annotate.js';
import {pen as penTool} from '../../primitives/paper.js';
import {iconBadge} from '../../primitives/badges.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {roundRectPath} from '../../core/geometry.js';
import {contractSheet, annexSheet, clauseStrip, pocketFolder, sealTool, annexFields, ANNEX_STRINGS, INK_BLUE} from './kits/anexo-incorporado.js';

const ID = 'LAW-0022';
const DURATION = 7000;
const IDS = ['contract', 'clause', 'pen', 'annex', 'folder', 'seal'];
/** Elements that form the assembled document; relations among them are embodied by the assembly. */
const ASSEMBLY = new Set(['contract', 'clause', 'annex']);
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  appear: [0, 0.08], lift: [0.04, 0.16], rise: [0.06, 0.17], caps: [0.12, 0.18],
  rel: [0.18, 0.43], trace: [0.44, 0.74],
  fold: [0.75, 0.79], move: [0.765, 0.88], regrow: [0.87, 0.95], join: [0.86, 0.9], tags: [0.9, 0.96],
};

const STRINGS = {
  en: {...ANNEX_STRINGS.en, written: 'Reference written', linkedTo: 'Linked to clause {n}'},
  es: {...ANNEX_STRINGS.es, written: 'Remisión escrita', linkedTo: 'Unido a la cláusula {n}'},
};

const sceneSchema = {
  ...documentsFields,
  ...annexFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  documentId: 'CTR-208',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties and purpose', 'Delivery of the goods', 'Price (hypothetical)'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  linkedClause: 1,
  annex: {label: 'ANNEX 1', title: 'Delivery schedule'},
  reference: 'see Annex 1',
  elements: [
    {id: 'contract', label: 'Contract'},
    {id: 'clause', label: 'Clause 2 — linked clause'},
    {id: 'pen', label: 'Pen'},
    {id: 'annex', label: 'Annex 1'},
    {id: 'folder', label: 'Annex folder'},
    {id: 'seal', label: 'Seal'},
  ],
  relationships: [
    {from: 'contract', to: 'clause', kind: 'relation', label: 'contains'},
    {from: 'pen', to: 'clause', kind: 'sequence', label: 'writes the reference'},
    {from: 'clause', to: 'annex', kind: 'relation', label: 'refers to'},
    {from: 'folder', to: 'annex', kind: 'sequence', label: 'taken out'},
    {from: 'seal', to: 'annex', kind: 'relation', label: 'marks the join'},
  ],
  focusElement: 'clause',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['folder', 'annex', 'clause', 'contract'],
};

/**
 * Hand-placed component geometry per shape (design units).
 *  contract: size + top-left in the exploded (`ex`) and gathered (`ga`) states;
 *            the gathered top is moved within `gaY` so the docked annex keeps
 *            room for its caption above and stays clear of the folder / legend;
 *  clause:   exploded strip centre + size (the strip returns into the slot);
 *  annex:    sheet size, exploded sheet-left x + centre y (tab level with the
 *            strip's port); gathered = docked on the contract margin;
 *  folder:   fixed (the origin);
 *  pen/seal: badge radius, exploded centre, gathered centre (function of the
 *            gathered geometry G: contract box, clause row y, annex box, seam).
 *            With `seamSeal`, the gathered seal sits above the seam (contract
 *            margin / annex edge) and its relation lands on the seam itself.
 *  caps:     caption side overrides per element and state (see DEFAULT_CAPS).
 *  kG:       gathered scale — large enough that the rejoined clause (heading
 *            and written reference) stays readable (>= ~18 px at 1080p).
 */
const PLACES = {
  landscape: {
    size: [1760, 840], kG: 1.12, gaY: {annexTop: 256, annexBottom: 776}, seamSeal: true,
    contract: {w: 340, h: 480, ex: [30, 186], ga: [500, 150]},
    clause: {cx: 770, cy: 290, w: 400, h: 172},
    annex: {w: 280, h: 380, ex: [1250, 290]},
    folder: {x: 1420, y: 630, w: 320, h: 186},
    pen: {r: 66, ex: [590, 590], ga: G => ({x: G.contract.x - 400, y: G.row})},
    seal: {r: 60, ex: [1060, 600], ga: G => (G.seam.above ? {x: G.seam.x + 95, y: Math.max(70, G.seam.y - 185)} : {x: G.annex.x + G.annex.w + 200, y: G.annex.y + 20})},
    caps: {seal: {ga: 'right'}, annex: {ga: 'right'}},
    legend: [840, 812],
  },
  square: {
    size: [1430, 1100], kG: 1.45, gaY: {annexTop: 252, annexBottom: 720, min: 24}, seamSeal: true,
    contract: {w: 300, h: 430, ex: [95, 410], ga: [312, 120]},
    clause: {cx: 690, cy: 250, w: 400, h: 170},
    annex: {w: 240, h: 330, ex: [1095, 250]},
    folder: {x: 995, y: 850, w: 320, h: 186},
    pen: {r: 62, ex: [625, 600], ga: G => ({x: G.contract.x - 170, y: G.row + 230})},
    seal: {r: 58, ex: [915, 660], ga: G => (G.seam.above ? {x: G.seam.x + 95, y: Math.max(66, G.seam.y - 182)} : {x: G.annex.x + G.annex.w + 110, y: G.annex.y + 30})},
    caps: {contract: {ga: 'belowStart'}, seal: {ga: 'right'}, annex: {ga: 'right'}},
    legend: [670, 1072],
  },
  portrait: {
    size: [960, 1440], kG: 1.15, gaY: {annexTop: 150, annexBottom: 1050}, seamSeal: true,
    contract: {w: 330, h: 470, ex: [40, 120], ga: [287, 370]},
    clause: {cx: 250, cy: 800, w: 400, h: 172},
    annex: {w: 250, h: 340, ex: [682, 800]},
    folder: {x: 470, y: 1150, w: 330, h: 190},
    pen: {r: 66, ex: [730, 250], ga: G => ({x: 120, y: G.contract.y - 20})},
    seal: {r: 58, ex: [260, 1200], ga: G => ({x: G.seam.above ? G.seam.x + 28 : G.contract.x + G.contract.w - 12, y: G.contract.y - 150})},
    caps: {contract: {ex: 'aboveStart', ga: 'aboveStart'}, clause: {ex: 'belowStart'}, seal: {ex: 'left', ga: 'left'}, annex: {ga: 'aboveEnd'}},
    capMaxGa: {annex: 250},
    tagWBelowCaption: true,
    legend: [480, 1408],
  },
};

/** Default caption side per element, exploded (`ex`) / gathered (`ga`) state. */
const DEFAULT_CAPS = {
  contract: {ex: 'below', ga: 'below'},
  clause: {ex: 'aboveStart'},
  annex: {ex: 'above', ga: 'above'},
  pen: {ex: 'below', ga: 'below'},
  seal: {ex: 'below', ga: 'below'},
};

/** Thin boxes along a connector so relation labels are placed beside it, not on it. */
function lineBoxes(conn, step = 0.04, half = 7) {
  const out = [];
  for (let t = 0; t <= 1.0001; t += step) {
    const q = conn.at(Math.min(1, t));
    out.push({x: q.x - half, y: q.y - half, w: half * 2, h: half * 2});
  }
  return out;
}

const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const centreOf = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});

const area = (a, b, pad) => Math.max(0, Math.min(a.x + a.w, b.x + b.w + pad) - Math.max(a.x, b.x - pad)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h + pad) - Math.max(a.y, b.y - pad));

/** Chip variants tried for a relation label: one line first, then balanced wraps (never truncated). */
const LABEL_VARIANTS = [
  {size: 28, maxLines: 1, maxWidth: 380},
  {size: 28, maxLines: 2, maxWidth: 250},
  {size: 26, maxLines: 2, maxWidth: 215},
  {size: 24, maxLines: 3, maxWidth: 190},
  {size: 24, maxLines: 3, maxWidth: 250},
];
/** True when a fitted text keeps every word whole (no character-level break). */
const wholeWords = (fit, text) => fit.lines.join(' ').replace(/\s+/g, ' ').trim() === String(text).replace(/\s+/g, ' ').trim();

/**
 * Relation labels placed BESIDE their line: candidate spots along the line
 * (middle first) at growing distances on both sides, in several wraps; the
 * nearest spot that is clear of elements, captions, other labels and every
 * line wins. A dotted leader is drawn only when the label had to move away.
 */
function placeLabels(ctx, name, conns, relationLabels, obstacles, bounds, soft = []) {
  const th = ctx.theme;
  const allLines = conns.flatMap(x => lineBoxes(x.c, 0.03, 8));
  const placed = [];
  const ts = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74];
  const ds = [0, 12, 26, 42, 60, 82, 108, 138, 172, 210];
  const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  return conns.map((x, i) => {
    const text = x.rel.label || relationLabels[x.rel.kind] || x.rel.kind;
    const color = kindColor(ctx, x.rel.kind);
    let fits = LABEL_VARIANTS.map(v => ({v, probe: chip(ctx, text, {x: 0, y: 0, ...v, minSize: v.size * 0.92, weight: 600})})).filter(f => !f.probe.fit.truncated && wholeWords(f.probe.fit, text));
    if (!fits.length) fits = [{v: LABEL_VARIANTS[4], probe: chip(ctx, text, {x: 0, y: 0, ...LABEL_VARIANTS[4], minSize: 20, weight: 600})}];
    let best = null;
    let fallback = null;
    /** First clear spot (nearest distance first) against `obs`, up to distance `maxD`. */
    const search = (obs, maxD, keepFallback) => {
      for (const d of ds) {
        if (d > maxD) break;
        for (const f of fits) {
          for (const t of ts) {
            const q = x.c.at(t);
            const a = x.c.at(Math.min(1, t + 0.03)), b = x.c.at(Math.max(0, t - 0.03));
            const L = Math.hypot(a.x - b.x, a.y - b.y) || 1;
            const nx = -(a.y - b.y) / L, ny = (a.x - b.x) / L;
            for (const sgn of [1, -1]) {
              const {w, h: hh} = f.probe.box;
              const half = (Math.abs(nx) * w) / 2 + (Math.abs(ny) * hh) / 2 + 9;
              const cx = q.x + nx * sgn * (half + d), cy = q.y + ny * sgn * (half + d);
              const box = {x: cx - w / 2, y: cy - hh / 2, w, h: hh};
              let cost = inside(box) ? 0 : 1e7;
              for (const o of obs) if (overlap(box, o, 6)) cost += 1000 + area(box, o, 6);
              for (const o of placed) if (overlap(box, o, 8)) cost += 1000 + area(box, o, 8);
              for (const o of allLines) if (overlap(box, o, 0)) cost += 400;
              if (cost === 0) return {box, q, f, d};
              cost += d * 3 + Math.abs(t - 0.5) * 200;
              if (keepFallback && (!fallback || cost < fallback.cost)) fallback = {box, q, f, d, cost};
            }
          }
        }
      }
      return null;
    };
    // near the line, also clear of the elements at their largest (as the
    // tracer passes); otherwise the nearest spot clear of them at rest
    if (soft.length) best = search([...obstacles, ...soft], 60, false);
    if (!best) best = search(obstacles, Infinity, true);
    const pick = best || fallback;
    placed.push(pick.box);
    const c = chip(ctx, text, {x: pick.box.x, y: pick.box.y, ...pick.f.v, minSize: pick.f.v.size * 0.92, weight: 600, fill: th.card, stroke: color, name: `${name}-rlc${i}`});
    let leader = null;
    if (pick.d > 14) {
      const b = pick.box;
      const e = {x: clamp(pick.q.x, b.x + 6, b.x + b.w - 6), y: clamp(pick.q.y, b.y + 4, b.y + b.h - 4)};
      leader = h('line', {x1: r(pick.q.x), y1: r(pick.q.y), x2: r(e.x), y2: r(e.y), stroke: color, 'stroke-width': 2, 'stroke-dasharray': '3 5'});
    }
    const clear = !!best;
    return {node: g({name: `${name}-rl${i}`, opacity: 0}, leader, c.node), box: pick.box, clear};
  });
}

/**
 * Connectors of one relation graph (exploded or gathered), anchored to element
 * edges and bulging AWAY from the other elements. Labels come later
 * (`labelGraph`), once captions are placed clear of the lines.
 */
function connGraph(ctx, name, elements, relationships, relationLabels, bounds) {
  const bendFor = rel => {
    if ((rel.from === 'clause' && rel.to === 'annex') || (rel.from === 'annex' && rel.to === 'clause')) return 0;
    const a = centreOf(elements[rel.from]), b = centreOf(elements[rel.to]);
    const mid = {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2};
    const nx = -(b.y - a.y), ny = b.x - a.x;
    const others = Object.entries(elements).filter(([id]) => id !== rel.from && id !== rel.to).map(([, e]) => centreOf(e));
    const score = sgn => Math.min(...others.map(o => Math.hypot(mid.x + nx * 0.12 * sgn - o.x, mid.y + ny * 0.12 * sgn - o.y)));
    return others.length && score(-1) > score(1) ? -0.1 : 0.1;
  };
  const graph = relationGraph(ctx, {name, elements, relationships, relationLabels, chipSize: 28, separateLabels: true, bounds, bend: bendFor, obstacles: []});
  const near = (e, q) => {
    if (e.circle) return Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r) < 20;
    const bx = e.box;
    const dx = Math.max(bx.x - q.x, 0, q.x - (bx.x + bx.w)), dy = Math.max(bx.y - q.y, 0, q.y - (bx.y + bx.h));
    return Math.hypot(dx, dy) < 20;
  };
  const lands = graph.conns.map(c => near(elements[c.rel.from], c.c.from) && near(elements[c.rel.to], c.c.to));
  const lines = graph.conns.flatMap(x => lineBoxes(x.c, 0.04, 6));
  return {graph, lands, lines, elements};
}

/** Relation labels for a connector graph + its frame function. */
function labelGraph(ctx, name, X, relationLabels, obstacles, bounds, soft = []) {
  const {graph, elements} = X;
  const boxes = Object.values(elements).map(e => (e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: e.circle.r * 2, h: e.circle.r * 2} : e.box));
  const labels = ctx.show('all') ? placeLabels(ctx, name, graph.conns, relationLabels, [...boxes, ...obstacles], bounds, soft) : [];
  /** Connector draw progress + label fade for one progress function; `fade` multiplies everything. */
  const frame = (progressOf, fade = 1) => {
    const out = graph.frame(progressOf);
    graph.conns.forEach((x, i) => {
      delete out[`${name}-lg${i}`];
      const pr = progressOf(i);
      out[`${name}-c${i}`] = {opacity: r((pr > 0 ? 1 : 0) * fade, 3)};
      if (labels[i]) out[`${name}-rl${i}`] = {opacity: r(clamp((pr - 0.55) / 0.45) * fade, 3)};
    });
    return out;
  };
  return {...X, labels, labelsNode: g({name: `${name}-labels`}, labels.map(l => l.node)), labelsClear: labels.every(l => l.clear), frame};
}

/** Largest extra scale of an element as the tracer passes (the focus element enlarges most). */
const focusGrow = (id, focus, reduced) => (id === focus ? (reduced ? 0.07 : 0.14) : 0.05);

/** Clearance between an element's (enlarged) outline and the tracer's centre line. */
const RING_PAD = 34;

/**
 * Closed ring around an element at which the tracer walks between the
 * connector it arrives on and the one it leaves on (so it never crosses the
 * element's own text). `grow` is the element's largest focus scale.
 * @returns {{project:(p:{x:number,y:number})=>number, at:(s:number)=>{x:number,y:number}, P:number}}
 */
function elementRing(e, centre, grow) {
  if (e.circle) {
    const R = e.circle.r * grow + RING_PAD, c = e.circle;
    const P = 2 * Math.PI * R;
    return {
      P,
      project: p => ((Math.atan2(p.y - c.y, p.x - c.x) + 2 * Math.PI) % (2 * Math.PI)) * R,
      at: s => ({x: c.x + R * Math.cos(s / R), y: c.y + R * Math.sin(s / R)}),
    };
  }
  const b = e.box;
  const R = {
    x: centre.x + (b.x - centre.x) * grow - RING_PAD, y: centre.y + (b.y - centre.y) * grow - RING_PAD,
    w: b.w * grow + RING_PAD * 2, h: b.h * grow + RING_PAD * 2,
  };
  const P = 2 * (R.w + R.h);
  return {
    P,
    project(p) {
      const x = clamp(p.x, R.x, R.x + R.w), y = clamp(p.y, R.y, R.y + R.h);
      const dT = y - R.y, dR = R.x + R.w - x, dB = R.y + R.h - y, dL = x - R.x;
      const m = Math.min(dT, dR, dB, dL);
      if (m === dT) return x - R.x;
      if (m === dR) return R.w + (y - R.y);
      if (m === dB) return R.w + R.h + (R.x + R.w - x);
      return 2 * R.w + R.h + (R.y + R.h - y);
    },
    at(s0) {
      let s = ((s0 % P) + P) % P;
      if (s <= R.w) return {x: R.x + s, y: R.y};
      s -= R.w;
      if (s <= R.h) return {x: R.x + R.w, y: R.y + s};
      s -= R.h;
      if (s <= R.w) return {x: R.x + R.w - s, y: R.y + R.h};
      s -= R.w;
      return {x: R.x, y: R.y + R.h - s};
    },
  };
}

/**
 * Tracer route through element ids that stays OUTSIDE the elements: it runs
 * along the connector linking consecutive ids (a straight hop between the
 * facing edges when none does), and between the connector it arrives on and
 * the one it leaves on it walks round the element's (enlarged) outline, the
 * shorter way. It starts and comes to rest beside an element, never on its
 * text. Returns the polyline, the arc-length fraction at which each element is
 * reached, and each leg's span (so a lit copy of a connector keeps pace).
 * @param {Array<{rel:any, c:any}>} conns
 * @param {Record<string, {box?:any, circle?:any}>} elements
 * @param {string[]} order
 * @param {(id:string)=>{centre:{x:number,y:number}, grow:number}} scaleOf
 */
function tracerRoute(conns, elements, order, scaleOf) {
  const ids = order.filter(id => elements[id]);
  const legs = [];
  for (let i = 1; i < ids.length; i++) {
    const prev = ids[i - 1], id = ids[i];
    const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
    const pts = [];
    if (link) {
      const forward = link.rel.from === prev;
      for (let j = 0; j <= 40; j++) pts.push(link.c.at(forward ? j / 40 : 1 - j / 40));
    } else {
      const pe = elements[prev], e = elements[id];
      const anchorOf = (el, toward) => (el.circle ? circleAnchor(el.circle, el.circle.r + 8, toward) : edgeAnchor(el.box, toward, 8));
      pts.push(anchorOf(pe, centreOf(e)), anchorOf(e, centreOf(pe)));
    }
    legs.push({from: prev, to: id, pts: pts.map(q => ({x: q.x, y: q.y})), linked: !!link, conn: link});
  }
  const rings = Object.fromEntries(ids.map(id => { const sc = scaleOf(id); return [id, elementRing(elements[id], sc.centre, sc.grow)]; }));
  const pts = [];
  const mark = {};
  const push = q => pts.push({x: q.x, y: q.y});
  /** Walk round `id`'s ring from point a to point b (projected onto the ring). */
  const walk = (id, a, b) => {
    const R = rings[id];
    const sa = R.project(a), sb = R.project(b);
    let f = ((sb - sa) % R.P + R.P) % R.P;
    if (f > R.P / 2) f -= R.P;
    const n = Math.max(1, Math.ceil(Math.abs(f) / 10));
    for (let j = 0; j <= n; j++) push(R.at(sa + (f * j) / n));
  };
  if (!ids.length) return {poly: polyline([{x: 0, y: 0}]), visits: [], legs: []};
  if (!legs.length) {
    push(rings[ids[0]].at(0));
    mark[`a:${ids[0]}`] = 0;
  }
  legs.forEach((lg, i) => {
    const d = lg.pts[0];
    if (i === 0) {
      push(rings[lg.from].at(rings[lg.from].project(d)));
      mark[`a:${lg.from}`] = 0;
    } else {
      const a = legs[i - 1].pts[legs[i - 1].pts.length - 1];
      walk(lg.from, a, d);
    }
    lg.i0 = pts.length;
    for (const q of lg.pts) push(q);
    lg.i1 = pts.length - 1;
    mark[`a:${lg.to}`] = lg.i1;
    if (i === legs.length - 1) push(rings[lg.to].at(rings[lg.to].project(lg.pts[lg.pts.length - 1])));
  });
  const poly = polyline(pts);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const tAt = i => cum[i] / total;
  return {
    poly,
    visits: ids.map(id => ({id, t: tAt(mark[`a:${id}`] ?? 0)})),
    legs: legs.map(lg => ({...lg, t0: tAt(lg.i0), t1: tAt(lg.i1)})),
  };
}

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const Pl = PLACES[ctx.view.shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const showText = ctx.show('all');
    const showKey = ctx.show('key');
    const k = Math.min(p.linkedClause, p.clauses.length - 1);

    // --- contract (with a dashed slot where the lifted clause was); it moves
    //     from its exploded to its gathered place as one group
    const C = Pl.contract;
    const Cl = Pl.clause;
    const A = Pl.annex;
    // compact signature lines and snug neighbouring rows leave the linked row
    // as much height as possible (the rejoined clause must stay readable)
    const docOpts = {prefix: 'ct', w: C.w, h: C.h, docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions, showText, sigFrac: 0.07, rowKeep: 2.65};
    // the slot is the strip's footprint at home: as wide as the clause text
    // column allows. The strip's type size is chosen for the tallest row the
    // contract can give the linked clause; the linked row then gets the height
    // the strip needs (the other rows share the rest), so the rejoined strip is
    // not shrunk by a short row; it never covers the neighbouring headings.
    const probe = contractSheet(ctx, {...docOpts, rowMin: {index: k, h: 1e5}});
    const kW = (probe.inner + 24) / Cl.w;
    const strip = clauseStrip(ctx, {prefix: 'strip', w: Cl.w, h: Cl.h, maxH: (probe.rows[k].h - 6) / kW, number: k + 1, heading: p.clauses[k], reference: p.reference, showText});
    const SH = strip.h;
    const contract = contractSheet(ctx, {...docOpts, rowMin: {index: k, h: SH * kW + 6}});
    const row = contract.rows[k];
    const kHome = Math.min(kW, (row.h - 6) / SH);
    const slot = {x: contract.pad - 12, y: row.top - 10, w: Cl.w * kHome, h: SH * kHome};
    const slotNode = h('path', {name: 'slot', d: roundRectPath(slot.x, slot.y, slot.w, slot.h, 8), fill: th.paperShade, stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '9 7'});
    // the gathered assembly is drawn larger (kG) so the re-joined clause reads;
    // its top moves (within gaY) so the docked annex keeps room for its caption
    // and stays clear of the folder and the legend, whichever row is linked
    const kG = Pl.kG || 1;
    let gaTop = C.ga[1];
    if (Pl.gaY) {
      const half = (A.h * kG) / 2, sc = (slot.y + slot.h / 2 + strip.port.y * kHome) * kG;
      const lo = Math.max(Pl.gaY.min ?? -Infinity, Pl.gaY.annexTop + half - sc);
      const hi = Pl.gaY.annexBottom - half - sc;
      gaTop = Math.min(Math.max(gaTop, lo), hi);
    }
    const cEx = {x: C.ex[0], y: C.ex[1]}, cGa = {x: C.ga[0], y: gaTop};
    const contractNode = g({name: 'el-contract', transform: T(cEx.x, cEx.y)}, g({name: 'el-contract-body'}, contract.node, slotNode));

    // --- clause strip: exploded pose, and home in the slot (in both states)
    const home = (c, kk) => ({x: c.x + (slot.x + slot.w / 2) * kk, y: c.y + (slot.y + slot.h / 2) * kk, k: (slot.w / Cl.w) * kk});
    const stripHome = home(cEx, 1), stripHomeGa = home(cGa, kG);
    const stripOut = {x: Cl.cx, y: Cl.cy, k: 1};
    const stripBox = {x: Cl.cx - Cl.w / 2, y: Cl.cy - SH / 2, w: Cl.w, h: SH};
    const rowGa = stripHomeGa.y;

    // --- annex (tab centred on its left edge): exploded (tab level with the
    //     strip's port), and docked on the gathered contract's margin with the
    //     tab level with the port of the rejoined clause
    const annex = annexSheet(ctx, {prefix: 'ax', w: A.w, h: A.h, tabY: A.h / 2, labels: [p.annex.label], title: p.annex.title, showText});
    const annexOut = {x: A.ex[0] + A.w / 2, y: A.ex[1] + strip.port.y};
    const annexDock = {x: cGa.x + (C.w - 12) * kG + (A.w * kG) / 2, y: rowGa + strip.port.y * stripHomeGa.k};
    const annexBoxAt = (q, kk) => ({x: q.x - (A.w / 2 + annex.tabW) * kk, y: q.y - (A.h / 2) * kk, w: (A.w + annex.tabW) * kk, h: A.h * kk});
    const annexBox = annexBoxAt(annexOut, 1), annexBoxGa = annexBoxAt(annexDock, kG);
    const eyeAt = (q, kk) => ({x: q.x + annex.eyelet.x * kk, y: q.y + annex.eyelet.y * kk});

    // --- folder (the annex starts inside its pocket, scaled down) — the origin
    const F = Pl.folder;
    const folder = pocketFolder(ctx, {prefix: 'fd', w: F.w, h: F.h, label: showKey ? label('folder') : '', showText: showKey, bigPlate: true});
    const annexHome = {x: F.x + F.w / 2, y: F.y + F.h * 0.42, k: Math.min(0.62, (F.w * 0.8) / A.w)};

    // --- pen and seal badges (exploded → gathered)
    // the seam: the annex's left edge on the contract margin (where a seal marks the join)
    const seamX = cGa.x + (C.w - 12) * kG;
    const annexTopGa = annexDock.y - (A.h * kG) / 2;
    const seam = {x: seamX, y: Math.max(cGa.y, annexTopGa), above: annexTopGa >= cGa.y + 4};
    const G = {contract: {x: cGa.x, y: cGa.y, w: C.w * kG, h: C.h * kG}, row: rowGa, annex: annexBoxGa, seam};
    const penEx = {x: Pl.pen.ex[0], y: Pl.pen.ex[1]}, penGa = Pl.pen.ga(G);
    const sealEx = {x: Pl.seal.ex[0], y: Pl.seal.ex[1]}, sealGa = Pl.seal.ga(G);
    const penIcon = penTool(ctx, {name: 'pen-icon', length: Pl.pen.r * 2.05, body: th.accent2}).node;
    const penB = iconBadge(ctx, {name: 'el-pen', x: penEx.x, y: penEx.y, radius: Pl.pen.r, icon: g({transform: T(-Pl.pen.r * 0.65, Pl.pen.r * 0.57, -48)}, penIcon)});
    const sealB = iconBadge(ctx, {name: 'el-seal', x: sealEx.x, y: sealEx.y, radius: Pl.seal.r, icon: sealTool(ctx, {name: 'seal-icon', radius: Pl.seal.r * 0.55, color: th.accent})});

    // --- connectors of both states first (captions and labels avoid them)
    const legendBox = {x: Pl.legend[0] - 300, y: Pl.legend[1] - 26, w: 600, h: 52};
    const bounds = {x: 0, y: 0, w: S.w, h: S.h - 60};
    const elements = {
      contract: {box: {x: cEx.x, y: cEx.y, w: C.w, h: C.h}},
      clause: {box: stripBox},
      annex: {box: annexBox},
      folder: {box: {x: F.x, y: F.y, w: F.w, h: F.h}},
      pen: {circle: {x: penEx.x, y: penEx.y, r: Pl.pen.r}},
      seal: {circle: {x: sealEx.x, y: sealEx.y, r: Pl.seal.r}},
    };
    const EXc = connGraph(ctx, 'rel', elements, p.relationships, p.relationLabels, bounds);
    // the tracer runs along the exploded connectors and walks round each
    // element's enlarged outline between them (never over the element's text)
    const scaleCentre = {clause: {x: Cl.cx, y: Cl.cy}, annex: annexOut, pen: penEx, seal: sealEx};
    const centreFor = id => scaleCentre[id] || centreOf(elements[id]);
    const growFor = id => (id === 'folder' ? 1 : 1 + focusGrow(id, p.focusElement, ctx.reduced));
    const route = tracerRoute(EXc.graph.conns, elements, p.traversalOrder, id => ({centre: centreFor(id), grow: growFor(id)}));
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));
    // gathered state: relations among contract / clause / annex are embodied by
    // the assembly (the clause back in its slot, the tab joined at the clause);
    // the others are redrawn to the assembled parts. The clause is reached at
    // its row on the contract's left edge.
    const elementsGa = {
      contract: {box: G.contract},
      clause: {box: {x: cGa.x, y: rowGa - 22 * kG, w: 2, h: 44 * kG}},
      annex: {box: annexBoxGa},
      folder: elements.folder,
      pen: {circle: {x: penGa.x, y: penGa.y, r: Pl.pen.r}},
      seal: {circle: {x: sealGa.x, y: sealGa.y, r: Pl.seal.r}},
    };
    // in the assembly the seal's relation to the annex lands on the seam (the
    // join it marks), reached from above over free desk
    const toSeam = rel => !!Pl.seamSeal && seam.above && ((rel.from === 'seal' && rel.to === 'annex') || (rel.from === 'annex' && rel.to === 'seal'));
    if (p.relationships.some(toSeam)) elementsGa.seam = {box: {x: seam.x - 3, y: seam.y - 3, w: 6, h: 6}};
    const relsGa = p.relationships.map((rel, i) => ({rel, i})).filter(x => !(ASSEMBLY.has(x.rel.from) && ASSEMBLY.has(x.rel.to)) && x.rel.from !== x.rel.to);
    const seamRel = rel => (toSeam(rel) ? {...rel, from: rel.from === 'annex' ? 'seam' : rel.from, to: rel.to === 'annex' ? 'seam' : rel.to} : rel);
    const GAc = relsGa.length ? connGraph(ctx, 'relg', elementsGa, relsGa.map(x => seamRel(x.rel)), p.relationLabels, bounds) : null;

    // --- element captions: one per state. The exploded captions fold away
    //     with the relations; the gathered ones (placed for the assembly, with
    //     their own width) appear once the parts have assembled, so no caption
    //     is ever dragged across a moving sheet. The clause caption leaves with
    //     the exploded strip.
    const caps = {};
    const capsGa = {};
    const sideOf = (id, state) => ((Pl.caps || {})[id] || {})[state] || DEFAULT_CAPS[id][state];
    /** Caption chip beside a box on the given side (clamped to the design space). */
    const capAt = (id, box, side, maxWidth, ga = false) => {
      const base = {size: 30, maxLines: ga && (Pl.capMaxGa || {})[id] ? 3 : 2, name: ga ? `cap-${id}-ga` : `cap-${id}`, fill: th.card, maxWidth};
      const probe = chip(ctx, label(id), {...base, x: 0, y: 0});
      const {w: cw, h: chh} = probe.box;
      let at = side === 'below' ? {x: box.x + box.w / 2, y: box.y + box.h + 12, anchor: 'middle'}
        : side === 'above' ? {x: box.x + box.w / 2, y: box.y - 12 - chh, anchor: 'middle'}
          : side === 'aboveStart' ? {x: box.x, y: box.y - 12 - chh, anchor: 'start'}
            : side === 'belowStart' ? {x: box.x, y: box.y + box.h + 12, anchor: 'start'}
              : side === 'aboveEnd' ? {x: box.x + box.w, y: box.y - 12 - chh, anchor: 'end'}
              : side === 'left' ? {x: box.x - 12, y: box.y + box.h / 2 - chh / 2, anchor: 'end'}
                : {x: box.x + box.w + 12, y: box.y + box.h / 2 - chh / 2, anchor: 'start'};
      // keep the caption inside the design space: a side caption that does not
      // fit falls back below its element; any caption is then clamped
      const left = at.anchor === 'middle' ? at.x - cw / 2 : at.anchor === 'end' ? at.x - cw : at.x;
      if ((side === 'left' || side === 'right') && (left < 6 || left + cw > S.w - 6)) at = {x: box.x + box.w / 2, y: box.y + box.h + 12, anchor: 'middle'};
      const l2 = at.anchor === 'middle' ? at.x - cw / 2 : at.anchor === 'end' ? at.x - cw : at.x;
      const dx = l2 < 6 ? 6 - l2 : l2 + cw > S.w - 6 ? S.w - 6 - (l2 + cw) : 0;
      return chip(ctx, label(id), {...base, ...at, x: at.x + dx});
    };
    /** Preferred side first; another side when it would cover another element or caption. */
    const capChip = (id, box, side, maxWidth, avoid, ga = false) => {
      let first = null;
      for (const sd of [side, 'below', 'above', 'right', 'left']) {
        const c = capAt(id, box, sd, maxWidth, ga);
        first = first || c;
        if (!avoid.some(o => overlap(c.box, o, 4))) return c;
      }
      return first;
    };
    const circleBox = (c, rr) => ({x: c.x - rr, y: c.y - rr, w: rr * 2, h: rr * 2});
    const capTargets = {
      contract: [{x: cEx.x, y: cEx.y, w: C.w, h: C.h}, {x: cGa.x, y: cGa.y, w: C.w * kG, h: C.h * kG}, C.w + 40],
      clause: [stripBox, null, Cl.w],
      annex: [annexBox, annexBoxGa, A.w + 90],
      pen: [circleBox(penEx, Pl.pen.r), circleBox(penGa, Pl.pen.r), 300],
      seal: [circleBox(sealEx, Pl.seal.r), circleBox(sealGa, Pl.seal.r), 300],
    };
    if (showKey) {
      const folderBox = {x: F.x, y: F.y, w: F.w, h: F.h};
      const legendB = {x: Pl.legend[0] - 300, y: Pl.legend[1] - 26, w: 600, h: 52};
      const avoidEx = [folderBox, legendB, ...EXc.lines, ...Object.entries(capTargets).map(([id, b]) => ({id, b: b[0]}))];
      const avoidGa = [folderBox, legendB, ...(GAc ? GAc.lines : []), ...Object.entries(capTargets).filter(([, b]) => b[1]).map(([id, b]) => ({id, b: b[1]}))];
      const others = (list, id) => list.filter(o => !o.id || o.id !== id).map(o => (o.b ? o.b : o));
      const placedEx = [], placedGa = [];
      for (const [id, [bEx, bGa, mw]] of Object.entries(capTargets)) {
        // the annex caption centres on the sheet (not on sheet + tab)
        const adj = b => (id === 'annex' && b ? {...b, x: b.x + (b.w - (b.w * A.w) / (A.w + annex.tabW)), w: (b.w * A.w) / (A.w + annex.tabW)} : b);
        const c = capChip(id, adj(bEx), sideOf(id, 'ex'), mw, [...others(avoidEx, id), ...placedEx]);
        caps[id] = c;
        placedEx.push(c.box);
        if (bGa) {
          const cg = capChip(id, adj(bGa), sideOf(id, 'ga'), ((Pl.capMaxGa || {})[id]) || mw, [...others(avoidGa, id), ...placedGa], true);
          capsGa[id] = cg;
          placedGa.push(cg.box);
        }
      }
    }
    const capBoxGa = id => (capsGa[id] ? capsGa[id].box : null);

    // --- descriptive tags: "reference written" rides with the exploded strip
    //     (the change, shown once the tracer has written it), on the first side
    //     of the strip that is clear of connectors, elements and captions;
    //     "linked to clause n" rides on the annex sheet (the state, shown in the gather)
    let tagW = null;
    if (showKey) {
      const tagOpts = {size: 26, maxWidth: Cl.w * 0.8, name: 'tag-written', color: th.accent4, opacity: 0};
      const probe = statusTag(ctx, ctx.t.written, {...tagOpts, x: 0, y: 0});
      const {w: tw, h: tH} = probe.box;
      const capB = caps.clause ? caps.clause.box : null;
      const below = SH / 2 + 14 + (Pl.tagWBelowCaption && capB ? capB.h + 10 : 0);
      const above = -SH / 2 - 14 - tH - (capB && capB.y < Cl.cy ? capB.h + 10 : 0);
      // candidates nearest the strip first: under / over it, then sliding
      // out past its ends, then beside it, then a second row down
      const xL = -Cl.w / 2 + 10, xR = Cl.w / 2 - 10 - tw, xC = -tw / 2;
      const slide = [];
      for (let d = 30; d <= tw * 0.75; d += 30) slide.push(xR + d, xL - d);
      const sides = [-tH / 2, -SH / 2, SH / 2 - tH].flatMap(y => [{x: Cl.w / 2 + 18, y}, {x: -Cl.w / 2 - 18 - tw, y}]);
      const cands = [
        ...[xL, xR, xC].map(x => ({x, y: below})), ...[xR, xL].map(x => ({x, y: above})),
        ...slide.map(x => ({x, y: below})), ...slide.map(x => ({x, y: above})),
        ...sides,
        ...[xL, xR].map(x => ({x, y: below + tH + 16})),
      ];
      const obs = [...EXc.lines, ...Object.values(caps).map(c => c.box), ...Object.entries(elements).filter(([id]) => id !== 'clause').map(([, e]) => (e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: e.circle.r * 2, h: e.circle.r * 2} : e.box)), legendBox];
      // the tracer's path once the reference is written (the tag is shown then)
      const tracerAfter = [];
      if (visitT.clause !== undefined) for (let t = Math.max(0, visitT.clause - 0.05); t <= 1.0001; t += 0.01) { const q = route.poly.at(Math.min(1, t)); tracerAfter.push({x: q.x - 30, y: q.y - 30, w: 60, h: 60}); }
      const world = c => ({x: Cl.cx + c.x, y: Cl.cy + c.y, w: tw, h: tH});
      const cost = (c, i) => {
        const b = world(c);
        if (!(b.x >= 4 && b.y >= 4 && b.x + b.w <= S.w - 4 && b.y + b.h <= S.h - 64)) return Infinity;
        let k = i;
        for (const o of obs) if (overlap(b, o, 6)) k += 1000 + area(b, o, 6);
        for (const o of tracerAfter) if (overlap(b, o, 0)) k += 25;
        return k;
      };
      let pick = cands[0], best = Infinity;
      cands.forEach((c, i) => { const k = cost(c, i); if (k < best) { best = k; pick = c; } });
      tagW = statusTag(ctx, ctx.t.written, {...tagOpts, ...pick});
    }
    // the state tag keeps its whole text: it steps down in size before any
    // truncation (the tag overhangs the sheet by at most 10 units a side)
    const linkedText = ctx.t.linkedTo.replace('{n}', String(k + 1));
    const tagLSize = [26, 24, 22, 20, 18].find(z => !ctx.fit(linkedText, {maxWidth: A.w + 20 - z * 2.3, size: z, maxLines: 1, weight: 700}).truncated) || 18;
    const tagL = showKey ? statusTag(ctx, linkedText, {x: 0, y: A.h / 2 - 66, anchor: 'middle', size: tagLSize, maxWidth: A.w + 20 - tagLSize * 2.3, name: 'tag-linked', color: th.accent2, opacity: 0}) : null;
    const tagWBox = tagW ? {...tagW.box, x: tagW.box.x + Cl.cx, y: tagW.box.y + Cl.cy} : null;
    // exploded captions (and the written tag) step out as their element
    // enlarges under the tracer, so they never cover its edge: the unit push is
    // the element's reach from its scale centre toward the caption's side
    const elBox = id => { const e = elements[id]; return e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: e.circle.r * 2, h: e.circle.r * 2} : e.box; };
    const pushOf = (K, id) => {
      const B = elBox(id), c = centreFor(id);
      const ux = K.x + K.w <= B.x + 1 ? -(c.x - B.x) : K.x >= B.x + B.w - 1 ? B.x + B.w - c.x : 0;
      const uy = K.y + K.h <= B.y + 1 ? -(c.y - B.y) : K.y >= B.y + B.h - 1 ? B.y + B.h - c.y : 0;
      return {id, ux, uy, K};
    };
    const capPush = Object.entries(caps).map(([id, c]) => ({name: c.node.attrs.name, ...pushOf(c.box, id)}));
    const tagPush = tagWBox ? pushOf(tagWBox, 'clause') : null;

    // --- relation labels beside their lines (clear of captions and tags)
    // relation labels also keep clear of each element at its largest (as the tracer passes)
    const grownBox = id => { const B = elBox(id), c = centreFor(id), k = growFor(id); return {x: c.x + (B.x - c.x) * k, y: c.y + (B.y - c.y) * k, w: B.w * k, h: B.h * k}; };
    const obsEx = [...Object.values(caps).map(c => c.box), tagWBox, legendBox].filter(Boolean);
    const EX = labelGraph(ctx, 'rel', EXc, p.relationLabels, obsEx, bounds, Object.keys(elements).map(grownBox));
    const tagLBoxGa = tagL ? {x: annexDock.x + tagL.box.x * kG, y: annexDock.y + tagL.box.y * kG, w: tagL.box.w * kG, h: tagL.box.h * kG} : null;
    const obsGa = [...['contract', 'annex', 'pen', 'seal'].map(capBoxGa), tagLBoxGa, legendBox].filter(Boolean);
    const GA = GAc ? labelGraph(ctx, 'relg', GAc, p.relationLabels, obsGa, bounds) : null;


    // --- tracer: a large ring that runs along the connectors; each connector
    //     it follows lights up behind it
    const segs = [];
    for (const lg of route.legs) {
      if (!lg.linked) continue;
      const pl = polyline(lg.pts);
      segs.push({name: `trace-seg-${segs.length}`, t0: lg.t0, t1: lg.t1, total: pl.total, d: pl.d(1)});
    }
    const segNodes = segs.map(sg => h('path', {name: sg.name, d: sg.d, fill: 'none', stroke: th.accent, 'stroke-width': 11, 'stroke-linecap': 'round', opacity: 0, 'stroke-dasharray': `${r(sg.total)} ${r(sg.total + 20)}`, 'stroke-dashoffset': r(sg.total)}));
    const tracerNode = g({name: 'tracer', opacity: 0},
      h('circle', {name: 'tracer-halo', r: 40, fill: th.accent, opacity: 0.2}),
      h('circle', {r: 25, fill: th.paper, stroke: th.accent, 'stroke-width': 7}),
      h('circle', {r: 11, fill: th.accent}),
    );

    // --- the join in the assembly: ink from the strip's port to the tab eyelet
    const portGa = {x: stripHomeGa.x + strip.port.x * stripHomeGa.k, y: stripHomeGa.y + strip.port.y * stripHomeGa.k};
    const eyeGa = eyeAt(annexDock, kG);
    const joinLen = Math.hypot(eyeGa.x - portGa.x, eyeGa.y - portGa.y);
    const joinInk = h('path', {name: 'join-ink', d: `M${r(portGa.x)} ${r(portGa.y)}L${r(eyeGa.x)} ${r(eyeGa.y)}`, stroke: INK_BLUE, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none', opacity: 0, 'stroke-dasharray': `${r(joinLen)} ${r(joinLen + 10)}`, 'stroke-dashoffset': r(joinLen)});
    const joinRing = h('circle', {name: 'join-ring', cx: 0, cy: 0, r: r(annex.eyeR + 14), fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});

    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = ctx.show('all') ? legendNode(ctx, kinds, p.relationLabels, {x: Pl.legend[0], y: Pl.legend[1]}) : null;
    const rowTextNode = showText && p.clauses[k] ? `ct-clause-${k}` : null;
    return {
      S, s, ox, oy, C, cEx, cGa, kG, contractNode, strip, stripHome, stripHomeGa, stripOut, annex, annexHome, annexOut, annexDock, eyeAt,
      folder, F, penB, sealB, penEx, penGa, sealEx, sealGa, caps, capsGa, tagW, tagL, EX, GA, relsGa, route, visitT, segs, segNodes, tracerNode,
      joinInk, joinLen, joinRing, legend, elements, elementsGa, k, rowTextNode, capPush, tagPush,
      // type size of the rejoined clause relative to the contract's own clause headings
      rejoinedTextRatio: r((strip.size * kHome) / contract.headSize, 3),
    };
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.EX.graph.node,
      L.GA && L.GA.graph.node,
      L.segNodes,
      L.contractNode,
      g({transform: T(L.F.x, L.F.y)}, L.folder.back),
      L.annex.node,
      L.tagL && g({name: 'ax-tags'}, L.tagL.node),
      g({transform: T(L.F.x, L.F.y)}, L.folder.pocket),
      L.penB.node, L.sealB.node,
      L.strip.node,
      // the tracer runs over the parts but under every caption, tag and
      // relation label, so the text it passes stays readable
      L.tracerNode,
      L.tagW && g({name: 'strip-tags'}, L.tagW.node),
      L.joinInk, L.joinRing,
      Object.values(L.caps).map(c => c.node),
      Object.values(L.capsGa).map(c => c.node),
      L.EX.labelsNode,
      L.GA && L.GA.labelsNode,
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: the clause lifts out of the contract; the annex rises out of its folder
    const appear = seg(u, ...W.appear);
    const lift = ease.inOutCubic(seg(u, ...W.lift));
    const rise = ease.inOutCubic(seg(u, ...W.rise));
    // 4) gather (computed early: it moves every part)
    const fold = seg(u, ...W.fold);
    const m = ease.inOutCubic(seg(u, ...W.move));
    const mix2 = (a, b) => ({x: lerp(a.x, b.x, m), y: lerp(a.y, b.y, m)});
    const cPos = mix2(L.cEx, L.cGa);
    const kNow = lerp(1, L.kG, m);
    nodes['el-contract'] = {transform: T(cPos.x, cPos.y, 0, kNow)};
    const outK = {x: lerp(L.stripHome.x, L.stripOut.x, lift), y: lerp(L.stripHome.y, L.stripOut.y, lift), k: lerp(L.stripHome.k, 1, lift)};
    const sp = {x: lerp(outK.x, L.stripHomeGa.x, m), y: lerp(outK.y, L.stripHomeGa.y, m), k: lerp(outK.k, L.stripHomeGa.k, m)};
    const aOut = {x: lerp(L.annexHome.x, L.annexOut.x, rise), y: lerp(L.annexHome.y, L.annexOut.y, rise), k: lerp(L.annexHome.k, 1, rise)};
    const ap = {x: lerp(aOut.x, L.annexDock.x, m), y: lerp(aOut.y, L.annexDock.y, m), k: lerp(aOut.k, L.kG, m)};
    // pen and seal badges step out while the parts assemble (so they never
    // cross the moving sheets) and step in beside what they acted on
    const bOut = seg(u, 0.75, 0.78), bIn = seg(u, 0.875, 0.91);
    const badgeVis = u < 0.8 ? 1 - bOut : bIn;
    const mb = ease.inOutCubic(seg(u, 0.78, 0.86));
    const penP = {x: lerp(L.penEx.x, L.penGa.x, mb), y: lerp(L.penEx.y, L.penGa.y, mb)};
    const sealP = {x: lerp(L.sealEx.x, L.sealGa.x, mb), y: lerp(L.sealEx.y, L.sealGa.y, mb)};
    // the clause row is physically lifted out: its printed heading leaves with the strip
    if (L.rowTextNode) nodes[L.rowTextNode] = {opacity: 0};
    for (const id of ['pen', 'seal']) nodes[`el-${id}`] = {opacity: r(appear * badgeVis, 3)};
    nodes['el-pen'].transform = T(penP.x, penP.y);
    nodes['el-seal'].transform = T(sealP.x, sealP.y);
    const capP = seg(u, ...W.caps);
    // exploded captions fold away with the relations (badge captions leave
    // with their badges); the gathered captions appear once the parts have
    // assembled (badge captions arrive with their badges)
    const capIn = seg(u, 0.88, 0.93);
    for (const [id, c] of Object.entries(L.caps)) {
      const badge = id === 'pen' || id === 'seal';
      nodes[c.node.attrs.name] = {opacity: r(capP * (badge ? (u < 0.8 ? 1 - bOut : 0) : 1 - fold), 3)};
    }
    for (const [id, c] of Object.entries(L.capsGa)) {
      const badge = id === 'pen' || id === 'seal';
      nodes[c.node.attrs.name] = {opacity: r(badge ? (u < 0.8 ? 0 : bIn) : capIn, 3)};
    }
    // 2) relations drawn one by one (they fold away at the start of the gather)
    const n = p.relationships.length;
    const [ra, rb] = W.rel;
    const relP = i => ease.inOutCubic(seg(u, ra + (i * (rb - ra)) / n, ra + ((i + 1) * (rb - ra)) / n));
    Object.assign(nodes, L.EX.frame(relP, 1 - fold));
    // gathered relations: redrawn once the parts have assembled
    const nG = L.relsGa.length;
    const [ga, gb] = W.regrow;
    const relPG = i => ease.inOutCubic(seg(u, ga + (i * (gb - ga)) / Math.max(1, nG), ga + ((i + 1) * (gb - ga)) / Math.max(1, nG)));
    if (L.GA) Object.assign(nodes, L.GA.frame(relPG));
    // 3) tracer follows the traversal order; the focus element enlarges as it passes
    const tp = seg(u, ...W.trace);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.76;
    const halo = reduced ? 1 : 1 + 0.18 * Math.sin(u * Math.PI * 2 * 9);
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    nodes['tracer-halo'] = {transform: `scale(${r(halo, 3)})`};
    for (const sg of L.segs) {
      const q = clamp((tt - sg.t0) / Math.max(1e-6, sg.t1 - sg.t0));
      nodes[sg.name] = {'stroke-dashoffset': r(sg.total * (1 - q)), opacity: r((q > 0 ? 0.42 : 0) * (1 - fold), 3)};
    }
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    const bump = id => 1 + focusGrow(id, p.focusElement, reduced) * ease.inOutSine(pulse(id));
    /** Offset that keeps a caption's gap to its enlarged element (clamped to the design space). */
    const pushed = P => {
      const b = bump(P.id) - 1;
      const dx = clamp(b * P.ux, 2 - P.K.x, L.S.w - 2 - (P.K.x + P.K.w));
      const dy = clamp(b * P.uy, 2 - P.K.y, L.S.h - 2 - (P.K.y + P.K.h));
      return {x: dx, y: dy};
    };
    for (const P of L.capPush) {
      const d = pushed(P);
      nodes[P.name].transform = T(d.x, d.y);
    }
    nodes['el-contract-body'] = {transform: scaleAbout(L.C.w / 2, L.C.h / 2, bump('contract'))};
    nodes.strip = {transform: T(sp.x, sp.y, 0, sp.k * bump('clause'))};
    nodes.ax = {transform: T(ap.x, ap.y, 0, ap.k * bump('annex'))};
    nodes['ax-shadow'] = {transform: T(8, 10)};
    nodes['el-pen-body'] = {transform: `scale(${r(bump('pen'), 4)})`};
    nodes['el-seal-body'] = {transform: `scale(${r(bump('seal'), 4)})`};
    // the change: the reference is written and the port joins the tab only when
    // the tracer reaches the clause (after it has passed the annex)
    const reach = L.visitT.clause;
    const written = reach === undefined ? (u >= 0.75 ? 1 : 0) : (u >= 0.74 ? 1 : tracerOn ? seg(tt, Math.max(0, reach - 0.1), reach) : 0);
    nodes['strip-ref-clip'] = {width: r(L.strip.slot.w * clamp(written))};
    nodes['strip-slot'] = {opacity: r(1 - clamp(written), 3)};
    nodes['strip-inner'] = {'stroke-dashoffset': r(L.strip.innerLen * (1 - clamp((written - 0.7) / 0.3)))};
    const joined = written >= 1;
    nodes['strip-port-on'] = {opacity: joined ? 1 : 0};
    // descriptive tags
    if (L.tagW) {
      const d = L.tagPush ? pushed(L.tagPush) : {x: 0, y: 0};
      nodes['strip-tags'] = {transform: T(sp.x + d.x, sp.y + d.y)};
      // shown at full strength as soon as the reference is written (while the
      // exploded view holds), folded away with the relations at the gather
      const tagOn = reach === undefined ? 0 : clamp((clamp(written) - 0.6) / 0.4);
      nodes['tag-written'] = {opacity: r(tagOn * (1 - fold), 3)};
    }
    if (L.tagL) {
      nodes['ax-tags'] = {transform: T(ap.x, ap.y, 0, ap.k)};
      nodes['tag-linked'] = {opacity: r(joined ? seg(u, ...W.tags) : 0, 3)};
    }
    // the join in the assembly: ink port → eyelet, then a ring on the eyelet
    const jp = seg(u, ...W.join);
    const eye = L.eyeAt(ap, ap.k);
    nodes['join-ink'] = {opacity: jp > 0 ? 1 : 0, 'stroke-dashoffset': r(L.joinLen * (1 - jp))};
    nodes['join-ring'] = {transform: T(eye.x, eye.y, 0, ap.k), opacity: r(jp >= 1 ? 1 - 0.55 * seg(u, 0.9, 0.97) : 0, 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, 0.18, 0.24), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const annexEye = L.eyeAt(ap, ap.k);
    const portNow = {x: sp.x + L.strip.port.x * sp.k, y: sp.y + L.strip.port.y * sp.k};
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        strip: {x: r(sp.x), y: r(sp.y)},
        annex: {x: r(ap.x), y: r(ap.y)},
        stripLifted: r(lift * (1 - m), 3),
        annexOut: r(rise, 3),
        gathered: r(m, 3),
        rejoinedTextRatio: L.rejoinedTextRatio,
        stripInSlot: Math.abs(sp.x - L.stripHomeGa.x) < 0.5 && Math.abs(sp.y - L.stripHomeGa.y) < 0.5 && m >= 1,
        annexTabAtClause: Math.abs(annexEye.y - portNow.y) < 0.5 && m >= 1,
        referenceWritten: r(clamp(written), 3),
        joined,
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        relationsFolded: r(fold, 3),
        gatheredRelations: L.relsGa.map(x => x.i),
        gatheredRelationsDrawn: L.relsGa.map((_, i) => r(relPG(i), 3)),
        visitOrder: L.route.visits.map(v => v.id),
        connectorsLand: L.EX.lands.every(Boolean) && (!L.GA || L.GA.lands.every(Boolean)),
        labelsOffLines: L.EX.labelsClear && (!L.GA || L.GA.labelsClear),
        kinds: p.relationships.map(x => x.kind),
        arrowOnPlainRelation: [L.EX, L.GA].filter(Boolean).some(X => X.graph.conns.some(c => c.rel.kind === 'relation' && !!c.c.node.children.find(ch => ch.attrs && /-head$/.test(ch.attrs.name || '')))),
      },
    };
  },
};

function legendNode(ctx, kinds, labels, at) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const size = 30;
  const gap = 56;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return g({name: 'legend', opacity: 0}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-06-mechanism',
    title: 'Annex incorporated — exploded join',
    titleEs: 'Anexo incorporado — Mecanismo o relación explicada',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Anexo incorporado',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: the linked clause lifts out of the contract as an enlarged strip with a port; the annex rises out of its folder with its index tab facing the port; pen and seal sit where they act. Edge-anchored connectors are styled by relation kind, a large tracer lights each connector it follows, and the reference is written and the port joined only when it reaches the clause. The mechanism then re-assembles: the strip returns into its slot, the annex docks with its tab at the clause, and the remaining relations are redrawn to the assembled parts.',
    tags: ['annex', 'clause', 'cross-reference', 'mechanism', 'exploded', 'relations', 'tracer', 'folder', 'seal', 'assembly'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/anexo-incorporado.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
