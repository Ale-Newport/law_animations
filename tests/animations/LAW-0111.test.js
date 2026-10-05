// LAW-0111 — Premisa oculta · contrast. Contract battery + ID-specific checks.
// acceptanceCheck: both scenes exist, exactly the indicated circumstance changes (the supplied status of the
// intermediate premise: stated / left unstated) and no legal consequence is invented to complete the contrast
// (no winner, score or outcome; every text is the same in both scenes).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {motifDomChecks} from './premisa-oculta-checks.js';

const ID = 'LAW-0111';
const alt = presetsFor(ID).find(p => p.name === 'contrast-or-alternative').params;

contractSuite(ID, {
  continuity: ['factA', 'factB', 'lupaA', 'lupaB'],
  semantic: [
    {at: 0, fn: 's.scenes === 2 && s.identicalLooks && s.revealedA === 0 && s.clipA === null && s.clipB === null', label: 'base: two complete, identical scenes; the intermediate card is covered on both'},
    {at: 0.16, fn: 's.identicalLooks && !s.labelsShown', label: 'base: still identical, only neutral A/B badges (no label, clip or colour before the change beat)'},
    {at: 0.3, fn: "s.clipA === 'stated' && s.clipB === 'unstated' && s.openA === 0 && s.openB === 0", label: 'change: one localized marker per scene (quotation marks in A, ellipsis in B) before anything moves'},
    {at: 0.36, fn: "s.labelsShown && JSON.stringify(s.differs) === JSON.stringify(['premiseStatus'])", label: 'change: lane labels shown; exactly one circumstance differs'},
    {at: 0.5, fn: 's.openA === s.openB && s.openA > 0 && s.openA < 1 && s.revealedA === s.revealedB && JSON.stringify(s.lookA.fact) === JSON.stringify(s.lookB.fact)', label: 'parallel: both walks open in lockstep and reveal the same card'},
    {at: 0.665, fn: "s.latchedA && !s.latchedB && s.hingeB.every(k => k === -1) && s.lupaReadingB && !s.lupaReadingA", label: 'parallel: A’s hinges latch its stated card; B’s stay folded and B’s magnifier reads the unstated card (geometry and sequence differ)'},
    {at: 0.72, fn: 's.liftA === 1 && s.liftB === 0', label: 'parallel: A’s card lifts flush, B’s stays recessed in its pocket'},
    {at: 0.76, fn: 's.guide === 0', label: 'the comparison guide is not drawn before the closing beat'},
    {at: 1, fn: "s.guide === 1 && s.bandShown && s.winner === null && s.score === null && s.outcome === null && s.lupaA.x > 0 && !s.lupaReadingB", label: 'guide: the changed detail is joined; no winner, score or outcome; both magnifiers back at rest'},
    {at: 1, params: {statusA: 'unstated', statusB: 'unstated'}, fn: 's.identicalLooks && s.differs.length === 0', label: 'identical supplied statuses give identical scenes (nothing invented)'},
    {at: 0.665, params: alt, fn: "s.statusA === 'unstated' && s.statusB === 'stated' && s.latchedB && !s.latchedA && s.lupaReadingA", label: 'roles follow the supplied statuses (alternative preset: A unstated, B stated)'},
    {at: 0.665, params: {textVisibility: 'none'}, fn: 's.latchedA && s.lupaReadingB && s.clipA && s.clipB', label: 'labels hidden: the same physical difference reads'},
    {at: 1, fn: 's.bodyPx1080 >= 20 && s.notePx1080 >= 20', label: 'baseline 16:9: card text and notes >= 20 px'},
  ],
});

