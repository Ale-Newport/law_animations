/**
 * LAW-0186 — Mediación entre partes · mechanism
 *
 * Storyboard (top-down seating plan, not a row of boxes):
 *  0.00–0.18  separate: the table outline appears; the three seats (bust
 *             badges on chairs) slide out from the table to their places and
 *             the agenda — here a turn-order card with two empty slots —
 *             slides out beside the mediator.
 *  0.18–0.43  relate: only the explicit relationships are drawn, one by one,
 *             anchored to the element edges and styled by kind
 *             (communication = dashed arrow, sequence = arrow, relation =
 *             plain line with end dots, never an arrow).
 *  0.43–0.75  trace: the wooden turn token itself is the tracer. It follows
 *             `traversalOrder` along the connectors (circling each seat it
 *             passes). Each time it reaches a party, that party's small speech
 *             bubble opens (the previous one greys out) and the next empty
 *             slot of the turn-order card fills with that party. The focus
 *             element enlarges while the token passes it.
 *  0.75–1.00  gather: everything stays in place: filled order card, token
 *             resting with the current speaker, legend of connection kinds.
 * Only process states are shown (who has the floor, order of turns); no
 * outcome, no causal claim unless a relationship is supplied as causal.
 * @module animations/roles/LAW-0186
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, roundRectPath} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {shade} from '../../primitives/paper.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {mediationRolesFields, MEDIATION_DEFAULTS, roleOf} from './kits/mediation-fields.js';
import {wchip} from './kits/mediation-labels.js';
import {tokenTop, speechBubble} from './kits/mediation-props.js';

const ID = 'LAW-0186';
const DURATION = 7000;
const IDS = ['mediator', 'a', 'b', 'agenda'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const TRACE = [0.44, 0.74];

const sceneSchema = {
  ...mediationRolesFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  ...MEDIATION_DEFAULTS,
  elements: [
    {id: 'mediator', label: 'Mediator'},
    {id: 'a', label: 'Party A'},
    {id: 'b', label: 'Party B'},
    {id: 'agenda', label: 'Agenda: turn order'},
  ],
  relationships: [
    {from: 'mediator', to: 'a', kind: 'communication', label: 'gives the floor'},
    {from: 'mediator', to: 'b', kind: 'communication', label: 'gives the floor'},
    {from: 'a', to: 'b', kind: 'relation', label: 'speak via the mediator'},
    {from: 'mediator', to: 'agenda', kind: 'relation', label: 'follows'},
  ],
  focusElement: 'mediator',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['mediator', 'a', 'mediator', 'b'],
};

/** Hand-placed seating plans per shape (design units). */
const PLANS = {
  landscape: {
    size: [1900, 950], badge: 120,
    table: {x: 500, y: 435, w: 900, h: 400, r: 70}, abBend: 0.215, medBend: 0.16,
    mediator: [950, 226], a: [270, 632], b: [1630, 632],
    agenda: {x: 715, y: 478, w: 470, h: 230},
    bubbleA: {x: 110, y: 318, w: 230, h: 125, tail: [240, 505]},
    bubbleB: {x: 1560, y: 318, w: 230, h: 125, tail: [1660, 505]},
    legend: [950, 922], chairs: {mediator: 'top', a: 'left', b: 'right'},
  },
  square: {
    size: [1400, 1120], badge: 118,
    table: {x: 330, y: 505, w: 740, h: 440, r: 64}, abBend: 0.27, medBend: 0.16,
    mediator: [700, 232], a: [180, 715], b: [1220, 715],
    agenda: {x: 470, y: 530, w: 460, h: 240},
    bubbleA: {x: 60, y: 395, w: 215, h: 120, tail: [170, 585]},
    bubbleB: {x: 1125, y: 395, w: 215, h: 120, tail: [1230, 585]},
    legend: [700, 1092], chairs: {mediator: 'top', a: 'left', b: 'right'},
  },
  portrait: {
    size: [960, 1400], badge: 104,
    table: {x: 185, y: 800, w: 590, h: 400, r: 60}, abBend: 0.02, medBend: 0.07,
    mediator: [480, 618], a: [115, 1010], b: [845, 1010],
    agenda: {x: 165, y: 30, w: 630, h: 280}, agendaLabel: 'end',
    bubbleA: {x: 18, y: 726, w: 180, h: 110, tail: [108, 900]},
    bubbleB: {x: 762, y: 726, w: 180, h: 110, tail: [852, 900]},
    legend: [480, 1335], chairs: {mediator: 'top', a: 'left', b: 'right'},
  },
};

