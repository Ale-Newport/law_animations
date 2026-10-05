/**
 * LAW-0042 — Búsqueda por términos · mechanism
 *
 * Storyboard (exploded view of the library's term index):
 *  0.00–0.18  separate: the query sits in the search box; its words drop out
 *             as separate term tokens; the index card (ficha) of the featured
 *             term rises out of the card-catalogue drawer (one card per
 *             term); the matching passage lifts out of its volume as a paper
 *             strip, leaving a dashed slot; the library shelf shows the gap
 *             the volume came from.
 *  0.18–0.43  relate: only the supplied relationships are drawn, one by one,
 *             styled by kind (sequence = arrow, relation = no arrow; causal
 *             only when the author supplies it), anchored to element edges.
 *  0.43–0.75  trace: a tracer follows the supplied traversal order; the
 *             element it passes swells (the focus element most). Passing the
 *             card lights the featured posting line; passing the passage
 *             sweeps the highlighter over the matched word; the slot in the
 *             volume and the gap on the shelf light up as it arrives.
 *  0.75–1.00  gather: origin (query), transformation (term → posting) and
 *             state (marked passage, kind of match) stay visible.
 * Postings and the featured passage are computed from the supplied query and
 * passage text. Nothing here states relevance, validity or an outcome.
 * @module animations/research/LAW-0042
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {roundRectPath, polyline} from '../../core/geometry.js';
import {researchFields, RESEARCH_DEFAULTS} from './kits/busqueda-por-terminos-fields.js';
import {findMatches, termPalette, searchBox, cardDrawer, passageStrip, volume, miniLibrary, tokenNode} from './kits/busqueda-por-terminos.js';

const ID = 'LAW-0042';
const DURATION = 7000;
const IDS = ['searchBox', 'term', 'card', 'passage', 'document', 'library'];
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};

const STRINGS = {
  en: {exact: 'Exact match', contextual: 'Contextual match', seeAlso: 'see also:', noMatch: 'No passage matches this query'},
  es: {exact: 'Coincidencia exacta', contextual: 'Coincidencia contextual', seeAlso: 'véase:', noMatch: 'Ningún pasaje coincide con la consulta'},
};

const sceneSchema = {
  ...researchFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  ...RESEARCH_DEFAULTS,
  elements: [
    {id: 'searchBox', label: 'Search box'},
    {id: 'term', label: 'Query terms'},
    {id: 'card', label: 'Index card (one per term)'},
    {id: 'passage', label: 'Matching passage'},
    {id: 'document', label: 'Volume'},
    {id: 'library', label: 'Library shelf'},
  ],
  relationships: [
    {from: 'searchBox', to: 'term', kind: 'sequence', label: 'split into words'},
    {from: 'term', to: 'card', kind: 'sequence', label: 'looked up on'},
    {from: 'card', to: 'passage', kind: 'relation', label: 'lists'},
    {from: 'passage', to: 'document', kind: 'relation', label: 'part of'},
    {from: 'document', to: 'library', kind: 'relation', label: 'kept in'},
  ],
  focusElement: 'card',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['searchBox', 'term', 'card', 'passage', 'document', 'library'],
};

/**
 * Element boxes per shape (design units). `lab` = caption placement.
 * The composition follows the path of a lookup: query → words → index card
 * → passage → volume → shelf, laid out as a loop, not a row of boxes. The
 * shelf stands apart from the volume so the "kept in" relation has length;
 * `gapAt` puts the volume's empty slot on the side the relation arrives from.
 */
