/**
 * LAW-0211 — Asignación de órgano · contrast
 *
 * Storyboard (one site plan read as two paired scenes: a single row of the
 * generic venues in the middle — each venue keyed by a number badge and its
 * floor tint to the named key under the plan, each with one door and in-tray
 * facing lane A and one facing lane B — and two mirror-image lanes: lane A
 * above the row, lane B below it, each with its own intake office, road,
 * sorting point and dashed slot, the same clerk and the same case file. The
 * venue names and mapping tags are drawn once, in the key; the two scene cards
 * (A / B badge, scenario label and caption, the datum card) sit under the plan
 * with the guide card between them):
 *  0.00–0.17  base: both lanes are identical and both datum lines are blank.
 *  0.17–0.40  the change: each card receives its SUPPLIED datum (the only
 *             changed fact) — A: a datum that one mapping row names, B: a datum
 *             that no row names; the scenario labels appear.
 *  0.40–0.77  in parallel the two clerks carry their files along their roads to
 *             their sorting points at the same pace; the key's tags are compared
 *             in turn. Clerk A follows the spur to the named venue's door and sets
 *             the file in that venue's in-tray («Órgano seleccionado»); clerk B
 *             sets the file in the dashed slot of lane B («competencia pendiente»)
 *             — nothing else happens, no consequence is shown.
 *  0.77–1.00  the guide joins the two datum cards (both outlined the same way) to
 *             the card naming the changed fact; the neutral note stays. Neither
 *             scene is marked as correct; no winner, score or outcome.
 * Both lanes are drawn with the same size, stroke, opacity and timing (equal
 * weight); people use the courts "micro" person scale (1.2×, documented in the kit).
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, ease, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, list, obj} from '../../schemas/fields.js';
import {routeTrail} from './kits/courts-art.js';
import {shade} from '../../primitives/paper.js';
import {
  organoFields, ORG_EN, ORG_STRINGS, resolveOrgano, mapper, doorOpenness, fileProp, makeLeg, walkAt, carryPoint, clerkNodes, planPerson,
  clerkLook, textAt, fitG, tagGlyph, legendGlyph, overlaps, pxPerUnit, R2, FONT, VENUE_TINTS, tagChip, LANE_SPEC, stretchedLanes, laneArt, laneGeometry,
} from './kits/asignacion-de-organo.js';

const ID = 'LAW-0211';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {
  write: [0.19, 0.3], headers: [0.34, 0.4], trail1: [0.4, 0.44], walk1: [0.42, 0.58], scan: [0.58, 0.64],
  trail2: [0.64, 0.68], walk2: [0.66, 0.75], place: [0.75, 0.78], walkWait: [0.66, 0.72], placeWait: [0.72, 0.75],
  guide: [0.8, 0.85], notes: [0.82, 0.87],
};
const KEYS = ['A', 'B'];

const STRINGS = {
  en: {...ORG_STRINGS.en, shared: 'Same in A and B'},
  es: {...ORG_STRINGS.es, shared: 'Igual en A y B'},
};

const scenario = who => obj(`Scenario ${who}`, {
  label: str(`Short label for scenario ${who}`, 50),
  caption: str('One-line description of the scenario (as supplied)', 90),
  datum: str('The supplied datum on the file tag in this scenario (the changed fact); matched against the mapping rows', 60),
}, ['label', 'datum']);

const {file: _file, ...shared} = organoFields;
void _file;
const sceneSchema = {
  ...shared,
  file: obj('The case file (fictional); its datum is supplied per scenario', {label: str('Name of the file (fictional)', 50)}, ['label']),
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison', {
    guide: str('Label shown with the guide that joins the changed detail', 70),
    neutral: str('Neutral note (no winner, no outcome; must say that no conclusion is drawn)', 120),
  }),
};

const defaultParams = {
  ...ORG_EN,
  file: {label: 'Case file 24-017 (fictional)'},
  scenarioA: {label: 'Venue selected (as supplied)', caption: 'One mapping row names the supplied datum', datum: 'district = East (fictional)'},
  scenarioB: {label: 'Venue pending (as supplied)', caption: 'No mapping row names the supplied datum', datum: 'district = West (fictional)'},
  changedFact: 'Changed fact: the supplied datum on the file tag',
  sharedFacts: ['Same venues and the same mapping rows', 'Same clerk, same file, same route to the sorting point'],
  comparisonLabels: {guide: 'Only this datum differs', neutral: 'Both scenes are shown as supplied · no winner, no outcome, no conclusion drawn'},
};

const SIZES = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6];

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    // (vertical lanes beside a text column — {key: 'vert', cols: 1, cards: 'stack', colW} — were measured at 1:1 and
    // are not offered: at 19.8 px the column needs 1.2–1.4x the frame height; see the round-3 report)
    for (const key of shape === 'square' ? ['strip', 'band'] : ['band', 'strip']) for (const cols of shape === 'portrait' ? [2, 3] : [4, 3]) for (const cards of ['pair2', 'triple', 'pair']) {
      arrs.push({key, cols, cards});
    }
    let best = null, fallback = null;
    // a plan spanning >= 0.81 of the design width (0.71 of the frame) is required first: the largest text size that
    // allows it wins; only when no size does, the largest size that fits at all
    // (tall frames) the plan also keeps >= 0.5 of the design height, so the text never takes most of the height
    const wide = L2 => L2.M.rect.w >= 0.81 * ctx.design.w - 0.5 && (shape !== 'portrait' || L2.M.rect.h >= 0.5 * ctx.design.h);
    for (const v of SIZES) {
      let pick = null;
      for (const A of arrs) {
        const L = compose(ctx, p, v / px, px, A);
        if (!best || L.problems.length < best.problems.length || (L.problems.length === best.problems.length && L.k > best.k)) best = L;
        if (L.problems.length) continue;
        if (!fallback) fallback = L;
        if (wide(L) && (!pick || L.k > pick.k + 0.002)) pick = L;
      }
      if (pick) { best = pick; fallback = null; break; }
    }
    if (fallback) best = fallback;
    return best;
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      g({name: 'plan', transform: L.M.transform},
        L.art.sheet,
        g({name: 'A-plan'}, L.art.lanes.A),
        g({name: 'B-plan'}, L.art.lanes.B),
        L.art.venues,
        L.lanes.map(S => g(null, S.trail1.node, S.trail2.node)),
        L.lanes.map(S => g({name: `${S.key}-scene`}, S.clerk.node, fileProp(ctx, {name: `${S.key}-file`})))),
      L.badges,
      L.keyNode,
      L.strip.node,
      L.guide && g({name: 'guide', opacity: 0},
        // solid outlines of equal weight on BOTH datum cards and solid leaders (dashes would read as "pending")
        L.guide.outlines.map((b, i) => h('path', {name: `guide-outline${i}`, d: roundRectPath(b.x - 7, b.y - 7, b.w + 14, b.h + 14, 14), fill: 'none', stroke: th.accent3, 'stroke-width': 4})),
        L.guide.paths.map((d, i) => h('path', {name: `guide-path${i}`, d, fill: 'none', stroke: th.accent3, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}))),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const semantic = {scenes: L.lanes.length};
    for (const S of L.lanes) {
      const f = laneFrame(ctx, L, S, u);
      Object.assign(nodes, f.nodes);
      semantic[S.key] = f.sem;
      semantic[`look${S.key}`] = f.look;
      for (const k of ['clerk', 'file', 'hands', 'target']) semantic[`${S.key}${k}`] = f.sem[k];
    }
    // the shared key: its tags are compared in turn while both clerks stand at their sorting points (same for A and B)
    const sp = seg(u, ...W.scan);
    L.rows.forEach((rw, j) => {
      const nm = `vkey${rw.venue}-tag${rw.index}`;
      if (L.tagNames.has(nm)) {
        nodes[`${nm}-scan`] = {opacity: sp > j / L.rows.length && sp < (j + 1) / L.rows.length && sp < 1 ? 1 : 0};
        nodes[`${nm}-hi`] = {opacity: 0};
      }
    });
    const gp = seg(u, ...W.guide);
    if (L.guide) nodes.guide = {opacity: r(gp, 3)};
    const np = seg(u, ...W.notes);
    for (const n of L.strip.late) nodes[n] = {opacity: r(np, 3)};
    return {
      nodes,
      semantic: {
        ...semantic,
        beat: u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide',
        guideShown: r(gp, 3),
        noteShown: r(np, 3),
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: L.arrangement,
        sceneShare: L.sceneShare,
        sceneHeightShare: L.sceneHeightShare,
        venuesShown: L.venuesShown,
        problems: L.problems,
      },
    };
  },
};

/** One lane's frame: the same timeline in A and B; only the supplied datum (and what it leads to) differs. */
function laneFrame(ctx, L, S, u) {
  const nodes = {};
  const K = S.key;
  const G = L.G;
  const lane = G.lanes[K];
  const pending = S.selected < 0;
  const W2 = pending ? W.walkWait : W.walk2, WP = pending ? W.placeWait : W.place;
  const q1 = seg(u, ...W.walk1), q2 = seg(u, ...W2);
  const st = q2 <= 0 ? walkAt(S.leg1, q1, ctx.reduced) : walkAt(S.leg2, q2, ctx.reduced);
  const place = ease.inOutCubic(seg(u, ...WP));
  Object.assign(nodes, clerkNodes(S.clerk, `${K}-clerk`, st, 1 - place, L.ps));
  const fp = carryPoint(st);
  nodes[`${K}-file`] = {transform: T(fp.x, fp.y, st.deg)};
  const d1 = seg(u, ...W.trail1), d2 = seg(u, ...W.trail2);
  Object.assign(nodes, S.trail1.frame(d1, d1 > 0 ? 1 - 0.4 * seg(u, W.walk1[1], W.walk1[1] + 0.05) : 0));
  Object.assign(nodes, S.trail2.frame(d2, d2 > 0 ? 1 : 0));
  Object.assign(nodes, L.art.doors[`${K}-origin`].frame(doorOpenness(lane.intakeDoor, st, st.moving && q2 <= 0)));
  G.venues.forEach((v, i) => Object.assign(nodes, L.art.doors[`${K}-v${i}`].frame(i === S.selected ? doorOpenness(v.lanes[K].door, st, st.moving && q2 > 0) : 0)));
  const matched = S.matchRow >= 0 ? seg(u, W.scan[1] - 0.004, W.scan[1] + 0.01) : 0;
  const wr = seg(u, ...W.write);
  const hd = seg(u, ...W.headers);
  if (S.hasCard) {
    nodes[`${K}-blank`] = {opacity: r(1 - seg(wr, 0, 0.45), 3)};
    nodes[`${K}-value`] = {opacity: r(seg(wr, 0.55, 1), 3)};
    nodes[`${K}-head`] = {opacity: r(hd, 3)};
  }
  const phase = q2 <= 0 ? (q1 <= 0 ? 'intake' : q1 < 1 ? 'walking' : 'junction') : place >= 1 ? 'set-down' : 'to-destination';
  const toD = L.M.toD;
  const inside = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
  // lane-local coordinates (lane A mirrored onto lane B), so identical lanes compare equal
  const sg = lane.sign;
  const loc = q => ({x: r(q.x - lane.off), y: r(q.y * sg)});
  const mdeg = d => r(((sg > 0 ? d : 180 - d) % 360 + 360) % 360, 1);
  return {
    nodes,
    sem: {
      phase, selected: S.selected, matchRow: S.matchRow, matched: r(matched, 3),
      clerk: R2(toD(st)), file: R2(toD(fp)), hands: R2(toD(carryPoint(st))), target: R2(toD(S.target)),
      carry: r(1 - place, 3), route1: r(d1, 3), route2: r(d2, 3),
      inVenue: G.venues.map(v => inside(st, v.box)),
      fileInTray: place >= 1 && !pending,
      fileInSlot: place >= 1 && pending,
      written: r(wr, 3), header: r(hd, 3),
    },
    look: {
      clerk: loc(st), deg: mdeg(st.deg), carry: r(1 - place, 3), file: loc(fp), route1: r(d1, 3), route2: r(d2, 3),
      trail2To: d2 > 0 ? (pending ? 'slot' : `venue${S.selected}`) : null, datum: wr > 0 ? S.datum : '', header: r(hd, 3),
      matched: r(matched, 3), placed: r(place, 3),
    },
  };
}

