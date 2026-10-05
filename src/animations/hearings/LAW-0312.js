/**
 * LAW-0312 — Pausa de audiencia · inspect
 *
 * Storyboard (the context is the state produced by the action: the generic
 * hearing room seen from above, the session clock on the panel stopped at the
 * supplied time with its pause badge, the recess card connected to it with its
 * caption, the participants' positions marked):
 *  0.00–0.20  build: the room fills its area beside a text panel. The recess
 *             caption carries the supplied time — the BEFORE value.
 *  0.20–0.45  isolate: a frame settles on the card; the panel steps out and the
 *             context steps back; a lens (a window with a rim and a shadow — not
 *             the panel's card) opens in the freed space with a REAL enlarged
 *             copy of the same room coordinates (the recess card, its caption
 *             and the dock beside or under it). The caption leaves the context
 *             as its enlarged copy arrives.
 *  0.45–0.75  substitute ONE datum: the old value moves, unchanged (no strike,
 *             no correction mark), to the dock as "was …"; the supplied AFTER
 *             value comes in; only its dependent geometry follows: the session
 *             clock's hands turn forward to the new time, the card's small dial
 *             shows it and the connector follows the minute hand.
 *  0.75–1.00  return: the lens closes onto the context with the new value, the
 *             old value docked (traceable) and a neutral changed-datum marker
 *             (Δ). Seeking back restores it exactly.
 * Nothing is ruled: the time is only a supplied, fictional time; no rule on
 * recesses, duration, time limit, consequence or end of the proceedings;
 * neither value is marked as wrong.
 * @module animations/hearings/LAW-0312
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {localised, pxPerUnit, searchLayout, overlaps, placeLabels, FONT} from './kits/apertura-audiencia.js';
import {pzFields, PZ_EN, PZ_ES, resolvePz, pzRows, pzRowNode, pzRoom, composePz, personBox, cardBox} from './kits/pausa-audiencia.js';

const ID = 'LAW-0312';
// (the clocks that keep running — the wall clock, a session that stays active — come to rest at CLOCK_END: the last
// frames are a still hold)
const CLOCK_END = 0.94;
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.18, 0.205], panelOut: [0.185, 0.205], ctxOut: [0.205, 0.209], back: [0.209, 0.235], open: [0.212, 0.24],
  // (no strike: the old value is not corrected, only moved to its dock; the hands turn forward over 0.6–0.68)
  strike: [2, 2.1], move: [0.48, 0.55], chip: [0.53, 0.55], was: [0.54, 0.555], newIn: [0.555, 0.585], cue: [0.6, 0.68],
  close: [0.728, 0.744], forward: [0.744, 0.758], ctxIn: [0.758, 0.761],
  frameOut: [0.735, 0.75], panelIn: [0.744, 0.762], tether: [0.78, 0.84], marker: [0.8, 0.83],
};

const STRINGS = {
  en: {was: 'was'},
  es: {was: 'antes'},
};

const CAT = pzFields;
const CAT_EN = PZ_EN;
const CAT_ES = PZ_ES;
const OWN_EN = {
  focusTarget: 'recess-time',
  beforeValue: 'Recess from 10:40 (as supplied)',
  afterValue: 'Recess from 11:15 (as supplied)',
  afterTime: {hour: 11, minute: 15},
  contextLabels: {context: 'The room after the session clock was paused (as supplied)', marker: 'Changed: one datum, the recess time'},
};
const OWN_ES = {
  focusTarget: 'recess-time',
  beforeValue: 'Receso desde las 10:40 (aportado)',
  afterValue: 'Receso desde las 11:15 (aportado)',
  afterTime: {hour: 11, minute: 15},
  contextLabels: {context: 'La sala con el reloj de sesión en pausa (aportado)', marker: 'Cambio: un dato, el momento del receso'},
};
const EN = {...CAT_EN, ...OWN_EN};
const ES = {...CAT_ES, ...OWN_ES};

const sceneSchema = {
  ...CAT,
  focusTarget: oneOf('Detail that is enlarged and substituted: the supplied time of the recess (its caption; the session clock\'s hands, the card\'s dial and the connector follow it)', ['recess-time']),
  beforeValue: str('Caption of the recess before the substitution (as supplied)', 60),
  afterValue: str('Caption of the recess after the substitution (the alternative datum, as supplied)', 60),
  afterTime: obj('The alternative time shown by the hands (fictional, as supplied): only a time, nothing is inferred from it', {
    hour: int('Hour (fictional, 0–23)', 0, 23),
    minute: int('Minute (fictional)', 0, 59),
  }, ['hour', 'minute']),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens, relative to the context at rest (never below 1.6)', 1.6, 4),
    placement: oneOf('Alignment of the lens inside the space it opens in', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 60),
  }, ['context', 'marker']),
};

const defaultParams = {
  ...EN,
  focusTarget: 'recess-time',
  detailGeometry: {zoom: 3, placement: 'auto'},
};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolvePz(ctx, P);
    // the substituted datum: the recess time (its caption, the session clock's hands, the card's dial and the connector)
    const at0 = P.afterTime || R.stop;
    const regions = {before: R.stop, after: {hour: clamp(Math.round(at0.hour), 0, 23), minute: clamp(Math.round(at0.minute), 0, 59)}};
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showAll) rows.push({kind: 'text', text: P.contextLabels.context, name: 'ctx-caption'});
    if (showKey) {
      // participants, numbered as their badges in the room
      R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
      rows.push(...pzRows(R, P));
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      rows.push({kind: 'legend', glyphKind: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
      rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    }
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    const minSide = 0.42 * shortD;
    // (coordinator: the lens magnifies the text >= 1.5x on every host — robustness target 1.6x; the search aims above)
    const ZT = 1.65, ZMIN = 1.5;
    const gap = 26;
    const zoomMax = P.detailGeometry.zoom;
    // ---- the lens for a composed room: where it opens, how far the context steps back, the crop and the zoom
    const lensPlan = (C, roomBox) => {
      const G = C.G, k = C.k;
      // the crop needed (template): the recess card, its caption and its dock
      const parts = [cardBox(G), G.capBox, G.dock].filter(Boolean);
      // (a wider margin on the right: the card's speech tail never touches the rim)
      const x0 = Math.min(...parts.map(b => b.x)) - 8, x1 = Math.max(...parts.map(b => b.x + b.w)) + 14;
      const y0 = G.zone.y - 10, y1 = Math.max(...parts.map(b => b.y + b.h)) + 10;
      const needT = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
      const needD = {w: needT.w * k, h: needT.h * k};
      const plan = C.planRect;
      const wide = roomBox.w < D.w - 1 ? true : roomBox.h < D.h - 1 ? false : D.w >= D.h;
      const regionFor = sc => (wide
        ? {x: plan.x + plan.w * sc + gap, y: 0, w: D.w - (plan.x + plan.w * sc + gap), h: D.h}
        : {x: 0, y: plan.y + plan.h * sc + gap, w: D.w, h: D.h - (plan.y + plan.h * sc + gap)});
      const anchor = wide ? {x: plan.x, y: plan.y + plan.h / 2} : {x: plan.x + plan.w / 2, y: plan.y};
      const problems = [];
      const shareOf = sc => (wide ? (plan.w * sc * f.scale) / ctx.view.width : Math.max((plan.h * sc * f.scale) / ctx.view.height, (plan.w * sc * f.scale) / ctx.view.width));
      const sMin = Math.max(46 / (100 * k * px), 0.4);
      let sc = 1, region, zm, Z, dest;
      if (wide) {
        region = regionFor(1);
        let ok = false;
        for (const target of [minSide, 0.4 * shortD, 0.37 * shortD]) {
          for (let q = 1; q >= sMin - 1e-9; q -= 0.02) {
            const rg = regionFor(q);
            if (shareOf(q) < 0.46) break;
            sc = q; region = rg;
            if (Math.min(zoomMax, rg.w / needD.w, rg.h / needD.h) >= ZT && Math.min(rg.w, rg.h) >= target) { ok = true; break; }
          }
          if (ok) break;
        }
        if (!ok) problems.push('lens-space');
        zm = Math.min(zoomMax, region.w / needD.w, region.h / needD.h);
        Z = k * zm;
        dest = {w: Math.min(region.w, Math.max(needT.w * Z * 1.2, minSide)), h: Math.min(region.h, Math.max(needT.h * Z * 1.2, minSide))};
      } else {
        const bottom = D.h;
        const availH = bottom - plan.y - gap - plan.h * sMin;
        zm = Math.min(zoomMax, (D.w * 0.96) / needD.w, availH / needD.h);
        Z = k * zm;
        const hLens = Math.min(Math.max(needT.h * Z * 1.25, minSide), availH);
        sc = clamp((bottom - plan.y - gap - hLens) / plan.h, sMin, 1);
        while (sc < 1 && shareOf(sc) < 0.46) sc = Math.min(1, sc + 0.01);
        region = regionFor(sc);
        zm = Math.min(zm, region.h / needD.h);
        Z = k * zm;
        dest = {w: region.w * 0.96, h: Math.min(region.h, Math.max(needT.h * Z * 1.25, minSide))};
        if (zm < ZT || Math.min(dest.w, dest.h) < 0.37 * shortD) problems.push('lens-space');
      }
      const pl = P.detailGeometry.placement;
      const ax = pl === 'left' ? 0 : pl === 'right' ? 1 : 0.5;
      // crop (template): the lens box at this zoom, centred on the needed crop, inside the room
      const crop = {w: dest.w / Z, h: dest.h / Z};
      // (never above the panel's top edge: the wall would show as an empty bar across the lens)
      crop.x = clamp(needT.x + needT.w / 2 - crop.w / 2, -G.t, G.W + G.t - crop.w);
      crop.y = clamp(needT.y + needT.h / 2 - crop.h / 2, G.board.y - 4, G.H + G.t - crop.h);
      // the session clock's place (with its plate) is never cut by the crop: the crop narrows to the gap between the places
      const pg = G.places.document;
      const pgB = {x: pg.x - 4, y: pg.y - 4, w: pg.w + 8, h: Math.max(pg.h, G.tagBox.y + G.tagBox.h - pg.y) + 8};
      if (overlaps(pgB, crop, 2)) {
        if (pgB.x + pgB.w <= needT.x + 1) { const nx = Math.max(crop.x, pgB.x + pgB.w + 4); crop.w -= nx - crop.x; crop.x = nx; } else crop.w = Math.min(crop.x + crop.w, pgB.x - 4) - crop.x;
      }
      // the window keeps its size: when the crop narrows, it grows in height around the card (never over the session clock)
      {
        const Zw = Math.min(zoomMax * k, region.w / crop.w, region.h / crop.h);
        if (crop.h * Zw < minSide && crop.w * Zw >= minSide * 0.6) {
          const hh = Math.min(minSide / Zw, region.h / Zw);
          crop.y = clamp(needT.y + needT.h / 2 - hh / 2, G.board.y - 4, G.H + G.t - hh);
          crop.h = hh;
        }
      }
      // nobody is cut by the crop (participant badges count like people): it narrows, or stops above
      const toT = b => ({x: (b.x - C.ox) / k - 6, y: (b.y - C.oy) / k - 6, w: b.w / k + 12, h: b.h / k + 12});
      const people = [...R.speakers.map(sp => personBox(G.seats[sp.index])), ...(C.badges || []).map(bd => toT(bd.box))];
      for (const pb of people) {
        if (!overlaps(pb, crop, 2)) continue;
        if (pb.y >= needT.y + needT.h) crop.h = Math.max(needT.y + needT.h - crop.y, pb.y - 4 - crop.y);
        else if (pb.x + pb.w <= needT.x) { const nx = pb.x + pb.w + 4; crop.w -= nx - crop.x; crop.x = nx; }
        else if (pb.x >= needT.x + needT.w) crop.w = pb.x - 4 - crop.x;
        else problems.push('lens-crop-person');
      }
      // the crop always holds the whole needed area: a taller one lowers the zoom instead
      if (crop.h < needT.h) { crop.y = needT.y; crop.h = needT.h; }
      if (crop.w < needT.w) { crop.x = needT.x; crop.w = needT.w; }
      if (crop.y > needT.y) { crop.h += crop.y - needT.y; crop.y = needT.y; }
      if (crop.y + crop.h < needT.y + needT.h) crop.h = needT.y + needT.h - crop.y;
      // a crop narrowed to the gap is shown larger (within the region and the supplied zoom)
      const Zfit = Math.min(zoomMax * k, region.w / crop.w, region.h / crop.h);
      if (Zfit > Z || crop.w * Z > region.w || crop.h * Z > region.h) { Z = Zfit; zm = Z / k; }
      dest.w = crop.w * Z;
      dest.h = crop.h * Z;
      dest.x = region.x + (region.w - dest.w) * ax;
      dest.y = wide ? clamp(plan.y + plan.h / 2 - dest.h / 2, region.y, region.y + region.h - dest.h) : region.y + (region.h - dest.h) * (pl === 'bottom' ? 1 : 0);
      if (Math.min(dest.w, dest.h) < 0.37 * shortD - 0.5) problems.push('lens-small');
      if (zm < ZMIN) problems.push('lens-zoom');
      return {needT, wide, anchor, s: sc, region, zm, Z, dest, crop, problems};
    };
    // standing floors: >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — only when nothing composes at 1:1
    // does the stress floor of 45 px apply
    const search = minPersonPx => searchLayout(ctx, P, R, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4],
      compose: (box, F, scale) => {
        const C = composePz(ctx, P, R, box, F, {scale, chips: false, text: showKey, dock: showKey ? {wasText: ctx.t.was, capTexts: {before: P.beforeValue, after: P.afterValue}} : null, dockBeside: ctx.view.shape === 'portrait', marker: true});
        // number badges beside each participant (keyed to the panel)
        C.badges = [];
        C.badgeR = F * 0.78;
        if (showKey) {
          const G = C.G;
          const bR = C.badgeR;
          const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: bR * 2, h: bR * 2, at: C.toD(G.seats[sp.index]), rad: C.rad, rim: C.rad * 0.8, prefer: sp.index === R.presenter ? 0 : G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
            {bounds: C.bounds, circles: C.people, boxes: C.equip, ellipse: C.ellipse || {c: {x: -1e5, y: -1e5}, a: 1, b: 1}, anchors: R.speakers.map(sp => C.toD(G.seats[sp.index]))});
          C.badges = res.labels;
          for (const fl of res.fails) C.problems.push(`badge-${fl}`);
        }
        const LP = lensPlan(C, box);
        C.problems.push(...LP.problems);
        C.lens = LP;
        return C;
      },
    });
    let best = search(ctx.view.shape === 'square' ? 55.5 : 61);
    if (best.problems.length && ctx.view.shape === 'square') best = search(45);
    const {F, C, lay} = best;
    const G = C.G, k = C.k;
    const {dest, crop, Z, zm, s, anchor, wide} = C.lens;
    const problems = [...best.problems];
    const datum = {stops: regions, capFits: G.capFits, wasFit: G.wasFit};
    const room = pzRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, tagFit: G.tagFit, capFit: G.capFit, datum});
    const inCrop = b => b.x >= crop.x + 1 && b.y >= crop.y + 1 && b.x + b.w <= crop.x + crop.w - 1 && b.y + b.h <= crop.y + crop.h - 1;
    const lz = pzRoom(ctx, G, {prefix: 'lz', R, Ft: G.Ft, tagFit: G.tagFit, capFit: G.capFit, datum, keep: inCrop});
    const cropD = C.bD(crop);
    // the changed-datum marker: in the free strip at the right of the card's column, level with the caption plate — off
    // every plate border and every text
    const markerT = G.markC || {x: G.capBox.x + G.capBox.w + 22, y: G.capBox.y + G.capBox.h / 2};
    const markerD = C.toD(markerT);
    // the lens never passes over a person while it grows: it starts once the stepping-back context has cleared the
    // window's whole final rectangle (shadow and rim included)
    const lensBox = {x: dest.x - 4, y: dest.y - 4, w: dest.w + 14, h: dest.h + 18};
    const peopleD = R.speakers.map(sp => C.bD(personBox(G.seats[sp.index])));
    const roomD = C.planRect;
    const clearAt = u => {
      const sc = lerp(1, s, ease.inOutCubic(seg(u, ...W.back)));
      return [...peopleD, roomD].every(hb => !overlaps({x: anchor.x + (hb.x - anchor.x) * sc, y: anchor.y + (hb.y - anchor.y) * sc, w: hb.w * sc, h: hb.h * sc}, lensBox, 0));
    };
    let uClear = W.open[0];
    while (uClear <= W.back[1] && !clearAt(uClear)) uClear += 0.0002;
    if (!clearAt(uClear)) problems.push('lens-over-people');
    const shiftW = Math.max(0, uClear - W.open[0]);
    const openW = [W.open[0] + shiftW, Math.max(W.open[1], W.open[0] + shiftW + 0.02)];
    const ctxOutW = [W.ctxOut[0] + shiftW, W.ctxOut[1] + shiftW];
    // (the panel hands over to the lens: it leaves just as the lens starts to open — never shown together, and the
    // freed area is never left blank while the context steps back and the lens waits for it to clear)
    const panelOutW = [Math.max(W.panelOut[0], openW[0] - 0.018), openW[0]];
    return {P, R, F, px, C, G, k, room, lz, lay, regions, dest, crop, cropD, Z, zm, s, anchor, markerD, markerR: 20, problems, wide, showKey, minSide, shortD, openW, ctxOutW, shiftW, panelOutW};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const panel = L.lay ? L.lay.rows.map(m => pzRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const ctxGroup = g({name: 'ctx', transform: 'translate(0 0) scale(1)'},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node),
      (C.badges || []).map(bd => g({name: bd.key},
        h('circle', {cx: r(bd.box.x + bd.box.w / 2), cy: r(bd.box.y + bd.box.h / 2), r: r(C.badgeR), fill: th.accent2, stroke: '#ffffff', 'stroke-width': 2.5}),
        h('text', {x: r(bd.box.x + bd.box.w / 2), y: r(bd.box.y + bd.box.h / 2 + L.F * 0.35), 'font-family': FONT, 'font-size': r(L.F, 2), 'font-weight': 700, 'text-anchor': 'middle', fill: '#ffffff'}, String(+bd.key.slice(1) + 1)))),
      h('rect', {name: 'src-frame', x: r(L.cropD.x), y: r(L.cropD.y), width: r(L.cropD.w), height: r(L.cropD.h), rx: 12, fill: 'none', stroke: th.accent2, 'stroke-width': 4, opacity: 0}),
      changedMarker(ctx, {name: 'cx-marker', x: L.markerD.x, y: L.markerD.y, radius: L.markerR, opacity: 0}),
    );
    const d = L.dest;
    return g(null,
      ctxGroup,
      g({name: 'panel'}, panel),
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
    const move = ease.inOutCubic(seg(u, ...W.move)), chip = seg(u, ...W.chip), was = seg(u, ...W.was);
    const newIn = seg(u, ...W.newIn);
    // (a gentle ease: the hands never turn more than ~10° per frame)
    const cue = ease.inOutSine(seg(u, ...W.cue));
    // context texts stay while they are still at their floor and leave just before
    const floor = L.F * L.px >= 19.5 ? 19.5 : 16;
    const textK = sc >= 0.9999 ? 1 : clamp((L.F * L.px * sc - Math.min(floor, L.F * L.px - 0.01)) / 0.6);
    // one copy of the datum at a time: the context copy leaves as the lens copy arrives, and comes back after it
    const ctxT = u < 0.5 ? Math.min(1 - seg(u, ...L.ctxOutW), textK) : seg(u, ...W.ctxIn);
    const lensT = clamp((open - 0.3) / 0.3);
    const dm = {move, newIn, cue, was, dockK: chip};
    // (the wall clock keeps running throughout: only the session time is paused)
    const rf = L.room.frame({clockDeg: 48 * Math.min(u, CLOCK_END), run: 1, tag: 1, pause: 1, zoom: 1, link: 1, cap: 1, pins: 1, reach: null, textK, datum: {...dm, copy: ctxT}});
    Object.assign(nodes, rf.nodes);
    // (the lens copy's texts arrive with the lens, never while it is still growing below their size)
    // (in the lens the dock's empty tray stands from the start: the lens never shows a bare half waiting for it)
    Object.assign(nodes, L.lz.frame({clockDeg: 48 * Math.min(u, CLOCK_END), run: 1, tag: 1, pause: 1, zoom: 1, link: 1, cap: 1, pins: 1, reach: null, textK: lensT, datum: {...dm, dockK: 1, copy: lensT}}).nodes);
    const chipOp = sc >= 0.9999 ? 1 : r(textK, 3);
    (C.badges || []).forEach(bd => { nodes[bd.key] = {opacity: chipOp}; });
    const fr = seg(u, ...W.frame) * (1 - seg(u, ...W.frameOut));
    nodes['src-frame'] = {opacity: r(fr, 3)};
    const ls = 0.6 + 0.4 * open;
    const lc = {x: L.dest.x + L.dest.w / 2, y: L.dest.y + L.dest.h / 2};
    nodes.lens = {opacity: r(Math.min(1, open * 2.5), 3), transform: scaleAbout(lc.x, lc.y, r(ls, 4))};
    const panelOp = u < 0.5 ? 1 - seg(u, ...L.panelOutW) : seg(u, ...W.panelIn);
    nodes.panel = {opacity: r(panelOp, 3)};
    const mk = seg(u, ...W.marker);
    nodes['cx-marker'] = {opacity: r(L.showKey ? mk : 0, 3)};
    if (L.lay && L.lay.rows.some(m => m.name === 'marker-row')) nodes['marker-row'] = {opacity: r(mk, 3)};
    // (the datum is keyed to the move: the old value leaves first, the new one follows)
    const datumState = u < W.move[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {
      nodes,
      semantic: {
        beat,
        datum: datumState,
        timeState: cue >= 1 ? 'after' : cue > 0 ? 'changing' : 'before',
        timeBefore: `${L.regions.before.hour}:${String(L.regions.before.minute).padStart(2, '0')}`,
        timeAfter: `${L.regions.after.hour}:${String(L.regions.after.minute).padStart(2, '0')}`,
        minuteDeg: r(rf.minDeg, 2),
        positions: R.speakers.map(sp => ({x: r(G.seats[sp.index].x), y: r(G.seats[sp.index].y)})),
        lensOpen: r(open, 3),
        lensStartU: r(L.openW[0], 4),
        contextScale: r(sc, 3),
        ctxCopy: r(ctxT, 3),
        lensCopy: r(lensT, 3),
        bothCopies: ctxT >= 0.15 && lensT >= 0.15 && open > 0.01,
        strike: 0,
        docked: r(move, 3),
        newShown: r(newIn, 3),
        focusTarget: L.P.focusTarget,
        markerText: L.P.contextLabels.marker,
        markerShown: r(L.showKey ? mk : 0, 3),
        panel: r(panelOp, 3),
        zoomVsRest: r(L.zm, 3),
        lensMinSide: r(Math.min(L.dest.w, L.dest.h) / L.shortD, 3),
        ops: R.items.map(it => it.op),
        roles: {operator: R.presenter, listeners: R.listeners},
        activeI: R.docI,
        recessI: R.detI,
        finalState: 'recess',
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
    slug: 'hearings-08-inspect',
    title: 'Hearing pause — inspecting the recess time and substituting it',
    titleEs: 'Pausa de audiencia — Inspección y cambio de un dato',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Pausa de audiencia',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The generic hearing room after the action: the session clock on the panel stopped at the supplied, fictional time with its pause badge, the recess card connected to it with its caption, the positions marked; the wall clock runs. A lens (a window with a rim, distinct from the panel\'s card) opens on the recess card (a real enlarged copy of the same room coordinates) and one supplied datum is substituted: the recess time (its caption). The old value moves, unchanged, to a dock as "was"; the new value arrives; only its dependent geometry follows (the session clock\'s hands, the card\'s dial and the connector). The context returns with a neutral changed-datum marker. Illustrative; no rule on recesses, duration, time limit or consequence.',
    tags: ['hearing', 'recess', 'pause', 'session clock', 'inspect', 'lens', 'session panel', 'recess time', 'substitution', 'changed datum', 'as supplied', 'room plan'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/pausa-audiencia.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
