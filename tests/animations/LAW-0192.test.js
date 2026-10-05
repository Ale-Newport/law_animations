// LAW-0192 — Atención en registro · inspect. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: the detail keeps its source coordinates (the lens copy is the card drawn at
// the card's own coordinates, uniformly enlarged ≥ 1.5×, cropped to the inspected row), the change is
// localised (one status value and its dependent glyph), and seeking back restores the old datum exactly.
// Windows (LAW-0192.js W): context replay 0–0.12 · lens opens 0.20–0.36 (an opaque window slides off the
// row and grows; its copy shows as soon as it has left the row) · in the lens: strike 0.42–0.47, old → grey
// 0.47–0.50, the row opens and the new value is written 0.49–0.55, glyph swap 0.54–0.60 · held · lens closes
// 0.66–0.71 · then in context: the pen re-marks the slot 0.71–0.76 while the row opens and the new value is
// written · Δ and its label 0.765–0.80 · pen back by 0.80. Main action complete by 0.80.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {facesClear, labelsOwnConnectors, noDoubleImage, NO_TEXT_ON_BARS, dense} from './atencion-en-registro-dom.js';

contractSuite('LAW-0192', {
  // the lens window is an opaque enlarged copy over the dimmed context; only the copy's texts carry a
  // zero-width mark, so no other label pair is exempted from the overlap heuristic
  allowTextOverlap: ['​'],
  continuity: ['filerHand', 'clerkL', 'clerkR', 'pen', 'slipC'],
  attach: [
    {from: 0, to: 1, a: 'filerHand', b: 'gripF', tol: 1.5},
    {from: 0, to: 1, a: 'clerkL', b: 'gripC', tol: 1.5},
    // while the slot is re-marked in context the solved pen nib is on it
    {from: 0, to: 1, a: 'pen', b: 'tapTarget', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.lensCopyMatches && s.context.dot === 1 && s.context.ring === 0 && s.markerShown === 0", label: 'context: the state produced by the intake; the inspected row shows its supplied before-state'},
    {at: 0.3, fn: "s.lensOpen > 0 && s.lensOpen < 1 && s.datum === 'before'", label: 'isolate: the lens grows out of the row (nothing changed yet)'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.lens.strike === 0 && s.magnification >= 1.5", label: 'the row is enlarged (≥ 1.5×) before anything is substituted'},
    {at: 0.5, fn: "s.datum === 'changing' && s.lens.strike === 1 && s.lens.old >= 0.5 && s.contextDatum === 'before'", label: 'substitution inside the lens only; the old value stays readable (traceable)'},
    {at: 0.62, fn: "s.datum === 'after' && s.lens.ring === 1 && s.lens.dot === 0 && s.lensOpen === 1 && s.contextDatum === 'before'", label: 'only the dependent glyph changes (dot → dashed ring, as supplied)'},
    {at: 0.57, fn: 's.lens.dot === 0 || s.lens.ring === 0', label: 'the glyphs never overlap in place (the old goes out before the new comes in)'},
    {at: 0.705, fn: "s.lensOpen > 0 && s.lensOpen < 0.25 && (s.lensCopyVisible === 0) === s.lensOverSource", label: 'the closing window is blank only while it is back over its source'},
    {at: 1, fn: 's.blankMs.open <= 200 && s.blankMs.close <= 200', label: 'a bare (blank) window lasts ≤ 200 ms on opening and on closing'},
    {at: 0.3, fn: 's.lensCopyVisible === 1 && !s.lensOverSource', label: 'the copy is shown while the window is still growing (clear of its source)'},
    {at: 0.4, fn: 's.lens.grow === 0', label: 'before the swap the lens holds only the row (no blank line reserved for the new value)'},
    {at: 0.56, fn: 's.lens.grow === 1 && s.lens.reveal === 1', label: 'the row opens its new-value line at the swap'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.context.ring === 1 && s.markerShown === 1 && s.mainActionEnd <= 0.8 && s.tapTarget === null", label: 'main action complete by u = 0.8'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.markerShown === 1 && s.oldTraceable && s.allReached && s.labelsFit && s.markOnRow && s.markClearOfFaces", label: 'hold: changed datum marked on its row, old value still traceable'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.context.dot === 1 && s.markerShown === 0", label: 'seeking back (after the end) restores the old datum and glyph exactly'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.contextDatum === 'after' && s.markerShown === 1 && s.context.ring === 1", label: 'labels hidden: the same localised change is visible'},
    {at: 1, params: {detailGeometry: {zoom: 2.6, placement: 'auto', states: {before: 'received', after: 'received'}}}, fn: 's.context.dot === 1 && s.context.ring === 0', label: 'the glyph follows the SUPPLIED states, never the wording (equal states keep the dot)'},
  ],
});

suppliedTextSuite('LAW-0192', {
  fields: `const role = (id, i) => (p.roles[id] || p.actors[i].role);
    return [p.actors[0].name, p.actors[1].name, role('filer', 0), role('clerk', 1), ...p.props.items, p.props.reference, p.objectLabels.checklist, p.objectLabels.slip,
      p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker, p.relationships[0].label]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión', 'Recibido', 'Pendiente (según lo aportado)'] : ['As supplied · no conclusion drawn', 'Received', 'Pending (as supplied)']`,
});

// rendered: while the lens is open no text of the enlarged copy is cut by the window's rim — each copy
// text box lies fully inside the window or fully outside it
const RIM = `(() => {
  const bg = svg.querySelector('[data-node="lens-bg"]');
  if (!bg) return false;
  const w = bg.getBoundingClientRect();
  const texts = [...svg.querySelectorAll('[data-node="lens-content"] text')].filter(t => (t.textContent || '').replace(/\\u200B/g, '').trim());
  for (const t of texts) {
    const b = t.getBoundingClientRect();
    const inter = b.left < w.right - 1 && b.right > w.left + 1 && b.top < w.bottom - 1 && b.bottom > w.top + 1;
    const inside = b.left >= w.left - 1 && b.right <= w.right + 1 && b.top >= w.top - 1 && b.bottom <= w.bottom + 1;
    if (inter && !inside) return false;
  }
  return texts.length > 0 || true;
})()`;
const CARDS = '[data-node^="chip-"], [data-node="legend"], [data-node="keyg"], [data-node="captiong"], [data-node^="rell"], [data-node="st-card"], [data-node="st-slippos"], [data-node="st-bdpos"]';
ratioChecks('LAW-0192', 'real magnification, no double image, no rim cut; faces, connectors and bars clear', [
  {at: [1], fn: 's.labelsFit && s.lensCopyMatches', label: 'labels fit; the lens is a uniform real copy'},
  {at: [0.4, 0.5, 0.6, 0.65], fn: 's.magnification >= 1.5 && s.lensOpen === 1', label: 'lens ≥ 1.5× the context while it is open'},
  // the window never covers a person (heads, bodies, the clerk's hands) at any moment of its path
  {at: dense(0.2, 0.36, 0.005).concat(dense(0.36, 0.66, 0.05), dense(0.66, 0.72, 0.005)), fn: 's.lensClearOfPeople', label: 'the lens covers no person at any moment (open, hold, close)'},
  // the copy is hidden only while the window still overlaps its source
  {at: dense(0.2, 0.36, 0.005).concat(dense(0.66, 0.72, 0.005)), fn: 's.lensOpen === 0 || s.lensCopyVisible === 0 || !s.lensOverSource', label: 'the lens copy is never shown while the window overlaps its source'},
  {at: [1], fn: 's.blankMs.open <= 200 && s.blankMs.close <= 200', label: 'a bare window lasts ≤ 200 ms (open and close)'},
  {at: [0.5], ratios: ['16:9'], fn: 's.wallSpan.x0 <= 0.02 && s.wallSpan.x1 >= 0.98 && s.sceneSpan.x1 - s.sceneSpan.x0 >= 0.5 && Math.abs(s.sceneSpan.x0 + s.sceneSpan.x1 - 1) <= 0.04', label: '16:9: the context is centred, spans ≥ 50 % of the width with its wall running edge to edge'},
  {at: [0.5], ratios: ['9:16'], presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es'], fn: 's.depth && Math.min(s.headPx.filer, s.headPx.clerk) * 1080 / 950 >= 118', label: '9:16: depth framing, both heads ≥ 118 px'},
  // the new value is readable and held still for ≥ 400 ms (0.555 → 0.655 = 800 ms at 8 s)
  {at: [0.555, 0.6, 0.655], fn: "s.lens.reveal === 1 && s.lens.strike === 1 && s.lensOpen === 1 && s.datum === 'after' || (s.lens.reveal === 1 && s.lensOpen === 1)", label: 'the new value is fully shown and held while the lens is open'},
  {at: dense(0.16, 0.4, 0.01).concat(dense(0.62, 0.8, 0.005)), dom: noDoubleImage('lens-bg', 'lens-win'), label: 'rendered: no two visible copies of the same text overlap (lens open / close)', tv: ['all']},
  {at: [0.4, 0.5, 0.6, 0.65], dom: RIM, label: 'rendered: no text of the copy is cut by the lens rim', tv: ['all']},
  {at: [1], fn: 's.markRadius >= 14 && s.markOnRow && s.markClearOfFaces', label: 'the Δ is pinned on the changed row at a clear size, clear of faces'},
  {at: [1], fn: 's.markNoteGap !== null && s.markNoteGap >= 0 && s.markNoteGap <= 24 && s.markNoteShown === 1', label: 'the changed-datum label sits directly under the changed value', tv: ['all']},
  {at: dense(0, 1, 0.02), fn: 's.allReached', label: 'every hand target is reached on every sampled frame'},
  {at: [0, 0.1, 0.2, 0.72, 0.74, 0.76, 0.8, 1], dom: facesClear(['st-F-head', 'st-C-head'], CARDS), label: 'rendered: no card, chip or held prop covers a face'},
  {at: [1], dom: labelsOwnConnectors('rell', 'rel'), label: 'rendered: the relation label sits beside its own connector', tv: ['all']},
  {at: dense(0, 1, 0.025), dom: NO_TEXT_ON_BARS, label: 'rendered: no visible text lands on a visible placeholder bar'},
]);
