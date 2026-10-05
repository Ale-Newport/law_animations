/**
 * LAW-0122 — Texto y contexto · mechanism
 *
 * Storyboard (exploded view on a plain ground, no desk and no hand; the
 * nesting word ⊂ passage ⊂ article ⊂ book ⊂ rack is laid out in space):
 *  [0.00–0.18] separate: the article lifts off the open book's page as a loose
 *              sheet, its passage lifts off the sheet as a paper strip, and
 *              the key word lifts off the strip as a token that grows under a
 *              magnifier. Every part leaves a dashed outline where it was.
 *  [0.18–0.43] relate: only the supplied relationships are drawn, each line
 *              anchored to the edge of a component at the place the part came
 *              from; relation = plain line with end dots (no arrow),
 *              sequence = arrow, causal only when the author supplies it.
 *  [0.43–0.75] trace: a tracer follows traversalOrder along those lines; the
 *              focus component is enlarged while the tracer is on it.
 *  [0.75–1.00] gather: the enlarged word leaves the lens and re-seats in its
 *              passage; once it has settled, a copy lifts clear above it, flies
 *              down onto the measured box of the key word in the full article,
 *              rests there and cross-fades into that word's highlight;
 *              origin outlines, the enlarged token and the state stay visible;
 *              both readings appear as attributed cards (neither is endorsed).
 * @module animations/sources/LAW-0122
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, ease, lerp, r} from '../../core/time.js';
import {polyline, edgeAnchor, circleAnchor, roundRectPath} from '../../core/geometry.js';
import {chip} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {FONTS, measure} from '../../core/text.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  sourcesFields, tcMechanismFields, TC_DEFAULTS, TC_STRINGS, kitStrings, articleLayout, articleArt, openBookArt, shelfArt, bookPlate, lupaArt,
  paperSheet, paperStrip, wordToken, readingCard, sourceColor, drawRect, leader, relLine, MECH_IDS, segHitsBox,
} from './kits/texto-y-contexto.js';

const ID = 'LAW-0122';
const DURATION = 7000;
const BEATS = {separate: [0, 0.18], relate: [0.18, 0.43], trace: [0.43, 0.75], gather: [0.75, 1]};
const W = {
  sheet: [0.015, 0.085], strip: [0.08, 0.14], token: [0.13, 0.178], lupa: [0.16, 0.19],
  relate: [0.19, 0.42], trace: [0.44, 0.745],
  // gather: the word re-seats in its passage; only once it has settled does a
  // copy appear, lifted clear above it, fly to the article and drop onto the
  // measured box of the key word there, then cross-fade into its highlight
  seat: [0.76, 0.83], copyIn: [0.834, 0.845], fold: [0.845, 0.852], back: [0.852, 0.9], drop: [0.9, 0.91], land: [0.91, 0.935], fade: [0.913, 0.935], cards: [0.918, 0.978],
};

const sceneSchema = {...sourcesFields, ...tcMechanismFields};

const defaultParams = {
  ...TC_DEFAULTS,
  elements: [
    {id: 'word', label: 'Key word, enlarged'},
    {id: 'passage', label: 'Its passage'},
    {id: 'article', label: 'Full article'},
    {id: 'book', label: 'Book: Source A'},
    {id: 'rack', label: 'Author’s ordering'},
  ],
  relationships: [
    {from: 'word', to: 'passage', kind: 'relation', label: 'appears in'},
    {from: 'passage', to: 'article', kind: 'relation', label: 'part of'},
    {from: 'article', to: 'book', kind: 'relation', label: 'printed in'},
    {from: 'book', to: 'rack', kind: 'relation', label: 'placed by the author'},
  ],
  focusElement: 'word',
  relationLabels: {relation: 'relation', communication: 'communication', sequence: 'sequence', causal: 'causal (as supplied)'},
  traversalOrder: ['word', 'passage', 'article', 'book', 'rack'],
};

/**
 * Stage geometry per shape (design units). Boxes [x, y, w, h]; the sheet and
 * strip heights are fitted to their text (h = maximum). token: lens centre +
 * radius; handle: magnifier handle angle (deg); wordCap: where the lens
 * caption sits; cards: [x, y, w]; leads: where each card leader lands.
 * Gaps between components are wide enough for the relation labels to sit
 * BESIDE their lines (never on them).
 */
const GEO = {
  // content: size of every supplied text (≥ ~16 px at 1080p in each ratio);
  // cap/label: generic captions and relation labels, capped at the content size
  landscape: {size: [2040, 900],
    rack: [20, 70, 330], book: [476, 250, 580, 380], sheet: [1180, 60, 420, 640], strip: [1700, 60, 320, 240],
    token: [1850, 500, 100], handle: 42, content: 23, shelf: 22, cap: 23, label: 22, cardSize: 23, sheetSize: 23, stripSize: 28, tokenSize: 58, header: 19,
    wordCap: 'belowLeft',
    cards: {isolated: [1560, 712, 470], contextual: [1060, 712, 480]}},
  // square: recomposed so that the article, readings, credits, level labels
  // and book names stay ≥ 16 px (22 units) and no caption outsizes them
  square: {size: [1240, 1000],
    rack: [12, 44, 380], book: [436, 100, 300, 170], sheet: [880, 62, 350, 740], strip: [452, 600, 360, 190],
    token: [214, 716, 58], handle: 150, content: 22, shelf: 22, cap: 22, label: 22, cardSize: 24, bySize: 0.92, sheetSize: 22, stripSize: 24, tokenSize: 40, header: 15,
    wordCap: 'tab', leadC: 'right',
    cards: {isolated: [12, 812, 600], contextual: [628, 812, 600]}},
  portrait: {size: [1000, 1500],
    rack: [556, 40, 424], book: [20, 140, 380, 290], sheet: [20, 690, 440, 560], strip: [560, 690, 420, 220],
    token: [760, 1090, 110], handle: 45, content: 22, shelf: 21, cap: 22, label: 22, cardSize: 23, sheetSize: 26, stripSize: 29, tokenSize: 60, header: 16,
    wordCap: 'belowLeft',
    cards: {isolated: [520, 1300, 460], contextual: [20, 1300, 440]}},
};

const byId = (list, id) => list.find(e => e.id === id);

/** Point on the side of `parent` that faces `child`, placed at the slot's coordinate. */
function parentEdgePoint(parent, slot, childC, pad = 8) {
  const P = parent;
  const sc = {x: slot.x + slot.w / 2, y: slot.y + slot.h / 2};
  const dxR = childC.x - (P.x + P.w), dxL = P.x - childC.x, dyB = childC.y - (P.y + P.h), dyT = P.y - childC.y;
  const m = Math.max(dxR, dxL, dyB, dyT);
  const cl = (v, a, b) => Math.max(a + 18, Math.min(b - 18, v));
  if (m === dxR) return {x: P.x + P.w + pad, y: cl(sc.y, P.y, P.y + P.h), side: 'right'};
  if (m === dxL) return {x: P.x - pad, y: cl(sc.y, P.y, P.y + P.h), side: 'left'};
  if (m === dyB) return {x: cl(sc.x, P.x, P.x + P.w), y: P.y + P.h + pad, side: 'bottom'};
  return {x: cl(sc.x, P.x, P.x + P.w), y: P.y - pad, side: 'top'};
}

/** Point on a given side of `parent`, at the slot's coordinate (kept off the corners). */
function sidePoint(P, slot, side, pad = 8) {
  const sc = {x: slot.x + slot.w / 2, y: slot.y + slot.h / 2};
  const cl = (v, a, b) => Math.max(a + 18, Math.min(b - 18, v));
  if (side === 'right') return {x: P.x + P.w + pad, y: cl(sc.y, P.y, P.y + P.h), side};
  if (side === 'left') return {x: P.x - pad, y: cl(sc.y, P.y, P.y + P.h), side};
  if (side === 'bottom') return {x: cl(sc.x, P.x, P.x + P.w), y: P.y + P.h + pad, side};
  return {x: cl(sc.x, P.x, P.x + P.w), y: P.y - pad, side};
}

/** Point on a box edge facing `toward`, kept away from the corners. */
function childEdgePoint(B, toward, pad = 8) {
  const q = edgeAnchor(B, toward, pad);
  const cl = (v, a, b) => Math.max(a + 18, Math.min(b - 18, v));
  if (Math.abs(q.x - (B.x - pad)) < 1 || Math.abs(q.x - (B.x + B.w + pad)) < 1) return {x: q.x, y: cl(q.y, B.y, B.y + B.h)};
  return {x: cl(q.x, B.x, B.x + B.w), y: q.y};
}

const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
const ptIn = (q, b, pad = 0) => q.x > b.x - pad && q.x < b.x + b.w + pad && q.y > b.y - pad && q.y < b.y + b.h + pad;

