/**
 * LAW-0193 — Consulta de expediente por auxiliar · story
 *
 * Storyboard (front view of a desk, slightly from above; the case file is a
 * roll-top STEP CABINET standing on the desk left of the assistant; every
 * compartment (slot, numbered on a brass plate) holds one numbered piece whose
 * top strip shows its title and its index tab with the piece number):
 *  0.00–0.15  rest: the assistant sits behind the desk, hands on it; the
 *             visitor standing right of the desk asks for a piece — a speech
 *             bubble opens from their mouth, then its words appear. Names,
 *             roles and the file label identify everything.
 *  0.15–0.42  the assistant's left hand (open) runs down the column of tabs,
 *             touching slot 1, 2 … up to the requested number, pinches that
 *             tab (the hand closes), lifts the piece up out of its
 *             compartment (the empty slot shows as a dashed gap) and carries it
 *             down and across to the front of the chest, where the right hand
 *             takes it by its edge (hand-off at a shared point). The right
 *             hand tips it back and lays it on the desk.
 *  0.42–0.73  the right hand opens the cover towards the viewer by its tab; the
 *             assistant bows the head and reads (eyes run along the lines);
 *             closes the cover, stands the piece up, hands it back to the left
 *             hand, which carries it back and slides it down into its own
 *             numbered slot — the dashed gap closes.
 *  0.73–1.00  hold: the supplied final state (piece back in its slot, or left
 *             open on the desk), a state tag, the key "as supplied · no
 *             conclusion drawn" and optional callouts. No validity, rights,
 *             sanction or outcome is shown or implied.
 * Main action ends by u ≈ 0.80; notes fade in 0.80–0.85 and hold (900 ms).
 * Every held piece is placed from the SOLVED hand; nothing teleports.
 * @module animations/roles/LAW-0193
 */
import {defineAnimation} from '../../core/define.js';
import {makeMetadata} from '../../core/meta.js';
import {h, g} from '../../core/svg.js';
import {seg, clamp, r} from '../../core/time.js';
import {fitDesign} from '../../core/layout.js';
import {str, num, list, obj, oneOf, int, party, RELATION_KINDS} from '../../schemas/fields.js';
import {connector} from '../../primitives/annotate.js';
import {kindColor} from '../../frameworks/graph.js';
import {
  pieceField, FILE_DEFAULTS, FILE_STRINGS, glueNums, captionOf, resolvePieces, measurePieces, fileGeometry, fileStage,
  consultScript, keyLayout, fitWords, wchip, overlaps, pieceBox, segHitsBox, foreignSlotHits,
} from './kits/consulta-de-expediente.js';
import {noteCallout} from './kits/mediation-labels.js';

const ID = 'LAW-0193';
const DURATION = 6000;
const BEATS = {rest: [0, 0.15], action: [0.15, 0.42], complete: [0.42, 0.73], hold: [0.73, 1]};
/** Choreography windows (normalized u); see consultScript in the kit. */
const W = {
  toTabs: [0.15, 0.185], run: [0.185, 0.25], pinch: [0.25, 0.265], lift: [0.265, 0.285], carry: [0.285, 0.37],
  toEdge: [0.33, 0.37], swap: [0.37, 0.385], lay: [0.385, 0.43], toCover: [0.43, 0.45], open: [0.45, 0.49],
  read: [0.5, 0.58], toCover2: [0.58, 0.6], close: [0.6, 0.63], toEdge2: [0.63, 0.645], lift2: [0.645, 0.68],
  toTab2: [0.655, 0.68], swap2: [0.68, 0.69], carryBack: [0.69, 0.745], insert: [0.745, 0.765], release: [0.765, 0.8],
};
const BUBBLE = {open: [0.03, 0.07], words: [0.07, 0.1]};
const NOTES = [0.8, 0.85];
const NOTES_OPEN = [0.62, 0.67];
const TARGETS = ['piece', 'cabinet'];
const PEOPLE = ['requester', 'assistant'];

const STRINGS = {
  en: {...FILE_STRINGS.en, returned: 'Piece back in its numbered slot', onDesk: 'Piece left open on the desk'},
  es: {...FILE_STRINGS.es, returned: 'Pieza devuelta a su casilla numerada', onDesk: 'Pieza abierta sobre la mesa'},
};

const relationship = obj('The supplied link between the two people (drawn between their name chips; not a legal finding)', {
  from: oneOf('Source person', PEOPLE),
  to: oneOf('Target person', PEOPLE),
  kind: oneOf('relation | communication | sequence | causal (causal only when supplied)', RELATION_KINDS),
  label: str('Caption of the link', 40),
}, ['from', 'to', 'kind', 'label']);

