// LAW-0490 — Obligaciones recíprocas · mechanism. Contract battery + ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// clauses (the performances stand for the clauses), schedules, definitions, priorities (no priority between the
// columns is drawn) and elements (the elements are the motif's own objects — contract plate, two columns, cards,
// parties — whose texts are editable through contract, columns, performancesA/B and parties). relationships,
// focusElement, relationLabels and traversalOrder are exposed. No stress field is capped.
// acceptanceCheck (brief): every connector ends on its element (links on their two ports; relation lines between the
// badge / plate and the column's top edge), the order does not change on seek (seekHistory, determinism), and a
// relation is never drawn as causality (no arrowhead anywhere; plain lines; the links only "linked as supplied").
// Equal weight: the two markers run at the same time on both sides (same height at every moment) and meet in the middle
// of the first link; the two columns and the two badges are the same size.
// Windows (LAW-0490.js W): explode 0.04–0.16 · relations 0.20–0.30 (labels 0.28–0.34) · links 0.32–0.42 · markers
// 0.46–0.72 (focus 0.45–0.52 up, 0.72–0.77 down) · gather 0.77–0.86 · key 0.84–0.89.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, headFloor, esDefaults, noReciprocalRuleWords, conceptNeutral, TERM_BANNED, noOneWordLines, noLoneLetterSplit, noTornNumberUnit, esAportadoAgrees, docSize} from './ct03-rendered.js';

const ID = 'LAW-0490';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['tracerA', 'tracerB', 'colA', 'colB', 'plate'],
  semantic: [
    {at: 0, fn: 's.exploded === 0 && s.linkProgress === 0 && s.relations.length === 0', label: 'the contract assembled: plate on the columns, the parties beside it, nothing related yet'},
    {at: 0.18, fn: 's.exploded === 1', label: 'separate: the layers apart'},
    {at: 0.36, fn: "s.relations.includes('party') && s.relations.includes('part') && s.linkProgress > 0", label: 'relate: the explicit relations drawn, links drawing on'},
    {at: 0.6, fn: "s.focusScale === 1 && s.focus === 'links'", label: 'trace: the focus element enlarged while the markers run'},
    {at: 0.73, fn: 's.tracersMet', label: 'the two markers meet in the middle of the first link'},
    {at: 1, fn: 's.keyShown === 1 && s.exploded < 1 && s.exploded > 0.5 && s.linkProgress === 1 && s.layoutOk', label: 'gather: the layers close in part; everything visible; key'},
    {at: 0.3, fn: 's.keyShown === 0 && s.focusScale === 0', label: 'seeking back restores the earlier state'},
    {at: 0.6, params: P('contrast-or-alternative'), fn: "s.focus === 'columns' && JSON.stringify(s.stages) === JSON.stringify(['contract','columns','links'])", label: 'alternative: the two columns in focus, the contract stage first'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: 's.linkProgress === 1 && s.exploded > 0.5', label: 'labels hidden: the same mechanism'},
  ],
});

