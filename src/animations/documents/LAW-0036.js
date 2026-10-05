/**
 * LAW-0036 — Notificación documentada · inspect
 *
 * Storyboard:
 *  0.00–0.20  context: the two offices at the end of the delivery. The
 *             sender's hand brings the returned acknowledgment card from the
 *             hatch and lays it in the record folder (the state produced by
 *             the action). The card carries the BEFORE datum.
 *  0.20–0.45  isolate: the whole scene shrinks into a context miniature while
 *             a lens grows out of the card itself — a real copy drawn in the
 *             same stage coordinates, so the detail keeps its origin (cone
 *             lines stay tied to the miniature).
 *  0.45–0.75  substitute ONE datum inside the lens (received-by signature
 *             drawn, stamp date or addressee replaced). The old value lifts
 *             out before the new one settles; a single before → after
 *             annotation keeps the old value traceable (struck, not erased).
 *  0.75–1.00  the lens collapses back onto the card, the scene returns to full
 *             size showing the new datum and a "datum changed" marker. Seeking
 *             back before 0.5 restores the previous datum exactly. No validity,
 *             responsibility or outcome is inferred.
 * @module animations/documents/LAW-0036
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {documentsFields, inspectFields} from '../../schemas/fields.js';
import {chip, caption} from '../../primitives/annotate.js';
import {notificationStage, ackCard, placeFree, wordSafeSize, STAGE, CARD, NOTICE_STRINGS, noticeObjectLabels, receiptDateField} from './kits/notificacion-documentada.js';

const ID = 'LAW-0036';
const DURATION = 8000;
const BEATS = {build: [0, 0.2], isolate: [0.2, 0.45], substitute: [0.45, 0.75], return: [0.75, 1]};
const W = {
  ctxCaption: [0.02, 0.1], retreatB: [0.03, 0.1], cardIn: [0.03, 0.14], retreatA2: [0.13, 0.2],
  open: [0.22, 0.42], before: [0.37, 0.44], strike: [0.47, 0.53], change: [0.5, 0.66], after: [0.6, 0.66],
  // the before → after annotation is fully gone before the scene grows back
  annOut: [0.72, 0.76], close: [0.76, 0.88], ctxUpdate: [0.8, 0.87], marker: [0.88, 0.95],
};

const STRINGS = {
  en: {...NOTICE_STRINGS.en, signature: 'Received by', dateField: 'Stamp date', addressee: 'Addressee'},
  es: {...NOTICE_STRINGS.es, signature: 'Recibido por', dateField: 'Fecha del sello', addressee: 'Destinatario'},
};

const sceneSchema = {
  ...documentsFields,
  ...inspectFields(['signature', 'date', 'addressee']),
  objectLabels: noticeObjectLabels,
  receiptDate: receiptDateField,
};

const defaultParams = {
  documentId: 'NTF-207',
  documentTitle: 'Notice of Meeting',
  clauses: ['Date and place of the meeting', 'Documents enclosed', 'Contact for questions'],
  signers: [{name: 'Alex Moreno', role: 'Sender'}, {name: 'Sam Okafor', role: 'Recipient'}],
  redactions: [],
  focusTarget: 'signature',
  beforeValue: 'Not signed',
  afterValue: 'Signed',
  detailGeometry: {zoom: 4, placement: 'auto'},
  contextLabels: {context: 'Acknowledgment returned to the sender’s notice file', marker: 'Datum changed'},
  objectLabels: {outTray: 'OUT', inTray: 'IN', folder: 'Notice file', card: 'Acknowledgment', stamp: 'RECEIVED'},
  receiptDate: 'Day 3',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
const CAP = 64; // caption strip above the scene (design units)

/** Miniature scale per shape (relative to the full-size context): small enough that the lens is the
 * largest thing on screen while the detail is inspected. */
const THUMB_K = {landscape: 0.5, square: 0.36, portrait: 0.4};
const ANN_RESERVE = 150;

