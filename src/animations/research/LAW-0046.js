/**
 * LAW-0046 — Cita localizada · mechanism
 *
 * Storyboard — an exploded "nested address" (brief beats in brackets):
 *  [0.00–0.18] separate: the reference written on the index card lifts into
 *              the search box and is cut into four colour-coded parts
 *              (source · volume · page · paragraph). The locations the parts
 *              point to emerge from one another — the shelf, the volume out
 *              of its slot, the page out of the volume, the paragraph out of
 *              its page — and settle along a U-shaped route.
 *  [0.18–0.43] relate: only the supplied relationships are drawn, styled by
 *              kind (plain relation = no arrow; communication dashed;
 *              sequence arrowed; causal only when supplied).
 *  [0.43–0.75] trace: a tracer follows the supplied traversal order; as it
 *              reaches each location, the matching part in the search box
 *              pulses and the location takes that part's colour-coded mark
 *              (plate tinted, spine pulled, page number ringed, paragraph
 *              highlighted). The focus element enlarges while passed.
 *  [0.75–1.00] gather: everything stays anchored with origin (card),
 *              transformation (split parts) and state (marks) visible and
 *              a legend of the connection kinds in use.
 * A part missing from the reference leaves an empty dashed compartment and
 * its location gets an empty mark; nothing else is inferred.
 * @module animations/research/LAW-0046
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T, scaleAbout} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {mix, roundRectPath, edgeAnchor} from '../../core/geometry.js';
import {mechanismFields} from '../../schemas/fields.js';
import {chip, statusTag, textBlock} from '../../primitives/annotate.js';
import {relationGraph, kindColor} from '../../frameworks/graph.js';
import {researchFields, citationParts, targetRow, KIT_STRINGS, bookcase, bookRig, indexCard, referenceStrip, panelWithTokens, pageFace, paragraphExcerpt, segColor, segIcon, segToken, splitFade} from './kits/cita-localizada.js';

const ID = 'LAW-0046';
const DURATION = 7000;
const IDS = ['card', 'search', 'library', 'volume', 'page', 'paragraph'];
const LEVELS = ['library', 'volume', 'page', 'paragraph'];
const PART_OF = {library: 'source', volume: 'volume', page: 'page', paragraph: 'paragraph'};
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {card: [0, 0.04], strip: [0.045, 0.11], split: [0.1, 0.17], emerge: [0.03, 0.18], relate: [0.18, 0.43], trace: [0.44, 0.74], tags: [0.78, 0.86]};

const sceneSchema = {
  ...researchFields,
  ...mechanismFields(IDS),
};
sceneSchema.relationships.items.properties.label = {type: 'string', maxLength: 40, description: 'Caption for this relationship (defaults to the caption of its kind)'};

const defaultParams = {
  query: 'Casebook of Examples, 4, 112, ¶ 3',
  sources: ['Journal of Sample Studies', 'Casebook of Examples', 'Practice Notes'],
  citations: [{source: 'Casebook of Examples', volume: 'Vol. 4', page: 'p. 112', paragraph: '¶ 3'}],
  dates: ['Noted on day 12', 'Edition of day 3'],
  pinpointRow: 3,
  elements: [
    {id: 'card', label: 'Index card'},
    {id: 'search', label: 'Search box'},
    {id: 'library', label: 'Library shelf'},
    {id: 'volume', label: 'Volume'},
    {id: 'page', label: 'Page'},
    {id: 'paragraph', label: 'Paragraph'},
  ],
  relationships: [
    {from: 'card', to: 'search', kind: 'communication', label: 'entered as query'},
    {from: 'search', to: 'library', kind: 'sequence', label: 'source → shelf'},
    {from: 'library', to: 'volume', kind: 'relation', label: 'holds'},
    {from: 'volume', to: 'page', kind: 'sequence', label: 'opens at page'},
    {from: 'page', to: 'paragraph', kind: 'sequence', label: 'pinpoint → paragraph'},
  ],
  focusElement: 'paragraph',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (supplied)'},
  traversalOrder: ['card', 'search', 'library', 'volume', 'page', 'paragraph'],
};

/**
 * Hand-placed geometry per shape (canvas units). Boxes are [x, y, w, h];
 * the volume is a closed book given by its centre and cover size.
 */
