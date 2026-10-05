// LAW-0252 — Presentación de demanda · inspect. Contract battery + ID-specific checks.
// acceptanceCheck (brief): the detail keeps its source coordinates (the lens holds a second copy of the stage at the
// SAME coordinates, zoomed from the inspected item), the change is localized (only the stamped reference in its box,
// or only the entry glyph's day) and seeking back restores the previous datum exactly.
// Windows (u): the context stays in place at full size throughout and dims in place while the lens is open · lens
// opens 0.20–0.32 (window, copy text and the card's old value legible from u ≈ 0.256) · strike 0.44–0.49 · lens datum
// 0.48–0.58 · new value 0.555–0.585 (still to 0.66) · text out 0.66–0.68 · lens closes 0.675–0.72 · context change
// 0.74–0.80 · outcome tag (entryDay) 0.74–0.84 · Δ marker and note 0.82–0.88 (hold from 0.88).
// AUTHORING line-109 lens checklist, each as a rendered check below: lens >= 1.5× against the context at rest; lens
// short side >= 0.35 of the frame's short side (and >= 0.45 aimed); one copy of the datum at a time; the lens copy
// text arrives WITH the window; hand-over gaps <= 200 ms on read text; no bare card > 200 ms; no text cut by the rim;
// context >= 0.45 of the frame width and dimmed in place; the lens never over faces or over visible context text.
import {test, expect} from '@playwright/test';
import {contractSuite, presetsFor} from '../harness/contract.js';
import {suppliedTextSuite} from '../harness/supplied-text.js';
import {ratioChecks, times} from '../harness/ratio-checks.js';
import {FACES_CLEAR, CARDS_CLEAR, IN_FRAME, headsAtLeast, tagsBeside, TEXT_OFF_BARS, NEUTRAL_MARKERS, HEADS_OFF_TEXT, textFloorsOverTime, frameShareOverTime, seekIdentity, tagsOffProps, TEXT_LINES_VISIBLE} from './presentacion-demanda-checks.js';

const ID = 'LAW-0252';
const ALT = presetsFor(ID).find(q => q.name === 'contrast-or-alternative').params;
const ALL = [{name: 'default', params: {}}, ...presetsFor(ID)];

contractSuite(ID, {
  semantic: [
    {at: 0.1, fn: "s.lensOpen === 0 && s.datum === 'before' && s.contextDatum === 'before' && s.markerShown === 0 && s.refCtx === 'before'", label: 'context: the state produced by the action, old datum, nothing marked'},
    {at: 0.4, fn: "s.lensOpen === 1 && s.zoom >= 1.5 && s.oldShown === 1 && s.datum === 'before' && s.sourceInContext && s.lensClearOfFaces && s.contextScale === 1 && s.contextDim < 1", label: 'isolate: a real 1.5×+ lens over the dimmed full-size context, old value shown'},
    {at: 0.47, fn: "s.strike > 0 && s.datum === 'before' && s.contextDatum === 'before'", label: 'the old value is struck before anything changes'},
    {at: 0.62, fn: "s.datum === 'after' && s.newShown === 1 && s.strike === 1 && s.contextDatum === 'before' && s.refLens === 'after' && s.refCtx === 'before'", label: 'substitute inside the lens only: the copy carries the new reference, the context is unchanged'},
    {at: 0.74, fn: 's.lensOpen === 0', label: 'the lens has closed before the context changes'},
    {at: 1, fn: "s.contextDatum === 'after' && s.refCtx === 'after' && s.markerShown === 1 && s.noteShown === 1 && s.allReached && s.truncated.length === 0 && s.labelsClear", label: 'return: context updated, Δ marker and before/after note, nothing cut'},
    {at: 0.3, fn: "s.datum === 'before' && s.contextDatum === 'before' && s.strike === 0 && s.newShown === 0", label: 'seeking back restores the old datum exactly'},
    {at: 1, params: ALT, fn: "s.focusTarget === 'entryDay' && s.markIdxCtx === 2 && s.contextDatum === 'after'", label: 'alternative: the entry day moves (Day 2 → Day 3)'},
    {at: 0.3, params: ALT, fn: 's.markIdxCtx === 1', label: 'alternative seeking back: the glyph is on Day 2 again'},
    {at: 0.62, params: {textVisibility: 'none'}, fn: "s.datum === 'after' && s.lensOpen === 1", label: 'labels hidden: the same isolation and substitution'},
  ],
});

