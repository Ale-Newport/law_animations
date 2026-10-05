// LAW-0338 — Revisión de documentos · mechanism. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {jurisdictionTest, stressLongerTest} from './solicitud-autorizacion-checks.js';
import {LOCALES} from '../../src/animations/review/LAW-0338.js';

const ID = 'LAW-0338';
// Banned wording for this motif (EN and ES): admissibility rules and outcomes, assessments of the pieces, validity,
// time limits, duties, institutions, ranks.
const BANNED = /(admisi|admissib|admisib|\badmit|admitid|inadmit|\bexclu|excluid|rechaz|\breject|\brefus|deneg|\bdenied|\ballow(ed)?\b|permitid|\bvalid|v[aá]lid|invalid|nulid|\bvoid\b|relevan|pertinen|probator|evidential|\bproof\b|\bprueba|\bplazo|deadline|time limit|\bdue\b|\blate\b|tard[ií]|extempor|\bmust\b|\bdebe|deber[aá]|required|obligatori|mandator|outcome|resultado|verdict|veredicto|\bfallo\b|judg(e)?ment|\bruling|sentenci|\bcourt\b|tribunal|\bjudge|\bjuez|magistrad|\blaw\b|\bley\b|\brank|jerarqu|superior|inferior|\bwins?\b|ganador|\bloses?\b|approv|aprobad|correct|incorrect|\bwrong|error)/i;
const FIELDS_PRELUDE = `const EN = ${JSON.stringify(LOCALES.en)}, ES = ${JSON.stringify(LOCALES.es)}; if (p.locale === 'es') { const q = {...p}; for (const k of Object.keys(ES)) { if (JSON.stringify(p[k]) === JSON.stringify(EN[k])) q[k] = ES[k]; else if (p[k] && typeof p[k] === 'object' && !Array.isArray(p[k])) { const o = {...p[k]}; for (const kk of Object.keys(ES[k] || {})) if (JSON.stringify(p[k][kk]) === JSON.stringify((EN[k] || {})[kk])) o[kk] = ES[k][kk]; q[k] = o; } } p = q; }`;
const walkStrings = (v, path, fn) => {
  if (typeof v === 'string') { fn(v, path); return; }
  if (v && typeof v === 'object') for (const k of Object.keys(v)) walkStrings(v[k], `${path}.${k}`, fn);
};
function bannedTests() {
  test(`${ID}: no supplied text (defaults and presets, EN and ES) carries an admissibility rule, an assessment, validity, a time limit, a duty or an outcome`, async () => {
    const def = (await import(`../../src/animations/review/${ID}.js`)).default;
    const all = [{name: 'default', params: def.defaultParams}, {name: 'es defaults', params: LOCALES.es}, ...presetsFor(ID)];
    const bad = [];
    for (const pr of all) walkStrings(pr.params, '', (v, path) => { if (BANNED.test(v)) bad.push(`${pr.name} ${path}: "${v}"`); });
    expect(bad, bad.join('\n')).toEqual([]);
  });
  test(`${ID}: no rendered text carries an admissibility rule, an assessment, validity, a time limit, a duty or an outcome`, async ({page}) => {
    test.setTimeout(300000);
    const {bad} = await forAll(page, ID, `
      const out = [];
      const re = new RegExp(arg.re, 'i');
      for (const u of [0.3, 1]) { x.seek(u * x.durationMs); for (const t of texts(svg, 0.05)) if (re.test(t.textContent)) out.push(pr.name + ' ' + ratio + ': "' + t.textContent.slice(0, 50) + '"'); }
      return out;`, {re: BANNED.source});
    expect(bad, bad.join('\n')).toEqual([]);
  });
}

// LAW-0338 — Revisión de documentos · mechanism. acceptanceCheck (brief): every connector ends on its element; the order
// does not change on seek; a relation is never drawn as causation by default.
const ES_WORDS = ['Original', 'file', 'Separate', 'folder', 'Decision', 'review', 'New', 'pieces', 'Divider', 'neutral', 'decides', 'nothing', 'Reason', 'noted', 'Index', 'assessment', 'calendar', 'Relation', 'arrow', 'Tracer', 'follows', 'order', 'focus', 'element', 'grows', 'unchanged', 'compartment', 'kept', 'supplied', 'conclusion', 'drawn', 'The', 'the'];

