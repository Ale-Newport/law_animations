// LAW-0158 — Regla transitoria · mechanism. Contract battery + ID-specific checks.
// acceptanceCheck: every connector ends on its element (both ends on the element's box edge), the order does
// not change when seeking (tracer visits = supplied traversal order; determinism is covered by the contract),
// and a relation is not drawn as causation by default (plain relations have no arrowhead; no causal link unless
// supplied).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

const ID = 'LAW-0158';

contractSuite(ID, {
  continuity: ['tracer'],
  semantic: [
    {at: 0, fn: 's.sep === 0 && s.relationsDrawn.every(v => v === 0) && !s.tracerOn && s.sides.every(x => x === "neutral") && s.zones === 0', label: 'separate: parts packed, nothing related, nothing marked'},
    {at: 0.17, fn: 's.sep === 1 && s.relationsDrawn.every(v => v === 0)', label: 'parts separated before any relation is drawn'},
    {at: 0.44, fn: 's.relationsDrawn.every(v => v === 1) && !s.tracerOn && s.zones === 0', label: 'relate: every supplied relation drawn before the tracer starts'},
    {at: 1, fn: 's.conns.every(c => c.endsOk)', label: 'item 5: every link (and every thread) ends on its own part edge — a link to the cases on a card'},
    {at: 1, fn: 's.conns.filter(c => c.thread === null).every(c => c.len >= 2) && s.conns.every(c => c.len >= 1.5)', label: 'links have length (≥ 2 × text size; threads ≥ 1.5 ×)'},
    {at: 1, fn: 's.labels.every(q => q.beside && !q.onLine && q.gap <= 40)', label: 'each relation label sits beside its line (not on it, within reach)'},
    {at: 1, fn: 's.threads === s.cases', label: 'the timeline–cases relation is one thread per case, from each card to its pin'},
    {at: 1, fn: 'Math.abs(s.plumb.x - s.plumb.rulerDayX) < 0.5 && Math.abs(s.plumb.top - s.plumb.bandBottom) < 0.5 && Math.abs(s.plumb.bottom - s.plumb.rulerTop) < 0.5 && s.plumb.shown === 1', label: 'the plumb line ties the band split to the milestone day on the ruler'},
    {at: 1, fn: "s.conns.filter(c => c.kind === 'relation').every(c => !c.arrow) && !s.conns.some(c => c.kind === 'causal')", label: 'plain relations have no arrowhead; no causal link by default'},
    {at: 0.6, fn: "JSON.stringify(s.visits) === JSON.stringify(['version1','band','milestone','band','cases','timeline'])", label: 'tracer visits follow the supplied traversal order'},
    {at: 0.46, fn: 's.sides.every(x => x === "neutral")', label: 'no case state before the tracer reaches the cases (cause before effect)'},
    {at: 1, fn: "JSON.stringify(s.sides) === JSON.stringify(['before','before','after']) && s.zones === 1 && s.keyShown === 1 && s.focusScale === 1", label: 'gather: states by position only, key shown, focus back to normal size'},
    {at: 1, params: {relationships: [{from: 'milestone', to: 'band', kind: 'causal'}, {from: 'band', to: 'cases', kind: 'relation'}]}, fn: "s.conns.length === 2 && s.conns[0].arrow && s.conns[0].kind === 'causal' && !s.conns[1].arrow && s.conns.every(c => c.endsOk)", label: 'a causal link is drawn only when supplied, and only for that link'},
    {at: 1, params: {traversalOrder: ['timeline', 'cases', 'band']}, fn: "JSON.stringify(s.visits) === JSON.stringify(['timeline','cases','band'])", label: 'another supplied order is followed as supplied'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.conns.every(c => c.endsOk) && JSON.stringify(s.sides) === JSON.stringify(["before","before","after"])', label: 'labels hidden: the same parts, links and states'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), `${p.timeline.unit} ${p.milestone.day} (${p.milestone.label})`, ...p.cases.map(c => c.label), ...p.elements.map(e => e.label), ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])]',
  content: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), `${p.timeline.unit} ${p.milestone.day} (${p.milestone.label})`, ...p.cases.map(c => c.label), ...p.elements.map(e => e.label)]',
  captions: 'return [p.locale === "es" ? "Posiciones según lo aportado" : "Positions as supplied", ...[...new Set(p.relationships.map(r => r.kind))].map(k => p.relationLabels[k])]',
});

// The focus element enlarges while the tracer is on it (all presets, 16:9): seek to the moment the tracer reaches
// it and compare with the hold.
test(`${ID}: the focus element enlarges while the tracer passes it (all presets)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const rows = [];
    for (const pr of presets) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: 1920, height: 1080, instanceId: `fc-${rows.length}`, params: pr.params});
      await x.ready;
      let peak = 0;
      for (let u = 0.43; u <= 0.77; u += 0.005) {
        x.seek(u * x.durationMs);
        peak = Math.max(peak, x.getState({bounds: false}).semantic.focusScale);
      }
      x.seek(x.durationMs);
      rows.push({preset: pr.name, peak, end: x.getState({bounds: false}).semantic.focusScale});
      x.destroy();
      el.remove();
    }
    return rows;
  }, [ID, presets]);
  expect(out.filter(q => !(q.peak > 1.07 && q.end === 1)), JSON.stringify(out)).toEqual([]);
});

// Review items 5 / 16: in every preset × ratio (labels on and off) every link and thread ends on its own part
// edge, has length, its label sits beside it; the tracer never runs over text; the focus is visible.
test(`${ID}: links land on their parts, labels beside, tracer off text, focus visible (all presets × ratios)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    let n = 0;
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, instanceId: `lk-${n++}`, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const tag = `${pr.name} ${tv} ${w}x${h}`;
      x.seek(x.durationMs);
      const s = x.getState({bounds: false}).semantic;
      s.conns.forEach((c, i) => { if (!c.endsOk) bad.push(`${tag}: link ${i} ${c.from}->${c.to} does not land`); if (c.len < (c.thread === null ? 2 : 1.5)) bad.push(`${tag}: link ${i} is a stub (${c.len})`); });
      if (tv === 'all') s.labels.forEach(q => { if (!q.beside || q.onLine || q.gap > 40) bad.push(`${tag}: label ${q.ri} not beside its line`); });
      if (s.threads !== s.cases) bad.push(`${tag}: ${s.threads} threads for ${s.cases} cases`);
      let peak = 0, halo = 0;
      for (let u = 0.43; u <= 0.76; u += 0.004) {
        x.seek(u * x.durationMs);
        const q = x.getState({bounds: false}).semantic;
        if (q.tracerOnText) bad.push(`${tag}: tracer over text @${u.toFixed(3)}`);
        peak = Math.max(peak, q.focusScale);
        halo = Math.max(halo, q.focusHalo);
      }
      if (peak < 1.12 || halo < 0.95) bad.push(`${tag}: focus barely shows (scale ${peak}, halo ${halo})`);
      // the ring is drawn beneath every text-bearing layer, so it can never cover a word
      const ring = x.element.querySelector('[data-node="mx-tracer"]');
      const firstText = x.element.querySelector('text');
      if (firstText && !(ring.compareDocumentPosition(firstText) & Node.DOCUMENT_POSITION_FOLLOWING)) bad.push(`${tag}: text drawn beneath the tracer`);
      x.destroy();
      el.remove();
    }
    return bad;
  }, [ID, presets]);
  expect(out.slice(0, 10)).toEqual([]);
});
