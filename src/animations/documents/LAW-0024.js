/**
 * LAW-0024 — Anexo incorporado · inspect
 *
 * Storyboard:
 *  0.00–0.20  context, drawn large: the desk after the action, showing the
 *             BEFORE datum (default: the annex laid apart, reference written, no
 *             link).
 *  0.20–0.45  the context steps aside (beside the lens on wide frames, above it
 *             on square and tall ones); an opaque lens grows from the junction —
 *             the clause heading with its reference, the contract margin and the
 *             annex's index tab — as a real copy of the same desk at the same
 *             coordinates, enlarged.
 *  0.45–0.75  one datum is substituted inside the lens only, and only its
 *             geometry/connection changes:
 *               link     separate → linked: the annex slides onto the margin and
 *                        the loop is drawn to its eyelet (a dashed ghost keeps
 *                        the old position);
 *               clause   clause k → clause j: the annex slides to the other row,
 *                        the old reference and loop stay as a faded trace, the
 *                        reference and loop are written at the new row;
 *               annexId  the id printed on the annex header and in the reference
 *                        is replaced at both ends of the link.
 *             A before → after annotation keeps the previous value readable.
 *  0.75–1.00  the lens shrinks back onto its source while the context takes the
 *             new datum; the context returns to full size with a "changed"
 *             marker and the before → after pair directly under it. Seeking back
 *             restores the previous datum exactly. No validity, responsibility or
 *             outcome is inferred.
 * @module animations/documents/LAW-0024
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, r} from '../../core/time.js';
import {documentsFields, inspectFields, int} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {annexDesk, annexFields, ANNEX_STRINGS, STAGE} from './kits/anexo-incorporado.js';

const ID = 'LAW-0024';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], toDock: [0.19, 0.26], open: [0.27, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  change: [0.5, 0.7], after: [0.66, 0.72], close: [0.75, 0.83], ctxUpdate: [0.76, 0.83], toHero: [0.79, 0.88], marker: [0.9, 0.96],
  // the before → after pair starts toward its final place while the lens closes
  annMove: [0.78, 0.9],
};
const TARGETS = ['link', 'clause', 'annexId'];

const sceneSchema = {
  ...documentsFields,
  ...annexFields,
  ...inspectFields(TARGETS),
  alternativeClause: int('Zero-based clause index the annex is moved to when the focus target is "clause"', 0, 4),
};

const defaultParams = {
  documentId: 'CTR-208',
  documentTitle: 'Supply Agreement',
  clauses: ['Parties and purpose', 'Delivery of the goods', 'Price (hypothetical)'],
  signers: [{name: 'Alex Moreno', role: 'Party A'}, {name: 'Sam Okafor', role: 'Party B'}],
  redactions: [],
  linkedClause: 1,
  alternativeClause: 2,
  annex: {label: 'ANNEX 1', title: 'Delivery schedule'},
  reference: 'see Annex 1',
  focusTarget: 'link',
  beforeValue: 'Separate',
  afterValue: 'Linked',
  detailGeometry: {zoom: 2.4, placement: 'auto'},
  contextLabels: {context: 'Contract with Annex 1 on the desk', marker: 'Datum changed'},
};

/**
 * Context stage and lens per shape. `side`: the context docks at the left and
 * the lens opens at its right; `stack`: the context docks at the top (dockFrac
 * of the height) and a wide lens opens below it. At the start and at the end
 * the context is drawn large ("hero"), with the annotation band under it.
 */
const LAYOUT = {
  landscape: {size: [1900, 760], axis: 'horizontal', mode: 'side'},
  square: {size: [1300, 1150], axis: 'square', mode: 'stack', dockFrac: 0.42},
  portrait: {size: [900, 1440], axis: 'vertical', mode: 'stack', dockFrac: 0.4},
};
const ANN_H = 120;
/** Room kept right of a printed annex id inside the lens (covers the right-edge fade). */
const LABEL_FADE_ROOM = 110; // room under the lens / the returned context for the before → after annotation

