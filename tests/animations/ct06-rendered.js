// Rendered checks shared by the contract-terms-06 tests (LAW-0501..0504, "Limitación contractual"). Generic test
// infrastructure copied (not imported) from tests/animations/ct05-rendered.js; only the banned-wording check is
// adapted: noConditionRuleWords (kept name) — no rendered text (EN and ES) states doctrine on limitation or exclusion
// clauses: enforceability, validity or effect, a cap, limit or amount, a percentage or currency, must / shall / debe,
// breach, outcome, damages, indemnity, law or statute. Supplied headings such as "Liability categories (supplied)"
// are generic labels, not doctrine, and are allowed.
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
const BIG = ['default', 'baseline-illustrative', 'baseline-es'];

async function open(page) {
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
}

/** Visible text never under the floor (u step 0.01). */
export function textFloor(ID, o = {}) {
  test(`${ID}: every visible text stays at or above the text floor at every moment (u step 0.01, rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, big, tvs]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let checked = 0;
      for (const pr of presets) for (const tv of tvs) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const floor = big.includes(pr.name) ? 19.5 : 16;
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const rootM = svg.getScreenCTM().inverse();
          for (const t of texts) {
            let op = 1, hidden = false;
            for (let n = t; n && n !== svg; n = n.parentNode) {
              const a = n.getAttribute('opacity');
              if (a !== null) op *= parseFloat(a);
              if (n.getAttribute('display') === 'none' || n.getAttribute('visibility') === 'hidden') hidden = true;
            }
            if (hidden || op < 0.02) continue;
            const m = rootM.multiply(t.getScreenCTM());
            const px = parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k;
            checked++;
            if (px < floor - 0.05) fails.push(`${pr.name} ${tv} ${ratio} u${(s / 100).toFixed(2)} "${t.textContent.trim().slice(0, 24)}" ${px.toFixed(1)}px < ${floor}`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, checked};
    }, [ID, presets, RATIOS, BIG, o.tvs ?? ['all', 'key']]);
    expect(out.checked).toBeGreaterThan(1000);
    const seen = new Set();
    const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
    expect(uniq.slice(0, 20), `${out.fails.length} small-text samples`).toEqual([]);
  });
}

/** No visible text over another visible text (u step 0.01). */
export function noTextOverlap(ID) {
  test(`${ID}: no text is drawn over another text at any moment (u step 0.01, rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let checked = 0;
      for (const pr of presets) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        const occluders = [...svg.querySelectorAll('[data-occludes]')];
        const op = n0 => { let o = 1; for (let n = n0; n && n !== svg; n = n.parentNode) { const a = n.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (n.getAttribute('display') === 'none') return 0; } return o; };
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const occ = occluders.filter(q => op(q) > 0.5).map(q => ({q, b: q.getBoundingClientRect()}));
          const vis = [];
          for (const t of texts) {
            if (op(t) < 0.05) continue;
            let b = t.getBoundingClientRect();
            // a text inside a clipped copy (a lens) only shows inside its clip: measure the visible part
            const cpHost = t.closest('[clip-path]');
            if (cpHost) {
              const id = (cpHost.getAttribute('clip-path').match(/#([^)]+)\)/) || [])[1];
              const cp = id && svg.querySelector('#' + CSS.escape(id));
              const shape = cp && cp.firstElementChild;
              if (shape) {
                const c = shape.getBoundingClientRect();
                const l = Math.max(b.left, c.left), rr = Math.min(b.right, c.right), tp = Math.max(b.top, c.top), bt = Math.min(b.bottom, c.bottom);
                if (rr <= l || bt <= tp) continue;
                b = {left: l, right: rr, top: tp, bottom: bt, width: rr - l, height: bt - tp};
              }
            }
            if (!b.width || !b.height) continue;
            const covered = occ.some(({q, b: c}) => !q.contains(t) && (t.compareDocumentPosition(q) & Node.DOCUMENT_POSITION_FOLLOWING)
              && Math.max(0, Math.min(b.right, c.right) - Math.max(b.left, c.left)) * Math.max(0, Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top)) > 0.6 * b.width * b.height);
            if (!covered) vis.push({t, b});
          }
          for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) {
            const a = vis[i].b, c = vis[j].b;
            const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left), oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
            checked++;
            if (!(ox * k > 3 && oy > 0.25 * Math.min(a.height, c.height))) continue;
            fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} "${vis[i].t.textContent.trim().slice(0, 18)}" × "${vis[j].t.textContent.trim().slice(0, 18)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, checked};
    }, [ID, presets, RATIOS]);
    expect(out.checked).toBeGreaterThan(1000);
    const seen = new Set();
    const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
    expect(uniq.slice(0, 20), `${out.fails.length} overlapping text samples`).toEqual([]);
  });
}

/**
 * No visible free text (not printed on the prop itself) under/over a prop at any u step of 0.01. `props` = CSS
 * selectors of the props (moving cards, heads); a text inside the prop's own group is its own print.
 */
