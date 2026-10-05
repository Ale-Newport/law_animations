// LAW-0270 — Acumulación de pretensiones · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends on its element; the order does not change on seek; a relation is
// never drawn as causality by default (no arrowheads unless a causal link is supplied).
// Windows (u): separate 0.02–0.17 (the claim folders travel rightwards, in from Party A's side); relationships drawn one
// by one 0.19–0.42; tracer 0.44–0.72 (default order partyA → claims → trays → caseFile); gather from 0.76 (one small
// folder per claim on the case file inside the supplied configuration's frame(s), its glyph and caption; the day mark).
// LEGAL: joint handling (●) and separate folders (◆) are supplied configurations of equal weight; each folder keeps its
// own label and is never erased or merged; no arrowheads by default; no rule for joining claims, time limit or effect.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, figuresAtLeast, fills, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, TEXT_LINES_VISIBLE, CONNECTOR_OFF_TEXT, relationLabelsNearest, connectorEndsOnTarget, NO_LONE_LINES, connectorEndsOnDrawn} from './acumulacion-checks.js';
import {stressRules, bannedWords, hiddenText, coldCreate, glyphChecks, esDefaults} from './acumulacion-common.js';

const ID = 'LAW-0270';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];
const BASE = ['default', 'baseline-illustrative', 'baseline-es', 'contrast-or-alternative'];
const FIG = '[data-node$="-badge"]';
const GL = glyphChecks('[data-node^="cf-gl"]');

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0.05, fn: "s.beat === 'separate' && s.relationsDrawn.every(v => v === 0) && !s.tracerVisible && s.gathered === 0 && s.claimsDx < 0", label: 'separate: nothing related yet; the claim folders start left of their place'},
    {at: 0.12, fn: "s.claimsDx < 0 && s.foldersOpacity === 1", label: 'the claim folders travel rightwards; none fades'},
    {at: 0.3, fn: "s.relationsDrawn.some(v => v > 0 && v < 1) || (s.relationsDrawn.some(v => v === 1) && s.relationsDrawn.some(v => v === 0))", label: 'relate: the supplied relationships are drawn one by one'},
    ...[0.22, 0.3, 0.38].map(u => ({at: u, fn: 's.relationsDrawn.every((v, i) => i === 0 || v <= s.relationsDrawn[i - 1])', label: `u=${u}: relationships drawn in the supplied order`})),
    {at: 0.43, fn: 's.relationsDrawn.every(v => v === 1) && s.arrows.every(a => !a.arrow) && !s.kinds.includes("causal") && s.claimsDx === 0', label: 'every supplied relationship drawn; none is causal and none has an arrowhead'},
    ...[0.43, 0.6, 1].map(u => ({at: u, fn: 's.connectorGaps.every(g => g <= 10)', label: `u=${u}: every connector ends on its element as drawn — the case file's outline, never its gather-only chip (gap <= 10 design units)`})),
    {at: 1, fn: 's.besidePairs.length === 0', label: 'no two connectors leave a shared component side by side'},
    {at: 0.58, fn: "s.tracerVisible && 'partyA,claims,trays,caseFile'.startsWith(s.visitOrder.join()) && s.gathered === 0", label: 'trace: the tracer follows the supplied order; nothing gathered yet'},
    {at: 1, fn: "s.gathered === 1 && s.markP === 1 && s.configuration === 'joint' && s.frames === 1 && s.glyphKinds.join() === 'initial' && s.visitOrder.join() === 'partyA,claims,trays,caseFile' && s.tracerParked && s.focusScale === 1", label: 'gather: one small folder per claim inside ONE frame (joint, ●); the supplied day is marked'},
    {at: 1, params: {configuration: 'separate'}, fn: "s.gathered === 1 && s.frames === s.folders && s.glyphKinds.join() === 'additional'", label: 'configuration separate (as supplied): one frame per folder (◆)'},
    {at: 1, fn: "s.truncated.length === 0 && s.labelsClear && s.labelsOffFaces && s.groupsClear && s.inFrame && s.crossed === 0 && s.clashes.length === 0", label: 'layout: nothing cut; labels and components clear; no connector through a third component'},
    {at: 1, params: {relationships: [{from: 'partyA', to: 'claims', kind: 'causal', label: 'causes (as supplied)'}, {from: 'claims', to: 'caseFile', kind: 'relation', label: 'kept'}], traversalOrder: ['partyA', 'claims']}, fn: 's.arrows[0].arrow === true && s.arrows[1].arrow === false', label: 'an arrowhead only on a supplied causal link'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.relationsDrawn.every(v => v === 1) && s.gathered === 1 && s.markP === 1', label: 'labels hidden: the same mechanism (relations, the gather, the day mark)'},
    ...['long-labels-stress', 'baseline-es', 'contrast-or-alternative'].map(n => ({at: 1, params: P(n), fn: 's.truncated.length === 0 && s.labelsClear && s.clashes.length === 0 && s.crossed === 0 && s.groupsClear', label: `${n}: nothing cut; labels and components clear`})),
  ],
});

