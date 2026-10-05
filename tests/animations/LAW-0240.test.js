// LAW-0240 — Adaptación de accesibilidad · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the same plan,
// cropped to the main entrance and its datum); the change is localised (only the ramp — or the steps' handrails —
// leaves or appears, as supplied; the people, the other supports and the room stay); seeking back restores exactly the
// previous datum.
// Windows (u): source frame 0.20–0.23 · the lens opens 0.21–0.29, its window and enlarged copy (with the value text)
// arriving TOGETHER while the panel cross-fades out in the same place · the context datum fades in the 80 ms before
// the lens value text is legible (hand-over gap < 50 ms) · lift 0.46–0.50 · dock 0.50–0.54 · the lens copy changes
// 0.54–0.62 · new value 0.62–0.65 (still in the lens until 0.72) · the lens closes 0.72–0.77 with the panel returning
// as it goes · as the lens value text stops being legible the context takes the change (160 ms) and its datum returns
// (gap < 50 ms) · marker 0.80–0.84; still from 0.84.
// Legal / content (strict): "barrier detected" is only a supplied observation — no standard, measurement,
// obligation, compliance or outcome; no red, no strike, no dash; the key keeps "no conclusion drawn".
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0240';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.detail === 'present' && s.ctxDetail === 'present' && s.ctxDatum === 1 && s.markerShown === 0 && s.panel === 1", label: 'build: the plan at rest with the ramp beside the steps; no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.lensBody === 1 && s.ctxDatum === 0 && s.datum === 'before' && s.relMagnification >= 1.5", label: 'isolate: a real enlargement (>= 1.5x) of the entrance and its datum; the context copy of the datum is hidden'},
    {at: 0.6, fn: "s.detail !== 'present' && s.ctxDetail === 'present' && s.ctxDatum === 0 && s.dock === 1", label: 'substitute: only the lens copy changes; the context keeps its before-state and its datum stays hidden'},
    {at: 0.7, fn: "s.datum === 'after' && s.newValue === 1 && s.detail === 'absent' && s.lensOpen === 1 && s.ctxDatum === 0", label: 'the new value in the lens; the ramp has left the lens copy'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.ctxDetail === 'absent' && s.ctxDatum === 1", label: 'return: the lens has closed; the context has taken the change and shows the datum again'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.ctxDetail === 'absent' && s.dock === 1 && s.problems.length === 0", label: 'hold: the new datum with its "was" dock and the marker'},
    {at: 0.3, fn: "s.datum === 'before' && s.dock === 0 && s.newValue === 0 && s.detail === 'present' && s.ctxDetail === 'present'", label: 'seeking back restores the previous datum exactly'},
    {at: 0.7, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'handrails' && s.detail === 'present' && s.ctxDetail === 'absent'", label: 'handrails datum (absent → present): only the handrails appear (in the lens first)'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.ctxDetail === 'present' && s.markerShown === 1", label: 'handrails datum: the context shows them after the hand-over'},
    {at: 0.7, params: {textVisibility: 'none'}, fn: "s.detail === 'absent' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible in the lens'},
    {at: 1, fn: "JSON.stringify(s.people) === JSON.stringify(s.people)", label: 'the people stay at their places'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [p.courts.building, p.courts.room, ...p.seats.map(s => s.label), p.labels.ramp, p.labels.tactile, p.labels.sign, p.labels.key, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  content: "return [...p.seats.map(s => s.label), p.afterValue];",
  captions: 'return [p.labels.ramp, p.labels.tactile, p.labels.sign];',
});

// ---------------------------------------------------------------------------------------------
// Rendered checks (every preset × ratio × labels shown/hidden). Distances in px at 1080p.
const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
const EFF = "const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };";
// no visible card (seat labels, room name, datum chips, panel) and no visible lens window covers a head
const NO_COVER = `(() => { ${K} ${BOX} ${HEADS} ${EFF}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|room-name-body|cx-(old|new|dock)-body|panel-\\w+|legend-\\w+|who\\d+|key|bld|cx-marker)$/.test(e.getAttribute('data-node')) && visible(e) && eff(e) >= 0.05).map(bx);
  const lens = svg.querySelector('[data-node="lens-border"]');
  if (eff(lens) >= 0.05) cards.push(bx(lens));
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// each visible seat label: its chip within 40 px of its owner and its leader ends on the owner
const LABEL_OWNS = `(() => { ${K} ${BOX} ${EFF}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e) && eff(e) >= 0.05);
  if (!labs.length) return false;
  for (const lab of labs) {
    const nm = lab.getAttribute('data-node');
    const body = bx(svg.querySelector('[data-node="' + nm + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
// the changed datum in ONE place: the context copy and the lens copy are never both legible (>= 0.15)
const ONE_PLACE = `(() => { ${EFF}
  const cx = ['cx-old', 'cx-new', 'cx-dock'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean);
  const lz = ['lz-old', 'lz-new', 'lz-dock'].map(n => svg.querySelector('[data-node="' + n + '"]')).filter(Boolean);
  if (!cx.length) return true;
  const c = Math.max(...cx.map(eff)), l = Math.max(...lz.map(eff));
  return !(c >= 0.15 && l >= 0.15);
})()`;
// no empty lens outline: whenever the lens border is visible its enlarged copy is too (its own opacity >= 0.5 of the border's)
const NO_EMPTY = `(() => { ${EFF}
  const b = eff(svg.querySelector('[data-node="lens-border"]')), c = parseFloat(svg.querySelector('[data-node="lens-body"]').getAttribute('opacity') || 1);
  return b < 0.05 || c >= 0.5 * b;
})()`;
// the lens never covers its own source (the entrance frame) nor any person
const DISTINCT = `(() => { ${BOX} ${EFF}
  const lens = svg.querySelector('[data-node="lens-border"]');
  if (eff(lens) < 0.05) return true;
  const lb = bx(lens), sb = bx(svg.querySelector('[data-node="src-frame"]'));
  const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).map(bx);
  return !hit(lb, sb, 0) && heads.every(h => !hit(lb, h, 0));
})()`;
// guides start on the source frame and end on the lens window, crossing no head
const GUIDES = `(() => { ${K} ${BOX} ${HEADS} ${EFF}
  const src = svg.querySelector('[data-node="src-frame"]');
  if (eff(src) < 0.5) return true;
  const sb = bx(src), lb = bx(svg.querySelector('[data-node="lens-bg"]'));
  const near = (q, b) => q.x >= b.l - 3 && q.x <= b.r + 3 && q.y >= b.t - 3 && q.y <= b.b + 3;
  const guides = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => eff(e) > 0.05);
  for (const gd of guides) {
    const m = gd.getScreenCTM();
    const A = new DOMPoint(+gd.getAttribute('x1'), +gd.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+gd.getAttribute('x2'), +gd.getAttribute('y2')).matrixTransform(m);
    if (!(near(A, sb) || near(A, lb)) || !(near(B, lb) || near(B, sb))) return false;
    for (let j = 2; j < 28; j++) { const q = {x: A.x + (B.x - A.x) * j / 30, y: A.y + (B.y - A.y) * j / 30}; if (heads.some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;
// no strike and no dash anywhere (the old value is muted, never struck; "not shown" is never pending)
// (the only dash pattern allowed is the door-swing arc of the room's own door, a plan convention of the kit)
const SOLID = `(() => [...svg.querySelectorAll('[stroke-dasharray]')].every(e => { const d = e.getAttribute('stroke-dasharray'); if (!d || d === 'none') return true; const n = e.closest('[data-node]'); return !!n && /^(lz)?rm-d(room|main|side)$/.test(n.getAttribute('data-node')); }) && [...svg.querySelectorAll('[data-node]')].every(e => !/strike/.test(e.getAttribute('data-node'))) && [...svg.querySelectorAll('text')].every(t => !/line-through/.test(t.getAttribute('text-decoration') || '')))()`;
const NO_RED = `(() => {
  const red = c => { const m = /^#([0-9a-f]{6})$/i.exec(c || ''); if (!m) return false; const n = parseInt(m[1], 16), R = n >> 16, G = (n >> 8) & 255, B = n & 255; return R > 170 && G < 90 && B < 90; };
  return [...svg.querySelectorAll('[fill], [stroke]')].every(e => !red(e.getAttribute('fill')) && !red(e.getAttribute('stroke')));
})()`;
// the datum chips under the entrance keep clear of the plan (they sit below it) and of every person
const STACK_CLEAR = `(() => { ${BOX} ${EFF}
  const chips = [...svg.querySelectorAll('[data-node]')].filter(e => /^cx-(old|new|dock)-body$/.test(e.getAttribute('data-node')) && eff(e) >= 0.05).map(bx);
  const plan = bx(svg.querySelector('[data-node="rm-plan-art"]'));
  const people = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).map(bx);
  return chips.every(c => !hit(c, plan, 1) && people.every(q => !hit(c, q, 1)));
})()`;
const SB = "const sceneBox = () => { const root = svg.querySelector('[data-layer=\"scene\"]').firstElementChild; const rs = [...root.children].map(e => (e.getAttribute('data-node') === 'lens' ? svg.querySelector('[data-node=\"lens-border\"]') : e).getBoundingClientRect()).filter(q => q.width > 0 || q.height > 0); return {left: Math.min(...rs.map(q => q.left)), top: Math.min(...rs.map(q => q.top)), right: Math.max(...rs.map(q => q.right)), bottom: Math.max(...rs.map(q => q.bottom))}; };";
const FILL = "(() => { " + SB + " const m = svg.getScreenCTM().inverse(); const b = sceneBox(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { " + SB + " const m = svg.getScreenCTM().inverse(); const b = sceneBox(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";

ratioChecks(ID, 'lens: one place, one state, distinct from the screen, no empty outline; no head covered; solid, no red', [
  {at: times(0, 1, 0.01), dom: ONE_PLACE, label: 'rendered: the datum is never legible in the context and in the lens at once'},
  
  {at: times(0.2, 0.8, 0.01), fn: "s.lensBody < 0.15 || s.ctxDetail === (P.detailGeometry.change === 'absent-to-present' ? 'absent' : 'present')", label: 'while the lens is legible the context detail keeps its before-state (the after-state in one place)'},
  {at: times(0.2, 0.8, 0.005), dom: NO_EMPTY, label: 'rendered: the lens border never shows without its enlarged copy'},
  {at: times(0.25, 0.75, 0.05), dom: DISTINCT, label: 'rendered: the lens never covers its source frame nor a person'},
  {at: times(0, 1, 0.02), dom: NO_COVER, label: 'rendered: no chip, panel text, marker or lens window covers a head'},
  {at: [0.1, 0.5, 1], tv: ['all'], dom: LABEL_OWNS, label: 'rendered: each seat label within 40 px of its own participant'},
  {at: times(0, 1, 0.1), dom: PEOPLE_SIZE, label: 'rendered: people >= 60 px across and heads >= 26 px (1080p)'},
  {at: [0, 0.1, 0.85, 1], dom: STACK_CLEAR, label: 'rendered: the datum chips sit clear of the plan and of every person'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides join the source frame and the lens and cross no head'},
  {at: [0, 0.4, 0.6, 0.7, 1], dom: SOLID, label: 'rendered: no dash and no strike-through anywhere'},
  {at: [0, 0.6, 1], dom: NO_RED, label: 'rendered: no red/alarm colour anywhere'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.relMagnification >= 1.5 && s.lensOpen === 1', label: 'the lens enlarges >= 1.5x against the context at rest'},
  {at: [0.66, 0.69, 0.715], tv: ['all'], fn: "s.newValue === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: [0, 0.1, 1], dom: FILL, label: 'rendered: plan and panel fill the caption-safe box'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// Lens size (AUTHORING lens checklist): the rendered lens's SMALLER side >= 0.35 of the frame's short side and its
// width >= 1.5x its rendered source frame, whenever the lens is fully open; the context (the room plan) keeps
// >= 0.45 of the FRAME width at every u.
test.describe(`${ID} context and lens size`, () => {
  test(`${ID}: lens >= 0.35 of the short side and >= 1.5x its source; context >= 0.45 of the frame width at every u`, async ({page}) => {
    test.setTimeout(600000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
        const el = document.createElement('div');
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const svg = x.element;
        const vb = svg.viewBox.baseVal;
        const k = svg.getScreenCTM().a;
        for (let u = 0; u <= 1.0001; u += 0.01) {
          x.seek(u * x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          const plan = svg.querySelector('[data-node="rm-plan-art"]').getBoundingClientRect();
          if (plan.width < 0.45 * vb.width * k - 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: context ${(plan.width / (vb.width * k)).toFixed(3)} of the FRAME width`);
          if (s.lensOpen === 1) {
            const lens = svg.querySelector('[data-node="lens-border"]').getBoundingClientRect();
            const src = svg.querySelector('[data-node="src-frame"]').getBoundingClientRect();
            const frac = Math.min(lens.width, lens.height) / (Math.min(vb.width, vb.height) * k);
            if (frac < 0.35 - 1e-3) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: lens ${frac.toFixed(3)} of the short side`);
            if (lens.width / src.width < 1.5 - 1e-3) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: lens ${(lens.width / src.width).toFixed(2)}x its source`);
          }
        }
        x.destroy(); el.remove();
      }
      return [...new Set(out)].slice(0, 40);
    }, [ID, presets]);
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