const PLACES = {
  landscape: {size: [2250, 1020],
    searchBox: {x: 50, y: 100, w: 640, h: 96, lab: 'above'},
    term: {x: 90, y: 330, w: 560, h: 76, lab: 'right'},
    card: {x: 60, y: 554, w: 590, h: 342, lab: 'below'},
    passage: {x: 850, y: 170, w: 700, h: 0, lab: 'above'},
    document: {x: 850, y: 560, w: 680, h: 320, lab: 'below'},
    library: {x: 1850, y: 150, w: 320, h: 760, lab: 'above', gapAt: 0},
    legend: {x: 1210, y: 1000}},
  square: {size: [1500, 1180],
    searchBox: {x: 40, y: 108, w: 580, h: 96, lab: 'above'},
    term: {x: 20, y: 330, w: 440, h: 76, lab: 'right'},
    card: {x: 20, y: 590, w: 380, h: 390, lab: 'below'},
    passage: {x: 760, y: 150, w: 700, h: 0, lab: 'above'},
    document: {x: 670, y: 620, w: 440, h: 300, lab: 'below'},
    library: {x: 1300, y: 530, w: 190, h: 560, lab: 'above', gapAt: 0},
    legend: {x: 750, y: 1160}},
  portrait: {size: [1100, 1720],
    searchBox: {x: 60, y: 112, w: 720, h: 96, lab: 'above'},
    term: {x: 20, y: 356, w: 420, h: 76, lab: 'right'},
    card: {x: 20, y: 630, w: 370, h: 390, lab: 'below'},
    passage: {x: 640, y: 790, w: 440, h: 0, lab: 'above'},
    document: {x: 30, y: 1260, w: 540, h: 280, lab: 'below'},
    library: {x: 830, y: 1150, w: 250, h: 480, lab: 'above', gapAt: 0},
    legend: {x: 550, y: 1700}},
};

/** Swell of an element as the tracer passes (the focus element most). */
const SWELL = {focus: 0.08, other: 0.04};

/** Box enlarged by the maximum swell about its centre (captions stay outside). */
const envelope = (b, k) => ({x: b.x - (b.w * (k - 1)) / 2, y: b.y - (b.h * (k - 1)) / 2, w: b.w * k, h: b.h * k});

