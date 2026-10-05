/**
 * LAW-0035 — Notificación documentada · contrast
 *
 * Storyboard: two complete, identical offices (sender / recipient separated
 * by the hatch wall). Each starts with the envelope in the OUT tray and a
 * blank acknowledgment card lying in the sender's record folder.
 *  0.00–0.17  identical base situation.
 *  0.17–0.40  the ONE changed fact, shown locally: in A the sender clips the
 *             blank acknowledgment card onto the envelope; in B the card
 *             stays in the folder (a dashed marker rings it in both panels).
 *  0.38–0.77  the same dispatch runs in parallel: envelope carried to the
 *             hatch, taken by the recipient and laid in the IN tray. Only
 *             where a card travelled (A) is it signed, date-stamped, torn off
 *             and returned to the folder; in B the hands simply withdraw.
 *  0.77–1.00  the compared detail is ringed in both folders. Where the frame
 *             has room (wide: a column right of the panels; tall: a strip
 *             under them) an enlarged copy of each folder card lifts out of
 *             its panel and the guide joins the two copies (A signed and
 *             stamped / B blank); on square frames the guide joins the two
 *             folder cards through the band under the panels. A neutral note
 *             states that no outcome is shown — no winner, score or legal
 *             effect.
 * @module animations/documents/LAW-0035
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath} from '../../core/geometry.js';
import {documentsFields, contrastFields} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {pairedGeometry, neutralNote} from '../../frameworks/paired.js';
import {notificationStage, ackCard, STAGE, NOTICE_STRINGS, noticeObjectLabels, receiptDateField, CARD} from './kits/notificacion-documentada.js';

const ID = 'LAW-0035';
const DURATION = 7500;
const BEATS = {base: [0, 0.17], change: [0.17, 0.4], parallel: [0.4, 0.77], guide: [0.77, 1]};
/** Shared windows (both panels) and A-only windows (the record). */
const W = {
  // change: A attaches the card
  fetch: [0.18, 0.235], attach: [0.235, 0.31], backA: [0.31, 0.36], mark: [0.19, 0.24], markOut: [0.4, 0.44], changeChip: [0.2, 0.27],
  // dispatch (both)
  reachA: [0.37, 0.415], carryA: [0.415, 0.49], reachB: [0.44, 0.49], carryB: [0.505, 0.565], retreatA: [0.505, 0.565],
  // record (A only)
  penTo: [0.56, 0.58], write: [0.58, 0.625], penBack: [0.625, 0.65],
  toStamp: [0.565, 0.6], stampGo: [0.615, 0.66], stampBack: [0.66, 0.69],
  toCard: [0.69, 0.715], cardOut: [0.715, 0.745], reachA2: [0.7, 0.745], cardIn: [0.755, 0.79], retreatB: [0.755, 0.79], retreatA2: [0.79, 0.83],
  // no card (B only)
  releaseB: [0.57, 0.62], settleA: [0.57, 0.63],
  // closing comparison: rings, enlarged copies lift out, guide, then the notes swap (the
  // shared-facts note is fully gone before the neutral note fades in)
  rings: [0.79, 0.82], fly: [0.795, 0.875], guide: [0.86, 0.92], sharedOut: [0.77, 0.8], note: [0.9, 0.95],
};

const sceneSchema = {
  ...documentsFields,
  ...contrastFields(),
  objectLabels: noticeObjectLabels,
  receiptDate: receiptDateField,
};

