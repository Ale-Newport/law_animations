// Shared rendered-DOM text audit for any animation (promoted from the
// reasoning-10 motif checks). It measures the REAL render in each real ratio
// (the contract suite itself only lays out semantics at 1920×1080):
//  - every supplied editable text field is drawn as visible, un-truncated
//    <text> at the sampled times (AUTHORING items 2 and 14);
//  - supplied/key text is ≥ 16 px at 1080p in every preset × ratio (≥ ~20 px in
//    the baseline) and never smaller than the generic captions (items 10, 17);
//  - optionally, a neutral "no conclusion" key is present.
// Usage in tests/animations/LAW-xxxx.test.js:
//   import {suppliedTextSuite} from '../harness/supplied-text.js';
//   suppliedTextSuite('LAW-xxxx', {
//     fields: 'return [p.issue, ...(p.assumptions||[]), ...p.facts.map(f => f.text)]',
//     captions: 'return [p.labels.relation, "Rule"]',
//   });
// fields / content / captions are BODIES of functions (p) => string[] evaluated
// in the page with p = the instance's resolved params.
import {test, expect} from '@playwright/test';
import {presetsFor} from './contract.js';

export const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

/**
 * @param {string} id
 * @param {{fields: string, content?: string, captions?: string, at?: number[], baselineMin?: number,
 *   stressMin?: number, minAny?: number, keyNote?: boolean, allowTruncated?: string[]}} o
 */
export function suppliedTextSuite(id, o) {
  const baseMin = o.baselineMin ?? 19.5;
  const stressMin = o.stressMin ?? 16;
  test.describe(`${id} supplied text`, () => {
    test(`${id}: supplied fields drawn un-truncated; key text >= ${stressMin} px (>= ${baseMin} px baseline) and >= generic captions`, async ({page}) => {
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const presets = [{name: 'default', params: {}}, ...presetsFor(id)];
      const out = await page.evaluate(async ([id, presets, ratios, o]) => {
        const def = await window.__lib.load(id);
        const norm = s => String(s).toLowerCase().replace(/\s+/g, '');
        const fieldsOf = new Function('p', o.fields);
        const captionsOf = new Function('p', o.captions || 'return []');
        const contentOf = new Function('p', o.content || o.fields);
        const shown = el => {
          for (let n = el; n && n.tagName !== 'svg'; n = n.parentNode) {
            const op = n.getAttribute && n.getAttribute('opacity');
            if (op !== null && op !== undefined && parseFloat(op) < 0.5) return false;
            if (n.getAttribute && n.getAttribute('display') === 'none') return false;
          }
          const b = el.getBBox();
          return b.width > 0 && b.height > 0 && !el.closest('[data-layer="content-notice"]');
        };
        const rows = [];
        for (const pr of presets) {
          for (const [ratio, w, h] of ratios) {
            for (const at of o.at || [1]) {
              const el = document.createElement('div');
              document.getElementById('slots').appendChild(el);
              const x = def.create(el, {width: w, height: h, params: pr.params});
              await x.ready;
              x.seek(x.durationMs * at);
              const p = x.getState({bounds: false}).params;
              const svg = x.element;
              const rootM = svg.getScreenCTM();
              const k = 1080 / Math.min(w, h);
              const texts = [...svg.querySelectorAll('text')].filter(shown).map(t => {
                const m = rootM.inverse().multiply(t.getScreenCTM());
                const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
                const content = [...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ');
                return {n: norm(content), px, truncated: content.includes('…') && !(o.allowTruncated || []).some(a => content.includes(a))};
              });
              const find = f => texts.filter(tx => tx.n.includes(norm(f)));
              const missing = fieldsOf(p).filter(Boolean).filter(f => !find(f).length);
              const contentPx = contentOf(p).filter(Boolean).flatMap(f => find(f).map(tx => tx.px));
              const capPx = captionsOf(p).filter(Boolean).flatMap(c => find(c).map(tx => tx.px));
              const allPx = texts.map(tx => tx.px);
              rows.push({
                preset: pr.name, ratio, at, missing,
                truncated: texts.filter(tx => tx.truncated).map(tx => tx.n.slice(0, 40)),
                note: texts.some(tx => /noconclusion|sinconclusi/.test(tx.n)),
                minContent: contentPx.length ? Math.round(Math.min(...contentPx) * 10) / 10 : null,
                maxCaption: capPx.length ? Math.round(Math.max(...capPx) * 10) / 10 : 0,
                minAny: allPx.length ? Math.round(Math.min(...allPx) * 10) / 10 : null,
                smallest: texts.slice().sort((a, b) => a.px - b.px).slice(0, 3).map(tx => `${tx.n.slice(0, 24)}=${tx.px.toFixed(1)}`),
              });
              x.destroy();
              el.remove();
            }
          }
        }
        return rows;
      }, [id, presets, RATIOS, o]);
      console.log(JSON.stringify(out.map(r => [r.preset, r.ratio, r.minContent, r.maxCaption, r.smallest.join(' | '), r.missing.join(',')])));
      for (const r of out) {
        const tag = `${r.preset} ${r.ratio} @${r.at}`;
        expect.soft(r.missing, `${tag}: supplied fields not visible`).toEqual([]);
        expect.soft(r.truncated, `${tag}: truncated texts`).toEqual([]);
        if (o.keyNote !== false) expect.soft(r.note, `${tag}: "no conclusion drawn" key`).toBe(true);
        expect.soft(r.minAny, `${tag}: smallest visible text (px at 1080p)`).toBeGreaterThanOrEqual(o.minAny ?? 14);
        expect.soft(r.minContent, `${tag}: supplied text px`).toBeGreaterThanOrEqual(r.preset === 'default' || r.preset === 'baseline-illustrative' ? baseMin : stressMin);
        expect.soft(r.minContent, `${tag}: supplied text never smaller than generic captions`).toBeGreaterThanOrEqual(r.maxCaption - 0.6);
      }
    });
  });
}

/**
 * Contrast treatments: before the change beat the scene state of A and B
 * (semantic.lookA / semantic.lookB, any serializable description of what is
 * visible in each scene) is identical in every preset × ratio, labels on/off.
 */
export function identicalBeforeChange(id, changeAt) {
  test(`${id}: A and B are identical before the change beat (all presets × ratios × labels on/off)`, async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(id)];
    const out = await page.evaluate(async ([id, presets, ratios, changeAt]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let checked = 0;
      for (const pr of presets) {
        for (const tv of ['all', 'none']) {
          for (const [ratio, w, h] of ratios) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, instanceId: `ab-${checked}`, params: {...pr.params, textVisibility: tv}});
            await x.ready;
            for (const f of [0, 0.3, 0.6, 0.85, 0.99]) {
              x.seek(f * changeAt * x.durationMs);
              const s = x.getState({bounds: false}).semantic;
              checked++;
              const a = JSON.stringify(s.lookA), b = JSON.stringify(s.lookB);
              if (!s.lookA || a !== b) fails.push({preset: pr.name, tv, ratio, u: f * changeAt, a, b});
            }
            x.destroy();
            el.remove();
          }
        }
      }
      return {fails, checked};
    }, [id, presets, RATIOS, changeAt]);
    expect(out.checked).toBeGreaterThan(100);
    expect(out.fails.slice(0, 4)).toEqual([]);
  });
}