export function noTextOverProps(ID, props) {
  test(`${ID}: no text lies over a moving card or a head at any moment (u step 0.01, rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, props]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let checked = 0;
      for (const pr of presets) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h);
        const op = n0 => { let o = 1; for (let n = n0; n && n !== svg; n = n.parentNode) { const a = n.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (n.getAttribute('display') === 'none') return 0; } return o; };
        const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
        const propEls = props.flatMap(sel => [...svg.querySelectorAll(sel)]);
        for (let s = 0; s <= 100; s++) {
          x.seek((s / 100) * x.durationMs);
          const live = propEls.filter(q => op(q) > 0.3).map(q => ({q, b: q.getBoundingClientRect()}));
          for (const t of texts) {
            if (op(t) < 0.3) continue;
            const b = t.getBoundingClientRect();
            if (!b.width) continue;
            for (const {q, b: c} of live) {
              if (q.contains(t)) continue;
              const ox = Math.min(b.right, c.right) - Math.max(b.left, c.left), oy = Math.min(b.bottom, c.bottom) - Math.max(b.top, c.top);
              checked++;
              if (ox * k > 3 && oy > 0.25 * b.height) fails.push(`${pr.name} ${ratio} u${(s / 100).toFixed(2)} "${t.textContent.trim().slice(0, 18)}" × ${q.getAttribute('data-node')}`);
            }
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, checked};
    }, [ID, presets, RATIOS, props]);
    expect(out.checked).toBeGreaterThan(100);
    const seen = new Set();
    const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' '); if (seen.has(key)) return false; seen.add(key); return true; });
    expect(uniq.slice(0, 20), `${out.fails.length} text-over-prop samples`).toEqual([]);
  });
}

/** Seek history: 60 fps playback and backward seeks give the same SVG as a fresh seek. */
export function seekHistory(ID) {
  test(`${ID}: the render does not depend on seek history (60 fps playback and backward seeks vs fresh seek)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let compared = 0;
      const snap = svg => [...svg.querySelectorAll('*')].map(e => `${e.tagName}|${[...e.attributes].map(a => `${a.name}=${a.value}`).join(' ')}`.replace(/law-anim-[0-9]+-/g, 'law-anim-#-'));
      const make = async (w, h, params) => { const el = document.createElement('div'); document.getElementById('slots').appendChild(el); const x = def.create(el, {width: w, height: h, params}); await x.ready; return {x, el}; };
      for (const pr of presets) for (const [ratio, w, h] of ratios) {
        const played = await make(w, h, pr.params);
        const fresh = await make(w, h, pr.params);
        const D = played.x.durationMs;
        const cmp = (label, u) => {
          fresh.x.seek(u * D);
          const a = snap(played.x.element), b = snap(fresh.x.element);
          compared++;
          if (a.length !== b.length) { fails.push(`${pr.name} ${ratio} ${label} u${u}: node count ${a.length} vs ${b.length}`); return; }
          const diff = a.map((v, i) => (v === b[i] ? null : i)).filter(i => i !== null);
          if (diff.length) fails.push(`${pr.name} ${ratio} ${label} u${u}: ${diff.length} nodes differ, e.g. ${a[diff[0]].slice(0, 120)} ≠ ${b[diff[0]].slice(0, 120)}`);
        };
        const marks = [0.45, 0.6, 0.8, 1];
        let mi = 0;
        for (let t = 0; t <= D + 1e-6; t += 1000 / 60) {
          played.x.seek(t);
          while (mi < marks.length && t / D >= marks[mi] - 1e-9) { played.x.seek(marks[mi] * D); cmp('forward', marks[mi]); played.x.seek(t); mi++; }
        }
        played.x.seek(D);
        cmp('end', 1);
        for (const u of [0.8, 0.6, 0.45, 0.1, 0.6, 1, 0.45]) { played.x.seek(u * D); cmp('backward', u); }
        for (const q of [played, fresh]) { q.x.destroy(); q.el.remove(); }
      }
      return {fails, compared};
    }, [ID, presets, RATIOS]);
    expect(out.compared).toBeGreaterThan(100);
    expect(out.fails.slice(0, 20), `${out.fails.length} seek-history differences`).toEqual([]);
  });
}

/**
 * Fill: at the given u values, with labels all / key / none (o.tvs: a subset), the visible scene spans ≥ 90 % of the
 * caption-safe box on its long axis and ≥ 55 % on the other (rendered).
 */
