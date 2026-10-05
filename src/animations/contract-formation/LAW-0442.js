/**
 * LAW-0442 — Oferta comunicada · mechanism
 *
 * Storyboard (exploded anatomy of a communicated offer):
 *  0.00–0.18  separate: offeror, offer body, sealed message and offeree
 *             appear; the term rows LIFT OUT of the offer body as coloured
 *             tiles (item / delivery / quantity / price…), leaving marked
 *             slots on the body; faint lines tie each tile to its slot.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             styled by kind (plain relation = no arrow; sequence; the
 *             communication is the dashed channel arc to the offeree).
 *  0.43–0.75  trace: a tracer follows `traversalOrder`; each element swells
 *             as it is visited (the focus element more; connector ends sit
 *             outside the swollen edge). On the channel the checkpoints light
 *             in order — composed → sent → in transit → received — while a
 *             small mailer rides ON the line (its band is kept free of every
 *             caption). Checkpoint captions all sit on the concave side of the
 *             channel, each tied to its dot by a short leader; the channel's
 *             relation caption sits on the convex side.
 *  0.75–1.00  gather: everything stays anchored; a received copy of the same
 *             terms (label + full value per row) is shown at the offeree. No
 *             acceptance or legal effect is stated.
 * Layout: hand-placed per shape (row in 16:9, L-shape in 1:1, column in 9:16);
 * the received card and the checkpoint captions are solved into free space.
 * @module animations/contract-formation/LAW-0442
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, edgeAnchor, circleAnchor} from '../../core/geometry.js';
import {mechanismFields, str, obj} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {personBadge} from '../../primitives/badges.js';
import {actorLook} from '../../primitives/people-style.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {offerFields, responsesField} from './kits/offer-fields.js';
import {shade} from '../../primitives/paper.js';
import {offerSheet} from './kits/offer-letter.js';

const ID = 'LAW-0442';
const DURATION = 7000;
const IDS = ['offeror', 'offer', 'terms', 'message', 'offeree'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const TRACE = [0.44, 0.74];

const STRINGS = {
  en: {from: 'From', to: 'To', composed: 'Composed', sent: 'Sent', inTransit: 'In transit', received: 'Received', receivedCopy: 'Terms as received'},
  es: {from: 'De', to: 'Para', composed: 'Redactada', sent: 'Enviada', inTransit: 'En tránsito', received: 'Recibida', receivedCopy: 'Términos recibidos'},
};

const sceneSchema = {
  ...offerFields,
  ...responsesField,
  ...mechanismFields(IDS),
  stateLabels: obj('Captions of the channel checkpoints (descriptive states only)', {
    composed: str('Checkpoint where the offer is written and sealed', 30),
    sent: str('Checkpoint where it leaves the offeror', 30),
    inTransit: str('Checkpoint on the way', 30),
    received: str('Checkpoint where it reaches the offeree', 30),
  }),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  parties: [{name: 'Nadia Park', role: 'Party A'}, {name: 'Tomás Ribeiro', role: 'Party B'}],
  offer: {reference: 'OF-2041', title: 'Offer to supply'},
  terms: [
    {key: 'item', label: 'Item', value: 'Oak office chairs'},
    {key: 'delivery', label: 'Delivery', value: 'Day 10'},
    {key: 'quantity', label: 'Quantity', value: '40'},
    {key: 'unitPrice', label: 'Unit price (hypothetical)', value: '130'},
  ],
  responses: [],
  elements: [
    {id: 'offeror', label: 'Offeror (Party A)'},
    {id: 'offer', label: 'Offer body'},
    {id: 'terms', label: 'Terms'},
    {id: 'message', label: 'Sealed message'},
    {id: 'offeree', label: 'Offeree (Party B)'},
  ],
  relationships: [
    {from: 'offeror', to: 'offer', kind: 'relation', label: 'writes'},
    {from: 'offer', to: 'terms', kind: 'relation', label: 'states'},
    {from: 'offer', to: 'message', kind: 'sequence', label: 'folded & sealed'},
    {from: 'message', to: 'offeree', kind: 'communication', label: 'sent to'},
  ],
  focusElement: 'message',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['offeror', 'offer', 'terms', 'offer', 'message', 'offeree'],
  stateLabels: {composed: 'Composed', sent: 'Sent', inTransit: 'In transit', received: 'Received'},
};

/**
 * Hand-placed geometry per shape (design units).
 * body/message/offeree: centres; tiles: grid origin + columns (row heights grow with the
 * text); recv: column (x centre, width) of the received-copy card, whose height and vertical
 * position are solved from the boxes above and below it.
 */
const PLACES = {
  landscape: {size: [1900, 1030], offeror: [140, 200], R: 94, body: [360, 700], sheet: [300, 400],
    tiles: {x: 610, y: 60, cols: 2, w: 330, h: 104, gap: 20}, termsChip: 'left', message: [920, 740], offeree: [1743, 740],
    recv: {x: 1655, w: 450}, bend: -0.36, legend: [950, 1000], packetW: 104},
  square: {size: [1400, 1330], offeror: [130, 150], R: 86, body: [330, 560], sheet: [300, 400],
    tiles: {x: 540, y: 50, cols: 2, w: 285, h: 104, gap: 18}, termsChip: 'right', message: [330, 1110], offeree: [1220, 1110],
    recv: {x: 1110, w: 390}, bend: -0.42, legend: [775, 1302], legendSize: 24, packetW: 104},
  portrait: {size: [960, 1580], offeror: [130, 150], R: 84, body: [240, 700], sheet: [270, 360],
    tiles: {x: 330, y: 40, cols: 2, w: 290, h: 100, gap: 20}, termsChip: 'below', message: [776, 700], offeree: [776, 1310], chipMax: 200,
    recv: {x: 318, w: 380}, bend: 0.3, legend: [480, 1550], pill: 24, pillMax: 200, msgLabelAbove: true, packetW: 76},
};

/** Swell of an element while the tracer visits it (the focus element more). */
const AMP = {focus: 0.1, other: 0.05};
/** Checkpoints along the channel (fraction of the message → offeree connector). */
const STATION_T = [['composed', 0.12], ['sent', 0.38], ['inTransit', 0.62], ['received', 0.86]];

