// LAW-0080 — Trazabilidad de una cita · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is local (only the
// hook of the chain moves), and seeking back restores the previous datum exactly.
// Windows (u): chain1 0.03–0.10, chain2 0.08–0.16, lens open 0.22–0.38, strike 0.47–0.53,
// move (in the lens) 0.50–0.62, lens close 0.76–0.86, context update 0.845–0.90, marker 0.90–0.96.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0080', {
  continuity: ['contextHook', 'clasp'],
  attach: [
    // the chain's clasp stays on the (moving) hook once laid
    {from: 0.17, to: 1, a: 'clasp', b: 'contextHook', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextValue === '3'", label: 'build: context shows the before datum'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.lensValue === '3'", label: 'isolate: lens open on the unchanged detail'},
    {at: 0.4, fn: 's.sourceContainsHooks && s.lensZoom >= 1.4', label: 'the lens source contains the old and the new hook (same coordinates as the context)'},
    {at: 0.56, fn: "s.datum === 'changing' && s.contextValue === '3' && JSON.stringify(s.contextHook) === JSON.stringify(s.beforeHook)", label: 'substitution happens inside the lens only'},
    {at: 0.7, fn: "s.lensValue === '2' && s.contextValue === '3'", label: 'lens shows the new datum; the context is still unchanged'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextValue === '2' && JSON.stringify(s.contextHook) === JSON.stringify(s.afterHook) && s.chainOnHook", label: 'returns to the context with the chain on the new entry'},
    {at: 1, fn: 's.otherHookStill', label: 'the change is local: the other chain end does not move'},
    {at: 0.3, fn: "s.contextValue === '3' && s.datum === 'before' && JSON.stringify(s.contextHook) === JSON.stringify(s.beforeHook)", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusTarget: 'pinpoint', beforeValue: 'p. 88', afterValue: 'p. 89'}, fn: "s.contextValue === 'p. 89' && s.otherHookStill && s.chainOnHook && JSON.stringify(s.contextHook) === JSON.stringify(s.afterHook)", label: 'pinpoint target: the first chain now ends on the facing page, the second is untouched'},
    {at: 0.4, params: {focusTarget: 'pinpoint', beforeValue: 'p. 88', afterValue: 'p. 89'}, fn: 's.sourceContainsHooks', label: 'pinpoint target: the lens source contains both page passages'},
    {at: 1, params: {beforeValue: '2', afterValue: '2'}, fn: "s.contextValue === '2' && JSON.stringify(s.afterHook) !== JSON.stringify(s.beforeHook)", label: 'an identical after value still points to a distinct entry (never a no-op hook)'},
  ],
});
