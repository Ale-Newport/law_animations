// Shared rendered checks for the "Causas concurrentes" motif (LAW-0689..0692).
// Only this motif's tests import this file.
import {test, expect} from '@playwright/test';
import {presetsFor} from '../harness/contract.js';

const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];

/**
 * Every visible text (effective opacity ≥ 0.05) is ≥ 16 px at 1080p at every sampled u, in every preset × ratio
 * (AUTHORING: text size applies at every moment, not only at the hold).
 */
export function textSizeOverTime(id, step = 0.02) {
  test.describe(`${id} text size over time`, () => {
    test(`${id}: every visible text ≥ 16 px at every sampled u`, async ({page}) => {
      test.setTimeout(300000);
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const presets = [{name: 'default', params: {}}, ...presetsFor(id)];
      const bad = await page.evaluate(async ([id, presets, ratios, step]) => {
        const def = await window.__lib.load(id);
        const out = [];
        for (const pr of presets) {
          for (const [ratio, w, h] of ratios) {
            const el = document.createElement('div');
            document.getElementById('slots').appendChild(el);
            const x = def.create(el, {width: w, height: h, params: pr.params});
            await x.ready;
            const svg = x.element;
            const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
            for (let u = 0; u <= 1.0001; u += step) {
              x.seek(Math.min(1, u) * x.durationMs);
              const s0 = svg.getScreenCTM().a;
              for (const t of svg.querySelectorAll('text')) {
                if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
                const b = t.getBoundingClientRect();
                if (b.width < 0.5) continue;
                const fs = parseFloat(getComputedStyle(t).fontSize);
                const m = t.getScreenCTM();
                const pxs = fs * (Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) / s0) * 1080 / Math.min(w, h);
                if (pxs < 16 - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px`);
              }
            }
            x.destroy();
            el.remove();
          }
        }
        return [...new Set(out)].slice(0, 40);
      }, [id, presets, RATIOS, step]);
      expect(bad, bad.join('\n')).toEqual([]);
    });
  });
}

/** DOM expression (for ratioChecks `dom`): no chip / card body covers a visible text it does not own. */
export const CARDS_CLEAR = `(() => {
  const vis = el => { for (let e = el; e && e !== svg; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.5) return false; } return true; };
  const texts = [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer="content-notice"]') && t.getBBox().width > 0);
  const order = new Map([...svg.querySelectorAll('*')].map((e, i) => [e, i]));
  const R = e => e.getBoundingClientRect();
  const inside = (a, b) => a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
  const meet = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1.5;
  const cards = [];
  for (const t of texts) {
    const tb = R(t);
    let g0 = t.parentElement;
    for (let up = 0; up < 3 && g0 && g0 !== svg; up++, g0 = g0.parentElement) {
      const shapes = [...g0.children].filter(c => (c.tagName === 'path' || c.tagName === 'rect') && vis(c) && c.getAttribute('fill') && c.getAttribute('fill') !== 'none' && order.get(c) < order.get(t));
      const card = shapes.find(c => { const b = R(c); return inside(tb, b) && b.width * b.height < tb.width * tb.height * 12; });
      if (card) { cards.push({card, owner: g0}); break; }
    }
  }
  for (const {card, owner} of cards) {
    const cb = R(card);
    for (const t of texts) {
      if (owner.contains(t) || order.get(t) > order.get(card)) continue;
      if (meet(cb, R(t))) return false;
    }
  }
  return true;
})()`;

/** DOM expression: every visible drawn leaf of the scene lies inside the frame. */
export const IN_FRAME = `(() => {
  const vis = el => { for (let e = el; e && e !== svg; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.02) return false; } return true; };
  const F = svg.getBoundingClientRect();
  const sc = svg.querySelector('[data-layer="scene"]');
  const leaves = [...sc.querySelectorAll('path, rect, circle, ellipse, text, line')].filter(e => !e.closest('defs') && !e.closest('clipPath') && !e.closest('[clip-path]') && vis(e));
  return leaves.every(e => { const b = e.getBoundingClientRect(); if (b.width === 0 && b.height === 0) return true; return b.left >= F.left - 0.5 && b.right <= F.right + 0.5 && b.top >= F.top - 0.5 && b.bottom <= F.bottom + 0.5; });
})()`;

/** DOM expression: no leader line (a <line> whose name ends in -lead) passes over a visible text it does not own. */
export const LEADS_CLEAR = `(() => {
  const vis = el => { for (let e = el; e && e !== svg; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.5) return false; } return true; };
  const texts = [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer="content-notice"]')).map(t => ({t, b: t.getBoundingClientRect()})).filter(q => q.b.width > 0);
  for (const ln of svg.querySelectorAll('line[data-node$="-lead"]')) {
    if (!vis(ln)) continue;
    const own = ln.parentElement;
    const M = ln.getScreenCTM();
    const A = new DOMPoint(+ln.getAttribute('x1'), +ln.getAttribute('y1')).matrixTransform(M), B = new DOMPoint(+ln.getAttribute('x2'), +ln.getAttribute('y2')).matrixTransform(M);
    for (let i = 2; i < 40; i++) {
      const x = A.x + (B.x - A.x) * i / 42, y = A.y + (B.y - A.y) * i / 42;
      for (const q of texts) { if (own.parentElement.contains(q.t)) continue; const b = q.b; if (x > b.left + 1 && x < b.right - 1 && y > b.top + 1 && y < b.bottom - 1) return false; }
    }
  }
  return true;
})()`;

/**
 * DOM expression factory: the scene (the named stage nodes) spans at least `fw` of the caption-safe width or `fh` of its
 * height (AUTHORING items 11 and 18: the action stays the subject). `names` = data-node names whose union is the stage.
 */
export const stageShare = (names, fw, fh) => `(() => {
  const vb = svg.viewBox.baseVal, R = svg.getBoundingClientRect(), k = vb.width / R.width;
  const bs = ${JSON.stringify(names)}.flatMap(n => [...svg.querySelectorAll('[data-node="' + n + '"]')]).map(e => e.getBoundingClientRect()).filter(b => b.width > 0);
  if (!bs.length) return false;
  const x0 = Math.min(...bs.map(b => b.left)), x1 = Math.max(...bs.map(b => b.right));
  const y0 = Math.min(...bs.map(b => b.top)), y1 = Math.max(...bs.map(b => b.bottom));
  const sw = vb.width * 0.88, sh = vb.height * 0.74;
  return (x1 - x0) * k >= ${fw} * sw || (y1 - y0) * k >= ${fh} * sh;
})()`;
