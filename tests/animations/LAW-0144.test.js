// LAW-0144 — Ámbito territorial · inspect. Contract battery + ID-specific checks.
// acceptanceCheck: the detail keeps its source coordinates (the window is a real copy of the same
// region, drawn at the same coordinates, with real text), the change is localized (one fact's zone; only
// that pawn moves), the context returns to full size with all its text and a Δ, and seeking back to
// earlier times restores the previous datum exactly.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {minTextPx, neutralZonePatternTest} from './ambito-territorial-checks.js';

const SHAPES = {landscape: {}, square: {safeArea: {top: 0.06, right: 0.25, bottom: 0.2, left: 0.25}}, portrait: {safeArea: {top: 0.06, right: 0.366, bottom: 0.2, left: 0.366}}};
const variants = [['default', {}], ...presetsFor('LAW-0144').map(pr => [pr.name, pr.params]), ['labels-none', {textVisibility: 'none'}]];
const every = (fn, label, at = 1) => variants.flatMap(([name, params]) => Object.entries(SHAPES).map(([shape, sa]) => ({at, params: {...params, ...sa}, fn, label: `${label} (${name}, ${shape})`})));
const SAME = 'Math.hypot(s.winCentre.x - s.winRectCentre.x, s.winCentre.y - s.winRectCentre.y) < 1';

contractSuite('LAW-0144', {
  continuity: ['focus', 'winFocus'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.contextDatum === 'before' && s.lensDatum === 'before' && s.focusHolder === 'before' && s.markerShown === 0 && s.focusRel === s.beforeRel", label: 'build: the placed state with the supplied datum, full size'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.lensDatum === 'before' && s.windowPawn === 'before' && s.sightLines === 1 && s.srcHasPawn && " + SAME, label: 'isolate: a real copy of the region (pawn and the zone it may go to) at the same coordinates, tied by sight lines'},
    ...every('s.zoom >= 1.4 && s.contextScale <= 0.6 && s.srcHasPawn', 'the window enlarges the region round the pawn; the context is a miniature', 0.4),
    ...every('s.srcHasPawn', 'the moving pawn stays inside the source region (window follows it when its new place is far)', 0.6),
    {at: 0.5, fn: "s.lensDatum === 'changing' && s.contextDatum === 'before' && s.focusHolder === 'before'", label: 'the substitution happens inside the window only'},
    {at: 0.67, fn: "s.windowPawn === 'after' && s.lensDatum === 'after' && s.focusHolder === 'before'", label: 'in the window the pawn has crossed to its new zone; the context has not changed yet'},
    {at: 1, fn: "s.contextDatum === 'after' && s.focusHolder === 'after' && s.markerShown === 1 && s.stateShown === 1 && s.focusRel === s.afterRel && s.othersStill && s.afterSlotZone === s.afterZone", label: 'return: only that pawn moved to a tile of the new zone; its ring follows the supplied placement; marker kept'},
    {at: 1, fn: "s.beforeRel === 'different' && s.afterRel === 'shared'", label: 'baseline: from another zone into the text’s zone (as supplied)'},
    {at: 0.3, fn: "s.contextDatum === 'before' && s.focusHolder === 'before' && s.markerShown === 0 && s.lensDatum === 'before'", label: 'seeking back restores the previous datum and place exactly'},
    {at: 1, params: presetsFor('LAW-0144').find(q => q.name === 'contrast-or-alternative').params, fn: "s.beforeRel === 'shared' && s.afterRel === 'different' && s.focusRel === 'different' && s.focusHolder === 'after'", label: 'inverse substitution: the pawn leaves the text’s zone and its ring becomes dashed'},
    {at: 1, params: {textVisibility: 'none'}, fn: "s.focusHolder === 'after' && s.contextDatum === 'after' && s.markerShown === 1", label: 'labels hidden: the same localized change is visible'},
    ...every("s.contextScale === 1 && s.greeked === 0 && s.windowShown === 0 && s.returnCardClear && s.markerClearOfTag && s.afterSlotZone === s.afterZone && s.sightLines === 0", 'return: the context is back at full size with its real text, the window has closed into its source; card and marker clear'),
    ...every('s.windowClearOfContext && s.noteClear', 'inspecting: window, note and miniature do not overlap', 0.6),
  ],
});

