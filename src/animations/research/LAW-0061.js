/**
 * LAW-0061 — Fuente primaria y comentario · story
 *
 * Storyboard (front view of a library reading wall; the researcher stands at
 * the right of a cork reading board, facing it):
 *  0.00–0.15 rest     Library bookcase (anchor: navy "source texts" shelf,
 *                     ochre "commentaries" shelf) with the catalogue-search
 *                     screen above it; the source page is pinned in the
 *                     board's left column; a dashed gutter separates the
 *                     empty margin column. The researcher holds the
 *                     commentator's index card (ficha). The query types in
 *                     and two SEPARATE result rows appear (source, commentary);
 *                     the matching volumes glow on their shelves.
 *  0.15–0.42 action   The found passage lights up on the source page. The
 *                     researcher lifts the card and carries it to the source:
 *                     the card's pinpoint tab reaches the page's right margin
 *                     while a red bracket closes around that passage; the
 *                     thread's eyelet on the tab is hooked on a pin there.
 *  0.42–0.73 complete The researcher pulls the card back across the gutter
 *                     into the margin column — the thread pays out between
 *                     pin and tab, the card never covers the page — then
 *                     pushes a pin through the card. The search screen shows
 *                     the two rows chained, still two rows.
 *  0.73–1.00 hold     Hand back at rest. Supplied state only: source page
 *                     unchanged, interpretation attributed, "linked, not
 *                     merged". No reading is endorsed or ranked.
 * The card follows the SOLVED hand while held (hand = grip every frame); the
 * pin press happens with the hand on the pin spot. finalState 'placed' pins
 * the card in the margin without tying the thread; 'held' stops with the card
 * still in the researcher's hand.
 * @module animations/research/LAW-0061
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, ease, r} from '../../core/time.js';
import {str, obj, num, list, oneOf, annotation} from '../../schemas/fields.js';
import {callout, chip} from '../../primitives/annotate.js';
import {personRig} from '../../primitives/person.js';
import {actorLook} from '../../primitives/people-style.js';
import {
  fpcContentFields, researcherField, FPC_DEFAULTS, FPC_STRINGS, fpcColors, linkedPassage, pinLabel,
  sourcePage, noteCard, corkBoard, bookcase, searchScreen, wallBackdrop, pushPin, threadD, threadPoint, boxesOverlap, stateChip, segmentHitsBox, nameChip,
} from './kits/fuente-primaria-y-comentario.js';

const ID = 'LAW-0061';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  type: [0.02, 0.1], rows: [0.08, 0.14], glowSrc: [0.1, 0.16], glowCom: [0.13, 0.19], glowOff: [0.3, 0.38],
  passage: [0.16, 0.24], lift: [0.17, 0.26], carry: [0.26, 0.4], lean: [0.24, 0.38], bracket: [0.3, 0.4],
  hook: [0.4, 0.44], pull: [0.44, 0.58], unlean: [0.44, 0.56], toPin: [0.58, 0.63], press: [0.63, 0.68],
  release: [0.68, 0.78], link: [0.44, 0.52], tags: [0.76, 0.84], note: [0.82, 0.9],
};
const ACTION_END = 0.78;
const SAG = 16;

const sceneSchema = {
  ...fpcContentFields,
  ...researcherField,
  actorLabels: obj('Caption shown under the researcher', {researcher: str('Role caption for the researcher', 50)}),
  objectLabels: obj('Labels printed on props', {
    sourceShelf: str('Plate under the source-texts shelf', 40),
    commentaryShelf: str('Plate under the commentaries shelf', 40),
    sourceColumn: str('Plaque above the board column that holds the source page', 30),
    marginColumn: str('Plaque above the board column that holds the side note', 30),
    search: str('Title of the catalogue-search screen', 40),
  }),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(['source', 'note', 'thread', 'library', 'search']), 0, 2),
  finalState: oneOf('State supplied for the final hold: linked (card pinned beside the page and tied to the passage), placed (card pinned in the margin, not tied) or held (card still in hand). No legal effect is inferred', ['linked', 'placed', 'held']),
};

const defaultParams = {
  ...FPC_DEFAULTS,
  researcher: {name: 'Lina Ortega', role: 'Researcher'},
  actorLabels: {researcher: 'Researcher'},
  objectLabels: {sourceShelf: 'Source texts', commentaryShelf: 'Commentaries', sourceColumn: 'Source text', marginColumn: 'Commentary', search: 'Catalogue search'},
  actionProgress: 1,
  annotations: [{target: 'note', text: 'The commentator’s reading sits beside the text, not inside it'}],
  finalState: 'linked',
};

/**
 * Stage geometry per layout shape (stage units, fitted into the design).
 * Left column: search screen over the bookcase; centre: cork board with the
 * source column, gutter and margin column; right: the researcher.
 */
