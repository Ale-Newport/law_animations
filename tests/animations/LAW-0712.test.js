// LAW-0712 — Alcance del daño · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens content is a second copy of the zone —
// plate, rings, markers, slots, consequences, string and tag — drawn in the context's coordinates and posed from the
// same state every frame; it appears exactly over its source and grows from there), the change is local (only the
// tag's value and, AFTER the new value is legible, its dependent geometry — the focus consequence moving between the
// ring slots, its string following) and seeking back restores the old datum exactly.
// Windows (LAW-0712.js W_SIDE / W_STACK, as LAW-0708): texts step out 0.195–0.21 · context slides / steps back
// 0.195–0.222 · scene tag value out 0.212–0.222 (stack 0.203–0.209) · lens opens 0.2225–0.31 (stack –0.26) · strike
// 0.45–0.49 · old value out 0.52–0.545 · new value in 0.555–0.58 · dependent geometry 0.60–0.66 · new value still until
// 0.76 · lens closes 0.76–0.80 · tag value back 0.80–0.815 · texts back · Δ marker · trace · key by 0.90.
// Lens checklist (AUTHORING line 109 + SESSION_HANDOFF decisions LENS MAGNIFICATION MARGIN, VISIBLE CONTEXT CANONICAL
// MEASURE, LENS FILL METRIC, LENS TEXT COVERAGE 1:1 LIMIT — not invoked, PORTRAIT STACKED-LENS SPAN): one legible copy;
// new value legible before any dependent change, no-value <= 180 ms; magnification >= 1.5 against REST at sized hosts;
// smaller side >= 0.35; visible context >= 0.45; content fill >= 0.40; text coverage >= 0.30; a non-text change inside
// the lens with labels hidden; source frame clear of text; nothing cut by the rim; hand-overs <= 180 ms; the NEW state
// in the context as soon as the lens closes.
// Legal (causation-08 brief, VERY high risk): the rings are ONLY a supplied grouping — no remoteness or scope doctrine,
// no liability, quantum, outcome or jurisdiction; both rings, markers and slot pads have identical stroke, colour and
// weight; "to be examined" in words only; objects only, nobody is injured; ●/◆ at equal weight.
// Brief customizable fields: none omitted (events, causalLinks, alternatives, losses + the inspect fields); 'origin',
// 'focusItem' and 'focusRings' added.
// coordinator decision (standing stress-cap rule, docs/AUTHORING.md item 20; subject >= 0.20 of the frame height,
// causation-05 LAW-0700 decision in production/SESSION_HANDOFF.md): the long-labels-stress COUNTS are capped. True
// driver: the 1:1 box (field >= 0.20 of the frame height with the lens >= 1.5×, >= 0.35 of the short side and text-
// dominated, text >= 16 px). Rendered at 1080p (2026-10-05; pre-cap copy
// production/scratch/causation-08/LAW-0712.stress-precap.json): full counts (6 consequences, 2 accounts, 1 link, 2
// grouping items) → 1:1 fallback k 0.625, lens 0.222 of the short side; 4 consequences → field 0.174; 3 → 0.229; no
// accounts → 0.174; 4 consequences + 1 account + 1 grouping item → 0.229. Capped to 4 / 1 / 1 (baseline 3 / 0 / 1);
// link kept; details in LAW-0712.presets.json.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {textSizeOverTime, CARDS_CLEAR, IN_FRAME, renderedTextFloor, coldCreate, restHoldFill, thinContent, subjectHeight, sweep, equalWeight, bannedDataTest, bannedRenderTest, jurisdictionTest, stressLongerTest, lineBreakTest, noEnglishTest, noTokenTest} from './alcance-dano-checks.js';

const ID = 'LAW-0712';
const P = name => presetsFor(ID).find(q => q.name === name).params;

