/**
 * LAW-0093 — Regla y excepción · story
 *
 * Storyboard (top-down model-railway board; a reader's two arms enter from
 * the near edge of the board):
 *  0.00–0.15 rest    The main track (general rule) runs across the board; a
 *                    separate siding (exception) leaves it at a switch whose
 *                    blade lies straight, and is closed by a striped swing
 *                    gate with an empty diamond socket (condition). The fact
 *                    card rides a flat wagon at the start of the main track;
 *                    its top corner carries (or not) the diamond marker, as
 *                    supplied. One hand rests on a magnifier, the other near
 *                    the lever frame. Plaques name rule, exception, condition.
 *  0.15–0.42 action  The wagon rolls to the stop line. The left hand lifts the
 *                    magnifier over the card's marker corner (the glass shows
 *                    a real enlarged copy); a dashed relation line runs from
 *                    the marker to the gate socket, which fills with the same
 *                    diamond (as supplied). The right hand grips the lever
 *                    knob and pulls it: the rod throws the blade toward the
 *                    siding and the gate swings open — the main route opens a
 *                    separate conditional branch; the branch lights up.
 *  0.42–0.73         The magnifier returns to rest; the wagon leaves the stop
 *                    line, crosses the blade and runs along the branch to its
 *                    buffer (cause precedes effect: nothing moves before the
 *                    lever is pulled).
 *  0.73–1.00 hold    Final state as supplied: "Exception branch · as
 *                    supplied" status tag, editorial callouts, assumption.
 *  finalState: 'main-as-supplied' (no marker; lever untouched; wagon stays on
 *  the main route), 'held-disputed' (half marker, disputed link, wagon held at
 *  the stop line), 'held-pending' (covered marker, wagon held). The scene
 *  never decides whether the rule or the exception applies.
 *  Layouts: 16:9 and 1:1 run the main line across the board with the siding
 *  above it and the arms entering from the bottom edge; 9:16 runs the main
 *  line down the board, the siding to its right, the arms entering from the
 *  left edge and the rule/exception plaques under their buffers.
 * Legal content: fictional house rules, jurisdiction unspecified,
 * illustrative-unverified.
 * @module animations/reasoning/LAW-0093
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, roundRectPath} from '../../core/geometry.js';
import {str, num, oneOf, list, obj, party, annotation} from '../../schemas/fields.js';
import {chip, textBlock, connector} from '../../primitives/annotate.js';
import {deskWindow, topArm} from '../../primitives/desk.js';
import {actorLook} from '../../primitives/people-style.js';
import {placeChip, placeChipAny, calloutChip, stateTag, leaderPoly} from '../causation/kits/place.js';
import {
  reglaFields, REGLA_DEFAULTS, REGLA_STRINGS, ROUTE_STATES, markerOf, routeOf, stateText, palette,
  junctionGeom, junctionParts, cartAt, factCard, wagon, magnifier, plaque, emblem, overlaps, cardBox, sweepBoxes,
} from './kits/regla-y-excepcion.js';

const ID = 'LAW-0093';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  labels: [0.01, 0.1],
  roll: [0.15, 0.26],
  magUp: [0.2, 0.285], view: [0.27, 0.3], magBack: [0.45, 0.53],
  link: [0.3, 0.345], linkOff: [0.46, 0.52], socket: [0.325, 0.36],
  reach: [0.285, 0.345], pull: [0.35, 0.41], release: [0.43, 0.51],
  litBranch: [0.385, 0.45], litMain: [0.39, 0.45],
  depart: [0.46, 0.7],
  tag: [0.74, 0.8], note: [0.8, 0.88], foot: [0.76, 0.84],
};
const ACTION_END = 0.72;

const sceneSchema = {
  ...reglaFields,
  reader: party,
  actorLabels: obj('Role caption shown with the reader’s arms', {a: str('Caption for the reader (descriptive, not a finding)', 50)}),
  objectLabels: obj('Headings printed on the plaques and on the fact card', {
    rule: str('Heading of the main-route plaque', 30),
    exception: str('Heading of the branch plaque', 30),
    condition: str('Heading of the gate plaque', 30),
    fact: str('Heading printed on the fact card', 20),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['fact', 'rule', 'exception', 'condition', 'junction']), 0, 2),
  finalState: oneOf('State supplied by the author for the final hold (the scene never decides which route applies)', ROUTE_STATES),
};

const defaultParams = {
  ...REGLA_DEFAULTS,
  reader: {name: 'Noor Haddad', role: 'Reader'},
  actorLabels: {a: 'Reader'},
  objectLabels: {rule: 'General rule', exception: 'Exception', condition: 'Condition', fact: 'Fact'},
  actionProgress: 1,
  annotations: [{target: 'junction', text: 'Separate branch · opens for the supplied condition'}],
  finalState: 'branch-as-supplied',
};

/** Per-shape design parameters. */
const SHAPES = {
  landscape: {axis: 'h', cardW: 300, size: 27, gauge: 48, plaque: 27, R: 58, handle: 118, arm: {upper: 250, lower: 230, width: 50, handScale: 1.25},
    ym: 0.645, off: 0.35, roll: 220, toS: 150, curve: 370, gateAfter: 16, endPad: 44, actorW: 250},
  square: {axis: 'h', cardW: 252, size: 25, gauge: 44, plaque: 26, R: 52, handle: 104, arm: {upper: 240, lower: 220, width: 48, handScale: 1.2},
    ym: 0.64, off: 0.35, roll: 90, toS: 100, curve: 215, gateAfter: 8, endPad: 34, actorW: 200},
  portrait: {axis: 'v', cardW: 262, size: 26, gauge: 46, plaque: 28, R: 54, handle: 106, arm: {upper: 240, lower: 220, width: 50, handScale: 1.25},
    xm: 0.36, off: 0.4, roll: 150, toS: 110, curve: 300, gateAfter: 10, actorW: 0},
};

