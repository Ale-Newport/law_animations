// LAW-0236 — Archivo judicial · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the same plan
// coordinates, cropped to the two trays, the file, the clerk and the tag), the change is localised (only the file's
// supplied state changes, and with it only the tray the file lies in), and seeking back restores exactly the previous
// datum.
// Lens rules (AUTHORING line 109): the lens's smaller side >= 0.35 of the frame's short side; magnification >= 1.5x
// against the context AT REST (u 0.1); the context keeps >= 45 % of the frame width and context + lens span >= 80 %;
// the datum is shown in one place at a time (sequenced hand-over, never both >= 0.15, and never both illegible for
// more than 200 ms); fields wholly in or out of the lens; the new value still >= 400 ms; the lens never covers the
// context or a head; sequenced return (lens, then panel, then the Δ marker).
// Labels hidden (review round 2): the plan alone fills the safe box, centred (a wide room with a deeper front zone in
// 16:9, a very deep room in 9:16, a medium-deep room in 1:1); the stepped-back context moves to the edge away from the
// lens. The lens copy of the clerk shows only while its head is wholly inside the unrolling window.
// Legal content: "archived" is only another tray and shelf block; the old value is kept as "was" (never struck,
// crossed or dimmed to a verdict); no rule, time span or outcome.
// Windows (u): ring 0.04–0.12 · frame 0.20–0.24 · panel out 0.20–0.235 · context steps back 0.21–0.265 · lens opens
// 0.24–0.30 · old value docks 0.46–0.50 · new value 0.505–0.535 · the clerk reaches 0.55–0.57, lifts 0.57–0.59, moves
// 0.59–0.65, lets go 0.655–0.68 · lens closes 0.72–0.77 while the context returns 0.72–0.765 · panel back 0.765–0.795 ·
// Δ 0.80–0.84.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {
  textFloorTest, inFrameTest, noOverlapTest, coldCreateTest, peopleSizeTest, equalWeightTest, neutralityTest,
  noArrowsTest, seekHistoryTest, blankWindowTest, RATIOS,
} from './archivo-judicial-checks.js';

const ID = 'LAW-0236';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['file', 'clerk'],
  attach: [{from: 0.59, to: 0.65, a: 'file', b: 'hands', tol: 0.5}],
  semantic: [
    {at: 0.1, fn: "s.datum === 'before' && s.lensOpen === 0 && s.contextScale === 1 && s.fileTray === 'active'", label: 'build: the context in full, the supplied datum, the file in the ● tray; no lens'},
    {at: 0.4, fn: 's.lensOpen === 1 && s.zoomVsRest >= 1.5 && s.datumInLens && s.lensClearOfContext && s.lensClearOfPeople', label: 'isolate: a real enlargement (>= 1.5x the context at rest) holding the whole datum, clear of the context and of the head'},
    {at: 0.49, fn: "s.datum === 'changing' && s.oldDocked > 0 && s.fileTray === 'active'", label: 'substitute: the old value moves to the "was" slot before anything else changes'},
    {at: 0.545, fn: "s.datum === 'after' && s.oldDocked === 1 && s.holder === 'tray' && s.fileTray === 'active'", label: 'the new value comes first; the file has not moved yet'},
    {at: 0.7, fn: "s.fileTray === 'archived' && s.holder === 'tray' && s.lensOpen === 1", label: 'then only the dependent geometry changes: the file lies in the tray the new value names'},
    {at: 0.82, fn: "s.lensOpen === 0 && s.contextScale === 1 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context at full size'},
    {at: 1, fn: "s.markerShown === 1 && s.markerClear && s.datum === 'after' && s.fileTray === 'archived' && s.problems.length === 0", label: 'hold: the file in its new tray, the old value kept as "was", the marker shown; composition fits'},
    {at: 0.3, fn: "s.datum === 'before' && s.oldDocked === 0 && s.fileTray === 'active'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.trayBefore === 'archived' && s.trayAfter === 'active' && s.fileTray === 'active'", label: 'another supplied pair: from archived (◆) to active (●); nothing else is inferred'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.fileTray === 'archived' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
  ],
});

suppliedTextSuite(ID, {
  fields: 'return [p.courts.building, p.courts.archive, p.courts.active, p.courts.archived, p.routes.rails, p.routes.locator, p.seats.counter, p.seats.clerk.name, p.labels.sequence, p.labels.key, p.file.identifier, p.afterValue, p.beforeValue, p.contextLabels.context, p.contextLabels.marker];',
  content: 'return [p.courts.active, p.courts.archived, p.file.identifier, p.afterValue, p.beforeValue];',
  captions: 'return [p.routes.rails, p.routes.locator, p.seats.counter, p.labels.sequence];',
});

