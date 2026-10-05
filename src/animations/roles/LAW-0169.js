/**
 * LAW-0169 — Declaración de testigo · story
 *
 * Storyboard (side view of a statement table, slightly from above):
 *  0.00–0.15  rest: the witness sits at the left end of the table (in the
 *             foreground on tall frames) holding the written statement; the
 *             clerk sits behind the table facing the viewer, pen in hand, a
 *             pad of BLANK cards in front; an empty card rail runs along the
 *             table's far edge towards the witness.
 *  0.15–0.42  the witness recounts: the clerk's pen comes to rest on the top
 *             blank card; a speech bubble opens and the statement (and the
 *             "from" line she gives) fills in on that card under the resting
 *             nib as she says it. Then the pen writes the card's LABEL — the
 *             neutral source glyph, "direct observation (as stated)" /
 *             "information received (as stated)" — and underlines it in the
 *             source colour. The pen hand moves aside; the other hand grips
 *             the card's right edge and carries it in one smooth move (sliding
 *             off the pad, standing up) into the rail slot left of the clerk's
 *             face; a lifted card is in front of both arms, so no arm crosses
 *             its text. The pen hand pushes the row one card-width towards the
 *             witness — before the next statement is said.
 *  0.42–0.73  the same for the next statements: the pen rests on the next
 *             card before its statement starts to fill (no text ever appears
 *             on a card without the nib on it); the row lines up beside the
 *             witness in the order stated. Hands, pen and cards stay attached
 *             (solved hand positions; nothing teleports); the nib moves at
 *             most 60 px and a card at most 75 px per 60 fps frame.
 *  0.73–1.00  hold: the supplied final state (all cards lined up, or the last
 *             card written and held standing on the desk, not yet in the
 *             row), the key "as supplied · no conclusion drawn", a state tag
 *             and optional callouts. Nothing about credibility, truthfulness,
 *             reliability, admissibility or weight is shown or implied.
 * Main action ends by u ≈ 0.80; notes fade in 0.80–0.86 and hold.
 * @module animations/roles/LAW-0169
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {g} from '../../core/svg.js';
import {T} from '../../core/transform.js';
import {seg, clamp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {str, num, list, obj, oneOf, annotation, party} from '../../schemas/fields.js';
import {
  witnessFields, WITNESS_DEFAULTS, WITNESS_STRINGS, captionOf, tagOf, fromOf, fitCards, fitQuote,
  stageGeometry, witnessStage, recountScript, recountClock, armOverText, CARD_W_Z, fitWords, wchip, keyLayout,
} from './kits/declaracion-de-testigo.js';
import {fitNote} from './kits/mediation-labels.js';

const ID = 'LAW-0169';
const DURATION = 6000;
/** Beat windows from the brief (normalized). */
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Recount over [U0, U1]: the first statement is said from U0, the pen is back at rest by U1 (kit recountClock). */
const U0 = 0.14, U1 = 0.81;
const NOTES = [0.8, 0.86];
const TARGETS = ['cards', 'document'];

const STRINGS = {
  en: {...WITNESS_STRINGS.en, linedUp: 'Stated facts lined up in order', lastHeld: 'Last card written, not yet in the row'},
  es: {...WITNESS_STRINGS.es, linedUp: 'Hechos declarados, en orden', lastHeld: 'Última tarjeta escrita, aún fuera de la fila'},
};

