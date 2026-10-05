/**
 * LAW-0180 — Representación de una parte · inspect
 *
 * Storyboard (context = the state produced by the story: the representative
 * stands at the counter, joined to the client by the ribbon; the form rests in
 * the counter tray):
 *  0.00–0.13  context at full size: the office scene, the name tags, the link
 *             tag, the form's tag, the counter sign and a context caption.
 *  0.10–0.22  the context labels leave and the camera pulls the context back to
 *             a large thumbnail (still a real scene) to make room for the lens.
 *  0.22–0.37  a lens isolates the distinguishing detail. The lens holds a REAL
 *             second copy of the stage drawn at the same coordinates (a second
 *             pose of the same rig), enlarged:
 *               capacity → the card hanging from the representative's badge
 *                          ring (where the ribbon clip is fastened), with the
 *                          supplied capacity datum printed on it as real text;
 *               document → the title printed on the form in the tray.
 *             Text in the lens only appears once the window is fully open.
 *  0.41–0.58  one datum is substituted INSIDE the lens: the old value lifts off
 *             and reappears in a muted "Before: …" note under the lens; the new
 *             value lands in its place; only its dependent geometry changes:
 *               capacity → the clip unfastens and the reel winds the ribbon in
 *                          (or, when no link was supplied before, the ribbon
 *                          reaches the badge) — the link state follows the datum;
 *               document → only the title on the form changes.
 *  0.59–0.73  the lens text and note leave, the lens closes onto its source,
 *             then the camera returns the context to full size and its labels
 *             come back.
 *  0.74–0.82  the context updates in the same way (ribbon wound in / the form's
 *             tag swaps) and a Δ changed-datum marker is pinned to the detail,
 *             with a note block (Δ, marker label, before, after). Holds to 1.
 * Seeking back before 0.41 restores the previous datum exactly. Nothing states
 * that a representation is valid, sufficient or binding.
 * @module animations/roles/LAW-0180
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {str, list, obj, oneOf, num} from '../../schemas/fields.js';
import {textBlock} from '../../primitives/annotate.js';
import {changedMarker} from '../../primitives/markers.js';
import {lens} from '../../frameworks/lens.js';
import {roundRectPath} from '../../core/geometry.js';
import {fitWords, wchip, placeClear} from './kits/mediation-labels.js';
import {
  REP_DEFAULTS, REP_STRINGS, ST, actorsField, rolesField, docPropsFields, relationshipItem,
  linkOf, captionOf, looksOf, repStage, choreo, keyChip, hit, wordSafe, FLAT, farPt,
} from './kits/representacion-de-una-parte.js';

const ID = 'LAW-0180';
const DURATION = 8000;
const BEATS = {context: [0, 0.22], isolate: [0.22, 0.41], substitute: [0.41, 0.59], return: [0.59, 1]};
const W = {
  labelsOut: [0.1, 0.14], shrink: [0.13, 0.22], lensOpen: [0.22, 0.35], lensText: [0.34, 0.37],
  oldLift: [0.41, 0.46], beforeNote: [0.44, 0.49], newIn: [0.48, 0.53], geo: [0.46, 0.58],
  textOut: [0.59, 0.61], close: [0.61, 0.66], grow: [0.66, 0.73], labelsIn: [0.72, 0.75],
  ctxGeo: [0.74, 0.8], ctxNew: [0.74, 0.79], marker: [0.77, 0.82],
};
const SIZE = {landscape: 25, portrait: 21, square: 30};
/** stage top (the empty wall above the sign is cropped) */
const TOP = -570;
/** 9:16: the counter stands at the back of the room (depth composition, as LAW-0177's 9:16) */
const DEPTH = {k: 0.8, fx: 88, fy: -440};
const DEPTH_W = 950;
const DEPTH_TOP = -880;

const STRINGS = {
  en: {...REP_STRINGS.en, before: 'Before', after: 'After'},
  es: {...REP_STRINGS.es, before: 'Antes', after: 'Después'},
};

const sceneSchema = {
  actors: actorsField,
  roles: rolesField,
  relationships: list('The supplied link between the representative and the client before the substitution (drawn as the ribbon; empty = no link)', relationshipItem, 0, 1),
  props: obj('Props', {...docPropsFields}),
  focusTarget: oneOf('Detail that is enlarged and substituted: "capacity" (the datum on the representative’s badge; the ribbon link follows it) or "document" (the title printed on the form; props.document is then replaced by beforeValue/afterValue)', ['capacity', 'document']),
  beforeValue: str('Value shown before the substitution (as supplied)', 90),
  afterValue: str('Value shown after the substitution (the alternative datum, as supplied)', 90),
  detailGeometry: obj('Lens geometry', {zoom: num('Magnification of the lens', 1.5, 4), placement: oneOf('Where the lens sits relative to the scene', ['auto', 'left', 'right', 'top', 'bottom'])}),
  contextLabels: obj('Labels for the context view', {context: str('Context caption (the single editorial annotation)', 80), marker: str('Label of the changed-datum marker', 40)}),
};

