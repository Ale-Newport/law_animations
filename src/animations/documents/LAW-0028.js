/**
 * LAW-0028 — Traducción paralela · inspect
 *
 * Storyboard (context miniature + detail lens, 8 s):
 *  0.00–0.20  build: the aligned spread from the story (guides drawn, stamp
 *             pressed, pens at rest) as a context miniature; the translated
 *             segment that holds the key term shows the BEFORE datum.
 *  0.20–0.45  isolate: a lens opens on that segment — a real enlarged copy of
 *             the translated page and of the end of its guide, drawn at the
 *             same coordinates — while the rest of the context dims.
 *  0.45–0.75  substitute: inside the lens only the equivalent changes
 *             (beforeValue → afterValue). The old value lifts out before the
 *             new one settles; the dependent marks follow (question mark /
 *             underline, dashed / solid bracket of that pair). A single
 *             before → after annotation keeps the old value traceable.
 *  0.75–1.00  return: the lens closes onto its source, the context shows the
 *             new datum and a changed-datum marker. No validity or outcome is
 *             inferred. Seeking back restores the BEFORE datum exactly.
 * A value of "?" (or an empty string) means "no confirmed equivalent".
 * @module animations/documents/LAW-0028
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {inspectFields, str} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {lens} from '../../frameworks/lens.js';
import {translationFields, TP_STRINGS, translationDesk, deskLayout, DESK, pageNode, linkGeometry, linkNodes, linkFrame, pairColor, routedCallout} from './kits/traduccion-paralela.js';

const ID = 'LAW-0028';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.03, 0.12], shrink: [0.15, 0.23], open: [0.24, 0.42], before: [0.36, 0.44], strike: [0.47, 0.53],
  out: [0.5, 0.59], in: [0.59, 0.68], bracket: [0.55, 0.65], mark: [0.64, 0.72], after: [0.64, 0.72],
  close: [0.76, 0.84], ctxOut: [0.79, 0.815], ctxIn: [0.815, 0.84], grow: [0.84, 0.92], marker: [0.92, 0.97],
};

const sceneSchema = {
  ...translationFields,
  ...inspectFields(['equivalent']),
  stampLabel: str('Text of the reviewer stamp on the translation header', 22),
};
sceneSchema.beforeValue = {...sceneSchema.beforeValue, description: 'Equivalent shown in the slot before the substitution; "?" or an empty string means no confirmed equivalent (the slot keeps the source term with a question mark)'};
sceneSchema.afterValue = {...sceneSchema.afterValue, description: 'Equivalent shown after the substitution; "?" or an empty string means no confirmed equivalent'};

const defaultParams = {
  documentId: 'TR-208',
  documentTitle: 'Carta de entrega',
  targetTitle: 'Delivery letter',
  languages: {source: 'ES', target: 'EN'},
  clauses: [
    'El proveedor entrega veinte cajas el día 3.',
    'La carga se deja en la lonja del puerto.',
    'Cada parte guarda una copia de esta carta.',
  ],
  translations: [
    'The supplier delivers twenty boxes on day 3.',
    'The load is left at the port fish-market hall.',
    'Each party keeps a copy of this letter.',
  ],
  term: {segment: 1, source: 'lonja', target: 'fish-market hall'},
  signers: [{name: 'Lena Ortiz', role: 'Translator'}, {name: 'Tomás Rivera', role: 'Reviewer'}],
  redactions: [],
  focusTarget: 'equivalent',
  beforeValue: '?',
  afterValue: 'fish-market hall',
  detailGeometry: {zoom: 2.8, placement: 'auto'},
  contextLabels: {context: 'Aligned letter on the translation file', marker: 'Equivalent changed'},
  stampLabel: 'ALIGNED',
};

/** Context desk, its scale and the lens placement per shape. */
const LAYOUT = {
  landscape: {size: [2140, 900], desk: 'landscape', k: 0.64, ctx: [16, 110], lensSide: 'right'},
  // square: the square desk itself (full view fills the frame); miniature centred on top, lens below
  square: {size: [1500, 1300], desk: 'square', k: 0.6, ctx: [318, 80], lensSide: 'below'},
  portrait: {size: [1000, 1400], desk: 'portrait', k: 0.6, ctx: [230, 80], lensSide: 'below'},
};

