/**
 * LAW-0121 — Texto y contexto · story
 *
 * Storyboard (top-down reading desk; brief beats in brackets):
 *  [0.00–0.15] rest: the editable hierarchy (a rack whose rows carry the
 *              author's neutral labels, with an empty slot where the open book
 *              belongs), the open book with the article on its right page and
 *              the key word lightly marked, a magnifier lying on the desk; the
 *              reader's hand takes the magnifier by its handle.
 *  [0.15–0.42] the hand carries the magnifier over the key word; the glass
 *              shows a real magnified copy of the page. The hand raises it:
 *              the lens grows, the word grows under it, the rest of the words
 *              fade inside the glass and the desk dims — the word is read on
 *              its own. The isolated-reading card appears (attributed).
 *  [0.42–0.73] the hand lowers the magnifier: the word shrinks back onto its
 *              line; the magnifier is carried back and laid down, the hand
 *              rests. The word's passage is ringed, then the full article; the
 *              other occurrences of the same word are marked in the margin
 *              rail; a ribbon ties the book to its slot on the rack.
 *  [0.73–1.00] hold: the contextual-reading card (attributed) and the state
 *              supplied by the author. No reading is marked correct.
 * finalState 'enlarged' holds the raised lens; 'returned' stops after the
 * word is back in the ringed article; 'in-context' shows every context mark.
 * @module animations/sources/LAW-0121
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r, ease} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag, chip} from '../../primitives/annotate.js';
import {shade} from '../../primitives/paper.js';
import {deskStage, STAGE, sourcesFields, TC_DEFAULTS, TC_STRINGS, kitStrings, readingCard, leader, polyLeader, wordLeaderPts, pathHits} from './kits/texto-y-contexto.js';

const ID = 'LAW-0121';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  grab: [0.03, 0.12], carry: [0.14, 0.26], lift: [0.27, 0.36], cardA: [0.35, 0.42],
  lower: [0.43, 0.5], back: [0.5, 0.6], release: [0.6, 0.67],
  ringP: [0.5, 0.57], ringA: [0.56, 0.64], rail: [0.62, 0.7], ribbon: [0.66, 0.73],
  cardB: [0.74, 0.8], tag: [0.8, 0.86], note: [0.84, 0.94],
};
const ACTION_START = W.grab[0];
const FINAL = ['in-context', 'returned', 'enlarged'];
/** action end per supplied final state */
const END = {'in-context': W.ribbon[1], returned: W.ringA[1] + 0.02, enlarged: W.cardA[1]};

const sceneSchema = {
  ...sourcesFields,
  ...storyFields({
    isolated: str('Title of the isolated-reading card (comparison A)', 40),
    contextual: str('Title of the contextual-reading card (comparison B)', 40),
  }, ['word', 'article', 'rack', 'lens'], FINAL),
};
sceneSchema.actorLabels.properties.a.description = 'Caption for the reader (the hand)';
sceneSchema.actorLabels.properties.b.description = 'Tab on the ring drawn around the full article (the interlocutor object)';

