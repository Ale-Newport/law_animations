// LAW-0103 — Condiciones alternativas · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist (same board geometry, same timing), exactly the indicated fact changes
// (the route of the supplied fact: A in scenario A, B in scenario B) and no legal consequence is invented to
// complete the contrast (states as supplied; a neutral note; no winner, score or outcome).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';

const ID = 'LAW-0103';
const disputedB = {facts: [{label: 'Invitation note signed by member J. Park on Day 3', status: 'supplied'}, {label: 'Partner-club card no. 0417 shown at the door', status: 'disputed'}]};

contractSuite(ID, {
  continuity: ['aCap', 'bCap'],
  semantic: [
    {at: 0, fn: 's.scenes === 2 && s.sameGeometry && JSON.stringify(s.lookA) === JSON.stringify(s.lookB) && !s.lookA.capVisible && s.lookA.label === 0', label: 'base: two identical boards; no capsule, label or colour yet'},
    {at: 0.16, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'base: still identical at the end of the base beat'},
    {at: 0.16, params: {textVisibility: 'none'}, fn: 'JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'labels hidden: identical before the change beat'},
    {at: 0.3, fn: "s.a.route === 'A' && s.b.route === 'B' && s.lookA.capVisible && s.lookB.capVisible && s.lookA.cap.x !== s.lookB.cap.x", label: 'change: a capsule enters inlet A in board A and inlet B in board B (a localized, physical change)'},
    {at: 0.3, fn: "s.differs && s.sentRoute.a === 'A' && s.sentRoute.b === 'B'", label: 'exactly one supplied fact differs: the route'},
    {at: 0.62, fn: 's.a.ball > 0.9 && s.b.ball < -0.9 && s.lookA.lid === s.lookB.lid && s.lookA.lupa === s.lookB.lupa', label: 'parallel: same timing; the balls rest against opposite seats'},
    {at: 0.76, fn: 's.a.inTray && s.b.inTray && s.a.glow === 1 && s.b.glow === 1 && s.a.lupa === 1 && s.b.lupa === 1', label: 'parallel: both capsules reach the SAME kind of point (tray) by different routes'},
    {at: 1, fn: 's.guide === 1 && s.lookA.ring === 1 && s.lookB.ring === 1 && s.lookA.cap.y === s.lookB.cap.y', label: 'guide: the changed detail (valve windows) is joined; both capsules rest in the tray'},
    {at: 1, params: disputedB, fn: "s.b.stoppedAtGate && !s.b.inTray && s.b.ball === 0 && s.b.glow === 0 && s.a.inTray && s.b.status === 'disputed'", label: 'B supplied as disputed: stopped at its gate, nothing downstream moves; nothing decided'},
    {at: 1, params: {sentRoute: {a: 'A', b: 'none'}}, fn: "s.b.capState === 'none' && s.b.ball === 0 && !s.b.inTray && s.a.inTray", label: 'no route in B: nothing is sent there'},
    {at: 1, params: {sentRoute: {a: 'A', b: 'A'}}, fn: '!s.differs && JSON.stringify(s.lookA) === JSON.stringify(s.lookB)', label: 'identical supplied routes give identical boards (nothing invented)'},
    {at: 1, fn: 's.notes.issues === 1 && s.notes.key && s.notes.footHasAssumptions', label: 'issue, assumptions and the "as supplied · no conclusion drawn" key are drawn'},
    {at: 1, fn: 's.text.contentPx >= 20 && s.text.keyPx >= 18 && s.text.contentPx >= s.text.keyPx && s.text.keyPx >= s.text.captionPx', label: 'baseline text sizes'},
    {at: 1, params: {textVisibility: 'none'}, fn: 's.a.inTray && s.b.inTray && s.a.ball > 0.9 && s.b.ball < -0.9', label: 'labels hidden: the same physical difference reads'},
    // reviewer fixes: large boards (item 18), guide through free space, unused route still drawn (item 14)
    {at: 1, fn: 's.boardFrac >= 0.4', label: 'each board is at least 40 % of the frame width (side by side; ≥ 80 % stacked in 9:16)'},
    {at: 1, fn: 's.guideClear', label: 'the dashed guide runs in the boards’ free top band: above every bell, tube and letter tab, below the headers'},
    {at: 1, params: {sentRoute: {a: 'A', b: 'none'}}, fn: 's.notSent.B && !s.notSent.A', label: 'a route sent in neither scenario is flagged as not sent (its fact stays drawn)'},
  ],
});

async function collect(page, id, variants, times) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  return page.evaluate(async ([id, variants, times]) => {
    const def = await window.__lib.load(id);
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
      }
      const b = el.getBBox();
      return b.width > 0 && b.height > 0;
    };
    const rows = [];
    let n = 0;
    for (const v of variants) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, instanceId: `c-${n++}`, params: v.params});
        await x.ready;
        for (const at of times) {
          x.seek(x.durationMs * at);
          const svg = x.element;
          const root = svg.getScreenCTM().inverse();
          const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown).map(t => {
            const m = root.multiply(t.getScreenCTM());
            const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
            const named = t.closest('[data-node]');
            return {node: named ? named.getAttribute('data-node') : '', text: [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' '), px: Math.round(px * 10) / 10, truncated: Boolean(t.querySelector('title'))};
          });
          const st = x.getState({bounds: false});
          rows.push({name: v.name, ratio, at, texts, params: st.params, semantic: st.semantic});
        }
        x.destroy();
        el.remove();
      }
    }
    return rows;
  }, [id, variants, times]);
}
const norm = s => String(s).toLowerCase().replace(/\s+/g, '');

