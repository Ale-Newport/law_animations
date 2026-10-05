import {test, expect} from '@playwright/test';
// LAW-0687 — Prueba contrafactual causal · contrast. Contract battery + ID-specific checks.
// acceptanceCheck (brief): both scenes exist, exactly the indicated fact changes (only the selected event is taken out
// of B's model) and no legal consequence is invented (B's result is the SUPPLIED one; nothing is concluded).
// Windows (LAW-0687.js W): headers/rings 0.17–0.24 · B's claw down 0.22–0.28, grip 0.28–0.295, lift 0.295–0.35 ·
// both runs 0.40–0.72 · results 0.76–0.81 · guide 0.77–0.84 · notes 0.80–0.86 · key 0.82–0.87.
// coordinator decision 2026-09-26: 0687 stress lengths capped to fit 1:1 at 16 px (near-max not achievable; see SESSION_HANDOFF)
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite, identicalBeforeChange} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0687';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['bobA', 'bobB', 'clawB', 'gripB', 'a0', 'a1', 'a2', 'a3', 'a4', 'b0', 'b1', 'b2', 'b3', 'b4'],
  attach: [
    // B's claw carries the removed tile by its top from the lift to the end
    {from: 0.295, to: 1, a: 'clawB', b: 'gripB', tol: 1.5},
  ],
  semantic: [
    {at: 0.1, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && s.a.lossState[0] === "intact"', label: 'base: two identical complete scenes'},
    {at: 0.36, fn: 's.b.lift === 1 && s.a.lift === 0 && s.a.angles.every(v => v === 0) && s.b.angles.every(v => v === 0)', label: 'change: only B’s selected event is lifted out, before anything moves'},
    {at: 0.36, fn: 'JSON.stringify(s.a.angles) === JSON.stringify(s.b.angles) && JSON.stringify(s.a.lossState) === JSON.stringify(s.b.lossState)', label: 'the rest of the two models is the same'},
    {at: 0.47, fn: 's.bobA.y === s.bobB.y && s.a.angles[0] > 0 && s.a.angles[0] === s.b.angles[0]', label: 'parallel: same trigger, same frames'},
    {at: 1, fn: "s.a.lossState[0] === 'down' && s.a.started.every(Boolean)", label: 'A: with the event present the chain reaches the loss (as supplied)'},
    {at: 1, fn: "s.withoutResult === 'loss-does-not-occur' && s.b.lossState[0] === 'intact' && s.b.bridge === null && s.b.angles[s.selected - 1] > 80", label: 'B: supplied result "does not occur" — the tile before the gap lies in the empty slot'},
    {at: 1, params: {withoutResult: 'loss-still-occurs'}, fn: "s.b.lossState[0] === 'down' && s.b.bridge !== null && s.a.lossState[0] === 'down'", label: 'B: supplied result "still occurs" — the tile before the gap reaches the next tile'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.selected === 2 && s.b.lossState.every(x => x === 'down')", label: 'alternative preset: event 3 removed; as supplied both losses still occur in B'},
    {at: 1, fn: 's.guideProgress === 1 && s.resultsShown', label: 'the guide joins the changed detail; both supplied results shown'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.b.lift === 1 && s.a.lossState[0] === 'down' && s.b.lossState[0] === 'intact'", label: 'labels hidden: the same physical contrast'},
  ],
});

identicalBeforeChange(ID, 0.17);

ratioChecks(ID, 'layout fits; scenes large; side by side or full width', [
  {at: [1], fn: 's.layout.k >= 0.999', label: 'the block fits without a fallback scale'},
  {at: [1], fn: 's.layout.row ? s.layout.stageW / s.layout.blockW >= 0.4 : s.layout.stageW / s.layout.blockW >= 0.8', label: 'each scene (its floor and gantry) >= ~40 % of the width side by side / full width when stacked'},
  {at: times(0.4, 0.72, 0.02), fn: 's.a.started[s.selected] || JSON.stringify(s.a.angles) === JSON.stringify(s.b.angles.map((v, i) => (i === s.selected ? 0 : v)))', label: 'until A’s selected tile is reached both scenes move identically'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.scenarioA.label, p.scenarioB.label, p.changedFact]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Review round 1 (2026-09-26): EVERY visible text (tags, lamps, key, chips, glyphs such as "?", "A", "B") is >= 16 px at
// 1080p at every sampled u in every preset × ratio, and >= 19.5 px in the default, baseline-illustrative and baseline-es
// presets (pattern of LAW-0194 / LAW-0196).
test.describe('LAW-0687 text size over time', () => {
  test('LAW-0687: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u', async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0687')];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          for (let u = 0; u <= 1.0001; u += 0.02) {
            x.seek(u * x.durationMs);
            const s0 = svg.getScreenCTM().a;
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
              const b = t.getBoundingClientRect();
              if (b.width < 0.5) continue;
              const fs = parseFloat(getComputedStyle(t).fontSize);
              const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px < ${floor}`);
            }
          }
          x.destroy();
          el.remove();
        }
      }
      return [...new Set(out)].slice(0, 40);
    }, ['LAW-0687', presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
