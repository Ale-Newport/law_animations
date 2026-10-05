// LAW-0122 — Texto y contexto · mechanism. Contract battery + checks encoding
// the brief's acceptanceCheck: every connector ends on its component, the
// traversal order does not change with seeking, and a plain relation is never
// drawn as causation (no arrowhead) unless the author supplies that kind.
import {contractSuite} from '../harness/contract.js';

contractSuite('LAW-0122', {
  continuity: ['sheet', 'strip', 'token', 'tracer', 'back'],
  semantic: [
    {at: 0, fn: "!s.separated.article && !s.separated.passage && !s.separated.word && !s.relations.some(r => r.drawn)", label: 'start: nothing separated, no line drawn'},
    {at: 0.19, fn: "s.separated.article && s.separated.passage && s.separated.word && !s.relations.some(r => r.drawn)", label: 'separate first: sheet, strip and token lifted before any relation is drawn'},
    {at: 0.43, fn: "s.relations.length === 4 && s.relations.every(r => r.drawn && r.fromOn && r.toOn)", label: 'every supplied connector is drawn and both ends land on their component edges'},
    {at: 0.43, fn: "s.relations.every(r => r.kind === 'relation' && !r.arrow)", label: 'default relations carry no arrowhead (association is not drawn as causation)'},
    {at: 0.46, fn: "s.tracerOn && s.focus === 'word' && s.focusScale > 1.05", label: 'the tracer starts on the focus (the word), which is enlarged'},
    {at: 0.6, fn: "s.tracerOn && s.visited[0] === 'word' && s.visited.includes('passage') && !s.visited.includes('rack')", label: 'the tracer follows the traversal order outwards'},
    {at: 0.3, fn: "JSON.stringify(s.order) === JSON.stringify(['word','passage','article','book','rack'])", label: 'traversal order as supplied (early seek)'},
    {at: 1, fn: "JSON.stringify(s.order) === JSON.stringify(['word','passage','article','book','rack']) && s.visited.length === 5", label: 'traversal order unchanged after seeking to the end'},
    {at: 0.43, fn: "s.relations.every(r => r.labelOffLine)", label: 'relation labels sit beside their lines (a leader joins them), never on top of them'},
    {at: 0.74, fn: "s.tokenInLens && !s.wordSeated && !s.backMoving", label: 'until the gather the enlarged word stays under the magnifier'},
    {at: 0.8, fn: "s.backMoving && !s.tokenInLens && !s.wordSeated && !s.wordPlacedBack && s.tokenScale < 1", label: 'gather: the word leaves the lens along its line, shrinking on the way back to its passage'},
    {at: 0.88, fn: "s.wordSeated && s.backMoving && !s.wordPlacedBack", label: 'the word is re-seated in its passage, then travels on into the full article'},
    {at: 1, fn: "s.wordSeated && s.wordPlacedBack && !s.tokenInLens && !s.tracerOn && s.cards.isolated && s.cards.contextual", label: 'hold: word back in its passage and on its line of the full article; both attributed readings visible'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.wordPlacedBack && s.relations.every(r => r.drawn && r.fromOn && r.toOn)", label: 'labels hidden: mechanism completes identically'},
    {at: 0.5, params: {relationships: [{from: 'word', to: 'passage', kind: 'relation'}, {from: 'word', to: 'article', kind: 'sequence', label: 'then read in the whole'}]}, fn: "s.relations.length === 2 && s.relations[1].arrow && !s.relations[0].arrow && s.relations.every(r => r.fromOn && r.toOn)", label: 'a supplied sequence gets an arrow; the relation keeps none; both land'},
    {at: 0.55, params: {traversalOrder: ['rack', 'book', 'article', 'passage', 'word'], focusElement: 'article'}, fn: "s.visited[0] === 'rack' && s.focus === 'article'", label: 'reversed traversal order is followed as supplied'},
  ],
});

// Reviewer round B007: the copy of the key word that flies back to the full
// article vanished before it arrived and seemed to settle over "keeps a"
// (16:9, also labels hidden); in 9:16 it lifted off printed over the word that
// had just been put back. Every preset × ratio × labels shown/hidden:
//  - the copy never appears before the word is re-seated, and never overlaps
//    the re-seated word in the passage strip (it starts lifted clear of it);
//  - the only place where the copy stops is the MEASURED box of the key word in
//    the full article (centre of its highlight, at the article's text size);
//  - it rests there visibly before cross-fading into the highlight.
import {ratioChecks, times} from './texto-y-contexto-ratio-checks.js';

ratioChecks('LAW-0122', 'the flying copy starts clear of the re-seated word and lands on the measured key-word box', [
  {at: times(0.8, 0.95, 0.0025), fn: '!s.backBeforeSeated && !s.backOverStripWord', label: 'copy appears only after the re-seat and never prints over the re-seated word'},
  {at: times(0.853, 0.95, 0.0025), fn: '!s.backVisible || s.backMoving || s.backOnKey', label: 'after lift-off the copy stops nowhere but on the measured key-word box'},
  {at: [0.911, 0.915], fn: 's.backVisible && s.backOnKey && s.wordPlacedBack', label: 'the copy rests visibly on the key word of the full article (its highlight box)'},
  {at: [0.94, 1], fn: '!s.backVisible && s.wordPlacedBack', label: 'the copy has cross-faded into the highlight'},
  // Round 2: the copy crossed the article heading (0.87–0.88) and rested on the
  // "part of" connector (0.85). While it travels it covers no printed word,
  // part, caption or relation label; while it rests at its lift point it also
  // stays off every connector.
  {at: times(0.83, 0.91, 0.0025), fn: 's.backHits === 0', label: 'the copy travels through free space only'},
]);

// Found in the repair review (long-labels 9:16): the "appears in" label's
// leader ran down through the passage strip's text, and the rack's caption tab
// covered the rack's own caption plate. Every relation-label leader must cross
// no component, caption tab or card, and no caption tab may reach into its
// component's content.
// Round 2: the orange ring around the placed word painted over the letters of
// its neighbours ("Each" read "Eacl"). No visible shape may be painted over
// the article sheet's or the passage strip's text at the hold or while the
// copy lands (rings and highlights sit under the text layer).
const PAINT_OVER = `(() => {
  const texts = [...svg.querySelectorAll('[data-node="sheet"] text, [data-node="strip"] text')].filter(visible).map(t => ({t, b: t.getBoundingClientRect()}));
  const shapes = [...svg.querySelectorAll('path, rect, circle, line, polygon, ellipse')].filter(el => !el.closest('defs, clipPath, mask') && visible(el));
  // margins in the SVG's own (1080p) pixels, whatever the on-page scale
  const px = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
  const inside = (q, b) => q.x > b.left + 0.5 * px && q.x < b.right - 0.5 * px && q.y > b.top + 0.5 * px && q.y < b.bottom - 0.5 * px;
  const bad = [];
  for (const el of shapes) {
    const later = texts.filter(o => o.t.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (!later.length) continue;
    const fill = el.getAttribute('fill');
    const filled = el.tagName !== 'line' && fill !== 'none' && fill !== 'transparent';
    const eb = el.getBoundingClientRect();
    for (const o of later) {
      const ix = Math.min(o.b.right, eb.right) - Math.max(o.b.left, eb.left), iy = Math.min(o.b.bottom, eb.bottom) - Math.max(o.b.top, eb.top);
      if (ix <= px || iy <= px) continue;
      if (filled) { bad.push(o.t.textContent.slice(0, 12)); continue; }
      // stroke-only: sample its actual outline
      const m = el.getScreenCTM();
      const len = el.getTotalLength ? el.getTotalLength() : 0;
      for (let i = 0; i <= 80 && len; i++) {
        const p0 = el.getPointAtLength((len * i) / 80);
        const q = new DOMPoint(p0.x, p0.y).matrixTransform(m);
        if (inside(q, o.b)) { bad.push(o.t.textContent.slice(0, 12)); break; }
      }
    }
  }
  return bad.length === 0;
})()`;
ratioChecks('LAW-0122', 'nothing is painted over the article or passage text (rings under the text layer)', [
  {at: [0.95, 1], dom: PAINT_OVER, label: 'no ring, highlight or card covers any character of the sheet or strip'},
]);

ratioChecks('LAW-0122', 'relation-label leaders cross no part or label; caption tabs stay on the top edge', [
  {at: [0.5, 1], fn: 's.labelLeadHits === 0 && s.capsIntrude === 0', label: 'label leaders clear; tabs off the content'},
  {at: [1], fn: 's.labelsOnParts === 0', label: 'no relation label sits on a part, caption or card'},
  {at: [1], fn: 's.relCrossParts === 0', label: 'no relation line runs through a component other than its own two ends'},
  // Round 2 (minor): in long-labels 1:1 "part of" and "printed in" tangled at the article port
  {at: [1], fn: 's.portCrowd === 0 && s.relCrossings === 0', label: 'ports on one component stay apart and no two relation lines cross'},
]);

// Round 2 (item 17): in 1:1 the article (15.5 px), readings (14.7 px), credits
// (13.3 px) and level labels (13.3 px, 10.1 px in long-labels) were smaller
// than the generic captions (16.2 px). Supplied content — article, passage,
// shelf, book plate, reading cards — must be ≥ 16 px at 1080p and never smaller
// than the component captions or relation labels.
const SIZES = `(() => {
  const scale = el => { const m = svg.getScreenCTM().inverse().multiply(el.getScreenCTM()); return Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)); };
  const px = t => parseFloat(getComputedStyle(t).fontSize) * scale(t);
  const texts = sel => [...svg.querySelectorAll(sel)].filter(t => visible(t) && (t.textContent || '').trim());
  const content = texts('[data-node="sheet"] text, [data-node="strip"] text, [data-node="rack"] text, [data-node="book-plate"] text, [data-node="card-isolated"] text, [data-node="card-contextual"] text');
  const caps = texts('[data-node^="cap-"] text, [data-node^="rlg"] text');
  const cmin = Math.min(...content.map(px));
  const hmax = caps.length ? Math.max(...caps.map(px)) : 0;
  return content.length > 0 && cmin >= 16 && cmin >= hmax - 0.5;
})()`;
ratioChecks('LAW-0122', 'content text ≥ 16 px and never smaller than captions', [
  {at: [1], dom: SIZES, tv: ['all'], label: 'content ≥ 16 px at 1080p, not smaller than captions or relation labels'},
]);
