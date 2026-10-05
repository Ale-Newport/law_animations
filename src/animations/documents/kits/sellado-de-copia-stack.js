/**
 * Exploded oblique stack for the "Sellado de copia" mechanism (LAW-0006).
 *
 * Flat objects (folder, copy, original, ink pad) lie on horizontal planes and
 * are drawn with an oblique projection (plan x/y → screen), so the copy can
 * float above the folder that supports it and cast a shadow on it. The rubber
 * stamp is an upright object whose die face sits directly above one spot of
 * the copy. Everything here is geometry: shapes, named nodes, ports on real
 * outlines and a port-anchored connector graph. The entry owns the timeline.
 * @module animations/documents/kits/sellado-de-copia-stack
 */
import {h, g} from '../../../core/svg.js';
import {T} from '../../../core/transform.js';
import {r} from '../../../core/time.js';
import {polyline, roundRectPath} from '../../../core/geometry.js';
import {shade} from '../../../primitives/paper.js';
import {connector, chip, tracer, textBlock} from '../../../primitives/annotate.js';
import {kindColor} from '../../../frameworks/graph.js';
import {sheet, inkMark, balancedWidth} from './sellado-de-copia.js';

/** Oblique projection: depth recedes up-right. */
export const OBL = {K: -0.38, D: 0.6};
/** plan (x, y) → screen offset */
export const obl = (x, y) => ({x: x + OBL.K * y, y: OBL.D * y});
/** SVG matrix placing plan coordinates with plan origin at screen (ex, ey). */
export const oblMatrix = (ex, ey) => `matrix(1 0 ${OBL.K} ${OBL.D} ${r(ex)} ${r(ey)})`;
const add = (a, b) => ({x: a.x + b.x, y: a.y + b.y});
const pts = list => list.map(p => `${r(p.x)} ${r(p.y)}`).join(' ');
const poly = (list, attrs) => h('polygon', {points: pts(list), ...attrs});

/** Screen outline of a plan rectangle w×h with plan origin at screen O. */
export function flatOutline(O, w, hh) {
  return [O, add(O, obl(w, 0)), add(O, obl(w, hh)), add(O, obl(0, hh))];
}

/** Ports on the outline of a flat plan rectangle (screen coordinates). */
export function flatPorts(O, w, hh, thick = 0) {
  return {
    left: add(O, {x: obl(0, hh / 2).x - 8, y: obl(0, hh / 2).y}),
    right: add(O, {x: obl(w, hh / 2).x + 8, y: obl(w, hh / 2).y}),
    top: add(O, {x: w / 2, y: -8}),
    bottom: add(O, {x: obl(w / 2, hh).x, y: obl(w / 2, hh).y + thick + 8}),
    farLeft: add(O, {x: obl(0, hh * 0.18).x - 8, y: obl(0, hh * 0.18).y}),
    nearRight: add(O, {x: obl(w, hh * 0.8).x + 8, y: obl(w, hh * 0.8).y}),
  };
}

/**
 * Oblique slab edges (front and right faces) below a flat plan rectangle.
 * @returns {any[]} polygons in screen coordinates relative to the plan origin
 */