// ---------------------------------------------------------------------------------------------
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; };";
const OP = "const op = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
const VB = "const vb = svg.viewBox.baseVal; const m = svg.getScreenCTM().inverse(); const X = v => new DOMPoint(v, 0).matrixTransform(m).x; const vbox = e => { const r0 = e.getBoundingClientRect(); const a = new DOMPoint(r0.left, r0.top).matrixTransform(m), b = new DOMPoint(r0.right, r0.bottom).matrixTransform(m); return {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y}; };";
// the lens's SMALLER rendered side >= 0.35 of the frame's short side, and >= 1.5x its (stepped-back) source frame
const LENS_SIZE = `(() => { ${VB}
  const L = vbox(svg.querySelector('[data-node="lens-bg"]')), S = vbox(svg.querySelector('[data-node="src-frame"]'));
  return Math.min(L.w, L.h) / Math.min(vb.width, vb.height) >= 0.35 && L.w / S.w >= 1.5;
})()`;
// the changed datum field (old, was, new): every visible part lies wholly inside the lens window, the context copy hidden
const DATUM_IN_LENS = `(() => { ${OP}
  const L = svg.querySelector('[data-node="lens"]'); if (op(L) < 0.99) return true;
  const W = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
  const parts = ['lz-old', 'lz-was', 'lz-new'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(e => e && op(e) > 0.05);
  if (!parts.length) return false;
  const inside = parts.every(e => { const b = e.getBoundingClientRect(); return b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1; });
  return inside && op(svg.querySelector('[data-node="cx-wrap"]')) <= 0.01;
})()`;
// the context (the plan and, while shown, its texts) keeps >= 45 % of the frame width at every u
const CTX = `${OP} const ce = [svg.querySelector('[data-node="plan"]')]; const wt = svg.querySelector('[data-node="cx-wrap"]'); if (wt && op(wt) > 0.05) ce.push(wt); const rs = ce.map(e => e.getBoundingClientRect()).filter(q => q.width > 0); const cl = X(Math.min(...rs.map(q => q.left))), cr = X(Math.max(...rs.map(q => q.right)));`;
const CONTEXT_WIDE = `(() => { ${VB} ${CTX} return (cr - cl) >= 0.45 * vb.width; })()`;
const CONTEXT_LENS_SPAN = `(() => { ${VB} ${CTX} const L = svg.querySelector('[data-node="lens"]'); if (op(L) < 0.99) return true; const b = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect(); return (Math.max(cr, X(b.right)) - Math.min(cl, X(b.left))) >= 0.8 * vb.width; })()`;
// the lens window never lies over the context plan nor over a head
const LENS_CLEAR = `(() => { ${OP} ${BOX}
  const L = svg.querySelector('[data-node="lens"]'); if (op(L) < 0.02) return true;
  const lb = bx(svg.querySelector('[data-node="lens-bg"]')); const pl = bx(svg.querySelector('[data-node="s-room"]'));
  const hit = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
  const heads = [svg.querySelector('[data-node="clerk-head"]')].map(bx);
  return !hit(lb, pl) && heads.every(hd => !hit(lb, hd));
})()`;
// guides start on the source frame and end on the lens window, crossing no text
const GUIDES = `(() => { ${BOX} ${OP}
  const src = svg.querySelector('[data-node="src-frame"]');
  if (!src || op(src) < 0.5) return true;
  const sb = bx(src), lb = bx(svg.querySelector('[data-node="lens-bg"]'));
  const texts = [...svg.querySelectorAll('text')].filter(t => op(t) > 0.05 && (t.textContent || '').trim() && !t.closest('[data-node="lens"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  const near = (q, b) => q.x >= b.l - 3 && q.x <= b.r + 3 && q.y >= b.t - 3 && q.y <= b.b + 3;
  const guides = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => op(e) > 0.05);
  for (const gd of guides) {
    const mm = gd.getScreenCTM();
    const A = new DOMPoint(+gd.getAttribute('x1'), +gd.getAttribute('y1')).matrixTransform(mm), B = new DOMPoint(+gd.getAttribute('x2'), +gd.getAttribute('y2')).matrixTransform(mm);
    if (!near(A, sb) || !near(B, lb)) return false;
    for (let j = 2; j < 28; j++) { const q = {x: A.x + (B.x - A.x) * j / 30, y: A.y + (B.y - A.y) * j / 30}; if (texts.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;
// through the return and hold the new value and the struck old value stay visible at >= 16 px
const VALUE_TRACE = `(() => { ${OP}
  const s0 = svg.getScreenCTM().a; const vb = svg.viewBox.baseVal;
  const px = t => parseFloat(getComputedStyle(t).fontSize) * t.getScreenCTM().a / s0 * 1080 / Math.min(vb.width, vb.height);
  const parts = ['cx-new', 'cx-old'].map(n => svg.querySelector('[data-node="' + n + '"]'));
  return parts.every(e => e && op(e) > 0.6) && parts.flatMap(e => [...e.querySelectorAll('text')]).every(t => px(t) >= 16);
})()`;
const FILL = "(() => { const m = svg.getScreenCTM().inverse(); const b = svg.querySelector('[data-layer=\"scene\"]').getBoundingClientRect(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); const labels = !!svg.querySelector('[data-node=\"panel\"]'); return Math.max(fh, fw) >= 0.9 && (!labels || Math.min(fh, fw) >= 0.72); })()";
const KEY_SHOWN = `(() => { ${OP} const k = svg.querySelector('[data-node="key"]'); if (!k) return false; const F = svg.getBoundingClientRect(), b = k.getBoundingClientRect(); return op(k) >= 0.99 && b.left >= F.left && b.right <= F.right && b.top >= F.top && b.bottom <= F.bottom; })()`;

ratioChecks(ID, 'lens: real zoom vs rest, size, context kept, datum in one place, guides anchored; value traceable', [
  {at: [0.1, 1], fn: 's.contextScale === 1 && s.textOnPlan === 1 && s.lensOpen === 0', label: 'build and hold: the context at full size, its texts shown, no lens'},
  {at: [0.4, 0.6], fn: 's.lensOpen === 1 && s.contextDim < 1', label: 'lens open: the context stays in view, dimmed in place'},
  {at: times(0.2, 0.8, 0.01), fn: 's.lensClearOfContext && s.lensClearOfPeople', label: 'the lens never covers the context or a head'},
  {at: times(0.2, 0.8, 0.01), dom: LENS_CLEAR, label: 'rendered: the lens window never lies over the room or the head'},
  {at: [...times(0, 0.19, 0.01), ...times(0.81, 1, 0.01)], tv: ['all'], dom: KEY_SHOWN, label: 'rendered: at build and hold the key "as supplied · no conclusion drawn" is fully visible'},
  {at: times(0, 1, 0.01), dom: CONTEXT_WIDE, label: 'rendered: the context keeps >= 45 % of the frame width at every u'},
  {at: times(0.3, 0.72, 0.01), tv: ['all'], dom: DATUM_IN_LENS, label: 'rendered: while the lens is open the datum field (old, "was", new) is wholly inside it and the context copy is hidden'},
  {at: [0.35, 0.5, 0.65], dom: LENS_SIZE, label: 'rendered: the lens window\'s smaller side >= 35 % of the frame\'s short side and >= 1.5x its source frame'},
  {at: times(0.26, 0.74, 0.02), dom: CONTEXT_LENS_SPAN, label: 'rendered: while the lens is open, context + lens span >= 80 % of the frame width'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides start on the source frame, end on the lens and cross no text'},
  {at: times(0.81, 1, 0.01), tv: ['all'], dom: VALUE_TRACE, label: 'rendered: through the return and hold the new value and the kept old value stay visible at >= 16 px'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoomVsRest >= 1.5 && s.lensOpen === 1 && s.datumInLens', label: 'the lens enlarges >= 1.5x against the context at rest and holds the whole datum'},
  {at: [0.54, 0.6, 0.66, 0.7], tv: ['all'], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms (u 0.535–0.72)'},
  {at: [1], tv: ['all'], fn: 's.markerShown === 1 && s.markerClear', label: 'the Δ marker is shown clear of texts and ◆ (with the datum; not drawn with the labels hidden)'},
  {at: [1], dom: FILL, label: 'rendered: plan and panel fill the caption-safe box at the hold'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Magnification against the context AT REST (AUTHORING line 109): the clerk's scale in the lens (lz-clerk) at u 0.5 ÷
// its scale at u 0.1 (clerk), and the datum's text in the lens at u 0.5 ÷ the same text in the context at u 0.1, both
// >= 1.5.
test(`${ID}: the lens magnifies >= 1.5x against the context at rest (rendered, u 0.5 vs u 0.1, all presets × ratios × labels)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const tv of [null, 'none']) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: tv ? {...pr.params, textVisibility: tv} : pr.params});
      await x.ready;
      const svg = x.element;
      const sc = e => { if (!e) return NaN; const m = e.getScreenCTM(); return Math.hypot(m.a, m.b); };
      const fsz = e => (e ? parseFloat(getComputedStyle(e).fontSize) * sc(e) : NaN);
      x.seek(0.1 * x.durationMs);
      const c0 = sc(svg.querySelector('[data-node="clerk"]')), t0 = fsz(svg.querySelector('[data-node="cx-old-text"]'));
      x.seek(0.5 * x.durationMs);
      const c1 = sc(svg.querySelector('[data-node="lz-clerk"]')), t1 = fsz(svg.querySelector('[data-node="lz-old-text"]'));
      const tag = `${pr.name}${tv ? ' (labels hidden)' : ''} ${ratio}`;
      if (!(c1 / c0 >= 1.5)) out.push(`${tag}: plan in the lens ÷ at rest = ${(c1 / c0).toFixed(2)}`);
      if (!tv && !(t1 / t0 >= 1.5)) out.push(`${tag}: datum text in the lens ÷ at rest = ${(t1 / t0).toFixed(2)}`);
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// One copy of the datum at a time: the context copy and the lens copy are never both >= 0.15 (60 fps over the open
// and the close), every preset × ratio.
test(`${ID}: the two copies of the datum are never both >= 0.15 opacity (60 fps over the lens open and close)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const textOp = sel => Math.max(0, ...[...svg.querySelectorAll(sel + ' text')].filter(t => (t.textContent || '').trim()).map(eff));
      let checked = 0;
      for (const [u0, u1] of [[0.2, 0.32], [0.7, 0.84]]) {
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
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// Hand-over in step with the lens (AUTHORING line 109, civil-claim-01 LAW-0244): around the open and the close, the
// stretch where NEITHER copy of the datum is legible (both < 0.15) lasts <= 200 ms (every 10 ms, all presets × ratios).
test(`${ID}: the datum hand-over leaves no stretch > 200 ms with neither copy legible (open and close, every 10 ms)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const textOp = sel => Math.max(0, ...[...svg.querySelectorAll(sel + ' text')].filter(t => (t.textContent || '').trim()).map(eff));
      for (const [u0, u1] of [[0.2, 0.34], [0.66, 0.86]]) {
        let run = 0, worst = 0;
        for (let ms = u0 * x.durationMs; ms <= u1 * x.durationMs; ms += 10) {
          x.seek(ms);
          const a = textOp('[data-node="cx-stack"]'), b = textOp('[data-node="lz-stack"]');
          run = a < 0.15 && b < 0.15 ? run + 10 : 0;
          worst = Math.max(worst, run);
        }
        if (worst > 200) out.push(`${pr.name} ${ratio} (${u0}–${u1}): neither copy legible for ${worst} ms`);
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The lens rim cuts no text: every text in the lens copy is wholly inside the window or wholly outside it (every
// 20 ms over u 0.20–0.80, labels shown), and there is lens text to check.
test(`${ID}: lens rim — no copy line cut, fields wholly in or out (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
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
          if (touching.some(Boolean) && !inside.every(Boolean)) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" cut by the rim`);
        }
      }
      if (!texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 30);
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// The lens is never a faint, blank outline: every partly transparent stretch lasts < 150 ms (every 10 ms).
test(`${ID}: lens opacity — no faint phase >= 150 ms (every 10 ms, all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
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
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

textFloorTest(ID, {step: 0.01});
inFrameTest(ID, {step: 0.005, clipped: ['[data-node="lens-bg"]']});
noOverlapTest(ID, {step: 0.01, opaque: ['[data-node="lens"]'], markers: ['[data-node="cx-marker"]', '[data-node="clerk"]', '[data-node="file"]', '[data-node="s-plaque0"]', '[data-node="s-plaque1"]']});
peopleSizeTest(ID, {names: ['clerk'], min: 60, lensMin: 45, lens: [0.2, 0.8], step: 0.02});
equalWeightTest(ID, {chips: [['[data-node="legend-active"]', '[data-node="legend-archived"]']], marks: [['[data-node="s-mark0"]', '[data-node="s-mark1"]'], ['[data-node="s-tmark0"]', '[data-node="s-tmark1"]']]});
// (the old and the new value are shown one after the other; at the hold both are visible: same card, cue size, opacity)
equalWeightTest(ID, {chips: [['[data-node="cx-old"]', '[data-node="cx-new"]']], marks: [['[data-node="cx-old-cue"]', '[data-node="cx-new-cue"]']], at: [1], tag: ' — old and new values at the hold'});
neutralityTest(ID);
noArrowsTest(ID);
seekHistoryTest(ID);
blankWindowTest(ID, {selectors: ['[data-node="s-room"]', '[data-node="panel"]', '[data-node="lens-bg"]', '[data-node="cx-wrap"]']});
coldCreateTest(ID);

// Labels hidden (courts-09 review round 2, items 3/11): with no panel and no tag the plan alone fills the safe box,
// centred — at rest (build) and at the hold, every preset × ratio. Rendered room (s-room) shares of the FRAME:
// 16:9 >= 0.75 wide and >= 0.60 tall (a wide room, deeper front zone); 9:16 >= 0.80 × >= 0.55 (a very deep room);
// 1:1 >= 0.80 × >= 0.45 (the deepest room whose stepped-back context still leaves the lens its >= 0.36 short side);
// its centre within 0.45–0.55 of the width and 0.40–0.50 of the height (the safe box sits below the content notice).
test(`${ID}: labels hidden — the plan fills the safe box, centred, at rest and at the hold (rendered, all presets × ratios)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const NEED = {'16:9': [0.75, 0.6], '9:16': [0.8, 0.55], '1:1': [0.8, 0.45]};
    const out = [];
    for (const pr of presets) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: 'none'}});
      await x.ready;
      const svg = x.element; const F = svg.getBoundingClientRect();
      for (const u of [0.02, 0.05, 0.1, 0.15, 0.85, 0.9, 1]) {
        x.seek(u * x.durationMs);
        const b = svg.querySelector('[data-node="s-room"]').getBoundingClientRect();
        const fw = b.width / F.width, fh = b.height / F.height;
        const cx = (b.left + b.right) / 2 / F.width - F.left / F.width, cy = ((b.top + b.bottom) / 2 - F.top) / F.height;
        const [nw, nh] = NEED[ratio];
        if (fw < nw || fh < nh || cx < 0.45 || cx > 0.55 || cy < 0.4 || cy > 0.5) out.push(`${pr.name} ${ratio} u=${u}: room ${fw.toFixed(2)}×${fh.toFixed(2)} of the frame, centre ${cx.toFixed(2)},${cy.toFixed(2)}`);
      }
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});

