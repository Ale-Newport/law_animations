// LAW-0216 — Sala física y remota · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the plan drawn
// at the SAME coordinates, cropped to the inspected window column, its link, the label and the datum), the change
// is localised (only the inspected window slides to the supplied free place and only its link re-routes; everybody
// else stays), and seeking back to earlier times restores exactly the previous datum.
// Windows (u): frame 0.20–0.24 · plan texts fade 0.20–0.215 and the plan shrinks aside 0.215–0.28 · lens opens
// 0.28–0.36 in the freed space · strike 0.46–0.50 · old value docks 0.51–0.55 · the window slides 0.55–0.63 ·
// new value 0.63–0.66 (still in the lens until 0.72) · lens closes 0.72–0.77 · plan grows back 0.77–0.83, its texts
// return 0.83–0.855 · marker 0.855–0.89; everything still from 0.89.
// Lens checklist (AUTHORING; LAW-0204 / LAW-0688 patterns): real magnification >= 1.5×, >= 35 % of the short side,
// context >= half the safe width at every u, lens + context >= 80 % of the safe box while open, whole pieces only,
// no head covered, the changing window visible throughout, the new value still >= 400 ms.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';

const ID = 'LAW-0216';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: ['person', 'linkEnd'],
  attach: [{from: 0, to: 0.549, a: 'person', b: 'placeBefore', tol: 0.5}, {from: 0.631, to: 1, a: 'person', b: 'placeAfter', tol: 0.5}],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.windowPlace === 'win1' && s.markerShown === 0 && s.contextScale === 1", label: 'context: everyone in place; the old datum; no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen > 0.9 && s.datum === 'before' && s.zoom >= 1.5 && s.stackInCrop && s.lensClearOfPeople && s.lensClearOfSource", label: 'isolate: a real enlargement (>= 1.5x) of the window column, clear of every person and of its source'},
    {at: 0.49, fn: "s.datum === 'changing' && s.strike > 0 && s.windowPlace === 'win1'", label: 'substitute: the old value is struck through before anything moves'},
    {at: 0.59, fn: "s.windowPlace === 'moving' && s.oldDocked === 1 && s.linkAttached", label: 'the old value is docked; only the inspected window slides, its link stays attached'},
    {at: 0.68, fn: "s.datum === 'after' && s.windowPlace === 'win2' && s.lensOpen === 1 && s.newShown === 1 && s.linkAttached", label: 'the new value and the new place in the lens, the link re-attached'},
    {at: 0.8, fn: "s.lensOpen === 0 && s.datum === 'after'", label: 'return: the lens has closed onto the updated context'},
    {at: 1, fn: "s.markerShown === 1 && s.datum === 'after' && s.windowPlace === 'win2' && s.oldDocked === 1 && s.linkAttached && s.allReached", label: 'hold: new place, struck old value docked, marker shown'},
    {at: 0.3, fn: "s.datum === 'before' && s.strike === 0 && s.oldDocked === 0 && s.windowPlace === 'win1'", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.focusTarget === 'label' && !s.moves && s.datum === 'after' && s.markerShown === 1", label: 'label substitution: only the datum changes; nothing moves'},
    {at: 0.68, params: {textVisibility: 'none'}, fn: "s.windowPlace === 'win2' && s.lensOpen === 1", label: 'labels hidden: the same localised change is visible'},
    {at: 1, params: {afterSlot: 'win1'}, fn: "!s.moves && s.windowPlace === 'win1'", label: 'an after-place equal to the current place moves nothing (nothing inferred)'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const focus = p.seats[p.focusSeat]; const others = p.routes.map(r => p.seats[r.seat]).filter(s => s && s !== focus).map(s => s.label); return [p.courts.building, p.courts.room, ...others, focus.label, p.afterValue, p.beforeValue, p.labels.mainDoor, p.labels.key, p.contextLabels.context, p.contextLabels.marker].filter(Boolean);",
  content: "const focus = p.seats[p.focusSeat]; const others = p.routes.map(r => p.seats[r.seat]).filter(s => s && s !== focus).map(s => s.label); return [...others, focus.label, p.afterValue];",
  captions: 'return [p.labels.mainDoor];',
});

