// LAW-0487 — Término definido · contrast. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// the clauses list (one clause: term.clause), schedules, the definitions list (one definition slip: definition) and
// priorities. The motif's core content — the word, one placeholder definition slip, the definitions sheet and the
// contract, and where the slip ends — stays editable (also in the presets file's note).
// Stress cap (coordinator decision, standing stress cap rule, AUTHORING item 20, 2026-09-26; full text in the presets
// file): long-labels-stress sharedFacts is capped from two items to one (count still ≥ the baseline's none; the fact
// keeps its 51 characters). True driver: 1:1 with labels shown — with two shared facts the right-hand column (comparison
// table + notes) no longer fits beside the stacked stages at 16.1 px with the bars2 documents and the search falls to
// the collapse-and-fade layout whose stages leave the frame at the guide (0 of 4 people visible from u 0.8). With one
// fact 1:1 keeps the column (16.1 px, 55.2 model px heads); 16:9 and 9:16 fit the pre-cap values (16.1 px, 57.7 model px
// heads). Pre-cap copy: production/scratch/contract-terms-02/LAW-0487.presets.precap.json.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the supplied configuration: "Defined
// term (as supplied)" in A, "Term with no linked definition (as supplied)" in B) and it changes objects, not only text:
// in A Party B's hand moves the definition slip into the contract's dock and, once the contract is unfolded, the thread
// links the word to it; in B the slip stays in the definitions sheet's dock and no thread is drawn; with the change the
// destination dock of each scene takes the same solid outline (one in each, equal weight); the table's station row
// carries each configuration and the Δ guide outlines it. No legal consequence is invented: no winner, no
// interpretation rule, no conclusion about the word (noInterpretationRuleWords, EN and ES); the configuration says
// nothing about a person (configNeutral); no jurisdiction (conceptNeutral).
// Composition (LAW-0487.js, copied from LAW-0483): two identical stages over one comparison table and the footer notes;
// 1:1 may use the stacked-column layout of the coordinator ruling "CF CONTRAST 1:1 STAGE SHARE" (SESSION_HANDOFF,
// 2026-10-04). Every document is drawn as a document — sheet, head band, glyph, print bars, row, dock and slip ('bars'
// cards where no text fits on them) — never a glyph token: docSize below.
// Windows: headers, table and the destination outlines from CHANGE = 0.24 · events at 0.40 · 0.46 · 0.52 (term
// station) · 0.64 · 0.70 (the same moments in both scenes) · in A the slip passes 0.54–0.57 (Party B's hand 0.52–0.59) ·
// the contracts unfold 0.695–0.74, their rows 0.74–0.76, A's thread 0.76–0.79 · guide and key at the end.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, noTextOverProps, seekHistory, fill, headFloor, esDefaults, cardsApart, noInterpretationRuleWords, configNeutral, noEmptyPanel, conceptNeutral, TERM_BANNED, CONFIG_WORDS, CONFIG_LABELS, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize, stagesStackedTall, groupBoxesClearText} from './ct02-rendered.js';

