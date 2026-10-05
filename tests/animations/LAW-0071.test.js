// LAW-0071 — Comprobación de jurisdicción · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated fact changes (the jurisdiction
// the same document declares) and no legal consequence is invented to complete the contrast.
import {contractSuite} from '../harness/contract.js';

// long names, headers and captions (round-4 review: truncated declarations and headers)
const LONG = {"jurisdictions": [{"key": "j1", "name": "Northvale-upon-Eastmere"}, {"key": "j2", "name": "Eastmere Coastal Province"}, {"key": "j3", "name": "Southholm Federal District"}], "scenarioA": {"label": "Declares the jurisdiction marked on the card", "caption": "The framework agreement declares Northvale-upon-Eastmere, the jurisdiction on the card"}, "scenarioB": {"label": "Declares a jurisdiction other than the card", "caption": "The very same framework agreement declares Eastmere Coastal Province instead"}, "sources": [{"id": "SUPPLY-2026-01", "title": "Framework supply agreement with annexes and schedules", "declares": "j1"}, {"id": "SUPPLY-2026-02", "title": "Logistics services contract", "declares": "j2"}, {"id": "SUPPLY-2026-03", "title": "Warehouse lease and annexes", "declares": "j1"}]};

contractSuite('LAW-0071', {
  continuity: ['aDoc', 'bDoc', 'aSeal', 'bSeal'],
  attach: [
    // B's document rides the trapdoor while it starts to drop (its foot stays on the board)
    {from: 0.576, to: 0.614, a: 'bFoot', b: 'bTrapPoint', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.a.holder === 'library' && s.b.holder === 'library' && s.a.printed === 0 && s.b.printed === 0 && JSON.stringify(s.aDoc) === JSON.stringify(s.bDoc)", label: 'identical base: same document in both libraries, declaration not shown yet'},
    {at: 0.36, fn: "s.a.printed === 1 && s.b.printed === 1 && s.declared.a !== s.declared.b && JSON.stringify(s.aDoc) === JSON.stringify(s.bDoc)", label: 'the change beat introduces different declarations, nothing else moves'},
    {at: 0.53, fn: "s.a.holder === 'gate' && s.b.holder === 'gate' && JSON.stringify(s.aDoc) === JSON.stringify(s.bDoc)", label: 'both documents reach the gate in parallel along the same path'},
    {at: 0.64, fn: "s.a.flap < -30 && s.b.flap === 0 && s.b.trap > 0", label: 'only A opens the flap; B keeps it down and the trapdoor drops'},
    {at: 1, fn: "s.a.holder === 'landing' && s.b.holder === 'bin' && s.a.written === 1 && s.b.written === 0", label: 'A ends on the landing with its reference on the card; B ends in the bin, card unchanged'},
    {at: 1, fn: "s.declared.a === s.relevantKey && s.declared.b !== s.relevantKey && s.sameDocument", label: 'the only changed fact is the declared jurisdiction'},
    {at: 1, fn: 's.guideProgress === 1', label: 'the comparison guide joins the two declarations at the end'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.pinned === 1 && s.b.pinned === 0 && s.pinSize.h >= 40', label: 'with every label hidden A\'s card still differs: a thumbnail of the listed document is pinned to it, B\'s card keeps the empty place'},
    {at: 0.3, fn: 's.a.pinned === 0 && s.b.pinned === 0', label: 'both cards start identical (nothing pinned before the reference is written)'},
    {at: 1, params: {declaredB: 'j1'}, fn: "s.b.holder === 'landing' && s.b.written === 1", label: 'if B declares the card jurisdiction too, B follows the same route (no invented difference)'},
    {at: 0.5, fn: 's.headersWhole && s.declarationsWhole', label: 'headers, captions and the declared names are shown whole'},
    {at: 0.5, params: LONG, fn: 's.headersWhole && s.declarationsWhole', label: 'long labels: headers, captions and the declared names are shown whole (no ellipsis, no mid-word break)'},
  ],
});
