// LAW-0479 — Aceptación digital · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the supplied status of the
// presentation: "Informed action (as supplied)" in A, "Presentation to examine (as supplied)" in B) and it changes
// objects, not only text: in B Party A's screen takes the grey dashed pending outline with the change; the table's
// terms-shown row carries each status and the Δ guide outlines it. No legal consequence is invented: no winner, no
// deficiency, no rule on online acceptance, consent, enforceability or validity (noAcceptanceRuleWords, EN and ES); the
// outline says nothing about a person (pendingNeutral); no jurisdiction (conceptNeutral).
// Composition (LAW-0479.js): two identical stages over one comparison table and the footer notes; 1:1 with labels all
// keeps the stacked-column layout of the coordinator ruling "CF CONTRAST 1:1 STAGE SHARE" (stages now 0.44–0.5 of the
// width). Every device is drawn as a device — bezel, screen, glyph, button and print bars ('bars' cards where no text
// fits on them) — never a glyph token (review cf10): deviceSize below.
// Windows: headers, table and B's pending outline from CHANGE = 0.24 · events at 0.44 · 0.51 · 0.58 (terms shown) ·
// 0.65 · 0.72 (the same moments in both scenes) · the screen opens 0.575–0.62, the action device 0.715–0.76 · guide and
// key at the end.
// long-labels-stress is no longer capped (review cf10 fix): the neutral note (69 characters) and the changed fact (71) are
// back at their pre-cap values (production/scratch/contract-formation-10/LAW-0479.stress.precap.json) — the 1:1
// right-hand column now fits them (two-column notes from 28 body sizes wide; heads 50.8 px, text 16.1 px).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noAcceptanceRuleWords, pendingNeutral, noEmptyPanel, conceptNeutral, ACCEPTANCE_BANNED, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, deviceSize} from './cf10-rendered.js';

const ID = 'LAW-0479';
const CHANGE = 0.24;
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardPA', 'cardRA', 'cardPB', 'cardRB', 'handAA', 'handBA', 'handAB', 'handBB'],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookB.header === 0 && s.lookB.pend === 0', label: 'base: the same situation in both stages, no scenario label, no table, no pending ring'},
    {at: 0.23, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change'},
    {at: 0.42, fn: "s.lookB.header === 1 && s.lookA.pend === 0 && s.lookB.pend === 1", label: "change: in B Party A's screen takes the dashed pending outline (presentation to examine, as supplied); in A it does not"},
    {at: 0.5, fn: "JSON.stringify(s.lookA.cardP) === JSON.stringify(s.lookB.cardP) && JSON.stringify(s.lookA.cardR) === JSON.stringify(s.lookB.cardR)", label: 'parallel: the devices travel at the same moments on the same paths in both stages'},
    {at: 0.56, fn: "s.a.connected === 0 && s.b.connected === 0 && s.a.whereP === 'B' && s.b.whereP === 'B'", label: 'no terms shown before their station (the screen at rest at Party B first)'},
    {at: 0.66, fn: "s.a.connected === 1 && s.b.connected === 1 && s.a.recorded === 0 && s.b.recorded === 0", label: 'the terms are shown in both stages before any action is recorded'},
    {at: 0.8, fn: "s.a.connected === 1 && s.b.connected === 1 && s.a.recorded === 1 && s.b.recorded === 1 && !s.a.pending && s.b.pending", label: 'the action recorded, as supplied, in both stages; the pending outline in B only'},
    {at: 1, fn: "s.allReached && s.layoutOk && JSON.stringify(s.a.order) === JSON.stringify(s.b.order)", label: 'guide: the same supplied order in both; hands reach'},
    {at: 1, params: P('contrast-or-alternative'), fn: "!s.a.pending && s.b.pending && s.a.order[0] === s.b.order[0]", label: 'alternative: the same single changed fact with other facts'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.allReached && s.a.connected === 1 && s.b.pending', label: 'labels hidden: the same contrast plays'},
  ],
});

identicalBeforeChange(ID, CHANGE);

ratioChecks(ID, 'paired layout, reach and equal stages', [
  {at: [1], fn: 's.layoutOk && s.sameGeometry', label: 'every block fits; both stages share one geometry (slots included)'},
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.flightGap >= 0', label: 'the two devices never meet'},
]);

