// Whole-word wrapping audit for the delegacion-normativa motif (LAW-0145..0148),
// rendered in the real 16:9, 9:16 and 1:1 frames at several times:
//  - every visible word on every drawn line is a whole word of the supplied or
//    built-in text (no "commit / tee", "user-supplie / d");
//  - no visible line (or run) starts with a lone closing punctuation mark
//    ("." / ")" / "," on their own).
// Usage: wordBreakSuite('LAW-xxxx', {extra: ['words', 'used', 'by', 'the', 'scene']});
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

/**
 * @param {string} id
 * @param {{at?: number[], extra?: string[]}} [o]
 */
export function wordBreakSuite(id, o = {}) {
  test.describe(`${id} whole words`, () => {
    test(`${id}: lines break between whole words; no line starts with a split fragment or a lone punctuation mark`, async ({page}) => {
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const presets = [{name: 'default', params: {}}, ...presetsFor(id)];
      const out = await page.evaluate(async ([id, presets, ratios, at, extra]) => {
        const def = await window.__lib.load(id);
        const kit = await import('/src/animations/sources/kits/delegacion-normativa.js');
        const i18n = await import('/src/core/i18n.js');
        const core = w => w.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
        const walk = (v, acc) => {
          if (typeof v === 'string') acc.push(v);
          else if (Array.isArray(v)) v.forEach(x => walk(x, acc));
          else if (v && typeof v === 'object') Object.values(v).forEach(x => walk(x, acc));
          return acc;
        };
        const LONE = /^[.,;:!?)\]}»”’…]+$/;
        const bad = [];
        for (const pr of presets) {
          for (const [ratio, w, h] of ratios) {
            for (const u of at) {
              const el = document.createElement('div');
              document.getElementById('slots').appendChild(el);
              const x = def.create(el, {width: w, height: h, params: pr.params});
              await x.ready;
              x.seek(x.durationMs * u);
              const p = x.getState({bounds: false}).params;
              const loc = p.locale || 'en';
              const vocab = new Set(walk([p, kit.KIT_STRINGS[loc] || kit.KIT_STRINGS.en, i18n.strings(loc, {}), extra], [])
                .flatMap(s => s.split(/[\s ]+/)).map(core).filter(Boolean));
              const shown = n => {
                for (let q = n; q && q.tagName !== 'svg'; q = q.parentNode) {
                  const op = q.getAttribute && q.getAttribute('opacity');
                  if (op !== null && op !== undefined && parseFloat(op) < 0.05) return false;
                  if (q.getAttribute && q.getAttribute('display') === 'none') return false;
                }
                const b = n.getBBox();
                return b.width > 0 && b.height > 0;
              };
              for (const t of x.element.querySelectorAll('text')) {
                if (!shown(t)) continue;
                const spans = [...t.querySelectorAll('tspan')];
                const runs = spans.length ? spans.filter(shown).map(s => s.textContent) : [[...t.childNodes].filter(c => c.nodeName !== 'title').map(c => c.textContent).join(' ')];
                for (const run of runs) {
                  const toks = run.split(/[\s ]+/).filter(Boolean);
                  if (!toks.length) continue;
                  if (LONE.test(toks[0])) bad.push(`${pr.name} ${ratio} u=${u}: line starts with lone "${toks[0]}" in "${run}"`);
                  for (const tk of toks) {
                    if (tk.includes('…')) continue;
                    const c = core(tk);
                    if (c && !vocab.has(c)) bad.push(`${pr.name} ${ratio} u=${u}: "${tk}" is not a whole word (line "${run}")`);
                  }
                }
              }
              x.destroy?.();
              el.remove();
            }
          }
        }
        return [...new Set(bad)];
      }, [id, presets, RATIOS, o.at || [0.35, 0.7, 1], o.extra || []]);
      expect(out, out.slice(0, 30).join('\n')).toEqual([]);
    });
  });
}