const scene = {
  sizes: {landscape: GEO.landscape.size, square: GEO.square.size, portrait: GEO.portrait.size},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = kitStrings(p.locale);
    const shape = ctx.view.shape;
    const G = GEO[shape];
    const [SW, SH] = G.size;
    const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s) / 2;
    const oy = (ctx.design.h - SH * s) / 2;
    const box = a => ({x: a[0], y: a[1], w: a[2], h: a[3]});
    const P = p.passages;
    const kp = Math.min(P.wordPassage ?? 0, P.lines.length - 1);
    const read = p.sources[0];

    // --- rack (hierarchy) -------------------------------------------------
    // every supplied text of the shelf (caption, level labels, book names) is
    // printed at the content size; the shelf's height follows its text
    const rack = shelfArt(ctx, {prefix: 'rack', x: G.rack[0], y: G.rack[1], w: G.rack[2], levels: p.hierarchy.levels, sources: p.sources, caption: p.hierarchy.caption, size: G.shelf});
    const rackBox = rack.box;
    const slot = rack.slotBox || {x: rackBox.x + 20, y: rackBox.y + 20, w: 40, h: 30};

    // --- book with a miniature article (bars) -----------------------------
    const bB = box(G.book);
    const pgR = {x: bB.x + 16 + (bB.w - 32) / 2, y: bB.y + 16, w: (bB.w - 32) / 2, h: bB.h - 32};
    const ALb = articleLayout(ctx, {x: pgR.x + pgR.w * 0.1, y: pgR.y + pgR.h * 0.16, w: pgR.w * 0.8, h: pgR.h * 0.76, heading: P.heading, lines: P.lines, word: P.word, wordPassage: kp, size: 11});
    const artB = articleArt(ctx, ALb, {prefix: 'bart', bars: true});
    // the small open book prints no identity on its pages: its name and title
    // are on a readable plate attached under it (content size)
    const book = openBookArt(ctx, {prefix: 'book', x: bB.x, y: bB.y, w: bB.w, h: bB.h, color: sourceColor(ctx, 0), source: read, art: artB, headerSize: G.header, pageText: false});
    const plate = bookPlate(ctx, {name: 'book-plate', x: bB.x + 10, y: bB.y + bB.h + 8, w: bB.w - 20, size: G.content, color: sourceColor(ctx, 0), source: read});
    const bookU = {x: bB.x, y: bB.y, w: bB.w, h: plate.box.y + plate.box.h - bB.y};
    const bookArtBox = {x: ALb.box.x - 6, y: ALb.box.y - 6, w: ALb.box.w + 12, h: ALb.box.h + 12};

    // --- loose sheet (full article, readable; height fitted to the text) ---
    const sB0 = box(G.sheet);
    const pad = sB0.w * 0.1;
    const ALs = articleLayout(ctx, {x: pad, y: pad * 1.1, w: sB0.w - pad * 2, h: sB0.h - pad * 2.1, heading: P.heading, lines: P.lines, word: P.word, wordPassage: kp, size: G.sheetSize, headLines: 4, headMin: G.sheetSize});
    const sB = {...sB0, h: Math.min(sB0.h, ALs.box.y + ALs.box.h + pad * 1.1)};
    const artS = articleArt(ctx, ALs, {prefix: 'sart', numScale: 1});
    // rings and origin outlines live INSIDE the paper, under the text layer, and
    // are exactly the size of the word's highlight: they can never paint over
    // the letters of the neighbouring words
    const hlLocal = (AL, q) => ({x: q.x - 4, y: q.y - AL.size * 0.12, w: q.w + 8, h: AL.size * 1.18});
    const sPasL = ALs.passages[ALs.key.p];
    const landRing = drawRect('land-ring', hlLocal(ALs, ALs.key), ALs.size * 0.22, th.accent3, 3);
    const originSheet = drawRect('orig-sheet', {x: sPasL.box.x - 8, y: sPasL.box.y - 4, w: sPasL.box.w + 16, h: sPasL.box.h + 8}, 8, th.inkSoft, 2.5, true);
    const sheetNode = paperSheet(ctx, {name: 'sheet-art', w: sB.w, h: sB.h, art: {...artS, hl: g(null, originSheet.node, artS.hl, landRing.node)}});
    const sKey = ALs.key;
    const sPas = ALs.passages[sKey.p];
    const W2 = v => ({x: sB.x + v.x, y: sB.y + v.y, w: v.w, h: v.h});
    const sheetKeyBox = W2({x: sKey.x - 4, y: sKey.y - 4, w: sKey.w + 8, h: sKey.h + 8});
    const sheetPasBox = W2({x: sPas.box.x - 8, y: sPas.box.y - 4, w: sPas.box.w + 16, h: sPas.box.h + 8});

    // --- passage strip (height fitted to the passage) ---------------------
    const tB0 = box(G.strip);
    const spad = G.stripSize * 0.7;
    const ALt = articleLayout(ctx, {x: spad, y: spad * 0.9, w: tB0.w - spad * 2, h: tB0.h - spad * 1.6, heading: null, lines: [P.lines[sKey.p]], word: P.word, wordPassage: 0, size: G.stripSize});
    const tB = {...tB0, h: Math.min(tB0.h, ALt.box.y + ALt.box.h + spad * 0.8)};
    const artT = articleArt(ctx, ALt, {prefix: 'tart', numbers: false});
    const originStrip = drawRect('orig-strip', hlLocal(ALt, ALt.key), ALt.size * 0.22, th.accent3, 2.5, true);
    const seatRing = drawRect('seat-ring', hlLocal(ALt, ALt.key), ALt.size * 0.22, th.accent3, 3);
    const stripNode = paperStrip(ctx, {name: 'strip-art', w: tB.w, h: tB.h, art: {...artT, hl: g(null, originStrip.node, artT.hl, seatRing.node)}});
    const tKey = ALt.key;
    const stripSlotBox = {x: tB.x + tKey.x - 5, y: tB.y + tKey.y - 5, w: tKey.w + 10, h: tKey.h + 10};

    // --- token + magnifier ------------------------------------------------
    const [tcx, tcy, lensR] = G.token;
    const token = wordToken(ctx, {name: 'token-art', text: sKey.text, size: G.tokenSize, maxW: lensR * 1.5});
    const lupa = lupaArt(ctx, {name: 'lupaM', R: lensR, handle: 1.0});
    const rimR = lensR + Math.max(8, lensR * 0.17) * 0.6;
    const lensCircle = {x: tcx, y: tcy, r: rimR};
    const tokenBox = {x: tcx - rimR, y: tcy - rimR, w: rimR * 2, h: rimR * 2};
    const hd = (G.handle * Math.PI) / 180;
    const hEnd = {x: tcx + Math.cos(hd) * lupa.length, y: tcy + Math.sin(hd) * lupa.length};
    const handleBox = {x: Math.min(tcx + Math.cos(hd) * rimR, hEnd.x) - lensR * 0.2, y: Math.min(tcy + Math.sin(hd) * rimR, hEnd.y) - lensR * 0.2,
      w: Math.abs(hEnd.x - (tcx + Math.cos(hd) * rimR)) + lensR * 0.4, h: Math.abs(hEnd.y - (tcy + Math.sin(hd) * rimR)) + lensR * 0.4};

    // --- element boxes for anchoring (final, exploded positions) ------------
    const EL = {
      rack: {box: rackBox, center: {x: rackBox.x + rackBox.w / 2, y: rackBox.y + rackBox.h / 2}},
      book: {box: bookU, center: {x: bookU.x + bookU.w / 2, y: bookU.y + bookU.h / 2}},
      article: {box: sB, center: {x: sB.x + sB.w / 2, y: sB.y + sB.h / 2}},
      passage: {box: tB, center: {x: tB.x + tB.w / 2, y: tB.y + tB.h / 2}},
      word: {box: tokenBox, circle: lensCircle, center: {x: tcx, y: tcy}},
    };
    // where each descendant sits inside each ancestor (its origin)
    const slotIn = {
      passage: {word: stripSlotBox},
      article: {word: sheetKeyBox, passage: sheetPasBox},
      book: {word: bookArtBox, passage: bookArtBox, article: bookArtBox},
      rack: {word: slot, passage: slot, article: slot, book: slot},
    };
    const depth = id => MECH_IDS.indexOf(id);

    // --- component captions: tabs sitting on each component's top edge -------
    const labelOf = id => (byId(p.elements, id) || {}).label;
    // generic captions never outsize the content they name (AUTHORING item 17)
    // (capped at the smallest content size: shelf, article, book plate)
    const capSize = Math.min(G.cap, G.content, G.shelf, G.sheetSize);
    const caps = {};
    const obstacles = [rackBox, bookU, sB, tB, tokenBox, handleBox];
    if (ctx.show('key')) {
      for (const id of MECH_IDS) {
        const text = labelOf(id);
        if (!text) continue;
        let c;
        if (id === 'word') {
          const maxW = 250;
          const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'end', maxWidth: maxW, size: capSize, maxLines: 2});
          let at;
          if (G.wordCap === 'belowLeft') at = {x: tcx - 30, y: tcy + rimR + 14, anchor: 'end'};
          else if (G.wordCap === 'tab') {
            // a tab on the lens's top edge, like the other parts' captions
            const x0 = tcx - rimR * 0.75;
            const mw = G.strip[0] - x0 - 14;
            const pr2 = chip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: capSize, maxLines: 3});
            c = chip(ctx, text, {x: x0, y: tcy - rimR - pr2.box.h + 14, anchor: 'start', maxWidth: mw, size: capSize, maxLines: 3, name: `cap-${id}`, fill: th.card, stroke: th.ink});
          } else if (G.wordCap === 'right') {
            // right of the rim, under the handle, in the gap before the passage strip
            const x0 = tcx + rimR + 10;
            const mw = G.strip[0] - x0 - 14;
            const pr2 = chip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: mw, size: capSize, maxLines: 4});
            c = chip(ctx, text, {x: x0, y: Math.min(tcy + 6, G.cards.isolated[1] - pr2.box.h - 12), anchor: 'start', maxWidth: mw, size: capSize, maxLines: 4, name: `cap-${id}`, fill: th.card, stroke: th.ink});
          }
          else if (G.wordCap === 'left') {
            // beside the rim, level with the glass, above the handle
            const mw = tcx - rimR - 20;
            const pr2 = chip(ctx, text, {x: 0, y: 0, anchor: 'end', maxWidth: mw, size: capSize, maxLines: 3});
            c = chip(ctx, text, {x: tcx - rimR - 12, y: tcy - pr2.box.h * 0.75, anchor: 'end', maxWidth: mw, size: capSize, maxLines: 3, name: `cap-${id}`, fill: th.card, stroke: th.ink});
          } else at = {x: tcx - rimR * 0.2, y: tcy - rimR - 12 - probe.box.h, anchor: 'end'};
          if (at) {
            at.x = Math.max(8 + probe.box.w, at.x);
            c = chip(ctx, text, {...at, maxWidth: maxW, size: capSize, maxLines: 2, name: `cap-${id}`, fill: th.card, stroke: th.ink});
          }
        } else {
          // a tab on the component's top edge; it may overlap that edge by at
          // most 10 units (never the component's own content, e.g. the rack's
          // caption plate): when the component sits near the top of the stage the
          // tab goes to one line, wider, then smaller, then beside the edge
          const b = EL[id].box;
          const maxW = Math.max(200, b.w - 40);
          const wide = Math.max(maxW, SW - 8 - (b.x + 14));
          // (never shrunk: captions are supplied text too)
          const tries = [[capSize, 2, maxW, 'start'], [capSize, 1, wide, 'start'], [capSize, 2, wide, 'start'], [capSize, 1, b.x + b.w - 8, 'end'], [capSize, 2, b.x + b.w - 8, 'end']];
          for (const [sz, lines, mw, anchor] of tries) {
            const probe = chip(ctx, text, {x: 0, y: 0, anchor, maxWidth: mw, size: sz, maxLines: lines, minSize: sz});
            const y = b.y - probe.box.h + 10;
            if (y >= 6 && !probe.fit.truncated) {
              c = chip(ctx, text, {x: anchor === 'end' ? b.x + b.w - 14 : b.x + 14, y, anchor, maxWidth: mw, size: sz, maxLines: lines, minSize: sz, name: `cap-${id}`, fill: th.card, stroke: th.ink});
              break;
            }
          }
          if (!c) {
            const probe = chip(ctx, text, {x: 0, y: 0, anchor: 'start', maxWidth: maxW, size: capSize, maxLines: 2});
            c = chip(ctx, text, {x: b.x + 14, y: Math.max(6, b.y - probe.box.h + 10), anchor: 'start', maxWidth: maxW, size: capSize, maxLines: 2, name: `cap-${id}`, fill: th.card, stroke: th.ink});
          }
          c.intrude = c.box.y + c.box.h - b.y;
        }
        c.node.attrs.opacity = 0;
        caps[id] = c;
        obstacles.push(c.box);
      }
    }

    // --- reading cards (gather) ----------------------------------------------
    const cardFor = (which, at) => readingCard(ctx, {
      name: `card-${which}`, x: at[0], y: at[1], w: at[2], kind: which,
      title: which === 'isolated' ? t.isolated : t.contextual,
      text: p.interpretations[which].text, by: p.interpretations[which].by, proposedBy: t.proposedBy,
      color: which === 'isolated' ? th.accent3 : th.accent2, soft: which === 'isolated' ? th.accent3Soft : th.accent2Soft,
      // reading and credit print at the content size (the kit sets them at 0.95 × size)
      size: G.content / 0.95, maxLines: 3, bySize: 0.95, byLines: 3, textMin: 1, byMin: 0.95,
    });
    const cardI = cardFor('isolated', G.cards.isolated);
    const cardC = cardFor('contextual', G.cards.contextual);
    obstacles.push(cardI.box, cardC.box);

    // --- connectors: supplied relationships only, port to port ---------------
    const bounds = {x: 6, y: 6, w: SW - 12, h: SH - 12};
    const rels = p.relationships.filter(rel => rel.from !== rel.to && EL[rel.from] && EL[rel.to]);
    // routed one by one: each line may bend, land on another edge of its
    // parent or slide its port along that edge, and is scored against the
    // parts it would cross, the lines already routed (no crossings) and the
    // ports already used on the same part (kept ≥ 36 units apart)
    const segX = (p1, p2, p3, p4) => {
      const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
      if (Math.abs(d) < 1e-9) return false;
      const ua = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
      const ub = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
      return ua > 0 && ua < 1 && ub > 0 && ub < 1;
    };
    const lineX = (A, B) => {
      for (let i = 1; i < A.length; i++) for (let j = 1; j < B.length; j++) if (segX(A[i - 1], A[i], B[j - 1], B[j])) return true;
      return false;
    };
    const bboxOf = pts => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const q of pts) { x0 = Math.min(x0, q.x); y0 = Math.min(y0, q.y); x1 = Math.max(x1, q.x); y1 = Math.max(y1, q.y); } return {x: x0, y: y0, w: x1 - x0, h: y1 - y0}; };
    const routeOne = (rel, i, fixed, bends = [0.08, -0.08, 0.25, -0.25]) => {
      const [child, parent] = depth(rel.from) < depth(rel.to) ? [rel.from, rel.to] : [rel.to, rel.from];
      const pe0 = parentEdgePoint(EL[parent].box, slotIn[parent][child], EL[child].center, 10);
      const color = kindColor(ctx, rel.kind);
      const others = [...MECH_IDS.filter(id => id !== rel.from && id !== rel.to && EL[id]).map(id => EL[id].box), handleBox, cardI.box, cardC.box, ...Object.entries(caps).filter(([id]) => id !== rel.from && id !== rel.to).map(([, q]) => q.box)];
      // a line may touch its own two parts only at its ports (never run across them)
      const ownBoxes = [rel.from, rel.to].map(id => EL[id].box);
      const hard = c0 => c0.pts.slice(2, -2).filter(q => others.some(B => ptIn(q, B, 4)) || ownBoxes.some(B => ptIn(q, B, -3))).length;
      const soft = c0 => c0.pts.slice(2, -2).filter(q => others.some(B => ptIn(q, B, 14))).length;
      const P0 = EL[parent].box;
      let c = null;
      for (const side of [pe0.side, ...['left', 'bottom', 'top', 'right'].filter(sd => sd !== pe0.side)]) {
        const base = side === pe0.side ? pe0 : sidePoint(P0, slotIn[parent][child], side, 10);
        for (const off of [0, 40, -40, 80, -80, 120, -120]) {
          const pe = side === 'left' || side === 'right'
            ? {...base, y: Math.max(P0.y + 18, Math.min(P0.y + P0.h - 18, base.y + off))}
            : {...base, x: Math.max(P0.x + 18, Math.min(P0.x + P0.w - 18, base.x + off))};
          if (off && Math.hypot(pe.x - base.x, pe.y - base.y) < Math.abs(off) - 1) continue;
          const ce0 = EL[child].circle ? circleAnchor(EL[child].circle, EL[child].circle.r + 10, pe) : childEdgePoint(EL[child].box, pe, 10);
          const CB = EL[child].box;
          const vertical = !EL[child].circle && (Math.abs(ce0.x - (CB.x - 10)) < 1 || Math.abs(ce0.x - (CB.x + CB.w + 10)) < 1);
          for (const coff of [0, 40, -40, 80, -80]) {
          const Cc = EL[child].circle;
          const rot = a => {
            const a0 = Math.atan2(ce0.y - Cc.y, ce0.x - Cc.x) + a;
            return {x: Cc.x + Math.cos(a0) * (Cc.r + 10), y: Cc.y + Math.sin(a0) * (Cc.r + 10)};
          };
          // (on the lens rim, a port slides round the rim: 40 units ≈ 0.6 rad)
          const ce = coff === 0 ? ce0 : Cc ? rot((coff / 40) * 0.6) : vertical
            ? {x: ce0.x, y: Math.max(CB.y + 18, Math.min(CB.y + CB.h - 18, ce0.y + coff))}
            : {x: Math.max(CB.x + 18, Math.min(CB.x + CB.w - 18, ce0.x + coff)), y: ce0.y};
          if (coff && !Cc && Math.hypot(ce.x - ce0.x, ce.y - ce0.y) < Math.abs(coff) - 1) continue;
          // the child end must face the parent end (not reach round its own box)
          if (!EL[child].circle && ptIn({x: (ce.x + pe.x) / 2, y: (ce.y + pe.y) / 2}, P0, 0)) continue;
          const [from, to] = rel.from === child ? [ce, pe] : [pe, ce];
          const crowd = fixed.reduce((n, o) => n + o.ends.filter(e => (e.id === rel.from && Math.hypot(e.q.x - from.x, e.q.y - from.y) < 36) || (e.id === rel.to && Math.hypot(e.q.x - to.x, e.q.y - to.y) < 36)).length, 0);
          for (const bend of bends) {
            const cand = relLine(ctx, {name: `rel${i}`, from, to, kind: rel.kind, bend, color, width: shape === 'landscape' ? 6 : 5.5});
            const cb = bboxOf(cand.pts);
            const xings = fixed.filter(o => overlaps(cb, o.bb, 1) && lineX(cand.pts, o.pts)).length;
            cand.side = side;
            cand.score = hard(cand) * 1000 + xings * 400 + crowd * 300 + soft(cand) + (Math.abs(off) + Math.abs(coff)) / 60;
            if (!c || cand.score < c.score) c = cand;
          }
          }
        }
        if (c && c.score < 1) break;
      }
      c.crossings = hard(c);
      return {rel, c, color, child, parent, i};
    };
    const asFixed = x => ({pts: x.c.pts, bb: bboxOf(x.c.pts), ends: [{id: x.rel.from, q: x.c.from}, {id: x.rel.to, q: x.c.to}]});
    const conns = [];
    rels.forEach((rel, i) => {
      let x0 = routeOne(rel, i, conns.map(asFixed));
      // no clean route with gentle bends: allow wide arcs
      if (x0.c.score >= 300) {
        const x1 = routeOne(rel, i, conns.map(asFixed), [0.45, -0.45, 0.65, -0.65, 0.85, -0.85]);
        if (x1.c.score < x0.c.score) x0 = x1;
      }
      conns.push(x0);
    });
    // second pass: each line again, with every other line fixed
    for (let k = 0; k < conns.length; k++) {
      const x2 = routeOne(conns[k].rel, conns[k].i, conns.filter((_, j) => j !== k).map(asFixed));
      if (x2.c.score < conns[k].c.score) conns[k] = x2;
    }
    // every line is an obstacle for every label (sampled)
    const lineHit = b => conns.some(x => x.c.pts.some(q => ptIn(q, b, 12)));
    const placed = [];
    // most constrained first: the shortest lines have the fewest places for a label
    for (const x of [...conns].sort((a0, b0) => a0.c.total - b0.c.total)) {
      x.lab = null;
      x.lead = null;
      if (!ctx.show('all')) continue;
      const {c, rel, color, i} = x;
      const text = rel.label || p.relationLabels[rel.kind] || t[rel.kind] || rel.kind;
      const size = Math.min(G.label, G.content, G.shelf, G.sheetSize);
      const dx = c.to.x - c.from.x, dy = c.to.y - c.from.y;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const mid = c.mid;
      const make = (cx, cy, sz, lines, mw) => {
        const pr = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: sz, maxLines: lines});
        return chip(ctx, text, {x: cx, y: cy - pr.box.h / 2, anchor: 'middle', maxWidth: mw, size: sz, maxLines: lines, fill: th.card, stroke: color, name: `rl${i}`, weight: 600});
      };
      const inside = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
      // the leader may meet its line anywhere along the middle stretch
      // (midpoint preferred); `portFor` returns the first clear meeting point
      const ports = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82].map(tt => c.at(tt));
      const hitsVia = (b, q0) => {
        const a = edgeAnchor(b, q0, 2);
        return [...obstacles, ...placed].filter(q => segHitsBox(a, q0, q, 2)).length;
      };
      const portFor = b => ports.find(q0 => !hitsVia(b, q0)) || null;
      const leadClear = b => Boolean(portFor(b));
      const clear = (b, lead = true, pad = 8) => inside(b) && !obstacles.some(q => overlaps(b, q, pad)) && !placed.some(q => overlaps(b, q, pad + 2)) && !lineHit(b) && (!lead || leadClear(b));
      const leadHits = b => Math.min(...ports.map(q0 => hitsVia(b, q0)));
      const specs = [[size, 2, 230], [size, 3, 150], [size, 4, 124]];
      const cands = [];
      for (let d = 16; d <= 240; d += 12) {
        for (const sgn of [1, -1]) {
          for (const [sz, lines, mw] of specs) {
            cands.push(() => {
              const pr = chip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: mw, size: sz, maxLines: lines});
              const ext = Math.abs(nx) * pr.box.w / 2 + Math.abs(ny) * pr.box.h / 2;
              return make(mid.x + nx * sgn * (d + ext), mid.y + ny * sgn * (d + ext), sz, lines, mw);
            });
          }
        }
      }
      // then free spots around the midpoint (nearest first)
      const spots = [];
      for (let gx = bounds.x + 70; gx <= bounds.x + bounds.w - 70; gx += 20) {
        for (let gy = bounds.y + 24; gy <= bounds.y + bounds.h - 24; gy += 16) {
          const dd = Math.hypot(gx - mid.x, gy - mid.y);
          if (dd <= 560 && dd >= 30) spots.push({gx, gy, dd});
        }
      }
      spots.sort((a, b) => a.dd - b.dd);
      for (const sp of spots) cands.push(() => make(sp.gx, sp.gy, size, 4, 160));
      // passes: whole label + clear leader; clear leader; clear leader with a
      // tighter margin; then the clear label box whose leader crosses least
      for (const [strict, pad] of [[true, 8], [false, 8], [false, 2]]) {
        for (const mk of cands) {
          const cand = mk();
          if (clear(cand.box, true, pad) && (!strict || !cand.fit.truncated)) { x.lab = cand; break; }
        }
        if (x.lab) break;
      }
      // no straight clear leader anywhere: an elbowed leader routed around the
      // parts and labels (grid search, string-pulled) from a clear label box
      let leadPts = null;
      if (!x.lab) {
        const lg = 12;
        const gx0 = bounds.x, gy0 = bounds.y, gnx = Math.floor(bounds.w / lg), gny = Math.floor(bounds.h / lg);
        const blockers0 = [...obstacles, ...placed];
        const okPt = (q, own) => q.x > bounds.x && q.y > bounds.y && q.x < bounds.x + bounds.w && q.y < bounds.y + bounds.h && !blockers0.some(o => ptIn(q, o, 4)) && !(own && ptIn(q, own, 2));
        const segOk = (a0, b0, own) => {
          const n = Math.max(2, Math.ceil(Math.hypot(b0.x - a0.x, b0.y - a0.y) / 3));
          for (let k = 1; k < n; k++) if (!okPt({x: lerp(a0.x, b0.x, k / n), y: lerp(a0.y, b0.y, k / n)}, own)) return false;
          return true;
        };
        const plan = (a0, b0, own) => {
          const cell = q => [Math.max(0, Math.min(gnx - 1, Math.floor((q.x - gx0) / lg))), Math.max(0, Math.min(gny - 1, Math.floor((q.y - gy0) / lg)))];
          const cc = (i, j) => ({x: gx0 + (i + 0.5) * lg, y: gy0 + (j + 0.5) * lg});
          const [si, sj] = cell(a0), [ti, tj] = cell(b0);
          const prev = new Int32Array(gnx * gny).fill(-2);
          const qu = [sj * gnx + si];
          prev[qu[0]] = -1;
          const goal = tj * gnx + ti;
          for (let h0 = 0; h0 < qu.length && prev[goal] === -2; h0++) {
            const c0 = qu[h0], ci = c0 % gnx, cj = (c0 - ci) / gnx;
            for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const i2 = ci + di, j2 = cj + dj;
              if (i2 < 0 || j2 < 0 || i2 >= gnx || j2 >= gny) continue;
              const k = j2 * gnx + i2;
              if (prev[k] !== -2) continue;
              if (k !== goal && !okPt(cc(i2, j2), own)) continue;
              prev[k] = c0;
              qu.push(k);
            }
          }
          if (prev[goal] === -2) return null;
          const cells = [];
          for (let k = goal; k !== -1; k = prev[k]) cells.push(cc(k % gnx, (k - (k % gnx)) / gnx));
          cells.reverse();
          const pts = [a0, ...cells.slice(1, -1), b0];
          const out = [pts[0]];
          let i0 = 0;
          while (i0 < pts.length - 1) {
            let j0 = pts.length - 1;
            while (j0 > i0 + 1 && !segOk(pts[i0], pts[j0], own)) j0--;
            out.push(pts[j0]);
            i0 = j0;
          }
          return out;
        };
        for (const mk of cands) {
          const cand = mk();
          if (!clear(cand.box, false, 8)) continue;
          let found = null;
          for (const q0 of ports) {
            const a0 = edgeAnchor(cand.box, q0, 4);
            const pp = plan(a0, q0, cand.box);
            if (!pp) continue;
            let len = 0;
            for (let k = 1; k < pp.length; k++) len += Math.hypot(pp[k].x - pp[k - 1].x, pp[k].y - pp[k - 1].y);
            if (pp.length <= 5 && len < 3 * Math.hypot(q0.x - a0.x, q0.y - a0.y) + 160) { found = pp; break; }
          }
          if (found) { x.lab = cand; leadPts = found; break; }
        }
      }
      if (!x.lab) {
        let best = null, bestHits = Infinity;
        for (const mk of cands) {
          const cand = mk();
          if (!clear(cand.box, false, 2)) continue;
          const hh = leadHits(cand.box);
          if (hh < bestHits) { best = cand; bestHits = hh; }
          if (!hh) break;
        }
        x.lab = best;
      }
      if (!x.lab) {
        // last resort: a box clear of every part and label (it may cross a line)
        for (const mk of cands) {
          const cand = mk();
          if (inside(cand.box) && !obstacles.some(q => overlaps(cand.box, q, 0)) && !placed.some(q => overlaps(cand.box, q, 2))) { x.lab = cand; break; }
        }
      }
      if (!x.lab) x.lab = make(mid.x + nx * 60, mid.y + ny * 60, size, 4, 160);
      // leader: chip edge → a small port on the line (midpoint when clear)
      if (!leadPts) {
        // straight leader from the chip edge point (nearest first, then the
        // edge midpoints and corners) to a port on the line: the first pair
        // whose segment crosses no part or label wins
        const B = x.lab.box;
        const edgePts = q0 => [edgeAnchor(B, q0, 2), {x: B.x + B.w / 2, y: B.y - 2}, {x: B.x + B.w / 2, y: B.y + B.h + 2}, {x: B.x - 2, y: B.y + B.h / 2}, {x: B.x + B.w + 2, y: B.y + B.h / 2},
          {x: B.x + 10, y: B.y - 2}, {x: B.x + B.w - 10, y: B.y - 2}, {x: B.x + 10, y: B.y + B.h + 2}, {x: B.x + B.w - 10, y: B.y + B.h + 2}];
        const blk = [...obstacles, ...placed];
        let pick = null;
        for (const q0 of ports) {
          for (const a0 of edgePts(q0)) if (!blk.some(o => segHitsBox(a0, q0, o, 2))) { pick = [a0, q0]; break; }
          if (pick) break;
        }
        if (!pick) {
          const port = portFor(B) || ports.reduce((bq, q0) => (hitsVia(B, q0) < hitsVia(B, bq) ? q0 : bq), mid);
          pick = [edgeAnchor(B, port, 2), port];
        }
        leadPts = pick;
      }
      placed.push(x.lab.box);
      const port = leadPts[leadPts.length - 1];
      x.leadSeg = leadPts;
      x.lead = g(null,
        h('path', {d: leadPts.map((q, k) => `${k ? 'L' : 'M'}${r(q.x)} ${r(q.y)}`).join(''), fill: 'none', stroke: color, 'stroke-width': 2.4, 'stroke-linejoin': 'round'}),
        h('circle', {cx: r(port.x), cy: r(port.y), r: 5.5, fill: color, stroke: th.paper, 'stroke-width': 2}));
    }

    // --- tracer route along the traversal order ------------------------------
    const pts = [];
    const visits = [];
    const order = p.traversalOrder.filter(id => EL[id]);
    order.forEach((id, i) => {
      if (i === 0) { pts.push(EL[id].center); visits.push({id, idx: 0}); return; }
      const prev = order[i - 1];
      const link = conns.find(x => (x.rel.from === prev && x.rel.to === id) || (x.rel.from === id && x.rel.to === prev));
      if (link) {
        const fwd = link.rel.from === prev;
        pts.push(fwd ? link.c.from : link.c.to);
        for (let k = 1; k <= 30; k++) pts.push(link.c.at(fwd ? k / 30 : 1 - k / 30));
      } else {
        pts.push(EL[prev].circle ? circleAnchor(EL[prev].circle, EL[prev].circle.r, EL[id].center) : edgeAnchor(EL[prev].box, EL[id].center, 4));
        pts.push(EL[id].circle ? circleAnchor(EL[id].circle, EL[id].circle.r, EL[prev].center) : edgeAnchor(EL[id].box, EL[prev].center, 4));
      }
      pts.push(EL[id].center);
      visits.push({id, idx: pts.length - 1});
    });
    const route = polyline(pts.length > 1 ? pts : [pts[0] || {x: 0, y: 0}, pts[0] || {x: 0, y: 0}]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    const tot = cum[cum.length - 1] || 1;
    const visitT = visits.map(v => ({id: v.id, t: cum[v.idx] / tot}));

    // --- gather routes: the word leaves the lens, re-seats in its passage,
    // then (a copy) settles on its line of the full article ---------------------
    const slotC = {x: stripSlotBox.x + stripSlotBox.w / 2, y: stripSlotBox.y + stripSlotBox.h / 2};
    // the copy lands on the MEASURED box of the key word in the full article:
    // centre of the highlight rectangle, at the article's own text size
    const landAt = {x: sB.x + sKey.cx, y: sB.y + sKey.y + 0.46 * ALs.size};
    const keyHl = {x: sB.x + sKey.x - 4, y: sB.y + sKey.y - ALs.size * 0.12, w: sKey.w + 8, h: ALs.size * 1.18};
    const along = (a, b, link, aIsChild) => {
      // follow a supplied line when there is one; otherwise a gentle arc (motion, not a drawn relation)
      if (link) {
        const fwd = aIsChild ? link.rel.from === link.child : link.rel.from !== link.child;
        const mids = Array.from({length: 31}, (_, k) => link.c.at(fwd ? k / 30 : 1 - k / 30));
        return polyline([a, ...mids, b]);
      }
      const ctl = {x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 90};
      return polyline(Array.from({length: 41}, (_, k) => {
        const q = k / 40, u2 = (1 - q) * (1 - q), v2 = 2 * (1 - q) * q, w2 = q * q;
        return {x: u2 * a.x + v2 * ctl.x + w2 * b.x, y: u2 * a.y + v2 * ctl.y + w2 * b.y};
      }));
    };
    const linkWP = conns.find(x => x.child === 'word' && x.parent === 'passage');
    const seatRoute = along({x: tcx, y: tcy}, slotC, linkWP, true);
    // --- the copy's journey ------------------------------------------------
    // 1. it appears as a word card the size of the strip's highlight, lifted
    //    clear of the re-seated word onto free space (no word, label, caption
    //    or connector under it);
    // 2. it folds into a small blank pill and travels through free space to
    //    the article's edge, then along the blank band just above the key
    //    word's line (never over printed text);
    // 3. above the word it drops and unfolds into a card exactly the size of
    //    the word's measured highlight, rests, and cross-fades into it.
    const wordBoxes = (AL, ox0, oy0, skip) => {
      const out = [];
      const S = AL.size;
      AL.head.lines.forEach((ln, j) => {
        let cx = AL.x;
        const sp = measure(' ', AL.head.size, 700, 'serif');
        for (const wd of ln.split(' ')) {
          if (!wd) { cx += sp; continue; }
          const w = measure(wd, AL.head.size, 700, 'serif');
          out.push({x: ox0 + cx, y: oy0 + AL.headY + j * AL.head.lineHeight + AL.head.size * 0.06, w, h: AL.head.size * 0.97});
          cx += w + sp;
        }
      });
      for (const pas of AL.passages) {
        const L0 = pas.lines[0];
        out.push({x: ox0 + AL.x + AL.numW * 0.1, y: oy0 + L0.y + S * 0.2, w: S * 0.5, h: S * 0.62});
        for (const ln of pas.lines) {
          let at = 0;
          for (const wd of ln.text.split(' ')) {
            const x0 = ln.x + measure(ln.text.slice(0, at), S, 400, 'serif');
            const w = measure(wd, S, 400, 'serif');
            at += wd.length + 1;
            if (!wd) continue;
            const b = {x: ox0 + x0, y: oy0 + ln.y + S * 0.06, w, h: S * 0.97};
            if (skip && overlaps(b, skip, -2)) continue;
            out.push(b);
          }
        }
      }
      return out;
    };
    const sheetWords = wordBoxes(ALs, sB.x, sB.y, keyHl);
    const stripWord = {x: tB.x + tKey.x - 4, y: tB.y + tKey.y - ALt.size * 0.12, w: tKey.w + 8, h: ALt.size * 1.18};
    const stripWords = wordBoxes(ALt, tB.x, tB.y, stripWord);
    const labelBoxes = [...Object.values(caps).map(c => c.box), ...conns.filter(x => x.lab).map(x => x.lab.box)];
    const lineDots = conns.flatMap(x => x.c.pts.map(q => ({x: q.x - 4, y: q.y - 4, w: 8, h: 8})));
    const partBoxes = [rackBox, bookU, tokenBox, handleBox];
    // copy card sizes: at the strip (start) and at the article (end)
    const cardT = {w: tKey.w + 8, h: ALt.size * 1.18};
    const cardS = {w: sKey.w + 8, h: ALs.size * 1.18};
    // blank band above the key word's line in the article
    const kLine = sPas.lines[sKey.j];
    let prevBottom;
    if (sKey.j > 0) prevBottom = sPas.lines[sKey.j - 1].y + ALs.size * 1.03;
    else if (sKey.p > 0) { const pp = ALs.passages[sKey.p - 1]; prevBottom = pp.lines[pp.lines.length - 1].y + ALs.size * 1.03; }
    else prevBottom = ALs.head.lines.length ? ALs.headY + ALs.head.height : kLine.y - ALs.size;
    const bandTop = sB.y + prevBottom, bandBot = sB.y + kLine.y + ALs.size * 0.06;
    const pill = {w: Math.min(ALs.size * 1.2, cardS.w), h: Math.max(6, Math.min(ALs.size * 0.3, (bandBot - bandTop) * 0.7))};
    const hover = {x: landAt.x, y: (bandTop + bandBot) / 2};
    const flightObs = [...partBoxes, ...labelBoxes, ...sheetWords, ...stripWords, stripWord];
    const boxAt = (q, z) => ({x: q.x - z.w / 2, y: q.y - z.h / 2, w: z.w, h: z.h});
    // 1. lift point: free space next to the strip word, preferring the side facing the article
    const toT = Math.atan2(hover.y - slotC.y, hover.x - slotC.x);
    const dirs = Array.from({length: 12}, (_, i) => (i * Math.PI) / 6).sort((a, b) => Math.cos(b - toT) - Math.cos(a - toT));
    const inBounds = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;
    const restObs = [...flightObs, ...lineDots];
    let liftPt = null;
    for (const f of [1, 1.3, 1.7, 2.2, 2.8]) {
      for (const a of dirs) {
        const c = {x: slotC.x + Math.cos(a) * (tKey.w / 2 + cardT.w / 2 + 10) * f, y: slotC.y + Math.sin(a) * (tKey.h / 2 + cardT.h / 2 + 8) * f};
        const b = boxAt(c, cardT);
        if (inBounds(b) && !restObs.some(q => overlaps(b, q, 3))) { liftPt = c; break; }
      }
      if (liftPt) break;
    }
    if (!liftPt) liftPt = {x: slotC.x, y: slotC.y - tKey.h / 2 - cardT.h / 2 - 8};
    // 2. free-space path of the pill: lift point → just outside the article's
    //    edge at the band's height → along the band → above the word
    // grid search over free space (cells where the pill touches nothing), then
    // string-pulled into a few straight legs; both article edges are tried
    const gs = 16;
    const nx = Math.floor((bounds.w) / gs), ny = Math.floor((bounds.h) / gs);
    const cellC = (i, j) => ({x: bounds.x + (i + 0.5) * gs, y: bounds.y + (j + 0.5) * gs});
    const pillAt = q => boxAt(q, {w: pill.w + 2, h: pill.h + 2});
    const clearAt = q => inBounds(boxAt(q, pill)) && !flightObs.some(o => overlaps(pillAt(q), o, 0));
    const free = new Uint8Array(nx * ny);
    // a cell is free when the pill there touches nothing; each grid step is
    // also checked at its midpoint (so no step clips an obstacle's corner)
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) free[j * nx + i] = clearAt(cellC(i, j)) ? 1 : 0;
    const segClear = (a, b) => {
      const n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4));
      for (let k = 0; k <= n; k++) if (!clearAt({x: lerp(a.x, b.x, k / n), y: lerp(a.y, b.y, k / n)})) return false;
      return true;
    };
    const nearestFree = q => {
      const cand = [];
      const ci = Math.round((q.x - bounds.x) / gs - 0.5), cj = Math.round((q.y - bounds.y) / gs - 0.5);
      for (let j = Math.max(0, cj - 8); j < Math.min(ny, cj + 9); j++) {
        for (let i = Math.max(0, ci - 8); i < Math.min(nx, ci + 9); i++) {
          if (free[j * nx + i]) { const c = cellC(i, j); cand.push({i, j, d: Math.hypot(c.x - q.x, c.y - q.y)}); }
        }
      }
      cand.sort((a, b) => a.d - b.d);
      const hit = cand.find(c => segClear(q, cellC(c.i, c.j)));
      return hit ? [hit.i, hit.j] : null;
    };
    const bfs = (s0, t0) => {
      const prev = new Int32Array(nx * ny).fill(-2);
      const qu = [s0[1] * nx + s0[0]];
      prev[qu[0]] = -1;
      for (let h0 = 0; h0 < qu.length; h0++) {
        const c = qu[h0];
        if (c === t0[1] * nx + t0[0]) break;
        const ci = c % nx, cj = (c - ci) / nx;
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const i2 = ci + di, j2 = cj + dj;
          if (i2 < 0 || j2 < 0 || i2 >= nx || j2 >= ny) continue;
          const k = j2 * nx + i2;
          if (!free[k] || prev[k] !== -2) continue;
          const a0 = cellC(ci, cj), b0 = cellC(i2, j2);
          if (!clearAt({x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2})) continue;
          prev[k] = c;
          qu.push(k);
        }
      }
      const tk = t0[1] * nx + t0[0];
      if (prev[tk] === -2) return null;
      const out = [];
      for (let k = tk; k !== -1; k = prev[k]) out.push(cellC(k % nx, (k - (k % nx)) / nx));
      return out.reverse();
    };
    const pull = pts => {
      const out = [pts[0]];
      let i = 0;
      while (i < pts.length - 1) {
        let j = pts.length - 1;
        while (j > i + 1 && !segClear(pts[i], pts[j])) j--;
        out.push(pts[j]);
        i = j;
      }
      return out;
    };
    let best = null;
    const s0 = nearestFree(liftPt);
    for (const ex of [sB.x + sB.w + pill.w / 2 + 10, sB.x - pill.w / 2 - 10]) {
      const E = {x: ex, y: hover.y};
      if (!s0 || !clearAt(E) || !segClear(E, hover)) continue;
      const t0 = nearestFree(E);
      if (!t0) continue;
      const cells = bfs(s0, t0);
      if (!cells) continue;
      const legs = pull([liftPt, ...cells, E]);
      let len = 0;
      for (let k = 1; k < legs.length; k++) len += Math.hypot(legs[k].x - legs[k - 1].x, legs[k].y - legs[k - 1].y);
      if (!best || len < best.len) best = {pts: [...legs, hover], len, hits: 0};
    }
    if (!best) {
      // no clear route: straight to the article edge and along the band (reported by flightHits)
      const E = {x: sB.x + sB.w + pill.w / 2 + 10, y: hover.y};
      const pts = [liftPt, E, hover];
      let hits = 0;
      for (let k = 0; k < 60; k++) { const q = polyline(pts).at(k / 59); if (flightObs.some(o => overlaps(boxAt(q, pill), o, 1))) hits++; }
      best = {pts, hits};
    }
    // round the corners a little (kept only if still clear)
    const chaikin = pts => {
      const out = [pts[0]];
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1];
        out.push({x: lerp(a.x, b.x, 0.25), y: lerp(a.y, b.y, 0.25)}, {x: lerp(a.x, b.x, 0.75), y: lerp(a.y, b.y, 0.75)});
      }
      out.push(pts[pts.length - 1]);
      return out;
    };
    if (!best.hits && best.pts.length > 3) {
      const body = best.pts.slice(0, -1);
      let sm = chaikin(chaikin(body));
      sm[0] = body[0]; sm[sm.length - 1] = body[body.length - 1];
      let ok = true;
      for (let k = 1; k < sm.length && ok; k++) ok = segClear(sm[k - 1], sm[k]);
      if (ok) best.pts = [...sm, hover];
    }
    const backRoute = polyline(best.pts);
    const flightHits = best.hits;
    // --- origin outlines (dashed) + seat / landing rings ----------------------
    const originBook = drawRect('orig-book', bookArtBox, 6, th.inkSoft, 2.5, true);

    // card leaders: isolated → the magnifier (the word read on its own); contextual → the full article
    // (a card below the lens connects straight up to the rim's lowest point, right of the caption)
    const lensTgt = cardI.box.y > tcy && tcx > cardI.box.x + 20 && tcx < cardI.box.x + cardI.box.w - 20
      ? {x: tcx + 6, y: tcy + rimR + 6}
      : circleAnchor(lensCircle, rimR + 6, {x: cardI.box.x + cardI.box.w * 0.5, y: cardI.box.y});
    const leadI = leader('leadI', cardI.box, lensTgt, th.accent3, 2.5, lensTgt.y < cardI.box.y ? 'top' : 'bottom');
    // (square: from the card's right part to the sheet's right corner, clear of the passage line)
    const cx0 = G.leadC === 'right' ? Math.min(sB.x + sB.w - 30, cardC.box.x + cardC.box.w - 24)
      : Math.max(sB.x + 30, Math.min(sB.x + sB.w - 30, cardC.box.x + cardC.box.w / 2));
    const leadC = leader('leadC', cardC.box, {x: cx0, y: cardC.box.y < sB.y ? sB.y - 4 : sB.y + sB.h + 4}, th.accent2, 2.5, cardC.box.y < sB.y ? 'bottom' : 'top');

    // label checks (asserted per ratio by the tests): relation-label leaders
    // that cross a component, caption or card; caption tabs that reach more
    // than 12 units into their component (over its own content)
    const blockers = [rackBox, bookU, sB, tB, tokenBox, handleBox, ...Object.values(caps).map(c => c.box), cardI.box, cardC.box];
    const leadBad = conns.filter(x => x.leadSeg && x.leadSeg.some((q, k) => k > 0 && blockers.some(o => segHitsBox(x.leadSeg[k - 1], q, o, 1))));
    const labelLeadHits = leadBad.length;
    const labelsOnParts = conns.filter(x => x.lab && blockers.some(q => overlaps(x.lab.box, q, 0))).length;
    const labelLeadHitRels = leadBad.map(x => `${x.rel.from}-${x.rel.to}`);
    const capsIntrude = Object.values(caps).filter(c => (c.intrude ?? 0) > 12).length;
    const relCrossParts = conns.reduce((n, x) => n + x.c.crossings, 0);
    // ports: two lines never land within 36 units of each other on the same
    // component, and no two relation lines cross (no tangle at a port)
    const ends = conns.flatMap(x => [{id: x.rel.from, q: x.c.from, i: x.i}, {id: x.rel.to, q: x.c.to, i: x.i}]);
    let portCrowd = 0;
    for (let a = 0; a < ends.length; a++) for (let b = a + 1; b < ends.length; b++) {
      if (ends[a].id === ends[b].id && ends[a].i !== ends[b].i && Math.hypot(ends[a].q.x - ends[b].q.x, ends[a].q.y - ends[b].q.y) < 36) portCrowd++;
    }
    let relCrossings = 0;
    for (let a = 0; a < conns.length; a++) for (let b = a + 1; b < conns.length; b++) {
      const A = conns[a].c.pts, B = conns[b].c.pts;
      let hit = false;
      for (let i = 1; i < A.length && !hit; i++) for (let j = 1; j < B.length && !hit; j++) hit = segX(A[i - 1], A[i], B[j - 1], B[j]);
      if (hit) relCrossings++;
    }
    return {
      labelLeadHits, labelLeadHitRels, labelsOnParts, capsIntrude, relCrossParts, portCrowd, relCrossings,
      handleDeg: G.handle, s, ox, oy, SW, SH, rack, book, plate, bookU, bB, sB, tB, sheetNode, stripNode, token, lupa, lensR, tcx, tcy, ALb, ALs, ALt,
      bookArtBox, sheetPasBox, stripSlotBox, sheetKeyBox, conns, route, visitT, seatRoute, backRoute, landAt, slotC, liftPt, stripWord, keyHl,
      cardT, cardS, pill, hover, flightObs, restObs, flightHits,
      originBook, originSheet, originStrip, seatRing, landRing, caps, cardI, cardC, leadI, leadC, EL, slot,
    };
  },
  build(ctx, L) {
    const th = ctx.theme;
    const sK = L.ALs.key;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      // components
      L.rack.node,
      L.book.node,
      L.plate.node,
      L.originBook.node,
      g({name: 'sheet'}, L.sheetNode),
      g({name: 'strip'}, L.stripNode),
      // lines above the components
      L.conns.map(x => x.c.node),
      // magnifier (back: shadow + handle; front: glass + rim) around the word token
      g({name: 'wordfocus'},
        g({name: 'lupa-b', opacity: 0}, g({transform: T(10, 14, L.handleDeg)}, L.lupa.shadow), g({transform: T(0, 0, L.handleDeg)}, L.lupa.handle)),
        g({name: 'token'}, L.token.node),
        g({name: 'lupa-f', opacity: 0}, g({transform: T(0, 0, L.handleDeg)}, L.lupa.tint, L.lupa.ring))),
      // relation labels beside their lines, with a leader to the line
      L.conns.map((x, i) => x.lab && g({name: `rlg${i}`, opacity: 0}, x.lead, x.lab.node)),
      Object.values(L.caps).map(c => c.node),
      // copy of the word that settles on its line of the full article
      // (the card is the word's own highlight: same colours, and at rest the
      // same size, so the cross-fade into the page highlight is seamless)
      g({name: 'back', opacity: 0},
        h('path', {name: 'back-sh', d: roundRectPath(-L.cardS.w / 2, -L.cardS.h / 2, L.cardS.w, L.cardS.h, 6), fill: th.shadow, opacity: 0}),
        h('path', {name: 'back-card', d: roundRectPath(-L.cardS.w / 2, -L.cardS.h / 2, L.cardS.w, L.cardS.h, 6), fill: th.accent3Soft, stroke: shade(th.accent3, -0.1), 'stroke-width': 2}),
        g({name: 'back-tx'},
          ctx.show('key')
            ? h('text', {x: 0, y: r(L.ALs.size * 0.33), 'text-anchor': 'middle', 'font-family': FONTS.serif, 'font-size': r(L.ALs.size), fill: th.ink}, sK.text)
            : h('rect', {x: r(-sK.w / 2), y: r(-sK.h * 0.2), width: r(sK.w), height: r(sK.h * 0.42), rx: r(sK.h * 0.18), fill: shade(th.accent3, -0.35)}))),
      // tracer: large ring + dot, drawn above every line and label
      g({name: 'tracer', opacity: 0},
        h('circle', {r: 30, fill: th.accent, opacity: 0.2}),
        h('circle', {r: 17, fill: th.accent, stroke: th.paper, 'stroke-width': 4.5}),
        h('circle', {r: 6, fill: th.paper})),
      L.leadI.node, L.leadC.node,
      L.cardI.node, L.cardC.node,
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const nodes = {};
    const e = ease.inOutCubic;
    const es = ease.inOutSine; // gentler peak speed for long lifts
    // --- separate: sheet, strip, token lift off their origins ----------------
    const lift = (name, src, dst, prog, localBox) => {
      // map the part's local box from the source rectangle to its final place
      const k0 = src.w / localBox.w;
      const k = lerp(k0, 1, es(prog));
      const x = lerp(src.x - localBox.x * k0, dst.x, es(prog));
      const y = lerp(src.y - localBox.y * k0, dst.y, es(prog));
      nodes[name] = {transform: T(x, y, 0, k), opacity: r(clamp(prog * 3.5), 3)};
      return {x: x + localBox.x * k + (localBox.w * k) / 2, y: y + localBox.y * k + (localBox.h * k) / 2};
    };
    const pS = seg(u, ...W.sheet), pT = seg(u, ...W.strip), pK = seg(u, ...W.token), pL = seg(u, ...W.lupa);
    const sheetC = lift('sheet', L.bookArtBox, {x: L.sB.x, y: L.sB.y}, pS, {x: L.ALs.box.x - 6, y: L.ALs.box.y - 6, w: L.ALs.box.w + 12, h: L.ALs.box.h + 12});
    const tp = L.ALt.passages[0].box;
    const stripC = lift('strip', L.sheetPasBox, {x: L.tB.x, y: L.tB.y}, pT, {x: tp.x - 8, y: tp.y - 4, w: tp.w + 16, h: tp.h + 8});
    // token: from the strip's word slot to the lens centre, growing
    const tk = L.stripSlotBox;
    const k0 = tk.w / L.token.w;
    let kk = lerp(k0, 1, e(pK));
    let tx = lerp(tk.x + tk.w / 2, L.tcx, e(pK));
    let ty = lerp(tk.y + tk.h / 2, L.tcy, e(pK)) - Math.sin(Math.PI * pK) * 40;
    let tokOp = clamp(pK * 4);
    // gather 1: the enlarged word leaves the lens along the "appears in" line and re-seats in its passage, shrinking
    const pb1 = seg(u, ...W.seat);
    if (pb1 > 0) {
      const q = L.seatRoute.at(e(pb1));
      tx = q.x; ty = q.y;
      kk = lerp(1, k0, e(pb1));
    }
    const seated = u >= W.seat[1];
    if (seated) tokOp = 1 - seg(u, W.seat[1], W.seat[1] + 0.012);
    nodes.token = {transform: T(tx, ty, 0, kk), opacity: r(tokOp, 3)};
    nodes['lupa-f'] = {opacity: r(pL, 3), transform: T(L.tcx, L.tcy, 0, lerp(1.25, 1, e(pL)))};
    nodes['lupa-b'] = {opacity: r(pL, 3), transform: T(L.tcx, L.tcy, 0, lerp(1.25, 1, e(pL)))};
    Object.assign(nodes, L.originBook.frame(pS));
    Object.assign(nodes, L.originSheet.frame(pT));
    // the word leaves the strip (its slot stays outlined) and comes back at the seat
    Object.assign(nodes, L.originStrip.frame(seated ? 0 : pK));
    Object.assign(nodes, L.seatRing.frame(seg(u, W.seat[1] - 0.004, W.seat[1] + 0.03)));
    nodes['tart-kw'] = {opacity: r(seated ? seg(u, W.seat[1] - 0.006, W.seat[1] + 0.004) : 1 - clamp(pK * 3), 3)};
    AL_hl(nodes, 'tart', L.ALt, seated ? 1 : pK >= 1 ? 0 : 1 - pK, 0);
    AL_hl(nodes, 'bart', L.ALb, 1, 0);
    // --- relate: lines draw in order ------------------------------------------
    const n = L.conns.length;
    const relP = i => seg(u, W.relate[0] + (i / n) * (W.relate[1] - W.relate[0]) * 0.85, W.relate[0] + ((i + 1) / n) * (W.relate[1] - W.relate[0]));
    L.conns.forEach((x, i) => {
      const pr = relP(i);
      Object.assign(nodes, x.c.frame(pr));
      if (x.lab) nodes[`rlg${i}`] = {opacity: r(clamp((pr - 0.55) / 0.45), 3)};
    });
    // --- trace ----------------------------------------------------------------
    const pr = seg(u, ...W.trace);
    const at = L.route.at(ease.inOutSine(pr));
    nodes.tracer = {transform: T(at.x, at.y), opacity: pr > 0 && pr < 1 ? 1 : 0};
    const trT = ease.inOutSine(pr);
    let current = null;
    const visited = [];
    for (const v of L.visitT) {
      if (pr > 0 && trT >= v.t - 1e-6) visited.push(v.id);
      if (pr > 0 && Math.abs(trT - v.t) < 0.08) current = v.id;
    }
    // focus: enlarged while the tracer is on it, back to its size once passed
    const f = p.focusElement;
    const fv = L.visitT.find(v => v.id === f);
    let focusScale = 1;
    if (fv && pr > 0) {
      const d = trT - fv.t;
      focusScale = d < -0.12 ? 1 : d < 0 ? lerp(1, 1.14, e((d + 0.12) / 0.12)) : d < 0.16 ? lerp(1.14, 1, e(d / 0.16)) : 1;
    }
    const focusNode = {word: 'wordfocus', passage: 'strip', article: 'sheet', book: 'book', rack: 'rack'}[f];
    const fb = L.EL[f].box;
    const fc = {x: fb.x + fb.w / 2, y: fb.y + fb.h / 2};
    const scaleAbout = (c, k) => `translate(${r(c.x)} ${r(c.y)}) scale(${r(k, 4)}) translate(${r(-c.x)} ${r(-c.y)})`;
    if (focusNode === 'sheet' && focusScale !== 1) nodes.sheet = {transform: `${scaleAbout(fc, focusScale)} ${T(L.sB.x, L.sB.y)}`, opacity: 1};
    else if (focusNode === 'strip' && focusScale !== 1) nodes.strip = {transform: `${scaleAbout(fc, focusScale)} ${T(L.tB.x, L.tB.y)}`, opacity: 1};
    else if (focusNode === 'wordfocus' || focusNode === 'book' || focusNode === 'rack') nodes[focusNode] = {transform: focusScale !== 1 ? scaleAbout(fc, focusScale) : ''};
    // --- gather 2: the copy appears lifted clear of the re-seated word, folds
    // into a blank pill, travels through free space and the blank band above
    // the key word's line, unfolds onto the word's measured highlight box,
    // rests and cross-fades into that highlight --------------------------------
    const pIn = seg(u, ...W.copyIn), pFold = seg(u, ...W.fold), pb = seg(u, ...W.back), pDrop = seg(u, ...W.drop), pf = seg(u, ...W.fade);
    const mixZ = (a, b, t) => ({w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t)});
    let bp, cz, txOp, txK;
    if (pDrop > 0) {
      const t = e(pDrop);
      bp = {x: lerp(L.hover.x, L.landAt.x, t), y: lerp(L.hover.y, L.landAt.y, t)};
      cz = mixZ(L.pill, L.cardS, t);
      txOp = seg(pDrop, 0.6, 1);
      txK = 1;
    } else if (pb > 0) {
      bp = L.backRoute.at(ease.inOutSine(pb));
      cz = L.pill;
      txOp = 0;
      txK = 1;
    } else {
      bp = L.liftPt;
      cz = mixZ(L.cardT, L.pill, e(pFold));
      txOp = 1 - seg(pFold, 0, 0.5);
      txK = L.ALt.size / L.ALs.size;
    }
    const backOp = u < W.copyIn[0] ? 0 : pIn * (1 - pf);
    const raise = pb > 0 && pb < 1 ? Math.sin(Math.PI * pb) : 0;
    nodes.back = {transform: T(bp.x, bp.y), opacity: r(backOp, 3)};
    const cardD = roundRectPath(-cz.w / 2, -cz.h / 2, cz.w, cz.h, Math.min(6, cz.h / 2));
    nodes['back-card'] = {d: cardD};
    nodes['back-sh'] = {d: cardD, transform: T(2 + 6 * raise, 3 + 8 * raise), opacity: r(0.3 + 0.4 * raise, 3)};
    nodes['back-tx'] = {opacity: r(txOp, 3), transform: T(0, 0, 0, txK)};
    const landed = u >= W.land[0];
    Object.assign(nodes, L.landRing.frame(seg(u, ...W.land)));
    AL_hl(nodes, 'sart', L.ALs, 0.35 + 0.65 * seg(u, ...W.land), landed ? seg(u, W.land[0], W.cards[0]) : 0);
    const backBox = {x: bp.x - cz.w / 2, y: bp.y - cz.h / 2, w: cz.w, h: cz.h};
    const hlC = {x: L.keyHl.x + L.keyHl.w / 2, y: L.keyHl.y + L.keyHl.h / 2};
    const pc = seg(u, ...W.cards);
    nodes['card-isolated'] = {opacity: r(clamp(pc * 1.6), 3), transform: T(L.cardI.box.x, L.cardI.box.y + (1 - pc) * 12)};
    nodes['card-contextual'] = {opacity: r(clamp((pc - 0.2) * 1.8), 3), transform: T(L.cardC.box.x, L.cardC.box.y + (1 - pc) * 12)};
    Object.assign(nodes, L.leadI.frame(seg(u, W.cards[0] + 0.02, W.cards[1])));
    Object.assign(nodes, L.leadC.frame(seg(u, W.cards[0] + 0.04, W.cards[1])));
    // captions arrive with their part
    const capP = {rack: seg(u, 0, 0.03), book: seg(u, 0, 0.03), article: seg(u, W.sheet[1] - 0.01, W.sheet[1] + 0.03), passage: seg(u, W.strip[1] - 0.01, W.strip[1] + 0.03), word: seg(u, W.lupa[1] - 0.01, W.lupa[1] + 0.03)};
    for (const id of Object.keys(L.caps)) nodes[`cap-${id}`] = {opacity: r(capP[id], 3)};
    const beat = u < BEATS.separate[1] ? 'separate' : u < BEATS.relate[1] ? 'relate' : u < BEATS.trace[1] ? 'trace' : 'gather';
    const P2 = q => ({x: r(q.x), y: r(q.y)});
    const drawn = L.conns.map((x, i) => relP(i) >= 1);
    return {
      nodes,
      semantic: {
        beat,
        separated: {article: pS >= 1, passage: pT >= 1, word: pK >= 1},
        sheet: P2(sheetC), strip: P2(stripC), token: P2({x: tx, y: ty}),
        tracer: P2(at), tracerOn: pr > 0 && pr < 1, current, visited,
        focus: f, focusScale: r(focusScale, 3),
        relations: L.conns.map((x, i) => ({from: x.rel.from, to: x.rel.to, kind: x.rel.kind, drawn: drawn[i], arrow: x.c.arrow, side: x.c.side, nearMiss: x.c.score,
          fromPt: P2(x.c.from), toPt: P2(x.c.to), fromOn: onEdge(L.EL[x.rel.from], x.c.from), toOn: onEdge(L.EL[x.rel.to], x.c.to),
          labelOffLine: !x.lab || !x.c.pts.some(q => ptIn(q, x.lab.box, 0))})),
        order: L.visitT.map(v => v.id),
        tokenInLens: pK >= 1 && pb1 === 0,
        wordSeated: seated,
        back: P2(bp), backMoving: (pb1 > 0 && pb1 < 1) || (pFold > 0 && pFold < 1) || (pb > 0 && pb < 1) || (pDrop > 0 && pDrop < 1), wordPlacedBack: landed,
        backVisible: backOp > 0.001,
        backSize: {w: r(cz.w), h: r(cz.h)},
        // the copy rests exactly on the measured key-word box: centre and size of its highlight
        backOnKey: backOp > 0.001 && Math.hypot(bp.x - hlC.x, bp.y - hlC.y) < 1 && Math.abs(cz.w - L.keyHl.w) < 1 && Math.abs(cz.h - L.keyHl.h) < 1,
        backOverStripWord: backOp > 0.001 && overlaps(backBox, L.stripWord),
        // the travelling copy covers no printed word, part, caption or relation label;
        // while it rests at its lift point it also stays off every connector line
        backHits: backOp > 0.001 && pDrop === 0 ? (pb > 0 ? L.flightObs : L.restObs).filter(q => overlaps(backBox, q, 0)).length : 0,
        flightHits: L.flightHits,
        backBeforeSeated: backOp > 0.001 && u < W.seat[1],
        copyLift: P2(L.liftPt), copyStripWord: L.stripWord,
        labelLeadHits: L.labelLeadHits, labelLeadHitRels: L.labelLeadHitRels, labelsOnParts: L.labelsOnParts,
        relCrossParts: L.relCrossParts,
        portCrowd: L.portCrowd,
        relCrossings: L.relCrossings,
        capsIntrude: L.capsIntrude,
        tokenScale: r(kk, 3),
        cards: {isolated: pc >= 1, contextual: pc >= 1},
      },
    };
  },
};

