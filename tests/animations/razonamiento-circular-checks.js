// Motif check for "Razonamiento circular" (LAW-0105..0108): no supplied word is broken mid-word across two
// rendered lines ("Castellan / os") in any preset × ratio at the hold (AUTHORING item 13); the motif kit's
// own labels (e.g. the kind label "AFIRMACIÓN") are checked the same way, case-insensitively. Breaks right
// after a hyphen are allowed (a word too long for its box is split at its hyphen, never inside a word).
// The shared text audit itself comes from tests/harness/supplied-text.js.
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

/**
 * @param {string} id @param {string} fields body of (p) => string[] (the supplied texts)
 * @param {{strictHyphen?: boolean}} [o] strictHyphen: an inserted hyphen ("AFIRMA-" / "CIÓN") is a mid-word break
 *   too; only a hyphen that belongs to the word itself ("Oyelaran-" / "Castellanos") may end a line
 */
export function midWordSuite(id, fields, o = {}) {
  test(`${id}: no supplied word is broken mid-word (all presets × ratios)`, async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(id)];
    const out = await page.evaluate(async ([id, presets, fields, strict]) => {
      const def = await window.__lib.load(id);
      const kit = await import('/src/animations/reasoning/kits/razonamiento-circular.js');
      const kitWords = Object.values(kit.RC_STRINGS).flatMap(tbl => Object.values(tbl)).filter(v => typeof v === 'string');
      const fieldsOf = new Function('p', fields);
      const clean = w => w.replace(/[.,;:?¿!¡()«»"]/g, '');
      const rows = [];
      for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        x.seek(x.durationMs);
        const words = new Set([...fieldsOf(x.getState({bounds: false}).params).filter(Boolean), ...kitWords].join(' ').split(/\s+/).map(clean).filter(Boolean).map(w => w.toLowerCase()));
        for (const t of x.element.querySelectorAll('text')) {
          const spans = [...t.querySelectorAll('tspan')].map(sp => sp.textContent.trim());
          for (let i = 1; i < spans.length; i++) {
            const a = clean(spans[i - 1].split(' ').pop()), b = clean(spans[i].split(' ')[0]);
            if (a && b && !a.endsWith('-') && !words.has(a.toLowerCase()) && words.has((a + b).toLowerCase())) rows.push(`${pr.name} ${ratio}: ${a}/${b}`);
            if (strict && a.endsWith('-') && words.has((a.slice(0, -1) + b).toLowerCase())) rows.push(`${pr.name} ${ratio}: ${a}/${b} (inserted hyphen)`);
          }
        }
        x.destroy();
        el.remove();
      }
      return rows;
    }, [id, presets, fields, !!o.strictHyphen]);
    expect(out).toEqual([]);
  });
}

/**
 * A semantic predicate that must hold for every preset × ratio (× text visibility) at the given times.
 * @param {string} id @param {string} title
 * @param {string} fn body of (s, u) => boolean, evaluated on getState().semantic
 * @param {{at?: number[], visibility?: string[]}} [o]
 */
export function everyLayoutSuite(id, title, fn, o = {}) {
  test(`${id}: ${title} (all presets × ratios)`, async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(id)];
    const out = await page.evaluate(async ([id, presets, fn, at, vis]) => {
      const def = await window.__lib.load(id);
      const pred = new Function('s', 'u', `return (${fn});`);
      const bad = [];
      for (const pr of presets) for (const tv of vis) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        for (const u of at) {
          x.seek(x.durationMs * u);
          const s = x.getState({bounds: false}).semantic;
          let ok = false;
          try { ok = !!pred(s, u); } catch (e) { ok = false; }
          if (!ok) bad.push(`${pr.name} ${ratio} ${tv} u=${u}`);
        }
        x.destroy();
        el.remove();
      }
      return bad;
    }, [id, presets, fn, o.at ?? [1], o.visibility ?? ['all']]);
    expect(out).toEqual([]);
  });
}