const TILE_COLORS = th => ({item: th.accent2, delivery: th.accent4, quantity: th.accent3, unitPrice: th.accent, payment: th.accent, other: th.inkSoft});

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const shape = ctx.view.shape;
    const Pl = PLACES[shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const at = key => ({x: Pl[key][0], y: Pl[key][1]});
    const colors = TILE_COLORS(th);
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const channelColor = th.dark ? shade(th.accent2, 0.45) : th.accent2;
    // swell of each element while visited; connector anchors sit outside the swollen edge
    const ampOf = id => (id === p.focusElement ? AMP.focus : AMP.other) * (ctx.reduced ? 0.5 : 1);
    const swell = (id, b) => ({x: (ampOf(id) * b.w) / 2, y: (ampOf(id) * b.h) / 2});
    const inflate = (id, b) => {
      const k = ampOf(id) * 0.28;
      return {x: b.x - k * b.w, y: b.y - k * b.h, w: b.w * (1 + 2 * k), h: b.h * (1 + 2 * k)};
    };

    /* --- offer body: the open sheet; each term row becomes a marked slot */
    const [bw, bh] = Pl.sheet;
    const bc = at('body');
    const body = offerSheet(ctx, {prefix: 'body', w: bw, h: bh, offer: p.offer, from: p.parties[0].name, to: p.parties[1].name, terms: p.terms, showText: showAll, labels: {from: ctx.t.from, to: ctx.t.to}});
    const slots = body.rows.map((row, i) => {
      const b = row.box;
      const c = colors[row.key] || th.inkSoft;
      return g({name: `slot-${i}`, opacity: 0},
        h('rect', {x: b.x + 6, y: b.y + 4, width: b.w - 12, height: b.h - 8, rx: 6, fill: th.paper}),
        h('path', {d: roundRectPath(b.x + 10, b.y + 8, b.w - 20, b.h - 16, 6), fill: 'none', stroke: c, 'stroke-width': 2.5, 'stroke-dasharray': '8 6'}),
        h('rect', {x: b.x + 18, y: b.y + b.h / 2 - 7, width: 14, height: 14, rx: 3, fill: c}));
    });
    const bodyBox = {x: bc.x - bw / 2, y: bc.y - bh / 2, w: bw, h: bh};
    const bodyNode = g({name: 'el-offer', transform: T(bc.x, bc.y)}, g({name: 'el-offer-body'}, body.node, slots));
    const bodyLabel = showKey ? chip(ctx, label('offer'), {x: bc.x, y: bodyBox.y + bh + 12 + swell('offer', bodyBox).y, anchor: 'middle', maxWidth: 380, size: 30, maxLines: 2, name: 'lab-offer'}) : null;

    /* --- term tiles, exploded out of their rows (each grid row is as tall as its tallest tile) */
    const T0 = Pl.tiles;
    const n = p.terms.length;
    const rowsN = Math.ceil(n / T0.cols);
    const specs = p.terms.map(t => tileSpec(ctx, t, T0.w, T0.h, showAll));
    const rowH = [];
    for (let rI = 0; rI < rowsN; rI++) rowH.push(Math.max(...specs.filter((_, i) => Math.floor(i / T0.cols) === rI).map(sp => sp.h)));
    const rowY = rowH.map((_, rI) => T0.y + rowH.slice(0, rI).reduce((a, b) => a + b, 0) + rI * T0.gap);
    const tiles = p.terms.map((t, i) => {
      const col = i % T0.cols, row = Math.floor(i / T0.cols);
      const th2 = rowH[row];
      const home = {x: T0.x + col * (T0.w + T0.gap) + T0.w / 2, y: rowY[row] + th2 / 2};
      const rb = body.rows[i].box;
      const src = {x: bc.x + rb.x + rb.w / 2, y: bc.y + rb.y + rb.h / 2};
      const k0 = Math.min((rb.w - 20) / T0.w, (rb.h - 12) / th2);
      return {i, home, src, k0, node: tileNode(ctx, `tile-${i}`, T0.w, th2, colors[t.key] || th.inkSoft, specs[i])};
    });
    const gridH = rowH.reduce((a, b) => a + b, 0) + (rowsN - 1) * T0.gap;
    const termsBox = {x: T0.x - 10, y: T0.y - 10, w: T0.cols * T0.w + (T0.cols - 1) * T0.gap + 20, h: gridH + 20};
    const tsw = swell('terms', termsBox);
    let termsLabel = null;
    if (showKey) {
      const base = {size: 30, maxLines: 2, name: 'lab-terms'};
      if (Pl.termsChip === 'below') {
        termsLabel = chip(ctx, label('terms'), {...base, x: termsBox.x + 4, y: termsBox.y + termsBox.h + 8 + tsw.y, anchor: 'start', maxWidth: Math.min(440, S.w - termsBox.x - 14)});
      } else if (Pl.termsChip === 'left') {
        const x = termsBox.x - 12 - tsw.x;
        termsLabel = chip(ctx, label('terms'), {...base, x, y: termsBox.y + 14, anchor: 'end', maxWidth: Math.min(320, x - 250)});
      } else {
        const x = termsBox.x + termsBox.w + 12 + tsw.x;
        termsLabel = chip(ctx, label('terms'), {...base, x, y: termsBox.y + 14, anchor: 'start', maxWidth: Math.min(320, S.w - 10 - x)});
      }
    }

    /* --- sealed message (same sheet, folded) */
    const mc = at('message');
    const msg = offerSheet(ctx, {prefix: 'msg', w: bw, h: bh, offer: p.offer, from: p.parties[0].name, to: p.parties[1].name, terms: p.terms, showText: showAll, labels: {from: ctx.t.from, to: ctx.t.to}, mailerLabel: ''});
    const mh = bh / 3;
    const msgBox = {x: mc.x - bw / 2, y: mc.y - mh / 2, w: bw, h: mh + 14};
    const msw = swell('message', msgBox);
    let msgLabel = null;
    if (showKey) {
      const opt = {x: mc.x, anchor: 'middle', maxWidth: Pl.msgLabelAbove ? 340 : 380, size: 30, maxLines: 2, name: 'lab-message'};
      if (Pl.msgLabelAbove) {
        const probe = chip(ctx, label('message'), {...opt, y: 0});
        msgLabel = chip(ctx, label('message'), {...opt, y: msgBox.y - 12 - msw.y - probe.box.h});
      } else msgLabel = chip(ctx, label('message'), {...opt, y: msgBox.y + msgBox.h + 12 + msw.y});
    }
    const msgNode = g({name: 'el-message', transform: T(mc.x, mc.y)}, g({name: 'el-message-body'}, msg.node));

    /* --- parties */
    const lookA = actorLook(ctx, p.parties[0], 0);
    const lookB = actorLook(ctx, p.parties[1], 1);
    const R = Pl.R;
    const offeror = personBadge(ctx, {name: 'el-offeror', x: at('offeror').x, y: at('offeror').y, radius: R, look: lookA, label: label('offeror'), labelMax: badgeLabelMax(ctx, label('offeror'), 300)});
    const offeree = personBadge(ctx, {name: 'el-offeree', x: at('offeree').x, y: at('offeree').y, radius: R, look: lookB, label: label('offeree'), labelMax: badgeLabelMax(ctx, label('offeree'), 300)});
    const oc = at('offeree');

    /* --- relationships: anchors on the (swell-inclusive) edges of each element */
    const grow = id => 1 + ampOf(id) * 0.56;
    const elements = {
      offeror: {circle: {...offeror.circle, r: offeror.circle.r * grow('offeror')}},
      offeree: {circle: {...offeree.circle, r: offeree.circle.r * grow('offeree')}},
      offer: {box: inflate('offer', bodyBox)},
      terms: {box: inflate('terms', termsBox)},
      message: {box: inflate('message', msgBox)},
    };
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legend = showAll ? legendNode(ctx, kinds, p.relationLabels, at('legend'), channelColor, Pl.legendSize ?? 28) : null;
    const fixedBoxes = [
      ...[bodyLabel, msgLabel, termsLabel].filter(Boolean).map(c => c.box),
      ...[offeror.labelBox, offeree.labelBox].filter(Boolean),
      legend ? legend.box : null,
    ].filter(Boolean);
    const graphOpts = obstacles => ({name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize: 28, chipMax: Pl.chipMax ?? 250,
      bend: rel => (rel.kind === 'communication' ? Pl.bend : 0.08), obstacles, bounds: {x: 10, y: 10, w: S.w - 20, h: S.h - 20}, separateLabels: true});
    // pass 1: connector geometry (it does not depend on the obstacles)
    const g1 = relationGraph(ctx, graphOpts(fixedBoxes));
    const chIdx = g1.conns.findIndex(x => x.rel.kind === 'communication' && ((x.rel.from === 'message' && x.rel.to === 'offeree') || (x.rel.from === 'offeree' && x.rel.to === 'message')));
    const ch = chIdx >= 0 ? g1.conns[chIdx] : null;
    const chFwd = ch ? ch.rel.from === 'message' : true;
    const chAt = t => ch.c.at(chFwd ? t : 1 - t); // 0 at the message, 1 at the offeree

    /* --- the mailer rides ON the channel: the band it sweeps is kept free of every caption */
    const PW = Pl.packetW, PH = PW * 0.46;
    const sweep = [];
    if (ch) {
      for (let i = 0; i <= 48; i++) {
        const q = chAt(STATION_T[0][1] + ((STATION_T[3][1] - STATION_T[0][1]) * i) / 48);
        sweep.push({x: q.x - PW / 2 - 6, y: q.y - PH / 2 - 6, w: PW + 12, h: PH + 12});
      }
    }
    // concave side of the channel = opposite the bulge; checkpoints go there, the channel's
    // relation caption goes to the convex side
    const chMid = ch ? chAt(0.5) : null;
    const chord = ch ? {x: (ch.c.from.x + ch.c.to.x) / 2, y: (ch.c.from.y + ch.c.to.y) / 2} : null;
    const bulge = ch ? unit({x: chMid.x - chord.x, y: chMid.y - chord.y}) : {x: 0, y: -1};
    const normalIn = t => {
      const a = chAt(Math.min(1, t + 0.01)), b = chAt(Math.max(0, t - 0.01));
      const nrm = unit({x: -(a.y - b.y), y: a.x - b.x});
      return nrm.x * bulge.x + nrm.y * bulge.y > 0 ? {x: -nrm.x, y: -nrm.y} : nrm;
    };
    // reserved zone for the channel caption (predicted chip size) on the convex side of its midpoint
    let capZone = null;
    if (ch && showAll) {
      const text = ch.rel.label || p.relationLabels[ch.rel.kind] || ch.rel.kind;
      const cw = Math.min(250, ctx.measure(text, 28, 600, 'sans') + 34) + 24;
      const chh = (ctx.measure(text, 28, 600, 'sans') + 34 > 250 ? 88 : 56) + 16;
      const ext = Math.abs(bulge.x) * cw / 2 + Math.abs(bulge.y) * chh / 2;
      const dist = Math.abs(bulge.x) * (PW / 2 + 6) + Math.abs(bulge.y) * (PH / 2 + 6) + 8 + ext;
      capZone = {x: chMid.x + bulge.x * dist - cw / 2, y: chMid.y + bulge.y * dist - chh / 2, w: cw, h: chh};
    }

    /* --- received copy of the same terms at the offeree (sized to its text, placed in free space) */
    const oBox = {x: oc.x - R * grow('offeree'), y: oc.y - R * grow('offeree'), w: 2 * R * grow('offeree'), h: 2 * R * grow('offeree')};
    const rw = Pl.recv.w, rx0 = Pl.recv.x - rw / 2;
    const inCol = b => b && b.x < rx0 + rw && b.x + b.w > rx0;
    const aboveBoxes = shape === 'portrait'
      ? [bodyLabel && bodyLabel.box, bodyBox, capZone]
      : [elements.terms.box, termsLabel && termsLabel.box];
    const belowBoxes = shape === 'portrait' ? [legend && legend.box, {x: 0, y: S.h - 20, w: S.w, h: 20}] : [oBox, capZone, ...sweep];
    const yMin = Math.max(20, ...aboveBoxes.filter(inCol).map(b => b.y + b.h + 20));
    const yMax = Math.min(S.h - 20, ...belowBoxes.filter(inCol).map(b => b.y - 18));
    const note = p.responses.length ? p.responses[0].text : '';
    let spec = null;
    for (const k of [1, 0.94, 0.88, 0.82, 0.76]) {
      spec = receivedSpec(ctx, p.terms, rw, ctx.t.receivedCopy, note, k);
      if (spec.h <= yMax - yMin) break;
    }
    const prefY = shape === 'portrait' ? oc.y - spec.h / 2 : yMax - spec.h;
    const ry0 = clamp(prefY, yMin, Math.max(yMin, yMax - spec.h));
    const recv = receivedCard(ctx, spec, p.terms, colors, {x: rx0, y: ry0});
    const cardBox = {x: rx0, y: ry0, w: rw, h: spec.h};

    /* --- channel checkpoints on the concave side, each tied to its dot by a short leader */
    const pillSize = Pl.pill ?? 26;
    const pillMax = Pl.pillMax ?? 250;
    const stateText = key => p.stateLabels[key] || ctx.t[key];
    const base = [
      ...Object.values(elements).map(e => (e.circle ? {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r, w: 2 * e.circle.r, h: 2 * e.circle.r} : e.box)),
      ...fixedBoxes, cardBox, ...sweep, capZone,
    ].filter(Boolean);
    const inside = b => b.x >= 10 && b.y >= 10 && b.x + b.w <= S.w - 10 && b.y + b.h <= S.h - 10;
    // chord frame of the channel: u runs message → offeree, nIn points to the concave side
    const u0 = ch ? unit({x: chAt(1).x - chAt(0).x, y: chAt(1).y - chAt(0).y}) : {x: 1, y: 0};
    const nIn = {x: -bulge.x, y: -bulge.y};
    // Checkpoint captions hang off their own dots, all toward the concave side of the channel and
    // perpendicular to its chord, so the leaders are parallel and never cross. A caption may slide
    // sideways only as far as it still covers its dot (the leader stays straight); it is placed as
    // close to its dot as the free space allows, and never over another caption or leader.
    const norm = t2 => String(t2).trim().split(/\s+/).join(' ');
    const fitIn = (text, maxW, lines) => {
      const f = ctx.fit(text, {maxWidth: Math.max(30, maxW - pillSize * 1.2), size: pillSize, minSize: pillSize, maxLines: lines, weight: 600});
      // a word broken across lines counts as a shortened caption
      return f.truncated || norm(f.lines.join(' ')) === norm(text) ? f : {...f, truncated: true};
    };
    /** caption shapes to try: one line, then the narrowest 2- and 3-line wraps (full size) */
    const captionOptions = (text, room) => {
      const opts = [];
      const one = fitIn(text, room, 1);
      if (!one.truncated) opts.push({f: one, pen: 0});
      for (const lines of [2, 3]) {
        for (let w = 90; w <= room; w += 12) {
          const f = fitIn(text, w, lines);
          if (!f.truncated) {
            if (f.lines.length === lines) opts.push({f, pen: lines === 2 ? 18 : 40});
            break;
          }
        }
      }
      if (!opts.length) opts.push({f: ctx.fit(text, {maxWidth: room - pillSize * 1.2, size: pillSize, minSize: pillSize * 0.75, maxLines: 3, weight: 600}), pen: 80});
      return opts;
    };
    const placePills = labelBoxes => {
      if (!showKey || !ch) return STATION_T.map(([key, t]) => ({key, t, q: chAt(t), box: null}));
      // circles are approximated by a cross of two boxes (their bounding-box corners stay usable)
      const solid = Object.values(elements).flatMap(e => (e.circle
        ? [{x: e.circle.x - e.circle.r * 0.72, y: e.circle.y - e.circle.r, w: e.circle.r * 1.44, h: e.circle.r * 2}, {x: e.circle.x - e.circle.r, y: e.circle.y - e.circle.r * 0.72, w: e.circle.r * 2, h: e.circle.r * 1.44}]
        : [e.box]));
      // the whole channel line (incl. its arrowhead) stays uncovered
      const line = [];
      for (let i = 0; i <= 40; i++) { const q = chAt(i / 40); line.push({x: q.x - 11, y: q.y - 11, w: 22, h: 22}); }
      const obs = [...solid, ...fixedBoxes, cardBox, capZone, ...sweep, ...line, ...labelBoxes].filter(Boolean);
      const leadObs = [...solid, ...fixedBoxes, cardBox, ...labelBoxes].filter(Boolean);
      const O = chAt(0);
      const dots = STATION_T.map(([key, t]) => {
        const q = chAt(t);
        return {key, t, q, s: (q.x - O.x) * u0.x + (q.y - O.y) * u0.y};
      });
      const horiz = Math.abs(u0.x) >= Math.abs(u0.y);
      const boxes = [];
      const out = [];
      dots.forEach((dt, i) => {
        const {key, t, q} = dt;
        // a caption never covers a neighbouring dot's leader: its extent along the chord stays
        // strictly between the neighbouring dots
        const lo = i ? dots[i - 1].s + 12 : -Infinity, hi = i < dots.length - 1 ? dots[i + 1].s - 12 : Infinity;
        const room = horiz ? Math.min(pillMax, hi - lo) : pillMax;
        let best = null, bestCost = Infinity, fb = null, fbCost = Infinity;
        for (const opt of captionOptions(stateText(key), room)) {
          const f = opt.f;
          const pw = f.width + f.size * 1.2, ph2 = f.height + f.size * 0.76;
          const eN = Math.abs(nIn.x) * pw / 2 + Math.abs(nIn.y) * ph2 / 2;
          const eU = Math.abs(u0.x) * pw / 2 + Math.abs(u0.y) * ph2 / 2;
          for (let d = 16; d <= 420 && d + opt.pen < bestCost; d += 6) {
            let found = false;
            for (let k2 = 0; k2 <= 60; k2++) {
              const sl = (k2 % 2 ? 1 : -1) * Math.ceil(k2 / 2) * 6;
              if (Math.abs(sl) > eU - 12) break;          // the caption still covers its dot
              const sc = dt.s + sl;
              if (sc - eU < lo || sc + eU > hi) continue; // ... and none of its neighbours' leaders
              const cx = q.x + nIn.x * (d + eN) + u0.x * sl, cy = q.y + nIn.y * (d + eN) + u0.y * sl;
              const b = {x: cx - pw / 2, y: cy - ph2 / 2, w: pw, h: ph2};
              const cost = d + 0.4 * Math.abs(sl) + opt.pen;
              if (!inside(b)) continue;
              let hit = obs.reduce((acc, o) => acc + overlapArea(o, b, 4), 0) + boxes.reduce((acc, o) => acc + overlapArea(o, b, 6), 0);
              // the leader itself keeps clear of other captions and elements
              if (!hit && d > 30) {
                for (let j = 1; j < 10 && !hit; j++) {
                  const dd = 16 + ((d - 16) * j) / 10;
                  const px = q.x + nIn.x * dd, py = q.y + nIn.y * dd;
                  if ([...leadObs, ...boxes].some(o => px > o.x - 7 && px < o.x + o.w + 7 && py > o.y - 7 && py < o.y + o.h + 7)) hit = 1;
                }
              }
              if (!hit) { if (cost < bestCost) { best = {b, f}; bestCost = cost; } found = true; break; }
              if (hit + cost < fbCost) { fb = {b, f}; fbCost = hit + cost; }
            }
            if (found) break;
          }
        }
        const pick = best || fb;
        if (pick) boxes.push(pick.b);
        out.push({key, t, q, box: pick ? pick.b : null, f: pick ? pick.f : null, clear: Boolean(best)});
      });
      return out;
    };
    // pass 2: relation captions avoid the card, the checkpoints, the mailer's band and the
    // concave side of the channel (so its caption sits on the convex side)
    let pills = placePills(g1.conns.filter((x, i) => i !== chIdx && x.lab).map(x => x.lab.box));
    const reserve = ch ? (() => {
      const nm = normalIn(0.5);
      const c0 = {x: chMid.x + nm.x * 90, y: chMid.y + nm.y * 90};
      return {x: c0.x - 110, y: c0.y - 70, w: 220, h: 140};
    })() : null;
    const graph = relationGraph(ctx, graphOpts([...fixedBoxes, cardBox, ...sweep, ...pills.map(x => x.box).filter(Boolean), reserve].filter(Boolean)));
    const labBoxes = graph.conns.filter(x => x.lab).map(x => x.lab.box);
    if (pills.some(pl => pl.box && labBoxes.some(b => overlapArea(b, pl.box, 4) > 0))) pills = placePills(labBoxes);
    const route = graph.route(p.traversalOrder);
    // every connector must start/end on the edge of its own element (acceptance check)
    const onEdge = (el, q) => (el.circle
      ? Math.abs(Math.hypot(q.x - el.circle.x, q.y - el.circle.y) - el.circle.r) <= 16
      : q.x >= el.box.x - 16 && q.x <= el.box.x + el.box.w + 16 && q.y >= el.box.y - 16 && q.y <= el.box.y + el.box.h + 16
        && !(q.x > el.box.x + 2 && q.x < el.box.x + el.box.w - 2 && q.y > el.box.y + 2 && q.y < el.box.y + el.box.h - 2));
    const anchoredEnds = graph.conns.every(x => onEdge(elements[x.rel.from], x.c.from) && onEdge(elements[x.rel.to], x.c.to));
    const cum = [0];
    for (let i = 1; i < route.poly.pts.length; i++) cum.push(cum[i - 1] + Math.hypot(route.poly.pts[i].x - route.poly.pts[i - 1].x, route.poly.pts[i].y - route.poly.pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    /** arc-length fraction of the route sample nearest to q, searching from `after` */
    const passT = (q, after = 0) => {
      let best = null, bd = Infinity;
      for (let i = 0; i < route.poly.pts.length; i++) {
        const tt = cum[i] / total;
        if (tt < after) continue;
        const pt = route.poly.pts[i];
        const d = Math.hypot(pt.x - q.x, pt.y - q.y);
        if (d < bd - 1e-9) { bd = d; best = tt; }
      }
      return bd <= 30 ? best : null;
    };

    const dotStroke = th.dark ? channelColor : th.accent2;
    const stations = pills.map(({key, q, box, f}) => {
      let pill = null, lead = null;
      if (box) {
        pill = chip(ctx, stateText(key), {x: box.x + box.w / 2, y: box.y, anchor: 'middle', maxWidth: f.width + f.size * 1.2 + 2, size: f.size, minSize: f.size, maxLines: f.lines.length, fill: th.card, stroke: th.inkSoft, color: th.inkSoft, name: `st-${key}-pill`});
        // leader from the dot's rim to the nearest point of the pill
        const np = {x: clamp(q.x, box.x, box.x + box.w), y: clamp(q.y, box.y, box.y + box.h)};
        const L = Math.hypot(np.x - q.x, np.y - q.y);
        if (L > 20) {
          const u = {x: (np.x - q.x) / L, y: (np.y - q.y) / L};
          lead = h('line', {name: `st-${key}-lead`, x1: r(q.x + u.x * 15), y1: r(q.y + u.y * 15), x2: r(np.x), y2: r(np.y), stroke: th.dark ? th.fgSoft : th.inkSoft, 'stroke-width': 2.2, 'stroke-linecap': 'round'});
        }
      }
      return {key, q, pill, lead, node: g({name: `st-${key}`, opacity: 0},
        lead,
        h('circle', {name: `st-${key}-dot`, cx: q.x, cy: q.y, r: 13, fill: th.card, stroke: dotStroke, 'stroke-width': 4}),
        h('circle', {name: `st-${key}-fill`, cx: q.x, cy: q.y, r: 7, fill: dotStroke, opacity: 0}),
        pill && pill.node)};
    });
    const msgVisit = route.visits.find(v => v.id === 'message');
    stations.forEach(st => { st.t = passT(st.q, msgVisit ? msgVisit.t - 1e-6 : 0); });
    const byKey = Object.fromEntries(stations.map(st => [st.key, st]));

    // mini mailer riding the channel with the tracer (centred on the line)
    const packet = miniMailer(ctx, 'packet', PW, th);
    // on dark backgrounds the dark-blue channel is re-drawn in a lighter tint (same dashes, same draw-on)
    const overlay = ch && th.dark ? channelOverlay(ctx, 'rel-ov', ch.c, channelColor) : null;

    const tieA = circleAnchor(oc, R * grow('offeree') + 6, {x: cardBox.x + cardBox.w / 2, y: cardBox.y + cardBox.h / 2}), tieB = edgeAnchor(cardBox, oc, 6);
    const recvTie = h('line', {name: 'recv-tie', x1: r(tieA.x), y1: r(tieA.y), x2: r(tieB.x), y2: r(tieB.y), stroke: th.fgSoft, 'stroke-width': 3, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round', opacity: 0});

    return {S, s, ox, oy, bodyNode, bodyLabel, tiles, termsLabel, msg, msgNode, msgLabel, offeror, offeree, graph, route, stations, byKey, packet, PW, overlay, chIdx,
      recv, cardBox, recvTie, legend, anchoredEnds, termsBox, pillsClear: pills.every(x => !x.box || x.clear),
      centers: {offeror: at('offeror'), offeree: oc, offer: bc, terms: {x: termsBox.x + termsBox.w / 2, y: termsBox.y + termsBox.h / 2}, message: mc}};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      L.overlay && L.overlay.node,
      L.recvTie,
      L.bodyNode, L.bodyLabel && L.bodyLabel.node,
      L.tiles.map(t => t.node), L.termsLabel && L.termsLabel.node,
      L.msgNode, L.msgLabel && L.msgLabel.node,
      L.offeror.node, L.offeree.node,
      L.graph.tracerNode('tracer'), // under the captions: it never hides their text
      L.graph.labelsNode,
      L.stations.map(st => st.node),
      L.packet, // rides on the channel over the tracer (it IS the traced message there); its band is caption-free
      L.recv.node,
      L.legend && L.legend.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;

    // 1) separate: elements appear, tiles lift out of their rows
    const appear = r(seg(u, 0, 0.08), 3);
    for (const id of ['offeror', 'offeree', 'message']) nodes[`el-${id}`] = {opacity: appear};
    Object.assign(nodes, L.msg.frame({bottom: 1, top: 1, seal: 1}));
    const n = L.tiles.length;
    L.tiles.forEach((tl, i) => {
      const lp = ease.inOutCubic(seg(u, 0.05 + i * 0.018, 0.13 + i * 0.018));
      const x = lerp(tl.src.x, tl.home.x, lp), y = lerp(tl.src.y, tl.home.y, lp);
      nodes[`tile-${i}`] = {transform: T(x, y, 0, lerp(tl.k0, 1, lp)), opacity: lp > 0 ? 1 : 0};
      nodes[`slot-${i}`] = {opacity: r(clamp(lp * 3), 3)};
    });

    // the "Terms" caption arrives with the first tile (it names the exploded group)
    if (L.termsLabel) nodes['lab-terms'] = {opacity: r(ease.inOutCubic(seg(u, 0.07, 0.13)), 3)};

    // 2) relations drawn one by one
    const m = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.18 + (i * 0.25) / m, 0.18 + ((i + 1) * 0.25) / m));
    Object.assign(nodes, L.graph.frame(relP));
    if (L.overlay) Object.assign(nodes, L.overlay.frame(relP(L.chIdx)));

    // 3) tracer along the traversal order
    const tp = seg(u, ...TRACE);
    const tt = warpTrace(ease.inOutSine(tp), L.byKey.composed && L.byKey.composed.t, L.byKey.received && L.byKey.received.t);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= TRACE[0] - 0.01 && u < TRACE[1] + 0.03;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const traced = u >= TRACE[1];
    const passed = t => t !== null && t !== undefined && (traced || (u >= TRACE[0] && tt >= t));
    // swell on every visit (the focus element more)
    const k = {};
    for (const id of IDS) k[id] = 0;
    if (tracerOn) {
      for (const v of L.route.visits) {
        const d = Math.abs(tt - v.t);
        k[v.id] = Math.max(k[v.id], clamp(1 - d / 0.07));
      }
    }
    for (const id of IDS) {
      const amp = (id === p.focusElement ? AMP.focus : AMP.other) * (reduced ? 0.5 : 1);
      const kk = 1 + amp * ease.inOutSine(k[id]);
      if (id === 'terms') {
        const c = L.centers.terms;
        L.tiles.forEach(tl => { if (seg(u, 0.05, 0.2) >= 1) nodes[`tile-${tl.i}`].transform = `${scaleAbout(c.x, c.y, kk)} ${T(tl.home.x, tl.home.y)}`; });
      } else nodes[`el-${id}-body`] = {transform: kk === 1 ? '' : scaleAbout(0, 0, kk)};
    }

    // checkpoints light as the tracer passes them
    const stState = {};
    for (const st of L.stations) {
      const on = passed(st.t);
      stState[st.key] = on;
      nodes[`st-${st.key}`] = {opacity: r(seg(u, 0.36, 0.43), 3)};
      nodes[`st-${st.key}-fill`] = {opacity: on ? 1 : 0};
      if (st.pill) nodes[`st-${st.key}-pill`] = {opacity: on ? 1 : 0.45};
      if (st.lead) nodes[`st-${st.key}-lead`] = {opacity: on ? 1 : 0.45};
    }
    // the mailer rides the channel from the "composed" to the "received" checkpoint: it emerges
    // from the sealed message and is taken in by the offeree
    const a = L.byKey.composed, b = L.byKey.sent, c2 = L.byKey.inTransit, z = L.byKey.received;
    let packetPos = null;
    if (a && z && a.t !== null && z.t !== null && tracerOn && !traced && tt >= a.t && tt <= z.t) {
      const fin = clamp((tt - a.t) / Math.max(1e-6, 0.45 * ((b && b.t !== null ? b.t : z.t) - a.t)));
      const fout = clamp((z.t - tt) / Math.max(1e-6, 0.35 * (z.t - (c2 && c2.t !== null ? c2.t : a.t))));
      const vis = Math.min(fin, fout);
      packetPos = {x: tpos.x, y: tpos.y};
      const wob = reduced ? 0 : -5 * Math.sin((2 * Math.PI * (tt - a.t)) / Math.max(1e-6, z.t - a.t));
      nodes.packet = {transform: T(tpos.x, tpos.y, wob, lerp(0.72, 1, ease.outCubic(vis))), opacity: r(vis, 3)};
    } else nodes.packet = {opacity: 0, transform: T(0, 0)};

    // 4) gather: received copy
    const delivered = Boolean(stState.received);
    const recvP = delivered ? (traced ? 1 : clamp((tt - z.t) / 0.05)) : 0;
    const cb = L.cardBox;
    nodes['recv-card'] = {opacity: r(recvP, 3), transform: reduced || recvP >= 1 ? '' : scaleAbout(cb.x + cb.w / 2, cb.y + cb.h / 2, lerp(0.9, 1, recvP))};
    nodes['recv-tie'] = {opacity: r(recvP * 0.9, 3)};

    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        packet: packetPos ? {x: r(packetPos.x), y: r(packetPos.y)} : null,
        tilesOut: r(ease.inOutCubic(seg(u, 0.05 + (n - 1) * 0.018, 0.13 + (n - 1) * 0.018)), 3),
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        visitOrder: L.route.visits.map(v => v.id),
        checkpoints: Object.fromEntries(L.stations.map(st => [st.key, Boolean(stState[st.key])])),
        checkpointOrder: L.stations.filter(st => st.t !== null).sort((x, y) => x.t - y.t).map(st => st.key),
        checkpointsClear: L.pillsClear,
        delivered,
        receivedCopy: r(recvP, 3),
        focus: p.focusElement,
        relationKinds: p.relationships.map(x => x.kind),
        anchoredEnds: L.anchoredEnds,
        focusScale: r(1 + (p.focusElement === 'terms' ? 0 : AMP.focus) * ease.inOutSine(k[p.focusElement] || 0), 3),
      },
    };
  },
};

