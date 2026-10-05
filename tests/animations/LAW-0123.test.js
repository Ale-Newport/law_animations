// LAW-0123 — Texto y contexto · contrast. Contract battery + checks encoding
// the brief's acceptanceCheck: two complete scenes exist, exactly the indicated
// fact (the reading scope) changes the sequence, and no legal consequence,
// score or winner is drawn to complete the contrast.
import {contractSuite} from '../harness/contract.js';
import {ratioChecks, times} from './texto-y-contexto-ratio-checks.js';

contractSuite('LAW-0123', {
  // The magnifier glass in each desk shows a magnified COPY of the page over
  // the page itself (intentional optical overprint). Only copy text nodes carry
  // the zero-width marker COPY_MARK from the kit.
  allowTextOverlap: ['​'],
  continuity: ['handA', 'lensA', 'handB', 'lensB'],
  attach: [
    {from: 0.121, to: 1, a: 'handA', b: 'gripA', tol: 1.5},
    {from: 0.121, to: 0.719, a: 'handB', b: 'gripB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.sameSetup && s.identicalDesks && !s.A.onWord && !s.B.onWord && !s.scopeMarks.A && !s.scopeMarks.B", label: 'base: two identical desks, no difference shown yet'},
    {at: 0.3, fn: "s.scopeMarks.A && s.scopeMarks.B && s.A.scope === 'word' && s.B.scope === 'article'", label: 'change beat: the scope is marked in place (A: the word, B: the whole article)'},
    {at: 0.48, fn: "s.A.onWord && s.B.onWord && s.A.magnification === s.B.magnification && s.A.isolated && s.B.isolated", label: 'same action, same timing: both lenses raise the same word'},
    {at: 0.62, fn: "s.A.onWord && s.A.held && s.A.isolated && !s.B.isolated && !s.B.onWord && s.B.held", label: 'the changed fact alters the sequence: A stays on the word, B sweeps the article'},
    {at: 0.8, fn: "s.A.held && s.A.onWord && !s.A.context.occurrences && !s.B.held && s.B.context.occurrences && s.B.context.rack", label: 'A keeps the word alone; B has put it back and marked the context'},
    {at: 1, fn: "s.A.card && s.B.card && s.guide && s.sameSetup && !s.sharedFactsShown", label: 'hold: both attributed readings and the comparison guide; no score or winner'},
    {at: 0.3, fn: "s.sharedFactsShown", label: 'shared facts are listed while the change is introduced'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.A.onWord && s.B.context.occurrences && s.guide", label: 'labels hidden: the difference still reads (lens kept vs context marks)'},
    {at: 0.66, params: {passages: {heading: 'Text 4 · Art. 9 (fictional)', lines: ['The keeper signs the record at closing time.', 'Each record lists the keys.', 'A copy of the record stays in the hall.'], word: 'record', wordPassage: 0}}, fn: "s.occurrences === 2 && s.sameSetup", label: 'occurrences come from the supplied text; both desks share it'},
  ],
});

// Round 3 (items 3, 11, 18): the contrast must be two complete desk scenes —
// each with a rack, a book with the article, a magnifier and the reader's arm —
// that stay identical until the change beat (with labels hidden too), and each
// scene must be large: ≥ ~40 % of the frame width side by side, the full width
// (lane) when stacked.
ratioChecks('LAW-0123', 'two complete scenes, identical before the change, each large in the frame', [
  {at: times(0, 0.17, 0.0425), fn: 's.identicalDesks && s.sameSetup', label: 'the two desks render identically before the change beat'},
  {at: [1], fn: "s.sceneShare.arrangement === 'side' ? s.sceneShare.A >= 0.40 && s.sceneShare.B >= 0.40 : s.sceneShare.A >= 0.80 && s.sceneShare.B >= 0.80", label: 'scene share: ≥ 0.40 of the frame width side by side, ≥ 0.80 stacked (every ratio)'},
  // Round 4 (1:1, item 18): each DESK itself spans ≥ 0.80 of the frame width when
  // stacked (header plate and reading card lie on its wood), ≥ 0.40 side by side
  {at: [0, 1], fn: "s.sceneShare.arrangement === 'side' ? s.sceneShare.desk >= 0.40 : s.sceneShare.desk >= 0.80", label: '1:1 desk share: ≥ 0.40 side by side, ≥ 0.80 stacked', ratios: ['1:1']},
  // Round 4 (minor): the reader's hand never leaves its desk frame (at rest, carrying, raising)
  {at: times(0, 1, 0.025), fn: 's.handsInside && s.allReached', label: 'each hand stays inside its desk frame'},
  // Round 4: the raised / sweeping lens is never cut by its desk frame
  {at: times(0, 1, 0.025), fn: 's.lensesInside', label: 'each lens lies wholly inside its desk frame'},
  // Round 4 (minor): B's highlighted rack row carries its level name as real text
  {at: [1], fn: 's.rowLabel', label: 'the row B ties to is labelled with its level name (labels shown)'},
  // Round 5 (items 1, 5): the row label sits on the drawer's own plate above the
  // slot; no label, card, header or strip lies on B's ribbon (its result)
  {at: [0.75, 0.8, 0.9, 1], fn: 's.ribbonCovered === 0', label: 'nothing covers B’s ribbon to its rack row'},
  {at: [1], fn: 's.rowLabelWhole && s.rowLabelFits', label: 'the row label prints whole words and fits its plate (never cut or spilling)'},
  {at: [0.5, 1], fn: 's.keyWordOnDesk', label: 'each desk page holds the supplied key word on its key line (the lens shows the word itself)'},
  // Round 5 (item 12): the laid-down magnifier rests clear of the article frame and its rail
  {at: [0.8, 0.9, 1], fn: 's.parkedClear', label: 'B’s parked magnifier rests in free desk space'},
  {at: [0.5, 1], fn: 's.keyInsideLensA', label: 'the raised key word lies inside A’s lens glass (never clipped at the rim)'},
  {at: [0.8, 1], fn: 's.ribbonHits === 0', label: 'B’s ribbon to the slot crosses no rack caption, other row or other book'},
  {at: [1], fn: 's.guideNoteClear', label: 'the comparison guide label and the neutral note never overlap'},
]);

// Round 2/3 (item 17): supplied content — the shared strip (article, ordering,
// sources), the reading cards and the key line on each desk — is ≥ 16 px at
// 1080p and never smaller than the lane headers or the guide label.
const SIZES = `(() => {
  const scale = el => { const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM()); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); };
  const px = t => parseFloat(getComputedStyle(t).fontSize) * scale(t);
  const texts = sel => [...svg.querySelectorAll(sel)].filter(t => visible(t) && (t.textContent || '').trim() && !(t.textContent || '').includes('\\u200B'));
  const content = texts('[data-node="strip"] text, [data-node="cardA"] text, [data-node="cardB"] text, [data-node="noteW"] text, [data-node="A"] text, [data-node="B"] text');
  const heads = texts('[data-node="hdrA"] text, [data-node="hdrB"] text, [data-node="guideChipW"] text').filter(t => t.textContent.trim().length > 1);
  const cmin = Math.min(...content.map(px));
  const hmax = heads.length ? Math.max(...heads.map(px)) : 0;
  return content.length > 0 && cmin >= 16 && cmin >= hmax - 0.5;
})()`;
ratioChecks('LAW-0123', 'content text ≥ 16 px and never smaller than headers', [
  {at: [0.1, 1], dom: SIZES, tv: ['all'], label: 'content ≥ 16 px at 1080p, not smaller than headers or the guide label'},
]);
