/**
 * LAW-0070 — Comprobación de jurisdicción · mechanism
 *
 * Storyboard (exploded anatomy of the jurisdiction filter, laid out as a fork):
 *  0.00–0.18  separate: the filter housing stands in the middle; the library,
 *             the traced source document, the research card and the two
 *             output trays come out of it to their places (an exploded view).
 *             Inside the housing: a KEY slot (fed by the card), a READ slot
 *             (fed by the document's declaration), a comparison window and
 *             the switch blade in front of two outlets.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             anchored to element edges and styled by kind — plain relation
 *             (no arrow), communication (dashed), sequence (arrow). Causal
 *             only if an author supplies it.
 *  0.43–0.75  trace: a marker shaped like the traced document follows the
 *             supplied traversal order. While it is inside the filter (the
 *             focus element), the filter enlarges: the declared emblem drops
 *             into the READ slot next to the KEY, the window shows "=" or "≠",
 *             and only then the blade turns to the matching outlet.
 *  0.75–1.00  gather: everything stays anchored; origin (library/document),
 *             transformation (key vs read) and state (the document in its
 *             tray) remain visible, plus a legend of the connector kinds.
 * Wide boxes: fork to the right (relevant above, other below). Tall boxes:
 * fork downward (relevant left, other right).
 * Legal content: fictional; the filter compares two supplied labels only.
 * @module animations/research/LAW-0070
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {roundRectPath, polyline, edgeAnchor} from '../../core/geometry.js';
import {mechanismFields, str, obj, oneOf, list, int} from '../../schemas/fields.js';
import {chip, textBlock} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {shade} from '../../primitives/paper.js';
import {jurFields, JUR_DEFAULTS, JUR_STRINGS, resolveJur, sourceSheet, indexCard, bookcase, emblem, relGlyph, jurColor, rulePlate, plateSize, hyCtx} from './kits/comprobacion-de-jurisdiccion.js';

const ID = 'LAW-0070';
const DURATION = 7000;
const IDS = ['library', 'document', 'card', 'filter', 'relevant', 'other'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {out: [0.02, 0.16], labels: [0.1, 0.18], relate: [0.19, 0.42], trace: [0.44, 0.73], legend: [0.76, 0.84]};
const DWELL = 0.07; // share of the trace window the marker rests in the filter
const FILTER_AT = 0.56; // the marker reaches the filter's reading bay (comparison beat)
const STRINGS = {
  en: {...JUR_STRINGS.en, slotKey: 'key from the card', slotRead: 'declared on the document'},
  es: {...JUR_STRINGS.es, slotKey: 'clave de la ficha', slotRead: 'declarada en el documento'},
};

const baseMech = mechanismFields(IDS);
const sceneSchema = {
  ...jurFields,
  sampleSource: int('Index (0 = first) of the source document whose path is traced', 0, 5),
  ...baseMech,
  relationships: list('Explicit relationships between components; kind controls the line style (causal only when the author supplies it)', obj('Relationship', {
    from: oneOf('Source component id', IDS),
    to: oneOf('Target component id', IDS),
    kind: oneOf('relation | communication | sequence | causal (causal only when supplied)', ['relation', 'communication', 'sequence', 'causal']),
    label: str('Optional caption on this connector (otherwise the caption of its kind)', 40),
  }, ['from', 'to', 'kind']), 1, 8),
};

const defaultParams = {
  ...JUR_DEFAULTS,
  sampleSource: 0,
  elements: [
    {id: 'library', label: 'Library'},
    {id: 'document', label: 'Source document'},
    {id: 'card', label: 'Research card'},
    {id: 'filter', label: 'Jurisdiction filter'},
    {id: 'relevant', label: 'Relevant jurisdiction'},
    {id: 'other', label: 'Other jurisdiction'},
  ],
  relationships: [
    {from: 'library', to: 'document', kind: 'relation', label: 'holds'},
    {from: 'card', to: 'filter', kind: 'communication', label: 'sets the key'},
    {from: 'document', to: 'filter', kind: 'sequence', label: 'passes through'},
    {from: 'filter', to: 'relevant', kind: 'sequence', label: 'same as the key'},
    {from: 'filter', to: 'other', kind: 'sequence', label: 'different from the key'},
  ],
  focusElement: 'filter',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['library', 'document', 'filter', 'relevant'],
};

/** Element boxes per shape. `fork` = direction of the two outlets; `pref` = preferred label side.
 * The parts are spread over the whole width so every connector has room for its
 * caption beside it (not on top of it). */
function plan(shape, D) {
  const Wd = D.w;
  if (shape === 'portrait') {
    const fw = 420, fx = Wd - 40 - fw;
    return {
      fork: 'down', size: 28, chipMax: 196,
      box: {
        library: {x: 36, y: 92, w: 260, h: 256}, card: {x: Wd - 40 - 440, y: 92, w: 440, h: 236},
        document: {x: 30, y: 498, w: 212, h: 300}, filter: {x: fx, y: 470, w: fw, h: 400},
        relevant: {x: 26, y: 1010, w: 440, h: 200}, other: {x: Wd - 26 - 440, y: 1010, w: 440, h: 200},
      },
      pref: {library: 'above', card: 'above', document: 'below', filter: 'above', relevant: 'below', other: 'below'},
      legendY: D.h - 22,
    };
  }
  if (shape === 'square') {
    const tw = 340;
    const tx = Math.max(450 + 330 + 170, Wd - tw - 26);
    return {
      fork: 'right', size: 28, chipMax: 190,
      box: {
        library: {x: 40, y: 96, w: 260, h: 270}, card: {x: 440, y: 80, w: 350, h: 210},
        document: {x: 44, y: 510, w: 214, h: 310}, filter: {x: 450, y: 450, w: 330, h: 340},
        relevant: {x: tx, y: 190, w: tw, h: 240}, other: {x: tx, y: 650, w: tw, h: 240},
      },
      pref: {library: 'above', card: 'above', document: 'below', filter: 'below', relevant: 'above', other: 'below'},
      legendY: D.h - 30,
    };
  }
  const trayW = Math.min(470, Math.max(380, Wd * 0.22));
  const trayX = Wd - 40 - trayW;
  const fw = 460;
  const fx = Math.round(Math.min(trayX - fw - 200, Math.max(560, (370 + trayX) / 2 - fw / 2)));
  return {
    fork: 'right', size: 28, chipMax: 230,
    box: {
      library: {x: 70, y: 74, w: 320, h: 262}, card: {x: fx + 20, y: 64, w: 420, h: 190},
      document: {x: 90, y: 462, w: 270, h: 292}, filter: {x: fx, y: 410, w: fw, h: 330},
      relevant: {x: trayX, y: 104, w: trayW, h: 236}, other: {x: trayX, y: 524, w: trayW, h: 236},
    },
    // the card's name sits beside it (right), so the card→filter connector below it keeps
    // room on both sides for its own caption
    pref: {library: 'above', card: 'right', document: 'below', filter: 'below', relevant: 'above', other: 'below'},
    legendY: D.h - 20,
  };
}

