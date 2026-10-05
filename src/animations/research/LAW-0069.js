/**
 * LAW-0069 — Comprobación de jurisdicción · story
 *
 * Storyboard (front view of a library filing line; library = anchor, search
 * terminal + reading arch = the filter, research card = support):
 *  0.00–0.15 rest     The bookcase's top compartment holds the source
 *                     documents hanging from trolleys; each shows the seal of
 *                     the jurisdiction it DECLARES. The researcher holds the
 *                     research card (relevant jurisdiction marked by the
 *                     author). The reader window is dark; the switch rests on
 *                     the upper branch. Rack plates show "= key" / "≠ key".
 *  0.10–0.25          The researcher lifts the card from her side and carries
 *                     it to the right at chest height (in front of the
 *                     table-height terminal, its top always below her chin),
 *                     over the slot and lowers it in (the card follows the
 *                     solved hand; its emblem row stays above the slot).
 *  0.26–0.34          Release; a pulse runs up the cable and keys the reader:
 *                     the card's emblem lights in the reader window.
 *  0.33–0.72 action   Documents leave the library one by one in library
 *                     order. Under the reader a beam reads each seal and the
 *                     comparison glyph shows "=" or "≠"; only AFTER the read
 *                     the switch blade turns (upper branch or the drop to the
 *                     lower rack). Documents come to rest in two racks.
 *  0.73–1.00 hold     Two racks: same jurisdiction as the card / other
 *                     jurisdiction; status tag + editorial callout.
 *  finalState 'pending': the card keys the filter but no document is run.
 * Wide boxes: upper rack = other jurisdiction, lower rack = relevant. Tall
 * boxes: a mezzanine (bookcase, researcher, terminal) above two stacked racks.
 * Legal content: fictional names, jurisdiction unspecified; the filter only
 * compares two supplied labels (declared on the document / marked on the
 * card) and decides nothing about which jurisdiction applies.
 * @module animations/research/LAW-0069
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix} from '../../core/geometry.js';
import {storyFields, str, party} from '../../schemas/fields.js';
import {chip} from '../../primitives/annotate.js';
import {personRig} from '../../primitives/person.js';
import {actorLook} from '../../primitives/people-style.js';
import {placeChipAny, placeChip, calloutChip, stateTag, leaderFrom} from '../causation/kits/place.js';
import {jurFields, JUR_DEFAULTS, JUR_STRINGS, resolveJur, rulePlate, plateSize, unionBox, jurColor, packInZones} from './kits/comprobacion-de-jurisdiccion.js';
import {linePlan, sortingLine} from './kits/comprobacion-de-jurisdiccion-line.js';

const ID = 'LAW-0069';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  labels: [0, 0.07], lift: [0.1, 0.155], over: [0.155, 0.2], lower: [0.2, 0.25], release: [0.25, 0.27], back: [0.27, 0.36],
  pulse: [0.26, 0.31], key: [0.3, 0.34], look: [0.3, 0.4], lookBack: [0.72, 0.8], tag: [0.74, 0.8], note: [0.8, 0.9],
};
const READS = [0.37, 0.6];
const LEAVE = 0.3;
const ARRIVE = 0.725;
const ACTION_END = 0.73;

const sceneSchema = {
  ...jurFields,
  researcher: party,
  ...storyFields({
    library: str('Label of the library bookcase', 60),
    filter: str('Label of the search terminal and reading arch (the filter)', 60),
    relevant: str('Label of the rack for documents that declare the jurisdiction marked on the card', 60),
    other: str('Label of the rack for documents that declare another jurisdiction', 60),
  }, ['library', 'filter', 'card', 'relevant', 'other'], ['separated', 'pending']),
};

const defaultParams = {
  ...JUR_DEFAULTS,
  researcher: {name: 'Lena Varga', role: 'Researcher'},
  actorLabels: {a: 'Researcher'},
  objectLabels: {library: 'Library', filter: 'Jurisdiction filter', relevant: 'Relevant jurisdiction', other: 'Other jurisdiction'},
  actionProgress: 1,
  annotations: [{target: 'filter', text: 'Compares the jurisdiction each document declares with the card'}],
  finalState: 'separated',
};

/** Chip for a label zone: `cx` centres it, `right` right-aligns it, otherwise it starts at x. */
function zoneChipOf(ctx, text, z, name, o = {}) {
  const opts = {maxWidth: z.w, size: 28, maxLines: o.maxLines ?? 2, name, stroke: o.stroke};
  const probe = chip(ctx, text, {...opts, x: 0, y: 0});
  const top = o.top !== undefined ? o.top(probe.box.h) : o.bottom !== undefined ? Math.max(4, o.bottom - probe.box.h) : z.y;
  if (z.right !== undefined) return chip(ctx, text, {...opts, x: z.right, y: top, anchor: 'end'});
  return z.cx !== undefined ? chip(ctx, text, {...opts, x: z.cx, y: top, anchor: 'middle'}) : chip(ctx, text, {...opts, x: z.x, y: top});
}

