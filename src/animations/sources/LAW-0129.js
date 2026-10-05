/**
 * LAW-0129 — Conflicto entre textos · story
 *
 * Storyboard (top-down reading desk shared by a reader and an assistant;
 * brief beats in brackets):
 *  [0.00–0.15] rest: the open book (Text 1, the anchor) with its provision
 *              on the right page, the article sheet (Text 2) resting askew
 *              to the right, the editable hierarchy board with neutral,
 *              user-supplied level cards and one token per text, a lens and
 *              a cup of markers. Every object carries its editable id. The
 *              assistant's hand slides in and takes the article's top edge.
 *  [0.15–0.42] the assistant slides the article towards the book: the two
 *              provisions approach, the article straightens, and both
 *              tension phrases are swept with highlighter as they come
 *              face to face; the tokens of both texts light on the board.
 *  [0.42–0.73] the zone of tension is drawn across the seam (jagged spark /
 *              calm double rule / plain band — the SUPPLIED state). The
 *              reader brings the lens over the zone (its glass shows a real
 *              enlarged copy), then puts it back; the assistant takes the
 *              supplied marker from the cup (pennant pin for "conflict
 *              flagged", paper clip for "compatible application", none when
 *              only the tension is highlighted) and sets it on the seam.
 *  [0.73–1.00] hold: the supplied final state with a descriptive tag
 *              ("… · as supplied") and the editorial note; nothing states
 *              which text prevails, and the hierarchy is never applied.
 * @module animations/sources/LAW-0129
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {conflictDesk, DESK, sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, stateLabel, zoneMode, motifColors, placeCalloutWidths} from './kits/conflicto-entre-textos.js';

const ID = 'LAW-0129';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (normalized). */
const W = {
  grab: [0.02, 0.15], slide: [0.15, 0.38], glowOn: [0.17, 0.26], glowOff: [0.5, 0.6], hl: [0.29, 0.43], zone: [0.4, 0.5],
  release: [0.395, 0.43], fetch: [0.46, 0.555], carry: [0.555, 0.655], place: [0.655, 0.685], back: [0.685, 0.8],
  lensGrab: [0.33, 0.43], lensCarry: [0.43, 0.52], lensBack: [0.545, 0.635], lensRelease: [0.635, 0.73],
  // without a marker the assistant's empty hand withdraws after letting go
  releaseAway: [0.395, 0.52],
  tag: [0.74, 0.79], note: [0.79, 0.88],
};
const ACTION_END = 0.76;
const FINAL = ['conflict-flagged', 'compatible-application', 'tension-highlighted'];
const TARGETS = ['zone', 'book', 'article', 'hierarchy', 'lens'];

const sceneSchema = {
  ...sourcesFields,
  ...storyFields({
    hierarchy: str('Heading printed on the editable hierarchy board', 40),
  }, TARGETS, FINAL),
};
sceneSchema.actorLabels.properties.a.description = 'Caption for the reader (the hand that brings the lens)';
sceneSchema.actorLabels.properties.b.description = 'Caption for the assistant (the hand that slides the article and places the marker)';
sceneSchema.finalState.description = 'State supplied by the author for the zone of tension in the final hold: conflict-flagged (pennant pin), compatible-application (paper clip) or tension-highlighted (no marker). Nothing is inferred and no text is shown to prevail';

const defaultParams = {
  ...SOURCES_DEFAULTS,
  actorLabels: {a: 'Reader', b: 'Assistant'},
  objectLabels: {hierarchy: 'Editable hierarchy'},
  actionProgress: 1,
  annotations: [{target: 'hierarchy', text: 'Order entered by the user; not applied'}],
  finalState: 'conflict-flagged',
};

const LAYOUT = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};
const MARKER = {'conflict-flagged': 'flag', 'compatible-application': 'clip', 'tension-highlighted': 'none'};

