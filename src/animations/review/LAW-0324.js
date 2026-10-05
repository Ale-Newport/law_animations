/**
 * LAW-0324 — Identificación de motivo · inspect
 *
 * Storyboard (the context is the state produced by the action: the generic
 * examination room seen from above after the magnifier located the apartados
 * — the magnifier laid back on the table —, both label cards on the board
 * (● "Factual discrepancy", ◆ "Legal question raised": neutral labels supplied
 * by the party, of equal weight, glyph and placeholder bars only), each with its
 * reference plate above it naming the apartado it is attached to (as supplied),
 * and its line running to that numbered placeholder apartado on the table):
 *  0.00–0.20  build: the room fills its area beside a text panel. Label A's
 *             reference plate carries the supplied BEFORE value.
 *  0.20–0.45  isolate: a frame settles on A's reference plate; the panel steps
 *             out and the context steps back; a lens (a window with a rim and a
 *             shadow) opens in the freed space with a REAL enlarged copy of the
 *             same room coordinates, cropped tight on the plate and the dock under
 *             it (the dock tray waits empty). The plate's text and marker leave the
 *             context as their enlarged copy arrives — one legible copy at a time.
 *  0.45–0.75  substitute ONE datum: the plate's old value leaves it and enters the
 *             dock as the record captioned "was" as the supplied AFTER value comes
 *             in (never struck, never marked as wrong). Labels hidden: the plate
 *             shows one small sheet per apartado with A's ● on the one it names, and
 *             the ● slides to its new sheet inside the lens. Only the dependent
 *             geometry follows: in the context, A's line slides along the table to
 *             the newly named apartado, its ● riding the tip. Label B, its plate and
 *             line do not move.
 *  0.75–1.00  return: the lens closes onto the context with the new value, the
 *             old value docked (traceable) and a neutral changed-datum marker (Δ).
 *             Seeking back restores it exactly.
 * Nothing is evaluated: a line only means "this label was attached here by the
 * party (as supplied)"; neither value and no apartado is marked as wrong;
 * neither label is preferred; no outcome.
 * @module animations/review/LAW-0324
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {str, int, num, list, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {pxPerUnit, overlaps, placeLabels, textAt, FONT} from '../hearings/kits/apertura-audiencia.js';
import {imFields, IM_EN, IM_ES, localisedIm, resolveIm, imRows, imRowNode, imRoom, composeIm, searchIm, personBox, SIDES} from './kits/identificacion-motivo.js';

const ID = 'LAW-0324';
/**
 * The reference plates' text, a multiple of the text size, largest first (the dock's record of the old value stays at
 * the text size): the plate's value fills the lens while the dock waits empty for the record. First only sizes >=
 * REFS_MIN; the smaller ones when none composes. (No marker slot beside the plates — it would widen the board —: the Δ stands
 * beside A's plate on the board's margin.)
 */
const REFS_SIZES = [2.1, 1.9, 1.7, 1.55, 1.4, 1.25, 1.1, 1], REFS_MIN = 1.4;
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.18, 0.205], panelOut: [0.185, 0.205], ctxOut: [0.205, 0.209], back: [0.209, 0.224], open: [0.212, 0.24],
  // (no strike: the old value is not corrected, only moved to its dock; the changed line slides over 0.6–0.68)
  move: [0.48, 0.55], chip: [0.53, 0.55], was: [0.54, 0.555], newIn: [0.555, 0.585], cue: [0.6, 0.68],
  // (labels hidden: the plate's mark slides from the old paragraph's sheet to the new one's)
  marks: [0.5, 0.585],
  close: [0.728, 0.744], forward: [0.744, 0.758], ctxIn: [0.758, 0.761],
  frameOut: [0.735, 0.75], panelIn: [0.744, 0.762], marker: [0.8, 0.83],
};

const STRINGS = {
  en: {was: 'was'},
  es: {was: 'antes'},
};

