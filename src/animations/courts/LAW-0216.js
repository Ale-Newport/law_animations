/**
 * LAW-0216 — Sala física y remota · inspect
 *
 * Storyboard (the context is the state produced by the story: the plan of the
 * generic hearing room, everyone in place, the bench linked to a remote window
 * on the left wall; the building and the key beside it):
 *  0.00–0.20  build: the plan fills its area beside the panel; the inspected
 *             remote participant's window carries their label above it and,
 *             under it, the supplied datum that will change (e.g. "Window:
 *             upper left wall"). The link runs solid from the bench hub to it.
 *  0.20–0.45  isolate: a frame settles on the window column (the window, the
 *             free place below it, the end of its link, the label and the
 *             datum); the plan's own texts fade while it is not at full size,
 *             the plan shrinks towards its far side (never under 45 px people,
 *             never under half the width) and a lens opens in the freed space
 *             beside the window: a REAL enlarged copy of the same plan
 *             coordinates, tied to the frame by two guides. Pieces enter the
 *             lens whole or not at all.
 *  0.45–0.75  substitute ONE datum: the old value is struck through, turns grey
 *             and docks under the new one as "was: …"; only the dependent
 *             geometry follows — for a window substitution the screen slides
 *             along the wall to the supplied free place, its participant still
 *             seated in it, and the solid link stays attached, re-routing to
 *             the new place; for a label substitution nothing moves. The new
 *             value stays still in the lens.
 *  0.75–1.00  return: the lens closes, the plan grows back with the new state,
 *             the struck old value and a neutral changed-datum marker (Δ); a
 *             note in the panel repeats the marker. Seeking back restores the
 *             old datum exactly. Nothing about permission, validity,
 *             equivalence, procedure or outcome is inferred.
 * @module animations/courts/LAW-0216
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {planPerson, buildingElevation} from './kits/courts-art.js';
import {
  sfrFields, SFR_EN, SFR_STRINGS, WIN_SLOTS, isWin, resolveSfr, sfrGeometry, fitSfr, planFrame, roomArt, windowArt, linkLine, camLit, remotePose,
  furnitureBoxes, placeSeatLabels, placeFree, seatLabelNode, bodyBox, gchip, glue, fitWords, pxPerUnit, overlaps, R2, PERSON_RAD, WALL, HUB, roundCorners,
} from './kits/sala-fisica-remota.js';

const ID = 'LAW-0216';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  caption: [0.03, 0.1], frame: [0.2, 0.24], textOut: [0.2, 0.215], shrink: [0.215, 0.28], open: [0.28, 0.36],
  strike: [0.46, 0.5], dock: [0.51, 0.55], move: [0.55, 0.63], newIn: [0.63, 0.66], newInStill: [0.555, 0.585],
  close: [0.72, 0.77], grow: [0.77, 0.83], textIn: [0.83, 0.855], marker: [0.855, 0.89],
};
const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";

const STRINGS = {
  en: {...SFR_STRINGS.en},
  es: {...SFR_STRINGS.es},
};

const sceneSchema = {
  ...sfrFields,
  focusSeat: int('Which participant (index in `seats`) is inspected — a window participant for a window substitution', 0, 5),
  afterSlot: oneOf('Window substitution: the supplied new place of the inspected window (a free window place on the same wall)', WIN_SLOTS),
  focusTarget: oneOf('Detail that is substituted: window = the supplied window place (the screen slides there and its link re-attaches); label = the label datum of the inspected participant (nothing moves). The participant label itself stays in its own chip', ['window', 'label']),
  beforeValue: str('Value shown before the substitution, in its own chip under the inspected window', 90),
  afterValue: str('Value shown after the substitution (the alternative datum), in the same chip', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Largest magnification of the lens, relative to the context it is taken from', 1.5, 4), placement: oneOf('Where the lens sits', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption', 80), marker: str('Label of the changed-datum marker', 60)}),
};

const defaultParams = {
  ...SFR_EN,
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'win1', label: 'Participant B'},
    {slot: 'right1', label: 'Participant C'},
  ],
  routes: [{seat: 0}, {seat: 1}, {seat: 2}, {seat: 3}],
  focusSeat: 2,
  afterSlot: 'win2',
  focusTarget: 'window',
  beforeValue: 'Window: upper place, left wall',
  afterValue: 'Window: lower place, left wall',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Places as linked on the plan', marker: 'Changed: one supplied window place'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const regions = shape === 'landscape' ? [0.2, 0.23, 0.26, 0.3].map(f => ({flow: 'column', f}))
      : shape === 'square' ? [0.28, 0.32, 0.36].map(f => ({flow: 'column', f})) : [0.2, 0.24, 0.28].map(f => ({flow: 'band', f}));
    let best = null, bestCheap = null;
    const log = [];
    // (create() budget) each candidate is first composed without its label placement, the costly part; only a
    // candidate whose lens, stack and panel already fit is composed in full (the full pass decides)
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const rg of regions) {
        const C = compose(ctx, p, v / px, px, rg, true);
        if (!bestCheap || C.problems.length < bestCheap.C.problems.length) bestCheap = {C, v, rg};
        if (C.problems.length) { log.push(`${v}/${rg.flow}${rg.f}:cheap:${C.problems.join("+")}`); continue; }
        const L = compose(ctx, p, v / px, px, rg);
        log.push(`${v}/${rg.flow}${rg.f}:k${L.k.toFixed(2)}/sT${L.sT}/crop${Math.round(L.crop.w)}x${Math.round(L.crop.h)}/dest${Math.round(L.dest.w)}x${Math.round(L.dest.h)}:${L.problems.join("+")}`);
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.personPx > pick.personPx + 0.5)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    if (!best) best = compose(ctx, p, bestCheap.v / px, px, bestCheap.rg);
    best.log = log.slice(-16);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    const plan = (P, lens) => g({transform: L.pf.transform},
      lens ? L.lzRoom.node : L.room.node,
      (lens ? L.lzTiles : L.tiles).map(t => t.node),
      (lens ? L.lzLinks : L.links).map(l => (l ? l.node : null)),
      (lens ? L.lzPeople : L.people).map((pp, i) => (pp && (!lens || L.lzShow[i]) ? pp.node : null)));
    const world = g({name: 'world'},
      plan('rm', false),
      g({name: 'world-text'},
        L.roomChip && L.roomChip.node,
        L.doorChip && seatLabelNode(ctx, L.doorChip, {name: 'door-cap0', size: L.F, color: th.inkSoft}),
        L.labels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: L.seatNames[i]}))),
      L.marker,
      h('rect', {name: 'src-frame', x: r(L.crop.x), y: r(L.crop.y), width: r(L.crop.w), height: r(L.crop.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', opacity: 0}),
    );
    return g(null,
      world,
      // the inspected label and datum chips at screen size, anchored to the (moving) window
      g({name: 'cx-wrap'}, L.stack.node('cx')),
      L.panel.node,
      L.guides.map((gd, i) => h('line', {name: `guide${i}`, x1: r(gd.a.x), y1: r(gd.a.y), x2: r(gd.b.x), y2: r(gd.b.y), stroke: th.accent2, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0})),
      g({name: 'lens', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18}))),
        h('rect', {x: r(L.dest.x + 6), y: r(L.dest.y + 10), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: '#f5efe3'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(L.dest.x - L.crop.x * L.zoom, L.dest.y - L.crop.y * L.zoom)} scale(${r(L.zoom, 4)})`},
            plan('lz', true),
            L.lzChips.map(c => seatLabelNode(ctx, c.L, {name: c.name, size: L.F, owner: c.owner})),
            L.stack.node('lz'))),
        h('rect', {name: 'lens-border', x: r(L.dest.x), y: r(L.dest.y), width: r(L.dest.w), height: r(L.dest.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, L.sT, sh);
    const off = {x: lerp(0, L.offT.x, sh), y: lerp(0, L.offT.y, sh)};
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    nodes.world = {transform: `${T(off.x, off.y)} scale(${r(sc, 4)})`};
    // the plan's own texts are shown only at full size (the lens shows them enlarged meanwhile)
    const textOp = (1 - seg(u, ...W.textOut)) + seg(u, ...W.textIn);
    nodes['world-text'] = {opacity: r(sc >= 0.9999 ? clamp(textOp) : 0, 3)};
    // the window substitution: the screen slides along the wall, its participant with it; the link re-attaches
    const mv = L.moves ? ease.inOutCubic(seg(u, ...W.move)) : 0;
    const dy = L.dyT * mv;
    for (const P of ['', 'lz-']) {
      if (L.hasFocusTile) nodes[`${P}win-${L.focusSlot}`] = {transform: T(0, dy)};
      L.items.forEach((it, i) => {
        if (P && !L.lzShow[i]) return;
        const pose = it.kind === 'room' ? {...L.G.slots[it.route.slot], phase: 0, walk: 0, seated: 1} : {...remotePose(L.G, it.route.slot, 1)};
        if (i === L.fi) pose.y += dy;
        Object.assign(nodes, (P ? L.lzPeople : L.people)[i].pose(pose));
      });
    }
    // the focus link: redrawn to the moving port (both copies)
    const fpts = L.focusLink(dy);
    const d = fpts.map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join('');
    L.items.forEach((it, i) => {
      if (it.kind !== 'window') return;
      for (const P of ['', 'lz-']) {
        const nm = `${P}link${i}`;
        const lk = (P ? L.lzLinks : L.links)[i];
        if (!lk) continue;
        Object.assign(nodes, lk.frame(1));
        if (i === L.fi) {
          const end = fpts[fpts.length - 1];
          nodes[`${nm}-line`] = {d, 'stroke-dasharray': 'none', 'stroke-dashoffset': 0};
          nodes[`${nm}-halo`] = {d, 'stroke-dasharray': 'none', 'stroke-dashoffset': 0};
          nodes[`${nm}-b`] = {opacity: 1, cx: r(end.x), cy: r(end.y)};
        }
        if (!P || L.lzTiles.some(t => t.slot === it.route.slot)) nodes[`${P}win-${it.route.slot}-cam`] = camLit(ctx, true);
      }
    });
    // the stack (label + datum) follows the window: at screen size in the context (hidden while the lens holds it)
    const tileD = L.pf.toD({x: L.tileC.x, y: L.tileC.y + dy});
    const anchor = wt(tileD);
    const ss = Math.min(1, Math.max(sc, (19.6 / L.px) / L.F));
    // keep the screen-size stack inside the frame while the plan is small
    if (L.stackUnion) {
      const B = L.stackUnion;
      const x0 = anchor.x + (B.x - tileD.x + 0) * ss, x1 = anchor.x + (B.x + B.w - tileD.x) * ss;
      const y0 = anchor.y + (B.y + dy * L.pf.k - tileD.y) * ss, y1 = anchor.y + (B.y + B.h + dy * L.pf.k - tileD.y) * ss;
      anchor.x += Math.max(0, 4 - x0) - Math.max(0, x1 - (L.D.w - 4));
      anchor.y += Math.max(0, 4 - y0) - Math.max(0, y1 - (L.D.h - 4));
    }
    Object.assign(nodes, L.stack.frame(u, dy * L.pf.k));
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1], W.close[1] + 0.03));
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    // the screen-size chips give way as the lens (which holds their enlarged copy) opens, before the guides appear
    nodes['cx-wrap'] = {transform: `${T(anchor.x, anchor.y)} scale(${r(ss, 4)}) ${T(-tileD.x, -tileD.y)}`, opacity: r(1 - clamp(open / 0.1), 3)};
    nodes['src-frame'] = {opacity: r(fr, 3)};
    // the lens grows from a scale at which its enlarged text is already above the floor
    const ls0 = Math.min(0.95, Math.max(0.6, 19.8 / (L.F * L.px * L.zoom)));
    const ls = ls0 + (1 - ls0) * open;
    const lc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
    L.guides.forEach((gd, i) => {
      nodes[`guide${i}`] = {x2: r(lc.x + (gd.b.x - lc.x) * ls), y2: r(lc.y + (gd.b.y - lc.y) * ls), opacity: r(Math.min(fr, open >= 0.1 ? 1 : 0), 3)};
    });
    nodes.lens = {opacity: r(open, 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    L.labels.forEach((sl, i) => { if (sl) { nodes[`lab${i}`] = {opacity: 1}; nodes[`lab${i}-text`] = {opacity: 1}; } });
    if (L.doorChip) { nodes['door-cap0'] = {opacity: 1}; nodes['door-cap0-text'] = {opacity: 1}; }
    L.lzChips.forEach(c => { nodes[c.name] = {opacity: 1}; nodes[`${c.name}-text`] = {opacity: 1}; });
    Object.assign(nodes, L.room.doors.main.frame(0), L.lzRoom.doors.main.frame(0));
    nodes['cx-marker'] = {opacity: r(seg(u, ...W.marker), 3)};
    Object.assign(nodes, L.panel.frame(u));
    // (the panel steps aside only while the plan is at rest: out before it shrinks over the panel, back once it is full size)
    nodes.panel = {opacity: r(L.lensOverPanel ? clamp(1 - seg(u, ...W.textOut) + seg(u, W.grow[1], W.textIn[1])) : 1, 3)};
    const strike = seg(u, ...W.strike), dock = seg(u, ...W.dock), newIn = seg(u, ...(L.moves ? W.newIn : W.newInStill));
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const people = L.items.map((it, i) => wt(L.pf.toD(i === L.fi ? {x: L.focusSeat.x, y: L.focusSeat.y + dy} : L.seatPt[i])));
    const rr = L.rad * sc;
    const focusPt = wt(L.pf.toD({x: L.focusSeat.x, y: L.focusSeat.y + dy}));
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(open, 3),
        contextScale: r(sc, 3),
        textOnPlan: r(sc >= 0.9999 ? clamp(textOp) : 0, 3),
        valueScale: r(ss, 3),
        valueShown: r(1 - clamp(open / 0.1), 3),
        datum,
        strike: r(strike, 3),
        oldDocked: r(dock, 3),
        newShown: r(newIn, 3),
        focusTarget: ctx.params.focusTarget,
        windowPlace: !L.moves ? L.beforeSlot : mv >= 1 ? L.afterSlot : mv <= 0 ? L.beforeSlot : 'moving',
        person: R2(focusPt),
        placeBefore: R2(wt(L.pf.toD(L.focusSeat))),
        placeAfter: R2(wt(L.pf.toD({x: L.focusSeat.x, y: L.focusSeat.y + L.dyT}))),
        moves: L.moves,
        linkEnd: R2(wt(L.pf.toD(fpts[fpts.length - 1]))),
        linkAttached: Math.abs(fpts[fpts.length - 1].y - (L.portY + dy)) < 0.5,
        zoom: r(L.zoom / L.sT, 2),
        lensScale: r(L.zoom, 3),
        lensFrac: r(Math.min(L.dest.w, L.dest.h) * L.px / 1080, 3),
        contextWidth: r((L.planRect.w * sc) / L.D.w, 3),
        stackInCrop: L.stackInCrop,
        lensClearOfPeople: open === 0 || people.every(q => !overlaps(L.dest, {x: q.x - rr, y: q.y - rr, w: 2 * rr, h: 2 * rr}, 0)),
        lensClearOfSource: !overlaps(L.dest, L.cropShrunk, 0),
        lensClearOfPlan: !overlaps(L.dest, L.planShrunk, 0),
        guidesClear: L.guidesClear,
        markerShown: r(seg(u, ...W.marker), 3),
        markerClearOfHeads: L.markerClear,
        others: L.items.map((it, i) => (i === L.fi ? null : R2(people[i]))),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        log: L.log,
      },
    };
  },
};

/** One composition at text size F with panel region rg. */
function compose(ctx, p, F, px, rg, cheap = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const {seats, routes} = resolveSfr(ctx, p);
  // ---- regions: the plan fills its area; the panel beside it (column) or above it (band)
  const band = rg.flow === 'band';
  const panelBox = band ? {x: 0, y: 0, w: D.w, h: D.h * rg.f} : {x: D.w * (1 - rg.f), y: 0, w: D.w * rg.f, h: D.h};
  const planBox = band ? {x: 0, y: panelBox.h + 24, w: D.w, h: D.h - panelBox.h - 24} : {x: 0, y: 0, w: D.w - panelBox.w - 28, h: D.h};
  // ---- the inspected participant and the supplied new place
  const fiSeat = seats.find(s => s.index === p.focusSeat) || seats[0];
  const fi = Math.max(0, routes.findIndex(rt => rt.seat === fiSeat.index));
  const focusRoute = routes[fi];
  const usedWin = routes.filter(rt => rt.kind === 'window').map(rt => rt.slot);
  const beforeSlot = focusRoute ? focusRoute.slot : fiSeat.slot;
  const afterOk = p.focusTarget === 'window' && focusRoute && focusRoute.kind === 'window' && p.afterSlot !== beforeSlot && !usedWin.includes(p.afterSlot);
  const winSlots = [...new Set([...usedWin, ...(afterOk ? [p.afterSlot] : [])])];
  // ---- plan (all windows in one column on the left wall; the inspected one and its new place are in it)
  const {W: RW, H: RH, k} = fitSfr(planBox, winSlots, 0, 'column');
  const G = sfrGeometry(RW, RH, winSlots, 'column');
  // only the chairs someone uses are drawn (the context is the story's end state; free chairs would crowd the labels)
  const usedRoom = new Set(routes.filter(rt => rt.kind === 'room').map(rt => rt.slot));
  for (const s0 of Object.keys(G.slots)) if (!usedRoom.has(s0)) delete G.slots[s0];
  const pf = planFrame(G.extents, planBox, k, 0);
  const toD = pf.toD;
  const planRect = pf.rect;
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  const rad = PERSON_RAD * k;
  const moves = Boolean(afterOk) && G.win[beforeSlot] && G.win[p.afterSlot] && G.win[beforeSlot].side === G.win[p.afterSlot].side;
  const afterSlot = moves ? p.afterSlot : beforeSlot;
  const fw = focusRoute && focusRoute.kind === 'window' ? G.win[beforeSlot] : null;
  const dyT = moves ? G.win[afterSlot].box.y - fw.box.y : 0;
  // ---- art (context + lens copy)
  const items = routes.map(rt => ({route: rt, kind: rt.kind}));
  const seatPt = items.map(it => (it.kind === 'room' ? G.slots[it.route.slot] : G.win[it.route.slot].seat));
  const room = roomArt(ctx, G, {prefix: 'rm', rings: []});
  const tiles = usedWin.map(s => ({slot: s, node: windowArt(ctx, G, s, {name: `win-${s}`})}));
  const people = routes.map((rt, i) => planPerson(ctx, {name: `p${i}`, look: rt.look}));
  const linkPts = slot => {
    const w = G.win[slot];
    const hub = G.hubs[w.side];
    return dy2 => {
      const port = {x: w.port.x, y: w.port.y + dy2};
      if (Math.abs(port.y - hub.y) < 1) return [{x: hub.x - HUB.w / 2, y: hub.y}, port];
      const entry = {x: port.x + 40, y: port.y};
      const dx = entry.x - hub.x, dyy = entry.y - hub.y, Lh = Math.hypot(dx, dyy) || 1;
      const ux = dx / Lh, uy = dyy / Lh;
      const tt = Math.min(HUB.w / 2 / Math.max(Math.abs(ux), 1e-6), HUB.h / 2 / Math.max(Math.abs(uy), 1e-6));
      return roundCorners([{x: hub.x + ux * tt, y: hub.y + uy * tt}, entry, port], 34);
    };
  };
  const links = items.map((it, i) => (it.kind === 'window' ? linkLine(ctx, {name: `link${i}`, pts: linkPts(it.route.slot)(0)}) : null));
  const focusLink = fw ? linkPts(beforeSlot) : () => [{x: 0, y: 0}, {x: 0, y: 0}];
  // ---- the inspected stack: label chip above the window, datum chip (+ dock) below it (design units, full scale)
  const colW = (fw ? fw.box.w + WALL + 42 : 200) * k;
  // the chips keep to the window column (up to 6 lines); only when a text cannot fit there do they reach into the room
  const stackArgs = {F, px, labelText: focusRoute ? focusRoute.label : fiSeat.label, before: p.beforeValue, after: p.afterValue, was: ctx.t.was, showKey, moves};
  let stack = focusStack(ctx, {...stackArgs, maxW: Math.max(colW - 8, 150 / px)});
  if (stack.problem) stack = focusStack(ctx, {...stackArgs, maxW: Math.max(colW - 8 + 110 * k, 150 / px)});
  if (stack.problem) problems.push(stack.problem);
  const tileC = fw ? {x: fw.box.x + fw.box.w / 2, y: fw.box.y + fw.box.h / 2} : {...G.slots[beforeSlot]};
  const tileTopD = fw ? toD({x: tileC.x, y: fw.box.y}) : toD({x: tileC.x, y: tileC.y - 50});
  const tileBotD = fw ? toD({x: tileC.x, y: fw.box.y + fw.box.h}) : toD({x: tileC.x, y: tileC.y + 50});
  const colLeft = toD({x: G.extents.x, y: 0}).x + 4;
  stack.place({cx: tileTopD.x, top: tileTopD.y, bottom: tileBotD.y, minX: colLeft});
  // the stack must stay clear of the other windows and of every person, at both places
  const stackAt = o2 => stack.boxes().map(b => ({...b, y: b.y + o2}));
  const stackBoxes = [0, dyT * k].flatMap(stackAt);
  const focusPerson = fw ? toD(fw.seat) : null;
  const othersD = items.map((it, i) => (i === fi ? null : toD(seatPt[i]))).filter(Boolean);
  if (showKey && stackBoxes.some(b => othersD.some(q => overlaps(b, {x: q.x - rad, y: q.y - rad, w: 2 * rad, h: 2 * rad}, 2)))) problems.push('stack-people');
  if (showKey && stackBoxes.some(b => usedWin.filter(s => s !== beforeSlot).some(s => overlaps(b, pf.mapBox(G.win[s].box), 2)))) problems.push('stack-window');
  // (the stack moves with its window: compare it with its own participant at the same place only)
  if (showKey && fw && [0, dyT * k].some(o => stackAt(o).some(b => overlaps(b, {x: focusPerson.x - rad, y: focusPerson.y + o - rad, w: 2 * rad, h: 2 * rad}, 2)))) problems.push('stack-self');
  // ---- the other labels, door caption, room name
  const furnAll = furnitureBoxes(G);
  const occupied = new Set(items.filter(it => it.kind === 'room').map(it => it.route.slot));
  const hard = furnAll.filter(f => f.kind === 'desk' || f.kind === 'table' || f.kind === 'plant').map(pf.mapBox);
  const hardAlways = furnAll.filter(f => f.kind === 'chair' && !occupied.has(f.slot)).map(pf.mapBox);
  const furn = furnAll.filter(f => f.kind !== 'chair' || !occupied.has(f.slot)).map(pf.mapBox);
  const screens = Object.values(G.win).map(w => pf.mapBox(w.inner));
  const everyone = items.map((it, i) => bodyBox(toD(seatPt[i]), seatPt[i].deg || 0, rad));
  if (fw) everyone.push({...toD({x: fw.seat.x, y: fw.seat.y + dyT}), rad});
  const linkPathsD = [...items.filter((it, i) => it.kind === 'window' && i !== fi).map(it => linkPts(it.route.slot)(0).map(toD)), ...(fw ? [focusLink(0).map(toD), focusLink(dyT).map(toD)] : [])];
  const seatPoints = [...Object.values(G.slots).map(toD), ...Object.values(G.win).map(w => toD(w.seat))];
  const roomBox = pf.mapBox({x: 4, y: 4, w: RW - 8, h: RH - 8});
  const extra = showKey ? stackBoxes.slice() : [];
  const labels = routes.map(() => null);
  const common = {size: F, minSize: F, maxWidth: 330 / px, maxLines: 3, maxGap: 36 / px, pathPad: rad * 0.5, seatPoints, hard, hardAlways};
  if (showKey && !cheap) {
    const roomIdx = items.map((it, i) => i).filter(i => i !== fi && items[i].kind === 'room');
    const winIdx = items.map((it, i) => i).filter(i => i !== fi && items[i].kind === 'window');
    if (roomIdx.length) {
      const res = placeSeatLabels(ctx, {...common, items: roomIdx.map(i => ({key: `s${i}`, text: routes[i].label, at: toD(seatPt[i]), rad, avoidPaths: linkPathsD})), people: everyone, furniture: [...furn, ...screens], bounds: roomBox, extra});
      res.labels.forEach((lb, j) => { labels[roomIdx[j]] = lb; extra.push(lb.box); });
      problems.push(...res.fails.map(f => `lab-${f}`));
    }
    if (winIdx.length) {
      const E = G.extents;
      const res = placeSeatLabels(ctx, {...common, items: winIdx.map(i => ({key: `s${i}`, text: routes[i].label, at: toD(seatPt[i]), rad, avoidPaths: linkPathsD})), people: everyone, furniture: [...furn, ...screens], bounds: pf.mapBox({x: E.x, y: E.y, w: -E.x - 2, h: E.h}), extra});
      res.labels.forEach((lb, j) => { labels[winIdx[j]] = lb; extra.push(lb.box); });
      problems.push(...res.fails.map(f => `lab-${f}`));
    }
  }
  let doorChip = null;
  if (showAll && !cheap) {
    const at = toD({x: (G.mainDoor.a + G.mainDoor.b) / 2, y: G.H + WALL / 2});
    const corr = pf.mapBox({x: 4, y: G.H + WALL + 4, w: G.W - 8, h: G.cw - 8});
    const res = placeSeatLabels(ctx, {items: [{key: 'door', text: p.labels.mainDoor, at, rad: 10}], people: everyone, furniture: [], bounds: corr, size: F, minSize: F, maxWidth: Math.min(300 / px, corr.w), maxLines: 3, maxGap: 220, extra});
    if (res.fails.length) problems.push('door');
    doorChip = res.labels[0];
    extra.push(doorChip.box);
  }
  let roomChip = null;
  if (showKey && !cheap) {
    const ropts = {maxWidth: Math.max(240 / px, Math.min(380 / px, roomBox.w * 0.4)), size: F, minSize: F, maxLines: 3, fill: th.card, stroke: th.accent2};
    const probe = gchip(ctx, p.courts.room, {x: 0, y: 0, ...ropts});
    const spot = placeFree({w: probe.box.w, h: probe.box.h, bounds: roomBox, people: everyone, extra, paths: linkPathsD, pathPad: rad * 0.6, furniture: furn, prefer: 'bottom-left'});
    if (!spot) problems.push('room');
    const at = spot || {x: roomBox.x, y: roomBox.y};
    roomChip = gchip(ctx, p.courts.room, {x: at.x, y: at.y, ...ropts, name: 'room-name'});
    extra.push(roomChip.box);
  }
  // ---- the crop (the lens's source): the window column around both places, the stack and the end of the link
  // two crops are tried: 'wide' (the whole link, from the bench hub) and 'narrow' (the window column and the link's
  // entry); the one that gives the better lens wins
  const cropOf = wide => {
    const cropParts = [];
    if (fw) {
      cropParts.push(pf.mapBox({x: fw.box.x, y: fw.box.y, w: fw.box.w, h: fw.box.h + dyT}));
      const hub = G.hubs[fw.side];
      if (wide) cropParts.push(pf.mapBox({x: fw.port.x, y: hub.y - HUB.h, w: hub.x + HUB.w - fw.port.x, h: Math.max(fw.port.y + dyT, hub.y) - hub.y + HUB.h * 2}));
      else cropParts.push(pf.mapBox({x: fw.port.x, y: fw.port.y - 10, w: 40 + WALL + 40, h: dyT + 20}));
    } else {
      const s0 = toD(G.slots[beforeSlot]);
      cropParts.push({x: s0.x - rad * 1.2, y: s0.y - rad * 1.2, w: rad * 2.4, h: rad * 2.4});
    }
    if (showKey) cropParts.push(...stackBoxes);
    const cx0 = Math.min(...cropParts.map(b => b.x)) - 12, cy0 = Math.min(...cropParts.map(b => b.y)) - 12;
    const cx1 = Math.max(...cropParts.map(b => b.x + b.w)) + 12, cy1 = Math.max(...cropParts.map(b => b.y + b.h)) + 12;
    return {x: cx0, y: cy0, w: cx1 - cx0, h: cy1 - cy0};
  };
  const cW = cropOf(true), cN = cropOf(false);
  // (a grown crop stays within the plan and the inspected chips)
  const contentRect = (() => { const bs = [planRect, ...(showKey ? stackBoxes : [])]; const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)); return {x: x0, y: y0, w: Math.max(...bs.map(b => b.x + b.w)) - x0, h: Math.max(...bs.map(b => b.y + b.h)) - y0}; })();
  // … and two in between (the link's first stretch from the window)
  const crops = [cW, cN, ...[0.35, 0.65].map(f => ({...cN, w: cN.w + (cW.x + cW.w - cN.x - cN.w) * f, y: Math.min(cN.y, cW.y), h: Math.max(cN.y + cN.h, cW.y + cW.h) - Math.min(cN.y, cW.y)}))];
  // ---- context shrink and lens place: the plan shrinks towards its far side; the lens opens in the freed space
  // beside the window column. People >= 45 px, the context >= 47 % of the width, the lens >= 1.6× and >= 35 % of
  // the short side; the largest lens wins.
  const zoomMax = p.detailGeometry.zoom;
  // (the frame, in design units, is wider than the design box, which sits in the caption-safe area)
  const frameW = ctx.view.width / ((px * Math.min(ctx.view.width, ctx.view.height)) / 1080);
  const ctxMinW = Math.max(D.w * 0.5, frameW * 0.455);
  let pick = null;
  const sMin = 46 / personPx;
  const farX = rg.flow === 'column' ? D.w : planBox.x + planBox.w; // (column) the plan may slide over the panel, which steps aside
  for (const sT of [0.8, 0.78, 0.76, 0.74, 0.72, 0.7, 0.68, 0.66, 0.64, 0.62, 0.6, 0.58, 0.56, 0.54, 0.52, 0.5].filter(v => v >= sMin)) {
    const w2 = planRect.w * sT, h2 = planRect.h * sT;
    if (w2 < ctxMinW) continue; // the context keeps >= half the safe width and >= 0.45 of the frame (LAW-0688 pattern)
    const opts = [];
    // beside: the plan slides to its far side (over the panel column, which steps aside, when needed); the lens
    // takes the freed space on the window side
    for (const far of rg.flow === 'column' ? [planBox.x + planBox.w, farX] : [farX]) {
      const at = {x: far - w2, y: planBox.y + (planBox.h - h2) / 2};
      opts.push({at, reg: {x: 0, y: planBox.y, w: at.x - 26, h: planBox.h}, over: far > planBox.x + planBox.w + 1});
    }
    // below: the plan stays at the top of its area; the lens takes the freed band under it
    {
      const at = {x: planBox.x, y: planBox.y};
      const top = at.y + h2 + 26;
      opts.push({at, reg: {x: 0, y: top, w: rg.flow === 'column' ? D.w : planBox.w, h: planBox.y + planBox.h - top}, over: rg.flow === 'column'});
    }
    for (const o2 of opts) for (const crop0 of crops) {
      const {at, reg, over} = o2;
      if (reg.w < 60 || reg.h < 60) continue;
      let crop = crop0;
      let zAbs = Math.min(zoomMax * sT, (reg.w - 12) / crop.w, (reg.h - 12) / crop.h);
      // a small detail at the magnification cap: the source frame grows around it (same magnification) towards
      // the region's shape, inside the plan
      if (zAbs >= zoomMax * sT - 1e-9) {
        const tw = Math.min(planRect.w, (reg.w - 12) / zAbs), th2 = Math.min(planRect.h, (reg.h - 12) / zAbs);
        const w3 = Math.max(crop.w, tw), h3 = Math.max(crop.h, th2);
        const cr = contentRect;
        crop = {x: clamp(crop.x + crop.w / 2 - w3 / 2, Math.min(cr.x, crop.x), Math.max(cr.x + cr.w, crop.x + crop.w) - w3), y: clamp(crop.y + crop.h / 2 - h3 / 2, Math.min(cr.y, crop.y), Math.max(cr.y + cr.h, crop.y + crop.h) - h3), w: w3, h: h3};
        zAbs = Math.min(zoomMax * sT, (reg.w - 12) / crop.w, (reg.h - 12) / crop.h);
      }
      const rel = zAbs / sT;
      // the larger lens wins, and the pair (shrunk plan + lens) should fill the frame (LAW-0688: >= 80 %)
      const lw = crop.w * zAbs, lh = crop.h * zAbs;
      const lx = reg.x + (reg.w - lw) / 2, ly = reg.y + (reg.h - lh) / 2;
      const ux = Math.min(at.x, lx), uy = Math.min(at.y, ly, band ? 0 : at.y), ux1 = Math.max(at.x + w2, lx + lw), uy1 = Math.max(at.y + h2, ly + lh);
      const cover = ((ux1 - ux) * (uy1 - uy)) / (D.w * D.h);
      const score = lw * lh * (0.5 + cover) - (over ? lw * lh * 0.1 : 0);
      const lensShort = Math.min(crop.w, crop.h) * zAbs * px;
      const cand = {sT, at, reg, zAbs, rel, over, crop, good: rel >= 1.52 && lensShort >= 0.35 * 1080 && cover >= 0.8, score};
      if (!pick || (cand.good && !pick.good) || (cand.good === pick.good && cand.score > pick.score)) pick = cand;
    }
  }
  if (!pick) {
    problems.push('lens');
    pick = {sT: 0.6, at: {x: planBox.x + planBox.w * 0.4, y: planBox.y}, reg: {x: 0, y: 0, w: planBox.w * 0.38, h: D.h}, zAbs: 1, rel: 1.6, over: false, good: false, crop: crops[1]};
  }
  const crop = pick.crop;
  if (!pick.good) problems.push('lens-small');
  const {sT, zAbs: zoom} = pick;
  const offT = {x: pick.at.x - planRect.x * sT, y: pick.at.y - planRect.y * sT};
  const dw = crop.w * zoom, dh = crop.h * zoom;
  const dest = {x: pick.reg.x + (pick.reg.w - dw) / 2, y: pick.reg.y + (pick.reg.h - dh) / 2, w: dw, h: dh};
  const wtT = q => ({x: offT.x + q.x * sT, y: offT.y + q.y * sT});
  const wtB = b => ({...wtT(b), w: b.w * sT, h: b.h * sT});
  const cropShrunk = wtB(crop), planShrunk = wtB(planRect);
  if (overlaps(dest, planShrunk, 4)) problems.push('lens-place');
  const stackInCrop = !showKey || stackBoxes.every(b => b.x >= crop.x && b.y >= crop.y && b.x + b.w <= crop.x + crop.w && b.y + b.h <= crop.y + crop.h);
  // ---- the lens copy: pieces wholly inside the crop only
  const inCrop = b => b.x >= crop.x && b.y >= crop.y && b.x + b.w <= crop.x + crop.w && b.y + b.h <= crop.y + crop.h;
  const lzTiles = usedWin.filter(s => s === beforeSlot || inCrop(pf.mapBox(G.win[s].box))).map(s => ({slot: s, node: windowArt(ctx, G, s, {name: `lz-win-${s}`})}));
  const lzShow = items.map((it, i) => {
    if (i === fi) return true;
    const c = toD(seatPt[i]);
    return inCrop({x: c.x - rad, y: c.y - rad, w: 2 * rad, h: 2 * rad}) && (it.kind === 'room' || lzTiles.some(t => t.slot === it.route.slot));
  });
  // (a room chair whose occupant is not wholly inside the crop is left out too, so no lens label or chair stands empty)
  const hiddenSeats = items.map((it, i) => (it.kind === 'room' && !lzShow[i] ? G.slots[it.route.slot] : null)).filter(Boolean);
  const lzRoom = roomArt(ctx, G, {prefix: 'lzrm', rings: [], keep: b => inCrop(pf.mapBox(b)) && !hiddenSeats.some(q => Math.abs(b.x + 34 - q.x) < 0.01 && Math.abs(b.y + 34 - q.y) < 0.01 && b.w === 68)});
  const lzPeople = routes.map((rt, i) => (lzShow[i] ? planPerson(ctx, {name: `lz-p${i}`, look: rt.look}) : null));
  const lzLinks = items.map((it, i) => (it.kind === 'window' && (i === fi || lzTiles.some(t => t.slot === it.route.slot)) ? linkLine(ctx, {name: `lz-link${i}`, pts: linkPts(it.route.slot)(0)}) : null));
  const lzChips = [];
  labels.forEach((lb, i) => { if (lb && lzShow[i] && inCrop(lb.box)) lzChips.push({name: `lz-lab${i}`, L: lb, owner: `lz-p${i}`}); });
  // ---- panel (building, names, key, context caption, marker note)
  const mR = Math.max(15, F * 0.75);
  const panel = infoPanel(ctx, {F, box: panelBox, band, p, showKey, mR});
  if (panel.problem) problems.push(panel.problem);
  // ---- guides: from the source frame's corners (shrunk context) to the lens corners facing it
  const corners = b => [{x: b.x, y: b.y}, {x: b.x + b.w, y: b.y}, {x: b.x + b.w, y: b.y + b.h}, {x: b.x, y: b.y + b.h}];
  const cs = corners(cropShrunk), cd = corners(dest);
  const heads = items.map((it, i) => { const c = wtT(toD(seatPt[i])); const hr = rad * sT * 0.7; return {x: c.x - hr, y: c.y - hr, w: 2 * hr, h: 2 * hr}; });
  const segClear = (a, b2) => {
    for (let i = 2; i < 38; i++) {
      const q = {x: lerp(a.x, b2.x, i / 40), y: lerp(a.y, b2.y, i / 40)};
      if ([...heads, ...(pick.over ? [] : panel.textBoxes)].some(o => q.x > o.x - 3 && q.x < o.x + o.w + 3 && q.y > o.y - 3 && q.y < o.y + o.h + 3)) return false;
    }
    return true;
  };
  let guides = [[0, 1], [3, 2]].map(([i, j]) => ({a: cs[i], b: cd[j]}));
  let guidesClear = guides.every(gd => segClear(gd.a, gd.b));
  if (!guidesClear) {
    const alt = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (segClear(cs[i], cd[j])) alt.push({a: cs[i], b: cd[j]});
    if (alt.length) { guides = alt.slice(0, 2); guidesClear = true; } else problems.push('guides');
  }
  // ---- marker (Δ) beside the datum chip at the hold (after place), off heads and chips
  const vb = stack.valueBox(dyT * k);
  const mCands = [{x: vb.x + vb.w + mR + 6, y: vb.y + vb.h / 2}, {x: vb.x - mR - 6, y: vb.y + vb.h / 2}, {x: vb.x + vb.w / 2, y: vb.y + vb.h + mR + 6}];
  const headsFull = items.map((it, i) => (i === fi ? toD({x: fw ? fw.seat.x : seatPt[i].x, y: (fw ? fw.seat.y : seatPt[i].y) + dyT}) : toD(seatPt[i])));
  const mOk = q => q.x - mR > 0 && q.y - mR > 0 && q.x + mR < D.w && headsFull.every(hd => Math.hypot(q.x - hd.x, q.y - hd.y) > rad + mR)
    && !extra.filter(b => !stackBoxes.includes(b)).some(b => overlaps({x: q.x - mR, y: q.y - mR, w: 2 * mR, h: 2 * mR}, b, 4));
  const markerAt = showKey ? (mCands.find(mOk) || mCands[0]) : mCands[0];
  const markerClear = mOk(markerAt);
  if (showKey && !markerClear) problems.push('marker');
  const marker = changedMarker(ctx, {name: 'cx-marker', x: markerAt.x, y: markerAt.y, radius: mR, opacity: 0});
  const seatNames = items.map(it => (it.kind === 'room' ? `rm-chair-${it.route.slot}` : `win-${it.route.slot}`));
  return {
    F, px, k, D, G, pf, planRect, room, lzRoom, tiles, lzTiles, people, lzPeople, lzShow, links, lzLinks, items, seatPt, labels, lzChips, doorChip, roomChip, stack, marker, panel,
    crop, dest, zoom, guides, guidesClear, sT, offT, cropShrunk, planShrunk, lensOverPanel: pick.over, personPx, rad, fi, moves, beforeSlot, afterSlot, focusSlot: beforeSlot,
    dyT, tileC, stackUnion: showKey && stack.boxes().length ? (() => { const bs = stack.boxes(); const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)); return {x: x0, y: y0, w: Math.max(...bs.map(b => b.x + b.w)) - x0, h: Math.max(...bs.map(b => b.y + b.h)) - y0}; })() : null, hasFocusTile: Boolean(fw), focusSeat: fw ? fw.seat : seatPt[fi], focusLink, portY: fw ? fw.port.y : 0, stackInCrop, markerClear, seatNames, problems,
  };
}

