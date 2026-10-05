// Shared per-ratio semantic checks for the "Analogía de casos" motif
// (LAW-0085..0088). The contract battery evaluates semantics at 1920×1080
// only; these checks create real instances at 16:9, 1:1 and 9:16 for every
// saved preset (plus optional extra params) and assert the given expressions.
// `s` = semantic state, `P` = the instance's resolved params, `D` = facts
// measured on the rendered SVG:
//   D.truncated   visible texts cut with an ellipsis (fit truncation)
//   D.contentMin  smallest visible author-supplied text, px at 1080p
//   D.captionMax  largest visible built-in (generic) caption, px at 1080p
//   D.missing     supplied issues / assumptions not drawn whole
//   D.small       author texts below 16 px (for messages)
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

const SIZES = {'16:9': [1920, 1080], '1:1': [1080, 1080], '9:16': [1080, 1920]};

/**
 * @param {string} id
 * @param {Array<{at:number, fn:string, label:string, params?:object, presets?:string[]}>} checks
 */
export function ratioChecks(id, checks) {
  test(`${id}: per-ratio semantic checks (every preset × 16:9 / 1:1 / 9:16)`, async ({page}) => {
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = presetsFor(id);
    const out = await page.evaluate(async ([i, cs, ps, sizes]) => {
      const def = await window.__lib.load(i);
      const norm = t => String(t || '').replace(/\s+/g, ' ').trim();
      // author-supplied strings (content) from the resolved params
      const userStrings = P => {
        const out = [];
        const add = v => { if (typeof v === 'string' && norm(v).length >= 3) out.push(norm(v)); };
        const walk = v => { if (typeof v === 'string') add(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
        walk(P.cases);
        (P.facts || []).forEach(f => { add(f.a); add(f.b); });
        walk(P.rules);
        walk(P.issues);
        walk(P.assumptions);
        walk(P.actorLabels);
        walk(P.objectLabels);
        (P.annotations || []).forEach(a => add(a.text));
        (P.elements || []).forEach(e => add(e.label));
        walk(P.contextLabels);
        add(P.beforeValue);
        add(P.afterValue);
        walk(P.relationLabels);
        return out;
      };
      const measure = (el, P) => {
        const svg = el.querySelector('svg');
        const vb = svg.viewBox.baseVal;
        const k = 1080 / Math.min(vb.width, vb.height);
        const sm = svg.getCTM();
        const su = Math.hypot(sm.a, sm.b);
        const users = userStrings(P);
        const res = {truncated: [], contentMin: Infinity, contentMinText: '', captionMax: 0, captionMaxText: '', missing: [], small: [], drawn: []};
        for (const t of svg.querySelectorAll('text')) {
          let vis = true;
          for (let n = t; n && n !== svg; n = n.parentNode) {
            const o = n.getAttribute && n.getAttribute('opacity');
            if (o !== null && o !== undefined && Number(o) <= 0.02) vis = false;
            if (n.getAttribute && n.getAttribute('display') === 'none') vis = false;
          }
          if (!vis || t.closest('[data-layer="content-notice"]')) continue;
          const b = t.getBBox();
          if (!b.width || !b.height) continue;
          const title = t.querySelector('title');
          const shown = norm(Array.from(t.querySelectorAll('tspan')).map(x => x.textContent).join(' ') || t.textContent);
          if (shown.length <= 2) continue; // badge letters (A / B)
          const full = title ? norm(title.textContent) : shown;
          if (title) res.truncated.push(shown);
          const m = t.getCTM();
          const px = parseFloat(t.getAttribute('font-size')) * (Math.hypot(m.a, m.b) / su) * k;
          const isContent = users.some(u => full.includes(u) || u.includes(full.replace(/…$/, '')));
          if (isContent) {
            if (px < res.contentMin) { res.contentMin = px; res.contentMinText = shown; }
            if (px < 16) res.small.push(`${shown.slice(0, 40)} @${px.toFixed(1)}`);
            if (!title) res.drawn.push(full);
          } else if (px > res.captionMax) { res.captionMax = px; res.captionMaxText = shown; }
        }
        const need = [...(P.issues || []), ...(P.assumptions || [])].map(norm).filter(Boolean);
        res.missing = need.filter(u => !res.drawn.some(d => d.includes(u)));
        // every other supplied field drawn as whole, readable text (never a
        // placeholder bar): case names and notes, rule name and quote, facts
        const fields = [];
        ['a', 'b'].forEach(k => { const c = (P.cases || {})[k] || {}; fields.push(c.name, c.note); });
        (P.rules || []).forEach(r0 => fields.push(r0.name, r0.text));
        (P.facts || []).forEach(f => fields.push(f.a, f.b));
        const drawnAll = res.drawn.join(' ¦ ');
        res.missingFields = [...new Set(fields.map(norm).filter(u => u.length >= 3))].filter(u => !drawnAll.includes(u));
        res.contentMin = Math.round(res.contentMin * 10) / 10;
        res.captionMax = Math.round(res.captionMax * 10) / 10;
        delete res.drawn;
        return res;
      };
      const res = [];
      let n = 0;
      for (const [ratio, [w, hh]] of Object.entries(sizes)) {
        for (const pr of ps) {
          for (const c of cs) {
            if (c.presets && !c.presets.includes(pr.name)) continue;
            const el = document.createElement('div');
            el.className = 'slot';
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: hh, instanceId: `rc${n++}`});
            await x.ready;
            x.setParams({...pr.params, ...(c.params || {})});
            x.seek(c.at * x.durationMs);
            const st = x.getState({bounds: false});
            const s = st.semantic, P = st.params;
            const D = measure(el, P);
            let pass = false, err = null;
            try {
              pass = Boolean(new Function('s', 'P', 'D', `return (${c.fn});`)(s, P, D));
            } catch (e) {
              err = String(e.message);
            }
            res.push({label: `${c.label} [${pr.name} ${ratio}${c.params ? ' ' + JSON.stringify(c.params) : ''} @${c.at}]`, pass, err, s, D});
            x.destroy();
            el.remove();
          }
        }
      }
      return res;
    }, [id, checks, presets, SIZES]);
    for (const r of out) expect.soft(r.pass, `${r.label}${r.err ? ' — ' + r.err : ''}\nD=${JSON.stringify(r.D)}\ns=${JSON.stringify(r.s).slice(0, 900)}`).toBe(true);
  });
}

/** Text checks shared by the motif's entries (every preset × ratio). */
export const TEXT_CHECKS = [
  {at: 1, fn: 'D.truncated.length === 0', label: 'no visible text is cut with an ellipsis (facts, case names, notes, tags, assumptions, rule quote)'},
  {at: 1, fn: "P.textVisibility !== 'all' || D.missing.length === 0", label: 'every supplied issue and assumption is drawn whole'},
  {at: 1, fn: "P.textVisibility !== 'all' || D.missingFields.length === 0", label: 'every supplied name, note, rule text and fact is drawn as whole, readable text (no placeholder bars)'},
  {at: 1, fn: 'D.contentMin === Infinity || D.contentMin >= 16', label: 'author-supplied content text is at least 16 px at 1080p'},
  {at: 1, fn: 'D.contentMin === Infinity || D.captionMax <= D.contentMin + 0.6', label: 'no generic caption is larger than the smallest content text'},
];