// A head is wholly in or out of the lens crop at every frame (courts-09 review round 2): the lens copy of the clerk's
// head is either wholly inside the lens window or wholly outside it (hidden) at 60 fps over the whole run, every
// preset × ratio × labels shown/hidden; and the head is seen in the lens (not vacuous).
test(`${ID}: lens rim — the clerk's head is wholly in or out of the lens at every frame (60 fps, all presets × ratios × labels)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, presets, ratios]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of ratios) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const eff = e => { let o = 1; for (let z = e; z && z !== svg; z = z.parentNode) { const a = z.getAttribute && z.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); } return o; };
      let seen = 0; const cut = [];
      for (let ms = 0; ms <= x.durationMs + 0.01; ms += 1000 / 60) {
        x.seek(ms);
        if (eff(q('lens')) <= 0.02) continue;
        const hd = q('lz-clerk-head'); if (eff(hd) <= 0.02) continue;
        const L = q('lens-bg').getBoundingClientRect(), b = hd.getBoundingClientRect();
        const inside = b.left >= L.left - 0.5 && b.right <= L.right + 0.5 && b.top >= L.top - 0.5 && b.bottom <= L.bottom + 0.5;
        const apart = b.right <= L.left + 0.5 || b.left >= L.right - 0.5 || b.bottom <= L.top + 0.5 || b.top >= L.bottom - 0.5;
        if (inside) seen++;
        if (!inside && !apart) cut.push(Math.round(ms));
      }
      if (cut.length) out.push(`${pr.name} ${tv} ${ratio}: head cut by the rim at ${cut.length} frames (${cut.slice(0, 6).join(', ')} ms)`);
      if (seen < 60) out.push(`${pr.name} ${tv} ${ratio}: the head is seen in the lens at only ${seen} frames`);
      x.destroy(); el.remove();
    }
    return out;
  }, [ID, presets, RATIOS]);
  expect(bad, bad.join('\n')).toEqual([]);
});