const scene = {
  sizes: {landscape: PLACES.landscape.size, square: PLACES.square.size, portrait: PLACES.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const Pl = PLACES[ctx.view.shape];
    const S = {w: Pl.size[0], h: Pl.size[1]};
    const s = Math.min(ctx.design.w / S.w, ctx.design.h / S.h);
    const ox = (ctx.design.w - S.w * s) / 2, oy = (ctx.design.h - S.h * s) / 2;
    const colors = termPalette(ctx);
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const mode = p.query.mode || 'exact';
    const matches = findMatches(p.query, p.sources, mode);
    // featured passage: first match of the first term that has one
    const feat = matches[0] || null;
    const featTerm = feat ? feat.term : 0;
    const featCol = colors[featTerm % 3];

    // --- search box (query already typed)
    const B = Pl.searchBox;
    const box = searchBox(ctx, {prefix: 'q', w: B.w, h: B.h, terms: p.query.terms.map(t => t.text), colors, placeholder: ''});
    const boxNode = g({name: 'el-searchBox', transform: T(B.x, B.y)}, g({name: 'el-searchBox-body'}, box.node));
    const sbBox = {x: B.x, y: B.y, w: B.w, h: box.h};

    // --- term tokens (drop out of the search box into their own row)
    const TB = Pl.term;
    const toks = p.query.terms.map((t, i) => tokenNode(ctx, {name: `tk${i}`, text: t.text, color: colors[i % 3], kind: 'exact', size: 24}));
    const gap = 26;
    const totalW = toks.reduce((a, t) => a + t.w, 0) + gap * (toks.length - 1);
    let tx = TB.x + (TB.w - totalW) / 2;
    const tokHome = toks.map((t, i) => {
      const c = box.chips[i].box;
      const from = {x: B.x + c.x + c.w / 2, y: B.y + c.y + c.h / 2};
      const to = {x: tx + t.w / 2, y: TB.y + TB.h / 2};
      tx += t.w + gap;
      return {from, to};
    });
    const termBox = {x: Math.min(...tokHome.map((q, i) => q.to.x - toks[i].w / 2)) - 14, y: TB.y - 4, w: totalW + 28, h: TB.h + 8};
    const splitMarks = tokHome.slice(1).map((q, i) => {
      const x = (tokHome[i].to.x + toks[i].w / 2 + q.to.x - toks[i + 1].w / 2) / 2;
      return h('path', {d: `M${r(x)} ${r(TB.y + 8)}v${r(TB.h - 16)}`, stroke: th.fgSoft, 'stroke-width': 2.5, 'stroke-dasharray': '4 5', 'stroke-linecap': 'round'});
    });
    const termNode = g({name: 'el-term'}, g({name: 'el-term-body'},
      h('path', {name: 'term-tray', d: roundRectPath(termBox.x, termBox.y, termBox.w, termBox.h, termBox.h / 2), fill: 'none', stroke: th.fgSoft, 'stroke-width': 2, 'stroke-dasharray': '3 6', opacity: 0}),
      g({name: 'term-splits', opacity: 0}, splitMarks)));

    // --- index card drawer
    const C = Pl.card;
    const postings = matches.filter(m => m.term === featTerm).map(m => ({
      text: `${p.sources[m.source].id} ${p.citations?.pinpoint ?? '¶'}${m.passage + 1}${p.citations?.withDate && p.dates[m.source] ? ` · ${p.dates[m.source]}` : ''}`,
      kind: m.kind, featured: feat && m.source === feat.source && m.passage === feat.passage,
    }));
    const related = mode === 'contextual' ? (p.query.terms[featTerm].related || []) : [];
    const drawer = cardDrawer(ctx, {prefix: 'cd', w: C.w, h: C.h, terms: p.query.terms, featured: featTerm, postings, related, colors, seeAlso: ctx.t.seeAlso});
    const cardElBox = {x: C.x, y: C.y + Math.min(drawer.card.y, drawer.top), w: C.w, h: C.h - Math.min(drawer.card.y, drawer.top)};
    const cardNode = g({name: 'el-card', transform: T(C.x, C.y)}, g({name: 'el-card-body'}, drawer.node));
    // the "lists" relation leaves from the featured posting line's right end
    const PA = drawer.postingAt;
    const postingPort = {x: C.x + PA.x1 - 3, y: C.y + PA.y - 3, w: 6, h: 6};
    const postingMid = {x: C.x + (PA.x0 + PA.x1) / 2, y: C.y + PA.y};

    // --- document (open volume of the featured source), passage slot
    const D = Pl.document;
    const srcI = feat ? feat.source : 0;
    const vol = volume(ctx, {prefix: 'doc', w: D.w, h: D.h, index: srcI, source: p.sources[srcI], date: p.dates[srcI], matches: []});
    const rowI = feat ? feat.passage : 0;
    const row = vol.rows[rowI];
    const slot = {x: vol.textX - 30, y: row.y - 8, w: vol.textW + 34, h: row.h + 16};
    const docNode = g({name: 'el-document', transform: T(D.x, D.y)}, g({name: 'el-document-body'},
      vol.node,
      h('path', {name: 'slot-cover', d: roundRectPath(slot.x, slot.y, slot.w, slot.h, 6), fill: th.paper, opacity: 0}),
      h('path', {name: 'slot', d: roundRectPath(slot.x, slot.y, slot.w, slot.h, 6), fill: featCol.soft, 'fill-opacity': 0.4, stroke: featCol.c, 'stroke-width': 3, 'stroke-dasharray': '9 6', opacity: 0})));
    const docBox = {x: D.x - 8, y: D.y - 4, w: D.w + 16, h: D.h + 22};

    // --- passage strip (exploded out of the slot)
    const PB = Pl.passage;
    const strip = feat
      ? passageStrip(ctx, {prefix: 'ps', w: PB.w, text: p.sources[feat.source].passages[feat.passage], tokens: feat.tokens, kind: feat.kind, color: featCol, cover: ['#6d3b3b', '#2f4f6b', '#4d5e3a', '#5b4a6e'][feat.source % 4], sourceLabel: p.sources[feat.source].id, numLabel: `¶${feat.passage + 1}`, size: 30})
      : passageStrip(ctx, {prefix: 'ps', w: PB.w, text: p.sources[0].passages[0], tokens: [0, 0], kind: 'exact', color: featCol, cover: '#6d3b3b', sourceLabel: p.sources[0].id, numLabel: '¶1', size: 30});
    const stripBox = {x: PB.x, y: PB.y, w: PB.w, h: strip.h};
    const stripNode = g({name: 'el-passage'}, g({name: 'el-passage-body'}, strip.node));
    const slotWorld = {x: D.x + slot.x, y: D.y + slot.y, w: slot.w, h: slot.h};

    // --- library (small bookcase with the gap of the featured volume)
    const LB = Pl.library;
    const lib = miniLibrary(ctx, {prefix: 'lib', w: LB.w, h: LB.h, n: p.sources.length, gapLevel: srcI, color: featCol.c, gapAt: LB.gapAt});
    const libNode = g({name: 'el-library', transform: T(LB.x, LB.y)}, g({name: 'el-library-body'}, lib.node));
    const libBox = {x: LB.x - 10, y: LB.y - 6, w: LB.w + 20, h: LB.h + 6};
    const gapBox = {x: LB.x + lib.gap.x, y: LB.y + lib.gap.y, w: lib.gap.w, h: lib.gap.h};

    // --- element captions, outside each element's maximum swell
    const boxes = {searchBox: sbBox, term: termBox, card: cardElBox, passage: stripBox, document: docBox, library: libBox};
    const kOf = id => 1 + (id === p.focusElement ? SWELL.focus : SWELL.other);
    const captions = {};
    for (const id of IDS) {
      if (!ctx.show('key')) break;
      const bx = envelope(boxes[id], kOf(id));
      const where = Pl[id].lab;
      const size = 30;
      const max = where === 'left' ? Math.min(300, bx.x - 26) : where === 'right' ? Math.min(320, S.w - (bx.x + bx.w) - 26) : Math.max(260, Math.min(520, bx.w));
      // measure first so a two-line caption above an element never overlaps it
      const probe = chip(ctx, label(id), {x: 0, y: 0, maxWidth: max, size, maxLines: 2});
      const o2 = where === 'above' ? {x: Math.max(8, Math.min(S.w - 8 - probe.box.w, bx.x)), y: bx.y - probe.box.h - 10, anchor: 'start'}
        : where === 'below' ? {x: Math.max(8 + probe.box.w / 2, Math.min(S.w - 8 - probe.box.w / 2, bx.x + bx.w / 2)), y: bx.y + bx.h + 10, anchor: 'middle'}
          : where === 'right' ? {x: bx.x + bx.w + 16, y: bx.y + bx.h / 2 - probe.box.h / 2, anchor: 'start'}
            : {x: bx.x - 16, y: bx.y + bx.h / 2 - probe.box.h / 2, anchor: 'end'};
      captions[id] = chip(ctx, label(id), {...o2, maxWidth: max, size, maxLines: 2, name: `lab-${id}`, fill: th.card});
    }

    // descriptive tag (kind of match) hangs under the strip's right end
    const tag = ctx.show('key') && feat ? statusTag(ctx, feat.kind === 'contextual' ? ctx.t.contextual : ctx.t.exact, {x: PB.x + PB.w - 6, y: PB.y + strip.h + 14, anchor: 'end', size: 26, name: 'tag-kind', color: featCol.c, fill: th.card, opacity: 0}) : null;
    const none = !feat && ctx.show('key') ? chip(ctx, ctx.t.noMatch, {x: PB.x + PB.w / 2, y: PB.y + strip.h + 12, anchor: 'middle', maxWidth: PB.w, size: 26, maxLines: 2, name: 'no-match'}) : null;
    const legendY = Pl.legend.y;
    const legend = ctx.show('all') ? legendNode(ctx, [...new Set(p.relationships.map(x => x.kind))], p.relationLabels, Pl.legend) : null;

    // --- relations. Each end lands on a real port of its element: the card
    // "lists" from its featured posting line, the shelf receives the volume
    // in its empty slot; other ends land on the element's edge.
    // the words drop straight down out of the search box: that relation
    // leaves the box's lower edge right above the row of words
    const dropPort = {x: Math.max(sbBox.x + 30, Math.min(sbBox.x + sbBox.w - 30, termBox.x + termBox.w / 2)) - 3, y: sbBox.y + sbBox.h - 6, w: 6, h: 6};
    // ...and the words are looked up straight below the row, over the card stack
    const cardCx = C.x + C.w / 2;
    const lookPort = {x: Math.max(termBox.x + 30, Math.min(termBox.x + termBox.w - 30, cardCx)) - 3, y: termBox.y + termBox.h - 6, w: 6, h: 6};
    const endBox = (id, other) => {
      if (id === 'card') return other === 'term' || other === 'searchBox' ? cardElBox : postingPort;
      if (id === 'library') return gapBox;
      if (id === 'searchBox' && other === 'term') return dropPort;
      if (id === 'term' && other === 'card') return lookPort;
      return boxes[id];
    };
    const fixed = [
      ...Object.values(boxes),
      ...Object.values(captions).map(c => c.box),
      ...(tag ? [tag.box] : []), ...(none ? [none.box] : []),
      {x: 0, y: legendY - 26, w: S.w, h: 52},
    ];
    const placed = [];
    const bounds = {x: 0, y: 0, w: S.w, h: legendY - 34};
    const chipSize = 28;
    const hit = (q, b, pad = 4) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
    const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    // Each relation tries a few shapes (its default bend, bowed either way) and
    // label placements (on the line, or beside it with a leader) and keeps the
    // most legible: full-size label, close to its line, not hiding a short
    // line, and a line that crosses no caption or label.
    const graphs = p.relationships.map((rel, i) => {
      const elements = {[rel.from]: {box: endBox(rel.from, rel.to)}, [rel.to]: {box: endBox(rel.to, rel.from)}};
      const base = rel.kind === 'communication' ? -0.16 : 0.08;
      const own = [endBox(rel.from, rel.to), endBox(rel.to, rel.from), boxes[rel.from], boxes[rel.to]];
      const make = (bend, extra, chipMax) => relationGraph(ctx, {name: `rel${i}`, elements, relationships: [rel], relationLabels: p.relationLabels, chipSize, chipMax,
        obstacles: [...fixed, ...placed, ...extra], separateLabels: true, bounds, bend: () => bend});
      const widths = [380, 320, 240, 180];
      let best = null;
      for (const bend of [base, base + 0.22, base - 0.22]) {
        for (const off of [false, true]) for (const chipMax of widths) {
          let gr = make(bend, [], chipMax);
          const c = gr.conns[0].c;
          if (off) {
            const pad = 16;
            gr = make(bend, [{x: Math.min(c.from.x, c.to.x) - pad, y: Math.min(c.from.y, c.to.y) - pad, w: Math.abs(c.to.x - c.from.x) + pad * 2, h: Math.abs(c.to.y - c.from.y) + pad * 2}], chipMax);
          }
          const x = gr.conns[0];
          const samples = Array.from({length: 17}, (_, k) => x.c.at(0.1 + (0.8 * k) / 16));
          let len = 0;
          for (let k = 1; k <= 20; k++) len += Math.hypot(x.c.at(k / 20).x - x.c.at((k - 1) / 20).x, x.c.at(k / 20).y - x.c.at((k - 1) / 20).y);
          // the line may not run under captions, tags or earlier labels
          const blockers = [...Object.values(captions).map(cp => cp.box), ...(tag ? [tag.box] : []), ...placed, ...Object.values(boxes).filter(b => !own.includes(b))];
          // prefer the default bend and a wide (fewer-line) label when equally legible
          let score = blockers.filter(b => samples.some(q => hit(q, b))).length * 300 + (Math.abs(bend - base) > 0.01 ? 40 : 0) + widths.indexOf(chipMax) * 25;
          if (x.lab) {
            const L2 = x.lab.box;
            if (x.lab.fit.size < chipSize - 0.01 || x.lab.fit.truncated) score += 900;
            const mid = x.c.at(0.5);
            const dist = Math.hypot(L2.cx - mid.x, L2.cy - mid.y);
            score += x.leader ? 40 + dist * 0.8 + Math.max(0, dist - 150) * 2 : 0;
            // a label sitting on its line may hide at most about half of it
            const onLine = samples.some(q => hit(q, L2, 0));
            if (onLine) {
              const covered = samples.filter(q => hit(q, L2, 2)).length / samples.length;
              if (covered > 0.5) score += 500 * covered;
            }
            if (!x.labelClear || [...fixed, ...placed].some(b => overlap(L2, b))) score += 700;
          }
          if (!best || score < best.score) best = {gr, score};
        }
      }
      if (best.gr.conns[0].lab) placed.push(best.gr.conns[0].lab.box);
      return best.gr;
    });
    const conns = graphs.map(gr => gr.conns[0]);

    // --- tracer route through the traversal order: along a relation when one
    // links consecutive elements, else a straight hop; each element is
    // visited at its meaningful point (posting line, slot, gap)
    const visitPt = {
      searchBox: {x: sbBox.x + sbBox.w / 2, y: sbBox.y + sbBox.h / 2}, term: {x: termBox.x + termBox.w / 2, y: termBox.y + termBox.h / 2},
      card: postingMid, passage: {x: stripBox.x + stripBox.w / 2, y: stripBox.y + stripBox.h / 2},
      document: {x: slotWorld.x + slotWorld.w / 2, y: slotWorld.y + slotWorld.h / 2}, library: {x: gapBox.x + gapBox.w / 2, y: gapBox.y + gapBox.h / 2},
    };
    const pts = [];
    const visits = [];
    p.traversalOrder.forEach((id, i) => {
      if (!visitPt[id]) return;
      if (pts.length) {
        const prev = p.traversalOrder[i - 1];
        const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
        if (link) {
          const fw = link.rel.from === prev;
          for (let k = 0; k <= 30; k++) pts.push(link.c.at(fw ? k / 30 : 1 - k / 30));
        }
      }
      pts.push(visitPt[id]);
      visits.push({id, idx: pts.length - 1});
    });
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    const route = {poly: polyline(pts.length > 1 ? pts : [visitPt.searchBox, visitPt.searchBox]), visits: visits.map(v => ({id: v.id, t: cum[v.idx] / total}))};
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));

    // lift geometry: the strip starts at the slot (scaled to the row) and rises out
    const liftK = slotWorld.w / PB.w;
    const anchorBoxes = {...boxes};
    return {S, s, ox, oy, box, boxNode, toks, tokHome, termNode, drawer, cardNode, docNode, stripNode, strip, stripBox, slotWorld, liftK, libNode, lib, captions, graphs, conns, route, visitT, legend, tag, none, feat, boxes, anchorBoxes, D, C, matches, kOf, endBox};
  },
  build(ctx, L) {
    const th = ctx.theme;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graphs.map(gr => gr.node),
      L.libNode, L.docNode, L.cardNode, L.boxNode, L.termNode,
      L.toks.map(t => t.node),
      L.stripNode,
      Object.values(L.captions).map(c => c.node),
      L.graphs.map(gr => gr.labelsNode),
      L.tag && L.tag.node,
      L.none && L.none.node,
      // tracer: a ring and a dot large enough to follow at video size
      g({name: 'tracer', opacity: 0},
        h('circle', {r: 30, fill: th.accent, opacity: 0.2}),
        h('circle', {r: 16, fill: th.accent, stroke: th.paper, 'stroke-width': 4})),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // 1) separate
    Object.assign(nodes, L.box.frame({type: 1}));
    const drop = L.toks.map((_, i) => ease.inOutCubic(seg(u, 0.03 + i * 0.025, 0.11 + i * 0.025)));
    const tokPos = L.tokHome.map((q, i) => ({x: lerp(q.from.x, q.to.x, drop[i]), y: lerp(q.from.y, q.to.y, drop[i])}));
    L.toks.forEach((t, i) => { nodes[`tk${i}`] = {opacity: drop[i] > 0 ? 1 : 0, transform: T(tokPos[i].x, tokPos[i].y, 0, 1 + 0.1 * Math.sin(Math.PI * drop[i]))}; });
    nodes['term-tray'] = {opacity: r(seg(u, 0.1, 0.16), 3)};
    nodes['term-splits'] = {opacity: r(seg(u, 0.1, 0.16), 3)};
    const raise = seg(u, 0.05, 0.16);
    const lift = ease.inOutCubic(seg(u, 0.07, 0.18));
    const hasFeat = Boolean(L.feat);
    const S0 = L.slotWorld, SB = L.stripBox;
    const sx = lerp(S0.x, SB.x, lift), sy = lerp(S0.y, SB.y, lift);
    const sk = lerp(L.liftK, 1, lift);
    nodes['el-passage'] = {transform: T(sx, sy, 0, sk), opacity: hasFeat ? r(seg(u, 0.05, 0.1), 3) : r(seg(u, 0.1, 0.16), 3)};
    nodes['slot-cover'] = {opacity: hasFeat && u >= 0.05 ? 1 : 0};
    // captions appear with (after) their element: the query words once they
    // have dropped, the card once raised, the passage once lifted
    const capIn = {searchBox: 1, document: 1, library: seg(u, 0.17, 0.22), term: seg(u, 0.14, 0.19), card: seg(u, 0.14, 0.19), passage: seg(u, 0.17, 0.22)};
    for (const id of Object.keys(L.captions)) nodes[`lab-${id}`] = {opacity: r(capIn[id], 3)};
    // 2) relations drawn one by one
    const n = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, 0.22 + (i * 0.21) / n, 0.22 + ((i + 1) * 0.21) / n));
    L.graphs.forEach((gr, i) => Object.assign(nodes, gr.frame(() => relP(i))));
    // 3) tracer
    const tp = seg(u, 0.44, 0.74);
    const tt = ease.inOutSine(tp);
    const tpos = L.route.poly.at(tt);
    const tracerOn = u >= 0.43 && u < 0.78;
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const passed = id => (L.visitT[id] !== undefined && (u >= 0.74 || (tracerOn && tt >= L.visitT[id])));
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };
    for (const id of IDS) {
      const b = L.boxes[id];
      const k = 1 + (L.kOf(id) - 1) * (reduced ? 0.5 : 1) * ease.inOutSine(pulse(id));
      // body groups are drawn in local coordinates: pivot = element centre in local space
      const local = id === 'searchBox' ? {x: b.w / 2, y: b.h / 2}
        : id === 'card' ? {x: L.C.w / 2, y: L.C.h * 0.5}
          : id === 'document' ? {x: L.D.w / 2, y: L.D.h / 2}
            : id === 'library' ? {x: (b.w - 20) / 2, y: (b.h - 6) / 2}
              : id === 'passage' ? {x: L.strip.w / 2, y: L.strip.h / 2}
                : {x: b.x + b.w / 2, y: b.y + b.h / 2};
      nodes[`el-${id}-body`] = {transform: k !== 1 ? scaleAbout(local.x, local.y, k) : ''};
    }
    // the parts that change as the tracer passes
    const cardLit = passed('card') ? 1 : 0;
    Object.assign(nodes, L.drawer.frame(raise, cardLit));
    const markT = L.visitT.passage;
    const mark = markT === undefined ? (u >= 0.74 ? 1 : 0) : (u >= 0.74 ? 1 : tracerOn ? seg(tt, markT - 0.03, markT + 0.04) : 0);
    Object.assign(nodes, L.strip.frame(hasFeat ? mark : 0));
    nodes.slot = {opacity: hasFeat ? r(Math.max(0.55 * seg(u, 0.1, 0.16), passed('document') ? 1 : 0), 3) : 0};
    Object.assign(nodes, L.lib.frame(passed('library') ? 1 : 0));
    if (L.tag) nodes['tag-kind'] = {opacity: r(seg(u, 0.8, 0.88), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const R4 = b => ({x: r(b.x), y: r(b.y), w: r(b.w), h: r(b.h)});
    const ends = L.conns.map(c => ({from: {x: r(c.c.from.x), y: r(c.c.from.y)}, to: {x: r(c.c.to.x), y: r(c.c.to.y)}, fromId: c.rel.from, toId: c.rel.to, kind: c.rel.kind,
      fromBox: R4(L.endBox(c.rel.from, c.rel.to)), toBox: R4(L.endBox(c.rel.to, c.rel.from)), len: r(Math.hypot(c.c.to.x - c.c.from.x, c.c.to.y - c.c.from.y))}));
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        strip: {x: r(sx), y: r(sy)},
        tokenA: {x: r(tokPos[0].x), y: r(tokPos[0].y)},
        tokenB: tokPos[1] ? {x: r(tokPos[1].x), y: r(tokPos[1].y)} : null,
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        visitOrder: L.route.visits.map(v => v.id),
        passageMarked: r(hasFeat ? mark : 0, 3),
        postingLit: cardLit,
        slotLit: passed('document'),
        shelfLit: passed('library'),
        matchKind: L.feat ? L.feat.kind : null,
        connectorEnds: ends,
        anchorBoxes: Object.fromEntries(Object.entries(L.anchorBoxes).map(([k, b]) => [k, R4(b)])),
        captionsShown: Object.fromEntries(Object.keys(L.captions).map(id => [id, r(capIn[id], 3)])),
        elementsReady: {term: r(Math.min(...drop), 3), card: r(raise, 3), passage: r(lift, 3)},
        kinds: p.relationships.map(x => x.kind),
        relationLabels: L.conns.map(c => (c.lab ? {size: r(c.lab.fit.size, 2), truncated: Boolean(c.lab.fit.truncated), leader: Boolean(c.leader)} : null)),
        focus: p.focusElement,
      },
    };
  },
};

