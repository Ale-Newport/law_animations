// LAW-0704 — Pérdida económica · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a second copy of the zone —
// column, tokens, arms, bracket, string and tag — drawn in the context's coordinates and posed from the same state every
// frame; it appears exactly over its source and grows from there), the change is local (only the tag's value and its
// dependent geometry — the ◆ level, the band, the bracket and the tokens between the levels — change) and seeking back
// restores the old datum exactly.
// Windows (LAW-0704.js W_SIDE / W_STACK, as LAW-0700): texts step out 0.195–0.21 · context slides / steps back
// 0.195–0.222 · scene tag value out 0.212–0.222 (stack 0.20–0.208) · lens opens 0.2225–0.31 (stack –0.27) · strike
// 0.45–0.49 · old value out 0.52–0.555 · geometry 0.52–0.58 · new value in 0.56–0.595 (still until 0.76) · lens closes
// 0.76–0.80 · tag value back 0.80–0.815 · texts back · Δ marker · trace · key by 0.90.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; subject >= 0.20 of the frame height,
// causation-05 LAW-0700 decision in production/SESSION_HANDOFF.md): the long-labels-stress COUNTS are capped; true
// driver, fallbacks tried and rendered before/after numbers in LAW-0704.presets.json.
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, sweep} from './perdida-economica-checks.js';

const ID = 'LAW-0704';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && !s.lensOn && s.datum === 'before' && s.tagValue === 'before' && !s.markerVisible && s.ctxValues === 1 && s.gapTokens === s.gaps[0]", label: 'context: the produced state with the old datum; no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && s.ctxValues === 0 && s.textsOut", label: 'isolate: an enlarged copy (>= 1.5×) holds the datum; the scene tag is blank; texts stepped out'},
    {at: 0.5, fn: "s.strike === 1 && s.datum === 'changing' && s.geo === 0", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.tagValue === 'after' && s.lensOpen === 1 && s.gapTokens === s.gaps[1]", label: 'the new value and only its dependent geometry'},
    {at: 1, fn: "s.lensOpen === 0 && !s.lensOn && s.tagValue === 'after' && s.markerVisible && s.keyShown && s.ctxValues === 1 && s.shift === 0 && s.back === 1", label: 'return: changed tag in the context, Δ marker, key'},
    {at: 0.34, fn: "s.datum === 'before' && s.strike === 0 && s.tagValue === 'before' && s.gapTokens === s.gaps[0]", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.tagValue === 'after' && s.gaps[1] > s.gaps[0] && s.gapTokens === s.gaps[1] && s.markerVisible", label: 'alternative: the stated difference grows; tokens lift out'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.gapTokens === s.gaps[1]", label: 'labels hidden: the same isolation and change'},
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
  {at: [0.3, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent (no alarm styling)'},
]);

suppliedTextSuite(ID, {
  fields: "return [...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.afterValue, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.afterValue]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// baselines >= 19.5 px at every sampled u, including the lens copy while it grows and shrinks (step 0.0025 = 20 ms)
renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.0025);
textSizeOverTime(ID, 0.004);

ratioChecks(ID, 'baseline-es draws no English defaults', [
  {at: [0.1, 0.62, 1], tv: ['all'], presets: ['baseline-es'], dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Flow|record|Before|After|Changed|supplied|conclusion|units|fictional|Model)\\b/.test(t.textContent))", label: 'no English default text in baseline-es'},
]);

// Lens size and magnification, measured on the RENDERED DOM: the open lens' SMALLER side is >= 0.40 of the frame's
// short side, and the lens copy of the tag is >= 1.5× the scene tag's rendered size at REST (u = 0.1).
sweep(ID, 'lens size and magnification against rest (rendered)', `
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
sweep(ID, 'context >= 0.45 of the frame width; context + lens >= 80 % of the safe box (rendered)', `
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
sweep(ID, 'one copy of the datum at 60 fps (rendered)', `
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
sweep(ID, 'lens never blank; it starts exactly over its source (rendered)', `
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
sweep(ID, 'lens rim, datum inside, guides anchored (rendered)', `
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
sweep(ID, 'return sequence (rendered, 60 fps)', `
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
restHoldFill(ID, [0.1, 1]);
thinContent(ID);
// the subject: the balance column with its hopper, standing on its legs
subjectHeight(ID, [['column', 'hopper', 'legs']], [0.1, 1]);

// locale "es" with the default content (review 2026-09-27): the default events, stated difference and captions are
// drawn in Spanish too (fields left at their English default take their Spanish default)
ratioChecks(ID, 'locale es with default params draws no English', [
  {at: [0.1, 0.62, 1], tv: ['all'], presets: ['baseline-illustrative'], params: {locale: 'es'}, dom: "![...svg.querySelectorAll('text')].some(t => /\\b(Month|Shop|Supplier|Flow|record|Reference|Alleged|Stated|supplied|conclusion|units|fictional|Before|After|Changed|Only|Same|Hopper|gate|related)\\b/.test(t.textContent))", label: 'no English text with locale es and default params'},
]);
