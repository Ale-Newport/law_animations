/**
 * LAW-0045 — Cita localizada · story
 *
 * Storyboard (first-person library nook; brief beats in brackets):
 *  [0.00–0.15] rest: bookcase with labelled shelf plates, a catalogue search
 *              box on the wall, an empty reading board and an index card with
 *              the reference as written; the right hand slides in and takes it.
 *  [0.15–0.42] the hand lifts the card to the search box; the written
 *              reference lifts off as a paper strip, slides into the field,
 *              is cut into four colour-coded parts (source · volume · page ·
 *              paragraph); the card is laid down and the hand withdraws.
 *              The source part lands on its shelf plate, the
 *              volume part on the matching spine; the left hand reaches it.
 *  [0.42–0.73] the left hand pulls the book out, carries it to the board
 *              while it turns from spine to cover, lays it down and swings
 *              the cover open; the page part lands on the page number and
 *              the paragraph part on its paragraph, which is highlighted.
 *  [0.73–1.00] hold: the supplied final state (paragraph highlighted / page
 *              opened / volume retrieved / shelf identified) with a
 *              descriptive tag; no legal conclusion is drawn.
 * Parts that are empty in the reference stay as empty compartments in the
 * search box, and the route stops where the reference stops.
 * @module animations/research/LAW-0045
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {libraryStage, STAGE, researchFields, citationParts, locateDepth, KIT_STRINGS} from './kits/cita-localizada.js';

const ID = 'LAW-0045';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (normalized). */
const W = {
  grab: [0.01, 0.075], present: [0.08, 0.17], strip: [0.15, 0.24], split: [0.23, 0.31], cardDown: [0.3, 0.39], release: [0.395, 0.46],
  flySource: [0.29, 0.36], flyVolume: [0.35, 0.42], reach: [0.36, 0.44],
  pull: [0.44, 0.49], carry: [0.49, 0.58], toEdge: [0.58, 0.61], open: [0.61, 0.67], retreat: [0.67, 0.76],
  // page and paragraph parts fly one after the other (never over each other)
  flyPage: [0.605, 0.66], flyPara: [0.66, 0.735], hl: [0.725, 0.76], note: [0.78, 0.87],
};
const ACTION_END = 0.76;
const FINAL = ['paragraph-highlighted', 'page-opened', 'volume-retrieved', 'shelf-identified'];
const DEPTH = {'paragraph-highlighted': 4, 'page-opened': 3, 'volume-retrieved': 2, 'shelf-identified': 1};

const sceneSchema = {
  ...researchFields,
  ...storyFields({
    card: str('Heading printed on the index card', 30),
  }, ['paragraph', 'page', 'volume', 'source', 'card'], FINAL),
};
sceneSchema.actorLabels.properties.a.description = 'Caption for the researcher (the hands)';
sceneSchema.actorLabels.properties.b.description = 'Label of the catalogue search box (the interlocutor)';