contractSuite(ID, {
  continuity: [],
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && !s.lensOn && s.datum === 'before' && s.tagValue === 'before' && !s.markerVisible && s.ctxValues === 1 && s.ring === s.rings[0]", label: 'context: the produced state with the old datum; no lens, no marker'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.datum === 'before' && s.zoom >= 1.5 && s.ctxValues === 0 && s.textsOut", label: 'isolate: an enlarged copy (>= 1.5×) holds the datum; the scene tag is blank; texts stepped out'},
    {at: 0.5, fn: "s.strike === 1 && s.datum === 'changing' && s.geo === 0", label: 'the old value is struck before anything changes'},
    {at: 0.59, fn: "s.datum === 'after' && s.lensValue === 'after' && s.geo === 0 && s.ring === s.rings[0]", label: 'the new value is legible in the lens BEFORE any dependent geometry changes'},
    {at: 0.67, fn: "s.datum === 'after' && s.tagValue === 'after' && s.lensOpen === 1 && s.ring === s.rings[1]", label: 'then only its dependent geometry follows'},
    {at: 1, fn: "s.lensOpen === 0 && !s.lensOn && s.tagValue === 'after' && s.markerVisible && s.keyShown && s.ctxValues === 1 && s.shift === 0 && s.back === 1", label: 'return: changed tag in the context, Δ marker, key'},
    {at: 0.34, fn: "s.datum === 'before' && s.strike === 0 && s.tagValue === 'before' && s.ring === s.rings[0]", label: 'seeking back restores the previous datum exactly'},
    {at: 1, params: P('contrast-or-alternative'), fn: "s.tagValue === 'after' && s.rings[0] === 'inner' && s.rings[1] === 'outer' && s.ring === 'outer' && s.markerVisible && s.focusItem === 1", label: 'alternative: the vase moves from the inner slot to the outer slot'},
    {at: 0.67, params: {textVisibility: 'none'}, fn: "s.lensOpen === 1 && s.ring === s.rings[1]", label: 'labels hidden: the same isolation and change'},
  ],
});

ratioChecks(ID, 'lens checklist (semantic)', [
  {at: [0.34, 0.4, 0.5, 0.6, 0.7, 0.75], fn: 's.zoom >= 1.5 && s.lensOpen === 1 && s.ctxValues === 0', label: 'lens >= 1.5× open; the scene tag holds no value while the lens holds it'},
  {at: times(0.6, 0.755, 0.005), fn: "s.datum === 'after' && s.lensOpen === 1", label: 'the new value is still in the open lens for >= 400 ms (0.595–0.76)'},
  {at: [1], fn: 's.layout.k === 1 && !s.layout.fallback && s.markerVisible', label: 'the layout fits without a fallback scale'},
  {at: [0.4], fn: 's.lensMinSide >= 0.35 && s.lensFill >= 0.4', label: 'the lens is >= 0.35 of the short side and its content fills >= 0.40 of it (LENS FILL METRIC)'},
  {at: [0.801, 0.82, 1], fn: 's.ring === s.rings[1] && s.lensOpen === 0', label: 'the NEW state stands in the context as soon as the lens has closed'},
]);

ratioChecks(ID, 'rendered: inside the frame, no card over foreign text, marker clear', [
  {at: [0, 0.4, 0.62, 1], dom: IN_FRAME, label: 'every drawn piece lies inside the frame'},
  {at: [0.1, 1], dom: CARDS_CLEAR, tv: ['all'], label: 'no chip or card covers a text it does not own'},
  {at: [1], dom: "(() => { const m = svg.querySelector('[data-node=\"marker\"]').getBoundingClientRect(); const vis = e => { for (let q = e; q && q !== svg; q = q.parentElement) { const o = q.getAttribute('opacity'); if (o !== null && parseFloat(o) < 0.05) return false; } return true; }; return [...svg.querySelectorAll('text')].filter(t => vis(t) && !t.closest('[data-layer=\"content-notice\"]')).every(t => { const b = t.getBoundingClientRect(); return b.width < 0.5 || b.right <= m.left + 1 || b.left >= m.right - 1 || b.bottom <= m.top + 1 || b.top >= m.bottom - 1; }); })()", label: 'the Δ marker covers no text'},
  {at: [0.3, 1], dom: "![...svg.querySelector('[data-layer=\"scene\"]').querySelectorAll('[fill], [stroke]')].some(e => ['#c8553d', '#f3d9cf'].includes((e.getAttribute('stroke') || '').toLowerCase()) || ['#c8553d', '#f3d9cf'].includes((e.getAttribute('fill') || '').toLowerCase()))", label: 'no element uses the red accent (no alarm styling)'},
  {at: [0.1, 1], dom: equalWeight(['flagA', 'flagB']), label: 'the ● and ◆ ring markers have identical weight, both solid'},
]);

