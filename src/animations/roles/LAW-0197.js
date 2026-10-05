/**
 * LAW-0197 — Reunión de equipo jurídico · story
 *
 * Storyboard (front view: a fictional legal team stands behind a meeting
 * table; a cork case-file board hangs on the wall behind them):
 *  0.00–0.15  rest: three team members, each holding their own round portrait
 *             magnet (their "name tag") in front of the chest. Above each
 *             head a task card is pinned on the board; every card's round
 *             assignee slot is dashed and reads "No assignee". The case-file
 *             folder lies on the table; the board carries its supplied title.
 *  0.15–0.42  the first supplied link: that person raises the magnet up the
 *             outer side of their head (never across a face), lifts it above
 *             the hair and presses it into their card's slot — the slot ring
 *             turns solid in their colour and their name appears on the card.
 *             The others turn their eyes/heads to watch. Person A then asks
 *             the supplied question in a speech bubble beside their head.
 *  0.42–0.73  the remaining supplied links follow one after another (each
 *             hand lands on its own slot; the hand goes back to the table).
 *  0.73–1.00  hold: the supplied final state (every supplied link placed, or
 *             the last one still pending in the person's hand). A card whose
 *             slot stays dashed is a task without an assignee — nothing is
 *             said about deadlines, duties or consequences.
 * The acting order is the order of the supplied relationships.
 * @module animations/roles/LAW-0197
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {fitDesign} from '../../core/layout.js';
import {clamp, r, seg} from '../../core/time.js';
import {str, num, list, obj, oneOf, party, annotation} from '../../schemas/fields.js';
import {
  TEAM_IDS, TASK_IDS, TEAM_DEFAULTS, TASKS_EN, KIT_STRINGS,
  linkItem, rolesField, captionOf, looksOf, resolveLanes, layoutStage, buildStage, stageNodes, poseStage,
  speechBubble, fitClean, noteCallout, keyChip, overlaps, overHeads, magnetHeadGap, flap, slotCentre,
} from './kits/reunion-de-equipo.js';

const ID = 'LAW-0197';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const ACT0 = 0.15, ACT1 = 0.73;
const TARGETS = ['card', 'board'];

const STRINGS = {
  en: {...KIT_STRINGS.en},
  es: {...KIT_STRINGS.es},
};

const sceneSchema = {
  actors: list('The three fictional team members, left to right at the table (a, b, c)', party, 3, 3),
  roles: rolesField,
  relationships: list('Supplied links, in acting order: who puts their name magnet on which task card (a task with no link keeps an empty, dashed slot)', linkItem, 0, 3),
  props: obj('Supplied content on the props', {
    tasks: list('Task labels on the three cards (fictional, neutral)', str('Task label', 90), 3, 3),
    openSlot: str('Text shown in an empty assignee slot', 40),
    speech: str('What person a asks after placing their magnet (speech bubble)', 90),
  }, ['tasks', 'openSlot', 'speech']),
  actorLabels: obj('Optional caption overrides under each person (empty = "Name · Role")', {a: str('Caption for a', 80), b: str('Caption for b', 80), c: str('Caption for c', 80)}),
  objectLabels: obj('Labels printed on props', {board: str('Title plate on the case-file board', 90), document: str('Label on the case-file folder on the table', 60)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('The state supplied by the author for the final hold (no legal conclusion is inferred)', ['all-linked', 'last-link-pending']),
};

const defaultParams = {
  ...TEAM_DEFAULTS,
  props: {tasks: TASKS_EN, openSlot: 'No assignee', speech: 'Who takes the next one?'},
  actorLabels: {a: '', b: '', c: ''},
  objectLabels: {board: 'Case file 24-017 · task board (fictional)', document: 'Case file (fictional)'},
  actionProgress: 1,
  annotations: [{target: 'card', text: 'Each name magnet now sits on a task card'}],
  finalState: 'all-linked',
};

/** px at 1080p for one design unit. */
function unitPx(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * (1080 / Math.min(ctx.view.width, ctx.view.height));
}

