/**
 * LAW-0145 — Delegación normativa · story
 *
 * Storyboard (top-down records desk shared by a reader and a clerk; brief
 * beats in brackets):
 *  [0.00–0.15] rest: the bound volume (Text 1, the anchor) open at its
 *              enabling page with Art. 12 on the right page; the instrument
 *              sheet (Instrument 3) to its side, a gold link cord threaded
 *              through the eyelet beside its basis clause, the cord's loose
 *              end (a binder clip) and a blank paper tag lying in the gap;
 *              the editable hierarchy board (user-supplied levels, one token
 *              per text), a reading card and a hand lens. The reader's hand
 *              comes in for the lens.
 *  [0.15–0.42] the reader holds the lens over the instrument's basis clause
 *              (its glass shows a real enlarged copy) and the reference
 *              phrase "Text 1 · Art. 12" is swept with highlighter; the lens
 *              goes back. The clerk's hand takes the clip.
 *  [0.42–0.73] the clerk carries the clip across the desk on an arc — the
 *              cord pays out behind it, keeping its length — to the edge of
 *              the enabling page level with Art. 12. SUPPLIED state
 *              "authorization supplied": the clip is clamped on the page, the
 *              cord runs nearly taut and the enabling passage is highlighted.
 *              "authorization to be checked": the clip is laid open on the
 *              desk beside the page edge (not fastened), the cord stays slack
 *              and the passage only gets a dashed pencil outline. The tag on
 *              the cord is turned to its written face (the state).
 *  [0.73–1.00] hold: the link and its supplied state, the "as supplied · no
 *              conclusion drawn" key and the editorial note. Nothing says the
 *              instrument is valid or binding; the hierarchy is only shown.
 * @module animations/sources/LAW-0145
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, lerp, r} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {callout, chip} from '../../primitives/annotate.js';
import {linkDesk, placeFree, sourcesFields, SOURCES_DEFAULTS, KIT_STRINGS, kitT, LINK_STATES, boxesOverlap, wordSafe} from './kits/delegacion-normativa.js';

const ID = 'LAW-0145';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action sub-windows (normalized). */
const W = {
  lensGrab: [0.05, 0.16], lensCarry: [0.16, 0.26], hlRef: [0.24, 0.33], lensBack: [0.34, 0.43], lensRelease: [0.43, 0.53],
  grab: [0.24, 0.4], carry: [0.42, 0.61], place: [0.61, 0.66], hlArt: [0.65, 0.72], flip: [0.66, 0.72], back: [0.66, 0.78],
  key: [0.74, 0.8], note: [0.78, 0.86],
};
const ACTION_END = 0.78;
const TARGETS = ['link', 'book', 'instrument', 'hierarchy', 'lens'];

const sceneSchema = {
  ...sourcesFields,
  ...storyFields({
    hierarchy: str('Heading printed on the editable hierarchy board', 40),
  }, TARGETS, LINK_STATES),
};
sceneSchema.actorLabels.properties.a.description = 'Caption for the reader (the hand that brings the lens)';
sceneSchema.actorLabels.properties.b.description = 'Caption for the clerk (the hand that carries the link cord to the enabling page)';
sceneSchema.finalState.description = 'Link state supplied by the author for the final hold: authorization-supplied (clip fastened on the enabling page) or authorization-to-be-checked (clip laid open beside it). Nothing is inferred; validity is never stated';

const defaultParams = {
  ...SOURCES_DEFAULTS,
  actorLabels: {a: 'Reader', b: 'Clerk'},
  objectLabels: {hierarchy: 'Editable hierarchy'},
  actionProgress: 1,
  annotations: [{target: 'hierarchy', text: 'Order entered by the user; not applied'}],
  finalState: 'authorization-supplied',
};

const LAYOUT = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