/** Swell of the focus element while the marker is inside it (others swell less). */
const AMP = {focus: 0.1, other: 0.04};

const scene = {
  sizes: {landscape: [1600, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx0) {
    // hyphenated names wrap at their hyphens, never inside a word
    const ctx = hyCtx(ctx0);
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const M = resolveJur(p);
    const PL = plan(ctx.view.shape, D);
    const B = PL.box;
    const sample = M.docs[Math.min(p.sampleSource, M.docs.length - 1)];
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const amp = id => (id === p.focusElement ? AMP.focus : AMP.other);
    const cen = id => ({x: B[id].x + B[id].w / 2, y: B[id].y + B[id].h / 2});

    // ---------------------------------------------------------------- art
    const art = {};
    // library: bookcase with one compartment of face-out sources
    {
      const bx = B.library;
      const bc = bookcase(ctx, {prefix: 'm-lib', w: bx.w, h: bx.h, rows: [{kind: 'books', h: 1}, {kind: 'open', h: 1.3}, {kind: 'books', h: 1}], seedKey: 'jur-mlib'});
      const open = bc.inner[1];
      const nd = Math.min(4, M.docs.length);
      const sw = Math.min(46, (open.w - 16) / nd - 6), sh = Math.min(open.h - 12, sw * 1.32);
      const minis = M.docs.slice(0, nd).map((d, i) => g({transform: T(open.x + 10 + i * (sw + 6), open.y + open.h - sh - 2)},
        h('rect', {width: sw, height: sh, rx: 3, fill: th.paper, stroke: th.ink, 'stroke-width': 1.6, opacity: d.i === sample.i ? 0.35 : 1}),
        emblem(ctx, {key: d.key, s: sw * 0.42, x: sw * 0.68, y: sw * 0.34, opacity: d.i === sample.i ? 0.35 : 1}),
        d.i === sample.i ? h('rect', {width: sw, height: sh, rx: 3, fill: 'none', stroke: th.inkSoft, 'stroke-width': 1.6, 'stroke-dasharray': '4 3'}) : null));
      art.library = g({transform: T(bx.x, bx.y)}, bc.node, minis);
    }
    // traced document (full detail)
    const sheet = sourceSheet(ctx, {prefix: 'm-doc', w: B.document.w, h: B.document.h, doc: sample, jur: {key: sample.key, name: sample.name}, detail: 'full'});
    art.document = g({transform: T(B.document.x, B.document.y)}, sheet.node);
    // height (sheet-local) of the band between the seal and the declaration strip: the marker
    // passes the document there, never over the declared jurisdiction
    // (a marker 58 units tall: it keeps above the strip where it can, and never over the
    // seal's emblem)
    const docUpperY = Math.max(sheet.sealC.y + sheet.R * 0.5 + 29, Math.min((sheet.sealC.y + sheet.R + sheet.strip.y) / 2, sheet.strip.y - 31));
    // research card
    const card = indexCard(ctx, {prefix: 'm-card', w: B.card.w, h: B.card.h, query: p.query, jur: M.relevant});
    art.card = g({transform: T(B.card.x, B.card.y)}, card.node);
    // filter housing (key slot, read slot, comparison window, blade, outlets)
    const F = filterDevice(ctx, {box: B.filter, fork: PL.fork, relKey: M.relevant.key, docKey: sample.key});
    art.filter = F.node;
    // output trays: the other sources already sorted there; the traced one arrives last
    const trayOf = id => {
      const same = id === 'relevant';
      const docs = M.docs.filter(d => d.relevant === same && d.i !== sample.i);
      return outputTray(ctx, {prefix: `m-${id}`, box: B[id], docs, same, relKey: M.relevant.key, sampleKey: sample.key});
    };
    const trays = {relevant: trayOf('relevant'), other: trayOf('other')};
    art.relevant = trays.relevant.node;
    art.other = trays.other.node;

    // legend of connector kinds used (wraps into rows; its top bounds the labels)
    let legend = null;
    let legendTop = PL.legendY;
    {
      const rels0 = p.relationships.filter(rl => rl.from !== rl.to);
      const kinds = [...new Set(rels0.map(x => x.kind))];
      const items = kinds.map(kd => {
        const col = kindColor(ctx, kd);
        const dash = kd === 'communication' ? '8 7' : null;
        const f = ctx.fit(p.relationLabels[kd] || kd, {maxWidth: Math.min(300, D.w - 120), size: 22, maxLines: 1, weight: 500});
        return {w: 64 + f.width, node: x => g({transform: T(x, 0)},
          h('line', {x1: 0, y1: 0, x2: 54, y2: 0, stroke: col, 'stroke-width': 3, 'stroke-dasharray': dash}),
          kd === 'relation' ? g(null, h('circle', {cx: 0, cy: 0, r: 4.5, fill: col}), h('circle', {cx: 54, cy: 0, r: 4.5, fill: col})) : h('path', {d: 'M54 0l-12 -7v14z', fill: col}),
          textBlock(f, {x: 64, y: -f.size * 0.55, fill: th.fgSoft}))};
      });
      const maxW = D.w - 40;
      const rows = [[]];
      let rw = 0;
      for (const it of items) {
        if (rows[rows.length - 1].length && rw + 40 + it.w > maxW) { rows.push([]); rw = 0; }
        rows[rows.length - 1].push(it);
        rw += (rw ? 40 : 0) + it.w;
      }
      const rowH = 34;
      legendTop = PL.legendY - (rows.length - 1) * rowH;
      if (ctx.show('all')) {
        legend = g({name: 'legend', opacity: 0}, rows.map((row, ri) => {
          const width = row.reduce((a, it) => a + it.w, 0) + 40 * (row.length - 1);
          let x = (D.w - width) / 2;
          return g({transform: T(0, legendTop + ri * rowH)}, row.map(it => { const n = it.node(x); x += it.w + 40; return n; }));
        }));
      } else legendTop = PL.legendY + 30;
    }
    // ---------------------------------------------------------------- graph geometry
    // anchor boxes include the swell (label obstacles and the edge check)
    const elements = {};
    for (const id of IDS) elements[id] = {box: swollen(B[id], amp(id))};
    const rels = p.relationships.filter(rl => rl.from !== rl.to);
    // Connector ends sit on what is drawn: a filter↔tray connector leaves from the
    // outlet port of that tray and lands on the tray (its plate and body), a
    // document↔filter connector enters through the intake; other ends sit on the
    // element's edge. Each end becomes a tiny anchor element of its own.
    const isTray = id => id === 'relevant' || id === 'other';
    // the document's connector to the filter leaves from its right edge ABOVE the declaration
    // strip, so the marker never crosses (or rests on) the declared jurisdiction
    const docPort = {at: {x: B.document.x + B.document.w, y: B.document.y + docUpperY}};
    const port = (id, other) => (id === 'filter' && isTray(other) ? F.ports[other] : id === 'filter' && other === 'document' ? F.intake : id === 'document' && other === 'filter' ? docPort : null);
    const bodyBox = id => (isTray(id) ? trays[id].tight : B[id]);
    const refPt = (id, other) => { const q = port(id, other); return q ? q.at : cen(id); };
    const endAt = (id, other, toward) => { const q = port(id, other); return q ? q.at : edgeAnchor(bodyBox(id), toward, 0); };
    const anchorEls = {};
    const pseudo = rels.map((rl, i) => {
      let P0 = endAt(rl.from, rl.to, refPt(rl.to, rl.from));
      const P1 = endAt(rl.to, rl.from, P0);
      P0 = endAt(rl.from, rl.to, P1);
      const L = Math.hypot(P1.x - P0.x, P1.y - P0.y) || 1;
      const u = {x: (P1.x - P0.x) / L, y: (P1.y - P0.y) / L};
      const padTo = rl.kind === 'relation' ? 8 : 14;
      // landing: starts 3 units off the edge / port mouth, arrowheads touch the edge
      const a0 = 8 + 0.5 - 3, a1 = padTo + 0.5 - (rl.kind === 'relation' ? 3 : 1);
      const fromKey = `${rl.from}~${i}`, toKey = `${rl.to}~${i}`;
      anchorEls[fromKey] = {circle: {x: P0.x - u.x * a0, y: P0.y - u.y * a0, r: 0.5}};
      anchorEls[toKey] = {circle: {x: P1.x + u.x * a1, y: P1.y + u.y * a1, r: 0.5}};
      return {...rl, from: fromKey, to: toKey};
    });
    const elementBoxes = IDS.map(id => elements[id].box);
    // what is actually drawn (captions may use the empty part of a tray's area)
    const drawnBoxes = IDS.flatMap(id => (isTray(id)
      ? [swollenAbout(trays[id].tight, cen(id), amp(id)), swollenAbout(trays[id].plate, cen(id), amp(id))]
      : [elements[id].box]));
    const graphOpts = extra => ({
      name: 'rel', elements: anchorEls, relationships: pseudo, relationLabels: p.relationLabels,
      bend: rl => (rl.kind === 'relation' ? 0.1 : 0.04),
      chipSize: 24, chipMax: PL.chipMax, bounds: {x: 8, y: 8, w: D.w - 16, h: legendTop - 26}, separateLabels: true, ...extra,
    });
    // connectors only: their captions are placed below, beside the line on a short leader
    const lineCtx = {...ctx, show: level => (level === 'all' ? false : ctx.show(level))};
    const graph = relationGraph(lineCtx, graphOpts({obstacles: drawnBoxes}));
    const linePts = graph.conns.flatMap(x => Array.from({length: 41}, (_, k) => x.c.at(k / 40)));
    // the band every connector (and the marker riding on it) occupies: no caption sits there
    const corridors = graph.conns.flatMap(x => {
      const n = Math.max(4, Math.ceil(x.c.total / 16));
      return Array.from({length: n + 1}, (_, k) => { const q = x.c.at(k / n); return {x: q.x - 26, y: q.y - 26, w: 52, h: 52}; });
    });

    // ---------------------------------------------------------------- element labels
    // each label takes the first side (preferred first) clear of elements, connectors and other labels
    const labels = {};
    const labelBoxes = [];
    const bounds = {x: 6, y: 6, w: D.w - 12, h: legendTop - 30};
    const inflated = elementBoxes;
    if (ctx.show('key')) {
      for (const id of IDS) {
        const bx = elements[id].box;
        const mw0 = Math.max(240, B[id].w + 40);
        const sides = [PL.pref[id], ...['below', 'above', 'left', 'right'].filter(sd => sd !== PL.pref[id])];
        const ok = b => {
          if (b.x < bounds.x || b.y < bounds.y || b.x + b.w > bounds.x + bounds.w || b.y + b.h > bounds.y + bounds.h) return false;
          if (inflated.some(e => overlapBox(b, e, 4))) return false;
          if (labelBoxes.some(e => overlapBox(b, e, 6))) return false;
          return !linePts.some(q => q.x > b.x - 8 && q.x < b.x + b.w + 8 && q.y > b.y - 8 && q.y < b.y + b.h + 8);
        };
        let found = null;
        let first = null;
        // widest two-line chip first, then narrower three-line variants
        for (const [mw, ml] of [[mw0, 2], [mw0 * 0.72, 3], [mw0 * 0.55, 3], [mw0 * 0.42, 4]]) {
          const probe = chip(ctx, label(id), {x: 0, y: 0, maxWidth: mw, size: PL.size, maxLines: ml, weight: 700});
          if (probe.fit.truncated && ml < 4) continue;
          const cw = probe.box.w, ch = probe.box.h;
          for (const sd of sides) {
            for (const off of [0, -0.25, 0.25, -0.45, 0.45]) {
              const c = sd === 'above' || sd === 'below'
                ? {x: bx.x + bx.w / 2 - cw / 2 + off * bx.w, y: sd === 'above' ? bx.y - 8 - ch : bx.y + bx.h + 8}
                : {x: sd === 'left' ? bx.x - 10 - cw : bx.x + bx.w + 10, y: bx.y + bx.h / 2 - ch / 2 + off * bx.h};
              const b = {x: c.x, y: c.y, w: cw, h: ch};
              if (!first) first = {b, mw, ml};
              if (ok(b)) { found = {b, mw, ml}; break; }
            }
            if (found) break;
          }
          if (found) break;
        }
        const at = found || first;
        const c = chip(ctx, label(id), {x: at.b.x + at.b.w / 2, y: at.b.y, anchor: 'middle', maxWidth: at.mw, size: PL.size, maxLines: at.ml, name: `lab-${id}`, weight: 700});
        labels[id] = c;
        labelBoxes.push(c.box);
      }
    }
    // relation captions: beside their own connector on a short leader, clear of the parts,
    // the element labels (with a margin, so a caption never reads as part of a name), the
    // other captions and every connector band
    const roomy = labelBoxes.map(b => ({x: b.x - 10, y: b.y - 10, w: b.w + 20, h: b.h + 20}));
    const conns = graph.conns.map((x, i) => ({...x, orig: rels[i]}));
    // check: outlet connectors leave from their port and their arrowheads land on the tray body
    const edgeDist = (q, b) => { const dx = Math.max(b.x - q.x, 0, q.x - b.x - b.w), dy = Math.max(b.y - q.y, 0, q.y - b.y - b.h); const out = Math.hypot(dx, dy); return out > 0 ? out : Math.min(q.x - b.x, b.x + b.w - q.x, q.y - b.y, b.y + b.h - q.y); };
    const outletsLand = conns.filter(x => (x.orig.from === 'filter' && isTray(x.orig.to)) || (x.orig.to === 'filter' && isTray(x.orig.from))).every(x => {
      const fEnd = x.orig.from === 'filter' ? x.c.from : x.c.to, tEnd = x.orig.from === 'filter' ? x.c.to : x.c.from;
      const tray = x.orig.from === 'filter' ? x.orig.to : x.orig.from;
      return Math.hypot(fEnd.x - F.ports[tray].at.x, fEnd.y - F.ports[tray].at.y) <= 6 && edgeDist(tEnd, trays[tray].tight) <= 4;
    });
    const relLabels = ctx.show('all') ? placeRelLabels(ctx, conns, p.relationLabels, [...drawnBoxes, ...roomy], corridors, {x: 8, y: 8, w: D.w - 16, h: legendTop - 26}, PL.chipMax) : [];

    // ---------------------------------------------------------------- tracer route
    // the marker follows the connectors in the supplied order; inside the filter it
    // rests in the reading bay (below the window captions), inside a tray on its body
    // (on the source document it passes above the declaration strip, never over it)
    const visitPt = id => (id === 'filter' ? F.dwell
      : isTray(id) ? {x: trays[id].tight.x + trays[id].tight.w / 2, y: trays[id].tight.y + trays[id].tight.h * 0.62}
        : id === 'document' ? {x: B.document.x + B.document.w * 0.42, y: B.document.y + docUpperY} : cen(id));
    const route0 = (() => {
      const pts = [];
      const visits = [];
      const order = p.traversalOrder;
      for (let i = 0; i < order.length; i++) {
        const id = order[i];
        if (i > 0) {
          const prev = order[i - 1];
          const link = conns.find(x => (x.orig.from === prev && x.orig.to === id) || (x.orig.from === id && x.orig.to === prev));
          if (link) {
            const fwd = link.orig.from === prev;
            const n = 30;
            for (let k = 0; k <= n; k++) pts.push(link.c.at(fwd ? k / n : 1 - k / n));
          }
        }
        pts.push(visitPt(id));
        visits.push({id, idx: pts.length - 1});
      }
      const clean = pts.filter((q, k) => k === 0 || Math.hypot(q.x - pts[k - 1].x, q.y - pts[k - 1].y) > 0.01);
      const idxMap = [];
      let j = -1;
      pts.forEach((q, k) => { if (k === 0 || Math.hypot(q.x - pts[k - 1].x, q.y - pts[k - 1].y) > 0.01) j++; idxMap[k] = j; });
      const cum = [0];
      for (let k = 1; k < clean.length; k++) cum.push(cum[k - 1] + Math.hypot(clean[k].x - clean[k - 1].x, clean[k].y - clean[k - 1].y));
      const total = cum[cum.length - 1] || 1;
      return {poly: polyline(clean.length > 1 ? clean : [clean[0], {x: clean[0].x + 0.01, y: clean[0].y}]), visits: visits.map(v => ({id: v.id, t: cum[idxMap[v.idx]] / total}))};
    })();
    // the route continues from the last tray into its arrival slot
    const lastId = p.traversalOrder[p.traversalOrder.length - 1];
    const slot = trays[lastId] ? trays[lastId].inAt : null;
    const route = slot ? {poly: polyline([...route0.poly.pts, slot]), visits: route0.visits.map(v => ({...v, t: v.t * route0.poly.total / (route0.poly.total + Math.hypot(slot.x - route0.poly.pts[route0.poly.pts.length - 1].x, slot.y - route0.poly.pts[route0.poly.pts.length - 1].y))}))} : route0;
    const arrivalScale = slot ? trays[lastId].sheet.w / 44 : 1;
    // the source position empties once the traced document has left it
    const docVisits = route.visits.filter(v => v.id === 'document');
    const docLeaveT = docVisits.length ? docVisits[docVisits.length - 1].t : null;
    const docGhost = g({name: 'doc-left', opacity: 0},
      h('path', {d: roundRectPath(B.document.x - 6, B.document.y - 6, B.document.w + 12, B.document.h + 12, 10), fill: 'none', stroke: jurColor(ctx, sample.key).c, 'stroke-width': 3.5, 'stroke-dasharray': '10 8'}));

    // marker: a miniature of the traced document (its emblem is the declared jurisdiction).
    // While it is on the traced document it slips UNDER it (a second copy drawn below the
    // document): it never covers the document's text; the document swells meanwhile.
    const marker = name => g({name, opacity: 0},
      h('circle', {r: 40, fill: jurColor(ctx, sample.key).c, opacity: 0.18}),
      h('path', {d: roundRectPath(-22, -29, 44, 58, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}),
      emblem(ctx, {key: sample.key, s: 22, x: 8, y: -15}),
      h('rect', {x: -15, y: 2, width: 30, height: 4, rx: 2, fill: th.paperLine}),
      h('rect', {x: -15, y: 11, width: 24, height: 4, rx: 2, fill: th.paperLine}));
    const tracer = marker('tracer');
    const tracerBack = marker('tracer-back');

    // the declaration strip of the traced document (world units, unswollen)
    // (its border may be grazed; the caption and the name inside it may not be covered)
    const declBox = {x: B.document.x + sheet.declText.x, y: B.document.y + sheet.declText.y, w: sheet.declText.w, h: sheet.declText.h};
    return {M, PL, B, declBox, sample, art, F, trays, labels, graph, conns, relLabels, outletsLand, route, rels, tracer, tracerBack, legend, cen, amp, sheet, arrivalScale, lastId, docLeaveT, docGhost};
  },
  build(ctx, L) {
    return g(null,
      L.graph.node,
      L.docGhost,
      L.tracerBack,
      IDS.map(id => g({name: `el-${id}`}, L.art[id])),
      L.relLabels.map(x => x.node),
      IDS.map(id => L.labels[id] && L.labels[id].node),
      L.tracer,
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const fc = L.cen('filter');

    // --- separate: the parts come out of the filter housing
    const outP = {};
    IDS.forEach((id, i) => {
      if (id === 'filter') { outP[id] = 1; return; }
      const q = ease.outCubic(seg(u, W.out[0] + i * 0.012, W.out[1] - (IDS.length - 1 - i) * 0.006));
      outP[id] = q;
    });

    // --- relate: connectors drawn one by one in the supplied order
    const nRel = L.rels.length;
    const relP = i => {
      const span = (W.relate[1] - W.relate[0]) / nRel;
      return ease.inOutCubic(seg(u, W.relate[0] + i * span, W.relate[0] + (i + 0.85) * span));
    };
    Object.assign(nodes, L.graph.frame(relP));
    L.relLabels.forEach((x, i) => { nodes[x.name] = {opacity: r(clamp((relP(x.i) - 0.55) / 0.45), 3)}; });

    // --- trace: marker along the traversal route, resting inside the filter
    const visits = L.route.visits;
    const fVisit = visits.find(v => v.id === 'filter');
    const [t0, t1] = W.trace;
    const dwell = fVisit ? DWELL : 0;
    let tt; // arc fraction
    let atFilter = 0;
    if (u <= t0) tt = 0;
    else if (!fVisit) tt = ease.inOutSine(seg(u, t0, t1));
    else {
      const tf = fVisit.t;
      // the comparison beat keeps its time whatever the lengths of the connectors
      const uArrive = FILTER_AT;
      const uLeave = uArrive + dwell;
      if (u < uArrive) tt = tf * ease.inOutSine(seg(u, t0, uArrive));
      else if (u < uLeave) { tt = tf; atFilter = seg(u, uArrive, uLeave); }
      else tt = tf + (1 - tf) * ease.inOutSine(seg(u, uLeave, t1));
    }
    const tp = L.route.poly.at(tt);
    const arrive = seg(u, t1 - 0.03, t1);
    const handOver = seg(u, t1, t1 + 0.012);
    const tracerOn = u > t0 - 0.005 && handOver < 1;
    const tScale = 1 + (L.arrivalScale - 1) * ease.inOutCubic(arrive);
    const tracerOp = tracerOn ? r(clamp((u - t0 + 0.005) / 0.02), 3) : 0;

    // the traced document has left its source position once the marker moves on from it
    const docLeft = L.docLeaveT === null || !tracerOn && u < t1 ? 0 : clamp((tt - L.docLeaveT) / 0.04);
    // visited ids so far and swell of the element under the marker
    const visited = visits.filter(v => tt >= v.t - 1e-6).map(v => v.id);
    const swell = {};
    for (const id of IDS) swell[id] = 0;
    if (tracerOn && u < t1 + 0.02) {
      for (const v of visits) {
        const d = Math.abs(tt - v.t);
        const near = clamp(1 - d / 0.06);
        swell[v.id] = Math.max(swell[v.id], ease.inOutSine(near));
      }
      if (fVisit && atFilter > 0) swell.filter = 1;
    }
    // comparison inside the filter: read → compare → blade
    const cmpBase = fVisit ? FILTER_AT : 2;
    const readIn = seg(u, cmpBase, cmpBase + dwell * 0.3);
    const glyph = seg(u, cmpBase + dwell * 0.25, cmpBase + dwell * 0.45);
    const bladeP = ease.inOutCubic(seg(u, cmpBase + dwell * 0.45, cmpBase + dwell * 0.85));
    Object.assign(nodes, L.F.frame({read: readIn, glyph, blade: bladeP}));

    for (const id of IDS) {
      const c = L.cen(id);
      const q = outP[id];
      const s0 = 0.55;
      const dx = (fc.x - c.x) * (1 - q), dy = (fc.y - c.y) * (1 - q);
      const sc = (s0 + (1 - s0) * q) * (1 + L.amp(id) * swell[id]);
      const dim = id === 'document' ? 1 - 0.6 * docLeft : 1;
      nodes[`el-${id}`] = {transform: `${T(dx, dy)} ${scaleAbout(c.x, c.y, sc)}`, opacity: id === 'filter' ? 1 : r(clamp(q * 3) * dim, 3)};
    }
    nodes['doc-left'] = {opacity: r(docLeft, 3)};
    // on the traced document the marker is drawn under it: from the moment the marker (with
    // its glow) touches the sheet, the copy below the document is shown instead — the part
    // outside the sheet stays visible, so it slides under the edge without a jump and never
    // covers the document's text
    const dc = L.cen('document');
    const dsc = (0.55 + 0.45 * outP.document) * (1 + L.amp('document') * swell.document);
    const ddx = (fc.x - dc.x) * (1 - outP.document), ddy = (fc.y - dc.y) * (1 - outP.document);
    const halo = 41 * tScale;
    const under = tracerOn && Math.abs(tp.x - (dc.x + ddx)) < L.B.document.w / 2 * dsc + halo && Math.abs(tp.y - (dc.y + ddy)) < L.B.document.h / 2 * dsc + halo ? 1 : 0;
    nodes.tracer = {transform: T(tp.x, tp.y, 0, tScale), opacity: r(tracerOp * (1 - under), 3)};
    nodes['tracer-back'] = {transform: T(tp.x, tp.y, 0, tScale), opacity: r(tracerOp * under, 3)};
    const labP = r(seg(u, ...W.labels), 3);
    for (const id of IDS) if (L.labels[id]) nodes[`lab-${id}`] = {opacity: labP};
    if (L.legend) nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    // the traced document arrives in its tray at the end of the route
    const last = p.traversalOrder[p.traversalOrder.length - 1];
    for (const id of ['relevant', 'other']) Object.assign(nodes, L.trays[id].frame(id === last && u >= t1 ? 1 : 0));

    // --- semantics
    const anchored = L.conns.every(x => onEdge(x.c.from, L.graph, x.orig.from, L) && onEdge(x.c.to, L.graph, x.orig.to, L));
    const semantic = {
      beat: u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather',
      separated: r(Math.min(...IDS.filter(id => id !== 'filter').map(id => outP[id])), 3),
      relationsDrawn: L.rels.map((_, i) => r(relP(i), 3)),
      relationKinds: L.rels.map(x => x.kind),
      anchoredEnds: anchored,
      tracer: {x: r(tp.x), y: r(tp.y)},
      tracerVisible: tracerOn,
      visitOrder: visits.map(v => v.id),
      visited,
      focus: p.focusElement,
      focusScale: r(1 + L.amp(p.focusElement) * swell[p.focusElement], 3),
      readSlot: r(readIn, 3),
      comparison: glyph > 0.5 ? (L.sample.relevant ? 'same' : 'different') : null,
      blade: r(bladeP, 3),
      bladeTo: L.sample.relevant ? 'relevant' : 'other',
      readBeforeBlade: !(bladeP > 0 && readIn < 1),
      sample: L.sample.id,
      arrivedIn: u >= t1 ? last : null,
      inFilter: atFilter > 0 && atFilter < 1,
      sourceLeft: r(docLeft, 3),
      outletsLand: L.outletsLand,
      filterDwell: fVisit ? [FILTER_AT, r(FILTER_AT + dwell, 4)] : null,
      // every relation caption found a place beside its connector (none sits on its line)
      relLabelsBeside: L.relLabels.every(x => !x.fallback),
      // the marker never covers the traced document's declared jurisdiction while it is there
      tracerUnderDocument: r(under, 3),
      tracerClearOfDeclaration: !tracerOn || docLeft >= 1 || under >= 1 || !(tp.x + 22 * tScale > L.declBox.x && tp.x - 22 * tScale < L.declBox.x + L.declBox.w && tp.y + 29 * tScale > L.declBox.y && tp.y - 29 * tScale < L.declBox.y + L.declBox.h),
    };
    return {nodes, semantic};
  },
};

/**
 * Relation captions placed beside their connector: candidate points along the
 * middle of the line, both sides, growing distance; the chip must clear the
 * obstacles, the connector bands and the captions already placed. The cheapest
 * (short leader, near the middle, full size) wins; a dashed leader joins it to
 * the line when it is not right next to it.
 */
function placeRelLabels(ctx, conns, relationLabels, obstacles, bands, bounds, chipMax) {
  const th = ctx.theme;
  const placed = [];
  const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
  return conns.map((x, i) => {
    const rel = x.orig;
    const text = rel.label || relationLabels[rel.kind] || rel.kind;
    const color = kindColor(ctx, rel.kind);
    const variants = [{size: 24, mw: chipMax, ml: 2, pen: 0}, {size: 22, mw: chipMax * 0.8, ml: 3, pen: 50}, {size: 22, mw: chipMax * 0.64, ml: 3, pen: 90}];
    let best = null;
    variants.forEach(v => {
      const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: v.mw, size: v.size, maxLines: v.ml, weight: 600});
      // a narrower caption is only used when no word has to be broken
      if (probe.fit.truncated || probe.fit.midWord) return;
      const cw = probe.box.w, chh = probe.box.h;
      for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
        const q = x.c.at(t), qa = x.c.at(Math.max(0, t - 0.02)), qb = x.c.at(Math.min(1, t + 0.02));
        const L = Math.hypot(qb.x - qa.x, qb.y - qa.y) || 1;
        const n = {x: -(qb.y - qa.y) / L, y: (qb.x - qa.x) / L};
        for (let d = 20; d <= 320; d += 10) {
          // along the line's normal, then (a little dearer) straight left/right or above/below
          // the line point, so a caption can also sit in a corner beside a slanted connector
          const dirs = [[n.x, n.y, 0], [-n.x, -n.y, 0], [1, 0, 12], [-1, 0, 12], [0, 1, 12], [0, -1, 12]];
          for (const [dx, dy, extra] of dirs) {
            // distance d from the line point to the nearest point of the chip
            const ext = Math.abs(dx) * cw / 2 + Math.abs(dy) * chh / 2;
            const c = {x: q.x + dx * (d + ext), y: q.y + dy * (d + ext)};
            const b = {x: c.x - cw / 2, y: c.y - chh / 2, w: cw, h: chh};
            const cost = d + Math.abs(t - 0.5) * 120 + v.pen + extra;
            if (best && cost >= best.cost) continue;
            if (!inside(b)) continue;
            if (obstacles.some(o => overlapBox(b, o, 6)) || placed.some(o => overlapBox(b, o, 10)) || bands.some(o => overlapBox(b, o, 0))) continue;
            best = {cost, b, v, q, c};
          }
        }
      }
    });
    const name = `rlab${i}`;
    if (!best) {
      // last resort: a small single-line chip at the middle of the line
      const q = x.c.mid;
      const cc = chip(ctx, text, {x: q.x, y: q.y - 14, anchor: 'middle', maxWidth: chipMax, size: 20, maxLines: 2, fill: th.card, stroke: color, weight: 600});
      placed.push(cc.box);
      return {i, name, box: cc.box, fallback: true, node: g({name, opacity: 0}, cc.node)};
    }
    const cc = chip(ctx, text, {x: best.c.x, y: best.b.y, anchor: 'middle', maxWidth: best.v.mw, size: best.v.size, maxLines: best.v.ml, fill: th.card, stroke: color, weight: 600});
    placed.push(cc.box);
    const lead = h('line', {x1: r(best.q.x), y1: r(best.q.y), x2: r(best.c.x), y2: r(best.c.y), stroke: color, 'stroke-width': 2, 'stroke-dasharray': '3 5'});
    return {i, name, box: cc.box, node: g({name, opacity: 0}, lead, cc.node)};
  });
}

