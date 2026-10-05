/**
 * LAW-0296 — Preguntas de contraste · inspect
 *
 * Storyboard (the context is the state produced by the lining up: the generic
 * hearing room seen from above, the question and the two answers side by side
 * on the rail, the supplied differing words marked the same way in both):
 *  0.00–0.20  build: the room fills its area beside a text panel. One answer's
 *             card (the focus, as supplied) carries its supplied SOURCE as its
 *             last line — the BEFORE value (● previous answer, say).
 *  0.20–0.45  isolate: a frame settles on that card; the panel steps out and the
 *             context steps back; a lens opens in the freed space with a REAL
 *             enlarged copy of the same room coordinates (the two lined-up
 *             answers with their marked words, and the floor in front). The
 *             source text leaves the context as its enlarged copy arrives.
 *  0.45–0.75  substitute ONE datum: the old value moves, unchanged (no strike,
 *             no correction mark), to a dock in front of the card as "was …";
 *             the supplied AFTER value comes in; only its dependent state
 *             follows: the card's cue (● ↔ ◆, equal weight).
 *  0.75–1.00  return: the lens closes onto the context with the new value on
 *             the card, the old value docked in front of it (traceable) and a
 *             neutral changed-datum marker (Δ). Seeking back restores it exactly.
 * Nothing is assessed: the marked words are only a textual difference between two
 * supplied answers — no inconsistency, contradiction, credibility, impeachment,
 * error, weight or outcome; neither answer is marked as wrong.
 * @module animations/hearings/LAW-0296
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {measure} from '../../core/text.js';
import {str, int, num, obj, oneOf} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {localised, pxPerUnit, speakerChipNode, R2, searchLayout, overlaps, placeLabels, FONT} from './kits/apertura-audiencia.js';
import {composeIt, itRoom, personBox, fitM} from './kits/interrogatorio-directo.js';
import {pcFields, PC_EN, PC_ES, resolvePc, pcRows, pcRowNode, spanBoxes, highlightNode} from './kits/preguntas-contraste.js';

const ID = 'LAW-0296';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.18, 0.205], panelOut: [0.185, 0.205], ctxOut: [0.205, 0.209], back: [0.209, 0.235], open: [0.212, 0.24],
  // (no strike: the old value is not corrected, only moved to its dock)
  strike: [2, 2.1], move: [0.48, 0.55], chip: [0.53, 0.55], was: [0.54, 0.555], newIn: [0.555, 0.585], cue: [0.6, 0.64],
  close: [0.728, 0.744], forward: [0.744, 0.758], ctxIn: [0.758, 0.761],
  frameOut: [0.735, 0.75], panelIn: [0.765, 0.79], tether: [0.78, 0.84], marker: [0.8, 0.83],
};

const STRINGS = {
  en: {was: 'was'},
  es: {was: 'antes'},
};

const CAT = pcFields;
const CAT_EN = PC_EN;
const CAT_ES = PC_ES;
const OWN_EN = {
  focusItem: 1,
  beforeState: 'previous',
  beforeValue: 'Previous answer (as supplied)',
  afterValue: 'Current answer (as supplied)',
  contextLabels: {context: 'The room after the two answers lined up (as supplied)', marker: 'Changed: one datum, the source of the second turn'},
};
const OWN_ES = {
  focusItem: 1,
  beforeState: 'previous',
  beforeValue: 'Respuesta previa (según lo aportado)',
  afterValue: 'Respuesta actual (según lo aportado)',
  contextLabels: {context: 'La sala con las dos respuestas lado a lado (según lo aportado)', marker: 'Cambio: un dato aportado, la fuente del segundo turno'},
};
const EN = {...CAT_EN, ...OWN_EN};
const ES = {...CAT_ES, ...OWN_ES};

const sceneSchema = {
  ...CAT,
  focusTarget: oneOf('Detail that is enlarged and substituted: the supplied source of one answer on the rail (its cue follows it)', ['answer-source']),
  focusItem: int('Index in `statements` of the answer whose supplied source is substituted', 0, 4),
  beforeState: oneOf('Which supplied source the BEFORE value is: "previous" (● previous answer) or "current" (◆ current answer); the AFTER value takes the other one', ['previous', 'current']),
  beforeValue: str('Source shown on the card before the substitution (as supplied)', 50),
  afterValue: str('Source shown on the card after the substitution (the alternative datum, as supplied)', 50),
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
  focusTarget: 'answer-source',
  detailGeometry: {zoom: 2.6, placement: 'auto'},
};

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 800], portrait: [950, 1400]},
  layout(ctx) {
    const P0 = localised(ctx, EN, ES);
    // the focus answer: its supplied source is the BEFORE value; the AFTER value is the other source
    const before = P0.beforeState === 'current' ? 'current' : 'previous';
    const after = before === 'previous' ? 'current' : 'previous';
    const FORM = {previous: 'open', current: 'bounded'};
    const P = {...P0, states: {...P0.states, [before]: P0.beforeValue, [after]: P0.afterValue}};
    const R0 = resolvePc(ctx, P);
    const fi = Math.min(R0.items.length - 1, P.focusItem);
    const R = {...R0, items: R0.items.map(it => (it.i === fi ? {...it, source: before, form: FORM[before]} : it))};
    // (both sources of the focus answer appear in the legend: before and after)
    const RL = {...R, items: [...R.items, {...R.items[fi], i: -1, source: after, form: FORM[after]}]};
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
      rows.push(...pcRows(RL, P));
      rows.push({kind: 'legend', glyphKind: 'diffmark', text: P.labels.difference, name: 'lg-diff'});
      R.exhibits.forEach((tx, i) => rows.push({kind: 'legend', glyphKind: 'exhibit', seqNumber: String(i + 1), numberFill: '#ffffff', text: tx, name: `lg-ex${i}`}));
      rows.push({kind: 'text', text: P.labels.sequence, name: 'seq-caption'});
      rows.push({kind: 'legend', glyphKind: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
      rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    }
    // the dock in front of the card ("was" + the old value, at the card's text size)
    const dockFor = (G, Ft) => {
      if (!showKey || !G.stateLine) return null;
      const padX = Ft * 0.5, padY = Ft * 0.3, gap = Ft * 0.35;
      const wasFit = fitM(ctx.t.was, {maxWidth: 400, size: Ft, minSize: Ft, maxLines: 1, weight: 500});
      const fb = G.stateLine.fits.before;
      const s = G.slots[fi];
      // inline ("was" + old value) when it is no wider than the card, else stacked ("was" above the old value)
      const inlineW = padX * 2 + wasFit.width + gap + fb.width;
      const stack = inlineW > s.w;
      const w = stack ? padX * 2 + Math.max(wasFit.width, fb.width) : inlineW;
      const hh = stack ? wasFit.height + gap + fb.height + padY * 2 : fb.height + padY * 2;
      return {x: Math.max(14, Math.min(G.W - 14 - w, s.cx - w / 2)), y: G.yF + 10, w, h: hh, padX, padY, gap, wasFit, wasW: wasFit.width, stack};
      void fb;
    };
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    const minSide = 0.42 * shortD;
    const gap = 26;
    const zoomMax = P.detailGeometry.zoom;
    // ---- the lens for a composed room: where it opens, how far the context steps back, the crop and the zoom
    const lensPlan = (C, roomBox) => {
      const G = C.G, k = C.k;
      const Ft = G.Ft || 20;
      const dock = dockFor(G, Ft);
      const s = G.slots[fi];
      // the crop needed (template): the card, the table's front edge and the dock in front of it
      const x0 = Math.min(s.x, dock ? dock.x : s.x) - 6, x1 = Math.max(s.x + s.w, dock ? dock.x + dock.w : s.x + s.w) + 6;
      const needT = {x: x0, y: s.y - 14, w: x1 - x0, h: (dock ? dock.y + dock.h : G.yF) + 16 - (s.y - 14)};
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
            if (Math.min(zoomMax, rg.w / needD.w, rg.h / needD.h) >= 1.55 && Math.min(rg.w, rg.h) >= target) { ok = true; break; }
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
        if (zm < 1.55 || Math.min(dest.w, dest.h) < 0.37 * shortD) problems.push('lens-space');
      }
      const pl = P.detailGeometry.placement;
      const ax = pl === 'left' ? 0 : pl === 'right' ? 1 : 0.5;
      // crop (template): the lens box at this zoom, centred on the needed crop, inside the room
      const crop = {w: dest.w / Z, h: dest.h / Z};
      crop.x = clamp(needT.x + needT.w / 2 - crop.w / 2, -G.t, G.W + G.t - crop.w);
      crop.y = clamp(needT.y + needT.h / 2 - crop.h / 2, -G.t, G.H + G.t - crop.h);
      // no other card is cut by the crop (nor crossed by the source frame): it narrows to the gaps beside the card
      // (first try taking a cut neighbour in whole, if the lens can still magnify >= 1.55x; else narrow to the gap)
      for (const it of R.items) {
        if (it.i === fi) continue;
        const nb = G.slots[it.i];
        if (!overlaps(nb, crop, 2) || (nb.x >= crop.x - 1 && nb.x + nb.w <= crop.x + crop.w + 1)) continue;
        const wider = {x: Math.min(crop.x, nb.x - 12), w: 0};
        wider.w = Math.max(crop.x + crop.w, nb.x + nb.w + 12) - wider.x;
        // (a neighbour over the needed area's span — the dock is wider than the card — is always taken in whole)
        const overNeed = nb.x < needT.x + needT.w && nb.x + nb.w > needT.x;
        if ((overNeed || Math.min(zoomMax * k, region.w / wider.w, region.h / crop.h) >= 1.55 * k) && wider.x >= -G.t && wider.x + wider.w <= G.W + G.t) { crop.x = wider.x; crop.w = wider.w; continue; }
        if (nb.x + nb.w <= s.cx) { const nx = Math.min(needT.x, nb.x + nb.w + 6); crop.w -= nx - crop.x; crop.x = nx; } else crop.w = Math.max(needT.x + needT.w, nb.x - 6) - crop.x;
      }
      // the window keeps its size: when the zoom drops (a wider crop), the crop grows in height around the card
      {
        const Zw = Math.min(zoomMax * k, region.w / crop.w, region.h / crop.h);
        if (crop.h * Zw < minSide && crop.w * Zw >= minSide * 0.6) {
          const hh = Math.min(minSide / Zw, region.h / Zw);
          crop.y = clamp(needT.y + needT.h / 2 - hh / 2, -G.t, G.H + G.t - hh);
          crop.h = hh;
        }
      }
      // nobody is cut by the crop: it narrows (or stops above) to leave every person out
      // (participant chips count like people: the crop's outline never crosses a label)
      const toT = b => ({x: (b.x - C.ox) / k - 6, y: (b.y - C.oy) / k - 6, w: b.w / k + 12, h: b.h / k + 12});
      const people = [...R.speakers.map(sp => personBox(sp.index === R.questioner ? G.qHome : G.seats[sp.index])), ...C.chips.filter(Boolean).map(ch => toT(ch.box)), ...(C.badges || []).map(bd => toT(bd.box))];
      for (const pb of people) {
        if (!overlaps(pb, crop, 2)) continue;
        if (pb.y >= needT.y + needT.h) crop.h = Math.max(needT.y + needT.h - crop.y, pb.y - 4 - crop.y);
        else if (pb.x + pb.w <= needT.x) { const nx = pb.x + pb.w + 4; crop.w -= nx - crop.x; crop.x = nx; }
        else if (pb.x >= needT.x + needT.w) crop.w = pb.x - 4 - crop.x;
        else problems.push('lens-crop-person');
      }
      // after the height growth and the person trims, a final pass: the crop's outline crosses no neighbour card
      // (a neighbour inside the crop is kept whole; one cut by it narrows the crop to the gap beside the card)
      for (const it of R.items) {
        if (it.i === fi) continue;
        const nb = G.slots[it.i];
        if (!overlaps(nb, crop, 2) || (nb.x >= crop.x + 1 && nb.x + nb.w <= crop.x + crop.w - 1 && nb.y >= crop.y + 1 && nb.y + nb.h <= crop.y + crop.h - 1)) continue;
        if (nb.x < needT.x + needT.w && nb.x + nb.w > needT.x) { const x0n = Math.min(crop.x, nb.x - 12); crop.w = Math.max(crop.x + crop.w, nb.x + nb.w + 12) - x0n; crop.x = x0n; continue; }
        if (nb.x + nb.w <= s.cx) { const nx = Math.min(needT.x, nb.x + nb.w + 6); crop.w -= nx - crop.x; crop.x = nx; } else crop.w = Math.max(needT.x + needT.w, nb.x - 6) - crop.x;
      }
      // stacked (tall frames): the window should span the frame's width — the crop takes in whole neighbour cards, one
      // at a time, as long as nobody enters it and the lens still magnifies >= 1.55x
      if (!wide && ctx.view.shape === 'portrait') {
        const order = [...R.order].sort((a0, b0) => Math.abs(G.slots[a0].cx - s.cx) - Math.abs(G.slots[b0].cx - s.cx));
        for (const i of order) {
          if (i === fi) continue;
          if (Math.min(zoomMax * k, region.w / crop.w, region.h / crop.h) * crop.w >= 0.9 * region.w) break;
          const nb = G.slots[i];
          if (nb.x >= crop.x - 1 && nb.x + nb.w <= crop.x + crop.w + 1) continue;
          const x0n = Math.min(crop.x, nb.x - 12), x1n = Math.max(crop.x + crop.w, nb.x + nb.w + 12);
          const cand = {x: x0n, y: crop.y, w: x1n - x0n, h: crop.h};
          let Zc = Math.min(zoomMax * k, region.w / cand.w, region.h / cand.h);
          // (the window keeps its height: the crop grows down over the free floor in front of the rail)
          if (cand.h * Zc < 0.39 * shortD) { cand.h = Math.min(G.H + G.t - cand.y, 0.39 * shortD / Zc); Zc = Math.min(zoomMax * k, region.w / cand.w, region.h / cand.h); }
          if (Zc < 1.55 * k || Math.min(cand.w, cand.h) * Zc < 0.38 * shortD) continue;
          if (cand.x < -G.t || cand.x + cand.w > G.W + G.t) continue;
          if (people.some(pb => overlaps(pb, cand, 2))) continue;
          crop.x = cand.x; crop.w = cand.w; crop.h = cand.h;
        }
      }
      // the crop always holds the whole needed area (the card with its dock): a taller card lowers the zoom instead
      if (crop.h < needT.h) { crop.y = needT.y; crop.h = needT.h; }
      if (crop.w < needT.w) { crop.x = needT.x; crop.w = needT.w; }
      if (crop.y > needT.y) { crop.h += crop.y - needT.y; crop.y = needT.y; }
      if (crop.y + crop.h < needT.y + needT.h) crop.h = needT.y + needT.h - crop.y;
      // a crop narrowed to the card's gaps is shown larger (within the region and the supplied zoom)
      const Zfit = Math.min(zoomMax * k, region.w / crop.w, region.h / crop.h);
      if (Zfit > Z || crop.w * Z > region.w || crop.h * Z > region.h) { Z = Zfit; zm = Z / k; }
      dest.w = crop.w * Z;
      dest.h = crop.h * Z;
      dest.x = region.x + (region.w - dest.w) * ax;
      dest.y = wide ? clamp(plan.y + plan.h / 2 - dest.h / 2, region.y, region.y + region.h - dest.h) : region.y + (region.h - dest.h) * (pl === 'bottom' ? 1 : 0);
      if (Math.min(dest.w, dest.h) < 0.37 * shortD - 0.5) problems.push('lens-small');
      if (zm < 1.5) problems.push('lens-zoom');
      return {dock, needT, wide, anchor, s: sc, region, zm, Z, dest, crop, problems};
    };
    // standing floors: >= 60 px off 1:1; >= 55 px at 1:1 (composed with a margin) — only when nothing composes at 1:1
    // does the stress floor of 45 px apply
    const search = minPersonPx => searchLayout(ctx, P, R, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx,
      compose: (box, F, scale) => {
        // (the questioner stands lower, back from the rail: the floor in front of the cards stays free for the dock and
        // the lens crop; the context is the state after the exchange, so nobody needs to reach the tray)
        const C = composeIt(ctx, P, R, box, F, {scale, chips: false, cardText: showKey, qDrop: ctx.view.shape === 'portrait' ? 210 : 130, besideDrop: ctx.view.shape === 'portrait' ? 190 : 110, stateLineFor: showKey ? fi : null, stateTexts: {before: P0.beforeValue, after: P0.afterValue},
          // the card's front edge, the dock and the marker's place stay free of labels
          reserve: G => {
            const s = G.slots[fi];
            return [{x: s.x - 30, y: G.yF, w: s.w + 200, h: 30 + (showKey ? (F / (box.w / (G.W + 36))) * 2.6 : 0)}];
          }});
        // number badges beside each participant (keyed to the panel; the witness's may stand beyond the box's wall)
        C.badges = [];
        C.badgeR = F * 0.78;
        if (showKey) {
          const G = C.G;
          const posOf = i => (i === R.questioner ? G.qHome : G.seats[i]);
          const bR = C.badgeR;
          const res = placeLabels(R.speakers.map(sp => ({key: `b${sp.index}`, w: bR * 2, h: bR * 2, at: C.toD(posOf(sp.index)), rad: C.rad, rim: C.rad * 0.8, prefer: sp.index === R.questioner ? 150 : sp.index === R.witness ? 90 : G.seats[sp.index].angle, ...(sp.index === R.witness ? {maxGap: 72, gaps: [4, 12, 24, 36, 48, 60, 72]} : {maxGap: 34, gaps: [4, 8, 12, 16, 24, 34]})})),
            {bounds: C.bounds, circles: C.people, boxes: C.equip, ellipse: C.ellipse || {c: {x: -1e5, y: -1e5}, a: 1, b: 1}, anchors: R.speakers.map(sp => C.toD(posOf(sp.index)))});
          C.badges = res.labels;
          for (const f of res.fails) C.problems.push(`badge-${f}`);
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
    const {dock, dest, crop, Z, zm, s, anchor, wide} = C.lens;
    const problems = [...best.problems];
    // (labels hidden: no state text, the cue alone changes)
    let datum = {i: fi, before: FORM[before], after: FORM[after], cueOnly: true};
    if (dock && G.stateLine) {
      const fb = G.stateLine.fits.before;
      datum = {i: fi, before: FORM[before], after: FORM[after], fits: G.stateLine.fits, dock, lineW: fb.lines.map(ln => measure(ln, fb.size, fb.weight, 'sans'))};
    }
    const room = itRoom(ctx, G, {prefix: 'rm', R, Ft: G.Ft, datum});
    // the supplied differing words, marked the same way in both answers (context and lens copies alike)
    const hl = showKey && R.prevI !== null && R.curI !== null ? {prev: spanBoxes(G, R.prevI, P.difference.previous), cur: spanBoxes(G, R.curI, P.difference.current)} : {prev: null, cur: null};
    const inCrop = b => b.x >= crop.x + 1 && b.y >= crop.y + 1 && b.x + b.w <= crop.x + crop.w - 1 && b.y + b.h <= crop.y + crop.h - 1;
    const lz = itRoom(ctx, G, {prefix: 'lz', R, Ft: G.Ft, datum, keep: inCrop});
    const cropD = C.bD(crop);
    // (in the lens, a card's marked words are drawn only when the card itself is in the crop)
    const lzHl = {prev: R.prevI !== null && inCrop(G.slots[R.prevI]), cur: R.curI !== null && inCrop(G.slots[R.curI])};
    // the changed-datum marker: right of the card, level with its state line
    const sl = G.slots[fi];
    // (in front of the table, right of the dock: on free floor, off every card)
    const markerT = dock ? {x: Math.min(G.W - 30, dock.x + dock.w + 30), y: dock.y + dock.h / 2} : {x: Math.min(G.W - 30, sl.cx + 40), y: G.yF + 30};
    const markerD = C.toD(markerT);
    // the lens never passes over a person while it grows: it starts once the stepping-back context has cleared the
    // window's whole final rectangle (shadow and rim included); the context copy's hand-over moves with it
    const lensBox = {x: dest.x - 4, y: dest.y - 4, w: dest.w + 14, h: dest.h + 18};
    const peopleD = R.speakers.map(sp => C.bD(personBox(sp.index === R.questioner ? G.qHome : G.seats[sp.index])));
    // (and never over the context room itself: no text of the context lies under a growing window)
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
    return {P, R, F, px, C, G, k, room, lz, lay, dock, before, after, fi, hl, lzHl, dest, crop, cropD, Z, zm, s, anchor, markerD, markerR: 20, problems, wide, showKey, minSide, shortD, openW, ctxOutW, shiftW, datum};
  },
  build(ctx, L) {
    const {C} = L;
    const th = ctx.theme;
    const panel = L.lay ? L.lay.rows.map(m => pcRowNode(ctx, m, {name: m.name, look: L.R.speakers[0].look})) : [];
    const ctxGroup = g({name: 'ctx', transform: 'translate(0 0) scale(1)'},
      g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(C.k, 5)})`}, L.room.node, highlightNode(ctx, 'hl-prev', L.hl.prev, C.k), highlightNode(ctx, 'hl-cur', L.hl.cur, C.k)),
      C.chips.map((ch, i) => (ch ? speakerChipNode(ctx, ch.m, ch.box, ch.lead, {name: `lab${i}`}) : null)),
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
          g({name: 'lens-content', transform: `${T(d.x - L.crop.x * L.Z, d.y - L.crop.y * L.Z)} scale(${r(L.Z, 5)})`}, L.lz.node, L.lzHl.prev ? highlightNode(ctx, 'lz-hl-prev', L.hl.prev, L.Z) : null, L.lzHl.cur ? highlightNode(ctx, 'lz-hl-cur', L.hl.cur, L.Z) : null)),
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
    const strike = seg(u, ...W.strike), move = ease.inOutCubic(seg(u, ...W.move)), chip = seg(u, ...W.chip), was = seg(u, ...W.was);
    const newIn = seg(u, ...W.newIn);
    const cue = ease.inOutCubic(seg(u, ...W.cue));
    // context texts (cards, exhibit numbers, chips) stay while they are still at their floor and leave just before
    const floor = L.F * L.px >= 19.5 ? 19.5 : 16;
    const textK = sc >= 0.9999 ? 1 : clamp((L.F * L.px * sc - Math.min(floor, L.F * L.px - 0.01)) / 0.6);
    // one copy of the datum at a time: the context copy leaves as the lens copy arrives, and comes back after it
    const ctxT = u < 0.5 ? Math.min(1 - seg(u, ...L.ctxOutW), textK) : seg(u, ...W.ctxIn);
    const lensT = clamp((open - 0.3) / 0.3);
    const cards = {};
    R.items.forEach(it => { cards[it.i] = {open: 1, text: 1, shown: 1, dx: 0}; });
    const q = {pose: {x: G.qHome.x, y: G.qHome.y, deg: 180, walk: 0, phase: 0, seated: 0}, reach: null, reachL: null};
    const dm = {strike, move, chip, was, newIn, cue};
    Object.assign(nodes, L.room.frame({clockDeg: 20, q, w: null, cards, slips: {}, textK, datum: {...dm, copy: ctxT}}).nodes);
    // (the lens copy's texts arrive with the lens, never while it is still growing below their size)
    Object.assign(nodes, L.lz.frame({clockDeg: 20, q, w: null, cards, slips: {}, textK: lensT, datum: {...dm, copy: lensT}}).nodes);
    // context chips scale with the context: each stays while its text is still at its floor, and fades just before
    const chipOp = sc >= 0.9999 ? 1 : r(textK, 3);
    C.chips.forEach((ch, i) => { if (ch) { nodes[`lab${i}`] = {opacity: chipOp}; nodes[`lab${i}-text`] = {opacity: 1}; } });
    (C.badges || []).forEach(bd => { nodes[bd.key] = {opacity: chipOp}; });
    // the marked words: shown with the cards (context copy with the context's texts, lens copy with the lens)
    if (L.hl.prev) nodes['hl-prev'] = {opacity: r(textK, 3)};
    if (L.hl.cur) nodes['hl-cur'] = {opacity: r(textK, 3)};
    if (L.lzHl.prev && L.hl.prev) nodes['lz-hl-prev'] = {opacity: r(lensT, 3)};
    if (L.lzHl.cur && L.hl.cur) nodes['lz-hl-cur'] = {opacity: r(lensT, 3)};
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
    const datumState = u < W.move[0] ? 'before' : newIn >= 1 ? 'after' : 'changing';
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    return {
      nodes,
      semantic: {
        beat,
        datum: datumState,
        before: L.before,
        cueState: cue >= 1 ? L.after : cue > 0 ? 'changing' : L.before,
        lensOpen: r(open, 3),
        lensStartU: r(L.openW[0], 4),
        contextScale: r(sc, 3),
        ctxCopy: r(ctxT, 3),
        lensCopy: r(lensT, 3),
        bothCopies: ctxT >= 0.15 && lensT >= 0.15 && open > 0.01,
        strike: r(strike, 3),
        docked: r(move, 3),
        newShown: r(newIn, 3),
        focusItem: L.fi,
        after: L.after,
        markerText: L.P.contextLabels.marker,
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
    slug: 'hearings-04-inspect',
    title: 'Contrasting questions — inspecting the supplied source of one answer and substituting it',
    titleEs: 'Preguntas de contraste — Inspección y cambio de un dato',
    category: 'hearings',
    categoryName: 'Audiencias y desarrollo del juicio',
    motif: 'Preguntas de contraste',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The generic hearing room after two answers lined up on the rail, the supplied differing words marked the same way in both. A lens opens on one answer\'s card (a real enlarged copy of the same room coordinates, with the other answer beside it) and one supplied datum is substituted: the source of that answer (previous ↔ current). The old value moves, unchanged, to a dock as "was"; the new value arrives; only its dependent state follows (the card\'s cue). The context returns with a neutral changed-datum marker. Fictional and illustrative; nothing is assessed.',
    tags: ['hearing', 'contrasting questions', 'inspect', 'lens', 'previous answer', 'current answer', 'textual difference', 'substitution', 'changed datum', 'turn rail', 'witness box', 'room plan'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/hearings/kits/preguntas-contraste.js', 'src/animations/hearings/kits/interrogatorio-directo.js', 'src/animations/hearings/kits/exposicion-inicial.js', 'src/animations/hearings/kits/hearings-art.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
