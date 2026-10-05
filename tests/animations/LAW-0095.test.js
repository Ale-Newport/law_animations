// LAW-0095 — Regla y excepción · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (and
// only from its beat on), and no legal consequence is invented to complete the
// contrast (each board follows the route SUPPLIED for it; no winner, no score).
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0095', {
  continuity: ['cartA', 'cartB', 'lensA', 'lensB'],
  semantic: [
    {at: 0.1, fn: "s.identicalBase && s.visibleDiff.length === 0 && s.a.marker === 'none' && s.b.marker === 'none'", label: 'base: two complete, identical boards (same geometry, nothing differs yet)'},
    {at: 0.2, fn: 's.visibleDiff.length === 0', label: 'the difference is not shown before its beat'},
    {at: 0.35, fn: "s.b.marker === 'present' && s.a.marker === 'none' && s.b.changedRow === 1 && s.a.changedRow === 0 && JSON.stringify(s.visibleDiff) === JSON.stringify(['marker', 'changedRow']) && s.a.blade === 0 && s.b.blade === 0", label: 'change: only the stamped marker and the changed fact differ; nothing is switched yet'},
    {at: 0.29, fn: 's.stampShown && s.stampB !== null', label: 'the change is made by a visible stamp in B'},
    {at: 0.5, fn: 's.a.lensOnSlot && s.b.lensOnSlot', label: 'parallel: both magnifiers examine the card at the same moment'},
    {at: 0.595, fn: 's.b.blade > 0.5 && s.b.gate > 0.5 && s.a.blade === 0 && s.a.gate === 0 && s.a.atStopLine && s.b.atStopLine', label: 'in B the separate branch opens before either wagon moves; A is never switched'},
    {at: 1, fn: "s.a.route === 'main' && !s.a.onBranch && s.a.cartDist > s.a.switchDist && s.b.onBranch && s.guideProgress === 1 && s.identicalBase", label: 'final: A along the main route, B on the separate branch (as supplied), guide drawn'},
    {at: 1, fn: "s.visibleDiff.every(k => ['marker', 'changedRow', 'blade', 'socketLit', 'pulsing', 'litMain', 'litBranch', 'cart'].includes(k))", label: 'only the changed fact and its supplied consequences on the board differ'},
    {at: 1, params: {routeB: 'held-disputed'}, fn: "s.b.marker === 'disputed' && s.b.atStopLine && s.b.blade === 0 && s.b.pulsing === 0 && s.b.socketLit === 1 && s.a.route === 'main'", label: 'disputed B: half marker, socket answers, no pulse, the wagon is held (no outcome invented)'},
    {at: 1, params: {routeA: 'branch-as-supplied', routeB: 'branch-as-supplied'}, fn: "s.a.onBranch && s.b.onBranch && s.a.marker === 'none'", label: 'routes come only from the supplied data (A may be supplied on the branch too)'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.b.marker === 'present' && s.b.onBranch && !s.a.onBranch", label: 'labels hidden: the same physical difference reads'},
  ],
});
