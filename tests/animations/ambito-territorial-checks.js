// Shared checks of the "Ámbito territorial" motif (LAW-0141..0144), used with
// tests/harness/ratio-checks.js. DOM expressions see `svg` and `visible(el)`.
import {test, expect} from '@playwright/test';
import {tileMarks} from '../../src/animations/sources/kits/ambito-territorial.js';

/** Smallest visible text (px at 1080p) is at least `min` (content notice excluded). */
export const minTextPx = (min = 16) => `(() => {
  const vb = svg.viewBox.baseVal;
  const k = 1080 / Math.min(vb.width, vb.height);
  const R = svg.getScreenCTM().inverse();
  const vis = el => { for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.5) return false; if (e.getAttribute('display') === 'none') return false; } return true; };
  return [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer="content-notice"]') && t.getBBox().width > 0)
    .every(t => { const m = R.multiply(t.getScreenCTM()); return parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) * k >= ${min} - 0.05; });
})()`;

/** The rectangles of two node-name selectors never intersect (by more than `pad` px). */
export const noOverlap = (selA, selB, pad = 2) => `(() => {
  const vis = el => { for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.5) return false; if (e.getAttribute('display') === 'none') return false; } return true; };
  const A = [...svg.querySelectorAll(${JSON.stringify(selA)})].filter(vis).map(e => e.getBoundingClientRect());
  const B = [...svg.querySelectorAll(${JSON.stringify(selB)})].filter(vis).map(e => e.getBoundingClientRect());
  return A.every(a => B.every(b => a.right <= b.left + ${pad} || b.right <= a.left + ${pad} || a.bottom <= b.top + ${pad} || b.bottom <= a.top + ${pad}));
})()`;

/** The third zone's tile pattern is neutral: closed diamonds, no crossing strokes (no × hatch). */
export function neutralZonePatternTest(id) {
  test(`${id}: every zone pattern is neutral (no × / strike marks)`, () => {
    const B = {R: 40, tiles: [{z: 1, cx: 100, cy: 100}, {z: 2, cx: 200, cy: 100}]};
    for (const z of [1, 2]) {
      const d = tileMarks(B, z);
      // a × is two separate strokes: an "M…L…M…L…" pair; the neutral marks are single closed shapes
      const subpaths = d.split('M').filter(Boolean);
      for (const sp of subpaths) expect(/Z$|a/.test(sp.trim()), `zone ${z} mark "${sp}" must be a closed dot or diamond`).toBe(true);
    }
  });
}