const sceneSchema = {
  actors: list('The assistant who consults the case file and the person who asked for the piece (fictional people)', party, 2, 2),
  roles: obj('Descriptive role captions (not a legal finding)', {
    assistant: str('Role caption for the person who consults the file', 40),
    requester: str('Role caption for the person who asked for the piece', 40),
  }),
  relationships: list('Supplied link between the requester and the assistant (empty = none drawn)', relationship, 0, 1),
  props: obj('Case-file content, shown exactly as supplied', {
    pieces: list('Numbered pieces in slot order: slot k (from the front) holds the k-th piece', pieceField, 3, 5),
    target: int('Number of the piece that is looked up, taken out, consulted and put back', 1, 9),
    request: str('What the requester asks for (speech bubble)', 80),
  }),
  actorLabels: obj('Chip captions next to each person (empty = name · role)', {
    assistant: str('Caption for the assistant', 50), requester: str('Caption for the requester', 50),
  }),
  objectLabels: obj('Labels printed on props', {cabinet: str('Label on the case-file cabinet (fictional identifier)', 50)}),
  actionProgress: num('How far the concrete action is allowed to progress (1 = complete; lower values freeze it part-way)', 0, 1),
  annotations: list('Editorial callouts shown in the final hold', obj('Editorial annotation shown during the hold', {
    target: oneOf('Scene element the annotation points at', TARGETS), text: str('Annotation text', 90),
  }, ['target', 'text']), 0, 2),
  finalState: oneOf('State supplied for the final hold: returned (the piece is back in its numbered slot) or open-on-desk (the piece is left open on the desk, its slot empty). No legal assessment is inferred', ['returned', 'open-on-desk']),
};

const defaultParams = {
  actors: FILE_DEFAULTS.actors,
  roles: FILE_DEFAULTS.roles,
  relationships: [{from: 'requester', to: 'assistant', kind: 'communication', label: 'asks to consult'}],
  props: {pieces: FILE_DEFAULTS.props.pieces, target: 3, request: FILE_DEFAULTS.props.request},
  actorLabels: {assistant: '', requester: ''},
  objectLabels: {cabinet: FILE_DEFAULTS.props.fileLabel},
  actionProgress: 1,
  annotations: [{target: 'piece', text: 'Found by its tab, returned to its own slot'}],
  finalState: 'returned',
};

/** px at 1080p per design unit. */
function pxPerUnit(ctx) {
  const f = fitDesign(ctx.view, ctx.design.w, ctx.design.h);
  return f.scale * 1080 / Math.min(ctx.view.width, ctx.view.height);
}

/** Smallest card width whose titles fit in L lines (whole words) at F. */
function widthFor(ctx, pieces, F, L) {
  let lo = 4 * F, hi = 40 * F;
  const ok = W0 => measurePieces(ctx, {pieces, F, W: W0, showText: true, maxLines: L}).ok;
  if (!ok(hi)) return null;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (ok(mid)) hi = mid; else lo = mid; }
  return Math.ceil(hi + 2);
}

const shift = (b, dx, dy) => ({...b, x: b.x + dx, y: b.y + dy});
/** Distance from the assistant to the requester that leaves room for the name chips and the link caption between them. */
function linkSpan(ctx, p, F, z, capA, capV, k) {
  const wA = wchip(ctx, capA, {x: 0, y: 0, anchor: 'middle', maxWidth: 420 * z, size: F, minSize: F, maxLines: 2}).box.w;
  const wV = wchip(ctx, capV, {x: 0, y: 0, anchor: 'middle', maxWidth: Math.max(260, 300 * k / 1.08), size: F, minSize: F, maxLines: 2}).box.w;
  const link = (p.relationships || [])[0];
  const wL = link ? wchip(ctx, link.label || link.kind, {x: 0, y: 0, anchor: 'middle', maxWidth: 360, size: F, minSize: F, maxLines: 2}).box.w + 70 : 40;
  return wA / 2 + wL + wV / 2;
}
/**
 * Stage geometry for one candidate: the requester stands far enough right for the name chips and the link
 * caption between them; the desk front is tall enough for the key at the width it gets.
 */