/** Whether a point lies on (within a few units outside) an element's edge. */
function onEdge(el, q) {
  if (el.circle) {
    const d = Math.hypot(q.x - el.circle.x, q.y - el.circle.y);
    return d >= el.circle.r - 2 && d <= el.circle.r + 24;
  }
  const b = el.box;
  const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w));
  const dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h));
  const inside = q.x > b.x + 1 && q.x < b.x + b.w - 1 && q.y > b.y + 1 && q.y < b.y + b.h - 1;
  return !inside && Math.hypot(dx, dy) <= 24;
}

/** Occurrence highlights of one article art: key opacity and others opacity. */
function AL_hl(nodes, prefix, AL, key, others) {
  AL.occ.forEach((q, i) => { nodes[`${prefix}-h${i}`] = {opacity: r(q.key ? key : others, 3)}; });
}


export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-01-mechanism',
    title: 'Text and context — the word, its passage, article, book and row',
    titleEs: 'Texto y contexto — Mecanismo o relación explicada',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Texto y contexto',
    treatment: 'mechanism',
    family: 'spatial-mechanism',
    description: 'Exploded view: the article lifts off the book as a loose sheet, its passage as a strip and the key word as a token under a magnifier, each leaving a dashed outline where it was. Only the supplied relationships are drawn, anchored at those origins (plain relations without arrows); a tracer follows the traversal order while the focus part grows; a copy of the word then travels back and settles in the full article. Both readings are attributed cards.',
    tags: ['text', 'context', 'exploded view', 'nesting', 'magnifier', 'book', 'article', 'passage', 'editable hierarchy', 'relations', 'tracer'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/texto-y-contexto.js', 'src/primitives/annotate.js', 'src/frameworks/graph.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: TC_STRINGS,
  scene,
});
