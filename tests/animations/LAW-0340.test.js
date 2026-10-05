// LAW-0340 — Revisión de documentos · inspect. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {jurisdictionTest, stressLongerTest} from './solicitud-autorizacion-checks.js';
import {LOCALES} from '../../src/animations/review/LAW-0340.js';

const ID = 'LAW-0340';
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

// LAW-0340 — inspect. acceptanceCheck (brief): the detail keeps its source coordinates (the lens is a real enlarged copy
// of the record plate), the change is localised (only the mark, X's strip and X's folder), and seeking back restores
// the previous datum exactly.
const ES_WORDS = ['Original', 'file', 'Separate', 'folder', 'Decision', 'review', 'New', 'pieces', 'Divider', 'neutral', 'decides', 'nothing', 'Reason', 'noted', 'Before', 'After', 'lies', 'Record', 'plate', 'board', 'calendar', 'Changed', 'mark', 'supplied', 'conclusion', 'drawn', 'room', 'filing', 'was', 'The', 'the'];

contractSuite(ID, {
  continuity: ['x'],
  semantic: [
    {at: 0, fn: "s.beat === 'build' && s.value === 'before' && s.xIn === 'A' && s.lensOpen === 0 && s.marker === 0", label: 'build: the before value; X with the original file'},
    {at: 0.35, fn: "s.lensOpen === 1 && s.lensValue === 'before' && s.ctxValueOp === 0 && s.zoom >= 1.5", label: 'isolate: the lens holds the only legible copy of the value, >= 1.5x'},
    {at: 0.6, fn: "s.lensValue === 'after' && s.xIn === 'A'", label: 'the substitution happens in the lens first; X has not moved yet'},
    {at: 0.7, fn: "s.value === 'after' && s.xIn === 'moving'", label: 'only then the dependent geometry: X is lifted over the divider'},
    {at: 1, fn: "s.value === 'after' && s.xIn === 'B' && s.x.x > s.dividerX && s.marker === 1 && s.lensOpen === 0 && s.problems.length === 0", label: 'return: X in folder B, the changed marker shown'},
    {at: 0.3, fn: "s.datum === s.datum && s.value === 'before' && s.xIn === 'A'", label: 'seeking back restores the before datum and X\'s place exactly'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1", label: 'labels hidden: the same inspection'},
  ],
});

suppliedTextSuite(ID, {
  fields: `${FIELDS_PRELUDE} return [p.focusPiece, p.afterValue, p.routes.original, p.routes.additional, p.routes.divider, p.decisions.title, p.grounds, ...p.pieces, p.outcomes.a, p.outcomes.b, p.objectLabels.record, p.objectLabels.calendar, p.contextLabels.context, p.contextLabels.marker, p.labels.heading, p.labels.key];`,
  content: `${FIELDS_PRELUDE} return [p.focusPiece, p.afterValue, p.outcomes.a, p.outcomes.b];`,
  captions: `${FIELDS_PRELUDE} return [p.objectLabels.record, p.objectLabels.calendar];`,
});

ratioChecks(ID, 'one legible copy of the value at a time; the lens is a real magnification; seek restores', [
  {at: times(0, 1, 0.004), fn: '!(s.ctxValueOp > 0.15 && s.lensValueOp > 0.15)', label: 'the value is never legible in the context and in the lens at once'},
  {at: [0.3, 0.4, 0.5], fn: 's.zoom >= 1.5 && s.lensMinFrac >= 0.35', label: 'the lens is >= 1.5x and >= 0.35 of the frame\'s short side'},
  {at: [0.1, 0.3, 0.45], fn: "s.value === 'before' && s.xIn === 'A'", label: 'before the substitution the old datum and place hold'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="lens-win"]', '[data-node="rm-held"]']});
noOverlapTest(ID, {markers: ['[data-node="marker"]', '[data-node="rm-held"]'], opaque: ['[data-node="lens-win"]']});
coldCreateTest(ID);
neutralityTest(ID, {dashOk: ['^lens-cone']});
noArrowsTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.6, 0.7, 0.8, 1]});
fillMostTest(ID);
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
bannedTests();

// The new value is readable and still for >= 400 ms in the lens, and the old one stays docked to the end.
test(`${ID}: the new value holds still in the lens >= 400 ms; the old value stays docked ("was") at the hold`, async ({page}) => {
  const {bad} = await forAll(page, ID, `
    const out = [];
    let run = 0, best = 0;
    for (let ms = 0; ms <= x.durationMs; ms += 1000 / 60) { x.seek(ms); const s = x.getState({bounds: false}).semantic; run = s.lensValue === 'after' && s.lensValueOp > 0.95 ? run + 1000 / 60 : 0; best = Math.max(best, run); }
    if (best < 400) out.push(pr.name + ' ' + ratio + ': new value still for ' + Math.round(best) + ' ms');
    x.seek(x.durationMs);
    if (eff(svg, node(svg, 'rm-was')) < 0.95) out.push(pr.name + ' ' + ratio + ': old value not docked at the hold');
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});