function geometryFor(ctx, o) {
  const {p, F, z, k, M, n, fileFit, capA, capV, compact, cx, shY} = o;
  const base = {z, M, n, cx, shY, fileLabelH: fileFit.height, visitor: compact ? 'back' : 'behind', visitorK: compact ? 0.98 * z : k, desk: 'closeup', minGapZ: 16 * z};
  const mwV = compact ? Math.max(200, 300 * z * 0.98 / 1.08) : Math.max(260, 300 * k / 1.08);
  const cl = compact ? 3 : 2;
  const wV = wchip(ctx, capV, {x: 0, y: 0, anchor: 'middle', maxWidth: mwV, size: F, minSize: F, maxLines: cl}).box;
  const wA = wchip(ctx, capA, {x: 0, y: 0, anchor: 'middle', maxWidth: compact ? 320 * z : 420 * z, size: F, minSize: F, maxLines: cl}).box;
  const link = (p.relationships || [])[0];
  const capH = link ? wchip(ctx, link.label || link.kind, {x: 0, y: 0, anchor: 'middle', maxWidth: 360, size: F, minSize: F, maxLines: 2}).box.h : 0;
  if (o.portrait) {
    // the requester stands in the foreground below the desk; their name chip and the link caption sit between
    // the desk front and their head
    // in depth: the requester stands on the floor in front of the desk's right end (nearer, so larger), the
    // assistant behind the desk; the desk shows its legs down to the same floor
    return fileGeometry({...base, visitor: 'front', visitorK: (o.chipRow ? 2.2 : 1.45) * z, visitorX: cx + (o.chipRow ? 232 : 178) * z, visitorDy: (o.chipRow ? 270 : 46) * z, desk: 'full', panelH: Math.max(56 * z, wA.h + 1.0 * F)});
  }
  if (compact && !o.chipRow) {
    // chips in a column on the desk front (assistant's on top, the link caption, the requester's below); the key
    // on the desk front under the cabinet
    const rows = wA.h + wV.h + (link ? capH + 2.2 * F : 0.6 * F) + 1.0 * F;
    const G1 = fileGeometry({...base, visitorChipHalf: wV.w / 2, panelH: Math.max(56 * z, rows)});
    const keyW = Math.max(8 * F, cx - wA.w / 2 - 24 - (G1.tableL + 30 * z));
    const kh = keyLayout(ctx, {w: keyW, size: F}).h + 0.8 * F;
    return fileGeometry({...base, visitorChipHalf: wV.w / 2, panelH: Math.max(56 * z, rows, kh)});
  }
  // one row: the requester stands far enough right for a link of readable length between the chips;
  // the caption sits just below the line
  // (compact frames keep the requester in place and slide the assistant's chip left instead)
  const vX = compact ? undefined : cx + wA.w / 2 + (link ? 130 : 30) + wV.w / 2;
  const rows = Math.max(wA.h, wV.h) + (link ? capH + 0.9 * F : 0) + 0.9 * F;
  return fileGeometry({...base, visitorX: vX, visitorChipHalf: wV.w / 2, panelH: Math.max(56 * z, rows)});
}

/** Width of the notes column left of the cabinet. */
const colWFor = (F, z, compact, portrait) => (portrait ? 7 * F : compact ? 8 * F : 12.5 * F);

/** Desk front panel height (closeup): room for the key (3 rows) and the name chips. */
const panelHFor = (ctx, F, z) => Math.max(56 * z, keyLayout(ctx, {w: 20 * F, size: F}).h + 0.9 * F);