/**
 * The inspected stack, in design units at full scale, anchored to the window: the participant's label chip above
 * it (never replaced), the datum chip under it (before → after) and, under that, the dock for the struck old value.
 * Drawn twice (context copy 'cx' and lens copy 'lz'); both move with the window (frame(u, dyDesign)).
 */
function focusStack(ctx, o) {
  const th = ctx.theme;
  const {F} = o;
  const maxW = o.maxW;
  const lab = o.showKey ? fitWords(glue(o.labelText), {maxWidth: maxW - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  const dBefore = o.showKey ? fitWords(glue(o.before), {maxWidth: maxW - F * 1.2, size: F, minSize: F, maxLines: 6, weight: 500}) : null;
  const dAfter = o.showKey ? fitWords(glue(o.after), {maxWidth: maxW - F * 1.2, size: F, minSize: F, maxLines: 6, weight: 500}) : null;
  const wasFit = o.showKey ? fitWords(glue(`${o.was}: ${o.before}`), {maxWidth: maxW - F * 1.2, size: F, minSize: F, maxLines: 6, weight: 500}) : null;
  const padX = F * 0.6, padY = F * 0.38;
  const chipH = f => (f ? f.height + padY * 2 : 0);
  const chipW = f => (f ? f.width + padX * 2 : 0);
  const problem = [lab, dBefore, dAfter, wasFit].some(f => f && f.truncated) ? 'stack-trunc' : null;
  const gap = F * 0.3;
  let geo = null;
  const textEl = (fit, x, y, fill, name) => h('text', {name, x: r(x), y: r(y + fit.size * 0.8), 'font-family': FONT, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'text-anchor': 'middle', fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
  const strikeLines = (fit, cx, y, name, col, wdt) => fit.lines.map((ln, i) => {
    const lw = ctx.measure(ln, fit.size, fit.weight, 'sans');
    const yy = y + i * fit.lineHeight + fit.size * 0.45;
    return h('line', {name: name ? `${name}${i}` : undefined, x1: r(cx - lw / 2), x2: r(name ? cx - lw / 2 : cx + lw / 2), y1: r(yy), y2: r(yy), stroke: col, 'stroke-width': wdt, 'stroke-linecap': 'round'});
  });
  return {
    problem,
    place({cx, top, bottom, minX}) {
      if (!o.showKey) { geo = {lb: {x: cx, y: top, w: 0, h: 0}, vb: {x: cx, y: bottom, w: 0, h: 0}, kb: {x: cx, y: bottom, w: 0, h: 0}}; return; }
      const wL = chipW(lab), hL = chipH(lab);
      const wV = Math.max(chipW(dBefore), chipW(dAfter)), hV = Math.max(chipH(dBefore), chipH(dAfter));
      const wK = chipW(wasFit), hK = chipH(wasFit);
      const X = (w2) => Math.max(minX, cx - w2 / 2);
      geo = {
        lb: {x: X(wL), y: top - 8 - hL, w: wL, h: hL},
        vb: {x: X(wV), y: bottom + 8, w: wV, h: hV},
        kb: {x: X(wK), y: bottom + 8 + hV + gap, w: wK, h: hK},
      };
    },
    // (the struck old chip travels into the dock: its end position is part of the stack too)
    boxes() { return o.showKey ? [geo.lb, geo.vb, geo.kb, {x: geo.kb.x + geo.kb.w / 2 - geo.vb.w / 2, y: geo.kb.y, w: geo.vb.w, h: geo.vb.h}] : []; },
    valueBox(dyD = 0) { return {...geo.vb, y: geo.vb.y + dyD}; },
    node(P) {
      if (!o.showKey) return null;
      const {lb, vb, kb} = geo;
      const labelChip = g({name: `${P}-label`},
        h('path', {name: `${P}-label-body`, d: roundRectPath(lb.x, lb.y, lb.w, lb.h, Math.min(lb.h / 2, F * 0.7)), fill: th.card, stroke: th.ink, 'stroke-width': 2.2}),
        textEl(lab, lb.x + lb.w / 2, lb.y + (lb.h - lab.height) / 2, th.ink));
      const valueOld = g({name: `${P}-old`},
        h('path', {name: `${P}-old-body`, d: roundRectPath(vb.x, vb.y, vb.w, vb.h, Math.min(vb.h / 2, F * 0.7)), fill: th.card, stroke: th.inkSoft, 'stroke-width': 2.2}),
        g({name: `${P}-old-text`}, textEl(dBefore, vb.x + vb.w / 2, vb.y + (vb.h - dBefore.height) / 2, th.ink)),
        strikeLines(dBefore, vb.x + vb.w / 2, vb.y + (vb.h - dBefore.height) / 2, `${P}-strike`, th.ink, Math.max(2.4, F * 0.1)));
      const valueNew = g({name: `${P}-new`, opacity: 0},
        h('path', {name: `${P}-new-body`, d: roundRectPath(vb.x, vb.y, vb.w, vb.h, Math.min(vb.h / 2, F * 0.7)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
        textEl(dAfter, vb.x + vb.w / 2, vb.y + (vb.h - dAfter.height) / 2, th.ink));
      const dockChip = g({name: `${P}-dock`, opacity: 0},
        h('path', {d: roundRectPath(kb.x, kb.y, kb.w, kb.h, Math.min(kb.h / 2, F * 0.7)), fill: th.paperShade, stroke: th.inkFaint, 'stroke-width': 1.8}),
        textEl(wasFit, kb.x + kb.w / 2, kb.y + (kb.h - wasFit.height) / 2, th.inkSoft),
        strikeLines(wasFit, kb.x + kb.w / 2, kb.y + (kb.h - wasFit.height) / 2, null, th.inkSoft, 2));
      // label and value move with the window; the dock too (it is the old datum of the same window)
      return g({name: `${P}-stack`}, g({name: `${P}-move`}, labelChip, valueOld, dockChip, valueNew));
    },
    frame(u, dyD) {
      const out = {};
      if (!o.showKey) return out;
      const {vb, kb} = geo;
      const strike = ease.inOutSine(seg(u, ...W.strike));
      const dock = ease.inOutCubic(seg(u, ...W.dock));
      const newIn = seg(u, ...(o.moves ? W.newIn : W.newInStill));
      for (const P of ['cx', 'lz']) {
        out[`${P}-move`] = {transform: T(0, dyD)};
        dBefore.lines.forEach((ln, i) => {
          const lw = ctx.measure(ln, dBefore.size, dBefore.weight, 'sans');
          const cx = vb.x + vb.w / 2;
          out[`${P}-strike${i}`] = {x2: r(lerp(cx - lw / 2, cx + lw / 2, strike)), opacity: strike > 0 ? 1 : 0};
        });
        const tx = (kb.x + kb.w / 2) - (vb.x + vb.w / 2), ty = kb.y - vb.y;
        out[`${P}-old`] = {transform: T(tx * dock, ty * dock), opacity: dock >= 1 ? 0 : 1};
        out[`${P}-old-text`] = {opacity: r(1 - 0.45 * dock, 3)};
        out[`${P}-dock`] = {opacity: dock >= 1 ? 1 : 0};
        out[`${P}-new`] = {opacity: r(newIn, 3)};
      }
      return out;
    },
  };
}

/** Panel: small building + names, key, context caption and the marker note (Δ repeated). */
function infoPanel(ctx, o) {
  const th = ctx.theme;
  const {F, box, band, p, showKey, mR} = o;
  const parts = [];
  const textBoxes = [];
  let problem = null;
  const txt = (f, x, y, fill, weight, italic) => h('text', {x: r(x), y: r(y + f.size * 0.8), 'font-family': FONT, 'font-size': r(f.size, 2), 'font-weight': weight, 'font-style': italic ? 'italic' : undefined, fill}, f.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(f.lineHeight, 2)}, ln)));
  const bh = band ? Math.min(box.h * 0.9, 200) : Math.min(box.w * 0.8, 220, box.h * 0.34);
  const bw = bh * 0.95;
  const bx = band ? box.x : box.x + (box.w - bw) / 2;
  parts.push(buildingElevation(ctx, {name: 'pan-bld', x: bx, y: box.y, w: bw, h: bh, highlight: {floor: 1, bay: 3}, tree: false}).node);
  const tx = band ? box.x + bw + 26 : box.x, tw = band ? box.w - bw - 26 : box.w;
  let y = band ? box.y : box.y + bh + F * 0.8;
  const items = showKey ? [
    {text: `${p.courts.building} · ${p.courts.room}`, weight: 600, fill: th.fg},
    {text: p.labels.key, weight: 500, fill: th.fgSoft, italic: true},
    p.contextLabels.context ? {text: p.contextLabels.context, weight: 500, fill: th.fgSoft, name: 'ctx-caption'} : null,
    p.contextLabels.marker ? {text: p.contextLabels.marker, weight: 600, fill: th.fg, name: 'marker-note', marker: true} : null,
  ].filter(Boolean) : [];
  const groups = {};
  for (const it of items) {
    const indent = it.marker ? mR * 2 + 12 : 0;
    const f = fitWords(glue(it.text), {maxWidth: tw - indent, size: F, minSize: F, maxLines: 5, weight: it.weight});
    if (f.truncated) problem = 'panel';
    const node = txt(f, tx + indent, y, it.fill, it.weight, it.italic);
    textBoxes.push({x: tx + indent, y, w: f.width, h: f.height});
    if (it.name) groups[it.name] = g({name: it.name, opacity: 0}, it.marker ? changedMarker(ctx, {x: tx + mR * 0.85, y: y + F * 0.55, radius: mR * 0.85}) : null, node);
    else parts.push(node);
    y += f.height + F * 0.7;
  }
  if (y - F * 0.7 > box.y + box.h + 2) problem = 'panel';
  return {
    node: g({name: 'panel'}, parts, groups['ctx-caption'], groups['marker-note']),
    problem,
    textBoxes,
    frame: u => ({
      ...(groups['ctx-caption'] ? {'ctx-caption': {opacity: r(seg(u, ...W.caption), 3)}} : {}),
      ...(groups['marker-note'] ? {'marker-note': {opacity: r(seg(u, W.marker[0] + 0.01, W.marker[1] + 0.01), 3)}} : {}),
    }),
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-04-inspect',
    title: 'Physical and remote room — inspecting one supplied window place and its link',
    titleEs: 'Sala física y remota — Inspección y cambio de un dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Sala física y remota',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The plan of a generic hearing room, everyone in place and the bench linked to a remote window, is the context. It shrinks aside while a lens enlarges a real copy of the window column: the window, the free place below it, its solid link, the participant label and the supplied window datum. The old value is struck and docked as "was: …", the screen slides to the supplied free place with its participant and the link re-attaches (or, for a label substitution, only the value changes). The plan grows back; a neutral Δ marks the change; seeking back restores the old datum. No permission, validity or outcome is inferred.',
    tags: ['inspect', 'lens', 'floor plan', 'remote window', 'link', 'substitution', 'changed marker', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/sala-fisica-remota.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/markers.js', 'src/animations/roles/kits/mediation-labels.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