suppliedTextSuite(ID, {
  fields: "return [p.origin.name, ...p.events.map(e => e.label), ...p.events.map(e => e.time), ...p.losses.map(l => l.label), ...p.alternatives.map(a => a.label), ...p.causalLinks.map(l => l.label), p.afterValue, p.contextLabels.context, p.contextLabels.marker]",
  content: "return [...p.events.map(e => e.label), ...p.losses.map(l => l.label), p.afterValue]",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión']",
});

// baselines >= 19.5 px at every sampled u, including the lens copy while it grows and shrinks (step 0.0025 = 20 ms)
renderedTextFloor(ID, ['default', 'baseline-illustrative', 'baseline-es'], 19.5, 0.0025);
textSizeOverTime(ID, 0.004);


// Lens size and magnification, measured on the RENDERED DOM: the open lens' SMALLER side is >= 0.35 of the frame's
// short side, and the lens copy of the tag is >= 1.5× the scene tag's rendered size at REST (u = 0.1).
// (LENS MAGNIFICATION MARGIN: the hard floor is 1.5× at every host size — the sized-host test below.)
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
    if (ms < 0.35 - 0.002) out.push(tag + ' u=' + u + ': lens smaller side ' + ms.toFixed(3) + ' of the frame short side');
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
    // hand-over gap: while handing the datum over (open 0.19–0.30, return 0.74–0.86) neither copy is legible for <= 180 ms
    const uu = f / frames;
    if ((uu >= 0.19 && uu <= 0.3) || (uu >= 0.74 && uu <= 0.86)) { if (a < 0.15 && b < 0.15) { gapRun++; worstGap = Math.max(worstGap, gapRun); } else gapRun = 0; } else gapRun = 0;
  }
  if (ctx.tv === 'all' && !seen) out.push(tag + ': the lens copy never shows the value (vacuous)');
  const gapMs = worstGap * 1000 / 60;
  if (gapMs > 180) out.push(tag + ': no legible copy of the datum for ' + Math.round(gapMs) + ' ms during a hand-over');
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

coldCreate(ID, 800);
restHoldFill(ID, [0.1, 1]);
thinContent(ID);
// the subject: the field (plate, rings, markers, consequences)
subjectHeight(ID, [['zfield']], [0.1, 1]);


// ---- causation-07 lens checklist additions ------------------------------------------------------------------------

// The substitution at 60 fps: from the strike to the close, no value is legible in the lens (semantic lensValue null) for
// <= 180 ms, and the new value is legible before the dependent geometry starts moving.
sweep(ID, 'no-value gap <= 180 ms; new value legible before the dependent geometry (60 fps)', `
  const frames = Math.round(x.durationMs / 1000 * 60);
  let run = 0, worst = 0, firstGeo = null, firstAfter = null;
  for (let f = 0; f <= frames; f++) {
    const u = f / frames;
    if (u < 0.45 || u > 0.76) continue;
    x.renderFrame(f, {fps: 60});
    const s = x.getState({bounds: false}).semantic;
    if (s.lensValue === null) { run++; worst = Math.max(worst, run); } else run = 0;
    if (firstGeo === null && s.geo > 0) firstGeo = u;
    if (firstAfter === null && s.lensValue === 'after') firstAfter = u;
  }
  const ms = worst * 1000 / 60;
  if (ms > 180) out.push(tag + ': no legible value in the lens for ' + Math.round(ms) + ' ms');
  if (firstAfter === null || firstGeo === null || firstAfter >= firstGeo) out.push(tag + ': new value at ' + firstAfter + ', geometry at ' + firstGeo);
  return 'longest no-value ' + Math.round(ms) + ' ms; new value ' + (firstAfter || 0).toFixed(3) + ' before geometry ' + (firstGeo || 0).toFixed(3);
`, {tvs: ['all']});

