/**
 * LAW-0209 — Asignación de órgano · story
 *
 * Storyboard (a site plan seen from above, drawn on a paper sheet: the intake
 * office on one side, a main road to the sorting point — a plaza where the road
 * meets an avenue — and spurs from the avenue to the doors of two or three
 * generic venues; each venue has a receiving desk with an in-tray and a second
 * room; a dashed waiting slot sits on the plaza. On wide frames the flow runs
 * left → right with each venue's name and mapping tags beside it; on tall
 * frames the plan is turned so the flow runs upwards and the tags stand above
 * the venues. A panel holds the file card — its name and the SUPPLIED datum on
 * its tag — the legend, the state and the key):
 *  0.00–0.15  rest: the clerk stands in the intake office holding the case file
 *             (its tag visible); every venue shows its editable name and the
 *             mapping rows that name it ("district = East (fictional)").
 *  0.15–0.42  the action starts: a dotted route draws from the office through
 *             its door along the road; the door swings open; the clerk walks,
 *             file in both hands, to the sorting point and stops. A callout
 *             reads the file's datum; each venue tag is compared in turn (a
 *             dashed scan outline) and the tag whose datum EQUALS the file's
 *             datum — the supplied mapping, nothing else — takes a solid outline,
 *             as does the file card.
 *  0.42–0.73  the route to that venue draws on; the clerk walks the avenue and
 *             the spur, through the venue's door (it swings open) to the desk and
 *             sets the file in the in-tray; hands return to the sides. When no
 *             row matches, the clerk instead sets the file in the dashed waiting
 *             slot on the plaza (venue pending) — no consequence is shown.
 *  0.73–1.00  hold: the supplied final state, notes (dashed rings keyed to the
 *             panel) and the key "as supplied · no conclusion drawn". Nothing
 *             says a venue is correct or competent, or that the filing is valid.
 * @module animations/courts/LAW-0209
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, list, obj, oneOf} from '../../schemas/fields.js';
import {routeTrail} from './kits/courts-art.js';
import {
  organoFields, ORG_EN, ORG_STRINGS, resolveOrgano, siteGeometry, stretchedSite, SPECS, mapper, mapperAt, siteArt, doorOpenness, fileProp, makeLeg, walkAt,
  carryPoint, clerkNodes, planPerson, clerkLook, textAt, fitG, tagChip, placeVenueBlocks, venueBlockNodes, placeNear, planWithBlocks, blockProblems, blockWraps, legendGlyph, overlaps, unionBox, pxPerUnit, R2, PRAD,
} from './kits/asignacion-de-organo.js';

const ID = 'LAW-0209';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  trail1: [0.15, 0.2], walk1: [0.16, 0.36], read: [0.36, 0.385], scan: [0.385, 0.45], readOut: [0.47, 0.49],
  trail2: [0.45, 0.51], walk2: [0.49, 0.67], place: [0.67, 0.71], walkWait: [0.49, 0.6], placeWait: [0.6, 0.64], notes: [0.75, 0.81],
};
const TARGETS = ['origin', 'junction', 'destination', 'waitingSlot'];

const STRINGS = {
  en: {...ORG_STRINGS.en},
  es: {...ORG_STRINGS.es},
};

const sceneSchema = {
  ...organoFields,
  actorLabels: obj('Caption of the clerk glyph in the legend', {
    clerk: str('Caption for the person carrying the file', 60),
  }),
  objectLabels: obj('Captions of the plan glyphs in the legend', {
    route: str('Caption for the dotted route', 60),
    tag: str('Caption for a venue tag (a mapping row)', 60),
  }),
  actionProgress: num('How far the sending is allowed to progress (1 = the file reaches its place; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial notes shown in the final hold; each is keyed to a dashed ring drawn on its target in the plan', obj('Note', {
    target: oneOf('What the note refers to (destination = the venue given by the mapping, or the waiting slot when none matches)', TARGETS),
    text: str('Note text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('The state supplied for the final hold: set-down = the file is set down where the supplied mapping leads (or in the waiting slot); held-at-junction = the clerk keeps it at the sorting point', ['set-down', 'held-at-junction']),
};

const defaultParams = {
  ...ORG_EN,
  actorLabels: {clerk: 'Clerk carrying the file (fictional)'},
  objectLabels: {route: 'Route the file travels', tag: 'Venue tag: one supplied mapping row'},
  actionProgress: 1,
  annotations: [{target: 'junction', text: 'The datum is compared with each venue tag here'}],
  finalState: 'set-down',
};

const SIZES = [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.6];

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const px = pxPerUnit(ctx);
    const shape = ctx.view.shape;
    const arrs = [];
    if (shape === 'landscape') {
      for (const spec of ['full', 'medium']) for (const pf of [0.24, 0.27, 0.3, 0.34]) for (const Tw of [300, 360, 420, 480]) arrs.push({spec, rot: false, panel: 'column', pf, T: Tw});
    } else if (shape === 'square') {
      for (const spec of ['compact', 'tight']) for (const pf of [0.3, 0.34, 0.38]) arrs.push({spec, rot: true, panel: 'column', pf, T: 0});
      for (const spec of ['medium', 'compact', 'tight']) for (const Tw of [250, 300, 350, 400]) arrs.push({spec, rot: false, panel: 'band', pf: 0.4, T: Tw, cols: 3});
    } else {
      for (const spec of ['full', 'medium', 'compact']) for (const pf of [0.2, 0.24, 0.28, 0.32]) arrs.push({spec, rot: true, panel: 'band', pf, T: 0});
    }
    const log = [];
    let best = null;
    for (const v of SIZES) {
      let pick = null;
      for (const A of arrs) {
        const L = compose(ctx, p, v / px, px, A);
        log.push(`${v}/${A.spec}/${A.pf}/${A.T}:k${L.k.toFixed(2)}:${L.problems.join('+')}`);
        if (!best || L.problems.length < best.problems.length || (L.problems.length === best.problems.length && L.k > best.k)) best = L;
        if (!L.problems.length && (!pick || L.score > pick.score + 0.002)) pick = L;
      }
      if (pick) { best = pick; break; }
    }
    best.log = log.slice(-40);
    return best;
  },
  build(ctx, L) {
    return g(null,
      g({name: 'plan', transform: L.M.transform},
        L.art.node,
        L.trail1.node,
        L.trail2 && L.trail2.node,
        L.clerk.node,
        fileProp(ctx, {name: 'file'})),
      g({name: 'notes', opacity: 0}, L.rings),
      L.leaders,
      L.blockNodes,
      L.originNode,
      L.junctionNode,
      L.readNode,
      L.panelNode,
      L.stateNode && g({name: 'state-tag', opacity: 0}, L.stateNode),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const G = L.G;
    const nodes = {};
    const capU = lerp(W.walk1[0], W.place[1], clamp(p.actionProgress));
    const ua = p.actionProgress >= 1 ? u : Math.min(u, capU);
    const goes = p.finalState !== 'held-at-junction';
    const pending = L.selected < 0;
    const W2 = pending ? W.walkWait : W.walk2, WP = pending ? W.placeWait : W.place;
    // the clerk: walk 1 (office → sorting point), then walk 2 (→ venue desk or → waiting slot)
    const q1 = seg(ua, ...W.walk1), q2 = goes ? seg(ua, ...W2) : 0;
    let st, phase;
    if (q2 <= 0) {
      st = walkAt(L.leg1, q1, ctx.reduced);
      phase = q1 <= 0 ? 'intake' : q1 < 1 ? 'walking' : ua < W.scan[1] ? 'reading' : 'junction';
    } else {
      st = walkAt(L.leg2, q2, ctx.reduced);
      phase = q2 < 1 ? 'to-destination' : 'arrived';
    }
    const place = goes ? ease.inOutCubic(seg(ua, ...WP)) : 0;
    const carry = 1 - place;
    Object.assign(nodes, clerkNodes(L.clerk, 'clerk', st, carry));
    // the file: in both hands until it is set down on the tray (or in the slot), then it stays there
    const fp = carryPoint(st);
    nodes.file = {transform: T(fp.x, fp.y, st.deg)};
    if (place >= 1) phase = 'set-down';
    // routes: the road route draws just before the walk; the second route after the match
    const d1 = seg(ua, W.trail1[0], W.trail1[1]);
    Object.assign(nodes, L.trail1.frame(d1, d1 > 0 ? 1 - 0.4 * seg(ua, W.walk1[1], W.walk1[1] + 0.05) : 0));
    const d2 = goes ? seg(ua, ...W.trail2) : 0;
    if (L.trail2) Object.assign(nodes, L.trail2.frame(d2, d2 > 0 ? 1 : 0));
    // doors swing open as the clerk passes
    const moving = st.moving;
    Object.assign(nodes, L.art.doors.origin.frame(doorOpenness(G.intakeDoor, st, moving && q2 <= 0)));
    G.venues.forEach((v, i) => Object.assign(nodes, L.art.doors[`v${i}`].frame(i === L.selected ? doorOpenness(v.door, st, moving && q2 > 0) : 0)));
    // reading at the sorting point: the datum callout, the scan over the venue tags, the match
    const readIn = seg(ua, ...W.read) * (1 - seg(ua, ...W.readOut));
    if (L.readNode) nodes.read = {opacity: r(readIn, 3)};
    const nRows = L.rows.length;
    const sp = seg(ua, ...W.scan);
    let scanIdx = -1;
    L.rows.forEach((rw, j) => {
      const a = j / nRows, b = (j + 1) / nRows;
      const on = sp > a && sp < b && sp < 1 ? 1 : 0;
      if (on) scanIdx = j;
      if (L.tagNames[rw.index]) {
        nodes[`${L.tagNames[rw.index]}-scan`] = {opacity: on};
        nodes[`${L.tagNames[rw.index]}-hi`] = {opacity: r(rw.index === L.matchRow ? seg(ua, W.scan[1] - 0.004, W.scan[1] + 0.01) : 0, 3)};
      }
    });
    const matched = L.matchRow >= 0 ? seg(ua, W.scan[1] - 0.004, W.scan[1] + 0.01) : 0;
    if (L.hasCard) nodes['file-card-hi'] = {opacity: r(matched, 3)};
    // hold: notes and the state
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.notes) : 0;
    nodes.notes = {opacity: r(noteP, 3)};
    for (let i = 0; i < L.noteCount; i++) nodes[`note${i}`] = {opacity: r(noteP, 3)};
    if (L.stateNode) nodes['state-tag'] = {opacity: r(done ? seg(u, W.notes[0] + 0.01, W.notes[1] + 0.01) : 0, 3)};
    const toD = L.M.toD;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const inside = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
    return {
      nodes,
      semantic: {
        beat,
        phase,
        clerk: R2(toD(st)),
        file: R2(toD(fp)),
        hands: R2(toD(carryPoint(st))),
        target: R2(toD(L.target)),
        carry: r(carry, 3),
        selected: L.selected,
        matchRow: L.matchRow,
        scanRow: scanIdx >= 0 ? L.rows[scanIdx].index : -1,
        matched: r(matched, 3),
        route1: r(d1, 3),
        route2: r(d2, 3),
        readShown: r(readIn, 3),
        inIntake: inside(st, G.intake),
        inVenue: G.venues.map(v => inside(st, v.box)),
        atVenueDoor: G.venues.map(v => Math.hypot(st.x - v.door.x, st.y - v.door.y) < 80),
        fileInTray: place >= 1 && !pending && Math.hypot(fp.x - G.venues[Math.max(0, L.selected)].tray.x, fp.y - G.venues[Math.max(0, L.selected)].tray.y) < 1,
        fileInSlot: place >= 1 && pending && Math.hypot(fp.x - G.slot.x, fp.y - G.slot.y) < 1,
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > capU,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(L.personPx, 1),
        k: r(L.k, 3),
        arrangement: L.arrangement,
        problems: L.problems,
        log: L.log,
      },
    };
  },
};

/** One composition at text size F for arrangement A. */
function compose(ctx, p, F, px, A) {
  const th = ctx.theme;
  const D = ctx.design;
  const showAll = ctx.show('all');
  const showKey = ctx.show('key');
  const problems = [];
  const res = resolveOrgano(p);
  const n = res.venues.length;
  let G = siteGeometry(n, SPECS[A.spec]);
  const goes = p.finalState !== 'held-at-junction';
  const pending = res.selected < 0;
  // ---- panel (file card, legend, notes, state, key)
  const items = panelItems(ctx, p, F, showAll, showKey, res);
  let mapRegion = {x: 0, y: 0, w: D.w, h: D.h};
  let panelBox = null;
  if (items.length) {
    if (A.panel === 'column') {
      const pw = D.w * A.pf;
      panelBox = {x: D.w - pw, y: 0, w: pw, h: D.h};
      mapRegion = {x: 0, y: 0, w: D.w - pw - 30, h: D.h};
    } else {
      const ph = D.h * A.pf;
      panelBox = {x: 0, y: D.h - ph, w: D.w, h: ph};
      mapRegion = {x: 0, y: 0, w: D.w, h: D.h - ph - 24};
    }
  }
  const panel = items.length ? layoutPanel(items, panelBox, F, A.panel, A.cols) : null;
  if (panel && panel.problem) problems.push(panel.problem);
  if (panel && A.panel === 'band') {
    // the band hugs its content; the map takes the rest
    const used = panel.height;
    panelBox.y = D.h - used;
    panelBox.h = used;
    mapRegion.h = D.h - used - 24;
    panel.place(panelBox);
  } else if (panel) panel.place(panelBox);
  // ---- the plan and the venue blocks (names + mapping tags)
  const venuesShown = showKey ? res.venues : [];
  const fitted = planWithBlocks(ctx, {n, S: SPECS[A.spec], region: mapRegion, venues: venuesShown, F, px, rot: A.rot, T: A.T});
  G = fitted.G;
  const M = fitted.M, placed = fitted.placed, vOuter = fitted.vOuter;
  const blocks = placed.blocks;
  const k = M.k;
  const toD = M.toD;
  const personPx = 100 * k * px;
  if (personPx < 60.5) problems.push('small');
  problems.push(...blockProblems(placed, mapRegion));
  // ---- legs, trails, clerk
  const sel = res.selected;
  const leg1 = makeLeg(G.leg1, 90, 90);
  const leg2 = !goes ? null : pending ? makeLeg(G.legWait, 90, 180) : makeLeg(G.leg2[sel], 90, 90);
  const target = !goes ? carryPoint({x: G.J.x, y: G.J.y, deg: 90}) : pending ? {x: G.slot.x, y: G.slot.y} : {x: G.venues[sel].tray.x, y: G.venues[sel].tray.y};
  const art = siteArt(ctx, G, {prefix: 's'});
  const trail1 = routeTrail(ctx, {name: 'trail1', pts: G.leg1, width: 6});
  const trail2 = leg2 ? routeTrail(ctx, {name: 'trail2', pts: leg2.pts, width: 7, color: pending ? th.inkSoft : undefined}) : null;
  const clerk = planPerson(ctx, {name: 'clerk', look: clerkLook(ctx, p)});
  const rad = PRAD * k;
  // design-space obstacles
  const pathD = pts => pts.map(toD);
  const P1 = pathD(G.leg1), P2 = leg2 ? pathD(leg2.pts) : [];
  const buildings = [M.box({x: G.intake.x - G.t, y: G.intake.y - G.t, w: G.intake.w + 2 * G.t, h: G.intake.h + 2 * G.t}), ...vOuter()];
  const plazaD = M.box(G.plaza);
  const blockBoxes = blocks.map(b => b.box);
  const personAt = q => { const d = toD(q); return {x: d.x - rad, y: d.y - rad, w: 2 * rad, h: 2 * rad}; };
  const peopleBoxes = [personAt(G.start), personAt(G.J), leg2 ? personAt(leg2.pts[leg2.pts.length - 1]) : null].filter(Boolean);
  const slotD = M.box({x: G.slot.x - G.slot.w / 2, y: G.slot.y - G.slot.h / 2, w: G.slot.w, h: G.slot.h});
  const lecternD = M.box({x: G.lectern.x - 32, y: G.lectern.y - 32, w: 64, h: 64});
  const texts = [...blockBoxes];
  // ---- origin name (beside the intake office)
  let originNode = null, originBox = null;
  const leaders = [];
  const lead = (box, part, col) => {
    const cx = Math.max(part.x, Math.min(box.x + box.w / 2, part.x + part.w)), cy = Math.max(part.y, Math.min(box.y + box.h / 2, part.y + part.h));
    const ex = Math.max(box.x, Math.min(cx, box.x + box.w)), ey = Math.max(box.y, Math.min(cy, box.y + box.h));
    return g(null, h('line', {x1: r(ex), y1: r(ey), x2: r(cx), y2: r(cy), stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round'}), h('circle', {cx: r(cx), cy: r(cy), r: 4.5, fill: col}));
  };
  if (showKey) {
    const chip = tagChip(ctx, p.courts.origin, {F, maxWidth: Math.min(380 / px, mapRegion.w * 0.5), maxLines: 3, weight: 700, glyph: false, stroke: th.ink});
    if (chip.fit.truncated) problems.push('origin-trunc');
    const part = buildings[0];
    originBox = placeNear(part, chip.w, chip.h, {order: A.rot ? ['left', 'right', 'below'] : ['above', 'below', 'left'], bounds: mapRegion, hard: [...buildings.slice(1), plazaD, ...texts, ...peopleBoxes, slotD, lecternD], paths: [P1, P2], pathPad: rad * 0.9, maxGap: 90});
    if (!originBox) { problems.push('origin'); originBox = {x: part.x, y: part.y - chip.h - 8, w: chip.w, h: chip.h}; }
    originNode = g({name: 'origin-name'}, chip.node(originBox.x, originBox.y));
    leaders.push(lead(originBox, part, th.ink));
    texts.push(originBox);
  }
  // ---- the sorting point caption (beside the plaza)
  let junctionNode = null;
  if (showAll) {
    const chip = tagChip(ctx, p.labels.junction, {F, maxWidth: Math.min(340 / px, mapRegion.w * 0.45), maxLines: 3, weight: 600, glyph: false, stroke: th.inkSoft});
    if (chip.fit.truncated) problems.push('junction-trunc');
    const box = placeNear(plazaD, chip.w, chip.h, {order: A.rot ? ['left', 'right'] : ['above', 'below'], bounds: mapRegion, hard: [...buildings, ...texts, ...peopleBoxes], paths: [P1, P2], pathPad: rad * 0.9, maxGap: 120});
    if (!box) problems.push('junction');
    const b = box || {x: plazaD.x, y: plazaD.y - chip.h - 8, w: chip.w, h: chip.h};
    junctionNode = g({name: 'junction-cap'}, chip.node(b.x, b.y));
    leaders.push(lead(b, lecternD, th.inkSoft));
    texts.push(b);
  }
  // ---- the reading callout at the sorting point (transient: the file's datum)
  let readNode = null;
  if (showKey) {
    const chip = tagChip(ctx, `${p.labels.datum}: ${p.file.datum}`, {F, maxWidth: Math.min(420 / px, mapRegion.w * 0.5), maxLines: 4, weight: 600, stroke: th.accent3});
    const part = personAt(G.J);
    const box = placeNear(part, chip.w, chip.h, {order: A.rot ? ['left', 'right', 'below'] : ['below', 'above', 'left'], bounds: mapRegion, hard: [...buildings, ...texts, slotD, lecternD], paths: [P2], pathPad: rad * 1.05, maxGap: 150});
    if (box && !chip.fit.truncated) {
      const fpt = toD(carryPoint({x: G.J.x, y: G.J.y, deg: 90}));
      readNode = g({name: 'read', opacity: 0}, lead(box, {x: fpt.x - 2, y: fpt.y - 2, w: 4, h: 4}, th.accent3), chip.node(box.x, box.y, 'read-card'));
      texts.push(box);
    }
  }
  // ---- venue blocks with their leaders
  const blockNodes = venueBlockNodes(ctx, placed);
  const tagNames = {};
  for (const b of blocks) for (const tg of b.v.tags) tagNames[tg.index] = `vb${b.i}-tag${tg.index}`;
  // ---- annotation rings on their targets (keyed to the notes in the panel)
  const notes = showAll ? p.annotations : [];
  const noteColors = [th.accent3, th.accent4];
  const rings = notes.map((nt, i) => {
    const col = noteColors[i % 2];
    let b;
    if (nt.target === 'origin') b = buildings[0];
    else if (nt.target === 'junction') b = personAt(G.J);
    else if (nt.target === 'waitingSlot' || (nt.target === 'destination' && (pending || !goes))) b = nt.target === 'destination' && !goes ? personAt(G.J) : slotD;
    else b = vOuter()[sel];
    return h('rect', {x: r(b.x - 10), y: r(b.y - 10), width: r(b.w + 20), height: r(b.h + 20), rx: 16, fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-dasharray': '14 9'});
  });
  // ---- audit: no two texts overlap; everything inside the frame
  const all = [...texts, ...(panel ? panel.boxes : [])];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (overlaps(all[i], all[j], 2)) { problems.push('overlap'); i = all.length; break; }
  if (all.some(b => b.x < -0.5 || b.y < -0.5 || b.x + b.w > D.w + 0.5 || b.y + b.h > D.h + 0.5)) problems.push('frame');
  // texts never on a building, the plaza or a walked path
  if (texts.some(b => buildings.some(q => overlaps(b, q, 2)))) problems.push('on-building');
  return {
    F, px, k, M, G, art, trail1, trail2, clerk, leg1, leg2: leg2 || leg1, target, selected: sel, matchRow: res.matchRow, rows: res.rows, tagNames,
    blockNodes, originNode, junctionNode, readNode, leaders, rings, noteCount: notes.length,
    panelNode: panel ? panel.node : null, stateNode: panel ? panel.stateNode : null, hasCard: Boolean(panel && panel.hasCard),
    personPx, problems, arrangement: `${A.spec}/${A.panel}/${A.pf}/${A.T}`,
    // larger people first; wrapped block lines cost a little (a wider tag column reads better)
    score: k - 0.03 * blockWraps(placed),
  };
}

/** The panel's items (each measured for a width). */
function panelItems(ctx, p, F, showAll, showKey, res) {
  const th = ctx.theme;
  const items = [];
  const look = {skin: '#c68863', hair: 'short', hairColor: '#4a3122', outfit: th.cloth[3], glasses: false};
  if (showKey) {
    items.push({type: 'card', make: w => {
      const gs = F * 2.4;
      const tw = w - gs - F * 1.6;
      const f1 = fitG(p.file.label, {maxWidth: tw, size: F, minSize: F, maxLines: 3, weight: 700});
      const f2 = fitG(`${p.labels.datum}: ${p.file.datum}`, {maxWidth: tw, size: F, minSize: F, maxLines: 4, weight: 500});
      const hh = Math.max(gs, f1.height + F * 0.35 + f2.height) + F * 0.9;
      return {h: hh, truncated: f1.truncated || f2.truncated, card: true, node: (x, y) => g({name: 'file-card'},
        h('path', {d: roundRectPath(x, y, w, hh, 12), fill: th.card, stroke: th.accent3, 'stroke-width': 2.6}),
        g({transform: T(x + F * 0.5 + gs / 2, y + hh / 2)}, legendGlyph(ctx, 'file', gs)),
        textAt(f1, x + gs + F * 1.1, y + F * 0.4, th.ink),
        textAt(f2, x + gs + F * 1.1, y + F * 0.4 + f1.height + F * 0.35, th.ink),
        h('path', {name: 'file-card-hi', d: roundRectPath(x - 5, y - 5, w + 10, hh + 10, 15), fill: 'none', stroke: th.accent2, 'stroke-width': 4.5, opacity: 0}))};
    }});
  }
  if (showAll) {
    for (const [kind, text] of [['clerk', p.actorLabels.clerk], ['route', p.objectLabels.route], ['tag', p.objectLabels.tag], ['tray', p.seats.arrival], ['slot', p.seats.waiting]]) {
      items.push({type: 'legend', make: w => {
        const gs = F * 2.1;
        const f = fitG(text, {maxWidth: w - gs - 14, size: F, minSize: F, maxLines: 3, weight: 500});
        const hh = Math.max(gs, f.height + F * 0.25);
        return {h: hh, truncated: f.truncated, node: (x, y) => g({name: `legend-${kind}`},
          g({transform: T(x + gs / 2, y + hh / 2)}, legendGlyph(ctx, kind, gs, look)),
          textAt(f, x + gs + 14, y + (hh - f.height) / 2, th.fg))};
      }});
    }
    p.annotations.forEach((nt, i) => {
      const col = [th.accent3, th.accent4][i % 2];
      items.push({type: 'note', make: w => {
        const f = fitG(nt.text, {maxWidth: w - F * 1.9 - 12, size: F, minSize: F, maxLines: 4, weight: 500});
        return {h: f.height + F * 0.25, truncated: f.truncated, node: (x, y) => g({name: `note${i}`, opacity: 0},
          h('rect', {x: r(x + 2), y: r(y + F * 0.05), width: r(F * 1.3), height: r(F * 1.0), rx: 5, fill: 'none', stroke: col, 'stroke-width': 4, 'stroke-dasharray': '7 5'}),
          textAt(f, x + F * 1.9 + 12, y, th.fg))};
      }});
    });
  }
  if (showKey) {
    const goes = p.finalState !== 'held-at-junction';
    const text = !goes ? ctx.t.held : res.selected < 0 ? ctx.t.pending : ctx.t.selected;
    items.push({type: 'state', make: w => {
      const f = fitG(text, {maxWidth: w - F * 1.2, size: F, minSize: F, maxLines: 4, weight: 700});
      const hh = f.height + F * 0.76;
      return {h: hh, truncated: f.truncated, state: true, node: (x, y) => g(null,
        h('path', {d: roundRectPath(x, y, f.width + F * 1.2, hh, Math.min(hh / 2, F * 0.7)), fill: th.card, stroke: th.accent4, 'stroke-width': 2.4}),
        textAt(f, x + F * 0.6, y + F * 0.38, th.ink))};
    }});
    items.push({type: 'key', make: w => {
      const f = fitG(p.labels.key, {maxWidth: w - 8, size: F, minSize: F, maxLines: 4, weight: 500});
      return {h: f.height + F * 0.75, truncated: f.truncated, node: (x, y) => g({name: 'key'},
        h('path', {d: `M${r(x)} ${r(y)}H${r(x + Math.min(w, f.width + 12))}`, stroke: th.fgSoft, 'stroke-width': 1.5}),
        textAt(f, x, y + F * 0.45, th.fgSoft, {italic: true}))};
    }});
  }
  return items;
}

/** Column (stacked) or band (two balanced columns) panel. */
function layoutPanel(items, box, F, flow, nCols) {
  const gap = F * 0.75;
  const cols = flow === 'column' ? 1 : (nCols || 2);
  const colGap = F * 1.6;
  const cw = (box.w - colGap * (cols - 1)) / cols;
  void 0;
  const made = items.map(it => ({it, m: it.make(cw)}));
  const problem = made.some(q => q.m.truncated) ? 'panel-trunc' : null;
  const hOf = arr => arr.reduce((a, q) => a + q.m.h, 0) + gap * Math.max(0, arr.length - 1);
  // split into `cols` runs (reading order kept) with the smallest tallest run
  let columns = [made];
  if (cols === 2) {
    let bestS = null;
    for (let s = 1; s < made.length; s++) {
      const v = Math.max(hOf(made.slice(0, s)), hOf(made.slice(s)));
      if (!bestS || v < bestS.v) bestS = {s, v};
    }
    if (bestS) columns = [made.slice(0, bestS.s), made.slice(bestS.s)];
  } else if (cols === 3) {
    let bestS = null;
    for (let a = 1; a < made.length - 1; a++) {
      for (let b = a + 1; b < made.length; b++) {
        const v = Math.max(hOf(made.slice(0, a)), hOf(made.slice(a, b)), hOf(made.slice(b)));
        if (!bestS || v < bestS.v) bestS = {a, b, v};
      }
    }
    if (bestS) columns = [made.slice(0, bestS.a), made.slice(bestS.a, bestS.b), made.slice(bestS.b)];
  }
  const height = Math.max(...columns.map(hOf));
  const out = {problem: problem || (height > box.h + 0.5 ? 'panel-height' : null), height, boxes: [], node: null, stateNode: null, hasCard: made.some(q => q.m.card)};
  out.place = B => {
    const nodes = [];
    out.boxes = [];
    columns.forEach((col, ci) => {
      const x = B.x + ci * (cw + colGap);
      let y = B.y + Math.max(0, (B.h - hOf(col)) / 2);
      for (const q of col) {
        const nd = q.m.node(x, y);
        out.boxes.push({x, y, w: cw, h: q.m.h});
        if (q.m.state) out.stateNode = nd; else nodes.push(nd);
        y += q.m.h + gap;
      }
    });
    out.node = g({name: 'panel'}, nodes);
  };
  return out;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-03-story',
    title: 'Venue assignment — a clerk carries a case file to the venue named by the supplied mapping',
    titleEs: 'Asignación de órgano — Microescena con objetos y actores',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Asignación de órgano',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A site plan with an intake office, a sorting point and two or three generic fictional venues. A clerk carries a case file along a drawn route to the sorting point, where the datum on its tag is compared with each venue tag; the file then travels the route to the venue whose supplied mapping row matches and is set in its in-tray — or, when no row matches, it waits in a dashed slot. The route follows only the supplied mapping; no venue is called correct or competent and no outcome is shown.',
    tags: ['site plan', 'venue', 'case file', 'routing', 'mapping', 'sorting point', 'clerk', 'top-down people', 'doors', 'building'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/asignacion-de-organo.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