const defaultParams = {
  documentId: 'NTF-207',
  documentTitle: 'Notice of Meeting',
  clauses: ['Date and place of the meeting', 'Documents enclosed', 'Contact for questions'],
  signers: [{name: 'Alex Moreno', role: 'Sender'}, {name: 'Sam Okafor', role: 'Recipient'}],
  redactions: [],
  scenarioA: {label: 'Documented delivery', caption: 'An acknowledgment card travels with the notice'},
  scenarioB: {label: 'Delivery not evidenced', caption: 'The notice travels without an acknowledgment card'},
  changedFact: 'Only difference: whether the acknowledgment card is sent with the notice',
  sharedFacts: ['Same notice', 'Same parties', 'Same trays and hand-off'],
  comparisonLabels: {guide: 'Changed fact: acknowledgment card', neutral: 'Two situations side by side — no legal effect is stated'},
  objectLabels: {outTray: 'OUT', inTray: 'IN', folder: 'Notice file', card: 'Acknowledgment', stamp: 'RECEIVED'},
  receiptDate: 'Day 3',
};

/**
 * Stage axis, arrangement and where the enlarged compared detail goes, per
 * available shape. Wide frames have spare width (a column right of the two
 * panels), tall frames spare height (a strip under the stacked panels); the
 * square frame has neither, so its guide joins the folder cards directly.
 */
const ARRANGE = {
  landscape: {axis: 'square', arrangement: 'row', detail: 'column'},
  square: {axis: 'vertical', arrangement: 'row', detail: 'none'},
  portrait: {axis: 'horizontal', arrangement: 'column', detail: 'row'},
};
/** Type sizes (design units) chosen so headers, actor chips and notes stay ≥ ~20 px at 1080p. */
const FONT = {
  landscape: {label: 46, caption: 40, chip: 42, note: 40, guide: 40},
  square: {label: 50, caption: 48, chip: 48, note: 44, guide: 44},
  portrait: {label: 46, caption: 40, chip: 44, note: 40, guide: 40},
};
const TILE_PAD = 26;
/** How far an enlarged card's paper clip hangs below its tile (design units). */
const clipHang = K => Math.max(0, 22 * K - TILE_PAD);