const PLACES = {
  landscape: {size: [2100, 1000], fs: 1, card: [30, 28, 365, 250], search: [655, 34, 1045, 220], library: [40, 380, 360, 500], volume: [730, 640, 200, 270], page: [1060, 400, 310, 450], paragraph: [1640, 310, 430, 290], legend: [1050, 975], tag: 'below-paragraph'},
  // square: a canvas shaped like the square frame's caption-safe box (no
  // letterboxing), three bands — card → search / shelf → volume → page /
  // paragraph — so the U-route reads left-right, down, and every connector
  // is long enough to read; labels sit where no connector leaves the box
  square: {size: [1440, 1200], fs: 1.07, relSize: 30, relMax: 250, card: [24, 24, 240, 200], search: [540, 24, 876, 206], library: [24, 380, 280, 420], volume: [632, 590, 180, 250], page: [965, 370, 262, 346], paragraph: [800, 900, 560, 190],
    legend: [24, 1070, 'start', 740], tag: 'left-of-paragraph', labelAt: {page: 'right'}},
  // portrait: the card's label stands beside the card, so the short
  // card → search connector has the gap to itself; the shelf is a little
  // shorter and the page starts a little lower, so the shelf's (two-line)
  // label keeps clear of the page mark and of the volume → page connector
  portrait: {size: [1180, 1760], fs: 1, card: [36, 20, 470, 244], search: [36, 380, 1108, 220], library: [36, 745, 410, 392], volume: [915, 950, 220, 300], page: [36, 1302, 280, 308], paragraph: [620, 1330, 524, 270], legend: [590, 1735], tag: 'above-paragraph', labelAt: {card: 'right'},
    // the volume → page connector bows away from the shelf's label
    bend: {'volume-page': -0.14}},
};

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
    const fs = Pl.fs;
    const t = {...KIT_STRINGS.en, ...(KIT_STRINGS[p.locale] || {})};
    const label = id => (p.elements.find(e => e.id === id) || {}).label || '';
    const parts = citationParts(p);
    const partOf = key => parts.find(x => x.key === key);
    const boxOf = key => ({x: Pl[key][0], y: Pl[key][1], w: Pl[key][2], h: Pl[key][3]});
    const centre = b => ({x: b.x + b.w / 2, y: b.y + b.h / 2});

    // --- card (origin: kit card centre)
    const cardB = boxOf('card');
    const card = indexCard(ctx, {prefix: 'card', w: cardB.w, h: cardB.h, title: t.card, reference: p.query, date: p.dates[0] || '', fs});
    const cardC = centre(cardB);

    // --- search box with the four part tokens
    const sB = boxOf('search');
    const {panel, tokens} = panelWithTokens(ctx, {prefix: 'search', tokenPrefix: 'tok', x: sB.x, y: sB.y, w: sB.w, h: sB.h, label: label('search'), fs, parts, tokenSize: 26 * fs});
    const fieldC = {x: panel.field.x + panel.field.w / 2, y: panel.field.y + panel.field.h / 2};
    const stripW = panel.field.w - 16;
    const strip = referenceStrip(ctx, {name: 'strip', text: p.query, maxWidth: stripW, h: panel.field.h - 18, size: 24 * fs, cuts: panel.comps.slice(1).map(c => c.box.x - 5 - fieldC.x)});

    // --- levels, each drawn around its own centre so it can emerge/scale
    const tRow = targetRow(p);
    const libB = boxOf('library');
    const lib = bookcase(ctx, {prefix: 'lib', x: -libB.w / 2, y: -libB.h / 2, w: libB.w, h: libB.h, sources: p.sources, targetRow: tRow, targetFrac: 0.72, fs: fs * 0.95, seedKey: 'cita-case-m'});
    const libBook = bookRig(ctx, {prefix: 'libbook', t: lib.bookT, hB: lib.bookH, cw: lib.bookW, volume: partOf('volume').text, source: p.citations[0].source});
    const spineLocal = {x: lib.target.x, y: lib.target.y};
    const [vx, vy, vw, vh] = Pl.volume;
    const volB = {x: vx - vw / 2, y: vy - vh / 2, w: vw, h: vh};
    const vol = bookRig(ctx, {prefix: 'vol', t: vw * 0.2, hB: vh, cw: vw, volume: partOf('volume').text, source: p.citations[0].source, seedKey: 'cita-book-m'});
    const pageB = boxOf('page');
    const page = pageFace(ctx, {prefix: 'pg', w: pageB.w, h: pageB.h, source: p.citations[0].source, page: partOf('page').text, date: p.dates[1] || '', rows: 5, seedKey: 'cita-page-m'});
    const paraB = boxOf('paragraph');
    const exc = paragraphExcerpt(ctx, {prefix: 'ex', w: paraB.w, h: paraB.h, lines: 4, gutter: 0.2});
    const pin = clamp(p.pinpointRow ?? 3, 1, 5);
    const pinBox = page.paras[pin - 1];

    // colour-coded marks that each location takes when the tracer reaches it
    const markR = 22 * fs;
    const mark = (name, key, present) => {
      const {c, soft} = segColor(ctx, key);
      return g({name, opacity: 0},
        h('circle', {r: markR + 6, fill: present ? soft : th.card, stroke: present ? c : th.accent, 'stroke-width': 3, 'stroke-dasharray': present ? null : '5 5'}),
        present ? h('circle', {r: markR, fill: c}) : null,
        segIcon(key, markR * 0.7, present ? '#ffffff' : th.accent));
    };
    const plate = lib.plates[tRow];
    const marks = {};
    // mark anchors in each level's local coordinates
    const markLocal = {
      library: {x: Math.min(plate.x + plate.w + markR + 10, libB.w / 2 - markR - 8), y: plate.y + plate.h / 2},
      volume: {x: vw / 2 - markR * 0.2, y: -vh / 2 - markR * 0.2},
      page: {x: pageB.w / 2 - markR - 6, y: -pageB.h / 2 - markR * 0.4},
      paragraph: {x: paraB.w / 2 - markR * 0.4, y: -paraB.h / 2 - markR * 0.2},
    };
    LEVELS.forEach(id => { marks[id] = {node: mark(`mark-${id}`, PART_OF[id], partOf(PART_OF[id]).present), at: markLocal[id]}; });

    // focus outlines: where the next level sits inside this one
    const spineOutline = h('path', {name: 'lib-focus', d: roundRectPath(spineLocal.x - lib.bookT - 8, lib.target.top - 8, lib.bookT + 16, lib.bookH + 16, 6), fill: 'none', stroke: segColor(ctx, 'volume').c, 'stroke-width': 3.5, 'stroke-dasharray': '8 6', opacity: 0});
    const rowOutline = h('path', {name: 'pg-focus', d: roundRectPath(pinBox.x - 6 - pageB.w / 2, pinBox.y - 6 - pageB.h / 2, pinBox.w + 12, pinBox.h + 12, 6), fill: 'none', stroke: segColor(ctx, 'paragraph').c, 'stroke-width': 3.5, 'stroke-dasharray': '8 6', opacity: 0});
    const pnum = page.pnumBox;
    const pnumRing = h('ellipse', {name: 'pg-ring', cx: pnum.x + pnum.w / 2 - pageB.w / 2, cy: pnum.y + pnum.h / 2 - pageB.h / 2, rx: pnum.w / 2 + 14, ry: pnum.h / 2 + 10, fill: 'none', stroke: segColor(ctx, 'page').c, 'stroke-width': 3.5, opacity: 0});
    // ribbon bookmark on the volume
    const ribbonC = segColor(ctx, 'volume').c;
    const ribbon = g({name: 'vol-ribbon', opacity: 0},
      h('path', {name: 'vol-ribbon-body', d: `M${r(vw * 0.62)} ${r(-vh / 2 - 2)}h${r(vw * 0.1)}v${r(vh * 0.22)}l${r(-vw * 0.05)} ${r(-vh * 0.04)}l${r(-vw * 0.05)} ${r(vh * 0.04)}Z`, fill: ribbonC, stroke: th.ink, 'stroke-width': 1.6, 'stroke-linejoin': 'round'}));
    // the pinpoint as written: a chip in the part's colour pinned over the
    // excerpt's top-left edge (legible at any length: up to two lines). It
    // keeps clear of where a connector lands on the excerpt (the arrowhead
    // must stay visible): it slides left of that point (overhanging the
    // excerpt's left edge a little if needed), else it wraps narrower.
    const cornerBoxes = {card: boxOf('card'), search: boxOf('search'), library: boxOf('library'), volume: {x: vx - vw / 2, y: vy - vh / 2, w: vw, h: vh}, page: boxOf('page')};
    const paraEnds = p.relationships.filter(x => (x.from === 'paragraph') !== (x.to === 'paragraph') && cornerBoxes[x.from === 'paragraph' ? x.to : x.from])
      .map(x => edgeAnchor(paraB, centre(cornerBoxes[x.from === 'paragraph' ? x.to : x.from]), x.to === 'paragraph' && x.kind !== 'relation' ? 14 : 8));
    const pinY = -paraB.h / 2 - 4;
    const pinMax = Math.min(paraB.w * 0.62, 330 * fs);
    const mkPin = maxWidth => segToken(ctx, {name: 'ex-num', key: 'paragraph', text: partOf('paragraph').text, size: 28 * fs, maxWidth, maxLines: 2, minRatio: 0.9});
    const blocks = (c, cx, e) => {
      const bx = paraB.x + paraB.w / 2 + cx - c.w / 2, by = paraB.y + paraB.h / 2 + pinY - c.h / 2;
      return e.x > bx - 36 && e.x < bx + c.w + 36 && e.y > by - 36 && e.y < by + c.h + 36;
    };
    let pinChip = null, pinX = 0;
    if (ctx.show('key') && partOf('paragraph').present) {
      pinChip = mkPin(pinMax);
      pinX = -paraB.w / 2 + 16 + pinChip.w / 2;
      const e = paraEnds.find(q => blocks(pinChip, pinX, q));
      if (e) {
        // end the chip before the landing point (narrower, two lines, if the
        // room left of it is short)
        const room = e.x - 40 - (paraB.x - 36);
        const sz = 28 * fs; // (segToken: text width = maxWidth − 2.71 × size)
        const whole = mw => !ctx.fit(partOf('paragraph').text, {maxWidth: Math.max(40, mw - sz * 2.71), size: sz, minSize: sz * 0.9, maxLines: 2, weight: 700}).truncated;
        const narrow = room >= pinChip.w ? pinChip : whole(room) ? mkPin(room) : null;
        const cx = narrow ? e.x - 40 - narrow.w / 2 - (paraB.x + paraB.w / 2) : 0;
        if (narrow && !paraEnds.some(q => blocks(narrow, cx, q))) { pinChip = narrow; pinX = cx; }
      }
    }
    // pin chip box (canvas units)
    const pinChipBox = pinChip ? {x: paraB.x + paraB.w / 2 + pinX - pinChip.w / 2, y: paraB.y + paraB.h / 2 + pinY - pinChip.h / 2, w: pinChip.w, h: pinChip.h} : null;

    // level groups (outer: position/emergence; body: focus scaling)
    const levelNodes = {
      library: g({name: 'lv-library'}, g({name: 'lv-library-body'}, lib.node, g({name: 'libbook-g'}, libBook.node), spineOutline, marks.library.node)),
      volume: g({name: 'lv-volume'}, g({name: 'lv-volume-body'}, g({transform: T(-vw / 2, 0)}, vol.node, ribbon), marks.volume.node)),
      page: g({name: 'lv-page'}, g({name: 'lv-page-body'}, g({transform: T(-pageB.w / 2, -pageB.h / 2)}, page.node), rowOutline, pnumRing, marks.page.node)),
      paragraph: g({name: 'lv-paragraph'}, g({name: 'lv-paragraph-body'}, g({transform: T(-paraB.w / 2, -paraB.h / 2)}, exc.node), marks.paragraph.node,
        pinChip ? g({transform: T(pinX, pinY)}, pinChip.node) : null)),
    };
    // position marks inside their groups
    const markTransforms = Object.fromEntries(LEVELS.map(id => [`mark-${id}`, markLocal[id]]));

    const placed = {
      library: centre(libB),
      volume: {x: vx, y: vy},
      page: centre(pageB),
      paragraph: centre(paraB),
    };
    // emergence sources: each level comes out of the previous one
    const spineWorld = {x: placed.library.x + spineLocal.x - lib.bookT / 2, y: placed.library.y + spineLocal.y};
    const pinWorld = {x: placed.page.x + pinBox.x + pinBox.w / 2 - pageB.w / 2, y: placed.page.y + pinBox.y + pinBox.h / 2 - pageB.h / 2};
    const emergeFrom = {library: placed.library, volume: spineWorld, page: placed.volume, paragraph: pinWorld};
    const emergeScale = {library: 0.7, volume: lib.bookH / vh, page: 0.3, paragraph: pinBox.w / paraB.w};

    // --- element label chips (key labels) and element boxes for connectors
    const chipSize = 28 * fs;
    const side = id => (Pl.labelAt && Pl.labelAt[id]) || 'below';
    const labels = {};
    const obstacles = [];
    const addLabel = (id, x, y, anchor = 'middle', maxWidth = 360 * fs, maxLines = 2) => {
      if (!ctx.show('key') || !label(id)) return;
      const c = chip(ctx, label(id), {x, y, anchor, maxWidth, size: chipSize, maxLines, name: `lab-${id}`});
      labels[id] = c;
      obstacles.push(c.box);
    };
    if (side('card') === 'right' && ctx.show('key') && label('card')) {
      // beside the card, vertically centred on it
      const mw = Math.min(360 * fs, S.w - (cardB.x + cardB.w + 20) - 12);
      const hh = chip(ctx, label('card'), {x: 0, y: 0, maxWidth: mw, size: chipSize, maxLines: 2}).box.h;
      addLabel('card', cardB.x + cardB.w + 20, cardC.y - hh / 2, 'start', mw);
    } else addLabel('card', cardC.x, cardB.y + cardB.h + 12);
    addLabel('library', placed.library.x, libB.y + libB.h + 12);
    addLabel('volume', vx, volB.y + volB.h + 14, 'middle', 240 * fs);
    if (side('page') === 'right') addLabel('page', pageB.x + pageB.w + 16, pageB.y + pageB.h * 0.55, 'start', Math.min(360 * fs, S.w - (pageB.x + pageB.w + 16) - 12), 3);
    else addLabel('page', placed.page.x, pageB.y + pageB.h + 16);
    addLabel('paragraph', placed.paragraph.x, paraB.y + paraB.h + 14);
    const elements = {
      card: {box: cardB},
      search: {box: sB},
      library: {box: libB},
      volume: {box: volB},
      page: {box: pageB},
      paragraph: {box: paraB},
    };
    // descriptive state tag and legend (placed before the relation labels, which avoid them)
    const kinds = [...new Set(p.relationships.map(x => x.kind))];
    const legendSize = 26 * fs;
    const legend = ctx.show('all') ? legendNode(ctx, kinds, p.relationLabels, {x: Pl.legend[0], y: Pl.legend[1], anchor: Pl.legend[2] || 'middle', maxWidth: Pl.legend[3] || S.w, up: !Pl.legend[2]}, legendSize) : null;
    const depth = parts.findIndex(x => !x.present) === -1 ? 4 : parts.findIndex(x => !x.present);
    const stateText = [t.shelf, t.shelf, t.retrieved, t.pageOpened, t.located][depth] || t.shelf;
    const tagAt = Pl.tag === 'below-paragraph'
      ? {x: placed.paragraph.x, y: (labels.paragraph ? labels.paragraph.box.y + labels.paragraph.box.h : paraB.y + paraB.h) + 16, anchor: 'middle'}
      : Pl.tag === 'left-of-paragraph'
        ? {x: paraB.x - 24, y: paraB.y + paraB.h / 2 - 26 * fs * 0.875, anchor: 'end'}
        : {x: paraB.x + paraB.w - 48 * fs, y: paraB.y - 26 * fs * 1.75 - 30, anchor: 'end'}; // clear of the corner mark
    if (Pl.tag === 'above-paragraph' && pinChipBox && ctx.show('key')) {
      // and clear of the pinpoint chip when the two share the same columns
      const tw = statusTag(ctx, stateText, {...tagAt, size: 26 * fs, maxWidth: 420 * fs}).box;
      if (tw.x < pinChipBox.x + pinChipBox.w + 12) tagAt.y = Math.min(tagAt.y, pinChipBox.y - 14 - 26 * fs * 1.75);
    }
    const tag = ctx.show('key') ? statusTag(ctx, stateText, {...tagAt, size: 26 * fs, name: 'state-tag', color: depth >= 4 ? th.accent4 : th.inkSoft, maxWidth: 420 * fs}) : null;
    if (tag) obstacles.push(tag.box);
    if (legend) obstacles.push(legend.box);
    // the pinpoint chip is an obstacle for relation labels too
    if (pinChipBox) obstacles.push({x: pinChipBox.x - 4, y: pinChipBox.y - 4, w: pinChipBox.w + 8, h: pinChipBox.h + 8});
    // relation captions: large type; very long captions get a bounded smaller
    // size so they keep a clear place of their own (never truncated)
    const longest = Math.max(...p.relationships.map(x => (x.label || p.relationLabels[x.kind] || x.kind).length));
    const relSize = Pl.relSize ? Pl.relSize * (longest > 26 ? 0.84 : 1) : 24 * fs;
    const graph = relationGraph(ctx, {name: 'rel', elements, relationships: p.relationships, relationLabels: p.relationLabels, chipSize: relSize, chipMax: Pl.relMax ?? 240 * fs, obstacles, separateLabels: true, bounds: {x: 0, y: 0, w: S.w, h: S.h - 56},
      bend: rel => (Pl.bend && Pl.bend[`${rel.from}-${rel.to}`]) ?? (rel.kind === 'communication' ? -0.2 : 0.14)});
    // relation captions: clear of every other connector, on their own
    // connector only when both of its ends stay visible (see placeRelationLabels)
    const markBoxes = LEVELS.map(id => {
      const R = markR + 9;
      const c = {x: placed[id].x + markLocal[id].x, y: placed[id].y + markLocal[id].y};
      return {x: c.x - R, y: c.y - R, w: R * 2, h: R * 2};
    });
    const relLabels = ctx.show('all') ? placeRelationLabels(ctx, graph, {name: 'rel', relationLabels: p.relationLabels, size: relSize, chipMax: Pl.relMax ?? 240 * fs,
      obstacles: [...Object.values(elements).map(e => e.box), ...obstacles, ...markBoxes], bounds: {x: 4, y: 4, w: S.w - 8, h: S.h - 8}}) : null;
    const route = graph.route(p.traversalOrder);
    const visitT = Object.fromEntries(route.visits.map(v => [v.id, v.t]));
    // every connector must land on its element (edge anchor within tolerance)
    const onEdge = (pt, b) => {
      const dx = Math.max(b.x - pt.x, 0, pt.x - (b.x + b.w));
      const dy = Math.max(b.y - pt.y, 0, pt.y - (b.y + b.h));
      return Math.hypot(dx, dy) <= 18;
    };
    const connectorsLand = graph.conns.every(x => onEdge(x.c.from, elements[x.rel.from].box) && onEdge(x.c.to, elements[x.rel.to].box));

    // held layout: no two annotations (element labels, state tag, pinpoint
    // chip, location marks, legend, relation captions) touch, and no
    // connector runs through an annotation other than its own caption
    const notes = [
      ...Object.entries(labels).map(([id, c]) => ({name: `lab-${id}`, box: c.box})),
      tag && {name: 'state-tag', box: tag.box},
      pinChipBox && {name: 'ex-num', box: pinChipBox},
      legend && {name: 'legend', box: legend.box},
      ...LEVELS.map(id => {
        const R = markR + 6;
        return {name: `mark-${id}`, box: {x: placed[id].x + markLocal[id].x - R, y: placed[id].y + markLocal[id].y - R, w: R * 2, h: R * 2}};
      }),
      ...(relLabels ? relLabels.boxes.map((b, i) => ({name: `rel-l${i}`, box: b})) : []),
    ].filter(Boolean);
    const touch = (a, b, pad) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
    const clashes = [];
    notes.forEach((a, i) => notes.slice(i + 1).forEach(b => { if (touch(a.box, b.box, 2)) clashes.push(`${a.name}~${b.name}`); }));
    graph.conns.forEach((x, i) => {
      for (const n of notes) {
        if (n.name === `rel-l${i}`) continue;
        const b = n.box;
        for (let k = 0; k <= 80; k++) {
          const q = x.c.at(k / 80);
          if (q.x > b.x - 2 && q.x < b.x + b.w + 2 && q.y > b.y - 2 && q.y < b.y + b.h + 2) { clashes.push(`c${i}~${n.name}`); break; }
        }
      }
    });

    return {relLabels, hasPinNum: Boolean(pinChip), S, s, ox, oy, fs, card, cardC, cardB, panel, tokens, strip, stripW, fieldC, lib, libBook, spineLocal, vol, page, exc, pin, pinBox, levelNodes, markTransforms, placed, emergeFrom, emergeScale, labels, graph, route, visitT, legend: legend && legend.node, tag, parts, connectorsLand, clashes, depth, vw, vh, pageB, paraB};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.graph.node,
      // the reference strip starts under the card and emerges from it
      L.strip.node,
      g({name: 'card-g', transform: T(L.cardC.x, L.cardC.y)}, L.card.node),
      L.panel.node,
      L.levelNodes.library, L.levelNodes.volume, L.levelNodes.page, L.levelNodes.paragraph,
      Object.values(L.labels).map(c => c.node),
      L.relLabels ? L.relLabels.node : L.graph.labelsNode,
      L.tokens.map(x => x.node),
      L.tag && L.tag.node,
      L.graph.tracerNode('tracer'),
      L.legend,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const reduced = ctx.reduced;
    // --- separate: card, strip into the search box, split into parts
    nodes['card-g'] = {transform: T(L.cardC.x, L.cardC.y), opacity: r(seg(u, ...W.card), 3)};
    if (L.labels.card) nodes['lab-card'] = {opacity: r(seg(u, ...W.card), 3)};
    const sp = ease.inOutSine(seg(u, ...W.strip));
    const refStart = {x: L.cardC.x, y: L.cardC.y + L.card.refBox.y + 20};
    const stripAt = {x: lerp(refStart.x, L.fieldC.x, sp), y: lerp(refStart.y, L.fieldC.y, sp) - Math.sin(sp * Math.PI) * 50};
    const split = seg(u, ...W.split);
    // the strip is gone before the compartments and parts fade in (no double exposure)
    Object.assign(nodes, splitFade(split, 'search', L.panel.comps, 'strip'));
    nodes.strip = {...nodes.strip, transform: T(stripAt.x, stripAt.y, 0, lerp(L.card.refBox.w / L.stripW, 1, sp)), opacity: u >= W.strip[0] ? nodes.strip.opacity : 0};
    // a present part's token stays in its compartment: its ghost icon stays hidden
    L.tokens.forEach(tk => { if (tk.present) nodes[`search-comp${tk.i}-icon`] = {opacity: 0}; });
    nodes['search-btn'] = {transform: T(L.panel.button.x, L.panel.button.y, 0, 1 - 0.12 * (split > 0 && split < 0.4 ? Math.sin((split / 0.4) * Math.PI) : 0))};

    // --- trace timing
    const tp = seg(u, ...W.trace);
    const tt = ease.inOutSine(tp);
    const tracerOn = u >= W.trace[0] && u < W.trace[1] + 0.03;
    const tpos = L.route.poly.at(tt);
    nodes.tracer = {transform: T(tpos.x, tpos.y), opacity: tracerOn ? 1 : 0};
    const reachedAt = id => {
      const vt = L.visitT[id];
      if (vt === undefined) return 0;
      if (u >= W.trace[1]) return 1;
      return u >= W.trace[0] ? clamp((tt - vt + 0.005) / 0.05) : 0;
    };
    const pulse = id => {
      const vt = L.visitT[id];
      if (vt === undefined || !tracerOn) return 0;
      return clamp(1 - Math.abs(tt - vt) / 0.08);
    };

    // --- tokens: split out of the strip into compartments; pulse when their location is reached
    const splitE = ease.inOutCubic(split);
    const tokPos = {};
    L.tokens.forEach(tk => {
      const comp = {x: tk.comp.cx, y: tk.comp.cy};
      const lvl = LEVELS.find(id => PART_OF[id] === tk.key);
      const k = 1 + 0.16 * ease.inOutSine(pulse(lvl)) * (reduced ? 0.5 : 1);
      const pos = mix({x: tk.comp.cx, y: L.fieldC.y}, comp, splitE);
      nodes[`tok-${tk.key}`] = {transform: T(pos.x, pos.y, 0, lerp(0.55, 1, splitE) * k), opacity: tk.present ? splitFade.token(split) : 0};
      tokPos[tk.key] = {x: r(pos.x), y: r(pos.y)};
    });

    // --- levels emerge from one another, then hold their places
    const levelPos = {};
    LEVELS.forEach((id, i) => {
      const w0 = W.emerge[0] + i * 0.033;
      const e = ease.inOutSine(seg(u, w0, w0 + 0.07));
      const from = L.emergeFrom[id], to = L.placed[id];
      const pos = mix(from, to, e);
      const k = lerp(L.emergeScale[id], 1, e);
      nodes[`lv-${id}`] = {transform: T(pos.x, pos.y, 0, k), opacity: r(clamp(e * 4), 3)};
      levelPos[id] = {x: r(pos.x), y: r(pos.y)};
      if (L.labels[id]) nodes[`lab-${id}`] = {opacity: r(clamp((e - 0.6) / 0.4), 3)};
      const focus = id === p.focusElement ? 0.18 : 0.06;
      const kb = 1 + (reduced ? focus * 0.5 : focus) * ease.inOutSine(pulse(id));
      nodes[`lv-${id}-body`] = {transform: scaleAbout(0, 0, kb)};
      const m = L.markTransforms[`mark-${id}`];
      const got = reachedAt(id);
      nodes[`mark-${id}`] = {transform: T(m.x, m.y, 0, lerp(0.4, 1, ease.outCubic(got))), opacity: r(clamp(got * 3), 3)};
    });
    // non-level elements pulse as well when they are the focus
    for (const id of ['card', 'search']) {
      if (id !== p.focusElement) continue;
      const kb = 1 + 0.12 * ease.inOutSine(pulse(id));
      if (id === 'card') nodes['card-g'].transform = `${T(L.cardC.x, L.cardC.y)} scale(${r(kb, 4)})`;
    }

    // --- location states (only when that part is present)
    const present = key => L.parts.find(x => x.key === key).present;
    const st = {
      library: present('source') ? reachedAt('library') : 0,
      volume: present('volume') ? reachedAt('volume') : 0,
      page: present('page') ? reachedAt('page') : 0,
      paragraph: present('paragraph') ? reachedAt('paragraph') : 0,
    };
    // shelf: plate tinted, the volume slides forward out of its slot
    const tRow = L.lib.target.row;
    nodes[`lib-plate${tRow}-tint`] = {stroke: st.library > 0.5 ? segColor(ctx, 'source').c : 'none'};
    const pullE = ease.inOutCubic(st.volume);
    Object.assign(nodes, L.libBook.frame({x: L.spineLocal.x, y: L.spineLocal.y + pullE * 10, k: 1 + pullE * 0.1, turn: 0, open: 0, lifted: pullE}));
    nodes['lib-focus'] = {opacity: r(clamp(st.volume * 2), 3)};
    // volume: closed, ribbon marks the volume part
    Object.assign(nodes, L.vol.frame({x: 0, y: 0, k: 1, turn: 1, open: 0}));
    nodes['vol-ribbon'] = {opacity: r(clamp(st.volume * 3), 3), transform: `translate(0 ${r(-18 * (1 - ease.outCubic(st.volume)))})`};
    // page: number ringed, pinpoint row outlined + highlighted
    nodes['pg-ring'] = {opacity: r(clamp(st.page * 2), 3)};
    nodes['pg-focus'] = {opacity: r(clamp(st.paragraph * 2), 3)};
    nodes['pg-hl'] = L.page.hlAt(L.pin, ease.inOutSine(st.paragraph));
    // paragraph excerpt: highlight sweeps
    nodes['ex-hl'] = {width: r(L.exc.hl.w * ease.inOutSine(st.paragraph))};
    if (L.hasPinNum) nodes['ex-num'] = {opacity: r(clamp(st.paragraph * 2), 3)};

    // --- relations drawn one by one
    const n = p.relationships.length;
    const relP = i => ease.inOutCubic(seg(u, W.relate[0] + (i * (W.relate[1] - W.relate[0])) / n, W.relate[0] + ((i + 1) * (W.relate[1] - W.relate[0])) / n));
    Object.assign(nodes, L.graph.frame(relP));

    if (L.tag) nodes['state-tag'] = {opacity: r(seg(u, ...W.tags), 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    return {
      nodes,
      semantic: {
        beat,
        tracer: {x: r(tpos.x), y: r(tpos.y)},
        tracerVisible: tracerOn,
        strip: {x: r(stripAt.x), y: r(stripAt.y)},
        split: r(split, 3),
        lvLibrary: levelPos.library, lvVolume: levelPos.volume, lvPage: levelPos.page, lvParagraph: levelPos.paragraph,
        tokSource: tokPos.source, tokVolume: tokPos.volume, tokPage: tokPos.page, tokPara: tokPos.paragraph,
        located: Object.fromEntries(LEVELS.map(id => [id, r(st[id], 3)])),
        highlight: r(st.paragraph, 3),
        relationsDrawn: p.relationships.map((_, i) => r(relP(i), 3)),
        visitOrder: L.route.visits.map(v => v.id),
        kinds: p.relationships.map(x => x.kind),
        arrowOnRelation: false,
        connectorsLand: L.connectorsLand,
        relLabelsClear: L.relLabels ? L.relLabels.clear : true,
        annotationClashes: L.clashes,
        missing: L.parts.filter(x => !x.present).map(x => x.key),
      },
    };
  },
};

