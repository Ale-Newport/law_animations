// LAW-0055 — Tratamiento de un caso · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes, and no
// legal consequence is invented (the scenes only differ in the contrasted
// resolution's label/presence and its link; everything else runs identically).
import {contractSuite} from '../harness/contract.js';

const tracks = ['aMag', 'bMag'];
for (let i = 0; i < 5; i++) tracks.push(`aRes${i}`, `bRes${i}`, `aTag${i}`, `bTag${i}`);

contractSuite('LAW-0055', {
  continuity: tracks,
  semantic: [
    {at: 0.1, fn: "s.a.states.every(x => x === 'shelf') && JSON.stringify(s.a.states) === JSON.stringify(s.b.states) && s.tagVisB === 1 && !s.changeMarked", label: 'identical base situation before the change beat'},
    {at: 0.25, fn: 's.bChange > 0 && s.bChange < 1 && s.changeMarked && s.bPop === 1', label: "the change is introduced locally on B's binder (pulled forward, its tag untied) during the change beat"},
    {at: 0.1, fn: 's.bCaption === 0', label: "B's specific caption is not shown before the change beat (state not shown too early)"},
    {at: 0.38, fn: 's.bCaption === 1 && s.bPop === 0', label: "B's caption is in place after the change beat and the binder is back on its shelf"},
    {at: 0.38, fn: 's.tagVisB === 0 && s.a.typed === s.b.typed', label: 'after the change beat B has no label for the contrasted resolution; queries typed identically'},
    {at: 0.55, fn: 'JSON.stringify(s.aRes0) === JSON.stringify(s.bRes0) && JSON.stringify(s.aMag) === JSON.stringify(s.bMag) && s.a.states[0] === s.b.states[0]', label: 'the action runs in parallel with identical timing'},
    {at: 1, fn: "s.a.linked === 3 && s.b.linked === 2 && s.a.states[1] === 'linked' && s.b.states[1] === 'placed' && s.a.states[0] === s.b.states[0] && s.a.states[2] === s.b.states[2]", label: 'exactly the indicated fact differs: R-33 is linked in A, placed but not linked in B'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 1, params: {alternative: {kind: 'extra-source', index: 0, extra: {citation: 'R-58', date: 'Year 6', label: 'Mentions'}}}, fn: "s.a.linked === 3 && s.b.linked === 4 && s.a.states[3] === 'absent' && s.b.states[3] === 'linked' && s.changedIndex === 3", label: 'extra-source: A never holds the additional resolution; only B finds and links it'},
    {at: 0.1, params: {alternative: {kind: 'extra-source', index: 0, extra: {citation: 'R-58', date: 'Year 6', label: 'Mentions'}}}, fn: "s.a.states[3] === 'absent' && s.b.states[3] === 'absent'", label: 'extra-source: neither library holds the extra resolution before the change beat'},
    {at: 0.1, params: {alternative: {kind: 'extra-source', index: 0, extra: {citation: 'R-58', date: 'Year 6', label: 'Mentions'}}}, fn: 's.tagVisB === 0 && s.aTagVis3 === 0 && s.bTagVis3 === 0 && s.aTagVis0 === 1', label: 'extra-source: neither scene shows the extra label before the change beat (state not shown too early)'},
    {at: 1, params: {alternative: {kind: 'extra-source', index: 0, extra: {citation: 'R-58', date: 'Year 6', label: 'Mentions'}}}, fn: 's.aTagVis3 === 0 && s.bTagVis3 === 1', label: 'extra-source: the extra label exists only in B'},
  ],
});