export function fill(ID, at, o = {}) {
  const tvs = o.tvs ?? ['all', 'key', 'none'];
  test(`${ID}: the scene fills the caption-safe box at u ${at.join(', ')}, labels ${tvs.join(' / ')} (rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, at, short, tvs]) => {
      const def = await window.__lib.load(id);
      const fails = [], rows = [];
      for (const pr of presets) for (const tv of tvs) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const R = svg.getBoundingClientRect();
        const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
        const st = x.getState({bounds: false}).params.safeArea;
        const safe = {w: R.width * (1 - st.left - st.right), h: R.height * (1 - st.top - st.bottom) - Math.min(R.width, R.height) * 0.057};
        for (const u of at) {
          x.seek(u * x.durationMs);
          const bs = [...svg.querySelectorAll('[data-layer="scene"] path, [data-layer="scene"] rect, [data-layer="scene"] text, [data-layer="scene"] circle, [data-layer="scene"] line')]
            .filter(e => !e.closest('defs') && !e.closest('clipPath') && vis(e)).map(e => e.getBoundingClientRect()).filter(q => q.width > 0 || q.height > 0);
          const x0 = Math.min(...bs.map(q => q.left)), x1 = Math.max(...bs.map(q => q.right)), y0 = Math.min(...bs.map(q => q.top)), y1 = Math.max(...bs.map(q => q.bottom));
          const fw = (x1 - x0) / safe.w, fh = (y1 - y0) / safe.h;
          rows.push(`${pr.name} ${tv} ${ratio} u${u} fw ${fw.toFixed(2)} fh ${fh.toFixed(2)}`);
          if (!(Math.max(fw, fh) >= 0.9 && Math.min(fw, fh) >= short)) fails.push(`${pr.name} ${tv} ${ratio} u${u}: fw ${fw.toFixed(2)} fh ${fh.toFixed(2)}`);
        }
        x.destroy();
        el.remove();
      }
      return {fails, rows};
    }, [ID, presets, RATIOS, at, o.short ?? 0.55, tvs]);
    console.log(out.rows.slice(0, 200).join('\n'));
    expect(out.fails.slice(0, 20), `${out.fails.length} under-filled frames`).toEqual([]);
  });
}

/**
 * People floors (coordinator's standing floors, production/SESSION_HANDOFF.md): every person's head — measured on the
 * RENDERED head element's box height (the parties' portrait badges: the face, 0.3 of the ring's rendered height) at
 * 1080p — is ≥ 55 px in the baseline presets (default, baseline-illustrative, baseline-es, contrast-or-alternative)
 * and ≥ 45 px in long-labels-stress, at every u step of 0.05 (rest, build, hold), labels all / key / none; o.floor
 * may give an item-specific floor (LAW-0452 1:1: 50 px, the LAW-0448 decision). Every person stays visible (lens copies
 * are not counted).
 */
export function headFloor(ID, o = {}) {
  test(`${ID}: people stay at or above the head floors at rest, build and hold (rendered head box, u step 0.05)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, count, floors]) => {
      const def = await window.__lib.load(id);
      const fails = [], worst = {};
      for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of ratios) {
        const floor = floors[`${pr.name}|${ratio}`] ?? floors[pr.name] ?? floors[`*|${ratio}`] ?? (pr.name === 'long-labels-stress' ? 45 : 55);
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
        const vis = e => { let op = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) op *= parseFloat(a); if (q.getAttribute('display') === 'none') return false; } return op >= 0.5; };
        const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^((a|b|st)-)?[AB]-head$/.test(e.getAttribute('data-node')) || /^badge\d$/.test(e.getAttribute('data-node')));
        let mn = Infinity;
        for (let s = 0; s <= 20; s++) {
          x.seek((s / 20) * x.durationMs);
          const shown = heads.filter(vis);
          if (shown.length < count) fails.push(`${pr.name} ${tv} ${ratio} u${s / 20}: ${shown.length} of ${count} people visible`);
          for (const e of shown) {
            const badge = /^badge/.test(e.getAttribute('data-node'));
            const hh = badge ? Math.max(...[...e.querySelectorAll('circle')].map(c => c.getBoundingClientRect().height)) * 0.3 : e.getBoundingClientRect().height;
            const px = hh * k;
            mn = Math.min(mn, px);
            if (px < floor - 0.05) fails.push(`${pr.name} ${tv} ${ratio} u${s / 20} ${e.getAttribute('data-node')} ${px.toFixed(1)} px < ${floor}`);
          }
        }
        worst[`${pr.name} ${tv} ${ratio}`] = Math.round(mn * 10) / 10;
        x.destroy();
        el.remove();
      }
      return {fails, worst};
    }, [ID, presets, RATIOS, o.count ?? 2, o.floors ?? {}]);
    console.log(JSON.stringify(out.worst));
    const seen = new Set();
    const uniq = out.fails.filter(f => { const key = f.replace(/ u[0-9.]+ /, ' ').replace(/[0-9.]+ px/, ''); if (seen.has(key)) return false; seen.add(key); return true; });
    expect(uniq.slice(0, 25), `${out.fails.length} head-floor samples`).toEqual([]);
  });
}

/**
 * Spanish defaults: with only {locale: 'es'}, no English default text is drawn (every untouched default switches to
 * the Spanish default; the rendered text at several moments, labels shown, every ratio).
 */
