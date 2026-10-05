/**
 * LAW-0284 — Apertura de audiencia · inspect
 *
 * Storyboard (the context is the state produced by the opening: the generic
 * hearing room seen from above, the lamps on, every participant with their
 * name card and label, the wall control unit showing the supplied state):
 *  0.00–0.20  build: the room fills its area beside a text panel (room name,
 *             context caption, sequence caption, key). The control unit on the
 *             wall shows the supplied BEFORE value (● and a solid frame when it
 *             is the started state) with its switch under it.
 *  0.20–0.45  isolate: a frame settles on the control unit; the panel steps out
 *             and the context steps back (dimmed, in place); a lens opens in the
 *             freed space with a REAL enlarged copy of the same room coordinates
 *             (the unit, its wall and the free floor under it; everything else
 *             is wholly left out). The value text leaves the context as its
 *             enlarged copy arrives with the lens (one copy at a time).
 *  0.45–0.75  substitute ONE datum: the old value is struck through, then
 *             docks under the unit as "was …"; the supplied AFTER value comes
 *             into the display; only its dependent state follows: the frame
 *             becomes dashed (pending only), the switch lever moves to ◆, and
 *             the lamps go off in the dimmed context. The new value stays still
 *             in the lens.
 *  0.75–1.00  return: the lens copy fades, the lens closes, the context steps
 *             forward with the new value in the display, the struck old value
 *             docked under it (traceable) and a neutral changed-datum marker
 *             (Δ); the panel comes back with the marker note. Seeking back
 *             restores the old datum exactly.
 * Nothing about validity, a required step, a hierarchy or an outcome is
 * inferred: "pending" is only a waiting state of this configured example.
 * @module animations/hearings/LAW-0284
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {measure} from '../../core/text.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {
  aperturaFields, APERTURA_EN, APERTURA_ES, localised, resolveApertura, pxPerUnit, composeRoom, hearingRoom, cardAt,
  speakerChipNode, exhibitChipNode, rowNode, R2, searchLayout, fitG, overlaps, seatBox, displayFits,

} from './kits/apertura-audiencia.js';

const ID = 'LAW-0284';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.18, 0.205], panelOut: [0.185, 0.205], ctxOut: [0.205, 0.209], back: [0.209, 0.235], open: [0.212, 0.24],
  strike: [0.46, 0.5], move: [0.51, 0.55], chip: [0.53, 0.55], was: [0.54, 0.555], newIn: [0.555, 0.585], dash: [0.56, 0.59],
  switch: [0.6, 0.65], lamps: [0.64, 0.7], close: [0.728, 0.744], forward: [0.744, 0.758], ctxIn: [0.758, 0.761],
  frameOut: [0.735, 0.75], panelIn: [0.765, 0.79], marker: [0.8, 0.83],
};

const STRINGS = {
  en: {was: 'was'},
  es: {was: 'antes'},
};

// the session fields of the category are replaced here by the substituted datum (before → after)
const {session: _s, ...CAT} = aperturaFields;
const {session: _e, ...CAT_EN} = APERTURA_EN;
const {session: _x, ...CAT_ES} = APERTURA_ES;
const OWN_EN = {
  actorLabels: {participant: 'Participant (fictional)'},
  objectLabels: {lights: 'Room lights', card: 'Name card with the supplied label', clock: 'Wall clock'},
  beforeValue: 'Session started',
  afterValue: 'Session pending',
  contextLabels: {context: 'The room after the opening (as supplied)', marker: 'Changed: one supplied datum, the session state'},
};
const OWN_ES = {
  actorLabels: {participant: 'Participante (ficticio)'},
  objectLabels: {lights: 'Luces de la sala', card: 'Tarjeta con la etiqueta aportada', clock: 'Reloj de pared'},
  beforeValue: 'Sesión iniciada',
  afterValue: 'Sesión pendiente',
  contextLabels: {context: 'La sala tras la apertura (según lo aportado)', marker: 'Cambio: un dato aportado, el estado de la sesión'},
};
const EN = {...CAT_EN, ...OWN_EN};
const ES = {...CAT_ES, ...OWN_ES};

const sceneSchema = {
  ...CAT,
  actorLabels: obj('Caption of the person glyph in the legend', {participant: str('Caption for the people drawn from above', 50)}, ['participant']),
  objectLabels: obj('Captions of the room objects in the legend', {
    lights: str('Caption for the wall lamps', 60),
    card: str('Caption for the name cards', 60),
    clock: str('Caption for the wall clock', 60),
  }, ['lights', 'card', 'clock']),
  focusTarget: oneOf('Detail that is enlarged and substituted: the session state shown on the wall control unit (its switch and the room lamps follow it)', ['session-state']),
  beforeState: oneOf('Which supplied state the BEFORE value is (● started, solid frame; or ◆ pending, dashed frame); the AFTER value takes the other one', ['started', 'pending']),
  beforeValue: str('Value shown on the display before the substitution (as supplied)', 60),
  afterValue: str('Value shown on the display after the substitution (the alternative datum, as supplied)', 60),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens, relative to the context at rest (never below 1.5)', 1.5, 4),
    placement: oneOf('Alignment of the lens inside the space it opens in', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 60),
  }, ['context', 'marker']),
};

const defaultParams = {
  ...EN,
  focusTarget: 'session-state',
  beforeState: 'started',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    const before = P0.beforeState;
    const after = before === 'started' ? 'pending' : 'started';
    const P = {...P0, session: before === 'started' ? {started: P0.beforeValue, pending: P0.afterValue} : {started: P0.afterValue, pending: P0.beforeValue}};
    const R = resolveApertura(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showAll) rows.push({kind: 'text', text: P.contextLabels.context, name: 'ctx-caption'});
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'lamp', text: P.objectLabels.lights, name: 'lg-lights'});
      rows.push({kind: 'legend', glyphKind: 'card', text: P.objectLabels.card, name: 'lg-card'});
      rows.push({kind: 'legend', glyphKind: 'clock', text: P.objectLabels.clock, name: 'lg-clock'});
      rows.push({kind: 'legend', glyphKind: 'person', text: P.actorLabels.participant, name: 'lg-person'});
    }
    if (showKey) rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: '1', text: P.labels.sequence, name: 'lg-seq'});
    if (showKey) rows.push({kind: 'legend', glyphKind: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    // the dock under the unit (design units at size F): "was" + the old value
    const dockOf = F => {
      if (!showKey) return null;
      const padX = F * 0.5, padY = F * 0.3, gap = F * 0.35;
      const wasFit = fitG(ctx.t.was, {maxWidth: 400, size: F, minSize: F, maxLines: 1, weight: 500});
      return {padX, padY, gap, wasFit, wasW: wasFit.width, fs: F};
    };
    // the dock's design size at text size F (the old value as fitted on the display, in design units)
    const dockSizeD = F => {
      const d0 = dockOf(F);
      if (!d0) return null;
      const dd = displayFits(P, F, 1, {maxW: 520});
      const fb = dd[before];
      return {w: d0.padX * 2 + d0.wasW + d0.gap + dd.gS * 2.5 + fb.width, h: fb.height + d0.padY * 2};
    };
    const markerBox = G => ({x: G.unit.x + G.unit.w + 12, y: G.display.y + G.display.h / 2 - 34, w: 68, h: 68});
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    const minSide = 0.42 * shortD;
    const gap = 26;
    const zoomMax = P.detailGeometry.zoom;
    // ---- the lens for a composed room: where it opens, how far the context steps back, the crop and the zoom
    const lensPlan = (C, roomBox, F) => {
      const G = C.G, k = C.k;
      const d0 = dockOf(F);
      const fb = C.dt[before];
      const gS = C.dt.gS;
      let dock = null;
      if (d0) {
        const w = (d0.padX * 2 + d0.wasW + d0.gap) / k + gS * 2.5 + fb.width;
        const hh = fb.height + (d0.padY * 2) / k;
        const wasFitT = {...d0.wasFit, size: d0.wasFit.size / k, lineHeight: d0.wasFit.lineHeight / k, height: d0.wasFit.height / k, width: d0.wasFit.width / k};
        dock = {x: G.W / 2 - w / 2, y: G.unit.y + G.unit.h + 14, w, h: hh, padX: d0.padX / k, padY: d0.padY / k, gap: d0.gap / k, wasW: d0.wasFit.width / k, wasFit: wasFitT, fs: F / k};
      }
      // crop needed (template) = the unit, its wall and the dock
      const needW = Math.max(G.unit.w + 32, dock ? dock.w + 32 : 0);
      const needT = {x: G.W / 2 - needW / 2, y: -G.t, w: needW, h: (dock ? dock.y + dock.h : G.unit.y + G.unit.h) + 22 + G.t};
      const needD = {w: needT.w * k, h: needT.h * k};
      const plan = C.planRect;
      // the context steps back towards the side away from the free space (the panel's side)
      const wide = roomBox.w < D.w - 1 ? true : roomBox.h < D.h - 1 ? false : D.w >= D.h;
      const regionFor = sc => (wide
        ? {x: plan.x + plan.w * sc + gap, y: 0, w: D.w - (plan.x + plan.w * sc + gap), h: D.h}
        : {x: 0, y: plan.y + plan.h * sc + gap, w: D.w, h: D.h - (plan.y + plan.h * sc + gap)});
      const anchor = wide ? {x: plan.x, y: plan.y + plan.h / 2} : {x: plan.x + plan.w / 2, y: plan.y};
      const problems = [];
      const shareOf = sc => (wide ? (plan.w * sc * f.scale) / ctx.view.width : Math.max((plan.h * sc * f.scale) / ctx.view.height, (plan.w * sc * f.scale) / ctx.view.width));
      const sMin = Math.max(46 / (100 * k * px), 0.4);
      // how far down the crop may reach: it stops above the first seated person under the unit (nobody is cut)
      const topSeat = Math.min(G.H + G.t, ...G.seats.map(st => seatBox(st)).filter(b => b.x < needT.x + needT.w + 160 && b.x + b.w > needT.x - 160).map(b => b.y - 6));
      const hMax = Math.max(needT.h, topSeat - needT.y);
      let s = 1, region, zm, Z, dest;
      if (wide) {
        // step back as little as possible: first aim for a lens side of 0.42 of the frame's short side, else 0.40, else 0.37
        region = regionFor(1);
        let ok = false;
        for (const target of [minSide, 0.4 * shortD, 0.37 * shortD]) {
          for (let sc = 1; sc >= sMin - 1e-9; sc -= 0.02) {
            const rg = regionFor(sc);
            if (shareOf(sc) < 0.46) break;
            s = sc; region = rg;
            if (Math.min(zoomMax, rg.w / needD.w, rg.h / needD.h) >= 1.55 && Math.min(rg.w, rg.h) >= target) { ok = true; break; }
          }
          if (ok) break;
        }
        if (!ok) problems.push('lens-space');
        zm = Math.min(zoomMax, region.w / needD.w, region.h / needD.h);
        Z = k * zm;
        // the lens frames the needed crop with a margin (not a large empty floor), at least minSide on each side
        dest = {w: Math.min(region.w, Math.max(needT.w * Z * 1.3, minSide)), h: Math.min(region.h, hMax * Z, Math.max(needT.h * Z * 1.25, minSide))};
      } else {
        // stacked (tall): the lens takes the full width under the context; the zoom is set by the width, and the
        // context steps back just enough for the lens to reach down to the bottom of the frame (context + lens span it)
        const bottom = D.h;
        const availH = bottom - plan.y - gap - plan.h * sMin;
        zm = Math.min(zoomMax, (D.w * 0.96) / needD.w, availH / needD.h);
        Z = k * zm;
        const hLens = Math.min(hMax * Z, availH);
        s = clamp((bottom - plan.y - gap - hLens) / plan.h, sMin, 1);
        while (s < 1 && shareOf(s) < 0.46) s = Math.min(1, s + 0.01);
        region = regionFor(s);
        // the context may have kept more height (its share): the zoom then follows the region that is left
        zm = Math.min(zm, region.h / needD.h);
        Z = k * zm;
        dest = {w: region.w * 0.96, h: Math.min(region.h, hMax * Z)};
        if (zm < 1.55 || Math.min(dest.w, dest.h) < 0.37 * shortD) problems.push('lens-space');
      }
      const pl = P.detailGeometry.placement;
      const ax = pl === 'left' ? 0 : pl === 'right' ? 1 : 0.5;
      const ay = pl === 'top' ? 0 : pl === 'bottom' ? 1 : 0.5;
      // crop (template): the lens box at this zoom, around the needed crop, inside the room extents
      const crop = {w: dest.w / Z, h: dest.h / Z};
      crop.x = clamp(needT.x + needT.w / 2 - crop.w / 2, G.extents.x, G.extents.x + G.extents.w - crop.w);
      crop.y = clamp(needT.y, G.extents.y, G.extents.y + G.extents.h - crop.h);
      // labels on the floor are never cut by the crop's outline: the crop narrows (or stops above) to leave them out
      const toT = b => ({x: (b.x - C.ox) / k, y: (b.y - C.oy) / k, w: b.w / k, h: b.h / k});
      for (const cb of [...C.chips.filter(Boolean), ...C.exChips.filter(Boolean)].map(L => toT(L.box))) {
        if (!overlaps(cb, crop, 4)) continue;
        const cands = [];
        if (cb.x + cb.w <= needT.x) cands.push({x: cb.x + cb.w + 8, w: crop.x + crop.w - (cb.x + cb.w + 8)});
        if (cb.x >= needT.x + needT.w) cands.push({x: crop.x, w: cb.x - 8 - crop.x});
        if (cb.y >= needT.y + needT.h) cands.push({h: cb.y - 8 - crop.y});
        const best = cands.sort((p1, p2) => ((p2.w ?? crop.w) * (p2.h ?? crop.h)) - ((p1.w ?? crop.w) * (p1.h ?? crop.h)))[0];
        if (!best) { problems.push('lens-crop-label'); continue; }
        Object.assign(crop, best);
      }
      dest.w = crop.w * Z;
      dest.h = crop.h * Z;
      for (const st of G.seats) if (overlaps(seatBox(st), crop)) problems.push('lens-crop-person');
      // centred on the stepped-back context (wide) or placed right under it (tall), inside the region
      dest.x = region.x + (region.w - dest.w) * ax;
      dest.y = wide ? clamp(plan.y + plan.h / 2 - dest.h / 2, region.y, region.y + region.h - dest.h) : region.y + (region.h - dest.h) * (pl === 'bottom' ? 1 : 0);
      if (Math.min(dest.w, dest.h) < 0.37 * shortD - 0.5) problems.push('lens-small');
      if (zm < 1.5) problems.push('lens-zoom');
      return {dock, needT, wide, anchor, s, region, zm, Z, dest, crop, problems};
    };
    const search = sizes => searchLayout(ctx, P, R, rows, {
      sizes, minF: 16.4,
      compose: (box, F, scale) => {
        const ds = dockSizeD(F);
        const C = composeRoom(ctx, P, R, box, F, {scale, chips: showKey, exhibitChips: showKey, seqDisc: true, dispMaxFrac: 0.34,
          dockLikeDisplay: Boolean(ds),
          // the floor the lens will need (the unit, the dock under it: at most as tall as the display, as wide as the
          // display plus "was") and the marker's place stay free of labels
          reserve: (G, k) => {
            const d0 = dockOf(F);
            const dw = d0 ? Math.max(G.display.w + (d0.padX * 2 + d0.wasW + d0.gap) / k + 16, G.unit.w + 32) : G.unit.w + 32;
            const bottom = G.unit.y + G.unit.h + (d0 ? 14 + G.display.h : 0) + 24;
            return [{x: G.W / 2 - dw / 2, y: 0, w: dw, h: bottom}, markerBox(G)];
          }});
        const LP = lensPlan(C, box, F);
        C.problems.push(...LP.problems);
        C.lens = LP;
        return C;
      },
    });
    const best = search([22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4]);
    const {F, C, lay} = best;
    const G = C.G, k = C.k;
    const {dock, dest, crop, Z, zm, s, anchor, wide} = C.lens;
    const gS = C.dt.gS;
    const datum = {state: before, dock};
    const dispText = showKey ? {started: C.dt.started, pending: C.dt.pending} : null;
    const room = hearingRoom(ctx, G, {prefix: 'rm', R, dispText, glyphS: gS, datum});
    // marker (template → design): right of the unit, level with the display
    const markerT = {x: G.unit.x + G.unit.w + 12 + 34, y: G.display.y + G.display.h / 2};
    const problems = [...best.problems];
    const inCrop = b => b.x >= crop.x + 1 && b.y >= crop.y + 1 && b.x + b.w <= crop.x + crop.w - 1 && b.y + b.h <= crop.y + crop.h - 1;
    const lz = hearingRoom(ctx, G, {prefix: 'lz', R, dispText, glyphS: gS, datum, keep: inCrop});
    const cropD = C.bD(crop);
    const markerD = C.toD(markerT);
    // the lens window never passes over a seated person (head, body, chair) while it grows: it starts growing only once
    // the stepping-back context has cleared the window's full final rectangle (shadow and rim included); the context
    // copy's hand-over moves with it
    const lensBox = {x: dest.x - 4, y: dest.y - 4, w: dest.w + 14, h: dest.h + 18};
    const seatsD = G.seats.map(st => C.bD(seatBox(st)));
    const clearAt = u => {
      const sc = lerp(1, s, ease.inOutCubic(seg(u, ...W.back)));
      return seatsD.every(hb => !overlaps({x: anchor.x + (hb.x - anchor.x) * sc, y: anchor.y + (hb.y - anchor.y) * sc, w: hb.w * sc, h: hb.h * sc}, lensBox, 0));
    };
    let uClear = W.open[0];
    while (uClear <= W.back[1] && !clearAt(uClear)) uClear += 0.0002;
    if (!clearAt(uClear)) problems.push('lens-over-people');
    const shiftW = Math.max(0, uClear - W.open[0]);
    const openW = [W.open[0] + shiftW, Math.max(W.open[1], W.open[0] + shiftW + 0.02)];
    const ctxOutW = [W.ctxOut[0] + shiftW, W.ctxOut[1] + shiftW];
    return {P, R, F, px, C, G, k, room, lz, lay, dock, before, after, dest, crop, cropD, Z, zm, s, anchor, markerD, markerR: 20, problems, wide, showKey, minSide, shortD, openW, ctxOutW, shiftW};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const panel = L.lay ? L.lay.rows.map(m => rowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const ctxGroup = g({name: 'ctx', transform: 'translate(0 0) scale(1)'},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node),
      C.exChips.map((E, i) => exhibitChipNode(ctx, E, {name: `exchip${i}`})),
      C.chips.map((ch, i) => (ch ? speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`}) : null)),
      h('rect', {name: 'src-frame', x: r(L.cropD.x), y: r(L.cropD.y), width: r(L.cropD.w), height: r(L.cropD.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      changedMarker(ctx, {name: 'cx-marker', x: L.markerD.x, y: L.markerD.y, radius: L.markerR, opacity: 0}),
    );
    const d = L.dest;
    return g(null,
      ctxGroup,
      g({name: 'panel'}, panel),
      // the lens: an opaque window holding a real enlarged copy of the same room coordinates
      g({name: 'lens', opacity: 0, 'data-occludes': 1, transform: 'translate(0 0) scale(1)'},
        h('defs', null, h('clipPath', {id: ctx.id('lens-clip')}, h('rect', {x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18}))),
        h('rect', {name: 'lens-shadow', x: r(d.x + 6), y: r(d.y + 10), width: r(d.w), height: r(d.h), rx: 18, fill: th.shadow}),
        h('rect', {name: 'lens-bg', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: '#f5efe3'}),
        g({'clip-path': ctx.ref('lens-clip')},
          g({name: 'lens-content', transform: `${T(d.x - L.crop.x * L.Z, d.y - L.crop.y * L.Z)} scale(${r(L.Z, 5)})`}, L.lz.node)),
        h('rect', {name: 'lens-rim', x: r(d.x), y: r(d.y), width: r(d.w), height: r(d.h), rx: 18, fill: 'none', stroke: th.accent2, 'stroke-width': 5})),
    );
  },
  frame(ctx, L, u) {
    const {R, G, C} = L;
    const nodes = {};
    const open = ease.inOutCubic(seg(u, ...L.openW)) * (1 - ease.inOutCubic(seg(u, ...W.close)));
    const back = ease.inOutCubic(seg(u, ...W.back)) * (1 - ease.inOutCubic(seg(u, ...W.forward)));
    const sc = lerp(1, L.s, back);
    const a = L.anchor;
    nodes.ctx = {transform: `${T(a.x - a.x * sc, a.y - a.y * sc)} scale(${r(sc, 4)})`, opacity: r(1 - 0.42 * Math.min(1, open * 1.4), 3)};
    // the datum
    const startedBefore = L.before === 'started';
    const strike = seg(u, ...W.strike), move = ease.inOutCubic(seg(u, ...W.move)), chip = seg(u, ...W.chip), was = seg(u, ...W.was);
    const newIn = seg(u, ...W.newIn);
    const dash = seg(u, ...W.dash);
    const swP = ease.inOutCubic(seg(u, ...W.switch));
    const lampsP = seg(u, ...W.lamps);
    const started = startedBefore ? 1 - dash : dash;
    const switchK = startedBefore ? 1 - swP : swP;
    const lights = startedBefore ? 1 - lampsP : lampsP;
    const datum = {strike, move, chip, was};
    const text = {started: startedBefore ? 1 : newIn, pending: startedBefore ? newIn : 1};
    // one copy at a time: the context copy leaves as the lens copy arrives, and comes back after it has gone
    // the context copy also leaves before its text would shrink under the floor as the context steps back
    const fd = C.dt && C.dt.started ? C.dt.started.size * C.k * L.px : 0;
    // (held at 1 while the context is at rest; the floor is the preset's own: 19.5 px when the text renders at >= 19.5 px,
    // else the 16 px floor of the non-baseline presets)
    const ctxFloor = !fd || sc >= 0.9999 ? 1 : clamp((fd * sc - Math.min(fd >= 19.5 ? 19.5 : 16, fd - 0.01)) / 0.6);
    const ctxT = u < 0.5 ? Math.min(1 - seg(u, ...L.ctxOutW), ctxFloor) : seg(u, ...W.ctxIn);
    // the enlarged copy fades in as the lens grows (from 30 % open) and out as it shrinks
    const lensT = clamp((open - 0.3) / 0.3);
    const cards = G.seats.map((_, i) => cardAt(G, i, 1).card);
    const people = G.seats.map(() => ({seated: 1, reach: null}));
    const common = {lights, switchK, started, clockDeg: 20, cards, people, datum};
    const mul = (t, m) => ({started: t.started * m, pending: t.pending * m});
    Object.assign(nodes, L.room.frame({...common, text: mul(text, ctxT)}).nodes);
    Object.assign(nodes, L.lz.frame({...common, text: mul(text, lensT)}).nodes);
    // the dock and its "was" follow the same one-copy rule
    if (L.dock) {
      nodes['rm-dock'].opacity = r(chip * ctxT, 3);
      nodes['rm-was'].opacity = r(was * ctxT, 3);
      nodes['lz-dock'].opacity = r(chip * lensT, 3);
      nodes['lz-was'].opacity = r(was * lensT, 3);
    }
    // context labels scale with the context: each stays while its text is still >= 19.5 px, and fades just before
    const chipOp = sc >= 0.9999 ? 1 : r(clamp((L.F * L.px * sc - Math.min(19.5, L.F * L.px - 0.01)) / 0.6), 3);
    C.chips.forEach((ch, i) => { if (ch) { nodes[`lab${i}`] = {opacity: chipOp}; nodes[`lab${i}-text`] = {opacity: 1}; } });
    C.exChips.forEach((_, i) => { nodes[`exchip${i}`] = {opacity: chipOp}; });
    const fr = seg(u, ...W.frame) * (1 - seg(u, ...W.frameOut));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const ls = 0.6 + 0.4 * open;
    const lc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
    nodes.lens = {opacity: r(Math.min(1, open * 2.5), 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    const panelOp = u < 0.5 ? 1 - seg(u, ...W.panelOut) : seg(u, ...W.panelIn);
    nodes.panel = {opacity: r(panelOp, 3)};
    const mk = seg(u, ...W.marker);
    nodes['cx-marker'] = {opacity: r(L.showKey ? mk : 0, 3)};
    if (L.lay && L.lay.rows.some(m => m.name === 'marker-row')) nodes['marker-row'] = {opacity: r(mk, 3)};
    const datumState = u < W.strike[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {
      nodes,
      semantic: {
        beat,
        datum: datumState,
        before: L.before,
        lensOpen: r(open, 3),
        lensStartU: r(L.openW[0], 4),
        contextScale: r(sc, 3),
        ctxCopy: r(ctxT, 3),
        lensCopy: r(lensT, 3),
        bothCopies: ctxT >= 0.15 && lensT >= 0.15 && open > 0.01,
        strike: r(strike, 3),
        docked: r(move, 3),
        newShown: r(newIn, 3),
        started: r(started, 3),
        switchK: r(switchK, 3),
        lights: r(lights, 3),
        markerShown: r(L.showKey ? mk : 0, 3),
        panel: r(panelOp, 3),
        zoomVsRest: r(L.zm, 3),
        lensMinSide: r(Math.min(L.dest.w, L.dest.h) / L.shortD, 3),
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        personPx: r(100 * C.k * L.px, 1),
        allReached: true,
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
    slug: 'hearings-01-inspect',
    title: 'Opening of a hearing — inspecting the session state on the wall unit and substituting it',
    titleEs: 'Apertura de audiencia — Inspección y cambio de un dato',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Apertura de audiencia',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The generic hearing room after its opening. A lens opens on the wall control unit (a real enlarged copy of the same room coordinates) and one supplied datum is substituted: the session state. The old value is struck and docked as "was"; the new value arrives; only its dependent state follows (the frame, the switch lever and the lamps). The context returns with a neutral changed-datum marker. Fictional and illustrative; "pending" is only a waiting state.',
    tags: ['hearing', 'opening', 'inspect', 'lens', 'session state', 'status display', 'switch', 'substitution', 'changed datum', 'room plan', 'participants'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/animations/courts/kits/distribucion-de-sala.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