const K = "const vb = svg.viewBox.baseVal; const K = svg.getScreenCTM().a * (vb.width / (vb.width > vb.height * 1.2 ? 1920 : 1080));";
const BOX = "const bx = e => { const r = e.getBoundingClientRect(); return {l: r.left, t: r.top, r: r.right, b: r.bottom}; }; const hit = (a, b, pad = 0) => a.l < b.r - pad && b.l < a.r - pad && a.t < b.b - pad && b.t < a.b - pad;";
const HEADS = "const heads = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+-head$/.test(e.getAttribute('data-node'))).map(bx);";
// no chip, the lens window, the marker or the panel covers a head in the context
const NO_COVER = `(() => { ${K} ${BOX} ${HEADS}
  const cards = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lab\\d+-body|door-cap0-body|room-name|cx-label-body|cx-old-body|cx-new-body|cx-marker|lens-bg)$/.test(e.getAttribute('data-node')) && visible(e)).map(bx);
  return heads.length > 0 && cards.every(c => heads.every(h => !hit(c, h, 1)));
})()`;
// the other labels sit beside their own participant; the inspected chips stay attached to their window
const LABEL_OWNS = `(() => { ${K} ${BOX} ${HEADS}
  const labs = [...svg.querySelectorAll('[data-node]')].filter(e => /^lab\\d+$/.test(e.getAttribute('data-node')) && visible(e));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-layer="content-notice"]') && !t.closest('[data-node="lens"]'));
  for (const lab of labs) {
    const nm = lab.getAttribute('data-node');
    const body = bx(svg.querySelector('[data-node="' + nm + '-body"]'));
    const pb = bx(svg.querySelector('[data-node="' + lab.getAttribute('data-owner') + '"]'));
    const gap = Math.max(0, Math.max(pb.l - body.r, body.l - pb.r), Math.max(pb.t - body.b, body.t - pb.b)) / K;
    if (gap > 40) return false;
    const line = svg.querySelector('[data-node="' + nm + '-lead"]');
    const m = line.getScreenCTM();
    const A = new DOMPoint(+line.getAttribute('x1'), +line.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+line.getAttribute('x2'), +line.getAttribute('y2')).matrixTransform(m);
    if (!(B.x >= pb.l - 2 && B.x <= pb.r + 2 && B.y >= pb.t - 2 && B.y <= pb.b + 2)) return false;
    const pts = Array.from({length: 12}, (_, j) => ({x: A.x + (B.x - A.x) * (0.1 + 0.8 * j / 11), y: A.y + (B.y - A.y) * (0.1 + 0.8 * j / 11)}));
    if (pts.some(q => [...texts.filter(t => !lab.contains(t)).map(bx), ...heads].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b))) return false;
  }
  const wrap = svg.querySelector('[data-node="cx-wrap"]');
  if (wrap && parseFloat(wrap.getAttribute('opacity') || 1) > 0.99) {
    const tEl = [...svg.querySelectorAll('[data-node]')].find(e => /^win-win\\d$/.test(e.getAttribute('data-node')) && e.hasAttribute('transform'));
    const tile = tEl ? bx(tEl) : null;
    const lb = svg.querySelector('[data-node="cx-label-body"]');
    if (tile && lb) { const b = bx(lb); const gap = Math.max(0, Math.max(tile.l - b.r, b.l - tile.r), Math.max(tile.t - b.b, b.t - tile.b)) / K; if (gap > 14) return false; }
  }
  return true;
})()`;
const PEOPLE_SIZE = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const hd = svg.querySelector('[data-node="' + e.getAttribute('data-node') + '-head"]').getBoundingClientRect(); const r = e.getBoundingClientRect(); return Math.max(hd.width, hd.height) / K >= 26 && Math.max(r.width, r.height) / K >= 60; });
})()`;
const PEOPLE_LENS = `(() => { ${K}
  const ps = [...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node')));
  return ps.length > 0 && ps.every(e => { const r = e.getBoundingClientRect(); return Math.max(r.width, r.height) / K >= 45; });
})()`;
// through the return and hold the substituted value (and, once docked, the struck old value) stay visible >= 16 px
const VALUE_TRACE = `(() => { ${K}
  const px = t => parseFloat(getComputedStyle(t).fontSize) * Math.sqrt(Math.abs(t.getScreenCTM().a * t.getScreenCTM().d)) / K;
  const wrap = svg.querySelector('[data-node="cx-wrap"]');
  if (!wrap || !visible(wrap) || parseFloat(wrap.getAttribute('opacity') || 1) < 0.99) return false;
  const newG = svg.querySelector('[data-node="cx-new"]');
  const shown = newG && parseFloat(newG.getAttribute('opacity') || 0) > 0.99 ? newG : svg.querySelector('[data-node="cx-old"]');
  const texts = [shown, svg.querySelector('[data-node="cx-dock"]')].filter(e => e && visible(e) && parseFloat(e.getAttribute('opacity') ?? 1) > 0).flatMap(e => [...e.querySelectorAll('text')]);
  return texts.length > 0 && texts.every(t => px(t) >= 16);
})()`;
// the scene's drawn bounds: every top-level part, the lens counted by its window (its content is clipped)
const SB = "const sceneBox = () => { const root = svg.querySelector('[data-layer=\"scene\"]').firstElementChild; const rs = [...root.children].map(e => (e.getAttribute('data-node') === 'lens' ? svg.querySelector('[data-node=\"lens-border\"]') : e).getBoundingClientRect()).filter(q => q.width > 0 || q.height > 0); return {left: Math.min(...rs.map(q => q.left)), top: Math.min(...rs.map(q => q.top)), right: Math.max(...rs.map(q => q.right)), bottom: Math.max(...rs.map(q => q.bottom))}; };";
const FILL = "(() => { " + SB + " const m = svg.getScreenCTM().inverse(); const b = sceneBox(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; const fh = (p2.y - p1.y) / (vb.height * 0.74), fw = (p2.x - p1.x) / (vb.width * 0.88); return Math.max(fh, fw) >= 0.9 && Math.min(fh, fw) >= 0.72; })()";
const IN_FRAME = "(() => { " + SB + " const m = svg.getScreenCTM().inverse(); const b = sceneBox(); const p1 = new DOMPoint(b.left, b.top).matrixTransform(m), p2 = new DOMPoint(b.right, b.bottom).matrixTransform(m); const vb = svg.viewBox.baseVal; return p1.x >= -1 && p1.y >= -1 && p2.x <= vb.width + 1 && p2.y <= vb.height + 1; })()";
const OPAQUE = "[...svg.querySelectorAll('[data-node]')].filter(e => /^p\\d+$/.test(e.getAttribute('data-node'))).every(e => visible(e) && !e.getAttribute('opacity'))";
// guides start on the source frame and end on the lens window, crossing no text and no head
const GUIDES = `(() => { ${K} ${BOX} ${HEADS}
  const src = svg.querySelector('[data-node="src-frame"]');
  if (!src || !visible(src) || parseFloat(src.getAttribute('opacity')) < 0.5) return true;
  const sb = bx(src), lb = bx(svg.querySelector('[data-node="lens-bg"]'));
  const texts = [...svg.querySelectorAll('text')].filter(t => visible(t) && (t.textContent || '').trim() && !t.closest('[data-node="lens"]') && !t.closest('[data-layer="content-notice"]')).map(bx);
  const near = (q, b) => q.x >= b.l - 3 && q.x <= b.r + 3 && q.y >= b.t - 3 && q.y <= b.b + 3;
  const guides = [...svg.querySelectorAll('[data-node^="guide"]')].filter(e => visible(e) && parseFloat(e.getAttribute('opacity')) > 0);
  for (const gd of guides) {
    const m = gd.getScreenCTM();
    const A = new DOMPoint(+gd.getAttribute('x1'), +gd.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+gd.getAttribute('x2'), +gd.getAttribute('y2')).matrixTransform(m);
    if (!near(A, sb) || !near(B, lb)) return false;
    for (let j = 2; j < 28; j++) { const q = {x: A.x + (B.x - A.x) * j / 30, y: A.y + (B.y - A.y) * j / 30}; if ([...texts, ...heads].some(o => q.x > o.l && q.x < o.r && q.y > o.t && q.y < o.b)) return false; }
  }
  return true;
})()`;
// the lens copy holds furniture whole or not at all (no piece cut by its rim)
const LENS_WHOLE = `(() => { ${BOX}
  const lens = svg.querySelector('[data-node="lens-bg"]');
  if (!lens || !visible(lens)) return true;
  const lb = bx(lens);
  const pieces = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lzrm-(desk|table\\d|plant\\d|chair-\\w+|hub-\\w+)|lz-win-win\\d|lz-p\\d+)$/.test(e.getAttribute('data-node'))).map(bx);
  return pieces.every(b => b.l >= lb.l - 2 && b.r <= lb.r + 2 && b.t >= lb.t - 2 && b.b <= lb.b + 2);
})()`;
// links are solid (no dash pattern)
const SOLID = `(() => {
  const lines = [...svg.querySelectorAll('[data-node]')].filter(e => /^(lz-)?link\\d+-line$/.test(e.getAttribute('data-node')));
  return lines.every(e => { const da = (e.getAttribute('stroke-dasharray') || 'none'); if (da === 'none') return true; const v = da.split(/[ ,]+/).map(Number); return !v[0] || v[0] >= e.getTotalLength() - 1; });
})()`;

ratioChecks(ID, 'lens: real zoom, clear of people, whole pieces, guides anchored; labels own their people; solid links', [
  {at: [0.1, 1], fn: 's.contextScale === 1 && s.textOnPlan === 1 && s.lensOpen === 0', label: 'build and hold: the plan fills its area at full size, every text on it shown, no lens'},
  {at: [0.4, 0.6], fn: 's.contextScale < 1 && s.lensOpen === 1 && s.lensClearOfPlan && s.textOnPlan === 0', label: 'lens open: the plan has shrunk aside (its own texts hidden, the lens shows them enlarged), the lens sits in the freed space'},
  {at: times(0.2, 0.9, 0.02), dom: PEOPLE_LENS, label: 'rendered: while the lens phase runs every person stays >= 45 px across (1080p)'},
  {at: times(0.77, 1, 0.01), tv: ['all'], dom: VALUE_TRACE, label: 'rendered: through the return and hold the substituted value (and the struck old value) stay visible at >= 16 px'},
  {at: times(0, 1, 0.03), dom: NO_COVER, label: 'rendered: no chip, marker or lens window covers a head'},
  {at: [0.4, 0.6], dom: LENS_WHOLE, label: 'rendered: every piece in the lens (furniture, windows, people) is whole'},
  {at: [0.1, 1], tv: ['all'], dom: LABEL_OWNS, label: 'rendered: each label within 40 px of its own participant; the inspected chips stay attached to their window'},
  {at: [0.4, 0.5, 0.6, 0.7], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.stackInCrop', label: 'the lens enlarges >= 1.5x and holds the whole inspected label and datum'},
  {at: times(0.2, 0.8, 0.02), fn: 's.lensClearOfPeople && s.lensClearOfSource', label: 'the lens window never covers a person, nor its own source'},
  {at: [0.3, 0.5, 0.7], dom: GUIDES, label: 'rendered: guides start on the source frame, end on the lens and cross no text or head'},
  {at: [0.66, 0.69, 0.715], tv: ['all'], fn: "s.newShown === 1 && s.lensOpen === 1 && s.datum === 'after'", label: 'the new value is readable and still in the lens for >= 400 ms'},
  {at: times(0, 1, 0.05), fn: 's.linkAttached', label: 'the inspected link stays attached to its window at every time'},
  {at: times(0, 1, 0.1), dom: SOLID, label: 'rendered: links are solid (no dashes)'},
  {at: [1], fn: 's.markerShown === 1 && s.markerClearOfHeads', label: 'the Δ marker is clear of every head'},
  {at: [0, 0.1, 0.19, 0.9, 1], dom: PEOPLE_SIZE, label: 'rendered: at rest, build and hold people >= 60 px across, heads >= 26 px (1080p)'},
  {at: [1], dom: FILL, label: 'rendered: plan and panel fill the caption-safe box'},
  {at: times(0, 1, 0.1), dom: IN_FRAME, label: 'rendered: nothing leaves the frame'},
  {at: times(0, 1, 0.1), dom: OPAQUE, label: 'rendered: people are always whole and opaque'},
  {at: [1], fn: 's.problems.length === 0', label: 'the composition fits without problems'},
]);

// LAW-0688 pattern: the context stays a real scene (>= half the safe width at every u) and, while the lens is open,
// lens + context fill >= 80 % of the safe box; the lens is >= 35 % of the short side and >= 1.5x its source frame.
test.describe(`${ID} context and lens size`, () => {
  test(`${ID}: context >= 0.5 of the safe width and >= 0.45 of the frame width at every u; lens + context >= 80 % of the safe box; lens >= 35 % of the short side and >= 1.5x its source`, async ({page}) => {
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
        const sa = x.getState({bounds: false}).params.safeArea;
        const R = svg.getBoundingClientRect();
        const safe = {x: R.left + vb.width * sa.left * k, y: R.top + vb.height * sa.top * k, w: vb.width * (1 - sa.left - sa.right) * k, h: vb.height * (1 - sa.top - sa.bottom) * k};
        for (let u = 0; u <= 1.0001; u += 0.01) {
          x.seek(u * x.durationMs);
          const s = x.getState({bounds: false}).semantic;
          const plan = svg.querySelector('[data-node="world"]').firstElementChild.getBoundingClientRect();
          if (plan.width < 0.5 * safe.w - 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: context ${(plan.width / safe.w).toFixed(2)} of the safe width`);
          if (plan.width < 0.45 * vb.width * k - 0.5) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: context ${(plan.width / (vb.width * k)).toFixed(3)} of the FRAME width`);
          if (s.lensOpen === 1) {
            const lens = svg.querySelector('[data-node="lens-border"]').getBoundingClientRect();
            const rs = [plan, lens, svg.querySelector('[data-node="panel"]').getBoundingClientRect()].filter(q => q.width > 0);
            const l = Math.max(safe.x, Math.min(...rs.map(q => q.left))), t = Math.max(safe.y, Math.min(...rs.map(q => q.top)));
            const rr = Math.min(safe.x + safe.w, Math.max(...rs.map(q => q.right))), bb = Math.min(safe.y + safe.h, Math.max(...rs.map(q => q.bottom)));
            const cov = ((rr - l) * (bb - t)) / (safe.w * safe.h);
            if (cov < 0.8) out.push(`${pr.name} ${tv} ${ratio} u=${u.toFixed(2)}: lens + context cover ${cov.toFixed(2)} of the safe box`);
            const src = svg.querySelector('[data-node="src-frame"]').getBoundingClientRect();
            const frac = Math.min(lens.width, lens.height) / k / Math.min(w, h);
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

// Rendered, dense (every 20 ms over u 0.20–0.80): no lens-copy text line is cut by the lens rim; each text field is
// wholly in the copy or wholly left out.
test(`${ID}: lens rim — no copy line cut, fields wholly in or out (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(300000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const bad = await page.evaluate(async ([id, ps]) => {
    const def = await window.__lib.load(id);
    const out = [];
    for (const pr of ps) for (const [ratio, w, h] of [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]]) {
      const el = document.createElement('div'); document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: h, params: pr.params});
      await x.ready;
      const svg = x.element;
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const step = 20 / x.durationMs;
      let texts = 0;
      for (let u = 0.2; u <= 0.8 + 1e-9; u += step) {
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
          if (touching.some(Boolean) && !inside.every(Boolean)) out.push(`${pr.name} ${ratio} u=${u.toFixed(2)}: "${t.textContent.slice(0, 24)}" cut by the rim or only partly in the lens`);
        }
      }
      if (!texts) out.push(`${pr.name} ${ratio}: no lens text found (vacuous)`);
      x.destroy(); el.remove();
    }
    return [...new Set(out)].slice(0, 30);
  }, [ID, presets]);
  expect(bad, bad.join('\n')).toEqual([]);
});

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
