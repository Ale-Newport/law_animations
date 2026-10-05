/**
 * LAW-0214 — Sala física y remota · mechanism
 *
 * Storyboard (an exploded plan of the connection, not a row of boxes: the
 * generic building front on one side, the plan of the hearing room in the
 * middle with the participants who appear in it, the bench — the judicial
 * table with its link hubs — lifted out of the room above its platform, and
 * the remote windows set apart beside the room):
 *  0.00–0.18  separate: the four components start assembled (the bench on its
 *             platform, the windows against the room wall, the building behind
 *             the room) and slide apart to their places; everyone in them is
 *             drawn whole, opaque and at one size.
 *  0.18–0.43  relate: only the SUPPLIED relationships are drawn, one by one,
 *             anchored to the component edges and styled by kind (relation =
 *             plain solid line with end dots, never an arrow; sequence = arrow;
 *             communication = dashed arrow; causal only when supplied), each
 *             with its own label beside it. When a supplied relationship joins
 *             the bench and the windows, its line is the connection: as it
 *             lands, the windows' camera dots light and the participants shown
 *             in them take their seats.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order along the
 *             drawn relationships (straight hops where none is supplied); the
 *             focus component enlarges while it passes.
 *  0.75–1.00  gather: origin (the building), connection (the drawn lines) and
 *             state (everyone in place) stay visible with a legend of the
 *             connection kinds and the key "as supplied · no conclusion drawn".
 * Where each participant appears is only shown as supplied; no permission,
 * validity, equivalence, procedure or outcome is shown.
 * @module animations/courts/LAW-0214
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor} from '../../core/geometry.js';
import {str, list, obj, oneOf, RELATION_KINDS} from '../../schemas/fields.js';
import {LINK_STYLES, connector, tracer} from '../../primitives/annotate.js';
import {LINK_COLOR} from './kits/sala-fisica-remota.js';
import {planColors, floorArea, wallRing, planPlatform, planTable, planChair, planPlant, planPerson, buildingElevation} from './kits/courts-art.js';
import {
  sfrFields, SFR_EN, resolveSfr, sfrGeometry, windowArt, linkHub, camLit, remotePose, placeSeatLabels, seatLabelNode, sideCaption, bodyBox,
  gchip, glue, fitWords, pxPerUnit, overlaps, R2, PERSON_RAD, WALL,
} from './kits/sala-fisica-remota.js';

const ID = 'LAW-0214';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {slide: [0.02, 0.15], relate: [0.2, 0.39], trace: [0.45, 0.72], legend: [0.75, 0.81]};
const EL = ['building', 'room', 'bench', 'windows'];
const FONT = "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif";
/** Colour per relation kind in this scene (plain relations in the dark link colour, so a supplied link reads clearly). */
const kindColor = (ctx, kind) => (kind === 'communication' ? ctx.theme.accent2 : kind === 'sequence' ? ctx.theme.fg : kind === 'causal' ? ctx.theme.accent : LINK_COLOR);
const ROOM = {W: 640, H: 470};

const STRINGS = {
  en: {kinds: 'Connections'},
  es: {kinds: 'Conexiones'},
};

const relationship = obj('A supplied relationship between two components', {
  from: oneOf('Source component', EL),
  to: oneOf('Target component', EL),
  kind: oneOf('relation | communication | sequence | causal (causal only when the author supplies it)', RELATION_KINDS),
  label: str('Label drawn beside the connector (as supplied; empty = the caption of its kind)', 50),
}, ['from', 'to', 'kind']);

const sceneSchema = {
  ...sfrFields,
  // (no corridor or door is drawn in this exploded plan: only the neutral key is a built-in label here)
  labels: obj('Editable built-in captions', {key: str('Neutral key shown with the labels (must say that no conclusion is drawn)', 90)}),
  elements: list('Component captions; ids are fixed by the scene (building, room, bench, windows), captions are editable', obj('Component', {
    id: oneOf('Component id', EL),
    label: str('Visible caption', 50),
  }, ['id', 'label']), 4, 4),
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when supplied). A relationship between the bench and the windows is drawn as their connection', relationship, 1, 6),
  focusElement: oneOf('Component enlarged while the tracer passes', EL),
  relationLabels: obj('Caption used for each relation kind (legend, and connectors without their own label)', {
    relation: str('Caption for plain relations', 40),
    communication: str('Caption for communications', 40),
    sequence: str('Caption for sequence links', 40),
    causal: str('Caption for supplied causal links', 40),
  }),
  traversalOrder: list('Order in which the tracer visits components', oneOf('Component id', EL), 2, 8),
};