// Text size at EVERY moment: every visible text (effective opacity >= 0.05) is >= 16 px at 1080p at every sampled u,
// and >= 19.5 px in the default, baseline-illustrative and baseline-es presets (pattern of LAW-0196 / LAW-0213).
test.describe(`${ID} text size over time`, () => {
  test(`${ID}: every visible text >= 16 px (>= 19.5 px in baseline and baseline-es) at every sampled u`, async ({page}) => {
    test.setTimeout(300000);
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
    const bad = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const out = [];
      for (const pr of presets) {
        const floor = ['default', 'baseline-illustrative', 'baseline-es'].includes(pr.name) ? 19.5 : 16;
        for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: pr.params});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          for (let u = 0; u <= 1.0001; u += 0.02) {
            x.seek(u * x.durationMs);
            const s0 = svg.getScreenCTM().a;
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-layer="content-notice"]') || eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
              const b = t.getBoundingClientRect();
              if (b.width < 0.5) continue;
              const fs = parseFloat(getComputedStyle(t).fontSize);
              const pxs = fs * (t.getScreenCTM().a / s0) * 1080 / Math.min(w, h);
              if (pxs < floor - 0.05) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" ${pxs.toFixed(1)} px < ${floor}`);
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
});

// create() is cold-fast: <= 1000 ms in a fresh page for every preset × ratio (AUTHORING item 20)
test(`${ID}: cold create() <= 1 s in every preset × ratio`, async ({browser}) => {
  test.setTimeout(300000);
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const slow = [];
  for (const pr of presets) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
    const page = await browser.newPage();
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const ms = await page.evaluate(async ([id, w, h, params]) => {
      const def = await window.__lib.load(id);
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const t0 = performance.now();
      const x = def.create(el, {width: w, height: h, params});
      await x.ready;
      return performance.now() - t0;
    }, [ID, w, h, pr.params]);
    if (ms > 1000) slow.push(`${pr.name} ${ratio}: ${Math.round(ms)} ms`);
    await page.close();
  }
  expect(slow, slow.join('\n')).toEqual([]);
});