/**
 * Width for a badge caption (chip at 28 px, weight 600): when the caption does not fit on
 * one line and ends with a parenthetical ("Offeree (Party B)"), the width is narrowed so the
 * greedy wrap breaks BEFORE the parenthesis instead of inside it.
 */
function badgeLabelMax(ctx, text, max) {
  const size = 28, pad = size * 0.6 * 2 + 2;
  const w = t => ctx.measure(t, size, 600, 'sans');
  if (!text || w(text) + pad <= max) return max;
  const m = /^(.*\S)\s+(\([^()]*\))$/.exec(text);
  if (!m) return max;
  const need = Math.max(w(m[1]), w(m[2])) + pad;
  return need <= max ? need : max;
}

function overlapArea(a, b, pad = 0) {
  const w = Math.min(a.x + a.w + pad, b.x + b.w + pad) - Math.max(a.x - pad, b.x - pad);
  const hh = Math.min(a.y + a.h + pad, b.y + b.h + pad) - Math.max(a.y - pad, b.y - pad);
  return w > 0 && hh > 0 ? w * hh : 0;
}

/**
 * Route fraction reached at eased trace progress e. The channel stretch [a, z] (where the mailer
 * rides) gets at least 42% of the trace time, the rest of the route shares the remainder in
 * proportion to its length. Piecewise linear, continuous and monotonic.
 */