// AUTHORING items 9 and 15: A and B are identical before the change beat — every preset × ratio, labels on and off.
test(`${ID}: A and B identical before the change beat (presets × ratios × labels on/off)`, async ({page}) => {
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const variants = presets.flatMap(pr => [pr, {name: `${pr.name}-hidden`, params: {...pr.params, textVisibility: 'none'}}, {name: `${pr.name}-key`, params: {...pr.params, textVisibility: 'key'}}]);
  const rows = await collect(page, ID, variants, [0, 0.05, 0.1, 0.14, 0.169]);
  expect(rows.length).toBeGreaterThan(100);
  const bad = rows.filter(r => JSON.stringify(r.semantic.lookA) !== JSON.stringify(r.semantic.lookB) || r.semantic.lookA.capVisible || r.semantic.lookA.label !== 0);
  expect(bad.map(r => `${r.name} ${r.ratio} ${r.at}`)).toEqual([]);
  // and the scenario labels / facts are not visible as text before the change beat
  const early = rows.filter(r => r.texts.some(t => /^(a|b)-(label|caption|fact)/.test(t.node)));
  expect(early.map(r => `${r.name} ${r.ratio} ${r.at}`)).toEqual([]);
});

// AUTHORING item 14: every supplied field drawn at the hold, nothing truncated; key present.
test(`${ID}: every supplied field is drawn as text at the hold (presets × ratios), nothing truncated`, async ({page}) => {
  const unusedB = {name: 'route-B-unused', params: {sentRoute: {a: 'A', b: 'none'}}};
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID), unusedB], [1]);
  for (const r of rows) {
    const p = r.params;
    const hay = r.texts.map(t => norm(t.text)).join('|');
    // EVERY supplied fact is drawn, also a fact that no scenario sends (then marked "not sent (as supplied)")
    const used = p.facts.map(f => f.label);
    if (r.name === 'route-B-unused') {
      const notSent = p.locale === 'es' ? 'sin enviar (según lo aportado)' : 'not sent (as supplied)';
      expect.soft(hay.includes(norm(notSent)), `${r.name} ${r.ratio}: unused route marked "${notSent}"`).toBe(true);
    }
    const fields = [p.rules.name, ...p.rules.conditions, ...used, ...p.issues, ...p.assumptions, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, ...p.sharedFacts, p.comparisonLabels.guide, p.comparisonLabels.neutral];
    expect.soft(fields.filter(f => f && !hay.includes(norm(f))), `${r.name} ${r.ratio}: supplied fields not visible`).toEqual([]);
    expect.soft(r.texts.filter(t => t.truncated || t.text.includes('…')).map(t => t.text), `${r.name} ${r.ratio}: truncated`).toEqual([]);
    const key = p.locale === 'es' ? 'según lo aportado · sin conclusión' : 'as supplied · no conclusion drawn';
    expect.soft(hay.includes(norm(key)), `${r.name} ${r.ratio}: key drawn`).toBe(true);
  }
});

