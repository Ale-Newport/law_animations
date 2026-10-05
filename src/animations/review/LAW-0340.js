/**
 * LAW-0340 — Revisión de documentos · inspect
 *
 * Storyboard (the context is the state the action produced: the filing room seen from above, folder A — the original
 * file with the placeholder decision sheet — and folder B — the new pieces — open on either side of the neutral
 * divider; one piece, X, lies on top of folder A with the blue strip of the original material; on the board under the
 * counter lies X's RECORD plate: a strip swatch, X's label and the supplied mark, BEFORE value "original material"):
 *  0.00–0.20  build: the room and its record plate beside the text panel; X lies on folder A's stack.
 *  0.20–0.45  isolate: a frame settles on the record plate; the panel steps out and the context dims in place; a lens
 *             opens in the freed space with a REAL enlarged copy of the plate (the same room coordinates, ≥ 1.6×). The
 *             plate's value leaves the context as its enlarged copy arrives — one legible copy at a time.
 *  0.45–0.75  substitute ONE datum: the old value moves down into the dock under the plate, captioned "was" (never
 *             struck, never marked wrong); the supplied AFTER value comes in ("proposed additional material") and the
 *             swatch turns from blue to amber. The lens closes onto the plate with the new value; only the dependent
 *             geometry follows in the context: X's strip turns amber and X is lifted from folder A over the divider into
 *             folder B, on top of the new pieces.
 *  0.75–1.00  return: the panel comes back; the old value stays docked (traceable) and a neutral changed-datum marker
 *             (Δ) appears beside X. Seeking back restores the old value and X's place exactly. Nothing is assessed: no
 *             admissibility rule, validity, time limit or outcome; jurisdiction unspecified.
 * @module animations/review/LAW-0340
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {roundRectPath} from '../../core/geometry.js';
import {str, num, obj, oneOf} from '../../schemas/fields.js';
import {inspectFields} from '../../schemas/fields.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {pxPerUnit, R2, centreShiftY, textAt} from '../hearings/kits/apertura-audiencia.js';
import {searchSa, fitSa, hasLoneWord} from './kits/solicitud-autorizacion.js';
import {rdFields, RD_EN, RD_ES, localisedRd, resolveRd, rdRoom, composeRd, rdRowNode, laneColors, sheetArt, stripeArt, INK} from './kits/revision-de-documentos.js';

const ID = 'LAW-0340';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], ret: [0.75, 1]};
const W = {
  frame: [0.19, 0.21], panelOut: [0.19, 0.21], ctxOut: [0.21, 0.214], open: [0.212, 0.25], copyIn: [0.228, 0.25],
  oldOut: [0.48, 0.54], was: [0.53, 0.55], newIn: [0.555, 0.585], swatch: [0.5, 0.585],
  copyOut: [0.62, 0.632], close: [0.62, 0.65], ctxIn: [0.65, 0.654], frameOut: [0.64, 0.655],
  restripe: [0.656, 0.672], move: [0.672, 0.74], panelIn: [0.75, 0.775], marker: [0.78, 0.81],
};

const STRINGS = {en: {was: 'was'}, es: {was: 'antes'}};

const OWN_EN = {
  focusTarget: 'piece-mark',
  focusPiece: 'X (fictional)',
  beforeValue: 'Mark: original material (as supplied)',
  afterValue: 'Mark: proposed additional material (as supplied)',
  detailGeometry: {zoom: 3, placement: 'auto'},
  outcomes: {a: 'Before: X lies with the original file in folder A', b: 'After: X lies in folder B, apart from the original file'},
  objectLabels: {record: 'Record plate of piece X on the board', calendar: 'Wall calendar (no date marked)'},
  contextLabels: {context: 'The room after the filing (as supplied)', marker: 'Changed: the supplied mark of X'},
};
const OWN_ES = {
  focusTarget: 'piece-mark',
  focusPiece: 'X (ficticia)',
  beforeValue: 'Marca: material original (según lo aportado)',
  afterValue: 'Marca: material adicional propuesto (según lo aportado)',
  detailGeometry: {zoom: 3, placement: 'auto'},
  outcomes: {a: 'Antes: X está con el expediente original en la carpeta A', b: 'Después: X está en la carpeta B, aparte del original'},
  objectLabels: {record: 'Placa de registro de la pieza X en el tablero', calendar: 'Calendario de pared (sin fechas marcadas)'},
  contextLabels: {context: 'La sala tras el archivo (según lo aportado)', marker: 'Cambio: la marca aportada de X'},
};
const EN = {...RD_EN, ...OWN_EN};
const ES = {...RD_ES, ...OWN_ES};

const inf = inspectFields(['piece-mark']);
const sceneSchema = {
  ...rdFields,
  ...inf,
  focusTarget: oneOf('Detail that is enlarged and substituted: the supplied mark on piece X\'s record plate; only X\'s strip and place (which folder it lies in) follow it', ['piece-mark']),
  focusPiece: str('Label of the inspected piece X (fictional)', 48),
  beforeValue: str('Mark on the record plate before the substitution (as supplied; X lies with the original file)', 90),
  afterValue: str('Mark after the substitution (the alternative datum, as supplied; X then lies in folder B)', 90),
  detailGeometry: obj('Lens geometry', {
    zoom: num('Largest magnification of the lens (never below 1.6 in practice)', 1.6, 4),
    placement: oneOf('Alignment of the lens inside the space it opens in', ['auto', 'left', 'right', 'top', 'bottom']),
  }),
  outcomes: obj('Captions of X\'s place before and after the substitution (as supplied; nothing inferred)', {
    a: str('Caption of the place before', 90),
    b: str('Caption of the place after', 90),
  }, ['a', 'b']),
  objectLabels: obj('Captions of the room objects in the legend', {
    record: str('Caption for the record plate', 80),
    calendar: str('Caption for the wall calendar (a fixture only)', 70),
  }, ['record', 'calendar']),
  contextLabels: obj('Labels for the context view', {
    context: str('Context caption', 80),
    marker: str('Label of the changed-datum marker', 70),
  }, ['context', 'marker']),
};

const defaultParams = {...EN};
/** The localised defaults (tests resolve what a locale-'es' render shows). */
export const LOCALES = {en: EN, es: ES};