const ID = 'LAW-0487';
const CHANGE = 0.24;
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['cardPA', 'cardRA', 'cardPB', 'cardRB', 'handAA', 'handBA', 'handAB', 'handBB', 'slipA', 'slipB'],
  semantic: [
    {at: 0, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.lookB.header === 0 && s.lookA.mark === 0 && s.lookB.mark === 0', label: 'base: the same situation in both stages, no scenario label, no table, no destination outline'},
    {at: 0.23, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'still identical just before the change'},
    {at: 0.38, fn: "s.lookB.header === 1 && s.lookA.mark === 1 && s.lookB.mark === 1 && s.a.placement === 'linked' && s.b.placement === 'external'", label: 'change: each scene outlines the dock where its supplied configuration puts the slip (one outline each)'},
    {at: 0.5, fn: "JSON.stringify(s.lookA.cardP) === JSON.stringify(s.lookB.cardP) && JSON.stringify(s.lookA.cardR) === JSON.stringify(s.lookB.cardR)", label: 'parallel: the documents travel at the same moments on the same paths in both stages'},
    {at: 0.515, fn: "s.a.slipOn === 'sheet' && s.b.slipOn === 'sheet' && s.a.whereP === 'B' && s.b.whereP === 'B'", label: 'the slip has not moved before its station (the definitions sheet at rest at Party B first)'},
    {at: 0.555, fn: "s.a.slipOn === 'moving' && s.a.slipHand && s.b.slipOn === 'sheet'", label: 'in A Party B\'s hand carries the slip; in B it stays'},
    {at: 0.6, fn: "s.a.slipOn === 'contract' && s.b.slipOn === 'sheet' && s.a.whereR === 'A' && s.b.whereR === 'A' && s.a.thread === 0", label: 'the slip lies in A\'s contract before either contract leaves; no thread yet'},
    {at: 0.8, fn: "s.a.whereR === 'B' && s.b.whereR === 'B' && s.a.slipOn === 'contract' && s.b.slipOn === 'sheet' && s.a.thread === 1 && s.b.thread === 0", label: 'both contracts reached Party A and are unfolded; in A the thread links the word to the slip, in B no thread'},
    {at: 1, fn: "s.allReached && s.layoutOk && JSON.stringify(s.a.order) === JSON.stringify(s.b.order)", label: 'guide: the same supplied order in both; hands reach'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.a.slipOn === 'contract' && s.b.slipOn === 'sheet' && s.a.order[0] === s.b.order[0]", label: 'alternative: the same single changed fact with other facts'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.allReached && s.a.slipOn === 'contract' && s.b.slipOn === 'sheet' && s.a.thread === 1 && s.b.thread === 0", label: 'labels hidden: the same contrast plays'},
  ],
});

identicalBeforeChange(ID, CHANGE);

ratioChecks(ID, 'paired layout, reach and equal stages', [
  {at: [1], fn: 's.layoutOk && s.sameGeometry', label: 'every block fits; both stages share one geometry (slots included)'},
  {at: times(0, 1, 0.05), fn: 's.allReached', label: 'every hand reaches its target'},
  {at: [1], fn: 's.flightGap >= 0', label: 'the two documents never meet'},
  {at: [1], fn: 's.a.thread === 1 && s.b.thread === 0', label: 'A\'s thread drawn, none in B'},
]);

