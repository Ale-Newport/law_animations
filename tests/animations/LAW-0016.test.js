// LAW-0016 — Redacción comparada · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates, the change is
// localized, and seeking back restores exactly the previous datum.
import {contractSuite} from '../harness/contract.js';

const inView = 's.viewport.x <= s.focusSource.x && s.viewport.y <= s.focusSource.y && s.viewport.x + s.viewport.w >= s.focusSource.x + s.focusSource.w && s.viewport.y + s.viewport.h >= s.focusSource.y + s.focusSource.h';

contractSuite('LAW-0016', {
  continuity: ['linkEnd', 'focusOnScreen', 'viewport'],
  semantic: [
    {at: 0.1, fn: "s.zoom === 1 && s.datum === 'before' && s.shownValue === 'digital' && !s.minimapVisible", label: 'context first: whole desk, previous datum'},
    {at: 0.42, fn: `s.zoom >= 1.25 && s.zoomProgress === 1 && s.minimapVisible && s.datum === 'before' && ${inView}`, label: 'real enlargement of the focused pair, context kept in the minimap'},
    {at: 0.42, fn: 'Math.abs(s.focusOnScreen.x - s.screenTarget.x) < 0.5 && Math.abs(s.focusOnScreen.y - s.screenTarget.y) < 0.5', label: 'the detail is the same geometry mapped by the camera (source coordinates preserved)'},
    {at: 0.58, fn: "s.datum === 'changing' && s.linkState === 'linked' && s.otherLinks === 2 && s.otherLinksDrawn === 1", label: 'only the focused datum changes; the other links stay as they were'},
    {at: 0.7, fn: "s.datum === 'after' && s.shownValue === 'online' && s.linkState === 'linked'", label: 'new datum in place; its link re-anchored'},
    {at: 1, fn: "s.zoom === 1 && s.markerVisible && !s.minimapVisible && s.datum === 'after'", label: 'returns to the context with a changed-datum marker'},
    {at: 0.3, fn: "s.datum === 'before' && s.shownValue === 'digital' && !s.markerVisible", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: {focusEdit: 1, beforeValue: 'branch', afterValue: 'main'}, fn: "s.linkState === 'unlinked' && s.focusEdit === 1 && s.otherLinks === 2", label: 'when the new words equal the original, that link retracts (dependent state)'},
    {at: 0.45, params: {focusEdit: 1, beforeValue: 'branch', afterValue: 'main'}, fn: "s.linkState === 'linked'", label: '…and seeking back before the swap shows it linked again'},
    {at: 1, params: {focusTarget: 'original', beforeValue: 'printed', afterValue: 'glossy'}, fn: "s.focusTarget === 'original' && s.shownValue === 'glossy' && s.linkState === 'linked'", label: 'the datum can be on the original sheet instead'},
  ],
});
