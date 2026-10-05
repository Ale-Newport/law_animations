// LAW-0339 — Revisión de documentos · contrast. Contract battery + ID-specific checks.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  forAll, report, textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest,
  equalWeightTest, neutralityTest, noArrowsTest, seekHistoryTest, fillMostTest, thinContentTest, esDefaultsTest,
} from './apertura-audiencia-checks.js';
import {jurisdictionTest, stressLongerTest} from './solicitud-autorizacion-checks.js';
import {LOCALES} from '../../src/animations/review/LAW-0339.js';

const ID = 'LAW-0339';
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

// LAW-0339 — contrast. acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (the mark on the
// piece → where it is laid), no legal consequence is invented. People floors: >= 60 px off 1:1, >= 55 px at 1:1,
// long-labels-stress >= 45 px.
const FLOOR_FOR = "const st = preset.replace(' (labels hidden)', '') === 'long-labels-stress'; if (st) return 45; return ratio === '1:1' ? 55 : 60;";
const ES_WORDS = ['Original', 'file', 'Separate', 'folder', 'Decision', 'review', 'New', 'pieces', 'Divider', 'neutral', 'decides', 'nothing', 'Reason', 'noted', 'Participant', 'mark', 'piece', 'differs', 'Same', 'room', 'laid', 'configured', 'Where', 'ends', 'rule', 'preferred', 'supplied', 'conclusion', 'drawn', 'The', 'the'];

contractSuite(ID, {
  continuity: ['pieceA', 'pieceB', 'personA', 'personB', 'handA', 'handB'],
  semantic: [
    {at: 0, fn: "s.beat === 'base' && s.stripe === 0 && s.a.loc === 'tray' && s.b.loc === 'tray' && s.guide === 0", label: 'base: two identical rooms, the piece plain in both'},
    {at: 0.35, fn: "s.stripe === 1 && s.a.loc === 'tray' && s.b.loc === 'tray'", label: 'the change beat marks the pieces; nothing moves yet'},
    {at: 0.6, fn: "s.a.reaching > 0.99 && s.b.reaching > 0.99", label: 'both participants carry their piece in parallel'},
    {at: 1, fn: "s.a.loc === 'slotO' && s.b.loc === 'slotN' && s.pieceA.x < s.a.dividerX && s.b.piece.x > s.b.dividerX && s.guide === 1 && s.allReached && s.problems.length === 0", label: 'hold: A laid with the original file (left of the divider), B in folder B (right of it); the guide shows'},
    {at: 0.5, params: {textVisibility: 'none'}, fn: "s.stripe === 1", label: 'labels hidden: the same change'},
    {at: 0.1, fn: "s.beat === 'base'", label: 'seeking back restores the base state'},
  ],
});

identicalBeforeChange(ID, 0.17);

suppliedTextSuite(ID, {
  fields: `${FIELDS_PRELUDE} return [p.scenarioA.label, p.scenarioB.label, p.scenarioA.caption, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.routes.original, p.routes.additional, p.routes.divider, p.decisions.title, p.grounds, ...p.pieces, p.courier.label, p.outcomes.a, p.outcomes.b, p.comparisonLabels.guide, p.comparisonLabels.neutral, p.labels.heading, p.labels.key];`,
  content: `${FIELDS_PRELUDE} return [p.scenarioA.label, p.scenarioB.label, p.changedFact, p.outcomes.a, p.outcomes.b];`,
  captions: `${FIELDS_PRELUDE} return [p.comparisonLabels.guide];`,
});

ratioChecks(ID, 'pieces only in the hands; B never crosses the divider; composition fits', [
  {at: times(0, 1, 0.005), fn: '[s.a, s.b].every(q => q.lift === 0 || q.reaching > 0.99)', label: 'a piece only moves while both hands are on it'},
  {at: times(0, 1, 0.01), fn: 's.b.piece.x > s.b.dividerX', label: 'in B the piece never passes to folder A\'s side'},
  {at: times(0.4, 0.78, 0.01), fn: 's.allReached', label: 'the hands stay within reach'},
  {at: [1], tv: ['all'], fn: 's.problems.length === 0', label: 'the composition fits'},
]);

textFloorTest(ID);
inFrameTest(ID, {clipped: ['[data-node="ra-held"]', '[data-node="rb-held"]', '[data-node="guide"]']});
noOverlapTest(ID, {markers: ['[data-node="guide"]', '[data-node="ra-held"]', '[data-node="rb-held"]']});
coldCreateTest(ID);
peopleSizeTest(ID, {re: '^r[ab]-p0$', floorFor: FLOOR_FOR});
neutralityTest(ID);
noArrowsTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
seekHistoryTest(ID, {at: [0.1, 0.3, 0.5, 0.65, 0.8, 1]});
fillMostTest(ID);
thinContentTest(ID);
esDefaultsTest(ID, {words: ES_WORDS});
bannedTests();

// Equal weight: both rooms at the same rendered scale and both headers' badges the same size, every preset × ratio.
test(`${ID}: rooms A and B are drawn at the same scale and their badges the same size`, async ({page}) => {
  const {bad} = await forAll(page, ID, `
    const out = [];
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    x.seek(x.durationMs);
    const a = node(svg, 'ra-walls').getBoundingClientRect(), b = node(svg, 'rb-walls').getBoundingClientRect();
    if (Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5) out.push(pr.name + ' ' + ratio + ': rooms differ');
    const ba = node(svg, 'hdr-a').querySelector('circle').getBoundingClientRect(), bb = node(svg, 'hdr-b').querySelector('circle').getBoundingClientRect();
    if (Math.abs(ba.width - bb.width) > 0.5) out.push(pr.name + ' ' + ratio + ': badges differ');
    return out;`, {}, {withHidden: true});
  expect(bad, bad.join('\n')).toEqual([]);
});

// Nothing teleports (60 fps rendered): pieces, participants and hands move < 40 px per frame.
test(`${ID}: the pieces and the participants move continuously (60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  const {bad, stats} = await forAll(page, ID, `
    const out = [];
    let prev = null, worst = 0;
    for (let ms = 0; ms <= x.durationMs + 1e-6; ms += 1000 / 60) {
      x.seek(ms);
      const s = x.getState({bounds: false}).semantic;
      const now = [s.pieceA, s.pieceB, s.personA, s.personB, s.handA, s.handB];
      if (prev) now.forEach((q, i) => { if (q && prev[i]) worst = Math.max(worst, Math.hypot(q.x - prev[i].x, q.y - prev[i].y) * s.pxu); });
      prev = now;
    }
    stat('max move px/frame ' + ratio, Math.round(worst), 'max');
    if (worst > 40) out.push(pr.name + ' ' + ratio + ': something jumps ' + Math.round(worst) + ' px');
    return out;`, {}, {withHidden: true});
  report(ID, 'continuity', stats);
  expect(bad, bad.join('\n')).toEqual([]);
});
