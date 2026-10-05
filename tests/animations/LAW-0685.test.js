import {test, expect} from '@playwright/test';
// LAW-0685 — Prueba contrafactual causal · story. Contract battery + ID-specific checks.
// acceptanceCheck (brief): continuity of motion, anchoring of objects (the claw holds the removed tile by its
// top from the moment it lifts it; each tile only moves once something touches it) and a transformation that is
// recognizable with the labels hidden.
// Windows (LAW-0685.js W): run 1 0.09–0.30 · rewind 0.31–0.49 · claw down 0.49–0.535, grip 0.535–0.55,
// lift 0.55–0.605 · replay 0.61–0.82 · result 0.79–0.84 · key 0.81–0.86 · notes 0.82–0.87.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0685';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['bob', 'claw', 'gripPt', 'tile0', 'tile1', 'tile2', 'tile3', 'loss0'],
  attach: [
    // the claw's grip point rides on the removed tile's top from the grip to the end
    {from: 0.55, to: 1, a: 'claw', b: 'gripPt', tol: 1.5},
  ],
  semantic: [
    {at: 0, fn: "s.run === 'with' && s.angles.every(a => a === 0) && s.lossState[0] === 'intact' && s.lift === 0 && s.grip === 0", label: 'rest: the model as supplied, every event present, loss intact'},
    {at: 0.13, fn: "s.run === 'with' && s.angles[0] > 0 && s.angles.slice(1).every(a => a === 0)", label: 'run 1: the bob starts the first tile only'},
    {at: 0.2, fn: 's.started.every((st, i) => i === 0 || !st || s.started[i - 1])', label: 'run 1: no tile starts before the one before it'},
    {at: 0.3, fn: "s.run === 'with' && s.started.every(Boolean) && s.lossState[0] === 'down' && s.cracked[0] === 1", label: 'run 1 with the event: the chain reaches the loss (as supplied)'},
    {at: 0.4, fn: "s.phase === 'rewind' && s.tau > 0 && s.tau < 0.3", label: 'rewind: the same take runs backwards'},
    {at: 0.49, fn: "s.run === 'with' && s.angles.every(a => a === 0) && s.lossState[0] === 'intact' && s.cracked[0] === 0", label: 'after the rewind everything stands again, the crack is gone'},
    {at: 0.54, fn: "s.run === 'with' && s.lift === 0 && s.angles[s.selected] === 0", label: 'the claw reaches the selected tile before anything is lifted'},
    {at: 0.61, fn: "s.run === 'without' && s.lift === 1 && s.removed", label: 'the selected event is lifted out of the model before the replay'},
    {at: 0.62, fn: 's.angles.every((a, i) => i === 0 || a === 0)', label: 'the replay starts the same way'},
    {at: 1, fn: "s.finalState === 'loss-does-not-occur' && s.lossState[0] === 'intact' && s.cracked[0] === 0 && s.angles[s.selected - 1] > 80 && s.angles.slice(s.selected + 1).every(a => a === 0) && s.bridge === null", label: 'supplied result "does not occur": the tile before the gap lies in the empty slot; downstream stands; loss intact'},
    {at: 1, params: {finalState: 'loss-still-occurs'}, fn: "s.lossState[0] === 'down' && s.cracked[0] === 1 && s.bridge !== null && s.started.every((st, i) => i === s.selected || st)", label: 'supplied result "still occurs": the tile before the gap reaches the tile after it; the loss is reached'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.selected === 2 && s.lossState.every(x => x === 'down') && s.bridge !== null", label: 'alternative preset: event 3 removed; as supplied the loss still occurs (both loss objects)'},
    {at: 1, params: {actionProgress: 0.3}, fn: "s.run === 'with' && s.lift === 0", label: 'actionProgress freezes the action part-way (before the removal)'},
    {at: 1, params: {selectedEvent: 5}, fn: 's.selected === 2', label: 'the selected event is kept between 1 and n − 2 (never the first or last)'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: "s.run === 'without' && s.lift === 1 && s.lossState[0] === 'intact' && s.angles[0] > 80", label: 'labels hidden: the same physical removal and replay'},
    {at: 1, fn: 's.resultShown && s.layout.k === 1', label: 'the supplied result is shown; the layout fits without scaling'},
  ],
});

ratioChecks(ID, 'result shown, layout fits, text floors', [
  {at: [1], fn: 's.layout.k === 1', label: 'the layout fits the design box without a fallback scale'},
  {at: times(0, 1, 0.05), fn: "s.claw.y <= s.gripPt.y + 1 || s.run === 'with'", label: 'the claw never passes below the removed tile top'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.actorLabels.a, p.actorLabels.b, p.objectLabels.chain, p.objectLabels.removed, ...p.annotations.map(a => a.text)]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), p.objectLabels.removed]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión', 'Run with the event', 'Pasada con el evento']",
});

// Review round 1 (2026-09-26): EVERY visible text (tags, lamps, key, chips, glyphs such as "?", "A", "B") is >= 16 px at
// 1080p at every sampled u in every preset × ratio, and >= 19.5 px in the default, baseline-illustrative and baseline-es
// presets (pattern of LAW-0194 / LAW-0196).
test.describe('LAW-0685 text size over time', () => {
  test('LAW-0685: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u', async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0685')];
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
    }, ['LAW-0685', presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
