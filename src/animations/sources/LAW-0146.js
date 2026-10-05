/**
 * LAW-0146 — Delegación normativa · mechanism
 *
 * Storyboard — an exploded "who refers to whom" diagram (brief beats in brackets):
 *  [0.00–0.18] separate: the bound volume (the enabling document) and the
 *              instrument move apart to opposite sides; the enabling passage
 *              peels out of the book and the instrument's basis clause peels
 *              out of the sheet, each as a paper slip that settles below its
 *              text; the editable hierarchy board and the attributed reading
 *              card take their places between them.
 *  [0.18–0.43] relate: only the explicit relationships are drawn, each with
 *              its kind (plain relation = no arrowhead; communication =
 *              dashed with an arrow; causal only when the author supplies it).
 *              The relation "reference clause → enabling passage" is the gold
 *              link cord of the motif: its clip end is laid across to the
 *              passage slip. Every connector ends on the edge of its element.
 *  [0.43–0.75] trace: a small lens follows the supplied traversal order along
 *              the connectors; each element it reaches is picked out, the
 *              linked phrases are highlighted as it passes, and the focus
 *              element enlarges (its connectors keep landing on it).
 *  [0.75–1.00] gather: origin (the two texts), transformation (the two linked
 *              phrases, the cord) and state (the tag on the cord shows the
 *              SUPPLIED link state) stay visible with a legend of connector
 *              kinds and the "as supplied · no conclusion drawn" key. The
 *              hierarchy is only displayed; no validity is stated.
 * @module animations/sources/LAW-0146
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {edgeAnchor, dist, mix, cubic, polyline} from '../../core/geometry.js';
import {mechanismFields, str, oneOf} from '../../schemas/fields.js';
import {chip, callout, LINK_STYLES} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, kitT, LINK_STATES, stateLabel, motifColors,
  fitWords, boundVolume, instrumentSheet, passageSlip, levelBoard, readingCard, linkCord, linkTag, bindingClip, lupa, placeFree, boxesOverlap, wordSafe,
} from './kits/delegacion-normativa.js';

const ID = 'LAW-0146';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {sep: [0.02, 0.16], slipsIn: [0.01, 0.05], relate: [0.19, 0.42], trace: [0.44, 0.74], tracerOut: [0.74, 0.77], flip: [0.76, 0.82], key: [0.8, 0.86], legend: [0.78, 0.84]};
const IDS = ['document', 'article', 'instrument', 'reference', 'hierarchy', 'reading'];

const baseMech = mechanismFields(IDS);
baseMech.relationships.items.properties.label = str('Short caption of this relationship shown on its connector (optional; the legend names the kind)', 40);
const sceneSchema = {
  ...sourcesFields,
  ...baseMech,
  linkState: oneOf('Link state supplied by the author, shown on the tag of the reference → passage cord at the end (never inferred)', LINK_STATES),
};
sceneSchema.elements.description = 'Captions of the components (the scene draws all six; ids are fixed): document = the bound volume (Text 1), article = its enabling passage pulled out as a slip, instrument = the instrument sheet, reference = its basis clause pulled out as a slip, hierarchy = editable hierarchy board, reading = attributed reading card (array replaces the previous value)';

const defaultParams = {
  ...SOURCES_DEFAULTS,
  elements: [
    {id: 'document', label: 'Enabling document'},
    {id: 'article', label: 'Enabling passage'},
    {id: 'instrument', label: 'Instrument'},
    {id: 'reference', label: 'Reference clause'},
    {id: 'hierarchy', label: 'Editable hierarchy'},
    {id: 'reading', label: 'Attributed reading'},
  ],
  relationships: [
    {from: 'document', to: 'article', kind: 'relation', label: 'contains'},
    {from: 'instrument', to: 'reference', kind: 'relation', label: 'contains'},
    {from: 'reference', to: 'article', kind: 'relation', label: 'refers to'},
    {from: 'hierarchy', to: 'document', kind: 'relation', label: 'placed as supplied'},
    {from: 'hierarchy', to: 'instrument', kind: 'relation', label: 'placed as supplied'},
    {from: 'reading', to: 'article', kind: 'communication', label: 'proposes a reading'},
  ],
  focusElement: 'article',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['instrument', 'reference', 'article', 'document', 'hierarchy'],
  linkState: 'authorization-supplied',
};

/** Component slots per shape (stage units ≈ px at 1080p). */
const SLOTS = {
  // row 1: document | hierarchy board | instrument | legend; row 2: reading → passage slip — cord — clause slip
  landscape: {
    // (real gaps between book, board and sheet: their connectors have length and room for their labels)
    size: 24, fullSmall: true, doc: {cx: 340, pw: 146, ph: 300}, board: {x: 650, w: 340}, inst: {x: 1140, w: 256},
    reading: {x: 16, w: 250}, art: {x: 420, w: 350}, ref: {x: 1066, w: 380}, legend: {x: 1430, w: 254, row: 1},
    tagAt: 0.5, stageW: 1690, stageH: 800,
  },
  // row 1: document | board | instrument; row 2: passage slip — cord — clause slip; row 3: reading | legend
  square: {
    // the board keeps a real gap to the book and to the sheet (its connectors have length and room for
    // their labels); the reading card sits in the bottom row on the right, so its connector to the
    // passage slip runs diagonally across the open middle
    size: 28, fullSmall: true, doc: {cx: 108, pw: 80, ph: 170}, board: {x: 320, w: 440}, inst: {x: 796, w: 250}, instMinH: 170, boardFill: true, boardGap: 175, rowGap: 56,
    reading: {x: 16, w: 420, row: 3, right: true}, art: {x: 16, w: 400}, ref: {x: 730, w: 404}, legend: {x: 16, w: 400, row: 3, cols: 1}, keyRight: false, keyUnderLegend: true, row3Gap: 76, reserveBottom: 16,
    variants: [{}, {keyUnderLegend: false, keyRight: true, reserveBottom: 30}, {reading: {x: 16, w: 480, row: 3, right: true}, legend: {x: 16, w: 440, row: 3, cols: 1}}],
    tagAt: 0.5, stageW: 1150, stageH: 960,
  },
  // two columns: document, board and instrument on the left; reading, passage slip, cord and
  // clause slip on the right (the cord runs down the right column)
  portrait: {
    // (a real gap between the columns: the "contains" connectors have length and room for their labels)
    size: 23, fullSmall: true, doc: {cx: 190, cy: 210, pw: 148, ph: 300}, inst: {x: 22, w: 338},
    board: {x: 22, w: 338}, art: {x: 530, w: 402}, ref: {x: 530, w: 402},
    reading: {x: 530, y: 16, w: 402}, legend: {x: 22, w: 360}, tagAt: 0.5, stageW: 950, stageH: 1420,
  },
};

const center = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});
/** Whether segments a1-a2 and b1-b2 properly cross. */
const segCross = (a1, a2, b1, b2) => {
  const o = (p, q, r2) => Math.sign((q.x - p.x) * (r2.y - p.y) - (q.y - p.y) * (r2.x - p.x));
  return o(a1, a2, b1) * o(a1, a2, b2) < 0 && o(b1, b2, a1) * o(b1, b2, a2) < 0;
};
const scaleBox = (b, k) => ({x: b.x + (b.w * (1 - k)) / 2, y: b.y + (b.h * (1 - k)) / 2, w: b.w * k, h: b.h * k});

