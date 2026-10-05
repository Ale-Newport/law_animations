/**
 * Relation graph helper (for `mechanism` treatments): connectors anchored to
 * the real edges of element boxes/circles, relation labels by kind, and a
 * tracer path that follows the relationships in a supplied traversal order.
 * Relation kinds keep distinct styles; a plain relation never gets an arrow.
 * @module frameworks/graph
 */
import {h, g} from '../core/svg.js';
import {edgeAnchor, circleAnchor, polyline} from '../core/geometry.js';
import {connector, chip, tracer} from '../primitives/annotate.js';

const center = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
const anchor = (e, toward, pad = 8) => (e.circle ? circleAnchor(e.circle, e.circle.r + pad, toward) : edgeAnchor(e.box, toward, pad));

/**
 * @param {any} ctx
 * @param {{name:string, elements:Record<string,{box?:any,circle?:any}>, relationships:Array<{from:string,to:string,kind:string,label?:string}>, relationLabels:Record<string,string>, bend?:(rel:any,i:number)=>number, chipSize?:number, chipMax?:number, labelOffset?:number}} o
 */
export function relationGraph(ctx, o) {
  // Obstacles for label placement: element boxes (+ optional extra boxes such as element labels).
  const boxes = Object.values(o.elements).map(e => (e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: e.circle.r * 2, h: e.circle.r * 2} : e.box));
  const obstacles = [...boxes, ...(o.obstacles || [])];
  const placed = [];
  const conns = o.relationships.map((rel, i) => {
    const A = o.elements[rel.from], B = o.elements[rel.to];
    if (!A || !B) throw new Error(`Relationship ${rel.from}→${rel.to} references an unknown element`);
    const from = anchor(A, center(B));
    const to = anchor(B, center(A), rel.kind === 'relation' ? 8 : 14);
    const c = connector(ctx, {name: `${o.name}-c${i}`, from, to, kind: rel.kind, bend: o.bend ? o.bend(rel, i) : 0.12, color: kindColor(ctx, rel.kind)});
    const text = rel.label || o.relationLabels[rel.kind] || rel.kind;
    const size = o.chipSize ?? 24;
    let lab = null;
    let leader = null;
    if (ctx.show('all')) {
      // Try the connector midpoint, then positions pushed perpendicular to the
      // connector (both sides, increasing distance) until the chip is clear of
      // every element box and previously placed label.
      const dx = c.to.x - c.from.x, dy = c.to.y - c.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len;
      const make = (ox, oy) => chip(ctx, text, {x: c.mid.x + ox, y: c.mid.y - size * 0.95 + oy + (o.labelOffset ?? 0), anchor: 'middle', maxWidth: o.chipMax ?? 260, size, maxLines: 2, fill: ctx.theme.card, stroke: kindColor(ctx, rel.kind), name: `${o.name}-l${i}`, weight: 600});
      const B = o.bounds;
      const inside = b => !B || (b.x >= B.x && b.y >= B.y && b.x + b.w <= B.x + B.w && b.y + b.h <= B.y + B.h);
      const clear = b => inside(b) && !obstacles.some(q => overlaps(b, q, 6)) && !placed.some(q => overlaps(b, q, 6));
      lab = make(0, 0);
      if (!clear(lab.box)) {
        let found = null;
        for (let d = 30; d <= 420 && !found; d += 18) {
          for (const sgn of [-1, 1]) {
            const cand = make(px * d * sgn, py * d * sgn);
            if (clear(cand.box)) { found = cand; break; }
          }
        }
        // Graceful fallback: retry with a smaller, single-line chip before
        // giving up and leaving the label on the (overlapping) midpoint.
        if (!found) {
          const small = (ox, oy) => chip(ctx, text, {x: c.mid.x + ox, y: c.mid.y - size * 0.8 + oy, anchor: 'middle', maxWidth: (o.chipMax ?? 260) * 0.85, size: size * 0.8, minSize: size * 0.62, maxLines: 1, fill: ctx.theme.card, stroke: kindColor(ctx, rel.kind), name: `${o.name}-l${i}`, weight: 600});
          for (let d = 0; d <= 420 && !found; d += 18) {
            for (const sgn of d ? [-1, 1] : [1]) {
              const cand = small(px * d * sgn, py * d * sgn);
              if (clear(cand.box)) { found = cand; break; }
            }
          }
        }
        if (found) {
          lab = found;
          if (Math.hypot(lab.box.cx - c.mid.x, lab.box.cy - c.mid.y) > 24) leader = {x1: c.mid.x, y1: c.mid.y, x2: lab.box.cx, y2: lab.box.cy};
        }
      }
      placed.push(lab.box);
    }
    const labelClear = !lab || (!obstacles.some(q => overlaps(lab.box, q, 0)));
    return {rel, c, lab, leader, labelClear};
  });
  const labels = conns.map((x, i) => x.lab && g({name: `${o.name}-lg${i}`, opacity: 0},
    x.leader ? h('line', {...x.leader, stroke: kindColor(ctx, x.rel.kind), 'stroke-width': 2, 'stroke-dasharray': '3 5'}) : null,
    x.lab.node));
  // With separateLabels the scene draws `labelsNode` above the elements so a
  // label that could not be placed clear of them stays readable.
  const node = o.separateLabels ? g({name: o.name}, conns.map(x => x.c.node)) : g({name: o.name}, conns.map(x => x.c.node), labels);
  const labelsNode = o.separateLabels ? g({name: `${o.name}-labels`}, labels) : null;

  /**
   * Frame record for drawing progress per connector.
   * @param {(i:number)=>number} progressOf
   */
  function frame(progressOf) {
    const out = {};
    conns.forEach((x, i) => {
      const p = progressOf(i);
      Object.assign(out, x.c.frame(p, p > 0 ? 1 : 0));
      if (x.lab) out[`${o.name}-lg${i}`] = {opacity: Math.min(1, Math.max(0, (p - 0.55) / 0.45))};
    });
    return out;
  }

  /**
   * Tracer route through element ids: follows a connector (in either
   * direction) when one links consecutive ids, otherwise a straight hop.
   * @param {string[]} order
   */
  function route(order) {
    const pts = [];
    const visits = [];
    const push = p => pts.push({x: p.x, y: p.y});
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      const e = o.elements[id];
      if (!e) continue;
      if (i === 0) {
        push(center(e));
        visits.push({id, idx: 0});
        continue;
      }
      const prev = order[i - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      const pe = o.elements[prev];
      if (link) {
        const forward = link.rel.from === prev;
        const n = 30;
        push(forward ? link.c.from : link.c.to);
        for (let k = 1; k <= n; k++) push(link.c.at(forward ? k / n : 1 - k / n));
      } else if (pe) {
        push(anchor(pe, center(e)));
        push(anchor(e, center(pe)));
      }
      push(center(e));
      visits.push({id, idx: pts.length - 1});
    }
    const poly = polyline(pts);
    // arc-length fraction at which each element is reached
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    return {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
  }

  return {node, labelsNode, frame, conns, route, tracerNode: name => tracer(ctx, name)};
}

function overlaps(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Colour per relation kind (consistent across the library). */
export function kindColor(ctx, kind) {
  const th = ctx.theme;
  return kind === 'communication' ? th.accent2 : kind === 'sequence' ? th.fg : kind === 'causal' ? th.accent : th.fgSoft;
}
