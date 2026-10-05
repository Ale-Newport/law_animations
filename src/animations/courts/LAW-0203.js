/**
 * LAW-0203 — Distribución de una sala · contrast
 *
 * Storyboard (two complete copies of the same generic room, drawn as plans:
 * side by side on wide frames, one above the other on tall ones; the same
 * people wait outside the same door in both):
 *  0.00–0.17  base: the two rooms are identical — same walls, doors, front
 *             desk, bench, the two movable tables pushed together in the
 *             middle with their chairs, the same people waiting outside the
 *             main door, the same empty-seat rings. Only the neutral A / B
 *             badges tell the scenes apart.
 *  0.17–0.40  the change: each room receives its supplied arrangement — the
 *             two table units slide and turn apart into «Distribución A» in A
 *             and «distribución B» in B (the only changed fact); the supplied
 *             scenario labels and captions appear once the tables have moved.
 *  0.40–0.77  in parallel, the same people walk the same order through the
 *             same door to the same supplied seats; their routes differ only
 *             where the tables differ. Once everyone has sat down, each seat's
 *             editable label arrives beside it, in entrance order (chip body
 *             first, then its text), so no label stands on a route still walked.
 *  0.77–1.00  a dashed guide outlines the table units in both rooms and joins
 *             them to one chip naming the changed fact; the shared facts and the
 *             neutral note ("no winner, no outcome") stay visible. Neither
 *             arrangement is marked as correct; no consequence is shown.
 * @module animations/courts/LAW-0203
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {str, list, obj, oneOf} from '../../schemas/fields.js';
import {planPerson, buildingElevation} from './kits/courts-art.js';
import {
  salaFields, SALA_EN, resolveSala, roomGeometry, walkerAt, doorOpen, roomArt, furnitureBoxes, placeSeatLabels, seatLabelNode,
  glue, fitWords, pxPerUnit, R2, PERSON_RAD, WALL, planRoute, TABLE_LAYOUTS, UNIT_LEN, tableUnits, mixUnits, remainingPath, seatObstacles, bodyBox,
} from './kits/distribucion-de-sala.js';

const ID = 'LAW-0203';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {move: [0.19, 0.36], headers: [0.36, 0.4], walk: [0.42, 0.74], guide: [0.77, 0.83], notes: [0.8, 0.85]};
const MIN = {W: 640, H: 620};
const OUT = 152; // outside strip (template units) below the room (and right of it when the side door is used)

const STRINGS = {
  en: {shared: 'Same in A and B'},
  es: {shared: 'Igual en A y B'},
};

const scenario = (who, defLayout) => obj(`Scenario ${who}`, {
  label: str(`Short label for scenario ${who}`, 50),
  caption: str('One-line description of the supplied arrangement', 90),
  layout: oneOf('Supplied arrangement of the two tables (the changed fact; it carries no legal meaning)', TABLE_LAYOUTS),
}, ['label', 'layout']);

const sceneSchema = {
  ...salaFields,
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 4),
  comparisonLabels: obj('Labels of the comparison guide', {
    guide: str('Label on the guide linking the changed detail', 70),
    neutral: str('Neutral note (no winner, no outcome; must say that no conclusion is drawn)', 120),
  }),
};

const defaultParams = {
  ...SALA_EN,
  seats: [
    {slot: 'front', label: 'Presiding seat (as supplied)'},
    {slot: 'left1', label: 'Participant A'},
    {slot: 'right1', label: 'Participant B'},
  ],
  routes: [{seat: 0, door: 'main'}, {seat: 1, door: 'main'}, {seat: 2, door: 'main'}],
  scenarioA: {label: 'Distribución A', caption: 'The two tables face each other', layout: 'facing'},
  scenarioB: {label: 'Distribución B', caption: 'The two tables stand side by side, facing the front', layout: 'side-by-side'},
  changedFact: 'Changed fact: the supplied arrangement of the two tables',
  sharedFacts: ['Same room, same door, same people', 'Same seats and labels, same order'],
  comparisonLabels: {guide: 'Only the table arrangement differs', neutral: 'Both layouts are shown as supplied · no winner, no outcome, no conclusion drawn'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    // wide frames: the two rooms left and right of a shared centre column (or side by side over a strip);
    // square: side by side over the strip; tall: one above the other over the strip. Each room is turned
    // a quarter when that draws it (and its people) larger.
    const cands = shape === 'landscape' ? [['center', 0.14], ['center', 0.18], ['center', 0.22], ['center', 0.26], ['center', 0.3], ['center', 0.34], ['row', 0]]
      : shape === 'square' ? [['row', 0], ['row', 0, true]] : [['column', 0], ['column', 0, true]];
    let best = null;
    const log = [];
    for (const v of [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6]) {
      let pick = null;
      for (const [arr, colF, flip] of cands) {
        const L = compose(ctx, p, v / px, px, arr, colF, flip);
        log.push(`${v}/${arr}/${colF}/rot${L.rot}/k${L.scenes[0].k.toFixed(2)}:${L.problems.join('+')}`);
        if (!best || L.problems.length < best.problems.length) best = L;
        if (!L.problems.length && (!pick || L.personPx > pick.personPx + 0.5)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    best.log = log;
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.scenes.map(S => g({name: `${S.key}-scene`},
        g({name: `${S.key}-plan`, transform: T(S.ox, S.oy, S.rot, S.k)}, S.room.node, S.people.map(pp => pp.node)),
        g({name: `${S.key}-outline`, opacity: 0}, h('path', {name: `${S.key}-outline-path`, d: 'M0 0', fill: 'none', stroke: th.accent3, 'stroke-width': 5, 'stroke-dasharray': '14 9'})),
        doorKeys(ctx, S),
        S.labels.map((sl, i) => seatLabelNode(ctx, sl, {name: `${S.key}-lab${i}`, size: L.F, owner: `${S.key}-p${i}`, seat: `${S.key}rm-chair-${S.walkers[i].slot}`})),
      )),
      L.headers.map(hd => hd.node),
      L.strip.node,
      L.guide && L.guide.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const move = ease.inOutCubic(seg(u, ...W.move));
    const looks = {};
    const semantic = {};
    for (const S of L.scenes) {
      // tables: from the shared joined pose to the supplied arrangement
      const units = mixUnits(S.from, S.to, move);
      const off = UNIT_LEN / 2 - 22;
      units.forEach((un, i) => {
        nodes[`${S.key}rm-table${i}`] = {transform: T(un.x, un.y, un.a, UNIT_LEN / S.G.tables[i].w, 1)};
        for (const [slot, sx] of [[i ? 'right1' : 'left1', -off], [i ? 'right2' : 'left2', off]]) {
          const a = (un.a * Math.PI) / 180;
          nodes[`${S.key}rm-chair-${slot}`] = {transform: T(un.x + sx * Math.cos(a) - 64 * Math.sin(a), un.y + sx * Math.sin(a) + 64 * Math.cos(a), un.a)};
        }
      });
      // walkers (same order, same windows in A and B)
      const pos = [];
      const states = [];
      const labelsShown = [];
      S.walkers.forEach((w, i) => {
        const q = seg(u, w.start, w.end);
        const st = walkerAt(w, q, {reduced: ctx.reduced});
        Object.assign(nodes, S.people[i].pose({x: st.x, y: st.y, deg: st.deg, phase: st.phase, walk: st.walk, seated: st.seated, scale: S.ps}));
        pos.push(st);
        states.push(st.state);
        // labels arrive once everyone has sat down (one after another, in entrance order), so no label ever
        // stands on a route someone still walks
        const t0 = Math.max(w.end, W.walk[1]) + i * 0.006;
        const body = seg(u, t0, t0 + 0.022), text = seg(u, t0 + 0.016, t0 + 0.04);
        if (S.labels[i]) {
          nodes[`${S.key}-lab${i}`] = {opacity: r(body, 3)};
          nodes[`${S.key}-lab${i}-text`] = {opacity: r(text, 3)};
        }
        labelsShown.push(r(S.labels[i] ? text : q >= 1 ? 1 : 0, 3));
        semantic[`${S.key}p${i}`] = R2(S.toD(st));
        semantic[`${S.key}seat${i}`] = R2(S.toD(w.seat));
      });
      Object.assign(nodes, S.room.doors.main.frame(doorOpen(S.G, 'main', pos)));
      if (S.room.doors.side) Object.assign(nodes, S.room.doors.side.frame(doorOpen(S.G, 'side', pos)));
      // the guide outline around the two table units (their final poses)
      const gp = seg(u, ...W.guide);
      nodes[`${S.key}-outline`] = {opacity: r(gp, 3)};
      nodes[`${S.key}-outline-path`] = {d: S.outlineD};
      const hd = seg(u, ...W.headers);
      looks[S.key] = {
        units: units.map(un => ({x: r(un.x, 1), y: r(un.y, 1), a: r(un.a, 1)})),
        people: pos.map(q => ({x: r(q.x, 1), y: r(q.y, 1), deg: r(q.deg, 0), seated: r(q.seated, 2)})),
        labels: labelsShown,
        header: r(hd, 3),
        outline: r(gp, 3),
      };
      semantic[S.key] = {states, seated: states.filter(x => x === 'seated').length, layout: S.layout, labels: labelsShown};
    }
    for (const hd of L.headers) nodes[`${hd.name}-label`] = {opacity: r(seg(u, ...W.headers), 3)};
    Object.assign(nodes, L.strip.frame(u));
    if (L.guide) Object.assign(nodes, L.guide.frame(seg(u, ...W.guide)));
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    return {
      nodes,
      semantic: {
        ...semantic,
        beat,
        scenes: L.scenes.length,
        lookA: looks.A,
        lookB: looks.B,
        move: r(move, 3),
        guideShown: r(seg(u, ...W.guide), 3),
        noteShown: r(seg(u, ...W.notes), 3),
        layoutA: L.scenes[0].layout,
        layoutB: L.scenes[1].layout,
        arrangement: L.arrangement,
        rotation: L.rot,
        panelShare: r(L.panelShare, 3),
        personPx: r(L.personPx, 1),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        log: L.log,
      },
    };
  },
};

/**
 * Room size and turn for a stage: the interior W × H (≥ MIN) plus walls and the outside strip(s), turned
 * 0° or 90° (front of the room to the right), whichever draws it larger.
 */
