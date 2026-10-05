import {test, expect} from '@playwright/test';
// LAW-0686 — Prueba contrafactual causal · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when seeking, and a
// relation is never drawn as causation by default (links are sequence unless supplied as causal; alternatives are
// tied by plain relations). The replay result is SUPPLIED: a bypass only when it says the loss still occurs.
// Windows (LAW-0686.js W): cards 0–0.16 · relations 0.18–0.42 · pass 1 0.43–0.575 · removal 0.58–0.615 ·
// bypass 0.615–0.64 · pass 2 0.64–0.765 · results 0.77–0.81 · strip 0.78–0.83 · key 0.80–0.85.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const ID = 'LAW-0686';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const ORDER = 'JSON.stringify(s.visitOrder)';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: 's.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.removed === 0', label: 'separate: no relation drawn, no tracer, nothing removed'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relations are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1)', label: 'all supplied links exist before the tracer runs'},
    {at: 0.577, fn: `s.pass === 0 && s.reached[0] === 1 && s.removed === 0`, label: 'pass 1 (every event in the model) reaches the loss before anything is removed'},
    {at: 0.62, fn: 's.removed === 1 && !s.tracerVisible', label: 'the selected event is taken out of the path between the passes'},
    {at: 0.7, fn: `s.pass === 2 && !s.visitOrder.includes('e2')`, label: 'pass 2 never visits the removed event'},
    {at: 1, fn: "s.withoutResult === 'loss-does-not-occur' && s.stopped && s.reached[1] === 0 && s.bypass === null", label: 'supplied "does not occur": no bypass; pass 2 stops at the gap; loss not reached'},
    {at: 1, params: {withoutResult: 'loss-still-occurs'}, fn: 's.bypass === 1 && s.reached[1] === 1 && !s.stopped', label: 'supplied "still occurs": the bypass is drawn and pass 2 reaches the loss'},
    {at: 1, fn: "s.linkStyles.every(k => k === 'sequence') && s.linkEnds.every(Boolean)", label: 'no causal style unless supplied; every connector has both ends'},
    {at: 1, params: P('contrast-or-alternative'), fn: "JSON.stringify(s.linkStyles) === JSON.stringify(['causal','sequence','sequence','disputed','sequence'])", label: 'styles follow the supplied data (causal only where supplied, disputed dotted)'},
    {at: 0.5, params: {traversalOrder: ['loss', 'e4', 'e3']}, fn: "JSON.stringify(s.visitOrder).startsWith('[\"loss\"')", label: 'the tracer follows the supplied traversal order'},
    {at: 0.5, fn: "s.focus === 'e2'", label: 'the focus element is configurable (default: the selected event)'},
    {at: 0.3, fn: `${ORDER} === '[]'`, label: 'seeking back: nothing visited before the trace beat'},
    {at: 0.9, params: {textVisibility: 'none'}, fn: 's.removed === 1 && s.reached[0] === 1', label: 'labels hidden: the same removal and passes'},
  ],
});

ratioChecks(ID, 'layout fits', [
  {at: [1], fn: 's.layout.k === 1', label: 'the board fits the design box without a fallback scale'},
  // review round 1: connectors are long enough to read (>= 3 × the text line height), tiles stay large
  {at: [1], fn: 's.minConnector >= 3 * s.layout.size * 1.18 && s.layout.TH >= 100', label: 'every chain connector is >= 3 × the text line height; tiles >= 100 units tall'},
]);

suppliedTextSuite(ID, {
  fields: "const kinds = new Set(p.causalLinks.map(l => l.status === 'disputed' ? 'disputed' : l.kind)); return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), ...p.relationships.map(r => r.label), p.relationLabels.sequence, ...[...kinds].filter(k => k !== 'sequence' && k !== 'proposed').map(k => p.relationLabels[k])]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label)]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// Review round 1 (2026-09-26): EVERY visible text (tags, lamps, key, chips, glyphs such as "?", "A", "B") is >= 16 px at
// 1080p at every sampled u in every preset × ratio, and >= 19.5 px in the default, baseline-illustrative and baseline-es
// presets (pattern of LAW-0194 / LAW-0196).
test.describe('LAW-0686 text size over time', () => {
  test('LAW-0686: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u', async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0686')];
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
    }, ['LAW-0686', presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
