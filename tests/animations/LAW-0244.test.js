// LAW-0244 — Requerimiento previo · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the stage at
// the SAME coordinates, zoomed from the inspected item), the change is localized (only the pocket's slip and
// the calendar glyph, or only the glyph's day) and seeking back restores the previous datum exactly.
// Windows (u): the context stays in place at full size throughout and dims in place while the lens is open ·
// lens opens 0.20–0.32 (window, copy text and the card's old value legible from u ≈ 0.256) · strike 0.44–0.49 · lens geometry 0.48–0.58 · new value 0.555–0.585
// (still to 0.66) · text out 0.66–0.68 · lens closes 0.675–0.72 · context change 0.74–0.80 · outcome tag 0.74–0.84 ·
// marker and note 0.82–0.88 (hold from 0.88).
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, textSizeOverTime, baselineTextAtHold, HANDS_OFF_HEADS, HEADS_OFF_TEXT} from './requerimiento-previo-checks.js';

const ID = 'LAW-0244';
const ALT = presetsFor(ID).find(q => q.name === 'contrast-or-alternative').params;

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.markerShown === 0 && s.slipInPocketCtx", label: 'context: the state produced by the action, old datum, nothing marked'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.zoom >= 1.5 && s.oldShown === 1 && s.datum === 'before' && s.sourceInContext && s.lensClearOfFaces && s.contextScale === 1", label: 'isolate: a real 1.5×+ lens over the dimmed full-size context, old value shown'},
    {at: 0.47, fn: "s.strike > 0 && s.datum === 'before' && s.contextDatum === 'before'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.newShown === 1 && s.strike === 1 && s.contextDatum === 'before' && !s.slipInPocketLens && s.slipInPocketCtx", label: 'substitute inside the lens only: slip gone in the copy, context unchanged'},
    {at: 0.74, fn: 's.lensOpen === 0', label: 'the lens has closed before the context changes'},
    {at: 1, fn: "s.contextDatum === 'after' && !s.slipInPocketCtx && s.markerShown === 1 && s.noteShown === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear", label: 'return: context updated, Δ marker and before/after note, nothing cut'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.strike === 0 && s.newShown === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: ALT, fn: "s.focusTarget === 'replyDay' && s.markIdxCtx === 3 && s.slipInPocketCtx && s.contextDatum === 'after'", label: 'alternative: the reply day moves (Day 3 → Day 4); the slip stays'},
    {at: 0.3, params: ALT, fn: 's.markIdxCtx === 2', label: 'alternative seeking back: the glyph is on Day 3 again'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.lensOpen === 1", label: 'labels hidden: the same isolation and substitution'},
  ],
});

