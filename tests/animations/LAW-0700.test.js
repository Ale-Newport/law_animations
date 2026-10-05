// LAW-0700 — Daño material · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a second copy of the object
// zone — table, object, string and tag — drawn in the context's coordinates and posed from the same state every frame;
// it appears exactly over its source and grows from there), the change is local (only the tag's value and the marks of
// the supplied levels change) and seeking back restores the old datum exactly.
// Windows (LAW-0700.js W): texts step out 0.195–0.21 · wide boxes: the context slides right 0.195–0.222 (no scaling) ·
// scene tag value out 0.212–0.222 · lens opens 0.2225–0.31 (window and copy opaque from the first frame, exactly over
// the source) · strike 0.45–0.49 · old value out 0.52–0.555 · marks 0.52–0.58 · new value in 0.56–0.595 (still until
// 0.76) · lens closes 0.76–0.80 · scene tag value back 0.80–0.815 · context slides back 0.80–0.83 · texts back
// 0.83–0.86 · Δ marker 0.84–0.87 · trace 0.85–0.89 · key 0.86–0.90.
// coordinator decision 2026-09-27, LAW-0700: stress record rows capped so the 1:1 subject reaches >= 0.20 of the frame
// height (standing stress rule, AUTHORING item 20); rendered before/after numbers in LAW-0700.presets.json.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate} from './dano-material-checks.js';

const ID = 'LAW-0700';
const P = name => presetsFor(ID).find(q => q.name === name).params;
const RATIOS = [['16:9', 1920, 1080], ['9:16', 1080, 1920], ['1:1', 1080, 1080]];
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  continuity: ['shift'],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && !s.lensOn && s.datum === 'before' && s.tagValue === 'before' && !s.markerVisible && s.ctxValues === 1", label: 'context: the produced state with the old datum; no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && s.ctxValues === 0 && s.textsOut", label: 'isolate: an enlarged copy (>= 1.5×) holds the datum; the scene tag is blank; texts stepped out'},
    {at: 0.5, fn: "s.strike === 1 && s.datum === 'changing'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.tagValue === 'after' && s.lensOpen === 1 && s.marks.b === 1", label: 'the new value and only its dependent marks'},
    {at: 1, fn: "s.lensOpen === 0 && !s.lensOn && s.tagValue === 'after' && s.markerVisible && s.keyShown && s.ctxValues === 1 && s.shift === 0", label: 'return: changed tag in the context, Δ marker, key'},
    {at: 0.34, fn: "s.datum === 'before' && s.strike === 0 && s.tagValue === 'before' && s.marks.b === 0", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.tagValue === 'after' && s.marks.a === 1 && s.marks.b === 1 && s.markerVisible", label: 'alternative: the panel tag and its scratches'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.marks.b === 1", label: 'labels hidden: the same isolation and change'},
  ],
});