const scene = {
  sizes: {landscape: [1500, 900], square: [1100, 1000], portrait: [1000, 1500]},
  layout(ctx) {
    const p = ctx.params;
    const D = ctx.design;
    const px = pxPerUnit(ctx);
    const {pieces, target} = resolvePieces(p.props);
    const n = pieces.length;
    const showAll = ctx.show('all');
    const showKey = ctx.show('key');
    const portrait = ctx.view.shape === 'portrait';
    const compact = ctx.view.shape !== 'landscape';
    const m = 10;
    const capA = captionOf(p, 'assistant', p.actorLabels.assistant);
    const capV = captionOf(p, 'requester', p.actorLabels.requester);
    const final = p.finalState;
    // the layout never depends on label visibility (same layout with labels on and off)
    let best = null;
    const F0 = 22.5 / px, Fmin = 16.05 / px;
    for (let F = F0; F >= Fmin - 1e-6 && !(best && best.fits); F = F - 0.5 / px < Fmin && F > Fmin + 1e-6 ? Fmin : F - 0.5 / px) {
      // fewest title lines first (shorter cabinet), then wider pieces with more lines
      for (let L = 1; L <= 3 && !(best && best.fits); L++) {
        const W0 = widthFor(ctx, pieces, F, L);
        if (!W0 || W0 > 0.55 * D.w) continue;
        const M = measurePieces(ctx, {pieces, F, W: W0, showText: true, maxLines: 3});
        const fileFit = fitWords(glueNums(p.objectLabels.cabinet), {maxWidth: (M.W + 3.2 * F) * 0.8, size: F, minSize: F, maxLines: 2, weight: 700});
        // portrait: the requester large in the foreground first; the smaller figure only for the longest labels
        for (const chipRow of compact ? (portrait && F * px > 17 ? [true] : [true, false]) : [true]) for (let z = 3; z >= 0.9; z -= 0.04) {
          if (best && best.fits) break;
          const k = 1.31 * z;
          const geo = (cx, shY) => geometryFor(ctx, {p, F, z, k, M, n, fileFit, capA, capV, portrait, compact, chipRow, cx, shY});
          const G0 = geo(0, 0);
          // ---- labels (measured at the origin; the whole composition is then centred)
          const lab = placeLabels(ctx, {G: G0, M, F, capA, capV, portrait, compact, chipRow, colW: colWFor(F, z, compact, portrait), p, final, D, target});
          const bb = lab.bbox;
          const fits = bb.w <= D.w - 2 * m && bb.h <= D.h - 2 * m && G0.reachMiss <= 0 && lab.ok && M.ok;
          const miss = Math.max(bb.w - (D.w - 2 * m), bb.h - (D.h - 2 * m), 0) + (G0.reachMiss > 0 ? 1e4 : 0) + (lab.ok ? 0 : 1e4);
          if (!best || fits || miss < best.miss) {
            best = {F, M, z, k, fileFit, bb, fits, miss, L: M.lines, geo, chipRow, why: [...lab.why.map(w => w.slice(0, 40)), ...(G0.reachMiss > 0 ? ['reach ' + Math.round(G0.reachMiss)] : []), ...(bb.w > D.w - 2 * m ? ['w ' + Math.round(bb.w)] : []), ...(bb.h > D.h - 2 * m ? ['h ' + Math.round(bb.h)] : [])]};
          }
          if (fits) break;
        }
      }
    }
    const {F, M, z, fileFit, bb} = best;
    // centre the composition in the design space
    const dx = (D.w - bb.w) / 2 - bb.x, dy = (D.h - bb.h) / 2 - bb.y;
    const G = best.geo(dx, dy);
    const lab = placeLabels(ctx, {G, M, F, capA, capV, portrait, compact, chipRow: best.chipRow, colW: colWFor(F, best.z, compact, portrait), p, final, D, target});
    const occupancy = pieces.map((q, i) => [i, i]);
    const stage = fileStage(ctx, {
      prefix: 'st', G, M, pieces, actors: p.actors, fileLabelFit: fileFit, occupancy, movers: [target], cover: false,
      bubble: {text: p.props.request, fit: lab.bubbleFit, box: lab.bubbleBox},
    });
    const script = consultScript(stage, {target, from: target, home: target, touch: Array.from({length: target + 1}, (_, c) => c), final, W});
    const extras = [];
    if (showKey) {
      extras.push(wchip(ctx, capA, {...lab.chipA, name: 'chipA', fill: '#f7f1e3'}).node);
      extras.push(wchip(ctx, capV, {...lab.chipV, name: 'chipV'}).node);
      extras.push(lab.key.build(lab.keyAt.x, lab.keyAt.y));
      extras.push(g({name: 'state-tag', opacity: 0}, wchip(ctx, lab.tagText, {...lab.tag, color: ctx.theme.accent4, stroke: ctx.theme.accent4, weight: 700}).node));
    }
    let rel = null;
    if (showAll && lab.rel) {
      const R = lab.rel;
      rel = connector(ctx, {name: 'rel', from: R.from, to: R.to, kind: R.kind, bend: 0, color: kindColor(ctx, R.kind)});
      extras.push(rel.node);
      extras.push(g({name: 'rel-label', opacity: 0}, wchip(ctx, R.text, {...R.chip, name: 'rel-chip', stroke: kindColor(ctx, R.kind), weight: 600}).node));
    }
    const notes = [];
    if (showAll) {
      for (const nt of lab.notes) notes.push(noteCallout(ctx, nt));
    }
    return {stage, script, G, M, F, n, target, pieces, extras, rel, notes, lab, fits: best.fits, issues: best.why || [], z, textPx: r(F * px, 1), lines: best.L};
  },
  build(ctx, L) {
    return g(null, L.stage.node, L.extras, L.notes.map(nt => nt.node));
  },
  frame(ctx, L, u, timeMs) {
    const p = ctx.params;
    const final = p.finalState;
    const endU = final === 'open-on-desk' ? W.read[1] : W.release[1];
    // actionProgress freezes the choreography part-way (1 = complete)
    const capU = W.toTabs[0] + (endU - W.toTabs[0]) * p.actionProgress;
    const uu = u > W.toTabs[0] ? Math.min(u, capU) : u;
    const input = L.script(uu, timeMs, ctx.reduced);
    const st = L.stage;
    const G = L.G, M = L.M;
    // visitor speaks during the rest beat; the bubble body opens first, then its words
    // the request stays readable in its bubble for the rest of the scene
    const bOpen = seg(u, ...BUBBLE.open);
    const words = seg(u, ...BUBBLE.words);
    const talk = seg(u, 0.07, 0.08) * (1 - seg(u, 0.13, 0.14));
    const flap = ctx.reduced ? 0.5 : 0.25 + 0.5 * Math.abs(Math.sin(timeMs * 0.016));
    const pieces = {[L.target]: input.piece};
    const posed = st.pose({hands: input.hands, pieces, visitor: {mouth: talk * flap, tilt: 0}, bubble: {open: bOpen, words}});
    const nodes = posed.nodes;
    const done = p.actionProgress >= 1;
    const notesW = final === 'open-on-desk' ? NOTES_OPEN : NOTES;
    const noteP = done ? seg(u, ...notesW) : 0;
    if (ctx.show('key')) nodes['state-tag'] = {opacity: r(noteP, 3)};
    if (L.rel) {
      const rp = seg(u, 0.04, 0.12);
      Object.assign(nodes, L.rel.frame(rp, rp > 0 ? 1 : 0));
      nodes['rel-label'] = {opacity: r(seg(u, 0.1, 0.14), 3)};
    }
    L.notes.forEach(nt => Object.assign(nodes, nt.frame(noteP)));
    const pp = posed.piecePose.get(L.target);
    const box = pieceBox(M, pp);
    const handL = posed.mf.hands.l, handR = posed.mf.hands.r;
    const holder = input.piece.holder;
    const tabW = {x: pp.x + (pp.sx ?? 1) * M.gripTab.x, y: pp.y - pp.c * (M.H - M.gripTab.y)};
    const edgeW = {x: pp.x + (pp.sx ?? 1) * M.gripEdge.x, y: pp.y - pp.s * (M.H - M.gripEdge.y)};
    const P2 = q => (q ? {x: r(q.x), y: r(q.y)} : null);
    const inSlot = input.piece.where === 'slot' && (input.piece.rise || 0) === 0 && !input.piece.holder;
    const slots = L.pieces.map((q, c) => (c === L.target ? (inSlot ? L.target : null) : c));
    const beat = u < BEATS.rest[1] ? 'rest' : u < BEATS.action[1] ? 'action' : u < BEATS.complete[1] ? 'complete' : 'hold';
    const faceClear = !overlaps(box, posed.mf.face, -2);
    // the bubble never covers a face; the notes never cover the people or the piece
    const bb = L.lab.bubbleBox;
    const vHead = G.visitor ? {x: G.visitor.head.x - G.visitor.head.r, y: G.visitor.head.y - G.visitor.head.r, w: 2 * G.visitor.head.r, h: 2 * G.visitor.head.r} : null;
    return {
      nodes,
      semantic: {
        beat,
        phase: input.phase,
        handL: P2(handL), handR: P2(handR),
        // grips on the posed piece: tab (left hand, and right hand on the cover) and right edge (right hand)
        gripTab: P2(tabW), gripEdge: P2(edgeW),
        holder,
        grip: input.piece.grip || (holder ? 'tab' : null),
        pieceAt: input.piece.where === 'slot' ? (holder ? 'lifting' : 'slot') : holder ? 'hand' : 'desk',
        piece: P2({x: pp.x, y: pp.y - pp.s * M.H}),
        rise: r(input.piece.rise || 0, 2),
        cover: r(pp.c, 3),
        coverOpen: pp.c < 0,
        slots,
        slotOfTarget: inSlot ? L.target : null,
        targetNumber: L.pieces[L.target].number,
        touched: input.phase === 'run' || input.phase === 'to-tabs',
        openL: r(input.hands.openL, 3),
        look: r(input.hands.look, 3), tilt: r(input.hands.tilt, 2),
        reading: input.phase === 'read',
        bubble: r(bOpen, 3), bubbleWords: r(bOpen >= 1 ? words : 0, 3),
        faceClear,
        // the moving piece never covers another compartment's strip band (title, tab, plate)
        foreignSlots: foreignSlotHits(G, M, pp, input.piece.where, input.piece.where === 'slot' ? input.piece.c : L.target),
        bubbleClear: !vHead || (!overlaps(bb, vHead, 0) && !overlaps(bb, posed.mf.face, 0)),
        finalState: final,
        actionCapped: p.actionProgress < 1 && u > capUOf(p, final),
        notesShown: r(noteP, 3),
        labelsFit: L.fits,
        layoutIssues: L.fits ? [] : L.issues,
        textPx: L.textPx,
        titleLines: L.lines,
        z: r(L.z, 2),
        gripL: holder === 'l' || input.phase === 'handoff' ? P2(tabW) : null,
        gripR: input.phase === 'handoff' ? P2(edgeW) : holder === 'r' ? P2(input.piece.grip === 'tab' ? tabW : edgeW) : input.piece.coverHeld ? P2(tabW) : null,
        handoff: input.phase === 'handoff',
        allReached: posed.reached,
        reachGap: [r(Math.hypot(input.hands.left.x - posed.mf.shoulders.l.x, input.hands.left.y - posed.mf.shoulders.l.y) - 208.2 * L.z, 1), r(Math.hypot(input.hands.right.x - posed.mf.shoulders.r.x, input.hands.right.y - posed.mf.shoulders.r.y) - 208.2 * L.z, 1), r(posed.mf.shift.dy, 1)],
      },
    };
  },
};