/** One composition at text size F: the plan (two lanes around the shared venue row) above, the text strip below. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const resA = resolveOrgano(p, {datum: p.scenarioA.datum});
  const resB = resolveOrgano(p, {datum: p.scenarioB.datum});
  const n = resA.venues.length;
  const band = A.key === 'band' && showKey;
  const vert = A.key === 'vert';
  const colW = vert && (showAll || showKey) ? A.colW * D.w : 0;
  const strip = makeStrip(ctx, p, F, vert ? colW : D.w, A.cols, showAll, showKey, resA.venues, A.cards, !band);
  if (strip.problem) problems.push(strip.problem);
  const sGap = F * 0.5;
  const region = vert ? {x: 0, y: 0, w: D.w - colW - (colW ? 24 : 0), h: D.h} : {x: 0, y: 0, w: D.w, h: D.h - strip.h - (strip.h ? sGap : 0)};
  if (vert && strip.h > D.h + 0.5) problems.push('column-height');
  let G, M, keyBlock = null, keyAt = null;
  if (vert) {
    // vertical lanes: the plan turns a quarter (flow up the page; the venue row becomes a column, lane A on the left,
    // lane B on the right), stretched to the region's shape
    G = stretchedLanes(n, {x: 0, y: 0, w: region.h, h: region.w}, {flow: 1400, spread: 400});
    M = mapper(G.extents, region, true, 1.6, {x: 0.5, y: 0.5});
  } else if (!band) {
    // (square) slimmer roads: the plan keeps the frame's width with the text below it; labels hidden: the spurs between
    // the roads and the venue row lengthen until the plan fills the frame
    const caps = {flow: 1400, spread: strip.h ? 260 : 1200};
    G = stretchedLanes(n, region, caps, ctx.view.shape === 'square' ? {...LANE_SPEC, roadW: 100, pad: 8, vh: 176} : LANE_SPEC);
    M = mapper(G.extents, region, false, 1.6, {x: 0.5, y: 0});
  } else {
    // the venue key stands in the band between the two lanes, left of the venue row: the band (the spurs) grows
    // until the key fits it, the roads stretch the plan to the region's width
    const S = LANE_SPEC;
    let spread = 0;
    for (let it = 0; it < 5; it++) {
      const G1 = laneGeometry(n, S, {spread});
      const flow = Math.max(0, Math.min(1400, (region.w / region.h) * G1.extents.h - G1.extents.w));
      G = laneGeometry(n, S, {spread, flow});
      M = mapper(G.extents, region, false, 1.6, {x: 0.5, y: 0});
      // between the intake offices and the plazas (inner plazas take the band beside the venue row)
      const bx0 = G.lanes.B.off + S.iw + G.t + 26, bx1 = (S.inner ? G.lanes.A.plaza.x : G.venues[0].box.x - G.t) - 26;
      const by = G.S.vh / 2 + G.t + G.S.spur;
      const bandBox = M.box({x: bx0, y: -by + 6, w: bx1 - bx0, h: 2 * by - 12});
      keyBlock = venueKeyBlock(ctx, resA.venues, F, bandBox.w);
      keyAt = {x: bandBox.x, y: bandBox.y + (bandBox.h - keyBlock.h) / 2, w: keyBlock.w, h: keyBlock.h};
      const needT = (keyBlock.h + 12) / M.k;
      const more = (needT - (2 * by - 12)) / 2;
      if (more <= 0.5 || spread >= 400) break;
      spread = Math.min(400, spread + more);
    }
    if (keyBlock.truncated) problems.push('key-trunc');
    if (keyAt.h > (G.S.vh + 2 * G.t + 2 * G.S.spur - 12) * M.k + 1) problems.push('key-room');
  }
  const k = M.k;
  // people: the courts "micro" person scale (1.2x the plan scale); 1.35x in the square frame, where the full-width
  // plan shares the height with the text (people stay >= 60 px)
  const ps = ctx.view.shape === 'square' ? 1.35 : LANE_SPEC.ps;
  const personPx = 100 * k * ps * px;
  if (personPx < 60.5) problems.push('small');
  if (vert) strip.place(Math.max(0, (D.h - strip.h) / 2), region.w + 24);
  else strip.place(Math.max(M.rect.y + M.rect.h, keyAt ? keyAt.y + keyAt.h : 0) + sGap, 0);
  const keyNode = keyBlock ? keyBlock.node(keyAt.x, keyAt.y) : null;
  const art = laneArt(ctx, G, {prefix: 'ls'});
  const lanes = [['A', resA, p.scenarioA.datum], ['B', resB, p.scenarioB.datum]].map(([key, res, datum]) => {
    const lane = G.lanes[key];
    const pending = res.selected < 0;
    const leg1 = makeLeg(lane.leg1, 90, 90);
    const leg2 = pending ? makeLeg(lane.legWait, 90, lane.slotDeg) : makeLeg(lane.legTo[res.selected], 90, G.venues[res.selected].lanes[key].deg);
    const target = pending ? {x: lane.slot.x, y: lane.slot.y} : G.venues[res.selected].lanes[key].tray;
    return {
      key, res, selected: res.selected, matchRow: res.matchRow, datum, leg1, leg2, target, hasCard: Boolean(strip.cards && strip.cards[key]),
      trail1: routeTrail(ctx, {name: `${key}-trail1`, pts: lane.leg1, width: 6}),
      trail2: routeTrail(ctx, {name: `${key}-trail2`, pts: leg2.pts, width: 7, color: pending ? th.inkSoft : undefined}),
      clerk: planPerson(ctx, {name: `${key}-clerk`, look: clerkLook(ctx, p)}),
    };
  });
  // venue badges (the number keys each venue to its name in the key), top-right inside the venue
  const bR = F * 0.72;
  const badges = showKey ? G.venues.map((v, i) => {
    const c = M.toD({x: v.box.x + v.box.w - 30, y: v.box.y + v.box.h / 2});
    return venueBadge(ctx, i, c.x, c.y, bR, F, `vbadge${i}`);
  }) : [];
  // the guide: both datum cards outlined identically, joined to the guide card
  let guide = null;
  if (showKey && strip.cards && strip.cards.A && strip.cards.B && strip.chipBox) {
    const a = strip.cards.A.dbox, b = strip.cards.B.dbox, cb = strip.chipBox;
    const paths = [];
    if (A.cards === 'pair2') {
      const gy = strip.gapY, cx = cb.x + cb.w / 2;
      paths.push(`M${r(a.x + a.w / 2)} ${r(a.y + a.h + 7)}V${r(gy)}H${r(cx - 12)}V${r(cb.y - 2)}`, `M${r(b.x + b.w / 2)} ${r(b.y + b.h + 7)}V${r(gy)}H${r(cx + 12)}V${r(cb.y - 2)}`);
    } else if (A.cards === 'stack') {
      // along the left margin of the column, from each datum card to the guide card
      const xl = Math.min(a.x, b.x) - 16, ym = cb.y + cb.h / 2;
      paths.push(`M${r(a.x - 7)} ${r(a.y + a.h / 2)}H${r(xl)}V${r(ym - 8)}H${r(cb.x - 2)}`, `M${r(b.x - 7)} ${r(b.y + b.h / 2)}H${r(xl)}V${r(ym + 8)}H${r(cb.x - 2)}`);
    } else if (A.cards === 'triple') {
      const ym = cb.y + cb.h / 2;
      const xa = (a.x + a.w + 7 + cb.x) / 2, xb = (cb.x + cb.w + b.x - 7) / 2;
      paths.push(`M${r(a.x + a.w + 7)} ${r(a.y + a.h / 2)}H${r(xa)}V${r(ym)}H${r(cb.x - 2)}`, `M${r(b.x - 7)} ${r(b.y + b.h / 2)}H${r(xb)}V${r(ym)}H${r(cb.x + cb.w + 2)}`);
    } else {
      const ym = cb.y + cb.h / 2;
      paths.push(`M${r(a.x + a.w / 2)} ${r(a.y + a.h + 7)}V${r(ym)}H${r(cb.x - 2)}`, `M${r(b.x + b.w / 2)} ${r(b.y + b.h + 7)}V${r(ym)}H${r(cb.x + cb.w + 2)}`);
    }
    guide = {outlines: [a, b], paths};
  }
  // audit: texts inside the frame, never overlapping; the plan clear of the strip
  const texts = [...strip.boxes];
  if (keyAt) { texts.push(keyAt); if (band && keyAt.x + keyAt.w > M.toD({x: G.venues[0].box.x - G.t, y: 0}).x - 4) problems.push('key-venues'); }
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (overlaps(texts[i], texts[j], 2)) { problems.push('overlap'); i = texts.length; break; }
  if (texts.some(b => b.x < -0.5 || b.y < -0.5 || b.x + b.w > D.w + 0.5 || b.y + b.h > D.h + 0.5)) problems.push('frame');
  if (strip.boxes.some(b => overlaps(b, M.rect, -1))) problems.push('text-on-plan');
  const tagNames = new Set(showKey ? resA.rows.map(rw => `vkey${rw.venue}-tag${rw.index}`) : []);
  return {
    F, px, k, ps, G, M, art, lanes, strip, guide, badges, keyNode, rows: resA.rows, tagNames, personPx, problems,
    sceneShare: r(M.rect.w / D.w, 3), sceneHeightShare: r(M.rect.h / D.h, 3), venuesShown: n,
    arrangement: `lanes/${A.key}/${A.cols}/${A.cards}`,
  };
}

/** The venue key as a block of rows (badge, tint, name, then its mapping tags), for the band beside the venue row. */
function venueKeyBlock(ctx, venues, F, width) {
  const th = ctx.theme;
  const bs = F * 1.44;
  let trunc = false;
  const rows = venues.map(v => {
    const tint = VENUE_TINTS[v.index % VENUE_TINTS.length];
    const nf = fitG(v.name, {maxWidth: width - bs - F * 0.9, size: F, minSize: F, maxLines: 3, weight: 700});
    const x0 = bs + F * 0.8;
    const inline = nf.lines.length === 1 && v.tags.length === 1;
    const chips = v.tags.map(tg => ({tg, c: tagChip(ctx, tg.datum, {F, maxWidth: inline ? width - x0 - nf.width - F * 0.6 : width - x0, maxLines: 3})}));
    const fitsInline = inline && chips[0].c.w <= width - x0 - nf.width - F * 0.6 && !chips[0].c.fit.truncated && chips[0].c.fit.lines.length === 1;
    const cs = fitsInline ? chips : v.tags.map(tg => ({tg, c: tagChip(ctx, tg.datum, {F, maxWidth: width - x0, maxLines: 3})}));
    if (nf.truncated || cs.some(q => q.c.fit.truncated)) trunc = true;
    const headH = Math.max(bs, nf.height);
    const hh = fitsInline ? Math.max(headH, cs[0].c.h) : headH + cs.reduce((a, q) => a + F * 0.2 + q.c.h, 0);
    const w = fitsInline ? x0 + nf.width + F * 0.6 + cs[0].c.w : Math.max(x0 + nf.width, ...cs.map(q => x0 + q.c.w));
    return {h: hh, w, node: (x, y) => {
      const parts = [venueBadge(ctx, v.index, x + bs / 2, y + bs / 2, bs / 2, F),
        h('rect', {x: r(x + bs + F * 0.2), y: r(y + F * 0.1), width: r(F * 0.35), height: r(headH - F * 0.2), rx: 3, fill: tint, stroke: shade(tint, -0.45), 'stroke-width': 1.5}),
        textAt(nf, x + x0, y + Math.max(0, (bs - nf.height) / 2), th.ink)];
      if (fitsInline) parts.push(cs[0].c.node(x + x0 + nf.width + F * 0.6, y + (headH - cs[0].c.h) / 2, `vkey${v.index}-tag${cs[0].tg.index}`));
      else { let yy = y + headH; for (const q of cs) { yy += F * 0.2; parts.push(q.c.node(x + x0, yy, `vkey${v.index}-tag${q.tg.index}`)); yy += q.c.h; } }
      return g({name: `vkey${v.index}`}, parts);
    }};
  });
  const gap = F * 0.38;
  const hh = rows.reduce((a, q) => a + q.h, 0) + gap * (rows.length - 1);
  return {h: hh, w: Math.max(...rows.map(q => q.w)), truncated: trunc, node: (x, y) => {
    let yy = y;
    return g({name: 'venue-key'}, rows.map(q => { const nd = q.node(x, yy); yy += q.h + gap; return nd; }));
  }};
}

