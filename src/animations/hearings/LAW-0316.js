/**
 * LAW-0316 — Conclusiones de las partes · inspect
 *
 * Storyboard (the context is the state produced by the action: the generic
 * hearing room seen from above, both argument cards on the board, each with
 * its reference plate above it — "invokes exhibits …, as supplied" — and its
 * lines running to the exhibits it invokes on the evidence table):
 *  0.00–0.20  build: the room fills its area beside a text panel. Argument A's
 *             reference plate carries the supplied BEFORE value.
 *  0.20–0.45  isolate: a frame settles on A's reference plate; the panel steps
 *             out and the context steps back; a lens (a window with a rim and a
 *             shadow) opens in the freed space with a REAL enlarged copy of the
 *             same room coordinates (the plate and the dock under it). The plate's
 *             text and marker leave the context as their enlarged copy arrives.
 *  0.45–0.75  substitute ONE datum: the old value moves, unchanged (no strike),
 *             to the dock as "was …"; the supplied AFTER value comes in; only its
 *             dependent geometry follows: in the context, the one line of A whose
 *             exhibit changed slides along the table to the newly invoked exhibit,
 *             its ● riding the tip. Argument B, its plate and lines do not move.
 *  0.75–1.00  return: the lens closes onto the context with the new value, the
 *             old value docked (traceable) and a neutral changed-datum marker
 *             (Δ). Seeking back restores it exactly.
 * Nothing is assessed: an invoked exhibit is only "invoked by the party (as
 * supplied)"; neither value is marked as wrong; no side is preferred.
 * @module animations/hearings/LAW-0316
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {str, int, num, list, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {localised, pxPerUnit, overlaps, placeLabels, FONT} from './kits/apertura-audiencia.js';
import {cpFields, CP_EN, CP_ES, resolveCp, cpRows, cpRowNode, cpRoom, composeCp, searchCp, personBox, SIDES} from './kits/conclusiones-partes.js';

const ID = 'LAW-0316';
const CLOCK_END = 0.94;
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.18, 0.205], panelOut: [0.185, 0.205], ctxOut: [0.205, 0.209], back: [0.209, 0.224], open: [0.212, 0.24],
  // (no strike: the old value is not corrected, only moved to its dock; the changed line slides over 0.6–0.68)
  move: [0.48, 0.55], chip: [0.53, 0.55], was: [0.54, 0.555], newIn: [0.555, 0.585], cue: [0.6, 0.68],
  close: [0.728, 0.744], forward: [0.744, 0.758], ctxIn: [0.758, 0.761],
  frameOut: [0.735, 0.75], panelIn: [0.744, 0.762], marker: [0.8, 0.83],
};

const STRINGS = {
  en: {was: 'was'},
  es: {was: 'antes'},
};

const OWN_EN = {
  focusTarget: 'references-a',
  beforeValue: 'Invokes exhibits 1 and 2 (as supplied)',
  afterValue: 'Invokes exhibits 1 and 3 (as supplied)',
  afterLinks: [0, 2],
  referencesB: 'Invokes exhibits 2 and 3 (as supplied)',
  contextLabels: {context: 'The room after both arguments were linked (as supplied)', marker: 'Changed: one datum, an exhibit invoked in argument A'},
};
const OWN_ES = {
  focusTarget: 'references-a',
  beforeValue: 'Invoca las pruebas 1 y 2 (aportado)',
  afterValue: 'Invoca las pruebas 1 y 3 (aportado)',
  afterLinks: [0, 2],
  referencesB: 'Invoca las pruebas 2 y 3 (aportado)',
  contextLabels: {context: 'La sala con ambos argumentos unidos (aportado)', marker: 'Cambio: un dato, una prueba invocada en el argumento A'},
};
const EN = {...CP_EN, ...OWN_EN};
const ES = {...CP_ES, ...OWN_ES};

const sceneSchema = {
  ...cpFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the reference plate of argument A (which exhibits it invokes, as supplied); only the line whose exhibit changes follows it', ['references-a']),
  beforeValue: str('Reference plate of argument A before the substitution (as supplied; it names the exhibits in `links.a`)', 70),
  afterValue: str('Reference plate of argument A after the substitution (the alternative datum, as supplied)', 70),
  afterLinks: list('The exhibits argument A invokes after the substitution (indices in `exhibits`, as supplied): only an invocation, nothing is inferred from it', int('Index in `exhibits`', 0, 3), 1, 3),
  referencesB: str('Reference plate of argument B (as supplied; it names the exhibits in `links.b`; it does not change)', 70),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens, relative to the context at rest (never below 1.6)', 1.6, 4),
    placement: oneOf('Alignment of the lens inside the space it opens in', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 70),
  }, ['context', 'marker']),
};

const defaultParams = {...EN, detailGeometry: {zoom: 3, placement: 'auto'}};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P = localised(ctx, EN, ES);
    const R = resolveCp(ctx, P);
    const ne = R.exhibits.length;
    const after = [];
    for (const v of P.afterLinks || []) { const q = Math.round(v); if (q >= 0 && q < ne && !after.includes(q)) after.push(q); }
    if (!after.length) after.push(...R.links.a);
    const linksAlt = {a: after, b: R.links.b};
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const rows = [];
    if (showKey) rows.push({kind: 'heading', text: P.hearing.room, name: 'room-name'});
    if (showAll) rows.push({kind: 'text', text: P.contextLabels.context, name: 'ctx-caption'});
    if (showKey) {
      R.speakers.forEach(sp => rows.push({kind: 'legend', glyphKind: 'seq', seqNumber: String(sp.index + 1), text: sp.label, name: `lg-p${sp.index}`}));
      rows.push(...cpRows(R, P, 'lg'));
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      rows.push({kind: 'legend', glyphKind: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
      rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    }
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    const minSide = 0.42 * shortD;
    // (coordinator: the lens magnifies the text >= 1.5x on every host — robustness target 1.6x; the search aims above)
    const ZT = 1.65, ZMIN = 1.5;
    const gap = 16;
    const zoomMax = P.detailGeometry.zoom;
    // ---- the lens for a composed room: where it opens, how far the context steps back, the crop and the zoom
    const lensPlan = (C, roomBox, forceWide = null) => {
      const G = C.G, k = C.k;
      // the crop needed (template): argument A's reference plate and its dock
      const parts = [G.refs.a, G.dock].filter(Boolean);
      const x0 = Math.min(...parts.map(b => b.x)) - 10, x1 = Math.max(...parts.map(b => b.x + b.w)) + 10;
      const y0 = Math.min(...parts.map(b => b.y)) - 10, y1 = Math.max(...parts.map(b => b.y + b.h)) + 10;
      const needT = {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
      const needD = {w: needT.w * k, h: needT.h * k};
      const plan = C.planRect;
      const wide = forceWide !== null ? forceWide : roomBox.w < D.w - 1 ? true : roomBox.h < D.h - 1 ? false : D.w >= D.h;
      const regionFor = sc => (wide
        ? {x: plan.x + plan.w * sc + gap, y: 0, w: D.w - (plan.x + plan.w * sc + gap), h: D.h}
        : {x: 0, y: plan.y + plan.h * sc + gap, w: D.w, h: D.h - (plan.y + plan.h * sc + gap)});
      // (tall frames: the context steps back towards the side away from the lens, so together they span the width)
      const anchor = wide ? {x: plan.x, y: plan.y + plan.h / 2} : {x: P.detailGeometry.placement !== 'auto' ? plan.x + plan.w / 2 : G.left === 'a' ? plan.x + plan.w : plan.x, y: plan.y};
      const problems = [];
      const shareOf = sc => (wide ? (plan.w * sc * f.scale) / ctx.view.width : Math.max((plan.h * sc * f.scale) / ctx.view.height, (plan.w * sc * f.scale) / ctx.view.width));
      const sMin = Math.max(46 / (100 * k * px), 0.4);
      let sc = 1, region, zm, Z, dest;
      if (wide) {
        region = regionFor(1);
        let ok = false;
        for (const target of [minSide, 0.4 * shortD, 0.36 * shortD]) {
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
        if (zm < ZT || Math.min(dest.w, dest.h) < 0.36 * shortD) problems.push('lens-space');
      }
      const pl = P.detailGeometry.placement;
      const ax = pl === 'left' ? 0 : pl === 'right' ? 1 : 0.5;
      // crop (template): the lens box at this zoom, centred on the needed crop, inside the room, never above the board
      const crop = {w: dest.w / Z, h: dest.h / Z};
      crop.x = clamp(needT.x + needT.w / 2 - crop.w / 2, -G.t, G.W + G.t - crop.w);
      crop.y = clamp(needT.y + needT.h / 2 - crop.h / 2, G.board.y - 4, G.H + G.t - crop.h);
      // argument B's column (its plate and card) is never cut by the crop: the crop narrows to A's side of the gap
      const bx = G.colX.b, bCol = {x: bx - 4, y: G.board.y, w: G.colW + 8, h: G.board.h};
      if (overlaps(bCol, crop, 2)) {
        if (bCol.x >= needT.x + needT.w - 1) crop.w = Math.min(crop.x + crop.w, bCol.x - 4) - crop.x;
        else { const nx = Math.max(crop.x, bCol.x + bCol.w + 4); crop.w -= nx - crop.x; crop.x = nx; }
      }
      // the window keeps its size: when the crop narrows, it grows in height around the plate
      {
        const Zw = Math.min(zoomMax * k, region.w / crop.w, region.h / crop.h);
        if (crop.h * Zw < minSide && crop.w * Zw >= minSide * 0.6) {
          const hh = Math.min(minSide / Zw, region.h / Zw);
          crop.y = clamp(needT.y + needT.h / 2 - hh / 2, G.board.y - 4, G.H + G.t - hh);
          crop.h = hh;
        }
      }
      // nobody is cut by the crop (participant badges count like people): it stops above them
      const toT = b => ({x: (b.x - C.ox) / k - 6, y: (b.y - C.oy) / k - 6, w: b.w / k + 12, h: b.h / k + 12});
      const people = [...R.speakers.map(sp => personBox(G.seats[sp.index])), ...(C.badges || []).map(bd => toT(bd.box))];
      for (const pb of people) {
        if (!overlaps(pb, crop, 2)) continue;
        if (pb.y >= needT.y + needT.h) crop.h = Math.max(needT.y + needT.h - crop.y, pb.y - 4 - crop.y);
        else problems.push('lens-crop-person');
      }
      // argument A's card under the plate is never cut: when the crop reaches into it, it takes the whole card (the
      // lens shows the plate, the dock and the argument they belong to — never a blank band)
      {
        const ca = G.card.a;
        // (held with a margin: the source frame never runs along the card's text)
        const holds = crop.x <= ca.x - 16 && crop.y <= ca.y - 1 && crop.x + crop.w >= ca.x + ca.w + 16 && crop.y + crop.h >= ca.y + ca.h + 16;
        const cut = overlaps(ca, crop, 2) && !holds;
        if (cut) {
          const ext = {x: Math.min(crop.x, ca.x - 18), y: crop.y, w: 0, h: ca.y + ca.h + 18 - crop.y};
          ext.w = Math.max(crop.x + crop.w, ca.x + ca.w + 18) - ext.x;
          const zExt = Math.min(zoomMax * k, region.w / ext.w, region.h / ext.h) / k;
          if (zExt >= 1.57 && !overlaps(bCol, ext, 2) && !people.some(pb => overlaps(pb, ext, 2))) {
            crop.x = ext.x; crop.w = ext.w; crop.h = ext.h;
          }
          else crop.h = Math.max(needT.y + needT.h - crop.y, ca.y - 8 - crop.y);
        }
      }
      // (a window beside the context keeps a near-square shape: it takes a little of the floor under the board rather
      // than shrinking below the size floor — never cutting argument A's card, never reaching a person)
      if (wide && crop.h < crop.w * 0.98) {
        const ca = G.card.a;
        const lim = Math.min(G.H + G.t, ...people.map(pb => (pb.x < crop.x + crop.w && pb.x + pb.w > crop.x ? pb.y - 4 : Infinity)));
        let nb = Math.min(crop.y + crop.w * 0.98, lim);
        const overCard = ca.x < crop.x + crop.w && ca.x + ca.w > crop.x;
        if (overCard && nb > ca.y - 8 && nb < ca.y + ca.h + 18) {
          const inside = crop.x <= ca.x - 16 && crop.x + crop.w >= ca.x + ca.w + 16;
          nb = inside && ca.y + ca.h + 18 <= lim ? ca.y + ca.h + 18 : Math.min(nb, Math.max(crop.y + crop.h, ca.y - 8));
        }
        crop.h = Math.max(crop.h, nb - crop.y);
      }
      if (crop.h < needT.h) { crop.y = needT.y; crop.h = needT.h; }
      if (crop.w < needT.w) { crop.x = needT.x; crop.w = needT.w; }
      if (crop.y > needT.y) { crop.h += crop.y - needT.y; crop.y = needT.y; }
      if (crop.y + crop.h < needT.y + needT.h) crop.h = needT.y + needT.h - crop.y;
      const Zfit = Math.min(zoomMax * k, region.w / crop.w, region.h / crop.h);
      if (Zfit > Z || crop.w * Z > region.w || crop.h * Z > region.h) { Z = Zfit; zm = Z / k; }
      dest.w = crop.w * Z;
      dest.h = crop.h * Z;
      // (tall frames: the lens stands on the side of A's column, so context and lens together span most of the width)
      dest.x = region.x + (region.w - dest.w) * (wide || pl !== 'auto' ? ax : G.left === 'a' ? 0 : 1);
      dest.y = wide ? clamp(plan.y + plan.h / 2 - dest.h / 2, region.y, region.y + region.h - dest.h) : region.y + (region.h - dest.h) * (pl === 'bottom' ? 1 : 0);
      if (Math.min(dest.w, dest.h) < 0.36 * shortD - 0.5) problems.push('lens-small');
      if (zm < ZMIN) problems.push('lens-zoom');
      return {needT, wide, anchor, s: sc, region, zm, Z, dest, crop, problems};
    };
    const refs = {a: {before: P.beforeValue, after: P.afterValue}, b: P.referencesB};
    const compose = (box, F, scale) => {
      const C = composeCp(ctx, P, R, box, F, {scale, chips: false, text: showKey, refs, wasText: ctx.t.was, marker: true, linksAlt, linkGap: 96});
      // number badges beside each participant (keyed to the panel)
      C.badges = [];
      C.badgeR = F * 0.78;
      if (showKey) {
        const G = C.G;
        const bR = C.badgeR;
        const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: bR * 2, h: bR * 2, at: C.toD(G.seats[sp.index]), rad: C.rad, rim: C.rad * 0.8, prefer: G.seats[sp.index].angle, maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})),
          {bounds: C.bounds, circles: C.people, boxes: C.equip, anchors: R.speakers.map(sp => C.toD(G.seats[sp.index]))});
        C.badges = res.labels;
        for (const fl of res.fails) C.problems.push(`badge-${fl}`);
      }
      let LP = lensPlan(C, box);
      // (a room filling the whole area — no panel — may take the lens beside or below it: the better of the two)
      if (LP.problems.length && box.w >= D.w - 1 && box.h >= D.h - 1) {
        const LP2 = lensPlan(C, box, !LP.wide);
        if (LP2.problems.length < LP.problems.length) LP = LP2;
      }
      C.problems.push(...LP.problems);
      C.lens = LP;
      return C;
    };
    const opts = {sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, colFracs: [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4], compose};
    let best = searchCp(ctx, rows, {...opts, minPersonPx: ctx.view.shape === 'square' ? 55.5 : 61});
    if (best.problems.length && ctx.view.shape === 'square') best = searchCp(ctx, rows, {...opts, minPersonPx: 45});
    const {F, C, lay} = best;
    const G = C.G, k = C.k;
    const {dest, crop, Z, zm, s, anchor, wide} = C.lens;
    const problems = [...best.problems];
    const datum = {fits: G.refsFitsAB, wasFit: G.wasFit};
    const room = cpRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, cardFits: G.cardFits, refsFits: G.refsFits, datum});
    const inCrop = b => b.x >= crop.x + 1 && b.y >= crop.y + 1 && b.x + b.w <= crop.x + crop.w - 1 && b.y + b.h <= crop.y + crop.h - 1;
    const lz = cpRoom(ctx, G, {prefix: 'lz', R, Ft: G.Ft, cardFits: G.cardFits, refsFits: G.refsFits, datum, keep: inCrop});
    const cropD = C.bD(crop);
    // the changed-datum marker: in the free strip on the outer side of A's column, level with its reference plate — off
    // every plate border and every text
    const markerD = C.toD(G.markC || {x: G.refs.a.x - 20, y: G.refs.a.y + G.refs.a.h / 2});
    // (radius: 18 units, or less when the free space beside the plate is narrower — never on a border)
    const freeW = (G.inner + G.markR - G.refs.a.w) * k;
    const markerR = Math.max(10, Math.min(18, freeW * 0.3));
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
    const ctxOutW = [W.ctxOut[0] + 0.004 + shiftW, W.ctxOut[1] + 0.004 + shiftW];
    // (the panel hands over to the lens: it leaves just as the lens starts to open — never shown together, and the
    // freed area is never left blank while the context steps back and the lens waits for it to clear)
    const panelOutW = [Math.max(W.panelOut[0], openW[0] - 0.018), openW[0]];
    const changed = G.links.a.map((lk, j) => lk.ex !== G.linksAlt.a[j].ex);
    const cardInLens = inCrop(G.card.a);
    return {P, R, F, px, C, G, k, room, lz, lay, dest, crop, cropD, Z, zm, s, anchor, markerD, markerR, problems, wide, showKey, minSide, shortD, openW, ctxOutW, shiftW, panelOutW, changed, after, cardInLens};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const panel = L.lay ? L.lay.rows.map(m => cpRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
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
    const move = ease.inOutCubic(seg(u, ...W.move)), chip = seg(u, ...W.chip), was = seg(u, ...W.was);
    const newIn = seg(u, ...W.newIn);
    const cue = ease.inOutSine(seg(u, ...W.cue));
    // context texts stay while they are still at their floor and leave just before
    const floor = L.F * L.px >= 19.5 ? 19.5 : 16;
    const textK = sc >= 0.9999 ? 1 : clamp((L.F * L.px * sc - Math.min(floor, L.F * L.px - 0.01)) / 0.6);
    // one copy of the datum at a time: the context copy (text and marker) leaves as the lens copy arrives, and comes back
    // after it
    const ctxT = u < 0.5 ? Math.min(1 - seg(u, ...L.ctxOutW), textK) : seg(u, ...W.ctxIn);
    // (the lens copy grows legible quickly, at a separate destination: the hand-over gap stays under 180 ms)
    const lensT = clamp((open - 0.12) / 0.3);
    const dm = {move, newIn, was, dockK: chip};
    const all = {a: G.links.a.map(() => 1), b: G.links.b.map(() => 1)};
    // (argument A's card is in the lens too when the crop holds it: its context text leaves with the datum's)
    const rf = L.room.frame({clockDeg: 48 * Math.min(u, CLOCK_END), draw: all, textK, cue, datum: {...dm, copy: ctxT}, cardTextK: L.cardInLens ? {a: ctxT} : null});
    Object.assign(nodes, rf.nodes);
    // (in the lens the dock's tray comes in just before the old value moves to it — not an empty tray for the whole
    // isolate beat; until then that part of the lens shows the board under the plate)
    const lensDock = ease.inOutCubic(seg(u, W.move[0] - 0.035, W.move[0]));
    Object.assign(nodes, L.lz.frame({clockDeg: 48 * Math.min(u, CLOCK_END), draw: all, textK: lensT, cue, datum: {...dm, dockK: Math.max(lensDock, chip), copy: lensT}}).nodes);
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
    const datumState = u < W.move[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const tips = j => (rf.tips.a[j] ? {x: r(C.toD(rf.tips.a[j]).x), y: r(C.toD(rf.tips.a[j]).y)} : null);
    return {
      nodes,
      semantic: {
        beat,
        datum: datumState,
        linkState: cue >= 1 ? 'after' : cue > 0 ? 'changing' : 'before',
        linksBefore: G.links.a.map(lk => lk.ex),
        linksAfter: G.linksAlt.a.map(lk => lk.ex),
        linksB: G.links.b.map(lk => lk.ex),
        changed: L.changed,
        tipsA: G.links.a.map((_, j) => tips(j)),
        tipsB: G.links.b.map((_, j) => (rf.tips.b[j] ? {x: r(C.toD(rf.tips.b[j]).x), y: r(C.toD(rf.tips.b[j]).y)} : null)),
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
        parties: R.party,
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
    slug: 'hearings-09-inspect',
    title: 'Closing arguments — inspecting which exhibits argument A invokes and substituting one',
    titleEs: 'Conclusiones de las partes — Inspección y cambio de un dato',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Conclusiones de las partes',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The generic hearing room after the action: both argument cards on the board, each with its reference plate ("invokes exhibits …, as supplied") and its lines to the exhibits it invokes. A lens (a window with a rim, distinct from the panel) opens on argument A\'s reference plate (a real enlarged copy of the same room coordinates) and one supplied datum is substituted: which exhibits argument A invokes. The old value moves, unchanged, to a dock as "was"; the new value arrives; only its dependent geometry follows: the one line of A whose exhibit changed slides to the newly invoked exhibit. Argument B does not move. The context returns with a neutral changed-datum marker. Illustrative; nothing is proved, weighed or decided and no side is preferred.',
    tags: ['hearing', 'closing arguments', 'inspect', 'lens', 'invoked exhibits', 'substitution', 'changed datum', 'as supplied', 'argument board', 'evidence table', 'room plan'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/conclusiones-partes.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
