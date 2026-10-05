/**
 * LAW-0041 — Búsqueda por términos · story
 *
 * Storyboard (side view of a reading room):
 *  0.00–0.15  rest: the library bookcase holds one open volume per shelf
 *             (identifier, title, date on the left page, passages on the
 *             right page); the researcher stands at the search kiosk with an
 *             empty search box.
 *  0.15–0.42  the researcher's hand types the query (term chips appear in
 *             the search box as the hand hops over the keys) and presses
 *             enter; in contextual mode the related wording drops down.
 *             The first word tokens leave their chips.
 *  0.42–0.73  each token travels along its own thread to the page edge of a
 *             volume, becomes a sticky tab at the matching passage's line and
 *             the matched word is highlighted (cause before effect). Each
 *             recorded passage pushes one printed line of the index card out
 *             of the kiosk's printer slot.
 *  0.73–1.00  hold: threads, tabs and highlights stay; the card shows the
 *             found passages. Only the supplied final state is shown — no
 *             relevance, validity or outcome is inferred.
 * Which passages match is computed from the supplied query and passage text.
 * @module animations/research/LAW-0041
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, lerp} from '../../core/time.js';
import {storyFields, str} from '../../schemas/fields.js';
import {callout, statusTag} from '../../primitives/annotate.js';
import {researchFields, RESEARCH_DEFAULTS} from './kits/busqueda-por-terminos-fields.js';
import {searchStage, stageSize} from './kits/busqueda-por-terminos.js';

const ID = 'LAW-0041';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
const W = {
  approach: [0.06, 0.15], type: [0.15, 0.28], press: [0.28, 0.35], bloom: [0.31, 0.38],
  depart: [0.33, 0.5], travel: 0.12, tab: 0.03, mark: 0.045, print: 0.03, look: [0.34, 0.42], note: [0.8, 0.88],
};
const ACTION_END = 0.78;

const STRINGS = {
  en: {recorded: 'Passages recorded', highlighted: 'Passages marked', notRun: 'Query typed, not run'},
  es: {recorded: 'Pasajes anotados', highlighted: 'Pasajes marcados', notRun: 'Consulta escrita, sin ejecutar'},
};

const sceneSchema = {
  ...researchFields,
  ...storyFields({
    library: str('Label on the bookcase crown', 40),
    kiosk: str('Caption under the search kiosk', 40),
    card: str('Heading printed on the index card', 30),
  }, ['query', 'passage', 'card', 'library'], ['recorded', 'highlighted', 'not-run']),
};

const defaultParams = {
  ...RESEARCH_DEFAULTS,
  actorLabels: {a: 'Researcher', b: 'Search kiosk'},
  objectLabels: {library: 'Case library', kiosk: 'Search kiosk', card: 'Found passages'},
  actionProgress: 1,
  annotations: [{target: 'passage', text: 'Query word linked to a passage'}],
  finalState: 'recorded',
};

const AXIS = {landscape: 'horizontal', square: 'compact', portrait: 'vertical'};
/** Editorial band above the stage for annotation callouts. */
const BAND = 80;