const GEO = {
  landscape: {
    // the page is kept narrow enough that the thread across the gutter stays long (linked, not merged)
    stage: {w: 1600, h: 922}, floor: 866,
    screen: {x: 30, y: 30, w: 370, h: 300, size: 24},
    shelf: {x: 40, y: 376, w: 352, h: 490},
    board: {x: 424, y: 176, w: 928, h: 604},
    page: {x: 456, y: 222, w: 416, h: 530, text: 24, title: 27},
    gutter: 930, note: {x: 1054, w: 272, h: 232, text: 24},
    person: {x: 1446, k: 1.48}, rest: {dx: -112, y: 616}, chip: 30,
    zones: [{x: 430, y: 18, w: 1160, h: 146}, {x: 1340, y: 18, w: 250, h: 200}],
  },
  square: {
    // stacked like the portrait layout: library (left) and catalogue terminal (right, above the
    // researcher) on top, board + researcher below; the wall between them is the callout zone, so
    // leaders drop straight onto the board. The board sits low enough that the shelf plates never
    // stack onto the board's column plaques.
    stage: {w: 1180, h: 1000}, floor: 948, rows: 2,
    screen: {x: 804, y: 22, w: 368, h: 252, size: 24},
    shelf: {x: 20, y: 28, w: 400, h: 248},
    board: {x: 20, y: 384, w: 830, h: 476},
    page: {x: 54, y: 422, w: 384, h: 416, text: 22, title: 25},
    gutter: 494, note: {x: 552, w: 274, h: 222, text: 21},
    person: {x: 904, k: 1.4}, rest: {dx: -90, y: 740}, chip: 28,
    zones: [{x: 432, y: 14, w: 366, h: 336}],
  },
  portrait: {
    stage: {w: 920, h: 1424}, floor: 1372,
    screen: {x: 466, y: 70, w: 436, h: 300, size: 26},
    shelf: {x: 22, y: 56, w: 408, h: 580},
    board: {x: 16, y: 704, w: 732, h: 580},
    page: {x: 44, y: 748, w: 332, h: 508, text: 21, title: 24},
    gutter: 424, note: {x: 490, w: 232, h: 240, text: 21},
    person: {x: 826, k: 1.36}, rest: {dx: -88, y: 1136}, chip: 30,
    // the wall between terminal and board, and the floor strip under the board (for thread notes)
    zones: [{x: 452, y: 392, w: 460, h: 290}, {x: 16, y: 1334, w: 580, h: 86}],
  },
};