/**
 * Relation captions placed by the scene. The graph helper only keeps captions
 * clear of boxes; here a caption must also stay clear of every OTHER
 * connector, and it sits on its own connector only when both ends of that
 * connector (arrowhead included) stay visible beside it. Otherwise it moves
 * beside the connector, as close as the free space allows, with a short
 * dotted leader that crosses no other connector or label. Node names match the
 * graph's (`<name>-lg<i>` groups driven by `graph.frame`).
 * @returns {{node:any, boxes:any[], clear:boolean}}
 */
function placeRelationLabels(ctx, graph, o) {
  const N = 72;
  const paths = graph.conns.map(x => {
    const pts = [];
    for (let i = 0; i <= N; i++) pts.push(x.c.at(i / N));
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y);
    return {pts, len: x.c.total, bb: {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)}};
  });
  const hit = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  const inBox = (q, b, pad) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;
  // does the polyline pass through the (padded) box?
  const pathHits = (path, b, pad) => {
    if (!hit(path.bb, b, pad)) return false;
    const pts = path.pts;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], c = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(c.x - a.x, c.y - a.y) / 5));
      for (let k = 0; k <= n; k++) if (inBox({x: a.x + ((c.x - a.x) * k) / n, y: a.y + ((c.y - a.y) * k) / n}, b, pad)) return true;
    }
    return false;
  };
  const cross = (p1, p2, p3, p4) => {
    const d = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    return d(p1, p2, p3) * d(p1, p2, p4) < 0 && d(p3, p4, p1) * d(p3, p4, p2) < 0;
  };
  const segHitsPath = (a, b, path) => path.pts.some((q, i) => i > 0 && cross(a, b, path.pts[i - 1], q));
  const segHitsBox = (a, b, box, pad) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 5));
    for (let k = 1; k < n; k++) if (inBox({x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n}, box, pad)) return true;
    return false;
  };
  const B = o.bounds;
  const inside = b => b.x >= B.x && b.y >= B.y && b.x + b.w <= B.x + B.w && b.y + b.h <= B.y + B.h;
  const placed = [];
  const leaders = [];
  let allClear = true;
  const groups = graph.conns.map((x, i) => {
    const rel = x.rel;
    const text = rel.label || o.relationLabels[rel.kind] || rel.kind;
    const color = kindColor(ctx, rel.kind);
    const make = (cx, cy, hh) => chip(ctx, text, {x: cx, y: cy - hh / 2, anchor: 'middle', maxWidth: o.chipMax, size: o.size, maxLines: 2, fill: ctx.theme.card, stroke: color, name: `${o.name}-l${i}`, weight: 600});
    const probe = make(0, 0, 0).box;
    const hw = probe.w / 2, hh = probe.h / 2;
    const own = paths[i];
    const others = paths.filter((_, j) => j !== i);
    const free = b => inside(b)
      && !o.obstacles.some(q => hit(b, q, 6))
      && !placed.some(q => hit(b, q, 8))
      && !others.some(pth => pathHits(pth, b, 11))
      && !leaders.some(l => segHitsBox(l.a, l.b, b, 4));
    const head = rel.kind === 'relation' ? 0 : 18;
    const minEnd = 30;
    let best = null;
    // 1) on the connector, both ends visible beside it
    for (const t of [0.5, 0.44, 0.56, 0.38, 0.62, 0.32, 0.68]) {
      const P = x.c.at(t);
      const b = {x: P.x - hw, y: P.y - hh, w: probe.w, h: probe.h};
      if (!free(b)) continue;
      const inIdx = own.pts.map((q, k) => (inBox(q, b, 3) ? k : -1)).filter(k => k >= 0);
      if (!inIdx.length) continue;
      const before = (Math.min(...inIdx) / N) * own.len, after = ((N - Math.max(...inIdx)) / N) * own.len;
      if (before >= minEnd && after >= minEnd + head) { best = {P, c: {x: P.x, y: P.y}, lead: false}; break; }
    }
    // 2) beside the connector with a leader, nearest free place first
    if (!best) {
      let bestScore = Infinity;
      const dirs = Array.from({length: 24}, (_, k) => (k * Math.PI * 2) / 24);
      for (let gap = 8; gap <= 460 && gap <= bestScore; gap += 8) {
        for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
          const score = gap + Math.abs(t - 0.5) * own.len * 0.35;
          if (score >= bestScore) continue;
          const P = x.c.at(t);
          for (const a of dirs) {
            const ux = Math.cos(a), uy = Math.sin(a);
            const ext = Math.min(Math.abs(ux) > 1e-6 ? hw / Math.abs(ux) : Infinity, Math.abs(uy) > 1e-6 ? hh / Math.abs(uy) : Infinity);
            const c = {x: P.x + ux * (gap + ext), y: P.y + uy * (gap + ext)};
            const b = {x: c.x - hw, y: c.y - hh, w: probe.w, h: probe.h};
            if (!free(b) || pathHits(own, b, 12)) continue;
            // leader: connector point → nearest point of the caption
            const q = {x: Math.max(b.x, Math.min(P.x, b.x + b.w)), y: Math.max(b.y, Math.min(P.y, b.y + b.h))};
            if (others.some(pth => segHitsPath(P, q, pth))) continue;
            if (placed.some(pb => segHitsBox(P, q, pb, 2)) || o.obstacles.some(ob => segHitsBox(P, q, ob, 0))) continue;
            best = {P, c, q, lead: gap > 10};
            bestScore = score;
            break;
          }
        }
      }
    }
    let lab, leader = null;
    if (best) {
      lab = make(best.c.x, best.c.y, probe.h);
      if (best.lead) {
        leader = {x1: r(best.P.x), y1: r(best.P.y), x2: r(best.q.x), y2: r(best.q.y)};
        leaders.push({a: best.P, b: best.q});
      }
    } else {
      // no free place: keep the graph's own placement (reported as not clear)
      allClear = false;
      lab = x.lab;
      if (x.leader) leader = x.leader;
    }
    placed.push(lab.box);
    return g({name: `${o.name}-lg${i}`, opacity: 0},
      leader ? h('line', {...leader, stroke: color, 'stroke-width': 2.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}) : null,
      lab.node);
  });
  return {node: g({name: `${o.name}-labels`}, groups), boxes: placed, clear: allClear};
}