suppliedTextSuite(ID, {
  fields: "const els = p.elements.map(e => e.label).filter(Boolean); const rel = p.relationships.map(r => r.label || p.relationLabels[r.kind]); return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, ...p.documents.claims, ...p.dates.window, p.stages.joint, p.stages.separate, ...els, ...rel];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Sequence as configured (illustrative)', 'Secuencia según la configuración (ilustrativa)'];",
});

const NO_ARROWS = `(() => !svg.querySelector('marker, [marker-end], [marker-start]') && ![...svg.querySelectorAll('[data-node$="-head"]')].some(e => e.closest('[data-node^="rel-c"]') && parseFloat(e.getAttribute('opacity') || '1') > 0))()`;
const KEY_SHOWN = `(() => /As supplied · no conclusion drawn|Según lo aportado · sin conclusión/.test([...svg.querySelectorAll('text')].map(t => t.textContent).join(' ').replace(/\\u00a0/g, ' ')))()`;
// every claim folder stays drawn, opaque and apart from the others at every sampled u (each keeps its own label; none is
// erased or merged)
const FOLDERS_DRAWN = `(() => { const e = svg.querySelector('[data-node="el-claims"]'); if (!e || parseFloat(getComputedStyle(e).opacity) !== 1) return false;
  const fs = [...svg.querySelectorAll('[data-node^="el-claims-f"]')].filter(f => /^el-claims-f\\d+$/.test(f.dataset.node)).map(f => f.getBoundingClientRect());
  return fs.length >= 2 && fs.every(b => b.width > 4) && fs.every((a, i) => fs.every((b, j) => i === j || Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) <= 1)); })()`;

ratioChecks(ID, 'faces clear, cards own their text, in frame, portraits readable, relation labels by their own connector', [
  {at: [0, 0.3, 0.6, 1], dom: FACES_CLEAR, label: 'no chip, label or text covers a portrait'},
  {at: [0.3, 0.65, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [0.1, 1], presets: BASE, ratios: ['16:9', '9:16'], dom: figuresAtLeast(60, FIG), label: 'portraits >= 60 px tall at 16:9 and 9:16'},
  {at: [0.1, 1], presets: BASE, ratios: ['1:1'], dom: figuresAtLeast(55, FIG), label: 'portraits >= 55 px tall at 1:1 (non-stress)'},
  {at: [0.1, 1], presets: ['long-labels-stress'], dom: figuresAtLeast(45, FIG), label: 'stress: portraits >= 45 px tall'},
  {at: [0.2, 1], dom: fills(0.85, 0.6), label: 'the diagram fills the caption-safe box (once separated, and at the hold)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['rl']), label: 'relation labels beside their connectors (leader <= 40 px), leaders cross no text'},
  {at: [0.45, 1], tv: ['all'], dom: relationLabelsNearest(20), label: 'RENDERED: each relation label is >= 20 px nearer its own connector than any other'},
  {at: times(0, 1, 0.04), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [0, 0.7, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: [1], dom: GL.neutral, label: 'LEGAL: version glyphs are only ● / ◆ — no ticks, no green'},
  {at: [1], dom: GL.equal, label: 'LEGAL: ● and ◆ have equal weight'},
  {at: [1], params: {configuration: 'separate'}, dom: GL.neutral, label: 'LEGAL: separate — glyphs are only ● / ◆'},
  {at: times(0, 1, 0.1), dom: FOLDERS_DRAWN, label: 'LEGAL: every claim folder stays drawn, opaque and apart throughout (none is erased or merged)'},
  {at: [0.5, 1], dom: NO_ARROWS, label: 'no arrowheads (no causal link is supplied in the presets)'},
  {at: [0, 1], tv: ['all'], dom: KEY_SHOWN, label: 'the "as supplied · no conclusion drawn" key is shown'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02)'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no portrait is drawn over visible text'},
  {at: times(0.18, 1, 0.02), dom: CONNECTOR_OFF_TEXT, label: 'RENDERED: no connector runs under or over text (every 0.02)'},
  {at: times(0.18, 1, 0.02), dom: connectorEndsOnTarget(8), label: 'RENDERED: every drawn connector ends within 8 px of its component as drawn at that u (a chip counts only while shown)'},
]);

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

esDefaults(ID, [0.5, 1], '|relation|communication|tray|each|brought|shown|own')

ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 0.3, 0.65, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a component, a connector or a portrait'},
]);
hiddenText(ID, [0, 0.3, 0.6, 1]);

