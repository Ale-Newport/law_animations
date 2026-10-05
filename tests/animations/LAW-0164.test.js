// LAW-0164 — Entrevista a cliente · inspect. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: the detail keeps its source coordinates (the
// lens copy is drawn at the board's coordinates and grows out of / returns onto the
// source), the change is localised (one note value and its dependent strip mark), and
// seeking back restores exactly the previous datum.
// Windows (LAW-0164.js W): lens opens 0.18–0.34; in the lens strike 0.37–0.42, new
// value 0.44–0.52, ring 0.52–0.59; lens closes 0.64–0.72 and, overlapping the close,
// the context update runs: strike 0.68–0.71, new value 0.70–0.74, pen ring 0.70–0.75,
// marker + its label 0.74–0.78, pen back 0.75–0.80. Main action complete by 0.80.
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

// Rendered check: no two VISIBLE copies of the same text overlap on screen (text covered by the opaque lens
// card is hidden). Effective opacity is the product
// of the computed opacity up the tree (> 0.05 counts as visible); boxes are cut to the clip of any clip-path
// ancestor (the lens window); the lens copy's zero-width marks are ignored so copy and source compare equal.
const NO_DOUBLE = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const clipOf = el => { let b = null; for (let e = el; e && e !== svg; e = e.parentElement) { const c = e.getAttribute && e.getAttribute('clip-path'); if (!c) continue; const m = c.match(/#([^)'"]+)/); const cp = m && svg.querySelector('#' + CSS.escape(m[1])); const sh = cp && cp.querySelector('rect'); if (!sh) continue; const r = clipRect(e, sh); b = b ? cut(b, r) : r; } return b; };
  // a clipPath's rect is in the user space of the element that references it (rects inside <clipPath> have no layout box)
  const clipRect = (user, rc) => { const m = user.getScreenCTM(); const a = ['x', 'y', 'width', 'height'].map(k => parseFloat(rc.getAttribute(k)) || 0); const pts = [[a[0], a[1]], [a[0] + a[2], a[1] + a[3]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m)); return {left: Math.min(pts[0].x, pts[1].x), top: Math.min(pts[0].y, pts[1].y), right: Math.max(pts[0].x, pts[1].x), bottom: Math.max(pts[0].y, pts[1].y)}; };
  const cut = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const items = [];
  for (const t of svg.querySelectorAll('text')) {
    const txt = (t.textContent || '').replace(/\\u200B/g, '').replace(/\\s+/g, ' ').trim();
    if (!txt || eff(t) <= 0.05) continue;
    const r0 = t.getBoundingClientRect(); let r = {left: r0.left, top: r0.top, right: r0.right, bottom: r0.bottom};
    const c = clipOf(t); if (c) r = cut(r, c);
    if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
    items.push({txt, r, el: t});
  }
  // an OPAQUE lens card hides the context text beneath it: an overlap lying inside it is not a double image
  const bg = svg.querySelector('[data-node="lens-bg"]');
  const occ = bg && eff(bg) >= 0.99 ? bg.getBoundingClientRect() : null;
  const inWin = t => Boolean(t.closest('[data-node="lens-win"]'));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.txt !== b.txt) continue;
    const x = cut(a.r, b.r);
    if (!(x.right - x.left > 2 && x.bottom - x.top > 2)) continue;
    const hidden = occ && inWin(a.el) !== inWin(b.el) && x.left >= occ.left && x.right <= occ.right && x.top >= occ.top && x.bottom <= occ.bottom;
    if (!hidden) return false;
  }
  return true;
})()`;
const dense = (a, b, step) => Array.from({length: Math.round((b - a) / step) + 1}, (_, i) => Math.round((a + i * step) * 1000) / 1000);

contractSuite('LAW-0164', {
  // the lens window is an opaque enlarged copy over the dimmed context; only the copy's texts carry a
  // zero-width mark, so no other label pair is exempted from the overlap heuristic
  allowTextOverlap: ['\u200B'],
  continuity: ['pen', 'handB', 'gripB', 'handA'],
  continuityLimit: 45,
  attach: [
    {from: 0, to: 1, a: 'gripB', b: 'boardGrip', tol: 1.5},
    // while the ring is redrawn in context the solved pen nib is on the ring's path
    {from: 0, to: 1, a: 'pen', b: 'tickTarget', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.lensCopyMatches && s.context.ring === 0 && s.markerShown === 0", label: 'context: the state produced by the exchange; the lens copy uses the board coordinates'},
    {at: 0.3, fn: "s.lensOpen > 0 && s.lensOpen < 1 && s.datum === 'before'", label: 'isolate: the lens grows out of the note line (nothing changed yet)'},
    {at: 0.36, fn: "s.lensOpen === 1 && s.datum === 'before' && s.lens.strike === 0", label: 'lens fully open on the unchanged datum'},
    {at: 0.47, fn: "s.datum === 'changing' && s.lens.strike === 1 && s.lens.old >= 0.5 && s.contextDatum === 'before' && s.context.strike === 0", label: 'substitution inside the lens only; the old value stays readable (traceable)'},
    {at: 0.62, fn: "s.datum === 'after' && s.lens.ring === 1 && s.lens.ghost < 0.5 && s.lensOpen === 1 && s.contextDatum === 'before'", label: 'only the dependent geometry changes: loop → faint ghost, ring on the supplied day; held open ≥ 300 ms'},
    // review fix (item 19): the context update starts while the lens is still closing, not after it
    {at: 0.69, fn: "s.lensOpen > 0 && s.lensOpen < 0.5 && s.contextDatum === 'changing'", label: 'the context update overlaps the lens close'},
    // round-2 fix: the enlarged copy is visible only while its window is clear of the source (blank card otherwise)
    {at: 0.62, fn: 's.lensCopyVisible === 1', label: 'the copy is fully shown while the lens is open'},
    {at: 0.69, fn: 's.lensOpen > 0 && s.lensCopyVisible === 0', label: 'the copy has faded out before the closing window reaches the source'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.context.ring === 1 && s.markerShown === 1 && s.markNoteShown === 1 && s.mainActionEnd <= 0.8 && s.tickTarget === null", label: 'main action complete by u = 0.8 (the rest is the hold)'},
    {at: 0.95, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.markerShown === 1 && s.oldTraceable", label: 'return: context updated with the Δ marker; the old value is still traceable'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextDatum === 'after' && s.context.ring === 1 && s.markerShown === 1 && s.oldTraceable && s.allReached && s.labelsFit", label: 'hold: changed datum marked, everything reachable, labels fit'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.context.ring === 0 && s.lens.ring === 0 && s.markerShown === 0", label: 'seeking back (after the end) restores the old datum and geometry exactly'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.contextDatum === 'after' && s.markerShown === 1 && s.context.ring === 1", label: 'labels hidden: the same localised change is visible'},
    {at: 1, params: {detailGeometry: {zoom: 2, placement: 'auto', days: 5, beforeSpan: {from: 2, to: 4}, afterSpan: {from: 2, to: 4}}}, fn: 's.spans.before.from === s.spans.after.from && s.spans.before.to === s.spans.after.to', label: 'the dependent geometry is the SUPPLIED span, never inferred from the wording'},
  ],
});

suppliedTextSuite('LAW-0164', {
  fields: `const role = (id, i) => (p.roles[id] || p.actors[i].role);
    return [p.actors[0].name, p.actors[1].name, role('client', 0), role('interviewer', 1), p.props.account, p.props.question,
      p.props.detailLabel, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker]`,
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión'] : ['As supplied · no conclusion drawn']`,
});