const OWN_EN = {
  routes: {a: [2], b: [1]},
  focusTarget: 'references-a',
  beforeValue: 'Label A: section 3 (as supplied)',
  afterValue: 'Label A: section 4 (as supplied)',
  afterLinks: [3],
  referencesB: 'Label B: section 2 (as supplied)',
  contextLabels: {context: 'The room after locating (as supplied)', marker: 'Changed: the section of label A'},
};
const OWN_ES = {
  routes: {a: [2], b: [1]},
  focusTarget: 'references-a',
  beforeValue: 'Etiqueta A: apartado 3 (según lo aportado)',
  afterValue: 'Etiqueta A: apartado 4 (según lo aportado)',
  afterLinks: [3],
  referencesB: 'Etiqueta B: apartado 2 (según lo aportado)',
  contextLabels: {context: 'Tras localizar (según lo aportado)', marker: 'Cambio: el apartado de la etiqueta A'},
};
const EN = {...IM_EN, ...OWN_EN};
const ES = {...IM_ES, ...OWN_ES};

const sceneSchema = {
  ...imFields,
  focusTarget: oneOf('Detail that is enlarged and substituted: the reference plate of label A (which apartado it is attached to, as supplied); only the line whose apartado changes follows it', ['references-a']),
  beforeValue: str('Reference plate of label A before the substitution (as supplied; it names the apartados in `routes.a`)', 70),
  afterValue: str('Reference plate of label A after the substitution (the alternative datum, as supplied)', 70),
  afterLinks: list('The apartados label A is attached to after the substitution (indices in `decisions.sections`, as supplied): nothing is inferred from it', int('Index in `decisions.sections`', 0, 3), 1, 3),
  referencesB: str('Reference plate of label B (as supplied; it names the apartados in `routes.b`; it does not change)', 70),
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
    const P = localisedIm(ctx, EN, ES);
    const R = resolveIm(ctx, P);
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
      // (each section's row: its heading — the section cards on the board show only their glyph and placeholder bars —
      // then the caption of its marker; then the numbered paragraphs)
      rows.push({kind: 'legend', glyphKind: 'secA', text: `${R.args.a.text} · ${P.states.a}`, name: 'lg-a'});
      rows.push({kind: 'legend', glyphKind: 'secB', text: `${R.args.b.text} · ${P.states.b}`, name: 'lg-b'});
      rows.push(...imRows(R, P, 'lg').slice(2));
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      rows.push({kind: 'legend', glyphKind: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
      rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    }
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    const minSide = 0.42 * shortD;
    // (the tight crop's window: at least 0.37 of the short side — floor 0.35 — rather than a wider crop of empty board)
    const tightSide = 0.37 * shortD;
    // (coordinator: the lens magnifies the text >= 1.5x on every host — robustness target 1.6x; the search aims above)
    const ZT = 1.65, ZMIN = 1.5;
    const gap = 16;
    const zoomMax = P.detailGeometry.zoom;
    // ---- the lens for a composed room: where it opens, how far the context steps back, the crop and the zoom
    const lensPlan = (C, roomBox, forceWide = null) => {
      const G = C.G, k = C.k;
      // the crop needed (template): section A's reference plate, its dock and its card
      // (with section A's card under them, held with a margin: the lens shows the plate, the dock and the section they
      // belong to, and its window keeps a near-square shape)
      // (labels shown: the crop is tight on the plate and its dock — the dock tray is in the lens from the opening, the
      // section's card stays in the context —, so the enlarged plate and dock fill the window; labels hidden: the plate,
      // the dock strip and section A's card, whose marks show the change)
      const tight = !!(G.dock && G.refsFits && G.refsFits.a);
      const parts = (tight ? [G.refs.a, G.dock] : [G.refs.a, G.dock, G.card.a]).filter(Boolean);
      // (a margin wide enough that the source frame drawn round the crop never runs along the plate's text)
      // (16 units on the plate's text side — left and top —, less on the others)
      // (scaled with the plate's type: the frame's stroke band keeps clear of the larger text)
      const mg = tight ? Math.max(16, 0.45 * ((G.refsFits.a && G.refsFits.a.size) || 0)) : 18, mgR = tight ? 10 : 18;
      const x0 = Math.min(...parts.map(b => b.x)) - mg, x1 = Math.max(...parts.map(b => b.x + b.w)) + mgR;
      const y0 = Math.min(...parts.map(b => b.y)) - mg;
      // (never reaching section A's card under the dock: its place frame starts 4 units above it)
      const y1 = tight ? Math.min(Math.max(...parts.map(b => b.y + b.h)) + 6, G.card.a.y - 5) : Math.max(...parts.map(b => b.y + b.h)) + mg;
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
        // (the robustness target 1.65x first; then, coordinator decision 2026-10-04 LAW-0300, any zoom with margin over
        // the 1.5x floor — 1.56x — rather than no lens)
        for (const zt of tight ? [ZT, 1.56] : [ZT]) {
          for (const target of [minSide, 0.4 * shortD, 0.36 * shortD]) {
            for (let q = 1; q >= sMin - 1e-9; q -= 0.02) {
              const rg = regionFor(q);
              if (shareOf(q) < 0.46) break;
              sc = q; region = rg;
              if (Math.min(zoomMax, rg.w / needD.w, rg.h / needD.h) >= zt && Math.min(rg.w, rg.h) >= target) { ok = true; break; }
            }
            if (ok) break;
          }
          if (ok) break;
        }
        if (!ok) problems.push('lens-space');
        zm = Math.min(zoomMax, region.w / needD.w, region.h / needD.h);
        Z = k * zm;
        const grow = tight ? 1 : 1.2, side0 = tight ? tightSide : minSide;
        dest = {w: Math.min(region.w, Math.max(needT.w * Z * grow, side0)), h: Math.min(region.h, Math.max(needT.h * Z * grow, side0))};
      } else {
        const bottom = D.h;
        const availH = bottom - plan.y - gap - plan.h * sMin;
        zm = Math.min(zoomMax, (D.w * 0.96) / needD.w, availH / needD.h);
        Z = k * zm;
        const hLens = Math.min(Math.max(needT.h * Z * (tight ? 1 : 1.25), tight ? tightSide : minSide), availH);
        sc = clamp((bottom - plan.y - gap - hLens) / plan.h, sMin, 1);
        while (sc < 1 && shareOf(sc) < 0.46) sc = Math.min(1, sc + 0.01);
        region = regionFor(sc);
        zm = Math.min(zm, region.h / needD.h);
        Z = k * zm;
        dest = tight
          ? {w: Math.min(region.w * 0.96, Math.max(needT.w * Z, tightSide)), h: Math.min(region.h, Math.max(needT.h * Z, tightSide))}
          : {w: region.w * 0.96, h: Math.min(region.h, Math.max(needT.h * Z * 1.25, minSide))};
        if (zm < (tight ? 1.56 : ZT) || Math.min(dest.w, dest.h) < 0.36 * shortD) problems.push('lens-space');
      }
      const pl = P.detailGeometry.placement;
      const ax = pl === 'left' ? 0 : pl === 'right' ? 1 : 0.5;
      // crop (template): the lens box at this zoom, centred on the needed crop, inside the room, never above the board
      const crop = {w: dest.w / Z, h: dest.h / Z};
      crop.x = clamp(needT.x + needT.w / 2 - crop.w / 2, -G.t, G.W + G.t - crop.w);
      crop.y = clamp(needT.y + needT.h / 2 - crop.h / 2, G.board.y - 4, G.H + G.t - crop.h);
      // section B's column (its plate and card) is never cut by the crop: the crop narrows to A's side of the gap
      const bx = G.colX.b, bCol = {x: bx - 4, y: G.board.y, w: G.colW + 8, h: G.board.h};
      if (overlaps(bCol, crop, 2)) {
        if (bCol.x >= needT.x + needT.w - 1) crop.w = Math.min(crop.x + crop.w, bCol.x - 4) - crop.x;
        else { const nx = Math.max(crop.x, bCol.x + bCol.w + 4); crop.w -= nx - crop.x; crop.x = nx; }
      }
      // the window keeps its size: when the crop narrows, it grows in height around the plate
      if (!tight) {
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
      // section A's card under the plate is never cut: when the crop reaches into it, it takes the whole card (the
      // lens shows the plate, the dock and the argument they belong to — never a blank band)
      if (!tight) {
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
      // than shrinking below the size floor — never cutting section A's card, never reaching a person)
      if (wide && !tight && crop.h < crop.w * 0.98) {
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
    // (a plate's closing one-word bracketed tag travels with the word before it — "y 2 (aportados)" —, so a plate can wrap into
    // a compact block instead of one long line: the lens crop on it stays near-square)
    // (only a one-word tag — "(aportados)" —: a longer one, "(as supplied)", already makes a line of its own)
    const tagGlue = t => String(t ?? '').replace(/\s+(\([^()\s]{1,24}\))\s*$/, '\u00a0$1');
    const refs = {a: {before: tagGlue(P.beforeValue), after: tagGlue(P.afterValue)}, b: tagGlue(P.referencesB)};
    // (composition targets just above the hearings people floors — 55 px at 1:1, 60 px elsewhere —, with a small margin)
    const floorPx = ctx.view.shape === 'square' ? 55.2 : 61;
    // (first only plates at >= REFS_MIN — a smaller text size is taken rather than a small plate —; all sizes when none
    // composes)
    // (1:1: the plate multiples above 1.7 never compose beside a context >= 0.46 — "lens-space"; they are not tried there,
    // which keeps a cold create well under 0.9 s)
    const rsMax = ctx.view.shape === 'square' ? 1.7 : Infinity;
    let rsList = REFS_SIZES.filter(v => v >= REFS_MIN && v <= rsMax);
    // (labels shown: the plates' text as large as the composition allows — REFS_SIZES, largest first —, so the plate's
    // value fills the lens while the dock waits empty for the record)
    // (memoised within this layout: the searches at the two people floors evaluate the same compositions — the result
    // of a composition does not depend on the floor the search applies; the search copies its problems)
    const memo = new Map();
    const compose = (box, F, scale) => {
      const key = [box.x, box.y, box.w, box.h, F, scale, (showKey ? rsList : [1]).join()].map(v => (typeof v === 'number' ? v.toFixed(4) : v)).join('|');
      if (memo.has(key)) return memo.get(key);
      let C = null;
      for (const rs of showKey ? rsList : [1]) {
        C = compose1(box, F, scale, rs);
        if (!C.problems.length && 100 * C.k * px >= floorPx) break;
      }
      memo.set(key, C);
      return C;
    };
    const compose1 = (box, F, scale, rs) => {
      const C = composeIm(ctx, P, R, box, F, {scale, chips: false, text: showKey, refs, wasText: ctx.t.was, marker: false, linksAlt, linkGap: 96, cardText: false, refsLines: 4, refsSize: rs, dockRecord: true, dockInline: true, exStep: 112});
      C.refsSize = rs;
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
    const opts = {sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, colFracs: ctx.view.shape === 'square' ? [0.25, 0.3, 0.35, 0.39, 0.44, 0.47] : [0.25, 0.3, 0.35, 0.39, 0.44], bandCols: [2, 3, 4], sidePanels: ctx.view.shape === 'square' ? [[0.5, 2], [0.56, 2]] : [], compose};
    const searchAll = () => {
      let b = searchIm(ctx, rows, {...opts, minPersonPx: floorPx});
      if (b.problems.length && ctx.view.shape === 'square') b = searchIm(ctx, rows, {...opts, minPersonPx: 45});
      return b;
    };
    let best = searchAll();
    if (best.problems.length || best.F * px < 19.5 - 0.05) { rsList = REFS_SIZES.filter(v => v < REFS_MIN && v <= rsMax); const b2 = searchAll(); if (b2.problems.length <= best.problems.length && b2.F >= best.F) best = b2; }
    const {F, C, lay} = best;
    const G = C.G, k = C.k;
    const {dest, crop, Z, zm, s, anchor, wide} = C.lens;
    const problems = [...best.problems];
    const datum = {fits: G.refsFitsAB, wasFit: G.wasFit};
    const room = imRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, cardFits: G.cardFits, refsFits: G.refsFits, datum, refMarks: true});
    const inCrop = b => b.x >= crop.x + 1 && b.y >= crop.y + 1 && b.x + b.w <= crop.x + crop.w - 1 && b.y + b.h <= crop.y + crop.h - 1;
    const lz = imRoom(ctx, G, {prefix: 'lz', R, Ft: G.Ft, cardFits: G.cardFits, refsFits: G.refsFits, datum, keep: inCrop, refMarks: true});
    const cropD = C.bD(crop);
    // the changed-datum marker (Δ): on the free floor just outside the board, on A's side, level with A's reference plate
    // — fully inside the room, clear of the board's border, of every plate, text, line and face; when that floor is too
    // narrow, on the floor just under the outer end of A's card (no line starts there)
    const markerR = 16;
    const rT = markerR / k, gT = 12 / k;
    const outerLeft = G.left === 'a';
    let markT = {x: outerLeft ? G.board.x - gT - rT : G.board.x + G.board.w + gT + rT, y: G.refs.a.y + G.refs.a.h / 2};
    if (outerLeft ? markT.x - rT < 10 : markT.x + rT > G.W - 10) {
      const ca = G.card.a;
      markT = {x: outerLeft ? ca.x + Math.max(rT + 6, ca.w * 0.16) : ca.x + ca.w - Math.max(rT + 6, ca.w * 0.16), y: G.yB + gT + rT};
      // (clear of the wall calendar, which hangs on the left wall just under the board)
      const cal = {x: G.clock.cx - G.clock.R * 0.95, y: G.clock.cy - G.clock.R * 1.05 - 4, w: G.clock.R * 1.9, h: G.clock.R * 2.1 + 4};
      const near = (b, p, d) => p.x > b.x - d && p.x < b.x + b.w + d && p.y > b.y - d && p.y < b.y + b.h + d;
      if (near(cal, markT, rT + gT)) markT.x = Math.max(markT.x, cal.x + cal.w + gT + rT);
      // (never on a line: the lines leave the inner part of the card's lower edge)
      const hitsLine = SIDES.some(sd => G.links[sd].concat(G.linksAlt ? G.linksAlt[sd] : []).some(lk => { for (let i = 0; i <= 20; i++) { const qx = lerp(lk.from.x, lk.to.x, i / 20), qy = lerp(lk.from.y, lk.to.y, i / 20); if (Math.hypot(qx - markT.x, qy - markT.y) < rT + 8 / k) return true; } return false; }));
      if (hitsLine) problems.push('marker-space');
    }
    const markerD = C.toD(markT);
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
    // (labels shown: the dock tray is in the lens from the opening, empty; at the substitution the old value enters it as
    // a record captioned "was", at the text size, as the plate takes the new value — one legible copy at a time)
    const dockCopy = !!(G.dock && datum.fits && G.wasFit && G.recFit && inCrop(G.dock));
    return {dockCopy, P, R, F, px, C, G, k, room, lz, lay, dest, crop, cropD, Z, zm, s, anchor, markerD, markerR, problems, wide, showKey, minSide, shortD, openW, ctxOutW, shiftW, panelOutW, changed, after, cardInLens};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const panel = L.lay ? L.lay.rows.map(m => imRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const ctxGroup = g({name: 'ctx', transform: 'translate(0 0) scale(1)'},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node,
        L.dockCopy ? g({name: 'rm-dock-v', opacity: 0}, textAt(L.G.recFit, L.G.dock.x + 10 + L.G.wasFit.width + L.G.Ft * 0.5, L.G.dock.y + 8, '#1f2328')) : null),
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
          g({name: 'lens-content', transform: `${T(d.x - L.crop.x * L.Z, d.y - L.crop.y * L.Z)} scale(${r(L.Z, 5)})`}, L.lz.node,
            L.dockCopy ? g({name: 'lz-dock-v', opacity: 0}, textAt(L.G.recFit, L.G.dock.x + 10 + L.G.wasFit.width + L.G.Ft * 0.5, L.G.dock.y + 8, '#1f2328')) : null)),
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
    const dm = {move, newIn, was, dockK: chip, marks: seg(u, ...W.marks)};
    const all = {a: G.links.a.map(() => 1), b: G.links.b.map(() => 1)};
    // (section A's card is in the lens too when the crop holds it: its context text leaves with the datum's)
    const rf = L.room.frame({draw: all, textK, cue, datum: {...dm, copy: ctxT}, cardTextK: L.cardInLens ? {a: ctxT} : null});
    Object.assign(nodes, rf.nodes);
    // (in the lens the dock's tray comes in just before the old value moves to it — not an empty tray for the whole
    // isolate beat; until then that part of the lens shows the board under the plate)
    const lensDock = ease.inOutCubic(seg(u, W.move[0] - 0.035, W.move[0]));
    Object.assign(nodes, L.lz.frame({draw: all, textK: lensT, cue, datum: {...dm, dockK: L.dockCopy ? 1 : Math.max(lensDock, chip), copy: lensT}}).nodes);
    if (L.dockCopy) {
      // (the substitution, a dip hand-over: the plate's old value dims to 0.3; at one instant it leaves the plate and
      // enters the dock as the record captioned "was", while the plate takes the new value — both come in at 0.3 and
      // brighten. The old value is legible in one place at a time; before the substitution the dock tray is empty)
      const sw = u >= W.newIn[0];
      const inK = sw ? 0.3 + 0.7 * newIn : 0;
      nodes['lz-refs-a-v-before'] = {opacity: r(sw ? 0 : lensT * (1 - 0.7 * seg(u, W.was[0], W.newIn[0])), 3), transform: 'translate(0 0)'};
      nodes['lz-refs-a-v-after'] = {opacity: r(lensT * inK, 3), transform: 'translate(0 0)'};
      nodes['lz-dock-v'] = {opacity: r(lensT * inK, 3)};
      nodes['lz-was'] = {opacity: r(lensT * inK, 3)};
      // (the context, hidden while the lens holds the datum, shows the same state when it comes back: the record in the
      // dock, the new value on the plate; the plate's old value never travels at the plate size)
      nodes['rm-refs-a-v-before'] = {opacity: r(sw ? 0 : ctxT, 3), transform: 'translate(0 0)'};
      nodes['rm-dock-v'] = {opacity: r(sw ? ctxT : 0, 3)};
      nodes['rm-was'] = {opacity: r(sw ? ctxT : 0, 3)};
    }
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
        reader: R.reader,
        problems: L.problems,
        refsSize: L.C.refsSize,
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
    slug: 'review-01-inspect',
    title: 'Identifying a ground — inspecting which section label A is attached to and substituting it',
    titleEs: 'Identificación de motivo — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Identificación de motivo',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The generic examination room after the magnifier located the sections: the magnifier laid back on the table, both label cards on the board ("Factual discrepancy" ● and "Legal question raised" ◆, neutral labels supplied by the party, glyph and placeholder bars only), each with its reference plate naming the section it is attached to (as supplied) and its line to that numbered placeholder section. A lens (a window with a rim, distinct from the panel) opens on label A\'s reference plate (a real enlarged copy of the same room coordinates) and one supplied datum is substituted: which section label A is attached to. The old value is kept, unchanged, in a dock as "was"; the new value arrives (labels hidden: the mark slides to its new sheet on the plate); only its dependent geometry follows: label A\'s line slides to the newly named section. Label B does not move. The context returns with a neutral changed-datum marker. Illustrative; no section is said to be wrong, nothing is evaluated, neither label is preferred and no outcome is drawn.',
    tags: ['review', 'challenge as supplied', 'inspect', 'lens', 'labels', 'sections', 'substitution', 'changed datum', 'placeholder text', 'as supplied', 'room plan'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/identificacion-motivo.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
