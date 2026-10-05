// LAW-0051 — Historial de una norma · contrast. Contract battery + ID-specific checks.
// Acceptance (brief): both scenes exist, exactly the indicated fact changes, and no
// legal consequence is invented to complete the contrast.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0051', {
  continuity: ['cardA', 'cardB', 'handA', 'handB'],
  attach: [
    {from: 0.451, to: 0.639, a: 'handA', b: 'cardGripA', tol: 1.5},
    {from: 0.451, to: 0.639, a: 'handB', b: 'cardGripB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "JSON.stringify(s.a) === JSON.stringify(s.b) && s.dateTyped === 0", label: 'identical base situation (no date typed yet)'},
    {at: 0.3, fn: "s.dateTyped > 0 && JSON.stringify(s.a) === JSON.stringify(s.b)", label: 'the date is typed; everything else is still identical'},
    {at: 0.56, fn: "s.a.holder === 'R-sliding' && s.b.holder === 'R-sliding' && s.a.selected === null && s.b.selected === null && s.a.fan === s.b.fan", label: 'the same gesture runs in parallel'},
    {at: 1, fn: "s.a.selected === 1 && s.b.selected === 2 && JSON.stringify(s.a.later) === '[2]' && JSON.stringify(s.b.later) === '[]'", label: 'only the marked layer (and so the ghosting) differs'},
    {at: 1, fn: "s.a.card.x === s.b.card.x && s.a.card.y < s.b.card.y", label: 'the changed date moves the card to a different place on the same rail'},
    {at: 1, fn: "s.guideProgress === 1", label: 'comparison guide drawn at the end'},
    {at: 1, params: {alternative: {date: '1 Feb 2020', selectedVersion: 1}}, fn: "s.a.selected === 1 && s.b.selected === 1 && JSON.stringify(s.a.later) === JSON.stringify(s.b.later)", label: 'the marked layer comes from the supplied value, never computed from the date'},
  ],
});