function legendNode(ctx, kinds, labels, at) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const size = 28;
  const gap = 56;
  const widths = items.map(it => 70 + ctx.measure(it.text, size, 500, 'sans'));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let x = at.x - total / 2;
  const parts = items.map((it, i) => {
    const color = kindColor(ctx, it.k);
    const dash = it.k === 'communication' ? '10 8' : null;
    const arrow = it.k !== 'relation';
    const node = g({transform: T(x, at.y)},
      h('line', {x1: 0, x2: 54, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
      arrow ? h('path', {d: 'M54 0l-12 -7l3 7l-3 7z', fill: color}) : h('circle', {cx: 54, cy: 0, r: 5, fill: color}),
      h('circle', {cx: 0, cy: 0, r: arrow ? 0 : 5, fill: color}),
      h('text', {x: 66, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text));
    x += widths[i] + gap;
    return node;
  });
  return g({name: 'legend'}, parts);
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-01-mechanism',
    title: 'Term search — how a query reaches a passage',
    titleEs: 'Búsqueda por términos — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Búsqueda por términos',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view of a term lookup: the query splits into word tokens, each word has its own index card in a card-catalogue drawer listing where it occurs, the listed passage lifts out of its volume and the volume belongs to its shelf. Edge-anchored connectors by relation kind, a tracer following the traversal order, and the passage highlighted as the tracer passes.',
    tags: ['search', 'index card', 'card catalogue', 'posting', 'passage', 'mechanism', 'tracer', 'library'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/busqueda-por-terminos.js', 'src/animations/research/kits/busqueda-por-terminos-fields.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