/** A number badge keying a venue to its name in the key (neutral ink disc, white number). */
function venueBadge(ctx, i, x, y, R, F, name) {
  const tint = VENUE_TINTS[i % VENUE_TINTS.length];
  return g({name},
    h('circle', {cx: r(x), cy: r(y), r: r(R), fill: ctx.theme.ink, stroke: shade(tint, -0.2), 'stroke-width': 3}),
    h('text', {x: r(x), y: r(y + F * 0.36), 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#fff'}, String(i + 1)));
}

/**
 * The scene card: A / B badge, scenario label + caption (they appear after the
 * change) and the datum card (the file's tag: prefix, then the value, blank
 * until the change). Side by side when there is room, else stacked.
 */
function sceneCard(ctx, p, key, F, maxW, flip = false) {
  const th = ctx.theme;
  const sc = key === 'A' ? p.scenarioA : p.scenarioB;
  const lane = key === 'A' ? th.accent2 : th.accent4;
  const bs = F * 1.5;
  const make = (hw, dw, side) => {
    const tw = hw - bs - F * 0.6;
    const lab = fitG(sc.label, {maxWidth: tw, size: F, minSize: F, maxLines: 3, weight: 700});
    const Fc = Math.max(F * 0.84, Math.min(F, 19.6 / pxPerUnit(ctx)), 16.6 / pxPerUnit(ctx));
    const cap = sc.caption ? fitG(sc.caption, {maxWidth: tw, size: Fc, minSize: Fc, maxLines: 4, weight: 500}) : null;
    const tx = F * 2.8;
    const pre = fitG(`${p.labels.datum}:`, {maxWidth: dw - tx - F * 0.6, size: F, minSize: F, maxLines: 2, weight: 500});
    const val = fitG(sc.datum, {maxWidth: dw - tx - F * 0.6, size: F, minSize: F, maxLines: 3, weight: 700});
    const headW = bs + F * 0.6 + Math.max(lab.width, cap ? cap.width : 0);
    const headH = Math.max(bs, lab.height + (cap ? F * 0.4 + cap.height : 0) + F * 0.2);
    const dW = tx + Math.max(pre.width, val.width, F * 9) + F * 0.6;
    const dH = pre.height + F * 0.45 + Math.max(val.height, F * 1.2) + F * 0.9;
    const truncated = [lab, cap, pre, val].some(f => f && f.truncated);
    const w = side ? headW + F * 0.9 + dW : Math.max(headW, dW);
    const hh = side ? Math.max(headH, dH) : headH + F * 0.45 + dH;
    return {w, h: hh, truncated, side, node(x, y) {
      const hx = side && flip ? x + dW + F * 0.9 : x, hy = y + (side ? Math.max(0, (dH - headH) / 2) : 0);
      const dx0 = side && !flip ? x + headW + F * 0.9 : x, dy = side ? y : y + headH + F * 0.45;
      const tx0 = dx0 + tx;
      const vy = dy + F * 0.45 + pre.height + F * 0.45;
      return g({name: `${key}-card`},
        h('circle', {cx: r(hx + bs / 2), cy: r(hy + bs / 2), r: r(bs / 2), fill: lane}),
        h('text', {x: r(hx + bs / 2), y: r(hy + bs / 2 + F * 0.36), 'font-family': FONT, 'font-size': r(F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#fff'}, key),
        g({name: `${key}-head`, opacity: 0},
          textAt(lab, hx + bs + F * 0.6, hy, th.ink),
          cap ? textAt(cap, hx + bs + F * 0.6, hy + lab.height + F * 0.4, th.fgSoft) : null),
        h('path', {name: `${key}-dcard`, d: roundRectPath(dx0, dy, dW, dH, 12), fill: th.card, stroke: th.accent3, 'stroke-width': 2.4}),
        g({transform: T(dx0 + F * 1.4, dy + dH / 2)}, tagGlyph(ctx, F * 1.3)),
        textAt(pre, tx0, dy + F * 0.45, th.fgSoft),
        h('path', {name: `${key}-blank`, d: `M${r(tx0)} ${r(vy + F * 0.95)}h${r(F * 8)}`, stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '8 6'}),
        g({name: `${key}-value`, opacity: 0}, textAt(val, tx0, vy, th.ink)),
      );
    }, datumBox: (x, y) => { const dx0 = side && !flip ? x + headW + F * 0.9 : x; return {x: dx0, y: side ? y : y + headH + F * 0.45, w: dW, h: dH}; }};
  };
  if (maxW >= F * 22) {
    const side = make(maxW * 0.44, maxW * 0.56 - F * 0.9, true);
    if (!side.truncated) return side;
  }
  return make(maxW, maxW, false);
}

function guideChip(ctx, text, F, maxW, sub = null) {
  const th = ctx.theme;
  const f = fitG(text, {maxWidth: maxW - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 700});
  const f2 = sub ? fitG(sub, {maxWidth: maxW - F * 1.2, size: F, minSize: F, maxLines: 4, weight: 500}) : null;
  const w = Math.max(f.width, f2 ? f2.width : 0) + F * 1.2, hh = f.height + (f2 ? F * 0.4 + f2.height : 0) + F * 0.8;
  return {w, h: hh, truncated: f.truncated || Boolean(f2 && f2.truncated), node: (x, y) => g({name: 'guide-card'},
    h('path', {d: roundRectPath(x, y, w, hh, Math.min(hh / 2, F * 0.7)), fill: th.card, stroke: th.accent3, 'stroke-width': 3}),
    textAt(f, x + F * 0.6, y + F * 0.4, th.ink),
    f2 ? textAt(f2, x + F * 0.6, y + F * 0.4 + f.height + F * 0.4, th.ink) : null)};
}

/** The legend as flowing lines (glyph + caption pairs wrapping across `width`). */
function legendFlow(ctx, p, F, Fc, width) {
  const th = ctx.theme;
  const gs = F * 1.6;
  const src = [['file', p.file.label], ['office', p.courts.origin], ['plaza', p.labels.junction], ['tray', p.seats.arrival], ['slot', p.seats.waiting]];
  const mk = maxW => src.map(([kind, text]) => {
    const strong = kind === 'office' || kind === 'file';
    const f = fitG(text, {maxWidth: maxW - gs - 10, size: strong ? F : Fc, minSize: strong ? F : Fc, maxLines: 3, weight: strong ? 700 : 500});
    return {kind, f, w: gs + 10 + f.width, h: Math.max(gs, f.height)};
  });
  const cands = [];
  // (1) flowing lines, the entries in the order that needs the fewest lines
  {
    const entries = mk(width);
    const flow = list => {
      const ls = [];
      let cur = [], cw0 = 0;
      for (const e of list) {
        if (cur.length && cw0 + F * 1.4 + e.w > width) { ls.push(cur); cur = []; cw0 = 0; }
        cw0 += (cur.length ? F * 1.4 : 0) + e.w;
        cur.push(e);
      }
      if (cur.length) ls.push(cur);
      return ls;
    };
    const perms = a => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(r2 => [x, ...r2])));
    let lines = flow(entries);
    for (const pm of perms(entries)) { const ls = flow(pm); if (ls.length < lines.length) lines = ls; }
    const lh = lines.map(l => Math.max(...l.map(e => e.h)));
    const items = [];
    let yy = 0;
    lines.forEach((l, li) => { let x = 0; for (const e of l) { items.push({e, x, y: yy, rh: lh[li]}); x += e.w + F * 1.4; } yy += lh[li] + F * 0.35; });
    cands.push({items, h: yy - F * 0.35, truncated: entries.some(e => e.f.truncated)});
  }
  // (2) a grid of 2 or 3 columns (entries may wrap inside their cell)
  for (const c of [2, 3]) {
    const cg = F * 1.2, cw = (width - cg * (c - 1)) / c;
    if (cw < 200) continue;
    const entries = mk(cw);
    const items = [];
    let yy = 0;
    for (let r0 = 0; r0 < entries.length; r0 += c) {
      const row = entries.slice(r0, r0 + c);
      const rh = Math.max(...row.map(e => e.h));
      row.forEach((e, j) => items.push({e, x: j * (cw + cg), y: yy, rh}));
      yy += rh + F * 0.35;
    }
    cands.push({items, h: yy - F * 0.35, truncated: entries.some(e => e.f.truncated)});
  }
  const best = cands.filter(q => !q.truncated).sort((a2, b2) => a2.h - b2.h)[0] || cands[0];
  return {truncated: best.truncated, h: best.h, w: Math.max(...best.items.map(q => q.x + q.e.w)), place: (x0, y) => {
    const nodes = [], boxes = [];
    for (const {e, x, y: yy, rh} of best.items) {
      nodes.push(g({name: `legend-${e.kind}`}, g({transform: T(x0 + x + gs / 2, y + yy + rh / 2)}, stripGlyph(ctx, e.kind, gs)), textAt(e.f, x0 + x + gs + 10, y + yy + (rh - e.f.height) / 2, th.fg)));
      boxes.push({x: x0 + x, y: y + yy, w: e.w, h: e.h});
    }
    return {nodes, boxes};
  }};
}

/**
 * The strip under the plan: the venue key (one cell per venue: number badge, tint, name, mapping tags), the scene
 * cards with the guide card (guide label + changed fact), then the legend, shared facts, neutral note and key.
 * cards: 'triple' = A | guide | B in one row; 'pair' = A | B, the guide card centred under them.
 */
function makeStrip(ctx, p, F, width, cols, showAll, showKey, venues, cards, keyInStrip = true, legendInStrip = true) {
  const th = ctx.theme;
  const Fc = Math.max(F * 0.84, Math.min(F, 19.6 / pxPerUnit(ctx)), 16.6 / pxPerUnit(ctx));
  const out = {h: 0, boxes: [], node: null, late: [], problem: null, cards: {}, chipBox: null, place: () => {}};
  const blocks = [];
  let trunc = false;
  // ---- venue key: cells in one row (or one per row when a cell would be too narrow)
  if (showKey && keyInStrip) {
    const gap = F * 0.7;
    const perRow = width / venues.length - gap >= 250 ? venues.length : 1;
    const cw = (width - gap * (perRow - 1)) / perRow;
    const cells = venues.map(v => {
      const tint = VENUE_TINTS[v.index % VENUE_TINTS.length];
      const bs = F * 1.44;
      const nf = fitG(v.name, {maxWidth: cw - bs - F * 0.8, size: F, minSize: F, maxLines: 3, weight: 700});
      // the tag chips run the cell's full width under the name (fewer wrapped lines)
      const chips = v.tags.map(tg => ({tg, c: tagChip(ctx, tg.datum, {F, maxWidth: cw, maxLines: 3})}));
      if (nf.truncated || chips.some(q => q.c.fit.truncated)) trunc = true;
      const hh = Math.max(bs, nf.height) + chips.reduce((acc, q) => acc + F * 0.3 + q.c.h, 0);
      return {h: hh, node: (x, y) => {
        const parts = [venueBadge(ctx, v.index, x + bs / 2, y + bs / 2, bs / 2, F),
          h('rect', {x: r(x + bs + F * 0.25), y: r(y + F * 0.1), width: r(F * 0.35), height: r(Math.max(bs, nf.height) - F * 0.2), rx: 3, fill: tint, stroke: shade(tint, -0.45), 'stroke-width': 1.5}),
          textAt(nf, x + bs + F * 0.8, y + Math.max(0, (bs - nf.height) / 2), th.ink)];
        let yy = y + Math.max(bs, nf.height);
        for (const q of chips) { yy += F * 0.3; parts.push(q.c.node(x, yy, `vkey${v.index}-tag${q.tg.index}`)); yy += q.c.h; }
        return g({name: `vkey${v.index}`}, parts);
      }};
    });
    for (let i = 0; i < cells.length; i += perRow) {
      const row = cells.slice(i, i + perRow);
      const hh = Math.max(...row.map(c => c.h));
      blocks.push({h: hh, place: (x0, y) => row.map((c, j) => { const x = x0 + j * (cw + gap); out.boxes.push({x, y, w: cw, h: c.h}); return c.node(x, y); })});
    }
  }
  // ---- the scene cards and the guide card
  if (showKey) {
    const gap = F * 1.4;
    if (cards === 'pair2') {
      // A | B cards side by side; under them one row: shared facts | guide card | neutral note + key
      const wc = (width - gap) / 2;
      const ca = sceneCard(ctx, p, 'A', F, wc, false), cbd = sceneCard(ctx, p, 'B', F, wc, false);
      if (ca.truncated || cbd.truncated) trunc = true;
      const hh = Math.max(ca.h, cbd.h);
      // the block keeps a lane under the cards for the guide's leaders (they never cross the next row's texts)
      blocks.push({h: hh + F * 0.75, place: (x0, y) => {
        const xa = x0, xb = x0 + wc + gap;
        out.cards.A = {box: {x: xa, y, w: ca.w, h: ca.h}, dbox: ca.datumBox(xa, y)};
        out.cards.B = {box: {x: xb, y, w: cbd.w, h: cbd.h}, dbox: cbd.datumBox(xb, y)};
        out.boxes.push(out.cards.A.box, out.cards.B.box);
        out.gapY = y + hh + F * 0.55;
        return [ca.node(xa, y), cbd.node(xb, y)];
      }});
      const cg = F * 1.2;
      const cellsFor = (fS, fG) => {
      let trunc = false;
      const wS = (width - cg * 2) * fS, wG = (width - cg * 2) * fG, wN = width - cg * 2 - wS - wG;
      const cells = [];
      if (showAll && p.sharedFacts.length) {
        const head = fitG(ctx.t.shared, {maxWidth: wS, size: F, minSize: F, maxLines: 2, weight: 700});
        const fs = p.sharedFacts.map(t => fitG(t, {maxWidth: wS - F * 1.1, size: F, minSize: F, maxLines: 4, weight: 500}));
        if (head.truncated || fs.some(f => f.truncated)) trunc = true;
        cells.push({x: 0, w: wS, h: head.height + fs.reduce((acc, f) => acc + F * 0.35 + f.height, 0), node: (x, y) => {
          let yy = y + head.height + F * 0.35;
          return g({name: 'shared'}, textAt(head, x, y, th.fg), fs.map(f => { const nd = g(null, h('circle', {cx: r(x + F * 0.35), cy: r(yy + F * 0.5), r: r(F * 0.18), fill: th.fgSoft}), textAt(f, x + F * 1.1, yy, th.fg)); yy += f.height + F * 0.35; return nd; }));
        }});
      }
      const gc = guideChip(ctx, p.comparisonLabels.guide, F, wG, p.changedFact);
      if (gc.truncated) trunc = true;
      cells.push({x: wS + cg + (wG - gc.w) / 2, w: gc.w, h: gc.h, chip: true, node: (x, y) => gc.node(x, y)});
      const nf = fitG(p.comparisonLabels.neutral, {maxWidth: wN - F * 1.2, size: Fc, minSize: Fc, maxLines: 6, weight: 600});
      const kf = fitG(p.labels.key, {maxWidth: wN - 8, size: Fc, minSize: Fc, maxLines: 5, weight: 500});
      if (nf.truncated || kf.truncated) trunc = true;
      const nH = nf.height + F * 0.8;
      cells.push({x: wS + wG + cg * 2, w: wN, h: nH + F * 0.6 + kf.height + F * 0.45, node: (x, y) => g(null,
        g({name: 'neutral', opacity: 0}, h('path', {d: roundRectPath(x, y, nf.width + F * 1.2, nH, Math.min(nH / 2, F * 0.7)), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 2}), textAt(nf, x + F * 0.6, y + F * 0.4, th.fg)),
        g({name: 'key'}, h('path', {d: `M${r(x)} ${r(y + nH + F * 0.6)}H${r(x + Math.min(wN, kf.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}), textAt(kf, x, y + nH + F * 1.05, th.fgSoft, {italic: true})))});
      return {cells, trunc, h: Math.max(...cells.map(c => c.h))};
      };
      // the split of the row that keeps it lowest (untruncated first)
      let bestRow = null;
      for (const [fS, fG] of [[0.44, 0.27], [0.4, 0.26], [0.38, 0.3], [0.46, 0.24], [0.34, 0.28], [0.36, 0.24], [0.33, 0.25], [0.38, 0.22], [0.35, 0.21], [0.32, 0.32], [0.3, 0.34], [0.34, 0.31]]) {
        const c = cellsFor(fS, fG);
        if (!bestRow || (bestRow.trunc && !c.trunc) || (bestRow.trunc === c.trunc && c.h < bestRow.h - 0.5)) bestRow = c;
      }
      if (bestRow.trunc) trunc = true;
      const cells = bestRow.cells;
      out.late.push('neutral');
      const rh = Math.max(...cells.map(c => c.h));
      blocks.push({h: rh, place: (x0, y) => cells.map(c => {
        if (c.chip) out.chipBox = {x: x0 + c.x, y, w: c.w, h: c.h};
        out.boxes.push({x: x0 + c.x, y, w: c.w, h: c.h});
        return c.node(x0 + c.x, y);
      })});
    } else if (cards === 'stack') {
      // (text column) A's card, the guide card, B's card one under the other; the guide's leaders run down the left
      const ca = sceneCard(ctx, p, 'A', F, width - F * 1.4, false), cbd = sceneCard(ctx, p, 'B', F, width - F * 1.4, false);
      const gc = guideChip(ctx, p.comparisonLabels.guide, F, width - F * 2.4, p.changedFact);
      if (ca.truncated || cbd.truncated || gc.truncated) trunc = true;
      const g1 = F * 0.9;
      blocks.push({h: ca.h + g1 + gc.h + g1 + cbd.h, place: (x0, y) => {
        const xc = x0 + F * 1.4;
        const yg = y + ca.h + g1, yb = yg + gc.h + g1;
        out.cards.A = {box: {x: xc, y, w: ca.w, h: ca.h}, dbox: ca.datumBox(xc, y)};
        out.cards.B = {box: {x: xc, y: yb, w: cbd.w, h: cbd.h}, dbox: cbd.datumBox(xc, yb)};
        out.chipBox = {x: xc + F, y: yg, w: gc.w, h: gc.h};
        out.boxes.push(out.cards.A.box, out.cards.B.box, out.chipBox);
        return [ca.node(xc, y), gc.node(xc + F, yg), cbd.node(xc, yb)];
      }});
    } else if (cards === 'triple') {
      const wc = (width - gap * 2) * 0.37, wg = width - gap * 2 - wc * 2;
      const ca = sceneCard(ctx, p, 'A', F, wc, false), cbd = sceneCard(ctx, p, 'B', F, wc, false);
      const gc = guideChip(ctx, p.comparisonLabels.guide, F, wg, p.changedFact);
      if (ca.truncated || cbd.truncated || gc.truncated) trunc = true;
      const hh = Math.max(ca.h, cbd.h, gc.h);
      blocks.push({h: hh, place: (x0, y) => {
        const xa = x0, xg = x0 + wc + gap + (wg - gc.w) / 2, xb = x0 + width - cbd.w;
        const gy = y + Math.max(0, (hh - gc.h) / 2);
        out.cards.A = {box: {x: xa, y, w: ca.w, h: ca.h}, dbox: ca.datumBox(xa, y)};
        out.cards.B = {box: {x: xb, y, w: cbd.w, h: cbd.h}, dbox: cbd.datumBox(xb, y)};
        out.chipBox = {x: xg, y: gy, w: gc.w, h: gc.h};
        out.boxes.push(out.cards.A.box, out.cards.B.box, out.chipBox);
        return [ca.node(xa, y), cbd.node(xb, y), gc.node(xg, gy)];
      }});
    } else {
      const wc = (width - gap) / 2;
      const ca = sceneCard(ctx, p, 'A', F, wc, false), cbd = sceneCard(ctx, p, 'B', F, wc, false);
      const gc = guideChip(ctx, p.comparisonLabels.guide, F, Math.min(width * 0.6, 560), p.changedFact);
      if (ca.truncated || cbd.truncated || gc.truncated) trunc = true;
      const hh = Math.max(ca.h, cbd.h);
      blocks.push({h: hh + F * 1.2 + gc.h, place: (x0, y) => {
        const xa = x0, xb = x0 + wc + gap;
        const gy = y + hh + F * 1.2, xg = x0 + (width - gc.w) / 2;
        out.cards.A = {box: {x: xa, y, w: ca.w, h: ca.h}, dbox: ca.datumBox(xa, y)};
        out.cards.B = {box: {x: xb, y, w: cbd.w, h: cbd.h}, dbox: cbd.datumBox(xb, y)};
        out.chipBox = {x: xg, y: gy, w: gc.w, h: gc.h};
        out.boxes.push(out.cards.A.box, out.cards.B.box, out.chipBox);
        return [ca.node(xa, y), cbd.node(xb, y), gc.node(xg, gy)];
      }});
    }
    out.late.push('guide-card');
  }
  // ---- the legend as one flowing line (glyph + caption pairs wrapping across the width)
  if (showAll && legendInStrip) {
    const lg = legendFlow(ctx, p, F, Fc, width);
    if (lg.truncated) trunc = true;
    blocks.push({h: lg.h, place: (x0, y) => { const r2 = lg.place(x0, y); out.boxes.push(...r2.boxes); return r2.nodes; }});
  }
  // ---- columns: shared facts, neutral note, key (in 'pair2' they already sit under the cards)
  const items = [];
  if (showAll && cards !== 'pair2') {
    if (p.sharedFacts.length) {
      items.push({key: 'shared', make: w => {
        const head = fitG(ctx.t.shared, {maxWidth: w, size: F, minSize: F, maxLines: 2, weight: 700});
        const fs = p.sharedFacts.map(t => fitG(t, {maxWidth: w - F * 1.1, size: F, minSize: F, maxLines: 4, weight: 500}));
        const hh = head.height + fs.reduce((acc, f) => acc + F * 0.35 + f.height, 0) + F * 0.25;
        return {h: hh, truncated: head.truncated || fs.some(f => f.truncated), node: (x, y) => {
          let yy = y + head.height + F * 0.35;
          return g({name: 'shared'}, textAt(head, x, y, th.fg), fs.map(f => { const nd = g(null, h('circle', {cx: r(x + F * 0.35), cy: r(yy + F * 0.5), r: r(F * 0.18), fill: th.fgSoft}), textAt(f, x + F * 1.1, yy, th.fg)); yy += f.height + F * 0.35; return nd; }));
        }};
      }});
    }
  }
  if (showKey && cards !== 'pair2') {
    items.push({key: 'neutral', late: true, make: w => {
      const f = fitG(p.comparisonLabels.neutral, {maxWidth: w - F * 1.2, size: Fc, minSize: Fc, maxLines: 5, weight: 600});
      const hh = f.height + F * 0.8;
      return {h: hh, truncated: f.truncated, node: (x, y) => g({name: 'neutral', opacity: 0},
        h('path', {d: roundRectPath(x, y, f.width + F * 1.2, hh, Math.min(hh / 2, F * 0.7)), fill: th.paper, stroke: th.inkSoft, 'stroke-width': 2}),
        textAt(f, x + F * 0.6, y + F * 0.4, th.fg))};
    }});
    items.push({key: 'key', make: w => {
      const f = fitG(p.labels.key, {maxWidth: w - 8, size: Fc, minSize: Fc, maxLines: 5, weight: 500});
      return {h: f.height + F * 0.75, truncated: f.truncated, node: (x, y) => g({name: 'key'},
        h('path', {d: `M${r(x)} ${r(y)}H${r(x + Math.min(w, f.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
        textAt(f, x, y + F * 0.45, th.fgSoft, {italic: true}))};
    }});
  }
  const gap = F * 0.6, colGap = F * 1.4;
  const cw = (width - colGap * (cols - 1)) / cols;
  const made = items.map(it => ({it, m: it.make(cw)}));
  if (trunc || made.some(q => q.m.truncated)) out.problem = 'strip-trunc';
  const hOf = arr => arr.reduce((acc, q) => acc + q.m.h, 0) + gap * Math.max(0, arr.length - 1);
  let columns = made.length ? [made] : [];
  let bestV = Infinity;
  const tryCols = cs => { const v = Math.max(...cs.map(hOf)); if (cs.every(c => c.length) && v < bestV) { bestV = v; columns = cs; } };
  const nI = made.length;
  if (nI > cols) {
    for (let a = 1; a < nI; a++) {
      if (cols === 2) { tryCols([made.slice(0, a), made.slice(a)]); continue; }
      for (let b = a + 1; b < nI; b++) {
        if (cols === 3) tryCols([made.slice(0, a), made.slice(a, b), made.slice(b)]);
        else for (let c = b + 1; c < nI; c++) tryCols([made.slice(0, a), made.slice(a, b), made.slice(b, c), made.slice(c)]);
      }
    }
  } else if (nI) columns = made.map(q => [q]);
  const colsH = columns.length ? Math.max(...columns.map(hOf)) : 0;
  const bGap = F * 0.38;
  out.h = blocks.reduce((acc, b) => acc + b.h + bGap, 0) + colsH;
  if (!blocks.length && !colsH) out.h = 0;
  out.late.push(...made.filter(q => q.it.late).map(q => q.it.key));
  out.place = (y00, x0 = 0) => {
    const nodes = [];
    out.boxes = [];
    let y = y00;
    for (const b of blocks) { nodes.push(...b.place(x0, y)); y += b.h + bGap; }
    columns.forEach((col, ci) => {
      const x = x0 + ci * (cw + colGap);
      let yy = y;
      for (const q of col) { nodes.push(q.m.node(x, yy)); out.boxes.push({x, y: yy, w: cw, h: q.m.h}); yy += q.m.h + gap; }
    });
    out.node = g({name: 'strip'}, nodes);
  };
  return out;
}

/** Glyphs of the strip legend (design units, centre at the origin). */
function stripGlyph(ctx, kind, s) {
  if (kind === 'office') {
    return g(null,
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.36), width: r(s * 0.84), height: r(s * 0.72), fill: '#f5efe3', stroke: '#454b53', 'stroke-width': r(s * 0.12)}),
      h('rect', {x: r(s * 0.3), y: r(-s * 0.14), width: r(s * 0.16), height: r(s * 0.28), fill: '#fff'}));
  }
  if (kind === 'plaza') {
    return g(null,
      h('rect', {x: r(-s * 0.42), y: r(-s * 0.36), width: r(s * 0.84), height: r(s * 0.72), rx: 4, fill: '#e7dcc6', stroke: '#a89c86', 'stroke-width': 3}),
      h('path', {d: `M${r(-s * 0.42)} 0H${r(s * 0.42)}M0 ${r(-s * 0.36)}V${r(s * 0.36)}`, stroke: '#cbbd9f', 'stroke-width': 2}));
  }
  return legendGlyph(ctx, kind, s);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-03-contrast',
    title: 'Venue assignment — the same file with two supplied data: a venue named by the mapping, or venue pending',
    titleEs: 'Asignación de órgano — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Asignación de órgano',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical site plans with the same venues, mapping rows, clerk and file. Only the supplied datum on the file tag differs: in A one mapping row names it, so the file is carried to that venue and set in its in-tray; in B no row names it, so the file waits in the dashed slot at the sorting point. A guide joins the two datum cards; no winner, outcome or legal consequence is shown.',
    tags: ['contrast', 'site plan', 'venue', 'case file', 'mapping', 'pending', 'sorting point', 'clerk', 'paired scenes'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