function fitStage(stage, anySide) {
  const exW = WALL * 2 + (anySide ? OUT : 0), exH = WALL * 2 + OUT;
  const one = rot => {
    // extents on screen: unturned (W + exW) × (H + exH); turned (H + exH) × (W + exW)
    const sw = rot ? stage.h : stage.w, sh = rot ? stage.w : stage.h;
    const ar = sw / sh;
    let RW = MIN.W, RH = MIN.H;
    if (ar > (MIN.W + exW) / (MIN.H + exH)) RW = Math.round(ar * (MIN.H + exH) - exW);
    else RH = Math.round((MIN.W + exW) / ar - exH);
    RW = Math.min(RW, 1600);
    RH = Math.min(RH, 1000);
    const k = Math.min(sw / (RW + exW), sh / (RH + exH));
    return {rot, RW, RH, k, exW, exH};
  };
  const a = one(0), b = one(90);
  return b.k > a.k * 1.03 ? b : a;
}

/** One composition at text size F and arrangement arr ('center' | 'row' | 'column'). */
function compose(ctx, p, F, px, arr, colF, flip = false) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const Fc = Math.max(16.6 / px, F * 0.8); // door captions: generic captions, never larger than the supplied content
  const {seats, routes} = resolveSala(ctx, p);
  const anySide = routes.some(rt => rt.door === 'side');
  const arrangement = arr;
  const mkS = 14 / px; // door key glyph half-size (≈ 28 px at 1080p)
  // ---- shared texts
  const center = arrangement === 'center';
  const colW = center ? D.w * colF : D.w;
  const bldH0 = center ? Math.min(150, colW * 0.62) : Math.max(90, Math.min(150, D.h * 0.16));
  const rest = colW - bldH0 * 0.95 - 20;
  const cols = center ? {c1: colW, c2: colW, c3: colW} : arrangement === 'row' ? {c1: rest * 0.3, c2: rest * 0.36, c3: rest * 0.34 - 32} : {c1: rest, c2: D.w * 0.44, c3: D.w * 0.48};
  const names = showKey ? fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: cols.c1, size: F, minSize: F, maxLines: 6, weight: 600}) : null;
  const facts = showAll ? p.sharedFacts.map(f => fitWords(glue(f), {maxWidth: (arrangement === 'row' ? cols.c3 : cols.c1) - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 500})) : [];
  const guideFit = showKey ? fitWords(glue(p.comparisonLabels.guide), {maxWidth: cols.c2 - F * 1.4, size: F, minSize: F, maxLines: 3, weight: 700}) : null;
  const changedFit = showKey ? fitWords(glue(p.changedFact), {maxWidth: cols.c2 - F * 1.4, size: F, minSize: F, maxLines: 5, weight: 500}) : null;
  const keyFit = showKey ? fitWords(glue(p.labels.key), {maxWidth: cols.c1, size: F, minSize: F, maxLines: 4, weight: 500}) : null;
  const doorFits = showAll ? [p.labels.mainDoor, p.labels.sideDoor].map(t => fitWords(glue(t), {maxWidth: cols.c1 - mkS * 2 - F, size: Fc, minSize: Fc, maxLines: 2, weight: 500})) : [];
  const neutralFit = showKey ? fitWords(glue(p.comparisonLabels.neutral), {maxWidth: cols.c3, size: F, minSize: F, maxLines: 5, weight: 500}) : null;
  if (center) for (const f of [names, guideFit, changedFit, neutralFit, keyFit, ...facts, ...doorFits]) if (f && f.truncated) problems.push('strip-trunc');
  const chipW = guideFit ? Math.max(guideFit.width, changedFit ? changedFit.width : 0) + F * 1.4 : 0;
  const chipH = guideFit ? guideFit.height + (changedFit ? changedFit.height + F * 0.5 : 0) + F * 0.9 : 0;
  const factsH = facts.reduce((a, f) => a + f.height + F * 0.3, 0);
  const doorsH = doorFits.reduce((a, f) => a + Math.max(f.height, mkS * 2) + F * 0.55, 0);
  let stripH = 0, bldH = bldH0, plan = null;
  if (center) {
    const need = bldH + F * 0.6 + (names ? names.height + F * 0.6 : 0) + doorsH + (keyFit ? keyFit.height + F * 0.6 : 0) + (chipH ? chipH + F * 1.2 : 0) + factsH + (neutralFit ? neutralFit.height + F * 0.4 : 0);
    if (need > D.h + 0.5) problems.push('strip');
  } else {
    // three balanced columns beside the small building (the lowest arrangement of the texts wins)
    plan = planStrip(ctx, p, {F, Fc, mkS, W: D.w, bldW: bldH0 * 0.95, bldH: bldH0, showKey, showAll, gutter: arrangement === 'column' ? 34 : 0});
    if (!plan) problems.push('strip-trunc');
    stripH = plan ? plan.height + F * 0.8 : D.h * 0.4;
  }
  // ---- panels
  const gap = center ? 40 : arrangement === 'row' ? 56 : 30;
  const avail = {w: D.w, h: D.h - (center ? 0 : stripH + 16)};
  const panelW = center ? (D.w - colW - gap * 2) / 2 : arrangement === 'row' ? (avail.w - gap) / 2 : avail.w;
  const panelH = arrangement === 'column' ? (avail.h - gap) / 2 : avail.h;
  // header: badge + supplied label on one line, the caption under it (same height for A and B)
  const badgeR = F * 0.95;
  const hdrFits = [p.scenarioA, p.scenarioB].map(sc => {
    const lab = showKey ? fitWords(glue(sc.label), {maxWidth: panelW - badgeR * 2 - 40, size: F * 1.1, minSize: F, maxLines: 2, weight: 700}) : null;
    let capt = showAll && sc.caption ? fitWords(glue(sc.caption), {maxWidth: panelW - badgeR * 2 - 40, size: F, minSize: F, maxLines: 3, weight: 500}) : null;
    let beside = false;
    if (capt && lab && lab.lines.length === 1) {
      const room = panelW - badgeR * 2 - 40 - lab.width - 20;
      const one = fitWords(glue(sc.caption), {maxWidth: room, size: F, minSize: F, maxLines: 1, weight: 500});
      if (room > 120 && !one.truncated) { capt = one; beside = true; }
    }
    return {lab, capt, beside};
  });
  const bothBeside = hdrFits.every(f => f.beside || !f.capt);
  if (!bothBeside) hdrFits.forEach((f, i) => { if (f.beside) { const sc = i ? p.scenarioB : p.scenarioA; f.capt = fitWords(glue(sc.caption), {maxWidth: panelW - badgeR * 2 - 40, size: F, minSize: F, maxLines: 3, weight: 500}); f.beside = false; } });
  const headerH = Math.max(badgeR * 2 + F * 0.4, ...hdrFits.map(f => (f.beside ? f.lab.height : (f.lab ? f.lab.height + F * 0.3 : 0) + (f.capt ? f.capt.height : 0)) + F * 0.6));
  const margin = arrangement === 'column' && showKey ? 34 : 0;
  const stage0 = {w: panelW - margin, h: panelH - headerH};
  const fit = fitStage(stage0, anySide);
  const {RW, RH, k, exW, exH} = fit;
  // a quarter turn puts the front of the room to the right (or to the left when flipped)
  const rot = fit.rot ? (flip ? -90 : 90) : 0;
  const G0 = roomGeometry(RW, RH);
  const scenes = [];
  const headers = [];
  // people at the furniture scale; a little larger only when the frame is small (never below 60 px)
  const ps = clamp(62 / (100 * k * px), 1, 1.16);
  const rad = PERSON_RAD * k * ps;
  const personPx = 100 * k * ps * px;
  if (personPx < 60) problems.push('small');
  const layouts = [p.scenarioA.layout, p.scenarioB.layout];
  const onW = (rot ? RH + exH : RW + exW) * k, onH = (rot ? RW + exW : RH + exH) * k; // room (+ outside strips) on screen
  ['A', 'B'].forEach((key, si) => {
    const px0 = center ? (si ? D.w - panelW : 0) : arrangement === 'row' ? si * (panelW + gap) : 0;
    const py0 = arrangement === 'column' ? si * (panelH + gap) : 0;
    // header + room centred vertically in the panel (row / centre), top-aligned when stacked
    const blockH = headerH + onH;
    const top = py0 + (arrangement === 'column' ? 0 : Math.max(0, (panelH - blockH) / 2));
    const left = px0 + (panelW - margin - onW) / 2;
    const ox = rot === 90 ? left + (RH + WALL + OUT) * k : left + WALL * k;
    const oy = rot === -90 ? top + headerH + (RW + WALL + (anySide ? OUT : 0)) * k : top + headerH + WALL * k;
    const toD = rot === 90 ? q => ({x: ox - q.y * k, y: oy + q.x * k}) : rot === -90 ? q => ({x: ox + q.y * k, y: oy - q.x * k}) : q => ({x: ox + q.x * k, y: oy + q.y * k});
    const mapBox = b => {
      const c = [toD({x: b.x, y: b.y}), toD({x: b.x + b.w, y: b.y}), toD({x: b.x, y: b.y + b.h}), toD({x: b.x + b.w, y: b.y + b.h})];
      const xs = c.map(q => q.x), ys = c.map(q => q.y);
      return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
    };
    const from = tableUnits(G0, 'joined');
    const to = tableUnits(G0, layouts[si]);
    // geometry of this scene with its supplied table arrangement (chairs where the arrangement puts them)
    const mdx = (G0.mainDoor.a + G0.mainDoor.b) / 2, wy = G0.H + WALL + OUT * 0.42;
    const spotsMain = [1, 2, 3, 4, 5, 6].map(i => ({x: mdx - i * 112, y: wy, deg: 90})).filter(q => q.x > 50);
    for (const i of [1, 2]) if (mdx + i * 112 < G0.W - 20) spotsMain.push({x: mdx + i * 112, y: wy, deg: 270});
    const doors = {...G0.doors, main: {...G0.doors.main, out: {x: mdx, y: wy}}};
    const G = {...G0, doors, spots: {...G0.spots, main: spotsMain}, slots: {...G0.slots, ...to.slots}};
    const Gstart = {...G0, slots: {...G0.slots, ...from.slots}};
    const room = roomArt(ctx, Gstart, {prefix: `${key}rm`, corridor: false, emptyRings: []});
    const used = {main: 0, side: 0};
    const walkers = routes.map((rt, i) => {
      const spots = G.spots[rt.door];
      const spot = spots[Math.min(used[rt.door]++, spots.length - 1)];
      const pts = planRoute(G, rt.slot, rt.door, spot);
      const S = G.slots[rt.slot];
      return {i, route: rt, slot: rt.slot, spot, pts, poly: polyline(pts), seat: {x: S.x, y: S.y, deg: S.deg}};
    });
    // same windows in both scenes: the timing comes from the order (stagger), not from path lengths
    const n = walkers.length;
    const span = W.walk[1] - W.walk[0];
    const gapT = n > 1 ? Math.min(0.1, (span - 0.16) / (n - 1)) : 0;
    walkers.forEach((w, i) => { w.start = W.walk[0] + i * gapT; w.end = Math.min(W.walk[1], w.start + span - (n - 1) * gapT); });
    const people = walkers.map((w, i) => planPerson(ctx, {name: `${key}-p${i}`, look: w.route.look}));
    const roomBox = mapBox({x: 4, y: 4, w: RW - 8, h: RH - 8});
    // table units at their final poses (template boxes; labels keep off them)
    const unitBoxesT = to.units.map(un => {
      const a = (un.a * Math.PI) / 180, c = Math.abs(Math.cos(a)), sn = Math.abs(Math.sin(a));
      const bw = UNIT_LEN * c + 56 * sn, bh = UNIT_LEN * sn + 56 * c;
      return {x: un.x - bw / 2, y: un.y - bh / 2, w: bw, h: bh};
    });
    const furn = [...furnitureBoxes(G).filter(f => f.kind !== 'chair' && f.kind !== 'table'), ...unitBoxesT].map(mapBox);
    const pathD = w => w.pts.map(toD);
    const labels = [];
    // door keys sit on the walls at the door gaps (outside the floor, clear of seat labels)
    const mainAt = toD({x: G.mainDoor.a - 26, y: G.H + WALL / 2}), sideAt = toD({x: G.W + WALL / 2, y: G.sideDoor.b + 26});
    const doorKeyBoxes = [mainAt, sideAt].map(q => ({x: q.x - mkS - 4, y: q.y - mkS - 4, w: 2 * mkS + 8, h: 2 * mkS + 8}));
    // guide outline: the two table units at their final poses (+ chairs)
    const pts = [];
    to.units.forEach(un => {
      const a = (un.a * Math.PI) / 180;
      for (const [lx, ly] of [[-UNIT_LEN / 2 - 8, -36], [UNIT_LEN / 2 + 8, -36], [UNIT_LEN / 2 + 8, 100], [-UNIT_LEN / 2 - 8, 100]]) pts.push(toD({x: un.x + lx * Math.cos(a) - ly * Math.sin(a), y: un.y + lx * Math.sin(a) + ly * Math.cos(a)}));
    });
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    const ob = {x: Math.min(...xs) - 6, y: Math.min(...ys) - 6, w: Math.max(...xs) - Math.min(...xs) + 12, h: Math.max(...ys) - Math.min(...ys) + 12};
    const outlineD = roundRectPath(ob.x, ob.y, ob.w, ob.h, 16);
    scenes.push({key, rot, ps, mkS, mainAt, sideAt, doorKeyBoxes, G, room, people, walkers, from, to, ox, oy, k, labels, outline: ob, outlineD, layout: layouts[si], roomBox, furn, toD, mapBox, pathD, unitBoxesT,
      panel: {x: px0, y: py0, w: panelW, h: panelH}, box: {x: left, y: top + headerH, w: onW, h: onH}});
    // header: lane badge (always) + supplied label and caption (after the change)
    const sc = si ? p.scenarioB : p.scenarioA;
    const color = si ? th.accent4 : th.accent2;
    const hx = left, hy = top;
    const {lab, capt, beside} = hdrFits[si];
    if (lab && lab.truncated) problems.push('header');
    if (capt && capt.truncated) problems.push('caption');
    const cy = hy + badgeR + F * 0.1;
    const tx = hx + badgeR * 2 + 14;
    if (tx + Math.max(lab ? lab.width : 0, capt ? (beside ? lab.width + 20 + capt.width : capt.width) : 0) > px0 + panelW + 1) problems.push('header-w');
    const hw = badgeR * 2 + 14 + Math.max(lab ? lab.width : 0, capt ? (beside ? lab.width + 20 + capt.width : capt.width) : 0);
    headers.push({name: `hdr${si}`, box: {x: hx, y: hy, w: hw, h: headerH - F * 0.3}, node: g({name: `hdr${si}`},
      h('circle', {cx: r(hx + badgeR), cy: r(cy), r: r(badgeR), fill: color, stroke: th.ink, 'stroke-width': 2.5}),
      showKey ? h('text', {x: r(hx + badgeR), y: r(cy + F * 0.36), 'text-anchor': 'middle', 'font-size': r(F), 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, key) : null,
      g({name: `hdr${si}-label`, opacity: 0},
        lab ? textAt(lab, tx, cy - lab.size * 0.55, th.fg) : null,
        capt ? (beside ? textAt(capt, tx + lab.width + 20, cy - lab.size * 0.55 + (lab.size - capt.size) * 0.8, th.fgSoft) : textAt(capt, tx, cy - (lab ? lab.size * 0.55 : 0) + (lab ? lab.height + F * 0.3 : 0), th.fgSoft)) : null)),
    });
  });
  // ---- shared strip / centre column
  const strip = center
    ? stripColumn(ctx, {F, x: (D.w - colW) / 2, w: colW, h: D.h, bldH, names, facts, neutralFit, keyFit, doorFits, mkS, chipH})
    : stripNode(ctx, {F, x: 0, y: D.h - stripH + F * 0.5, bldH, plan, mkS});
  // ---- seat labels per scene: beside their own person, nearer it than any other seat or chair
  for (const S of scenes) {
    const {walkers, toD, furn, key} = S;
    if (showKey) {
      // inside the room, over its walls and into the outside strip (clear of the headers and the other panel)
      const lb0 = S.mapBox({x: -70, y: -70, w: RW + 140 + (anySide ? OUT : 0), h: RH + 70 + WALL + OUT - 6});
      // (each scene may use its half of the gap between the two panels)
      const pb = {x: S.panel.x - gap / 2, y: S.panel.y - (arrangement === 'column' ? gap / 2 : 0), w: S.panel.w + gap, h: S.panel.h + (arrangement === 'column' ? gap : 0)};
      const lb = {x: Math.max(lb0.x, pb.x, 0), y: Math.max(lb0.y, pb.y, 0), w: 0, h: 0};
      lb.w = Math.min(lb0.x + lb0.w, pb.x + pb.w, D.w) - lb.x;
      lb.h = Math.min(lb0.y + lb0.h, pb.y + pb.h, D.h) - lb.y;
      const res = placeSeatLabels(ctx, {
        items: walkers.map((w, i) => ({key: `seat${i}`, text: w.route.label, at: toD(w.seat), rad, avoidPaths: []})),
        people: walkers.map(w => bodyBox(toD(w.seat), w.seat.deg + rot, rad)), extra: [...S.doorKeyBoxes, ...headers.map(hd => hd.box)],
        furniture: furn, bounds: lb, ownMargin: 4, size: F, minSize: F, maxWidth: Math.min(300 / px, (rot ? lb.h : lb.w) * 0.5, lb.w * 0.6), maxLines: 4, maxGap: 38 / px, pathPad: rad * 0.55,
        ...seatObstacles(S.G, toD, new Set(walkers.map(w => w.slot)), {slots: S.G.slots, tables: S.unitBoxesT}),
      });
      S.labels.push(...res.labels);
      if (res.fails.length) problems.push(`${key}-labels(${res.fails.join('|')})`);
    }
  }
  // ---- guide: one chip, leaders to each outline (routed after the seat labels, clear of them and of heads)
  let guide = null;
  if (showKey && (center || (plan && plan.chip))) {
    const gc = strip.guideAt;
    const cg = center ? {w: chipW, h: chipH, guideFit, changedFit} : plan.chip;
    const cb = {x: gc.x - cg.w / 2, y: gc.y, w: cg.w, h: cg.h};
    const parts = [];
    const blockers = [
      ...scenes.flatMap(S => S.labels.map(l => l.box)),
      ...scenes.flatMap(S => S.walkers.map(w => { const q = S.toD(w.seat); return {x: q.x - rad * 0.75, y: q.y - rad * 0.75, w: rad * 1.5, h: rad * 1.5}; })),
      ...headers.map(hd => hd.box),
    ];
    const hits = ld => {
      const pl = polyline(ld);
      let n = 0;
      for (let j = 2; j <= 58; j++) {
        const q = pl.at(j / 60);
        if (blockers.some(o2 => q.x > o2.x - 5 && q.x < o2.x + o2.w + 5 && q.y > o2.y - 5 && q.y < o2.y + o2.h + 5)) n++;
      }
      return n + pl.total * 0.0005;
    };
    const leads = scenes.map((S, i) => {
      const ob = S.outline;
      const ocx = ob.x + ob.w / 2, ocy = ob.y + ob.h / 2;
      const cands = [];
      if (center) {
        // sideways out of the chip to the facing side of the outline (one elbow when not level)
        const ex = i ? ob.x : ob.x + ob.w, sx = i ? cb.x + cb.w : cb.x;
        const midX = i ? (sx + S.box.x) / 2 : (sx + S.box.x + S.box.w) / 2;
        for (const ey of [ocy, ob.y + ob.h * 0.3, ob.y + ob.h * 0.7]) {
          for (const sy of [clamp(ey, cb.y + 14, cb.y + cb.h - 14), cb.y + cb.h * 0.3, cb.y + cb.h * 0.7]) {
            cands.push(Math.abs(sy - ey) < 1 ? [{x: sx, y: sy}, {x: ex, y: ey}] : [{x: sx, y: sy}, {x: midX, y: sy}, {x: midX, y: ey}, {x: ex, y: ey}]);
          }
        }
      } else if (arrangement === 'column' && i === 0) {
        // up the right margin, then into A's outline from its right side
        const mx = D.w - 12, ey = cb.y - 16, fx = cb.x + cb.w - 18;
        for (const my of [ocy, ob.y + ob.h * 0.3, ob.y + ob.h * 0.7]) cands.push([{x: fx, y: cb.y}, {x: fx, y: ey}, {x: mx, y: ey}, {x: mx, y: my}, {x: ob.x + ob.w, y: my}]);
      } else {
        const ey = cb.y - 18;
        // up into the outline's bottom edge, or up beside it and in from a side
        for (const ex of [ocx, ob.x + ob.w * 0.3, ob.x + ob.w * 0.7, ob.x + ob.w * 0.12, ob.x + ob.w * 0.88]) {
          const fx = clamp(ex, cb.x + 16, cb.x + cb.w - (arrangement === 'column' ? 40 : 16));
          cands.push(Math.abs(fx - ex) < 1 ? [{x: fx, y: cb.y}, {x: ex, y: ob.y + ob.h}] : [{x: fx, y: cb.y}, {x: fx, y: ey}, {x: ex, y: ey}, {x: ex, y: ob.y + ob.h}]);
        }
        for (const side of [-1, 1]) {
          const sxx = side < 0 ? ob.x - 22 : ob.x + ob.w + 22;
          const fx = clamp(sxx, cb.x + 16, cb.x + cb.w - 16);
          for (const my of [ocy, ob.y + ob.h * 0.3, ob.y + ob.h * 0.7]) cands.push([{x: fx, y: cb.y}, {x: fx, y: ey}, {x: sxx, y: ey}, {x: sxx, y: my}, {x: side < 0 ? ob.x : ob.x + ob.w, y: my}]);
        }
      }
      let bestL = null;
      for (const c of cands) { const sc = hits(c); if (!bestL || sc < bestL.sc) bestL = {c, sc}; }
      if (bestL.sc >= 1) problems.push(`guide-cross${i}`);
      return bestL.c;
    });
    for (const [i, ld] of leads.entries()) parts.push(h('path', {name: `guide-lead${i}`, d: ld.map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent3, 'stroke-width': 3.5, 'stroke-dasharray': '10 7', 'stroke-linejoin': 'round'}));
    parts.push(h('path', {name: 'guide-card', d: roundRectPath(cb.x, cb.y, cb.w, cb.h, 12), fill: th.card, stroke: th.accent3, 'stroke-width': 3}));
    parts.push(textAt(cg.guideFit, cb.x + cb.w / 2, cb.y + F * 0.45, th.ink, 'middle'));
    if (cg.changedFit) parts.push(textAt(cg.changedFit, cb.x + cb.w / 2, cb.y + F * 0.45 + cg.guideFit.height + F * 0.5, th.inkSoft, 'middle'));
    guide = {node: g({name: 'guide', opacity: 0}, parts), frame: q => ({guide: {opacity: r(q, 3)}}), box: cb, leads};
    if (cb.x < 0 || cb.x + cb.w > D.w || cb.y + cb.h > D.h + 1) problems.push('guide');
  }
  // door keys sit on the walls: none may reach into a header (a quarter turn can put a door on the top wall)
  if (ctx.show('all') && scenes.some(S => S.doorKeyBoxes.some(b => headers.some(hd => b.x < hd.box.x + hd.box.w && hd.box.x < b.x + b.w && b.y < hd.box.y + hd.box.h + 4 && hd.box.y < b.y + b.h)))) problems.push('keys');
  if (strip.overflow) problems.push('strip');
  const panelShare = arrangement === 'column' ? 1 : panelW / D.w;
  return {F, Fc, px, scenes, headers, strip, guide, arrangement, rot, panelShare, personPx, problems};
}

