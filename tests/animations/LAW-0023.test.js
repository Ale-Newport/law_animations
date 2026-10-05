// LAW-0023 — Anexo incorporado · contrast. Contract battery + ID-specific checks.
// Acceptance (brief): both scenes exist, exactly the indicated fact changes, and
// no legal consequence is invented to complete the contrast.
import {contractSuite} from '../harness/contract.js';

const SAME_BASE = "s.a.holder === s.b.holder && s.a.write === s.b.write && s.a.seal === s.b.seal";

contractSuite('LAW-0023', {
  continuity: ['annexA', 'annexB', 'penA', 'penB', 'handA', 'handB', 'stampA', 'stampB'],
  semantic: [
    {at: 0.1, fn: `${SAME_BASE} && s.a.holder === 'folder' && s.marks === 0 && JSON.stringify(s.annexA) === JSON.stringify(s.annexB)`, label: 'identical base situation in both scenes, no difference shown yet'},
    {at: 0.25, fn: "s.marks > 0.5 && s.a.holder === s.b.holder && s.a.link === 0 && s.b.link === 0", label: 'the change is introduced as a localized target mark before the action'},
    {at: 0.4, fn: `${SAME_BASE} && JSON.stringify(s.annexA) === JSON.stringify(s.annexB)`, label: 'the carry runs identically in parallel until the annex is released'},
    {at: 0.56, fn: "s.a.write === s.b.write && s.a.write > 0 && s.a.holder === 'docked' && s.b.holder === 'separate'", label: 'the same reference is written in both; only the placement differs'},
    {at: 0.6, fn: 's.a.link > 0 && s.b.link === 0', label: 'only A draws the link loop to the tab'},
    {at: 1, fn: "s.a.holder === 'docked' && s.b.holder === 'separate' && s.a.link === 1 && s.b.link === 0 && s.a.write === 1 && s.b.write === 1 && s.a.seal && s.b.seal && s.a.acrossSeam && !s.b.acrossSeam", label: 'final: both scenes complete; exactly the join (dock + link, hence seal position) differs'},
    {at: 1, fn: 's.guideProgress === 1', label: 'comparison guide drawn at the end'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.a.holder === 'docked' && s.b.holder === 'separate' && s.guideProgress === 1", label: 'labels hidden: the contrast still reads from geometry'},
  ],
});
