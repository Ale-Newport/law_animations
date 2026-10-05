// LAW-0152 — Remisión entre artículos · inspect. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: the detail keeps its source coordinates (the
// window grows out of the printed phrase in the miniature and returns onto it), the
// change is localised (one phrase; then only the last hop, its ring and the flag), and
// seeking back restores exactly the previous datum and geometry.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
// shared per-ratio runner (real 16:9 / 1:1 / 9:16 instances × every preset × labels shown/hidden)
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ALT = presetsFor('LAW-0152').find(q => q.name === 'contrast-or-alternative').params;
const AT_SOURCE = 's.sourceHoldsPhrase';

contractSuite('LAW-0152', {
  // The window is an opaque, enlarged optical copy drawn over the miniature; only the copy's texts carry a
  // zero-width mark, so no other label pair is exempted from the overlap heuristic.
  allowTextOverlap: ['\u200B'],
  continuity: ['flag', 'lens'],
  continuityLimit: 120,
  semantic: [
    {at: 0.15, fn: "s.contextScale === 1 && s.lensOpen === 0 && s.datum === 'before' && s.shown === 'before' && s.flagAt === 2 && s.trails.old > 0.99 && s.trails.new === 0 && s.markerShown === 0", label: 'context: the state produced by the jump (flag on Art. 9, trail, ring) at full size, old phrase printed'},
    {at: 0.36, fn: "s.contextScale < 0.6 && s.lensOpen > 0.8 && s.datum === 'before' && s.oldStruck === 0 && " + AT_SOURCE, label: 'isolate: a miniature and a window enlarging the phrase, taken at its source; nothing changed yet'},
    {at: 0.24, fn: AT_SOURCE + ' && s.lensOpen > 0 && s.lensOpen < 1', label: 'the window grows out of the phrase in the miniature (source coordinates kept)'},
    {at: 0.412, fn: "s.oldStruck > 0.9 && s.datum === 'before' && s.flagAt === 2", label: 'substitute: the old phrase is struck first (datum still the old one)'},
    {at: 0.58, fn: "s.slipLanded && s.shown !== 'before' && s.flagAt === 2 && s.trails.new === 0", label: 'the struck slip reaches the change card before anything else moves; the geometry has not changed yet'},
    {at: 0.775, fn: "s.datum === 'after' && s.shown === 'after' && s.flagAt === 3 && s.trails.new === 1 && s.trails.oldGhost === 1 && s.rings.new === 1 && s.rings.old < 0.3", label: 'only the dependent geometry updates: the flag hops to Art. 12, new trail and ring; the old ones stay as ghosts'},
    {at: 1, fn: "s.contextScale === 1 && s.lensOpen === 0 && s.markerShown === 1 && s.datum === 'after' && s.flagAt === 3 && s.slipLanded", label: 'return: full context again with a Δ marker; the struck old value stays in the card'},
    {at: 0.35, fn: "s.datum === 'before' && s.flagAt === 2 && s.trails.new === 0 && s.rings.new === 0 && s.markerShown === 0 && !s.slipLanded", label: 'seeking back (after the end) restores the old phrase, flag, trail and ring exactly'},
    {at: 1, params: ALT, fn: "s.focusIdx === 2 && s.oldTarget === 3 && s.newTarget === 1 && s.flagAt === 1", label: 'alternative: the change in the middle of a chain re-routes only the last hop (to Art. 6)'},
    {at: 0.75, params: {textVisibility: 'none'}, fn: "s.flagAt === 3 && s.trails.new === 1 && s.contextScale < 0.6", label: 'labels hidden: the same localised change is visible'},
    {at: 1, params: {afterTarget: 2}, fn: "s.flagAt === 2 && s.newTarget === 2", label: 'a new phrase supplied as pointing to the same article leaves the flag where it was (nothing inferred from the wording)'},
  ],
});

suppliedTextSuite('LAW-0152', {
  fields: 'const f = p.passages.map((x, i) => x.ref); const cues = p.passages.filter((x, i) => i !== (p.path.length >= 2 ? p.path[p.path.length - 2] : 0)).map(x => x.cue); return [p.sources[0].title, ...p.hierarchy.levels, ...f, ...cues, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker, ...p.interpretations.flatMap(i => [i.by, i.text])];',
  content: 'return [...p.hierarchy.levels, ...p.passages.map(x => x.ref), p.beforeValue, p.afterValue];',
  captions: 'return [p.contextLabels.context, "no conclusion drawn", "sin conclusión"];',
});

ratioChecks('LAW-0152', 'flag and trails clear of text; articles fit; window clear of the miniature; desk inside the frame', [
  {at: [1], fn: 's.flagClear && s.trailTextHits === 0 && !s.volumeOverflow && s.cardInside && s.deskInside', label: 'hold: flag and trails clear of text; articles and card fit'},
  {at: [0.45, 0.6], fn: 's.insetClear', label: 'the window never covers the miniature'},
]);

// Review round 2 (every preset × real ratio × labels shown/hidden): the window opens while the desk shrinks and
// closes while it grows (never a lone thumbnail on a blank frame); the hop to the new article is shown enlarged in
// the window; with labels hidden a text-free struck-old → new pictogram keeps the old value traceable; the window
// magnifies the phrase at least 1.2× on every composition.
ratioChecks('LAW-0152', 'no lone thumbnail; hop seen enlarged; old value traceable without labels; window large', [
  {at: times(0.2, 0.9, 0.01), fn: '!s.blankFrame', label: 'never a small thumbnail with no open window'},
  {at: [0.67, 0.7, 0.74], fn: 's.lensShowsHop && s.hopVsThumb >= 1.6', label: 'the flag\'s hop is shown in the open window (both articles inside it, >= 1.6× the miniature)'},
  {at: [0.62, 0.8, 1], fn: 's.traceable', label: 'the old value stays traceable after it is lifted (card, or pictogram with labels hidden)'},
  {at: [0.4], fn: 's.lensZoom >= 1.2 && s.insetClear', label: 'the window magnifies the phrase >= 1.2× and stays clear of the miniature'},
]);

// Review round 3 (every preset × real ratio × labels shown/hidden): the whole new phrase is held enlarged for
// >= ~400 ms before the pan; ONE window, steady in size and place, pans its content; the struck slip never crosses
// the caption; the change card appears only after the strike; the old and new trails keep lanes of their own.
ratioChecks('LAW-0152', 'held new phrase; steady window; slip clear of caption; card after strike; separate trails', [
  {at: [0.545, 0.56, 0.575, 0.59], fn: "s.shown === 'after' && s.panP === 0 && s.phraseWhole && s.lensOpen === 1", label: 'the new phrase is held whole in the open window for u 0.545–0.59 (>= 360 ms, 480 ms by design)'},
  {at: [0.36, 0.45, 0.55, 0.6, 0.62, 0.64, 0.66, 0.7, 0.76], fn: '(globalThis.__lr = (u === 0.36 ? JSON.stringify(s.lensRect) : globalThis.__lr)) === JSON.stringify(s.lensRect)', label: 'the open window keeps one size and place through the substitution and the pan (content pans, not the window)'},
  {at: times(0.42, 0.49, 0.005), fn: 's.slipClearOfCaption', label: 'the lifted slip never crosses the caption'},
  {at: [0.36, 0.39, 0.405], fn: 's.cardShown === 0', label: 'the change card is not shown before the old phrase is struck'},
  {at: [1], fn: 's.trailsApart >= 12', label: 'at the hold the old and new trails run in separate lanes (>= 12 units apart)'},
]);
