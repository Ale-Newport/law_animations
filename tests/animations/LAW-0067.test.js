// LAW-0067 — Extracción de hechos · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (the typed
// request: stated on the page in A, not in B) and no legal consequence is invented —
// the difference shows as a different object (copy strip vs written note), relation
// (one ¶ vs a two-sentence basis) and sequence (peel+carry vs hop+write).
import {contractSuite} from '../harness/contract.js';

const same = (a, b) => `Math.hypot(s.${a}.x - s.${b}.x, s.${a}.y - s.${b}.y) < 0.01`;

contractSuite('LAW-0067', {
  continuity: ['aFlag', 'bFlag', 'aStrip', 'aPen', 'bPen'],
  attach: [{from: 0.55, to: 1, a: 'aFlag', b: 'aStrip', tol: 0.5}],
  semantic: [
    {at: 0.1, fn: `s.beat === 'base' && s.a.holder === 'search' && s.b.holder === 'search' && s.typed === 0 && ${same('aFlagLocal', 'bFlagLocal')}`, label: 'base: two identical scenes, nothing typed yet'},
    {at: 0.36, fn: "s.typed === 1 && s.a.holder === 'search' && s.b.holder === 'search' && s.a.mode === 'documented' && s.b.mode === 'inference'", label: 'the change is introduced by typing the request, before any action'},
    {at: 0.545, fn: `s.a.holder === 'page' && s.b.holder === 'page' && ${same('aFlagLocal', 'bFlagLocal')} && s.a.marks[0] === 1 && s.b.marks[0] === 1`, label: 'parallel: both flags mark ¶2 at the same place and time'},
    {at: 0.64, fn: "s.a.holder === 'carrying' && s.a.copiedFromPage && s.bStrip === null && !s.b.copiedFromPage && s.b.holder !== 'carrying'", label: 'A pulls a copy strip; B copies nothing from the page'},
    {at: 0.64, fn: 's.b.marks.length === 2 && s.b.marks[1] === 1', label: 'B flags a two-sentence basis (¶2 and ¶3)'},
    {at: 0.73, fn: "s.a.entry === 'strip' && s.b.entry === 'writing' && Math.hypot(s.bPen.x - s.bFlag.x, s.bPen.y - s.bFlag.y) < 800", label: 'B: the pen writes the note on the card while A is already filed'},
    {at: 1, fn: "s.a.entry === 'strip' && s.b.entry === 'note' && JSON.stringify(s.a.pinpoints) === '[2]' && JSON.stringify(s.b.pinpoints) === '[2,3]' && s.a.holder === 'card' && s.b.holder === 'card'", label: 'final: quoted strip (¶2) vs annotated note (¶2+¶3), both on the card'},
    {at: 1, fn: "s.guideProgress === 1 && s.changedDetail === 'request' && s.allReached", label: 'the guide links the changed detail (the requests)'},
    {at: 0.3, fn: 's.guideProgress === 0', label: 'no guide or outcome before the end'},
    {at: 1, fn: 's.guideCaptionOnGuide && s.pageSize >= 25', label: 'the guide carries its own caption; the changed fact keeps its priority size'},
    {at: 0.64, fn: 's.aStrip !== null && s.aCopyShown === 0', label: 'A\'s copy travels rolled up beside the page (it never lies over the page text)'},
    {at: 1, fn: 's.aCopyShown === 1 && s.bCopyShown === null', label: 'A\'s copy is unrolled flat in its slot; B has no copy'},
    {at: 1, params: {query: {a: {label: 'When the goods were collected', mode: 'documented', sentence: 2, basis: [2], note: ''}, b: {label: 'Who signed the delivery note', mode: 'documented', sentence: 3, basis: [3], note: ''}}}, fn: "s.a.entry === 'strip' && s.b.entry === 'strip' && JSON.stringify(s.b.pinpoints) === '[3]'", label: 'modes are supplied: two documented requests both file copies'},
  ],
});