/** Phase values of the substitution for progress c in [0,1]. */
function phases(target, c) {
  if (target === 'link') return {join: ease.inOutCubic(seg(c, 0, 0.55)), link: seg(c, 0.55, 1), ghost: clamp(seg(c, 0, 0.2) * 3)};
  if (target === 'clause') return {fade: seg(c, 0, 0.3), shift: ease.inOutCubic(seg(c, 0.1, 0.6)), write: seg(c, 0.5, 0.8), link: seg(c, 0.8, 1), ghost: clamp(seg(c, 0, 0.2) * 3)};
  return {swap: c};
}

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const {axis, mode} = LAYOUT[shape];
    const st = STAGE[axis];
    const D = ctx.design;
    const target = p.focusTarget;
    const n = p.clauses.length;
    const k1 = Math.min(p.linkedClause, n - 1);
    let k2 = Math.min(p.alternativeClause, n - 1);
    if (k2 === k1) k2 = k1 + 1 < n ? k1 + 1 : Math.max(0, k1 - 1);
    const useAlt = target === 'clause' && k2 !== k1;

    // Values: the annex id variant replaces the id at both ends of the link.
    const idSwap = target === 'annexId';
    const refAfter = idSwap ? (p.reference.includes(p.beforeValue) ? p.reference.replace(p.beforeValue, p.afterValue) : `${p.reference} (${p.afterValue})`) : p.reference;
    const refBefore = idSwap && !p.reference.includes(p.beforeValue) ? p.reference : p.reference;
    const labels = idSwap ? [p.beforeValue.toUpperCase(), p.afterValue.toUpperCase()] : [p.annex.label];
    const deskOpts = prefix => ({
      prefix, axis, linked: target !== 'link',
      doc: {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions},
      annex: {labels, title: p.annex.title},
      refTexts: idSwap ? [refBefore, refAfter] : [p.reference],
      clause: k1, altClause: useAlt ? k2 : undefined,
      // the folder is not part of the inspected datum: its plate carries ruled
      // placeholder lines (no text under the travelling lens window)
      actors: p.signers, folderLabel: '', sealLabel: '', chips: false, seedKey: 'annex-inspect',
    });

    // --- context placement: docked while the lens is open (k, sx, sy) and
    //     large ("hero") before and after it (kH, hx, hy)
    const capH = 56;
    let k, sx, sy;
    if (mode === 'side') {
      // a compact overview on the left leaves a large lens on the right
      k = Math.min((D.w * 0.44) / st.w, (D.h - capH - 20) / st.h);
      sx = 16;
      sy = capH + 12;
    } else {
      k = Math.min((D.w - 32) / st.w, (D.h * LAYOUT[shape].dockFrac) / st.h);
      sx = (D.w - st.w * k) / 2;
      sy = capH + 12;
    }
    const kH = Math.min((D.w - 32) / st.w, (D.h - capH - 12 - ANN_H) / st.h);
    const hx = (D.w - st.w * kH) / 2, hy = capH + 12;
    const heroBox = {x: hx, y: hy, w: st.w * kH, h: st.h * kH};
    const stage = annexDesk(ctx, deskOpts('ctx'));
    // lens copy: a dashed ghost of the annex's previous position is drawn UNDER
    // the annex (between contract and annex), so it never crosses the sheet
    const copy = annexDesk(ctx, {...deskOpts('lz'), under: target === 'annexId' ? null : geo => {
      const gp = target === 'link' ? geo.sepPose : geo.dock1;
      return h('path', {name: 'lz-ghost', d: geo.outline, transform: T(gp.x, gp.y, gp.rot || 0), fill: th.paperShade, 'fill-opacity': 0.35, stroke: th.inkSoft, 'stroke-width': 2.5, 'stroke-dasharray': '10 9', opacity: 0});
    }});
    const toD = q => ({x: sx + q.x * k, y: sy + q.y * k});

    // --- detail region (stage coordinates), then in design coordinates
    const eyeDock = stage.annexPoint(stage.dock1, stage.annex.eyelet);
    const eyeSep = stage.annexPoint(stage.sepPose, stage.annex.eyelet);
    // the region starts at the contract's text margin, so the lens shows whole
    // clause headings (number + reference) instead of cut word fragments
    const textX0 = stage.docTL.x + stage.contract.pad - 18;
    // printed width of the annex header id (widest value), as the kit sets it
    const labelInkW = ctx.show('all') ? Math.max(...labels.map(lab => {
      const f = ctx.fit(lab, {maxWidth: stage.aw * 0.8, size: stage.annex.band * 0.52, minSize: stage.annex.band * 0.26, maxLines: 1, weight: 800});
      return f.width + [...lab].length;
    })) : 0;
    let reg;
    if (target === 'link') {
      // wide enough to show a good part of the separate annex (the gap reads)
      reg = {x0: textX0, x1: eyeSep.x + Math.max(110, stage.aw * 0.5), y0: stage.rowMid(k1) - 120, y1: stage.rowMid(k1) + 110};
    } else if (target === 'clause') {
      const ym = [stage.rowMid(k1), stage.rowMid(k2)];
      reg = {x0: textX0, x1: eyeDock.x + 190, y0: Math.min(...ym) - 90, y1: Math.max(...ym) + 90};
    } else {
      const top = stage.dock1.y - stage.ah / 2;
      reg = {x0: textX0, x1: stage.docTL.x + stage.dw + stage.aw * 0.62, y0: top - 12, y1: stage.rowMid(k1) + 70};
      // the replaced id on the header band is the datum itself: the whole ink
      // of both values stays inside the lens, left of the right-edge fade
      if (labelInkW) reg.x1 = Math.max(reg.x1, stage.dock1.x - stage.aw / 2 + stage.aw * 0.12 + labelInkW + LABEL_FADE_ROOM);
    }
    // the written reference (one or two lines under / beside the heading) is
    // always inside the region
    for (const kk of target === 'clause' && useAlt ? [k1, k2] : [k1]) {
      const inkB = stage.inkRows[kk] && stage.inkRows[kk].box;
      if (inkB) reg.y1 = Math.max(reg.y1, inkB.y + inkB.h + 10);
    }
    const stageBox = {x: sx, y: sy, w: st.w * k, h: st.h * k};
    // Lens destination box first; the detail region then grows (around its
    // centre, inside the stage) to the box's aspect and to the requested zoom.
    let box;
    if (mode === 'side') {
      const x0 = stageBox.x + stageBox.w + 40;
      box = {x: x0, y: capH + 12, w: D.w - x0 - 16, h: D.h - capH - 12 - ANN_H};
    } else {
      const top = stageBox.y + stageBox.h + 30;
      box = {x: 16, y: top, w: D.w - 32, h: D.h - top - ANN_H};
    }
    // stacked lenses may be wide and short (they use the full width)
    const aspect = clamp(box.h / box.w, mode === 'stack' ? 0.3 : 0.5, 1.3);
    // the requested zoom is relative to the full-size context the viewer saw first
    const core = {...reg};
    const coreW = reg.x1 - reg.x0;
    let rw = Math.max(coreW, (box.w / (p.detailGeometry.zoom * kH)) * 0.8), rh = reg.y1 - reg.y0;
    // a short core gains rows above/below; a tall core widens only a little
    // (the lens window then gets narrower instead of filling up with bare desk)
    if (rh / rw < aspect) rh = rw * aspect; else rw = Math.max(rw, Math.min(rh / aspect, coreW * 1.12));
    rw = Math.min(rw, st.w - 20);
    rh = Math.min(rh, st.h - 20);
    const rc = {x: (reg.x0 + reg.x1) / 2, y: (reg.y0 + reg.y1) / 2};
    // grown to the right from the text margin (the left edge stays on it)
    const rx0 = clamp(reg.x0, 10, st.w - 10 - rw);
    let ry0 = clamp(rc.y - rh / 2, 10, st.h - 10 - rh);
    // horizontal edges never slice a printed line: the top edge snaps up to
    // just above a clause heading (or above the sheet), and a bottom edge that
    // would cut a heading moves above it (or below it); the core (clause, the
    // written reference with all its lines, tab / annex header) always stays in
    const docY = stage.docTL.y;
    const heads = stage.contract.rows.map(rw2 => ({a: docY + rw2.top - 8, b: docY + rw2.top + rw2.headSize * 2.6}));
    const titleBand = {a: docY + 4, b: docY + stage.contract.rows[0].top - 14};
    // the annex header band (its printed id) counts too, in every pose the
    // lens shows at rest (before and after the substitution)
    const annexPoses = target === 'link' ? [stage.sepPose, stage.dock1] : target === 'clause' ? [stage.dock1, stage.dock2] : [stage.dock1];
    const annexBand = pose => {
      const pts = [[-1, 0], [1, 0], [-1, 1], [1, 1]].map(([sx2, sy2]) => stage.annexPoint(pose, {x: (sx2 * stage.aw) / 2, y: -stage.ah / 2 + sy2 * stage.annex.band}));
      const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
      return {a: Math.min(...ys) - 6, b: Math.max(...ys) + 2, x0: Math.min(...xs), x1: Math.max(...xs)};
    };
    const annexBands = annexPoses.map(annexBand).filter(bd => bd.x1 > rx0 && bd.x0 < rx0 + rw);
    const bands = [titleBand, ...heads, ...annexBands];
    const hit = y => bands.find(bd => y > bd.a && y < bd.b);
    ry0 = Math.min(ry0, core.y0);
    for (let i = 0, bd = hit(ry0); bd && i < 6; i++, bd = hit(ry0)) ry0 = Math.max(10, bd.a - 6);
    let ry1 = Math.max(ry0 + rh, core.y1);
    for (let i = 0, bd = hit(ry1); bd && i < 6; i++, bd = hit(ry1)) ry1 = bd.a - 6 >= core.y1 ? bd.a - 6 : bd.b + 6;
    ry1 = Math.min(ry1, st.h - 10);
    // an annex header the lens shows at rest keeps its whole printed id left
    // of the right-edge fade (the window widens rather than cutting the id)
    let rx1 = rx0 + rw;
    if (labelInkW) {
      for (const pose of annexPoses) {
        const bd = annexBand(pose);
        const y = -stage.ah / 2 + stage.annex.band / 2;
        const inkL = stage.annexPoint(pose, {x: -stage.aw / 2 + stage.aw * 0.12, y}).x;
        const inkR = stage.annexPoint(pose, {x: -stage.aw / 2 + stage.aw * 0.12 + labelInkW, y}).x;
        if (bd.b > ry0 && bd.a < ry1 && inkL < rx1) rx1 = Math.max(rx1, Math.min(st.w - 10, inkR + LABEL_FADE_ROOM));
      }
    }
    reg = {x0: rx0, y0: ry0, x1: rx1, y1: ry1};
    const a = toD({x: reg.x0, y: reg.y0}), b = toD({x: reg.x1, y: reg.y1});
    const source = {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y};
    const ratio = source.h / source.w;
    const dW = Math.min(box.w, box.h / ratio);
    const dest = {x: box.x + (box.w - dW) / 2, y: box.y + (box.h - dW * ratio) / 2, w: dW, h: dW * ratio};
    // the right edge of the lens (through the annex) fades to paper instead of
    // cutting words hard
    const fadeW = Math.min(90, (reg.x1 - reg.x0) * 0.14);
    const fade = g(null,
      h('defs', null, h('linearGradient', {id: ctx.id('lz-fade'), x1: 0, x2: 1, y1: 0, y2: 0},
        h('stop', {offset: 0, 'stop-color': th.paper, 'stop-opacity': 0}),
        h('stop', {offset: 1, 'stop-color': th.paper, 'stop-opacity': 0.96}))),
      h('rect', {x: r(reg.x1 - fadeW), y: r(reg.y0 - 4), width: r(fadeW + 6), height: r(reg.y1 - reg.y0 + 8), fill: ctx.ref('lz-fade')}));
    const lensContent = g({transform: T(sx, sy, 0, k)}, copy.node, fade);
    const L2 = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // --- single editorial annotation: before → after
    const label = t[target];
    const annY = dest.y + dest.h + 28;
    const annMax = mode === 'side' ? Math.max(box.w, 900) : D.w - 32;
    // one (slightly smaller) line is preferred over a wrapped short value
    const annOpts = txt => {
      const base = {maxWidth: annMax / 2 - 30, size: 32, minSize: 25, maxLines: 1};
      const probe = chip(ctx, txt, {x: 0, y: 0, ...base});
      return probe.fit.truncated ? {...base, minSize: 24, maxLines: 2} : base;
    };
    // the before → after pair is centred under the lens but kept inside the frame
    const pw = txt => chip(ctx, txt, {x: 0, y: 0, ...annOpts(txt)}).box.w;
    const wb = pw(`${label}: ${p.beforeValue}`), wa = pw(`${label}: ${p.afterValue}`);
    const annCX = clamp(mode === 'side' ? dest.x + dest.w / 2 : D.w / 2, 16 + wb + 24, D.w - 16 - wa - 24);
    const beforeChip = ctx.show('key') ? chip(ctx, `${label}: ${p.beforeValue}`, {x: annCX - 24, y: annY, anchor: 'end', ...annOpts(`${label}: ${p.beforeValue}`), fill: th.card, name: 'ann-before'}) : null;
    const afterChip = ctx.show('key') ? chip(ctx, `${label}: ${p.afterValue}`, {x: annCX + 24, y: annY, anchor: 'start', ...annOpts(`${label}: ${p.afterValue}`), fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}) : null;
    const arrowY = annY + (beforeChip ? beforeChip.box.h / 2 : 26);
    const strike = beforeChip ? h('line', {name: 'ann-strike', x1: beforeChip.box.x + 10, x2: beforeChip.box.x + beforeChip.box.w - 10, y1: beforeChip.box.cy, y2: beforeChip.box.cy, stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(beforeChip.box.w)} ${r(beforeChip.box.w + 10)}`, 'stroke-dashoffset': r(beforeChip.box.w)}) : null;
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 16, y: 8, maxWidth: D.w - 32, size: 34, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;
    // at the return the pair moves (rigidly) to sit directly under the
    // full-size context, centred on it
    const annW = beforeChip ? afterChip.box.x + afterChip.box.w - beforeChip.box.x : 0;
    const annFinalX = clamp(heroBox.x + heroBox.w / 2 - annW / 2, 16, D.w - 16 - annW);
    const annShift = beforeChip ? {x: annFinalX - beforeChip.box.x, y: heroBox.y + heroBox.h + 16 - annY} : {x: 0, y: 0};

    // --- changed-datum marker pinned to the detail of the full-size context
    //     (top-right corner of the detail region); its chip sits in free desk
    //     space just above the detail, inside the context
    // the outline hugs the junction itself (reference → tab), not the whole
    // lens region; its bottom edge clears the written reference (all lines)
    const jRows = target === 'clause' && useAlt ? [k1, k2] : [k1];
    const inkBottom = Math.max(...jRows.map(kk => stage.inkRows[kk].box.y + stage.inkRows[kk].box.h));
    const toH = (x0, y0, x1, y1) => ({x: hx + x0 * kH, y: hy + y0 * kH, w: (x1 - x0) * kH, h: (y1 - y0) * kH});
    const frames = [];
    if (target === 'annexId') {
      // the id is replaced at both ends of the link: the annex header band and
      // the written reference are framed separately (nothing unchanged, such as
      // a neighbouring clause heading, is enclosed or struck through)
      const aTop = stage.dock1.y - stage.ah / 2;
      const aLeft = stage.dock1.x - stage.aw / 2;
      frames.push(toH(aLeft - 7, aTop - 7, aLeft + stage.aw + 7, aTop + stage.annex.band + 7));
      const ib = stage.inkRows[k1].box;
      const iw = Math.max(...stage.inkRows[k1].lines.map(l => l.x1)) - ib.x;
      frames.push(toH(ib.x - 8, ib.y - 4, ib.x + Math.max(iw, ib.w) + 10, Math.max(ib.y + ib.h, stage.inkRows[k1].ulY + 4) + 6));
    } else {
      const jx0 = stage.inkRows[k1].x0 - 14, jx1 = eyeDock.x + 44;
      const jy0 = Math.min(...jRows.map(kk => stage.rowMid(kk))) - 34;
      const jy1 = Math.max(Math.max(...jRows.map(kk => stage.rowMid(kk))) + 52, inkBottom + 10);
      frames.push(toH(jx0, jy0, jx1, jy1));
    }
    const regH = frames[0];
    const mk = {x: regH.x + regH.w, y: regH.y};

    // the marker's chip sits on the desk ABOVE both sheets (never on their
    // printed text), tied to the check mark by a short leader
    let markChip = null, markLead = null;
    if (ctx.show('key')) {
      const probe = chip(ctx, p.contextLabels.marker, {x: 0, y: 0, maxWidth: 420, size: 30, maxLines: 1});
      const annexTop = Math.min(stage.dock1.y, stage.dock2.y) - stage.ah / 2;
      const sheetsTop = hy + Math.min(annexTop, stage.docTL.y) * kH;
      const cy = Math.max(heroBox.y + 6, sheetsTop - 16 - probe.box.h);
      const x = Math.max(heroBox.x + 6, Math.min(mk.x - 30, heroBox.x + heroBox.w - 6 - probe.box.w));
      markChip = chip(ctx, p.contextLabels.marker, {x, y: cy, maxWidth: 420, size: 30, maxLines: 1, fill: th.card, stroke: th.accent2});
      const lx = clamp(mk.x, markChip.box.x + 14, markChip.box.x + markChip.box.w - 14);
      markLead = h('line', {x1: r(lx), y1: r(markChip.box.y + markChip.box.h), x2: r(mk.x), y2: r(mk.y - 20), stroke: th.accent2, 'stroke-width': 3});
    }
    const marker = g({name: 'marker', opacity: 0},
      frames.map(fr => h('path', {d: `M${r(fr.x)} ${r(fr.y)}h${r(fr.w)}v${r(fr.h)}h${r(-fr.w)}Z`, fill: 'none', stroke: th.accent2, 'stroke-width': 4, 'stroke-dasharray': '12 9', 'stroke-linejoin': 'round'})),
      h('circle', {cx: mk.x, cy: mk.y, r: 20, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(mk.x)} ${r(mk.y - 9)}l9 15.75h-18z`, fill: 'none', stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      markLead,
      markChip && markChip.node,
    );
    // the lens always shows the whole core (clause, all reference lines, tab / annex header)
    const coreInLens = reg.x0 <= core.x0 + 0.5 && reg.x1 >= Math.min(core.x1, st.w - 10) - 0.5 && reg.y0 <= core.y0 + 0.5 && reg.y1 >= Math.min(core.y1, st.h - 10) - 0.5;
    return {coreInLens, markerFrames: frames.length, stage, copy, k, sx, sy, kH, hx, hy, heroBox, source, dest, L2, beforeChip, afterChip, arrowY, annCX, annShift, strike, ctxCap, marker, target, k1, k2, useAlt, reg};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctx-place', transform: T(L.hx, L.hy, 0, L.kH)}, L.stage.node),
      // the lens is laid out on the docked context; it rides with the context
      // when that grows back while the lens is still closing onto its source
      g({name: 'lens-follow'}, L.L2.node),
      L.marker,
      L.beforeChip && g({name: 'ann'},
        L.beforeChip.node, L.strike,
        h('path', {d: `M${r(L.annCX - 14)} ${r(L.arrowY)}h24m-10 -9l10 9l-10 9`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const target = L.target;
    const change = seg(u, ...W.change);
    const ctxUpd = seg(u, ...W.ctxUpdate);
    // pose a desk for a substitution progress c (identical rules for context and lens copy)
    const poseDesk = (desk, prefix, c) => {
      const ph = phases(target, c);
      const s = {glide: 1, retreatB: 1, penAtRest: true, write: 1};
      if (target === 'link') {
        Object.assign(s, {linked: false, join: ph.join, [`link_${L.k1}`]: ph.link});
      } else if (target === 'clause' && L.useAlt) {
        Object.assign(s, {linked: true, shift: ph.shift, linkRow: 'k2', write: ph.write, link: ph.link, [`write_${L.k1}`]: 1, [`link_${L.k1}`]: 1});
      } else {
        Object.assign(s, {linked: true, link: 1});
      }
      const posed = desk.pose(s);
      if (target === 'clause' && L.useAlt) {
        // the previous reference and loop stay as a faded trace
        posed.nodes[`${prefix}-ink-${L.k1}`] = {opacity: r(1 - 0.62 * ph.fade, 3)};
        posed.nodes[`${prefix}-doc-hl-${L.k1}`] = {opacity: r(0.85 * (1 - ph.shift), 3)};
        posed.nodes[`${prefix}-doc-hl-${L.k2}`] = {opacity: r(0.85 * ph.shift, 3)};
      } else if (target === 'link') {
        posed.nodes[`${prefix}-doc-hl-${L.k1}`] = {opacity: r(0.85 * ph.join, 3)};
      } else {
        posed.nodes[`${prefix}-doc-hl-${L.k1}`] = {opacity: 0.85};
      }
      if (target === 'annexId' && ctx.show('all')) {
        const out = clamp(c * 2), inn = clamp(c * 2 - 1);
        posed.nodes[`${prefix}-annex-label-v0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
        posed.nodes[`${prefix}-annex-label-v1`] = {opacity: r(inn, 3), transform: `translate(0 ${r(10 * (1 - inn))})`};
        posed.nodes[`${prefix}-ref-${L.k1}-v0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
        posed.nodes[`${prefix}-ref-${L.k1}-v1`] = {opacity: r(inn, 3), transform: `translate(0 ${r(10 * (1 - inn))})`};
      }
      return {posed, ph};
    };
    const ctxP = poseDesk(L.stage, 'ctx', ctxUpd);
    const lensP = poseDesk(L.copy, 'lz', change);
    Object.assign(nodes, ctxP.posed.nodes, lensP.posed.nodes);
    if (target !== 'annexId') nodes['lz-ghost'] = {opacity: r(lensP.ph.ghost * 0.7, 3)};
    // context: full size → docked beside/above the lens → full size again
    const place = ease.inOutCubic(seg(u, ...W.toDock)) * (1 - ease.inOutCubic(seg(u, ...W.toHero)));
    const kNow = L.kH + (L.k - L.kH) * place;
    const cx = L.hx + (L.sx - L.hx) * place, cy = L.hy + (L.sy - L.hy) * place;
    nodes['ctx-place'] = {transform: T(cx, cy, 0, kNow)};
    const rel = kNow / L.k;
    nodes['lens-follow'] = {transform: T(r(cx - L.sx * rel, 3), r(cy - L.sy * rel, 3), 0, r(rel, 5))};
    // lens open / close: the window is OPAQUE while it travels (it grows from
    // and shrinks onto its own source), so nothing is shown twice
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    // the context dims quickly as the lens starts to grow, so the copy in the
    // travelling window never competes with the sheets around it
    Object.assign(nodes, L.L2.frame(lp, clamp(lp * 2.5)));
    nodes['lens-win'] = {opacity: lp > 0.001 ? 1 : 0};
    // annotation
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.beforeChip.box.w * (1 - seg(u, ...W.strike)))};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      const am = ease.inOutCubic(seg(u, ...W.annMove));
      nodes.ann = {opacity: u >= W.before[0] ? 1 : 0, transform: `translate(${r(L.annShift.x * am)} ${r(L.annShift.y * am)})`};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    nodes.marker = {opacity: r(seg(u, ...W.marker), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = change <= 0 ? 'before' : change >= 1 ? 'after' : 'changing';
    const digest = x => ({holder: x.annexHolder, annex: x.annexCenter, eyelet: x.eyelet, link: x.linkProgress});
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        lensChange: r(change, 3),
        contextChange: r(ctxUpd, 3),
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        lensAnnex: lensP.posed.semantic.annexCenter,
        contextAnnex: ctxP.posed.semantic.annexCenter,
        lens: digest(lensP.posed.semantic),
        context: digest(ctxP.posed.semantic),
        focusTarget: target,
        contextScale: r(kNow, 4),
        contextPlacement: place <= 0 ? 'full' : place >= 1 ? 'docked' : 'moving',
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        region: {x: r(L.sx + L.reg.x0 * L.k), y: r(L.sy + L.reg.y0 * L.k), w: r((L.reg.x1 - L.reg.x0) * L.k), h: r((L.reg.y1 - L.reg.y0) * L.k)},
        allReached: ctxP.posed.semantic.allReached && lensP.posed.semantic.allReached,
        coreInLens: L.coreInLens,
        markerFrames: L.markerFrames,
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
    slug: 'documents-06-inspect',
    title: 'Annex incorporated — inspect the join',
    titleEs: 'Anexo incorporado — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Anexo incorporado',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens enlarges a real copy of the junction between the clause reference, the contract margin and the annex tab; one datum is substituted inside the lens (separate → linked, clause re-targeted, or annex id replaced), the previous value stays traceable, and the context returns with a changed-datum marker.',
    tags: ['annex', 'inspect', 'lens', 'clause', 'cross-reference', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/anexo-incorporado.js', 'src/frameworks/lens.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {en: {...ANNEX_STRINGS.en}, es: {...ANNEX_STRINGS.es}},
  scene,
});
