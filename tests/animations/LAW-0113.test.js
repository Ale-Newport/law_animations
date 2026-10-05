// LAW-0113 — Hecho contrafactual · story. Contract battery + ID-specific checks.
// acceptanceCheck: continuity of motion (figurine, parcel, flag, analyst's hand),
// object anchors (the figurine's solved hands hold the parcel's grips while it
// carries it; the analyst's hand holds the flag while it moves it) and a
// transformation that is recognizable with labels hidden (take A, rewind, flag
// moved, take B to the other spot; the dashed ghost keeps the base result).
// Review round 2: beats run in sequence (rewind ≥ 70 % of the forward take, the
// hand only after the rewind, the replay only after the hand), ≥ 1 s complete
// hold, the diorama keeps a large share of the frame (AUTHORING item 18), the
// relation line lands on its row, identifiers return at the hold clear of the
// spots and badges, and the "What if" row appears only at the change beat.
import {test, expect} from '@playwright/test';
import {contractSuite} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {presetsFor} from '../harness/contract.js';

const ALT = {
  circumstance: {label: 'Where the box is left', base: 'box', baseText: 'in the wall parcel box', alt: 'bench', altText: 'on the bench below it', condition: 1},
};

contractSuite('LAW-0113', {
  continuity: ['fig', 'parcel', 'flag', 'hand', 'handN', 'handF'],
  attach: [
    // the figurine's solved hands sit on the parcel's grips while take A carries it
    {from: 0.151, to: 0.28, a: 'handN', b: 'gripN', tol: 1},
    {from: 0.151, to: 0.28, a: 'handF', b: 'gripF', tol: 1},
    // … and again while take B carries it
    {from: 0.613, to: 0.7, a: 'handN', b: 'gripN', tol: 1},
    {from: 0.613, to: 0.7, a: 'handF', b: 'gripF', tol: 1},
    // the analyst's hand holds the flag's knob for the whole move A → B
    {from: 0.517, to: 0.565, a: 'hand', b: 'flag', tol: 1},
  ],
  semantic: [
    {at: 0, fn: "s.take === 'none' && s.flagSpot === 'bench' && s.holder === 'figure' && !s.ghostVisible && s.lampA === 0 && s.lampB === 0 && s.reelDir === 0", label: 'rest: flag on the base spot, parcel in the figurine’s hands, no ghost, reels still'},
    {at: 0.14, fn: "s.figX === 112 && s.flagSpot === 'bench' && !s.armIn && s.whatIfRow === 0", label: 'nothing moves before the action beat; the What-if row is not shown yet'},
    {at: 0.25, fn: "s.take === 'A' && s.reelDir === 1 && s.lampA === 1 && s.lampB === 0 && s.flagSpot === 'bench' && s.holder === 'figure'", label: 'take A: reels forward, blue lamp, the figurine carries the parcel'},
    {at: 0.31, fn: "s.parcelSpot === 'bench' && s.flagSpot === 'bench'", label: 'take A leaves the parcel on the base spot'},
    {at: 0.4, fn: "s.take === 'rewind' && s.reelDir === -1 && s.ghostVisible && s.flagSpot === 'bench' && !s.armIn", label: 'rewind: reels backwards, the dashed ghost keeps the base result; no hand yet'},
    {at: 0.465, fn: "s.take === 'rewound' && s.holder === 'figure' && s.figX === 112 && s.flagHolder === 'spotA' && s.ghostVisible && !s.armIn", label: 'rewound: parcel back in the figurine’s hands at the start; flag not yet moved; hand not yet in'},
    {at: 0.54, fn: "s.flagHolder === 'hand' && s.armIn && s.take === 'rewound' && s.figX === 112 && s.whatIfRow === 0", label: 'the analyst moves the flag (the one changed circumstance) before the replay starts'},
    {at: 0.6, fn: "s.flagSpot === 'sill' && s.whatIfRow === 1 && s.take === 'rewound'", label: 'the What-if row appears when the flag lands; the replay has not started'},
    {at: 0.64, fn: "s.take === 'B' && s.flagSpot === 'sill' && s.figX === s.baseFigXAtSameTime && s.figX > 112 && !s.armIn", label: 'take B: same speed and path as take A at the same take time (lockstep); the hand has left'},
    {at: 0.75, fn: "s.parcelSpot === 'sill' && s.ghostVisible && s.ghostSpot === 'bench' && s.flagSpot === 'sill' && s.lampB === 1 && s.changedCircumstances === 1", label: 'take B leaves the parcel on the hypothetical spot; the ghost stays on the base spot'},
    {at: 1, fn: "s.holdShown && s.badges.a === 1 && s.badges.b === 1 && s.relation.kind === 'relation' && s.relation.drawn === 1 && s.relation.condition === 1", label: 'hold: A/B badges and the plain relation to the supplied condition'},
    {at: 1, fn: "s.notes.some(n => n.includes('window sill ever agreed')) && s.notes.some(n => n.includes('Everything else happens')) && s.keyText.includes('no conclusion drawn') && s.keyText.includes('not supplied')", label: 'hold: issue, assumption and key (as supplied · no conclusion drawn · outcome not supplied) are drawn'},
    {at: 1, fn: "s.outcome === 'not-supplied' && s.winner === null", label: 'no outcome or winner is inferred from the replay'},
    // round 2: sequence and hold
    {at: 1, fn: 's.windows.rewind[1] - s.windows.rewind[0] >= 0.7 * (s.windows.base[1] - s.windows.base[0])', label: 'the rewind lasts at least 70 % of the forward take (legible, not a fast-forward)'},
    {at: 1, fn: 's.windows.hand[0] >= s.windows.rewind[1] && s.windows.replay[0] >= s.windows.hand[1]', label: 'beats run in sequence: rewind, then the hand, then the replay'},
    {at: 1, fn: '(1 - s.windows.complete) * 8000 >= 1000', label: 'the complete final state is held for at least 1 s at the default duration'},
    {at: 1, params: {finalState: 'rewound-awaiting-replay'}, fn: '(1 - s.windows.complete) * 8000 >= 1000', label: 'awaiting-replay: also a ≥ 1 s hold'},
    // round 2: relation lands on its row, starting at the script card's relation line
    {at: 1, fn: 'Math.hypot(s.relEnds.to.x - s.relEnds.rowAnchor.x, s.relEnds.to.y - s.relEnds.rowAnchor.y) < 1 || Math.hypot(s.relEnds.to.x - s.relEnds.rowAnchorL.x, s.relEnds.to.y - s.relEnds.rowAnchorL.y) < 1', label: 'the relation ends on the supplied condition row'},
    {at: 1, fn: 's.relEnds.relLine && (Math.hypot(s.relEnds.from.x - s.relEnds.relLine.r.x, s.relEnds.from.y - s.relEnds.relLine.r.y) < 1 || Math.hypot(s.relEnds.from.x - s.relEnds.relLine.l.x, s.relEnds.from.y - s.relEnds.relLine.l.y) < 1)', label: 'the relation starts at the circumstance’s relation line'},
    {at: 0.72, params: {textVisibility: 'none'}, fn: "s.parcelSpot === 'sill' && s.ghostVisible && s.flagSpot === 'sill' && s.lampB === 1", label: 'labels hidden: the same rewind, flag move and replay happen'},
    {at: 0.54, params: {textVisibility: 'none'}, fn: "s.flagHolder === 'hand' && s.take === 'rewound'", label: 'labels hidden: the flag is carried by the hand'},
    {at: 1, params: {finalState: 'rewound-awaiting-replay'}, fn: "s.holder === 'figure' && s.figX === 112 && s.flagSpot === 'sill' && s.badges.b === 0 && s.keyText.includes('not played')", label: 'rewound-awaiting-replay: flag moved, take B not played'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.actionCapped && (s.take === 'A' || s.take === 'A-held') && s.flagSpot === 'bench'", label: 'actionProgress freezes the action part-way (before the flag move)'},
    {at: 1, params: ALT, fn: "s.parcelSpot === 'bench' && s.ghostSpot === 'box' && s.flagSpot === 'bench'", label: 'another supplied pair of spots: the parcel ends on the supplied hypothetical spot'},
  ],
});

suppliedTextSuite('LAW-0113', {
  fields: 'return [p.facts.title, ...p.facts.events, p.rules.title, ...p.rules.conditions, p.circumstance.label, p.circumstance.baseText, p.circumstance.altText, ...p.issues, ...p.assumptions, p.objectLabels.parcel, p.objectLabels.flag, p.actorLabels.a];',
  content: 'return [p.facts.title, ...p.facts.events, p.rules.title, ...p.rules.conditions, p.circumstance.baseText, p.circumstance.altText, ...p.issues, ...p.assumptions];',
  captions: 'return [p.objectLabels.parcel, p.objectLabels.flag];',
});

// the analyst's caption is shown while the hand is in (it has no body at the hold)
test('LAW-0113: the analyst’s caption is drawn while the hand moves the flag (all presets × ratios)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0113')];
  const out = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0113');
    const miss = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      x.seek(0.54 * x.durationMs);
      const want = x.getState({bounds: false}).params.actorLabels.b.replace(/\s+/g, '');
      const shown = [...x.element.querySelectorAll('[data-node="idAnalystG"] text')].map(t => t.textContent.replace(/\s+/g, '')).join('');
      const op = Number(x.element.querySelector('[data-node="idAnalystG"]').getAttribute('opacity'));
      if (!shown.includes(want) || op < 0.99) miss.push({preset: pr.name, w, h, op});
      x.destroy();
      el.remove();
    }
    return miss;
  }, presets);
  expect(out).toEqual([]);
});

// Real-ratio audit (every preset × 16:9/9:16/1:1 × labels shown/hidden) at the hold:
//  - AUTHORING item 18: the diorama spans ≥ 52 % of the window width;
//  - the identifier chips, notes and annotations stay clear of the key scene elements (both spots with
//    their parcel/ghost and flag, and the A/B badges).
test('LAW-0113: scene share and identifiers clear of the key scene elements (all presets × ratios × labels)', async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0113')];
  const out = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0113');
    const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const bad = [];
    let n = 0;
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      n++;
      if (s.dioShare.w < 0.52) bad.push({preset: pr.name, tv, w, h, share: s.dioShare});
      const hits = s.chipBoxes.flatMap((c, i) => s.keyBoxes.map((k, j) => (hit(c, k) ? `${i}x${j}` : null)).filter(Boolean));
      if (hits.length) bad.push({preset: pr.name, tv, w, h, hits});
      x.destroy();
      el.remove();
    }
    return {bad, n};
  }, presets);
  expect(out.n).toBe(30);
  expect(out.bad).toEqual([]);
});