/**
 * Leader (cone) lines joining the source rectangle on the miniature to the lens window: the two
 * nearest sides. `horiz` fixes the side pair so the leaders never jump while the lens opens.
 */
function coneLines(S, Rw, horiz) {
  return horiz
    ? (Rw.x > S.x ? [[S.x + S.w, S.y, Rw.x, Rw.y], [S.x + S.w, S.y + S.h, Rw.x, Rw.y + Rw.h]] : [[S.x, S.y, Rw.x + Rw.w, Rw.y], [S.x, S.y + S.h, Rw.x + Rw.w, Rw.y + Rw.h]])
    : (Rw.y > S.y ? [[S.x, S.y + S.h, Rw.x, Rw.y], [S.x + S.w, S.y + S.h, Rw.x + Rw.w, Rw.y]] : [[S.x, S.y, Rw.x, Rw.y + Rw.h], [S.x + S.w, S.y, Rw.x + Rw.w, Rw.y + Rw.h]]);
}

/** Whether a segment passes within `pad` of a box (sampled). */
function segHitsBox([x1, y1, x2, y2], b, pad) {
  for (let i = 0; i <= 48; i++) {
    const x = x1 + ((x2 - x1) * i) / 48, y = y1 + ((y2 - y1) * i) / 48;
    if (x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad) return true;
  }
  return false;
}

/** Stage action values of the held context (the returned card filed, every hand at rest). */
const heldValues = (sig = 1) => ({
  reachA: 1, carryA: 1, reachB: 1, carryB: 1, retreatA: 1,
  penTo: 1, write: sig, penBack: 1, toStamp: 1, stampGo: 1, stampBack: 1,
  toCard: 1, cardOut: 1, reachA2: 1, retreatB: 1, cardIn: 1, retreatA2: 1,
});