/** Part box `b` of an element centred at c, as it is when the element swells by k (+2 margin). */
function swollenAbout(b, c, k) {
  const s = 1 + k;
  return {x: c.x + (b.x - c.x) * s - 2, y: c.y + (b.y - c.y) * s - 2, w: b.w * s + 4, h: b.h * s + 4};
}

/** Box grown by the element's swell (scaled about its centre) plus a 2-unit margin. */
function swollen(bx, k) {
  return {x: bx.x - bx.w * k / 2 - 2, y: bx.y - bx.h * k / 2 - 2, w: bx.w * (1 + k) + 4, h: bx.h * (1 + k) + 4};
}

function overlapBox(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Is a connector end on the (swell-inflated) edge band of its element? */
function onEdge(pt, graph, id, L) {
  const bx = L.B[id];
  const k = L.amp(id);
  const x0 = bx.x - bx.w * k / 2 - 2, y0 = bx.y - bx.h * k / 2 - 2, x1 = bx.x + bx.w * (1 + k / 2) + 2, y1 = bx.y + bx.h * (1 + k / 2) + 2;
  const dx = Math.max(x0 - pt.x, 0, pt.x - x1), dy = Math.max(y0 - pt.y, 0, pt.y - y1);
  const outside = Math.hypot(dx, dy);
  return outside <= 16;
}

/**
 * Filter housing: KEY slot (card), READ slot (document), comparison window
 * ("=" / "≠") and a switch blade in front of two outlets. Drawn in world
 * coordinates inside `box`. fork 'right': outlets on the right edge (relevant
 * upper, other lower); 'down': outlets on the bottom edge (relevant left).
 */
function filterDevice(ctx, {box, fork, relKey, docKey}) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = box;
  const cx = x + w / 2;
  const winY = y + hh * 0.3;
  const slotR = Math.min(w, hh) * 0.12;
  const keyC = {x: cx - w * 0.24, y: winY};
  const readC = {x: cx + w * 0.24, y: winY};
  const glyphC = {x: cx, y: winY};
  // the blade stays below the window captions whichever outlet it points to
  const pivot = fork === 'right' ? {x: x + w * 0.5, y: y + hh * 0.8} : {x: cx, y: y + hh * 0.7};
  // outlets far apart, so each outlet connector keeps room for its caption beside it
  const outA = fork === 'right' ? {x: x + w, y: y + hh * 0.66} : {x: x + w * 0.2, y: y + hh};
  const outB = fork === 'right' ? {x: x + w, y: y + hh * 0.88} : {x: x + w * 0.76, y: y + hh};
  const bladeLen = fork === 'right' ? w * 0.36 : hh * 0.24;
  const ang = q => Math.atan2(q.y - pivot.y, q.x - pivot.x) * 180 / Math.PI;
  const angA = ang(outA), angB = ang(outB);
  const relevantDoc = docKey === relKey;
  // outlet ports carry their rule as a text-free glyph: "=" key (relevant) / "≠" key (other)
  const outlet = (q, same) => g(null,
    fork === 'right'
      ? h('path', {d: roundRectPath(q.x - 14, q.y - 22, 28, 44, 6), fill: '#2b3137', stroke: th.ink, 'stroke-width': 2})
      : h('path', {d: roundRectPath(q.x - 26, q.y - 14, 52, 28, 6), fill: '#2b3137', stroke: th.ink, 'stroke-width': 2}),
    relGlyph(ctx, {same, x: q.x, y: q.y, s: 17, color: '#ffffff'}));
  const node = g(null,
    h('path', {d: roundRectPath(x + 8, y + 12, w, hh, 28), fill: th.shadow}),
    h('path', {d: roundRectPath(x, y, w, hh, 28), fill: '#e9edf1', stroke: th.ink, 'stroke-width': th.stroke * 1.1}),
    // intake on the left edge (the document enters here)
    h('path', {d: roundRectPath(x - 12, y + hh * 0.5 - 30, 24, 60, 6), fill: '#2b3137', stroke: th.ink, 'stroke-width': 2}),
    outlet(outA, true), outlet(outB, false),
    // comparison window
    h('path', {d: roundRectPath(x + w * 0.08, winY - slotR * 1.5, w * 0.84, slotR * 3, slotR * 0.8), fill: '#2b3137', stroke: th.ink, 'stroke-width': 2.5}),
    // key slot + card icon
    h('circle', {cx: keyC.x, cy: keyC.y, r: slotR, fill: '#3a434c', stroke: '#8fa0b0', 'stroke-width': 2}),
    emblem(ctx, {key: relKey, s: slotR * 1.45, x: keyC.x, y: keyC.y, stroke: '#ffffff'}),
    cardIcon(ctx, keyC.x, winY - slotR * 1.5 - 22),
    // read slot + document icon
    g({name: 'filt-empty'}, h('circle', {cx: readC.x, cy: readC.y, r: slotR, fill: '#3a434c', stroke: '#8fa0b0', 'stroke-width': 2, 'stroke-dasharray': '5 4'})),
    docIcon(ctx, readC.x, winY - slotR * 1.5 - 24),
    g({name: 'filt-read', opacity: 0}, h('circle', {cx: readC.x, cy: readC.y, r: slotR, fill: '#3a434c', stroke: jurColor(ctx, docKey).c, 'stroke-width': 3}),
      emblem(ctx, {key: docKey, s: slotR * 1.45, x: readC.x, y: readC.y, stroke: '#ffffff'})),
    g({name: 'filt-glyph', opacity: 0}, relGlyph(ctx, {same: relevantDoc, x: glyphC.x, y: glyphC.y, s: slotR * 1.2, color: relevantDoc ? '#ffffff' : '#ffd166'})),
    slotCaption(ctx, ctx.t.slotKey, keyC.x, winY + slotR * 1.5 + 8, w * 0.4),
    slotCaption(ctx, ctx.t.slotRead, readC.x, winY + slotR * 1.5 + 8, w * 0.4),
    // switch blade
    h('circle', {cx: pivot.x, cy: pivot.y, r: 12, fill: th.metal, stroke: th.ink, 'stroke-width': 2}),
    g({name: 'filt-blade', transform: T(pivot.x, pivot.y, angB)},
      h('line', {x1: 0, y1: 0, x2: bladeLen, y2: 0, stroke: th.ink, 'stroke-width': 15, 'stroke-linecap': 'round'}),
      h('line', {x1: 0, y1: 0, x2: bladeLen, y2: 0, stroke: th.accent3, 'stroke-width': 10, 'stroke-linecap': 'round'})),
    h('circle', {cx: pivot.x, cy: pivot.y, r: 7, fill: th.accent3, stroke: th.ink, 'stroke-width': 2}),
  );
  const target = relevantDoc ? angA : angB;
  const start = angB; // rests on the "other" outlet until a read says otherwise
  // outer mouths of the outlets and of the intake (where connectors attach)
  const mouth = q => (fork === 'right' ? {x: q.x + 14, y: q.y} : {x: q.x, y: q.y + 14});
  // reading bay: the marker rests here, below the window captions and clear of the blade
  const dwell = fork === 'right' ? {x: x + w * 0.2, y: y + hh * 0.78} : {x: x + w * 0.18, y: y + hh * 0.74};
  return {
    ports: {relevant: {at: mouth(outA)}, other: {at: mouth(outB)}},
    intake: {at: {x: x - 12, y: y + hh * 0.5}},
    dwell,
    node,
    frame: ({read, glyph, blade}) => ({
      'filt-read': {opacity: r(read, 3)},
      'filt-empty': {opacity: r(1 - read, 3)},
      'filt-glyph': {opacity: r(glyph, 3)},
      'filt-blade': {transform: T(pivot.x, pivot.y, start + (target - start) * blade)},
    }),
  };
}