/**
 * Board geometry, prop positions and plaque slots for one shape.
 * @param {any} ctx
 * @param {any} card  fitted fact card (size known)
 * @param {{plaqueH:number}} o  height needed by the portrait plaque band
 */
function plan(ctx, card, o) {
  const D = ctx.design;
  const S0 = o.S0;
  const B = {x: 8, y: 8, w: D.w - 16, h: D.h - 16};
  const x1 = B.x + B.w, y1 = B.y + B.h;
  const gw = S0.gauge;
  if (S0.axis === 'h') {
    const along = card.w;
    const wagonAlong = along + 60;
    const startD = wagonAlong / 2 + 22;
    const cpD = startD + S0.roll;
    const sD = cpD + wagonAlong / 2 + S0.toS;
    const len = B.w - S0.endPad;
    // horizontal positions first (they fix the plaque widths) ...
    const Sx = B.x + sD, Qx = Sx + S0.curve, postX = Qx + S0.gateAfter;
    const sockHalf = S0.size * 0.95 * 1.35;
    const excX = Qx - 40, excW = x1 - 18 - excX;
    const conX = postX + sockHalf + 26, conW = Math.min(600, x1 - 18 - conX);
    const ruleX = Sx + 250, ruleW = Math.min(640, x1 - 18 - ruleX);
    // ... then the vertical stack: exception plaque, siding + card, wedge (socket + condition
    // plaque), main track + card, rule plaque. Spare height is shared out between the gaps.
    const excH = o.probe('exception', excW), conH = o.probe('condition', conW), ruleH = o.probe('rule', ruleW);
    const cTop = -card.ext.y, cBot = card.ext.y + card.ext.h;
    const sockNeed = gw * 1.35 + 20 + sockHalf * 2 + 10; // post + socket plate below the siding
    const wedge = Math.max(conH + 24 + cBot - cBot, sockNeed + 12 - cBot, conH + 24) ;
    // the near-edge row holds the rule plaque, and (left of it) the resting magnifier and the caption
    const nearRow = Math.max(ruleH, S0.R * 2 + 44);
    const need = 14 + excH + 14 + cTop + cBot + wedge + cTop + cBot + 18 + nearRow + 14;
    const spare = Math.max(0, B.h - need);
    const Yb = B.y + 14 + excH + 14 + spare * 0.2 + cTop;
    const Ym = Yb + cBot + wedge + spare * 0.45 + cTop;
    const off = Ym - Yb;
    const geom = junctionGeom({axis: 'h', a: {x: B.x, y: Ym}, sDist: sD, len, off, curve: S0.curve, gauge: gw, endGap: wagonAlong / 2 + 26, gateAfter: S0.gateAfter, postSide: 'inner'});
    const cp = cartAt(geom.routeMain, cpD);
    const S = geom.S;
    // lever frame below the main track, right of the switch; pulled toward the near (bottom) edge
    const lever = {x: S.x + 70, y: Ym + gw * 1.35 + 84, dir: {x: 0, y: 1}, slot: 86};
    const marker = {x: cp.x + card.emblem.x, y: cp.y + card.emblem.y};
    // the magnifier lies to the right of the actor caption, at the near edge
    const magRest = {x: B.x + 18 + S0.actorW + 34 + S0.R, y: Math.max(y1 - S0.R - 40, Ym + cBot + S0.R + 16)};
    return {
      overflow: need - B.h,
      B, geom, gw, wagonAlong, startD, cpD, cp, lever, marker, magAngle: 40,
      shoulderL: {x: magRest.x + 70, y: y1 + 120}, shoulderR: {x: S.x + 230, y: y1 + 120},
      magRest, magRestAngle: 30,
      restR: {x: S.x + 170, y: y1 - 56},
      bendL: 1, bendR: 1,
      slots: {
        exception: {x: excX, y: B.y + 14, w: excW, maxH: Yb - cTop - 14 - (B.y + 14)},
        // right of the socket plate, inside the wedge between siding and main track
        condition: {beside: true, x: conX, w: conW, top: Yb + cBot + 12, bottom: Ym - cTop - 12},
        rule: {x: ruleX, y: Ym + cBot + 18, w: ruleW, maxH: y1 - 14 - (Ym + cBot + 18)},
        issue: {x: B.x + 20, y: B.y + 18, w: Math.max(260, S.x - B.x - 40), maxH: Ym - cTop - 30 - (B.y + 18)},
        actor: {x: B.x + 18, bottom: y1 - 14, w: S0.actorW},
      },
    };
  }
  // portrait: main line down the board, siding to the right, arms from the left edge
  const Xm = B.x + B.w * S0.xm;
  const off = B.w * S0.off;
  const along = card.h;
  const wagonAlong = along + 60;
  const startD = wagonAlong / 2 + 20;
  const cpD = startD + S0.roll;
  const sD = cpD + wagonAlong / 2 + S0.toS;
  const len = B.h - o.plaqueH - 44;
  const geom = junctionGeom({axis: 'v', a: {x: Xm, y: B.y}, sDist: sD, len, off, curve: S0.curve, gauge: gw, endGap: wagonAlong / 2 + 26, gateAfter: S0.gateAfter, postSide: 'outer'});
  const cp = cartAt(geom.routeMain, cpD);
  const S = geom.S;
  const stripR = Xm - card.w / 2 - 8; // right edge of the free strip left of the main line
  const lever = {x: stripR - 44, y: S.y + 90, dir: {x: -1, y: 0}, slot: 72};
  const marker = {x: cp.x + card.emblem.x, y: cp.y + card.emblem.y};
  const plaqueTop = B.y + len + 30;
  const magRest = {x: B.x + S0.R + 18, y: cp.y + 70};
  // the siding's buffer must leave room for the card beyond the gate post
  const needLen = sD + S0.curve + S0.gateAfter + 24 - card.ext.y + wagonAlong / 2 + 26;
  return {
    overflow: needLen - len,
    B, geom, gw, wagonAlong, startD, cpD, cp, lever, marker, magAngle: 150,
    shoulderL: {x: B.x - 130, y: cp.y + 230}, shoulderR: {x: B.x - 130, y: S.y + 280},
    magRest, magRestAngle: 105,
    restR: {x: B.x + 46, y: S.y + 210},
    bendL: -1, bendR: -1,
    slots: {
      rule: {x: B.x + 14, y: plaqueTop, w: B.w / 2 - 22, maxH: y1 - 12 - plaqueTop},
      exception: {x: B.x + B.w / 2 + 8, y: plaqueTop, w: B.w / 2 - 22, maxH: y1 - 12 - plaqueTop},
      condition: {above: true, x: Math.max(Xm + card.w / 2 + 40, geom.EB.x - 150), w: x1 - 14 - Math.max(Xm + card.w / 2 + 40, geom.EB.x - 150)},
      issue: {x: Xm + card.w / 2 + 30, y: B.y + 16, w: x1 - 14 - (Xm + card.w / 2 + 30), maxH: 260},
      actor: {x: B.x + 12, top: S.y + 470, w: stripR - B.x - 16, bottom: plaqueTop - 16},
    },
  };
}