const overlaps = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1120], portrait: [1000, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const layout = LAYOUT[ctx.view.shape];
    const {W: SW, H: SH} = DESK[layout];
    const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s) / 2;
    const oy = (ctx.design.h - SH * s) / 2;
    const marker = MARKER[p.finalState];
    // a note about the hierarchy hangs right under the board: the reading card below leaves room for it
    const boardNote = ctx.show('all') && layout === 'horizontal' ? p.annotations.find(a => a.target === 'hierarchy') : null;
    const noteGap = boardNote ? callout(ctx, {text: boardNote.text, chipAt: {x: 0, y: 0}, anchor: 'middle', target: {x: 0, y: -40}, maxWidth: 380, size: 24, maxLines: 4}).box.h + 22 : 0;
    const st = conflictDesk(ctx, {
      prefix: 'st', layout, content: p, hierarchyLabel: p.objectLabels.hierarchy, noteGap,
      marker, zoneMode: zoneMode(p.finalState), note: true, chips: {a: p.actorLabels.a, b: p.actorLabels.b}, seedKey: 'cet-story',
    });
    const th = ctx.theme;
    const C = motifColors(ctx);
    const bookBox = {x: st.bookC.x + st.book.bounds.x, y: st.bookC.y + st.book.bounds.y, w: st.book.bounds.w, h: st.book.bounds.h};
    const artBox = {x: st.artFinal.x, y: st.artFinal.y - 40, w: st.art.w, h: st.art.h + 40};
    const boardBox = {x: st.boardAt.x, y: st.boardAt.y, w: st.board.w, h: st.board.h};
    const noteBox = st.note ? {x: st.noteAt.x, y: st.noteAt.y, w: st.note.w, h: st.note.h} : null;
    const lensBoxes = st.lensFp.boxes;
    const obstacles = [bookBox, artBox, boardBox, noteBox, ...lensBoxes, {x: st.cupC.x - 50, y: st.cupC.y - 50, w: 100, h: 100}, ...st.chipBoxes].filter(Boolean);
    const inStage = b => b.x >= 12 && b.y >= 10 && b.x + b.w <= SW - 12 && b.y + b.h <= SH - 10;

    // State tag: above the seam (clear of both texts); otherwise below them.
    let tag = null;
    const tagSize = layout === 'horizontal' ? 30 : 30;
    if (ctx.show('key')) {
      const text = stateLabel(ctx, p.finalState);
      const top = Math.min(bookBox.y, artBox.y);
      const bottom = Math.max(bookBox.y + bookBox.h, artBox.y + artBox.h);
      const cands = [
        {x: st.seam.x, y: top - tagSize * 1.75 - 14, anchor: 'middle'},
        {x: st.seam.x - 30, y: top - tagSize * 1.75 - 14, anchor: 'start'},
        {x: st.seam.x + 30, y: top - tagSize * 1.75 - 14, anchor: 'end'},
        {x: artBox.x + artBox.w, y: top - tagSize * 1.75 - 14, anchor: 'end'},
        {x: st.seam.x, y: bottom + 12, anchor: 'middle'},
        {x: artBox.x + artBox.w, y: bottom + 12, anchor: 'end'},
        {x: bookBox.x, y: bottom + 12, anchor: 'start'},
      ];
      for (const c of cands) {
        const t = statusTag(ctx, text, {...c, size: tagSize, maxWidth: SW * 0.5, name: 'state-tag', color: marker === 'flag' ? C.flag : th.ink, opacity: 0});
        if (inStage(t.box) && !obstacles.some(b => overlaps(t.box, b, 6))) { tag = t; break; }
      }
      if (!tag) tag = statusTag(ctx, text, {...cands[0], size: tagSize, maxWidth: SW * 0.5, name: 'state-tag', color: marker === 'flag' ? C.flag : th.ink, opacity: 0});
      obstacles.push(tag.box);
    }
    // Leader from the tag to the seam marker.
    const lead = tag ? {x1: st.seam.x, y1: tag.box.y > st.seam.y ? tag.box.y : tag.box.y + tag.box.h, x2: st.seam.x, y2: st.seam.y + (tag.box.y > st.seam.y ? st.phA.h / 2 + 10 : -(marker === 'flag' ? 70 : st.phA.h / 2 + 10))} : null;

    // Editorial notes: next to their target, clear of objects, leader crossing nothing.
    const targets = {
      // the zone note may hang below the texts, its leader running up the seam between them
      zone: {pt: {x: st.seam.x, y: st.seam.y + st.phA.h / 2 + 6}, box: {x: st.seam.x - 6, y: st.seam.y + st.phA.h / 2 + 6, w: 12, h: Math.max(bookBox.y + bookBox.h - 44, artBox.y + artBox.h) - st.seam.y - st.phA.h / 2 - 6}},
      book: {pt: {x: st.bookC.x - st.book.pw * 0.5, y: st.bookC.y + st.book.top + 30}, box: bookBox},
      article: {pt: {x: st.artFinal.x + st.art.w * 0.5, y: st.artFinal.y + 20}, box: artBox},
      hierarchy: noteGap ? {pt: {x: st.boardAt.x + st.board.w / 2, y: st.boardAt.y + st.board.h - 4}, box: boardBox} : {pt: {x: st.boardAt.x + st.board.w - 6, y: st.boardAt.y + st.board.h * 0.55}, box: boardBox},
      lens: {pt: {x: st.lensRest.x, y: st.lensRest.y - st.G.lupa.R}, box: lensBoxes[0]},
    };
    const notes = [];
    if (ctx.show('all')) {
      p.annotations.forEach((a, i) => {
        const tg = targets[a.target];
        const make = q => callout(ctx, {name: `note${i}`, text: a.text, chipAt: q.chipAt, anchor: q.anchor, target: tg.pt, maxWidth: q.maxWidth ?? (layout === 'vertical' ? 380 : 340), size: 24, maxLines: 4});
        // narrower (taller) chips are tried before a placement that would cover an object
        const placed = placeCalloutWidths(ctx, {target: tg.pt, targetBox: tg.box, obstacles, bounds: {x: 16, y: 12, w: SW - 32, h: SH - 24}, make, text: a.text, size: 24, maxLines: 4}, layout === 'vertical' ? [380, 320, 260] : [380, 340, 280, 230, 190])
          || make({chipAt: {x: SW - 30, y: 24}, anchor: 'end'});
        obstacles.push(placed.box);
        notes.push(placed);
      });
    }
    return {st, s, ox, oy, tag, lead, notes, marker, layout};
  },
  build(ctx, L) {
    const C = motifColors(ctx);
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.st.node,
      L.lead ? h('line', {name: 'state-lead', ...L.lead, stroke: L.marker === 'flag' ? C.flag : ctx.theme.ink, 'stroke-width': 2.5, 'stroke-dasharray': '5 6', opacity: 0}) : null,
      L.tag && L.tag.node,
      L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const hasMarker = L.marker !== 'none';
    const glow = clamp(seg(a, ...W.glowOn) - seg(a, ...W.glowOff));
    const v = {
      grab: seg(a, ...W.grab),
      slide: seg(a, ...W.slide),
      hl: seg(a, ...W.hl),
      zone: seg(a, ...W.zone),
      release: hasMarker ? seg(a, ...W.release) : seg(a, ...W.releaseAway),
      fetch: hasMarker ? seg(a, ...W.fetch) : 0,
      carry: hasMarker ? seg(a, ...W.carry) : 0,
      place: hasMarker ? seg(a, ...W.place) : 0,
      back: hasMarker ? seg(a, ...W.back) : 0,
      lensGrab: seg(a, ...W.lensGrab),
      lensCarry: seg(a, ...W.lensCarry),
      lensBack: seg(a, ...W.lensBack),
      lensRelease: seg(a, ...W.lensRelease),
      glow: [glow, glow],
    };
    const posed = L.st.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const tagP = done ? seg(u, ...W.tag) : 0;
    if (L.tag) nodes['state-tag'] = {opacity: r(tagP, 3)};
    if (L.lead) nodes['state-lead'] = {opacity: tagP >= 1 ? 1 : 0};
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        finalState: p.finalState,
        markerKind: L.marker,
        stateShown: tagP >= 1,
        actionCapped: p.actionProgress < 1 && u > capU,
        layout: L.layout,
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
    slug: 'sources-03-story',
    title: 'Conflict between texts — reading-desk microscene',
    titleEs: 'Conflicto entre textos — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Conflicto entre textos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down reading desk: an assistant slides a fictional article towards an open book until their provisions face each other; both tension phrases are highlighted, the zone of tension is drawn across the seam, the reader inspects it with a lens and the assistant sets the supplied marker (pennant pin, paper clip or none). An editable hierarchy board shows a user-supplied ordering that is never applied; no text is shown to prevail.',
    tags: ['conflict between texts', 'provisions', 'book', 'article', 'editable hierarchy', 'magnifier', 'lens', 'highlight', 'flag', 'hands', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/conflicto-entre-textos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
