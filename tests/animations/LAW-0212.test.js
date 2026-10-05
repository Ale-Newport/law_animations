// LAW-0212 — Asignación de órgano · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the plan drawn
// at the SAME coordinates, cropped to the sorting point, the clerk, the file and its datum stack), the change is
// localised (only the datum on the file tag changes, and with it only the route from the sorting point — to the
// venue whose supplied mapping tag equals the new value, or to the waiting slot), and seeking back restores
// exactly the previous datum.
// Windows (u): route 0.04–0.12 · frame 0.20–0.24 · the context steps back a little (0.21–0.27, >= 0.7 of its size,
// never a lone thumbnail) and dims while the lens opens 0.225–0.29 (overlapping; the lens is opaque within ~100 ms)
// beside its source · strike 0.46–0.50 · old value docks 0.51–0.55 · new value 0.555–0.585 (still until the close at
// 0.72) · old route fades 0.59–0.63 · new route 0.62–0.68 · lens closes 0.72–0.77 while the context returns
// 0.745–0.80 · Δ marker 0.855–0.89.
// Review 2026-09-26 (LAW-0688/LAW-0208 lens framing, round 2): the context (plan + its venue labels) keeps >= half the
// FRAME width at every u; while the lens is open context + lens span >= 80 % of the frame width; the lens opens over empty
// space, a corridor or the faded panel — never over a venue, its tags, the destination, the intake office or the clerk;
// the datum stack stays in the context beside its file (LAW-0688 pattern), readable throughout.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0212';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['clerk', 'file'],
  semantic: [
    {at: 0.15, fn: "s.lensOpen === 0 && s.datum === 'before' && s.routeTo === 'venue1' && s.oldRoute === 1 && s.markerShown === 0", label: 'context: the route the old datum gives (Venue East); no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.zoom >= 1.5 && s.datumInLens && s.lensClearOfPeople && s.lensClearOfSource && s.lensClearOfKey", label: 'isolate: a real enlargement (>= 1.5x) of the detail — the file, its datum stack and the fork — clear of the clerk, its source and every key piece of the context'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.newRoute === 0 && s.oldRoute === 1", label: 'substitute: the old value is struck through before anything else changes'},
    {at: 0.6, fn: "s.datum === 'after' && s.oldDocked === 1 && s.newRoute === 0", label: 'the new value comes first; the route has not changed yet'},
    {at: 0.7, fn: "s.routeTo === 'venue2' && s.newRoute === 1 && s.oldRoute < 0.3 && s.lensOpen === 1", label: 'then only the dependent route changes: to the venue whose tag equals the new value'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.routeTo === 'venue2' && s.oldDocked === 1 && s.allReached && s.problems.length === 0", label: 'hold: new route, struck old value docked, marker shown; composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.oldDocked === 0 && s.routeTo === 'venue1' && s.newRoute === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.selectedBefore === 0 && s.selectedAfter === -1 && s.routeTo === 'slot'", label: 'a new datum no row names: the route goes to the waiting slot (venue pending); nothing else is inferred'},
    {at: 1, params: {afterValue: 'district = East (fictional)'}, fn: "!s.changes && s.routeTo === 'venue1' && s.newRoute === 0", label: 'an equal datum changes nothing (nothing inferred)'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.routeTo === 'venue2' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.origin, ...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, p.afterValue, p.beforeValue, p.seats.arrival, p.seats.waiting, p.labels.junction, p.labels.key, p.contextLabels.context, p.contextLabels.marker];",
  content: "return [...p.courts.venues.map(v => v.name), ...p.routes.filter(r => r.venue < p.courts.venues.length).map(r => r.datum), p.file.label, p.afterValue];",
  captions: 'return [p.labels.junction, p.seats.arrival, p.seats.waiting, p.contextLabels.context];',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
// no chip, the lens window, the marker or the panel covers the clerk's head in the context
const NO_COVER = `(() => { ${K} ${BOX}
  const head = bx(svg.querySelector('[data-node="clerk-head"]'));
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(vb\\d+|cx-label-body|cx-old-body|cx-new-body|cx-marker|panel|lens-bg)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return cards.every(c => !hit(c, head, 1));
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const b = svg.querySelector('[data-node="clerk"]').getBoundingClientRect(); const hd = svg.querySelector('[data-node="clerk-head"]').getBoundingClientRect();
  return Math.min(b.width, b.height) / K >= 60 && hd.width / K >= 26;
})()`;
const PEOPLE_LENS = `(() => { ${K} const b = svg.querySelector('[data-node="clerk"]').getBoundingClientRect(); return Math.min(b.width, b.height) / K >= 45; })()`;
// the substituted datum stays traceable through the return and hold: the new value chip (and the struck "was" chip) >= 16 px
const VALUE_TRACE = `(() => { ${K}
  const px = t => parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a / svg.getScreenCTM().a * 1080 / Math.min(vb.width, vb.height);
  const wrap = svg.querySelector('[data-node="cx-wrap"]');
  if (!wrap || parseFloat(wrap.getAttribute('opacity') || 1) < 0.99) return false;
  const texts = [svg.querySelector('[data-node="cx-new"]'), svg.querySelector('[data-node="cx-dock"]')].filter(e => e && parseFloat(e.getAttribute('opacity') ?? 1) > 0.99).flatMap(e => [...e.querySelectorAll('text')]);
  return texts.length >= 2 && texts.every(t => px(t) >= 16);
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
// guides start on the source frame and end on the lens window, crossing no text and no head
const GUIDES = `(() => { ${K} ${BOX}
  const src = svg.querySelector('[data-node="src-frame"]');
  if (!src || parseFloat(src.getAttribute('opacity')) < 0.5) return true;
  const head = bx(svg.querySelector('[data-node="clerk-head"]'));
  const sb = bx(src), lb = bx(svg.querySelector('[data-node="lens-bg"]'));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-node="lens"]') && !t.closest('[data-layer="content-notice"]') && parseFloat(getComputedStyle(t).opacity) > 0).map(bx);
  const near = (q, b) => q.x >= b.l - 3 && q.x <= b.r + 3 && q.y >= b.t - 3 && q.y <= b.b + 3;
  const guides = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => visible(e) && parseFloat(e.getAttribute('opacity')) > 0);
  for (const gd of guides) {
    const m = gd.getScreenCTM();
    const A = new DOMPoint(+gd.getAttribute('x1'), +gd.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+gd.getAttribute('x2'), +gd.getAttribute('y2')).matrixTransform(m);
    if (!near(A, sb) || !near(B, lb)) return false;
    for (let j = 2; j < 28; j++) { const q = {x: A.x + (B.x - A.x) * j / 30, y: A.y + (B.y - A.y) * j / 30}; if ([...texts, head].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;
// the lens copy holds furniture whole or not at all
const LENS_WHOLE = `(() => { ${BOX}
  const lens = svg.querySelector('[data-node="lens-bg"]');
  if (!lens || !visible(lens)) return true;
  const lb = bx(lens);
  const pieces = [...svg.querySelectorAll('[data-node]')].filter(e => /^lz-(lectern|pplant\\d|intake-desk|intake-plant|tray\\d)$/.test(e.getAttribute('data-node'))).map(bx);
  return pieces.every(b => b.l >= lb.l - 2 && b.r <= lb.r + 2 && b.t >= lb.t - 2 && b.b <= lb.b + 2);
})()`;

// context = the plan and (while shown) its venue labels, measured against the caption-safe width
// measured against the whole frame width (the rendered page), as the review measures it
const SAFE_W = "const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const X = v => new DOMPoint(v, 0).matrixTransform(m).x; const sw = vb.width;";
const CTX_SPAN = "const ce = [svg.querySelector('[data-node=\"plan\"]')]; const wt = svg.querySelector('[data-node=\"world-text\"]'); if (wt && parseFloat(wt.getAttribute('opacity') ?? 1) > 0.05) ce.push(wt); const rs = ce.map(e => e.getBoundingClientRect()).filter(q => q.width > 0); const cl = X(Math.min(...rs.map(q => q.left))), cr = X(Math.max(...rs.map(q => q.right)));";
const KEY_SHOWN = `(() => { const k = svg.querySelector('[data-node="key"]'); if (!k) return false; let o = 1; for (let q = k; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } const F = svg.getBoundingClientRect(), b = k.getBoundingClientRect(); return o >= 0.99 && b.left >= F.left && b.right <= F.right && b.top >= F.top && b.bottom <= F.bottom; })()`;
// coordinator decision 2026-09-26, LAW-0212 round 5: stress datum fields capped so the 1:1 lens reaches >= 0.35 of the
// short side (standing rule, AUTHORING item 20; see the presets note). The lens-size check below has no exception.
// the changed datum field: every visible part of the lens copy of the stack lies wholly inside the lens window
const DATUM_IN_LENS = `(() => {
  const op = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
  const L = svg.querySelector('[data-node="lens"]'); if (op(L) < 0.99) return true;
  const W = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
  const parts = ['lz-label', 'lz-old', 'lz-dock', 'lz-new'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(e => e && op(e) > 0.05);
  if (!parts.length) return false;
  const inside = parts.every(e => { const b = e.getBoundingClientRect(); return b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1; });
  const cx = svg.querySelector('[data-node="cx-wrap"]');
  return inside && (!cx || op(cx) <= 0.01);
})()`;
// lens window width against the frame's short side, and its magnification against its source frame (rendered)
const LENS_SIZE = `(() => {
  // the lens's SMALLER rendered side against the frame's short side, and its magnification against its source frame
  const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse();
  const box = e => { const r0 = e.getBoundingClientRect(); const a = new DOMPoint(r0.left, r0.top).matrixTransform(m), b = new DOMPoint(r0.right, r0.bottom).matrixTransform(m); return {w: b.x - a.x, h: b.y - a.y}; };
  const L = box(svg.querySelector('[data-node="lens-bg"]')), S = box(svg.querySelector('[data-node="src-frame"]'));
  return Math.min(L.w, L.h) / Math.min(vb.width, vb.height) >= 0.35 && L.w / S.w >= 1.5;
})()`;
const CONTEXT_WIDE = `(() => { ${SAFE_W} ${CTX_SPAN} return (cr - cl) >= 0.45 * sw; })()`;
const CONTEXT_LENS_SPAN = `(() => { ${SAFE_W} ${CTX_SPAN} const L = svg.querySelector('[data-node="lens"]'); if (parseFloat(L.getAttribute('opacity') ?? 0) < 0.99) return true; const b = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect(); return (Math.max(cr, X(b.right)) - Math.min(cl, X(b.left))) >= 0.8 * sw; })()`;

ratioChecks(ID, 'lens: real zoom, clear of the clerk, guides anchored; value traceable; sizes', [
  {at: [0.1, 1], fn: 's.contextScale === 1 && s.textOnPlan === 1 && s.lensOpen === 0', label: 'build and hold: the plan at full size, every text on it shown, no lens'},
  {at: [0.4, 0.6], tv: ['all'], fn: 's.lensOpen === 1 && s.contextDim < 1', label: 'lens open: the context stays in view, dimmed (its texts shown only while >= their floor: rendered text checks below)'},
  {at: [0.4, 0.6], tv: ['none'], fn: 's.lensOpen === 1 && s.contextDim < 1', label: 'labels hidden, lens open: the context stays in view, dimmed (it may step back further: it carries no text)'},
  {at: times(0.2, 0.8, 0.02), fn: 's.lensClearOfKey && s.stackShown', label: 'the lens never covers a venue, its tags, the destination, the intake office or the clerk; the datum is always in view (in the lens while it is open, beside its file otherwise)'},
  {at: [...times(0, 0.19, 0.01), ...times(0.81, 1, 0.01)], tv: ['all'], dom: KEY_SHOWN, label: 'rendered: at build and hold the key "as supplied · no conclusion drawn" is fully visible (it may fade only while the lens covers the panel)'},
  {at: times(0, 1, 0.01), dom: CONTEXT_WIDE, label: 'rendered: the context (plan + its visible venue labels) keeps >= 45 % of the frame width at every u (lens checklist)'},
  {at: times(0.3, 0.72, 0.01), tv: ['all'], dom: DATUM_IN_LENS, label: 'rendered: while the lens is open the changed datum field (old value, "was" dock, new value) is wholly inside the lens, and the context stack is hidden'},
  {at: [0.35, 0.5, 0.65], dom: LENS_SIZE, label: 'rendered: the lens window\'s smaller side is >= 35 % of the frame\'s short side and the lens is >= 1.5x its source frame'},
  {at: times(0.26, 0.74, 0.02), dom: CONTEXT_LENS_SPAN, label: 'rendered: while the lens is open, context + lens span >= 80 % of the frame width'},
  {at: times(0.2, 0.9, 0.02), dom: PEOPLE_LENS, label: 'rendered: while the lens phase runs the clerk stays >= 45 px across (1080p)'},
  {at: [0, 0.1, 0.19, 0.9, 1], dom: PEOPLE_SIZE, label: 'rendered: at rest, build and hold the clerk >= 60 px across, head >= 26 px'},
  {at: times(0.77, 1, 0.01), tv: ['all'], dom: VALUE_TRACE, label: 'rendered: through the return and hold the new value and the struck old value stay visible at >= 16 px'},
  {at: times(0, 1, 0.03), dom: NO_COVER, label: 'rendered: no chip, marker, panel or lens window covers the clerk\'s head'},
  {at: [0.4, 0.6], dom: LENS_WHOLE, label: 'rendered: every piece of furniture in the lens is whole'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.datumInLens', label: 'the lens enlarges >= 1.5x and holds the whole datum stack (LAW-0204 pattern: the substitution plays in the lens)'},
  {at: times(0.2, 0.8, 0.02), fn: 's.lensClearOfPeople && s.lensClearOfSource', label: 'the lens window never covers the clerk, nor its own source'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides start on the source frame, end on the lens and cross no text or head'},
  {at: [0.62, 0.66, 0.7], tv: ['all'], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [1], fn: 's.markerShown === 1 && s.markerClearOfHeads', label: 'the Δ marker is clear of the head'},
  {at: [1], dom: FILL, label: 'rendered: plan, lens region and panel fill the caption-safe box'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Dense (every 20 ms over u 0.20–0.80) in every preset × ratio × labels shown/hidden: no text line is cut by the lens
// rim. Round 2 (LAW-0688 pattern): the datum stack is no longer copied into the lens (it stays in the context beside
// its file), so the lens holds no text at all — asserted below — and nothing can be cut.
test(`${ID}: lens rim — no copy line cut, fields wholly in or out (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      let texts = 0;
      for (let u = 0.2; u <= 0.8 + 1e-9; u += 20 / x.durationMs) {
        x.seek(u * x.durationMs);
        const lens = q('lens');
        if (parseFloat(lens.getAttribute('opacity') || 0) <= 0.02) continue;
        const win = q('lens-bg').getBoundingClientRect();
        for (const t of q('lens-content').querySelectorAll('text')) {
          let hidden = false;
          for (let e = t; e && e !== lens; e = e.parentElement) if (e.getAttribute && e.getAttribute('opacity') === '0') hidden = true;
          if (hidden || !(t.textContent || '').trim()) continue;
          const spans = [...t.querySelectorAll('tspan')].filter(s => (s.textContent || '').trim());
          const inside = spans.map(s => { const b = s.getBoundingClientRect(); return b.left >= win.left - 1 && b.right <= win.right + 1 && b.top >= win.top - 1 && b.bottom <= win.bottom + 1; });
          const touching = spans.map(s => { const b = s.getBoundingClientRect(); return b.left < win.right && b.right > win.left && b.top < win.bottom && b.bottom > win.top; });
          texts++;
          if (touching.some(Boolean) && !inside.every(Boolean)) out.push(`${pr.name} ${ratio} ${tv} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" cut by the rim`);
        }
      }
      if (tv === 'all' && !texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 30);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Rendered (pattern of LAW-0194/0196/0688): EVERY visible text is >= 16 px at 1080p at every sampled u in every
// preset × ratio, and >= 19.5 px in default, baseline-illustrative and baseline-es (the context never steps back so far).
test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u (all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) {
      for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: pr.params});
        await x.ready;
        const svg = x.element;
        const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
        for (let u = 0; u <= 1.0001; u += 0.01) {
          x.seek(u * x.durationMs);
          const s0 = svg.getScreenCTM().a;
          for (const t of svg.querySelectorAll('text')) {
            if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
            const b = t.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const fs = parseFloat(getComputedStyle(t).fontSize);
            const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
            const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
            if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 20)}" ${pxs.toFixed(1)} px < ${floor}`);
          }
        }
        x.destroy();
        el.remove();
      }
    }
    return [...new Set(out)].slice(0, 40);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The lens is never a faint, blank outline: every stretch where its window is partly transparent lasts < 150 ms, and
// whenever the window shows its copy (plan, clerk, stack) shows with it; the context never sits alone on a blank frame
// (it keeps >= half the width, checked above).
test(`${ID}: lens opacity — no faint phase >= 150 ms (every 10 ms, all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      let run = 0;
      for (let ms = 0.2 * x.durationMs; ms <= 0.8 * x.durationMs; ms += 10) {
        x.seek(ms);
        const o = parseFloat(svg.querySelector('[data-node="lens"]').getAttribute('opacity') ?? 0);
        run = o > 0.02 && o < 0.99 ? run + 10 : 0;
        if (run >= 150) { out.push(`${pr.name} ${ratio}: faint lens for ${run} ms at ${Math.round(ms)} ms`); break; }
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Item 4 (review round 4): the context copy of the datum and the lens copy never show at the same time — sequenced,
// never cross-faded. Sampled at 60 fps over the lens opening and closing, every preset × ratio.
test(`${ID}: the two copies of the datum are never both >= 0.15 opacity (60 fps over the lens open and close)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const textOp = sel => Math.max(0, ...[...svg.querySelectorAll(sel + ' text')].filter(t => (t.textContent || '').trim()).map(eff));
      let checked = 0;
      for (const [u0, u1] of [[0.2, 0.32], [0.7, 0.82]]) {
        for (let ms = u0 * x.durationMs; ms <= u1 * x.durationMs; ms += 1000 / 60) {
          x.seek(ms);
          const a = textOp('[data-node="cx-stack"]'), b = textOp('[data-node="lz-stack"]');
          checked++;
          if (a >= 0.15 && b >= 0.15) { out.push(`${pr.name} ${ratio} at ${Math.round(ms)} ms: context copy ${a.toFixed(2)}, lens copy ${b.toFixed(2)}`); break; }
        }
      }
      if (checked < 20) out.push(`${pr.name} ${ratio}: too few samples`);
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Review round 7 (AUTHORING line 109): the magnification is measured against the context AT REST (u = 0.1), not
// against the stepped-back source: the plan's scale in the lens (lz-clerk, or lz-file where the crop holds no clerk) at u = 0.5 ÷ its scale at u = 0.1,
// and the datum stack's text in the lens at u = 0.5 ÷ the same text in the context at u = 0.1, both >= 1.5 in every
// preset × ratio, labels shown and hidden. No per-case exception.
test(`${ID}: the lens magnifies >= 1.5x against the context at rest (rendered, u 0.5 vs u 0.1, all presets × ratios × labels)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: tv ? {...pr.params, textVisibility: tv} : pr.params});
      await x.ready;
      const svg = x.element;
      // (the plan may be drawn rotated: the scale is the length of the CTM's first column)
      const sc = e => { if (!e) return NaN; const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); };
      const fsz = e => (e ? parseFloat(getComputedStyle(e).fontSize) * sc(e) : NaN);
      const firstText = sel => [...svg.querySelectorAll(sel + ' text')].find(t => (t.textContent || '').trim());
      // the plan piece measured: the clerk when the crop holds it, else the file (both are drawn by the plan's transform)
      const piece = svg.querySelector('[data-node="lz-clerk"]') ? 'clerk' : 'file';
      x.seek(0.1 * x.durationMs);
      const c0 = sc(svg.querySelector(`[data-node="${piece}"]`));
      const t0 = fsz(firstText('[data-node="cx-stack"]'));
      x.seek(0.5 * x.durationMs);
      const c1 = sc(svg.querySelector(`[data-node="lz-${piece}"]`));
      const t1 = fsz(firstText('[data-node="lz-stack"]'));
      const zc = c1 / c0, zt = t1 / t0;
      const tag = `${pr.name}${tv ? ' (labels hidden)' : ''} ${ratio}`;
      if (!(zc >= 1.5)) out.push(`${tag}: ${piece} in the lens ÷ ${piece} at rest = ${zc.toFixed(2)}`);
      if (Number.isFinite(zt) && !(zt >= 1.5)) out.push(`${tag}: stack text in the lens ÷ at rest = ${zt.toFixed(2)}`);
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Review round 7: no visible text leaves the frame at any u (every preset × ratio, u every 0.005). Texts inside the
// lens are clipped to its window, which itself must lie in the frame.
test(`${ID}: no visible text (or the lens window) extends past the frame at any u (all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div');
      document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const F = svg.getBoundingClientRect();
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const outside = b => b.left < F.left - 0.5 || b.top < F.top - 0.5 || b.right > F.right + 0.5 || b.bottom > F.bottom + 0.5;
      for (let u = 0; u <= 1.0001; u += 0.005) {
        x.seek(u * x.durationMs);
        const lens = svg.querySelector('[data-node="lens"]');
        const lbg = svg.querySelector('[data-node="lens-bg"]');
        if (lbg && eff(lbg) >= 0.05 && outside(lbg.getBoundingClientRect())) out.push(`${pr.name} ${ratio} u=${u.toFixed(3)}: lens window outside the frame`);
        for (const t of svg.querySelectorAll('text')) {
          if ((lens && lens.contains(t)) || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
          const b = t.getBoundingClientRect();
          if (b.width < 0.5) continue;
          if (outside(b)) out.push(`${pr.name} ${ratio} u=${u.toFixed(3)}: "${t.textContent.slice(0, 28)}" outside the frame`);
        }
      }
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 40);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});
