// Shared per-ratio checks for the "Definición legislativa" motif (LAW-0125..0128).
// The contract battery evaluates semantics at 1920×1080 only; these checks create
// real instances at 16:9, 1:1 and 9:16 for every saved preset, with labels shown
// and hidden, and assert
//  - semantic expressions (`s` = semantic state, `P` = resolved params), and
//  - DOM facts measured on the rendered SVG:
//      minPx      every visible text inside the named nodes is >= `min` px on the frame
//      lensWords  every visible text inside the lens copy lies wholly inside the lens source circle
//                 (the lens never shows a word cut in half)
//      lensHas    the given words are drawn as text in the lens copy
//      fieldsText every supplied field (list of strings) is present as visible text at >= min px
//      lensOrder  the lens shows exactly the given text's words, in their original order
//      clearOf    no visible text outside `win` has its box inside the circle of `win`
//                 (a parked lens never covers a label)
//      nodeCount  the number of visible nodes whose data-node name matches `re` equals `n`
//      within     every visible named node lies wholly inside the box of node `box`
//      clearOfText the named node covers no visible text run outside itself (and outside `except`)
//      widthShare each named node's rendered width is >= `min` of the frame's width
//      strokePx   the named paths' stroke width on the frame is >= `min` px
//      holdsToEnd the frame is identical to the last frame (use with `at: 'hold'` = 1 s before the end)
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

const SIZES = {'16:9': [1920, 1080], '1:1': [1080, 1080], '9:16': [1080, 1920]};

/**
 * @param {string} id
 * @param {string} title
 * @param {Array<{at:number, label:string, fn?:string, dom?:object, params?:object, presets?:string[], ratios?:string[], tvs?:string[]}>} checks
 */