const scene = {
  sizes: {landscape: [1600, 880], square: [1000, 880], portrait: [900, 1400]},
  layout(ctx) {
    // long supplied texts: shrink text sizes (bounded) until the stack fits the board
    let L = null;
    for (const k of [1, 0.93, 0.86, 0.8, 0.74]) {
      L = compose(ctx, k);
      if (L.overflow <= 0) break;
    }
    return L;
  },
  build(ctx, L) {
    return buildScene(ctx, L);
  },
  frame(ctx, L, u) {
    return frameScene(ctx, L, u);
  },
};

function compose(ctx, k) {
  {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const pal = palette(ctx);
    const base = SHAPES[ctx.view.shape];
    const S0 = {...base, size: base.size * k, plaque: base.plaque * k};
    // headings keep (almost) their full size when long texts shrink the bodies: they wrap to a
    // second line instead of shrinking with the rest (long-label presets stay legible)
    const hk = Math.max(k, 0.94);
    const headPl = base.plaque * 0.82 * hk;
    const state = p.finalState;
    const marker = markerOf(state);
    const route = routeOf(state);
    const markerSide = S0.axis === 'v' ? 'left' : 'right';
    // tall boards: the marker sits on the card's bottom-left corner, so the relation line to the
    // socket (lower right) leaves the card without crossing its text
    const markerCorner = S0.axis === 'v' ? 'bottom' : 'top';
    const cardOpts = {w: S0.cardW, facts: p.facts, heading: p.objectLabels.fact || t.fact, marker, size: S0.size, headSize: base.size * 0.78 * hk, maxLines: 3, markerCorner};
    const card = factCard(ctx, {prefix: 'card', ...cardOpts, markerSide});
    // portrait: the plaque band under the buffers is sized to its content
    const plaqueSpec = {
      rule: {heading: p.objectLabels.rule || t.rule, text: p.rules.general, color: pal.rule, soft: pal.ruleSoft, headInk: '#ffffff', icon: 'main', size: S0.plaque, headSize: headPl},
      exception: {heading: p.objectLabels.exception || t.exception, text: p.rules.exception, color: pal.exc, soft: pal.excSoft, headInk: pal.excInk, icon: 'branch', size: S0.plaque, headSize: headPl},
      condition: {heading: p.objectLabels.condition || t.condition, text: p.rules.condition, color: pal.excSoft, soft: pal.excSoft, headInk: pal.excInk, icon: 'socket', size: S0.plaque * 0.94, headSize: headPl * 0.94},
    };
    const probe = (kind, w) => plaque(ctx, {x: 0, y: 0, w, ...plaqueSpec[kind], maxLines: 3}).box.h;
    const bandW = ctx.design.w / 2 - 30;
    const probeH = S0.axis === 'v' ? Math.max(probe('rule', bandW), probe('exception', bandW)) : 0;
    const P = plan(ctx, card, {plaqueH: probeH, probe, S0});
    const {B, geom, gw} = P;
    const x1 = B.x + B.w, y1 = B.y + B.h;

    // --- connector: blade, lever, rod, gate, lights
    const sockS = S0.size * 0.95;
    const parts = junctionParts(ctx, {prefix: 'jn', geom, lever: P.lever, socketS: sockS});
    // socket plate beside the gate post (the condition's receptacle)
    const sockC = parts.socketAt;
    const socket = g(null,
      h('path', {d: roundRectPath(sockC.x - sockS * 1.35, sockC.y - sockS * 1.35, sockS * 2.7, sockS * 2.7, 9), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
      g({transform: T(sockC.x, sockC.y)}, emblem(ctx, {s: sockS, mode: 'socket'}), emblem(ctx, {name: 'sock-fill', s: sockS, mode: marker === 'disputed' ? 'disputed' : 'present', opacity: 0})),
    );
    const socketBox = {x: sockC.x - sockS * 1.35, y: sockC.y - sockS * 1.35, w: sockS * 2.7, h: sockS * 2.7};

    // --- wagon + card (+ a copy of the card for the magnifier glass)
    const wag = wagon(ctx, {name: 'wagon', along: P.wagonAlong, across: gw * 1.9});
    const cardCopy = factCard(ctx, {prefix: 'cardz', ...cardOpts, markerSide});
    const mag = magnifier(ctx, {prefix: 'mag', R: S0.R, handle: S0.handle, content: g(null,
      h('rect', {x: B.x, y: B.y, width: B.w, height: B.h, fill: pal.board}),
      g({name: 'cardzPos'}, cardCopy.node))});
    const zoom = 2.1;

    // --- arms
    const look = actorLook(ctx, p.reader, 0);
    const armL = topArm(ctx, {name: 'armL', skin: look.skin, sleeve: look.outfit, handed: 'left', ...S0.arm});
    const armR = topArm(ctx, {name: 'armR', skin: look.skin, sleeve: look.outfit, handed: 'right', ...S0.arm});

    // --- cart path distances
    const endD = route === 'branch' ? geom.branchEndDist : geom.mainEndDist;
    const finalRoute = route === 'branch' ? geom.routeBranch : geom.routeMain;
    const finalPos = route === 'held' ? P.cp : cartAt(finalRoute, endD);
    const finalCard = cardBox(card, finalPos);
    const sweep = [...sweepBoxes(geom.routeMain, P.startD, P.cpD, card), ...(route === 'held' ? [] : sweepBoxes(finalRoute, P.cpD, endD, card))];
    // every place the card can ever pass (both routes), so plaques do not move with the supplied state
    const sweepAll = [...sweepBoxes(geom.routeMain, P.startD, geom.mainEndDist, card), ...sweepBoxes(geom.routeBranch, P.cpD, geom.branchEndDist, card)];

    // --- relation line: marker → socket (the connector drawn by the reasoning)
    const link = connector(ctx, {name: 'link', from: {x: P.marker.x, y: P.marker.y}, to: {x: sockC.x, y: sockC.y}, kind: marker === 'disputed' ? 'disputed' : 'relation', bend: S0.axis === 'v' ? -0.18 : 0.16, color: pal.excInk});

    // --- plaques (fitted into their slots)
    const fitPlaque = (slot, o) => {
      let size = o.size;
      let pl = null;
      for (let k = 0; k < 8; k++) {
        pl = plaque(ctx, {...o, x: slot.x, y: slot.y, w: slot.w, size, maxLines: 3});
        if (pl.box.h <= slot.maxH || size < S0.plaque * 0.7) break;
        size *= 0.93;
      }
      return pl;
    };
    const ruleSlot = P.slots.rule;
    const excSlot = P.slots.exception;
    const conSlot = P.slots.condition;
    const rulePl = fitPlaque(ruleSlot, {name: 'pl-rule', ...plaqueSpec.rule});
    const excPl = fitPlaque(excSlot, {name: 'pl-exc', ...plaqueSpec.exception});
    let conPl;
    if (conSlot.beside) {
      // landscape / square: right of the socket plate, vertically centred on it inside the wedge
      const x = conSlot.x;
      const slot = {x, y: 0, w: conSlot.w, maxH: conSlot.bottom - conSlot.top};
      const probe = fitPlaque(slot, {name: 'pl-con', ...plaqueSpec.condition});
      const top = clamp(sockC.y - probe.box.h / 2, conSlot.top, Math.max(conSlot.top, conSlot.bottom - probe.box.h));
      conPl = plaque(ctx, {name: 'pl-con', x, y: top, w: slot.w, ...plaqueSpec.condition, size: probe.fit ? probe.fit.size : S0.plaque * 0.94, maxLines: 3});
    } else if (conSlot.above) {
      // portrait: the condition plaque hangs above the gate socket, right of the curve
      const probe = fitPlaque({...conSlot, y: 0, maxH: 240}, {name: 'pl-con', ...plaqueSpec.condition});
      let top = socketBox.y - 26 - probe.box.h;
      // lift it until the wagon's card never passes under it
      for (let k = 0; k < 40 && sweepAll.some(b => overlaps(b, {x: conSlot.x, y: top, w: conSlot.w, h: probe.box.h}, 10)); k++) top -= 10;
      conPl = plaque(ctx, {name: 'pl-con', x: conSlot.x, y: top, w: conSlot.w, ...plaqueSpec.condition, size: probe.fit ? probe.fit.size : S0.plaque * 0.94, maxLines: 3});
    } else {
      conPl = fitPlaque(conSlot, {name: 'pl-con', ...plaqueSpec.condition});
    }
    // centre the rule plaque in its slot vertically; exception plaque hugs the siding
    const shiftBox = (pl, dy) => ({node: g({transform: T(0, dy)}, pl.node), box: {...pl.box, y: pl.box.y + dy}});
    const ruleP = S0.axis === 'h' ? shiftBox(rulePl, Math.max(0, (ruleSlot.maxH - rulePl.box.h) * 0.35)) : rulePl;
    const excP = S0.axis === 'h' ? shiftBox(excPl, Math.max(0, excSlot.maxH - excPl.box.h)) : excPl;
    const conP = conPl;
    // plaque stems: exception plaque ↔ siding, condition plaque ↔ socket plate
    const stems = [];
    const stemTo = (box, pt, color) => {
      const sx = clamp(pt.x, box.x + 20, box.x + box.w - 20);
      const sy = pt.y < box.y ? box.y : box.y + box.h;
      stems.push(h('line', {x1: r(sx), y1: r(sy), x2: r(pt.x), y2: r(pt.y), stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round'}));
    };
    // stems are drawn lines: labels keep off them too (thin boxes)
    const stemBoxes = [];
    if (conSlot.beside) {
      const sy = clamp(sockC.y, conP.box.y + 14, conP.box.y + conP.box.h - 14);
      stems.push(h('line', {x1: r(socketBox.x + socketBox.w), y1: r(sockC.y), x2: r(conP.box.x), y2: r(sy), stroke: th.inkSoft, 'stroke-width': 5, 'stroke-linecap': 'round'}));
      stemBoxes.push({x: socketBox.x + socketBox.w, y: Math.min(sockC.y, sy) - 5, w: Math.max(4, conP.box.x - socketBox.x - socketBox.w), h: Math.abs(sy - sockC.y) + 10});
    } else {
      const end = {x: sockC.x, y: conP.box.y > sockC.y ? socketBox.y + socketBox.h : socketBox.y};
      stemTo(conP.box, end, th.inkSoft);
      const sy = end.y < conP.box.y ? conP.box.y : conP.box.y + conP.box.h;
      stemBoxes.push({x: end.x - 6, y: Math.min(sy, end.y), w: 12, h: Math.abs(sy - end.y)});
    }

    // --- issue card (top-left pinned note) and assumption footnote
    const obstacles = [finalCard, ...sweep, rulePl.box, ruleP.box, excP.box, conP.box, socketBox];
    let issueNode = null, issueBox = null;
    if (ctx.show('all') && p.issues.length) {
      const slot = P.slots.issue;
      const text = `${t.issue}: ${p.issues[0]}`;
      const size = S0.size * 1.02;
      const c = chip(ctx, text, {x: slot.x, y: slot.y, maxWidth: slot.w, size, maxLines: 3, fill: '#fff8dc', stroke: shade2(th), name: 'issue', weight: 600, radius: 6});
      issueNode = c.node;
      issueBox = c.box;
    }
    let footNode = null, footBox = null;
    if (ctx.show('all') && p.assumptions.length) {
      const text = `${t.assumed}: ${p.assumptions.join(' · ')}`;
      const slot = P.slots.issue;
      const y = issueBox ? issueBox.y + issueBox.h + 12 : slot.y;
      const c = chip(ctx, text, {x: slot.x, y, maxWidth: slot.w, size: S0.size * 0.82, maxLines: 2, fill: th.card, stroke: th.inkFaint, name: 'foot', weight: 500});
      footNode = c.node;
      footBox = c.box;
    }

    // --- actor chip at the near edge where the arms enter
    let actorNode = null, actorBox = null;
    if (ctx.show('key')) {
      const slot = P.slots.actor;
      const asz = S0.size * 0.88;
      const probe = actorChip(ctx, p.reader && p.reader.name, p.actorLabels.a, {x: 0, y: 0, w: slot.w, size: asz});
      const y = slot.top !== undefined ? clamp(slot.top, 0, slot.bottom - probe.box.h) : slot.bottom - probe.box.h;
      const c = actorChip(ctx, p.reader && p.reader.name, p.actorLabels.a, {x: slot.x, y, w: slot.w, size: asz, name: 'actor', fill: th.card, stroke: look.outfit});
      actorNode = c.node;
      actorBox = c.box;
    }

    // --- status tag near the final card; editorial callouts
    const bounds = {x: B.x + 10, y: B.y + 10, w: B.w - 20, h: B.h - 20};
    const armBoxes = armZones(P, S0);
    const leverBox = {x: P.lever.x - 60, y: P.lever.y - 80, w: 120, h: 160};
    const fixed = [finalCard, rulePl.box, ruleP.box, excP.box, conP.box, socketBox, issueBox, footBox, actorBox, leverBox, ...armBoxes, ...stemBoxes].filter(Boolean);
    // track bands (main line and the whole branch): tags and callouts keep off the rails when there is room
    const curveBoxes = [];
    for (let i = 0; i <= 28; i++) {
      const q = geom.branchOnly.at(i / 28);
      curveBoxes.push({x: q.x - gw * 1.2, y: q.y - gw * 1.2, w: gw * 2.4, h: gw * 2.4});
    }
    const mainPoly = geom.routeMain;
    for (let i = 0; i <= 24; i++) {
      const q = mainPoly.at(i / 24);
      curveBoxes.push({x: q.x - gw * 1.2, y: q.y - gw * 1.2, w: gw * 2.4, h: gw * 2.4});
    }
    // points on the main line past the switch (fraction of the way to its end)
    const mainAt = f => { const q = geom.routeMain.at((geom.sDist + (geom.mainEndDist - geom.sDist) * f) / geom.routeMain.total); return {x: q.x, y: q.y, r: 6}; };
    const targets = {
      // the card's marker corner: callouts about the fact land there, clear of the status tag beside the card
      // (the card stays an obstacle for the leader: it must not cross the card's text)
      fact: {pt: {x: finalPos.x + card.emblem.x, y: finalPos.y + card.emblem.y, r: card.slot * 0.62}, own: [],
        // fallbacks when the marker corner is boxed in: the card's side edges and top corners
        alt: [
          {x: finalCard.x + finalCard.w, y: finalCard.y + finalCard.h * 0.5, r: 4},
          {x: finalCard.x, y: finalCard.y + finalCard.h * 0.5, r: 4},
          {x: finalCard.x + finalCard.w - 14, y: finalCard.y, r: 4},
          {x: finalCard.x + 14, y: finalCard.y, r: 4},
        ]},
      // the general rule is the main track: callouts land on the main line past the switch (the plaque as fallback)
      rule: {pt: mainAt(0.42), own: [], alt: [mainAt(0.25), mainAt(0.6), mainAt(0.12),
        {x: ruleP.box.x + ruleP.box.w * 0.5, y: ruleP.box.y, r: 6}, {x: ruleP.box.x, y: ruleP.box.y + ruleP.box.h * 0.5, r: 6}]},
      exception: {pt: {x: excP.box.x + excP.box.w * 0.3, y: excP.box.y + excP.box.h, r: 6}, own: [excP.box]},
      condition: {pt: {x: socketBox.x + socketBox.w / 2, y: socketBox.y + socketBox.h / 2, r: socketBox.w * 0.55}, own: [socketBox]},
      junction: {pt: {x: geom.S.x + (geom.Q.x - geom.S.x) * 0.35, y: geom.S.y + (geom.Q.y - geom.S.y) * 0.3, r: 10}, own: []},
    };
    // status tag (no leader, beside the final card) and editorial callouts (with leaders)
    const placeTag = extra => {
      if (!ctx.show('key')) return null;
      const text = stateText(t, state);
      const tsize = S0.size * 0.98;
      const probe = stateTag(ctx, text, {x: 0, y: 0, size: tsize, maxWidth: B.w * 0.6});
      const orderBy = S0.axis === 'h'
        ? (route === 'branch' ? ['below', 'belowL', 'left', 'above'] : route === 'main' ? ['above', 'aboveL', 'left', 'below'] : ['above', 'aboveR', 'aboveL', 'below'])
        : ['below', 'belowR', 'belowL', 'above', 'right', 'left'];
      const target = {x: finalCard.x + finalCard.w / 2, y: finalCard.y + finalCard.h / 2, r: finalCard.h / 2};
      // the tag may overlap the track of the route it names, never the other route's track
      const otherRoute = route === 'branch' ? curveBoxes.slice(29) : curveBoxes.slice(0, 29);
      const res = placeChip({w: probe.box.w, h: probe.box.h}, target, {obstacles: [...fixed, ...extra, ...curveBoxes], bounds, noLeader: true, pad: 6, order: orderBy, gaps: [10, 24, 40, 64, 96, 140]})
        || placeChip({w: probe.box.w, h: probe.box.h}, target, {obstacles: [...fixed, ...extra, ...otherRoute], bounds, noLeader: true, pad: 6, order: orderBy, gaps: [10, 24, 40, 64, 96]})
        || placeChip({w: probe.box.w, h: probe.box.h}, target, {obstacles: [...fixed, ...extra], bounds, noLeader: true, pad: 6, order: orderBy, gaps: [10, 24, 40, 64]});
      if (!res) return null;
      return stateTag(ctx, text, {x: res.x, y: res.y, anchor: 'middle', size: tsize, maxWidth: B.w * 0.6, name: 'state-tag', color: route === 'held' ? th.inkSoft : route === 'branch' ? pal.excInk : pal.rule, opacity: 0});
    };
    const placeNotes = extra => {
      const placed = [...extra];
      const leads = [];
      let bad = 0;
      const out = ctx.show('all') ? p.annotations.map((a, i) => {
        const tg = targets[a.target];
        const size = S0.size * 0.95;
        const mw = Math.min(520, B.w * (S0.axis === 'v' ? 0.62 : 0.34));
        const fits = [[mw, 2], [mw * 0.75, 3], [mw * 0.6, 3]].map(([wd, ml]) => ({wd, ml, box: chip(ctx, a.text, {x: 0, y: 0, maxWidth: wd, size, maxLines: ml}).box}));
        // chips keep off the rails; a thin leader may cross them (track bands are `own` for the leader test)
        const po = {obstacles: [...fixed, ...placed, ...leads, ...curveBoxes], bounds, own: [...tg.own, ...curveBoxes]};
        const poLoose = {...po, obstacles: [...fixed, ...placed, ...leads, ...curveBoxes.slice(0, 29)]};
        let res = placeChipAny(fits.map(f => f.box), tg.pt, po) || placeChipAny(fits.map(f => f.box), tg.pt, poLoose);
        // alternative anchor points on the same object (the leader still lands on it)
        for (const pt of tg.alt || []) {
          if (res) break;
          res = placeChipAny(fits.map(f => f.box), pt, po);
        }
        if (!res) { bad++; res = {...placeChip(fits[1].box, tg.pt, {...po, leastBad: true}), k: 1}; }
        const f = fits[res.k];
        const c = calloutChip(ctx, {name: `note${i}`, text: a.text, chipAt: {x: res.x, y: res.y}, target: res.end, maxWidth: f.wd, maxLines: f.ml, size});
        placed.push(c.box);
        leads.push(leaderPoly(c.box, res.end));
        return c;
      }) : [];
      return {notes: out, bad, boxes: [...placed.slice(extra.length), ...leads]};
    };
    // tag first; if a callout then finds no clean spot, place the callouts first and fit the tag around them
    let tag = placeTag([]);
    let placedNotes = placeNotes(tag ? [tag.box] : []);
    if (placedNotes.bad) {
      const alt = placeNotes([]);
      const altTag = placeTag(alt.boxes);
      if (alt.bad < placedNotes.bad) { tag = altTag; placedNotes = alt; }
    }
    // last resort for the tag: least-overlapping spot right beside the final card
    if (!tag && ctx.show('key')) {
      const text = stateText(t, state);
      const probe = stateTag(ctx, text, {x: 0, y: 0, size: S0.size * 0.98, maxWidth: B.w * 0.6});
      const target = {x: finalCard.x + finalCard.w / 2, y: finalCard.y + finalCard.h / 2, r: finalCard.h / 2};
      const res = placeChip({w: probe.box.w, h: probe.box.h}, target, {obstacles: [...fixed, ...placedNotes.boxes], bounds, noLeader: true, leastBad: true, gaps: [10, 24, 40]})
        || {x: target.x, y: finalCard.y + finalCard.h + 10};
      tag = stateTag(ctx, text, {x: res.x, y: res.y, anchor: 'middle', size: S0.size * 0.98, maxWidth: B.w * 0.6, name: 'state-tag', color: route === 'held' ? th.inkSoft : route === 'branch' ? pal.excInk : pal.rule, opacity: 0});
    }
    const notes = placedNotes.notes;

    const desk = deskWindow(ctx, {prefix: 'board', x: B.x, y: B.y, w: B.w, h: B.h, radius: 26, wood: pal.board, mat: false});
    return {overflow: P.overflow, P, S0, geom, parts, socket, sockC, socketBox, card, cardCopy, wag, mag, zoom, armL, armR, link, rulePl: ruleP, excPl: excP, conPl: conP, stems,
      issueNode, footNode, actorNode, tag, notes, desk, route, marker, state, endD, finalRoute, finalPos, x1, y1};
  }
}

function buildScene(ctx, L) {
    const P = L.P;
    return g(null,
      L.desk.surface,
      g({'clip-path': L.desk.clip},
        L.parts.bed,
        L.parts.lights,
        L.parts.rails,
        L.parts.buffers,
        L.parts.rod,
        L.parts.blade,
        L.parts.pivot,
        L.parts.gate,
        L.stems,
        L.socket,
        L.parts.lever,
        g({name: 'cart'}, L.wag),
        g({name: 'cardPos'}, L.card.node),
        L.link.node,
        L.armR.arm, L.armR.palm, L.armR.thumb,
        L.armL.arm, L.armL.palm,
        L.mag.view, L.mag.body,
        L.armL.thumb,
      ),
      L.desk.frame,
      L.rulePl.node, L.excPl.node, L.conPl.node,
      L.issueNode, L.footNode, L.actorNode,
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
      // keep a reference so tests can read the board box
      h('rect', {x: P.B.x, y: P.B.y, width: 1, height: 1, fill: 'none', name: 'board-origin'}),
    );
}

function frameScene(ctx, L, u) {
    const p = ctx.params;
    const P = L.P;
    const G = L.geom;
    const nodes = {};
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const done = p.actionProgress >= 1;
    const branch = L.route === 'branch';
    const held = L.route === 'held';
    const examines = true;

    // --- wagon: roll to the stop line, then (unless held) along the supplied route
    const roll = ease.inOutCubic(seg(a, ...W.roll));
    const depart = held ? 0 : ease.inOutCubic(seg(a, ...W.depart));
    let pos;
    if (depart > 0) pos = cartAt(L.finalRoute, lerp(P.cpD, L.endD, depart));
    else pos = cartAt(G.routeMain, lerp(P.startD, P.cpD, roll));
    nodes.cart = {transform: T(pos.x, pos.y, pos.angle)};
    nodes.cardPos = {transform: T(pos.x, pos.y)};
    nodes.cardzPos = {transform: T(pos.x, pos.y)};

    // --- left hand: magnifier over the marker corner and back
    const up = ease.inOutCubic(seg(a, ...W.magUp));
    const back = ease.inOutCubic(seg(a, ...W.magBack));
    const markerNow = {x: pos.x + L.card.emblem.x, y: pos.y + L.card.emblem.y};
    const angle = lerp(lerp(P.magRestAngle, P.magAngle, up), P.magRestAngle, back);
    const over = examines ? up * (1 - back) : 0;
    // the glass is held just off the marker corner, on the side away from the card's text,
    // and shows the marker at its centre (focus); it travels around the card, never across it
    const R = L.S0.R;
    const lift = L.S0.axis === 'v' ? {x: -0.15 * R, y: 0.42 * R} : {x: 0.1 * R, y: -0.4 * R};
    const Cover = {x: markerNow.x + lift.x, y: markerNow.y + lift.y};
    const Crest = P.magRest;
    let Cwant = mix(Crest, Cover, over);
    if (L.S0.axis === 'h') {
      // waypoint beside the card's lower right corner: a quadratic through it (t = 0.5)
      const cb = cardBox(L.card, pos);
      const Wp = {x: cb.x + cb.w + R * 0.8, y: cb.y + cb.h + R * 0.5};
      const K = {x: 2 * Wp.x - (Crest.x + Cover.x) / 2, y: 2 * Wp.y - (Crest.y + Cover.y) / 2};
      const q = over, q1 = 1 - over;
      Cwant = {x: q1 * q1 * Crest.x + 2 * q1 * q * K.x + q * q * Cover.x, y: q1 * q1 * Crest.y + 2 * q1 * q * K.y + q * q * Cover.y};
    }
    // the hand holds the handle grip; the magnifier follows the SOLVED hand
    const gripWant = {x: Cwant.x + Math.cos(angle * Math.PI / 180) * L.mag.grip, y: Cwant.y + Math.sin(angle * Math.PI / 180) * L.mag.grip};
    const solvedL = L.armL.pose(P.shoulderL, gripWant, P.bendL);
    Object.assign(nodes, solvedL.nodes);
    const C = L.mag.centreFromGrip(solvedL.hand, angle);
    const viewOn = seg(a, ...W.view) * (1 - seg(a, W.magBack[0], W.magBack[0] + 0.03));
    const focus = {x: C.x - lift.x * over, y: C.y - lift.y * over};
    Object.assign(nodes, L.mag.frame(C, angle, L.zoom, viewOn, focus));

    // --- right hand: reach the knob, pull it (branch only), release
    const pulls = branch;
    const reach = pulls ? ease.inOutCubic(seg(a, ...W.reach)) : 0;
    const pull = pulls ? ease.inOutSine(seg(a, ...W.pull)) : 0;
    const release = pulls ? ease.inOutCubic(seg(a, ...W.release)) : 0;
    const knob = L.parts.leverAt(pull);
    let handR;
    if (release > 0) handR = mix(knob, P.restR, release);
    else if (pull > 0 || reach >= 1) handR = knob;
    else handR = mix(P.restR, L.parts.leverAt(0), reach);
    const solvedR = L.armR.pose(P.shoulderR, handR, P.bendR);
    Object.assign(nodes, solvedR.nodes);

    // --- connector: blade and gate follow the lever; route lights
    const bladeP = pull;
    const gateP = ease.inOutCubic(clamp((pull - 0.25) / 0.75));
    const litB = branch ? ease.inOutSine(seg(a, ...W.litBranch)) : 0;
    const litM = L.route === 'main' ? ease.inOutSine(seg(a, ...W.litMain)) : 0;
    Object.assign(nodes, L.parts.pose({blade: bladeP, gate: gateP, lever: pull, litMain: litM, litBranch: litB}));

    // --- relation line marker → socket, socket fill
    const linked = L.marker === 'present' || L.marker === 'disputed';
    const lp = linked ? ease.inOutCubic(seg(a, ...W.link)) : 0;
    const lfade = 1 - seg(a, ...W.linkOff) * (L.marker === 'disputed' ? 0 : 1);
    Object.assign(nodes, L.link.frame(lp, lp > 0 ? r(lfade, 3) : 0));
    const sock = linked ? ease.outCubic(seg(a, ...W.socket)) : 0;
    nodes['sock-fill'] = {opacity: r(sock, 3)};

    // --- labels
    nodes['state-tag'] = L.tag ? {opacity: done ? r(seg(u, ...W.tag), 3) : 0} : undefined;
    if (!L.tag) delete nodes['state-tag'];
    if (L.footNode) nodes.foot = {opacity: done ? r(seg(u, ...W.foot), 3) : 0};
    L.notes.forEach(n => Object.assign(nodes, n.frame(done ? seg(u, ...W.note) : 0)));

    // --- semantics
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const gripNow = {x: C.x + Math.cos(angle * Math.PI / 180) * L.mag.grip, y: C.y + Math.sin(angle * Math.PI / 180) * L.mag.grip};
    const onBranch = depart > 0 && branch && lerp(P.cpD, L.endD, depart) > G.sDist + 4;
    const cardDist = depart > 0 ? lerp(P.cpD, L.endD, depart) : lerp(P.startD, P.cpD, roll);
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: L.state,
      marker: L.marker,
      route: L.route,
      cart: P2(pos),
      card: P2(pos),
      handL: P2(solvedL.hand),
      magGrip: P2(gripNow),
      mag: P2(C),
      handR: P2(solvedR.hand),
      knob: P2(knob),
      markerPt: P2(markerNow),
      // the glass shows the marker at its centre and covers it (held just off the corner)
      lensOnMarker: Math.hypot(focus.x - markerNow.x, focus.y - markerNow.y) < 2 && Math.hypot(C.x - markerNow.x, C.y - markerNow.y) < R * 0.5,
      lensFocus: P2(focus),
      glassOn: r(viewOn, 3),
      lever: r(pull, 3),
      blade: r(bladeP, 3),
      gate: r(gateP, 3),
      litBranch: r(litB, 3),
      litMain: r(litM, 3),
      link: r(lp, 3),
      socketLit: r(sock, 3),
      cartDist: r(cardDist, 1),
      switchDist: r(G.sDist, 1),
      startDist: r(P.startD, 1),
      onBranch,
      atStopLine: Math.abs(cardDist - P.cpD) < 0.5,
      handOnKnob: pull > 0 && release === 0,
      allReached: solvedL.reached && solvedR.reached,
      reach: {L: solvedL.reached, R: solvedR.reached},
      actionCapped: p.actionProgress < 1 && u > capU,
    };
    return {nodes, semantic};
}

/**
 * Name tag for the reader: "name · role" on one line when it fits; otherwise the
 * name and the role are stacked on their own lines (the separator is dropped,
 * so a wrapped tag never ends a line with a dangling "·").
 */
function actorChip(ctx, name, role, o) {
  const th = ctx.theme;
  const size = o.size;
  const padX = size * 0.6, padY = size * 0.38;
  const inner = o.w - padX * 2;
  const who = [name, role].filter(Boolean).join(' · ');
  const one = ctx.fit(who, {maxWidth: inner, size, minSize: size * 0.9, maxLines: 1, weight: 600});
  const rows = !one.truncated || !name || !role
    ? [ctx.fit(who, {maxWidth: inner, size, minSize: size * 0.72, maxLines: 4, weight: 600})]
    : [ctx.fit(name, {maxWidth: inner, size, minSize: size * 0.72, maxLines: 3, weight: 700}), ctx.fit(role, {maxWidth: inner, size: size * 0.9, minSize: size * 0.7, maxLines: 3, weight: 500})];
  const gap = size * 0.18;
  const w = Math.max(...rows.map(f => f.width)) + padX * 2;
  const hh = rows.reduce((a, f) => a + f.height, 0) + gap * (rows.length - 1) + padY * 2;
  const x = o.x;
  let ty = o.y + padY;
  const texts = rows.map((f, i) => {
    const tb = textBlock(f, {x: x + w / 2, y: ty, anchor: 'middle', fill: i ? th.inkSoft : th.ink});
    ty += f.height + gap;
    return tb;
  });
  const node = g({name: o.name},
    h('path', {d: roundRectPath(x, o.y, w, hh, Math.min(hh / 2, size * 0.7)), fill: o.fill ?? th.card, stroke: o.stroke ?? th.ink, 'stroke-width': 2}),
    texts);
  return {node, box: {x, y: o.y, w, h: hh}};
}

/** Rough boxes the arms sweep, so labels stay off them. */
function armZones(P, S0) {
  const box = (a, b, pad) => ({x: Math.min(a.x, b.x) - pad, y: Math.min(a.y, b.y) - pad, w: Math.abs(a.x - b.x) + 2 * pad, h: Math.abs(a.y - b.y) + 2 * pad});
  return [box(P.shoulderR, P.lever, S0.arm.width * 0.8), box(P.shoulderL, P.magRest, S0.arm.width * 0.8)];
}

function shade2(th) {
  return th.accent3;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'reasoning-04-story',
    title: 'Rule and exception — a main track opens a gated siding',
    titleEs: 'Regla y excepción — Microescena con objetos y actores',
    category: 'reasoning',
    categoryName: 'Razonamiento jurídico',
    motif: 'Regla y excepción',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down model railway: a fact card rides a wagon along the main track (general rule). A reader’s hand holds a magnifier over the card’s marker corner, a dashed relation ties the marker to the gate’s diamond socket (condition), and the other hand pulls a lever that throws the switch blade and swings the gate open: the main route opens a separate branch (exception) and the wagon runs onto it. Other supplied states keep the wagon on the main route or hold it at the stop line (disputed / pending). No legal conclusion is drawn.',
    tags: ['reasoning', 'rule', 'exception', 'condition', 'branch', 'switch', 'magnifier', 'fact', 'railway', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/reasoning/kits/regla-y-excepcion.js', 'src/animations/causation/kits/place.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: REGLA_STRINGS,
  scene,
});