function capUOf(p, final) {
  const endU = final === 'open-on-desk' ? W.read[1] : W.release[1];
  return W.toTabs[0] + (endU - W.toTabs[0]) * p.actionProgress;
}

/**
 * Label layout for a stage geometry: bubble (above the visitor), name chips,
 * key (on the desk front), relationship link between the two name chips,
 * state tag and hold callouts (free space beside the cabinet). Returns boxes
 * and the bounding box of the whole composition.
 */
function placeLabels(ctx, o) {
  const {G, M, F, p} = o;
  const z = G.z;
  const occ = [];
  let ok = true;
  const why = [];
  const fail = w => { ok = false; why.push(w); };
  const C = G.cab;
  const V = G.visitor;
  const compact = o.compact;
  const column = compact && !o.chipRow && !V.fore;
  const chipOpts = mw => ({anchor: 'middle', maxWidth: mw, size: F, minSize: F, maxLines: compact ? 3 : 2});
  // name chips on the desk front: the assistant's under the assistant, the requester's under the requester
  const mwA = compact ? 320 * z : 420 * z, mwV = compact ? Math.max(200, 300 * V.k / 1.08) : Math.max(260, 300 * V.k / 1.08);
  const chipAProbe = wchip(ctx, o.capA, {x: 0, y: 0, ...chipOpts(mwA)});
  const chipVProbe = wchip(ctx, o.capV, {x: 0, y: 0, ...chipOpts(mwV)});
  if (chipAProbe.fit.truncated || chipVProbe.fit.truncated) fail('chip');
  const pad = 0.35 * F;
  const link0 = (p.relationships || [])[0];
  // landscape: both chips in the top row of the desk front (caption row below); compact: a column
  const vxMax = G.tableR - 30 * z - chipVProbe.box.w / 2;
  const rowCompact = compact && !column && !V.fore;
  const chipA = {x: rowCompact ? Math.min(G.cx, Math.min(V.x, vxMax) - chipVProbe.box.w / 2 - ((p.relationships || [])[0] ? 130 : 30) - chipAProbe.box.w / 2) : G.cx, y: G.panelTop + pad + 0.2 * F, ...chipOpts(mwA)};
  if (rowCompact && chipA.x - chipAProbe.box.w / 2 < G.tableL + 20) fail('chipA-left');
  const chipV = V.front
    ? {x: V.x - 4 * V.k, y: V.y + 28 * V.k, ...chipOpts(mwV)}
    : V.fore
    ? {x: Math.min(V.x, G.cx + chipAProbe.box.w / 2 + chipVProbe.box.w / 2 - 60), y: V.head.y - V.head.r * 1.4 - 0.3 * F - chipVProbe.box.h, ...chipOpts(mwV)}
    : column
    ? {x: Math.min(Math.max(V.x, G.cx + chipAProbe.box.w / 2 - chipVProbe.box.w / 2 + 40), vxMax), y: G.panelBottom - pad - chipVProbe.box.h, ...chipOpts(mwV)}
    : {x: Math.min(V.x, vxMax), y: G.panelTop + pad + 0.2 * F, ...chipOpts(mwV)};
  const aBox = shift(chipAProbe.box, chipA.x, chipA.y);
  const vBox = shift(chipVProbe.box, chipV.x, chipV.y);
  occ.push(aBox, vBox);
  if (overlaps(aBox, vBox, 6)) fail('chips overlap');
  // key: landscape — at the foot of the free column left of the cabinet (bottom-aligned with the desk front);
  // square — on the desk front under the cabinet, left of the chips; portrait — left of the requester, level with their feet
  const panelKey = column;
  if (rowCompact && overlaps(aBox, {x: G.tableL, y: G.panelTop, w: 1, h: 1}, 0)) fail('chipA');
  const keyWp = V.fore ? Math.max(8 * F, V.x - 70 * V.k - (C.x - 30 - o.colW) - 20)
    : panelKey ? Math.max(8 * F, Math.min(aBox.x, vBox.x) - 24 - (G.tableL + 30 * z)) : o.colW;
  const key = keyLayout(ctx, {w: keyWp, size: F});
  const keyAt = V.fore ? {x: C.x - 30 - o.colW, y: V.y - key.h}
    : panelKey ? {x: G.tableL + 30 * z, y: G.panelTop + Math.max(0.3 * F, (G.panelBottom - G.panelTop - key.h) / 2)}
      : {x: C.x - 30 - key.w, y: G.panelBottom - key.h};
  const kBox = {x: keyAt.x, y: keyAt.y, w: key.w, h: key.h};
  if (panelKey && (kBox.y + kBox.h > G.panelBottom - 2 || overlaps(kBox, aBox, 8) || overlaps(kBox, vBox, 8))) fail('key-panel');
  if (!key.ok) fail('key:' + key.w + '/' + o.colW);
  // bubble above the visitor's head (right of the assistant's face)
  // bubble above the visitor, right of the assistant's face (never wider than that space allows in compact frames)
  const room = V.head.x + 40 * V.k - (G.face.x + G.face.w + 20);
  const bW = V.front ? 14 * F : V.fore ? 11 * F : compact ? 18 * F : Math.min(620, Math.max(360, 520 * z / 1.6));
  const bubbleFit = fitWords(glueNums(`${ctx.t.qOpen}${p.props.request}${ctx.t.qClose}`), {maxWidth: bW - 2 * 0.9 * F, size: F, minSize: F, maxLines: 6, weight: 600});
  if (bubbleFit.truncated) fail('bubbleFit');
  const bH = bubbleFit.height + 1.5 * F;
  let bubbleBox;
  if (V.front) {
    // above both heads, its right edge over the requester (the tail runs down to their mouth)
    bubbleBox = {x: V.head.x + 60 * V.k - bW, y: Math.min(V.head.y - V.head.r, G.face.y - 70 * z) - 26 - bH, w: bW, h: bH};
  } else if (V.fore) {
    // beside the visitor's face, on the side they look to, over the (still empty) front of the desk
    bubbleBox = {x: V.mouth.x - 34 - bW, y: V.head.y - bH / 2 - 10, w: bW, h: bH};
  } else if (compact) {
    const aTop = G.face.y - 60 * z - 12;
    const bx1 = V.head.x + 50 * V.k + 3 * F;
    bubbleBox = {x: bx1 - bW, y: Math.min(V.head.y - V.head.r - 26, aTop) - bH, w: bW, h: bH};
  } else {
    const bx1 = V.head.x + 40 * V.k;
    bubbleBox = {x: Math.max(G.face.x + G.face.w + 20, bx1 - bW), y: V.head.y - V.head.r - 26 - bH, w: bW, h: bH};
    if (bubbleBox.x + bubbleBox.w < V.head.x + 10) bubbleBox.x = V.head.x + 10 - bubbleBox.w;
  }
  // state tag: in the free column left of the cabinet, level with the cabinet's top
  const tagText = `● ${o.final === 'open-on-desk' ? ctx.t.onDesk : ctx.t.returned}`;
  const colW = o.colW;
  const tp = wchip(ctx, tagText, {x: 0, y: 0, anchor: 'end', maxWidth: colW, size: F, minSize: F, maxLines: 5, weight: 700});
  if (tp.fit.truncated) fail('tag');
  const tag = {x: C.x - 30, y: C.y, anchor: 'end', maxWidth: colW, size: F, minSize: F, maxLines: 5, name: 'state-chip'};
  const tBox = shift(tp.box, tag.x, tag.y);
  occ.push(tBox);
  // relationship: a straight link between the two chips; its caption sits beside the line (never on it)
  let rel = null;
  const link = (p.relationships || [])[0];
  if (link && link.from !== link.to) {
    const byId = {assistant: aBox, requester: vBox};
    const A = byId[link.from], B = byId[link.to];
    const {from, to} = chipLink(A, B);
    const text = link.label || ctx.t[link.kind] || link.kind;
    const probe = wchip(ctx, text, {x: 0, y: 0, anchor: 'middle', maxWidth: 360, size: F, minSize: F, maxLines: 2});
    const place = captionBeside(probe.box, from, to, occ, Math.max(1.4 * F, Math.max(A.h, B.h) / 2 + 10));
    if (!place || Math.hypot(to.x - from.x, to.y - from.y) < 70) fail('rel');
    else {
      occ.push(place.box);
      rel = {from, to, kind: link.kind, text, chip: {x: place.x, y: place.y, anchor: 'middle', maxWidth: 360, size: F, minSize: F, maxLines: 2}, box: place.box};
    }
  }
  // hold callouts: in the free column left of the cabinet, leader to the target's left edge
  const notes = [];
  const row = G.rows[o.target];
  const targetPt = {
    piece: o.final === 'open-on-desk' ? {x: G.lie.x - 4, y: G.lie.y - 0.2 * M.H} : {x: C.innerL + 2, y: row.stripTop + M.stripH / 2},
    cabinet: {x: C.x - 2, y: C.housing.y + C.housing.h / 2},
  };
  let yCur = tBox.y + tBox.h;
  const order = (p.annotations || []).map((a, j) => [j, a]).sort((q1, q2) => (targetPt[q1[1].target] || targetPt.piece).y - (targetPt[q2[1].target] || targetPt.piece).y);
  for (const [j, a] of order) {
    const probe = noteCallout(ctx, {name: `note${j}`, text: a.text, chipAt: {x: 0, y: 0}, target: {x: 0, y: 0}, maxWidth: colW, size: F, minSize: F, maxLines: 10});
    if (probe.fit.truncated) fail('note');
    const tg = targetPt[a.target] || targetPt.piece;
    const cx = C.x - 30 - probe.box.w / 2;
    let y = tg.y - probe.box.h / 2;
    y = Math.max(y, yCur + 12);
    yCur = y + probe.box.h;
    notes.push({name: `note${j}`, text: a.text, chipAt: {x: cx, y}, target: tg, maxWidth: colW, size: F, minSize: F, maxLines: 10, box: {x: cx - probe.box.w / 2, y, w: probe.box.w, h: probe.box.h}});
  }
  if (notes.some(nt => overlaps(nt.box, kBox, 8))) fail('notes-key');
  occ.push(kBox);
  // bounding box of stage + labels
  const boxes = [G.bbox, aBox, vBox, kBox, bubbleBox, tBox, ...notes.map(nt => nt.box)];
  if (rel) boxes.push(rel.box);
  const x0 = Math.min(...boxes.map(b => b.x)), y0 = Math.min(...boxes.map(b => b.y));
  const bbox = {x: x0, y: y0, w: Math.max(...boxes.map(b => b.x + b.w)) - x0, h: Math.max(...boxes.map(b => b.y + b.h)) - y0};
  // the bubble keeps clear of both faces
  const vHead = {x: V.head.x - V.head.r, y: V.head.y - V.head.r, w: 2 * V.head.r, h: 2 * V.head.r};
  if (overlaps(bubbleBox, vHead, 0) || overlaps(bubbleBox, G.face, 0)) fail('bubbleFace');
  return {ok, why, bbox, chipA, chipV, key, keyAt, bubbleBox, bubbleFit, tag, tagText, rel, notes, boxes: {aBox, vBox, kBox, tBox}};
}