suppliedTextSuite(ID, {
  fields: "return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.letter.ref, p.documents.letter.title, p.dates.sent, ...p.dates.window, p.stages.sent, p.stages.delivered, p.labels.calendar, p.labels.inTray, p.labels.replyTray, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

// coordinator decision 2026-09-26 (standing stress rule, AUTHORING item 20): the long-labels-stress lengths of this item are
// capped to the longest values found to fit every ratio at >= 16 px without scaling (see the preset description in
// LAW-0244.presets.json for the capped fields and the measurements). No floor or limit in this file is relaxed.
// rendered: the open lens window's short side over the frame's short side, and the context scene's width over the
// frame's width (the frame = the viewBox as drawn: the slot may letterbox it)
const LENS_LARGE = `(() => {
  const vb = svg.viewBox.baseVal, m = svg.getScreenCTM();
  const p0 = new DOMPoint(vb.x, vb.y).matrixTransform(m), p1 = new DOMPoint(vb.x + vb.width, vb.y + vb.height).matrixTransform(m);
  const FW = p1.x - p0.x, FH = p1.y - p0.y;
  const w = svg.querySelector('[data-node="lens-bg"]').getBoundingClientRect();
  const c = svg.querySelector('[data-node="ctx-stage"]').getBoundingClientRect();
  return Math.min(w.width, w.height) >= 0.35 * Math.min(FW, FH) && c.width >= 0.45 * FW;
})()`;
// rendered: before the substitution beat no stage state reads as the after value — the context pocket still holds
// the slip (drawn, at least as a blank placeholder) and its empty outline is not shown; the glyph is not on the after day
const NO_EARLY_AFTER = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const q = n => svg.querySelector('[data-node="' + n + '"]');
  const slip = q('st-slipout'), empty = q('st-pkempty');
  return !slip || (eff(slip) >= 0.3 && (!empty || eff(empty) < 0.05));
})()`;
ratioChecks(ID, 'lens checklist, faces, frame, people', [
  {at: times(0.2, 0.74, 0.02), fn: 's.lensClearOfFaces && s.contextScale === 1', label: 'the lens never covers a face; the context stays in place at full size (dimmed while the lens is open)'},
  {at: [0.34, 0.45, 0.55, 0.64], dom: LENS_LARGE, label: 'RENDERED: the open lens window >= 35 % of the frame short side; the context scene >= 45 % of the frame width'},
  {at: [0.34, 0.45, 0.55, 0.64], fn: 's.zoom >= 1.5 && s.sourceInContext && s.cardInWindow', label: 'zoom >= 1.5×, source in the context, the datum card wholly in the window'},
  {at: [0.25, 0.34, 0.5, 0.64], fn: 's.guidesOnSource', label: 'guides start on the inspected item'},
  {at: [0.59, 0.62, 0.65], tv: ['all'], fn: 's.newShown === 1 && s.lensOpen === 1', label: 'the new value is still for >= 400 ms'},
  {at: [1], fn: 's.markerClearOfFaces && s.markerShown === 1', label: 'the Δ marker is clear of faces'},
  {at: [0, 0.3, 0.5, 0.65, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or lens covers a head'},
  {at: [0, 0.4, 0.62, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [0, 0.25, 0.4, 0.6, 0.72, 1], dom: IN_FRAME, label: 'nothing leaves the frame'},
  {at: [1], dom: headsAtLeast(36), label: 'people are readable in the context (head >= 36 px at 1080p)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-']), label: 'tags beside their elements (leader <= 40 px), leaders cross no text'},
  {at: [0, 0.4, 0.6, 1], dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
  {at: [1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers'},
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02: text, props, lens)'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
  {at: times(0, 0.47, 0.01), dom: NO_EARLY_AFTER, label: 'RENDERED: before the substitution beat the context never shows the after value (slip still in the pocket, no empty outline)'},
  {at: times(0, 0.47, 0.01), fn: "s.contextDatum === 'before' && s.datum === 'before' && (s.focusTarget === 'replyDay' || s.slipInPocketCtx)", label: 'before the substitution beat: the old datum in the context and in the lens'},
]);

// Rendered, every 20 ms over the lens phase in every preset × ratio × labels: (1) a bare lens card (window visible,
// copy under half opacity) never lasts more than 200 ms; (2) every text in the enlarged copy is wholly inside the
// window or wholly outside it (no line cut by the rim); (3) the guides cross no face and no text.
test(`${ID}: lens — bare card ≤ 200 ms, no text cut by the rim, guides clear (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(400000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor(ID);
  const res = await page.evaluate(async ([ps]) => {
    const def = await window.__lib.load('LAW-0244');
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
    const out = [];
    for (const [w, hh] of [[1920, 1080], [1080, 1080], [1080, 1920]]) for (const pr of ps) for (const tv of ['all', 'none']) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: hh, instanceId: 'lc', params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = el.querySelector('svg');
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      let run = 0, worst = 0; const cut = [], cross = [];
      const stepU = 20 / x.durationMs;
      for (let u = 0.18; u <= 0.74 + 1e-9; u += stepU) {
        x.seek(u * x.durationMs);
        const bg = q('lens-bg');
        const card = eff(bg) > 0.05 && bg.getBoundingClientRect().width > 2;
        const copy = eff(q('lens-content'));
        if (card && copy < 0.5) { run += 20; worst = Math.max(worst, run); } else run = 0;
        if (!card) continue;
        // (a rect inside <clipPath> has no rendered box of its own: its attributes are mapped to the screen)
        const cp = q('lens-cliprect'), cm = cp.getScreenCTM();
        const c0 = new DOMPoint(+cp.getAttribute('x'), +cp.getAttribute('y')).matrixTransform(cm);
        const c1 = new DOMPoint(+cp.getAttribute('x') + +cp.getAttribute('width'), +cp.getAttribute('y') + +cp.getAttribute('height')).matrixTransform(cm);
        const cr = {left: c0.x, top: c0.y, right: c1.x, bottom: c1.y};
        for (const t of q('lens-content').querySelectorAll('text')) {
          if (eff(t) < 0.05 || !t.textContent.trim()) continue;
          for (const ts of t.querySelectorAll('tspan').length ? t.querySelectorAll('tspan') : [t]) {
            const b = ts.getBoundingClientRect();
            if (b.width < 0.5) continue;
            const over = b.left < cr.right && b.right > cr.left && b.top < cr.bottom && b.bottom > cr.top;
            const inside = b.left >= cr.left - 1 && b.right <= cr.right + 1 && b.top >= cr.top - 1 && b.bottom <= cr.bottom + 1;
            if (over && !inside) cut.push(`${u.toFixed(2)}:${ts.textContent.slice(0, 16)}`);
          }
        }
        const heads = [...svg.querySelectorAll('[data-node$="-pa-head"], [data-node$="-pb-head"]')].filter(e => !e.closest('[data-node="lens-content"]')).map(e => e.getBoundingClientRect());
        // texts of the inspected item itself (inside its outline) are where the guides start, not crossings
        const sr = q('lens-src').getBoundingClientRect();
        const within = b => b.left >= sr.left - 2 && b.right <= sr.right + 2 && b.top >= sr.top - 2 && b.bottom <= sr.bottom + 2;
        const texts = [...svg.querySelectorAll('text')].filter(t => eff(t) > 0.3 && t.textContent.trim() && !t.closest('[data-node="lens-win"]') && !t.closest('[data-layer="content-notice"]')).map(t => t.getBoundingClientRect()).filter(b => !within(b));
        for (const n of ['lens-coneA', 'lens-coneB']) {
          const l = q(n); if (eff(l) < 0.05) continue;
          const m = l.getScreenCTM();
          const A = new DOMPoint(+l.getAttribute('x1'), +l.getAttribute('y1')).matrixTransform(m), B = new DOMPoint(+l.getAttribute('x2'), +l.getAttribute('y2')).matrixTransform(m);
          for (let i = 2; i < 38; i++) {
            const p = {x: A.x + (B.x - A.x) * i / 40, y: A.y + (B.y - A.y) * i / 40};
            if ([...heads, ...texts].some(b => p.x > b.left && p.x < b.right && p.y > b.top && p.y < b.bottom)) { cross.push(`${u.toFixed(2)}:${n}`); break; }
          }
        }
      }
      out.push({k: `${pr.name} ${w}x${hh} ${tv}`, worst, cut: [...new Set(cut)].slice(0, 3), cross: [...new Set(cross)].slice(0, 3)});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets]);
  for (const r of res) {
    expect.soft(r.worst, `bare lens card run (ms) [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.cut, `lens copy text cut by the rim [${r.k}]`).toEqual([]);
    expect.soft(r.cross, `lens guides crossing a face or text [${r.k}]`).toEqual([]);
  }
});

// every visible text >= 16 px at every sampled u (coordinator rule, AUTHORING 'text size at every moment')
textSizeOverTime('LAW-0244', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0244')], test, expect});

// baseline presets, baseline-es included, keep every text >= 19.5 px at the hold in every ratio (coordinator 2026-09-26)
baselineTextAtHold('LAW-0244', {presets: [{name: 'default', params: {}}, ...presetsFor('LAW-0244')], test, expect});

// Rendered at 60 fps over the whole animation in every preset × ratio × labels state (AUTHORING lens checklist,
// LAW-0212 round 4 / LAW-0696): (1) the changed datum is shown in ONE place at a time — its context copy (the slip in
// the pocket, the calendar glyph, the outcome tag) and the lens's copy (the enlarged copy, the datum card) are never
// both at >= 0.15 opacity; (2) the open lens window's box intersects no visible context text (opacity >= 0.15).
test(`${ID}: one copy of the changed datum at a time, hand-over gaps <= 200 ms; the lens lies over no visible context text (rendered, 60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([ps]) => {
    const def = await window.__lib.load('LAW-0244');
    const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
    const out = [];
    for (const [w, hh] of [[1920, 1080], [1080, 1080], [1080, 1920]]) for (const pr of ps) for (const tv of ['all', 'none']) {
      const el = document.createElement('div'); el.className = 'slot'; document.getElementById('slots').appendChild(el);
      const x = def.create(el, {width: w, height: hh, instanceId: 'dc', params: {...pr.params, textVisibility: tv}});
      await x.ready;
      const svg = el.querySelector('svg');
      const q = n => svg.querySelector(`[data-node="${n}"]`);
      const both = [], over = [];
      const frames = Math.round(x.durationMs / (1000 / 60));
      x.seek(0);
      const dayMode = x.getState({bounds: false}).semantic.focusTarget === 'replyDay';
      // the context copy of the datum: its value text (the outcome tag, the slip's printed text) and, for a day,
      // the glyph in the calendar
      const ctxEls = () => [...svg.querySelectorAll('[data-node="st-slipout"] text, [data-node="tag-out0"] text'), ...(dayMode ? [q('st-cal-mark')] : [])].filter(Boolean);
      const series = [];
      let bare = 0, bareMax = 0;
      for (let f = 0; f <= frames; f++) {
        const u = f / frames;
        x.seek(u * x.durationMs);
        const ctxCopy = Math.max(0, ...ctxEls().filter(e => (e.textContent || e.tagName !== 'text')).map(eff));
        // the lens copy the viewer READS: the enlarged copy's printed text and the card's values
        const lensTexts = [...svg.querySelectorAll('[data-node="lens-content"] text, [data-node="val-old"] text, [data-node="val-new"] text')].filter(t => (t.textContent || '').trim());
        const lensCopy = Math.max(0, ...lensTexts.map(eff));
        // a window on screen with no legible text in it (a bare card)
        const bgW = q('lens-bg');
        const winOn = bgW && eff(bgW) >= 0.05 && bgW.getBoundingClientRect().width > 2;
        bare = winOn && lensCopy < 0.15 ? bare + 1 : 0;
        bareMax = Math.max(bareMax, bare);
        series.push([ctxCopy, lensCopy]);
        if (ctxCopy >= 0.15 && lensCopy >= 0.15) both.push(u.toFixed(3));
        const bg = q('lens-bg');
        if (eff(bg) >= 0.05) {
          const W = bg.getBoundingClientRect();
          if (W.width > 2) {
            for (const t of svg.querySelectorAll('text')) {
              if (t.closest('[data-node="lens-win"], [data-layer="content-notice"]') || eff(t) < 0.15 || !t.textContent.trim()) continue;
              const b = t.getBoundingClientRect();
              if (b.width < 0.5) continue;
              if (b.left < W.right && b.right > W.left && b.top < W.bottom && b.bottom > W.top) { over.push(`${u.toFixed(3)}:${t.textContent.slice(0, 18)}`); break; }
            }
          }
        }
      }
      // hand-over gaps (ms): open = from the context copy's last legible frame to the lens copy's first; close = from
      // the lens copy's last legible frame to the context copy's first again
      const fm = x.durationMs / frames, L = i => series[i][1] >= 0.15, C = i => series[i][0] >= 0.15;
      const firstL = series.findIndex((_, i) => L(i));
      let gapOpen = 0, gapClose = 0;
      if (firstL >= 0 && C(0)) {
        let lastC = firstL; while (lastC > 0 && !C(lastC)) lastC--;
        gapOpen = Math.round((firstL - lastC - 1) * fm);
        let lastL = firstL; while (lastL + 1 < series.length && L(lastL + 1)) lastL++;
        let back = lastL + 1; while (back < series.length && !C(back)) back++;
        if (back < series.length) gapClose = Math.round((back - lastL - 1) * fm);
      }
      out.push({k: `${pr.name} ${w}x${hh} ${tv}`, tv, both: both.slice(0, 4), over: [...new Set(over)].slice(0, 4), gapOpen, gapClose, bareMs: Math.round(bareMax * fm)});
      x.destroy(); el.remove();
    }
    return out;
  }, [presets]);
  for (const r of res) {
    expect.soft(r.both, `both copies of the changed datum at >= 0.15 [${r.k}]`).toEqual([]);
    expect.soft(r.over, `lens window over visible context text [${r.k}]`).toEqual([]);
    expect.soft(r.gapOpen, `open: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.gapClose, `close: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    if (r.tv === 'all') expect.soft(r.bareMs, `ms of lens window with no legible text (bare card) [${r.k}]`).toBeLessThanOrEqual(200);
  }
});