const unconfirmed = v => !v || v.trim() === '' || v.trim() === '?';

const scene = {
  sizes: {landscape: LAYOUT.landscape.size, square: LAYOUT.square.size, portrait: LAYOUT.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const Lo = LAYOUT[ctx.view.shape];
    const D = {w: Lo.size[0], h: Lo.size[1]};
    const s0 = Math.min(ctx.design.w / D.w, ctx.design.h / D.h);
    const ox = (ctx.design.w - D.w * s0) / 2, oy = (ctx.design.h - D.h * s0) / 2;
    const G = DESK[Lo.desk];
    const k = Lo.k;
    // context caption above the context view (up to two lines, never cut):
    // the miniature and the full view leave room for its real height
    const capW = G.W * k - 12;
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 6, y: 0, maxWidth: capW, size: 34, maxLines: 2, name: 'ctx-caption', weight: 600}) : null;
    const capTop = ctxCap ? ctxCap.box.h + 16 : 0;
    const cx = Lo.ctx[0];
    const cy = Math.max(Lo.ctx[1], capTop + 12);
    const beforeU = unconfirmed(p.beforeValue), afterU = unconfirmed(p.afterValue);
    const variant = (key, v, u) => (u ? {key, kind: 'unc'} : {key, kind: 'avail', text: v});
    // the after-value comes first so the underline is sized to it
    const variants = [variant('v1', p.afterValue, afterU), variant('v0', p.beforeValue, beforeU)];
    const slotTexts = [p.beforeValue, p.afterValue].filter(v => !unconfirmed(v));
    const L = deskLayout(ctx, Lo.desk, p, {slotTexts: slotTexts.length ? slotTexts : [p.term.target]});
    const links = Array.from({length: L.n}, (_, i) => `link${i}`);
    const stage = translationDesk(ctx, {prefix: 'ctx', key: Lo.desk, p, L, slotVariants: variants, plans: [links], dashedTarget: false, bothBrackets: true, stampLabel: p.stampLabel, folderLabel: '', chips: false});
    const toD = q => ({x: cx + q.x * k, y: cy + q.y * k});
    const stageBox = {x: cx, y: cy, w: G.W * k, h: G.H * k};

    // --- lens source: the translated segment that holds the term + its guide
    // end. Its top and bottom are snapped to the middle of the blank gaps
    // around the segment, so the lens never cuts through a neighbouring line.
    const kk = L.k;
    const segsT = L.pages.target.segs;
    const segT = kk >= 0 ? segsT[kk] : null;
    let reg;
    if (segT) {
      const prevEnd = kk > 0 ? segsT[kk - 1].bottom : L.pages.target.ruleY;
      const nextTop = kk + 1 < segsT.length ? segsT[kk + 1].top : L.footerY;
      const top = (prevEnd + segT.top) / 2;
      const bottom = (segT.bottom + nextTop) / 2;
      reg = {x: stage.tgtTL.x - G.gutter * 0.38, y: stage.tgtTL.y + top, w: G.gutter * 0.38 + L.pageW - L.pad * 0.35, h: bottom - top};
    } else reg = {x: stage.tgtTL.x, y: stage.tgtTL.y, w: L.pageW, h: L.pageH * 0.2};
    const rTL = toD(reg);
    const source = {x: rTL.x, y: rTL.y, w: reg.w * k, h: reg.h * k};
    const ratio = source.h / source.w;
    // room kept under the lens for the before → after annotation (up to three lines)
    const annRoom = Lo.lensSide === 'right' ? 250 : 190;
    let dest;
    if (Lo.lensSide === 'right') {
      // the lens may overlap the (dimmed, empty) right margin of the miniature desk
      const x0 = Math.min(stageBox.x + stageBox.w + 40, source.x + source.w + 70);
      const w = Math.min(D.w - x0 - 20, source.w * p.detailGeometry.zoom, (D.h - 40 - annRoom) / ratio);
      dest = {x: x0 + (D.w - x0 - 20 - w) / 2, y: 0, w, h: w * ratio};
      dest.y = Math.max(stageBox.y + 10, Math.min(source.y + source.h / 2 - dest.h / 2 - 40, D.h - annRoom - dest.h));
    } else {
      const maxH = D.h - (stageBox.y + stageBox.h + 40) - annRoom;
      const w = Math.min(D.w - 40, source.w * p.detailGeometry.zoom, maxH / ratio);
      dest = {x: (D.w - w) / 2, y: stageBox.y + stageBox.h + 40, w, h: w * ratio};
    }

    // --- lens content: a second, real copy of the translated page and of guide k, same coordinates
    const lensPage = pageNode(ctx, L, 'target', {prefix: 'lens-tgt', showText: ctx.show('all'), docId: p.documentId, redactions: p.redactions, lang: p.languages.target, langLabel: t.translation, slotVariants: variants});
    const lensLinkGeo = kk >= 0 ? linkGeometry(L, kk, stage.srcTL, stage.tgtTL) : null;
    const lensLink = lensLinkGeo ? linkNodes(ctx, 'lens-lk', lensLinkGeo, pairColor(ctx, kk).c, {dashedTarget: true, width: 5}) : null;
    const lensContent = g({transform: T(cx, cy, 0, k)}, lensLink, g({transform: T(stage.tgtTL.x, stage.tgtTL.y)}, lensPage.node));
    const Lz = lens(ctx, {name: 'lens', source, dest, content: lensContent, frame: stageBox, color: th.accent});

    // --- single editorial annotation: before → after (old value struck but kept)
    const valueText = (v, u) => `${t.equivalent}: ${u ? `«${p.term.source}» (${t.notConfirmed})` : v}`;
    const annY = dest.y + dest.h + 24;
    // beside the context (wide frame) the two values are stacked under the
    // lens, old above new with a downward arrow; below the lens (tall and
    // square frames) they sit side by side and may use the full width. The
    // full values are kept: the chips wrap (up to three lines), never cut.
    const stacked = Lo.lensSide === 'right';
    const zoneX0 = Math.max(dest.x, stageBox.x + stageBox.w + 24);
    const annMax = stacked ? D.w - 20 - zoneX0 : D.w - 40;
    const annCx = stacked ? zoneX0 + annMax / 2 : D.w / 2;
    const mkBefore = y => chip(ctx, valueText(p.beforeValue, beforeU), stacked
      ? {x: annCx, y, anchor: 'middle', maxWidth: annMax, size: 32, maxLines: 3, fill: th.card, name: 'ann-before'}
      : {x: annCx - 30, y, anchor: 'end', maxWidth: annMax / 2 - 36, size: 32, maxLines: 3, fill: th.card, name: 'ann-before'});
    const beforeChip = ctx.show('key') ? mkBefore(annY) : null;
    const afterY = stacked && beforeChip ? beforeChip.box.y + beforeChip.box.h + 52 : annY;
    const afterChip = ctx.show('key') ? chip(ctx, valueText(p.afterValue, afterU), stacked
      ? {x: annCx, y: afterY, anchor: 'middle', maxWidth: annMax, size: 32, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}
      : {x: annCx + 30, y: annY, anchor: 'start', maxWidth: annMax / 2 - 36, size: 32, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}) : null;
    const arrowY = stacked ? (beforeChip ? beforeChip.box.y + beforeChip.box.h + 26 : annY) : annY + (beforeChip ? beforeChip.box.h / 2 : 26);
    // the old value is struck through line by line (it stays readable and traceable)
    let strike = null, strikeLen = 0;
    if (beforeChip) {
      const f = beforeChip.fit;
      const top = beforeChip.box.y + 32 * 0.38;
      const segs = f.lines.map((line, i) => {
        const w = ctx.measure(line, f.size, f.weight, f.family);
        const y = top + i * f.lineHeight + f.size * 0.52;
        return {x0: beforeChip.box.cx - w / 2 - 4, x1: beforeChip.box.cx + w / 2 + 4, y};
      });
      strikeLen = segs.reduce((a, q) => a + (q.x1 - q.x0), 0);
      strike = h('path', {name: 'ann-strike', d: segs.map(q => `M${r(q.x0)} ${r(q.y)}H${r(q.x1)}`).join(''), fill: 'none', stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(strikeLen)} ${r(strikeLen + 10)}`, 'stroke-dashoffset': r(strikeLen)});
    }

    // --- full-size context for the build and return beats (the miniature is used while the lens is open)
    const topFull = Math.max(70, capTop + 12);
    const K = Math.min(D.w / G.W, (D.h - topFull - 6) / G.H);
    const full = {x: (D.w - G.W * K) / 2, y: topFull + ((D.h - topFull - 6) - G.H * K) / 2, k: K};
    const mini = {x: cx, y: cy, k};

    // --- changed-datum marker, in STAGE coordinates inside the context view (it cannot detach)
    const sb = stage.slotBox;
    // the pin sits in the page's outer margin, level with the (last line of
    // the) changed datum: it marks the line without covering any letter,
    // underline or punctuation
    const tgtRight = stage.tgtTL.x + L.pageW;
    // left edge clear of the text column; the pin straddles the page edge
    const pinX0 = tgtRight - L.pad + 5;
    const pinR = Math.max(13, Math.min(18, (G.W - 2 - pinX0) / 2));
    const pin = sb
      ? {x: pinX0 + pinR, y: sb.y + sb.h - L.s * 0.62}
      : {x: tgtRight - L.pad, y: stage.tgtTL.y + L.pad};
    const laneX = tgtRight - L.pad * 0.45;
    let marker = null;
    if (ctx.show('key')) {
      const rightZone = Lo.desk === 'landscape';
      const mk = at => routedCallout(ctx, {name: 'marker', text: p.contextLabels.marker, chipAt: at, anchor: 'start', maxWidth: rightZone ? stage.W - at.x - 24 : laneX - at.x - 60, size: 42, maxLines: 2, color: th.accent2,
        route: b => (rightZone
          ? [{x: b.x, y: b.y + b.h / 2}, {x: pin.x + pinR + 22, y: b.y + b.h / 2}, {x: pin.x + pinR + 22, y: pin.y}, {x: pin.x + pinR, y: pin.y}]
          : [{x: b.x + b.w, y: b.y + b.h / 2}, {x: pin.x, y: b.y + b.h / 2}, {x: pin.x, y: pin.y - pinR}])});
      if (rightZone) {
        const probe = mk({x: pin.x + pinR + 44, y: 0});
        marker = mk({x: pin.x + pinR + 44, y: pin.y - probe.box.h / 2});
      } else {
        // top-left of the desk, ending above the folder tab
        const probe = mk({x: 24, y: 0});
        marker = mk({x: 24, y: Math.max(20, stage.folderTop - 14 - probe.box.h)});
      }
    }
    const pinNode = g({name: 'marker-pin', opacity: 0},
      h('circle', {cx: r(pin.x), cy: r(pin.y), r: pinR, fill: th.accent2, stroke: th.paper, 'stroke-width': 3.5}),
      h('path', {d: `M${r(pin.x - pinR * 0.47)} ${r(pin.y + pinR * 0.03)}l${r(pinR * 0.32)} ${r(pinR * 0.32)}l${r(pinR * 0.61)} ${r(-pinR * 0.68)}`, fill: 'none', stroke: '#fff', 'stroke-width': r(pinR * 0.24, 2), 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}));
    return {D, s0, ox, oy, cx, cy, k, full, mini, stage, L, Lz, source, dest, lensLinkGeo, beforeChip, afterChip, arrowY, strike, strikeLen, ctxCap, capTop, marker, pinNode, beforeU, afterU, annCx, stacked};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({transform: T(L.ox, L.oy, 0, L.s0)},
      L.ctxCap && g({name: 'ctx-cap-g'}, g({transform: T(0, -L.capTop)}, L.ctxCap.node)),
      g({name: 'ctx-view', transform: T(L.full.x, L.full.y, 0, L.full.k)}, L.stage.node, L.pinNode, L.marker && L.marker.node),
      L.Lz.node,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {name: 'ann-arrow', opacity: 0, d: L.stacked ? `M${r(L.annCx)} ${r(L.arrowY - 16)}v28m-10 -11l10 11l10 -11` : `M${r(L.annCx - 16)} ${r(L.arrowY)}h28m-11 -10l11 10l-11 10`, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const n = L.L.n;
    // context: final state of the story; the term slot shows before, then after
    const ctxOut = seg(u, ...W.ctxOut), ctxIn = seg(u, ...W.ctxIn);
    const posed = L.stage.pose({
      pen: [1], stamp: 1,
      slot: {v0: 1 - ctxOut, v1: ctxIn},
      dashed: L.afterU ? (L.beforeU ? 1 : ctxIn) : (L.beforeU ? 1 - ctxIn : 0),
      // dependent marks: "?" belongs to an unconfirmed value, the underline to an available one
      marks: {q: clamp((L.beforeU ? 1 - ctxOut : 0) + (L.afterU ? ctxIn : 0)), ul: clamp((!L.beforeU ? 1 - ctxOut : 0) + (!L.afterU ? ctxIn : 0))},
    });
    Object.assign(nodes, posed.nodes);
    // camera: full context → miniature while the lens is open → full context again
    const m = ease.inOutCubic(seg(u, ...W.shrink)) * (1 - ease.inOutCubic(seg(u, ...W.grow)));
    const view = {x: lerp(L.full.x, L.mini.x, m), y: lerp(L.full.y, L.mini.y, m), k: lerp(L.full.k, L.mini.k, m)};
    nodes['ctx-view'] = {transform: T(view.x, view.y, 0, view.k)};
    if (L.ctxCap) nodes['ctx-cap-g'] = {transform: T(view.x, view.y)};
    // lens open / close
    const open = ease.inOutCubic(seg(u, ...W.open));
    const close = ease.inOutCubic(seg(u, ...W.close));
    const lp = open * (1 - close);
    Object.assign(nodes, L.Lz.frame(lp, lp));
    // lens copy: final-state tints, badges and guide
    for (let i = 0; i < n; i++) {
      nodes[`lens-tgt-tint-${i}`] = {opacity: 0.55};
      nodes[`lens-tgt-badge-${i}`] = {fill: pairColor(ctx, i).c};
      if (ctx.show('all')) nodes[`lens-tgt-badgen-${i}`] = {fill: '#fff'};
    }
    // substitution inside the lens: old value lifts out, then the new one settles
    const out = seg(u, ...W.out), inn = seg(u, ...W.in);
    const lift = ctx.reduced ? 0 : L.L.s * 0.55;
    nodes['lens-tgt-slot-v0'] = {opacity: r(1 - out, 3), transform: T(0, -lift * out)};
    nodes['lens-tgt-slot-v1'] = {opacity: r(inn, 3), transform: T(0, lift * (1 - inn))};
    const mark = seg(u, ...W.mark);
    const ulT = L.stage.markPolys.ul ? L.stage.markPolys.ul.poly.total : 0;
    const qT = L.stage.markPolys.q ? L.stage.markPolys.q.poly.total : 0;
    // dependent marks: "?" belongs to an unconfirmed value, the underline to an available one
    const qOn = (L.beforeU ? 1 - out : 0) + (L.afterU ? mark : 0);
    const ulOn = (!L.beforeU ? 1 - out : 0) + (!L.afterU ? mark : 0);
    nodes['lens-tgt-q'] = {'stroke-dashoffset': r(qT * (1 - clamp(qOn)))};
    nodes['lens-tgt-qdot'] = {opacity: clamp(qOn) >= 0.98 ? 1 : 0};
    nodes['lens-tgt-ul'] = {'stroke-dashoffset': r(ulT * (1 - clamp(ulOn)))};
    const br = seg(u, ...W.bracket);
    const dashedLens = L.afterU ? (L.beforeU ? 1 : br) : (L.beforeU ? 1 - br : 0);
    if (L.lensLinkGeo) Object.assign(nodes, linkFrame('lens-lk', L.lensLinkGeo, 1, 1, dashedLens, true));
    // annotation
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(seg(u, ...W.before) * (1 - 0.45 * seg(u, ...W.strike)), 3)};
      nodes['ann-strike'] = {'stroke-dashoffset': r(L.strikeLen * (1 - seg(u, ...W.strike)))};
      nodes['ann-after'] = {opacity: r(seg(u, ...W.after), 3)};
      // the arrow joins the two values: it appears with the new one
      nodes['ann-arrow'] = {opacity: r(seg(u, ...W.after), 3)};
      nodes.ann = {opacity: u < W.before[0] ? 0 : r(1 - seg(u, W.close[0], W.close[0] + 0.04), 3)};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(seg(u, ...W.ctxCaption), 3)};
    const mk = seg(u, ...W.marker);
    nodes['marker-pin'] = {opacity: r(mk, 3)};
    if (L.marker) Object.assign(nodes, L.marker.frame(mk));
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.out[0] ? 'before' : u >= W.in[1] ? 'after' : 'changing';
    const contextDatum = ctxIn >= 1 ? 'after' : ctxOut > 0 ? 'changing' : 'before';
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        datum,
        contextDatum,
        lensValue: datum === 'after' ? (L.afterU ? '?' : ctx.params.afterValue) : datum === 'before' ? (L.beforeU ? '?' : ctx.params.beforeValue) : null,
        contextValue: contextDatum === 'after' ? (L.afterU ? '?' : ctx.params.afterValue) : contextDatum === 'before' ? (L.beforeU ? '?' : ctx.params.beforeValue) : null,
        lensBracketDashed: r(dashedLens, 3),
        contextBracketDashed: r(L.afterU ? (L.beforeU ? 1 : ctxIn) : (L.beforeU ? 1 - ctxIn : 0), 3),
        source: {x: r(L.source.x), y: r(L.source.y), w: r(L.source.w), h: r(L.source.h)},
        contextSlot: L.stage.slotBox ? {x: r(view.x + L.stage.slotBox.x * view.k), y: r(view.y + L.stage.slotBox.y * view.k), w: r(L.stage.slotBox.w * view.k), h: r(L.stage.slotBox.h * view.k)} : null,
        markerVisible: mk > 0,
        view: {x: r(view.x), y: r(view.y), k: r(view.k, 4)},
        viewMode: m >= 1 ? 'miniature' : m <= 0 ? 'full' : 'moving',
        linked: posed.semantic.linked,
        allReached: posed.semantic.allReached,
        focusTarget: ctx.params.focusTarget,
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
    slug: 'documents-07-inspect',
    title: 'Parallel translation — inspect the term slot',
    titleEs: 'Traducción paralela — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Traducción paralela',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'A lens enlarges the translated segment that holds the key term (a real copy with the end of its guide), substitutes the equivalent (for example from “not confirmed” to an available equivalent), updates only the dependent marks and bracket, keeps the previous value traceable, and returns to the aligned spread with a changed-datum marker.',
    tags: ['translation', 'inspect', 'lens', 'term', 'equivalent', 'before-after', 'substitution'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/traduccion-paralela.js', 'src/frameworks/lens.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: TP_STRINGS,
  scene,
});