/** End points of a straight link between two chip boxes (on the facing edges, arrow end kept off the chip). */
function chipLink(A, B) {
  const ca = {x: A.x + A.w / 2, y: A.y + A.h / 2}, cb = {x: B.x + B.w / 2, y: B.y + B.h / 2};
  const sideways = Math.max(B.x - (A.x + A.w), A.x - (B.x + B.w)) > 20;
  if (sideways) {
    const right = cb.x > ca.x;
    return {from: {x: right ? A.x + A.w + 4 : A.x - 4, y: ca.y}, to: {x: right ? B.x - 14 : B.x + B.w + 14, y: cb.y}};
  }
  const down = cb.y > ca.y;
  const x = (Math.max(A.x, B.x) + Math.min(A.x + A.w, B.x + B.w)) / 2;
  return {from: {x, y: down ? A.y + A.h + 4 : A.y - 4}, to: {x, y: down ? B.y - 14 : B.y + B.h + 14}};
}

/**
 * Caption position beside a straight line from→to: the caption box never crosses the line and its
 * nearest edge is at most `near` from it; tried along the middle of the line, both sides.
 */
function captionBeside(box, from, to, occ, near) {
  const L = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  const nx = -(to.y - from.y) / L, ny = (to.x - from.x) / L;
  const hitsLine = b => {
    for (let k = 0; k <= 40; k++) {
      const x = from.x + (to.x - from.x) * k / 40, y = from.y + (to.y - from.y) * k / 40;
      if (x > b.x - 3 && x < b.x + b.w + 3 && y > b.y - 3 && y < b.y + b.h + 3) return true;
    }
    return false;
  };
  const dist = b => {
    let d = Infinity;
    for (let k = 0; k <= 40; k++) {
      const x = from.x + (to.x - from.x) * k / 40, y = from.y + (to.y - from.y) * k / 40;
      d = Math.min(d, Math.hypot(Math.max(b.x - x, 0, x - b.x - b.w), Math.max(b.y - y, 0, y - b.y - b.h)));
    }
    return d;
  };
  for (const t of [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]) {
    for (const sgn of [-1, 1]) {
      for (let off = 6; off <= box.h + box.w; off += 4) {
        const m = {x: from.x + (to.x - from.x) * t + nx * sgn * off, y: from.y + (to.y - from.y) * t + ny * sgn * off};
        const b = {x: m.x - box.w / 2, y: m.y - box.h / 2, w: box.w, h: box.h};
        if (hitsLine(b)) continue;
        if (dist(b) > near) break;
        if (occ.some(q => overlaps(b, q, 4))) continue;
        return {x: m.x, y: b.y, box: b};
      }
    }
  }
  return null;
}