function slabEdges(w, hh, t, front, side, stroke) {
  const NL = obl(0, hh), NR = obl(w, hh), FR = obl(w, 0);
  return [
    poly([NL, NR, {x: NR.x, y: NR.y + t}, {x: NL.x, y: NL.y + t}], {fill: front, stroke, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    poly([NR, FR, {x: FR.x, y: FR.y + t}, {x: NR.x, y: NR.y + t}], {fill: side, stroke, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
}

/**
 * Folder lying flat (plan w×h, plan origin = top-left). Local origin of the
 * returned node = plan origin in screen space.
 */
export function flatFolder(ctx, {w, h: hh, color = '#d9b877', label, showText}) {
  const th = ctx.theme;
  const tabW = w * 0.34;
  const t = 12;
  let labelNode = null;
  if (label && showText) {
    const f = ctx.fit(label, {maxWidth: w * 0.7, size: 26, minSize: 16, maxLines: 1, weight: 700});
    labelNode = textBlock(f, {x: w * 0.08, y: hh - 18 - f.size, fill: th.ink});
  }
  return g(null,
    slabEdges(w, hh, t, shade(color, -0.3), shade(color, -0.18), th.ink),
    g({transform: oblMatrix(0, 0)},
      h('path', {d: `M0 30Q0 0 12 0H${r(tabW)}L${r(tabW + 24)} 24H${r(w - 12)}Q${r(w)} 24 ${r(w)} 36V${r(hh - 12)}Q${r(w)} ${r(hh)} ${r(w - 12)} ${r(hh)}H12Q0 ${r(hh)} 0 ${r(hh - 12)}Z`, fill: color, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
      h('rect', {x: r(w * 0.08), y: r(hh * 0.1), width: r(w * 0.8), height: r(hh * 0.72), rx: 4, fill: '#efe9dc', stroke: shade(color, -0.35), 'stroke-width': 1.5}),
      h('rect', {x: r(w * 0.1), y: r(hh * 0.085), width: r(w * 0.8), height: r(hh * 0.72), rx: 4, fill: '#f6f2e8', stroke: shade(color, -0.35), 'stroke-width': 1.5}),
      labelNode,
    ),
  );
}

/**
 * Ink pad lying flat (plan w×h). Local origin = plan origin. The inked felt
 * is a named node so the entry can pulse it.
 */
export function flatPad(ctx, {name, w, h: hh, ink}) {
  const th = ctx.theme;
  const metal = '#aab3bb';
  const t = 16;
  const lid = 44;
  const FL = {x: 0, y: 0}, FR = {x: w, y: 0};
  return g({name},
    // lid raised behind the pad
    poly([FL, FR, {x: FR.x + 16, y: FR.y - lid}, {x: FL.x + 16, y: FL.y - lid}], {fill: shade(metal, 0.2), stroke: th.ink, 'stroke-width': 2.5, 'stroke-linejoin': 'round'}),
    h('line', {x1: r(w * 0.25 + 12), x2: r(w * 0.75 + 12), y1: r(-lid * 0.55), y2: r(-lid * 0.55), stroke: shade(metal, -0.2), 'stroke-width': 5, 'stroke-linecap': 'round'}),
    slabEdges(w, hh, t, shade(metal, -0.3), shade(metal, -0.15), th.ink),
    g({transform: oblMatrix(0, 0)},
      h('path', {d: roundRectPath(0, 0, w, hh, 10), fill: metal, stroke: th.ink, 'stroke-width': th.stroke}),
      h('path', {d: roundRectPath(12, 12, w - 24, hh - 24, 6), fill: shade(ink, -0.28), stroke: shade(ink, -0.5), 'stroke-width': 1.5}),
      h('path', {d: `M24 ${r(hh * 0.4)}L${r(w * 0.3)} 22M24 ${r(hh * 0.7)}L${r(w * 0.5)} 22`, stroke: '#fff', 'stroke-width': 3, opacity: 0.25, 'stroke-linecap': 'round'}),
    ),
  );
}

/**
 * Upright rubber stamp in oblique view. Local origin = centre of the die
 * face (the part that touches paper). The rubber die has a clean and an
 * inked layer (`${name}-inked` opacity animates).
 * @returns {{node:any, ports:Record<string,{x:number,y:number}>, top:number, box:{x:number,y:number,w:number,h:number}}}
 */
export function uprightStamp(ctx, {name, sw, sh, ink, td = 14, tm = 40}) {
  const th = ctx.theme;
  const q = (x, y, lvl) => ({x: x + OBL.K * y, y: OBL.D * y - lvl});
  const wood = '#b98a5e', knob = '#6e4b2f', rubber = '#6a6e75';
  const T0 = td, T1 = td + tm;
  const band = (hw, hh2, l0, l1, front, side) => [
    poly([q(-hw, hh2, l0), q(hw, hh2, l0), q(hw, hh2, l1), q(-hw, hh2, l1)], {fill: front, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
    poly([q(hw, hh2, l0), q(hw, -hh2, l0), q(hw, -hh2, l1), q(hw, hh2, l1)], {fill: side, stroke: th.ink, 'stroke-width': 2, 'stroke-linejoin': 'round'}),
  ];
  const dw2 = sw / 2 - 6, dh2 = sh / 2 - 6;
  const mw2 = sw / 2, mh2 = sh / 2;
  const top = [q(-mw2, mh2, T1), q(mw2, mh2, T1), q(mw2, -mh2, T1), q(-mw2, -mh2, T1)];
  const nr = sh * 0.24;
  const neckTop = T1 + 26;
  const kr = sh * 0.42;
  const kTop = neckTop + 22;
  const ell = (lvl, rx) => ({cx: 0, cy: r(-lvl), rx: r(rx), ry: r(rx * 0.5)});
  const plate = [q(-mw2 + 10, mh2 - 8, T1), q(-mw2 + 10 + sw * 0.22, mh2 - 8, T1), q(-mw2 + 10 + sw * 0.22, -mh2 + 8, T1), q(-mw2 + 10, -mh2 + 8, T1)];
  const node = g({name},
    g({name: `${name}-clean`}, band(dw2, dh2, 0, T0, rubber, shade(rubber, -0.15))),
    g({name: `${name}-inked`, opacity: 0}, band(dw2, dh2, 0, T0, ink, shade(ink, -0.2))),
    band(mw2, mh2, T0, T1, shade(wood, -0.28), shade(wood, -0.15)),
    poly(top, {fill: shade(wood, 0.15), stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}),
    poly(plate, {fill: '#fbf7ee', stroke: th.ink, 'stroke-width': 1.5}),
    h('path', {d: `M${r(q(-mw2 + 16, 0, T1).x)} ${r(q(-mw2 + 16, 0, T1).y)}l${r(sw * 0.12)} 0`, stroke: ink, 'stroke-width': 3, 'stroke-linecap': 'round'}),
    // neck
    h('ellipse', {...ell(T1, nr), fill: shade(knob, -0.2), stroke: th.ink, 'stroke-width': 2}),
    h('rect', {x: r(-nr), y: r(-neckTop), width: r(nr * 2), height: r(neckTop - T1), fill: shade(knob, 0.1), stroke: 'none'}),
    h('path', {d: `M${r(-nr)} ${r(-T1)}V${r(-neckTop)}M${r(nr)} ${r(-T1)}V${r(-neckTop)}`, stroke: th.ink, 'stroke-width': 2}),
    // knob
    h('ellipse', {cx: 0, cy: r(-neckTop - 4), rx: r(kr), ry: r(kr * 0.62), fill: knob, stroke: th.ink, 'stroke-width': th.stroke}),
    h('ellipse', {cx: 0, cy: r(-kTop), rx: r(kr * 0.9), ry: r(kr * 0.45), fill: shade(knob, 0.28), stroke: th.ink, 'stroke-width': 2}),
    h('ellipse', {cx: r(-kr * 0.3), cy: r(-kTop - 2), rx: r(kr * 0.22), ry: r(kr * 0.1), fill: '#fff', opacity: 0.4}),
  );
  const left = q(-mw2, mh2, (T0 + T1) / 2);
  const right = q(mw2, -mh2, (T0 + T1) / 2);
  const bottom = {x: 0, y: OBL.D * dh2 + 8};
  const xs = [q(-mw2, mh2, 0).x, q(mw2, -mh2, 0).x], y0 = -kTop - kr * 0.45, y1 = OBL.D * mh2;
  return {
    node,
    ports: {left: {x: left.x - 8, y: left.y}, right: {x: right.x + 8, y: right.y}, bottom, top: {x: 0, y: y0 - 8}},
    top: y0,
    box: {x: Math.min(...xs), y: y0, w: Math.max(...xs) - Math.min(...xs), h: y1 - y0},
    footprint: {sw, sh},
  };
}

/**
 * Port-anchored connector graph. Each element supplies named ports (points on
 * its real outline, screen coordinates); each relationship uses the closest
 * pair of ports, so every connector starts and ends on its element. Plain
 * relations keep dots and no arrowhead (see primitives/annotate LINK_STYLES).
 * @param {any} ctx
 * @param {{name:string, elements:Record<string,{ports:Record<string,{x:number,y:number}>, center:{x:number,y:number}, box:{x:number,y:number,w:number,h:number}}>, relationships:Array<{from:string,to:string,kind:string,label?:string}>, relationLabels:Record<string,string>, obstacles?:any[], bounds?:any, chipSize?:number, chipMax?:number, bend?:(rel:any)=>number, portPrefs?:Record<string,[string,string]>, labelSide?:(rel:any)=>number, controls?:(rel:any, from:any, to:any)=>any, leaderAvoid?:Array<{x:number,y:number,w:number,h:number}>}} o
 */
export function portGraph(ctx, o) {
  // Elements collide with labels through their real convex hull when supplied.
  const hulls = Object.entries(o.elements).filter(([id]) => !(o.labelIgnore || []).includes(id)).map(([, e]) => e.hull || rectPoly(e.box));
  const labelBoxes = (o.obstacles || []).map(b => (Array.isArray(b) ? b : rectPoly(b)));
  const obstacles = [...hulls, ...labelBoxes];
  const placed = [];
  const {pairs, shapeOf} = connectorShapes(o);
  const samples = [];
  const pre = o.relationships.map((rel, i) => connector(ctx, {name: `${o.name}-probe${i}`, ...shapeOf(rel, i)}));
  pre.forEach((c, i) => { for (let k = 0; k <= 24; k++) samples.push({...c.at(k / 24), i}); });
  const conns = o.relationships.map((rel, i) => {
    const best = pairs[i];
    const c = connector(ctx, {name: `${o.name}-c${i}`, ...shapeOf(rel, i), color: kindColor(ctx, rel.kind)});
    const text = rel.label || o.relationLabels[rel.kind] || rel.kind;
    const size = o.chipSize ?? 28;
    let lab = null, leader = null;
    if (ctx.show('all')) {
      const dx = c.to.x - c.from.x, dy = c.to.y - c.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len;
      // balanced lines: a caption that wraps never leaves a one-word orphan
      const mw = balancedWidth(ctx, text, o.chipMax ?? 280, size, 2);
      const make = (ox, oy, at = c.mid) => chip(ctx, text, {x: at.x + ox, y: at.y - size * 0.95 + oy, anchor: 'middle', maxWidth: mw, size, maxLines: 2, fill: ctx.theme.card, stroke: kindColor(ctx, rel.kind), name: `${o.name}-l${i}`, weight: 600});
      const Bd = o.bounds;
      const inside = b => !Bd || (b.x >= Bd.x && b.y >= Bd.y && b.x + b.w <= Bd.x + Bd.w && b.y + b.h <= Bd.y + Bd.h);
      const others = samples.filter(sm => sm.i !== i);
      const hitsLine = b => others.some(sm => sm.x > b.x - 6 && sm.x < b.x + b.w + 6 && sm.y > b.y - 6 && sm.y < b.y + b.h + 6);
      const clear = b => inside(b) && !obstacles.some(q => polyHitsRect(q, b, 6)) && !placed.some(q => overlaps(b, q, 8)) && !hitsLine(b);
      // a label moved off its line keeps a dotted leader: the leader must not run through another label
      const avoid = [...(o.leaderAvoid || []), ...placed];
      const leaderHits = (at, b) => {
        let n = 0;
        for (const q of avoid) {
          for (let k = 0; k <= 24; k++) {
            const x = at.x + (b.cx - at.x) * (k / 24), y = at.y + (b.cy - at.y) * (k / 24);
            if (x > b.x - 2 && x < b.x + b.w + 2 && y > b.y - 2 && y < b.y + b.h + 2) continue;
            if (x > q.x - 3 && x < q.x + q.w + 3 && y > q.y - 3 && y < q.y + q.h + 3) { n++; break; }
          }
        }
        return n;
      };
      const side = o.labelSide ? o.labelSide(rel) : 1;
      lab = make(0, 0);
      if (!clear(lab.box)) {
        // 2-D search: points along the connector × offsets across it (preferred side first)
        let found = null;
        let least = null;
        // penalty when nothing is fully clear: covering another label is worst
        const penalty = (b, d, at) => (inside(b) ? 0 : 1000)
          + 10 * (labelBoxes.filter(q => polyHitsRect(q, b, 2)).length + placed.filter(q => overlaps(b, q, 2)).length + (at ? leaderHits(at, b) : 0))
          + 3 * hulls.filter(q => polyHitsRect(q, b, 2)).length + (hitsLine(b) ? 1 : 0) + d / 400;
        for (let d = 24; d <= 460 && !found; d += 16) {
          for (const tt of [0.5, 0.35, 0.65, 0.2, 0.8]) {
            const at = c.at(tt);
            for (const sgn of [side, -side]) {
              const cand = make(px * d * sgn, py * d * sgn, at);
              if (clear(cand.box) && !leaderHits(at, cand.box)) { found = {cand, at}; break; }
              const pen = penalty(cand.box, d, at);
              if (!least || pen < least.pen) least = {cand, at, pen};
            }
            if (found) break;
          }
        }
        if (!found && least && least.pen < penalty(lab.box, 0)) found = least;
        if (found) {
          lab = found.cand;
          leader = {x1: r(found.at.x), y1: r(found.at.y), x2: r(lab.box.cx), y2: r(lab.box.cy)};
        }
      }
      placed.push(lab.box);
    }
    return {rel, c, lab, leader, ports: [best.pa, best.pb]};
  });
  const labels = conns.map((x, i) => x.lab && g({name: `${o.name}-lg${i}`, opacity: 0},
    x.leader ? h('line', {...x.leader, stroke: kindColor(ctx, x.rel.kind), 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null,
    x.lab.node));
  const node = g({name: o.name}, conns.map(x => x.c.node));
  const labelsNode = g({name: `${o.name}-labels`}, labels);

  function frame(progressOf) {
    const out = {};
    conns.forEach((x, i) => {
      const p = progressOf(i);
      Object.assign(out, x.c.frame(p, p > 0 ? 1 : 0));
      if (x.lab) out[`${o.name}-lg${i}`] = {opacity: r(Math.min(1, Math.max(0, (p - 0.55) / 0.45)), 3)};
    });
    return out;
  }

  /** Tracer route through element ids along connectors (straight hop when unlinked). */
  function route(order) {
    const list = [];
    const visits = [];
    const push = p => list.push({x: p.x, y: p.y});
    order.forEach((id, i) => {
      const e = o.elements[id];
      if (!e) return;
      if (i === 0 || !list.length) {
        push(e.center);
        visits.push({id, idx: list.length - 1});
        return;
      }
      const prev = order[i - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      if (link) {
        const fwd = link.rel.from === prev;
        push(fwd ? link.c.from : link.c.to);
        for (let k = 1; k <= 30; k++) push(link.c.at(fwd ? k / 30 : 1 - k / 30));
      }
      push(e.center);
      visits.push({id, idx: list.length - 1});
    });
    const pl = polyline(list);
    const cum = [0];
    for (let i = 1; i < list.length; i++) cum.push(cum[i - 1] + Math.hypot(list[i].x - list[i - 1].x, list[i].y - list[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    return {poly: pl, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
  }

  return {node, labelsNode, frame, route, conns, tracerNode: nm => tracer(ctx, nm)};
}

/**
 * Port pair and curve shape of every relationship. A port preference keyed
 * `from>to` also applies, mirrored, to the reverse relationship `to>from`, so
 * the direction an author gives a link never changes where it attaches.
 */
function connectorShapes(o) {
  const pairs = o.relationships.map(rel => {
    const A = o.elements[rel.from], B = o.elements[rel.to];
    if (!A || !B) throw new Error(`Relationship ${rel.from}→${rel.to} references an unknown element`);
    return pickPorts(A, B, prefFor(o.portPrefs, rel));
  });
  const shapeOf = (rel, i) => ({from: pairs[i].a, to: pairs[i].b, kind: rel.kind, bend: o.bend ? o.bend(rel) : 0.1, ...(o.controls ? o.controls(rel, pairs[i].a, pairs[i].b) || {} : {})});
  return {pairs, shapeOf};
}

/** Look up a keyed per-relationship value in either direction (`from>to`, else `to>from`). */
export function relKey(table, rel) {
  if (!table) return undefined;
  const fwd = table[`${rel.from}>${rel.to}`];
  return fwd !== undefined ? fwd : table[`${rel.to}>${rel.from}`];
}

function prefFor(prefs, rel) {
  if (!prefs) return undefined;
  const fwd = prefs[`${rel.from}>${rel.to}`];
  if (fwd) return fwd;
  const rev = prefs[`${rel.to}>${rel.from}`];
  return rev ? [rev[1], rev[0]] : undefined;
}

/**
 * Sample points along every connector the graph would draw (same ports and
 * curves as `portGraph`), so other annotations can be kept off the lines
 * before the graph itself is laid out.
 * @returns {Array<Array<{x:number,y:number}>>}
 */
export function connectorSamples(ctx, o, n = 40) {
  const {shapeOf} = connectorShapes(o);
  return o.relationships.map((rel, i) => {
    const c = connector(ctx, {name: `${o.name}-sample${i}`, ...shapeOf(rel, i)});
    return Array.from({length: n + 1}, (_, k) => c.at(k / n));
  });
}

/** Preferred port pair when supplied (and present), otherwise the closest pair. */
function pickPorts(A, B, pref) {
  if (pref && A.ports[pref[0]] && B.ports[pref[1]]) return {a: A.ports[pref[0]], b: B.ports[pref[1]], pa: pref[0], pb: pref[1]};
  let best = null;
  for (const [pa, a] of Object.entries(A.ports)) {
    for (const [pb, b] of Object.entries(B.ports)) {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (!best || d < best.d) best = {a, b, d, pa, pb};
    }
  }
  return best;
}

const rectPoly = b => [{x: b.x, y: b.y}, {x: b.x + b.w, y: b.y}, {x: b.x + b.w, y: b.y + b.h}, {x: b.x, y: b.y + b.h}];

/** Separating-axis test between a convex polygon and a padded rectangle. */
export function polyHitsRect(polyPts, b, pad = 0) {
  const R = rectPoly({x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2});
  const axesOf = list => list.map((v, i) => {
    const w = list[(i + 1) % list.length];
    return {x: -(w.y - v.y), y: w.x - v.x};
  });
  for (const ax of [...axesOf(polyPts), {x: 1, y: 0}, {x: 0, y: 1}]) {
    const pr = list => list.map(v => v.x * ax.x + v.y * ax.y);
    const a = pr(polyPts), c = pr(R);
    if (Math.max(...a) < Math.min(...c) || Math.max(...c) < Math.min(...a)) return false;
  }
  return true;
}

function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

export {sheet, inkMark, T};