function warpTrace(e, a, z) {
  if (a === null || a === undefined || z === null || z === undefined || !(z > a)) return e;
  const A = a, B = z - a, C = 1 - z;
  const cs = Math.max(B, 0.42);
  const rest = 1 - cs;
  const A2 = A + C > 0 ? (rest * A) / (A + C) : 0, C2 = rest - A2;
  if (e <= A2) return A2 > 0 ? (e / A2) * A : A;
  if (e <= A2 + cs) return A + ((e - A2) / cs) * B;
  return C2 > 0 ? z + ((e - A2 - cs) / C2) * C : 1;
}

function unit(v) {
  const l = Math.hypot(v.x, v.y) || 1;
  return {x: v.x / l, y: v.y / l};
}

/**
 * Measured tile: the label and the value each get up to two lines (smaller type only when a
 * single line does not fit), so long terms keep their meaning. Returns the height it needs.
 */
function tileSpec(ctx, t, w, minH, showText) {
  const inner = w - 20 * 2 - 14;
  if (!showText) return {h: minH, lf: null, vf: null};
  let lf = ctx.fit(t.label, {maxWidth: inner, size: 21, minSize: 18, maxLines: 1, weight: 600});
  if (lf.truncated) lf = ctx.fit(t.label, {maxWidth: inner, size: 18, minSize: 15, maxLines: 2, weight: 600});
  let vf = ctx.fit(t.value, {maxWidth: inner, size: 33, minSize: 28, maxLines: 1, weight: 700});
  if (vf.truncated) vf = ctx.fit(t.value, {maxWidth: inner, size: 24, minSize: 17, maxLines: 2, weight: 700});
  const top = 14, gap = 12, bottom = 14;
  return {h: Math.max(minH, top + lf.height + gap + vf.height + bottom), lf, vf, top, gap};
}