ratioChecks('LAW-0164', 'layout fits; every IK target reached; the pen hand never overlaps a face', [
  {at: [1], fn: 's.labelsFit && s.lensCopyMatches', label: 'labels fit; lens is a uniform real copy'},
  // same face-clearance floor as LAW-0161 (58 person units) for the pen hand, its forearm and the board-holding hand
  {at: [0, 0.4, 0.64, 0.66, 0.68, 0.7, 0.72, 0.74, 0.76, 0.78, 0.8, 0.9, 1], fn: 's.allReached && s.handFaceB >= 58 && s.forearmFaceB >= 58 && s.gripFaceB >= 58 && s.handAOffBoard', label: 'pen reaches the ring; hands and forearm clear of faces and of the note line'},
  // review fix: the account tail ends just in front of the client's mouth, never on her face
  {at: [0.1, 1], fn: 's.tailClear', label: 'the speech tail ends in front of the mouth, off the face'},
  // review fix: the changed-datum label sits directly under the changed value on the board (≤ 24 px gap)
  {at: [1], fn: 's.markNoteGap !== null && s.markNoteGap <= 24 && s.markNoteShown === 1', label: 'the changed-datum label is next to the changed value', tv: ['all']},
  // round-2 fix: never a double image while the lens opens or closes over the source
  {at: [...dense(0.16, 0.38, 0.01), ...dense(0.6, 0.8, 0.005)], dom: NO_DOUBLE, label: 'no two visible copies of the same text overlap (lens open / close)', tv: ['all']},
  // round-2 fix: the new value fades in whole: it is never cut by a clip (no glyph slivers)
  {at: [0.71, 0.72], dom: "[...svg.querySelectorAll('[data-node=\"cs-new\"]')].every(e => !e.closest('[clip-path]'))", label: 'the new value in context is never clipped into slivers'},
  // round-2 fix: the key is anchored to the board: against its outline (≤ 40 px) or on the table's front panel
  // directly under it — never floating detached in the margin
  {at: [1], fn: 's.keyAnchored === true && s.keyGap !== null', label: 'the key is anchored to the board', tv: ['all']},
]);