const sceneSchema = {
  ...witnessFields,
  // the story draws two people: the witness and the clerk (any source person is named on a card via "from")
  actors: list('The witness and the clerk who writes the cards (fictional people)', party, 2, 2),
  roles: obj('Descriptive role captions (never a finding about credibility or reliability)', {
    witness: str('Role caption for the person giving the statement', 40),
    clerk: str('Role caption for the person writing the cards', 40),
  }),
  actorLabels: obj('Chip captions next to each person (empty = role caption)', {
    witness: str('Caption for the witness', 50), clerk: str('Caption for the clerk', 50),
  }),
  objectLabels: obj('Labels printed on props', {document: str('Title printed on the statement sheet the witness holds', 40)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', annotation(TARGETS), 0, 2),
  finalState: oneOf('State supplied for the final hold: all-lined-up (every card in the row) or last-held (the last card is written and stands on the desk, not yet set in the row). No legal assessment is inferred', ['all-lined-up', 'last-held']),
};

const defaultParams = {
  ...WITNESS_DEFAULTS,
  actors: WITNESS_DEFAULTS.actors.slice(0, 2),
  roles: {witness: WITNESS_DEFAULTS.roles.witness, clerk: WITNESS_DEFAULTS.roles.clerk},
  actorLabels: {witness: '', clerk: ''},
  objectLabels: {document: 'Witness statement'},
  actionProgress: 1,
  annotations: [{target: 'cards', text: 'Each card keeps the source as the witness stated it'}],
  finalState: 'all-lined-up',
};

/** px at 1080p per design unit for this view (so text sizes are set in real pixels). */
function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}

const scene = {
  sizes: {landscape: [1600, 900], square: [1100, 960], portrait: [1000, 1455]},
  layout(ctx) {
    const p = ctx.params;
    const th = ctx.theme;
    const D = ctx.design;
    const mode = ctx.view.shape === 'portrait' ? 'stack' : 'row';
    const px = pxPerUnit(ctx);
    const F0 = 22.5 / px, Fmin = 16.3 / px;
    const facts = p.props.facts;
    const n = facts.length;
    const items = facts.map(f => ({text: f.text, tag: tagOf(p, f.source), fromText: fromOf(ctx, f)}));
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const capW = captionOf(p, 'witness', p.actorLabels.witness);
    const capC = captionOf(p, 'clerk', p.actorLabels.clerk);

    // Largest clerk scale z whose stage (cards sized to their text, bubble
    // sized to the longest statement) fits the design space.
    const zs = [];
    for (let z = mode === 'row' ? 1.6 : 1.2; z >= 0.7 - 1e-9; z -= 0.03) zs.push(Math.round(z * 100) / 100);
    let best = null;
    for (const z of zs) {
      const cardW = CARD_W_Z * z;
      const cf = fitCards(ctx, {w: cardW, items, size: F0, minSize: Fmin});
      const F = cf.size;
      const kEst = mode === 'row' ? 1.4 * z : 1.9 * z;
      // statement sheet held by the witness: title fitted inside
      let docW = 88 * kEst;
      let docFit = null;
      if (showAll) {
        for (let tries = 0; tries < 8; tries++) {
          docFit = fitWords(p.objectLabels.document, {maxWidth: docW * 0.8, size: F, minSize: F, maxLines: 4, weight: 800});
          const wide = Math.max(0, ...String(p.objectLabels.document).split(/\s+/).map(w => ctx.measure(w, F, 800, 'sans')));
          if (!docFit.truncated && wide <= docW * 0.8) break;
          docW *= 1.1;
        }
      }
      const doc = {w: docW, h: Math.max(docW * 1.3, docFit ? docFit.height + docW * 0.62 : 0)};
      const chipH = showKey ? F * 1.18 * 2 + F * 0.76 + 4 : 8;
      const keyProbe = showKey ? keyLayout(ctx, p, {w: D.w * 0.5, size: F}) : null;
      const geo = bubbleH => stageGeometry({mode, W: D.w, H: D.h, z, n, cardW, cardH: cf.H, doc, bubbleH, chipH, keyH: keyProbe ? keyProbe.h : 0, heldRight: p.finalState === 'last-held'});
      let G = geo(F0 * 3.4);
      let quotes = [];
      let qSize = F;
      let bubbleH = F0 * 2.8;
      if (showAll && G.bubble.w > 60) {
        const bw = G.bubble.w - 2 * 24;
        for (let s = Math.min(24 / px, F + 2 / px); s >= Fmin - 1e-6; s -= 0.5) {
          quotes = facts.map(f => fitQuote(ctx, f.text, {maxWidth: bw, size: s, minSize: s, maxLines: 7}));
          qSize = s;
          if (!quotes.some(q => q.truncated)) break;
        }
        bubbleH = Math.max(Math.max(...quotes.map(q => q.height)) + 2 * 22, F * 2.8);
        // the hold callouts (and, on tall frames, the state tag) reuse the bubble's place
        const inCol = p.annotations.filter(a => !(mode === 'stack' && a.target === 'cards'));
        const chipH0 = t => wchip(ctx, t, {x: 0, y: 0, anchor: 'middle', maxWidth: G.bubble.w, size: F, minSize: F, maxLines: 6}).box.h;
        let need = inCol.reduce((acc, a) => acc + chipH0(a.text) + 16, 0);
        if (mode === 'stack' && showKey) need += chipH0(`● ${p.finalState === 'last-held' ? ctx.t.lastHeld : ctx.t.linedUp}`) + 12;
        bubbleH = Math.max(bubbleH, need);
      }
      G = geo(bubbleH);
      const fits = G.overflowX <= 0 && G.overflowY <= 0 && cf.ok && !quotes.some(q => q.truncated);
      // when nothing fits keep the candidate with the least overflow
      const miss = Math.max(G.overflowX, G.overflowY, 0) + (cf.ok ? 0 : 1e4) + (quotes.some(q => q.truncated) ? 1e4 : 0);
      if (!best || fits || miss < best.miss) best = {z, cf, F, G, doc, docFit, quotes, qSize, fits, miss};
      if (fits) break;
    }
    let {cf, F, G, docFit, quotes} = best;
    // centre the stage vertically in the spare height (row frames)
    if (mode === 'row' && best.fits && G.overflowY < -2) {
      G = stageGeometry({mode, W: D.w, H: D.h, z: G.z, n, cardW: G.cardW, cardH: G.cardH, doc: best.doc, bubbleH: G.bubble.h, chipH: G.chipH, top: 16 - G.overflowY / 2, heldRight: p.finalState === 'last-held'});
    }
    const z = G.z;
    const stage = witnessStage(ctx, {
      prefix: 'st', G, actors: p.actors, docTitle: p.objectLabels.document, docFit,
      cards: facts.map((f, i) => ({content: cf.contents[i], source: f.source})), quotes,
    });
    const script = recountScript(stage, {plan: p.finalState === 'last-held' ? 'last-held' : 'all'});
    const extras = [];

    // ---- clerk's name plate (table front, under the clerk)
    const panel = {x: G.tableL + 45 * z, y: G.panelTop + 16 * z, x1: G.tableR - 45 * z, y1: G.panelBottom - 12 * z};
    let plate = null;
    if (showKey) {
      const plateW = Math.min(440 * z, (panel.x1 - panel.x) * 0.42);
      const pr = wchip(ctx, capC, {x: 0, y: 0, anchor: 'middle', maxWidth: plateW, size: F, minSize: F, maxLines: 3});
      const px0 = Math.min(G.cx, panel.x1 - pr.box.w / 2);
      plate = wchip(ctx, capC, {x: px0, y: panel.y1 - pr.box.h, anchor: 'middle', maxWidth: plateW, size: F, minSize: F, maxLines: 3, fill: '#f7f1e3', name: 'chipC'});
      extras.push(plate.node);
    }
    // ---- key: on the panel (row) or beside the witness's sheet (stack)
    let keyOK = true;
    let keyRight = panel.x;
    let chipWBox = null;
    if (showKey) {
      const region = mode === 'row'
        ? {x: panel.x, y: panel.y, w: (plate ? plate.box.x : panel.x1) - 20 - panel.x, h: panel.y1 - panel.y}
        : G.key;
      const key = keyLayout(ctx, p, {w: region.w, size: F});
      keyOK = key.h <= region.h + 1 && key.ok;
      keyRight = region.x + key.w;
      extras.push(key.build(region.x, region.y + Math.max(0, (region.h - key.h) / 2) * (mode === 'row' ? 1 : 0)));
    }
    // ---- witness chip under the witness
    if (showKey) {
      const cxw = G.hip.x + 16 * G.kW;
      const maxW = mode === 'row' ? Math.max(300, G.rowL - 24, D.w * 0.45) : D.w * 0.8;
      const probe = wchip(ctx, capW, {x: 0, y: 0, anchor: 'middle', maxWidth: maxW, size: F, minSize: F, maxLines: 2});
      const half = probe.box.w / 2;
      const x = Math.max(16 + half, Math.min(cxw, D.w - 16 - half));
      const cw = wchip(ctx, capW, {x, y: G.floor + 6, anchor: 'middle', maxWidth: maxW, size: F, minSize: F, maxLines: 2, name: 'chipW'});
      chipWBox = cw.box;
      extras.push(cw.node);
    }

    // ---- hold notes: state tag and callouts (in the space the bubbles used; the
    //      cards' callouts sit on the table front on tall frames)
    const free = G.free;
    let tag = null;
    const notes = [];
    let notesFit = true;
    if (showKey) {
      const text = `● ${p.finalState === 'last-held' ? ctx.t.lastHeld : ctx.t.linedUp}`;
      const tagOpts = {anchor: 'end', size: F, minSize: F, name: 'state-tag', color: th.accent4, stroke: th.accent4, weight: 700};
      // on the table front between the key and the clerk's plate (row frames) when it fits
      // there, else at the top of the notes column
      const slotX0 = keyRight + 24, slotX1 = (plate ? plate.box.x : panel.x1) - 16;
      const onPanel = mode === 'row' && slotX1 - slotX0 > 120 ? wchip(ctx, text, {...tagOpts, anchor: 'middle', x: (slotX0 + slotX1) / 2, y: 0, maxWidth: slotX1 - slotX0, maxLines: 2}) : null;
      if (onPanel && !onPanel.fit.truncated && onPanel.box.h <= panel.y1 - panel.y) {
        tag = wchip(ctx, text, {...tagOpts, anchor: 'middle', x: (slotX0 + slotX1) / 2, y: panel.y + (panel.y1 - panel.y - onPanel.box.h) / 2, maxWidth: slotX1 - slotX0, maxLines: 2});
        tag.above = true;
      } else if (mode === 'row' && chipWBox) {
        // on the floor line, right of the witness's name chip
        const x0 = chipWBox.x + chipWBox.w + 30, x1 = G.tableR;
        const t2 = wchip(ctx, text, {...tagOpts, x: x1, y: G.floor + 6, maxWidth: x1 - x0, maxLines: 2});
        if (!t2.fit.truncated && t2.box.y + t2.box.h <= D.h - 2) { tag = t2; tag.above = true; }
      }
      if (!tag) tag = wchip(ctx, text, {...tagOpts, x: free.x + free.w, y: free.y + 2, maxWidth: free.w, maxLines: 3});
      extras.push(tag.node);
    }
    if (showAll && p.annotations.length) {
      const inRow = p.finalState === 'last-held' ? n - 1 : n;
      const mid = Math.max(0, Math.floor((inRow - 1) / 2));
      const midX = G.R.right - (inRow - 1 - mid) * G.cardW - G.cardW / 2;
      const targetPt = {
        // row: the left edge of the leftmost card (the notes column is beside it); stack: under the row
        cards: mode === 'row' ? {x: G.rowL - 2, y: G.rowTop + Math.min(G.cardH * 0.3, 120)} : {x: midX, y: G.railY + 6 * z},
        document: mode === 'row' ? {x: G.docBox.x + G.docBox.w * 0.5, y: G.docBox.y - 2} : {x: G.docBox.x + G.docBox.w + 2, y: G.docBox.y + G.docBox.h * 0.3},
      };
      const onPanel = p.annotations.filter(a => mode === 'stack' && a.target === 'cards');
      const inFree = p.annotations.filter(a => !(mode === 'stack' && a.target === 'cards'));
      const top = tag && !tag.above ? tag.box.y + tag.box.h + 12 : free.y;
      inFree.forEach((a, j) => {
        const nf = inFree.length;
        const slot = (free.y + free.h - top) / nf;
        const y = top + j * slot;
        const note = fitNote(ctx, {name: `note${p.annotations.indexOf(a)}`, text: a.text, target: targetPt[a.target], chipAt: {x: free.x + free.w / 2, y}, maxWidth: free.w, size: F, minSize: F, maxLines: 6, bottom: y + slot - 8});
        if (note.overflow) notesFit = false;
        notes.push(note);
      });
      // on the table front, under the rail (tall frames)
      onPanel.forEach(a => {
        const x1 = plate ? plate.box.x - 20 : panel.x1;
        const w = x1 - panel.x;
        const note = fitNote(ctx, {name: `note${p.annotations.indexOf(a)}`, text: a.text, target: targetPt.cards, chipAt: {x: panel.x + w / 2, y: panel.y + 4}, maxWidth: w, size: F, minSize: F, maxLines: 3, bottom: panel.y1});
        if (note.overflow) notesFit = false;
        notes.push(note);
      });
    }
    return {stage, script, n, G, F, extras, tag, notes, labelsFit: best.fits && notesFit && keyOK, sizes: {card: r(F * px, 1), quote: r(best.qSize * px, 1), z: G.z, hz: r(G.cardH / G.z, 1)}};
  },
  build(ctx, L) {
    return g(null, L.stage.node, L.extras, L.notes.map(n => n.node));
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const n = L.n;
    const cap = n * p.actionProgress;
    const clockAt = uu => Math.min(recountClock(uu, U0, U1, n), cap, n);
    const cRaw = recountClock(u, U0, U1, n);
    const c = clockAt(u);
    const input = L.script(c, timeMs, ctx.reduced);
    const posed = L.stage.pose(input);
    // nib travel over the last 1/60 s (audit: the writing must not strobe)
    const du = 1000 / 60 / (p.durationMs || DURATION);
    const prevPose = u > du ? L.stage.pose(L.script(clockAt(u - du), timeMs - 1000 / 60, ctx.reduced)) : null;
    const prevPen = prevPose ? prevPose.semantic.pen : null;
    // the fastest card's travel over the last 1/60 s (a carried card must move smoothly)
    const cardStep = prevPose ? Math.max(0, ...posed.cardPos.map((cp, i) => Math.hypot(cp.x - prevPose.cardPos[i].x, cp.y - prevPose.cardPos[i].y))) : 0;
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const noteP = done ? seg(u, NOTES[0], NOTES[1]) : 0;
    if (L.tag) nodes['state-tag'] = {opacity: r(noteP, 3)};
    L.notes.forEach(nt => Object.assign(nodes, nt.frame(noteP)));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const s = posed.semantic;
    // order of the cards standing in the rail, left → right
    const inRail = s.cardAt.map((a, i) => ({a, i, x: posed.cardPos[i].x})).filter(q => q.a === 'rail').sort((a, b) => a.x - b.x).map(q => q.i);
    const railOk = inRail.every((idx, j) => j === 0 || Math.abs(posed.cardPos[inRail[j - 1]].x + L.G.cardW - posed.cardPos[idx].x) < 0.6);
    return {
      nodes,
      semantic: {
        ...s,
        beat,
        clock: r(c, 3),
        fact: input.fact,
        speaking: input.witness.speaking,
        railOrder: inRail,
        rowAbuts: railOk,
        // the row ends beside the witness: gap from the statement sheet to the first card
        rowGapToWitness: inRail.length ? r(posed.cardPos[inRail[0]].x - (L.G.docHand.x - L.G.doc.grip.x + L.G.doc.w)) : null,
        sources: p.props.facts.map(f => f.source),
        finalState: p.finalState,
        actionCapped: p.actionProgress < 1 && cRaw > cap,
        notesShown: r(noteP, 3),
        labelsFit: L.labelsFit,
        mode: L.G.mode,
        textPx: L.sizes,
        penStep: prevPen && s.pen ? r(Math.hypot(s.pen.x - prevPen.x, s.pen.y - prevPen.y), 1) : 0,
        cardStep: r(cardStep, 1),
        armOverText: armOverText(L.stage, posed, input.cards),
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
    slug: 'roles-03-story',
    title: 'Witness statement — stated facts written on labelled cards beside the witness',
    titleEs: 'Declaración de testigo — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Declaración de testigo',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A fictional witness recounts; each supplied statement opens in a speech bubble and fills in on a blank card as she says it. Behind the table the clerk writes the card\'s stated source label (direct observation / information received, as stated), stands the card in a rail and pushes the row along so the labelled facts line up beside the witness. No credibility, weight or outcome is shown.',
    tags: ['witness', 'statement', 'speech bubble', 'fact cards', 'direct observation', 'information received', 'as stated', 'clerk', 'writing', 'table'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/declaracion-de-testigo.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/badges.js', 'src/primitives/paper.js', 'src/primitives/annotate.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