// LENS MAGNIFICATION MARGIN (coordinator decision 2026-10-04, LAW-0300): >= 1.5× against REST at every host size —
// the lens copy of the tag (u 0.4) over the scene tag at rest (u 0.1), full-size elements and sized hosts (a third of
// the size), at three viewports. Every preset (es defaults too) × ratio, labels shown and hidden (labels hidden: the
// tag card itself).
for (const [vw, vh] of [[1280, 800], [800, 600], [1400, 1000]]) {
  test(`${ID}: lens magnification >= 1.5 against rest at sized hosts (viewport ${vw}×${vh})`, async ({page}) => {
    test.setTimeout(600000);
    await page.setViewportSize({width: vw, height: vh});
    await page.goto('/tests/harness/host.html');
    await page.waitForFunction(() => document.body.dataset.ready === '1');
    const presets = [{name: 'default', params: {}}, {name: 'default-es', params: {locale: 'es'}}, ...presetsFor(ID)];
    const out = await page.evaluate(async ([id, presets]) => {
      const def = await window.__lib.load(id);
      const fails = [], rows = [];
      for (const pr of presets) for (const tv of ['all', 'none']) for (const [w, h] of [[1920, 1080], [1080, 1920], [1080, 1080]]) for (const sized of [false, true]) {
        const el = document.createElement('div');
        if (sized) { el.style.width = `${w / 3}px`; el.style.height = `${h / 3}px`; }
        document.getElementById('slots').appendChild(el);
        const x = def.create(el, {width: w, height: h, params: {...pr.params, textVisibility: tv}});
        await x.ready;
        const q = n => x.element.querySelector(`[data-node="${n}"]`);
        x.seek(0.1 * x.durationMs);
        const a = q('tg').getBoundingClientRect();
        x.seek(0.4 * x.durationMs);
        const b = q('lzt').getBoundingClientRect();
        const m = Math.min(b.width / a.width, b.height / a.height);
        rows.push(`${pr.name} ${tv} ${w}x${h}${sized ? ' sized' : ''} ${m.toFixed(3)}`);
        if (!(m >= 1.5)) fails.push(`${pr.name} ${tv} ${w}x${h}${sized ? ' sized' : ''}: ${m.toFixed(3)}`);
        x.destroy();
        el.remove();
      }
      return {fails, rows};
    }, [ID, presets]);
    console.log(out.rows.join(' | '));
    expect(out.fails).toEqual([]);
  });
}

// VISIBLE CONTEXT CANONICAL MEASURE (coordinator decision 2026-10-04): while the lens is open (u 0.3–0.7) the visible
// stage — the context's drawn leaves not wholly under the lens, backdrop (floor) included — spans >= 0.45 of the frame:
// across the width beside a side lens; in either dimension above a stacked lens (PORTRAIT STACKED-LENS SPAN, 2026-10-05).
sweep(ID, 'visible context >= 0.45 of the frame while the lens is open (rendered)', `
  const sr = svg.getBoundingClientRect();
  const arr = x.getState({bounds: false}).semantic.layout.arr;
  let mn = 9;
  for (const u of [0.3, 0.4, 0.5, 0.6, 0.7]) {
    x.seek(u * x.durationMs);
    const B = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const e of svg.querySelectorAll('[data-node="cam"] path, [data-node="cam"] rect, [data-node="cam"] circle, [data-node="cam"] text, [data-node="cam"] line')) {
      if (e.closest('defs') || eff(e) < 0.05) continue;
      const b = e.getBoundingClientRect();
      if (b.width < 0.5 && b.height < 0.5) continue;
      if (b.left >= B.left && b.right <= B.right && b.top >= B.top && b.bottom <= B.bottom) continue;
      x0 = Math.min(x0, b.left); x1 = Math.max(x1, b.right); y0 = Math.min(y0, b.top); y1 = Math.max(y1, b.bottom);
    }
    const cw = (x1 - x0) / sr.width, ch = (y1 - y0) / sr.height;
    mn = Math.min(mn, arr === 'side' ? cw : Math.max(cw, ch));
  }
  if (!(mn >= 0.45)) out.push(tag + ' (' + arr + '): visible context ' + mn.toFixed(3));
  return 'visible context ' + mn.toFixed(3);
`, {tvs: ['all', 'key', 'none']});

