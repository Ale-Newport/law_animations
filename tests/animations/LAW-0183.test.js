// LAW-0183 — Interpretación lingüística · contrast. Contract battery + ID-specific checks encoding the
// brief's acceptanceCheck: both scenes exist, exactly the indicated fact changes (whether an interpreter
// renders the words — it changes people, relations and sequence, not only text or colour), and no legal
// consequence is invented (no winner, ranking or outcome; equal treatment of A and B).
// Windows (LAW-0183.js W): labels 0.17–0.22; B's interpreter is at her seat, whole and opaque, from 0.20
// (settles by 0.30), her name chip 0.30–0.36; the first
// speaker's bubble 0.40–0.44 in both; A: ribbon to the listener 0.46–0.55; B: notes 0.45–0.545, rendering
// 0.60–0.64, ribbon 0.63–0.71, listener turns 0.63–0.69; highlights 0.77–0.80, guide 0.79–0.85, strip and
// key complete by 0.90.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {NO_CARD_ON_FACE, LABEL_OWNS_CONNECTOR, MIN_HEAD_PX, FRAME, sceneShare, chipNearInterpreter, GUIDE_CLEAR} from './interpretacion-linguistica-checks.js';

contractSuite('LAW-0183', {
  continuity: ['handAa', 'farAa', 'handBa', 'handAb', 'farAb', 'handBb', 'handIL', 'handIR', 'pen'],
  continuityLimit: 45,
  attach: [
    // while B's interpreter writes, the solved pen nib is on the stroke
    {from: 0, to: 1, a: 'pen', b: 'noteTarget', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.bubbleS === 0 && s.b.entered === 0', label: 'base: two identical scenes at rest'},
    {at: 0.25, fn: 's.b.entered > 0 && s.b.entered < 1 && s.b.interpreterOpaque === 1 && s.a.entered === 0 && s.a.interpreterOpaque === 0 && s.a.bubbleS === 0 && s.b.bubbleS === 0', label: 'change: only in B is an interpreter at the table — whole and opaque while she settles'},
    {at: 0.19, fn: 's.b.entered === 0 && s.b.interpreterOpaque === 0', label: 'before her entrance the seat is empty in B too'},
    {at: 0.47, fn: 's.a.bubbleS === 1 && s.b.bubbleS === 1 && s.a.ribbon > 0 && s.b.ribbon === 0 && s.b.notes[0] > 0 && s.b.rendering === 0', label: 'parallel: the same words in both; A goes straight to the listener, B is noted first'},
    {at: 0.62, fn: 's.a.ribbon === 1 && s.a.dstTurned === 1 && s.b.rendering > 0 && s.b.ribbon === 0', label: 'B adds a step: the rendering in the interpreter’s own bubble'},
    {at: 0.75, fn: 's.b.ribbon === 1 && s.b.dstTurned === 1 && !s.b.speakingI && s.a.rendering === 0 && s.b.rendering === 1', label: 'both paths complete before the guide beat'},
    {at: 1, fn: "s.relationsShown.a.length === 1 && s.relationsShown.b.length === 2 && s.relationsDrawn.b.every(t => t.length > 0)", label: 'the supplied relationships are drawn: A between the speakers, B through the interpreter'},
    {at: 1, params: {relationships: [{from: 'a', to: 'b', kind: 'relation', label: 'Same room'}, {from: 'a', to: 'interpreter', kind: 'sequence', label: 'First to her'}, {from: 'interpreter', to: 'b', kind: 'sequence', label: 'Then to the listener'}]}, fn: "s.relationsShown.a[0] === 'a>b:relation' && s.relationsShown.b.join() === 'a>interpreter:sequence,interpreter>b:sequence'", label: 'relationships are editable: kinds and labels follow the parameter'},
    {at: 1, fn: "s.guideProgress === 1 && s.ringsShown === 1 && s.stripShown === 1 && s.keyShown === 1 && s.allReached && s.partiesSameSize && s.changedFact.length > 0 && s.a.bubbleS === 1 && s.b.bubbleS === 1", label: 'hold: equal highlights, guide, shared facts, neutral note and key'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.ribbon === 1 && s.b.ribbon === 1 && s.b.rendering === 1 && s.a.rendering === 0 && s.b.entered === 1 && s.a.entered === 0 && s.guideProgress === 1', label: 'the contrast plays identically with labels hidden'},
  ],
});

identicalBeforeChange('LAW-0183', 0.17);

// coordinator decision 2026-09-26 (see SESSION_HANDOFF): LAW-0183 1:1 default/baseline — primary ≥ 19.5, secondary ≥ 18.0
// Standard battery: every supplied field drawn un-truncated; the standard floors apply to the PRIMARY supplied
// content (the bubbles' words, their language tabs, the interpreter's name — texts that appear only in primary
// elements) in every preset × ratio; generic captions never exceed it. The speakers' names (also repeated in the
// shared strip at 1:1) and every other text are checked by the tiered test below.
suppliedTextSuite('LAW-0183', {
  fields: `const role = id => p.roles[id];
    return [p.actors[0].name, p.actors[1].name, p.actors[2].name, role('a'), role('b'), role('interpreter'), p.languages.a, p.languages.b,
      p.props.utterance, p.props.rendering, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption,
      p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]`,
  content: 'return [p.actors[2].name, p.languages.a, p.languages.b, p.props.utterance, p.props.rendering]',
  captions: `return p.locale === 'es' ? ['Según lo aportado · sin conclusión'] : ['As supplied · no conclusion drawn']`,
});

// Tiered text sizes (px at 1080p, at the hold). Primary = the bubbles' words, the language tabs and the people's
// name chips; secondary = every other visible text (cards, relation labels, strip, guide, note, key).
//  - default / baseline-illustrative: primary ≥ 19.5 everywhere; secondary ≥ 19.5 at 16:9 and 9:16 and ≥ 18.0 at 1:1
//    (the named exception above, 1:1 only);
//  - baseline-es: the same two tiers at 1:1;
//  - every text in every preset × ratio ≥ 16 (stress floor).
test('LAW-0183: tiered text sizes (primary / secondary) per preset × ratio', async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0183')];
  const rows = await page.evaluate(async ([presets]) => {
    const def = await window.__lib.load('LAW-0183');
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready;
      x.seek(x.durationMs);
      const svg = x.element, rootM = svg.getScreenCTM(), k = 1080 / Math.min(w, h);
      const shown = t => { for (let n = t; n && n.tagName !== 'svg'; n = n.parentNode) { const op = n.getAttribute && n.getAttribute('opacity'); if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false; } const b = t.getBBox(); return b.width > 0 && b.height > 0 && !t.closest('[data-layer="content-notice"]'); };
      const px = t => { const m = rootM.inverse().multiply(t.getScreenCTM()); return Math.round(parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k * 10) / 10; };
      const primary = t => Boolean(t.closest('[data-node$="bubS-txt"], [data-node$="bubR-txt"], [data-node$="-tabtxt"]') || t.closest('[data-node*="chip-"]'));
      // (single-letter badge marks "A" / "B" are decorative, not supplied text)
      const texts = [...svg.querySelectorAll('text')].filter(t => shown(t) && (t.textContent || '').trim().length > 1);
      const P = texts.filter(primary).map(px), Sx = texts.filter(t => !primary(t)).map(px);
      out.push({preset: pr.name, ratio, primary: P.length ? Math.min(...P) : null, secondary: Sx.length ? Math.min(...Sx) : null, nP: P.length});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets]);
  console.log(JSON.stringify(rows.map(r => [r.preset, r.ratio, r.primary && +r.primary.toFixed(1), r.secondary && +r.secondary.toFixed(1)])));
  for (const r of rows) {
    const tag = `${r.preset} ${r.ratio}`;
    const base = r.preset === 'default' || r.preset === 'baseline-illustrative';
    const tiered = (base || r.preset === 'baseline-es') && r.ratio === '1:1';
    expect.soft(r.nP, `${tag}: primary texts found`).toBeGreaterThan(0);
    expect.soft(r.primary, `${tag}: primary text px`).toBeGreaterThanOrEqual(base || tiered ? 19.5 : 16);
    expect.soft(r.secondary, `${tag}: secondary text px`).toBeGreaterThanOrEqual(tiered ? 18.0 : base ? 19.5 : 16);
  }
});

ratioChecks('LAW-0183', 'scenes stay large; equal headers; no card over a face; the guide label on its guide', [
  // each scene ≥ 40 % of the frame width side by side, ≥ 80 % stacked; the pair and strip fill the height
  {at: [1], fn: "s.labelsFit && (s.arrangement === 'row' ? s.sceneFrac >= 0.4 : s.sceneFrac >= 0.8) && s.vFill >= 0.72", label: 'labels fit; scenes ≥ 40 % of the frame side by side, ≥ 80 % stacked; the layout fills the height'},
  // equal visual weight: same header line counts for A and B (label and caption)
  {at: [1], fn: 's.headerLines[0] === s.headerLines[1] && s.headerLines[2] === s.headerLines[3] && s.partiesSameSize && s.ringsEqual', label: 'equal A/B headers (line counts), parties the same size, equal highlights', tv: ['all']},
  {at: [0, 0.2, 0.3, 0.36, 0.45, 0.5, 0.55, 0.6, 0.7, 1], fn: 's.allReached', label: 'every IK target reached'},
  {at: [0.3, 0.42, 0.5, 0.6, 0.62, 0.7, 0.8, 0.9, 1], dom: NO_CARD_ON_FACE, label: 'rendered: no bubble, header or chip covers a head or face'},
  {at: [1], dom: LABEL_OWNS_CONNECTOR, label: 'rendered: every relation label and the guide label sit on their own lines', tv: ['all']},
  // review round 2 (coordinator): figures at least as large as LAW-0163's (smallest head, px at 1080p)
  {at: [1], dom: `(${MIN_HEAD_PX}) >= ({landscape: 126, portrait: 118, square: 79})[${FRAME}]`, label: 'rendered: heads ≥ 126 / 118 / 79 px (16:9 / 9:16 / 1:1)', presets: ['baseline-illustrative', 'contrast-or-alternative', 'baseline-es']},
  {at: [1], dom: `${FRAME} !== 'landscape' || (${MIN_HEAD_PX}) >= 103`, label: 'rendered: under stress at 16:9 heads ≥ 103 px', presets: ['long-labels-stress']},
  {at: [1], dom: sceneShare(0.4, 0.8), label: 'rendered: each scene ≥ 40 % of the frame width side by side, ≥ 80 % stacked'},
  {at: [0.36, 0.6, 1], dom: chipNearInterpreter(60), label: 'rendered: the interpreter’s name chip is right under her (≤ 60 px), not in a bottom row', tv: ['all']},
  {at: [0.85, 0.9, 1], dom: GUIDE_CLEAR, label: 'rendered: the guide line crosses no card, chip or label and runs along no chip border'},
]);