/** A term tile: coloured stripe, label and value (bars when text is hidden). Local origin = centre. */
function tileNode(ctx, name, w, hh, color, spec) {
  const th = ctx.theme;
  const x0 = -w / 2, y0 = -hh / 2;
  const pad = 20;
  const parts = [
    h('path', {d: roundRectPath(x0 + 5, y0 + 8, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 12), fill: th.card, stroke: th.ink, 'stroke-width': 2.5}),
    h('path', {d: `M${x0 + 12} ${y0}H${x0 + 14}V${y0 + hh}H${x0 + 12}Q${x0} ${y0 + hh} ${x0} ${y0 + hh - 12}V${y0 + 12}Q${x0} ${y0} ${x0 + 12} ${y0}Z`, fill: color}),
    h('rect', {x: x0, y: y0 + 2, width: 14, height: hh - 4, fill: color}),
  ];
  const inner = w - pad * 2 - 14;
  if (spec.lf) {
    // text block vertically centred in the (row-height) tile
    const blockH = spec.lf.height + spec.gap + spec.vf.height;
    const ty = y0 + (hh - blockH) / 2;
    parts.push(textBlock(spec.lf, {x: x0 + 14 + pad, y: ty, fill: th.inkSoft}));
    parts.push(textBlock(spec.vf, {x: x0 + 14 + pad, y: ty + spec.lf.height + spec.gap, fill: th.ink}));
  } else {
    parts.push(h('rect', {x: x0 + 14 + pad, y: y0 + hh * 0.22, width: inner * 0.42, height: 12, rx: 3, fill: th.paperLine}));
    parts.push(h('rect', {x: x0 + 14 + pad, y: y0 + hh * 0.55, width: inner * 0.7, height: 20, rx: 4, fill: th.ink, opacity: 0.72}));
  }
  return g({name, opacity: 0}, parts);
}

