/**
 * LAW-0126 — Definición legislativa · mechanism
 *
 * Storyboard ("exploded" text; brief beats in brackets):
 *  [0.00–0.18] separate: the text is drawn as a slab of page bands, one band
 *              per user-supplied hierarchy level. The article page rises out
 *              of its band, the definitions page out of another band, and
 *              from each page a card lifts off (clipped to the outside of its
 *              page, so it slides out from under the page edge): the TERM from the article (it
 *              starts its line, so its relation reaches it through the page
 *              margin), the supplied DEFINITION entry from the definitions page.
 *  [0.18–0.43] relate: only the supplied relationships are drawn, each one
 *              anchored to the real edges of its two parts (card ↔ its spot,
 *              page ↔ its band's end face, term card ↔ definition card over
 *              the top) in the supplied kind: a plain relation has no
 *              arrowhead; arrows appear only when supplied. Each caption sits
 *              beside its own line (on it only at the middle of a long arc).
 *  [0.43–0.75] trace: a large marker follows the traversal order along the
 *              drawn relations (hidden while it passes through a part, which
 *              lights up instead). When it reaches the focus part a round
 *              inset window (no handle) opens in free space with a REAL enlarged
 *              copy of that part's detail (the definition entry, the term where
 *              it is used, the band plate): whole words only, its source marked
 *              by a box hugging the detail and tied to it by one leader.
 *  [0.75–1.00] gather: bands, term and entry stay marked, the lens stays
 *              open away from every caption; a legend of the kinds in use and
 *              a descriptive state tag.
 * Layout: the cards stand above their pages and the term–definition relation
 * arches over the top. Wide frames use a BRIDGE (the slab stands between the
 * two pages, a free bay under it for the lens); square frames use an ARCH with
 * narrow pages (the slab lies below, a free middle column); tall frames use an
 * ARCH with full-width pages and a free bay between the pages and the slab.
 * @module animations/sources/LAW-0126
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor, mix} from '../../core/geometry.js';
import {mechanismFields, str} from '../../schemas/fields.js';
import {connector, chip, statusTag, LINK_STYLES, textBlock} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {fitWords, sourcesFields, kitStrings, KIT_STRINGS, articleSheet, readablePage, sheetMarks, pageMarks, hierarchySlab, liftedCard, rectLens, levelIndex, levelColor, overlaps} from './kits/definicion-legislativa.js';

const ID = 'LAW-0126';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const IDS = ['term', 'article', 'hierarchy', 'definitions', 'definition'];

const {interpretations: _unusedInterpretations, ...fieldsNoReadings} = sourcesFields;
const mech = mechanismFields(IDS);
mech.relationships.items.properties.label = str('Caption of this relationship (descriptive; empty = the caption of its kind)', 50);
mech.elements.description = 'Captions of the five parts (ids fixed by the scene: term, article, hierarchy, definitions, definition) (array replaces the previous value)';
const sceneSchema = {...fieldsNoReadings, ...mech};

const defaultParams = {
  sources: ['Text 1 (fictional)'],
  hierarchy: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)', 'Level 3 (user-supplied)'],
  passages: [
    {ref: 'Text 1 · Art. 7 (fictional)', heading: 'Keeping of items', text: 'The holder keeps each listed item in the register (simulated wording).', term: 'listed item', level: 3},
    {ref: 'Text 1 · Art. 2 (fictional)', heading: 'Definitions', text: 'means an object entered in the annex (simulated wording).', term: 'listed item', level: 2},
  ],
  elements: [
    {id: 'term', label: 'Term'},
    {id: 'article', label: 'Article that uses it'},
    {id: 'hierarchy', label: 'Hierarchy (user-supplied)'},
    {id: 'definitions', label: 'Definitions section'},
    {id: 'definition', label: 'Supplied definition'},
  ],
  relationships: [
    {from: 'term', to: 'article', kind: 'relation', label: 'appears in'},
    {from: 'article', to: 'hierarchy', kind: 'relation', label: 'sits at its level'},
    {from: 'definitions', to: 'hierarchy', kind: 'relation', label: 'sits at its level'},
    {from: 'definition', to: 'definitions', kind: 'relation', label: 'entry of'},
    {from: 'term', to: 'definition', kind: 'relation', label: 'defined in (as supplied)'},
  ],
  focusElement: 'definition',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['term', 'article', 'hierarchy', 'definitions', 'definition'],
};

const STRINGS = {
  en: {linkedState: 'Term and definition related (as supplied)', legendTitle: 'Kinds'},
  es: {linkedState: 'Término y definición relacionados (según lo aportado)', legendTitle: 'Tipos'},
};

const pt = (x, y) => ({x, y});
const centerOf = b => pt(b.x + b.w / 2, b.y + b.h / 2);
/** Trace window: the marker runs in [0.43, 0.67] so the focus lens opens inside the trace beat. */
const TRACE = [0.43, 0.67];

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [1000, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const shape = ctx.view.shape;
    const fs = shape === 'landscape' ? 1.1 : shape === 'square' ? 1.22 : 1.2;
    // design units → px on a 1080p frame; every supplied text is set at >= 16.5 px there
    const V = ctx.view;
    const k0 = Math.min(V.content.w / D.w, V.content.h / D.h) * (1080 / Math.min(V.width, V.height));
    const floor = 16.5 / k0;
    const t = {...kitStrings(p.locale), ...(STRINGS[p.locale] || STRINGS.en)};
    const labelOf = id => ((p.elements.find(e => e.id === id) || {}).label ?? '');
    const pa = p.passages[0], pd = p.passages[1];
    const aL = levelIndex(p, pa), dL = levelIndex(p, pd);
    const N = p.hierarchy.length;
    const kindsUsed = [...new Set(p.relationships.map(x => x.kind))];
    const BW = D.w, BH = D.h;

    // ---- bottom strip: legend (left) and state tag (right)
    const stripH = 50 * fs;
    const m = 30;

    // ---- geometry. The lifted cards stand above their pages (the term card over the article
    // page, the definition card over the definitions page); the term–definition relation arches
    // over the top. Wide and square frames: a BRIDGE — the slab of level bands stands between the
    // two pages, a free bay under it. Tall frames: an ARCH — the slab lies below the two pages.
    // Pages are as tall as their supplied text needs (it is never cut or replaced).
    const mode = shape === 'portrait' ? 'arch' : 'bridge';
    const narrow = shape === 'portrait';
    const arcLane = 84 * fs; // above the cards: the term–definition relation and its caption
    const cardTop = arcLane + 10;
    const S = Math.max(floor, 15.5 * fs * 0.95); // wording size on the pages
    let slabBox, pageA, pageD, cardA, cardD, termCard, defCard, plateMax;
    const bottom = BH - stripH - 24;
    const plateSize = Math.max(floor, 20 * fs);
    const plateNeedFor = pm => Math.max(0, ...p.hierarchy.map(l => (ctx.show('key') && l ? fitWords(ctx, l, {maxWidth: pm, size: plateSize, minSize: plateSize, maxLines: 6, weight: 700}).height + 12 + 12 : 0)));
    const slabTitleH = ctx.show('all') && labelOf('hierarchy') ? fitWords(ctx, labelOf('hierarchy'), {maxWidth: 1e9, size: Math.max(floor, 17 * fs), minSize: Math.max(floor, 17 * fs), maxLines: 1, weight: 700}).height : 0;
    let pageW;
    const needsFor = w => Math.max(
      articleSheet(ctx, {prefix: 'probe-a', w, h: 400, kicker: labelOf('article'), ref: pa.ref, heading: pa.heading, term: pa.term, levelLabel: p.hierarchy[aL], levelColor: levelColor(ctx, aL), fs: fs * 0.95, bodyText: pa.text, termBreak: true, floor, fullText: true}).needH,
      readablePage(ctx, {prefix: 'probe-d', w, S, kicker: labelOf('definitions'), ref: pd.ref, heading: pd.heading, rows: [{term: null, text: null}, {term: pd.term, text: pd.text}], levelColor: levelColor(ctx, dL), levelLabel: p.hierarchy[dL]}).needH);
    if (mode === 'bridge') {
      const sq = shape === 'square';
      // the slab is at least wide enough for the longest word of any level name (words never break)
      const lw = Math.max(0, ...p.hierarchy.flatMap(l => String(l).split(/\s+/)).map(wd => ctx.measure(wd, plateSize, 700, 'sans')));
      const gap = sq ? 120 : 160, slabW = Math.max(sq ? 220 : 280, lw + 90), side = sq ? 80 : 120;
      const pw0 = clamp((BW - 2 * side - slabW - 2 * gap) / 2, 340, 500);
      // pages only as wide as their text needs to fit the height: the narrower they are, the wider
      // the free bay under the slab (the final inset opens there)
      const cardsFor = w => [liftedCard(ctx, {prefix: 'el-term-card', kind: 'term', term: pa.term, caption: labelOf('term'), maxWidth: w + 40, fs, floor}),
        // the definition card carries the entry's quoted term; its wording stands on the page entry (and in the final inset)
        liftedCard(ctx, {prefix: 'el-definition-card', kind: 'definition', term: pd.term, caption: labelOf('definition'), maxWidth: w + 40, fs, floor, noBody: true})];
      pageW = pw0;
      for (let w = pw0; w >= 300; w -= 25) {
        const [tc, dc] = cardsFor(w);
        if (cardTop + Math.max(tc.h, dc.h) + 80 * fs + needsFor(w) > bottom) break;
        pageW = w;
      }
      const gapX = gap + (pw0 - pageW);
      pageA = {x: BW / 2 - slabW / 2 - gapX - pageW, w: pageW};
      pageD = {x: BW / 2 + slabW / 2 + gapX, w: pageW};
      [termCard, defCard] = cardsFor(pageW);
      const pagesTop = cardTop + Math.max(termCard.h, defCard.h) + 70 * fs;
      pageA.y = pagesTop; pageD.y = pagesTop;
      plateMax = slabW - 60;
      // the slab stands in the upper part of the middle column (under its title); below it a free bay takes the inset
      const bandH = Math.max(66 * fs, plateNeedFor(plateMax));
      const slabTop = cardTop + slabTitleH * 1.3 + 16;
      slabBox = {x: BW / 2 - slabW / 2, y: slabTop, w: slabW, h: N * bandH + 32};
    } else {
      // tall: full-width pages; a free bay opens between them and the slab
      pageW = D.w * 0.42;
      const colA = D.w * 0.26, colD = D.w * 0.74;
      pageA = {x: colA - pageW / 2, w: pageW};
      pageD = {x: colD - pageW / 2, w: pageW};
      const cardMaxW = D.w * 0.44;
      termCard = liftedCard(ctx, {prefix: 'el-term-card', kind: 'term', term: pa.term, caption: labelOf('term'), maxWidth: cardMaxW, fs, floor});
      // the definition card carries the entry's quoted term; its wording stands on the page entry (and in the final inset)
      defCard = liftedCard(ctx, {prefix: 'el-definition-card', kind: 'definition', term: pd.term, caption: labelOf('definition'), maxWidth: cardMaxW + 40, fs, floor, noBody: true});
      const lwP = Math.max(0, ...p.hierarchy.flatMap(l => String(l).split(/\s+/)).map(wd => ctx.measure(wd, plateSize, 700, 'sans')));
      const slabW = Math.max(D.w * 0.4, lwP + 90);
      plateMax = slabW - 60;
      const bandH = Math.max((N > 3 ? 64 : 76) * fs, plateNeedFor(plateMax));
      const slabH = N * bandH + 32;
      slabBox = {x: (D.w - slabW) / 2, y: bottom + 24 - 26 - slabH, w: slabW, h: slabH};
      // room between the cards and the pages for the pages' captions and the relation captions
      const pagesTop = cardTop + Math.max(termCard.h, defCard.h) + 150 * fs;
      pageA.y = pagesTop; pageD.y = pagesTop;
    }
    // each card overhangs its page's OUTER edge by 60: the card's connector drops down outside the page
    const over = shape === 'square' ? 44 : 60;
    cardA = pt(Math.max(12 + termCard.w / 2, pageA.x - over + termCard.w / 2), cardTop + termCard.h / 2);
    cardD = pt(Math.min(BW - 12 - defCard.w / 2, pageD.x + pageD.w + over - defCard.w / 2), cardTop + defCard.h / 2);
    const slab = hierarchySlab(ctx, {prefix: 'el-hierarchy-slab', ...slabBox, levels: p.hierarchy, fs, title: labelOf('hierarchy'), plateMax, floor});
    const bandBox = i => slab.bands[i].box;
    // pages: as tall as their text needs, at least down to the free space's bottom (bridge) or the bay (arch)
    const rows = [{term: null, text: null}, {term: pd.term, text: pd.text}];
    const nRows = rows.length;
    const pageOpts0 = {w: pageD.w, S, kicker: labelOf('definitions'), ref: pd.ref, heading: pd.heading, rows, levelColor: levelColor(ctx, dL), levelLabel: p.hierarchy[dL]};
    const sheetOpts0 = {w: pageA.w, kicker: labelOf('article'), ref: pa.ref, heading: pa.heading, term: pa.term, levelLabel: p.hierarchy[aL], levelColor: levelColor(ctx, aL), fs: fs * 0.95, bodyText: pa.text, termBreak: true, floor, fullText: true};
    const needA = articleSheet(ctx, {prefix: 'probe-a', ...sheetOpts0, h: 400}).needH;
    const probeD = readablePage(ctx, {prefix: 'probe-d', ...pageOpts0});
    const needD = probeD.needH;
    if (mode === 'bridge') {
      // the gap between the cards and the pages (captions stand there) grows with the free height
      const cardsBottom = cardTop + Math.max(termCard.h, defCard.h);
      const gapCP = clamp(bottom - cardsBottom - Math.max(needA, needD), 70 * fs, 150 * fs);
      pageA.y = cardsBottom + gapCP; pageD.y = pageA.y;
    }
    if (mode === 'arch') {
      // tall frames: the gap under the cards grows with what is left once the pages and a bay for
      // the final inset (the enlarged entry) are placed above the slab
      const cardsBottom = cardTop + Math.max(termCard.h, defCard.h);
      const insetNeed = probeD.entryBoxes[1].h * 1.2 + 90;
      const gapCP = clamp(slabBox.y - slabTitleH - 30 - cardsBottom - Math.max(needA, needD) - insetNeed, 60 * fs, 150 * fs);
      pageA.y = cardsBottom + gapCP; pageD.y = pageA.y;
    }
    const availH = mode === 'bridge' ? bottom - pageA.y : slabBox.y - slabTitleH - 30 - 250 - pageA.y;
    const pageH = Math.max(needA, needD, availH);
    pageA.h = pageH; pageD.h = pageH;
    const sheetOpts = {...sheetOpts0, h: pageH};
    const sheet = articleSheet(ctx, {prefix: 'el-article-sheet', ...sheetOpts});
    const pageOpts = {...pageOpts0, minH: pageH};
    const dpage = readablePage(ctx, {prefix: 'el-definitions-page', ...pageOpts});
    const termSpot = {x: pageA.x + sheet.termBox.x, y: pageA.y + sheet.termBox.y, w: sheet.termBox.w, h: sheet.termBox.h};
    const eb = dpage.rowBoxes[1];
    const entrySpot = {x: pageD.x + eb.x, y: pageD.y + eb.y, w: eb.w, h: eb.h};
    // the two pages' own captions (element labels) stand on their inner top corners
    const capSize = Math.max(floor, 18 * fs);
    const pageCap = (id, pg, inner) => {
      if (!ctx.show('all') || !labelOf(id)) return null;
      const probe = chip(ctx, labelOf(id), {x: 0, y: 0, anchor: 'start', maxWidth: pg.w - 20, size: capSize, minSize: capSize, maxLines: 3, weight: 700, fill: th.card});
      return chip(ctx, labelOf(id), {x: inner === 'end' ? pg.x + pg.w - 8 : pg.x + 8, y: pg.y - probe.box.h - 8, anchor: inner, maxWidth: pg.w - 20, size: capSize, minSize: capSize, maxLines: 3, weight: 700, fill: th.card, name: `cap-${id}`});
    };
    // (the two pages' captions are their first lines: see `kicker`)
    const capA = null;
    const capD = null;
    const cardBox = (c, k) => ({x: c.x - k.w / 2, y: c.y - k.h / 2, w: k.w, h: k.h});
    const boxes = {term: cardBox(cardA, termCard), article: pageA, hierarchy: slabBox, definitions: pageD, definition: cardBox(cardD, defCard)};

    // ---- connector geometry for the known pairs (else edge anchors)
    const geo = (a, b) => {
      const A = boxes[a], B = boxes[b];
      const key = [a, b].sort().join('|');
      const ca = boxes.term, cd = boxes.definition;
      let gm = null;
      if (key === 'article|term') {
        // down from the card, outside the page's outer edge, into the margin beside the term (the term starts its line)
        const x0 = pageA.x - over / 2;
        const from = pt(x0, ca.y + ca.h + 4);
        const to = pt(termSpot.x - 6, termSpot.y + termSpot.h / 2);
        gm = {from, to, c1: pt(x0, lerp(from.y, to.y, 0.75)), c2: pt(x0 + 6, to.y), aId: 'term'};
      } else if (key === 'definition|definitions') {
        const x0 = pageD.x + pageD.w + over / 2;
        const from = pt(x0, cd.y + cd.h + 4);
        const to = pt(entrySpot.x + entrySpot.w + 6, entrySpot.y + entrySpot.h / 2);
        gm = {from, to, c1: pt(x0, lerp(from.y, to.y, 0.75)), c2: pt(x0 - 6, to.y), aId: 'definition'};
      } else if (key === 'article|hierarchy' || key === 'definitions|hierarchy') {
        const isA = key === 'article|hierarchy';
        const pg = isA ? pageA : pageD;
        const bb = bandBox(isA ? aL : dL);
        const byc = bb.y + bb.h / 2;
        if (mode === 'bridge') {
          const from = pt(isA ? pg.x + pg.w + 4 : pg.x - 4, clamp(byc, pg.y + 40, pg.y + pg.h - 40));
          const face = pt(isA ? slabBox.x - 6 : slabBox.x + slabBox.w + 6, byc);
          gm = {from, to: face, c1: pt(lerp(from.x, face.x, 0.5), from.y), c2: pt(lerp(from.x, face.x, 0.5), face.y), aId: isA ? 'article' : 'definitions'};
        } else {
          // from the page's inner bottom corner straight down beside the slab, then into its end face
          const fx = isA ? Math.min(pg.x + pg.w * 0.78, slabBox.x - 44) : Math.max(pg.x + pg.w * 0.22, slabBox.x + slabBox.w + 44);
          const from = pt(fx, pg.y + pg.h + 4);
          const face = pt(isA ? slabBox.x - 6 : slabBox.x + slabBox.w + 6, byc);
          gm = {from, to: face, c1: pt(from.x, lerp(from.y, face.y, 0.8)), c2: pt(isA ? face.x - 16 : face.x + 16, face.y), aId: isA ? 'article' : 'definitions'};
        }
      } else if (key === 'definition|term') {
        // an arch over the top, from the top of one card to the top of the other
        const from = pt(ca.x + ca.w / 2, ca.y - 6);
        const to = pt(cd.x + cd.w / 2, cd.y - 6);
        const apex = arcLane * 0.5;
        const yc = (apex - 0.25 * (from.y + to.y) / 2) / 0.75;
        gm = {from, to, c1: pt(from.x + 20, yc), c2: pt(to.x - 20, yc), aId: 'term'};
      }
      if (!gm) {
        const from = edgeAnchor(A, centerOf(B), 8), to = edgeAnchor(B, centerOf(A), 12);
        return {from, to, c1: mix(from, to, 0.33), c2: mix(from, to, 0.66), generic: true};
      }
      // orient: `from` belongs to the relationship's source
      if (gm.aId !== a) return {from: gm.to, to: gm.from, c1: gm.c2, c2: gm.c1};
      return gm;
    };

    // ---- relation labels: beside their own connector (never on a short one), collision-checked
    const bounds = {x: 4, y: 4, w: BW - 8, h: BH - stripH - 12};
    const obstacles = Object.values(boxes).map(b => ({...b}));
    const slabTitleBox = slab.titleBox ? {...slab.titleBox} : {x: slabBox.x, y: slabBox.y - 38 * fs, w: slabBox.w, h: 38 * fs};
    obstacles.push(slabTitleBox);
    if (capA) obstacles.push(capA.box);
    if (capD) obstacles.push(capD.box);
    const labelBoxes = [];
    const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
    const area = (a2, b2) => Math.max(0, Math.min(a2.x + a2.w, b2.x + b2.w) - Math.max(a2.x, b2.x)) * Math.max(0, Math.min(a2.y + a2.h, b2.y + b2.h) - Math.max(a2.y, b2.y));
    const conns = p.relationships.map((rel, i) => {
      const gm = geo(rel.from, rel.to);
      const c = connector(ctx, {name: `rel${i}`, from: gm.from, to: gm.to, c1: gm.c1, c2: gm.c2, kind: rel.kind, color: kindColor(ctx, rel.kind)});
      return {rel, c, lab: null, labBox: null};
    });
    // every connector's own samples are obstacles for the OTHER connectors' labels
    const samples = conns.map(x => Array.from({length: 25}, (_, k) => x.c.at(k / 24)));
    // ---- tracer route along the traversal order; stretches INSIDE a part are hidden
    const order = p.traversalOrder.filter(id => boxes[id]);
    const visits = [];
    let pts = [];
    const hiddenPt = [];
    const push = (q, hid) => { if (!pts.length || Math.hypot(q.x - pts[pts.length - 1].x, q.y - pts[pts.length - 1].y) > 0.5) { pts.push(pt(q.x, q.y)); hiddenPt.push(!!hid); } };
    let prevEnd = null;
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      if (i === 0) {
        // start on the first part's edge where its first relation leaves
        const next = order[1];
        const link = next && conns.find(x => (x.rel.from === id && x.rel.to === next) || (x.rel.from === next && x.rel.to === id));
        push(link ? (link.rel.from === id ? link.c.from : link.c.to) : centerOf(boxes[id]));
        visits.push({id, idx: 0});
        continue;
      }
      const prev = order[i - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      let start, end, sample;
      if (link) {
        const fwd = link.rel.from === prev;
        start = fwd ? link.c.from : link.c.to;
        end = fwd ? link.c.to : link.c.from;
        sample = k => link.c.at(fwd ? k : 1 - k);
      } else {
        start = edgeAnchor(boxes[prev], centerOf(boxes[id]), 4);
        end = edgeAnchor(boxes[id], centerOf(boxes[prev]), 4);
        sample = k => mix(start, end, k);
      }
      // passing through the previous part (from where it arrived to where it leaves): hidden
      if (prevEnd) push(start, true);
      else push(start);
      for (let k = 1; k <= 30; k++) push(sample(k / 30));
      visits.push({id, idx: pts.length - 1});
      prevEnd = end;
    }
    if (pts.length < 2) { pts = [pts[0] || pt(0, 0), pts[0] || pt(0, 0)]; hiddenPt.push(false); }
    const route = polyline(pts);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const total = cum[cum.length - 1] || 1;
    // hidden arc-length ranges (a segment ending at a hidden point is inside a part)
    const hidden = [];
    for (let i = 1; i < pts.length; i++) if (hiddenPt[i]) hidden.push([cum[i - 1] / total, cum[i] / total]);
    const visitT = Object.fromEntries(visits.map(v => [v.id, cum[v.idx] / total]));

    // ---- legend + state tag
    const legendParts = [];
    let lx = m;
    const ly = BH - stripH / 2 - 4;
    if (ctx.show('all')) {
      kindsUsed.forEach(k => {
        const st = LINK_STYLES[k];
        const col = kindColor(ctx, k);
        legendParts.push(h('line', {x1: lx, x2: lx + 44, y1: ly, y2: ly, stroke: col, 'stroke-width': st.width, 'stroke-dasharray': st.dash || undefined}));
        if (st.arrow) legendParts.push(h('path', {d: `M${lx + 50} ${ly}l-12 -7v14Z`, fill: col}));
        if (st.endDots) legendParts.push(h('circle', {cx: lx, cy: ly, r: st.width * 1.6, fill: col}), h('circle', {cx: lx + 44, cy: ly, r: st.width * 1.6, fill: col}));
        const f = ctx.fit(p.relationLabels[k] || t[k] || k, {maxWidth: 240, size: 18 * fs, minSize: 13, maxLines: 1, weight: 600});
        legendParts.push(textBlock(f, {x: lx + 60, y: ly - f.size * 0.62, fill: th.fgSoft}));
        lx += 60 + f.width + 34;
      });
    }
    const tag = ctx.show('key') ? statusTag(ctx, t.linkedState, {x: BW - m, y: BH - stripH + 2, anchor: 'end', size: 22 * fs, name: 'state-tag', color: th.accent, maxWidth: Math.max(260, BW - lx - m - 20)}) : null;

    // ---- focus lens: a rectangular inset with a REAL enlarged copy of the focused part's detail,
    // opened in free space. It holds a WHOLE block: for the definition, the entry's quoted term and
    // its complete supplied wording in their original order (the scene's ending); for the term, the
    // term where it is used; for the hierarchy, the level's name plate. The source is marked by a
    // box around that block and tied to the inset by one leader.
    const focusId = p.focusElement;
    const copyPrefix = 'lz';
    const padB = (b, k) => ({x: b.x - k, y: b.y - k, w: b.w + 2 * k, h: b.h + 2 * k});
    let srcBox, copyMask = null;
    if (focusId === 'term' || focusId === 'article') {
      srcBox = padB(termSpot, 3);
    } else if (focusId === 'definitions' || focusId === 'definition') {
      const e = dpage.entryBoxes[1];
      srcBox = padB({x: pageD.x + e.x, y: pageD.y + e.y, w: e.w, h: e.h}, S * 0.3);
    } else {
      srcBox = padB(slab.bands[dL].plate, 5);
    }
    const makeContent = () => {
      if (focusId === 'term' || focusId === 'article') {
        // only the words wholly inside the window are drawn (the neighbours of the term lie outside it)
        copyMask = {x: srcBox.x - pageA.x - 2, y: srcBox.y - pageA.y - 2, w: srcBox.w + 4, h: srcBox.h + 4, omit: true};
        return g({transform: T(pageA.x, pageA.y)}, articleSheet(ctx, {prefix: `${copyPrefix}-sheet`, ...sheetOpts, copy: true, alignCopy: true, textMask: copyMask}).node);
      }
      if (focusId === 'definitions' || focusId === 'definition') return g({transform: T(pageD.x, pageD.y)}, readablePage(ctx, {prefix: `${copyPrefix}-page`, ...pageOpts, barsHeader: true}).node);
      return hierarchySlab(ctx, {prefix: `${copyPrefix}-slab`, ...slabBox, levels: p.hierarchy, fs, plateMax, floor, textMask: {...padB(srcBox, 2), omit: true}}).node;
    };
    // the article page's level tab sticks out of its right edge
    // the band between the cards and the pages is kept for the relation captions (never the inset)
    const capBand = {x: 0, y: cardTop, w: BW, h: pageA.y - cardTop};
    const lensObstacles = [...obstacles, {...pageA, w: pageA.w + 36}, capBand, tag ? tag.box : null, {x: 0, y: BH - stripH - 8, w: BW, h: stripH + 8}].filter(Boolean);
    const baseObstacleCount = lensObstacles.length;
    const lineSamples = samples.flat();
    const zooms = [1.9, 1.7, 1.5, 1.35, 1.25, 1.15, 1.1, 1.05];
    const ownPart = {term: 'article', article: 'article', hierarchy: 'hierarchy', definitions: 'definitions', definition: 'definitions'}[focusId] || 'hierarchy';
    const leaderObstacles = [...Object.entries(boxes).filter(([id]) => id !== ownPart).map(([, b]) => b), slabTitleBox,
      ...slab.bands.filter((b, i) => !(focusId === 'hierarchy' && i === dL)).map(b => b.plate)];
    const ownBox = boxes[ownPart];
    // point on a box's edge on the way from its centre towards q
    const edgeTo = (bx, q) => {
      const c = centerOf(bx);
      const ux = q.x - c.x, uy = q.y - c.y;
      const t0 = Math.min(Math.abs(ux) > 1e-6 ? bx.w / 2 / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-6 ? bx.h / 2 / Math.abs(uy) : Infinity);
      return pt(c.x + ux * t0, c.y + uy * t0);
    };
    // the leader: straight from the source marker to the inset, or (when that would cross another
    // part or plate) out of the side of its own part first
    const leaderVariants = rb => {
      const c0 = centerOf(srcBox), cd = centerOf(rb);
      const out = [[edgeTo(srcBox, cd), edgeTo(padB(rb, 6), c0)]];
      for (const side of [cd.x < c0.x ? -1 : 1, cd.x < c0.x ? 1 : -1]) {
        const sx = side < 0 ? srcBox.x : srcBox.x + srcBox.w;
        const ox = side < 0 ? Math.min(ownBox.x, srcBox.x) - 16 : Math.max(ownBox.x + ownBox.w, srcBox.x + srcBox.w) + 16;
        const elbow = pt(ox, c0.y);
        out.push([pt(sx, c0.y), elbow, edgeTo(padB(rb, 6), elbow)]);
        if (ox < rb.x - 20 || ox > rb.x + rb.w + 20) {
          const yy = clamp(c0.y, rb.y + 10, rb.y + rb.h - 10);
          out.push([pt(sx, c0.y), elbow, pt(ox, yy), pt(ox < rb.x ? rb.x - 6 : rb.x + rb.w + 6, yy)]);
        }
      }
      return out;
    };
    let leaderExtra = [];
    const polyCross = pts => {
      let n = 0;
      for (const ob of [...leaderObstacles, ...leaderExtra]) {
        let hit = false;
        for (let i = 1; i < pts.length && !hit; i++) {
          for (let k = 0; k <= 20; k++) {
            const q = mix(pts[i - 1], pts[i], k / 20);
            if (q.x > ob.x && q.x < ob.x + ob.w && q.y > ob.y && q.y < ob.y + ob.h) { hit = true; break; }
          }
        }
        if (hit) n++;
      }
      return n;
    };
    const leaderFor = rb => {
      let best = null;
      for (const v of leaderVariants(rb)) {
        const n = polyCross(v);
        if (!best || n < best.n) best = {pts: v, n};
        if (n === 0) break;
      }
      return best;
    };
    const search = (zoom, allowLines) => {
      const w = srcBox.w * zoom, hgt = srcBox.h * zoom;
      let best = null, bestS = Infinity;
      for (let y = 12; y + hgt <= BH - stripH - 12; y += 14) {
        for (let x = 12; x + w <= BW - 12; x += 14) {
          const rb = {x, y, w, h: hgt};
          if (lensObstacles.some(ob => overlaps(padB(rb, 10), ob, 4))) continue;
          const onLines = lineSamples.filter(q => q.x > x - 16 && q.x < x + w + 16 && q.y > y - 16 && q.y < y + hgt + 16).length;
          if (onLines && !allowLines) continue;
          const cross = leaderFor(rb).n;
          if (cross && !allowLines) continue;
          const score = onLines * 3000 + cross * 2000 + Math.hypot(x + w / 2 - (srcBox.x + srcBox.w / 2), y + hgt / 2 - (srcBox.y + srcBox.h / 2));
          if (score < bestS) { bestS = score; best = {...rb, onLines}; }
        }
      }
      return best;
    };
    let dest, leaderBest, leader, leaderPts, lensKeep;
    const findLens = extra => {
      dest = null;
      lensObstacles.length = baseObstacleCount;
      lensObstacles.push(...extra);
      // (plan B: the leader keeps off the captions too)
      leaderExtra = extra;
      // an inset clear of every relation line first (smaller zoom if needed); only then one over a line
      for (const allowLines of [false, true]) {
        for (const zoom of zooms) {
          const best = search(zoom, allowLines);
          if (best) { dest = best; break; }
        }
        if (dest) break;
      }
      if (!dest) dest = {x: srcBox.x, y: srcBox.y, w: srcBox.w * 1.05, h: srcBox.h * 1.05, onLines: -1};
      leaderBest = leaderFor(dest);
      leader = leaderBest.pts;
      leaderPts = [];
      for (let i = 1; i < leader.length; i++) for (let k = 0; k <= 12; k++) leaderPts.push(mix(leader[i - 1], leader[i], k / 12));
      lensKeep = [padB(dest, 10)];
    };
    let forced = 0;
    const placeLabels = withLens => {
      labelBoxes.length = 0;
      forced = 0;
      const keepSave = lensKeep, ptsSave = leaderPts;
      if (!withLens) { lensKeep = []; leaderPts = []; }
      if (ctx.show('all')) {
        conns.forEach((x, i) => {
          const {rel, c} = x;
          const text = rel.label || p.relationLabels[rel.kind] || t[rel.kind] || rel.kind;
          const size = Math.max(floor, 20 * fs);
          // (no variant is narrower than the caption's longest word: words never break)
          const lwC = Math.max(0, ...String(text).split(/\s+/).map(wd => ctx.measure(wd, size, 600, 'sans'))) + size * 1.4;
          const optsFor = nc => ({anchor: 'middle', maxWidth: Math.max(lwC, [300, 130, 95, 78][nc] * fs), size, minSize: size, maxLines: nc ? 6 : 3, fill: th.card, stroke: kindColor(ctx, rel.kind), name: `rel${i}-lab`, weight: 600});
          const probes = [0, 1, 2, 3].map(nc => chip(ctx, text, {...optsFor(nc), x: 0, y: 0}).box);
          const boxAt = (q, k) => ({x: q.x - probes[k].w / 2, y: q.y - probes[k].h / 2, w: probes[k].w, h: probes[k].h});
          const crossesOther = b => samples.some((ss, j) => j !== i && ss.some(q => q.x > b.x - 4 && q.x < b.x + b.w + 4 && q.y > b.y - 4 && q.y < b.y + b.h + 4));
          const clear = b => inside(b) && !obstacles.some(q => overlaps(b, q, 6)) && !labelBoxes.some(q => overlaps(b, q, 6)) && !crossesOther(b) && !lensKeep.some(q => overlaps(b, q, 6)) && !leaderPts.some(q => q.x > b.x - 6 && q.x < b.x + b.w + 6 && q.y > b.y - 6 && q.y < b.y + b.h + 6);
          const cands = [];
          for (const k of [0, 1, 2, 3]) {
            // on the line at its middle only when enough line shows on both sides
            const mid = c.at(0.5);
            const along = Math.abs(Math.cos(mid.a ?? 0)) * probes[k].w + Math.abs(Math.sin(mid.a ?? 0)) * probes[k].h;
            if (c.total >= along + 110) cands.push([mid, k]);
            for (const tt of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82, 0.12, 0.88, 0.07, 0.93, 0.03, 0.97]) {
              const q = c.at(tt);
              const a3 = q.a ?? 0;
              const n = pt(-Math.sin(a3), Math.cos(a3));
              const ext = Math.abs(n.x) * probes[k].w / 2 + Math.abs(n.y) * probes[k].h / 2;
              // the side facing away from the middle of the scene first (the middle keeps the focus lens free)
              const outer = (n.x * (q.x - BW / 2) + n.y * (q.y - BH / 2)) >= 0 ? 1 : -1;
              for (const extra of [12, 30, 56, 90]) for (const side of [outer, -outer]) cands.push([pt(q.x + n.x * side * (ext + extra), q.y + n.y * side * (ext + extra)), k]);
            }
          }
          let pick = cands.find(([q, k]) => clear(boxAt(q, k)));
          // else: ON its own line (the line passes under its caption) where the line runs in free space
          if (!pick) {
            const onLine = [];
            for (const k of [0, 1, 2, 3]) for (const tt of [0.06, 0.94, 0.1, 0.9, 0.15, 0.85, 0.22, 0.78, 0.3, 0.7, 0.4, 0.6]) onLine.push([c.at(tt), k]);
            pick = onLine.find(([q, k]) => clear(boxAt(q, k)));
          }
          if (!pick) {
            forced++;
            let best = null, bestA = Infinity;
            for (const [q, k] of cands) {
              const b = boxAt(q, k);
              if (!inside(b)) continue;
              const ov = [...obstacles, ...labelBoxes].reduce((acc, ob) => acc + area(b, ob), 0) + lensKeep.reduce((acc, ob) => acc + area(b, ob) * 4, 0);
              if (ov < bestA) { bestA = ov; best = [q, k]; }
            }
            pick = best || [c.at(0.5), 0];
          }
          const [q, k] = pick;
          const lab = chip(ctx, text, {...optsFor(k), x: q.x, y: q.y - probes[k].h / 2});
          x.lab = lab;
          x.labBox = lab.box;
          labelBoxes.push(lab.box);
        });
      }
      lensKeep = keepSave; leaderPts = ptsSave;
    };
    const lensOk = () => dest.onLines === 0 && leaderBest.n === 0 && !labelBoxes.some(b => lensKeep.some(q => overlaps(b, q, 0))) && !labelBoxes.some(b => leaderPts.some(q => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h));
    findLens([]);
    placeLabels(true);
    if (!lensOk() || forced) {
      // plan B: the captions' own free places first, the inset in what is left
      const scoreA = (lensOk() ? 0 : 10) + forced;
      placeLabels(false);
      const labs = labelBoxes.map(q => ({...q}));
      findLens(labs);
      placeLabels(true);
      const scoreB = (lensOk() ? 0 : 10) + forced;
      if (scoreB > scoreA) { findLens([]); placeLabels(true); }
    }
    const lensClear = lensOk();
    // the source marker never crosses another text: captions, the slab title, other plates
    const textBoxes = [...labelBoxes, slabTitleBox, ...slab.bands.filter((b, i) => i !== dL || focusId !== 'hierarchy').map(b => b.plate)];
    const srcClear = !textBoxes.some(b => overlaps(srcBox, b, 1));
    const content = makeContent();
    const lens = rectLens(ctx, {name: 'focus-lens', source: srcBox, dest, content, bg: th.dark ? '#2a2f36' : '#fbfaf6', color: th.accent});
    const detail = srcBox;

    // the lifted cards are clipped to what lies OUTSIDE their page while they rise from it:
    // a card slides out from under the page edge instead of printing over the page's text
    const liftClip = pg => ({x: pg.x - 2, y: pg.y - 2, w: pg.w + 40, h: pg.h + 16});
    const cardBars = {definition: defCard.barsRight <= defCard.right + 0.5};
    return {nRows, BW, BH, mode, boxes, slab, sheet, dpage, termCard, defCard, cardA, cardD, pageA, pageD, conns, route, hidden, visitT, order, legendParts, tag, focusId, aL, dL, fs, termSpot, entrySpot, slabBox, lens, detail, dest, copyPrefix, srcBox, srcClear, lensClear, leader, liftClip, cardBars, capA, capD, labelsForced: forced};
  },
  build(ctx, L) {
    const th = ctx.theme;
    const el = (id, ...kids) => g({name: `el-${id}`}, ...kids);
    const tr = 15 * L.fs;
    return g(null,
      el('hierarchy', L.slab.node),
      el('article', g({transform: T(L.pageA.x, L.pageA.y)}, L.sheet.node), L.capA && L.capA.node),
      el('definitions', g({transform: T(L.pageD.x, L.pageD.y)}, L.dpage.node), L.capD && L.capD.node),
      L.conns.map(x => x.c.node),
      // each lifted card is clipped to the outside of its own page (the clip follows the page)
      ['term', 'definition'].map(id => {
        const pb = L.liftClip(id === 'term' ? L.pageA : L.pageD);
        const E = 20000;
        return g(null,
          h('defs', null, h('clipPath', {id: ctx.id(`lift-${id}`)}, h('path', {name: `lift-${id}-r`, 'clip-rule': 'evenodd', d: `M${-E} ${-E}H${E}V${E}H${-E}ZM${r(pb.x)} ${r(pb.y)}h${r(pb.w)}v${r(pb.h)}h${r(-pb.w)}Z`}))),
          g({'clip-path': ctx.ref(`lift-${id}`)},
            el(id, g({transform: T(id === 'term' ? L.cardA.x : L.cardD.x, id === 'term' ? L.cardA.y : L.cardD.y)}, (id === 'term' ? L.termCard : L.defCard).node))));
      }),
      // the marker runs on the connectors, under the relation captions
      g({name: 'tracer', opacity: 0},
        h('circle', {r: r(tr * 2), fill: th.accent, opacity: 0.22}),
        h('circle', {r: r(tr), fill: th.accent, stroke: th.paper, 'stroke-width': 4}),
        h('circle', {r: r(tr * 0.36), fill: th.paper})),
      L.conns.map((x, i) => x.lab && g({name: `rel${i}-lg`, opacity: 0}, x.lab.node)),
      L.lens.node,
      // one leader from the source marker to the lens (instead of two cone lines across the page text)
      h('path', {name: 'focus-leader', d: L.leader.map((q, i) => `${i ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: th.accent, 'stroke-width': 3, 'stroke-dasharray': '9 7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0}),
      g({name: 'legend', opacity: 0}, L.legendParts),
      L.tag && L.tag.node,
    );
  },
  frame(ctx, L, u) {
    const nodes = {};
    const E = ease.inOutCubic;
    // separate: pages rise out of their bands, cards lift off their spots
    const sep = seg(u, 0.02, 0.17);
    const lift = (box, from, k) => {
      const e = E(clamp(k));
      const c = {x: box.x + box.w / 2, y: box.y + box.h / 2};
      const x = lerp(from.x - c.x, 0, e), y = lerp(from.y - c.y, 0, e);
      const sc = lerp(0.25, 1, e);
      return `${T(x, y)} ${scaleAbout(c.x, c.y, sc)}`;
    };
    const bandFace = (i, left) => { const b = L.slab.bands[i].box; return {x: left ? b.x + 30 : b.x + b.w - 30, y: b.y + b.h / 2}; };
    const pageSep = seg(u, 0.02, 0.12), cardSep = seg(u, 0.08, 0.17);
    const trA = lift(L.pageA, bandFace(L.aL, true), pageSep), trD = lift(L.pageD, bandFace(L.dL, false), pageSep);
    nodes['el-article'] = {transform: trA, opacity: pageSep > 0 ? 1 : 0};
    nodes['el-definitions'] = {transform: trD, opacity: pageSep > 0 ? 1 : 0};
    nodes['lift-term-r'] = {transform: trA};
    nodes['lift-definition-r'] = {transform: trD};
    const ts = L.termSpot, es = L.entrySpot;
    // a card rises from under its spot on the page; it shows only where it has left the page
    const cardOp = cardSep > 0 ? 1 : 0;
    const termFrom = {x: ts.x + ts.w / 2, y: ts.y + ts.h / 2}, defFrom = {x: es.x + es.w / 2, y: es.y + es.h / 2};
    nodes['el-term'] = {transform: lift(L.boxes.term, termFrom, cardSep), opacity: cardOp};
    nodes['el-definition'] = {transform: lift(L.boxes.definition, defFrom, cardSep), opacity: cardOp};
    // semantics: where each card is now, and whether it lies over its (moving) page
    const boxNow = (box, from, k) => {
      const e = E(clamp(k));
      const c = {x: lerp(from.x, box.x + box.w / 2, e), y: lerp(from.y, box.y + box.h / 2, e)};
      const sc = lerp(0.25, 1, e);
      return {x: c.x - box.w * sc / 2, y: c.y - box.h * sc / 2, w: box.w * sc, h: box.h * sc};
    };
    const clipNow = (pg, from, k) => {
      const b = L.liftClip(pg);
      return boxNow(b, from, k);
    };
    const liftState = [
      ['term', L.boxes.term, termFrom, L.pageA, bandFace(L.aL, true)],
      ['definition', L.boxes.definition, defFrom, L.pageD, bandFace(L.dL, false)],
    ].map(([id, box, from, pg, face]) => {
      const cb = boxNow(box, from, cardSep);
      const pb = clipNow(pg, face, pageSep);
      return {id, visible: cardOp > 0, overPage: cardOp > 0 && overlaps(cb, pb), clippedToOutside: true};
    });
    nodes['el-hierarchy'] = {transform: ''};
    // relate: connectors draw in the supplied order
    const n = L.conns.length;
    const drawAt = i => BEATS.relate[0] + ((BEATS.relate[1] - BEATS.relate[0] - 0.06) * i) / Math.max(1, n);
    L.conns.forEach((x, i) => {
      const pr = seg(u, drawAt(i), drawAt(i) + 0.07);
      Object.assign(nodes, x.c.frame(E(pr), pr > 0 ? 1 : 0));
      if (x.lab) nodes[`rel${i}-lg`] = {opacity: r(clamp((pr - 0.6) / 0.4), 3)};
    });
    // trace: the marker follows the drawn relations; inside a part it is hidden (the part lights instead)
    const tracerP = seg(u, ...TRACE);
    const pos = E(tracerP);
    const at = L.route.at(pos);
    const inHidden = L.hidden.some(([a, b]) => pos > a + 1e-4 && pos < b - 1e-4);
    nodes.tracer = {transform: T(at.x, at.y), opacity: tracerP > 0 && tracerP < 1 && !inHidden ? 1 : 0};
    const passed = id => (L.visitT[id] !== undefined && pos >= L.visitT[id] - 1e-6 && tracerP > 0);
    // marks: the term is marked from the start (it is the element in use); bands and the entry light as the marker passes
    const termMarks = sheetMarks('el-article-sheet', cardSep);
    Object.assign(nodes, termMarks);
    const entryOn = passed('definition') || passed('definitions') ? 1 : 0;
    Object.assign(nodes, pageMarks('el-definitions-page', L.nRows, i => (i === 1 ? entryOn : 0)));
    const hierOn = passed('hierarchy');
    const bandOn = i => (hierOn && (i === L.aL || i === L.dL) ? 1 : 0);
    L.slab.bands.forEach((b, i) => { nodes[`el-hierarchy-slab-band${i}-ring`] = {opacity: bandOn(i)}; });
    nodes['el-term-card-ring'] = {opacity: passed('term') ? 1 : 0};
    nodes['el-definition-card-ring'] = {opacity: passed('definition') ? 1 : 0};
    // focus lens: opens when the marker reaches the focus part; a real copy of its detail, enlarged
    const vt = L.visitT[L.focusId] ?? 1;
    let lo = 0, hi = 1;
    for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (E(mid) < vt - 1e-6) lo = mid; else hi = mid; }
    const uReach = TRACE[0] + hi * (TRACE[1] - TRACE[0]);
    const lensP = E(seg(u, uReach, uReach + 0.07));
    // the lens opens IN PLACE at its free destination (it never slides across other text):
    // it grows and fades in there while the source ring and the cone lines appear.
    // No dimming rectangle: the rim, the source ring and the cone lines carry the focus.
    Object.assign(nodes, L.lens.frame(lensP > 0 ? 1 : 0));
    // the inset fades in where it stands (no growing text)
    nodes['focus-lens-win'] = {opacity: r(lensP, 3)};
    nodes['focus-lens-src'] = {opacity: r(lensP, 3)};
    nodes['focus-leader'] = {opacity: r(lensP, 3)};
    // the copy carries the same marks as its original
    const cp = L.copyPrefix;
    if (L.focusId === 'article' || L.focusId === 'term') Object.assign(nodes, sheetMarks(`${cp}-sheet`, cardSep));
    else if (L.focusId === 'definitions' || L.focusId === 'definition') Object.assign(nodes, pageMarks(`${cp}-page`, L.nRows, i => (i === 1 ? entryOn : 0)));
    else L.slab.bands.forEach((b, i) => { nodes[`${cp}-slab-band${i}-ring`] = {opacity: bandOn(i)}; });
    // gather
    const gath = seg(u, 0.78, 0.86);
    nodes.legend = {opacity: r(gath, 3)};
    if (L.tag) nodes['state-tag'] = {opacity: r(seg(u, 0.84, 0.92), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const drawn = L.conns.map((x, i) => seg(u, drawAt(i), drawAt(i) + 0.07) >= 1);
    return {nodes, semantic: {
      beat,
      tracer: P2(at),
      tracerProgress: r(tracerP, 3),
      tracerVisible: nodes.tracer.opacity > 0,
      visited: L.order.filter(id => passed(id)),
      order: L.order,
      visitT: Object.fromEntries(Object.entries(L.visitT).map(([k, v]) => [k, r(v, 3)])),
      drawn,
      connectors: L.conns.map(x => ({from: x.rel.from, to: x.rel.to, kind: x.rel.kind, arrow: LINK_STYLES[x.rel.kind].arrow, start: P2(x.c.from), end: P2(x.c.to),
        startIn: overlaps({x: x.c.from.x - 1, y: x.c.from.y - 1, w: 2, h: 2}, L.boxes[x.rel.from], 16), endIn: overlaps({x: x.c.to.x - 1, y: x.c.to.y - 1, w: 2, h: 2}, L.boxes[x.rel.to], 16),
        label: x.labBox ? {x: r(x.labBox.x), y: r(x.labBox.y), w: r(x.labBox.w), h: r(x.labBox.h)} : null})),
      focus: L.focusId,
      focusScale: r(1 + (L.lens.zoom - 1) * lensP, 3),
      focusLens: r(lensP, 3),
      lensSource: {x: r(L.srcBox.x), y: r(L.srcBox.y), w: r(L.srcBox.w), h: r(L.srcBox.h)},
      lensDest: {x: r(L.dest.x), y: r(L.dest.y), w: r(L.dest.w), h: r(L.dest.h)},
      bandsMarked: hierOn ? [L.aL, L.dL] : [],
      entryLit: entryOn === 1,
      separated: sep >= 1,
      articleLevel: L.aL + 1,
      definitionLevel: L.dL + 1,
      article: P2({x: L.pageA.x, y: L.pageA.y}),
      lift: liftState,
      lensClear: L.lensClear,
      srcMarkerClear: L.srcClear,
      // the inset window holds the whole detail block (its source is that block)
      lensHoldsDetail: true,
      // every relation caption found a free place (none sits on a part, another caption or a line)
      labelsClear: L.labelsForced === 0,
      cardBarsInside: L.cardBars.definition,
    }};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-02-mechanism',
    title: 'Legislative definition — exploded text: term, levels and definition',
    titleEs: 'Definición legislativa — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Definición legislativa',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'The text is cut open into page bands, one per user-supplied hierarchy level; the article page and the definitions page rise out of their own bands, the term and the supplied definition lift off as cards. Only the supplied relationships are drawn, anchored to real edges and styled by kind (a plain relation has no arrow); a marker follows the traversal order through the bands while the focus element enlarges under a lens.',
    tags: ['definition', 'defined term', 'hierarchy', 'page bands', 'relation', 'tracer', 'lens', 'mechanism'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/definicion-legislativa.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: {...KIT_STRINGS, en: {...KIT_STRINGS.en, ...STRINGS.en}, es: {...KIT_STRINGS.es, ...STRINGS.es}},
  scene,
});