const scene = {
  sizes: {landscape: [1690, 800], square: [950, 800], portrait: [950, 1420]},
  layout(ctx0) {
    // whole-word wrapping (no word split across lines; punctuation stays with its word)
    const ctx = wordSafe(ctx0);
    const p = ctx.params;
    const th = ctx.theme;
    const t = kitT(ctx);
    const C = motifColors(ctx);
    const shape = ctx.view.shape;
    const S0 = SLOTS[shape];
    const S = S0;
    const size = S.size;
    // small print (relation labels, legend, slip ids, tag): full size where the frame is tight (1:1)
    const lk = S0.fullSmall ? 1 : 0.92, legK = S0.fullSmall ? 1 : 0.9;
    const tagW = S0.fullSmall ? 240 : 210, tagMinK = S0.fullSmall ? 1 : 0.9;
    const label = id => (p.elements.find(e => e.id === id) || {label: ''}).label;
    // --- components and positions (stage units). The texts' titles are printed once, on the
    // slips' headings; the book and the sheet are drawn quiet (their wording as bars). When long
    // wording makes the diagram tall, it is also widened (slips, board and card get wider and need
    // fewer lines) — the arrangement giving the largest uniform scale is kept.
    // the legend lists only the kinds of connector that are actually drawn (the cord is a plain relation)
    const kinds = ['relation', 'communication', 'sequence', 'causal'].filter(k => p.relationships.some(q => q.kind === k && q.from !== q.to));
    const arrange = (f, over = {}) => {
      const S = {...S0, ...over};
      const X = v => v * f;
      // quiet texts (their wording is drawn as bars; the slips carry it): small bar size, legible id tabs
      const qs = 15;
      const bk = boundVolume(ctx, {prefix: 'm-book', pw: S.doc.pw, ph: S.doc.ph, color: C.book, src: p.sources[0], passage: {text: p.passages[0].text, tension: p.passages[0].phrase}, passageAt: 0.5, size: qs, idMin: size, seedKey: 'dn-mech-book', maxPre: 2, maxPost: 2, quiet: true, titleBars: true, slotLines: 2, ribbon: false});
      const inst = instrumentSheet(ctx, {prefix: 'm-inst', w: S.inst.w, h: S.instMinH ?? 230, color: C.inst, src: p.sources[1], passage: p.passages[1], size: qs, idMin: size, eyelet: {side: 'left'}, seedKey: 'dn-mech-inst', quiet: true, titleBars: true, slotLines: 2, maxPre: 2, maxPost: 2});
      const art = passageSlip(ctx, {prefix: 'm-art', w: X(S.art.w), color: C.book, src: p.sources[0], passage: p.passages[0], size, idSize: size * (S0.fullSmall ? 1 : 0.9), heading: `${p.sources[0].title} · § ${p.sources[0].provision}`});
      const ref = passageSlip(ctx, {prefix: 'm-ref', w: X(S.ref.w), color: C.inst, src: p.sources[1], passage: p.passages[1], size, idSize: size * (S0.fullSmall ? 1 : 0.9), heading: `${p.sources[1].title} · ${p.sources[1].provision}`});
      const boardW = S.boardFill ? (S.stageW * f - 16 - S.inst.w) - (S.boardGap ?? 30) * Math.sqrt(f) - (X(S.doc.cx) + S.doc.pw + 14 + (S.boardGap ?? 30) * Math.sqrt(f)) : X(S.board.w);
      const board = levelBoard(ctx, {prefix: 'm-board', w: boardW, hier: p.hierarchy, ids: p.sources.map(q => q.id), colors: C.src, header: label('hierarchy') || t.hierarchy, size: size * 1.1, fitRows: true, stackTokens: true});
      let reading = p.interpretations.length ? readingCard(ctx, {prefix: 'm-read', w: X(S.reading.w), interp: p.interpretations[0], size: size * 1.08, heading: label('reading') || t.readingProposed, roomy: true}) : null;
      const legW = X(S.legend.w);
      // two columns when the legend is wide (a 2 × 2 key is half as tall)
      const legCols = S.legend.cols ?? 1;
      const colW = legW / legCols;
      const legRows = kinds.map(k => ({k, fit: fitWords(ctx, p.relationLabels[k], {maxWidth: colW - 86, size: size * legK, minSize: size * legK * (S0.fullSmall ? 0.97 : 0.83), maxLines: 3, weight: 500})}));
      const rowHs = [];
      legRows.forEach((q, i) => { const ri = Math.floor(i / legCols); rowHs[ri] = Math.max(rowHs[ri] ?? 0, Math.max(q.fit.height, size) + 10); });
      const legH = rowHs.reduce((a2, v) => a2 + v, 0) + 16;
      // each component carries its supplied caption directly under it (part of its footprint)
      const widthOf = {document: bk.outer.w, instrument: inst.w, hierarchy: board.w, reading: reading ? reading.w : 0, article: art.w, reference: ref.w};
      const capGap = {document: 12, instrument: 10, hierarchy: 10, reading: 10, article: 6, reference: 6};
      const capFits = {};
      // (the board and the reading card print their captions as their own headings)
      for (const id of IDS) {
        const text = label(id);
        if (!ctx.show('all') || !text || !widthOf[id] || id === 'hierarchy' || id === 'reading') continue;
        capFits[id] = chip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: Math.max(220, Math.min(widthOf[id] * (shape === 'portrait' && id === 'article' ? 0.78 : 1), 420)), size, minSize: size * 0.92, maxLines: 3, fill: th.card, stroke: th.inkSoft, name: `cap-${id}`, weight: 700});
      }
      const extra = id => (capFits[id] ? capGap[id] + capFits[id].box.h : 0);
      const boxes = {};
      let docC, legend, usedMid = false;
      if (shape === 'portrait') {
        const readH = reading ? reading.h : 0;
        docC = {x: X(S.doc.cx), y: 68 + bk.ph / 2 + 12};
        boxes.document = {x: docC.x + bk.outer.x, y: docC.y + bk.outer.y, w: bk.outer.w, h: bk.outer.h + extra('document')};
        if (reading) boxes.reading = {x: X(S.reading.x), y: S.reading.y, w: reading.w, h: readH + extra('reading')};
        boxes.hierarchy = {x: X(S.board.x), y: boxes.document.y + boxes.document.h + 70, w: board.w, h: board.h + extra('hierarchy')};
        boxes.instrument = {x: X(S.inst.x), y: boxes.hierarchy.y + boxes.hierarchy.h + 100, w: inst.w, h: inst.h + extra('instrument')};
        boxes.article = {x: X(S.art.x), y: Math.max(boxes.document.y + 40, (reading ? boxes.reading.y + boxes.reading.h : 0) + 90), w: art.w, h: art.h + extra('article')};
        boxes.reference = {x: X(S.ref.x), y: Math.max(boxes.instrument.y + 50, boxes.article.y + boxes.article.h + 300), w: ref.w, h: ref.h + extra('reference')};
        const low = Math.max(boxes.instrument.y + boxes.instrument.h, boxes.reference.y + boxes.reference.h);
        legend = {x: X(S.legend.x), y: low + 60, w: legW, h: legH};
      } else {
        docC = {x: X(S.doc.cx), y: 56 + bk.ph / 2 + 12};
        boxes.document = {x: docC.x + bk.outer.x, y: docC.y + bk.outer.y, w: bk.outer.w, h: bk.outer.h + extra('document')};
        boxes.instrument = {x: S.boardFill ? S.stageW * f - 16 - inst.w : X(S.inst.x), y: 56, w: inst.w, h: inst.h + extra('instrument')};
        boxes.hierarchy = {x: S.boardFill ? X(S.doc.cx) + S.doc.pw + 14 + (S.boardGap ?? 30) * Math.sqrt(f) : X(S.board.x), y: 16, w: board.w, h: board.h + extra('hierarchy')};
        if (S.legend.row === 1) legend = {x: X(S.legend.x), y: 56, w: legW, h: legH};
        const row1 = Math.max(boxes.document.y + boxes.document.h, boxes.instrument.y + boxes.instrument.h, boxes.hierarchy.y + boxes.hierarchy.h + 40, legend ? legend.y + legend.h : 0);
        const row2 = row1 + (S.rowGap ?? 60);
        boxes.article = {x: X(S.art.x), y: row2, w: art.w, h: art.h + extra('article')};
        boxes.reference = {x: X(S.ref.x), y: row2, w: ref.w, h: ref.h + extra('reference')};
        const row3 = Math.max(boxes.article.y + boxes.article.h, boxes.reference.y + boxes.reference.h) + (S.row3Gap ?? 56);
        // (square) the reading card may sit in the middle column under the cord when there is room
        const midX = boxes.article.x + art.w + 30, midW = boxes.reference.x - 30 - midX;
        if (reading && S.reading.mid && midW >= 340) {
          usedMid = true;
          reading = readingCard(ctx, {prefix: 'm-read', w: midW, interp: p.interpretations[0], size: size * 1.08, heading: label('reading') || t.readingProposed, roomy: true});
          // below the tag that hangs from the middle of the cord
          const ca = center(boxes.article), cr = center(boxes.reference);
          const a1 = edgeAnchor(boxes.reference, ca, 6), a2 = edgeAnchor(boxes.article, cr, 6);
          const tagProbe = linkTag(ctx, {name: 'probe', w: tagW, minK: tagMinK, size, text: stateLabel(ctx, p.linkState), state: p.linkState, stringLen: 30});
          const ry = Math.max(row2 + (S.reading.midDy ?? 190), (a1.y + a2.y) / 2 + 30 + tagProbe.h + 30);
          boxes.reading = {x: midX, y: ry, w: reading.w, h: reading.h};
        } else if (reading) boxes.reading = {x: S.reading.right ? S.stageW * f - 16 - reading.w : X(S.reading.x), y: S.reading.row === 3 ? row3 : row2, w: reading.w, h: reading.h + extra('reading')};
        if (!legend) {
          legend = {x: X(S.legend.x), y: row3, w: legW, h: legH};
          if (boxes.reading && boxesOverlap(legend, {...boxes.reading, h: boxes.reading.h + 20}, 0)) legend.y = Math.max(legend.y, boxes.reading.y + boxes.reading.h + 30);
        }
      }
      for (const id of Object.keys(boxes)) if (capFits[id]) boxes[id].w = Math.max(boxes[id].w, capFits[id].box.w);
      const keyProbe = ctx.show('key') ? chip(ctx, t.keyNote, {x: 0, y: 0, anchor: 'start', maxWidth: Math.max(legW, 300), size, minSize: size * 0.9, maxLines: 2, weight: 600}) : null;
      const keyH = S.keyUnderLegend && keyProbe ? keyProbe.box.h + 16 : 0;
      const contentBottom = Math.max(...Object.values(boxes).map(q => q.y + q.h), legend.y + legend.h + keyH);
      const SW = S.stageW * f;
      const SH = Math.max(S.stageH, contentBottom + (S.reserveBottom ?? 64));
      return {bk, inst, art, ref, board, reading, legRows, legCols, rowHs, boxes, docC, legend, capFits, capGap, SW, SH, sc: S.reading.mid && reading && !usedMid ? 0 : Math.min(ctx.design.w / SW, ctx.design.h / SH)};
    };
    // alternative arrangements per shape (e.g. the square's reading card in the middle column or in
    // the bottom row); the one giving the largest uniform scale is kept
    const variants = S0.variants || [{}];
    let A = null;
    for (const over of variants) {
      let V = arrange(1, over);
      for (let f = 1.02; f <= 2; f += 0.02) {
        const B = arrange(f, over);
        if (B.sc > V.sc + 1e-3) V = B;
        // once the width limits the scale, wider only gets smaller
        if (ctx.design.w / B.SW < ctx.design.h / B.SH) break;
      }
      if (!A || V.sc > A.sc + 1e-3) A = {...V, over};
    }
    const SV = {...S0, ...A.over};
    const {bk, inst, art, ref, board, reading, legRows, legCols, rowHs, boxes, docC, legend, capFits, capGap, SW} = A;
    let SH = A.SH;
    const bookFinal = bk;
    // --- relationships (kinds as supplied; the reference ↔ passage relation is the cord)
    const rels = p.relationships.filter(q => boxes[q.from] && boxes[q.to] && q.from !== q.to);
    const isCord = q => q.kind === 'relation' && ((q.from === 'reference' && q.to === 'article') || (q.from === 'article' && q.to === 'reference'));
    const pads = q => ({a: 6, b: q.kind === 'relation' ? 6 : 12});
    // the cord ties to the slips themselves (not to their captions): the slip is the top part of its footprint
    const slipH = {article: art.h, reference: ref.h};
    const visOf = (id, bxs) => {
      const b = bxs[id];
      if (!slipH[id] || !boxes[id]) return b;
      const k = b.w / boxes[id].w;
      return {x: b.x, y: b.y, w: b.w, h: slipH[id] * k};
    };
    const cord = linkCord(ctx, {name: 'm-cord', width: 8});
    // (small enough that its body stays in the slip's margin: the jaw grips the edge, the wordings stay clear)
    const clip = bindingClip(ctx, {name: 'm-clip', s: 0.6});
    const geomAt = (q, bxs) => {
      const cordish = isCord(q);
      const A = cordish ? visOf(q.from, bxs) : bxs[q.from], B = cordish ? visOf(q.to, bxs) : bxs[q.to];
      const from = edgeAnchor(A, center(B), pads(q).a), to = edgeAnchor(B, center(A), pads(q).b);
      // (portrait) the cord runs down the slips' right margin, clear of the captions under the slips
      if (cordish && shape === 'portrait') { from.x = A.x + A.w * 0.9; to.x = B.x + B.w * 0.9; }
      if (cordish) {
        // the cord's geometry IS the drawn cord: from the knot to the clip's wire loop (just outside the
        // passage slip's edge), with its slack — the tag, the label and the tracer all follow this curve
        const dd = dist(from, to) || 1;
        const tie = {x: to.x + ((from.x - to.x) / dd) * clip.cordAt.x, y: to.y + ((from.y - to.y) / dd) * clip.cordAt.x};
        const sh = cord.shape(from, tie, dd * 1.04, 1);
        return {from, to: tie, c1: sh.c1, c2: sh.c2, edge: to};
      }
      const dx = to.x - from.x, dy = to.y - from.y;
      const bend = 0.12;
      const c1 = {x: from.x + dx * 0.3 - dy * bend, y: from.y + dy * 0.3 + dx * bend}, c2 = {x: from.x + dx * 0.7 - dy * bend, y: from.y + dy * 0.7 + dx * bend};
      return {from, to, c1, c2};
    };
    const finalGeo = rels.map(q => geomAt(q, boxes));
    // --- tag of the link state on the cord
    const cordIdx = rels.findIndex(isCord);
    const tag = linkTag(ctx, {name: 'm-tag', w: tagW, minK: tagMinK, size, text: stateLabel(ctx, p.linkState), state: p.linkState, stringLen: 30});
    let tagShift = {x: 0, y: 0}, tagP = null;
    // obstacle outlines include the index tabs and the ribbon (anchors use the objects' own edges)
    const uni = (a, b) => ({x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.max(a.x + a.w, b.x + b.w) - Math.min(a.x, b.x), h: Math.max(a.y + a.h, b.y + b.h) - Math.min(a.y, b.y)});
    const obsBox = id => id === 'document' ? uni(boxes.document, {x: docC.x + bk.bounds.x, y: docC.y + bk.bounds.y, w: bk.bounds.w, h: bk.bounds.h})
      : id === 'instrument' ? {x: boxes.instrument.x, y: boxes.instrument.y - 42, w: boxes.instrument.w + 8, h: boxes.instrument.h + 52} : boxes[id];
    const objBoxes = () => [...Object.keys(boxes).map(obsBox), legend];
    // connector corridors (boxes along each line)
    const corridor = gq => {
      const pts = Array.from({length: 13}, (_, i) => cubic(gq.from, gq.c1, gq.c2, gq.to, i / 12));
      return pts.slice(1).map((q, i) => ({x: Math.min(q.x, pts[i].x) - 5, y: Math.min(q.y, pts[i].y) - 5, w: Math.abs(q.x - pts[i].x) + 10, h: Math.abs(q.y - pts[i].y) + 10}));
    };
    const corrs = finalGeo.map(corridor);
    // (the tag hangs clear of the other connectors too: no line runs behind it)
    const lineBoxes = corrs.filter((_, i) => i !== cordIdx).flat();
    if (cordIdx >= 0) {
      const gq = finalGeo[cordIdx];
      tagP = cubic(gq.from, gq.c1, gq.c2, gq.to, S.tagAt);
      for (const dy of [0, 20, 40, 70, 100]) {
        const inStage = bx => bx.x >= 10 && bx.y >= 8 && bx.x + bx.w <= SW - 10 && bx.y + bx.h <= SH - 8;
        const sh = [0, -40, 40, -80, 80, -120, 120, -160, 160, -200, 200].map(dx => ({x: dx, y: dy})).find(q => inStage(tag.boxAt(tagP, {x: 0, y: 1}, q)) && ![...objBoxes(), ...lineBoxes].some(b => boxesOverlap(tag.boxAt(tagP, {x: 0, y: 1}, q), b, 10)));
        if (sh) { tagShift = sh; break; }
      }
    }
    const tagBox = tagP ? tag.boxAt(tagP, {x: 0, y: 1}, tagShift) : null;
    // --- element captions (supplied labels) next to their elements, clear of everything
    const obstacles = [...objBoxes(), tagBox].filter(Boolean);
    // connector corridors are obstacles for captions and relation labels
    corrs.forEach(cb => obstacles.push(...cb));
    const bounds = {x: 10, y: 8, w: SW - 20, h: SH - 16};
    // --- relation labels near the middle of their own connector (short leader when pushed aside)
    const relLabels = [];
    if (ctx.show('all')) {
      rels.forEach((q, i) => {
        const text = q.label || p.relationLabels[q.kind];
        const gq = finalGeo[i];
        const mid = cubic(gq.from, gq.c1, gq.c2, gq.to, isCord(q) ? 0.25 : 0.5);
        const make = qq => {
          const c = callout(ctx, {name: `rl${i}`, text, chipAt: qq.chipAt, anchor: qq.anchor, target: mid, maxWidth: qq.maxWidth, size: size * lk, maxLines: 3, color: kindColor(ctx, q.kind)});
          c.fit = ctx.fit(text, {maxWidth: qq.maxWidth - size * 1.1, size: size * lk, minSize: size * lk, maxLines: 3, weight: 600});
          return c;
        };
        const own = corrs[i];
        const obs = obstacles.filter(o => !own.includes(o));
        // on the connector itself first (centred on a point of its own line), then seated against it
        // (touching the line from below, above or a side) — a label never floats away on a long leader
        let got = null;
        const linePts = Array.from({length: 49}, (_, k) => cubic(gq.from, gq.c1, gq.c2, gq.to, k / 48));
        const tts = isCord(q) ? [0.22, 0.3, 0.15, 0.78, 0.85] : [0.5, 0.38, 0.62, 0.28, 0.72, 0.18, 0.82];
        const inBounds = bx => bx.x >= bounds.x && bx.y >= bounds.y && bx.x + bx.w <= bounds.x + bounds.w && bx.y + bx.h <= bounds.y + bounds.h;
        const seats = ['centre', 'below', 'above', 'right', 'left'];
        for (const seat of seats) {
          for (const tt of tts) {
            const pt = cubic(gq.from, gq.c1, gq.c2, gq.to, tt);
            for (const mw of [340, 260, 200, 160, 130, 115, 100]) {
              const c = chip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: size * lk, minSize: size * lk, maxLines: 3, fill: th.card, stroke: kindColor(ctx, q.kind), name: `rl${i}-chip`, weight: 600});
              const w = c.box.w, hh = c.box.h;
              const at = {centre: {x: pt.x - w / 2, y: pt.y - hh / 2}, below: {x: pt.x - w / 2, y: pt.y + 5}, above: {x: pt.x - w / 2, y: pt.y - 5 - hh},
                right: {x: pt.x + 5, y: pt.y - hh / 2}, left: {x: pt.x - 5 - w, y: pt.y - hh / 2}}[seat];
              const bx = {x: at.x, y: at.y, w, h: hh};
              // (never a narrower wrap that forces the words smaller)
              if (!inBounds(bx) || c.fit.truncated || c.fit.size < size * lk * 0.99 || c.fit.lines.slice(1).some(l => l.trim().length <= 2)) continue;
              if (obs.some(o => boxesOverlap(bx, o, 4))) continue;
              // a seated label must not sit on its own line further along either
              if (seat !== 'centre' && linePts.some(z => z.x > bx.x + 4 && z.x < bx.x + bx.w - 4 && z.y > bx.y + 4 && z.y < bx.y + bx.h - 4)) continue;
              const ch = chip(ctx, text, {x: at.x, y: at.y, anchor: 'start', maxWidth: mw, size: size * lk, minSize: size * lk, maxLines: 3, fill: th.card, stroke: kindColor(ctx, q.kind), name: `rl${i}-chip`, weight: 600});
              got = {node: g({name: `rl${i}`, opacity: 0}, ch.node), box: ch.box, fit: ch.fit, seat, frame: pp => ({[`rl${i}`]: {opacity: r(clamp(pp), 3)}})};
              break;
            }
            if (got) break;
          }
          if (got) break;
        }
        if (!got) got = placeFree(ctx, {text, target: mid, obstacles: obs, bounds, widths: [260, 200, 160], size: size * 0.86, make, goodEnough: 40, step: 12})
          || placeFree(ctx, {text, target: mid, obstacles: obs, bounds, widths: [260, 200], size: size * 0.86, make, noLeader: true, step: 12});
        if (got) { obstacles.push(got.box); relLabels.push({i, lab: got, mid}); }
      });
    }
    // captions: directly under their component (their room is part of its footprint)
    const vis = {
      document: {x: docC.x + bk.outer.x, y: docC.y + bk.outer.y, w: bk.outer.w, h: bk.outer.h},
      instrument: {x: boxes.instrument.x, y: boxes.instrument.y, w: inst.w, h: inst.h},
      hierarchy: {x: boxes.hierarchy.x, y: boxes.hierarchy.y, w: board.w, h: board.h},
      reading: reading ? {x: boxes.reading.x, y: boxes.reading.y, w: reading.w, h: reading.h} : null,
      article: {x: 0, y: 0, w: art.w, h: art.h},
      reference: {x: 0, y: 0, w: ref.w, h: ref.h},
    };
    const caps = {};
    for (const [id, cf] of Object.entries(capFits)) {
      const v = vis[id];
      caps[id] = chip(ctx, label(id), {x: v.x, y: v.y + v.h + capGap[id], anchor: 'start', maxWidth: Math.max(220, Math.min(v.w * (shape === 'portrait' && id === 'article' ? 0.78 : 1), 420)), size, minSize: size * 0.92, maxLines: 3, fill: th.card, stroke: th.inkSoft, name: `cap-${id}`, weight: 700});
      if (!['article', 'reference'].includes(id)) obstacles.push(caps[id].box);
    }
    // --- key and legend placement
    let key = null;
    if (ctx.show('key') && SV.keyRight) {
      const x0 = legend.x + legend.w + 24;
      key = chip(ctx, t.keyNote, {x: x0, y: legend.y, anchor: 'start', maxWidth: SW - 16 - x0, size, minSize: size * 0.9, maxLines: 3, fill: th.card, name: 'key-note', weight: 600});
      if (obstacles.some(o => boxesOverlap(key.box, o, 2)) || key.box.y + key.box.h > SH - 8 || key.fit.truncated) key = null;
    }
    if (ctx.show('key') && !key && SV.keyUnderLegend) {
      key = chip(ctx, t.keyNote, {x: legend.x, y: legend.y + legend.h + 14, anchor: 'start', maxWidth: legend.w, size, minSize: size * 0.9, maxLines: 3, fill: th.card, name: 'key-note', weight: 600});
      if (obstacles.some(o => boxesOverlap(key.box, o, 2)) || key.box.y + key.box.h > SH - 8 || key.fit.truncated) key = null;
    }
    if (ctx.show('key') && SV.keyMiddle && boxes.reading) {
      const x0 = boxes.reading.x + boxes.reading.w + 24;
      key = chip(ctx, t.keyNote, {x: x0, y: legend.y, anchor: 'start', maxWidth: legend.x - 24 - x0, size, minSize: size * 0.9, maxLines: 3, fill: th.card, name: 'key-note', weight: 600});
      if (obstacles.some(o => boxesOverlap(key.box, o, 2)) || key.box.y + key.box.h > SH - 8) key = null;
    }
    if (ctx.show('key') && !key) {
      key = placeFree(ctx, {target: {x: SW / 2, y: SH}, obstacles, bounds, widths: [440, 360, 300], size, noLeader: true, goodEnough: 1e9,
        make: q => chip(ctx, t.keyNote, {x: q.chipAt.x, y: q.chipAt.y, anchor: 'start', maxWidth: q.maxWidth, size, minSize: size * 0.9, maxLines: 2, fill: th.card, name: 'key-note', weight: 600})});
      if (!key) {
        // no free spot: a band is added under the diagram for the key
        const kc = chip(ctx, t.keyNote, {x: SW / 2, y: SH - 8, anchor: 'middle', maxWidth: Math.min(SW - 40, 700), size, minSize: size * 0.9, maxLines: 2, fill: th.card, name: 'key-note', weight: 600});
        SH += kc.box.h + 16;
        key = chip(ctx, t.keyNote, {x: SW / 2, y: SH - 16 - kc.box.h, anchor: 'middle', maxWidth: Math.min(SW - 40, 700), size, minSize: size * 0.9, maxLines: 2, fill: th.card, name: 'key-note', weight: 600});
      }
      if (key) obstacles.push(key.box);
    }
    // --- starting geometry for the separate beat: slips on their passages, texts drawn towards the middle
    const mid0 = {x: SW / 2, y: SH / 2};
    const start = {};
    for (const id of ['document', 'instrument', 'hierarchy', 'reading']) {
      if (!boxes[id]) continue;
      const c = center(boxes[id]);
      start[id] = {dx: (mid0.x - c.x) * 0.28, dy: (mid0.y - c.y) * 0.28, k: 1};
    }
    const docPass = {x: docC.x + bk.textBox.x, y: docC.y + bk.provBox.y, w: bk.textBox.w};
    const insPass = {x: boxes.instrument.x + inst.provBox.x, y: boxes.instrument.y + inst.provBox.y, w: inst.textBox.w};
    start.article = {x: docPass.x - (art.w * (docPass.w / art.w)) * 0.06, y: docPass.y, k: docPass.w / art.w, via: 'document'};
    start.reference = {x: insPass.x, y: insPass.y, k: insPass.w / ref.w, via: 'instrument'};
    // design units → px in the canonical 1080p frame
    const CAN = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[shape];
    const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const px = Math.min(CAN[0] * 0.88 / ctx.design.w, CAN[1] * 0.74 / ctx.design.h) * s;
    // --- the cord art
    const tracer = lupa(ctx, {name: 'tracer', R: 20, handleLen: 30, angle: 45});
    // review metrics: connector lengths and how each relation label sits against its own connector (px at 1080p)
    const curvePts = gq => Array.from({length: 49}, (_, k) => cubic(gq.from, gq.c1, gq.c2, gq.to, k / 48));
    const curveLen = gq => { const q = curvePts(gq); return q.slice(1).reduce((a2, z, k) => a2 + dist(z, q[k]), 0); };
    const gapTo = (b, pts) => Math.min(...pts.map(z => Math.hypot(Math.max(b.x - z.x, 0, z.x - b.x - b.w), Math.max(b.y - z.y, 0, z.y - b.y - b.h))));
    const segHitsBox = (a2, b2, bx) => Array.from({length: 40}, (_, k) => ({x: a2.x + (b2.x - a2.x) * (k + 0.5) / 40, y: a2.y + (b2.y - a2.y) * (k + 0.5) / 40}))
      .some(z => z.x > bx.x + 2 && z.x < bx.x + bx.w - 2 && z.y > bx.y + 2 && z.y < bx.y + bx.h - 2);
    const leaders = relLabels.filter(x => !x.lab.seat).map(x => {
      const b = x.lab.box;
      const f0 = {x: Math.max(b.x, Math.min(x.mid.x, b.x + b.w)), y: x.mid.y > b.y + b.h ? b.y + b.h : x.mid.y < b.y ? b.y : b.y + b.h / 2};
      if (f0.y === b.y + b.h / 2) f0.x = x.mid.x > b.x + b.w / 2 ? b.x + b.w : b.x;
      return {i: x.i, a: f0, b: x.mid};
    });
    const elemBoxes = [...Object.keys(boxes).map(id => id === 'article' || id === 'reference' ? boxes[id] : obsBox(id)), legend, key && key.box].filter(Boolean);
    const review = {
      connPx: finalGeo.map((gq, i) => (i === cordIdx ? null : Math.round(curveLen(gq) * px))).filter(v => v !== null),
      labelGapPx: relLabels.map(x => Math.round(gapTo(x.lab.box, curvePts(finalGeo[x.i])) * px)),
      tagOffLines: !tagBox || !lineBoxes.some(b => boxesOverlap(tagBox, b, 0)),
      leadersClear: leaders.every(l => !elemBoxes.some(bx => segHitsBox(l.a, l.b, bx))
        && !relLabels.some(x => x.i !== l.i && segHitsBox(l.a, l.b, x.lab.box))
        && !leaders.some(m => m.i !== l.i && segCross(l.a, l.b, m.a, m.b))),
    };
    return {review, SW, SH, s, ox: (ctx.design.w - SW * s) / 2, oy: (ctx.design.h - SH * s) / 2, px, shape, size,
      book: bk, docC, inst, art, ref, board, reading, boxes, rels, finalGeo, geomAt, isCord, cordIdx, tag, tagP, tagShift, tagBox,
      visOf, caps, relLabels, key, legend, legRows, legCols, rowHs, start, cord, clip, tracer};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const C = motifColors(ctx);
    const b = L.boxes;
    const cap = id => (L.caps[id] ? g({name: `capg-${id}`, opacity: 0}, L.caps[id].node) : null);
    const els = [
      g({name: 'el-hierarchy'}, g({transform: T(b.hierarchy.x, b.hierarchy.y)}, L.board.node), cap('hierarchy')),
      L.reading ? g({name: 'el-reading'}, g({transform: T(b.reading.x, b.reading.y)}, L.reading.node), cap('reading')) : null,
      g({name: 'el-document'}, g({transform: T(L.docC.x, L.docC.y)}, L.book.node), cap('document')),
      g({name: 'el-instrument'}, g({transform: T(b.instrument.x, b.instrument.y)}, L.inst.node), cap('instrument')),
      g({name: 'el-article', opacity: 0}, L.art.node, cap('article')),
      g({name: 'el-reference', opacity: 0}, L.ref.node, cap('reference')),
    ];
    const conns = L.rels.map((q, i) => {
      if (i === L.cordIdx) return null;
      const st = LINK_STYLES[q.kind] || LINK_STYLES.relation;
      const col = kindColor(ctx, q.kind);
      return g({name: `rel${i}`, opacity: 0},
        h('path', {name: `rel${i}-line`, fill: 'none', stroke: col, 'stroke-width': st.width + 0.5, 'stroke-linecap': 'round', 'stroke-dasharray': st.dash || undefined}),
        st.arrow ? h('path', {name: `rel${i}-head`, d: `M0 0L${r(-st.width * 4.2)} ${r(-st.width * 2.3)}L${r(-st.width * 3)} 0L${r(-st.width * 4.2)} ${r(st.width * 2.3)}Z`, fill: col, opacity: 0}) : null,
        st.endDots ? h('circle', {name: `rel${i}-dA`, r: st.width * 1.7, fill: col}) : null,
        st.endDots ? h('circle', {name: `rel${i}-dB`, r: st.width * 1.7, fill: col, opacity: 0}) : null);
    });
    // legend
    const lg = L.legend;
    const colW = lg.w / L.legCols;
    const legRows = L.legRows.map((q, i) => {
      const st = LINK_STYLES[q.k];
      const col = kindColor(ctx, q.k);
      const ri = Math.floor(i / L.legCols), ci = i % L.legCols;
      const y0 = lg.y + 14 + L.rowHs.slice(0, ri).reduce((a, v) => a + v, 0);
      const x0 = lg.x + ci * colW;
      const cy = y0 + (L.rowHs[ri] - 10) / 2;
      return g(null,
        h('line', {x1: x0 + 14, x2: x0 + 56, y1: r(cy), y2: r(cy), stroke: col, 'stroke-width': st.width + 0.5, 'stroke-dasharray': st.dash || undefined, 'stroke-linecap': 'round'}),
        st.arrow ? h('path', {d: `M${r(x0 + 60)} ${r(cy)}l-12 -6l3 6l-3 6Z`, fill: col}) : h('circle', {cx: r(x0 + 58), cy: r(cy), r: 4, fill: col}),
        ctx.show('all') ? h('text', {x: r(x0 + 72), y: r(cy - q.fit.height / 2 + q.fit.size * 0.8), 'font-size': r(q.fit.size), 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, q.fit.lines.map((ln, k) => h('tspan', {x: r(x0 + 72), dy: k ? r(q.fit.lineHeight) : 0}, ln))) : h('rect', {x: r(x0 + 72), y: r(cy - 3), width: 120, height: 6, rx: 3, fill: th.fgSoft, opacity: 0.5}));
    });
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      conns,
      L.cordIdx >= 0 ? [L.cord.node, L.cord.knot] : null,
      els,
      L.cordIdx >= 0 ? [L.tag.node, L.clip.node] : null,
      L.relLabels.map(x => x.lab.node),
      g({name: 'legend', opacity: 0}, legRows),
      L.key && L.key.node,
      L.tracer.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const sep = ease.inOutCubic(seg(u, ...W.sep));
    // --- element boxes over time (separate beat, focus enlargement)
    const order = p.traversalOrder.filter(id => L.boxes[id]);
    const trP = seg(u, ...W.trace);
    // tracer route through the final geometry (connectors followed when they link consecutive ids)
    const routePts = [];
    const visitsT = [];
    const at = (gq, tt) => cubic(gq.from, gq.c1, gq.c2, gq.to, tt);
    // legs between elements follow their connectors; at an element the tracer runs round its outline
    // (the shorter way) from where it arrived to where it leaves — never across its wording
    const legs = order.slice(1).map((id, k) => {
      const prev = order[k];
      const ri = L.rels.findIndex(q => (q.from === prev && q.to === id) || (q.from === id && q.to === prev));
      if (ri >= 0) {
        const gq = L.finalGeo[ri];
        const fwd = L.rels[ri].from === prev;
        return Array.from({length: 25}, (_, n) => at(gq, fwd ? n / 24 : 1 - n / 24));
      }
      const a = edgeAnchor(L.boxes[prev], center(L.boxes[id]), 6), b = edgeAnchor(L.boxes[id], center(L.boxes[prev]), 6);
      return [a, b];
    });
    const around = (b0, p0, p1) => {
      const b = {x: b0.x - 6, y: b0.y - 6, w: b0.w + 12, h: b0.h + 12};
      const per = 2 * (b.w + b.h);
      const par = q => {
        const dx = [Math.abs(q.y - b.y), Math.abs(q.x - (b.x + b.w)), Math.abs(q.y - (b.y + b.h)), Math.abs(q.x - b.x)];
        const e = dx.indexOf(Math.min(...dx));
        return e === 0 ? clamp(q.x - b.x, 0, b.w) : e === 1 ? b.w + clamp(q.y - b.y, 0, b.h) : e === 2 ? b.w + b.h + clamp(b.x + b.w - q.x, 0, b.w) : 2 * b.w + b.h + clamp(b.y + b.h - q.y, 0, b.h);
      };
      const ptAt = sp => {
        let v = ((sp % per) + per) % per;
        if (v <= b.w) return {x: b.x + v, y: b.y};
        v -= b.w; if (v <= b.h) return {x: b.x + b.w, y: b.y + v};
        v -= b.h; if (v <= b.w) return {x: b.x + b.w - v, y: b.y + b.h};
        v -= b.w; return {x: b.x, y: b.y + b.h - v};
      };
      const s0 = par(p0), s1 = par(p1);
      let d = s1 - s0;
      if (d > per / 2) d -= per; else if (d < -per / 2) d += per;
      const n = Math.max(2, Math.ceil(Math.abs(d) / 20));
      return Array.from({length: n + 1}, (_, i) => ptAt(s0 + (d * i) / n));
    };
    order.forEach((id, k) => {
      const inPt = k > 0 ? legs[k - 1][legs[k - 1].length - 1] : null;
      const outPt = k < legs.length ? legs[k][0] : null;
      if (k === 0) routePts.push(outPt || center(L.boxes[id]));
      else if (outPt) routePts.push(...around(L.boxes[id], inPt, outPt));
      visitsT.push(routePts.length - 1 - (k > 0 && outPt ? around(L.boxes[id], inPt, outPt).length - 1 : 0));
      if (k < legs.length) routePts.push(...legs[k]);
    });
    const poly = polyline(routePts);
    const cum = [0];
    for (let i = 1; i < routePts.length; i++) cum.push(cum[i - 1] + dist(routePts[i - 1], routePts[i]));
    const total = cum[cum.length - 1] || 1;
    const visitFrac = visitsT.map(ix => cum[ix] / total);
    const trE = ease.inOutSine(trP);
    const visited = order.filter((_, k) => trP > 0 && visitFrac[k] <= trE + 1e-9);
    const focus = p.focusElement;
    const fk = order.indexOf(focus);
    const focusReached = fk >= 0 && trP > 0 && visitFrac[fk] <= trE + 1e-9;
    const bump = focusReached ? Math.max(0, 1 - Math.abs(trE - visitFrac[fk]) / 0.12) : 0;
    const focusScale = focusReached ? 1 + 0.06 + 0.06 * bump : 1;
    const boxesT = {};
    for (const [id, b] of Object.entries(L.boxes)) boxesT[id] = id === focus ? scaleBox(b, focusScale) : b;
    // --- element transforms
    for (const id of ['document', 'instrument', 'hierarchy', 'reading']) {
      if (!L.boxes[id]) continue;
      const st = L.start[id];
      const k = id === focus ? focusScale : 1;
      const c = center(L.boxes[id]);
      const tx = st.dx * (1 - sep), ty = st.dy * (1 - sep);
      nodes[`el-${id}`] = {transform: k !== 1 ? `${T(tx + c.x, ty + c.y, 0, k)} translate(${r(-c.x)} ${r(-c.y)})` : T(tx, ty), opacity: id === 'hierarchy' || id === 'reading' ? r(Math.min(1, sep * 1.6), 3) : 1};
    }
    for (const id of ['article', 'reference']) {
      const st = L.start[id];
      const b = L.boxes[id];
      const via = L.start[st.via];
      const x0 = st.x + via.dx, y0 = st.y + via.dy;
      const x = lerp(x0, b.x, sep), y = lerp(y0, b.y, sep), k0 = lerp(st.k, 1, sep);
      const kf = id === focus ? focusScale : 1;
      const bb = scaleBox(b, kf);
      nodes[`el-${id}`] = {transform: kf !== 1 ? T(bb.x, bb.y, 0, kf) : T(x, y, 0, k0), opacity: r(seg(u, ...W.slipsIn), 3)};
    }
    // --- connectors (drawn in the relate beat, re-anchored to the moving focus)
    const n = L.rels.length;
    const drawn = L.rels.map((_, i) => {
      const a = W.relate[0] + ((W.relate[1] - W.relate[0]) * i) / Math.max(1, n);
      return ease.inOutCubic(seg(u, a, a + (W.relate[1] - W.relate[0]) / Math.max(1, n) * 1.4));
    });
    let landed = true;
    L.rels.forEach((q, i) => {
      const gq = L.geomAt(q, boxesT);
      const pd = drawn[i];
      const dA = L.isCord(q) ? 0 : dist(gq.from, edgeAnchor(boxesT[q.from], center(boxesT[q.to]), 6));
      if (dA > 1) landed = false;
      if (i === L.cordIdx) {
        // the cord's clip end is laid from the reference slip across to the passage slip
        // the clip's jaw travels to the passage slip's edge (E); the cord ties to its wire loop, just outside
        const E = mix(gq.from, gq.edge, pd);
        const ang = (Math.atan2(gq.from.y - gq.edge.y, gq.from.x - gq.edge.x) * 180) / Math.PI;
        const ux = Math.cos((ang * Math.PI) / 180), uy = Math.sin((ang * Math.PI) / 180);
        const tie = {x: E.x + ux * L.clip.cordAt.x, y: E.y + uy * L.clip.cordAt.x};
        const Lc = dist(gq.from, gq.edge) * 1.04;
        Object.assign(nodes, L.cord.frame(gq.from, pd > 0 ? tie : gq.from, Lc, 1).nodes);
        nodes['m-cord'] = {opacity: pd > 0 ? 1 : 0};
        nodes['m-cord-knot'] = {transform: T(gq.from.x, gq.from.y), opacity: pd > 0 ? 1 : 0};
        const chk = p.linkState === 'authorization-to-be-checked';
        const clipAt = E;
        nodes['m-clip'] = {transform: T(clipAt.x, clipAt.y, ang), opacity: pd > 0 ? 1 : 0};
        Object.assign(nodes, L.clip.frame(pd >= 1 ? (chk ? 1 : 0) : 1));
        const tp = cubic(gq.from, gq.c1, gq.c2, gq.to, 0.6);
        const tagPt = pd >= 1 ? cubic(gq.from, gq.c1, gq.c2, gq.to, SLOTS[L.shape].tagAt) : tp;
        Object.assign(nodes, L.tag.frame({P: tagPt, flip: seg(u, ...W.flip), shift: L.tagShift}));
        nodes['m-tag'].opacity = pd >= 1 ? 1 : 0;
        nodes['m-tag-string'] = {...nodes['m-tag-string'], opacity: pd >= 1 ? 1 : 0};
        return;
      }
      const st = LINK_STYLES[q.kind] || LINK_STYLES.relation;
      const m = Math.max(2, Math.round(28 * pd));
      const pts = Array.from({length: m + 1}, (_, k) => cubic(gq.from, gq.c1, gq.c2, gq.to, (k / m) * pd));
      nodes[`rel${i}`] = {opacity: pd > 0 ? 1 : 0};
      nodes[`rel${i}-line`] = {d: pts.map((q2, k) => `${k ? 'L' : 'M'}${r(q2.x)} ${r(q2.y)}`).join('')};
      const end = pts[pts.length - 1], pre = pts[pts.length - 2];
      if (st.arrow) nodes[`rel${i}-head`] = {transform: T(end.x, end.y, (Math.atan2(end.y - pre.y, end.x - pre.x) * 180) / Math.PI), opacity: pd >= 0.985 ? 1 : 0};
      if (st.endDots) {
        nodes[`rel${i}-dA`] = {cx: r(gq.from.x), cy: r(gq.from.y)};
        nodes[`rel${i}-dB`] = {cx: r(gq.to.x), cy: r(gq.to.y), opacity: pd >= 0.985 ? 1 : 0};
      }
    });
    L.relLabels.forEach(x => Object.assign(nodes, x.lab.frame(clamp((drawn[x.i] - 0.6) / 0.4))));
    // --- captions appear as each element settles; legend and key in the gather beat
    for (const id of Object.keys(L.caps)) nodes[`capg-${id}`] = {opacity: r(seg(u, 0.12, 0.2), 3)};
    nodes.legend = {opacity: r(seg(u, ...W.legend), 3)};
    const keyP = seg(u, ...W.key);
    if (L.key) nodes['key-note'] = {opacity: r(keyP, 3)};
    // --- tracer (a small lens) and phrase highlights as it passes
    const tpos = poly.at(trE);
    const tracerOn = trP > 0 && u < W.tracerOut[1] ? r(1 - seg(u, ...W.tracerOut), 3) : 0;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn};
    const passed = id => visited.includes(id) ? 1 : 0;
    const chk = p.linkState === 'authorization-to-be-checked';
    const hlRef = passed('reference');
    const hlArt = passed('article');
    Object.assign(nodes, L.ref.frame({hl: hlRef}));
    Object.assign(nodes, L.art.frame({hl: hlArt * (chk ? 0 : 1), ghost: hlArt * (chk ? 1 : 0)}));
    Object.assign(nodes, L.inst.frame({hl: hlRef}));
    Object.assign(nodes, L.book.frame({hl: hlArt * (chk ? 0 : 1), ghost: hlArt * (chk ? 1 : 0)}));
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const onEdge = (pt, b) => {
      const inX = pt.x >= b.x - 20 && pt.x <= b.x + b.w + 20, inY = pt.y >= b.y - 20 && pt.y <= b.y + b.h + 20;
      const dx = Math.min(Math.abs(pt.x - b.x), Math.abs(pt.x - b.x - b.w)), dy = Math.min(Math.abs(pt.y - b.y), Math.abs(pt.y - b.y - b.h));
      return inX && inY && Math.min(dx, dy) <= 16;
    };
    const connectorsLand = L.rels.every(q => {
      const gq = L.geomAt(q, boxesT);
      const bA = L.isCord(q) ? L.visOf(q.from, boxesT) : boxesT[q.from], bB = L.isCord(q) ? L.visOf(q.to, boxesT) : boxesT[q.to];
      return onEdge(gq.from, bA) && onEdge(gq.edge ?? gq.to, bB);
    });
    // no element box overlaps another (the diagram stays exploded)
    const ids = Object.keys(L.boxes);
    const elementsApart = ids.every((a, i) => ids.every((b, j) => j <= i || !boxesOverlap(L.boxes[a], L.boxes[b], 4)));
    const labelsAttached = L.relLabels.every(x => {
      const lb = x.lab.box;
      const nx = Math.max(lb.x, Math.min(x.mid.x, lb.x + lb.w)), ny = Math.max(lb.y, Math.min(x.mid.y, lb.y + lb.h));
      return Math.hypot(nx - x.mid.x, ny - x.mid.y) < 220;
    });
    const tracerOffText = !(tracerOn > 0) || !['article', 'reference'].some(id => {
      const b = boxesT[id];
      const tb = {x: b.x + 30, y: b.y + 30, w: b.w - 60, h: b.h - 60};
      return tpos.x > tb.x && tpos.x < tb.x + tb.w && tpos.y > tb.y && tpos.y < tb.y + tb.h;
    });
    return {
      nodes,
      semantic: {
        beat,
        separation: r(sep, 3),
        drawn: drawn.map(v => r(v, 3)),
        kinds: L.rels.map(q => q.kind),
        arrows: L.rels.map(q => Boolean((LINK_STYLES[q.kind] || {}).arrow) && !(L.isCord(q))),
        cordShown: L.cordIdx >= 0 && drawn[L.cordIdx] >= 1,
        order,
        visited,
        focus,
        focusScale: r(focusScale, 3),
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerOn: tracerOn > 0,
        highlight: {reference: hlRef, article: hlArt},
        linkState: p.linkState,
        stateShown: seg(u, ...W.flip) >= 1 && L.cordIdx >= 0,
        keyShown: keyP >= 1 && (Boolean(L.key) || !ctx.show('key')),
        connectorsLand,
        anchorsLand: landed,
        elementsApart,
        labelsAttached,
        ...L.review,
        labelsPlaced: !ctx.show('all') || L.relLabels.length === L.rels.length,
        captionsPlaced: !ctx.show('all') || Object.keys(L.caps).length === p.elements.filter(e => L.boxes[e.id] && e.label && e.id !== 'hierarchy' && e.id !== 'reading').length,
        tagClear: !L.tagBox || Object.values(L.boxes).every(b => !boxesOverlap(L.tagBox, b, 4)),
        tracerOffText,
        stage: {W: L.SW, H: r(L.SH, 1), s: r(L.s, 3)},
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
    slug: 'sources-07-mechanism',
    title: 'Delegated rule-making — what refers to what: instrument, clause, enabling passage',
    titleEs: 'Delegación normativa — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Delegación normativa',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded diagram: the bound volume and a fictional instrument move apart, the enabling passage and the instrument\'s basis clause peel out as slips, and the editable hierarchy board (user-supplied, displayed only) and an attributed reading take their places. Only explicit relationships are drawn with their kind (relation, communication, sequence; causal only when supplied); the reference-clause → passage relation is the gold link cord. A small lens traces the supplied order; the focus element enlarges; the tag on the cord shows the supplied link state.',
    tags: ['delegated rule-making', 'mechanism', 'relations', 'enabling provision', 'instrument', 'reference clause', 'link cord', 'editable hierarchy', 'attributed reading', 'tracer', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/delegacion-normativa.js', 'src/animations/sources/kits/conflicto-entre-textos.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