/** Small sealed mailer icon (for the channel). Local origin = centre. */
function miniMailer(ctx, name, w, th) {
  const hh = w * 0.46;
  return g({name, opacity: 0},
    h('path', {d: roundRectPath(-w / 2 + 4, -hh / 2 + 6, w, hh, 5), fill: th.shadow}),
    h('path', {d: roundRectPath(-w / 2, -hh / 2, w, hh, 5), fill: '#f2e8d4', stroke: th.ink, 'stroke-width': 2.5}),
    h('rect', {x: w / 2 - w * 0.22, y: -hh / 2 + 6, width: w * 0.15, height: hh * 0.4, rx: 2, fill: th.accent2Soft, stroke: th.inkSoft, 'stroke-width': 1.2}),
    h('rect', {x: -w / 2 + 10, y: -hh * 0.08, width: w * 0.4, height: 5, rx: 2, fill: th.paperLine}),
    h('rect', {x: -w / 2 + 10, y: hh * 0.14, width: w * 0.3, height: 5, rx: 2, fill: th.paperLine}),
    h('circle', {cx: 0, cy: hh / 2, r: hh * 0.16, fill: th.accent, stroke: th.ink, 'stroke-width': 1.8}),
  );
}

/**
 * Lighter re-draw of the channel connector for dark backgrounds: same curve, dashes,
 * draw-on progress and arrowhead as primitives/annotate `connector` (communication style).
 */
