/**
 * LAW-0441 — Oferta comunicada · story
 *
 * Storyboard (standing microscene, two parties apart):
 *  0.00–0.14  rest: the offeror (A) holds the open offer sheet up beside
 *             them; its terms are readable. The offeree (B) waits.
 *  0.14–0.28  A folds the sheet in three (bottom up, top down); the outer
 *             panel is printed as a mailer (addressee + postage square) and a
 *             seal is pressed on the free edge.
 *  0.28–0.39  anticipation (pull back) and send: the arm swings forward and
 *             releases the mailer at the end of the swing.
 *  0.39–0.56  the mailer travels along a dotted route (revealed behind it)
 *             while B looks up and raises a hand to the shared catch point;
 *             hand and mailer meet there at 0.56.
 *  0.56–0.73  B brings it to reading height, breaks the seal and unfolds
 *             it: the same terms are now open in front of B.
 *  0.73–1.00  hold: descriptive tags "Sent" / "Received", optional note
 *             from B and editorial callout. No acceptance or formation is
 *             shown or implied.
 * The same sheet object travels the whole way (no swap); it is placed from
 * A's solved hand, then the route, then B's solved hand.
 * @module animations/contract-formation/LAW-0441
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {str, obj, list, num, oneOf, annotation} from '../../schemas/fields.js';
import {statusTag, chip} from '../../primitives/annotate.js';
import {offerFields, responsesField} from './kits/offer-fields.js';
import {offerStage, speechBubble, noteCallout} from './kits/offer-letter.js';

const ID = 'LAW-0441';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  lookA: [0.27, 0.33], fold: [0.14, 0.25], seal: [0.25, 0.28], windup: [0.28, 0.34], launch: [0.34, 0.39],
  travel: [0.39, 0.56], returnA: [0.4, 0.5], lookUp: [0.4, 0.47], reach: [0.46, 0.56], bring: [0.56, 0.61],
  lookRead: [0.58, 0.64], open: [0.6, 0.64], unfold: [0.63, 0.73], tagSent: [0.74, 0.79], tagRec: [0.77, 0.82],
  bubble: [0.81, 0.87], note: [0.85, 0.93],
};
const ACTION_END = 0.8;
const IN_TRANSIT_STOP = 0.55;

const STRINGS = {
  en: {from: 'From', to: 'To', inTransit: 'In transit'},
  es: {from: 'De', to: 'Para', inTransit: 'En tránsito'},
};

const sceneSchema = {
  ...offerFields,
  ...responsesField,
  actorLabels: obj('Role captions shown under each party', {a: str('Caption for the offeror (A)', 50), b: str('Caption for the offeree (B)', 50)}),
  objectLabels: obj('Labels printed on props', {mailer: str('Small tag printed on the folded mailer face', 30)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['terms', 'mailer', 'route']), 0, 2),
  finalState: oneOf('State supplied for the final hold: opened (received and unfolded), delivered (received, still sealed) or in-transit (sent, not yet received). No legal effect is inferred', ['opened', 'delivered', 'in-transit']),
};

const defaultParams = {
  parties: [{name: 'Nadia Park', role: 'Party A'}, {name: 'Tomás Ribeiro', role: 'Party B'}],
  offer: {reference: 'OF-2041', title: 'Offer to supply'},
  terms: [
    {key: 'item', label: 'Item', value: 'Oak office chairs'},
    {key: 'delivery', label: 'Delivery', value: 'Day 10'},
    {key: 'quantity', label: 'Quantity', value: '40'},
    {key: 'unitPrice', label: 'Unit price (hypothetical)', value: '130'},
  ],
  responses: [{text: 'Received — reviewing the terms'}],
  actorLabels: {a: 'Offeror', b: 'Offeree'},
  objectLabels: {mailer: 'OFFER'},
  actionProgress: 1,
  annotations: [{target: 'terms', text: 'Same terms as written by Party A'}],
  finalState: 'opened',
};

function overlapArea(a, b, pad = 0) {
  const w = Math.min(a.x + a.w + pad, b.x + b.w + pad) - Math.max(a.x - pad, b.x - pad);
  const hh = Math.min(a.y + a.h + pad, b.y + b.h + pad) - Math.max(a.y - pad, b.y - pad);
  return w > 0 && hh > 0 ? w * hh : 0;
}

/** Status tag tied to a point by a short dotted leader from its nearest edge. */
function anchoredTag(ctx, text, o) {
  const t = statusTag(ctx, text, {x: o.x, y: o.y, anchor: o.anchor ?? 'middle', size: o.size, color: o.color});
  const b = t.box;
  const tg = o.target;
  const from = tg.y < b.y ? {x: clamp(tg.x, b.x + b.h / 2, b.x + b.w - b.h / 2), y: b.y}
    : tg.y > b.y + b.h ? {x: clamp(tg.x, b.x + b.h / 2, b.x + b.w - b.h / 2), y: b.y + b.h}
      : {x: tg.x < b.x ? b.x : b.x + b.w, y: b.cy};
  return {
    node: g({name: o.name, opacity: 0},
      h('line', {x1: r(from.x), y1: r(from.y), x2: r(tg.x), y2: r(tg.y), stroke: o.color, 'stroke-width': 2.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}),
      h('circle', {cx: r(tg.x), cy: r(tg.y), r: 6, fill: o.color, stroke: ctx.theme.card, 'stroke-width': 2}),
      t.node),
    box: b,
  };
}

