/**
 * LAW-0219 — Acceso a sala · contrast
 *
 * Storyboard (two COMPLETE plans of the same generic room, side by side on
 * wide frames and one above the other on tall frames, drawn at the same size;
 * each room has the same two separate supplied routes from the same entrance
 * hall — the ● public corridor and door and the ◆ restricted corridor and door
 * as configured — the same seats, the same people and the same entrance order).
 * The ONE changed fact is the supplied route of one participant (the focus
 * participant, who waits in the entrance hall in both scenes): scenario A
 * gives them its route (default "Public access"), scenario B its route
 * (default "Restricted access as configured").
 *  0.00–0.17  base: two identical scenes — everyone waits (the others in the
 *             corridor of their own route, the focus participant in the hall),
 *             no scenario header yet.
 *  0.17–0.40  the change, localised and explicit: in each scene the focus
 *             participant turns towards the corridor of that scenario's route,
 *             its solid route line draws from the hall through that route's
 *             door to the same supplied seat, and a route badge (● or ◆, no
 *             text) appears at the hall; then both scenario headers appear
 *             together (same size, same timing).
 *  0.40–0.77  in parallel, with the SAME walk windows in A and B, everyone
 *             enters by their route through their door and sits; every seat
 *             label arrives as its occupant lands (body first, then text). Only
 *             the focus participant's path differs (geometry and sequence of
 *             doors), not only a colour or a text.
 *  0.77–1.00  the guide: the focus route is outlined in both scenes (the same
 *             highlight), a guide card between the scenes joins them with two
 *             solid leaders, and the neutral note says both are as supplied —
 *             no winner, score, outcome or rule; nothing about who may attend.
 * @module animations/courts/LAW-0219
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, int, list, obj, oneOf} from '../../schemas/fields.js';
import {buildingElevation} from './kits/courts-art.js';
import {walkerAt, placeSeatLabels, remainingPath, bodyBox, seatLabelNode, pxPerUnit, R2} from './kits/distribucion-de-sala.js';
import {
  accessFields, ACCESS_EN, ACCESS_STRINGS, ACCESS, COMPACT, resolveAccess, accessGeometry, fitAccess, planAccessWalkers, walkWindows, doorOpen, accessArt,
  accessTrail, accessPerson, accessObstacles, furnitureBoxes, accessColor, routeGlyph, measureStack, drawStack, fitG, textAt, simplify, passesNear, balanceColumns, deconflict, PERSON_RAD,
} from './kits/acceso-a-sala.js';

const ID = 'LAW-0219';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
const W = {turn: [0.19, 0.24], preview: [0.22, 0.33], tag: [0.3, 0.34], header: [0.34, 0.39], walk: [0.41, 0.755], guide: [0.78, 0.83], note: [0.82, 0.86]};
const SC = ['A', 'B'];

const STRINGS = {en: {...ACCESS_STRINGS.en}, es: {...ACCESS_STRINGS.es}};

const scenario = name => obj(`Scenario ${name}`, {
  label: str(`Short label for scenario ${name}`, 50),
  caption: str('One-line description of the scenario (as supplied)', 90),
  access: oneOf('The supplied access route of the focus participant in this scenario', ACCESS),
}, ['label', 'access']);

const sceneSchema = {
  ...accessFields,
  scenarioA: scenario('A'),
  scenarioB: scenario('B'),
  focusRoute: int('Index in `routes` of the participant whose supplied route differs between A and B (they wait in the entrance hall in both scenes)', 0, 5),
  changedFact: str('The single fact that differs between A and B', 120),
  sharedFacts: list('Facts that stay identical in both scenes', str('Shared fact', 70), 0, 3),
  comparisonLabels: obj('Labels of the comparison guide', {
    guide: str('Label of the guide joining the changed detail in both scenes', 60),
    neutral: str('Neutral note (no winner, no outcome, no conclusion)', 110),
  }),
};

const defaultParams = {
  ...ACCESS_EN,
  scenarioA: {label: 'A · Public access', caption: 'Participant D takes the public route', access: 'public'},
  scenarioB: {label: 'B · Restricted access as configured', caption: 'Participant D takes the restricted route as configured', access: 'restricted'},
  focusRoute: 3,
  changedFact: 'Changed fact: the supplied route of Participant D',
  sharedFacts: ['Same room, doors, seats and people', 'Same entrance order and timing'],
  comparisonLabels: {guide: 'Only this route differs', neutral: 'Both scenes as supplied · no winner, no outcome'},
};

const scene = {
  sizes: {landscape: [1690, 738], square: [950, 738], portrait: [950, 1358]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const {routes} = resolveAccess(ctx, p);
    let fi = routes.findIndex(q => q.index === p.focusRoute);
    if (fi < 0) fi = routes.length - 1;
    const acc = {A: p.scenarioA.access, B: p.scenarioB.access};
    const shape = ctx.view.shape;
    const GAP = 24 / px;
    const Fmin = 16.6 / px;
    const log = [];
    // shared texts are drawn ONCE (strip or centre column), never per scene
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const guideItems = showKey ? [{type: 'chip', text: p.comparisonLabels.guide, stroke: th.accent3, weight: 700, name: 'guide-card'}] : [];
    const factItems = [
      ...(showKey ? [{type: 'text', text: p.changedFact, weight: 600, name: 'changed-fact'}] : []),
      ...(showAll ? p.sharedFacts.map((f, i) => ({type: 'text', text: `· ${f}`, name: `shared${i}`})) : []),
    ];
    const legendItems = showKey ? [{type: 'legend', kind: 'public', text: p.labels.publicAccess, weight: 600, name: 'legend-public', group: 'legend'}, {type: 'legend', kind: 'restricted', text: p.labels.restrictedAccess, weight: 600, name: 'legend-restricted', group: 'legend'}] : [];
    const keyItems = showKey ? [{type: 'key', text: p.labels.key, name: 'key', group: 'key'}, {type: 'text', text: p.comparisonLabels.neutral, italic: true, name: 'neutral', group: 'key'}] : [];
    const hidden = it => it.name === 'guide-card' || it.name === 'neutral';

    /** Scenario headers at scene width sw (the same height for A and B). */
    const headers = (F, sw) => {
      const R0 = F * 0.95;
      const hd = SC.map(k2 => {
        const s0 = k2 === 'A' ? p.scenarioA : p.scenarioB;
        if (!showKey) return {h: R0 * 2 + 4, R0};
        const tw = sw - R0 * 2 - 14;
        const lf = fitG(s0.label, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 700});
        const cf = showAll && s0.caption ? fitG(s0.caption, {maxWidth: tw, size: F, minSize: F, maxLines: 2, weight: 500}) : null;
        if (lf.truncated || (cf && cf.truncated)) return null;
        return {lf, cf, R0, h: Math.max(R0 * 2, lf.height + (cf ? F * 0.3 + cf.height : 0)) + 4 + F * 0.28};
      });
      if (hd.some(q => !q)) return null;
      const hh = Math.max(hd[0].h, hd[1].h);
      return {hd, hh};
    };

    const compose = (F, kind, cf = 0) => {
      const parts = []; // [{m, x, y}]
      let bld = null;
      let sw, boxes;
      const HG = 10 / px;
      if (kind === 'center') {
        // A | shared column | B — each scene takes the full height
        const cw = Math.max(230 / px, D.w * cf);
        sw = (D.w - cw - 2 * GAP) / 2;
        const m = measureStack(ctx, [...nameItems, ...factItems, ...legendItems, ...keyItems, ...guideItems], cw, F);
        if (m.truncated) return null;
        const bh = Math.min(cw * 0.62, 118 / px, D.h - m.height - m.gap);
        if (bh < 80 / px) return null;
        const cx = sw + GAP;
        bld = {x: cx + (cw - Math.min(cw, bh * 1.25)) / 2, y: 0, w: Math.min(cw, bh * 1.25), h: bh};
        // the stack is bottom-aligned: the guide card (last) sits level with the corridors along the plans' bottom
        parts.push({m, x: cx, y: D.h - m.height});
        const hdr = headers(F, sw);
        if (!hdr) return null;
        boxes = [0, sw + cw + 2 * GAP].map(x0 => ({x: x0, y: 0, w: sw, hh: hdr.hh, plan: {x: x0, y: hdr.hh + HG, w: sw, h: D.h - hdr.hh - HG}}));
        return finish(F, kind, sw, boxes, parts, bld, hdr);
      }
      // strip (under the scenes in 'row'; between them in 'stack'): the building beside its two name chips, then the
      // remaining texts balanced over two or three columns (reading order kept; the guide card first, at a column top,
      // so its leaders leave it without crossing text)
      const restItems = kind === 'stack' ? [...factItems, ...legendItems, ...keyItems] : [...guideItems, ...factItems, ...legendItems, ...keyItems];
      let best0 = null;
      let colsBase = null;
      for (const nf of [0.26, 0.32, 0.38]) {
        const base = [];
        if (kind === 'stack') base.push({items: guideItems, f: 0.18, mid: true});
        base.push({bld: true, f: nf, items: nameItems});
        const fixedF = base.reduce((a, c) => a + c.f, 0);
        for (const n of [2, 3]) {
          const usable0 = D.w - GAP * (base.length + n - 1);
          // the fixed columns must hold their items whole (no word broken)
          if (base.some(c => measureStack(ctx, c.items, c.bld ? usable0 * c.f - Math.min(usable0 * c.f * 0.38, 120 / px) - 12 / px : usable0 * c.f, F).truncated)) continue;
          const nm = measureStack(ctx, nameItems, usable0 * nf - Math.min(usable0 * nf * 0.38, 120 / px) - 12 / px, F);
          const w = (usable0 * (1 - fixedF)) / n;
          const b = restItems.length ? balanceColumns(ctx, restItems, n, w, F) : {h: 0, cols: []};
          if (b && (!best0 || Math.max(b.h, nm.height) < best0.hAll)) { best0 = {...b, n, w, usable0, hAll: Math.max(b.h, nm.height)}; colsBase = base; }
        }
      }
      if (!best0) return null;
      let x = 0;
      let stripH = 0;
      const cols = [];
      for (const c of colsBase) {
        const w = best0.usable0 * c.f;
        const out = {...c, x, w};
        x += w + GAP;
        if (c.bld) {
          out.aw = Math.min(w * 0.38, 120 / px);
          out.m = measureStack(ctx, c.items, w - out.aw - 12 / px, F);
          out.bh = Math.max(out.aw * 0.95, 70 / px);
          out.h = Math.max(out.m.height, out.bh);
        } else {
          out.m = measureStack(ctx, c.items, w, F);
          out.h = out.m.height;
        }
        stripH = Math.max(stripH, out.h);
        cols.push(out);
      }
      for (const m of best0.cols) {
        cols.push({x, w: best0.w, m, h: m.height});
        x += best0.w + GAP;
        stripH = Math.max(stripH, m.height);
      }
      if (cols.some(c => c.m.truncated)) return null;
      sw = kind === 'row' ? (D.w - GAP) / 2 : D.w;
      const hdr = headers(F, sw);
      if (!hdr) return null;
      let stripY;
      if (kind === 'row') {
        const ph = D.h - stripH - GAP - hdr.hh - HG;
        boxes = [0, sw + GAP].map(x0 => ({x: x0, y: 0, w: sw, hh: hdr.hh, plan: {x: x0, y: hdr.hh + HG, w: sw, h: ph}}));
        stripY = D.h - stripH;
      } else {
        // A's header above A, B's header below B: the strip sits directly between the two plans, so the guide
        // leaders reach both scenes without crossing a header
        const ph = (D.h - stripH - 2 * GAP - 2 * (hdr.hh + HG)) / 2;
        const yB = hdr.hh + HG + ph + GAP + stripH + GAP;
        boxes = [{x: 0, y: 0, w: sw, hh: hdr.hh, hy: 0, plan: {x: 0, y: hdr.hh + HG, w: sw, h: ph}}, {x: 0, y: yB, w: sw, hh: hdr.hh, hy: yB + ph + HG, plan: {x: 0, y: yB, w: sw, h: ph}}];
        stripY = hdr.hh + HG + ph + GAP;
      }
      if (boxes[0].plan.h < 200 / px) return null;
      for (const c of cols) {
        if (c.bld) {
          bld = {x: c.x, y: stripY + (stripH - c.bh) / 2, w: c.aw, h: c.bh};
          parts.push({m: c.m, x: c.x + c.aw + 12 / px, y: stripY + (stripH - c.m.height) / 2});
        } else parts.push({m: c.m, x: c.x, y: c.mid ? stripY + (stripH - c.m.height) / 2 : stripY});
      }
      return finish(F, kind, sw, boxes, parts, bld, hdr);
    };

    const finish = (F, kind, sw, boxes, parts, bld, hdr) => {
      const fr = fitAccess(boxes[0].plan, COMPACT);
      const {W: RW, H: RH, k} = fr;
      const G = accessGeometry(RW, RH, COMPACT);
      // the route badges sit just outside the room, in their corridors (the compact rooms keep the strip inside the
      // bottom wall free for the seat chips); the drawn badges and the chip obstacles both read G.badges
      G.badges = {restricted: {...G.badges.restricted, x: -G.t - G.cw + 30}, public: {...G.badges.public, y: G.H + G.t + G.cw - 30}};
      const E = G.extents;
      const org = boxes.map(b => ({x: b.plan.x + (b.plan.w - E.w * k) / 2 - E.x * k, y: b.plan.y + (b.plan.h - E.h * k) / 2 - E.y * k}));
      // walkers: the same windows in A and B (the longer of the two routes sets each duration)
      const plan0 = k2 => planAccessWalkers(G, routes, {a: W.walk[0], b: W.walk[1], lobby: [fi], clearLobbyPath: true, access: i => (i === fi ? acc[k2] : routes[i].access)});
      const wA = plan0('A'), wB = plan0('B');
      const win = walkWindows(wA.map((w, i) => Math.max(w.poly.total, wB[i].poly.total)), W.walk[0], W.walk[1]);
      const walkers = {};
      for (const k2 of SC) {
        walkers[k2] = planAccessWalkers(G, routes, {a: 0, b: 1, lobby: [fi], clearLobbyPath: true, access: i => (i === fi ? acc[k2] : routes[i].access), windows: win});
        // the focus participant turns from the hall towards its route before walking
        const w = walkers[k2][fi];
        if (w) {
          const q0 = w.poly.at(0.001);
          w.spot = {...w.spot, deg: ((q0.a * 180) / Math.PI + 90 + 360) % 360, restDeg: w.spot.deg};
        }
      }
      // nobody ever walks through anybody else (walking, waiting or seated) in either scene: shared, shifted windows
      const minGapD = deconflict([walkers.A, walkers.B], W.walk[0], W.walk[1], {minD: 78});
      // seat labels: ONE placement (scene A coordinates) clear of both scenes' routes, drawn in both scenes
      const toA = q => ({x: org[0].x + q.x * k, y: org[0].y + q.y * k});
      const rad = PERSON_RAD * k;
      const taken = new Set(routes.map(q => q.slot));
      // chips may reach over the corridors and walls (never over a waiting person or a route still to be walked):
      // the compact rooms are narrow, and a chip must stay nearer its own seat than the empty neighbouring chair
      const roomBox = {x: org[0].x + (E.x + G.t + 4) * k, y: org[0].y + 4 * k, w: (E.w - 2 * G.t - 8) * k, h: (G.H + G.t + G.cw - 8) * k};
      const furn = furnitureBoxes(G, taken).filter(f => f.kind !== 'chair' || !taken.has(f.slot)).map(f => ({x: org[0].x + f.x * k, y: org[0].y + f.y * k, w: f.w * k, h: f.h * k}));
      let labels = [];
      let fails = [];
      let trailsToo = true;
      if (showKey) {
        // every chip stays clear of every route line of both scenes (its own included), each line trimmed only
        // where it runs under its own person
        const trimmed = v => simplify(v.pts.filter(q => Math.hypot(q.x - v.seat.x, q.y - v.seat.y) > PERSON_RAD * 1.05), 1.5).map(toA);
        const allLines = SC.flatMap(k2 => walkers[k2].map(trimmed)).filter(q => q.length > 1);
        // chips also stay off every mark: the route badges, the hall-corner tag and the corner plants
        const bxA = (c, R) => { const q = toA(c); return {x: q.x - R * k, y: q.y - R * k, w: 2 * R * k, h: 2 * R * k}; };
        const marks = [...Object.values(G.badges).map(b => bxA(b, 28)),
          bxA({x: G.lobby.x - G.t / 2, y: G.lobby.y + G.lobby.h + G.t / 2}, 26)];
        const plantBoxes = G.plants.map(q => bxA(q, 25));
        // a corner plant a chip would need is left out of the plan (decoration only) rather than covered
        for (const plantsHard of [true, false]) {
          trailsToo = true;
          const res = placeSeatLabels(ctx, {
            items: walkers.A.map((w, i) => ({key: `seat${i}`, text: w.route.label, at: toA(w.seat), rad, avoidPaths: allLines})),
            people: walkers.A.map(w => bodyBox(toA(w.seat), w.seat.deg, rad)),
            furniture: furn, bounds: roomBox, size: F, minSize: F, maxWidth: Math.min(300 / px, Math.max(200 / px, G.tableW * k * 1.1)), maxLines: 3, maxGap: 50 / px, pathPad: rad * 0.55, extra: plantsHard ? [...marks, ...plantBoxes] : marks, ownMargin: 3 / px,
            ...accessObstacles(G, toA, taken, taken),
          });
          labels = res.labels;
          fails = res.fails;
          if (!fails.length) break;
        }
      }
      // strip / column nodes and the guide card's box
      const panel = parts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden}));
      const cardRow = panel.find(q => q.name === 'guide-card');
      // guide leaders: from the card to the nearest point of the focus route outside the room, in each scene;
      // straight, or with one bend, never across a head, a label or another text
      const avoid = [];
      SC.forEach((k2, i) => {
        const dx = org[i].x - org[0].x, dy = org[i].y - org[0].y;
        labels.forEach(l => avoid.push({x: l.box.x + dx, y: l.box.y + dy, w: l.box.w, h: l.box.h}));
        walkers[k2].forEach(w => { const c = {x: org[i].x + w.seat.x * k, y: org[i].y + w.seat.y * k}; avoid.push({x: c.x - rad, y: c.y - rad, w: 2 * rad, h: 2 * rad}); });
        avoid.push({x: boxes[i].x, y: boxes[i].hy ?? boxes[i].y, w: boxes[i].w, h: boxes[i].hh});
      });
      panel.filter(q => q !== cardRow).forEach(q => avoid.push(q.box));
      if (bld) avoid.push(bld);
      const leaders = [];
      let guideClear = true;
      if (cardRow) {
        const cb = cardRow.box;
        const cw0 = Math.min(cb.w, fitG(p.comparisonLabels.guide, {maxWidth: cb.w - F * 1.2, size: F, minSize: F, maxLines: 4, weight: 700}).width + F * 1.2);
        const card = {x: cb.x + (cb.w - cw0) / 2, y: cb.y, w: cw0, h: cb.h};
        SC.forEach((k2, i) => {
          const w = walkers[k2][fi];
          if (!w) return;
          const gate = G.doors[w.access].gate;
          const cut = w.pts.findIndex(q => Math.hypot(q.x - gate.x, q.y - gate.y) < G.t);
          const outside = (cut > 0 ? w.pts.slice(0, cut + 1) : w.pts).map(q => ({x: org[i].x + q.x * k, y: org[i].y + q.y * k}));
          const cc = {x: card.x + card.w / 2, y: card.y + card.h / 2};
          const byDist = outside.slice().sort((a, b) => Math.hypot(a.x - cc.x, a.y - cc.y) - Math.hypot(b.x - cc.x, b.y - cc.y));
          let got = null;
          for (const tq of byDist.slice(0, 40)) {
            for (const path of leaderPaths(card, tq)) {
              if (clearPath(path, avoid)) { got = path; break; }
            }
            if (got) break;
          }
          if (!got) { guideClear = false; got = leaderPaths(card, byDist[0])[0]; }
          leaders.push({i, pts: got});
        });
      }
      return {F, kind, sw, boxes, parts, bld, hdr, fr, k, G, org, walkers, labels, fails, trailsToo, panel, leaders, guideClear, minGapD};
    };

    // centre column at most ~17 % wide, so each scene keeps >= 40 % of the width
    // side by side, each scene >= 40 % of the FRAME width (a centre column would leave < 36 %)
    const kinds = shape === 'portrait' ? [['stack', 0]] : [['row', 0]];
    let best = null;
    // a composition is good when every label is placed, the guide is clear and people are >= 60 px across; the
    // largest text size with a good composition wins (a size up to 1.6 px smaller wins when its plans are >= 12 %
    // larger)
    const good = L => !L.fails.length && L.guideClear && L.minGapD >= 78 - 1e-6 && L.k * PERSON_RAD * 2 * 1.05 * px >= (shape === 'portrait' ? 64 : 60.5);
    const rank = L => (good(L) ? 2 : 0) + (L.fails.length ? 0 : 1) + L.k * 0.1;
    let firstGood = null;
    for (let F = 22.5 / px; F >= Fmin - 1e-6; F -= 0.8 / px) {
      let atF = null;
      for (const [kind, cf] of kinds) {
        const L = compose(showKey ? F : Fmin, kind, cf);
        log.push(L ? `${(F * px).toFixed(1)}:${kind}${cf || ''}:k${L.k.toFixed(2)}:${L.fails.join('+')}${L.trailsToo ? '' : ':loose'}${L.guideClear ? '' : ':guide'}` : `${(F * px).toFixed(1)}:${kind}${cf || ''}:null`);
        if (!L) continue;
        if (!atF || rank(L) > rank(atF)) atF = L;
      }
      if (!atF) continue;
      if (!best || rank(atF) > rank(best) + 0.5) best = atF;
      if (good(atF)) {
        if (!firstGood) firstGood = best = atF;
        else if (atF.k > best.k * 1.12) best = atF;
        if (firstGood.F - F >= 1.6 / px - 1e-9) break;
      }
      if (!showKey) break;
    }
    if (!best) best = compose(Fmin, kinds[kinds.length - 1][0], kinds[kinds.length - 1][1]);
    const L = best;
    const {F, G, k, org, walkers} = L;
    // ---- scene art (two complete plans, same size)
    const art = {}, people = {}, trails = {}, halos = {};
    for (const k2 of SC) {
      // the paired plans draw only the supplied seats' chairs (the tables and benches stay)
      // a corner plant under a seat chip is left out (the chips are placed clear of plants whenever they can be)
      const chipT = L.labels.map(l => ({x: (l.box.x - org[0].x) / k, y: (l.box.y - org[0].y) / k, w: l.box.w / k, h: l.box.h / k}));
      const plantBox = b => Math.abs(b.w - 50) < 1 && Math.abs(b.h - 50) < 1;
      art[k2] = accessArt(ctx, G, {prefix: `${k2}-rm`, chairs: new Set(routes.map(q => q.slot)), keep: b => !plantBox(b) || !chipT.some(c => c.x < b.x + b.w && b.x < c.x + c.w && c.y < b.y + b.h && b.y < c.y + c.h)});
      people[k2] = walkers[k2].map((w, i) => accessPerson(ctx, `${k2}-p${i}`, w.route.look));
      trails[k2] = walkers[k2].map((w, i) => accessTrail(ctx, {name: `${k2}-trail${i}`, pts: w.pts, color: accessColor(ctx, w.access)}));
      const fw = walkers[k2][fi];
      halos[k2] = fw ? h('path', {name: `${k2}-halo`, d: simplify(fw.pts, 0.5).map((q, j) => `${j ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent3, 'stroke-width': 26, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}) : null;
    }
    // ---- the route badge at the hall corner (no text); the focus route's outline (halo) is the only guide highlight
    // (no ring on the door: the compact rooms need the strip inside the door wall for the seat chips)
    const tagAt = {x: G.lobby.x - G.t / 2, y: G.lobby.y + G.lobby.h + G.t / 2};
    const tags = {};
    const rings = {};
    for (const k2 of SC) {
      tags[k2] = routeGlyph(ctx, acc[k2], {x: tagAt.x, y: tagAt.y, R: 24, name: `${k2}-tag`, opacity: 0});
      rings[k2] = null;
    }
    // ---- headers (route glyph + label + caption), equal size
    const hdrNodes = SC.map((k2, i) => {
      const b = L.boxes[i];
      const hd = L.hdr.hd[i];
      const hy = b.hy ?? b.y;
      const glyph = routeGlyph(ctx, acc[k2], {x: b.x + hd.R0, y: hy + hd.R0 + 2, R: hd.R0});
      const tx = b.x + hd.R0 * 2 + 14;
      return g({name: `hdr${i}`, opacity: 0},
        glyph,
        hd.lf ? textAt(hd.lf, tx, hy + 2, th.fg) : null,
        hd.cf ? textAt(hd.cf, tx, hy + 2 + hd.lf.height + F * 0.3, th.fgSoft) : null);
    });
    const building = buildingElevation(ctx, {name: 'bld', ...L.bld, floors: 3, bays: 5, highlight: {floor: 0, bay: 1}});
    const problems = [];
    if (L.fails.length) problems.push('labels');
    if (!L.guideClear) problems.push('guide');
    if (L.minGapD < 78 - 1e-6) problems.push('crowding');
    const share = (L.sw * fitScale(ctx)) / ctx.view.width;
    return {
      F, px, G, k, org, walkers, art, people, trails, halos, tags, rings, headers: hdrNodes, panel: L.panel, building, labels: L.labels, leaders: L.leaders, fi, acc,
      kind: L.kind, log, problems, share, trailsToo: L.trailsToo, boxes: L.boxes, minGapD: L.minGapD,
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    const plan = (k2, i) => g({name: `${k2}-scene`},
      g({name: `${k2}-plan`, transform: T(L.org[i].x, L.org[i].y, 0, L.k)},
        L.art[k2].node,
        L.halos[k2],
        L.trails[k2].map(t => t.node),
        L.rings[k2],
        L.tags[k2],
        L.people[k2].map(pp => pp.node)),
      L.labels.map((sl, j) => {
        const dx = L.org[i].x - L.org[0].x, dy = L.org[i].y - L.org[0].y;
        const sh = {...sl, box: {...sl.box, x: sl.box.x + dx, y: sl.box.y + dy}, from: {x: sl.from.x + dx, y: sl.from.y + dy}, to: {x: sl.to.x + dx, y: sl.to.y + dy}};
        return seatLabelNode(ctx, sh, {name: `${k2}-lab${j}`, size: L.F, owner: `${k2}-p${j}`, seat: `${k2}-rm-chair-${L.walkers[k2][j].slot}`});
      }));
    return g(null,
      L.headers,
      plan('A', 0),
      plan('B', 1),
      L.building.node,
      L.panel.map(q => q.node),
      g({name: 'guide', opacity: 0},
        L.leaders.map((ld, j) => h('path', {name: `guide-lead${j}`, d: ld.pts.map((q, n) => `${n ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent3, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'})),
        L.leaders.map(ld => h('circle', {cx: r(ld.pts[ld.pts.length - 1].x), cy: r(ld.pts[ld.pts.length - 1].y), r: 6, fill: th.accent3}))),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const G = L.G;
    const sem = {};
    const turn = ease.inOutCubic(seg(u, ...W.turn));
    const preview = ease.inOutSine(seg(u, ...W.preview));
    const tagP = seg(u, ...W.tag);
    const headerP = seg(u, ...W.header);
    const guideP = seg(u, ...W.guide);
    const noteP = seg(u, ...W.note);
    for (const [si, k2] of SC.entries()) {
      const positions = [];
      const st = {states: [], labels: [], people: [], degs: [], trails: []};
      L.walkers[k2].forEach((w, i) => {
        const q = seg(u, w.start, w.end);
        const s = walkerAt(w, q, {reduced: ctx.reduced});
        let deg = s.deg;
        if (i === L.fi && q <= 0) deg = w.spot.restDeg + angDiff(w.spot.restDeg, w.spot.deg) * turn;
        Object.assign(nodes, L.people[k2][i].pose({x: s.x, y: s.y, deg, phase: s.phase, walk: s.walk, seated: s.seated}));
        positions.push(s);
        const draw = i === L.fi ? preview : seg(u, w.start - 0.03, w.start + (w.end - w.start) * 0.45);
        Object.assign(nodes, L.trails[k2][i].frame(draw, 1));
        const bodyP = seg(u, w.end - 0.012, w.end + 0.018);
        const textP = seg(u, w.end + 0.012, w.end + 0.04);
        if (L.labels[i]) {
          nodes[`${k2}-lab${i}`] = {opacity: r(bodyP, 3)};
          nodes[`${k2}-lab${i}-text`] = {opacity: r(textP, 3)};
        }
        const dp = {x: L.org[si].x + s.x * L.k, y: L.org[si].y + s.y * L.k};
        sem[`${k2}p${i}`] = R2(dp);
        sem[`${k2}seat${i}`] = R2({x: L.org[si].x + w.seat.x * L.k, y: L.org[si].y + w.seat.y * L.k});
        st.states.push(s.state);
        st.labels.push(r(L.labels[i] ? textP : (q >= 1 ? 1 : 0), 3));
        st.people.push({x: r(s.x, 1), y: r(s.y, 1)});
        st.degs.push(r(deg, 1));
        st.trails.push(r(draw, 3));
      });
      const dPub = doorOpen(G, 'public', positions), dRes = doorOpen(G, 'restricted', positions);
      Object.assign(nodes, L.art[k2].doors.public.frame(dPub), L.art[k2].doors.restricted.frame(dRes));
      nodes[`${k2}-tag`] = {opacity: r(tagP, 3), transform: `translate(0 0)`};
      if (L.halos[k2]) nodes[`${k2}-halo`] = {opacity: r(0.42 * guideP, 3)};
      nodes[`hdr${si}`] = {opacity: r(headerP, 3)};
      sem[k2] = {...st, doors: [r(dPub, 3), r(dRes, 3)]};
      sem[`look${k2}`] = {people: st.people, degs: st.degs, trails: st.trails, doors: [r(dPub, 3), r(dRes, 3)], tag: r(tagP, 3), header: r(headerP, 3), halo: r(guideP, 3), states: st.states};
    }
    nodes.guide = {opacity: r(guideP, 3)};
    if (L.panel.some(q => q.name === 'guide-card')) nodes['guide-card'] = {opacity: r(guideP, 3)};
    if (L.panel.some(q => q.name === 'neutral')) nodes.neutral = {opacity: r(noteP, 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const fwA = L.walkers.A[L.fi], fwB = L.walkers.B[L.fi];
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        scenes: 2,
        accessA: L.acc.A,
        accessB: L.acc.B,
        focus: L.fi,
        focusDoorA: fwA ? fwA.access : null,
        focusDoorB: fwB ? fwB.access : null,
        focusThroughOwnDoor: [fwA, fwB].every(w => !w || (passesNear(w.pts, G.doors[w.access].gate, 2) && !passesNear(w.pts, G.doors[w.access === 'public' ? 'restricted' : 'public'].gate, 60))),
        focusSameSeat: !fwA || (fwA.slot === fwB.slot),
        othersIdentical: L.walkers.A.every((w, i) => i === L.fi || JSON.stringify(w.pts) === JSON.stringify(L.walkers.B[i].pts)),
        sameWindows: L.walkers.A.every((w, i) => w.start === L.walkers.B[i].start && w.end === L.walkers.B[i].end),
        guideShown: r(guideP, 3),
        noteShown: r(noteP, 3),
        allReached: true,
        arrangement: L.kind,
        share: r(L.share, 3),
        k: r(L.k, 3),
        textPx: r(L.F * L.px, 1),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
        labelsPlaced: L.problems.length === 0,
        problems: L.problems,
        minGapTemplate: r(L.minGapD, 1),
        log: L.log,
      },
    };
  },
};

/** Design units → frame pixels. */
function fitScale(ctx) {
  const c = ctx.view.content;
  return Math.min(c.w / ctx.design.w, c.h / ctx.design.h);
}

const angDiff = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;

/** Leader candidates from a card to a target: straight from the nearest edge point, or with one bend. */
function leaderPaths(card, tq) {
  const out = [];
  const nx = clamp(tq.x, card.x + 10, card.x + card.w - 10), ny = clamp(tq.y, card.y + 6, card.y + card.h - 6);
  const inX = tq.x >= card.x + 10 && tq.x <= card.x + card.w - 10;
  const inY = tq.y >= card.y + 6 && tq.y <= card.y + card.h - 6;
  const edgeY = tq.y < card.y ? card.y : card.y + card.h;
  const edgeX = tq.x < card.x ? card.x : card.x + card.w;
  if (inX) out.push([{x: tq.x, y: edgeY}, tq]);
  else if (inY) out.push([{x: edgeX, y: tq.y}, tq]);
  else {
    out.push([{x: nx, y: edgeY}, {x: nx, y: tq.y}, tq]);
    out.push([{x: edgeX, y: ny}, {x: tq.x, y: ny}, tq]);
    out.push([{x: nx, y: edgeY}, tq]);
    out.push([{x: edgeX, y: ny}, tq]);
  }
  return out.filter(pts => pts.reduce((a, q, j) => a + (j ? Math.hypot(q.x - pts[j - 1].x, q.y - pts[j - 1].y) : 0), 0) >= 24);
}

/** A leader path is clear when no sample (outside its two ends) falls inside an obstacle box. */
function clearPath(pts, boxes) {
  const total = pts.reduce((a, q, j) => a + (j ? Math.hypot(q.x - pts[j - 1].x, q.y - pts[j - 1].y) : 0), 0);
  let run = 0;
  for (let j = 1; j < pts.length; j++) {
    const a = pts[j - 1], b = pts[j];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(2, Math.ceil(L / 6));
    for (let i = 0; i <= n; i++) {
      const d = run + (L * i) / n;
      if (d < Math.min(6, total * 0.04) || d > total * 0.96) continue;
      const q = {x: a.x + ((b.x - a.x) * i) / n, y: a.y + ((b.y - a.y) * i) / n};
      if (boxes.some(bx => q.x > bx.x - 8 && q.x < bx.x + bx.w + 8 && q.y > bx.y - 8 && q.y < bx.y + bx.h + 8)) return false;
    }
    run += L;
  }
  return true;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'courts-05-contrast',
    title: 'Room access — the same room with one participant’s supplied route changed',
    titleEs: 'Acceso a sala — Comparación de dos supuestos',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Acceso a sala',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two complete plans of the same generic room with the same two separate supplied routes (● public access, ◆ restricted access as configured), the same seats, people and entrance order. Only one participant’s supplied route differs: in A they take one route, in B the other; their route line draws from the entrance hall through a different door to the same seat, and everyone enters in parallel with the same timing. A guide joins the changed route in both scenes; the neutral note says both are as supplied, with no winner, rule or outcome.',
    tags: ['contrast', 'room access', 'public access', 'restricted access as configured', 'routes', 'doors', 'paired scenes', 'floor plan', 'seating'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/acceso-a-sala.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