const scene = {
  // design spaces with the proportions of the caption-safe box of each frame
  sizes: {landscape: [3300, 1440], square: [2050, 1590], portrait: [1900, 2714]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const {axis, arrangement, detail} = ARRANGE[shape];
    const F = FONT[shape];
    const st = STAGE[axis];
    const row = arrangement === 'row';
    const colors = [th.accent2, th.accent3];

    // ---- headers: measured, both the same height
    const pw = st.w;
    const heads = [p.scenarioA, p.scenarioB].map(sc => measureHeader(ctx, {label: sc.label, caption: sc.caption, w: pw, F}));
    const header = Math.max(...heads.map(x => x.h));
    const keyOn = ctx.show('key');
    const noteProbe = text => chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: (row ? st.w * 2 : st.w) * 0.92, size: F.note, maxLines: 2, weight: 500});
    const sharedText = p.sharedFacts.length ? `${ctx.t.sameFacts}: ${p.sharedFacts.join(' · ')}` : '';
    // wide / tall frames show the changed-fact and shared-facts notes in the gap between the
    // panels (empty until the compared detail arrives); the footer then only holds the
    // neutral note
    const footTexts = (detail === 'none' ? [p.changedFact, sharedText, p.comparisonLabels.neutral] : [p.comparisonLabels.neutral]).filter(Boolean);
    const footH = keyOn ? Math.max(...footTexts.map(tx => noteProbe(tx).box.h)) + 30 : 30;
    const ratio = ctx.design.h / ctx.design.w;
    const guideChipAt = o => (keyOn ? chip(ctx, p.comparisonLabels.guide, {...o, size: F.guide, maxLines: 3, fill: th.card, stroke: th.accent, name: 'guide-chip'}) : null);
    // The enlarged copies sit BETWEEN the two panels (a column on wide frames, a strip on
    // tall ones), so each copy only hops out of its own panel and never crosses the other
    // scenario's folder.
    let gap = row ? 60 : 50;
    let tileW = 0, tileH = 0, K = 1, gh = 0, chipW = 0;
    if (detail === 'column') {
      chipW = 520;
      gh = keyOn ? guideChipAt({x: 0, y: 0, anchor: 'start', maxWidth: chipW}).box.h : 0;
      tileH = Math.min((st.h - gh - 130) / 2, CARD.h * 3.4 + TILE_PAD * 2);
      K = (tileH - TILE_PAD * 2) / CARD.h;
      tileW = CARD.w * K + TILE_PAD * 2;
      gap = Math.max(tileW, chipW + 70) + 100;
    } else if (detail === 'row') {
      const room = st.w * ratio - 2 * (header + st.h) - footH - 30 - 100;
      tileH = Math.max(CARD.h * 1.8 + TILE_PAD * 2, Math.min(room, CARD.h * 3 + TILE_PAD * 2));
      K = (tileH - TILE_PAD * 2) / CARD.h;
      tileW = CARD.w * K + TILE_PAD * 2;
      gap = tileH + 100 + clipHang(K);
    }
    const geo = pairedGeometry(ctx, {stage: st, arrangement, header, gap});
    const panels = geo.panels;
    const doc = {docId: p.documentId, title: p.documentTitle, clauses: p.clauses, redactions: p.redactions};
    const stages = ['a', 'b'].map(k => notificationStage(ctx, {prefix: `s${k}`, axis, doc, parties: p.signers, labels: p.objectLabels, date: p.receiptDate, cardStart: 'folder', chipSize: F.chip}));
    const headers = panels.map((pn, i) => heads[i].make({name: `head-${i}`, letter: i ? 'B' : 'A', x: pn.x, y: pn.headerY, h: header, color: colors[i]}));

    // ---- the compared detail: the card resting in each sender's folder at the end
    const cf = stages[0].cardFolder;
    const cardC = [0, 1].map(i => ({x: panels[i].x + cf.x, y: panels[i].y + cf.y}));
    const ringR = {x: CARD.w * 0.72, y: CARD.h * 0.78};
    const bw = geo.w;
    let contentBottom = geo.h;
    let tiles = [], guide, guideChip = null;
    if (detail === 'column') {
      // column between the panels: tile A on top, tile B at the bottom; the guide runs down
      // the column's left side and its chip sits right of it in the gap between the tiles
      const tx = st.w + (gap - tileW) / 2;
      const top = header, bottom = header + st.h;
      tiles = [{x: tx, y: top, w: tileW, h: tileH, K}, {x: tx, y: bottom - tileH, w: tileW, h: tileH, K}];
      const gxl = tx + 40;
      guide = pathGuide(ctx, 'guide', [{x: gxl, y: top + tileH + 12}, {x: gxl, y: bottom - tileH - 12}], th.accent);
      const gapMid = (top + tileH + bottom - tileH) / 2;
      guideChip = guideChipAt({x: gxl + 30, y: gapMid - gh / 2, anchor: 'start', maxWidth: Math.min(chipW, tx + tileW + 30 - gxl - 30)});
      contentBottom = geo.h + clipHang(K);
    } else if (detail === 'row') {
      // strip between the stacked panels: tile A left, tile B right, the guide straight between
      // them with its chip above the line
      const y0 = panels[0].y + st.h + 50;
      tiles = [{x: 40, y: y0, w: tileW, h: tileH, K}, {x: st.w - 40 - tileW, y: y0, w: tileW, h: tileH, K}];
      const ly = y0 + tileH * 0.64;
      guide = pathGuide(ctx, 'guide', [{x: 40 + tileW + 12, y: ly}, {x: st.w - 40 - tileW - 12, y: ly}], th.accent);
      const room = st.w - 80 - tileW * 2 - 60;
      if (keyOn) {
        const probe = guideChipAt({x: 0, y: 0, anchor: 'middle', maxWidth: room});
        guideChip = guideChipAt({x: st.w / 2, y: Math.max(y0, ly - 18 - probe.box.h), anchor: 'middle', maxWidth: room});
      }
    } else {
      // square: the guide drops from each ring into the band under the panels and runs across;
      // its chip hangs under the horizontal run
      const yl = geo.h + 44;
      const fa = {x: cardC[0].x, y: cardC[0].y + ringR.y + 6}, fb = {x: cardC[1].x, y: cardC[1].y + ringR.y + 6};
      guide = pathGuide(ctx, 'guide', [fa, {x: fa.x, y: yl}, {x: fb.x, y: yl}, fb], th.accent);
      guideChip = guideChipAt({x: (fa.x + fb.x) / 2, y: yl + 20, anchor: 'middle', maxWidth: Math.abs(fb.x - fa.x) + 300});
      contentBottom = guideChip ? guideChip.box.y + guideChip.box.h : yl + 20;
    }
    const footY = contentBottom + 30;
    const bh = footY + footH;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2, oy = (ctx.design.h - bh * s) / 2;

    // ---- enlarged copies of the two folder cards (real ackCards with the same content)
    const recipient = p.signers[1];
    const copies = tiles.map((tl, i) => ({
      tile: detailTile(ctx, {name: `tile-${i}`, letter: i ? 'B' : 'A', color: colors[i], dashed: i === 1, x: tl.x, y: tl.y, w: tl.w, h: tl.h, badge: F.label * 0.72}),
      card: ackCard(ctx, {prefix: `ins${i}`, title: p.objectLabels.card, docRef: p.documentId, addressee: recipient.name, signer: recipient.name,
        labels: {doc: ctx.t.doc, to: ctx.t.to, receivedBy: ctx.t.receivedBy}, stampWord: p.objectLabels.stamp, date: p.receiptDate, showText: ctx.show('all')}),
      to: {x: tl.x + tl.w / 2, y: tl.y + tl.h / 2, rot: 0, k: tl.K},
      from: {x: cardC[i].x, y: cardC[i].y, rot: cf.rot || 0, k: 1},
    }));

    // changed-fact / shared-facts notes: in the gap between the panels (column / strip), else in the footer
    const gapNote = (text, name, extra) => {
      if (detail === 'column') {
        const o = {anchor: 'middle', maxWidth: gap - 70, size: F.note, maxLines: 4, weight: 500, name, ...extra};
        const pr = chip(ctx, text, {...o, x: 0, y: 0});
        return chip(ctx, text, {...o, x: st.w + gap / 2, y: header + st.h / 2 - pr.box.h / 2});
      }
      if (detail === 'row') {
        const o = {anchor: 'middle', maxWidth: st.w - 120, size: F.note, maxLines: 2, weight: 500, name, ...extra};
        const pr = chip(ctx, text, {...o, x: 0, y: 0});
        return chip(ctx, text, {...o, x: st.w / 2, y: panels[0].y + st.h + gap / 2 - pr.box.h / 2});
      }
      return chip(ctx, text, {anchor: 'middle', x: bw / 2, y: footY, maxWidth: bw * 0.92, size: F.note, maxLines: 2, weight: 500, name, ...extra});
    };
    const changeChip = keyOn ? gapNote(p.changedFact, 'change-chip', {weight: 600, fill: th.accentSoft, stroke: th.accent}) : null;
    const shared = sharedText && ctx.show('all') ? gapNote(sharedText, 'shared-note', {fill: th.card}) : null;
    const neutral = ctx.show('all') ? neutralNote(ctx, p.comparisonLabels.neutral, {x: bw / 2, y: footY, maxWidth: bw * 0.92, size: F.note, name: 'neutral-note'}) : null;
    return {geo, panels, stages, headers, cardC, ringR, guide, guideChip, changeChip, shared, neutral, copies, s, ox, oy, arrangement, detail, bw, bh};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const ring = (name, c, dashed) => h('ellipse', {name, cx: c.x, cy: c.y, rx: L.ringR.x, ry: L.ringR.y, fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': dashed ? '12 10' : null, opacity: 0});
    // change markers ride the card (positioned per frame, drawn around the origin)
    const marker = i => g({name: `mark-${i}`, opacity: 0},
      h('ellipse', {cx: 0, cy: 0, rx: L.ringR.x, ry: L.ringR.y, fill: 'none', stroke: th.accent, 'stroke-width': 5, 'stroke-dasharray': '12 10'}));
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.headers,
      L.panels.map((pn, i) => g({transform: T(pn.x, pn.y)}, L.stages[i].node)),
      marker(0), marker(1),
      ring('ring-0', L.cardC[0], false), ring('ring-1', L.cardC[1], true),
      L.copies.map(c => c.tile),
      L.guide.node,
      L.guideChip && L.guideChip.node,
      // the copies travel over the panels, so they are drawn last
      L.copies.map((c, i) => g({name: `fly-${i}`, opacity: 0}, c.card.node)),
      L.changeChip && L.changeChip.node,
      L.shared && L.shared.node,
      L.neutral && L.neutral.node,
    );
  },
  frame(ctx, L, u) {
    const sw = key => seg(u, ...W[key]);
    const shared = {
      reachA: sw('reachA'), carryA: sw('carryA'), reachB: sw('reachB'), carryB: sw('carryB'), retreatA: sw('retreatA'),
    };
    const vA = {
      ...shared, fetch: sw('fetch'), attach: sw('attach'), backA: sw('backA'),
      penTo: sw('penTo'), write: sw('write'), penBack: sw('penBack'),
      toStamp: sw('toStamp'), stampGo: sw('stampGo'), stampBack: sw('stampBack'),
      toCard: sw('toCard'), cardOut: sw('cardOut'), reachA2: sw('reachA2'), cardIn: sw('cardIn'), retreatB: sw('retreatB'), retreatA2: sw('retreatA2'),
    };
    const vB = {...shared, releaseB: sw('releaseB'), settleA: sw('settleA')};
    const a = L.stages[0].pose(vA);
    const b = L.stages[1].pose(vB);
    const nodes = {...a.nodes, ...b.nodes};
    // change markers: ring each panel's card while the changed fact is introduced
    const markP = sw('mark') * (1 - sw('markOut'));
    [a, b].forEach((x, i) => {
      const c = x.semantic.card;
      nodes[`mark-${i}`] = {transform: T(L.panels[i].x + c.x, L.panels[i].y + c.y), opacity: r(markP, 3)};
    });
    // closing comparison: rings on the compared detail, enlarged copies lift out, guide
    const ringP = r(sw('rings'), 3);
    nodes['ring-0'] = {opacity: ringP};
    nodes['ring-1'] = {opacity: ringP};
    // gentle easing: the copies cover up to ~1400 design units, so they never jump between frames
    const fp = ease.inOutSine(sw('fly'));
    const fly = [];
    L.copies.forEach((c, i) => {
      const q = {x: lerp(c.from.x, c.to.x, fp), y: lerp(c.from.y, c.to.y, fp), rot: lerp(c.from.rot, c.to.rot, fp), k: lerp(c.from.k, c.to.k, fp)};
      fly.push(q);
      // the copy starts exactly on top of the filed card, so it appears without a jump
      nodes[`fly-${i}`] = {transform: T(q.x, q.y, q.rot, q.k), opacity: u >= W.fly[0] ? 1 : 0};
      nodes[`tile-${i}`] = {opacity: r(clamp((fp - 0.6) / 0.35), 3)};
      Object.assign(nodes, c.card.sig.frame(i === 0 ? 1 : 0));
      nodes[`ins${i}-impr`] = {opacity: i === 0 ? 0.92 : 0};
    });
    const gp = sw('guide');
    Object.assign(nodes, L.guide.frame(gp));
    if (L.guideChip) nodes['guide-chip'] = {opacity: r(clamp((gp - 0.5) * 2), 3)};
    const cp = sw('changeChip');
    if (L.changeChip) nodes['change-chip'] = {opacity: r(clamp(cp) * (1 - clamp((u - 0.5) / 0.04)), 3)};
    if (L.shared) nodes['shared-note'] = {opacity: r(clamp((u - 0.54) / 0.04) * (1 - sw('sharedOut')), 3)};
    if (L.neutral) nodes['neutral-note'] = {opacity: r(sw('note'), 3)};
    const beat = u < BEATS.base[1] ? 'base' : u < BEATS.change[1] ? 'change' : u < BEATS.parallel[1] ? 'parallel' : 'guide';
    const pick = x => ({envelope: x.semantic.envelopeHolder, card: x.semantic.cardHolder, signature: x.semantic.signature, stamped: x.semantic.stamped, filed: x.semantic.cardFiled});
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    return {
      nodes,
      semantic: {
        beat,
        a: pick(a),
        b: pick(b),
        envA: a.semantic.envelope, envB: b.semantic.envelope,
        cardA: a.semantic.card, cardB: b.semantic.card,
        handA_a: a.semantic.handA, handA_b: b.semantic.handA,
        handB1_a: a.semantic.handB1, handB1_b: b.semantic.handB1,
        cardGripA_a: a.semantic.cardGripA, envGripB_a: a.semantic.envGripB, envGripB_b: b.semantic.envGripB,
        allReached: a.semantic.allReached && b.semantic.allReached,
        reach: {a: a.semantic.reach, b: b.semantic.reach},
        markerProgress: r(markP, 3),
        guideProgress: r(gp, 3),
        // enlarged copies of the compared detail (absent on square frames)
        detail: L.detail,
        copyA: fly[0] ? P2(fly[0]) : undefined,
        copyB: fly[1] ? P2(fly[1]) : undefined,
        copyScale: fly[0] ? r(fly[0].k, 3) : undefined,
        arrangement: L.arrangement,
      },
    };
  },
};

