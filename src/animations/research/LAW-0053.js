/**
 * LAW-0053 — Tratamiento de un caso · story
 *
 * Storyboard (open stage, front view; library = anchor, search box =
 * interlocutor, index card = support):
 *  0.00–0.15  rest: the bookcase holds ordinary books and several lever-arch
 *             binders; the resolution binders each carry a small luggage tag
 *             (the treatment label SUPPLIED by the author). The decision is
 *             pinned on the ruled treatment card; the search bar is empty with
 *             its magnifier resting in the socket.
 *  0.15–0.42  the query is typed; the magnifier lifts out of the bar, crosses
 *             to the library and rests over each matching binder in turn — the
 *             binder lights up, is pulled forward and flies to the card,
 *             turning from spine to cover on the way.
 *  0.42–0.73  each cover is pinned to its slot on a circle around the
 *             decision; its tag rides the tip of a thread drawn from the
 *             resolution towards the decision and hangs on it; the thread then
 *             lands on the decision's edge. The magnifier returns to the bar.
 *  0.73–1.00  hold: the supplied final state ("linked", "placed" or "found").
 *             Every label has the same size, colour and distance — no ranking,
 *             no validity, no outcome is shown.
 * @module animations/research/LAW-0053
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp, r} from '../../core/time.js';
import {storyFields, str, obj} from '../../schemas/fields.js';
import {callout, chip} from '../../primitives/annotate.js';
import {caseStage, caseFields, CASE_DEFAULTS, CASE_STAGE, magValue, boxesOverlap} from './kits/tratamiento-de-un-caso.js';

const ID = 'LAW-0053';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Action windows (the per-resolution windows are derived from the visit times). */
const W = {type: [0.15, 0.225], magOut: 0.225, visit0: 0.285, dwell: 0.022, back: 0.085, pull: [0.008, 0.038], fly: 0.11, pin: 0.02, thread: 0.085, note: [0.8, 0.88]};
const ACTION_END = 0.75;

const STRINGS = {
  en: {linkedState: 'Linked by the supplied labels', placedState: 'On the card, not linked', foundState: 'Found in the library'},
  es: {linkedState: 'Vinculadas con las etiquetas suministradas', placedState: 'En la ficha, sin vincular', foundState: 'Localizadas en la biblioteca'},
};

const sceneSchema = {
  ...caseFields,
  ...storyFields({
    library: str('Plaque on the library bookcase', 48),
    card: str('Heading of the treatment index card', 56),
  }, ['tag', 'unlabelled', 'decision', 'library', 'search'], ['linked', 'placed', 'found']),
  // The acting objects are the search box (interlocutor) and the library
  // (anchor); the search box introduces itself with a placeholder at rest.
  actorLabels: obj('Captions of the acting objects', {search: str('Placeholder shown in the empty search box before the query is typed', 56)}),
};

const defaultParams = {
  ...CASE_DEFAULTS,
  actorLabels: {search: 'Search the case library'},
  actionProgress: 1,
  annotations: [{target: 'tag', text: 'Each label is supplied by the author — no ranking'}],
  finalState: 'linked',
};

const AXIS = {landscape: 'horizontal', square: 'square', portrait: 'vertical'};

/** Visit times of the magnifier (one per resolution), evenly spaced. */
function visitTimes(n) {
  const gap = n >= 4 ? 0.062 : 0.072;
  return Array.from({length: n}, (_, i) => W.visit0 + i * gap);
}

