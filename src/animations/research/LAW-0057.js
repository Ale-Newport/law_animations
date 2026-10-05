/**
 * LAW-0057 — Lectura de sumario · story
 *
 * Storyboard (front view of a library reading corner):
 *  0.00–0.15 rest   Bookcase (anchor, one volume with a yellow index tab), a
 *                   wall-mounted search box showing the query, a reading stand
 *                   with the summary card (ficha) lying on a folded stack, the
 *                   researcher beside it.
 *  0.15–0.42 action The search button is pressed, the matching result row
 *                   lights up and a dashed tether runs from it to the card
 *                   (same tab colour). The researcher's near hand reaches the
 *                   card's top corner and starts to LIFT it: the decision text
 *                   folded underneath pulls out panel by panel.
 *  0.42–0.73 compl. The fanfold keeps opening only as far as the panel that
 *                   holds the paragraph the card points to (→ ¶ n); the rest
 *                   of the decision stays folded on the ledge. A bracket runs
 *                   from the pointer pill to that passage and a highlighter
 *                   sweeps it.
 *  0.73–1.00 hold   Card held up, passage marked, supplied state tag.
 *
 * The card follows the SOLVED hand (hand = grip every frame after contact);
 * the strip's lowest fold always rests on the ledge. No legal conclusion is
 * drawn: the scene only shows where the summary points.
 * @module animations/research/LAW-0057
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease} from '../../core/time.js';
import {callout, chip, statusTag} from '../../primitives/annotate.js';
import {sumarioContentFields, storyFields, SUMARIO_STRINGS} from './kits/lectura-de-sumario-fields.js';
import {readingStage, STAGE, balancedWidth, swatchNote, CARD_FILL} from './kits/lectura-de-sumario.js';

const ID = 'LAW-0057';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  press: [0.08, 0.14], hit: [0.11, 0.17], tether: [0.14, 0.23], tetherFade: [0.31, 0.37],
  reach: [0.19, 0.3], lift: [0.3, 0.64], link: [0.64, 0.73], mark: [0.7, 0.79], note: [0.8, 0.88],
};
const ACTION_END = 0.8;

const sceneSchema = {...sumarioContentFields, ...storyFields};

const defaultParams = {
  query: 'notice letter Day 3',
  sources: {library: 'Case library', volume: 'Vol. 12', database: 'Case search (fictional)'},
  citations: {decision: 'FD-118', paragraph: 3},
  dates: {decision: 'Day 12'},
  summaryText: 'The decision discusses the notice letter that Party A sent on Day 3.',
  passageText: 'The panel reviewed the letter dated Day 3 and the reply sent by Party B.',
  researcher: {name: 'Rosa Ibáñez', role: 'Researcher'},
  actorLabels: {reader: 'Researcher'},
  objectLabels: {card: 'Summary', decision: 'Decision text'},
  actionProgress: 1,
  annotations: [{target: 'passage', text: 'The passage the summary points to'}],
  finalState: 'passage-linked',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

/** Free regions (stage units) for editorial chips, per axis. */
const FREE = {
  horizontal: {x: 1140, y: 386, w: 440, h: 540},
  square: {x: 914, y: 20, w: 276, h: 1080},
};