const scene = {
  sizes: {landscape: [1690, 800], square: [950, 800], portrait: [950, 1420]},
  layout(ctx0) {
    // whole-word wrapping (no word split across lines; punctuation stays with its word)
    const ctx = wordSafe(ctx0);
    const p = ctx.params;
    const t = kitT(ctx);
    const layout = LAYOUT[ctx.view.shape];
    const mkSt = textFloor => linkDesk(ctx, {
      prefix: 'st', layout, content: p, hierarchyLabel: p.objectLabels.hierarchy, state: p.finalState,
      chips: {a: p.actorLabels.a, b: p.actorLabels.b}, seedKey: 'dn-story',
      // square: a strip above the texts keeps room for the key and an editorial note
      reserveTop: layout === 'square' && ctx.show('all') && p.annotations.length ? 72 : 0,
      textFloor, gripWire: true,
    });
    // small print (ids, board, card, tag) never under ~16.4 px at 1080p: the floor follows the stage scale
    const CAN0 = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[ctx.view.shape];
    const pxOf = q => Math.min(CAN0[0] * 0.88 / ctx.design.w, CAN0[1] * 0.74 / ctx.design.h) * Math.min(ctx.design.w / q.W, ctx.design.h / q.H);
    let st = mkSt(0);
    for (let k = 0; k < 2; k++) st = mkSt(16.4 / pxOf(st));
    const SW = st.W, SH = st.H;
    const s = Math.min(ctx.design.w / SW, ctx.design.h / SH);
    const ox = (ctx.design.w - SW * s) / 2;
    const oy = (ctx.design.h - SH * s) / 2;
    const size = st.G.size;
    const tagBox = st.tagBoxFor(p.finalState);
    const clipBox = st.clipBoxFor(p.finalState);
    const obstacles = [st.bookBox, st.instBox, st.boardBox, st.noteBox, ...st.lensFp.boxes, ...st.chipBoxes, tagBox, clipBox].filter(Boolean);
    const bounds = {x: 14, y: 10, w: SW - 28, h: SH - 20};
    const inB = b => b.x >= bounds.x && b.y >= bounds.y && b.x + b.w <= bounds.x + bounds.w && b.y + b.h <= bounds.y + bounds.h;

    // editorial notes next to their targets (leader crossing no object)
    const targets = {
      // the link: its leader reaches the clip (the object the link state is about), not the cord
      link: {pt: {x: clipBox.x + clipBox.w / 2, y: clipBox.y + clipBox.h / 2}, box: clipBox},
      book: {pt: {x: st.bookC.x - st.book.pw * 0.5, y: st.bookC.y + st.book.top + 30}, box: st.bookBox},
      instrument: {pt: {x: st.instAt.x + st.inst.w * 0.5, y: st.instAt.y + 16}, box: st.instBox},
      hierarchy: {pt: {x: st.boardAt.x + st.board.w - 4, y: st.boardAt.y + 22}, box: st.boardBox},
      lens: {pt: {x: st.lensRest.x, y: st.lensRest.y - st.G.lupa.R}, box: st.lensFp.boxes[0]},
    };
    const notes = [];
    if (ctx.show('all')) {
      p.annotations.forEach((a, i) => {
        const tg = targets[a.target];
        const make = q => {
          const c = callout(ctx, {name: `note${i}`, text: a.text, chipAt: q.chipAt, anchor: q.anchor, target: tg.pt, maxWidth: q.maxWidth, size, maxLines: 6});
          c.fit = ctx.fit(a.text, {maxWidth: q.maxWidth - size * 1.2, size, minSize: size * 0.75, maxLines: 6, weight: 600});
          return c;
        };
        // the leader keeps a clear margin from every other object and caption (it never grazes the key)
        const placed = placeFree(ctx, {text: a.text, target: tg.pt, targetBox: tg.box, obstacles, bounds, widths: [420, 360, 300, 250, 210, 180, 160, 140], size, make, leaderPad: 16})
          || placeFree(ctx, {text: a.text, target: tg.pt, targetBox: tg.box, obstacles, bounds, widths: [420, 360, 300, 250, 210], size, make})
          || placeFree(ctx, {text: a.text, target: tg.pt, targetBox: tg.box, obstacles, bounds, widths: [420, 360, 300, 250, 210], size, make, noLeader: true})
          || make({chipAt: {x: SW - 30, y: 24}, anchor: 'end', maxWidth: 360});
        obstacles.push(placed.box);
        // the leader's own corridor: the key never sits on it
        const b = placed.box, q = tg.pt;
        const f = {x: Math.max(b.x, Math.min(q.x, b.x + b.w)), y: q.y > b.y + b.h ? b.y + b.h : q.y < b.y ? b.y : b.y + b.h / 2};
        for (let k = 0; k <= 10; k++) obstacles.push({x: f.x + (q.x - f.x) * k / 10 - 6, y: f.y + (q.y - f.y) * k / 10 - 6, w: 12, h: 12});
        notes.push(placed);
      });
    }
    // key: "as supplied · no conclusion drawn" in free desk space
    let key = null;
    if (ctx.show('key')) {
      const mk = (x, y, anchor, mw) => chip(ctx, t.keyNote, {x, y, anchor, maxWidth: mw, size, minSize: size * 0.95, maxLines: 2, fill: ctx.theme.card, name: 'key-note', weight: 600});
      const cands = {
        horizontal: [{x: 22, y: 'above-note', anchor: 'start'}, {x: 22, y: 'below-board', anchor: 'start'}],
        square: [{x: 18, y: 'below-board', anchor: 'start'}, {x: SW - 18, y: 'below-note', anchor: 'end'}],
        vertical: [{x: 24, y: 'bottom', anchor: 'start'}, {x: SW / 2, y: 'bottom', anchor: 'middle'}],
      }[layout];
      for (const mw of [420, 380, 320, 260]) {
        for (const c of cands) {
          const probe = mk(0, 0, 'start', mw);
          const y = c.y === 'bottom' ? SH - 14 - probe.box.h : c.y === 'below-board' ? (st.boardBox ? st.boardBox.y + st.boardBox.h + 12 : 20) : c.y === 'above-note' ? (st.noteBox ? st.noteBox.y - 12 - probe.box.h : SH - 14 - probe.box.h) : (st.noteBox ? st.noteBox.y + st.noteBox.h + 12 : 20);
          const k = mk(c.x, y, c.anchor, mw);
          if (inB(k.box) && !obstacles.some(b => boxesOverlap(k.box, b, 6)) && !k.fit.truncated) { key = k; break; }
        }
        if (key) break;
      }
      if (!key) {
        const kb = st.bookBox;
        key = placeFree(ctx, {text: t.keyNote, target: {x: kb.x, y: kb.y + kb.h}, obstacles, bounds, widths: [420, 340, 280], size, make: q => mk(q.chipAt.x, q.chipAt.y, "start", q.maxWidth), goodEnough: 1e9, noLeader: true})
          || mk(cands[0].x, SH - 14 - mk(0, 0, 'start', 460).box.h, cands[0].anchor, 460);
      }
      obstacles.push(key.box);
    }

    // each note's leader: where it ends and how far it keeps from the key chip (design units)
    const boxGap = (q, b) => Math.hypot(Math.max(b.x - q.x, 0, q.x - b.x - b.w), Math.max(b.y - q.y, 0, q.y - b.y - b.h));
    const noteLeaders = notes.map((n, i) => {
      const a = p.annotations[i], tg = targets[a.target], b = n.box;
      const from = {x: Math.max(b.x, Math.min(tg.pt.x, b.x + b.w)), y: tg.pt.y > b.y + b.h ? b.y + b.h : tg.pt.y < b.y ? b.y : b.y + b.h / 2};
      if (from.y === b.y + b.h / 2) from.x = tg.pt.x > b.x + b.w / 2 ? b.x + b.w : b.x;
      const pts = Array.from({length: 41}, (_, k) => ({x: from.x + (tg.pt.x - from.x) * k / 40, y: from.y + (tg.pt.y - from.y) * k / 40}));
      const tb = tg.box;
      return {target: a.target, endInTarget: tg.pt.x >= tb.x && tg.pt.x <= tb.x + tb.w && tg.pt.y >= tb.y && tg.pt.y <= tb.y + tb.h,
        keyGap: key ? r(Math.min(...pts.map(q => boxGap(q, key.box))), 1) : 999};
    });
    const notesClear = notes.every((n, i) => [st.bookBox, st.instBox, st.boardBox, st.noteBox, tagBox, clipBox, key && key.box, ...notes.filter((_, j) => j !== i).map(q => q.box)].filter(Boolean).every(b => !boxesOverlap(n.box, b, 2)));
    const keyClear = !key || [st.bookBox, st.instBox, st.boardBox, st.noteBox, tagBox, clipBox, ...st.lensFp.boxes, ...st.chipBoxes].filter(Boolean).every(b => !boxesOverlap(key.box, b, 2));
    // design units → px in the canonical 1080p frame of this shape (default safe area)
    const CAN = {landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1920]}[ctx.view.shape];
    const px = Math.min(CAN[0] * 0.88 / ctx.design.w, CAN[1] * 0.74 / ctx.design.h) * s;
    return {st, s, ox, oy, key, notes, noteLeaders, layout, notesClear, keyClear, tagBox, px, tagInside: inB(tagBox)};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.st.node,
      L.key && L.key.node,
      L.notes.map(n => n.node));
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const v = {};
    for (const k of ['lensGrab', 'lensCarry', 'hlRef', 'lensBack', 'lensRelease', 'grab', 'carry', 'place', 'hlArt', 'flip', 'back']) v[k] = seg(a, ...W[k]);
    const posed = L.st.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const keyP = done ? seg(u, ...W.key) : 0;
    if (L.key) nodes['key-note'] = {opacity: r(keyP, 3)};
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
        stateShown: sem.tagFlip >= 1,
        keyShown: keyP >= 1,
        actionCapped: p.actionProgress < 1 && u > capU,
        layout: L.layout,
        lensParkedInDesk: L.st.lensParked.inDesk,
        lensParkedClear: L.st.lensParked.clear,
        keyChipsWhole: L.st.chipFits.every(f => !f.truncated),
        notesClear: L.notesClear,
        noteLeaders: L.noteLeaders,
        keyClear: L.keyClear,
        tagInside: L.tagInside,
        tagPx: r(L.st.tag.textSize * L.px, 2),
        stage: {W: L.st.W, H: L.st.H, s: r(L.s, 3)},
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
    slug: 'sources-07-story',
    title: 'Delegated rule-making — the link cord from instrument to enabling page',
    titleEs: 'Delegación normativa — Microescena con objetos y actores',
    category: 'sources',
    categoryName: 'Fuentes e interpretación',
    motif: 'Delegación normativa',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Top-down records desk: a reader checks the basis clause of a fictional instrument with a hand lens and its reference phrase is highlighted; a clerk carries the gold link cord threaded beside that clause across the desk and clips it to the enabling page of a bound volume (Text 1 · Art. 12), or lays it open beside the page, as supplied. A tag on the cord shows the supplied link state (authorization supplied / to be checked). An editable hierarchy board shows a user-supplied ordering that is never applied; no validity is stated.',
    tags: ['delegated rule-making', 'enabling provision', 'instrument', 'link', 'cord', 'clip', 'book', 'editable hierarchy', 'magnifier', 'hands', 'fictional'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/sources/kits/delegacion-normativa.js', 'src/animations/sources/kits/conflicto-entre-textos.js', 'src/primitives/desk.js', 'src/primitives/annotate.js', 'src/primitives/paper.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: KIT_STRINGS,
  scene,
});