const scene = {
  sizes: {landscape: [1760, 900], square: [1200, 1100], portrait: [900, 1400]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const axis = AXIS[ctx.view.shape];
    const st = CASE_STAGE[axis];
    const s = Math.min(ctx.design.w / st.w, ctx.design.h / st.h);
    const ox = (ctx.design.w - st.w * s) / 2;
    const oy = (ctx.design.h - st.h * s) / 2;
    const stage = caseStage(ctx, {prefix: 'st', axis, query: p.query, placeholder: p.actorLabels.search, decision: p.decision, sources: p.sources, objectLabels: p.objectLabels});
    const n = p.sources.length;
    const visits = visitTimes(n);
    const C = stage.card;

    // Editorial callouts in the card's bottom band; leaders reach up to the target.
    const linked = p.finalState === 'linked';
    // the band notes point at the LOWEST hanging tag (nearest to the band), so
    // their leaders never cross another resolution's tag or thread
    const tagged = [...p.sources.keys()].filter(i => stage.tags[i]);
    const lastTagged = tagged.length ? tagged.reduce((a, b) => (stage.slots[b].y > stage.slots[a].y ? b : a)) : undefined;
    const targetOf = a => {
      if (a.target === 'tag') {
        if (linked && lastTagged !== undefined) return stage.points.tag(lastTagged);
        const low = [...p.sources.keys()].reduce((a2, b) => (stage.slots[b].y > stage.slots[a2].y ? b : a2));
        const cb = stage.coverBox(low);
        return {x: cb.x + cb.w / 2, y: cb.y + cb.h};
      }
      if (a.target === 'unlabelled') {
        // the dashed "no label supplied" outline of the first unlabelled resolution
        const i = p.sources.findIndex(src => !src.label);
        const b = stage.points.link(i >= 0 ? i : n - 1);
        return {x: b.x + b.w - 20, y: b.y + b.h - 6};
      }
      if (a.target === 'decision') return stage.points.decision;
      if (a.target === 'library') return stage.points.library;
      return stage.points.search;
    };
    const two = p.annotations.length > 1;
    const notes = ctx.show('all') ? p.annotations.map((a, i) => {
      if (a.target === 'unlabelled') {
        // beside the dashed empty label, in the free stretch before the decision
        const k = Math.max(0, p.sources.findIndex(src => !src.label));
        const b = stage.points.link(k);
        const x = b.x + b.w + 18;
        const maxWidth = stage.decBox.x - x - 20;
        if (maxWidth >= 150) {
          const target = {x: x - 14, y: b.y + b.h / 2};
          const at = (y, lines) => Object.assign(callout(ctx, {name: `note${i}`, text: a.text, target, chipAt: {x, y}, anchor: 'start', maxWidth, size: axis === 'square' ? 28 : 24, maxLines: lines}), {target});
          let lines = 3;
          if (ctx.fit(a.text, {maxWidth: maxWidth - 29, size: 24, minSize: 18, maxLines: 3, weight: 600}).truncated) lines = 5;
          const probe = at(0, lines);
          const y = Math.max(stage.cardHeaderBottom + 8, b.y + b.h / 2 - probe.box.h / 2);
          return at(y, lines);
        }
      }
      const target = targetOf(a);
      return Object.assign(callout(ctx, {
        name: `note${i}`, text: a.text, target,
        chipAt: {x: i === 0 ? C.x + 26 : C.x + C.w - 26, y: stage.bandTop + 6},
        anchor: i === 0 ? 'start' : 'end',
        maxWidth: two ? C.w / 2 - 40 : C.w - 52, size: axis === 'square' ? 29 : 25, maxLines: 3,
      }), {target});
    }) : [];
    // leader lines of the notes (from the chip edge nearest the target, as drawn by callout)
    const leaderDots = notes.flatMap(nt => {
      const b = nt.box, t = nt.target;
      const from = {x: Math.max(b.x, Math.min(t.x, b.x + b.w)), y: t.y > b.y + b.h ? b.y + b.h : t.y < b.y ? b.y : b.y + b.h / 2};
      if (from.y === b.y + b.h / 2) from.x = t.x > b.cx ? b.x + b.w : b.x;
      return Array.from({length: 21}, (_, k) => ({x: lerp(from.x, t.x, k / 20) - 4, y: lerp(from.y, t.y, k / 20) - 4, w: 8, h: 8}));
    });

    // Final-state chip (descriptive state only): above the decision when the
    // strip under the card heading can hold it clear of the sheet and its pin,
    // otherwise under the decision. Candidates are checked against the
    // decision, every cover, every hanging tag and the editorial notes.
    const stateText = p.finalState === 'linked' ? ctx.t.linkedState : p.finalState === 'placed' ? ctx.t.placedState : ctx.t.foundState;
    const stateColor = p.finalState === 'linked' ? th.accent4 : th.inkSoft;
    const dB = stage.decBox;
    const stOpts = {size: axis === 'square' ? 30 : 26, minSize: 20, maxLines: 3, name: 'state-tag', color: stateColor, stroke: stateColor, weight: 700};
    // drawn threads count too (sampled along their length)
    const threadDots = linked ? p.sources.flatMap((_, i) => (stage.tags[i] ? Array.from({length: 41}, (_, k) => { const q = stage.threads[i].at(k / 40); return {x: q.x - 3, y: q.y - 3, w: 6, h: 6}; }) : [])) : [];
    const obstacles = [dB, ...p.sources.map((_, i) => stage.coverBox(i)), ...stage.tagSpots.filter(Boolean).map(sp => sp.box), ...notes.map(x => x.box).filter(Boolean)];
    const lines = [...threadDots, ...leaderDots];
    const inCard = b => b.x >= C.x + 10 && b.x + b.w <= C.x + C.w - 10 && b.y >= stage.cardHeaderBottom + 6 && b.y + b.h <= C.y + C.h - 30;
    obstacles.push({x: C.x + C.w / 2 - 16, y: C.y + C.h - 40, w: 32, h: 28}); // the card's hanger
    const clearOf = b => inCard(b) && !obstacles.some(q => boxesOverlap(b, q, 10)) && !lines.some(q => boxesOverlap(b, q, 3));
    let tag = null;
    if (ctx.show('key')) {
      const mk = (x, y, anchor, maxWidth) => chip(ctx, `● ${stateText}`, {...stOpts, x, y, anchor, maxWidth});
      const tagRight = Math.max(C.x, ...stage.tagSpots.filter(Boolean).map(sp => sp.box.x + sp.box.w), ...p.sources.map((_, i) => stage.coverBox(i).x + stage.cover.w));
      const right = C.x + C.w - 18;
      const dcx = dB.x + dB.w / 2;
      const below = dB.y + dB.h + 16;
      const above = (x, anchor, maxWidth) => { const pr = mk(x, 0, anchor, maxWidth); return mk(x, dB.y - 12 - pr.box.h, anchor, maxWidth); };
      // right edge of whatever hangs beside the strip above the decision
      const upRight = Math.max(C.x, ...[...p.sources.map((_, i) => stage.coverBox(i)), ...stage.tagSpots.filter(Boolean).map(sp => sp.box)].filter(b => b.y < dB.y).map(b => b.x + b.w));
      const cands = [
        () => above(dcx, 'middle', stage.status.maxWidth),
        () => above(right, 'end', right - upRight - 20),
        () => above(right, 'end', Math.min(right - C.x - 20, dB.w + 130)),
        () => above(right, 'end', right - C.x - 20),
        () => mk(dcx, below, 'middle', 2 * Math.min(dcx - C.x - 20, right - dcx)),
        () => mk(right, below, 'end', right - C.x - 20),
        () => mk(right, below, 'end', right - Math.max(tagRight + 18, dB.x - 60)),
      ];
      // the first clear candidate at full text size; otherwise the clear one with the largest text
      const clear = cands.map(c => c()).filter(t => clearOf(t.box));
      tag = clear.find(t => t.fit.size >= stOpts.size - 0.5) || clear.sort((a, b) => b.fit.size - a.fit.size)[0] || null;
      if (!tag) tag = cands[cands.length - 1]();
    }
    const stateClear = !tag || clearOf(tag.box);
    return {stage, s, ox, oy, tag, notes, visits, n, stateClear};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      L.stage.node,
      L.tag && L.tag.node,
      L.notes.map(x => x.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const moves = p.finalState !== 'found';
    const links = p.finalState === 'linked';
    const n = L.n;
    const v = {type: seg(a, ...W.type), mag: magValue(a, {out: W.magOut, visits: L.visits, dwell: W.dwell, back: W.back}), found: [], pull: [], fly: [], pin: [], thread: [], ghost: []};
    for (let i = 0; i < n; i++) {
      const t0 = L.visits[i];
      const flyA = t0 + W.pull[1];
      const pinA = flyA + W.fly;
      const thA = pinA + W.pin;
      v.found.push(seg(a, t0 - 0.004, t0 + 0.012));
      v.pull.push(moves ? seg(a, t0 + W.pull[0], t0 + W.pull[1]) : 0);
      v.fly.push(moves ? seg(a, flyA, pinA) : 0);
      v.pin.push(moves ? seg(a, pinA, thA) : 0);
      v.thread.push(moves && links && L.stage.tags[i] ? seg(a, thA, thA + W.thread) : 0);
      // a resolution without a supplied label shows a dashed empty label once pinned
      v.ghost.push(moves && links && !L.stage.tags[i] ? seg(a, thA, thA + 0.03) : 0);
    }
    const posed = L.stage.pose(v);
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(x => Object.assign(nodes, x.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? r(clamp((u - W.note[0]) / 0.05), 3) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    // magnifier target during a dwell (for the attach check)
    const vis = sem.magVisiting;
    const magTarget = vis !== null && vis !== undefined ? {x: Math.round(L.stage.binders[vis].x * 100) / 100, y: Math.round(L.stage.binders[vis].y * 100) / 100} : sem.mag;
    return {nodes, semantic: {...sem, magTarget, beat, finalState: p.finalState, actionCapped: p.actionProgress < 1 && u > capU, stateChipClear: L.stateClear}};
  },
};

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'research-04-story',
    title: 'Case treatment — library, search and treatment card',
    titleEs: 'Tratamiento de un caso — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Tratamiento de un caso',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A query is typed; the search box’s magnifier scans the library and each matching resolution binder flies to the treatment card, turns into its cover and is pinned; its supplied label rides a thread to the decision and hangs on it. All labels share one style and distance — no hierarchy or outcome.',
    tags: ['case treatment', 'citator', 'library', 'search', 'index card', 'labels', 'resolutions', 'decision'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/tratamiento-de-un-caso.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