const defaultParams = {
  query: 'Casebook of Examples, 4, 112, ¶ 3',
  sources: ['Journal of Sample Studies', 'Casebook of Examples', 'Practice Notes'],
  citations: [{source: 'Casebook of Examples', volume: 'Vol. 4', page: 'p. 112', paragraph: '¶ 3'}],
  dates: ['Noted on day 12', 'Edition of day 3'],
  pinpointRow: 3,
  actorLabels: {a: 'Researcher', b: 'Catalogue search'},
  objectLabels: {card: 'Reference'},
  actionProgress: 1,
  annotations: [{target: 'paragraph', text: 'The pinpoint marks this paragraph'}],
  finalState: 'paragraph-highlighted',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

const scene = {
  sizes: {landscape: [1600, 900], square: [1300, 1100], portrait: [1000, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const parts = citationParts(p);
    const depth = Math.min(DEPTH[p.finalState], locateDepth(parts));
    const stageParams = {...p, objectLabels: {search: p.actorLabels.b, card: p.objectLabels.card}};
    // stowCard: if a paragraph tag will need the card's resting place, the hand takes the card away
    const stage = libraryStage(ctx, {prefix: 'st', axis, params: stageParams, parts, stowCard: true});
    const t = {...KIT_STRINGS.en, ...(KIT_STRINGS[p.locale] || {})};
    const fs = stage.fs;
    const sp = stage.spread;
    const paraTok = stage.tokens[3];
    const dockP = stage.docks.paragraph;
    const pin = stage.paraBox(stage.pinRow);
    // Leader targets (stage coordinates, final layout).
    const targets = {
      paragraph: axis === 'square' ? {x: dockP.x, y: dockP.y + paraTok.h / 2 + 2} : {x: dockP.x, y: dockP.y - paraTok.h / 2 - 2},
      page: {x: stage.docks.page.x, y: stage.docks.page.y + 30},
      volume: {x: stage.hinge.x, y: sp.y - 4},
      source: {x: stage.docks.source.x, y: stage.docks.source.y},
      // a stowed card is gone at the hold: the note points at the reference in the search box
      card: stage.cardStows ? {x: stage.panel.field.x + stage.panel.field.w / 2, y: stage.panel.field.y + stage.panel.field.h} : {x: stage.cardRestBox.x + stage.cardRestBox.w / 2, y: stage.cardRestBox.y + 12},
    };
    // State tag: top-left of the board (wide, square) or under the spread (tall).
    const stateText = [t.shelf, t.retrieved, t.pageOpened, t.located][Math.max(0, depth - 1)] || t.shelf;
    const tagColor = depth >= 4 ? ctx.theme.accent4 : ctx.theme.inkSoft;
    const tagSize = 26 * fs;
    // on the board's top band, the tag keeps clear of the volume tag when they share a row
    const tokTop = sp.y - 8 - Math.max(stage.tokens[1].h, stage.tokens[2].h);
    const tagY = stage.boardBox.y0 + 14;
    const sharesRow = tagY + tagSize * 1.75 > tokTop - 6;
    // square: on the board's top band, left of the tags riding the book
    let tagAt = axis === 'vertical'
      ? {x: stage.hinge.x, y: sp.y + sp.h + 10, anchor: 'middle', maxWidth: sp.w * 0.8}
      : axis === 'square'
        ? {x: stage.boardBox.x0 + 22, y: stage.boardBox.y0 + 16, anchor: 'start', maxWidth: sp.w - 20}
      : {x: sp.x + 4, y: tagY, anchor: 'start', maxWidth: sharesRow ? Math.max(120, stage.volBoard.x - stage.tokens[1].w / 2 - 16 - sp.x - 4) : sp.w - 8};
    let tag = ctx.show('key') ? statusTag(ctx, stateText, {...tagAt, size: tagSize, name: 'state-tag', color: tagColor}) : null;
    // collision check against the landed volume and page tags: move under the spread if needed
    const tagBox = (c, tk) => ({x: c.x - tk.w / 2 - 8, y: c.y - tk.h / 2 - 8, w: tk.w + 16, h: tk.h + 16});
    const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const landed = [tagBox(stage.volBoard, stage.tokens[1]), tagBox(stage.docks.page, stage.tokens[2])];
    if (tag && axis !== 'vertical' && landed.some(b => hit(tag.box, b))) {
      // under the right page, clear of the researcher caption at the bottom centre
      tagAt = {x: sp.x + sp.w, y: Math.min(sp.y + sp.h + 8, stage.boardBox.y1 - 30 - tagSize * 1.75), anchor: 'end', maxWidth: sp.w / 2 + 40};
      tag = statusTag(ctx, stateText, {...tagAt, size: tagSize, name: 'state-tag', color: tagColor});
    }
    // Editorial notes: right column above the paragraph tag (wide, tall) or
    // under the spread with a leader up the gutter (square).
    const notes = [];
    if (ctx.show('all')) {
      let y = null;
      p.annotations.forEach((a, i) => {
        const tgt = targets[a.target];
        let box;
        if (axis === 'square') {
          // under the right page, between the resting card and the board's right edge
          const right = stage.boardBox.x1 - 24;
          const left = stage.cardRestBox.x + stage.cardRestBox.w + 12;
          box = {x: right, y: y ?? sp.y + sp.h + 16, anchor: 'end', maxWidth: right - left};
        } else {
          const x0 = sp.x + sp.w + 14;
          const w = stage.W - 30 - x0;
          box = {x: x0 + w / 2, y: y ?? sp.y + 18, anchor: 'middle', maxWidth: Math.max(180, w)};
        }
        // narrow columns (tall and square stages) take more lines: never truncated
        const c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: box.x, y: box.y}, anchor: box.anchor, target: tgt, maxWidth: box.maxWidth, size: 22 * fs, maxLines: axis === 'horizontal' ? 3 : 5});
        y = c.box.y + c.box.h + 12;
        notes.push(c);
      });
    }
    return {stage, s, ox, oy, depth, tag, notes, parts};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)}, L.stage.node, L.tag && L.tag.node, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const d = L.depth;
    const on = (flag, w) => (flag ? seg(a, ...w) : 0);
    const v = {
      // the right hand slides in and takes the resting card, then leaves once it is laid down
      grab: seg(a, ...W.grab),
      release: seg(a, ...W.release),
      present: seg(a, ...W.present),
      strip: seg(a, ...W.strip),
      split: seg(a, ...W.split),
      cardDown: seg(a, ...W.cardDown),
      fly: {
        source: on(d >= 1, W.flySource),
        volume: on(d >= 2, W.flyVolume),
        page: on(d >= 3, W.flyPage),
        paragraph: on(d >= 4, W.flyPara),
      },
      dispatch: {source: d >= 1, volume: d >= 2, page: d >= 3, paragraph: d >= 4},
      reach: on(d >= 2, W.reach),
      pull: on(d >= 2, W.pull),
      carry: on(d >= 2, W.carry),
      toEdge: on(d >= 3, W.toEdge),
      open: on(d >= 3, W.open),
      retreat: d >= 3 ? seg(a, ...W.retreat) : 0,
      hl: on(d >= 4, W.hl),
      // without an opening, the empty hand withdraws after laying the book down
      withdraw: d === 2 ? seg(a, W.toEdge[0], W.retreat[1]) : 0,
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat, depth: d, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-02-story',
    title: 'Located citation — library microscene',
    titleEs: 'Cita localizada — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Cita localizada',
    treatment: 'story',
    family: 'staged-scene',
    description: 'First-person library nook: the reference written on an index card is lifted into a catalogue search box and cut into four colour-coded parts; source and volume land on the shelf, the hand pulls the book, lays it on the reading board and opens it, and the page and paragraph parts land on the page and the highlighted paragraph. Incomplete references stop where they stop.',
    tags: ['citation', 'reference', 'library', 'bookshelf', 'search box', 'index card', 'paragraph', 'highlight', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/cita-localizada.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