/**
 * Scenario header, measured first so both panels share one height: coloured
 * letter badge, label (1–2 lines) and caption (up to 2 lines) at sizes that
 * stay legible at 1080p. With labels hidden only the badge remains.
 */
function measureHeader(ctx, o) {
  const F = o.F;
  const R = Math.round(F.label * 0.72);
  const tw = o.w - R * 2 - 30;
  let f = null, f2 = null;
  if (ctx.show('key')) {
    f = ctx.fit(o.label, {maxWidth: tw, size: F.label, minSize: F.label * 0.85, maxLines: 1, weight: 700});
    if (f.truncated) f = ctx.fit(o.label, {maxWidth: tw, size: F.label, minSize: F.label * 0.8, maxLines: 2, weight: 700, leading: 1.1});
  }
  if (o.caption && ctx.show('all')) {
    f2 = ctx.fit(o.caption, {maxWidth: tw, size: F.caption, minSize: F.caption * 0.85, maxLines: 2, weight: 500, leading: 1.12});
    // a long caption keeps its meaning on a third line rather than an ellipsis
    if (f2.truncated) f2 = ctx.fit(o.caption, {maxWidth: tw, size: F.caption * 0.9, minSize: F.caption * 0.8, maxLines: 3, weight: 500, leading: 1.12});
  }
  const textH = (f ? f.height : 0) + (f2 ? 12 + f2.height : 0);
  const hh = Math.max(R * 2, textH) + 28;
  const make = ({name, letter, x, y, h: H, color}) => {
    const th = ctx.theme;
    const top = y + (H - 8 - textH) / 2;
    const cy = f ? top + f.size * 0.55 + 2 : y + H / 2;
    const parts = [h('circle', {cx: x + R, cy, r: R, fill: color, stroke: th.ink, 'stroke-width': 2.5})];
    if (ctx.show('key')) parts.push(h('text', {x: x + R, y: cy + R * 0.4, 'text-anchor': 'middle', 'font-size': R * 1.15, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, letter));
    const tx = x + R * 2 + 18;
    if (f) parts.push(textBlock(f, {x: tx, y: top, fill: th.fg}));
    if (f2) parts.push(textBlock(f2, {x: tx, y: top + (f ? f.height + 12 : 0), fill: th.fgSoft}));
    return g({name}, parts);
  };
  return {h: hh, make};
}

/** Backing tile of an enlarged copy: paper panel, scenario-coloured border (dashed for B) and letter badge. */
function detailTile(ctx, o) {
  const th = ctx.theme;
  const R = o.badge;
  return g({name: o.name, opacity: 0},
    h('path', {d: roundRectPath(o.x + 8, o.y + 12, o.w, o.h, 22), fill: th.shadow}),
    h('path', {d: roundRectPath(o.x, o.y, o.w, o.h, 22), fill: '#f8f4ea', stroke: o.color, 'stroke-width': 6, 'stroke-dasharray': o.dashed ? '16 11' : null}),
    h('circle', {cx: o.x + 6, cy: o.y + 6, r: R, fill: o.color, stroke: th.ink, 'stroke-width': 2.5}),
    ctx.show('key') ? h('text', {x: o.x + 6, y: o.y + 6 + R * 0.4, 'text-anchor': 'middle', 'font-size': R * 1.15, 'font-weight': 800, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: '#fff'}, o.letter) : null,
  );
}

/**
 * Guide drawn along a polyline with rounded corners (relation style: end dots,
 * no arrow), revealed by its dash offset. Routed through free space by the
 * caller, so it never runs over a panel's actors or chips.
 */
function pathGuide(ctx, name, pts, color, radius = 30) {
  let d = `M${r(pts[0].x)} ${r(pts[0].y)}`;
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], c = pts[i], b = pts[i + 1];
    const la = Math.hypot(c.x - a.x, c.y - a.y) || 1, lb = Math.hypot(b.x - c.x, b.y - c.y) || 1;
    const rr = Math.min(radius, la / 2, lb / 2);
    d += `L${r(c.x - ((c.x - a.x) / la) * rr)} ${r(c.y - ((c.y - a.y) / la) * rr)}Q${r(c.x)} ${r(c.y)} ${r(c.x + ((b.x - c.x) / lb) * rr)} ${r(c.y + ((b.y - c.y) / lb) * rr)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${r(last.x)} ${r(last.y)}`;
  const width = 6;
  const node = g({name, opacity: 0},
    h('path', {name: `${name}-line`, d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}),
    h('circle', {name: `${name}-dotA`, cx: r(pts[0].x), cy: r(pts[0].y), r: width * 1.6, fill: color, opacity: 0}),
    h('circle', {name: `${name}-dotB`, cx: r(last.x), cy: r(last.y), r: width * 1.6, fill: color, opacity: 0}),
  );
  const frame = pr => ({
    [name]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-line`]: {'stroke-dashoffset': r(total * (1 - pr))},
    [`${name}-dotA`]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-dotB`]: {opacity: pr >= 0.985 ? 1 : 0},
  });
  return {node, frame, total};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'documents-09-contrast',
    title: 'Documented notice — delivery with vs without a returned acknowledgment',
    titleEs: 'Notificación documentada — Comparación de dos supuestos',
    category: 'documents',
    categoryName: 'Documentos e instrumentos',
    motif: 'Notificación documentada',
    treatment: 'contrast',
    family: 'paired-comparison',
    description: 'Two identical offices run the same tray-to-tray delivery in parallel. The single changed fact: in A the sender clips an acknowledgment card to the envelope, which comes back signed and date-stamped into the folder; in B no card travels and the folder card stays blank. At the close both folder cards are ringed; on wide and tall frames an enlarged copy of each lifts out of its panel and a guide joins the two copies (on square frames the guide joins the folder cards), without stating any outcome.',
    tags: ['notice', 'comparison', 'acknowledgment', 'record', 'envelope', 'tray', 'side-by-side', 'stacked'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/documents/kits/notificacion-documentada.js', 'src/frameworks/paired.js', 'src/primitives/paper.js', 'src/primitives/desk.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: NOTICE_STRINGS,
  scene,
});