contractSuite(ID, {
  continuity: ['tracer', 'original', 'additional', 'divider'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.lifted.original === 0 && s.lifted.divider === 0 && s.drawn.every(v => v === 0) && s.pins === 0", label: 'rest: the box assembled, nothing drawn'},
    {at: 0.18, fn: "s.lifted.original === 1 && s.lifted.additional === 1 && s.lifted.divider === 1 && s.drawn.every(v => v === 0)", label: 'separated before any relationship is drawn'},
    {at: 0.43, fn: "s.drawn.every(v => v === 1) && s.tracerOn === 0", label: 'every supplied relationship drawn by the end of the relate beat'},
    {at: 0.6, fn: "s.tracerOn === 1 && s.visited.length >= 1 && s.visited.every((v, i) => v === s.order[i])", label: 'the tracer visits the elements in the supplied order'},
    {at: 0.72, fn: "s.focusK > 1.1", label: 'the focus element is enlarged once the tracer reached it'},
    {at: 1, fn: "s.drawn.every(v => v === 1) && s.pins === 1 && s.focusK === 1 && s.arrows === 0 && s.problems.length === 0", label: 'hold: every relationship and both states visible; no arrowed link by default'},
    {at: 1, params: {relationships: [{from: 'index', to: 'additional', kind: 'sequence'}]}, fn: "s.rels.length === 1 && s.arrows === 1", label: 'a supplied sequence is drawn as one'},
    {at: 0.6, params: {textVisibility: 'none'}, fn: "s.tracerOn === 1", label: 'labels hidden: the same mechanism'},
    {at: 0.1, fn: "s.beat === 'separate'", label: 'seeking back restores the separate beat'},
  ],
});

suppliedTextSuite(ID, {
  fields: `${FIELDS_PRELUDE} const lab = id => { const e = (p.elements || []).find(q => q.id === id); return e ? e.label : id === 'original' ? p.routes.original : id === 'additional' ? p.routes.additional : p.routes.divider; }; const kinds = [...new Set(p.relationships.map(q => q.kind))]; return [lab('original'), lab('additional'), lab('divider'), ...p.elements.map(e => e.label), p.decisions.title, p.grounds, ...p.pieces, ...kinds.map(k => p.relationLabels[k]), p.labels.tracer, p.labels.focus, p.outcomes.a, p.outcomes.b, p.labels.heading, p.labels.key];`,
  content: `${FIELDS_PRELUDE} return [p.routes.original, p.routes.additional, p.decisions.title, p.outcomes.a, p.outcomes.b];`,
  captions: `${FIELDS_PRELUDE} return [p.labels.tracer, p.labels.focus];`,
});

ratioChecks(ID, 'connectors end on their elements; composition fits', [
  {at: [0.5, 1], fn: "s.ends.every(e => [['a', e.from], ['b', e.to]].every(([k, id]) => { const b = s.boxes[id], q = e[k]; const dx = Math.max(b.x - q.x, 0, q.x - (b.x + b.w)), dy = Math.max(b.y - q.y, 0, q.y - (b.y + b.h)); return Math.hypot(dx, dy) <= 30; }))", label: 'every connector ends at its own element\'s edge'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="mech"]']});
noOverlapTest(ID, {markers: ['[data-node="tracer"]', '[data-node="pins"]']});
coldCreateTest(ID);
equalWeightTest(ID, {at: [1], marks: [['[data-node="lg-sa"] circle', '[data-node="lg-sb"] path:first-of-type'], ['[data-node="pin-a-g"]', '[data-node="pin-b-g"]']]});
// (connector lines carry a one-dash pattern only to draw on — they render solid; frameworks/annotate.js connector)
neutralityTest(ID, {dashOk: ['^ln\\d+-line$']});
noArrowsTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.7, 0.8, 1]});
fillMostTest(ID);
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
bannedTests();

// No arrowhead by default: with the default relationships (plain relations) no connector head is ever visible.
test(`${ID}: plain relations never show an arrowhead (default and baseline, every ratio)`, async ({page}) => {
  const {bad} = await forAll(page, ID, `
    const out = [];
    for (const u of [0.3, 0.6, 1]) { x.seek(u * x.durationMs); for (const e of svg.querySelectorAll('[data-node$="-head"]')) if (eff(svg, e) > 0.05) out.push(pr.name + ' ' + ratio + ': arrowhead ' + e.getAttribute('data-node')); }
    return out;`, {}, {presets: ['default', 'baseline-illustrative', 'baseline-es']});
  expect(bad, bad.join('\n')).toEqual([]);
});