suppliedTextSuite(ID, {
  fields: "const day = p.dates.window[Math.max(0, Math.min(p.dates.window.length - 1, p.dates.entryDay))]; return [...p.parties.map(a => a.name), ...p.parties.map(a => a.role), p.documents.caseFile.ref, p.documents.caseFile.title, p.documents.filing.title, p.documents.filing.dated, ...p.dates.window, p.stages.sent, p.labels.calendar, p.labels.intake, p.labels.drafts, p.beforeValue, p.afterValue, p.contextLabels.context, p.contextLabels.marker];",
  captions: "return ['As supplied · no conclusion drawn', 'Según lo aportado · sin conclusión'];",
});

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
// rendered magnification against the context AT REST: the enlarged copy's scale over the context stage's scale
// (the copy is posed at the context's own coordinates inside the zoom group: its scale over the root's scale is the
// magnification against the context at rest)
const ZOOM_VS_REST = `(() => {
  const z = svg.querySelector('[data-node="lens-zoom"]').getScreenCTM().a, c = svg.getScreenCTM().a;
  return z / c >= 1.5 - 1e-3;
})()`;
// rendered: before the substitution beat no stage state reads as the after value — the box never shows the after
// reference, the glyph is not on the after day
const NO_EARLY_AFTER = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { if (e.getAttribute('display') === 'none') return 0; const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const n = svg.querySelector('[data-node="st-lt-refnew"]'), m = svg.querySelector('[data-node="lz-lt-refnew"]');
  return (!n || eff(n) < 0.05) && (!m || eff(m) < 0.05);
})()`;
const TAGS_OFF_PROPS = tagsOffProps(['st-cf', 'st-cal', 'st-tray-back', 'st-tray-front', 'st-letter', 'st-stamp', 'st-pen', 'st-dplate']);
ratioChecks(ID, 'lens checklist, faces, frame, people', [
  {at: times(0.2, 0.74, 0.02), fn: 's.lensClearOfFaces && s.contextScale === 1', label: 'the lens never covers a face; the context stays in place at full size (dimmed while the lens is open)'},
  {at: [0.34, 0.45, 0.55, 0.64], fn: 's.contextDim < 1', label: 'the context is dimmed in place while the lens is open'},
  {at: [0.34, 0.45, 0.55, 0.64], dom: LENS_LARGE, label: 'RENDERED: the open lens window >= 35 % of the frame short side; the context scene >= 45 % of the frame width'},
  {at: [0.34, 0.45, 0.55, 0.64], dom: ZOOM_VS_REST, label: 'RENDERED: magnification >= 1.5× against the context at rest'},
  {at: [0.34, 0.45, 0.55, 0.64], fn: 's.zoom >= 1.5 && s.sourceInContext && s.cardInWindow', label: 'zoom >= 1.5×, source in the context, the datum card wholly in the window'},
  {at: [0.25, 0.34, 0.5, 0.64], fn: 's.guidesOnSource', label: 'guides start on the inspected item'},
  {at: [0.59, 0.62, 0.65], tv: ['all'], fn: 's.newShown === 1 && s.lensOpen === 1', label: 'the new value is still for >= 400 ms'},
  {at: [1], fn: 's.markerClearOfFaces && s.markerShown === 1', label: 'the Δ marker is clear of faces'},
  {at: [0, 0.3, 0.5, 0.65, 1], dom: FACES_CLEAR, label: 'no chip, tag, note or lens covers a head'},
  {at: [0, 0.4, 0.62, 1], tv: ['all'], dom: CARDS_CLEAR, label: 'no card or chip body covers text it does not own'},
  {at: [1], dom: headsAtLeast(36), label: 'people are readable in the context (head >= 36 px at 1080p)'},
  {at: [1], tv: ['all'], dom: tagsBeside(['tag-']), label: 'tags beside their elements (leader <= 40 px), leaders cross no text'},
  {at: [0.1, 1], tv: ['all'], dom: TAGS_OFF_PROPS, label: 'RENDERED: no stage tag intersects any prop or any text (rest and hold)'},
  {at: [0.6, 1], dom: NEUTRAL_MARKERS, label: 'no alarm-coloured markers (the Δ marker is neutral, accent 2)'},
]);
// (dense sampling in separate tests: each ratioChecks test has its own time budget)
ratioChecks(ID, 'text off filler bars', [
  {at: times(0, 1, 0.05), dom: TEXT_OFF_BARS, label: 'no text lands on filler bars'},
]);
ratioChecks(ID, 'dense: in frame and heads off text', [
  {at: times(0, 1, 0.02), dom: IN_FRAME, label: 'nothing leaves the frame at any sampled u (every 0.02: text, props, lens)'},
  {at: times(0, 1, 0.04), dom: HEADS_OFF_TEXT, label: 'RENDERED: no head is drawn over visible text'},
]);
ratioChecks(ID, 'dense: no early after value', [
  {at: times(0, 0.47, 0.01), dom: NO_EARLY_AFTER, label: 'RENDERED: before the substitution beat the after reference is never shown'},
  {at: times(0, 0.47, 0.01), fn: "s.contextDatum === 'before' && s.datum === 'before'", label: 'before the substitution beat: the old datum in the context and in the lens'},
]);

// Rendered, every 20 ms over the lens phase in every preset × ratio × labels: (1) a bare lens card (window visible,
// copy under half opacity) never lasts more than 200 ms; (2) every text in the enlarged copy is wholly inside the
// window or wholly outside it (no line cut by the rim); (3) the guides cross no face and no text.
test(`${ID}: lens — bare card ≤ 200 ms, no text cut by the rim, guides clear (rendered, every 20 ms)`, async ({page}) => {
  test.setTimeout(400000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = presetsFor(ID);
  const res = await page.evaluate(async ([ps, id]) => {
    const def = await window.__lib.load(id);
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
  }, [presets, ID]);
  for (const r of res) {
    expect.soft(r.worst, `bare lens card run (ms) [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.cut, `lens copy text cut by the rim [${r.k}]`).toEqual([]);
    expect.soft(r.cross, `lens guides crossing a face or text [${r.k}]`).toEqual([]);
  }
});

