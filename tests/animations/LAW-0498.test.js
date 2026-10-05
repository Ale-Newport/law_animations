// LAW-0498 — Cláusula de terminación · mechanism (rebuilt: transparent layers on a light table). Contract battery +
// ID-specific checks.
// Brief customizable fields not exposed (coordinator decision BRIEF CUSTOMIZABLE FIELDS, SESSION_HANDOFF 2026-10-05):
// schedules, definitions, priorities, relationships and relationLabels (only the supplied link is drawn, as a plain
// relation), elements (element labels are the contract / clause / circumstance / communication fields).
// acceptanceCheck (brief): continuity (60 fps: both layer tabs, the magnifier), anchored objects (each layer turns about
// its hinge; the half-frames meet only when both are registered) and a transformation recognisable with the labels
// hidden (two layers turn down, their half-frames close around the target, the magnifier travels and is parked).
// Only the explicit relation is drawn (no arrows); the tracer follows traversalOrder and dwells on focusElement.
// Windows (LAW-0498.js): layer A 0.18–0.30 · layer B 0.30–0.42 · joint 0.41–0.45 · trace 0.45–0.72 · park 0.72–0.78 ·
// tags 0.76–0.86.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {textFloor, noTextOverlap, seekHistory, fill, esDefaults, noConditionRuleWords, conceptNeutral, TERM_BANNED} from './ct05-rendered.js';

const ID = 'LAW-0498';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['layerA', 'layerB', 'lensCentre', 'lupaGrip'],
  semantic: [
    {at: 0, fn: "s.layerAAt === 'folded' && s.layerBAt === 'folded' && !s.joined && s.lupaParked && s.finalShown === 0", label: 'separated: both layers folded back, magnifier parked'},
    {at: 0.25, fn: "s.layerAAt === 'turning' && s.layerBAt === 'folded'", label: 'the circumstance layer turns down first'},
    {at: 0.36, fn: "s.layerAAt === 'registered' && s.layerBAt === 'turning' && !s.joined", label: 'then the communication layer'},
    {at: 0.44, fn: "s.joined && s.outline > 0 && s.outlines === 'section2' && s.lensShown === 0", label: 'the half-frames close around section 2 before the tracer'},
    {at: 0.6, fn: "s.lensShown === 1 && s.zoom >= 1.5 && !s.lupaParked", label: 'the magnifier travels with a real enlargement'},
    {at: 1, fn: "s.joined && s.lupaParked && s.lensShown === 0 && s.finalShown === 1 && s.keyShown === 1 && s.layoutOk", label: 'hold: joined, magnifier parked, case and key shown'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.outlines === 'empty-band' && s.finalState === 'undescribed' && s.joined", label: 'not described: the outline closes around the empty band'},
    {at: 0.8, params: {textVisibility: 'none'}, fn: "s.joined && s.lupaParked", label: 'labels hidden: the same mechanism'},
  ],
});

// the tracer visits the traversal order and dwells longest on the focus element
test(`${ID}: the tracer follows traversalOrder and dwells longest on focusElement`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, cases]) => {
    const def = await window.__lib.load(id);
    const res = [];
    for (const params of cases) {
      const visits = [], dwell = {};
      for (let i = 0; i <= 400; i++) {
        const s = def.evaluate({params, timeMs: (i / 400) * 6500}).semantic;
        if (s.tracerAt) { dwell[s.tracerAt] = (dwell[s.tracerAt] || 0) + 1; if (visits[visits.length - 1] !== s.tracerAt) visits.push(s.tracerAt); }
      }
      res.push({visits, dwell, order: params.traversalOrder || ['circumstance', 'section', 'communication'], focus: params.focusElement || 'section'});
    }
    return res;
  }, [ID, [{}, P('contrast-or-alternative')]]);
  for (const r of out) {
    expect(r.visits).toEqual(r.order);
    const top = Object.entries(r.dwell).sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe(r.focus);
  }
});

ratioChecks(ID, 'layout fits; parked magnifier clear', [
  {at: [1], fn: 's.layoutOk', label: 'layout fits'},
  {at: [0, 1], fn: 's.lupaParked', label: 'the magnifier is parked at rest and at the hold'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.contract.reference + ' · ' + p.contract.title, p.clauseTitle, p.circumstance.label, p.communication.label, p.stateLabels[p.finalState], ...p.clauses, ...p.annotations.map(a => a.text)]",
  content: "return [p.circumstance.label, p.communication.label, p.stateLabels[p.finalState], ...p.clauses]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

textFloor(ID);
noTextOverlap(ID);
seekHistory(ID);
fill(ID, [0.05, 1], {short: 0.5});
esDefaults(ID);
noConditionRuleWords(ID);
conceptNeutral(ID);

test(`${ID}: no preset supplies termination-rule wording (EN and ES)`, () => {
  for (const pr of presetsFor(ID)) expect(JSON.stringify(pr.params).match(TERM_BANNED), pr.name).toBeNull();
});
