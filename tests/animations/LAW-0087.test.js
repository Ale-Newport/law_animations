// LAW-0087 — Analogía de casos · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact is modified
// (the new case's value of `changedFact.feature`), and no legal consequence is
// invented to complete the contrast (no winner, score or outcome).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0087', {
  // the supplied rule quotes end in a literal “…” (author text, not a cut)
  allowTruncation: ['Where an item is lent', 'Cuando se presta'],
  continuity: ['sheetBA', 'sheetBB'],
  semantic: [
    {at: 0, fn: "s.scenes === 2 && s.flapsCover && s.labelsShown === 0 && s.slideA === 0 && s.slideB === 0 && s.badgesA === 0 && s.badgesB === 0", label: 'base: two identical boards, the changed slot is covered by a flap in both, nothing slides yet'},
    {at: 0.16, fn: 's.flapsCover && s.labelsShown === 0', label: 'the difference is not visible before the change beat'},
    {at: 0.36, fn: "s.flapLift === 1 && s.labelsShown === 1 && s.slideA === 0 && s.slideB === 0", label: 'change: the flaps are up and the scenario labels shown before the parallel action'},
    {at: 0.5, fn: 's.slideA > 0 && s.slideA < 1 && s.slideA === s.slideB && s.sheetBA.y === s.sheetBB.y', label: 'action: both new-case sheets slide in parallel with identical timing'},
    {at: 0.78, fn: "s.landed && s.changedA === 'shared' && s.changedB === 'differs' && s.mergeA.length === s.kindsA.filter(k => k === 'shared').length && s.mergeB.length === s.kindsB.filter(k => k === 'shared').length", label: 'the changed print coincides in scene A and stands beside the earlier print in scene B'},
    {at: 0.78, fn: "JSON.stringify(s.differsAt) === JSON.stringify([s.changedFeature]) && s.changedFeature === 2", label: 'exactly the indicated feature differs between the scenes; every other kind is identical'},
    {at: 1, fn: 's.guide === 1 && s.rings === 1 && s.guideEnds.every((e, i) => Math.hypot(e.x - s.ringEdges[i].x, e.y - s.ringEdges[i].y) < 1)', label: 'guide: the comparison guide is drawn and both of its ends land on the changed slot rings'},
    {at: 1, fn: 's.outcome === null && s.winner === null && s.notesDropped.length === 0', label: 'no winner, score or outcome; every supplied note is placed'},
    {at: 1, params: {changedFact: {feature: 0, valueB: 'Ladder borrowed from a shop', iconB: null}}, fn: "JSON.stringify(s.differsAt) === JSON.stringify([0]) && s.changedA === 'shared' && s.changedB === 'differs'", label: 'the changed feature is configurable'},
    {at: 1, params: {changedFact: {feature: 3, valueB: '', iconB: null}}, fn: "JSON.stringify(s.differsAt) === JSON.stringify([3]) && s.changedB === 'only-a'", label: 'an emptied value in scene B leaves the feature in the earlier case only'},
    {at: 1, fn: 's.changedAtRowEnd', label: 'the changed slot ends its row, so the guide leaves its ring without passing over another print'},
    {at: 1, params: {changedFact: {feature: 0, valueB: 'Ladder borrowed from a shop', iconB: null}}, fn: 's.changedAtRowEnd && s.guideEnds.every((e, i) => Math.hypot(e.x - s.ringEdges[i].x, e.y - s.ringEdges[i].y) < 1)', label: 'another changed feature: still at its row end, guide ends on both rings'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.landed && s.changedA === 'shared' && s.changedB === 'differs' && s.flapLift === 1", label: 'labels hidden: the same physical contrast plays'},
  ],
});