const scene = {
  sizes: {landscape: [1600, 900], square: [1240, 1040], portrait: [920, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const t = ctx.t;
    const C = fpcColors(ctx);
    const shape = ctx.view.shape;
    const G0 = GEO[shape];
    const D = ctx.design;
    const s = Math.min(D.w / G0.stage.w, D.h / G0.stage.h);
    const ox = (D.w - G0.stage.w * s) / 2;
    const oy = (D.h - G0.stage.h * s) / 2;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const li = linkedPassage(p);
    const state = p.finalState;

    const wall = wallBackdrop(ctx, {x: 0, y: 8, w: G0.stage.w, h: G0.stage.h - 8, floorY: G0.floor});
    const screen = searchScreen(ctx, {
      prefix: 'scr', x: G0.screen.x, y: G0.screen.y, w: G0.screen.w, h: G0.screen.h, size: G0.screen.size, mount: shape === 'portrait' ? 'wall' : 'none', title: p.objectLabels.search || t.search, query: p.query,
      results: [{kind: 'source', text: p.citations.source}, {kind: 'commentary', text: p.citations.commentary}],
    });
    const shelfRows = G0.rows === 2
      ? [{kind: 'source', label: p.objectLabels.sourceShelf, feature: 3, tab: true}, {kind: 'commentary', label: p.objectLabels.commentaryShelf, feature: 4, tab: true}]
      : shape === 'portrait'
      ? [{kind: 'source', label: p.objectLabels.sourceShelf, feature: 3, tab: true}, {kind: 'mixed'}, {kind: 'commentary', label: p.objectLabels.commentaryShelf, feature: 4, tab: true}]
      : [{kind: 'source', label: p.objectLabels.sourceShelf, feature: 3, tab: true}, {kind: 'commentary', label: p.objectLabels.commentaryShelf, feature: 4, tab: true}, {kind: 'mixed'}];
    const shelf = bookcase(ctx, {prefix: 'lib', ...G0.shelf, rows: shelfRows, plateSize: 24});
    // when the shelf stands above the board (stacked layouts), keep at least 24 units between its
    // lowest plate / foot and the board's column plaques (which rise 12 above the frame); the board
    // gives up height at its foot rather than crowding the shelf
    let G = G0;
    const shelfAbove = G0.shelf.y + G0.shelf.h <= G0.board.y && G0.shelf.x < G0.board.x + G0.board.w && G0.shelf.x + G0.shelf.w > G0.board.x;
    if (shelfAbove) {
      const plateBottom = Math.max(G0.shelf.y + G0.shelf.h + 8, ...shelf.rows.filter(rw => rw.plate).map(rw => rw.plate.y + rw.plate.h));
      const dy = Math.max(0, plateBottom + 24 + 12 - G0.board.y);
      if (dy > 0) G = {...G0, board: {...G0.board, y: G0.board.y + dy, h: G0.board.h - dy}, page: {...G0.page, y: G0.page.y + dy, h: G0.page.h - dy}};
    }

    const pg = G.page;
    const page = sourcePage(ctx, {prefix: 'src', w: pg.w, h: pg.h, title: p.sources.sourceTitle, ref: p.citations.source, date: p.dates.source, passages: p.sources.passages, showText: showAll, textSize: pg.text, titleSize: pg.title});
    const pas = page.passages[li];
    const pinW = {x: pg.x + pas.pin.x, y: pg.y + pas.pin.y};
    const board = corkBoard(ctx, {
      prefix: 'board', ...G.board, gutterX: G.gutter, plateSize: 24,
      plates: [
        {x: pg.x + pg.w / 2, text: p.objectLabels.sourceColumn || t.sourceText, kind: 'source', maxWidth: pg.w},
        // the margin plaque starts right after the gutter and may use most of the column (one line
        // keeps room for the card below), leaving the column's right end free for callout leaders
        {x: G.gutter + 18, anchor: 'start', text: p.objectLabels.marginColumn || t.commentary, kind: 'commentary', maxWidth: G.board.x + G.board.w - G.gutter - 64},
      ],
    });
    let nt = G.note;
    // the hand grips the card's right edge (8 in from it); the mitten hand reaches at most 23·k
    // around that point in any wrist angle, so the body text stops short of it (grip gutter) and
    // is never covered while the card is carried
    const gripInset = 8;
    const gripReach = 23 * G.person.k;
    const cardPad = Math.max(12, nt.w * 0.06);
    const noteOpts = {
      prefix: 'note', w: nt.w, h: nt.h, header: p.sources.commentator, text: p.sources.commentaryText,
      footer: `${p.citations.commentary} · ${p.dates.commentary}`, pinpoint: pinLabel(li), showText: showAll, textSize: nt.text,
      gripGutter: Math.max(0, Math.round(gripInset + gripReach + 4 - cardPad)),
    };
    const linked = state === 'linked';
    const placed = state !== 'held';
    const colX0 = G.gutter + 12, colX1 = G.board.x + G.board.w - 22;
    // room the hold tags need inside the cork: the attribution tag under the card and the
    // "linked, not merged" tag above it (below the column plaques)
    const tagNOpts = {anchor: 'middle', size: 22, color: C.com, ink: C.comInk, fill: C.comSoft, name: 'tag-note', opacity: 0, maxWidth: colX1 - colX0, maxLines: 2};
    // one line when it leaves the right end of the card's top edge free (where editorial leaders land),
    // otherwise two lines
    const ltW1 = stateChip(ctx, t.linked, {anchor: 'start', size: 22, color: C.link, x: 0, y: 0, maxWidth: colX1 - colX0 - 4, maxLines: 1}).box.w;
    const ltMax = colX0 + 2 + ltW1 <= nt.x + nt.w - 24 ? colX1 - colX0 - 4 : Math.max(160, nt.x + nt.w * 0.62 - colX0);
    const ltOpts = {anchor: 'start', size: 22, color: C.link, fill: th.card, maxWidth: ltMax, maxLines: 2};
    // two lines break after the comma ("Linked, / not merged"), never inside a phrase
    const ltText = /,\s/.test(t.linked) ? t.linked.split(/,\s+/).map((q, i, all) => (i < all.length - 1 ? `${q},` : q)) : t.linked;
    const tagRoom = showKey && placed ? stateChip(ctx, [t.attributed, p.sources.commentator], {...tagNOpts, x: 0, y: 0}).box.h + 22 + 6 : 0;
    const plaqueBottom = Math.max(G.board.y + 24, ...board.plateBoxes.map(q => q.y + q.h));
    const topRoom = showKey && linked ? stateChip(ctx, ltText, {...ltOpts, x: 0, y: 0}).box.h + 16 + 12 : 0;
    const yMin = Math.max(G.board.y + 40, plaqueBottom + topRoom);
    const yMaxOf = hh => G.board.y + G.board.h - 20 - tagRoom - hh;
    // the pinpoint tab slides along the card's left edge so the card itself stays within the
    // researcher's comfortable reach (top near shoulder height) while the tab points at the passage
    let probe = noteCard(ctx, noteOpts);
    // a long interpretation grows the card (bounded by the room left in the margin column) instead
    // of shrinking its words out of reach
    for (let k = 0; k < 8 && showAll && probe.bodyFit && probe.bodyFit.size < nt.text * 0.9 && yMaxOf(nt.h + 18) >= yMin; k++) {
      nt = {...nt, h: nt.h + 18};
      noteOpts.h = nt.h;
      probe = noteCard(ctx, noteOpts);
    }
    const shoulderY = G.floor - 302 * G.person.k;
    const tabMin = probe.bandH + probe.tab.h / 2 + 4, tabMax = nt.h - probe.tab.h / 2 - 8;
    const tabWant = clamp(pinW.y - (shoulderY - 40), tabMin, tabMax);
    // final card position: tab level with the linked passage, margin column, tags kept on the cork
    const noteY = Math.min(Math.max(pinW.y - tabWant, yMin), yMaxOf(nt.h));
    const note = noteCard(ctx, {...noteOpts, tabY: clamp(pinW.y - noteY, tabMin, tabMax)});
    const noteFinal = {x: nt.x, y: noteY};
    // grip on the card's right edge (the hand covers it from the front), chosen once per layout near
    // shoulder height so a low card is held higher up its edge
    const grip = {x: nt.w - gripInset, y: clamp(shoulderY + 70 - noteFinal.y, 26, nt.h * 0.62)};
    const portFinal = {x: noteFinal.x + note.port.x, y: noteFinal.y + note.port.y};
    // contact position: the tab's eyelet sits on the source pin
    const noteContact = {x: pinW.x - note.port.x, y: pinW.y - note.port.y};

    // researcher
    const look = actorLook(ctx, p.researcher, 0);
    const rig = personRig(ctx, {name: 'rsr', look});
    const P = {x: G.person.x, y: G.floor, facing: -1, scale: G.person.k};
    const restHand = rig.frame({...P}).hands.near;
    const restGrip = {x: G.person.x + G.rest.dx, y: G.rest.y};
    const liftGrip = {x: lerp(restGrip.x, noteFinal.x + grip.x, 0.4), y: noteFinal.y + grip.y - 40};
    const handAt = n => ({x: n.x + grip.x, y: n.y + grip.y});

    // labels
    const obstacles = [shelf.box, screen.box, {x: pg.x, y: pg.y, w: pg.w, h: pg.h}, {x: noteFinal.x + note.tab.x, y: noteFinal.y, w: nt.w - note.tab.x, h: nt.h}, ...board.plateBoxes];
    const tags = [];
    const k = G.person.k;
    const figure = {x: G.person.x - 70 * k, y: G.floor - 440 * k, w: 150 * k, h: 440 * k};
    obstacles.push(figure);
    const headBox = {x: G.person.x - 60 * k, y: G.floor - 440 * k, w: 110 * k, h: 120 * k};
    let actorChip = null;
    if (showKey) {
      const cap = p.actorLabels.researcher ? [p.researcher.name, p.actorLabels.researcher] : [p.researcher.name];
      const maxW = shape === 'portrait' ? 560 : shape === 'square' ? 520 : 540;
      const mk = (y, anchor, x) => nameChip(ctx, cap, {x, y, anchor, maxWidth: maxW, size: G.chip - 4, name: 'actor-chip'});
      actorChip = mk(G.floor + 2, 'middle', Math.min(G.stage.w - 8 - maxW / 2, G.person.x));
      // keep inside the stage: rise onto the floor band when two lines are needed
      if (actorChip.box.y + actorChip.box.h > G.stage.h - 2) actorChip = mk(G.stage.h - 2 - actorChip.box.h, 'middle', Math.min(G.stage.w - 8 - maxW / 2, G.person.x));
      if (actorChip.box.x + actorChip.box.w > G.stage.w - 6) actorChip = mk(actorChip.box.y, 'end', G.stage.w - 6);
      obstacles.push(actorChip.box);
    }
    if (showKey) {
      // "source text unchanged" under the board, centred on the page column
      const tagS = stateChip(ctx, t.unchanged, {x: pg.x + pg.w / 2, y: G.board.y + G.board.h + 8, anchor: 'middle', size: 22, color: C.src, fill: th.card, name: 'tag-src', opacity: 0, maxWidth: pg.w + 40, maxLines: 1});
      tags.push(tagS.node);
      obstacles.push(tagS.box);
      if (placed) {
        const tagN = stateChip(ctx, [t.attributed, p.sources.commentator], {...tagNOpts, x: (colX0 + colX1) / 2, y: noteFinal.y + nt.h + 22});
        tags.push(tagN.node);
        obstacles.push({...tagN.box, tagNote: true});
      }
    }
    // "linked, not merged" tag above the card in the margin column, leader to the thread
    let linkTag = null;
    const threadMid = threadPoint(pinW, portFinal, SAG, 0.5);
    if (showKey && linked) {
      const mkLt = y => stateChip(ctx, ltText, {...ltOpts, x: colX0 + 2, y});
      const lt = mkLt(0);
      // above the card in the margin column, as high as the board's column plaques allow; otherwise
      // under the card's attribution tag (the leader still ends on the thread)
      const clearOf = bx => bx.y >= G.board.y + 26 && !board.plateBoxes.some(q => boxesOverlap(bx, q, 10));
      let lt2 = null;
      let below = false;
      for (const gap of [40, 28, 16, 10]) {
        const c = mkLt(noteFinal.y - lt.box.h - gap);
        if (clearOf(c.box)) { lt2 = c; break; }
      }
      if (!lt2) {
        const under = obstacles.find(q => q.tagNote) || {y: noteFinal.y + nt.h, h: 0};
        lt2 = mkLt(under.y + under.h + 12);
        below = true;
      }
      const b = lt2.box;
      const from = {x: clamp(threadMid.x, b.x + 16, b.x + b.w - 16), y: below ? b.y : b.y + b.h};
      linkTag = {box: b, node: g({name: 'tag-link', opacity: 0},
        h('path', {d: `M${r(from.x)} ${r(from.y)}L${r(threadMid.x)} ${r(threadMid.y - 7)}`, stroke: C.link, 'stroke-width': 2.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round'}),
        h('circle', {cx: r(threadMid.x), cy: r(threadMid.y - 5), r: 5, fill: C.link}),
        lt2.node)};
      obstacles.push(b);
    }

    // editorial callouts in the free wall zones of each layout; leaders end on real edges
    // candidate target points per annotation target (tried in order until a clean leader is found)
    const targets = {
      source: [{x: pg.x + pg.w * 0.22, y: pg.y + 2}, {x: pg.x + pg.w + 2, y: pg.y + 70}, {x: pg.x + pg.w * 0.85, y: pg.y + 2}],
      note: placed
        ? [...[0.72, 0.86, 0.6, 0.48, 0.36, 0.93].map(f => ({x: noteFinal.x + nt.w * f, y: noteFinal.y - 2})), {x: noteFinal.x + nt.w + 2, y: noteFinal.y + nt.h * 0.3}]
        : [{x: restGrip.x - grip.x + nt.w * 0.5, y: restGrip.y - grip.y - 2}],
      thread: [{x: threadMid.x, y: threadMid.y + 6}],
      library: [{x: G.shelf.x + G.shelf.w * 0.5, y: G.shelf.y - 8}, {x: G.shelf.x + G.shelf.w + 2, y: G.shelf.y + 40}],
      search: [{x: G.screen.x + G.screen.w, y: G.screen.y + G.screen.h * 0.5}, {x: G.screen.x - 2, y: G.screen.y + G.screen.h * 0.5}, {x: G.screen.x + G.screen.w * 0.5, y: G.screen.y + G.screen.h + 2}],
    };
    const notes = [];
    const droppedNotes = [];
    if (showAll) {
      // every candidate: inside a free wall zone, clear of objects and labels, its leader never across
      // a label, the page text or the card, and no earlier leader through it. Wide boxes first, then
      // narrower ones (so a second callout can sit beside the first one's leader), then smaller type.
      const solid = [{x: pg.x + 3, y: pg.y + 3, w: pg.w - 6, h: pg.h - 6}, {x: noteFinal.x + 3, y: noteFinal.y + 3, w: nt.w - 6, h: nt.h - 6}, shelf.box, screen.box];
      const tryPlace = (i, a, size) => {
        const tgts = targets[a.target];
        // stacked layouts also use the wall band between the library row and the board (the board sits
        // lower when the shelf plates need clearance)
        const topBand = Math.max(G.shelf.y + G.shelf.h + 34, G.screen.y + G.screen.h + 14);
        const zones = G.rows === 2 && G.board.y - 30 - topBand >= 60 ? [...G.zones, {x: 20, y: topBand, w: G.stage.w - 40, h: G.board.y - 30 - topBand}] : G.zones;
        for (const z of zones) {
          const mwMax = Math.min(z.w - 16, shape === 'landscape' ? 440 : 420);
          for (const frac of [1, 0.78, 0.6]) {
            const mw = mwMax * frac;
            for (const tgt of tgts) {
              const probe = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, target: tgt, maxWidth: mw, size, maxLines: 5});
              const bw = probe.box.w;
              for (let dy = 0; dy <= z.h; dy += 12) {
                for (const shift of [0, 0.5, -0.5, 1, -1]) {
                  const cx = clamp(tgt.x + shift * bw * 0.5, z.x + bw / 2 + 6, z.x + z.w - bw / 2 - 6);
                  const co = callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: cx, y: z.y + dy}, target: tgt, maxWidth: mw, size, maxLines: 5});
                  const b = co.box;
                  const inZone = b.y + b.h <= z.y + z.h && b.x >= z.x - 1 && b.x + b.w <= z.x + z.w + 1;
                  if (!inZone) continue;
                  const lead = {x: clamp(tgt.x, b.x, b.x + b.w), y: tgt.y > b.y + b.h ? b.y + b.h : b.y};
                  const labelBoxes = [...board.plateBoxes, ...(linkTag ? [linkTag.box] : []), ...notes.map(nn => nn.box), headBox];
                  if (obstacles.some(q => boxesOverlap(b, q, 8))) continue;
                  if (notes.some(nn => nn.lead && segmentHitsBox(nn.lead[0], nn.lead[1], b, 6))) continue;
                  if (labelBoxes.some(q => segmentHitsBox(lead, tgt, q, 6))) continue;
                  if (solid.some(q => segmentHitsBox(lead, tgt, q, 0))) continue;
                  return {...co, lead: [lead, tgt]};
                }
              }
            }
          }
        }
        return null;
      };
      for (const [i, a] of p.annotations.entries()) {
        const best = tryPlace(i, a, 24) || tryPlace(i, a, 21);
        // an annotation that has no clean place is not drawn over the scene (never a collision);
        // the layout reports it so the author can shorten it
        if (!best) { droppedNotes.push(i); continue; }
        obstacles.push(best.box);
        notes.push(best);
      }
    }

    return {
      G, s, ox, oy, wall, screen, shelf, board, page, note, pinW, noteFinal, portFinal, noteContact, grip, rig, P, restHand, restGrip, liftGrip,
      handAt, tags, linkTag, notes, droppedNotes, actorChip, li, linked, placed, look,
      gripClear: grip.x - gripReach >= note.bodyRight + 2,
      srcFeature: shelf.features[0], comFeature: shelf.features.find(f => f && f.kind === 'commentary'),
    };
  },
  build(ctx, L) {
    const C = fpcColors(ctx);
    const pg = L.G.page;
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.wall,
      L.shelf.node,
      L.screen.node,
      L.board.node,
      g({transform: T(pg.x, pg.y)}, L.page.node),
      // source pin (appears when the card's eyelet is hooked on it)
      g({name: 'srcpinT', transform: T(L.pinW.x, L.pinW.y)}, pushPin(ctx, {name: 'srcpin', opacity: 0, radius: 11})),
      h('path', {name: 'thread', d: threadD(L.pinW, L.pinW, 0), fill: 'none', stroke: C.link, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0}),
      g({name: 'noteT'}, L.note.node),
      L.rig.node,
      L.tags,
      L.linkTag && L.linkTag.node,
      L.actorChip && L.actorChip.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const S = w => seg(a, ...W[w]);
    const E = w => ease.inOutCubic(S(w));
    const nodes = {};
    const linked = L.linked, placed = L.placed;

    // search screen and library glows
    const rows = S('rows');
    Object.assign(nodes, L.screen.frame({
      typed: S('type'), rows: [rows, clamp(rows * 1.4 - 0.2)],
      hl: [S('glowSrc') * (1 - 0.6 * S('glowOff')), S('glowCom') * (1 - 0.6 * S('glowOff'))],
      link: linked ? S('link') : 0,
    }));
    for (const [f, key] of [[L.srcFeature, 'glowSrc'], [L.comFeature, 'glowCom']]) {
      if (!f) continue;
      const gl = S(key) * (1 - S('glowOff'));
      nodes[`lib-glow${f.row}`] = {opacity: r(gl, 3)};
      nodes[`lib-bm${f.row}`] = {transform: `translate(0 ${r(-12 * gl)})`};
    }
    // passage found; bracket around it only when the card is tied to it
    nodes[`src-hl-${L.li}`] = {opacity: r(S('passage'), 3)};
    const br = linked ? S('bracket') : 0;
    const pas = L.page.passages[L.li];
    nodes[`src-br-${L.li}`] = {'stroke-dashoffset': r(pas.brLen * (1 - br))};

    // ---- hand path (world stage units) and the card that follows it
    const lift = E('lift');
    const carry = E('carry');
    const pull = E('pull');
    const toPin = E('toPin');
    const press = S('press');
    const rel = E('release');
    const heldEnd = W.toPin[0];
    // grip targets
    const gRest = L.restGrip;
    const gLift = L.liftGrip;
    const gContact = L.handAt(L.noteContact);
    const gFinal = L.handAt(L.noteFinal);
    let hand;
    let noteAt;
    let angle = 0;
    let holder = 'researcher';
    if (!placed) {
      // held: lift and present the card beside the board, keep holding it
      const hx = lerp(gRest.x, gLift.x, lift);
      const hy = lerp(gRest.y, gLift.y, lift) - 26 * Math.sin(Math.PI * lift);
      hand = {x: hx, y: hy};
      angle = lerp(-7, 0, lift);
    } else if (a < W.carry[0]) {
      hand = {x: lerp(gRest.x, gLift.x, lift), y: lerp(gRest.y, gLift.y, lift) - 26 * Math.sin(Math.PI * lift)};
      angle = lerp(-7, 0, lift);
    } else if (a < W.pull[0]) {
      const dest = linked ? gContact : gFinal;
      const c = linked ? carry : ease.inOutCubic(seg(a, W.carry[0], W.pull[1]));
      hand = {x: lerp(gLift.x, dest.x, c), y: lerp(gLift.y, dest.y, c) - 30 * Math.sin(Math.PI * c)};
    } else if (a < heldEnd) {
      const c = linked ? pull : ease.inOutCubic(seg(a, W.carry[0], W.pull[1]));
      const from = linked ? gContact : gLift;
      hand = {x: lerp(from.x, gFinal.x, c), y: lerp(from.y, gFinal.y, c) - (linked ? 8 * Math.sin(Math.PI * c) : 30 * Math.sin(Math.PI * c))};
    } else {
      hand = null;
    }
    const noteFromHand = hp => ({x: hp.x - L.grip.x, y: hp.y - L.grip.y});
    const pinSpot = {x: L.noteFinal.x + L.note.pinAt.x, y: L.noteFinal.y + L.note.pinAt.y};
    let target;
    if (hand) {
      noteAt = noteFromHand(hand);
      target = hand;
    } else {
      holder = 'board';
      noteAt = L.noteFinal;
      // grip → pin spot (press) → rest
      const pressDip = Math.sin(Math.PI * press) * 5;
      const onPin = {x: pinSpot.x + 8, y: pinSpot.y + 4 + pressDip};
      if (rel <= 0) target = {x: lerp(gFinal.x, onPin.x, toPin), y: lerp(gFinal.y, onPin.y, toPin) - 18 * Math.sin(Math.PI * toPin)};
      else target = {x: lerp(onPin.x, L.restHand.x, rel), y: lerp(onPin.y, L.restHand.y, rel)};
    }
    const lean = placed ? (linked ? lerp(0, 9, E('lean')) * (1 - E('unlean')) : 0) : 0;
    const posed = L.rig.frame({...L.P, lean, near: target, headTilt: lerp(4, -4, lift) + (placed ? 3 * E('carry') - 3 * rel : 0)});
    Object.assign(nodes, posed.nodes);
    const hp = posed.hands.near;
    if (hand) noteAt = noteFromHand(hp);
    nodes.noteT = {transform: `${T(noteAt.x, noteAt.y)}${angle ? ` rotate(${r(angle)} ${r(L.grip.x)} ${r(L.grip.y)})` : ''}`};

    // hook, thread, pins
    const hooked = linked && a >= W.hook[0];
    const hookP = linked ? S('hook') : 0;
    nodes.srcpin = {opacity: hookP > 0 ? 1 : 0};
    nodes.srcpinT = {transform: `${T(L.pinW.x, L.pinW.y)} scale(${r(0.4 + 0.6 * ease.outBack(hookP), 3)})`};
    nodes['note-knot'] = {opacity: hooked ? 1 : 0};
    const port = {x: noteAt.x + L.note.port.x, y: noteAt.y + L.note.port.y};
    const span = Math.hypot(port.x - L.pinW.x, port.y - L.pinW.y);
    nodes.thread = {d: threadD(L.pinW, port, Math.min(SAG, span * 0.14)), opacity: hooked ? 1 : 0};
    const pinned = placed && a >= W.press[0];
    nodes['note-pin'] = {opacity: pinned ? 1 : 0};
    nodes['note-pinT'] = {transform: `${T(L.note.pinAt.x, L.note.pinAt.y)} scale(${r(lerp(1.5, 1, ease.outCubic(press)), 3)})`};

    // hold labels
    const done = p.actionProgress >= 1;
    const tagP = done ? r(seg(u, ...W.tags), 3) : 0;
    if (ctx.show('key')) {
      nodes['tag-src'] = {opacity: tagP};
      if (placed) nodes['tag-note'] = {opacity: tagP};
    }
    if (L.linkTag) nodes['tag-link'] = {opacity: tagP};
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));

    // semantic facts (stage units)
    const toD = q => ({x: r(L.ox + q.x * L.s), y: r(L.oy + q.y * L.s)});
    const gripW = {x: noteAt.x + L.grip.x, y: noteAt.y + L.grip.y};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    // the card never covers the source page: its left edge (tab excluded) stays right of the page
    const noteLeft = noteAt.x;
    const pageRight = L.G.page.x + L.G.page.w;
    return {
      nodes,
      semantic: {
        beat,
        finalState: p.finalState,
        holder,
        hand: toD(hp),
        noteGrip: toD(gripW),
        noteCenter: toD({x: noteAt.x + L.note.w / 2, y: noteAt.y + L.note.h / 2}),
        port: toD(port),
        sourcePin: toD(L.pinW),
        pinSpot: toD({x: pinSpot.x + 8, y: pinSpot.y + 4 + Math.sin(Math.PI * press) * 5}),
        threadTied: hooked,
        threadLength: r(hooked ? span : 0),
        notePinned: pinned,
        passageHighlighted: r(S('passage'), 3),
        bracket: r(br, 3),
        cardClearOfPage: noteLeft - pageRight >= -1,
        // the hand holds the card in its text-free grip gutter (never over the commentary text)
        gripClearOfText: L.gripClear,
        // editorial callouts that found no collision-free place (never drawn over the scene)
        annotationsDropped: L.droppedNotes,
        gutterGap: r(noteLeft - pageRight),
        linkedPassage: L.li + 1,
        searchLinked: r(linked ? S('link') : 0, 3),
        allReached: posed.reached,
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
    slug: 'research-06-story',
    title: 'Primary source and commentary — pinning a side note beside the text',
    titleEs: 'Fuente primaria y comentario — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Fuente primaria y comentario',
    treatment: 'story',
    family: 'staged-scene',
    description: 'Library reading wall: the catalogue search returns the source text and a commentary as two separate rows; the researcher carries the commentator’s index card to the source page, hooks its thread on a pin at the found passage, pulls the card back across the gutter into the margin column and pins it there. Linked by a thread, never merged. Final state supplied: linked, placed or held.',
    tags: ['research', 'primary source', 'commentary', 'side note', 'index card', 'library', 'search', 'thread', 'pin', 'gutter', 'character'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/fuente-primaria-y-comentario.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: FPC_STRINGS,
  scene,
});