const scene = {
  sizes: {landscape: PLANS.landscape.size, square: PLANS.square.size, portrait: PLANS.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const Pl = PLANS[ctx.view.shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || roleOf(p, id);
    const at = id => ({x: Pl[id][0], y: Pl[id][1]});
    const R = Pl.badge;
    const looks = [0, 1, 2].map(i => actorLook(ctx, p.actors[i], i));
    const lookOf = id => looks[id === 'a' ? 0 : id === 'b' ? 1 : 2];

    // --- table (top-down) and chairs
    const tb = Pl.table;
    const tableCenter = {x: tb.x + tb.w / 2, y: tb.y + tb.h / 2};
    const tableNode = g({name: 'table'},
      h('path', {d: roundRectPath(tb.x + 10, tb.y + 14, tb.w, tb.h, tb.r), fill: th.shadow}),
      h('path', {d: roundRectPath(tb.x, tb.y, tb.w, tb.h, tb.r), fill: th.woodTop, stroke: th.ink, 'stroke-width': th.stroke * 1.2}),
      h('path', {d: roundRectPath(tb.x + 18, tb.y + 18, tb.w - 36, tb.h - 36, tb.r * 0.7), fill: 'none', stroke: shade(th.woodTop, -0.12), 'stroke-width': 3}),
      [0, 1, 2].map(i => {
        const vertical = tb.h > tb.w;
        const f = (i + 1) / 4;
        return vertical
          ? h('path', {d: `M${r(tb.x + tb.w * f)} ${r(tb.y + 30)}C${r(tb.x + tb.w * f - 8)} ${r(tb.y + tb.h * 0.4)} ${r(tb.x + tb.w * f + 8)} ${r(tb.y + tb.h * 0.6)} ${r(tb.x + tb.w * f)} ${r(tb.y + tb.h - 30)}`, fill: 'none', stroke: shade(th.woodTop, -0.08), 'stroke-width': 2, opacity: 0.7})
          : h('path', {d: `M${r(tb.x + 30)} ${r(tb.y + tb.h * f)}C${r(tb.x + tb.w * 0.4)} ${r(tb.y + tb.h * f - 8)} ${r(tb.x + tb.w * 0.6)} ${r(tb.y + tb.h * f + 8)} ${r(tb.x + tb.w - 30)} ${r(tb.y + tb.h * f)}`, fill: 'none', stroke: shade(th.woodTop, -0.08), 'stroke-width': 2, opacity: 0.7});
      }),
    );
    const chairOf = (id) => {
      const c = at(id);
      const side = Pl.chairs[id];
      const cw = R * 1.7, chh = R * 1.55;
      const off = R * 0.45;
      const dx = side === 'left' ? -off : side === 'right' ? off : 0;
      const dy = side === 'top' ? -off : 0;
      const back = side === 'left' ? {x: c.x + dx - cw / 2, y: c.y - chh / 2, w: R * 0.34, h: chh}
        : side === 'right' ? {x: c.x + dx + cw / 2 - R * 0.34, y: c.y - chh / 2, w: R * 0.34, h: chh}
          : {x: c.x - chh / 2, y: c.y + dy - cw / 2, w: chh, h: R * 0.34};
      const seat = side === 'top' ? {x: c.x - chh / 2, y: c.y + dy - cw / 2, w: chh, h: cw} : {x: c.x + dx - cw / 2, y: c.y - chh / 2, w: cw, h: chh};
      return g(null,
        h('path', {d: roundRectPath(seat.x, seat.y, seat.w, seat.h, 22), fill: '#7d6857', stroke: th.ink, 'stroke-width': 2.5}),
        h('path', {d: roundRectPath(back.x, back.y, back.w, back.h, 12), fill: '#5d4c40', stroke: th.ink, 'stroke-width': 2.5}));
    };

    // --- seats: bust badges (labels as chips under them)
    const badges = {};
    for (const id of ['mediator', 'a', 'b']) {
      const c = at(id);
      badges[id] = personBadge(ctx, {name: `el-${id}`, x: c.x, y: c.y, radius: R, look: lookOf(id), label: id === 'mediator' ? '' : label(id), labelMax: 340, ring: id === p.focusElement ? th.accent : null});
    }
    // the mediator's name sits at the badge's upper right, clear of the connector to the agenda
    const medC = at('mediator');
    const medLabel = ctx.show('key') ? wchip(ctx, label('mediator'), {x: medC.x + R * 0.78, y: medC.y - R * 1.02, maxWidth: Math.min(360, S.w - (medC.x + R * 0.78) - 10), size: 28, maxLines: 2, name: 'lab-mediator'}) : null;
    const chairs = Object.fromEntries(['mediator', 'a', 'b'].map(id => [id, g({name: `chair-${id}`}, chairOf(id))]));

    // --- agenda: turn-order card with two slots that fill
    const ag = Pl.agenda;
    const card = orderCard(ctx, {x: ag.x, y: ag.y, w: ag.w, h: ag.h, title: p.props.agendaTitle, items: p.props.agendaItems, looks, actors: p.actors});
    const agLabel = ctx.show('key') ? (Pl.agendaLabel === 'end'
      ? wchip(ctx, label('agenda'), {x: ag.x + ag.w, y: ag.y + ag.h + 12, anchor: 'end', maxWidth: ag.w * 0.46, size: 28, maxLines: 2, name: 'lab-agenda'})
      : wchip(ctx, label('agenda'), {x: ag.x + ag.w / 2, y: ag.y + ag.h + 14, anchor: 'middle', maxWidth: Math.min(Math.max(ag.w + 120, 360), tb.w - 40), size: 28, maxLines: 2, name: 'lab-agenda'})) : null;

    // --- small speech bubbles by the parties
    const bub = id => {
      const b = Pl[id === 'a' ? 'bubbleA' : 'bubbleB'];
      return speechBubble(ctx, {name: `bub-${id}`, box: {x: b.x, y: b.y, w: b.w, h: b.h}, tail: {x: b.tail[0], y: b.tail[1]}, tailSide: b.tailSide, showText: false, stroke: shade(lookOf(id).outfit, -0.3), lines: 2});
    };
    const bubbles = {a: bub('a'), b: bub('b')};

    // --- relationships (edge-anchored, styled by kind)
    const elements = {
      mediator: {circle: badges.mediator.circle},
      a: {circle: badges.a.circle},
      b: {circle: badges.b.circle},
      agenda: {box: {x: ag.x, y: ag.y, w: ag.w, h: ag.h}},
    };
    // lines from the shared graph helper; labels placed here so that labels of
    // short connectors sit beside the line instead of over the seats
    const graph = relationGraph({...ctx, show: () => false}, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels,
      bend: rel => {
        const ab = (rel.from === 'a' && rel.to === 'b') || (rel.from === 'b' && rel.to === 'a');
        if (ab) return (rel.from === 'a' ? 1 : -1) * Pl.abBend;
        if (rel.to === 'agenda' || rel.from === 'agenda') return 0;
        const toA = rel.to === 'a' || rel.from === 'a';
        const out = rel.from === 'mediator' ? 1 : -1;
        // arcs bulge outward, leaving the middle (agenda link) free
        return (toA ? Pl.medBend : -Pl.medBend) * out;
      }});

    // Relation labels sit BESIDE their connector (never on it): the token
    // travels along the connectors, so every label keeps a margin of more than
    // the token's radius from all connectors, and stays clear of the seats,
    // their labels, the order card, the bubbles and the legend. A short dashed
    // leader ties a label to its connector when it had to move away.
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = ctx.show('all') ? legendNode(ctx, kinds, p.relationLabels, at('legend'), S.w - 40) : null;
    const TOKEN_R = 36;
    const circleBox = (c, pad = 0) => ({x: c.x - c.r - pad, y: c.y - c.r - pad, w: (c.r + pad) * 2, h: (c.r + pad) * 2});
    const obstacles = [
      ...['mediator', 'a', 'b'].map(id => circleBox(badges[id].circle, 6)),
      ...['a', 'b'].map(id => badges[id].labelBox).filter(Boolean),
      medLabel && medLabel.box, agLabel && agLabel.box, card.box,
      bubbles.a.box, bubbles.b.box,
      legend && legend.box,
    ].filter(Boolean);
    const connPts = graph.conns.map(x => {
      const n = Math.max(24, Math.ceil(x.c.total / 6));
      return Array.from({length: n + 1}, (_, k) => x.c.at(k / n));
    });
    // the token's full route (connectors + arcs around the elements it passes)
    const route = tokenRoute(elements, graph.conns, p.traversalOrder, R);
    const nRoute = Math.max(40, Math.ceil(route.poly.total / 6));
    const routePts = Array.from({length: nRoute + 1}, (_, k2) => route.poly.at(k2 / nRoute));
    const nearRoute = (b, m) => routePts.some(q => q.x > b.x - m && q.x < b.x + b.w + m && q.y > b.y - m && q.y < b.y + b.h + m);
    const nearConn = (b, m, own = -1, ownM = m) => nearRoute(b, Math.min(m, ownM < 0 ? m : ownM)) || connPts.some((pts, j) => {
      const mm = j === own ? ownM : m;
      return mm >= 0 && pts.some(q => q.x > b.x - mm && q.x < b.x + b.w + mm && q.y > b.y - mm && q.y < b.y + b.h + mm);
    });
    // connectors the token travels along (consecutive ids of the traversal order)
    const traversed = new Set();
    for (let k = 1; k < p.traversalOrder.length; k++) {
      const a0 = p.traversalOrder[k - 1], b0 = p.traversalOrder[k];
      const j = graph.conns.findIndex(x => (x.rel.from === a0 && x.rel.to === b0) || (x.rel.from === b0 && x.rel.to === a0));
      if (j >= 0) traversed.add(j);
    }
    const bounds = {x: 8, y: 8, w: S.w - 16, h: S.h - 16};
    const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
    const placedBoxes = [];
    const placedLeaders = [];
    const leaderPts = (q, b) => {
      const ex = Math.max(b.x, Math.min(q.x, b.x + b.w)), ey = Math.max(b.y, Math.min(q.y, b.y + b.h));
      const len = Math.hypot(ex - q.x, ey - q.y);
      if (len <= 10) return [];
      return Array.from({length: Math.ceil(len / 6)}, (_, k) => {
        const f = Math.min(1, ((k + 1) * 6) / len);
        return {x: q.x + (ex - q.x) * f, y: q.y + (ey - q.y) * f};
      });
    };
    // a leader (connector point → nearest chip edge) must not cross another
    // connector (unless `cross`), another label's leader or another label
    const leaderBad = (pts, own, cross) => pts.some(sp =>
      (!cross && connPts.some((cp, j) => j !== own && cp.some(c => Math.hypot(c.x - sp.x, c.y - sp.y) < 10)))
      || placedLeaders.some(lp => lp.some(c => Math.hypot(c.x - sp.x, c.y - sp.y) < 12))
      || placedBoxes.some(b => sp.x > b.x - 4 && sp.x < b.x + b.w + 4 && sp.y > b.y - 4 && sp.y < b.y + b.h + 4));
    const boxOnLeader = b => placedLeaders.some(lp => lp.some(c => c.x > b.x - 8 && c.x < b.x + b.w + 8 && c.y > b.y - 8 && c.y < b.y + b.h + 8));
    // longest connectors first: they get clean spots at full size; a short
    // connector squeezed between others takes the remaining room
    const orderIdx = graph.conns.map((x, i) => i).sort((a, b) => graph.conns[b].c.total - graph.conns[a].c.total);
    const relLabels = [];
    if (ctx.show('all')) for (const i of orderIdx) {
      const x = graph.conns[i];
      const text = x.rel.label || p.relationLabels[x.rel.kind] || x.rel.kind;
      const color = kindColor(ctx, x.rel.kind);
      const mk = (q, size, mw = 270) => {
        const probe = wchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size, minSize: size * 0.85, maxLines: 2});
        return wchip(ctx, text, {x: q.x, y: q.y - probe.box.h / 2, anchor: 'middle', maxWidth: mw, size, minSize: size * 0.85, maxLines: 2, fill: th.card, stroke: color, weight: 600});
      };
      const ok = (b, margin, ownM) => inside(b) && !nearConn(b, margin, i, ownM) && !obstacles.some(q => labelsOverlap(b, q, 8)) && !placedBoxes.some(q => labelsOverlap(b, q, 10)) && !boxOnLeader(b);
      let found = null;
      const ts = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82];
      // Preference: beside the line at full size, then smaller / narrower (two
      // lines); a connector the token never travels may carry its label ON the
      // line; leaders crossing another connector and a tighter margin to the
      // token path are accepted only as later fallbacks.
      const M = TOKEN_R + 8;
      const tiers = [[26, M, false, 270, M], [22, M, false, 270, M], [22, M, false, 150, M]];
      if (!traversed.has(i)) tiers.push([26, M, false, 270, -1], [22, M, false, 270, -1], [22, M, false, 150, -1]);
      tiers.push([26, M, true, 270, M], [22, M, true, 270, M], [22, TOKEN_R - 6, true, 150, TOKEN_R - 6]);
      for (const [size, margin, cross, mw, ownM] of tiers) {
        for (let d = 0; d <= 320 && !found; d += 8) {
          for (const t of ts) {
            const q = x.c.at(t);
            const q0 = x.c.at(Math.max(0, t - 0.02)), q1 = x.c.at(Math.min(1, t + 0.02));
            const len = Math.hypot(q1.x - q0.x, q1.y - q0.y) || 1;
            const n = {x: -(q1.y - q0.y) / len, y: (q1.x - q0.x) / len};
            for (const sgn of [1, -1]) {
              const cand = mk({x: q.x + n.x * d * sgn, y: q.y + n.y * d * sgn}, size, mw);
              if (!cand.fit.truncated && ok(cand.box, margin, ownM) && !leaderBad(leaderPts(q, cand.box), i, cross)) { found = {chip: cand, q}; break; }
            }
            if (found) break;
          }
        }
        if (found) break;
      }
      if (!found) {
        // last resort: the candidate with the least overlap with other labels/elements
        const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
        let best = Infinity;
        for (let d = 0; d <= 200; d += 10) {
          for (const t of ts) {
            const q = x.c.at(t);
            const q0 = x.c.at(Math.max(0, t - 0.02)), q1 = x.c.at(Math.min(1, t + 0.02));
            const len = Math.hypot(q1.x - q0.x, q1.y - q0.y) || 1;
            for (const sgn of [1, -1]) {
              const cand = mk({x: q.x - ((q1.y - q0.y) / len) * d * sgn, y: q.y + ((q1.x - q0.x) / len) * d * sgn}, 22);
              if (cand.fit.truncated || !inside(cand.box)) continue;
              const score = [...obstacles, ...placedBoxes].reduce((acc, o) => acc + area(cand.box, o), 0) + d * 0.5;
              if (score < best) { best = score; found = {chip: cand, q}; }
            }
          }
        }
        if (!found) found = {chip: mk(x.c.mid, 22), q: x.c.mid};
      }
      const b = found.chip.box;
      placedBoxes.push(b);
      placedLeaders.push(leaderPts(found.q, b));
      // leader from the connector to the nearest chip edge
      const ex = Math.max(b.x, Math.min(found.q.x, b.x + b.w)), ey = Math.max(b.y, Math.min(found.q.y, b.y + b.h));
      const gap = Math.hypot(ex - found.q.x, ey - found.q.y);
      const leader = gap > 10 ? h('line', {x1: r(found.q.x), y1: r(found.q.y), x2: r(ex), y2: r(ey), stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}) : null;
      const dot = gap > 10 ? h('circle', {cx: r(found.q.x), cy: r(found.q.y), r: 5, fill: color}) : null;
      relLabels[i] = {node: g({name: `rlab${i}`, opacity: 0}, leader, dot, found.chip.node), box: b};
    }

    // --- token route: along connectors, circling each element it passes
    const token = tokenTop(ctx, {name: 'token', radius: 36});
    // smallest gap between the token disc (anywhere on its route) and a relation label
    let labelClearance = Infinity;
    for (let k2 = 0; k2 <= 400; k2++) {
      const q = route.poly.at(k2 / 400);
      for (const lb of relLabels) {
        if (!lb) continue;
        const b = lb.box;
        const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
        labelClearance = Math.min(labelClearance, Math.hypot(dx, dy) - TOKEN_R);
      }
    }

    return {S, s, ox, oy, tableNode, tableCenter, chairs, badges, medLabel, card, agLabel, bubbles, graph, relLabels, route, token, legend, at, labelClearance};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.tableNode,
      Object.values(L.chairs),
      L.graph.node,
      g({name: 'el-agenda'}, L.card.node, L.agLabel && L.agLabel.node),
      L.badges.mediator.node, L.badges.a.node, L.badges.b.node,
      L.medLabel && g({name: 'lab-mediator-g'}, L.medLabel.node),
      L.relLabels.map(c => c.node),
      L.bubbles.a.node, L.bubbles.b.node,
      L.token,
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate: table fades in; seats slide out from the table centre; agenda slides out of the mediator's seat
    nodes.table = {opacity: r(seg(u, 0, 0.06), 3)};
    for (const id of ['mediator', 'a', 'b']) {
      const c = L.at(id);
      const k = ease.inOutCubic(seg(u, 0.02, 0.15));
      const from = {x: lerp(L.tableCenter.x, c.x, 0.35), y: lerp(L.tableCenter.y, c.y, 0.35)};
      const pos = {x: lerp(from.x, c.x, k), y: lerp(from.y, c.y, k)};
      nodes[`el-${id}`] = {transform: T(pos.x, pos.y), opacity: r(seg(u, 0.02, 0.07), 3)};
      nodes[`chair-${id}`] = {transform: T(pos.x - c.x, pos.y - c.y), opacity: r(seg(u, 0.02, 0.07), 3)};
      if (id === 'mediator' && L.medLabel) nodes['lab-mediator-g'] = {transform: T(pos.x - c.x, pos.y - c.y), opacity: r(seg(u, 0.02, 0.07), 3)};
    }
    const agK = ease.inOutCubic(seg(u, 0.08, 0.18));
    const med = L.at('mediator');
    const agC = {x: L.card.box.x + L.card.box.w / 2, y: L.card.box.y + L.card.box.h / 2};
    nodes['el-agenda'] = {transform: `${T((med.x - agC.x) * (1 - agK), (med.y - agC.y) * (1 - agK))} ${scaleAbout(agC.x, agC.y, lerp(0.4, 1, agK))}`, opacity: r(seg(u, 0.08, 0.12), 3)};
    // 2) relate: explicit relationships drawn one by one
    const n = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.24) / n, 0.18 + ((i + 1) * 0.24) / n));
    Object.assign(nodes, L.graph.frame(relP));
    L.relLabels.forEach((c, i) => { nodes[`rlab${i}`] = {opacity: r(clamp((relP(i) - 0.55) / 0.45), 3)}; });
    // 3) trace: the token follows the traversal order
    const tp = ease.inOutSine(seg(u, ...TRACE));
    const pos = L.route.poly.at(tp);
    const tokenOn = u >= TRACE[0] - 0.01;
    const appear = seg(u, TRACE[0] - 0.01, TRACE[0] + 0.02);
    nodes.token = {transform: T(pos.x, pos.y, 0, lerp(0.4, 1, appear)), opacity: r(appear, 3)};
    // visits reached so far (arc fraction), parties in order
    const reached = L.route.visits.filter(v => u >= TRACE[0] && tp >= v.t - 0.04);
    const partyVisits = reached.filter(v => v.id === 'a' || v.id === 'b');
    const slots = [null, null];
    const slotT = [0, 0];
    let k = 0;
    for (const v of partyVisits) {
      if (k > 1) break;
      if (k === 0 || slots[k - 1] !== v.id) {
        slots[k] = v.id;
        slotT[k] = v.t;
        k++;
      }
    }
    // fill animation completes as the token arrives
    const fillP = i => (slots[i] ? clamp((tp - slotT[i] + 0.04) / 0.04) : 0);
    Object.assign(nodes, L.card.frame(slots, [fillP(0), fillP(1)]));
    // speaking: the last party reached has the floor; earlier ones grey out
    const current = partyVisits.length ? partyVisits[partyVisits.length - 1] : null;
    // leaving a party (the token moves on) turns its bubble to "done"
    const vIdx = current ? L.route.visits.indexOf(current) : -1;
    const leftCurrent = Boolean(current) && vIdx < L.route.visits.length - 1 && tp > current.t + 0.03;
    for (const id of ['a', 'b']) {
      const visited = partyVisits.find(v => v.id === id);
      const isCurrent = current && current.id === id && !leftCurrent;
      const open = visited ? clamp((tp - visited.t + 0.04) / 0.04) : 0;
      Object.assign(nodes, L.bubbles[id].frame(open, isCurrent ? clamp((tp - current.t + 0.04) / 0.08) : open, reduced));
      nodes[`bub-${id}`].opacity = r(open * (isCurrent ? 1 : 0.45), 3);
    }
    // focus element enlarges while the token passes it
    let focusScale = 1;
    for (const id of IDS) {
      const passes = L.route.visits.filter(v => v.id === id);
      let pulse = 0;
      if (u >= TRACE[0] && u <= TRACE[1] + 0.02) for (const v of passes) pulse = Math.max(pulse, clamp(1 - Math.abs(tp - v.t) / 0.07));
      const amt = id === p.focusElement ? (reduced ? 0.1 : 0.2) : 0.06;
      const sc = 1 + amt * ease.inOutSine(pulse);
      if (id === p.focusElement) focusScale = sc;
      if (id === 'agenda') nodes['card-body'] = {transform: scaleAbout(agC.x, agC.y, sc)};
      else nodes[`el-${id}-body`] = {transform: scaleAbout(0, 0, sc)};
    }
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        tracer: P2(pos),
        tracerVisible: tokenOn,
        traceProgress: r(tp, 3),
        visitOrder: L.route.visits.map(v => v.id),
        slots,
        floor: current && !leftCurrent ? current.id : null,
        focusScale: r(focusScale, 3),
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        arrows: L.graph.conns.map(c => ({kind: c.rel.kind, arrow: c.rel.kind !== 'relation' && c.rel.kind !== 'disputed'})),
        connectorGaps: L.route.gaps,
        // the token never passes over a relation label (px of clearance, design units)
        labelClearance: L.relLabels.length ? r(L.labelClearance, 1) : null,
      },
    };
  },
};