/** Stage geometry per layout shape (design units; W from the actual design width). */
function geometry(shape, D) {
  const W = D.w, H = D.h;
  if (shape === 'portrait') {
    // stacked rooms: A above, B below (both face +x); the route loops down the right side
    return {k: 1.25, chipSize: 30, A: {x: W * 0.2, floor: 655, facing: 1}, B: {x: W * 0.2, floor: H - 70, facing: 1},
      // the loop stays a sheet-width inside the right edge, so a mailer stopped on it is never cut
      route: (a, b) => ({c1: {x: W * 0.86, y: a.y - 40}, c2: {x: W * 0.86, y: b.y - 120}})};
  }
  // row: a rounded arc whose control points reach slightly outward, so it reads as a lobbed route
  const arc = (top, out) => (a, b) => ({c1: {x: a.x - out, y: top}, c2: {x: b.x + out, y: top}});
  // square: large figures set wide apart so the mailer is lobbed across the gap toward B
  // (a low, wide arch rather than a tall hairpin)
  if (shape === 'square') {
    return {k: 1.5, chipSize: 34, A: {x: W * 0.06, floor: H - 84, facing: 1}, B: {x: W * 0.94, floor: H - 84, facing: -1},
      route: (a, b) => ({c1: {x: a.x + 40, y: Math.min(a.y, b.y) - 260}, c2: {x: b.x - 40, y: Math.min(a.y, b.y) - 260}})};
  }
  return {k: 1.35, chipSize: 30, A: {x: W * 0.14, floor: H - 88, facing: 1}, B: {x: W * 0.86, floor: H - 88, facing: -1}, route: arc(10, -40)};
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const G = geometry(shape, D);
    const k = G.k;
    const captions = [p.actorLabels.a, p.actorLabels.b].map((lab, i) => (lab ? `${p.parties[i].name} · ${lab}` : p.parties[i].name));
    // actor chips: one line when name + role fit; otherwise a wider two-line chip (the role is never
    // cut off) and the floors rise by the extra height so the chips stay inside the design space
    let chipMax = shape === 'portrait' ? D.w * 0.62 : shape === 'square' ? D.w * 0.42 : D.w * 0.3;
    let chipLines = 1;
    if (ctx.show('key') && captions.some(c => chip(ctx, c, {x: 0, y: 0, maxWidth: chipMax, size: G.chipSize, maxLines: 1}).fit.truncated)) {
      chipLines = 2;
      chipMax = shape === 'portrait' ? D.w * 0.7 : D.w * 0.44;
      const h1 = chip(ctx, 'Ag', {x: 0, y: 0, maxWidth: chipMax, size: G.chipSize, maxLines: 1}).box.h;
      const lift = Math.max(...captions.map(c => chip(ctx, c, {x: 0, y: 0, maxWidth: chipMax, size: G.chipSize, maxLines: 2}).box.h)) - h1;
      // 9:16: A's room rises further so B's note above B's head stays clear of A's taller chip
      G.A.floor -= lift + (shape === 'portrait' ? 44 : 0);
      G.B.floor -= lift;
    }
    const base = {
      prefix: 'st', A: G.A, B: G.B, k, parties: p.parties, offer: p.offer, terms: p.terms,
      mailerLabel: p.objectLabels.mailer, captions, chipSize: G.chipSize, chipMax, chipLines,
      sheetLabels: {from: ctx.t.from, to: ctx.t.to}, apexLift: G.apexLift, width: D.w, places: {},
    };
    // the route's control points depend on the solved hand geometry
    let stage = offerStage(ctx, base);
    if (G.route) stage = offerStage(ctx, {...base, route: G.route(stage.launchC, stage.catchC)});

    const opened = p.finalState === 'opened';
    const received = p.finalState !== 'in-transit';
    const {sw, sh} = stage;
    const hcA = stage.heldCenterA, hcB = stage.heldCenterB;
    const lc = stage.launchC;
    const route = stage.legs.leg1;
    const apex = route.pts.reduce((a, q) => (q.y < a.y ? q : a), route.pts[0]);
    const hd = stage.headB;
    const ph = stage.sheet.ph;
    const sealR = Math.max(9, ph * 0.12);
    // exact pose of the stopped mailer (pose() is pure): centre + tilt at the in-transit stop
    const stopSem = stage.pose({fold: 1, seal: 1, windup: 1, launch: 1, returnA: 1, travel: IN_TRANSIT_STOP}).semantic;
    const stopPt = stopSem.sheetCenter;
    const rotAt = (c, deg, lx, ly) => {
      const a = (deg * Math.PI) / 180;
      return {x: c.x + lx * Math.cos(a) - ly * Math.sin(a), y: c.y + lx * Math.sin(a) + ly * Math.cos(a)};
    };
    const mailerRect = {x: stopPt.x - sw / 2 - 8, y: stopPt.y - ph / 2 - 10, w: sw + 16, h: ph + 20 + sealR};

    // obstacles every label must stay clear of (design units)
    const figure = pt => ({x: pt.x - 62 * k, y: pt.floor - 420 * k, w: 124 * k, h: 420 * k});
    const obstacles = [figure(G.A), figure(G.B), ...stage.chips.map(c => c.box)];
    // the route's solid (travelled) part stays visible: labels never sit on it (in transit the
    // faint remainder may pass behind a chip)
    const routeEnd = received ? 1 : IN_TRANSIT_STOP;
    for (let i = 1; i <= 24; i++) {
      const q = route.at((routeEnd * i) / 24);
      obstacles.push({x: q.x - 8, y: q.y - 8, w: 16, h: 16});
    }
    if (!received) obstacles.push(mailerRect);
    else obstacles.push(opened
      ? {x: hcB.x - sw / 2 - 6, y: hcB.y - sh / 2 - 6, w: sw + 12, h: sh + 12}
      : {x: hcB.x - sw / 2 - 6, y: hcB.y - ph / 2 - 6, w: sw + 12, h: ph + 12 + sealR});
    const inside = b => b.x >= 8 && b.y >= 8 && b.x + b.w <= D.w - 8 && b.y + b.h <= D.h - 8;
    const cost = b => (inside(b) ? 0 : 1e9) + obstacles.reduce((a, o) => a + overlapArea(o, b, 7), 0);
    /** first candidate whose box is inside the design space and clear of every obstacle (else the least overlapping) */
    const pick = (cands, make) => {
      let best = null, bc = Infinity;
      for (const c of cands) {
        const res = make(c);
        const cc = cost(res.box);
        if (cc < bc) { best = res; bc = cc; }
        if (cc === 0) break;
      }
      return best;
    };

    // descriptive state tags (key labels)
    const tags = [];
    if (ctx.show('key')) {
      // "Sent" hangs under the start of the route (the release point) on a short leader
      const tgt = {x: lc.x, y: lc.y + 12};
      const sent = pick([
        {x: lc.x, y: lc.y + 62, anchor: 'middle'},
        {x: lc.x - 36, y: lc.y - 13, anchor: 'end'},
        {x: lc.x + 36, y: lc.y - 13, anchor: 'start'},
        {x: lc.x, y: lc.y + 110, anchor: 'middle'},
      ], c => anchoredTag(ctx, ctx.t.sent, {...c, name: 'tag-sent', color: th.accent2, size: 30, target: c.anchor === 'middle' ? tgt : lc}));
      tags.push(sent.node);
      obstacles.push(sent.box);
      if (received) {
        // "Received" sits under what B holds (never in the bubble's corner)
        const below = opened ? hcB.y + sh / 2 : hcB.y + ph / 2 + sealR;
        const rec = statusTag(ctx, ctx.t.received, {x: hcB.x, y: below + 16, anchor: 'middle', size: 30, name: 'tag-rec', color: th.accent4, opacity: 0});
        tags.push(rec.node);
        obstacles.push(rec.box);
      } else {
        // "In transit" owns the slot above the stopped mailer (or beside it when the top is too close)
        const t = pick([
          {x: stopPt.x, y: mailerRect.y - 60, anchor: 'middle'},
          {x: mailerRect.x + mailerRect.w + 14, y: stopPt.y - 26, anchor: 'start'},
          {x: mailerRect.x - 14, y: stopPt.y - 26, anchor: 'end'},
        ], c => statusTag(ctx, ctx.t.inTransit, {...c, size: 28, name: 'tag-transit', color: th.inkSoft, opacity: 0}));
        tags.push(t.node);
        obstacles.push(t.box);
      }
    }

    // optional descriptive note from B (never an acceptance); tail points at the top of the head
    let bubble = null;
    if (received && p.responses.length && ctx.show('all')) {
      const tip = {x: hd.x - stage.fB * 22 * k, y: hd.y - 46 * k};
      const Pb = shape === 'portrait'
        ? {x: hd.x + 56 * k, bottom: hd.y - 52 * k, anchor: 'start', maxWidth: D.w * 0.56}
        : shape === 'square'
          ? {x: D.w - 12, bottom: hd.y - 60 * k, anchor: 'end', maxWidth: D.w * 0.4}
          : {x: D.w - 12, bottom: hd.y - 56 * k, anchor: 'end', maxWidth: D.w * 0.22};
      if (shape === 'portrait') {
        // the bubble ends before the route's return leg at its height
        const band = route.pts.filter(q => q.y > Pb.bottom - 150 && q.y < Pb.bottom + 10 && q.x > Pb.x);
        if (band.length) Pb.maxWidth = Math.min(Pb.maxWidth, Math.min(...band.map(q => q.x)) - Pb.x - 26);
      }
      bubble = speechBubble(ctx, {name: 'bubble', text: p.responses[0].text, size: shape === 'square' ? 30 : 28, tip, ...Pb});
      obstacles.push(bubble.box);
    }

    // editorial annotations: leaders end on an edge of the real target, chips sit in free space
    const firstRow = stage.sheet.rows[0];
    const side = shape === 'portrait' ? 1 : -1; // which edge of B's sheet faces the chip
    const edgeX = hcB.x + side * (sw / 2 + 4);
    const farPt = route.pts.reduce((a, q) => (q.x > a.x ? q : a), route.pts[0]);
    // in transit every leader ends on the mailer's LOWER edge (beside the seal, never on its centre)
    const lowerEdge = towardX => {
      let lx = clamp(towardX - stopPt.x, -sw * 0.38, sw * 0.38);
      if (Math.abs(lx) < sealR * 2.2) lx = (lx < 0 ? -1 : 1) * sealR * 2.2; // beside the seal
      return rotAt(stopPt, stopSem.sheetAngle, lx, ph / 2 + 3);
    };
    const targets = {
      terms: opened ? {x: edgeX, y: hcB.y + firstRow.value.y + firstRow.value.h * 0.5} : {x: edgeX, y: hcB.y},
      mailer: {x: edgeX, y: hcB.y},
      route: shape === 'portrait' ? {x: farPt.x, y: farPt.y} : {x: apex.x, y: apex.y},
    };
    const size = shape === 'square' ? 32 : 28;
    const maxLines = shape === 'portrait' ? 4 : shape === 'square' ? 3 : 2;
    let nextY = shape === 'portrait' ? hcB.y - 30 : Math.max(hcB.y - sh * 0.1, D.h * 0.56);
    const notes = [];
    if (ctx.show('all')) {
      for (const [i, a] of p.annotations.entries()) {
        const name = `note${i}`;
        let c;
        if (!received) {
          // below the stopped mailer, clamped inside the design space and box-tested
          const mw = shape === 'portrait' ? D.w * 0.6 : D.w * 0.34;
          const y0 = mailerRect.y + mailerRect.h + 30;
          const cands = [];
          for (let dy = 0; dy <= 240; dy += 40) {
            cands.push({x: stopPt.x, y: y0 + dy, anchor: 'middle'}, {x: stopPt.x + sw * 0.3, y: y0 + dy, anchor: 'end'}, {x: stopPt.x - sw * 0.3, y: y0 + dy, anchor: 'start'});
          }
          c = pick(cands, q => {
            const make = (x, tx) => noteCallout(ctx, {name, text: a.text, chipAt: {x, y: q.y}, anchor: q.anchor, target: lowerEdge(tx), maxWidth: mw, size, maxLines});
            const b = make(q.x, q.x).box;
            const dx = b.x < 8 ? 8 - b.x : b.x + b.w > D.w - 8 ? D.w - 8 - (b.x + b.w) : 0;
            // shifted inside the design space; the leader ends on the lower-edge point nearest the chip
            return make(q.x + dx, b.x + dx + b.w / 2);
          });
        } else if (a.target === 'route') {
          const tgt = targets.route;
          const mw = shape === 'portrait' ? D.w * 0.5 : shape === 'square' ? D.w * 0.3 : D.w * 0.26;
          const cands = shape === 'portrait'
            ? [{x: tgt.x - 60, y: tgt.y - 70, anchor: 'end'}, {x: tgt.x - 60, y: tgt.y + 20, anchor: 'end'}, {x: tgt.x - 60, y: tgt.y - 150, anchor: 'end'}]
            : shape === 'square'
              ? [{x: tgt.x - 60, y: tgt.y + 40, anchor: 'end'}, {x: tgt.x - 90, y: tgt.y - 30, anchor: 'end'}, {x: tgt.x - 60, y: tgt.y + 120, anchor: 'end'}]
              : [{x: tgt.x, y: tgt.y + 90, anchor: 'middle'}, {x: tgt.x, y: tgt.y + 150, anchor: 'middle'}, {x: tgt.x - 80, y: tgt.y - 10, anchor: 'end'}];
          c = pick(cands, q => noteCallout(ctx, {name, text: a.text, chipAt: {x: q.x, y: q.y}, anchor: q.anchor, target: tgt, maxWidth: mw, size, maxLines}));
        } else {
          const tgt = targets[a.target];
          // beside B's sheet (right of it in 9:16, between the two parties otherwise); the first
          // row height that is clear of the route, the tags and earlier chips wins
          const x0 = shape === 'portrait' ? hcB.x + sw / 2 + 24 : hcB.x - sw / 2 - 36;
          const anchor = shape === 'portrait' ? 'start' : 'end';
          const mw = shape === 'portrait' ? D.w - x0 - 10 : Math.min(D.w * 0.3, x0 - (G.A.x + 90 * k));
          const ys = [];
          for (let dy = 0; dy <= 420; dy += 30) ys.push(nextY + dy);
          for (let dy = 30; dy <= 300; dy += 30) ys.push(nextY - dy);
          c = pick(ys.map(y => ({y})), q => noteCallout(ctx, {name, text: a.text, chipAt: {x: x0, y: q.y}, anchor, target: tgt, maxWidth: mw, size, maxLines}));
          nextY = c.box.y + c.box.h + 18;
        }
        obstacles.push(c.box);
        notes.push(c);
      }
    }

    return {stage, tags, bubble, notes, received, opened};
  },
  build(ctx, L) {
    return g(null,
      L.stage.node,
      L.tags,
      L.bubble && L.bubble.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const s = w => seg(a, ...W[w]);
    const inTransit = p.finalState === 'in-transit';
    const delivered = p.finalState === 'delivered';
    const receives = !inTransit;
    const headB0 = lerp(0, -9, receives ? s('lookUp') : s('lookUp') * 0.5);
    const v = {
      fold: s('fold'), seal: s('seal'), windup: s('windup'), launch: s('launch'),
      // in transit: the mailer stops part-way along the route; the rest of the route stays faint
      travel: inTransit ? Math.min(IN_TRANSIT_STOP, s('travel')) : s('travel'),
      returnA: s('returnA'),
      reach: receives ? s('reach') : 0,
      bring: receives ? s('bring') : 0,
      open: receives && !delivered ? s('open') : 0,
      unfold: receives && !delivered ? s('unfold') : 0,
      headA: lerp(8, -5, s('lookA')),
      headB: receives ? lerp(headB0, 9, s('lookRead')) : headB0,
      ghost1: inTransit ? r(clamp((a - W.travel[0]) / 0.05) * 0.28, 3) : 0,
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const fade = w => (done ? r(seg(u, ...W[w]), 3) : 0);
    if (ctx.show('key')) {
      nodes['tag-sent'] = {opacity: fade('tagSent')};
      if (L.received) nodes['tag-rec'] = {opacity: fade('tagRec')};
      else nodes['tag-transit'] = {opacity: fade('tagRec')};
    }
    if (L.bubble) nodes.bubble = {opacity: fade('bubble')};
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        finalState: p.finalState,
        sealed: v.seal >= 1 && v.open < 1,
        opened: r(v.unfold, 3),
        routeDrawn: r(v.travel, 3),
        actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'contract-formation-01-story',
    title: 'Communicated offer — the offer travels to the offeree',
    titleEs: 'Oferta comunicada — Microescena con objetos y actores',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Oferta comunicada',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Two standing parties. The offeror holds the open offer (readable terms), folds it into its own sealed mailer and sends it; it travels along a dotted route into the offeree’s hand at a shared point; the offeree breaks the seal and unfolds the same terms. Final state is supplied: opened, delivered (sealed) or in transit. Descriptive sent/received states only.',
    tags: ['offer', 'terms', 'letter', 'mailer', 'fold', 'send', 'receive', 'handoff', 'route', 'characters'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/offer-letter.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