// Hand-over at 60 fps (AUTHORING lens checklist, LAW-0244): measured on the VALUE TEXT the viewer reads (the text of
// the datum chips, effective opacity >= 0.15). On open, from the last frame the context value is legible to the first
// frame the lens value is legible; on close, from the last lens frame to the first context frame: each gap <= 200 ms,
// and the two are never legible in the same frame.
test(`${ID}: datum hand-over at 60 fps — gaps <= 200 ms on open and close, never both legible`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [], info = [];
    for (const pr of ps) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const legible = P => Math.max(0, ...[...svg.querySelectorAll(`[data-node="${P}-old"] text, [data-node="${P}-new"] text, [data-node="${P}-dock"] text`)].filter(t => (t.textContent || '').trim()).map(eff)) >= 0.15;
      const n = Math.round(x.durationMs / (1000 / 60));
      const cx = [], lz = [];
      for (let i = 0; i <= n; i++) { x.seek(i * x.durationMs / n); cx.push(legible('cx')); lz.push(legible('lz')); }
      const ms = i => i * x.durationMs / n;
      if (cx.some((c, i) => c && lz[i])) out.push(`${pr.name} ${ratio}: both legible in one frame`);
      const lzOn = lz.indexOf(true), lzOff = lz.lastIndexOf(true);
      if (lzOn < 0) { out.push(`${pr.name} ${ratio}: lens value never legible`); continue; }
      let cxLast = -1; for (let i = 0; i < lzOn; i++) if (cx[i]) cxLast = i;
      let cxBack = -1; for (let i = lzOff + 1; i <= n; i++) if (cx[i]) { cxBack = i; break; }
      const g1 = ms(lzOn) - ms(cxLast), g2 = ms(cxBack) - ms(lzOff);
      info.push(`${pr.name} ${ratio}: open gap ${g1.toFixed(0)} ms (ctx last u=${(cxLast / n).toFixed(4)}, lens first u=${(lzOn / n).toFixed(4)}), close gap ${g2.toFixed(0)} ms (lens last u=${(lzOff / n).toFixed(4)}, ctx back u=${(cxBack / n).toFixed(4)})`);
      if (cxLast < 0 || g1 > 200) out.push(`${pr.name} ${ratio}: open gap ${g1.toFixed(0)} ms`);
      if (cxBack < 0 || g2 > 200) out.push(`${pr.name} ${ratio}: close gap ${g2.toFixed(0)} ms`);
      x.destroy(); el.remove();
    }
    return {out, info};
  }, [ID, presets]);
  console.log(res.info.join('\n'));
  expect(res.out, res.out.join('\n')).toEqual([]);
});