const defaultParams = {
  ...SFR_EN,
  labels: {key: SFR_EN.labels.key},
  elements: [
    {id: 'building', label: 'Building'},
    {id: 'room', label: 'Hearing room'},
    {id: 'bench', label: 'Bench with link hubs'},
    {id: 'windows', label: 'Remote windows'},
  ],
  relationships: [
    {from: 'building', to: 'room', kind: 'relation', label: 'contains'},
    {from: 'room', to: 'bench', kind: 'relation', label: 'holds'},
    {from: 'bench', to: 'windows', kind: 'relation', label: 'linked (as supplied)'},
  ],
  focusElement: 'bench',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['building', 'room', 'bench', 'windows'],
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    let best = null;
    const log = [];
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const legF of ctx.view.shape === 'landscape' ? [0.2, 0.24, 0.28] : ctx.view.shape === 'square' ? [0.24, 0.28, 0.32] : [0.2, 0.24, 0.28]) {
        const L = compose(ctx, p, v / px, px, legF);
        log.push(`${v}/${legF}:k${L.k.toFixed(2)}:${L.problems.join('+')}`);
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.personPx > pick.personPx + 0.5)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    best.log = log.slice(-12);
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({name: 'el-building'}, L.building.node, L.caps.building && g({name: 'cap-w-building', opacity: 0}, L.caps.building.node)),
      g({name: 'el-room'},
        g({transform: T(L.pos.room.x, L.pos.room.y, 0, L.k)}, L.roomNode, L.roomPeople.map(pp => pp.node)),
        L.roomLabels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `rlab${i}`, size: L.F, owner: `rp${i}`, seat: `m-chair-${L.roomItems[i].route.slot}`})),
        L.caps.room && g({name: 'cap-w-room', opacity: 0}, L.caps.room.node)),
      g({name: 'el-bench'},
        g({transform: T(L.pos.bench.x, L.pos.bench.y, 0, L.k)}, L.benchNode, L.benchPerson && L.benchPerson.node),
        L.benchLabel && seatLabelNode(ctx, L.benchLabel, {name: 'blab', size: L.F, owner: 'bp', seat: 'm-bench-chair'}),
        L.caps.bench && g({name: 'cap-w-bench', opacity: 0}, L.caps.bench.node)),
      g({name: 'el-windows'},
        g({transform: T(L.pos.windows.x, L.pos.windows.y, 0, L.k)},
          // one quiet solid outline groups the windows so a relationship to 'windows' lands on a drawn edge
          L.tiles.length > 1 && h('rect', {name: 'windows-group', x: L.winB.x - 7, y: L.winB.y - 7, width: L.winB.w + 14, height: L.winB.h + 14, rx: 14, fill: 'none', stroke: th.fgSoft, 'stroke-width': 2, 'stroke-opacity': 0.55}),
          L.tiles.map(t => t.node), L.winPeople.map(pp => pp.node)),
        L.winLabels.map((sl, i) => sl && seatLabelNode(ctx, sl, {name: `wlab${i}`, size: L.F, owner: `wp${i}`, seat: `w-win-${L.winItems[i].route.slot}`})),
        L.caps.windows && g({name: 'cap-w-windows', opacity: 0}, L.caps.windows.node)),
      L.conns.map(c => c.c.node),
      L.conns.map((c, i) => c.chip && g({name: `rel-l${i}`, opacity: 0}, c.chip.node)),
      g({name: 'tracer-wrap', transform: T(0, 0)}, tracer(ctx, 'tracer', th.accent2)),
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const slide = ease.inOutCubic(seg(u, ...W.slide));
    // separate: every component slides from its assembled place to its own place
    const n = L.conns.length;
    const drawn = L.conns.map((_, i) => ease.inOutSine(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / Math.max(1, n), W.relate[0] + ((i + 0.8) * (W.relate[1] - W.relate[0])) / Math.max(1, n))));
    const tp = ease.inOutSine(seg(u, ...W.trace));
    const tq = L.route.poly.at(tp);
    const focusScale = {};
    for (const id of EL) {
      const off = L.sepOff[id];
      const visit = L.visits.find(v => v.id === id && id === ctx.params.focusElement);
      const near = visit && tp > 0 && tp < 1 ? Math.min(1, Math.max(0, 1.6 - Math.abs(tp - visit.t) / 0.14)) : 0;
      const sc = 1 + 0.14 * ease.inOutSine(near);
      focusScale[id] = sc;
      const c = L.centers[id];
      nodes[`el-${id}`] = {transform: `${T(off.x * (1 - slide), off.y * (1 - slide))} ${scaleAbout(c.x, c.y, r(sc, 4))}`};
    }
    for (const id of EL) if (L.caps[id]) nodes[`cap-w-${id}`] = {opacity: r(seg(u, W.slide[1], W.slide[1] + 0.03), 3)};
    L.conns.forEach((c, i) => {
      Object.assign(nodes, c.c.frame(drawn[i], drawn[i] > 0 ? 1 : 0));
      if (c.chip) nodes[`rel-l${i}`] = {opacity: r(clamp((drawn[i] - 0.55) / 0.45), 3)};
    });
    // the connection: when a supplied relationship joining the bench and the windows lands, the windows light up
    // and the participants in them take their seats (nothing happens without it)
    const linkP = L.linkIndex >= 0 ? drawn[L.linkIndex] : 0;
    const landed = linkP >= 0.985;
    const sitW = L.linkIndex >= 0 ? ease.inOutCubic(clamp((u - L.linkEnd - 0.005) / 0.03)) : 0;
    L.winItems.forEach((it, i) => {
      Object.assign(nodes, L.winPeople[i].pose(remotePose(L.G, it.route.slot, sitW)));
      nodes[`w-win-${it.route.slot}-cam`] = camLit(ctx, landed);
    });
    L.roomItems.forEach((it, i) => Object.assign(nodes, L.roomPeople[i].pose({...L.G.slots[it.route.slot], phase: 0, walk: 0, seated: 1})));
    if (L.benchPerson) Object.assign(nodes, L.benchPerson.pose({...L.G.slots.front, phase: 0, walk: 0, seated: 1}));
    // labels of the people: with the gather beat (after the separation, clear of every connector)
    const lab = seg(u, W.relate[0] - 0.02, W.relate[0] + 0.02);
    L.roomLabels.forEach((sl, i) => { if (sl) { nodes[`rlab${i}`] = {opacity: r(lab, 3)}; nodes[`rlab${i}-text`] = {opacity: r(lab, 3)}; } });
    L.winLabels.forEach((sl, i) => { if (sl) { const q = seg(u, L.linkEnd + 0.03, L.linkEnd + 0.06); const v = L.linkIndex >= 0 ? q : lab; nodes[`wlab${i}`] = {opacity: r(v, 3)}; nodes[`wlab${i}-text`] = {opacity: r(v, 3)}; } });
    if (L.benchLabel) { nodes.blab = {opacity: r(lab, 3)}; nodes['blab-text'] = {opacity: r(lab, 3)}; }
    const tracerOn = u >= W.trace[0] - 0.005 && u <= W.trace[1] + 0.03;
    nodes['tracer-wrap'] = {transform: T(tq.x, tq.y)};
    nodes.tracer = {opacity: r(tracerOn ? 1 - seg(u, W.trace[1] + 0.005, W.trace[1] + 0.03) : 0, 3)};
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const visited = L.visits.filter(v => tp >= v.t - 1e-9 && u >= W.trace[0]).map(v => v.id);
    const people = [...L.roomItems.map((it, i) => ({kind: 'room', seated: 1})), ...L.winItems.map(() => ({kind: 'window', seated: r(sitW, 3)}))];
    return {
      nodes,
      semantic: {
        beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
        slide: r(slide, 3),
        relationsDrawn: drawn.map(v => r(v, 3)),
        tracerVisible: tracerOn,
        tracer: R2(tq),
        visitOrder: visited,
        focusScale: r(Math.max(...Object.values(focusScale)), 3),
        windowsLinked: landed,
        remoteSeated: r(sitW, 3),
        people,
        connectorGaps: L.gaps,
        arrows: L.conns.map(c => ({kind: c.rel.kind, arrow: LINK_STYLES[c.rel.kind].arrow})),
        labelsClear: L.labelsClear,
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        log: L.log,
      },
    };
  },
};