/** Door keys: a triangle marks the main door, a circle the side door (legend in the strip). */
function doorGlyph(ctx, i, x, y, s) {
  const th = ctx.theme;
  return i === 0
    ? h('path', {d: `M${r(x)} ${r(y - s)}L${r(x + s)} ${r(y + s * 0.8)}L${r(x - s)} ${r(y + s * 0.8)}Z`, fill: th.inkSoft, stroke: th.paper, 'stroke-width': 2.5})
    : h('circle', {cx: r(x), cy: r(y), r: r(s * 0.9), fill: th.inkSoft, stroke: th.paper, 'stroke-width': 2.5});
}
function doorKeys(ctx, S) {
  if (!ctx.show('all')) return null;
  return g({name: `${S.key}-doorkeys`}, doorGlyph(ctx, 0, S.mainAt.x, S.mainAt.y, S.mkS), doorGlyph(ctx, 1, S.sideAt.x, S.sideAt.y, S.mkS));
}

/** Door legend rows (glyph + caption), shared by both strip forms. */
function doorLegend(ctx, parts, doorFits, cx, cy, F, mkS) {
  doorFits.forEach((f, i) => {
    const rowH = Math.max(f.height, mkS * 2);
    parts.push(doorGlyph(ctx, i, cx + mkS, cy + rowH / 2, mkS));
    parts.push(textAt(f, cx + mkS * 2 + F * 0.5, cy + (rowH - f.height) / 2, ctx.theme.fg));
    cy += rowH + F * 0.55;
  });
  return cy;
}

