/**
 * LAW-0125 — Definición legislativa · story
 *
 * Storyboard (top-down reading desk; brief beats in brackets):
 *  [0.00–0.15] rest: the article extract (the term set in its text, a tab in
 *              the colour of its hierarchy level), the full text lying closed
 *              with one index flag per user-supplied level on its fore-edge,
 *              a hand lens and two pins joined by a wound cord. The left hand
 *              slides in and takes the lens by its handle.
 *  [0.15–0.42] the lens glides over the extract (its glass shows a real
 *              enlarged copy of the sheet) and stops on the term, which is
 *              marked. The right hand takes the book's cover at the flag of
 *              the level that holds the definitions section and swings it
 *              open: the definitions page of ANOTHER section appears.
 *  [0.42–0.73] the left hand parks the lens, takes the pins, pushes pin A in
 *              at the term and carries pin B — the cord paying out behind it —
 *              across to the entry of the definitions page; only when pin B is
 *              in does the entry light up (cause before effect).
 *  [0.73–1.00] hold: cord from the term to the supplied definition, the flag
 *              of its level marked, a descriptive state tag (definition
 *              linked / located / term marked, as supplied) and the editorial
 *              notes. No reading is declared right; no outcome is drawn.
 * @module animations/sources/LAW-0125
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str, int} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {definitionDesk, STAGE, sourcesFields, kitStrings, KIT_STRINGS, overlaps} from './kits/definicion-legislativa.js';

const ID = 'LAW-0125';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (normalized). */
const W = {
  lEnter: [0.02, 0.125], lensMove: [0.13, 0.25], mark: [0.245, 0.31],
  rEnter: [0.16, 0.275], open: [0.28, 0.42], rOut: [0.38, 0.48],
  lensPark: [0.32, 0.4], pinsTake: [0.405, 0.455], pinA: [0.46, 0.53], carry: [0.535, 0.665], entryHl: [0.66, 0.715], lOut: [0.67, 0.775],
  tag: [0.77, 0.82], notes: [0.79, 0.88],
};
const ACTION_END = 0.775;
const FINAL = ['definition-linked', 'definition-located', 'term-marked'];

const {interpretations: _unusedInterpretations, ...fieldsNoReadings} = sourcesFields;
const sceneSchema = {
  ...fieldsNoReadings,
  entryRow: int('Row of the definitions page (1–3) that holds the supplied definition', 1, 3),
  ...storyFields({
    hierarchy: str('Caption above the index flags (the user-supplied hierarchy)', 50),
  }, ['term', 'definition', 'flag', 'extract', 'book'], FINAL),
};
sceneSchema.actorLabels.properties.a.description = 'Caption for the reader (the hands)';
sceneSchema.actorLabels.properties.b.description = 'Caption for the article extract (the object the term comes from)';
sceneSchema.finalState.description = 'Supplied state held at the end: definition-linked (cord from the term to the definition), definition-located (book opened at the definitions, no link), term-marked (only the term is marked). No legal conclusion is inferred.';