// Rendered at 60 fps over the whole animation in every preset × ratio × labels state (AUTHORING lens checklist,
// LAW-0212 round 4 / LAW-0696): (1) the changed datum is shown in ONE place at a time — its context copy (the stamped
// reference text in the box — reference mode — or the calendar glyph and the outcome tag — entryDay mode) and the lens's copy (the enlarged copy, the datum card) are never
// both at >= 0.15 opacity; (2) the open lens window's box intersects no visible context text (opacity >= 0.15).
test(`${ID}: one copy of the changed datum at a time, hand-over gaps <= 200 ms; the lens lies over no visible context text (rendered, 60 fps)`, async ({page}) => {
  test.setTimeout(600000);
  await page.goto('/tests/harness/host.html');
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  const presets = [{name: 'default', params: {}}, ...presetsFor(ID)];
  const res = await page.evaluate(async ([ps, id]) => {
    const def = await window.__lib.load(id);
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
      const dayMode = x.getState({bounds: false}).semantic.focusTarget === 'entryDay';
      // the context copy of the datum: the stamped reference text in the box (reference), or the outcome tag's day and
      // the glyph in the calendar (entryDay)
      const ctxEls = () => (dayMode ? [...svg.querySelectorAll('[data-node="tag-out0"] text, [data-node="tag-out1"] text'), q('st-cal-mark')] : [...svg.querySelectorAll('[data-node="st-lt-refold"] text, [data-node="st-lt-refnew"] text')]).filter(Boolean);
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
  }, [presets, ID]);
  for (const r of res) {
    expect.soft(r.both, `both copies of the changed datum at >= 0.15 [${r.k}]`).toEqual([]);
    expect.soft(r.over, `lens window over visible context text [${r.k}]`).toEqual([]);
    expect.soft(r.gapOpen, `open: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    expect.soft(r.gapClose, `close: ms with the datum shown nowhere [${r.k}]`).toBeLessThanOrEqual(200);
    if (r.tv === 'all') expect.soft(r.bareMs, `ms of lens window with no legible text (bare card) [${r.k}]`).toBeLessThanOrEqual(200);
  }
});

textFloorsOverTime(ID, {presets: ALL, test, expect});
frameShareOverTime(ID, {presets: ALL, test, expect});
seekIdentity(ID, {presets: ALL, test, expect});

// with only locale "es", every default text is shown in Spanish: no English default remains (review r2)
ratioChecks(ID, 'es locale: Spanish defaults', [
  {at: [0.45, 1], tv: ['all'], presets: ['default'], params: {locale: 'es'}, dom: "(() => { const t = [...svg.querySelectorAll('text')].filter(e => !e.closest('[data-layer=\"content-notice\"]')).map(e => e.textContent).join(' '); return !/\\b(Party|Registry|Day \\d|fictional|Case file|Written|Handed|Registered|Draft|supplied|Reference|Sequence|Filing|Same in|Changed fact|Before|After|Datum)\\b/.test(t) && /Parte A/.test(t); })()", label: 'with only locale "es", every default text is shown in Spanish (no English default remains)'},
]);

// every line of every visible label is drawn whole and on top (review r2: a tray label's second line hid behind the desk)
ratioChecks(ID, 'every label line visible', [
  {at: [0.1, 1], tv: ['all'], dom: TEXT_LINES_VISIBLE, label: 'RENDERED: no line of a visible text is hidden behind a prop, the counter or a person'},
]);

// the changed datum itself is legible and magnified in the lens (review r2: a compact sheet's bars were enlarged instead)
const DATUM_IN_LENS = `(() => {
  const eff = el => { let o = 1; for (let e = el; e && e.tagName !== 'svg'; e = e.parentElement) { const a = e.getAttribute('opacity'); if (a !== null) o *= parseFloat(a); } return o; };
  const vb = svg.viewBox.baseVal, k = svg.getScreenCTM().a * (Math.min(vb.width, vb.height) / 1080);
  const t = [...svg.querySelectorAll('[data-node="lens-content"] text')].filter(e => eff(e) > 0.9 && /REG/.test(e.textContent));
  return t.length > 0 && t.every(e => parseFloat(getComputedStyle(e).fontSize) * e.getScreenCTM().a / k >= 24);
})()`;
ratioChecks(ID, 'datum legible in the lens', [
  {at: [0.4, 0.62], tv: ['all'], presets: ['default', 'baseline-illustrative', 'long-labels-stress', 'baseline-es'], dom: DATUM_IN_LENS, label: 'RENDERED: the stamped reference is printed in the lens copy, >= 24 px at 1080p (magnified, legible)'},
]);