/**
 * Plan of the shared strip under the rooms: the small building, then three text columns. The texts
 * (building · room names, door keys, key, guide chip, shared facts, neutral note) are assigned to the
 * columns and the column widths chosen so the strip is as low as possible; nothing is truncated.
 */
function planStrip(ctx, p, o) {
  const {F, Fc, mkS, W: SW, bldW, bldH, showKey, showAll, gutter} = o;
  const gapC = 28;
  const avail = SW - bldW - 20 - gapC * 2 - gutter;
  const fracs = [[0.3, 0.34, 0.36], [0.34, 0.3, 0.36], [0.28, 0.32, 0.4], [0.33, 0.33, 0.34], [0.26, 0.36, 0.38], [0.36, 0.28, 0.36], [0.3, 0.3, 0.4], [0.4, 0.3, 0.3]];
  const assigns = [
    [['names', 'doors', 'key'], ['chip'], ['facts', 'note']],
    [['names', 'doors', 'key'], ['chip', 'note'], ['facts']],
    [['names', 'doors'], ['chip', 'key'], ['facts', 'note']],
    [['names', 'doors'], ['chip', 'note'], ['facts', 'key']],
    [['names', 'doors', 'facts'], ['chip'], ['note', 'key']],
    [['names', 'doors', 'note'], ['chip'], ['facts', 'key']],
  ];
  const item = (id, w) => {
    if (id === 'names') { if (!showKey) return null; const f = fitWords(glue(`${p.courts.building} · ${p.courts.room}`), {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: 600}); return {id, fits: [f], h: f.height, bad: f.truncated}; }
    if (id === 'doors') { if (!showAll) return null; const fs = [p.labels.mainDoor, p.labels.sideDoor].map(t => fitWords(glue(t), {maxWidth: w - mkS * 2 - F * 0.5, size: Fc, minSize: Fc, maxLines: 2, weight: 500})); return {id, fits: fs, h: fs.reduce((a, f) => a + Math.max(f.height, mkS * 2) + F * 0.55, 0) - F * 0.55, bad: fs.some(f => f.truncated)}; }
    if (id === 'key') { if (!showKey) return null; const f = fitWords(glue(p.labels.key), {maxWidth: w, size: F, minSize: F, maxLines: 5, weight: 500}); return {id, fits: [f], h: f.height, bad: f.truncated}; }
    if (id === 'note') { if (!showKey) return null; const f = fitWords(glue(p.comparisonLabels.neutral), {maxWidth: w, size: F, minSize: F, maxLines: 6, weight: 500}); return {id, fits: [f], h: f.height, bad: f.truncated}; }
    if (id === 'facts') { if (!showAll || !p.sharedFacts.length) return null; const fs = p.sharedFacts.map(t => fitWords(glue(t), {maxWidth: w - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 500})); return {id, fits: fs, h: fs.reduce((a, f) => a + f.height + F * 0.3, 0) - F * 0.3, bad: fs.some(f => f.truncated)}; }
    if (id === 'chip') {
      if (!showKey) return null;
      const gf = fitWords(glue(p.comparisonLabels.guide), {maxWidth: w - F * 1.4, size: F, minSize: F, maxLines: 4, weight: 700});
      const cf = fitWords(glue(p.changedFact), {maxWidth: w - F * 1.4, size: F, minSize: F, maxLines: 6, weight: 500});
      const ch = gf.height + cf.height + F * 0.5 + F * 0.9;
      return {id, fits: [gf, cf], h: ch, w: Math.max(gf.width, cf.width) + F * 1.4, bad: gf.truncated || cf.truncated};
    }
    return null;
  };
  let best = null;
  for (const fr of fracs) {
    const ws = fr.map(f => avail * f);
    for (const as of assigns) {
      let bad = false;
      const cols = as.map((ids, ci) => {
        const its = ids.map(id => item(id, ws[ci])).filter(Boolean);
        if (its.some(it => it.bad)) bad = true;
        return {w: ws[ci], items: its, h: its.reduce((a, it) => a + it.h, 0) + Math.max(0, its.length - 1) * F * 0.7};
      });
      if (bad) continue;
      const height = Math.max(bldH, ...cols.map(c => c.h));
      if (!best || height < best.height - 0.5) best = {height, cols, ws};
    }
  }
  if (!best) return null;
  // x positions
  let x = bldW + 20;
  best.cols.forEach((c, i) => { c.x = x; x += best.ws[i] + gapC; });
  const chipCol = best.cols.find(c => c.items.some(it => it.id === 'chip'));
  const chipIt = chipCol && chipCol.items.find(it => it.id === 'chip');
  best.chip = chipIt ? {w: chipIt.w, h: chipIt.h, guideFit: chipIt.fits[0], changedFit: chipIt.fits[1], col: chipCol} : null;
  return best;
}