function slotCaption(ctx, text, x, y, maxWidth) {
  if (!ctx.show('all') || !text) return null;
  const f = ctx.fit(text, {maxWidth, size: 20, minSize: 15, maxLines: 2, weight: 600});
  return textBlock(f, {x, y, anchor: 'middle', fill: ctx.theme.inkSoft});
}

function cardIcon(ctx, x, y) {
  const th = ctx.theme;
  return g({transform: T(x, y)},
    h('rect', {x: -18, y: -11, width: 36, height: 22, rx: 3, fill: '#fbf6e6', stroke: th.ink, 'stroke-width': 1.8}),
    h('line', {x1: -15, x2: 15, y1: -4, y2: -4, stroke: '#c8553d', 'stroke-width': 1.6}),
    h('line', {x1: -15, x2: 9, y1: 3, y2: 3, stroke: '#9fbfd6', 'stroke-width': 1.4}));
}

function docIcon(ctx, x, y) {
  const th = ctx.theme;
  return g({transform: T(x, y)},
    h('path', {d: 'M-12 -15H8L13 -10V15H-12Z', fill: th.paper, stroke: th.ink, 'stroke-width': 1.8, 'stroke-linejoin': 'round'}),
    h('line', {x1: -8, x2: 8, y1: -4, y2: -4, stroke: th.paperLine, 'stroke-width': 2}),
    h('line', {x1: -8, x2: 6, y1: 3, y2: 3, stroke: th.paperLine, 'stroke-width': 2}));
}