function channelOverlay(ctx, name, c, color) {
  const width = 3.5;
  const d = `M${r(c.from.x)} ${r(c.from.y)}C${r(c.c1.x)} ${r(c.c1.y)} ${r(c.c2.x)} ${r(c.c2.y)} ${r(c.to.x)} ${r(c.to.y)}`;
  const total = c.total;
  const end = c.at(1);
  const headLen = width * 4.2;
  const pts = [c.from, c.c1, c.c2, c.to];
  const pad = width * 6 + 20;
  const mx = Math.min(...pts.map(q => q.x)) - pad, my = Math.min(...pts.map(q => q.y)) - pad;
  const node = g({name, opacity: 0},
    h('defs', null, h('mask', {id: ctx.id(`${name}-mask`), maskUnits: 'userSpaceOnUse', x: r(mx), y: r(my), width: r(Math.max(...pts.map(q => q.x)) - mx + pad), height: r(Math.max(...pts.map(q => q.y)) - my + pad)},
      h('path', {name: `${name}-m`, d, fill: 'none', stroke: '#fff', 'stroke-width': width * 4, 'stroke-linecap': 'round', 'stroke-dasharray': `${r(total)} ${r(total + 10)}`, 'stroke-dashoffset': r(total)}))),
    h('path', {d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-dasharray': '10 9', mask: ctx.ref(`${name}-mask`)}),
    h('path', {name: `${name}-head`, d: `M0 0L${r(-headLen)} ${r(-headLen * 0.55)}L${r(-headLen * 0.72)} 0L${r(-headLen)} ${r(headLen * 0.55)}Z`, fill: color, transform: T(end.x, end.y, (end.a * 180) / Math.PI), opacity: 0}),
  );
  const frame = pr => ({
    [name]: {opacity: pr > 0 ? 1 : 0},
    [`${name}-m`]: {'stroke-dashoffset': r(total * (1 - pr))},
    [`${name}-head`]: {opacity: pr >= 0.985 ? 1 : 0},
  });
  return {node, frame};
}

/**
 * Received-copy card, measured: each row shows the term label (small, up to two lines) above
 * its value (bold, up to two lines), so long values are never dropped. `k` scales the type.
 */
function receivedSpec(ctx, terms, w, title, note, k) {
  const showKey = ctx.show('key'), showAll = ctx.show('all');
  const headH = showKey ? 54 : 20;
  const inner = w - 66;
  const rows = terms.map(t => {
    if (!showAll) return {h: 44, lf: null, vf: null};
    const lf = ctx.fit(t.label, {maxWidth: inner, size: 19 * k, minSize: Math.min(19 * k, 15), maxLines: 2, weight: 600});
    const vf = ctx.fit(t.value, {maxWidth: inner, size: 25 * k, minSize: Math.min(25 * k, 18), maxLines: 2, weight: 700});
    return {h: 11 + lf.height + 9 + vf.height + 12, lf, vf};
  });
  const noteFit = note && showAll ? ctx.fit(`“${note}”`, {maxWidth: w - 78, size: 23 * k, minSize: Math.min(23 * k, 17), maxLines: 2, weight: 500}) : null;
  const noteH = note ? (noteFit ? noteFit.height + 28 : 36) : 0;
  const titleFit = showKey ? ctx.fit(title, {maxWidth: w - 40, size: 28, minSize: 21, maxLines: 1, weight: 700}) : null;
  return {w, h: headH + rows.reduce((a, b) => a + b.h, 0) + 10 + noteH, headH, rows, noteFit, noteH, titleFit, note};
}

/** Card at the offeree listing the same terms as received (top-left at `o`). */
function receivedCard(ctx, spec, terms, colors, o) {
  const th = ctx.theme;
  const {w} = spec;
  const hh = spec.h;
  const x0 = o.x, y0 = o.y;
  const parts = [
    h('path', {d: roundRectPath(x0 + 6, y0 + 9, w, hh, 12), fill: th.shadow}),
    h('path', {d: roundRectPath(x0, y0, w, hh, 12), fill: th.paper, stroke: th.ink, 'stroke-width': 2.5}),
  ];
  if (spec.titleFit) parts.push(textBlock(spec.titleFit, {x: x0 + 20, y: y0 + 14, fill: th.accent4}));
  let y = y0 + spec.headH;
  terms.forEach((t, i) => {
    const row = spec.rows[i];
    if (i > 0) parts.push(h('line', {x1: x0 + 18, x2: x0 + w - 18, y1: y, y2: y, stroke: th.paperLine, 'stroke-width': 1.5, 'stroke-dasharray': '2 5'}));
    parts.push(h('rect', {x: x0 + 18, y: y + 9, width: 12, height: row.h - 18, rx: 3, fill: colors[t.key] || th.inkSoft}));
    if (row.lf) {
      parts.push(textBlock(row.lf, {x: x0 + 44, y: y + 11, fill: th.inkSoft}));
      parts.push(textBlock(row.vf, {x: x0 + 44, y: y + 11 + row.lf.height + 9, fill: th.ink}));
    } else {
      parts.push(h('rect', {x: x0 + 44, y: y + row.h / 2 - 5, width: (w - 90) * (0.55 + 0.35 * ctx.rng('recv', i)), height: 10, rx: 4, fill: th.ink, opacity: 0.6}));
    }
    y += row.h;
  });
  if (spec.note) {
    const ny = y + 6;
    parts.push(h('line', {x1: x0 + 18, x2: x0 + w - 18, y1: ny, y2: ny, stroke: th.paperLine, 'stroke-width': 2, 'stroke-dasharray': '3 5'}));
    // speech mark icon
    parts.push(h('path', {d: `M${r(x0 + 20)} ${r(ny + 12)}h20a6 6 0 0 1 6 6v8a6 6 0 0 1 -6 6h-10l-6 6v-6h-4a6 6 0 0 1 -6 -6v-8a6 6 0 0 1 6 -6z`, fill: th.accent2Soft, stroke: th.accent2, 'stroke-width': 1.8}));
    if (spec.noteFit) parts.push(textBlock(spec.noteFit, {x: x0 + 58, y: ny + 13, fill: th.inkSoft, italic: true}));
    else parts.push(h('rect', {x: x0 + 58, y: ny + 18, width: (w - 90) * 0.6, height: 9, rx: 4, fill: th.paperLine}));
  }
  return {node: g({name: 'recv-card', opacity: 0}, parts), w, h: hh};
}

function legendNode(ctx, kinds, labels, at, channelColor, size = 28) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const gap = size * 1.8;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = it.k === 'communication' ? channelColor : kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return {node: g({name: 'legend'}, parts), box: {x: at.x - total / 2, y: at.y - size, w: total, h: size * 1.6}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'contract-formation-01-mechanism',
    title: 'Communicated offer — anatomy of the communication',
    titleEs: 'Oferta comunicada — Mecanismo o relación explicada',
    category: 'contract-formation',
    categoryName: 'Formación del contrato',
    motif: 'Oferta comunicada',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: the term rows lift out of the offer body as coloured tiles; offeror, offer, terms, sealed message and offeree are linked only by the supplied relationships (plain relation without arrow, sequence, communication channel). A tracer follows the traversal order, the channel checkpoints light composed → sent → in transit → received, and the same terms appear at the offeree. No acceptance or legal effect is shown.',
    tags: ['offer', 'terms', 'mechanism', 'exploded', 'channel', 'checkpoints', 'tracer', 'sent', 'received'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/contract-formation/kits/offer-letter.js', 'src/animations/contract-formation/kits/offer-fields.js', 'src/frameworks/graph.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
