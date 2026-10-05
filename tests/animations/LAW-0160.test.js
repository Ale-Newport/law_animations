// LAW-0160 — Regla transitoria · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the lens is a real enlarged copy mapped from the
// source rectangle), the change is localized (only the substituted datum and the card whose side it changes),
// and seeking back restores exactly the previous datum.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';

const ID = 'LAW-0160';

contractSuite(ID, {
  continuity: ['post', 'lensRect'],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.datumValue === 20 && s.lensVisible === 0 && s.thumbScale === 1", label: 'build: the desk at full size with the supplied Day 20'},
    {at: 0.46, fn: "s.lensOpen === 1 && s.lensMapsSource && s.datum === 'before' && s.thumbScale < 0.4", label: 'isolate: the lens is a real copy mapped from its source; context kept as a thumbnail'},
    {at: 0.58, fn: "s.datum === 'changing' && s.contextShows === 'old' && s.ghost === 1", label: 'substitute: the datum changes in the lens only; a ghost keeps the old position'},
    {at: 0.72, fn: "s.datum === 'after' && s.datumValue === 14 && JSON.stringify(s.sidesNow) === JSON.stringify(['before','after','after'])", label: 'after: only Case 2 (Day 16) changes side against the new Day 14'},
    {at: 0.72, fn: "JSON.stringify(s.changedCards) === JSON.stringify([1]) && JSON.stringify(s.sidesBefore) === JSON.stringify(['before','before','after'])", label: 'the change is localized to one card'},
    {at: 0.3, fn: "s.datum === 'before' && s.datumValue === 20 && JSON.stringify(s.sidesNow) === JSON.stringify(['before','before','after'])", label: 'seeking back restores the old datum and states exactly'},
    {at: 1, fn: "s.contextShows === 'new' && s.lensVisible === 0 && s.thumbScale === 1 && s.markerShown === 1 && s.datumValue === 14", label: 'return: full desk with the new datum and the changed-datum marker'},
    {at: 1, params: {focusTarget: 'caseDay', focusCase: 0, beforeValue: 9, afterValue: 24}, fn: "s.datumValue === 24 && JSON.stringify(s.sidesNow) === JSON.stringify(['after','before','after']) && JSON.stringify(s.changedCards) === JSON.stringify([0])", label: 'caseDay: only the focus case moves and changes side'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.markerShown === 1 && JSON.stringify(s.sidesNow) === JSON.stringify(['before','after','after'])", label: 'labels hidden: the same substitution reads'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), p.milestone.label, ...p.cases.map(c => c.label), p.contextLabels.context, p.contextLabels.marker]',
  content: 'return [...p.sources.map(s => s.label), ...p.hierarchy, p.passages[0].ref, p.passages[0].text, ...p.interpretations.flatMap(r => [r.by, r.text]), ...p.cases.map(c => c.label)]',
  captions: 'return [p.locale === "es" ? "Posiciones según lo aportado" : "Positions as supplied", p.contextLabels.context, p.contextLabels.marker]',
});

// Seeking back from the end to any earlier time restores exactly the state of a fresh seek (all ratios).
test(`${ID}: seeking back restores the earlier frame exactly (all ratios)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const out = await page.evaluate(async id => {
    const def = await window.__lib.load(id);
    const bad = [];
    for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, instanceId: `sb-${w}`});
      await x.ready;
      for (const u of [0.1, 0.4, 0.55]) {
        x.seek(u * x.durationMs);
        const a = JSON.stringify(x.getState({bounds: false}).nodes);
        x.seek(x.durationMs);
        x.seek(u * x.durationMs);
        if (JSON.stringify(x.getState({bounds: false}).nodes) !== a) bad.push(`${w}x${h} @${u}`);
      }
      x.destroy();
      el.remove();
    }
    return bad;
  }, ID);
  expect(out).toEqual([]);
});

// Review item 19: the lens opens WHILE the context shrinks and closes WHILE it grows. Sampled across the isolate
// and return beats (every preset × ratio × labels on/off): the context and the lens window together always cover at
// least half of the stage, and one of them alone at least ~40 % — never a small thumbnail on an empty stage.
test(`${ID}: no empty transition — context + lens cover the stage through isolate and return (all presets × ratios)`, async ({page}) => {
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
      const x = def.create(el, {width: w, height: h, instanceId: `cov-${n++}`, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      for (const [a, b] of [[0.18, 0.48], [0.74, 0.95]]) {
        for (let u = a; u <= b + 1e-9; u += 0.005) {
          x.seek(u * x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          if (s.coverage < 0.5 || s.largest < 0.4) bad.push(`${pr.name} ${tv} ${w}x${h} @${u.toFixed(3)} cov=${s.coverage} largest=${s.largest}`);
        }
      }
      x.destroy();
      el.remove();
    }
    return bad;
  }, [ID, presets]);
  expect(out.slice(0, 8)).toEqual([]);
});

// Review round 2: the lens is a REAL magnification of a focused region (the milestone tag and the one card whose
// side changes; for caseDay the focus card and its pins) — zoom >= 1.5 in every preset × ratio — and the rim never
// cuts a word: every visible text of the enlarged copy lies wholly inside the lens window (or wholly outside it,
// i.e. not drawn). Sampled while the lens is open (substitution beat).
test(`${ID}: lens zoom >= 1.5 and no text clipped by the lens rim (all presets × ratios)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const bad = [];
    let n = 0;
    for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, instanceId: `zm-${n++}`, params: pr.params});
      await x.ready;
      for (const u of [0.46, 0.6, 0.74]) {
        x.seek(u * x.durationMs);
        const s = x.getState({bounds: false}).semantic;
        const tag = `${pr.name} ${w}x${h} @${u}`;
        if (s.lensOpen !== 1) bad.push(`${tag}: lens not open (${s.lensOpen})`);
        if (!(s.lensZoom >= 1.5)) bad.push(`${tag}: lens zoom ${s.lensZoom} < 1.5`);
        const win = x.element.querySelector('[data-node="lens-border"]').getBoundingClientRect();
        const content = x.element.querySelector('[data-node="lens-content"]');
        for (const t of content.querySelectorAll('text')) {
          if (!t.textContent.trim()) continue;
          let op = 1;
          for (let e = t; e && e !== content; e = e.parentElement) op *= Number(e.getAttribute('opacity') ?? 1);
          if (op < 0.05) continue;
          const b = t.getBoundingClientRect();
          const ins = b.left >= win.left - 1 && b.right <= win.right + 1 && b.top >= win.top - 1 && b.bottom <= win.bottom + 1;
          const outs = b.right <= win.left + 1 || b.left >= win.right - 1 || b.bottom <= win.top + 1 || b.top >= win.bottom - 1;
          if (!ins && !outs) bad.push(`${tag}: "${t.textContent.slice(0, 32)}" cut by the lens rim`);
        }
      }
      x.destroy();
      el.remove();
    }
    return bad;
  }, [ID, presets]);
  expect(out.slice(0, 12), `${out.length} problems`).toEqual([]);
});