const defaultParams = {
  ...TC_DEFAULTS,
  actorLabels: {a: 'Reader', b: 'Full article'},
  objectLabels: {isolated: 'Isolated reading', contextual: 'Contextual reading'},
  actionProgress: 1,
  annotations: [{target: 'rack', text: 'Where the author placed this text'}],
  finalState: 'in-context',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

/** Card column/row placement per axis (stage units). */
function cardSlots(stage, axis) {
  if (axis === 'horizontal') return {mode: 'column', x: 1336, y: 34, w: 530, maxH: stage.rest.y - 110 - 34};
  // rows: card A (isolated) sits on the article's side so its leader can run down/up the page margin
  // (square cards sit low enough for the state tag hanging under the article frame)
  if (axis === 'square') return {mode: 'row', x: 24, y: 678, w: 440, gap: 16, maxH: stage.H - 678 - 14, aRight: false};
  return {mode: 'row', x: 28, y: 24, w: 462, gap: 20, maxH: stage.pg.box.y - 24 - 22, aRight: true};
}

const scene = {
  sizes: {landscape: [STAGE.horizontal.w, STAGE.horizontal.h], square: [STAGE.square.w, STAGE.square.h], portrait: [STAGE.vertical.w, STAGE.vertical.h]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const axis = AXIS[ctx.view.shape];
    const st = STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const t = kitStrings(p.locale);
    const stage = deskStage(ctx, {prefix: 'st', axis, params: p, readerLabel: p.actorLabels.a, articleLabel: p.actorLabels.b});
    // reading cards (equal weight, attributed)
    const slots = cardSlots(stage, axis);
    const mk = (size, which, x, y, w) => readingCard(ctx, {
      name: `card${which}`, x, y, w, kind: which === 'A' ? 'isolated' : 'contextual',
      title: which === 'A' ? p.objectLabels.isolated : p.objectLabels.contextual,
      text: which === 'A' ? p.interpretations.isolated.text : p.interpretations.contextual.text,
      by: which === 'A' ? p.interpretations.isolated.by : p.interpretations.contextual.by,
      proposedBy: t.proposedBy, color: which === 'A' ? th.accent3 : th.accent2, soft: which === 'A' ? th.accent3Soft : th.accent2Soft, size, maxLines: 3,
    });
    let cardA, cardB;
    for (let size = axis === 'vertical' ? 26 : 25; size >= 18; size -= 1) {
      if (slots.mode === 'column') {
        cardA = mk(size, 'A', slots.x, slots.y, slots.w);
        cardB = mk(size, 'B', slots.x, slots.y + cardA.h + 22, slots.w);
        if (cardA.h + 22 + cardB.h <= slots.maxH) break;
      } else {
        const xa = slots.aRight ? slots.x + slots.w + slots.gap : slots.x;
        const xb = slots.aRight ? slots.x : slots.x + slots.w + slots.gap;
        cardA = mk(size, 'A', xa, slots.y, slots.w);
        cardB = mk(size, 'B', xb, slots.y, slots.w);
        if (Math.max(cardA.h, cardB.h) <= slots.maxH) break;
      }
    }
    // leaders: card A → the key word; card B → the ring around the article
    const kw = stage.key;
    const aB = stage.aBox;
    const kd = stage.keyDotPt;
    const mx = stage.railRight;
    let leadA;
    if (axis === 'horizontal') leadA = leader('leadA', cardA.box, {x: kd.x + 8, y: kd.y}, th.accent3, 2.5, 'left');
    else if (axis === 'square') {
      // up from card A into the gap under the book, along the page margin, into the marker
      // (runs just above the cards, under the state tag that hangs from the frame)
      const gy = cardA.box.y - 14;
      const x0 = Math.min(cardA.box.x + cardA.box.w - 24, mx);
      leadA = polyLeader('leadA', [{x: x0, y: cardA.box.y - 2}, {x: x0, y: gy}, {x: mx, y: gy}, {x: mx, y: kd.y}, {x: kd.x + 8, y: kd.y}], th.accent3);
    } else {
      // down from card A along the page margin, into the marker
      const x0 = Math.max(cardA.box.x + 24, Math.min(cardA.box.x + cardA.box.w - 24, mx));
      leadA = polyLeader('leadA', [{x: x0, y: cardA.box.y + cardA.box.h + 2}, {x: mx, y: cardA.box.y + cardA.box.h + 14}, {x: mx, y: kd.y}, {x: kd.x + 8, y: kd.y}], th.accent3);
    }
    const leadB = axis === 'horizontal'
      ? leader('leadB', cardB.box, {x: aB.x + aB.w, y: Math.min(aB.y + aB.h * 0.5, cardB.box.y + cardB.box.h - 20)}, th.accent2, 2.5, 'left')
      : axis === 'square'
        ? leader('leadB', cardB.box, {x: Math.max(aB.x + 40, Math.min(aB.x + aB.w - 40, cardB.box.x + cardB.box.w / 2)), y: aB.y + aB.h}, th.accent2, 2.5, 'top')
        : leader('leadB', cardB.box, {x: aB.x + 40, y: aB.y}, th.accent2, 2.5, 'bottom');
    // state tag: wide → bottom band; square/tall → hangs from the frame of the
    // full article, right under its "Full article" tab (so it reads as the
    // frame's state, not as a loose note)
    const Lp = stage.pg.left;
    const stateText = {enlarged: t.stateEnlarged, returned: t.stateReturned, 'in-context': t.stateInContext}[p.finalState];
    const tagSize = axis === 'vertical' ? 25 : 23;
    const noteSize = axis === 'vertical' ? 23 : 21;
    const bb = stage.pg.box;
    const rk = stage.rack.box;
    let tag = null;
    if (ctx.show('key')) {
      if (axis === 'horizontal') tag = statusTag(ctx, stateText, {x: bb.x + 6, y: bb.y + bb.h + 26, maxWidth: 520, size: tagSize, name: 'state-tag', color: th.accent2});
      else {
        const tb = stage.tabA ? stage.tabA.box : {x: aB.x + aB.w - 10, y: aB.y + aB.h - 4, w: 0, h: 0};
        const right = tb.x + tb.w;
        const maxW = axis === 'square' ? 262 : 280;
        tag = chip(ctx, stateText, {x: right, y: tb.y + tb.h + 6, anchor: 'end', maxWidth: maxW, size: tagSize - 1, maxLines: 2, fill: th.card, stroke: th.accent2, color: shade(th.accent2, -0.2), weight: 700, name: 'state-tag'});
        tag.node.attrs.opacity = 0;
      }
    }
    const slot = stage.slot;
    const targets = {
      word: {x: kw.cx, y: kw.y + kw.h + 6},
      article: {x: aB.x, y: aB.y + aB.h * 0.6},
      rack: slot ? {x: slot.x - 2, y: slot.y + slot.h / 2} : {x: rk.x + rk.w / 2, y: rk.y + 20},
      lens: {x: stage.rest.x - stage.lupa.R * 0.7, y: stage.rest.y - stage.lupa.R * 0.7},
    };
    const notes = [];
    if (ctx.show('all')) {
      const tagBox = axis === 'horizontal' && tag ? tag.box : null;
      let nextX = tagBox ? tagBox.x + tagBox.w + 24 : bb.x;
      let nextY = Lp.y + Lp.h * 0.36;
      const sideW = Lp.w * 0.84;
      const sideX = Lp.x + Lp.w * 0.08;
      p.annotations.forEach((a, i) => {
        const mk = (at, tg, anchor = 'start') => {
          const c0 = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: at.x, y: at.y}, anchor, target: tg, maxWidth: at.maxWidth, size: noteSize, maxLines: at.lines, color: th.inkSoft});
          // the straight leader the callout draws (chip edge nearest the target → target)
          const b = c0.box;
          const from = {x: Math.max(b.x, Math.min(tg.x, b.x + b.w)), y: tg.y > b.y + b.h ? b.y + b.h : tg.y < b.y ? b.y : b.y + b.h / 2};
          if (from.y === b.y + b.h / 2) from.x = tg.x > b.cx ? b.x + b.w : b.x;
          c0.pts = [from, tg];
          return c0;
        };
        let c;
        if (a.target === 'word') {
          // on the left page, level with the word; the leader crosses the gutter
          // and reaches the word through the blank band under its line, so it
          // never runs through the article's text (any axis, any preset)
          const probe = chip(ctx, a.text, {x: sideX, y: 0, maxWidth: sideW, size: noteSize, maxLines: 3});
          const yg = wordLeaderPts(stage, {x: sideX, y: -1e5, w: probe.box.w, h: 2e5})[0].y;
          let y0 = Math.max(stage.titleBottom + 14, yg - probe.box.h / 2);
          for (const n of notes) {
            const b = n.box;
            if (b.x < sideX + probe.box.w && b.x + b.w > sideX && b.y < y0 + probe.box.h + 10 && b.y + b.h + 10 > y0) y0 = b.y + b.h + 12;
          }
          y0 = Math.min(Lp.y + Lp.h - probe.box.h - 12, y0);
          const cw = chip(ctx, a.text, {x: sideX, y: y0, maxWidth: sideW, size: noteSize, maxLines: 3, fill: th.card, stroke: th.inkSoft, color: th.ink, name: `note${i}-chip`});
          const pts = wordLeaderPts(stage, cw.box);
          const ld = polyLeader(`note${i}-lead`, pts, th.inkSoft, 2.5, 5);
          c = {
            node: g({name: `note${i}`, opacity: 0}, ld.node, cw.node),
            frame: q => ({[`note${i}`]: {opacity: q > 0 ? 1 : 0}, ...ld.frame(Math.min(1, q * 1.6)), [`note${i}-chip`]: {opacity: r(clamp((q - 0.45) / 0.55), 3)}}),
            box: cw.box,
            pts,
          };
          nextY = Math.max(nextY, cw.box.y + cw.box.h + 12);
        } else if (a.target === 'rack' && axis === 'horizontal') {
          c = mk({x: rk.x, y: rk.y + rk.h + 16, maxWidth: rk.w + 10, lines: 2}, {x: rk.x + 40, y: rk.y + rk.h - 2});
          c = mk({x: rk.x, y: rk.y + rk.h + 16, maxWidth: rk.w + 10, lines: 2}, {x: Math.min(rk.x + rk.w - 30, c.box.x + 40), y: rk.y + rk.h - 2});
        } else if (a.target === 'rack' && axis === 'vertical' && stage.ribbon) {
          // beside the rack, under the reader tag; the leader lands on the ribbon
          // that runs into the book's slot (the note labels that ribbon)
          const x0 = rk.x + rk.w + 22;
          const top = Math.max(stage.rest.y + stage.lupa.R + 40, stage.readerChip ? stage.readerChip.box.y + stage.readerChip.box.h + 16 : 0);
          const tgt = stage.ribbon.at(0.62);
          c = mk({x: x0, y: top, maxWidth: stage.W - 16 - x0, lines: 3}, {x: tgt.x, y: tgt.y});
        } else if (a.target === 'rack' && stage.ribbon && axis === 'square') {
          // square: level with the ribbon's end on the book cover; the leader lands
          // on that end, so the note labels the ribbon that runs into the slot
          const rf = stage.ribbon.ends.from;
          const probe = mk({x: sideX, y: 0, maxWidth: sideW, lines: 3}, rf);
          const y0 = Math.max(nextY, rf.y - probe.box.h / 2);
          c = mk({x: sideX, y: y0, maxWidth: sideW, lines: 3}, rf);
          nextY = c.box.y + c.box.h + 12;
        } else if (a.target === 'rack') {
          c = mk({x: sideX, y: nextY, maxWidth: sideW, lines: 3}, {x: rk.x + rk.w - 2, y: nextY + 20});
          nextY = c.box.y + c.box.h + 12;
        } else if (axis === 'horizontal') {
          c = mk({x: nextX, y: bb.y + bb.h + 22, maxWidth: Math.max(200, bb.x + bb.w - nextX), lines: 2}, targets[a.target]);
          nextX = c.box.x + c.box.w + 16;
        } else {
          c = mk({x: sideX, y: nextY, maxWidth: sideW, lines: 3}, targets[a.target]);
          nextY = c.box.y + c.box.h + 12;
        }
        notes.push(c);
      });
    }
    // every leader of the scene, checked against the article's printed lines
    const leaderPaths = [leadA.pts, leadB.pts, ...notes.map(n => n.pts)];
    const leaderTextHits = leaderPaths.reduce((n, pts) => n + pathHits(pts, stage.textBoxes, 1), 0);
    return {stage, s, ox, oy, cardA, cardB, leadA, leadB, tag, notes, leaderTextHits};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.leadA.node, L.leadB.node,
      L.cardA.node, L.cardB.node,
      L.tag && L.tag.node,
      L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const end = END[p.finalState];
    const capU = lerp(ACTION_START, end, p.actionProgress);
    const a = Math.min(u, capU, end);
    const full = p.finalState === 'in-context';
    const back = p.finalState !== 'enlarged';
    const w = name => seg(a, ...W[name]);
    const lift = w('lift');
    const lower = back ? w('lower') : 0;
    const liftNet = lift * (1 - lower);
    const v = {
      grab: w('grab'), carry: w('carry'), lift, lower,
      back: back ? w('back') : 0, release: back ? w('release') : 0,
      // the desk undims gently while the lens comes down (0.45–0.53), not in a snap
      dim: ease.inOutSine(lift) * (1 - ease.inOutSine(seg(a, 0.45, 0.53))), isolate: liftNet,
      ringP: back ? w('ringP') : 0, ringA: back ? w('ringA') : 0,
      rail: full ? w('rail') : 0, hlOthers: full ? w('rail') : 0, ribbon: full ? w('ribbon') : 0,
      hlKey: 0.35 + 0.65 * Math.max(seg(a, 0.2, 0.27), 0),
      keyDot: seg(a, W.cardA[0], W.cardA[0] + 0.03),
    };
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const cardAp = seg(a, ...W.cardA);
    const cardBp = full && done ? seg(u, ...W.cardB) : 0;
    nodes.cardA = {opacity: r(clamp(cardAp * 1.6), 3), transform: T(L.cardA.box.x, L.cardA.box.y + (1 - cardAp) * 14)};
    nodes.cardB = {opacity: r(clamp(cardBp * 1.6), 3), transform: T(L.cardB.box.x, L.cardB.box.y + (1 - cardBp) * 14)};
    Object.assign(nodes, L.leadA.frame(seg(a, W.cardA[0] + 0.02, W.cardA[1])));
    Object.assign(nodes, L.leadB.frame(full && done ? seg(u, W.cardB[0] + 0.02, W.cardB[1]) : 0));
    if (L.tag) nodes['state-tag'] = {opacity: done ? r(seg(u, ...W.tag), 3) : 0};
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        finalState: p.finalState,
        lift: r(v.lift * (1 - v.lower), 3),
        isolated: v.dim > 0.5,
        lensAtRest: v.grab < 1 || v.release > 0 || (v.back >= 1),
        wordInPlace: sem.magnification <= 1.61,
        context: {passage: v.ringP >= 1, article: v.ringA >= 1, occurrences: v.rail >= 1, rack: v.ribbon >= 1},
        occurrences: L.stage.others.length,
        cards: {isolated: cardAp >= 1, contextual: cardBp >= 1},
        actionCapped: p.actionProgress < 1 && u > capU,
        leaderTextHits: L.leaderTextHits,
        ribbonHits: L.stage.ribbonHits,
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
    slug: 'sources-01-story',
    title: 'Text and context — the word under the magnifier',
    titleEs: 'Texto y contexto — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Texto y contexto',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down reading desk: a hand raises a magnifier over a key word of a fictional article until the word is read on its own, then lowers it and lays it down; the word settles back into its line, its passage and the full article are ringed, the same word is marked where it recurs, and a ribbon ties the book to the row the author gave it on an editable rack. Both readings are attributed cards; none is marked correct.',
    tags: ['text', 'context', 'interpretation', 'magnifier', 'lupa', 'book', 'article', 'editable hierarchy', 'hand', 'reading'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/texto-y-contexto.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: TC_STRINGS,
  scene,
});
