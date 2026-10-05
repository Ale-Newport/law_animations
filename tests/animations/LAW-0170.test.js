// LAW-0170 — Declaración de testigo · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck (brief): every connector ends at its element, the order does not change when
// seeking, and a plain relation is never drawn as causation by default.
// Beats: separate 0–0.18 · relations drawn one by one 0.18–0.43 · tracer 0.45–0.74 · gather.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';

const ID = 'LAW-0170';
const ORDER = JSON.stringify(['event', 'witness', 'clerk', 'cards', 'informant', 'witness', 'clerk', 'cards']);

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: "s.beat === 'separate' && s.relationsDrawn.every(p => p === 0) && !s.tracerVisible && s.cardsShown.every(v => v === 0)", label: 'separate: nothing related, traced or written yet'},
    {at: 0.3, fn: 's.relationsDrawn.some(p => p === 1) && s.relationsDrawn.some(p => p < 1)', label: 'relationships are drawn one by one'},
    {at: 0.3, fn: 's.relationsDrawn.every((p, i) => i === 0 || p === 0 || s.relationsDrawn[i - 1] === 1)', label: 'a later link never starts before the previous one is complete'},
    {at: 0.44, fn: 's.relationsDrawn.every(p => p === 1) && !s.tracerVisible && s.cardsShown.every(v => v === 0)', label: 'all supplied links exist before the tracer runs; no card yet'},
    {at: 0.5, fn: "s.tracerVisible && s.token && s.token.source === 'observed'", label: 'leaving the seen channel, the tracer carries a token marked as observed (as stated)'},
    {at: 0.66, fn: "s.cardsShown[0] === 1 && s.cardsShown[1] === 0 && s.token && s.token.source === 'received'", label: 'the first card is in the rail; the told-channel token is on its way'},
    {at: 1, fn: `s.cardsShown.every(v => v === 1) && !s.tracerVisible && JSON.stringify(s.visitOrder) === '${ORDER}'`, label: 'gather: every card delivered, tracer gone, visits in the supplied order'},
    {at: 0.6, fn: `JSON.stringify(s.visitOrder) === JSON.stringify(${ORDER}.slice(0, s.visitOrder.length))`, label: 'visit order is the supplied order at any seek time'},
    {at: 1, fn: 's.connectorGaps.every(gap => gap <= 16)', label: 'every connector starts and ends at the edge of its own part'},
    {at: 1, fn: "s.arrows.every(a => a.kind === 'relation' ? !a.arrow : true) && s.causalCount === 0 && !s.arrows.some(a => a.kind === 'causal')", label: 'plain relation has no arrowhead; nothing causal unless supplied'},
    {at: 0.48, fn: "s.focus === 'witness' && s.focusScale > 1.05 && s.focusVisitsU.length === 2", label: 'the focus element (witness) enlarges while the tracer passes'},
    {at: 1, fn: 's.labelClashes === 0', label: 'captions and name chips clear every part, chip and link'},
    {at: 1, params: {relationships: [{from: 'event', to: 'witness', kind: 'causal', label: 'as supplied'}, {from: 'witness', to: 'clerk', kind: 'communication', label: ''}, {from: 'clerk', to: 'cards', kind: 'sequence', label: ''}]}, fn: "s.causalCount === 1 && s.arrows[0].kind === 'causal' && s.arrows[0].arrow && s.legendKinds.includes('causal')", label: 'a causal link (and its legend entry) appears only when supplied'},
    {at: 1, fn: "!s.legendKinds.includes('causal') && JSON.stringify(s.legendKinds) === JSON.stringify(['relation','communication','sequence'])", label: 'the legend lists only the kinds the supplied links use (no causal sample by default)'},
    {at: 0.6, params: {traversalOrder: ['informant', 'witness', 'clerk', 'cards', 'event', 'witness', 'clerk', 'cards']}, fn: "JSON.stringify(s.visitOrder) === JSON.stringify(['informant','witness','clerk','cards','event','witness','clerk','cards'].slice(0, s.visitOrder.length)) && s.visitOrder[0] === 'informant'", label: 'the tracer follows a different supplied order'},
    {at: 0.52, params: {focusElement: 'clerk'}, fn: "s.focus === 'clerk'", label: 'the focus element is configurable'},
    {at: 0.66, params: {textVisibility: 'none'}, fn: "s.cardsShown[0] === 1 && s.token && s.token.source === 'received'", label: 'labels hidden: the same delivery reads (glyph tokens and cards)'},
  ],
});

// Reviewer fixes in every preset × ratio × labels shown / hidden: each connector is long enough to read as a
// line of its own, and captions / name chips hide at most a third of any connector.
ratioChecks(ID, 'connectors readable beside their captions', [
  {at: [1], fn: 's.linkLens.every(l => l >= s.minLink) && s.linkCover.every(c => c <= 0.34) && s.labelClashes === 0', label: 'links ≥ 5 captions-heights long; captions beside them (≤ 1/3 hidden); no clashes'},
]);