const scene = {
  sizes: {landscape: [2140, 900 + BAND], square: [1480, 1100 + BAND], portrait: [1000, 1400 + BAND]},
  layout(ctx) {
    const p = ctx.params;
    const axis = AXIS[ctx.view.shape];
    const st = stageSize(axis, true);
    const bw = st.w, bh = st.h + BAND;
    const s = Math.min(ctx.design.w / bw, ctx.design.h / bh);
    const ox = (ctx.design.w - bw * s) / 2;
    const oy = (ctx.design.h - bh * s) / 2;
    const stage = searchStage(ctx, {
      prefix: 'st', axis, withPerson: true,
      query: p.query, mode: p.query.mode || 'exact', sources: p.sources, dates: p.dates, citations: p.citations,
      cardHeading: p.objectLabels.card, libraryLabel: p.objectLabels.library,
      researcherLabel: p.actorLabels.a, kioskLabel: p.actorLabels.b || p.objectLabels.kiosk,
      withCard: p.finalState === 'recorded',
    });
    const n = stage.links.length;
    const step = n > 1 ? (W.depart[1] - W.depart[0]) / (n - 1) : 0;
    const timing = stage.links.map((_, i) => {
      const t0 = W.depart[0] + i * step;
      return {t0, t1: t0 + W.travel, tab: t0 + W.travel + W.tab, mark: t0 + W.travel + W.tab + W.mark};
    });
    // annotation targets (block coordinates: stage shifted down by BAND)
    const G = stage.G;
    const at = q => ({x: q.x, y: q.y + BAND});
    const first = stage.links[0];
    const targets = {
      query: at((() => { const c = stage.chipWorld(0); return {x: c.x + 4, y: c.y}; })()),
      passage: at(first ? {x: first.end.x - 4, y: first.end.y} : {x: stage.vols[0].x + stage.vols[0].w, y: stage.vols[0].y + 40}),
      card: at(stage.cardFinal ? {x: stage.cardFinal.x + stage.cardFinal.w - 6, y: stage.cardFinal.y + 12} : {x: stage.slot.x, y: stage.slot.y}),
      library: at({x: G.bookcase.x + 40, y: G.bookcase.y + 20}),
    };
    // status tag: attached to the printed card (above it on wide stages, in
    // the free band left of it on the vertical stage); where no card is
    // printed it sits at the same place above the kiosk's printer slot
    const stateText = p.finalState === 'recorded' ? ctx.t.recorded : p.finalState === 'highlighted' ? ctx.t.highlighted : ctx.t.notRun;
    const tagSize = axis === 'vertical' ? 27 : axis === 'compact' ? 34 : 31;
    const slotBox = stage.cardFinal || {x: stage.slot.x - 110, y: stage.slot.y - 60, w: 220, h: 60};
    let tag = null;
    if (ctx.show('key')) {
      const probe = statusTag(ctx, stateText, {x: 0, y: 0, size: tagSize});
      if (axis === 'vertical') {
        const bandTop = G.bookcase.y + G.bookcase.h + 10;
        tag = statusTag(ctx, stateText, {x: Math.max(probe.box.w + 12, slotBox.x - 18), y: BAND + bandTop, anchor: 'end', size: tagSize, name: 'state-tag', color: ctx.theme.accent4});
      } else {
        const cx = Math.min(bw - probe.box.w / 2 - 12, Math.max(G.housing.x + probe.box.w / 2, slotBox.x + slotBox.w / 2));
        tag = statusTag(ctx, stateText, {x: cx, y: BAND + slotBox.y - probe.box.h - 14, anchor: 'middle', size: tagSize, name: 'state-tag', color: ctx.theme.accent4});
      }
    }
    // editorial callouts in the band above the stage; on wide stages they end
    // left of the status tag so both stay clear of each other
    const notes = ctx.show('all') ? p.annotations.map((a, i) => {
      const tgt = targets[a.target];
      const maxW = Math.min(bw * (axis === 'vertical' ? 0.9 : 0.5), 860);
      const right = axis === 'vertical' || !tag ? bw - 10 : Math.min(bw - 10, tag.box.x - 24);
      const want = tgt.x + (i ? 1 : -1) * (p.annotations.length > 1 ? maxW * 0.55 : 0) + (axis === 'vertical' ? 0 : 40);
      const probe = callout(ctx, {name: `probe${i}`, text: a.text, chipAt: {x: 0, y: 2}, target: tgt, maxWidth: maxW, size: 30, maxLines: 2});
      const hw = probe.box.w / 2;
      const cx = Math.max(hw + 10, Math.min(right - hw, want));
      return callout(ctx, {name: `note${i}`, text: a.text, chipAt: {x: cx, y: 2}, target: tgt, maxWidth: maxW, size: 30, maxLines: 2});
    }) : [];
    return {stage, s, ox, oy, timing, notes, tag, axis};
  },
  build(ctx, L) {
    return g({transform: T(L.ox, L.oy, 0, L.s)},
      g({transform: T(0, BAND)}, L.stage.node),
      L.tag && L.tag.node,
      L.notes.map(n => n.node),
    );
  },
  frame(ctx, L, u) {
    const p = ctx.params;
    const capU = lerp(BEATS.action[0], ACTION_END, p.actionProgress);
    const a = Math.min(u, capU);
    const runs = p.finalState !== 'not-run';
    const prints = p.finalState === 'recorded';
    const links = L.timing.map(t => ({
      travel: runs ? seg(a, t.t0, t.t1) : 0,
      tab: runs ? seg(a, t.t1, t.tab) : 0,
      mark: runs ? seg(a, t.tab, t.mark) : 0,
    }));
    const print = prints ? L.timing.reduce((acc, t) => acc + seg(a, t.mark, t.mark + W.print), 0) : 0;
    const posed = L.stage.pose({
      approach: seg(a, ...W.approach),
      type: seg(a, ...W.type),
      press: runs ? seg(a, ...W.press) : 0,
      bloom: runs ? seg(a, ...W.bloom) : 0,
      links,
      print,
      look: runs ? seg(a, ...W.look) : 0,
    });
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, ...W.note) : 0;
    L.notes.forEach(n => Object.assign(nodes, n.frame(noteP)));
    if (L.tag) nodes['state-tag'] = {opacity: done ? clamp((u - W.note[0]) / 0.05) : 0};
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const sem = posed.semantic;
    const tok = i => (sem.tokens[i] ? sem.tokens[i] : null);
    return {
      nodes,
      semantic: {
        ...sem,
        beat,
        finalState: p.finalState,
        linkCount: L.stage.links.length,
        tokenA: tok(0), tokenB: tok(1), tokenC: tok(2), tokenD: tok(3),
        endA: sem.links[0] ? sem.links[0].end : null,
        endB: sem.links[1] ? sem.links[1].end : null,
        linkedSources: [...new Set(sem.links.filter(l => l.mark >= 1).map(l => l.source))],
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
    slug: 'research-01-story',
    title: 'Term search — reading-room microscene',
    titleEs: 'Búsqueda por términos — Microescena con objetos y actores',
    category: 'research',
    categoryName: 'Investigación jurídica',
    motif: 'Búsqueda por términos',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A researcher types query terms at a library search kiosk; each word travels along a thread to the matching passage of an open volume on the bookcase, becomes a sticky tab and highlights the word; the kiosk prints an index card listing the found passages. Matches are computed from the supplied text (exact or contextual mode).',
    tags: ['search', 'query', 'library', 'bookcase', 'index card', 'highlight', 'passage', 'kiosk', 'researcher'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/research/kits/busqueda-por-terminos.js', 'src/animations/research/kits/busqueda-por-terminos-fields.js', 'src/primitives/person.js', 'src/primitives/annotate.js', 'src/primitives/people-style.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