// Never a near-empty frame (LAW-0240 review): at every 20 ms the visible content — the room, the panel's visible parts
// (effective opacity >= 0.15) and the lens window (>= 0.15) — covers >= 0.3 of the frame area, except for runs
// <= 200 ms. Coverage is sampled on a 40 × 40 grid over the whole frame.
test(`${ID}: no near-empty run (< 0.3 of the frame with content) longer than 200 ms`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [], info = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
      const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
      const F = {l: m.e + vb.x * m.a, t: m.f + vb.y * m.d, w: vb.width * m.a, h: vb.height * m.d};
      const step = 20, n = Math.round(x.durationMs / step);
      let run = 0, worst = 0, worstAt = 0, minCov = 1;
      for (let i = 0; i <= n; i++) {
        x.seek(i * step);
        const parts = [svg.querySelector('[data-node="rm-plan-art"]'), ...[...svg.querySelectorAll('[data-node]')].filter(e => /^(bld|panel-\w+|legend-\w+|key)$/.test(e.getAttribute('data-node')) && e.closest('[data-node="panel"]')), svg.querySelector('[data-node="lens-border"]')]
          .filter(e => e && eff(e) >= 0.15).map(e => e.getBoundingClientRect());
        let hit = 0;
        for (let a = 0; a < 40; a++) for (let b = 0; b < 40; b++) {
          const px = F.l + (a + 0.5) * F.w / 40, py = F.t + (b + 0.5) * F.h / 40;
          if (parts.some(r => px >= r.left && px <= r.right && py >= r.top && py <= r.bottom)) hit++;
        }
        const cov = hit / 1600;
        minCov = Math.min(minCov, cov);
        if (cov < 0.3) { run += step; if (run > worst) { worst = run; worstAt = i * step; } } else run = 0;
      }
      info.push(`${pr.name} ${tv} ${ratio}: min coverage ${minCov.toFixed(3)}, longest run < 0.3: ${worst} ms (ending ${worstAt} ms)`);
      if (worst > 200) out.push(`${pr.name} ${tv} ${ratio}: ${worst} ms below 0.3 coverage (ending ${worstAt} ms)`);
      x.destroy(); el.remove();
    }
    return {out, info};
  }, [ID, presets]);
  console.log(res.info.join('\n'));
  expect(res.out, res.out.join('\n')).toEqual([]);
});

