// LAW-0491 — Obligaciones recíprocas · contrast. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses (the performances stand for the clauses), schedules, definitions and priorities (no priority between the
// columns is drawn). scenarioA / scenarioB, changedFact, sharedFacts and comparisonLabels are exposed.
// Stress cap (coordinator decision, standing stress cap rule, AUTHORING item 20, 2026-09-26; full text in the presets
// file): long-labels-stress lists ONE shared performance per column (as the baseline does: counts equal the baseline's,
// never fewer); every text field stays strictly longer than the baseline's. True driver: 1:1 — with two shared
// performances per column (three rows with the changed card) and the changed card ≥ 70 px tall (no tokens), even the
// closest of the 1:1 arrangements tried (rooms side by side with the people beside or under the boards, printed or
// print-bar cards; rooms stacked beside a right-hand panel) overruns the room's top by 140 design units (≈ 104 px at
// 1080p), at every text size down to the 16 px floor; 16:9 and 9:16 fit uncapped. Pre-cap copy:
// production/scratch/contract-terms-03/LAW-0491.presets.precap.json.
// acceptanceCheck (brief): both scenes exist (two complete rooms, identical before the change beat — semantic look and
// rendered), exactly the indicated fact changes (the column the changed performance is listed in: its card arrives in
// that party's tray and that party's hand seats it in that column), and no legal consequence is invented (no rule or
// conclusion wording, EN and ES; no jurisdiction; no winner, score or outcome).
// Layouts: 16:9 rooms side by side (each ≥ 0.40 of the width) with the shared strip below; 9:16 rooms stacked; 1:1
// rooms side by side with people under the boards, or — when the cards' texts cannot be printed at the floors — print-bar
// cards whose texts are drawn once in the shared strip / right-hand panel (CF CONTRAST 1:1 STAGE SHARE decision,
// 2026-10-04).
// Windows (LAW-0491.js W): headers 0.17–0.22 · the card arrives 0.20–0.30 (ring 0.22–0.40) · the party's hand seats it
// 0.42–0.62 · links 0.62–0.74 · guide 0.78–0.83 · strip 0.80–0.85.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, noReciprocalRuleWords, conceptNeutral, TERM_BANNED, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize, stagesStackedTall} from './ct03-rendered.js';

const ID = 'LAW-0491';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardAx', 'cardBx', 'handAA', 'handAB', 'handBA', 'handBB'],
  semantic: [
    {at: 0.1, fn: "s.whereA === 'none' && s.whereB === 'none' && s.lookA === s.lookB && s.linksA === 0", label: 'base: the two rooms are identical; the changed card is not there yet'},
    {at: 0.35, fn: "s.whereA === 'tray' && s.whereB === 'tray' && s.columnA === 'a' && s.columnB === 'b'", label: 'change: the card arrives in Party A’s tray in room A and in Party B’s tray in room B'},
    {at: 0.52, fn: "s.whereA === 'moving' && s.whereB === 'moving'", label: 'the two hands seat it at the same time (equal timing)'},
    {at: 0.7, fn: "s.whereA === 'row' && s.whereB === 'row' && s.linksA > 0 && s.linksA === s.linksB", label: 'seated; the shared links draw on in both rooms at once'},
    {at: 1, fn: 's.guide === 1 && s.linksA === 1 && s.allReached && s.layoutOk', label: 'guide: the changed card ringed in both rooms; nothing concluded'},
    {at: 0.15, fn: "s.whereA === 'none' && s.guide === 0", label: 'seeking back restores the base'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.columnA === 'b' && s.columnB === 'a' && s.whereA === 'row'", label: 'alternative: the other way round'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.whereA === 'row' && s.whereB === 'row' && s.linksA === 1", label: 'labels hidden: the same action'},
  ],
});

identicalBeforeChange(ID, 0.17);

ratioChecks(ID, 'layout fits, reach, equal timing, room share', [
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: times(0, 1, 0.02), fn: 's.whereA === s.whereB && s.linksA === s.linksB', label: 'the two rooms move at the same time'},
  {at: [1], fn: 's.roomShare >= 0.4', label: 'each room ≥ 0.40 of the frame along its arrangement axis'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.changedFact.performance, p.changedFact.label, p.scenarioA.label, p.scenarioB.label, ...p.sharedFacts, ...p.performancesA, ...p.performancesB, ...p.parties.map(q => q.name)]",
  content: "return [p.changedFact.performance, p.scenarioA.label, p.scenarioB.label, ...p.performancesA, ...p.performancesB]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="a-card-x"]', '[data-node="b-card-x"]', '[data-node="a-A-head"]', '[data-node="a-B-head"]', '[data-node="b-A-head"]', '[data-node="b-B-head"]']);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
headFloor(ID, {count: 4, floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 55], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noReciprocalRuleWords(ID);
conceptNeutral(ID);
// (the changed card is a real object: ≥ 85 px at 1:1 outside the stress preset, ≥ 70 px otherwise)
docSize(ID, {cards: '^[ab]-card-x-in$', times: [0.35, 0.7, 1]});
stagesStackedTall(ID, {panels: ['a-frame', 'b-frame']});

test(`${ID}: no preset supplies rule, conclusion or exchange wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});

// Rendered: before the change beat the two rooms draw the same thing (every drawn element of room B is room A's,
// shifted by the rooms' offset) — labels all / none, every preset × ratio.
test(`${ID}: the two rooms are drawn identically before the change (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) for (const tv of ['all', 'none']) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(0.12 * x.durationMs);
      const svg = x.element;
      const op = e => { let v = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); } return v; };
      const fa = svg.querySelector('[data-node="a-frame"]').getBoundingClientRect(), fb = svg.querySelector('[data-node="b-frame"]').getBoundingClientRect();
      // (each element's tag, text and box relative to its room's frame, in document order; boxes compared within 1.5 px)
      const sig = (room, F) => [...svg.querySelector(`[data-node="${room}-room"]`).querySelectorAll('path, rect, circle, line, text')]
        .filter(e => op(e) > 0.05 && !e.closest('[data-node$="-head"]')).map(e => { const b = e.getBoundingClientRect(); return {k: `${e.tagName}:${e.textContent.trim()}`, v: [b.left - F.left, b.top - F.top, b.width, b.height]}; });
      const A = sig('a', fa), Bs = sig('b', fb);
      if (A.length !== Bs.length || A.some((q, i) => q.k !== Bs[i].k || q.v.some((v, j) => Math.abs(v - Bs[i].v[j]) > 1.5))) fails.push(`${pr.name} ${ratio} ${tv}: rooms differ before the change`);
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