/** The record plate's layout (template units, relative to the board's top-left): swatch, label, value; the dock under it. */
function recordLayout(fits, Ft) {
  const pad = Math.max(12, Ft * 0.5);
  const sw = Math.max(14, Ft * 0.6);
  const m = 8;
  if (!fits) {
    const plate = {x: m, y: m, w: 200, h: 130};
    const dock = {x: m, y: plate.y + plate.h + 8, w: 200, h: 60};
    return {w: 200 + 2 * m, h: dock.y + dock.h + m, plate, dock, sw, pad, text: {x: plate.x + pad + sw + 12, y: plate.y + pad}};
  }
  const textW = Math.max(fits.label.width, fits.before.width, fits.after.width);
  const valH = Math.max(fits.before.height, fits.after.height);
  const plate = {x: m, y: m, w: pad + sw + 12 + textW + pad, h: pad + fits.label.height + Ft * 0.45 + valH + pad};
  const dockW = Math.max(plate.w, fits.was.width + 12 + fits.dock.width + 2 * pad);
  plate.w = dockW;
  const dock = {x: m, y: plate.y + plate.h + 8, w: dockW, h: Math.max(fits.was.height, fits.dock.height) + 2 * Math.max(8, Ft * 0.35)};
  return {w: dockW + 2 * m, h: dock.y + dock.h + m, plate, dock, sw, pad, valY: plate.y + pad + fits.label.height + Ft * 0.45, text: {x: plate.x + pad + sw + 12, y: plate.y + pad}};
}