/** One composition at text size F with the legend share legF. */
function compose(ctx, p, F, px, legF) {
  const th = ctx.theme;
  const D = ctx.design;
  const shape = ctx.view.shape;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const cap = id => (p.elements.find(e => e.id === id) || {label: id}).label;
  const {routes} = resolveSfr(ctx, p);
  const winItems = routes.filter(rt => rt.kind === 'window').map(rt => ({route: rt}));
  const roomItems = routes.filter(rt => rt.kind === 'room' && rt.slot !== 'front').map(rt => ({route: rt}));
  const benchRoute = routes.find(rt => rt.slot === 'front') || null;
  const winSlots = winItems.map(it => it.route.slot);
  // ---- legend + key (texts)
  const kinds = [...new Set(p.relationships.filter(q => q.from !== q.to).map(q => q.kind))];
  const legW = !showAll && !showKey ? 0 : shape === 'portrait' ? D.w * 0.56 : shape === 'square' ? Math.min(D.w * 0.22, 240) : D.w * legF;
  const legItems = [];
  if (showAll) {
    legItems.push({type: 'head', fit: fitWords(ctx.t.kinds, {maxWidth: legW, size: F, minSize: F, maxLines: 1, weight: 700})});
    for (const kd of kinds) legItems.push({type: 'kind', kind: kd, fit: fitWords(glue(p.relationLabels[kd]), {maxWidth: legW - 70, size: F, minSize: F, maxLines: 3, weight: 500})});
  }
  if (showKey) legItems.push({type: 'names', fit: fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: legW, size: F, minSize: F, maxLines: 7, weight: 600})});
  if (showKey) legItems.push({type: 'key', fit: fitWords(glue(p.labels.key), {maxWidth: legW, size: F, minSize: F, maxLines: 7, weight: 500})});
  if (legItems.some(it => it.fit.truncated)) problems.push('legend-trunc');
  const legH = legItems.reduce((a, it) => a + it.fit.height + F * 0.55, 0);
  // ---- room size: the room grows along the axis the frame has spare room in (more floor for the labels)
  // (landscape) the gap between the building and the room takes the width of their relation's label
  const bRel = p.relationships.find(q => (q.from === 'building' && q.to === 'room') || (q.from === 'room' && q.to === 'building'));
  const bRelW = bRel && showAll ? gchip(ctx, bRel.label || p.relationLabels[bRel.kind], {x: 0, y: 0, maxWidth: 220 / px, size: F, minSize: F, maxLines: 3, weight: 600}).box.w : 0;
  const gapH0 = shape === 'landscape' ? 150 : 110, gapV0 = shape === 'portrait' ? 110 : 90, gapL0 = shape === 'landscape' ? Math.min(280, Math.max(130, bRelW + 40)) : 90;
  const bW0 = shape === 'portrait' ? Math.min(D.w * 0.36, 240) : Math.min(D.w * (shape === 'square' ? 0.22 : 0.13), 240);
  const bandH0 = shape === 'portrait' ? Math.max(bW0 * 1.1 + F * 3.2, legH) + 30 : 0;
  // (room is kept above the bench and below the room for their captions)
  const capRoom = shape === 'landscape' ? F * 1.5 : F * 2.8;
  const R0 = {w: D.w - (shape === 'portrait' ? 0 : bW0 + gapL0) - (shape === 'landscape' && legW ? legW + 40 : 0), h: D.h - bandH0 - 2 * capRoom};
  const G0 = sfrGeometry(ROOM.W, ROOM.H, winSlots, 'column');
  const tb0 = winSlots.map(s0 => G0.win[s0].box);
  const winW0 = tb0.length ? Math.max(...tb0.map(b => b.x + b.w)) - Math.min(...tb0.map(b => b.x)) : 190;
  const benchH0 = G0.desk.cy + G0.desk.h / 2 + 14 + 2;
  let RW = ROOM.W, RH = ROOM.H;
  {
    const kw = (R0.w - gapH0) / (RW + 2 * WALL + winW0), kh = (R0.h - gapV0 - 10) / (benchH0 + RH + 2 * WALL);
    const kk = Math.min(1.2, kw, kh) * 0.985;
    if (kw < kh) RH = Math.floor(Math.min(900, Math.max(ROOM.H, (R0.h - gapV0 - 10) / kk - benchH0 - 2 * WALL)));
    else RW = Math.floor(Math.min(1100, Math.max(ROOM.W, (R0.w - gapH0) / kk - winW0 - 2 * WALL)));
  }
  const G = sfrGeometry(RW, RH, winSlots, 'column');
  // only the chairs someone uses are drawn in the room
  for (const s0 of Object.keys(G.slots)) if (s0 !== 'front' && !roomItems.some(it => it.route.slot === s0)) delete G.slots[s0];
  const t = WALL;
  // ---- component boxes in template units (local)
  const benchB = {x: G.desk.cx - G.desk.w / 2 - 26, y: -2, w: G.desk.w + 52, h: G.desk.cy + G.desk.h / 2 + 14};
  const roomB = {x: -t, y: -t, w: RW + 2 * t, h: RH + 2 * t};
  const tileBs = winSlots.map(s => G.win[s].box);
  const winB = tileBs.length ? {x: Math.min(...tileBs.map(b => b.x)), y: Math.min(...tileBs.map(b => b.y)), w: Math.max(...tileBs.map(b => b.x + b.w)) - Math.min(...tileBs.map(b => b.x)), h: Math.max(...tileBs.map(b => b.y + b.h)) - Math.min(...tileBs.map(b => b.y))} : {x: -t - 240, y: 30, w: 190, h: 176};
  // ---- arrangement per shape: exploded positions (design units) at scale k
  const bW = shape === 'portrait' ? Math.min(D.w * 0.36, 240) : Math.min(D.w * (shape === 'square' ? 0.22 : 0.13), 240);
  const bH = bW * 1.1;
  const gap = 70;
  // one exploded arrangement for every frame: the bench lifted above the room, the windows set apart to the right
  // of the room's upper part, the building on the left (a band on top when tall); the gaps give every connector length
  const gapH = gapH0, gapV = gapV0, gapL = gapL0;
  let k, pos, legBox, bldBox;
  const bandH = shape === 'portrait' ? Math.max(bH + F * 3.2, legH) + 30 : 0;
  const colL = shape === 'portrait' ? 0 : bW + gapL;
  const R = {x: colL, y: bandH + capRoom, w: D.w - colL - (shape === 'landscape' && legW ? legW + 40 : 0), h: D.h - bandH - 2 * capRoom};
  k = Math.min(1.2, (R.w - gapH) / (roomB.w + winB.w), (R.h - gapV - 10) / (benchB.h + roomB.h));
  const blockW = (roomB.w + winB.w) * k + gapH, blockH = (benchB.h + roomB.h) * k + gapV;
  const bx0 = R.x + (R.w - blockW) / 2, by0 = R.y + (R.h - blockH) / 2;
  pos = {
    bench: {x: bx0 + (roomB.w - benchB.w) * k * 0.62 - benchB.x * k, y: by0 - benchB.y * k},
    room: {x: bx0 - roomB.x * k, y: by0 + benchB.h * k + gapV - roomB.y * k},
  };
  pos.windows = {x: bx0 + roomB.w * k + gapH - winB.x * k, y: by0 + benchB.h * k * 0.2 - winB.y * k};
  if (shape === 'landscape') {
    bldBox = {x: 0, y: by0 + benchB.h * k + gapV + (roomB.h * k - bH) / 2, w: bW, h: bH};
    legBox = {x: D.w - legW, y: Math.max(0, (D.h - legH) / 2), w: legW, h: legH};
  } else if (shape === 'square') {
    bldBox = {x: 0, y: 0, w: bW, h: bH};
    legBox = {x: 0, y: bH + F * 3.4, w: bW, h: legH};
  } else {
    bldBox = {x: 0, y: 0, w: bW, h: bH};
    legBox = {x: D.w - legW, y: 0, w: legW, h: legH};
  }
  if (shape === 'square' && legBox.y + legH > D.h + 0.5) problems.push('legend');
  const boxOf = (id) => {
    const b = id === 'bench' ? benchB : id === 'room' ? roomB : winB;
    const o = pos[id];
    return {x: o.x + b.x * k, y: o.y + b.y * k, w: b.w * k, h: b.h * k};
  };
  const boxes = {building: bldBox, room: boxOf('room'), bench: boxOf('bench'), windows: boxOf('windows')};
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  for (const id of EL) { const b = boxes[id]; if (b.x < -1 || b.y < -1 || b.x + b.w > D.w + 1 || b.y + b.h > D.h + 1) problems.push(`out-${id}`); }
  for (let i = 0; i < EL.length; i++) for (let j = i + 1; j < EL.length; j++) if (overlaps(boxes[EL[i]], boxes[EL[j]], 6)) problems.push(`overlap-${EL[i]}-${EL[j]}`);
  if (overlaps(legBox, boxes.room, 6) || overlaps(legBox, boxes.windows, 6) || overlaps(legBox, boxes.bench, 6)) problems.push('legend-overlap');
  const centers = Object.fromEntries(EL.map(id => [id, {x: boxes[id].x + boxes[id].w / 2, y: boxes[id].y + boxes[id].h / 2}]));
  // assembled start: the bench on its platform in the room, the windows against the room wall, the building behind
  const deskAt = {x: pos.room.x + (G.desk.cx - G.desk.w / 2 - 26) * k, y: pos.room.y - 2 * k};
  const sepOff = {
    bench: {x: deskAt.x - boxes.bench.x, y: deskAt.y - boxes.bench.y},
    // (the windows start against the room's right wall, on the side they move out to)
    windows: {x: boxes.room.x + boxes.room.w + 4 - boxes.windows.x, y: 0},
    building: {x: centers.room.x - centers.building.x, y: centers.room.y - centers.building.y},
    room: {x: 0, y: 0},
  };
  // ---- art
  const c = planColors(ctx);
  const roomParts = [
    floorArea(ctx, {x: 0, y: 0, w: RW, h: RH, kind: 'tiles', cell: 62}),
    planPlatform(ctx, {...G.platform}),
    wallRing(ctx, {x: 0, y: 0, w: RW, h: RH, t, gaps: [{side: 'bottom', a: G.mainDoor.a, b: G.mainDoor.b, kind: 'open'}]}),
    ...G.tables.map((tb, i) => planTable(ctx, {...tb, seedKey: `mt${i}`})),
    ...Object.entries(G.slots).filter(([s0]) => s0 !== 'front').map(([s0, sl]) => planChair(ctx, {name: `m-chair-${s0}`, cx: sl.x, cy: sl.y, deg: sl.deg, s: 62})),
    ...G.plants.map((pl, i) => planPlant(ctx, {cx: pl.x, cy: pl.y, s: 46, seedKey: `mpl${i}`})),
  ];
  const roomNode = g(null, roomParts);
  const benchNode = g(null,
    planChair(ctx, {name: 'm-bench-chair', cx: G.slots.front.x, cy: G.slots.front.y, deg: 180, s: 62}),
    planTable(ctx, {cx: G.desk.cx, cy: G.desk.cy, w: G.desk.w, h: G.desk.h, front: 'bottom', seedKey: 'mbench'}),
    linkHub(ctx, {...G.hubs.left}), linkHub(ctx, {...G.hubs.right}));
  void c;
  const tiles = winSlots.map(s => ({slot: s, node: windowArt(ctx, G, s, {name: `w-win-${s}`})}));
  const roomPeople = roomItems.map((it, i) => planPerson(ctx, {name: `rp${i}`, look: it.route.look}));
  const winPeople = winItems.map((it, i) => planPerson(ctx, {name: `wp${i}`, look: it.route.look}));
  const benchPerson = benchRoute ? planPerson(ctx, {name: 'bp', look: benchRoute.look}) : null;
  const building = buildingElevation(ctx, {name: 'bld', x: bldBox.x, y: bldBox.y, w: bldBox.w, h: bldBox.h, highlight: {floor: 1, bay: 3}});
  // ---- connectors (supplied relationships only), anchored to the component edges
  const rels = p.relationships.filter(q => q.from !== q.to);
  const conns = rels.map((rel, i) => {
    const A = boxes[rel.from], B = boxes[rel.to];
    const from = edgeAnchor(A, centers[rel.to], 8);
    const to = edgeAnchor(B, centers[rel.from], 8);
    const cn = connector(ctx, {name: `rel-c${i}`, from, to, kind: rel.kind, bend: 0.08, color: kindColor(ctx, rel.kind)});
    return {rel, c: cn, from, to};
  });
  const linkIndex = rels.findIndex(q => (q.from === 'bench' && q.to === 'windows') || (q.from === 'windows' && q.to === 'bench'));
  const nRel = Math.max(1, rels.length);
  const linkEnd = linkIndex >= 0 ? W.relate[0] + ((linkIndex + 0.8) * (W.relate[1] - W.relate[0])) / nRel : 1;
  // ---- component captions (beside each component, clear of the others and of the connectors)
  const hardBoxes = [...EL.map(id => boxes[id]), legBox];
  const rays = conns.map(cn => [cn.from, cn.to]);
  const caps = {};
  const capBoxes = [];
  for (const id of EL) {
    if (!showKey) { caps[id] = null; continue; }
    // wide first, then narrower (more lines) until a clear side is found
    let pl = null, mwUsed = 0;
    for (const mw of [Math.min(360 / px, D.w * 0.4), 250 / px, 190 / px]) {
      const probe = gchip(ctx, cap(id), {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: F, minSize: F, maxLines: 4, fill: th.card, stroke: th.fgSoft, weight: 700});
      if (probe.fit.truncated) continue;
      const cand = sideCaption({part: boxes[id], w: probe.box.w, h: probe.box.h, order: id === 'building' ? ['below', 'above'] : id === 'bench' ? (shape === 'landscape' ? ['left', 'right', 'above'] : ['above', 'left', 'right']) : id === 'windows' ? ['below', 'above', 'right'] : ['below', 'left', 'right'], gap: 10, frame: D, hard: [...hardBoxes.filter(b => b !== boxes[id]), ...capBoxes], rays});
      if (!pl || (cand.clear && !pl.clear)) { pl = cand; mwUsed = mw; }
      if (cand.clear) break;
    }
    if (!pl) { problems.push(`cap-trunc-${id}`); caps[id] = null; continue; }
    if (!pl.clear) problems.push(`cap-${id}`);
    caps[id] = gchip(ctx, cap(id), {x: pl.box.x, y: pl.box.y, anchor: 'start', maxWidth: mwUsed, size: F, minSize: F, maxLines: 4, fill: th.card, stroke: th.fgSoft, weight: 700, name: `cap-${id}`});
    capBoxes.push(caps[id].box);
  }
  // ---- relation labels: beside the connector's middle, clear of components, captions and other labels
  const relBoxes = [];
  let labelsClear = true;
  conns.forEach((cn, i) => {
    if (!showAll) return;
    const text = cn.rel.label || p.relationLabels[cn.rel.kind] || cn.rel.kind;
    let probe = null;
    let got = null;
    // wider (2 lines) first, then narrower (3 lines); along the connector and pushed off it on either side
    for (const [mw, ml] of [[300, 2], [220, 3], [150, 4]]) {
      probe = gchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw / px, size: F, minSize: F, maxLines: ml, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), weight: 600});
      if (probe.fit.truncated) continue;
      const dx = cn.to.x - cn.from.x, dy = cn.to.y - cn.from.y, Ld = Math.hypot(dx, dy) || 1;
      const nx = -dy / Ld, ny = dx / Ld;
      for (const d0 of [0, 26, 44, 62, 80, 100, 124, 150, 180]) {
        for (const sg of d0 ? [1, -1] : [1]) {
          for (const tt of [0.5, 0.35, 0.65, 0.2, 0.8]) {
            const m0 = cn.c.at(tt);
            const cx = m0.x + nx * d0 * sg, cy = m0.y + ny * d0 * sg;
            const b = {x: cx - probe.box.w / 2, y: cy - probe.box.h / 2, w: probe.box.w, h: probe.box.h};
            if (b.x < 0 || b.y < 0 || b.x + b.w > D.w || b.y + b.h > D.h) continue;
            if ([...EL.map(id2 => boxes[id2]), legBox, ...capBoxes, ...relBoxes].some(q => overlaps(b, q, 6))) continue;
            // clear of the other connectors, and nearer its own (<= 36 px) than any other (by >= 10 px)
            if (conns.some((o, j) => j !== i && [0.1, 0.25, 0.5, 0.75, 0.9].some(t2 => { const q = o.c.at(t2); return q.x > b.x - 8 && q.x < b.x + b.w + 8 && q.y > b.y - 8 && q.y < b.y + b.h + 8; }))) continue;
            const dTo = cn2 => Math.min(...Array.from({length: 25}, (_, z) => cn2.c.at(z / 24)).map(q => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h))));
            const own = dTo(cn);
            if (own * px > 36 || conns.some((o, j) => j !== i && dTo(o) < own + 10 / px)) continue;
            got = b;
            break;
          }
          if (got) break;
        }
        if (got) break;
      }
      if (got) break;
    }
    if (probe.fit.truncated) problems.push('rel-trunc');
    const mid = cn.c.mid;
    if (!got) { labelsClear = false; problems.push(`rel-${i}`); got = {x: mid.x - probe.box.w / 2, y: mid.y - probe.box.h / 2, w: probe.box.w, h: probe.box.h}; }
    relBoxes.push(got);
    cn.chip = gchip(ctx, text, {x: got.x + got.w / 2, y: got.y, anchor: 'middle', maxWidth: probe.box.w + 1, size: F, minSize: F, maxLines: 3, fill: th.card, stroke: kindColor(ctx, cn.rel.kind), weight: 600});
  });
  // ---- people labels (inside the room / beside the windows / beside the bench), clear of everything drawn
  const rad = PERSON_RAD * k;
  const toRoom = q => ({x: pos.room.x + q.x * k, y: pos.room.y + q.y * k});
  const toWin = q => ({x: pos.windows.x + q.x * k, y: pos.windows.y + q.y * k});
  const toBench = q => ({x: pos.bench.x + q.x * k, y: pos.bench.y + q.y * k});
  const everyone = [
    ...roomItems.map(it => bodyBox(toRoom(G.slots[it.route.slot]), 0, rad)),
    ...winItems.map(it => bodyBox(toWin(G.win[it.route.slot].seat), 90, rad)),
    ...(benchRoute ? [bodyBox(toBench(G.slots.front), 180, rad)] : []),
  ];
  const connPts = conns.map(cn => Array.from({length: 13}, (_, j) => cn.c.at(j / 12)));
  const extra = [...capBoxes, ...relBoxes, legBox, bldBox];
  const common = {size: F, minSize: F, maxWidth: 300 / px, maxLines: 3, maxGap: 36 / px, pathPad: rad * 0.35, hard: [], hardAlways: []};
  const roomLabels = roomItems.map(() => null);
  const winLabels = winItems.map(() => null);
  let benchLabel = null;
  if (showKey) {
    if (roomItems.length) {
      const rb = boxes.room;
      const res = placeSeatLabels(ctx, {...common, items: roomItems.map((it, i) => ({key: `r${i}`, text: it.route.label, at: toRoom(G.slots[it.route.slot]), rad, avoidPaths: connPts})),
        people: everyone, furniture: G.tables.map(tb => ({x: toRoom({x: tb.cx - tb.w / 2, y: 0}).x, y: toRoom({x: 0, y: tb.cy - tb.h / 2}).y, w: tb.w * k, h: tb.h * k})), bounds: {x: rb.x + t * k, y: rb.y + t * k, w: rb.w - 2 * t * k, h: rb.h - 2 * t * k}, extra,
        seatPoints: roomItems.map(it => toRoom(G.slots[it.route.slot]))});
      res.labels.forEach((lb, i) => { roomLabels[i] = lb; extra.push(lb.box); });
      problems.push(...res.fails.map(f => `lab-${f}`));
    }
    if (winItems.length) {
      const wb = boxes.windows;
      const res = placeSeatLabels(ctx, {...common, items: winItems.map((it, i) => ({key: `w${i}`, text: it.route.label, at: toWin(G.win[it.route.slot].seat), rad, avoidPaths: connPts})),
        people: everyone, furniture: [], bounds: {x: Math.max(0, wb.x - 120), y: Math.max(0, wb.y - 90), w: Math.min(D.w, wb.x + wb.w + 120) - Math.max(0, wb.x - 120), h: Math.min(D.h, wb.y + wb.h + 90) - Math.max(0, wb.y - 90)}, extra,
        seatPoints: winItems.map(it => toWin(G.win[it.route.slot].seat))});
      res.labels.forEach((lb, i) => { winLabels[i] = lb; extra.push(lb.box); });
      problems.push(...res.fails.map(f => `lab-${f}`));
    }
    if (benchRoute) {
      const bb = boxes.bench;
      const res = placeSeatLabels(ctx, {...common, items: [{key: 'bench', text: benchRoute.label, at: toBench(G.slots.front), rad, avoidPaths: connPts}],
        people: everyone, furniture: [], bounds: {x: Math.max(0, bb.x - 200), y: Math.max(0, bb.y - 60), w: Math.min(D.w, bb.x + bb.w + 200) - Math.max(0, bb.x - 200), h: Math.min(D.h, bb.y + bb.h + 30) - Math.max(0, bb.y - 60)},
        extra: [...extra, boxes.room], seatPoints: [toBench(G.slots.front)]});
      benchLabel = res.labels[0];
      problems.push(...res.fails.map(f => `lab-${f}`));
    }
  }
  // ---- tracer route: along the drawn relationships in the supplied order (straight hops where none is supplied)
  const order = p.traversalOrder.filter((id, i, a) => i === 0 || id !== a[i - 1]);
  const pts = [];
  const visitsIdx = [];
  order.forEach((id, i) => {
    if (i === 0) { pts.push(centers[id]); visitsIdx.push({id, idx: 0}); return; }
    const prev = order[i - 1];
    const cn = conns.find(q => (q.rel.from === prev && q.rel.to === id) || (q.rel.from === id && q.rel.to === prev));
    if (cn) {
      const fwd = cn.rel.from === prev;
      for (let j = 0; j <= 24; j++) pts.push(cn.c.at(fwd ? j / 24 : 1 - j / 24));
    }
    pts.push(centers[id]);
    visitsIdx.push({id, idx: pts.length - 1});
  });
  const route = {poly: polyline(pts)};
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1] || 1;
  const visits = visitsIdx.map(v => ({id: v.id, t: cum[v.idx] / total}));
  // connector end gaps (end point to its component box edge)
  const edgeGap = (b, q) => Math.min(Math.abs(q.x - b.x), Math.abs(q.x - b.x - b.w), Math.abs(q.y - b.y), Math.abs(q.y - b.y - b.h));
  const gaps = conns.map(cn => r(Math.max(edgeGap(boxes[cn.rel.from], cn.from), edgeGap(boxes[cn.rel.to], cn.to)), 1));
  // ---- legend node
  let legend = null;
  if (legItems.length) {
    const parts = [];
    let y = legBox.y;
    for (const it of legItems) {
      if (it.type === 'kind') {
        const st = LINK_STYLES[it.kind];
        const col = kindColor(ctx, it.kind);
        parts.push(h('path', {d: `M${r(legBox.x)} ${r(y + F * 0.6)}h46`, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}));
        if (st.endDots) parts.push(h('circle', {cx: r(legBox.x), cy: r(y + F * 0.6), r: st.width * 1.6, fill: col}), h('circle', {cx: r(legBox.x + 46), cy: r(y + F * 0.6), r: st.width * 1.6, fill: col}));
        if (st.arrow) parts.push(h('path', {d: `M${r(legBox.x + 52)} ${r(y + F * 0.6)}l-12 -7v14z`, fill: col}));
        parts.push(textAt(it.fit, legBox.x + 64, y, th.fg));
      } else parts.push(textAt(it.fit, legBox.x, y, it.type === 'key' ? th.fgSoft : th.fg, it.type === 'key'));
      y += it.fit.height + F * 0.55;
    }
    legend = {node: g({name: 'legend', opacity: 0}, parts)};
  }
  return {
    F, px, k, G, pos, winB, boxes, centers, sepOff, building, roomNode, benchNode, tiles, roomPeople, winPeople, benchPerson, roomItems, winItems, roomLabels, winLabels, benchLabel,
    caps, conns, linkIndex, linkEnd, route, visits, gaps, legend, labelsClear, problems, personPx,
  };
}

function textAt(fit, x, y, fill, italic = false) {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'font-family': FONT, 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': italic ? 'italic' : undefined, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-04-mechanism',
    title: 'Physical and remote room — the parts of the connection, exploded and traced',
    titleEs: 'Sala física y remota — Mecanismo o relación explicada',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Sala física y remota',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'An exploded plan: the generic building, the hearing room with the participants who appear in it, the bench lifted out above its platform and the remote windows set beside the room slide apart from one assembled plan. Only the supplied relationships are drawn, styled by kind and labelled; when the one joining the bench and the windows lands, their camera dots light and the participants in them sit. A tracer follows the supplied order while the focus component enlarges. Where each participant appears is as supplied; no conclusion is drawn.',
    tags: ['mechanism', 'exploded plan', 'bench', 'remote window', 'link', 'relationships', 'tracer', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/sala-fisica-remota.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