suppliedTextSuite(ID, {
  fields: `return [p.sheet.reference, p.sheet.title, p.definition.label + ' ' + p.definition.value, p.contract.reference, p.contract.title, p.term.word + ' · ' + p.term.clause,
    ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), ...p.parties.map(q => q.name),
    p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral].filter(Boolean)`,
  content: `return [p.sheet.title, p.definition.label + ' ' + p.definition.value, p.contract.title, p.term.word + ' · ' + p.term.clause, ...p.scenarioA.sequence.map(e => e.time), ...p.scenarioB.sequence.map(e => e.time), p.changedFact]`,
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
noTextOverProps(ID, ['[data-node="a-card-p"]', '[data-node="a-card-r"]', '[data-node="b-card-p"]', '[data-node="b-card-r"]', '[data-node="a-slipfly"]', '[data-node="a-A-head"]', '[data-node="a-B-head"]', '[data-node="b-A-head"]', '[data-node="b-B-head"]']);
seekHistory(ID);
// (as LAW-0479: the fill proxy > 0.5 on the shorter axis — the rest frame shows the scenes only)
fill(ID, [0.05, 1], {short: 0.5});
// (contrast head floors: ≥ 60 px off 1:1 for non-stress presets; at 1:1 ≥ 55 baseline — CONTRACT-TERMS FLOORS,
// SESSION_HANDOFF 2026-10-05; long-labels-stress ≥ 45 px at every ratio — coordinator decision STRESS PEOPLE FLOOR OFF
// 1:1, SESSION_HANDOFF 2026-10-05)
headFloor(ID, {count: 4, floors: {'*|16:9': 60, '*|9:16': 60, 'long-labels-stress|16:9': 45, 'long-labels-stress|9:16': 45}});
// (the documents at rest — before the journeys and at the hold — and while the outlines show)
docSize(ID, {cards: '^[ab]-card-[pr]$', times: [0.1, 0.3, 0.4, 0.8, 1]});
esDefaults(ID);
cardsApart(ID, [['a-card-p', 'a-card-r'], ['b-card-p', 'b-card-r']]);
noInterpretationRuleWords(ID);
// (the same scenario B with each configuration: B's figures drawn identically, one slip)
const SEQB = [
  {event: 'sheet-sent', time: 'Day 1, 10:00 (fictional)'}, {event: 'sheet-received', time: 'Day 1, 10:01 (fictional)'},
  {event: 'term-station', time: 'Configuration as supplied'},
  {event: 'contract-sent', time: 'Day 1, 10:05 (fictional)'}, {event: 'contract-received', time: 'Day 1, 10:06 (fictional)'},
];
const B = status => ({scenarioB: {label: 'Scenario B', caption: '', sequence: SEQB, status}});
configNeutral(ID, [[B('term-defined'), B('term-unlinked')]], ['b-']);
conceptNeutral(ID);

// Rendered: one destination outline in each scene from the change on — around the contract's dock in a defined-term
// scene, around the definitions sheet's own dock in the other; the same art (stroke, width, size) in both.
test(`${ID}: one destination outline per scene, the same art in both (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { if (!q.getAttribute) continue; const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
      for (const u of [0.2, 0.3, 1]) {
        x.seek(u * x.durationMs);
        const rings = ['a', 'b'].map(P => [...svg.querySelectorAll(`[data-node^="${P}-card-"][data-node$="-dockring"]`)].filter(e => eff(e) > 0.5));
        const want = u < 0.24 ? 0 : 1;
        // (u 0.3: both documents at rest; while a document travels its face — and the outline on it — is turned away)
        rings.forEach((rs, i) => { if (rs.length !== want) fails.push(`${pr.name} ${tv} ${ratio} u${u} scene ${i ? 'B' : 'A'}: ${rs.length} outlines`); });
        if (want && rings.every(rs => rs.length === 1)) {
          const [ra, rb] = rings.map(rs => rs[0]);
          if (!/card-r-dockring$/.test(ra.getAttribute('data-node')) || !/card-p-dockring$/.test(rb.getAttribute('data-node'))) fails.push(`${pr.name} ${tv} ${ratio}: outline on the wrong dock`);
          const A = ra.getBoundingClientRect(), Bx = rb.getBoundingClientRect();
          if (Math.abs(A.width - Bx.width) > 1 || Math.abs(A.height - Bx.height) > 1 || ra.getAttribute('stroke') !== rb.getAttribute('stroke') || ra.getAttribute('stroke-width') !== rb.getAttribute('stroke-width') || ra.getAttribute('stroke-dasharray') || rb.getAttribute('stroke-dasharray')) fails.push(`${pr.name} ${tv} ${ratio}: the two outlines differ`);
        }
      }
      x.destroy();
      el.remove();
    }
    return fails;
  }, [ID, presets]);
  expect(out).toEqual([]);
});

// Rendered fill (labels key / none as well as all): from the change to the hold the stages, the comparison table and
// their trays cover the caption-safe box — at least 80 % of a 24 × 24 grid of its cells is under a visible element
// box (the LAW-0448 round-4 fill pattern; the cf-10 builder's threshold).
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
// (review ct-01: A and B one above the other on tall frames, "uno sobre otro en vertical", in every label mode)
stagesStackedTall(ID);
// (review ct-01: the dashed "order to be examined" box ran through the "Received by B" heading at 1:1 stress)
groupBoxesClearText(ID);

// The supplied parameters of every preset carry no banned wording either (EN and ES); the configuration words appear
// only in the exact supplied labels.
test(`${ID}: no preset supplies interpretation-rule, meaning, outcome or obligation wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) {
    expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
    const texts = [pr.params.scenarioA, pr.params.scenarioB].filter(Boolean).flatMap(sc => [sc.label, sc.caption, ...sc.sequence.map(e => e.time)]);
    for (const t of [...texts, ...(pr.params.comparisonLabels ? Object.values(pr.params.comparisonLabels) : []), pr.params.changedFact, ...(pr.params.sharedFacts || [])].filter(Boolean)) if (CONFIG_WORDS.test(t)) expect(CONFIG_LABELS, pr.name).toContain(t);
  }
});

// How wrapped text breaks (every preset + es-only × ratio, u step 0.05): no one-word line, no lone letter or ID split
// from its word, no number torn from its unit, and no Spanish "(aportado)" after a feminine or plural word.
noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