const scene = {
  sizes: {landscape: [1690, 760], square: [950, 860], portrait: [950, 1400]},
  layout(ctx) {
    const P = localisedRd(ctx, EN, ES);
    const R = resolveRd(ctx, P);
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const rows = [];
    if (showKey) {
      rows.push({kind: 'heading', text: P.labels.heading, name: 'heading'});
    }
    if (showAll) rows.push({kind: 'text', text: P.contextLabels.context, name: 'ctx-caption'});
    if (showKey) {
      rows.push({kind: 'legend', glyphKind: 'folderA', text: P.routes.original, name: 'lg-a'});
      rows.push({kind: 'legend', glyphKind: 'decision', text: P.decisions.title, name: 'lg-dec'});
      rows.push({kind: 'legend', glyphKind: 'folderB', text: P.routes.additional, name: 'lg-b'});
      rows.push({kind: 'legend', glyphKind: 'piece', text: `${P.labels.pieces}: ${R.pieces.map(q => q.label).join(' · ')}`, name: 'lg-pieces'});
      rows.push({kind: 'legend', glyphKind: 'divider', text: P.routes.divider, name: 'lg-divider'});
      rows.push({kind: 'legend', glyphKind: 'grounds', text: P.grounds, name: 'lg-grounds'});
      rows.push({kind: 'text', text: P.outcomes.a, name: 'out-a'});
      rows.push({kind: 'text', text: P.outcomes.b, name: 'out-b'});
    }
    if (showAll) {
      rows.push({kind: 'legend', glyphKind: 'sign', text: P.objectLabels.record, name: 'lg-record'});
      rows.push({kind: 'legend', glyphKind: 'calendar', text: P.objectLabels.calendar, name: 'lg-calendar'});
    }
    if (showKey) rows.push({kind: 'legend', glyphKind: 'delta', text: P.contextLabels.marker, name: 'marker-row'});
    if (showKey) rows.push({kind: 'key', text: P.labels.key, name: 'key'});
    const f = fitDesign(ctx.view, D.w, D.h);
    const shortD = Math.min(ctx.view.width, ctx.view.height) / f.scale;
    // the record's fits (template units) for a text size Ft (= F / k)
    const fitsFor = Ft => {
      if (!showKey) return null;
      const pick = (text, weight) => {
        let best = null;
        // (a compact block: the plate is near square in square and tall frames, so its enlarged copy fills the lens)
        const maxL = ctx.view.shape === 'landscape' ? 3 : 4;
        for (const q of [5.5, 6.5, 7, 8, 9, 10, 11, 12, 13, 14, 16, 19]) {
          const ft = fitSa(text, {maxWidth: Ft * q, size: Ft, minSize: Ft, maxLines: 5, weight, widow: false});
          if (ft.truncated) continue;
          if (!best) best = ft;
          if (!hasLoneWord(ft) && ft.lines.length <= maxL) return ft;
        }
        return best || fitSa(text, {maxWidth: Ft * 20, size: Ft, minSize: Ft, maxLines: 6, weight});
      };
      const label = pick(P.focusPiece, 700);
      const before = pick(P.beforeValue, 600), after = pick(P.afterValue, 600);
      const was = fitSa(ctx.t.was, {maxWidth: Ft * 8, size: Ft, minSize: Ft, maxLines: 1, weight: 500});
      const dock = fitSa(P.beforeValue, {maxWidth: Math.max(before.width, after.width) + Ft * 2, size: Ft, minSize: Ft, maxLines: 4, weight: 600});
      return {label, before, after, was, dock};
    };
    const optsFor = (k0, F) => {
      const Ft = F / k0;
      const fits = fitsFor(Ft);
      const RL = recordLayout(fits, Ft);
      return {RL, fits, Ft, o: {arr: 'row', docK: 1.6, person: false, intake: false, covers: false, sign: false, n: R.n + 1, board: {w: RL.w, h: RL.h}, boardSide: ctx.view.shape === 'square' ? 'right' : 'below', crop: 1.25}};
    };
    const composeAt = (box, F) => {
      let k0 = Math.max(0.3, box.w / 700);
      let out = null;
      for (let it = 0; it < 4; it++) {
        const q = optsFor(k0, F);
        const C = composeRd(ctx, R, box, {...q.o, align: {x: 0.5, y: 0.5}});
        out = {...C, RL: q.RL, fits: q.fits, Ft: q.Ft};
        if (Math.abs(C.k - k0) < 1e-3) break;
        k0 = C.k;
      }
      return out;
    };
    const best = searchSa(ctx, rows, {
      sizes: [22.5, 21.6, 20.7, 19.8, 19.5, 18.9, 18, 17.1, 16.4], minF: 16.4, minPersonPx: 0,
      // (a square frame puts the panel under the room: the lens then opens in that band, as wide as the frame)
      colFracs: ctx.view.shape === 'square' ? [] : [0.3, 0.35, 0.39], bandCols: [2, 3], sidePanels: ctx.view.shape === 'square' ? [] : [[0.44, 2], [0.5, 2]], bandMax: ctx.view.shape === 'square' ? 0.55 : 0.48,
      scales: [1], targetPx: 1e9, scoreOf: C => C.k * 300,
      compose: (box, F) => composeAt(box, F),
    });
    const F = best.F;
    // (labels hidden: no panel — the room keeps part of the frame free for the lens to open in)
    if (!best.lay) best.roomBox = D.w >= D.h * 1.2 ? {x: 0, y: 0, w: D.w * 0.6, h: D.h} : {x: 0, y: 0, w: D.w, h: D.h * 0.56};
    const C = composeAt(best.roomBox, F);
    const G = C.G;
    const k = C.k;
    // the record plate (template units): in the room's board
    const B = G.board, RL = C.RL, fits = C.fits;
    const at = q => ({...q, x: B.x + q.x, y: B.y + q.y});
    const pl = at(RL.plate), dk = at(RL.dock);
    const lc = laneColors(ctx);
    const plateNodes = (pre, copy) => {
      const tx = pl.x + RL.pad + RL.sw + 12;
      const vy = B.y + (RL.valY ?? (RL.plate.y + RL.pad));
      const parts = [
        h('path', {d: roundRectPath(B.x + 4, B.y + 6, B.w, B.h, 10), fill: ctx.theme.shadow}),
        h('path', {name: copy ? undefined : `${pre}-board-body`, d: roundRectPath(B.x, B.y, B.w, B.h, 10), fill: '#e9edf1', stroke: INK, 'stroke-width': 2.4}),
        g({name: `${pre}-dock`, opacity: 0}, h('path', {d: roundRectPath(dk.x, dk.y, dk.w, dk.h, 7), fill: '#f3f4f5', stroke: '#9aa4ae', 'stroke-width': 1.8})),
        h('path', {name: `${pre}-plate`, d: roundRectPath(pl.x, pl.y, pl.w, pl.h, 8), fill: '#ffffff', stroke: INK, 'stroke-width': 2.4}),
        h('rect', {name: `${pre}-sw-a`, x: r(pl.x + RL.pad), y: r(pl.y + RL.pad), width: r(RL.sw), height: r(pl.h - 2 * RL.pad), rx: 3, fill: lc.a}),
        h('rect', {name: `${pre}-sw-b`, x: r(pl.x + RL.pad), y: r(pl.y + RL.pad), width: r(RL.sw), height: r(pl.h - 2 * RL.pad), rx: 3, fill: lc.b, opacity: 0}),
      ];
      if (fits) {
        parts.push(g({name: `${pre}-label`}, textAt(fits.label, tx, pl.y + RL.pad, INK)));
        parts.push(g({name: `${pre}-v-before`, transform: 'translate(0 0)'}, textAt(fits.before, tx, vy, INK)));
        parts.push(g({name: `${pre}-v-after`, opacity: 0}, textAt(fits.after, tx, vy, INK)));
        const dy0 = dk.y + Math.max(8, C.Ft * 0.35);
        parts.push(g({name: `${pre}-was`, opacity: 0}, textAt(fits.was, dk.x + RL.pad, dy0, '#57606a', {italic: true}), textAt(fits.dock, dk.x + RL.pad + fits.was.width + 12, dy0, INK)));
      } else {
        // (labels hidden: filler bars stand for the label and the value — the swatch alone carries the change)
        parts.push(h('path', {d: `M${r(tx)} ${r(pl.y + pl.h * 0.35)}H${r(pl.x + pl.w - 16)}M${r(tx)} ${r(pl.y + pl.h * 0.62)}H${r(pl.x + pl.w * 0.72)}`, stroke: '#c9c2b4', 'stroke-width': 4, 'stroke-linecap': 'round'}));
        parts.push(g({name: `${pre}-was`, opacity: 0}, h('rect', {x: r(dk.x + RL.pad), y: r(dk.y + dk.h * 0.3), width: r(RL.sw), height: r(dk.h * 0.4), rx: 2, fill: lc.a}), h('path', {d: `M${r(dk.x + RL.pad + RL.sw + 12)} ${r(dk.y + dk.h / 2)}H${r(dk.x + dk.w * 0.7)}`, stroke: '#c9c2b4', 'stroke-width': 4, 'stroke-linecap': 'round'})));
      }
      return parts;
    };
    const board = g({name: 'rm-board'}, plateNodes('rm', false));
    const room = rdRoom(ctx, G, {prefix: 'rm', R, person: false, slotO: true, slotsN: R.n + 1, heldKinds: ['a', 'b'], board});
    // ---- the lens: the plate and its dock, enlarged in the space the panel frees (the context steps back if needed)
    const mg = 8;
    const srcT = {x: B.x + RL.plate.x - mg, y: B.y + RL.plate.y - mg, w: RL.plate.w + 2 * mg, h: RL.dock.y + RL.dock.h - RL.plate.y + 2 * mg};
    const plan = C.planRect;
    const gap = 18;
    const zoomMax = P.detailGeometry.zoom;
    const needD = {w: srcT.w * k, h: srcT.h * k};
    // (the lens opens beside the room (wide) or under it (tall), in the space the panel frees; the context steps back
    // about its top-left corner when the lens needs more room, keeping >= 0.46 of the frame visible)
    const planFor = wide => {
      const regionFor = q => (wide
        ? {x: plan.x + plan.w * q + gap, y: 0, w: D.w - (plan.x + plan.w * q + gap), h: D.h}
        : {x: 0, y: plan.y + plan.h * q + gap, w: D.w, h: D.h - (plan.y + plan.h * q + gap)});
      const shareOf = q => (wide ? (plan.w * q * f.scale) / ctx.view.width : Math.max((plan.h * q * f.scale) / ctx.view.height, (plan.w * q * f.scale) / ctx.view.width));
      let out = null;
      for (let q = 1; q >= 0.3 - 1e-9; q -= 0.02) {
        if (out && shareOf(q) < 0.46) break;
        const rg = regionFor(q);
        const z = Math.max(0, Math.min(zoomMax, rg.w / needD.w, rg.h / needD.h));
        out = {wide, sc: q, region: rg, zoom: z, minD: Math.min(needD.w, needD.h) * z};
        if (z >= 1.65 && out.minD >= 0.375 * shortD) break;
      }
      return out;
    };
    const cands = [planFor(true), planFor(false)].filter(Boolean);
    const scoreL = q => (q.zoom >= 1.6 ? 1000 : 0) + Math.min(q.minD / shortD, 0.45) * 1000 + q.zoom;
    const pick = cands.sort((a, b) => scoreL(b) - scoreL(a))[0];
    const {wide, sc, region, zoom} = pick;
    const problems = [...best.problems];
    if (zoom < 1.5) problems.push('lens-small');
    const dw = needD.w * zoom, dh = needD.h * zoom;
    const al = P.detailGeometry.placement;
    const ax = al === 'left' ? 0 : al === 'right' ? 1 : 0.5, ay = al === 'top' ? 0 : al === 'bottom' ? 1 : 0.5;
    const destD = {x: region.x + (region.w - dw) * ax, y: region.y + (region.h - dh) * ay, w: dw, h: dh};
    // (the context steps back about the plan's top-left corner; the lens lives in the plan's coordinates)
    const anchor = {x: plan.x, y: wide ? plan.y + plan.h / 2 : plan.y};
    // (the lens lives inside the context group, which steps back by sc about the anchor at the lens's full opening:
    // its destination is given in the unscaled plan coordinates so that it lands on destD)
    const un = q => ({x: anchor.x + (q.x - anchor.x) / sc, y: anchor.y + (q.y - anchor.y) / sc});
    const toT = q => ({x: (q.x - C.ox) / k, y: (q.y - C.oy) / k});
    const d0 = toT(un(destD));
    const destT = {x: d0.x, y: d0.y, w: dw / k / sc, h: dh / k / sc};
    const copy = plateNodes('ln', true);
    const L0 = lens(ctx, {name: 'lens', source: srcT, dest: destT, content: g({name: 'ln-copy', opacity: 0}, copy), frame: G.extents, color: ctx.theme.accent2});
    const dyC = centreShiftY(D, [C.planRect, best.panelBox]);
    // the changed marker: beside X in folder B (top right of its slot)
    const qN = G.slotN(R.n);
    const mk = {x: qN.x + G.DW / 2 + 6, y: qN.y - G.DH / 2 - 4};
    return {P, R, F, px, C, G, k, room, lens: L0, sc, anchor, zoom, srcT, destT, destD, wide, lay: best.lay, problems, dyC, cols: best.cols, mk, shortD, fs: f.scale};
  },
  build(ctx, L) {
    const {C} = L;
    const panel = L.lay ? L.lay.rows.map(m => rdRowNode(ctx, m, {name: m.name})) : [];
    return g({name: 'scene', transform: `translate(0 ${r(L.dyC)})`},
      g({name: 'ctx', transform: 'translate(0 0)'},
        g({name: 'plan', transform: `${T(C.ox, C.oy)} scale(${r(L.k, 5)})`}, L.room.node,
          h('rect', {name: 'src-frame', x: r(L.srcT.x - 4), y: r(L.srcT.y - 4), width: r(L.srcT.w + 8), height: r(L.srcT.h + 8), rx: 12, fill: 'none', stroke: ctx.theme.accent2, 'stroke-width': r(4 / L.k, 2), opacity: 0}),
          changedMarker(ctx, {name: 'marker', x: L.mk.x, y: L.mk.y, radius: Math.max(16, 20 / L.k), opacity: 0})),
        g({name: 'lens-layer', transform: `${T(C.ox, C.oy)} scale(${r(L.k, 5)})`, 'data-occludes': 1}, L.lens.node)),
      g({name: 'panel'}, panel),
    );
  },
  frame(ctx, L, u) {
    const {G, R, C, k} = L;
    const nodes = {};
    const e = ease.inOutCubic;
    // context: X on folder A until it is lifted (restripe), carried over the divider into folder B
    const mv = e(seg(u, ...W.move));
    const restripe = seg(u, ...W.restripe);
    const lifted = u >= W.restripe[0];
    const qa = G.slotO(), qb = G.slotN(R.n);
    const hx = lerp(qa.x, qb.x, mv), hy = lerp(qa.y, qb.y, mv) - Math.sin(Math.PI * mv) * G.DH * 0.35;
    const slotN = [];
    for (let j = 0; j < R.n; j++) slotN.push(1);
    slotN.push(mv >= 1 ? 1 : 0);
    const held = lifted && mv < 1 ? {x: hx, y: hy, s: 1 + 0.07 * Math.sin(Math.PI * mv), op: 1, kind: 'a'} : null;
    const rf = L.room.frame({tray: [], slotN, slotO: lifted ? 0 : 1, held});
    Object.assign(nodes, rf.nodes);
    // (the strip turns amber as X is lifted: a cross-fade on the carried sheet)
    nodes['rm-held-sa'] = {opacity: r(1 - restripe, 3)};
    nodes['rm-held-sb'] = {opacity: r(restripe, 3)};
    // the lens
    const open = e(seg(u, ...W.open)) * (1 - e(seg(u, ...W.close)));
    const lensOn = u >= W.open[0] && u < W.close[1];
    Object.assign(nodes, L.lens.frame(lensOn ? Math.max(open, 1e-3) : 0, lensOn ? open : 0));
    const copyK = seg(u, ...W.copyIn) * (1 - seg(u, ...W.copyOut));
    nodes['ln-copy'] = {opacity: r(copyK, 3)};
    // the substitution, in the lens (and mirrored on the context plate once the lens has closed)
    const oldOut = seg(u, ...W.oldOut), newIn = seg(u, ...W.newIn), wasK = seg(u, ...W.was), swK = seg(u, ...W.swatch);
    const subst = u >= W.oldOut[0];
    for (const pre of ['ln', 'rm']) {
      const isCtx = pre === 'rm';
      // the context plate's value is hidden while the lens shows its copy (one legible copy at a time)
      const ctxVis = isCtx ? (u < W.ctxOut[0] ? 1 : u < W.ctxOut[1] ? 1 - seg(u, ...W.ctxOut) : u < W.ctxIn[0] ? 0 : seg(u, ...W.ctxIn)) : 1;
      const lift = isCtx ? (u >= W.ctxIn[0] ? 1 : 0) : oldOut;
      const bOp = isCtx ? (u >= W.ctxIn[0] ? 0 : 1) * ctxVis : 1 - clamp(oldOut * 1.6);
      const aOp = isCtx ? (u >= W.ctxIn[0] ? ctxVis : 0) : newIn;
      if (L.C.fits) {
        nodes[`${pre}-v-before`] = {opacity: r(clamp(bOp), 3), transform: T(0, isCtx ? 0 : (L.C.RL.dock.y - (L.C.RL.valY ?? 0)) * e(lift) * 0.6)};
        nodes[`${pre}-v-after`] = {opacity: r(clamp(aOp), 3)};
      }
      const sw = isCtx ? (u >= W.ctxIn[0] ? 1 : 0) : swK;
      nodes[`${pre}-sw-a`] = {opacity: r(1 - sw, 3)};
      nodes[`${pre}-sw-b`] = {opacity: r(sw, 3)};
      const dockK = isCtx ? (u >= W.ctxIn[0] ? ctxVis : 0) : wasK;
      nodes[`${pre}-dock`] = {opacity: r(dockK, 3)};
      nodes[`${pre}-was`] = {opacity: r(dockK, 3)};
    }
    const frameK = seg(u, ...W.frame) * (1 - seg(u, ...W.frameOut));
    nodes['src-frame'] = {opacity: r(frameK, 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    // the context steps back (when the lens needs the room) and the panel steps out
    const back = e(seg(u, ...W.frame)) * (1 - e(seg(u, ...W.panelIn)));
    const s = lerp(1, L.sc, back);
    nodes.ctx = {transform: s !== 1 ? scaleAbout(L.anchor.x, L.anchor.y, s) : 'translate(0 0)'};
    const panelK = 1 - seg(u, ...W.panelOut) + seg(u, ...W.panelIn);
    if (L.lay) for (const mm of L.lay.rows) nodes[mm.name] = {opacity: r(clamp(panelK), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'ret';
    const xPos = held ? {x: hx, y: hy} : lifted ? qb : qa;
    const value = u >= W.ctxIn[0] ? 'after' : 'before';
    const lensValue = !lensOn ? null : newIn > 0.5 ? 'after' : oldOut < 0.5 ? 'before' : 'between';
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(open, 3),
        zoom: r(L.zoom, 3),
        value,
        lensValue,
        datum: u >= W.newIn[1] ? L.P.afterValue : L.P.beforeValue,
        xIn: mv >= 1 ? 'B' : lifted ? 'moving' : 'A',
        x: R2(C.toD(xPos)),
        dividerX: r(C.toD({x: G.divider.x + G.divider.w / 2, y: 0}).x),
        marker: r(seg(u, ...W.marker), 3),
        ctxScale: r(s, 4),
        lensDest: {x: r(L.destD.x), y: r(L.destD.y), w: r(L.destD.w), h: r(L.destD.h)},
        lensMinFrac: r(Math.min(L.destD.w, L.destD.h) / L.shortD, 3),
        sourceT: {x: r(L.srcT.x), y: r(L.srcT.y), w: r(L.srcT.w), h: r(L.srcT.h)},
        problems: L.problems,
        textPx: r(L.F * L.px, 1),
        pxu: r(L.px, 4),
        k: r(k, 3),
        cols: L.cols,
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
    slug: 'review-05-inspect',
    title: 'Document review — inspecting a piece\'s record plate: its supplied mark changes from original material to proposed additional material, and the piece moves from the original file to the separate folder (as supplied)',
    titleEs: 'Revisión de documentos — Inspección y cambio de un dato',
    category: 'review',
    categoryName: 'Impugnaciones y revisión',
    motif: 'Revisión de documentos',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The filing room after the filing: folder A with the original file, folder B with the new pieces, a neutral divider between them; piece X lies on folder A with a blue strip. A lens opens a real enlarged copy of X\'s record plate; the supplied mark is substituted (the old value docked as "was"), the swatch turns amber; after the lens closes only the dependent geometry follows: X\'s strip turns amber and X is lifted over the divider into folder B. A neutral Δ marks the changed datum; seeking back restores the old value. Illustrative; no admissibility rule, validity, time limit or outcome; jurisdiction unspecified.',
    tags: ['review', 'document review', 'inspect', 'lens', 'record plate', 'changed datum', 'kept separate', 'divider', 'as supplied'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/review/kits/revision-de-documentos.js', 'src/animations/review/kits/solicitud-autorizacion.js', 'src/animations/hearings/kits/apertura-audiencia.js', 'src/animations/courts/kits/courts-art.js', 'src/frameworks/lens.js', 'src/primitives/markers.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