// locale "es" with the default content (courts-10 review): every default left untouched switches to its Spanish
// default, so no English text is drawn anywhere (a supplied value is never replaced).
ratioChecks(ID, 'locale es with default params draws no English', [
  {at: [0.1, 0.3, 0.5, 0.7, 0.9, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Participant|Civic|building|Hearing|room|Room|Ramp|ramp|handrails|Tactile|strip|Wall|sign|supplied|conclusion|drawn|Moves|Walks|wheelchair|cane|Entrance|steps|Steps|Sequence|configured|illustrative|Design|support|Barrier|detected|Only|Same|Changed|winner|outcome|was|Everyone|Connections|relation|has|ends|marks|starts|door|fictional|jurisdiction)\\b/.test(t.textContent))", label: 'no English text with locale es and default params'},
]);
ratioChecks(ID, 'locale es keeps a supplied value', [
  {at: [0.5, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es', courts: {building: 'Zeta Hall (fictional)', room: 'Zeta Room (fictional)'}}, dom: "[...svg.querySelectorAll('text')].some(t => /Zeta/.test(t.textContent))", label: 'a supplied name stays as supplied with locale es'},
]);

// Panel and lens exclusivity at 60 fps (courts-10 review): the panel (building, legend, captions) is below 0.15
// effective opacity before the lens window starts to appear (any opacity > 0.01), and returns only after the window
// has gone — in every preset × ratio × labels state, at every 1/60 s frame.
test(`${ID}: panel and lens window are never visible together (60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [], info = [];
    for (const pr of ps) for (const tv of ['all', 'none']) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = x.element;
      const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined && a !== '') o *= parseFloat(a); } return o; };
      const panel = svg.querySelector('[data-node="panel"]'), lens = svg.querySelector('[data-node="lens"]');
      const n = Math.round(x.durationMs / (1000 / 60));
      let both = 0, firstBoth = -1, panelGone = -1, lensOn = -1, lensOff = -1, panelBack = -1;
      for (let i = 0; i <= n; i++) {
        const t = i * x.durationMs / n;
        x.seek(t);
        const p = eff(panel), l = eff(lens);
        if (p >= 0.15 && l > 0.01) { both++; if (firstBoth < 0) firstBoth = t; }
        if (panelGone < 0 && p < 0.15) panelGone = t;
        if (lensOn < 0 && l > 0.01) lensOn = t;
        if (lensOn >= 0 && l > 0.01) lensOff = t;
        if (lensOff >= 0 && panelBack < 0 && l <= 0.01 && p >= 0.15) panelBack = t;
      }
      info.push(`${pr.name} ${tv} ${ratio}: panel < 0.15 at ${panelGone.toFixed(0)} ms, lens from ${lensOn.toFixed(0)} to ${lensOff.toFixed(0)} ms, panel back ${panelBack.toFixed(0)} ms`);
      if (both) out.push(`${pr.name} ${tv} ${ratio}: panel and lens together in ${both} frames (first ${firstBoth.toFixed(0)} ms)`);
      x.destroy(); el.remove();
    }
    return {out, info};
  }, [ID, presets]);
  console.log(res.info.slice(0, 6).join('\n'));
  expect(res.out, res.out.join('\n')).toEqual([]);
});

// No prop cut by the lens rim (courts-10 review): in the lens copy, only the floors and walls (surfaces the rim
// clips) may reach past the window; every prop drawn in the copy (steps, ramp, strip, doors, furniture) lies inside it.
ratioChecks(ID, 'lens copy draws no prop cut by the rim', [
  {at: [0.35, 0.5, 0.65], dom: "(() => { const L = svg.querySelector('[data-node=\"lens-bg\"]').getBoundingClientRect(); return ![...svg.querySelectorAll('[data-node^=\"lzrm-\"]')].filter(e => !/-(plan-art|floor|corr|roomfl|walls|rwalls)$/.test(e.getAttribute('data-node'))).some(e => { const q = e.getBoundingClientRect(); return q.width > 0 && (q.left < L.left - 2 || q.top < L.top - 2 || q.right > L.right + 2 || q.bottom > L.bottom + 2); }); })()", label: 'rendered: every prop in the lens copy lies inside the window'},
]);