suppliedTextSuite(ID, {
  fields: 'return [...p.actors.map(a => a.name), p.roles.witness, p.roles.clerk, p.roles.informant, ...p.props.facts.map(f => f.text), ...p.props.facts.map(f => f.via), p.props.sourceLabels.observed, p.props.sourceLabels.received, ...p.elements.map(e => e.label), ...p.relationships.map(r => r.label), ...Object.entries(p.relationLabels).filter(([k]) => p.relationships.some(r => r.kind === k)).map(([, v]) => v)]',
  content: 'return [...p.actors.map(a => a.name), ...p.props.facts.map(f => f.text), p.props.sourceLabels.observed, p.props.sourceLabels.received, ...p.relationships.map(r => r.label)]',
  captions: 'return ["as supplied", "según lo aportado"]',
});

// Round 2 (rendered): at the hold no connector and no caption leader passes through any text or chip —
// captions sit beside their lines, leaders cross nothing but their own endpoints (every preset × ratio).
test.describe('LAW-0170 connectors and leaders clear of text (rendered)', () => {
  test('LAW-0170: no connector or leader segment crosses a text or chip box (every preset × ratio, at the hold)', async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0170')];
    const bad = await page.evaluate(async ([presets]) => {
      const def = await window.__lib.load('LAW-0170');
      const out = [];
      for (const pr of presets) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          x.seek(x.durationMs);
          const svg = x.element, inv = svg.getScreenCTM().inverse();
          const toRoot = (px, py) => { const q = new DOMPoint(px, py).matrixTransform(inv); return {x: q.x, y: q.y}; };
          const shown = e => { for (let q = e; q && q !== svg; q = q.parentNode) { const o = q.getAttribute && q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
          const box = e => { const b = e.getBoundingClientRect(); const p0 = toRoot(b.left, b.top), p1 = toRoot(b.right, b.bottom); return {x: p0.x, y: p0.y, w: p1.x - p0.x, h: p1.y - p0.y}; };
          const tag = `${pr.name} ${ratio}`;
          // text boxes, grown by the chip padding (a text in a chip stands for its chip)
          const legend = svg.querySelector('[data-node="legend"]');
          const texts = [...svg.querySelectorAll('text')].filter(t => shown(t) && !t.closest('[data-layer="content-notice"]') && !(legend && legend.contains(t)) && (t.textContent || '').trim())
            .map(t => { const b = box(t); const pad = 7; return {t, b: {x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad}}; });
          const inside = (q, b) => q.x > b.x && q.x < b.x + b.w && q.y > b.y && q.y < b.y + b.h;
          // connectors (sampled along the drawn path; their ends at the parts are allowed)
          for (const path of svg.querySelectorAll('[data-node$="-line"]')) {
            const nm = path.getAttribute('data-node');
            if (!/^rg-c\d+-line$/.test(nm) || !shown(path)) continue;
            const L = path.getTotalLength(), pm = path.getScreenCTM();
            const pts = Array.from({length: 90}, (_, i) => { const q = path.getPointAtLength(L * (0.04 + 0.92 * i / 89)).matrixTransform(pm); return toRoot(q.x, q.y); });
            for (const {t, b} of texts) if (pts.some(q => inside(q, b))) out.push(`${tag}: connector ${nm} passes through "${t.textContent.slice(0, 28)}"`);
          }
          // caption leaders: from the link to the caption's edge; they cross no other text or chip
          for (const grp of svg.querySelectorAll('[data-node^="rlg"]')) {
            if (!shown(grp)) continue;
            const line = grp.querySelector('line');
            if (!line) continue;
            const m = line.getScreenCTM();
            const sp = (ax, ay) => { const q = new DOMPoint(ax, ay).matrixTransform(m); return toRoot(q.x, q.y); };
            const A = sp(+line.getAttribute('x1'), +line.getAttribute('y1')), B = sp(+line.getAttribute('x2'), +line.getAttribute('y2'));
            const pts = Array.from({length: 40}, (_, i) => ({x: A.x + (B.x - A.x) * (0.05 + 0.85 * i / 39), y: A.y + (B.y - A.y) * (0.05 + 0.85 * i / 39)}));
            for (const {t, b} of texts) {
              if (grp.contains(t)) continue;
              if (pts.some(q => inside(q, b))) out.push(`${tag}: leader of ${grp.getAttribute('data-node')} passes through "${t.textContent.slice(0, 28)}"`);
            }
          }
          x.destroy?.();
          el.remove();
        }
      }
      return [...new Set(out)];
    }, [presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
