// Shared per-ratio semantic checks for the "Texto y contexto" motif
// (LAW-0121..0124). The contract battery evaluates semantics at 1920×1080
// only; these checks create real instances at 16:9, 1:1 and 9:16 for every
// saved preset, with labels shown and hidden, and assert each expression at
// every listed time. `s` = semantic state, `P` = resolved params, `u` = time.
// A check may instead give `dom`: an expression over `svg` (the rendered root)
// and `visible(el)` (no ancestor hidden by opacity 0 / display none).
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

const SIZES = {'16:9': [1920, 1080], '1:1': [1080, 1080], '9:16': [1080, 1920]};

/**
 * @param {string} id
 * @param {string} title
 * @param {Array<{at:number[], fn?:string, dom?:string, label:string, params?:object, presets?:string[], tv?:string[], ratios?:string[]}>} checks
 */
export function ratioChecks(id, title, checks) {
  test(`${id}: ${title} (every preset × 16:9 / 1:1 / 9:16 × labels shown/hidden)`, async ({page}) => {
    test.setTimeout(180000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = presetsFor(id);
    const out = await page.evaluate(async ([i, cs, ps, sizes]) => {
      const def = await window.__lib.load(i);
      const visible = el => {
        for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) {
          if (e.getAttribute('opacity') === '0' || e.getAttribute('display') === 'none') return false;
          const cs2 = getComputedStyle(e);
          if (cs2.display === 'none' || cs2.visibility === 'hidden' || cs2.opacity === '0') return false;
        }
        return true;
      };
      const res = [];
      let n = 0;
      for (const [ratio, [w, hh]] of Object.entries(sizes)) {
        for (const pr of ps) {
          for (const tv of ['all', 'none']) {
            const mine = cs.filter(c => (!c.presets || c.presets.includes(pr.name)) && (!c.tv || c.tv.includes(tv)) && (!c.ratios || c.ratios.includes(ratio)));
            if (!mine.length) continue;
            for (const c of mine) {
              const el = document.createElement('div');
              el.className = 'slot';
              document.getElementById('slots').appendChild(el);
              const x = def.create(el, {width: w, height: hh, instanceId: `tc${n++}`, params: {...pr.params, ...(c.params || {}), textVisibility: tv}});
              await x.ready;
              const bad = [];
              let err = null;
              for (const u of c.at) {
                x.seek(u * x.durationMs);
                const st = x.getState({bounds: false});
                const s = st.semantic, P = st.params;
                try {
                  const ok = c.dom
                    ? new Function('svg', 'visible', 'u', `return (${c.dom});`)(el.querySelector('svg'), visible, u)
                    : new Function('s', 'P', 'u', `return (${c.fn});`)(s, P, u);
                  if (!ok) bad.push({u, s: JSON.stringify(s).slice(0, 300)});
                } catch (e) {
                  err = String(e.message);
                }
              }
              res.push({label: `${c.label} [${pr.name} ${ratio} labels:${tv}]`, pass: !bad.length && !err, err, bad: bad.slice(0, 3)});
              x.destroy();
              el.remove();
            }
          }
        }
      }
      return res;
    }, [id, checks, presets, SIZES]);
    for (const r of out) expect.soft(r.pass, `${r.label}${r.err ? ' — ' + r.err : ''}\n${JSON.stringify(r.bad)}`).toBe(true);
  });
}

/** Evenly spaced times from a to b (inclusive). */
export const times = (a, b, step) => {
  const out = [];
  for (let u = a; u <= b + 1e-9; u += step) out.push(Math.round(u * 10000) / 10000);
  return out;
};