const defaultParams = {
  actors: REP_DEFAULTS.actors,
  roles: REP_DEFAULTS.roles,
  relationships: [REP_DEFAULTS.link],
  props: {...REP_DEFAULTS.docProps},
  focusTarget: 'capacity',
  beforeValue: 'Acting for Alex Moreno (as supplied)',
  afterValue: 'Acting in own name (as supplied)',
  detailGeometry: {zoom: 3.2, placement: 'auto'},
  contextLabels: {context: 'The form has been handed over at the counter', marker: 'Datum changed'},
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const D = ctx.design;
    const B = SIZE[shape];
    const small = B * 0.8;
    const showKey = ctx.show('key');
    const showAll = ctx.show('all');
    const link = linkOf(p.relationships);
    const linkBefore = Boolean(link);
    const docMode = p.focusTarget === 'document';
    const linkAfter = docMode ? linkBefore : !linkBefore;
    const looks = looksOf(ctx, p);
    const zoom = p.detailGeometry.zoom;
    const place = p.detailGeometry.placement === 'auto' ? (shape === 'landscape' ? 'right' : 'bottom') : p.detailGeometry.placement;
    const side = place === 'left' || place === 'right';
    // tall boxes use the depth composition (the counter at the back of the room), which fills the height
    const far = shape === 'portrait' ? DEPTH : FLAT;
    const SW = far === FLAT ? ST.W : DEPTH_W;
    const TOPv = far === FLAT ? TOP : DEPTH_TOP;
    const stageH = -TOPv + 14;
    const Fp = q => farPt(far, q);
    const key = showKey ? keyChip(ctx, ctx.t.key, {x: 8, y: 8, maxWidth: D.w - 16, size: small, maxLines: 2, name: 'key'}) : null;
    const top0 = 8 + (key ? key.box.h + 10 : 0);
    // the story's end state; at the counter the representative rests the near hand on the counter edge,
    // which keeps the badge card (and its datum) clear of the arm
    const endV0 = choreo('represented', 1, {linked: true, far});
    const endV = {...endV0, rep: {...endV0.rep, near: Fp({x: ST.counter.x0 + 22, y: ST.counter.top - 8})}};
    const kR = endV.rep.k ?? 1; // the representative's scale at the counter (depth: further back)

    // ---- lens view: the context shrinks to a thumbnail that is still a large, real scene; the lens takes the rest
    const ctxFrac = side ? (shape === 'square' ? 0.62 : 0.56) : shape === 'square' ? 0.5 : 0.55;
    const regL = side ? {w: D.w * ctxFrac - 16, h: D.h - 8 - top0} : {w: D.w - 16, h: (D.h - 8 - top0) * ctxFrac - 8};
    const sL = Math.min(regL.w / SW, regL.h / stageH);
    const wL = SW * sL, hL = stageH * sL;
    let ctxL, lensArea;
    if (side) {
      const x = place === 'right' ? 8 : D.w - 8 - wL;
      ctxL = {x, y: top0 + (D.h - 8 - top0 - hL) / 2, w: wL, h: hL};
      lensArea = place === 'right' ? {x: x + wL + 24, y: top0, w: D.w - 8 - (x + wL + 24), h: D.h - 8 - top0} : {x: 8, y: top0, w: x - 24 - 8, h: D.h - 8 - top0};
    } else {
      const y = place === 'bottom' ? top0 : D.h - 8 - hL;
      ctxL = {x: (D.w - wL) / 2, y, w: wL, h: hL};
      lensArea = place === 'bottom' ? {x: 8, y: y + hL + 16, w: D.w - 16, h: D.h - 8 - (y + hL + 16)} : {x: 8, y: top0, w: D.w - 16, h: y - 16 - top0};
    }
    const vL = {x: ctxL.x, y: ctxL.y + (-TOPv) * sL, k: sL};
    const ML = q => ({x: vL.x + q.x * sL, y: vL.y + q.y * sL});
    const zs = sL * zoom; // stage units → design units inside the open lens
    const zc = zs * kR;   // rig-local units (the card) → design units inside the open lens

    // ---- the badge card (capacity focus): hangs from the belt ring; inside the lens it carries the datum as
    // real text, sized so that it reads at the supplied-text size when the lens is open (no text in the context)
    let cardFit = null;
    if (!docMode && showKey) {
      for (let size = B / zc; size >= small / zc - 1e-6; size -= 0.2) {
        const a = fitWords(p.beforeValue, {maxWidth: 124, size, minSize: size, maxLines: 5, weight: 700});
        const b = fitWords(p.afterValue, {maxWidth: 124, size, minSize: size, maxLines: 5, weight: 700});
        cardFit = {a, b};
        if (!a.truncated && !b.truncated && wordSafe(a) && wordSafe(b)) break;
      }
    }
    const cardPad = cardFit ? cardFit.a.size * 0.55 : 6;
    const bandH = cardFit ? cardFit.a.size * 0.9 : 12;
    const cw = cardFit ? Math.max(60, Math.max(cardFit.a.width, cardFit.b.width) + cardPad * 2) : 60;
    const ch = cardFit ? bandH + cardPad * 2 + Math.max(cardFit.a.height, cardFit.b.height) : 44;
    const ring = ST.badgeL;
    const cardTop = ring.y + 14;
    // the card hangs to the counter side of the ring: the ribbon always reaches the ring from the client's
    // side (level in the side view, from below in the depth view), so it never crosses the printed datum
    const cardL = ring.x - 12;
    const cardCx = cardL + cw / 2;
    const cardNode = (pre, withText) => g({name: `${pre}-card`},
      h('path', {d: `M${ring.x} ${ring.y + 5}V${r(cardTop + 3)}`, stroke: '#8d949b', 'stroke-width': 3}),
      h('path', {d: roundRectPath(cardL, cardTop, cw, ch, 6), fill: '#fffdf8', stroke: '#1f2328', 'stroke-width': 2}),
      h('path', {d: roundRectPath(cardL + 3, cardTop + 3, cw - 6, bandH - 2, 4), fill: th.accent2}),
      withText && cardFit ? g({name: `${pre}-ct0`, opacity: 0}, textBlock(cardFit.a, {x: cardCx, y: cardTop + bandH + cardPad, anchor: 'middle', fill: '#1f2328'})) : null,
      withText && cardFit ? g({name: `${pre}-ct1`, opacity: 0}, textBlock(cardFit.b, {x: cardCx, y: cardTop + bandH + cardPad, anchor: 'middle', fill: '#1f2328'})) : null);

    // ---- full view (context at the start and after the return): stage + name tags under the feet + caption,
    // and a note block (Δ + marker label, before, after) beside the stage (wide) or under it (tall)
    const chipW = Math.min(560, Math.max(360, (D.w - 16) / 3.2));
    const chipFor = (id, x, y) => wchip(ctx, captionOf(p, id), {x, y, anchor: 'middle', maxWidth: chipW, size: B, minSize: small, maxLines: 3, name: `chip-${id}`});
    const probes = showKey ? ['client', 'representative', 'clerk'].map(id => chipFor(id, 0, 0)) : [];
    const rowH = probes.length ? Math.max(...probes.map(c => c.box.h)) + 10 : 0;
    const hasCap = showAll && Boolean(p.contextLabels.context);
    const capFor = (x, y, w) => wchip(ctx, p.contextLabels.context, {x, y, anchor: 'start', maxWidth: w, size: B, minSize: small, maxLines: 2, fill: th.card, stroke: th.inkSoft, color: th.ink, weight: 600, name: 'ctx-cap'});
    const noteBlock = (x, y, w) => {
      if (!showKey) return null;
      const R = small * 0.55;
      const lab = showAll && p.contextLabels.marker ? wchip(ctx, p.contextLabels.marker, {x: x + 2 * R + 8, y, anchor: 'start', maxWidth: w - 2 * R - 8, size: B, minSize: small, maxLines: 2, fill: th.card, stroke: th.accent2, color: th.accent2, weight: 700, name: 'nb-label'}) : null;
      const gy = lab ? lab.box.y + lab.box.h / 2 : y + R;
      const glyph = changedMarker(ctx, {name: 'nb-glyph', x: x + R, y: gy, radius: R});
      let yy = (lab ? lab.box.y + lab.box.h : y + 2 * R) + 8;
      const bef = wchip(ctx, `${ctx.t.before}: ${p.beforeValue}`, {x, y: yy, anchor: 'start', maxWidth: w, size: B, minSize: small, maxLines: 4, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: 'nb-before'});
      yy = bef.box.y + bef.box.h + 8;
      const aft = wchip(ctx, `${ctx.t.after}: ${p.afterValue}`, {x, y: yy, anchor: 'start', maxWidth: w, size: B, minSize: small, maxLines: 4, fill: th.card, stroke: th.accent2, color: th.ink, weight: 700, name: 'nb-after'});
      const right = Math.max(lab ? lab.box.x + lab.box.w : x + 2 * R, bef.box.x + bef.box.w, aft.box.x + aft.box.w);
      return {node: g(null, glyph, lab && lab.node, bef.node, aft.node), box: {x, y, w: right - x, h: aft.box.y + aft.box.h - y}, fits: [lab && lab.fit, bef.fit, aft.fit].filter(Boolean)};
    };
    const fullFor = (mode, rows) => {
      const annW = mode === 'side' ? Math.min(620, Math.max(400, D.w * 0.3)) : D.w - 16;
      const nb = noteBlock(0, 0, annW);
      const chipsH = rows * rowH + (rows ? 6 : 0);
      const regW = mode === 'side' && nb ? D.w - 16 - annW - 28 : D.w - 16;
      const capH = hasCap ? capFor(0, 0, Math.min(regW, 900)).box.h + 10 : 0;
      const regH = D.h - 8 - top0 - capH - chipsH - (mode === 'below' && nb ? nb.box.h + 16 : 0);
      return {mode, rows, annW, nb, chipsH, capH, regW, s: Math.min(regW / SW, regH / stageH)};
    };
    const modes = shape === 'portrait' ? ['below'] : shape === 'landscape' ? ['side'] : ['side', 'below'];
    const pickFull = rows => modes.map(m => fullFor(m, rows)).reduce((a, b) => (b.s > a.s ? b : a));
    const placeFull = F => {
      const wF = SW * F.s, hF = stageH * F.s;
      const sideAnn = F.mode === 'side' && F.nb;
      const groupW = sideAnn ? wF + 28 + Math.min(F.annW, F.nb.box.w) : wF;
      const stageX = (D.w - groupW) / 2;
      const total = F.capH + hF + F.chipsH + (F.mode === 'below' && F.nb ? F.nb.box.h + 16 : 0);
      const y0 = top0 + Math.max(0, (D.h - 8 - top0 - total) / 2);
      const vF = {x: stageX, y: y0 + F.capH + (-TOPv) * F.s, k: F.s};
      const MF = q => ({x: vF.x + q.x * F.s, y: vF.y + q.y * F.s});
      const chips = [];
      for (const [id, x] of showKey ? [['client', ST.clientX], ['representative', ST.standX], ['clerk', ST.clerkX - 20]] : []) {
        const q = MF(id === 'client' ? {x, y: 0} : Fp({x, y: 0}));
        let c = null;
        for (let row = 0; row < Math.max(1, F.rows); row++) {
          c = chipFor(id, q.x, q.y + 10 + row * rowH);
          const dx = Math.max(0, stageX - c.box.x) - Math.max(0, c.box.x + c.box.w - (stageX + wF));
          if (dx) c = chipFor(id, q.x + dx, q.y + 10 + row * rowH);
          if (!chips.some(o => hit(o.box, c.box, 8))) break;
        }
        chips.push(c);
      }
      const collide = chips.some((c, i) => chips.some((o, j) => j !== i && hit(o.box, c.box, 8)));
      return {F, wF, hF, stageX, y0, vF, MF, chips, collide, annX: stageX + wF + 28};
    };
    let PF = placeFull(pickFull(showKey ? 1 : 0));
    if (PF.collide) PF = placeFull(pickFull(2));
    const {F, wF, hF, stageX, y0, vF, MF, chips} = PF;
    const sF = F.s;

    const scT = far.k; // the form in the tray is at the counter's scale
    // document titles (before / after) on the form's title slot, lens copy only
    const slot = {x: -ST.sheet.w / 2 + 10, w: ST.sheet.w - 20}; // the form's title slot (sheet units, lens copy only)
    const slotAt = {x: slot.x, y: -ST.sheet.h / 2 + 30}; // relative to the sheet centre, in sheet units
    let titleFits = null;
    if (docMode && showAll) {
      for (let size = B / (zs * scT); size >= small / (zs * scT) - 1e-6; size -= 0.25) {
        const a = fitWords(p.beforeValue, {maxWidth: slot.w, size, minSize: size, maxLines: 8, weight: 700});
        const b = fitWords(p.afterValue, {maxWidth: slot.w, size, minSize: size, maxLines: 8, weight: 700});
        titleFits = {a, b};
        if (!a.truncated && !b.truncated && Math.max(a.height, b.height) <= ST.sheet.h - 40) break;
      }
    }
    // no filler lines where the title is printed (the same blank area in both copies)
    const docBlank = titleFits ? Math.max(titleFits.a.height, titleFits.b.height) + 12 : 0;

    // ---- stages: the context copy (sign text as a real part of the scene) and the lens copy (same
    // coordinates; the datum is printed on the badge card / the form title only there)
    const mk = (prefix, signText, withText) => repStage(ctx, {
      prefix, looks, plan: 'represented', linked: true, doc: {title: null, id: p.props.documentId},
      docSize: 20, docMin: 16, sign: p.props.counterSign, signSize: B / sF, showText: showAll, docText: false, signText, top: TOPv, ribbonColor: th.accent3, far, width: SW, docBlank,
      repExtra: docMode ? null : cardNode(prefix, withText),
    });
    const stCtx = mk('cx', showAll, false);
    const stLens = mk('lz', false, true);
    const end = stCtx.pose({...endV, retract: linkBefore ? 0 : 1});
    const sem = end.semantic;
    const sheetC = sem.sheet;
    const sc = sem.sheetScale ?? 1; // the form's scale in the tray (depth: further back)
    const cardBoxS = {x: sem.badge.x + (cardL - ring.x) * kR, y: sem.badge.y + 14 * kR, w: cw * kR, h: ch * kR}; // stage units (rep faces the counter)

    const titles = pre => (titleFits ? g({transform: T(sheetC.x, sheetC.y, 0, sc)},
      g({name: `${pre}-t0`, opacity: 0}, textBlock(titleFits.a, {x: slotAt.x, y: slotAt.y, fill: '#1f2328'})),
      g({name: `${pre}-t1`, opacity: 0}, textBlock(titleFits.b, {x: slotAt.x, y: slotAt.y, fill: '#1f2328'}))) : null);

    // ---- full-view labels: caption, note block, link tag and form tag, clear of the people and props
    const cap = hasCap ? capFor(stageX, y0, Math.min(wF, 900)) : null;
    let nb = null;
    const markerPt = docMode ? MF({x: sheetC.x - (ST.sheet.w / 2 - 18) * sc, y: sheetC.y - (ST.sheet.h / 2 - 16) * sc}) : MF({x: cardBoxS.x + cardBoxS.w, y: cardBoxS.y});
    if (F.nb) {
      if (F.mode === 'side') {
        const hh = F.nb.box.h;
        nb = noteBlock(PF.annX, clamp(markerPt.y - hh * 0.3, top0, D.h - 8 - hh), F.annW);
      } else {
        nb = noteBlock(Math.max(8, stageX), vF.y + 10 + F.chipsH + 16, Math.min(F.annW, D.w - 8 - Math.max(8, stageX)));
      }
    }
    // the start view is the same framing, centred without the note block's room (which is only used at
    // the return); the shift happens while the context labels are hidden
    const shift0 = !nb ? {x: 0, y: 0} : F.mode === 'side' ? {x: (D.w - wF) / 2 - stageX, y: 0} : {x: 0, y: Math.min((F.nb.box.h + 16) / 2, Math.max(0, (D.h - 8 - (vF.y + 14 * sF + 10 + F.chipsH)) / 2))};
    const placeTags = shiftS => {
      const occupied = [...chips.map(c => c.box), cap && cap.box, nb && nb.box].filter(Boolean);
      const fig = (q, k = 1) => ({x: vF.x + (q.x - 62 * k) * sF, y: vF.y + (q.y - 420 * k) * sF, w: 124 * k * sF, h: 420 * k * sF});
      occupied.push(fig({x: ST.clientX, y: 0}), fig(Fp({x: ST.standX, y: 0}), far.k), fig(Fp({x: ST.clerkX - 10, y: 0}), far.k));
      {
        const hw = (ST.sheet.w / 2 + 6) * sc, hh2 = (ST.sheet.h / 2 + 6) * sc;
        occupied.push({x: vF.x + (sheetC.x - hw) * sF, y: vF.y + (sheetC.y - hh2) * sF, w: hw * 2 * sF, h: hh2 * 2 * sF});
        const sb = stCtx.sign.box, sp = Fp(sb);
        occupied.push({x: vF.x + sp.x * sF, y: vF.y + sp.y * sF, w: sb.w * far.k * sF, h: sb.h * far.k * sF});
        const tb = {x: ST.table.x - ST.table.w / 2, y: ST.table.top - 6};
        occupied.push({x: vF.x + tb.x * sF, y: vF.y + tb.y * sF, w: ST.table.w * sF, h: -tb.y * sF});
        const R = Math.max(16, B * 0.8);
        occupied.push({x: markerPt.x - R - 4, y: markerPt.y - R - 4, w: 2 * R + 8, h: 2 * R + 8});
      }
      // tags are drawn in both framings, so they must fit the frame in both
      const tagRoom = {x: 8 + Math.max(0, -shiftS.x), y: top0 + Math.max(0, -shiftS.y), w: D.w - 16 - Math.abs(shiftS.x), h: D.h - 8 - top0 - Math.abs(shiftS.y)};
      const clearOf = b => !occupied.some(o => hit(b, o, 4));
      // leaders never cross a label or a face
      const labelObs = [...chips.map(c => c.box), cap && cap.box, nb && nb.box].filter(Boolean);
      const heads = ['client', 'rep', 'clerk'].map(k => {
        const hc = MF(end.heads[k]), kk = (k === 'client' ? 1 : far.k) * sF;
        return {x: hc.x - 48 * kk, y: hc.y - 58 * kk, w: 96 * kk, h: 116 * kk};
      });
      const samples = (a, b) => {
        const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 8));
        return Array.from({length: n - 1}, (_, i) => ({x: a.x + ((b.x - a.x) * (i + 1)) / n, y: a.y + ((b.y - a.y) * (i + 1)) / n}));
      };
      const segHits = (a, b, boxes) => samples(a, b).some(q => boxes.some(o => q.x > o.x && q.x < o.x + o.w && q.y > o.y && q.y < o.y + o.h));
      const segBoxes = (a, b) => samples(a, b).map(q => ({x: q.x - 3, y: q.y - 3, w: 6, h: 6}));
      let linkTag = null, linkTagClear = true;
      if (linkBefore && link.label && showKey) {
        const mid = MF(end.ribbonMid);
        const cands = [];
        for (const mw of [wF * 0.4, wF * 0.3, wF * 0.5]) for (let dy = 26; dy <= 240; dy += 14) for (const dx of [0, -30, 30, -60, 60, -120]) for (const sgn of [1, -1]) {
          const probe = wchip(ctx, link.label, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: B, minSize: small, maxLines: 3});
          const yy = sgn > 0 ? mid.y + dy * sF : mid.y - dy * sF - probe.box.h;
          cands.push(wchip(ctx, link.label, {x: mid.x + dx * sF, y: yy, anchor: 'middle', maxWidth: mw, size: B, minSize: small, maxLines: 3, fill: th.card, stroke: th.accent3, color: th.ink, weight: 600, name: 'link-chip'}));
        }
        const leadOf = b => ({x: clamp(mid.x, b.x + 14, b.x + b.w - 14), y: mid.y < b.y ? b.y : b.y + b.h});
        const ok = cands.filter(c => !c.fit.truncated && wordSafe(c.fit) && !segHits(leadOf(c.box), mid, [...labelObs, ...heads]));
        const best = placeClear(ok, occupied, tagRoom, 6) || cands[0];
        linkTagClear = clearOf(best.box) && ok.includes(best);
        const b = best.box;
        const lf = leadOf(b);
        occupied.push(b, ...segBoxes(lf, mid));
        labelObs.push(b, ...segBoxes(lf, mid));
        linkTag = {node: g({name: 'link-tag'},
          h('path', {d: `M${r(lf.x)} ${r(lf.y)}L${r(mid.x)} ${r(mid.y)}`, stroke: th.accent3, 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round'}),
          h('circle', {cx: r(mid.x), cy: r(mid.y), r: 6, fill: th.accent3, stroke: th.ink, 'stroke-width': 2}), best.node), box: b, fit: best.fit};
      }
      // the form's title as a tag attached to the tray (before → after swap in "document" focus)
      let docTag = null, docTagClear = true;
      if (showAll) {
        const top = MF({x: sheetC.x, y: sheetC.y - (ST.sheet.h / 2) * sc});
        const txt = v => `${v} · ${p.props.documentId}`;
        const vals = docMode ? [p.beforeValue, p.afterValue] : [p.props.document];
        const cands = [];
        const boxed = vs => ({vals: vs, box: vs.reduce((b, c) => ({x: Math.min(b.x, c.box.x), y: Math.min(b.y, c.box.y), w: Math.max(b.x + b.w, c.box.x + c.box.w) - Math.min(b.x, c.box.x), h: Math.max(b.y + b.h, c.box.y + c.box.h) - Math.min(b.y, c.box.y)}), vs[0].box)});
        for (const mw of [wF * 0.4, wF * 0.5, wF * 0.32]) {
          for (const [dx, dy, an] of [[0, -1, 'middle'], [-40, -1, 'end'], [-100, -1, 'end'], [-160, -1, 'end'], [-240, -1, 'end'], [-320, -1, 'end'], [-420, -1, 'end'], [40, -1, 'start'], [0, 1, 'middle'], [-60, 1, 'end'], [-160, 1, 'end'], [-260, 1, 'end'], [-360, 1, 'end']]) {
            const make = (v, y) => wchip(ctx, txt(v), {x: top.x + dx * sF, y, anchor: an, maxWidth: mw, size: B, minSize: small, maxLines: 4, fill: th.card, stroke: th.ink, color: th.ink, weight: 700});
            const hh = Math.max(...vals.map(v => make(v, 0).box.h));
            for (const lift of dy < 0 ? [0, 60, 120, -80, -160, -240] : [0, 60, 120]) {
              const y = dy < 0 ? top.y - hh - 16 - (24 + lift) * sF : MF(Fp({x: 0, y: ST.counter.top})).y + 10 + lift * sF;
              cands.push(boxed(vals.map(v => make(v, y))));
            }
          }
          // beside the counter on the far side of the clerk (the leader runs above the clerk's head)
          const rightX = vF.x + SW * sF + 12;
          const mwR = Math.min(mw, tagRoom.x + tagRoom.w - rightX);
          const makeR = (v, y) => wchip(ctx, txt(v), {x: rightX, y, anchor: 'start', maxWidth: mwR, size: B, minSize: small, maxLines: 5, fill: th.card, stroke: th.ink, color: th.ink, weight: 700});
          const hhR = Math.max(...vals.map(v => makeR(v, 0).box.h));
          for (const y of [top.y - hhR / 2, top.y - hhR - 4, top.y - 12]) cands.push(boxed(vals.map(v => makeR(v, y))));
        }
        const formTop = {x: top.x, y: top.y + 4}, formBottom = {x: top.x, y: MF({x: 0, y: sheetC.y + (ST.sheet.h / 2) * sc}).y};
        const formRight = {x: MF({x: sheetC.x + (ST.sheet.w / 2 - 20) * sc, y: 0}).x, y: top.y + 6};
        // the leader runs from the tag's nearest edge to the form (top edge, bottom edge when the tag is
        // below, top-right corner when the tag is beside the counter)
        const leadOf = b => {
          const tgt = b.x >= formRight.x ? formRight : b.y > top.y ? formBottom : formTop;
          const from = {x: clamp(tgt.x, b.x + 14, b.x + b.w - 14), y: clamp(tgt.y, b.y, b.y + b.h)};
          if (tgt.x < b.x || tgt.x > b.x + b.w) { from.x = tgt.x < b.x ? b.x : b.x + b.w; from.y = clamp(tgt.y, b.y + 10, b.y + b.h - 10); }
          return {from, tgt};
        };
        const ok = cands.filter(c => c.vals.every(v => !v.fit.truncated && wordSafe(v.fit)) && (l => !segHits(l.from, l.tgt, [...labelObs, ...heads]))(leadOf(c.box)));
        const best = placeClear(ok, occupied, tagRoom, 6) || cands[0];
        docTagClear = clearOf(best.box) && ok.includes(best);
        occupied.push(best.box);
        const b = best.box;
        const {from, tgt} = leadOf(b);
        docTag = {vals: best.vals, box: b, lead: h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(tgt.x)} ${r(tgt.y)}`, stroke: th.ink, 'stroke-width': 2.5, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round'})};
      }
      return {linkTag, linkTagClear, docTag, docTagClear};
    };
    // tags are placed for both framings; if the centred start framing leaves no clear spot, the start
    // view keeps the return framing
    let shiftS = shift0;
    let TG = placeTags(shiftS);
    if (!(TG.linkTagClear && TG.docTagClear) && (shiftS.x || shiftS.y)) { shiftS = {x: 0, y: 0}; TG = placeTags(shiftS); }
    const {linkTag, linkTagClear, docTag, docTagClear} = TG;
    const vS = {x: vF.x + shiftS.x, y: vF.y + shiftS.y, k: vF.k};
    const marker = changedMarker(ctx, {name: 'marker', x: markerPt.x, y: markerPt.y, radius: Math.max(16, B * 0.8), opacity: 0});

    // ---- lens: source around the detail in the lens view, destination = the lens area (room for the
    // "before" note under it)
    const target = docMode ? ML({x: sheetC.x, y: sheetC.y - 30 * sc}) : ML({x: cardBoxS.x + cardBoxS.w / 2, y: (sem.badge.y + cardBoxS.y + cardBoxS.h) / 2});
    const noteW = w => Math.min(w - 24, 640);
    const noteH = w => (showKey ? wchip(ctx, `${ctx.t.before}: ${p.beforeValue}`, {x: 0, y: 0, anchor: 'middle', maxWidth: noteW(w), size: B, minSize: small, maxLines: 4}).box.h + 14 : 0);
    // the lens window keeps an aspect between 0.8 and 1.6 (w/h); its "before" note goes under it or
    // beside it, whichever leaves the larger lens
    const A = lensArea;
    const optBelow = (() => {
      const nH = noteH(Math.min(A.w, 900));
      let h = A.h - nH;
      const w = Math.min(A.w, h * 1.6);
      h = Math.min(h, w * 1.25);
      return {w, h, nw: Math.min(w - 24, 640), below: true};
    })();
    const optBeside = (() => {
      if (!showKey) return null;
      const nw = Math.min(440, A.w * 0.34);
      const w = Math.min(A.w - nw - 20, A.h * 1.6);
      const h = Math.min(A.h, w * 1.25);
      const nH = wchip(ctx, `${ctx.t.before}: ${p.beforeValue}`, {x: 0, y: 0, anchor: 'start', maxWidth: nw, size: B, minSize: small, maxLines: 4}).box.h;
      return nH <= h ? {w, h, nw, below: false} : null;
    })();
    const LD = optBeside && optBeside.w * optBeside.h > optBelow.w * optBelow.h ? optBeside : optBelow;
    const destW = LD.w, destH = Math.max(40, LD.h);
    const notesRoom = LD.below ? noteH(destW) : 0;
    const groupW = LD.below ? destW : destW + 20 + LD.nw;
    const dest = {x: A.x + (A.w - groupW) / 2, y: A.y + Math.max(0, (A.h - destH - notesRoom) / 2), w: destW, h: destH};
    const srcW = destW / zoom, srcH = destH / zoom;
    const source = {x: clamp(target.x - srcW / 2, ctxL.x, ctxL.x + ctxL.w - srcW), y: clamp(target.y - srcH / 2, ctxL.y, ctxL.y + ctxL.h - srcH), w: srcW, h: srcH};
    const lensContent = g({transform: T(vL.x, vL.y, 0, sL)}, stLens.node, titles('lz'));
    const L0 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: ctxL, color: th.accent2});
    // the whole card (or the form's title slot) lies inside the lens source
    const inSrc = q => q.x >= source.x - 0.5 && q.y >= source.y - 0.5 && q.x + q.w <= source.x + source.w + 0.5 && q.y + q.h <= source.y + source.h + 0.5;
    const detailBox = docMode
      ? {x: vL.x + (sheetC.x - (ST.sheet.w / 2) * sc) * sL, y: vL.y + (sheetC.y - (ST.sheet.h / 2) * sc) * sL, w: ST.sheet.w * sc * sL, h: ST.sheet.h * 0.55 * sc * sL}
      : {x: vL.x + cardBoxS.x * sL, y: vL.y + (sem.badge.y - 6 * kR) * sL, w: cardBoxS.w * sL, h: (cardBoxS.h + 20 * kR) * sL};
    const detailInLens = inSrc(detailBox);
    const noteO = {size: B, minSize: small, maxLines: 4, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, weight: 600, name: 'n-before-chip'};
    let lensNote = null;
    if (showKey && LD.below) lensNote = wchip(ctx, `${ctx.t.before}: ${p.beforeValue}`, {...noteO, x: dest.x + dest.w / 2, y: dest.y + dest.h + 12, anchor: 'middle', maxWidth: noteW(destW)});
    else if (showKey) {
      const probe = wchip(ctx, `${ctx.t.before}: ${p.beforeValue}`, {...noteO, x: 0, y: 0, anchor: 'start', maxWidth: LD.nw});
      lensNote = wchip(ctx, `${ctx.t.before}: ${p.beforeValue}`, {...noteO, x: dest.x + dest.w + 20, y: dest.y + (dest.h - probe.box.h) / 2, anchor: 'start', maxWidth: LD.nw});
    }

    const truncated = [cap, linkTag, key, ...chips, ...(docTag ? docTag.vals : []), lensNote].filter(Boolean).map(x => x.fit)
      .concat(nb ? nb.fits : [], titleFits ? [titleFits.a, titleFits.b] : [], cardFit ? [cardFit.a, cardFit.b] : [], [stCtx.sign.fit])
      .filter(f => f && (f.truncated || f.overflow || !wordSafe(f))).map(f => f.full);
    return {SW, TOPv, stageH, endV, vF, vS, shiftS, vL, sF, sL, ctxL, stCtx, stLens, titleFits, cardFit, docTag, docTagClear, linkBefore, linkAfter, docMode, chips, key, cap, nb, linkTag, linkTagClear,
      L0, source, dest, lensNote, marker, markerPt, place, fullMode: F.mode, detailInLens, lensArea, truncated};
  },
  build(ctx, L) {
    return g(null,
      g({name: 'ctx-view', transform: T(L.vS.x, L.vS.y, 0, L.vS.k)}, L.stCtx.node),
      g({name: 'ctx-shift', transform: T(L.shiftS.x, L.shiftS.y)},
        L.docTag && g({name: 'doc-tag'}, L.docTag.lead, g({name: 'doc-v0'}, L.docTag.vals[0].node), L.docTag.vals[1] ? g({name: 'doc-v1', opacity: 0}, L.docTag.vals[1].node) : null),
        g({name: 'ctx-labels'}, L.chips.map(c => c.node), L.cap && L.cap.node),
        L.linkTag && L.linkTag.node),
      L.L0.node,
      L.lensNote && g({name: 'n-before', opacity: 0}, L.lensNote.node),
      L.marker,
      L.nb && g({name: 'nb', opacity: 0}, L.nb.node),
      L.key && L.key.node,
    );
  },
  frame(ctx, L, u) {
    const sg = w => seg(u, ...W[w]);
    // link state as a winding value (0 = clipped on the badge, 1 = wound into the reel)
    const r0 = L.linkBefore ? 0 : 1, r1 = L.linkAfter ? 0 : 1;
    const geoLens = L.docMode ? 0 : sg('geo');
    const geoCtx = L.docMode ? 0 : sg('ctxGeo');
    const pc = L.stCtx.pose({...L.endV, retract: lerp(r0, r1, geoCtx)});
    const pl = L.stLens.pose({...L.endV, retract: lerp(r0, r1, geoLens)});
    const nodes = {...pc.nodes, ...pl.nodes};
    // camera: full context → thumbnail beside the lens → (after the lens has closed) full context again
    const toThumb = ease.inOutSine(sg('shrink')) * (1 - ease.inOutSine(sg('grow')));
    const back = u >= 0.4; // start framing before the lens, return framing after it
    const vA = back ? L.vF : L.vS;
    const view = {x: lerp(vA.x, L.vL.x, toThumb), y: lerp(vA.y, L.vL.y, toThumb), k: lerp(vA.k, L.vL.k, toThumb)};
    nodes['ctx-view'] = {transform: T(view.x, view.y, 0, view.k)};
    nodes['ctx-shift'] = {transform: back ? T(0, 0) : T(L.shiftS.x, L.shiftS.y)};
    // lens opens on the thumbnail and closes back onto its source before the context grows
    const open = ease.inOutCubic(sg('lensOpen')) * (1 - ease.inOutCubic(sg('close')));
    Object.assign(nodes, L.L0.frame(open, open));
    // text inside the lens (datum on the card / title on the form): only while the lens is fully open,
    // so it is never drawn small or twice while the window morphs; old value lifts off before the new one lands
    const txtOn = sg('lensText') * (1 - sg('textOut'));
    const oldOut = sg('oldLift'), newIn = sg('newIn');
    const oldA = r(txtOn * (1 - oldOut), 3), newA = r(txtOn * newIn, 3);
    if (L.cardFit) {
      nodes['lz-ct0'] = {opacity: oldA, transform: T(0, -5 * oldOut)};
      nodes['lz-ct1'] = {opacity: newA};
    }
    if (L.titleFits) {
      nodes['lz-t0'] = {opacity: oldA, transform: T(0, -30 * oldOut)};
      nodes['lz-t1'] = {opacity: newA};
    }
    // context labels belong to the full view: they leave before the camera pulls back and return once it is back
    const labels = r(u < 0.4 ? 1 - sg('labelsOut') : sg('labelsIn'), 3);
    nodes['ctx-labels'] = {opacity: labels};
    if (L.stCtx.sign.fit) nodes['cx-sign-txt'] = {opacity: labels};
    if (L.docTag) {
      nodes['doc-tag'] = {opacity: labels};
      if (L.docTag.vals[1]) {
        // the old title leaves before the new one arrives (never drawn together)
        const cn = sg('ctxNew');
        nodes['doc-v0'] = {opacity: r(clamp(1 - cn * 2), 3), transform: T(0, -12 * clamp(cn * 2))};
        nodes['doc-v1'] = {opacity: r(clamp(cn * 2 - 1), 3)};
      }
    }
    // the link tag belongs to the link: it leaves with the ribbon
    if (L.linkTag) nodes['link-tag'] = {opacity: r(labels * (L.linkAfter ? 1 : 1 - geoCtx), 3)};
    // "before" note under the lens: appears as the old value lifts off, leaves before the lens closes
    const noteA = r(sg('beforeNote') * (1 - sg('textOut')), 3);
    if (L.lensNote) nodes['n-before'] = {opacity: noteA};
    const mk = r(sg('marker'), 3);
    nodes.marker = {opacity: mk};
    if (L.nb) nodes.nb = {opacity: mk};
    const datum = u < W.oldLift[0] ? 'before' : u < W.newIn[1] ? 'changing' : 'after';
    const contextDatum = u < W.ctxGeo[0] ? 'before' : u >= W.ctxGeo[1] ? 'after' : 'changing';
    const beat = u < BEATS.context[1] ? 'context' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const same = JSON.stringify({...pc.semantic}) === JSON.stringify({...pl.semantic});
    const vw = L.SW * view.k, vh = L.stageH * view.k;
    return {
      nodes,
      semantic: {
        beat,
        focus: ctx.params.focusTarget,
        lensOpen: r(open, 3),
        dim: r(open, 3),
        datum,
        contextDatum,
        cameraK: r(view.k, 4),
        contextFull: toThumb === 0,
        contextBox: {x: r(view.x), y: r(view.y + L.TOPv * view.k), w: r(vw), h: r(vh)},
        contextShare: r((vw * vh) / (ctx.design.w * ctx.design.h), 3),
        labelsShown: labels,
        lensLinked: pl.semantic.linked,
        contextLinked: pc.semantic.linked,
        lensClip: pl.semantic.clip,
        contextClip: pc.semantic.clip,
        badge: pc.semantic.badge,
        reel: pc.semantic.reel,
        lensCopyMatches: same,
        lensText: {old: oldA, new: newA},
        beforeNote: L.lensNote ? noteA : 0,
        newShown: r(newIn, 3),
        titleOld: L.titleFits ? oldA : null,
        titleNew: L.titleFits ? newA : null,
        cardText: L.cardFit ? {old: oldA, new: newA} : null,
        detailInLens: L.detailInLens,
        markerVisible: mk >= 1,
        marker: {x: r(L.markerPt.x), y: r(L.markerPt.y)},
        notesShown: L.nb ? mk : 0,
        tagsClear: L.linkTagClear && L.docTagClear,
        fullMode: L.fullMode,
        sheet: pc.semantic.sheet,
        repX: pc.semantic.repX,
        allReached: pc.semantic.allReached && pl.semantic.allReached,
        truncated: L.truncated,
        place: L.place,
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
    slug: 'roles-05-inspect',
    title: 'Representing a party — inspecting the capacity datum on the badge',
    titleEs: 'Representación de una parte — Inspección y cambio de un dato',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Representación de una parte',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'Context: the representative at the counter, joined to the client by the ribbon, the form in the tray. The context pulls back to a thumbnail and a lens (a real second copy of the scene at the same coordinates) enlarges the card on the representative’s badge ring, where the ribbon is clipped and the supplied capacity datum is printed; the datum is replaced (the old value is kept in a muted before note) and only the dependent link changes: the clip unfastens and the reel winds the ribbon in. The lens closes, the context returns to full size, updates in the same way and a Δ changed-datum marker with a before/after note is pinned. Alternative focus: the title on the form. No validity or effect is stated.',
    tags: ['representation', 'inspect', 'lens', 'badge', 'ribbon', 'link', 'capacity', 'before-after', 'changed datum', 'form'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/representacion-de-una-parte.js', 'src/animations/roles/kits/mediation-labels.js', 'src/frameworks/lens.js', 'src/primitives/markers.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