/**
 * Token route: follows the connector joining consecutive ids (either
 * direction); when the token passes through an element it circles along the
 * element's edge from the arriving connector end to the departing one.
 */
function tokenRoute(elements, conns, order, R) {
  const pts = [];
  const visits = [];
  const gaps = [];
  const center = e => (e.circle ? {x: e.circle.x, y: e.circle.y} : {x: e.box.x + e.box.w / 2, y: e.box.y + e.box.h / 2});
  const push = q => pts.push({x: q.x, y: q.y});
  const hops = [];
  for (let i = 1; i < order.length; i++) {
    const a = order[i - 1], b = order[i];
    if (!elements[a] || !elements[b] || a === b) continue;
    const link = conns.find(x => (x.rel.from === a && x.rel.to === b) || (x.rel.from === b && x.rel.to === a));
    const samples = [];
    if (link) {
      const fwd = link.rel.from === a;
      for (let k = 0; k <= 30; k++) samples.push(link.c.at(fwd ? k / 30 : 1 - k / 30));
      // connector end distance from the element edge (anchoring check)
      const endEl = elements[b];
      const endPt = samples[samples.length - 1];
      gaps.push(r(edgeGap(endEl, endPt), 1));
    } else {
      const ca = center(elements[a]), cb = center(elements[b]);
      samples.push(ca, cb);
    }
    hops.push({a, b, samples});
  }
  if (!hops.length) {
    const e = elements[order[0]] || elements.mediator;
    push(center(e));
    push(center(e));
    return {poly: polyline(pts), visits: [{id: order[0], t: 0}], gaps};
  }
  // start: at the first connector's start point
  push(hops[0].samples[0]);
  visits.push({id: hops[0].a, idx: 0});
  hops.forEach((hop, i) => {
    hop.samples.forEach((q, k) => { if (k) push(q); });
    visits.push({id: hop.b, idx: pts.length - 1});
    const next = hops[i + 1];
    if (next) {
      // circle around the element from arrival point to the next departure point
      const e = elements[hop.b];
      const from = hop.samples[hop.samples.length - 1];
      const to = next.samples[0];
      if (e.circle) {
        const c = e.circle;
        const a0 = Math.atan2(from.y - c.y, from.x - c.x);
        let a1 = Math.atan2(to.y - c.y, to.x - c.x);
        let d = a1 - a0;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const rr = Math.hypot(from.x - c.x, from.y - c.y);
        const steps = Math.max(2, Math.round(Math.abs(d) * 10));
        for (let k = 1; k <= steps; k++) push({x: c.x + Math.cos(a0 + (d * k) / steps) * rr, y: c.y + Math.sin(a0 + (d * k) / steps) * rr});
      } else {
        push(to);
      }
    }
  });
  const poly = polyline(pts);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  return {poly, visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total})), gaps};
}