export function esDefaults(ID) {
  test(`${ID}: locale es with default params renders no English default text (rendered)`, async ({page}) => {
    test.setTimeout(300000);
    await open(page);
    const out = await page.evaluate(async ([id, ratios]) => {
      const def = await window.__lib.load(id);
      const english = new RegExp('(?<![\\p{L}])(Circumstance|circumstance|Clause|clause|Contract|contract|Section|section|marked|supplied|text|fictional|Party [AB]|Tray|tray|Configured|link|Link|Changed|changed|was|Same|same|Only|differs|Left|right|provided|undescribed|Part|conclusion|drawn|the|and|of|by|with|as)(?![\\p{L}])', 'u');
      const bad = [];
      let n = 0;
      for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {locale: 'es'}});
        await x.ready;
        for (const u of [0.1, 0.5, 0.7, 1]) {
          x.seek(u * x.durationMs);
          for (const t of x.element.querySelectorAll('text')) {
            const s = t.textContent.trim();
            if (!s || t.closest('[data-layer="content-notice"]')) continue;
            n++;
            if (english.test(s)) bad.push(`${ratio} u${u} "${s.slice(0, 40)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {bad: [...new Set(bad)], n};
    }, [ID, RATIOS]);
    expect(out.n).toBeGreaterThan(20);
    expect(out.bad.slice(0, 20)).toEqual([]);
  });
}

/**
 * Cards never overlap one another (rendered, 60 fps, every preset × ratio × labels all / key / none): the bounding
 * boxes of each pair of visible message cards (shadow included) never intersect.
 */
export function cardsApart(ID, pairs) {
  test(`${ID}: message cards never overlap one another (60 fps, rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, pairs]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let frames = 0;
      for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const k = w / svg.getBoundingClientRect().width * 1080 / Math.min(w, h);
        const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
        for (let t = 0; t <= x.durationMs + 1e-6; t += 1000 / 60) {
          x.seek(t);
          frames++;
          for (const [na, nb] of pairs) {
            const a = svg.querySelector(`[data-node="${na}"]`), b = svg.querySelector(`[data-node="${nb}"]`);
            if (!a || !b || eff(a) < 0.05 || eff(b) < 0.05) continue;
            const p = a.getBoundingClientRect(), q = b.getBoundingClientRect();
            const ox = (Math.min(p.right, q.right) - Math.max(p.left, q.left)) * k, oy = (Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top)) * k;
            if (ox > 0 && oy > 0) fails.push(`${pr.name} ${tv} ${ratio} t${Math.round(t)}ms ${na}×${nb} ${ox.toFixed(1)}×${oy.toFixed(1)} px`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, frames};
    }, [ID, presets, RATIOS, pairs]);
    expect(out.frames).toBeGreaterThan(1000);
    const seen = new Set();
    const uniq = out.fails.filter(f => { const key = f.replace(/ t\d+ms /, ' ').replace(/[0-9.]+×[0-9.]+ px/, ''); if (seen.has(key)) return false; seen.add(key); return true; });
    expect(uniq.slice(0, 20), `${out.fails.length} overlapping frames`).toEqual([]);
  });
}

/**
 * No rule on conditions (contract-terms-05, very high legal risk): no rendered text, EN or ES, in any preset (and the
 * default en / es) at any of 21 times, names a condition doctrine or states a fulfilment, an automatic effect, an
 * clause that becomes due, binding or enforceable, a breach, a validity or an outcome. The configuration words
 * appear only in the exact supplied labels (see CONFIG_LABEL).
 */
export function noConditionRuleWords(ID) {
  test(`${ID}: no rendered text states a termination rule or a conclusion (right or ground to terminate, notice period, time limit, resolved, effect, valid, sufficient, breach, must, outcome), EN and ES (every preset, rendered)`, async ({page}) => {
    test.setTimeout(600000);
    await open(page);
    const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, src, labelSrc, okSrc]) => {
      const def = await window.__lib.load(id);
      const banned = new RegExp(src, 'i'), label = new RegExp(labelSrc, 'i'), ok = new RegExp(okSrc);
      const bad = [];
      let n = 0;
      for (const pr of presets) for (const [ratio, w, h] of ratios) for (const tv of ['all', 'key']) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        for (let s = 0; s <= 20; s++) {
          x.seek((s / 20) * x.durationMs);
          for (const t of x.element.querySelectorAll('text')) {
            // (the wrapped lines of one text joined with a space)
            const ts = [...t.querySelectorAll('tspan')];
            const q = (ts.length ? ts.map(z => z.textContent).join(' ') : t.textContent).replace(/\s+/g, ' ').trim();
            if (!q) continue;
            n++;
            if (banned.test(q)) bad.push(`${pr.name} ${ratio} "${q.slice(0, 50)}"`);
            if (label.test(q) && !ok.test(q)) bad.push(`${pr.name} ${ratio} configuration words outside the supplied label: "${q.slice(0, 50)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {bad: [...new Set(bad)], n};
    }, [ID, presets, RATIOS, TERM_BANNED.source, CONFIG_WORDS.source, CONFIG_LABEL.source]);
    expect(out.n).toBeGreaterThan(100);
    expect(out.bad.slice(0, 20)).toEqual([]);
  });
}

/** Banned wording, EN and ES (exported so that a test can check the regex itself). */
export const TERM_BANNED = /(enforce|ejecutab|exigib|\bvalid|\binvalid|v(á|a)lid[oa]s?\b|validez|\bvoid\b|\bnul[oa]s?\b|nulidad|\bcaps?\b|\btope|l(í|i)mite (de|máximo)|\blimit of\b|\bamounts?\b|importe|cuant(í|i)a|€|\$|%|\bEUR\b|\bUSD\b|\bmust\b|\bshall\b|\bdebe|\bdeber|\btiene que\b|breach|incumpl|\boutcome|resultado|\beffect|\befecto|binding|vinculante|\blaw\b|\bley\b|c(ó|o)digo|statut|damages|\bdaños|indemn|penalt|sanci(ó|o)n|exempt|\bexime|liable for|responsable de|\bwins?\b|\bgana)/i;
/** The configuration words (allowed only inside the exact supplied labels). */
export const CONFIG_WORDS = /(?!)/;
/** The exact supplied labels (optionally after a room badge, "A: …"). */
export const CONFIG_LABEL = /^(Section linked as supplied|No section linked · as supplied|Apartado vinculado según lo aportado|Ningún apartado vinculado · según lo aportado)$/;
export const CONFIG_LABELS = ['Section linked as supplied', 'No section linked · as supplied', 'Apartado vinculado según lo aportado', 'Ningún apartado vinculado · según lo aportado'];

/**
 * The supplied configuration says nothing about a person (contract-terms-03): for each pair of parameter sets that
 * differ only in the configuration (linked / listed), in every ratio × labels state at the hold, each figure
 * (`${prefix}A`, `${prefix}B`) has the same drawn parts with the same colours, widths and dashes in both.
 */
export function peopleNeutral(ID, pairs, prefixes, figNames = ['A', 'B']) {
  test(`${ID}: the supplied configuration changes nothing about either person (rendered)`, async ({page}) => {
    test.setTimeout(600000);
    await open(page);
    const out = await page.evaluate(async ([id, pairs, ratios, prefixes, figNames]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let figs = 0;
      const look = (svg, P) => figNames.map(f => {
        const g = svg.querySelector(`[data-node="${P}${f}"]`);
        if (!g) return null;
        return [...g.querySelectorAll('*')].map(e => [e.tagName, e.getAttribute('data-node') || '', e.getAttribute('fill') || '', e.getAttribute('stroke') || '', e.getAttribute('stroke-width') || '', e.getAttribute('stroke-dasharray') || '', e.getAttribute('opacity') || ''].join('|')).join(';');
      });
      for (const [pa, pb] of pairs) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of ratios) {
        const seen = [];
        for (const params of [pa, pb]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...params, textVisibility: tv}});
          await x.ready;
          x.seek(x.durationMs);
          seen.push(prefixes.map(P => look(x.element, P)));
          x.destroy();
          el.remove();
        }
        prefixes.forEach((P, i) => figNames.forEach((fn, f) => {
          const a = seen[0][i][f], b = seen[1][i][f];
          if (a === null && b === null) return;
          figs++;
          if (a !== b) fails.push(`${ratio} ${tv} ${P}${fn}: the figure is drawn differently with the other configuration`);
        }));
      }
      return {fails: [...new Set(fails)], figs};
    }, [ID, pairs, RATIOS, prefixes, figNames]);
    expect(out.figs).toBeGreaterThan(0);
    expect(out.fails.slice(0, 20)).toEqual([]);
  });
}

/**
 * Bordered panels (stage panels, the table's frame, the notes' tray, the inspect panel's tray): while a panel is
 * visible (opacity ≥ 0.05), visible content covers ≥ 15 % of its box (a 24 × 24 grid of cell centres under visible
 * text / shape boxes other than the panels themselves). Every preset × ratio × labels state, u step 0.02.
 */
export function noEmptyPanel(ID, panels = ['panel0', 'panel1', 'tray', 'tray0', 'tray2', 'ptray']) {
  test(`${ID}: no bordered panel is shown empty or nearly empty (rendered, content ≥ 15 % of the box)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, PANELS]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let seen = 0;
      for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const op = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return o; };
        const leaves = [...svg.querySelectorAll('[data-layer="scene"] text, [data-layer="scene"] path, [data-layer="scene"] circle, [data-layer="scene"] rect, [data-layer="scene"] line')]
          .filter(e => !e.closest('defs') && !e.closest('clipPath') && !PANELS.includes(e.getAttribute('data-node')));
        for (let s = 0; s <= 50; s++) {
          x.seek((s / 50) * x.durationMs);
          for (const n of PANELS) {
            const pn = svg.querySelector(`[data-node="${n}"]`);
            if (!pn || op(pn) < 0.05) continue;
            const B = pn.getBoundingClientRect();
            if (B.width < 4 || B.height < 4) continue;
            seen++;
            const bs = leaves.filter(e => op(e) >= 0.05).map(e => e.getBoundingClientRect())
              .filter(q => q.width * q.height > 0 && q.width * q.height < 0.9 * B.width * B.height && q.right > B.left && q.left < B.right && q.bottom > B.top && q.top < B.bottom);
            const N = 24;
            let cov = 0;
            for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
              const cx = B.left + (i + 0.5) * B.width / N, cy = B.top + (j + 0.5) * B.height / N;
              if (bs.some(q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) cov++;
            }
            const f = cov / (N * N);
            if (f < 0.15) fails.push(`${pr.name} ${tv} ${ratio} ${n} u${(s / 50).toFixed(2)}: content ${f.toFixed(2)} of the box`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, seen};
    }, [ID, presets, RATIOS, panels]);
    expect(out.seen).toBeGreaterThan(0);
    const seen = new Set();
    const uniq = out.fails.filter(f => { const k = f.replace(/ u[0-9.]+:.*/, ''); if (seen.has(k)) return false; seen.add(k); return true; });
    expect(uniq.slice(0, 25), `${out.fails.length} near-empty panel samples`).toEqual([]);
  });
}

/**
 * No jurisdiction or legal system is named (jurisdiction unspecified): neither the supplied context labels of any
 * preset nor any rendered text (every preset, en and es, at the hold; the content notice excepted).
 */
export function conceptNeutral(ID) {
  test(`${ID}: no jurisdiction or legal system is named (presets and rendered text)`, async ({page}) => {
    test.setTimeout(300000);
    const juris = /(english|england|anglo|common[- ]law|civil[- ]law|british|american|scots law|ingl[eé]s|inglaterra|anglosaj|derecho com[uú]n|derecho civil|brit[aá]nic|estadounidense|jurisdic)/i;
    const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
    const bad = presets.filter(pr => juris.test(JSON.stringify(pr.params))).map(pr => `${pr.name}: params name a jurisdiction`);
    await open(page);
    const out = await page.evaluate(async ([id, presets, src]) => {
      const juris = new RegExp(src, 'i');
      const def = await window.__lib.load(id);
      const found = [];
      for (const pr of presets) for (const [w, h] of [[1920, 1080], [1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        for (const u of [0.5, 1]) {
          x.seek(u * x.durationMs);
          for (const t of x.element.querySelectorAll('text')) {
            const q = t.textContent.trim();
            if (!q || t.closest('[data-layer="content-notice"]')) continue;
            if (juris.test(q)) found.push(`${pr.name} "${q.slice(0, 60)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return [...new Set(found)];
    }, [ID, presets, juris.source]);
    expect([...bad, ...out]).toEqual([]);
  });
}

/**
 * Every visible text's lines (one entry per <text>: its tspans), every preset plus es-only × ratio, u step 0.05.
 * Returns [{tag, lines}] with duplicates (same tag and lines) removed.
 */
async function wrappedTexts(page, ID) {
  await open(page);
  const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
  return page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const seen = new Set(), out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && !t.closest('[data-layer="content-notice"]'));
      for (let s = 0; s <= 20; s++) {
        x.seek((s / 20) * x.durationMs);
        for (const t of texts) {
          let op = 1, hidden = false;
          for (let n = t; n && n !== svg; n = n.parentNode) {
            const a = n.getAttribute('opacity');
            if (a !== null) op *= parseFloat(a);
            if (n.getAttribute('display') === 'none' || n.getAttribute('visibility') === 'hidden') hidden = true;
          }
          if (hidden || op < 0.02) continue;
          const ts = [...t.querySelectorAll('tspan')];
          const lines = (ts.length ? ts.map(q => q.textContent) : [t.textContent]).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
          const tag = `${pr.name} ${ratio}`;
          const key = `${tag}|${lines.join(' / ')}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({tag, lines});
        }
      }
      x.destroy();
      el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
}

const BARE_WORD = /^[\p{L}][\p{L}'’-]*[\p{L}][,;:.]?$/u;
/** Words of a block: letters only, two or more (single letters, numbers and IDs are not words); brackets stripped. */
const wordsOf = lines => lines.join(' ').split(/\s+/).map(w => w.replace(/^[(«"]+|[)»",;:.]+$/g, '')).filter(w => /^[\p{L}][\p{L}'’-]*[\p{L}]$/u.test(w));

/**
 * No one-word lines: in a wrapped block holding three words or more, the last line is never a single bare word (a widow:
 * "Order to be / examined"), and no two lines are single bare words ("Formalidad / no descrito / (aportado)"). A
 * parenthetical tag, a number or an ID alone on its line is not a bare word.
 */
export function noOneWordLines(ID) {
  test(`${ID}: no wrapped text leaves a one-word line (every preset + es-only × ratio, u step 0.05, rendered)`, async ({page}) => {
    test.setTimeout(300000);
    const all = await wrappedTexts(page, ID);
    const multi = all.filter(b => b.lines.length > 1);
    const bare = l => { const t = l.split(' '); return t.length === 1 && BARE_WORD.test(t[0]); };
    const bad = multi.filter(b => wordsOf(b.lines).length >= 3 && (bare(b.lines[b.lines.length - 1]) || b.lines.filter(bare).length >= 2));
    expect(multi.length).toBeGreaterThan(5);
    expect(bad.map(b => `${b.tag}: ${b.lines.join(' / ')}`).slice(0, 20)).toEqual([]);
  });
}

/**
 * No lone letter or ID parted from its word: no line starts with a lone capital letter ("A · DC-601", "A,", "(B)") —
 * unless it is the article of a lowercase phrase ("A cover page") — and no line ends with a word that names a letter or
 * an ID ("Document", "Party", "Step", "Day" …) while the next line goes on.
 */
export function noLoneLetterSplit(ID) {
  test(`${ID}: no lone letter or ID is split from its word (every preset + es-only × ratio, u step 0.05, rendered)`, async ({page}) => {
    test.setTimeout(300000);
    const all = await wrappedTexts(page, ID);
    const bad = [];
    for (const b of all) b.lines.forEach((l, i) => {
      if (i > 0 && /^\(?[A-Z]\)?(['’]s)?($|[\s,.;:)·])/.test(l) && !/^[A-Z] \p{Ll}/u.test(l)) bad.push(`${b.tag}: ${b.lines.join(' / ')}`);
      if (i < b.lines.length - 1 && /(^|\s)(Document|Documento|Party|Parte|Step|Paso|Day|Día|Clause|Cláusula|Section|Sección|Annex|Anexo)$/.test(l)) bad.push(`${b.tag}: ${b.lines.join(' / ')}`);
    });
    expect(all.length).toBeGreaterThan(20);
    expect([...new Set(bad)].slice(0, 20)).toEqual([]);
  });
}

/** No number torn from its unit: no line ends with a number while the next starts with its unit ("10:20 / h"). */
export function noTornNumberUnit(ID) {
  test(`${ID}: no number is torn from its unit (every preset + es-only × ratio, u step 0.05, rendered)`, async ({page}) => {
    test.setTimeout(300000);
    const all = await wrappedTexts(page, ID);
    const bad = [];
    for (const b of all) b.lines.forEach((l, i) => {
      if (i > 0 && /\d$/.test(b.lines[i - 1]) && /^(h|hrs?|min|s|am|pm|AM|PM|%)(\b|$)/.test(l)) bad.push(`${b.tag}: ${b.lines.join(' / ')}`);
    });
    expect(all.length).toBeGreaterThan(20);
    expect([...new Set(bad)].slice(0, 20)).toEqual([]);
  });
}

/** ES agreement: "(aportado)" never follows a feminine or plural noun phrase — no word ending in -a or -s right before it. */
export function esAportadoAgrees(ID) {
  test(`${ID}: Spanish "(aportado)" never follows a word ending in -a or -s (every preset + es-only × ratio, u step 0.05, rendered)`, async ({page}) => {
    test.setTimeout(300000);
    const all = await wrappedTexts(page, ID);
    const es = all.filter(b => /^(es-only|baseline-es) /.test(b.tag));
    const bad = all.filter(b => /[\p{L}]*[aAsS][\s\u00a0]*\(aportado\)/u.test(b.lines.join(' '))).map(b => `${b.tag}: ${b.lines.join(' / ')}`);
    expect(es.length).toBeGreaterThan(10);
    expect(bad.slice(0, 20)).toEqual([]);
  });
}

/**
 * Documents drawn as documents (review lesson: real objects, never tokens): at the given moments every visible document
 * of the stage — its sheet's rendered box (`${card}-sheet`) — is ≥ o.anyFloor (70) px in both dimensions at 1080p, and
 * ≥ o.floor (85) px at 1:1 outside long-labels-stress (≥ o.stressFloor, 70, in it), in every preset (+ es-only) × labels
 * × ratio. `o.cards`: a regex source for the card node names; `o.times`: the u values.
 */
export function docSize(ID, o) {
  test(`${ID}: the documents are drawn as documents (sheet ≥ ${o.anyFloor ?? 70} px; ≥ ${o.floor ?? 85} px at 1:1, ${o.stressFloor ?? 70} px in stress) (rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, {name: 'es-only', params: {locale: 'es'}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, o]) => {
      const def = await window.__lib.load(id);
      const fails = [], worst = {};
      const cardRe = new RegExp(o.cards);
      for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of ratios) {
        const floor = pr.name === 'long-labels-stress' ? (o.stressFloor ?? 70) : ratio === '1:1' ? (o.floor ?? 85) : (o.anyFloor ?? 70);
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
        const op = e => { let v = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return v; };
        const cards = [...svg.querySelectorAll('[data-node]')].filter(e => cardRe.test(e.getAttribute('data-node')));
        let mn = Infinity;
        for (const u of o.times) {
          x.seek(u * x.durationMs);
          for (const c of cards) {
            if (op(c) < 0.5) continue;
            const sh = c.querySelector(`[data-node="${c.getAttribute('data-node')}-sheet"]`);
            if (!sh) { fails.push(`${pr.name} ${tv} ${ratio} u${u}: ${c.getAttribute('data-node')} has no sheet`); continue; }
            if (op(sh) < 0.5) continue;
            const b = sh.getBoundingClientRect(), bw = b.width * k, bh = b.height * k;
            mn = Math.min(mn, bw, bh);
            if (Math.min(bw, bh) < floor - 0.05) fails.push(`${pr.name} ${tv} ${ratio} u${u}: ${c.getAttribute('data-node')} ${bw.toFixed(1)}×${bh.toFixed(1)} px < ${floor}`);
          }
        }
        worst[`${pr.name} ${tv} ${ratio}`] = Math.round(mn * 10) / 10;
        x.destroy();
        el.remove();
      }
      return {fails, worst};
    }, [ID, presets, RATIOS, o]);
    console.log(JSON.stringify(out.worst));
    expect(out.fails.slice(0, 25), `${out.fails.length} document samples`).toEqual([]);
  });
}

/**
 * Tall frames stack the two scenes (AUTHORING, contrast: "side-by-side on wide boxes, stacked on tall"): at 9:16, in
 * every preset and label mode, scenario B's panel lies wholly below scenario A's (rendered boxes, at the change, the
 * parallel action and the hold). (Added for LAW-0487 — review ct-01.)
 */
export function stagesStackedTall(ID, o = {}) {
  test(`${ID}: at 9:16 the A and B stages are stacked one above the other, every preset and label mode (rendered)`, async ({page}) => {
    test.setTimeout(300000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, panels]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      for (const pr of presets) for (const tv of ['all', 'key', 'none']) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: 1080, height: 1920, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        for (const u of [0.3, 0.6, 1]) {
          x.seek(u * x.durationMs);
          const [A, B] = panels.map(n => svg.querySelector(`[data-node="${n}"]`)).map(e => (e ? e.getBoundingClientRect() : null));
          if (!A || !B) { fails.push(`${pr.name} ${tv} u${u}: panel missing`); continue; }
          const xOverlap = Math.min(A.right, B.right) - Math.max(A.left, B.left);
          if (!(B.top >= A.bottom - 0.5) || xOverlap < 0.8 * Math.min(A.width, B.width)) fails.push(`${pr.name} ${tv} u${u}: A [${Math.round(A.left)},${Math.round(A.top)} ${Math.round(A.width)}×${Math.round(A.height)}] B [${Math.round(B.left)},${Math.round(B.top)} ${Math.round(B.width)}×${Math.round(B.height)}] not stacked`);
        }
        x.destroy();
        el.remove();
      }
      return fails;
    }, [ID, presets, o.panels ?? ['panel0', 'panel1']]);
    expect(out).toEqual([]);
  });
}

/**
 * Group boxes cross no text: no edge of a visible dashed bracket ("order to be examined") passes through a visible text
 * that is not its own station's, nor within `gap` px (1080p) of a heading (the table's row labels), (the bracket's cells and its legend, which sits on
 * the lower edge by design). Every preset × ratio × labels all / key, u step 0.05 from 0.3. (Added for LAW-0487 —
 * review ct-01: the bracket's top edge ran through the "Received by B" heading in long-labels-stress 1:1.)
 */
export function groupBoxesClearText(ID, o = {}) {
  test(`${ID}: the dashed group boxes cross no text and keep ≥ ${o.gap ?? 8} px from the headings (rendered)`, async ({page}) => {
    test.setTimeout(600000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, gap, headSel]) => {
      const def = await window.__lib.load(id);
      const fails = [];
      let seen = 0;
      for (const pr of presets) for (const tv of ['all', 'key']) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const k = 1080 / Math.min(w, h) * (w / svg.getBoundingClientRect().width);
        const op = e => { let v = 1; for (let q = e; q && q !== svg; q = q.parentElement) { const a = q.getAttribute('opacity'); if (a !== null) v *= parseFloat(a); if (q.getAttribute('display') === 'none') return 0; } return v; };
        for (let s = 6; s <= 20; s++) {
          x.seek((s / 20) * x.durationMs);
          const brs = [...svg.querySelectorAll('[data-node$="-br"]')].filter(e => e.getAttribute('stroke-dasharray') && op(e) >= 0.3);
          if (!brs.length) continue;
          const texts = [...svg.querySelectorAll('text')].filter(t => t.textContent.trim() && op(t) >= 0.3 && !t.closest('[data-layer="content-notice"]'));
          for (const br of brs) {
            seen++;
            const R = br.getBoundingClientRect();
            const own = br.parentElement;
            const g0h = gap / k, g0t = 1 / k;
            const edges = [[R.left, R.top, R.right, R.top], [R.left, R.bottom, R.right, R.bottom], [R.left, R.top, R.left, R.bottom], [R.right, R.top, R.right, R.bottom]];
            for (const t of texts) {
              if (own.contains(t)) continue;
              const T = t.getBoundingClientRect();
              // (a heading — the table's row labels — keeps ≥ gap px; any other text is only never crossed)
              const g0 = t.closest(headSel) ? g0h : g0t;
              const X = {l: T.left - g0, t: T.top - g0, r: T.right + g0, b: T.bottom + g0};
              for (const [x1, y1, x2, y2] of edges) {
                if (Math.max(x1, x2) >= X.l && Math.min(x1, x2) <= X.r && Math.max(y1, y2) >= X.t && Math.min(y1, y2) <= X.b) {
                  const d = Math.max(0, x1 === x2 ? Math.max(T.left - x1, x1 - T.right) : Math.max(T.top - y1, y1 - T.bottom)) * k;
                  fails.push(`${pr.name} ${tv} ${ratio} u${s / 20} ${br.getAttribute('data-node')} edge ${d.toFixed(1)} px from "${t.textContent.trim().slice(0, 24)}"`);
                }
              }
            }
          }
        }
        x.destroy();
        el.remove();
      }
      return {fails, seen};
    }, [ID, presets, RATIOS, o.gap ?? 8, o.headings ?? '[data-node="tbl-rows"]']);
    const uniq = [...new Set(out.fails.map(f => f.replace(/ u[0-9.]+ /, ' ')))];
    expect(out.seen, 'some bracket was checked').toBeGreaterThan(0);
    expect(uniq.slice(0, 25), `${out.fails.length} samples`).toEqual([]);
  });
}
