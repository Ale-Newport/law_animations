// LAW-0149 — Remisión entre artículos · story. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: continuity of motion (hand and page flag at
// 60 fps, all ratios), object anchoring (the flag rides the solved hand from grip to
// release; the arm always reaches and enters from outside the desk), and a
// transformation that stays recognisable with labels hidden (the flag lands on the
// referenced article, which is ringed; the trail stays).
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
// shared per-ratio runner (real 16:9 / 1:1 / 9:16 instances × every preset × labels shown/hidden)
import {ratioChecks, times} from '../harness/ratio-checks.js';

const CHAIN = presetsFor('LAW-0149').find(q => q.name === 'contrast-or-alternative').params;

contractSuite('LAW-0149', {
  continuity: ['hand', 'flag'],
  attach: [
    // from the moment the hand reaches the flag until it withdraws, the flag's grip is the solved hand
    {from: 0.126, to: 0.464, a: 'hand', b: 'flag', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.holder === 'page' && s.flagAt === 0 && s.hopsDone === 0 && s.trails.every(v => v === 0) && s.ring === 0 && s.kindShown === 0 && s.statusShown === 0 && !s.handInFrame", label: 'rest: the flag lies on the referring provision; no trail, ring or state yet; the hand is still outside'},
    {at: 0.1, fn: "s.handInFrame && s.holder === 'page' && s.flagAt === 0", label: 'the hand comes in to the flag before anything moves (cause before effect)'},
    {at: 0.3, fn: "s.holder === 'hand' && s.flagAt === null && s.lift > 0 && s.trails[0] > 0 && s.trails[0] < 1 && s.ring === 0", label: 'the hand carries the lifted flag; the trail is drawn behind it'},
    {at: 0.45, fn: "s.flagAt === 2 && s.hopsDone === 1 && s.trails[0] === 1", label: 'the flag is pressed on at the referenced article (the supplied stop)'},
    {at: 0.6, fn: "s.holder === 'page' && s.ring === 1 && !s.handInFrame && s.flagAt === 2", label: 'the referenced article is ringed; the hand lets go and leaves'},
    {at: 1, fn: "s.flagAt === 2 && s.ring === 1 && s.kind === 'direct' && s.kindShown === 1 && s.statusShown === 1 && s.notesShown === 1 && s.keyShown === 1", label: 'hold: direct reference, flag on the referenced text, key, state and note shown'},
    {at: 0.45, params: CHAIN, fn: "s.hops === 2 && s.hopsDone === 1 && s.flagAt === 2 && s.trails[1] === 0", label: 'chain: the first hop ends at Art. 9 before the second starts'},
    {at: 1, params: CHAIN, fn: "s.kind === 'chain' && JSON.stringify(s.stops) === '[0,2,3]' && s.hopsDone === 2 && s.flagAt === 3 && s.trails.every(v => v === 1)", label: 'chain: the flag follows the whole supplied path to Art. 12'},
    {at: 1, params: {...CHAIN, finalState: 'first-stop'}, fn: "s.hopsDone === 1 && s.flagAt === 2 && JSON.stringify(s.stops) === '[0,2]'", label: 'supplied final state "first-stop": the flag stops at the first referenced article'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && s.holder === 'hand' && s.flagAt === null", label: 'actionProgress freezes the action part-way (flag still in the hand)'},
    {at: 0.45, params: {textVisibility: 'none'}, fn: "s.flagAt === 2 && s.trails[0] === 1", label: 'labels hidden: the hop still happens'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.flagAt === 2 && s.ring === 1 && s.trails[0] === 1", label: 'labels hidden: landing, ring and trail read without text'},
    {at: 1, params: {path: [2, 0]}, fn: "s.flagAt === 0 && JSON.stringify(s.stops) === '[2,0]'", label: 'the path is taken as supplied (any order), nothing inferred from the wording'},
  ],
});

suppliedTextSuite('LAW-0149', {
  fields: 'return [p.sources[0].title, ...p.hierarchy.levels, ...p.passages.map(x => x.ref), ...p.passages.map(x => x.cue), p.actorLabels.a, p.actorLabels.b, p.objectLabels.marker, p.objectLabels.path, ...p.annotations.map(a => a.text), ...p.interpretations.flatMap(i => [i.by, i.text])];',
  content: 'return [p.sources[0].title, ...p.hierarchy.levels, ...p.passages.map(x => x.ref), ...p.passages.map(x => x.cue), p.actorLabels.a, p.actorLabels.b, p.objectLabels.marker, p.objectLabels.path, ...p.annotations.map(a => a.text)];',
  captions: 'return ["no conclusion drawn", "sin conclusión"];',
});

// Real-ratio checks (every preset × 16:9 / 1:1 / 9:16 × labels shown / hidden): the parked flag and the hop
// trails never lie over printed text, every article fits its page, and the arm always reaches its target
// while entering from outside the desk (no visible shoulder stump).
ratioChecks('LAW-0149', 'parked flag and trails clear of text; articles fit; arm reaches from outside the desk', [
  {at: [1], fn: 's.flagClear && s.trailTextHits === 0 && !s.volumeOverflow', label: 'hold: flag and trails clear of text; articles fit their pages'},
  {at: times(0, 1, 0.05), fn: 's.allReached && s.shoulderOut', label: 'arm reaches and enters from outside the desk'},
]);

// Review round 2: numbers mean hop order only (notes use lettered squares), and every hop trail is long,
// visible and never covered by its badge or a flag — every preset × real ratio × labels shown/hidden.
ratioChecks('LAW-0149', 'hop trails visible and uncovered; notes lettered, badges numbered', [
  {at: [1], fn: 's.badgesClear && s.trailLengths.every(v => v >= 120) && s.noteMarkers === "letters"', label: 'hold: every hop trail >= 120 units long, its badge beside it (clear of trail, flags and text)'},
  {at: [1], dom: '[...svg.querySelectorAll("[data-node^=pin] text, [data-node$=-num] text")].every(t => /^[a-z]$/.test(t.textContent)) && [...svg.querySelectorAll("[data-node^=badge] text")].every(t => /^[0-9]$/.test(t.textContent))', label: 'note markers are letters; circled numbers only on hop badges'},
]);

// Review round 3: with labels hidden there is no key panel, so the book takes the desk (no empty half,
// no ghost mat) — the book spans >= 75 % of the desk width in every ratio and preset.
ratioChecks('LAW-0149', 'labels hidden: the book fills the desk', [
  {at: [0, 1], tv: ['none'], fn: 's.bookCover >= 0.75 && !s.volumeOverflow && s.flagClear && s.trailTextHits === 0', label: 'labels hidden: book >= 75 % of the desk width; flag and trails clear of text'},
]);