function legendNode(ctx, kinds, labels, at, size) {
  const th = ctx.theme;
  const items = kinds.map(k => ({k, text: labels[k] || k}));
  const gap = size * 1.8;
  const widths = items.map(it => size * 2.3 + ctx.measure(it.text, size, 500, 'sans'));
  // rows: items wrap to a new row when the next one would exceed maxWidth
  const maxW = at.maxWidth ?? Infinity;
  const rows = [[]];
  let rowW = 0;
  items.forEach((it, i) => {
    const add = (rows[rows.length - 1].length ? gap : 0) + widths[i];
    if (rows[rows.length - 1].length && rowW + add > maxW) { rows.push([]); rowW = 0; }
    rows[rows.length - 1].push(i);
    rowW += rows[rows.length - 1].length > 1 ? gap + widths[i] : widths[i];
  });
  const rowH = size * 1.7;
  const parts = [];
  let bx0 = Infinity, bx1 = -Infinity;
  rows.forEach((row, ri) => {
    const total = row.reduce((a, i) => a + widths[i], 0) + gap * (row.length - 1);
    let x = at.anchor === 'start' ? at.x : at.anchor === 'end' ? at.x - total : at.x - total / 2;
    bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x + total);
    // rows grow downwards from `at.y`, or upwards when the legend sits on the canvas bottom
    const y = at.up ? at.y - (rows.length - 1 - ri) * rowH : at.y + ri * rowH;
    row.forEach(i => {
      const it = items[i];
      const color = kindColor(ctx, it.k);
      const dash = it.k === 'communication' ? '10 8' : null;
      const arrow = it.k !== 'relation';
      parts.push(g({transform: T(x, y)},
        h('line', {x1: 0, x2: size * 1.8, y1: 0, y2: 0, stroke: color, 'stroke-width': it.k === 'causal' ? 5 : 3.5, 'stroke-dasharray': dash}),
        arrow ? h('path', {d: `M${r(size * 1.8)} 0l-12 -7l3 7l-3 7z`, fill: color}) : h('circle', {cx: size * 1.8, cy: 0, r: 5, fill: color}),
        arrow ? null : h('circle', {cx: 0, cy: 0, r: 5, fill: color}),
        h('text', {x: size * 2.2, y: size * 0.35, 'font-size': size, 'font-weight': 500, 'font-family': "'Avenir Next', 'Segoe UI', Helvetica, Arial, sans-serif", fill: th.fg}, it.text)));
      x += widths[i] + gap;
    });
  });
  const top = at.up ? at.y - (rows.length - 1) * rowH : at.y;
  return {node: g({name: 'legend'}, parts), box: {x: bx0 - 8, y: top - size * 0.8, w: bx1 - bx0 + 16, h: rowH * (rows.length - 1) + size * 1.6}};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-02-mechanism',
    title: 'Located citation — the reference as a nested address',
    titleEs: 'Cita localizada — Mecanismo o relación explicada',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Cita localizada',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded nested address: the written reference is split in the search box into source, volume, page and paragraph parts; the shelf, volume, page and paragraph emerge from one another along a U-shaped route; connectors styled by relation kind are drawn, and a tracer follows the traversal order while each location takes its part’s colour-coded mark and the paragraph is highlighted.',
    tags: ['citation', 'reference', 'mechanism', 'nested', 'search box', 'bookshelf', 'page', 'paragraph', 'tracer', 'relations'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/cita-localizada.js', 'src/frameworks/graph.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
