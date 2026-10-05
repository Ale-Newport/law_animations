// Rendered checks shared by the contract-formation-05 tests (LAW-0457..0460, "Intercambio de promesas").
// (Adapted from tests/animations/cf04-rendered.js — copied, not imported.)
// Every check measures the RENDERED DOM (getScreenCTM × computed font size at 1080p; getBoundingClientRect boxes) in
// every preset × 16:9 / 9:16 / 1:1, as the contract-formation-02 reviews required from the start:
//  - textFloor:    every visible text ≥ the floor at every u step of 0.01 (19.5 px in default, baseline-illustrative
//                  and baseline-es; 16 px otherwise), turning cards and lens copies included;
//  - noTextOverlap: no visible text over another visible text at any u step of 0.01 (a text wholly under a
//                  later-painted opaque [data-occludes] group counts as hidden);
//  - noTextOverProps: no visible free text over a moving card / a head at any u step of 0.01;
//  - seekHistory:  after 60 fps playback and after backward seeks the whole SVG equals a fresh seek (u 0.45, 0.6, 0.8, 1);
//  - fill:         at rest and at the hold, with labels all / key / none, the scene fills the caption-safe box (the
//                  thresholds — 0.9 on the long axis, 0.55 on the other — are this builder's own stricter check, not a
//                  coordinator rule; o.short lowers the second to the coordinator's proxy, > 0.5, where a ruling says so);
//  - headFloor:    the coordinator's standing people floors on the rendered head box.
// Not imported from any other motif's tests.
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
            const b = t.getBoundingClientRect();
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
 * Fill: at the given u values, with labels all / key / none, the visible scene spans ≥ 90 % of the caption-safe box
 * on its long axis and ≥ 55 % on the other (rendered).
 */
export function fill(ID, at, o = {}) {
  test(`${ID}: the scene fills the caption-safe box at rest and at the hold, labels all / key / none (rendered)`, async ({page}) => {
    test.setTimeout(900000);
    await open(page);
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios, at, short]) => {
      const def = await window.__lib.load(id);
      const fails = [], rows = [];
      for (const pr of presets) for (const tv of ['all', 'key', 'none']) for (const [ratio, w, h] of ratios) {
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
    }, [ID, presets, RATIOS, at, o.short ?? 0.55]);
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
      const english = /\b(Commitments?|Holder|Promise|Reciprocal|Unilateral|Supply|Pay|Day \d|fictional|Oak|chairs|Party [AB]|Rack|Same|supplied|Changed|Both|Item|Quantity|Sequence|Order|Left|right|sent|received)\b/;
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
            if (!s) continue;
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
 * Legal wording (coordinator's rules for cf-04 and this motif): no rendered text, in any preset × ratio × locale (en,
 * es) at any u step of 0.05, uses a deadline / expiry / validity word, nor a binding / enforceability / consideration /
 * agreement ("agreed", "acordado", "pactado") / contract-formation word, nor one that presents a configuration as lacking something ("missing", "lacks", "falta").
 */
export function noDeadlineWords(ID) {
  test(`${ID}: no rendered text uses a deadline, expiry, validity, binding, enforceability, consideration, agreement or formation word, or a "missing" word (every preset, en and es, rendered)`, async ({page}) => {
    test.setTimeout(600000);
    await open(page);
    const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets, ratios]) => {
      const def = await window.__lib.load(id);
      const banned = /(plazo|deadline|expir|lapse|caducad|vencid|vencimiento|too late|in time|a tiempo|\bvalid|v[aá]lid|effective|eficaz|no longer open|ya no|tarde|late\b|on time|binding|\bbinds?\b|vinculante|obliga|enforce|exigible|consideration|contraprestaci|causa onerosa|contract (is )?formed|contrato formado|perfeccion|\bagreed\b|agreement|acordad|pactad|missing|lacks?\b|falta|carece)/i;
      const bad = [];
      let n = 0;
      for (const pr of presets) for (const [ratio, w, h] of ratios) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        for (let s = 0; s <= 20; s++) {
          x.seek((s / 20) * x.durationMs);
          for (const t of x.element.querySelectorAll('text')) {
            const q = t.textContent.trim();
            if (!q) continue;
            n++;
            if (banned.test(q)) bad.push(`${pr.name} ${ratio} "${q.slice(0, 50)}"`);
          }
        }
        x.destroy();
        el.remove();
      }
      return {bad: [...new Set(bad)], n};
    }, [ID, presets, RATIOS]);
    expect(out.n).toBeGreaterThan(100);
    expect(out.bad.slice(0, 20)).toEqual([]);
  });
}

/**
 * Bordered panels (stage panels, the table's frame, the notes' tray, the inspect panel's tray): while a panel is
 * visible (opacity ≥ 0.05), visible content covers ≥ 15 % of its box (a 24 × 24 grid of cell centres under visible
 * text / shape boxes other than the panels themselves). Every preset × ratio × labels state, u step 0.02.
 */
export function noEmptyPanel(ID, panels = ['panel0', 'panel1', 'tray', 'tray2', 'ptray']) {
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
