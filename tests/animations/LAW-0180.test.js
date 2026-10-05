// LAW-0180 — Representación de una parte · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second
// pose of the same stage at the same coordinates), the change is localized (only the link
// that depends on the capacity datum, or only the form title) and seeking back restores the
// previous datum exactly.
// Windows (review round 2 rework — the inspect returns to the full context):
//   labels leave 0.10–0.14; camera pulls back 0.13–0.22; lens opens 0.22–0.35; text in the lens
//   0.34–0.37; old value lifts 0.41–0.46; "before" note 0.44–0.49; new value 0.48–0.53; the ribbon
//   winds in inside the lens 0.46–0.58; lens text leaves 0.59–0.61; lens closes 0.61–0.66; camera
//   returns to full size 0.66–0.73; labels return 0.72–0.75; the context winds in 0.74–0.80;
//   marker + note block 0.77–0.82; hold.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const P = name => presetsFor('LAW-0180').find(q => q.name === name).params;
const DOC = P('contrast-or-alternative');

contractSuite('LAW-0180', {
  continuity: ['lensClip', 'contextClip'],
  continuityLimit: 60,
  attach: [
    // before the substitution the clip is fastened to the badge ring, in context and in the lens copy
    {from: 0, to: 0.46, a: 'lensClip', b: 'badge', tol: 1.5},
    {from: 0, to: 0.74, a: 'contextClip', b: 'badge', tol: 1.5},
    // after it the reel has wound the ribbon in
    {from: 0.58, to: 1, a: 'lensClip', b: 'reel', tol: 1.5},
    {from: 0.8, to: 1, a: 'contextClip', b: 'reel', tol: 1.5},
  ],
  semantic: [
    {at: 0.05, fn: "s.lensOpen === 0 && s.contextFull && s.labelsShown === 1 && s.datum === 'before' && s.contextLinked && s.lensLinked && s.lensCopyMatches && !s.markerVisible", label: 'context at full size with its labels; the lens copy uses the same coordinates'},
    {at: 0.38, fn: "s.lensOpen === 1 && !s.contextFull && s.labelsShown === 0 && s.datum === 'before' && s.lensLinked && s.cardText.old === 1 && s.cardText.new === 0 && s.lensCopyMatches", label: 'lens open on the badge: the capacity datum is printed on the card as real text'},
    {at: 0.47, fn: 's.cardText.old === 0 && s.cardText.new === 0', label: 'the old datum has lifted off before the new one lands (never drawn together)'},
    {at: 0.56, fn: "s.datum === 'after' && s.lensClip.x < s.badge.x - 20 && s.contextLinked && s.contextClip.x === s.badge.x && !s.lensCopyMatches && s.cardText.new === 1 && s.beforeNote === 1", label: 'the substitution happens inside the lens only; the old value is kept in a muted before note'},
    {at: 0.64, fn: "s.lensOpen < 1 && s.lensOpen > 0 && s.cardText.new === 0 && s.beforeNote === 0", label: 'no text is drawn in the lens or its note while the window closes'},
    {at: 0.7, fn: "s.lensOpen === 0 && !s.contextFull && s.contextDatum === 'before' && s.contextLinked", label: 'the lens has closed; the camera returns before the context changes'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.contextFull && s.labelsShown === 1 && !s.contextLinked && s.contextDatum === 'after'", label: 'return: at full size the context updates (link wound in) by 0.8'},
    {at: 0.83, fn: 's.markerVisible && s.notesShown === 1', label: 'the Δ marker and the before/after note block are shown by 0.83'},
    {at: 1, fn: "s.lensOpen === 0 && s.contextFull && s.labelsShown === 1 && !s.contextLinked && !s.lensLinked && s.markerVisible && s.repX === 640 && s.sheet.x === 845 && s.allReached && s.truncated.length === 0", label: 'hold: back in context; only the link changed; the representative and the form did not move'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextLinked && s.lensLinked && s.beforeNote === 0 && s.newShown === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: '!s.contextLinked && s.markerVisible && s.contextFull', label: 'labels hidden: the change reads (ribbon wound in, marker shown)'},
    {at: 1, params: {relationships: []}, fn: 's.contextLinked && s.lensLinked', label: 'no link before: the substitution makes the ribbon reach the badge (the link follows the datum)'},
    {at: 0.3, params: {relationships: []}, fn: '!s.contextLinked && !s.lensLinked', label: 'no link before: nothing is linked before the substitution'},
    {at: 1, params: DOC, fn: "s.focus === 'document' && s.contextLinked && s.lensLinked && s.contextDatum === 'after' && s.markerVisible && s.lensOpen === 0 && s.truncated.length === 0", label: 'document focus: only the title changes; the link is untouched; back in context'},
    {at: 0.56, params: DOC, fn: 's.titleNew === 1 && s.titleOld === 0', label: 'document focus: the new title is printed on the form in the lens'},
    {at: 0.38, params: DOC, fn: 's.titleOld === 1 && s.titleNew === 0', label: 'document focus: seeking back restores the old title'},
    {at: 0.47, params: DOC, fn: 's.titleOld === 0 && s.titleNew === 0', label: 'document focus: old and new titles are never drawn together'},
    ...['long-labels-stress', 'baseline-es'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.allReached', label: `${n}: no supplied text is cut`})),
  ],
});

suppliedTextSuite('LAW-0180', {
  fields: "const link = (p.relationships || [])[0]; const doc = p.focusTarget === 'document'; return [...p.actors.map(a => a.name), p.roles.client, p.roles.representative, p.roles.clerk, doc ? null : p.props.document, p.props.documentId, p.props.counterSign, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker, doc && link ? link.label : null];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// review round 2 (blocking): the inspect returns to the context (lens closed, context back at full size
// with its labels and the Δ marker); the context stays a real scene while the lens is open; the whole
// detail is inside the lens; labels are clear of people/props; the lens connectors never cross visible text.
const coneCrossesText = `(() => {
  const segs = ['lens-coneA', 'lens-coneB'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(l => l && visible(l) && l.getAttribute('opacity') !== '0');
  const lensWin = svg.querySelector('[data-node="lens-win"]');
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && !(lensWin && lensWin.contains(t)) && t.textContent.trim());
  const m = svg.getScreenCTM().inverse();
  const toV = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m); };
  const hitSeg = (a, b, r) => { for (let i = 0; i <= 40; i++) { const x = a.x + (b.x - a.x) * i / 40, y = a.y + (b.y - a.y) * i / 40; if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true; } return false; };
  for (const l of segs) {
    const c = l.getScreenCTM();
    const pt = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(c).matrixTransform(m); };
    const a = pt(+l.getAttribute('x1'), +l.getAttribute('y1')), b = pt(+l.getAttribute('x2'), +l.getAttribute('y2'));
    for (const t of texts) { const bb = t.getBoundingClientRect(); const p0 = toV(bb.left, bb.top), p1 = toV(bb.right, bb.bottom); if (hitSeg(a, b, {x: p0.x, y: p0.y, w: p1.x - p0.x, h: p1.y - p0.y})) return true; }
  }
  return false;
})()`;
ratioChecks('LAW-0180', 'returns to the full context; real thumbnail; detail inside the lens; labels clear', [
  {at: [0, 1], fn: 's.lensOpen === 0 && s.contextFull && s.labelsShown === 1 && s.contextShare >= 0.3 && (u < 1 || s.markerVisible)', label: 'start and end: the context at full size (lens closed, labels shown, Δ marker at the end)'},
  {at: [1], tv: ['none'], fn: 's.contextShare >= 0.6', label: 'labels hidden: the returned context fills the frame'},
  {at: [0.3, 0.4, 0.5], fn: 's.contextShare >= 0.28 && s.lensOpen > 0', label: 'while the lens is open the context stays a large real scene (no near-empty thumbnail)'},
  {at: [1], fn: 's.detailInLens', label: 'the whole detail (badge card / form title) lies inside the lens source'},
  {at: [0, 1], fn: 's.tagsClear', label: 'link tag and form tag clear of the people, props, name tags and notes'},
  {at: [0.3, 0.4, 0.5, 0.63], dom: `!${coneCrossesText}`, label: 'lens connectors never cross visible text (name tags, sign, labels are hidden during the lens phase)'},
]);