// Before the change beat (t < 0.17) A and B must look identical — same offsets, reveal, hinges, lift, magnifier,
// no clip, no label — in every preset × real 16:9 / 9:16 / 1:1 frame, with labels shown and hidden.
test(`${ID}: A and B are identical before the change beat (presets × ratios × labels)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const out = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const fails = [];
    let checked = 0;
    for (const pr of presets) {
      for (const tv of ['all', 'none']) {
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          for (const u of [0, 0.05, 0.1, 0.14, 0.169]) {
            x.seek(u * x.durationMs);
            const s = x.getState({bounds: false}).semantic;
            checked++;
            if (!s.identicalLooks || s.lookA.clip !== null || s.lookA.lane !== 0 || s.lookA.revealed !== 0) fails.push({preset: pr.name, tv, ratio, u, a: s.lookA, b: s.lookB});
          }
          x.destroy();
          el.remove();
        }
      }
    }
    return {fails, checked};
  }, [ID, presets]);
  expect(out.checked).toBeGreaterThan(100);
  expect(out.fails.slice(0, 4)).toEqual([]);
});

// Rendered checks at the hold for every preset × real ratio (labels shown and hidden).
test(`${ID}: supplied fields drawn, readable, not truncated (presets × ratios × labels)`, async ({page}) => {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const rows = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
    const shown = el => {
      for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
        const op = n.getAttribute && n.getAttribute('opacity');
        if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
        if (n.getAttribute && n.getAttribute('display') === 'none') return false;
      }
      const b = el.getBBox();
      return b.width > 0 && b.height > 0;
    };
    const out = [];
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        for (const tv of ['all', 'none']) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          x.seek(x.durationMs);
          const p = x.getState({bounds: false}).params;
          const svg = x.element;
          const texts = [...svg.querySelectorAll('text')].filter(t => !t.closest('[data-layer="content-notice"]')).filter(shown);
          const txt = t => [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ');
          const hay = texts.map(t => norm(txt(t))).join('|');
          const px = t => {
            const m = svg.getScreenCTM().inverse().multiply(t.getScreenCTM());
            return parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c));
          };
          const role = t => (t.closest('[data-role]') ? t.closest('[data-role]').getAttribute('data-role') : 'none');
          const content = texts.filter(t => role(t) === 'content').map(px);
          const caption = texts.filter(t => role(t) === 'caption').map(px);
          const fields = tv === 'all' ? [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, ...p.sharedFacts, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, p.comparisonLabels.guide, p.comparisonLabels.neutral] : [];
          // every card text is drawn twice (once per scene)
          const twice = tv === 'all' ? [p.facts, p.rules, p.conclusion].filter(f => hay.split(norm(f)).length - 1 < 2) : [];
          out.push({
            preset: pr.name, ratio, tv,
            missing: fields.filter(f => f && !hay.includes(norm(f))),
            notTwice: twice,
            truncated: texts.filter(t => t.querySelector('title') || txt(t).includes('…')).map(t => txt(t).slice(0, 40)),
            unroled: texts.filter(t => role(t) === 'none').map(t => txt(t).slice(0, 30)),
            note: tv === 'none' || hay.includes(norm('no conclusion drawn')) || hay.includes(norm('sin conclusión')),
            minContent: content.length ? Math.min(...content) : null,
            maxCaption: caption.length ? Math.max(...caption) : 0,
            visibleTexts: texts.length,
          });
          x.destroy();
          el.remove();
        }
      }
    }
    return out;
  }, [ID, presets]);
  for (const r of rows) {
    const tag = `${r.preset} ${r.ratio} labels=${r.tv}`;
    expect.soft(r.missing, `${tag}: supplied fields not drawn at the hold`).toEqual([]);
    expect.soft(r.notTwice, `${tag}: card texts drawn in both scenes`).toEqual([]);
    expect.soft(r.truncated, `${tag}: ellipsised text at the hold`).toEqual([]);
    expect.soft(r.unroled, `${tag}: text without a content/caption role`).toEqual([]);
    expect.soft(r.note, `${tag}: "as supplied · no conclusion drawn" key at the hold`).toBe(true);
    if (r.tv === 'none') expect.soft(r.visibleTexts, `${tag}: no visible text with labels hidden`).toBe(0);
    if (r.tv === 'all') {
      const floor = /baseline|default/.test(r.preset) ? 20 : 16;
      expect.soft(r.minContent, `${tag}: supplied/key text >= ${floor} px at 1080p`).toBeGreaterThanOrEqual(floor);
      expect.soft(r.minContent + 0.5, `${tag}: supplied/key text never smaller than the generic captions`).toBeGreaterThanOrEqual(r.maxCaption);
    }
  }
});

// Shared rendered-text audit (tests/harness/supplied-text.js) at the hold, and the motif DOM checks: text inside
// chips, no split words, and the comparison guide never touching a text (it runs through free space only).
suppliedTextSuite(ID, {
  fields: 'return [p.facts, p.rules, p.conclusion, ...p.issues, ...p.assumptions, ...p.sharedFacts, p.scenarioA.label, p.scenarioA.caption, p.scenarioB.label, p.scenarioB.caption, p.changedFact, p.comparisonLabels.guide, p.comparisonLabels.neutral]',
  // the card kind labels (generic captions); only the fact label is listed because the others are substrings of the
  // supplied lane labels ("…states its intermediate premise"), which are content, not captions
  captions: "return [p.locale === 'es' ? 'HECHO' : 'FACT']",
});
motifDomChecks(ID, {at: [0.35, 0.7, 1], clearOfText: ['guide-line']});