const scene = {
  // square: wider than the stage so the miniature + annotation column sit beside the lens
  sizes: {landscape: [1860, 940], square: [1560, 1204], portrait: [940, 1420]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const shape = ctx.view.shape;
    const axis = AXIS[shape];
    const st = STAGE[axis];
    const D = ctx.design;
    const target = p.focusTarget;

    const alt = target === 'date' ? {date: p.afterValue} : target === 'addressee' ? {to: p.afterValue} : undefined;
    const parties = p.signers.map((sg, i) => (i === 1 && target === 'addressee' ? {...sg, name: p.beforeValue} : sg));
    const date = target === 'date' ? p.beforeValue : p.receiptDate;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const stage = notificationStage(ctx, {prefix: 'ctx', axis, doc, parties, labels: p.objectLabels, date, alt, sigName: p.signers[1].name});

    // Full-size context (below the caption strip) and the miniature.
    const sF = Math.min(D.w / st.w, (D.h - CAP) / st.h);
    const full = {s: sF, x: (D.w - st.w * sF) / 2, y: CAP + (D.h - CAP - st.h * sF) / 2};
    const sT = sF * THUMB_K[shape];
    const tw = st.w * sT, thh = st.h * sT;
    // landscape: miniature top-right, lens left (next to the folder corner), annotation row under the
    // miniature; square: miniature on top (right), the lens enlarged below it across the frame and the
    // before ↓ after column beside the miniature, above the lens and clear of the leader lines;
    // portrait: miniature centred on top, lens below it, annotation row under the lens.
    const thumb = {s: sT, x: shape === 'portrait' ? (D.w - tw) / 2 : D.w - tw - 22, y: CAP};

    // Detail region: the filed card (with its clip) in stage coordinates.
    const cf = stage.cardFolder;
    const region = {x: cf.x - CARD.w / 2 - 34, y: cf.y - CARD.h / 2 - 22, w: CARD.w + 58, h: CARD.h + 44};
    const ratio = region.h / region.w;
    let box;
    if (shape === 'portrait') box = {x: 20, y: CAP + thh + 30, w: D.w - 40, h: D.h - (CAP + thh + 30) - ANN_RESERVE};
    else if (shape === 'square') box = {x: 20, y: CAP + thh + 40, w: D.w - 40, h: D.h - (CAP + thh + 40) - 16};
    else box = {x: 20, y: CAP + 10, w: thumb.x - 60, h: D.h - CAP - 26};
    const zoomCap = p.detailGeometry.zoom * sF;
    const dw = Math.min(box.w, region.w * zoomCap, box.h / ratio);
    const dest = {w: dw, h: dw * ratio, x: box.x + (box.w - dw) / 2, y: shape === 'portrait' ? box.y : box.y + (box.h - dw * ratio) / 2};
    // square: the miniature's right edge lines up with the lens (leaving a column for the annotation)
    const COL_MIN = 380;
    if (shape === 'square') thumb.x = Math.min(D.w - 20, Math.max(dest.x + dest.w, 20 + COL_MIN + 40 + tw)) - tw;
    // leader lines at full opening (their side pair is fixed from this geometry)
    const srcAt = (ox, oy, sc) => ({x: ox + region.x * sc, y: oy + region.y * sc, w: region.w * sc, h: region.h * sc});
    const S1 = srcAt(thumb.x, thumb.y, sT);
    const coneHoriz = Math.abs((dest.x + dest.w / 2) - (S1.x + S1.w / 2)) >= Math.abs((dest.y + dest.h / 2) - (S1.y + S1.h / 2));
    const cones1 = coneLines(S1, dest, coneHoriz);

    // Lens content: an independent copy of the filed card at the same stage coordinates.
    const lensCard = ackCard(ctx, {
      prefix: 'lens-card', title: p.objectLabels.card, docRef: p.documentId, addressee: parties[1].name, signer: p.signers[1].name,
      labels: {doc: t.doc, to: t.to, receivedBy: t.receivedBy}, stampWord: p.objectLabels.stamp, date, showText: ctx.show('all'), alt,
    });
    const clipId = 'lens-clip';

    // Single editorial annotation (before → after), under the lens.
    const label = target === 'signature' ? t.signature : target === 'date' ? t.dateField : t.addressee;
    // square: a vertical before ↓ after stack beside the miniature; landscape: a row under
    // the miniature; portrait: a row under the lens
    const column = shape === 'square';
    let beforeChip = null, afterChip = null, annX, annY, arrow;
    let annClear = true;
    if (column) {
      // the column beside the miniature (left of it, above the lens), centred on the miniature's
      // height, then lifted until it stands clear of both leader lines
      // (it may reach a little into the margin left of the lens so the values stay on few lines)
      const colL = Math.max(20, Math.min(dest.x - 140, thumb.x - 40 - COL_MIN)), colR = thumb.x - 40;
      const colW = colR - colL;
      annX = colL + colW / 2;
      const tB = `${label}: ${p.beforeValue}`, tA = `${label}: ${p.afterValue}`;
      // one size for both chips, small enough that no word is ever split across lines
      const size = Math.min(wordSafeSize(ctx, tB, colW, 36, 24), wordSafeSize(ctx, tA, colW, 36, 24));
      const make = top => {
        const b0 = chip(ctx, tB, {x: annX, y: top, anchor: 'middle', maxWidth: colW, size, maxLines: 3, fill: th.card, name: 'ann-before'});
        const by = b0.box.y + b0.box.h;
        const a0 = chip(ctx, tA, {x: annX, y: by + 70, anchor: 'middle', maxWidth: colW, size, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'});
        return {b0, a0, by};
      };
      if (ctx.show('key')) {
        const probe = make(0);
        const stackH = probe.a0.box.y + probe.a0.box.h;
        const top0 = Math.max(CAP + 6, thumb.y + thh / 2 - stackH / 2);
        const clear = m => ![m.b0.box, m.a0.box, {x: annX - 12, y: m.by, w: 24, h: 70}].some(b => cones1.some(c => segHitsBox(c, b, 16)));
        let m = make(top0);
        for (let top = top0; top >= CAP + 6 && !clear(m); top -= 8) m = make(top);
        annClear = clear(m);
        beforeChip = m.b0;
        afterChip = m.a0;
        arrow = `M${r(annX)} ${r(m.by + 14)}v40m-9 -10l9 10l9 -10`;
      }
    } else {
      const under = shape === 'landscape' ? {x: thumb.x, y: thumb.y + thh + 40, w: tw} : {x: dest.x, y: dest.y + dest.h + 26, w: dest.w};
      annY = under.y;
      const annW = shape === 'landscape' ? under.w : Math.min(D.w - 40, Math.max(dest.w, 960));
      annX = Math.min(D.w - 20 - annW / 2, Math.max(20 + annW / 2, under.x + under.w / 2));
      beforeChip = ctx.show('key') ? chip(ctx, `${label}: ${p.beforeValue}`, {x: annX - 24, y: annY, anchor: 'end', maxWidth: annW / 2 - 30, size: 32, maxLines: 3, fill: th.card, name: 'ann-before'}) : null;
      afterChip = ctx.show('key') ? chip(ctx, `${label}: ${p.afterValue}`, {x: annX + 24, y: annY, anchor: 'start', maxWidth: annW / 2 - 30, size: 32, maxLines: 3, fill: th.accent2Soft, stroke: th.accent2, name: 'ann-after'}) : null;
      const ay = beforeChip ? annY + beforeChip.box.h / 2 : annY + 20;
      arrow = `M${r(annX - 14)} ${r(ay)}h24m-10 -9l10 9l-10 9`;
    }
    if (!column && beforeChip) annClear = ![beforeChip.box, afterChip.box].some(b => cones1.some(c => segHitsBox(c, b, 8)));
    const ctxCap = ctx.show('all') ? caption(ctx, `${t.context}: ${p.contextLabels.context}`, {x: 16, y: 8, maxWidth: D.w - 32, size: 32, minSize: 20, maxLines: 1, name: 'ctx-caption', weight: 600}) : null;

    // Changed-datum marker pinned to the card's top-right corner (stage coordinates).
    const mk = {x: region.x + region.w - 6, y: region.y + 8};
    // After the return the lens annotation fades; the marker keeps the old value traceable.
    // Its chip is placed in free desk space on the sender's side (clear of the trays, the
    // folder and filed card, the arms and hands, the stamp, the pen, the wall and the actor
    // chips of the held pose) and joined to the marker by a short leader.
    let markChip = null, markLeader = null;
    if (ctx.show('key')) {
      const text = `${p.contextLabels.marker} · ${label}: ${p.beforeValue} → ${p.afterValue}`;
      const obstacles = stage.obstacles(stage.pose(heldValues(1)));
      obstacles.push({x: region.x, y: region.y, w: region.w, h: region.h}, {x: mk.x - 26, y: mk.y - 26, w: 52, h: 52});
      const inset = q => ({x: q.x + 18, y: q.y + 18, w: q.w - 36, h: q.h - 36});
      const whole = {x: 18, y: 18, w: st.w - 36, h: st.h - 36};
      let spot = null, made = null;
      // the sender's side first (the marker concerns the sender's file), any free desk space
      // next; long texts step down to narrower / smaller chips with more lines before that
      const variants = [[axis === 'horizontal' ? 520 : 460, 28, 4], [420, 28, 4], [560, 26, 4], [360, 26, 4], [320, 26, 5],
        [480, 24, 4], [340, 24, 5], [340, 22, 5], [300, 22, 6], [300, 20, 6]];
      for (const where of [inset(stage.deskA), whole]) {
        for (const [room, size, lines] of variants) {
          const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: room, size, maxLines: lines});
          if (probe.fit.truncated) continue;
          spot = placeFree(probe.box, {region: where, obstacles, near: mk, gap: 36, step: 8});
          if (spot) { made = {room, size, lines}; break; }
        }
        if (made) break;
      }
      if (!made) {
        // nothing is completely free: the smallest chip at the least-covered spot on the sender's side
        made = {room: 300, size: 20, lines: 6};
        const probe = chip(ctx, text, {x: 0, y: 0, maxWidth: made.room, size: made.size, maxLines: made.lines});
        const R = inset(stage.deskA);
        let best = null;
        for (let y = R.y; y + probe.box.h <= R.y + R.h; y += 12) {
          for (let x = R.x; x + probe.box.w <= R.x + R.w; x += 12) {
            const area = obstacles.reduce((a, q) => a + Math.max(0, Math.min(x + probe.box.w, q.x + q.w) - Math.max(x, q.x)) * Math.max(0, Math.min(y + probe.box.h, q.y + q.h) - Math.max(y, q.y)), 0);
            if (!best || area < best.area) best = {x, y, area};
          }
        }
        spot = best || {x: R.x, y: R.y};
      }
      markChip = chip(ctx, text, {x: spot.x, y: spot.y, anchor: 'start', maxWidth: made.room, size: made.size, maxLines: made.lines, fill: th.card, stroke: th.accent2});
      const b = markChip.box;
      const nb = {x: Math.max(b.x, Math.min(mk.x, b.x + b.w)), y: Math.max(b.y, Math.min(mk.y, b.y + b.h))};
      const d = Math.hypot(nb.x - mk.x, nb.y - mk.y);
      if (d > 30) {
        const k = 24 / d; // start at the marker circle's rim
        markLeader = h('line', {x1: r(mk.x + (nb.x - mk.x) * k), y1: r(mk.y + (nb.y - mk.y) * k), x2: r(nb.x), y2: r(nb.y), stroke: th.accent2, 'stroke-width': 3, 'stroke-dasharray': '4 6', 'stroke-linecap': 'round'});
      }
    }
    // the old value is struck through line by line (a wrapped value gets one stroke per line)
    let strikes = [];
    if (beforeChip) {
      const f = beforeChip.fit;
      const top = beforeChip.box.y + f.size * 0.38;
      strikes = f.lines.map((line, i) => {
        const w = ctx.measure(line, f.size, f.weight, f.family) + 12;
        const y = top + f.size * 0.8 + i * f.lineHeight - f.size * 0.3;
        return {name: i ? `ann-strike-${i}` : 'ann-strike', x: beforeChip.box.cx - w / 2, y, w};
      });
    }
    const strike = strikes.map(k => h('line', {name: k.name, x1: r(k.x), x2: r(k.x + k.w), y1: r(k.y), y2: r(k.y), stroke: th.accent, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(k.w)} ${r(k.w + 10)}`, 'stroke-dashoffset': r(k.w)}));
    return {strikes, stage, st, full, thumb, region, dest, lensCard, clipId, beforeChip, afterChip, arrow, strike, ctxCap, mk, markChip, markLeader, target, cf, coneHoriz, annClear};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const R = L.region;
    const dim = h('path', {name: 'lens-dim', d: `M-20 -20h${L.st.w + 40}v${L.st.h + 40}h${-(L.st.w + 40)}Z` + `M${r(R.x)} ${r(R.y)}v${r(R.h)}h${r(R.w)}v${r(-R.h)}Z`, 'fill-rule': 'evenodd', fill: th.dark ? '#000' : '#1f2328', opacity: 0});
    const marker = g({name: 'marker', opacity: 0},
      L.markLeader,
      h('circle', {cx: L.mk.x, cy: L.mk.y, r: 22, fill: th.accent2, stroke: th.paper, 'stroke-width': 4}),
      h('path', {d: `M${r(L.mk.x)} ${r(L.mk.y - 9)}l9 15.75h-18z`, fill: 'none', stroke: '#fff', 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
      L.markChip && L.markChip.node,
    );
    const src = h('path', {name: 'lens-src', d: roundRectPath(R.x, R.y, R.w, R.h, 12), fill: 'none', stroke: th.accent, 'stroke-width': 5, opacity: 0});
    const lensWin = g({name: 'lens-win', opacity: 0},
      h('defs', null, h('clipPath', {id: ctx.id(L.clipId)}, h('rect', {name: 'lens-cliprect', rx: 22}))),
      h('rect', {name: 'lens-shadow', rx: 22, fill: th.shadow}),
      h('rect', {name: 'lens-bg', rx: 22, fill: '#e9dcc4'}),
      g({'clip-path': ctx.ref(L.clipId)}, g({name: 'lens-content'},
        // folder paper behind the card, then the card copy at its stage pose
        h('rect', {x: R.x - 40, y: R.y - 40, width: R.w + 80, height: R.h + 80, fill: '#f8f4ea'}),
        g({transform: T(L.cf.x, L.cf.y, L.cf.rot)}, L.lensCard.node))),
      h('rect', {name: 'lens-border', rx: 22, fill: 'none', stroke: th.accent, 'stroke-width': 5}),
    );
    return g(null,
      L.ctxCap && L.ctxCap.node,
      g({name: 'ctx-stage'}, L.stage.node, dim, src, marker),
      h('line', {name: 'cone-a', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      h('line', {name: 'cone-b', stroke: th.accent, 'stroke-width': 2.5, 'stroke-dasharray': '8 7', opacity: 0}),
      lensWin,
      L.beforeChip && g({name: 'ann', opacity: 0},
        L.beforeChip.node, L.strike,
        h('path', {d: L.arrow, fill: 'none', stroke: th.fg, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'}),
        L.afterChip.node),
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const sw = k => seg(u, ...W[k]);
    const change = ease.inOutSine(sw('change'));
    const ctxUpd = sw('ctxUpdate');
    const target = L.target;
    // Context: the returned card is laid in the folder; everything else is at its final state.
    const sigCtx = target === 'signature' ? ctxUpd : 1;
    const posed = L.stage.pose({...heldValues(sigCtx), retreatB: sw('retreatB'), cardIn: sw('cardIn'), retreatA2: sw('retreatA2')});
    Object.assign(nodes, posed.nodes);
    // Scene ⇄ miniature and lens window share one progress value.
    const lp = ease.inOutCubic(sw('open')) * (1 - ease.inOutCubic(sw('close')));
    const s = lerp(L.full.s, L.thumb.s, lp), ox = lerp(L.full.x, L.thumb.x, lp), oy = lerp(L.full.y, L.thumb.y, lp);
    nodes['ctx-stage'] = {transform: T(ox, oy, 0, s)};
    // actor chips are unreadable in the miniature: they fade out while it is small
    const chipsOn = r(1 - clamp(lp * 3), 3);
    if (ctx.show('key')) { nodes['ctx-chipA'] = {opacity: chipsOn}; nodes['ctx-chipB'] = {opacity: chipsOn}; }
    const R0 = L.region;
    const S = {x: ox + R0.x * s, y: oy + R0.y * s, w: R0.w * s, h: R0.h * s};
    const D = L.dest;
    const Rw = {x: lerp(S.x, D.x, lp), y: lerp(S.y, D.y, lp), w: lerp(S.w, D.w, lp), h: lerp(S.h, D.h, lp)};
    const k = Rw.w / R0.w;
    const on = lp > 0.001;
    const rect = {x: r(Rw.x), y: r(Rw.y), width: r(Rw.w), height: r(Rw.h)};
    nodes['lens-win'] = {opacity: on ? r(Math.min(1, lp * 4), 3) : 0};
    nodes['lens-cliprect'] = rect;
    nodes['lens-bg'] = rect;
    nodes['lens-border'] = rect;
    nodes['lens-shadow'] = {x: r(Rw.x + 8), y: r(Rw.y + 12), width: rect.width, height: rect.height};
    nodes['lens-content'] = {transform: `${T(Rw.x - R0.x * k, Rw.y - R0.y * k)} scale(${r(k, 4)})`};
    nodes['lens-dim'] = {opacity: r(0.38 * lp, 3)};
    nodes['lens-src'] = {opacity: on ? 1 : 0};
    // cone lines from the miniature's detail to the window (nearest sides, fixed for the layout)
    const cones = coneLines(S, Rw, L.coneHoriz);
    ['cone-a', 'cone-b'].forEach((n, i) => {
      const [x1, y1, x2, y2] = cones[i];
      nodes[n] = {x1: r(x1), y1: r(y1), x2: r(x2), y2: r(y2), opacity: lp > 0.05 ? 1 : 0};
    });
    // Lens copy: stamp always visible (the filed card is stamped); the datum changes here first.
    nodes['lens-card-impr'] = {opacity: 0.92};
    const sigLens = target === 'signature' ? change : 1;
    Object.assign(nodes, L.lensCard.sig.frame(sigLens));
    const swap = (base, pr) => {
      if (!ctx.show('all')) return;
      const out = clamp(pr * 2), inn = clamp(pr * 2 - 1);
      nodes[`${base}0`] = {opacity: r(1 - out, 3), transform: `translate(0 ${r(-10 * out)})`};
      nodes[`${base}1`] = {opacity: r(inn, 3), transform: `translate(0 ${r(10 * (1 - inn))})`};
    };
    if (target === 'date') { swap('lens-card-impr-date', change); swap('ctx-card-impr-date', ctxUpd); }
    if (target === 'addressee') { swap('lens-card-to', change); swap('ctx-card-to', ctxUpd); }
    // Annotation
    if (L.beforeChip) {
      nodes['ann-before'] = {opacity: r(sw('before') * (1 - 0.45 * sw('strike')), 3)};
      const sp = sw('strike'), n = L.strikes.length;
      L.strikes.forEach((k, i) => { nodes[k.name] = {'stroke-dashoffset': r(k.w * (1 - seg(sp, i / n, (i + 1) / n)))}; });
      nodes['ann-after'] = {opacity: r(sw('after'), 3)};
      nodes.ann = {opacity: u >= W.before[0] ? r(1 - sw('annOut'), 3) : 0};
    }
    if (L.ctxCap) nodes['ctx-caption'] = {opacity: r(sw('ctxCaption'), 3)};
    nodes.marker = {opacity: r(sw('marker'), 3)};
    const beat = u < BEATS.build[1] ? 'build' : u < BEATS.isolate[1] ? 'isolate' : u < BEATS.substitute[1] ? 'substitute' : 'return';
    const datum = u < W.change[0] ? 'before' : u >= W.change[1] ? 'after' : 'changing';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        lensOpen: r(lp, 3),
        stageScale: r(s, 4),
        datum,
        contextDatum: ctxUpd >= 1 ? 'after' : ctxUpd > 0 ? 'changing' : 'before',
        lensSignature: r(sigLens, 3),
        contextSignature: r(sigCtx, 3),
        focusTarget: target,
        // the before → after annotation stands clear of the lens leader lines
        annotationClear: L.annClear,
        // source region on screen (moves with the miniature) and the lens window
        source: {x: r(S.x), y: r(S.y), w: r(S.w), h: r(S.h)},
        lens: {x: r(Rw.x), y: r(Rw.y), w: r(Rw.w), h: r(Rw.h)},
        lensCorner: P2(Rw),
        sourceCorner: P2(S),
        card: posed.semantic.card,
        cardHolder: posed.semantic.cardHolder,
        handA: posed.semantic.handA,
        allReached: posed.semantic.allReached,
        reach: posed.semantic.reach,
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
    slug: 'documents-09-inspect',
    title: 'Documented notice — inspect the returned acknowledgment',
    titleEs: 'Notificación documentada — Inspección y cambio de un dato',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Notificación documentada',
    treatment: 'inspect',
    family: 'focus-and-replay',
    description: 'The returned acknowledgment card is laid in the sender’s folder; the scene shrinks to a context miniature while a lens grows out of the card, one datum is substituted (received-by signature, stamp date or addressee) with the previous value kept traceable, and the scene returns to full size with a changed-datum marker.',
    tags: ['notice', 'acknowledgment', 'inspect', 'lens', 'miniature', 'before-after', 'substitution', 'record'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/notificacion-documentada.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