const scene = {
  sizes: {landscape: [1600, 950], square: [1200, 1150], portrait: [965, 1450]},
  layout(ctx) {
    const p = ctx.params;
    const t = ctx.t;
    const th = ctx.theme;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const linked = p.finalState === 'passage-linked';
    const stateText = linked ? t.linked : t.located;
    // portrait: the state tag shares the band above the card with the library
    // chip, so the chip is kept narrower than the room the tag leaves
    let libChipMax;
    if (axis === 'vertical' && ctx.show('key')) {
      const tf = ctx.fit(stateText, {maxWidth: st.w - 400, size: 28, maxLines: 1, weight: 700});
      libChipMax = Math.max(260, st.w - 12 - (tf.width + 28 * 2.3) - 34 - 10);
    }
    const stage = readingStage(ctx, {
      prefix: 'stage', axis, withLink: linked, libChipMax,
      researcher: {...p.researcher, role: p.actorLabels.reader || p.researcher.role},
      content: {
        query: p.query, database: p.sources.database, library: p.sources.library, volume: p.sources.volume,
        decision: p.citations.decision, date: p.dates.decision, summary: p.summaryText, passage: p.passageText,
        paragraph: p.citations.paragraph, cardHeader: p.objectLabels.card || t.summary,
      },
    });
    const F = FREE[axis];
    const psg = stage.blockWorld(stage.target);
    const sumBox = stage.cardPart('summary');
    const right = stage.sx + stage.sw;
    const size = axis === 'square' ? 30 : 28;
    const noteSize = axis === 'square' ? 28 : 26;
    const showAll = ctx.show('all');
    // A leader may not cross the link bracket, the strip or a person. Targets
    // that cannot be reached that way get a colour-keyed note instead.
    const swatchOf = {passage: th.highlight, summary: CARD_FILL, search: th.accent3Soft, library: th.accent3};
    const targets = {
      passage: {x: right - 2, y: psg.y + psg.h * 0.84},
      summary: {x: right - 2, y: sumBox.y + sumBox.h * 0.3},
      // landscape: the screen's lower edge (the column is below it); square:
      // its right edge at the result row (the note sits to its right)
      search: axis === 'square'
        ? {x: stage.screen.box.x + stage.screen.box.w + 2, y: stage.screen.rowBox.y + stage.screen.rowBox.h / 2}
        : {x: stage.screen.rowBox.x + stage.screen.rowBox.w * 0.5, y: stage.screen.box.y + stage.screen.box.h + 2},
    };
    const leaderOK = a => (axis === 'vertical' ? false
      : a.target === 'library' ? false
        : a.target === 'summary' && axis === 'horizontal' && linked ? false : true);
    const notes = [];
    let linkChip = null;
    let tag = null;
    if (axis === 'horizontal') {
      // right column, stacked top → bottom: notes that point up (search),
      // bracket caption, state tag, then notes that point left/down
      let y = F.y;
      const place = (maker) => { const it = maker(y); y = it.box.y + it.box.h + 16; return it; };
      const noteAt = (a, i) => place(yy => (leaderOK(a)
        ? callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: F.x, y: yy}, anchor: 'start', target: targets[a.target], maxWidth: balancedWidth(ctx, a.text, F.w, noteSize, {maxLines: 3}), maxLines: 3, size: noteSize})
        : swatchNote(ctx, {name: `note${i}`, text: a.text, x: F.x, y: yy, anchor: 'start', maxWidth: F.w, size: noteSize, swatch: swatchOf[a.target]})));
      const anns = showAll ? p.annotations.map((a, i) => ({a, i})) : [];
      anns.filter(({a}) => a.target === 'search').forEach(({a, i}) => notes.push(noteAt(a, i)));
      if (linked && showAll) {
        const text = `${t.pointsTo} ¶ ${stage.target}`;
        linkChip = place(yy => chip(ctx, text, {x: F.x, y: Math.max(yy, stage.link.mid.y - size * 0.9), maxWidth: balancedWidth(ctx, text, F.w, size * 0.9), size: size * 0.9, maxLines: 2, fill: th.card, stroke: th.accent3, name: 'link-chip'}));
      }
      if (ctx.show('key')) tag = place(yy => statusTag(ctx, stateText, {x: F.x + 4, y: Math.max(yy, psg.y), anchor: 'start', maxWidth: F.w - 10, size: 28, name: 'state-tag', color: th.accent4}));
      anns.filter(({a}) => a.target !== 'search').forEach(({a, i}) => notes.push(noteAt(a, i)));
    } else if (axis === 'square') {
      // top-right region: tag, then notes for search / summary / library;
      // right column: bracket caption and notes for the passage
      if (ctx.show('key')) tag = statusTag(ctx, stateText, {x: 1190, y: 28, anchor: 'end', maxWidth: 640, size: 28, name: 'state-tag', color: th.accent4});
      let yTop = tag ? tag.box.y + tag.box.h + 16 : 28;
      let yCol = Math.max(psg.y + psg.h + 24, stage.ledge + 40);
      if (linked && showAll) {
        const text = `${t.pointsTo} ¶ ${stage.target}`;
        const maxW = st.w - stage.link.bx - 26;
        linkChip = chip(ctx, text, {x: stage.link.bx + 16, y: stage.link.mid.y - size * 0.9, maxWidth: balancedWidth(ctx, text, maxW, size * 0.9), size: size * 0.9, maxLines: 2, fill: th.card, stroke: th.accent3, name: 'link-chip'});
      }
      if (showAll) p.annotations.forEach((a, i) => {
        if (a.target === 'passage') {
          const c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: F.x + F.w / 2, y: yCol}, target: targets.passage, maxWidth: balancedWidth(ctx, a.text, F.w, noteSize, {maxLines: 4}), maxLines: 4, size: noteSize});
          yCol = c.box.y + c.box.h + 16;
          notes.push(c);
        } else {
          const maxW = 1190 - 560;
          const c = leaderOK(a)
            ? callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 1190, y: yTop}, anchor: 'end', target: targets[a.target], maxWidth: balancedWidth(ctx, a.text, maxW, noteSize), size: noteSize})
            : swatchNote(ctx, {name: `note${i}`, text: a.text, x: 1190, y: yTop, anchor: 'end', maxWidth: maxW, size: noteSize, swatch: swatchOf[a.target]});
          yTop = c.box.y + c.box.h + 14;
          notes.push(c);
        }
      });
    } else {
      // portrait: the state tag sits right above the lifted card; notes go in
      // the free column right of the bracket, each at the height of what it
      // describes, with a short leader (the passage note below the bracket's
      // lower corner, so the leader never crosses it)
      const cardTop = stage.finalTop;
      if (ctx.show('key')) tag = statusTag(ctx, stateText, {x: st.w - 12, y: cardTop - 28 * 1.75 - 16, anchor: 'end', maxWidth: st.w - stage.sx - 20, size: 28, name: 'state-tag', color: th.accent4});
      const colX = (linked ? stage.link.bx : right) + 20;
      const colW = st.w - 8 - colX;
      const scr = stage.screen.box;
      if (showAll) p.annotations.forEach((a, i) => {
        const opts = {name: `note${i}`, text: a.text, anchor: 'start', maxLines: 5, size: noteSize - 2};
        if (a.target === 'passage') {
          const yTop = (linked ? stage.link.y1 : psg.y + psg.h * 0.5) + 14;
          notes.push(callout(ctx, {...opts, chipAt: {x: colX, y: yTop}, target: {x: right - 2, y: psg.y + psg.h * 0.84}, maxWidth: balancedWidth(ctx, a.text, colW, noteSize - 2, {maxLines: 5})}));
        } else if (a.target === 'summary') {
          const yTop = tag ? Math.max(tag.box.y + tag.box.h + 12, sumBox.y) : sumBox.y;
          notes.push(callout(ctx, {...opts, chipAt: {x: colX, y: yTop}, target: {x: right - 2, y: sumBox.y + sumBox.h * 0.3}, maxWidth: balancedWidth(ctx, a.text, colW, noteSize - 2, {maxLines: 5})}));
        } else if (a.target === 'search') {
          const maxW = Math.min(560, st.w - 24);
          notes.push(callout(ctx, {...opts, maxLines: 2, chipAt: {x: st.w - 12, y: scr.y + scr.h + 22}, anchor: 'end', target: {x: st.w - 12 - 40, y: scr.y + scr.h + 2}, maxWidth: balancedWidth(ctx, a.text, maxW, noteSize - 2, {maxLines: 2})}));
        } else {
          notes.push(swatchNote(ctx, {name: `note${i}`, text: a.text, x: st.w - 12, y: scr.y + scr.h + 26, anchor: 'end', maxWidth: Math.min(560, st.w - 24), size: noteSize - 2, swatch: swatchOf[a.target]}));
        }
      });
    }
    return {stage, s, ox, oy, notes, tag, linkChip, linked};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.linkChip && L.linkChip.node,
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const press = Math.sin(Math.PI * seg(a, ...W.press));
    const lift = seg(a, ...W.lift);
    const linkP = L.linked ? ease.inOutCubic(seg(a, ...W.link)) : 0;
    const markW = L.linked ? W.mark : [W.link[0], W.link[0] + 0.09];
    const posed = L.stage.pose({
      press,
      hit: seg(a, ...W.hit),
      tether: seg(a, ...W.tether),
      tetherFade: seg(a, ...W.tetherFade),
      reach: seg(a, ...W.reach),
      lift,
      link: linkP,
      mark: seg(a, ...markW),
      look: lerp(0, -9, ease.inOutSine(lift)) + 12 * ease.inOutSine(seg(a, W.link[0], W.mark[1])),
    });
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    if (L.linkChip) nodes['link-chip'] = {opacity: done ? clamp((u - W.link[1]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {
      nodes,
      semantic: {
        ...posed.semantic,
        beat,
        finalState: p.finalState,
        searched: seg(a, ...W.hit) > 0,
        actionCapped: p.actionProgress < 1 && u > capU,
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
    slug: 'research-05-story',
    title: 'Reading a summary — the card unfolds to its passage',
    titleEs: 'Lectura de sumario — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Lectura de sumario',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Library reading corner: a search result lights up and points to a summary card lying on a reading stand; the researcher lifts the card and the decision text folded beneath it unfolds panel by panel, only as far as the paragraph the summary points to, which is then bracketed and highlighted.',
    tags: ['summary', 'sumario', 'headnote', 'library', 'search', 'index card', 'fanfold', 'passage', 'researcher'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/lectura-de-sumario.js', 'src/animations/research/kits/lectura-de-sumario-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: SUMARIO_STRINGS,
  scene,
});