/** The shared strip under the rooms, drawn from its plan (the guide chip itself is drawn by the guide). */
function stripNode(ctx, o) {
  const th = ctx.theme;
  const {F, x, y, bldH, plan, mkS} = o;
  const parts = [];
  const bw = bldH * 0.95;
  parts.push(buildingElevation(ctx, {name: 'strip-bld', x, y, w: bw, h: bldH, highlight: {floor: 1, bay: 3}, tree: false}).node);
  const factsParts = [];
  let noteNode = null;
  let guideAt = {x: x + (plan ? plan.cols[1].x + plan.cols[1].w / 2 : bw + 200), y};
  for (const c of plan ? plan.cols : []) {
    let cy = y;
    for (const it of c.items) {
      const cx = x + c.x;
      if (it.id === 'names') parts.push(textAt(it.fits[0], cx, cy, th.fg));
      if (it.id === 'doors') doorLegend(ctx, parts, it.fits, cx, cy, F, mkS);
      if (it.id === 'key') parts.push(textAt(it.fits[0], cx, cy, th.fgSoft, 'start', true));
      if (it.id === 'note') noteNode = textAt(it.fits[0], cx, cy, th.fgSoft, 'start', true);
      if (it.id === 'chip') guideAt = {x: cx + Math.min(c.w, it.w) / 2, y: cy};
      if (it.id === 'facts') {
        let yy = cy;
        for (const f of it.fits) {
          factsParts.push(h('circle', {cx: r(cx + F * 0.3), cy: r(yy + F * 0.5), r: r(F * 0.2), fill: th.fgSoft}));
          factsParts.push(textAt(f, cx + F * 0.9, yy, th.fg));
          yy += f.height + F * 0.3;
        }
      }
      cy += it.h + F * 0.7;
    }
  }
  parts.push(g({name: 'strip-facts'}, factsParts));
  if (noteNode) parts.push(g({name: 'strip-note', opacity: 0}, noteNode));
  return {
    node: g({name: 'strip'}, parts),
    guideAt,
    overflow: false,
    frame: u => (noteNode ? {'strip-note': {opacity: r(seg(u, ...W.notes), 3)}} : {}),
  };
}