// At the hold the context is full size again: every supplied field is readable there (standard floors).
suppliedTextSuite('LAW-0144', {
  fields: 'const f = p.facts[["fact-1","fact-2","fact-3"].indexOf(p.focusTarget)] || p.facts[p.facts.length - 1]; return [...p.sources.map(s => s.title), ...p.sources.map(s => s.note), ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, p.passages[0].zone, ...p.zones.map(z => z.name), ...p.facts.map(x => x.label), p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];',
  content: 'const f = p.facts[["fact-1","fact-2","fact-3"].indexOf(p.focusTarget)] || p.facts[p.facts.length - 1]; return [...p.sources.map(s => s.title), ...p.hierarchy.levels, p.passages[0].ref, p.passages[0].heading, ...p.zones.map(z => z.name), ...p.facts.map(x => x.label), p.beforeValue, p.afterValue];',
  captions: 'return [p.contextLabels.context, p.contextLabels.marker, p.locale === "es" ? "Según lo aportado · sin conclusión" : "As supplied · no conclusion drawn"];',
});

// Round-2: no double image. Rendered check (after tests/animations/LAW-0164.test.js): no two VISIBLE copies of the
// same text overlap on screen; effective opacity is the product up the tree (> 0.05 counts); boxes are cut to the
// clip of any clip-path ancestor (the window); text lying under the OPAQUE window card counts as hidden.
const NO_DOUBLE = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e !== svg.parentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return 0; o *= parseFloat(cs.opacity); } return o; };
  const clipOf = el => { let b = null; for (let e = el; e && e !== svg; e = e.parentElement) { const c = e.getAttribute && e.getAttribute('clip-path'); if (!c) continue; const m = c.match(/#([^)'"]+)/); const cp = m && svg.querySelector('#' + CSS.escape(m[1])); const sh = cp && cp.querySelector('rect'); if (!sh) continue; const r = clipRect(e, sh); b = b ? cut(b, r) : r; } return b; };
  const clipRect = (user, rc) => { const m = user.getScreenCTM(); const a = ['x', 'y', 'width', 'height'].map(k => parseFloat(rc.getAttribute(k)) || 0); const pts = [[a[0], a[1]], [a[0] + a[2], a[1] + a[3]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(m)); return {left: Math.min(pts[0].x, pts[1].x), top: Math.min(pts[0].y, pts[1].y), right: Math.max(pts[0].x, pts[1].x), bottom: Math.max(pts[0].y, pts[1].y)}; };
  const cut = (a, b) => ({left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom)});
  const items = [];
  for (const t of svg.querySelectorAll('text')) {
    const txt = (t.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!txt || eff(t) <= 0.05) continue;
    const r0 = t.getBoundingClientRect(); let r = {left: r0.left, top: r0.top, right: r0.right, bottom: r0.bottom};
    const c = clipOf(t); if (c) r = cut(r, c);
    if (r.right - r.left < 2 || r.bottom - r.top < 2) continue;
    items.push({txt, r, el: t});
  }
  const bg = svg.querySelector('[data-node="win-bg"]');
  const occ = bg && eff(bg) >= 0.99 ? bg.getBoundingClientRect() : null;
  const inWin = t => Boolean(t.closest('[data-node="win"]'));
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
// Round-2: no visible lens-copy text box crosses the window rim (a text the rim would cut is left out of the copy)
const NO_RIM_CUT = `(() => {
  const vis = el => { for (let e = el; e && e !== svg; e = e.parentElement) { const o = e.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; };
  const bg = svg.querySelector('[data-node="win-bg"]');
  if (!bg || !vis(bg)) return true;
  const W = bg.getBoundingClientRect();
  // a tag folding under its pawn is cut by its own clip (inside the copy): only its visible part counts
  const wc = svg.querySelector('[data-node="win-content"]');
  const cut = (a, c) => ({left: Math.max(a.left, c.left), top: Math.max(a.top, c.top), right: Math.min(a.right, c.right), bottom: Math.min(a.bottom, c.bottom)});
  const ownClip = el => { let r = null; for (let e = el; e && e !== wc; e = e.parentElement) { const c = e.getAttribute && e.getAttribute('clip-path'); if (!c) continue; const m = c.match(/#([^)'"]+)/); const cp = m && svg.querySelector('#' + CSS.escape(m[1])); const sh = cp && cp.querySelector('rect'); if (!sh) continue; const mm = e.getScreenCTM(); const a = ['x', 'y', 'width', 'height'].map(k => parseFloat(sh.getAttribute(k)) || 0); const p = [[a[0], a[1]], [a[0] + a[2], a[1] + a[3]]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(mm)); const q = {left: Math.min(p[0].x, p[1].x), top: Math.min(p[0].y, p[1].y), right: Math.max(p[0].x, p[1].x), bottom: Math.max(p[0].y, p[1].y)}; r = r ? cut(r, q) : q; } return r; };
  return [...svg.querySelectorAll('[data-node="win-content"] text')].filter(vis).every(t => {
    const r0 = t.getBoundingClientRect();
    const oc = ownClip(t);
    const c = oc ? cut(r0, oc) : r0;
    const b = {left: c.left, top: c.top, right: c.right, bottom: c.bottom, width: c.right - c.left};
    if (c.bottom - c.top < 1) return true;
    if (b.width < 1) return true;
    const out = b.right <= W.left + 1 || b.left >= W.right - 1 || b.bottom <= W.top + 1 || b.top >= W.bottom - 1;
    const inn = b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1;
    return out || inn;
  });
})()`;
const dense = (a, b, step) => Array.from({length: Math.round((b - a) / step) + 1}, (_, i) => Math.round((a + i * step) * 1000) / 1000);

ratioChecks('LAW-0144', 'round 2: no double image, no text cut by the rim, pawns inside their zone', [
  {at: dense(0.15, 0.85, 0.01), dom: NO_DOUBLE, tv: ['all'], label: 'no two visible copies of the same text overlap (window open / close)'},
  {at: dense(0.15, 0.85, 0.02), fn: 's.copyOnlyWhenOpaque && s.contextUpdatedBeforeCardFades', label: 'the window copy shows only while the card is fully open and opaque; the context is updated before it fades'},
  {at: [0.4, 0.5, 0.55, 0.6, 0.66], dom: NO_RIM_CUT, tv: ['all'], label: 'no lens-copy text box crosses the window rim'},
  {at: [1], fn: 's.pawnsInterior && s.returnCardClear && s.markerClearOfTag', label: 'every pawn (before and after) lies wholly inside its zone; the return card and its leader cross no text'},
]);

// review fixes: no small thumbnail on a blank frame, the window is a real copy with real text (it keeps the
// focus tag whole), the sight lines never cross the context caption, the context returns with its text
ratioChecks('LAW-0144', 'isolate, window and return', [
  {at: times(0, 1, 0.02), fn: 's.frameFill >= 0.3', label: 'the context and the window fill the frame at every moment (no empty transition)'},
  {at: times(0.36, 0.66, 0.02), fn: 's.focusTagInWindow', label: 'while its tag is open, the focus tag lies whole inside the window'},
  {at: [0.4, 0.5], fn: '!s.captionCrossed', tv: ['all'], label: 'the sight lines never cross the context caption'},
  {at: [0.4, 0.6], dom: "[...svg.querySelectorAll('[data-node=\"win-content\"] text')].length > 0", tv: ['all'], label: 'the window is a real copy: it carries real text'},
  {at: [1], fn: 's.contextScale === 1 && s.greeked === 0 && s.returnCardClear', label: 'return: the context is back at full size with all its text'},
  {at: [0.4, 1], dom: minTextPx(16), tv: ['all'], label: 'no visible text under 16 px'},
]);
neutralZonePatternTest('LAW-0144');

// Round 3: the window card is blank only while it is translucent over its source — at most ~200 ms in all (opening
// and closing measured separately) at the default duration, in every preset × ratio × labels shown / hidden. Measured
// on the rendered page: the card is visible (> 0.05) and its copy is not (< 0.05), sampled every 10 ms.
test('LAW-0144: the window is a bare blank card for at most 200 ms when it opens and when it closes', async ({page}) => {
  test.setTimeout(180000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor('LAW-0144')];
  const rows = await page.evaluate(async presets => {
    const def = await window.__lib.load('LAW-0144');
    const out = [];
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const v = e.getAttribute('opacity'); if (v !== null) o *= parseFloat(v); } return o; };
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['1:1', 1080, 1080], ['9:16', 1080, 1920]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const card = svg.querySelector('[data-node="win-bg"]'), copy = svg.querySelector('[data-node="win-content-op"]');
      let open = 0, close = 0;
      for (let ms = 0; ms <= x.durationMs; ms += 10) {
        x.seek(ms);
        const blank = eff(card) > 0.05 && eff(copy) < 0.05;
        if (blank) { if (ms < x.durationMs / 2) open += 10; else close += 10; }
      }
      out.push({preset: pr.name, tv, ratio, open, close});
      x.destroy();
      el.remove();
    }
    return out;
  }, presets);
  console.log(JSON.stringify(rows.map(r => [r.preset, r.ratio, r.tv, r.open, r.close])));
  for (const r of rows) {
    expect.soft(r.open, `${r.preset} ${r.ratio} labels:${r.tv}: blank card while opening (ms)`).toBeLessThanOrEqual(200);
    expect.soft(r.close, `${r.preset} ${r.ratio} labels:${r.tv}: blank card while closing (ms)`).toBeLessThanOrEqual(200);
  }
});