/** Act windows (u) for the supplied order; the last may be omitted (pending). */
function actWindows(order, finalState) {
  const acts = finalState === 'last-link-pending' ? order.slice(0, -1) : order.slice();
  const m = Math.max(1, order.length);
  const D = Math.min(0.2, (ACT1 - ACT0) / m);
  return acts.map((id, j) => ({id, a: ACT0 + j * D, b: ACT0 + (j + 1) * D}));
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 950], portrait: [900, 1350]},
  layout(ctx) {
    const p = ctx.params;

    const shape = ctx.view.shape;
    const W = ctx.design.w, H = ctx.design.h;
    const upx = unitPx(ctx);
    const looks = looksOf(ctx, p.actors);
    const {laneTask, order, linked} = resolveLanes(TEAM_IDS, TASK_IDS, p.relationships);
    const lanes = TEAM_IDS.map((id, i) => {
      const tIdx = TASK_IDS.indexOf(laneTask[id]);
      return {label: p.props.tasks[tIdx], owner: linked[id] ? i : null, task: laneTask[id]};
    });
    const people = TEAM_IDS.map((id, i) => ({id, look: looks[i], name: p.actors[i].name, caption: captionOf(p, id, p.actorLabels[id])}));
    const windows = actWindows(order, p.finalState);
    const notesOn = ctx.show('all') && p.annotations.length > 0;
    const keyOn = ctx.show('key');
    // text sizes in px at 1080p: the baseline size first; long supplied text may step down to 16 px
    const F0 = shape === 'portrait' ? 26 : 22;
    const pxTries = [{F: F0, min: 19.6}, {F: 21, min: 16}];

    // Editorial notes and the neutral key sit in the board's header row (next
    // to the title plate), so their leaders reach the cards right below them.
    // header order: notes about the board first (their leaders rise to the frame), then the key,
    // then notes about the cards (last, so their leaders drop straight onto the cards)
    const noteItems = notesOn ? p.annotations.map((a, i) => ({name: `note${i}`, text: a.text, kind: 'note', target: a.target})) : [];
    const extrasOf = side => (side ? [] : [
      ...noteItems.filter(q => q.target === 'board'),
      ...(keyOn ? [{name: 'key', text: ctx.t.key, kind: 'key'}] : []),
      ...noteItems.filter(q => q.target !== 'board'),
    ]);
    // wide frames: notes and key in side columns beside the board; otherwise in the header row
    const sideTries = shape === 'landscape' ? [0.19, 0.16, 0.13, 0] : [0];
    let best = null;
    for (const px of pxTries) {
      for (const side of sideTries) {
        const sideW = W * side;
        const L = layoutStage(ctx, {
          prefix: 'st', box: {x: sideW, y: 0, w: W - 2 * sideW, h: H}, unitPx: upx, people, lanes, openText: p.props.openSlot,
          title: p.objectLabels.board, doc: p.objectLabels.document, px, extras: extrasOf(side > 0),
          kMax: 1.9, sMax: shape === 'landscape' ? 520 : 1e9, cardMax: 470,
          // the case-file label is pinned on the board (never under a hand); tall frames show full standing
          // figures under an open table, spaced so resting arms and chest magnets never touch
          docOnBoard: shape === 'portrait', chestRestY: 72, folderFront: true, legs: shape === 'portrait', spacingK: shape === 'portrait' ? 226 : undefined, hold: {x: 50, y: 56}, restX: 28, release: [{x: 104, y: -104}, {x: 66, y: 30}], lift: {c1: {x: 92, y: -20}},
        });
        const S = buildStage(ctx, L);
        const extra = editorial(ctx, p, L, S, side > 0 ? {x: 8, w: sideW - 8} : null);
        const cand = {L, S, extra, ok: L.fits && extra.ok};
        if (!best || (cand.ok && !best.ok) || (cand.ok === best.ok && cand.L.k > best.L.k + 1e-6)) best = cand;
      }
      if (best.ok) break;
    }
    const {L, S, extra} = best;
    return {L, S, ...extra, lanes, order, windows, linked, looks, labelsFit: best.ok, upx};
  },
  build(ctx, L) {
    return g(null, stageNodes(L.S, {front: [L.bubble && L.bubble.node, L.key && L.key.node, L.notes.map(n => n.node)]}));
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const G = L.L.G;
    const cap = ACT0 + (ACT1 - ACT0) * p.actionProgress;
    const uu = p.actionProgress >= 1 ? u : Math.min(u, cap);
    // per person: act progress q (null outside the act), done flag
    const st = TEAM_IDS.map(() => ({q: null, done: false, look: 0, tilt: 0, mouth: 0}));
    let active = null;
    for (const w of L.windows) {
      const i = TEAM_IDS.indexOf(w.id);
      if (uu >= w.b) st[i].done = true;
      else if (uu > w.a) { st[i].q = (uu - w.a) / (w.b - w.a); active = i; }
    }
    // speech of person a after their own link (or from the start when a has no link)
    const aw = L.windows.find(w => w.id === 'a');
    const say0 = aw ? aw.a + (aw.b - aw.a) * 0.9 : ACT0 - 0.1;
    const bubbleOpen = L.bubble ? seg(uu, say0, say0 + 0.035) : 0;
    const speaking = bubbleOpen > 0 && uu < say0 + 0.1;
    if (speaking) st[0].mouth = flap(timeMs, ctx.reduced);
    // watchers: eyes (and a slight head turn) follow the moving magnet or the speaker
    const pre = poseStage(L.L, L.S, st);
    const focusX = active !== null ? pre.sem.mags[active].x : speaking ? G.xs[0] : null;
    st.forEach((s, i) => {
      if (focusX === null || i === active || (speaking && i === 0)) return;
      const look = clamp((focusX - G.xs[i]) / (G.S * 0.9), -1, 1);
      s.look = r(look, 3);
      s.tilt = r(look * 7, 2);
    });
    const posed = poseStage(L.L, L.S, st);
    const nodes = posed.nodes;
    if (L.bubble) Object.assign(nodes, L.bubble.frame(bubbleOpen));
    const holdIn = seg(u, 0.74, 0.8);
    const done = p.actionProgress >= 1;
    if (L.key) nodes['key'] = {opacity: r(done ? holdIn : 0, 3)};
    L.notes.forEach(n => Object.assign(nodes, n.frame(done ? seg(u, 0.75, 0.83) : 0)));
    const sem = posed.sem;
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const lookA = {slots: L.lanes.map((ln, i) => (ln.owner !== null ? sem.landed[ln.owner] : 0))};
    const cardBoxes = G.xs.map((_, i) => G.card(i));
    const slotPt = i => { const c = slotCentre(G, i, L.L.cardM); return {x: r(c.x), y: r(c.y)}; };
    const bubbleBox = bubbleOpen > 0.5 && L.bubble ? L.bubble.box : null;
    return {
      nodes,
      semantic: {
        beat,
        order: L.order.join('>'),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && u > cap,
        at: sem.at,
        landed: sem.landed,
        slotsFilled: lookA.slots.map(v => (v >= 1 ? 1 : 0)),
        lanes: L.lanes.map(ln => ln.task),
        magA: sem.mags[0], magB: sem.mags[1], magC: sem.mags[2],
        handA: sem.hands[0], handB: sem.hands[1], handC: sem.hands[2],
        gripA: sem.grips[0], gripB: sem.grips[1], gripC: sem.grips[2],
        slotA: slotPt(0), slotB: slotPt(1), slotC: slotPt(2),
        freeA: sem.freeHands[0], freeB: sem.freeHands[1], freeC: sem.freeHands[2],
        active: active === null ? null : TEAM_IDS[active],
        looks: st.map(s => s.look),
        bubble: r(bubbleOpen, 3),
        speakingA: speaking,
        allReached: sem.allReached,
        overHeads: overHeads(G, sem.mags, [...cardBoxes, bubbleBox]),
        magGap: r(magnetHeadGap(G, sem.mags), 1),
        armGap: sem.armGap,
        magArmGap: sem.magArmGap,
        headPx: r(88 * G.k * L.upx, 1),
        k: r(G.k, 3),
        labelsFit: L.labelsFit,
        notesShown: L.notes.length ? r(done ? seg(u, 0.75, 0.83) : 0, 3) : null,
      },
    };
  },
};