suppliedTextSuite(ID, {
  fields: `return [p.offer.reference, p.offer.title, ...p.terms.map(t => (String(t.value).startsWith('(') ? t.label + ' ' + t.value : t.label + ': ' + t.value)), p.responses[0].reference, p.responses[0].text, ...p.termsB.map(t => (String(t.value).startsWith('(') ? t.label + ' ' + t.value : t.label + ': ' + t.value)),
    ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), ...p.parties.map(q => q.name),
    p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean)`,
  content: `return [p.offer.title, ...p.terms.map(t => (String(t.value).startsWith('(') ? t.label + ' ' + t.value : t.label + ': ' + t.value)), p.responses[0].text, ...p.termsB.map(t => (String(t.value).startsWith('(') ? t.label + ' ' + t.value : t.label + ': ' + t.value)), ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), p.changedFact]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="a-card-p"]', '[data-node="a-card-r"]', '[data-node="b-card-p"]', '[data-node="b-card-r"]', '[data-node="a-A-head"]', '[data-node="a-B-head"]', '[data-node="b-A-head"]', '[data-node="b-B-head"]']);
seekHistory(ID);
// (coordinator ruling, LAW-0455 re-review, applied here: the fill proxy is > 0.5 on the shorter axis — this item's rest frame shows
// the scenes only, without an empty table frame; 0.5 is used here instead of this builder's own 0.55)
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {count: 4});
// (the devices at rest — before the journeys and at the hold — and the pending outline from the change on)
deviceSize(ID, {cards: '^[ab]-card-[pr]$', pend: '^[ab]-pend$', times: [0.1, 0.3, 0.4, 0.8, 1], pendFrom: 0.3, pendExpected: true});
esDefaults(ID);
cardsApart(ID, [['a-card-p', 'a-card-r'], ['b-card-p', 'b-card-r']]);
noAcceptanceRuleWords(ID);
// (the same scenario B with each status: B's figures drawn identically)
const SEQB = [
  {event: 'screen-sent', time: 'Day 1, 10:00 (fictional)'}, {event: 'screen-received', time: 'Day 1, 10:01 (fictional)'},
  {event: 'terms-shown', time: 'Status as supplied'},
  {event: 'action-sent', time: 'Day 1, 10:05 (fictional)'}, {event: 'action-received', time: 'Day 1, 10:06 (fictional)'},
];
const B = status => ({scenarioB: {label: 'Scenario B', caption: '', sequence: SEQB, status}});
pendingNeutral(ID, [[B('action-recorded'), B('presentation-to-examine')]], ['b-']);
conceptNeutral(ID);

// Rendered fill (labels key / none as well as all): from the change to the hold the stages, the comparison table and
// their trays cover the caption-safe box — at least 80 % of a 24 × 24 grid of its cells is under a visible element
// box (the LAW-0448 round-4 fill pattern; this builder's own threshold).
test(`${ID}: the frame stays filled from the change to the hold, labels all / key / none (rendered grid cover)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [], worst = {};
    for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const R = svg.getBoundingClientRect();
      const sa = x.getState({bounds: false}).params.safeArea;
      const S = {l: R.left + R.width * sa.left, t: R.top + R.height * sa.top, w: R.width * (1 - sa.left - sa.right), h: R.height * (1 - sa.top - sa.bottom) - Math.min(R.width, R.height) * 0.057};
      const vis = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o >= 0.05; };
      let mn = 1;
      for (const u of [0.3, 0.5, 0.7, 0.85, 1]) {
        x.seek(u * x.durationMs);
        const bs = [...svg.querySelectorAll('[data-layer="scene"] path, [data-layer="scene"] rect, [data-layer="scene"] circle')].filter(e => !e.closest('defs') && !e.closest('clipPath') && vis(e)).map(e => e.getBoundingClientRect()).filter(q => q.width > 2 && q.height > 2);
        let cov = 0;
        const N = 24;
        for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
          const cx = S.l + (i + 0.5) * S.w / N, cy = S.t + (j + 0.5) * S.h / N;
          if (bs.some(q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) cov++;
        }
        const f = cov / (N * N);
        mn = Math.min(mn, f);
        if (f < 0.8) fails.push(`${pr.name} ${tv} ${ratio} u${u} cover ${f.toFixed(2)}`);
      }
      worst[`${pr.name} ${tv} ${ratio}`] = +mn.toFixed(2);
      x.destroy();
      el.remove();
    }
    return {fails, worst};
  }, [ID, presets]);
  console.log(JSON.stringify(out.worst));
  expect(out.fails.slice(0, 20)).toEqual([]);
});

noEmptyPanel(ID);

// The supplied parameters of every preset carry no banned wording either (EN and ES).
test(`${ID}: no preset supplies online-acceptance rule, outcome, consent or obligation wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(ACCEPTANCE_BANNED), pr.name).toBeNull();
});

// How wrapped text breaks (every preset + es-only × ratio, u step 0.05): no one-word line, no lone letter or ID split
// from its word, no number torn from its unit, and no Spanish "(aportado)" after a feminine or plural word.
noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
