/**
 * LAW-0220 — Acceso a sala · inspect
 *
 * Storyboard (the context is the state produced by the story: the plan of the
 * generic room with its two separate supplied routes — ● public corridor and
 * door, ◆ restricted corridor and door as configured — everyone seated, the
 * solid route line of each participant drawn from where they started; one
 * participant, the inspected one, came from the entrance hall, and a tag under
 * the hall carries the supplied datum "Route: public access (as supplied)"):
 *  0.00–0.20  build: the route lines draw from their starts to the seats; the
 *             tag is readable under the hall.
 *  0.20–0.45  isolate: a frame settles on the hall — the place where the two
 *             routes part — and the tag; the plan's texts fade only while they
 *             would fall below 16 px, the plan shrinks into its side of the frame
 *             (it keeps >= 45 % of the width, people >= 45 px) and a lens opens
 *             in the freed space with a REAL enlarged copy of the same
 *             coordinates (the hall, the first stretch of both corridors and the
 *             tag, each whole), tied to the frame by solid guides (a guide that
 *             would cut across the plan, a text or a person is left out, so at
 *             least one is drawn). The panel fades out completely before the
 *             lens appears and returns only after it has closed.
 *  0.45–0.75  substitute ONE datum: the old value is struck, leaves the tag and
 *             docks under it as a grey "was: …" chip; the new supplied value
 *             appears. Only the dependent connection follows: the inspected
 *             route line retracts and redraws from the hall through the other
 *             corridor and door to the SAME seat (in the lens and in the shrunk
 *             plan). Nobody moves; for a wording substitution nothing moves.
 *  0.75–1.00  return: the lens closes, the plan grows back with the new route
 *             line, its texts return, the struck old value stays docked and the
 *             neutral changed-datum marker (Δ) sits beside the tag. Seeking back
 *             restores the old datum exactly. No rule on who may attend, no
 *             validity, responsibility or outcome is inferred.
 * @module animations/courts/LAW-0220
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {buildingElevation} from './kits/courts-art.js';
import {placeSeatLabels, bodyBox, seatLabelNode, pxPerUnit, R2} from './kits/distribucion-de-sala.js';
import {
  accessFields, ACCESS_EN, ACCESS_STRINGS, ACCESS, resolveAccess, accessGeometry, fitAccess, planAccessWalkers, accessArt, accessTrail, accessRoute,
  accessPerson, accessObstacles, furnitureBoxes, accessColor, measureStack, drawStack, fitG, textAt, simplify, PERSON_RAD,
} from './kits/acceso-a-sala.js';
import {polyline} from '../../core/geometry.js';

const ID = 'LAW-0220';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  trails: [0.03, 0.15], frame: [0.2, 0.24], shrink: [0.21, 0.27], open: [0.245, 0.315],
  strike: [0.46, 0.5], dock: [0.51, 0.55], newIn: [0.555, 0.585], retract: [0.59, 0.63], redraw: [0.63, 0.68],
  close: [0.715, 0.76], grow: [0.74, 0.8], textIn: [0.8, 0.83], marker: [0.83, 0.87],
};

const STRINGS = {
  en: {...ACCESS_STRINGS.en, markerNote: 'Changed datum (as supplied)'},
  es: {...ACCESS_STRINGS.es, markerNote: 'Dato cambiado (según lo aportado)'},
};

const sceneSchema = {
  ...accessFields,
  focusRoute: int('Index in `routes` of the inspected participant (they came in from the entrance hall; their tag carries the datum)', 0, 5),
  focusTarget: oneOf('route: the supplied route of the inspected participant is substituted (its route line re-routes through the other corridor and door to the same seat); wording: only the wording of the tag changes', ['route', 'wording']),
  beforeValue: str('Value shown on the tag before the substitution', 60),
  afterValue: str('Value shown on the tag after the substitution (the alternative datum)', 60),
  afterAccess: oneOf('For focusTarget "route": the supplied access route after the substitution', ACCESS),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Maximum magnification of the lens relative to the context', 1.5, 4),
    placement: oneOf('Where the freed space for the lens is taken', ['auto', 'right', 'bottom']),
  }),
  contextLabels: obj('Labels of the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 50),
  }),
};

const defaultParams = {
  ...ACCESS_EN,
  focusRoute: 2,
  focusTarget: 'route',
  beforeValue: 'Route: public access (as supplied)',
  afterValue: 'Route: restricted access as configured',
  afterAccess: 'restricted',
  detailGeometry: {zoom: 2.5, placement: 'auto'},
  contextLabels: {context: 'The supplied routes, one route datum inspected', marker: 'One supplied datum changed'},
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
    const beforeAccess = routes[fi].access;
    const afterAccess = p.focusTarget === 'route' ? p.afterAccess : beforeAccess;
    const moves = afterAccess !== beforeAccess;
    const shape = ctx.view.shape;
    const placement = p.detailGeometry.placement === 'auto' ? (shape === 'portrait' ? 'bottom' : 'right') : p.detailGeometry.placement;
    const GAP = 26 / px;
    const log = [];
    const wasText = `${ctx.t.was}: ${p.beforeValue}`;
    const nameItems = showKey ? [{type: 'chip', text: p.courts.building, name: 'bld-name'}, {type: 'chip', text: p.courts.room, stroke: th.accent2, name: 'room-name'}] : [];
    const items = [
      ...(showAll ? [{type: 'text', text: p.contextLabels.context, weight: 600, name: 'ctx-caption'}] : []),
      ...(showKey ? [{type: 'legend', kind: 'public', text: p.labels.publicAccess, weight: 600, name: 'legend-public'}, {type: 'legend', kind: 'restricted', text: p.labels.restrictedAccess, weight: 600, name: 'legend-restricted'}] : []),
      ...(showAll ? [{type: 'text', text: `Δ  ${p.contextLabels.marker}`, name: 'marker-note'}] : []),
      ...(showKey ? [{type: 'key', text: p.labels.key, name: 'key'}] : []),
    ];

    const compose = (F, cf, tf = 0.42) => {
      // ---- panel: building + names + texts (column on wide frames, band on top in portrait)
      let parts = [], bld, box;
      if (shape !== 'portrait') {
        const pw = Math.max(250 / px, D.w * cf);
        const m = measureStack(ctx, [...nameItems, ...items], pw, F);
        if (m.truncated) return null;
        const bh = Math.min(D.h - m.height - m.gap, pw * 0.95, D.h * 0.45);
        if (bh < Math.min(140 / px, D.h * 0.2)) return null;
        bld = {x: D.w - pw + (pw - Math.min(pw, bh / 0.9)) / 2, y: 0, w: Math.min(pw, bh / 0.9), h: bh};
        parts = [{m, x: D.w - pw, y: bh + m.gap + (D.h - bh - m.gap - m.height) * 0.3}];
        box = {x: 0, y: 0, w: D.w - pw - GAP, h: D.h};
      } else {
        const bw = D.w * cf;
        const tw = D.w - bw - GAP;
        const mn = measureStack(ctx, nameItems, bw, F);
        const mt = measureStack(ctx, items, tw, F);
        if (mn.truncated || mt.truncated) return null;
        const bh = Math.min(bw * 0.8, Math.max(140 / px, mt.height - mn.height - mn.gap));
        const bandH = Math.max(bh + (mn.height ? mn.gap + mn.height : 0), mt.height);
        if (bandH > D.h * 0.34) return null;
        bld = {x: 0, y: 0, w: bw, h: bh};
        parts = [...(mn.height ? [{m: mn, x: 0, y: bh + mn.gap}] : []), {m: mt, x: bw + GAP, y: (bandH - mt.height) / 2}];
        box = {x: 0, y: bandH + GAP, w: D.w, h: D.h - bandH - GAP};
      }
      // ---- the tag under the hall: the inspected participant's label, the value, and room for the docked "was"
      const tagW = Math.min((tf > 0.45 ? 360 : 290) / px, box.w * tf);
      const fTitle = fitG(routes[fi].label, {maxWidth: tagW - F * 1.2, size: F, minSize: F, maxLines: 2, weight: 700});
      const fB = fitG(p.beforeValue, {maxWidth: tagW - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 600});
      const fA = fitG(p.afterValue, {maxWidth: tagW - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 600});
      const fW = fitG(wasText, {maxWidth: tagW - F * 1.2, size: F, minSize: F, maxLines: 3, weight: 500});
      if (fTitle.truncated || fB.truncated || fA.truncated || fW.truncated) return null;
      const padY = F * 0.34;
      const valH = Math.max(fB.height, fA.height);
      const tagH = showKey ? fTitle.height + F * 0.3 + valH + padY * 2 : 0;
      const wasH = showKey ? fW.height + padY * 2 : 0;
      const stackH = showKey ? tagH + 8 / px + wasH : 0;
      const pbox = {x: box.x, y: box.y, w: box.w, h: box.h - (showKey ? stackH + 14 / px : 0)};
      const fr = fitAccess(pbox);
      const {W: RW, H: RH, k} = fr;
      const G = accessGeometry(RW, RH);
      const E = G.extents;
      // the plan sits at the left (and top) of its box, so the tag and the lens side stay together
      const ox = pbox.x - E.x * k + (pbox.w - E.w * k) / 2;
      const oy = pbox.y - E.y * k;
      const toD = q => ({x: ox + q.x * k, y: oy + q.y * k});
      const planRect = {x: ox + E.x * k, y: oy + E.y * k, w: E.w * k, h: E.h * k};
      const walkers = planAccessWalkers(G, routes, {a: 0, b: 1, lobby: [fi]});
      // the inspected route after the substitution (same start in the hall, same seat)
      const fw = walkers[fi];
      const afterPts = moves ? accessRoute(G, fw.slot, afterAccess, G.lobbySpot, true) : fw.pts;
      const rad = PERSON_RAD * k;
      const taken = new Set(walkers.map(w => w.slot));
      const roomBox = {x: ox + 4 * k, y: oy + 4 * k, w: (G.W - 8) * k, h: (G.H - 8) * k};
      const furn = furnitureBoxes(G).filter(f => f.kind !== 'chair' || !taken.has(f.slot)).map(f => ({x: ox + f.x * k, y: oy + f.y * k, w: f.w * k, h: f.h * k}));
      // tag position: under the hall (the building's bottom-left corner), left-aligned with the plan
      const lob = toD({x: G.lobby.x, y: G.lobby.y + G.lobby.h + G.t});
      const tag = {x: planRect.x, y: planRect.y + planRect.h + 14 / px, w: tagW, h: tagH};
      const was = {x: planRect.x, y: tag.y + tagH + 8 / px, w: fW.width + F * 1.2, h: wasH};
      // ---- the crop: the hall, the first stretch of both corridors (routes part here) and the tag stack
      // the decisive detail: the hall with the two badged openings where the routes part, the first stretch of each
      // corridor (the focus line leaves through one opening or the other) and the tag with its docked value
      const cropT = {x: E.x, y: G.H - 40, x1: 110, y1: E.y + E.h};
      const c0 = toD({x: cropT.x, y: cropT.y}), c1 = toD({x: cropT.x1, y: cropT.y1});
      const crop = {x: c0.x - 6 / px, y: c0.y, w: Math.max(c1.x - c0.x, tagW + 12 / px) + 12 / px, h: (showKey ? was.y + wasH : c1.y) - c0.y + 10 / px};
      // portrait: the lens is height-bound, so the crop takes a little more of the public corridor (near-square)
      // without the tag the crop is wide and low: it takes more of the restricted corridor above the hall instead
      if (crop.h < crop.w * 0.9) { const dh = crop.w * 0.9 - crop.h; crop.y -= dh; crop.h += dh; }
      if (shape === 'portrait') crop.w = Math.min(Math.max(crop.w, crop.h * 0.92), planRect.x + planRect.w - crop.x);
      // ---- shrink target and the lens in the freed space (people stay >= 45 px; the plan keeps >= 45 % width)
      const personPx = rad * 2 * 1.05 * px;
      const sPeople = 46 / personPx;
      let bestL = null;
      const sceneBox = {x: planRect.x, y: planRect.y, w: planRect.w, h: (showKey ? was.y + wasH : planRect.y + planRect.h) - planRect.y};
      // the shrunk plan keeps its texts (the tag included) >= 16 px, so the source frame shows what the lens copies
      // (when no lens fits with that, the plan may shrink further: its texts leave and the tag alone keeps >= 16 px by a
      // counter-scale, the source frame growing with it)
      const sText = showKey ? 16.5 / (F * px) : 0;
      for (const [floor, counter] of [[sText, false], [0, true]]) {
      if (bestL && bestL.ok) break;
      for (let st = 0.9; st >= Math.max(0.4, sPeople, floor) - 1e-9; st -= 0.02) {
        let offT, region;
        // the tag's on-screen size when it is counter-scaled to stay >= 16 px
        const ts = counter && showKey ? Math.max(st, 16.5 / (F * px)) : st;
        const tagWd = Math.max(tag.w, was.w), tagHd = was.y + wasH - tag.y;
        if (placement === 'right') {
          offT = {x: sceneBox.x * (1 - st), y: (sceneBox.y + sceneBox.h / 2) * (1 - st)};
          const right = Math.max(offT.x + (sceneBox.x + sceneBox.w) * st, showKey ? offT.x + tag.x * st + tagWd * ts : 0);
          region = {x: right + GAP, y: 0, w: D.w - right - GAP, h: D.h};
        } else {
          offT = {x: (sceneBox.x + sceneBox.w / 2) * (1 - st), y: sceneBox.y * (1 - st)};
          const bottom = Math.max(offT.y + (sceneBox.y + sceneBox.h) * st, showKey ? offT.y + tag.y * st + tagHd * ts : 0);
          region = {x: 0, y: bottom + GAP, w: D.w, h: D.h - bottom - GAP};
        }
        if (region.w < 80 / px || region.h < 80 / px) continue;
        const zMax = p.detailGeometry.zoom * st;
        const z = Math.min(zMax, (region.w - 12 / px) / crop.w, (region.h - 12 / px) / crop.h);
        const dest = {w: crop.w * z, h: crop.h * z, x: region.x + (region.w - crop.w * z) / 2, y: region.y + (region.h - crop.h * z) / 2};
        const ctxW = sceneBox.w * st / D.w;
        const lensShort = Math.min(dest.w, dest.h) * px / 1080;
        // the lens copy's text must itself be >= 16 px once the lens is open
        // context + lens fill >= 0.8 of the box along the stacking direction
        const fill = placement === 'right' ? (sceneBox.w * st + GAP + dest.w) / D.w : (sceneBox.h * st + GAP + dest.h) / (D.h - box.y);
        const L = {st, offT, dest, z, zoomRel: z / st, ctxW, fill, ok: z / st >= 1.55 && ctxW >= 0.46 && lensShort >= 0.36 && fill >= 0.8 && (!showKey || F * px * z >= 16.5), lensShort, counter: counter && showKey && F * px * st < 16.5};
        // among working lenses (a few steps below the first) the larger lens wins
        if (!bestL || (L.ok && !bestL.ok) || (L.ok === bestL.ok && (L.ok ? L.lensShort > bestL.lensShort + 0.005 : L.zoomRel > bestL.zoomRel))) bestL = L;
        if (bestL.ok && L.st <= bestL.st - 0.079) break;
      }
      }
      if (!bestL) return null;
      // labels are placed only for a composition whose lens already works (keeps create() fast)
      const lensOk = bestL && bestL.ok && bestL.lensShort >= 0.36;
      // people below the at-rest floor rule the composition out before its (costly) label placement
      const peopleOk = rad * 2 * 1.05 * px >= 61.5;
      let labels = [], fails = [];
      if (showKey && lensOk && peopleOk) {
        // every route line (before and after, a chip's own line included up to where it meets its person) and the
        // whole source frame (its outline and what the lens copies) stay clear of the chips
        const trim = (pts, seat) => pts.filter(q => Math.hypot(q.x - seat.x, q.y - seat.y) > PERSON_RAD * 1.05);
        const allPaths = [...walkers.map(w => simplify(trim(w.pts, w.seat), 1.5).map(toD)), simplify(trim(afterPts, walkers[fi].seat), 1.5).map(toD)];
        const edge = 8 / px;
        const frameEdges = [{x: crop.x - edge, y: crop.y - edge, w: crop.w + 2 * edge, h: crop.h + 2 * edge}];
        const labelOpts = {
          people: walkers.map(w => bodyBox(toD(w.seat), w.seat.deg, rad)),
          furniture: furn, bounds: roomBox, size: F, minSize: F, maxWidth: Math.min(330 / px, Math.max(230 / px, G.tableW * k * 1.1)), maxLines: 3, maxGap: 50 / px, pathPad: rad * 0.55, extra: frameEdges,
          ...accessObstacles(G, toD, taken),
        };
        const items = walkers.map((w, i) => ({key: `seat${i}`, text: w.route.label, at: toD(w.seat), rad, avoidPaths: allPaths.filter(q => q.length > 1)}));
        // a chip that cannot be placed even alone rules the composition out without trying every placement order
        const soloFail = items.find(it => placeSeatLabels(ctx, {...labelOpts, items: [it]}).fails.length);
        const res = soloFail ? {labels: [], fails: [soloFail.key]} : placeSeatLabels(ctx, {...labelOpts,
          items,
        });
        labels = res.labels;
        fails = res.fails;
      }
      const problems = [];
      if (fails.length) problems.push('labels');
      if (!lensOk) problems.push('lens');
      if (!peopleOk) problems.push('people');
      if (bestL.zoomRel < 1.5 - 1e-9) problems.push('zoom');
      if (bestL.ctxW < 0.45) problems.push('context-narrow');
      if (showKey && F * px * bestL.z < 16.5) problems.push('lens-text');
      return {F, cf, box, pbox, bld, parts, k, G, ox, oy, toD, planRect, walkers, fi, afterPts, moves, labels, fails, tag, was, fTitle, fB, fA, fW, padY, valH, crop, lens: bestL, sceneBox, problems, lob, tagW};
    };

    let best = null;
    const seen = new Set();
    const cfs = shape === 'portrait' ? [0.36, 0.42] : [0.22, 0.26, 0.3];
    const good = L => !L.problems.length && L.k * PERSON_RAD * 2 * 1.05 * px >= 61.5;
    for (let F = 22.5 / px; F >= 16.6 / px - 1e-6; F -= 0.8 / px) {
      for (const cf of cfs) {
        for (const tf of [0.42, 0.52]) {
        // compositions that are identical (the panel width clamps to its minimum) are composed once
        const Fe = showKey ? F : 16.6 / px;
        const key = `${Fe.toFixed(4)}:${shape === 'portrait' ? cf : Math.max(250 / px, D.w * cf).toFixed(3)}:${tf}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const L = compose(Fe, cf, tf);
        log.push(L ? `${(F * px).toFixed(1)}:${cf}:k${L.k.toFixed(2)}:${L.problems.join('+')}${L.fails.join("")}:st${L.lens.st.toFixed(2)}z${L.lens.zoomRel.toFixed(2)}ls${L.lens.lensShort.toFixed(2)}c${(L.crop.w*px).toFixed(0)}x${(L.crop.h*px).toFixed(0)}d${(L.lens.dest.w*px).toFixed(0)}x${(L.lens.dest.h*px).toFixed(0)}cw${L.lens.ctxW.toFixed(2)}f${L.lens.fill.toFixed(2)}` : `${(F * px).toFixed(1)}:${cf}:null`);
        if (!L) continue;
        if (!best || (good(L) && !good(best)) || (good(L) === good(best) && L.k > best.k * 1.08 && L.F >= best.F - 1e-6)) best = L;
        }
      }
      if (best && good(best)) break;
    }
    if (!best) best = compose(16.6 / px, cfs[0]);
    const L = best;
    const {F, G, k, ox, oy, toD, walkers, fi: fIdx} = L;
    const art = accessArt(ctx, G, {prefix: 'rm', hallBadges: true});
    const people = walkers.map((w, i) => accessPerson(ctx, `p${i}`, w.route.look));
    const trails = walkers.map((w, i) => accessTrail(ctx, {name: `trail${i}`, pts: w.pts, color: accessColor(ctx, w.access)}));
    const trailAfter = L.moves ? accessTrail(ctx, {name: 'trail-after', pts: L.afterPts, color: accessColor(ctx, afterAccess)}) : null;
    // the lens copy: the same plan art and route lines, clipped to the crop
    const lzArt = accessArt(ctx, G, {prefix: 'lz', badges: true, hallBadges: true});
    const lzTrails = walkers.map((w, i) => accessTrail(ctx, {name: `lz-trail${i}`, pts: w.pts, color: accessColor(ctx, w.access)}));
    const lzAfter = L.moves ? accessTrail(ctx, {name: 'lz-trail-after', pts: L.afterPts, color: accessColor(ctx, afterAccess)}) : null;
    const building = buildingElevation(ctx, {name: 'bld', ...L.bld, floors: 3, bays: 5, highlight: {floor: 0, bay: 1}});
    const panel = L.parts.flatMap(pt => drawStack(ctx, pt.m, pt.x, pt.y, {hidden: it => it.name === 'marker-note'}));
    const markerR = F * 0.8;
    const markerAt = {x: L.tag.x + L.tag.w + markerR + 8 / px, y: L.tag.y + L.tag.h / 2};
    const problems = [...L.problems];
    return {
      F, px, G, k, ox, oy, toD, walkers, fi: fIdx, art, people, trails, trailAfter, lzArt, lzTrails, lzAfter, building, panel, labels: L.labels,
      tag: L.tag, was: L.was, fTitle: L.fTitle, fB: L.fB, fA: L.fA, fW: L.fW, padY: L.padY, valH: L.valH, crop: L.crop, lens: L.lens, sceneBox: L.sceneBox, planRect: L.planRect,
      moves: L.moves, beforeAccess, afterAccess, problems, log, placement, markerAt, markerR, showKey, lob: L.lob,
      panelOverLens: shape !== 'portrait', focusTarget: p.focusTarget,
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    const F = L.F;
    const tagNode = (pre, withMarker) => {
      if (!L.showKey) return null;
      const t = L.tag;
      const cx = t.x + t.w / 2;
      const y1 = t.y + L.padY;
      const yv = y1 + L.fTitle.height + F * 0.3;
      const strikes = L.fB.lines.map((ln, i) => {
        const lw = ctx.measure(ln, L.fB.size, L.fB.weight, L.fB.family);
        const yy = yv + (L.valH - L.fB.height) / 2 + L.fB.size * 0.8 + i * L.fB.lineHeight - L.fB.size * 0.3;
        return h('line', {name: `${pre}-st${i}`, x1: r(cx - lw / 2 - 3), y1: r(yy), x2: r(cx - lw / 2 - 3), y2: r(yy), stroke: th.inkSoft, 'stroke-width': 3, 'stroke-linecap': 'butt'});
      });
      const w = L.was;
      const wx = t.x;
      return g({name: `${pre}-tagwrap`},
        g({name: `${pre}-tag`},
          // a leader from the tag to the hall (the building's entrance corner)
          h('line', {x1: r(t.x + 28), y1: r(t.y), x2: r(L.lob.x + 30), y2: r(L.lob.y - 2), stroke: th.accent2, 'stroke-width': 3}),
          h('path', {name: `${pre}-tag-body`, d: roundRectPath(t.x, t.y, t.w, t.h, Math.min(16, t.h / 4)), fill: th.card, stroke: th.accent2, 'stroke-width': 3}),
          textAt(L.fTitle, cx, y1, th.ink, {anchor: 'middle'}),
          g({name: `${pre}-old`}, textAt(L.fB, cx, yv + (L.valH - L.fB.height) / 2, th.ink, {anchor: 'middle'}), g({name: `${pre}-strikes`}, strikes)),
          g({name: `${pre}-new`, opacity: 0}, textAt(L.fA, cx, yv + (L.valH - L.fA.height) / 2, th.ink, {anchor: 'middle'}))),
        g({name: `${pre}-was`, opacity: 0},
          h('path', {d: roundRectPath(wx, w.y, w.w, w.h, Math.min(14, w.h / 2)), fill: th.paperShade, stroke: th.inkSoft, 'stroke-width': 1.5}),
          textAt(L.fW, wx + w.w / 2, w.y + L.padY, th.inkSoft, {anchor: 'middle'}),
          L.fW.lines.map((ln, i) => {
            const lw = ctx.measure(ln, L.fW.size, L.fW.weight, L.fW.family);
            const yy = w.y + L.padY + L.fW.size * 0.8 + i * L.fW.lineHeight - L.fW.size * 0.3;
            return h('line', {x1: r(wx + w.w / 2 - lw / 2 - 2), y1: r(yy), x2: r(wx + w.w / 2 + lw / 2 + 2), y2: r(yy), stroke: th.inkSoft, 'stroke-width': 2});
          })),
        withMarker ? changedMarker(ctx, {name: 'cx-marker', x: L.markerAt.x, y: L.markerAt.y, radius: L.markerR, opacity: 0}) : null,
      );
    };
    const d = L.lens.dest, c = L.crop, z = L.lens.z;
    return g(null,
      g({name: 'world'},
        g({name: 'plan', transform: T(L.ox, L.oy, 0, L.k)},
          L.art.node,
          h('circle', {cx: r(L.G.lobbySpot.x), cy: r(L.G.lobbySpot.y), r: 18, fill: th.paper, stroke: th.ink, 'stroke-width': 4}),
          L.trails.map(t => t.node),
          L.trailAfter && L.trailAfter.node,
          L.people.map(pp => pp.node)),
        g({name: 'world-text'},
          L.labels.map((sl, i) => seatLabelNode(ctx, sl, {name: `lab${i}`, size: L.F, owner: `p${i}`, seat: `rm-chair-${L.walkers[i].slot}`}))),
        tagNode('cx', true),
        h('rect', {name: 'src-frame', x: r(c.x), y: r(c.y), width: r(c.w), height: r(c.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke', opacity: 0})),
      g({name: 'panel'}, L.building.node, L.panel.map(q => q.node)),
      ['guide0', 'guide1'].map(n => h('line', {name: n, x1: 0, y1: 0, x2: 0, y2: 0, stroke: th.accent2, 'stroke-width': 2.5, opacity: 0})),
      // the lens: an opaque window with a real enlarged copy of the same coordinates (plan art, route lines, tag)
      g({name: 'lz', opacity: 0, 'data-occludes': 1},
        h('defs', null, h('clipPath', {id: ctx.id('lz-clip')}, h('rect', {x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18}))),
        h('rect', {x: r(d.x + 6), y: r(d.y + 10), width: r(d.w), height: r(d.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lz-bg', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: th.paper}),
        g({'clip-path': ctx.ref('lz-clip')},
          g({name: 'lz-content', transform: `${T(d.x - c.x * z, d.y - c.y * z)} scale(${r(z, 4)})`},
            g({transform: T(L.ox, L.oy, 0, L.k)}, L.lzArt.node, h('circle', {cx: r(L.G.lobbySpot.x), cy: r(L.G.lobbySpot.y), r: 18, fill: th.paper, stroke: th.ink, 'stroke-width': 4}), L.lzTrails.map(t => t.node), L.lzAfter && L.lzAfter.node),
            tagNode('lz', false))),
        h('rect', {name: 'lz-border', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const F = L.F;
    const {st, offT, dest, z} = L.lens;
    // build: every route line draws from its start to its seat; everyone is seated
    const drawP = ease.inOutSine(seg(u, ...W.trails));
    const retract = L.moves ? ease.inOutSine(seg(u, ...W.retract)) : 0;
    const redraw = L.moves ? ease.inOutSine(seg(u, ...W.redraw)) : 0;
    L.labels.forEach((sl, i) => { nodes[`lab${i}`] = {opacity: 1}; nodes[`lab${i}-text`] = {opacity: 1}; });
    L.walkers.forEach((w, i) => {
      Object.assign(nodes, L.people[i].pose({x: w.seat.x, y: w.seat.y, deg: w.seat.deg, phase: 0, walk: 0, seated: 1}));
      const tr = i === L.fi && L.moves ? L.trails[i].frameTail(retract, 1) : L.trails[i].frame(drawP, 1);
      const lz = i === L.fi && L.moves ? L.lzTrails[i].frameTail(retract, 1) : L.lzTrails[i].frame(drawP, 1);
      if (i === L.fi && L.moves && retract <= 0) {
        Object.assign(nodes, L.trails[i].frame(drawP, 1), L.lzTrails[i].frame(drawP, 1));
      } else {
        Object.assign(nodes, tr, lz);
      }
    });
    if (L.trailAfter) Object.assign(nodes, L.trailAfter.frame(redraw, 1), L.lzAfter.frame(redraw, 1));
    Object.assign(nodes, L.art.doors.public.frame(0), L.art.doors.restricted.frame(0), L.lzArt.doors.public.frame(0), L.lzArt.doors.restricted.frame(0));
    // shrink and grow the context; the lens opens in the freed space
    const sh = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const sc = lerp(1, st, sh);
    const off = {x: lerp(0, offT.x, sh), y: lerp(0, offT.y, sh)};
    nodes.world = {transform: `${T(off.x, off.y)} scale(${r(sc, 4)})`};
    // the plan's texts stay while >= 16 px; when the shrunk plan would carry them below 16 px they leave during the
    // shrink and come back only once the plan is full size again
    const textOk = L.F * L.px * sc >= 16 - 1e-6;
    const hiddenDuring = L.F * L.px * st < 16 - 1e-6;
    const textOp = !hiddenDuring ? 1 : u < W.grow[0] ? (textOk ? 1 : 0) : seg(u, ...W.textIn);
    nodes['world-text'] = {opacity: r(textOp, 3)};
    const open = ease.inOutCubic(seg(u, ...W.open)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const fr = seg(u, ...W.frame) * (1 - seg(u, W.close[1], W.close[1] + 0.03));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    // the scene tag stays >= 16 px (counter-scaled about its top-left while the plan is small) and hides while
    // the lens, which holds its enlarged copy, is open
    const strike = seg(u, ...W.strike), dock = seg(u, ...W.dock), newIn = seg(u, ...W.newIn);
    const tagFrame = (pre, op) => {
      const out = {};
      if (!L.showKey) return out;
      out[`${pre}-tagwrap`] = {opacity: r(op, 3)};
      L.fB.lines.forEach((ln, i) => {
        const lw = ctx.measure(ln, L.fB.size, L.fB.weight, L.fB.family) + 6;
        const x1 = L.tag.x + L.tag.w / 2 - lw / 2;
        out[`${pre}-st${i}`] = {x1: r(x1), x2: r(x1 + lw * strike)};
      });
      out[`${pre}-old`] = {opacity: r(1 - dock, 3), transform: T(0, -F * 0.5 * dock)};
      out[`${pre}-was`] = {opacity: r(dock, 3)};
      out[`${pre}-new`] = {opacity: r(newIn, 3)};
      return out;
    };
    // the outlined tag stays in the source (the lens shows its enlarged copy elsewhere); when the plan shrinks below the
    // text floor the tag alone keeps 16 px by a counter-scale about its top-left, and the source frame grows around it
    Object.assign(nodes, tagFrame('cx', 1));
    const cs = L.lens.counter ? Math.max(1, 16.5 / (L.F * L.px * sc)) : 1;
    if (L.showKey) nodes['cx-tagwrap'].transform = scaleAbout(L.tag.x, L.tag.y, r(cs, 4));
    let srcRect;
    {
      const c0 = L.crop;
      const tb = {x1: L.tag.x + (Math.max(L.tag.w, L.was.w)) * cs, y1: L.tag.y + (L.was.y + L.was.h - L.tag.y) * cs};
      const fx1 = Math.max(c0.x + c0.w, L.showKey ? tb.x1 + 14 : 0), fy1 = Math.max(c0.y + c0.h, L.showKey ? tb.y1 + 14 : 0);
      srcRect = {x: c0.x, y: c0.y, w: fx1 - c0.x, h: fy1 - c0.y};
      nodes['src-frame'] = {...(nodes['src-frame'] || {}), x: r(c0.x), y: r(c0.y), width: r(srcRect.w), height: r(srcRect.h)};
    }
    const ls = 0.6 + 0.4 * open;
    const lensTextOk = L.F * L.px * z * ls >= 16 - 1e-6 ? 1 : 0;
    Object.assign(nodes, tagFrame('lz', lensTextOk));
    const lc = {x: dest.x + dest.w / 2, y: dest.y + dest.h / 2};
    nodes.lz = {opacity: r(open, 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    // guides: from the (shrinking) frame corners facing the lens to the lens corners
    const wt = q => ({x: off.x + q.x * sc, y: off.y + q.y * sc});
    const c = srcRect;
    const from = L.placement === 'right' ? [{x: c.x + c.w, y: c.y}, {x: c.x + c.w, y: c.y + c.h}] : [{x: c.x, y: c.y + c.h}, {x: c.x + c.w, y: c.y + c.h}];
    const to = L.placement === 'right' ? [{x: dest.x, y: dest.y}, {x: dest.x, y: dest.y + dest.h}] : [{x: dest.x, y: dest.y}, {x: dest.x + dest.w, y: dest.y}];
    const gTo = to.map(q => ({x: lc.x + (q.x - lc.x) * ls, y: lc.y + (q.y - lc.y) * ls}));
    // a guide is drawn only when it crosses no seat label and no person of the (shrunk) plan
    const obst = [...L.labels.map(sl => sl.box), ...L.walkers.map(w => { const c0 = L.toD(w.seat); const rr = PERSON_RAD * L.k; return {x: c0.x - rr, y: c0.y - rr, w: 2 * rr, h: 2 * rr}; })].map(b => ({x: off.x + b.x * sc, y: off.y + b.y * sc, w: b.w * sc, h: b.h * sc}));
    // nor cuts across the (shrunk) plan outside the source frame
    const inside = (o, q, m) => q.x > o.x - m && q.x < o.x + o.w + m && q.y > o.y - m && q.y < o.y + o.h + m;
    const planS = {x: off.x + L.planRect.x * sc, y: off.y + L.planRect.y * sc, w: L.planRect.w * sc, h: L.planRect.h * sc};
    const sr = {x: off.x + srcRect.x * sc, y: off.y + srcRect.y * sc, w: srcRect.w * sc, h: srcRect.h * sc};
    const clearLine = (a, b) => { for (let j = 1; j < 40; j++) { const q = {x: a.x + (b.x - a.x) * j / 40, y: a.y + (b.y - a.y) * j / 40}; if (obst.some(o => q.x > o.x - 4 && q.x < o.x + o.w + 4 && q.y > o.y - 4 && q.y < o.y + o.h + 4)) return false; if (inside(planS, q, -Math.max(6, 0.06 * planS.h)) && !inside(sr, q, 2)) return false; } return true; };
    from.forEach((q, i) => { const a = wt(q); const on = open > 0.05 && clearLine(a, gTo[i]) ? 1 : 0; nodes[`guide${i}`] = {x1: r(a.x), y1: r(a.y), x2: r(gTo[i].x), y2: r(gTo[i].y), opacity: r(Math.min(fr, on), 3)}; });
    // the panel steps aside while the lens (on its side) is open
    const pOp = !L.panelOverLens ? 1 : u < 0.5 ? 1 - seg(u, W.frame[0], W.open[0] - 0.002) : seg(u, W.close[1] + 0.002, W.close[1] + 0.03);
    nodes.panel = {opacity: r(pOp, 3)};
    const markerP = seg(u, ...W.marker);
    if (L.showKey) nodes['cx-marker'] = {opacity: r(markerP, 3)};
    if (L.panel.some(q => q.name === 'marker-note')) nodes['marker-note'] = {opacity: r(markerP, 3)};
    const datum = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    // people (seated) in root design units, for the lens-clearance checks
    const pr = PERSON_RAD * L.k * sc;
    const people = L.walkers.map(w => wt(L.toD(w.seat)));
    const lensRect = {x: lc.x - dest.w * ls / 2, y: lc.y - dest.h * ls / 2, w: dest.w * ls, h: dest.h * ls};
    const ov = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    const scene0 = L.sceneBox;
    const sceneNow = {x: off.x + scene0.x * sc, y: off.y + scene0.y * sc, w: scene0.w * sc, h: scene0.h * sc};
    const cropNow = {x: off.x + c.x * sc, y: off.y + c.y * sc, w: c.w * sc, h: c.h * sc};
    const planNow = {x: off.x + L.planRect.x * sc, w: L.planRect.w * sc};
    const focusDrawn = !L.moves ? 'before' : retract <= 0 ? 'before' : redraw >= 1 ? 'after' : 'changing';
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(open, 3),
        contextScale: r(sc, 3),
        textOnPlan: r(textOp, 3),
        datum,
        strike: r(strike, 3),
        oldDocked: r(dock, 3),
        newShown: r(newIn, 3),
        focusTarget: L.focusTarget,
        moves: L.moves,
        focusRoute: focusDrawn === 'after' ? L.afterAccess : focusDrawn === 'before' ? L.beforeAccess : 'changing',
        beforeAccess: L.beforeAccess,
        afterAccess: L.afterAccess,
        retract: r(retract, 3),
        redraw: r(redraw, 3),
        seatsFixed: L.walkers.map(w => R2(w.seat)),
        zoom: r(z / st, 2),
        lensShort: r(Math.min(dest.w, dest.h) * L.px / 1080, 3),
        contextShare: r(planNow.w / ctx.design.w, 3),
        stackInCrop: !L.showKey || (L.tag.x >= c.x && L.tag.y >= c.y && L.tag.x + L.tag.w <= c.x + c.w && L.was.y + L.was.h <= c.y + c.h),
        lensClearOfPeople: open === 0 || people.every(q => !ov(lensRect, {x: q.x - pr, y: q.y - pr, w: 2 * pr, h: 2 * pr})),
        lensClearOfScene: open === 0 || !ov(lensRect, sceneNow),
        lensClearOfSource: !ov(dest, {x: offT.x + c.x * st, y: offT.y + c.y * st, w: c.w * st, h: c.h * st}),
        cropNow: {x: r(cropNow.x), y: r(cropNow.y)},
        markerShown: r(markerP, 3),
        problems: L.problems,
        allReached: true,
        textPx: r(L.F * L.px, 1),
        personPx: r(PERSON_RAD * 2 * L.k * L.px, 1),
        personPxShrunk: r(PERSON_RAD * 2 * L.k * L.px * st, 1),
        focusSeat: R2(L.toD(L.walkers[L.fi].seat)),
        placement: L.placement,
        log: L.log,
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
    slug: 'courts-05-inspect',
    title: 'Room access — inspecting one participant’s supplied route and substituting it',
    titleEs: 'Acceso a sala — Inspección y cambio de un dato',
    category: 'courts',
    categoryName: 'Órganos y espacios judiciales',
    motif: 'Acceso a sala',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The plan of a generic room after everyone has entered by two separate supplied routes (● public access, ◆ restricted access as configured). The plan shrinks to its side while a lens enlarges a real copy of the entrance hall where the routes part and the tag of one participant; the supplied route value is struck, docked as "was: …" and replaced, and only that participant’s route line re-routes through the other corridor and door to the same seat. The plan grows back with a neutral Δ marker. No rule, attendance right or outcome is inferred.',
    tags: ['inspect', 'lens', 'substitution', 'room access', 'public access', 'restricted access as configured', 'route line', 'entrance hall', 'floor plan'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/acceso-a-sala.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/markers.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