/**
 * Output tray: a rack plate ("=" / "≠" + key emblem) and the sources already
 * sorted there as face-out mini sheets; an incoming slot for the traced one.
 */
function outputTray(ctx, {prefix, box, docs, same, relKey, sampleKey}) {
  const th = ctx.theme;
  const {x, y, w, h: hh} = box;
  const ps = plateSize(40);
  const n = docs.length + 1;
  const bodyTop = y + ps.h + 14;
  const avail = hh - (bodyTop - y);
  const sw = Math.max(34, Math.min(w * 0.2, (w - 36) / n - 10, (avail - 28) / 1.35));
  const sh = sw * 1.35;
  const trayH = sh + 30;
  const trayY = y + hh - trayH;
  const used = n * (sw + 10) - 10;
  const x0 = x + (w - used) / 2;
  const parts = [
    h('path', {d: roundRectPath(x + 6, trayY + 10, w, trayH, 16), fill: th.shadow}),
    h('path', {d: roundRectPath(x, trayY, w, trayH, 16), fill: shade(th.wood, 0.25), stroke: th.ink, 'stroke-width': th.stroke}),
    h('path', {d: roundRectPath(x + 10, trayY + 10, w - 20, trayH - 20, 10), fill: shade(th.wood, -0.25)}),
    rulePlate(ctx, {name: `${prefix}-plate`, same, key: relKey, s: 40, x: x + ps.w / 2 + 6, y: trayY - ps.h - 8, strap: false}),
  ];
  const slotX = i => x0 + i * (sw + 10);
  const slotY = trayY + 12;
  docs.forEach((d, i) => parts.push(g({transform: T(slotX(i), slotY)},
    h('rect', {width: sw, height: sh, rx: 4, fill: th.paper, stroke: th.ink, 'stroke-width': 1.8}),
    emblem(ctx, {key: d.key, s: sw * 0.36, x: sw * 0.7, y: sw * 0.3}),
    h('rect', {x: sw * 0.12, y: sh * 0.5, width: sw * 0.72, height: Math.max(3, sw * 0.06), rx: 2, fill: th.paperLine}),
    h('rect', {x: sw * 0.12, y: sh * 0.66, width: sw * 0.5, height: Math.max(3, sw * 0.06), rx: 2, fill: th.paperLine}))));
  const inX = slotX(docs.length);
  const incoming = g({name: `${prefix}-in`, opacity: 0, transform: T(inX, slotY)},
    h('rect', {x: -5, y: -5, width: sw + 10, height: sh + 10, rx: 7, fill: 'none', stroke: th.accent3, 'stroke-width': 3.5}),
    h('path', {d: roundRectPath(0, 0, sw, sh, 4), fill: th.paper, stroke: th.ink, 'stroke-width': 2.2}),
    emblem(ctx, {key: sampleKey, s: sw * 0.36, x: sw * 0.7, y: sw * 0.3}),
    h('rect', {x: sw * 0.12, y: sh * 0.5, width: sw * 0.72, height: Math.max(3, sw * 0.06), rx: 2, fill: th.paperLine}),
    h('rect', {x: sw * 0.12, y: sh * 0.66, width: sw * 0.5, height: Math.max(3, sw * 0.06), rx: 2, fill: th.paperLine}),
  );
  return {
    // the drawn tray body (connectors land on it) and its plate
    tight: {x, y: trayY, w, h: trayH},
    plate: {x: x + 6, y: trayY - ps.h - 8, w: ps.w, h: ps.h},
    node: g(null, parts, incoming),
    frame: q => ({[`${prefix}-in`]: {opacity: r(q, 3)}}),
    inAt: {x: inX + sw / 2, y: slotY + sh / 2},
    sheet: {w: sw, h: sh},
  };
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-08-mechanism',
    title: 'Jurisdiction check — anatomy of the filter',
    titleEs: 'Comprobación de jurisdicción — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Comprobación de jurisdicción',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view laid out as a fork: library, source document, research card, the filter housing and two output trays. Connectors are anchored to element edges and styled by kind (relation, communication, sequence). A marker shaped like the traced document follows the supplied order; inside the enlarged filter the declared emblem drops into the READ slot next to the card\'s KEY, the window shows = or ≠, and only then the blade turns to the matching outlet. Fictional; no jurisdiction is decided.',
    tags: ['jurisdiction', 'filter', 'mechanism', 'exploded view', 'comparator', 'research card', 'library', 'fork', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/comprobacion-de-jurisdiccion.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