/** Distance from a connector end to the element's edge (0 = touching). */
function edgeGap(e, q) {
  if (e.circle) return Math.abs(Math.hypot(q.x - e.circle.x, q.y - e.circle.y) - e.circle.r);
  const b = e.box;
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
  const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  return Math.hypot(dx, dy);
}

/**
 * Turn-order card (top-down agenda): header, two numbered slots that fill
 * with the party who received the floor, and plain rows for further items.
 */
function orderCard(ctx, o) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = o;
  const pad = w * 0.06;
  const parts = [];
  parts.push(h('path', {d: roundRectPath(x + 8, y + 10, w, hh, 10), fill: th.shadow}));
  parts.push(h('path', {d: `M${x + 4} ${y}H${x + w - 26}L${x + w} ${y + 26}V${y + hh - 4}Q${x + w} ${y + hh} ${x + w - 4} ${y + hh}H${x + 4}Q${x} ${y + hh} ${x} ${y + hh - 4}V${y + 4}Q${x} ${y} ${x + 4} ${y}Z`, fill: th.paper, stroke: th.ink, 'stroke-width': th.stroke, 'stroke-linejoin': 'round'}));
  parts.push(h('path', {d: `M${x + w - 26} ${y}V${y + 22}Q${x + w - 26} ${y + 26} ${x + w - 22} ${y + 26}H${x + w}Z`, fill: th.paperShade, stroke: th.ink, 'stroke-width': 2}));
  const titleSize = Math.min(34, hh * 0.13);
  if (ctx.show('all') && o.title) {
    const f = ctx.fit(o.title, {maxWidth: w - pad * 2 - 30, size: titleSize, minSize: titleSize * 0.7, maxLines: 1, weight: 800});
    parts.push(textBlock(f, {x: x + pad, y: y + pad * 0.7, fill: th.ink}));
  } else {
    parts.push(h('rect', {x: x + pad, y: y + pad * 0.8, width: w * 0.38, height: titleSize * 0.7, rx: 4, fill: th.ink, opacity: 0.85}));
  }
  const top = y + pad * 0.7 + titleSize * 1.5;
  parts.push(h('line', {x1: x + pad, x2: x + w - pad, y1: top, y2: top, stroke: th.paperLine, 'stroke-width': 2}));
  const extra = o.items.slice(2);
  const slotH = (hh - (top - y) - pad * 0.6 - extra.length * hh * 0.1) / 2;
  const slots = [0, 1].map(i => {
    const sy = top + pad * 0.35 + i * slotH;
    const bx = x + pad, bw = w - pad * 2, bh = slotH - pad * 0.45;
    const numR = bh * 0.3;
    const numC = {x: bx + numR + 4, y: sy + bh / 2};
    const discC = {x: numC.x + numR * 2.4 + bh * 0.3, y: sy + bh / 2};
    const discR = bh * 0.3;
    const textX = discC.x + discR + 14;
    const show = ctx.show('all');
    const variants = ['a', 'b'].map(id => {
      const look = o.looks[id === 'a' ? 0 : 1];
      const name = o.actors[id === 'a' ? 0 : 1].name;
      // the slot's own agenda row (rows 1–2 are the two turns), whoever fills it
      const item = o.items[i] || '';
      const f = show ? ctx.fit(name, {maxWidth: x + w - pad - textX, size: Math.min(30, bh * 0.36), minSize: 14, maxLines: 1, weight: 700}) : null;
      const f2 = show && item ? ctx.fit(item, {maxWidth: x + w - pad - textX, size: Math.min(22, bh * 0.26), minSize: 12, maxLines: 1, weight: 500}) : null;
      return g({name: `slot${i}-${id}`, opacity: 0},
        h('circle', {cx: discC.x, cy: discC.y, r: discR, fill: look.outfit, stroke: th.ink, 'stroke-width': 2.2}),
        show ? h('text', {x: discC.x, y: discC.y + discR * 0.4, 'text-anchor': 'middle', 'font-size': r(discR * 1.1), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, id.toUpperCase()) : h('circle', {cx: discC.x, cy: discC.y, r: discR * 0.35, fill: '#fff'}),
        f ? textBlock(f, {x: textX, y: sy + bh * 0.16, fill: th.ink}) : h('rect', {x: textX, y: sy + bh * 0.3, width: (x + w - pad - textX) * 0.7, height: bh * 0.16, rx: 4, fill: th.inkSoft}),
        f2 ? textBlock(f2, {x: textX, y: sy + bh * 0.16 + f.height + 6, fill: th.inkSoft}) : h('rect', {x: textX, y: sy + bh * 0.58, width: (x + w - pad - textX) * 0.5, height: bh * 0.12, rx: 4, fill: th.paperLine}),
      );
    });
    return {sy, bh, bx, bw, node: g(null,
      h('path', {name: `slot${i}-box`, d: roundRectPath(bx, sy, bw, bh, 10), fill: th.accent3Soft, stroke: th.accent3, 'stroke-width': 2.5, 'stroke-dasharray': '10 7'}),
      h('circle', {cx: numC.x, cy: numC.y, r: numR, fill: th.ink}),
      ctx.show('key') ? h('text', {x: numC.x, y: numC.y + numR * 0.42, 'text-anchor': 'middle', 'font-size': r(numR * 1.2), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, String(i + 1)) : h('rect', {x: numC.x - 2, y: numC.y - numR * 0.5, width: 4, height: numR, fill: '#fff'}),
      variants)};
  });
  const extraRows = extra.map((item, j) => {
    const ry = top + pad * 0.35 + slotH * 2 + j * hh * 0.1;
    const show = ctx.show('all');
    const f = show ? ctx.fit(item, {maxWidth: w - pad * 2 - 40, size: Math.min(22, hh * 0.075), minSize: 12, maxLines: 1, weight: 500}) : null;
    return g(null,
      h('rect', {x: x + pad + 4, y: ry + 4, width: 18, height: 18, rx: 3, fill: '#fff', stroke: th.ink, 'stroke-width': 2}),
      f ? textBlock(f, {x: x + pad + 34, y: ry + 2, fill: th.inkSoft}) : h('rect', {x: x + pad + 34, y: ry + 8, width: w * 0.5, height: 10, rx: 5, fill: th.paperLine}));
  });
  const node = g({name: 'card-body'}, parts, slots.map(sl => sl.node), extraRows);
  return {
    node,
    box: {x, y, w, h: hh},
    /** slots: party id per slot (or null); fill: 0..1 per slot */
    frame(ids, fill) {
      const out = {};
      [0, 1].forEach(i => {
        for (const id of ['a', 'b']) out[`slot${i}-${id}`] = {opacity: r(ids[i] === id ? fill[i] : 0, 3)};
        out[`slot${i}-box`] = {'stroke-dasharray': ids[i] && fill[i] >= 1 ? 'none' : '10 7', fill: ids[i] && fill[i] >= 1 ? ctx.theme.card : ctx.theme.accent3Soft};
      });
      return out;
    },
  };
}

function legendNode(ctx, kinds, labels, at, maxWidth) {
  const th = ctx.theme;
  const size = 30;
  const gap = 48;
  const items = kinds.map(k => {
    const fit = ctx.fit(labels[k] || k, {maxWidth: maxWidth - 80, size, minSize: 22, maxLines: 1, weight: 500});
    return {k, fit, w: 70 + fit.width};
  });
  // greedy rows so the legend never exceeds the stage width
  const rows = [[]];
  let rw = 0;
  for (const it of items) {
    if (rows[rows.length - 1].length && rw + gap + it.w > maxWidth) { rows.push([]); rw = 0; }
    rw += (rows[rows.length - 1].length ? gap : 0) + it.w;
    rows[rows.length - 1].push(it);
  }
  const lineH = 46;
  const parts = [];
  rows.forEach((row, ri) => {
    const total = row.reduce((a, it) => a + it.w, 0) + gap * (row.length - 1);
    let x = at.x - total / 2;
    const y = at.y - (rows.length - 1 - ri) * lineH;
    for (const it of row) {
      const color = kindColor(ctx, it.k);
      const dash = it.k === 'communication' ? '10 8' : null;
      const arrow = it.k !== 'relation';
      parts.push(g({transform: T(x, y)},
        h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
        arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
        h('circle', {cx: 0, cy: 0, r: arrow ? 0 : 5, fill: color}),
        textBlock(it.fit, {x: 66, y: -it.fit.size * 0.45, fill: th.fg})));
      x += it.w + gap;
    }
  });
  const wide = Math.max(...rows.map(row => row.reduce((a, it) => a + it.w, 0) + gap * (row.length - 1)));
  return {node: g({name: 'legend'}, parts), box: {x: at.x - wide / 2, y: at.y - (rows.length - 1) * lineH - size * 0.8, w: wide, h: (rows.length - 1) * lineH + size * 1.4}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-07-mechanism',
    title: 'Mediation between parties — seating plan and turn order',
    titleEs: 'Mediación entre partes — Mecanismo o relación explicada',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Mediación entre partes',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Top-down seating plan: mediator and two parties around a table, a turn-order card beside the mediator. Relationships are drawn by kind and anchored to the seats; the turn token follows the traversal order along them, opening each speaker’s bubble and filling the next slot of the order card.',
    tags: ['mediation', 'seating plan', 'turn order', 'token', 'communication', 'relations', 'tracer', 'agenda'],
    defaultDurationMs: DURATION,
    assets: ['src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-fields.js'],
  }),
  sceneSchema,
  defaultParams,
  scene,
});

function labelsOverlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
}