/**
 * The shared centre column between the two rooms (wide frames): building, names, door keys and key on
 * top; the guide chip in the middle (its leaders run sideways to both rooms); shared facts and the
 * neutral note below.
 */
function stripColumn(ctx, o) {
  const th = ctx.theme;
  const {F, x, w, h: H, bldH, names, facts, neutralFit, keyFit, doorFits, mkS, chipH} = o;
  const parts = [];
  const bw = Math.min(w, bldH * 0.95);
  const topH = bldH + F * 0.6 + (names ? names.height + F * 0.6 : 0) + (doorFits || []).reduce((a, f) => a + Math.max(f.height, mkS * 2) + F * 0.55, 0) + (keyFit ? keyFit.height + F * 0.6 : 0);
  const lowH = facts.reduce((a, f) => a + f.height + F * 0.3, 0) + (neutralFit ? neutralFit.height + F * 0.4 : 0);
  const slack = Math.max(0, H - topH - lowH - (chipH ? chipH + F * 1.2 : 0));
  let cy = 0;
  parts.push(buildingElevation(ctx, {name: 'strip-bld', x: x + (w - bw) / 2, y: cy, w: bw, h: bldH, highlight: {floor: 1, bay: 3}, tree: false}).node);
  cy += bldH + F * 0.6;
  if (names) {
    parts.push(textAt(names, x + w / 2, cy, th.fg, 'middle'));
    cy += names.height + F * 0.6;
  }
  cy = doorLegend(ctx, parts, doorFits || [], x, cy, F, mkS);
  if (keyFit) {
    parts.push(textAt(keyFit, x, cy, th.fgSoft, 'start', true));
    cy += keyFit.height + F * 0.6;
  }
  cy += slack / 2;
  const guideAt = {x: x + w / 2, y: cy};
  if (chipH) cy += chipH + F * 1.2;
  cy += slack / 2;
  const factsParts = [];
  for (const f of facts) {
    factsParts.push(h('circle', {cx: r(x + F * 0.3), cy: r(cy + F * 0.5), r: r(F * 0.2), fill: th.fgSoft}));
    factsParts.push(textAt(f, x + F * 0.9, cy, th.fg));
    cy += f.height + F * 0.3;
  }
  let noteNode = null;
  if (neutralFit) noteNode = textAt(neutralFit, x, cy + F * 0.1, th.fgSoft, 'start', true);
  parts.push(g({name: 'strip-facts'}, factsParts));
  if (noteNode) parts.push(g({name: 'strip-note', opacity: 0}, noteNode));
  return {
    node: g({name: 'strip'}, parts),
    guideAt,
    overflow: topH + lowH + (chipH ? chipH + F * 1.2 : 0) > H + 0.5,
    frame: u => (noteNode ? {'strip-note': {opacity: r(seg(u, ...W.notes), 3)}} : {}),
  };
}

function textAt(fit, x, y, fill, anchor = 'start', italic = false) {
  return h('text', {x: r(x), y: r(y + fit.size * 0.8), 'font-family': "'Avenir Next', 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif", 'font-size': r(fit.size, 2), 'font-weight': fit.weight, 'font-style': italic ? 'italic' : undefined, 'text-anchor': anchor, fill},
    fit.lines.map((ln, i) => h('tspan', {x: r(x), dy: i === 0 ? 0 : r(fit.lineHeight, 2)}, ln)));
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-01-contrast',
    title: 'Room layout — the same room with two supplied table arrangements',
    titleEs: 'Distribución de una sala — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Distribución de una sala',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical plans of the same generic room. Only the supplied arrangement of the two tables changes (A and B); then the same people walk in parallel through the same door to the same supplied seats, whose labels appear as they sit. A guide joins the two arrangements; neither is marked correct and no outcome is shown.',
    tags: ['contrast', 'floor plan', 'room', 'table arrangement', 'seating', 'labels', 'paired scenes', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