/**
 * Stage plan. In tall boxes the two racks are placed from the measured labels:
 * each rack label sits just above its own rail (below the researcher's name
 * for rack A, below rack A's documents for rack B).
 */
function planFor(ctx, M) {
  const D = ctx.design;
  const P0 = linePlan(ctx.view.shape, D);
  if (P0.shape !== 'portrait') return P0;
  const p = ctx.params;
  const show = ctx.show('key');
  const ps = plateSize(50);
  const Z = P0.zones;
  const who = [p.researcher.name, p.actorLabels.a || p.researcher.role].filter(Boolean).join(' · ');
  const actorH = show ? zoneChipOf(ctx, who, Z.actor, 'probe').box.h : 0;
  const rackH = which => {
    const z = Z[which];
    const text = which === 'A' ? p.objectLabels.relevant : p.objectLabels.other;
    const c = show ? zoneChipOf(ctx, text, {x: 0, y: 0, w: z.w - ps.w - 16}, 'probe') : null;
    return Math.max(ps.h, c ? c.box.h : 0);
  };
  const hang = P0.doc.hook + P0.doc.h;
  let rackA = Math.max(850, P0.F + 22 + actorH + 12 + rackH('A') + 14);
  let rackB = rackA + hang + 14 + rackH('B') + 14;
  const over = rackB + hang + 10 - (D.h - 6);
  if (over > 0) { rackA -= Math.min(over, rackA - 830); rackB = Math.min(rackB, D.h - 6 - hang - 10); }
  return linePlan(ctx.view.shape, D, {rackA, rackB});
}

/** Small boxes along a polyline (rails and routes: a chip may not sit on them). */
function pathBoxes(pts, step = 14, size = 12) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      out.push({x: a.x + (b.x - a.x) * t - size / 2, y: a.y + (b.y - a.y) * t - size / 2, w: size, h: size});
    }
  }
  const e = pts[pts.length - 1];
  out.push({x: e.x - size / 2, y: e.y - size / 2, w: size, h: size});
  return out;
}