export function motifChecks(id, title, checks) {
  test(`${id}: ${title} (every preset × 16:9 / 1:1 / 9:16 × labels shown/hidden)`, async ({page}) => {
    test.setTimeout(180000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = presetsFor(id);
    const out = await page.evaluate(async ([i, cs, ps, sizes]) => {
      const def = await window.__lib.load(i);
      const res = [];
      let n = 0;
      const visible = (el, root) => {
        for (let e = el; e && e !== root; e = e.parentElement) {
          if (e.getAttribute('display') === 'none') return false;
          const op = e.getAttribute('opacity');
          if (op !== null && Number(op) <= 0.01) return false;
        }
        return true;
      };
      const texts = root => [...root.querySelectorAll('text')].filter(t => t.textContent.trim() && visible(t, root.ownerSVGElement || root));
      const byName = (svg, name) => svg.querySelector(`[data-node="${name}"]`);
      for (const [ratio, [w, hh]] of Object.entries(sizes)) {
        for (const pr of ps) {
          for (const c of cs) {
            if (c.presets && !c.presets.includes(pr.name)) continue;
            if (c.ratios && !c.ratios.includes(ratio)) continue;
            for (const tv of c.tvs || ['all', 'none']) {
              const el = document.createElement('div');
              el.style.cssText = `width:${w / 4}px;height:${hh / 4}px;display:inline-block`;
              document.getElementById('slots').appendChild(el);
              const x = def.create(el, {width: w, height: hh, instanceId: `dl${n++}`});
              await x.ready;
              x.setParams({...pr.params, ...(c.params || {}), textVisibility: tv});
              // `at: 'hold'` = 1000 ms before the end of the default duration
              const atU = c.at === 'hold' ? 1 - 1000 / x.durationMs : c.at;
              x.seek(atU * x.durationMs);
              const st = x.getState({bounds: false});
              const s = st.semantic, P = st.params;
              const svg = el.querySelector('svg');
              const k = w / svg.getBoundingClientRect().width;
              let pass = true, err = null, detail = null;
              try {
                if (c.fn) pass = Boolean(new Function('s', 'P', `return (${c.fn});`)(s, P));
                const d = c.dom;
                if (pass && d && d.kind === 'minPx') {
                  const small = [];
                  for (const name of d.nodes) {
                    const node = byName(svg, name);
                    if (!node || !visible(node, svg)) continue;
                    for (const t of texts(node)) {
                      const m = t.getScreenCTM();
                      const px = parseFloat(t.getAttribute('font-size')) * Math.hypot(m.a, m.b) * k;
                      if (px < d.min - 0.05) small.push(`${name}: "${t.textContent.slice(0, 40)}" ${px.toFixed(1)}px`);
                    }
                  }
                  pass = small.length === 0;
                  detail = small;
                } else if (pass && d && d.kind === 'lensWords') {
                  const content = byName(svg, d.content);
                  const src = new Function('s', `return (${d.source});`)(s);
                  const bad = [];
                  if (content && src) {
                    const inv = content.getCTM().inverse();
                    // each word run (a tspan with its own position, or a whole text) is checked on its own
                    const runs = [...content.querySelectorAll('text')].flatMap(q => {
                      const sp = [...q.querySelectorAll('tspan')].filter(z => z.hasAttribute('x') && z.hasAttribute('y'));
                      return sp.length ? sp : [q];
                    }).filter(q => q.textContent.trim() && visible(q, svg));
                    for (const t of runs) {
                      const b = t.getBBox();
                      const M = inv.multiply((t.closest('text') || t).getCTM());
                      const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([px, py]) => new DOMPoint(px, py).matrixTransform(M));
                      // glyph boxes include ascender/descender room: 2 units of tolerance
                      const out = src.r === undefined
                        ? pts.some(q => q.x < src.x - 2 || q.x > src.x + src.w + 2 || q.y < src.y - 4 || q.y > src.y + src.h + 4)
                        : pts.some(q => Math.hypot(q.x - src.x, q.y - src.y) > src.r + 2);
                      if (out) bad.push(`"${t.textContent}" outside the lens source`);
                    }
                  }
                  pass = bad.length === 0;
                  detail = bad;
                } else if (pass && d && d.kind === 'lensHas') {
                  // the key words are drawn as TEXT in the lens copy (not replaced by bars)
                  const content = byName(svg, d.content);
                  const want = String(new Function('s', 'P', `return (${d.text});`)(s, P)).split(/\s+/).filter(Boolean);
                  const got = content ? [...content.querySelectorAll('text')].filter(q => visible(q, svg)).map(q => q.textContent).join(' ') : '';
                  const missing = want.filter(wd => !got.includes(wd));
                  pass = missing.length === 0;
                  detail = missing.length ? [`missing in the lens: ${missing.join(' ')}`] : [];
                } else if (pass && d && (d.kind === 'fieldsText' || d.kind === 'lensOrder')) {
                  // words of a text element in reading order (tspans are separate runs: join them with spaces)
                  const words = str => String(str).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/).filter(Boolean);
                  const runText = el => {
                    const sp = [...el.querySelectorAll('tspan')];
                    return sp.length ? sp.map(z => z.textContent).join(' ') : el.textContent;
                  };
                  const pxOf = el => { const m = el.getScreenCTM(); return parseFloat(el.getAttribute('font-size')) * Math.hypot(m.a, m.b) * k; };
                  if (d.kind === 'fieldsText') {
                    // every supplied field is present as visible TEXT at >= min px (not bars, not tiny)
                    const big = texts(svg).filter(el => pxOf(el) >= d.min - 0.05);
                    const hay = ` ${big.map(el => words(runText(el)).join(' ')).join(' ')} `;
                    const fields = new Function('s', 'P', `return (${d.fields});`)(s, P).filter(f => f && String(f).trim());
                    const missing = fields.filter(f => !hay.includes(` ${words(f).join(' ')} `));
                    pass = missing.length === 0;
                    detail = missing.map(f => `not drawn as text >= ${d.min}px: "${String(f).slice(0, 60)}"`);
                  } else {
                    // the lens shows the expected words, whole and in their original order
                    const content = byName(svg, d.content);
                    const got = content ? [...content.querySelectorAll('text')].filter(q => visible(q, svg)).map(q => words(runText(q)).join(' ')).join(' ') : '';
                    const want = words(new Function('s', 'P', `return (${d.text});`)(s, P)).join(' ');
                    pass = got === want;
                    detail = pass ? [] : [`lens reads "${got}", expected "${want}"`];
                  }
                } else if (pass && d && d.kind === 'clearOf') {
                  const win = byName(svg, d.win);
                  const bad = [];
                  if (win && visible(win, svg)) {
                    const rim = win.querySelector('[data-node$="-rim"]');
                    const cr = rim.getBoundingClientRect();
                    const round = rim.tagName.toLowerCase() === 'circle';
                    const cc = {x: cr.x + cr.width / 2, y: cr.y + cr.height / 2, r: cr.width / 2};
                    for (const t of texts(svg)) {
                      if (win.contains(t)) continue;
                      const r = t.getBoundingClientRect();
                      const nx = Math.max(r.x, Math.min(cc.x, r.x + r.width)), ny = Math.max(r.y, Math.min(cc.y, r.y + r.height));
                      const under = round ? Math.hypot(nx - cc.x, ny - cc.y) < cc.r - 0.5
                        : r.x < cr.x + cr.width - 0.5 && r.x + r.width > cr.x + 0.5 && r.y < cr.y + cr.height - 0.5 && r.y + r.height > cr.y + 0.5;
                      if (under) bad.push(`"${t.textContent.slice(0, 40)}" under the lens`);
                    }
                  }
                  pass = bad.length === 0;
                  detail = bad;
                } else if (pass && d && d.kind === 'within') {
                  // every visible named node lies wholly inside the box node (e.g. the magnifier on the desk)
                  const box = byName(svg, d.box).getBoundingClientRect();
                  const tol = (d.tol ?? 1) / k;
                  const bad = [];
                  for (const name of d.nodes) {
                    const q = byName(svg, name);
                    if (!q || !visible(q, svg)) continue;
                    const b = q.getBoundingClientRect();
                    if (b.x < box.x - tol || b.y < box.y - tol || b.x + b.width > box.x + box.width + tol || b.y + b.height > box.y + box.height + tol) bad.push(`${name} leaves ${d.box}`);
                  }
                  pass = bad.length === 0;
                  detail = bad;
                } else if (pass && d && d.kind === 'clearOfText') {
                  // the named node covers no visible word outside itself (each positioned line run is checked)
                  const q = byName(svg, d.node);
                  const bad = [];
                  if (q && visible(q, svg)) {
                    const b = q.getBoundingClientRect();
                    const tol = 1 / k;
                    const ex = d.except ? byName(svg, d.except) : null;
                    for (const t of texts(svg)) {
                      if (q.contains(t) || (ex && ex.contains(t))) continue;
                      const sp = [...t.querySelectorAll('tspan')].filter(z => z.hasAttribute('x') || z.hasAttribute('dy') || z.hasAttribute('y'));
                      for (const run of (sp.length ? sp : [t])) {
                        if (!run.textContent.trim()) continue;
                        const r = run.getBoundingClientRect();
                        if (r.x < b.x + b.width - tol && r.x + r.width > b.x + tol && r.y < b.y + b.height - tol && r.y + r.height > b.y + tol) bad.push(`"${run.textContent.slice(0, 40)}" under ${d.node}`);
                      }
                    }
                  }
                  pass = bad.length === 0;
                  detail = bad;
                } else if (pass && d && d.kind === 'widthShare') {
                  // each named node's rendered width is >= `min` of the frame's width
                  const fw = svg.getBoundingClientRect().width;
                  const bad = [];
                  for (const name of d.nodes) {
                    const q = byName(svg, name);
                    const sh = q ? q.getBoundingClientRect().width / fw : 0;
                    if (sh < d.min) bad.push(`${name}: ${(sh * 100).toFixed(1)}% of the frame width`);
                  }
                  pass = bad.length === 0;
                  detail = bad;
                } else if (pass && d && d.kind === 'strokePx') {
                  // the named paths' stroke width on the frame is >= `min` px
                  const bad = [];
                  for (const name of d.nodes) {
                    const q = byName(svg, name);
                    if (!q || !visible(q, svg)) continue;
                    const m = q.getScreenCTM();
                    const px = parseFloat(q.getAttribute('stroke-width')) * Math.hypot(m.a, m.b) * k;
                    if (!(px >= d.min - 0.05)) bad.push(`${name}: ${px.toFixed(2)}px`);
                  }
                  pass = bad.length === 0;
                  detail = bad;
                } else if (pass && d && d.kind === 'holdsToEnd') {
                  // the frame at this time is identical to the last frame: every hold element is complete
                  // (full opacity, final position) and nothing moves any more
                  const here = svg.outerHTML;
                  x.seek(x.durationMs);
                  const end = svg.outerHTML;
                  pass = here === end;
                  if (!pass) {
                    let i = 0;
                    while (i < here.length && here[i] === end[i]) i++;
                    detail = [`first difference: …${here.slice(Math.max(0, i - 160), i + 60)}… vs …${end.slice(Math.max(0, i - 160), i + 60)}…`];
                  }
                } else if (pass && d && d.kind === 'nodeCount') {
                  const re = new RegExp(d.re);
                  const found = [...svg.querySelectorAll('[data-node]')].filter(q => re.test(q.getAttribute('data-node')) && visible(q, svg)).map(q => q.getAttribute('data-node'));
                  pass = found.length === d.n;
                  detail = found;
                }
              } catch (e) {
                pass = false;
                err = String(e.message);
              }
              res.push({label: `${c.label} [${pr.name} ${ratio} labels:${tv}${c.params ? ' ' + JSON.stringify(c.params) : ''} @${c.at}]`, pass, err, detail, s: pass ? null : s});
              x.destroy();
              el.remove();
            }
          }
        }
      }
      return res;
    }, [id, checks, presets, SIZES]);
    for (const r of out) expect.soft(r.pass, `${r.label}${r.err ? ' — ' + r.err : ''}\n${JSON.stringify(r.detail)}\n${JSON.stringify(r.s).slice(0, 1200)}`).toBe(true);
  });
}
