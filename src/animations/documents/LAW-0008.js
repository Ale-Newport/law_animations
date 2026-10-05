/**
 * LAW-0008 — Sellado de copia · inspect
 *
 * Storyboard (camera move with a context thumbnail, 8 s default):
 *  0.00–0.20  build: the registry desk after the handling — copy on the desk,
 *             stamp on its rest — showing the BEFORE datum (by default: no
 *             mark at the stamping spot).
 *  0.20–0.45  isolate: the whole desk shrinks into a context thumbnail while a
 *             detail window grows out of the mark region; the window shows a
 *             second, real instance of the same desk at identical stage
 *             coordinates (the source rectangle stays outlined on the
 *             thumbnail, joined to the window by cone lines).
 *  0.45–0.75  substitute ONE datum inside the window only:
 *               mark  → the stamp action replays: the inked stamp comes in,
 *                       is lowered, pressed and lifted; the mark appears;
 *               label → the legend of the impression is swapped;
 *               date  → the date line of the impression is swapped.
 *             The single annotation keeps the old value (struck) beside the
 *             new one.
 *  0.75–1.00  return: the window folds back into the source as the desk grows
 *             back; the context now shows the new datum and a changed-datum
 *             marker. Seeking back before 0.45 restores the old datum exactly.
 * @module animations/documents/LAW-0008
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {documentsFields, inspectFields, str} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {stampingDesk, travellingLens, boxBlocked, DESK} from './kits/sellado-de-copia.js';

const ID = 'LAW-0008';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], camera: [0.21, 0.42], ann: [0.43, 0.5], strike: [0.66, 0.72], after: [0.66, 0.73],
  swap: [0.52, 0.68], back: [0.77, 0.9], ctxUpdate: [0.84, 0.9], marker: [0.9, 0.96],
  // replay of the stamping inside the window (mark target)
  reach: [0.45, 0.48], ink: [0.48, 0.53], carry: [0.53, 0.58], descend: [0.58, 0.625], press: [0.625, 0.655],
  lift: [0.655, 0.685], back2: [0.685, 0.735], release: [0.735, 0.785],
};

const STRINGS = {
  en: {mark: 'Mark', label: 'Stamp legend', date: 'Date on the mark'},
  es: {mark: 'Marca', label: 'Leyenda del sello', date: 'Fecha en la marca'},
};

const sceneSchema = {
  ...documentsFields,
  ...inspectFields(['mark', 'label', 'date']),
  stampLabel: str('Legend of the impression when the legend is not the substituted datum', 24),
  markDate: str('Date line printed in the impression when the date is not the substituted datum (empty = no date line)', 24),
};

const defaultParams = {
  documentId: 'DOC-218',
  documentTitle: 'Lease Agreement',
  clauses: ['Premises', 'Rent (hypothetical)', 'Duration and notice'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  focusTarget: 'mark',
  beforeValue: 'None',
  afterValue: 'Applied',
  detailGeometry: {zoom: 3.4, placement: 'auto'},
  contextLabels: {context: 'Copy on the registry desk', marker: 'Datum changed'},
  stampLabel: 'COPY',
  markDate: '',
};

/**
 * Per shape: desk axis, design size (caption strip 60 on top, annotation
 * strip at the bottom), thumbnail corner and the detail area.
 */