/** Small boxes along a callout leader (later chips must not cover it). */
function leaderBoxes(box, end) {
  const a = leaderFrom(box, end);
  const L = Math.hypot(end.x - a.x, end.y - a.y);
  const n = Math.max(1, Math.ceil(L / 14));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push({x: a.x + (end.x - a.x) * t - 5, y: a.y + (end.y - a.y) * t - 5, w: 10, h: 10});
  }
  return out;
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const M = resolveJur(p);
    const P = planFor(ctx, M);
    const line = sortingLine(ctx, {plan: P, model: M, query: p.query, reads: READS, leave: LEAVE, arrive: ARRIVE});
    const G = line.geo;
    const k = P.k;
    const look = actorLook(ctx, p.researcher, 0);
    const rig = personRig(ctx, {name: 'res', look, pose: 'standing'});
    const ax = P.researcher.x;
    // the card never passes in front of the researcher's face: it rests at her side (below
    // the terminal head), is carried up and to the right with its top below the chin until
    // its left edge is well clear of the face, in front of the terminal; the terminal is
    // table-height, so the card is raised over the slot and lowered into it at chest height
    const faceRight = ax + 44 * k; // nose tip of the standing rig (facing right)
    const chinY = P.F - 330 * k;
    const over = {x: G.kx, y: G.slotY - G.CH - 12};
    const hands = {
      hold: {x: ax + 30 * k, y: P.F - 150 * k},
      rest: {x: ax + 22 * k, y: P.F - 156 * k},
      side: {x: Math.min(G.kx, Math.max(ax + 38 * k, faceRight + 16 + G.CW / 2)), y: Math.max(chinY + 8, over.y)},
      over,
      in: {x: G.kx, y: G.slotY - G.cardVisible},
    };
    hands.lift = {x: hands.in.x - 18, y: hands.in.y - 34};
    const researcherBox = {x: ax - 44 * k, y: P.F - 420 * k, w: 100 * k, h: 420 * k};

    // --- labels (key): library, filter, researcher, the two racks
    const Z = P.zones;
    const size = 28;
    const show = ctx.show('key');
    /** chip in a zone: `cx` centres it, otherwise it starts at x; `bottom` hangs it above a y */
    const zoneChip = (text, z, name, o = {}) => zoneChipOf(ctx, text, z, name, o);
    const G0 = line.geo;
    const libChip = show ? zoneChip(p.objectLabels.library, Z.library, 'lab-library', {bottom: P.book.y - 10}) : null;
    // the filter label sits above the reader, or beside it (vertically centred on it) in wide boxes
    const readerMid = G0.readerY + 28;
    const filChip = show ? zoneChip(p.objectLabels.filter, Z.filter, 'lab-filter', Z.filter.beside
      ? {top: hh => Math.max(4, Math.min(P.railY - 14 - hh, readerMid - hh / 2))}
      : {bottom: Z.filter.cx !== undefined ? G0.readerY - 8 : undefined}) : null;
    const who = [p.researcher.name, p.actorLabels.a || p.researcher.role].filter(Boolean).join(' · ');
    const actorChip = show ? zoneChip(who, Z.actor, 'lab-actor') : null;
    // rack plates (text-free: "=" / "≠" next to the card's emblem) + rack labels
    const ps = plateSize(50);
    const rack = which => {
      const z = Z[which];
      const same = which === 'A';
      const text = same ? p.objectLabels.relevant : p.objectLabels.other;
      const cz = {x: z.x + ps.w + 16, w: z.w - ps.w - 16, y: z.y};
      const chipOpts = {bottom: z.above ? z.y : undefined, stroke: same ? jurColor(ctx, M.relevant.key).c : th.inkSoft};
      let c = show ? zoneChip(text, cz, `lab-${which}`, chipOpts) : null;
      // right-aligned racks: plate + label end over the rail's end stop, where the documents gather
      let dx = 0;
      if (z.alignRight) {
        dx = Math.max(0, c ? z.x + z.w - (c.box.x + c.box.w) : z.w - ps.w);
        if (c && dx > 0) c = zoneChip(text, {...cz, x: cz.x + dx}, `lab-${which}`, chipOpts);
      }
      const hh = Math.max(ps.h, c ? c.box.h : 0);
      const top = z.above ? z.y - hh : z.y;
      const plate = rulePlate(ctx, {name: `plate-${which}`, same, key: M.relevant.key, s: 50, x: z.x + dx + ps.w / 2, y: top + (hh - ps.h) / 2, strap: false});
      const box = unionBox([{x: z.x + dx, y: top, w: ps.w, h: hh}, c && c.box]);
      return {plate, chip: c, box};
    };
    const rackA = rack('A'), rackB = rack('B');

    // --- final geometry for the hold (obstacles for status tag and notes)
    const fin = line.pose(1, {run: p.finalState !== 'pending', keyed: 1}).semantic;
    const docBoxes = fin.boxes;
    const cardBox = {x: G.kx - G.CW / 2, y: hands.in.y, w: G.CW, h: G.CH};
    const archBox = {x: G.archX - 8, y: G.readerY - 4, w: G.archW + 16, h: G.archBot - G.readerY + 8};
    const bookBox = {x: P.book.x - 8, y: P.book.y - 6, w: P.book.w + 16, h: P.book.h + 22};
    const kioskBox = line.parts.kiosk.box;
    const labels = [libChip, filChip, actorChip].filter(Boolean).map(c => c.box).concat([rackA.box, rackB.box]);
    const switchBox = {x: G.pivot.x - 30, y: G.pivot.y - 50, w: 110, h: 110};
    // chips never sit on documents, actors, props or other labels; the rails and the
    // switch path are soft obstacles (a chip may not cover them, a leader may cross them)
    const fixed = [bookBox, archBox, kioskBox, researcherBox, cardBox, switchBox, ...docBoxes, ...labels];
    // the terminal's cable is soft too (a note never sits on it)
    const cablePts = Array.from({length: 33}, (_, i) => line.cablePoint(i / 32));
    const railBoxes = [...pathBoxes(G.routeA.pts), ...pathBoxes(G.routeB.pts), ...pathBoxes(cablePts)];
    // square boxes: a note about the filter may also hang just below the arch, left of the
    // drop rail and above the researcher (its leader then never crosses a rail)
    const noteZones = P.shape === 'square'
      ? [...Z.notes, {x: P.book.x + P.book.w + 16, y: G.archBot + 16, w: G.pivot.x - 28 - (P.book.x + P.book.w + 16), h: (P.F - 410 * k - 16) - (G.archBot + 16)}]
      : Z.notes;
    const bounds = {x: 12, y: 8, w: D.w - 24, h: D.h - 16};
    const placed = [];
    const fz = Z.free;
    // editorial callouts (final hold), packed into the plan's free zones
    const relBoxes = docBoxes.filter((b, i) => M.docs[i].relevant);
    const othBoxes = docBoxes.filter((b, i) => !M.docs[i].relevant);
    // a rack is pointed at on the document nearest the switch: its bottom or either side
    const sidesOf = list => {
      if (!list.length) return null;
      const b = list[list.length - 1];
      return [{x: b.x + b.w * 0.5, y: b.y + b.h}, {x: b.x - 2, y: b.y + b.h * 0.5}, {x: b.x + b.w + 2, y: b.y + b.h * 0.5}];
    };
    const libPt = {x: P.book.x + P.book.w * 0.5, y: P.book.y + P.book.h * 0.35};
    const pending = p.finalState === 'pending';
    const archBelow = {x: G.gx, y: G.archBot + 2}, archSide = {x: G.archX + G.archW + 2, y: (G.archTop + G.archBot) / 2};
    const targetSets = {
      library: [libPt],
      filter: Z.note === 'below' ? [archBelow, archSide] : [archSide, archBelow],
      card: [{x: G.kx + G.CW / 2 + 2, y: hands.in.y + 10}],
      relevant: pending ? [libPt] : sidesOf(relBoxes) || [archBelow],
      other: pending ? [libPt] : sidesOf(othBoxes) || [archBelow],
    };
    const targets = Object.fromEntries(Object.entries(targetSets).map(([key, list]) => [key, list[0]]));
    const own = {library: [bookBox], filter: [archBox], card: [cardBox, kioskBox], relevant: relBoxes, other: othBoxes};
    let leads = [];
    const placedBase = placed.slice();
    // every placing order is tried (at most a few notes); the one with the shortest leaders wins
    const perms = list => (list.length <= 1 ? [list] : list.flatMap((x, i) => perms([...list.slice(0, i), ...list.slice(i + 1)]).map(rest => [x, ...rest])));
    const idx = p.annotations.map((a, i) => i);
    let bestRun = null;
    if (ctx.show('all')) {
      for (const order of perms(idx).slice(0, 24)) {
        placed.length = 0; placed.push(...placedBase); leads = [];
        const byIdx = [];
        let cost = 0;
        order.forEach(i => { const n = placeNote(p.annotations[i], i); byIdx[i] = n; cost += n.cost; });
        if (!bestRun || cost < bestRun.cost - 0.5) bestRun = {cost, byIdx, placed: placed.slice(), leads: leads.slice()};
      }
    }
    placed.length = 0;
    placed.push(...(bestRun ? bestRun.placed : placedBase));
    leads = bestRun ? bestRun.leads : [];
    const notes = bestRun ? bestRun.byIdx.filter(Boolean) : [];
    function placeNote(a, i) {
      const tg = targets[a.target];
      const mw = Math.min(520, D.w * 0.46);
      const fits = [[mw, 2], [mw * 0.75, 3], [mw * 0.6, 4], [mw * 0.5, 5], [mw * 0.45, 5], [mw * 0.42, 6]]
        .map(([wd, ml]) => {
          const c = chip(ctx, a.text, {x: 0, y: 0, maxWidth: wd, size: 26, maxLines: ml});
          return {wd, ml, box: c.box, cut: c.fit.truncated};
        }).filter((f, idx, all) => !f.cut || idx === all.length - 1);
      const obst = [...fixed, ...placed, ...leads];
      // the note stays close to its target: a short leader counts more than a wider chip
      let res = null;
      for (const cand of targetSets[a.target]) {
        const got = packInZones(fits.map(f => ({w: f.box.w, h: f.box.h})), cand, noteZones, obst, {own: own[a.target], soft: railBoxes, softPad: 8, sizePenalty: 45, softCross: P.shape === 'square' ? 220 : 0});
        if (got && (!res || got.cost < res.cost)) res = got;
      }
      let at;
      if (res) at = {x: res.box.x + res.box.w / 2, y: res.box.y, end: res.end, k: res.k, cost: res.cost};
      else {
        const po = {obstacles: [...obst, ...railBoxes], bounds, own: own[a.target], order: Z.note === 'below' ? ['below', 'belowR', 'belowL', 'right', 'left'] : ['right', 'rightLow', 'rightHigh', 'below', 'above', 'left']};
        const pr = placeChipAny(fits.map(f => f.box), tg, po) || {...placeChip(fits[fits.length - 1].box, tg, {...po, leastBad: true}), k: fits.length - 1};
        at = {x: pr.x, y: pr.y, end: pr.end, k: pr.k, cost: 5000};
      }
      const f = fits[at.k];
      const c = calloutChip(ctx, {name: `note${i}`, text: a.text, chipAt: {x: at.x, y: at.y}, target: at.end, maxWidth: f.wd, maxLines: f.ml, size: 26});
      placed.push(c.box);
      leads.push(...leaderBoxes(c.box, at.end));
      return {...c, cost: at.cost};
    }
    // status tag after the notes (it needs no leader): the free zone, else any note zone left
    let tag = null;
    if (show) {
      const fz = Z.free;
      const text = p.finalState === 'pending' ? ctx.t.pendingRun : ctx.t.separated;
      const color = p.finalState === 'pending' ? th.inkSoft : jurColor(ctx, M.relevant.key).c;
      // tall boxes: beside the racks first (the tag describes them), else at the foot of the
      // free column, level with the racks
      const portrait = P.shape === 'portrait';
      const zones = portrait ? [Z.notes[1], Z.notes[2], Z.notes[3], fz] : [fz, ...Z.notes];
      const one = ctx.fit(text, {maxWidth: fz.w - 28 * 2.4, size: 28, maxLines: 1, weight: 700});
      const opts = [];
      if (!one.truncated) opts.push({kind: 'tag', mw: fz.w, box: stateTag(ctx, text, {x: 0, y: 0, size: 28, maxWidth: fz.w}).box});
      for (const mw of [fz.w, ...Z.notes.map(z => z.w)]) {
        const c = chip(ctx, text, {x: 0, y: 0, maxWidth: mw, size: 28, maxLines: 3});
        if (!c.fit.truncated) opts.push({kind: 'chip', mw, box: c.box});
      }
      const res = packInZones(opts.map(o => ({w: o.box.w, h: o.box.h})), null, zones, [...fixed, ...placed, ...leads], {pad: 8, align: portrait ? 'bottom' : 'top', soft: railBoxes, softPad: 10, zonePenalty: portrait ? 400 : 0});
      const pick = res ? opts[res.k] : opts[0] || {kind: 'chip', mw: fz.w};
      const pos = res ? {x: res.box.x + res.box.w / 2, y: res.box.y} : {x: fz.x + fz.w / 2, y: fz.y};
      tag = pick.kind === 'chip'
        ? chip(ctx, text, {x: pos.x, y: pos.y, anchor: 'middle', maxWidth: pick.mw, size: 28, maxLines: 3, name: 'state-tag', stroke: color, color})
        : stateTag(ctx, text, {x: pos.x, y: pos.y, anchor: 'middle', size: 28, maxWidth: fz.w, name: 'state-tag', color, opacity: 0});
      placed.push(tag.box);
    }
    return {M, P, line, rig, hands, ax, k, libChip, filChip, actorChip, rackA, rackB, tag, notes};
  },
  build(ctx, L) {
    const S = L.line.parts;
    return g(null,
      S.floor,
      S.book,
      S.rails,
      S.archBack,
      S.cable,
      S.docs.map(d => d.node),
      S.beam,
      S.archFront,
      S.readerRing, S.readerKey, S.glyphSame, S.glyphDiff,
      S.motor, S.blade, S.bolt,
      L.rig.node,
      S.kiosk.back,
      S.card.node,
      S.kiosk.front,
      S.cardFront.node,
      S.pulse,
      L.rackA.plate, L.rackB.plate,
      L.libChip && L.libChip.node, L.filChip && L.filChip.node, L.actorChip && L.actorChip.node,
      L.rackA.chip && L.rackA.chip.node, L.rackB.chip && L.rackB.chip.node,
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const Hd = L.hands;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const s = w => seg(a, ...W[w]);
    const run = p.finalState !== 'pending';

    // --- hand + card: carry to the right below the chin, rise above the slot, lower into
    // it, release, return
    const lift = ease.inOutCubic(s('lift'));
    const over = ease.inOutCubic(s('over'));
    const lower = ease.inOutCubic(s('lower'));
    const back = ease.inOutCubic(s('back'));
    let hand;
    if (a < W.over[0]) hand = mix(Hd.hold, Hd.side, lift);
    else if (a < W.lower[0]) hand = mix(Hd.side, Hd.over, over);
    else if (a < W.back[0]) hand = mix(Hd.over, Hd.in, lower);
    else hand = back < 0.4 ? mix(Hd.in, Hd.lift, back / 0.4) : mix(Hd.lift, Hd.rest, (back - 0.4) / 0.6);
    const released = a >= W.release[0];
    const look = ease.inOutCubic(s('look')) * (1 - ease.inOutCubic(seg(u, ...W.lookBack)));
    const headTilt = -10 * look * (run ? 1 : 0.4);
    const posed = L.rig.frame({x: L.ax, y: L.P.F, facing: 1, scale: L.k, near: back >= 1 ? null : hand, far: null, headTilt});
    const nodes = {...posed.nodes};
    const handW = posed.hands.near;
    const G = L.line.geo;
    const cardPos = released ? {x: Hd.in.x - G.CW / 2, y: Hd.in.y} : {x: handW.x - G.CW / 2, y: handW.y};
    // in front of the terminal while it is carried; behind the terminal head (into the slot)
    // from the moment it is lowered — at the swap it is fully above the slot
    const inFront = a < W.lower[0];
    nodes.card = {transform: T(cardPos.x, cardPos.y), opacity: inFront ? 0 : 1};
    nodes.cardF = {transform: T(cardPos.x, cardPos.y), opacity: inFront ? 1 : 0};

    // the card never covers the face: its box stays off the head circle (plus the nose)
    const head = posed.head;
    const hr = 36 * L.k;
    const cardClear = !(cardPos.x < head.x + hr + 6 * L.k && cardPos.x + G.CW > head.x - hr && cardPos.y < head.y + hr && cardPos.y + G.CH > head.y - hr);
    // clearance between the card and the face: below the chin, or right of the nose tip
    const faceGap = Math.max(cardPos.y - (head.y + hr), cardPos.x - (head.x + hr + 6 * L.k));

    // --- cable pulse keys the reader
    const pp = s('pulse');
    const pulsePt = L.line.cablePoint(pp);
    nodes.pulse = {transform: T(pulsePt.x, pulsePt.y), opacity: pp > 0 && pp < 1 ? 1 : 0};
    const keyed = ease.outCubic(s('key'));

    // --- documents, reader, switch
    const posedLine = L.line.pose(a, {run, keyed});
    Object.assign(nodes, posedLine.nodes);

    // --- labels
    const lab = r(seg(u, ...W.labels), 3);
    const labNames = [L.libChip && 'lab-library', L.filChip && 'lab-filter', L.actorChip && 'lab-actor', L.rackA.chip && 'lab-A', L.rackB.chip && 'lab-B'].filter(Boolean);
    for (const nm of labNames) nodes[nm] = {opacity: lab};
    const done = p.actionProgress >= 1;
    if (L.tag) nodes['state-tag'] = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    L.notes.forEach(nn => Object.assign(nodes, nn.frame(done ? seg(u, ...W.note) : 0)));

    // --- semantics
    const S = posedLine.semantic;
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const placedA = S.docs.filter(d => d.state === 'A').map(d => d.id);
    const placedB = S.docs.filter(d => d.state === 'B').map(d => d.id);
    const semantic = {
      beat: u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold',
      finalState: p.finalState,
      hand: P2(handW),
      cardGrip: P2({x: cardPos.x + G.CW / 2, y: cardPos.y}),
      slotGrip: P2(Hd.in),
      card: P2({x: cardPos.x + G.CW / 2, y: cardPos.y + G.CH / 2}),
      cardHolder: released ? 'slot' : 'hand',
      cardInserted: released,
      cardInFront: inFront,
      cardClearOfFace: cardClear,
      faceGap: r(faceGap, 1),
      keyed: r(keyed, 3),
      pulse: P2(pulsePt),
      bladeAngle: S.bladeAngle,
      reading: S.reading,
      docs: S.docs,
      placedA, placedB,
      expectedA: L.M.docs.filter(d => d.relevant).map(d => d.id),
      expectedB: L.M.docs.filter(d => !d.relevant).map(d => d.id),
      switchOk: L.line.switchOk,
      readBeforeFlip: L.line.readBeforeFlip,
      departAfterSet: L.line.departAfterSet,
      firstDeparture: L.line.trips.length ? r(Math.min(...L.line.trips.map(t => t.start)), 3) : null,
      lastArrival: L.line.trips.length ? r(Math.max(...L.line.trips.map(t => t.end)), 3) : null,
      allReached: posed.reached,
      reach: {near: posed.reached},
      actionCapped: p.actionProgress < 1 && u > capU,
      readerGap: r(L.line.gap, 1),
      minSheetGap: L.line.minSheetGap === null ? null : r(L.line.minSheetGap, 1),
    };
    L.M.docs.forEach((d, i) => { semantic[`doc${i}`] = S[`doc${i}`]; });
    return {nodes, semantic};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-08-story',
    title: 'Jurisdiction check — library filing-line microscene',
    titleEs: 'Comprobación de jurisdicción — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Comprobación de jurisdicción',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A researcher lowers the research card into a search terminal; a pulse keys the reading arch. Source documents hanging on a rail leave the library bookcase one by one; the reader compares the seal each document declares with the card and only then the switch sends it to the rack "same jurisdiction as the card" or "other jurisdiction". Fictional jurisdictions; nothing is decided about which jurisdiction applies.',
    tags: ['jurisdiction', 'filter', 'library', 'research card', 'ficha', 'search terminal', 'documents', 'sorting', 'switch', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/comprobacion-de-jurisdiccion.js', 'src/animations/research/kits/comprobacion-de-jurisdiccion-line.js', 'src/animations/causation/kits/place.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: JUR_STRINGS,
  scene,
});