/**
 * Editorial layer: the speech bubble (in the gap between a's and b's heads,
 * below the cards), the key chip and the hold callouts. Notes and the key
 * were packed into the board's header row by the stage layout; a note's
 * leader drops straight to the top edge of the card below it ('card') or
 * rises to the board's frame ('board'), crossing no text and no face.
 */
function editorial(ctx, p, L, S, sideCol) {
  const G = L.G;
  const F = L.F, minF = L.minF;
  const k = G.k;
  let ok = true;
  const why = [];
  let bubble = null;
  if (p.props.speech && G.n > 1) {
    const x0 = G.xs[0] + 54 * k + 10, x1 = G.xs[1] - 54 * k - 10;
    const top = G.cardBottom + 12, bottom = G.yS - 6 * k;
    const bw = x1 - x0;
    const fit = ctx.show('all') ? fitClean(p.props.speech, {maxWidth: bw - F * 1.2, size: F, minSize: minF, maxLines: 6, weight: 600}) : null;
    const bh = fit ? Math.min(bottom - top, fit.height + F * 1.3) : Math.min(bottom - top, F * 3);
    if (fit && (fit.bad || fit.height + F * 1.0 > bottom - top)) { ok = false; why.push('bubble'); }
    const box = {x: x0, y: top, w: bw, h: bh};
    const tip = {x: G.xs[0] + 46 * k, y: G.yS - 70 * k};
    bubble = speechBubble(ctx, {name: 'bubble', box, tip, fit, stroke: '#1f2328', show: ctx.show('all')});
  }
  let key = null;
  const notes = [];
  if (sideCol) {
    // side columns: a note sits beside an outer card of the board; the key at the lower right
    const colL = {x: sideCol.x, w: sideCol.w}, colR = {x: ctx.design.w - sideCol.x - sideCol.w, w: sideCol.w};
    const maxW = sideCol.w - 16;
    const used = [];
    p.annotations.forEach((a, i) => {
      if (!ctx.show('all')) return;
      const right = i % 2 === 1;
      const col = right ? colR : colL;
      const ci = right ? G.n - 1 : 0;
      const c = G.card(ci);
      const probe = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: 0, y: 0}, target: {x: 0, y: -50}, maxWidth: maxW, size: F, minSize: minF, maxLines: 5});
      if (probe.fit.truncated) { ok = false; why.push(`note${i}-fit`); }
      const bw = probe.box.w, bh = probe.box.h;
      const edgeX = a.target === 'board' ? (right ? L.board.x + L.board.w : L.board.x) : (right ? c.x + c.w : c.x);
      const ty = a.target === 'board' ? L.board.y + 60 : c.y + c.h * 0.42;
      const y = clamp(ty - bh / 2, 8, ctx.design.h - bh - 8);
      const x = right ? col.x + 8 : col.x + col.w - bw - 8;
      if (x < 4 || x + bw > ctx.design.w - 4) { ok = false; why.push(`note${i}-col`); }
      const target = {x: edgeX + (right ? 2 : -2), y: clamp(ty, y + 10, y + bh - 10)};
      const n = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x, y}, anchor: 'start', target, maxWidth: maxW, size: probe.fit.size, minSize: probe.fit.size, maxLines: 5});
      used.push(n.box);
      notes.push({...n, target});
    });
    if (ctx.show('key')) {
      const probe = keyChip(ctx, ctx.t.key, {x: 0, y: 0, maxWidth: maxW, size: F * 0.9, minSize: minF, maxLines: 3});
      const x = colR.x + colR.w - probe.box.w - 8;
      const y = L.table.yPanel - probe.box.h;
      const kc = keyChip(ctx, ctx.t.key, {x, y, maxWidth: maxW, size: probe.fit.size, minSize: probe.fit.size, maxLines: 3, name: 'key-chip'});
      if (probe.fit.truncated || used.some(b => overlaps(b, kc.box, 8))) { ok = false; why.push('key'); }
      key = {node: g({name: 'key', opacity: 0}, kc.node), box: kc.box};
    }
    return {bubble, key, notes, ok, why};
  }
  const kb = L.header.key;
  if (kb) {
    const kc = keyChip(ctx, kb.text, {x: kb.box.x, y: kb.box.y, maxWidth: kb.maxW, size: kb.size, minSize: kb.size, maxLines: 2, name: 'key-chip'});
    key = {node: g({name: 'key', opacity: 0}, kc.node), box: kc.box};
  }
  // header boxes other than a note's own chip (leaders must not cross them)
  const others = name => Object.entries(L.header).filter(([nm]) => nm !== name).map(([, it]) => it.box);
  const vClear = (x, y0, y1, boxes) => !boxes.some(b => x > b.x - 6 && x < b.x + b.w + 6 && Math.max(y0, y1) > b.y && Math.min(y0, y1) < b.y + b.h);
  p.annotations.forEach((a, i) => {
    const hb = L.header[`note${i}`];
    if (!hb) return;
    const b = hb.box;
    const obst = others(`note${i}`);
    const xs = [];
    for (let t = 0.5; t <= 0.9; t += 0.05) xs.push(b.x + b.w * t, b.x + b.w * (1 - t));
    let target = null;
    if (a.target === 'board') {
      const x = xs.find(xx => vClear(xx, b.y, L.board.y + 9, obst));
      if (x !== undefined) target = {x, y: L.board.y + 9};
      else {
        // blocked above: run sideways to the nearer side of the board frame
        const cy = b.y + b.h / 2;
        const hClear = (x0, x1) => !obst.some(q => cy > q.y - 6 && cy < q.y + q.h + 6 && Math.max(x0, x1) > q.x && Math.min(x0, x1) < q.x + q.w);
        const left = L.board.x + 9, right = L.board.x + L.board.w - 9;
        if (b.x - left <= right - (b.x + b.w) && hClear(left, b.x)) target = {x: left, y: cy};
        else if (hClear(b.x + b.w, right)) target = {x: right, y: cy};
        else if (hClear(left, b.x)) target = {x: left, y: cy};
      }
    } else {
      for (const xx of xs) {
        const ci = G.xs.findIndex((_, j) => { const c = G.card(j); return xx > c.x + 18 && xx < c.x + c.w - 18 && Math.abs(xx - (c.x + c.w / 2)) > 22; });
        if (ci < 0) continue;
        const c = G.card(ci);
        if (vClear(xx, b.y + b.h, c.y + 2, obst)) { target = {x: xx, y: c.y + 2}; break; }
      }
    }
    if (!target) { ok = false; why.push(`note${i}-leader`); target = {x: b.x + b.w / 2, y: a.target === 'board' ? L.board.y + 9 : G.cardTop + 2}; }
    const n = noteCallout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: b.x, y: b.y}, anchor: 'start', target, maxWidth: hb.maxW, size: hb.size, minSize: hb.size, maxLines: 3});
    notes.push({...n, target});
  });
  return {bubble, key, notes, ok, why};
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-10-story',
    title: 'Legal team meeting — each person puts their name magnet on a task card',
    titleEs: 'Reunión de equipo jurídico — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Reunión de equipo jurídico',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A fictional team stands behind a meeting table under a cork case-file board. One after another, each person raises their own round name magnet up the side of their head and presses it into the assignee slot of the task card above them; the slot ring turns solid and their name appears. A card whose slot stays dashed is a task without an assignee. Links and final state are supplied; nothing is concluded.',
    tags: ['team meeting', 'task board', 'assignment', 'name magnet', 'case file', 'speech bubble', 'three people', 'hands'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/reunion-de-equipo.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/badges.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});

