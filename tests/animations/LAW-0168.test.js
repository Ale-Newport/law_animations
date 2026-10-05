// LAW-0168 — Consulta entre profesionales · inspect. Contract battery + ID-specific checks
// encoding the brief's acceptanceCheck: the detail keeps its source coordinates (the lens holds
// a second copy of the stage drawn at the SAME coordinates and opens from the flag's margin spot
// in the thumbnail), the change is localised (one flag moves; only its ring, the empty outline
// opposite and a ghost of the old spot follow; the shared-point flags never move), and seeking
// back restores exactly the previous datum.
// Timing (u): the context pulls back (u 0.13–0.21) while the lens opens in the free space beyond it
// (u 0.13–0.19) and grows back (u 0.66–0.75) while the lens closes ahead of it (u 0.665–0.72); the owner's hand holds the flag u 0.476–0.559 (move window 0.45–0.58); the new value
// is still in the card u 0.60–0.65; everything is settled by u 0.79.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks} from '../harness/ratio-checks.js';
import {test, expect} from '@playwright/test';


const dense = (a, b, step) => Array.from({length: Math.round((b - a) / step) + 1}, (_, i) => Math.round((a + i * step) * 1000) / 1000);
// Dense no-double-image check (idea from tests/animations/LAW-0164.test.js): no two visible copies of the
// same text overlap on screen, unless the overlap lies under the opaque lens card (the context text is
// hidden there).
const NO_DOUBLE = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const cut = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const clipRect = (user, rc) => { const m = user.getScreenCTM(); const a = ['x', 'y', 'width', 'height'].map(k => parseFloat(rc.getAttribute(k)) || 0); const pts = [[a[0], a[1]], [a[0] + a[2], a[1] + a[3]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m)); return {left: Math.min(pts[0].x, pts[1].x), top: Math.min(pts[0].y, pts[1].y), right: Math.max(pts[0].x, pts[1].x), bottom: Math.max(pts[0].y, pts[1].y)}; };
  const clipOf = el => { let b = null; for (let e = el; e && e !== svg; e = e.parentElement) { const c = e.getAttribute && e.getAttribute('clip-path'); if (!c) continue; const m = c.match(/#([^)'"]+)/); const cp = m && svg.querySelector('#' + CSS.escape(m[1])); const sh = cp && cp.querySelector('rect'); if (!sh) continue; const r = clipRect(e, sh); b = b ? cut(b, r) : r; } return b; };
  const items = [];
  for (const t of svg.querySelectorAll('text')) {
    const txt = (t.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!txt || eff(t) <= 0.05) continue;
    const r0 = t.getBoundingClientRect(); let r = {left: r0.left, top: r0.top, right: r0.right, bottom: r0.bottom};
    const c = clipOf(t); if (c) r = cut(r, c);
    if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
    items.push({txt, r, el: t});
  }
  const bg = svg.querySelector('[data-node="lens-bg"]');
  const occ = bg && eff(bg) >= 0.99 ? bg.getBoundingClientRect() : null;
  const inWin = t => Boolean(t.closest('[data-node="lens-win"]'));
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j];
    if (a.txt !== b.txt) continue;
    const x = cut(a.r, b.r);
    if (!(x.right - x.left > 2 && x.bottom - x.top > 2)) continue;
    const hidden = occ && inWin(a.el) !== inWin(b.el) && x.left >= occ.left && x.right <= occ.right && x.top >= occ.top && x.bottom <= occ.bottom;
    if (!hidden) return false;
  }
  return true;
})()`;

const ALT = presetsFor('LAW-0168').find(q => q.name === 'contrast-or-alternative').params;

contractSuite('LAW-0168', {
  continuity: ['hand', 'flag'],
  attach: [
    {from: 0.48, to: 0.557, a: 'hand', b: 'flag', tol: 0.5},
  ],
  semantic: [
    {at: 0.1, fn: "s.contextScale === 1 && s.lensOpen === 0 && s.datum === 'before' && s.flagAt === s.before && s.otherFlagsFixed && s.markerShown === 0 && s.cardShown === 0 && s.dockShown === 0 && s.slotOld === 1 && s.slotNew === 0", label: 'context: the state produced by the action, old datum in place, nothing marked'},
    {at: 0.16, fn: 's.contextScale < 1 && s.lensOpen > 0 && s.lensOpen < 1 && s.sourceKept && s.lensClearOfThumb && !s.lensCoversHead', label: 'isolate: the lens opens beside the shrinking context, tied to the flag’s margin spot (source coordinates kept)'},
    {at: 0.41, fn: "s.lensOpen === 1 && s.lensCopy === 1 && s.cardShown === 1 && s.datum === 'before' && s.struck === 0", label: 'the enlarged detail and the old value, nothing substituted yet'},
    {at: 0.47, fn: "s.struck === 1 && s.datum === 'before' && s.holder === null", label: 'substitute: the old value is struck before anything moves'},
    {at: 0.55, fn: "s.holder !== null && s.datum === 'moving' && s.otherFlagsFixed", label: 'the same hand carries the flag; the shared-point flags stay put'},
    {at: 0.72, fn: "s.datum === 'after' && s.flagAt === s.after && s.slotOld === 0 && s.slotNew === 1 && s.ghost === 1 && s.afterShown === 1 && s.otherFlagsFixed", label: 'only the dependent geometry updated (ring, empty outline); a ghost keeps the old spot traceable'},
    {at: 1, fn: "s.contextScale === 1 && s.lensOpen === 0 && s.markerShown === 1 && s.dockShown === 1 && s.datum === 'after' && s.allReached", label: 'return: full context, Δ marker, docked before → after'},
    {at: 0.45, fn: "s.datum === 'before' && s.flagAt === s.before && s.slotOld === 1 && s.slotNew === 0 && s.ghost === 0 && s.markerShown === 0", label: 'seeking back (after the end) restores the old datum and geometry exactly'},
    {at: 0.72, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.slotNew === 1 && s.ghost === 1", label: 'labels hidden: the same localised change is visible'},
    {at: 1, params: ALT, fn: "s.flagAt === 1 && s.before === 2 && s.datum === 'after'", label: 'alternative: professional A’s flag moves up to § 2 on the left margin'},
    {at: 1, params: {afterValue: 'Cl. 3'}, fn: "s.flagAt === s.before && s.datum === 'before' && s.slotNew === 0 && s.ghost === 0", label: 'an after value naming the same passage changes nothing (nothing inferred)'},
  ],
});

suppliedTextSuite('LAW-0168', {
  fields: "const d = p.props.document; return [...p.actors.map(a => a.name), p.roles.a, p.roles.b, d.reference, d.title, ...d.passages.map(x => x.ref), ...d.passages.map(x => x.text), p.props.same.noteA, p.props.same.noteB, p.props.open.note, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  content: "const d = p.props.document; return [...p.actors.map(a => a.name), ...d.passages.map(x => x.text), p.props.same.noteA, p.props.same.noteB, p.props.open.note, p.beforeValue, p.afterValue];",
  captions: 'return ["no conclusion drawn", "sin conclusión"];',
});

ratioChecks('LAW-0168', 'labels fit, lens clear of the thumbnail, hands reach', [
  {at: [1], fn: 's.labelsFit && s.allReached', label: 'hold: labels fit; all IK targets reached (every preset × ratio)'},
  {at: [0.4, 0.6], fn: 's.sourceKept && s.lensClearOfThumb && s.allReached', label: 'the lens keeps its source and never covers the thumbnail'},
  {at: [0.2, 0.3, 0.4, 0.55, 0.62], fn: 's.lensCutsNoText', label: 'the lens never cuts a line of text (window edges in the gaps between text blocks)'},
  {at: [0.4], fn: 's.lensZoom >= 1.5', label: 'a real zoom: the lens shows the detail at ≥ 1.5× its size in the hold scene'},
  {at: dense(0.1, 0.8, 0.01), fn: '!s.lensCoversHead', label: 'the lens window never covers a head'},
  {at: [0.605, 0.625, 0.645], tv: ['all'], fn: 's.afterShown === 1 && s.cardShown === 1', label: 'the new value is fully visible and still in the card for ≥ 400 ms before the card leaves'},
  {at: [1], fn: 's.markerClearOfHands', label: 'the Δ marker sits clear of every hand'},
  {at: dense(0.1, 0.8, 0.01), tv: ['all'], dom: NO_DOUBLE, label: 'no two visible copies of the same text overlap (lens open / close)'},
  // item 19: the frame is never a lone small thumbnail — while the context is small, the lens is large
  {at: [...dense(0.13, 0.27, 0.01), ...dense(0.65, 0.76, 0.01)], fn: 's.contextScale >= 0.75 || s.lensOpen >= 0.5', label: 'no near-empty transition: a large context or a large lens at every moment'},
  {at: [0.79, 0.9], fn: 's.contextScale === 1 && s.lensOpen === 0 && s.markerShown === 1', label: 'everything settled by u 0.79'},
  {at: [0.79, 0.9], tv: ['all'], fn: 's.dockShown === 1', label: 'the docked before → after is fully shown by u 0.80'},
]);

// Round-3 review: the lens card grows at its destination (never over its source), so its enlarged copy
// fades in as it grows. Rendered, every 20 ms over u 0.10–0.80 in every preset × ratio × labels shown/hidden:
// (1) a bare card (card on screen, copy under half opacity) never stays longer than 200 ms at a time;
// (2) the card never intersects any person's head, torso, arms or hands (it grows only in free space).
test('LAW-0168: lens card — bare card ≤ 200 ms and never over a head, torso, arm or hand (rendered, every 20 ms)', async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor('LAW-0168');
  const res = await page.evaluate(async ([ps]) => {
    const def = await window.__lib.load('LAW-0168');
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
    const out = [];
    for (const [w, hh] of [[1920, 1080], [1080, 1080], [1080, 1920]]) for (const pr of ps) for (const tv of ['all', 'none']) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: hh, instanceId: 'lc', params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = el.querySelector('svg');
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const people = ['A', 'B'].flatMap(k => ['head', 'upper', 'near', 'far'].map(p => q(`cx-${k}-${p}`))).filter(Boolean);
      const px = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      let run = 0, worst = 0; const hits = [];
      const stepU = 20 / x.durationMs;
      for (let u = 0.1; u <= 0.8 + 1e-9; u += stepU) {
        x.seek(u * x.durationMs);
        const bg = q('lens-bg'), b = bg.getBoundingClientRect();
        const card = eff(bg) > 0.05 && b.width > 2 * px && b.height > 2 * px;
        const copy = eff(q('lens-content'));
        if (card && copy < 0.5) { run += 20; worst = Math.max(worst, run); } else run = 0;
        if (card) for (const p of people) {
          const r = p.getBoundingClientRect();
          if (r.width && b.left < r.right - px && r.left < b.right - px && b.top < r.bottom - px && r.top < b.bottom - px) hits.push(`${Math.round(u * 1000) / 1000}:${p.getAttribute('data-node')}`);
        }
      }
      out.push({k: `${pr.name} ${w}x${hh} ${tv}`, worst, hits: hits.slice(0, 4)});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets]);
  for (const r of res) {
    expect.soft(r.worst, `bare lens card run (ms) [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.hits, `lens card over a person [${r.k}]`).toEqual([]);
  }
});