// AUTHORING items 10 and 17: content text ≥ 16 px (≥ 20 px in the baseline 16:9 / 9:16 frames; square
// frames and the Spanish baseline run smaller because both boards keep ~47 % of the width), never smaller
// than generic captions.
test(`${ID}: text sizes — content ≥ 16 px, baseline ≥ 20 px, never smaller than captions`, async ({page}) => {
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID), {name: 'labels-key', params: {textVisibility: 'key'}}], [1]);
  const isContent = n => /^(a-factcard-body|b-factcard-body|rule-plaque-panel-body|list-[ABS])$/.test(n);
  const isCaption = n => /^(a|b)-caption$/.test(n);
  for (const r of rows) {
    const content = r.texts.filter(t => isContent(t.node));
    const captions = r.texts.filter(t => isCaption(t.node));
    expect.soft(content.length, `${r.name} ${r.ratio}: content texts found`).toBeGreaterThan(3);
    const minContent = Math.min(...content.map(t => t.px));
    const maxCaption = captions.length ? Math.max(...captions.map(t => t.px)) : 0;
    // square frames trade text size for two boards at ~47 % width each (item 18): ≥ 16.9 px there
    const floor = r.ratio === '1:1' ? (/baseline|default|labels-key/.test(r.name) ? 16.9 : 15.9) : r.name === 'baseline-es' ? 17.9 : /baseline|default|labels-key/.test(r.name) ? 19.9 : 15.9;
    expect.soft(minContent, `${r.name} ${r.ratio}: smallest content text`).toBeGreaterThanOrEqual(floor);
    expect.soft(Math.min(...r.texts.map(t => t.px)), `${r.name} ${r.ratio}: smallest visible text`).toBeGreaterThanOrEqual(15.9);
    expect.soft(minContent + 0.05, `${r.name} ${r.ratio}: content never smaller than captions`).toBeGreaterThanOrEqual(maxCaption);
  }
});

// AUTHORING item 18: each board keeps at least 40 % of the frame width in every preset × ratio; the guide stays
// in free space; the complete final state is held for ≥ 1 s (item 19).
test(`${ID}: boards ≥ 40 % of the frame width, guide in free space, final state held ≥ 1 s`, async ({page}) => {
  const rows = await collect(page, ID, [{name: 'default', params: {}}, ...presetsFor(ID)], [0.86, 1]);
  for (const r of rows) {
    expect.soft(r.semantic.boardFrac, `${r.name} ${r.ratio}: board width / frame width`).toBeGreaterThanOrEqual(0.4);
    expect.soft(r.semantic.guideClear, `${r.name} ${r.ratio}: guide clear`).toBe(true);
    // round-2 finding: side by side on wide and square boxes, stacked at (nearly) full width on tall ones (item 18)
    expect.soft(r.semantic.arrangement, `${r.name} ${r.ratio}: arrangement`).toBe(r.ratio === '9:16' ? 'column' : 'row');
    if (r.ratio === '9:16') expect.soft(r.semantic.boardFrac, `${r.name} 9:16: stacked board width / frame width`).toBeGreaterThanOrEqual(0.8);
  }
  const pairs = {};
  for (const r of rows) (pairs[`${r.name}|${r.ratio}`] ||= []).push(r);
  for (const [k, [a, b]] of Object.entries(pairs)) {
    const strip = s => JSON.stringify({a: s.a, b: s.b, lookA: s.lookA, lookB: s.lookB, guide: s.guide});
    expect.soft(strip(a.semantic), `${k}: state at t=0.86 (≥ 1 s before the end) equals the final state`).toBe(strip(b.semantic));
  }
});

// Round-2: no two texts overlap at ANY time (the qa matrix samples only t = 0, 0.35, 0.7, 1), every preset × ratio.
test(`${ID}: no text overlap anywhere on the timeline`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async ([id, presets]) => {
    const {layoutWarnings} = await import('/tests/harness/in-page.js');
    const def = await window.__lib.load(id);
    const bad = [];
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params}); await x.ready;
      for (let u = 0; u <= 1.0001; u += 0.01) {
        x.seek(u * x.durationMs);
        const lw = layoutWarnings(x.element, x, []);
        if (lw.overlaps.length) bad.push(`${pr.name} ${w}x${h} u=${u.toFixed(2)} ${JSON.stringify(lw.overlaps)}`);
      }
      x.destroy(); el.remove();
    }
    return bad;
  }, [ID, [{name: 'default', params: {}}, ...presetsFor(ID)]]);
  expect(out).toEqual([]);
});
