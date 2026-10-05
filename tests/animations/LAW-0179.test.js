// LAW-0179 — Representación de una parte · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact is modified (who
// performs the act at the counter) and no legal consequence is invented to complete the
// contrast (both forms end in the same tray; nothing is ranked, validated or resolved).
// Clock: c = (u − 0.17) / 0.6 in both scenes.
//   B: clip in the client's hand c 0.11–0.20 → u 0.236–0.29; in the representative's
//      0.20–0.29 → 0.29–0.344; on the badge from 0.344. A: form in the client's hand from
//      c 0.24 → u 0.314. Release into the tray in both at c 0.86 → u 0.686.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const P = name => presetsFor('LAW-0179').find(q => q.name === name).params;
const SQUARE = {safeArea: {top: 0.06, bottom: 0.2, left: 0.25, right: 0.25}};
const TALL = {safeArea: {top: 0.02, bottom: 0.02, left: 0.36, right: 0.36}};

contractSuite('LAW-0179', {
  continuity: ['sheetA', 'sheetB', 'handCA', 'handCB', 'handRB', 'clipB', 'handKA', 'handKB'],
  continuityLimit: 60,
  attach: [
    // B: the clip changes hands at a shared point, then stays on the badge
    {from: 0.237, to: 0.289, a: 'clipB', b: 'handCB', tol: 1.5},
    {from: 0.291, to: 0.343, a: 'clipB', b: 'handRB', tol: 1.5},
    {from: 0.346, to: 1, a: 'clipB', b: 'badgeB', tol: 1.5},
    // A: the client holds the form from the pick-up until it is let go into the tray (c 0.24–0.86)
    {from: 0.315, to: 0.685, a: 'handCA', b: 'edgeLA', tol: 1.5},
    // B: the client holds it (c 0.34–0.41), the representative takes the right edge (c 0.40–0.46),
    // then the left edge after turning round (c 0.54–0.86)
    {from: 0.375, to: 0.415, a: 'handCB', b: 'edgeLB', tol: 1.5},
    {from: 0.411, to: 0.445, a: 'handRB', b: 'edgeRB', tol: 1.5},
    {from: 0.496, to: 0.685, a: 'handRB', b: 'edgeLB', tol: 1.5},
    // both clerks put a hand on the right edge before the form rests in the tray (c 0.85–0.90)
    {from: 0.681, to: 0.709, a: 'handKA', b: 'edgeRA', tol: 1.5},
    {from: 0.681, to: 0.709, a: 'handKB', b: 'edgeRB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.scenes === 2 && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.docAt === 'stand' && s.lookA.label === 0 && s.changedShown === 0", label: 'base: two identical complete scenes; no scenario label or changed fact yet'},
    {at: 0.3, fn: "s.b.clipAt === 'rep' && s.a.clipAt === 'reel' && !s.a.linked && s.lookA.label === 1 && s.changedShown > 0", label: 'change beat: in B the clip is passed to the representative; in A nobody is linked'},
    {at: 0.33, fn: "s.a.docAt === 'client' && s.b.docAt === 'stand'", label: 'change beat: in A the client takes the form personally'},
    {at: 0.4, fn: "s.b.linked && !s.a.linked && s.b.clipAt === 'badge'", label: 'B: the ribbon links client and representative (the supplied link)'},
    {at: 0.55, fn: "s.a.docAt === 'client' && s.b.docAt === 'rep' && s.a.clientX > 110 && s.b.clientX === 110 && s.a.repX === 400", label: 'parallel: A’s client carries the form; B’s representative carries it; B’s client stays'},
    {at: 1, fn: "s.a.docAt === 'tray' && s.b.docAt === 'tray' && JSON.stringify(s.a.sheet) === JSON.stringify(s.b.sheet) && s.a.performerX === s.b.performerX && s.a.repX === 400 && s.b.clientX === 110", label: 'same act, same tray, same position: only who stands at the counter differs'},
    {at: 1, fn: 's.guide === 1 && s.neutralShown === 1 && s.allReached && s.truncated.length === 0', label: 'guide drawn, neutral note shown, nothing cut'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.a.docAt === 'tray' && s.b.docAt === 'tray' && s.b.linked && !s.a.linked && s.a.repX === 400 && s.b.clientX === 110", label: 'labels hidden: the same difference is visible (ribbon, who walks)'},
    {at: 1, params: {relationships: []}, fn: "!s.b.linked && s.b.clipAt === 'reel' && s.b.docAt === 'tray'", label: 'no link supplied: B draws no ribbon (nothing is invented)'},
    {at: 1, fn: "s.arrangement === 'row' && s.stageFraction >= 0.4", label: '16:9: side by side, each scene ≥ 40 % of the width'},
    {at: 1, params: TALL, fn: "s.arrangement === 'column' && s.stageFraction >= 0.9", label: 'tall box: stacked, each scene full width'},
    {at: 1, params: SQUARE, fn: "s.arrangement === 'row' && s.stageFraction >= 0.4", label: 'square box: side by side (depth scenes), each ≥ 40 % of the width'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].flatMap(n => [{}, SQUARE, TALL].map(box => ({at: 1, params: {...P(n), ...box}, fn: 's.truncated.length === 0 && s.allReached', label: `${n} ${box.safeArea ? JSON.stringify(box.safeArea.left) : ''}: no supplied text is cut`}))),
  ],
});

identicalBeforeChange('LAW-0179', 0.17);

suppliedTextSuite('LAW-0179', {
  fields: "const link = (p.relationships || [])[0]; return [...p.actors.map(a => a.name), p.roles.client, p.roles.representative, p.roles.clerk, link && link.label, p.props.document, p.props.documentId, p.props.counterSign, p.props.speech.a, p.props.speech.b, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Same in A and B', 'Igual en A y B'];",
});

// review round 2: side by side (16:9, 1:1) the two scenes dominate the frame (items 3, 18): each keeps >= ~40 %
// of the width and >= 42 % of the design height, with labels shown or hidden; speech bubbles and the link tag
// never cover the other people, the table or a lane header
ratioChecks('LAW-0179', 'scenes dominate; bubbles and link tag clear', [
  ...(() => {
    const ALL = presetsFor('LAW-0179').map(q => q.name);
    const share = minH => `s.arrangement === 'column' ? s.stageFraction >= 0.9 : (s.stageFraction >= 0.4 && s.sceneShareH >= ${minH})`;
    return [
      {at: [1], ratios: ['16:9', '9:16'], fn: share(0.42), label: 'scene share: >= ~40 % of the width and >= 42 % of the height side by side; full width stacked'},
      {at: [1], ratios: ['1:1'], presets: ALL.filter(n => n !== 'long-labels-stress'), fn: share(0.42), label: 'scene share (1:1): >= ~40 % of the width and >= 42 % of the height'},
      // Named exception — coordinator decision 2026-09-24: in long-labels-stress 1:1 the shared strip at the 16 px floor
      // needs 471/1100 units below side-by-side scenes; see SESSION_HANDOFF. For this preset × ratio only the minimum
      // scene height is 0.29 (the width requirement stays >= 0.40). The layout used there puts the strip in a right-hand
      // column with the two scenes stacked (each 0.335 of the height, 0.605 of the width).
      {at: [1], ratios: ['1:1'], presets: ['long-labels-stress'], fn: `s.arrangement === 'column-strip' ? (s.stageFraction >= 0.4 && s.sceneShareH >= 0.29) : ${share(0.29)}`, label: 'scene share (1:1 long labels, named exception): >= 40 % of the width and >= 29 % of the height'},
      // every other box keeps the standard rule (the column-strip layout is only for this dense case)
      {at: [1], ratios: ['1:1'], presets: ALL.filter(n => n !== 'long-labels-stress'), fn: "s.arrangement !== 'column-strip'", label: 'the right-hand strip column is used only for the dense long-labels 1:1 case'},
    ];
  })(),
  {at: [0.8, 1], fn: 's.bubbleClear && s.linkClear', label: 'bubbles and the link tag keep clear of the other people, the table and the headers'},
  // re-review: B's bubble never covers the link label, its pin, its leader or the ribbon (the label's anchor), and the
  // two callouts never touch
  {at: [1], fn: 's.bubbleClearOfLink', label: 'B’s bubble keeps clear of the link label, pin, leader and ribbon (layout)'},
  {at: [1], dom: "(() => { const bub = svg.querySelector('[data-node=\"bubB\"]'), tag = svg.querySelector('[data-node=\"link-tag\"]'); if (!bub || !tag) return true; const b = bub.getBoundingClientRect(); const parts = [...tag.children].filter(e => e.tagName !== 'path'); return parts.every(e => { const r = e.getBoundingClientRect(); return !(r.width && r.height) || b.right + 4 <= r.left || r.right + 4 <= b.left || b.bottom + 4 <= r.top || r.bottom + 4 <= b.top; }); })()", label: 'rendered: B’s bubble does not touch the link label chip or its pin'},
  // compared readings get equal visual weight: A and B header cards have the same line counts and heights
  {at: [1], dom: "['lab', 'cap'].every(k => { const hA = svg.querySelector('[data-node=\"hA-' + k + '\"]'), hB = svg.querySelector('[data-node=\"hB-' + k + '\"]'); if (!hA && !hB) return true; if (!hA || !hB) return false; const la = hA.querySelectorAll('tspan').length || hA.querySelectorAll('text').length, lb = hB.querySelectorAll('tspan').length || hB.querySelectorAll('text').length; return la === lb && Math.abs(hA.getBBox().height - hB.getBBox().height) < 1; })", label: 'A and B headers: equal label/caption line counts and card heights'},
]);