// Text coverage (coordinator target, LENS FILL METRIC 2026-10-05): with labels shown, the visible TEXT of the open lens
// copy covers >= 0.30 of its window (24 × 24 grid of cell centres under text boxes), u 0.30–0.72 outside the value's
// hand-over (0.52–0.58, where the old value lifts away and the new one fades in; checked by the 180 ms tests).
sweep(ID, 'lens text coverage >= 0.30 with labels shown (rendered)', `
  let mn = 1;
  for (const k of [30, 36, 42, 48, 60, 66, 72]) {
    x.seek((k / 100) * x.durationMs);
    const B = svg.querySelector('[data-node="lz-border"]').getBoundingClientRect();
    const ts = [...svg.querySelectorAll('[data-node="lz-content"] text')].filter(t => eff(t) >= 0.3 && (t.textContent || '').trim()).map(t => t.getBoundingClientRect());
    let c = 0;
    const N = 24;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const cx = B.left + (i + 0.5) * B.width / N, cy = B.top + (j + 0.5) * B.height / N; if (ts.some(q => cx >= q.left && cx <= q.right && cy >= q.top && cy <= q.bottom)) c++; }
    mn = Math.min(mn, c / N / N);
  }
  if (mn < 0.3) out.push(tag + ': lens text coverage ' + mn.toFixed(3));
  return 'lens text coverage ' + mn.toFixed(3);
`, {tvs: ['all']});

// Labels hidden: a NON-TEXT change happens inside the open lens — the lens copy of the focus consequence's string end
// (its foot on the consequence) moves between u 0.58 and 0.70 and stays inside the lens window.
sweep(ID, 'labels hidden: a non-text change inside the lens (rendered)', `
  const node = n => svg.querySelector('[data-node="' + n + '"]');
  x.seek(0.58 * x.durationMs);
  // (the string's end on the consequence: its start when the tag hangs beside the field, its end when above)
  const ends = () => { const e = node('lzs-string'); const L = e.getTotalLength(); return [0, L].map(l => { const q = e.getPointAtLength(l); return new DOMPoint(q.x, q.y).matrixTransform(e.getScreenCTM()); }); };
  const e0 = ends();
  x.seek(0.7 * x.durationMs);
  const e1 = ends(), W = node('lz-border').getBoundingClientRect();
  const k = Math.abs(e0[0].x - e1[0].x) > Math.abs(e0[1].x - e1[1].x) ? 0 : 1;
  const a = e0[k], b = e1[k];
  const moved = Math.abs(a.x - b.x);
  if (moved < 4) out.push(tag + ': the lens copy shows no change (' + moved.toFixed(1) + ' px)');
  for (const q of [a, b]) if (q.x < W.left - 1 || q.x > W.right + 1 || q.y < W.top - 1 || q.y > W.bottom + 1) out.push(tag + ': the moving consequence leaves the lens window');
  return 'consequence moved ' + moved.toFixed(1) + ' px';
`, {tvs: ['none']});

// The source frame is clear: while the guides show, the source frame's outline crosses no visible context text.
sweep(ID, 'source frame crosses no text (rendered)', `
  for (const u of [0.32, 0.5, 0.7]) {
    x.seek(u * x.durationMs);
    const sf = svg.querySelector('[data-node="src-frame"]');
    if (eff(sf) < 0.05) continue;
    const S = sf.getBoundingClientRect();
    for (const t of svg.querySelectorAll('[data-node="cam"] text')) {
      if (eff(t) < 0.15 || !(t.textContent || '').trim()) continue;
      const b = t.getBoundingClientRect();
      const inside = b.left >= S.left - 1 && b.right <= S.right + 1 && b.top >= S.top - 1 && b.bottom <= S.bottom + 1;
      const outside = b.right <= S.left + 1 || b.left >= S.right - 1 || b.bottom <= S.top + 1 || b.top >= S.bottom - 1;
      if (!inside && !outside) out.push(tag + ' u=' + u + ': source frame cuts "' + t.textContent.slice(0, 20) + '"');
    }
  }
`, {tvs: ['all']});

noTokenTest(ID, ['zfield'], [0.1, 1]);
// the changed consequence stays a real object (>= 40 px tall at 1080p)
noTokenTest(ID, ['item'], [0.1, 1], {min: 40, minStress: 40});
bannedDataTest(ID);
bannedRenderTest(ID);
jurisdictionTest(ID);
stressLongerTest(ID);
lineBreakTest(ID);
noEnglishTest(ID);