ratioChecks(ID, 'layout fits; the two markers run together', [
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: times(0.46, 0.74, 0.02), fn: 'Math.abs(s.tracerA.y - s.tracerB.y) < 1', label: 'the two markers at the same height at every moment (neither side first)'},
  {at: [0.73], fn: "!s.stages.includes('links') || s.tracersMet", label: 'they meet in the middle of the first link'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.columns.a, p.columns.b, ...p.performancesA, ...p.performancesB, ...p.parties.map(q => q.name), p.relationLabels.party, p.relationLabels.part, p.relationLabels.link]",
  content: "return [p.columns.a, p.columns.b, ...p.performancesA, ...p.performancesB, p.relationLabels.party, p.relationLabels.part, p.relationLabels.link]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.3, 1], {short: 0.5});
headFloor(ID, {floors: Object.fromEntries(['default', 'baseline-illustrative', 'contrast-or-alternative', 'baseline-es'].flatMap(n => [[`${n}|1:1`, 55], [`${n}|16:9`, 60], [`${n}|9:16`, 60]]))});
esDefaults(ID);
noReciprocalRuleWords(ID);
conceptNeutral(ID);
docSize(ID, {cards: '^card-[ab]\\d$', times: [0.3, 1], floor: 70});

test(`${ID}: no preset supplies rule, conclusion or exchange wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});

// Rendered (every preset × ratio × labels, at the hold and while the markers run): each link joins its ● port and its
// ◆ port; each relation line ends on the badge / plate and on its column's top edge; no line carries an arrowhead or a
// dash; the two columns and the two badges are the same size.
test(`${ID}: connectors land on their elements, plain, at equal weight (rendered)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let n = 0;
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) for (const tv of ['all', 'none']) for (const u of [0.6, 1]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      x.seek(u * x.durationMs);
      const svg = x.element;
      const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
      const q = nm => svg.querySelector(`[data-node="${nm}"]`);
      const R = e => e.getBoundingClientRect();
      const end = (pth, at) => { const m = pth.getScreenCTM(); const p0 = pth.getPointAtLength(at); return new DOMPoint(p0.x, p0.y).matrixTransform(m); };
      const ctr = e => { const b = R(e); return {x: b.left + b.width / 2, y: b.top + b.height / 2}; };
      for (let j = 0; q(`link${j}`); j++) {
        n++;
        const a = q(`link${j}-a`), b = q(`link${j}-b`);
        const pa = ctr(q(`link${j}-pa`)), pb = ctr(q(`link${j}-pb`));
        if (Math.hypot(end(a, 0).x - pa.x, end(a, 0).y - pa.y) * k > 3) fails.push(`${pr.name} ${ratio} ${tv} u${u} link${j}: not on its ● port`);
        if (Math.hypot(end(b, 0).x - pb.x, end(b, 0).y - pb.y) * k > 3) fails.push(`${pr.name} ${ratio} ${tv} u${u} link${j}: not on its ◆ port`);
        // (each port on the inner edge of one of its column's cards)
        const sheets = s0 => [...svg.querySelectorAll(`[data-node^="card-${s0}"][data-node$="-sheet"]`)].map(R);
        if (!sheets('a').some(c => Math.abs(pa.x - c.right) * k < 4 && pa.y > c.top && pa.y < c.bottom)) fails.push(`${pr.name} ${ratio} ${tv} u${u} link${j}: ● port off its card`);
        if (!sheets('b').some(c => Math.abs(pb.x - c.left) * k < 4 && pb.y > c.top && pb.y < c.bottom)) fails.push(`${pr.name} ${ratio} ${tv} u${u} link${j}: ◆ port off its card`);
      }
      for (const ln of svg.querySelectorAll('[data-node^="rel-"]')) {
        if (ln.tagName !== 'line') continue;
        if (ln.getAttribute('marker-end') || ln.getAttribute('stroke-dasharray')) fails.push(`${pr.name} ${ratio}: ${ln.getAttribute('data-node')} arrow or dash`);
        const nm = ln.getAttribute('data-node'), s = nm.slice(-1);
        const col = R(q(`col-${s}-panel`));
        const y2 = parseFloat(ln.getAttribute('y2')), p2 = new DOMPoint(parseFloat(ln.getAttribute('x2')), y2).matrixTransform(ln.getScreenCTM());
        if (Math.abs(p2.y - col.top) * k > 4 || p2.x < col.left - 2 || p2.x > col.right + 2) fails.push(`${pr.name} ${ratio} ${tv} u${u} ${nm}: does not land on the column's top edge`);
      }
      const ca = R(q('col-a-panel')), cb = R(q('col-b-panel'));
      if (u === 1 && (Math.abs(ca.width - cb.width) > 1 || Math.abs(ca.height - cb.height) > 1)) fails.push(`${pr.name} ${ratio} ${tv}: columns differ in size`);
      const b0 = R(q('badge0')), b1 = R(q('badge1'));
      if (Math.abs(b0.height - b1.height) > 1) fails.push(`${pr.name} ${ratio} ${tv}: badges differ in size`);
      x.destroy();
      el.remove();
    }
    return {fails: [...new Set(fails)], n};
  }, [ID, presets]);
  expect(out.n).toBeGreaterThan(10);
  expect(out.fails.slice(0, 20)).toEqual([]);
});

noOneWordLines(ID);
noLoneLetterSplit(ID);
noTornNumberUnit(ID);
esAportadoAgrees(ID);