export default defineAnimation({
  id: ID,
  version: '1.0.0',
  defaultDurationMs: DURATION,
  metadata: makeMetadata({
    id: ID,
    slug: 'roles-09-story',
    title: 'Case-file consultation — an assistant takes a numbered piece out by its tab, reads it and puts it back in its slot',
    titleEs: 'Consulta de expediente por auxiliar — Microescena con objetos y actores',
    category: 'roles',
    categoryName: 'Personas y funciones jurídicas',
    motif: 'Consulta de expediente por auxiliar',
    treatment: 'story',
    family: 'staged-scene',
    description: 'A visitor asks for a piece of a fictional case file. The assistant runs a hand down the tabs of a roll-top step cabinet, pinches the requested piece’s numbered tab, lifts it out, hands it to the other hand, lays it on the desk, opens and reads it, then closes it and slides it back into its own numbered slot. Only the supplied final state is shown; no legal effect is drawn.',
    tags: ['case file', 'expediente', 'assistant', 'numbered piece', 'index tab', 'slot', 'consultation', 'speech bubble', 'desk', 'return to position'],
    defaultDurationMs: DURATION,
    assets: ['src/animations/roles/kits/consulta-de-expediente.js', 'src/animations/roles/kits/mediation-props.js', 'src/animations/roles/kits/mediation-labels.js', 'src/primitives/person.js', 'src/primitives/people-style.js', 'src/primitives/annotate.js', 'src/primitives/paper.js'],
  }),
  sceneSchema,
  defaultParams,
  strings: STRINGS,
  scene,
});