ratioChecks(ID, 'lens checklist (semantic)', [
  {at: [0.34, 0.4, 0.5, 0.6, 0.7, 0.75], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.ctxValues === 0', label: 'lens >= 1.5× open; the scene tag holds no value while the lens holds it'},
  {at: times(0.6, 0.755, 0.005), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value is still in the open lens for >= 400 ms (0.595–0.76)'},
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback && s.markerVisible', label: 'the layout fits without a fallback scale'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, marker clear', [
  {at: [0, 0.4, 0.62, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.1, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: "(() => { const m = svg.querySelector('[data-node=\"marker\"]').getBoundingClientRect(); const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; }; return [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer=\"content-notice\"]')).every(t => { const b = t.getBoundingClientRect(); return b.width < 0.5 || b.right <= m.left + 1 || b.left >= m.right - 1 || b.bottom <= m.top + 1 || b.top >= m.bottom - 1; }); })()", label: 'the Δ marker covers no text'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.afterValue, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.afterValue]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.01);
textSizeOverTime(ID, 0.004);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.1, 0.62, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Incident|Object|record|Before|After|Changed|supplied|conclusion)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

/** Run a per-instance page script over every preset × ratio (× labels shown/hidden when tvs has both). */
function sweep(title, body, {tvs = ['all', 'none'], timeout = 600000} = {}) {
  test.describe(`${ID} ${title}`, () => {
    test(`${ID}: ${title}`, async ({page}) => {
      test.setTimeout(timeout);
      await page.goto('/tests/harness/host.html');
      await page.waitForFunction(() => document.body.dataset.ready === '1');
      const res = await page.evaluate(async ([id, presets, ratios, tvs, body]) => {
        const def = await window.__lib.load(id);
        const fn = new Function('x', 'svg', 'tag', 'eff', 'frameBox', 'out', 'ctx', `return (async () => { ${body} })();`);
        const out = [];
        const stats = [];
        for (const pr of presets) for (const tv of tvs) for (const [ratio, w, h] of ratios) {
          const el = document.createElement('div');
          document.getElementById('slots').appendChild(el);
          const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
          await x.ready;
          const svg = x.element;
          const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
          const frameBox = () => { const vb = svg.viewBox.baseVal, m = svg.getScreenCTM(); const R = svg.getBoundingClientRect(); const W = vb.width * Math.abs(m.a), H = vb.height * Math.abs(m.d); return {left: m.e, top: m.f, width: W, height: H, R}; };
          const tag = `${pr.name} ${ratio} ${tv}`;
          const s = await fn(x, svg, tag, eff, frameBox, out, {w, h, tv});
          if (s !== undefined) stats.push(`${tag}: ${s}`);
          x.destroy();
          el.remove();
        }
        return {bad: [...new Set(out)].slice(0, 40), stats};
      }, [ID, ALL, RATIOS, tvs, body]);
      console.log(`${ID} ${title}:\n${res.stats.join('\n')}`);
      expect(res.bad, res.bad.join('\n')).toEqual([]);
    });
  });
}

// Lens size and magnification, measured on the RENDERED DOM: the open lens' SMALLER side is >= 0.40 of the frame's
// short side, and the lens copy of the tag is >= 1.5× the scene tag's rendered size at REST (u = 0.1).
sweep('lens size and magnification against rest (rendered)', `
  const node = n => svg.querySelector('[data-node="' + n + '"]');
  const F = frameBox();
  x.seek(0.1 * x.durationMs);
  const rest = node('tg').getBoundingClientRect();
  let minSide = Infinity, minZoom = Infinity;
  for (const u of [0.34, 0.45, 0.62, 0.75]) {
    x.seek(u * x.durationMs);
    const lb = node('lz-border').getBoundingClientRect();
    const ms = Math.min(lb.width, lb.height) / Math.min(F.width, F.height);
    const c = node('lzt').getBoundingClientRect();
    const z = Math.min(c.width / rest.width, c.height / rest.height);
    minSide = Math.min(minSide, ms); minZoom = Math.min(minZoom, z);
    if (ms < 0.4 - 0.002) out.push(tag + ' u=' + u + ': lens smaller side ' + ms.toFixed(3) + ' of the frame short side');
    if (z < 1.5) out.push(tag + ' u=' + u + ': tag magnified ' + z.toFixed(2) + '× against rest');
  }
  return 'lens min side ' + minSide.toFixed(3) + ', zoom vs rest ' + minZoom.toFixed(2) + '×';
`);

// Context and fill: the context (the object zone 'cam', always drawn at rest scale) keeps >= 0.45 of the frame width at
// every u, and while the lens is open the union of the context and lens boxes covers >= 80 % of the caption-safe box.
sweep('context >= 0.45 of the frame width; context + lens >= 80 % of the safe box (rendered)', `
  const node = n => svg.querySelector('[data-node="' + n + '"]');
  const F = frameBox();
  let minCtx = Infinity, minCov = Infinity;
  for (let u = 0; u <= 1.0001; u += 0.01) {
    x.seek(Math.min(1, u) * x.durationMs);
    const s = x.getState({bounds: false});
    const sa = s.params.safeArea;
    const safe = {x: F.left + sa.left * F.width, y: F.top + sa.top * F.height, w: (1 - sa.left - sa.right) * F.width, h: (1 - sa.top - sa.bottom) * F.height};
    const cam = node('cam').getBoundingClientRect();
    const cs = cam.width / F.width;
    minCtx = Math.min(minCtx, cs);
    if (cs < 0.45 - 0.002) out.push(tag + ' u=' + u.toFixed(2) + ': context ' + cs.toFixed(3) + ' of the frame width');
    if (s.semantic.lensOpen === 1) {
      const lb = node('lz-border').getBoundingClientRect();
      const l = Math.max(safe.x, Math.min(cam.left, lb.left)), t = Math.max(safe.y, Math.min(cam.top, lb.top));
      const rr = Math.min(safe.x + safe.w, Math.max(cam.right, lb.right)), bb = Math.min(safe.y + safe.h, Math.max(cam.bottom, lb.bottom));
      const cov = ((rr - l) * (bb - t)) / (safe.w * safe.h);
      minCov = Math.min(minCov, cov);
      if (cov < 0.8) out.push(tag + ' u=' + u.toFixed(2) + ': context + lens cover ' + cov.toFixed(2) + ' of the safe box');
      // the lens never overlaps the context's drawn zone except over its own source (it grows from there)
    }
  }
  return 'context min ' + minCtx.toFixed(3) + ', union coverage min ' + minCov.toFixed(3);
`);

// ONE copy of the datum at a time, at 60 fps: the scene tag's value texts and the lens copy's value texts are never
// both legible (effective opacity >= 0.15) in the same frame; the lens copy does show the value.
sweep('one copy of the datum at 60 fps (rendered)', `
  const node = n => svg.querySelector('[data-node="' + n + '"]');
  const frames = Math.round(x.durationMs / 1000 * 60);
  let seen = 0, worst = 0, gapRun = 0, worstGap = 0;
  const legible = pre => Math.max(...['-vbt', '-vat'].map(k => node(pre + k)).filter(Boolean).map(e => eff(e)), 0);
  for (let f = 0; f <= frames; f++) {
    x.renderFrame(f, {fps: 60});
    const a = legible('tg'), b = legible('lzt');
    if (b >= 0.15) seen++;
    worst = Math.max(worst, Math.min(a, b));
    if (a >= 0.15 && b >= 0.15) out.push(tag + ' frame ' + f + ': scene tag ' + a.toFixed(2) + ' and lens tag ' + b.toFixed(2));
    // hand-over gap: while handing the datum over (open 0.19–0.30, return 0.74–0.86) neither copy is legible for <= 200 ms
    const uu = f / frames;
    if ((uu >= 0.19 && uu <= 0.3) || (uu >= 0.74 && uu <= 0.86)) { if (a < 0.15 && b < 0.15) { gapRun++; worstGap = Math.max(worstGap, gapRun); } else gapRun = 0; } else gapRun = 0;
  }
  if (ctx.tv === 'all' && !seen) out.push(tag + ': the lens copy never shows the value (vacuous)');
  const gapMs = worstGap * 1000 / 60;
  if (gapMs > 200) out.push(tag + ': no legible copy of the datum for ' + Math.round(gapMs) + ' ms during a hand-over');
  return 'max min(both) ' + worst.toFixed(3) + ', lens-copy frames ' + seen + ', longest hand-over gap ' + Math.round(gapMs) + ' ms';
`, {tvs: ['all']});

// The lens is never blank: whenever its window is on screen, its content (the copy of the zone) is drawn with it (the
// window and the copy share one group); it first appears exactly over its source (same rectangle, scale 1).
sweep('lens never blank; it starts exactly over its source (rendered)', `
  const node = n => svg.querySelector('[data-node="' + n + '"]');
  let firstOk = null;
  const frames = Math.round(x.durationMs / 1000 * 60);
  for (let f = 0; f <= frames; f++) {
    x.renderFrame(f, {fps: 60});
    const s = x.getState({bounds: false}).semantic;
    const win = node('lz-win');
    if (eff(win) < 0.05) continue;
    const content = node('lz-content');
    if (eff(content) < 0.99 || content.getBoundingClientRect().width < 1) out.push(tag + ' frame ' + f + ': lens window without its copy');
    if (firstOk === null) {
      const d = Math.abs(s.lensNow.x - s.crop.x) + Math.abs(s.lensNow.y - s.crop.y) + Math.abs(s.lensNow.w - s.crop.w) + Math.abs(s.lensNow.h - s.crop.h);
      firstOk = d < 2;
      if (!firstOk) out.push(tag + ': first lens frame is not over its source (' + d.toFixed(1) + ')');
    }
  }
  return 'first frame over source: ' + firstOk;
`);

// Fields wholly in or wholly out of the lens; the changed datum (the tag's value) wholly inside it; guides anchored at
// the source frame's and the lens' corners.
sweep('lens rim, datum inside, guides anchored (rendered)', `
  const node = n => svg.querySelector('[data-node="' + n + '"]');
  let texts = 0;
  for (let u = 0.23; u <= 0.795 + 1e-9; u += 0.01) {
    x.seek(u * x.durationMs);
    const win = node('lz-win');
    if (eff(win) < 0.05) continue;
    const W = node('lz-border').getBoundingClientRect();
    for (const t of node('lz-content').querySelectorAll('text')) {
      if (eff(t) < 0.05 || !(t.textContent || '').trim()) continue;
      const b = t.getBoundingClientRect();
      if (b.width < 0.5) continue;
      const inside = b.left >= W.left - 1 && b.right <= W.right + 1 && b.top >= W.top - 1 && b.bottom <= W.bottom + 1;
      const outside = b.right <= W.left + 1 || b.left >= W.right - 1 || b.bottom <= W.top + 1 || b.top >= W.bottom - 1;
      texts++;
      if (!inside && !outside) out.push(tag + ' u=' + u.toFixed(2) + ': "' + t.textContent.slice(0, 20) + '" cut by the lens rim');
    }
    const tg = node('lzt').getBoundingClientRect();
    if (tg.left < W.left - 1 || tg.right > W.right + 1 || tg.top < W.top - 1 || tg.bottom > W.bottom + 1) out.push(tag + ' u=' + u.toFixed(2) + ': the tag (changed datum) is not wholly inside the lens');
    const g0 = node('guides');
    if (eff(g0) > 0.05) {
      const sf = node('src-frame').getBoundingClientRect();
      const corners = [[sf.left, sf.top], [sf.right, sf.top], [sf.left, sf.bottom], [sf.right, sf.bottom], [W.left, W.top], [W.right, W.top], [W.left, W.bottom], [W.right, W.bottom]];
      for (const ln of ['guide0', 'guide1']) {
        const e = node(ln), M = e.getScreenCTM();
        if (eff(e) < 0.05) continue;
        const p1 = new DOMPoint(+e.getAttribute('x1'), +e.getAttribute('y1')).matrixTransform(M), p2 = new DOMPoint(+e.getAttribute('x2'), +e.getAttribute('y2')).matrixTransform(M);
        const near = q => corners.some(([cx, cy]) => Math.hypot(q.x - cx, q.y - cy) < 3);
        if (!near(p1) || !near(p2)) out.push(tag + ' u=' + u.toFixed(2) + ': ' + ln + ' not anchored to the source frame and the lens');
      }
    }
  }
  if (ctx.tv === 'all' && !texts) out.push(tag + ': no lens text found (vacuous)');
  return 'lens texts checked ' + texts;
`);

// Return sequence: the context is back at rest (no shift) and the lens is gone before any stepped-out text (record,
// caption, notes, trace, key, marker label) is visible again; the scene tag's value only returns once the lens is gone.
sweep('return sequence (rendered, 60 fps)', `
  const node = n => svg.querySelector('[data-node="' + n + '"]');
  const frames = Math.round(x.durationMs / 1000 * 60);
  for (let f = Math.floor(frames * 0.74); f <= frames; f++) {
    x.renderFrame(f, {fps: 60});
    const s = x.getState({bounds: false}).semantic;
    const lensVis = eff(node('lz-win')) > 0.05;
    const moving = Math.abs(s.shift) > 0.5 || s.back < 0.999;
    const rec = node('rec-g');
    const texts = [...svg.querySelectorAll('[data-node^="band-"], [data-node="mlabel"]'), ...(node('cam').contains(rec) ? [] : [rec])].filter(e => eff(e) >= 0.15);
    if ((lensVis || moving) && texts.length) out.push(tag + ' frame ' + f + ': ' + texts.map(e => e.getAttribute('data-node')).join(',') + ' visible while the lens is open or the context still moves');
    if (lensVis && s.ctxValues > 0) out.push(tag + ' frame ' + f + ': scene tag value back while the lens is still open');
  }
`);

coldCreate(ID);

// Rendered fill at rest and at the hold (reviewer, first review 2026-09-27): the drawn scene reaches >= 0.71 of the frame
// in the stacking direction — its bottom edge in tall/square boxes, its width in wide boxes — labels shown and hidden.
const visLeaves = `const eff = e => { let o = 1; for (let q = e; q && q !== svg; q = q.parentNode) { const a = q.getAttribute && q.getAttribute('opacity'); if (a !== null && a !== undefined) o *= parseFloat(a); } return o; };
  const sc = svg.querySelector('[data-layer="scene"]');
  const clipAnc = e => e.closest('[clip-path]');
  const boxes = [...sc.querySelectorAll('path, rect, circle, ellipse, text, line')].filter(e => !e.closest('defs') && eff(e) >= 0.3).map(e => { let b = e.getBoundingClientRect(); const c = clipAnc(e); if (c) { const cb = c.getBoundingClientRect(); const zz = e.closest('[data-node="lz"]'); if (zz) { const w = zz.querySelector('[data-node="lz-win"]').getBoundingClientRect(); b = {left: Math.max(b.left, w.left), right: Math.min(b.right, w.right), top: Math.max(b.top, w.top), bottom: Math.min(b.bottom, w.bottom), width: 1}; } } return b; }).filter(b => b.right - b.left > 0.5 && b.bottom - b.top > 0.5);`;
ratioChecks(ID, 'rest and hold fill the frame (rendered)', [
  {at: [0.1, 1], dom: `(() => { ${visLeaves} const vb = svg.viewBox.baseVal, m = svg.getScreenCTM(); const FW = vb.width * Math.abs(m.a), FH = vb.height * Math.abs(m.d); const top = m.f, left = m.e;
    const bottom = Math.max(...boxes.map(b => b.bottom)), l = Math.min(...boxes.map(b => b.left)), r0 = Math.max(...boxes.map(b => b.right));
    return FW > FH * 1.2 ? (r0 - l) / FW >= 0.71 : (bottom - top) / FH >= 0.71; })()`, label: 'the scene reaches >= 0.71 of the frame in the stacking direction at rest and at the hold'},
]);

// Rendered, 60 fps over the isolate and return transitions: the longest run of frames in which the drawn content's
// union box covers less than half the frame lasts <= 200 ms (no transition leaves the frame mostly blank).
sweep('no half-blank transition longer than 200 ms (rendered, 60 fps)', `
  ${visLeaves.replace(/\n/g, ' ')}
  return 'n/a';
`.replace("return 'n/a';", `
  const fps = 60, frames = Math.round(x.durationMs / 1000 * fps);
  let run = 0, worst = 0, worstAt = null;
  for (let f = 0; f <= frames; f++) {
    const u = f / frames;
    if (!((u >= 0.17 && u <= 0.34) || (u >= 0.73 && u <= 0.9))) { run = 0; continue; }
    x.renderFrame(f, {fps});
    ${visLeaves.replace(/\n/g, ' ')}
    const vb = svg.viewBox.baseVal, m = svg.getScreenCTM(); const FW = vb.width * Math.abs(m.a), FH = vb.height * Math.abs(m.d);
    const l = Math.min(...boxes.map(b => b.left)), r0 = Math.max(...boxes.map(b => b.right)), t = Math.min(...boxes.map(b => b.top)), bb = Math.max(...boxes.map(b => b.bottom));
    // share of the frame spanned in the stacking direction (width in wide boxes, height otherwise)
    const cov = FW > FH * 1.2 ? (r0 - l) / FW : (bb - t) / FH;
    if (cov < 0.5) { run++; if (run > worst) { worst = run; worstAt = u; } } else run = 0;
  }
  const ms = worst * 1000 / fps;
  if (ms > 200) out.push(tag + ': ' + Math.round(ms) + ' ms with more than half the frame blank (ending u=' + worstAt.toFixed(3) + ')');
  return 'longest half-blank run ' + Math.round(ms) + ' ms' + (worstAt !== null ? ' (ending u=' + worstAt.toFixed(3) + ')' : '');
`));

// Rendered subject size at rest (coordinator decision 2026-09-27): the object is >= 0.20 of the frame height in every
// preset × ratio × labels state.
ratioChecks(ID, 'the object at rest is >= 0.20 of the frame height (rendered)', [
  {at: [0.1, 1], dom: "(() => { const m = svg.getScreenCTM(), vb = svg.viewBox.baseVal; const FH = vb.height * Math.abs(m.d); return svg.querySelector('[data-node=o-body]').getBoundingClientRect().height / FH >= 0.2; })()", label: 'object height >= 0.20 of the frame'},
]);