const defaultParams = {
  sources: ['Text 1 (fictional)', 'Usage note B (fictional)'],
  hierarchy: ['Level 1 (user-supplied)', 'Level 2 (user-supplied)', 'Level 3 (user-supplied)'],
  passages: [
    {ref: 'Text 1 · Art. 7 (fictional)', heading: 'Keeping of items', text: 'The holder keeps each listed item in the register (simulated wording).', term: 'listed item', level: 3},
    {ref: 'Text 1 · Art. 2 (fictional)', heading: 'Definitions', text: 'means an object entered in the annex (simulated wording).', term: 'listed item', level: 2},
  ],
  entryRow: 2,
  actorLabels: {a: 'Reader', b: 'Article extract'},
  objectLabels: {hierarchy: 'Hierarchy (user-supplied)'},
  actionProgress: 1,
  annotations: [{target: 'definition', text: 'Definition supplied in another section'}],
  finalState: 'definition-linked',
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
    const t = kitStrings(p.locale);
    const stage = definitionDesk(ctx, {prefix: 'st', axis, params: {...p, objectLabels: {hierarchy: p.objectLabels.hierarchy}}, entryRow: p.entryRow});
    const fs = stage.fs;
    const W0 = stage.W, H0 = stage.H;
    const obstacles = [stage.sheetBox, {...stage.bookBox, w: stage.bookBox.w + stage.G.flagW}, ...stage.chips.map(c => c.box),
      {x: stage.lensRest.x - 110, y: stage.lensRest.y - 90, w: 220, h: 180}];
    // state tag: a free corner at the bottom right (tall: right column under the book)
    const stateText = {'definition-linked': t.linked, 'definition-located': t.located, 'term-marked': t.marked}[p.finalState];
    const tagSize = 25 * fs;
    let tag = null;
    if (ctx.show('key')) {
      const at = axis === 'vertical'
        ? {x: W0 - 26, y: H0 - 150, anchor: 'end', maxWidth: 460}
        : {x: W0 - 26, y: H0 - 150 * fs, anchor: 'end', maxWidth: 420};
      tag = statusTag(ctx, stateText, {...at, size: tagSize, name: 'state-tag', color: p.finalState === 'definition-linked' ? ctx.theme.accent : ctx.theme.inkSoft});
      obstacles.push(tag.box);
    }
    // editorial notes: first free candidate slot, leader to the target
    const targets = {
      term: {x: stage.termC.x, y: stage.termC.y - stage.sheet.termBox.h / 2 - 4},
      definition: (() => { const b = stage.rowBox(stage.entryRow); return {x: b.x + b.w * 0.6, y: b.y + b.h}; })(),
      flag: (() => { const b = stage.flagBox(stage.dLvl); return {x: b.x + b.w * 0.6, y: b.y + b.h}; })(),
      extract: {x: stage.sheetBox.x + stage.sheetBox.w * 0.7, y: stage.sheetBox.y + stage.sheetBox.h},
      book: {x: stage.hinge.x - stage.G.pw * 0.5, y: stage.bookBox.y + stage.bookBox.h},
    };
    const slots = {
      horizontal: [{x: 1010, y: 660, anchor: 'middle', maxWidth: 420}, {x: 790, y: 16, anchor: 'middle', maxWidth: 520}, {x: 700, y: 700, anchor: 'middle', maxWidth: 380}],
      square: [{x: 960, y: 716, anchor: 'middle', maxWidth: 440}, {x: 640, y: 18, anchor: 'middle', maxWidth: 520}, {x: 700, y: 800, anchor: 'middle', maxWidth: 380}],
      vertical: [{x: 752, y: 650, anchor: 'middle', maxWidth: 420}, {x: 752, y: 1040, anchor: 'middle', maxWidth: 420}, {x: 520, y: 20, anchor: 'middle', maxWidth: 360}],
    }[axis];
    const notes = [];
    if (ctx.show('all')) {
      p.annotations.forEach((a, i) => {
        const tgt = targets[a.target];
        let chosen = null;
        for (const sl of slots) {
          const c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: sl.x, y: sl.y}, anchor: sl.anchor, target: tgt, maxWidth: sl.maxWidth, size: 22 * fs, maxLines: 3});
          if (c.box.y + c.box.h > H0 - 6 || c.box.x < 6 || c.box.x + c.box.w > W0 - 6) continue;
          if (obstacles.some(b => overlaps(c.box, b, 6))) continue;
          chosen = c;
          break;
        }
        if (!chosen) {
          const sl = slots[0];
          chosen = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: sl.x, y: sl.y}, anchor: sl.anchor, target: tgt, maxWidth: sl.maxWidth, size: 22 * fs, maxLines: 3});
        }
        obstacles.push(chosen.box);
        notes.push(chosen);
      });
    }
    return {stage, s, ox, oy, tag, notes};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)}, L.stage.node, L.tag && L.tag.node, L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const fsx = p.finalState;
    const opens = fsx !== 'term-marked';
    const links = fsx === 'definition-linked';
    const w = (key, on = true) => (on ? seg(a, ...W[key]) : 0);
    const v = {
      lEnter: w('lEnter'), lensMove: w('lensMove'), mark: w('mark'), lensPark: w('lensPark'),
      rEnter: w('rEnter', opens), open: w('open', opens), rOut: w('rOut', opens),
      pinsTake: w('pinsTake', links), pinA: w('pinA', links), carry: w('carry', links), entryHl: w('entryHl', links),
      // without a link the empty hand leaves right after parking the lens
      lOut: links ? w('lOut') : seg(a, W.pinsTake[0], W.pinA[1]),
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.tag[0]) / (W.tag[1] - W.tag[0])) : 0};
    const noteP = done ? seg(u, ...W.notes) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    return {nodes, semantic: {...posed.semantic, beat, finalState: fsx, actionCapped: p.actionProgress < 1 && u > capU}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'sources-02-story',
    title: 'Legislative definition — the term pinned to its definition',
    titleEs: 'Definición legislativa — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Definición legislativa',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down reading desk: a hand lens finds and marks a term in an article extract; the other hand opens the full text at the index flag of the level that holds the definitions section; two pins and a cord join the term to the entry that supplies its definition, which lights up only once the pin is in. Fictional text, user-supplied hierarchy, supplied state only.',
    tags: ['definition', 'defined term', 'cross-reference', 'book', 'index flags', 'hierarchy', 'magnifier', 'pins', 'cord', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/definicion-legislativa.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