const LAYOUT = {
  landscape: {axis: 'horizontal', size: [2000, 1060], thumbK: 0.29, area: {x: 510, y: 66, w: 1474, h: 884}, thumb: 'left'},
  square: {axis: 'square', size: [1200, 1270], thumbK: 0.27, area: {x: 40, y: 400, w: 1120, h: 760}, thumb: 'top'},
  portrait: {axis: 'vertical', size: [900, 1580], thumbK: 0.26, area: {x: 16, y: 450, w: 868, h: 1000}, thumb: 'top'},
};

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const Ly = LAYOUT[shape];
    const st = DESK[Ly.axis];
    const S = {w: Ly.size[0], h: Ly.size[1]};
    const target = p.focusTarget;
    const annH = shape === 'portrait' ? 110 : 100;
    const annSize = shape === 'landscape' ? 40 : 32;

    // The impression shared by both desk instances: only the substituted line
    // has a before and an after text node (label / date targets).
    const impression = {
      stampLabel: target === 'label' ? p.beforeValue : p.stampLabel,
      markDetail: target === 'date' ? p.beforeValue : p.markDate || undefined,
      markAlt: target === 'label' ? {label: p.afterValue} : target === 'date' ? {detail: p.afterValue} : undefined,
    };
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const common = {axis: Ly.axis, doc, signers: p.signers, folderLabel: '', ...impression};
    const stage = stampingDesk(ctx, {...common, prefix: 'ctx'});
    const lensStage = stampingDesk(ctx, {...common, prefix: 'lx', chips: false});

    // Camera: full context ↔ thumbnail.
    const k0 = Math.min(S.w / st.w, (S.h - 60 - annH) / st.h);
    const full = {x: (S.w - st.w * k0) / 2, y: 60, k: k0};
    const kT = Ly.thumbK;
    const place = p.detailGeometry.placement;
    const thumbRight = shape === 'landscape' && place === 'left';
    const thumbBottom = shape !== 'landscape' && place === 'top';
    const thumb = {
      x: thumbRight ? S.w - 16 - st.w * kT : 16,
      y: thumbBottom ? S.h - annH - 10 - st.h * kT : 70,
      k: kT,
    };
    // Detail area on the other side of the thumbnail.
    let area = {...Ly.area};
    if (thumbRight) area = {...area, x: 16};
    if (thumbBottom) area = {...area, y: 70};

    // Source region around the stamping spot (stage coordinates). It starts just
    // left of the document's text column and just above its ID row, so the
    // enlarged heading reads whole instead of being cut mid-word; the spot and its
    // landing target always stay inside. Portrait uses a taller window.
    const aspect = shape === 'portrait' ? 1.1 : 1.5;
    const spot = stage.copyPoint('home', stage.markLocal);
    const copyLeft = stage.copyHome.x - stage.dw / 2, copyTop = stage.copyHome.y - stage.dh / 2;
    const rw = stage.sw * 2.5, rh = rw / aspect;
    const rx = Math.max(spot.x + stage.sw * 0.62 - rw, Math.min(spot.x - rw / 2, copyLeft + stage.dw * 0.045));
    const ry = Math.max(spot.y + stage.sh * 0.72 - rh, Math.min(spot.y - rh * 0.52, copyTop + stage.dw * 0.05));
    const R = {x: rx, y: ry, w: rw, h: rh};
    const wantW = rw * k0 * p.detailGeometry.zoom;
    const dW = Math.min(area.w, area.h * aspect, wantW);
    const dest = {x: area.x + (area.w - dW) / 2, y: area.y + (area.h - dW / aspect) / 2, w: dW, h: dW / aspect};

    const lensNode = travellingLens(ctx, {name: 'lens', content: lensStage.node, color: th.accent2});

    // Single editorial annotation in the bottom strip: before (struck) → after.
    const label = t[target];
    const annY = S.h - annH + 14;
    const half = (S.w - 80) / 2;
    const beforeChip = ctx.show('key') ? chip(ctx, `${label}: ${p.beforeValue}`, {x: S.w / 2 - 30, y: annY, anchor: 'end', maxWidth: half, size: annSize, maxLines: 2, fill: th.card, name: 'ann-before'}) : null;
    const afterChip = ctx.show('key') ? chip(ctx, `${label}: ${p.afterValue}`, {x: S.w / 2 + 30, y: annY, anchor: 'start', maxWidth: half, size: annSize, maxLines: 2, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}) : null;
    const arrowY = annY + (beforeChip ? beforeChip.box.h / 2 : 26);
    const strike = beforeChip ? h('line', {name: 'ann-strike', x1: beforeChip.box.x + 12, x2: beforeChip.box.x + beforeChip.box.w - 12, y1: beforeChip.box.cy, y2: beforeChip.box.cy, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(beforeChip.box.w)} ${r(beforeChip.box.w + 10)}`, 'stroke-dashoffset': r(beforeChip.box.w)}) : null;
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 16, y: 8, maxWidth: S.w - 32, size: 34, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;

    // Changed-datum marker pinned to the mark, inside the context (stage coordinates).
    // Its chip takes free desk space just above the copy (clear of the props,
    // hands, arms and actor chips, as the desk stands at the end) with a short
    // leader to the pin, rather than covering the sheet or the file.
    const pin = {x: spot.x + stage.sw * 0.62, y: spot.y - stage.sh * 0.62};
    let markChip = null;
    let lead = null;
    if (ctx.show('key')) {
      const spec = {maxWidth: 380, size: 26, maxLines: 1, fill: th.card, stroke: th.accent2};
      const occ = stage.occupied({reach: 1, release: 1, press: 1, lift: 1, back: 1});
      const bounds = {x: 16, y: 16, w: st.w - 32, h: st.h - 32};
      const probe = chip(ctx, p.contextLabels.marker, {...spec, x: 0, y: 0});
      const above = copyTop - 20 - probe.box.h;
      const cands = [
        {x: pin.x - 30, y: above, anchor: 'start'},
        {x: pin.x + 30, y: above, anchor: 'end'},
        {x: pin.x - 30, y: above - 50, anchor: 'start'},
        {x: pin.x + 30, y: above - 50, anchor: 'end'},
        {x: pin.x - 90, y: above, anchor: 'end'},
        {x: pin.x - 150, y: above, anchor: 'end'},
        {x: pin.x + 26, y: pin.y - 24, anchor: 'start'},
      ];
      const made = cands.map(c => chip(ctx, p.contextLabels.marker, {...spec, ...c}));
      markChip = made.find(c => !boxBlocked(occ, c.box, 6, bounds)) || made[made.length - 1];
      if (markChip.box.x + markChip.box.w > st.w - 12) markChip = chip(ctx, p.contextLabels.marker, {...spec, x: pin.x - 26, y: pin.y - 24, anchor: 'end'});
      const b = markChip.box;
      if (b.y + b.h < pin.y - 20) {
        const ex = Math.max(b.x + 14, Math.min(b.x + b.w - 14, pin.x));
        lead = h('line', {x1: r(pin.x), y1: r(pin.y - 18), x2: r(ex), y2: r(b.y + b.h), stroke: th.accent2, 'stroke-width': 3, 'stroke-linecap': 'round'});
      }
    }
    const marker = g({name: 'marker', opacity: 0},
      lead,
      h('circle', {cx: pin.x, cy: pin.y, r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(pin.x)} ${r(pin.y - 8)}l8 14.0h-16z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markChip && markChip.node);

    // fit the design block into the available design space (centred)
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    return {S, s, ox, oy, st, stage, lensStage, full, thumb, R, dest, lensNode, beforeChip, afterChip, arrowY, strike, ctxCap, marker, target};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctx-cam'}, L.stage.node, L.marker),
      L.lensNode.node,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {d: `M${r(L.S.w / 2 - 14)} ${r(L.arrowY)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        g({name: 'ann-after-g', opacity: 0}, L.afterChip.node)),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const tg = L.target;
    // --- camera: full → thumbnail (isolate) … thumbnail → full (return)
    const go = ease.inOutCubic(seg(u, ...W.camera));
    const back = ease.inOutCubic(seg(u, ...W.back));
    const c = go * (1 - back);
    const cam = {x: lerp(L.full.x, L.thumb.x, c), y: lerp(L.full.y, L.thumb.y, c), k: lerp(L.full.k, L.thumb.k, c)};
    nodes['ctx-cam'] = {transform: T(cam.x, cam.y, 0, cam.k)};
    const Rd = {x: cam.x + L.R.x * cam.k, y: cam.y + L.R.y * cam.k, w: L.R.w * cam.k, h: L.R.h * cam.k};
    const Wd = {x: lerp(Rd.x, L.dest.x, c), y: lerp(Rd.y, L.dest.y, c), w: lerp(Rd.w, L.dest.w, c), h: lerp(Rd.h, L.dest.h, c)};
    const open = c > 0.002;
    Object.assign(nodes, L.lensNode.frame(L.R, Rd, Wd, open));

    // --- context datum: before until the return, then after
    const ctxUpd = seg(u, ...W.ctxUpdate);
    const ctxAfter = ctxUpd >= 0.5;
    const markedPose = {reach: 1, release: 1, press: 1, lift: 1, back: 1};
    const ctxPose = L.stage.pose(tg === 'mark' && !ctxAfter ? {} : markedPose);
    Object.assign(nodes, ctxPose.nodes);
    // the "mark" datum toggles the whole impression (pose above); label/date swap one text line
    const line = tg === 'label' ? 'label' : 'detail';
    const swapLine = (P, pr) => {
      if (tg === 'mark' || !ctx.show('all')) return;
      const out = clamp(pr * 2), inn = clamp(pr * 2 - 1);
      nodes[`${P}-imp-${line}`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-8 * out)})`};
      nodes[`${P}-imp-${line}-alt`] = {opacity: r(inn, 3), transform: `translate(0 ${r(8 * (1 - inn))})`};
    };
    swapLine('ctx', ctxUpd);

    // --- lens: replay the stamping (mark) or swap one line of the impression
    let lensPose;
    let lensSwap = 0;
    if (tg === 'mark') {
      lensPose = L.lensStage.pose({
        reach: seg(u, ...W.reach), ink: seg(u, ...W.ink), carry: seg(u, ...W.carry), descend: seg(u, ...W.descend),
        press: seg(u, ...W.press), lift: seg(u, ...W.lift), back: seg(u, ...W.back2), release: seg(u, ...W.release),
      });
    } else {
      lensPose = L.lensStage.pose(markedPose);
      lensSwap = seg(u, ...W.swap);
    }
    Object.assign(nodes, lensPose.nodes);
    // old line lifts out, then the new one settles (no double exposure); the rest stays inked
    swapLine('lx', lensSwap);

    // --- annotation (bottom strip) and marker
    if (L.beforeChip) {
      nodes.ann = {opacity: r(seg(u, ...W.ann), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.beforeChip.box.w * (1 - seg(u, ...W.strike)))};
      nodes['ann-after-g'] = {opacity: r(seg(u, ...W.after), 3)};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};

    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const lensChanged = tg === 'mark' ? lensPose.semantic.markApplied : lensSwap >= 1;
    const lensChanging = tg === 'mark' ? lensPose.semantic.stampHeld && !lensChanged : lensSwap > 0 && lensSwap < 1;
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const R4 = q => ({x: r(q.x), y: r(q.y), w: r(q.w), h: r(q.h)});
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(c, 3),
        datum: lensChanged ? 'after' : lensChanging ? 'changing' : 'before',
        contextDatum: tg === 'mark' ? (ctxAfter ? 'after' : 'before') : ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        contextMark: ctxPose.semantic.markApplied,
        lensMark: tg === 'mark' ? lensPose.semantic.markApplied : true,
        focusTarget: tg,
        sourceStage: R4(L.R),
        sourceDesign: R4(Rd),
        window: R4(Wd),
        windowCenter: P2({x: Wd.x + Wd.w / 2, y: Wd.y + Wd.h / 2}),
        thumbOrigin: P2(cam),
        lensStamp: lensPose.semantic.stampTool,
        lensHand: lensPose.semantic.handStamp,
        lensMarkSpot: lensPose.semantic.markSpot,
        lensCopy: lensPose.semantic.copyCenter,
        contextCopy: ctxPose.semantic.copyCenter,
        allReached: ctxPose.semantic.allReached && lensPose.semantic.allReached,
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
    slug: 'documents-02-inspect',
    title: 'Copy stamping — inspect the stamping spot',
    titleEs: 'Sellado de copia — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Sellado de copia',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The registry desk shrinks into a context thumbnail while a detail window grows out of the stamping spot on the copy. Inside the window one datum is substituted — the stamp action replays and leaves the mark, or the legend or date of the impression is swapped — with the old value kept in the annotation; the view returns to the context with a changed-datum marker.',
    tags: ['stamp', 'copy', 'inspect', 'detail', 'thumbnail', 'replay', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/sellado-de-copia.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