ratioChecks(ID, 'no one-word lines', [
  {at: times(0, 1, 0.05), tv: ['all'], dom: NO_LONE_LINES, label: 'RENDERED: no wrapped title, chip, tag, plate, card or label has a one-word line (every 0.05; es-only too)'},
  {at: [0.3, 0.6, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: NO_LONE_LINES, label: 'RENDERED: es-only — no one-word line'},
]);
ratioChecks(ID, 'connectors land on their drawn targets', [
  {at: times(0.18, 1, 0.02), dom: connectorEndsOnDrawn(8), label: 'RENDERED: every drawn connector ends within 8 px of the DRAWN outline of its component (never its label chip), u 0.18–1 every 0.02'},
]);
stressRules(ID, {test, expect});
bannedWords(ID, {test, expect});
coldCreate(ID, {test, expect});

// thin windows: each relationship is drawn over >= 300 ms; the rightward travel lasts >= 600 ms
test(`${ID}: thin windows measured — travel and relationship drawing`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  for (const pr of ALL) {
    const dur = def.defaultParams.durationMs;
    const rows = [];
    for (let t = 0; t <= dur; t += 1000 / 60) rows.push(def.evaluate({width: 1920, height: 1080, params: pr.params, timeMs: t}).semantic);
    expect(rows.filter(s => s.claimsDx < 0 && s.separated > 0).length * 1000 / 60, `${pr.name} travel ms`).toBeGreaterThanOrEqual(600);
    for (let k = 0; k < rows[0].relationsDrawn.length; k++) expect(rows.filter(s => s.relationsDrawn[k] > 0 && s.relationsDrawn[k] < 1).length * 1000 / 60, `${pr.name} relation ${k} draw ms`).toBeGreaterThanOrEqual(300);
  }
});

// DOM-less sweep: every preset × ratio × labels evaluates at every 0.05 of u; the order of visits never changes on
// seek; the claim folders only move rightwards toward their place (shrinking offset); nothing is cut or crowded
test(`${ID}: DOM-less sweep — preset × ratio × labels`, async () => {
  const def = (await import(`../../src/animations/civil-claim/${ID}.js`)).default;
  const dur = def.defaultParams.durationMs;
  for (const pr of ALL) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const tv of ['all', 'key', 'none']) {
    const order = (pr.params.traversalOrder || def.defaultParams.traversalOrder).join();
    let pa = -Infinity;
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const s = def.evaluate({width: w, height: h, params: {...pr.params, textVisibility: tv}, timeMs: Math.min(dur, u * dur)}).semantic;
      const tag = `${pr.name} ${w}x${h} ${tv} u=${u.toFixed(2)}`;
      expect(order.startsWith(s.visitOrder.join()), tag).toBe(true);
      if (u >= 0.44) expect(s.relationsDrawn.every(v => v === 1), tag).toBe(true);
      expect(s.arrows.every(a => !a.arrow), tag).toBe(true);
      expect(s.claimsDx <= 0 && s.claimsDx >= pa - 1e-6, tag).toBe(true);
      pa = s.claimsDx;
      expect(s.truncated, tag).toEqual([]);
      expect(s.labelsClear && s.labelsOffFaces && s.groupsClear && s.inFrame && s.crossed === 0, tag).toBe(true);
      expect(Math.max(...s.connectorGaps), `${tag} connector gap`).toBeLessThanOrEqual(10);
      expect(s.besidePairs, `${tag} connectors side by side`).toEqual([]);
    }
  }
});
